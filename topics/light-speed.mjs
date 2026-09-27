export const meta = {
  id: 'light-speed',
  title: 'もしも光の速さで進めたら、どこまで一瞬か',
  lede: '光は1秒で地球を7周半します。それでも、宇宙の距離の前ではあっという間とは言えません。',
  category: 'world',
  params: [
    { key: 'km',    label: '進む距離',     min: 1, max: 200000000, step: 100, value: 384400, unit: 'km' },
    { key: 'ratio', label: '光速に対する速さ', min: 1, max: 100,    step: 1,   value: 100,    unit: '%' },
  ],
  presetsLabel: '行き先を入れ替える',
  presets: [
    { kind: 'variant', label: '東京〜大阪（400km）',      values: { km: 400 } },
    { kind: 'variant', label: '地球1周（40,075km）',      values: { km: 40075 } },
    { kind: 'variant', label: '月（384,400km）',          values: { km: 384400 } },
    { kind: 'variant', label: '太陽（1億4960万km）',      values: { km: 149600000 } },
    { kind: 'variant', label: '光速の10%で',              values: { ratio: 10 } },
  ],
};

export function compute(p) {
  var c = 299792.458;                  // km/s
  var v = c * p.ratio / 100;
  var sec = v > 0 ? p.km / v : 0;

  var shinkansen = 320;                // km/h
  var years = p.km / shinkansen / 24 / 365.25;

  var series = [];
  var pts = 100;
  for (var i = 1; i <= pts; i++) {
    var r = 100 * i / pts;
    series.push({ x: r, y: p.km / (c * r / 100) });
  }

  return {
    headline: { value: sec, unit: '秒', label: 'かかる時間' },
    stats: [
      { label: '分に直すと', value: sec / 60, unit: '分' },
      { label: '時速に直すと', value: v * 3600, unit: 'km/h' },
      { label: '時速320kmなら', value: years, unit: '年' },
    ],
    axis: { x: '光速に対する速さ（%）', y: 'かかる時間（秒）' },
    series: series,
    notes: [
      '光の速さはおよそ秒速29万9792km。月までは1.3秒ほど、太陽までは8分20秒ほどかかります。',
      '加速や減速にかかる時間、相対性理論による時間の進み方の違いは考えていません。',
    ],
  };
}
