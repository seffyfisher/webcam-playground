import { FallingObject, LEVELS } from './objects.js';
import {
  getPlayerBounds, isTrackingLost, update as updateSilhouette,
} from './silhouette.js';
import { render } from './renderer.js';
import {
  spawnCatchParticles, spawnHitParticles, spawnLevelUpEffect,
  updateEffects, clearEffects,
} from './effects.js';
import { playCatchSound, playHitSound, playLevelUpSound } from './audio.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

let canvas = null;
let ctx = null;
let animFrameId = null;
let spawnTimer = 0;
let running = false;
let onGameOver = null;

const state = {
  scores: [0, 0],
  level: 1,
  lives: [3, 3],
  objects: [],
  trackingLost: false,
  levelBannerTimer: 0,
  champCelebrated: false,
  isTwoPlayer: false,
};

function initGame(canvasElement, gameOverCallback) {
  canvas = canvasElement;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  ctx = canvas.getContext('2d');
  onGameOver = gameOverCallback;
}

function startGame(isTwoPlayerMode = false) {
  state.isTwoPlayer = isTwoPlayerMode;
  state.scores = [0, 0];
  state.level = 1;
  state.lives = [3, 3];
  state.objects = [];
  state.trackingLost = false;
  state.levelBannerTimer = 0;
  state.champCelebrated = false;
  spawnTimer = 0;
  clearEffects();
  running = true;
  loop();
}

function stopGame() {
  running = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
}

function loop() {
  if (!running) return;
  animFrameId = requestAnimationFrame(loop);

  updateSilhouette();

  state.trackingLost = isTrackingLost();
  if (state.trackingLost) {
    render(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, state);
    return;
  }

  const levelConfig = LEVELS[Math.min(state.level - 1, LEVELS.length - 1)];
  spawnTimer++;
  const spawnInterval = Math.max(30, 90 - state.level * 10);
  if (spawnTimer >= spawnInterval && state.objects.length < levelConfig.maxObjects) {
    state.objects.push(new FallingObject(CANVAS_WIDTH, state.level));
    spawnTimer = 0;
  }

  for (const obj of state.objects) {
    obj.update();
  }

  const playerBounds = getPlayerBounds(CANVAS_WIDTH, CANVAS_HEIGHT);
  if (playerBounds) {
    for (const obj of state.objects) {
      if (!obj.alive) continue;
      const ob = obj.getBounds();
      if (aabb(playerBounds, ob)) {
        const cx = ob.x + ob.width / 2;
        const cy = ob.y + ob.height / 2;

          let pIdx = 0;
          if (state.isTwoPlayer && cx > CANVAS_WIDTH / 2) {
            pIdx = 1;
          }

          if (state.lives[pIdx] <= 0) continue; // Skip if this player is dead

          obj.alive = false;

        if (obj.isCandy) {
            state.scores[pIdx] += 10;
          spawnCatchParticles(cx, cy);
          playCatchSound();
          checkLevelUp();
        } else {
            state.lives[pIdx]--;
          spawnHitParticles(cx, cy);
          playHitSound();
            const gameOver = state.isTwoPlayer ? (state.lives[0] <= 0 && state.lives[1] <= 0) : (state.lives[0] <= 0);
            if (gameOver) {
              running = false;
              if (onGameOver) onGameOver(state.scores, state.isTwoPlayer);
              return;
            }
        }
      }
    }
  }

  state.objects = state.objects.filter(o => o.alive && !o.isOffScreen(CANVAS_HEIGHT));

  updateEffects();
  if (state.levelBannerTimer > 0) state.levelBannerTimer--;

  render(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, state);
}

function checkLevelUp() {
  const maxScore = state.isTwoPlayer ? Math.max(state.scores[0], state.scores[1]) : state.scores[0];
  const newLevel = Math.min(5, Math.floor(maxScore / 100) + 1);
  if (newLevel > state.level) {
    state.level = newLevel;
    state.levelBannerTimer = 120;
    spawnLevelUpEffect(CANVAS_WIDTH, newLevel);
    playLevelUpSound();
  }
  if (maxScore >= 500 && !state.champCelebrated) {
    state.champCelebrated = true;
    state.levelBannerTimer = 180;
  }
}

function aabb(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

export { initGame, startGame, stopGame, CANVAS_WIDTH, CANVAS_HEIGHT };
