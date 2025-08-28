const drawFish = (p) => {
    p.push();
    p.rotateY(p.HALF_PI);     // 물고기 방향 조정

    // 니모 몸통 (둥글게)
    p.fill(255, 100, 0); // 주황색 (니모 색깔)
    p.sphere(25);        // 반지름 25의 구체 (더 둥글게)

    // 니모 줄무늬 (얇은 띠 형태로 표현)
    p.push();
    p.fill(255); // 흰색
    p.rotateY(p.HALF_PI / 2); // 줄무늬를 대각선으로
    p.box(50, 50, 5); // 얇은 상자로 줄무늬 표현
    p.pop();

    p.push();
    p.fill(255); // 흰색
    p.rotateY(-p.HALF_PI / 2); // 다른 대각선 줄무늬
    
    p.box(50, 50, 5);
    p.pop();
    // 눈 (양옆에 배치)
    // 오른쪽 눈
    p.push();
    p.translate(0, 5, 20); // 몸통의 위쪽 앞부분 오른쪽으로 이동 (z축은 물고기 앞)
    p.fill(0); // 검은색
    p.sphere(5); // 작은 구체로 눈 표현
    p.pop();
    // 왼쪽 눈
    p.push();
    p.translate(0, 5, -20); // 몸통의 위쪽 앞부분 왼쪽으로 이동 (z축은 물고기 앞)
    p.fill(0); // 검은색
    p.sphere(5); // 작은 구체로 눈 표현
    p.pop();
    // 꼬리 (원뿔)
    p.push();
    p.translate(30, 0, 0); // 몸통 뒤쪽으로 이동
    p.rotateY(p.HALF_PI); // 꼬리 방향 조정
    p.fill(255, 100, 0); // 니모 색깔
    p.cone(15, 30); // 원뿔 모양 꼬리
    p.pop();
    p.pop(); // drawFish 전체 transform 해제
};

export default drawFish;