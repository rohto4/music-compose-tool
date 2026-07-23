import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { BUILT_IN_AUDIO_ASSETS } from '../../domain/audio';
import type { AudioEngine, BuiltInAssetCategory, UserAudioAssetMetadata } from '../../domain/audio';
import type { Project } from '../../domain/music';
import { beginInsertDrag, endInsertDrag } from '../patterns/insert-drag';

interface AudioPaletteProps {
  project: Project;
  engine: AudioEngine;
  now: () => string;
  targetPhraseIndex: number;
  onAssetToggle: (assetId: string, selected: boolean) => void;
  onPlaceBuiltInAsset: (assetId: string, phraseIndex: number) => void;
  onPlaceUserAsset: (asset: UserAudioAssetMetadata, phraseIndex: number) => void;
}

function secondsLabel(value: number): string {
  return value < 10 ? `${value.toFixed(1)} sec` : `${Math.round(value)} sec`;
}

export function AudioPalette({ project, engine, now, targetPhraseIndex, onAssetToggle, onPlaceBuiltInAsset, onPlaceUserAsset }: AudioPaletteProps) {
  const [auditioning, setAuditioning] = useState<string | null>(null);
  const [userAssets, setUserAssets] = useState<UserAudioAssetMetadata[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [category, setCategory] = useState<BuiltInAssetCategory>(() => BUILT_IN_AUDIO_ASSETS[0]?.category ?? 'chord');
  const [draggingSource, setDraggingSource] = useState<string | null>(null);
  const stopTimer = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void engine.listUserAudio().then((assets) => {
      if (active) setUserAssets(assets);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'User audioの読み込みに失敗しました。');
    });
    return () => {
      active = false;
      if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
    };
  }, [engine]);

  const audition = async (assetId: string, label: string) => {
    setError(null);
    setMessage(null);
    try {
      const receipt = await engine.audition(assetId);
      setAuditioning(assetId);
      setMessage(`試聴中: ${label}`);
      if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
      stopTimer.current = window.setTimeout(() => setAuditioning(null), receipt.durationSeconds * 1_000 + 150);
    } catch (reason) {
      setAuditioning(null);
      setError(reason instanceof Error ? reason.message : '試聴を開始できませんでした。');
    }
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const asset = await engine.importUserAudio(file, now());
      setUserAssets(await engine.listUserAudio());
      onAssetToggle(asset.id, true);
      setMessage(`${asset.name} をprivate assetとして追加しました。`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Audio fileを追加できませんでした。');
    } finally {
      setImporting(false);
    }
  };
  const categories = [...new Set(BUILT_IN_AUDIO_ASSETS.map((asset) => asset.category))];
  const visibleAssets = BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === category);
  const categoryColor = (value: BuiltInAssetCategory) => BUILT_IN_AUDIO_ASSETS.find((asset) => asset.category === value)?.color ?? '#f1cc54';

  return (
    <section className="audio-palette" aria-labelledby="audio-palette-title">
      <header className="palette-heading">
        <h2 className="visually-hidden" id="audio-palette-title">音のピースを挿入</h2>
        <span className="insert-shelf-mark"><span>SOUND PIECES</span><strong>音色を4小節へ割り当て</strong></span>
        <strong className="palette-target">PHRASE {String(targetPhraseIndex + 1).padStart(2, '0')}</strong>
        <div className="palette-actions">
          <button className="button" type="button" onClick={() => fileInput.current?.click()} disabled={importing}>{importing ? '解析中…' : 'WAV / MP3を追加'}</button>
          <input ref={fileInput} className="visually-hidden" type="file" accept=".wav,.mp3,audio/wav,audio/mpeg" aria-label="WAV / MP3ファイル" onChange={(event) => void importFile(event)} />
        </div>
      </header>
      {(message || error) && <div className={`palette-message ${error ? 'is-error' : ''}`} role="status">{error ?? message}</div>}
      <nav className="asset-category-filter" aria-label="音色カテゴリ" style={{ '--category-color': categoryColor(category) } as CSSProperties}>
        {categories.map((value) => <button type="button" style={{ '--tab-color': categoryColor(value) } as CSSProperties} aria-current={category === value ? 'page' : undefined} onClick={() => setCategory(value)} key={value}>{value.toUpperCase()} <small>{BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === value).length}</small></button>)}
      </nav>
      <div className="asset-grid" style={{ '--category-color': categoryColor(category) } as CSSProperties}>
        {visibleAssets.map((asset) => {
          const selected = project.assetRefs.includes(asset.id);
          return (
            <article
              className="asset-card insertable-item"
              data-selected={selected}
              data-insertable="true"
              data-dragging={draggingSource === asset.id}
              draggable
              onDragStart={(event) => { beginInsertDrag(event.dataTransfer, { kind: 'asset', assetId: asset.id, label: asset.name }); setDraggingSource(asset.id); }}
              onDragEnd={() => { endInsertDrag(); setDraggingSource(null); }}
              style={{ '--asset-color': asset.color } as CSSProperties}
              key={asset.id}
            >
              <span className="asset-category">{asset.category.toUpperCase()}</span>
              <strong>{asset.name}</strong>
              <p>{asset.description}</p>
              <div className="asset-card-actions">
                <button className="audition-button" type="button" onClick={() => void audition(asset.id, asset.name)} aria-pressed={auditioning === asset.id}>
                  {auditioning === asset.id ? '■ 試聴中' : '▶ 試聴'}
                </button>
                <button className="select-asset-button" type="button" onClick={() => onPlaceBuiltInAsset(asset.id, targetPhraseIndex)}>{selected ? '再配置' : '4小節へ挿入'}</button>
              </div>
            </article>
          );
        })}
      </div>

      {userAssets.length > 0 && (
        <section className="user-audio-library" aria-labelledby="user-audio-title">
          <div className="panel-heading"><span className="section-index">U</span><h2 id="user-audio-title">追加した音</h2></div>
          <div className="user-audio-list">
            {userAssets.map((asset) => {
              const selected = project.assetRefs.includes(asset.id);
              return (
                <article
                  className="insertable-item"
                  data-insertable="true"
                  data-dragging={draggingSource === asset.id}
                  draggable
                  onDragStart={(event) => { beginInsertDrag(event.dataTransfer, { kind: 'user-audio', assetId: asset.id, label: asset.name }); setDraggingSource(asset.id); }}
                  onDragEnd={() => { endInsertDrag(); setDraggingSource(null); }}
                  key={asset.id}
                >
                  <div><strong>{asset.name}</strong><span>{secondsLabel(asset.durationSeconds)} · {Math.round(asset.sampleRate / 100) / 10} kHz · {asset.channels === 1 ? 'mono' : 'stereo'}</span></div>
                  <span className="private-label">PRIVATE / USER OWNED</span>
                  <button className="button" type="button" onClick={() => void audition(asset.id, asset.name)}>▶ 試聴</button>
                  <button className="button" type="button" onClick={() => onAssetToggle(asset.id, !selected)}>{selected ? '外す' : '使う'}</button>
                  <button className="button button-primary" type="button" onClick={() => { onPlaceUserAsset(asset, targetPhraseIndex); setMessage(`${asset.name}をPHRASE ${targetPhraseIndex + 1}へ配置しました。`); }}>4小節へ配置</button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
