let pose = null;
let segmenter = null;
let camera = null;
let onPoseResults = null;
let onSegmentResults = null;
let frameCount = 0;

async function initMediaPipe(videoElement) {
  // Pose detection
  pose = new window.Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`,
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  pose.onResults((results) => {
    if (onPoseResults) onPoseResults(results);
  });

  // Selfie segmentation
  segmenter = new window.SelfieSegmentation({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`,
  });
  segmenter.setOptions({ modelSelection: 1 });
  segmenter.onResults((results) => {
    if (onSegmentResults) onSegmentResults(results);
  });

  // Models initialize automatically on first .send() call
}

function startCamera(videoElement) {
  camera = new window.Camera(videoElement, {
    onFrame: async () => {
      frameCount++;
      await pose.send({ image: videoElement });
      if (frameCount % 2 === 0) {
        await segmenter.send({ image: videoElement });
      }
    },
    width: 640,
    height: 480,
  });
  camera.start();
}

function stopCamera() {
  if (camera) camera.stop();
}

function setPoseCallback(cb) { onPoseResults = cb; }
function setSegmentCallback(cb) { onSegmentResults = cb; }

export { initMediaPipe, startCamera, stopCamera, setPoseCallback, setSegmentCallback };
