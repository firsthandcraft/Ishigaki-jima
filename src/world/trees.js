import { GRID, TREES } from './config';
import { hexToRgb01, makeGeometry, mulberry32, smoothstep } from './mesh';

// 동물의 숲식 동글동글한 나무·바위. 외부 모델 없이 절차적으로 만든다.
// 크기 기준 (1 = 1타일): 캐릭터 1.4, 활엽수 3.8 (수관 지름 2.2, 줄기 1.3), 바위 0.9 × 0.7
// 치수는 "타일 단위"(1 = 1타일)로 적고 정점을 넣을 때 GRID.TILE을 곱한다. 원점 = 밑동, y 위쪽 +
// 같은 모양 나무는 geometry 하나를 인스턴싱으로 여러 번 그린다 (위치·회전·크기는 셰이더 uniform 배열).

const U = GRID.TILE;
const C = TREES.colors;
const rgba = (hex, a = 1) => [...hexToRgb01(hex), a];
const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// scale: 전체 배율 (야자수처럼 치수를 통째로 키울 때)
export function meshBuilder(scale = 1) {
  const positions = [], normals = [], colors = [], faces = [];
  return {
    positions, normals, colors, faces, scale,
    // 위쪽 + 좌표로 받아 p5 좌표(y 아래 +)로 넣는다
    vertex([x, y, z], [nx, ny, nz], color) {
      positions.push(x * U * scale, -y * U * scale, z * U * scale);
      normals.push(nx, -ny, nz);
      colors.push(...color);
      return positions.length / 3 - 1;
    },
    build: (p) => makeGeometry(p, { positions, normals, colors, faces }),
  };
}

const norm = ([x, y, z]) => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};

// 정이십면체를 detail번 쪼갠 단위 구 (Three.js IcosahedronGeometry와 같은 방식)
const icoCache = {};
function icosphere(detail) {
  if (icoCache[detail]) return icoCache[detail];
  const t = (1 + Math.sqrt(5)) / 2;
  let verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t],
    [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map(norm);
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let d = 0; d < detail; d++) {
    const mid = new Map();
    const midpoint = (a, b) => {
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (!mid.has(key)) {
        verts.push(norm(verts[a].map((v, i) => (v + verts[b][i]) / 2)));
        mid.set(key, verts.length - 1);
      }
      return mid.get(key);
    };
    faces = faces.flatMap(([a, b, c]) => {
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]];
    });
  }
  icoCache[detail] = { verts, faces };
  return icoCache[detail];
}

// 3D 해시 → -1~1 (정점 흔들기용)
function hash3(x, y, z, seed) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

// 회전 원통 (프로필 [[반지름, 높이], ...] 를 돌려 만든다). xf: 위쪽+ 좌표 변환 (점, 방향)
export function lathe(mb, profile, segs, color, xf = { point: v => v, dir: v => v }) {
  const rings = profile.map(([r, y], k) => {
    const [r0, y0] = profile[Math.max(0, k - 1)], [r1, y1] = profile[Math.min(profile.length - 1, k + 1)];
    const slope = (r0 - r1) / Math.max(1e-6, y1 - y0); // 위로 좁아지면 노멀이 살짝 위를 본다
    const ring = [];
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const n = norm([Math.cos(a), slope, Math.sin(a)]);
      ring.push(mb.vertex(xf.point([Math.cos(a) * r, y, Math.sin(a) * r]), xf.dir(n), color));
    }
    return ring;
  });
  for (let k = 0; k < rings.length - 1; k++) {
    for (let s = 0; s < segs; s++) {
      const a = rings[k][s], b = rings[k][s + 1], c = rings[k + 1][s], d = rings[k + 1][s + 1];
      mb.faces.push([a, b, d], [a, d, c]);
    }
  }
  // 윗면 뚜껑
  const [, topY] = profile[profile.length - 1];
  const center = mb.vertex(xf.point([0, topY, 0]), xf.dir([0, 1, 0]), color);
  const top = rings[rings.length - 1];
  for (let s = 0; s < segs; s++) mb.faces.push([center, top[s + 1], top[s]]);
}

// squash: 축별 납작하게 [x, y, z]
export function sphere(mb, center, r, detail, color, squash = [1, 1, 1]) {
  const { verts, faces } = icosphere(detail);
  const base = mb.positions.length / 3;
  for (const v of verts) mb.vertex(v.map((c, i) => center[i] + c * r * squash[i]), norm(v.map((c, i) => c / squash[i])), color);
  for (const [a, b, c] of faces) mb.faces.push([base + a, base + b, base + c]);
}

// UV 구 (Three.js SphereGeometry와 같은 경도·위도 분할). shape(dir) → 위쪽+ 좌표 점, color(pt) → rgba
// 정점은 만든 뒤 computeVertexNormals로 노멀을 다시 계산한다 (변형된 모양에 맞는 부드러운 노멀)
export function uvSphere(mb, { segs = 32, rings = 16, shape, color }) {
  const first = mb.positions.length / 3, firstFace = mb.faces.length;
  const idx = [];
  for (let r = 0; r <= rings; r++) {
    const v = r / rings, phi = v * Math.PI;
    const row = [];
    for (let s = 0; s <= segs; s++) {
      const theta = (s / segs) * Math.PI * 2;
      const dir = [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
      const pt = shape(dir);
      row.push(mb.vertex(pt, dir, color(pt)));
    }
    idx.push(row);
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = idx[r][s], b = idx[r][s + 1], c = idx[r + 1][s], d = idx[r + 1][s + 1];
      if (r > 0) mb.faces.push([a, b, d]);
      if (r < rings - 1) mb.faces.push([a, d, c]);
    }
  }
  // 이음매(경도 0 = 2π)와 극점은 같은 위치 정점이 여러 개 → 위치가 같은 정점끼리 노멀을 합친다
  computeVertexNormals(mb, first, firstFace);
}

// Three.js computeVertexNormals: 면 노멀을 정점마다 더해 정규화. 같은 위치의 정점(이음매)은 함께 평균
export function computeVertexNormals(mb, firstVertex, firstFace) {
  const P = mb.positions, N = mb.normals;
  const count = P.length / 3 - firstVertex;
  const acc = new Float64Array(count * 3);
  const key = (i) => `${P[i * 3].toFixed(3)},${P[i * 3 + 1].toFixed(3)},${P[i * 3 + 2].toFixed(3)}`;
  const groups = new Map();
  for (let i = 0; i < count; i++) {
    const k = key(firstVertex + i);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(i);
  }
  for (let f = firstFace; f < mb.faces.length; f++) {
    const [a, b, c] = mb.faces[f];
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const e1 = [P[b * 3] - ax, P[b * 3 + 1] - ay, P[b * 3 + 2] - az];
    const e2 = [P[c * 3] - ax, P[c * 3 + 1] - ay, P[c * 3 + 2] - az];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) acc[(v - firstVertex) * 3 + k] += n[k];
  }
  for (const list of groups.values()) {
    const sum = [0, 0, 0];
    for (const i of list) for (let k = 0; k < 3; k++) sum[k] += acc[i * 3 + k];
    const l = Math.hypot(...sum) || 1;
    // 감는 방향과 무관하게 바깥을 보도록: 원래(구 방향) 노멀과 같은 쪽으로
    const i0 = list[0] + firstVertex;
    const sign = sum[0] * N[i0 * 3] + sum[1] * N[i0 * 3 + 1] + sum[2] * N[i0 * 3 + 2] < 0 ? -1 : 1;
    for (const i of list) for (let k = 0; k < 3; k++) N[(i + firstVertex) * 3 + k] = (sum[k] / l) * sign;
  }
}

// ---- 활엽수 ----
// 수관 = 큰 구 1 + 위 작은 구 1 + 좌우 살짝 아래 작은 구 2 (32분할 구를 겹침, 노이즈는 아주 약하게)
const CANOPY = {
  blobs: [
    { c: [0, 2.45, 0], r: 1.0 },
    { c: [0.05, 3.15, 0.03], r: 0.65 },     // 꼭대기 = 3.8
    { c: [-0.5, 2.2, 0.1], r: 0.6 },        // 좌우 끝 = ±1.1 → 수관 지름 2.2
    { c: [0.5, 2.2, -0.08], r: 0.6 },
  ],
  bottomFlatten: 0.75, // 구 아래쪽을 눌러서 수관 밑면을 평평하게
  jitter: 0.015,       // 노이즈 변형 (반지름 비율, 아주 약하게)
  y0: 1.4, y1: 3.8,    // 그라데이션 범위 (수관 밑 → 꼭대기)
};

function canopyColor(y) {
  const t = (y - CANOPY.y0) / (CANOPY.y1 - CANOPY.y0);
  const shade = hexToRgb01(C.leafShade), main = hexToRgb01(C.leaf), light = hexToRgb01(C.leafLight);
  const c = t < 0.45 ? mix3(shade, main, smoothstep(0, 0.45, t)) : mix3(main, light, smoothstep(0.45, 1, t));
  return [...c, 1];
}

export function buildRoundTree(p, seed) {
  const mb = meshBuilder();
  // 줄기: 높이 1.3, 밑동이 살짝 퍼진다 (위쪽은 수관 안으로 들어감)
  lathe(mb, [[0.3, -0.05], [0.24, 0.15], [0.19, 0.6], [0.17, 1.3], [0.15, 1.8]], 16, rgba(C.trunk));
  for (const [bi, b] of CANOPY.blobs.entries()) {
    uvSphere(mb, {
      shape: (d) => {
        const k = 1 + CANOPY.jitter * hash3(d[0] * 2, d[1] * 2, d[2] * 2, seed * 7 + bi);
        const flat = d[1] < 0 ? CANOPY.bottomFlatten : 1;
        return [b.c[0] + d[0] * b.r * k, b.c[1] + d[1] * b.r * k * flat, b.c[2] + d[2] * b.r * k];
      },
      color: (pt) => canopyColor(pt[1]),
    });
  }
  return mb.build(p);
}

// 열매: 수관 앞면(+z)에 작은 구 3개. 나무와 같은 인스턴스 값으로 그려서 함께 흔들린다
export function buildFruit(p) {
  const mb = meshBuilder();
  const color = rgba(C.fruit);
  for (const [x, y] of [[-0.4, 2.2], [0.32, 2.6], [0.06, 1.95]]) {
    const z = Math.sqrt(Math.max(0, 1.0 ** 2 - x * x - (y - 2.45) ** 2)) + 0.04; // 큰 구 표면 바로 앞
    uvSphere(mb, { segs: 12, rings: 8, shape: d => [x + d[0] * 0.13, y + d[1] * 0.13, z + d[2] * 0.13], color: () => color });
  }
  return mb.build(p);
}

// ---- 야자수 ----
const PALM = {
  scale: 1.6, // 아래 치수 전체 배율 → 높이 약 3.6타일 (활엽수와 비슷하게)
  segs: 5, segH: 0.42, r0: 0.13, bend: 0.075, // 마디마다 이만큼(rad) 더 기울어 한쪽으로 휜다
  leaves: 6, leafLen: 1.15, leafW: 0.2, droop: 0.85,
};

export function buildPalm(p, seed) {
  const mb = meshBuilder(PALM.scale);
  const rng = mulberry32(seed);
  // 줄기: 아래가 살짝 굵은 원통 5개를 쌓아 마디를 만든다
  let base = [0, 0, 0], angle = 0;
  for (let i = 0; i < PALM.segs; i++) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const [bx, by, bz] = base;
    const rot = ([x, y, z]) => [x * c - y * s, x * s + y * c, z];
    const xf = { point: v => rot(v).map((q, k) => q + [bx, by, bz][k]), dir: rot };
    const r = PALM.r0 * (1 - i * 0.07);
    lathe(mb, [[r * 1.12, 0], [r, PALM.segH * 0.35], [r * 0.9, PALM.segH + 0.02]], 7, rgba(i % 2 ? C.palmTrunk : C.palmTrunkDark), xf);
    base = xf.point([0, PALM.segH, 0]);
    angle -= PALM.bend;
  }
  // 잎: 납작하고 길쭉한 잎을 방사형으로, 끝이 아래로 처진다. 가운데 잎맥을 살짝 접어 입체감
  const top = base;
  const leafColor = rgba(C.palmLeaf);
  const leafTip = rgba(C.palmLeafTip);
  const N = 7;
  for (let l = 0; l < PALM.leaves; l++) {
    const yaw = (l / PALM.leaves) * Math.PI * 2 + (rng() - 0.5) * 0.4;
    const len = PALM.leafLen * (0.9 + rng() * 0.2);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const rows = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const along = t * len;
      const lift = 0.22 * t - PALM.droop * t * t; // 위로 살짝 뻗었다가 끝이 아래로
      const w = PALM.leafW * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.7;
      const color = mix3(leafColor, leafTip, t);
      const row = [-1, 0, 1].map((side) => {
        const local = [along, lift + (side === 0 ? 0.035 : 0), side * w];
        const pt = [top[0] + local[0] * cy - local[2] * sy, top[1] + local[1], top[2] + local[0] * sy + local[2] * cy];
        return mb.vertex(pt, norm([-side * 0.25 * -sy, 1, side * 0.25 * cy]), color);
      });
      rows.push(row);
    }
    for (let k = 0; k < N; k++) {
      const [a0, a1, a2] = rows[k], [b0, b1, b2] = rows[k + 1];
      mb.faces.push([a0, b0, b1], [a0, b1, a1], [a1, b1, b2], [a1, b2, a2]);
    }
  }
  // 코코넛 3개
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + 0.4;
    sphere(mb, [top[0] + Math.cos(a) * 0.12, top[1] - 0.1, top[2] + Math.sin(a) * 0.12], 0.09, 1, rgba(C.coconut));
  }
  return mb.build(p);
}

// ---- 바위 ----
// 폭 0.9 × 높이 0.7. 매끈한 덩어리에 큼직한 울퉁불퉁함만 살짝, 밑면은 평평하게 땅에 붙인다
export function buildRock(p, seed) {
  const mb = meshBuilder();
  const base = hexToRgb01(C.rock);
  uvSphere(mb, {
    shape: (d) => {
      const k = 1 + 0.07 * hash3(d[0] * 1.3, d[1] * 1.3, d[2] * 1.3, seed) + 0.04 * hash3(d[0] * 3, d[1] * 3, d[2] * 3, seed + 5);
      const y = 0.33 + d[1] * 0.4 * k;
      return [d[0] * 0.45 * k, Math.max(0, y), d[2] * 0.4 * k * (1 + d[0] * 0.12)];
    },
    color: (pt) => [...base.map(c => c * (0.9 + 0.12 * Math.min(1, pt[1] / 0.7))), 1],
  });
  return mb.build(p);
}

// ---- 인스턴싱 ----
// 인스턴스 하나 = vec4(x, p5 y, z, yaw) + vec4(scale, 바람 위상, 0, 0). uniform 배열 크기에 맞춰 묶음으로 나눠 그린다
export const INSTANCES_PER_DRAW = 60;

// groups: Map<geometry, [{ x, z, yaw, scale, phase }]> → [{ geom, data, count }]. sink: 땅에 묻는 깊이
export function makeBatches(groups, groundHeight, sink) {
  const batches = [];
  for (const [geom, list] of groups) {
    for (let i = 0; i < list.length; i += INSTANCES_PER_DRAW) {
      const chunk = list.slice(i, i + INSTANCES_PER_DRAW);
      const data = new Array(INSTANCES_PER_DRAW * 8).fill(0);
      chunk.forEach((t, k) => {
        data.splice(k * 8, 8, t.x, -(groundHeight(t.x, t.z) - sink), t.z, t.yaw, t.scale, t.phase, 0, 0);
      });
      batches.push({ geom, data, count: chunk.length });
    }
  }
  return batches;
}

// trees: 나무 + 바위 인스턴스 ({ variant: 'round' | 'palm' | 'rock', ... })
export function createTreeRenderer(p, { trees, groundHeight }) {
  const geometries = {
    round: [0, 1, 2].map(i => buildRoundTree(p, i + 1)),
    fruit: buildFruit(p),
    palm: [buildPalm(p, 11), buildPalm(p, 23)],
    rock: [3, 8, 13].map(i => buildRock(p, i)),
  };
  // 같은 geometry끼리 모아 묶음 데이터를 미리 만든다
  const groups = new Map();
  const addTo = (geom, t) => {
    if (!groups.has(geom)) groups.set(geom, []);
    groups.get(geom).push(t);
  };
  for (const t of trees) {
    const list = geometries[t.variant];
    addTo(list[t.shape % list.length], t);
    if (t.fruit) addTo(geometries.fruit, t);
  }
  const batches = makeBatches(groups, groundHeight, 0.6);
  return {
    // treeShader: curvedShader.js의 tree (현재 p.shader로 걸려 있어야 함)
    draw(treeShader) {
      for (const b of batches) {
        treeShader.setUniform('uInst', b.data);
        p.model(b.geom, b.count);
      }
    },
    drawCalls: batches.length,
  };
}
