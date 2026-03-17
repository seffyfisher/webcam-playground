import { drawSilhouette } from './silhouette.js';
import { drawEffects, getShakeOffset } from './effects.js';

let starField = null;

function initStarField(w, h) {
  starField = [];
  for (let i = 0; i < 80; i++) {
    starField.push({
      x: Math.random() * w,
      y: Math.random() * h * 0.75,
      size: 0.5 + Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
    });
  }
}

function drawBackground(ctx, w, h) {
  // Night sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.8);
  sky.addColorStop(0, '#0a0a2e');
  sky.addColorStop(0.5, '#1a1a3e');
  sky.addColorStop(1, '#2a1a3e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars
  if (!starField) initStarField(w, h);
  for (const star of starField) {
    star.twinkle += star.speed;
    const alpha = 0.3 + Math.sin(star.twinkle) * 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // City skyline silhouette at bottom
  ctx.fillStyle = '#0d0d1a';
  const buildings = [
    { x: 0, w: 60, h: 80 },
    { x: 55, w: 40, h: 120 },
    { x: 90, w: 50, h: 90 },
    { x: 140, w: 30, h: 140 },
    { x: 165, w: 55, h: 100 },
    { x: 220, w: 45, h: 70 },
    { x: 260, w: 60, h: 110 },
    { x: 315, w: 35, h: 130 },
    { x: 345, w: 50, h: 85 },
    { x: 390, w: 40, h: 150 },
    { x: 425, w: 55, h: 95 },
    { x: 475, w: 45, h: 120 },
    { x: 520, w: 60, h: 75 },
    { x: 575, w: 35, h: 135 },
    { x: 605, w: 50, h: 100 },
    { x: 650, w: 45, h: 80 },
    { x: 690, w: 55, h: 115 },
    { x: 740, w: 40, h: 90 },
    { x: 775, w: 30, h: 105 },
  ];
  for (const b of buildings) {
    ctx.fillRect(b.x, h - b.h, b.w, b.h);
  }

  // Ground
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, h - 40, w, 40);
}

function drawHUD(ctx, w, gameState) {
  ctx.save();

  if (gameState.isTwoPlayer) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, 15, 12, 130, 60, 18);
    ctx.fill();
    ctx.font = 'bold 16px system-ui';
    ctx.fillStyle = '#ff6b35';
    ctx.textAlign = 'left';
    ctx.fillText(`P1 🚀: ${gameState.scores[0]}`, 28, 32);
    ctx.font = '18px system-ui';
    ctx.fillText('❤️'.repeat(gameState.lives[0]) || '💀', 28, 56);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, w - 145, 12, 130, 60, 18);
    ctx.fill();
    ctx.font = 'bold 16px system-ui';
    ctx.fillStyle = '#ff6b35';
    ctx.textAlign = 'right';
    ctx.fillText(`P2 🚀: ${gameState.scores[1]}`, w - 28, 32);
    ctx.font = '18px system-ui';
    ctx.fillText('❤️'.repeat(gameState.lives[1]) || '💀', w - 28, 56);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, w / 2 - 50, 12, 100, 36, 18);
    ctx.fill();
    ctx.font = 'bold 18px system-ui';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(`⭐ Lvl ${gameState.level}`, w / 2, 36);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, 15, 12, 160, 36, 18);
    ctx.fill();
    ctx.font = 'bold 18px system-ui';
    ctx.fillStyle = '#ff6b35';
    ctx.textAlign = 'left';
    ctx.fillText(`🚀 Score: ${gameState.scores[0]}`, 28, 36);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, w / 2 - 60, 12, 120, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(`⭐ Level ${gameState.level}`, w / 2, 36);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, w - 130, 12, 115, 36, 18);
    ctx.fill();
    ctx.font = '20px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('❤️'.repeat(gameState.lives[0]) || '💀', w - 22, 37);
  }

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawTrackingLost(ctx, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, w, h);
  ctx.font = 'bold 32px system-ui';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('Where did you go? 👀', w / 2, h / 2 - 20);
  ctx.font = '22px system-ui';
  ctx.fillText('Stand in front of the camera!', w / 2, h / 2 + 20);
  ctx.restore();
}

function drawLevelBanner(ctx, w, h, level, score) {
  ctx.save();
  ctx.font = 'bold 56px system-ui';
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(255,107,53,0.8)';
  ctx.lineWidth = 4;
  const text = score >= 500 ? "🏆 Rocket Commander! 🏆" : `Level ${level}!`;
  ctx.strokeText(text, w / 2, h / 2);
  ctx.fillText(text, w / 2, h / 2);
  ctx.restore();
}

function render(ctx, w, h, gameState) {
  const shake = getShakeOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);

  drawBackground(ctx, w, h);
  drawSilhouette(ctx, w, h);

  for (const obj of gameState.objects) {
    obj.draw(ctx);
  }

  drawEffects(ctx);
  drawHUD(ctx, w, gameState);

  if (gameState.trackingLost) {
    drawTrackingLost(ctx, w, h);
  }

  if (gameState.levelBannerTimer > 0) {
    const maxScore = gameState.isTwoPlayer ? Math.max(gameState.scores[0], gameState.scores[1]) : gameState.scores[0];
    drawLevelBanner(ctx, w, h, gameState.level, maxScore);
  }

  ctx.restore();
}

export { render };
