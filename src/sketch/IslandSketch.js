import { GRID, PLAYER, POI, PROPS, SHADOW } from '../world/config';
import { COAST, latLonToWorld, pullInside } from '../world/geo';
import { buildTerrain } from '../world/terrain';
import { buildSea, buildFoam } from '../world/sea';
import { createCurvedShaders, SUN_DIR } from '../world/curvedShader';
import { createFollowCamera } from '../world/camera';
import { createInput } from '../world/input';
import { createColliders } from '../world/colliders';
import { createPlayer } from '../world/player';
import { createResidents } from '../world/residents';
import { buildBuildings } from '../world/buildings';
import { createTileGrid } from '../world/grid';
import { buildGridOverlay } from '../world/gridOverlay';
import { createTreeRenderer } from '../world/trees';
import { createFlowerRenderer } from '../world/flowers';
import { buildAirplane, buildSignpost, buildVegetation } from '../world/props';
import { PLACES, nearestPlace, makeIconTexture, placeById } from '../world/poi';
import { live, worldStore } from '../world/store';
import { DEBUG } from '../world/debug';

// 4×4 행렬 곱 (열 우선, p5.Matrix.mat4 형식): a × b
function mul4(a, b) {
  const out = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = sum;
    }
  }
  return out;
}

// p5 instance-mode 스케치 조립. IslandCanvas가 한 번만 생성하고 언마운트 때 remove() + dispose() 한다.
export function createIslandWorld() {
  const camera = createFollowCamera();
  let showGrid = DEBUG.grid;
  const input = createInput({
    onRotate: (steps) => camera.rotate(steps),
    onToggleGrid: () => { showGrid = !showGrid; },
  });

  const sketch = (p) => {
    let terrain, sea, foam, shaders, player, residents, buildings, airplane, signpost, vegetation, grid, trees, flowers;
    let gridOverlay = null, gridOverlayVersion = -1;
    let shadowFb;
    const colliders = createColliders();
    const camTarget = { x: 0, h: 0, z: 0 };
    const signs = []; // { place, h, texture, bounce }

    const airportPos = () => {
      const { lat, lon } = PLAYER.START;
      const w = latLonToWorld(lat, lon);
      return pullInside(w.x, w.z, 70);
    };
    const startPos = () => {
      const xz = DEBUG.startAt?.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/); // ?at=x,z 월드 좌표
      if (xz) return { x: Number(xz[1]), z: Number(xz[2]) };
      const building = buildings?.list.find(b => b.id === DEBUG.startAt);
      if (building) return pullInside(building.x, building.z + building.size[1] * GRID.TILE / 2 + 40, 20); // 건물 입구 앞
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
      shaders = createCurvedShaders(p, camera, () => player?.state);
      grid = createTileGrid();
      shadowFb = p.createFramebuffer({
        width: SHADOW.MAP_SIZE, height: SHADOW.MAP_SIZE, density: 1,
        depthFormat: p.FLOAT, textureFiltering: p.NEAREST,
      });

      const airport = airportPos();
      airplane = { geometry: buildAirplane(p), x: airport.x - 30, z: airport.z + 34, yaw: 0.5 };
      airplane.h = terrain.groundHeight(airplane.x, airplane.z) + 7;
      colliders.add(airplane.x, airplane.z, 14, 'airplane');

      signpost = buildSignpost(p);
      const textures = {};
      for (const place of PLACES) {
        if (!grid.placeObject('sign', place.tx, place.tz)) console.warn(`표지판 타일 배치 실패: ${place.id} (${place.tx}, ${place.tz})`);
        textures[place.icon] ??= makeIconTexture(p, place.icon);
        signs.push({ place, h: terrain.groundHeight(place.x, place.z), texture: textures[place.icon], bounce: 0 });
        colliders.add(place.x, place.z, 2.5, 'sign');
      }

      // 건물은 나무·바위보다 먼저 자리를 잡는다 (data/buildings.json 주소 근처의 빈 잔디)
      buildings = buildBuildings(p, { grid, colliders, groundHeight: terrain.groundHeight });
      live.buildings = buildings.list;

      vegetation = buildVegetation({
        grid,
        colliders,
        avoid: [
          { x: airport.x, z: airport.z, r: PROPS.CLEAR_START },
          ...PLACES.map(pl => ({ x: pl.x, z: pl.z, r: PROPS.CLEAR_POI })),
          ...buildings.avoid,
        ],
      });

      trees = createTreeRenderer(p, { trees: vegetation.trees, groundHeight: terrain.groundHeight });
      flowers = createFlowerRenderer(p, { flowers: vegetation.flowers, groundHeight: terrain.groundHeight });

      const start = startPos(); // 건물이 놓인 뒤에 (?at=건물id 를 쓰려고)
      player = createPlayer({ start, groundHeight: terrain.groundHeight, colliders });
      // 주민들의 집: 공항(시작 지점) 근처에 먼저 몇 명, 나머지는 여행 장소마다
      residents = createResidents({
        homes: [PLACES[0], ...PLACES], // PLACES[0] = 공항 (시작 지점 근처에 둘)
        groundHeight: terrain.groundHeight,
        colliders,
      });
      live.residents = residents.list; // 주민 화면(/people) 지도가 읽는다 (같은 객체를 제자리에서 갱신)
      if (DEBUG.fps) console.info(`world built in ${Math.round(performance.now() - t0)}ms, terrain ${terrain.triangles} tris, ${vegetation.count} props`, vegetation.stats);

      camera.snapTo(start.x, player.state.h + PLAYER.CAMERA_LOOK_H, start.z);
      worldStore.set({ ready: true });
      if (DEBUG.fps) window.__islandLive = live; // 개발용: 콘솔에서 위치 확인
    };

    // 인사 중인 주민이 바뀔 때만 React에 알린다 (머리 위 말풍선 대신 화면 위쪽 말풍선)
    function updateNearResident() {
      const def = residents.nearest()?.def ?? null;
      if (def?.id === worldStore.get().nearResident?.id) return;
      worldStore.set({ nearResident: def && { id: def.id, name: def.name, greeting: def.greeting } });
    }

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

    // 그림자를 드리우는 것들: 비행기·나무·바위·꽃·캐릭터·표지판 (그림자 맵과 화면에 같은 코드로 그린다)
    // range: 플레이어 주변 이 거리 안의 주민만 (그림자 맵은 그림자 범위만)
    function drawCasters(time, dt, range) {
      p.shader(shaders.material);
      p.push();
      p.translate(airplane.x, -airplane.h, airplane.z);
      p.rotateY(airplane.yaw);
      p.model(airplane.geometry);
      p.pop();
      buildings.draw(p);
      p.shader(shaders.tree);
      trees.draw(shaders.tree);
      p.shader(shaders.flower);
      flowers.draw(shaders.flower);
      p.shader(shaders.material);
      player.draw(p, worldStore.get().character, time);
      residents.draw(p, time, player.state.x, player.state.z, range);
      drawSigns(dt, time);
    }

    // 그림자 맵: 해 쪽에서 캐릭터 주변 SHADOW.RANGE 타일을 정사영으로 내려다본 깊이 (Three.js shadowMap과 같은 방식)
    function renderShadowMap(s, time) {
      const half = (SHADOW.RANGE * GRID.TILE) / 2;
      const texel = (half * 2) / SHADOW.MAP_SIZE;
      // 중심을 텍셀 단위로 맞춰 걸을 때 그림자 가장자리가 떨리지 않게
      const cx = Math.round(s.x / texel) * texel, cz = Math.round(s.z / texel) * texel;
      const back = SHADOW.DEPTH / 2;
      const [dx, dy, dz] = SUN_DIR;
      shaders.state.shadowPass = true;
      shadowFb.begin();
      p.clear();
      p.ortho(-half, half, -half, half, 0, SHADOW.DEPTH);
      p.camera(cx - dx * back, -s.h - dy * back, cz - dz * back, cx, -s.h, cz, 0, 0, -1);
      const st = p._renderer.states;
      shaders.state.lightPV = mul4(st.uPMatrix.mat4, st.uViewMatrix.mat4);
      drawCasters(time, 0, half * 1.5);
      shadowFb.end();
      shaders.state.shadowPass = false;
      shaders.state.shadowMap = shadowFb.depth;
    }

    // G 키: 타일 그리드 + occupancy 색. 처음 켤 때(또는 occupancy가 바뀌었을 때) 한 번 만든다
    function drawGridOverlay() {
      if (gridOverlayVersion !== grid.version) {
        if (gridOverlay) p.freeGeometry(gridOverlay);
        gridOverlay = buildGridOverlay(p, grid, terrain.groundHeight);
        gridOverlayVersion = grid.version;
      }
      p.shader(shaders.material);
      p.model(gridOverlay);
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
      if (live.islandPaused) return; // 꾸미기 화면이 섬을 덮고 있는 동안은 그리지 않는다
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
      residents.update(dt, s);
      updateNearResident();

      camTarget.x = s.x;
      camTarget.h = s.h + PLAYER.CAMERA_LOOK_H;
      camTarget.z = s.z;
      camera.update(camTarget, dt);
      live.cameraYaw = camera.yaw;

      if (!DEBUG.top) renderShadowMap(s, time);

      p.clear(); // 하늘은 캔버스 뒤 CSS 그라데이션
      if (DEBUG.top) camera.applyTop(p);
      else camera.apply(p);

      // 방향광은 흰색으로 켜고 실제 색·세기는 셰이더(LIGHT.sunColor·sunIntensity)에서 곱한다. 환경광도 셰이더의 반구광
      p.directionalLight(255, 255, 255, ...SUN_DIR);

      p.shader(shaders.water);
      p.model(sea);

      p.shader(shaders.terrain);
      p.model(terrain.geometry);

      drawCasters(time, dt);
      if (showGrid) drawGridOverlay();
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
