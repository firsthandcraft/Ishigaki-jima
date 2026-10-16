import * as hair from './hair';
import * as eyes from './eyes';
import * as nose from './nose';
import * as mouth from './mouth';
import * as cheeks from './cheeks';
import * as top from './top';
import * as bottom from './bottom';
import * as shoes from './shoes';
import * as accessory from './accessory';

// 파츠 레지스트리: 종류 → { styles, DEFAULT_STYLE }
export const PARTS = { hair, eyes, nose, mouth, cheeks, top, bottom, shoes, accessory };

const warned = new Set();

// 설정의 style id로 그리기 함수(또는 앵커별 함수 묶음)를 찾는다.
// 없는 id면 기본 스타일로 대체하고 한 번만 경고 (에러로 멈추지 않게).
export function resolveStyle(partName, styleId) {
  const part = PARTS[partName];
  const style = part.styles[styleId];
  if (style) return style;
  const key = `${partName}:${styleId}`;
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(`[character] "${partName}" 파츠에 "${styleId}" 스타일이 없어 기본값 "${part.DEFAULT_STYLE}"을 씁니다.`);
  }
  return part.styles[part.DEFAULT_STYLE];
}
