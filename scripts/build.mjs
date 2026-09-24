// data/posts/*.json とトピックモジュールから public/ を組み立てる。
//   node scripts/build.mjs

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  loadTopics, loadPosts, escapeHtml, render,
  PUBLIC_DIR, TEMPLATES_DIR,
} from './lib.mjs';

const SITE_NAME = '数える日';
const SITE_TAGLINE = '1日ひとつ、世界を数字で見る';

const topics = await loadTopics();
const byId = new Map(topics.map((t) => [t.meta.id, t]));
const posts = await loadPosts();

if (posts.length === 0) {
  console.error('data/posts が空です。先に node scripts/generate.mjs を実行してください。');
  process.exit(1);
}

const css = await readFile(path.join(TEMPLATES_DIR, 'site.css'), 'utf8');
const postTpl = await readFile(path.join(TEMPLATES_DIR, 'post.html'), 'utf8');
const indexTpl = await readFile(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');

await rm(PUBLIC_DIR, { recursive: true, force: true });
await mkdir(path.join(PUBLIC_DIR, 'p'), { recursive: true });

function jpNum(v) {
  if (!Number.isFinite(v)) return '∞';
  const trim = (s) => (s.indexOf('.') >= 0 ? s.replace(/\.?0+$/, '') : s);
  const a = Math.abs(v);
  if (a >= 1e12) return trim((v / 1e12).toFixed(2)) + '兆';
  if (a >= 1e8) return trim((v / 1e8).toFixed(2)) + '億';
  if (a >= 1e4) return trim((v / 1e4).toFixed(2)) + '万';
  if (a >= 100) return Math.round(v).toLocaleString('ja-JP');
  if (a >= 1) return trim((Math.round(v * 10) / 10).toFixed(1));
  return trim((Math.round(v * 100) / 100).toFixed(2));
}

function archiveHtml(list, rootPrefix, skipDate) {
  return list
    .filter((p) => p.date !== skipDate)
    .slice(0, 40)
    .map((p) => `<li><a href="${rootPrefix}p/${p.date}.html">
      <span class="archive__date">${p.date.slice(5)}</span>
      <span class="archive__title">${escapeHtml(p.title)}</span>
      <span class="archive__num">${jpNum(p.headline.value)}${escapeHtml(p.headline.unit)}</span>
    </a></li>`)
    .join('');
}

let built = 0;
for (const post of posts) {
  const topic = byId.get(post.topicId);
  if (!topic) {
    console.warn(`スキップ: ${post.date} のトピック ${post.topicId} が見つかりません`);
    continue;
  }

  // compute のソースをそのまま埋め込む。純粋関数でないとここで壊れる。
  const src = topic.compute.toString();
  if (!/^function\s/.test(src)) {
    throw new Error(`${post.topicId}: compute は function 宣言で書いてください（アロー関数だと埋め込めません）`);
  }

  const result = topic.compute(post.params);

  const html = render(postTpl, {
    SITE_NAME: escapeHtml(SITE_NAME),
    ROOT: '../',
    DATE: post.date,
    TITLE: escapeHtml(post.title),
    LEDE: escapeHtml(post.lede),
    HEADLINE_VALUE: jpNum(result.headline.value),
    HEADLINE_UNIT: escapeHtml(result.headline.unit),
    HEADLINE_LABEL: escapeHtml(result.headline.label),
    META_JSON: JSON.stringify(topic.meta),
    PARAMS_JSON: JSON.stringify(post.params),
    COMPUTE_SRC: src,
    ARCHIVE: archiveHtml(posts, '../', post.date),
    CSS: css,
  });

  await writeFile(path.join(PUBLIC_DIR, 'p', `${post.date}.html`), html);
  built++;
}

await writeFile(
  path.join(PUBLIC_DIR, 'index.html'),
  render(indexTpl, {
    SITE_NAME: escapeHtml(SITE_NAME),
    SITE_TAGLINE: escapeHtml(SITE_TAGLINE),
    COUNT: String(built),
    ARCHIVE: archiveHtml(posts, '', null),
    CSS: css,
  })
);

// Pages が _ 始まりのパスを Jekyll 扱いしないように
await writeFile(path.join(PUBLIC_DIR, '.nojekyll'), '');

console.log(`public/ に ${built} 本を書き出しました`);
