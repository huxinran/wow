const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const heroHpBar = document.getElementById("heroHp");
const enemyHpBar = document.getElementById("enemyHp");

const warriorWalk = new Image();
warriorWalk.src = "./assets/characters/hero-warrior-walk-6f.png";

const keys = new Set();
const projectiles = [];
const hitSparks = [];

const world = {
  width: canvas.width,
  height: canvas.height,
  floor: 585,
  time: 0,
};

const hero = {
  x: 300,
  y: world.floor,
  width: 78,
  height: 132,
  hp: 100,
  maxHp: 100,
  speed: 305,
  facing: 1,
  state: "idle",
  attackTimer: 0,
  cooldown: 0,
};

const enemy = {
  x: 1000,
  y: world.floor,
  width: 94,
  height: 146,
  hp: 100,
  maxHp: 100,
  speed: 80,
  facing: -1,
  state: "idle",
  hurtTimer: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetGame() {
  hero.x = 300;
  hero.hp = hero.maxHp;
  hero.facing = 1;
  hero.state = "idle";
  hero.attackTimer = 0;
  hero.cooldown = 0;
  enemy.x = 1000;
  enemy.hp = enemy.maxHp;
  enemy.state = "idle";
  enemy.hurtTimer = 0;
  projectiles.length = 0;
  hitSparks.length = 0;
}

function attack() {
  if (hero.cooldown > 0 || hero.hp <= 0 || enemy.hp <= 0) return;

  hero.state = "attack";
  hero.attackTimer = 0.34;
  hero.cooldown = 0.56;

  const handX = hero.x + hero.facing * 56;
  const handY = hero.y - 88;
  projectiles.push({
    x: handX,
    y: handY,
    vx: hero.facing * 620,
    radius: 14,
    spin: 0,
    life: 1.45,
    damage: 24,
  });
}

window.addEventListener("keydown", (event) => {
  if (["KeyA", "KeyD", "Space", "KeyR"].includes(event.code)) {
    event.preventDefault();
  }
  keys.add(event.code);
  if (event.code === "Space") attack();
  if (event.code === "KeyR") resetGame();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

function update(dt) {
  world.time += dt;
  hero.cooldown = Math.max(0, hero.cooldown - dt);
  hero.attackTimer = Math.max(0, hero.attackTimer - dt);
  enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);

  const direction = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
  if (direction !== 0 && hero.attackTimer <= 0) {
    hero.x += direction * hero.speed * dt;
    hero.facing = direction;
    hero.state = "run";
  } else if (hero.attackTimer <= 0) {
    hero.state = "idle";
  }
  hero.x = clamp(hero.x, 90, world.width - 90);

  if (enemy.hp > 0) {
    enemy.facing = enemy.x > hero.x ? -1 : 1;
    enemy.x += Math.sin(world.time * 1.7) * enemy.speed * dt;
    enemy.x = clamp(enemy.x, 780, 1130);
    enemy.state = enemy.hurtTimer > 0 ? "hurt" : "idle";
  } else {
    enemy.state = "defeated";
  }

  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const shot = projectiles[index];
    shot.x += shot.vx * dt;
    shot.spin += dt * 11;
    shot.life -= dt;

    const hit =
      enemy.hp > 0 &&
      shot.x > enemy.x - enemy.width * 0.48 &&
      shot.x < enemy.x + enemy.width * 0.48 &&
      shot.y > enemy.y - enemy.height &&
      shot.y < enemy.y - 20;

    if (hit) {
      enemy.hp = Math.max(0, enemy.hp - shot.damage);
      enemy.hurtTimer = 0.22;
      spawnHitSparks(shot.x, shot.y);
      projectiles.splice(index, 1);
    } else if (shot.life <= 0 || shot.x < -80 || shot.x > world.width + 80) {
      projectiles.splice(index, 1);
    }
  }

  for (let index = hitSparks.length - 1; index >= 0; index -= 1) {
    const spark = hitSparks[index];
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vy += 520 * dt;
    spark.life -= dt;
    if (spark.life <= 0) hitSparks.splice(index, 1);
  }

  heroHpBar.style.width = `${(hero.hp / hero.maxHp) * 100}%`;
  enemyHpBar.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
}

function spawnHitSparks(x, y) {
  for (let i = 0; i < 14; i += 1) {
    const angle = (Math.PI * 2 * i) / 14;
    const speed = 115 + Math.random() * 150;
    hitSparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      life: 0.24 + Math.random() * 0.18,
    });
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, world.floor);
  sky.addColorStop(0, "#29333a");
  sky.addColorStop(0.45, "#394835");
  sky.addColorStop(1, "#75613e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = "rgba(255, 229, 156, 0.78)";
  ctx.beginPath();
  ctx.arc(110, 92, 42, 0, Math.PI * 2);
  ctx.fill();

  drawMountain(0, 420, 235, "#242d2f");
  drawMountain(260, 442, 185, "#2d3a32");
  drawMountain(650, 420, 255, "#273235");
  drawMountain(930, 455, 160, "#334032");

  for (let i = 0; i < 18; i += 1) {
    const x = (i * 97 + (world.time * 18) % 97) - 97;
    drawPine(x, 445 + Math.sin(i) * 12, 70 + (i % 4) * 18);
  }

  ctx.fillStyle = "#554636";
  ctx.fillRect(0, world.floor, world.width, world.height - world.floor);
  ctx.fillStyle = "#7c7341";
  ctx.fillRect(0, world.floor, world.width, 16);

  for (let x = -40; x < world.width + 40; x += 90) {
    ctx.fillStyle = "rgba(241, 219, 139, 0.17)";
    ctx.fillRect(x + Math.sin(world.time + x) * 8, world.floor + 29, 48, 5);
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

function drawPine(x, y, height) {
  ctx.fillStyle = "#29301f";
  ctx.fillRect(x - 5, y - height * 0.22, 10, height * 0.32);
  ctx.fillStyle = "#223821";
  ctx.beginPath();
  ctx.moveTo(x, y - height);
  ctx.lineTo(x - height * 0.36, y - height * 0.15);
  ctx.lineTo(x + height * 0.36, y - height * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#31512a";
  ctx.beginPath();
  ctx.moveTo(x, y - height * 0.72);
  ctx.lineTo(x - height * 0.43, y + 2);
  ctx.lineTo(x + height * 0.43, y + 2);
  ctx.closePath();
  ctx.fill();
}

function drawCharacter(unit, palette) {
  const bob = Math.sin(world.time * (unit.state === "run" ? 14 : 5)) * 4;
  const stride = Math.sin(world.time * 14);
  const recoil = unit.state === "attack" ? Math.sin(unit.attackTimer * 22) * 12 : 0;
  const hurtShift = unit.state === "hurt" ? Math.sin(world.time * 70) * 5 : 0;

  ctx.save();
  ctx.translate(unit.x + hurtShift, unit.y + bob);
  ctx.scale(unit.facing, 1);

  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.strokeStyle = palette.boots;
  ctx.beginPath();
  ctx.moveTo(-20, -48);
  ctx.lineTo(-34 - stride * 7, -7);
  ctx.moveTo(19, -48);
  ctx.lineTo(33 + stride * 7, -7);
  ctx.stroke();

  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 6, 48, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.robe;
  roundedRect(-38, -112, 76, 76, 18);
  ctx.fill();
  ctx.fillStyle = palette.trim;
  roundedRect(-30, -101, 60, 16, 7);
  ctx.fill();

  ctx.strokeStyle = palette.arm;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(-31, -83);
  ctx.lineTo(-55, -61 + stride * 4);
  ctx.moveTo(29, -84);
  ctx.lineTo(58 + recoil, -78);
  ctx.stroke();

  ctx.fillStyle = palette.skin;
  ctx.beginPath();
  ctx.arc(0, -137, 29, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.hair;
  ctx.beginPath();
  ctx.arc(0, -148, 31, Math.PI, 0);
  ctx.lineTo(31, -134);
  ctx.lineTo(-31, -134);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#10110f";
  ctx.beginPath();
  ctx.arc(10, -137, 3, 0, Math.PI * 2);
  ctx.fill();

  if (palette.staff) {
    ctx.strokeStyle = palette.staff;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(66 + recoil, -115);
    ctx.lineTo(52 + recoil, -28);
    ctx.stroke();
    ctx.fillStyle = palette.orb;
    ctx.beginPath();
    ctx.arc(67 + recoil, -121, 13 + Math.sin(world.time * 8) * 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = palette.orb;
    roundedRect(45 + recoil, -93, 39, 16, 6);
    ctx.fill();
  }

  if (unit.state === "defeated") {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#151515";
    ctx.fillRect(-48, -158, 96, 164);
  }

  ctx.restore();
}

function drawHero(unit) {
  if (!warriorWalk.complete || warriorWalk.naturalWidth === 0) {
    drawCharacter(unit, {
      robe: "#315d8f",
      trim: "#d6b45f",
      arm: "#3c6fa7",
      boots: "#2a211d",
      skin: "#e5b687",
      hair: "#ece5ce",
      staff: "#6f5434",
      orb: "#60ead0",
      shadow: "rgba(0, 0, 0, 0.28)",
    });
    return;
  }

  const frameCount = 6;
  const frameWidth = warriorWalk.naturalWidth / frameCount;
  const sourceY = 120;
  const sourceHeight = 470;
  const walkFrame = Math.floor(world.time * 12) % frameCount;
  const frame = unit.state === "run" ? walkFrame : 1;
  const bob = unit.state === "run" ? Math.sin(world.time * 14) * 3 : Math.sin(world.time * 5) * 2;
  const recoil = unit.state === "attack" ? Math.sin(unit.attackTimer * 22) * 10 : 0;
  const drawWidth = 196;
  const drawHeight = 254;

  ctx.save();
  ctx.translate(unit.x - recoil * unit.facing, unit.y + bob);
  ctx.scale(unit.facing, 1);
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 7, 48, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(
    warriorWalk,
    frame * frameWidth,
    sourceY,
    frameWidth,
    sourceHeight,
    -drawWidth * 0.48,
    -drawHeight,
    drawWidth,
    drawHeight,
  );
  ctx.restore();
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawProjectile(shot) {
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(shot.spin);

  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
  glow.addColorStop(0, "rgba(255, 246, 181, 0.96)");
  glow.addColorStop(0.42, "rgba(83, 222, 189, 0.68)");
  glow.addColorStop(1, "rgba(56, 165, 219, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff4ae";
  ctx.beginPath();
  ctx.arc(0, 0, shot.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#43d7bd";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-21, 0);
  ctx.lineTo(21, 0);
  ctx.moveTo(0, -21);
  ctx.lineTo(0, 21);
  ctx.stroke();
  ctx.restore();
}

function drawSparks() {
  for (const spark of hitSparks) {
    ctx.globalAlpha = clamp(spark.life / 0.32, 0, 1);
    ctx.fillStyle = "#ffd267";
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function draw() {
  drawBackground();
  drawHero(hero);
  drawCharacter(enemy, {
    robe: enemy.hp > 0 ? "#7a312a" : "#3c3431",
    trim: "#e07842",
    arm: "#8e3b30",
    boots: "#251a18",
    skin: "#9cbd78",
    hair: "#2b211d",
    orb: "#e54f3e",
    shadow: "rgba(0, 0, 0, 0.3)",
  });

  for (const shot of projectiles) drawProjectile(shot);
  drawSparks();

  if (enemy.hp <= 0) {
    ctx.fillStyle = "rgba(19, 21, 16, 0.66)";
    roundedRect(467, 260, 346, 86, 8);
    ctx.fill();
    ctx.fillStyle = "#fff1c7";
    ctx.font = "700 32px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Enemy defeated", 640, 312);
    ctx.font = "700 16px Inter, system-ui, sans-serif";
    ctx.fillText("Press R to reset", 640, 342);
  }
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
