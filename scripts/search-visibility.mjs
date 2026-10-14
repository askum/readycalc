import { readFileSync } from 'node:fs';
export const visibility = JSON.parse(readFileSync(new URL('./search-visibility.json', import.meta.url), 'utf8'));
export const isIndexableTool = slug => visibility.indexable.includes(slug);
const excluded = new Set(visibility.excluded.flatMap(slug => [`/${slug}/`, `/calculator/${slug}/`, `/calculator/${slug}/index.html`]));
export function applySearchVisibility(html, slug) {
  if (visibility.excluded.includes(slug)) {
    html = html.replace(/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*>\n?/gi, '');
    html = html.replace('</head>', '<meta name="robots" content="noindex, follow">\n</head>');
  } else if (visibility.indexable.includes(slug)) {
    html = html.replace(/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*>\n?/gi, '');
  }
  html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (anchor, attrs, content) => {
    const href = attrs.match(/href="([^"]+)"/)?.[1];
    if (!href) return anchor;
    let pathname;
    try { pathname = new URL(href, 'https://readytools.kr').pathname; } catch { return anchor; }
    if (!excluded.has(pathname)) return anchor;
    return /class="[^"]*(?:tool-card)/.test(attrs) ? '' : `<span>${content}</span>`;
  });
  // Hide empty related-tool and category cards after link removal.
  html = html.replace(/<section\b[^>]*>\s*<h[23][^>]*>[^<]*<\/h[23]>\s*<div class="(?:tools-grid|calculator-links)">([\s\S]*?)<\/div>\s*<\/section>/g, (section, body) => body.includes('<a ') ? section : '');
  return html;
}
