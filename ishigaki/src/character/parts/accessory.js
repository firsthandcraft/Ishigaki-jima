// 액세서리 — 기준점: 머리 중심 (모자, 안경, 꽃핀 자리)
// 지금은 "none"만 있다. 새 액세서리 = 함수 하나 추가, 예:
//   hat: (p, { color }, { headR }) => { p.translate(0, -headR, 0); p.fill(color); p.cylinder(headR * 1.1, 2); }
export const DEFAULT_STYLE = 'none';

export const styles = {
  none: () => {},
};
