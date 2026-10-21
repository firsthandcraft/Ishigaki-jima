import { PLAYER, RESIDENTS_AI as AI } from './config';
import { closestPointOnCoast, pointInPolygon } from './geo';
import { RESIDENTS, drawResident } from '../character/residents';

// 섬 주민들이 집 주변을 느긋하게 산책한다.
//   idle  : 잠깐 서서 두리번거림 → 시간이 되면 갈 곳(바다·나무·바위를 피한 곳)을 골라 walk
//   walk  : 목표까지 걸어감. 막히거나 너무 오래 걸리면 idle
//   greet : 플레이어가 가까이 오면 멈춰서 플레이어 쪽을 봄 (멀어지면 idle)
// homes: [{ x, z, name }] 주민마다 차례로 집을 나눠 준다 (앞쪽 집일수록 여러 명)

const coastHit = {};
const signedCoast = (x, z) => {
  closestPointOnCoast(x, z, coastHit);
  return pointInPolygon(x, z) ? coastHit.dist : -coastHit.dist;
};

const rand = (a, b) => a + Math.random() * (b - a);

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function createResidents({ homes, groundHeight, colliders }) {
  const walkable = (x, z) => signedCoast(x, z) >= AI.COAST_MARGIN && !colliders.overlaps(x, z, AI.RADIUS + 1);

  // 직선으로 걸어갈 수 있는지 (중간 지점 몇 개만 확인)
  const clearPath = (x0, z0, x1, z1) => {
    for (let k = 1; k <= 4; k++) {
      const t = k / 4;
      if (!walkable(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false;
    }
    return true;
  };

  const list = RESIDENTS.map((def, i) => {
    const home = homes[i % homes.length];
    let x = home.x, z = home.z;
    for (let tries = 0; tries < 30; tries++) {
      const a = rand(0, Math.PI * 2), d = rand(8, AI.SPAWN_RADIUS);
      if (walkable(home.x + Math.cos(a) * d, home.z + Math.sin(a) * d)) {
        x = home.x + Math.cos(a) * d;
        z = home.z + Math.sin(a) * d;
        break;
      }
    }
    return {
      def, home, x, z, h: groundHeight(x, z),
      yaw: rand(-Math.PI, Math.PI), lookYaw: 0,
      state: 'idle', timer: rand(0, AI.IDLE_MAX), tx: x, tz: z, walkTime: 0,
      speed: 0, phase: 0, move: 0,
      pace: rand(0.85, 1.15), // 주민마다 걷는 빠르기가 조금씩 다르게
    };
  });

  function pickTarget(r) {
    for (let tries = 0; tries < 12; tries++) {
      // 집에서 멀어졌으면 집 쪽으로 돌아오는 방향을 더 자주 고른다
      const awayX = r.x - r.home.x, awayZ = r.z - r.home.z;
      const away = Math.hypot(awayX, awayZ);
      let a = rand(0, Math.PI * 2);
      if (away > AI.ROAM_RADIUS * 0.6 && Math.random() < 0.7) a = Math.atan2(-awayZ, -awayX) + rand(-0.8, 0.8);
      const d = rand(AI.STEP_MIN, AI.STEP_MAX);
      const tx = r.x + Math.cos(a) * d, tz = r.z + Math.sin(a) * d;
      if (Math.hypot(tx - r.home.x, tz - r.home.z) > AI.ROAM_RADIUS) continue;
      if (!walkable(tx, tz) || !clearPath(r.x, r.z, tx, tz)) continue;
      r.tx = tx;
      r.tz = tz;
      return true;
    }
    return false;
  }

  function toIdle(r, min = AI.IDLE_MIN, max = AI.IDLE_MAX) {
    r.state = 'idle';
    r.timer = rand(min, max);
    r.lookYaw = r.yaw + rand(-1.2, 1.2); // 두리번거릴 방향
  }

  // 원형 콜라이더·다른 주민·플레이어에서 밀어내기
  function separate(r, player) {
    for (const c of colliders.near(r.x, r.z)) {
      const dx = r.x - c.x, dz = r.z - c.z, min = c.r + AI.RADIUS;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      r.x = c.x + (dx / d) * min;
      r.z = c.z + (dz / d) * min;
    }
    for (const o of list) if (o !== r) pushFrom(r, o.x, o.z);
    pushFrom(r, player.x, player.z);
  }
  function pushFrom(r, ox, oz) {
    const dx = r.x - ox, dz = r.z - oz, min = AI.RADIUS * 2;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min || d2 === 0) return;
    const d = Math.sqrt(d2), push = (min - d) * 0.5;
    r.x += (dx / d) * push;
    r.z += (dz / d) * push;
  }

  let nearest = null; // 인사 중인 주민 (가장 가까운 한 명)

  // player: { x, z } 플레이어 위치
  function update(dt, player) {
    nearest = null;
    let nearestD = Infinity;
    for (const r of list) {
      const pd = Math.hypot(player.x - r.x, player.z - r.z);
      if (pd < AI.GREET_DIST && pd < nearestD) {
        nearest = r;
        nearestD = pd;
      }

      if (pd < AI.GREET_DIST) {
        if (r.state !== 'greet') r.state = 'greet';
      } else if (r.state === 'greet') {
        toIdle(r, 1, 3);
      }

      let targetSpeed = 0;
      if (r.state === 'greet') {
        r.yaw = lerpAngle(r.yaw, Math.atan2(player.x - r.x, player.z - r.z), 1 - Math.exp(-6 * dt));
      } else if (r.state === 'idle') {
        r.yaw = lerpAngle(r.yaw, r.lookYaw, 1 - Math.exp(-1.5 * dt));
        r.timer -= dt;
        if (r.timer <= 0) {
          if (pickTarget(r)) {
            r.state = 'walk';
            r.walkTime = 0;
          } else {
            toIdle(r);
          }
        }
      } else if (r.state === 'walk') {
        const dx = r.tx - r.x, dz = r.tz - r.z, d = Math.hypot(dx, dz);
        r.walkTime += dt;
        if (d < 3 || r.walkTime > 15) {
          toIdle(r);
        } else {
          targetSpeed = AI.WALK_SPEED * r.pace * Math.min(1, d / 8); // 도착할 때 천천히
          r.yaw = lerpAngle(r.yaw, Math.atan2(dx, dz), 1 - Math.exp(-5 * dt));
        }
      }

      r.speed += (targetSpeed - r.speed) * (1 - Math.exp(-6 * dt));
      if (r.speed > 0.05) {
        const nx = r.x + Math.sin(r.yaw) * r.speed * dt;
        const nz = r.z + Math.cos(r.yaw) * r.speed * dt;
        if (signedCoast(nx, nz) >= AI.COAST_MARGIN) {
          r.x = nx;
          r.z = nz;
        } else {
          r.speed = 0;
          toIdle(r);
        }
      }
      separate(r, player);
      r.h = groundHeight(r.x, r.z);

      // 걷기 애니메이션: 플레이어보다 느리지만 다리는 또렷이 움직이게
      r.move = Math.min(1, r.speed / (AI.WALK_SPEED * 0.8));
      if (r.speed > 0.3) r.phase += r.speed * dt * PLAYER.STRIDE * 1.6;
      else r.phase = 0;
    }
  }

  const anim = { phase: 0, move: 0, time: 0, shadow: false, faceSize: AI.FACE_TEX };

  // (cx, cz)에서 range 안의 주민만 그린다 (그림자 맵은 좁은 범위만)
  function draw(p, time, cx, cz, range = AI.DRAW_DIST) {
    for (const r of list) {
      if ((r.x - cx) ** 2 + (r.z - cz) ** 2 > range * range) continue;
      anim.phase = r.phase;
      anim.move = r.move;
      anim.time = time + r.pace * 10; // 숨쉬기 박자를 주민마다 다르게
      p.push();
      p.translate(r.x, -r.h, r.z);
      p.rotateY(r.yaw);
      drawResident(p, r.def, anim);
      p.pop();
    }
  }

  return { list, update, draw, nearest: () => nearest };
}
