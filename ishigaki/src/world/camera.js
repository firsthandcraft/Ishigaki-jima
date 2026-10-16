import { CAMERA } from './config';
import { COAST_BOUNDS } from './geo';

const DEG = Math.PI / 180;

// 동물의 숲 시점: 캐릭터 뒤쪽 위에서 고정된 각도로 내려다보고, 위치만 부드럽게 따라간다.
// yaw 0 = 북쪽이 화면 위. Q/E로 ROTATE_STEP 단위 회전.
export function createFollowCamera() {
  const cam = {
    yaw: 0, targetYaw: 0,
    focusX: 0, focusH: 0, focusZ: 0,
    eyeX: 0, eyeY: 0, eyeZ: 0,
    fwdX: 0, fwdZ: -1,      // 카메라가 보는 방향 (xz 평면, 단위 벡터)
    rightX: 1, rightZ: 0,   // 화면 오른쪽 방향
  };

  cam.snapTo = (x, h, z) => {
    cam.focusX = x; cam.focusH = h; cam.focusZ = z;
  };

  cam.rotate = (steps) => {
    cam.targetYaw += steps * CAMERA.ROTATE_STEP * DEG;
  };

  cam.update = (target, dt) => {
    // 프레임레이트와 무관하게 "60fps에서 프레임당 FOLLOW_LERP" 만큼 따라감
    const k = 1 - Math.pow(1 - CAMERA.FOLLOW_LERP, dt * 60);
    cam.focusX += (target.x - cam.focusX) * k;
    cam.focusH += (target.h - cam.focusH) * k;
    cam.focusZ += (target.z - cam.focusZ) * k;
    cam.yaw += (cam.targetYaw - cam.yaw) * Math.min(1, k * 1.5);

    cam.fwdX = Math.sin(cam.yaw);
    cam.fwdZ = -Math.cos(cam.yaw);
    cam.rightX = -cam.fwdZ;
    cam.rightZ = cam.fwdX;

    const pitch = CAMERA.CAM_PITCH * DEG;
    const back = CAMERA.CAM_DIST * Math.cos(pitch);
    const up = CAMERA.CAM_DIST * Math.sin(pitch);
    cam.eyeX = cam.focusX - cam.fwdX * back;
    cam.eyeZ = cam.focusZ - cam.fwdZ * back;
    cam.eyeY = -(cam.focusH + up);
  };

  cam.apply = (p) => {
    p.perspective(CAMERA.FOV * DEG, p.width / p.height, CAMERA.NEAR, CAMERA.FAR);
    p.camera(cam.eyeX, cam.eyeY, cam.eyeZ, cam.focusX, -cam.focusH, cam.focusZ, 0, 1, 0);
  };

  // ?debug=top: 섬 전체를 위에서 내려다보는 직교 카메라
  cam.applyTop = (p) => {
    const w = COAST_BOUNDS.maxX - COAST_BOUNDS.minX;
    const h = COAST_BOUNDS.maxZ - COAST_BOUNDS.minZ;
    const cx = (COAST_BOUNDS.minX + COAST_BOUNDS.maxX) / 2;
    const cz = (COAST_BOUNDS.minZ + COAST_BOUNDS.maxZ) / 2;
    const k = Math.max(w / p.width, h / p.height) * 1.1;
    p.ortho(-p.width / 2 * k, p.width / 2 * k, -p.height / 2 * k, p.height / 2 * k, 0, 10000);
    p.camera(cx, -3000, cz, cx, 0, cz, 0, 0, 1); // p5 ortho는 y가 뒤집혀서 up=+z 일 때 북쪽이 화면 위
    cam.eyeX = cx; cam.eyeZ = cz;
  };

  return cam;
}
