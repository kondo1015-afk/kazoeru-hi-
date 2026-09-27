export const meta = {
  id: 'half-gravity',
  title: 'もしも重力が半分だったら、どこまで跳べるか',
  lede: '跳べる高さは重力に反比例します。半分になれば倍、ではどこまで軽くなれば空を飛べるのか。',
  category: 'world',
  params: [
    { key: 'jump',    label: '地球で跳べる高さ', min: 10, max: 100, step: 1, value: 50, unit: 'cm' },
    { key: 'gravity', label: '重力の強さ',       min: 3,  max: 300, step: 1, value: 50, unit: '%' },
    { key: 'weight',  label: '体重',             min: 30, max: 150, step: 1, value: 60, unit: 'kg' },
  ],
  presetsLabel: 'ほかの星の重力にする',
  presets: [
    { kind: 'variant', label: '月（約17%）',     values: { gravity: 17 } },
    { kind: 'variant', label: '火星（約38%）',   values: { gravity: 38 } },
    { kind: 'variant', label: '地球（100%）',    values: { gravity: 100 } },
    { kind: 'variant', label: '木星（約253%）',  values: { gravity: 253 } },
  ],
};

export function compute(p) {
  var g0 = 9.8;
  var g = g0 * p.gravity / 100;
  var h0 = p.jump / 100;                  // 地球で跳べる高さ（m）

  // 踏み切りの初速は同じとして、高さは重力に反比例する
  var v = Math.sqrt(2 * g0 * h0);
  var h = g > 0 ? v * v / (2 * g) : 0;
  var hang = g > 0 ? 2 * v / g : 0;       // 滞空時間

  var series = [];
  for (var r = 3; r <= 300; r += 3) {
    var gg = g0 * r / 100;
    series.push({ x: r, y: v * v / (2 * gg) * 100 });
  }

  return {
    headline: { value: h * 100, unit: 'cm', label: '跳べる高さ' },
    stats: [
      { label: '滞空時間', value: hang, unit: '秒' },
      { label: '体重の感じ方', value: p.weight * p.gravity / 100, unit: 'kg' },
      { label: '地球と比べて', value: h0 > 0 ? h / h0 : 0, unit: '倍' },
    ],
    axis: { x: '重力の強さ（%）', y: '跳べる高さ（cm）' },
    series: series,
    notes: [
      '踏み切るときの速さは地球と同じとして計算しています。実際には宇宙服の重さや地面の硬さで変わります。',
      '月の重力はおよそ6分の1。地球で50cm跳べる人なら、3m近く浮き上がる計算になります。',
    ],
  };
}
