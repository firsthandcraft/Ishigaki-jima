import { SEA, COLORS } from './config';
import { COAST, COAST_BOUNDS, pointInPolygon, signedDistance } from './geo';
import { makeGeometry, hexToRgb01, smoothstep, lerp } from './mesh';

const SHALLOW = hexToRgb01(COLORS.shallow);
const DEEP = hexToRgb01(COLORS.deep);

// 바다: 큰 격자 평면. 해안 가까이는 밝은 얕은물, 멀어질수록 먼바다 색
export function buildSea(p) {
  const S = SEA.GRID_STEP;
  const x0 = COAST_BOUNDS.minX - SEA.MARGIN, z0 = COAST_BOUNDS.minZ - SEA.MARGIN;
  const nx = Math.ceil((COAST_BOUNDS.maxX - COAST_BOUNDS.minX + SEA.MARGIN * 2) / S) + 1;
  const nz = Math.ceil((COAST_BOUNDS.maxZ - COAST_BOUNDS.minZ + SEA.MARGIN * 2) / S) + 1;
  const positions = [], normals = [], colors = [], faces = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = x0 + i * S, z = z0 + j * S;
      const sd = signedDistance(x, z);
      const t = sd > 0 ? 0 : smoothstep(0, SEA.SHALLOW_RANGE, -sd);
      positions.push(x, 0, z);
      normals.push(0, -1, 0);
      colors.push(lerp(SHALLOW[0], DEEP[0], t), lerp(SHALLOW[1], DEEP[1], t), lerp(SHALLOW[2], DEEP[2], t), 1);
    }
  }
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      faces.push([a, d, b], [a, c, d]);
    }
  }
  return makeGeometry(p, { positions, normals, colors, faces });
}

// 해안 파도 거품: 해안선 바깥쪽으로 FOAM_WIDTH 폭의 반투명 흰 띠
export function buildFoam(p) {
  const n = COAST.length;
  const outward = COAST.map((pt, i) => {
    const prev = COAST[(i - 1 + n) % n], next = COAST[(i + 1) % n];
    let nx = -(next.z - prev.z), nz = next.x - prev.x;
    const len = Math.hypot(nx, nz) || 1;
    nx /= len; nz /= len;
    if (pointInPolygon(pt.x + nx * 2, pt.z + nz * 2)) { nx = -nx; nz = -nz; }
    return [nx, nz];
  });
  const [r, g, b, a] = COLORS.foam.map(v => v / 255);
  const positions = [], normals = [], colors = [], faces = [];
  COAST.forEach((pt, i) => {
    const [nx, nz] = outward[i];
    positions.push(pt.x - nx * 1.5, -0.6, pt.z - nz * 1.5);
    positions.push(pt.x + nx * SEA.FOAM_WIDTH, -0.6, pt.z + nz * SEA.FOAM_WIDTH);
    normals.push(0, -1, 0, 0, -1, 0);
    colors.push(r, g, b, a, r, g, b, 0);
  });
  for (let i = 0; i < n; i++) {
    const a0 = i * 2, a1 = a0 + 1, b0 = ((i + 1) % n) * 2, b1 = b0 + 1;
    faces.push([a0, b0, a1], [a1, b0, b1]);
  }
  return makeGeometry(p, { positions, normals, colors, faces });
}
