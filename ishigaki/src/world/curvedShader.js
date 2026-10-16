import { CAMERA, SEA, TERRAIN, COLORS } from './config';
import { TERRAIN_ENCODE } from './terrain';
import { hexToRgb01 } from './mesh';
import { DEBUG } from './debug';

// 동물의 숲식 "굴러가는 지평선".
// 지구본처럼 섬을 구에 올리지 않고, 카메라 앞쪽으로 멀어질수록 정점을 아래로 내린다.
// p5 2.x baseMaterialShader().modify() 훅을 쓰므로 조명·정점색·텍스처는 기본 셰이더 그대로 동작한다.
// 섬·바다·소품·캐릭터 모두 같은 곡률 공식을 써야 물체가 땅에서 떠 보이지 않는다.

// p5 좌표는 y+ 가 아래 → 아래로 휘게 하려면 y를 더한다
const CURVE_GLSL = `
  vec2 delta = inputs.position.xz - uCamPos;
  float ahead = max(dot(delta, uCamFwd) - uCurveStart, 0.0);
  float side = dot(delta, vec2(-uCamFwd.y, uCamFwd.x));
  inputs.position.y += (ahead * ahead + side * side * uCurveSide) * uCurve;
`;

const f = (v) => Number(v).toFixed(4);
const v3 = (hex) => `vec3(${hexToRgb01(hex).map(f).join(', ')})`;
const E = TERRAIN_ENCODE, T = TERRAIN;
const TERRAIN_COLOR_GLSL = `
  float sd = inputs.color.r * ${f(E.SD_RANGE)} + ${f(E.SD_MIN)};
  float m = inputs.color.g * ${f(E.M_RANGE)};
  float flatness = inputs.color.b;
  vec3 c;
  if (sd < 1.5) c = ${v3(COLORS.sandWet)};
  else if (m < 1.0 && (abs(sd - ${f(T.BEACH_WIDTH)}) < ${f(T.TIER1_RAMP * 0.4)} || abs(sd - ${f(T.TIER2_AT)}) < ${f(T.TIER2_RAMP * 0.4)})) c = ${v3(COLORS.cliff)}; // 층 사이 절벽
  else if (flatness < ${f(T.CLIFF_SLOPE)} && m < 1.0 && sd > ${f(T.BEACH_WIDTH * 0.5)}) c = ${v3(COLORS.cliff)};
  else if (sd < ${f(T.BEACH_WIDTH - 2)}) c = ${v3(COLORS.sand)};
  else if (abs(sd - ${f(T.ROAD_INSET)}) < ${f(T.ROAD_WIDTH / 2)} && m < 2.0) c = ${v3(COLORS.road)};
  else if (m > ${f(T.MOUNTAIN_STEP * 4.5)}) c = ${v3(COLORS.mountainTop)};
  else if (m > ${f(T.MOUNTAIN_STEP * 1.5)}) c = ${v3(COLORS.mountain)};
  else if (sd < ${f(T.TIER2_AT)}) c = ${v3(COLORS.grass1)};
  else c = ${v3(COLORS.grass2)};
`;

export function createCurvedShaders(p, camera) {
  const curve = () => (DEBUG.top ? 0 : CAMERA.CURVE);
  const uniforms = {
    'vec2 uCamPos': () => [camera.eyeX, camera.eyeZ],
    'vec2 uCamFwd': () => [camera.fwdX, camera.fwdZ],
    'float uCurve': curve,
    'float uCurveStart': () => CAMERA.CURVE_START,
    'float uCurveSide': () => CAMERA.CURVE_SIDE,
  };

  const material = p.baseMaterialShader().modify({
    uniforms,
    'Vertex getWorldInputs': `(Vertex inputs) {
      ${CURVE_GLSL}
      return inputs;
    }`,
  });

  // 섬: 정점색에 담긴 (해안 거리, 산 높이, 평평함)으로 픽셀마다 색을 정한다
  const terrain = p.baseMaterialShader().modify({
    uniforms,
    'Vertex getWorldInputs': `(Vertex inputs) {
      ${CURVE_GLSL}
      return inputs;
    }`,
    'Inputs getPixelInputs': `(Inputs inputs) {
      ${TERRAIN_COLOR_GLSL}
      inputs.color = vec4(c, 1.0);
      inputs.ambientMaterial = c;
      return inputs;
    }`,
  });

  // 바다·파도 거품: 곡률 + sin 물결
  const water = p.baseMaterialShader().modify({
    uniforms: {
      ...uniforms,
      'float uTime': () => p.millis() / 1000,
      'float uWaveAmp': () => SEA.WAVE_AMP,
    },
    'Vertex getWorldInputs': `(Vertex inputs) {
      inputs.position.y += uWaveAmp * sin(uTime * 1.4 + inputs.position.x * 0.035 + inputs.position.z * 0.02);
      ${CURVE_GLSL}
      return inputs;
    }`,
  });

  // 디버그 선(콜라이더 등)도 같이 휘게
  const stroke = p.baseStrokeShader().modify({
    uniforms,
    'StrokeVertex getWorldInputs': `(StrokeVertex inputs) {
      ${CURVE_GLSL}
      return inputs;
    }`,
  });

  return { material, terrain, water, stroke };
}
