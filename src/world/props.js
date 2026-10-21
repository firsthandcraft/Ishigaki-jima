import { FLOWERS, GRID, POI, PROPS, TREES } from './config';
import { signedDistance } from './geo';
import { mountainHeight } from './terrain';
import { tileCenter } from './grid';
import { mulberry32, smoothstep, valueNoise2 } from './mesh';
import { OTHER_COLORS, OTHER_TYPES, TULIP_COLORS } from './flowers';

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

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// 잔디 타일에 소품을 grid.placeObject로 배치하고, 나무·바위·꽃을 인스턴스 목록(trees, flowers)으로 돌려준다. 나무·바위는 콜라이더도 등록.
// avoid: [{ x, z, r }] 비워 둘 원 (장소, 시작 지점 등)
export function buildVegetation({ grid, colliders, avoid }) {
  const rng = mulberry32(PROPS.SEED);
  const forestNoise = valueNoise2(PROPS.SEED);

  const grassTiles = grid.tilesOfType('empty');
  const grassCount = grassTiles.length;
  const candidates = grassTiles
    .map(({ tx, tz }) => {
      const { x, z } = tileCenter(tx, tz);
      const sd = signedDistance(x, z);
      return { tx, tz, x, z, sd, m: mountainHeight(x, z, sd) };
    })
    .filter(t => !avoid.some(a => (a.x - t.x) ** 2 + (a.z - t.z) ** 2 < a.r * a.r));

  // 가중치 랜덤 순서 (A-Res: key = u^(1/w)) 로 줄 세운 뒤 앞에서부터 놓을 수 있는 만큼 놓는다.
  // 가중치가 큰 곳(숲 군집)은 빽빽하게, 작은 곳은 드문드문 채워진다.
  function place(type, target, weightOf, extraOf) {
    const order = [];
    for (const t of candidates) {
      const wgt = weightOf(t);
      if (wgt > 0) order.push({ t, key: rng() ** (1 / wgt) });
    }
    order.sort((a, b) => b.key - a.key);
    const placed = [];
    for (const { t } of order) {
      if (placed.length >= target) break;
      const obj = grid.placeObject(type, t.tx, t.tz, extraOf(t));
      if (obj) placed.push(obj);
    }
    return placed;
  }

  const palmZone = (t) => t.sd < PROPS.PALM_BAND;
  // 나무: 해변 쪽은 야자수만 드문드문, 내륙은 노이즈 군집(숲) + 산
  const trees = place('tree', Math.round(grassCount * PROPS.TREE_RATIO), (t) => {
    if (palmZone(t)) return PROPS.PALM_WEIGHT;
    const forest = smoothstep(PROPS.FOREST_EDGE, 0.85, forestNoise(t.tx / PROPS.FOREST_SCALE, t.tz / PROPS.FOREST_SCALE));
    return PROPS.TREE_SPARSE + forest + (t.m > 4 ? PROPS.MOUNTAIN_BONUS : 0);
  }, (t) => ({ variant: palmZone(t) ? 'palm' : 'round' }));
  const rocks = place('rock', Math.round(grassCount * PROPS.ROCK_RATIO),
    (t) => (t.m > 20 || t.sd < 70 ? 1 : 0), () => ({}));
  const flowers = plantFlowerClusters(Math.round(grassCount * PROPS.FLOWER_RATIO));

  // 꽃: 군락 = 4×3 ~ 5×4 타일 직사각형을 빈틈없이 (1타일 1송이), 같은 종류·같은 색. 튤립 군락엔 봉오리 30%.
  // 군락 시작점(직사각형 모서리)은 집 앞 > 나무 바로 옆 = 길 가장자리 > 그 밖의 잔디 순으로 뽑힌다
  function plantFlowerClusters(target) {
    const F = FLOWERS;
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const key = (tx, tz) => `${tx},${tz}`;
    const lowland = candidates.filter(t => t.m < 15);
    const allowed = new Set(lowland.map(t => key(t.tx, t.tz)));
    const touches = (t, types, ring) => ring.some(([dx, dz]) => types.includes(grid.get(t.tx + dx, t.tz + dz)));
    const seedWeight = (t) => {
      if (touches(t, ['reserved', 'house'], N8)) return F.NEAR_HOUSE;
      if (touches(t, ['tree'], N8)) return F.NEAR_TREE;
      if (touches(t, ['path'], N4)) return F.NEAR_PATH;
      return F.BASE_WEIGHT;
    };
    const order = lowland.map(t => ({ t, key: rng() ** (1 / seedWeight(t)) })).sort((a, b) => b.key - a.key);
    // 직사각형 칸이 전부 비어 있고, 다른 군락과 한 칸 이상 떨어져 있어야 한다
    const fits = (tx0, tz0, w, h) => {
      for (let dz = 0; dz < h; dz++) {
        for (let dx = 0; dx < w; dx++) {
          const tx = tx0 + dx, tz = tz0 + dz;
          if (!allowed.has(key(tx, tz)) || !grid.canPlace('flower', tx, tz)) return false;
          if (touches({ tx, tz }, ['flower'], N8)) return false;
        }
      }
      return true;
    };

    const placed = [];
    for (const { t } of order) {
      if (placed.length >= target) break;
      const [w, h] = pick(rng, F.CLUSTER_SIZES);
      if (!fits(t.tx, t.tz, w, h)) continue;
      const isTulip = rng() >= F.OTHER_CHANCE;
      const type = isTulip ? 'tulip' : pick(rng, OTHER_TYPES);
      const color = pick(rng, isTulip ? TULIP_COLORS : OTHER_COLORS);
      for (let dz = 0; dz < h; dz++) {
        for (let dx = 0; dx < w; dx++) {
          const flowerType = isTulip && rng() < F.BUD_CHANCE ? 'tulipBud' : type;
          placed.push(grid.placeObject('flower', t.tx + dx, t.tz + dz, { flowerType, color }));
        }
      }
    }
    return placed;
  }

  const COLLIDER = { palm: 3.5, round: 4.5, rock: 7 };
  for (const o of [...trees, ...rocks]) colliders.add(o.x, o.z, COLLIDER[o.variant ?? o.type], 'prop');

  // 나무·바위 인스턴스: 위치는 타일 중앙 그대로, 크기·Y축 회전(수직 유지)·모양·열매·바람 위상만 랜덤
  const treeInstances = [...trees, ...rocks].map((o) => ({
    x: o.x, z: o.z,
    variant: o.variant ?? o.type,
    shape: Math.floor(rng() * 6),
    yaw: rng() * Math.PI * 2,
    scale: TREES.SCALE_MIN + rng() * (TREES.SCALE_MAX - TREES.SCALE_MIN),
    fruit: o.variant === 'round' && rng() < TREES.FRUIT_CHANCE,
    phase: rng() * Math.PI * 2,
  }));

  // 꽃은 타일 중앙에서 ±JITTER 만큼만 흔들어 너무 기계적이지 않게
  const jitter = () => (rng() - 0.5) * 2 * FLOWERS.JITTER * GRID.TILE;
  const flowerInstances = flowers.map((o) => ({
    x: o.x + jitter(), z: o.z + jitter(),
    type: o.flowerType,
    color: o.color,
    yaw: rng() * Math.PI * 2,
    scale: FLOWERS.SCALE_MIN + rng() * (FLOWERS.SCALE_MAX - FLOWERS.SCALE_MIN),
    phase: rng() * Math.PI * 2,
  }));

  const palms = trees.filter(t => t.variant === 'palm').length;
  return {
    trees: treeInstances,
    flowers: flowerInstances,
    count: treeInstances.length + flowerInstances.length,
    stats: { grass: grassCount, trees: trees.length, palms, rocks: rocks.length, flowers: flowers.length },
  };
}
