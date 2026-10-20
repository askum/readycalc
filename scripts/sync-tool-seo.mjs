import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const descriptions = JSON.parse(fs.readFileSync(path.join(root, 'scripts/tool-seo.json'), 'utf8'));
const { indexable } = JSON.parse(fs.readFileSync(path.join(root, 'scripts/search-visibility.json'), 'utf8'));
const escapeAttr = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const check = process.argv.includes('--check');
if (Object.keys(descriptions).sort().join('|') !== [...indexable].sort().join('|')) throw new Error('SEO 설명과 공개 도구 목록이 일치하지 않습니다.');
let changed = 0;
for (const slug of indexable) {
  const file = path.join(root, 'calculator', slug, 'index.html');
  const original = fs.readFileSync(file, 'utf8');
  const title = original.match(/<title>([^<]+)<\/title>/)?.[1];
  if (!title || !original.includes('rel="canonical"')) throw new Error(`${slug}: title 또는 canonical 누락`);
  const description = escapeAttr(descriptions[slug]);
  let html = original.replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`);
  for (const property of ['og:description', 'twitter:description']) {
    html = html.replace(new RegExp(`(<meta (?:property|name)="${property}" content=")[^"]*(")`), `$1${description}$2`);
  }
  // 공유 화면에도 검색 결과와 같은 고유 제목을 사용한다.
  for (const property of ['og:title', 'twitter:title']) {
    html = html.replace(new RegExp(`(<meta (?:property|name)="${property}" content=")[^"]*(")`), `$1${escapeAttr(title)}$2`);
  }
  if (html !== original) { changed++; if (!check) fs.writeFileSync(file, html); }
}
console.log(`${check ? '검사' : '동기화'} 완료: 공개 도구 ${indexable.length}개, 차이 ${changed}개`);
if (check && changed) process.exitCode = 1;
