class Body {
    constructor(x, y, vx, vy, mass, color) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.mass = mass;
        this.color = color;
        this.path = [];
    }

    draw(ctx) {
        // 軌跡
        if (this.path.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.moveTo(this.path[0].x, this.path[0].y);
            this.path.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        }
        // 本体
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.sqrt(this.mass) * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

let bodies = [];
let isRunning = false;
const G = 100;
const dt = 0.015;

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
    for (let i = 0; i < count; i++) {
        const color = `hsl(${(i * 360) / count}, 70%, 60%)`;
        container.innerHTML += `
            <div class="body-config" style="border-left: 4px solid ${color}">
                <strong>物体 ${i + 1}</strong>
                <div>座標: <input type="number" class="ix" value="${200+i*50}"> <input type="number" class="iy" value="${200+i*50}"></div>
                <div>速度: <input type="number" class="ivx" step="0.1" value="0"> <input type="number" class="ivy" step="0.1" value="2"></div>
                <input type="hidden" class="im" value="10"><input type="hidden" class="icolor" value="${color}">
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
            10, // 固定質量
            conf.querySelector('.icolor').value
        ));
    });
}

function setPreset(type) {
    const cx = canvas.width / 2; const cy = canvas.height / 2;
    if (type === '2body') {
        document.getElementById('bodyCount').value = 2;
        createInputs();
        const confs = document.querySelectorAll('.body-config');
        updateConf(confs[0], cx-100, cy, 0, 5);
        updateConf(confs[1], cx+100, cy, 0, -5);
    } else if (type === '3body_8') {
        document.getElementById('bodyCount').value = 3;
        createInputs();
        const confs = document.querySelectorAll('.body-config');
        updateConf(confs[0], cx-150, cy, 2.5, 3.5);
        updateConf(confs[1], cx+150, cy, 2.5, 3.5);
        updateConf(confs[2], cx, cy, -5, -7);
    }
    initSim();
}

function updateConf(el, x, y, vx, vy) {
    el.querySelector('.ix').value = Math.round(x); el.querySelector('.iy').value = Math.round(y);
    el.querySelector('.ivx').value = vx; el.querySelector('.ivy').value = vy;
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
        bodies.forEach((b1, i) => {
            bodies.forEach((b2, j) => {
                if (i === j) return;
                const dx = b2.x - b1.x, dy = b2.y - b1.y;
                const r = Math.sqrt(dx*dx + dy*dy) + 5;
                const f = (G * b2.mass) / (r*r);
                b1.vx += f * (dx/r) * dt; b1.vy += f * (dy/r) * dt;
            });
        });
        bodies.forEach(b => {
            b.x += b.vx; b.y += b.vy;
            b.path.push({x: b.x, y: b.y});
            if (b.path.length > 500) b.path.shift();
        });
    }
    bodies.forEach(b => b.draw(ctx));
    requestAnimationFrame(loop);
}

createInputs();
loop();
