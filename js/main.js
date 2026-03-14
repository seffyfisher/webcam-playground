// Screen state machine
const SCREENS = {
  TITLE: 'screen-title',
  CAMERA: 'screen-camera',
  CALIBRATION: 'screen-calibration',
  GAMEPLAY: 'screen-gameplay',
  GAMEOVER: 'screen-gameover',
};

let currentScreen = null;

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(screenId);
  if (el) {
    el.classList.add('active');
    currentScreen = screenId;
  }
}

// Wire up buttons
function init() {
  document.getElementById('btn-play').addEventListener('click', () => {
    showScreen(SCREENS.CAMERA);
    requestCamera();
  });

  document.getElementById('btn-replay').addEventListener('click', () => {
    showScreen(SCREENS.TITLE);
  });

  showScreen(SCREENS.TITLE);
}

// Placeholder — will be replaced by camera.js integration
async function requestCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    const video = document.getElementById('webcam');
    video.srcObject = stream;
    await video.play();
    showScreen(SCREENS.CALIBRATION);
  } catch (err) {
    console.error('Camera error:', err);
    document.getElementById('camera-error').hidden = false;
  }
}

export { SCREENS, showScreen, currentScreen };

document.addEventListener('DOMContentLoaded', init);
