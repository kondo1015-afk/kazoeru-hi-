export const meta = {
  id: 'revolving',
  title: '毎月いくらずつ返すと、利息はいくら付くのか',
  lede: '返す額を少し上げるだけで、完済までの期間と利息の合計が大きく変わります。その差を見るための計算です。',
  category: 'money',
  params: [
    { key: 'balance', label: '残高',       min: 50000, max: 1000000, step: 10000, value: 300000, unit: '円' },
    { key: 'apr',     label: '年利',       min: 0,     max: 18,      step: 0.5,   value: 15,     unit: '%' },
    { key: 'payment', label: '毎月の返済額', min: 20000, max: 100000, step: 1000,  value: 20000,  unit: '円' },
  ],
};

export function compute(p) {
  var r = p.apr / 100 / 12;
  var bal = p.balance;
  var interest = 0;
  var months = 0;
  var series = [{ x: 0, y: bal }];
  var cap = 1200; // 100年ぶんで打ち切る保険

  while (bal > 0 && months < cap) {
    var add = bal * r;
    interest += add;
    bal = bal + add - p.payment;
    if (bal < 0) bal = 0;
    months++;
    series.push({ x: months, y: bal });
  }

  return {
    headline: { value: interest, unit: '円', label: '利息の合計' },
    stats: [
      { label: '完済まで', value: months, unit: 'か月' },
      { label: '総支払額', value: p.balance + interest, unit: '円' },
      { label: '元の残高に対して', value: p.balance > 0 ? interest / p.balance * 100 : 0, unit: '%' },
    ],
    axis: { x: '経過月数', y: '残高（円）' },
    series: series,
    notes: [
      '毎月の返済額のうち、まず利息を払い、残りが元本に充てられる方式で計算しています。',
      '手数料や遅延の扱いは商品ごとに違います。実際の契約内容は明細でご確認ください。',
    ],
  };
}
