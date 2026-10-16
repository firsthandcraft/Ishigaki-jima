// 얼굴 파츠 공통 도우미: 머리 구 표면 위의 한 점으로 이동하고 표면에 붙도록 회전한다.
// yawDeg: 좌우(오른쪽 +), pitchDeg: 위아래(위 +). 기준점은 머리 중심.
export function onHeadSurface(p, headR, yawDeg, pitchDeg, lift = 0) {
  const yaw = yawDeg * Math.PI / 180;
  const pitch = pitchDeg * Math.PI / 180;
  const r = headR + lift;
  p.translate(r * Math.sin(yaw) * Math.cos(pitch), -r * Math.sin(pitch), r * Math.cos(yaw) * Math.cos(pitch));
  p.rotateY(yaw);
  p.rotateX(pitch);
}
