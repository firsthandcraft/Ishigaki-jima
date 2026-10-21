import { COAST, COAST_BOUNDS, latLonToWorld } from './geo';
import { TERRAIN, COLORS } from './config';

// 2D 섬 지도 공용 도우미 (우상단 미니맵, 주민 화면 지도). 북쪽이 위.
// width: 지도 폭(px), pad: 바다 여백(px) → { width, height, scale, toMap(x, z) → [px, py] }
export function mapProjection(width, pad) {
  const scale = (width - pad * 2) / (COAST_BOUNDS.maxX - COAST_BOUNDS.minX);
  const height = Math.round((COAST_BOUNDS.maxZ - COAST_BOUNDS.minZ) * scale + pad * 2);
  const toMap = (x, z) => [pad + (x - COAST_BOUNDS.minX) * scale, pad + (z - COAST_BOUNDS.minZ) * scale];
  return { width, height, scale, toMap };
}

// 바다 바탕 + 해안선(모래 테두리) + 잔디 + 산
export function drawIslandBase(ctx, { width, height, scale, toMap }, { radius = 14, sea = COLORS.shallow, coastWidth = 3 } = {}) {
  ctx.fillStyle = sea;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fill();
  ctx.beginPath();
  COAST.forEach((pt, i) => {
    const [x, y] = toMap(pt.x, pt.z);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.lineWidth = coastWidth;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLORS.sand;
  ctx.stroke();
  ctx.fillStyle = COLORS.grass1;
  ctx.fill();
  ctx.fillStyle = COLORS.mountain;
  for (const m of TERRAIN.MOUNTAINS) {
    const w = latLonToWorld(m.lat, m.lon);
    const [x, y] = toMap(w.x, w.z);
    ctx.beginPath();
    ctx.arc(x, y, m.radius * scale * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}
