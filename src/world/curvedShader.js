import { CAMERA, SEA, TERRAIN, COLORS, TREES, GRID, FLOWERS, LIGHT, FOG, SHADOW, GRASS } from './config';
import { makeGrassTexture } from './grassTexture';
import { INSTANCES_PER_DRAW } from './trees';
import { TERRAIN_ENCODE } from './terrain';
import { hexToRgb01 } from './mesh';
import { DEBUG } from './debug';

// 모든 월드 셰이더가 같이 쓰는 "공기": 동물의 숲식 굴러가는 지평선 + 조명 + 그림자 + 톤매핑 + 안개.
// p5 2.x baseMaterialShader().modify() 훅으로 기본 셰이더를 고쳐 쓴다. 조명은 Three.js와 같은 계산:
//   색(sRGB) → 선형 → 햇빛(DirectionalLight, 그림자 맵) + 반구광(HemisphereLight) → ACES Filmic → sRGB
// 섬·바다·소품·나무·꽃·캐릭터 모두 같은 곡률 공식을 써야 물체가 땅에서 떠 보이지 않는다.

// 통나무 굴리기: 카메라 앞쪽으로 멀어질수록 거리²에 비례해 아래로 내린다 (p5 좌표는 y+ 가 아래).
// 옆 방향은 uCurveSide 비율만큼만 휜다 (0 = 통나무, 1 = 공)
const CURVE_GLSL = `
  vec2 delta = inputs.position.xz - uCamPos;
  float ahead = max(dot(delta, uCamFwd) - uCurveStart, 0.0);
  float side = dot(delta, vec2(-uCamFwd.y, uCamFwd.x));
  inputs.position.y += (ahead * ahead + side * side * uCurveSide) * uCurve;
`;

const f = (v) => Number(v).toFixed(5);
const v3 = (hex) => `vec3(${hexToRgb01(hex).map(f).join(', ')})`;
const PI = Math.PI;
const linear = (hex) => `vec3(${hexToRgb01(hex).map(c => f(c ** 2.2)).join(', ')})`;

// 해 방향 (빛이 나아가는 방향, p5 좌표 y 아래 +). LIGHT.sunPos(y 위 +)에서 원점으로
const [sx, sy, sz] = LIGHT.sunPos;
const sl = Math.hypot(sx, sy, sz);
export const SUN_DIR = [-sx / sl, sy / sl, -sz / sl];

// 반구광 (Three.js HemisphereLight): 위를 보는 면은 하늘색, 아래를 보는 면은 땅색. 선형 공간, 램버트 /π
const HEMI_GLSL = `
  inputs.ambientLight = mix(${linear(LIGHT.hemiGround)}, ${linear(LIGHT.hemiSky)}, vHemi * 0.5 + 0.5) * ${f(LIGHT.hemiIntensity / PI)};
`;

// 그림자 맵 비교 (PCF): 1 = 빛을 받음, 0 = 그림자. 범위 가장자리에선 서서히 그림자를 없앤다
const SHADOW_GLSL = `
  float shadowFactor() {
    if (uShadowOn < 0.5) return 1.0;
    vec3 sc = vShadowCoord.xyz / vShadowCoord.w * 0.5 + 0.5;
    if (sc.x <= 0.0 || sc.x >= 1.0 || sc.y <= 0.0 || sc.y >= 1.0 || sc.z >= 1.0) return 1.0;
    float lit = 0.0;
    for (int i = -${SHADOW.PCF}; i <= ${SHADOW.PCF}; i++) {
      for (int j = -${SHADOW.PCF}; j <= ${SHADOW.PCF}; j++) {
        float d = TEXTURE(uShadowMap, sc.xy + vec2(float(i), float(j)) * ${f(1 / SHADOW.MAP_SIZE)}).r;
        lit += sc.z - ${f(SHADOW.BIAS)} > d ? 0.0 : 1.0;
      }
    }
    lit /= ${f((2 * SHADOW.PCF + 1) ** 2)};
    vec2 edge = smoothstep(0.0, 0.06, sc.xy) * smoothstep(0.0, 0.06, 1.0 - sc.xy);
    return mix(1.0, lit, edge.x * edge.y);
  }
`;

// MeshStandardMaterial(roughness 0.85, metalness 0)의 확산광만 (거친 표면이라 반사광은 생략)
// glow: 스스로 빛나는 정도 (동물의 숲 꽃처럼 옆면도 밝게. 0이면 없음)
const combineGLSL = (glow = 0) => `(ColorComponents components) {
  vec3 albedo = pow(components.baseColor, vec3(2.2));
  // p5 방향광은 흰색(1,1,1)으로 켜서 components.diffuse = N·L
  vec3 direct = components.diffuse * ${linear(LIGHT.sunColor)} * ${f(LIGHT.sunIntensity / PI)} * shadowFactor();
  return vec4(albedo * (direct + components.ambient + ${f(glow)}), components.opacity);
}`;

// ACES Filmic (Three.js ACESFilmicToneMapping) → sRGB → 거리 안개
const FINAL_GLSL = `(vec4 color) {
  vec3 c = color.rgb * ${f(LIGHT.exposure / 0.6)};
  c = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777) * c;
  c = (c * (c + 0.0245786) - 0.000090537) / (c * (0.983729 * c + 0.4329510) + 0.238081);
  c = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602) * c;
  c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
  float fog = smoothstep(${f(FOG.NEAR)}, ${f(FOG.FAR)}, vFog) * ${f(FOG.MAX)};
  color.rgb = mix(c, ${v3(COLORS.fog)}, fog);
  return color;
}`;

const E = TERRAIN_ENCODE, T = TERRAIN;
// 잔디는 삼각형 무늬 텍스처 (texCoord = 월드 좌표 / 타일 크기 → REPEAT_TILES 칸마다 한 번 반복).
// 산은 같은 텍스처에 산 색을 곱한다 (텍스처 바탕색 대비 비율)
const TERRAIN_COLOR_GLSL = `
  float sd = inputs.color.r * ${f(E.SD_RANGE)} + ${f(E.SD_MIN)};
  float m = inputs.color.g * ${f(E.M_RANGE)};
  float flatness = inputs.color.b;
  vec3 grass = TEXTURE(uGrassTex, fract(inputs.texCoord / ${f(GRASS.REPEAT_TILES)})).rgb;
  vec3 tint = grass / ${v3(GRASS.base)};
  vec3 c;
  if (sd < 1.5) c = ${v3(COLORS.sandWet)};
  else if (m < 1.0 && (abs(sd - ${f(T.BEACH_WIDTH)}) < ${f(T.TIER1_RAMP * 0.4)} || abs(sd - ${f(T.TIER2_AT)}) < ${f(T.TIER2_RAMP * 0.4)})) c = ${v3(COLORS.cliff)}; // 층 사이 절벽
  else if (flatness < ${f(T.CLIFF_SLOPE)} && m < 1.0 && sd > ${f(T.BEACH_WIDTH * 0.5)}) c = ${v3(COLORS.cliff)};
  else if (sd < ${f(T.BEACH_WIDTH - 2)}) c = ${v3(COLORS.sand)};
  else if (abs(sd - ${f(T.ROAD_INSET)}) < ${f(T.ROAD_WIDTH / 2)} && m < 2.0) c = ${v3(COLORS.road)};
  else if (m > ${f(T.MOUNTAIN_STEP * 4.5)}) c = ${v3(COLORS.mountainTop)} * tint;
  else if (m > ${f(T.MOUNTAIN_STEP * 1.5)}) c = ${v3(COLORS.mountain)} * tint;
  else if (sd < ${f(T.TIER2_AT)}) c = grass;
  else c = grass * ${f(COLORS.upperGrassShade)};
`;

// getPlayer: 꽃이 캐릭터를 피해 휘도록 플레이어 상태({ x, z, move })를 돌려주는 함수
export function createCurvedShaders(p, camera, getPlayer = () => null) {
  // shadowPass: 그림자 맵을 그리는 중이면 true (곡률·수직 보정을 끈다)
  // lightPV: 그림자 카메라 투영×뷰 행렬, shadowMap: 그림자 깊이 텍스처 (IslandSketch가 매 프레임 채운다)
  const state = { shadowPass: false, lightPV: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], shadowMap: null };
  const dummy = p.createGraphics(1, 1); // 그림자 맵을 그리는 동안 대신 묶어 둘 텍스처 (자기 자신을 읽지 않게)
  const uniforms = {
    'vec2 uCamPos': () => [camera.eyeX, camera.eyeZ],
    'vec2 uCamFwd': () => [camera.fwdX, camera.fwdZ],
    'float uCurve': () => (DEBUG.top || state.shadowPass ? 0 : CAMERA.CURVE),
    'mat4 uLightPV': () => state.lightPV,
    'sampler2D uShadowMap': () => (state.shadowPass || !state.shadowMap ? dummy : state.shadowMap),
    'float uShadowOn': () => (state.shadowPass || !state.shadowMap ? 0 : 1),
    'float uCurveStart': () => CAMERA.CURVE_START,
    'float uCurveSide': () => CAMERA.CURVE_SIDE,
  };

  // 공통 훅(곡률·반구광·안개)에 셰이더별 코드를 끼워 넣는다
  //   object: getObjectInputs 전체, beforeCurve: 월드 좌표에서 곡률 전에 할 일,
  //   pixel: getPixelInputs 안에서 할 일
  //   afterCurve: 곡률 뒤에 할 일, camera: getCameraInputs 안에서 할 일 (뷰 좌표)
  const make = ({ extraUniforms = {}, vertexDeclarations = '', object, beforeCurve = '', afterCurve = '', camera: cameraCode = '', pixel = '', glow = 0 }) => {
    const hooks = {
      uniforms: { ...uniforms, ...extraUniforms },
      vertexDeclarations: `${vertexDeclarations}\nOUT float vFog;\nOUT float vHemi;\nOUT vec4 vShadowCoord;`,
      fragmentDeclarations: `IN float vFog;\nIN float vHemi;\nIN vec4 vShadowCoord;\n${SHADOW_GLSL}`,
      'Vertex getWorldInputs': `(Vertex inputs) {
        ${beforeCurve}
        // 그림자 좌표는 휘기 전(실제) 월드 좌표로. 노멀 방향으로 살짝 띄워 그림자 여드름 방지
        vShadowCoord = uLightPV * vec4(inputs.position + normalize(inputs.normal) * ${f(SHADOW.NORMAL_OFFSET)}, 1.0);
        ${CURVE_GLSL}
        ${afterCurve}
        vHemi = -normalize(inputs.normal).y;
        return inputs;
      }`,
      'Vertex getCameraInputs': `(Vertex inputs) {
        ${cameraCode}
        vFog = length(inputs.position);
        return inputs;
      }`,
      'Inputs getPixelInputs': `(Inputs inputs) {
        ${HEMI_GLSL}
        ${pixel}
        return inputs;
      }`,
      'vec4 combineColors': combineGLSL(glow),
      'vec4 getFinalColor': FINAL_GLSL,
    };
    if (object) hooks['Vertex getObjectInputs'] = object;
    return p.baseMaterialShader().modify(hooks);
  };

  const material = make({});

  // 섬: 정점색에 담긴 (해안 거리, 산 높이, 평평함)으로 픽셀마다 색을 정한다
  const grassTex = makeGrassTexture(p);
  const terrain = make({
    extraUniforms: { 'sampler2D uGrassTex': () => grassTex },
    pixel: `
      ${TERRAIN_COLOR_GLSL}
      inputs.color = vec4(c, 1.0);
      inputs.ambientMaterial = c;
    `,
  });

  // 바다·파도 거품: 곡률 + sin 물결
  const water = make({
    extraUniforms: {
      'float uTime': () => p.millis() / 1000,
      'float uWaveAmp': () => SEA.WAVE_AMP,
    },
    beforeCurve: 'inputs.position.y += uWaveAmp * sin(uTime * 1.4 + inputs.position.x * 0.035 + inputs.position.z * 0.02);',
  });

  // 나무·바위·꽃: 인스턴싱 + 바람 + 수직 보정
  //   windFrom/windRange: 이 높이(월드 단위)부터 흔들리기 시작해 windRange 위에서 최대
  //   push: 캐릭터가 지나가면 밀려 휘는 효과 { radius, bend, wiggle } (없으면 끔)
  const plantShader = ({ windFrom, windRange, windAmp, windSpeed, push, glow }) => make({
    glow,
    extraUniforms: {
      'float uTime': () => p.millis() / 1000,
      'float uUpright': () => (state.shadowPass || DEBUG.top ? 0 : 1),
      'vec3 uPlayer': () => {
        const s = getPlayer();
        return s ? [s.x, s.z, Math.min(1, s.move)] : [0, 0, 0];
      },
    },
    vertexDeclarations: `uniform vec4 uInst[${INSTANCES_PER_DRAW * 2}];
      vec3 gBase;  // 이 인스턴스의 밑동 (월드 → 곡률 적용)
      float gH;    // 이 정점의 밑동 기준 높이 (p5 y, 위가 -)`,
    object: `(Vertex inputs) {
      vec4 a = uInst[gl_InstanceID * 2];
      vec4 b = uInst[gl_InstanceID * 2 + 1];
      vec3 pos = inputs.position * b.x;
      // p5 y는 아래가 + → 높이 = -pos.y
      float w = clamp((-pos.y - ${f(windFrom)}) / ${f(windRange)}, 0.0, 1.0);
      float t = uTime * ${f(windSpeed)} + b.y;
      pos.x += sin(t) * ${f(windAmp)} * w;
      pos.z += sin(t * 0.77 + 1.3) * ${f(windAmp * 0.6)} * w;
      float c = cos(a.w), s = sin(a.w);
      vec3 world = vec3(c * pos.x + s * pos.z, pos.y, -s * pos.x + c * pos.z);
      ${push ? `
      // 캐릭터 반대쪽으로 휘고, 걷는 중이면 살랑살랑 떨린다
      vec2 away = a.xz - uPlayer.xy;
      float dist = length(away);
      float near = 1.0 - smoothstep(${f(push.radius * 0.35)}, ${f(push.radius)}, dist);
      away = dist > 0.001 ? away / dist : vec2(0.0);
      float wig = sin(uTime * 13.0 + b.y * 5.0) * uPlayer.z * ${f(push.wiggle)};
      world.xz += (away * ${f(push.bend)} + vec2(wig, wig * 0.6)) * near * w * w;` : ''}
      gBase = a.xyz;
      gH = world.y;
      inputs.position = world + a.xyz;
      inputs.normal = vec3(c * inputs.normal.x + s * inputs.normal.z, inputs.normal.y, -s * inputs.normal.x + c * inputs.normal.z);
      return inputs;
    }`,
    // 밑동도 정점과 같은 곡률로 내린다
    afterCurve: `
      vec2 bd = gBase.xz - uCamPos;
      float ba = max(dot(bd, uCamFwd) - uCurveStart, 0.0);
      float bs = dot(bd, vec2(-uCamFwd.y, uCamFwd.x));
      gBase.y += (ba * ba + bs * bs * uCurveSide) * uCurve;
    `,
    // 수직 보정: 내려다보는 원근 때문에 화면 가장자리 물체가 바깥으로 기울어 보이는 것을 막는다.
    // 밑동에서 수직으로 올라간 축이 화면에서도 밑동과 같은 x에 오도록 정점을 옆으로 민다
    camera: `
      vec3 bv = (uViewMatrix * vec4(gBase, 1.0)).xyz;
      vec3 av = (uViewMatrix * vec4(gBase + vec3(0.0, gH, 0.0), 1.0)).xyz;
      float shift = bv.x / -bv.z - av.x / -av.z;
      inputs.position.x += shift * -inputs.position.z * uUpright;
    `,
  });
  const tree = plantShader({
    windFrom: GRID.TILE * 1.4, windRange: GRID.TILE * 2.4, // 줄기(1.3) 위 수관만 흔들림 → 바위는 안 움직임
    windAmp: TREES.WIND_AMP, windSpeed: TREES.WIND_SPEED,
  });
  const flower = plantShader({
    windFrom: 0, windRange: GRID.TILE * FLOWERS.HEIGHT,
    windAmp: FLOWERS.WIND_AMP, windSpeed: FLOWERS.WIND_SPEED,
    push: FLOWERS.PUSH,
    glow: FLOWERS.GLOW,
  });

  // 디버그 선(콜라이더 등)도 같이 휘게
  const stroke = p.baseStrokeShader().modify({
    uniforms,
    'StrokeVertex getWorldInputs': `(StrokeVertex inputs) {
      ${CURVE_GLSL}
      return inputs;
    }`,
  });

  return { material, terrain, water, stroke, tree, flower, state };
}
