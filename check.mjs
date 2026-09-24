// 壊れているところを早めに見つけるための検査。
//   node scripts/check.mjs
//
// 1. 全トピックを、つまみの端から端まで動かして計算が壊れないか確かめる
// 2. ビルド済みページの中の JavaScript を、簡易DOMの上で実際に動かしてみる

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadTopics, defaultsOf, PUBLIC_DIR } from './lib.mjs';

let failed = 0;
function fail(msg) { console.error('  NG  ' + msg); failed++; }
function ok(msg) { console.log('  ok  ' + msg); }

// ---- 1. トピックの検査 ---------------------------------------------------

const topics = await loadTopics();
console.log(`トピック ${topics.length} 件を検査します\n`);

for (const t of topics) {
  console.log(t.meta.id);

  const src = t.compute.toString();
  if (!/^function\s/.test(src)) fail('compute が function 宣言ではありません');
  // 純粋関数チェック（ざっくり）: モジュール内の他の名前を掴んでいないか
  for (const bad of ['meta', 'require', 'import', 'process', 'window', 'document']) {
    if (new RegExp(`\\b${bad}\\b`).test(src)) fail(`compute が ${bad} を参照しています`);
  }

  const defaults = defaultsOf(t.meta);

  // atLeast / atMost の参照先が実在するか、初期値がそれを満たしているか
  const keys = new Set(t.meta.params.map((p) => p.key));
  for (const p of t.meta.params) {
    for (const rel of ['atLeast', 'atMost']) {
      if (!p[rel]) continue;
      if (!keys.has(p[rel])) { fail(`${p.key}.${rel} の参照先 ${p[rel]} がありません`); continue; }
      const okNow = rel === 'atLeast'
        ? defaults[p.key] >= defaults[p[rel]]
        : defaults[p.key] <= defaults[p[rel]];
      if (!okNow) fail(`初期値が ${p.key}.${rel}=${p[rel]} を満たしていません`);
    }
  }

  // つまみ1つずつを min / 中間 / max に振って試す
  const cases = [{ name: '初期値', p: defaults }];
  for (const prm of t.meta.params) {
    for (const [tag, v] of [['min', prm.min], ['mid', (prm.min + prm.max) / 2], ['max', prm.max]]) {
      cases.push({ name: `${prm.key}=${tag}`, p: { ...defaults, [prm.key]: v } });
    }
  }

  let bad = 0;
  for (const c of cases) {
    let r;
    try { r = t.compute(c.p); }
    catch (e) { fail(`${c.name} で例外: ${e.message}`); bad++; continue; }

    if (!r?.headline || !Number.isFinite(r.headline.value)) { fail(`${c.name}: headline.value が数値になりません (${r?.headline?.value})`); bad++; }
    if (!Array.isArray(r?.series) || r.series.length < 2) { fail(`${c.name}: series が足りません`); bad++; }
    else if (r.series.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) { fail(`${c.name}: series に数値でない点があります`); bad++; }
    if (!r?.axis?.x || !r?.axis?.y) { fail(`${c.name}: axis が足りません`); bad++; }
    for (const s of r?.stats ?? []) {
      if (!Number.isFinite(s.value)) { fail(`${c.name}: stat「${s.label}」が数値になりません`); bad++; }
    }
  }
  if (bad === 0) ok(`${cases.length} 通り すべて通りました`);
  console.log('');
}

// ---- 2. ページ内 JavaScript の検査 ---------------------------------------

const samplePage = path.join(PUBLIC_DIR, 'p');
if (!existsSync(samplePage)) {
  console.log('public/ が無いので、ページの検査は飛ばします（先に build.mjs を実行してください）');
} else {
  const { readdir } = await import('node:fs/promises');
  const files = (await readdir(samplePage)).filter((f) => f.endsWith('.html'));
  console.log(`ページ ${files.length} 件を簡易DOM上で実行します\n`);

  for (const f of files) {
    const html = await readFile(path.join(samplePage, f), 'utf8');
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    if (!script) { fail(`${f}: script が見つかりません`); continue; }

    // 素のページ / つまみを1つだけ指定した共有URL、の両方で試す
    const meta = JSON.parse(script.match(/const META = (\{[\s\S]*?\});\n/)[1]);
    const first = meta.params[0];
    const cases = [
      { label: '', hash: '' },
      { label: ` (#?${first.key}=${first.value})`, hash: `#?${first.key}=${first.value}` },
    ];

    for (const c of cases) {
      try {
        const vals = runInStubDom(script, c.hash);
        // 指定していないつまみが初期値から動いていないこと
        for (const p of meta.params) {
          const shown = vals.get(p.key);
          const dec = (String(p.step).split('.')[1] || '').length;
          const want = p.value.toLocaleString('ja-JP',
            { minimumFractionDigits: dec, maximumFractionDigits: dec }) + p.unit;
          if (shown !== want) throw new Error(`つまみ「${p.label}」が ${want} ではなく ${shown} になりました`);
        }
        ok(f + c.label);
      } catch (e) {
        fail(`${f}${c.label}: ${e.message}`);
      }
    }
  }
}

console.log('');
if (failed > 0) { console.error(`${failed} 件の問題があります`); process.exit(1); }
console.log('問題なし');

// ---- 簡易DOM ------------------------------------------------------------

function runInStubDom(script, hash = '') {
  const made = [];
  function el(tag = 'div') {
    const node = {
      tagName: tag, innerHTML: '', textContent: '', value: '',
      className: '', id: '', type: '', htmlFor: '',
      children: [],
      append(...cs) { this.children.push(...cs); },
      addEventListener() {},
      setAttribute() {},
    };
    made.push(node);
    return node;
  }
  const byId = new Map();
  for (const id of ['headline', 'headlineLabel', 'controls', 'chart', 'stats', 'notes']) {
    byId.set(id, el());
  }
  const document = {
    createElement: (tag) => el(tag),
    getElementById: (id) => {
      if (byId.has(id)) return byId.get(id);
      const found = made.find((n) => n.id === id);
      return found ?? null;
    },
  };
  const location = { hash, pathname: '/p/test.html' };
  const history = { replaceState() {} };

  const fn = new Function('document', 'location', 'history', 'URLSearchParams', script);
  fn(document, location, history, URLSearchParams);

  const h = byId.get('headline').innerHTML;
  if (!h || /NaN|undefined/.test(h)) throw new Error(`headline が壊れています: ${h}`);
  const c = byId.get('chart').innerHTML;
  if (!c.includes('<svg')) throw new Error('グラフが描かれていません');
  if (/NaN/.test(c)) throw new Error('グラフの座標に NaN が入っています');

  // つまみの表示値を key => 表示文字列 で返す
  const vals = new Map();
  for (const n of made) {
    if (n.className === 'control__val' && n.id.startsWith('v-')) vals.set(n.id.slice(2), n.textContent);
  }
  return vals;
}
