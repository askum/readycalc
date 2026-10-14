import { access, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const calculatorRoot = resolve(root, 'calculator');
const hasPage = async (directory, name) => access(resolve(directory, name, 'index.html')).then(() => true, () => false);
const routes = (await readdir(calculatorRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== 'developer')
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, 'en'));
const publishedRoutes = (await Promise.all(routes.map(async (route) => await hasPage(calculatorRoot, route) ? route : null))).filter(Boolean);
const developerRoutes = (await readdir(resolve(calculatorRoot, 'developer'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, 'en'));
const publishedDeveloperRoutes = (await Promise.all(developerRoutes.map(async (route) => await hasPage(resolve(calculatorRoot, 'developer'), route) ? route : null))).filter(Boolean);

const lines = [
  '/travel-itinerary-generator / 301',
  '/travel-itinerary-generator/ / 301',
  '/tests / 301',
  '/tests/ / 301'
];

for (const route of publishedRoutes) {
  lines.push(`/${route} /${route}/ 301`);
  lines.push(`/${route}/ /calculator/${route}/ 200`);
}

lines.push('/developer / 301');
lines.push('/developer/ / 301');
for (const route of publishedDeveloperRoutes) lines.push(`/developer/${route} /developer/${route}/ 301`);
lines.push('/developer/* /calculator/developer/:splat 200');
lines.push('/travel-itinerary-generator/* / 301');

await writeFile(resolve(root, '_redirects'), `${lines.join('\n')}\n`);
console.log(`계산기 ${publishedRoutes.length + publishedDeveloperRoutes.length}개에 대한 ${lines.length}개 redirect 규칙을 생성했습니다.`);
