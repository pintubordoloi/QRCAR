const SIZE = 33;

function hashSeed(seed) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(seed) {
  let value = hashSeed(seed);
  return () => {
    value = (1664525 * value + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function isFinderArea(x, y) {
  const zones = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];

  return zones.some(([startX, startY]) => x >= startX && x < startX + 7 && y >= startY && y < startY + 7);
}

function createFinderPattern(matrix, startX, startY) {
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const globalX = startX + x;
      const globalY = startY + y;
      const outerRing = x === 0 || y === 0 || x === 6 || y === 6;
      const innerRing = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      matrix[globalY][globalX] = outerRing || innerRing ? 1 : 0;
    }
  }
}

export function buildDummyMatrix(seed = 'preview-only') {
  const rand = random(`${seed}-qr-designer`);
  const matrix = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));

  // These finder-like blocks are visual only and are not tied to any encoded payload.
  createFinderPattern(matrix, 0, 0);
  createFinderPattern(matrix, SIZE - 7, 0);
  createFinderPattern(matrix, 0, SIZE - 7);

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (isFinderArea(x, y)) {
        continue;
      }

      const mirrored = (x * y + x + y) % 5 === 0;
      const stripe = x % 4 === 0 || y % 6 === 0;
      const noise = rand() > 0.58;
      matrix[y][x] = mirrored ^ stripe ^ noise ? 1 : 0;
    }
  }

  return matrix;
}

export function isInCorner(x, y, size = SIZE) {
  return (
    (x < 7 && y < 7) ||
    (x >= size - 7 && y < 7) ||
    (x < 7 && y >= size - 7)
  );
}

export const DUMMY_QR_SIZE = SIZE;
