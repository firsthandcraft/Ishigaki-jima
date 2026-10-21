import { defaultCharacter } from './characterConfig';

// 미리 만들어 둔 플레이어 캐릭터 (참고: docs/player/player.png). 꾸미기 전 첫 모습과 ?char= 디버그용.
// config는 characterConfig.js와 같은 형식 — 파츠 style id는 parts/*.js 의 styles 키.
export const CHARACTER_PRESETS = [
  {
    id: 'sunny',
    name: '플레이어 1',
    desc: '부스스한 머리 · 선글라스 · 까만 티셔츠',
    config: {
      ...defaultCharacter,
      skinColor: '#F3C29A',
      hair:      { style: 'messy', color: '#3A2820' },
      eyes:      { style: 'round', color: '#2B2B2B' },
      nose:      { style: 'triangle', color: '#E07650' },
      mouth:     { style: 'smirk' },
      cheeks:    { style: 'none' },
      top:       { style: 'tshirt', color: '#2A2A2C' },
      bottom:    { style: 'shorts', color: '#232325' },
      shoes:     { style: 'sneakers', color: '#2C3550', accent: '#D9473A' },
      accessory: { style: 'aviators', color: '#2B2320', frame: '#8A847C' },
    },
  },
  {
    id: 'wavy',
    name: '플레이어 2',
    desc: '긴 웨이브 머리 · 줄무늬 셔츠 · 데님 스커트',
    config: {
      ...defaultCharacter,
      skinColor: '#F6CBA2',
      hair:      { style: 'longWavy', color: '#2E201B' },
      eyes:      { style: 'lashes', color: '#6B4126' },
      nose:      { style: 'triangle', color: '#F07A5E' },
      mouth:     { style: 'open' },
      cheeks:    { style: 'pink' },
      top:       { style: 'shirt', color: '#F4C6D8', stripe: '#E68AAE', collar: '#F8DCE6' },
      bottom:    { style: 'skirt', color: '#5683B5' },
      shoes:     { style: 'sneakers', color: '#8B6A50', sole: '#EFE5D6' },
      accessory: { style: 'hairclip', color: '#D4A94E' },
    },
  },
];

export const presetById = (id) => CHARACTER_PRESETS.find(c => c.id === id) ?? null;
