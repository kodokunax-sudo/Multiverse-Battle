// ========== АРЕНА UNDERTALE v3 ==========
let arenaActive = false;
let arenaBoss = null;
let arenaHP = 30; // Базовое HP
let arenaMaxHP = 30;
let arenaInterval = null;
let arenaAttackInterval = null;
let arenaPhase = "dodge"; // dodge или attack
let arenaBossMaxHP = 1000;
let arenaAttackType = 0; // 0 = белые (обычные), 1 = синие (быстрые рандомные)
let arenaClickTargets = []; // Круглые цели для фазы атаки
let arenaClicksHit = 0;
let arenaTotalTargets = 8;
let arenaAttackTimeLeft = 2;

// Сердечко
let heart = { x: 200, y: 400, size: 15 };

// Атаки
let attacks = [];

// Canvas
let canvas = null;
let ctx = null;

function initArena() {
    canvas = document.getElementById("arenaCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    
    canvas.addEventListener("mousemove", (e) => {
        if (!arenaActive || arenaPhase !== "dodge") return;
        let rect = canvas.getBoundingClientRect();
        heart.x = e.clientX - rect.left;
        heart.y = e.clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    canvas.addEventListener("touchmove", (e) => {
        if (!arenaActive || arenaPhase !== "dodge") return;
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
    
    canvas.addEventListener("click", (e) => {
        if (!arenaActive) return;
        if (arenaPhase === "attack") {
            let rect = canvas.getBoundingClientRect();
            let mx = e.clientX - rect.left;
            let my = e.clientY - rect.top;
            checkClickTarget(mx, my);
            return;
        }
    });
    
    canvas.addEventListener("touchstart", (e) => {
        if (!arenaActive) return;
        e.preventDefault();
        if (arenaPhase === "attack") {
            let rect = canvas.getBoundingClientRect();
            let mx = e.touches[0].clientX - rect.left;
            let my = e.touches[0].clientY - rect.top;
            checkClickTarget(mx, my);
            return;
        }
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
    });
}

function checkClickTarget(mx, my) {
    for (let i = arenaClickTargets.length - 1; i >= 0; i--) {
        let t = arenaClickTargets[i];
        let dx = mx - t.x;
        let dy = my - t.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < t.radius && !t.hit) {
            t.hit = true;
            arenaClicksHit++;
            break;
        }
    }
}

function calculateArenaHP() {
    // Базовое HP = 30
    // Каждая карта в команде добавляет: floor(HP_карты / 50)
    let bonus = 0;
    team.forEach(idx => {
        let cd = myCards[idx];
        if (cd) {
            bonus += Math.floor(cd.hp / 50);
        }
    });
    arenaMaxHP = 30 + bonus;
    arenaHP = arenaMaxHP;
}

function startArena(bossWave) {
    arenaActive = true;
    calculateArenaHP();
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaPhase = "dodge";
    attacks = [];
    heart.x = 200;
    heart.y = 400;
    
    let bt = bossTemplates[bossWave];
    arenaBoss = bt ? bt.name : "БОСС";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000;
    
    // Определяем тип атак босса
    if (bossWave === 50) {
        arenaAttackType = 0; // Белые — обычные
    } else if (bossWave === 100) {
        arenaAttackType = 1; // Синие — быстрые
    } else {
        arenaAttackType = Math.random() < 0.5 ? 0 : 1;
    }
    
    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = arenaHP;
    document.getElementById("arenaTimer").innerText = "∞";
    
    if (!ctx) initArena();
    
    startDodgePhase();
    requestAnimationFrame(renderArena);
}

function startDodgePhase() {
    arenaPhase = "dodge";
    attacks = [];
    heart.x = 200;
    heart.y = 400;
    document.getElementById("arenaBossName").innerText = arenaBoss + " — УКЛОНЯЙСЯ!";
    
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    
    let intervalTime = arenaAttackType === 0 ? 700 : 400; // Синие быстрее
    
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase !== "dodge" || !arenaActive) return;
        spawnAttack();
    }, intervalTime);
    
    // Через 10-15 секунд фаза атаки
    let dodgeTime = 8000 + Math.random() * 7000;
    setTimeout(() => {
        if (arenaPhase === "dodge" && arenaActive) {
            startAttackPhase();
        }
    }, dodgeTime);
}

function startAttackPhase() {
    arenaPhase = "attack";
    attacks = [];
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaTotalTargets = 8;
    arenaAttackTimeLeft = 2;
    
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaAttackInterval = null;
    
    document.getElementById("arenaBossName").innerText = arenaBoss + " — БЕЙ! (" + arenaAttackTimeLeft + "с)";
    
    // Создаём 8 целей в случайных местах
    for (let i = 0; i < arenaTotalTargets; i++) {
        arenaClickTargets.push({
            x: 40 + Math.random() * 320,
            y: 60 + Math.random() * 400,
            radius: 22,
            hit: false
        });
    }
    
    // Таймер обратного отсчёта
    let attackTimer = setInterval(() => {
        arenaAttackTimeLeft--;
        document.getElementById("arenaBossName").innerText = arenaBoss + " — БЕЙ! (" + arenaAttackTimeLeft + "с)";
        if (arenaAttackTimeLeft <= 0) {
            clearInterval(attackTimer);
            applyArenaDamage();
        }
    }, 1000);
    
    setTimeout(() => {
        if (arenaPhase === "attack" && arenaActive) {
            applyArenaDamage();
        }
    }, 2000);
}

function applyArenaDamage() {
    if (!arenaActive) return;
    
    // Расчёт урона по количеству нажатых целей
    let dmgMult = 0;
    if (arenaClicksHit >= 8) dmgMult = 2.0;
    else if (arenaClicksHit >= 4) dmgMult = 1.0;
    else if (arenaClicksHit >= 1) dmgMult = 0.5;
    
    let baseDmg = window.playerFinalDamage || 10;
    let finalDmg = Math.floor(baseDmg * dmgMult);
    
    if (finalDmg > 0) {
        arenaBossMaxHP -= finalDmg;
        document.getElementById("arenaBossName").innerText = arenaBoss + " — 💥 -" + finalDmg + "!";
    } else {
        document.getElementById("arenaBossName").innerText = arenaBoss + " — 😞 Промах!";
    }
    
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) {
            winArena();
            return;
        }
        arenaPhase = "dodge";
        startDodgePhase();
    }, 1000);
}

function spawnAttack() {
    if (arenaAttackType === 0) {
        // Белые атаки — предсказуемые, одинаковые
        let type = Math.floor(Math.random() * 2);
        if (type === 0) {
            // Ровный ряд квадратов слева направо
            for (let i = 0; i < 5; i++) {
                attacks.push({
                    type: "square",
                    x: -30 - i * 50,
                    y: 80 + i * 85,
                    size: 25,
                    speed: 3
                });
            }
        } else {
            // Ровный ряд квадратов справа налево
            for (let i = 0; i < 5; i++) {
                attacks.push({
                    type: "square",
                    x: 430 + i * 50,
                    y: 60 + i * 90,
                    size: 25,
                    speed: -3
                });
            }
        }
    } else {
        // Синие атаки — быстрые, рандомные
        for (let i = 0; i < 4; i++) {
            attacks.push({
                type: "square",
                x: Math.random() * 400,
                y: -30 - Math.random() * 100,
                size: 20 + Math.random() * 15,
                speed: 3 + Math.random() * 5
            });
        }
        for (let i = 0; i < 4; i++) {
            attacks.push({
                type: "square",
                x: Math.random() * 400,
                y: 530 + Math.random() * 100,
                size: 20 + Math.random() * 15,
                speed: -(3 + Math.random() * 5)
            });
        }
    }
}

function stopArena() {
    arenaActive = false;
    if (arenaInterval) clearInterval(arenaInterval);
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaInterval = null;
    arenaAttackInterval = null;
    attacks = [];
    arenaClickTargets = [];
    document.getElementById("arenaOverlay").style.display = "none";
}

function winArena() {
    stopArena();
    alert("🎉 Ты победил босса!");
    if (currentEnemy) {
        currentEnemy.hp = 0;
    }
    victory();
}

function loseArena() {
    stopArena();
    playerHp = 0;
    defeat();
}

function renderArena() {
    if (!arenaActive) return;
    if (!ctx) return;
    
    ctx.clearRect(0, 0, 400, 500);
    
    // Фон
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 400, 500);
    ctx.strokeStyle = arenaPhase === "attack" ? "#ff0" : "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 496);
    
    // HP игрока
    ctx.fillStyle = "#f00";
    ctx.fillRect(10, 5, 380, 8);
    ctx.fillStyle = "#0f0";
    ctx.fillRect(10, 5, 380 * (arenaHP / arenaMaxHP), 8);
    ctx.fillStyle = "#fff";
    ctx.font = "10px Nunito, sans-serif";
    ctx.fillText("❤️ " + arenaHP + "/" + arenaMaxHP, 10, 25);
    
    // HP босса
    ctx.fillStyle = "#f00";
    ctx.fillRect(10, 30, 380, 6);
    ctx.fillStyle = "#ff0";
    let hpP = Math.max(0, arenaBossMaxHP / (currentEnemy ? currentEnemy.maxHp : 1000));
    ctx.fillRect(10, 30, 380 * hpP, 6);
    
    // Текст фазы
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Nunito, sans-serif";
    ctx.fillText(arenaPhase === "attack" ? "⚡ ЖМИ НА КРУГИ! (" + arenaClicksHit + "/8)" : "🛡️ Уклоняйся!", 130, 55);
    
    if (arenaPhase === "dodge") {
        // Атаки
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            a.x += a.speed;
            
            // Столкновение
            let hit = (heart.x + heart.size > a.x && heart.x - heart.size < a.x + a.size &&
                       heart.y + heart.size > a.y && heart.y - heart.size < a.y + a.size);
            
            if (hit) {
                arenaHP -= 5;
                document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
                attacks.splice(i, 1);
                if (arenaHP <= 0) {
                    loseArena();
                    return;
                }
                continue;
            }
            
            // Удаление за экраном
            if (a.x < -100 || a.x > 500) {
                attacks.splice(i, 1);
                continue;
            }
            
            // Отрисовка
            ctx.fillStyle = arenaAttackType === 0 ? "#fff" : "#4488ff";
            ctx.shadowBlur = 3;
            ctx.shadowColor = arenaAttackType === 0 ? "#fff" : "#4488ff";
            ctx.fillRect(a.x, a.y, a.size, a.size);
            ctx.shadowBlur = 0;
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
    }
    
    // Фаза атаки — рисуем цели
    if (arenaPhase === "attack") {
        arenaClickTargets.forEach(t => {
            ctx.fillStyle = t.hit ? "rgba(0,255,0,0.4)" : "rgba(255,255,0,0.6)";
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.radius, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = t.hit ? "#0f0" : "#ff0";
            ctx.lineWidth = 2;
            ctx.stroke();
            if (!t.hit) {
                ctx.fillStyle = "#000";
                ctx.font = "bold 12px Nunito, sans-serif";
                ctx.fillText("ЖМИ", t.x - 15, t.y + 4);
            }
        });
    }
    
    requestAnimationFrame(renderArena);
}
