// Offscreen canvases for silhouette processing
let offscreenCanvas = null;
let offscreenCtx = null;
let maskCanvas = null;
let maskCtx = null;
let useSegmentation = true;
let segmentationFrameTimes = [];

// Latest results from MediaPipe
let latestPose = null;
let latestSegmentation = null;

// Position state
let currentX = 0.5;
let targetX = 0.5;
let lostFrames = 0;
const LOST_THRESHOLD = 10;
const LERP_FACTOR = 0.3;
const VISIBILITY_THRESHOLD = 0.7;

function initSilhouette(width, height) {
  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  offscreenCtx = offscreenCanvas.getContext('2d');

  maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  maskCtx = maskCanvas.getContext('2d');
}

function updatePose(results) {
  latestPose = results;
  if (!results.poseLandmarks) {
    lostFrames++;
    return;
  }

  const landmarks = results.poseLandmarks;
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const nose = landmarks[0];

  let rawX = null;
  if (lShoulder.visibility > VISIBILITY_THRESHOLD && rShoulder.visibility > VISIBILITY_THRESHOLD) {
    rawX = (lShoulder.x + rShoulder.x) / 2;
  } else if (lHip.visibility > VISIBILITY_THRESHOLD && rHip.visibility > VISIBILITY_THRESHOLD) {
    rawX = (lHip.x + rHip.x) / 2;
  } else if (nose.visibility > VISIBILITY_THRESHOLD) {
    rawX = nose.x;
  }

  if (rawX !== null) {
    const mirrored = 1 - rawX;
    targetX = Math.max(0, Math.min(1, (mirrored - 0.1) / 0.8));
    lostFrames = 0;
  } else {
    lostFrames++;
  }
}

function updateSegmentation(results) {
  latestSegmentation = results;

  const now = performance.now();
  segmentationFrameTimes.push(now);
  if (segmentationFrameTimes.length > 30) {
    const elapsed = now - segmentationFrameTimes[0];
    const avgFps = 30 / (elapsed / 1000);
    segmentationFrameTimes = segmentationFrameTimes.slice(-30);
    if (avgFps < 10 && useSegmentation) {
      console.warn('Segmentation too slow, falling back to polygon silhouette');
      useSegmentation = false;
    }
  }
}

function update() {
  currentX += (targetX - currentX) * LERP_FACTOR;
}

function getPlayerX() {
  return currentX;
}

function isTrackingLost() {
  return lostFrames >= LOST_THRESHOLD;
}

function getPlayerBounds(canvasWidth, canvasHeight) {
  if (!latestPose || !latestPose.poseLandmarks) return null;

  const landmarks = latestPose.poseLandmarks;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let visibleCount = 0;

  for (const lm of landmarks) {
    if (lm.visibility > VISIBILITY_THRESHOLD) {
      const mx = Math.max(0, Math.min(1, ((1 - lm.x) - 0.1) / 0.8));
      minX = Math.min(minX, mx);
      maxX = Math.max(maxX, mx);
      minY = Math.min(minY, lm.y);
      maxY = Math.max(maxY, lm.y);
      visibleCount++;
    }
  }

  if (visibleCount < 5) return null;

  const shrink = 0.15;
  const w = (maxX - minX) * canvasWidth;
  const h = (maxY - minY) * canvasHeight;
  const cx = ((minX + maxX) / 2) * canvasWidth;
  const cy = ((minY + maxY) / 2) * canvasHeight;

  return {
    x: cx - (w * (1 - shrink)) / 2,
    y: cy - (h * (1 - shrink)) / 2,
    width: w * (1 - shrink),
    height: h * (1 - shrink),
  };
}

function drawSilhouette(ctx, canvasWidth, canvasHeight) {
  if (!latestPose) return;

  if (useSegmentation && latestSegmentation && latestSegmentation.segmentationMask) {
    drawSegmentationSilhouette(ctx, canvasWidth, canvasHeight);
  } else {
    drawPolygonSilhouette(ctx, canvasWidth, canvasHeight);
  }
}

function drawSegmentationSilhouette(ctx, canvasWidth, canvasHeight) {
  const mask = latestSegmentation.segmentationMask;
  const image = latestSegmentation.image;

  offscreenCtx.save();
  offscreenCtx.translate(offscreenCanvas.width, 0);
  offscreenCtx.scale(-1, 1);
  offscreenCtx.drawImage(image, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
  offscreenCtx.restore();

  maskCtx.drawImage(mask, 0, 0, maskCanvas.width, maskCanvas.height);
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const imgData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  for (let i = 0; i < maskData.data.length; i += 4) {
    const confidence = maskData.data[i] / 255;
    if (confidence > 0.5) {
      const r = imgData.data[i];
      const g = imgData.data[i + 1];
      const b = imgData.data[i + 2];
      const brightness = (r + g + b) / 3;
      imgData.data[i] = Math.min(255, brightness * 0.4 + 120);
      imgData.data[i + 1] = Math.min(255, brightness * 0.2 + 50);
      imgData.data[i + 2] = Math.min(255, brightness * 0.4 + 180);
      imgData.data[i + 3] = Math.min(255, confidence * 255);
    } else {
      imgData.data[i + 3] = 0;
    }
  }

  offscreenCtx.putImageData(imgData, 0, 0);
  ctx.drawImage(offscreenCanvas, 0, 0, canvasWidth, canvasHeight);
}

function drawPolygonSilhouette(ctx, canvasWidth, canvasHeight) {
  if (!latestPose.poseLandmarks) return;

  const lm = latestPose.poseLandmarks;
  const bodyOutline = [0, 11, 13, 15, 23, 25, 27, 28, 26, 24, 16, 14, 12, 0];

  ctx.save();
  ctx.beginPath();

  let started = false;
  for (const idx of bodyOutline) {
    const x = (1 - lm[idx].x) * canvasWidth;
    const y = lm[idx].y * canvasHeight;
    if (!started) { ctx.moveTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, 'rgba(124, 77, 255, 0.85)');
  gradient.addColorStop(1, 'rgba(179, 136, 255, 0.85)');
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowColor = 'rgba(124, 77, 255, 0.5)';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.restore();
}

let stableFrames = 0;

function checkCalibrationStable() {
  if (!latestPose || !latestPose.poseLandmarks) {
    stableFrames = 0;
    return false;
  }

  const upperBody = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26];
  let visibleCount = 0;
  for (const idx of upperBody) {
    if (latestPose.poseLandmarks[idx].visibility > 0.7) visibleCount++;
  }

  if (visibleCount >= 8) {
    stableFrames++;
  } else {
    stableFrames = 0;
  }

  return stableFrames >= 90;
}

function resetCalibration() {
  stableFrames = 0;
  lostFrames = 0;
  currentX = 0.5;
  targetX = 0.5;
}

export {
  initSilhouette, updatePose, updateSegmentation, update,
  getPlayerX, getPlayerBounds, isTrackingLost,
  drawSilhouette, checkCalibrationStable, resetCalibration,
};
