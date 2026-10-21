import { onHeadSurface } from './face';
import { cached, surface } from '../geometry';

// 코 — 기준점: 머리 중심. 코는 텍스처가 아니라 얼굴에서 살짝 튀어나온 작은 3D 메시
// 위치: 두 눈 사이 약간 아래 (정면 y ≈ 0.27 headR)
export const DEFAULT_STYLE = 'triangle';

const NOSE_PITCH = -15;

// 피부색보다 살짝 진한 색
const skinShade = (p, skinColor, k = 1) => {
  const c = p.color(skinColor);
  return p.color(p.red(c) * (1 - 0.12 * k), p.green(c) * (1 - 0.22 * k), p.blue(c) * (1 - 0.25 * k));
};

// 둥근 삼각형 베개 모양 (꼭짓점이 위). 반지름 1, 앞으로 depth만큼 볼록
const roundTriangle = (p) => cached(p, 'noseTri', () => surface(p, 10, 36, (u, v) => {
  const th = u * Math.PI / 2;           // 0 = 앞 꼭대기, π/2 = 얼굴에 닿는 가장자리
  const ph = v * Math.PI * 2;
  const k = ((ph + Math.PI / 2) % (Math.PI * 2 / 3) + Math.PI * 2 / 3) % (Math.PI * 2 / 3);
  const tri = Math.cos(Math.PI / 3) / Math.cos(k - Math.PI / 3);
  const r = 0.72 * tri + 0.28;          // 삼각형과 원을 섞어 모서리를 둥글게
  return [Math.sin(th) * Math.cos(ph) * r, Math.sin(th) * Math.sin(ph) * r, Math.cos(th) * 0.55];
}, { center: [0, 0, -0.2] }));

export const styles = {
  // 둥근 삼각형 코 (기본). color 생략하면 #F2A07B
  triangle: (p, { color = '#F2A07B' }, { headR }) => {
    p.push();
    onHeadSurface(p, headR, 0, NOSE_PITCH, -headR * 0.02);
    p.fill(color);
    p.scale(headR * 0.12);
    p.model(roundTriangle(p));
    p.pop();
  },

  // 코 없음 (부리가 있는 주민 등)
  none: () => {},

  // 넓적한 부리 (갓파·펭귄). size: 크기 배율
  beak: (p, { color = '#F2C230', size = 1 }, { headR: R }) => {
    p.push();
    onHeadSurface(p, R, 0, -16, -R * 0.05);
    p.fill(color);
    p.ellipsoid(R * 0.36 * size, R * 0.15 * size, R * 0.3 * size, 20, 12);
    p.translate(0, R * 0.08 * size, -R * 0.02);
    p.fill(p.lerpColor(p.color(color), p.color('#B5651D'), 0.35));
    p.ellipsoid(R * 0.3 * size, R * 0.07 * size, R * 0.24 * size, 16, 8);
    p.pop();
  },

  // 동물 코: 반짝이는 동그란 코 (강아지·사자 = 진한 색, 고양이 = 분홍)
  pet: (p, { color = '#2A1E1A', size = 1 }, { headR: R }) => {
    p.push();
    onHeadSurface(p, R, 0, -12, -R * 0.02);
    p.fill(color);
    p.specularMaterial(80);
    p.shininess(30);
    p.ellipsoid(R * 0.15 * size, R * 0.1 * size, R * 0.1 * size, 14, 10);
    p.pop();
  },

  // 콧구멍 두 점 (개구리)
  nostrils: (p, opts, { headR: R, skinColor }) => {
    p.fill(skinShade(p, skinColor, 2.2));
    for (const side of [-1, 1]) {
      p.push();
      onHeadSurface(p, R, side * 6, -2, 0);
      p.sphere(R * 0.035, 6, 4);
      p.pop();
    }
  },

  dot: (p, opts, { headR, skinColor }) => {
    p.push();
    onHeadSurface(p, headR, 0, NOSE_PITCH, -headR * 0.02);
    p.fill(skinShade(p, skinColor));
    p.ellipsoid(headR * 0.08, headR * 0.06, headR * 0.06, 10, 8);
    p.pop();
  },

  // 동그란 단추 코
  button: (p, opts, { headR, skinColor }) => {
    p.push();
    onHeadSurface(p, headR, 0, NOSE_PITCH, -headR * 0.04);
    p.fill(skinShade(p, skinColor, 0.6));
    p.sphere(headR * 0.12, 12, 10);
    p.pop();
  },

  // 옆으로 넓적한 코
  wide: (p, opts, { headR, skinColor }) => {
    p.push();
    onHeadSurface(p, headR, 0, NOSE_PITCH, -headR * 0.02);
    p.fill(skinShade(p, skinColor, 1.2));
    p.ellipsoid(headR * 0.15, headR * 0.065, headR * 0.07, 12, 8);
    p.pop();
  },

  // 세로로 짧은 콧날
  line: (p, opts, { headR, skinColor }) => {
    p.push();
    onHeadSurface(p, headR, 2, NOSE_PITCH + 3, -headR * 0.01);
    p.fill(skinShade(p, skinColor, 1.6));
    p.ellipsoid(headR * 0.03, headR * 0.1, headR * 0.035, 8, 6);
    p.pop();
  },

  // 점 코 + 양 볼 주근깨
  freckles: (p, opts, ctx) => {
    styles.dot(p, opts, ctx);
    const { headR, skinColor } = ctx;
    p.fill(skinShade(p, skinColor, 1.8));
    for (const side of [-1, 1]) {
      for (const [y, pi] of [[30, -14], [36, -17], [33, -20]]) {
        p.push();
        onHeadSurface(p, headR, side * y, pi, 0);
        p.sphere(headR * 0.022, 5, 4);
        p.pop();
      }
    }
  },
};
