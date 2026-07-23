import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const matrixPath = path.join(root, 'docs', 'imp', 'phase1-feature-progress-matrix.html');
const html = await readFile(matrixPath, 'utf8');
const errors = [];

for (const required of ['機能 / Phase', 'UI / 操作', '実装 / データ', '動作確認', 'テスト', '運用・外部ゲート', '総合', '残っているブロッカー']) {
  if (!html.includes(required)) errors.push(`required matrix label missing: ${required}`);
}
const rowCount = (html.match(/\{ id:'[^']+', group:'[^']+', name:/g) ?? []).length;
if (rowCount < 18) errors.push(`feature row count is ${rowCount}, expected at least 18`);
const linkMatches = [...html.matchAll(/\['[^']+',\s*'([^']+)'\]/g)].map((match) => match[1]);
for (const link of new Set(linkMatches)) {
  if (/^(?:https?:|#|javascript:)/.test(link)) continue;
  try { await access(path.resolve(path.dirname(matrixPath), link)); } catch { errors.push(`matrix link missing: ${link}`); }
}
if (!html.includes("STORAGE_KEY = 'patchtone-phase1-feature-matrix-v11'")) errors.push('review storage key missing');
for (const required of ['AIが自律的に確認できた上限は★3', '技術列の★3はAI確認済み', 'ユーザーのブラッシュアップが完了したら★4', 'AIの詰めまで完了したら★5', '意図的な保留', '60分DAW']) {
  if (!html.includes(required)) errors.push(`matrix scoring definition missing: ${required}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({ matrix: 'phase1-feature-progress-matrix.html', rows: rowCount, localLinks: new Set(linkMatches).size, valid: true }, null, 2));
