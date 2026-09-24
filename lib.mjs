import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CATEGORY_BY_ID } from './categories.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TOPICS_DIR = path.join(ROOT, 'topics');
export const POSTS_DIR = path.join(ROOT, 'data', 'posts');
export const PUBLIC_DIR = path.join(ROOT, 'public');
export const TEMPLATES_DIR = path.join(ROOT, 'templates');

// topics/ 直下の .mjs をすべて読み込む。_ で始まるファイルは無視（下書き置き場）。
export async function loadTopics() {
  const files = (await readdir(TOPICS_DIR))
    .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
    .sort();

  const topics = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(TOPICS_DIR, file)).href);
    if (!mod.meta || typeof mod.compute !== 'function') {
      throw new Error(`${file}: meta と compute の両方を export してください`);
    }
    if (mod.meta.id !== path.basename(file, '.mjs')) {
      throw new Error(`${file}: meta.id はファイル名と揃えてください`);
    }
    if (!CATEGORY_BY_ID.has(mod.meta.category)) {
      const ids = [...CATEGORY_BY_ID.keys()].join(' / ');
      throw new Error(`${file}: meta.category を ${ids} のどれかにしてください（今は ${mod.meta.category}）`);
    }
    topics.push({ file, meta: mod.meta, compute: mod.compute });
  }
  return topics;
}

export async function loadPosts() {
  if (!existsSync(POSTS_DIR)) return [];
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.json'));
  const posts = [];
  for (const f of files) {
    posts.push(JSON.parse(await readFile(path.join(POSTS_DIR, f), 'utf8')));
  }
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1)); // 新しい順
}

export function defaultsOf(meta) {
  return Object.fromEntries(meta.params.map((p) => [p.key, p.value]));
}

// JST の YYYY-MM-DD
export function todayJST(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : '');
}
