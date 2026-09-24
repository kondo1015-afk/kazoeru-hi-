export const meta = {
  id: 'gacha-miss',
  title: '排出率3%を100回引いて、一度も出ない確率',
  lede: '100回も引けばさすがに出る、と思いたくなります。実際にどれくらいの見込みなのかを出してみます。',
  category: 'chance',
  params: [
    { key: 'rate',       label: '排出率',       min: 0.1, max: 20,  step: 0.1, value: 3,   unit: '%' },
    { key: 'draws',      label: '引く回数',     min: 1,   max: 500, step: 1,   value: 100, unit: '回' },
    { key: 'confidence', label: '目安にする確率', min: 50,  max: 99,  step: 1,   value: 90,  unit: '%' },
  ],
};

export function compute(p) {
  var r = p.rate / 100;
  var miss = Math.pow(1 - r, p.draws);
  var hit = 1 - miss;

  // 目安の確率に届くまでに必要な回数
  var t = p.confidence / 100;
  var needed = Math.ceil(Math.log(1 - t) / Math.log(1 - r));

  var span = Math.max(p.draws, needed) + 10;
  var series = [];
  var pts = 120;
  for (var i = 0; i <= pts; i++) {
    var n = Math.round(span * i / pts);
    series.push({ x: n, y: (1 - Math.pow(1 - r, n)) * 100 });
  }

  return {
    headline: { value: miss * 100, unit: '%', label: p.draws + '回引いて一度も出ない確率' },
    stats: [
      { label: '少なくとも1回出る確率', value: hit * 100, unit: '%' },
      { label: p.confidence + '% に届く回数', value: needed, unit: '回' },
      { label: '平均で出るまで', value: 1 / r, unit: '回' },
    ],
    axis: { x: '引いた回数', y: '少なくとも1回出る確率（%）' },
    series: series,
    notes: [
      '毎回おなじ確率で、前の結果に影響されない引き方を想定しています。天井（一定回数で確定する仕組み）は入れていません。',
      '「平均で出るまで」の回数を引いても、出ない確率はおよそ37%残ります。平均は保証ではありません。',
    ],
  };
}
