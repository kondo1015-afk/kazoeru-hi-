export const meta = {
  id: 'walk-the-earth',
  title: '毎日の歩数だけで地球を1周するには',
  lede: '赤道ぞいに地球を1周すると40,075km。いつもの歩数を積み上げるだけなら、何年かかるのか。',
  category: 'stack',
  params: [
    { key: 'steps',    label: '1日の歩数',   min: 1000, max: 30000, step: 1,   value: 8000, unit: '歩' },
    { key: 'stride',   label: '歩幅',       min: 40,   max: 90,    step: 1,   value: 65,   unit: 'cm' },
    { key: 'restDays', label: '週に休む日数', min: 0,    max: 6,     step: 1,   value: 1,    unit: '日' },
    { key: 'goalKm',   label: '目標距離',    min: 1000, max: 60000, step: 25,  value: 40075, unit: 'km' },
  ],

  presetsLabel: '実際の歩数を入れる',
  presets: [
    { kind: 'data',    label: '成人男性の平均 7,763歩',  values: { steps: 7763 } },
    { kind: 'data',    label: '成人女性の平均 6,495歩',  values: { steps: 6495 } },
    { kind: 'data',    label: '20〜64歳男性 8,564歩',   values: { steps: 8564 } },
    { kind: 'data',    label: '65歳以上男性 6,667歩',   values: { steps: 6667 } },
    { kind: 'data',    label: '国の目標 7,100歩',       values: { steps: 7100 } },
    { kind: 'variant', label: '1日1万歩',               values: { steps: 10000 } },
  ],
  source: {
    text: '厚生労働省「令和6年 国民健康・栄養調査結果の概要」第5章',
    url: 'https://www.mhlw.go.jp/content/10900000/001603146.pdf',
  },
};

export function compute(p) {
  var activeDaysPerWeek = 7 - p.restDays;
  var kmPerActiveDay = p.steps * p.stride / 100 / 1000;
  var kmPerWeek = kmPerActiveDay * activeDaysPerWeek;
  var kmPerYear = kmPerWeek * (365.25 / 7);

  var years = kmPerYear > 0 ? p.goalKm / kmPerYear : Infinity;

  var series = [];
  var span = isFinite(years) ? Math.max(years, 0.5) : 50;
  var pts = 120;
  for (var i = 0; i <= pts; i++) {
    var t = span * i / pts;
    series.push({ x: t, y: Math.min(kmPerYear * t, p.goalKm) });
  }

  return {
    headline: { value: years, unit: '年', label: '目標を歩ききるまで' },
    stats: [
      { label: '1日に進む距離', value: kmPerActiveDay, unit: 'km' },
      { label: '1年に進む距離', value: kmPerYear, unit: 'km' },
      { label: '合計の歩数', value: kmPerActiveDay > 0 ? p.goalKm / kmPerActiveDay * p.steps : 0, unit: '歩' },
    ],
    axis: { x: '経過年数', y: '進んだ距離（km）' },
    series: series,
    notes: [
      '地球1周（赤道）は40,075km。目標距離を変えれば他のルートでも試せます。',
      '歩幅は身長のおよそ45%が目安とされています。165cmなら74cmくらい。',
    ],
  };
}
