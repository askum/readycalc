import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const targetFiles = [
  '404.html',
  'about/index.html',
  'contact/index.html',
  'disclaimer/index.html',
  'methodology/index.html',
  'privacy/index.html',
  'terms/index.html'
];

// search-visibility.json에서 현재 공개 계산기 목록 가져오기
const { indexable } = JSON.parse(fs.readFileSync(path.join(root, 'scripts/search-visibility.json'), 'utf8'));
for (const slug of indexable) {
  targetFiles.push(`calculator/${slug}/index.html`);
}

const adsenseTags = `  <meta name="google-adsense-account" content="ca-pub-4297698834736188">\n  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4297698834736188" crossorigin="anonymous"></script>`;

let updatedCount = 0;

for (const relativePath of targetFiles) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relativePath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('google-adsense-account')) {
    console.log(`Already has AdSense: ${relativePath}`);
    continue;
  }

  // canonical link 뒤에 넣거나, 없다면 <head> 바로 뒤에 삽입
  if (content.includes('rel="canonical"')) {
    content = content.replace(/(<link rel="canonical"[^>]*>)/, `$1\n${adsenseTags}`);
  } else if (content.includes('<head>')) {
    content = content.replace('<head>', `<head>\n${adsenseTags}`);
  } else {
    console.warn(`Cannot find insertion point in: ${relativePath}`);
    continue;
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  updatedCount++;
  console.log(`Updated: ${relativePath}`);
}

console.log(`\n총 ${updatedCount}개 파일에 애드센스 태그를 성공적으로 삽입했습니다.`);
