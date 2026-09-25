export const meta = {
  id: 'veggie-gap',
  title: '野菜の「あと少し」を積み上げると何kgか',
  lede: '1日にあと90g。小鉢ひとつぶんの差が、何年か続くとどれくらいの量になるのか。',
  category: 'stack',
  params: [
    { key: 'now',    label: '今の1日の摂取量', min: 50,  max: 600, step: 0.1, value: 258.7, unit: 'g' },
    { key: 'target', label: '目標',           min: 100, max: 500, step: 10,  value: 350,   unit: 'g' },
    { key: 'years',  label: '数える年数',     min: 1,   max: 60,  step: 1,   value: 30,    unit: '年' },
  ],
  presetsLabel: '実際の摂取量を入れる',
  presets: [
    { kind: 'data',    label: '20歳以上の平均 258.7g', values: { now: 258.7 } },
    { kind: 'data',    label: '男性の平均 268.6g',     values: { now: 268.6 } },
    { kind: 'data',    label: '女性の平均 250.3g',     values: { now: 250.3 } },
    { kind: 'data',    label: '20代の平均 210g前後',   values: { now: 210 } },
    { kind: 'data',    label: '国の目標 350g',         values: { target: 350 } },
  ],
  source: {
    text: '厚生労働省「令和6年 国民健康・栄養調査結果の概要」',
    url: 'https://www.mhlw.go.jp/content/10900000/001603146.pdf',
  },
};

export function compute(p) {
  var gap = Math.max(0, p.target - p.now);
  var perYear = gap * 365.25 / 1000;
  var total = perYear * p.years;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var y = p.years * i / pts;
    series.push({ x: y, y: perYear * y });
  }

  return {
    headline: { value: total, unit: 'kg', label: p.years + '年ぶんの不足量' },
    stats: [
      { label: '1日の不足', value: gap, unit: 'g' },
      { label: '目標に対して', value: p.target > 0 ? p.now / p.target * 100 : 0, unit: '%' },
      { label: '1年の不足', value: perYear, unit: 'kg' },
    ],
    axis: { x: '経過年数', y: '足りなかった量（kg）' },
    series: series,
    notes: [
      '健康日本21（第三次）は1日350gを目標に掲げています。',
      '20代の平均は男女とも200g台前半で、年齢が上がるほど摂取量は多くなる傾向があります。',
    ],
  };
}
