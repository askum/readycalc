import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { visibility } from './search-visibility.mjs';

const root = resolve(import.meta.dirname, '..');
const archiveRoot = resolve(root, 'content', 'withdrawn-calculators');
const css = '<link rel="stylesheet" href="/assets/result-receipts.css?v=20261020">';
const script = '<script src="/assets/result-receipts.js?v=20261020" defer></script>';

for (const slug of visibility.excluded) {
  const source = execFileSync('git', ['show', `${visibility.restoreCommit}:calculator/${slug}/index.html`], {
    cwd: root, encoding: 'utf8', maxBuffer: 8_000_000
  });
  if (!source.includes('</head>')) throw new Error(`${slug}: head 종료 태그가 없습니다.`);
  if (!source.includes('name="robots" content="noindex')) throw new Error(`${slug}: 기존 noindex가 없습니다.`);
  if (!source.includes('data-result-content') && !source.includes('data-test-result') && slug !== 'emoji-picker') {
    throw new Error(`${slug}: 결과 화면을 찾지 못했습니다.`);
  }
  const html = source.replace('</head>', `  ${css}\n  ${script}\n</head>`);
  const target = resolve(archiveRoot, slug, 'index.html');
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, html);
}
console.log(`비공개 도구 ${visibility.excluded.length}개의 결과 UI를 배포 차단 보관본에 준비했습니다.`);
