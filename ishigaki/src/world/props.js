import { POI } from './config';

// 장식 소품. 모양은 setup에서 buildGeometry로 한 번만 만들고 draw에선 model()로 그리기만 한다.

// 장소 표지판: 나무 기둥 + 둥근 판. 앞면 아이콘 텍스처는 스케치에서 판 앞에 따로 붙인다. 원점 = 기둥 밑동
export function buildSignpost(p) {
  return p.buildGeometry(() => {
    p.noStroke();
    p.fill(POI.WOOD);
    p.push();
    p.translate(0, -POI.POLE_H / 2, -0.8);
    p.cylinder(1.1, POI.POLE_H, 8, 1);
    p.pop();
    p.fill(POI.RING);
    p.push();
    p.translate(0, -POI.POLE_H - POI.BOARD_R * 0.7, 0);
    p.rotateX(Math.PI / 2);
    p.cylinder(POI.BOARD_R, 1.4, 24, 1);
    p.pop();
  });
}

// 공항 비행기 (동물의 숲 비행장 느낌). 앞 = +z
export function buildAirplane(p) {
  return p.buildGeometry(() => {
    p.noStroke();
    // 동체
    p.fill('#FFFFFF');
    p.push();
    p.rotateX(Math.PI / 2);
    p.cylinder(5, 34, 14, 1);
    p.pop();
    p.push();
    p.translate(0, 0, 17);
    p.sphere(5, 14, 10);
    p.pop();
    p.push();
    p.translate(0, -1, -17);
    p.scale(1, 1, 1.6);
    p.sphere(4.2, 12, 8);
    p.pop();
    // 창문 띠
    p.fill('#5BB6E6');
    p.push();
    p.translate(0, -2, 4);
    p.box(10.4, 1.6, 20);
    p.pop();
    // 주날개
    p.fill('#4A90D9');
    p.push();
    p.translate(0, 1.5, 2);
    p.box(44, 1.2, 8);
    p.pop();
    // 꼬리날개
    p.push();
    p.translate(0, -1, -21);
    p.box(16, 1, 4);
    p.translate(0, -4.5, 0);
    p.box(1, 9, 5);
    p.pop();
    // 바퀴
    p.fill('#555555');
    for (const [x, z] of [[-4, 4], [4, 4], [0, 14]]) {
      p.push();
      p.translate(x, 5.5, z);
      p.sphere(1.6, 8, 6);
      p.pop();
    }
  });
}
