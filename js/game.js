const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTag = document.getElementById("overlayTag");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayPrimaryBtn = document.getElementById("overlayPrimaryBtn");
const overlaySecondaryBtn = document.getElementById("overlaySecondaryBtn");
const bannerLayer = document.getElementById("bannerLayer");
const audioHint = document.getElementById("audioHint");

const pauseBtn = document.getElementById("pauseBtn");
const restartBtnTop = document.getElementById("restartBtnTop");
const modeBtn = document.getElementById("modeBtn");
const skinBtn = document.getElementById("skinBtn");
const helpBtn = document.getElementById("helpBtn");
const challengeBtn = document.getElementById("challengeBtn");
const achievementBtn = document.getElementById("achievementBtn");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const musicBtn = document.getElementById("musicBtn");
const muteBtn = document.getElementById("muteBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const infoBtn = document.getElementById("infoBtn");
const infoDrawer = document.getElementById("infoDrawer");
const closeInfoBtn = document.getElementById("closeInfoBtn");

const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const stageValue = document.getElementById("stageValue");
const worldValue = document.getElementById("worldValue");
const shieldValue = document.getElementById("shieldValue");
const powerValue = document.getElementById("powerValue");
const sublineText = document.getElementById("sublineText");
const runSummary = document.getElementById("runSummary");
const skinPerkText = document.getElementById("skinPerkText");
const challengeMiniList = document.getElementById("challengeMiniList");

const modalRoot = document.getElementById("modalRoot");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalEyebrow = document.getElementById("modalEyebrow");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const boostBtn = document.getElementById("boostBtn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const STORAGE_PREFIX = "pickle-pop-dash-dx";
const BEST_KEY = `${STORAGE_PREFIX}-best-score`;
const META_KEY = `${STORAGE_PREFIX}-meta`;
const LEADERBOARD_KEY = `${STORAGE_PREFIX}-leaderboard`;
const MUSIC_KEY = `${STORAGE_PREFIX}-music-enabled`;
const SOUND_KEY = `${STORAGE_PREFIX}-sound-enabled`;
const MODE_KEY = `${STORAGE_PREFIX}-mode`;
const SKIN_KEY = `${STORAGE_PREFIX}-skin`;

const pointerState = { left: false, right: false, boost: false };
const keys = { left: false, right: false, boost: false };
const musicPrimedEvents = ["pointerdown", "keydown", "touchstart", "click"];

let animationFrame = null;
let lastTime = 0;
let audioCtx = null;
let masterGain = null;
let sfxBus = null;
let musicBus = null;
let noiseBuffer = null;
let musicTimer = null;
let nextMusicTime = 0;
let musicStep = 0;
let currentMusicTheme = 0;
let musicEnabled = localStorage.getItem(MUSIC_KEY) !== "off";
let sfxEnabled = localStorage.getItem(SOUND_KEY) !== "off";
let audioUnlocked = false;
let triedInitialFullscreen = false;

const MODES = [
  {
    id: "classic",
    label: "Classic",
    spawnBonus: 0,
    scoreMult: 1,
    pickupBoost: 1,
    summary: "Balanced pacing with steady difficulty growth.",
  },
  {
    id: "arcade",
    label: "Arcade",
    spawnBonus: 0.08,
    scoreMult: 1.18,
    pickupBoost: 1.12,
    summary: "Faster waves, bigger scores, still fair.",
  },
  {
    id: "chaos",
    label: "Chaos",
    spawnBonus: 0.16,
    scoreMult: 1.34,
    pickupBoost: 1.2,
    summary: "Wild hazard mixes and intense boss pressure.",
  },
];

const SKINS = [
  {
    id: "classic",
    label: "Classic",
    body: ["#7ceb57", "#55cc44"],
    outline: "#163b12",
    blush: "#e6ffd9",
    sprout: ["#9af7ff", "#63efff"],
    perk: "Balanced and forgiving. Great for every mode.",
    startShield: 0,
    hitboxScale: 1,
    boostSpeed: 0,
    magnetBonus: 0,
    slowBonus: 0,
    doubleBonus: 0,
  },
  {
    id: "hero",
    label: "Hero",
    body: ["#8cff6d", "#5ac643"],
    outline: "#183910",
    blush: "#f4ffe8",
    sprout: ["#ffe28b", "#ffbb28"],
    mask: true,
    perk: "Starts every run with 1 shield and gets a tiny defense edge.",
    startShield: 1,
    hitboxScale: 0.98,
    boostSpeed: 20,
    magnetBonus: 0,
    slowBonus: 0,
    doubleBonus: 0,
  },
  {
    id: "ninja",
    label: "Ninja",
    body: ["#83f76c", "#49b83c"],
    outline: "#102d10",
    blush: "#e6ffe0",
    sprout: ["#d7c0ff", "#8d63ff"],
    bandana: true,
    perk: "Smaller hitbox and the fastest dash in the whole crew.",
    startShield: 0,
    hitboxScale: 0.86,
    boostSpeed: 85,
    magnetBonus: 0,
    slowBonus: 0,
    doubleBonus: 0,
  },
  {
    id: "ice",
    label: "Ice",
    body: ["#8ff8ff", "#5ed4f1"],
    outline: "#10475b",
    blush: "#ffffff",
    sprout: ["#d0fdff", "#8ff1ff"],
    frost: true,
    perk: "Slow-motion powers last longer, making boss waves calmer.",
    startShield: 0,
    hitboxScale: 1,
    boostSpeed: 10,
    magnetBonus: 0,
    slowBonus: 2.5,
    doubleBonus: 0,
  },
  {
    id: "fire",
    label: "Fire",
    body: ["#ff9e62", "#ff5d36"],
    outline: "#5a1a0f",
    blush: "#fff0df",
    sprout: ["#ffd885", "#ff9f1a"],
    flame: true,
    perk: "Double-score powers burn brighter and last longer.",
    startShield: 0,
    hitboxScale: 1,
    boostSpeed: 15,
    magnetBonus: 0,
    slowBonus: 0,
    doubleBonus: 3,
  },
  {
    id: "robot",
    label: "Robot",
    body: ["#90e5ff", "#59a7ff"],
    outline: "#173564",
    blush: "#f1faff",
    sprout: ["#b5f0ff", "#83d8ff"],
    visor: true,
    perk: "Magnet powers pull stars from farther away than usual.",
    startShield: 0,
    hitboxScale: 0.96,
    boostSpeed: 12,
    magnetBonus: 95,
    slowBonus: 0,
    doubleBonus: 0,
  },
];

const WORLDS = [
  {
    id: "cosmic-garden",
    name: "Cosmic Garden",
    colors: ["#091524", "#0d2138", "#08101f"],
    accent: "#74eeff",
    accent2: "#9dff78",
    hazardColors: ["#ff8d6f", "#a98fff", "#87efff"],
    pickupGlow: "#ffe27a",
    summary: "Soft stars, mellow lanes, and clean visibility.",
    musicTheme: 0,
  },
  {
    id: "forest-run",
    name: "Forest Run",
    colors: ["#071b13", "#123021", "#08160f"],
    accent: "#76ff8d",
    accent2: "#d1ff7a",
    hazardColors: ["#d57d48", "#ffcf6b", "#8dc46a"],
    pickupGlow: "#fff0a7",
    summary: "Greener lights, softer tones, and leafy boss tricks.",
    musicTheme: 1,
  },
  {
    id: "neon-city",
    name: "Neon City",
    colors: ["#130a29", "#241252", "#0a0816"],
    accent: "#ff73df",
    accent2: "#73dfff",
    hazardColors: ["#ff73df", "#73dfff", "#ffe470"],
    pickupGlow: "#ffdaff",
    summary: "Color-pop danger, bright trails, and quicker enemies.",
    musicTheme: 2,
  },
  {
    id: "ice-cavern",
    name: "Ice Cavern",
    colors: ["#0d1d2f", "#163453", "#09111c"],
    accent: "#8cf3ff",
    accent2: "#dffbff",
    hazardColors: ["#84cfff", "#d0f3ff", "#8be9ff"],
    pickupGlow: "#ffffff",
    summary: "Sharper crystals, smoother glows, and elegant motion.",
    musicTheme: 3,
  },
  {
    id: "volcano-arc",
    name: "Volcano Arc",
    colors: ["#26110c", "#4b1d13", "#130907"],
    accent: "#ff9b63",
    accent2: "#ffd26a",
    hazardColors: ["#ff6b4d", "#ffb347", "#ffe27a"],
    pickupGlow: "#ffd98a",
    summary: "Hotter stages, extra drama, and serious boss vibes.",
    musicTheme: 4,
  },
  {
    id: "aqua-bay",
    name: "Aqua Bay",
    colors: ["#071b29", "#0f3c54", "#08111d"],
    accent: "#74f0ff",
    accent2: "#72ffd0",
    hazardColors: ["#7bd6ff", "#72ffd0", "#b5f8ff"],
    pickupGlow: "#d9ffff",
    summary: "Calm blue energy with slippery-feeling attack patterns.",
    musicTheme: 5,
  },
];

const MUSIC_THEMES = [
  {
    tempo: 108,
    progression: [[60, 64, 67], [62, 65, 69], [57, 60, 64], [65, 69, 72]],
    bass: [36, null, 36, null, 38, null, 38, null, 33, null, 33, null, 41, null, 41, null],
    lead: [72, null, 74, null, 76, 74, 72, null, 74, null, 76, null, 79, 76, 74, null],
    counter: [67, null, 69, null, 71, null, 69, null, 64, null, 65, null, 69, null, 67, null],
    padType: "sine",
    leadType: "triangle",
    accentType: "triangle",
    kickRoot: 34,
  },
  {
    tempo: 98,
    progression: [[55, 59, 62], [57, 60, 64], [60, 64, 67], [62, 65, 69]],
    bass: [31, null, 31, null, 33, null, 33, null, 36, null, 36, null, 38, null, 38, null],
    lead: [67, null, 69, null, 71, null, 72, null, 74, null, 72, null, 71, null, 69, null],
    counter: [62, null, 64, null, 65, null, 67, null, 69, null, 67, null, 65, null, 64, null],
    padType: "triangle",
    leadType: "sine",
    accentType: "triangle",
    kickRoot: 29,
  },
  {
    tempo: 118,
    progression: [[62, 65, 69], [64, 67, 71], [60, 64, 67], [67, 71, 74]],
    bass: [38, null, 38, 45, 40, null, 40, 47, 36, null, 36, 43, 43, null, 43, 50],
    lead: [74, null, 76, 79, 81, 79, 76, null, 79, null, 81, 83, 81, 79, 76, null],
    counter: [69, null, 71, null, 72, null, 74, null, 67, null, 69, null, 71, null, 72, null],
    padType: "sine",
    leadType: "triangle",
    accentType: "square",
    kickRoot: 36,
  },
  {
    tempo: 92,
    progression: [[53, 57, 60], [55, 59, 62], [57, 60, 64], [50, 53, 57]],
    bass: [29, null, 29, null, 31, null, 31, null, 33, null, 33, null, 26, null, 26, null],
    lead: [65, null, 67, null, 69, null, 70, null, 72, null, 70, null, 69, null, 67, null],
    counter: [60, null, 62, null, 64, null, 65, null, 67, null, 65, null, 64, null, 62, null],
    padType: "sine",
    leadType: "triangle",
    accentType: "triangle",
    kickRoot: 28,
  },
  {
    tempo: 122,
    progression: [[57, 60, 64], [59, 62, 66], [60, 64, 67], [64, 67, 71]],
    bass: [33, null, 33, 40, 35, null, 35, 42, 36, null, 36, 43, 40, null, 40, 47],
    lead: [69, 71, null, 74, 76, null, 74, 71, 72, null, 74, 76, 79, 76, 74, null],
    counter: [64, null, 66, null, 67, null, 69, null, 67, null, 69, null, 71, null, 72, null],
    padType: "triangle",
    leadType: "square",
    accentType: "triangle",
    kickRoot: 31,
  },
  {
    tempo: 100,
    progression: [[60, 64, 67], [59, 62, 67], [55, 59, 62], [62, 65, 69]],
    bass: [36, null, 36, null, 35, null, 35, null, 31, null, 31, null, 38, null, 38, null],
    lead: [72, null, 74, 76, 74, null, 72, null, 71, null, 69, null, 74, 76, 77, null],
    counter: [67, null, 69, null, 67, null, 65, null, 64, null, 62, null, 69, null, 71, null],
    padType: "sine",
    leadType: "triangle",
    accentType: "triangle",
    kickRoot: 32,
  },
  {
    tempo: 128,
    progression: [[60, 63, 67], [62, 65, 69], [57, 60, 64], [64, 67, 71]],
    bass: [36, null, 36, 43, 38, null, 38, 45, 33, null, 33, 40, 40, null, 40, 47],
    lead: [72, 75, 77, 79, 77, 75, 74, 72, 75, null, 79, 81, 79, 77, 75, null],
    counter: [63, null, 65, null, 67, null, 69, null, 60, null, 62, null, 67, null, 69, null],
    padType: "square",
    leadType: "triangle",
    accentType: "square",
    kickRoot: 35,
  },
];

const ACHIEVEMENTS = [
  { id: "first_run", title: "First Run", desc: "Start your first run.", check: (meta) => meta.totalRuns >= 1 },
  { id: "star_hunter", title: "Star Hunter", desc: "Collect 50 stars across all runs.", check: (meta) => meta.totalStars >= 50 },
  { id: "survivor", title: "Survivor", desc: "Last 90 seconds in a single run.", check: (meta) => meta.bestRunTime >= 90 },
  { id: "boss_breaker", title: "Boss Breaker", desc: "Defeat your first boss.", check: (meta) => meta.totalBosses >= 1 },
  { id: "speed_pickle", title: "Speed Pickle", desc: "Use boost 60 times in total.", check: (meta) => meta.totalBoosts >= 60 },
  { id: "world_traveler", title: "World Traveler", desc: "Reach World 3 or beyond.", check: (meta) => meta.highestWorld >= 3 },
  { id: "chaos_ready", title: "Chaos Ready", desc: "Play one run in Chaos mode.", check: (meta) => meta.modesPlayed.includes("chaos") },
  { id: "stage_master", title: "Stage Master", desc: "Reach Stage 12 in a single run.", check: (meta) => meta.highestStage >= 12 },
];

const DEFAULT_META = {
  totalRuns: 0,
  totalStars: 0,
  totalBosses: 0,
  totalBoosts: 0,
  bestRunTime: 0,
  highestStage: 1,
  highestWorld: 1,
  modesPlayed: [],
  achievements: {},
  daily: { date: "", progress: {} },
};

const state = {
  running: true,
  paused: false,
  gameOver: false,
  awaitingResume: false,
  score: 0,
  bestScore: Number(localStorage.getItem(BEST_KEY) || 0),
  stage: 1,
  worldIndex: 0,
  stageInWorld: 1,
  stageTimer: 0,
  totalTime: 0,
  scoreTimer: 0,
  spawnTimer: 0,
  pickupTimer: 0,
  bossTimer: 0,
  worldCycle: 0,
  isBossStage: false,
  hazards: [],
  pickups: [],
  particles: [],
  starfield: [],
  bossesDefeatedThisRun: 0,
  starsThisRun: 0,
  cleanStagesThisRun: 0,
  boostsThisRun: 0,
  playerTookHitThisStage: false,
  playerTookHitThisRun: false,
  stageGoal: 18,
  stageTransition: 0,
  boss: null,
  activeMode: localStorage.getItem(MODE_KEY) || MODES[0].id,
  activeSkin: localStorage.getItem(SKIN_KEY) || SKINS[0].id,
  overlayAction: "resume",
  bannerQueue: [],
  meta: loadMeta(),
  leaderboard: loadLeaderboard(),
  slowTimer: 0,
  magnetTimer: 0,
  doubleTimer: 0,
  screenShake: 0,
  flashTimer: 0,
  trailTimer: 0,
};

const player = {
  x: WIDTH / 2,
  y: HEIGHT - 92,
  width: 54,
  height: 82,
  speed: 450,
  boostSpeed: 690,
  shield: 0,
  invuln: 0,
  boostLatch: false,
};

function loadMeta() {
  try {
    const parsed = JSON.parse(localStorage.getItem(META_KEY) || "null");
    return { ...DEFAULT_META, ...(parsed || {}) };
  } catch (error) {
    return { ...DEFAULT_META };
  }
}

function saveMeta() {
  localStorage.setItem(META_KEY, JSON.stringify(state.meta));
}

function loadLeaderboard() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLeaderboard() {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(state.leaderboard.slice(0, 10)));
}

function getMode() {
  return MODES.find((mode) => mode.id === state.activeMode) || MODES[0];
}

function getSkin() {
  return SKINS.find((skin) => skin.id === state.activeSkin) || SKINS[0];
}

function getWorld() {
  return WORLDS[state.worldIndex % WORLDS.length];
}

function getStageLabel() {
  return `${getWorld().name} • Stage ${state.stageInWorld}`;
}

function setMode(modeId) {
  state.activeMode = modeId;
  localStorage.setItem(MODE_KEY, modeId);
  modeBtn.textContent = `Mode: ${getMode().label}`;
  refreshRunSummary();
}

function cycleMode() {
  const index = MODES.findIndex((mode) => mode.id === state.activeMode);
  const next = MODES[(index + 1) % MODES.length];
  setMode(next.id);
  pushBanner(`Mode changed to ${next.label}`, next.summary);
  safePlaySound(540, 0.05, "triangle", 0.03);
  restartRun();
}

function setSkin(skinId) {
  state.activeSkin = skinId;
  localStorage.setItem(SKIN_KEY, skinId);
  skinBtn.textContent = `Skin: ${getSkin().label}`;
  skinPerkText.textContent = getSkin().perk;
}

function cycleSkin() {
  const index = SKINS.findIndex((skin) => skin.id === state.activeSkin);
  const next = SKINS[(index + 1) % SKINS.length];
  setSkin(next.id);
  safePlaySound(620, 0.05, "triangle", 0.03);
  if (!state.gameOver) {
    applySkinStats();
    refreshRunSummary();
  }
}

function applySkinStats() {
  const skin = getSkin();
  player.width = 54 * skin.hitboxScale;
  player.height = 82 * skin.hitboxScale;
}

function createStarfield() {
  state.starfield = Array.from({ length: 110 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    r: Math.random() * 2.2 + 0.4,
    speed: Math.random() * 28 + 10,
    alpha: Math.random() * 0.6 + 0.2,
  }));
}

function seededRandom(seed) {
  let current = seed % 2147483647;
  if (current <= 0) current += 2147483646;
  return () => {
    current = (current * 16807) % 2147483647;
    return (current - 1) / 2147483646;
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dailyChallengePool() {
  return [
    { id: "stars", label: "Collect stars", metric: "stars", target: 18 },
    { id: "survive", label: "Survive total seconds", metric: "survive", target: 70 },
    { id: "stages", label: "Clear stages", metric: "stages", target: 4 },
    { id: "bosses", label: "Defeat bosses", metric: "bosses", target: 1 },
    { id: "cleanStages", label: "Finish a stage without damage", metric: "cleanStages", target: 1 },
    { id: "boosts", label: "Use boost", metric: "boosts", target: 24 },
  ];
}

function getDailyChallenges() {
  const day = todayKey();
  const numericSeed = Number(day.replace(/-/g, ""));
  const rand = seededRandom(numericSeed);
  const pool = [...dailyChallengePool()];
  const picked = [];
  while (picked.length < 3 && pool.length) {
    const index = Math.floor(rand() * pool.length);
    const challenge = pool.splice(index, 1)[0];
    const tweak = 1 + Math.floor(rand() * 3);
    const target = challenge.metric === "survive"
      ? challenge.target + tweak * 10
      : challenge.metric === "boosts"
        ? challenge.target + tweak * 4
        : challenge.metric === "stars"
          ? challenge.target + tweak * 4
          : challenge.target;
    picked.push({ ...challenge, target, day });
  }
  return picked;
}

function ensureDailyProgress() {
  const day = todayKey();
  if (state.meta.daily.date !== day) {
    state.meta.daily = { date: day, progress: {} };
    saveMeta();
  }
}

function dailyProgressFor(metric) {
  ensureDailyProgress();
  return Number(state.meta.daily.progress[metric] || 0);
}

function addDailyProgress(metric, amount = 1) {
  ensureDailyProgress();
  state.meta.daily.progress[metric] = dailyProgressFor(metric) + amount;
  saveMeta();
  renderChallengesMiniList();
}

function setOverlay({ tag, title, text, primaryLabel, primaryAction, secondaryLabel = "Restart" }) {
  overlayTag.textContent = tag;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayPrimaryBtn.textContent = primaryLabel;
  overlaySecondaryBtn.textContent = secondaryLabel;
  state.overlayAction = primaryAction;
  overlay.hidden = false;
}

function hideOverlay() {
  overlay.hidden = true;
}

function openModal(title, content, eyebrow = "Pickle Pop Dash DX") {
  modalTitle.textContent = title;
  modalEyebrow.textContent = eyebrow;
  modalBody.innerHTML = content;
  modalRoot.classList.add("open");
  modalRoot.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  modalRoot.classList.remove("open");
  modalRoot.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function pushBanner(title, subtitle = "") {
  const banner = document.createElement("div");
  banner.className = "stage-banner";
  banner.innerHTML = `${escapeHtml(title)}${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}`;
  bannerLayer.appendChild(banner);
  window.setTimeout(() => banner.remove(), 3000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function refreshRunSummary() {
  const mode = getMode();
  const world = getWorld();
  runSummary.textContent = `${mode.summary} ${world.summary}`;
  sublineText.textContent = `${mode.label} mode • ${world.name} • Stage ${state.stage}`;
}

function updateHud() {
  scoreValue.textContent = Math.floor(state.score);
  bestValue.textContent = state.bestScore;
  stageValue.textContent = state.stage;
  worldValue.textContent = state.worldIndex + 1;
  shieldValue.textContent = player.shield;
  const powerLabels = [];
  if (state.magnetTimer > 0) powerLabels.push(`Magnet ${state.magnetTimer.toFixed(1)}s`);
  if (state.slowTimer > 0) powerLabels.push(`Slow ${state.slowTimer.toFixed(1)}s`);
  if (state.doubleTimer > 0) powerLabels.push(`2x Score ${state.doubleTimer.toFixed(1)}s`);
  powerValue.textContent = powerLabels.length ? powerLabels.join(" • ") : "Ready";
  refreshRunSummary();
}

function restartRun() {
  cancelAnimationFrame(animationFrame);
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.awaitingResume = false;
  state.score = 0;
  state.stage = 1;
  state.worldIndex = 0;
  state.stageInWorld = 1;
  state.stageTimer = 0;
  state.totalTime = 0;
  state.spawnTimer = 0;
  state.pickupTimer = 2.2;
  state.bossTimer = 0;
  state.worldCycle = 0;
  state.hazards = [];
  state.pickups = [];
  state.particles = [];
  state.boss = null;
  state.bossesDefeatedThisRun = 0;
  state.starsThisRun = 0;
  state.cleanStagesThisRun = 0;
  state.boostsThisRun = 0;
  state.playerTookHitThisStage = false;
  state.playerTookHitThisRun = false;
  state.stageGoal = getStageGoal(1, 0);
  state.isBossStage = false;
  state.slowTimer = 0;
  state.magnetTimer = 0;
  state.doubleTimer = 0;
  state.screenShake = 0;
  state.flashTimer = 0;
  state.meta.totalRuns += 1;
  if (!state.meta.modesPlayed.includes(state.activeMode)) {
    state.meta.modesPlayed.push(state.activeMode);
  }
  saveMeta();
  checkAchievements();
  player.x = WIDTH / 2;
  player.y = HEIGHT - 92;
  player.invuln = 0;
  player.boostLatch = false;
  player.shield = getSkin().startShield;
  applySkinStats();
  createStarfield();
  beginStage(1, true);
  hideOverlay();
  updateHud();
  lastTime = performance.now();
  animationFrame = requestAnimationFrame(gameLoop);
}

function getStageGoal(stage, worldIndex) {
  return 18 + worldIndex * 2 + Math.min(8, stage * 0.6);
}

function beginStage(stageNumber, initial = false) {
  state.stage = stageNumber;
  state.worldIndex = Math.floor((stageNumber - 1) / 4) % WORLDS.length;
  state.worldCycle = Math.floor((stageNumber - 1) / (WORLDS.length * 4));
  state.stageInWorld = ((stageNumber - 1) % 4) + 1;
  state.isBossStage = state.stageInWorld === 4;
  state.stageTimer = 0;
  state.spawnTimer = 0;
  state.pickupTimer = 2.4;
  state.bossTimer = 0;
  state.hazards = [];
  state.pickups = [];
  state.particles = [];
  state.playerTookHitThisStage = false;
  state.stageGoal = getStageGoal(stageNumber, state.worldIndex) + state.worldCycle * 1.2;
  state.boss = state.isBossStage ? createBoss() : null;
  state.meta.highestStage = Math.max(state.meta.highestStage, stageNumber);
  state.meta.highestWorld = Math.max(state.meta.highestWorld, state.worldIndex + 1);
  saveMeta();
  checkAchievements();
  currentMusicTheme = state.isBossStage ? 6 : getWorld().musicTheme;
  musicStep = 0;
  if (musicEnabled && audioUnlocked) restartMusicScheduler();
  const world = getWorld();
  const title = state.isBossStage
    ? `${world.name} Boss Stage`
    : `${world.name} • Stage ${state.stageInWorld}`;
  const subtitle = state.isBossStage
    ? "Collect energy stars, break the boss core, and stay alive."
    : initial
      ? `Welcome to ${world.name}.`
      : "New stage unlocked.";
  pushBanner(title, subtitle);
  updateHud();
}

function createBoss() {
  const world = getWorld();
  const baseHp = 7 + state.worldIndex + state.worldCycle * 2 + (state.activeMode === "chaos" ? 2 : state.activeMode === "arcade" ? 1 : 0);
  return {
    x: WIDTH / 2,
    y: 118,
    radius: 82,
    hp: baseHp,
    maxHp: baseHp,
    shootTimer: 0.4,
    sweepTimer: 1.9,
    energyTimer: 1.4,
    phase: Math.random() * Math.PI * 2,
    tint: world.accent,
    tint2: world.accent2,
    defeated: false,
    deathTimer: 0.9,
  };
}

function advanceStage() {
  if (!state.playerTookHitThisStage) {
    state.cleanStagesThisRun += 1;
    addDailyProgress("cleanStages", 1);
  }
  addDailyProgress("stages", 1);
  state.score += 180 * getMode().scoreMult;
  beginStage(state.stage + 1);
}

function bossDefeated() {
  if (!state.boss || state.boss.defeated) return;
  state.boss.defeated = true;
  state.bossesDefeatedThisRun += 1;
  state.meta.totalBosses += 1;
  saveMeta();
  addDailyProgress("bosses", 1);
  checkAchievements();
  pushBanner("Boss broken!", "The next stage is opening up.");
  spawnParticleBurst(state.boss.x, state.boss.y, 38, getWorld().accent2, 180);
  safePlaySound(220, 0.14, "sawtooth", 0.08);
}

function gameOver() {
  state.running = false;
  state.gameOver = true;
  state.paused = false;
  if (state.score > state.bestScore) {
    state.bestScore = Math.floor(state.score);
    localStorage.setItem(BEST_KEY, String(state.bestScore));
  }
  state.meta.bestRunTime = Math.max(state.meta.bestRunTime, state.totalTime);
  saveMeta();
  recordLeaderboardEntry();
  checkAchievements();
  updateHud();
  setOverlay({
    tag: "Run finished",
    title: "Game Over",
    text: `You reached ${Math.floor(state.score)} points, cleared ${state.stage - (state.isBossStage && state.boss && !state.boss.defeated ? 1 : 0)} stages, and defeated ${state.bossesDefeatedThisRun} boss${state.bossesDefeatedThisRun === 1 ? "" : "es"}.`,
    primaryLabel: "Play Again",
    primaryAction: "restart",
    secondaryLabel: "Leaderboard",
  });
}

function recordLeaderboardEntry() {
  const entry = {
    score: Math.floor(state.score),
    stage: state.stage,
    world: state.worldIndex + 1,
    mode: getMode().label,
    skin: getSkin().label,
    date: new Date().toLocaleDateString(),
  };
  state.leaderboard.push(entry);
  state.leaderboard.sort((a, b) => b.score - a.score || b.stage - a.stage);
  state.leaderboard = state.leaderboard.slice(0, 10);
  saveLeaderboard();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;
  if (!state.paused && !state.gameOver) {
    update(dt);
  }
  render();
  animationFrame = requestAnimationFrame(gameLoop);
}

function update(dt) {
  const slowFactor = state.slowTimer > 0 ? 0.66 : 1;
  const mode = getMode();
  const skin = getSkin();
  state.totalTime += dt;
  state.stageTimer += dt;
  state.spawnTimer += dt;
  state.pickupTimer += dt;
  state.bossTimer += dt;
  state.flashTimer = Math.max(0, state.flashTimer - dt);
  state.screenShake = Math.max(0, state.screenShake - dt * 6);
  player.invuln = Math.max(0, player.invuln - dt);
  state.magnetTimer = Math.max(0, state.magnetTimer - dt);
  state.slowTimer = Math.max(0, state.slowTimer - dt);
  state.doubleTimer = Math.max(0, state.doubleTimer - dt);

  const moving = (keys.left || pointerState.left ? -1 : 0) + (keys.right || pointerState.right ? 1 : 0);
  const boosting = keys.boost || pointerState.boost;
  const speed = boosting ? player.boostSpeed + skin.boostSpeed : player.speed;
  player.x += moving * speed * dt;
  player.x = clamp(player.x, player.width / 2 + 14, WIDTH - player.width / 2 - 14);

  if (boosting && !player.boostLatch) {
    player.boostLatch = true;
    state.meta.totalBoosts += 1;
    state.boostsThisRun += 1;
    addDailyProgress("boosts", 1);
    saveMeta();
    checkAchievements();
  }
  if (!boosting) player.boostLatch = false;

  updateStarfield(dt, slowFactor);

  if (state.isBossStage) {
    updateBoss(dt, slowFactor);
  } else {
    spawnRegularHazards(mode);
    if (state.stageTimer >= state.stageGoal) {
      advanceStage();
      return;
    }
  }

  spawnRegularPickups(mode);

  updateHazards(dt, slowFactor);
  updatePickups(dt, slowFactor);
  updateParticles(dt);

  state.score += dt * (10 + state.stage * 1.8) * mode.scoreMult * (state.doubleTimer > 0 ? 2 : 1) * (skin.id === "fire" ? 1.05 : 1);
  if (Math.floor(state.score) > state.bestScore) {
    state.bestScore = Math.floor(state.score);
    localStorage.setItem(BEST_KEY, String(state.bestScore));
  }

  state.meta.bestRunTime = Math.max(state.meta.bestRunTime, state.totalTime);
  saveMeta();
  addDailyProgress("survive", dt);
  updateHud();
}

function spawnRegularHazards(mode) {
  const baseInterval = clamp(0.9 - state.stage * 0.024 - state.worldCycle * 0.025 - mode.spawnBonus, 0.22, 0.95);
  if (state.spawnTimer >= baseInterval) {
    state.spawnTimer = 0;
    const repeats = mode.id === "chaos" && Math.random() < 0.26 ? 2 : 1;
    for (let i = 0; i < repeats; i += 1) {
      spawnHazard();
    }
  }
}

function spawnRegularPickups(mode) {
  const baseInterval = clamp(5.2 - state.stage * 0.06, 3.2, 5.2) / mode.pickupBoost;
  if (state.pickupTimer >= baseInterval) {
    state.pickupTimer = 0;
    spawnPickup();
  }
}

function availableHazardTypes() {
  const types = ["rock", "spike"];
  if (state.stage >= 2) types.push("zigzag");
  if (state.stage >= 4) types.push("chaser");
  if (state.stage >= 5) types.push("splitter");
  if (state.activeMode === "chaos" || state.stage >= 8) types.push("comet");
  return types;
}

function spawnHazard(fromBoss = false, typeOverride = null, xOverride = null) {
  const world = getWorld();
  const types = availableHazardTypes();
  const type = typeOverride || types[Math.floor(Math.random() * types.length)];
  const radius = type === "splitter" ? random(20, 28) : type === "comet" ? random(18, 24) : random(16, 26);
  const hazard = {
    type,
    x: xOverride ?? random(radius + 16, WIDTH - radius - 16),
    y: fromBoss ? state.boss.y + state.boss.radius * 0.55 : -radius - 24,
    radius,
    speed: random(210, 340) + state.stage * 14 + state.worldCycle * 18,
    vx: random(-110, 110),
    spin: random(-3, 3),
    rotation: 0,
    color: world.hazardColors[Math.floor(Math.random() * world.hazardColors.length)],
    seed: Math.random() * Math.PI * 2,
    amplitude: random(40, 110),
    turn: random(150, 220),
    split: false,
    fromBoss,
    dead: false,
  };
  if (type === "spike") hazard.speed += 70;
  if (type === "comet") hazard.vx = random(-140, 140);
  state.hazards.push(hazard);
}

function spawnPickup(kindOverride = null, xOverride = null, yOverride = null) {
  const world = getWorld();
  const roll = Math.random();
  let kind = kindOverride;
  if (!kind) {
    if (roll < 0.44) kind = "star";
    else if (roll < 0.58) kind = "shield";
    else if (roll < 0.68) kind = "doubleShield";
    else if (roll < 0.79) kind = "magnet";
    else if (roll < 0.89) kind = "slow";
    else kind = "double";
  }
  state.pickups.push({
    kind,
    x: xOverride ?? random(32, WIDTH - 32),
    y: yOverride ?? -42,
    radius: kind === "energy" ? 18 : kind === "doubleShield" ? 20 : 16,
    speed: kind === "energy" ? 210 : random(150, 220),
    rotation: 0,
    spin: random(-2.6, 2.6),
    color: kind === "star" ? world.pickupGlow : world.accent2,
  });
}

function updateHazards(dt, slowFactor) {
  const effectiveDt = dt * slowFactor;
  const nextHazards = [];
  for (const hazard of state.hazards) {
    if (hazard.dead) continue;
    hazard.rotation += hazard.spin * dt;
    if (hazard.type === "rock" || hazard.type === "spike") {
      hazard.y += hazard.speed * effectiveDt;
    } else if (hazard.type === "zigzag") {
      hazard.y += hazard.speed * effectiveDt;
      hazard.x += Math.sin(state.totalTime * 5 + hazard.seed) * hazard.amplitude * dt * 0.55;
    } else if (hazard.type === "chaser") {
      hazard.y += hazard.speed * effectiveDt;
      hazard.x += clamp(player.x - hazard.x, -1, 1) * hazard.turn * dt;
    } else if (hazard.type === "splitter") {
      hazard.y += hazard.speed * effectiveDt;
      if (!hazard.split && hazard.y > HEIGHT * 0.32) {
        hazard.split = true;
        hazard.dead = true;
        spawnSplitChildren(hazard);
        continue;
      }
    } else if (hazard.type === "shard") {
      hazard.y += hazard.speed * effectiveDt;
      hazard.x += hazard.vx * dt;
    } else if (hazard.type === "comet") {
      hazard.y += hazard.speed * effectiveDt;
      hazard.x += hazard.vx * dt;
      if (hazard.x < hazard.radius || hazard.x > WIDTH - hazard.radius) hazard.vx *= -1;
    }

    if (hazard.y - hazard.radius > HEIGHT + 40) {
      state.score += 4 * getMode().scoreMult;
      continue;
    }

    if (circleRectCollision(hazard)) {
      if (handleHazardCollision(hazard)) {
        continue;
      }
    }

    nextHazards.push(hazard);
  }
  state.hazards = nextHazards;
}

function spawnSplitChildren(parent) {
  [ -1, 1 ].forEach((dir) => {
    state.hazards.push({
      type: "shard",
      x: parent.x,
      y: parent.y,
      radius: Math.max(12, parent.radius * 0.58),
      speed: parent.speed * 0.88,
      vx: dir * random(140, 200),
      spin: dir * random(2, 5),
      rotation: 0,
      color: parent.color,
      seed: Math.random(),
      amplitude: 0,
      turn: 0,
      split: true,
      fromBoss: parent.fromBoss,
      dead: false,
    });
  });
  spawnParticleBurst(parent.x, parent.y, 12, parent.color, 80);
  safePlaySound(240, 0.04, "square", 0.03);
}

function updateBoss(dt, slowFactor) {
  if (!state.boss) return;
  const boss = state.boss;
  if (boss.defeated) {
    boss.deathTimer -= dt;
    if (boss.deathTimer <= 0) {
      state.boss = null;
      advanceStage();
    }
    return;
  }

  boss.phase += dt;
  boss.x = WIDTH / 2 + Math.sin(state.totalTime * 0.8 + boss.phase * 0.2) * (WIDTH * 0.28);
  boss.shootTimer -= dt;
  boss.sweepTimer -= dt;
  boss.energyTimer -= dt;

  if (boss.shootTimer <= 0) {
    boss.shootTimer = clamp(0.66 - state.worldCycle * 0.03 - (state.activeMode === "chaos" ? 0.12 : 0), 0.34, 0.66);
    spawnHazard(true, Math.random() < 0.55 ? "spike" : "rock", boss.x + random(-28, 28));
  }

  if (boss.sweepTimer <= 0) {
    boss.sweepTimer = 2.2;
    const total = state.activeMode === "chaos" ? 6 : 5;
    for (let i = 0; i < total; i += 1) {
      const offset = ((i / (total - 1)) - 0.5) * 240;
      spawnHazard(true, i % 2 === 0 ? "zigzag" : "comet", boss.x + offset);
    }
    spawnParticleBurst(boss.x, boss.y + 12, 20, boss.tint, 100);
    safePlaySound(180, 0.06, "sawtooth", 0.05);
  }

  if (boss.energyTimer <= 0) {
    boss.energyTimer = random(1.35, 2.15);
    spawnPickup("energy", boss.x + random(-110, 110), boss.y + 18);
  }

  if (state.stageTimer > 28 + state.worldCycle * 3) {
    boss.energyTimer = Math.min(boss.energyTimer, 0.5);
  }

  if (boss.hp <= 0) {
    bossDefeated();
  }
}

function updatePickups(dt, slowFactor) {
  const nextPickups = [];
  const magnetRadius = state.magnetTimer > 0 ? 160 + getSkin().magnetBonus : 0;
  for (const pickup of state.pickups) {
    pickup.rotation += pickup.spin * dt;
    pickup.y += pickup.speed * dt * (pickup.kind === "energy" ? 1 : slowFactor);

    if (magnetRadius > 0 && ["star", "energy"].includes(pickup.kind)) {
      const dx = player.x - pickup.x;
      const dy = player.y - pickup.y;
      const distance = Math.hypot(dx, dy);
      if (distance < magnetRadius) {
        pickup.x += (dx / Math.max(distance, 1)) * 380 * dt;
        pickup.y += (dy / Math.max(distance, 1)) * 380 * dt;
      }
    }

    if (pickup.y - pickup.radius > HEIGHT + 20) continue;
    if (circleRectCollision(pickup)) {
      collectPickup(pickup);
      continue;
    }
    nextPickups.push(pickup);
  }
  state.pickups = nextPickups;
}

function collectPickup(pickup) {
  const skin = getSkin();
  if (pickup.kind === "star") {
    const gained = 24 * (state.doubleTimer > 0 ? 2 : 1) * (skin.id === "fire" ? 1.08 : 1);
    state.score += gained;
    state.starsThisRun += 1;
    state.meta.totalStars += 1;
    addDailyProgress("stars", 1);
    saveMeta();
    checkAchievements();
    spawnParticleBurst(pickup.x, pickup.y, 12, "#ffe27a", 70);
    safePlaySound(760, 0.05, "triangle", 0.05);
  } else if (pickup.kind === "shield") {
    player.shield = Math.min(player.shield + 1, 5);
    spawnParticleBurst(pickup.x, pickup.y, 14, "#7be8ff", 75);
    safePlaySound(520, 0.08, "square", 0.05);
  } else if (pickup.kind === "doubleShield") {
    player.shield = Math.min(player.shield + 2, 5);
    spawnParticleBurst(pickup.x, pickup.y, 18, "#9cf6ff", 90);
    safePlaySound(560, 0.08, "triangle", 0.05);
  } else if (pickup.kind === "magnet") {
    state.magnetTimer = Math.max(state.magnetTimer, 9 + state.worldCycle + (skin.magnetBonus > 0 ? 1.2 : 0));
    spawnParticleBurst(pickup.x, pickup.y, 16, "#87faff", 80);
    safePlaySound(630, 0.06, "sine", 0.04);
  } else if (pickup.kind === "slow") {
    state.slowTimer = Math.max(state.slowTimer, 6.8 + skin.slowBonus);
    spawnParticleBurst(pickup.x, pickup.y, 16, "#d6fbff", 85);
    safePlaySound(410, 0.08, "triangle", 0.04);
  } else if (pickup.kind === "double") {
    state.doubleTimer = Math.max(state.doubleTimer, 8.2 + skin.doubleBonus);
    spawnParticleBurst(pickup.x, pickup.y, 16, "#ffd786", 85);
    safePlaySound(680, 0.06, "square", 0.04);
  } else if (pickup.kind === "energy") {
    if (state.boss && !state.boss.defeated) {
      state.boss.hp -= 1;
      state.score += 70 * getMode().scoreMult;
      spawnParticleBurst(state.boss.x, state.boss.y, 14, getWorld().accent2, 90);
      spawnParticleBurst(pickup.x, pickup.y, 16, getWorld().accent, 70);
      safePlaySound(700, 0.08, "triangle", 0.05);
      if (state.boss.hp <= 0) bossDefeated();
    }
  }
  updateHud();
}

function handleHazardCollision(hazard) {
  if (player.invuln > 0) {
    spawnParticleBurst(hazard.x, hazard.y, 8, hazard.color, 50);
    return true;
  }

  state.flashTimer = 0.22;
  state.screenShake = 1.2;
  state.playerTookHitThisStage = true;
  state.playerTookHitThisRun = true;
  spawnParticleBurst(hazard.x, hazard.y, 20, hazard.color, 120);
  safePlaySound(190, 0.08, "sawtooth", 0.06);

  if (player.shield > 0) {
    player.shield -= 1;
    player.invuln = 1.1;
    updateHud();
    return true;
  }

  gameOver();
  return true;
}

function updateParticles(dt) {
  state.particles = state.particles.filter((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += particle.gravity * dt;
    particle.life -= dt;
    return particle.life > 0;
  });
}

function updateStarfield(dt, slowFactor) {
  state.starfield.forEach((star) => {
    star.y += star.speed * dt * (1 + state.worldIndex * 0.03) * slowFactor;
    if (star.y > HEIGHT + 4) {
      star.y = -4;
      star.x = Math.random() * WIDTH;
    }
  });
}

function spawnParticleBurst(x, y, count, color, speed = 100) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = random(speed * 0.3, speed);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * magnitude,
      vy: Math.sin(angle) * magnitude - 20,
      gravity: 120,
      color,
      life: random(0.35, 0.9),
      maxLife: 0.9,
      radius: random(1.6, 4.2),
    });
  }
}

function circleRectCollision(circle) {
  const halfW = (player.width / 2) * getSkin().hitboxScale;
  const halfH = (player.height / 2) * getSkin().hitboxScale;
  const closestX = clamp(circle.x, player.x - halfW + 8, player.x + halfW - 8);
  const closestY = clamp(circle.y, player.y - halfH + 6, player.y + halfH - 6);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function render() {
  ctx.save();
  const shakeX = (Math.random() - 0.5) * 8 * state.screenShake;
  const shakeY = (Math.random() - 0.5) * 8 * state.screenShake;
  ctx.translate(shakeX, shakeY);
  drawBackground();
  drawStarfield();
  drawWorldDecor();
  drawPickups();
  drawHazards();
  drawBoss();
  drawParticles();
  drawPlayer();
  drawBottomGlow();
  drawTopHud();
  if (state.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,120,120,${state.flashTimer * 1.8})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

function drawBackground() {
  const world = getWorld();
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, world.colors[0]);
  gradient.addColorStop(0.55, world.colors[1]);
  gradient.addColorStop(1, world.colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = `${world.accent}14`;
  ctx.beginPath();
  ctx.ellipse(WIDTH * 0.21, 118, 180, 74, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `${world.accent2}14`;
  ctx.beginPath();
  ctx.ellipse(WIDTH * 0.79, 148, 240, 92, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorldDecor() {
  const world = getWorld();
  const laneY = HEIGHT - 64;
  const laneGlow = ctx.createLinearGradient(0, laneY - 26, 0, HEIGHT);
  laneGlow.addColorStop(0, "rgba(255,255,255,0)");
  laneGlow.addColorStop(1, `${world.accent}28`);
  ctx.fillStyle = laneGlow;
  ctx.fillRect(0, laneY - 26, WIDTH, 110);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, laneY);
  ctx.lineTo(WIDTH, laneY);
  ctx.stroke();

  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = `${world.accent2}10`;
    ctx.beginPath();
    ctx.arc((i + 0.5) * WIDTH / 6, HEIGHT - 20, 70 + i * 4, Math.PI, Math.PI * 2);
    ctx.fill();
  }
}

function drawStarfield() {
  state.starfield.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const skin = getSkin();
  const bob = Math.sin(state.totalTime * 8) * 2.4;
  const boosting = keys.boost || pointerState.boost;
  const squash = boosting ? 0.92 : 1;
  const stretch = boosting ? 1.08 : 1;
  const x = player.x;
  const y = player.y + bob;

  if (boosting) {
    for (let i = 0; i < 5; i += 1) {
      const alpha = 0.12 - i * 0.02;
      if (alpha <= 0) continue;
      ctx.fillStyle = `rgba(157,255,120,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(x - 16 - i * 16, y + i * 2, 18 - i * 2.1, 26 - i * 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(squash, stretch);
  if (player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0) ctx.globalAlpha = 0.55;

  const bodyGradient = ctx.createLinearGradient(-20, -36, 20, 36);
  bodyGradient.addColorStop(0, skin.body[0]);
  bodyGradient.addColorStop(1, skin.body[1]);
  ctx.fillStyle = bodyGradient;
  ctx.shadowColor = `${getWorld().accent}55`;
  ctx.shadowBlur = skin.id === "neon" ? 24 : 18;
  ctx.beginPath();
  ctx.roundRect(-22, -36, 44, 72, 24);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = `${skin.body[1]}bb`;
  ctx.beginPath();
  ctx.roundRect(-8, -36, 16, 72, 16);
  ctx.fill();

  if (skin.mask) {
    ctx.fillStyle = "#ff5050";
    ctx.beginPath();
    ctx.roundRect(-24, -15, 48, 12, 8);
    ctx.fill();
  }
  if (skin.bandana) {
    ctx.fillStyle = "#4f2ed9";
    ctx.beginPath();
    ctx.roundRect(-24, -16, 48, 12, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, -11);
    ctx.lineTo(31, -6);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();
  }
  if (skin.visor) {
    ctx.fillStyle = "rgba(10, 31, 61, 0.92)";
    ctx.beginPath();
    ctx.roundRect(-20, -18, 40, 16, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(137, 236, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(14, -10);
    ctx.stroke();
  }
  if (skin.frost) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(-12 + i * 8, -26 - Math.sin(state.totalTime * 3 + i) * 2, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (skin.flame) {
    ctx.fillStyle = "rgba(255, 182, 94, 0.75)";
    ctx.beginPath();
    ctx.ellipse(0, -44, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = skin.outline;
  ctx.beginPath();
  ctx.arc(-8, -8, 3.5, 0, Math.PI * 2);
  ctx.arc(8, -8, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 6, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = skin.blush;
  ctx.beginPath();
  ctx.arc(-8.4, -8.6, 1.2, 0, Math.PI * 2);
  ctx.arc(7.4, -8.6, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.sprout[0];
  ctx.beginPath();
  ctx.ellipse(0, -42, 7, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin.sprout[1];
  ctx.beginPath();
  ctx.ellipse(-5, -48, 5, 8, -0.45, 0, Math.PI * 2);
  ctx.ellipse(5, -48, 5, 8, 0.45, 0, Math.PI * 2);
  ctx.fill();

  if (player.shield > 0) {
    ctx.strokeStyle = `rgba(116, 238, 255, ${0.42 + 0.18 * Math.sin(state.totalTime * 9)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -2, 44 + Math.sin(state.totalTime * 11) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHazards() {
  state.hazards.forEach((hazard) => {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate(hazard.rotation);
    if (hazard.type === "rock") {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(-hazard.radius * 0.2, -hazard.radius * 0.2, hazard.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (hazard.type === "spike") {
      ctx.fillStyle = hazard.color;
      drawSpikeBall(0, 0, hazard.radius);
    } else if (hazard.type === "zigzag") {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.roundRect(-hazard.radius * 0.8, -hazard.radius * 0.6, hazard.radius * 1.6, hazard.radius * 1.2, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hazard.radius * 0.55, 0);
      ctx.lineTo(-hazard.radius * 0.1, -hazard.radius * 0.32);
      ctx.lineTo(hazard.radius * 0.1, hazard.radius * 0.18);
      ctx.lineTo(hazard.radius * 0.55, -hazard.radius * 0.18);
      ctx.stroke();
    } else if (hazard.type === "chaser") {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.moveTo(0, -hazard.radius);
      ctx.quadraticCurveTo(hazard.radius * 1.05, -hazard.radius * 0.1, hazard.radius * 0.42, hazard.radius);
      ctx.quadraticCurveTo(0, hazard.radius * 0.75, -hazard.radius * 0.45, hazard.radius);
      ctx.quadraticCurveTo(-hazard.radius, -hazard.radius * 0.16, 0, -hazard.radius);
      ctx.fill();
    } else if (hazard.type === "splitter") {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.roundRect(-hazard.radius * 0.75, -hazard.radius * 0.75, hazard.radius * 1.5, hazard.radius * 1.5, 12);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.fillRect(-3, -hazard.radius * 0.75, 6, hazard.radius * 1.5);
    } else if (hazard.type === "shard") {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.moveTo(0, -hazard.radius);
      ctx.lineTo(hazard.radius * 0.7, hazard.radius);
      ctx.lineTo(-hazard.radius * 0.7, hazard.radius);
      ctx.closePath();
      ctx.fill();
    } else if (hazard.type === "comet") {
      ctx.fillStyle = hazard.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, hazard.radius, hazard.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `${hazard.color}99`;
      ctx.beginPath();
      ctx.moveTo(-hazard.radius * 1.6, 0);
      ctx.lineTo(-hazard.radius * 0.1, -hazard.radius * 0.45);
      ctx.lineTo(-hazard.radius * 0.1, hazard.radius * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawSpikeBall(x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const outerX = x + Math.cos(angle) * (radius + 10);
    const outerY = y + Math.sin(angle) * (radius + 10);
    const midAngle = angle + Math.PI / 8;
    const innerX = x + Math.cos(midAngle) * radius;
    const innerY = y + Math.sin(midAngle) * radius;
    if (i === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPickups() {
  state.pickups.forEach((pickup) => {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.rotate(pickup.rotation);
    if (pickup.kind === "star" || pickup.kind === "energy") {
      drawStar(pickup.radius, pickup.kind === "energy" ? getWorld().accent : "#ffe27a");
    } else if (pickup.kind === "shield" || pickup.kind === "doubleShield") {
      drawShieldPickup(pickup.radius, pickup.kind === "doubleShield" ? "#b8fbff" : "#7be8ff");
    } else if (pickup.kind === "magnet") {
      drawMagnetPickup(pickup.radius);
    } else if (pickup.kind === "slow") {
      drawSlowPickup(pickup.radius);
    } else if (pickup.kind === "double") {
      drawDoublePickup(pickup.radius);
    }
    ctx.restore();
  });
}

function drawStar(size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI / 5) * i;
    const radius = i % 2 === 0 ? size : size * 0.44;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawShieldPickup(size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.8, -size * 0.35);
  ctx.lineTo(size * 0.62, size * 0.72);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.62, size * 0.72);
  ctx.lineTo(-size * 0.8, -size * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawMagnetPickup(size) {
  ctx.fillStyle = "#ff9fd0";
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 1, size * 0.45, Math.PI * 0.08, Math.PI * 0.92);
  ctx.stroke();
  ctx.strokeStyle = "#6cf4ff";
  ctx.beginPath();
  ctx.moveTo(-size * 0.22, -size * 0.12);
  ctx.lineTo(-size * 0.22, -size * 0.45);
  ctx.moveTo(size * 0.22, -size * 0.12);
  ctx.lineTo(size * 0.22, -size * 0.45);
  ctx.stroke();
}

function drawSlowPickup(size) {
  ctx.fillStyle = "#c4f6ff";
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1b5870";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -size * 0.3);
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.22, size * 0.12);
  ctx.stroke();
}

function drawDoublePickup(size) {
  ctx.fillStyle = "#ffd27d";
  ctx.beginPath();
  ctx.roundRect(-size, -size * 0.82, size * 2, size * 1.64, 12);
  ctx.fill();
  ctx.fillStyle = "#7a4100";
  ctx.font = `${Math.max(14, size * 1.05)}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("2x", 0, 1);
}

function drawBoss() {
  if (!state.boss) return;
  const boss = state.boss;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(Math.sin(state.totalTime * 0.4) * 0.08);
  const fill = ctx.createRadialGradient(-18, -16, 12, 0, 0, boss.radius);
  fill.addColorStop(0, boss.tint2);
  fill.addColorStop(1, boss.tint);
  ctx.fillStyle = fill;
  drawSpikeBall(0, 0, boss.radius);
  ctx.fillStyle = "rgba(10, 17, 30, 0.92)";
  ctx.beginPath();
  ctx.arc(-18, -8, 8, 0, Math.PI * 2);
  ctx.arc(18, -8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(10, 17, 30, 0.92)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 16, 26, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();
  ctx.restore();

  const barWidth = 260;
  const x = WIDTH / 2 - barWidth / 2;
  const y = 28;
  ctx.fillStyle = "rgba(5, 12, 22, 0.72)";
  ctx.fillRect(x, y, barWidth, 16);
  const pct = clamp(boss.hp / Math.max(1, boss.maxHp), 0, 1);
  const bar = ctx.createLinearGradient(x, y, x + barWidth, y);
  bar.addColorStop(0, boss.tint2);
  bar.addColorStop(1, boss.tint);
  ctx.fillStyle = bar;
  ctx.fillRect(x, y, barWidth * pct, 16);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.strokeRect(x, y, barWidth, 16);
  ctx.fillStyle = "#eef7ff";
  ctx.font = "700 14px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${getWorld().name} Boss`, WIDTH / 2, y - 8);
}

function drawParticles() {
  state.particles.forEach((particle) => {
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawBottomGlow() {
  const glow = ctx.createLinearGradient(0, HEIGHT - 120, 0, HEIGHT);
  glow.addColorStop(0, "rgba(255,255,255,0)");
  glow.addColorStop(1, `${getWorld().accent}18`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, HEIGHT - 120, WIDTH, 120);
}

function drawTopHud() {
  ctx.fillStyle = "rgba(238,247,255,0.9)";
  ctx.font = "700 18px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${getMode().label} • ${getWorld().name}`, 22, 34);
  ctx.fillStyle = "rgba(168,186,215,0.95)";
  ctx.font = "500 14px Inter, sans-serif";
  if (state.isBossStage && state.boss && !state.boss.defeated) {
    ctx.fillText(`Collect energy stars to crack the boss core`, 22, 56);
  } else {
    const remaining = Math.max(0, state.stageGoal - state.stageTimer).toFixed(1);
    ctx.fillText(`Stage clear in ${remaining}s • Stars ${state.starsThisRun} • Bosses ${state.bossesDefeatedThisRun}`, 22, 56);
  }
}

function showHelpModal() {
  openModal(
    "How to Play",
    `
      <div class="modal-grid">
        <div class="info-card">
          <h3>Controls</h3>
          <ul>
            <li><strong>← / →</strong> move left and right.</li>
            <li><strong>Shift</strong> or <strong>Boost</strong> gives a fast dash burst.</li>
            <li><strong>Space</strong> pauses or resumes the run.</li>
            <li><strong>F</strong> toggles fullscreen.</li>
          </ul>
        </div>
        <div class="info-card">
          <h3>Goal</h3>
          <ul>
            <li>Clear real stages instead of endless-only play.</li>
            <li>Dodge different hazard types: spike balls, zigzags, chasers, splitters, and comets.</li>
            <li>Collect stars, shields, magnet, slow-motion, and double-score powers.</li>
            <li>Every fourth stage is a boss fight.</li>
          </ul>
        </div>
        <div class="info-card">
          <h3>Characters</h3>
          <ul>
            ${SKINS.map((skin) => `<li><strong>${escapeHtml(skin.label)}:</strong> ${escapeHtml(skin.perk)}</li>`).join("")}
          </ul>
        </div>
        <div class="info-card">
          <h3>Modes</h3>
          <ul>
            ${MODES.map((mode) => `<li><strong>${escapeHtml(mode.label)}:</strong> ${escapeHtml(mode.summary)}</li>`).join("")}
          </ul>
        </div>
      </div>
    `,
    "Pickle guide"
  );
}

function renderChallengesMiniList() {
  const challenges = getDailyChallenges();
  challengeMiniList.innerHTML = challenges.map((challenge) => {
    const progress = Math.min(dailyProgressFor(challenge.metric), challenge.target);
    const done = progress >= challenge.target;
    return `<div class="challenge-mini-item"><span>${escapeHtml(challenge.label)} ${challenge.target}</span><strong class="${done ? "done" : ""}">${Math.floor(progress)}/${challenge.target}</strong></div>`;
  }).join("");
}

function showChallengesModal() {
  const content = getDailyChallenges().map((challenge) => {
    const progress = Math.min(dailyProgressFor(challenge.metric), challenge.target);
    const pct = (progress / challenge.target) * 100;
    return `
      <div class="info-card">
        <h3>${escapeHtml(challenge.label)}</h3>
        <div class="progress-row"><span>${Math.floor(progress)} / ${challenge.target}</span><span>${progress >= challenge.target ? "Done" : "In progress"}</span></div>
        <div class="progress-bar"><span style="width:${pct.toFixed(2)}%"></span></div>
      </div>
    `;
  }).join("");
  openModal("Daily Challenges", `<div class="modal-grid">${content}</div>`, `Today • ${todayKey()}`);
}

function showAchievementsModal() {
  const content = ACHIEVEMENTS.map((achievement) => {
    const unlocked = Boolean(state.meta.achievements[achievement.id]);
    return `
      <div class="badge-item ${unlocked ? "unlocked" : ""}">
        <h4>${escapeHtml(achievement.title)}</h4>
        <p>${escapeHtml(achievement.desc)}</p>
        <p><strong>${unlocked ? "Unlocked" : "Locked"}</strong></p>
      </div>
    `;
  }).join("");
  openModal("Achievements", `<div class="badge-list">${content}</div>`, "Progress & milestones");
}

function showLeaderboardModal() {
  const rows = state.leaderboard.length
    ? state.leaderboard.map((entry, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${entry.score}</td>
        <td>${escapeHtml(entry.mode)}</td>
        <td>${escapeHtml(entry.skin)}</td>
        <td>${entry.stage}</td>
        <td>${entry.world}</td>
        <td>${escapeHtml(entry.date)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="7">No runs yet. Start a dash and claim the top spot.</td></tr>`;

  openModal(
    "Local Leaderboard",
    `
      <div class="info-card">
        <table class="score-table">
          <thead>
            <tr><th>#</th><th>Score</th><th>Mode</th><th>Skin</th><th>Stage</th><th>World</th><th>Date</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
    "Stored in your browser"
  );
}

function checkAchievements() {
  let unlockedAny = false;
  for (const achievement of ACHIEVEMENTS) {
    if (!state.meta.achievements[achievement.id] && achievement.check(state.meta)) {
      state.meta.achievements[achievement.id] = true;
      unlockedAny = true;
      pushBanner(`Achievement unlocked: ${achievement.title}`, achievement.desc);
      safePlaySound(760, 0.08, "triangle", 0.05);
    }
  }
  if (unlockedAny) saveMeta();
}

function pauseGame() {
  if (state.gameOver) return;
  state.paused = true;
  setOverlay({
    tag: "Paused",
    title: "Take a breather",
    text: "Resume when you are ready. Your stage, powers, and score are waiting for you.",
    primaryLabel: "Resume",
    primaryAction: "resume",
  });
}

function resumeGame() {
  if (state.gameOver) return;
  state.paused = false;
  hideOverlay();
}

function togglePause() {
  if (state.gameOver) return;
  if (state.paused) resumeGame();
  else pauseGame();
}

function handleOverlayPrimary() {
  if (state.overlayAction === "resume") resumeGame();
  else restartRun();
}

function handleOverlaySecondary() {
  if (state.gameOver) showLeaderboardModal();
  else restartRun();
}

function bindPointerButton(element, key) {
  const setState = (value) => {
    pointerState[key] = value;
  };
  ["pointerdown", "touchstart"].forEach((eventName) => {
    element.addEventListener(eventName, (event) => {
      event.preventDefault();
      setState(true);
      primeAudioAndFullscreen();
    }, { passive: false });
  });
  ["pointerup", "pointerleave", "pointercancel", "touchend", "touchcancel"].forEach((eventName) => {
    element.addEventListener(eventName, (event) => {
      event.preventDefault();
      setState(false);
    }, { passive: false });
  });
}

function handleCanvasPointer(event) {
  if (window.innerWidth > 760) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = WIDTH / rect.width;
  player.x = clamp((event.clientX - rect.left) * ratio, player.width / 2 + 14, WIDTH - player.width / 2 - 14);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function noteToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function ensureAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    sfxBus = audioCtx.createGain();
    musicBus = audioCtx.createGain();
    const compressor = audioCtx.createDynamicsCompressor();
    masterGain.gain.value = 0.8;
    sfxBus.gain.value = 1;
    musicBus.gain.value = musicEnabled ? 0.56 : 0.0001;
    compressor.threshold.value = -18;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.2;
    sfxBus.connect(masterGain);
    musicBus.connect(masterGain);
    masterGain.connect(compressor);
    compressor.connect(audioCtx.destination);

    noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.6, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function scheduleSynthNote({ time, freq, duration, type = "square", volume = 0.02, attack = 0.01, release = 0.12, glideTo = null, bus = "music" }) {
  const context = ensureAudioContext();
  const osc = context.createOscillator();
  const gain = context.createGain();
  const targetBus = bus === "sfx" ? sfxBus : musicBus;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, time + duration * 0.85);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(volume, time + attack);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.72), time + Math.max(attack + 0.01, duration - release));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain);
  gain.connect(targetBus);
  osc.start(time);
  osc.stop(time + duration + 0.03);
}

function scheduleNoiseHit(time, duration, volume, filterFreq) {
  const context = ensureAudioContext();
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, time);
  filter.Q.setValueAtTime(0.7, time);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(musicBus);
  source.start(time);
  source.stop(time + duration + 0.03);
}

function scheduleKick(time, rootFreq) {
  const context = ensureAudioContext();
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(rootFreq * 2.2, time);
  osc.frequency.exponentialRampToValueAtTime(rootFreq, time + 0.12);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.09, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  osc.connect(gain);
  gain.connect(musicBus);
  osc.start(time);
  osc.stop(time + 0.18);
}

function scheduleMusicStep(time, stepIndex) {
  const theme = MUSIC_THEMES[currentMusicTheme % MUSIC_THEMES.length];
  const stepInBar = stepIndex % 16;
  const barIndex = Math.floor(stepIndex / 16) % theme.progression.length;
  const stepDuration = 60 / theme.tempo / 4;
  const bassNote = theme.bass[stepInBar];
  const leadNote = theme.lead[stepInBar];
  const counterNote = theme.counter[stepInBar];
  const chord = theme.progression[barIndex];

  if (stepInBar === 0) {
    chord.forEach((note, idx) => {
      scheduleSynthNote({
        time,
        freq: noteToFreq(note + 12),
        duration: stepDuration * 7.6,
        type: theme.padType,
        volume: 0.0046 + idx * 0.001,
        attack: 0.08,
        release: 0.32,
      });
    });
  }

  if (bassNote !== null) {
    scheduleSynthNote({
      time,
      freq: noteToFreq(bassNote),
      duration: stepDuration * 1.45,
      type: "triangle",
      volume: currentMusicTheme === 6 ? 0.034 : 0.028,
      attack: 0.01,
      release: 0.1,
    });
  }

  if ([0, 4, 8, 12].includes(stepInBar)) {
    scheduleKick(time, noteToFreq(theme.kickRoot));
  }
  if ([2, 6, 10, 14].includes(stepInBar)) {
    scheduleNoiseHit(time, 0.018, currentMusicTheme === 6 ? 0.0032 : 0.0024, 5200);
  }
  if ([4, 12].includes(stepInBar)) {
    scheduleNoiseHit(time + 0.006, 0.045, currentMusicTheme === 6 ? 0.008 : 0.006, 1400);
  }

  if (leadNote !== null) {
    scheduleSynthNote({
      time,
      freq: noteToFreq(leadNote),
      duration: stepInBar % 4 === 3 ? stepDuration * 2 : stepDuration * 1.3,
      type: theme.leadType,
      volume: currentMusicTheme === 6 ? 0.014 : 0.0118,
      attack: 0.012,
      release: 0.09,
      glideTo: stepInBar % 8 === 6 ? noteToFreq(leadNote + 2) : null,
    });
  }

  if (counterNote !== null && stepInBar % 2 === 0) {
    scheduleSynthNote({
      time: time + stepDuration * 0.5,
      freq: noteToFreq(counterNote),
      duration: stepDuration * 1.06,
      type: theme.accentType,
      volume: currentMusicTheme === 6 ? 0.0072 : 0.0058,
      attack: 0.01,
      release: 0.07,
    });
  }
}

function restartMusicScheduler() {
  stopMusic();
  startMusic();
}

function startMusic() {
  if (!musicEnabled || musicTimer) return;
  const context = ensureAudioContext();
  nextMusicTime = context.currentTime + 0.08;
  musicTimer = window.setInterval(() => {
    if (!musicEnabled) return;
    const theme = MUSIC_THEMES[currentMusicTheme % MUSIC_THEMES.length];
    const stepDuration = 60 / theme.tempo / 4;
    while (nextMusicTime < context.currentTime + 0.45) {
      scheduleMusicStep(nextMusicTime, musicStep);
      nextMusicTime += stepDuration;
      musicStep += 1;
    }
  }, 80);
}

function stopMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicBus && audioCtx) {
    const now = audioCtx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setTargetAtTime(musicEnabled ? 0.56 : 0.0001, now, 0.08);
  }
}

function safePlaySound(freq, duration, type = "sine", volume = 0.03, delay = 0) {
  if (!sfxEnabled) return;
  try {
    const context = ensureAudioContext();
    const now = context.currentTime + delay;
    scheduleSynthNote({ time: now, freq, duration, type, volume, attack: 0.01, release: Math.min(0.08, duration * 0.5), bus: "sfx" });
  } catch (error) {
    // keep gameplay alive even if audio fails
  }
}

async function unlockAudioAndMaybeStart() {
  try {
    const context = ensureAudioContext();
    if (context.state !== "running") await context.resume();
    audioUnlocked = context.state === "running";
    if (audioUnlocked && musicEnabled) startMusic();
  } catch (error) {
    // ignore audio failures
  }
}

async function enterPreferredFullscreen() {
  if (triedInitialFullscreen || document.fullscreenElement) return;
  triedInitialFullscreen = true;
  try {
    const appShell = document.querySelector(".app-shell");
    if (appShell.requestFullscreen) await appShell.requestFullscreen();
  } catch (error) {
    // ignore fullscreen restrictions
  }
}

function primeAudioAndFullscreen() {
  unlockAudioAndMaybeStart();
  enterPreferredFullscreen();
  audioHint.classList.add("hidden");
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  localStorage.setItem(MUSIC_KEY, musicEnabled ? "on" : "off");
  if (musicEnabled) {
    unlockAudioAndMaybeStart();
    restartMusicScheduler();
    safePlaySound(520, 0.05, "triangle", 0.03);
  } else {
    stopMusic();
  }
  updateAudioButtons();
}

function toggleSound() {
  sfxEnabled = !sfxEnabled;
  localStorage.setItem(SOUND_KEY, sfxEnabled ? "on" : "off");
  updateAudioButtons();
  if (sfxEnabled) safePlaySound(460, 0.05, "square", 0.03);
}

function updateAudioButtons() {
  musicBtn.textContent = musicEnabled ? "Music: On" : "Music: Off";
  muteBtn.textContent = sfxEnabled ? "Sound: On" : "Sound: Off";
}

async function toggleFullscreen() {
  try {
    const appShell = document.querySelector(".app-shell");
    if (!document.fullscreenElement) {
      await (appShell.requestFullscreen ? appShell.requestFullscreen() : document.documentElement.requestFullscreen());
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    // ignore fullscreen errors
  }
}

function updateFullscreenButton() {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenBtn.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
  document.body.classList.toggle("is-fullscreen", isFullscreen);
}

function setInfoDrawerOpen(forceOpen) {
  if (!infoDrawer || !infoBtn) return;
  const open = typeof forceOpen === "boolean" ? forceOpen : infoDrawer.hasAttribute("hidden");
  if (open) {
    infoDrawer.removeAttribute("hidden");
    infoBtn.textContent = "Hide Info";
  } else {
    infoDrawer.setAttribute("hidden", "");
    infoBtn.textContent = "Game Info";
  }
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight", "Space", "KeyP", "KeyF", "KeyM", "Escape"].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === "ArrowLeft") keys.left = true;
  if (event.code === "ArrowRight") keys.right = true;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") keys.boost = true;
  if (event.code === "Space") togglePause();
  if (event.code === "KeyP") togglePause();
  if (event.code === "KeyF") toggleFullscreen();
  if (event.code === "KeyM") toggleMusic();
  if (event.code === "Escape" && modalRoot.classList.contains("open")) closeModal();
  if (event.code === "Escape" && infoDrawer && !infoDrawer.hasAttribute("hidden")) setInfoDrawerOpen(false);
  primeAudioAndFullscreen();
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") keys.left = false;
  if (event.code === "ArrowRight") keys.right = false;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") keys.boost = false;
});

canvas.addEventListener("pointermove", handleCanvasPointer);
canvas.addEventListener("pointerdown", primeAudioAndFullscreen, { passive: true });

restartBtnTop.addEventListener("click", () => { primeAudioAndFullscreen(); restartRun(); });
pauseBtn.addEventListener("click", () => { primeAudioAndFullscreen(); togglePause(); });
overlayPrimaryBtn.addEventListener("click", () => { primeAudioAndFullscreen(); handleOverlayPrimary(); });
overlaySecondaryBtn.addEventListener("click", () => { primeAudioAndFullscreen(); handleOverlaySecondary(); });
modeBtn.addEventListener("click", () => { primeAudioAndFullscreen(); cycleMode(); });
skinBtn.addEventListener("click", () => { primeAudioAndFullscreen(); cycleSkin(); });
helpBtn.addEventListener("click", showHelpModal);
challengeBtn.addEventListener("click", showChallengesModal);
achievementBtn.addEventListener("click", showAchievementsModal);
leaderboardBtn.addEventListener("click", showLeaderboardModal);
musicBtn.addEventListener("click", () => { primeAudioAndFullscreen(); toggleMusic(); });
muteBtn.addEventListener("click", toggleSound);
fullscreenBtn.addEventListener("click", toggleFullscreen);
if (infoBtn) infoBtn.addEventListener("click", () => setInfoDrawerOpen());
if (closeInfoBtn) closeInfoBtn.addEventListener("click", () => setInfoDrawerOpen(false));
closeModalBtn.addEventListener("click", closeModal);
modalRoot.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") closeModal();
});

document.addEventListener("fullscreenchange", updateFullscreenButton);

bindPointerButton(leftBtn, "left");
bindPointerButton(rightBtn, "right");
bindPointerButton(boostBtn, "boost");

function bootstrap() {
  setMode(state.activeMode);
  setSkin(state.activeSkin);
  updateAudioButtons();
  updateFullscreenButton();
  setInfoDrawerOpen(false);
  renderChallengesMiniList();
  createStarfield();
  restartRun();
  musicPrimedEvents.forEach((eventName) => window.addEventListener(eventName, primeAudioAndFullscreen, { once: true, passive: true }));
}

bootstrap();
