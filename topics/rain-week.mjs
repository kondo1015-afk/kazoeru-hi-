export const meta = {
  id: 'rain-week',
  title: '降水確率30%の日が7日続くと、何日降るのか',
  lede: '1日だけ見れば「たぶん降らない」。でも1週間ぶん並べると、印象がかなり変わります。',
  category: 'chance',
  params: [
    { key: 'daily', label: '1日の降水確率', min: 0, max: 100, step: 1, value: 30, unit: '%' },
    { key: 'days',  label: '日数',         min: 1, max: 30,  step: 1, value: 7,  unit: '日' },
    { key: 'least', label: '何日以上降るか', min: 1, max: 10,  step: 1, value: 1,  unit: '日' },
  ],

  presetsLabel: 'よくある予報を入れる',
  presets: [
    { kind: 'variant', label: '毎日30%の1週間', values: { daily: 30, days: 7 } },
    { kind: 'variant', label: '毎日50%の1週間', values: { daily: 50, days: 7 } },
    { kind: 'variant', label: '毎日70%の1週間', values: { daily: 70, days: 7 } },
    { kind: 'variant', label: '梅雨の1か月ぶん', values: { daily: 60, days: 30 } },
    { kind: 'variant', label: '3日以上降るか',   values: { least: 3 } },
  ],
};

export function compute(p) {
  var q = p.daily / 100;
  var n = p.days;

  // ちょうど k 日降る確率（二項分布）
  function exactly(k) {
    if (k < 0 || k > n) return 0;
    var c = 1;
    for (var i = 0; i < k; i++) c = c * (n - i) / (i + 1);
    return c * Math.pow(q, k) * Math.pow(1 - q, n - k);
  }

  var atLeast = 0;
  for (var k = Math.min(p.least, n + 1); k <= n; k++) atLeast += exactly(k);
  if (p.least > n) atLeast = 0;

  var series = [];
  for (var k = 0; k <= n; k++) series.push({ x: k, y: exactly(k) * 100 });

  return {
    headline: { value: atLeast * 100, unit: '%', label: p.least + '日以上降る確率' },
    stats: [
      { label: '1日も降らない確率', value: exactly(0) * 100, unit: '%' },
      { label: '平均で降る日数', value: n * q, unit: '日' },
      { label: 'ちょうど' + p.least + '日の確率', value: exactly(p.least) * 100, unit: '%' },
    ],
    axis: { x: '降る日数', y: 'その日数になる確率（%）' },
    series: series,
    notes: [
      '各日が独立して降るものとして計算しています。実際の天気は前日と連動しやすいので、目安として見てください。',
      '降水確率30%は「1mm以上の雨が降る見込みが10回に3回」という意味で、雨の強さや長さを表すものではありません。',
    ],
  };
}
