const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const statusEl = document.getElementById("status");
const hitsEl = document.getElementById("hits");

const world = {
  gravity: 0.25,
  friction: 0.75,
  ground: 620,
  platforms: [
    { x: 140, y: 520, w: 220, h: 20 },
    { x: 430, y: 460, w: 200, h: 20 },
    { x: 720, y: 400, w: 220, h: 20 },
    { x: 1020, y: 500, w: 200, h: 20 },
    { x: 860, y: 300, w: 200, h: 20 },
  ],
};

const input = {
  left: false,
  right: false,
  jump: false,
  down: false,
  shoot: false,
  pointer: { x: 0, y: 0 },
};

const player = {
  x: 80,
  y: world.ground - 48,
  w: 32,
  h: 48,
  vx: 0,
  vy: 0,
  speed: 3.6,
  jumpForce: 13.0,
  grounded: false,
  facing: 1,
  cooldown: 0,
  ammo: 5,
  ammoMax: 5,
  hp: 20,
  hpMax: 20,
  hitFlash: 0,
  knockbackTimer: 0,
  invulnTimer: 0,
  weapon: "revolver",
};

const weapons = {
  revolver: { name: "Revolver", price: 0, damage: 1, cooldown: 14, speed: 8, pellets: 1 },
  rifle: { name: "Rifle", price: 5, damage: 1, cooldown: 8, speed: 10, pellets: 1 },
  shotgun: { name: "Shotgun", price: 0, damage: 1, cooldown: 20, speed: 7, pellets: 3 },
};

let bullets = [];
let enemies = [];
let ammoPacks = [];
let enemyBullets = [];
let hits = 0;
let wave = 1;
let waveRemaining = 0;
let waveCooldown = 0;
let waveBannerTimer = 0;
let gameOver = false;
let wavePurpleSpawned = 0;
let ammoRainTimer = 0;
let ammoDrops = 0;
const AMMO_DROP_INTERVAL = 1100;
let gameState = "menu";
let coins = 0;
let selectedWeapon = "revolver";
const ownedWeapons = new Set(["revolver", "shotgun"]);
let frameTick = 0;

function makeButton(label) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.position = "absolute";
  btn.style.left = "50%";
  btn.style.transform = "translate(-50%, -50%)";
  btn.style.padding = "10px 16px";
  btn.style.fontFamily = "'Press Start 2P', monospace";
  btn.style.fontSize = "12px";
  btn.style.background = "#f4d35e";
  btn.style.border = "0";
  btn.style.cursor = "pointer";
  btn.style.display = "none";
  btn.style.zIndex = "10";
  const parent = canvas.parentElement || document.body;
  parent.appendChild(btn);
  return btn;
}

const startBtn = makeButton("Start");
startBtn.style.top = "55%";

const shopBtn = makeButton("Shop");
shopBtn.style.top = "65%";

const equipBtn = makeButton("Equip");
equipBtn.style.top = "75%";

const shopRevolverBtn = makeButton("Buy Revolver (0)");
shopRevolverBtn.style.top = "40%";
const shopRifleBtn = makeButton("Buy Rifle (5)");
shopRifleBtn.style.top = "50%";
const shopShotgunBtn = makeButton("Buy Shotgun (0)");
shopShotgunBtn.style.top = "60%";
const shopBackBtn = makeButton("Back");
shopBackBtn.style.top = "72%";

const equipRevolverBtn = makeButton("Equip Revolver");
equipRevolverBtn.style.top = "40%";
const equipRifleBtn = makeButton("Equip Rifle");
equipRifleBtn.style.top = "50%";
const equipShotgunBtn = makeButton("Equip Shotgun");
equipShotgunBtn.style.top = "60%";
const equipBackBtn = makeButton("Back");
equipBackBtn.style.top = "72%";

const backBtn = makeButton("Back to Menu");
backBtn.style.top = "58%";

const resumeBtn = makeButton("Resume");
resumeBtn.style.top = "50%";
const pauseMenuBtn = makeButton("Back to Menu");
pauseMenuBtn.style.top = "62%";

function resetGame() {
  player.x = 80;
  player.y = world.ground - player.h;
  player.vx = 0;
  player.vy = 0;
  player.hpMax = selectedWeapon === "shotgun" ? 30 : 20;
  player.hp = player.hpMax;
  player.ammo = player.ammoMax;
  player.weapon = selectedWeapon;
  bullets = [];
  enemies = [];
  ammoPacks = [];
  enemyBullets = [];
  hits = 0;
  coins = 0;
  ownedWeapons.clear();
  ownedWeapons.add("revolver");
  ownedWeapons.add("shotgun");
  wave = 1;
  waveRemaining = 0;
  waveCooldown = 0;
  waveBannerTimer = 0;
  gameOver = false;
  gameState = "playing";
  startBtn.style.display = "none";
  shopBtn.style.display = "none";
  equipBtn.style.display = "none";
  shopRevolverBtn.style.display = "none";
  shopRifleBtn.style.display = "none";
  shopShotgunBtn.style.display = "none";
  shopBackBtn.style.display = "none";
  equipRevolverBtn.style.display = "none";
  equipRifleBtn.style.display = "none";
  equipShotgunBtn.style.display = "none";
  equipBackBtn.style.display = "none";
  backBtn.style.display = "none";
  resumeBtn.style.display = "none";
  pauseMenuBtn.style.display = "none";
  startWave();
}

function toMenu() {
  gameState = "menu";
  startBtn.style.display = "block";
  shopBtn.style.display = "block";
  equipBtn.style.display = "block";
  shopRevolverBtn.style.display = "none";
  shopRifleBtn.style.display = "none";
  shopShotgunBtn.style.display = "none";
  shopBackBtn.style.display = "none";
  equipRevolverBtn.style.display = "none";
  equipRifleBtn.style.display = "none";
  equipShotgunBtn.style.display = "none";
  equipBackBtn.style.display = "none";
  backBtn.style.display = "none";
  resumeBtn.style.display = "none";
  pauseMenuBtn.style.display = "none";
}

function toShop() {
  gameState = "shop";
  startBtn.style.display = "none";
  shopBtn.style.display = "none";
  equipBtn.style.display = "none";
  shopRevolverBtn.style.display = "block";
  shopRifleBtn.style.display = "block";
  shopShotgunBtn.style.display = "block";
  shopBackBtn.style.display = "block";
  equipRevolverBtn.style.display = "none";
  equipRifleBtn.style.display = "none";
  equipShotgunBtn.style.display = "none";
  equipBackBtn.style.display = "none";
  backBtn.style.display = "none";
  resumeBtn.style.display = "none";
  pauseMenuBtn.style.display = "none";
}

function toEquip() {
  gameState = "equip";
  startBtn.style.display = "none";
  shopBtn.style.display = "none";
  equipBtn.style.display = "none";
  shopRevolverBtn.style.display = "none";
  shopRifleBtn.style.display = "none";
  shopShotgunBtn.style.display = "none";
  shopBackBtn.style.display = "none";
  equipRevolverBtn.style.display = ownedWeapons.has("revolver") ? "block" : "none";
  equipRifleBtn.style.display = ownedWeapons.has("rifle") ? "block" : "none";
  equipShotgunBtn.style.display = ownedWeapons.has("shotgun") ? "block" : "none";
  equipBackBtn.style.display = "block";
  backBtn.style.display = "none";
  resumeBtn.style.display = "none";
  pauseMenuBtn.style.display = "none";
  updateEquipButtons();
}

function updateEquipButtons() {
  const selectedColor = "#7dff6b";
  const normalColor = "#f4d35e";
  equipRevolverBtn.style.background =
    selectedWeapon === "revolver" ? selectedColor : normalColor;
  equipRifleBtn.style.background =
    selectedWeapon === "rifle" ? selectedColor : normalColor;
  equipShotgunBtn.style.background =
    selectedWeapon === "shotgun" ? selectedColor : normalColor;
}

function toPause() {
  gameState = "pause";
  resumeBtn.style.display = "block";
  pauseMenuBtn.style.display = "block";
  startBtn.style.display = "none";
  shopBtn.style.display = "none";
  equipBtn.style.display = "none";
  shopRevolverBtn.style.display = "none";
  shopRifleBtn.style.display = "none";
  shopShotgunBtn.style.display = "none";
  shopBackBtn.style.display = "none";
  equipRevolverBtn.style.display = "none";
  equipRifleBtn.style.display = "none";
  equipShotgunBtn.style.display = "none";
  equipBackBtn.style.display = "none";
  backBtn.style.display = "none";
}

startBtn.addEventListener("click", () => {
  resetGame();
});

shopBtn.addEventListener("click", () => {
  toShop();
});

equipBtn.addEventListener("click", () => {
  toEquip();
});

backBtn.addEventListener("click", () => {
  toMenu();
});

function tryBuyWeapon(key) {
  const w = weapons[key];
  if (coins < w.price) return;
  coins -= w.price;
  player.weapon = key;
  selectedWeapon = key;
  ownedWeapons.add(key);
}

shopRevolverBtn.addEventListener("click", () => tryBuyWeapon("revolver"));
shopRifleBtn.addEventListener("click", () => tryBuyWeapon("rifle"));
shopShotgunBtn.addEventListener("click", () => tryBuyWeapon("shotgun"));
shopBackBtn.addEventListener("click", () => toMenu());
equipRevolverBtn.addEventListener("click", () => {
  if (ownedWeapons.has("revolver")) selectedWeapon = "revolver";
  updateEquipButtons();
});
equipRifleBtn.addEventListener("click", () => {
  if (ownedWeapons.has("rifle")) selectedWeapon = "rifle";
  updateEquipButtons();
});
equipShotgunBtn.addEventListener("click", () => {
  if (ownedWeapons.has("shotgun")) selectedWeapon = "shotgun";
  updateEquipButtons();
});
equipBackBtn.addEventListener("click", () => toMenu());
resumeBtn.addEventListener("click", () => {
  gameState = "playing";
  resumeBtn.style.display = "none";
  pauseMenuBtn.style.display = "none";
});
pauseMenuBtn.addEventListener("click", () => {
  toMenu();
});

function spawnEnemy() {
  const side = Math.random() > 0.5 ? 1 : -1;
  const x = side === 1 ? canvas.width + 40 : -40;
  const isMelee = wave >= 4 && wavePurpleSpawned < 2;
  if (isMelee) wavePurpleSpawned += 1;
  enemies.push({
    x,
    y: world.ground - 36,
    w: 28,
    h: 36,
    vx: side === 1 ? -1.2 : 1.2,
    vy: 0,
    grounded: true,
    alive: true,
    melee: isMelee,
    shootCooldown: 0,
    jumpCooldown: 0,
    patrolDir: side === 1 ? -1 : 1,
    patrolTimer: 0,
    damageCooldown: 0,
    hp: isMelee ? 3 : 2,
  });
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function updatePlayer() {
  if (player.knockbackTimer > 0) {
    player.knockbackTimer -= 1;
    player.vx *= 0.98;
  } else {
    if (input.left) {
      player.vx = -player.speed;
      player.facing = -1;
    } else if (input.right) {
      player.vx = player.speed;
      player.facing = 1;
    } else {
      player.vx *= world.friction;
    }
  }

  if (input.jump && player.grounded) {
    player.vy = -player.jumpForce;
    player.grounded = false;
  }

  player.vy += world.gravity;
  player.x += player.vx;
  player.y += player.vy;

  // World wrap
  if (player.x + player.w < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.w;

  // Ground collision
  if (player.y + player.h >= world.ground) {
    player.y = world.ground - player.h;
    player.vy = 0;
    player.grounded = true;
  }

  // Platform collisions (simple from above)
  if (!input.down) {
    for (const p of world.platforms) {
      const above = player.vy >= 0;
      const willLand =
        player.y + player.h <= p.y + player.vy &&
        player.y + player.h + player.vy >= p.y;
      if (
        above &&
        willLand &&
        player.x + player.w > p.x &&
        player.x < p.x + p.w
      ) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.grounded = true;
      }
    }
  }

  if (player.cooldown > 0) player.cooldown -= 1;
  if (player.hitFlash > 0) player.hitFlash -= 1;
  if (player.invulnTimer > 0) player.invulnTimer -= 1;
}

function shoot() {
  if (player.cooldown > 0) return;
  if (player.ammo <= 0) return;
  const w = weapons[player.weapon];
  player.cooldown = w.cooldown;
  player.ammo -= 1;

  const speed = w.speed;
  const dir = player.facing;
  const pellets = w.pellets;
  if (player.weapon === "shotgun") player.hitFlash = 6;
  if (player.weapon === "shotgun") {
    player.vx = -8 * dir;
    player.knockbackTimer = 10;
  }
  for (let i = 0; i < pellets; i += 1) {
    const spread = pellets === 1 ? 0 : (i - 1) * 0.6;
    const life = player.weapon === "shotgun" ? 90 : 180;
    bullets.push({
      x: player.x + player.w / 2,
      y: player.y + player.h / 2,
      w: 8,
      h: 4,
      vx: speed * dir,
      vy: spread,
      damage: w.damage,
      kind: player.weapon,
      life,
    });
  }
}

function updateBullets() {
  for (const b of bullets) {
    b.x += b.vx;
    if (b.vy) b.y += b.vy;
    if (b.x + b.w < -40) b.x = canvas.width + 40;
    if (b.x > canvas.width + 40) b.x = -40 - b.w;
    b.life -= 1;
  }
  bullets = bullets.filter((b) => b.life > 0 && b.y > -50 && b.y < canvas.height + 50);
}

function updateEnemies() {
  for (const e of enemies) {
    const dx = player.x + player.w / 2 - (e.x + e.w / 2);
    const focusRange = 260;
    if (Math.abs(dx) < focusRange) {
      const dirToPlayer = dx < 0 ? -1 : 1;
      e.vx = 0.9 * dirToPlayer;
    } else {
      if (e.patrolTimer <= 0) {
        e.patrolDir = Math.random() > 0.5 ? 1 : -1;
        e.patrolTimer = 120 + Math.floor(Math.random() * 120);
      }
      e.vx = 0.5 * e.patrolDir;
      e.patrolTimer -= 1;
    }
    e.x += e.vx;
    if (e.jumpCooldown > 0) e.jumpCooldown -= 1;
    if (e.grounded && e.jumpCooldown === 0 && Math.random() < 0.02) {
      e.vy = -9.5;
      e.grounded = false;
      e.jumpCooldown = 120;
    }

    e.vy += world.gravity;
    e.y += e.vy;
    // World wrap for enemies
    if (e.x + e.w < -60) e.x = canvas.width + 60;
    if (e.x > canvas.width + 60) e.x = -60;
    if (e.y + e.h >= world.ground) {
      e.y = world.ground - e.h;
      e.vy = 0;
      e.grounded = true;
    }

    // Platform collisions (simple from above)
    for (const p of world.platforms) {
      const above = e.vy >= 0;
      const willLand =
        e.y + e.h <= p.y + e.vy &&
        e.y + e.h + e.vy >= p.y;
      if (
        above &&
        willLand &&
        e.x + e.w > p.x &&
        e.x < p.x + p.w
      ) {
        e.y = p.y - e.h;
        e.vy = 0;
        e.grounded = true;
      }
    }
    if (e.shootCooldown > 0) e.shootCooldown -= 1;
    if (e.shootCooldown === 0) {
      const dir = e.x < player.x ? 1 : -1;
      enemyBullets.push({
        x: e.x + e.w / 2,
        y: e.y + e.h / 2,
        w: 6,
        h: 3,
        vx: 4.5 * dir,
        life: 220,
      });
      e.shootCooldown = 160 + Math.floor(Math.random() * 80);
    }

    if (e.damageCooldown > 0) e.damageCooldown -= 1;
    if (
      e.melee &&
      e.damageCooldown === 0 &&
      player.invulnTimer === 0 &&
      rectsOverlap(e, { x: player.x, y: player.y, w: player.w, h: player.h })
    ) {
      player.hp = Math.max(0, player.hp - 3);
      const pushDir = player.x + player.w / 2 < e.x + e.w / 2 ? -1 : 1;
      player.vx = 14 * pushDir;
      player.vy = -10;
      player.hitFlash = 18;
      player.knockbackTimer = 14;
      player.invulnTimer = 22;
      player.x += 10 * pushDir;
      e.damageCooldown = 40;
    }
  }
  enemies = enemies.filter((e) => e.alive);
}

function handleHits() {
  for (const e of enemies) {
    if (
      e.alive &&
      !e.melee &&
      player.vy > 0 &&
      rectsOverlap(
        { x: player.x, y: player.y, w: player.w, h: player.h },
        { x: e.x, y: e.y, w: e.w, h: e.h }
      )
    ) {
      e.alive = false;
      player.vy = -6;
      hits += 1;
        if (Math.random() < 0.6) {
          ammoPacks.push({
            x: e.x + e.w / 2 - 6,
            y: e.y + 8,
            w: 12,
            h: 12,
            vy: -2,
            resting: false,
            collected: false,
          });
        }
      continue;
    }
    for (const b of bullets) {
      if (rectsOverlap(e, b)) {
        e.hp -= b.damage ?? 1;
        b.x = -999;
        if (e.hp <= 0) {
          e.alive = false;
          hits += 1;
          coins += 1;
          if (Math.random() < 0.6) {
          ammoPacks.push({
            x: e.x + e.w / 2 - 6,
            y: e.y + 8,
            w: 12,
            h: 12,
            vy: -2,
            resting: false,
            collected: false,
          });
        }
        }
      }
    }
  }
  bullets = bullets.filter((b) => b.x > -100);
}

function updateAmmoPacks() {
  for (const p of ammoPacks) {
    if (!p.resting) {
      p.vy += world.gravity * 0.7;
      p.y += p.vy;
      if (p.y + p.h >= world.ground) {
        p.y = world.ground - p.h;
        p.vy = 0;
        p.resting = true;
      }
    }

    if (
      !p.collected &&
      rectsOverlap(p, { x: player.x, y: player.y, w: player.w, h: player.h })
    ) {
      p.collected = true;
      player.ammo = player.ammoMax;
    }
  }
  ammoPacks = ammoPacks.filter((p) => !p.collected);
}

function updateEnemyBullets() {
  for (const b of enemyBullets) {
    b.x += b.vx;
    if (b.x + b.w < -40) b.x = canvas.width + 40;
    if (b.x > canvas.width + 40) b.x = -40 - b.w;
    b.life -= 1;
    if (rectsOverlap(b, { x: player.x, y: player.y, w: player.w, h: player.h })) {
      b.x = -999;
      if (player.hp > 0) player.hp -= 1;
    }
  }
  enemyBullets = enemyBullets.filter((b) => b.life > 0 && b.x > -100);
}

function drawBackground() {
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#151b2b";
  ctx.fillRect(0, world.ground, canvas.width, canvas.height - world.ground);

  ctx.fillStyle = "#222b40";
  for (const p of world.platforms) {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
}

function drawHUD() {
  ctx.fillStyle = "#e7edf4";
  ctx.font = "14px 'Press Start 2P', monospace";
  ctx.textBaseline = "top";
  ctx.fillText(`HP ${player.hp}/${player.hpMax}`, 16, 12);
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = "#9ab0c7";
  ctx.fillText(`Packs ${ammoPacks.length} | Drops ${ammoDrops} | Timer ${ammoRainTimer}`, 16, 32);
  ctx.fillText(`Coins ${coins} | Waffe ${weapons[player.weapon].name}`, 16, 48);
}

function drawWaveBanner() {
  if (waveBannerTimer <= 0) return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, canvas.width, 48);
  ctx.fillStyle = "#f4d35e";
  ctx.font = "16px 'Press Start 2P', monospace";
  ctx.textBaseline = "top";
  ctx.fillText(`WELLE ${wave} START`, 16, 12);
}

function drawGameOver() {
  if (!gameOver) return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff4d6d";
  ctx.font = "24px 'Press Start 2P', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("GAME OVER", canvas.width / 2 - 110, canvas.height / 2 - 80);
}

function drawMenu() {
  if (gameState !== "menu") return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f4d35e";
  ctx.font = "28px 'Press Start 2P', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("PIXEL SHOOTER", canvas.width / 2 - 170, canvas.height / 2 - 80);
  ctx.fillStyle = "#9ab0c7";
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText("Druecke Start, um zu spielen", canvas.width / 2 - 150, canvas.height / 2 - 30);
}

function drawShop() {
  if (gameState !== "shop") return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f4d35e";
  ctx.font = "24px 'Press Start 2P', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("SHOP", canvas.width / 2 - 50, canvas.height / 2 - 140);
  ctx.fillStyle = "#9ab0c7";
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText(`Coins: ${coins}`, canvas.width / 2 - 60, canvas.height / 2 - 100);
}

function drawEquip() {
  if (gameState !== "equip") return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f4d35e";
  ctx.font = "24px 'Press Start 2P', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("EQUIP", canvas.width / 2 - 60, canvas.height / 2 - 140);
  ctx.fillStyle = "#9ab0c7";
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText(`Owned: ${Array.from(ownedWeapons).join(", ")}`, canvas.width / 2 - 160, canvas.height / 2 - 100);
  ctx.fillText(`Ausgeruestet: ${weapons[selectedWeapon].name}`, canvas.width / 2 - 170, canvas.height / 2 - 80);
  const hpPreview = selectedWeapon === "shotgun" ? 30 : 20;
  ctx.fillText(`Start-HP: ${hpPreview}`, canvas.width / 2 - 120, canvas.height / 2 - 60);
}

function drawPause() {
  if (gameState !== "pause") return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f4d35e";
  ctx.font = "24px 'Press Start 2P', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("PAUSE", canvas.width / 2 - 60, canvas.height / 2 - 120);
}

function drawPlayer() {
  const flashColor = player.hitFlash > 0 ? "#ff4d6d" : null;
  const skin = flashColor ?? "#f2c9a0";
  const shirt = flashColor ?? "#4fa3ff";
  const pants = flashColor ?? "#2b3a55";
  const shoes = flashColor ?? "#1a1f2b";

  const moving = Math.abs(player.vx) > 0.5 && player.grounded;
  const step = moving ? (Math.floor(frameTick / 8) % 2 === 0 ? 1 : -1) : 0;

  // Head
  ctx.fillStyle = skin;
  ctx.fillRect(player.x + 10, player.y + 2, 12, 12);
  // Torso
  ctx.fillStyle = shirt;
  ctx.fillRect(player.x + 8, player.y + 14, 16, 16);
  // Legs
  ctx.fillStyle = pants;
  ctx.fillRect(player.x + 8, player.y + 30 + step, 7, 14);
  ctx.fillRect(player.x + 17, player.y + 30 - step, 7, 14);
  // Shoes
  ctx.fillStyle = shoes;
  ctx.fillRect(player.x + 7, player.y + 44 + step, 9, 4);
  ctx.fillRect(player.x + 16, player.y + 44 - step, 9, 4);
  // Arm
  ctx.fillStyle = skin;
  ctx.fillRect(player.x + 2, player.y + 18 + step, 6, 8);

  const bodyY = player.y + 18;
  const gripY = player.y + 24;
  const facingRight = player.facing === 1;
  const gunX = facingRight ? player.x + player.w : player.x - 14;

  if (player.weapon === "shotgun") {
    // Shotgun look
    const barrelLen = 22;
    const stockLen = 8;
    const baseX = facingRight ? player.x + player.w - 2 : player.x - barrelLen - 6;
    ctx.fillStyle = "#d8c08a";
    // Barrel
    ctx.fillRect(baseX, bodyY, barrelLen, 4);
    // Pump
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(facingRight ? baseX + 6 : baseX + 6, bodyY + 4, 8, 3);
    // Stock attached to player
    ctx.fillStyle = "#5f4a2a";
    const stockX = facingRight ? baseX - stockLen + 2 : baseX + barrelLen - 2;
    ctx.fillRect(stockX, gripY, stockLen, 8);
    if (player.hitFlash > 0) {
      ctx.fillStyle = "#ffd166";
      const flashX = facingRight ? baseX + barrelLen : baseX - 4;
      ctx.fillRect(flashX, bodyY - 1, 5, 5);
    }
  } else if (player.weapon === "rifle") {
    // Rifle look
    ctx.fillStyle = "#c9c2b8";
    ctx.fillRect(gunX, bodyY, 14, 3);
    ctx.fillStyle = "#2b1f1a";
    ctx.fillRect(facingRight ? gunX - 2 : gunX + 10, gripY, 4, 6);
    ctx.fillStyle = "#7a7f7b";
    ctx.fillRect(facingRight ? gunX + 6 : gunX, bodyY - 2, 4, 2);
  } else {
    // Revolver look
    ctx.fillStyle = "#c9c2b8";
    ctx.fillRect(gunX, bodyY, 8, 3);
    ctx.fillStyle = "#8a918d";
    ctx.fillRect(gunX - 4, bodyY - 1, 6, 5);
    ctx.fillStyle = "#5f6662";
    ctx.fillRect(gunX - 2, bodyY + 1, 2, 1);
    ctx.fillStyle = "#2b1f1a";
    const gripX = facingRight ? gunX - 1 : gunX + 3;
    ctx.fillRect(gripX, gripY, 4, 6);
  }

  // Ammo display above player
  if (player.weapon === "shotgun") {
    const shellY = player.y - 12;
    const shellW = 5;
    const shellH = 7;
    const shellGap = 3;
    const totalW = player.ammoMax * shellW + (player.ammoMax - 1) * shellGap;
    let shellX = player.x + (player.w - totalW) / 2;
    for (let i = 0; i < player.ammoMax; i += 1) {
      ctx.fillStyle = i < player.ammo ? "#d8c08a" : "#2a344b";
      ctx.fillRect(shellX, shellY, shellW, shellH);
      ctx.fillStyle = "#b9792c";
      ctx.fillRect(shellX, shellY + shellH - 2, shellW, 2);
      shellX += shellW + shellGap;
    }
  } else {
    const dotY = player.y - 10;
    const dotSize = 4;
    const dotGap = 3;
    const totalW = player.ammoMax * dotSize + (player.ammoMax - 1) * dotGap;
    let dotX = player.x + (player.w - totalW) / 2;
    for (let i = 0; i < player.ammoMax; i += 1) {
      ctx.fillStyle = i < player.ammo ? "#7dff6b" : "#2a344b";
      ctx.fillRect(dotX, dotY, dotSize, dotSize);
      dotX += dotSize + dotGap;
    }
  }
}

function drawBullets() {
  for (const b of bullets) {
    if (b.kind === "shotgun") {
      ctx.fillStyle = "#ffd166";
    } else if (b.kind === "rifle") {
      ctx.fillStyle = "#7bdff2";
    } else {
      ctx.fillStyle = "#ff7a59";
    }
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
}

function drawEnemyBullets() {
  ctx.fillStyle = "#9d7bff";
  for (const b of enemyBullets) {
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.fillStyle = e.melee ? "#8a5cff" : "#ff4d6d";
    ctx.fillRect(e.x, e.y, e.w, e.h);
  }
}

function drawAmmoPacks() {
  for (const p of ammoPacks) {
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#1c2436";
    ctx.fillRect(p.x + Math.floor(p.w / 3), p.y + 3, 4, p.h - 6);
  }
}

let spawnTimer = 0;

function startWave() {
  waveRemaining = wave;
  waveCooldown = 0;
  spawnTimer = 0;
  waveBannerTimer = 120;
  wavePurpleSpawned = 0;
  ammoRainTimer = 0;
}

function update() {
  if (gameState !== "playing") return;
  frameTick += 1;
  updatePlayer();
  if (input.shoot) shoot();
  updateBullets();
  updateEnemies();
  handleHits();
  updateAmmoPacks();
  updateEnemyBullets();
  if (waveBannerTimer > 0) waveBannerTimer -= 1;
  if (wave >= 4) {
    ammoRainTimer += 1;
    if (ammoRainTimer >= AMMO_DROP_INTERVAL) {
      ammoRainTimer = 0;
      ammoPacks.push({
        x: Math.floor(Math.random() * (canvas.width - 24)) + 12,
        y: 20,
        w: 16,
        h: 16,
        vy: 1.2,
        resting: false,
        collected: false,
      });
      ammoDrops += 1;
    }
  } else {
    ammoRainTimer = 0;
  }

  if (player.hp <= 0) {
    gameOver = true;
    gameState = "gameover";
    backBtn.style.display = "block";
  }

  if (waveRemaining === 0 && enemies.length === 0) {
    if (waveCooldown === 0) {
      player.hp = player.hpMax;
      player.ammo = player.ammoMax;
      waveCooldown = 180;
    } else {
      waveCooldown -= 1;
      if (waveCooldown === 0) {
        wave += 1;
        startWave();
      }
    }
  }

  if (waveRemaining > 0) {
    spawnTimer += 1;
    if (spawnTimer > 140) {
      spawnTimer = 0;
      spawnEnemy();
      waveRemaining -= 1;
    }
  }

  hitsEl.textContent = hits;
  statusEl.textContent = `Welle ${wave}`;
}

function render() {
  if (gameState === "playing") {
    drawBackground();
    drawHUD();
    drawWaveBanner();
    drawPlayer();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawAmmoPacks();
    drawGameOver();
  } else {
    ctx.fillStyle = "#0b0e14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawMenu();
    drawShop();
    drawEquip();
    drawPause();
  }
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function setKeyState(e, state) {
  if (e.key === "Escape" && state) {
    if (gameState === "playing") {
      toPause();
      return;
    }
    if (gameState === "pause") {
      gameState = "playing";
      resumeBtn.style.display = "none";
      pauseMenuBtn.style.display = "none";
      return;
    }
  }
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") input.left = state;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") input.right = state;
  if (e.key === "ArrowUp" || e.key.toLowerCase() === "w" || e.key === " ") {
    input.jump = state;
  }
  if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
    input.down = state;
  }
  if (e.key.toLowerCase() === "j" || e.key.toLowerCase() === "k") {
    input.shoot = state;
  }
}

window.addEventListener("keydown", (e) => setKeyState(e, true));
window.addEventListener("keyup", (e) => setKeyState(e, false));

canvas.addEventListener("mousedown", () => {
  input.shoot = true;
});
canvas.addEventListener("mouseup", () => {
  input.shoot = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  input.pointer.x = e.clientX - rect.left;
  input.pointer.y = e.clientY - rect.top;
});

canvas.addEventListener("click", () => {
  canvas.focus();
});

canvas.setAttribute("tabindex", "0");
toMenu();
loop();
