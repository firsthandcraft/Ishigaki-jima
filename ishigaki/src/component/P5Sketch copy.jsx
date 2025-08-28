import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

import drawSea from '../js/drawSea'; 
import drawPalmTree from '../js/drawTree'; 
import drawIsland from '../js/drawIsland'; 


const P5Sketch = ({ cameraPosition }) => {
  const containerRef = useRef();
// 1. 카메라의 목표 위치를 저장할 Ref (P5.js와 React 간의 데이터 공유)
  const targetCameraRef = useRef(cameraPosition);
  
  // 2. 카메라의 현재 위치를 저장할 Ref를 컴포넌트 최상단에 선언합니다.
  const currentCameraRef = useRef({
    x: 0,
    y: -200,
    z: 700
  });
  useEffect(() => {
    targetCameraRef.current = cameraPosition;
    console.log("cameraPosition>>>>>>"+cameraPosition)
  }, [cameraPosition]);

  useEffect(() => {
    const sketch = (p) => {
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        p.noStroke();
        p.describe('A white cone drawn on a sky background.');
      };
      p.draw = () => {
        p.background(89, 188, 248)//배경화면
        p.orbitControl();// 3D 그리기 코드
        p.lights();
        // 바다 (움직이는 파도)
        drawSea(p);
        // 섬 그리기
        drawIsland(p);
        // 야자수 (원기둥 + 원들)
        p.translate(0, -40,0); // x y-가 위 z 위치 조정 
        drawPalmTree(p);

        //카메라 이동 로직 - 이 부분이 p.draw 함수 안에 있어야 합니다. 
        //기본 뷰 p.camera(0, -200, 700, 0, 0, 0, 0, 1, 0);
        
        // const cameraTargetX = isRegisteringRef.current ? -300 : 0;
        // // 현재 X 위치를 목표 X 위치로 0.05(5%)씩 부드럽게 보간
        // currentCameraXRef.current = p.lerp(currentCameraXRef.current, cameraTargetX, 0.05);
        // // 보간된 카메라 위치를 적용
        // p.camera(currentCameraXRef.current, -200, 700, 0, 0, 0, 0, 1, 0);
        // const targetX = cameraPosition;

        // // p.cameraX가 유효한 값인지 확인하고, 아니면 0을 사용
        // const currentCameraX = p.lerp(p.cameraX || 0, targetX, 0.05);

        // p.camera(currentCameraX, -200, 700, 0, 0, 0, 0, 1, 0);

        currentCameraRef.current.x = p.cameraX;
        currentCameraRef.current.y = p.cameraY;
        currentCameraRef.current.z = p.cameraZ;

      };
      p.mouseDragged = () => {
        // useRef에 저장된 값을 읽어와서 안전하게 출력합니다.
        const camPos = currentCameraRef.current;
        if (camPos && camPos.x !== undefined) {
          console.log(
            "마우스 드래그 감지: 카메라 위치: X=", camPos.x.toFixed(2),
            " Y=", camPos.y.toFixed(2),
            " Z=", camPos.z.toFixed(2)
          );
        }
      };
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
      
    };

    const myP5 = new p5(sketch, containerRef.current);

    return () => {
      myP5.remove();
    };
  }, []);

  return (
      <div
        ref={containerRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      >
      </div>
  );
};

export default P5Sketch;
