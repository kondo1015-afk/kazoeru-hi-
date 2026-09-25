export const meta = {
  id: 'train-delay',
  title: '今週いちども電車が遅れない確率',
  lede: '遅延証明書が出る日は、路線によってまるで違います。実際の発行日数を入れて、5日間の通勤を無傷で乗り切れる見込みを出します。',
  category: 'chance',
  params: [
    { key: 'rate',        label: '1日に遅延が出る確率', min: 0,   max: 100, step: 0.5, value: 50,  unit: '%' },
    { key: 'streak',      label: '連続で数える日数',    min: 1,   max: 30,  step: 1,   value: 5,   unit: '日' },
    { key: 'commuteDays', label: '1年の通勤日数',      min: 100, max: 250, step: 5,   value: 240, unit: '日' },
  ],

  // 実データは計算式に埋め込まず、ここに出典つきで置く
  presetsLabel: '路線の実データを入れる（平日20日あたりの発行日数から換算）',
  presets: [
    { kind: 'data', label: 'JR埼京線・川越線 19.8日',   values: { rate: 99 } },
    { kind: 'data', label: 'JR東海道線 18.7日',        values: { rate: 93.5 } },
    { kind: 'data', label: 'JR中央快速線 18.3日',      values: { rate: 91.5 } },
    { kind: 'data', label: 'JR中央・総武線各停 16.9日', values: { rate: 84.5 } },
    { kind: 'data', label: 'メトロ千代田線 16.6日',     values: { rate: 83 } },
    { kind: 'data', label: 'JR山手線 14.9日',          values: { rate: 74.5 } },
    { kind: 'data', label: '小田急線 12.7日',          values: { rate: 63.5 } },
    { kind: 'data', label: '46路線の平均 10.0日',      values: { rate: 50 } },
    { kind: 'data', label: 'メトロ銀座線 1.9日',        values: { rate: 9.5 } },
    { kind: 'data', label: '東急大井町線 1.3日',        values: { rate: 6.5 } },
  ],
  source: {
    text: '国土交通省「東京圏の鉄道路線の遅延「見える化」（令和6年度）」資料1-1',
    url: 'https://www.mlit.go.jp/report/press/content/001995846.pdf',
  },
};

export function compute(p) {
  var fail = p.rate / 100;          // その日に遅延が出る確率
  var safe = 1 - fail;              // 出ない確率

  var clean = Math.pow(safe, p.streak);           // streak 日すべて無事
  var yearClean = Math.pow(safe, p.commuteDays);  // 1年まるごと無事
  var delayedDays = p.commuteDays * fail;
  var interval = fail > 0 ? 1 / fail : Infinity;

  var series = [];
  for (var d = 1; d <= 30; d++) series.push({ x: d, y: Math.pow(safe, d) * 100 });

  return {
    headline: { value: clean * 100, unit: '%', label: p.streak + '日続けて遅れない確率' },
    stats: [
      { label: '1年で遅れる日数', value: delayedDays, unit: '日' },
      { label: '平均して何日おきか', value: fail > 0 ? interval : 0, unit: '日' },
      { label: '1年まるごと無事な確率', value: yearClean * 100, unit: '%' },
    ],
    axis: { x: '連続日数', y: '1日も遅れない確率（%）' },
    series: series,
    notes: [
      '遅延証明書は5分以上の遅れに対して発行されます。発行対象の時間帯は事業者ごとに違い、多くは初電から9時または10時までです。',
      '路線単位の最大遅延時間にもとづくため、個々の列車や利用者が実際に受けた遅れとは一致しません。',
      '各日が独立して起きるものとして計算しています。実際には天候などで連動するため、目安として見てください。',
    ],
  };
}
