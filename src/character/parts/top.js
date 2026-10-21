import { stripes, hstripes, dots, checker } from './patterns';

// 상의 — 몸통과 팔 위쪽을 감싸는 별도 메시. 위치·회전(팔 흔들기)은 drawCharacter가 잡아 준다.
//   body:   기준점 = 몸통 중심. ctx.torso(p, { from, to, inflate })로 몸통 모양을 그대로 부풀려 입힌다
//   sleeve: 기준점 = 어깨 관절, 팔은 +y(아래)로 뻗음 (ctx.armR, ctx.armLen)
// 색·텍스처는 호출 전에 fill/texture로 정해 두고, 아래 도우미는 모양만 그린다.
export const DEFAULT_STYLE = 'tshirt';

const CLOTH = 0.14; // 옷 두께 (몸통에서 띄우는 거리)

const shade = (p, color, k) => p.lerpColor(p.color(color), p.color(0), k);

// 몸통 앞면 z (t: 위 0 ~ 아래 1)
const frontZ = ({ bodyRTop, bodyRBot, bodyDepth }, t, inflate = CLOTH) =>
  (bodyRTop + (bodyRBot - bodyRTop) * t) * bodyDepth + inflate;
const yAt = ({ bodyH }, t) => -bodyH / 2 + t * bodyH;

// 둥근 반팔 (팔 위쪽만 감쌈)
function shortSleeve(p, { armR, armLen }) {
  p.translate(0, armLen * 0.16, 0);
  p.ellipsoid(armR * 2.1, armLen * 0.24, armR * 2.1, 16, 10);
}

// 손목까지 오는 소매. cuff를 주면 소매 끝을 그 색으로
function longSleeve(p, { armR, armLen }, cuff) {
  p.push();
  p.translate(0, armLen * 0.12, 0);
  p.ellipsoid(armR * 2.0, armLen * 0.2, armR * 2.0, 16, 10);
  p.pop();
  p.push();
  p.translate(0, armLen * 0.5, 0);
  p.cylinder(armR * 1.6, armLen * 0.86, 16, 1);
  p.pop();
  if (cuff) {
    p.translate(0, armLen * 0.9, 0);
    p.fill(cuff);
    p.cylinder(armR * 1.75, armR * 1.1, 16, 1);
  }
}

// 위가 좁고 아래가 넓은 치마 (원피스)
function flare(p, r0, r1, y0, y1, depth) {
  const SEGS = 32;
  const slope = (r1 - r0) / (y1 - y0);
  const n = Math.hypot(1, slope);
  p.beginShape(p.TRIANGLE_STRIP);
  for (let i = 0; i <= SEGS; i++) {
    const a = (i / SEGS) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    p.normal(s / n, -slope / n, c / n);
    p.vertex(s * r0, y0, c * r0 * depth);
    p.vertex(s * r1, y1, c * r1 * depth);
  }
  p.endShape();
}

function buttons(p, count, color, ctx) {
  p.fill(color);
  for (let i = 0; i < count; i++) {
    const t = 0.22 + i * 0.22;
    p.push();
    p.translate(0, yAt(ctx, t), frontZ(ctx, t) + 0.02);
    p.sphere(0.2, 8, 6);
    p.pop();
  }
}

// 둥근 목선 테두리
function neckline(p, color, ctx) {
  p.push();
  p.translate(0, -ctx.bodyH / 2 + 0.25, 0);
  p.fill(color);
  p.scale(1, 1, ctx.bodyDepth);
  p.rotateX(Math.PI / 2);
  p.torus(ctx.bodyRTop * 0.62, 0.16, 20, 8);
  p.pop();
}

export const styles = {
  // 옷 없음 (동물 주민)
  none: {},

  // 알록달록 체크 조끼 (민소매). colors: 체크 색 4개
  patchwork: {
    body: (p, { colors = ['#E94B3C', '#F2C94C', '#3B6CC9', '#4CAF50'] }, ctx) => {
      p.texture(checker(p, colors));
      ctx.torso(p, { from: 0.04, to: 0.86, inflate: CLOTH });
    },
  },

  tshirt: {
    body: (p, { color }, ctx) => {
      p.fill(color);
      ctx.torso(p, { to: 0.88, inflate: CLOTH });
      neckline(p, shade(p, color, 0.1), ctx);
    },
    sleeve: (p, { color }, ctx) => {
      p.fill(color);
      shortSleeve(p, ctx);
    },
  },

  longsleeve: {
    body: (p, { color }, ctx) => {
      p.fill(color);
      ctx.torso(p, { to: 0.9, inflate: CLOTH });
      neckline(p, shade(p, color, 0.12), ctx);
    },
    sleeve: (p, { color }, ctx) => {
      p.fill(color);
      longSleeve(p, ctx, shade(p, color, 0.12));
    },
  },

  // 후드티: 목 뒤 모자 + 배 주머니 + 끈
  hoodie: {
    body: (p, { color }, ctx) => {
      const { bodyH, bodyRTop } = ctx;
      p.fill(color);
      ctx.torso(p, { to: 0.95, inflate: CLOTH * 1.6 });
      p.push();
      p.translate(0, -bodyH / 2 - 0.1, -bodyRTop * 0.55);
      p.ellipsoid(bodyRTop * 0.95, bodyH * 0.16, bodyRTop * 0.55, 16, 10);
      p.pop();
      p.fill(shade(p, color, 0.12));
      p.push();
      p.translate(0, yAt(ctx, 0.68), frontZ(ctx, 0.68, CLOTH * 1.6));
      p.ellipsoid(bodyRTop * 0.7, bodyH * 0.1, 0.12, 16, 6);
      p.pop();
      p.fill('#FFFFFF');
      for (const side of [-1, 1]) {
        p.push();
        p.translate(side * 0.5, yAt(ctx, 0.2), frontZ(ctx, 0.2, CLOTH * 1.6) + 0.05);
        p.cylinder(0.09, bodyH * 0.22, 6, 1);
        p.pop();
      }
    },
    sleeve: (p, { color }, ctx) => {
      p.fill(color);
      longSleeve(p, ctx, shade(p, color, 0.12));
    },
  },

  // 원피스: 몸통에서 허벅지까지 퍼지는 치마 + 흰 카라
  dress: {
    body: (p, { color, collar = '#FFFFFF' }, ctx) => {
      const { bodyH, bodyRBot, bodyRTop, bodyDepth, legLen } = ctx;
      p.fill(color);
      ctx.torso(p, { to: 0.7, inflate: CLOTH });
      flare(p, bodyRBot * 0.98 + CLOTH, bodyRBot * 1.55, yAt(ctx, 0.5), bodyH / 2 + legLen * 0.4, bodyDepth);
      p.fill(collar);
      for (const side of [-1, 1]) {
        p.push();
        p.translate(side * bodyRTop * 0.3, -bodyH / 2 + 0.35, frontZ(ctx, 0.08) - 0.1);
        p.rotateZ(side * 0.5);
        p.rotateX(-0.6);
        p.ellipsoid(bodyRTop * 0.36, bodyRTop * 0.2, 0.12, 12, 6);
        p.pop();
      }
    },
    sleeve: (p, { color }, ctx) => {
      p.fill(color);
      p.translate(0, ctx.armLen * 0.12, 0);
      p.ellipsoid(ctx.armR * 2.4, ctx.armLen * 0.2, ctx.armR * 2.4, 16, 10);
    },
  },

  // 멜빵바지 윗부분: 티셔츠(color) 위에 가슴판 + 어깨끈(strap). 아랫부분은 하의 pants
  overalls: {
    body: (p, { color, strap = '#5683B5' }, ctx) => {
      const { bodyRTop } = ctx;
      p.fill(color);
      ctx.torso(p, { to: 0.88, inflate: CLOTH });
      p.fill(strap);
      p.push();
      p.translate(0, yAt(ctx, 0.48), frontZ(ctx, 0.48) + 0.02);
      p.box(bodyRTop * 1.15, ctx.bodyH * 0.36, 0.14);
      p.pop();
      for (const side of [-1, 1]) {
        p.push();
        p.translate(side * bodyRTop * 0.45, yAt(ctx, 0.15), frontZ(ctx, 0.15) - 0.25);
        p.rotateX(-0.45);
        p.box(0.42, ctx.bodyH * 0.36, 0.14);
        p.pop();
        p.push();
        p.fill('#E8C25A');
        p.translate(side * bodyRTop * 0.42, yAt(ctx, 0.33), frontZ(ctx, 0.33) + 0.1);
        p.sphere(0.2, 8, 6);
        p.pop();
      }
    },
    sleeve: (p, { color }, ctx) => {
      p.fill(color);
      shortSleeve(p, ctx);
    },
  },

  // 줄무늬 셔츠 (docs/player/player.png 오른쪽): 카라 + 단추 + 팔꿈치까지 걷은 소매
  // color = 바탕, stripe = 줄무늬, collar = 카라·소매 끝 (생략하면 바탕색)
  shirt: {
    body: (p, { color, stripe = '#FFFFFF' }, ctx) => {
      const { bodyH, bodyRTop } = ctx;
      p.texture(stripes(p, color, stripe));
      ctx.torso(p, { to: 0.9, inflate: CLOTH });
      p.fill(color);
      for (const side of [-1, 1]) {
        p.push();
        p.translate(side * bodyRTop * 0.32, -bodyH / 2 + 0.3, frontZ(ctx, 0.06) - 0.05);
        p.rotateZ(side * 0.7);
        p.rotateX(-0.6);
        p.ellipsoid(bodyRTop * 0.38, bodyRTop * 0.17, 0.12, 12, 6);
        p.pop();
      }
      buttons(p, 3, '#FFFFFF', ctx);
    },
    sleeve: (p, { color, stripe = '#FFFFFF', collar }, ctx) => {
      const { armR, armLen } = ctx;
      p.texture(stripes(p, color, stripe));
      p.push();
      p.translate(0, armLen * 0.12, 0);
      p.ellipsoid(armR * 2.0, armLen * 0.2, armR * 2.0, 16, 10);
      p.pop();
      p.translate(0, armLen * 0.36, 0);
      p.cylinder(armR * 1.65, armLen * 0.6, 16, 1);
      // 걷어 올린 소매 끝
      p.translate(0, armLen * 0.3, 0);
      p.fill(collar ?? color);
      p.cylinder(armR * 1.85, armR * 1.2, 16, 1);
    },
  },

  // 폭신한 터틀넥 스웨터: 목 + 밑단·소매 끝 고무단
  sweater: {
    body: (p, { color }, ctx) => {
      const { bodyH, bodyRTop, bodyRBot, bodyDepth } = ctx;
      p.fill(color);
      ctx.torso(p, { to: 0.92, inflate: CLOTH * 1.8 });
      const rib = shade(p, color, 0.14);
      p.fill(rib);
      p.push();
      p.translate(0, -bodyH / 2 - 0.05, 0);
      p.scale(1, 1, bodyDepth);
      p.cylinder(bodyRTop * 0.62, 0.7, 20, 1);
      p.pop();
      p.push();
      p.translate(0, yAt(ctx, 0.86), 0);
      p.scale(1, 1, bodyDepth);
      p.cylinder(bodyRBot * 1.02 + CLOTH * 1.8, 0.55, 24, 1);
      p.pop();
    },
    sleeve: (p, { color }, ctx) => {
      p.fill(color);
      longSleeve(p, { ...ctx, armR: ctx.armR * 1.12 }, shade(p, color, 0.14));
    },
  },

  // 가로 줄무늬 티셔츠
  stripeTee: {
    body: (p, { color, stripe = '#3B5BA9' }, ctx) => {
      p.texture(hstripes(p, color, stripe));
      ctx.torso(p, { to: 0.88, inflate: CLOTH });
    },
    sleeve: (p, { color, stripe = '#3B5BA9' }, ctx) => {
      p.texture(hstripes(p, color, stripe));
      shortSleeve(p, ctx);
    },
  },

  // 민소매: 팔은 맨살
  tank: {
    body: (p, { color }, ctx) => {
      p.fill(color);
      ctx.torso(p, { from: 0.04, to: 0.88, inflate: CLOTH });
    },
    sleeve: () => {},
  },

  // 물방울 무늬 잠옷 + 하얀 단추
  pajamas: {
    body: (p, { color, dot = '#FFFFFF' }, ctx) => {
      p.texture(dots(p, color, dot));
      ctx.torso(p, { to: 0.92, inflate: CLOTH });
      buttons(p, 3, dot, ctx);
    },
    sleeve: (p, { color, dot = '#FFFFFF' }, ctx) => {
      p.texture(dots(p, color, dot));
      longSleeve(p, ctx, dot);
    },
  },
};
