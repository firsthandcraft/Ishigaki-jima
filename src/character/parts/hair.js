import { headPoint, onHeadSurface } from './face';
import { cached, surface } from '../geometry';

// 머리모양 — 기준점: 머리 중심. 길이 단위 R = headR, 각도는 도 (yaw: 오른쪽 +, pitch: 위 +).
// 머리를 통째로 덮지 않고 세 가지 조합으로 만든다 (얼굴 앞면은 항상 드러남):
//   1. cap   : 뒷머리 베이스. 머리보다 약간 큰 껍질에서 얼굴 쪽을 열어 둔 것 (정수리~뒤통수)
//   2. clumps: 앞머리·옆머리 뭉치. 끝이 둥근 늘린 구 두 마디, 끝은 살짝 안쪽으로 말림. 뭉치 사이 홈이 머리결
//   3. locks : 아래로 늘어지는 긴 머리 다발 (포니테일·양갈래·긴 머리)
// 스타일 = 이 조합을 적은 데이터. hidesEars: 귀를 덮는 머리면 귀를 그리지 않는다.
export const DEFAULT_STYLE = 'short';

const DEG = Math.PI / 180;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// 뒷머리 베이스 메시 (R = 1).
//   inflate: 머리보다 몇 배 크게, side/back: 옆·뒤에서 머리가 끝나는 높이 (정수리에서 잰 각도)
//   hairline: 이마 머리선 (정수리에서 잰 각도), open: 얼굴 쪽으로 열린 반각
function capModel(p, { inflate = 1.07, side = 82, back = 115, hairline = 60, open = 74 }) {
  return cached(p, `hairCap|${inflate}|${side}|${back}|${hairline}|${open}`, () => surface(p, 30, 56, (u, v) => {
    const thFront = u * side * DEG; // 얼굴 쪽에서 이 행의 높이 → 이마 머리선(hairline)까지는 앞도 덮는다
    const opening = smooth(hairline * DEG, (hairline + 18) * DEG, thFront) * open * DEG;
    const ph = opening + v * (Math.PI * 2 - 2 * opening); // 0 = 얼굴 정면
    const backness = ((1 - Math.cos(ph)) / 2) ** 1.5;     // 옆 0 → 뒤 1
    const th = u * (side + (back - side) * backness) * DEG;
    const d = [Math.sin(th) * Math.sin(ph), -Math.cos(th), Math.sin(th) * Math.cos(ph)];
    const q = headPoint(...d);
    return [q[0] * inflate, q[1] * inflate, q[2] * inflate];
  }));
}

// 뭉치 하나: 머리 표면 (yaw, pitch)에서 시작해 표면을 따라 휘어 내려오는 매끈한 튜브 (뿌리·끝은 둥글게)
//   len: 길이 (headR 단위, 표면을 따라 잰 길이), w/d: 폭·두께 (지름)
//   tilt: 내려오면서 옆으로 쓸리는 정도 (+ 오른쪽), out: 끝으로 갈수록 바깥으로 들림, curl: 끝이 안쪽으로 말림
//   hang: 이 높이(pitch)보다 아래로는 표면을 떠나 곧게 늘어진다 (옆머리·단발)
const norm = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map(c => c / l);
};
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function clumpModel(p, c) {
  const { yaw, pitch, len, w, d = w * 0.7, tilt = 0, out = 0, curl = 0.5, lift = 0.04, hang = -12 } = c;
  const key = `clump|${yaw}|${pitch}|${len}|${w}|${d}|${tilt}|${out}|${curl}|${lift}|${hang}`;
  return cached(p, key, () => {
    const span = len / DEG, sweep = tilt * 30;
    // 경로 위의 점 (R = 1)
    const path = (t) => {
      const inward = curl * 0.1 * t ** 3;
      const pk = pitch - span * t, yk = yaw + sweep * t;
      const at = (pp, l) => {
        const a = yk * DEG, b = pp * DEG;
        const dir = [Math.sin(a) * Math.cos(b), -Math.sin(b), Math.cos(a) * Math.cos(b)];
        const q = headPoint(...dir);
        return [q[0] + dir[0] * l, q[1] + dir[1] * l, q[2] + dir[2] * l, dir];
      };
      if (pk >= hang) return at(pk, lift + out * 0.4 * t - inward);
      const [x, y, z, dir] = at(hang, lift);
      const h = norm([dir[0], 0, dir[2]]);
      return [x - h[0] * inward * 2, y + (hang - pk) * DEG, z - h[2] * inward * 2, dir];
    };
    // 굵기: 뿌리에서 둥글게 시작해 끝으로 갈수록 가늘어지다 둥글게 닫힘
    const profile = (t) => Math.sqrt(Math.min(1, t / 0.08)) * (1 - 0.42 * t * t) * Math.sqrt(Math.max(0, 1 - Math.max(0, (t - 0.8) / 0.2) ** 2));
    const e = 1e-3;
    return surface(p, 22, 14, (u, v) => {
      const t = Math.min(1, Math.max(0, u));
      const [x, y, z, dir] = path(t);
      const a = path(Math.min(1, t + e)), b = path(Math.max(0, t - e));
      const T = norm([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
      const B = norm(cross3(T, dir));
      const N = cross3(B, T);
      const ang = v * Math.PI * 2, k = profile(t);
      const cw = Math.cos(ang) * w * 0.5 * k, cd = Math.sin(ang) * d * 0.5 * k;
      return [x + B[0] * cw + N[0] * cd, y + B[1] * cw + N[1] * cd, z + B[2] * cw + N[2] * cd];
    }, { center: (u) => path(Math.min(1, Math.max(0, u))).slice(0, 3) });
  });
}

function clump(p, R, c) {
  p.push();
  p.scale(R);
  p.model(clumpModel(p, c));
  p.pop();
}

// 아래로 늘어지는 다발 (매끈한 튜브): (x, y, z)에서 시작해 step씩 n마디 길이
//   r: 굵기(반지름), wave: 좌우 물결, spread: 아래로 갈수록 옆으로 벌어짐, back: 아래로 갈수록 뒤로, taper: 마디마다 가늘어짐
function lockModel(p, { x, y, z, r, n, step = 0.3, wave = 0, spread = 0, back = 0.03, taper = 0.03 }) {
  const key = `lock|${x}|${y}|${z}|${r}|${n}|${step}|${wave}|${spread}|${back}|${taper}`;
  return cached(p, key, () => {
    const sx = Math.sign(x || 1);
    const path = (t) => {
      const k = t * (n - 1);
      return [x + sx * (Math.sin(k * 1.7) * wave + k * spread), y + k * step, z - k * back];
    };
    const profile = (t) => Math.sqrt(Math.min(1, t / 0.06)) * Math.sqrt(Math.max(0, 1 - Math.max(0, (t - 0.88) / 0.12) ** 2));
    const e = 1e-3;
    return surface(p, 8 * n, 14, (u, v) => {
      const t = Math.min(1, Math.max(0, u));
      const c = path(t), a = path(Math.min(1, t + e)), b = path(Math.max(0, t - e));
      const T = norm([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
      const B = norm(cross3(T, [0, 0, 1]));
      const N = cross3(B, T);
      const rr = Math.max(0.05, r - t * (n - 1) * taper) * profile(t);
      const ang = v * Math.PI * 2;
      const cw = Math.cos(ang) * rr * 0.95, cd = Math.sin(ang) * rr * 0.88;
      return [c[0] + B[0] * cw + N[0] * cd, c[1] + B[1] * cw + N[1] * cd, c[2] + B[2] * cw + N[2] * cd];
    }, { center: (u) => path(Math.min(1, Math.max(0, u))) });
  });
}

function lock(p, R, l) {
  p.push();
  p.scale(R);
  p.model(lockModel(p, l));
  p.pop();
}

// 좌우 대칭: 뭉치 목록에 yaw·tilt를 뒤집은 짝을 더한다
const mirror = (list) => list.flatMap(c => [c, { ...c, yaw: -c.yaw, tilt: -(c.tilt ?? 0) }]);

// 자주 쓰는 앞머리·옆머리
const BANGS = {
  // 한쪽으로 넘긴 앞머리
  swept: [
    { yaw: -40, pitch: 46, len: 0.62, w: 0.57, tilt: 0.6 },
    { yaw: -14, pitch: 56, len: 0.72, w: 0.65, tilt: 0.48 },
    { yaw: 12, pitch: 56, len: 0.68, w: 0.62, tilt: 0.34 },
    { yaw: 37, pitch: 47, len: 0.58, w: 0.57, tilt: 0.18 },
  ],
  // 일자 앞머리
  blunt: [-39, -13, 13, 39].map(yaw => ({ yaw, pitch: 52, len: 0.66, w: 0.59, curl: 0.6 })),
  // 가운데 가르마
  parted: mirror([
    { yaw: 15, pitch: 57, len: 0.72, w: 0.62, tilt: 0.6 },
    { yaw: 40, pitch: 44, len: 0.7, w: 0.57, tilt: 0.32 },
  ]),
};
const SIDES = {
  // 귀 앞뒤로 짧게
  short: mirror([
    { yaw: 70, pitch: 26, len: 0.6, w: 0.46, tilt: -0.1 },
    { yaw: 115, pitch: 22, len: 0.55, w: 0.51 },
    { yaw: 150, pitch: 18, len: 0.5, w: 0.54 },
  ]),
  // 턱선까지 (단발)
  chin: mirror([
    { yaw: 64, pitch: 20, len: 1.0, w: 0.59, curl: 0.7 },
    { yaw: 92, pitch: 18, len: 1.05, w: 0.7, curl: 0.7 },
    { yaw: 122, pitch: 14, len: 1.05, w: 0.76, curl: 0.7 },
    { yaw: 152, pitch: 12, len: 1.05, w: 0.78, curl: 0.7 },
  ]).concat([{ yaw: 180, pitch: 12, len: 1.05, w: 0.78, curl: 0.7 }]),
};

// 스타일 데이터 → 그리기 함수
function hairStyle({ cap = {}, clumps = [], locks = [], extra, hidesEars = false }) {
  const head = (p, { color }, { headR: R }) => {
    p.fill(color);
    p.specularMaterial(28);
    p.shininess(10); // 살짝 윤기 (roughness 0.6 정도)
    p.push();
    p.scale(R);
    p.model(capModel(p, cap));
    p.pop();
    for (const c of clumps) clump(p, R, c);
    for (const l of locks) lock(p, R, l);
    extra?.(p, R, color);
  };
  return { head, hidesEars };
}

// 머리끈
const tie = (p, R) => {
  p.push();
  p.fill('#F07A8A');
  p.sphere(R * 0.12, 10, 8);
  p.pop();
};

export const styles = {
  // 머리카락 없음 (동물 주민). 귀는 종 파츠가 따로 그린다
  none: { head: () => {}, hidesEars: true },

  // 숏컷: 옆으로 넘긴 앞머리 + 귀 앞뒤 짧은 옆머리
  short: hairStyle({ cap: { side: 80, back: 112 }, clumps: [...BANGS.swept, ...SIDES.short] }),

  // 부스스한 짧은 머리 (docs/player/player.png 왼쪽): 정수리에서 사방으로 삐친 뭉치
  messy: hairStyle({
    cap: { side: 82, back: 114, inflate: 1.09 },
    clumps: [
      ...BANGS.swept.map((c, i) => ({ ...c, tilt: c.tilt + (i % 2 ? -0.35 : 0.2), len: c.len * 1.08 })),
      ...SIDES.short,
      ...[0, 40, 80, 120, 160, 200, 240, 280, 320].map((yaw, i) => ({
        yaw, pitch: 62 + (i % 3) * 7, len: 0.6, w: 0.4, out: 0.5, tilt: (i % 2 ? 0.4 : -0.4), lift: 0.06,
      })),
    ],
  }),

  // 단발: 옆으로 넘긴 앞머리 + 턱선 옆·뒷머리
  bob: hairStyle({ cap: { side: 84, back: 120 }, clumps: [...BANGS.swept, ...SIDES.chin], hidesEars: true }),

  // 앞머리 일자 + 어깨에 닿는 생머리
  bangs: hairStyle({
    cap: { side: 84, back: 120 },
    clumps: [...BANGS.blunt, ...SIDES.chin.map(c => ({ ...c, len: c.len * 1.35, curl: 0.35 }))],
    hidesEars: true,
  }),

  // 포니테일: 뒤통수 위에서 묶어 늘어뜨림
  ponytail: hairStyle({
    cap: { side: 80, back: 112 },
    clumps: [...BANGS.swept, ...SIDES.short],
    extra: (p, R) => {
      p.push();
      p.translate(0, -R * 0.5, -R * 1.08);
      tie(p, R);
      lock(p, R, { x: 0, y: 0.25, z: -0.12, r: 0.3, n: 5, step: 0.27, wave: 0.05 });
      p.pop();
    },
  }),

  // 양갈래: 귀 위에서 묶은 두 다발
  pigtails: hairStyle({
    cap: { side: 82, back: 115 },
    clumps: BANGS.blunt,
    hidesEars: true,
    extra: (p, R) => {
      for (const side of [-1, 1]) {
        p.push();
        p.translate(side * R * 1.18, -R * 0.2, -R * 0.2);
        tie(p, R);
        lock(p, R, { x: side * 0.12, y: 0.2, z: 0, r: 0.3, n: 4, step: 0.28, spread: 0.06 });
        p.pop();
      }
    },
  }),

  // 곱슬: 동글동글한 작은 뭉치를 머리 둘레에 촘촘히 (얼굴 앞은 비움)
  curly: hairStyle({
    cap: { side: 84, back: 118, inflate: 1.08 },
    hidesEars: true,
    extra: (p, R) => {
      for (const pitch of [-5, 15, 35, 55, 75]) {
        const n = Math.round(14 * Math.cos(pitch * DEG)) + 3;
        for (let i = 0; i < n; i++) {
          const yaw = (i / n) * 360 - 180 + (pitch % 2 ? 9 : 0);
          if (Math.abs(yaw) < 62 && pitch < 40) continue; // 얼굴
          p.push();
          onHeadSurface(p, R, yaw, pitch, R * 0.08);
          p.sphere(R * 0.24, 12, 8);
          p.pop();
        }
      }
      for (const yaw of [-30, -10, 10, 30]) {
        p.push();
        onHeadSurface(p, R, yaw, 50 - Math.abs(yaw) * 0.2, R * 0.06);
        p.sphere(R * 0.22, 12, 8);
        p.pop();
      }
    },
  }),

  // 삭발: 머리에 딱 붙은 얇은 껍질만
  buzz: hairStyle({ cap: { inflate: 1.025, side: 84, back: 112, hairline: 68 } }),

  // 투블럭: 얇게 친 옆·뒤 + 위에 얹은 볼륨, 앞으로 내린 앞머리
  twoblock: hairStyle({
    cap: { inflate: 1.03, side: 86, back: 114, hairline: 66 },
    clumps: [
      ...BANGS.swept.map(c => ({ ...c, tilt: c.tilt * 0.5, len: c.len * 0.9 })),
      ...[-60, -20, 20, 60, 120, 160, 200, 240].map(yaw => ({ yaw, pitch: 66, len: 0.65, w: 0.5, lift: 0.07, curl: 0.3 })),
    ],
  }),

  // 똥머리: 정수리 위에 동그랗게 올림
  bun: hairStyle({
    cap: { side: 80, back: 112 },
    clumps: [...BANGS.swept.slice(1), ...SIDES.short],
    extra: (p, R) => {
      p.push();
      p.translate(0, -R * 1.18, -R * 0.2);
      p.sphere(R * 0.42, 16, 12);
      p.translate(0, R * 0.32, 0);
      p.rotateX(Math.PI / 2);
      p.fill('#F07A8A');
      p.torus(R * 0.27, R * 0.06, 16, 6);
      p.pop();
    },
  }),

  // 긴 생머리: 가운데 가르마 + 허리까지 곧게
  longStraight: hairStyle({
    cap: { side: 86, back: 125 },
    clumps: BANGS.parted,
    hidesEars: true,
    locks: [
      ...[-1, 1].flatMap(s => [
        { x: s * 1.08, y: 0.0, z: 0.1, r: 0.3, n: 7, step: 0.3, back: 0.02, taper: 0.01 },
        { x: s * 1.0, y: 0.0, z: -0.4, r: 0.34, n: 7, step: 0.3, back: 0.02, taper: 0.01 },
        { x: s * 0.6, y: 0.1, z: -0.85, r: 0.36, n: 7, step: 0.3, back: 0.0, taper: 0.01 },
      ]),
      { x: 0, y: 0.1, z: -0.95, r: 0.38, n: 7, step: 0.3, back: 0, taper: 0.01 },
    ],
  }),

  // 긴 웨이브 머리 (docs/player/player.png 오른쪽): 가르마 앞머리 + 물결치며 퍼지는 긴 머리
  longWavy: hairStyle({
    cap: { side: 86, back: 122, inflate: 1.08 },
    clumps: BANGS.parted.map(c => ({ ...c, len: c.len * 1.1 })),
    hidesEars: true,
    locks: [
      ...[-1, 1].flatMap(s => [
        { x: s * 1.12, y: 0.0, z: 0.12, r: 0.34, n: 8, step: 0.24, wave: 0.07, spread: 0.025 },
        { x: s * 1.05, y: -0.05, z: -0.38, r: 0.4, n: 8, step: 0.24, wave: 0.08, spread: 0.03 },
        { x: s * 0.6, y: 0.05, z: -0.85, r: 0.42, n: 8, step: 0.24, wave: 0.07 },
      ]),
      { x: 0, y: 0.05, z: -0.95, r: 0.42, n: 8, step: 0.24, wave: 0.06 },
    ],
  }),
};
