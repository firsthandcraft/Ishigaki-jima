import { useEffect, useRef } from 'react';
import { PLACES } from '../world/poi';
import { live, worldStore } from '../world/store';
import { drawIslandBase, mapProjection } from '../world/islandMap';

const W = 150;
const PROJ = mapProjection(W, 10);
const H = PROJ.height;
const { toMap } = PROJ;

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
    drawIslandBase(bctx, PROJ); // 섬 모양·산은 한 번만 그려 두고, 매 프레임엔 장소 점과 플레이어만 덧그린다

    let raf;
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      // 건물: 작은 네모
      ctx.fillStyle = '#C8784A';
      for (const b of live.buildings) {
        const [x, y] = toMap(b.x, b.z);
        ctx.fillRect(x - 2.5, y - 2, 5, 4);
      }
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
