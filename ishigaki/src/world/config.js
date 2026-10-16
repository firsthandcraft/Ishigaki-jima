// 월드 전체에서 쓰는 크기·속도·색상·카메라 값. 느낌 조절은 여기서만 한다.
// 좌표계: x = 동쪽 +, z = 남쪽 + (북쪽이 화면 안쪽 -z), 높이 h = 위쪽 + (p5에선 y = -h 로 그린다)

export const WORLD = {
  LAT0: 24.45,             // 위경도 → 월드 변환 기준점 (섬 중앙 근처)
  LON0: 124.21,
  ISLAND_LENGTH: 2400,     // 섬 남북 길이(월드 단위). 남쪽 시내 → 북쪽 히라쿠보 곶 걸어서 약 2~3분
};

export const TERRAIN = {
  GRID_STEP: 8,            // 높이맵 격자 간격 (작을수록 층 경계가 매끈, 대신 무거움)
  SEA_FLOOR: -10,          // 섬 격자 중 바다 쪽 정점 높이
  BEACH_WIDTH: 40,         // 모래 해변 폭 (이 안쪽부터 잔디 1층)
  BEACH_H0: 1.2,           // 해안선 높이
  BEACH_H1: 3.5,           // 해변 끝 높이
  TIER1_H: 12,             // 잔디 1층 높이 (해변 위로 더해짐)
  TIER1_RAMP: 9,           // 층 사이 경사 폭 (작을수록 절벽 느낌, 격자 간격보다 작으면 톱니가 생김)
  TIER2_AT: 170,           // 해안에서 이만큼 안쪽부터 언덕 2층
  TIER2_H: 14,
  TIER2_RAMP: 10,
  MOUNTAIN_STEP: 13,       // 산을 계단식으로 깎는 단 높이 (0이면 매끈한 산)
  CLIFF_SLOPE: 0.62,       // 이 값보다 노멀이 눕혀진(가파른) 면은 흙 절벽 색
  ROAD_INSET: 66,          // 섬 일주 도로: 해안선에서 이만큼 안쪽
  ROAD_WIDTH: 13,
  // 산: 가우시안 봉우리. 위치는 위경도, 반경·높이는 월드 단위
  MOUNTAINS: [
    { name: '오모토 산', lat: 24.4300, lon: 124.1830, height: 105, radius: 150 },
    { name: '반나 산', lat: 24.3700, lon: 124.1700, height: 34, radius: 95 },
    { name: '노소코 산', lat: 24.4980, lon: 124.2330, height: 48, radius: 70 },
  ],
};

export const SEA = {
  MARGIN: 1700,            // 섬 bounding box 바깥으로 바다를 깔 거리
  GRID_STEP: 32,
  SHALLOW_RANGE: 240,      // 해안에서 이 거리까지 얕은물 → 먼바다로 색이 바뀜
  WAVE_AMP: 1.0,           // 물결 높이 ±
  FOAM_WIDTH: 7,           // 해안 파도 거품 띠 폭
};

export const COLORS = {
  sand: '#F2E3B3',
  sandWet: '#E3CF95',
  grass1: '#7DBE5A',
  grass2: '#6AAE4C',
  mountain: '#5E9E46',
  mountainTop: '#548F3F',
  cliff: '#B59A6E',
  road: '#E6D3A1',
  shallow: '#7FD6D0',
  deep: '#3FA9C9',
  foam: [255, 255, 255, 150],
  skyTop: '#7CC8F2',
  skyBottom: '#D9F2FB',
};

export const LIGHT = {
  ambient: [168, 160, 150],        // 따뜻한 환경광
  sun: [255, 244, 225],
  sunDir: [-0.35, 0.85, -0.4],     // p5 좌표 (y+ 가 아래). 위에서 비추는 해
};

// 동물의 숲식 둥근 지평선 + 3인칭 카메라
export const CAMERA = {
  CURVE: 0.00042,          // 지평선 휘는 정도 (클수록 많이 말림)
  CURVE_START: 120,        // 카메라 앞 이 거리부터 휘기 시작
  CURVE_SIDE: 0.25,        // 좌우로 휘는 비율 (0이면 통나무, 1이면 공)
  CAM_PITCH: 36,           // 내려다보는 각도(도)
  CAM_DIST: 160,           // 캐릭터까지 거리
  FOV: 50,
  FOLLOW_LERP: 0.08,       // 추적 부드러움 (60fps 기준 프레임당 비율)
  ROTATE_STEP: 45,         // Q/E 회전 단위(도)
  NEAR: 2,
  FAR: 6000,
};

export const PLAYER = {
  START: { lat: 24.3967, lon: 124.2400 }, // 이시가키 공항 근처 (동물의 숲 비행장처럼 여기서 시작)
  SCALE: 1.0,              // 캐릭터 크기 (1 = 약 22 단위 키)
  RADIUS: 4,               // 충돌 반경
  WALK_SPEED: 20,          // 단위/초. 남쪽 시내 → 북쪽 곶 약 2분
  RUN_MULT: 1.8,           // Shift 달리기 배율
  ACCEL: 9,                // 가속 (클수록 즉각 반응)
  DECEL: 7,                // 감속 (작을수록 미끄러지듯 멈춤)
  TURN_SPEED: 12,          // 몸 돌리는 속도
  STRIDE: 0.42,            // 이동 거리당 걸음 위상 증가량
  COAST_MARGIN: 6,         // 해안선에서 이 거리 안쪽까지만 걸을 수 있음
  CAMERA_LOOK_H: 9,        // 카메라가 바라보는 높이 (캐릭터 가슴쯤)
};

export const DUST = {
  MAX: 48,
  INTERVAL: 0.09,          // 걸을 때 먼지 생성 간격(초), 달리면 더 자주
  LIFE: 0.55,
  SIZE: 1.6,
  grass: '#C7E59A',        // 잔디 위 연두
  sand: '#EADBB0',         // 모래 위 베이지
};

export const POI = {
  RADIUS: 60,              // 이 거리 안에 들어오면 카드·배너 표시
  PULL_INSET: 28,          // 섬 밖/해안에 찍힌 장소를 해안에서 이만큼 안쪽으로 끌어당김
  POLE_H: 14,              // 표지판 기둥 높이
  BOARD_R: 7,              // 둥근 표지판 반지름
  BOUNCE: 3,               // 가까이 가면 튀어오르는 높이
  ICONS: {                 // 표지판 그림 (lighthouse는 이모지가 없어 직접 그림)
    plane: '✈️', house: '🏠', cave: '🦇', mountain: '⛰️', beach: '🏖️',
    dive: '🤿', star: '⭐', view: '🔭', lighthouse: null,
  },
  RING: '#F2A65A',         // 표지판 테두리
  WOOD: '#A8774E',         // 기둥
};

// 소품 배치 (시드 고정이라 새로고침해도 같은 자리)
export const PROPS = {
  SEED: 2408,
  PALMS: 170,              // 해변 근처 야자수
  TREES: 340,              // 내륙 둥근 활엽수 (산에선 더 빽빽하게)
  FLOWERS: 130,            // 꽃 무리
  ROCKS: 60,
  CLEAR_POI: 34,           // 장소 표지판 주변 비우기
  CLEAR_ROAD: 12,          // 도로 양옆 비우기
  CLEAR_START: 70,         // 시작 지점(공항) 주변 비우기
  colors: {
    palmTrunk: '#B98A5E',
    palmLeaf: ['#4FA84A', '#5DBB55', '#46993F'],
    coconut: '#7A5230',
    trunk: '#9B6B43',
    leaf: ['#4E9F43', '#5FB04F', '#6CBC58', '#3F8F3A'],
    flower: ['#FF8FAB', '#FFD95A', '#FFFFFF', '#B98BFF', '#FF9F68'],
    rock: ['#A9A39A', '#B8B2A7', '#9A948A'],
  },
};
