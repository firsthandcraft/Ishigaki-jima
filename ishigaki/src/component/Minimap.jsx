import { useEffect, useRef } from 'react';
import { COAST, COAST_BOUNDS, latLonToWorld } from '../world/geo';
import { TERRAIN, COLORS } from '../world/config';
import { PLACES } from '../world/poi';
import { live, worldStore } from '../world/store';

const W = 150;
const PAD = 10;
const scale = (W - PAD * 2) / (COAST_BOUNDS.maxX - COAST_BOUNDS.minX);
const H = Math.round((COAST_BOUNDS.maxZ - COAST_BOUNDS.minZ) * scale + PAD * 2);
const toMap = (x, z) => [PAD + (x - COAST_BOUNDS.minX) * scale, PAD + (z - COAST_BOUNDS.minZ) * scale];

// 섬 모양·산은 한 번만 그려 두고, 매 프레임엔 장소 점과 플레이어만 덧그린다
function drawBase(ctx) {
  ctx.fillStyle = COLORS.shallow;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 14);
  ctx.fill();
  ctx.beginPath();
  COAST.forEach((pt, i) => {
    const [x, y] = toMap(pt.x, pt.z);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.lineWidth = 3;
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

// 우상단 미니맵: 해안선 + 장소(들른 곳은 체크) + 플레이어 화살표. 북쪽이 항상 위.
function Minimap() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const base = document.createElement('canvas');
    base.width = W * dpr;
    base.height = H * dpr;
    const bctx = base.getContext('2d');
    bctx.scale(dpr, dpr);
    drawBase(bctx);

    let raf;
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      const { visited, nearPlaceId } = worldStore.get();
      for (const pl of PLACES) {
        const [x, y] = toMap(pl.x, pl.z);
        const done = visited.includes(pl.id);
        ctx.beginPath();
        ctx.arc(x, y, pl.id === nearPlaceId ? 5 : 3.6, 0, Math.PI * 2);
        ctx.fillStyle = done ? '#F2A65A' : '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#8A6A4A';
        ctx.stroke();
        if (done) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x - 1.8, y);
          ctx.lineTo(x - 0.4, y + 1.4);
          ctx.lineTo(x + 2, y - 1.6);
          ctx.stroke();
        }
      }
      const [px, py] = toMap(live.player.x, live.player.z);
      const angle = Math.atan2(Math.cos(live.player.yaw), Math.sin(live.player.yaw));
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-4.5, 4.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4.5, -4.5);
      ctx.closePath();
      ctx.fillStyle = '#E8604C';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="minimap">
      <canvas ref={canvasRef} style={{ width: W, height: H }} aria-label="이시가키지마 미니맵" role="img" />
      <span className="minimapNorth" aria-hidden="true">N</span>
    </div>
  );
}

export default Minimap;
