import { drawSilhouette } from './silhouette.js';
import { drawEffects, getShakeOffset } from './effects.js';

let cloudOffset = 0;

function drawBackground(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
  sky.addColorStop(0, '#87CEEB');
  sky.addColorStop(1, '#E8F5E9');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  cloudOffset += 0.3;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  drawCloud(ctx, (100 + cloudOffset) % (w + 200) - 100, 60, 60);
  drawCloud(ctx, (400 + cloudOffset * 0.7) % (w + 200) - 100, 100, 45);
  drawCloud(ctx, (650 + cloudOffset * 0.5) % (w + 200) - 100, 40, 55);

  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, h - 60, w, 60);

  ctx.fillStyle = '#66BB6A';
  for (let x = 0; x < w; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, h - 60);
    ctx.lineTo(x + 15, h - 75);
    ctx.lineTo(x + 30, h - 60);
    ctx.fill();
  }
}

function drawCloud(ctx, x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawHUD(ctx, w, gameState) {
  ctx.save();

  if (gameState.isTwoPlayer) {
    // P1 Score & Lives
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(ctx, 15, 12, 130, 60, 18);
    ctx.fill();
    ctx.font = 'bold 16px system-ui';
    ctx.fillStyle = '#E91E63';
    ctx.textAlign = 'left';
    ctx.fillText(`P1 🍬: ${gameState.scores[0]}`, 28, 32);
    ctx.font = '18px system-ui';
    ctx.fillText('❤️'.repeat(gameState.lives[0]) || '💀', 28, 56);

    // P2 Score & Lives
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(ctx, w - 145, 12, 130, 60, 18);
    ctx.fill();
    ctx.font = 'bold 16px system-ui';
    ctx.fillStyle = '#E91E63';
    ctx.textAlign = 'right';
    ctx.fillText(`P2 🍬: ${gameState.scores[1]}`, w - 28, 32);
    ctx.font = '18px system-ui';
    ctx.fillText('❤️'.repeat(gameState.lives[1]) || '💀', w - 28, 56);

    // Level
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(ctx, w / 2 - 50, 12, 100, 36, 18);
    ctx.fill();
    ctx.font = 'bold 18px system-ui';
    ctx.fillStyle = '#9C27B0';
    ctx.textAlign = 'center';
    ctx.fillText(`⭐ Lvl ${gameState.level}`, w / 2, 36);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(ctx, 15, 12, 160, 36, 18);
    ctx.fill();
    ctx.font = 'bold 18px system-ui';
    ctx.fillStyle = '#E91E63';
    ctx.textAlign = 'left';
    ctx.fillText(`🍬 Score: ${gameState.scores[0]}`, 28, 36);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(ctx, w / 2 - 60, 12, 120, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#9C27B0';
    ctx.textAlign = 'center';
    ctx.fillText(`⭐ Level ${gameState.level}`, w / 2, 36);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
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
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  const text = score >= 500 ? "🏆 Candy Champion! 🏆" : `Level ${level}!`;
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
