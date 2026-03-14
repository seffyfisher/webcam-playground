const particles = [];
const popups = [];
let shakeAmount = 0;

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8 - 3;
    this.life = 1;
    this.decay = 0.02 + Math.random() * 0.02;
    this.size = 3 + Math.random() * 4;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() { return this.life <= 0; }
}

class ScorePopup {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1;
    this.decay = 0.02;
  }

  update() {
    this.y -= 1.5;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.font = 'bold 28px system-ui';
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }

  isDead() { return this.life <= 0; }
}

function spawnCatchParticles(x, y) {
  const colors = ['#FFD700', '#FF6B9D', '#C44DFF', '#4ECDC4', '#FFE66D'];
  for (let i = 0; i < 15; i++) {
    particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
  }
  popups.push(new ScorePopup(x, y - 20, '+10!', '#FFD700'));
}

function spawnHitParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(x, y, '#FF4444'));
  }
  popups.push(new ScorePopup(x, y - 20, 'Uh oh!', '#FF4444'));
  shakeAmount = 8;
}

function spawnLevelUpEffect(canvasWidth, level) {
  popups.push(new ScorePopup(canvasWidth / 2, 200, `Level ${level}!`, '#FFD700'));
}

function updateEffects() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
  for (let i = popups.length - 1; i >= 0; i--) {
    popups[i].update();
    if (popups[i].isDead()) popups.splice(i, 1);
  }
  if (shakeAmount > 0) shakeAmount *= 0.9;
  if (shakeAmount < 0.5) shakeAmount = 0;
}

function drawEffects(ctx) {
  for (const p of particles) p.draw(ctx);
  for (const p of popups) p.draw(ctx);
}

function getShakeOffset() {
  if (shakeAmount <= 0) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * shakeAmount * 2,
    y: (Math.random() - 0.5) * shakeAmount * 2,
  };
}

function clearEffects() {
  particles.length = 0;
  popups.length = 0;
  shakeAmount = 0;
}

export {
  spawnCatchParticles, spawnHitParticles, spawnLevelUpEffect,
  updateEffects, drawEffects, getShakeOffset, clearEffects,
};
