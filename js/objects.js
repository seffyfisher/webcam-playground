const ROCKET_EMOJI = ['🚀', '🎯', '☄️'];
const BOMB_EMOJI = ['💣', '💥'];
const MIRV_EMOJI = '🚀';
const MIRV_CHILD_EMOJI = ['🔥', '☄️', '🎯'];

const EMOJI_SIZE = 96;

const spriteCache = new Map();

async function initSpriteCache() {
  const allEmoji = [...new Set([...ROCKET_EMOJI, ...BOMB_EMOJI, MIRV_EMOJI, ...MIRV_CHILD_EMOJI])];
  const sizes = [96, 64, 48, 40];

  for (const size of sizes) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    for (const emoji of allEmoji) {
      ctx.clearRect(0, 0, size, size);
      ctx.font = `${size - 8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, size / 2, size / 2);
      const bitmap = await createImageBitmap(canvas);
      spriteCache.set(`${emoji}_${size}`, bitmap);
    }
  }
}

function getSprite(emoji, size) {
  // Find closest cached size
  const sizes = [96, 64, 48, 40];
  let best = sizes[0];
  for (const s of sizes) {
    if (Math.abs(s - size) < Math.abs(best - size)) best = s;
  }
  return spriteCache.get(`${emoji}_${best}`);
}

const LEVELS = [
  { speed: 2,   maxObjects: 3,  bombRatio: 0.15, mirvRatio: 0.00, mirvSplitCount: 2, mirvChildSize: 64, mirvChildSpeed: 3 },
  { speed: 2.5, maxObjects: 4,  bombRatio: 0.15, mirvRatio: 0.10, mirvSplitCount: 2, mirvChildSize: 60, mirvChildSpeed: 3.5 },
  { speed: 3,   maxObjects: 5,  bombRatio: 0.20, mirvRatio: 0.20, mirvSplitCount: 3, mirvChildSize: 52, mirvChildSpeed: 4 },
  { speed: 3.5, maxObjects: 6,  bombRatio: 0.20, mirvRatio: 0.30, mirvSplitCount: 3, mirvChildSize: 46, mirvChildSpeed: 4.5 },
  { speed: 4,   maxObjects: 8,  bombRatio: 0.25, mirvRatio: 0.40, mirvSplitCount: 4, mirvChildSize: 40, mirvChildSpeed: 5 },
];

class FallingObject {
  constructor(canvasWidth, level, options = {}) {
    const config = LEVELS[Math.min(level - 1, LEVELS.length - 1)];

    if (options.isMIRVChild) {
      // MIRV child rocket
      this.isRocket = true;
      this.isMIRV = false;
      this.isMIRVChild = true;
      this.emoji = MIRV_CHILD_EMOJI[Math.floor(Math.random() * MIRV_CHILD_EMOJI.length)];
      this.size = options.size || 64;
      this.x = options.x || 0;
      this.y = options.y || 0;
      this.speed = options.speed || config.mirvChildSpeed;
      this.vx = options.vx || 0;
      this.points = 5;
    } else {
      // Determine type: bomb, MIRV, or regular rocket
      const roll = Math.random();
      const isBomb = roll < config.bombRatio;
      const isMIRV = !isBomb && roll < config.bombRatio + config.mirvRatio;

      this.isRocket = !isBomb;
      this.isMIRV = isMIRV;
      this.isMIRVChild = false;

      if (isBomb) {
        this.emoji = BOMB_EMOJI[Math.floor(Math.random() * BOMB_EMOJI.length)];
        this.points = 0;
      } else if (isMIRV) {
        this.emoji = MIRV_EMOJI;
        this.points = 15;
      } else {
        this.emoji = ROCKET_EMOJI[Math.floor(Math.random() * ROCKET_EMOJI.length)];
        this.points = 10;
      }

      this.size = isMIRV ? 110 : EMOJI_SIZE;
      this.x = Math.random() * (canvasWidth - this.size);
      this.y = -this.size;
      this.speed = config.speed;
      this.vx = 0;
    }

    this.sprite = getSprite(this.emoji, this.size);
    this.rotation = (Math.random() - 0.5) * 0.5;
    this.rotationAngle = 0;
    this.alive = true;
    this.hasSplit = false;
  }

  update() {
    this.y += this.speed;
    this.x += this.vx;
    this.rotationAngle += this.rotation;
  }

  draw(ctx) {
    if (!this.sprite) return;
    ctx.save();
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.rotationAngle);

    // MIRV glow effect
    if (this.isMIRV && !this.hasSplit) {
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 20;
    }

    ctx.drawImage(this.sprite, -this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.size, height: this.size };
  }

  isOffScreen(canvasHeight) {
    return this.y > canvasHeight + this.size || this.x < -this.size || this.x > 800 + this.size;
  }

  splitMIRV(canvasWidth, level) {
    if (!this.isMIRV || this.hasSplit) return [];
    this.hasSplit = true;
    this.alive = false;

    const config = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    const count = config.mirvSplitCount;
    const children = [];

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 3;
      const child = new FallingObject(canvasWidth, level, {
        isMIRVChild: true,
        x: this.x + this.size / 2 - config.mirvChildSize / 2,
        y: this.y,
        size: config.mirvChildSize,
        speed: config.mirvChildSpeed,
        vx: spread,
      });
      children.push(child);
    }

    return children;
  }
}

export { initSpriteCache, FallingObject, LEVELS, EMOJI_SIZE, ROCKET_EMOJI, BOMB_EMOJI };
