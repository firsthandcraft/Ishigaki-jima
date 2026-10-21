import { live } from './store';
import { DEBUG } from './debug';

// 키보드(WASD/방향키, Shift 달리기, Q/E 카메라 회전, G 타일 그리드 디버그) + 가상 조이스틱 입력.
// 폼에 글자를 입력하는 중에는 캐릭터가 움직이지 않게 input/textarea 이벤트는 무시한다.
const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

function isTyping(e) {
  const t = e.target;
  return t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
}

export function createInput({ onRotate, onToggleGrid }) {
  const held = { up: false, down: false, left: false, right: false, run: false };

  const onKeyDown = (e) => {
    if (isTyping(e) || live.islandPaused) return;
    if (MOVE_KEYS[e.code]) {
      held[MOVE_KEYS[e.code]] = true;
      if (e.code.startsWith('Arrow')) e.preventDefault(); // 방향키로 페이지 스크롤 막기
    }
    if (e.key === 'Shift') held.run = true;
    if (!e.repeat && e.code === 'KeyQ') onRotate(-1);
    if (!e.repeat && e.code === 'KeyE') onRotate(1);
    if (!e.repeat && e.code === 'KeyG') onToggleGrid?.();
  };
  const onKeyUp = (e) => {
    if (MOVE_KEYS[e.code]) held[MOVE_KEYS[e.code]] = false;
    if (e.key === 'Shift') held.run = false;
  };
  const releaseAll = () => Object.keys(held).forEach(k => { held[k] = false; });

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', releaseAll);

  // 화면 기준 입력 벡터 (x: 오른쪽+, y: 위(앞)+), 대각선 정규화
  const out = { x: 0, y: 0, run: false };
  function read() {
    if (live.islandPaused) releaseAll();
    let x = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    let y = (held.up ? 1 : 0) - (held.down ? 1 : 0);
    let run = held.run;
    if (x === 0 && y === 0) {
      x = live.joystick.x;
      y = live.joystick.y;
    }
    if (DEBUG.autoMove) ({ x, y, run } = DEBUG.autoMove);
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    out.x = x; out.y = y; out.run = run;
    return out;
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', releaseAll);
  }

  return { read, dispose };
}
