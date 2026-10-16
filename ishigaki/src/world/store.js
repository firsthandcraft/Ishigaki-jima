import { useSyncExternalStore } from 'react';

// 스케치 ↔ React 공유 상태.
// - worldStore: React가 구독하는 상태 (값이 바뀔 때만 set → 리렌더)
// - live: 매 프레임 바뀌는 값 (리렌더 없이 서로 읽기만). 스케치는 draw()에서, 미니맵·조이스틱은 직접 읽고 쓴다.

function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set(partial) {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next };
      listeners.forEach(l => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const worldStore = createStore({
  ready: false,          // 월드 메시 빌드 완료
  nearPlaceId: null,     // 플레이어가 반경 안에 들어간 장소
  visited: [],           // 한 번이라도 들른 장소 id
  fps: 0,
});

export const live = {
  player: { x: 0, z: 0, yaw: 0 },
  cameraYaw: 0,
  joystick: { x: 0, y: 0 },   // 가상 조이스틱 (-1~1, y+ = 화면 위)
};

export function useWorldStore(selector) {
  return useSyncExternalStore(worldStore.subscribe, () => selector(worldStore.get()));
}
