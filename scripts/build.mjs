// data/posts/*.json とトピックモジュールから public/ を組み立てる。
//   node scripts/build.mjs

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  loadTopics, loadPosts, escapeHtml, render,
  PUBLIC_DIR, TEMPLATES_DIR,
} from './lib.mjs';
import { CATEGORIES, CATEGORY_BY_ID } from './categories.mjs';

const SITE_NAME = '数える日';
const SITE_TAGLINE = '1日ひとつ、世界を数字で見る';
const TOP_PER_CATEGORY = 5;   // トップに並べるカテゴリごとの本数

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
const catTpl = await readFile(path.join(TEMPLATES_DIR, 'category.html'), 'utf8');

await rm(PUBLIC_DIR, { recursive: true, force: true });
await mkdir(path.join(PUBLIC_DIR, 'p'), { recursive: true });
await mkdir(path.join(PUBLIC_DIR, 'c'), { recursive: true });

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

// 投稿にカテゴリを引き当てる（トピック側が持っている）
function catOf(post) {
  return byId.get(post.topicId)?.meta.category ?? null;
}

function rows(list, rootPrefix, limit = 40) {
  return list.slice(0, limit).map((p) => `<li><a href="${rootPrefix}p/${p.date}.html">
      <span class="archive__date">${p.date.slice(5)}</span>
      <span class="archive__title">${escapeHtml(p.title)}</span>
      <span class="archive__num">${jpNum(p.headline.value)}${escapeHtml(p.headline.unit)}</span>
    </a></li>`).join('');
}

function tabs(rootPrefix, activeId) {
  return CATEGORIES.map((c) =>
    `<a class="cattab${c.id === activeId ? ' cattab--on' : ''}" href="${rootPrefix}c/${c.id}.html">${escapeHtml(c.name)}</a>`
  ).join('');
}

// ---- 記事ページ ----------------------------------------------------------

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
  const cat = CATEGORY_BY_ID.get(topic.meta.category);
  const sameCat = posts.filter((p) => p.date !== post.date && catOf(p) === cat.id);

  const html = render(postTpl, {
    SITE_NAME: escapeHtml(SITE_NAME),
    ROOT: '../',
    DATE: post.date,
    TITLE: escapeHtml(post.title),
    LEDE: escapeHtml(post.lede),
    CATEGORY_ID: cat.id,
    CATEGORY_NAME: escapeHtml(cat.name),
    HEADLINE_VALUE: jpNum(result.headline.value),
    HEADLINE_UNIT: escapeHtml(result.headline.unit),
    HEADLINE_LABEL: escapeHtml(result.headline.label),
    META_JSON: JSON.stringify(topic.meta),
    PARAMS_JSON: JSON.stringify(post.params),
    COMPUTE_SRC: src,
    ARCHIVE: rows(sameCat, '../', 12),
    CSS: css,
  });

  await writeFile(path.join(PUBLIC_DIR, 'p', `${post.date}.html`), html);
  built++;
}

// ---- カテゴリページ ------------------------------------------------------

for (const c of CATEGORIES) {
  const list = posts.filter((p) => catOf(p) === c.id);
  await writeFile(
    path.join(PUBLIC_DIR, 'c', `${c.id}.html`),
    render(catTpl, {
      SITE_NAME: escapeHtml(SITE_NAME),
      CATEGORY_NAME: escapeHtml(c.name),
      CATEGORY_LEDE: escapeHtml(c.lede),
      COUNT: String(list.length),
      TABS: tabs('', c.id),
      ARCHIVE: list.length
        ? rows(list, '../')
        : '<li class="archive__empty">この分類はまだ1本もありません。</li>',
      CSS: css,
    })
  );
}

// ---- トップページ --------------------------------------------------------

const sections = CATEGORIES.map((c) => {
  const list = posts.filter((p) => catOf(p) === c.id);
  const more = list.length > TOP_PER_CATEGORY
    ? `<p class="archive__more"><a href="c/${c.id}.html">「${escapeHtml(c.name)}」をすべて見る（${list.length}本）</a></p>`
    : '';
  return `<section class="catsection">
    <h2 class="catsection__head"><a href="c/${c.id}.html">${escapeHtml(c.name)}</a>
      <span class="catsection__tag">${escapeHtml(c.tagline)}</span></h2>
    <ol class="archive__list">${
      list.length ? rows(list, '', TOP_PER_CATEGORY)
                  : '<li class="archive__empty">この分類はまだ1本もありません。</li>'
    }</ol>${more}
  </section>`;
}).join('');

await writeFile(
  path.join(PUBLIC_DIR, 'index.html'),
  render(indexTpl, {
    SITE_NAME: escapeHtml(SITE_NAME),
    SITE_TAGLINE: escapeHtml(SITE_TAGLINE),
    COUNT: String(built),
    SECTIONS: sections,
    CSS: css,
  })
);

await writeFile(path.join(PUBLIC_DIR, '.nojekyll'), '');

const tally = CATEGORIES.map((c) => `${c.name} ${posts.filter((p) => catOf(p) === c.id).length}`).join(' / ');
console.log(`public/ に ${built} 本（${tally}）`);
