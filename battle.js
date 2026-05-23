// ========== АРЕНА UNDERTALE v23 — УРОН ОТ ХАРАКТЕРИСТИК БОССА, КНОПКА ПРОПУСКА ==========
let arenaActive = false;
let arenaBoss = null;
let arenaHP = 30;
let arenaMaxHP = 30;
let arenaBossMaxHP = 1000;
let arenaAttackType = 0;
let arenaClickTargets = [];
let arenaClicksHit = 0;
let arenaTotalTargets = 8;
let arenaAttackTimeLeft = 2;
let heart = { x: 200, y: 400, size: 14, hitbox: 4 };
let attacks = [];
let arenaBlasters = [];
let arenaAllowedTypes = [];
let canvas = null;
let ctx = null;
let arenaParticles = [];
let floatingTexts = [];
let arenaShake = 0;
let arenaHitFlash = 0;
let arenaComboText = "";
let arenaComboTimer = 0;
let arenaTrail = [];
let keys = { w: false, a: false, s: false, d: false, up: false, left: false, down: false, right: false };
let heartSpeed = 3.8;
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickId = null;
let arenaPhase = "dodge";
let arenaAttackInterval = null;
let animFrameId = null;
let heartWasMoving = false;
let heartStandingTime = 0;
let arenaSpeedMult = 1.0;
let arenaCurrentWave = 0;
let invulnTimer = 0;
let isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
let arenaBossDefeatedBefore = false;
let arenaBossDmgMult = 1.0; // Множитель урона от босса
let arenaBaseDmg = 5; // Базовый урон атак

function initArena() {
    canvas = document.getElementById("arenaCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    
    const handleKey = (e, isDown) => {
        let k = e.key.toLowerCase();
        if (k in keys) { keys[k] = isDown; e.preventDefault(); }
        if (k === "arrowup") { keys.up = isDown; e.preventDefault(); }
        if (k === "arrowdown") { keys.down = isDown; e.preventDefault(); }
        if (k === "arrowleft") { keys.left = isDown; e.preventDefault(); }
        if (k === "arrowright") { keys.right = isDown; e.preventDefault(); }
    };

    window.addEventListener("keydown", (e) => handleKey(e, true));
    window.addEventListener("keyup", (e) => handleKey(e, false));
    
    if (isMobile) {
        canvas.addEventListener("touchstart", (e) => {
            if (!arenaActive) return;
            e.preventDefault();
            let rect = canvas.getBoundingClientRect();
            if (arenaPhase === "attack") {
                for (let i = 0; i < e.touches.length; i++) {
                    checkClickTarget(e.touches[i].clientX - rect.left, e.touches[i].clientY - rect.top);
                }
                return;
            }
            if (e.touches.length === 1) {
                joystickActive = true; joystickId = e.touches[0].identifier;
                joystickX = e.touches[0].clientX - rect.left;
                joystickY = e.touches[0].clientY - rect.top;
            }
        });
        
        canvas.addEventListener("touchmove", (e) => {
            if (!arenaActive || arenaPhase !== "dodge") return;
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === joystickId) {
                    let rect = canvas.getBoundingClientRect();
                    joystickX = e.touches[i].clientX - rect.left;
                    joystickY = e.touches[i].clientY - rect.top;
                    break;
                }
            }
        });
        
        canvas.addEventListener("touchend", () => { joystickActive = false; joystickId = null; });
    }
    
    canvas.addEventListener("click", (e) => {
        if (!arenaActive || arenaPhase !== "attack") return;
        let rect = canvas.getBoundingClientRect();
        checkClickTarget(e.clientX - rect.left, e.clientY - rect.top);
    });
}

function clampHeart() {
    heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
    heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
}

function moveHeart() {
    let mx = 0, my = 0;
    if (keys.w || keys.up) my -= 1;
    if (keys.s || keys.down) my += 1;
    if (keys.a || keys.left) mx -= 1;
    if (keys.d || keys.right) mx += 1;
    
    if (joystickActive && isMobile) { 
        mx = (joystickX - heart.x) / 15; 
        my = (joystickY - heart.y) / 15; 
        let len = Math.sqrt(mx*mx + my*my);
        if (len > 1) { mx /= len; my /= len; }
    }
    
    let isMoving = Math.abs(mx) > 0.05 || Math.abs(my) > 0.05;
    heartWasMoving = isMoving;
    
    if (isMoving) {
        heartStandingTime = 0;
        let len = Math.sqrt(mx*mx + my*my);
        if (len > 1) { mx /= len; my /= len; }
        heart.x += mx * heartSpeed;
        heart.y += my * heartSpeed;
        clampHeart();
        if (!isMobile) arenaTrail.push({ x: heart.x, y: heart.y, life: 12, size: heart.size * 0.8, color: "#f00" });
    } else {
        heartStandingTime++;
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 40, vy: -2 });
}

function checkClickTarget(mx, my) {
    for (let i = arenaClickTargets.length - 1; i >= 0; i--) {
        let t = arenaClickTargets[i];
        if (Math.sqrt((mx-t.x)**2 + (my-t.y)**2) < t.radius + 15 && !t.hit) {
            t.hit = true; arenaClicksHit++;
            arenaShake = 8;
            for (let j = 0; j < (isMobile ? 10 : 30); j++) {
                arenaParticles.push({ x: t.x, y: t.y, vx: (Math.random()-0.5)*20, vy: (Math.random()-0.5)*20, life: 25, color: "#ffdd00", size: 3+Math.random()*5 });
            }
            break;
        }
    }
}

function calculateArenaHP() {
    let bonus = 0;
    if (typeof team !== 'undefined') {
        team.forEach(idx => { let cd = myCards[idx]; if (cd) bonus += Math.floor(cd.hp / 50); });
    }
    arenaMaxHP = 30 + bonus;
    arenaHP = arenaMaxHP;
}

function getAttackTypes(bossWave) {
    if (typeof bossTemplates !== 'undefined' && bossTemplates[bossWave] && bossTemplates[bossWave].arenaTypes) {
        return bossTemplates[bossWave].arenaTypes;
    }
    if (bossWave < 100) return [0, 1];
    if (bossWave < 400) return [0, 1, 2, 3];
    if (bossWave < 1000) return [0, 1, 2, 3, 4, 5];
    if (bossWave < 2000) return [0, 1, 2, 3, 4, 5, 7, 8];
    return [0, 1, 2, 3, 4, 5, 7, 8, 9, 10];
}

function skipDefeatedBoss() {
    stopArena();
    if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
    if (typeof victory === 'function') victory();
}

function startArena(bossWave) {
    let btn = document.getElementById("startArenaBtn");
    if (btn) btn.style.display = "none";
    let spareBtn = document.getElementById("spareBtn");
    if (spareBtn) spareBtn.style.display = "none";
    
    arenaBossDefeatedBefore = (typeof highestCheckpoint !== 'undefined' && highestCheckpoint >= bossWave);
    
    arenaActive = true;
    arenaCurrentWave = bossWave;
    calculateArenaHP();
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaPhase = "dodge";
    attacks = [];
    arenaBlasters = [];
    arenaParticles = [];
    floatingTexts = [];
    arenaTrail = [];
    arenaShake = 0;
    arenaHitFlash = 0;
    invulnTimer = 0;
    arenaComboText = "";
    arenaComboTimer = 0;
    heart.x = 200; heart.y = 400;
    heartWasMoving = false;
    heartStandingTime = 0;
    
    arenaSpeedMult = Math.min(15.0, 1.0 + Math.floor((bossWave - 50) / 50) * 0.1);
    if (bossWave < 50) arenaSpeedMult = 1.0;
    
    arenaAllowedTypes = getAttackTypes(bossWave);
    
    let bt = typeof bossTemplates !== 'undefined' ? bossTemplates[bossWave] : null;
    arenaBoss = bt ? bt.name : "БОСС ВРАТ";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000 + bossWave * 10;
    
    // Урон атак зависит от dmgMult босса
    if (bt && bt.dmgMult) {
        arenaBossDmgMult = bt.dmgMult;
    } else {
        arenaBossDmgMult = 1.0 + (bossWave - 50) / 100 * 0.5;
    }
    arenaBaseDmg = Math.floor(5 * arenaBossDmgMult);
    
    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = arenaHP;
    document.getElementById("arenaTimer").innerText = "∞";
    
    let skipBtn = document.getElementById("skipBossBtn");
    if (skipBtn) skipBtn.style.display = arenaBossDefeatedBefore ? "block" : "none";
    
    if (!ctx) initArena();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    
    startDodgePhase();
    animFrameId = requestAnimationFrame(renderArena);
}

function startDodgePhase() {
    arenaPhase = "dodge";
    attacks = [];
    arenaBlasters = [];
    heart.x = 200; heart.y = 400;
    
    arenaAttackType = arenaAllowedTypes[Math.floor(Math.random() * arenaAllowedTypes.length)];
    
    let typeNames = {
        0: "⬜ ОБЫЧНЫЕ", 1: "🔷 ХАОС", 2: "⚡ ЖЁЛТЫЕ", 3: "🛑 КРАСНЫЕ",
        4: "💗 РОЗОВЫЕ", 5: "💚 ЗЕЛЁНЫЕ", 6: "🌈 РАДУЖНЫЕ", 7: "⚡🛑 МИКС",
        8: "🟥⬜ ЗОНЫ", 9: "💣 БОМБЫ", 10: "🔫 БЛАСТЕРЫ"
    };
    
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + (typeNames[arenaAttackType] || "Атака");
    
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    
    let baseInterval = 2400;
    if (arenaAttackType === 0) baseInterval = 2800;
    if (arenaAttackType === 2 || arenaAttackType === 3) baseInterval = 1800;
    if (arenaAttackType === 6) baseInterval = 4000;
    if (arenaAttackType === 7) baseInterval = 2200;
    if (arenaAttackType === 8) baseInterval = 2600;
    if (arenaAttackType === 9) baseInterval = 3400;
    if (arenaAttackType === 10) baseInterval = 2200;

    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive) spawnAttack();
    }, Math.max(800, baseInterval / arenaSpeedMult));
    
    let dodgeTime = Math.max(10000, 13000 + Math.random() * 6000);
    setTimeout(() => { if (arenaPhase === "dodge" && arenaActive) startAttackPhase(); }, dodgeTime);
}

function startAttackPhase() {
    arenaPhase = "attack";
    attacks = [];
    arenaBlasters = [];
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaTotalTargets = 3 + Math.floor(arenaSpeedMult * 0.75);
    arenaAttackTimeLeft = 2;
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    
    document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
    
    let usedPositions = [];
    for (let i = 0; i < arenaTotalTargets; i++) {
        let x, y, tooClose, attempts = 0;
        do {
            x = 40 + Math.random() * 320; y = 80 + Math.random() * 340;
            tooClose = false;
            for (let p of usedPositions) { if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < 60) { tooClose = true; break; } }
            attempts++;
        } while (tooClose && attempts < 50);
        usedPositions.push({x, y});
        arenaClickTargets.push({ x, y, radius: 30, hit: false, pulse: Math.random()*Math.PI*2 });
    }
    
    let attackTimer = setInterval(() => {
        arenaAttackTimeLeft--;
        document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
        if (arenaAttackTimeLeft <= 0) { clearInterval(attackTimer); applyArenaDamage(); }
    }, 1000);
}

function applyArenaDamage() {
    if (!arenaActive) return;
    let dmgMult = 0;
    let ratio = arenaClicksHit / arenaTotalTargets;
    
    if (ratio >= 1.0) { dmgMult = 2.5; arenaComboText = "ИДЕАЛЬНО! x2.5"; }
    else if (ratio >= 0.7) { dmgMult = 1.5; arenaComboText = "ОТЛИЧНО! x1.5"; }
    else if (ratio >= 0.4) { dmgMult = 1.0; arenaComboText = "ХОРОШО! x1"; }
    else if (ratio > 0) { dmgMult = 0.5; arenaComboText = "СЛАБО... x0.5"; }
    else { arenaComboText = "ПРОМАХ!"; dmgMult = 0; }
    
    arenaComboTimer = 50;
    let baseDmg = typeof window !== 'undefined' && window.playerFinalDamage ? window.playerFinalDamage : 20;
    let finalDmg = Math.floor(baseDmg * dmgMult);
    
    if (finalDmg > 0) {
        arenaBossMaxHP -= finalDmg;
        arenaShake = 20;
    }
    
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) { winArena(); return; }
        startDodgePhase();
    }, 1500);
}

function spawnBlaster(w) {
    let bossW = arenaCurrentWave;
    let isRainbow = Math.random() < 0.05 && bossW >= 800; 
    let colors = ["#fff", "#ffdd00", "#ff3333"];
    let bColor = isRainbow ? "rainbow" : colors[Math.floor(Math.random() * colors.length)];
    
    let side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random()*400; y = -30; }
    else if (side === 1) { x = Math.random()*400; y = 530; }
    else if (side === 2) { x = -30; y = Math.random()*500; }
    else { x = 430; y = Math.random()*500; }
    
    arenaBlasters.push({
        x: x, y: y,
        angle: Math.atan2(heart.y - y, heart.x - x),
        color: bColor,
        state: "aiming",
        timer: 70,
        width: isRainbow ? 15 : 30,
        hasHit: false
    });
}

function spawnAttack() {
    let s = arenaSpeedMult;
    let bw = arenaCurrentWave;
    let isEarly = bw < 100;
    let dmg = arenaBaseDmg;
    
    switch(arenaAttackType) {
        case 0:
            if (isEarly) {
                if (Math.random() > 0.5) {
                    attacks.push({ type: "square", x: 60, y: -30, size: 26, spd: 0, spdY: 3.2*s, color: "#fff", damage: dmg });
                    attacks.push({ type: "square", x: 310, y: -30, size: 26, spd: 0, spdY: 3.2*s, color: "#fff", damage: dmg });
                } else {
                    attacks.push({ type: "square", x: -30, y: 180, size: 26, spd: 3.5*s, spdY: 0, color: "#fff", damage: dmg });
                    attacks.push({ type: "square", x: 430, y: 320, size: 26, spd: -3.5*s, spdY: 0, color: "#fff", damage: dmg });
                }
            } else {
                let isVertical = Math.random() > 0.5;
                if (isVertical) {
                    let gapY = 50 + Math.random() * 300;
                    let startX = Math.random() > 0.5 ? -30 : 430;
                    let dirX = startX < 0 ? 3.5*s : -3.5*s;
                    for (let i = 20; i < 480; i += 70) {
                        if (Math.abs(i - gapY) < 55) continue;
                        attacks.push({ type: "square", x: startX, y: i, size: 22, spd: dirX, spdY: 0, color: "#fff", damage: dmg });
                    }
                } else {
                    let gapX = 50 + Math.random() * 250;
                    let startY = Math.random() > 0.5 ? -30 : 530;
                    let dirY = startY < 0 ? 3.5*s : -3.5*s;
                    for (let i = 20; i < 380; i += 70) {
                        if (Math.abs(i - gapX) < 55) continue;
                        attacks.push({ type: "square", x: i, y: startY, size: 22, spd: 0, spdY: dirY, color: "#fff", damage: dmg });
                    }
                }
            }
            break;
        case 1:
            for (let i = 0; i < (isEarly ? 1 : 2); i++) {
                let side = Math.floor(Math.random()*4);
                let x, y;
                if (side===0) { x=Math.random()*400; y=-30; } else if (side===1) { x=Math.random()*400; y=530; }
                else if (side===2) { x=-30; y=Math.random()*500; } else { x=430; y=Math.random()*500; }
                let angle = Math.atan2(heart.y - y, heart.x - x);
                if (!isEarly) angle += (Math.random() - 0.5) * 0.2;
                attacks.push({ type: "square", x, y, size: 20, spd: Math.cos(angle)*4.2*s, spdY: Math.sin(angle)*4.2*s, color: "#4499ff", damage: dmg });
            }
            break;
        case 2:
            let xPos = Math.random() * 400, yPos = -40;
            let angle = Math.atan2(heart.y - yPos, heart.x - xPos);
            attacks.push({ type: "sword", x: xPos, y: yPos, angle: angle, size: 45, width: 15, color: "#ffaa00", spd: Math.cos(angle)*5*s, spdY: Math.sin(angle)*5*s, damageOnStanding: true, damage: Math.floor(dmg * 1.2) });
            if (!isEarly) {
                attacks.push({ type: "sword", x: 400 - xPos, y: 540, angle: angle + Math.PI, size: 45, width: 15, color: "#ffaa00", spd: -Math.cos(angle)*5*s, spdY: -Math.sin(angle)*5*s, damageOnStanding: true, damage: Math.floor(dmg * 1.2) });
            }
            break;
        case 3:
            for (let i = 0; i < (isEarly ? 1 : 2); i++) {
                let vx = (Math.random() > 0.5 ? 1 : -1) * (3+Math.random()*1)*s;
                let vy = (Math.random() > 0.5 ? 1 : -1) * (3+Math.random()*1)*s;
                attacks.push({ type: "danger", x: 200, y: 250, size: 25, spd: vx, spdY: vy, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.2) });
            }
            break;
        case 4:
            for (let i = 0; i < (isEarly ? 1 : 2); i++) {
                attacks.push({ type: "square", x: heart.x + (Math.random()-0.5)*120, y: -40 - Math.random()*50, size: 25, spd: 0, spdY: (3.5+Math.random()*1.5)*s, color: "#ff69b4", knockback: 120 });
            }
            break;
        case 5:
            if (arenaHP < arenaMaxHP) {
                attacks.push({ type: "circle", x: Math.random()*400, y: -30, radius: 15, spd: (Math.random()-0.5)*2*s, spdY: 3.5*s, color: "#44ff44", heal: 3 });
            } else {
                arenaAttackType = 0; spawnAttack();
            }
            break;
        case 6:
            attacks.push({ type: "rainbow", x: 50+Math.random()*300, y: -60, radius: 30, spd: (Math.random()-0.5)*1.5*s, spdY: (2.5+Math.random())*s, color: "rainbow", oneshot: true });
            break;
        case 7:
            let sx = Math.random() * 400, sy = -40;
            let sa = Math.atan2(heart.y - sy, heart.x - sx);
            attacks.push({ type: "sword", x: sx, y: sy, angle: sa, size: 40, width: 12, color: "#ffaa00", spd: Math.cos(sa)*4.5*s, spdY: Math.sin(sa)*4.5*s, damageOnStanding: true, damage: Math.floor(dmg * 1.3) });
            if (!isEarly) attacks.push({ type: "danger", x: heart.x + (Math.random()-0.5)*100, y: 540, size: 25, spd: (Math.random()-0.5)*1.5*s, spdY: -4*s, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.3) });
            break;
        case 8:
            attacks.push({ type: "danger", x: -40, y: heart.y, size: 40, spd: 5*s, spdY: 0, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.5) });
            if (!isEarly) attacks.push({ type: "square", x: 440, y: heart.y + (Math.random()>0.5?60:-60), size: 30, spd: -5*s, spdY: 0, color: "#fff", damage: Math.floor(dmg * 1.5) });
            break;
        case 9:
            for(let i=0; i < (isEarly ? 1 : (bw >= 500 ? 2 : 1)); i++) {
                attacks.push({ type: "bomb", x: heart.x + (Math.random()-0.5)*140, y: heart.y + (Math.random()-0.5)*140, timer: 60, maxRadius: isEarly ? 75 : (80 + Math.random() * 40), hit: false, damage: Math.floor(dmg * 2) });
            }
            break;
        case 10:
            spawnBlaster(bw);
            attacks.push({ type: "square", x: heart.x, y: -40, size: 15, spd: (Math.random()-0.5)*2.5*s, spdY: 4*s, color: "#fff", damage: dmg });
            break;
    }
}

function stopArena() {
    arenaActive = false;
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    arenaAttackInterval = null; animFrameId = null;
    attacks = []; arenaClickTargets = []; arenaParticles = []; arenaTrail = []; floatingTexts = []; arenaBlasters = [];
    document.getElementById("arenaOverlay").style.display = "none";
    let skipBtn = document.getElementById("skipBossBtn");
    if (skipBtn) skipBtn.style.display = "none";
}

function winArena() {
    stopArena();
    if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = Math.floor(currentEnemy.maxHp * 0.25);
    if (typeof victory === 'function') victory();
}

function loseArena() {
    arenaShake = 25;
    setTimeout(() => {
        stopArena();
        if (typeof playerHp !== 'undefined') playerHp = 0;
        if (typeof defeat === 'function') defeat();
    }, 1000);
}

function applyHit(dmg, textMsg = null) {
    if (invulnTimer > 0) return;
    arenaHP -= dmg; arenaHitFlash = 12; invulnTimer = 40; arenaShake = 20;
    if (!isMobile) spawnFloatingText(heart.x, heart.y - 20, textMsg || "-" + dmg, "#ff4444");
    document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
    for (let j = 0; j < (isMobile ? 10 : 25); j++) {
        arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25, life: 35, color: "#f00", size: 4+Math.random()*5 });
    }
    if (arenaHP <= 0) loseArena();
}

function renderArena() {
    if (!arenaActive || !ctx) return;
    let now = Date.now();
    
    if (arenaPhase === "dodge") {
        moveHeart();
        if (arenaAllowedTypes.includes(10) && !heartWasMoving) {
            let bw = arenaCurrentWave;
            let camperThreshold = bw >= 700 ? 70 : (bw >= 350 ? 90 : 110);
            if (heartStandingTime > camperThreshold) { spawnBlaster(bw); heartStandingTime = 0; }
        }
    }
    
    let sx = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    let sy = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    if (arenaShake > 0) arenaShake *= 0.85;
    if (arenaHitFlash > 0) arenaHitFlash--;
    if (invulnTimer > 0) invulnTimer--;
    if (arenaComboTimer > 0) arenaComboTimer--;
    
    ctx.save(); ctx.translate(sx, sy); ctx.clearRect(-10, -10, 420, 520);
    ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, 400, 500);
    
    let borderColor = arenaPhase === "attack" ? "#ffdd00" : (["#fff","#4499ff","#ffdd00","#ff3333","#ff69b4","#44ff44","rainbow","#ffaa00","#ff3333","#ff3333","#fff"][arenaAttackType] || "#fff");
    if (borderColor === "rainbow" || arenaAttackType === 6) borderColor = `hsl(${(now/5)%360}, 100%, 50%)`;
    if (arenaHitFlash > 0) borderColor = "#ff0000";
    if (!isMobile) { ctx.shadowBlur = 15; ctx.shadowColor = borderColor; }
    ctx.strokeStyle = borderColor; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 396, 496); ctx.shadowBlur = 0;
    
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8, 6, 384, 22);
    ctx.fillStyle = "#400"; ctx.fillRect(14, 12, 372, 5);
    ctx.fillStyle = arenaHitFlash > 0 ? "#fff" : "#0f0"; ctx.fillRect(14, 12, 372 * Math.max(0, arenaHP/arenaMaxHP), 5);
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif"; ctx.fillText(`❤️ ${Math.max(0, arenaHP)} / ${arenaMaxHP}`, 16, 24);
    
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8, 32, 384, 14);
    let maxHp = (typeof currentEnemy !== 'undefined' && currentEnemy) ? currentEnemy.maxHp : 1000;
    ctx.fillStyle = "#222"; ctx.fillRect(14, 36, 372, 3);
    ctx.fillStyle = "#ff0"; ctx.fillRect(14, 36, 372 * Math.max(0, arenaBossMaxHP/maxHp), 3);
    ctx.fillStyle = "#aaa"; ctx.font = "bold 8px sans-serif"; ctx.fillText(`👾 ${arenaBoss}`, 16, 42);
    
    if (arenaComboTimer > 0 && arenaComboText) {
        ctx.fillStyle = `rgba(255, 255, 0, ${Math.min(1, arenaComboTimer/20)})`;
        ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.fillText(arenaComboText, 200, 260); ctx.textAlign = "left";
    }

    for (let i = arenaTrail.length - 1; i >= 0; i--) {
        let tr = arenaTrail[i]; ctx.globalAlpha = tr.life / 12; ctx.fillStyle = tr.color || "#ff0000";
        ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.size, 0, Math.PI * 2); ctx.fill();
        tr.life--; if (tr.life <= 0) arenaTrail.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    
    if (arenaPhase === "dodge") {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            
            if (a.type === "bomb") {
                a.timer--;
                if (a.timer > 0) {
                    ctx.save(); if (!isMobile) { ctx.shadowBlur = 15; ctx.shadowColor = "#ff3333"; }
                    ctx.fillStyle = (Math.floor(a.timer / 8) % 2 === 0) ? "#fff" : "#ff3333";
                    ctx.beginPath(); ctx.arc(a.x, a.y, 10 + Math.abs(Math.sin(a.timer * 0.3)) * 5, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = "rgba(255, 51, 51, 0.4)"; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(a.x, a.y, a.maxRadius, 0, Math.PI*2); ctx.stroke(); ctx.restore();
                } else if (a.timer > -15) {
                    let progress = Math.abs(a.timer) / 15, currentRadius = a.maxRadius * progress;
                    ctx.save(); if (!isMobile) { ctx.shadowBlur = 40; ctx.shadowColor = "#ffaa00"; }
                    ctx.fillStyle = `rgba(255, ${Math.floor(255 * (1-progress))}, 0, ${1 - progress})`;
                    ctx.beginPath(); ctx.arc(a.x, a.y, currentRadius, 0, Math.PI*2); ctx.fill(); ctx.restore();
                    if (a.timer === -1) {
                        if (!isMobile) arenaShake += 15;
                        for(let p=0; p < (isMobile ? 15 : 35); p++) arenaParticles.push({ x: a.x, y: a.y, vx: (Math.random()-0.5)*30, vy: (Math.random()-0.5)*30, life: 30 + Math.random()*20, color: "#ffaa00", size: 4+Math.random()*6 });
                    }
                    if (!a.hit && invulnTimer <= 0) {
                        let dx = heart.x - a.x, dy = heart.y - a.y;
                        if (Math.sqrt(dx*dx + dy*dy) < (currentRadius + heart.hitbox)) {
                            applyHit(a.damage || 30, "ВЗРЫВ!"); a.hit = true;
                        }
                    }
                } else { attacks.splice(i, 1); }
                continue;
            }
            
            a.spd ? a.x += a.spd : 0; a.spdY ? a.y += a.spdY : 0;
            let sz = a.size || a.radius || 20;
            if (a.spd) if (a.x < 5 || a.x > 395 - sz) a.spd *= -1;
            if (a.spdY) if (a.y < 5 || a.y > 495 - sz) a.spdY *= -1;
            a.x = Math.max(5, Math.min(395 - sz, a.x)); a.y = Math.max(5, Math.min(495 - sz, a.y));
            
            let hit = false, cx = a.x + (a.size ? a.size/2 : 0), cy = a.y + (a.size ? a.size/2 : 0);
            if (a.type === "circle" || a.type === "rainbow") { let dx = heart.x - a.x, dy = heart.y - a.y; hit = Math.sqrt(dx*dx + dy*dy) < (heart.hitbox + a.radius - 2); }
            else if (a.type === "sword") { let dx = heart.x - a.x, dy = heart.y - a.y; hit = Math.sqrt(dx*dx + dy*dy) < (heart.hitbox + a.size/2); }
            else hit = Math.abs(heart.x - cx) < (sz/2 + heart.hitbox) && Math.abs(heart.y - cy) < (sz/2 + heart.hitbox);
            
            if (hit && invulnTimer <= 0) {
                let baseHitDmg = a.damage || arenaBaseDmg || 5;
                if (a.damageOnStanding && !heartWasMoving) { applyHit(Math.floor(baseHitDmg * 1.5), "ДВИГАЙСЯ!"); attacks.splice(i, 1); continue; }
                if (a.damageOnMoving && heartWasMoving) { applyHit(Math.floor(baseHitDmg * 1.5), "СТОЙ!"); attacks.splice(i, 1); continue; }
                if (a.knockback) { let dx = heart.x - a.x, dy = heart.y - a.y, dist = Math.sqrt(dx*dx+dy*dy) || 1; heart.x += (dx/dist)*a.knockback; heart.y += (dy/dist)*a.knockback; clampHeart(); attacks.splice(i, 1); continue; }
                if (a.heal) { arenaHP = Math.min(arenaMaxHP, arenaHP + a.heal); attacks.splice(i, 1); continue; }
                if (a.oneshot) { applyHit(999, "ФАТАЛЬНО!"); continue; }
                if (!a.damageOnStanding && !a.damageOnMoving && !a.heal && !a.knockback && !a.oneshot) { applyHit(baseHitDmg); attacks.splice(i, 1); continue; }
            }
            
            if (a.y > 600 || a.y < -100 || a.x < -100 || a.x > 500) { attacks.splice(i, 1); continue; }
            
            ctx.save(); let col = a.color; if (a.type === "rainbow") col = `hsl(${(now/2 + a.x)%360}, 100%, 60%)`;
            if (!isMobile) { ctx.shadowBlur = 15; ctx.shadowColor = col; } ctx.fillStyle = col;
            if (a.type === "square" || a.type === "danger") { ctx.translate(a.x + sz/2, a.y + sz/2); if (a.type === "danger") { ctx.beginPath(); ctx.moveTo(0, -sz/2); ctx.lineTo(sz/2, 0); ctx.lineTo(0, sz/2); ctx.lineTo(-sz/2, 0); ctx.fill(); } else { ctx.fillRect(-sz/2, -sz/2, sz, sz); if (!isMobile) ctx.clearRect(-sz/4, -sz/4, sz/2, sz/2); } }
            else if (a.type === "sword") { ctx.translate(a.x, a.y); ctx.rotate(a.angle || 0); ctx.beginPath(); ctx.moveTo(a.size, 0); ctx.lineTo(0, a.width/2); ctx.lineTo(-a.size, 0); ctx.lineTo(0, -a.width/2); ctx.fill(); }
            else if (a.type === "circle" || a.type === "rainbow") { ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill(); if (a.type === "rainbow") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(a.x, a.y, a.radius*0.5, 0, Math.PI*2); ctx.fill(); } }
            ctx.restore();
        }

        for (let i = arenaBlasters.length - 1; i >= 0; i--) {
            let b = arenaBlasters[i], ac = b.color === "rainbow" ? `hsl(${(now/2)%360}, 100%, 60%)` : b.color;
            if (b.state === "aiming") {
                if (b.timer > 30) b.angle = Math.atan2(heart.y - b.y, heart.x - b.x);
                ctx.save(); ctx.globalAlpha = 0.3 + Math.abs(Math.sin(b.timer * 0.2)) * 0.3; if (!isMobile) { ctx.shadowBlur = 10; ctx.shadowColor = ac; }
                ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.angle)*800, b.y + Math.sin(b.angle)*800); ctx.stroke(); ctx.setLineDash([]);
                ctx.globalAlpha = 1; ctx.translate(b.x, b.y); ctx.rotate(b.angle); ctx.fillStyle = "#222"; ctx.fillRect(-15, -15, 30, 30); ctx.fillStyle = ac; ctx.fillRect(4, -5, 12, 10); ctx.restore();
                b.timer--; if (b.timer <= 0) { b.state = "firing"; b.timer = 15; arenaShake = 25; }
            } else if (b.state === "firing") {
                ctx.save(); ctx.strokeStyle = ac; ctx.lineWidth = b.width + Math.random()*8; if (!isMobile) { ctx.shadowBlur = 40; ctx.shadowColor = ac; }
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.angle)*800, b.y + Math.sin(b.angle)*800); ctx.stroke(); ctx.restore();
                if (!b.hasHit && invulnTimer <= 0) {
                    let dx = heart.x - b.x, dy = heart.y - b.y, dist = Math.abs(dx * Math.sin(b.angle) - dy * Math.cos(b.angle));
                    if (dist < b.width / 2 + heart.hitbox) {
                        let bdmg = 0, msg = "";
                        if (b.color === "rainbow") { applyHit(999, "ФАТАЛЬНО!"); }
                        else if (b.color === "#fff") { bdmg = Math.floor(arenaBaseDmg * 2); msg = "ЛУЧ!"; }
                        else if (b.color === "#ffdd00") { if (!heartWasMoving) { bdmg = Math.floor(arenaBaseDmg * 3); msg = "СТОЙ!"; } else { bdmg = Math.floor(arenaBaseDmg * 0.8); msg = "ЗАДЕЛ!"; } }
                        else if (b.color === "#ff3333") { if (heartWasMoving) { bdmg = Math.floor(arenaBaseDmg * 3); msg = "ДВИГАЙСЯ!"; } else { bdmg = Math.floor(arenaBaseDmg * 0.8); msg = "ЗАДЕЛ!"; } }
                        if (bdmg > 0) applyHit(bdmg, msg); b.hasHit = true;
                    }
                }
                b.timer--; if (b.timer <= 0) { b.state = "fading"; b.timer = 20; }
            } else if (b.state === "fading") {
                ctx.save(); ctx.globalAlpha = b.timer / 20; ctx.strokeStyle = ac; ctx.lineWidth = b.width;
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.angle)*800, b.y + Math.sin(b.angle)*800); ctx.stroke(); ctx.restore();
                b.timer--; if (b.timer <= 0) arenaBlasters.splice(i, 1);
            }
        }
        
    } else if (arenaPhase === "attack") {
        for (let i = 0; i < arenaClickTargets.length; i++) {
            let t = arenaClickTargets[i]; if (t.hit) continue; t.pulse += 0.2; let r = t.radius + Math.sin(t.pulse) * 4;
            ctx.save(); if (!isMobile) { ctx.shadowBlur = 15; ctx.shadowColor = "#fff"; } ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fill(); ctx.restore();
        }
    }
    
    for (let i = arenaParticles.length - 1; i >= 0; i--) { let p = arenaParticles[i]; ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 35; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) arenaParticles.splice(i, 1); } ctx.globalAlpha = 1;
    for (let i = floatingTexts.length - 1; i >= 0; i--) { let ft = floatingTexts[i]; ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life / 40; ctx.font = "bold 16px sans-serif"; ctx.fillText(ft.text, ft.x, ft.y); ft.y += ft.vy; ft.life--; if (ft.life <= 0) floatingTexts.splice(i, 1); } ctx.globalAlpha = 1;
    
    if (invulnTimer <= 0 || Math.floor(now / 100) % 2 === 0) {
        ctx.save(); if (!isMobile) { ctx.shadowBlur = 20; ctx.shadowColor = "#ff0000"; } ctx.fillStyle = "#ff0000";
        ctx.beginPath(); ctx.arc(heart.x - 4, heart.y - 4, 6, Math.PI, 0); ctx.arc(heart.x + 4, heart.y - 4, 6, Math.PI, 0); ctx.lineTo(heart.x, heart.y + 8); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(heart.x, heart.y, heart.hitbox, 0, Math.PI*2); ctx.fill(); ctx.restore();
    }
    
    ctx.restore();
    animFrameId = requestAnimationFrame(renderArena);
}
