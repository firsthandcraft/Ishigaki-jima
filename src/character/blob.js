import { cached, surface, tube, roundedRadius } from './geometry';
import { canvasImage } from './parts/patterns';

// 몸통 하나로 된 말랑한 주민 (새우튀김 친구, 갈색 말랑이). 원점 = 발바닥 중앙, 앞 = +z, 위 = -y.
// 몸은 세로 단면 profile(t)을 돌려 만든 덩어리, 팔·다리는 작은 튜브/구, 얼굴은 몸 앞면에 붙인 작은 3D 조각.
//   def.blob = { kind, color, ... } (character/residents.js)

// 몸 모양: t = 0 (꼭대기) ~ 1 (바닥) → 반지름, 옆으로 휜 정도
const SHAPES = {
  // 새우튀김: 아래가 통통하고 위로 갈수록 가늘어지며 살짝 휜 몸
  ebi: { H: 17, depth: 0.85, radius: (t) => 4.3 * Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.04)) ** 0.7 * (0.45 + 0.55 * t), bend: (t) => Math.sin(t * Math.PI) * 1.6 },
  // 갈색 말랑이: 위아래로 둥근 두툼한 알약 모양
  mochi: { H: 14, depth: 0.82, radius: (t) => 5.2 * Math.pow(Math.max(0, 1 - Math.abs(2 * t - 1) ** 3.2), 0.4), bend: () => 0 },
};

const bodyModel = (p, kind) => cached(p, `blob|${kind}`, () => {
  const { H, depth, radius, bend } = SHAPES[kind];
  return surface(p, 32, 40, (u, v) => {
    const r = radius(u), ph = v * Math.PI * 2;
    return [bend(u) + Math.sin(ph) * r, -H + u * H, Math.cos(ph) * r * depth];
  }, { uv: (pos, u, v) => [v, u], center: (u) => [bend(u), -H + u * H, 0] });
});

// 튀김옷 텍스처: 노릇한 바탕에 진한 빵가루 점
const crumbs = (p, base) => cached(p, `crumbs|${base}`, () => canvasImage(p, 128, 128, (c) => {
  c.fillStyle = base;
  c.fillRect(0, 0, 128, 128);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = rnd() < 0.5 ? 'rgba(170,95,20,0.35)' : 'rgba(255,230,150,0.35)';
    c.beginPath();
    c.arc(rnd() * 128, rnd() * 128, 1 + rnd() * 2.2, 0, Math.PI * 2);
    c.fill();
  }
}));

// 몸 앞면 위의 점 (t 높이, side: 좌우 -1~1 비율)
function front(kind, t, side = 0) {
  const { H, depth, radius, bend } = SHAPES[kind];
  const r = radius(t);
  const a = side * 0.9; // 둘레 각도
  return [bend(t) + Math.sin(a) * r, -H + t * H, Math.cos(a) * r * depth];
}

const limb = (p, len, r) => cached(p, `limb|${len}|${r}`, () => tube(p, 12, (t) => [0, t * len, 0], roundedRadius(r)));

function face(p, kind, { eye = '#2A1A14', cheek = 'rgba(247,140,110,0.75)', mouth }) {
  const at = (t, side, lift = 0.15) => {
    const [x, y, z] = front(kind, t, side);
    p.translate(x, y, z + lift);
  };
  p.noStroke();
  // 눈
  for (const side of [-1, 1]) {
    p.push();
    at(kind === 'ebi' ? 0.5 : 0.38, side * 0.32);
    p.rotateY(side * 0.3);
    p.fill(eye);
    p.ellipsoid(0.42, kind === 'ebi' ? 0.62 : 0.42, 0.2, 10, 8);
    p.pop();
    // 볼
    p.push();
    at(kind === 'ebi' ? 0.6 : 0.46, side * 0.46, 0.05);
    p.rotateY(side * 0.45);
    p.fill(cheek);
    p.ellipsoid(0.85, 0.55, 0.15, 12, 8);
    p.pop();
  }
  // 입
  p.fill(mouth ?? '#4A2A1E');
  if (kind === 'ebi') {
    p.push();
    at(0.66, 0.05, 0.1);
    p.ellipsoid(0.75, 0.5, 0.22, 12, 8);
    p.translate(0, -0.15, 0.12);
    p.fill('#FFFFFF');
    p.ellipsoid(0.38, 0.18, 0.15, 8, 6);
    p.pop();
  } else {
    // 길게 웃는 입: 작은 알갱이를 이은 곡선
    for (let i = -6; i <= 6; i++) {
      const s = i / 6;
      p.push();
      at(0.44 + (1 - s * s) * 0.04, s * 0.4, 0.05);
      p.sphere(0.16, 6, 4);
      p.pop();
    }
  }
}

// anim: drawCharacter와 같은 { phase, move, time }
export function drawBlob(p, def, anim) {
  const { kind, color, limbColor = color, accent } = def.blob;
  const { H } = SHAPES[kind];
  const move = Math.min(anim.move, 1);
  const swing = Math.sin(anim.phase) * 0.6 * move;
  const waddle = Math.sin(anim.phase) * 0.1 * move;
  const bob = Math.abs(Math.sin(anim.phase)) * 0.6 * move;
  const breath = 1 + Math.sin(anim.time * 2.4) * 0.02 * (1 - move);

  // 다리 (짧은 튜브 + 둥근 발)
  for (const side of [-1, 1]) {
    p.push();
    p.translate(side * (kind === 'ebi' ? 1.3 : 2.2), -1.9, 0);
    p.rotateX(side * swing);
    p.fill(limbColor);
    if (kind === 'ebi') {
      p.model(limb(p, 1.9, 0.5));
      p.translate(0, 1.8, 0.35);
      p.ellipsoid(0.7, 0.45, 0.95, 10, 8);
    } else {
      p.translate(0, 1.2, 0.9);
      p.ellipsoid(1.7, 0.95, 2.0, 14, 10);
    }
    p.pop();
  }

  p.push();
  p.translate(0, -(kind === 'ebi' ? 1.4 : 0.4) - bob, 0); // 말랑이는 둥근 바닥이 발에 얹히게 더 낮게
  p.rotateZ(waddle);
  p.scale(1, breath, 1);
  if (kind === 'ebi') p.texture(crumbs(p, color));
  else p.fill(color);
  p.model(bodyModel(p, kind));

  if (kind === 'ebi') {
    // 꼬리 지느러미: 꼭대기에 부채처럼 펼친 세 갈래
    const top = front('ebi', 0.02, 0);
    p.push();
    p.translate(top[0], -H + 1.4, 0);
    for (const a of [-0.55, 0, 0.55]) {
      p.push();
      p.rotateZ(a);
      p.translate(0, -1.0, 0);
      p.fill('#4A2A1E');
      p.ellipsoid(0.85, 1.25, 0.35, 12, 8);
      p.translate(0, -0.1, 0.18);
      p.fill(accent ?? '#E8542E');
      p.ellipsoid(0.48, 0.8, 0.25, 10, 6);
      p.pop();
    }
    p.pop();
    // 팔: 가는 막대 팔
    for (const side of [-1, 1]) {
      const [x, y, z] = front('ebi', 0.62, side);
      p.push();
      p.translate(x - side * 0.3, y, z * 0.2);
      p.rotateZ(-side * (1.1 - swing * 0.3));
      p.fill(limbColor);
      p.model(limb(p, 3.0, 0.42));
      p.pop();
    }
  } else {
    // 옆 주름 (지느러미처럼 물결진 옆선)
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        p.push();
        p.translate(side * 5.0, -H * (0.25 + i * 0.12), -1.2);
        p.fill(color);
        p.sphere(0.9 - i * 0.08, 10, 8);
        p.pop();
      }
      // 배 위에 얹은 작은 앞발
      const [x, y, z] = front('mochi', 0.62, side * 0.42);
      p.push();
      p.translate(x, y, z + 0.1);
      p.rotateZ(side * 0.3 + swing * 0.2);
      p.fill(color);
      p.ellipsoid(1.0, 1.35, 0.7, 12, 10);
      p.pop();
    }
  }

  face(p, kind, def.blob);
  p.pop();
}

// 덩어리 주민의 키 (말풍선 높이 등에 쓴다)
export const blobHeight = (def) => SHAPES[def.blob.kind].H + (def.blob.kind === 'ebi' ? 1.4 : 0.4);
