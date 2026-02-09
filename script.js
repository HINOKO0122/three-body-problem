class Body {
    constructor(x, y, vx, vy, mass, color) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.mass = mass;
        this.color = color;
        this.path = [];
    }

    draw(ctx) {
        // 軌跡を描画（path.shiftを無くしたのでずっと残ります）
        if (this.path.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4; // 軌跡を少し薄くして見やすく
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        // 本体
        ctx.beginPath();
        const radius = Math.max(4, Math.pow(this.mass, 1/3) * 1.5);
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

let bodies = [];
let isRunning = false;
const G = 5000; 
const dt = 0.005; // 刻みを小さく
const subSteps = 10; // 1フレームに10回計算して精度を高める

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth - 320;
    canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();

function createInputs() {
    const count = document.getElementById('bodyCount').value;
    const container = document.getElementById('bodyInputs');
    container.innerHTML = '';
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < count; i++) {
        const color = `hsl(${(i * 360) / count}, 70%, 60%)`;
        container.innerHTML += `
            <div class="body-config" style="border-left: 4px solid ${color}">
                <strong>物体 ${i + 1}</strong>
                <div class="input-row">座標X,Y: <input type="number" class="ix" value="${Math.round(cx + (i-1)*150)}"> <input type="number" class="iy" value="${Math.round(cy)}"></div>
                <div class="input-row">速度X,Y: <input type="number" class="ivx" step="0.1" value="0"> <input type="number" class="ivy" step="0.1" value="${i%2==0?10:-10}"></div>
                <div class="input-row">質量: <input type="number" class="im" value="100"></div>
                <input type="hidden" class="icolor" value="${color}">
            </div>`;
    }
}

function initSim() {
    bodies = [];
    document.querySelectorAll('.body-config').forEach(conf => {
        bodies.push(new Body(
            parseFloat(conf.querySelector('.ix').value),
            parseFloat(conf.querySelector('.iy').value),
            parseFloat(conf.querySelector('.ivx').value),
            parseFloat(conf.querySelector('.ivy').value),
            parseFloat(conf.querySelector('.im').value),
            conf.querySelector('.icolor').value
        ));
    });
}

function setPreset(type) {
    const cx = canvas.width / 2; const cy = canvas.height / 2;
    isRunning = false;
    if (type === '2body') {
        document.getElementById('bodyCount').value = 2;
        createInputs();
        const confs = document.querySelectorAll('.body-config');
        // 綺麗な円軌道に近い設定
        updateConf(confs[0], cx - 100, cy, 0, 11.2, 10);
        updateConf(confs[1], cx + 100, cy, 0, -11.2, 10);
    } else if (type === '3body_8') {
    document.getElementById('bodyCount').value = 3;
    createInputs();
    const confs = document.querySelectorAll('.body-config');
    
    // G=5000, 質量=200 の環境で安定しやすい8の字の比率
    const vx = 4.66;
    const vy = 5.34;
    const posX = 150; // 中央からの距離

    // 物体1: 左側（上へ飛ぶ）
    updateConf(confs[0], cx - posX, cy, vx, vy, 200);
    // 物体2: 右側（上へ飛ぶ）
    updateConf(confs[1], cx + posX, cy, vx, vy, 200);
    // 物体3: 中央（下へ2倍の速さで飛ぶ）
    updateConf(confs[2], cx, cy, -2 * vx, -2 * vy, 200);
}
    initSim();
}

function updateConf(el, x, y, vx, vy, m) {
    el.querySelector('.ix').value = Math.round(x); el.querySelector('.iy').value = Math.round(y);
    el.querySelector('.ivx').value = vx; el.querySelector('.ivy').value = vy;
    el.querySelector('.im').value = m;
}

function toggleSim() {
    if (!bodies.length) initSim();
    isRunning = !isRunning;
    document.getElementById('startBtn').innerText = isRunning ? "一時停止" : "再生";
}

function clearPaths() { 
    bodies.forEach(b => b.path = []); 
}

function loop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isRunning) {
        // サブステップ計算（1フレームの間に何度も回して精度を上げる）
        for (let s = 0; s < subSteps; s++) {
            // 1. 加速度を計算
            let accelerations = bodies.map(() => ({ ax: 0, ay: 0 }));
            for (let i = 0; i < bodies.length; i++) {
                for (let j = i + 1; j < bodies.length; j++) {
                    const b1 = bodies[i]; const b2 = bodies[j];
                    const dx = b2.x - b1.x, dy = b2.y - b1.y;
                    const distSq = dx * dx + dy * dy + 100; // softening
                    const dist = Math.sqrt(distSq);
                    const force = (G * b1.mass * b2.mass) / distSq;
                    const ax = (force * dx) / (dist * b1.mass);
                    const ay = (force * dy) / (dist * b1.mass);
                    accelerations[i].ax += ax;
                    accelerations[i].ay += ay;
                    accelerations[j].ax -= (force * dx) / (dist * b2.mass);
                    accelerations[j].ay -= (force * dy) / (dist * b2.mass);
                }
            }
            // 2. 速度と位置を更新
            bodies.forEach((b, i) => {
                b.vx += accelerations[i].ax * dt;
                b.vy += accelerations[i].ay * dt;
                b.x += b.vx * dt;
                b.y += b.vy * dt;
            });
        }
        // 軌跡を記録（1フレームに1回だけ記録）
        bodies.forEach(b => b.path.push({ x: b.x, y: b.y }));
    }

    bodies.forEach(b => b.draw(ctx));
    requestAnimationFrame(loop);
}

createInputs();
loop();
