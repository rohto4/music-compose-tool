import { useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { findBuiltInAudioAsset } from '../../domain/audio';
import { PPQ } from '../../domain/music';
import type { ArrangementSection, Project, ProjectCommand } from '../../domain/music';
import { ARRANGEMENT_TEMPLATES, materializeArrangementTemplate, SECTION_TEMPLATES } from './arrangement-templates';

interface ArrangementEditorProps {
  project: Project;
  now: () => string;
  onCommand: (command: ProjectCommand) => void;
}

type WithoutAt<T> = T extends { at: string } ? Omit<T, 'at'> : never;
type ProjectCommandWithoutAt = WithoutAt<ProjectCommand>;

function movedIndex(current: number, direction: -1 | 1, length: number): number {
  return Math.max(0, Math.min(length - 1, current + direction));
}

export function ArrangementEditor({ project, now, onCommand }: ArrangementEditorProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const sections = project.arrangement.sections;
  const dispatch = (command: ProjectCommandWithoutAt) => onCommand({ ...command, at: now() });
  const activeArrangementAsset = ARRANGEMENT_TEMPLATES.find((asset) => asset.id === project.arrangement.sourceAssetId);
  const selectedArrangementAssetId = activeArrangementAsset?.id ?? 'custom';

  const replaceArrangement = (assetId: string) => {
    const asset = ARRANGEMENT_TEMPLATES.find((candidate) => candidate.id === assetId);
    if (!asset) return;
    dispatch({ type: 'arrangement/replace', sections: materializeArrangementTemplate(asset), sourceAssetId: asset.id });
  };

  const addSection = (template: typeof SECTION_TEMPLATES[number]) => {
    const count = sections.filter((section) => section.role === template.role).length + 1;
    const idSuffix = now().replace(/\D/g, '').slice(-12);
    const section: ArrangementSection = {
      id: `section-${template.role}-${idSuffix}-${count}`,
      role: template.role,
      label: count === 1 ? template.label : `${template.label} ${count}`,
      startBar: 0,
      bars: 4,
      energyStart: template.energyStart,
      energyEnd: template.energyEnd,
      transitionAssetId: template.role === 'build' ? 'transition-soft-rise' : null,
    };
    dispatch({ type: 'arrangement/section-add', section, toIndex: sections.length });
    setAddingSection(false);
  };

  const dropSection = (event: DragEvent<HTMLElement>, toIndex: number) => {
    event.preventDefault();
    const sectionId = event.dataTransfer.getData('text/section-id') || dragging;
    setDragging(null);
    setDropTarget(null);
    if (sectionId) dispatch({ type: 'arrangement/reorder', sectionId, toIndex });
  };

  const enterSection = (event: DragEvent<HTMLElement>, toIndex: number) => {
    if (!dragging) return;
    setDropTarget(sections[toIndex]?.id ?? null);
    const fromIndex = sections.findIndex((section) => section.id === dragging);
    if (fromIndex < 0 || fromIndex === toIndex) return;
    event.preventDefault();
    dispatch({ type: 'arrangement/reorder', sectionId: dragging, toIndex });
  };

  return (
    <section className="arrangement-editor" aria-labelledby="arrangement-editor-title">
      <header className="arrangement-heading">
        <h2 id="arrangement-editor-title">曲の流れ</h2>
        <div className="arrangement-flow-picker">
          <label><span>FLOW ASSET</span><select aria-label="展開アセットを選ぶ" value={selectedArrangementAssetId} onChange={(event) => replaceArrangement(event.target.value)}><option value="custom">カスタム（現在の展開）</option>{ARRANGEMENT_TEMPLATES.map((asset) => <option value={asset.id} key={asset.id}>{asset.name}</option>)}</select></label>
          <small>{activeArrangementAsset?.summary ?? 'sectionを自由に編集できます'}</small>
        </div>
        <span>{sections.reduce((total, section) => total + section.bars, 0)} BARS</span>
      </header>
      <div className="arrangement-direction" aria-label="曲は左から右へ順番に再生されます"><strong>START</strong><span>左から右へ順番に再生</span><b aria-hidden="true">━━━━━━━━━▶</b><strong>END</strong></div>

      <div className="arrangement-section-list" aria-label="左から右へ並ぶ曲の流れ">
        {sections.map((section, index) => (
          <div className="arrangement-flow-step" key={section.id}>
          <article
            className={`arrangement-section-card role-${section.role}`}
            data-section-id={section.id}
            data-dragging={dragging === section.id}
            data-drop-target={dropTarget === section.id && dragging !== section.id}
            draggable
            onDragStart={(event) => { setDragging(section.id); setDropTarget(null); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/section-id', section.id); }}
            onDragEnd={() => { setDragging(null); setDropTarget(null); }}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={(event) => enterSection(event, index)}
            onDrop={(event) => dropSection(event, index)}
          >
            <div className="section-card-top"><span>STEP {String(index + 1).padStart(2, '0')}</span><span className="drag-label">DRAG</span></div>
            <strong>{section.label}</strong>
            <div className="section-controls">
              <label><span>長さ</span><select aria-label={`${section.label}の長さ`} value={section.bars} onChange={(event) => dispatch({ type: 'arrangement/section-update', sectionId: section.id, patch: { bars: Number(event.target.value) } })}>{![2, 4, 6, 8, 12, 16].includes(section.bars) && <option value={section.bars}>{section.bars} bars</option>}<option value={2}>2 bars</option><option value={4}>4 bars</option><option value={6}>6 bars</option><option value={8}>8 bars</option><option value={12}>12 bars</option><option value={16}>16 bars</option></select></label>
              <label><span>Energy</span><input aria-label={`${section.label}のenergy`} type="range" min={0} max={1} step={.05} value={section.energyEnd} onChange={(event) => dispatch({ type: 'arrangement/section-update', sectionId: section.id, patch: { energyEnd: Number(event.target.value) } })} /></label>
              <label><span>Transition</span><select aria-label={`${section.label}のtransition`} value={section.transitionAssetId ?? ''} onChange={(event) => dispatch({ type: 'arrangement/section-update', sectionId: section.id, patch: { transitionAssetId: event.target.value || null } })}><option value="">なし</option><option value="transition-soft-rise">Soft Rise</option></select></label>
            </div>
            <div className="section-card-actions">
              <button type="button" aria-label={`${section.label}を前へ`} disabled={index === 0} onClick={() => dispatch({ type: 'arrangement/reorder', sectionId: section.id, toIndex: movedIndex(index, -1, sections.length) })}>←</button>
              <button type="button" aria-label={`${section.label}を後へ`} disabled={index === sections.length - 1} onClick={() => dispatch({ type: 'arrangement/reorder', sectionId: section.id, toIndex: movedIndex(index, 1, sections.length) })}>→</button>
              <button type="button" aria-label={`${section.label}を削除`} disabled={sections.length === 1} onClick={() => dispatch({ type: 'arrangement/section-remove', sectionId: section.id })}>削除</button>
            </div>
          </article>
          <span className="arrangement-flow-arrow" aria-hidden="true"><b>→</b><small>NEXT</small></span>
          </div>
        ))}
        <aside className="arrangement-add-card" data-open={addingSection} aria-label="曲の流れの末尾へ追加">
          <button className="arrangement-add-trigger" type="button" aria-expanded={addingSection} onClick={() => setAddingSection((current) => !current)}><span aria-hidden="true">＋</span><strong>流れを追加</strong><small>末尾へsectionを足す</small></button>
          {addingSection && <div className="arrangement-add-options" aria-label="追加するsectionを選ぶ">{SECTION_TEMPLATES.map((template) => <button type="button" aria-label={`${template.label}を追加`} onClick={() => addSection(template)} key={template.role}><span>{template.label}</span><small>{template.role.toUpperCase()}</small></button>)}</div>}
        </aside>
      </div>
      <p className="arrangement-drag-status" role="status">{dragging ? `${sections.find((section) => section.id === dragging)?.label ?? 'Section'}をつかんでいます。浮き上がった移動先で離してください。` : 'DRAG表示のあるsectionは、つかんで並べ替えられます。'}</p>

      <BlockLaneBoard project={project} now={now} onCommand={onCommand} />
    </section>
  );
}

function BlockLaneBoard({ project, now, onCommand }: ArrangementEditorProps) {
  const selectedAssets = project.assetRefs.map(findBuiltInAudioAsset).filter((asset) => asset !== undefined);
  const uniqueAssets = selectedAssets.filter((asset, index) => selectedAssets.findIndex((candidate) => candidate.trackRole === asset.trackRole) === index);
  const columnStyle = { '--section-count': project.arrangement.sections.length } as CSSProperties;

  if (uniqueAssets.length === 0) {
    return <div className="block-board-empty"><strong>先に「音を組む」で使う音を選びます。</strong><span>選んだ音はMain / Sub laneへsection単位で配置できます。</span></div>;
  }

  return (
    <section className="block-lane-board" aria-labelledby="block-lane-title">
      <div className="panel-heading block-lane-heading"><span className="section-index">02</span><div><h2 id="block-lane-title">セクションごとの音</h2><p>「音を組む」で選んだ音を、曲のどの区間で鳴らすか決めます。空欄の＋で配置、もう一度押すと外せます。</p></div></div>
      <div className="block-lane-legend" aria-label="レーンの意味"><span><b>主役 · MAIN</b>その区間の中心として鳴らす</span><span><b>重ね · SUB</b>厚みや変化として重ねる</span></div>
      <div className="lane-scroll">
        <div className="lane-grid lane-grid-header" style={columnStyle}><span>選んだ音 / 役割</span>{project.arrangement.sections.map((section) => <strong key={section.id}>{section.label}<small>{section.bars} bars</small></strong>)}</div>
        {uniqueAssets.map((asset) => {
          const track = project.tracks.find((candidate) => candidate.role === asset.trackRole);
          if (!track) return null;
          return (
            <section className="track-lane-group" key={asset.id}>
              {track.lanes.filter((lane) => lane.role === 'main' || lane.role === 'sub').map((lane, laneIndex) => (
                <div className="lane-grid" style={columnStyle} key={lane.id}>
                  <div className="lane-name" style={{ '--asset-color': asset.color } as CSSProperties}><strong>{laneIndex === 0 ? asset.name : ''}</strong><span>{lane.role === 'main' ? '主役 · MAIN' : '重ね · SUB'} / {track.name}</span></div>
                  {project.arrangement.sections.map((section) => {
                    const block = lane.blocks.find((candidate) => candidate.parentBlockId === section.id && candidate.assetId === asset.id);
                    const label = `${track.name} ${lane.name} / ${section.label}へ${block ? '配置を解除' : '配置'}`;
                    return (
                      <button className="block-cell" data-filled={Boolean(block)} type="button" aria-label={label} key={section.id} onClick={() => {
                        if (block) onCommand({ type: 'block/remove', trackId: track.id, laneId: lane.id, blockId: block.id, at: now() });
                        else onCommand({ type: 'block/add', trackId: track.id, laneId: lane.id, block: { id: `block-${asset.id}-${lane.id}-${section.id}`, assetId: asset.id, startTick: section.startBar * 4 * PPQ, durationTick: section.bars * 4 * PPQ, granularity: 'draft', parentBlockId: section.id }, at: now() });
                      }}>
                        {block ? <><span>{asset.name}</span><small>{lane.role === 'main' ? '主役 · MAIN' : '重ね · SUB'}</small></> : <><span aria-hidden="true">＋</span><small>ここで鳴らす</small></>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </section>
  );
}
