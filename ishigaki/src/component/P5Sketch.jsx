import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

const P5Sketch = () => {
  const containerRef = useRef();

  useEffect(() => {
    const sketch = (p) => {
      let waveOffset = 0;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        p.noStroke();
        p.describe('A white cone drawn on a sky background.');
      };

      p.draw = () => {
        p.background(113, 201, 255)//배경화면
        p.orbitControl();// 3D 그리기 코드
        p.lights();
        // 바다 (움직이는 파도)
        waveOffset += 0.05;
        p.push();
        p.rotateX(p.HALF_PI);
        for (let x =  -1000; x < 1000; x += 50) {
          for (let y = -500; y < 500; y += 50) {
            const z = Math.sin(p.frameCount * 0.02 + (x + y) * 0.01) * 10;
            p.push();
            p.translate(x, y, z);
            p.fill(0, 119, 190);
            p.plane(50, 50);
            p.pop();
          }
        }        
        // 첫 번째 원기둥(기본)
        p.translate(0, 50, 0);
        p.rotateX(p.HALF_PI);
        p.ambientMaterial(105, 189, 99); //색
        p.cylinder(200, 50);
        p.pop();
        p.push();

        //원기둥(기본)
        p.translate(350, -10, 50);
        p.rotateX(p.PI);
        p.ambientMaterial(105, 189, 99); //색
        p.cylinder(80, 30);
        p.pop();
        p.push();

        // 두 번째 원뿔 (조금 작고 기울어짐)
        p.translate(50, 50, -80);
        p.rotateX(p.PI * 0.95);
        p.ambientMaterial(105, 189, 99); //색
        p.cone(450, 350);//원뿔
        p.pop();
        p.push();
        
        //원기둥(기본)
        p.translate(240, -40, 0);
        p.rotateX(p.PI);
        p.ambientMaterial(105, 189, 99); //색
        p.cone(100, 40);//원뿔
        p.pop();
        p.push();

        // 세 번째 원뿔 (더 작고 반대 방향으로 살짝 기울어짐)
        p.translate(-300, 110, 200);
        p.rotateX(p.PI * 1.05);
        p.ambientMaterial(42, 180, 121);
        p.cone(400, 300);

        p.pop();
        p.camera(0, -200, 700, 0, 0, 0, 0, 1, 0);// 카메라 위치 조정

        // 야자수 (원기둥 + 원들)
        p.push();
        p.translate(0, -40,0); // x y-가 위 z 위치 조정 
        drawPalmTree(p);
        p.pop();

      };
      
      const drawPalmTree = (p) => {
        // 나무 기둥
        p.push();
        p.fill(139, 69, 19); // 갈색
        p.cylinder(10, 120); // 기둥
        p.pop();

        // 잎사귀 5개
        for (let i = 0; i < 5; i++) {
          p.push();
          p.rotateZ((p.TWO_PI / 5) * i);
          p.translate(30, -60, 0);
          p.fill(34, 139, 34);
          p.ellipse(0, 0, 40, 10);
          p.pop();
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
      <>
        <div
          ref={containerRef}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
        >
        </div>
        <h1 class="threeD-text">Ishigaki Island</h1>
      </>
  );
};

export default P5Sketch;
