// その日のトピックを1つ選び、data/posts/YYYY-MM-DD.json を書き出す。
// 数字はここで確定させず、初期パラメータだけ記録する（計算はビルド時とブラウザ側で行う）。
//
//   node scripts/generate.mjs              … 今日のぶんを作る（既にあれば何もしない）
//   node scripts/generate.mjs --date 2026-10-01
//   node scripts/generate.mjs --topic yen-savings --force

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadTopics, loadPosts, defaultsOf, todayJST, POSTS_DIR } from './lib.mjs';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : null;
}
const force = process.argv.includes('--force');

const date = arg('date') ?? todayJST();
const outFile = path.join(POSTS_DIR, `${date}.json`);

if (existsSync(outFile) && !force) {
  console.log(`${date} は既にあります。何もしません。`);
  process.exit(0);
}

const topics = await loadTopics();
if (topics.length === 0) throw new Error('topics/ が空です');

const posts = await loadPosts();

let topic;
const wanted = arg('topic');
if (wanted) {
  topic = topics.find((t) => t.meta.id === wanted);
  if (!topic) throw new Error(`トピックが見つかりません: ${wanted}`);
} else {
  // いちばん長く使っていないトピックを選ぶ（未使用のものが最優先）
  const lastUsed = new Map();
  for (const p of posts) if (!lastUsed.has(p.topicId)) lastUsed.set(p.topicId, p.date);
  topic = topics
    .map((t) => ({ t, last: lastUsed.get(t.meta.id) ?? '' }))
    .sort((a, b) => (a.last === b.last ? a.t.meta.id.localeCompare(b.t.meta.id) : a.last < b.last ? -1 : 1))[0].t;
}

const params = defaultsOf(topic.meta);
const result = topic.compute(params); // ここで一度回して、式が壊れていないか確かめる

const post = {
  date,
  topicId: topic.meta.id,
  title: topic.meta.title,
  lede: topic.meta.lede,
  params,
  headline: result.headline,
  generatedAt: new Date().toISOString(),
};

await mkdir(POSTS_DIR, { recursive: true });
await writeFile(outFile, JSON.stringify(post, null, 2) + '\n');
console.log(`書き出しました: data/posts/${date}.json (${topic.meta.id})`);
