export const meta = {
  id: 'test-accuracy',
  title: '精度99%の検査で陽性。本当に該当する確率は',
  lede: '99%と聞くと、ほぼ確定に思えます。ところが、めったにないことを調べる検査では話が変わります。',
  category: 'chance',
  params: [
    { key: 'prevalence', label: '該当する人の割合', min: 0.01, max: 50,  step: 0.01, value: 1,  unit: '%' },
    { key: 'sens',       label: '感度（見つける力）', min: 50,   max: 100, step: 0.1,  value: 99, unit: '%' },
    { key: 'spec',       label: '特異度（間違えない力）', min: 50, max: 100, step: 0.1, value: 99, unit: '%' },
  ],
  presetsLabel: '条件を入れ替える',
  presets: [
    { kind: 'variant', label: '1000人に1人（0.1%）',  values: { prevalence: 0.1 } },
    { kind: 'variant', label: '100人に1人（1%）',     values: { prevalence: 1 } },
    { kind: 'variant', label: '10人に1人（10%）',     values: { prevalence: 10 } },
    { kind: 'variant', label: '精度を99.9%にする',    values: { sens: 99.9, spec: 99.9 } },
    { kind: 'variant', label: '精度を95%にする',      values: { sens: 95, spec: 95 } },
  ],
};

export function compute(p) {
  var pre = p.prevalence / 100;
  var se = p.sens / 100;
  var sp = p.spec / 100;

  var truePos = se * pre;
  var falsePos = (1 - sp) * (1 - pre);
  var ppv = (truePos + falsePos) > 0 ? truePos / (truePos + falsePos) : 0;

  var trueNeg = sp * (1 - pre);
  var falseNeg = (1 - se) * pre;
  var npv = (trueNeg + falseNeg) > 0 ? trueNeg / (trueNeg + falseNeg) : 0;

  var series = [];
  var pts = 120;
  for (var i = 0; i <= pts; i++) {
    var x = 0.01 + (20 - 0.01) * i / pts;
    var q = x / 100;
    var tp = se * q, fp = (1 - sp) * (1 - q);
    series.push({ x: x, y: (tp + fp) > 0 ? tp / (tp + fp) * 100 : 0 });
  }

  return {
    headline: { value: ppv * 100, unit: '%', label: '陽性のうち本当に該当する割合' },
    stats: [
      { label: '1万人中の陽性者', value: (truePos + falsePos) * 10000, unit: '人' },
      { label: 'うち間違いの陽性', value: falsePos * 10000, unit: '人' },
      { label: '陰性なら該当しない確率', value: npv * 100, unit: '%' },
    ],
    axis: { x: '該当する人の割合（%）', y: '陽性が当たっている確率（%）' },
    series: series,
    notes: [
      'めったにない事柄ほど、正しい陽性より間違いの陽性のほうが数で上回ります。検査の精度が悪いのではなく、母数の差によるものです。',
      'これは統計の一般的な性質を示す計算で、特定の検査や個人の結果を判断するものではありません。実際の結果については医療機関にご相談ください。',
    ],
  };
}
