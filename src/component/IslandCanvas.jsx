import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createIslandWorld } from '../sketch/IslandSketch';

p5.disableFriendlyErrors = true; // 매 프레임 파라미터 검사 끄기 (성능)

// p5 마운트/언마운트만 담당. 스케치는 한 번만 만들고, React 리렌더링으로 다시 만들지 않는다.
function IslandCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    let world = null;
    let instance = null;
    // p5 2.x는 setup이 비동기라 setup 전에 remove()하면 인스턴스가 살아남는다.
    // StrictMode의 마운트→정리→마운트에서 첫 번째는 만들기 전에 취소되도록 한 틱 미룬다.
    const timer = setTimeout(() => {
      world = createIslandWorld();
      instance = new p5(world.sketch, containerRef.current);
    }, 0);
    return () => {
      clearTimeout(timer);
      instance?.remove();
      world?.dispose();
    };
  }, []);

  return <div ref={containerRef} className="islandCanvas" />;
}

export default IslandCanvas;
