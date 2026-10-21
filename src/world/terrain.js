import { GRID, TERRAIN } from './config';
import { COAST_BOUNDS, latLonToWorld, signedDistance } from './geo';
import { makeGeometry, smoothstep } from './mesh';

const T = TERRAIN;
const MOUNTAINS = T.MOUNTAINS.map(m => ({ ...m, ...latLonToWorld(m.lat, m.lon) }));

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
export function mountainHeight(x, z, sd) {
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

// 정점색에 지형 정보를 담아 보내고, 실제 색은 픽셀 셰이더(curvedShader.js의 terrain)에서 정한다.
// → 층·도로 경계가 격자 톱니 없이 매끈한 곡선이 된다.
//   r = 해안까지 거리(sd), g = 산 높이(m), b = 평평한 정도(노멀 수직 성분)
export const TERRAIN_ENCODE = { SD_MIN: -40, SD_RANGE: 640, M_RANGE: 220 };

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

  const E = TERRAIN_ENCODE;
  const positions = [], normals = [], colors = [], faces = [], uvs = [];
  const vertexOf = new Int32Array(nx * nz).fill(-1);
  const nearIsland = -S * 1.5;
  const addVertex = (i, j) => {
    const k = idx(i, j);
    if (vertexOf[k] >= 0) return vertexOf[k];
    const x = x0 + i * S, z = z0 + j * S, sd = SD[k], h = H[k];
    const n = vNormal(i, j);
    positions.push(x, -h, z);
    normals.push(...n);
    uvs.push(x / GRID.TILE, z / GRID.TILE); // 셰이더에서 floor → 타일 번호 (잔디 톤)
    colors.push(
      Math.min(1, Math.max(0, (sd - E.SD_MIN) / E.SD_RANGE)),
      Math.min(1, Math.max(0, (h - baseHeight(sd)) / E.M_RANGE)),
      -n[1],
      1,
    );
    vertexOf[k] = positions.length / 3 - 1;
    return vertexOf[k];
  };
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const maxSd = Math.max(SD[idx(i, j)], SD[idx(i + 1, j)], SD[idx(i, j + 1)], SD[idx(i + 1, j + 1)]);
      if (maxSd < nearIsland) continue; // 섬과 먼 바닷속 칸은 생략
      const a = addVertex(i, j), b = addVertex(i + 1, j), c = addVertex(i, j + 1), d = addVertex(i + 1, j + 1);
      faces.push([a, d, b], [a, c, d]); // groundHeight와 같은 대각선 분할
    }
  }

  const geometry = makeGeometry(p, { positions, normals, colors, faces, uvs });

  function groundHeight(x, z) {
    const gx = (x - x0) / S, gz = (z - z0) / S;
    const i = Math.min(nx - 2, Math.max(0, Math.floor(gx)));
    const j = Math.min(nz - 2, Math.max(0, Math.floor(gz)));
    const fx = Math.min(1, Math.max(0, gx - i)), fz = Math.min(1, Math.max(0, gz - j));
    const h00 = H[idx(i, j)], h10 = H[idx(i + 1, j)], h01 = H[idx(i, j + 1)], h11 = H[idx(i + 1, j + 1)];
    // 메시 faces와 같은 대각선 분할
    return fx >= fz
      ? h00 + fx * (h10 - h00) + fz * (h11 - h10)
      : h00 + fz * (h01 - h00) + fx * (h11 - h01);
  }

  return { geometry, groundHeight, triangles: faces.length };
}
