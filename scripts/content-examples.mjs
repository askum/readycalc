import { readFileSync } from 'node:fs';

const examples = JSON.parse(readFileSync(new URL('./content-examples.json', import.meta.url), 'utf8'));
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Shared by the page generators so reviewed examples survive regeneration.
export function withContentExamples(html, slug) {
  const entries = examples[slug];
  if (!entries || entries.length !== 3) throw new Error(`Missing three content examples: ${slug}`);
  const section = `<section data-content-examples><h2>구체적인 상황으로 이해하는 활용 예시</h2><p>다음 세 상황은 도구의 처리 과정과 결과 해석을 설명하기 위한 가상 예시입니다. 입력 조건을 바꾸면 결과도 달라지므로 자신의 조건과 비교해 확인하세요.</p>${entries.map(([title, body], index) => `<section class="calculation-example"><h3>${index + 1}. ${escape(title)}</h3><p>${escape(body)}</p></section>`).join('')}</section><!-- content-examples:end -->`;
  const existing = /<section data-content-examples>[\s\S]*?<!-- content-examples:end -->/;
  if (existing.test(html)) return html.replace(existing, () => section);
  const old = /<h2>[^<]*(?:예시|사례|예제)[^<]*<\/h2>\s*<div class="content-grid three">[\s\S]*?<\/div>/;
  if (old.test(html)) return html.replace(old, () => section);
  const personalityAnchor = '<h2>결과를 볼 때 주의할 점</h2>';
  if (html.includes(personalityAnchor)) return html.replace(personalityAnchor, () => section + personalityAnchor);
  throw new Error(`No insertion point: ${slug}`);
}
