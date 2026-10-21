// 입 — 'face' 앵커: 얼굴 텍스처 캔버스(2D)에 그린다. 좌표는 정면 머리 좌표 (headR 단위, 아래 +y), L.mouthY = 입 높이
export const DEFAULT_STYLE = 'cat';

const LINE = '#6B3A2E';
const INSIDE = '#C8463E';
const TONGUE = '#F28A8A';

const stroke = (c, w = 0.035) => {
  c.strokeStyle = LINE;
  c.lineWidth = w;
  c.stroke();
};

// 아래로 둥근 열린 입 (안쪽 빨강 + 혀)
function openMouth(c, y, w, h, tongueOut = false) {
  const shape = () => {
    c.beginPath();
    c.moveTo(-w, y);
    c.quadraticCurveTo(0, y - 0.02, w, y);
    c.bezierCurveTo(w, y + h * 0.9, -w, y + h * 0.9, -w, y);
    c.closePath();
  };
  shape();
  c.fillStyle = INSIDE;
  c.fill();
  c.save();
  c.clip();
  c.fillStyle = TONGUE;
  c.beginPath();
  c.ellipse(0, y + h * 0.75, w * 0.6, h * 0.42, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  shape();
  stroke(c, 0.025);
  if (tongueOut) {
    c.fillStyle = TONGUE;
    c.beginPath();
    c.ellipse(0, y + h * 0.75, w * 0.42, h * 0.5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#D9696B';
    c.lineWidth = 0.015;
    c.beginPath();
    c.moveTo(0, y + h * 0.5);
    c.lineTo(0, y + h * 0.95);
    c.stroke();
  }
}

export const styles = {
  none: {},

  // 얼굴 폭만큼 넓게 웃는 입 (개구리). 혀를 살짝 내밀 수도
  wide: { face: (c, { tongue = false }, { mouthY }) => {
    const y = mouthY - 0.02;
    if (tongue) {
      c.fillStyle = TONGUE;
      c.beginPath();
      c.ellipse(0.32, y + 0.08, 0.08, 0.1, -0.5, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.moveTo(-0.55, y - 0.08);
    c.quadraticCurveTo(0, y + 0.3, 0.55, y - 0.08);
    stroke(c, 0.045);
  } },

  // 고양이 입 ω (기본)
  cat: { face: (c, opts, { mouthY: y }) => {
    c.beginPath();
    c.moveTo(-0.17, y - 0.02);
    c.quadraticCurveTo(-0.085, y + 0.09, 0, y);
    c.quadraticCurveTo(0.085, y + 0.09, 0.17, y - 0.02);
    stroke(c);
  } },

  smile: { face: (c, opts, { mouthY: y }) => {
    c.beginPath();
    c.moveTo(-0.14, y - 0.02);
    c.quadraticCurveTo(0, y + 0.1, 0.14, y - 0.02);
    stroke(c);
  } },

  // 한쪽만 올라간 능청스러운 입꼬리 (docs/player/player.png 왼쪽)
  smirk: { face: (c, opts, { mouthY: y }) => {
    c.beginPath();
    c.moveTo(-0.16, y + 0.02);
    c.quadraticCurveTo(0.02, y + 0.08, 0.12, y);
    c.quadraticCurveTo(0.17, y - 0.03, 0.19, y - 0.07);
    stroke(c);
  } },

  // 활짝 웃는 열린 입 (docs/player/player.png 오른쪽)
  open: { face: (c, opts, { mouthY: y }) => openMouth(c, y - 0.03, 0.16, 0.2) },

  flat: { face: (c, opts, { mouthY: y }) => {
    c.beginPath();
    c.moveTo(-0.12, y + 0.02);
    c.lineTo(0.12, y + 0.02);
    stroke(c);
  } },

  // 놀란 동그란 입
  oh: { face: (c, opts, { mouthY: y }) => {
    c.beginPath();
    c.ellipse(0, y + 0.04, 0.07, 0.09, 0, 0, Math.PI * 2);
    c.fillStyle = INSIDE;
    c.fill();
    stroke(c, 0.025);
  } },

  // 메롱
  tongue: { face: (c, opts, { mouthY: y }) => openMouth(c, y - 0.03, 0.15, 0.17, true) },

  // 이가 보이게 활짝
  grin: { face: (c, opts, { mouthY: y }) => {
    const w = 0.2, top = y - 0.04, h = 0.2;
    c.beginPath();
    c.moveTo(-w, top);
    c.lineTo(w, top);
    c.bezierCurveTo(w, top + h * 0.9, -w, top + h * 0.9, -w, top);
    c.closePath();
    c.fillStyle = INSIDE;
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = '#FFFFFF';
    c.fillRect(-w, top, w * 2, h * 0.32);
    c.restore();
    stroke(c, 0.025);
  } },
};
