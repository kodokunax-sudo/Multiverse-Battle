// ========== АРЕНА UNDERTALE v6 — ДИНАМИЧНЫЙ ХАРДКОР ==========
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
let arenaParticles = [];
let arenaShake = 0;
let arenaHitFlash = 0;

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
            // Частицы при попадании
            for (let j = 0; j < 8; j++) {
                arenaParticles.push({
                    x: t.x, y: t.y,
                    vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
                    life: 20, color: "#0f0"
                });
            }
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
    arenaParticles = [];
    arenaShake = 0;
    arenaHitFlash = 0;
    heart.x = 200; heart.y = 400;
    
    let bt = bossTemplates[bossWave];
    arenaBoss = bt ? bt.name : "БОСС";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000;
    
    // Рандомный тип атаки
    arenaAttackType = Math.random() < 0.5 ? 0 : 1;
    
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
    let typeText = arenaAttackType === 0 ? "⬜ ОБЫЧНЫЕ" : "🔷 ХАОС";
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + typeText + " — УКЛОНЯЙСЯ!";
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    let intervalTime = arenaAttackType === 0 ? 600 : 500;
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive) spawnAttack();
    }, intervalTime);
    let dodgeTime = 8000 + Math.random() * 6000;
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
    document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
    
    let usedPositions = [];
    for (let i = 0; i < arenaTotalTargets; i++) {
        let x, y, tooClose, attempts = 0;
        do {
            x = 55 + Math.random() * 290;
            y = 100 + Math.random() * 330;
            tooClose = false;
            for (let p of usedPositions) {
                if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < 55) { tooClose = true; break; }
            }
            attempts++;
        } while (tooClose && attempts < 50);
        usedPositions.push({x, y});
        arenaClickTargets.push({ x, y, radius: 24, hit: false, pulse: 0 });
    }
    
    let attackTimer = setInterval(() => {
        arenaAttackTimeLeft--;
        document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
        if (arenaAttackTimeLeft <= 0) { clearInterval(attackTimer); applyArenaDamage(); }
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
        arenaShake = 15;
        for (let i = 0; i < 20; i++) {
            arenaParticles.push({
                x: 200, y: 250,
                vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                life: 30, color: Math.random() < 0.5 ? "#ff0" : "#f00"
            });
        }
        document.getElementById("arenaBossName").innerText = arenaBoss + " — 💥 -" + finalDmg + "!";
    } else {
        document.getElementById("arenaBossName").innerText = arenaBoss + " — 😞 Промах!";
    }
    
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) { winArena(); return; }
        // МЕНЯЕМ ТИП АТАКИ ПОСЛЕ КАЖДОГО УДАРА
        arenaAttackType = Math.random() < 0.5 ? 0 : 1;
        arenaPhase = "dodge";
        startDodgePhase();
    }, 1000);
}

function spawnAttack() {
    if (arenaAttackType === 0) {
        // БЕЛЫЕ — предсказуемые ряды со всех сторон
        let type = Math.floor(Math.random() * 4);
        if (type === 0) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: -50 - i*75, y: 60 + i*85, size: 26, speed: 3.5, speedX: null, speedY: null, glow: 0 });
            }
        } else if (type === 1) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 450 + i*75, y: 80 + i*80, size: 26, speed: -3.5, speedX: null, speedY: null, glow: 0 });
            }
        } else if (type === 2) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 30 + i*85, y: -40, size: 26, speed: null, speedX: 0, speedY: 3, glow: 0 });
            }
        } else {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 50 + i*80, y: 540, size: 26, speed: null, speedX: 0, speedY: -3, glow: 0 });
            }
        }
    } else {
        // СИНИЕ — меньше но быстрее, хаотичные (4-6 штук)
        let count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            let side = Math.floor(Math.random() * 4);
            let x, y, spX, spY;
            switch(side) {
                case 0: x = Math.random()*380; y = -50-Math.random()*60; spX = (Math.random()-0.5)*4; spY = 4+Math.random()*6; break;
                case 1: x = Math.random()*380; y = 550+Math.random()*60; spX = (Math.random()-0.5)*4; spY = -(4+Math.random()*6); break;
                case 2: x = -50-Math.random()*60; y = Math.random()*460; spX = 4+Math.random()*6; spY = (Math.random()-0.5)*4; break;
                case 3: x = 450+Math.random()*60; y = Math.random()*460; spX = -(4+Math.random()*6); spY = (Math.random()-0.5)*4; break;
            }
            attacks.push({ type: "square", x, y, size: 18+Math.random()*14, speed: null, speedX: spX, speedY: spY, glow: Math.random()*Math.PI*2 });
        }
    }
}

function stopArena() {
    arenaActive = false;
    if (arenaInterval) clearInterval(arenaInterval);
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaInterval = null; arenaAttackInterval = null;
    attacks = []; arenaClickTargets = []; arenaParticles = [];
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
    
    // Тряска
    let sx = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    let sy = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    if (arenaShake > 0) arenaShake *= 0.85;
    if (arenaHitFlash > 0) arenaHitFlash--;
    
    ctx.save();
    ctx.translate(sx, sy);
    
    ctx.clearRect(-10, -10, 420, 520);
    
    // Фон с сеткой
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, 400, 500);
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < 400; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 500); ctx.stroke(); }
    for (let gy = 0; gy < 500; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(400, gy); ctx.stroke(); }
    
    // Рамка
    let borderColor = arenaPhase === "attack" ? "#ffdd00" : (arenaAttackType === 0 ? "#ffffff" : "#4499ff");
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15; ctx.shadowColor = borderColor;
    ctx.strokeRect(2, 2, 396, 496);
    ctx.shadowBlur = 0;
    
    // Вспышка при попадании
    if (arenaHitFlash > 0) {
        ctx.fillStyle = "rgba(255,0,0," + (arenaHitFlash/15) + ")";
        ctx.fillRect(0, 0, 400, 500);
    }
    
    // HP игрока
    ctx.fillStyle = "#333"; ctx.fillRect(10, 8, 380, 10);
    let hpGrad = ctx.createLinearGradient(10, 0, 390, 0);
    hpGrad.addColorStop(0, "#ff0000"); hpGrad.addColorStop(0.5, "#ff8800"); hpGrad.addColorStop(1, "#00ff00");
    ctx.fillStyle = hpGrad;
    ctx.fillRect(10, 8, 380 * (arenaHP / arenaMaxHP), 10);
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px Nunito, sans-serif";
    ctx.fillText("❤️ " + arenaHP + "/" + arenaMaxHP, 10, 30);
    
    // HP босса
    ctx.fillStyle = "#333"; ctx.fillRect(10, 38, 380, 6);
    let maxHp = currentEnemy ? currentEnemy.maxHp : 1000;
    ctx.fillStyle = "#ff0";
    ctx.fillRect(10, 38, 380 * Math.max(0, arenaBossMaxHP / maxHp), 6);
    
    // Текст
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px Nunito, sans-serif";
    let phaseText = arenaPhase === "attack" ? "⚡ ЖМИ КРУГИ! (" + arenaClicksHit + "/8)" : "🛡️ Уклоняйся!";
    ctx.fillText(phaseText, 110, 66);
    
    if (arenaPhase === "dodge") {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            if (a.glow !== undefined) a.glow += 0.1;
            
            if (a.speedX !== null && a.speedX !== undefined) { a.x += a.speedX; a.y += a.speedY; }
            else if (a.speedY !== null && a.speedY !== undefined) { a.y += a.speedY; }
            else if (a.speed !== null && a.speed !== undefined) { a.x += a.speed; }
            
            let hit = (heart.x + heart.size > a.x && heart.x - heart.size < a.x + a.size &&
                       heart.y + heart.size > a.y && heart.y - heart.size < a.y + a.size);
            
            if (hit) {
                arenaHP -= 5;
                arenaHitFlash = 10;
                document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
                for (let j = 0; j < 6; j++) {
                    arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 15, color: "#f00" });
                }
                attacks.splice(i, 1);
                if (arenaHP <= 0) { loseArena(); ctx.restore(); return; }
                continue;
            }
            
            if (a.x < -200 || a.x > 600 || a.y < -200 || a.y > 700) { attacks.splice(i, 1); continue; }
            
            let col = arenaAttackType === 0 ? "#ffffff" : "#4499ff";
            ctx.fillStyle = col;
            ctx.shadowBlur = a.glow !== undefined ? 8 + Math.sin(a.glow)*4 : 8;
            ctx.shadowColor = col;
            ctx.fillRect(a.x, a.y, a.size, a.size);
            ctx.shadowBlur = 0;
        }
        
        // Сердечко с пульсацией
        let hx = heart.x, hy = heart.y, s = heart.size + Math.sin(Date.now()/200)*1.5;
        ctx.fillStyle = "#ff0000";
        ctx.shadowBlur = 15; ctx.shadowColor = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(hx, hy + s*0.3);
        ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
        ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.2);
        ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
        ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
        ctx.fill();
        ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Фаза атаки
    if (arenaPhase === "attack") {
        arenaClickTargets.forEach(t => {
            t.pulse = (t.pulse || 0) + 0.1;
            let r = t.radius + Math.sin(t.pulse)*3;
            ctx.fillStyle = t.hit ? "rgba(0,255,0,0.6)" : "rgba(255,255,0,0.8)";
            ctx.shadowBlur = t.hit ? 15 : 20;
            ctx.shadowColor = t.hit ? "#0f0" : "#ff0";
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = t.hit ? "#0f0" : "#ffaa00"; ctx.lineWidth = 3; ctx.stroke();
            ctx.shadowBlur = 0;
            if (!t.hit) {
                ctx.fillStyle = "#000"; ctx.font = "bold 12px Nunito, sans-serif";
                ctx.fillText("ЖМИ", t.x-15, t.y+5);
            }
        });
    }
    
    // Частицы
    for (let i = arenaParticles.length - 1; i >= 0; i--) {
        let p = arenaParticles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) { arenaParticles.splice(i, 1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life/30;
        ctx.fillRect(p.x-2, p.y-2, 4, 4);
    }
    ctx.globalAlpha = 1;
    
    ctx.restore();
    requestAnimationFrame(renderArena);
}
