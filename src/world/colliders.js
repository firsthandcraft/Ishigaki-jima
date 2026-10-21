// 나무·바위·건물용 원형 콜라이더. 격자 버킷으로 주변 것만 빠르게 찾는다.
const CELL = 64;

export function createColliders() {
  const buckets = new Map();
  const all = [];
  const key = (i, j) => `${i},${j}`;

  function add(x, z, r, tag) {
    const c = { x, z, r, tag };
    all.push(c);
    const i0 = Math.floor((x - r) / CELL), i1 = Math.floor((x + r) / CELL);
    const j0 = Math.floor((z - r) / CELL), j1 = Math.floor((z + r) / CELL);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const k = key(i, j);
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(c);
      }
    }
    return c;
  }

  // (x,z) 주변 버킷의 콜라이더 (같은 콜라이더가 겹쳐 나올 수 있으나 밀어내기엔 문제없음)
  function near(x, z) {
    return buckets.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) ?? EMPTY;
  }

  // 점에서 radius 안에 콜라이더가 있는지 (소품 배치 때 겹침 방지용)
  function overlaps(x, z, radius) {
    for (const c of near(x, z)) {
      if ((c.x - x) ** 2 + (c.z - z) ** 2 < (c.r + radius) ** 2) return true;
    }
    return false;
  }

  return { add, near, overlaps, all };
}
const EMPTY = [];
