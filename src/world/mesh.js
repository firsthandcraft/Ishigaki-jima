import p5 from 'p5';

// 정점 배열로 p5.Geometry를 한 번 만든다. setup에서만 호출하고, draw에선 model()로 그리기만 한다.
// positions/normals: [x,y,z, ...] (p5 좌표, y+ 아래), colors: [r,g,b,a, ...] (0~1), faces: [[a,b,c], ...]
// uvs: [u,v, ...] (생략하면 0). 지형은 텍스처 대신 타일 번호를 담는 데 쓴다
export function makeGeometry(p, { positions, normals, colors, faces, uvs }) {
  const geom = new p5.Geometry(1, 1);
  const count = positions.length / 3;
  for (let i = 0; i < count; i++) {
    geom.vertices.push(p.createVector(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]));
    geom.vertexNormals.push(p.createVector(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]));
    geom.uvs.push(uvs ? uvs[i * 2] : 0, uvs ? uvs[i * 2 + 1] : 0);
  }
  for (let i = 0; i < colors.length; i++) geom.vertexColors.push(colors[i]);
  if (faces) {
    geom.faces = faces;
  } else {
    // 인덱스 없이 3개씩 끊어진 삼각형 (면마다 다른 색을 칠할 때)
    for (let i = 0; i < count; i += 3) geom.faces.push([i, i + 1, i + 2]);
  }
  return geom;
}

export function hexToRgb01(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export const lerp = (a, b, t) => a + (b - a) * t;

// 시드 고정 난수 (소품 배치가 새로고침해도 같도록)
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 좌표 해시 → 0~1 (면마다 살짝 다른 색감용)
export function hash2(x, z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// 시드 고정 2D value noise → 0~1 (소품 군집용). 격자 간격 1, 부드럽게 보간
export function valueNoise2(seed) {
  const h = (i, j) => {
    let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 1274126177)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1103515245);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  return (x, z) => {
    const i = Math.floor(x), j = Math.floor(z);
    const u = smoothstep(0, 1, x - i), v = smoothstep(0, 1, z - j);
    return lerp(lerp(h(i, j), h(i + 1, j), u), lerp(h(i, j + 1), h(i + 1, j + 1), u), v);
  };
}
