# Forest Survival

2Dサバイバルアクション（ASCII風）。スマホブラウザ対応。外部依存なし。

---

## ■ 起動方法

```
index.html をブラウザで開く（ローカル起動・サーバー不要）
```

対応環境：iOS Safari / Android Chrome / PC Chrome・Firefox・Edge

---

## ■ ファイルマップ

```
/
├── index.html          UI・Canvas・仮想パッド
├── style.css           レイアウト・スマホUI
├── script.js           全ゲームロジック（単一ファイル）
│
├── README.md           ← このファイル（入口）
├── spec.md             ゲーム仕様（機能・挙動・ルール）
├── architecture.md     システム構造・データフロー
├── balance.md          ゲームバランス数値
├── data.md             アイテム・敵データ（実装状況付き）
├── HANDOVER.md         引き継ぎ・開発開始ガイド
├── tasks.md            タスク・進捗管理
└── issues.md           バグ・課題一覧
```

---

## ■ ゲーム概要

異世界の森に取り残されたプレイヤーが、拠点（小屋）を中心に探索・戦闘・クラフトを行いながら生存を目指す。

**ゲームループ：** 小屋で準備 → フィールド探索 → 戦闘・資源獲得 → 小屋帰還 → 回復・クラフト → 再探索

---

## ■ 操作

| 操作 | PC | スマホ |
|---|---|---|
| 移動 | 矢印キー | 仮想Dパッド |
| 攻撃 | Space | A ボタン |
| 回避 | Shift | D ボタン |
| 回復使用 | Z | - |
| クラフト（回復） | C（小屋内） | - |
| クラフト（武器） | X（小屋内） | - |
| 小屋拡張 | V（小屋内） | - |
| セーブ | S | - |
| サウンドON/OFF | M | - |

---

## ■ ドキュメント参照順

初めて触れる場合：`README.md` → `HANDOVER.md` → `architecture.md` → `spec.md`

仕様確認：`spec.md` / `balance.md` / `data.md`

タスク・バグ確認：`tasks.md` / `issues.md`
