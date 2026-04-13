// =====================
// ■ Canvas
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  const prevW = canvas.width;
  const prevH = canvas.height;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  // リサイズ前後のcanvasサイズ差分をoffsetに補正（プレイヤー実座標を維持）
  // 実座標 = canvas.width/2 - offsetX なので、幅が変わった分だけoffsetを調整する
  if(prevW && prevH){
    world.offsetX += (canvas.width  - prevW) / 2;
    world.offsetY += (canvas.height - prevH) / 2;
  }
}
window.addEventListener("resize", resize);
resize();

// =====================
// ■ Config
// =====================
const TILE_SIZE = 40;

const STAMINA_DODGE_COST = 30;
const STAMINA_ATTACK_COST = 15;
const STAMINA_RECOVER = 0.2;

const HUT_HEAL_RATE = 0.2;

// 小屋スポーンタイル座標（リボーン・初期配置の共通定義）
const HUT_SPAWN_TX = 1;
const HUT_SPAWN_TY = 1;

// =====================
// ■ State
// =====================
let gameStarted = false;
let hasSave = false;
let shake = 0;
let isDead = false; // 死亡処理多重実行防止フラグ
let saveFlash = 0;  // "SAVED" 表示カウンタ（saveGame時にセット）
let hutFlash  = 0;  // フィードバック表示カウンタ（expandHut・クラフト失敗時にセット）
let hutFlashMsg = ""; // hutFlash で表示するメッセージ

const SAVE_KEY = "forest_survival_save_v1";

let settings = { sound: true };

// =====================
// ■ Input
// =====================
const input = { up:false,down:false,left:false,right:false,attack:false,dodge:false };

document.addEventListener("keydown", e => {

  // タイトル操作
  if (!gameStarted) {
    if (e.key.toLowerCase() === "n") gameStarted = true;
    if (e.key.toLowerCase() === "l" && hasSave) {
      loadGame();
      gameStarted = true;
    }
  }

  if (e.key === "ArrowUp") input.up = true;
  if (e.key === "ArrowDown") input.down = true;
  if (e.key === "ArrowLeft") input.left = true;
  if (e.key === "ArrowRight") input.right = true;

  if (e.code === "Space"){ input.attack = true; attack(); } // 攻撃を即時実行
  if (e.code === "ShiftLeft"){                          // 回避：スタミナ足りる場合のみ有効
    if(player.stamina >= STAMINA_DODGE_COST){
      player.stamina  -= STAMINA_DODGE_COST;            // スタミナ消費
      player.invincible = 30;                           // 無敵フレーム付与（30f）
      input.dodge = true;
      playSE("dodge");                                  // 回避SE再生
    }
  }

  if (e.key.toLowerCase() === "z") useHeal();
  if (e.key.toLowerCase() === "c" && player.inHut) craftHeal();
  if (e.key.toLowerCase() === "x" && player.inHut) craftWeapon();
  if (e.key.toLowerCase() === "v" && player.inHut) expandHut();

  if (e.key.toLowerCase() === "m") settings.sound = !settings.sound;
  if (e.key.toLowerCase() === "s") saveGame();
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowUp") input.up = false;
  if (e.key === "ArrowDown") input.down = false;
  if (e.key === "ArrowLeft") input.left = false;
  if (e.key === "ArrowRight") input.right = false;
  if (e.code === "Space") input.attack = false;
  if (e.code === "ShiftLeft") input.dodge = false;
});

// =====================
// ■ Virtual Pad（タッチイベント）
// =====================
// 方向ボタン：touchstart/touchend で input フラグを操作
// atk ボタン：touchstart で attack() を直接呼び出し（Spaceキーと同一処理）
// dodge ボタン：touchstart でスタミナ判定付きの回避処理（ShiftLeftキーと同一処理）
(function bindVpad(){
  const map = {
    up:    () => { input.up    = true;  },
    down:  () => { input.down  = true;  },
    left:  () => { input.left  = true;  },
    right: () => { input.right = true;  },
  };
  const unmap = {
    up:    () => { input.up    = false; },
    down:  () => { input.down  = false; },
    left:  () => { input.left  = false; },
    right: () => { input.right = false; },
  };

  ["up","down","left","right"].forEach(id => {
    const btn = document.getElementById(id);
    if(!btn) return;
    btn.addEventListener("touchstart", e => { e.preventDefault(); map[id]();   }, { passive:false });
    btn.addEventListener("touchend",   e => { e.preventDefault(); unmap[id](); }, { passive:false });
    btn.addEventListener("touchcancel",e => { e.preventDefault(); unmap[id](); }, { passive:false });
  });

  // atk ボタン：Spaceキーと同一（attack() 直接呼び出し）
  const atkBtn = document.getElementById("atk");
  if(atkBtn){
    atkBtn.addEventListener("touchstart", e => { e.preventDefault(); attack(); }, { passive:false });
  }

  // dodge ボタン：ShiftLeftキーと同一処理
  const dodgeBtn = document.getElementById("dodge");
  if(dodgeBtn){
    dodgeBtn.addEventListener("touchstart", e => {
      e.preventDefault();
      if(player.stamina >= STAMINA_DODGE_COST){
        player.stamina   -= STAMINA_DODGE_COST;
        player.invincible = 30;
        input.dodge = true;
        playSE("dodge");
      }
    }, { passive:false });
    dodgeBtn.addEventListener("touchend",    e => { e.preventDefault(); input.dodge = false; }, { passive:false });
    dodgeBtn.addEventListener("touchcancel", e => { e.preventDefault(); input.dodge = false; }, { passive:false });
  }
}());

// =====================
// ■ Map（1=壁 0=床 2=小屋）
// =====================
// 旧マップから変更：
// - 小屋（2）は左上 2×2 タイルを維持（既存仕様と同一）
// - フィールドを小屋面積（4タイル）の約5倍（≒20タイル）に拡張
// - マップ全体サイズ：20列×15行
// - 外周はすべて壁（1）
// - 小屋右(列3,行1-2)・小屋下(行3,列1-2) を床(0)にして出口を確保
const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,2,2,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function isWall(x,y){
  const tx=Math.floor(x/TILE_SIZE);
  const ty=Math.floor(y/TILE_SIZE);
  return !map[ty]||map[ty][tx]===1;
}

function isHut(x,y){
  const tx=Math.floor(x/TILE_SIZE);
  const ty=Math.floor(y/TILE_SIZE);
  return map[ty]&&map[ty][tx]===2;
}

// =====================
// ■ Player
// =====================
const player={
  hp:100,
  stamina:100,
  maxStamina:100,
  atk:10,
  dirX:0,dirY:-1,
  invincible:0,
  knockbackX:0,knockbackY:0,
  healing:0,
  inHut:false
};

// =====================
// ■ World
// =====================
// プレイヤー実座標 = canvas.width/2 - offsetX
// スポーンタイル中央 = HUT_SPAWN_TX * TILE_SIZE + TILE_SIZE/2
// → offsetX = canvas.width/2 - スポーン中央座標
function calcSpawnOffset() {
  return {
    offsetX: canvas.width/2  - (HUT_SPAWN_TX * TILE_SIZE + TILE_SIZE / 2),
    offsetY: canvas.height/2 - (HUT_SPAWN_TY * TILE_SIZE + TILE_SIZE / 2),
  };
}

const world = calcSpawnOffset(); // 初期スポーン位置

// =====================
// ■ Enemy
// =====================
// 敵はすべてフィールド（小屋外の床タイル）に配置
// ワールド座標 = タイル座標 * TILE_SIZE + TILE_SIZE/2 （タイル中央）
let enemies=[
  {x:5*TILE_SIZE+20,  y:5*TILE_SIZE+20,  hp:30,  type:"slime"},
  {x:9*TILE_SIZE+20,  y:4*TILE_SIZE+20,  hp:30,  type:"slime"},
  {x:13*TILE_SIZE+20, y:7*TILE_SIZE+20,  hp:30,  type:"slime"},
  {x:7*TILE_SIZE+20,  y:10*TILE_SIZE+20, hp:30,  type:"slime"},
  {x:15*TILE_SIZE+20, y:5*TILE_SIZE+20,  hp:40,  type:"charger"},
  {x:11*TILE_SIZE+20, y:9*TILE_SIZE+20,  hp:40,  type:"charger"},
  {x:6*TILE_SIZE+20,  y:8*TILE_SIZE+20,  hp:20,  type:"shooter"},
  {x:16*TILE_SIZE+20, y:11*TILE_SIZE+20, hp:20,  type:"shooter"},
  {x:17*TILE_SIZE+20, y:3*TILE_SIZE+20,  hp:200, type:"boss"},
];

let bullets=[];

// =====================
// ■ Inventory
// =====================
const inventory={ wood:0, berry:0 };

// =====================
// ■ Death Drop
// =====================
let deathDrops=[];

// =====================
// ■ Audio
// =====================
let audioCtx;
function initAudio(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
}

function playSE(type){
  if(!audioCtx||!settings.sound)return;
  const osc=audioCtx.createOscillator();
  const gain=audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);

  if(type==="attack"){
    osc.frequency.setValueAtTime(400,audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200,audioCtx.currentTime+0.1);
  }
  if(type==="hit"){
    osc.frequency.setValueAtTime(120,audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60,audioCtx.currentTime+0.2);
  }
  if(type==="dodge"){
    osc.frequency.setValueAtTime(800,audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400,audioCtx.currentTime+0.1);
  }

  gain.gain.value=0.1;
  osc.start();
  osc.stop(audioCtx.currentTime+0.15);
}

// =====================
// ■ Save / Load
// =====================
function saveGame(){
  localStorage.setItem(SAVE_KEY,JSON.stringify({
    player,world,inventory,map,settings // settings をセーブ対象に追加
  }));
  saveFlash = 180; // 約3秒間 "SAVED" を表示
}

function loadGame(){
  const d=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
  if(!d)return;
  Object.assign(player,d.player);
  Object.assign(world,d.world);
  Object.assign(inventory,d.inventory);
  if(d.settings) Object.assign(settings,d.settings); // settings を復元（旧セーブ互換：存在チェックあり）
  // 前セッションの残存データをリセット
  enemies=[]; bullets=[]; deathDrops=[];
}

function checkSave(){
  hasSave=!!localStorage.getItem(SAVE_KEY);
}
checkSave();

// =====================
// ■ Game Logic
// =====================
function update(){

  if(player.hp<=0 && !isDead){ isDead=true; handleDeath(); return; }
  if(isDead) return;

  move();
  updateEnemies();
  updateBullets();

  if(player.stamina<player.maxStamina) player.stamina+=STAMINA_RECOVER;
  if(player.stamina>player.maxStamina) player.stamina=player.maxStamina; // 浮動小数点超過クランプ

  if(player.inHut) player.hp+=HUT_HEAL_RATE;

  if(player.healing>0){
    player.healing--;
    player.hp+=0.5;
  }

  if(player.hp>100) player.hp=100;

  if(player.invincible>0) player.invincible--;  // 無敵フレームカウントダウン

  if(shake>0) shake--;
  if(saveFlash>0) saveFlash--; // "SAVED" 表示カウントダウン
  if(hutFlash>0)  hutFlash--;  // フィードバック表示カウントダウン

  // deathDrop 回収判定（balance.md：回収判定距離 30px）
  if(deathDrops.length > 0){
    const px = canvas.width/2  - world.offsetX;
    const py = canvas.height/2 - world.offsetY;
    deathDrops = deathDrops.filter(d => {
      if(Math.hypot(d.x - px, d.y - py) < 30){
        inventory.wood += d.items.wood || 0; // アイテム回収
        return false; // 配列から除去
      }
      return true;
    });
  }
}

function move(){
  let vx=0,vy=0;
  if(input.left)vx--;
  if(input.right)vx++;
  if(input.up)vy--;
  if(input.down)vy++;

  if(vx||vy){
    const l=Math.hypot(vx,vy);
    player.dirX=vx/l;
    player.dirY=vy/l;
  }

  const speed=3;

  // 入力移動とノックバックを分離して壁判定
  // 入力移動のみ isWall チェック対象とし、ノックバックは壁チェック後に無条件適用
  const moveX = vx * speed;
  const moveY = vy * speed;
  const R = 10; // キャラクター当たり半径（px）

  // X軸：中心＋移動方向の端点を壁チェック
  const nextOffX = world.offsetX - moveX;
  const nxC = canvas.width/2  - nextOffX;          // 中心X
  const nyCur = canvas.height/2 - world.offsetY;    // 現在のY（変化なし）
  if(!isWall(nxC + R*Math.sign(moveX), nyCur) &&
     !isWall(nxC + R*Math.sign(moveX), nyCur - R) &&
     !isWall(nxC + R*Math.sign(moveX), nyCur + R)){
    world.offsetX = nextOffX;
  }

  // Y軸：中心＋移動方向の端点を壁チェック
  const nextOffY = world.offsetY - moveY;
  const nxCur = canvas.width/2  - world.offsetX;    // 現在のX（変化なし）
  const nyC = canvas.height/2 - nextOffY;           // 中心Y
  if(!isWall(nxCur,       nyC + R*Math.sign(moveY)) &&
     !isWall(nxCur - R,   nyC + R*Math.sign(moveY)) &&
     !isWall(nxCur + R,   nyC + R*Math.sign(moveY))){
    world.offsetY = nextOffY;
  }

  // ノックバックは壁判定外で適用（壁内への押し込みを許容しない設計は今後の課題）
  world.offsetX += player.knockbackX;
  world.offsetY += player.knockbackY;

  const px=canvas.width/2-world.offsetX;
  const py=canvas.height/2-world.offsetY;

  player.inHut=isHut(px,py);

  player.knockbackX*=0.8;
  player.knockbackY*=0.8;
}

function attack(){
  if(player.stamina < STAMINA_ATTACK_COST) return; // スタミナ不足時は攻撃不可
  player.stamina -= STAMINA_ATTACK_COST;            // スタミナ消費
  playSE("attack");

  enemies.forEach(e=>{
    const dx=(e.x+world.offsetX)-(canvas.width/2);
    const dy=(e.y+world.offsetY)-(canvas.height/2);
    const dist=Math.hypot(dx,dy);
    if(dist===0) return; // 座標完全一致時のゼロ除算ガード

    const dot=(-dx/dist)*player.dirX+(-dy/dist)*player.dirY;

    if(dist<50 && dot>0.5){
      e.hp-=player.atk;
    }
  });

  enemies=enemies.filter(e=>e.hp>0);
}

function updateEnemies(){
  enemies.forEach(e=>{
    if(player.inHut)return;

    const dx=(canvas.width/2)-(e.x+world.offsetX);
    const dy=(canvas.height/2)-(e.y+world.offsetY);
    const dist=Math.hypot(dx,dy);
    if(dist===0) return; // 座標完全一致時のゼロ除算ガード

    if(e.type==="slime"){
      e.x+=dx/dist;
      e.y+=dy/dist;
    }

    if(e.type==="shooter"){
      if(Math.random()<0.02){
        bullets.push({x:e.x,y:e.y,vx:dx/dist*3,vy:dy/dist*3});
      }
    }

    if(dist<30 && player.invincible===0){  // 無敵中はダメージ無効
      player.hp-=1;
      shake=10;
      playSE("hit");
    }
  });
}

function updateBullets(){
  const cx=canvas.width/2;
  const cy=canvas.height/2;
  bullets.forEach(b=>{
    b.x+=b.vx;
    b.y+=b.vy;
    // 弾→プレイヤー衝突判定（無敵中はダメージ無効）
    const dist=Math.hypot((b.x+world.offsetX)-cx,(b.y+world.offsetY)-cy);
    if(dist<20 && player.invincible===0){
      player.hp-=5;
      shake=10;
      playSE("hit");
      b.hit=true; // 命中フラグ
    }
    // 画面外に出た弾を除去（配列肥大化防止）
    const sx = b.x + world.offsetX;
    const sy = b.y + world.offsetY;
    if(sx < -TILE_SIZE || sx > canvas.width  + TILE_SIZE ||
       sy < -TILE_SIZE || sy > canvas.height + TILE_SIZE){
      b.hit = true;
    }
  });
  bullets=bullets.filter(b=>!b.hit); // 命中・画面外の弾を除去
}

// =====================
// ■ Death
// =====================
function handleDeath(){
  const px=canvas.width/2-world.offsetX;
  const py=canvas.height/2-world.offsetY;

  deathDrops.push({
    x:px,y:py,
    items:{wood:Math.floor(inventory.wood/2)}
  });

  inventory.wood=Math.floor(inventory.wood/2);

  // 小屋スポーン位置に強制帰還
  const spawn = calcSpawnOffset();
  world.offsetX = spawn.offsetX;
  world.offsetY = spawn.offsetY;

  player.hp=100;
  isDead=false; // フラグリセット：次フレームから通常更新を再開
}

// =====================
// ■ Craft
// =====================
function craftHeal(){
  if(inventory.wood>=3){
    inventory.wood-=3;
    inventory.berry++;
  } else {
    hutFlash=120; hutFlashMsg="NO WOOD"; // 素材不足フィードバック（約2秒）
  }
}

function craftWeapon(){
  if(inventory.wood>=5){
    inventory.wood-=5;
    player.atk+=5;
  } else {
    hutFlash=120; hutFlashMsg="NO WOOD"; // 素材不足フィードバック（約2秒）
  }
}

function expandHut(){
  map.forEach((row,y)=>{
    row.forEach((v,x)=>{
      if(v===2){
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{
          if(map[y+d[1]]&&map[y+d[1]][x+d[0]]===0){
            map[y+d[1]][x+d[0]]=2;
          }
        });
      }
    });
  });
  hutFlash=120; hutFlashMsg="EXPANDED"; // 拡張完了フィードバック（約2秒）
}

function useHeal(){
  if(inventory.berry>0){
    inventory.berry--;
    player.healing=60;
  }
}

// =====================
// ■ Render
// =====================
function render(){

  const sx=shake? (Math.random()-0.5)*10:0;
  const sy=shake? (Math.random()-0.5)*10:0;

  ctx.setTransform(1,0,0,1,sx,sy);

  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  drawMap();
  drawDeathDrops(); // deathDropsをDで描画（drawMap直後）
  drawEnemies();
  drawPlayer();
  drawUI();
}

function drawMap(){
  ctx.font="20px monospace";
  map.forEach((row,y)=>{
    row.forEach((v,x)=>{
      const sx=x*TILE_SIZE+world.offsetX;
      const sy=y*TILE_SIZE+world.offsetY+20; // fillTextはベースライン基準：フォントサイズ分オフセット
      ctx.fillStyle=v===1?"#888":v===2?"#0ff":"#0f0";
      ctx.fillText(v===1?"#":v===2?"H":".",sx,sy);
    });
  });
}

function drawDeathDrops(){
  ctx.fillStyle="#fa0";
  deathDrops.forEach(d=>{
    ctx.fillText("D", d.x + world.offsetX, d.y + world.offsetY + 20);
  });
}

function drawEnemies(){
  ctx.fillStyle="red";
  enemies.forEach(e=>{
    ctx.fillText("E", e.x+world.offsetX, e.y+world.offsetY+20);
  });
}

function drawPlayer(){
  ctx.fillStyle="cyan";
  ctx.fillText("@", canvas.width/2, canvas.height/2+20);
}

function drawUI(){
  ctx.setTransform(1,0,0,1,0,0); // HUDはシェイクの影響を受けないようリセット
  ctx.font="20px monospace";
  ctx.fillStyle="white";
  ctx.fillText("HP:"+Math.floor(player.hp),20,20);
  ctx.fillText("WOOD:"+inventory.wood,20,40);
  ctx.fillText("ATK:"+player.atk,20,60);
  ctx.fillText("ENEMY:"+enemies.length,20,80); // 残敵数表示

  // スタミナバー（背景グレー＋残量イエロー）
  const barW = 100;
  const barH = 8;
  const barX = 20;
  const barY = 88; // ENEMY行追加により68→88に調整
  ctx.fillStyle = "#444";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = "#ff0";
  ctx.fillRect(barX, barY, barW * (player.stamina / player.maxStamina), barH);

  // saveFlash 中は "SAVED" を黄色で表示
  if(saveFlash > 0){
    ctx.fillStyle = "#ff0";
    ctx.fillText("SAVED", 20, barY + barH + 20);
  }

  // hutFlash 中はメッセージ（EXPANDED / NO WOOD）をオレンジで表示
  if(hutFlash > 0){
    ctx.fillStyle = "#f80";
    ctx.fillText(hutFlashMsg, 20, barY + barH + 40);
  }

  // 小屋内フラグ表示（判定境界の視認性確保）
  if(player.inHut){
    ctx.fillStyle = "#0ff";
    ctx.fillText("[HUT]", 20, barY + barH + 60);
  }
}

// =====================
// ■ Title
// =====================
function drawTitle(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.font="20px monospace"; // drawMap の font 設定に依存しないよう明示指定
  ctx.fillStyle="white";
  ctx.fillText("FOREST SURVIVAL",50,100);
  ctx.fillText("N:NEW",50,140);
  if(hasSave) ctx.fillText("L:LOAD",50,170);
}

// =====================
// ■ Loop
// =====================
function loop(){
  if(!gameStarted){
    drawTitle();
  }else{
    update();
    render();
  }
  requestAnimationFrame(loop);
}
loop();

// =====================
// ■ Audio Init
// =====================
document.addEventListener("click",()=>{
  initAudio();
},{once:true});
