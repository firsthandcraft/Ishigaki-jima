import { useRef, useState } from 'react';
import { live } from '../world/store';

const RADIUS = 48;
const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

// 모바일 좌하단 가상 조이스틱. 값만 live.joystick 으로 넘기고 이동은 스케치가 처리한다.
function Joystick() {
  const baseRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  if (!isTouchDevice) return null;

  const update = (e) => {
    const rect = baseRef.current.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) { dx *= RADIUS / len; dy *= RADIUS / len; }
    setKnob({ x: dx, y: dy });
    live.joystick.x = dx / RADIUS;
    live.joystick.y = -dy / RADIUS; // 화면 위 = 앞
  };
  const release = () => {
    setKnob({ x: 0, y: 0 });
    live.joystick.x = 0;
    live.joystick.y = 0;
  };

  return (
    <div
      ref={baseRef}
      className="joystick"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e); }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="joystickKnob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

export default Joystick;
