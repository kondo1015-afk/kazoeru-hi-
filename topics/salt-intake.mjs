export const meta = {
  id: 'salt-intake',
  title: '食塩を1日1g減らすと、生涯で何kgぶんになるか',
  lede: '1gはひとつまみ。毎日のことなので、何十年か足すと袋で数えられる量になります。',
  category: 'stack',
  params: [
    { key: 'now',    label: '今の1日の食塩摂取量', min: 3, max: 20, step: 0.1, value: 9.6, unit: 'g' },
    { key: 'target', label: '目指す量',           min: 3, max: 15, step: 0.1, value: 7,   unit: 'g', atMost: 'now' },
    { key: 'years',  label: '数える年数',         min: 1, max: 80, step: 1,   value: 50,  unit: '年' },
  ],
  presetsLabel: '実際の摂取量を入れる',
  presets: [
    { kind: 'data',    label: '20歳以上の平均 9.6g', values: { now: 9.6 } },
    { kind: 'data',    label: '男性の平均 10.5g',    values: { now: 10.5 } },
    { kind: 'data',    label: '女性の平均 8.9g',     values: { now: 8.9 } },
    { kind: 'data',    label: '国の目標 7g',         values: { target: 7 } },
    { kind: 'variant', label: '1gだけ減らす',        values: { now: 9.6, target: 8.6 } },
  ],
  source: {
    text: '厚生労働省「令和6年 国民健康・栄養調査結果の概要」',
    url: 'https://www.mhlw.go.jp/content/10900000/001603146.pdf',
  },
};

export function compute(p) {
  var diff = Math.max(0, p.now - p.target);
  var perYear = diff * 365.25;
  var total = perYear * p.years / 1000;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var y = p.years * i / pts;
    series.push({ x: y, y: perYear * y / 1000 });
  }

  return {
    headline: { value: total, unit: 'kg', label: p.years + '年で減らせる量' },
    stats: [
      { label: '1日の差', value: diff, unit: 'g' },
      { label: '1年の差', value: perYear / 1000, unit: 'kg' },
      { label: '今のまま' + p.years + '年', value: p.now * 365.25 * p.years / 1000, unit: 'kg' },
    ],
    axis: { x: '経過年数', y: '減らせた量（kg）' },
    series: series,
    notes: [
      '食塩相当量はナトリウム量から換算した値です。',
      '健康日本21（第三次）は1日7gを目標に掲げています。個別の適量は人によって違うので、気になる場合は医師や管理栄養士に相談してください。',
    ],
  };
}
