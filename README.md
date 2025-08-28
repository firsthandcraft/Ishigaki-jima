

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