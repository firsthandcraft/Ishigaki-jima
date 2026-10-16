import { LIGHT, PLAYER } from '../world/config';
import { latLonToWorld, pullInside } from '../world/geo';
import { buildTerrain } from '../world/terrain';
import { buildSea, buildFoam } from '../world/sea';
import { createCurvedShaders } from '../world/curvedShader';
import { createFollowCamera } from '../world/camera';
import { createInput } from '../world/input';
import { createColliders } from '../world/colliders';
import { createPlayer } from '../world/player';
import { buildAirplane } from '../world/props';
import { live, worldStore } from '../world/store';
import { DEBUG } from '../world/debug';

// p5 instance-mode 스케치 조립. IslandCanvas가 한 번만 생성하고 언마운트 때 remove() + dispose() 한다.
export function createIslandWorld() {
  const camera = createFollowCamera();
  const input = createInput({ onRotate: (steps) => camera.rotate(steps) });

  const sketch = (p) => {
    let terrain, sea, foam, shaders, player, airplane;
    const colliders = createColliders();
    const camTarget = { x: 0, h: 0, z: 0 };

    const startPos = () => {
      const { lat, lon } = PLAYER.START;
      const w = latLonToWorld(lat, lon);
      return pullInside(w.x, w.z, 70);
    };

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      p.noStroke();
      const t0 = performance.now();
      terrain = buildTerrain(p);
      sea = buildSea(p);
      foam = buildFoam(p);
      shaders = createCurvedShaders(p, camera);

      const start = startPos();
      airplane = { geometry: buildAirplane(p), x: start.x + 34, z: start.z - 26, yaw: -0.6 };
      airplane.h = terrain.groundHeight(airplane.x, airplane.z) + 7;
      colliders.add(airplane.x, airplane.z, 14, 'airplane');

      player = createPlayer({ start, groundHeight: terrain.groundHeight, colliders });
      if (DEBUG.fps) console.info(`world built in ${Math.round(performance.now() - t0)}ms, terrain ${terrain.triangles} tris`);

      camera.snapTo(start.x, player.state.h + PLAYER.CAMERA_LOOK_H, start.z);
      worldStore.set({ ready: true });
      if (DEBUG.fps) window.__islandLive = live; // 개발용: 콘솔에서 위치 확인
    };

    p.draw = () => {
      const dt = Math.min(p.deltaTime / 1000, 0.05);
      const time = p.millis() / 1000;

      player.update(input.read(), camera, dt);
      const s = player.state;
      live.player.x = s.x;
      live.player.z = s.z;
      live.player.yaw = s.yaw;
      if (DEBUG.fps) live.debug = { x: s.x, z: s.z, h: s.h, coast: s.sd, move: s.move };

      camTarget.x = s.x;
      camTarget.h = s.h + PLAYER.CAMERA_LOOK_H;
      camTarget.z = s.z;
      camera.update(camTarget, dt);
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

      p.shader(shaders.material);
      p.push();
      p.translate(airplane.x, -airplane.h, airplane.z);
      p.rotateY(airplane.yaw);
      p.model(airplane.geometry);
      p.pop();

      player.draw(p, worldStore.get().character, time);

      p.shader(shaders.water);
      p.model(foam);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  };

  return { sketch, dispose: () => input.dispose() };
}
