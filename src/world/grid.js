import { GRID, TERRAIN } from './config';
import { COAST_BOUNDS, signedDistance } from './geo';
import { heightAt, mountainHeight } from './terrain';

// 동물의 숲식 타일 그리드.
// 타일 (tx, tz)는 정수 좌표, 월드 범위 [tx*TILE, (tx+1)*TILE) × [tz*TILE, (tz+1)*TILE).
// 모든 오브젝트는 footprint(타일 수)를 갖고, footprint의 정중앙에 놓인다 (1×1이면 타일 중앙 (tx+0.5, tz+0.5)).

export const TILE_TYPES = [
  'empty',    // 잔디 (오브젝트를 놓을 수 있는 유일한 바닥)
  'tree', 'flower', 'house', 'sign', 'rock',
  'reserved', // 집 입구 앞 예약 칸
  'path', 'sand', 'water', 'cliff',
];
const CODE = Object.fromEntries(TILE_TYPES.map((t, i) => [t, i]));

// [가로, 세로] 타일 수. 앵커 (tx, tz) = 북서쪽(왼쪽 위) 타일
export const FOOTPRINT = {
  tree: [1, 1],
  flower: [1, 1],
  sign: [1, 1],
  rock: [1, 1],
  house: [2, 2],
};
// 집 입구는 남쪽(+z, 기본 카메라 쪽). 앵커 기준 이 칸을 비워 둔다
const HOUSE_ENTRANCE = [0, 2];
const NEIGHBORS8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

const S = GRID.TILE;
export const tileOf = (x, z) => ({ tx: Math.floor(x / S), tz: Math.floor(z / S) });
export const tileCenter = (tx, tz) => ({ x: (tx + 0.5) * S, z: (tz + 0.5) * S });

// 지형만 보고 정한 타일 바닥: water / sand / path / cliff / empty(잔디). 판정은 타일 중앙 기준
const SAMPLES = [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
export function groundTypeAt(tx, tz) {
  const T = TERRAIN;
  const { x, z } = tileCenter(tx, tz);
  const sd = signedDistance(x, z);
  if (sd < 0) return 'water';
  if (sd < T.BEACH_WIDTH) return 'sand';
  // 도로 띠가 타일 폭보다 좁아 끊기지 않도록 반 타일쯤 넉넉히 (산 위엔 도로 색을 안 칠하는 셰이더와 맞춤)
  if (Math.abs(sd - T.ROAD_INSET) < T.ROAD_WIDTH / 2 + S * 0.35 && mountainHeight(x, z, sd) < 2) return 'path';
  let lo = Infinity, hi = -Infinity;
  for (const [dx, dz] of SAMPLES) {
    const h = heightAt(x + dx * S * 0.5, z + dz * S * 0.5);
    lo = Math.min(lo, h);
    hi = Math.max(hi, h);
  }
  return hi - lo > GRID.STEEP ? 'cliff' : 'empty';
}

// (x, z)에서 가장 가까운, 바닥이 accept를 만족하는 타일 (링 단위로 넓혀 가며 찾음)
export function nearestTile(x, z, accept, maxRing = 12) {
  const c = tileOf(x, z);
  for (let r = 0; r <= maxRing; r++) {
    let best = null, bestD2 = Infinity;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const tx = c.tx + dx, tz = c.tz + dz;
        const m = tileCenter(tx, tz);
        const d2 = (m.x - x) ** 2 + (m.z - z) ** 2;
        if (d2 < bestD2 && accept(groundTypeAt(tx, tz))) { best = { tx, tz }; bestD2 = d2; }
      }
    }
    if (best) return best;
  }
  return c;
}

export function createTileGrid() {
  const pad = 2;
  const tx0 = Math.floor(COAST_BOUNDS.minX / S) - pad;
  const tz0 = Math.floor(COAST_BOUNDS.minZ / S) - pad;
  const w = Math.floor(COAST_BOUNDS.maxX / S) + pad - tx0 + 1;
  const h = Math.floor(COAST_BOUNDS.maxZ / S) + pad - tz0 + 1;
  // occupancy: 타일마다 TILE_TYPES 코드 하나. 그리드 밖은 전부 water
  const cells = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) cells[j * w + i] = CODE[groundTypeAt(tx0 + i, tz0 + j)];
  }

  const index = (tx, tz) => {
    const i = tx - tx0, j = tz - tz0;
    return i < 0 || j < 0 || i >= w || j >= h ? -1 : j * w + i;
  };
  const get = (tx, tz) => {
    const k = index(tx, tz);
    return k < 0 ? 'water' : TILE_TYPES[cells[k]];
  };
  const set = (tx, tz, type) => { cells[index(tx, tz)] = CODE[type]; };

  // type을 (tx, tz)에 놓을 때 차지하는 타일들 (+ 집이면 입구 예약 칸)
  function footprintOf(type, tx, tz) {
    const [fw, fh] = FOOTPRINT[type];
    const tiles = [];
    for (let dz = 0; dz < fh; dz++) for (let dx = 0; dx < fw; dx++) tiles.push([tx + dx, tz + dz]);
    const entrance = type === 'house' ? [tx + HOUSE_ENTRANCE[0], tz + HOUSE_ENTRANCE[1]] : null;
    return { tiles, entrance };
  }

  function canPlace(type, tx, tz) {
    if (!FOOTPRINT[type]) return false;
    const { tiles, entrance } = footprintOf(type, tx, tz);
    // 겹침, 모래·물·길·절벽 위, 예약 칸 → 실패. 잔디(empty)에만 놓인다
    if (!tiles.every(([x, z]) => get(x, z) === 'empty')) return false;
    if (entrance && get(...entrance) !== 'empty') return false;
    // 나무끼리는 주변 8칸에 다른 나무가 없어야 한다 (최소 1칸 간격)
    if (type === 'tree' && NEIGHBORS8.some(([dx, dz]) => get(tx + dx, tz + dz) === 'tree')) return false;
    return true;
  }

  const objects = [];
  const grid = {
    tx0, tz0, w, h, objects,
    version: 0, // occupancy가 바뀔 때마다 증가 (디버그 오버레이 다시 만들기용)
    get, canPlace,
    // 성공하면 { type, tx, tz, x, z, ...extra } (x, z = footprint 중앙 월드 좌표), 실패하면 null
    placeObject(type, tx, tz, extra = {}) {
      if (!canPlace(type, tx, tz)) return null;
      const { tiles, entrance } = footprintOf(type, tx, tz);
      for (const [x, z] of tiles) set(x, z, type);
      if (entrance) set(...entrance, 'reserved');
      const [fw, fh] = FOOTPRINT[type];
      const obj = { ...extra, type, tx, tz, x: (tx + fw / 2) * S, z: (tz + fh / 2) * S };
      objects.push(obj);
      grid.version++;
      return obj;
    },
    // 바닥 타입 그대로인 타일 목록 (소품 배치 후보 찾기용)
    tilesOfType(type) {
      const out = [];
      const code = CODE[type];
      for (let k = 0; k < cells.length; k++) {
        if (cells[k] === code) out.push({ tx: tx0 + (k % w), tz: tz0 + Math.floor(k / w) });
      }
      return out;
    },
  };
  return grid;
}
