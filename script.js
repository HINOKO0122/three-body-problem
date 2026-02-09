class Body {
    constructor(x, y, vx, vy, mass, color) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.mass = mass;
        this.color = color;
        this.path = [];
    }

    draw(ctx) {
        // 軌跡の描画
        if (this.path.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let p of this.path) ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        // 本体の描画（質量の3乗根に比例させて半径を決める）
        ctx.beginPath();
        const radius = Math.max(3, Math.pow(this.mass, 1/3) * 2);
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

let bodies = [];
let isRunning = false;
const G = 1000; // 重力定数
const dt = 0.01; // シミュレーション速度

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
                <div class="input-row">速度X,Y: <input type="number" class="ivx" step="0.5" value="0"> <input type="number" class="ivy" step="0.5" value="${i%2==0?10:-10}"></div>
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
        updateConf(confs[0], cx-100, cy, 0, 15, 500);
        updateConf(confs[1], cx+100, cy, 0, -15, 500);
    } else if (type === '3body_8') {
        document.getElementById('bodyCount').value = 3;
        createInputs();
        const confs = document.querySelectorAll('.body-config');
        // 近似的な8の字解の設定
        updateConf(confs[0], cx-100, cy, 5, 8, 200);
        updateConf(confs[1], cx+100, cy, 5, 8, 200);
        updateConf(confs[2], cx, cy, -10, -16, 200);
    }
    initSim();
    document.getElementById('startBtn').innerText = "再生";
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

function clearPaths() { bodies.forEach(b => b.path = []); }

function loop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isRunning) {
        // 重力計算（全物体ペア）
        for (let i = 0; i < bodies.length; i++) {
            let ax = 0, ay = 0;
            const b1 = bodies[i];
            for (let j = 0; j < bodies.length; j++) {
                if (i === j) continue;
                const b2 = bodies[j];
                const dx = b2.x - b1.x, dy = b2.y - b1.y;
                const rSq = dx*dx + dy*dy + 500; // 近接時の吹き飛び防止
                const r = Math.sqrt(rSq);
                const acc = (G * b2.mass) / rSq; // a = G*m/r^2
                ax += acc * (dx/r); ay += acc * (dy/r);
            }
            b1.vx += ax * dt; b1.vy += ay * dt;
        }
        // 更新
        bodies.forEach(b => {
            b.x += b.vx * dt * 10; b.y += b.vy * dt * 10;
            b.path.push({x: b.x, y: b.y});
            if (b.path.length > 600) b.path.shift();
        });
    }

    bodies.forEach(b => b.draw(ctx));
    requestAnimationFrame(loop);
}

createInputs();
loop();
