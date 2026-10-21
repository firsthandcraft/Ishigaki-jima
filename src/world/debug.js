// 개발용 디버그 토글 (쿼리스트링)
//   ?debug=top      위에서 내려다보는 직교 카메라
//   ?debug=collide  해안선 polygon, 콜라이더, POI 반경 표시
//   ?debug=grid     타일 그리드 오버레이를 켠 채로 시작 (G 키로 토글)
//   ?fps=1          FPS 표시
//   ?cam=60         카메라 거리 덮어쓰기 (캐릭터 가까이 보기)
//   ?move=0,1,run   입력을 계속 누른 것처럼 (x: 오른쪽+, y: 위+) — 키보드 없이 이동 확인용
//   ?char=wavy      이 캐릭터로 시작 (character/presets.js 의 id, 꾸며서 저장한 캐릭터보다 우선)
//   ?resident=kappi 꾸미기 화면 미리보기에 이 주민을 그림 (character/residents.js 의 id) — 주민 모델 확인용
//   ?yaw=45         꾸미기 화면 미리보기를 이 각도(도)로 고정 (0 정면, 45, 90 측면) — 모델 확인용
//   ?at=kabira      places.json의 장소 근처에서 시작 (?at=x,z 면 그 월드 좌표에서)
const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const debugModes = (params.get('debug') || '').split(',');

export const DEBUG = {
  top: debugModes.includes('top'),
  collide: debugModes.includes('collide'),
  grid: debugModes.includes('grid'),
  fps: params.get('fps') === '1',
  camDist: Number(params.get('cam')) || 0,
  startAt: params.get('at'),
  character: params.get('char'),
  resident: params.get('resident'),
  previewYaw: params.has('yaw') ? Number(params.get('yaw')) * Math.PI / 180 : null,
  autoMove: (() => {
    const m = params.get('move');
    if (!m) return null;
    const [x, y, run] = m.split(',');
    return { x: Number(x) || 0, y: Number(y) || 0, run: run === 'run' };
  })(),
};
