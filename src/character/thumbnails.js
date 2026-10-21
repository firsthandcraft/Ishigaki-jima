import p5 from 'p5';
import { drawCharacter } from './drawCharacter';
import { drawResident } from './residents';
import { blobHeight } from './blob';
import { LIGHT } from '../world/config';

// 꾸미기 화면 선택지·주민 화면 사진. 화면 밖 p5 캔버스 하나로 게임 캐릭터를 직접 그려 찍고,
// 한 프레임에 한 장씩 dataURL로 만들어 캐시한다 (WebGL 캔버스를 썸네일마다 만들지 않게).
const SIZE = 160;

// view별 카메라: [눈 높이, 거리, 바라보는 높이, 몸 돌린 각도]
const VIEWS = {
  head: { eyeY: -16, dist: 25, lookY: -14.2, yaw: 0.5 },
  body: { eyeY: -11, dist: 46, lookY: -10, yaw: 0.35 },
  feet: { eyeY: -5, dist: 13, lookY: -1.4, yaw: 0.7 },
  portrait: { eyeY: -15.4, dist: 24, lookY: -15.0, yaw: 0.12 }, // 얼굴 정면 (주민 목록)
};

// 덩어리 주민은 키가 달라서 키에 맞춰 카메라를 잡는다
function viewFor(subject, view) {
  if (!subject.blob) return VIEWS[view];
  const H = blobHeight(subject);
  return view === 'portrait'
    ? { eyeY: -H * 0.58, dist: H * 1.35, lookY: -H * 0.52, yaw: 0.12 }
    : { eyeY: -H * 0.5, dist: H * 2.6, lookY: -H * 0.5, yaw: 0.35 };
}

const cache = new Map();   // key → dataURL
const pending = new Map(); // key → { subject, view, resolvers }
let instance = null;

function ensureInstance() {
  if (instance) return;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;overflow:hidden;pointer-events:none';
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);
  instance = new p5((p) => {
    p.setup = () => {
      p.createCanvas(SIZE, SIZE, p.WEBGL);
      p.pixelDensity(1);
      p.noStroke();
    };
    p.draw = () => {
      const next = pending.entries().next();
      if (next.done) {
        p.noLoop();
        return;
      }
      const [key, job] = next.value;
      pending.delete(key);
      const v = viewFor(job.subject, job.view);
      p.clear();
      p.perspective(Math.PI / 6, 1, 1, 500);
      p.camera(0, v.eyeY, v.dist, 0, v.lookY, 0, 0, 1, 0);
      p.ambientLight(...LIGHT.ambient);
      p.directionalLight(...LIGHT.sun, -0.3, 0.6, -0.75);
      p.rotateY(v.yaw);
      const anim = { phase: 0, move: 0, time: 0, shadow: false, faceSize: 512 };
      if (job.subject.blob || job.subject.config) drawResident(p, job.subject, anim); // 주민 정의
      else drawCharacter(p, job.subject, anim); // 캐릭터 설정
      const url = p.canvas.toDataURL('image/png');
      cache.set(key, url);
      job.resolvers.forEach(r => r(url));
    };
  }, host);
}

// 이미 찍었으면 바로 dataURL, 아니면 null (찍히면 onReady로 알려 준다)
// subject: 캐릭터 설정(characterConfig 형식) 또는 주민 정의(character/residents.js)
export function getThumb(key, subject, view, onReady) {
  if (cache.has(key)) return cache.get(key);
  ensureInstance();
  const job = pending.get(key) ?? { subject, view, resolvers: [] };
  job.resolvers.push(onReady);
  pending.set(key, job);
  instance.loop();
  return null;
}
