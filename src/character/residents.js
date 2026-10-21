import { defaultCharacter } from './characterConfig';
import { drawCharacter } from './drawCharacter';
import { drawBlob } from './blob';

// 섬 주민 명단 (참고: docs/people/*). 레퍼런스의 분위기·종류만 빌린 이 섬만의 오리지널 주민들이다.
// 사람·동물 주민 config는 플레이어와 같은 형식 (characterConfig.js) + species(종 파츠, species.js) + facePaint(얼굴 무늬).
// 덩어리 주민은 blob (blob.js). type: 주민 화면에 나오는 종류·직업, greeting: 가까이 가면 뜨는 인사말.

// 동물 주민 공통: 머리카락·사람 귀 없이 털색 몸, 눈썹 없는 눈, 맨발(털색)
const animal = (fur, rest) => ({
  ...defaultCharacter,
  skinColor: fur,
  hair: { style: 'none', color: fur },
  eyes: { style: 'bead', color: '#2A1E1A', brows: false },
  nose: { style: 'none' },
  mouth: { style: 'cat' },
  cheeks: { style: 'pink' },
  top: { style: 'none' },
  bottom: { style: 'none' },
  shoes: { style: 'paws' },
  accessory: { style: 'none' },
  ...rest,
});

const human = (rest) => ({ ...defaultCharacter, nose: { style: 'triangle' }, mouth: { style: 'open' }, ...rest });

export const RESIDENTS = [
  // ── 사람 주민 (docs/people 작업복 3인방, 백팩 소년)
  {
    id: 'haru', name: '하루', type: '페인트공', greeting: '오늘은 어디를 칠해 볼까?',
    config: human({
      skinColor: '#F6CBA2',
      hair: { style: 'short', color: '#4A3020' },
      eyes: { style: 'happy', color: '#4A3328' },
      top: { style: 'overalls', color: '#3E6FB0', strap: '#2F5C9A' },
      bottom: { style: 'pants', color: '#2F5C9A' },
      shoes: { style: 'sneakers', color: '#F7F5F0' },
      accessory: { style: 'cap', color: '#3B6CB5' },
    }),
  },
  {
    id: 'mina', name: '미나', type: '정원사', greeting: '바닷바람이 좋다~',
    config: human({
      skinColor: '#F7D1B5',
      hair: { style: 'bob', color: '#5A3824' },
      eyes: { style: 'round', color: '#5A3A22' },
      top: { style: 'sweater', color: '#8E5BC9' },
      bottom: { style: 'pants', color: '#2A2A2C' },
      shoes: { style: 'loafers', color: '#26304A' },
      accessory: { style: 'headband', color: '#F2F0EC' },
    }),
  },
  {
    id: 'doyun', name: '도윤', type: '목수', greeting: '안전 제일!',
    config: human({
      skinColor: '#F0BE8C',
      hair: { style: 'short', color: '#3A2820' },
      eyes: { style: 'round', color: '#4A3328' },
      mouth: { style: 'smile' },
      top: { style: 'shirt', color: '#F09AAE', stripe: '#F09AAE', collar: '#F7C4CF' },
      bottom: { style: 'pants', color: '#2A2A2C' },
      shoes: { style: 'boots', color: '#2A2A2C' },
      accessory: { style: 'hardhat', color: '#F2C230' },
    }),
  },
  {
    id: 'jun', name: '준', type: '꼬마 탐험가', greeting: '탐험하러 가는 중이야!',
    config: human({
      skinColor: '#F5C8A8',
      hair: { style: 'twoblock', color: '#24305E' },
      eyes: { style: 'round', color: '#3B5BA9' },
      top: { style: 'tshirt', color: '#FFFFFF' },
      bottom: { style: 'shorts', color: '#2F5DA8' },
      shoes: { style: 'sneakers', color: '#2F5DA8' },
      accessory: { style: 'backpack', color: '#2F5DA8' },
    }),
  },

  // ── 동물 주민
  {
    id: 'kappi', name: '캇피', type: '갓파', greeting: '강물 냄새가 나네~ 꽉꽉.',
    config: animal('#5DAE4A', {
      eyes: { style: 'bead', color: '#1E1A16', brows: false },
      nose: { style: 'beak', color: '#F2C94C', size: 1.1 },
      mouth: { style: 'none' },
      cheeks: { style: 'none' },
      shoes: { style: 'paws', color: '#4E9A3E' },
      species: { id: 'kappa', crown: '#2F6B2E', plate: '#F2D65C', shell: '#2F6B2E', rim: '#7DBB5E' },
    }),
  },
  {
    id: 'pengsu', name: '펭수리', type: '펭귄', greeting: '모래가 따끈따끈해!',
    config: animal('#26386E', {
      nose: { style: 'beak', color: '#F2B53A', size: 0.85 },
      mouth: { style: 'none' },
      shoes: { style: 'paws', color: '#F2B53A', webbed: true },
      facePaint: [{ kind: 'mask', color: '#F7F3EA' }],
      species: { id: 'penguin', belly: '#F7F3EA' },
    }),
  },
  {
    id: 'gaegul', name: '개굴이', type: '개구리', greeting: '배고프다… 토스트 먹고 싶어!',
    config: animal('#58B84A', {
      eyes: { style: 'none' },
      nose: { style: 'nostrils' },
      mouth: { style: 'wide', tongue: true },
      shoes: { style: 'paws', webbed: true },
      top: { style: 'tank', color: '#E2462F' },
      facePaint: [{ kind: 'lowerHalf', color: '#F3EBCF' }],
      species: { id: 'frog', belly: '#F3EBCF' },
    }),
  },
  {
    id: 'mongsil', name: '몽실', type: '강아지', greeting: '산책하기 딱 좋은 날이야.',
    config: animal('#F7F5F2', {
      nose: { style: 'pet', color: '#2A1E1A', size: 1.1 },
      mouth: { style: 'smile' },
      cheeks: { style: 'none' },
      top: { style: 'patchwork' },
      species: { id: 'dog', inner: '#F4B6B0' },
    }),
  },
  {
    id: 'nabi', name: '나비', type: '고양이', greeting: '헤헤, 낮잠 자고 왔어.',
    config: animal('#9A9AA2', {
      eyes: { style: 'happy', color: '#3A3A40', brows: false },
      nose: { style: 'pet', color: '#F09AAE', size: 0.6 },
      top: { style: 'stripeTee', color: '#F2D23C', stripe: '#4CAF50' },
      facePaint: [{ kind: 'lowerHalf', color: '#F4F2EE' }, { kind: 'tabby', color: '#6E6E78' }],
      species: { id: 'foldCat', earColor: '#7C7C86' },
    }),
  },
  {
    id: 'gyul', name: '귤이', type: '고양이', greeting: '오늘도 기분 최고~',
    config: animal('#EE9A3C', {
      eyes: { style: 'happy', color: '#5A3216', brows: false },
      nose: { style: 'pet', color: '#B5562A', size: 0.55 },
      mouth: { style: 'smile' },
      top: { style: 'shirt', color: '#FFFFFF', stripe: '#6CC46A', collar: '#FFFFFF' },
      facePaint: [{ kind: 'tabby', color: '#C8662A' }],
      species: { id: 'cat', inner: '#F6B49A' },
    }),
  },
  {
    id: 'leo', name: '레오', type: '사자', greeting: '어흥! …농담이야.',
    config: animal('#F2C552', {
      eyes: { style: 'round', color: '#5A3A22', brows: false },
      nose: { style: 'pet', color: '#5A3324', size: 1.3 },
      mouth: { style: 'open' },
      cheeks: { style: 'none' },
      top: { style: 'shirt', color: '#D9473A', stripe: '#F2E6D8', collar: '#D9473A' },
      species: { id: 'lion', mane: '#E8A93A' },
    }),
  },
  {
    id: 'pomi', name: '포미', type: '양', greeting: '…파인 사이다 마실래?',
    config: animal('#F3DCC4', {
      eyes: { style: 'sleepy', color: '#3A2620', brows: false },
      mouth: { style: 'cat' },
      top: { style: 'longsleeve', color: '#3E8A4A' },
      species: { id: 'sheep', wool: '#7A4A2E' },
    }),
  },

  // ── 덩어리 주민
  { id: 'ebi', name: '에비', type: '새우튀김', greeting: '바삭바삭! 나 맛있어 보여?', blob: { kind: 'ebi', color: '#F2B23A', limbColor: '#4A2A1E', accent: '#E8542E' } },
  { id: 'morae', name: '모래', type: '말랑이', greeting: '느긋~하게 가자.', blob: { kind: 'mochi', color: '#B98A5A' } },
];

export const residentById = (id) => RESIDENTS.find(r => r.id === id) ?? null;

// 주민 한 명 그리기 (원점 = 발바닥, anim은 drawCharacter와 같은 형식)
export function drawResident(p, def, anim) {
  if (def.blob) drawBlob(p, def, anim);
  else drawCharacter(p, def.config, anim);
}
