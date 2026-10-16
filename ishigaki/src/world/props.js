import { POI, PROPS, TERRAIN } from './config';
import { COAST_BOUNDS, pointInPolygon, signedDistance } from './geo';
import { mountainHeight } from './terrain';
import { mulberry32 } from './mesh';

// 장식 소품. 모양은 setup에서 buildGeometry로 한 번만 만들고 draw에선 model()로 그리기만 한다.

// 장소 표지판: 나무 기둥 + 둥근 판. 앞면 아이콘 텍스처는 스케치에서 판 앞에 따로 붙인다. 원점 = 기둥 밑동
export function buildSignpost(p) {
  return p.buildGeometry(() => {
    p.noStroke();
    p.fill(POI.WOOD);
    p.push();
    p.translate(0, -POI.POLE_H / 2, -0.8);
    p.cylinder(1.1, POI.POLE_H, 8, 1);
    p.pop();
    p.fill(POI.RING);
    p.push();
    p.translate(0, -POI.POLE_H - POI.BOARD_R * 0.7, 0);
    p.rotateX(Math.PI / 2);
    p.cylinder(POI.BOARD_R, 1.4, 24, 1);
    p.pop();
  });
}

// 공항 비행기 (동물의 숲 비행장 느낌). 앞 = +z
export function buildAirplane(p) {
  return p.buildGeometry(() => {
    p.noStroke();
    // 동체
    p.fill('#FFFFFF');
    p.push();
    p.rotateX(Math.PI / 2);
    p.cylinder(5, 34, 14, 1);
    p.pop();
    p.push();
    p.translate(0, 0, 17);
    p.sphere(5, 14, 10);
    p.pop();
    p.push();
    p.translate(0, -1, -17);
    p.scale(1, 1, 1.6);
    p.sphere(4.2, 12, 8);
    p.pop();
    // 창문 띠
    p.fill('#5BB6E6');
    p.push();
    p.translate(0, -2, 4);
    p.box(10.4, 1.6, 20);
    p.pop();
    // 주날개
    p.fill('#4A90D9');
    p.push();
    p.translate(0, 1.5, 2);
    p.box(44, 1.2, 8);
    p.pop();
    // 꼬리날개
    p.push();
    p.translate(0, -1, -21);
    p.box(16, 1, 4);
    p.translate(0, -4.5, 0);
    p.box(1, 9, 5);
    p.pop();
    // 바퀴
    p.fill('#555555');
    for (const [x, z] of [[-4, 4], [4, 4], [0, 14]]) {
      p.push();
      p.translate(x, 5.5, z);
      p.sphere(1.6, 8, 6);
      p.pop();
    }
  });
}

// ---- 나무·꽃·바위 ----
// 각 함수는 (p, rng) 를 받아 원점(밑동)에 한 그루를 그린다. buildGeometry 안에서만 호출.
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const C = PROPS.colors;

function palm(p, rng) {
  const lean = (rng() - 0.5) * 0.5;
  const segs = 4, segH = 6.5;
  p.fill(C.palmTrunk);
  p.push();
  p.rotateZ(lean * 0.4);
  for (let i = 0; i < segs; i++) {
    p.push();
    p.translate(0, -segH * (i + 0.5), 0);
    p.cylinder(1.5 - i * 0.12, segH + 0.6, 6, 1);
    p.pop();
    p.rotateZ(lean * 0.25);
  }
  p.translate(0, -segH * segs, 0);
  const leaves = 6;
  const leafColor = pick(rng, C.palmLeaf);
  for (let i = 0; i < leaves; i++) {
    p.push();
    p.rotateY((Math.PI * 2 * i) / leaves + rng() * 0.4);
    p.rotateX(0.55 + rng() * 0.25); // 바깥으로 축 처지게
    p.translate(0, 0, 8);
    p.fill(leafColor);
    p.ellipsoid(3, 0.6, 9, 6, 4);
    p.pop();
  }
  p.fill(C.coconut);
  for (let i = 0; i < 3; i++) {
    p.push();
    p.rotateY(i * 2.1);
    p.translate(1.4, 1.2, 0);
    p.sphere(1.1, 5, 4);
    p.pop();
  }
  p.pop();
}

function roundTree(p, rng) {
  const s = 0.85 + rng() * 0.35;
  p.scale(s);
  p.fill(C.trunk);
  p.push();
  p.translate(0, -5, 0);
  p.cylinder(1.8, 10, 6, 1);
  p.pop();
  const c = pick(rng, C.leaf);
  p.fill(c);
  p.push();
  p.translate(0, -16, 0);
  p.sphere(8.5, 9, 7);
  p.translate(3.5, 3, 2);
  p.sphere(6, 8, 6);
  p.translate(-7, 0.5, -1);
  p.sphere(5.6, 8, 6);
  p.pop();
}

function flowers(p, rng) {
  const color = pick(rng, C.flower);
  const n = 4 + Math.floor(rng() * 4);
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2, r = rng() * 4;
    p.push();
    p.translate(Math.cos(a) * r, -1.2, Math.sin(a) * r);
    p.fill('#4F9E45');
    p.ellipsoid(0.9, 0.35, 0.9, 4, 3);
    p.translate(0, -0.6, 0);
    p.fill(color);
    p.sphere(0.85, 5, 4);
    p.pop();
  }
}

function rock(p, rng) {
  p.fill(pick(rng, C.rock));
  p.rotateY(rng() * Math.PI);
  const s = 2.2 + rng() * 3;
  p.push();
  p.translate(0, -s * 0.35, 0);
  p.ellipsoid(s * 1.25, s * 0.75, s, 7, 5);
  p.pop();
}

// 섬 위에 소품을 흩뿌려 하나의 geometry로 묶는다. 나무·바위는 콜라이더도 등록.
// avoid: [{ x, z, r }] 비워 둘 원 (장소, 시작 지점 등)
export function buildVegetation(p, { groundHeight, colliders, avoid }) {
  const rng = mulberry32(PROPS.SEED);
  const T = TERRAIN;
  const items = [];
  const blocked = (x, z, r) =>
    avoid.some(a => (a.x - x) ** 2 + (a.z - z) ** 2 < (a.r + r) ** 2) || colliders.overlaps(x, z, r);
  const nearCliff = (sd) => Math.abs(sd - T.BEACH_WIDTH) < 7 || Math.abs(sd - T.TIER2_AT) < 7;
  const onRoad = (sd) => Math.abs(sd - T.ROAD_INSET) < T.ROAD_WIDTH / 2 + PROPS.CLEAR_ROAD;

  function scatter(count, { accept, radius, draw, collider }) {
    let placed = 0;
    for (let tries = 0; placed < count && tries < count * 40; tries++) {
      const x = COAST_BOUNDS.minX + rng() * (COAST_BOUNDS.maxX - COAST_BOUNDS.minX);
      const z = COAST_BOUNDS.minZ + rng() * (COAST_BOUNDS.maxZ - COAST_BOUNDS.minZ);
      if (!pointInPolygon(x, z)) continue;
      const sd = signedDistance(x, z);
      if (nearCliff(sd) || onRoad(sd) || !accept(x, z, sd)) continue;
      if (blocked(x, z, radius)) continue;
      if (collider) colliders.add(x, z, collider, 'prop');
      items.push({ x, z, h: groundHeight(x, z), draw, yaw: rng() * Math.PI * 2, seed: rng() });
      placed++;
    }
  }

  scatter(PROPS.PALMS, {
    accept: (x, z, sd) => sd > 10 && sd < 110,
    radius: 6, collider: 2.2, draw: palm,
  });
  scatter(PROPS.TREES, {
    // 산에선 거의 다 받고, 평지에선 듬성듬성
    accept: (x, z, sd) => sd > 90 && rng() < (mountainHeight(x, z, sd) > 4 ? 0.95 : 0.3),
    radius: 9, collider: 3.2, draw: roundTree,
  });
  scatter(PROPS.ROCKS, {
    accept: (x, z, sd) => (sd > 6 && sd < 30) || mountainHeight(x, z, sd) > 20,
    radius: 5, collider: 3, draw: rock,
  });
  scatter(PROPS.FLOWERS, {
    accept: (x, z, sd) => sd > T.BEACH_WIDTH + 8 && mountainHeight(x, z, sd) < 15,
    radius: 4, draw: flowers,
  });

  const geometry = p.buildGeometry(() => {
    p.noStroke();
    for (const it of items) {
      const local = mulberry32(Math.floor(it.seed * 1e9));
      p.push();
      p.translate(it.x, -it.h + 0.3, it.z);
      p.rotateY(it.yaw);
      it.draw(p, local);
      p.pop();
    }
  });
  return { geometry, count: items.length };
}
