import { useEffect, useMemo, useRef, useState } from 'react';
import { browserAudioEngine } from '../../adapters/audio/web-audio-engine';
import type { AudioEngine } from '../../domain/audio';
import {
  HERO_KITS,
  KASANE_MOVES,
  KASANE_ROLES,
  KASANE_SCENES,
  commitComposition,
  createCompositionHistory,
  createCompositionState,
  materializeCompositionProject,
  previewSceneMove,
  rejectSceneMove,
  selectScene,
  selectedHeroKit,
  selectedScene,
  switchHeroKit,
  undoComposition,
} from '../../domain/kasane';
import type { CompositionHistory, KasaneMoveId, KasaneRole, KasaneSceneId } from '../../domain/kasane';
import './kasane.css';

type DeskAudioEngine = Pick<AudioEngine, 'playProject' | 'stop'>;

export interface KasaneCompositionDeskProps {
  audioEngine?: DeskAudioEngine;
}

const ROLE_LABELS: Record<KasaneRole, string> = {
  lead: 'LEAD',
  harmony: 'HARMONY',
  bass: 'BASS',
  rhythm: 'RHYTHM',
  texture: 'TEXTURE',
};

function moveLabel(moveId: KasaneMoveId | null): string {
  return KASANE_MOVES.find((candidate) => candidate.id === moveId)?.label ?? 'KEEP';
}

function roleActivity(role: KasaneRole, energy: number, moveId: KasaneMoveId | null): number {
  let value = energy;
  if (moveId === 'strip') value *= role === 'lead' ? .9 : role === 'harmony' ? .58 : .42;
  if (moveId === 'bounce' && (role === 'bass' || role === 'rhythm')) value = Math.min(1, value + .18);
  if (moveId === 'lift' && (role === 'lead' || role === 'harmony' || role === 'texture')) value = Math.min(1, value + .16);
  if (moveId === 'answer' && role === 'lead') value = Math.min(1, value + .14);
  if (moveId === 'break') value *= role === 'texture' ? .9 : .28;
  return Math.max(.12, Math.min(1, value));
}

export function KasaneCompositionDesk({ audioEngine = browserAudioEngine }: KasaneCompositionDeskProps) {
  const [history, setHistory] = useState<CompositionHistory>(() => createCompositionHistory(createCompositionState('candy-skyline')));
  const [audition, setAudition] = useState<'before' | 'variation'>('before');
  const [playing, setPlaying] = useState<'scene' | 'all' | null>(null);
  const [status, setStatus] = useState('Dropを選択中。Hero Kitの基準sceneを聴けます。');
  const [error, setError] = useState<string | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackRequest = useRef(0);
  const state = history.present;
  const kit = selectedHeroKit(state);
  const currentScene = selectedScene(state);
  const activePreview = state.previewMoveId && state.previewSceneId === state.selectedSceneId ? state.previewMoveId : null;

  const clearPlayback = () => {
    playbackRequest.current += 1;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = null;
    audioEngine.stop();
    setPlaying(null);
  };

  useEffect(() => () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    audioEngine.stop();
  }, [audioEngine]);

  const sceneMove = useMemo(() => ({
    ...state.committedMoves,
    ...(activePreview && audition === 'variation' ? { [state.selectedSceneId]: activePreview } : {}),
  }), [activePreview, audition, state.committedMoves, state.selectedSceneId]);

  const chooseKit = (kitId: typeof state.kitId) => {
    clearPlayback();
    setHistory((current) => createCompositionHistory(switchHeroKit(current.present, kitId)));
    setAudition('before');
    setError(null);
    const next = HERO_KITS.find((candidate) => candidate.id === kitId);
    setStatus(`${next?.name ?? 'Hero Kit'}へ切替。5 roleを調律済みの一式として読み込みました。`);
  };

  const chooseScene = (sceneId: KasaneSceneId) => {
    clearPlayback();
    setHistory((current) => ({ ...current, present: selectScene(current.present, sceneId) }));
    setAudition('before');
    setError(null);
    const next = KASANE_SCENES.find((candidate) => candidate.id === sceneId);
    setStatus(`${next?.label ?? 'Scene'}を選択。Moveはこの4小節だけへ作用します。`);
  };

  const previewMove = (moveId: KasaneMoveId) => {
    setHistory((current) => ({ ...current, present: previewSceneMove(current.present, current.present.selectedSceneId, moveId) }));
    setAudition('variation');
    setError(null);
    setStatus(`${moveLabel(moveId)}を${currentScene.label}へpreview。Project revisionはまだ変わっていません。`);
  };

  const rejectVariation = () => {
    setHistory((current) => ({ ...current, present: rejectSceneMove(current.present) }));
    setAudition('before');
    setStatus(`${currentScene.label}のvariationを破棄。committed sceneへ戻りました。`);
  };

  const keepChange = () => {
    const move = state.previewMoveId;
    setHistory((current) => commitComposition(current));
    setAudition('before');
    if (move) setStatus(`${moveLabel(move)}を${currentScene.label}へcommit。1回のUNDOで戻せます。`);
  };

  const undo = () => {
    clearPlayback();
    setHistory((current) => undoComposition(current));
    setAudition('before');
    setStatus('最後のScene MoveをUNDO。beforeの曲へ戻りました。');
  };

  const play = async (scope: 'scene' | 'all') => {
    clearPlayback();
    const request = playbackRequest.current;
    setError(null);
    const includePreview = audition === 'variation' && Boolean(activePreview);
    const project = materializeCompositionProject(state, includePreview);
    const startTick = scope === 'scene' ? currentScene.startBar * 4 * 480 : 0;
    try {
      await audioEngine.playProject(project, startTick);
      if (request !== playbackRequest.current) return;
      setPlaying(scope);
      const beats = scope === 'scene' ? currentScene.bars * 4 : KASANE_SCENES.length * 16;
      stopTimer.current = setTimeout(() => {
        audioEngine.stop();
        setPlaying(null);
        setStatus(`${scope === 'scene' ? currentScene.label : kit.name}の再生が終了しました。`);
      }, beats * 60 / kit.bpm * 1_000 + 180);
      setStatus(`${scope === 'scene' ? currentScene.label : kit.name}を${includePreview ? 'VARIATION' : 'BEFORE'}で再生中。`);
    } catch (reason) {
      if (request !== playbackRequest.current) return;
      setPlaying(null);
      setError(reason instanceof Error ? reason.message : 'Web Audioを開始できませんでした。');
    }
  };

  return (
    <main className="kasane-desk" aria-label="KASANE Composition Desk" style={{ '--kit-accent': kit.accent } as React.CSSProperties}>
      <a className="kasane-skip" href="#kasane-canvas">制作面へ移動</a>
      <header className="kasane-topbar">
        <div className="kasane-brand" aria-label="KASANE">
          <span className="kasane-brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>KASANE</span>
          <small>COMPOSITION INSTRUMENT</small>
        </div>
        <div className="kasane-project-meta">
          <span>{kit.edition}</span>
          <b>UNTITLED / 01</b>
          <span className="kasane-revision">REV {String(state.revision).padStart(2, '0')}</span>
        </div>
        <div className="kasane-transport" aria-label="Transport">
          <button type="button" className="ks-button ks-play" onClick={() => void play('scene')} aria-pressed={playing === 'scene'}>PLAY SCENE</button>
          <button type="button" className="ks-button" onClick={() => void play('all')} aria-pressed={playing === 'all'}>PLAY ALL</button>
          <button type="button" className="ks-button ks-stop" onClick={() => { clearPlayback(); setStatus('再生を停止。選択位置は保持しています。'); }}>STOP</button>
        </div>
        <div className="kasane-local"><span aria-hidden="true" /> BUILT-IN / LOCAL</div>
      </header>

      <section className="kasane-worktop" id="kasane-canvas">
        <aside className="kit-bank" aria-label="Hero Kit bank">
          <div className="ks-section-label"><span>01</span><b>CHOOSE A WORLD</b></div>
          <div className="kit-stack">
            {HERO_KITS.map((candidate, index) => (
              <button
                type="button"
                className="kit-card"
                aria-label={`${candidate.name} Hero Kit`}
                aria-pressed={candidate.id === kit.id}
                onClick={() => chooseKit(candidate.id)}
                key={candidate.id}
              >
                <span className="kit-index">0{index + 1}</span>
                <span className="kit-card-copy"><strong>{candidate.name}</strong><small>{candidate.traits.join(' / ')}</small></span>
                <span className="kit-signal" aria-hidden="true"><i /><i /><i /><i /></span>
              </button>
            ))}
          </div>
          <div className="kit-promise">
            <span>CURATED AS ONE</span>
            <p>{kit.promise}</p>
          </div>
        </aside>

        <section className="composition-canvas" aria-label="Living Score">
          <header className="canvas-heading">
            <div>
              <p>{kit.edition} · HERO KIT</p>
              <h1>{kit.name}</h1>
            </div>
            <div className="song-coordinates" aria-label="Song coordinates">
              <span>{kit.bpm} BPM</span>
              <span>{kit.key}</span>
              <span>4 / 4</span>
              <span>20 BARS</span>
            </div>
          </header>

          <div className="scene-rail" aria-label="Scenes">
            {KASANE_SCENES.map((item) => {
              const committed = state.committedMoves[item.id];
              return (
                <button
                  type="button"
                  className="scene-tab"
                  aria-label={`${item.label} scene`}
                  aria-pressed={item.id === state.selectedSceneId}
                  onClick={() => chooseScene(item.id)}
                  key={item.id}
                  style={{ '--scene-energy': item.energy } as React.CSSProperties}
                >
                  <span className="scene-number">{String(item.startBar + 1).padStart(2, '0')}—{String(item.startBar + item.bars).padStart(2, '0')}</span>
                  <strong>{item.label}</strong>
                  <small>{item.cue}</small>
                  <span className="energy-meter" aria-label={`energy ${Math.round(item.energy * 100)}`}><i /></span>
                  {committed && <span className="scene-commit" data-committed-move>{moveLabel(committed)}</span>}
                </button>
              );
            })}
          </div>

          <div className="role-weave" role="table" aria-label="Role weave">
            {KASANE_ROLES.map((role) => (
              <div className="role-row" role="row" aria-label={`${ROLE_LABELS[role]} role`} key={role} style={{ '--role-color': kit.roles[role].color } as React.CSSProperties}>
                <div className="role-identity" role="rowheader">
                  <span>{ROLE_LABELS[role]}</span>
                  <strong>{kit.roles[role].name}</strong>
                  <small>{kit.roles[role].pattern}</small>
                </div>
                <div className="role-cells" role="presentation">
                  {KASANE_SCENES.map((item) => {
                    const activeMove = sceneMove[item.id];
                    const activity = roleActivity(role, item.energy, activeMove);
                    return (
                      <div
                        className="role-cell"
                        role="cell"
                        aria-label={`${item.label} ${ROLE_LABELS[role]} ${Math.round(activity * 100)} percent ${moveLabel(activeMove)}`}
                        data-selected={item.id === state.selectedSceneId}
                        data-preview={item.id === state.previewSceneId && Boolean(activePreview)}
                        style={{
                          '--bar-a': `${Math.round(22 + activity * 55)}%`,
                          '--bar-b': `${Math.round(12 + activity * 36)}%`,
                          '--bar-c': `${Math.round(30 + activity * 62)}%`,
                          '--bar-d': `${Math.round(16 + activity * 46)}%`,
                        } as React.CSSProperties}
                        key={item.id}
                      >
                        <i /><i /><i /><i /><i /><i />
                        <span>{activeMove ? moveLabel(activeMove) : 'BASE'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <footer className="canvas-foot">
            <span>EDITABLE NOTES</span><span>SCENE-SCOPED</span><span>NO NETWORK</span>
            <span className="canvas-time">{currentScene.label.toUpperCase()} / BAR {String(currentScene.startBar + 1).padStart(2, '0')}</span>
          </footer>
        </section>

        <aside className="move-deck" aria-label="Scene Move Deck">
          <div className="ks-section-label"><span>02</span><b>SHAPE THIS SCENE</b></div>
          <div className="scope-readout">
            <small>TARGET LOCKED</small>
            <strong>{currentScene.label}</strong>
            <span>BARS {currentScene.startBar + 1}—{currentScene.startBar + currentScene.bars} · ALL ROLES</span>
          </div>

          <div className="ab-switch" aria-label="Audition source">
            <button type="button" aria-pressed={audition === 'before'} onClick={() => setAudition('before')}>BEFORE</button>
            <button type="button" aria-pressed={audition === 'variation'} disabled={!activePreview} onClick={() => setAudition('variation')}>VARIATION</button>
          </div>

          <div className="move-grid">
            {KASANE_MOVES.map((candidate, index) => (
              <button
                type="button"
                className="move-card"
                aria-label={`${candidate.label} move`}
                aria-pressed={activePreview === candidate.id}
                onClick={() => previewMove(candidate.id)}
                key={candidate.id}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{candidate.label}</strong>
                <small>{candidate.description}</small>
              </button>
            ))}
          </div>

          <div className="move-contract">
            <span>PRESERVE</span>
            <ul><li>scene length</li><li>key + chord identity</li><li>other scenes</li><li>loudness reference</li></ul>
          </div>

          <div className="move-actions">
            <button type="button" className="ks-keep" disabled={!activePreview} onClick={keepChange}>KEEP CHANGE</button>
            <button type="button" className="ks-reject" disabled={!activePreview} onClick={rejectVariation}>REJECT VARIATION</button>
            <button type="button" className="ks-undo" disabled={history.past.length === 0} onClick={undo}>UNDO LAST CHANGE</button>
          </div>
        </aside>
      </section>

      <footer className="kasane-statusbar">
        <span className="status-led" data-playing={Boolean(playing)} aria-hidden="true" />
        {error ? <span role="alert">{error} — 編集stateは保持されています。</span> : <span role="status">{status}</span>}
        <span className="status-mode">{audition.toUpperCase()} · {activePreview ? moveLabel(activePreview) : moveLabel(state.committedMoves[state.selectedSceneId])}</span>
      </footer>
    </main>
  );
}
