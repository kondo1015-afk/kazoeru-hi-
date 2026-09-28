// public/og/*.svg を PNG に変換する。
//   node scripts/render-og.mjs
//
// X などのカード画像は SVG に対応していないため、PNG が要る。
// resvg が入っていない環境では、警告だけ出して何もしない（サイト自体は動く）。

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PUBLIC_DIR } from './lib.mjs';

const ogDir = path.join(PUBLIC_DIR, 'og');
if (!existsSync(ogDir)) {
  console.log('public/og がありません。先に build.mjs を実行してください。');
  process.exit(0);
}

let Resvg;
try {
  ({ Resvg } = await import('@resvg/resvg-js'));
} catch {
  console.warn('△ @resvg/resvg-js が入っていないので PNG を作りません（npm install で入ります）');
  process.exit(0);
}

const svgs = (await readdir(ogDir)).filter((f) => f.endsWith('.svg'));
let made = 0;

for (const file of svgs) {
  const svg = await readFile(path.join(ogDir, file), 'utf8');
  const r = new Resvg(svg, {
    font: { loadSystemFonts: true, defaultFontFamily: 'Noto Sans CJK JP' },
    fitTo: { mode: 'width', value: 1200 },
  });
  await writeFile(path.join(ogDir, file.replace(/\.svg$/, '.png')), r.render().asPng());
  made++;
}

console.log(`OGP画像を ${made} 枚を PNG にしました`);
