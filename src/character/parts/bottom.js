import { dots } from './patterns';

// 하의 — 앵커별로 그린다.
//   hips: 기준점 = 몸통 중심. ctx.torso(p, { from, to, inflate })로 몸통 아랫부분을 감싼다
//   leg:  기준점 = 고관절, 다리는 +y(아래)로 뻗음
export const DEFAULT_STYLE = 'shorts';

const CLOTH = 0.22; // 상의보다 바깥 (상의 밑단을 덮음)

function fillPants(p, { color, pattern, dot = '#FFFFFF' }) {
  if (pattern === 'dots') p.texture(dots(p, color, dot));
  else p.fill(color);
}

// 몸통 아랫부분 (허리 ~ 엉덩이)
const waist = (p, ctx) => ctx.torso(p, { from: 0.74, to: 1, inflate: CLOTH });

export const styles = {
  // 원피스처럼 상의가 하의까지 덮을 때
  none: { hips: () => {}, leg: () => {} },

  // 발목까지 오는 긴 바지. pattern: 'dots'면 잠옷 물방울 무늬 (dot = 무늬 색)
  pants: {
    hips: (p, opts, ctx) => {
      fillPants(p, opts);
      waist(p, ctx);
    },
    leg: (p, opts, { legR, legLen }) => {
      fillPants(p, opts);
      p.translate(0, legLen * 0.44, 0);
      p.cylinder(legR * 1.3, legLen * 0.88, 16, 1);
    },
  },

  shorts: {
    hips: (p, { color }, ctx) => {
      p.fill(color);
      waist(p, ctx);
    },
    leg: (p, { color }, { legR, legLen }) => {
      p.fill(color);
      p.translate(0, legLen * 0.2, 0);
      p.cylinder(legR * 1.4, legLen * 0.42, 16, 1);
    },
  },

  // A라인 데님 스커트 (docs/player/player.png 오른쪽). 다리는 맨다리
  skirt: {
    hips: (p, { color, band = '#3F6590', button = '#C99A4A' }, ctx) => {
      const { bodyH, bodyRBot, bodyDepth, legLen } = ctx;
      p.fill(color);
      waist(p, ctx);
      const y0 = bodyH / 2 - bodyH * 0.24, y1 = bodyH / 2 + legLen * 0.45;
      const r0 = bodyRBot + CLOTH, r1 = bodyRBot * 1.5;
      const slope = (r1 - r0) / (y1 - y0);
      const n = Math.hypot(1, slope);
      p.beginShape(p.TRIANGLE_STRIP);
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const c = Math.cos(a), s = Math.sin(a);
        p.normal(s / n, -slope / n, c / n);
        p.vertex(s * r0, y0, c * r0 * bodyDepth);
        p.vertex(s * r1, y1, c * r1 * bodyDepth);
      }
      p.endShape();
      // 허리 밴드 + 단추
      p.push();
      p.translate(0, y0, 0);
      p.scale(1, 1, bodyDepth);
      p.fill(band);
      p.cylinder(r0 + 0.04, 0.5, 24, 1);
      p.pop();
      p.push();
      p.translate(0, y0, r0 * bodyDepth + 0.08);
      p.fill(button);
      p.sphere(0.22, 8, 6);
      p.pop();
    },
    leg: () => {},
  },
};
