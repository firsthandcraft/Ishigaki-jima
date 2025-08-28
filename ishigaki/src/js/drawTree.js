const drawPalmTree = (p) => {// 나무 기둥
    p.push();
    p.translate(0, 10, 60)
    p.fill(139, 69, 19); // 갈색

    p.cylinder(10, 120); // 기둥
    p.pop();

    // 잎사귀 5개
    for (let i = 0; i < 5; i++) {
        p.push();
        p.rotateZ((p.TWO_PI / 5) * i);
        p.translate(30, -30, 60);
        p.fill(34, 139, 34);
        p.ellipse(0, 0, 40, 10);
        p.pop();
    }


};
export default drawPalmTree;
