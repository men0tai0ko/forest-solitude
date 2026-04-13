# tasks.md

開発タスクの進捗管理。バグ管理は `issues.md` を参照。

---

## ■ 完了済み

- [x] 移動（ワールドスクロール方式）
- [x] 攻撃（前方判定・attack()呼び出し修正済み）
- [x] 回避（スタミナ消費・無敵フレーム・SE実装済み）
- [x] スタート位置をマップ内タイル(1,1)に固定
- [x] スタミナ（消費・時間回復）
- [x] ノックバック
- [x] 敵AI（slime接近・shooter弾発射）
- [x] 弾（発射・移動・プレイヤーへのダメージ判定）
- [x] 小屋（安全地帯・HP自動回復）
- [x] クラフト（wood→berry、wood→atk強化）
- [x] 小屋拡張（Vキー）
- [x] 死亡処理（HP全回復・アイテムロスト・deathDrops生成・小屋リボーン・多重実行防止）
- [x] セーブ・ロード（localStorage・ロード時に敵/弾/deathDropsリセット）
- [x] サウンド（Web Audio API・attack/hit/dodge）
- [x] タイトル画面（N:NEW / L:LOAD）
- [x] スマホ対応（仮想パッドHTML）
- [x] 攻撃スタミナ消費（STAMINA_ATTACK_COST 適用）
- [x] 弾→プレイヤーへのダメージ処理（updateBullets に衝突判定追加）
- [x] 壁の当たり判定（move() に isWall チェック組み込み・壁ずり対応）
- [x] マップ拡張（20×15、小屋2×2を維持、フィールドを小屋の5倍相当に拡大）
- [x] 仮想パッドのタッチイベント接続（bindVpad IIFE で全6ボタンにバインド）
- [x] deathDrops の回収処理（update() 内に近接判定・inventory加算・配列除去を追加）
- [x] ノックバック位置ズレ修正（move() でノックバックを入力移動から分離し壁判定への混入を解消）
- [x] スタミナバーをHUD左上にバー形式で描画（drawUI に fillRect 2本追加、シェイク非影響化）
- [x] 弾を画面外で自動削除（updateBullets に canvas 範囲チェックを追加、b.hit で既存フィルタに統合）
- [x] deathDrops をマップ上に `D` 記号で描画（drawDeathDrops() 新規追加、render の drawMap 直後に呼び出し）

---

## ■ 未実装（優先度：高）

（優先度高の未実装タスクはすべて完了）

---

## ■ 未実装（優先度：中）

- [ ] charger 専用AI（突進）
- [ ] boss 専用AI（弾幕）
- [ ] 敵のドロップ処理（getDrop関数が未実装）
- [ ] 自動セーブ（spec.mdに記載あるが未実装）

---

## ■ 改善提案（優先度：高〜中）

- [ ] **タイトル画面にキー操作ヒントを表示**（`drawTitle` に移動/攻撃/回避のキー3行追加）｜初見プレイヤーが操作不明で詰まる
- [ ] **HP上限を `player.maxHp` で管理**（`player` 定義に `maxHp:100` を追加し `100` ハードコードを除去）｜将来のHP拡張時に破綻防止
- [ ] **HUDのHP表示を `Math.floor` で統一**（`drawUI` の `Math.floor(player.hp)` はあるが小屋回復中に小数が出る箇所を統一）｜表示崩れ防止
- [x] **HUDに残敵数を表示**（`drawUI` に `"ENEMY:"+enemies.length` の1行追加）｜状況把握困難
- [x] **saveGame 成功時に "SAVED" をHUD数フレーム表示**（`saveFlash` カウンタを追加し `drawUI` で描画・`saveGame()` 呼出時にセット）｜保存確認不能
- [x] **expandHut 実行後に "EXPANDED" をHUD数フレーム表示**（`saveFlash` と同パターンで `hutFlash` カウンタを追加）｜操作フィードバック皆無
- [x] **クラフト素材不足時にフラッシュ表示**（`craftHeal`/`craftWeapon` の素材不足分岐に `hutFlash` 流用で "NO WOOD" を数フレーム表示）｜無反応で混乱する
- [ ] **`player.hp` 上限クランプを `update()` 末尾1箇所に集約**（現在 `player.hp=100` が `update` 内複数箇所に散在 → 末尾の1行に統一）｜多重上限バグ防止
- [x] **`settings` をセーブ対象に追加**（`saveGame` の JSON に `settings` を含め `loadGame` で復元）｜設定が保持されない
- [x] **HUDに小屋内表示 `[HUT]` を追加**（`drawUI` に `player.inHut` 条件で1行追加）｜判定境界が不明
- [x] **`drawTitle` に `ctx.font` を明示指定**（`drawMap` の `"20px monospace"` が引き継がれる前提になっているため独立して設定）｜タイトル文字崩れ

---

## ■ 今後の拡張（優先度：低）

- [ ] マップ自動生成（ローグライク化）
- [ ] 新エリア追加
- [ ] 新敵追加（wolf等）
- [ ] 装備システム（アイテムとしてのwood_swordなど）
- [ ] スキル
- [ ] 状態異常（毒・出血）
- [ ] レアリティシステム
- [ ] UI改善（スタミナバー表示など）
- [ ] BGM追加
- [ ] エフェクト強化

---

## ■ 技術負債

- [ ] **グローバル変数の整理**：player/world/inventory/map/enemies/bullets をひとつの gameState オブジェクトにまとめる
- [ ] **script.js のモジュール分割検討**：500行超の単一ファイル。外部依存禁止の制約内でのモジュール化
- [ ] **描画最適化**：全タイルを毎フレーム描画。画面外タイルのスキップで改善余地あり
