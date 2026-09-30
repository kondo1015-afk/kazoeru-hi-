// 記事1本ぶんの OGP 画像を SVG で組み立てる。
// ここでは SVG を作るだけ。PNG への変換は scripts/render-og.mjs が行う。
//
// サイズは 1200×630。X や LINE のカードがこの比率を想定している。

const W = 1200, H = 630;

// 全角を1、半角を0.55として幅を見積もる
function charWidth(ch) {
  return /[\x20-\x7e\uff61-\uff9f]/.test(ch) ? 0.55 : 1;
}

// 行数を先に決めてから均等に割る。1文字だけ次行に落ちるのを防ぐため。
// 句読点があれば、そこを優先して折る。
function wrap(text, maxPerLine, maxLines) {
  const width = (s) => [...s].reduce((a, c) => a + charWidth(c), 0);

  // 「、」「。」の直後で区切った塊に分ける
  const segs = [];
  let seg = '';
  for (const ch of text) {
    seg += ch;
    if ('、。'.includes(ch)) { segs.push(seg); seg = ''; }
  }
  if (seg) segs.push(seg);

  const total = width(text);
  const lineCount = Math.min(maxLines, Math.max(1, Math.ceil(total / maxPerLine)));
  const target = total / lineCount;

  const lines = [];
  let cur = '';
  for (const s of segs) {
    if (cur && width(cur) + width(s) > maxPerLine && lines.length < lineCount - 1) {
      lines.push(cur); cur = '';
    }
    cur += s;
    // 塊ひとつが1行に収まらないときだけ、文字単位で折る
    while (width(cur) > maxPerLine && lines.length < lineCount - 1) {
      let head = '', w = 0;
      for (const ch of cur) {
        const cw = charWidth(ch);
        if (w + cw > target && head) break;
        head += ch; w += cw;
      }
      // カタカナ語や英数字の途中で切らないよう、語の先頭まで戻す
      const wordChar = (c) => /[\u30a1-\u30fca-zA-Z0-9]/.test(c);
      let cut = head.length;
      if (cut < cur.length && wordChar(cur[cut]) && wordChar(cur[cut - 1])) {
        let back = cut;
        while (back > 1 && wordChar(cur[back - 1])) back--;
        if (back > 0) cut = back;
      }
      lines.push(cur.slice(0, cut));
      cur = cur.slice(cut);
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/**
 * @param {object} o
 * @param {string} o.siteName   サイト名
 * @param {string} o.title      記事タイトル
 * @param {string} o.value      見出しの数値（整形済み）
 * @param {string} o.unit       単位
 * @param {string} o.label      数値の説明
 * @param {string} o.category   分類名
 * @param {string} o.fontFamily 埋め込むフォント名
 */
export function ogSvg(o) {
  const paper = '#e9edf0';
  const card = '#fcfdfd';
  const ink = '#14222e';
  const muted = '#61707c';
  const line = '#c9d3da';
  const accent = '#0f7b6c';

  const titleLines = wrap(o.title, 16, 3);
  const titleSize = titleLines.length >= 3 ? 54 : 62;
  const titleTop = 168;

  // 数値が長いほど小さくする（はみ出し防止）
  // hideValue が真なら答えを伏せる（A/Bテスト用。日付の偶奇で切り替わる）
  const valueText = o.hideValue ? '？' + o.unit : o.value + o.unit;
  const vw = [...valueText].reduce((a, c) => a + (/[\x20-\x7e]/.test(c) ? 0.58 : 1), 0);
  const valueSize = o.hideValue ? 190 : Math.min(140, Math.floor(980 / Math.max(vw, 1)));

  const titleTspans = titleLines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : Math.round(titleSize * 1.34)}">${esc(l)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${paper}"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="${card}" stroke="${line}" stroke-width="2"/>

  <text x="80" y="96" font-family="${esc(o.fontFamily)}" font-size="26" fill="${muted}" letter-spacing="2">${esc(o.siteName)}</text>
  <line x1="80" y1="112" x2="${W - 80}" y2="112" stroke="${line}" stroke-width="1"/>

  <text x="80" y="${titleTop + titleSize}" font-family="${esc(o.fontFamily)}" font-size="${titleSize}"
        font-weight="600" fill="${ink}">${titleTspans}</text>

  <text x="80" y="${H - 132}" font-family="${esc(o.fontFamily)}" font-size="${valueSize}"
        font-weight="600" fill="${ink}">${esc(valueText)}</text>

  <rect x="80" y="${H - 104}" width="96" height="5" fill="${accent}"/>
  <text x="80" y="${H - 64}" font-family="${esc(o.fontFamily)}" font-size="28" fill="${muted}">${esc(o.label)}</text>

  <text x="${W - 80}" y="${H - 64}" text-anchor="end" font-family="${esc(o.fontFamily)}"
        font-size="26" fill="${accent}">${esc(o.category)}</text>
</svg>`;
}

/**
 * トップページ・分類ページ用のカード画像。記事と違って数値がないので、
 * サイト名とキャッチを大きく出す。
 */
export function siteOgSvg(o) {
  const paper = '#e9edf0';
  const card = '#fcfdfd';
  const ink = '#14222e';
  const muted = '#61707c';
  const line = '#c9d3da';
  const accent = '#0f7b6c';

  const heads = wrap(o.headline, 11, 2);
  const headSize = heads.length >= 2 ? 88 : 96;
  const tspans = heads
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : Math.round(headSize * 1.3)}">${esc(l)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${paper}"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="${card}" stroke="${line}" stroke-width="2"/>

  <text x="80" y="118" font-family="${esc(o.fontFamily)}" font-size="30" fill="${muted}" letter-spacing="3">${esc(o.siteName)}</text>
  <line x1="80" y1="140" x2="${W - 80}" y2="140" stroke="${line}" stroke-width="1"/>

  <text x="80" y="${heads.length >= 2 ? 290 : 340}" font-family="${esc(o.fontFamily)}" font-size="${headSize}"
        font-weight="600" fill="${ink}">${tspans}</text>

  <rect x="80" y="${H - 148}" width="130" height="7" fill="${accent}"/>
  <text x="80" y="${H - 96}" font-family="${esc(o.fontFamily)}" font-size="32" fill="${muted}">${esc(o.sub)}</text>
</svg>`;
}
