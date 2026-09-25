export const meta = {
  id: 'subscription',
  title: 'サブスクを1本減らすと、20年でいくら浮くのか',
  lede: '月に千円。単体では気にならない額が、本数と年数を掛けるとまとまった金額になります。',
  category: 'money',
  params: [
    { key: 'monthly', label: '1本あたりの月額', min: 300, max: 5000, step: 100, value: 1000, unit: '円' },
    { key: 'count',   label: '契約している本数', min: 1,   max: 15,   step: 1,   value: 4,    unit: '本' },
    { key: 'years',   label: '続ける年数',      min: 1,   max: 40,   step: 1,   value: 20,   unit: '年' },
  ],
  presetsLabel: 'よくある条件を入れる',
  presets: [
    { kind: 'variant', label: '動画2本だけ',     values: { monthly: 1200, count: 2 } },
    { kind: 'variant', label: '気づいたら7本',   values: { count: 7 } },
    { kind: 'variant', label: '月額500円のもの', values: { monthly: 500 } },
    { kind: 'variant', label: '10年で見る',      values: { years: 10 } },
  ],
};

export function compute(p) {
  var perMonth = p.monthly * p.count;
  var months = p.years * 12;
  var total = perMonth * months;
  var oneLess = p.monthly * months;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var y = p.years * i / pts;
    series.push({ x: y, y: perMonth * 12 * y });
  }

  return {
    headline: { value: total, unit: '円', label: p.years + '年で払う総額' },
    stats: [
      { label: '毎月の合計', value: perMonth, unit: '円' },
      { label: '1年あたり', value: perMonth * 12, unit: '円' },
      { label: '1本やめると浮く額', value: oneLess, unit: '円' },
    ],
    axis: { x: '経過年数', y: '払った額（円）' },
    series: series,
    notes: [
      '値上げや解約は考えていません。同じ本数・同じ額で続いた場合の計算です。',
    ],
  };
}
