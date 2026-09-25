export const meta = {
  id: 'lottery-weekly',
  title: '毎週買い続けたら、一生のうち一度は当たるのか',
  lede: '続けていればいつかは、と思いたくなります。確率を積み上げるとどうなるかを見てみます。',
  category: 'chance',
  params: [
    { key: 'odds',   label: '当たる確率（○分の1）', min: 1000, max: 20000000, step: 1000, value: 10000000, unit: '分の1' },
    { key: 'tickets', label: '1回に買う枚数',       min: 1,    max: 50,       step: 1,    value: 3,        unit: '枚' },
    { key: 'years',  label: '続ける年数',           min: 1,    max: 70,       step: 1,    value: 50,       unit: '年' },
  ],
  presetsLabel: 'いろいろ試す',
  presets: [
    { kind: 'variant', label: '1000万分の1',    values: { odds: 10000000 } },
    { kind: 'variant', label: '100万分の1',     values: { odds: 1000000 } },
    { kind: 'variant', label: '10万分の1',      values: { odds: 100000 } },
    { kind: 'variant', label: '毎回30枚買う',    values: { tickets: 30 } },
    { kind: 'variant', label: '10年だけ続ける',  values: { years: 10 } },
  ],
};

export function compute(p) {
  var per = 1 / p.odds;
  var draws = p.tickets * 52 * p.years;
  var never = Math.pow(1 - per, draws);
  var ever = 1 - never;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var y = p.years * i / pts;
    var d = p.tickets * 52 * y;
    series.push({ x: y, y: (1 - Math.pow(1 - per, d)) * 100 });
  }

  return {
    headline: { value: ever * 100, unit: '%', label: p.years + '年で一度でも当たる確率' },
    stats: [
      { label: '買う総枚数', value: draws, unit: '枚' },
      { label: '一度も当たらない確率', value: never * 100, unit: '%' },
      { label: '五分五分になる枚数', value: per > 0 ? Math.log(0.5) / Math.log(1 - per) : 0, unit: '枚' },
    ],
    axis: { x: '経過年数', y: '一度でも当たる確率（%）' },
    series: series,
    notes: [
      '毎回独立に抽選されるものとして計算しています。枚数を増やしても、確率は枚数に比例して増えるだけです。',
      '当選金額や購入費は計算に入れていません。確率だけを見るための数字です。',
    ],
  };
}
