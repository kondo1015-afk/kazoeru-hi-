export const meta = {
  id: 'dice-collect',
  title: 'サイコロの全部の目が出そろうまで、何回振るか',
  lede: '6面あるのだから6回ちょっと、とはいきません。最後の1つがなかなか出てこないからです。',
  category: 'chance',
  params: [
    { key: 'faces', label: '面の数',       min: 2, max: 100, step: 1, value: 6, unit: '面' },
    { key: 'want',  label: 'そろえたい種類数', min: 1, max: 100, step: 1, value: 6, unit: '種', atMost: 'faces' },
  ],
  presetsLabel: 'いろいろ試す',
  presets: [
    { kind: 'variant', label: '普通のサイコロ（6面）', values: { faces: 6, want: 6 } },
    { kind: 'variant', label: 'トランプの13種',        values: { faces: 13, want: 13 } },
    { kind: 'variant', label: 'ガチャ20種コンプ',      values: { faces: 20, want: 20 } },
    { kind: 'variant', label: '100種のうち半分だけ',   values: { faces: 100, want: 50 } },
  ],
};

export function compute(p) {
  var n = p.faces;
  var k = Math.min(p.want, n);

  // 新しい種類が1つ増えるたびの期待回数を足す
  function expectedFor(m) {
    var sum = 0;
    for (var i = 0; i < m; i++) sum += n / (n - i);
    return sum;
  }

  var total = expectedFor(k);
  var lastOne = k > 0 ? n / (n - (k - 1)) : 0;

  var series = [];
  for (var m = 1; m <= n; m++) series.push({ x: m, y: expectedFor(m) });

  return {
    headline: { value: total, unit: '回', label: k + '種そろうまでの平均回数' },
    stats: [
      { label: '全部そろえるなら', value: expectedFor(n), unit: '回' },
      { label: '最後の1種だけで', value: lastOne, unit: '回' },
      { label: '面の数に対して', value: n > 0 ? total / n : 0, unit: '倍' },
    ],
    axis: { x: 'そろった種類数', y: 'それまでの平均回数' },
    series: series,
    notes: [
      '前半はすぐ増えるのに、終盤で急に伸びます。残り1種になると、当たる確率が面の数ぶんの1まで下がるためです。',
      'これは平均であって保証ではありません。この回数を振っても、そろわないことは普通にあります。',
    ],
  };
}
