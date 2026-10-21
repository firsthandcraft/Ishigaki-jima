// 캐릭터용 매끈한 메시 빌더. 격자로 표면을 훑어 삼각형을 만들고, 법선은 이웃 점으로 계산한다 (flat shading 없음).
// 만든 메시는 p5 인스턴스 + key 마다 한 번만 만든다.

const caches = new WeakMap();

export function cached(p, key, build) {
  if (!caches.has(p)) caches.set(p, new Map());
  const m = caches.get(p);
  if (!m.has(key)) m.set(key, build());
  return m.get(key);
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// point(u, v) → [x, y, z], u: 0~1 (행, 위→아래), v: 0~1 (둘레)
// opts.center: 바깥쪽 판단 기준점 (법선이 이 점에서 멀어지는 쪽을 보게). (u, v) => 점 함수도 된다
// opts.uv([x, y, z], u, v) → [s, t] (텍스처 좌표, NORMAL 모드)
export function surface(p, rows, cols, point, { center = [0, 0, 0], uv } = {}) {
  const e = 1e-3;
  const normal = (u, v) => {
    const uu = Math.min(1 - 2 * e, Math.max(2 * e, u)); // 극점에서는 살짝 안쪽 점으로 계산
    const t1 = sub(point(uu, v + e), point(uu, v - e));
    const t2 = sub(point(uu + e, v), point(uu - e, v));
    let n = cross(t1, t2);
    const len = Math.hypot(...n) || 1;
    n = n.map(c => c / len);
    const out = sub(point(u, v), typeof center === 'function' ? center(u, v) : center);
    return n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0 ? n.map(c => -c) : n;
  };
  const grid = [];
  for (let i = 0; i <= rows; i++) {
    const row = [];
    for (let j = 0; j <= cols; j++) {
      const u = i / rows, v = j / cols;
      const pos = point(u, v);
      row.push({ pos, n: normal(u, v), t: uv ? uv(pos, u, v) : null });
    }
    grid.push(row);
  }
  p.push();
  p.textureMode(p.NORMAL);
  const geom = p.buildGeometry(() => {
    p.beginShape(p.TRIANGLES);
    const put = (g) => {
      p.normal(...g.n);
      if (g.t) p.vertex(...g.pos, ...g.t);
      else p.vertex(...g.pos);
    };
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], d = grid[i][j + 1];
        put(a); put(b); put(c);
        put(a); put(c); put(d);
      }
    }
    p.endShape();
  });
  p.pop();
  return geom;
}

// 경로를 따라가는 매끈한 튜브 (꼬리·더듬이 등). path(t) → [x, y, z], radius(t) → 반지름, t: 0~1
// 양 끝은 radius가 0이 되게 주면 둥글게 닫힌다
export function tube(p, rows, path, radius) {
  const e = 1e-3;
  return surface(p, rows, 12, (u, v) => {
    const t = Math.min(1, Math.max(0, u));
    const c = path(t), a = path(Math.min(1, t + e)), b = path(Math.max(0, t - e));
    let T = sub(a, b);
    const lt = Math.hypot(...T) || 1;
    T = T.map(x => x / lt);
    const up = Math.abs(T[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    let B = cross(T, up);
    const lb = Math.hypot(...B) || 1;
    B = B.map(x => x / lb);
    const N = cross(B, T);
    const r = radius(t), ang = v * Math.PI * 2;
    const cb = Math.cos(ang) * r, cn = Math.sin(ang) * r;
    return [c[0] + B[0] * cb + N[0] * cn, c[1] + B[1] * cb + N[1] * cn, c[2] + B[2] * cb + N[2] * cn];
  }, { center: (u) => path(Math.min(1, Math.max(0, u))) });
}

// 양 끝이 둥근 튜브 굵기: 가운데 r, 끝으로 갈수록 (1 - taper)배
export const roundedRadius = (r, taper = 0) => (t) =>
  r * (1 - taper * t) * Math.sqrt(Math.max(0, 1 - ((2 * t - 1) ** 8)));
