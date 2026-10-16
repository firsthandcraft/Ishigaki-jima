import { CAMERA, LIGHT } from '../world/config';
import { COAST_BOUNDS } from '../world/geo';
import { buildTerrain } from '../world/terrain';
import { buildSea, buildFoam } from '../world/sea';
import { DEBUG } from '../world/debug';

// p5 instance-mode 스케치. IslandCanvas가 한 번만 생성하고 언마운트 때 remove() 한다.
export function createIslandSketch() {
  return (p) => {
    let terrain, sea, foam;

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      p.noStroke();
      const t0 = performance.now();
      terrain = buildTerrain(p);
      sea = buildSea(p);
      foam = buildFoam(p);
      if (DEBUG.fps) console.info(`world built in ${Math.round(performance.now() - t0)}ms, terrain ${terrain.triangles} tris`);
    };

    function setTopCamera() {
      const w = COAST_BOUNDS.maxX - COAST_BOUNDS.minX;
      const h = COAST_BOUNDS.maxZ - COAST_BOUNDS.minZ;
      const cx = (COAST_BOUNDS.minX + COAST_BOUNDS.maxX) / 2;
      const cz = (COAST_BOUNDS.minZ + COAST_BOUNDS.maxZ) / 2;
      const k = Math.max(w / p.width, h / p.height) * 1.1;
      p.ortho(-p.width / 2 * k, p.width / 2 * k, -p.height / 2 * k, p.height / 2 * k, 0, 10000);
      p.camera(cx, -3000, cz, cx, 0, cz, 0, 0, 1); // p5 ortho는 y가 뒤집혀서 up=+z 일 때 북쪽이 화면 위
    }

    p.draw = () => {
      p.clear(); // 하늘은 캔버스 뒤 CSS 그라데이션
      if (DEBUG.top) {
        setTopCamera();
      } else {
        p.perspective(CAMERA.FOV * Math.PI / 180, p.width / p.height, CAMERA.NEAR, CAMERA.FAR);
        p.camera(0, -1900, 1900, 0, 0, 0, 0, 1, 0);
        p.orbitControl();
      }
      p.ambientLight(...LIGHT.ambient);
      p.directionalLight(...LIGHT.sun, ...LIGHT.sunDir);

      p.model(sea);
      p.model(terrain.geometry);
      p.model(foam);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  };
}
