import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const baseUrl = 'https://readytools.kr';
const reviewed = '2026-09-11';
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const option = (value, label) => `<option value="${value}">${label}</option>`;
const field = (id, label, control, hint = '', attributes = '') => `<div class="field" ${attributes}><label for="${id}">${label}</label>${control}${hint ? `<p class="hint">${hint}</p>` : ''}<p class="error" id="${id}-error" aria-live="assertive"></p></div>`;
const textarea = (name, placeholder) => field(`dev-${name}`, '입력 데이터', `<textarea id="dev-${name}" name="${name}" rows="12" maxlength="500000" spellcheck="false" autocomplete="off" aria-describedby="dev-${name}-error" placeholder="${escape(placeholder)}"></textarea>`, '최대 500,000자이며 입력 내용은 서버로 전송하지 않습니다.');
const select = (name, label, options, attributes = '') => field(`dev-${name}`, label, `<select id="dev-${name}" name="${name}">${options.map(([value,label]) => option(value,label)).join('')}</select>`, '', attributes);
const input = (name, label, placeholder, type = 'text', attributes = '') => field(`dev-${name}`, label, `<input id="dev-${name}" name="${name}" type="${type}" placeholder="${escape(placeholder)}" aria-describedby="dev-${name}-error">`, '', attributes);

const commonFaqs = [
  ['입력한 데이터가 서버에 저장되나요?', '아니요. 입력과 변환은 현재 브라우저의 JavaScript에서만 처리합니다. 원문과 결과를 서버나 데이터베이스로 전송하지 않으며 localStorage에도 저장하지 않습니다.'],
  ['큰 파일이나 긴 코드를 넣어도 되나요?', '브라우저 멈춤과 메모리 사용을 줄이기 위해 텍스트 입력은 500,000자로 제한합니다. 대용량 로그나 프로젝트 전체 파일은 전용 로컬 개발 도구에서 나누어 처리하세요.']
];

const tools = [
  {
    slug:'json-diff', name:'JSON Diff 비교기', icon:'🔀', title:'JSON Diff 비교기 | 두 JSON 차이 찾기', description:'두 JSON 객체와 배열을 브라우저에서 비교해 추가, 삭제, 변경된 경로와 값을 찾는 무료 JSON Diff 도구입니다.', eyebrow:'Compare structured data', intro:'두 JSON의 구조와 값을 재귀적으로 비교해 달라진 경로를 추가·삭제·변경으로 구분합니다.',
    form:`${field('dev-left','기준 JSON',`<textarea id="dev-left" name="left" rows="12" maxlength="500000" spellcheck="false" aria-describedby="dev-left-error" placeholder="{&quot;name&quot;:&quot;이전&quot;,&quot;active&quot;:true}"></textarea>`)}${field('dev-right','비교 JSON',`<textarea id="dev-right" name="right" rows="12" maxlength="500000" spellcheck="false" aria-describedby="dev-right-error" placeholder="{&quot;name&quot;:&quot;이후&quot;,&quot;active&quot;:false}"></textarea>`)}`,
    principle:'JSON Diff는 두 텍스트를 줄 단위로 대조하는 대신 먼저 표준 JSON 문법으로 해석한 뒤 객체의 키와 배열 인덱스를 따라 재귀적으로 이동합니다. 한쪽에만 존재하는 키는 추가 또는 삭제, 양쪽에 있지만 값이나 자료형이 다른 항목은 변경으로 표시합니다. 경로는 루트를 뜻하는 $에서 시작하고 객체 키는 점, 배열 위치는 대괄호로 표현하므로 API 응답의 어느 위치가 달라졌는지 찾기 쉽습니다. 객체 키 순서나 공백·줄바꿈은 데이터 의미가 아니므로 차이로 계산하지 않습니다.',
    practice:'배포 전후 API 응답을 비교하거나 설정 파일 두 버전의 차이를 검토할 때 유용합니다. 배열은 순서가 의미 있는 데이터로 취급하므로 같은 객체가 다른 인덱스로 이동하면 여러 변경으로 보일 수 있습니다. 결과가 많으면 먼저 상위 경로를 확인하고, 예상하지 못한 자료형 변경이나 삭제 항목을 우선 검토하세요. JSON Schema 검증이나 의미 기반 배열 매칭은 제공하지 않으므로 계약 검증이 필요할 때는 별도의 테스트와 함께 사용해야 합니다.',
    examples:['API v1과 v2 응답에서 새 필드와 삭제된 필드를 찾습니다.','개발·운영 환경 설정 JSON의 값 차이를 경로별로 검토합니다.','테스트 예상값과 실제 결과에서 달라진 배열 인덱스를 확인합니다.'],
    caution:'비밀키, 액세스 토큰과 개인정보가 포함된 JSON은 공동 화면이나 클립보드에 남기지 마세요. 중복 키가 있는 JSON은 파싱 과정에서 마지막 값만 남을 수 있고, 배열 항목의 위치 이동은 단순 값 변경처럼 보일 수 있습니다. 결과는 검토 보조 자료이며 데이터 마이그레이션 명령을 자동으로 만들거나 적용하지 않습니다.',
    faqs:[['공백이나 들여쓰기 차이도 표시하나요?','아니요. JSON 값으로 파싱한 뒤 비교하므로 보기 형식만 다른 경우에는 동일하게 판단합니다.'],['배열 순서가 바뀌면 어떻게 되나요?','배열은 인덱스별로 비교하므로 순서가 바뀌면 해당 위치의 변경으로 표시됩니다.'],['JSON 문법 오류도 찾을 수 있나요?','각 입력을 파싱할 때 오류 위치에 관한 브라우저 메시지를 보여주지만 완전한 린터나 스키마 검사기는 아닙니다.']]
  },
  {
    slug:'json-csv-converter', name:'JSON ↔ CSV 변환기', icon:'🧾', title:'JSON CSV 변환기 | JSON ↔ CSV 무료 변환', description:'객체 배열 JSON을 CSV로, 헤더가 있는 CSV를 JSON 배열로 브라우저에서 양방향 변환하고 결과를 복사합니다.', eyebrow:'Move tabular data', intro:'표 형태 데이터를 JSON 객체 배열과 CSV 사이에서 변환하고 따옴표·쉼표·줄바꿈을 안전하게 처리합니다.',
    form:`${select('operation','변환 방향',[['json-to-csv','JSON → CSV'],['csv-to-json','CSV → JSON']])}${textarea('source','[{"name":"Kim","score":90},{"name":"Lee","score":85}]')}`,
    principle:'JSON에서 CSV로 바꿀 때는 객체 배열 전체의 키를 모아 첫 행의 헤더로 만들고 각 객체의 값을 같은 열 순서로 배치합니다. 쉼표, 큰따옴표 또는 줄바꿈이 들어간 셀은 RFC 4180에서 널리 사용하는 방식처럼 큰따옴표로 감싸고 내부 따옴표를 두 번 적습니다. CSV에서 JSON으로 바꿀 때는 첫 행을 키 이름으로 사용하고 각 다음 행을 객체 하나로 만듭니다. 명확한 숫자·true·false·null은 기본 자료형으로 추론하며 JSON처럼 보이는 셀은 파싱을 시도합니다.',
    practice:'스프레드시트에서 내보낸 CSV를 API 테스트용 JSON으로 만들거나, API 응답의 객체 배열을 표 계산 프로그램에서 열기 위한 CSV로 만들 때 사용할 수 있습니다. 중첩 객체와 배열은 한 셀 안의 JSON 문자열로 유지되므로 완전한 평탄화 도구와 결과가 다릅니다. CSV에는 문자 인코딩과 구분자에 여러 관례가 있으며 이 도구는 UTF-8 텍스트와 쉼표 구분을 기준으로 합니다. Excel에서 열 때 한글이 깨지면 UTF-8 가져오기 옵션을 선택하세요.',
    examples:['회원 객체 배열을 CSV로 바꿔 스프레드시트에서 검토합니다.','CSV 테스트 데이터를 JSON 배열로 만들어 프런트엔드 목 데이터로 사용합니다.','쉼표가 포함된 상품명과 여러 줄 메모가 올바르게 인용되는지 확인합니다.'],
    caution:'CSV 수식으로 해석될 수 있는 =, +, -, @ 시작 값은 스프레드시트에서 열 때 보안 위험이 될 수 있습니다. 신뢰할 수 없는 데이터를 배포하거나 공유하기 전에 셀 내용을 검토하세요. 열마다 복잡한 중첩 구조가 다르면 CSV로 표현하기 어려우며 변환 후 행과 헤더 정렬을 반드시 확인해야 합니다.',
    faqs:[['어떤 JSON 구조를 CSV로 바꿀 수 있나요?','최상위 값이 객체로 구성된 배열이어야 합니다. 중첩 값은 JSON 문자열 한 셀로 기록합니다.'],['CSV의 첫 행은 어떻게 사용되나요?','첫 행을 JSON 객체의 키로 사용하며 비어 있거나 중복된 헤더는 오류로 처리합니다.'],['세미콜론 구분 CSV도 지원하나요?','현재는 쉼표 구분 CSV를 기준으로 합니다. 세미콜론 구분 파일은 먼저 구분자를 변환해야 합니다.']]
  },
  {
    slug:'xml-tools', name:'XML Formatter·JSON 변환기', icon:'🧩', title:'XML Formatter 및 XML JSON 변환기', description:'XML 문서를 정리하고 XML과 JSON을 브라우저에서 양방향 변환하는 무료 개발자 도구입니다.', eyebrow:'Inspect markup data', intro:'XML 문법을 검사해 보기 좋게 정리하고 속성·텍스트·반복 요소를 보존하는 규칙으로 JSON과 변환합니다.',
    form:`${select('operation','작업 선택',[['format','XML Formatter'],['xml-to-json','XML → JSON'],['json-to-xml','JSON → XML']])}${textarea('source','<catalog><item id="1">샘플</item></catalog>')}`,
    principle:'XML Formatter는 브라우저 DOMParser로 문법을 검사하고 XMLSerializer로 표준화한 뒤 요소의 깊이에 따라 들여쓰기를 적용합니다. XML을 JSON으로 바꿀 때 요소 이름은 객체 키, 속성은 @로 시작하는 키, 요소 사이의 텍스트는 #text로 표시합니다. 이름이 같은 자식 요소가 반복되면 배열로 만듭니다. JSON에서 XML로 돌아갈 때도 같은 규칙을 사용하므로 단순한 문서 구조는 왕복 변환하기 쉽습니다. XML 네임스페이스와 혼합 콘텐츠처럼 복잡한 구조는 일반 객체 모델과 정확히 일대일 대응하지 않을 수 있습니다.',
    practice:'레거시 API 응답, RSS 일부, 설정 문서와 전자문서 샘플을 읽기 쉽게 정리할 때 사용할 수 있습니다. JSON 변환 결과에서 @id는 XML 속성 id, #text는 해당 요소의 직접 텍스트를 의미합니다. JSON에서 XML을 만들 때는 최상위 루트 키가 정확히 하나 있어야 합니다. 변환은 구조 확인과 테스트 데이터 준비를 위한 보조 기능이며 XSD 검증, XPath 실행, 디지털 서명 또는 네임스페이스 스키마 검사를 수행하지 않습니다.',
    examples:['한 줄 XML API 응답을 들여쓰기해 계층을 확인합니다.','반복되는 item 요소를 JSON 배열로 바꿔 프런트엔드 테스트에 사용합니다.','@ 속성과 #text 규칙으로 만든 JSON을 다시 XML 문서로 변환합니다.'],
    caution:'DOCTYPE, 외부 엔터티, 복잡한 네임스페이스와 혼합 콘텐츠는 대상 시스템에서 반드시 재검증하세요. 포매팅 과정에서 선언부 표현이나 빈 요소 표기가 달라질 수 있지만 의미는 같을 수 있습니다. 서명된 XML은 공백과 직렬화 변화로 검증이 실패할 수 있으므로 이 도구로 다시 저장하면 안 됩니다.',
    faqs:[['XML 속성은 JSON에서 어떻게 표시되나요?','속성 이름 앞에 @를 붙입니다. 예를 들어 id 속성은 @id 키가 됩니다.'],['같은 이름의 요소가 반복되면 어떻게 되나요?','같은 부모 안에서 반복되는 요소는 JSON 배열로 변환합니다.'],['XSD 스키마 검증도 하나요?','아니요. XML 문법을 파싱하지만 XSD나 DTD 규칙에 따른 유효성 검사는 제공하지 않습니다.']]
  },
  {
    slug:'yaml-json-converter', name:'YAML ↔ JSON 변환기', icon:'📐', title:'YAML JSON 변환기 | 기본 YAML ↔ JSON', description:'일반적인 YAML 매핑과 목록을 JSON으로, JSON을 읽기 쉬운 기본 YAML로 브라우저에서 변환합니다.', eyebrow:'Convert config data', intro:'설정 파일에서 자주 쓰는 매핑·목록·문자열·숫자·불리언을 YAML과 JSON 사이에서 변환합니다.',
    form:`${select('operation','변환 방향',[['yaml-to-json','YAML → JSON'],['json-to-yaml','JSON → YAML']])}${textarea('source','name: readytools\nactive: true\ntags:\n  - web\n  - tool')}`,
    principle:'YAML은 들여쓰기와 여러 확장 기능을 가진 넓은 형식이므로 이 도구는 브라우저에서 안전하게 구현할 수 있는 기본 부분집합을 명확히 지원합니다. key: value 형태의 매핑, 하이픈 목록, 중첩 들여쓰기, 문자열·숫자·불리언·null을 읽고 JSON 구조로 바꿉니다. 반대 방향에서는 JSON 객체와 배열을 공백 두 칸 들여쓰기의 기본 YAML로 출력하고, 예약 문자나 자료형으로 오해할 수 있는 문자열에는 따옴표를 붙입니다. 앵커, 별칭, 태그, 병합 키와 여러 줄 블록 문자열은 지원하지 않습니다.',
    practice:'간단한 배포 설정, 예제 구성 파일과 문서의 YAML 조각을 JSON 기반 도구에서 사용할 때 편리합니다. 들여쓰기는 탭이 아니라 공백을 사용하고 같은 단계에서는 폭을 일관되게 유지해야 합니다. 전체 Kubernetes 매니페스트나 CI 설정처럼 앵커·블록 문자열·여러 문서 구분자를 사용하는 파일은 전문 YAML 파서를 사용하세요. 변환 결과는 대상 프로그램의 스키마와 자료형 규칙을 다시 확인해야 합니다.',
    examples:['간단한 앱 설정 YAML을 JSON으로 바꿔 API 요청 본문을 만듭니다.','문서에 있는 JSON 예제를 읽기 쉬운 YAML로 변환합니다.','숫자처럼 보이는 문자열이 따옴표로 보호되는지 확인합니다.'],
    caution:'YAML 1.1과 1.2는 일부 값의 자료형 해석이 다르고, 서비스마다 확장 태그를 사용합니다. 이 도구는 완전한 YAML 호환성을 주장하지 않으며 지원하지 않는 문법을 발견하면 오류를 표시합니다. 인증 정보가 포함된 설정은 화면 공유와 클립보드 기록에 남지 않도록 주의하세요.',
    faqs:[['모든 YAML 문법을 지원하나요?','아니요. 매핑, 목록, 기본 스칼라와 중첩 들여쓰기를 지원하며 앵커·태그·블록 문자열은 제외합니다.'],['탭으로 들여써도 되나요?','권장하지 않습니다. YAML 들여쓰기는 공백을 사용해야 하며 이 도구도 공백 기준으로 분석합니다.'],['여러 YAML 문서를 한 번에 바꿀 수 있나요?','현재 ---로 구분된 다중 문서는 지원하지 않습니다. 문서별로 나누어 변환하세요.']]
  },
  {
    slug:'html-tools', name:'HTML Formatter·Encoder', icon:'🌐', title:'HTML Formatter 및 HTML Encoder Decoder', description:'HTML 코드를 들여쓰기하고 특수 문자를 HTML 엔티티로 인코딩하거나 디코딩하는 무료 브라우저 도구입니다.', eyebrow:'Format and escape HTML', intro:'HTML 조각을 읽기 좋게 정리하고 태그 문자를 안전한 엔티티 표현과 일반 텍스트 사이에서 변환합니다.',
    form:`${select('operation','작업 선택',[['format','HTML Formatter'],['encode','HTML Encoder'],['decode','HTML Decoder']])}${textarea('source','<section><h1>제목</h1><p>본문</p></section>')}`,
    principle:'HTML Formatter는 태그, 주석과 텍스트 토큰을 구분하고 여는 태그와 닫는 태그의 깊이에 맞춰 공백 두 칸을 넣습니다. img, br, meta처럼 닫는 태그가 없는 void 요소는 깊이를 늘리지 않습니다. HTML Encoder는 &, <, >, 큰따옴표와 작은따옴표를 각각 엔티티로 바꾸어 코드 자체를 문서 안에 텍스트로 표시할 수 있게 합니다. Decoder는 엔티티를 원래 문자로 돌립니다. 인코딩은 브라우저 보안 정책을 대신하지 않으며 출력 위치에 맞는 escaping이 필요합니다.',
    practice:'블로그나 기술 문서에 HTML 예제를 그대로 보여주려면 Encoder로 태그 문자를 변환할 수 있습니다. CMS에서 받은 엔티티 문자열을 읽기 위해 Decoder를 사용하고, 압축된 간단한 마크업은 Formatter로 구조를 확인합니다. script, style, pre 안의 내용이나 템플릿 문법은 일반 태그와 다른 규칙을 가지므로 자동 정리 후 반드시 원본과 비교하세요. HTML 유효성 검사와 접근성 검사는 별도의 검사 도구가 필요합니다.',
    examples:['한 줄 HTML 컴포넌트를 여러 단계로 들여쓰기합니다.','<button> 예제를 문서에 표시하도록 &lt;button&gt;으로 인코딩합니다.','API에서 받은 &amp;amp; 같은 엔티티 문자열을 한 단계 디코딩합니다.'],
    caution:'디코딩한 HTML을 innerHTML로 바로 삽입하면 XSS 위험이 생길 수 있습니다. 신뢰할 수 없는 문자열은 출력 맥락에 맞는 검증과 sanitizing을 거쳐야 합니다. 포매터는 완전한 HTML 파서나 코드 포매터가 아니므로 스크립트 안의 비교 연산자, 서버 템플릿과 잘못 닫힌 태그를 정확히 처리하지 못할 수 있습니다.',
    faqs:[['HTML 인코딩과 URL 인코딩은 같은가요?','아니요. HTML 인코딩은 태그와 속성 문맥의 특수 문자를 엔티티로, URL 인코딩은 주소 구성 문자를 퍼센트 표기로 바꿉니다.'],['포매팅하면 HTML 동작이 바뀌나요?','일반 요소에서는 주로 공백만 바뀌지만 pre, script, style과 공백에 민감한 템플릿은 달라질 수 있어 테스트가 필요합니다.'],['디코딩 결과를 바로 웹페이지에 넣어도 되나요?','신뢰할 수 없는 입력은 안 됩니다. XSS 방지를 위한 검증과 문맥별 escaping이 별도로 필요합니다.']]
  },
  {
    slug:'css-minifier', name:'CSS Minifier', icon:'🎛️', title:'CSS Minifier | CSS 공백·주석 압축', description:'CSS의 불필요한 공백과 주석을 브라우저에서 제거해 코드 길이를 줄이는 무료 CSS Minifier입니다.', eyebrow:'Trim stylesheet text', intro:'문자열을 보존하면서 일반 주석과 구분자 주변 공백을 줄여 간단한 CSS 배포본을 만듭니다.', form:`${textarea('source','/* 카드 */\n.card {\n  color: #17312b;\n  padding: 16px;\n}')}`,
    principle:'CSS Minifier는 코드 바깥의 /* ... */ 주석을 제거하고 중복 공백을 하나로 줄인 다음 중괄호, 콜론, 세미콜론과 선택자 결합자 주변의 불필요한 공백을 정리합니다. 따옴표 안의 문자열과 역슬래시 이스케이프는 그대로 유지해 content 속성과 URL 조각이 손상될 가능성을 낮춥니다. 마지막 선언 뒤의 세미콜론도 제거합니다. AST 기반 빌드 도구처럼 색상 축약, 계산식 최적화, 중복 규칙 병합이나 공급업체 접두사 관리는 수행하지 않습니다.',
    practice:'작은 데모 파일이나 이메일 템플릿의 CSS 길이를 빠르게 줄이고, 원본 대비 감소량을 확인할 때 적합합니다. 실제 서비스에서는 소스맵, 브라우저 호환성 처리와 캐시 무효화가 중요하므로 프로젝트 빌드 파이프라인의 전문 minifier가 더 적합합니다. 결과를 적용한 뒤 주요 브라우저와 반응형 구간에서 레이아웃, 애니메이션, CSS 변수와 calc 표현식을 다시 테스트하세요.',
    examples:['주석과 줄바꿈이 많은 작은 스타일 조각을 한 줄로 만듭니다.','HTML 이메일에 삽입할 CSS의 문자 수를 줄입니다.','원본과 압축본의 길이를 비교해 전달 크기 절감 가능성을 확인합니다.'],
    caution:'라이선스 고지 주석, CSS 해킹, 공백에 민감한 사용자 정의 구문은 제거되거나 의미가 달라질 수 있습니다. 결과를 원본 대신 유일한 파일로 보관하지 말고 버전 관리에는 읽기 쉬운 소스를 유지하세요. 이 기능은 gzip·Brotli 전송 압축과 다르며 실제 네트워크 크기는 서버 압축 설정에 따라 달라집니다.',
    faqs:[['CSS 파일 자체를 업로드할 수 있나요?','현재는 텍스트를 붙여 넣는 방식이며 파일 내용은 브라우저 밖으로 전송되지 않습니다.'],['중요 주석도 유지되나요?','현재 일반 주석을 모두 제거하므로 라이선스나 고지 주석은 별도로 보관해야 합니다.'],['전송 압축도 적용되나요?','아니요. 코드 문자 수를 줄일 뿐이며 gzip과 Brotli는 호스팅 서버에서 설정해야 합니다.']]
  },
  {
    slug:'sql-formatter', name:'SQL Formatter', icon:'🗄️', title:'SQL Formatter | SQL 쿼리 정리', description:'SELECT, JOIN, WHERE 등 일반 SQL 키워드를 기준으로 쿼리를 읽기 좋게 정리하는 무료 브라우저 SQL Formatter입니다.', eyebrow:'Read queries faster', intro:'문자열 리터럴을 보호하면서 주요 SQL 절과 논리 조건을 줄바꿈하고 키워드를 대문자로 정리합니다.', form:`${textarea('source',"select u.id,u.name from users u left join orders o on u.id=o.user_id where u.active=true and o.total>10000 order by o.created_at desc")}`,
    principle:'SQL Formatter는 먼저 작은따옴표, 큰따옴표와 백틱으로 감싼 리터럴을 임시로 분리해 내부 텍스트를 바꾸지 않도록 합니다. 이후 SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY 같은 주요 절을 대문자로 바꾸고 앞에서 줄바꿈하며 AND와 OR 조건은 한 단계 들여씁니다. 쉼표 뒤의 공백도 일관되게 정리합니다. SQL은 데이터베이스마다 문법과 인용 규칙이 다르므로 이 결과는 가독성을 위한 기본 형식이며 구문 트리 기반 검증 결과가 아닙니다.',
    practice:'로그에 한 줄로 남은 조회문을 읽거나 코드 리뷰에서 JOIN과 필터 조건의 위치를 빠르게 파악할 때 유용합니다. MySQL, PostgreSQL, SQLite, SQL Server와 Oracle은 함수, LIMIT 문법, 식별자 인용과 프로시저 문법이 서로 다릅니다. 포매팅 전후 쿼리의 실행 의미가 같아야 하지만 복잡한 저장 프로시저, 달러 인용 문자열과 방언별 연산자는 전문 포매터로 다시 확인하세요. 이 도구는 데이터베이스에 연결하거나 쿼리를 실행하지 않습니다.',
    examples:['긴 SELECT 문에서 FROM·JOIN·WHERE 절을 줄별로 구분합니다.','코드 리뷰 전에 AND 조건을 나눠 누락된 필터를 찾습니다.','로그의 INSERT 또는 UPDATE 문을 읽기 쉬운 형태로 복사합니다.'],
    caution:'입력한 SQL은 실행되지 않으므로 문법 오류, 권한, 인덱스 사용과 성능 문제를 판단할 수 없습니다. 실제 DB에서 실행하기 전에 트랜잭션 범위와 WHERE 조건을 직접 검토하세요. 특히 UPDATE와 DELETE는 백업과 테스트 환경 없이 실행하면 데이터를 잃을 수 있습니다.',
    faqs:[['SQL 문법 오류도 검사하나요?','아니요. 주요 키워드를 정리하지만 데이터베이스 방언별 구문 검증이나 실행은 하지 않습니다.'],['문자열 안의 select 같은 단어도 바뀌나요?','일반적인 따옴표 문자열은 임시로 보호하지만 복잡한 방언별 인용은 별도 검토가 필요합니다.'],['어떤 데이터베이스를 지원하나요?','공통 SQL 키워드 중심이며 특정 DB에 완전하게 맞춘 포매터는 아닙니다.']]
  },
  {
    slug:'regex-tester', name:'Regex Tester·Cheatsheet', icon:'🧪', title:'Regex Tester | 정규식 테스트와 치트시트', description:'JavaScript 정규식을 텍스트에 적용해 일치 위치와 캡처 그룹을 확인하고 자주 쓰는 문법을 참고하는 무료 도구입니다.', eyebrow:'Test patterns locally', intro:'정규식 패턴과 플래그를 입력해 최대 1,000개 일치 결과, 위치와 캡처 그룹을 확인합니다.',
    form:`${input('pattern','정규식 패턴','\\b[A-Za-z]+\\b')}${input('flags','플래그','gi')}${textarea('source','ReadyTools에서 regex를 테스트합니다. Email: hello@example.com')}`,
    principle:'Regex Tester는 브라우저의 JavaScript RegExp 엔진을 사용합니다. 입력한 패턴을 플래그와 함께 컴파일하고, 전체 검색을 위해 g 플래그가 없으면 내부적으로 추가한 뒤 match의 시작 인덱스, 전체 일치 문자열과 괄호로 만든 캡처 그룹을 순서대로 표시합니다. 빈 문자열과 일치하는 패턴은 같은 위치에서 무한 반복되지 않도록 인덱스를 한 칸 이동합니다. 검색 결과가 지나치게 많을 때 브라우저를 보호하기 위해 첫 1,000건까지만 출력합니다.',
    practice:'로그에서 코드나 날짜를 찾고, 폼 검증 패턴의 예상 동작을 확인하거나 replace 작업 전에 캡처 그룹을 점검할 수 있습니다. 자주 쓰는 문법은 . 임의 문자, \\d 숫자, \\s 공백, [abc] 문자 집합, ^ 시작, $ 끝, * 0회 이상, + 1회 이상, ? 선택, {n,m} 반복, (...) 캡처, (?:...) 비캡처입니다. JavaScript와 PCRE, Python, Java 정규식은 지원 기능과 플래그가 다르므로 대상 실행 환경과 동일한 엔진에서 최종 검증하세요.',
    examples:['이메일처럼 보이는 문자열이 테스트 데이터에서 몇 번 등장하는지 확인합니다.','날짜 패턴의 연도·월·일 캡처 그룹을 분리합니다.','i, m, s 플래그에 따라 같은 패턴의 결과가 어떻게 달라지는지 비교합니다.'],
    caution:'중첩 반복과 모호한 분기가 있는 정규식은 입력 길이에 따라 매우 느려지는 ReDoS 문제가 생길 수 있습니다. 이 도구가 짧은 샘플에서 빠르더라도 서버의 신뢰할 수 없는 긴 입력에 그대로 적용하면 안 됩니다. 개인정보 검증은 정규식 하나만으로 충분하지 않으며 형식 검사 뒤 실제 인증 절차가 필요합니다.',
    faqs:[['지원하는 플래그는 무엇인가요?','브라우저가 지원하는 JavaScript 플래그 g, i, m, s, u, y, d, v 등을 사용할 수 있으며 중복되거나 미지원 플래그는 오류가 납니다.'],['g 플래그를 입력하지 않아도 전체 결과가 나오나요?','예. 결과 목록을 만들기 위해 내부 검사식에는 g를 추가하지만 원래 패턴 의미는 유지합니다.'],['PCRE 전용 문법도 사용할 수 있나요?','아니요. JavaScript RegExp 엔진 문법만 지원합니다.']]
  },
  {
    slug:'url-inspector', name:'URL Parser·Query String 생성기', icon:'🔗', title:'URL Parser 및 Query String 생성기', description:'URL을 구성 요소와 쿼리 파라미터로 분석하거나 key=value 목록으로 안전한 Query String URL을 생성합니다.', eyebrow:'Inspect web addresses', intro:'완성된 URL의 프로토콜·호스트·경로·쿼리·해시를 분리하고 파라미터 목록으로 새 URL을 만듭니다.',
    form:`${select('operation','작업 선택',[['parse','URL Parser'],['build','Query String 생성']])}${input('base','기준 URL','https://example.com/search','text','data-show-when="operation:build"')}${textarea('source','https://example.com/search?q=생활계산소&page=2#result')}`,
    principle:'URL Parser는 브라우저 표준 URL 객체를 사용해 주소를 protocol, host, pathname, search parameters와 hash로 분리합니다. 퍼센트 인코딩된 쿼리 키와 값은 URLSearchParams가 읽을 수 있는 문자열로 보여줍니다. Query String 생성은 기준 URL에 key=value 줄을 순서대로 추가하고, 한글·공백·예약 문자를 표준 규칙으로 인코딩합니다. 같은 키가 여러 번 나오면 배열 관례에 사용할 수 있도록 순서를 유지한 채 반복 파라미터로 추가합니다.',
    practice:'분석 모드에서는 리디렉션 URL이나 API 요청 주소에서 어느 부분이 경로이고 어느 부분이 데이터인지 빠르게 확인할 수 있습니다. 생성 모드에서는 기준 주소와 줄별 파라미터를 분리해 작성하므로 &, =, ?를 손으로 연결할 때 생기는 인코딩 실수를 줄입니다. 다만 서비스마다 배열을 tags=a&tags=b, tags[]=a 또는 쉼표 문자열로 표현하는 방식이 다르므로 API 문서를 확인해야 합니다.',
    examples:['검색 결과 URL에서 q와 page 파라미터 값을 분리합니다.','UTM 파라미터 여러 개를 key=value 줄로 작성해 공유 주소를 만듭니다.','중복 키가 포함된 API URL이 어떤 순서로 전달되는지 확인합니다.'],
    caution:'URL에는 액세스 토큰, 이메일과 검색어 같은 민감한 정보가 포함될 수 있고 브라우저 기록, 로그와 Referer에 남을 수 있습니다. 비밀값은 가능하면 URL 쿼리가 아닌 보안 헤더나 요청 본문을 사용하세요. 이 도구는 주소의 안전성이나 목적지 신뢰도를 검사하지 않으며 링크를 자동으로 방문하지 않습니다.',
    faqs:[['상대 URL도 분석할 수 있나요?','혼동을 줄이기 위해 http:// 또는 https://로 시작하는 절대 URL을 요구합니다.'],['같은 쿼리 키를 여러 번 넣을 수 있나요?','예. key=value 줄을 반복하면 URLSearchParams 순서대로 같은 키가 여러 번 추가됩니다.'],['만든 URL의 사이트가 안전한지도 검사하나요?','아니요. 문자열 구조만 분석하고 악성 사이트, 피싱 또는 연결 가능 여부는 판단하지 않습니다.']]
  },
  {
    slug:'uuid-generator', name:'UUID v4 생성기', icon:'🆔', title:'UUID Generator | UUID v4 무작위 생성', description:'crypto 기반 난수로 UUID v4를 한 번에 최대 100개 생성하고 줄 단위로 복사하는 무료 브라우저 도구입니다.', eyebrow:'Create unique identifiers', intro:'브라우저의 보안 난수 기능을 사용해 표준 형식의 UUID v4 식별자를 원하는 개수만큼 생성합니다.', form:`${input('count','생성 개수','10','number')}`,
    principle:'UUID v4는 128비트 값 중 버전과 변형을 나타내는 일부 비트를 고정하고 나머지를 난수로 채운 식별자입니다. 결과는 8-4-4-4-12 자리의 16진수 그룹으로 표시합니다. 이 도구는 가능한 브라우저에서 crypto.randomUUID()를 사용하고, 지원되지 않는 경우 crypto.getRandomValues() 기반 대체 로직으로 버전 4와 RFC 변형 비트를 맞춥니다. 중앙 서버에 번호를 요청하지 않으므로 오프라인에서도 생성할 수 있고 한 번에 1~100개를 줄 단위로 제공합니다.',
    practice:'데이터베이스 테스트 레코드 ID, 프런트엔드 임시 키, 분산 시스템의 추적 식별자와 목업 데이터에 사용할 수 있습니다. UUID는 충돌 가능성이 매우 작도록 설계되지만 생성 순서나 생성 시간을 담지 않으며 사람이 읽기 좋은 의미도 없습니다. 데이터베이스 기본키로 사용할 때 인덱스 지역성, 저장 형식과 애플리케이션의 대소문자 처리 규칙을 검토하세요.',
    examples:['API 요청의 idempotency 테스트용 식별자를 여러 개 만듭니다.','로컬 목 데이터의 id 필드를 서로 다른 UUID로 채웁니다.','클라이언트에서 서버 저장 전 임시 엔티티 ID를 부여합니다.'],
    caution:'UUID는 비밀번호, API 키 또는 세션 비밀값을 대신하지 않습니다. 예측이 어렵더라도 권한을 부여하는 유일한 수단으로 사용하면 노출 시 악용될 수 있습니다. 시스템이 UUID v1, v5, v7이나 대문자 형식을 요구한다면 이 v4 생성 결과와 호환되는지 확인하세요.',
    faqs:[['UUID가 서로 겹칠 수 있나요?','이론적 가능성은 있지만 정상적인 보안 난수로 생성한 v4 UUID의 충돌 가능성은 실무에서 매우 작습니다.'],['UUID v1이나 v7도 만들 수 있나요?','현재는 개인정보가 담기지 않는 무작위 UUID v4만 생성합니다.'],['UUID를 비밀번호로 써도 되나요?','권장하지 않습니다. 인증 비밀값은 목적에 맞는 충분한 엔트로피의 토큰 생성 방식을 사용하세요.']]
  },
  {
    slug:'timestamp-converter', name:'Unix Timestamp 변환기', icon:'⏱️', title:'Unix Timestamp 변환기 | 날짜 시간 변환', description:'Unix timestamp 초·밀리초와 날짜 문자열을 로컬 시간, UTC ISO 8601 형식으로 브라우저에서 변환합니다.', eyebrow:'Translate machine time', intro:'Unix 초·밀리초 또는 날짜 문자열을 로컬 시간과 UTC ISO 형식으로 바꾸고 현재 timestamp도 확인합니다.',
    form:`${select('mode','입력 종류',[['timestamp','Unix timestamp'],['date','날짜 문자열']])}${input('source','변환할 값(비우면 현재 시각)','1726000000 또는 2026-09-11T09:00:00')}`,
    principle:'Unix timestamp는 1970년 1월 1일 00:00:00 UTC부터 흐른 시간을 숫자로 표현합니다. 많은 API는 초 단위를 사용하지만 JavaScript Date는 밀리초를 사용합니다. 이 도구는 절댓값이 1000억보다 작으면 초, 그 이상이면 밀리초로 판단해 Date 객체로 변환하고 로컬 표시, UTC ISO 8601, Unix 초와 밀리초를 함께 출력합니다. 날짜 문자열 모드에서는 브라우저가 해석한 시간과 현재 기기의 시간대 오프셋을 표시합니다.',
    practice:'로그의 created_at 숫자를 사람이 읽는 시간으로 확인하거나 API 요청에 필요한 초 단위 값을 만들 때 사용합니다. 시간대가 없는 2026-09-11T09:00:00 같은 문자열은 일반적으로 현재 로컬 시간으로 해석되고, 끝에 Z가 있으면 UTC를 뜻합니다. 서머타임이 있는 지역에서는 같은 벽시계 시간이 존재하지 않거나 두 번 나타날 수 있으므로 서버 데이터는 가능하면 UTC와 명시적 오프셋을 사용하세요.',
    examples:['10자리 timestamp를 한국 로컬 시간과 UTC로 비교합니다.','13자리 JavaScript 밀리초 값을 Unix 초로 줄입니다.','ISO 8601 날짜의 Z 또는 +09:00 오프셋 의미를 확인합니다.'],
    caution:'기기의 시간과 시간대 설정이 틀리면 로컬 표시도 틀릴 수 있습니다. 매우 큰 값은 JavaScript Date의 표현 범위를 벗어나며, 윤초는 일반 Unix 시간 모델에서 별도로 표현되지 않습니다. 결제 마감, 법적 기한과 예약 시간은 시스템의 공식 시간대 규칙을 함께 확인하세요.',
    faqs:[['10자리와 13자리 timestamp 차이는 무엇인가요?','일반적으로 10자리는 초, 13자리는 밀리초 단위입니다. 값의 시대에 따라 자릿수만으로 단정할 수는 없습니다.'],['Z가 붙은 날짜는 무엇인가요?','UTC 시간임을 뜻합니다. +09:00은 UTC보다 9시간 빠른 시간대 오프셋입니다.'],['입력칸을 비우면 어떻게 되나요?','현재 브라우저 시각을 기준으로 모든 형식을 계산합니다.']]
  },
  {
    slug:'base-converter', name:'진법 변환기', icon:'🔢', title:'진법 변환기 | 2진수 8진수 10진수 16진수', description:'2진수부터 36진수까지 큰 정수를 정확한 BigInt 계산으로 변환하는 무료 브라우저 진법 변환기입니다.', eyebrow:'Convert integer bases', intro:'2~36진수 정수를 다른 진법으로 변환하며 큰 값도 부동소수점 손실 없이 처리합니다.',
    form:`${input('source','변환할 정수','FF')}${select('from','입력 진법',[[2,'2진수'],[8,'8진수'],[10,'10진수'],[16,'16진수'],[36,'36진수']])}${select('to','출력 진법',[[10,'10진수'],[2,'2진수'],[8,'8진수'],[16,'16진수'],[36,'36진수']])}`,
    principle:'진법 변환은 각 자릿값에 밑의 거듭제곱을 곱해 하나의 정수로 해석한 뒤 목표 진법으로 다시 나누어 표현합니다. 10보다 큰 숫자는 A부터 Z까지를 10~35 값으로 사용합니다. 일반 JavaScript Number는 매우 큰 정수에서 정밀도를 잃을 수 있으므로 이 도구는 BigInt로 자릿수를 차례대로 누적합니다. 음수 부호를 지원하지만 소수점과 지수 표기는 지원하지 않아 정수 변환의 의미를 분명히 유지합니다.',
    practice:'프로그래밍의 비트 마스크, 파일 헤더의 16진수 값, 권한 플래그와 네트워크 관련 숫자를 사람이 익숙한 10진수로 바꿀 수 있습니다. 2진수 한 자리는 비트 하나, 16진수 한 자리는 4비트와 정확히 대응하므로 긴 이진 값을 네 자리씩 묶어 확인하면 오류를 줄일 수 있습니다. 결과 앞의 0은 값에 영향을 주지 않지만 고정 폭 프로토콜에서는 필요한 길이를 다시 채워야 합니다.',
    examples:['16진수 FF를 10진수 255와 2진수 11111111로 변환합니다.','긴 비트 플래그를 BigInt 정밀도로 16진수로 줄여 표시합니다.','36진수 식별자를 10진 정수로 확인합니다.'],
    caution:'변환 결과는 숫자 값만 유지하며 접두사 0x, 0b와 고정 자릿수의 앞쪽 0은 자동으로 보존하지 않습니다. 문자 인코딩, 부호 있는 2의 보수와 IEEE 754 부동소수점 해석은 별개의 문제입니다. 프로토콜 값을 다룰 때는 비트 폭과 부호 규칙을 확인하세요.',
    faqs:[['0x나 0b 접두사를 입력해도 되나요?','현재는 숫자 부분만 입력합니다. 입력 진법을 선택하고 FF 또는 1010처럼 적어 주세요.'],['아주 큰 정수도 정확한가요?','BigInt를 사용하므로 브라우저 메모리 범위에서 정수 자릿값을 정확하게 유지합니다.'],['소수도 변환할 수 있나요?','현재는 정수만 지원하며 소수점과 지수 표기는 오류로 처리합니다.']]
  },
  {
    slug:'http-mime-reference', name:'HTTP 상태코드·MIME 조회', icon:'📡', title:'HTTP 상태코드 및 MIME Type 조회', description:'자주 쓰는 HTTP 상태 코드의 의미와 파일 확장자별 MIME Type을 로컬 목록에서 빠르게 조회합니다.', eyebrow:'Look up web metadata', intro:'HTTP 응답 코드와 일반 파일 확장자의 MIME Type을 코드·이름·설명으로 검색합니다.',
    form:`${select('category','조회 종류',[['http','HTTP 상태코드'],['mime','MIME Type']])}${input('query','검색어','404 또는 json')}`,
    principle:'HTTP 상태 코드는 응답의 큰 결과를 세 자리 숫자로 전달합니다. 1xx는 진행 정보, 2xx는 성공, 3xx는 리디렉션, 4xx는 요청 측 문제, 5xx는 서버 측 문제를 나타냅니다. MIME Type은 Content-Type 헤더에서 본문의 미디어 형식을 type/subtype 구조로 설명합니다. 이 도구는 자주 쓰는 표준 코드와 확장자를 로컬 표로 제공하며 숫자, 영문 이름, 한글 설명, 확장자 또는 MIME 문자열 일부로 검색합니다. 네트워크 요청을 보내 실제 서버 응답을 검사하지는 않습니다.',
    practice:'API 문서나 브라우저 개발자 도구에서 422, 429, 502 같은 코드를 보았을 때 의미를 빠르게 확인하고, 정적 파일의 Content-Type 설정을 검토할 때 사용할 수 있습니다. 파일 확장자는 관례일 뿐 실제 콘텐츠 형식을 보장하지 않으며 서버가 보내는 헤더가 브라우저 처리에 직접 영향을 줍니다. 보안상 nosniff 정책을 사용하는 사이트에서는 잘못된 MIME Type 때문에 스크립트나 스타일이 차단될 수 있습니다.',
    examples:['404와 410의 차이를 확인해 삭제된 URL 응답을 설계합니다.','json 확장자의 application/json 값을 찾습니다.','woff2 폰트 파일에 보낼 Content-Type을 확인합니다.'],
    caution:'조회 목록은 실무에서 자주 쓰는 항목 중심이며 모든 IANA 등록값을 포함하지 않습니다. 새로운 표준이나 공급자 전용 형식은 공식 레지스트리와 해당 플랫폼 문서를 확인하세요. 상태 코드만으로 문제 원인을 단정하지 말고 응답 본문, 헤더와 서버 로그를 함께 검토해야 합니다.',
    faqs:[['모든 HTTP 상태 코드를 제공하나요?','아니요. 웹과 API에서 자주 쓰는 대표 코드를 빠르게 찾는 목록입니다.'],['확장자만으로 파일 형식을 확정할 수 있나요?','아니요. 확장자는 힌트이며 실제 바이트와 서버 Content-Type을 확인해야 합니다.'],['사이트에 요청을 보내 상태를 검사하나요?','아니요. 외부 API나 네트워크 검사 없이 내장된 설명만 검색합니다.']]
  },
  {
    slug:'cron-tools', name:'Cron 생성기·분석기', icon:'🗓️', title:'Cron 생성기 및 Cron 표현식 분석기', description:'자주 쓰는 5필드 Cron 표현식을 생성하고 분·시·일·월·요일 필드를 간단히 분석하는 무료 도구입니다.', eyebrow:'Describe recurring schedules', intro:'일반적인 반복 일정을 표준 5필드 cron으로 만들고 기존 표현식을 필드별로 읽기 쉽게 설명합니다.',
    form:`${select('mode','작업 선택',[['generate','Cron 생성'],['analyze','Cron 분석']])}${select('preset','일정 선택',[['every-5-minutes','5분마다'],['hourly','매시 정각'],['daily-9','매일 오전 9시'],['weekdays-9','평일 오전 9시'],['monday-9','매주 월요일 오전 9시'],['monthly-9','매월 1일 오전 9시']],'data-show-when="mode:generate"')}${input('expression','Cron 표현식','0 9 * * 1-5','text','data-show-when="mode:analyze"')}`,
    principle:'표준 5필드 cron은 왼쪽부터 분, 시, 일, 월, 요일을 나타냅니다. 별표는 모든 값, 쉼표는 여러 값, 하이픈은 범위, */n은 일정 간격을 뜻합니다. 생성기는 자주 쓰는 일정을 검증된 기본 표현식으로 제공하고 분석기는 다섯 필드를 나눠 각 패턴의 의미를 설명합니다. 이 도구는 Linux 계열에서 흔한 5필드를 기준으로 하며 초 필드나 연도 필드를 추가하는 Quartz, AWS EventBridge와 일부 클라우드 서비스 문법은 동일하지 않습니다.',
    practice:'서버의 정기 백업, 보고서 생성, 캐시 갱신과 배치 작업 일정을 문서화할 때 사용할 수 있습니다. 0 9 * * 1-5는 월요일부터 금요일까지 9시 0분을 의미하지만 실제 실행 시각은 cron 프로세스나 플랫폼에 설정된 시간대를 따릅니다. 서머타임 전환 지역에서는 특정 시간이 건너뛰거나 두 번 실행될 수 있으므로 중요한 작업은 중복 실행에 안전하도록 설계하세요.',
    examples:['*/5 * * * *를 만들어 5분 간격 상태 점검을 설정합니다.','0 9 * * 1-5를 분석해 평일 오전 작업인지 확인합니다.','월 1회 보고서 작업의 서버 시간대를 배포 전에 검토합니다.'],
    caution:'분석 결과는 간단한 필드 설명이며 실제 다음 실행 시각을 계산하거나 대상 서비스의 확장 문법을 검증하지 않습니다. 백업·결제·삭제 작업은 오타 한 번으로 큰 영향을 줄 수 있으므로 스테이징 환경과 플랫폼의 공식 cron 검사 도구에서 다시 확인하고 모니터링과 재실행 정책을 준비하세요.',
    faqs:[['왜 5필드만 지원하나요?','Linux cron에서 널리 쓰는 분·시·일·월·요일 형식을 기준으로 하기 때문입니다.'],['요일 0과 7은 무엇인가요?','일반 cron에서 둘 다 일요일로 쓰이는 경우가 많지만 대상 구현의 규칙을 확인해야 합니다.'],['표현식의 시간대는 어디인가요?','표현식 자체에 시간대가 없으며 실행하는 서버나 서비스 설정을 따릅니다.']]
  },
  {
    slug:'subnet-calculator', name:'IPv4 CIDR·Subnet 계산기', icon:'🛜', title:'CIDR Subnet 계산기 | IPv4 네트워크 계산', description:'IPv4 주소와 CIDR 프리픽스로 서브넷 마스크, 네트워크, 브로드캐스트와 사용 가능 범위를 계산합니다.', eyebrow:'Plan IPv4 networks', intro:'IPv4 주소와 /0~32 프리픽스를 입력해 네트워크 범위와 일반 사용 가능 호스트 수를 계산합니다.',
    form:`${input('ip','IPv4 주소','192.168.10.34')}${input('prefix','CIDR 프리픽스','24','number')}`,
    principle:'CIDR 프리픽스 /n은 IPv4 32비트 중 앞의 n비트가 네트워크 부분임을 뜻합니다. 계산기는 주소의 네 옥텟을 32비트 정수로 바꾸고 프리픽스만큼 1인 서브넷 마스크와 AND 연산해 네트워크 주소를 구합니다. 나머지 호스트 비트를 모두 1로 만든 값은 브로드캐스트 주소입니다. 일반 서브넷에서는 네트워크와 브로드캐스트를 제외한 범위를 사용 가능 주소로 표시하며 /31은 지점 간 링크 두 주소, /32는 단일 호스트 관례를 적용합니다.',
    practice:'사설망 VLAN을 나누거나 방화벽 허용 범위, 클라우드 VPC와 테스트 네트워크를 설계할 때 주소 범위를 빠르게 확인할 수 있습니다. /24는 전체 256주소, 일반 사용 가능 254주소이고 /26은 64주소 단위로 나뉩니다. 실제 환경에서는 게이트웨이, DNS, 로드밸런서와 클라우드 사업자가 예약하는 추가 주소가 있어 계산값보다 사용할 수 있는 수가 적을 수 있습니다.',
    examples:['192.168.10.34/24의 네트워크와 브로드캐스트를 확인합니다.','/26 네 개로 /24 공간을 나눌 때 각 범위를 계산합니다.','방화벽 문서의 CIDR이 의도한 호스트를 포함하는지 검토합니다.'],
    caution:'이 도구는 IPv4만 지원하며 IPv6 프리픽스 계산은 제공하지 않습니다. 사용 가능 호스트 수는 일반 규칙일 뿐 클라우드와 네트워크 장비의 예약 정책을 반영하지 않습니다. 주소 충돌과 라우팅 변경은 서비스 장애를 일으킬 수 있으므로 실제 적용 전에 네트워크 관리자와 구성 원본을 확인하세요.',
    faqs:[['/24는 몇 개 주소인가요?','전체 256개이며 전통적인 서브넷에서는 네트워크와 브로드캐스트를 제외한 254개를 일반 사용 가능 주소로 봅니다.'],['/31과 /32도 계산되나요?','예. /31은 지점 간 링크의 두 주소, /32는 단일 호스트 관례로 표시합니다.'],['IPv6도 지원하나요?','현재는 점으로 구분된 IPv4 주소만 지원합니다.']]
  },
  {
    slug:'jwt-decoder', name:'JWT Decoder', icon:'🪪', title:'JWT Decoder | JWT Header Payload 디코딩', description:'JWT의 Base64URL Header와 Payload를 브라우저에서 디코딩하고 iat, exp 시간을 확인하는 무료 도구입니다.', eyebrow:'Inspect token claims', intro:'JWT의 Header와 Payload JSON을 읽고 발급·만료 시각을 표시하되 서명을 검증하지 않습니다.', form:`${textarea('source','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpYXQiOjE3MjYwMDAwMDB9.signature')}`,
    principle:'JWT는 점으로 구분된 Header, Payload, Signature 세 부분으로 구성됩니다. 앞의 두 부분은 Base64URL 형식으로 인코딩된 UTF-8 JSON이므로 -와 _ 문자를 표준 Base64 문자로 바꾸고 패딩을 복원한 뒤 텍스트와 객체로 해석할 수 있습니다. payload의 iat와 exp가 숫자라면 Unix 초로 보고 로컬 시간으로 표시합니다. 세 번째 서명은 비밀키나 공개키와 알고리즘 검증이 필요하므로 이 도구는 절대 검증하지 않으며 단순 디코딩 결과만 보여줍니다.',
    practice:'개발 환경에서 토큰의 issuer, audience, subject, scope와 만료 시각을 빠르게 확인할 때 사용할 수 있습니다. JWT payload는 암호화된 비밀 공간이 아니라 누구나 디코딩할 수 있는 데이터이므로 주민번호, 비밀번호와 불필요한 개인정보를 넣어서는 안 됩니다. 실제 인증 로직에서는 alg 허용 목록, 키 회전, iss·aud·exp·nbf 검증과 시계 오차 정책을 신뢰할 수 있는 서버 라이브러리로 처리해야 합니다.',
    examples:['개발 토큰의 exp가 현재 시각보다 이전인지 확인합니다.','Header의 alg와 kid 값을 읽어 키 선택 문제를 진단합니다.','Payload의 scope와 audience가 예상 환경과 맞는지 검토합니다.'],
    caution:'디코딩 성공은 토큰이 진짜이거나 안전하다는 뜻이 아닙니다. 서명 부분을 임의로 바꿔도 Header와 Payload는 표시될 수 있습니다. 운영 토큰은 클립보드 기록, 화면 캡처와 로그에 남기지 말고 가능하면 만료된 테스트 토큰을 사용하세요. 인증 결정은 서버의 검증된 JWT 라이브러리에서만 수행해야 합니다.',
    faqs:[['JWT 서명도 검증하나요?','아니요. Header와 Payload를 읽을 뿐 Signature, 발급자와 audience를 검증하지 않습니다.'],['Payload는 암호화되어 있나요?','일반 JWT의 Base64URL payload는 인코딩일 뿐 누구나 읽을 수 있습니다.'],['만료되지 않았다고 표시되면 믿어도 되나요?','아니요. exp 숫자만 현재 기기 시간과 비교한 것이며 서명과 다른 claim은 검증하지 않습니다.']]
  },
  {
    slug:'hash-generator', name:'Hash Generator', icon:'#️⃣', title:'Hash Generator | SHA-256 SHA-512 해시 생성', description:'텍스트에서 SHA-1, SHA-256, SHA-384, SHA-512 해시를 Web Crypto API로 생성하는 무료 브라우저 도구입니다.', eyebrow:'Digest text locally', intro:'UTF-8 텍스트를 Web Crypto API로 처리해 선택한 SHA 해시의 16진수 요약값을 만듭니다.',
    form:`${select('algorithm','해시 알고리즘',[['SHA-256','SHA-256'],['SHA-384','SHA-384'],['SHA-512','SHA-512'],['SHA-1','SHA-1 · 레거시 호환용']])}${textarea('source','해시를 생성할 텍스트')}`,
    principle:'해시 함수는 길이가 다른 입력을 고정 길이의 요약값으로 바꾸며 같은 입력에는 같은 결과를 냅니다. 이 도구는 문자열을 UTF-8 바이트로 변환하고 브라우저 Web Crypto API의 SHA-1, SHA-256, SHA-384 또는 SHA-512 digest를 실행한 뒤 각 바이트를 두 자리 16진수로 표시합니다. 입력의 한 글자만 달라져도 결과가 크게 바뀌지만 해시만으로 원문을 복원할 수는 없습니다. SHA-1은 충돌 공격 때문에 보안 용도로 권장되지 않으며 레거시 비교에만 제공합니다.',
    practice:'배포 파일의 공식 해시와 내려받은 텍스트 조각을 비교하거나 API 서명 개발 중 예상 digest를 확인하고, 문서 버전의 변경 여부를 기록할 때 사용할 수 있습니다. 파일 업로드가 아니라 텍스트 입력만 지원하므로 줄바꿈, Unicode 정규화와 마지막 공백이 달라지면 해시도 달라집니다. 두 시스템의 값이 다르면 문자 인코딩, 줄바꿈 LF·CRLF와 BOM 포함 여부를 먼저 확인하세요.',
    examples:['같은 문자열의 SHA-256이 매번 같은지 확인합니다.','한 글자 변경 전후의 해시가 크게 달라지는지 비교합니다.','외부 시스템 문서의 UTF-8 digest 테스트 벡터를 재현합니다.'],
    caution:'일반 SHA 해시는 빠르기 때문에 비밀번호 저장에 직접 사용하면 무차별 대입 공격에 취약합니다. 비밀번호에는 Argon2, scrypt, bcrypt 또는 PBKDF2처럼 salt와 비용을 사용하는 전용 키 파생 함수를 서버에서 적용하세요. 해시 일치는 내용 동일성의 단서지만 출처 신뢰와 디지털 서명을 대신하지 않습니다.',
    faqs:[['SHA-256 결과를 다시 원문으로 복원할 수 있나요?','정상적인 해시 함수는 단방향이므로 직접 복원할 수 없습니다. 짧고 흔한 입력은 사전 대입으로 추측될 수 있습니다.'],['비밀번호를 SHA-256으로 저장해도 되나요?','권장하지 않습니다. salt와 반복 비용이 있는 전용 비밀번호 해싱 방식을 사용해야 합니다.'],['왜 같은 글인데 해시가 다른가요?','공백, 줄바꿈, Unicode 정규화, 대소문자와 인코딩 바이트가 하나라도 다르면 결과가 달라집니다.']]
  },
  {
    slug:'unicode-inspector', name:'Unicode Inspector', icon:'🔍', title:'Unicode Inspector | 코드 포인트 UTF-8 확인', description:'문자와 이모지의 Unicode 코드 포인트, UTF-8 바이트와 UTF-16 코드 유닛을 브라우저에서 확인합니다.', eyebrow:'Inspect every character', intro:'한글·영문·기호·이모지를 코드 포인트 단위로 나눠 U+ 표기와 UTF-8·UTF-16 값을 보여줍니다.', form:`${textarea('source','생활계산소 👩‍💻')}`,
    principle:'Unicode 코드 포인트는 문자를 U+AC00 같은 번호로 정의합니다. JavaScript 문자열은 내부적으로 UTF-16 코드 유닛을 사용하므로 기본 다국어 평면 밖의 이모지는 서로게이트 두 개로 표현될 수 있습니다. 이 도구는 Array.from으로 코드 포인트 단위의 문자를 순회하고 codePointAt으로 U+ 값을, TextEncoder로 UTF-8 바이트를, charCodeAt으로 UTF-16 코드 유닛을 표시합니다. 결합 문자와 ZWJ 이모지는 화면에서 하나처럼 보여도 여러 코드 포인트 행으로 나뉠 수 있습니다.',
    practice:'눈에 같은 문자처럼 보이지만 문자열 비교가 실패할 때 조합형·분해형 차이, 일반 공백과 non-breaking space, 하이픈과 유사 기호를 찾는 데 유용합니다. 이모지의 피부색 수정자와 가족·직업 조합에는 여러 코드 포인트와 zero width joiner가 포함될 수 있습니다. 사용자에게 보이는 글자 수가 필요하면 코드 포인트 수가 아니라 grapheme cluster를 다루는 Intl.Segmenter 같은 기능을 고려해야 합니다.',
    examples:['한글 음절과 분해된 자모의 코드 포인트 차이를 확인합니다.','보이지 않는 공백 문자가 U+0020인지 다른 공백인지 찾습니다.','복합 이모지가 여러 UTF-16 코드 유닛으로 구성되는지 확인합니다.'],
    caution:'코드 포인트 하나가 사용자에게 보이는 문자 하나와 항상 같지는 않습니다. 정규화, 로케일별 대소문자와 글꼴 렌더링은 별도 층의 문제입니다. 보안 식별자에서는 모양이 비슷한 다른 문자로 속이는 homograph 공격 가능성이 있으므로 단순 육안 비교 대신 허용 문자 정책과 정규화를 적용하세요.',
    faqs:[['이모지 하나가 여러 줄로 나오는 이유는 무엇인가요?','피부색, 성별, 가족 조합은 여러 코드 포인트와 ZWJ를 합쳐 한 그림으로 표시할 수 있습니다.'],['UTF-8과 UTF-16 값이 왜 다른가요?','같은 코드 포인트를 서로 다른 바이트·코드 유닛 규칙으로 인코딩하기 때문입니다.'],['화면 글자 수와 코드 포인트 수는 같은가요?','결합 문자와 복합 이모지 때문에 다를 수 있습니다. 사용자 인식 글자는 grapheme cluster 기준이 적합합니다.']]
  }
];

const sharedPrivacy = '이 페이지의 계산과 변환은 모두 현재 브라우저에서 실행됩니다. 원문과 결과를 ReadyTools 서버에 전송하거나 데이터베이스에 저장하지 않으며, 입력 내용은 localStorage에도 기록하지 않습니다. 다만 운영체제나 브라우저의 클립보드 기록, 확장 프로그램, 화면 공유 기능은 사이트 밖의 영역이므로 민감한 데이터는 테스트용으로 바꾸어 사용하는 편이 안전합니다.';

const page = (tool) => {
  const url = `${baseUrl}/developer/${tool.slug}/`;
  const schema = { '@context':'https://schema.org', '@graph':[
    { '@type':'WebApplication', name:tool.name, url, applicationCategory:'DeveloperApplication', operatingSystem:'Any', browserRequirements:'JavaScript 사용 가능 브라우저', offers:{ '@type':'Offer', price:'0', priceCurrency:'KRW' }, inLanguage:'ko-KR', description:tool.description },
    { '@type':'BreadcrumbList', itemListElement:[
      { '@type':'ListItem', position:1, name:'생활계산소', item:`${baseUrl}/` },
      { '@type':'ListItem', position:2, name:'개발 도구', item:`${baseUrl}/developer/` },
      { '@type':'ListItem', position:3, name:tool.name, item:url }
    ] }
  ] };
  const faqs = [...tool.faqs, ...commonFaqs];
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(tool.title)} | 생활계산소</title><meta name="description" content="${escape(tool.description)}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="생활계산소"><meta property="og:title" content="${escape(tool.name)}"><meta property="og:description" content="${escape(tool.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${baseUrl}/assets/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(tool.name)}"><meta name="twitter:description" content="${escape(tool.description)}"><meta name="twitter:image" content="${baseUrl}/assets/og.png"><link rel="stylesheet" href="/assets/styles.css?v=developer-suite-20260911"><script src="/assets/site-config.js"></script><script src="/assets/head.js"></script><script src="/assets/site.js" defer></script><script src="/assets/developer-suite.js?v=20260911" defer></script><script type="application/ld+json" data-breadcrumb-schema>${JSON.stringify(schema)}</script></head>
<body><div data-site-header></div><main id="main"><div class="container"><nav class="breadcrumb" aria-label="현재 위치"><ol><li><a href="/">생활계산소</a></li><li><a href="/developer/">개발 도구</a></li><li aria-current="page">${escape(tool.name)}</li></ol></nav><section class="hero"><p class="eyebrow">${escape(tool.eyebrow)}</p><h1>${escape(tool.name)}</h1><p>${escape(tool.intro)}</p></section>
<section class="calculator-layout" data-developer-tool="${tool.slug}" data-reviewed="${reviewed}"><form class="panel form-grid" novalidate>${tool.form}<div class="button-row"><button class="button button-primary" type="submit">실행하기</button><button class="button button-secondary" type="reset">초기화</button></div></form><aside class="panel result-panel" aria-live="polite"><div class="result-empty" data-result-empty>값을 입력하고 실행 버튼을 눌러주세요.</div><div class="result-content" data-result-content tabindex="-1" hidden><span class="result-kicker">처리 결과</span><div class="result-value" data-result-value></div><div class="field"><label for="dev-output">복사 가능한 결과</label><textarea class="text-output code-output" id="dev-output" data-dev-output readonly spellcheck="false"></textarea></div><p class="notice" data-result-note></p><div class="button-row"><button class="button button-primary" type="button" data-copy-result>결과 복사</button></div></div></aside></section>
<div class="ad-slot" aria-label="광고 영역"><!-- AdSense: 결과 아래 --><span>광고</span></div><article class="section content-copy"><h2>${escape(tool.name)} 작동 원리</h2><p>${escape(tool.principle)}</p><p>${escape(sharedPrivacy)}</p><h2>${escape(tool.name)} 사용 방법</h2><div class="content-grid three"><section class="info-card"><h3>입력 형식 확인</h3><p>페이지에 표시된 입력 예시와 형식을 확인하고 분석하거나 변환할 데이터를 붙여 넣습니다. 오류 안내가 나오면 강조된 항목의 문법과 범위를 먼저 확인하세요.</p></section><section class="info-card"><h3>브라우저에서 실행</h3><p>실행 버튼을 누르면 외부 API 호출 없이 현재 탭에서 처리됩니다. 모바일에서는 완료 후 결과 카드로 자동 이동하며 키보드만으로도 모든 항목을 조작할 수 있습니다.</p></section><section class="info-card"><h3>결과 검토·복사</h3><p>결과의 구조와 주의사항을 확인한 뒤 복사 버튼을 사용합니다. 실제 프로젝트에 반영하기 전에는 대상 언어, 서비스와 데이터 규칙에 맞는지 다시 테스트하세요.</p></section></div><h2>실제 활용 사례</h2><div class="content-grid three">${tool.examples.map((example,index) => `<section class="info-card"><h3>활용 예시 ${index + 1}</h3><p>${escape(example)}</p></section>`).join('')}</div><p>${escape(tool.practice)}</p><h2>주의사항</h2><p>${escape(tool.caution)}</p></article>
<div class="ad-slot" aria-label="광고 영역"><!-- AdSense: 설명 아래 --><span>광고</span></div><section class="section faq"><h2>${escape(tool.name)} FAQ</h2>${faqs.map(([question,answer]) => `<details><summary>${escape(question)}</summary><p>${escape(answer)}</p></details>`).join('')}</section><div class="ad-slot" aria-label="광고 영역"><!-- AdSense: 관련 도구 위 --><span>광고</span></div><section class="section"><h2>관련 개발 도구</h2><div class="tools-grid"><a class="tool-card" href="/developer/"><span class="tool-icon" aria-hidden="true">💻</span><h3>개발 도구 전체</h3><p>브라우저 개발 유틸리티 모음</p></a><a class="tool-card" href="/developer-tools/"><span class="tool-icon" aria-hidden="true">{ }</span><h3>JSON·Base64·URL</h3><p>기존 문자열 변환 도구</p></a><a class="tool-card" href="/text-tools/"><span class="tool-icon" aria-hidden="true">📝</span><h3>텍스트 도구</h3><p>글자수와 줄 정리</p></a></div></section></div></main><div data-site-footer></div></body></html>`;
};

const hubCards = tools.map((tool) => `<a class="tool-card" href="/developer/${tool.slug}/"><span class="tool-icon" aria-hidden="true">${tool.icon}</span><h2>${escape(tool.name)}</h2><p>${escape(tool.intro)}</p></a>`).join('');
const hubUrl = `${baseUrl}/developer/`;
const hubSchema = { '@context':'https://schema.org', '@graph':[
  { '@type':'CollectionPage', name:'ReadyTools 개발 도구', url:hubUrl, description:'브라우저에서 실행되는 JSON, XML, CSV, Regex, URL, 네트워크 개발 도구 모음', inLanguage:'ko-KR' },
  { '@type':'BreadcrumbList', itemListElement:[{ '@type':'ListItem', position:1, name:'생활계산소', item:`${baseUrl}/` },{ '@type':'ListItem', position:2, name:'개발 도구', item:hubUrl }] }
] };
const hub = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>무료 온라인 개발자 도구 모음 | ReadyTools</title><meta name="description" content="JSON, CSV, XML, YAML, HTML, CSS, SQL, Regex, URL, UUID, Timestamp, CIDR, JWT, Hash와 Unicode를 브라우저에서 처리하는 무료 개발 도구입니다."><link rel="canonical" href="${hubUrl}"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="생활계산소"><meta property="og:title" content="ReadyTools 무료 개발 도구"><meta property="og:description" content="설치와 서버 전송 없이 사용하는 브라우저 개발 유틸리티 모음"><meta property="og:url" content="${hubUrl}"><meta property="og:image" content="${baseUrl}/assets/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="ReadyTools 개발 도구"><meta name="twitter:description" content="JSON부터 네트워크 계산까지 브라우저에서 처리하세요."><meta name="twitter:image" content="${baseUrl}/assets/og.png"><link rel="stylesheet" href="/assets/styles.css?v=developer-suite-20260911"><script src="/assets/site-config.js"></script><script src="/assets/head.js"></script><script src="/assets/site.js" defer></script><script type="application/ld+json" data-breadcrumb-schema>${JSON.stringify(hubSchema)}</script></head><body><div data-site-header></div><main id="main"><div class="container"><nav class="breadcrumb" aria-label="현재 위치"><ol><li><a href="/">생활계산소</a></li><li aria-current="page">개발 도구</li></ol></nav><section class="hero"><p class="eyebrow">Developer toolbox</p><h1>브라우저 개발 도구</h1><p>데이터 형식 변환부터 정규식·URL·네트워크 점검까지, 설치 없이 현재 브라우저에서 처리하세요.</p></section><section class="section"><h2>개발 도구 ${tools.length}개</h2><div class="tools-grid">${hubCards}</div></section><div class="ad-slot" aria-label="광고 영역"><span>광고</span></div><article class="section content-copy"><h2>ReadyTools 개발 도구의 기준</h2><p>개발 중에는 짧은 JSON 응답을 정리하거나 CSV를 테스트 데이터로 바꾸고, JWT의 claim과 Unix timestamp를 확인하는 작은 작업이 반복됩니다. ReadyTools 개발 도구는 이런 작업을 위해 회원가입, 파일 업로드와 외부 API 호출 없이 동작합니다. 입력한 코드와 데이터는 현재 브라우저에서만 처리하며 서버나 데이터베이스로 전송하지 않습니다. 토큰과 설정처럼 민감할 수 있는 데이터는 localStorage에 저장하지 않고 결과 복사도 사용자가 버튼을 누른 경우에만 실행합니다.</p><p>각 페이지는 단순 변환 버튼만 제공하지 않습니다. 어떤 표준과 브라우저 기능을 사용했는지, 지원 범위와 완전한 파서가 필요한 경우를 설명하고 실제 적용 전에 확인할 사항을 함께 제공합니다. JSON·XML·CSV 같은 데이터 형식은 겉보기 변환이 성공해도 스키마, 문자 인코딩과 대상 시스템 관례에 따라 의미가 달라질 수 있습니다. 결과를 운영 코드에 바로 붙여 넣기보다 테스트 환경과 공식 문서에서 한 번 더 검증하는 것을 기본 원칙으로 삼습니다.</p><h2>도구 선택 방법</h2><div class="content-grid three"><section class="info-card"><h3>데이터 변환</h3><p>JSON Diff, JSON↔CSV, XML·YAML 변환으로 API 응답과 설정 파일 구조를 확인합니다.</p></section><section class="info-card"><h3>코드와 문자열</h3><p>HTML·CSS·SQL·Regex 도구로 작은 코드 조각을 정리하고 예상 결과를 테스트합니다.</p></section><section class="info-card"><h3>웹·시스템 값</h3><p>URL, UUID, timestamp, CIDR, JWT, Hash와 Unicode의 구조를 로컬에서 확인합니다.</p></section></div><h2>개인정보와 보안</h2><p>브라우저 처리 방식은 사이트 서버로 데이터를 보내지 않지만 사용 중인 기기 전체의 보안을 보장하지는 않습니다. 회사 정책상 외부 웹페이지에 붙여 넣을 수 없는 비밀키와 운영 토큰은 만료된 테스트 값으로 바꾸어 사용하세요. 확장 프로그램, 클립보드 관리자와 화면 공유 프로그램이 내용을 읽을 가능성도 고려해야 합니다. JWT Decoder와 Hash Generator처럼 보안과 관련된 도구는 분석 보조 기능이며 인증, 서명 검증과 비밀번호 저장 시스템을 대신하지 않습니다.</p></article><div class="ad-slot" aria-label="광고 영역"><span>광고</span></div><section class="section faq"><h2>개발 도구 FAQ</h2><details><summary>입력한 코드는 서버로 전송되나요?</summary><p>아니요. 모든 변환은 현재 브라우저에서 처리하며 입력과 결과를 ReadyTools 서버에 저장하지 않습니다.</p></details><details><summary>도구 결과를 운영 코드에 바로 사용해도 되나요?</summary><p>지원 범위와 대상 시스템 문법이 다를 수 있으므로 테스트, 코드 리뷰와 공식 문서 확인 후 사용하세요.</p></details><details><summary>모바일에서도 사용할 수 있나요?</summary><p>예. 작은 화면에서도 입력과 결과 카드가 한 열로 배치되고 실행 후 결과 위치로 이동합니다.</p></details><details><summary>외부 라이브러리나 API를 사용하나요?</summary><p>아니요. 표준 HTML, CSS와 브라우저 JavaScript API만 사용합니다.</p></details><details><summary>민감한 토큰을 붙여 넣어도 되나요?</summary><p>서버 전송은 없지만 클립보드와 브라우저 확장 프로그램 위험이 있으므로 만료된 테스트 값을 권장합니다.</p></details></section></div></main><div data-site-footer></div></body></html>`;

const hubDir = resolve(root, 'calculator', 'developer');
await mkdir(hubDir, { recursive:true });
await writeFile(resolve(hubDir, 'index.html'), hub);
for (const tool of tools) {
  const directory = resolve(hubDir, tool.slug);
  await mkdir(directory, { recursive:true });
  await writeFile(resolve(directory, 'index.html'), page(tool));
}
console.log(`개발 도구 허브와 ${tools.length}개 페이지를 생성했습니다.`);
