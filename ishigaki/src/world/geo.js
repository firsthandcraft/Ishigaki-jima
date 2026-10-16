import { WORLD } from './config';
import { COASTLINE_LATLON } from './coastline';

// 위경도 → 미터 (등장방형 근사, 섬 크기에서는 충분히 정확)
const DEG = Math.PI / 180;
const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = Math.cos(WORLD.LAT0 * DEG) * 111320;

// 섬 남북 길이가 ISLAND_LENGTH가 되도록 미터 → 월드 배율 결정
const lats = COASTLINE_LATLON.map(([lat]) => lat);
const islandMeters = (Math.max(...lats) - Math.min(...lats)) * M_PER_DEG_LAT;
export const WORLD_SCALE = WORLD.ISLAND_LENGTH / islandMeters;

export function latLonToWorld(lat, lon) {
  return {
    x: (lon - WORLD.LON0) * M_PER_DEG_LON * WORLD_SCALE,
    z: -(lat - WORLD.LAT0) * M_PER_DEG_LAT * WORLD_SCALE, // 북쪽 = -z
  };
}

// 해안선 polygon (월드 좌표). 평평한 배열로 들고 있어 매 프레임 계산이 가볍다.
export const COAST = COASTLINE_LATLON.map(([lat, lon]) => latLonToWorld(lat, lon));
const N = COAST.length;
const CX = new Float64Array(N);
const CZ = new Float64Array(N);
COAST.forEach((p, i) => { CX[i] = p.x; CZ[i] = p.z; });

export const COAST_BOUNDS = {
  minX: Math.min(...CX), maxX: Math.max(...CX),
  minZ: Math.min(...CZ), maxZ: Math.max(...CZ),
};

export function pointInPolygon(x, z) {
  let inside = false;
  for (let i = 0, j = N - 1; i < N; j = i++) {
    if ((CZ[i] > z) !== (CZ[j] > z) &&
        x < ((CX[j] - CX[i]) * (z - CZ[i])) / (CZ[j] - CZ[i]) + CX[i]) {
      inside = !inside;
    }
  }
  return inside;
}

// 해안선에서 가장 가까운 점. out 객체를 넘기면 재사용 (draw 루프에서 new 줄이기)
export function closestPointOnCoast(x, z, out = {}) {
  let best = Infinity;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const ax = CX[i], az = CZ[i];
    const dx = CX[j] - ax, dz = CZ[j] - az;
    const len2 = dx * dx + dz * dz;
    let t = len2 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + t * dx, pz = az + t * dz;
    const d2 = (x - px) * (x - px) + (z - pz) * (z - pz);
    if (d2 < best) {
      best = d2;
      const len = Math.sqrt(len2) || 1;
      out.x = px; out.z = pz;
      out.tx = dx / len; out.tz = dz / len; // 해안선 접선 방향 (단위 벡터)
      out.segment = i;
    }
  }
  out.dist = Math.sqrt(best);
  return out;
}

export function distanceToCoast(x, z) {
  return closestPointOnCoast(x, z, scratch).dist;
}
const scratch = {};

// 섬 안쪽이면 +, 바다면 - 인 해안까지 거리
export function signedDistance(x, z) {
  const d = distanceToCoast(x, z);
  return pointInPolygon(x, z) ? d : -d;
}

// 섬 밖이거나 해안에 너무 붙은 점을 해안에서 inset 만큼 안쪽으로 끌어당긴다 (POI 배치용)
export function pullInside(x, z, inset) {
  if (signedDistance(x, z) >= inset) return { x, z };
  const c = closestPointOnCoast(x, z);
  // 접선의 두 법선 중 섬 안쪽을 고른다
  let nx = -c.tz, nz = c.tx;
  if (!pointInPolygon(c.x + nx * 2, c.z + nz * 2)) { nx = -nx; nz = -nz; }
  return { x: c.x + nx * inset, z: c.z + nz * inset };
}
