# HANDOVER.md

新しく開発を引き継ぐ人向けのガイド。
詳細は各ドキュメントを参照。

---

## ■ 最初にやること

1. `index.html` をブラウザで開いてゲームを動かす
2. `README.md` でファイル構成を確認
3. `architecture.md` でコード設計を把握
4. `issues.md` で現在の既知バグを確認してから触り始める

---

## ■ プロジェクト構成

単一JSファイル構成。`script.js` にすべてのゲームロジックが入っている。

```
index.html  ← Canvas + 仮想パッドのHTML
style.css   ← スマホUI含むレイアウト
script.js   ← ゲームロジック全体（約450行）
```

---

## ■ コアコンセプト（変えてはいけない設計）

### プレイヤーは動かない
プレイヤーは常に画面中央に固定。移動は `world.offsetX/Y` を動かすことで実現している。

```js
// プレイヤーの実座標算出
const px = canvas.width / 2 - world.offsetX;
const py = canvas.height / 2 - world.offsetY;
```

### 敵・マップはワールド座標で管理
描画時に `world.offset` を加算してスクリーン座標に変換する。

---

## ■ 主要な状態変数

詳細は `architecture.md` の「■ 状態変数」を参照。

主要変数：`player` / `world` / `inventory` / `map` / `enemies` / `bullets` / `deathDrops`

---

## ■ 触る前に知っておくべき未実装・バグ

`issues.md` を参照。特に「■ クリティカル」「■ 重大」を確認してから作業を開始すること。

---

## ■ 機能追加の方法

### 敵を追加する
1. `enemies` 配列にオブジェクトを追加 `{x, y, hp, type:"新タイプ"}`
2. `updateEnemies()` の type 分岐に処理を追加
3. `data.md` に敵データを追加

### マップを拡張する
`map` 配列を拡張するだけで動く。タイルサイズは `TILE_SIZE = 40`。

### アイテムを追加する
1. `inventory` に追加
2. `drawUI()` に表示追加
3. 使用・取得の処理関数を追加
4. `data.md` にデータ追加

---

## ■ セーブデータ構造

詳細は `architecture.md` の「■ セーブ構造」を参照。

localStorageキー：`forest_survival_save_v1`

---

## ■ 注意事項

- グローバル変数が多い。関数間の依存に注意
- `map` をセーブ・ロードするため、expandHut() の結果が永続化される
- `items.md` は `data.md` に移行済み。未実装アイテムが多数含まれているので要確認
