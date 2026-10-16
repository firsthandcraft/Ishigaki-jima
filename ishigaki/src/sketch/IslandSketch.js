import { LIGHT, PLAYER, POI, PROPS } from '../world/config';
import { COAST, latLonToWorld, pullInside } from '../world/geo';
import { buildTerrain } from '../world/terrain';
import { buildSea, buildFoam } from '../world/sea';
import { createCurvedShaders } from '../world/curvedShader';
import { createFollowCamera } from '../world/camera';
import { createInput } from '../world/input';
import { createColliders } from '../world/colliders';
import { createPlayer } from '../world/player';
import { buildAirplane, buildSignpost, buildVegetation } from '../world/props';
import { PLACES, nearestPlace, makeIconTexture, placeById } from '../world/poi';
import { live, worldStore } from '../world/store';
import { DEBUG } from '../world/debug';

// p5 instance-mode 스케치 조립. IslandCanvas가 한 번만 생성하고 언마운트 때 remove() + dispose() 한다.
export function createIslandWorld() {
  const camera = createFollowCamera();
  const input = createInput({ onRotate: (steps) => camera.rotate(steps) });

  const sketch = (p) => {
    let terrain, sea, foam, shaders, player, airplane, signpost, vegetation;
    const colliders = createColliders();
    const camTarget = { x: 0, h: 0, z: 0 };
    const signs = []; // { place, h, texture, bounce }

    const airportPos = () => {
      const { lat, lon } = PLAYER.START;
      const w = latLonToWorld(lat, lon);
      return pullInside(w.x, w.z, 70);
    };
    const startPos = () => {
      const at = DEBUG.startAt && placeById(DEBUG.startAt);
      return at ? pullInside(at.x, at.z + 40, 20) : airportPos();
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
      const airport = airportPos();
      airplane = { geometry: buildAirplane(p), x: airport.x - 30, z: airport.z + 34, yaw: 0.5 };
      airplane.h = terrain.groundHeight(airplane.x, airplane.z) + 7;
      colliders.add(airplane.x, airplane.z, 14, 'airplane');

      signpost = buildSignpost(p);
      const textures = {};
      for (const place of PLACES) {
        textures[place.icon] ??= makeIconTexture(p, place.icon);
        signs.push({ place, h: terrain.groundHeight(place.x, place.z), texture: textures[place.icon], bounce: 0 });
        colliders.add(place.x, place.z, 2.5, 'sign');
      }

      vegetation = buildVegetation(p, {
        groundHeight: terrain.groundHeight,
        colliders,
        avoid: [
          { x: airport.x, z: airport.z, r: PROPS.CLEAR_START },
          ...PLACES.map(pl => ({ x: pl.x, z: pl.z, r: PROPS.CLEAR_POI })),
        ],
      });

      player = createPlayer({ start, groundHeight: terrain.groundHeight, colliders });
      if (DEBUG.fps) console.info(`world built in ${Math.round(performance.now() - t0)}ms, terrain ${terrain.triangles} tris, ${vegetation.count} props`);

      camera.snapTo(start.x, player.state.h + PLAYER.CAMERA_LOOK_H, start.z);
      worldStore.set({ ready: true });
      if (DEBUG.fps) window.__islandLive = live; // 개발용: 콘솔에서 위치 확인
    };

    // 가까운 장소가 바뀔 때만 React에 알린다
    function updateNearPlace(s) {
      const near = nearestPlace(s.x, s.z);
      const nearId = near?.id ?? null;
      const state = worldStore.get();
      if (nearId === state.nearPlaceId) return;
      worldStore.set({
        nearPlaceId: nearId,
        visited: nearId && !state.visited.includes(nearId) ? [...state.visited, nearId] : state.visited,
      });
    }

    function drawSigns(dt, time) {
      const nearId = worldStore.get().nearPlaceId;
      for (const sign of signs) {
        const target = sign.place.id === nearId ? 1 : 0;
        sign.bounce += (target - sign.bounce) * Math.min(1, dt * 6);
        const hop = Math.abs(Math.sin(time * 5)) * POI.BOUNCE * sign.bounce;
        p.push();
        p.translate(sign.place.x, -(sign.h + hop), sign.place.z);
        p.rotateY(-camera.yaw); // 항상 카메라 쪽을 보는 표지판
        p.scale(1 + sign.bounce * 0.15);
        p.fill(255);
        p.model(signpost);
        p.translate(0, -POI.POLE_H - POI.BOARD_R * 0.7, 0.8);
        p.texture(sign.texture);
        p.plane(POI.BOARD_R * 2, POI.BOARD_R * 2);
        p.pop();
      }
    }

    // ?debug=collide: 해안선, 콜라이더, 장소 반경
    function drawDebugColliders() {
      p.push(); // noFill/stroke 상태가 다음 프레임 메시에 남지 않게
      p.strokeShader(shaders.stroke);
      p.noFill();
      p.strokeWeight(2);
      p.stroke(255, 60, 60);
      p.beginShape();
      for (const pt of COAST) p.vertex(pt.x, -2, pt.z);
      p.endShape(p.CLOSE);
      const ring = (x, z, r) => {
        p.push();
        p.translate(x, -(terrain.groundHeight(x, z) + 1), z);
        p.rotateX(Math.PI / 2);
        p.circle(0, 0, r * 2);
        p.pop();
      };
      p.stroke(255, 200, 0);
      for (const c of colliders.all) ring(c.x, c.z, c.r);
      p.stroke(80, 120, 255);
      for (const pl of PLACES) ring(pl.x, pl.z, POI.RADIUS);
      p.pop();
    }

    p.draw = () => {
      const dt = Math.min(p.deltaTime / 1000, 0.05);
      const time = p.millis() / 1000;

      player.update(input.read(), camera, dt);
      const s = player.state;
      live.player.x = s.x;
      live.player.z = s.z;
      live.player.yaw = s.yaw;
      live.fps = p.frameRate();
      if (DEBUG.fps) live.debug = { x: s.x, z: s.z, h: s.h, coast: s.sd, move: s.move };
      updateNearPlace(s);

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
      p.model(vegetation.geometry);

      player.draw(p, worldStore.get().character, time);
      drawSigns(dt, time);
      if (DEBUG.collide) drawDebugColliders();

      p.shader(shaders.water);
      p.model(foam);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  };

  return { sketch, dispose: () => input.dispose() };
}
