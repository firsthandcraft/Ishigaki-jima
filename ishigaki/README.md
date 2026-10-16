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

- 이동: `WASD` / 방향키, 달리기: `Shift`, 카메라 45° 회전: `Q` / `E`, 모바일: 좌하단 조이스틱
- 여행 기록: `src/data/places.json` 의 `date`, `memo`, `photos` 를 채우면 장소 카드에 나온다. 사진은 `public/photos/` 에.
- 크기·속도·색상·카메라 값: `src/world/config.js`
- 캐릭터 외형: `src/character/characterConfig.js` (파츠 추가는 `src/character/parts/*.js` 에 스타일 함수 하나)
- 해안선 다시 만들기: `node scripts/buildCoastline.mjs <overpass.json>` (데이터 © OpenStreetMap contributors)

개발용 쿼리스트링

| 쿼리 | 기능 |
|---|---|
| `?debug=top` | 위에서 내려다보는 직교 카메라 |
| `?debug=collide` | 해안선·콜라이더·장소 반경 표시 |
| `?fps=1` | FPS 표시, 콘솔에서 `__islandLive` 로 위치 확인 |
| `?at=kabira` | 해당 장소 근처에서 시작 |
| `?cam=60` | 카메라 거리 덮어쓰기 |
| `?move=0,1,run` | 키 입력 없이 계속 이동 |
