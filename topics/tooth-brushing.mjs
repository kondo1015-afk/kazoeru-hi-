export const meta = {
  id: 'tooth-brushing',
  title: '一生のうち、歯を磨いている時間',
  lede: '1回3分。日課すぎて意識しませんが、まとめると何日ぶんになるのか。',
  category: 'stack',
  params: [
    { key: 'perDay',  label: '1日に磨く回数', min: 1, max: 5,  step: 1,   value: 2,  unit: '回' },
    { key: 'minutes', label: '1回の時間',     min: 1, max: 10, step: 0.5, value: 3,  unit: '分' },
    { key: 'years',   label: '数える年数',    min: 1, max: 90, step: 1,   value: 80, unit: '年' },
  ],
  presetsLabel: 'よくある条件を入れる',
  presets: [
    { kind: 'variant', label: '朝だけ1分',     values: { perDay: 1, minutes: 1 } },
    { kind: 'variant', label: '朝晩3分ずつ',   values: { perDay: 2, minutes: 3 } },
    { kind: 'variant', label: '毎食後3分',     values: { perDay: 3, minutes: 3 } },
    { kind: 'variant', label: 'じっくり5分',   values: { minutes: 5 } },
  ],
};

export function compute(p) {
  var minPerDay = p.perDay * p.minutes;
  var totalMin = minPerDay * 365.25 * p.years;
  var days = totalMin / 60 / 24;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var y = p.years * i / pts;
    series.push({ x: y, y: minPerDay * 365.25 * y / 60 });
  }

  return {
    headline: { value: days, unit: '日', label: p.years + '年ぶんの合計' },
    stats: [
      { label: '1日あたり', value: minPerDay, unit: '分' },
      { label: '1年あたり', value: minPerDay * 365.25 / 60, unit: '時間' },
      { label: '合計', value: totalMin / 60, unit: '時間' },
    ],
    axis: { x: '経過年数', y: '累計（時間）' },
    series: series,
    notes: [
      '寝ている時間も含めた「まる1日」で日数に換算しています。',
    ],
  };
}
