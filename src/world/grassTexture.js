import { GRASS } from './config';
import { mulberry32 } from './mesh';

// 동물의 숲 잔디 텍스처 (Three.js CanvasTexture 대신 p5.Graphics): 진한 초록 바탕에 작은 삼각형을 흩뿌린다.
// 가장자리에 걸친 삼각형은 반대편에도 그려서 반복해 깔아도 이음매가 안 보인다.
export function makeGrassTexture(p) {
  const S = GRASS.SIZE;
  const g = p.createGraphics(S, S);
  g.pixelDensity(1);
  g.noStroke();
  g.background(GRASS.base);
  const rng = mulberry32(GRASS.SEED);
  const alpha = Math.round(GRASS.ALPHA * 255);
  for (let i = 0; i < GRASS.COUNT; i++) {
    const x = rng() * S, y = rng() * S;
    const size = GRASS.TRI_MIN + rng() * (GRASS.TRI_MAX - GRASS.TRI_MIN);
    const rot = rng() * Math.PI * 2;
    const hex = rng() < GRASS.LIGHT_CHANCE ? GRASS.light : GRASS.tris[Math.floor(rng() * GRASS.tris.length)];
    const c = g.color(hex);
    c.setAlpha(alpha);
    g.fill(c);
    for (const ox of [-S, 0, S]) {
      for (const oy of [-S, 0, S]) {
        if (x + ox < -size || x + ox > S + size || y + oy < -size || y + oy > S + size) continue;
        g.push();
        g.translate(x + ox, y + oy);
        g.rotate(rot);
        // 살짝 길쭉한 이등변 삼각형 (풀잎 끝 느낌)
        g.triangle(0, -size * 0.6, -size * 0.45, size * 0.4, size * 0.45, size * 0.4);
        g.pop();
      }
    }
  }
  return g;
}
