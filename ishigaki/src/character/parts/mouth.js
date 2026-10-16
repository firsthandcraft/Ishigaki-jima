import { onHeadSurface } from './face';

// 입 — 기준점: 머리 중심
export const DEFAULT_STYLE = 'smile';

export const styles = {
  // 작은 점 3개를 웃는 곡선으로 배치
  smile: (p, opts, { headR }) => {
    p.fill('#A5523F');
    for (const t of [-1, 0, 1]) {
      p.push();
      onHeadSurface(p, headR, t * 6, -26 + Math.abs(t) * 2.5, -0.12); // 양 끝이 살짝 올라간 웃음
      p.ellipsoid(headR * 0.06, headR * 0.035, headR * 0.03, 5, 4);
      p.pop();
    }
  },
};
