export const meta = {
  id: 'longer-day',
  title: 'もしも1日が25時間だったら、何が増えるのか',
  lede: '1日が1時間長くなっても、1年の長さは変わりません。増えるのは時間ではなく、起きている割合のほうです。',
  category: 'world',
  params: [
    { key: 'hours', label: '1日の長さ',   min: 12, max: 48,  step: 0.5, value: 25, unit: '時間' },
    { key: 'sleep', label: '1日に眠る時間', min: 4,  max: 12,  step: 0.5, value: 7,  unit: '時間' },
    { key: 'years', label: '数える年数',   min: 1,  max: 100, step: 1,   value: 80, unit: '年' },
  ],
  presetsLabel: 'いろいろな1日にする',
  presets: [
    { kind: 'variant', label: '1日20時間',  values: { hours: 20 } },
    { kind: 'variant', label: '1日25時間',  values: { hours: 25 } },
    { kind: 'variant', label: '1日30時間',  values: { hours: 30 } },
    { kind: 'variant', label: '1日48時間',  values: { hours: 48 } },
  ],
};

export function compute(p) {
  var hoursPerYear = 365.25 * 24;                     // 1年の長さは変わらない
  var daysPerYear = hoursPerYear / p.hours;           // かわりに「日」の数が変わる
  var sleep = Math.min(p.sleep, p.hours);
  var awakePerYear = daysPerYear * (p.hours - sleep);
  var basePerYear = 365.25 * (24 - Math.min(p.sleep, 24));
  var gainDays = (awakePerYear - basePerYear) * p.years / 24;

  var series = [];
  for (var h = 12; h <= 48; h += 0.5) {
    var d = hoursPerYear / h;
    var s = Math.min(p.sleep, h);
    series.push({ x: h, y: (d * (h - s) - basePerYear) * p.years / 24 });
  }

  return {
    headline: { value: gainDays, unit: '日', label: p.years + '年で増える起きている時間' },
    stats: [
      { label: '1年の日数', value: daysPerYear, unit: '日' },
      { label: '1年で起きている時間', value: awakePerYear, unit: '時間' },
      { label: '眠りに使う割合', value: p.hours > 0 ? sleep / p.hours * 100 : 0, unit: '%' },
    ],
    axis: { x: '1日の長さ（時間）', y: '増える起きている時間（日）' },
    series: series,
    notes: [
      '1年の長さ（地球が1周する時間）は変えずに、1日の区切り方だけを変えています。',
      '睡眠時間を固定したままなので、1日が長いほど眠りの割合が減り、起きている時間が増えます。1日が短いと逆に減ります。',
    ],
  };
}
