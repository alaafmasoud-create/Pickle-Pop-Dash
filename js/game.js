const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const muteBtn = document.getElementById("muteBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const boostBtn = document.getElementById("boostBtn");

const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const levelValue = document.getElementById("levelValue");
const shieldValue = document.getElementById("shieldValue");

const STORAGE_KEY = "pickle-pop-dash-best-score";
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keys = { left: false, right: false, boost: false };
const pointerState = { left: false, right: false, boost: false };

let audioCtx = null;
let muted = false;
let running = false;
let paused = false;
let animationFrame = null;
let lastTime = 0;
let spawnTimer = 0;
let pickupTimer = 0;
let difficultyTimer = 0;
let flashTimer = 0;
let starfield = [];
let particles = [];
let hazards = [];
let pickups = [];
let score = 0;
let level = 1;
let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let gameTime = 0;
let screenShake = 0;

bestValue.textContent = bestScore;

const player = {
  x: WIDTH / 2,
  y: HEIGHT - 84,
  width: 52,
  height: 78,
  speed: 360,
  boostSpeed: 560,
  shield: 0,
  invulnerable: 0,
  trailHue: 105,
};

function createStarfield() {
  starfield = Array.from({ length: 70 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    r: Math.random() * 2 + 0.5,
    speed: Math.random() * 24 + 10,
    alpha: Math.random() * 0.65 + 0.2,
  }));
}

function resetGame() {
  score = 0;
  level = 1;
  gameTime = 0;
  spawnTimer = 0;
  pickupTimer = 1.8;
  difficultyTimer = 0;
  flashTimer = 0;
  screenShake = 0;
  hazards = [];
  pickups = [];
  particles = [];
  player.x = WIDTH / 2;
  player.shield = 0;
  player.invulnerable = 0;
  updateHud();
  createStarfield();
}

function updateHud() {
  scoreValue.textContent = Math.floor(score);
  bestValue.textContent = bestScore;
  levelValue.textContent = level;
  shieldValue.textContent = player.shield;
}

function showOverlay(title, text, showRestart = false) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.add("active");
  restartBtn.classList.toggle("hidden", !showRestart);
  startBtn.classList.toggle("hidden", showRestart);
}

function hideOverlay() {
  overlay.classList.remove("active");
}

function startGame() {
  resetGame();
  running = true;
  paused = false;
  pauseBtn.textContent = "Pause";
  hideOverlay();
  lastTime = performance.now();
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
  if (!paused) {
    hideOverlay();
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);
  } else {
    showOverlay("Paused", "Take a breath. Press Resume or Space to keep dashing.");
  }
}

function gameOver() {
  running = false;
  paused = false;
  pauseBtn.textContent = "Pause";
  if (score > bestScore) {
    bestScore = Math.floor(score);
    localStorage.setItem(STORAGE_KEY, String(bestScore));
  }
  updateHud();
  playSound(90, 0.16, "sawtooth", 0.05);
  playSound(55, 0.22, "triangle", 0.06, 0.06);
  showOverlay(
    "Game Over",
    `Nice run. You reached ${Math.floor(score)} points on level ${level}. Try again and beat ${bestScore}.`,
    true,
  );
}

function gameLoop(timestamp) {
  if (!running || paused) {
    return;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;

  update(dt);
  render();
  animationFrame = requestAnimationFrame(gameLoop);
}

function update(dt) {
  gameTime += dt;
  difficultyTimer += dt;
  spawnTimer += dt;
  pickupTimer += dt;
  if (flashTimer > 0) flashTimer -= dt;
  if (player.invulnerable > 0) player.invulnerable -= dt;
  if (screenShake > 0) screenShake -= dt * 8;

  if (difficultyTimer >= 9) {
    difficultyTimer = 0;
    level += 1;
    playSound(640, 0.09, "triangle", 0.05);
    spawnParticleBurst(player.x, player.y - 10, 18, "#91ff78");
  }

  const moveDirection = (keys.left || pointerState.left ? -1 : 0) + (keys.right || pointerState.right ? 1 : 0);
  const isBoosting = keys.boost || pointerState.boost;
  const speed = isBoosting ? player.boostSpeed : player.speed;
  player.x += moveDirection * speed * dt;
  player.x = clamp(player.x, player.width / 2 + 12, WIDTH - player.width / 2 - 12);

  updateStarfield(dt);

  const spawnEvery = Math.max(0.24, 0.86 - level * 0.05);
  if (spawnTimer >= spawnEvery) {
    spawnTimer = 0;
    spawnHazard();
  }

  const pickupEvery = clamp(6.4 - level * 0.12, 3.8, 6.4);
  if (pickupTimer >= pickupEvery) {
    pickupTimer = 0;
    spawnPickup();
  }

  hazards.forEach((hazard) => {
    hazard.y += hazard.speed * dt;
    hazard.rotation += hazard.spin * dt;
  });

  pickups.forEach((pickup) => {
    pickup.y += pickup.speed * dt;
    pickup.rotation += pickup.spin * dt;
  });

  particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.vy += p.gravity * dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
  });

  hazards = hazards.filter((hazard) => {
    if (hazard.y - hazard.radius > HEIGHT + 20) {
      score += 4;
      return false;
    }
    if (collides(player, hazard)) {
      return !handleHazardCollision(hazard);
    }
    return true;
  });

  pickups = pickups.filter((pickup) => {
    if (pickup.y - pickup.radius > HEIGHT + 20) {
      return false;
    }
    if (collides(player, pickup)) {
      if (pickup.kind === "star") {
        score += 25;
        playSound(760, 0.05, "triangle", 0.05);
        spawnParticleBurst(pickup.x, pickup.y, 12, "#ffe066");
      } else {
        player.shield = Math.min(player.shield + 1, 3);
        playSound(520, 0.08, "square", 0.05);
        spawnParticleBurst(pickup.x, pickup.y, 14, "#6cf4ff");
      }
      updateHud();
      return false;
    }
    return true;
  });

  particles = particles.filter((p) => p.life > 0);

  score += dt * (10 + level * 1.7);
  if (Math.floor(score) > bestScore) {
    bestScore = Math.floor(score);
    localStorage.setItem(STORAGE_KEY, String(bestScore));
  }
  updateHud();
}

function handleHazardCollision(hazard) {
  if (player.invulnerable > 0) {
    return true;
  }

  flashTimer = 0.2;
  screenShake = 1;
  spawnParticleBurst(hazard.x, hazard.y, 20, hazard.color);
  playSound(180, 0.08, "sawtooth", 0.06);

  if (player.shield > 0) {
    player.shield -= 1;
    player.invulnerable = 1.2;
    updateHud();
    return true;
  }

  gameOver();
  return true;
}

function spawnHazard() {
  const radius = random(16, 28);
  const types = [
    { label: "pepper", color: "#ff6b6b", speed: random(220, 320), spin: random(-2.2, 2.2) },
    { label: "jar", color: "#b39bff", speed: random(240, 340), spin: random(-1.7, 1.7) },
    { label: "ice", color: "#87e9ff", speed: random(250, 380), spin: random(-3.2, 3.2) },
  ];
  const type = types[Math.floor(Math.random() * types.length)];

  hazards.push({
    x: random(radius + 14, WIDTH - radius - 14),
    y: -radius - 24,
    radius,
    speed: type.speed + level * 15,
    spin: type.spin,
    rotation: 0,
    kind: type.label,
    color: type.color,
  });
}

function spawnPickup() {
  const isShield = Math.random() < 0.26;
  pickups.push({
    x: random(30, WIDTH - 30),
    y: -40,
    radius: isShield ? 18 : 16,
    speed: isShield ? random(150, 190) : random(180, 220),
    spin: random(-2.5, 2.5),
    rotation: 0,
    kind: isShield ? "shield" : "star",
  });
}

function collides(playerEntity, circleEntity) {
  const closestX = clamp(circleEntity.x, playerEntity.x - playerEntity.width / 2 + 8, playerEntity.x + playerEntity.width / 2 - 8);
  const closestY = clamp(circleEntity.y, playerEntity.y - playerEntity.height / 2 + 6, playerEntity.y + playerEntity.height / 2 - 6);
  const dx = circleEntity.x - closestX;
  const dy = circleEntity.y - closestY;
  return dx * dx + dy * dy < circleEntity.radius * circleEntity.radius;
}

function updateStarfield(dt) {
  starfield.forEach((star) => {
    star.y += star.speed * dt * (1 + level * 0.03);
    if (star.y > HEIGHT + 4) {
      star.y = -4;
      star.x = Math.random() * WIDTH;
    }
  });
}

function render() {
  ctx.save();
  const shakeX = (Math.random() - 0.5) * 8 * screenShake;
  const shakeY = (Math.random() - 0.5) * 8 * screenShake;
  ctx.translate(shakeX, shakeY);

  drawBackground();
  drawStarfield();
  drawLaneGlow();
  drawPickups();
  drawHazards();
  drawParticles();
  drawPlayer();
  drawBottomGlow();
  drawCanvasHud();

  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 125, 125, ${flashTimer * 1.6})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#091524");
  gradient.addColorStop(0.52, "#0d2032");
  gradient.addColorStop(1, "#08111f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(108, 244, 255, 0.08)";
  ctx.beginPath();
  ctx.ellipse(WIDTH * 0.2, 90, 180, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(145, 255, 120, 0.06)";
  ctx.beginPath();
  ctx.ellipse(WIDTH * 0.8, 130, 220, 80, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawStarfield() {
  starfield.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawLaneGlow() {
  const laneY = HEIGHT - 60;
  const glow = ctx.createLinearGradient(0, laneY - 20, 0, HEIGHT);
  glow.addColorStop(0, "rgba(108, 244, 255, 0)");
  glow.addColorStop(1, "rgba(108, 244, 255, 0.18)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, laneY - 20, WIDTH, 100);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, laneY);
  ctx.lineTo(WIDTH, laneY);
  ctx.stroke();
}

function drawPlayer() {
  const bob = Math.sin(gameTime * 7.5) * 2;
  const x = player.x;
  const y = player.y + bob;

  ctx.save();
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  ctx.shadowColor = "rgba(145, 255, 120, 0.35)";
  ctx.shadowBlur = 18;

  ctx.fillStyle = "#7ceb57";
  ctx.beginPath();
  ctx.roundRect(x - 20, y - 34, 40, 68, 22);
  ctx.fill();

  ctx.fillStyle = "#5dd744";
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 34, 18, 68, 16);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1f4d17";
  ctx.beginPath();
  ctx.arc(x - 8, y - 7, 3.5, 0, Math.PI * 2);
  ctx.arc(x + 8, y - 7, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1f4d17";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y + 6, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = "#d8ffd0";
  ctx.beginPath();
  ctx.arc(x - 8.5, y - 7.5, 1.2, 0, Math.PI * 2);
  ctx.arc(x + 7.5, y - 7.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#a1f7ff";
  ctx.beginPath();
  ctx.ellipse(x, y - 40, 7, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6cf4ff";
  ctx.beginPath();
  ctx.ellipse(x - 5, y - 46, 5, 8, -0.45, 0, Math.PI * 2);
  ctx.ellipse(x + 5, y - 46, 5, 8, 0.45, 0, Math.PI * 2);
  ctx.fill();

  if (player.shield > 0) {
    ctx.strokeStyle = `rgba(108, 244, 255, ${0.4 + 0.15 * Math.sin(gameTime * 8)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y - 2, 42 + Math.sin(gameTime * 10) * 1.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHazards() {
  hazards.forEach((hazard) => {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate(hazard.rotation);

    if (hazard.kind === "pepper") {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.moveTo(0, -hazard.radius);
      ctx.quadraticCurveTo(hazard.radius, -hazard.radius * 0.1, hazard.radius * 0.3, hazard.radius);
      ctx.quadraticCurveTo(0, hazard.radius * 0.8, -hazard.radius * 0.4, hazard.radius);
      ctx.quadraticCurveTo(-hazard.radius, -hazard.radius * 0.2, 0, -hazard.radius);
      ctx.fill();
      ctx.fillStyle = "#8bf669";
      ctx.fillRect(-3, -hazard.radius - 8, 6, 10);
    } else if (hazard.kind === "jar") {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.roundRect(-hazard.radius * 0.65, -hazard.radius, hazard.radius * 1.3, hazard.radius * 1.8, 8);
      ctx.fill();
      ctx.fillStyle = "#f0e7ff";
      ctx.fillRect(-hazard.radius * 0.32, -hazard.radius * 0.5, hazard.radius * 0.64, hazard.radius * 0.7);
      ctx.fillStyle = "#8be0ff";
      ctx.fillRect(-hazard.radius * 0.4, -hazard.radius - 8, hazard.radius * 0.8, 8);
    } else {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.roundRect(-hazard.radius * 0.7, -hazard.radius * 0.7, hazard.radius * 1.4, hazard.radius * 1.4, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hazard.radius * 0.3, -hazard.radius * 0.5);
      ctx.lineTo(hazard.radius * 0.45, hazard.radius * 0.25);
      ctx.moveTo(-hazard.radius * 0.5, 0);
      ctx.lineTo(0, hazard.radius * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawPickups() {
  pickups.forEach((pickup) => {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.rotate(pickup.rotation);

    if (pickup.kind === "star") {
      ctx.fillStyle = "#ffe066";
      drawStarShape(0, 0, pickup.radius * 0.55, pickup.radius, 5);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      drawStarShape(0, -1, pickup.radius * 0.22, pickup.radius * 0.55, 5);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#6cf4ff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(108, 244, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(0, 0, pickup.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawBottomGlow() {
  const gradient = ctx.createLinearGradient(0, HEIGHT - 120, 0, HEIGHT);
  gradient.addColorStop(0, "rgba(145, 255, 120, 0)");
  gradient.addColorStop(1, "rgba(145, 255, 120, 0.07)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, HEIGHT - 120, WIDTH, 120);
}

function drawCanvasHud() {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 20px Inter, system-ui, sans-serif";
  ctx.fillText(`Best ${bestScore}`, 24, 38);

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "500 14px Inter, system-ui, sans-serif";
  ctx.fillText("Dodge hazards • grab stars • survive longer", 24, 60);

  if (keys.boost || pointerState.boost) {
    ctx.fillStyle = "rgba(108, 244, 255, 0.95)";
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.fillText("BOOST", WIDTH - 94, 38);
  }
}

function drawStarShape(x, y, innerRadius, outerRadius, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const sx = x + Math.cos(angle) * radius;
    const sy = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
}

function spawnParticleBurst(x, y, amount, color) {
  for (let i = 0; i < amount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = random(60, 210);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      gravity: 60,
      size: random(2.5, 5.5),
      color,
      life: random(0.3, 0.7),
      maxLife: 0.7,
      alpha: 1,
    });
  }
}

function playSound(freq, duration, type = "sine", volume = 0.03, delay = 0) {
  if (muted) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const now = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch (error) {
    // Ignore audio errors silently to keep the game playable.
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function bindPointerButton(element, key) {
  const setState = (state) => {
    pointerState[key] = state;
  };

  ["pointerdown", "touchstart"].forEach((eventName) => {
    element.addEventListener(eventName, (event) => {
      event.preventDefault();
      setState(true);
    }, { passive: false });
  });

  ["pointerup", "pointerleave", "pointercancel", "touchend", "touchcancel"].forEach((eventName) => {
    element.addEventListener(eventName, (event) => {
      event.preventDefault();
      setState(false);
    }, { passive: false });
  });
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "Shift", "Space", "KeyP", "KeyM"].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === "ArrowLeft") keys.left = true;
  if (event.code === "ArrowRight") keys.right = true;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") keys.boost = true;
  if (event.code === "Space") {
    if (!running) startGame();
    else togglePause();
  }
  if (event.code === "KeyP") togglePause();
  if (event.code === "KeyM") toggleMute();
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") keys.left = false;
  if (event.code === "ArrowRight") keys.right = false;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") keys.boost = false;
});

canvas.addEventListener("pointermove", (event) => {
  if (window.innerWidth > 700 || !running || paused) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = WIDTH / rect.width;
  player.x = clamp((event.clientX - rect.left) * ratio, player.width / 2 + 12, WIDTH - player.width / 2 - 12);
});

function toggleMute() {
  muted = !muted;
  muteBtn.textContent = muted ? "Sound: Off" : "Sound: On";
  muteBtn.setAttribute("aria-pressed", String(muted));
}

startBtn.addEventListener("click", () => {
  playSound(440, 0.06, "square", 0.03);
  startGame();
});
restartBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", () => {
  playSound(370, 0.04, "triangle", 0.03);
  togglePause();
});
muteBtn.addEventListener("click", toggleMute);

bindPointerButton(leftBtn, "left");
bindPointerButton(rightBtn, "right");
bindPointerButton(boostBtn, "boost");

resetGame();
showOverlay("Ready to dash?", "Move the pickle, dodge the falling chaos, collect stars, and beat your best score.");
render();
