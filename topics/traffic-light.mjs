export const meta = {
  id: 'traffic-light',
  title: '信号が変わるのを待っている時間の合計',
  lede: '1回はほんの数十秒。でも一生ぶん足すと、まとまった日数になります。',
  category: 'stack',
  params: [
    { key: 'perDay',  label: '1日に信号待ちする回数', min: 1,  max: 30,  step: 1, value: 8,  unit: '回' },
    { key: 'seconds', label: '1回の平均待ち時間',     min: 5,  max: 180, step: 5, value: 45, unit: '秒' },
    { key: 'years',   label: '数える年数',            min: 1,  max: 80,  step: 1, value: 60, unit: '年' },
  ],
};

export function compute(p) {
  var secPerDay = p.perDay * p.seconds;
  var totalSec = secPerDay * 365.25 * p.years;
  var totalDays = totalSec / 86400;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var y = p.years * i / pts;
    series.push({ x: y, y: secPerDay * 365.25 * y / 3600 });
  }

  return {
    headline: { value: totalDays, unit: '日', label: '信号待ちに使う日数' },
    stats: [
      { label: '1日あたり', value: secPerDay / 60, unit: '分' },
      { label: '1年あたり', value: secPerDay * 365.25 / 3600, unit: '時間' },
      { label: '合計', value: totalSec / 3600, unit: '時間' },
    ],
    axis: { x: '経過年数', y: '累計（時間）' },
    series: series,
    notes: [
      '寝ている時間も含めた「まる1日」で換算しています。起きている時間だけで数えると、体感はこの1.5倍くらいです。',
    ],
  };
}
