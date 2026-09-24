// トピックモジュールの約束ごと:
//   compute() は「純粋関数」であること。
//   - 外部変数を参照しない（import したものも使わない）
//   - Math 以外のグローバルに触らない
//   - 同じ入力なら必ず同じ出力
//   この関数のソースはそのまま HTML に埋め込まれ、ブラウザ側の再計算に使われる。

export const meta = {
  id: 'yen-savings',
  title: '1日1円ずつ増やす貯金を続けたら',
  lede: '初日は1円、次の日は2円、その次は3円。毎日ちょっとずつ増やすだけの貯金は、どこまで育つのか。',
  params: [
    { key: 'startAge', label: '始める年齢', min: 0,  max: 60,  step: 1,   value: 20,  unit: '歳' },
    { key: 'endAge',   label: 'やめる年齢', min: 1,  max: 90,  step: 1,   value: 50,  unit: '歳', atLeast: 'startAge' },
    { key: 'first',    label: '初日に入れる額', min: 1, max: 100, step: 1, value: 1,   unit: '円' },
    { key: 'step',     label: '1日ごとの増加額', min: 0, max: 10, step: 0.5, value: 1, unit: '円' },
  ],
};

export function compute(p) {
  var years = Math.max(0, p.endAge - p.startAge);
  var days = Math.round(years * 365.25);

  // n 日目に入れる額 = first + step * (n - 1)
  // 累計 = days * first + step * days * (days - 1) / 2
  function totalAfter(n) {
    return n * p.first + p.step * n * (n - 1) / 2;
  }

  var total = totalAfter(days);
  var lastDay = days > 0 ? p.first + p.step * (days - 1) : 0;

  var series = [];
  var pts = 120;
  for (var i = 0; i <= pts; i++) {
    var n = Math.round(days * i / pts);
    series.push({ x: p.startAge + years * i / pts, y: totalAfter(n) });
  }

  return {
    headline: { value: total, unit: '円', label: p.endAge + '歳時点の残高' },
    stats: [
      { label: '貯金した日数', value: days, unit: '日' },
      { label: '最終日に入れる額', value: Math.round(lastDay), unit: '円' },
      { label: '1日あたりの平均', value: days > 0 ? total / days : 0, unit: '円' },
    ],
    axis: { x: '年齢', y: '残高（円）' },
    series: series,
    notes: [
      '1年を365.25日として計算しています（うるう年ぶん）。',
      '利息は考えていません。入れた額がそのまま積み上がるだけの計算です。',
    ],
  };
}
