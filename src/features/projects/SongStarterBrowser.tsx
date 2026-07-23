import { useEffect, useRef, useState } from 'react';
import type { AudioEngine } from '../../domain/audio';
import { applySongStarter, SONG_STARTERS } from '../../domain/music';
import type { Project, ProjectCommand } from '../../domain/music';

interface SongStarterBrowserProps {
  project: Project;
  audioEngine: AudioEngine;
  now: () => string;
  onCommand: (command: ProjectCommand) => void;
}

export function SongStarterBrowser({ project, audioEngine, now, onCommand }: SongStarterBrowserProps) {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const stopTimer = useRef<number | null>(null);

  const clearTimer = () => {
    if (stopTimer.current === null) return;
    window.clearTimeout(stopTimer.current);
    stopTimer.current = null;
  };

  const stopPreview = () => {
    clearTimer();
    audioEngine.stop();
    setPreviewingId(null);
  };

  const togglePreview = async (starterId: string) => {
    if (previewingId === starterId) {
      stopPreview();
      return;
    }

    stopPreview();
    const previewProject = structuredClone(project);
    applySongStarter(previewProject, starterId);
    try {
      const receipt = await audioEngine.playProject(previewProject, 0);
      setPreviewingId(starterId);
      stopTimer.current = window.setTimeout(() => {
        audioEngine.stop();
        stopTimer.current = null;
        setPreviewingId(null);
      }, receipt.durationSeconds * 1_000 + 150);
    } catch {
      setPreviewingId(null);
    }
  };

  useEffect(() => () => {
    clearTimer();
    audioEngine.stop();
  }, [audioEngine]);

  return (
    <section className="song-starter-browser" aria-label="編集可能な既製曲スターター">
      <p className="starter-replace-scope">聴くだけなら現在の曲を変更しません。編集を始めると Melody · Chords · 流れ · Key · BPM を置換し、現在の音色は保持します。</p>
      <div>
        {SONG_STARTERS.map((starter) => {
          const active = project.arrangement.sourceAssetId === `song-starter:${starter.id}`;
          const previewing = previewingId === starter.id;
          return <article data-active={active} data-previewing={previewing} key={starter.id}>
            <div><strong>{starter.title}</strong><span>{starter.bars} bars · {starter.bpm} BPM</span></div>
            <small>{starter.composer} · {starter.key} · {starter.difficulty}</small>
            <p>{starter.summary}</p>
            <div className="starter-flow">{starter.sections.map((section) => <span key={`${starter.id}-${section.label}`}>{section.label}<small>{section.bars}</small></span>)}</div>
            <footer>
              <a href={starter.sourceUrl} target="_blank" rel="noreferrer">{starter.sourceLabel} · {starter.license}</a>
              <div className="starter-card-actions">
                <button type="button" aria-pressed={previewing} onClick={() => void togglePreview(starter.id)}>{previewing ? '■ 停止' : '▶ 聴く'}</button>
                <button type="button" disabled={active} onClick={() => onCommand({ type: 'project/starter-apply', starterId: starter.id, at: now() })}>{active ? '編集中' : 'この曲を編集する'}</button>
              </div>
            </footer>
            <details><summary>出典・表記</summary><p>{starter.attribution}</p></details>
          </article>;
        })}
      </div>
    </section>
  );
}
