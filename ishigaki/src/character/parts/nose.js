import { onHeadSurface } from './face';

// 코 — 기준점: 머리 중심
export const DEFAULT_STYLE = 'dot';

export const styles = {
  dot: (p, opts, { headR, skinColor }) => {
    p.push();
    onHeadSurface(p, headR, 0, -14, -0.1);
    const c = p.color(skinColor);
    p.fill(p.red(c) * 0.88, p.green(c) * 0.78, p.blue(c) * 0.75);
    p.ellipsoid(headR * 0.07, headR * 0.055, headR * 0.05, 6, 4);
    p.pop();
  },
};
