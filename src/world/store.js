import { useSyncExternalStore } from 'react';
import { CHARACTER_PRESETS, presetById } from '../character/presets';
import { defaultCharacter } from '../character/characterConfig';
import { DEBUG } from './debug';

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

// 꾸민 캐릭터는 이 브라우저에만 기억한다. 저장된 값에 없는 파츠는 기본값으로 채운다
const STORAGE_KEY = 'ishigaki.character';
function loadCharacter() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') {
      const merged = { ...defaultCharacter };
      for (const [k, v] of Object.entries(defaultCharacter)) {
        if (typeof v === 'object') merged[k] = { ...v, ...saved[k] };
        else if (typeof saved[k] === typeof v) merged[k] = saved[k];
      }
      return merged;
    }
  } catch { /* 저장소를 못 쓰거나 값이 깨졌으면 기본 캐릭터 */ }
  return CHARACTER_PRESETS[0].config;
}

export const worldStore = createStore({
  ready: false,          // 월드 메시 빌드 완료
  nearPlaceId: null,     // 플레이어가 반경 안에 들어간 장소
  visited: [],           // 한 번이라도 들른 장소 id
  nearResident: null,    // 가까이서 인사 중인 주민 { id, name, greeting }
  character: presetById(DEBUG.character)?.config ?? loadCharacter(), // 캐릭터 외형. 이 값만 바꾸면 다음 프레임부터 반영된다
});

export const live = {
  player: { x: 0, z: 0, yaw: 0 },
  cameraYaw: 0,
  joystick: { x: 0, y: 0 },   // 가상 조이스틱 (-1~1, y+ = 화면 위)
  fps: 0,
  buildings: [],              // 섬 건물 { id, name, x, z, size } (world/buildings.js) — 미니맵이 읽는다
  residents: [],              // 섬 주민 상태 { def, x, z, home: { name } ... } (world/residents.js)
  islandPaused: false,        // 꾸미기 화면처럼 섬을 덮는 화면이 떠 있으면 true → 섬 입력·렌더링을 쉰다
};

export function useWorldStore(selector) {
  return useSyncExternalStore(worldStore.subscribe, () => selector(worldStore.get()));
}

// 꾸미기 화면에서 "결정". 섬 위 캐릭터가 바로 바뀌고, 다음에 열어도 기억된다
export function saveCharacter(config) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* 저장 실패해도 이번 세션에선 유지된다 */ }
  worldStore.set({ character: config });
}
