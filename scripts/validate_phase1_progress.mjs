import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markdown = await readFile(path.join(root, 'docs/imp/phase1-progress.md'), 'utf8');
const html = await readFile(path.join(root, 'docs/imp/phase1-progress.html'), 'utf8');

const markdownRows = new Map();
for (const match of markdown.matchAll(/^\|\s*[^|]+\|\s*(P1-[A-Z]+)\s*\|\s*(\d+)\s*\|\s*([a-z-]+)\s*\|/gm)) {
  markdownRows.set(match[1], { weight: Number(match[2]), status: match[3] });
}

const htmlRows = new Map();
for (const match of html.matchAll(/data-unit-id="(P1-[A-Z]+)"\s+data-status="([a-z-]+)"\s+data-weight="(\d+)"/g)) {
  htmlRows.set(match[1], { weight: Number(match[3]), status: match[2] });
}

const errors = [];
if (markdownRows.size !== 16) errors.push(`Markdown unit count is ${markdownRows.size}, expected 16`);
if (htmlRows.size !== markdownRows.size) errors.push(`HTML unit count ${htmlRows.size} != Markdown ${markdownRows.size}`);

for (const [id, expected] of markdownRows) {
  const actual = htmlRows.get(id);
  if (!actual) errors.push(`${id} missing in HTML`);
  else if (actual.weight !== expected.weight || actual.status !== expected.status) {
    errors.push(`${id} drift: Markdown ${JSON.stringify(expected)} HTML ${JSON.stringify(actual)}`);
  }
}

const totalWeight = [...markdownRows.values()].reduce((sum, row) => sum + row.weight, 0);
if (totalWeight !== 100) errors.push(`Total weight is ${totalWeight}, expected 100`);
if (!html.includes('<meta name="viewport"')) errors.push('HTML viewport meta missing');
if (!html.includes('aria-label="Phase 1 unit一覧"')) errors.push('HTML accessible table label missing');
if ((html.match(/<script>/g) ?? []).length !== 1) errors.push('Unexpected script count');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({ units: markdownRows.size, totalWeight, htmlSynchronized: true }, null, 2));

