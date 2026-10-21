import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { drawCharacter } from '../character/drawCharacter';
import { LIGHT } from '../world/config';
import { DEBUG } from '../world/debug';
import { drawResident, residentById } from '../character/residents';

const REST_YAW = 0.25;
const DEBUG_RESIDENT = residentById(DEBUG.resident); // ?resident=id 이면 플레이어 대신 이 주민을 그린다   // 가만히 두면 돌아오는 각도 (살짝 비스듬히)
const BOUNCE_TIME = 0.42; // 통통 튀는 반응 길이(초)

// 꾸미기 화면의 큰 캐릭터 미리보기. 게임과 같은 drawCharacter로 그린다.
// - 드래그하면 좌우로 돌고, 놓으면 관성으로 돌다가 천천히 정면 쪽으로 돌아온다
// - 가만히 있으면 숨 쉬는 idle (drawCharacter의 breath + 살짝 위아래)
// - bounceKey가 바뀔 때마다 한 번 통통 튄다
// config·bounceKey는 ref로 읽어서 바뀌어도 p5 인스턴스를 다시 만들지 않는다.
function CharacterPreview({ config, bounceKey }) {
  const containerRef = useRef(null);
  const props = useRef({ config });
  props.current.config = config;
  const bounceAt = useRef(-Infinity);
  const lastBounceKey = useRef(bounceKey);

  useEffect(() => {
    if (lastBounceKey.current === bounceKey) return;
    lastBounceKey.current = bounceKey;
    bounceAt.current = performance.now() / 1000;
  }, [bounceKey]);

  useEffect(() => {
    const el = containerRef.current;
    const view = { yaw: REST_YAW, spin: 0, dragging: false, lastX: 0, idle: 0 };

    const onDown = (e) => {
      view.dragging = true;
      view.lastX = e.clientX;
      view.spin = 0;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!view.dragging) return;
      const dx = e.clientX - view.lastX;
      view.lastX = e.clientX;
      view.yaw += dx * 0.012;
      view.spin = dx * 0.012 * 60; // 놓았을 때 이어서 도는 속도 (rad/s)
      view.idle = 0;
    };
    const onUp = () => { view.dragging = false; };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    let instance = null;
    let resizeObserver = null;
    // IslandCanvas와 같은 이유로 한 틱 미룬다 (StrictMode 마운트→정리→마운트)
    const timer = setTimeout(() => {
      instance = new p5((p) => {
        p.setup = () => {
          p.createCanvas(Math.max(1, el.clientWidth), Math.max(1, el.clientHeight), p.WEBGL);
          p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
          p.noStroke();
          resizeObserver = new ResizeObserver(() => {
            p.resizeCanvas(Math.max(1, el.clientWidth), Math.max(1, el.clientHeight));
          });
          resizeObserver.observe(el);
        };
        p.draw = () => {
          const dt = Math.min(p.deltaTime / 1000, 0.05);
          const time = p.millis() / 1000;

          if (!view.dragging) {
            view.yaw += view.spin * dt;
            view.spin *= Math.pow(0.04, dt);
            view.idle += dt;
            // 손을 뗀 지 2초가 지나면 원래 각도(가장 가까운 바퀴)로 천천히 돌아온다
            if (view.idle > 2) {
              const target = REST_YAW + Math.round((view.yaw - REST_YAW) / (Math.PI * 2)) * Math.PI * 2;
              view.yaw += (target - view.yaw) * Math.min(1, dt * 1.5);
            }
          }

          // 통통: 위로 튀었다가 내려앉으며 납작해졌다 돌아옴
          const t = (performance.now() / 1000 - bounceAt.current) / BOUNCE_TIME;
          let hop = 0, squash = 1;
          if (t >= 0 && t < 1) {
            hop = Math.sin(t * Math.PI) * 3.2 * (1 - t * 0.4);
            squash = 1 + Math.sin(t * Math.PI * 2) * 0.07 * (1 - t);
          }

          const aspect = p.width / p.height;
          p.clear();
          p.perspective(Math.PI / 7, aspect, 1, 800);
          // 화면이 좁으면 뒤로 물러나서 캐릭터 전체가 들어오게
          const dist = 64 / Math.min(1, aspect * 1.25);
          p.camera(0, -11.5, dist, 0, -10.2, 0, 0, 1, 0);
          p.ambientLight(...LIGHT.ambient);
          p.directionalLight(...LIGHT.sun, -0.3, 0.6, -0.75);
          p.translate(0, -hop + Math.sin(time * 2.6) * 0.12, 0);
          p.scale(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
          p.rotateY(DEBUG.previewYaw ?? view.yaw);
          const anim = { phase: 0, move: 0, time, shadow: hop < 0.5 };
          if (DEBUG_RESIDENT) drawResident(p, DEBUG_RESIDENT, anim);
          else drawCharacter(p, props.current.config, anim);
        };
      }, el);
    }, 0);

    return () => {
      clearTimeout(timer);
      resizeObserver?.disconnect();
      instance?.remove();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return <div ref={containerRef} className="characterPreview" aria-label="캐릭터 미리보기 (드래그해서 돌리기)" />;
}

export default CharacterPreview;
