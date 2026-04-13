# data.md

ゲーム内データ（アイテム・装備・敵・レシピ）を一元管理する。
**実装状況を明示する。** 未実装データをそのまま `script.js` に適用しないこと。

> 旧 `items.md` の内容を整理・統合したファイル。

---

## ■ 設計方針

- すべてIDベースで管理
- 表示名と内部IDを分離
- 効果はシンプルなキーで定義
- JSONライク構造（そのままJSへ転用可能）

---

## ■ 実装状況サマリ

| カテゴリ | ID | 実装状況 |
|---|---|---|
| 素材 | wood | ✅ 実装済み |
| 素材 | stone | ❌ 未実装 |
| 食料 | berry | ✅ 実装済み |
| 食料 | meat | ❌ 未実装 |
| 装備 | wood_sword | ❌ 未実装（クラフトXでatk直接加算） |
| 装備 | cloth_armor | ❌ 未実装 |
| 敵 | slime | ✅ 実装済み |
| 敵 | shooter | ✅ 実装済み |
| 敵 | charger | ⚠️ 配置済み・専用AIなし |
| 敵 | boss | ⚠️ 配置済み・専用AIなし |
| 敵 | wolf | ❌ 未実装 |
| レシピ | wood_sword | ⚠️ wood×5→atk+5 として簡易実装済み |
| レシピ | cloth_armor | ❌ 未実装 |

---

## ■ 素材アイテム

```js
const materials = {
  wood: {
    id: "wood",
    name: "木材",
    type: "material"
    // ✅ 実装済み：inventory.wood で管理
  },
  stone: {
    id: "stone",
    name: "石",
    type: "material"
    // ❌ 未実装
  }
};
```

---

## ■ 食料アイテム

```js
const foods = {
  berry: {
    id: "berry",
    name: "木の実",
    type: "food",
    effect: {
      healing_frames: 60,   // 時間回復フレーム数
      hp_per_frame: 0.5     // フレームあたり回復量
    }
    // ✅ 実装済み：useHeal() で player.healing = 60
  },
  meat: {
    id: "meat",
    name: "生肉",
    type: "food",
    effect: {
      hunger: +30
    }
    // ❌ 未実装（hungerシステム自体が未実装）
  }
};
```

---

## ■ 装備

```js
const equipments = {
  wood_sword: {
    id: "wood_sword",
    name: "木の剣",
    type: "weapon",
    stat: {
      atk: +5
    }
    // ⚠️ アイテムオブジェクトとしては未実装
    // craftWeapon() で wood×5 → player.atk+5 として簡易実装
  },
  cloth_armor: {
    id: "cloth_armor",
    name: "布の服",
    type: "armor",
    stat: {
      def: +3
    }
    // ❌ 未実装（defパラメータ自体なし）
  }
};
```

---

## ■ 敵データ

```js
const enemies = {
  slime: {
    id: "slime",
    name: "スライム",
    hp: 30,
    atk: 5,           // 接触ダメージは balance.md 参照（1/frame固定）
    def: 2,           // ※defは現在script.jsで未参照
    drop: [
      { item: "berry", rate: 0.5 },
      { item: "wood",  rate: 0.3 }
    ]
    // ✅ 敵AIは実装済み（ドロップ処理は未実装）
  },
  shooter: {
    id: "shooter",
    name: "シューター",
    hp: 20,
    drop: []
    // ✅ 弾発射AIは実装済み（ドロップ未実装）
  },
  charger: {
    id: "charger",
    name: "チャージャー",
    hp: 40,
    drop: []
    // ⚠️ 配置済み・突進AIは未実装（slimeと同一挙動）
  },
  boss: {
    id: "boss",
    name: "ボス",
    hp: 200,
    drop: []
    // ⚠️ 配置済み・弾幕AIは未実装
  },
  wolf: {
    id: "wolf",
    name: "ウルフ",
    hp: 50,
    atk: 10,
    def: 4,
    drop: [
      { item: "meat", rate: 0.7 }
    ]
    // ❌ 未実装
  }
};
```

---

## ■ レシピ（クラフト）

```js
const recipes = {
  wood_sword: {
    id: "wood_sword",
    materials: { wood: 5 },
    result: "wood_sword"
    // ⚠️ craftWeapon() で簡易実装（アイテム付与ではなくatk直接加算）
  },
  cloth_armor: {
    id: "cloth_armor",
    materials: { cloth: 3 },
    result: "cloth_armor"
    // ❌ 未実装（cloth素材自体が未実装）
  },
  berry_craft: {
    id: "berry_craft",
    materials: { wood: 3 },
    result: "berry"
    // ✅ craftHeal() で実装済み
  }
};
```

---

## ■ 拡張方針

- レアリティ追加（common / rare / epic）
- 属性（火・氷など）
- スキル付き装備
- 状態異常（毒・出血）
- hungerシステム（meat使用のために必要）

---

## ■ 注意点

- IDの重複禁止
- effect / stat は必ずオブジェクトで定義
- 未定義アイテム参照を防ぐ（存在チェックを実装側で行う）
- 未実装データをそのまま `script.js` に組み込まない
