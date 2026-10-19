import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const files = ['magazine.json', 'magazine-more.json', 'magazine-more-2.json', 'magazine-life.json'];

export async function loadMagazineArticles() {
  const groups = await Promise.all(files.map(async (file) => {
    const data = JSON.parse(await readFile(resolve(root, 'content', file), 'utf8'));
    if (!Array.isArray(data.articles)) throw new Error(`${file}: articles 배열이 없습니다.`);
    return data.articles;
  }));
  return groups.flat();
}
