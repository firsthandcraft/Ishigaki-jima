import placesData from '../data/places.json';
import { POI } from './config';
import { latLonToWorld, pullInside } from './geo';
import { nearestTile, tileCenter } from './grid';

// 여행 장소 데이터 → 월드 좌표. 섬 밖(바다)에 찍힌 장소는 해안 안쪽으로 끌어당긴 뒤,
// 가장 가까운 잔디 타일 중앙에 맞춘다 (표지판은 모래·길·절벽 위에 못 놓음)
export const PLACES = placesData.map((place) => {
  const w = latLonToWorld(place.lat, place.lon);
  const pulled = pullInside(w.x, w.z, POI.PULL_INSET);
  const { tx, tz } = nearestTile(pulled.x, pulled.z, type => type === 'empty');
  return { ...place, tx, tz, ...tileCenter(tx, tz) };
});

export const placeById = (id) => PLACES.find(pl => pl.id === id) ?? null;

// 반경 안에서 가장 가까운 장소 (없으면 null)
export function nearestPlace(x, z) {
  let best = null, bestD2 = POI.RADIUS * POI.RADIUS;
  for (const pl of PLACES) {
    const d2 = (pl.x - x) ** 2 + (pl.z - z) ** 2;
    if (d2 < bestD2) { bestD2 = d2; best = pl; }
  }
  return best;
}

// 표지판 앞면 텍스처 (아이콘별로 한 번만 만든다)
export function makeIconTexture(p, icon) {
  const S = 128;
  const g = p.createGraphics(S, S);
  g.pixelDensity(1);
  g.clear();
  g.noStroke();
  g.fill(POI.RING);
  g.circle(S / 2, S / 2, S - 2);
  g.fill('#FFF8E7');
  g.circle(S / 2, S / 2, S - 22);
  const emoji = POI.ICONS[icon];
  if (emoji) {
    g.textAlign(g.CENTER, g.CENTER);
    g.textSize(62);
    g.text(emoji, S / 2, S / 2 + 4);
  } else {
    drawLighthouse(g, S);
  }
  return g;
}

function drawLighthouse(g, S) {
  const cx = S / 2;
  g.fill('#E85D5D');
  g.quad(cx - 16, S * 0.78, cx + 16, S * 0.78, cx + 10, S * 0.36, cx - 10, S * 0.36);
  g.fill('#FFFFFF');
  g.quad(cx - 14.4, S * 0.66, cx + 14.4, S * 0.66, cx + 12.5, S * 0.54, cx - 12.5, S * 0.54);
  g.fill('#FFD45A');
  g.rect(cx - 8, S * 0.27, 16, 11, 3);
  g.fill('#E85D5D');
  g.triangle(cx - 12, S * 0.27, cx + 12, S * 0.27, cx, S * 0.17);
  g.fill('#7FB3D5');
  g.rect(cx - 22, S * 0.78, 44, 6, 3);
}
