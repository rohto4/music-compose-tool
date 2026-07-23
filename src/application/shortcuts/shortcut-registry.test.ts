// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { SHORTCUT_STORAGE_KEY, commandForShortcut, defaultShortcutBindings, isBrowserReservedShortcut, loadShortcutBindings, saveShortcutBindings, shortcutConflict, shortcutFromKeyboardEvent } from './shortcut-registry';

describe('shortcut registry', () => {
  it('normalizes Windows and Meta keyboard events to the same configurable command', () => {
    const bindings = defaultShortcutBindings();
    expect(shortcutFromKeyboardEvent({ key: 's', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false })).toBe('Ctrl+S');
    expect(shortcutFromKeyboardEvent({ key: 's', ctrlKey: false, metaKey: true, altKey: false, shiftKey: true })).toBe('Ctrl+Shift+S');
    expect(commandForShortcut(bindings, 'Ctrl+S')).toBe('project.save');
    expect(shortcutConflict(bindings, 'project.export', 'Ctrl+S')).toBe('project.save');
    expect(isBrowserReservedShortcut('Ctrl+L')).toBe(true);
  });

  it('persists overrides while filling newly registered commands from defaults', () => {
    const bindings = defaultShortcutBindings();
    bindings['project.save'] = 'Ctrl+Shift+P';
    bindings['edit.copy'] = null;
    saveShortcutBindings(bindings);
    const restored = loadShortcutBindings();
    expect(restored['project.save']).toBe('Ctrl+Shift+P');
    expect(restored['edit.copy']).toBeNull();
    expect(restored['transport.play-toggle']).toBe('Space');
    expect(localStorage.getItem(SHORTCUT_STORAGE_KEY)).toContain('Ctrl+Shift+P');
  });

  it('migrates the retired rough and arrangement shortcuts to the three production steps', () => {
    const storage = {
      getItem: () => JSON.stringify({
        'project.save': 'Ctrl+Shift+P',
        'workflow.rough': 'Alt+1',
        'workflow.customize': 'Alt+2',
        'workflow.design': 'Alt+3',
        'workflow.chords': 'Alt+4',
        'workflow.arrangement': 'Alt+5',
      }),
    };
    const restored = loadShortcutBindings(storage);
    expect(restored['project.save']).toBe('Ctrl+Shift+P');
    expect(restored['workflow.design']).toBe('Alt+1');
    expect(restored['workflow.chords']).toBe('Alt+2');
    expect(restored['workflow.customize']).toBe('Alt+3');
  });
});
