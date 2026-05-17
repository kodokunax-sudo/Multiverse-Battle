// ========== АРЕНА UNDERTALE v5 — АТАКИ СО ВСЕХ СТОРОН ==========
let arenaActive = false;
let arenaBoss = null;
let arenaHP = 30;
let arenaMaxHP = 30;
let arenaInterval = null;
let arenaAttackInterval = null;
let arenaPhase = "dodge";
let arenaBossMaxHP = 1000;
let arenaAttackType = 0;
let arenaClickTargets = [];
let arenaClicksHit = 0;
let arenaTotalTargets = 8;
let arenaAttackTimeLeft = 2;
let heart = { x: 200, y: 400, size: 15 };
let attacks = [];
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
        let dx = mx - t.x, dy = my - t.y;
        if (Math.sqrt(dx*dx + dy*dy) < t.radius && !t.hit) {
            t.hit = true;
            arenaClicksHit++;
            break;
        }
    }
}

function calculateArenaHP() {
    let bonus = 0;
    team.forEach(idx => {
        let cd = myCards[idx];
        if (cd) bonus += Math.floor(cd.hp / 50);
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
    
    if (bossWave === 50) arenaAttackType = 0;
    else if (bossWave === 100) arenaAttackType = 1;
    else arenaAttackType = Math.random() < 0.5 ? 0 : 1;
    
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
    heart.x = 200; heart.y = 400;
    document.getElementById("arenaBossName").innerText = arenaBoss + " — УКЛОНЯЙСЯ!";
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    let intervalTime = arenaAttackType === 0 ? 700 : 350;
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive) spawnAttack();
    }, intervalTime);
    let dodgeTime = 10000 + Math.random() * 5000;
    setTimeout(() => {
        if (arenaPhase === "dodge" && arenaActive) startAttackPhase();
    }, dodgeTime);
}

function startAttackPhase() {
    arenaPhase = "attack";
    attacks = [];
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaTotalTargets = 8;
    arenaAttackTimeLeft = 2;
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    document.getElementById("arenaBossName").innerText = arenaBoss + " — БЕЙ! (" + arenaAttackTimeLeft + "с)";
    
    let usedPositions = [];
    for (let i = 0; i < arenaTotalTargets; i++) {
        let x, y, tooClose;
        let attempts = 0;
        do {
            x = 55 + Math.random() * 290;
            y = 100 + Math.random() * 330;
            tooClose = false;
            for (let p of usedPositions) {
                let dx = x - p.x, dy = y - p.y;
                if (Math.sqrt(dx*dx + dy*dy) < 55) { tooClose = true; break; }
            }
            attempts++;
        } while (tooClose && attempts < 50);
        usedPositions.push({x, y});
        arenaClickTargets.push({ x, y, radius: 24, hit: false });
    }
    
    let attackTimer = setInterval(() => {
        arenaAttackTimeLeft--;
        document.getElementById("arenaBossName").innerText = arenaBoss + " — БЕЙ! (" + arenaAttackTimeLeft + "с)";
        if (arenaAttackTimeLeft <= 0) {
            clearInterval(attackTimer);
            applyArenaDamage();
        }
    }, 1000);
    
    setTimeout(() => {
        if (arenaPhase === "attack" && arenaActive) applyArenaDamage();
    }, 2000);
}

function applyArenaDamage() {
    if (!arenaActive) return;
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
        if (arenaBossMaxHP <= 0) { winArena(); return; }
        arenaPhase = "dodge";
        startDodgePhase();
    }, 1000);
}

function spawnAttack() {
    if (arenaAttackType === 0) {
        // БЕЛЫЕ — предсказуемые, но покрывают весь экран
        let type = Math.floor(Math.random() * 4);
        if (type === 0) {
            // Слева направо — верх
            for (let i = 0; i < 6; i++) {
                attacks.push({ type: "square", x: -50 - i*70, y: 70 + i*70, size: 28, speed: 3, speedX: null });
            }
        } else if (type === 1) {
            // Справа налево — низ
            for (let i = 0; i < 6; i++) {
                attacks.push({ type: "square", x: 450 + i*70, y: 90 + i*65, size: 28, speed: -3, speedX: null });
            }
        } else if (type === 2) {
            // Сверху вниз — левая сторона
            for (let i = 0; i < 6; i++) {
                attacks.push({ type: "square", x: 25 + i*70, y: -40, size: 28, speed: null, speedX: 0, speedY: 2.5 });
            }
        } else {
            // Снизу вверх — правая сторона
            for (let i = 0; i < 6; i++) {
                attacks.push({ type: "square", x: 40 + i*65, y: 540, size: 28, speed: null, speedX: 0, speedY: -2.5 });
            }
        }
    } else {
        // СИНИЕ — быстрые со ВСЕХ сторон (летят по диагонали)
        let count = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) {
            let side = Math.floor(Math.random() * 4);
            let x, y, spX, spY;
            switch(side) {
                case 0: // Сверху
                    x = Math.random() * 380;
                    y = -40 - Math.random() * 100;
                    spX = (Math.random() - 0.5) * 3;
                    spY = 3 + Math.random() * 5;
                    break;
                case 1: // Снизу
                    x = Math.random() * 380;
                    y = 540 + Math.random() * 100;
                    spX = (Math.random() - 0.5) * 3;
                    spY = -(3 + Math.random() * 5);
                    break;
                case 2: // Слева
                    x = -40 - Math.random() * 100;
                    y = Math.random() * 460;
                    spX = 3 + Math.random() * 5;
                    spY = (Math.random() - 0.5) * 3;
                    break;
                case 3: // Справа
                    x = 440 + Math.random() * 100;
                    y = Math.random() * 460;
                    spX = -(3 + Math.random() * 5);
                    spY = (Math.random() - 0.5) * 3;
                    break;
            }
            attacks.push({ type: "square", x: x, y: y, size: 20 + Math.random() * 16, speed: null, speedX: spX, speedY: spY });
        }
    }
}

function stopArena() {
    arenaActive = false;
    if (arenaInterval) clearInterval(arenaInterval);
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaInterval = null; arenaAttackInterval = null;
    attacks = []; arenaClickTargets = [];
    document.getElementById("arenaOverlay").style.display = "none";
}

function winArena() {
    stopArena();
    alert("🎉 Ты победил босса!");
    if (currentEnemy) currentEnemy.hp = 0;
    victory();
}

function loseArena() {
    stopArena();
    playerHp = 0;
    defeat();
}

function renderArena() {
    if (!arenaActive || !ctx) return;
    
    ctx.clearRect(0, 0, 400, 500);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 400, 500);
    ctx.strokeStyle = arenaPhase === "attack" ? "#ff0" : "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 496);
    
    // HP игрока
    ctx.fillStyle = "#f00"; ctx.fillRect(10, 8, 380, 10);
    ctx.fillStyle = "#0f0"; ctx.fillRect(10, 8, 380 * (arenaHP / arenaMaxHP), 10);
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px Nunito, sans-serif";
    ctx.fillText("❤️ " + arenaHP + "/" + arenaMaxHP, 10, 32);
    
    // HP босса
    ctx.fillStyle = "#f00"; ctx.fillRect(10, 38, 380, 6);
    ctx.fillStyle = "#ff0";
    let maxHp = currentEnemy ? currentEnemy.maxHp : 1000;
    ctx.fillRect(10, 38, 380 * Math.max(0, arenaBossMaxHP / maxHp), 6);
    
    // Текст фазы
    ctx.fillStyle = "#fff"; ctx.font = "bold 15px Nunito, sans-serif";
    let phaseText = arenaPhase === "attack" ? "⚡ ЖМИ КРУГИ! (" + arenaClicksHit + "/8)" : "🛡️ Уклоняйся!";
    ctx.fillText(phaseText, 100, 68);
    
    if (arenaPhase === "dodge") {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            
            // Движение
            if (a.speedX !== null && a.speedX !== undefined) {
                a.x += a.speedX;
                a.y += a.speedY;
            } else if (a.speedY !== null && a.speedY !== undefined) {
                a.y += a.speedY;
            } else if (a.speed !== null && a.speed !== undefined) {
                a.x += a.speed;
            }
            
            // Столкновение
            let hit = (heart.x + heart.size > a.x && heart.x - heart.size < a.x + a.size &&
                       heart.y + heart.size > a.y && heart.y - heart.size < a.y + a.size);
            
            if (hit) {
                arenaHP -= 5;
                document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
                attacks.splice(i, 1);
                if (arenaHP <= 0) { loseArena(); return; }
                continue;
            }
            
            // Удаление за экраном
            if (a.x < -200 || a.x > 600 || a.y < -200 || a.y > 700) {
                attacks.splice(i, 1);
                continue;
            }
            
            // Отрисовка
            ctx.fillStyle = arenaAttackType === 0 ? "#ffffff" : "#4499ff";
            ctx.shadowBlur = 4; ctx.shadowColor = ctx.fillStyle;
            ctx.fillRect(a.x, a.y, a.size, a.size);
            ctx.shadowBlur = 0;
        }
        
        // Сердечко
        let hx = heart.x, hy = heart.y, s = heart.size;
        ctx.fillStyle = "#ff0000";
        ctx.shadowBlur = 8; ctx.shadowColor = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(hx, hy + s*0.3);
        ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
        ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.2);
        ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
        ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
        ctx.fill();
        ctx.strokeStyle = "#cc0000"; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    if (arenaPhase === "attack") {
        arenaClickTargets.forEach(t => {
            ctx.fillStyle = t.hit ? "rgba(0,255,0,0.5)" : "rgba(255,255,0,0.7)";
            ctx.shadowBlur = 10; ctx.shadowColor = t.hit ? "#0f0" : "#ff0";
            ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = t.hit ? "#0f0" : "#ff0"; ctx.lineWidth = 3; ctx.stroke();
            ctx.shadowBlur = 0;
            if (!t.hit) {
                ctx.fillStyle = "#000"; ctx.font = "bold 13px Nunito, sans-serif";
                ctx.fillText("ЖМИ", t.x-17, t.y+5);
            }
        });
    }
    
    requestAnimationFrame(renderArena);
}
