(() => {
  'use strict';

  const root = document.querySelector('[data-developer-tool]');
  if (!root) return;
  const type = root.dataset.developerTool;
  const form = root.querySelector('form');
  const output = root.querySelector('[data-dev-output]');
  const resultEmpty = root.querySelector('[data-result-empty]');
  const resultContent = root.querySelector('[data-result-content]');
  const resultValue = root.querySelector('[data-result-value]');
  const resultNote = root.querySelector('[data-result-note]');
  const copyButton = root.querySelector('[data-copy-result]');
  if (!form || !output || !resultEmpty || !resultContent || !resultValue || !resultNote) return;

  let resultText = '';
  const get = (name) => form.elements[name];
  const value = (name) => String(get(name)?.value ?? '').trim();
  const clearErrors = () => form.querySelectorAll('.error').forEach((item) => { item.textContent = ''; });
  const fail = (name, message) => {
    const field = get(name);
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      const error = document.getElementById(`${field.id}-error`);
      if (error) error.textContent = message;
      field.focus();
    }
    throw new Error('__handled__');
  };
  const show = (headline, text, note = '입력값과 결과는 서버로 전송하거나 저장하지 않습니다.') => {
    resultText = text;
    resultValue.textContent = headline;
    output.value = text;
    resultNote.textContent = note;
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    resultContent.focus({ preventScroll: true });
    if (matchMedia('(max-width: 899px)').matches) {
      requestAnimationFrame(() => resultContent.closest('.result-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
    }
  };
  const required = (name, message = '값을 입력해 주세요.') => {
    const text = value(name);
    if (!text) fail(name, message);
    return text;
  };
  const parseJson = (name) => {
    try { return JSON.parse(required(name, 'JSON을 입력해 주세요.')); }
    catch (error) { if (error.message === '__handled__') throw error; fail(name, `JSON 문법을 확인해 주세요. ${error.message}`); }
  };
  const formatNumber = (number) => Number(number).toLocaleString('ko-KR');

  const diffJson = (left, right, path = '$', lines = []) => {
    if (Object.is(left, right)) return lines;
    const leftObject = left && typeof left === 'object';
    const rightObject = right && typeof right === 'object';
    if (!leftObject || !rightObject || Array.isArray(left) !== Array.isArray(right)) {
      lines.push(`변경 ${path}\n  이전: ${JSON.stringify(left)}\n  이후: ${JSON.stringify(right)}`); return lines;
    }
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of keys) {
      const childPath = Array.isArray(left) ? `${path}[${key}]` : `${path}.${key}`;
      if (!(key in left)) lines.push(`추가 ${childPath}: ${JSON.stringify(right[key])}`);
      else if (!(key in right)) lines.push(`삭제 ${childPath}: ${JSON.stringify(left[key])}`);
      else diffJson(left[key], right[key], childPath, lines);
    }
    return lines;
  };

  const parseCsv = (text) => {
    const rows = []; let row = []; let cell = ''; let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
        else if (char === '"') quoted = false;
        else cell += char;
      } else if (char === '"') quoted = true;
      else if (char === ',') { row.push(cell); cell = ''; }
      else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (char !== '\r') cell += char;
    }
    if (quoted) throw new Error('닫히지 않은 큰따옴표가 있습니다.');
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((item, index) => index === 0 || item.some((entry) => entry !== ''));
  };
  const csvCell = (entry) => {
    const text = entry == null ? '' : typeof entry === 'object' ? JSON.stringify(entry) : String(entry);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const inferCsvValue = (entry) => {
    const text = entry.trim();
    if (text === '') return '';
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (text === 'null') return null;
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text) && Number.isFinite(Number(text))) return Number(text);
    if (/^[\[{]/.test(text)) { try { return JSON.parse(text); } catch (_) {} }
    return entry;
  };

  const parseXml = (text, name = 'source') => {
    const documentNode = new DOMParser().parseFromString(text, 'application/xml');
    const parserError = documentNode.querySelector('parsererror');
    if (parserError) fail(name, `XML 문법을 확인해 주세요. ${parserError.textContent.split('\n')[0]}`);
    return documentNode;
  };
  const formatXml = (text) => {
    const xml = new XMLSerializer().serializeToString(parseXml(text));
    const tokens = xml.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/).filter(Boolean);
    let depth = 0;
    return tokens.map((token) => {
      const trimmed = token.trim();
      if (/^<\//.test(trimmed)) depth = Math.max(0, depth - 1);
      const line = `${'  '.repeat(depth)}${trimmed}`;
      if (/^<[^!?/][^>]*>$/.test(trimmed) && !/\/>$/.test(trimmed) && !/<\/[^>]+>$/.test(trimmed)) depth += 1;
      return line;
    }).join('\n');
  };
  const xmlNodeToValue = (node) => {
    const children = [...node.children];
    const attributes = Object.fromEntries([...node.attributes].map((attribute) => [`@${attribute.name}`, attribute.value]));
    if (!children.length && !Object.keys(attributes).length) return node.textContent;
    const result = { ...attributes };
    const ownText = [...node.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE).map((child) => child.textContent.trim()).filter(Boolean).join(' ');
    if (ownText) result['#text'] = ownText;
    for (const child of children) {
      const childValue = xmlNodeToValue(child);
      if (child.tagName in result) result[child.tagName] = Array.isArray(result[child.tagName]) ? [...result[child.tagName], childValue] : [result[child.tagName], childValue];
      else result[child.tagName] = childValue;
    }
    return result;
  };
  const objectToXml = (name, data, documentNode) => {
    const element = documentNode.createElement(name);
    if (data == null) return element;
    if (typeof data !== 'object') { element.textContent = String(data); return element; }
    for (const [key, entry] of Object.entries(data)) {
      if (key.startsWith('@')) element.setAttribute(key.slice(1), String(entry));
      else if (key === '#text') element.append(documentNode.createTextNode(String(entry)));
      else if (Array.isArray(entry)) entry.forEach((item) => element.append(objectToXml(key, item, documentNode)));
      else element.append(objectToXml(key, entry, documentNode));
    }
    return element;
  };

  const yamlScalar = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return {};
    if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
    if (/^(null|~)$/i.test(trimmed)) return null;
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1).replaceAll("''", "'");
    if (/^[\[{]/.test(trimmed)) { try { return JSON.parse(trimmed); } catch (_) {} }
    return trimmed;
  };
  const parseBasicYaml = (text) => {
    if (/(^|\s)[&*!]|(^|\s)<<:|:\s*[|>]\s*$/m.test(text)) throw new Error('앵커, 태그, 병합 키, 여러 줄 블록은 기본 변환 범위에 포함되지 않습니다.');
    const lines = text.split(/\r?\n/).map((raw, number) => ({ raw, number: number + 1, indent: raw.match(/^ */)[0].length, text: raw.trim() })).filter((line) => line.text && !line.text.startsWith('#'));
    if (!lines.length) return null;
    const parseBlock = (start, indent) => {
      const listMode = lines[start].text.startsWith('- ' ) || lines[start].text === '-';
      const container = listMode ? [] : {};
      let index = start;
      while (index < lines.length && lines[index].indent === indent) {
        const line = lines[index];
        if (listMode) {
          if (!line.text.startsWith('-')) throw new Error(`${line.number}번째 줄에서 목록 형식이 섞였습니다.`);
          const rest = line.text.slice(1).trim();
          if (!rest && lines[index + 1]?.indent > indent) { const child = parseBlock(index + 1, lines[index + 1].indent); container.push(child.value); index = child.index; continue; }
          const pair = rest.match(/^([^:#][^:]*):(?:\s*(.*))?$/);
          if (pair) {
            const object = {}; const key = pair[1].trim(); const tail = pair[2] || '';
            if (tail) object[key] = yamlScalar(tail);
            else object[key] = {};
            if (lines[index + 1]?.indent > indent) {
              const child = parseBlock(index + 1, lines[index + 1].indent);
              if (tail && child.value && typeof child.value === 'object' && !Array.isArray(child.value)) Object.assign(object, child.value);
              else if (!tail) object[key] = child.value;
              index = child.index - 1;
            }
            container.push(object);
          } else container.push(yamlScalar(rest));
        } else {
          const pair = line.text.match(/^([^:#][^:]*):(?:\s*(.*))?$/);
          if (!pair) throw new Error(`${line.number}번째 줄은 key: value 형식이어야 합니다.`);
          const key = pair[1].trim(); const tail = pair[2] || '';
          if (key in container) throw new Error(`${line.number}번째 줄의 키 '${key}'가 중복되었습니다.`);
          if (tail) container[key] = yamlScalar(tail);
          else if (lines[index + 1]?.indent > indent) { const child = parseBlock(index + 1, lines[index + 1].indent); container[key] = child.value; index = child.index - 1; }
          else container[key] = {};
        }
        index += 1;
        if (index < lines.length && lines[index].indent < indent) break;
        if (index < lines.length && lines[index].indent > indent) throw new Error(`${lines[index].number}번째 줄의 들여쓰기를 확인해 주세요.`);
      }
      return { value: container, index };
    };
    return parseBlock(0, lines[0].indent).value;
  };
  const yamlQuote = (entry) => {
    if (entry === null) return 'null';
    if (typeof entry === 'boolean' || typeof entry === 'number') return String(entry);
    const text = String(entry);
    return !text || /[:#\[\]{},&*!|>'"%@`]|^(true|false|null|~|-?\d+(\.\d+)?)$/i.test(text) ? JSON.stringify(text) : text;
  };
  const toBasicYaml = (data, depth = 0) => {
    const indent = '  '.repeat(depth);
    if (Array.isArray(data)) return data.map((entry) => typeof entry === 'object' && entry !== null ? `${indent}-\n${toBasicYaml(entry, depth + 1)}` : `${indent}- ${yamlQuote(entry)}`).join('\n');
    if (data && typeof data === 'object') return Object.entries(data).map(([key, entry]) => typeof entry === 'object' && entry !== null ? `${indent}${key}:\n${toBasicYaml(entry, depth + 1)}` : `${indent}${key}: ${yamlQuote(entry)}`).join('\n');
    return `${indent}${yamlQuote(data)}`;
  };

  const formatHtml = (text) => {
    const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
    const tokens = text.replace(/>\s+</g, '><').match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g) || [];
    let depth = 0;
    return tokens.map((token) => {
      const trimmed = token.trim(); if (!trimmed) return '';
      if (/^<\//.test(trimmed)) depth = Math.max(0, depth - 1);
      const line = `${'  '.repeat(depth)}${trimmed}`;
      const open = trimmed.match(/^<([a-z][\w:-]*)\b[^>]*>$/i);
      if (open && !voidTags.has(open[1].toLowerCase()) && !/\/>$/.test(trimmed) && !new RegExp(`<\\/${open[1]}\\s*>$`, 'i').test(trimmed)) depth += 1;
      return line;
    }).filter(Boolean).join('\n');
  };
  const encodeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const decodeHtml = (text) => { const area = document.createElement('textarea'); area.innerHTML = text; return area.value; };
  const minifyCss = (text) => {
    let result = ''; let quote = ''; let comment = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index]; const next = text[index + 1];
      if (comment) { if (char === '*' && next === '/') { comment = false; index += 1; } continue; }
      if (!quote && char === '/' && next === '*') { comment = true; index += 1; continue; }
      if (quote) { result += char; if (char === '\\') { result += next || ''; index += 1; } else if (char === quote) quote = ''; continue; }
      if (char === '"' || char === "'") { quote = char; result += char; continue; }
      result += /\s/.test(char) ? ' ' : char;
    }
    if (comment) throw new Error('닫히지 않은 CSS 주석이 있습니다.');
    return result.replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').replace(/\s+/g, ' ').trim();
  };
  const formatSql = (text) => {
    const literals = [];
    const safe = text.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`/g, (literal) => `__RT_LITERAL_${literals.push(literal) - 1}__`);
    const keywords = ['select','from','where','left join','right join','inner join','outer join','join','group by','order by','having','limit','offset','union all','union','insert into','values','update','set','delete from','create table','alter table','drop table','and','or','as','on','case','when','then','else','end','distinct'];
    let formatted = safe;
    keywords.sort((a,b) => b.length - a.length).forEach((keyword) => { formatted = formatted.replace(new RegExp(`\\b${keyword.replace(' ', '\\s+')}\\b`, 'gi'), keyword.toUpperCase()); });
    formatted = formatted.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
    ['SELECT','FROM','WHERE','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','JOIN','GROUP BY','ORDER BY','HAVING','LIMIT','OFFSET','UNION ALL','UNION','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'].forEach((keyword) => { formatted = formatted.replace(new RegExp(`\\s+${keyword}\\b`, 'g'), `\n${keyword}`); });
    formatted = formatted.replace(/\s+(AND|OR)\s+/g, '\n  $1 ');
    return formatted.replace(/__RT_LITERAL_(\d+)__/g, (_, index) => literals[Number(index)]);
  };

  const base64UrlDecode = (part) => {
    const normalized = part.replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };
  const digestText = async (algorithm, text) => {
    const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };
  const parseBaseInteger = (text, base) => {
    let source = text.trim().toUpperCase(); let sign = 1n;
    if (source.startsWith('-')) { sign = -1n; source = source.slice(1); }
    if (!source) throw new Error('변환할 정수를 입력해 주세요.');
    const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; let total = 0n;
    for (const char of source) { const digit = digits.indexOf(char); if (digit < 0 || digit >= base) throw new Error(`${base}진수에서 사용할 수 없는 문자 '${char}'가 있습니다.`); total = total * BigInt(base) + BigInt(digit); }
    return total * sign;
  };
  const ipv4ToInt = (text) => {
    const parts = text.split('.');
    if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) throw new Error('IPv4 주소를 192.168.0.10처럼 입력해 주세요.');
    return parts.reduce((total, part) => ((total << 8) | Number(part)) >>> 0, 0);
  };
  const intToIpv4 = (number) => [24,16,8,0].map((shift) => (number >>> shift) & 255).join('.');

  const statusCodes = {
    100:'Continue · 요청을 계속 진행', 200:'OK · 요청 성공', 201:'Created · 리소스 생성', 202:'Accepted · 처리 요청 수락', 204:'No Content · 본문 없는 성공', 206:'Partial Content · 부분 콘텐츠',
    301:'Moved Permanently · 영구 이동', 302:'Found · 임시 이동', 304:'Not Modified · 캐시 사용', 307:'Temporary Redirect · 메서드 유지 임시 이동', 308:'Permanent Redirect · 메서드 유지 영구 이동',
    400:'Bad Request · 잘못된 요청', 401:'Unauthorized · 인증 필요', 403:'Forbidden · 접근 거부', 404:'Not Found · 리소스 없음', 405:'Method Not Allowed · 메서드 허용 안 됨', 408:'Request Timeout · 요청 시간 초과', 409:'Conflict · 상태 충돌', 410:'Gone · 영구 삭제', 413:'Content Too Large · 본문이 너무 큼', 415:'Unsupported Media Type · 미지원 형식', 422:'Unprocessable Content · 의미 검증 실패', 429:'Too Many Requests · 요청 제한 초과',
    500:'Internal Server Error · 서버 내부 오류', 501:'Not Implemented · 기능 미구현', 502:'Bad Gateway · 게이트웨이 오류', 503:'Service Unavailable · 일시 사용 불가', 504:'Gateway Timeout · 게이트웨이 시간 초과'
  };
  const mimeTypes = {
    html:'text/html', css:'text/css', js:'text/javascript', json:'application/json', xml:'application/xml', csv:'text/csv', txt:'text/plain', pdf:'application/pdf', zip:'application/zip', wasm:'application/wasm',
    png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', webp:'image/webp', svg:'image/svg+xml', ico:'image/x-icon', avif:'image/avif',
    mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', mp4:'video/mp4', webm:'video/webm', mov:'video/quicktime',
    woff:'font/woff', woff2:'font/woff2', ttf:'font/ttf', otf:'font/otf', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  const describeCronPart = (part, label) => {
    if (part === '*') return `${label}: 매번`;
    if (/^\*\/\d+$/.test(part)) return `${label}: ${part.slice(2)} 간격`;
    if (/^\d+(,\d+)+$/.test(part)) return `${label}: ${part.split(',').join(', ')}`;
    if (/^\d+-\d+$/.test(part)) return `${label}: ${part.replace('-', '부터 ')}까지`;
    return `${label}: ${part}`;
  };

  const handlers = {
    'json-diff': () => { const lines = diffJson(parseJson('left'), parseJson('right')); show(lines.length ? `차이 ${lines.length}건` : '두 JSON이 같습니다', lines.length ? lines.join('\n\n') : '구조와 값에서 차이를 찾지 못했습니다.'); },
    'json-csv-converter': () => {
      const operation = value('operation'); const source = required('source');
      if (operation === 'json-to-csv') {
        const data = parseJson('source'); if (!Array.isArray(data) || data.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) fail('source', '객체로 구성된 JSON 배열을 입력해 주세요.');
        const headers = [...new Set(data.flatMap(Object.keys))]; if (!headers.length) fail('source', '변환할 키가 없습니다.');
        const csv = [headers.map(csvCell).join(','), ...data.map((item) => headers.map((header) => csvCell(item[header])).join(','))].join('\n'); show(`${formatNumber(data.length)}행 CSV 생성`, csv);
      } else {
        let rows; try { rows = parseCsv(source); } catch (error) { fail('source', error.message); }
        if (rows.length < 2) fail('source', '헤더와 데이터가 있는 CSV를 입력해 주세요.');
        const headers = rows[0].map((header) => header.trim()); if (headers.some((header) => !header) || new Set(headers).size !== headers.length) fail('source', 'CSV 헤더는 비어 있거나 중복될 수 없습니다.');
        const data = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, inferCsvValue(row[index] ?? '')]))); show(`${formatNumber(data.length)}개 객체 생성`, JSON.stringify(data, null, 2));
      }
    },
    'xml-tools': () => {
      const operation = value('operation');
      if (operation === 'format') { const result = formatXml(required('source')); show('XML 정리 완료', result); }
      else if (operation === 'xml-to-json') { const xml = parseXml(required('source')); const result = { [xml.documentElement.tagName]: xmlNodeToValue(xml.documentElement) }; show('JSON 변환 완료', JSON.stringify(result, null, 2)); }
      else { const data = parseJson('source'); if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length !== 1) fail('source', '루트 키가 하나인 JSON 객체를 입력해 주세요.'); const documentNode = document.implementation.createDocument(null, null); const [rootName, rootValue] = Object.entries(data)[0]; documentNode.append(objectToXml(rootName, rootValue, documentNode)); show('XML 변환 완료', formatXml(new XMLSerializer().serializeToString(documentNode))); }
    },
    'yaml-json-converter': () => {
      const operation = value('operation');
      if (operation === 'yaml-to-json') { try { show('JSON 변환 완료', JSON.stringify(parseBasicYaml(required('source')), null, 2), '기본 YAML 문법을 변환했습니다. 앵커·태그·여러 줄 블록은 지원하지 않습니다.'); } catch (error) { fail('source', error.message); } }
      else show('YAML 변환 완료', toBasicYaml(parseJson('source')), '기본 YAML 문법으로 변환했습니다. 결과를 대상 시스템에서 다시 검증하세요.');
    },
    'html-tools': () => { const operation = value('operation'); const source = required('source'); const result = operation === 'format' ? formatHtml(source) : operation === 'encode' ? encodeHtml(source) : decodeHtml(source); show(operation === 'format' ? 'HTML 정리 완료' : operation === 'encode' ? 'HTML 인코딩 완료' : 'HTML 디코딩 완료', result); },
    'css-minifier': () => { try { const source = required('source'); const result = minifyCss(source); show(`${formatNumber(source.length - result.length)}자 감소`, result, '기본 공백·주석 축소 결과입니다. 배포 전 브라우저에서 스타일을 다시 테스트하세요.'); } catch (error) { if (error.message === '__handled__') throw error; fail('source', error.message); } },
    'sql-formatter': () => { const result = formatSql(required('source')); show('SQL 정리 완료', result, '일반 SQL 키워드를 기준으로 정리했습니다. 실제 DB 방언과 쿼리 실행 계획은 별도로 확인하세요.'); },
    'regex-tester': () => {
      const pattern = required('pattern', '정규식 패턴을 입력해 주세요.'); const flags = value('flags'); const source = required('source', '테스트할 텍스트를 입력해 주세요.');
      let expression; try { expression = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`); } catch (error) { fail('pattern', `정규식 문법 오류: ${error.message}`); }
      const matches = []; let match;
      while ((match = expression.exec(source)) && matches.length < 1000) { matches.push({ value: match[0], index: match.index, groups: match.slice(1) }); if (match[0] === '') expression.lastIndex += 1; }
      const text = matches.length ? matches.map((item, index) => `${index + 1}. 위치 ${item.index} · ${JSON.stringify(item.value)}${item.groups.length ? `\n   그룹: ${item.groups.map((group) => JSON.stringify(group)).join(', ')}` : ''}`).join('\n') : '일치하는 결과가 없습니다.';
      show(`일치 ${formatNumber(matches.length)}건`, text, matches.length === 1000 ? '성능 보호를 위해 첫 1,000건까지만 표시합니다.' : 'JavaScript RegExp 문법으로 검사했습니다.');
    },
    'url-inspector': () => {
      const operation = value('operation'); const source = required('source');
      if (operation === 'parse') {
        let url; try { url = new URL(source); } catch (_) { fail('source', 'http:// 또는 https://로 시작하는 완성된 URL을 입력해 주세요.'); }
        const params = [...url.searchParams.entries()].map(([key, entry]) => `  ${key} = ${entry}`).join('\n') || '  (없음)';
        show('URL 분석 완료', `전체: ${url.href}\n프로토콜: ${url.protocol}\n호스트: ${url.host}\n경로: ${url.pathname}\n쿼리:\n${params}\n해시: ${url.hash || '(없음)'}`);
      } else {
        const base = required('base', '기준 URL을 입력해 주세요.'); let url; try { url = new URL(base); } catch (_) { fail('base', 'http:// 또는 https://로 시작하는 기준 URL을 입력해 주세요.'); }
        source.split(/\r?\n/).filter(Boolean).forEach((line, index) => { const separator = line.indexOf('='); if (separator < 1) fail('source', `${index + 1}번째 줄을 key=value 형식으로 입력해 주세요.`); url.searchParams.append(line.slice(0, separator).trim(), line.slice(separator + 1).trim()); });
        show('Query String 생성 완료', url.href);
      }
    },
    'uuid-generator': () => { const count = Number(value('count')); if (!Number.isInteger(count) || count < 1 || count > 100) fail('count', '1~100 사이의 정수를 입력해 주세요.'); const uuid = () => crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (char) => (Number(char) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(char) / 4).toString(16)); const result = Array.from({ length: count }, uuid).join('\n'); show(`UUID ${count}개 생성`, result); },
    'timestamp-converter': () => {
      const source = value('source'); const mode = value('mode'); let date;
      if (!source) date = new Date();
      else if (mode === 'timestamp') { const number = Number(source); if (!Number.isFinite(number)) fail('source', '유효한 Unix timestamp를 입력해 주세요.'); date = new Date(Math.abs(number) < 1e11 ? number * 1000 : number); }
      else date = new Date(source);
      if (Number.isNaN(date.getTime())) fail('source', '변환할 날짜나 timestamp를 확인해 주세요.');
      show('시간 변환 완료', `로컬 시간: ${date.toLocaleString('ko-KR')}\nUTC ISO 8601: ${date.toISOString()}\nUnix 초: ${Math.floor(date.getTime() / 1000)}\nUnix 밀리초: ${date.getTime()}\n시간대 오프셋: UTC${-date.getTimezoneOffset() >= 0 ? '+' : '-'}${String(Math.floor(Math.abs(date.getTimezoneOffset()) / 60)).padStart(2,'0')}:${String(Math.abs(date.getTimezoneOffset()) % 60).padStart(2,'0')}`);
    },
    'base-converter': () => { const from = Number(value('from')); const to = Number(value('to')); try { const number = parseBaseInteger(required('source'), from); show(`${from}진수 → ${to}진수`, number.toString(to).toUpperCase(), '정수만 변환합니다. 소수와 지수 표기는 지원하지 않습니다.'); } catch (error) { if (error.message === '__handled__') throw error; fail('source', error.message); } },
    'http-mime-reference': () => {
      const category = value('category'); const query = required('query', '상태 코드나 확장자를 입력해 주세요.').toLowerCase().replace(/^\./, '');
      if (category === 'http') { const matches = Object.entries(statusCodes).filter(([code, description]) => code.includes(query) || description.toLowerCase().includes(query)); show(`HTTP 결과 ${matches.length}건`, matches.length ? matches.map(([code, description]) => `${code} ${description}`).join('\n') : '일치하는 상태 코드를 찾지 못했습니다.'); }
      else { const matches = Object.entries(mimeTypes).filter(([extension, mime]) => extension.includes(query) || mime.includes(query)); show(`MIME 결과 ${matches.length}건`, matches.length ? matches.map(([extension, mime]) => `.${extension} → ${mime}`).join('\n') : '일치하는 MIME Type을 찾지 못했습니다.'); }
    },
    'cron-tools': () => {
      const mode = value('mode');
      if (mode === 'generate') { const preset = value('preset'); const presets = { 'every-5-minutes':'*/5 * * * *', hourly:'0 * * * *', 'daily-9':'0 9 * * *', 'weekdays-9':'0 9 * * 1-5', 'monday-9':'0 9 * * 1', 'monthly-9':'0 9 1 * *' }; show('Cron 표현식 생성', presets[preset], '표준 5필드 cron 기준입니다. 대상 서비스의 시간대와 문법 차이를 확인하세요.'); }
      else { const expression = required('expression', '분석할 cron 표현식을 입력해 주세요.'); const parts = expression.split(/\s+/); if (parts.length !== 5 || parts.some((part) => !/^[\d*/,\-]+$/.test(part))) fail('expression', '분·시·일·월·요일의 표준 5필드 형식을 입력해 주세요.'); show('Cron 분석 완료', [describeCronPart(parts[0], '분'), describeCronPart(parts[1], '시'), describeCronPart(parts[2], '일'), describeCronPart(parts[3], '월'), describeCronPart(parts[4], '요일(0·7 일요일)')].join('\n'), '간단한 5필드 문법 설명입니다. Quartz 등 확장 문법과 실제 다음 실행 시각은 대상 서비스에서 확인하세요.'); }
    },
    'subnet-calculator': () => {
      try { const ip = ipv4ToInt(required('ip')); const prefix = Number(value('prefix')); if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) fail('prefix', '프리픽스는 0~32 사이의 정수여야 합니다.'); const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0; const network = (ip & mask) >>> 0; const broadcast = (network | (~mask >>> 0)) >>> 0; const total = 2 ** (32 - prefix); const usable = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.max(0, total - 2); const first = prefix >= 31 ? network : network + 1; const last = prefix >= 31 ? broadcast : broadcast - 1; show(`/${prefix} 서브넷 계산`, `IP 주소: ${intToIpv4(ip)}\n서브넷 마스크: ${intToIpv4(mask)}\n네트워크: ${intToIpv4(network)}\n브로드캐스트: ${intToIpv4(broadcast)}\n첫 사용 주소: ${intToIpv4(first >>> 0)}\n마지막 사용 주소: ${intToIpv4(last >>> 0)}\n전체 주소 수: ${formatNumber(total)}\n일반 사용 가능 주소 수: ${formatNumber(usable)}`, '/31은 지점 간 링크, /32는 단일 호스트 관례를 적용했습니다. 실제 네트워크 정책을 확인하세요.'); } catch (error) { if (error.message === '__handled__') throw error; fail('ip', error.message); }
    },
    'jwt-decoder': () => {
      const token = required('source', 'JWT 문자열을 입력해 주세요.'); const parts = token.split('.'); if (parts.length !== 3) fail('source', 'JWT는 점(.)으로 구분된 세 부분이어야 합니다.');
      try { const header = JSON.parse(base64UrlDecode(parts[0])); const payload = JSON.parse(base64UrlDecode(parts[1])); const time = (entry) => Number.isFinite(entry) ? new Date(entry * 1000).toLocaleString('ko-KR') : '(없음)'; show('JWT 디코딩 완료', `[Header]\n${JSON.stringify(header, null, 2)}\n\n[Payload]\n${JSON.stringify(payload, null, 2)}\n\n발급 시각(iat): ${time(payload.iat)}\n만료 시각(exp): ${time(payload.exp)}${Number.isFinite(payload.exp) ? `\n현재 기준: ${payload.exp * 1000 < Date.now() ? '만료됨' : '유효 시간 범위 안'}` : ''}`, '서명은 검증하지 않습니다. 표시된 내용만으로 토큰을 신뢰하거나 인증에 사용하지 마세요.'); } catch (error) { fail('source', `JWT 내용을 UTF-8 JSON으로 해석할 수 없습니다. ${error.message}`); }
    },
    'hash-generator': async () => { const source = required('source', '해시를 만들 텍스트를 입력해 주세요.'); const algorithm = value('algorithm'); const hash = await digestText(algorithm, source); show(`${algorithm} 생성 완료`, hash, '해시는 단방향 요약값이며 비밀번호 저장용 키 파생 함수가 아닙니다.'); },
    'unicode-inspector': () => { const source = required('source', '확인할 문자를 입력해 주세요.'); const rows = Array.from(source).map((char, index) => { const point = char.codePointAt(0); const units = Array.from({ length: char.length }, (_, unitIndex) => char.charCodeAt(unitIndex)).map((unit) => `0x${unit.toString(16).toUpperCase().padStart(4,'0')}`); const bytes = [...new TextEncoder().encode(char)].map((byte) => byte.toString(16).toUpperCase().padStart(2,'0')).join(' '); return `${index + 1}. ${JSON.stringify(char)} · U+${point.toString(16).toUpperCase().padStart(4,'0')} · UTF-8 ${bytes} · UTF-16 ${units.join(' ')}`; }); show(`코드 포인트 ${formatNumber(rows.length)}개`, rows.join('\n')); }
  };

  const updateConditionalFields = () => {
    root.querySelectorAll('[data-show-when]').forEach((field) => {
      const [name, expected] = field.dataset.showWhen.split(':');
      const visible = value(name) === expected;
      field.hidden = !visible;
      field.querySelectorAll('input,select,textarea').forEach((control) => { control.disabled = !visible; });
    });
  };
  form.addEventListener('change', updateConditionalFields);
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); clearErrors(); form.querySelectorAll('[aria-invalid="true"]').forEach((item) => item.removeAttribute('aria-invalid'));
    try { await handlers[type]?.(); }
    catch (error) {
      if (error.message !== '__handled__') {
        const first = form.querySelector('textarea, input, select');
        const errorElement = first ? getError(first.name) : null;
        if (first) first.setAttribute('aria-invalid', 'true');
        if (errorElement) errorElement.textContent = `처리 중 오류가 발생했습니다. ${error.message}`;
        first?.focus();
      }
    }
  });
  form.addEventListener('reset', () => { requestAnimationFrame(() => { clearErrors(); resultText = ''; output.value = ''; resultContent.hidden = true; resultEmpty.hidden = false; updateConditionalFields(); }); });
  copyButton?.addEventListener('click', () => resultText && window.copyText(resultText, '결과를 복사했습니다.'));
  updateConditionalFields();
})();
