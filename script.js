// =====================
// ■ Canvas
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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

// =====================
// ■ State
// =====================
let gameStarted = false;
let hasSave = false;
let shake = 0;

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

  if(e.code === "Space"){ input.attack = true; attack(); } // 攻撃：即時実行
  if(e.code === "ShiftLeft"){                               // 回避：スタミナ消費＋SE
    if(player.stamina>=STAMINA_DODGE_COST){
      player.stamina-=STAMINA_DODGE_COST;
      input.dodge=true;
      playSE("dodge");
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
// ■ Map（1=壁 0=床 2=小屋）
// =====================
const map = [
[1,1,1,1,1,1,1,1,1,1],
[1,2,2,0,0,0,0,0,0,1],
[1,2,2,1,0,0,1,0,0,1],
[1,0,0,0,0,0,0,0,0,1],
[1,1,1,1,1,1,1,1,1,1]
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
const world={ offsetX:0, offsetY:0 };

// =====================
// ■ Enemy
// =====================
let enemies=[
  {x:120,y:80,hp:30,type:"slime"},
  {x:200,y:100,hp:40,type:"charger"},
  {x:180,y:60,hp:20,type:"shooter"},
  {x:300,y:120,hp:200,type:"boss"}
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
    player,world,inventory,map
  }));
}

function loadGame(){
  const d=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
  if(!d)return;
  Object.assign(player,d.player);
  Object.assign(world,d.world);
  Object.assign(inventory,d.inventory);
}

function checkSave(){
  hasSave=!!localStorage.getItem(SAVE_KEY);
}
checkSave();

// =====================
// ■ Game Logic
// =====================
function update(){

  if(player.hp<=0){ handleDeath(); return; }

  move();
  updateEnemies();
  updateBullets();

  if(player.stamina<player.maxStamina) player.stamina+=STAMINA_RECOVER;

  if(player.inHut) player.hp+=HUT_HEAL_RATE;

  if(player.healing>0){
    player.healing--;
    player.hp+=0.5;
  }

  if(player.hp>100) player.hp=100;

  if(shake>0) shake--;
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

  world.offsetX-=vx*speed-player.knockbackX;
  world.offsetY-=vy*speed-player.knockbackY;

  const px=canvas.width/2-world.offsetX;
  const py=canvas.height/2-world.offsetY;

  player.inHut=isHut(px,py);

  player.knockbackX*=0.8;
  player.knockbackY*=0.8;
}

function attack(){
  if(player.stamina<STAMINA_ATTACK_COST)return; // スタミナ不足時は攻撃キャンセル
  player.stamina-=STAMINA_ATTACK_COST;           // 攻撃スタミナ消費
  playSE("attack");

  enemies.forEach(e=>{
    const dx=(e.x+world.offsetX)-(canvas.width/2);
    const dy=(e.y+world.offsetY)-(canvas.height/2);
    const dist=Math.hypot(dx,dy);

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

    if(e.type==="slime"){
      e.x+=dx/dist;
      e.y+=dy/dist;
    }

    if(e.type==="shooter"){
      if(Math.random()<0.02){
        bullets.push({x:e.x,y:e.y,vx:dx/dist*3,vy:dy/dist*3});
      }
    }

    if(dist<30){
      player.hp-=1;
      shake=10;
      playSE("hit");
    }
  });
}

function updateBullets(){
  bullets.forEach(b=>{
    b.x+=b.vx;
    b.y+=b.vy;

    // 弾→プレイヤー衝突判定（プレイヤーは画面中央固定）
    const dx=(b.x+world.offsetX)-canvas.width/2;
    const dy=(b.y+world.offsetY)-canvas.height/2;
    if(Math.hypot(dx,dy)<16){   // 衝突半径16px
      player.hp-=5;             // balance.md 弾ダメージ5
      shake=10;
      playSE("hit");
      b.dead=true;              // 命中フラグ：後続フィルタで除去
    }
  });
  bullets=bullets.filter(b=>!b.dead); // 命中済み弾を除去
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

  player.hp=100;
}

// =====================
// ■ Craft
// =====================
function craftHeal(){
  if(inventory.wood>=3){
    inventory.wood-=3;
    inventory.berry++;
  }
}

function craftWeapon(){
  if(inventory.wood>=5){
    inventory.wood-=5;
    player.atk+=5;
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
  drawEnemies();
  drawPlayer();
  drawUI();
}

function drawMap(){
  ctx.font="20px monospace";
  map.forEach((row,y)=>{
    row.forEach((v,x)=>{
      const sx=x*TILE_SIZE+world.offsetX;
      const sy=y*TILE_SIZE+world.offsetY;
      ctx.fillStyle=v===1?"#888":v===2?"#0ff":"#0f0";
      ctx.fillText(v===1?"#":v===2?"H":".",sx,sy);
    });
  });
}

function drawEnemies(){
  ctx.fillStyle="red";
  enemies.forEach(e=>{
    ctx.fillText("E",e.x+world.offsetX,e.y+world.offsetY);
  });
}

function drawPlayer(){
  ctx.fillStyle="cyan";
  ctx.fillText("@",canvas.width/2,canvas.height/2);
}

function drawUI(){
  ctx.fillStyle="white";
  ctx.fillText("HP:"+Math.floor(player.hp),20,20);
  ctx.fillText("WOOD:"+inventory.wood,20,40);
  ctx.fillText("ATK:"+player.atk,20,60);
}

// =====================
// ■ Title
// =====================
function drawTitle(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

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