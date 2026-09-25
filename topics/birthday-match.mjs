export const meta = {
  id: 'birthday-match',
  title: '同じ誕生日の人が、その部屋にいる確率',
  lede: '365日あるのだから滅多に重ならない、と思いたくなります。実際は思っているよりずっと早く重なります。',
  category: 'chance',
  params: [
    { key: 'people', label: '部屋にいる人数', min: 2,  max: 80,  step: 1, value: 23,  unit: '人' },
    { key: 'days',   label: '1年の日数',     min: 30, max: 700, step: 1, value: 365, unit: '日' },
    { key: 'target', label: '見たい確率',    min: 10, max: 99,  step: 1, value: 50,  unit: '%' },
  ],

  presetsLabel: 'いろいろな集まりを入れる',
  presets: [
    { kind: 'variant', label: '30人のクラス',       values: { people: 30 } },
    { kind: 'variant', label: '40人のクラス',       values: { people: 40 } },
    { kind: 'variant', label: 'サッカー2チーム22人', values: { people: 22 } },
    { kind: 'variant', label: '会社の部署 60人',    values: { people: 60 } },
    { kind: 'variant', label: '火星の1年（687日）', values: { days: 687 } },
  ],
};

export function compute(p) {
  function matchProb(n) {
    if (n < 2) return 0;
    if (n > p.days) return 1; // 人数が日数を超えたら必ず重なる
    var noMatch = 1;
    for (var i = 0; i < n; i++) noMatch *= (p.days - i) / p.days;
    return 1 - noMatch;
  }

  var prob = matchProb(p.people);

  // 目標の確率を初めて超える人数
  var needed = 0;
  for (var n = 2; n <= p.days + 1; n++) {
    if (matchProb(n) >= p.target / 100) { needed = n; break; }
  }

  var span = Math.max(p.people, needed || 0) + 10;
  var series = [];
  for (var k = 2; k <= span; k++) series.push({ x: k, y: matchProb(k) * 100 });

  return {
    headline: { value: prob * 100, unit: '%', label: p.people + '人なら重なる確率' },
    stats: [
      { label: '誰とも重ならない確率', value: (1 - prob) * 100, unit: '%' },
      { label: p.target + '% を超える人数', value: needed, unit: '人' },
      { label: '2人組の数', value: p.people * (p.people - 1) / 2, unit: '通り' },
    ],
    axis: { x: '人数', y: '重なる確率（%）' },
    series: series,
    notes: [
      '「自分と同じ誕生日の人がいるか」ではなく「誰かどうしが重なるか」の確率です。比べる組み合わせが人数の2乗で増えるので、直感より早く上がります。',
      '1年の日数を変えると、火星の1年（687日）などでも試せます。',
    ],
  };
}
