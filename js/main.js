import { initMediaPipe, startCamera, stopCamera, setPoseCallback, setSegmentCallback } from './camera.js';
import {
  initSilhouette, updatePose, updateSegmentation,
  checkCalibrationStable, resetCalibration, drawSilhouette,
} from './silhouette.js';
import { initSpriteCache } from './objects.js';
import { initAudio } from './audio.js';
import { initGame, startGame, stopGame, CANVAS_WIDTH, CANVAS_HEIGHT } from './game.js';

const SCREENS = {
  TITLE: 'screen-title',
  CAMERA: 'screen-camera',
  CALIBRATION: 'screen-calibration',
  GAMEPLAY: 'screen-gameplay',
  GAMEOVER: 'screen-gameover',
};

let currentScreen = null;
let calibrationAnimId = null;
let calibrationTimeoutId = null;
let isTwoPlayerMode = false;

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(screenId);
  if (el) {
    el.classList.add('active');
    currentScreen = screenId;
  }
}

async function init() {
  await initSpriteCache();
  initSilhouette(640, 480);

  const gameCanvas = document.getElementById('game-canvas');
  initGame(gameCanvas, handleGameOver);

  document.getElementById('btn-play').addEventListener('click', () => {
    isTwoPlayerMode = false;
    initAudio();
    showScreen(SCREENS.CAMERA);
    requestCamera();
  });

  document.getElementById('btn-play-2p').addEventListener('click', () => {
    isTwoPlayerMode = true;
    initAudio();
    showScreen(SCREENS.CAMERA);
    requestCamera();
  });

  document.getElementById('btn-replay').addEventListener('click', () => {
    resetCalibration();
    showScreen(SCREENS.CALIBRATION);
    startCalibration();
  });

  document.getElementById('btn-ready').addEventListener('click', () => {
    transitionToGameplay();
  });

  showScreen(SCREENS.TITLE);
}

async function requestCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraError('Camera not supported on this browser.');
      return;
    }
    if (!window.isSecureContext) {
      const host = window.location.hostname;
      const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      const hint = isLocalhost
        ? 'If you are on localhost, try using http://localhost (not file://).'
        : 'Camera access requires HTTPS. Please use https:// and reload.';
      showCameraError('Camera blocked in an insecure context.', hint);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });
    const video = document.getElementById('webcam');
    video.srcObject = stream;
    await video.play();

    await initMediaPipe(video);

    setPoseCallback((results) => updatePose(results));
    setSegmentCallback((results) => updateSegmentation(results));

    startCamera(video);
    showScreen(SCREENS.CALIBRATION);
    startCalibration();
  } catch (err) {
    console.error('Camera error:', err);
    showCameraError('Oops! We need the camera to play. Please refresh and click Allow!');
  }
}

function showCameraError(message, hint = '') {
  const errorEl = document.getElementById('camera-error');
  const hintEl = document.getElementById('camera-hint');
  errorEl.textContent = message;
  errorEl.hidden = false;
  if (hint) {
    hintEl.textContent = hint;
    hintEl.hidden = false;
  } else {
    hintEl.hidden = true;
  }
}

function startCalibration() {
  resetCalibration();
  calibrationTimeoutId = null;
  const canvas = document.getElementById('calibration-canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('calibration-status');
  const readyBtn = document.getElementById('btn-ready');
  readyBtn.hidden = true;

  function calibrationLoop() {
    if (currentScreen !== SCREENS.CALIBRATION) return;
    calibrationAnimId = requestAnimationFrame(calibrationLoop);

    // Commented out the purple background to keep it normal
    // ctx.fillStyle = '#1a0a2e';
    // ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawSilhouette(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (checkCalibrationStable()) {
      statusEl.textContent = 'Looking good! Starting...';
      readyBtn.hidden = false;
      if (!calibrationTimeoutId) {
        calibrationTimeoutId = setTimeout(() => {
          if (currentScreen === SCREENS.CALIBRATION) {
            transitionToGameplay();
          }
        }, 1000);
      }
    } else {
      statusEl.textContent = 'Looking for you...';
      readyBtn.hidden = true;
      if (calibrationTimeoutId) {
        clearTimeout(calibrationTimeoutId);
        calibrationTimeoutId = null;
      }
    }
  }

  calibrationLoop();
}

function transitionToGameplay() {
  if (calibrationTimeoutId) {
    clearTimeout(calibrationTimeoutId);
    calibrationTimeoutId = null;
  }
  stopCalibration();
  showScreen(SCREENS.GAMEPLAY);
  startGame(isTwoPlayerMode);
}

function stopCalibration() {
  if (calibrationAnimId) cancelAnimationFrame(calibrationAnimId);
}

function handleGameOver(finalScores, isTwoPlayer) {
  stopGame();
  showScreen(SCREENS.GAMEOVER);

  const scoreEl = document.getElementById('final-score');
  let maxScore = finalScores[0];

  if (isTwoPlayer) {
    scoreEl.innerHTML = `Player 1: ${finalScores[0]}<br>Player 2: ${finalScores[1]}`;
    maxScore = Math.max(finalScores[0], finalScores[1]);
  } else {
    scoreEl.textContent = `Score: ${finalScores[0]}`;
  }

  let stars = '⭐';
  if (maxScore >= 300) stars = '⭐⭐⭐';
  else if (maxScore >= 100) stars = '⭐⭐';
  document.getElementById('stars').textContent = stars;

  spawnConfetti();
}

function spawnConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const candyEmoji = ['🚀', '🎯', '☄️', '💥', '🔥', '⭐'];
  for (let i = 0; i < 30; i++) {
    const span = document.createElement('span');
    span.textContent = candyEmoji[Math.floor(Math.random() * candyEmoji.length)];
    span.style.cssText = `
      position: absolute;
      font-size: ${20 + Math.random() * 20}px;
      left: ${Math.random() * 100}%;
      top: -30px;
      animation: confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s forwards;
    `;
    container.appendChild(span);
  }
}

document.addEventListener('DOMContentLoaded', init);

export { SCREENS, showScreen };
