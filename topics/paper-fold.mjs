export const meta = {
  id: 'paper-fold',
  title: 'もしも紙を折り続けたら、月まで何回で届くか',
  lede: '1回折れば2倍、2回で4倍。倍々に増えるものは、途中まで何も起きていないように見えます。',
  category: 'world',
  params: [
    { key: 'thickness', label: '紙の厚さ',   min: 0.01, max: 1,      step: 0.01, value: 0.1,    unit: 'mm' },
    { key: 'goalKm',    label: '届かせたい距離', min: 0.001, max: 400000, step: 0.001, value: 384400, unit: 'km' },
  ],
  presetsLabel: '目標を入れ替える',
  presets: [
    { kind: 'variant', label: '富士山（3.776km）',      values: { goalKm: 3.776 } },
    { kind: 'variant', label: 'エベレスト（8.849km）',  values: { goalKm: 8.849 } },
    { kind: 'variant', label: '成層圏まで（50km）',     values: { goalKm: 50 } },
    { kind: 'variant', label: '月まで（384,400km）',    values: { goalKm: 384400 } },
  ],
};

export function compute(p) {
  var t = p.thickness / 1000 / 1000;   // mm → km
  var need = Math.ceil(Math.log(p.goalKm / t) / Math.log(2));
  if (!Number.isFinite(need) || need < 0) need = 0;

  var atNeed = t * Math.pow(2, need);
  var at10 = p.thickness * Math.pow(2, 10);   // mm のまま

  var series = [];
  var span = Math.min(need + 5, 60);
  for (var n = 1; n <= span; n++) series.push({ x: n, y: t * Math.pow(2, n) });

  return {
    headline: { value: need, unit: '回', label: '目標に届くまでに折る回数' },
    stats: [
      { label: 'その回数での厚さ', value: atNeed, unit: 'km' },
      { label: '10回折った厚さ', value: at10, unit: 'mm' },
      { label: '20回折った厚さ', value: p.thickness * Math.pow(2, 20) / 1000, unit: 'm' },
    ],
    axis: { x: '折った回数', y: '厚さ（km）' },
    series: series,
    notes: [
      '10回折っても10cmほど。そこから急に伸びます。倍々に増えるものは、後半までほとんど動いて見えません。',
      '実際の紙は面積が半分ずつ減るため、何度も折ることはできません。これは厚さの計算だけを追ったものです。',
    ],
  };
}
