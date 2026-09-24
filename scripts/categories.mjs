// カテゴリはここだけで定義する。トピックの meta.category はこの id を使う。
export const CATEGORIES = [
  {
    id: 'stack',
    name: '積み重ね',
    tagline: '小さいものが、時間で膨らむ',
    lede: '1日ぶんでは気にもとめない量が、何十年か積み上がるとどうなるか。人生を数えてみる回もここに入ります。',
  },
  {
    id: 'money',
    name: 'お金',
    tagline: 'その差は、いくらになるのか',
    lede: '払い方のちがい、家賃のちがい、続ける習慣のちがい。数字にすると判断しやすくなるものを集めます。',
  },
  {
    id: 'chance',
    name: '確率',
    tagline: '直感とズレる数字',
    lede: '滅多に起きないと思っていたことが案外よく起き、確実だと思っていたことが案外そうでもない。数えてみると印象が変わります。',
  },
];

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));
