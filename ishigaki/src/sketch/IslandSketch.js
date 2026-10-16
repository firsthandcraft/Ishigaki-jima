import { LIGHT, PLAYER } from '../world/config';
import { latLonToWorld, pullInside } from '../world/geo';
import { buildTerrain } from '../world/terrain';
import { buildSea, buildFoam } from '../world/sea';
import { createCurvedShaders } from '../world/curvedShader';
import { createFollowCamera } from '../world/camera';
import { createInput } from '../world/input';
import { live, worldStore } from '../world/store';
import { DEBUG } from '../world/debug';

// p5 instance-mode 스케치 조립. IslandCanvas가 한 번만 생성하고 언마운트 때 remove() + dispose() 한다.
export function createIslandWorld() {
  const camera = createFollowCamera();
  const input = createInput({ onRotate: (steps) => camera.rotate(steps) });

  const sketch = (p) => {
    let terrain, sea, foam, shaders;
    const start = (() => {
      const { lat, lon } = PLAYER.START;
      const w = latLonToWorld(lat, lon);
      return pullInside(w.x, w.z, 70);
    })();
    const focus = { x: start.x, h: 0, z: start.z };

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      p.noStroke();
      const t0 = performance.now();
      terrain = buildTerrain(p);
      sea = buildSea(p);
      foam = buildFoam(p);
      shaders = createCurvedShaders(p, camera);
      if (DEBUG.fps) console.info(`world built in ${Math.round(performance.now() - t0)}ms, terrain ${terrain.triangles} tris`);

      focus.h = terrain.groundHeight(focus.x, focus.z);
      camera.snapTo(focus.x, focus.h, focus.z);
      worldStore.set({ ready: true });
    };

    p.draw = () => {
      const dt = Math.min(p.deltaTime / 1000, 0.05);

      camera.update(focus, dt);
      live.cameraYaw = camera.yaw;

      p.clear(); // 하늘은 캔버스 뒤 CSS 그라데이션
      if (DEBUG.top) camera.applyTop(p);
      else camera.apply(p);

      p.ambientLight(...LIGHT.ambient);
      p.directionalLight(...LIGHT.sun, ...LIGHT.sunDir);

      p.shader(shaders.water);
      p.model(sea);

      p.shader(shaders.terrain);
      p.model(terrain.geometry);

      p.shader(shaders.water);
      p.model(foam);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  };

  return { sketch, dispose: () => input.dispose() };
}
