export const meta = {
  id: 'daily-coffee',
  title: '毎日の一杯をやめると、何年で何が買えるか',
  lede: '1杯200円は安い買い物です。ただ、続く前提で見ると額の桁が変わります。',
  category: 'money',
  params: [
    { key: 'price', label: '1杯の値段',   min: 50, max: 800, step: 10, value: 200, unit: '円' },
    { key: 'days',  label: '週に飲む日数', min: 1,  max: 7,   step: 1,  value: 5,   unit: '日' },
    { key: 'years', label: '続ける年数',   min: 1,  max: 50,  step: 1,  value: 30,  unit: '年' },
  ],
  presetsLabel: 'よくある条件を入れる',
  presets: [
    { kind: 'variant', label: 'コンビニ 120円・毎日', values: { price: 120, days: 7 } },
    { kind: 'variant', label: 'カフェ 500円・平日',   values: { price: 500, days: 5 } },
    { kind: 'variant', label: '缶コーヒー 160円',     values: { price: 160 } },
    { kind: 'variant', label: '働く40年ぶん',         values: { years: 40 } },
  ],
};

export function compute(p) {
  var perYear = p.price * p.days * (365.25 / 7);
  var total = perYear * p.years;
  var cups = p.days * (365.25 / 7) * p.years;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var y = p.years * i / pts;
    series.push({ x: y, y: perYear * y });
  }

  return {
    headline: { value: total, unit: '円', label: p.years + '年ぶんの合計' },
    stats: [
      { label: '1か月あたり', value: perYear / 12, unit: '円' },
      { label: '1年あたり', value: perYear, unit: '円' },
      { label: '飲む杯数', value: cups, unit: '杯' },
    ],
    axis: { x: '経過年数', y: '使った額（円）' },
    series: series,
    notes: [
      '値上がりは考えていません。同じ値段で続いた場合の計算です。',
    ],
  };
}
