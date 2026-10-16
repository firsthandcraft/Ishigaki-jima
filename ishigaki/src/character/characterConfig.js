// 현재 캐릭터의 외형 설정.
// 나중에 꾸미기 화면(React)이 worldStore의 character 값을 바꾸면 스케치 재생성 없이 다음 프레임부터 반영된다.
// style 값은 parts/*.js 의 styles 레지스트리 키. 없는 id면 기본값으로 대체하고 콘솔 경고만 띄운다.
export const defaultCharacter = {
  skinColor: '#FCE3CF',
  hair:      { style: 'short', color: '#D9D4CF' },
  eyes:      { style: 'round', color: '#2B2B2B' },
  nose:      { style: 'dot' },
  mouth:     { style: 'smile' },
  cheeks:    { style: 'pink' },
  top:       { style: 'tshirt', color: '#6FBF5A' },
  bottom:    { style: 'shorts', color: '#4A6FA5' },
  shoes:     { style: 'sneakers', color: '#F2C14E' },
  accessory: { style: 'none' },
};
