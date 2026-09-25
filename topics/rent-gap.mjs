export const meta = {
  id: 'rent-gap',
  title: '家賃を1万円下げると、何年でいくら浮くのか',
  lede: '毎月の差は小さく見えても、住み続ける年数を掛けると桁が変わります。浮いたぶんを寝かせずに運用した場合も試せます。',
  category: 'money',
  params: [
    { key: 'monthly', label: '月の差額',   min: 1000, max: 100000, step: 1000, value: 10000, unit: '円' },
    { key: 'years',   label: '住む年数',   min: 1,    max: 40,     step: 1,    value: 10,    unit: '年' },
    { key: 'rate',    label: '年利（運用した場合）', min: 0, max: 7, step: 0.1, value: 0,    unit: '%' },
  ],

  presetsLabel: 'よくある条件を入れる',
  presets: [
    { kind: 'variant', label: '5千円の差・10年',     values: { monthly: 5000,  years: 10, rate: 0 } },
    { kind: 'variant', label: '1万円の差・20年',     values: { monthly: 10000, years: 20, rate: 0 } },
    { kind: 'variant', label: '3万円の差・30年',     values: { monthly: 30000, years: 30, rate: 0 } },
    { kind: 'variant', label: '浮いたぶんを年利3%で', values: { rate: 3 } },
  ],
};

export function compute(p) {
  var n = Math.round(p.years * 12);
  var r = p.rate / 100 / 12;

  function fvAfter(months) {
    if (r === 0) return p.monthly * months;
    return p.monthly * (Math.pow(1 + r, months) - 1) / r;
  }

  var total = fvAfter(n);
  var principal = p.monthly * n;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var m = Math.round(n * i / pts);
    series.push({ x: p.years * i / pts, y: fvAfter(m) });
  }

  return {
    headline: { value: total, unit: '円', label: p.years + '年ぶんの差' },
    stats: [
      { label: '差額そのもの', value: principal, unit: '円' },
      { label: '運用で増えたぶん', value: total - principal, unit: '円' },
      { label: '1年あたり', value: p.monthly * 12, unit: '円' },
    ],
    axis: { x: '経過年数', y: '浮いた額（円）' },
    series: series,
    notes: [
      '年利を0%にすると、ただ貯めた場合の金額になります。',
      '年利は「もしこの利回りが続いたら」という仮定の計算で、将来を予測するものではありません。実際の運用には元本割れの可能性があります。',
    ],
  };
}
