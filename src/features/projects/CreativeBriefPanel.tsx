import { useMemo, useState } from 'react';
import {
  createAbcChordScore,
  createCreativeBriefJson,
  createCreativeBriefMarkdown,
  createPromptFragment,
  creativeBriefFileStem,
} from '../../application/projects/creative-brief';
import { downloadBlob } from '../../application/projects/project-bundle';
import type { Project } from '../../domain/music';
import type { CreativeBriefScope } from '../../application/projects/creative-brief';

interface CreativeBriefPanelProps {
  project: Project;
  scope: CreativeBriefScope;
  onProjectExport?: () => void;
}

const SCOPE_LABELS: Record<CreativeBriefScope, { accessibleName: string; copyLabel: string }> = {
  song: { accessibleName: '曲の設計を書き出す', copyLabel: '設計Prompt' },
  sounds: { accessibleName: '音の役割を書き出す', copyLabel: '音の役割' },
  arrangement: { accessibleName: '曲の展開を書き出す', copyLabel: '展開Prompt' },
  melody: { accessibleName: '楽器メロディを書き出す', copyLabel: '主線Prompt' },
  chords: { accessibleName: 'コード譜を書き出す', copyLabel: 'コード譜' },
};

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboardへコピーできませんでした。file保存を利用してください。');
}

export function CreativeBriefPanel({ project, scope, onProjectExport }: CreativeBriefPanelProps) {
  const labels = SCOPE_LABELS[scope];
  const prompt = useMemo(() => createPromptFragment(project, scope), [project, scope]);
  const [status, setStatus] = useState<string | null>(null);
  const stem = creativeBriefFileStem(project);
  const saveText = (content: string, suffix: string, type = 'text/plain;charset=utf-8') => {
    downloadBlob(new Blob([content], { type }), `${stem}${suffix}`);
    setStatus(`${stem}${suffix} を保存しました。`);
  };
  const copy = async () => {
    try {
      await copyText(prompt);
      setStatus('この画面のInstrumental Promptをコピーしました。');
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : 'Promptをコピーできませんでした。');
    }
  };
  return (
    <section className="creative-brief-panel" data-scope={scope} aria-label={labels.accessibleName}>
      <div className="creative-brief-copy">
        <small>固定制約: INSTRUMENTAL ONLY · NO VOCALS · NO LYRICS</small>
      </div>
      <div className="creative-brief-actions">
        <button className="button button-primary" type="button" onClick={() => void copy()}>{labels.copyLabel}をコピー</button>
        <button className="button" type="button" onClick={() => saveText(prompt, `-${scope}-prompt.txt`)}>Prompt .txt</button>
        {scope === 'chords' && <button className="button" type="button" onClick={() => saveText(createAbcChordScore(project), '-chords.abc', 'text/vnd.abc;charset=utf-8')}>ABC譜</button>}
        {scope === 'song' && <>
          <button className="button" type="button" onClick={() => saveText(createCreativeBriefMarkdown(project), '-creative-brief.md', 'text/markdown;charset=utf-8')}>設計書 .md</button>
          <button className="button" type="button" onClick={() => saveText(createCreativeBriefJson(project), '-creative-brief.json', 'application/json;charset=utf-8')}>AI用 .json</button>
          <button className="button" type="button" onClick={() => saveText(createAbcChordScore(project), '-chords.abc', 'text/vnd.abc;charset=utf-8')}>コード譜 .abc</button>
          {onProjectExport && <button className="button" type="button" onClick={onProjectExport}>安全保存 .mctproj</button>}
        </>}
      </div>
      <details className="creative-brief-preview">
        <summary>出力内容を確認</summary>
        <pre>{prompt}</pre>
      </details>
      {status && <p className="creative-brief-status" role="status">{status}</p>}
    </section>
  );
}
