import buildingsData from '../data/buildings.json';
import { GRID } from './config';
import { latLonToWorld } from './geo';
import { tileOf } from './grid';
import { placeById } from './poi';
import { canvasImage } from '../character/parts/patterns';

// 섬의 건물 (참고: docs/building/*, 주소·좌표: data/buildings.json).
// 모양은 setup에서 buildGeometry로 한 번만 만들고, 간판 글자는 텍스처 판으로 앞에 붙인다.
// 좌표 = footprint 중앙, 바닥 = y 0, 앞(입구) = +z (남쪽, 기본 카메라 쪽). 높이는 위(+)로 적고 그릴 때 뒤집는다.

const S = GRID.TILE;
const STONE = '#D3CAB8';
const TILE_ROOF = '#D9714A';
const CREAM = '#F1E6CC';
const GLASS = '#5C7F8F';

// ── 모양 도우미 (buildGeometry 안에서만 부른다) ─────────────
function box(p, x, y, z, w, h, d, color) {
  p.fill(color);
  p.push();
  p.translate(x, -(y + h / 2), z);
  p.box(w, h, d);
  p.pop();
}

function cyl(p, x, y, z, r, h, color, detail = 16) {
  p.fill(color);
  p.push();
  p.translate(x, -(y + h / 2), z);
  p.cylinder(r, h, detail, 1);
  p.pop();
}

// 앞면(+z)에 붙는 창문: 테두리 + 유리
function windowAt(p, x, y, z, w, h, frame = '#FFFFFF', glass = GLASS) {
  box(p, x, y, z, w, h, 0.6, frame);
  box(p, x, y + h * 0.12, z + 0.35, w * 0.78, h * 0.76, 0.4, glass);
}

// 모임지붕(사방으로 경사진 지붕): 아래 w×d, 위로 h, 꼭대기는 (w - d) 길이의 용마루
function hipRoof(p, x, y, z, w, d, h, color) {
  const hw = w / 2, hd = d / 2, ridge = Math.max(0, hw - hd);
  const by = -y, ty = -(y + h);
  const A = [x - hw, by, z + hd], B = [x + hw, by, z + hd], C = [x + hw, by, z - hd], D = [x - hw, by, z - hd];
  const R1 = [x - ridge, ty, z], R2 = [x + ridge, ty, z];
  const tri = (a, b, c) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1;
    const sign = n[1] < 0 ? 1 : -1; // 바깥(위쪽)을 보게
    p.normal(n[0] / l * sign, n[1] / l * sign, n[2] / l * sign);
    p.vertex(...a); p.vertex(...b); p.vertex(...c);
  };
  p.fill(color);
  p.beginShape(p.TRIANGLES);
  tri(A, B, R2); tri(A, R2, R1);   // 앞
  tri(C, D, R1); tri(C, R1, R2);   // 뒤
  tri(B, C, R2);                   // 오른쪽
  tri(D, A, R1);                   // 왼쪽
  p.endShape();
  // 처마 밑면 (아래에서 봐도 비지 않게)
  box(p, x, y - 0.6, z, w, 0.6, d, '#B9583A');
}

// 받침돌: 경사진 땅에서도 건물이 뜨지 않게 바닥 아래로 깊게
const plinth = (p, w, d) => box(p, 0, -8, 0, w, 8, d, STONE);

// ── 건물별 모양 ─────────────────────────────────────────
const SHAPES = {
  // 공항 터미널: 2층 크림색 건물 + 짙은 초록 모임지붕 + 관제탑
  airport(p) {
    plinth(p, 94, 46);
    box(p, 0, 0, 0, 88, 15, 40, CREAM);
    box(p, 0, 15, 0, 92, 2, 44, '#E6D7B5');
    box(p, 0, 17, 0, 84, 12, 38, CREAM);
    box(p, 0, 19, 19.3, 76, 8, 0.8, GLASS);
    for (let x = -36; x <= 36; x += 9) box(p, x, 19, 19.9, 1, 8, 0.6, CREAM);
    box(p, 0, 0, 20.3, 30, 12, 0.6, '#3A3F44');            // 가운데 입구
    for (const x of [-30, 30]) windowAt(p, x, 1.5, 20.3, 18, 10, CREAM);
    for (let x = -40; x <= 40; x += 16) cyl(p, x, 0, 22, 1.6, 17, '#E9DCC0', 12);
    hipRoof(p, 0, 29, 0, 92, 44, 8, '#2F5D57');
    box(p, 0, 33, 0, 56, 6, 20, '#2F5D57');
    cyl(p, 34, 29, -12, 5, 16, '#D9CDB4');
    cyl(p, 34, 45, -12, 7, 6, GLASS);
    cyl(p, 34, 51, -12, 8, 2, '#8C8072');
    p.fill('#E8483A');
    p.push();
    p.translate(34, -54, -12);
    p.sphere(1.2, 8, 6);
    p.pop();
  },

  // 돈키: 검정 몸통 + 노란 줄 + 회색 윗단 + 빨간 테두리, 둥근 기둥 간판
  donki(p) {
    plinth(p, 62, 46);
    box(p, 0, 0, 0, 58, 20, 42, '#2B2B2D');
    box(p, 25, 0, 0, 8, 20, 42.6, '#F2C230');
    for (const y of [11.5, 14.5]) box(p, 0, y, 21.3, 58, 1.4, 0.6, '#F2C230');
    box(p, 0, 20, 0, 58, 7, 42, '#AEB4BA');
    box(p, 0, 27, 0, 59, 1.2, 43, '#D9473A');
    for (const x of [-20, -6, 8]) windowAt(p, x, 2, 21.2, 10, 7, '#C8372D', '#3C5A7A');
    cyl(p, -34, 0, 18, 1.2, 34, '#3A3A3A', 10);
    p.push();
    p.translate(-34, -38, 18);
    p.rotateX(Math.PI / 2);
    p.fill('#D9473A');
    p.cylinder(8, 1.6, 28, 1);
    p.pop();
    box(p, -6, 0, 23, 40, 2.5, 3, '#E2DACB');                // 돌 화단
    box(p, -6, 2.5, 23, 38, 1.2, 2.4, '#5DA84A');
  },

  // 파이누시마 리조트 코랄 피시: 2층 크림색 집 + 벽돌 발코니 + 붉은 기와 현관 지붕
  painushima(p) {
    plinth(p, 30, 30);
    box(p, 0, 0, 0, 24, 12, 22, '#F3E3A6');
    box(p, -1, 12, 0, 28, 11, 26, '#F3E3A6');
    box(p, -1, 23, 0, 29, 1.5, 27, '#EEDC98');
    box(p, 6.5, 12.5, 13.4, 13, 6, 1.4, '#C8613A');
    for (const x of [1, 6.5, 12]) box(p, x, 12.5, 13.4, 1.2, 6.4, 1.8, '#B5532F');
    windowAt(p, -8, 15, 13.2, 6, 5);
    windowAt(p, -7, 3, 11.2, 6, 5);
    box(p, 2, 0, 11.2, 4, 7.5, 0.6, '#8A4A2A');
    hipRoof(p, 1, 8.5, 12.8, 12, 5, 3, TILE_ROOF);
    cyl(p, -11, 0, 13.5, 0.3, 7, '#6B4F3A', 6);
    p.fill('#3E7A4A');
    p.push();
    p.translate(-11, -7.2, 13.5);
    p.scale(1, 0.35, 1);
    p.sphere(4.5, 14, 8);
    p.pop();
  },

  // 네스트 호텔: 4층, 베이지·갈색 층이 번갈아 + 붉은 기와 현관
  nesthotel(p) {
    plinth(p, 46, 46);
    for (let i = 0; i < 4; i++) {
      box(p, 0, i * 10, 0, 40, 10, 36, i % 2 === 0 ? '#5A4535' : '#C9AC84');
      for (const y of [3.3, 6.6]) box(p, 0, i * 10 + y, 18.05, 40, 0.25, 0.3, i % 2 === 0 ? '#4A372A' : '#B39470');
      if (i > 0) for (const x of [-12, 0]) windowAt(p, x, i * 10 + 2.5, 18.3, 5.5, 5.5, '#FFFFFF', '#E9ECEF');
    }
    box(p, 0, 40, 0, 42, 2, 38, '#3A3029');
    box(p, 0, 0, 18.3, 12, 8, 0.6, '#3A3F44');
    for (const x of [-6, 6]) cyl(p, x, 0, 23, 1.1, 9, '#E9DCC0', 10);
    hipRoof(p, 0, 9, 21, 18, 8, 4, TILE_ROOF);
    for (const x of [-15, 15]) box(p, x, 0, 21.5, 10, 3, 3, '#E2DACB');
  },

  // 토요코인: 8층 탑 모양, 아래 갈색 → 가운데 황토 → 위 크림, 작은 창이 촘촘히
  toyokoinn(p) {
    plinth(p, 46, 30);
    box(p, 0, 0, 0, 40, 14, 24, '#7A4A2E');
    box(p, 0, 14, 0, 40, 34, 24, '#D9A877');
    box(p, 0, 48, 0, 40, 12, 24, '#F2E6CC');
    for (const y of [14, 48]) box(p, 0, y - 0.5, 0, 41, 1, 25, '#F2E6CC');
    box(p, 0, 60, 0, 41, 1.5, 25, '#E8DCC0');
    for (let y = 16.5; y < 50; y += 5) {
      for (let x = -16; x <= 16; x += 5.3) windowAt(p, x, y, 12.3, 2.8, 2.8, '#FFFFFF', '#4A5560');
    }
    for (const x of [-16, -10.7, 10.7, 16]) windowAt(p, x, 6.5, 12.3, 2.8, 2.8, '#F2E6CC', '#4A5560');
    box(p, 21.5, 0, -4, 3, 58, 8, '#C9A57A');
    box(p, 0, 0, 12.3, 10, 7, 0.6, '#3A3F44');
    for (const x of [-5, 5]) cyl(p, x, 0, 16, 0.9, 8, '#E9DCC0', 10);
    hipRoof(p, 0, 8, 14.5, 15, 6, 3.5, TILE_ROOF);
  },

  // 리치 리존: 회색 벽돌 단층집 + 갈색 평지붕 + 흰 난간 데크, 뒤로 긴 회색 별채
  rich(p) {
    plinth(p, 46, 30);
    box(p, -12, 0, -5, 20, 11, 16, '#C9C6BE');
    box(p, -12, 11, -5, 21, 1, 17, '#B8B4AB');
    for (const x of [-18, -8]) windowAt(p, x, 4, 3.3, 5, 4, '#F2F0EA', '#6F95C2');
    box(p, 8, 0, 2, 24, 15, 20, '#D8D4CC');
    for (let y = 2; y < 15; y += 2) box(p, 8, y, 12.05, 24, 0.2, 0.2, '#C2BDB3');
    box(p, 8, 15, 2, 26, 2, 22, '#B5643A');
    box(p, 3, 0, 12.2, 6, 8, 0.6, '#7A4A2E');
    hipRoof(p, 3, 9, 13, 11, 4.5, 3, TILE_ROOF);
    windowAt(p, 13.5, 1.5, 12.2, 7, 9, '#FFFFFF', '#4C78B5');
    box(p, 14, 0, 15.5, 14, 1.2, 6, '#C77A4E');
    for (let x = 7.5; x <= 20.5; x += 2.2) box(p, x, 1.2, 18.3, 0.5, 3.5, 0.5, '#FFFFFF');
    box(p, 14, 4.5, 18.3, 14, 0.5, 0.6, '#FFFFFF');
    box(p, -8, 0, 13, 5, 3.5, 4, '#F2F0EA');                  // 마당 탁자
  },
};

// 간판: [글자, 가로, 세로, x, y(높이), z, 바탕색, 글자색]
const LABELS = {
  airport: [['ISHIGAKI AIRPORT', 50, 5, 0, 33, 10.3, '#2F5D57', '#FFFFFF']],
  donki: [['DONKI', 34, 5, 0, 15.8, 21.8, '#2B2B2D', '#F2C230'], ['DONKI', 13, 13, -34, 38, 18.9, '#F2C230', '#D9473A']],
  painushima: [['Coral Fish', 8, 2.4, -6, 6.5, 11.6, '#8A5A34', '#FFF4DC']],
  nesthotel: [['Nest hotel', 16, 3.6, 9, 26, 18.4, '#C9AC84', '#3A2A20']],
  toyokoinn: [['TOYOKO INN', 30, 5, 0, 54.5, 12.4, '#F2E6CC', '#3E5FA8']],
  rich: [['Rich Reson', 12, 2.6, 8, 12.4, 12.6, '#D8D4CC', '#7A4A2E']],
};

function labelTexture(p, text, w, h, bg, fg) {
  const PX = 24; // 월드 1단위 = 24px
  const cw = Math.round(w * PX), ch = Math.round(h * PX);
  return canvasImage(p, cw, ch, (c) => {
    c.fillStyle = bg;
    c.beginPath();
    c.roundRect(0, 0, cw, ch, Math.min(cw, ch) * 0.25);
    c.fill();
    c.fillStyle = fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    let size = ch * 0.72;
    c.font = `${size}px Jua, 'Apple SD Gothic Neo', sans-serif`;
    while (c.measureText(text).width > cw * 0.9 && size > 6) {
      size -= 2;
      c.font = `${size}px Jua, 'Apple SD Gothic Neo', sans-serif`;
    }
    c.fillText(text, cw / 2, ch / 2 + size * 0.05);
  });
}

// 목표 지점에서 가장 가까운, footprint 전체가 빈 잔디인 자리 (링 단위로 넓혀 가며)
function findSpot(grid, x, z, size, maxRing = 14) {
  const c = tileOf(x, z);
  const ax = c.tx - Math.floor(size[0] / 2), az = c.tz - Math.floor(size[1] / 2);
  for (let r = 0; r <= maxRing; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (grid.canPlace('house', ax + dx, az + dz, size)) return { tx: ax + dx, tz: az + dz };
      }
    }
  }
  return null;
}

// 건물을 그리드에 놓고 콜라이더를 등록한다 (나무·바위보다 먼저 불러야 자리를 차지한다)
// 돌려주는 avoid 목록은 주변 나무를 조금 비워 두는 데 쓴다
export function buildBuildings(p, { grid, colliders, groundHeight }) {
  const list = [];
  for (const b of buildingsData) {
    let target;
    if (b.near) {
      const pl = placeById(b.near);
      target = { x: pl.x + b.offset[0], z: pl.z + b.offset[1] };
    } else {
      target = latLonToWorld(b.lat, b.lon);
    }
    const spot = findSpot(grid, target.x, target.z, b.size);
    if (!spot) {
      console.warn(`건물 자리를 못 찾음: ${b.id}`);
      continue;
    }
    const obj = grid.placeObject('house', spot.tx, spot.tz, { size: b.size, building: b.id });
    const W = b.size[0] * S, D = b.size[1] * S;
    // 바닥: 네 귀퉁이 중 가장 높은 곳 (낮은 쪽은 받침돌이 가린다)
    let h = -Infinity;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) h = Math.max(h, groundHeight(obj.x + sx * W * 0.45, obj.z + sz * D * 0.45));
    // 직사각형 바닥을 긴 쪽으로 늘어선 원 콜라이더로
    const long = Math.max(W, D), short = Math.min(W, D), n = Math.ceil(long / short);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1) - 0.5) * (long - short);
      colliders.add(obj.x + (W >= D ? t : 0), obj.z + (W >= D ? 0 : t), short * 0.5 - 1, 'building');
    }
    list.push({
      ...b, x: obj.x, z: obj.z, h,
      geometry: p.buildGeometry(() => { p.noStroke(); SHAPES[b.id](p); }),
      labels: (LABELS[b.id] ?? []).map(([text, w, lh, lx, ly, lz, bg, fg]) => ({
        w, h: lh, x: lx, y: ly, z: lz, texture: labelTexture(p, text, w, lh, bg, fg),
      })),
    });
  }
  return {
    list,
    avoid: list.map(b => ({ x: b.x, z: b.z, r: Math.max(b.size[0], b.size[1]) * S * 0.75 })),
    draw(p) {
      for (const b of list) {
        p.push();
        p.translate(b.x, -b.h, b.z);
        p.fill(255);
        p.model(b.geometry);
        for (const l of b.labels) {
          p.push();
          p.translate(l.x, -l.y, l.z);
          p.texture(l.texture);
          p.plane(l.w, l.h);
          p.pop();
        }
        p.pop();
      }
    },
  };
}
