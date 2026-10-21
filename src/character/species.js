import { headPoint, onHeadSurface } from './parts/face';
import { cached, surface, tube } from './geometry';

// 동물 주민의 종 파츠. drawCharacter가 플레이어와 같은 몸·얼굴 텍스처 위에 얹는다.
//   head : 기준점 = 머리 중심 (R = ctx.headR). 귀·부리 말고 머리 모양을 바꾸는 것들 (갈기, 잎사귀 머리, 개구리 눈)
//   torso: 기준점 = 몸통 중심. 배 무늬·등껍질·꼬리
// opts = cfg.species ({ id, 색 ... }), 털색 = ctx.skinColor
const DEG = Math.PI / 180;

// 표면 (yaw, pitch)에 붙인 뒤 방향만 세상 기준으로 돌려 놓는다 (+z = 앞, -y = 위). 귀·눈처럼 정면을 봐야 하는 것들
function atHead(p, R, yaw, pitch, lift = 0) {
  onHeadSurface(p, R, yaw, pitch, lift);
  p.rotateX(-pitch * DEG);
  p.rotateY(-yaw * DEG);
}

// 머리 모양을 따라 부풀린 정수리 껍질 (R = 1)
const cap = (p, inflate, th1) => cached(p, `spCap|${inflate}|${th1}`, () => surface(p, 14, 40, (u, v) => {
  const th = u * th1 * DEG, ph = v * Math.PI * 2;
  return headPoint(Math.sin(th) * Math.sin(ph), -Math.cos(th), Math.sin(th) * Math.cos(ph)).map(c => c * inflate);
}));

// 뾰족한 귀 (R = 1 기준 메시): 바닥이 둥글고 끝이 둥글게 뾰족
const pointyEar = (p, len, base) => cached(p, `ear|${len}|${base}`, () => tube(p, 16,
  (t) => [0, -t * len, -t * len * 0.15],
  (t) => base * Math.pow(1 - t, 0.75) * Math.sqrt(Math.min(1, t / 0.12) * 0.7 + 0.3)));

function ears(p, R, { kind, color, inner = '#F4A6A6' }) {
  for (const side of [-1, 1]) {
    p.push();
    if (kind === 'pointy' || kind === 'dog') {
      const big = kind === 'dog' ? 1.15 : 1;
      atHead(p, R, side * 40, 50, -R * 0.08);
      p.rotateZ(side * 0.32);
      p.scale(R);
      p.fill(color);
      p.push();
      p.scale(1, 1, 0.55); // 앞뒤로 납작한 귀
      p.model(pointyEar(p, 0.62 * big, 0.3 * big));
      p.pop();
      p.fill(inner);
      p.translate(0, -0.06, 0.1);
      p.scale(0.6, 0.72, 0.3);
      p.model(pointyEar(p, 0.62 * big, 0.3 * big));
    } else if (kind === 'fold') {
      // 접힌 귀: 앞으로 꺾여 머리에 붙음
      atHead(p, R, side * 42, 52, R * 0.02);
      p.rotateX(0.9);
      p.rotateZ(side * 0.4);
      p.fill(color);
      p.ellipsoid(R * 0.26, R * 0.2, R * 0.08, 14, 8);
    } else if (kind === 'round') {
      atHead(p, R, side * 48, 56, R * 0.02);
      p.fill(color);
      p.ellipsoid(R * 0.24, R * 0.24, R * 0.12, 16, 10);
      p.translate(0, 0, R * 0.06);
      p.fill(inner);
      p.ellipsoid(R * 0.14, R * 0.14, R * 0.08, 12, 8);
    } else if (kind === 'floppy') {
      // 양 귀: 옆으로 처진 넓적한 귀
      atHead(p, R, side * 88, 8, R * 0.02);
      p.rotateZ(side * 0.55); // 바깥 아래로 처지게
      p.translate(side * R * 0.24, 0, 0);
      p.fill(color);
      p.ellipsoid(R * 0.32, R * 0.15, R * 0.1, 14, 8);
    }
    p.pop();
  }
}

// 꼬리: 몸통 뒤 아래에서 위로 휘어 올라감
const tailModel = (p, len, r) => cached(p, `tail|${len}|${r}`, () => tube(p, 24,
  (t) => [Math.sin(t * 2.2) * len * 0.25, -t * len * 0.75 + Math.sin(t * Math.PI) * len * 0.1, -t * len * 0.55],
  (t) => r * Math.sqrt(Math.max(0, 1 - ((2 * t - 1) ** 8))) * (1 - 0.3 * t)));

function tail(p, { bodyH, bodyRBot, bodyDepth }, { color, len = 4.2, r = 0.42, tuft }) {
  p.push();
  p.translate(0, bodyH * 0.32, -bodyRBot * bodyDepth * 0.9);
  p.fill(color);
  p.model(tailModel(p, len, r));
  if (tuft) {
    p.translate(Math.sin(2.2) * len * 0.25, -len * 0.75, -len * 0.55);
    p.fill(tuft);
    p.sphere(r * 2.2, 14, 10);
  }
  p.pop();
}

// 배 무늬: 몸통 앞 아래쪽 둥근 패치
function belly(p, { bodyH, bodyRBot, bodyDepth }, color) {
  p.push();
  p.translate(0, bodyH * 0.12, bodyRBot * bodyDepth * 0.62);
  p.fill(color);
  p.ellipsoid(bodyRBot * 0.78, bodyH * 0.36, bodyRBot * 0.42, 20, 12);
  p.pop();
}

// 얼굴 둘레를 감싸는 둥근 털 뭉치 (사자 갈기·강아지 볼털). from~to: 얼굴 둘레 각도(도, 0 = 정수리, 180 = 턱)
function ruff(p, R, { color, size, from = 0, to = 360, step = 22, yawK = 92, pitchK = 74, lift = 0.1 }) {
  p.fill(color);
  for (let a = from; a <= to; a += step) {
    const yaw = Math.sin(a * DEG) * yawK, pitch = Math.cos(a * DEG) * pitchK - 4;
    p.push();
    onHeadSurface(p, R, yaw, pitch, R * lift);
    p.sphere(R * size, 14, 10);
    p.pop();
  }
}

export const SPECIES = {
  // 갓파: 잎사귀처럼 뾰족뾰족한 머리 + 정수리 노란 접시 + 등껍질
  kappa: {
    head: (p, { crown = '#2F6B2E', plate = '#F2D65C' }, { headR: R }) => {
      p.fill(crown);
      p.push();
      p.scale(R);
      p.model(cap(p, 1.06, 46));
      p.pop();
      for (let yaw = 0; yaw < 360; yaw += 30) {
        p.push();
        onHeadSurface(p, R, yaw, 46, R * 0.04);
        p.translate(0, R * 0.12, 0);
        p.ellipsoid(R * 0.2, R * 0.2, R * 0.08, 12, 8);
        p.pop();
      }
      p.push();
      p.translate(0, -R * 1.02, 0);
      p.fill(plate);
      p.ellipsoid(R * 0.5, R * 0.12, R * 0.5, 20, 8);
      p.pop();
    },
    torso: (p, { shell = '#2F6B2E', rim = '#5E9B4A' }, ctx) => {
      const { bodyH, bodyRBot, bodyDepth } = ctx;
      p.push();
      p.translate(0, -bodyH * 0.02, -bodyRBot * bodyDepth * 0.82);
      p.fill(rim);
      p.ellipsoid(bodyRBot * 1.02, bodyH * 0.44, bodyRBot * 0.5, 22, 12);
      p.translate(0, 0, -bodyRBot * 0.08);
      p.fill(shell);
      p.ellipsoid(bodyRBot * 0.9, bodyH * 0.38, bodyRBot * 0.48, 22, 12);
      p.pop();
    },
  },

  // 펭귄: 하얀 얼굴(얼굴 텍스처) + 하얀 배 + 짧은 꼬리
  penguin: {
    torso: (p, { belly: b = '#F7F3EA' }, ctx) => {
      belly(p, ctx, b);
      tail(p, ctx, { color: ctx.skinColor, len: 1.6, r: 0.6 });
    },
  },

  // 개구리: 머리 위로 툭 튀어나온 큰 눈 두 개 + 크림색 배
  frog: {
    head: (p, { iris = '#5A3A22' }, { headR: R, skinColor }) => {
      for (const side of [-1, 1]) {
        p.push();
        atHead(p, R, side * 34, 52, -R * 0.08);
        p.fill(skinColor);
        p.sphere(R * 0.4, 18, 14);
        p.translate(0, -R * 0.02, R * 0.2);
        p.fill('#FFFFFF');
        p.ellipsoid(R * 0.31, R * 0.31, R * 0.24, 16, 12);
        p.translate(0, R * 0.02, R * 0.16);
        p.fill(iris);
        p.ellipsoid(R * 0.2, R * 0.21, R * 0.1, 14, 10);
        p.translate(R * 0.06, -R * 0.07, R * 0.07);
        p.fill('#FFFFFF');
        p.sphere(R * 0.06, 8, 6);
        p.pop();
      }
    },
    torso: (p, { belly: b = '#F3EBCF' }, ctx) => belly(p, ctx, b),
  },

  // 고양이: 뾰족한 귀 + 꼬리 (줄무늬는 얼굴 텍스처 tabby)
  cat: {
    head: (p, { inner = '#F4A6A6' }, { headR: R, skinColor }) => ears(p, R, { kind: 'pointy', color: skinColor, inner }),
    torso: (p, { tailColor }, ctx) => tail(p, ctx, { color: tailColor ?? ctx.skinColor }),
  },

  // 접힌 귀 고양이
  foldCat: {
    head: (p, { earColor }, { headR: R, skinColor }) => ears(p, R, { kind: 'fold', color: earColor ?? skinColor }),
    torso: (p, { tailColor }, ctx) => tail(p, ctx, { color: tailColor ?? ctx.skinColor }),
  },

  // 복슬복슬 강아지: 큰 뾰족 귀 + 볼털 + 가슴털 + 복슬 꼬리
  dog: {
    head: (p, { inner = '#F4B6B0' }, { headR: R, skinColor }) => {
      ears(p, R, { kind: 'dog', color: skinColor, inner });
      ruff(p, R, { color: skinColor, size: 0.34, from: 105, to: 255, step: 30, lift: -0.04 });
    },
    torso: (p, opts, ctx) => {
      const { bodyH, bodyRTop, bodyDepth, skinColor } = ctx;
      p.fill(skinColor);
      for (const [x, y] of [[-0.3, -0.4], [0.3, -0.4], [0, -0.28]]) {
        p.push();
        p.translate(x * bodyRTop, y * bodyH, bodyRTop * bodyDepth * 0.85);
        p.sphere(bodyRTop * 0.55, 14, 10);
        p.pop();
      }
      tail(p, ctx, { color: skinColor, len: 2.6, r: 0.9 });
    },
  },

  // 사자: 얼굴을 빙 둘러싼 둥근 갈기 + 둥근 귀 + 끝에 털뭉치 달린 꼬리
  lion: {
    head: (p, { mane = '#E8A93A', inner = '#F4A6A6' }, { headR: R, skinColor }) => {
      ruff(p, R, { color: mane, size: 0.34, step: 20, lift: 0.12 });
      ruff(p, R, { color: mane, size: 0.4, step: 30, yawK: 125, pitchK: 82, lift: 0.0 });
      p.push();
      p.translate(0, -R * 0.1, -R * 0.45);
      p.fill(mane);
      p.ellipsoid(R * 1.3, R * 1.2, R * 0.85, 20, 14);
      p.pop();
      ears(p, R, { kind: 'round', color: skinColor, inner });
    },
    torso: (p, { mane = '#B8651F' }, ctx) => tail(p, ctx, { color: ctx.skinColor, len: 4.6, r: 0.36, tuft: mane }),
  },

  // 양: 정수리를 덮는 버섯 같은 털 + 옆으로 처진 귀 + 동그란 꼬리
  sheep: {
    head: (p, { wool = '#7A4A2E' }, { headR: R, skinColor }) => {
      p.fill(wool);
      p.push();
      p.scale(R);
      p.model(cap(p, 1.1, 58));
      p.pop();
      ears(p, R, { kind: 'floppy', color: skinColor });
    },
    torso: (p, opts, ctx) => {
      const { bodyH, bodyRBot, bodyDepth, skinColor } = ctx;
      p.push();
      p.translate(0, bodyH * 0.3, -bodyRBot * bodyDepth);
      p.fill(skinColor);
      p.sphere(bodyRBot * 0.32, 12, 10);
      p.pop();
    },
  },
};
