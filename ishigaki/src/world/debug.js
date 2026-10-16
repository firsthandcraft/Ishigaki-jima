// 개발용 디버그 토글 (쿼리스트링)
//   ?debug=top      위에서 내려다보는 직교 카메라
//   ?debug=collide  해안선 polygon, 콜라이더, POI 반경 표시
//   ?fps=1          FPS 표시
const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const debugModes = (params.get('debug') || '').split(',');

export const DEBUG = {
  top: debugModes.includes('top'),
  collide: debugModes.includes('collide'),
  fps: params.get('fps') === '1',
};
