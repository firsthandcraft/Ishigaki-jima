// OSM 해안선 데이터 → src/world/coastline.js
//
// 사용법:
//   node scripts/buildCoastline.mjs <overpass.json | coast.geojson> [목표 점 개수=260]
//
// 입력 데이터 받는 법 (overpass-turbo.eu 또는 Overpass API):
//   [out:json];
//   way["natural"="coastline"](24.32,124.06,24.62,124.36);
//   (._;>;);
//   out body;
//
// 여러 coastline way를 끝점끼리 이어 닫힌 ring으로 만들고, 그중 가장 큰 ring(이시가키지마 본섬)을
// Douglas-Peucker로 단순화해서 [lat, lon] 배열로 출력한다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , inputPath, targetArg] = process.argv;
if (!inputPath) {
  console.error('usage: node scripts/buildCoastline.mjs <overpass.json | coast.geojson> [targetPoints]');
  process.exit(1);
}
const TARGET = Number(targetArg) || 260;
const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// ---- 1. 입력을 [lon, lat] 좌표의 line 목록으로 통일 ----
function linesFromOverpass(data) {
  const nodes = new Map();
  for (const el of data.elements) if (el.type === 'node') nodes.set(el.id, [el.lon, el.lat]);
  return data.elements
    .filter(el => el.type === 'way')
    .map(way => way.nodes.map(id => nodes.get(id)).filter(Boolean));
}
function linesFromGeoJSON(data) {
  const lines = [];
  for (const f of data.features ?? []) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'LineString') lines.push(g.coordinates);
    if (g.type === 'MultiLineString') lines.push(...g.coordinates);
    if (g.type === 'Polygon') lines.push(g.coordinates[0]);
    if (g.type === 'MultiPolygon') for (const poly of g.coordinates) lines.push(poly[0]);
  }
  return lines;
}
const lines = raw.elements ? linesFromOverpass(raw) : linesFromGeoJSON(raw);

// ---- 2. 끝점이 같은 way끼리 이어 붙여 ring 만들기 ----
const key = ([lon, lat]) => `${lon.toFixed(7)},${lat.toFixed(7)}`;
const byStart = new Map();
for (const line of lines) if (line.length > 1) byStart.set(key(line[0]), line);

const rings = [];
const used = new Set();
for (const [startKey, first] of byStart) {
  if (used.has(startKey)) continue;
  used.add(startKey);
  const ring = [...first];
  let closed = key(ring[0]) === key(ring[ring.length - 1]);
  while (!closed) {
    const nextKey = key(ring[ring.length - 1]);
    const next = byStart.get(nextKey);
    if (!next || used.has(nextKey)) break;
    used.add(nextKey);
    ring.push(...next.slice(1));
    closed = key(ring[0]) === key(ring[ring.length - 1]);
  }
  if (closed) rings.push(ring.slice(0, -1));
}

// 면적은 대략 미터 단위로 비교 (경도 방향 cos 보정)
const COS = Math.cos(24.45 * Math.PI / 180);
function signedArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * COS * y2 - x2 * COS * y1;
  }
  return a / 2;
}
rings.sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));
const island = rings[0];
if (!island) {
  console.error('닫힌 해안선 ring을 찾지 못했습니다. bbox가 섬 전체를 덮는지 확인하세요.');
  process.exit(1);
}

// ---- 3. Douglas-Peucker 단순화 (목표 점 개수에 맞춰 epsilon 이분 탐색) ----
function perpDist(p, a, b) {
  const ax = a[0] * COS, ay = a[1], bx = b[0] * COS, by = b[1], px = p[0] * COS, py = p[1];
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function dp(points, eps) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(points[i], points[s], points[e]);
      if (d > max) { max = d; idx = i; }
    }
    if (max > eps && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}
// 닫힌 ring은 가장 먼 두 점으로 반을 나눠 각각 단순화
function simplifyRing(ring, eps) {
  let far = 0, farD = 0;
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot((ring[i][0] - ring[0][0]) * COS, ring[i][1] - ring[0][1]);
    if (d > farD) { farD = d; far = i; }
  }
  const a = dp(ring.slice(0, far + 1), eps);
  const b = dp([...ring.slice(far), ring[0]], eps);
  return [...a, ...b.slice(1, -1)];
}
let lo = 0, hi = 0.05, simplified = island;
for (let i = 0; i < 40; i++) {
  const mid = (lo + hi) / 2;
  const s = simplifyRing(island, mid);
  if (s.length > TARGET) lo = mid; else { hi = mid; simplified = s; }
}

// 시계방향(위에서 볼 때, 북쪽이 위)으로 통일
if (signedArea(simplified) > 0) simplified.reverse();
// 북쪽 끝(히라쿠보 곶)에서 시작
const northIdx = simplified.reduce((best, p, i) => (p[1] > simplified[best][1] ? i : best), 0);
simplified = [...simplified.slice(northIdx), ...simplified.slice(0, northIdx)];

// ---- 4. 출력 ----
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '../src/world/coastline.js');
const body = simplified.map(([lon, lat]) => `[${lat.toFixed(5)},${lon.toFixed(5)}]`);
const rowsOf8 = [];
for (let i = 0; i < body.length; i += 6) rowsOf8.push('  ' + body.slice(i, i + 6).join(','));
fs.writeFileSync(out, `// 자동 생성 파일 — scripts/buildCoastline.mjs 로 다시 만든다. 직접 고치지 말 것.
// 이시가키지마 해안선 [lat, lon], 시계방향, 히라쿠보 곶(북쪽 끝)에서 시작.
// 원본: ${island.length}점 → 단순화: ${simplified.length}점
// 데이터 출처: © OpenStreetMap contributors (ODbL) — https://www.openstreetmap.org/copyright
export const COASTLINE_LATLON = [
${rowsOf8.join(',\n')}
];
`);
console.log(`rings: ${rings.length}, island points: ${island.length} → ${simplified.length}`);
console.log(`wrote ${path.relative(process.cwd(), out)}`);
