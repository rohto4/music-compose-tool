// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { MemoryProjectRepository } from './application/projects/project-repository';

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
});

describe('Project Home', () => {
  it('uses selectable moods and the three production steps without a length field', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryProjectRepository()} now={() => '2026-07-24T01:00:00.000Z'} createId={() => 'three-step-project'} />);

    await user.click(screen.getByRole('button', { name: '新しい曲' }));
    expect(screen.queryByLabelText('長さ')).toBeNull();
    await user.click(screen.getByRole('radio', { name: /AIで土台 → 鼻歌を追加/ }));
    await user.selectOptions(screen.getByLabelText('新しい曲のムード1'), '幻想的');
    await user.selectOptions(screen.getByLabelText('新しい曲のムード2'), '切ない');
    await user.click(screen.getByRole('button', { name: 'AIで土台を作る' }));

    const steps = screen.getByRole('navigation', { name: '制作ステップ' });
    expect(steps.querySelectorAll('button')).toHaveLength(3);
    expect(screen.queryByText('ラフ制作')).toBeNull();
    expect(screen.queryByText('カスタマイズ')).toBeNull();
    expect(screen.getByLabelText<HTMLSelectElement>('曲のムード1').value).toBe('幻想的');
    expect(screen.getByLabelText<HTMLSelectElement>('曲のムード2').value).toBe('切ない');
    expect(screen.getAllByLabelText('入力済み').length).toBeGreaterThanOrEqual(4);

    await user.click(screen.getByRole('button', { name: /展開を整える/ }));
    expect(screen.getByRole('heading', { name: '展開を整える' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /詳細の編集/ }));
    expect(screen.getByRole('region', { name: '音程範囲。マウスホイールで上下にスクロール' })).toBeTruthy();
  });

  it('prefills an incrementing project name after each saved project', async () => {
    const user = userEvent.setup();
    const repository = new MemoryProjectRepository();
    render(<App repository={repository} now={() => '2026-07-23T04:00:00.000Z'} createId={() => 'increment-project'} />);

    await user.click(screen.getByRole('button', { name: '新しい曲' }));
    await user.click(screen.getByRole('radio', { name: /AIで土台 → 鼻歌を追加/ }));
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: '曲の名前' }).value).toBe('新しい曲 1');
    await user.click(screen.getByRole('button', { name: 'AIで土台を作る' }));
    await user.click(screen.getByRole('button', { name: /^保存$/ }));
    await waitFor(() => expect(screen.getByText('保存済み')).toBeTruthy());
    await user.click(screen.getByRole('button', { name: /曲の一覧/ }));
    await screen.findByRole('heading', { name: '新しい曲 1' });

    await user.click(screen.getByRole('button', { name: '新しい曲' }));
    await user.click(screen.getByRole('radio', { name: /AIで土台 → 鼻歌を追加/ }));
    const nextTitle = screen.getByRole<HTMLInputElement>('textbox', { name: '曲の名前' });
    expect(nextTitle.value).toBe('新しい曲 2');
    await user.clear(nextTitle);
    await user.type(nextTitle, '好きな曲名');
    expect(nextTitle.value).toBe('好きな曲名');
  });

  it('creates a humming-first project, saves it manually, and returns it to the shelf', async () => {
    const user = userEvent.setup();
    const repository = new MemoryProjectRepository();
    render(<App repository={repository} now={() => '2026-07-22T01:00:00.000Z'} createId={() => 'project-soda'} />);

    expect(screen.getByRole('heading', { name: 'どこから曲を始めますか？' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '新しい曲' }));
    await user.click(screen.getByRole('radio', { name: /鼻歌をもとに曲を作る/ }));
    await user.clear(screen.getByRole('textbox', { name: '曲の名前' }));
    await user.type(screen.getByRole('textbox', { name: '曲の名前' }), 'Soda Sky');
    await user.click(screen.getByRole('button', { name: '鼻歌から始める' }));

    expect(screen.getByRole('heading', { name: '鼻歌から一曲を作る' })).toBeTruthy();
    expect(screen.getByText('未保存')).toBeTruthy();
    const dirtyClose = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyClose);
    expect(dirtyClose.defaultPrevented).toBe(true);
    await user.click(screen.getByRole('button', { name: /^保存$/ }));
    await waitFor(() => expect(screen.getByText('保存済み')).toBeTruthy());
    const savedClose = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(savedClose);
    expect(savedClose.defaultPrevented).toBe(false);
    await user.click(screen.getByRole('button', { name: /曲の一覧/ }));

    expect(await screen.findByRole('heading', { name: 'Soda Sky' })).toBeTruthy();
    expect(await repository.get('project-soda')).toBeDefined();
  });

  it('switches the same project between Humming Studio and Patchboard', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryProjectRepository()} now={() => '2026-07-22T01:00:00.000Z'} createId={() => 'project-switch'} />);
    await user.click(screen.getByRole('button', { name: '新しい曲' }));
    await user.click(screen.getByRole('radio', { name: /鼻歌をもとに曲を作る/ }));
    await user.clear(screen.getByRole('textbox', { name: '曲の名前' }));
    await user.type(screen.getByRole('textbox', { name: '曲の名前' }), 'Switch Test');
    await user.click(screen.getByRole('button', { name: '鼻歌から始める' }));
    await user.click(screen.getByRole('button', { name: 'PATCHBOARD' }));
    expect(screen.getByRole('heading', { name: '曲の設計' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'HUMMING STUDIO' }));
    expect(screen.getByRole('heading', { name: '鼻歌から一曲を作る' })).toBeTruthy();
  });

  it('creates an editable AI Starter foundation and opens its MIDI score', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryProjectRepository()} now={() => '2026-07-22T08:00:00.000Z'} createId={() => 'project-ai'} />);
    await user.click(screen.getByRole('button', { name: '新しい曲' }));
    await user.click(screen.getByRole('radio', { name: /AIで土台 → 鼻歌を追加/ }));
    await user.clear(screen.getByRole('textbox', { name: '曲の名前' }));
    await user.type(screen.getByRole('textbox', { name: '曲の名前' }), 'AI Playground');
    await user.click(screen.getByRole('button', { name: 'AIで土台を作る' }));

    expect(screen.getByText(/AI Starterの音を、コード・ベース・ドラム等のtrack別に保持/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'MIDI譜面を編集' }));
    expect(screen.getByRole('region', { name: '音程範囲。マウスホイールで上下にスクロール' })).toBeTruthy();
    expect(screen.getByLabelText('編集トラック')).toBeTruthy();
  });

  it('switches three color themes without changing project data and restores the device choice', async () => {
    const user = userEvent.setup();
    const first = render(<App repository={new MemoryProjectRepository()} />);
    const theme = screen.getByLabelText('カラーテーマ');
    await user.selectOptions(theme, 'vanilla-pastel');
    expect(document.documentElement.dataset.theme).toBe('vanilla-pastel');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('patchtone-color-theme-v1')).toBe('vanilla-pastel');

    await user.selectOptions(theme, 'friendly-signal');
    expect(document.documentElement.dataset.theme).toBe('friendly-signal');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    first.unmount();

    render(<App repository={new MemoryProjectRepository()} />);
    expect(screen.getByLabelText<HTMLSelectElement>('カラーテーマ').value).toBe('friendly-signal');
    expect(document.documentElement.dataset.theme).toBe('friendly-signal');
  });

  it('opens shortcut settings beside the theme and saves the current project with Ctrl+S', async () => {
    const user = userEvent.setup();
    const repository = new MemoryProjectRepository();
    render(<App repository={repository} now={() => '2026-07-23T02:00:00.000Z'} createId={() => 'shortcut-project'} />);
    const settings = screen.getByRole('button', { name: '設定' });
    const theme = screen.getByLabelText('カラーテーマ');
    expect(settings.compareDocumentPosition(theme) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(settings);
    expect(screen.getByRole('dialog', { name: 'ショートカット設定' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'ショートカット設定を閉じる' }));

    await user.click(screen.getByRole('button', { name: '新しい曲' }));
    await user.click(screen.getByRole('radio', { name: /AIで土台 → 鼻歌を追加/ }));
    await user.clear(screen.getByRole('textbox', { name: '曲の名前' }));
    await user.type(screen.getByRole('textbox', { name: '曲の名前' }), 'Shortcut Save');
    await user.click(screen.getByRole('button', { name: 'AIで土台を作る' }));
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    await waitFor(async () => expect(await repository.get('shortcut-project')).toBeDefined());
    expect(screen.getByText('保存済み')).toBeTruthy();
  });
});
