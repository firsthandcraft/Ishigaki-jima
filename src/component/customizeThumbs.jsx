import { useEffect, useState } from 'react';
import { getThumb } from '../character/thumbnails';

// 꾸미기 화면 선택지 그림들: 얼굴 파츠 SVG, 머리·옷·신발 3D 썸네일, 색 블롭

const INK = '#3A2A24';
const LIP = '#A5523F';

// 피부색보다 진한 색 (코·주근깨). k가 클수록 진하다
function skinShade(hex, k = 1) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - 0.12 * k));
  const g = Math.round(((n >> 8) & 255) * (1 - 0.22 * k));
  const b = Math.round((n & 255) * (1 - 0.25 * k));
  return `rgb(${r},${g},${b})`;
}

const line = { fill: 'none', stroke: INK, strokeWidth: 4.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

const roundEye = (cx, c) => (
  <g key={cx}>
    <ellipse cx={cx} cy="50" rx="8" ry="11" fill={c} />
    <circle cx={cx + 2.5} cy="45" r="2.8" fill="#fff" />
  </g>
);
const happyEye = (cx, c) => <path key={cx} d={`M${cx - 9} 54 Q${cx} 40 ${cx + 9} 54`} {...line} stroke={c} />;

const EYE_SVGS = {
  round: (c) => [roundEye(32, c), roundEye(68, c)],
  lashes: (c) => [32, 68].map((cx, i) => (
    <g key={cx}>
      <ellipse cx={cx} cy="51" rx="10" ry="13" fill={c} />
      <ellipse cx={cx} cy="53" rx="5" ry="7" fill="#1F1410" />
      <circle cx={cx + (i ? -3 : 3)} cy="45" r="3.2" fill="#fff" />
      <path d={i ? `M${cx + 7} 41 L${cx + 13} 35` : `M${cx - 7} 41 L${cx - 13} 35`} {...line} strokeWidth="3.5" />
    </g>
  )),
  dot: (c) => [32, 68].map(cx => <ellipse key={cx} cx={cx} cy="51" rx="4.5" ry="5.5" fill={c} />),
  happy: (c) => [happyEye(32, c), happyEye(68, c)],
  sleepy: (c) => [32, 68].map(cx => (
    <g key={cx}>
      <path d={`M${cx - 9} 50 Q${cx} 62 ${cx + 9} 50 Z`} fill={c} />
      <path d={`M${cx - 10} 50 L${cx + 10} 50`} {...line} strokeWidth="3.5" />
    </g>
  )),
  sparkle: (c) => [32, 68].map(cx => (
    <g key={cx}>
      <ellipse cx={cx} cy="50" rx="11" ry="14" fill={c} />
      <circle cx={cx + 3.5} cy="44" r="4" fill="#fff" />
      <circle cx={cx - 4} cy="56" r="2" fill="#fff" />
    </g>
  )),
  wink: (c) => [roundEye(32, c), happyEye(68, c)],
  cat: (c) => [32, 68].map((cx, i) => (
    <g key={cx} transform={`rotate(${i ? -18 : 18} ${cx} 50)`}>
      <ellipse cx={cx} cy="50" rx="11" ry="6.5" fill={c} />
      <circle cx={cx + (i ? -2 : 2)} cy="48" r="2.4" fill="#fff" />
    </g>
  )),
};

const NOSE_SVGS = {
  dot: (s) => <ellipse cx="50" cy="50" rx="6" ry="4.5" fill={skinShade(s)} />,
  triangle: () => <path d="M50 40 L60 58 L40 58 Z" fill="#E9845E" stroke="#E9845E" strokeWidth="4" strokeLinejoin="round" />,
  button: (s) => <circle cx="50" cy="50" r="10" fill={skinShade(s, 0.8)} />,
  wide: (s) => <ellipse cx="50" cy="50" rx="14" ry="6" fill={skinShade(s, 1.2)} />,
  line: (s) => <path d="M51 41 L49 57" {...line} stroke={skinShade(s, 1.8)} />,
  freckles: (s) => (
    <>
      <ellipse cx="50" cy="50" rx="6" ry="4.5" fill={skinShade(s)} />
      {[[24, 44], [31, 50], [22, 54], [76, 44], [69, 50], [78, 54]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill={skinShade(s, 1.8)} />
      ))}
    </>
  ),
};

const MOUTH_SVGS = {
  smile: () => <path d="M36 46 Q50 60 64 46" {...line} stroke={LIP} />,
  smirk: () => <path d="M34 52 Q48 56 58 50 Q63 47 66 42" {...line} stroke={INK} />,
  open: () => (
    <>
      <path d="M34 44 H66 Q66 64 50 64 Q34 64 34 44 Z" fill="#E5533F" />
      <ellipse cx="50" cy="58" rx="8" ry="4" fill="#F28A7A" />
    </>
  ),
  flat: () => <path d="M36 50 H64" {...line} stroke={LIP} />,
  oh: () => <ellipse cx="50" cy="51" rx="8" ry="10" fill="#7A3328" />,
  cat: () => <path d="M32 46 Q41 58 50 47 Q59 58 68 46" {...line} stroke={LIP} />,
  tongue: () => (
    <>
      <path d="M34 42 H66 Q66 60 50 60 Q34 60 34 42 Z" fill="#E5533F" />
      <path d="M42 54 Q42 70 50 70 Q58 70 58 54 Z" fill="#F07F8C" />
    </>
  ),
  grin: () => (
    <>
      <path d="M30 42 H70 Q70 64 50 64 Q30 64 30 42 Z" fill="#7A3328" />
      <path d="M33 45 H67 Q66 52 64 53 H36 Q34 52 33 45 Z" fill="#fff" />
    </>
  ),
};

// 눈·코·입만 따로 그린 SVG (part: eyes | nose | mouth)
export function FaceThumb({ part, id, eyeColor, skinColor }) {
  const draw = { eyes: EYE_SVGS, nose: NOSE_SVGS, mouth: MOUTH_SVGS }[part][id];
  return (
    <svg className="ccThumb" viewBox="14 14 72 72" aria-hidden="true">
      {draw(part === 'eyes' ? eyeColor : skinColor)}
    </svg>
  );
}

// 게임 캐릭터를 그대로 찍은 썸네일 (view: head | body | feet)
export function ModelThumb({ cfg, view }) {
  const key = `${view}|${JSON.stringify(cfg)}`;
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    const ready = getThumb(key, cfg, view, (u) => { if (alive) setUrl(u); });
    if (ready) setUrl(ready);
    return () => { alive = false; };
  }, [key, cfg, view]);
  return url
    ? <img className="ccThumb" src={url} alt="" draggable="false" />
    : <span className="ccThumb ccThumbLoading" aria-hidden="true" />;
}

// 동글동글한 물방울/구름 모양 색 블롭
const BLOB = 'M34 9C45 3 60 6 65 15C78 11 92 21 91 36C98 47 93 64 79 69C76 83 58 90 46 82C33 89 13 82 11 67C2 59 3 41 13 34C11 21 21 11 34 9Z';
export function ColorBlob({ color, selected }) {
  return (
    <svg className="ccBlob" viewBox="-6 -6 112 108" aria-hidden="true">
      {selected && <path d={BLOB} fill="none" stroke="var(--cc-mint)" strokeWidth="18" strokeLinejoin="round" />}
      {selected && <path d={BLOB} fill="none" stroke="var(--cc-cream)" strokeWidth="9" strokeLinejoin="round" />}
      <path d={BLOB} fill={color} />
    </svg>
  );
}
