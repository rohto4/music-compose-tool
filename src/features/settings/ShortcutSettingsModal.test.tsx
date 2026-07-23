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
    fireEvent.click(saveBinding);
    fireEvent.keyDown(saveBinding, { key: 'p', ctrlKey: true, shiftKey: true });
    expect(saveBinding.textContent).toBe('Ctrl+Shift+P');

    const exportBinding = screen.getByRole('button', { name: 'Project fileを書き出すのキー割り当て' });
    fireEvent.click(exportBinding);
    fireEvent.keyDown(exportBinding, { key: 'p', ctrlKey: true, shiftKey: true });
    expect(screen.getByRole('alert').textContent).toContain('使用中');

    fireEvent.click(screen.getByRole('button', { name: '設定を保存' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ 'project.save': 'Ctrl+Shift+P' }));
    fireEvent.keyDown(exportBinding, { key: 'Escape' });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
