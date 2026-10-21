import { resolveStyle } from './parts';
import { SPECIES } from './species';
import { drawEars, faceDecalModel, faceTexture, headModel } from './parts/face';
import { cached, surface } from './geometry';

// 2.5등신 치비 캐릭터. 원점 = 발바닥 중앙, 앞 = +z, 위 = -y (p5 좌표).
// 비율은 "전체 키 1.4" 기준 설계값을 월드 단위로 옮긴 것 (1.4 → 약 22).
//   머리 높이 0.58 · 폭 0.66 / 몸통 높이 0.38 · 폭 위 0.30 아래 0.36 / 다리 0.32 / 팔 0.36 · 굵기 0.06 / 손 지름 0.11
// 파츠는 자기 기준점 기준으로만 그리고, 위치·회전·걷기 애니메이션은 여기서 잡는다.
const U = 22 / 1.4;

const BODY = {
  headR: 0.29 * U,         // 머리 세로 반지름 (가로는 HEAD_SHAPE.SX배)
  bodyH: 0.38 * U,         // 몸통 높이
  bodyRTop: 0.15 * U,      // 몸통 위쪽 반폭
  bodyRBot: 0.18 * U,      // 몸통 아래쪽 반폭
  bodyDepth: 0.78,         // 몸통 앞뒤 두께 / 폭
  hipY: -0.34 * U,         // 고관절 높이 (몸통 아랫면 살짝 안쪽)
  hipX: 0.062 * U,         // 다리 간격 (좁게)
  legR: 0.054 * U,         // 짧고 굵은 다리
  legLen: 0.28 * U,        // 고관절 → 발목
  armR: 0.03 * U,          // 팔 굵기 0.06
  armLen: 0.3 * U,         // 어깨 → 손목 (손까지 0.36)
  handR: 0.055 * U,        // 손: 지름 0.11 구
  armSpread: 25 * Math.PI / 180, // A자 자세: 몸통 바깥으로 벌어진 각도
};
BODY.bodyR = (BODY.bodyRTop + BODY.bodyRBot) / 2;
const TORSO_Y = BODY.hipY + 0.04 * U - BODY.bodyH / 2;                 // 몸통 중심 (아랫면이 고관절 바로 아래)
const HEAD_Y = TORSO_Y - BODY.bodyH / 2 + 0.035 * U - BODY.headR;       // 목 없음: 머리가 몸통 위에 살짝 겹쳐 얹힘
const SHOULDER = { x: BODY.bodyRTop * 0.85, y: TORSO_Y - BODY.bodyH / 2 + 0.035 * U };
export const CHARACTER_HEIGHT = -HEAD_Y + BODY.headR;

const SKIN_EMISSIVE = [58, 26, 16].map(c => c * 0.05); // #3A1A10 × 0.05 → 피부가 칙칙하지 않게 아주 약하게

// 몸통: 아래가 살짝 넓은 사다리꼴, 위·아래 모서리를 아주 둥글게. 단면은 앞뒤로 납작한 타원
// from/to: 위(0) ~ 아래(1) 중 그릴 구간, inflate: 바깥으로 부풀릴 거리 (옷을 겹쳐 입힐 때)
const ROUND = 5; // 클수록 각진 상자, 작을수록 둥근 알
function torsoModel(p, from, to, inflate) {
  const { bodyH, bodyRTop, bodyRBot, bodyDepth } = BODY;
  return cached(p, `torso|${from}|${to}|${inflate}`, () => surface(p, 24, 40, (u, v) => {
    const t = from + (to - from) * u;
    const r = (bodyRTop + (bodyRBot - bodyRTop) * t) * Math.pow(Math.max(0, 1 - Math.abs(2 * t - 1) ** ROUND), 1 / ROUND);
    const ph = v * Math.PI * 2;
    const y = (-bodyH / 2 + t * bodyH) * (1 + inflate / (bodyH / 2)); // 위·아래 면도 inflate만큼 바깥으로
    return [Math.sin(ph) * (r + inflate), y, Math.cos(ph) * (r * bodyDepth + inflate)];
  }, { uv: (pos, u, v) => [v, u] })); // 옷 무늬: 가로 = 둘레, 세로 = 높이
}
function torso(p, { from = 0, to = 1, inflate = 0 } = {}) {
  p.model(torsoModel(p, from, to, inflate));
}

const ctx = { ...BODY, skinColor: '', torso }; // 파츠에 넘기는 치수·도우미 (매 프레임 새로 만들지 않게 재사용)

const call = (style, anchor, p, opts, c) => {
  const fn = typeof style === 'function' ? style : style?.[anchor];
  if (typeof fn === 'function') {
    p.push();
    fn(p, opts, c);
    p.pop();
  }
};

function skin(p, color) {
  p.fill(color);
  p.emissiveMaterial(...SKIN_EMISSIVE);
}

// anim: { phase (걸음 위상), move (0=정지 ~ 1=걷기, 1.8=달리기), time (초), shadow (false면 발밑 그림자 생략),
//         faceSize (얼굴 텍스처 크기, 생략하면 1024) }
export function drawCharacter(p, cfg, anim) {
  ctx.skinColor = cfg.skinColor;
  // 동물 주민이면 종 파츠 (귀·부리·갈기·꼬리 등). 플레이어·사람 주민은 없음
  const species = cfg.species ? SPECIES[cfg.species.id] : null;
  const style = (part) => resolveStyle(part, cfg[part].style);
  const move = Math.min(anim.move, 1);
  const swing = Math.sin(anim.phase) * 0.6 * move;
  const bob = Math.abs(Math.sin(anim.phase)) * 0.8 * move;
  const breath = 1 + Math.sin(anim.time * 2.6) * 0.022 * (1 - move);

  // 발밑 둥근 그림자 (동물의 숲 느낌의 핵심). 크기가 다른 원을 겹쳐 가장자리를 부드럽게
  if (anim.shadow !== false) {
    p.push();
    p.translate(0, -0.25, 0);
    p.rotateX(Math.PI / 2);
    for (const [k, a] of [[1.15, 22], [0.95, 26], [0.72, 30]]) {
      p.translate(0, 0, -0.03);
      p.fill(30, 70, 40, a);
      p.ellipse(0, 0, 11 * k, 9 * k, 20);
    }
    p.pop();
  }

  // 다리 (몸통 bobbing과 별개로 땅에 붙어 있음)
  for (const side of [-1, 1]) {
    p.push();
    p.translate(side * BODY.hipX, BODY.hipY, 0);
    p.rotateX(side * swing);
    p.push();
    skin(p, cfg.skinColor);
    p.translate(0, BODY.legLen / 2, 0);
    p.cylinder(BODY.legR, BODY.legLen, 16, 1);
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
  p.translate(0, -BODY.hipY, 0);

  // 몸통 (피부) + 하의 + 상의 — 기준점은 모두 몸통 중심
  p.push();
  p.translate(0, TORSO_Y, 0);
  p.push();
  skin(p, cfg.skinColor);
  torso(p);
  p.pop();
  call(species, 'torso', p, cfg.species, ctx); // 배 무늬·등껍질·꼬리 (옷 아래)
  call(style('bottom'), 'hips', p, cfg.bottom, ctx);
  call(style('top'), 'body', p, cfg.top, ctx);
  call(style('accessory'), 'body', p, cfg.accessory, ctx);
  p.pop();

  // 팔: 어깨에서 25° 벌어진 A자, 걸을 때 다리와 반대로 흔들기. 손은 손가락 없는 구
  for (const side of [-1, 1]) {
    p.push();
    p.translate(side * SHOULDER.x, SHOULDER.y, 0);
    p.rotateZ(-side * BODY.armSpread);
    p.rotateX(-side * swing * 1.1);
    p.push();
    skin(p, cfg.skinColor);
    p.translate(0, BODY.armLen / 2, 0);
    p.cylinder(BODY.armR, BODY.armLen, 12, 1);
    p.translate(0, BODY.armLen / 2 + BODY.handR * 0.55, 0);
    p.sphere(BODY.handR, 20, 14);
    p.pop();
    call(style('top'), 'sleeve', p, cfg.top, ctx);
    p.pop();
  }

  // 머리: 피부 → 귀 → 코(3D) → 머리카락 → 얼굴 텍스처(눈·입·볼) → 액세서리
  // 얼굴 텍스처는 투명한 부분이 뒤의 머리카락을 가리지 않게 머리카락 뒤에 그린다
  const R = BODY.headR;
  p.push();
  p.translate(0, HEAD_Y, 0);
  p.rotateX(-0.06 * move);
  p.push();
  skin(p, cfg.skinColor);
  p.push();
  p.scale(R);
  p.model(headModel(p));
  p.pop();
  if (!species && !style('hair').hidesEars) drawEars(p, R, cfg.skinColor);
  p.pop();
  call(style('nose'), 'head', p, cfg.nose, ctx);
  call(style('hair'), 'head', p, cfg.hair, ctx);
  call(species, 'head', p, cfg.species, ctx);
  p.push();
  p.texture(faceTexture(p, cfg, (part, c, opts, layout) => style(part).face?.(c, opts, layout), anim.faceSize));
  p.scale(R);
  p.model(faceDecalModel(p));
  p.pop();
  call(style('accessory'), 'head', p, cfg.accessory, ctx);
  p.pop();

  p.pop();
}
