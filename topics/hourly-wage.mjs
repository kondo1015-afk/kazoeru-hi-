export const meta = {
  id: 'hourly-wage',
  title: 'その買い物は、何時間ぶんの労働か',
  lede: '値段を円ではなく時間で見ると、買うかどうかの判断が少し変わります。',
  category: 'money',
  params: [
    { key: 'price',   label: '買いたい物の値段', min: 100,    max: 500000,  step: 100,   value: 30000,  unit: '円' },
    { key: 'income',  label: '月の手取り',      min: 100000, max: 1000000, step: 10000, value: 250000, unit: '円' },
    { key: 'hours',   label: '月の労働時間',    min: 100,    max: 250,     step: 5,     value: 160,    unit: '時間' },
  ],
  presetsLabel: 'よくある買い物を入れる',
  presets: [
    { kind: 'variant', label: 'ランチ 1,000円',      values: { price: 1000 } },
    { kind: 'variant', label: 'スニーカー 15,000円', values: { price: 15000 } },
    { kind: 'variant', label: 'スマホ 120,000円',    values: { price: 120000 } },
    { kind: 'variant', label: '残業多め（200時間）',  values: { hours: 200 } },
  ],
};

export function compute(p) {
  var wage = p.income / p.hours;
  var needHours = wage > 0 ? p.price / wage : 0;

  var series = [];
  var pts = 100;
  var span = p.price * 2;
  for (var i = 0; i <= pts; i++) {
    var v = span * i / pts;
    series.push({ x: v, y: wage > 0 ? v / wage : 0 });
  }

  return {
    headline: { value: needHours, unit: '時間', label: '働いて取り返す時間' },
    stats: [
      { label: '時給に換算', value: wage, unit: '円' },
      { label: '1日8時間で', value: needHours / 8, unit: '日' },
      { label: '月の手取りに占める割合', value: p.income > 0 ? p.price / p.income * 100 : 0, unit: '%' },
    ],
    axis: { x: '値段（円）', y: '必要な労働時間' },
    series: series,
    notes: [
      '手取りを労働時間で割った、単純な時給換算です。通勤時間や税・社会保険料の内訳は含めていません。',
    ],
  };
}
