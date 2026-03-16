const CANDY_EMOJI = ['🍬', '🍭', '🧁', '🍩', '🍪', '🎂'];
const VEGGIE_EMOJI = ['🥦', '🥕', '🥬', '🌽'];
const EMOJI_SIZE = 96; // Doubled the size of the falling emojis

const spriteCache = new Map();

async function initSpriteCache() {
  const allEmoji = [...CANDY_EMOJI, ...VEGGIE_EMOJI];
  const canvas = document.createElement('canvas');
  canvas.width = EMOJI_SIZE;
  canvas.height = EMOJI_SIZE;
  const ctx = canvas.getContext('2d');

  for (const emoji of allEmoji) {
    ctx.clearRect(0, 0, EMOJI_SIZE, EMOJI_SIZE);
    ctx.font = `${EMOJI_SIZE - 8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, EMOJI_SIZE / 2, EMOJI_SIZE / 2);
    const bitmap = await createImageBitmap(canvas);
    spriteCache.set(emoji, bitmap);
  }
}

function getSprite(emoji) {
  return spriteCache.get(emoji);
}

const LEVELS = [
  { speed: 2,   maxObjects: 2, veggieRatio: 0.20 },
  { speed: 2.5, maxObjects: 3, veggieRatio: 0.25 },
  { speed: 3,   maxObjects: 3, veggieRatio: 0.30 },
  { speed: 3.5, maxObjects: 4, veggieRatio: 0.35 },
  { speed: 4,   maxObjects: 5, veggieRatio: 0.40 },
];

class FallingObject {
  constructor(canvasWidth, level) {
    const config = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    const isVeggie = Math.random() < config.veggieRatio;

    this.isCandy = !isVeggie;
    const pool = isVeggie ? VEGGIE_EMOJI : CANDY_EMOJI;
    this.emoji = pool[Math.floor(Math.random() * pool.length)];
    this.sprite = getSprite(this.emoji);

    this.x = Math.random() * (canvasWidth - EMOJI_SIZE);
    this.y = -EMOJI_SIZE;
    this.speed = config.speed;
    this.size = EMOJI_SIZE;
    this.rotation = (Math.random() - 0.5) * 0.5;
    this.rotationAngle = 0;
    this.alive = true;
  }

  update() {
    this.y += this.speed;
    this.rotationAngle += this.rotation;
  }

  draw(ctx) {
    if (!this.sprite) return;
    ctx.save();
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.rotationAngle);
    ctx.drawImage(this.sprite, -this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.size, height: this.size };
  }

  isOffScreen(canvasHeight) {
    return this.y > canvasHeight + this.size;
  }
}

export { initSpriteCache, FallingObject, LEVELS, EMOJI_SIZE };
