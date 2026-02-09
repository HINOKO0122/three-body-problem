// 物体のクラス定義
class Body {
    x: number; y: number;       // 座標
    vx: number; vy: number;     // 速度
    mass: number;               // 質量
    color: string;              // 色
    path: {x: number, y: number}[]; // 軌跡データ

    constructor(x: number, y: number, vx: number, vy: number, mass: number, color: string) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.mass = mass;
        this.color = color;
        this.path = [];
    }

    draw(ctx: CanvasRenderingContext2D) {
        // 軌跡の描画
        if (this.path.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let p of this.path) ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }

        // 本体の描画
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.sqrt(this.mass) * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// グローバル変数
let bodies: Body[] = [];
let isRunning = false;
const G = 1; // 重力定数（シミュレーション用調整値）
const dt = 0.05; // 時間刻み

const canvas = document.getElementById('simCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const bodyInputs = document.getElementById('bodyInputs')!;

// キャンバスのリサイズ
function resize() {
    canvas.width = window.innerWidth - 350;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// UI生成
function createInputs() {
    const count = parseInt((document.getElementById('bodyCount') as HTMLInputElement).value);
    bodyInputs.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const color = `hsl(${(i * 360) / count}, 70%, 60%)`;
        bodyInputs.innerHTML += `
            <div class="body-config" style="border-left: 5px solid ${color}">
                <h4>物体 ${i + 1}</h4>
                <label>初期位置 (x, y):</label>
                <input type="number" class="ix" value="${200 + i * 50}">
                <input type="number" class="iy" value="${200 + i * 50}">
                <label>初速 (vx, vy):</label>
                <input type="number" class="ivx" value="${(Math.random()-0.5)*2}">
                <input type="number" class="ivy" value="${(Math.random()-0.5)*2}">
                <label>質量:</label>
                <input type="number" class="im" value="10">
                <input type="hidden" class="icolor" value="${color}">
            </div>
        `;
    }
}

// シミュレーション初期化
function initSim() {
    bodies = [];
    const configs = document.querySelectorAll('.body-config');
    configs.forEach(conf => {
        const x = parseFloat((conf.querySelector('.ix') as HTMLInputElement).value);
        const y = parseFloat((conf.querySelector('.iy') as HTMLInputElement).value);
        const vx = parseFloat((conf.querySelector('.ivx') as HTMLInputElement).value);
        const vy = parseFloat((conf.querySelector('.ivy') as HTMLInputElement).value);
        const m = parseFloat((conf.querySelector('.im') as HTMLInputElement).value);
        const c = (conf.querySelector('.icolor') as HTMLInputElement).value;
        bodies.push(new Body(x, y, vx, vy, m, c));
    });
}

// 物理演算ループ
function update() {
    if (!isRunning) return;

    for (let i = 0; i < bodies.length; i++) {
        let fx = 0; let fy = 0;
        const b1 = bodies[i];

        for (let j = 0; j < bodies.length; j++) {
            if (i === j) continue;
            const b2 = bodies[j];
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distSq = dx * dx + dy * dy + 0.1; // 衝突時の発散防止(softening)
            const dist = Math.sqrt(distSq);
            const force = (G * b1.mass * b2.mass) / distSq;
            
            fx += force * (dx / dist);
            fy += force * (dy / dist);
        }

        // 加速度 a = F / m より速度を更新
        b1.vx += (fx / b1.mass) * dt;
        b1.vy += (fy / b1.mass) * dt;
    }

    // 位置の更新と軌跡の保存
    bodies.forEach(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.path.push({x: b.x, y: b.y});
        if (b.path.length > 500) b.path.shift(); // 軌跡の長さを制限
    });
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    bodies.forEach(b => b.draw(ctx));
    requestAnimationFrame(loop);
}

// イベントリスナー
document.getElementById('setupBtn')!.onclick = createInputs;
document.getElementById('startBtn')!.onclick = () => {
    if (bodies.length === 0) initSim();
    isRunning = !isRunning;
};
document.getElementById('resetBtn')!.onclick = () => {
    isRunning = false;
    initSim();
};

// 初期実行
createInputs();
loop();
