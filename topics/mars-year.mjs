export const meta = {
  id: 'mars-year',
  title: 'もしも1年が687日だったら、あなたは何歳か',
  lede: '年齢は「地球が太陽を何周したか」を数えているだけです。周る星が変われば、同じ人生でも数字が変わります。',
  category: 'world',
  params: [
    { key: 'age',  label: '地球での年齢', min: 0,  max: 100,  step: 1, value: 20,  unit: '歳' },
    { key: 'days', label: 'その星の1年',  min: 50, max: 5000, step: 1, value: 687, unit: '日' },
  ],
  presetsLabel: 'ほかの星で数える',
  presets: [
    { kind: 'variant', label: '水星（88日）',    values: { days: 88 } },
    { kind: 'variant', label: '金星（225日）',   values: { days: 225 } },
    { kind: 'variant', label: '地球（365日）',   values: { days: 365 } },
    { kind: 'variant', label: '火星（687日）',   values: { days: 687 } },
    { kind: 'variant', label: '木星（4333日）',  values: { days: 4333 } },
  ],
};

export function compute(p) {
  var earthDays = p.age * 365.25;
  var otherAge = earthDays / p.days;

  var series = [];
  for (var a = 0; a <= 100; a++) series.push({ x: a, y: a * 365.25 / p.days });

  return {
    headline: { value: otherAge, unit: '歳', label: 'その星で数えた年齢' },
    stats: [
      { label: '1年の長さ', value: p.days / 365.25, unit: '倍' },
      { label: '生きた日数', value: earthDays, unit: '日' },
      { label: 'その星で20歳になるのは', value: 20 * p.days / 365.25, unit: '地球歳' },
    ],
    axis: { x: '地球での年齢', y: 'その星での年齢' },
    series: series,
    notes: [
      '公転の周期だけを入れ替えた計算です。1日の長さは地球のままとしています。',
      '木星の1年は地球の約12年。木星で数えると、80歳でもまだ6歳台です。',
    ],
  };
}
