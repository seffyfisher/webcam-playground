let audioCtx = null;

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function ensureAudio() {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playCatchSound() {
  ensureAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(784, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

function playHitSound() {
  ensureAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

function playMIRVSplitSound() {
  ensureAudio();

  // Low rumble explosion
  const noise = audioCtx.createOscillator();
  const noiseGain = audioCtx.createGain();
  noise.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);

  noise.type = 'sawtooth';
  noise.frequency.setValueAtTime(120, audioCtx.currentTime);
  noise.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.3);
  noiseGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

  noise.start();
  noise.stop(audioCtx.currentTime + 0.4);

  // High crackle
  const crackle = audioCtx.createOscillator();
  const crackleGain = audioCtx.createGain();
  crackle.connect(crackleGain);
  crackleGain.connect(audioCtx.destination);

  crackle.type = 'square';
  crackle.frequency.setValueAtTime(800, audioCtx.currentTime);
  crackle.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.15);
  crackleGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  crackleGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

  crackle.start();
  crackle.stop(audioCtx.currentTime + 0.2);
}

function playLevelUpSound() {
  ensureAudio();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.3);

    osc.start(audioCtx.currentTime + i * 0.1);
    osc.stop(audioCtx.currentTime + i * 0.1 + 0.3);
  });
}

export { initAudio, playCatchSound, playHitSound, playMIRVSplitSound, playLevelUpSound };
