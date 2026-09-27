// カテゴリはここだけで定義する。トピックの meta.category はこの id を使う。
export const CATEGORIES = [
  {
    id: 'you',
    name: 'もしもあなたが',
    tagline: '自分の毎日を、条件を変えて数えてみる',
    lede: '毎日のちょっとした選択が、何十年か続いたらどうなるのか。つまみを動かして、自分の条件に置きかえてみてください。',
  },
  {
    id: 'world',
    name: 'もしも世界が',
    tagline: '前提がひとつ変わると、どうなるか',
    lede: '1年の長さ、重力の強さ、人の数。当たり前だと思っている前提をひとつだけ動かすと、数字はどこまで変わるのか。',
  },
];

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));
