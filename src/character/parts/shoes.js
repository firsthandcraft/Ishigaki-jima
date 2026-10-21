// 신발 — 기준점: 발목(다리 끝). 앞 = +z, 다리는 -y(위)로 뻗어 있다
export const DEFAULT_STYLE = 'sneakers';

// 맨발 모양 (샌들·슬리퍼·맨발이 같이 쓴다)
function foot(p, skinColor, legR) {
  p.push();
  p.fill(skinColor);
  p.translate(0, legR * 0.3, legR * 0.45);
  p.ellipsoid(legR * 1.05, legR * 0.65, legR * 1.55, 8, 6);
  p.pop();
}

function sole(p, color, legR, thick = 0.3) {
  p.push();
  p.fill(color);
  p.translate(0, legR * (0.9 + thick / 2), legR * 0.45);
  p.ellipsoid(legR * 1.2, legR * thick, legR * 1.75, 8, 4);
  p.pop();
}

export const styles = {
  // accent: 옆 라인 색 (생략하면 없음), sole: 밑창 색 (생략하면 흰색)
  sneakers: (p, { color, accent, sole = '#FAFAFA' }, { legR }) => {
    p.fill(color);
    p.translate(0, legR * 0.35, legR * 0.45);
    p.ellipsoid(legR * 1.25, legR * 0.8, legR * 1.75, 8, 6);
    if (accent) {
      p.push();
      p.translate(0, legR * 0.15, -legR * 0.2);
      p.fill(accent);
      p.ellipsoid(legR * 1.3, legR * 0.18, legR * 1.1, 8, 4);
      p.pop();
    }
    p.fill(sole);
    p.translate(0, legR * 0.55, 0);
    p.ellipsoid(legR * 1.2, legR * 0.3, legR * 1.7, 8, 4);
  },

  // 장화: 무릎 아래까지 올라오는 통 + 둥근 앞코
  boots: (p, { color }, { legR, legLen }) => {
    p.fill(color);
    p.push();
    p.translate(0, -legLen * 0.25, 0);
    p.cylinder(legR * 1.45, legLen * 0.6, 10, 1);
    p.translate(0, -legLen * 0.3, 0);
    p.torus(legR * 1.45, legR * 0.18, 10, 4);
    p.pop();
    p.push();
    p.translate(0, legR * 0.35, legR * 0.45);
    p.ellipsoid(legR * 1.35, legR * 0.85, legR * 1.8, 8, 6);
    p.pop();
    sole(p, p.lerpColor(p.color(color), p.color(0), 0.3), legR, 0.25);
  },

  // 샌들: 맨발 + 밑창 + 끈 두 줄
  sandals: (p, { color }, { legR, skinColor }) => {
    foot(p, skinColor, legR);
    sole(p, color, legR);
    p.fill(color);
    for (const z of [0.15, 0.9]) {
      p.push();
      p.translate(0, legR * 0.25, legR * z);
      p.ellipsoid(legR * 1.12, legR * 0.5, legR * 0.2, 8, 4);
      p.pop();
    }
  },

  // 구두: 날렵한 앞코 + 낮은 굽, 반짝이 하나
  loafers: (p, { color }, { legR }) => {
    p.fill(color);
    p.push();
    p.translate(0, legR * 0.4, legR * 0.55);
    p.ellipsoid(legR * 1.1, legR * 0.7, legR * 1.75, 10, 6);
    p.pop();
    p.push();
    p.translate(0, legR * 0.95, -legR * 0.5);
    p.box(legR * 1.2, legR * 0.4, legR * 0.6);
    p.pop();
    p.push();
    p.fill(255);
    p.translate(legR * 0.35, legR * 0.05, legR * 1.4);
    p.sphere(legR * 0.12, 5, 4);
    p.pop();
  },

  // 슬리퍼: 맨발 + 두꺼운 밑창 + 발등 덮는 밴드
  slippers: (p, { color }, { legR, skinColor }) => {
    foot(p, skinColor, legR);
    sole(p, color, legR, 0.45);
    p.fill(color);
    p.translate(0, legR * 0.35, legR * 0.85);
    p.ellipsoid(legR * 1.18, legR * 0.6, legR * 0.6, 8, 5);
  },

  barefoot: (p, opts, { legR, skinColor }) => {
    foot(p, skinColor, legR);
  },

  // 동물 발: 통통한 둥근 발 (color 생략하면 털색). webbed: 물갈퀴처럼 넓적하게 (펭귄·개구리)
  paws: (p, { color, webbed = false }, { legR, skinColor }) => {
    p.fill(color ?? skinColor);
    p.translate(0, legR * 0.35, legR * (webbed ? 0.7 : 0.45));
    p.ellipsoid(legR * (webbed ? 1.45 : 1.2), legR * 0.62, legR * (webbed ? 1.9 : 1.55), 14, 8);
  },
};
