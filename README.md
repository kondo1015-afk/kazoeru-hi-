# 数える日

1日ひとつ、世界を数字で見るサイト。GitHub Actions が毎朝1本生成し、GitHub Pages に出す。

## 仕組み

```
topics/*.mjs          ネタ1つ = 純粋関数 compute(params)
      ↓ generate.mjs  毎朝ひとつ選んで
data/posts/*.json     日付つきで蓄積（リポジトリに残る）
      ↓ build.mjs     compute のソースごと HTML に埋め込んで
public/               静的サイト → GitHub Pages
```

数字はすべて `compute()` が出す。AI に数値を書かせないので、嘘の統計が載ることがない。

`compute` のソースはそのままページに埋め込まれるので、**読者がつまみを動かすと同じ式でその場で計算し直される**。サーバーもAPIも要らない。

## 最初のセットアップ

1. このリポジトリを GitHub に push
2. Settings → Pages → Source を **GitHub Actions** に
3. Settings → Actions → General → Workflow permissions を **Read and write** に
4. Actions タブから `daily` を手動実行して動作確認

以降は毎朝6時（JST）に勝手に回る。

## ローカルで試す

```bash
node scripts/generate.mjs          # 今日のぶんを作る
node scripts/build.mjs             # public/ を組み立てる
node scripts/check.mjs             # 検査（これが通らないと公開されない）
npx serve public                   # 確認
```

`file://` で直接開いても動くが、フォントの読み込みなどが変わるので `npx serve` 推奨。

### check.mjs が見ているもの

- 全トピックを、つまみの端から端まで振って計算が壊れないか
- `compute` が純粋関数の約束を守っているか
- ビルド済みページの JavaScript を簡易DOM上で実際に動かし、
  見出し・グラフ・つまみの表示が初期値どおりになるか
- 共有URL（`#?key=value`）を開いたとき、指定していないつまみが動かないか

便利なオプション:

```bash
node scripts/generate.mjs --topic yen-savings --force   # トピック指定
node scripts/generate.mjs --date 2026-10-01             # 日付指定
```

## ネタを増やす

`topics/` に `.mjs` を1つ足すだけ。ファイル名と `meta.id` を揃える。

**`compute` の制約**（これを破るとビルドで落ちる）

- `function compute(p) { }` の形で書く（アロー関数は埋め込めない）
- 外部変数・import・`Math` 以外のグローバルを参照しない
- 同じ入力なら必ず同じ出力

戻り値の形は `topics/yen-savings.mjs` を参照。

**つまみ同士の大小を保ちたいとき**

```js
{ key: 'endAge', label: 'やめる年齢', min: 1, max: 90, step: 1, value: 50, unit: '歳',
  atLeast: 'startAge' }   // 始める年齢を下回らない。片方を動かすともう片方が追従する
```

`atMost` も同じように使える。

### AI にネタを出させる

```bash
ANTHROPIC_API_KEY=... node scripts/propose-topic.mjs
```

`topics/_drafts/` に案が落ちて、その場で一度計算して壊れていないか確かめる。
**中身を読んでから** `topics/` に移すこと。自動で本番に入れない。

## 増やすときに気をつけること

- 統計データを使う回は、機械が読める公開API（世界銀行、e-Stat、Our World in Data など）に限る。出典を `notes` に必ず書く
- AdSense を狙うなら、計算モノと統計モノでオリジナリティを担保する。ニュース要約は載せない
- プライバシーポリシーと運営者情報のページは、申請前に別途用意が必要
