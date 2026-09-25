export const meta = {
  id: 'book-pages',
  title: '毎日1ページだけ読むと、生涯で何冊になるか',
  lede: '1ページなら寝る前の数分で終わります。それを何十年か続けたら、本棚がどれくらい埋まるのか。',
  category: 'stack',
  params: [
    { key: 'pages',    label: '1日に読むページ数', min: 1,   max: 100, step: 1,  value: 5,   unit: 'ページ' },
    { key: 'perBook',  label: '1冊のページ数',     min: 100, max: 600, step: 10, value: 250, unit: 'ページ' },
    { key: 'years',    label: '続ける年数',        min: 1,   max: 80,  step: 1,  value: 50,  unit: '年' },
  ],
  presetsLabel: 'よくある条件を入れる',
  presets: [
    { kind: 'variant', label: '1日1ページだけ',   values: { pages: 1 } },
    { kind: 'variant', label: '1日10ページ',      values: { pages: 10 } },
    { kind: 'variant', label: '文庫本（300頁）',   values: { perBook: 300 } },
    { kind: 'variant', label: '新書（200頁）',     values: { perBook: 200 } },
  ],
};

export function compute(p) {
  var perYear = p.pages * 365.25;
  var totalPages = perYear * p.years;
  var books = totalPages / p.perBook;

  var series = [];
  var pts = 100;
  for (var i = 0; i <= pts; i++) {
    var y = p.years * i / pts;
    series.push({ x: y, y: perYear * y / p.perBook });
  }

  return {
    headline: { value: books, unit: '冊', label: p.years + '年で読める冊数' },
    stats: [
      { label: '1年あたり', value: perYear / p.perBook, unit: '冊' },
      { label: '合計ページ数', value: totalPages, unit: 'ページ' },
      { label: '1冊にかかる日数', value: p.perBook / p.pages, unit: '日' },
    ],
    axis: { x: '経過年数', y: '読み終えた冊数' },
    series: series,
    notes: [
      '1年を365.25日として、休まず読み続けた場合の計算です。',
    ],
  };
}
