// AI に新しいトピック案を書かせて topics/_drafts/ に置く。
// ここが「AIがネタを出す」入口。ただし数字を書かせるのではなく、
// 計算式（純粋関数）を書かせて、実際の数字はコードに出させる。
// 出来たものは必ず人間が読んでから topics/ に移すこと。
//
//   ANTHROPIC_API_KEY=... node scripts/propose-topic.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadTopics, TOPICS_DIR } from './lib.mjs';
import { CATEGORIES } from './categories.mjs';

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) {
  console.error('ANTHROPIC_API_KEY を設定してください');
  process.exit(1);
}

const all = await loadTopics();
const existing = all.map((t) => `- [${t.meta.category}] ${t.meta.id}: ${t.meta.title}`).join('\n');
const catList = CATEGORIES.map((c) => `- ${c.id}（${c.name}）: ${c.tagline}`).join('\n');

// いちばん本数が少ないカテゴリを狙う
const tally = new Map(CATEGORIES.map((c) => [c.id, 0]));
for (const t of all) tally.set(t.meta.category, tally.get(t.meta.category) + 1);
const wantCat = [...tally.entries()].sort((a, b) => a[1] - b[1])[0][0];

const prompt = `あなたは「1日ひとつ、世界を数字で見る」というサイトのネタ出し担当です。
新しいトピックを1つ考え、下の形式の JavaScript モジュールとして出力してください。

厳守すること:
- compute は純粋関数。外部変数・import・Math 以外のグローバルを使わない。
- 統計データを引用しない。四則演算だけで答えが出るネタにする。
  （例: 時間の積み重ね、距離、回数、確率、単位の換算）
- 調べないと分からない数字を定数として書かない。分からない値はパラメータにする。
- params は3〜4個。すべて range で動かせる数値にする。
- meta.category は '${wantCat}' にする。
- 日本語。説明的でなく、読んで「へえ」と思える切り口にする。

分類:
${catList}

既にあるトピック（重複させない）:
${existing}

出力は JavaScript のコードのみ。前置きも \`\`\` も付けないでください。
形式:

export const meta = {
  id: 'kebab-case-id',
  title: '…',
  lede: '…',
  category: '${wantCat}',
  params: [
    { key: '…', label: '…', min: 0, max: 0, step: 0, value: 0, unit: '…' },
  ],
};

export function compute(p) {
  // …
  return {
    headline: { value: 0, unit: '…', label: '…' },
    stats: [{ label: '…', value: 0, unit: '…' }],
    axis: { x: '…', y: '…' },
    series: [{ x: 0, y: 0 }],
    notes: ['…'],
  };
}`;

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  }),
});

if (!res.ok) {
  console.error(`API エラー ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const code = data.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  .replace(/^```(?:javascript|js)?\n?/, '').replace(/```\s*$/, '').trim();

const id = code.match(/id:\s*'([^']+)'/)?.[1];
if (!id) {
  console.error('id を読み取れませんでした。出力:\n' + code.slice(0, 400));
  process.exit(1);
}

const draftDir = path.join(TOPICS_DIR, '_drafts');
await mkdir(draftDir, { recursive: true });
const file = path.join(draftDir, `${id}.mjs`);
await writeFile(file, code + '\n');

// その場で動かして、壊れていないか確かめる
const mod = await import(`file://${file}`);
const out = mod.compute(Object.fromEntries(mod.meta.params.map((x) => [x.key, x.value])));
if (!Number.isFinite(out.headline.value)) throw new Error('headline.value が数値になりません');
if (!Array.isArray(out.series) || out.series.length < 2) throw new Error('series が足りません');

console.log(`下書き: topics/_drafts/${id}.mjs（分類: ${mod.meta.category}）`);
console.log(`試算: ${out.headline.label} = ${out.headline.value} ${out.headline.unit}`);
console.log('中身を読んで問題なければ topics/ に移してください。');
