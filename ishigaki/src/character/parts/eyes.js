import { onHeadSurface } from './face';

// 눈 — 기준점: 머리 중심. 표정 변경이 쉽도록 머리와 분리해서 그린다.
export const DEFAULT_STYLE = 'round';

export const styles = {
  round: (p, { color }, { headR }) => {
    for (const side of [-1, 1]) {
      p.push();
      onHeadSurface(p, headR, side * 24, -2, -0.15);
      p.fill(color);
      p.ellipsoid(headR * 0.13, headR * 0.18, headR * 0.07, 8, 6);
      // 반짝이
      p.translate(headR * 0.04, -headR * 0.06, headR * 0.05);
      p.fill(255);
      p.sphere(headR * 0.04, 5, 4);
      p.pop();
    }
  },
};
