export const SHORTCUT_STORAGE_KEY = 'patchtone-shortcuts-v1';
export const SHORTCUT_COMMAND_EVENT = 'patchtone:shortcut-command';

export const SHORTCUT_COMMANDS = [
  { id: 'settings.open', category: 'App', label: '設定を開く', defaultShortcut: 'Ctrl+,' },
  { id: 'project.save', category: 'Project', label: 'Projectを保存', defaultShortcut: 'Ctrl+S' },
  { id: 'project.export', category: 'Project', label: 'Project fileを書き出す', defaultShortcut: 'Ctrl+Shift+S' },
  { id: 'edit.undo', category: 'Project', label: '元に戻す', defaultShortcut: 'Ctrl+Z' },
  { id: 'edit.redo', category: 'Project', label: 'やり直す', defaultShortcut: 'Ctrl+Y' },
  { id: 'transport.play-toggle', category: '再生', label: '曲全体を再生／停止', defaultShortcut: 'Space' },
  { id: 'transport.audition-selection', category: '再生', label: '選択ブロックだけ再生', defaultShortcut: 'Shift+Space' },
  { id: 'workflow.design', category: '画面', label: '曲の設計を開く', defaultShortcut: 'Alt+1' },
  { id: 'workflow.chords', category: '画面', label: '展開を整えるを開く', defaultShortcut: 'Alt+2' },
  { id: 'workflow.customize', category: '画面', label: '詳細の編集を開く', defaultShortcut: 'Alt+3' },
  { id: 'edit.select-all', category: '音符編集', label: '表示中trackの音を全選択', defaultShortcut: 'Ctrl+A' },
  { id: 'edit.copy', category: '音符編集', label: '選択音をコピー', defaultShortcut: 'Ctrl+C' },
  { id: 'edit.paste', category: '音符編集', label: '音を貼り付け', defaultShortcut: 'Ctrl+V' },
  { id: 'edit.duplicate', category: '音符編集', label: '選択音を複製', defaultShortcut: 'Ctrl+D' },
  { id: 'edit.delete', category: '音符編集', label: '選択音を削除', defaultShortcut: 'Delete' },
  { id: 'edit.quantize', category: '音符編集', label: '選択音をクオンタイズ', defaultShortcut: 'Q' },
  { id: 'note.left', category: '音符移動', label: '選択音をグリッド1つ左へ', defaultShortcut: 'ArrowLeft' },
  { id: 'note.right', category: '音符移動', label: '選択音をグリッド1つ右へ', defaultShortcut: 'ArrowRight' },
  { id: 'note.up', category: '音符移動', label: '選択音を半音上へ', defaultShortcut: 'ArrowUp' },
  { id: 'note.down', category: '音符移動', label: '選択音を半音下へ', defaultShortcut: 'ArrowDown' },
  { id: 'note.octave-up', category: '音符移動', label: '選択音を1オクターブ上へ', defaultShortcut: 'Shift+ArrowUp' },
  { id: 'note.octave-down', category: '音符移動', label: '選択音を1オクターブ下へ', defaultShortcut: 'Shift+ArrowDown' },
  { id: 'note.bar-left', category: '音符移動', label: '選択音を1小節左へ', defaultShortcut: 'Alt+ArrowLeft' },
  { id: 'note.bar-right', category: '音符移動', label: '選択音を1小節右へ', defaultShortcut: 'Alt+ArrowRight' },
  { id: 'view.zoom-in', category: '表示', label: 'ピアノロールを拡大', defaultShortcut: 'Ctrl+=' },
  { id: 'view.zoom-out', category: '表示', label: 'ピアノロールを縮小', defaultShortcut: 'Ctrl+-' },
  { id: 'view.track-prev', category: '表示', label: '前のtrackへ', defaultShortcut: '[' },
  { id: 'view.track-next', category: '表示', label: '次のtrackへ', defaultShortcut: ']' },
] as const;

export type ShortcutCommandId = typeof SHORTCUT_COMMANDS[number]['id'];
export type ShortcutBindings = Record<ShortcutCommandId, string | null>;

const BROWSER_RESERVED = new Set(['Ctrl+L', 'Ctrl+N', 'Ctrl+R', 'Ctrl+T', 'Ctrl+W', 'Ctrl+Shift+T']);

export function defaultShortcutBindings(): ShortcutBindings {
  return Object.fromEntries(SHORTCUT_COMMANDS.map((command) => [command.id, command.defaultShortcut])) as ShortcutBindings;
}

export function loadShortcutBindings(storage: Pick<Storage, 'getItem'> = localStorage): ShortcutBindings {
  const defaults = defaultShortcutBindings();
  try {
    const parsed = JSON.parse(storage.getItem(SHORTCUT_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    const legacyWorkflowBindings = Object.hasOwn(parsed, 'workflow.rough') || Object.hasOwn(parsed, 'workflow.arrangement');
    for (const command of SHORTCUT_COMMANDS) {
      if (legacyWorkflowBindings && command.id.startsWith('workflow.')) continue;
      const stored = parsed[command.id];
      if (stored === null || typeof stored === 'string') defaults[command.id] = stored;
    }
  } catch {
    // Invalid or unavailable storage falls back to the reviewed defaults.
  }
  return defaults;
}

export function saveShortcutBindings(bindings: ShortcutBindings, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(bindings));
}

function normalizedKey(key: string): string | null {
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(key)) return null;
  const aliases: Record<string, string> = { ' ': 'Space', Esc: 'Escape', Del: 'Delete', Left: 'ArrowLeft', Right: 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown' };
  if (aliases[key]) return aliases[key];
  if (key.length === 1) return /^[a-z]$/i.test(key) ? key.toUpperCase() : key;
  return key;
}

export function shortcutFromKeyboardEvent(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>): string | null {
  const key = normalizedKey(event.key);
  if (!key) return null;
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  parts.push(key);
  return parts.join('+');
}

export function formatShortcutForDisplay(shortcut: string | null): string {
  if (shortcut === null) return '未設定';
  let remaining = shortcut;
  const parts: string[] = [];
  for (const modifier of ['Ctrl', 'Alt', 'Shift']) {
    const prefix = `${modifier}+`;
    if (!remaining.startsWith(prefix)) continue;
    parts.push(modifier);
    remaining = remaining.slice(prefix.length);
  }
  const keyLabels: Readonly<Record<string, string>> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  };
  parts.push(keyLabels[remaining] ?? remaining);
  return parts.join(' + ');
}

export function commandForShortcut(bindings: ShortcutBindings, shortcut: string): ShortcutCommandId | null {
  return SHORTCUT_COMMANDS.find((command) => bindings[command.id] === shortcut)?.id ?? null;
}

export function shortcutConflict(bindings: ShortcutBindings, commandId: ShortcutCommandId, shortcut: string): ShortcutCommandId | null {
  return SHORTCUT_COMMANDS.find((command) => command.id !== commandId && bindings[command.id] === shortcut)?.id ?? null;
}

export function isBrowserReservedShortcut(shortcut: string): boolean {
  return BROWSER_RESERVED.has(shortcut);
}

export function isTextEditingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
}

export function emitShortcutCommand(commandId: ShortcutCommandId): void {
  window.dispatchEvent(new CustomEvent(SHORTCUT_COMMAND_EVENT, { detail: { commandId } }));
}

export function shortcutCommandId(event: Event): ShortcutCommandId | null {
  const detail = (event as CustomEvent<{ commandId?: unknown }>).detail;
  return typeof detail?.commandId === 'string' && SHORTCUT_COMMANDS.some((command) => command.id === detail.commandId) ? detail.commandId as ShortcutCommandId : null;
}
