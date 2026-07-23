// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultShortcutBindings } from '../../application/shortcuts/shortcut-registry';
import { ShortcutSettingsModal } from './ShortcutSettingsModal';

afterEach(cleanup);

describe('ShortcutSettingsModal', () => {
  it('captures a free shortcut, rejects conflicts, resets, and closes with Escape', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ShortcutSettingsModal open bindings={defaultShortcutBindings()} onClose={onClose} onSave={onSave} />);

    const saveBinding = screen.getByRole('button', { name: 'Projectを保存のキー割り当て' });
    expect(saveBinding.textContent).toBe('Ctrl + S');
    expect(screen.getByRole('button', { name: '選択音を半音上へのキー割り当て' }).textContent).toBe('↑');
    expect(screen.getByRole('button', { name: '選択音を1オクターブ上へのキー割り当て' }).textContent).toBe('Shift + ↑');
    fireEvent.click(saveBinding);
    fireEvent.keyDown(saveBinding, { key: 'p', ctrlKey: true, shiftKey: true });
    expect(saveBinding.textContent).toBe('Ctrl + Shift + P');

    const exportBinding = screen.getByRole('button', { name: 'Project fileを書き出すのキー割り当て' });
    fireEvent.click(exportBinding);
    fireEvent.keyDown(exportBinding, { key: 'p', ctrlKey: true, shiftKey: true });
    expect(screen.getByRole('alert').textContent).toContain('Ctrl + Shift + P は');

    fireEvent.click(screen.getByRole('button', { name: '設定を保存' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ 'project.save': 'Ctrl+Shift+P' }));
    fireEvent.keyDown(exportBinding, { key: 'Escape' });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels capture when the same assignment button is clicked again or Escape is pressed', () => {
    render(<ShortcutSettingsModal open bindings={defaultShortcutBindings()} onClose={vi.fn()} onSave={vi.fn()} />);
    const upBinding = screen.getByRole('button', { name: '選択音を半音上へのキー割り当て' });

    fireEvent.click(upBinding);
    expect(upBinding.textContent).toBe('キーを入力…');
    fireEvent.click(upBinding);
    expect(upBinding.textContent).toBe('↑');

    fireEvent.click(upBinding);
    fireEvent.keyDown(upBinding, { key: 'Escape' });
    expect(upBinding.textContent).toBe('↑');
  });

  it('uses the display formatter in browser-reserved errors', () => {
    render(<ShortcutSettingsModal open bindings={defaultShortcutBindings()} onClose={vi.fn()} onSave={vi.fn()} />);
    const saveBinding = screen.getByRole('button', { name: 'Projectを保存のキー割り当て' });
    fireEvent.click(saveBinding);
    fireEvent.keyDown(saveBinding, { key: 'l', ctrlKey: true });
    expect(screen.getByRole('alert').textContent).toContain('Ctrl + L はブラウザー予約操作');
    expect(saveBinding.textContent).toBe('キーを入力…');
  });
});
