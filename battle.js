// ========== АРЕНА UNDERTALE v8 — КНОПКА НАЧАТЬ БОЙ, УЛУЧШЕННАЯ ГРАФИКА ==========
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
let arenaBgStars = [];
let arenaBgTime = 0;
let arenaTrail = [];
let arenaComboText = "";
let arenaComboTimer = 0;

function initArena() {
    canvas = document.getElementById("arenaCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    
    for (let i = 0; i < 100; i++) {
        arenaBgStars.push({
            x: Math.random() * 400,
            y: Math.random() * 500,
            size: Math.random() * 2.5 + 0.5,
            speed: Math.random() * 0.8 + 0.1,
            twinkle: Math.random() * Math.PI * 2,
            color: Math.random() < 0.3 ? "#ffddff" : (Math.random() < 0.5 ? "#ddddff" : "#ffffff")
        });
    }
    
    canvas.addEventListener("mousemove", (e) => {
        if (!arenaActive || arenaPhase !== "dodge") return;
        let rect = canvas.getBoundingClientRect();
        heart.x = e.clientX - rect.left;
        heart.y = e.clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
        // Шлейф
        arenaTrail.push({ x: heart.x, y: heart.y, life: 8 });
        if (arenaTrail.length > 20) arenaTrail.shift();
    });
    
    canvas.addEventListener("touchmove", (e) => {
        if (!arenaActive || arenaPhase !== "dodge") return;
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        heart.x = e.touches[0].clientX - rect.left;
        heart.y = e.touches[0].clientY - rect.top;
        heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
        heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
        arenaTrail.push({ x: heart.x, y: heart.y, life: 8 });
        if (arenaTrail.length > 20) arenaTrail.shift();
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
            for (let j = 0; j < 15; j++) {
                arenaParticles.push({
                    x: t.x, y: t.y,
                    vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                    life: 30, color: "#0f0", size: Math.random()*5+2
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

// ЗАПУСК АРЕНЫ (вызывается по кнопке)
function startArena(bossWave) {
    arenaActive = true;
    calculateArenaHP();
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaPhase = "dodge";
    attacks = [];
    arenaParticles = [];
    arenaTrail = [];
    arenaShake = 0;
    arenaHitFlash = 0;
    arenaComboText = "";
    arenaComboTimer = 0;
    heart.x = 200; heart.y = 400;
    
    let bt = bossTemplates[bossWave];
    arenaBoss = bt ? bt.name : "БОСС";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000;
    
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
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + typeText;
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    let intervalTime = arenaAttackType === 0 ? 600 : 450;
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive) spawnAttack();
    }, intervalTime);
    let dodgeTime = 8000 + Math.random() * 5000;
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
            x = 50 + Math.random() * 300;
            y = 100 + Math.random() * 330;
            tooClose = false;
            for (let p of usedPositions) {
                if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < 50) { tooClose = true; break; }
            }
            attempts++;
        } while (tooClose && attempts < 50);
        usedPositions.push({x, y});
        arenaClickTargets.push({ x, y, radius: 24, hit: false, pulse: Math.random()*Math.PI*2 });
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
    if (arenaClicksHit >= 8) { dmgMult = 2.0; arenaComboText = "ОТЛИЧНО! x2"; }
    else if (arenaClicksHit >= 4) { dmgMult = 1.0; arenaComboText = "ХОРОШО! x1"; }
    else if (arenaClicksHit >= 1) { dmgMult = 0.5; arenaComboText = "СЛАБО... x0.5"; }
    else { arenaComboText = "ПРОМАХ!"; }
    arenaComboTimer = 60;
    
    let baseDmg = window.playerFinalDamage || 10;
    let finalDmg = Math.floor(baseDmg * dmgMult);
    
    if (finalDmg > 0) {
        arenaBossMaxHP -= finalDmg;
        arenaShake = 25;
        for (let i = 0; i < 40; i++) {
            arenaParticles.push({
                x: 200, y: 250,
                vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15,
                life: 40, color: Math.random() < 0.5 ? "#ff0" : "#f80", size: Math.random()*6+3
            });
        }
    }
    
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) { winArena(); return; }
        arenaAttackType = Math.random() < 0.5 ? 0 : 1;
        arenaPhase = "dodge";
        startDodgePhase();
    }, 1500);
}

function spawnAttack() {
    if (arenaAttackType === 0) {
        let type = Math.floor(Math.random() * 4);
        if (type === 0) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: -50 - i*80, y: 50 + i*90, size: 28, speed: 3.5, speedX: null, speedY: null, glow: Math.random()*Math.PI*2, rot: 0 });
            }
        } else if (type === 1) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 450 + i*80, y: 70 + i*85, size: 28, speed: -3.5, speedX: null, speedY: null, glow: Math.random()*Math.PI*2, rot: 0 });
            }
        } else if (type === 2) {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 25 + i*90, y: -40, size: 28, speed: null, speedX: 0, speedY: 3, glow: Math.random()*Math.PI*2, rot: 0 });
            }
        } else {
            for (let i = 0; i < 5; i++) {
                attacks.push({ type: "square", x: 40 + i*85, y: 540, size: 28, speed: null, speedX: 0, speedY: -3, glow: Math.random()*Math.PI*2, rot: 0 });
            }
        }
    } else {
        let count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            let side = Math.floor(Math.random() * 4);
            let x, y, spX, spY;
            switch(side) {
                case 0: x = Math.random()*380; y = -50-Math.random()*80; spX = (Math.random()-0.5)*5; spY = 4+Math.random()*7; break;
                case 1: x = Math.random()*380; y = 550+Math.random()*80; spX = (Math.random()-0.5)*5; spY = -(4+Math.random()*7); break;
                case 2: x = -50-Math.random()*80; y = Math.random()*460; spX = 4+Math.random()*7; spY = (Math.random()-0.5)*5; break;
                case 3: x = 450+Math.random()*80; y = Math.random()*460; spX = -(4+Math.random()*7); spY = (Math.random()-0.5)*5; break;
            }
            attacks.push({ type: "square", x, y, size: 16+Math.random()*16, speed: null, speedX: spX, speedY: spY, glow: Math.random()*Math.PI*2, rot: Math.random()*0.5-0.25 });
        }
    }
}

function stopArena() {
    arenaActive = false;
    if (arenaInterval) clearInterval(arenaInterval);
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    arenaInterval = null; arenaAttackInterval = null;
    attacks = []; arenaClickTargets = []; arenaParticles = []; arenaTrail = [];
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
    
    let sx = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    let sy = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    if (arenaShake > 0) arenaShake *= 0.85;
    if (arenaHitFlash > 0) arenaHitFlash--;
    if (arenaComboTimer > 0) arenaComboTimer--;
    arenaBgTime += 0.016;
    
    ctx.save();
    ctx.translate(sx, sy);
    
    ctx.clearRect(-15, -15, 430, 530);
    
    // Космический фон
    let bgGrad = ctx.createRadialGradient(200, 250, 30, 200, 250, 420);
    bgGrad.addColorStop(0, "#1a1a4e");
    bgGrad.addColorStop(0.5, "#0a0a2a");
    bgGrad.addColorStop(1, "#020210");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 500);
    
    // Туманность
    ctx.fillStyle = "rgba(100,50,150,0.03)";
    ctx.beginPath(); ctx.arc(100+Math.sin(arenaBgTime*0.3)*50, 150+Math.cos(arenaBgTime*0.4)*40, 120, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(50,100,200,0.03)";
    ctx.beginPath(); ctx.arc(300+Math.cos(arenaBgTime*0.5)*60, 350+Math.sin(arenaBgTime*0.3)*50, 140, 0, Math.PI*2); ctx.fill();
    
    // Звёзды
    arenaBgStars.forEach(star => {
        star.twinkle += star.speed * 0.05;
        let alpha = 0.2 + Math.sin(star.twinkle) * 0.5;
        ctx.fillStyle = star.color.replace(")", "," + alpha + ")").replace("rgb", "rgba");
        if (star.color === "#ffffff") ctx.fillStyle = "rgba(255,255,255," + alpha + ")";
        if (star.color === "#ddddff") ctx.fillStyle = "rgba(221,221,255," + alpha + ")";
        if (star.color === "#ffddff") ctx.fillStyle = "rgba(255,221,255," + alpha + ")";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
        ctx.fill();
        // Крестик у ярких звёзд
        if (star.size > 1.8 && alpha > 0.6) {
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(star.x-star.size*2, star.y); ctx.lineTo(star.x+star.size*2, star.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(star.x, star.y-star.size*2); ctx.lineTo(star.x, star.y+star.size*2); ctx.stroke();
        }
    });
    
    // Сетка
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < 400; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 500); ctx.stroke(); }
    for (let gy = 0; gy < 500; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(400, gy); ctx.stroke(); }
    
    // Рамка с двойным свечением
    let borderColor = arenaPhase === "attack" ? "#ffdd00" : (arenaAttackType === 0 ? "#ffffff" : "#4499ff");
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 25; ctx.shadowColor = borderColor;
    ctx.strokeRect(2, 2, 396, 496);
    ctx.shadowBlur = 8; ctx.shadowColor = borderColor;
    ctx.strokeRect(2, 2, 396, 496);
    ctx.shadowBlur = 0;
    
    // Вспышка
    if (arenaHitFlash > 0) {
        ctx.fillStyle = "rgba(255,50,50," + (arenaHitFlash/15) + ")";
        ctx.fillRect(0, 0, 400, 500);
    }
    
    // HP игрока
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.roundRect(8, 6, 384, 30, 8); ctx.fill();
    ctx.fillStyle = "#300"; ctx.roundRect(14, 12, 372, 8, 4); ctx.fill();
    let hpGrad = ctx.createLinearGradient(14, 0, 386, 0);
    hpGrad.addColorStop(0, "#ff0000"); hpGrad.addColorStop(0.3, "#ff6600"); hpGrad.addColorStop(0.6, "#ffcc00"); hpGrad.addColorStop(1, "#00ff00");
    ctx.fillStyle = hpGrad;
    ctx.roundRect(14, 12, 372 * (arenaHP / arenaMaxHP), 8, 4); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px Nunito, sans-serif";
    ctx.fillText("❤️ " + arenaHP + "/" + arenaMaxHP, 16, 32);
    
    // HP босса
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.roundRect(8, 40, 384, 18, 8); ctx.fill();
    ctx.fillStyle = "#300"; ctx.roundRect(14, 46, 372, 5, 3); ctx.fill();
    let maxHp = currentEnemy ? currentEnemy.maxHp : 1000;
    let bossGrad = ctx.createLinearGradient(14, 0, 386, 0);
    bossGrad.addColorStop(0, "#ff0000"); bossGrad.addColorStop(0.5, "#ff8800"); bossGrad.addColorStop(1, "#ff0000");
    ctx.fillStyle = bossGrad;
    ctx.roundRect(14, 46, 372 * Math.max(0, arenaBossMaxHP / maxHp), 5, 3); ctx.fill();
    ctx.fillStyle = "#ccc"; ctx.font = "bold 8px Nunito, sans-serif";
    ctx.fillText("👾 " + arenaBoss, 16, 56);
    
    // Текст фазы
    ctx.fillStyle = "#fff"; ctx.font = "bold 13px Nunito, sans-serif";
    let phaseText = arenaPhase === "attack" ? "⚡ ЖМИ КРУГИ! (" + arenaClicksHit + "/8)" : "🛡️ Уклоняйся!";
    ctx.fillText(phaseText, 115, 78);
    
    // Комбо текст
    if (arenaComboTimer > 0 && arenaComboText) {
        let alpha = Math.min(1, arenaComboTimer/30);
        ctx.fillStyle = "rgba(255,255,0," + alpha + ")";
        ctx.font = "bold 28px Nunito, sans-serif";
        ctx.fillText(arenaComboText, 100, 280);
    }
    
    if (arenaPhase === "dodge") {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            if (a.glow !== undefined) a.glow += 0.12;
            if (a.rot !== undefined) a.rot += 0.02;
            
            if (a.speedX !== null && a.speedX !== undefined) { a.x += a.speedX; a.y += a.speedY; }
            else if (a.speedY !== null && a.speedY !== undefined) { a.y += a.speedY; }
            else if (a.speed !== null && a.speed !== undefined) { a.x += a.speed; }
            
            let hit = (heart.x + heart.size > a.x && heart.x - heart.size < a.x + a.size &&
                       heart.y + heart.size > a.y && heart.y - heart.size < a.y + a.size);
            
            if (hit) {
                arenaHP -= 5;
                arenaHitFlash = 12;
                document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
                for (let j = 0; j < 12; j++) {
                    arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 25, color: "#f00", size: Math.random()*5+2 });
                }
                attacks.splice(i, 1);
                if (arenaHP <= 0) { loseArena(); ctx.restore(); return; }
                continue;
            }
            
            if (a.x < -250 || a.x > 650 || a.y < -250 || a.y > 750) { attacks.splice(i, 1); continue; }
            
            let col = arenaAttackType === 0 ? "#ffffff" : "#4499ff";
            ctx.save();
            ctx.translate(a.x + a.size/2, a.y + a.size/2);
            if (a.rot) ctx.rotate(a.rot);
            
            let sqGrad = ctx.createLinearGradient(-a.size/2, -a.size/2, a.size/2, a.size/2);
            sqGrad.addColorStop(0, col);
            sqGrad.addColorStop(1, arenaAttackType === 0 ? "#999" : "#1155cc");
            ctx.fillStyle = sqGrad;
            ctx.shadowBlur = 12 + Math.sin(a.glow || 0)*6;
            ctx.shadowColor = col;
            ctx.fillRect(-a.size/2, -a.size/2, a.size, a.size);
            ctx.strokeStyle = "rgba(255,255,255,0.6)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-a.size/2, -a.size/2, a.size, a.size);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        // Шлейф
        for (let i = arenaTrail.length - 1; i >= 0; i--) {
            let t = arenaTrail[i];
            t.life--;
            if (t.life <= 0) { arenaTrail.splice(i, 1); continue; }
            ctx.fillStyle = "rgba(255,50,50," + (t.life/8)*0.3 + ")";
            ctx.beginPath(); ctx.arc(t.x, t.y, heart.size * (t.life/8), 0, Math.PI*2); ctx.fill();
        }
        
        // Сердечко с пульсацией и свечением
        let hx = heart.x, hy = heart.y, s = heart.size + Math.sin(Date.now()/180)*2;
        // Внешнее свечение
        let glowGrad = ctx.createRadialGradient(hx, hy, s*0.5, hx, hy, s*2.5);
        glowGrad.addColorStop(0, "rgba(255,0,0,0.5)");
        glowGrad.addColorStop(1, "rgba(255,0,0,0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(hx, hy, s*2.5, 0, Math.PI*2); ctx.fill();
        
        // Среднее свечение
        ctx.fillStyle = "rgba(255,50,50,0.4)";
        ctx.shadowBlur = 20; ctx.shadowColor = "#ff0000";
        ctx.beginPath(); ctx.arc(hx, hy, s+4, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        
        // Сердечко
        ctx.fillStyle = "#ff0000";
        ctx.shadowBlur = 10; ctx.shadowColor = "#ff4444";
        ctx.beginPath();
        ctx.moveTo(hx, hy + s*0.3);
        ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
        ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.2);
        ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
        ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
        ctx.fill();
        ctx.strokeStyle = "#ff8888"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Блик
        ctx.fillStyle = "rgba(255,200,200,0.5)";
        ctx.beginPath(); ctx.arc(hx-s*0.3, hy-s*0.3, s*0.4, 0, Math.PI*2); ctx.fill();
    }
    
    if (arenaPhase === "attack") {
        arenaClickTargets.forEach(t => {
            t.pulse += 0.06;
            let r = t.radius + Math.sin(t.pulse)*5;
            
            // Свечение
            let glowGrad = ctx.createRadialGradient(t.x, t.y, r*0.5, t.x, t.y, r*1.8);
            glowGrad.addColorStop(0, t.hit ? "rgba(0,255,0,0.4)" : "rgba(255,255,0,0.4)");
            glowGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = glowGrad;
            ctx.beginPath(); ctx.arc(t.x, t.y, r*1.8, 0, Math.PI*2); ctx.fill();
            
            // Круг
            ctx.fillStyle = t.hit ? "rgba(0,255,0,0.7)" : "rgba(255,255,0,0.85)";
            ctx.shadowBlur = t.hit ? 20 : 30;
            ctx.shadowColor = t.hit ? "#0f0" : "#ff0";
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = t.hit ? "#0f0" : "#ffaa00"; ctx.lineWidth = 4; ctx.stroke();
            ctx.shadowBlur = 0;
            
            if (!t.hit) {
                // Текст
                ctx.fillStyle = "#000"; ctx.font = "bold 14px Nunito, sans-serif";
                ctx.fillText("ЖМИ", t.x-19, t.y+6);
                // Стрелочка сверху
                ctx.fillStyle = "#fff";
                ctx.beginPath(); ctx.moveTo(t.x, t.y-r-12); ctx.lineTo(t.x-6, t.y-r-4); ctx.lineTo(t.x+6, t.y-r-4); ctx.fill();
                // Пульсирующее кольцо
                ctx.strokeStyle = "rgba(255,255,255," + (0.5+Math.sin(t.pulse*2)*0.3) + ")";
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(t.x, t.y, r+8+Math.sin(t.pulse)*4, 0, Math.PI*2); ctx.stroke();
            }
        });
    }
    
    // Частицы
    for (let i = arenaParticles.length - 1; i >= 0; i--) {
        let p = arenaParticles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--;
        if (p.life <= 0) { arenaParticles.splice(i, 1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life/40;
        ctx.shadowBlur = 4; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    ctx.restore();
    requestAnimationFrame(renderArena);
}

// Polyfill для roundRect
if (!ctx || !ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
        return this;
    };
}
