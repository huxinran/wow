const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const heroHpBar = document.getElementById("heroHp");
const enemyHpBar = document.getElementById("enemyHp");

ctx.imageSmoothingEnabled = false;

const projectiles = [];
const explosions = [];
const floatText = [];

const world = {
  width: canvas.width,
  height: canvas.height,
  horizon: 372,
  time: 0,
  autoRestartTimer: 0,
};

const lanes = [
  { y: 486, scale: 0.72, speed: 0.76, xOffset: 34 },
  { y: 548, scale: 0.86, speed: 0.88, xOffset: 6 },
  { y: 612, scale: 1, speed: 1, xOffset: -18 },
  { y: 662, scale: 1.12, speed: 1.08, xOffset: -42 },
];

const squad = [
  {
    id: "spark-mage",
    name: "Spark Mage",
    role: "mage",
    lane: 0,
    x: 276,
    hp: 100,
    maxHp: 100,
    attackCooldown: 0.18,
    attackRate: 1.22,
    attackTimer: 0,
    facing: 1,
    colors: {
      robe: "#2e77b8",
      trim: "#f2c45b",
      skin: "#f0b78c",
      hair: "#f5ecd7",
      weapon: "#775533",
      magic: "#65f0dc",
    },
  },
  {
    id: "ember-archer",
    name: "Ember Archer",
    role: "archer",
    lane: 1,
    x: 224,
    hp: 100,
    maxHp: 100,
    attackCooldown: 0.54,
    attackRate: 1.42,
    attackTimer: 0,
    facing: 1,
    colors: {
      robe: "#617f38",
      trim: "#e9a94b",
      skin: "#d99a6d",
      hair: "#37241d",
      weapon: "#8a5a2e",
      magic: "#ffb35c",
    },
  },
  {
    id: "moon-priest",
    name: "Moon Priest",
    role: "priest",
    lane: 2,
    x: 318,
    hp: 100,
    maxHp: 100,
    attackCooldown: 0.94,
    attackRate: 1.64,
    attackTimer: 0,
    facing: 1,
    colors: {
      robe: "#d8d7cb",
      trim: "#7fd7ff",
      skin: "#efbd91",
      hair: "#8a5638",
      weapon: "#5d6581",
      magic: "#c9f7ff",
    },
  },
  {
    id: "ruby-knight",
    name: "Ruby Knight",
    role: "knight",
    lane: 3,
    x: 252,
    hp: 100,
    maxHp: 100,
    attackCooldown: 1.18,
    attackRate: 1.78,
    attackTimer: 0,
    facing: 1,
    colors: {
      robe: "#a33b43",
      trim: "#f4d06a",
      skin: "#e6ac7c",
      hair: "#211914",
      weapon: "#bfc6ca",
      magic: "#ff6d6d",
    },
  },
];

const enemies = [];

function makeEnemy(index, lane, x) {
  const palettes = [
    { body: "#96694b", belly: "#d2a371", armor: "#38495d", horn: "#f5d9a1", weapon: "#72512f" },
    { body: "#8a7550", belly: "#cdbb82", armor: "#5d3647", horn: "#ead08d", weapon: "#7b6740" },
    { body: "#7a8b56", belly: "#c7d08a", armor: "#33423c", horn: "#efe1a8", weapon: "#604b35" },
  ];

  return {
    id: `grunt-${index}`,
    lane,
    x,
    hp: 70,
    maxHp: 70,
    speed: 18 + index * 2,
    hurtTimer: 0,
    defeatedTimer: 0,
    facing: -1,
    colors: palettes[index % palettes.length],
  };
}

function resetGame() {
  for (const hero of squad) {
    hero.hp = hero.maxHp;
    hero.attackCooldown = 0.2 + hero.lane * 0.28;
    hero.attackTimer = 0;
  }

  enemies.length = 0;
  enemies.push(
    makeEnemy(0, 0, 930),
    makeEnemy(1, 1, 1040),
    makeEnemy(2, 2, 990),
    makeEnemy(3, 3, 1115),
    makeEnemy(4, 1, 1190),
  );

  projectiles.length = 0;
  explosions.length = 0;
  floatText.length = 0;
  world.autoRestartTimer = 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function laneY(unit) {
  return lanes[unit.lane].y;
}

function laneScale(unit) {
  return lanes[unit.lane].scale;
}

function aliveEnemies() {
  return enemies.filter((enemy) => enemy.hp > 0);
}

function findTarget(hero) {
  let best = null;
  let bestScore = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const laneGap = Math.abs(enemy.lane - hero.lane);
    const xGap = Math.max(0, enemy.x - hero.x);
    const score = laneGap * 170 + xGap;
    if (score < bestScore) {
      best = enemy;
      bestScore = score;
    }
  }
  return best;
}

function shootProjectile(hero, target) {
  const heroScale = laneScale(hero);
  const targetScale = laneScale(target);
  const isArrow = hero.role === "archer";
  const startX = hero.x + (isArrow ? 72 : 34) * heroScale;
  const startY = laneY(hero) - (isArrow ? 80 : 92) * heroScale;
  const endX = target.x - 16 * targetScale;
  const endY = laneY(target) - 72 * targetScale;
  const duration = clamp(Math.abs(endX - startX) / 620, 0.48, 0.92);
  const gravity = 880;

  hero.attackTimer = 0.34;
  hero.attackCooldown = hero.attackRate;

  projectiles.push({
    source: hero.id,
    targetId: target.id,
    x: startX,
    y: startY,
    vx: (endX - startX) / duration,
    vy: (endY - startY - 0.5 * gravity * duration * duration) / duration,
    gravity,
    life: duration + 0.14,
    age: 0,
    radius: 9 + heroScale * 4,
    damage: hero.role === "knight" ? 18 : 22,
    spin: 0,
    color: hero.colors.magic,
    lane: hero.lane,
    type: isArrow ? "arrow" : "bolt",
  });
}

function spawnExplosion(x, y, color, lane) {
  explosions.push({
    x,
    y,
    lane,
    color,
    age: 0,
    life: 0.42,
    particles: Array.from({ length: 18 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 18;
      const speed = 70 + Math.random() * 155;
      return {
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 45,
        size: 3 + Math.random() * 5,
      };
    }),
  });
}

function spawnFloatText(x, y, text) {
  floatText.push({ x, y, text, age: 0, life: 0.68 });
}

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyR") {
    event.preventDefault();
    resetGame();
  }
});

function update(dt) {
  world.time += dt;

  const remainingEnemies = aliveEnemies();
  if (remainingEnemies.length === 0) {
    world.autoRestartTimer += dt;
    if (world.autoRestartTimer > 3.2) resetGame();
  }

  for (const hero of squad) {
    hero.attackCooldown = Math.max(0, hero.attackCooldown - dt);
    hero.attackTimer = Math.max(0, hero.attackTimer - dt);
    const target = findTarget(hero);
    if (target) {
      hero.facing = target.x >= hero.x ? 1 : -1;
      if (hero.attackCooldown <= 0) shootProjectile(hero, target);
    }
  }

  for (const enemy of enemies) {
    enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
    if (enemy.hp <= 0) {
      enemy.defeatedTimer += dt;
      continue;
    }
    const lane = lanes[enemy.lane];
    enemy.x -= enemy.speed * lane.speed * dt;
    enemy.x += Math.sin(world.time * 1.35 + enemy.lane) * 6 * dt;
    enemy.x = clamp(enemy.x, 620 + enemy.lane * 16, 1240);
  }

  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const shot = projectiles[index];
    shot.age += dt;
    shot.life -= dt;
    shot.spin += dt * 12;
    shot.vy += shot.gravity * dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;

    const target = enemies.find((enemy) => enemy.id === shot.targetId);
    const hitRadius = target ? 42 * laneScale(target) : 0;
    const hit =
      target &&
      target.hp > 0 &&
      Math.hypot(shot.x - target.x, shot.y - (laneY(target) - 66 * laneScale(target))) < hitRadius;

    if (hit) {
      target.hp = Math.max(0, target.hp - shot.damage);
      target.hurtTimer = 0.24;
      spawnExplosion(shot.x, shot.y, shot.color, target.lane);
      spawnFloatText(target.x, laneY(target) - 130 * laneScale(target), `-${shot.damage}`);
      projectiles.splice(index, 1);
    } else if (shot.life <= 0 || shot.x > world.width + 80 || shot.y > world.height + 80) {
      spawnExplosion(shot.x, shot.y, shot.color, shot.lane);
      projectiles.splice(index, 1);
    }
  }

  for (let index = explosions.length - 1; index >= 0; index -= 1) {
    const blast = explosions[index];
    blast.age += dt;
    if (blast.age >= blast.life) explosions.splice(index, 1);
  }

  for (let index = floatText.length - 1; index >= 0; index -= 1) {
    const text = floatText[index];
    text.age += dt;
    text.y -= 36 * dt;
    if (text.age >= text.life) floatText.splice(index, 1);
  }

  const heroHp = squad.reduce((sum, hero) => sum + hero.hp, 0);
  const heroMaxHp = squad.reduce((sum, hero) => sum + hero.maxHp, 0);
  const enemyHp = enemies.reduce((sum, enemy) => sum + enemy.hp, 0);
  const enemyMaxHp = enemies.reduce((sum, enemy) => sum + enemy.maxHp, 0);

  heroHpBar.style.width = `${(heroHp / heroMaxHp) * 100}%`;
  enemyHpBar.style.width = `${enemyMaxHp ? (enemyHp / enemyMaxHp) * 100 : 0}%`;
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, world.height);
  sky.addColorStop(0, "#243342");
  sky.addColorStop(0.48, "#536c56");
  sky.addColorStop(1, "#2a2119");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = "rgba(255, 231, 161, 0.78)";
  pixelCircle(112, 88, 42, 5);

  drawMountain(-80, 412, 218, "#202b34");
  drawMountain(260, 432, 172, "#314334");
  drawMountain(650, 410, 248, "#273442");
  drawMountain(960, 448, 154, "#3d4d35");

  for (let i = 0; i < 24; i += 1) {
    const x = (i * 72 - ((world.time * 9) % 72)) - 60;
    drawPixelPine(x, 394 + (i % 5) * 9, 46 + (i % 4) * 9, 0.72);
  }

  drawRoad();
}

function drawRoad() {
  const road = ctx.createLinearGradient(0, world.horizon, 0, world.height);
  road.addColorStop(0, "#5a5239");
  road.addColorStop(0.56, "#756343");
  road.addColorStop(1, "#43352a");
  ctx.fillStyle = road;
  ctx.beginPath();
  ctx.moveTo(486, world.horizon);
  ctx.lineTo(782, world.horizon);
  ctx.lineTo(1370, world.height);
  ctx.lineTo(-108, world.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(239, 222, 151, 0.16)";
  for (const lane of lanes) {
    ctx.beginPath();
    ctx.ellipse(640 + lane.xOffset, lane.y + 10, 360 * lane.scale, 10 * lane.scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 42; i += 1) {
    const depth = i / 41;
    const y = world.horizon + depth * (world.height - world.horizon);
    const halfWidth = 148 + depth * 600;
    const x = 640 + Math.sin(i * 2.1) * 18;
    ctx.fillStyle = `rgba(31, 24, 18, ${0.11 + depth * 0.09})`;
    ctx.fillRect(x - halfWidth, y, halfWidth * 2, 2 + depth * 4);
  }
}

function drawMountain(x, baseY, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 90, baseY);
  ctx.lineTo(x + 180, baseY - height);
  ctx.lineTo(x + 470, baseY);
  ctx.closePath();
  ctx.fill();
}

function drawPixelPine(x, y, height, scale = 1) {
  const s = scale;
  ctx.fillStyle = "#2b241b";
  rectPx(x - 4 * s, y - height * 0.2, 8 * s, height * 0.28);
  ctx.fillStyle = "#21381f";
  trianglePx(x, y - height, x - height * 0.35, y - height * 0.12, x + height * 0.35, y - height * 0.12);
  ctx.fillStyle = "#31552a";
  trianglePx(x, y - height * 0.68, x - height * 0.42, y + 2, x + height * 0.42, y + 2);
}

function drawSceneObjects() {
  const actors = [
    ...squad.map((hero) => ({ kind: "hero", unit: hero, sortY: laneY(hero) })),
    ...enemies.map((enemy) => ({ kind: "enemy", unit: enemy, sortY: laneY(enemy) })),
    ...projectiles.map((shot) => ({ kind: "projectile", unit: shot, sortY: shot.y })),
    ...explosions.map((blast) => ({ kind: "explosion", unit: blast, sortY: blast.y })),
  ].sort((a, b) => a.sortY - b.sortY);

  for (const actor of actors) {
    if (actor.kind === "hero") drawPixelHero(actor.unit);
    if (actor.kind === "enemy") drawGrunt(actor.unit);
    if (actor.kind === "projectile") drawProjectile(actor.unit);
    if (actor.kind === "explosion") drawExplosion(actor.unit);
  }
}

function drawPixelHero(unit) {
  if (unit.role === "archer") {
    drawPixelArcher(unit);
    return;
  }

  const scale = laneScale(unit);
  const bob = Math.sin(world.time * 5 + unit.lane) * 2 * scale;
  const attackPush = unit.attackTimer > 0 ? Math.sin(unit.attackTimer * 24) * 7 * scale : 0;
  const walk = Math.sin(world.time * 9 + unit.lane);
  const x = unit.x - attackPush;
  const y = laneY(unit) + bob;
  const c = unit.colors;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(unit.facing * scale, scale);
  drawShadow(0, 7, 42, 10);

  ctx.fillStyle = "#211914";
  rectPx(-16, -42, 10, 36 + walk * 2);
  rectPx(10, -42, 10, 36 - walk * 2);

  ctx.fillStyle = c.robe;
  rectPx(-28, -98, 56, 58);
  ctx.fillStyle = c.trim;
  rectPx(-24, -92, 48, 8);
  rectPx(-6, -98, 12, 58);

  ctx.fillStyle = c.skin;
  rectPx(-22, -132, 44, 34);
  rectPx(-14, -140, 28, 10);
  ctx.fillStyle = c.hair;
  rectPx(-24, -148, 48, 16);
  rectPx(-28, -138, 12, 28);

  ctx.fillStyle = "#14120f";
  rectPx(7, -123, 5, 5);
  ctx.fillStyle = "#f7e3c0";
  rectPx(8, -124, 2, 2);

  ctx.fillStyle = c.skin;
  rectPx(-36, -88 + walk * 2, 12, 26);
  rectPx(28 + attackPush, -88, 12, 26);

  if (unit.role === "archer") {
    ctx.strokeStyle = c.weapon;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(43 + attackPush, -77, 20, -1.2, 1.2);
    ctx.stroke();
    ctx.fillStyle = c.magic;
    rectPx(40 + attackPush, -80, 28, 4);
  } else if (unit.role === "knight") {
    ctx.fillStyle = c.weapon;
    rectPx(40 + attackPush, -104, 8, 66);
    ctx.fillStyle = "#eef7f5";
    rectPx(45 + attackPush, -111, 10, 36);
  } else {
    ctx.fillStyle = c.weapon;
    rectPx(48 + attackPush, -118, 7, 84);
    ctx.fillStyle = c.magic;
    pixelCircle(52 + attackPush, -124, 13 + Math.sin(world.time * 8) * 2, 4);
  }

  if (unit.attackTimer > 0) {
    ctx.globalAlpha = clamp(unit.attackTimer / 0.34, 0, 1);
    ctx.fillStyle = c.magic;
    rectPx(58 + attackPush, -92, 20, 6);
    rectPx(66 + attackPush, -104, 10, 18);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawPixelArcher(unit) {
  const scale = laneScale(unit);
  const attackProgress = unit.attackTimer > 0 ? 1 - unit.attackTimer / 0.34 : 0;
  const attackFrame = unit.attackTimer > 0 ? Math.min(5, Math.floor(attackProgress * 6)) : -1;
  const framePose = [
    { lean: -2, arm: 0, pull: 0, bow: 0, arrow: 0 },
    { lean: -4, arm: -5, pull: 5, bow: -2, arrow: 0 },
    { lean: -5, arm: -10, pull: 14, bow: -4, arrow: 1 },
    { lean: -7, arm: -12, pull: 25, bow: -5, arrow: 1 },
    { lean: 5, arm: 4, pull: 0, bow: 4, arrow: 2 },
    { lean: 1, arm: 0, pull: 0, bow: 1, arrow: 0 },
  ][Math.max(attackFrame, 0)];
  const idle = Math.sin(world.time * 5 + unit.lane);
  const walk = Math.sin(world.time * 9 + unit.lane);
  const x = unit.x + (attackFrame >= 0 ? framePose.lean * scale : 0);
  const y = laneY(unit) + idle * 2 * scale;
  const c = unit.colors;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(unit.facing * scale, scale);
  drawShadow(0, 7, 42, 10);

  ctx.fillStyle = "#211914";
  rectPx(-18, -42, 10, 36 + walk * 2);
  rectPx(8, -42, 10, 36 - walk * 2);

  ctx.fillStyle = c.robe;
  rectPx(-30, -96, 58, 56);
  ctx.fillStyle = "#304a25";
  rectPx(-34, -103, 18, 50);
  ctx.fillStyle = c.trim;
  rectPx(-25, -91, 49, 8);
  rectPx(-5, -96, 11, 56);

  ctx.fillStyle = c.skin;
  rectPx(-22, -132, 44, 34);
  rectPx(-14, -140, 28, 10);
  ctx.fillStyle = c.hair;
  rectPx(-24, -145, 48, 18);
  rectPx(-29, -132, 13, 26);
  ctx.fillStyle = "#db8a28";
  rectPx(-32, -151, 22, 8);
  rectPx(-38, -145, 28, 7);

  ctx.fillStyle = "#14120f";
  rectPx(7, -123, 5, 5);
  ctx.fillStyle = "#f7e3c0";
  rectPx(8, -124, 2, 2);

  const frontHandX = 30 + (attackFrame >= 0 ? framePose.arm : 0);
  const rearHandX = -28 - (attackFrame >= 0 ? framePose.pull : 0);
  const bowX = 48 + (attackFrame >= 0 ? framePose.bow : 0);
  const bowY = -78;

  ctx.fillStyle = c.skin;
  rectPx(-39 - (attackFrame >= 0 ? framePose.pull * 0.5 : 0), -85, 13, 25);
  rectPx(frontHandX, -86, 13, 25);

  ctx.strokeStyle = c.weapon;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(bowX, bowY, 24, -1.25, 1.25);
  ctx.stroke();

  ctx.strokeStyle = "#1a1510";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bowX + 8, bowY - 22);
  ctx.lineTo(rearHandX, bowY);
  ctx.lineTo(bowX + 8, bowY + 22);
  ctx.stroke();

  if (attackFrame >= 0 && framePose.arrow > 0) {
    ctx.fillStyle = c.magic;
    rectPx(rearHandX + 3, bowY - 2, bowX - rearHandX + 31, 4);
    ctx.fillStyle = "#fff7c2";
    rectPx(bowX + 30, bowY - 4, 11 + framePose.arrow * 5, 8);
  }

  if (attackFrame === 4) {
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = c.magic;
    rectPx(70, -83, 36, 6);
    rectPx(102, -88, 14, 16);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawGrunt(unit) {
  const scale = laneScale(unit);
  const defeated = unit.hp <= 0;
  const walkFrame = Math.floor(world.time * 8 + unit.lane * 1.7) % 6;
  const walkPose = [
    { legA: -7, legB: 7, arm: -5, bob: 1 },
    { legA: -3, legB: 4, arm: -2, bob: -1 },
    { legA: 4, legB: -5, arm: 4, bob: 2 },
    { legA: 8, legB: -7, arm: 6, bob: 0 },
    { legA: 3, legB: -3, arm: 2, bob: -2 },
    { legA: -5, legB: 5, arm: -4, bob: 1 },
  ][walkFrame];
  const hurtProgress = unit.hurtTimer > 0 ? 1 - unit.hurtTimer / 0.24 : 0;
  const hurtFrame = unit.hurtTimer > 0 ? Math.min(2, Math.floor(hurtProgress * 3)) : -1;
  const deathProgress = defeated ? clamp(unit.defeatedTimer / 0.9, 0, 1) : 0;
  const hurt = unit.hurtTimer > 0 ? Math.sin(world.time * 70) * 7 : 0;
  const bob = defeated ? 0 : walkPose.bob;
  const fade = defeated ? clamp(1 - unit.defeatedTimer / 0.8, 0.25, 1) : 1;
  const c = unit.colors;

  ctx.save();
  ctx.translate(unit.x + hurt * scale - deathProgress * 18 * scale, laneY(unit) + bob * scale + deathProgress * 21 * scale);
  ctx.scale(unit.facing * scale, scale);
  ctx.globalAlpha = fade;
  if (defeated) ctx.rotate(deathProgress * 1.45);

  drawShadow(0, 7, 45, 11);
  ctx.fillStyle = "#251a17";
  rectPx(-16 + walkPose.legA, -39, 10, 34);
  rectPx(9 + walkPose.legB, -39, 10, 34);

  ctx.fillStyle = c.body;
  rectPx(-31, -92 + deathProgress * 3, 62, 56);
  ctx.fillStyle = c.belly;
  rectPx(-14, -80 + deathProgress * 3, 29, 35);
  ctx.fillStyle = c.armor;
  rectPx(-32, -95, 64, 12);
  rectPx(-24 - walkPose.arm * 0.3, -105, 14, 22);
  rectPx(10 + walkPose.arm * 0.3, -105, 14, 22);

  ctx.fillStyle = c.body;
  rectPx(-28, -138 - (hurtFrame === 0 ? 5 : 0), 56, 42);
  ctx.fillStyle = c.horn;
  rectPx(-42, -132, 16, 9);
  rectPx(26, -132, 16, 9);
  rectPx(-39, -141, 9, 9);
  rectPx(30, -141, 9, 9);

  ctx.fillStyle = "#16110f";
  rectPx(-12, -123, 6, 6);
  rectPx(12, -123, 6, 6);
  ctx.fillStyle = "#ffefe3";
  rectPx(-10, -121, 2, 2);
  rectPx(14, -121, 2, 2);

  ctx.fillStyle = c.weapon;
  rectPx(34 + walkPose.arm, -100 + walkPose.arm * 0.4, 7, 70);
  ctx.fillStyle = "#d9d0b0";
  rectPx(30 + walkPose.arm, -107 + walkPose.arm * 0.4, 16, 10);

  if (hurtFrame >= 0) {
    ctx.globalAlpha = hurtFrame === 0 ? 0.7 : 0.35;
    ctx.fillStyle = "#fff6c9";
    rectPx(-39, -146, 78, 111);
    ctx.globalAlpha = fade;
    ctx.fillStyle = "#ffd866";
    rectPx(-56, -125, 16, 8);
    rectPx(-61, -134, 8, 22);
    rectPx(-49, -115, 8, 8);
  }

  if (defeated && deathProgress > 0.55) {
    ctx.globalAlpha = (deathProgress - 0.55) * 1.4;
    ctx.fillStyle = "#e7d3ad";
    pixelCircle(-46, -38, 15, 5);
    pixelCircle(-58, -31, 9, 4);
    ctx.globalAlpha = fade;
  }

  drawHealthBar(0, -160, 66, 7, unit.hp / unit.maxHp);
  ctx.restore();
}

function drawProjectile(shot) {
  const scale = 0.8 + lanes[shot.lane].scale * 0.28;
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(shot.type === "arrow" ? Math.atan2(shot.vy, shot.vx) : shot.spin);
  ctx.scale(scale, scale);

  if (shot.type === "arrow") {
    ctx.fillStyle = "rgba(255, 210, 82, 0.22)";
    rectPx(-42, -5, 34, 10);
    ctx.fillStyle = "#fff4a8";
    rectPx(-24, -2, 54, 4);
    ctx.fillStyle = shot.color;
    rectPx(22, -6, 14, 12);
    ctx.fillStyle = "#d9832e";
    rectPx(-33, -8, 10, 5);
    rectPx(-33, 3, 10, 5);
    ctx.restore();
    return;
  }

  ctx.globalAlpha = 0.32;
  ctx.fillStyle = shot.color;
  pixelCircle(0, 0, 30, 5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff8bf";
  pixelCircle(0, 0, shot.radius, 4);
  ctx.fillStyle = shot.color;
  rectPx(-32, -5, 26, 10);
  rectPx(-20, -12, 12, 24);
  ctx.fillStyle = "#ffffff";
  rectPx(3, -4, 8, 8);
  ctx.restore();
}

function drawExplosion(blast) {
  const t = blast.age / blast.life;
  ctx.save();
  ctx.translate(blast.x, blast.y);
  ctx.globalAlpha = 1 - t;
  ctx.fillStyle = blast.color;
  pixelCircle(0, 0, 18 + t * 38, 6);
  ctx.fillStyle = "#fff2a8";
  pixelCircle(0, 0, 8 + t * 18, 5);
  for (const particle of blast.particles) {
    rectPx(particle.vx * blast.age, particle.vy * blast.age + 240 * blast.age * blast.age, particle.size, particle.size);
  }
  ctx.restore();
}

function drawFloatText() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "700 18px Inter, system-ui, sans-serif";
  for (const item of floatText) {
    ctx.globalAlpha = clamp(1 - item.age / item.life, 0, 1);
    ctx.fillStyle = "#fff0aa";
    ctx.strokeStyle = "#231916";
    ctx.lineWidth = 4;
    ctx.strokeText(item.text, item.x, item.y);
    ctx.fillText(item.text, item.x, item.y);
  }
  ctx.restore();
}

function drawHealthBar(x, y, width, height, ratio) {
  ctx.fillStyle = "rgba(17, 13, 11, 0.78)";
  rectPx(x - width / 2, y, width, height);
  ctx.fillStyle = "#d84c41";
  rectPx(x - width / 2 + 2, y + 2, (width - 4) * clamp(ratio, 0, 1), height - 4);
}

function drawShadow(x, y, width, height) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
}

function pixelCircle(x, y, radius, step) {
  const start = -radius;
  for (let py = start; py <= radius; py += step) {
    for (let px = start; px <= radius; px += step) {
      if (px * px + py * py <= radius * radius) {
        rectPx(x + px, y + py, step, step);
      }
    }
  }
}

function rectPx(x, y, width, height) {
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function trianglePx(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(Math.round(x1), Math.round(y1));
  ctx.lineTo(Math.round(x2), Math.round(y2));
  ctx.lineTo(Math.round(x3), Math.round(y3));
  ctx.closePath();
  ctx.fill();
}

function drawVictoryCard() {
  if (aliveEnemies().length > 0) return;
  ctx.fillStyle = "rgba(19, 21, 16, 0.7)";
  ctx.fillRect(470, 252, 340, 88);
  ctx.strokeStyle = "rgba(255, 234, 161, 0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(470, 252, 340, 88);
  ctx.fillStyle = "#fff1c7";
  ctx.font = "700 30px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Wave cleared", 640, 305);
  ctx.font = "700 15px Inter, system-ui, sans-serif";
  ctx.fillText("Resetting the test wave...", 640, 331);
}

function draw() {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, world.width, world.height);
  drawBackground();
  drawSceneObjects();
  drawFloatText();
  drawVictoryCard();
}

resetGame();

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
