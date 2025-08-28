// drawSea.js
const drawSea = (p) => {
    let waveOffset = 0;
    p.push();
    p.rotateX(p.HALF_PI- 0.2); // 바다를 수평으로 회전
        waveOffset += 0.05;
            p.push();
            for (let x =  -1300; x < 1300; x += 50) {
                for (let y = -800; y < 800; y += 50) {
                const z = Math.sin(p.frameCount * 0.02 + (x + y) * 0.01) * 10;
                p.push();
                p.translate(x, y, z);
                p.fill(0, 119, 255);
                p.plane(50, 50);
                p.pop();
                }
            }        
    p.pop();
};

export default drawSea;