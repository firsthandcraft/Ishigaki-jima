import { PLAYER, DUST, TERRAIN } from './config';
import { closestPointOnCoast, pointInPolygon } from './geo';
import { drawCharacter } from '../character/drawCharacter';

const P = PLAYER;
const coastHit = {};

// 해안선 기준 안쪽 법선
function inwardNormal(c) {
  let nx = -c.tz, nz = c.tx;
  if (!pointInPolygon(c.x + nx * 2, c.z + nz * 2)) { nx = -nx; nz = -nz; }
  return [nx, nz];
}

function signedCoast(x, z) {
  closestPointOnCoast(x, z, coastHit);
  return pointInPolygon(x, z) ? coastHit.dist : -coastHit.dist;
}

// 각도 a → b 최단 방향 보간
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function createPlayer({ start, groundHeight, colliders }) {
  const s = {
    x: start.x, z: start.z, h: groundHeight(start.x, start.z),
    vx: 0, vz: 0,
    yaw: 0,          // 0 = 남쪽(+z, 카메라 쪽)을 봄
    phase: 0,        // 걸음 위상
    move: 0,         // 0 정지 ~ 1 걷기 ~ RUN_MULT 달리기
    sd: 100,         // 현재 위치의 해안 거리
  };

  // 먼지 파티클 풀 (draw 중 new 없이 재사용)
  const dust = Array.from({ length: DUST.MAX }, () => ({ active: false, x: 0, h: 0, z: 0, age: 0, color: DUST.grass }));
  let dustTimer = 0;
  let dustNext = 0;

  function spawnDust() {
    const d = dust[dustNext];
    dustNext = (dustNext + 1) % dust.length;
    const back = 2 + Math.random() * 1.5;
    d.active = true;
    d.age = 0;
    d.x = s.x - Math.sin(s.yaw) * back + (Math.random() - 0.5) * 3;
    d.z = s.z - Math.cos(s.yaw) * back + (Math.random() - 0.5) * 3;
    d.h = s.h + 0.6;
    d.color = s.sd < TERRAIN.BEACH_WIDTH ? DUST.sand : DUST.grass;
  }

  // 다음 위치가 바다 쪽이면 이동 벡터를 해안선 접선으로 투영해 벽을 따라 미끄러지게
  function slideAlongCoast(dt) {
    let nx = s.x + s.vx * dt, nz = s.z + s.vz * dt;
    if (signedCoast(nx, nz) >= P.COAST_MARGIN) return [nx, nz];
    const along = s.vx * coastHit.tx + s.vz * coastHit.tz;
    s.vx = coastHit.tx * along;
    s.vz = coastHit.tz * along;
    nx = s.x + s.vx * dt;
    nz = s.z + s.vz * dt;
    if (signedCoast(nx, nz) < P.COAST_MARGIN) {
      const [inx, inz] = inwardNormal(coastHit);
      nx = coastHit.x + inx * P.COAST_MARGIN;
      nz = coastHit.z + inz * P.COAST_MARGIN;
    }
    return [nx, nz];
  }

  // 나무·바위 등 원형 콜라이더에서 밀어내기
  function pushOutOfColliders() {
    for (const c of colliders.near(s.x, s.z)) {
      const dx = s.x - c.x, dz = s.z - c.z;
      const min = c.r + P.RADIUS;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d, nz = dz / d;
      s.x = c.x + nx * min;
      s.z = c.z + nz * min;
      const into = s.vx * nx + s.vz * nz;
      if (into < 0) { s.vx -= nx * into; s.vz -= nz * into; }
    }
  }

  // inp: { x, y, run } 화면 기준 입력, cam: 카메라 (fwd/right 벡터)
  function update(inp, cam, dt) {
    const speed = P.WALK_SPEED * (inp.run ? P.RUN_MULT : 1);
    const tx = (cam.rightX * inp.x + cam.fwdX * inp.y) * speed;
    const tz = (cam.rightZ * inp.x + cam.fwdZ * inp.y) * speed;
    const hasInput = inp.x !== 0 || inp.y !== 0;
    const k = 1 - Math.exp(-(hasInput ? P.ACCEL : P.DECEL) * dt);
    s.vx += (tx - s.vx) * k;
    s.vz += (tz - s.vz) * k;

    [s.x, s.z] = slideAlongCoast(dt);
    pushOutOfColliders();
    s.sd = signedCoast(s.x, s.z);
    s.h = groundHeight(s.x, s.z);

    const v = Math.hypot(s.vx, s.vz);
    s.move = v / P.WALK_SPEED;
    if (v > 1) s.yaw = lerpAngle(s.yaw, Math.atan2(s.vx, s.vz), 1 - Math.exp(-P.TURN_SPEED * dt));
    if (v > 0.5) s.phase += v * dt * P.STRIDE;
    else s.phase = 0; // 멈추면 차렷 자세로

    dustTimer -= dt;
    if (s.move > 0.4 && dustTimer <= 0) {
      spawnDust();
      dustTimer = DUST.INTERVAL / Math.max(1, s.move);
    }
    for (const d of dust) {
      if (!d.active) continue;
      d.age += dt;
      d.h += dt * 4;
      if (d.age > DUST.LIFE) d.active = false;
    }
  }

  function draw(p, characterConfig, time) {
    for (const d of dust) {
      if (!d.active) continue;
      const r = DUST.SIZE * (1 - d.age / DUST.LIFE) + 0.2;
      p.push();
      p.translate(d.x, -d.h, d.z);
      p.fill(d.color);
      p.sphere(r, 5, 4);
      p.pop();
    }
    p.push();
    p.translate(s.x, -s.h, s.z);
    p.rotateY(s.yaw);
    p.scale(P.SCALE);
    drawCharacter(p, characterConfig, { phase: s.phase, move: s.move, time });
    p.pop();
  }

  return { state: s, update, draw };
}
