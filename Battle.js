// ========== АРЕНА UNDERTALE ==========
let arenaActive = false;
let arenaBoss = null;
let arenaHP = 100;
let arenaTimer = 30;
let arenaInterval = null;
let arenaAttackInterval = null;

// Сердечко
let heart = { x: 200, y: 400, size: 15, speed: 5 };

// Атаки
let attacks = [];

// Canvas
let canvas = null;
let ctx = null;

function initArena() {
    canvas = document.getElementById("arenaCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    
    // Отслеживание мыши
    canvas.addEventListener("mousemove", (e) => {
        if (!arenaActive) return;
        let rect = canvas.getBoundingClientRect();
        heart.x = e.clientX - rect.left;
        heart.y = e.clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    // Отслеживание касаний
    canvas.addEventListener("touchmove", (e) => {
        if (!arenaActive) return;
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    canvas.addEventListener("touchstart", (e) => {
        if (!arenaActive) return;
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
}

function startArena(bossWave) {
    arenaActive = true;
    arenaHP = 100;
    arenaTimer = 30;
    attacks = [];
    heart.x = 200;
    heart.y = 400;
    
    let bt = bossTemplates[bossWave];
    arenaBoss = bt ? bt.name : "БОСС";
    
    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = arenaHP;
    document.getElementById("arenaTimer").innerText = arenaTimer;
    
    if (!ctx) initArena();
    
    arenaInterval = setInterval(() => {
        arenaTimer--;
        document.getElementById("arenaTimer").innerText = arenaTimer;
        if (arenaTimer <= 0) {
            winArena();
        }
    }, 1000);
    
    // Атаки в зависимости от босса
    if (bossWave === 50) {
        arenaAttackInterval = setInterval(() => { spawnRandomAttack(); }, 800);
    } else if (bossWave === 100) {
        arenaAttackInterval = setInterval(() => { spawnRandomAttack(); if (Math.random() < 0.4) spawnRandomAttack(); }, 600);
    } else if (bossWave === 200) {
        arenaAttackInterval = setInterval(() => { spawnRandomAttack(); spawnRandomAttack(); }, 700);
    } else {
        arenaAttackInterval = setInterval(() => { spawnRandomAttack(); }, 800);
    }
    
    requestAnimationFrame(renderArena);
}

function stopArena() {
    arenaActive = false;
    if (arenaInterval) clearInterval(arenaInterval);
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaInterval = null;
    arenaAttackInterval = null;
    attacks = [];
    document.getElementById("arenaOverlay").style.display = "none";
}

function winArena() {
    stopArena();
    if (currentEnemy) {
        currentEnemy.hp = 0;
        victory();
    }
}

function loseArena() {
    stopArena();
    playerHp = Math.max(0, playerHp - 50);
    if (playerHp <= 0) {
        defeat();
    } else {
        updatePlayerStats();
        renderEnemy();
    }
}

function spawnRandomAttack() {
    let type = Math.floor(Math.random() * 3);
    switch(type) {
        case 0:
            attacks.push({ type: "circle", x: Math.random() * 370 + 15, y: 0, radius: 20, speed: 3 + Math.random() * 3 });
            break;
        case 1:
            attacks.push({ type: "bar", x: Math.random() < 0.5 ? 0 : 400, y: Math.random() * 450 + 25, width: 60, height: 15, speed: 4 });
            break;
        case 2:
            attacks.push({ type: "wave", x: Math.random() * 400, y: 500, width: 50, height: 20, speed: 2 + Math.random() * 2 });
            break;
    }
}

function renderArena() {
    if (!arenaActive) return;
    if (!ctx) return;
    
    ctx.clearRect(0, 0, 400, 500);
    
    // Фон арены
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 400, 500);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 496);
    
    // Атаки
    for (let i = attacks.length - 1; i >= 0; i--) {
        let a = attacks[i];
        
        if (a.type === "circle") a.y += a.speed;
        else if (a.type === "bar") a.x += (a.x < 200 ? a.speed : -a.speed);
        else if (a.type === "wave") a.y -= a.speed;
        
        let hit = false;
        if (a.type === "circle") {
            let dx = heart.x - a.x, dy = heart.y - a.y;
            hit = Math.sqrt(dx*dx + dy*dy) < (heart.size + a.radius);
        } else {
            hit = (heart.x + heart.size > a.x && heart.x - heart.size < a.x + a.width &&
                   heart.y + heart.size > a.y && heart.y - heart.size < a.y + a.height);
        }
        
        if (hit) {
            arenaHP -= 10;
            document.getElementById("arenaHP").innerText = arenaHP;
            attacks.splice(i, 1);
            if (arenaHP <= 0) { loseArena(); return; }
            continue;
        }
        
        if (a.y > 550 || a.y < -50 || a.x < -100 || a.x > 500) {
            attacks.splice(i, 1);
            continue;
        }
        
        ctx.fillStyle = a.type === "wave" ? "#00bfff" : "#fff";
        if (a.type === "circle") {
            ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillRect(a.x, a.y, a.width, a.height);
        }
    }
    
    // Сердечко
    let hx = heart.x, hy = heart.y, s = heart.size;
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.moveTo(hx, hy + s*0.3);
    ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
    ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.2);
    ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
    ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
    ctx.fill();
    ctx.strokeStyle = "#cc0000"; ctx.lineWidth = 2; ctx.stroke();
    
    // Подсказка
    ctx.fillStyle = "#aaa";
    ctx.font = "12px Nunito, sans-serif";
    ctx.fillText("Уклоняйся 30 сек!", 10, 490);
    
    requestAnimationFrame(renderArena);
}
