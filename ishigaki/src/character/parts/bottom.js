// 하의 — 앵커별로 그린다.
//   hips: 기준점 = 엉덩이 중심
//   leg:  기준점 = 고관절, 다리는 +y(아래)로 뻗음
export const DEFAULT_STYLE = 'shorts';

export const styles = {
  shorts: {
    hips: (p, { color }, { bodyR }) => {
      p.fill(color);
      p.cylinder(bodyR * 1.02, bodyR * 0.55, 12, 1);
    },
    leg: (p, { color }, { legR }) => {
      p.fill(color);
      p.translate(0, legR * 1.2, 0);
      p.cylinder(legR * 1.45, legR * 2.4, 8, 1);
    },
  },
};
