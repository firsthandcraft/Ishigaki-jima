const drawIsland = (p) => {
    // 섬의 바닥을 위한 넓은 박스 (Island Base)
    p.translate(0, 150, -2);
    p.rotateX(p.HALF_PI);
    p.ambientMaterial(105, 189, 99); //색
    p.cylinder(200, 50);
    p.pop();
    p.push();

    //원기둥(작은거)
    p.translate(350, 20, 80); //왼오 위아래 앞뒤
    p.rotateX(p.PI-0.15);
    p.ambientMaterial(105, 189, 99); //색
    p.cylinder(80, 30);
    p.pop();
    p.push();

    // 산
    p.translate(50, 30, -80);
    p.rotateX(p.PI - 0.1);
    p.ambientMaterial(105, 189, 99); //색
    p.cone(450, 350);//원뿔
    p.pop();
    p.push();

    //원기둥(기본)
    p.translate(240, -10, 0);
    p.rotateX(p.PI-0.1);
    p.ambientMaterial(105, 189, 99); //색
    p.cone(100, 40);//원뿔
    p.pop();
    p.push();

    // 섬 이리오모테섬
    p.translate(-350, 110, 200);
    p.rotateX(p.PI -0.1);
    p.ambientMaterial(42, 180, 121);
    p.cone(400, 300);
    p.pop();
    p.push();
};

export default drawIsland;