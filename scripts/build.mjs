// data/posts/*.json とトピックモジュールから public/ を組み立てる。
//   node scripts/build.mjs

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  loadTopics, loadPosts, escapeHtml, render,
  PUBLIC_DIR, TEMPLATES_DIR,
} from './lib.mjs';
import { CATEGORIES, CATEGORY_BY_ID } from './categories.mjs';
import { ogSvg, siteOgSvg } from './og-image.mjs';

const SITE_NAME = 'もしも';
// 公開先のURL。末尾にスラッシュを付けない。OGP画像の絶対URLに使う。
const SITE_URL = 'https://kondo1015-afk.github.io/moshimo';
// Google Analytics の測定ID。空にすれば解析タグは一切入らない。
const GA_ID = 'G-SGZCKHV2R3';
// OGP画像に埋め込むフォント名。GitHub Actions では fonts-noto-cjk が入る。
const OG_FONT = 'Noto Sans CJK JP';
// お問い合わせフォームのURL。Googleフォームを作ったらここを差し替える。
const CONTACT_URL = 'https://forms.gle/REPLACE-ME';
const SITE_TAGLINE = 'もしも、を計算してみる';
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
const pageTpl = await readFile(path.join(TEMPLATES_DIR, 'page.html'), 'utf8');

await rm(PUBLIC_DIR, { recursive: true, force: true });
await mkdir(path.join(PUBLIC_DIR, 'p'), { recursive: true });
await mkdir(path.join(PUBLIC_DIR, 'c'), { recursive: true });
await mkdir(path.join(PUBLIC_DIR, 'og'), { recursive: true });

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

// GA_ID が空なら何も出さない（解析を止めたいときはIDを消すだけでよい）
function analytics() {
  if (!GA_ID) return '';
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_ID}');
</script>`;
}

function footer(rootPrefix) {
  return `<footer class="sitefoot">
    <nav class="sitefoot__nav">
      <a href="${rootPrefix}index.html">トップ</a>
      <a href="${rootPrefix}about.html">このサイトについて</a>
      <a href="${rootPrefix}privacy.html">プライバシーポリシー</a>
      <a href="${CONTACT_URL}" rel="noopener">お問い合わせ</a>
    </nav>
    <p class="sitefoot__note">計算はすべてページ内で完結します。入力した値がどこかに送られることはありません。統計を使った回には出典を添えています。</p>
  </footer>`;
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

  await writeFile(
    path.join(PUBLIC_DIR, 'og', `${post.date}.svg`),
    ogSvg({
      siteName: SITE_NAME,
      title: post.title,
      value: jpNum(result.headline.value),
      unit: result.headline.unit,
      label: result.headline.label,
      category: cat.name,
      fontFamily: OG_FONT,
    })
  );

  const html = render(postTpl, {
    SITE_NAME: escapeHtml(SITE_NAME),
    ROOT: '../',
    OG_IMAGE: `${SITE_URL}/og/${post.date}.png`,
    OG_URL: `${SITE_URL}/p/${post.date}.html`,
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
    FOOTER: footer('../'),
    ANALYTICS: analytics(),
    CSS: css,
  });

  await writeFile(path.join(PUBLIC_DIR, 'p', `${post.date}.html`), html);
  built++;
}

// ---- カテゴリページ ------------------------------------------------------

for (const c of CATEGORIES) {
  const list = posts.filter((p) => catOf(p) === c.id);

  await writeFile(
    path.join(PUBLIC_DIR, 'og', `c-${c.id}.svg`),
    siteOgSvg({ siteName: SITE_NAME, headline: c.name, sub: c.tagline, fontFamily: OG_FONT })
  );
  await writeFile(
    path.join(PUBLIC_DIR, 'c', `${c.id}.html`),
    render(catTpl, {
      SITE_NAME: escapeHtml(SITE_NAME),
      CATEGORY_NAME: escapeHtml(c.name),
      CATEGORY_LEDE: escapeHtml(c.lede),
      COUNT: String(list.length),
      TABS: tabs('../', c.id),
      FOOTER: footer('../'),
      ANALYTICS: analytics(),
      OG_URL: `${SITE_URL}/c/${c.id}.html`,
      OG_IMAGE: `${SITE_URL}/og/c-${c.id}.png`,
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
  path.join(PUBLIC_DIR, 'og', 'site.svg'),
  siteOgSvg({ siteName: SITE_NAME, headline: SITE_TAGLINE, sub: 'もしもあなたが ／ もしも世界が　毎日ひとつ更新', fontFamily: OG_FONT })
);

await writeFile(
  path.join(PUBLIC_DIR, 'index.html'),
  render(indexTpl, {
    SITE_NAME: escapeHtml(SITE_NAME),
    SITE_TAGLINE: escapeHtml(SITE_TAGLINE),
    COUNT: String(built),
    SECTIONS: sections,
    FOOTER: footer(''),
    ANALYTICS: analytics(),
    OG_URL: `${SITE_URL}/`,
    OG_IMAGE: `${SITE_URL}/og/site.png`,
    CSS: css,
  })
);

// ---- 固定ページ ----------------------------------------------------------

const staticDir = path.join(TEMPLATES_DIR, 'static');
const { readdir } = await import('node:fs/promises');
for (const file of (await readdir(staticDir)).filter((f) => f.endsWith('.html'))) {
  const raw = await readFile(path.join(staticDir, file), 'utf8');
  const title = raw.match(/<!--title:\s*(.*?)-->/)?.[1]?.trim();
  const desc = raw.match(/<!--desc:\s*(.*?)-->/)?.[1]?.trim() ?? '';
  if (!title) throw new Error(`templates/static/${file}: 先頭に <!--title: …--> を書いてください`);

  const body = raw.replace(/<!--(title|desc):[\s\S]*?-->/g, '').trim();

  await writeFile(
    path.join(PUBLIC_DIR, file),
    render(pageTpl, {
      SITE_NAME: escapeHtml(SITE_NAME),
      PAGE_TITLE: escapeHtml(title),
      PAGE_DESC: escapeHtml(desc),
      OG_URL: `${SITE_URL}/${file}`,
      OG_IMAGE: `${SITE_URL}/og/site.png`,
      BODY: body.replaceAll('{{CONTACT_URL}}', CONTACT_URL),
      FOOTER: footer(''),
      ANALYTICS: analytics(),
      CSS: css,
    })
  );
}

await writeFile(path.join(PUBLIC_DIR, '.nojekyll'), '');

const tally = CATEGORIES.map((c) => `${c.name} ${posts.filter((p) => catOf(p) === c.id).length}`).join(' / ');
console.log(`public/ に ${built} 本（${tally}）`);
