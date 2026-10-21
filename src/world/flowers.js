import { FLOWERS, GRID } from './config';
import { hexToRgb01, smoothstep } from './mesh';
import { meshBuilder, lathe, sphere, makeBatches, computeVertexNormals } from './trees';

// 동물의 숲식 꽃 한 송이 (1타일에 하나). 치수는 타일 단위, 원점 = 밑동, y 위쪽 +
// 튤립이 중심 (docs/reference). 코스모스·팬지(docs/flower/folwer.png의 무궁화 느낌)는 가끔 섞인다
// 종류 × 색 조합마다 geometry를 하나씩 만들고 인스턴싱으로 그린다.

const C = FLOWERS.colors;
const rgba = (hex, a = 1) => [...hexToRgb01(hex), a];
const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const darken = (hex, k) => hexToRgb01(hex).map(v => v * k);
const norm = ([x, y, z]) => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (...vs) => vs.reduce((s, v) => s.map((c, i) => c + v[i]));
const mul = (v, k) => v.map(c => c * k);

// 두께 있는 꽃잎 한 장. 꽃 중심에서 yaw 방향으로 뻗고 tilt만큼 위로 들린다.
//   halfWidth(u): 길이 방향 u(0~1)에서의 반폭, curl(u, v): 면에서 위로 휘는 정도 (v: -1~1 폭 방향)
//   color(u): 꽃잎 색 (밑동 → 끝)
function petal(mb, { center, yaw, tilt, length, halfWidth, curl, color, thickness = FLOWERS.PETAL_THICKNESS }) {
  const along = [Math.cos(yaw) * Math.cos(tilt), Math.sin(tilt), Math.sin(yaw) * Math.cos(tilt)];
  const side = norm([-Math.sin(yaw), 0, Math.cos(yaw)]);
  const up = norm(cross(side, along));
  const NU = 6, NV = 4;
  const grid = (offset, flip) => {
    const rows = [];
    for (let i = 0; i <= NU; i++) {
      const u = i / NU;
      const row = [];
      for (let j = 0; j <= NV; j++) {
        const v = (j / NV) * 2 - 1;
        const pt = add(center, mul(along, u * length), mul(side, v * halfWidth(u)), mul(up, curl(u, v) + offset));
        // 노멀: 휘어진 면을 근사 (가장자리로 갈수록 바깥으로 기울게)
        const n = norm(add(mul(up, 1), mul(side, -v * 0.35), mul(along, -0.25)));
        row.push(mb.vertex(pt, flip ? mul(n, -1) : n, [...color(u), 1]));
      }
      rows.push(row);
    }
    return rows;
  };
  const top = grid(thickness / 2, false);
  const bottom = grid(-thickness / 2, true);
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      mb.faces.push([top[i][j], top[i + 1][j], top[i + 1][j + 1]], [top[i][j], top[i + 1][j + 1], top[i][j + 1]]);
      mb.faces.push([bottom[i][j], bottom[i + 1][j + 1], bottom[i + 1][j]], [bottom[i][j], bottom[i][j + 1], bottom[i + 1][j + 1]]);
    }
  }
  // 테두리 (두께 면): 양옆 + 끝
  const rim = [];
  for (let i = 0; i <= NU; i++) rim.push([i, 0]);
  for (let j = 1; j <= NV; j++) rim.push([NU, j]);
  for (let i = NU - 1; i >= 0; i--) rim.push([i, NV]);
  for (let k = 0; k < rim.length - 1; k++) {
    const [i0, j0] = rim[k], [i1, j1] = rim[k + 1];
    mb.faces.push([top[i0][j0], bottom[i0][j0], bottom[i1][j1]], [top[i0][j0], bottom[i1][j1], top[i1][j1]]);
  }
}

// 줄기 + 양옆 잎 2장 (참고 이미지처럼 넓적한 잎)
function stemAndLeaves(mb, height) {
  lathe(mb, [[0.022, 0], [0.018, height * 0.5], [0.016, height]], 6, rgba(C.stem));
  const leaf = hexToRgb01(C.leaf), leafTip = hexToRgb01(C.leafLight);
  for (const yaw of [0.3, 0.3 + Math.PI]) {
    petal(mb, {
      center: [0, 0.03, 0], yaw, tilt: 0.55, length: 0.15,
      halfWidth: u => 0.045 * Math.sin(Math.PI * u) ** 0.8,
      curl: (u, v) => 0.012 * v * v - 0.05 * u * u, // 가운데가 접히고 끝이 처진다
      color: u => mix3(leaf, leafTip, u),
      thickness: 0.008,
    });
  }
}

// 꽃송이(머리)를 (0, H, 0) 기준으로 키운다. 동물의 숲 꽃처럼 줄기에 비해 머리가 큼직하게
function scaleHead(mb, firstVertex, H) {
  const k = FLOWERS.HEAD_SCALE, cy = -H * GRID.TILE * mb.scale; // positions는 p5 좌표 (y 아래 +, 타일 크기·배율 곱해짐)
  for (let i = firstVertex * 3; i < mb.positions.length; i += 3) {
    mb.positions[i] *= k;
    mb.positions[i + 1] = cy + (mb.positions[i + 1] - cy) * k;
    mb.positions[i + 2] *= k;
  }
}

// 1. 튤립 (만개): 높이 0.7 — 캐릭터(1.4) 허리~가슴. 곧고 굵은 줄기(반지름 0.03) + 아래쪽 넓고 긴 잎 2장 +
//    회전체 컵(위가 살짝 열리고 끝이 3갈래로 뾰족). 컵은 안쪽 면과 두께가 있다
const TULIP = {
  stemH: 0.38,
  // 컵 프로필 [반지름, 높이] (컵 밑동 기준). 지름 약 0.33 — 레퍼런스처럼 캐릭터 머리 폭의 0.4쯤
  // 가운데가 가장 넓고 위로 갈수록 오므라드는 달걀형 → 입구만 살짝 열림 (위에서 내려다봐도 안쪽이 다 보이지 않게)
  cup: [[0.0, 0.0], [0.09, 0.02], [0.145, 0.08], [0.165, 0.15], [0.15, 0.22], [0.105, 0.28]],
  tip: 0.06,          // 꽃잎 끝 3갈래가 솟는 높이
  // 봉오리: 작고 끝이 뾰족, 끝부분만 꽃 색
  budStemH: 0.36,
  bud: [[0.0, 0.0], [0.065, 0.025], [0.095, 0.08], [0.09, 0.15], [0.055, 0.21], [0.0, 0.27]],
};

function tulipStem(mb, stemH) {
  lathe(mb, [[0.032, 0], [0.03, stemH * 0.5], [0.028, stemH + 0.03]], 10, rgba(C.stem));
  const leaf = hexToRgb01(C.leaf), leafTip = hexToRgb01(C.leafLight);
  for (const yaw of [0.5, 0.5 + Math.PI]) {
    petal(mb, {
      center: [0, 0.02, 0], yaw, tilt: 1.2, length: 0.42,
      halfWidth: u => 0.1 * Math.sin(Math.PI * Math.min(1, 0.05 + u)) ** 0.6,
      curl: (u, v) => 0.025 * v * v - 0.24 * u * u, // 가운데가 접히고, 위로 갈수록 바깥으로 휜다
      color: u => mix3(leaf, leafTip, u),
      thickness: 0.01,
    });
  }
}

// 회전체 컵: 바깥 면 + 안쪽 면(살짝 작고 진하게) + 윗 테두리로 두께. rim(θ): 각도별 윗단 추가 높이
function cup(mb, { y0, profile, rim, color, innerColor }) {
  const SEG = 36, n = profile.length;
  const ringPts = (scale) => profile.map(([r, y], k) => {
    const pts = [];
    for (let s = 0; s <= SEG; s++) {
      const a = (s / SEG) * Math.PI * 2;
      const lift = k === n - 1 ? rim(a) : k === n - 2 ? rim(a) * 0.35 : 0;
      pts.push([Math.cos(a) * r * scale, y0 + y + lift, Math.sin(a) * r * scale, a]);
    }
    return pts;
  });
  const surface = (scale, inward, colorOf) => {
    const first = mb.positions.length / 3, firstFace = mb.faces.length;
    const rings = ringPts(scale).map((ring, k) => ring.map(([x, y, z, a]) =>
      mb.vertex([x, y, z], [Math.cos(a) * (inward ? -1 : 1), 0, Math.sin(a) * (inward ? -1 : 1)], colorOf(k / (n - 1)))));
    for (let k = 0; k < n - 1; k++) {
      for (let s = 0; s < SEG; s++) {
        const a = rings[k][s], b = rings[k][s + 1], c = rings[k + 1][s], d = rings[k + 1][s + 1];
        mb.faces.push([a, b, d], [a, d, c]);
      }
    }
    computeVertexNormals(mb, first, firstFace);
    return rings;
  };
  const outer = surface(1, false, color);
  if (!innerColor) return;
  const inner = surface(0.9, true, innerColor);
  // 윗 테두리: 바깥 ↔ 안쪽 윗단을 이어 꽃잎 두께
  const top = n - 1;
  for (let s = 0; s < SEG; s++) {
    mb.faces.push([outer[top][s], inner[top][s], inner[top][s + 1]], [outer[top][s], inner[top][s + 1], outer[top][s + 1]]);
  }
}

function tulip(mb, color) {
  tulipStem(mb, TULIP.stemH);
  const main = hexToRgb01(color);
  const base = main.map(v => v * 0.8), tip = main;
  cup(mb, {
    y0: TULIP.stemH - 0.01,
    profile: TULIP.cup,
    rim: (a) => TULIP.tip * Math.max(0, Math.cos(a * 3)) ** 2, // 3갈래 뾰족한 꽃잎 끝
    color: (t) => [...mix3(base, tip, smoothstep(0, 1, t)), 1],
    innerColor: (t) => [...mix3(main.map(v => v * 0.8), main, t), 1],
  });
  // 컵 안쪽 바닥의 진한 무늬 (레퍼런스의 꽃 속 점무늬)
  sphere(mb, [0, TULIP.stemH + 0.06, 0], 0.035, 1, rgba(C.tulipHeart), [1, 0.4, 1]);
}

function tulipBud(mb, color) {
  tulipStem(mb, TULIP.budStemH);
  const green = hexToRgb01(C.budGreen), main = hexToRgb01(color);
  cup(mb, {
    y0: TULIP.budStemH - 0.01,
    profile: TULIP.bud,
    rim: () => 0,
    color: (t) => [...mix3(green, main, smoothstep(0.45, 0.8, t)), 1],
  });
}

// 2. 코스모스형: 납작한 꽃잎 8장 방사형 + 노란 중앙
function cosmos(mb, color) {
  const H = 0.3;
  stemAndLeaves(mb, H);
  const head = mb.positions.length / 3;
  const main = hexToRgb01(color), inner = darken(color, 0.8);
  for (let i = 0; i < 8; i++) {
    petal(mb, {
      center: [0, H, 0], yaw: (i / 8) * Math.PI * 2, tilt: 0.18, length: 0.13,
      halfWidth: u => 0.034 * (0.35 + 0.65 * u) * (u > 0.85 ? Math.sqrt(Math.max(0, 1 - (u - 0.85) / 0.15)) + 0.4 : 1),
      curl: (u) => -0.01 * u,
      color: u => mix3(inner, main, smoothstep(0, 0.35, u)),
    });
  }
  sphere(mb, [0, H + 0.012, 0], 0.035, 1, rgba(C.center), [1, 0.55, 1]);
  scaleHead(mb, head, H);
}

// 3. 팬지형 (참고 이미지의 무궁화 느낌): 둥근 꽃잎 5장, 안쪽 진한 무늬, 노란 수술
function pansy(mb, color, eye) {
  const H = 0.24;
  stemAndLeaves(mb, H);
  const head = mb.positions.length / 3;
  const main = hexToRgb01(color), dark = hexToRgb01(eye);
  for (let i = 0; i < 5; i++) {
    petal(mb, {
      center: [0, H, 0], yaw: (i / 5) * Math.PI * 2, tilt: 0.32, length: 0.125,
      halfWidth: u => 0.068 * Math.sin(Math.PI * Math.min(1, 0.1 + u * 0.92)) ** 0.45,
      curl: (u, v) => 0.012 * v * v + 0.015 * u * u, // 살짝 오목하고 끝이 뒤로 젖혀진다
      color: u => mix3(dark, main, smoothstep(0.22, 0.65, u)),
    });
  }
  // 수술: 앞으로 비스듬히 뻗은 가는 대 + 노란 끝
  const lean = 0.5, len = 0.1;
  const tipPos = [Math.sin(lean) * len, H + Math.cos(lean) * len, 0];
  const c = Math.cos(-lean), s = Math.sin(-lean);
  const rot = ([x, y, z]) => [x * c - y * s, x * s + y * c, z];
  lathe(mb, [[0.008, 0], [0.006, len]], 5, rgba(C.stamen), { point: v => add(rot(v), [0, H, 0]), dir: rot });
  sphere(mb, tipPos, 0.018, 1, rgba(C.center));
  scaleHead(mb, head, H);
}

const BUILDERS = { tulip, tulipBud, cosmos, pansy };
export const TULIP_COLORS = Object.keys(C.tulips);
export const OTHER_TYPES = ['cosmos', 'pansy'];
export const OTHER_COLORS = Object.keys(C.petals);

export function buildFlower(p, type, colorName) {
  const isTulip = type === 'tulip' || type === 'tulipBud';
  const mb = meshBuilder(isTulip ? 1 : FLOWERS.OTHER_SCALE);
  BUILDERS[type](mb, isTulip ? C.tulips[colorName] : C.petals[colorName], C.eyes[colorName]);
  return mb.build(p);
}

// flowers: [{ x, z, type, color, yaw, scale, phase }]
export function createFlowerRenderer(p, { flowers, groundHeight }) {
  const cache = new Map();
  const geometryOf = (f) => {
    const key = `${f.type}:${f.color}`;
    if (!cache.has(key)) cache.set(key, buildFlower(p, f.type, f.color));
    return cache.get(key);
  };
  const groups = new Map();
  for (const f of flowers) {
    const g = geometryOf(f);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(f);
  }
  const batches = makeBatches(groups, groundHeight, 0.2);
  return {
    draw(shader) {
      for (const b of batches) {
        shader.setUniform('uInst', b.data);
        p.model(b.geom, b.count);
      }
    },
    drawCalls: batches.length,
  };
}
