// 볼터치 — 'face' 앵커: 얼굴 텍스처 캔버스(2D)에 그린다. 눈 바로 아래 바깥쪽, 가장자리가 흐린 분홍 타원
export const DEFAULT_STYLE = 'pink';

export const styles = {
  none: {},
  pink: { face: (c, opts, L) => {
    for (const side of [-1, 1]) {
      c.save();
      c.translate(side * L.cheekX, L.cheekY);
      c.scale(1, 0.62);
      const r = 0.2;
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, 'rgba(247,169,160,0.55)');
      g.addColorStop(0.55, 'rgba(247,169,160,0.42)');
      g.addColorStop(1, 'rgba(247,169,160,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  } },
};
