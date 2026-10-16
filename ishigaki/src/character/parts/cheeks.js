import { onHeadSurface } from './face';

// 볼터치 — 기준점: 머리 중심
export const DEFAULT_STYLE = 'pink';

export const styles = {
  pink: (p, opts, { headR }) => {
    p.fill('#F7B3B8');
    for (const side of [-1, 1]) {
      p.push();
      onHeadSurface(p, headR, side * 40, -20, -0.25);
      p.ellipsoid(headR * 0.15, headR * 0.09, headR * 0.05, 8, 4);
      p.pop();
    }
  },
};
