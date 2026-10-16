// 신발 — 기준점: 발목(다리 끝). 앞 = +z
export const DEFAULT_STYLE = 'sneakers';

export const styles = {
  sneakers: (p, { color }, { legR }) => {
    p.fill(color);
    p.translate(0, legR * 0.35, legR * 0.45);
    p.ellipsoid(legR * 1.25, legR * 0.8, legR * 1.75, 8, 6);
    // 흰 밑창
    p.fill(250);
    p.translate(0, legR * 0.55, 0);
    p.ellipsoid(legR * 1.2, legR * 0.3, legR * 1.7, 8, 4);
  },
};
