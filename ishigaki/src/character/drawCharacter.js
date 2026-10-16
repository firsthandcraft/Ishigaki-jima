import { resolveStyle } from './parts';

// 2~2.5등신 치비 캐릭터. 원점 = 발바닥 중앙, 앞 = +z, 위 = -y (p5 좌표).
// 파츠는 자기 기준점 기준으로만 그리고, 위치·회전·걷기 애니메이션은 여기서 잡는다.
const BODY = {
  headR: 6.2,
  bodyR: 3.0,
  bodyH: 4.6,
  hipY: -5.2,      // 고관절 높이
  hipX: 1.35,
  legR: 0.95,
  legLen: 4.3,
  armR: 0.8,
  armLen: 3.8,
};
const HEAD_Y = BODY.hipY - 0.6 - BODY.bodyH - BODY.headR * 0.9;
export const CHARACTER_HEIGHT = -HEAD_Y + BODY.headR; // 약 22 (scale 전)

const ctx = { ...BODY, skinColor: '' }; // 파츠에 넘기는 치수 (매 프레임 새로 만들지 않게 재사용)

const call = (style, anchor, p, opts, ctx) => {
  const fn = typeof style === 'function' ? style : style?.[anchor];
  if (fn) {
    p.push();
    fn(p, opts, ctx);
    p.pop();
  }
};

// anim: { phase (걸음 위상), move (0=정지 ~ 1=걷기, 1.8=달리기), time (초) }
export function drawCharacter(p, cfg, anim) {
  ctx.skinColor = cfg.skinColor;
  const style = (part) => resolveStyle(part, cfg[part].style);
  const move = Math.min(anim.move, 1);
  const swing = Math.sin(anim.phase) * 0.65 * move;
  const bob = Math.abs(Math.sin(anim.phase)) * 0.9 * move;
  const breath = 1 + Math.sin(anim.time * 2.6) * 0.022 * (1 - move);

  // 발밑 둥근 그림자 (동물의 숲 느낌의 핵심)
  p.push();
  p.translate(0, -0.25, 0);
  p.rotateX(Math.PI / 2);
  p.fill(30, 70, 40, 70);
  p.ellipse(0, 0, 13, 11, 20);
  p.pop();

  // 다리 (몸통 bobbing과 별개로 땅에 붙어 있음)
  for (const side of [-1, 1]) {
    p.push();
    p.translate(side * BODY.hipX, BODY.hipY, 0);
    p.rotateX(side * swing);
    p.push();
    p.translate(0, BODY.legLen / 2, 0);
    p.fill(cfg.skinColor);
    p.cylinder(BODY.legR, BODY.legLen, 8, 1);
    p.pop();
    call(style('bottom'), 'leg', p, cfg.bottom, ctx);
    p.translate(0, BODY.legLen, 0);
    call(style('shoes'), 'foot', p, cfg.shoes, ctx);
    p.pop();
  }

  p.push();
  p.translate(0, -bob, 0);
  p.rotateX(0.08 * Math.min(anim.move, 1.8)); // 달릴수록 앞으로 숙임
  p.translate(0, BODY.hipY, 0);
  p.scale(1, breath, 1);

  // 엉덩이 + 몸통
  p.push();
  p.translate(0, -0.3, 0);
  call(style('bottom'), 'hips', p, cfg.bottom, ctx);
  p.pop();
  p.push();
  p.translate(0, -0.6 - BODY.bodyH / 2, 0);
  call(style('top'), 'body', p, cfg.top, ctx);
  p.pop();

  // 팔 (다리와 반대로 흔들기)
  for (const side of [-1, 1]) {
    p.push();
    p.translate(side * (BODY.bodyR + 0.5), -0.6 - BODY.bodyH + 0.7, 0);
    p.rotateZ(-side * 0.18);
    p.rotateX(-side * swing * 1.1);
    p.push();
    p.translate(0, BODY.armLen / 2, 0);
    p.fill(cfg.skinColor);
    p.cylinder(BODY.armR, BODY.armLen, 8, 1);
    p.translate(0, BODY.armLen / 2, 0);
    p.sphere(BODY.armR * 1.15, 6, 4); // 손
    p.pop();
    call(style('top'), 'sleeve', p, cfg.top, ctx);
    p.pop();
  }

  // 머리 + 얼굴 (얼굴 파츠는 머리와 분리해서 그린다)
  p.push();
  p.translate(0, HEAD_Y - BODY.hipY, 0);
  p.rotateX(-0.06 * move);
  p.fill(cfg.skinColor);
  p.sphere(BODY.headR, 16, 12);
  for (const part of ['eyes', 'nose', 'mouth', 'cheeks', 'hair', 'accessory']) {
    call(style(part), 'head', p, cfg[part], ctx);
  }
  p.pop();

  p.pop();
}
