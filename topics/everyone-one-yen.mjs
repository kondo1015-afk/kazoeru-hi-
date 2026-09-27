export const meta = {
  id: 'everyone-one-yen',
  title: 'もしも全員が1日1円ずつ出したら',
  lede: '1人の1円は何にもなりません。ただ、出す人の数が桁違いになると話が変わります。',
  category: 'world',
  params: [
    { key: 'people', label: '出す人の数',   min: 0.1, max: 800000, step: 0.1, value: 12000, unit: '万人' },
    { key: 'yen',    label: '1人が1日に出す額', min: 1, max: 1000, step: 1, value: 1,   unit: '円' },
    { key: 'days',   label: '続ける日数',   min: 1, max: 3650,   step: 1, value: 365,  unit: '日' },
  ],
  presetsLabel: '人数を入れ替える',
  presets: [
    { kind: 'variant', label: '学校ひとつ（1000人）',  values: { people: 0.1 } },
    { kind: 'variant', label: '市ひとつくらい（10万人）', values: { people: 10 } },
    { kind: 'variant', label: '日本くらい（1.2億人）',  values: { people: 12000 } },
    { kind: 'variant', label: '世界くらい（80億人）',   values: { people: 800000 } },
  ],
};

export function compute(p) {
  var head = p.people * 10000;
  var perDay = head * p.yen;
  var total = perDay * p.days;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var d = p.days * i / pts;
    series.push({ x: d, y: perDay * d });
  }

  return {
    headline: { value: total, unit: '円', label: p.days + '日で集まる額' },
    stats: [
      { label: '1日で集まる額', value: perDay, unit: '円' },
      { label: '1人あたりの負担', value: p.yen * p.days, unit: '円' },
      { label: '出す人の数', value: head, unit: '人' },
    ],
    axis: { x: '経過日数', y: '集まった額（円）' },
    series: series,
    notes: [
      '人数は「万人」で指定します。1.2億人なら12000と入れてください。',
      '1人あたりの負担は変わらないのに、合計だけが人数ぶん膨らみます。少額を広く集める仕組みが成り立つのはこのためです。',
    ],
  };
}
