import { TERRAIN, COLORS } from './config';
import { COAST_BOUNDS, latLonToWorld, signedDistance } from './geo';
import { makeGeometry, hexToRgb01, smoothstep, hash2 } from './mesh';

const T = TERRAIN;
const MOUNTAINS = T.MOUNTAINS.map(m => ({ ...m, ...latLonToWorld(m.lat, m.lon) }));
const TIER1_TOP = T.BEACH_H1 + T.TIER1_H;

// 산을 뺀 기본 계단 높이: 해변 → 잔디 1층 → 언덕 2층
function baseHeight(sd) {
  if (sd <= 0) return Math.max(T.SEA_FLOOR, T.BEACH_H0 + sd * 0.5);
  const r1 = T.TIER1_RAMP / 2, r2 = T.TIER2_RAMP / 2;
  return T.BEACH_H0
    + (T.BEACH_H1 - T.BEACH_H0) * smoothstep(0, T.BEACH_WIDTH, sd)
    + T.TIER1_H * smoothstep(T.BEACH_WIDTH - r1, T.BEACH_WIDTH + r1, sd)
    + T.TIER2_H * smoothstep(T.TIER2_AT - r2, T.TIER2_AT + r2, sd);
}

// 산 가우시안 합 → 계단식으로 깎기 (동물의 숲 언덕 느낌)
function mountainHeight(x, z, sd) {
  if (sd <= 0) return 0;
  let m = 0;
  for (const mt of MOUNTAINS) {
    const d2 = (x - mt.x) ** 2 + (z - mt.z) ** 2;
    m += mt.height * Math.exp(-d2 / (2 * mt.radius * mt.radius));
  }
  m *= smoothstep(30, 140, sd); // 해안 가까이엔 산이 솟지 않게
  if (T.MOUNTAIN_STEP > 0) {
    const t = m / T.MOUNTAIN_STEP;
    const f = t - Math.floor(t);
    m = (Math.floor(t) + smoothstep(0.4, 0.6, f)) * T.MOUNTAIN_STEP;
  }
  return m;
}

export function heightAt(x, z, sd = signedDistance(x, z)) {
  return baseHeight(sd) + mountainHeight(x, z, sd);
}

const C = Object.fromEntries(Object.entries(COLORS)
  .filter(([, v]) => typeof v === 'string')
  .map(([k, v]) => [k, hexToRgb01(v)]));

function faceColor(hc, sdc, flatness) {
  const base = baseHeight(sdc);
  const m = hc - base;
  if (hc < 0.6) return C.sandWet;
  if (flatness < T.CLIFF_SLOPE && hc > T.BEACH_H1 + 1 && m < 1) return C.cliff; // 층 사이 절벽만 (산 계단은 초록 단계로)
  if (sdc < T.BEACH_WIDTH - 2) return C.sand;
  if (Math.abs(sdc - T.ROAD_INSET) < T.ROAD_WIDTH / 2 && m < 2) return C.road;
  if (m > T.MOUNTAIN_STEP * 4.5) return C.mountainTop;
  if (m > T.MOUNTAIN_STEP * 1.5) return C.mountain;
  if (hc < TIER1_TOP + T.TIER2_H * 0.5) return C.grass1;
  return C.grass2;
}

// 섬 격자 높이맵을 만들고 메시를 한 번 빌드한다.
// 반환: { geometry, groundHeight(x,z) } — groundHeight는 메시 삼각형과 똑같이 보간해서 발이 땅에 딱 붙는다.
export function buildTerrain(p) {
  const S = T.GRID_STEP;
  const pad = S * 3;
  const x0 = COAST_BOUNDS.minX - pad;
  const z0 = COAST_BOUNDS.minZ - pad;
  const nx = Math.ceil((COAST_BOUNDS.maxX - COAST_BOUNDS.minX + pad * 2) / S) + 1;
  const nz = Math.ceil((COAST_BOUNDS.maxZ - COAST_BOUNDS.minZ + pad * 2) / S) + 1;
  const H = new Float32Array(nx * nz);
  const SD = new Float32Array(nx * nz);

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = x0 + i * S, z = z0 + j * S;
      const sd = signedDistance(x, z);
      SD[j * nx + i] = sd;
      H[j * nx + i] = heightAt(x, z, sd);
    }
  }

  const idx = (i, j) => j * nx + i;
  const hAt = (i, j) => H[idx(Math.min(nx - 1, Math.max(0, i)), Math.min(nz - 1, Math.max(0, j)))];
  // 정점 노멀: 높이맵 중앙 차분 (부드러운 음영), p5 좌표(y+ 아래)
  const vNormal = (i, j) => {
    const dx = (hAt(i + 1, j) - hAt(i - 1, j)) / (2 * S);
    const dz = (hAt(i, j + 1) - hAt(i, j - 1)) / (2 * S);
    const len = Math.hypot(dx, 1, dz);
    return [-dx / len, -1 / len, -dz / len];
  };

  const positions = [], normals = [], colors = [];
  const pushTri = (a, b, c) => {
    const tri = [a, b, c];
    const xs = tri.map(([i]) => x0 + i * S);
    const zs = tri.map(([, j]) => z0 + j * S);
    const hs = tri.map(([i, j]) => H[idx(i, j)]);
    const hc = (hs[0] + hs[1] + hs[2]) / 3;
    const sdc = tri.reduce((s, [i, j]) => s + SD[idx(i, j)], 0) / 3;
    // 면 노멀의 수직 성분 → 가파른 정도
    const ux = xs[1] - xs[0], uy = hs[1] - hs[0], uz = zs[1] - zs[0];
    const vx = xs[2] - xs[0], vy = hs[2] - hs[0], vz = zs[2] - zs[0];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const flatness = Math.abs(cy) / (Math.hypot(cx, cy, cz) || 1);
    const col = faceColor(hc, sdc, flatness);
    const jitter = 0.97 + hash2((xs[0] + xs[1] + xs[2]) / 3, (zs[0] + zs[1] + zs[2]) / 3) * 0.06;
    for (let k = 0; k < 3; k++) {
      positions.push(xs[k], -hs[k], zs[k]);
      normals.push(...vNormal(tri[k][0], tri[k][1]));
      colors.push(col[0] * jitter, col[1] * jitter, col[2] * jitter, 1);
    }
  };

  const nearIsland = -S * 1.5;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const maxSd = Math.max(SD[idx(i, j)], SD[idx(i + 1, j)], SD[idx(i, j + 1)], SD[idx(i + 1, j + 1)]);
      if (maxSd < nearIsland) continue; // 섬과 먼 바닷속 칸은 생략
      pushTri([i, j], [i + 1, j + 1], [i + 1, j]);
      pushTri([i, j], [i, j + 1], [i + 1, j + 1]);
    }
  }

  const geometry = makeGeometry(p, { positions, normals, colors });

  function groundHeight(x, z) {
    const gx = (x - x0) / S, gz = (z - z0) / S;
    const i = Math.min(nx - 2, Math.max(0, Math.floor(gx)));
    const j = Math.min(nz - 2, Math.max(0, Math.floor(gz)));
    const fx = Math.min(1, Math.max(0, gx - i)), fz = Math.min(1, Math.max(0, gz - j));
    const h00 = H[idx(i, j)], h10 = H[idx(i + 1, j)], h01 = H[idx(i, j + 1)], h11 = H[idx(i + 1, j + 1)];
    // pushTri와 같은 대각선 분할
    return fx >= fz
      ? h00 + fx * (h10 - h00) + fz * (h11 - h10)
      : h00 + fz * (h01 - h00) + fx * (h11 - h01);
  }

  return { geometry, groundHeight, triangles: positions.length / 9 };
}
