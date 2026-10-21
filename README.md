

<img width="552" alt="스크린샷 2024-04-10 오후 6 15 45" src="https://raw.githubusercontent.com/firsthandcraft/Ishigaki-jima/refs/heads/main/main.png">

# Ishigaki Island

이시가키지마에 놀러간 기억으로 간단한 이미지 저장소를 만들어 보았다. 

</br>
<!-- <a href="https://firsthandcraft.github.io/handcraftProject/">완성사이트 보기</a> -->
</br></br>
<!-- ![allhandcraft](https://user-images.githubusercontent.com/97497153/222353339-2743c9f7-2184-4c6a-8c0d-2ee520d99797.png) -->


## :bulb:서비스 및 프로젝트 소개

**`handcraftproject`** 는 작성이의 자기소개 사이트 입니다. 퍼블리셔, 웹 디자이너의 취업에 적합한 요구와 작성이의 장점 및 특징을 조사하여 취업하고자 하는 회사에 어필을 할수 있도록 기획했습니다. 

## 📖: 기능
- 로그인 , 로그아웃
- 회원가입, 탈퇴
- 이미지 등록, 수정, 삭제 , 읽기 
- 이미지 꾸미기 및 저장

## :wrench: 사용 기술 스택
- React
- TailWindCss
- css
- p5js


## floppy_disk: 기간
2025.08.05 ~ 08.30
- 틈새 작업으로 온전한 시간을 사용하지 않은점!! 쉬었다 했다 반복했음


### 피드백

타입스크립트로 다음에 만들어 보자 

p5js에서 3D 랜터링시 p.orbitControl();로 이미지를 360도 3D로 볼순 있지만 이벤트가 발행되면 원하는 각도로 옮기는 실험을 하였지만 특성상 구현이 안되었다.
(p.camera(0, -10, -700, 200,0, 100, 0, 1, 0);) 로 새로 랜더링시 카메라의 각도를 변경하였다. 

결론 ::

새로운 주소 페이지로 클릭하면 원하는 각도의 위치로 깜박이지 않고 자연스럽게 움직이는 기능은 해당 p5js로 구현이 어렵다. 

---

## 개발 메모

#### start
```
 npm create vite@latest Ishigaki
 React
 JavaScript + SWC
 
```


#### p5js

p.push()는 현재 변환 상태(위치, 회전, 크기 등)를 스택에 저장


#### tailwindCss

#### 섬 돌아다니기 (동물의 숲 스타일)

- 이동: `WASD` / 방향키, 달리기: `Shift`, 카메라 45° 회전: `Q` / `E`, 타일 그리드 보기: `G`, 모바일: 좌하단 조이스틱
- 타일 그리드: `src/world/grid.js` — 1타일 = `GRID.TILE` 월드 단위, 모든 소품은 `placeObject(type, tx, tz)`로 타일 중앙에 놓인다
- 여행 기록: `src/data/places.json` 의 `date`, `memo`, `photos` 를 채우면 장소 카드에 나온다. 사진은 `public/photos/` 에.
- 크기·속도·색상·카메라 값: `src/world/config.js`
- 캐릭터 꾸미기: 상단 얼굴 아이콘(`/character`, 예전 `/journal`은 여기로 이동). 선택지·색 팔레트는 `src/character/customize.js`, "결정"하면 브라우저에 기억된다
- 캐릭터 외형 파츠: `src/character/parts/*.js` (새 머리·옷 = 스타일 함수 하나)
- 섬 주민: `src/character/residents.js` (명단·생김새·인사말), 동물 종 파츠 `src/character/species.js`, 덩어리 주민 `src/character/blob.js`. 집 주변을 산책하는 방식(속도·반경·쉬는 시간)은 `src/world/config.js` 의 `RESIDENTS_AI`, 가까이 가면 멈춰서 인사한다
- 해안선 다시 만들기: `node scripts/buildCoastline.mjs <overpass.json>` (데이터 © OpenStreetMap contributors)

개발용 쿼리스트링

| 쿼리 | 기능 |
|---|---|
| `?debug=top` | 위에서 내려다보는 직교 카메라 |
| `?debug=collide` | 해안선·콜라이더·장소 반경 표시 |
| `?debug=grid` | 타일 그리드 오버레이 켠 채로 시작 (`G` 로 토글) |
| `?fps=1` | FPS 표시, 콘솔에서 `__islandLive` 로 위치 확인 |
| `?char=wavy` | 이 캐릭터로 시작 (`src/character/presets.js` 의 id, 꾸민 캐릭터보다 우선) |
| `?at=kabira` | 해당 장소 근처에서 시작 (`?at=120,-340` 처럼 월드 좌표도 가능) |
| `?cam=60` | 카메라 거리 덮어쓰기 |
| `/character?resident=kappi` | 꾸미기 화면 미리보기에 이 주민을 그림 (주민 모델 확인용) |
| `/character?yaw=0` | 미리보기 각도 고정 (0 정면, 45, 90 측면) |
| `?move=0,1,run` | 키 입력 없이 계속 이동 |
