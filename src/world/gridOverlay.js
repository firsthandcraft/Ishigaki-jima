import { GRID } from './config';
import { makeGeometry } from './mesh';

// G 키 디버그: 타일마다 occupancy 색 사각형을 땅에 깔아 하나의 geometry로 만든다.
// 사각형 사이를 조금 띄워서 그 틈이 그리드 선처럼 보인다. 바다 타일은 섬에 붙은 것만.
export function buildGridOverlay(p, grid, groundHeight) {
  const S = GRID.TILE;
  const g = S * GRID.OVERLAY_GAP / 2;
  const steps = [g, S / 2, S - g]; // 지형을 따라가도록 타일 하나를 2×2로 쪼갠다
  const colors255 = GRID.colors;
  const positions = [], normals = [], colors = [], faces = [];

  const touchesLand = (tx, tz) => {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) if (grid.get(tx + dx, tz + dz) !== 'water') return true;
    }
    return false;
  };

  for (let j = 0; j < grid.h; j++) {
    for (let i = 0; i < grid.w; i++) {
      const tx = grid.tx0 + i, tz = grid.tz0 + j;
      const type = grid.get(tx, tz);
      if (type === 'water' && !touchesLand(tx, tz)) continue;
      const [r, gg, b, a] = colors255[type];
      const base = positions.length / 3;
      for (const oz of steps) {
        for (const ox of steps) {
          const x = tx * S + ox, z = tz * S + oz;
          const h = Math.max(groundHeight(x, z), 0) + GRID.OVERLAY_LIFT; // 바다 타일은 수면 위에
          positions.push(x, -h, z);
          normals.push(0, -1, 0);
          colors.push(r / 255, gg / 255, b / 255, a / 255);
        }
      }
      for (let qz = 0; qz < 2; qz++) {
        for (let qx = 0; qx < 2; qx++) {
          const v = base + qz * 3 + qx;
          faces.push([v, v + 4, v + 1], [v, v + 3, v + 4]);
        }
      }
    }
  }
  return makeGeometry(p, { positions, normals, colors, faces });
}
