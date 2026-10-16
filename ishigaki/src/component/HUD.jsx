import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/hud.css';
import Navigation from './Navigation';
import RegionBanner from './RegionBanner';
import PlaceCard from './PlaceCard';
import Minimap from './Minimap';
import Joystick from './Joystick';
import { live } from '../world/store';
import { DEBUG } from '../world/debug';

function FpsMeter() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFps(Math.round(live.fps)), 500);
    return () => clearInterval(id);
  }, []);
  return <div className="fpsMeter">{fps} fps</div>;
}

// 섬 위 UI. 기존 좌상단 아이콘(Navigation)은 그대로, 섬 전용 UI는 홈(섬) 화면에서만 보인다.
function HUD() {
  const { pathname } = useLocation();
  const onIsland = pathname === '/';
  return (
    <>
      <Navigation />
      {onIsland && (
        <>
          <RegionBanner />
          <Minimap />
          <PlaceCard />
          <Joystick />
        </>
      )}
      {DEBUG.fps && <FpsMeter />}
    </>
  );
}

export default HUD;
