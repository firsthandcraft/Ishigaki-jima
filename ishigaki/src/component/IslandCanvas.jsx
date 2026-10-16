import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { createIslandSketch } from '../sketch/IslandSketch';

p5.disableFriendlyErrors = true; // 매 프레임 파라미터 검사 끄기 (성능)

// p5 마운트/언마운트만 담당. 스케치는 한 번만 만들고, React 리렌더링으로 다시 만들지 않는다.
function IslandCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    const instance = new p5(createIslandSketch(), containerRef.current);
    return () => instance.remove(); // StrictMode 이중 실행에도 캔버스가 2개 생기지 않게
  }, []);

  return <div ref={containerRef} className="islandCanvas" />;
}

export default IslandCanvas;
