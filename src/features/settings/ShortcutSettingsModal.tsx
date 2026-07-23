import { useEffect, useMemo, useRef, useState } from 'react';
import { SHORTCUT_COMMANDS, defaultShortcutBindings, formatShortcutForDisplay, isBrowserReservedShortcut, shortcutConflict, shortcutFromKeyboardEvent } from '../../application/shortcuts/shortcut-registry';
import type { ShortcutBindings, ShortcutCommandId } from '../../application/shortcuts/shortcut-registry';

interface ShortcutSettingsModalProps {
  open: boolean;
  bindings: ShortcutBindings;
  onClose: () => void;
  onSave: (bindings: ShortcutBindings) => void;
}

export function ShortcutSettingsModal({ open, bindings, onClose, onSave }: ShortcutSettingsModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<ShortcutBindings>(bindings);
  const [capturing, setCapturing] = useState<ShortcutCommandId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(SHORTCUT_COMMANDS.map((command) => command.category))], []);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[data-modal-focus]')?.focus());
  }, [open]);

  if (!open) return null;

  const capture = (commandId: ShortcutCommandId, event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (capturing !== commandId) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') { setCapturing(null); setError(null); return; }
    const shortcut = shortcutFromKeyboardEvent(event.nativeEvent);
    if (!shortcut) return;
    if (isBrowserReservedShortcut(shortcut)) { setError(`${formatShortcutForDisplay(shortcut)} はブラウザー予約操作のため割り当てられません。`); return; }
    const conflict = shortcutConflict(draft, commandId, shortcut);
    if (conflict) {
      const label = SHORTCUT_COMMANDS.find((command) => command.id === conflict)?.label ?? conflict;
      setError(`${formatShortcutForDisplay(shortcut)} は「${label}」で使用中です。先に解除してください。`);
      return;
    }
    setDraft((current) => ({ ...current, [commandId]: shortcut }));
    setCapturing(null);
    setError(null);
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !capturing) { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return <div className="shortcut-modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <div ref={panelRef} className="shortcut-modal" role="dialog" aria-modal="true" aria-labelledby="shortcut-settings-title" onKeyDown={handleDialogKeyDown}>
      <header>
        <div><h2 id="shortcut-settings-title">ショートカット設定</h2><p>画面操作のキーを変更します。設定はこの端末だけに保存されます。</p></div>
        <button type="button" data-modal-focus onClick={onClose} aria-label="ショートカット設定を閉じる">×</button>
      </header>
      {error && <p className="shortcut-modal-error" role="alert">{error}</p>}
      <div className="shortcut-command-groups">
        {categories.map((category) => <section key={category} aria-labelledby={`shortcut-category-${category}`}>
          <h3 id={`shortcut-category-${category}`}>{category}</h3>
          <div className="shortcut-command-list">
            {SHORTCUT_COMMANDS.filter((command) => command.category === category).map((command) => <div className="shortcut-command-row" key={command.id}>
              <span>{command.label}</span>
              <button type="button" className="shortcut-capture" data-capturing={capturing === command.id} onClick={() => { setCapturing((current) => current === command.id ? null : command.id); setError(null); }} onKeyDown={(event) => capture(command.id, event)} aria-label={`${command.label}のキー割り当て`}>
                {capturing === command.id ? 'キーを入力…' : formatShortcutForDisplay(draft[command.id])}
              </button>
              <button type="button" className="shortcut-clear" disabled={draft[command.id] === null} onClick={() => { setDraft((current) => ({ ...current, [command.id]: null })); setCapturing(null); setError(null); }} aria-label={`${command.label}の割り当てを解除`}>解除</button>
            </div>)}
          </div>
        </section>)}
      </div>
      <footer>
        <button type="button" onClick={() => { setDraft(defaultShortcutBindings()); setCapturing(null); setError(null); }}>初期値へ戻す</button>
        <span />
        <button type="button" onClick={onClose}>キャンセル</button>
        <button type="button" className="button-primary" onClick={() => onSave(draft)}>設定を保存</button>
      </footer>
    </div>
  </div>;
}
