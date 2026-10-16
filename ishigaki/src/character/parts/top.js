// 상의 — 앵커별로 그린다. 위치·회전(팔 흔들기)은 drawCharacter가 잡아 준다.
//   body:   기준점 = 몸통 중심 (ctx.bodyH 높이, ctx.bodyR 반지름)
//   sleeve: 기준점 = 어깨 관절, 팔은 +y(아래)로 뻗음
export const DEFAULT_STYLE = 'tshirt';

export const styles = {
  tshirt: {
    body: (p, { color }, { bodyR, bodyH }) => {
      p.fill(color);
      p.cylinder(bodyR, bodyH, 12, 1);
      // 둥근 어깨
      p.push();
      p.translate(0, -bodyH / 2, 0);
      p.ellipsoid(bodyR, bodyR * 0.45, bodyR, 12, 6);
      p.pop();
    },
    sleeve: (p, { color }, { armR }) => {
      p.fill(color);
      p.translate(0, armR * 1.1, 0);
      p.ellipsoid(armR * 1.35, armR * 1.6, armR * 1.35, 8, 6);
    },
  },
};
