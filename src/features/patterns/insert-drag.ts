export const INSERT_DRAG_MIME = 'application/x-patchtone-insert-v1';
export const INSERT_DRAG_STATE_EVENT = 'patchtone:insert-drag-state';

export type InsertDragPayload =
  | { kind: 'chord'; padId: string; label: string }
  | { kind: 'progression'; templateId: string; label: string }
  | { kind: 'phrase-kit'; kitId: string; label: string }
  | { kind: 'role-pattern'; role: 'bass' | 'arp' | 'drum'; patternId: string; label: string }
  | { kind: 'asset'; assetId: string; label: string }
  | { kind: 'user-audio'; assetId: string; label: string }
  | { kind: 'sound-chunk'; chunkId: string; label: string };

const VALID_KINDS = new Set<InsertDragPayload['kind']>(['chord', 'progression', 'phrase-kit', 'role-pattern', 'asset', 'user-audio', 'sound-chunk']);

function shortText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= 120 ? value : null;
}

export function parseInsertDragPayload(raw: string): InsertDragPayload | null {
  if (!raw || raw.length > 640) return null;
  let candidate: Record<string, unknown>;
  try { candidate = JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
  const kind = shortText(candidate.kind);
  const label = shortText(candidate.label);
  if (!kind || !label || !VALID_KINDS.has(kind as InsertDragPayload['kind'])) return null;
  if (kind === 'chord') {
    const padId = shortText(candidate.padId);
    return padId ? { kind, padId, label } : null;
  }
  if (kind === 'progression') {
    const templateId = shortText(candidate.templateId);
    return templateId ? { kind, templateId, label } : null;
  }
  if (kind === 'phrase-kit') {
    const kitId = shortText(candidate.kitId);
    return kitId ? { kind, kitId, label } : null;
  }
  if (kind === 'role-pattern') {
    const role = shortText(candidate.role);
    const patternId = shortText(candidate.patternId);
    return patternId && (role === 'bass' || role === 'arp' || role === 'drum') ? { kind, role, patternId, label } : null;
  }
  if (kind === 'asset' || kind === 'user-audio') {
    const assetId = shortText(candidate.assetId);
    return assetId ? { kind, assetId, label } : null;
  }
  const chunkId = shortText(candidate.chunkId);
  return chunkId ? { kind: 'sound-chunk', chunkId, label } : null;
}

export function beginInsertDrag(dataTransfer: DataTransfer, payload: InsertDragPayload): void {
  dataTransfer.effectAllowed = 'copy';
  dataTransfer.setData(INSERT_DRAG_MIME, JSON.stringify(payload));
  dataTransfer.setData('text/plain', payload.label);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<InsertDragPayload>(INSERT_DRAG_STATE_EVENT, { detail: payload }));
}

export function endInsertDrag(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<null>(INSERT_DRAG_STATE_EVENT, { detail: null }));
}

export function readInsertDrag(dataTransfer: DataTransfer): InsertDragPayload | null {
  return parseInsertDragPayload(dataTransfer.getData(INSERT_DRAG_MIME));
}

export function canDropOnPhrase(payload: InsertDragPayload | null): boolean {
  return Boolean(payload && payload.kind !== 'chord');
}

export function canDropOnStep(payload: InsertDragPayload | null): boolean {
  return payload?.kind === 'chord';
}
