import { mix } from './face';

// 눈 — 'face' 앵커: 얼굴 텍스처 캔버스(2D)에 그린다. 좌표는 정면에서 본 머리 좌표 (headR 단위, 아래 +y).
// L = FACE_LAYOUT (eyeX·eyeY·eyeW·eyeH, hairColor ...). 눈썹도 여기서 같이 그린다.
// color = 홍채 색 (기본 진갈색)
export const DEFAULT_STYLE = 'lashes';

const LID = '#2A1A14';
const TAU = Math.PI * 2;

function ellipse(c, x, y, rx, ry, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
}

// 눈썹: 눈 위의 짧고 얇은 곡선 (머리색보다 살짝 진하게)
function brow(c, L, side, lift = 0) {
  const x = side * L.eyeX, y = L.eyeY - L.eyeH * 0.5 - 0.15 - lift;
  c.strokeStyle = mix(L.hairColor, '#1A100C', 0.35);
  c.lineWidth = 0.045;
  c.beginPath();
  c.moveTo(x - L.eyeW * 0.32, y + 0.025);
  c.quadraticCurveTo(x, y - 0.035, x + L.eyeW * 0.32, y + 0.025);
  c.stroke();
}

// 기본 눈: 얇은 흰자 테두리 → 큰 홍채(아래로 갈수록 밝게) → 동공 → 하이라이트 2개 → 진한 윗눈꺼풀 (+ 바깥쪽 속눈썹)
// side: -1 = 화면 왼쪽 눈, 1 = 오른쪽 눈. 속눈썹은 바깥쪽(side 방향) 끝에
function eye(c, L, side, iris, { lashes = false, scale = 1, sparkle = false } = {}) {
  const x = side * L.eyeX, y = L.eyeY;
  const rx = L.eyeW / 2 * scale, ry = L.eyeH / 2 * scale;
  c.fillStyle = '#FFFFFF';
  ellipse(c, x, y, rx, ry);
  c.fill();
  const irx = rx * 0.84, iry = ry * 0.86, iy = y + ry * 0.06;
  const g = c.createLinearGradient(0, iy - iry, 0, iy + iry);
  g.addColorStop(0, mix(iris, '#000000', 0.25));
  g.addColorStop(0.55, iris);
  g.addColorStop(1, mix(iris, '#E8B48A', 0.45));
  c.fillStyle = g;
  ellipse(c, x, iy, irx, iry);
  c.fill();
  c.fillStyle = mix(iris, '#000000', 0.7);
  ellipse(c, x, iy + iry * 0.05, irx * 0.48, iry * 0.52);
  c.fill();
  c.fillStyle = '#FFFFFF';
  ellipse(c, x + irx * 0.32, iy - iry * 0.36, irx * 0.32, irx * 0.32);
  c.fill();
  ellipse(c, x - irx * 0.38, iy + iry * 0.42, irx * 0.13, irx * 0.13);
  c.fill();
  if (sparkle) {
    ellipse(c, x - irx * 0.1, iy - iry * 0.55, irx * 0.1, irx * 0.1);
    c.fill();
  }
  // 윗눈꺼풀: 눈 위쪽 테두리를 따라 진하고 두껍게
  c.strokeStyle = LID;
  c.lineWidth = 0.055 * scale;
  c.beginPath();
  c.ellipse(x, y, rx * 1.02, ry * 1.02, 0, Math.PI * 1.08, Math.PI * 1.92);
  c.stroke();
  if (lashes) {
    // 바깥 위쪽 끝에서 짧게 뻗는 속눈썹 3가닥 (아래 가닥일수록 옆으로 눕는다)
    c.lineWidth = 0.032 * scale;
    for (let k = 0; k < 3; k++) {
      const a = side > 0 ? -0.75 + k * 0.28 : Math.PI + 0.75 - k * 0.28;
      const ex = x + Math.cos(a) * rx * 1.02, ey = y + Math.sin(a) * ry * 1.02;
      c.beginPath();
      c.moveTo(ex, ey);
      c.lineTo(ex + side * 0.055, ey - 0.035 + k * 0.022);
      c.stroke();
    }
  }
}

// ^ 모양으로 감은 눈
function closed(c, L, side, color) {
  const x = side * L.eyeX, y = L.eyeY + 0.03;
  c.strokeStyle = mix(color, LID, 0.5);
  c.lineWidth = 0.06;
  c.beginPath();
  c.moveTo(x - L.eyeW * 0.45, y + 0.06);
  c.quadraticCurveTo(x, y - 0.14, x + L.eyeW * 0.45, y + 0.06);
  c.stroke();
}

const face = (fn) => ({ face: fn });
// brows: false면 눈썹 없이 (동물 주민)
const both = (draw) => face((c, opts, L) => {
  for (const side of [-1, 1]) {
    if (opts.brows !== false) brow(c, L, side);
    draw(c, L, side, opts.color ?? '#4A3328');
  }
});

export const styles = {
  // 눈 없음 (개구리처럼 눈을 3D로 따로 다는 주민)
  none: {},

  // 동물 주민용 까만 구슬 눈 + 하이라이트
  bead: both((c, L, side, color) => {
    const x = side * L.eyeX, y = L.eyeY + 0.02;
    c.fillStyle = mix(color, '#000000', 0.55);
    ellipse(c, x, y, L.eyeW * 0.34, L.eyeH * 0.36);
    c.fill();
    c.fillStyle = '#FFFFFF';
    ellipse(c, x + L.eyeW * 0.1, y - L.eyeH * 0.12, L.eyeW * 0.1, L.eyeW * 0.1);
    c.fill();
  }),

  round: both((c, L, side, iris) => eye(c, L, side, iris)),
  lashes: both((c, L, side, iris) => eye(c, L, side, iris, { lashes: true })),

  // 콩알 같은 작은 점눈
  dot: both((c, L, side, iris) => {
    c.fillStyle = mix(iris, '#000000', 0.6);
    ellipse(c, side * L.eyeX, L.eyeY + 0.02, L.eyeW * 0.16, L.eyeH * 0.17);
    c.fill();
  }),

  // 웃어서 감은 눈 (^ ^)
  happy: both((c, L, side, iris) => closed(c, L, side, iris)),

  // 졸린 눈: 위가 눈꺼풀에 덮인 반달
  sleepy: both((c, L, side, iris) => {
    const x = side * L.eyeX, y = L.eyeY;
    c.save();
    c.beginPath();
    c.rect(x - L.eyeW, y - 0.01, L.eyeW * 2, L.eyeH);
    c.clip();
    eye(c, L, side, iris);
    c.restore();
    c.strokeStyle = LID;
    c.lineWidth = 0.055;
    c.beginPath();
    c.moveTo(x - L.eyeW * 0.52, y);
    c.quadraticCurveTo(x, y + 0.02, x + L.eyeW * 0.52, y);
    c.stroke();
  }),

  // 반짝반짝 큰 눈
  sparkle: both((c, L, side, iris) => eye(c, L, side, iris, { lashes: true, scale: 1.12, sparkle: true })),

  // 윙크: 화면 왼쪽은 뜬 눈, 오른쪽은 ^
  wink: both((c, L, side, iris) => (side < 0 ? eye(c, L, side, iris, { lashes: true }) : closed(c, L, side, iris))),

  // 고양이 눈: 바깥 꼬리가 올라간 아몬드
  cat: both((c, L, side, iris) => {
    const x = side * L.eyeX, y = L.eyeY;
    c.save();
    c.translate(x, y);
    c.rotate(-side * 0.25);
    c.beginPath();
    c.ellipse(0, 0, L.eyeW * 0.6, L.eyeH * 0.3, 0, 0, TAU);
    c.clip();
    c.translate(-x, -y);
    eye(c, L, side, iris, { scale: 1.1 });
    c.restore();
    c.save();
    c.translate(x, y);
    c.rotate(-side * 0.25);
    c.strokeStyle = LID;
    c.lineWidth = 0.05;
    c.beginPath();
    c.ellipse(0, 0, L.eyeW * 0.6, L.eyeH * 0.3, 0, Math.PI * 1.05, Math.PI * 1.95);
    c.stroke();
    c.restore();
  }),
};
