// 옷 무늬 텍스처. p5 인스턴스·색 조합마다 한 번만 만들어 재사용한다.
// p5 cylinder·몸통 메시의 텍스처 좌표: u = 둘레, v = 높이
// createGraphics 대신 createImage에 직접 그린다 (p5 2.x의 Graphics는 하나마다 WebGL 컨텍스트를 더 만들어서
// 여러 개 만들면 브라우저 한도를 넘어 섬·미리보기 캔버스가 꺼질 수 있다)
const cache = new WeakMap();

export function canvasImage(p, w, h, paint) {
  const img = p.createImage(w, h);
  paint(img.drawingContext);
  img.setModified(true);
  return img;
}

function pattern(p, key, w, h, paint) {
  if (!cache.has(p)) cache.set(p, new Map());
  const byKey = cache.get(p);
  if (!byKey.has(key)) byKey.set(key, canvasImage(p, w, h, paint));
  return byKey.get(key);
}

// 세로 줄무늬 (셔츠)
export const stripes = (p, base, stripe) => pattern(p, `v|${base}|${stripe}`, 64, 16, (c) => {
  c.fillStyle = base;
  c.fillRect(0, 0, 64, 16);
  c.fillStyle = stripe;
  for (let x = 0; x < 64; x += 4) c.fillRect(x, 0, 1.5, 16);
});

// 가로 줄무늬 (마린 티셔츠)
export const hstripes = (p, base, stripe) => pattern(p, `h|${base}|${stripe}`, 16, 32, (c) => {
  c.fillStyle = base;
  c.fillRect(0, 0, 16, 32);
  c.fillStyle = stripe;
  for (let y = 2; y < 32; y += 8) c.fillRect(0, y, 16, 4);
});

// 물방울 무늬 (잠옷)
export const dots = (p, base, dot) => pattern(p, `d|${base}|${dot}`, 64, 32, (c) => {
  c.fillStyle = base;
  c.fillRect(0, 0, 64, 32);
  c.fillStyle = dot;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      c.beginPath();
      c.arc(x * 8 + (y % 2) * 4 + 2, y * 8 + 4, 1.5, 0, Math.PI * 2);
      c.fill();
    }
  }
});

// 알록달록 체크 (조끼)
export const checker = (p, colors) => pattern(p, `c|${colors.join(',')}`, 64, 32, (c) => {
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      c.fillStyle = colors[(x + y * 3) % colors.length];
      c.fillRect(x * 8, y * 8, 8, 8);
    }
  }
});
