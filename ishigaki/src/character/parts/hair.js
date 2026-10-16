// 머리모양 — 기준점: 머리 중심. 앞 = +z, 위 = -y. ctx.headR = 머리 반지름
// 얼굴 앞쪽 아래는 비워 둬야 눈·코·입이 보인다.
export const DEFAULT_STYLE = 'short';

export const styles = {
  short: (p, { color }, { headR }) => {
    p.fill(color);
    // 뒷머리
    p.push();
    p.translate(0, -headR * 0.12, -headR * 0.22);
    p.ellipsoid(headR * 1.04, headR * 0.98, headR * 0.92, 12, 10);
    p.pop();
    // 정수리
    p.push();
    p.translate(0, -headR * 0.42, 0);
    p.ellipsoid(headR * 1.06, headR * 0.66, headR * 1.04, 12, 8);
    p.pop();
    // 앞머리
    p.push();
    p.translate(0, -headR * 0.58, headR * 0.6);
    p.rotateX(-0.35);
    p.ellipsoid(headR * 0.86, headR * 0.3, headR * 0.42, 10, 6);
    p.pop();
  },
};
