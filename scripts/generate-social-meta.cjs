/*
 * 공개 HTML의 소셜 메타 태그를 정규화하고 페이지별 OG 이미지를 생성합니다.
 * 실행 예시:
 * NODE_PATH=/path/to/node_modules node scripts/generate-social-meta.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OG_DIR = path.join(ROOT, 'assets', 'og');
const SITE_URL = 'https://readytools.kr';
const palettes = [
  ['#063c32', '#087f5b', '#d8f3e8'],
  ['#17324d', '#2166a5', '#dcecff'],
  ['#4b2e1f', '#b05b2e', '#ffeadf'],
  ['#35235e', '#7257b7', '#eee7ff'],
  ['#4b3b05', '#b38305', '#fff2bd'],
  ['#143b44', '#2a8799', '#d9f4f8']
];

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, output);
    else if (entry.name === 'index.html') output.push(fullPath);
  }
  return output;
}

function getMatch(html, expression) {
  return (html.match(expression) || [])[1]?.trim() || '';
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setMeta(html, attribute, name, content) {
  const expression = new RegExp(`<meta\\s+${attribute}=["']${escapeRegExp(name)}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${name}" content="${escapeHtml(content)}">`;
  if (expression.test(html)) return html.replace(expression, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function routeName(canonical) {
  const route = new URL(canonical).pathname.replace(/^\/+|\/+$/g, '');
  return route ? route.replaceAll('/', '-') : 'home';
}

function displayTitle(title, canonical) {
  if (new URL(canonical).pathname === '/') return '생활계산소';
  return title.replace(/\s*\|\s*생활계산소\s*$/u, '').trim();
}

function splitLines(text, limit, maxLines) {
  const tokens = text.split(/\s+/u).filter(Boolean);
  const lines = [];
  let line = '';
  for (const token of tokens) {
    const next = line ? `${line} ${token}` : token;
    if ([...next].length <= limit) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = token;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const consumed = lines.join(' ').length;
  if (consumed < text.length && lines.length) {
    const last = [...lines.at(-1)];
    lines[lines.length - 1] = `${last.slice(0, Math.max(1, limit - 1)).join('')}…`;
  }
  return lines;
}

function stablePalette(value) {
  let hash = 0;
  for (const char of value) hash = ((hash << 5) - hash + char.codePointAt(0)) | 0;
  return palettes[Math.abs(hash) % palettes.length];
}

function buildSvg(title, description, canonical) {
  const [dark, accent, pale] = stablePalette(canonical);
  const titleLines = splitLines(title, 24, 2);
  const descriptionLines = splitLines(description, 46, 2);
  const titleMarkup = titleLines.map((line, index) =>
    `<tspan x="74" dy="${index === 0 ? 0 : 78}">${escapeHtml(line)}</tspan>`
  ).join('');
  const descriptionMarkup = descriptionLines.map((line, index) =>
    `<tspan x="78" dy="${index === 0 ? 0 : 38}">${escapeHtml(line)}</tspan>`
  ).join('');

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${pale}"/>
        <stop offset="1" stop-color="#ffffff"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" rx="42" fill="url(#bg)"/>
    <rect x="38" y="38" width="1124" height="554" rx="34" fill="#ffffff" fill-opacity="0.84" stroke="${accent}" stroke-width="3"/>
    <circle cx="1080" cy="118" r="88" fill="${accent}" fill-opacity="0.13"/>
    <circle cx="1048" cy="524" r="142" fill="${dark}" fill-opacity="0.06"/>
    <text x="76" y="112" fill="${accent}" font-family="Apple SD Gothic Neo, Noto Sans CJK KR, sans-serif" font-size="30" font-weight="700" letter-spacing="2">READYTOOLS · 생활계산소</text>
    <text x="74" y="250" fill="${dark}" font-family="Apple SD Gothic Neo, Noto Sans CJK KR, sans-serif" font-size="64" font-weight="800">${titleMarkup}</text>
    <text x="78" y="430" fill="#50645f" font-family="Apple SD Gothic Neo, Noto Sans CJK KR, sans-serif" font-size="29" font-weight="500">${descriptionMarkup}</text>
    <rect x="76" y="522" width="310" height="52" rx="26" fill="${accent}"/>
    <text x="231" y="557" text-anchor="middle" fill="#ffffff" font-family="Apple SD Gothic Neo, Noto Sans CJK KR, sans-serif" font-size="23" font-weight="700">브라우저에서 바로 사용</text>
    <text x="1120" y="557" text-anchor="end" fill="${dark}" font-family="Arial, sans-serif" font-size="23" font-weight="700">readytools.kr</text>
  </svg>`;
}

async function main() {
  fs.mkdirSync(OG_DIR, { recursive: true });
  const files = walk(ROOT).sort();

  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    const title = getMatch(html, /<title>([\s\S]*?)<\/title>/i);
    const description = getMatch(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    const canonical = getMatch(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
    const ogTitle = getMatch(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i) || title;
    const ogDescription = getMatch(html, /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i) || description;

    if (!title || !description || !canonical) {
      throw new Error(`필수 메타 정보가 없습니다: ${path.relative(ROOT, file)}`);
    }

    const slug = routeName(canonical);
    const imageUrl = `${SITE_URL}/assets/og/${slug}.png`;
    const imagePath = path.join(OG_DIR, `${slug}.png`);
    const socialTitle = displayTitle(ogTitle, canonical);
    const imageAlt = `${socialTitle} - 생활계산소`;

    await sharp(Buffer.from(buildSvg(socialTitle, ogDescription, canonical)))
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 90 })
      .toFile(imagePath);

    html = setMeta(html, 'property', 'og:type', 'website');
    html = setMeta(html, 'property', 'og:locale', 'ko_KR');
    html = setMeta(html, 'property', 'og:site_name', '생활계산소');
    html = setMeta(html, 'property', 'og:title', ogTitle);
    html = setMeta(html, 'property', 'og:description', ogDescription);
    html = setMeta(html, 'property', 'og:url', canonical);
    html = setMeta(html, 'property', 'og:image', imageUrl);
    html = setMeta(html, 'property', 'og:image:type', 'image/png');
    html = setMeta(html, 'property', 'og:image:width', '1200');
    html = setMeta(html, 'property', 'og:image:height', '630');
    html = setMeta(html, 'property', 'og:image:alt', imageAlt);
    html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
    html = setMeta(html, 'name', 'twitter:title', ogTitle);
    html = setMeta(html, 'name', 'twitter:description', ogDescription);
    html = setMeta(html, 'name', 'twitter:image', imageUrl);
    html = setMeta(html, 'name', 'twitter:image:alt', imageAlt);
    html = setMeta(html, 'name', 'twitter:domain', 'readytools.kr');

    fs.writeFileSync(file, html);
  }

  console.log(`${files.length}개 HTML 메타와 OG 이미지를 갱신했습니다.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
