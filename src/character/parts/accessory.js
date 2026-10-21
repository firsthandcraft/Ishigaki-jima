import { headPoint, onHeadSurface } from './face';
import { cached, surface } from '../geometry';

// 액세서리 — 앵커별로 그린다.
//   head: 기준점 = 머리 중심 (모자, 안경, 머리띠, 꽃핀)
//   body: 기준점 = 몸통 중심 (가방)
export const DEFAULT_STYLE = 'none';

const DEG = Math.PI / 180;

// 머리 모양을 따라 부풀린 껍질의 일부 (정수리에서 잰 각도 th0~th1). 모자 몸통·머리띠에 쓴다 (R = 1)
const shell = (p, inflate, th0, th1) => cached(p, `accShell|${inflate}|${th0}|${th1}`, () => surface(p, 12, 40, (u, v) => {
  const th = (th0 + (th1 - th0) * u) * DEG, ph = v * Math.PI * 2;
  const q = headPoint(Math.sin(th) * Math.sin(ph), -Math.cos(th), Math.sin(th) * Math.cos(ph));
  return q.map(c => c * inflate);
}));

export const styles = {
  none: {},

  // 보잉 선글라스 (docs/player/player.png 왼쪽). color = 렌즈, frame = 테
  aviators: { head: (p, { color = '#2B2320', frame = '#8A847C' }, { headR }) => {
    for (const side of [-1, 1]) {
      p.push();
      onHeadSurface(p, headR, side * 25, -4, headR * 0.06);
      p.fill(frame);
      p.ellipsoid(headR * 0.3, headR * 0.25, headR * 0.05, 16, 8);
      p.translate(0, 0, headR * 0.025);
      p.fill(color);
      p.ellipsoid(headR * 0.27, headR * 0.22, headR * 0.05, 16, 8);
      p.pop();
      // 다리: 관자놀이 → 귀 (머리 표면을 따라 뒤로)
      p.push();
      onHeadSurface(p, headR, side * 70, 0, headR * 0.06);
      p.fill(frame);
      p.box(headR * 0.62, headR * 0.04, headR * 0.04);
      p.pop();
    }
    p.push();
    onHeadSurface(p, headR, 0, 2, headR * 0.12);
    p.fill(frame);
    p.box(headR * 0.22, headR * 0.035, headR * 0.035);
    p.pop();
  } },

  // 금색 머리핀 (docs/player/player.png 오른쪽)
  hairclip: { head: (p, { color = '#D4A94E' }, { headR }) => {
    p.push();
    onHeadSurface(p, headR, 38, 34, headR * 0.16);
    p.rotateZ(-0.6);
    p.fill(color);
    p.ellipsoid(headR * 0.2, headR * 0.08, headR * 0.06, 10, 6);
    p.pop();
  } },

  // 야구 모자: 머리를 덮는 둥근 몸통 + 앞챙 + 꼭지 단추
  cap: { head: (p, { color = '#3B6CB5' }, { headR: R }) => {
    p.fill(color);
    p.push();
    p.scale(R);
    p.model(shell(p, 1.3, 0, 62)); // 머리카락 뭉치 두께까지 덮게
    p.pop();
    p.push();
    onHeadSurface(p, R, 0, 30, R * 0.3);
    p.rotateX(-1.15); // 챙이 앞으로 눕도록
    p.translate(0, 0, R * 0.36);
    p.ellipsoid(R * 0.78, R * 0.05, R * 0.5, 20, 6);
    p.pop();
    p.push();
    p.translate(0, -R * 1.3, 0);
    p.sphere(R * 0.09, 8, 6);
    p.pop();
  } },

  // 머리에 두른 천 머리띠 + 옆 매듭
  headband: { head: (p, { color = '#F2F0EC' }, { headR: R }) => {
    p.fill(color);
    p.push();
    p.scale(R);
    p.model(shell(p, 1.27, 36, 54));
    p.pop();
    p.push();
    onHeadSurface(p, R, 40, 40, R * 0.32);
    for (const side of [-1, 1]) {
      p.push();
      p.rotateZ(side * 0.7);
      p.translate(side * R * 0.16, 0, 0);
      p.ellipsoid(R * 0.17, R * 0.09, R * 0.06, 10, 6);
      p.pop();
    }
    p.sphere(R * 0.07, 8, 6);
    p.pop();
  } },

  // 공사장 안전모: 단단한 둥근 몸통 + 둘레 챙 + 가운데 능선
  hardhat: { head: (p, { color = '#F2C230' }, { headR: R }) => {
    p.fill(color);
    p.push();
    p.scale(R);
    p.model(shell(p, 1.33, 0, 64));
    p.model(shell(p, 1.45, 62, 70));
    p.pop();
    p.push();
    p.translate(0, -R * 1.3, 0);
    p.scale(1, 1, 1.6);
    p.sphere(R * 0.14, 10, 8);
    p.pop();
  } },

  // 백팩: 등 뒤 둥근 가방 + 어깨끈
  backpack: { body: (p, { color = '#3B5BA9' }, { bodyH, bodyRTop, bodyRBot, bodyDepth }) => {
    p.fill(color);
    p.push();
    p.translate(0, -bodyH * 0.05, -(bodyRBot * bodyDepth + bodyRBot * 0.32));
    p.ellipsoid(bodyRTop * 0.95, bodyH * 0.42, bodyRBot * 0.42, 16, 10);
    p.pop();
    for (const side of [-1, 1]) {
      p.push();
      p.translate(side * bodyRTop * 0.55, -bodyH * 0.2, 0);
      p.scale(1, 1, bodyDepth);
      p.rotateY(Math.PI / 2); // 어깨를 앞뒤로 감는 고리
      p.torus(bodyRTop * 0.95, 0.16, 16, 6);
      p.pop();
    }
  } },
};
