import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

import drawSea from '../js/drawSea'; 
import drawPalmTree from '../js/drawTree'; 
import drawIsland from '../js/drawIsland'; 
import drawFish from '../js/drawFish'; 


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
    const sketch = (p) => {
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        p.noStroke();
        p.describe('A white cone drawn on a sky background.');
      };
      p.draw = () => {
        p.background(89, 188, 248)//배경화면
        // 3D 그리기 코드
        if(cameraPosition == 0){
          p.orbitControl();
        }else if (cameraPosition == 1){
          p.camera(0, 2000, -500, 0,-300, 0, 0, 1, 0);
        }else if (cameraPosition == 2){
          p.camera(0, -10, -700, 200,0, 100, 0, 1, 0);
        }
        p.lights();
        // 바다 (움직이는 파도)
        drawSea(p);
        // 섬 그리기
        drawIsland(p);
        // 야자수 (원기둥 + 원들)
        p.translate(0, -40,0); // x y-가 위 z 위치 조정 
        drawPalmTree(p);
        
        //drawFish
        p.translate(500, 100, 100);//왼오 위아래 앞뒤
        drawFish(p);
        p.translate(30, 20, 40);//왼오 위아래 앞뒤
        drawFish(p);
        p.translate(30, 1, 30);//왼오 위아래 앞뒤
        drawFish(p);
        //카메라 이동 로직 - 이 부분이 p.draw 함수 안에 있어야 합니다. 
        //기본 뷰 
        // 
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
      
    };

    const myP5 = new p5(sketch, containerRef.current);

    return () => {
      myP5.remove();
    };
  }, [cameraPosition]);

  return (
      <div
        ref={containerRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      >
      </div>
  );
};

export default P5Sketch;
