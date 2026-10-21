// 꾸미기 화면(/character)에서 고를 수 있는 선택지와, 고른 값을 캐릭터 설정에 적용하는 함수.
// id는 parts/*.js 의 styles 키. 설정 형식은 characterConfig.js 참고.

export const EYES = [
  { id: 'round', label: '동글눈' },
  { id: 'lashes', label: '속눈썹' },
  { id: 'dot', label: '점눈' },
  { id: 'happy', label: '웃는눈' },
  { id: 'sleepy', label: '졸린눈' },
  { id: 'sparkle', label: '반짝눈' },
  { id: 'wink', label: '윙크' },
  { id: 'cat', label: '고양이눈' },
];

export const NOSES = [
  { id: 'dot', label: '점코' },
  { id: 'triangle', label: '세모코' },
  { id: 'button', label: '동글코' },
  { id: 'wide', label: '넓은코' },
  { id: 'line', label: '선코' },
  { id: 'freckles', label: '주근깨' },
];

export const MOUTHS = [
  { id: 'smile', label: '미소' },
  { id: 'smirk', label: '씩' },
  { id: 'open', label: '활짝' },
  { id: 'flat', label: '일자' },
  { id: 'oh', label: '오!' },
  { id: 'cat', label: '고양이' },
  { id: 'tongue', label: '메롱' },
  { id: 'grin', label: '이 보이게' },
];

export const HAIRS = [
  { id: 'bob', label: '단발' },
  { id: 'bangs', label: '앞머리 일자' },
  { id: 'short', label: '숏컷' },
  { id: 'ponytail', label: '포니테일' },
  { id: 'pigtails', label: '양갈래' },
  { id: 'curly', label: '곱슬' },
  { id: 'buzz', label: '삭발' },
  { id: 'twoblock', label: '투블럭' },
  { id: 'bun', label: '똥머리' },
  { id: 'longStraight', label: '긴 생머리' },
];

// 옷은 상의·하의 세트. 색까지 정해진 한 벌
export const OUTFITS = [
  { id: 'tshirt', label: '반팔티', top: { style: 'tshirt', color: '#6FBF5A' }, bottom: { style: 'shorts', color: '#4A6FA5' } },
  { id: 'longsleeve', label: '긴팔티', top: { style: 'longsleeve', color: '#F3E3C3' }, bottom: { style: 'pants', color: '#5B7DB1' } },
  { id: 'hoodie', label: '후드티', top: { style: 'hoodie', color: '#E9908C' }, bottom: { style: 'pants', color: '#4A4F5C' } },
  { id: 'dress', label: '원피스', top: { style: 'dress', color: '#F6B8C8' }, bottom: { style: 'none' } },
  { id: 'overalls', label: '멜빵바지', top: { style: 'overalls', color: '#FFFFFF', strap: '#5683B5' }, bottom: { style: 'pants', color: '#5683B5' } },
  { id: 'shirt', label: '셔츠', top: { style: 'shirt', color: '#CFE3F5', stripe: '#A9C8E8', collar: '#FFFFFF' }, bottom: { style: 'pants', color: '#C9B48E' } },
  { id: 'sweater', label: '스웨터', top: { style: 'sweater', color: '#F2C94C' }, bottom: { style: 'pants', color: '#7A5C45' } },
  { id: 'stripeTee', label: '줄무늬티', top: { style: 'stripeTee', color: '#FFFFFF', stripe: '#3B5BA9' }, bottom: { style: 'shorts', color: '#E8D9B5' } },
  { id: 'tank', label: '민소매', top: { style: 'tank', color: '#FF9F68' }, bottom: { style: 'shorts', color: '#4DBFB0' } },
  { id: 'pajamas', label: '잠옷', top: { style: 'pajamas', color: '#BFD8F2', dot: '#FFFFFF' }, bottom: { style: 'pants', color: '#BFD8F2', pattern: 'dots', dot: '#FFFFFF' } },
];

export const SHOES = [
  { id: 'sneakers', label: '운동화' },
  { id: 'boots', label: '장화' },
  { id: 'sandals', label: '샌들' },
  { id: 'loafers', label: '구두' },
  { id: 'slippers', label: '슬리퍼' },
  { id: 'barefoot', label: '맨발' },
];

export const SKIN_COLORS = ['#F9DCC8', '#F7D1B5', '#F5C8A8', '#F0BE8C', '#E8A979', '#C98B63', '#A8714E', '#7E5236'];

export const HAIR_COLORS = [
  { color: '#2B2523', label: '검정' },
  { color: '#4A3020', label: '진갈색' },
  { color: '#7A4E2E', label: '갈색' },
  { color: '#A9784A', label: '밝은갈색' },
  { color: '#E8C268', label: '금발' },
  { color: '#E8833A', label: '주황' },
  { color: '#C8402F', label: '빨강' },
  { color: '#F2A0B8', label: '분홍' },
  { color: '#9B7FD1', label: '보라' },
  { color: '#4F7FD6', label: '파랑' },
  { color: '#6FD1C0', label: '민트' },
  { color: '#F2F0EC', label: '흰색' },
];

export const SHOE_COLORS = [
  { color: '#F7F5F0', label: '흰색' },
  { color: '#2A2A2C', label: '검정' },
  { color: '#D9473A', label: '빨강' },
  { color: '#F2C94C', label: '노랑' },
  { color: '#6FBF5A', label: '초록' },
  { color: '#4A6FA5', label: '파랑' },
  { color: '#F4A6C0', label: '분홍' },
  { color: '#8B5E3C', label: '갈색' },
  { color: '#9A9A9E', label: '회색' },
  { color: '#F2994A', label: '주황' },
  { color: '#9B7FD1', label: '보라' },
  { color: '#4DBFB0', label: '민트' },
];

const withPart = (cfg, part, patch) => ({ ...cfg, [part]: { ...cfg[part], ...patch } });

// 지금 설정에서 고른 옷 세트 (상의 모양으로 찾는다. 프리셋처럼 색만 다른 옷도 같은 세트로 본다)
export const currentOutfitId = (cfg) => OUTFITS.find(o => o.top.style === cfg.top.style)?.id ?? null;

// 선택지 하나를 고르면 바뀐 새 설정을 돌려준다 (원래 설정은 그대로)
export const apply = {
  eyes: (cfg, id) => {
    const next = withPart(cfg, 'eyes', { style: id });
    // 선글라스가 눈을 가리면 고른 눈이 안 보이니 벗긴다
    return cfg.accessory.style === 'aviators' ? { ...next, accessory: { style: 'none' } } : next;
  },
  nose: (cfg, id) => withPart(cfg, 'nose', { style: id }),
  mouth: (cfg, id) => withPart(cfg, 'mouth', { style: id }),
  hair: (cfg, id) => withPart(cfg, 'hair', { style: id }),
  outfit: (cfg, id) => {
    const o = OUTFITS.find(x => x.id === id);
    return o ? { ...cfg, top: { ...o.top }, bottom: { ...o.bottom } } : cfg;
  },
  shoes: (cfg, id) => withPart(cfg, 'shoes', { style: id }),
  hairColor: (cfg, color) => withPart(cfg, 'hair', { color }),
  shoeColor: (cfg, color) => withPart(cfg, 'shoes', { color }),
  skinColor: (cfg, color) => ({ ...cfg, skinColor: color }),
};
