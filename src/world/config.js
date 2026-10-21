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
  sand: '#E3BD86',
  sandWet: '#CFA36E',
  grass1: '#8BD16B',       // 미니맵 잔디
  upperGrassShade: 0.95,   // 언덕 2층 잔디를 아주 살짝 어둡게 (층 구분)
  mountain: '#5E9E46',
  mountainTop: '#548F3F',
  cliff: '#C08A5A',
  road: '#C98B58',         // 레퍼런스의 주황빛 흙길
  shallow: '#45C6CC',
  deep: '#2188B8',
  foam: [255, 255, 255, 150],
  skyTop: '#7CC8F2',
  skyBottom: '#D9F2FB',
  fog: '#CFEBF8',          // 안개 = 하늘 아래쪽 색 (지평선이 하늘에 녹아들게)
};

// 잔디 텍스처 (grassTexture.js). 섬 잔디·산 모두 이 텍스처에 지역 색을 곱해 쓴다
export const GRASS = {
  SIZE: 512,               // 텍스처 크기 (px)
  REPEAT_TILES: 2,         // 타일 2칸당 텍스처 1번 반복
  SEED: 77,
  base: '#5DAE3F',         // 바탕색
  COUNT: 170,              // 삼각형 수
  TRI_MIN: 24,             // 삼각형 크기 (px). 요청값 8~14px는 타일의 1/20 크기라 레퍼런스(타일의 약 1/6)보다 너무 작아서 키움
  TRI_MAX: 38,
  tris: ['#4E9A35', '#6CBF4A', '#7FCB58'],
  light: '#A8D96A',        // 아주 드물게 섞는 연두
  LIGHT_CHANCE: 0.04,
  ALPHA: 0.6,
};

// 거리 안개 (카메라에서의 거리, 월드 단위)
export const FOG = {
  NEAR: 320,               // 여기부터 흐려지기 시작
  FAR: 1200,               // 여기서 최대
  MAX: 0.6,                // 최대 안개 농도 (1이면 완전히 하늘색)
};

// 조명은 Three.js MeshStandardMaterial + 물리 조명과 같은 계산을 셰이더에서 한다 (선형 공간 → ACES → sRGB)
export const LIGHT = {
  ambient: [168, 160, 150],        // 캐릭터 선택 화면 미리보기용 (월드 셰이더 밖)
  sun: [232, 212, 180],            //   〃
  sunPos: [-8, 15, 6],             // 해 위치 (x 동+, y 위+, z 남+=카메라 쪽): 왼쪽 위 앞 → 그림자는 오른쪽 뒤로
  sunColor: '#FFF4E0',             // 따뜻한 흰색
  sunIntensity: 2.2,
  hemiSky: '#BDE3FF',              // HemisphereLight 하늘
  hemiGround: '#5A8F3C',           //                 땅
  hemiIntensity: 1.5,              // 요청값 0.7 → 그림자가 레퍼런스보다 너무 어두워서 올림
  exposure: 1.2,                   // ACES Filmic 톤매핑 노출 (요청값 1.1 → 잔디가 레퍼런스보다 8% 어두워서 올림)
};

// 실시간 그림자 (PCF 소프트 그림자). 캐릭터를 따라다니는 정사영 그림자 카메라
export const SHADOW = {
  MAP_SIZE: 2048,
  RANGE: 20,               // 그림자 카메라 범위 (타일, 캐릭터 중심 한 변)
  DEPTH: 900,              // 그림자 카메라 앞뒤 깊이 (월드 단위)
  BIAS: 0.0008,            // 깊이 비교 여유 (그림자 여드름 방지)
  NORMAL_OFFSET: 0.9,      // 받는 면을 노멀 방향으로 이만큼 띄워서 비교 (월드 단위)
  PCF: 2,                  // (2·PCF+1)² 샘플로 가장자리를 부드럽게
};

// 동물의 숲식 둥근 지평선 + 3인칭 카메라
export const CAMERA = {
  CURVE: 0.0015,           // 지평선 휘는 정도: (카메라 앞 거리 - CURVE_START)² × CURVE 만큼 아래로
  CURVE_START: 210,        // 카메라 앞 이 거리(월드 단위)부터 휨 → 발밑은 평평, 먼 지평선만 말려 내려감
  CURVE_SIDE: 0.3,         // 좌우로 휘는 비율 (0이면 통나무, 1이면 공)
  CAM_BACK: 12,            // 캐릭터 기준 뒤로 (타일) — 뒤 12 · 위 7 → 약 30도로 낮게 봐서 얼굴이 정면에 가깝게 보임
  CAM_UP: 7,               // 캐릭터 기준 위로 (타일)
  LOOK_AHEAD: 0.9,         // 캐릭터보다 이만큼(타일) 앞을 바라봄 → 캐릭터가 화면 중앙보다 살짝 아래
  FOV: 30,                 // 세로 화각(도). 화면 가로에 타일 약 12칸
  FOLLOW_LERP: 0.08,       // 추적 부드러움 (60fps 기준 프레임당 비율)
  ROTATE_STEP: 45,         // Q/E 회전 단위(도)
  NEAR: 2,
  FAR: 6000,
};

export const PLAYER = {
  START: { lat: 24.3967, lon: 124.2400 }, // 이시가키 공항 근처 (동물의 숲 비행장처럼 여기서 시작)
  SCALE: 1.0,              // 캐릭터 크기 (1 = 약 22 단위 키)
  RADIUS: 4,               // 충돌 반경
  WALK_SPEED: 60,          // 단위/초. 남쪽 시내 → 북쪽 곶 약 40초
  RUN_MULT: 1.8,           // Shift 달리기 배율
  ACCEL: 9,                // 가속 (클수록 즉각 반응)
  DECEL: 7,                // 감속 (작을수록 미끄러지듯 멈춤)
  TURN_SPEED: 12,          // 몸 돌리는 속도
  STRIDE: 1,             // 이동 거리당 걸음 위상 증가량
  COAST_MARGIN: 6,         // 해안선에서 이 거리 안쪽까지만 걸을 수 있음
  CAMERA_LOOK_H: 9,        // 카메라가 바라보는 높이 (캐릭터 가슴쯤)
};

// 섬 주민 (character/residents.js) 이 돌아다니는 방식
export const RESIDENTS_AI = {
  ROAM_RADIUS: 110,        // 집 주변 이 거리 안에서만 산책
  SPAWN_RADIUS: 45,        // 처음 나타나는 위치: 집에서 이 거리 안
  WALK_SPEED: 20,          // 단위/초 (플레이어 60보다 느긋하게)
  STEP_MIN: 25,            // 한 번에 걸어가는 거리
  STEP_MAX: 80,
  IDLE_MIN: 2,             // 멈춰서 쉬는 시간(초)
  IDLE_MAX: 7,
  RADIUS: 4,               // 충돌 반경
  COAST_MARGIN: 10,        // 해안선에서 이만큼 안쪽까지만
  GREET_DIST: 24,          // 플레이어가 이만큼 가까우면 멈춰서 쳐다보고 인사
  DRAW_DIST: 460,          // 플레이어에서 이보다 멀면 그리지 않음
  FACE_TEX: 512,           // 주민 얼굴 텍스처 크기 (플레이어는 1024)
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

// 동물의 숲식 타일 그리드. 타일 좌표 (tx, tz)는 정수, 한 칸 = TILE × TILE 월드 단위.
// 섬 남북 약 150타일 (동물의 숲 섬 112×96 타일과 비슷한 비율)
export const GRID = {
  TILE: 16,                // 1타일 크기(월드 단위). 캐릭터 키 22 ≈ 1.4타일
  STEEP: 6,                // 타일 안 높이차가 이보다 크면 절벽 타일 (층 경계·산 계단)
  OVERLAY_LIFT: 0.8,       // 디버그 오버레이를 땅에서 띄우는 높이
  OVERLAY_GAP: 0.08,       // 오버레이 타일 사이 틈 (타일 비율) → 그리드 선으로 보임
  colors: {                // G 키 디버그 오버레이 [r, g, b, a]
    empty: [255, 255, 255, 70],
    tree: [20, 110, 40, 190],
    flower: [255, 120, 190, 190],
    house: [190, 80, 50, 200],
    path: [235, 185, 90, 190],
    sand: [255, 235, 140, 150],
    water: [50, 120, 255, 140],
    cliff: [140, 90, 50, 190],
    sign: [255, 120, 0, 220],
    rock: [110, 110, 110, 200],
    reserved: [255, 50, 50, 170],
  },
};

// 소품 배치 (시드 고정이라 새로고침해도 같은 자리). 모두 타일 중앙에 놓인다.
export const PROPS = {
  SEED: 2408,
  TREE_RATIO: 0.1,         // 잔디 타일 중 나무(야자수 포함) 비율 (8~12%)
  PALM_BAND: 110,          // 해안에서 이 거리 안쪽 잔디는 야자수 구역
  PALM_WEIGHT: 0.08,       // 야자수 구역 가중치 (작을수록 드문드문)
  FOREST_SCALE: 7,         // 숲 군집 크기(타일). 클수록 큰 숲 덩어리
  FOREST_EDGE: 0.55,       // 군집 노이즈가 이 값을 넘는 곳부터 숲
  TREE_SPARSE: 0.02,       // 숲 밖 평지 가중치 (외딴 나무)
  MOUNTAIN_BONUS: 0.35,    // 산 위 가중치 추가
  FLOWER_RATIO: 0.12,      // 잔디 타일 중 꽃 비율 (꽃 1송이 = 1타일)
  ROCK_RATIO: 0.01,
  CLEAR_POI: 34,           // 장소 표지판 주변 비우기
  CLEAR_START: 70,         // 시작 지점(공항) 주변 비우기
  colors: {
    rock: ['#A9A39A', '#B8B2A7', '#9A948A'],
  },
};

// 나무 모양·바람 (모양 치수는 trees.js, 단위 = 타일)
export const TREES = {
  SCALE_MIN: 0.9,          // 나무마다 크기 랜덤 범위
  SCALE_MAX: 1.1,
  FRUIT_CHANCE: 0.25,      // 활엽수 중 열매 달린 비율 (0이면 열매 없음)
  WIND_AMP: 0.45,          // 수관 흔들림 (월드 단위, 꼭대기 기준)
  WIND_SPEED: 0.9,         // 흔들림 속도 (rad/초)
  colors: {
    trunk: '#8B5A3C',
    leaf: '#45A436',
    leafLight: '#6CC447',
    leafShade: '#2E7A2A',
    fruit: '#E84B3C',
    palmTrunk: '#B98A5E',
    palmTrunkDark: '#A6784E',
    palmLeaf: '#3E9A34',
    palmLeafTip: '#5DB845',
    coconut: '#7A5230',
    rock: '#CFCCC4',
  },
};

// 꽃 (모양 치수는 flowers.js, 단위 = 타일). 참고: docs/flower/folwer.png
export const FLOWERS = {
  HEIGHT: 0.7,             // 튤립 높이 (타일) — 캐릭터(1.4) 허리~가슴
  PETAL_THICKNESS: 0.014,  // 꽃잎 두께 (타일)
  HEAD_SCALE: 1.4,         // 코스모스·팬지 꽃송이 배율 (줄기는 그대로)
  OTHER_SCALE: 1.6,        // 코스모스·팬지 전체 배율 (튤립과 키를 비슷하게)
  CLUSTER_SIZES: [[4, 3], [5, 3], [4, 4], [5, 4], [3, 4], [3, 5]], // 군락 = 이 크기 직사각형을 빈틈없이 (1타일 1송이)
  BUD_CHANCE: 0.3,         // 튤립 군락 안 봉오리 비율
  OTHER_CHANCE: 0.15,      // 튤립이 아닌 군락(코스모스·팬지) 비율
  JITTER: 0.1,             // 타일 중앙에서 ±이만큼(타일) 흔들어 배치
  GLOW: 0.3,               // 스스로 빛나는 정도 — 레퍼런스처럼 옆면까지 선명하게 (물리 조명만으론 탁해짐)
  NEAR_TREE: 3,            // 군락 시작 위치 가중치: 나무 바로 옆
  NEAR_PATH: 3,            //   길 가장자리
  NEAR_HOUSE: 6,           //   집 앞 (입구 예약 칸 옆)
  BASE_WEIGHT: 0.15,       //   그 밖의 잔디
  SCALE_MIN: 0.9,
  SCALE_MAX: 1.1,
  WIND_AMP: 0.12,
  WIND_SPEED: 1.6,
  PUSH: { radius: 13, bend: 2.2, wiggle: 0.9 }, // 캐릭터가 지나갈 때 휘는 반경·세기 (월드 단위)
  colors: {
    stem: '#3E9A3A',
    leaf: '#3B9A35',
    leafLight: '#5DBE45',
    budGreen: '#4FA83C',
    tulipHeart: '#3A2418',
    tulips: { red: '#F04A2A', yellow: '#F7C531', white: '#F5F0E8', pink: '#F07FA8', orange: '#F28A2E' },
    center: '#FFD21F',     // 코스모스 중앙·수술 끝
    stamen: '#F7B733',
    // 선명한 톤
    petals: { red: '#E8302A', white: '#F8F5EE', yellow: '#FFCC1A', pink: '#F2589A', purple: '#8A3FD1', orange: '#FF7F1A' },
    // 팬지형 안쪽 무늬 (참고 이미지처럼 중앙이 진하게)
    eyes: { red: '#8E0F1C', white: '#6B2C91', yellow: '#E0384F', pink: '#A8124A', purple: '#2E0E57', orange: '#B8261A' },
  },
};
