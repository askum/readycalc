import { readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const calculatorRoot = resolve(root, 'calculator');
const routes = (await readdir(calculatorRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== 'developer')
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, 'en'));

const lines = [
  '/travel-itinerary-generator / 301',
  '/travel-itinerary-generator/ / 301'
];

for (const route of routes) {
  lines.push(`/${route} /${route}/ 301`);
  lines.push(`/${route}/ /calculator/${route}/ 200`);
}

lines.push('/developer / 301');
lines.push('/developer/ / 301');
lines.push('/developer/* /calculator/developer/:splat 200');
lines.push('/travel-itinerary-generator/* / 301');

await writeFile(resolve(root, '_redirects'), `${lines.join('\n')}\n`);
console.log(`계산기 ${routes.length}개에 대한 ${lines.length}개 redirect 규칙을 생성했습니다.`);
