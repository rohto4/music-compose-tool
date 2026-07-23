import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { BUILT_IN_AUDIO_ASSETS } from '../../domain/audio';
import { PPQ, chordPatternRanges, materializeChordPatternNotes } from '../../domain/music';
import type { AutomationParameter, AutomationPoint, NoteEvent, Project, ProjectCommand, Track, TrackRole } from '../../domain/music';
import { SHORTCUT_COMMAND_EVENT, shortcutCommandId } from '../../application/shortcuts/shortcut-registry';

interface DawMelodyEditorProps {
  project: Project;
  now: () => string;
  onCommand: (command: ProjectCommand) => void;
  playing: boolean;
  playbackMessage: string | null;
  playbackStartTick?: number;
  playbackStartedAt?: number | null;
  onTogglePlayback: (startTick?: number) => void;
  onAuditionAsset: (assetId: string, label: string) => Promise<void>;
  onAuditionNotes: (trackId: string, noteIds: string[], label: string) => Promise<void>;
}

const PIANO_MIN = 21;
const PIANO_MAX = 108;
const PIANO_INITIAL_TOP = 84;
const DEFAULT_WIDTH = 1120;
const ROW_HEIGHT = 18;
const BEAT_WIDTH = 84;
const GRID_OPTIONS = [PPQ / 2, PPQ / 4, PPQ / 6, PPQ / 8] as const;
const AUTOMATION_PARAMETERS: AutomationParameter[] = ['volume', 'pan', 'filter', 'reverb', 'delay', 'sidechain'];
const FX_PARAMETERS = ['filter', 'reverb', 'delay', 'sidechain'] as const;
const ADDABLE_TRACKS: Array<{ role: Exclude<TrackRole, 'melody' | 'reference' | 'audio'>; label: string; color: string; instrumentId: string }> = [
  { role: 'lead', label: 'Lead', color: '#d2b9ef', instrumentId: 'cloud-lead' },
  { role: 'synth', label: 'Synth', color: '#efb5ae', instrumentId: 'glass-pluck' },
  { role: 'pad', label: 'Pad', color: '#b9d3ef', instrumentId: 'pastel-pad' },
  { role: 'arp', label: 'Arp', color: '#d8e99e', instrumentId: 'pixel-arp' },
  { role: 'percussion', label: 'Percussion', color: '#e7c3a6', instrumentId: 'tiny-perc' },
  { role: 'fx', label: 'FX', color: '#c5c7ed', instrumentId: 'sparkle-fx' },
];
const DAW_GUIDE_STEPS = [
  { target: 'transport', title: '再生', body: '再生位置はタイムラインで決めます。再生、停止、先頭へ戻る操作をここへまとめています。' },
  { target: 'timeline', title: 'タイムライン', body: '小節上をクリックして再生位置を移動します。再生中も同じ場所をクリックすると、そこから鳴り直します。' },
  { target: 'score', title: 'ピアノロール', body: '空白をドラッグして範囲選択、音符の中央をドラッグして移動、右端をドラッグして長さを変えます。' },
  { target: 'tracks', title: 'トラック', body: '編集する楽器を切り替えます。色は楽譜上の役割と対応します。' },
  { target: 'mixer', title: 'ミキサー', body: '音色、音量、Pan、Mute、Solo、FXは下部のチャンネルへまとめています。' },
] as const;

function noteName(pitch: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[((pitch % 12) + 12) % 12]}${Math.floor(pitch / 12) - 1}`;
}

function isBlackPianoKey(pitch: number): boolean {
  return [1, 3, 6, 8, 10].includes(((pitch % 12) + 12) % 12);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function DawMelodyEditor({ project, now, onCommand, playing, playbackMessage, playbackStartTick = 0, playbackStartedAt = null, onTogglePlayback, onAuditionAsset, onAuditionNotes }: DawMelodyEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pianoRollScrollRef = useRef<HTMLDivElement | null>(null);
  const pianoRollViewportRef = useRef<HTMLDivElement | null>(null);
  const guideDialogRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ mode: 'move' | 'resize'; ids: string[]; originX: number; originY: number; notes: NoteEvent[] } | null>(null);
  const marqueeRef = useRef<{ originX: number; originY: number; additiveIds: string[]; selectedIds: string[] } | null>(null);
  const clipboardRef = useRef<NoteEvent[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [, setDragGesture] = useState<{ mode: 'move' | 'resize'; count: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ deltaTick: number; deltaPitch: number } | null>(null);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [grid, setGrid] = useState<number>(PPQ / 4);
  const [zoom, setZoom] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(DEFAULT_WIDTH);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollMax, setScrollMax] = useState(0);
  const [velocity, setVelocity] = useState(100);
  const [clipboard, setClipboard] = useState<NoteEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [playheadTick, setPlayheadTick] = useState(0);
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(project.loop.enabled);
  const [editTrackId, setEditTrackId] = useState(project.melody.trackId);
  const [editLaneId, setEditLaneId] = useState(project.melody.laneId);
  const automationSequenceRef = useRef(0);
  const midiActiveRef = useRef<Map<string, Array<{ noteId: string; startTick: number; startedAtMs: number }>>>(new Map());
  const midiOriginRef = useRef<number | null>(null);
  const midiSequenceRef = useRef(0);
  const midiHandlersRef = useRef<Map<MIDIInput, (event: MIDIMessageEvent) => void>>(new Map());
  const [mixTrackId, setMixTrackId] = useState(project.melody.trackId);
  const [automationParameter, setAutomationParameter] = useState<AutomationParameter>('filter');
  const track = project.tracks.find((candidate) => candidate.id === editTrackId);
  const editableLanes = track?.lanes.filter((candidate) => candidate.kind === 'notes' || candidate.kind === 'drums') ?? [];
  const lane = editableLanes.find((candidate) => candidate.id === editLaneId) ?? editableLanes[0];
  const editableTracks = project.tracks.filter((candidate) => candidate.lanes.some((candidateLane) => candidateLane.kind === 'notes' || candidateLane.kind === 'drums'));
  const notes = lane?.notes ?? [];
  const durationTick = Math.max(project.arrangement.sections.reduce((sum, section) => sum + section.bars, 0) * 4 * PPQ, PPQ * 16);
  const durationBars = Math.max(1, Math.ceil(durationTick / (4 * PPQ)));
  const loopStartBar = Math.max(1, Math.min(durationBars - 1, Math.floor(project.loop.startTick / (4 * PPQ)) + 1));
  const loopEndBar = Math.max(loopStartBar + 1, Math.min(durationBars, Math.ceil(project.loop.endTick / (4 * PPQ))));
  const canvasWidth = Math.max(DEFAULT_WIDTH, durationTick / PPQ * BEAT_WIDTH * zoom);
  const canvasHeight = (PIANO_MAX - PIANO_MIN + 1) * ROW_HEIGHT;
  const pixelsPerBar = 4 * BEAT_WIDTH * zoom;
  const visibleBars = Math.max(1, Math.ceil(viewportWidth / pixelsPerBar));
  const visibleStartBar = Math.min(durationBars, Math.floor(scrollPosition / pixelsPerBar) + 1);
  const visibleEndBar = Math.min(durationBars, visibleStartBar + visibleBars);
  const chordRanges = chordPatternRanges(project);
  const boundedPlayheadTick = clamp(playheadTick, 0, durationTick);
  const playheadX = boundedPlayheadTick / PPQ * BEAT_WIDTH * zoom;
  const playheadLabel = boundedPlayheadTick >= durationTick
    ? 'END'
    : `BAR ${Math.floor(boundedPlayheadTick / (4 * PPQ)) + 1} · ${Math.floor(boundedPlayheadTick % (4 * PPQ) / PPQ) + 1}.${Math.floor(boundedPlayheadTick % PPQ / Math.max(1, grid)) + 1}`;

  const noteById = new Map(notes.map((note) => [note.id, note]));
  const selectedNotes = selected.map((id) => noteById.get(id)).filter((note): note is NoteEvent => Boolean(note));

  const tickFromX = (x: number) => Math.max(0, Math.round((x / (BEAT_WIDTH * zoom)) * PPQ / grid) * grid);
  const pitchFromY = (y: number) => clamp(PIANO_MAX - Math.floor(y / ROW_HEIGHT), PIANO_MIN, PIANO_MAX);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const style = getComputedStyle(canvas);
    const cssColor = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    const editorBlack = cssColor('--color-editor-black', '#080d13');
    const editorSurface = cssColor('--color-editor-surface', '#111a24');
    const editorGrid = cssColor('--color-editor-grid', '#243344');
    const editorGridStrong = cssColor('--color-editor-grid-strong', '#3d536a');
    const accent2 = cssColor('--color-accent-2', '#64d5f4');
    const mint = cssColor('--color-mint', '#78e7c6');
    const lavender = cssColor('--color-lavender', '#c3a1ff');
    const action = cssColor('--color-action', '#ffd54a');
    const actionInk = cssColor('--color-action-ink', '#11131b');
    const ink = cssColor('--color-ink', '#edf5ff');
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvasWidth * ratio);
    canvas.height = Math.round(canvasHeight * ratio);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = editorBlack;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    for (let pitch = PIANO_MIN; pitch <= PIANO_MAX; pitch += 1) {
      const y = (PIANO_MAX - pitch) * ROW_HEIGHT;
      const black = [1, 3, 6, 8, 10].includes(pitch % 12);
      context.fillStyle = black ? editorSurface : editorBlack;
      context.fillRect(0, y, canvasWidth, ROW_HEIGHT);
      context.strokeStyle = pitch % 12 === 0 ? editorGridStrong : editorGrid;
      context.beginPath();
      context.moveTo(0, y + ROW_HEIGHT - .5);
      context.lineTo(canvasWidth, y + ROW_HEIGHT - .5);
      context.stroke();
    }
    for (let tick = 0; tick <= durationTick; tick += grid) {
      const x = tick / PPQ * BEAT_WIDTH * zoom;
      const beat = tick % (PPQ * 4) === 0;
      context.strokeStyle = beat ? editorGridStrong : editorGrid;
      context.lineWidth = beat ? 1.2 : .7;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvasHeight);
      context.stroke();
    }
    for (const note of notes) {
      const x = note.startTick / PPQ * BEAT_WIDTH * zoom;
      const width = Math.max(8, note.durationTick / PPQ * BEAT_WIDTH * zoom - 2);
      const hovered = hoveredId === note.id;
      const y = (PIANO_MAX - note.pitch) * ROW_HEIGHT + (hovered ? 0 : 2);
      const active = selected.includes(note.id);
      context.fillStyle = active ? action : note.source === 'humming' ? mint : note.source === 'midi-input' ? accent2 : lavender;
      context.shadowColor = hovered || active ? 'rgba(100, 213, 244, .72)' : 'transparent';
      context.shadowBlur = hovered || active ? 8 : 0;
      context.shadowOffsetY = hovered ? 3 : 0;
      context.fillRect(x + 1, y, width, hovered ? ROW_HEIGHT - 2 : ROW_HEIGHT - 4);
      context.shadowColor = 'transparent'; context.shadowBlur = 0; context.shadowOffsetY = 0;
      if (active) {
        context.strokeStyle = accent2;
        context.lineWidth = 2;
        context.strokeRect(x + 1, y, width, hovered ? ROW_HEIGHT - 2 : ROW_HEIGHT - 4);
      }
      // A small contrasting grip keeps the length-resize affordance visible without
      // adding a DOM node for every note.
      context.fillStyle = active ? actionInk : ink;
      context.fillRect(x + width - 3, y + 2, 2, ROW_HEIGHT - 8);
      context.fillStyle = active ? actionInk : ink;
      context.font = '11px ui-monospace, monospace';
      context.fillText(noteName(note.pitch), x + 5, y + ROW_HEIGHT - 8);
    }
    const activeDrag = dragRef.current;
    if (activeDrag && dragPreview) {
      context.save();
      context.globalAlpha = .72;
      context.fillStyle = accent2;
      context.strokeStyle = ink;
      context.lineWidth = 1.5;
      context.setLineDash([5, 3]);
      for (const note of activeDrag.notes) {
        const previewStart = activeDrag.mode === 'move' ? clamp(note.startTick + dragPreview.deltaTick, 0, durationTick - note.durationTick) : note.startTick;
        const previewPitch = activeDrag.mode === 'move' ? clamp(note.pitch + dragPreview.deltaPitch, PIANO_MIN, PIANO_MAX) : note.pitch;
        const previewDuration = activeDrag.mode === 'resize' ? clamp(note.durationTick + dragPreview.deltaTick, grid, durationTick - note.startTick) : note.durationTick;
        const x = previewStart / PPQ * BEAT_WIDTH * zoom;
        const y = (PIANO_MAX - previewPitch) * ROW_HEIGHT + 1;
        const width = Math.max(8, previewDuration / PPQ * BEAT_WIDTH * zoom - 2);
        context.fillRect(x + 1, y, width, ROW_HEIGHT - 3);
        context.strokeRect(x + 1, y, width, ROW_HEIGHT - 3);
      }
      context.restore();
    }
    if (marquee) {
      const x = Math.min(marquee.startX, marquee.endX);
      const y = Math.min(marquee.startY, marquee.endY);
      const width = Math.abs(marquee.endX - marquee.startX);
      const height = Math.abs(marquee.endY - marquee.startY);
      context.save();
      context.fillStyle = accent2;
      context.globalAlpha = .16;
      context.fillRect(x, y, width, height);
      context.globalAlpha = .9;
      context.strokeStyle = accent2;
      context.lineWidth = 1.5;
      context.setLineDash([6, 4]);
      context.strokeRect(x, y, width, height);
      context.restore();
    }
    context.save();
    context.strokeStyle = action;
    context.lineWidth = 2;
    context.shadowColor = 'rgba(255, 213, 74, .55)';
    context.shadowBlur = 6;
    context.beginPath();
    context.moveTo(playheadX + .5, 0);
    context.lineTo(playheadX + .5, canvasHeight);
    context.stroke();
    context.restore();
  };

  // draw is intentionally recreated with the current canvas model; the effect redraws on model changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { draw(); }, [canvasWidth, canvasHeight, durationTick, grid, notes, selected, hoveredId, dragPreview, marquee, boundedPlayheadTick]);

  useEffect(() => {
    if (!playing || playbackStartedAt === null) return undefined;
    const update = () => {
      const elapsedSeconds = Math.max(0, performance.now() - playbackStartedAt) / 1_000;
      const elapsedTick = elapsedSeconds * project.musicalGrid.bpm / 60 * PPQ;
      setPlayheadTick(clamp(Math.round(playbackStartTick + elapsedTick), 0, durationTick));
    };
    update();
    const interval = window.setInterval(update, 50);
    return () => window.clearInterval(interval);
  }, [durationTick, playbackStartTick, playbackStartedAt, playing, project.musicalGrid.bpm]);

  useEffect(() => {
    if (guideStep === null) return undefined;
    guideDialogRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGuideStep(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [guideStep]);

  useEffect(() => {
    const viewport = pianoRollViewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = (PIANO_MAX - PIANO_INITIAL_TOP) * ROW_HEIGHT;
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const next = clamp(viewport.scrollTop + event.deltaY, 0, Math.max(0, viewport.scrollHeight - viewport.clientHeight));
      if (next === viewport.scrollTop) return;
      event.preventDefault();
      viewport.scrollTop = next;
    };
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const element = pianoRollScrollRef.current;
    if (!element) return undefined;
    const sync = () => {
      setViewportWidth(element.clientWidth || DEFAULT_WIDTH);
      const nextMax = Math.max(0, element.scrollWidth - element.clientWidth);
      setScrollMax(nextMax);
      setScrollPosition(Math.min(element.scrollLeft, nextMax));
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [canvasWidth, zoom, durationTick]);

  useEffect(() => {
    const element = pianoRollScrollRef.current;
    if (element && Math.abs(element.scrollLeft - scrollPosition) > 1) element.scrollLeft = scrollPosition;
  }, [scrollPosition]);

  const seekPlayhead = (nextTick: number) => {
    const bounded = clamp(Math.round(nextTick / grid) * grid, 0, durationTick);
    setPlayheadTick(bounded);
    if (playing) onTogglePlayback(bounded);
  };

  const seekPlayheadFromRuler = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    seekPlayhead((event.clientX - bounds.left + scrollPosition) / (BEAT_WIDTH * zoom) * PPQ);
  };

  const hitNote = (x: number, y: number): NoteEvent | undefined => {
    const pitch = pitchFromY(y);
    const tick = x / (BEAT_WIDTH * zoom) * PPQ;
    return [...notes].reverse().find((note) => note.pitch === pitch && tick >= note.startTick && tick <= note.startTick + note.durationTick);
  };

  const notePixelBounds = (note: NoteEvent) => {
    const x = note.startTick / PPQ * BEAT_WIDTH * zoom;
    const width = Math.max(8, note.durationTick / PPQ * BEAT_WIDTH * zoom - 2);
    const y = (PIANO_MAX - note.pitch) * ROW_HEIGHT;
    return { x, endX: x + width + 1, y, endY: y + ROW_HEIGHT };
  };

  const constrainMoveDelta = (movingNotes: readonly NoteEvent[], rawTick: number, rawPitch: number) => {
    if (movingNotes.length === 0) return { deltaTick: 0, deltaPitch: 0 };
    const earliestStart = Math.min(...movingNotes.map((note) => note.startTick));
    const latestEnd = Math.max(...movingNotes.map((note) => note.startTick + note.durationTick));
    const lowestPitch = Math.min(...movingNotes.map((note) => note.pitch));
    const highestPitch = Math.max(...movingNotes.map((note) => note.pitch));
    return {
      deltaTick: clamp(rawTick, -earliestStart, durationTick - latestEnd),
      deltaPitch: clamp(rawPitch, PIANO_MIN - lowestPitch, PIANO_MAX - highestPitch),
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const hit = hitNote(x, y);
    if (!hit) {
      const additiveIds = event.shiftKey ? [...selected] : [];
      marqueeRef.current = { originX: x, originY: y, additiveIds, selectedIds: additiveIds };
      setMarquee({ startX: x, startY: y, endX: x, endY: y });
      if (!event.shiftKey) setSelected([]);
      setDragGesture(null);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      setSelected((current) => current.includes(hit.id) ? current.filter((id) => id !== hit.id) : [...current, hit.id]);
      setDragGesture(null);
      setDragPreview(null);
      return;
    }
    const ids = selected.includes(hit.id) ? selected : [hit.id];
    setSelected(ids);
    const { endX } = notePixelBounds(hit);
    const mode = x >= endX - Math.min(12, Math.max(5, (hit.durationTick / PPQ) * BEAT_WIDTH * zoom * .45)) ? 'resize' : 'move';
    dragRef.current = { mode, ids, originX: event.clientX, originY: event.clientY, notes: ids.map((id) => noteById.get(id)).filter((note): note is NoteEvent => Boolean(note)).map((note) => ({ ...note })) };
    setDragGesture({ mode, count: ids.length });
    setDragPreview({ deltaTick: 0, deltaPitch: 0 });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const marqueeDrag = marqueeRef.current;
    if (marqueeDrag) {
      const left = Math.min(marqueeDrag.originX, x);
      const right = Math.max(marqueeDrag.originX, x);
      const top = Math.min(marqueeDrag.originY, y);
      const bottom = Math.max(marqueeDrag.originY, y);
      const hits = notes.filter((note) => {
        const noteBounds = notePixelBounds(note);
        return noteBounds.x <= right && noteBounds.endX >= left && noteBounds.y <= bottom && noteBounds.endY >= top;
      }).map((note) => note.id);
      const nextSelection = [...new Set([...marqueeDrag.additiveIds, ...hits])];
      marqueeDrag.selectedIds = nextSelection;
      setSelected(nextSelection);
      setMarquee({ startX: marqueeDrag.originX, startY: marqueeDrag.originY, endX: x, endY: y });
      event.currentTarget.style.cursor = 'crosshair';
      return;
    }
    if (dragRef.current) {
      const tickSnap = dragRef.current.mode === 'move' && event.altKey ? 4 * PPQ : grid;
      const rawTick = Math.round(((event.clientX - dragRef.current.originX) / (BEAT_WIDTH * zoom)) * PPQ / tickSnap) * tickSnap;
      const semitoneDelta = -Math.round((event.clientY - dragRef.current.originY) / ROW_HEIGHT);
      const rawPitch = dragRef.current.mode === 'move' ? event.shiftKey ? Math.round(semitoneDelta / 12) * 12 : semitoneDelta : 0;
      setDragPreview(dragRef.current.mode === 'move' ? constrainMoveDelta(dragRef.current.notes, rawTick, rawPitch) : { deltaTick: rawTick, deltaPitch: 0 });
      event.currentTarget.style.cursor = dragRef.current.mode === 'resize' ? 'ew-resize' : 'grabbing';
      return;
    }
    const hit = hitNote(x, y);
    setHoveredId(hit?.id ?? null);
    if (!hit) { event.currentTarget.style.cursor = 'crosshair'; return; }
    const { endX } = notePixelBounds(hit);
    event.currentTarget.style.cursor = x >= endX - Math.min(12, Math.max(5, (hit.durationTick / PPQ) * BEAT_WIDTH * zoom * .45)) ? 'ew-resize' : 'grab';
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (marqueeRef.current) {
      const selectionCount = marqueeRef.current.selectedIds.length;
      marqueeRef.current = null;
      setMarquee(null);
      setMessage(`${selectionCount}音を範囲選択しました。選択音をつかむとまとめて移動できます。`);
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId);
      event.currentTarget.style.cursor = 'crosshair';
      return;
    }
    const drag = dragRef.current;
    if (drag && track && lane) {
      const tickSnap = drag.mode === 'move' && event.altKey ? 4 * PPQ : grid;
      const rawTick = Math.round(((event.clientX - drag.originX) / (BEAT_WIDTH * zoom)) * PPQ / tickSnap) * tickSnap;
      const semitoneDelta = -Math.round((event.clientY - drag.originY) / ROW_HEIGHT);
      const rawPitch = drag.mode === 'move' && event.shiftKey ? Math.round(semitoneDelta / 12) * 12 : semitoneDelta;
      const moveDelta = constrainMoveDelta(drag.notes, rawTick, rawPitch);
      const deltaTick = drag.mode === 'move' ? moveDelta.deltaTick : rawTick;
      const deltaPitch = drag.mode === 'move' ? moveDelta.deltaPitch : 0;
      const updates = drag.notes.map((note) => ({
        noteId: note.id,
        patch: drag.mode === 'resize'
          ? { durationTick: clamp(note.durationTick + deltaTick, grid, durationTick - note.startTick), userEdited: true }
          : { startTick: clamp(note.startTick + deltaTick, 0, durationTick - note.durationTick), pitch: clamp(note.pitch + deltaPitch, PIANO_MIN, PIANO_MAX), userEdited: true },
      }));
      const changed = updates.some((update, index) => {
        const source = drag.notes[index];
        return drag.mode === 'resize' ? update.patch.durationTick !== source?.durationTick : update.patch.startTick !== source?.startTick || update.patch.pitch !== source?.pitch;
      });
      if (changed) {
        onCommand({ type: 'note/update-many', trackId: track.id, laneId: lane.id, updates, at: now() });
        setMessage(drag.mode === 'move' ? `${drag.notes.length}音を ${deltaTick} tick / ${deltaPitch} semitone 移動しました。` : `${drag.notes.length}音の長さを ${deltaTick} tick 変更しました。`);
      }
    }
    dragRef.current = null;
    setDragGesture(null);
    setDragPreview(null);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId);
    event.currentTarget.style.cursor = 'crosshair';
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    marqueeRef.current = null;
    setDragGesture(null);
    setDragPreview(null);
    setMarquee(null);
    event.currentTarget.style.cursor = 'crosshair';
  };

  const addNote = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (event.detail < 2 || !track || !lane) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const startTick = tickFromX(event.clientX - bounds.left);
    const pitch = pitchFromY(event.clientY - bounds.top);
    const note: NoteEvent = { id: `manual-${now().replace(/\D/g, '')}-${startTick}-${pitch}`, pitch, startTick, durationTick: grid * 2, velocity, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false };
    onCommand({ type: 'note/add', trackId: track.id, laneId: lane.id, note, at: now() });
    setSelected([note.id]);
  };

  const removeSelected = () => {
    if (!track || !lane || selected.length === 0) return;
    onCommand({ type: 'note/remove', trackId: track.id, laneId: lane.id, noteIds: selected, at: now() });
    setSelected([]);
  };

  const quantizeSelected = () => {
    if (!track || !lane || selected.length === 0) return;
    onCommand({ type: 'note/update-many', trackId: track.id, laneId: lane.id, updates: selectedNotes.map((note) => ({ noteId: note.id, patch: { startTick: Math.round(note.startTick / grid) * grid, userEdited: true } })), at: now() });
    setMessage(`${selected.length}音を${grid} tickへクオンタイズしました`);
  };

  const copy = () => {
    if (selectedNotes.length === 0) return;
    const copied = selectedNotes.map((note) => ({ ...note }));
    clipboardRef.current = copied;
    setClipboard(copied);
    setMessage(`${copied.length}音をコピーしました`);
  };
  const paste = () => {
    if (!track || !lane || clipboardRef.current.length === 0) return;
    const offset = (selectedNotes[0]?.startTick ?? 0) + grid * 2;
    const sourceStart = clipboardRef.current[0]?.startTick ?? 0;
    const pasted = clipboardRef.current.map((note, index) => ({ ...note, id: `paste-${now().replace(/\D/g, '')}-${index}`, startTick: clamp(note.startTick - sourceStart + offset, 0, durationTick - note.durationTick), source: 'manual' as const, userEdited: true }));
    onCommand({ type: 'note/add-many', trackId: track.id, laneId: lane.id, notes: pasted, at: now() });
    setSelected(pasted.map((note) => note.id));
  };

  const updateSelectedNotes = (patchFor: (note: NoteEvent) => Partial<Pick<NoteEvent, 'pitch' | 'startTick' | 'durationTick' | 'velocity' | 'userEdited'>>) => {
    if (!track || !lane || selectedNotes.length === 0) return;
    onCommand({ type: 'note/update-many', trackId: track.id, laneId: lane.id, updates: selectedNotes.map((note) => ({ noteId: note.id, patch: { ...patchFor(note), userEdited: true } })), at: now() });
  };

  const adjustSelectedNotes = (field: 'pitch' | 'startTick' | 'durationTick' | 'velocity', delta: number) => {
    updateSelectedNotes((note) => {
      if (field === 'pitch') return { pitch: clamp(note.pitch + delta, PIANO_MIN, PIANO_MAX) };
      if (field === 'startTick') return { startTick: clamp(note.startTick + delta, 0, Math.max(0, durationTick - note.durationTick)) };
      if (field === 'durationTick') return { durationTick: clamp(note.durationTick + delta, grid, Math.max(grid, durationTick - note.startTick)) };
      return { velocity: clamp(note.velocity + delta, 1, 127) };
    });
  };

  const duplicateSelectedNotes = () => {
    if (!track || !lane || selectedNotes.length === 0) return;
    const stamp = now().replace(/\D/g, '');
    const duplicates = selectedNotes.map((note, index) => ({ ...note, id: `duplicate-${stamp}-${index}`, startTick: clamp(note.startTick + grid * 2, 0, Math.max(0, durationTick - note.durationTick)), userEdited: true }));
    onCommand({ type: 'note/add-many', trackId: track.id, laneId: lane.id, notes: duplicates, at: now() });
    setSelected(duplicates.map((note) => note.id));
    setMessage(`${duplicates.length}音を複製しました`);
  };

  useEffect(() => {
    const handleShortcutCommand = (event: Event) => {
      const commandId = shortcutCommandId(event);
      if (!commandId) return;
      if (commandId === 'transport.audition-selection') {
        if (track && selected.length > 0) void onAuditionNotes(track.id, selected, `${selected.length}音`);
      } else if (commandId === 'edit.select-all') setSelected(notes.map((note) => note.id));
      else if (commandId === 'edit.copy') copy();
      else if (commandId === 'edit.paste') paste();
      else if (commandId === 'edit.duplicate') duplicateSelectedNotes();
      else if (commandId === 'edit.delete') removeSelected();
      else if (commandId === 'edit.quantize') quantizeSelected();
      else if (commandId === 'note.left') adjustSelectedNotes('startTick', -grid);
      else if (commandId === 'note.right') adjustSelectedNotes('startTick', grid);
      else if (commandId === 'note.up') adjustSelectedNotes('pitch', 1);
      else if (commandId === 'note.down') adjustSelectedNotes('pitch', -1);
      else if (commandId === 'note.octave-up') adjustSelectedNotes('pitch', 12);
      else if (commandId === 'note.octave-down') adjustSelectedNotes('pitch', -12);
      else if (commandId === 'note.bar-left') adjustSelectedNotes('startTick', -4 * PPQ);
      else if (commandId === 'note.bar-right') adjustSelectedNotes('startTick', 4 * PPQ);
      else if (commandId === 'view.zoom-in') setZoom((current) => clamp(current + .25, .5, 2));
      else if (commandId === 'view.zoom-out') setZoom((current) => clamp(current - .25, .5, 2));
      else if (commandId === 'view.track-prev' || commandId === 'view.track-next') {
        const currentIndex = Math.max(0, editableTracks.findIndex((candidate) => candidate.id === track?.id));
        const delta = commandId === 'view.track-prev' ? -1 : 1;
        const target = editableTracks[clamp(currentIndex + delta, 0, editableTracks.length - 1)];
        const targetLane = target?.lanes.find((candidate) => candidate.kind === 'notes' || candidate.kind === 'drums');
        if (target && targetLane) { setEditTrackId(target.id); setEditLaneId(targetLane.id); setSelected([]); }
      }
    };
    window.addEventListener(SHORTCUT_COMMAND_EVENT, handleShortcutCommand);
    return () => window.removeEventListener(SHORTCUT_COMMAND_EVENT, handleShortcutCommand);
  });

  const instrumentAliases: Record<string, string> = { 'pearl-lead': 'lead-pearl', 'soft-supersaw': 'chord-soft-supersaw', 'candy-kit': 'drum-candy-kit', 'round-sub': 'bass-round-sub', 'cloud-lead': 'lead-pearl', 'glass-pluck': 'synth-glass-pluck', 'pastel-pad': 'pad-pastel-air', 'pixel-arp': 'arp-pixel-drop', 'tiny-perc': 'perc-tiny-pop', 'sparkle-fx': 'fx-sparkle-dust', 'soft-transition': 'transition-soft-rise' };
  const updateMixer = (target: Track, patch: Partial<Pick<Track, 'muted' | 'solo' | 'volume' | 'pan' | 'instrumentId' | 'fx'>>) => onCommand({ type: 'track/mixer', trackId: target.id, patch, at: now() });
  const updateFx = (target: Track, parameter: typeof FX_PARAMETERS[number], value: number) => updateMixer(target, { fx: { ...target.fx, [parameter]: value } });
  const selectedMixTrack = project.tracks.find((candidate) => candidate.id === mixTrackId) ?? project.tracks[0];
  const selectedAutomationLane = selectedMixTrack?.automation.find((candidate) => candidate.parameter === automationParameter);
  const automationRange = (parameter: AutomationParameter): [number, number, number] => parameter === 'pan' ? [-1, 1, .01] : [0, 1, .01];
  const setAutomationPoints = (target: Track, parameter: AutomationParameter, points: AutomationPoint[]) => onCommand({ type: 'automation/set', trackId: target.id, parameter, points: points.slice().sort((left, right) => left.tick - right.tick), at: now() });
  const addAutomationPoint = (target: Track, parameter: AutomationParameter) => {
    const current = target.automation.find((candidate) => candidate.parameter === parameter)?.points ?? [];
    automationSequenceRef.current += 1;
    const point: AutomationPoint = { id: `automation-point-${target.id}-${parameter}-${now().replace(/\D/g, '')}-${automationSequenceRef.current}`, tick: clamp(Math.round(durationTick / 2 / grid) * grid, 0, durationTick), value: parameter === 'pan' ? 0 : .8, curve: 'linear' };
    setAutomationPoints(target, parameter, [...current, point]);
  };
  const updateAutomationPoint = (target: Track, parameter: AutomationParameter, pointId: string, patch: Partial<AutomationPoint>) => {
    const current = target.automation.find((candidate) => candidate.parameter === parameter)?.points ?? [];
    setAutomationPoints(target, parameter, current.map((point) => point.id === pointId ? { ...point, ...patch } : point));
  };
  const removeAutomationPoint = (target: Track, parameter: AutomationParameter, pointId: string) => {
    const current = target.automation.find((candidate) => candidate.parameter === parameter)?.points ?? [];
    setAutomationPoints(target, parameter, current.filter((point) => point.id !== pointId));
  };

  const setLoopRange = (startBar: number, endBar: number, enabled = loopEnabled) => {
    const safeStart = Math.max(1, Math.min(durationBars - 1, startBar));
    const safeEnd = Math.max(safeStart + 1, Math.min(durationBars, endBar));
    onCommand({ type: 'loop/set', enabled, startTick: (safeStart - 1) * 4 * PPQ, endTick: safeEnd * 4 * PPQ, at: now() });
  };

  const selectEditTrack = (trackId: string, preferredLaneId?: string) => {
    const nextTrack = project.tracks.find((candidate) => candidate.id === trackId);
    const nextLane = nextTrack?.lanes.find((candidate) => candidate.id === preferredLaneId && (candidate.kind === 'notes' || candidate.kind === 'drums'))
      ?? nextTrack?.lanes.find((candidate) => candidate.kind === 'notes' || candidate.kind === 'drums');
    if (!nextTrack || !nextLane) return;
    setEditTrackId(nextTrack.id);
    setEditLaneId(nextLane.id);
    setSelected([]);
  };

  const materializeChordBlocks = () => {
    const blockIds = new Set(chordRanges.map((range) => range.blockId));
    const chordTrack = project.tracks.find((candidate) => candidate.role === 'chord' && candidate.lanes.some((candidateLane) => candidateLane.blocks.some((block) => blockIds.has(block.id))));
    const chordLane = chordTrack?.lanes.find((candidate) => candidate.blocks.some((block) => blockIds.has(block.id)));
    if (!chordTrack || !chordLane) {
      setMessage('編集ノートへ展開できるコードブロックがありません。');
      return;
    }
    const laneBlockIds = chordLane.blocks.filter((block) => blockIds.has(block.id)).map((block) => block.id);
    const laneNotes = materializeChordPatternNotes(project).filter((note) => laneBlockIds.some((blockId) => note.id.startsWith(`${blockId}-step-`)));
    onCommand({ type: 'pattern/chords-materialize', trackId: chordTrack.id, laneId: chordLane.id, blockIds: laneBlockIds, notes: laneNotes, at: now() });
    selectEditTrack(chordTrack.id, chordLane.id);
    setMessage(`${laneBlockIds.length}個のコードブロックを通常の編集ノートへ展開しました。ラフのコードパッドへは自動で戻しません。`);
  };

  const [newTrackRole, setNewTrackRole] = useState<TrackRole>('lead');
  const addTrack = () => {
    const definition = ADDABLE_TRACKS.find((candidate) => candidate.role === newTrackRole) ?? ADDABLE_TRACKS[0]!;
    const serial = project.tracks.filter((candidate) => candidate.role === definition.role).length + 1;
    const trackId = `track-${definition.role}-${serial}-${now().replace(/\D/g, '')}`;
    const laneKind = definition.role === 'percussion' ? 'drums' : 'notes';
    const newTrack: Track = {
      id: trackId,
      role: definition.role,
      name: `${definition.label} ${serial}`,
      color: definition.color,
      instrumentId: definition.instrumentId,
      muted: false,
      solo: false,
      volume: .74,
      pan: 0,
      fx: { filter: 1, reverb: .2, delay: 0, sidechain: 0 },
      lanes: [
        { id: `${trackId}-main`, name: 'Main', role: 'main', kind: laneKind, muted: false, notes: [], blocks: [], audioClips: [] },
        { id: `${trackId}-sub`, name: 'Sub', role: 'sub', kind: laneKind, muted: false, notes: [], blocks: [], audioClips: [] },
      ],
      automation: [],
    };
    onCommand({ type: 'track/add', track: newTrack, at: now() });
    setEditTrackId(trackId);
    setEditLaneId(`${trackId}-main`);
    setSelected([]);
    setMessage(`${newTrack.name}を追加しました`);
  };

  const connectMidi = async () => {
    const midiNavigator = navigator as Navigator & { requestMIDIAccess?: () => Promise<MIDIAccess> };
    const requestMidiAccess = typeof midiNavigator.requestMIDIAccess === 'function'
      ? () => midiNavigator.requestMIDIAccess?.()
      : undefined;
    if (!requestMidiAccess) { setMessage('このbrowserはWeb MIDI非対応'); return; }
    try {
      // A new connection starts a fresh capture clock; unresolved notes keep their provisional length.
      midiOriginRef.current = null;
      midiActiveRef.current.clear();
      const access = await requestMidiAccess();
      if (!access) { setMessage('MIDI権限を取得できませんでした'); return; }
      let connected = 0;
      for (const input of access.inputs.values()) {
        connected += 1;
        const previous = midiHandlersRef.current.get(input);
        if (previous && input.onmidimessage === previous) input.onmidimessage = null;
        const inputKey = input.id || input.name || `input-${connected}`;
        const handler = (event: MIDIMessageEvent) => {
          const data = event.data;
          if (!data || data.length < 3 || !track || !lane) return;
          const command = data[0] ?? 0;
          const pitch = clamp(data[1] ?? 60, PIANO_MIN, PIANO_MAX);
          const velocityValue = clamp(data[2] ?? 0, 0, 127);
          const channel = command & 0x0f;
          const messageType = command & 0xf0;
          const timestamp = Number.isFinite(event.timeStamp) && event.timeStamp > 0 ? event.timeStamp : performance.now();
          if (midiOriginRef.current === null) midiOriginRef.current = timestamp;
          const elapsedSeconds = Math.max(0, (timestamp - (midiOriginRef.current ?? timestamp)) / 1_000);
          const tick = clamp(Math.round(elapsedSeconds * project.musicalGrid.bpm / 60 * PPQ / grid) * grid, 0, durationTick);
          const key = `${inputKey}:${channel}:${pitch}`;
          if (messageType === 0x90 && velocityValue > 0) {
            midiSequenceRef.current += 1;
            const note: NoteEvent = { id: `midi-${now().replace(/\D/g, '')}-${midiSequenceRef.current}-${tick}-${pitch}`, pitch, startTick: tick, durationTick: grid * 2, velocity: velocityValue, source: 'midi-input', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false };
            onCommand({ type: 'note/add', trackId: track.id, laneId: lane.id, note, at: now() });
            const pending = midiActiveRef.current.get(key) ?? [];
            pending.push({ noteId: note.id, startTick: tick, startedAtMs: timestamp });
            midiActiveRef.current.set(key, pending);
            setSelected([note.id]);
          } else if (messageType === 0x80 || (messageType === 0x90 && velocityValue === 0)) {
            const pending = midiActiveRef.current.get(key);
            const active = pending?.shift();
            if (!active) return;
            const elapsedTick = Math.max(grid, tick - active.startTick);
            const boundedDuration = Math.max(grid, Math.min(elapsedTick, Math.max(grid, durationTick - active.startTick)));
            onCommand({ type: 'note/update', trackId: track.id, laneId: lane.id, noteIds: [active.noteId], patch: { durationTick: boundedDuration, userEdited: true }, at: now() });
            if (pending?.length === 0) midiActiveRef.current.delete(key);
          }
        };
        input.onmidimessage = handler;
        midiHandlersRef.current.set(input, handler);
      }
      setMessage(connected > 0 ? `${connected} MIDI入力を接続` : 'MIDI入力が見つかりません');
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'MIDI権限を取得できませんでした'); }
  };

  useEffect(() => () => {
    for (const [input, handler] of midiHandlersRef.current) if (input.onmidimessage === handler) input.onmidimessage = null;
    midiHandlersRef.current.clear();
    midiActiveRef.current.clear();
    midiOriginRef.current = null;
  }, []);

  if (!track || !lane) return <div className="editor-entry">Melody laneがありません。</div>;
  return (
    <section className="daw-editor" aria-labelledby="daw-editor-title" data-guide-open={guideStep === null ? undefined : 'true'} data-guide-target={guideStep === null ? undefined : DAW_GUIDE_STEPS[guideStep]?.target}>
      <header className="daw-toolbar">
        <div className="daw-title-line"><h2 id="daw-editor-title">{track.name}</h2><span className="daw-edit-target">{lane.name}</span>{message && <span className="visually-hidden" role="status">{message}</span>}</div>
        <div className="daw-tools">
          <label>Track<select aria-label="編集トラック" value={editTrackId} onChange={(event) => selectEditTrack(event.target.value)}>{editableTracks.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label>
          <label>Lane<select aria-label="編集レーン" value={lane.id} onChange={(event) => { setEditLaneId(event.target.value); setSelected([]); }}>{editableLanes.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label>
          <label>追加トラック<select aria-label="追加トラック種別" value={newTrackRole} onChange={(event) => setNewTrackRole(event.target.value as TrackRole)}>{ADDABLE_TRACKS.map((candidate) => <option value={candidate.role} key={candidate.role}>{candidate.label}</option>)}</select></label>
          <button className="button daw-icon-button" type="button" aria-label="トラックを追加" title="トラックを追加" onClick={addTrack}>＋</button>
          <label>Grid<select value={grid} onChange={(event) => setGrid(Number(event.target.value))}>{GRID_OPTIONS.map((value) => <option value={value} key={value}>{value === PPQ / 2 ? '1/8' : value === PPQ / 4 ? '1/16' : value === PPQ / 6 ? '1/16 triplet' : '1/32'}</option>)}</select></label>
          <label>Zoom<input aria-label="ピアノロールズーム" type="range" min=".6" max="2" step=".1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <label>Vel<input aria-label="新しい音符のVelocity" type="number" min="1" max="127" value={velocity} onChange={(event) => setVelocity(clamp(Number(event.target.value) || 1, 1, 127))} /></label>
          <button className="button daw-icon-button" type="button" aria-label="選択音符をクオンタイズ" title="Quantize" onClick={quantizeSelected} disabled={selected.length === 0}>Q</button>
          <button className="button daw-icon-button" type="button" aria-label="選択音符をコピー" title="Copy" onClick={copy} disabled={selected.length === 0}>⧉</button>
          <button className="button daw-icon-button" type="button" aria-label="音符を貼り付け" title="Paste" onClick={paste} disabled={clipboard.length === 0}>▣</button>
          <button className="button button-danger daw-icon-button" type="button" aria-label="選択音符を削除" title="Delete" onClick={removeSelected} disabled={selected.length === 0}>⌫</button>
          <label>Loop開始小節<select aria-label="Loop開始小節" value={loopStartBar} onChange={(event) => setLoopRange(Number(event.target.value), loopEndBar)}>{Array.from({ length: Math.max(1, durationBars - 1) }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1}</option>)}</select></label>
          <label>Loop終了小節<select aria-label="Loop終了小節" value={loopEndBar} onChange={(event) => setLoopRange(loopStartBar, Number(event.target.value))}>{Array.from({ length: Math.max(1, durationBars - 1) }, (_, index) => <option value={index + 2} key={index + 2}>{index + 2}</option>)}</select></label>
          <button className="button daw-icon-button" type="button" aria-label={loopEnabled ? 'ループを解除' : 'ループを有効化'} title="Loop" aria-pressed={loopEnabled} onClick={() => { const enabled = !loopEnabled; setLoopEnabled(enabled); setLoopRange(enabled ? 1 : loopStartBar, enabled ? durationBars : loopEndBar, enabled); }}>↻</button>
          <button className="button daw-icon-button" type="button" aria-label="MIDI入力を接続" title="MIDI入力" onClick={() => void connectMidi()}>⌁</button>
          <button className="button daw-help-button" type="button" aria-label="DAW操作ガイドを開く" title="操作ガイド" onClick={() => setGuideStep(0)}>?</button>
        </div>
      </header>
      <section className="customize-score-header" aria-label="再生と編集トラック">
        <div className="customize-transport" data-guide="transport">
          <div className="customize-transport-actions">
            <button className="customize-return-button" type="button" aria-label="先頭へ戻る" title="先頭へ戻る" onClick={() => seekPlayhead(0)}>↤</button>
            <button className="customize-play-button" type="button" aria-label={playing ? '編集中の曲を停止' : `${playheadLabel}から曲全体を再生`} title={playing ? '停止' : '再生'} aria-pressed={playing} onClick={() => onTogglePlayback(playing ? undefined : boundedPlayheadTick >= durationTick ? 0 : boundedPlayheadTick)}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
            <button className="customize-block-play-button" type="button" aria-label="選択音符だけ再生" title="選択音符だけ再生" disabled={selectedNotes.length === 0} onClick={() => void onAuditionNotes(track.id, selectedNotes.map((note) => note.id), `${track.name} ${selectedNotes.length}音`)}><span aria-hidden="true">▣▶</span></button>
          </div>
          <output aria-live="off">{playheadLabel}</output>
          <span className="visually-hidden">{playbackMessage}</span>
        </div>
        <nav className="edit-track-switcher" aria-label="編集する楽器" data-guide="tracks">
          {editableTracks.map((candidate) => <button type="button" key={candidate.id} aria-label={`${candidate.name}を編集`} aria-pressed={candidate.id === track.id} onClick={() => selectEditTrack(candidate.id)} style={{ '--track-color': candidate.color } as CSSProperties}><strong>{candidate.name}</strong></button>)}
        </nav>
        {chordRanges.length > 0 && <button className="button chord-materialize-button" type="button" aria-label="コードを通常ノートへ展開" title="コードを通常ノートへ展開" onClick={materializeChordBlocks}>♮＋</button>}
      </section>
      <div className="editor-section-overview" role="group" aria-label="全曲sectionから表示位置を選ぶ">
        {project.arrangement.sections.map((section) => <button type="button" key={section.id} data-role={section.role} style={{ '--section-span': section.bars } as CSSProperties} aria-label={`${section.label}から表示`} onClick={() => { const tick = section.startBar * 4 * PPQ; setScrollPosition(Math.min(scrollMax, section.startBar * pixelsPerBar)); seekPlayhead(tick); }}><strong>{section.label}</strong><span>{section.bars}</span></button>)}
      </div>
      <div className="editor-playhead-ruler" data-guide="timeline">
        <button type="button" aria-label="先頭へ戻る" title="先頭へ戻る" onClick={() => seekPlayhead(0)}>↤</button>
        <div className="editor-ruler-window" role="slider" tabIndex={0} aria-label="再生位置" aria-valuemin={0} aria-valuemax={durationTick} aria-valuenow={boundedPlayheadTick} aria-valuetext={playheadLabel} onPointerDown={seekPlayheadFromRuler} onKeyDown={(event) => {
          if (event.key === 'Home') seekPlayhead(0);
          else if (event.key === 'End') seekPlayhead(durationTick);
          else if (event.key === 'ArrowLeft') seekPlayhead(boundedPlayheadTick - grid);
          else if (event.key === 'ArrowRight') seekPlayhead(boundedPlayheadTick + grid);
          else return;
          event.preventDefault();
        }}>
          <div className="editor-ruler-track" style={{ width: `${canvasWidth}px`, transform: `translateX(-${scrollPosition}px)` }}>
            {Array.from({ length: durationBars + 1 }, (_, index) => <span className="editor-ruler-mark" key={index} style={{ left: `${index * pixelsPerBar}px` }}><b>{index + 1}</b></span>)}
            <i className="editor-ruler-playhead" style={{ left: `${playheadX}px` }} />
          </div>
        </div>
        <output>{playheadLabel}</output>
        <span className="editor-visible-bars">{visibleStartBar}–{visibleEndBar} / {durationBars}</span>
      </div>
      <div className="piano-roll-viewport" data-guide="score" ref={pianoRollViewportRef} role="region" aria-label="音程範囲。マウスホイールで上下にスクロール" tabIndex={0}>
        <div className="piano-roll-wrap">
          <aside className="piano-keys" aria-hidden="true" style={{ '--piano-row-height': `${ROW_HEIGHT}px` } as CSSProperties}>
            {Array.from({ length: PIANO_MAX - PIANO_MIN + 1 }, (_, index) => {
              const pitch = PIANO_MAX - index;
              const black = isBlackPianoKey(pitch);
              return <span className={`piano-key ${black ? 'is-black' : 'is-white'}${pitch % 12 === 0 ? ' is-c' : ''}`} data-pitch={pitch} data-note={noteName(pitch)} key={pitch}><b>{noteName(pitch)}</b></span>;
            })}
          </aside>
          <div className="piano-roll-scroll" ref={pianoRollScrollRef} onScroll={(event) => { const element = event.currentTarget; setViewportWidth(element.clientWidth || DEFAULT_WIDTH); setScrollPosition(element.scrollLeft); setScrollMax(Math.max(0, element.scrollWidth - element.clientWidth)); }}><canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onLostPointerCapture={(event) => { if (dragRef.current || marqueeRef.current) handlePointerCancel(event); }} onPointerLeave={() => { if (!dragRef.current && !marqueeRef.current) setHoveredId(null); }} onDoubleClick={addNote} aria-label={track.role === 'melody' ? 'メロディピアノロール' : `${track.name}ピアノロール`} /></div>
        </div>
      </div>
      <AudioClipEditor project={project} durationTick={durationTick} grid={grid} now={now} onCommand={onCommand} />
      <section className="mixer-strip" aria-label="トラックミキサー" data-guide="mixer">
        {project.tracks.map((target) => {
          const resolvedInstrumentId = instrumentAliases[target.instrumentId] ?? target.instrumentId;
          const placedRoleAssetId = target.lanes.flatMap((lane) => lane.blocks).find((block) => BUILT_IN_AUDIO_ASSETS.some((asset) => asset.id === block.assetId && asset.trackRole === target.role))?.assetId;
          const selectedAsset = target.role === 'fx' || target.role === 'transition'
            ? BUILT_IN_AUDIO_ASSETS.find((asset) => asset.id === placedRoleAssetId) ?? BUILT_IN_AUDIO_ASSETS.find((asset) => asset.trackRole === target.role)
            : BUILT_IN_AUDIO_ASSETS.find((asset) => asset.id === resolvedInstrumentId);
          const hasEditableInstrument = target.role !== 'fx' && target.role !== 'transition' && target.role !== 'reference' && target.lanes.some((candidate) => candidate.kind === 'notes' || candidate.kind === 'drums');
          const compact = target.role === 'fx' || target.role === 'reference';
          const channelControls = <div className="mixer-channel-controls">
            <label>Vol<input aria-label={`${target.name} volume`} type="range" min="0" max="1" step=".01" value={target.volume} onChange={(event) => updateMixer(target, { volume: Number(event.target.value) })} /></label>
            <label>Pan<input aria-label={`${target.name} pan`} type="range" min="-1" max="1" step=".01" value={target.pan} onChange={(event) => updateMixer(target, { pan: Number(event.target.value) })} /></label>
            <div className="mixer-ms"><button type="button" aria-label={`${target.name} mute`} aria-pressed={target.muted} onClick={() => updateMixer(target, { muted: !target.muted })}>M</button><button type="button" aria-label={`${target.name} solo`} aria-pressed={target.solo} onClick={() => updateMixer(target, { solo: !target.solo })}>S</button></div>
          </div>;
          return <article key={target.id} data-selected={target.id === selectedMixTrack?.id} data-compact={compact} style={{ '--track-color': target.color } as CSSProperties}>
            <button className="mixer-track-select" type="button" aria-label={`${target.name}のFXを編集`} aria-pressed={target.id === selectedMixTrack?.id} onClick={() => setMixTrackId(target.id)}><strong>{target.name}</strong></button>
            {hasEditableInstrument && <label className="mixer-instrument">音色<select aria-label={`${target.name} 音色`} value={resolvedInstrumentId} onChange={(event) => updateMixer(target, { instrumentId: event.target.value })}>{BUILT_IN_AUDIO_ASSETS.filter((asset) => target.lanes.some((candidate) => candidate.kind === 'drums') ? asset.trackRole === target.role : Boolean(asset.synthesis)).map((asset) => <option value={asset.id} key={asset.id}>{asset.name}</option>)}</select></label>}
            {selectedAsset && <button className="mixer-audition" type="button" onClick={() => void onAuditionAsset(selectedAsset.id, selectedAsset.name)}><span aria-hidden="true">▶</span>{selectedAsset.name}を単体試聴</button>}
            {compact ? <details className="mixer-compact-controls"><summary>音量・Pan・M/S</summary>{channelControls}</details> : channelControls}
          </article>;
        })}
      </section>
      {selectedMixTrack && <section className="fx-automation-panel" aria-label={`${selectedMixTrack.name} FXとオートメーション`}>
        <header className="fx-panel-heading"><h3>{selectedMixTrack.name} · FX</h3><span className="fx-panel-note">Filter · Reverb · Delay · Sidechain · Automation</span></header>
        <div className="fx-controls">
          {FX_PARAMETERS.map((parameter) => <label key={parameter}><span>{parameter}</span><input aria-label={`${selectedMixTrack.name} ${parameter}`} type="range" min="0" max="1" step=".01" value={selectedMixTrack.fx[parameter]} onChange={(event) => updateFx(selectedMixTrack, parameter, Number(event.target.value))} /><output>{Math.round(selectedMixTrack.fx[parameter] * 100)}%</output></label>)}
        </div>
        <div className="automation-editor">
          <div className="automation-toolbar"><label>Automation<select aria-label="オートメーション対象" value={automationParameter} onChange={(event) => setAutomationParameter(event.target.value as AutomationParameter)}>{AUTOMATION_PARAMETERS.map((parameter) => <option value={parameter} key={parameter}>{parameter}</option>)}</select></label><button className="button" type="button" onClick={() => addAutomationPoint(selectedMixTrack, automationParameter)}>+ Point</button><span>{selectedAutomationLane?.points.length ?? 0} points</span></div>
          {(selectedAutomationLane?.points ?? []).slice().sort((left, right) => left.tick - right.tick).map((point) => { const [min, max, step] = automationRange(automationParameter); return <div className="automation-point" key={point.id}>
            <label>Tick<input type="number" min="0" max={durationTick} step={grid} value={point.tick} onChange={(event) => updateAutomationPoint(selectedMixTrack, automationParameter, point.id, { tick: clamp(Number(event.target.value) || 0, 0, durationTick) })} /></label>
            <label>Value<input type="range" min={min} max={max} step={step} value={point.value} onChange={(event) => updateAutomationPoint(selectedMixTrack, automationParameter, point.id, { value: clamp(Number(event.target.value), min, max) })} /><output>{point.value.toFixed(2)}</output></label>
            <label>Curve<select value={point.curve} onChange={(event) => updateAutomationPoint(selectedMixTrack, automationParameter, point.id, { curve: event.target.value as AutomationPoint['curve'] })}><option value="linear">linear</option><option value="step">step</option></select></label>
            <button type="button" aria-label={`${automationParameter} point ${point.tick}を削除`} onClick={() => removeAutomationPoint(selectedMixTrack, automationParameter, point.id)}>削除</button>
          </div>; })}
          {(!selectedAutomationLane || selectedAutomationLane.points.length === 0) && <p className="automation-empty">ポイントを追加すると、タイムライン上で{automationParameter}が変化します。</p>}
        </div>
      </section>}
      {guideStep !== null && <>
        <div className="daw-guide-scrim" aria-hidden="true" />
        <div className="daw-guide-dialog" ref={guideDialogRef} role="dialog" aria-modal="true" aria-labelledby="daw-guide-title" tabIndex={-1}>
          <span>{guideStep + 1} / {DAW_GUIDE_STEPS.length}</span>
          <h3 id="daw-guide-title">{DAW_GUIDE_STEPS[guideStep]!.title}</h3>
          <p>{DAW_GUIDE_STEPS[guideStep]!.body}</p>
          <div>
            <button type="button" onClick={() => setGuideStep((current) => current === null ? null : Math.max(0, current - 1))} disabled={guideStep === 0}>←</button>
            <button type="button" onClick={() => setGuideStep((current) => current === null ? null : Math.min(DAW_GUIDE_STEPS.length - 1, current + 1))} disabled={guideStep === DAW_GUIDE_STEPS.length - 1}>→</button>
            <button type="button" onClick={() => setGuideStep(null)}>閉じる</button>
          </div>
        </div>
      </>}
    </section>
  );
}

function AudioClipEditor({ project, durationTick, grid, now, onCommand }: { project: Project; durationTick: number; grid: number; now: () => string; onCommand: (command: ProjectCommand) => void }) {
  const audioRows = project.tracks.flatMap((track) => track.lanes.filter((lane) => lane.kind === 'audio').flatMap((lane) => lane.audioClips.map((clip) => ({ track, lane, clip }))));
  if (audioRows.length === 0) return null;
  const assetLabel = (assetId: string) => BUILT_IN_AUDIO_ASSETS.find((asset) => asset.id === assetId)?.name ?? assetId;
  const updateClip = (track: Track, laneId: string, clipId: string, patch: Partial<Pick<Track['lanes'][number]['audioClips'][number], 'startTick' | 'durationTick' | 'gain'>>) => onCommand({ type: 'audio-clip/update', trackId: track.id, laneId, clipId, patch, at: now() });
  return (
    <section className="audio-clip-editor" aria-labelledby="audio-clip-editor-title">
      <header className="audio-clip-heading"><h3 id="audio-clip-editor-title">音声レイヤー</h3><span>位置 · 長さ · Gain</span></header>
      <div className="audio-clip-list">
        {audioRows.map(({ track, lane, clip }) => <article className="audio-clip-row" key={`${lane.id}/${clip.id}`}>
          <div className="audio-clip-name"><strong>{assetLabel(clip.assetId)}</strong><span>{track.name} / {lane.name}</span></div>
          <label>開始tick<input aria-label={`${clip.id} 開始tick`} type="number" min="0" max={Math.max(0, durationTick - grid)} step={grid} value={clip.startTick} onChange={(event) => updateClip(track, lane.id, clip.id, { startTick: clamp(Number(event.target.value) || 0, 0, Math.max(0, durationTick - clip.durationTick)) })} /></label>
          <label>長さtick<input aria-label={`${clip.id} 長さtick`} type="number" min={grid} max={durationTick} step={grid} value={clip.durationTick} onChange={(event) => updateClip(track, lane.id, clip.id, { durationTick: clamp(Number(event.target.value) || grid, grid, Math.max(grid, durationTick - clip.startTick)) })} /></label>
          <label className="audio-clip-gain"><span>Gain</span><input aria-label={`${clip.id} gain`} type="range" min="0" max="2" step=".01" value={clip.gain} onChange={(event) => updateClip(track, lane.id, clip.id, { gain: Number(event.target.value) })} /><output>{Math.round(clip.gain * 100)}%</output></label>
          <button type="button" aria-label={`${assetLabel(clip.assetId)}を削除`} onClick={() => onCommand({ type: 'audio-clip/remove', trackId: track.id, laneId: lane.id, clipId: clip.id, at: now() })}>削除</button>
        </article>)}
      </div>
    </section>
  );
}
