import { cached, surface } from '../geometry';
import { canvasImage } from './patterns';

// 머리 모양 + 얼굴 공통 도우미. 길이 단위는 headR (= 머리 세로 반지름).
// 가로가 1.15배 넓은 납작한 구에서 시작해 볼을 부풀리고 얼굴 앞면을 살짝 눌러 정면에서 얼굴이 넓게 보이게 한다.
export const HEAD_SHAPE = {
  SX: 1.15,      // 가로
  SY: 1.0,       // 세로
  SZ: 1.0,       // 앞뒤
  FLAT: 0.13,    // 얼굴 앞면 눌림 (가운데일수록 더)
  CHEEK: 0.09,   // 볼(얼굴 아래 양옆) 부풀림
};

// 단위 방향(dx, dy, dz; 위 = -y, 앞 = +z) → 머리 표면 위의 점 (headR 단위)
export function headPoint(dx, dy, dz) {
  const { SX, SY, SZ, FLAT, CHEEK } = HEAD_SHAPE;
  const cheek = CHEEK * Math.exp(-(((dy - 0.42) / 0.3) ** 2)) * (0.4 + 0.6 * Math.max(0, dz));
  const flat = 1 - FLAT * Math.max(0, dz) ** 3;
  return [dx * SX * (1 + cheek), dy * SY, dz * SZ * flat * (1 + cheek * 0.5)];
}

// 위도(u: 정수리 0 → 턱 1) · 경도(v) → 방향
const sphereDir = (u, v) => {
  const th = u * Math.PI, ph = v * Math.PI * 2;
  return [Math.sin(th) * Math.sin(ph), -Math.cos(th), Math.sin(th) * Math.cos(ph)];
};

// 머리 메시 (headR = 1). 64 세그먼트
export const headModel = (p) => cached(p, 'head', () =>
  surface(p, 48, 64, (u, v) => headPoint(...sphereDir(u, v))));

// 머리 표면 위의 한 점으로 이동하고 표면에 붙도록 회전한다.
// yawDeg: 좌우(오른쪽 +), pitchDeg: 위아래(위 +), lift: 표면에서 띄우는 거리. 기준점은 머리 중심.
// 회전 뒤 로컬 축: +z = 바깥(표면 밖), +y = 표면을 따라 아래
export function onHeadSurface(p, headR, yawDeg, pitchDeg, lift = 0) {
  const yaw = yawDeg * Math.PI / 180;
  const pitch = pitchDeg * Math.PI / 180;
  const dx = Math.sin(yaw) * Math.cos(pitch), dy = -Math.sin(pitch), dz = Math.cos(yaw) * Math.cos(pitch);
  const [x, y, z] = headPoint(dx, dy, dz);
  p.translate(x * headR + dx * lift, y * headR + dy * lift, z * headR + dz * lift);
  p.rotateY(yaw);
  p.rotateX(pitch);
}

// 귀: 머리 양옆 눈 높이의 작은 반구 (지름 ≈ 0.31 headR)
export function drawEars(p, headR, skinColor) {
  p.fill(skinColor);
  for (const side of [-1, 1]) {
    p.push();
    onHeadSurface(p, headR, side * 90, -6, -headR * 0.03);
    p.ellipsoid(headR * 0.16, headR * 0.16, headR * 0.1, 12, 8);
    p.pop();
  }
}

// ── 얼굴 텍스처 ─────────────────────────────────────────────
// 눈·눈썹·입·볼터치는 1024×1024 캔버스에 그려 얼굴 앞면에 정면으로 투영한다.
// 캔버스 좌표 = 정면에서 본 머리 좌표 (headR 단위, 가운데 0, 아래 +y), 한 변이 2 × FACE_EXTENT.
export const FACE_EXTENT = 1.35;
const TEX = 1024;

// 얼굴 배치 (headR 단위, 정면 기준). 눈: 위에서 55% 지점, 두 눈 간격 = 머리 폭의 42%, 크기 = 머리 폭의 17%
const HEAD_W = 2 * HEAD_SHAPE.SX;
export const FACE_LAYOUT = {
  eyeX: HEAD_W * 0.21,
  eyeY: -1 + 2 * 0.55,
  eyeW: HEAD_W * 0.17,
  eyeH: HEAD_W * 0.17 * 1.18,
  mouthY: 0.47,
  cheekX: HEAD_W * 0.29,
  cheekY: 0.36,
};

// 얼굴 앞면 데칼 메시: 머리 표면에서 살짝 띄운 앞쪽 껍질, uv = 정면 평면 투영
const DECAL_LIFT = 0.012;
export const faceDecalModel = (p) => cached(p, 'faceDecal', () => surface(p, 40, 48, (u, v) => {
  const pitch = (0.5 - u) * Math.PI * 0.85;  // 위 +77° → 아래 -77°
  const yaw = (v - 0.5) * Math.PI * 0.9;     // 왼쪽 -81° → 오른쪽 +81°
  const d = [Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const q = headPoint(...d);
  return [q[0] + d[0] * DECAL_LIFT, q[1] + d[1] * DECAL_LIFT, q[2] + d[2] * DECAL_LIFT];
}, {
  uv: ([x, y]) => [0.5 + x / (2 * FACE_EXTENT), 0.5 + y / (2 * FACE_EXTENT)],
}));

// 동물 주민 얼굴 무늬 (눈·입보다 먼저 그린다). cfg.facePaint = [{ kind, color }, ...]
const FACE_PAINT = {
  // 펭귄: 눈 주위부터 볼까지 넓게 덮는 하얀 얼굴
  mask: (c, { color }) => {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(-0.42, 0.05, 0.5, 0.55, 0, 0, Math.PI * 2);
    c.ellipse(0.42, 0.05, 0.5, 0.55, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(0, 0.45, 0.95, 0.6, 0, 0, Math.PI * 2);
    c.fill();
  },
  // 얼굴 아래쪽 반 (개구리 입가, 고양이 흰 턱)
  lowerHalf: (c, { color }) => {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(0, 0.82, 1.3, 0.62, 0, 0, Math.PI * 2);
    c.fill();
  },
  // 이마 줄무늬 세 줄 (고양이)
  tabby: (c, { color }) => {
    c.strokeStyle = color;
    c.lineWidth = 0.09;
    for (const x of [-0.28, 0, 0.28]) {
      c.beginPath();
      c.moveTo(x * 1.1, -1.0);
      c.lineTo(x * 0.8, -0.55 + Math.abs(x) * 0.25);
      c.stroke();
    }
  },
};

const faceTextures = new WeakMap(); // p → Map(key → image), 오래된 것부터 정리
const MAX_FACES = 32; // 플레이어 + 주민들 + 꾸미는 중인 얼굴이 다 들어가게

// cfg 얼굴에 맞는 텍스처 (같은 조합이면 다시 그리지 않는다)
// draw(part, ctx, opts, layout): 파츠의 'face' 앵커 그리기 함수 호출 (drawCharacter가 넘겨 준다)
export function faceTexture(p, cfg, draw, size = TEX) {
  if (!faceTextures.has(p)) faceTextures.set(p, new Map());
  const cache = faceTextures.get(p);
  const key = [cfg.eyes.style, cfg.eyes.color, cfg.eyes.brows, cfg.mouth.style, cfg.mouth.tongue, cfg.cheeks.style,
    cfg.hair.color, cfg.skinColor, JSON.stringify(cfg.facePaint ?? null), size].join('|');
  if (cache.has(key)) {
    const img = cache.get(key);
    cache.delete(key);
    cache.set(key, img); // 최근 사용으로
    return img;
  }
  const s = size / (2 * FACE_EXTENT);
  const layout = { ...FACE_LAYOUT, hairColor: cfg.hair.color, skinColor: cfg.skinColor };
  const img = canvasImage(p, size, size, (c) => {
    c.clearRect(0, 0, size, size);
    c.setTransform(s, 0, 0, s, size / 2, size / 2);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const paint of cfg.facePaint ?? []) FACE_PAINT[paint.kind]?.(c, paint);
    draw('cheeks', c, cfg.cheeks, layout);
    draw('eyes', c, cfg.eyes, layout);
    draw('mouth', c, cfg.mouth, layout);
  });
  cache.set(key, img);
  if (cache.size > MAX_FACES) {
    const [oldKey, old] = cache.entries().next().value;
    cache.delete(oldKey);
    old.canvas.width = 0; // 메모리 바로 돌려주기
  }
  return img;
}

// 색 섞기 (얼굴 그림용): mix('#rrggbb', '#rrggbb', t) → 'rgb()'
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (n, sh) => (n >> sh) & 255;
  const m = (sh) => Math.round(ch(pa, sh) + (ch(pb, sh) - ch(pa, sh)) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}
