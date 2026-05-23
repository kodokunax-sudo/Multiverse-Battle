// ========== АРЕНА UNDERTALE v16 — ЧИСТЫЙ И ДИНАМИЧНЫЙ БОЙ ==========
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
let heartSpeed = 3.5;
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickId = null;
let arenaPhase = "dodge";
let arenaAttackInterval = null;
let animFrameId = null;
let heartWasMoving = false;
let heartStandingTime = 0;
let arenaSpeedMult = 0.5;
let invulnTimer = 0;
let isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

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
    
    if (!isMobile) return;
    
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
    
    canvas.addEventListener("click", (e) => {
        if (!arenaActive || arenaPhase !== "attack" || !isMobile) return;
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
        
        if (!isMobile && Math.random() > 0.5) {
            arenaTrail.push({ x: heart.x, y: heart.y, life: 8, size: heart.size * 0.6 });
        }
    } else {
        heartStandingTime++;
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 35, vy: -1.5 });
}

function checkClickTarget(mx, my) {
    for (let i = arenaClickTargets.length - 1; i >= 0; i--) {
        let t = arenaClickTargets[i];
        if (Math.sqrt((mx-t.x)**2 + (my-t.y)**2) < t.radius + 10 && !t.hit) {
            t.hit = true; arenaClicksHit++;
            arenaShake = 3;
            for (let j = 0; j < (isMobile ? 6 : 12); j++) {
                arenaParticles.push({ 
                    x: t.x, y: t.y, 
                    vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, 
                    life: 15, color: "#fff", size: 2+Math.random()*3 
                });
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

function startArena(bossWave) {
    let btn = document.getElementById("startArenaBtn");
    if (btn) btn.style.display = "none";
    let spareBtn = document.getElementById("spareBtn");
    if (spareBtn) spareBtn.style.display = "none";
    
    arenaActive = true;
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
    
    arenaSpeedMult = Math.min(3.5, 1.0 + (bossWave - 50) / 150);
    arenaAllowedTypes = getAttackTypes(bossWave);
    
    let bt = typeof bossTemplates !== 'undefined' ? bossTemplates[bossWave] : null;
    arenaBoss = bt ? bt.name : "БОСС ВРАТ";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000 + bossWave * 10;
    
    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = arenaHP;
    document.getElementById("arenaTimer").innerText = "∞";
    
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
        8: "🟥⬜ ЗОНЫ", 9: "🌀 ПУЛЬСАРЫ", 10: "🔫 БЛАСТЕРЫ"
    };
    
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + (typeNames[arenaAttackType] || "Атака");
    
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    
    let baseInterval = 1500;
    if (arenaAttackType === 2 || arenaAttackType === 3) baseInterval = 800;
    if (arenaAttackType === 6) baseInterval = 3000;
    if (arenaAttackType === 7) baseInterval = 600;
    if (arenaAttackType === 8) baseInterval = 900;
    if (arenaAttackType === 9) baseInterval = 2500;
    if (arenaAttackType === 10) baseInterval = 1200;

    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive) spawnAttack();
    }, Math.max(300, baseInterval / arenaSpeedMult));
    
    let dodgeTime = Math.max(5000, 8000 + Math.random() * 4000);
    setTimeout(() => { if (arenaPhase === "dodge" && arenaActive) startAttackPhase(); }, dodgeTime);
}

function startAttackPhase() {
    arenaPhase = "attack";
    attacks = [];
    arenaBlasters = [];
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaTotalTargets = 8 + Math.floor(arenaSpeedMult * 2); 
    arenaAttackTimeLeft = 2;
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    
    document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
    
    let usedPositions = [];
    for (let i = 0; i < arenaTotalTargets; i++) {
        let x, y, tooClose, attempts = 0;
        do {
            x = 40 + Math.random() * 320; y = 80 + Math.random() * 340;
            tooClose = false;
            for (let p of usedPositions) { if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < 50) { tooClose = true; break; } }
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
        arenaShake = 10;
    }
    
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) { winArena(); return; }
        startDodgePhase();
    }, 1500);
}

function spawnBlaster(w) {
    let bossW = typeof wave !== 'undefined' ? wave : w;
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
        timer: 120,
        width: isRainbow ? 8 : 22,
        hasHit: false
    });
}

function spawnAttack() {
    let s = arenaSpeedMult;
    let bw = typeof wave !== 'undefined' ? wave : 50;
    
    switch(arenaAttackType) {
        case 0:
            let t0 = Math.floor(Math.random() * 4);
            if (t0 === 0) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: -50-i*70, y: 60+i*80, size: 24, spd: 1.5*s, spdY: 0, color: "#fff" });
            else if (t0 === 1) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 450+i*70, y: 70+i*80, size: 24, spd: -1.5*s, spdY: 0, color: "#fff" });
            else if (t0 === 2) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 30+i*80, y: -50-i*50, size: 24, spd: 0, spdY: 1.5*s, color: "#fff" });
            else for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 40+i*80, y: 550+i*50, size: 24, spd: 0, spdY: -1.5*s, color: "#fff" });
            break;
            
        case 1:
            for (let i = 0; i < 4; i++) {
                let side = Math.floor(Math.random()*4);
                let x, y;
                if (side===0) { x=Math.random()*400; y=-40; } else if (side===1) { x=Math.random()*400; y=540; }
                else if (side===2) { x=-40; y=Math.random()*500; } else { x=440; y=Math.random()*500; }
                let angle = Math.atan2(heart.y - y, heart.x - x);
                attacks.push({ type: "square", x, y, size: 20, spd: Math.cos(angle)*1.5*s, spdY: Math.sin(angle)*1.5*s, color: "#4499ff" });
            }
            break;
            
        case 2:
            for (let i = 0; i < 3; i++) {
                let x = Math.random() * 400, y = -40;
                let angle = Math.atan2(heart.y - y, heart.x - x);
                attacks.push({ type: "sword", x, y, angle: angle, size: 40, width: 12, color: "#ffaa00", spd: Math.cos(angle)*2.5*s, spdY: Math.sin(angle)*2.5*s, damageOnStanding: true });
            }
            break;
            
        case 3:
            for (let i = 0; i < 4; i++) {
                let side = Math.floor(Math.random()*4);
                let x, y, vx, vy;
                if (side===0) { x=Math.random()*400; y=-40; vx=(Math.random()-0.5)*2*s; vy=(1.5+Math.random()*2)*s; }
                else if (side===1) { x=Math.random()*400; y=540; vx=(Math.random()-0.5)*2*s; vy=-(1.5+Math.random()*2)*s; }
                else if (side===2) { x=-40; y=Math.random()*500; vx=(1.5+Math.random()*2)*s; vy=(Math.random()-0.5)*2*s; }
                else { x=440; y=Math.random()*500; vx=-(1.5+Math.random()*2)*s; vy=(Math.random()-0.5)*2*s; }
                attacks.push({ type: "danger", x, y, size: 28, spd: vx, spdY: vy, color: "#ff3333", damageOnMoving: true });
            }
            break;
            
        case 4:
            for (let i = 0; i < 3; i++) {
                attacks.push({ type: "square", x: Math.random()*400, y: -40, size: 30, spd: 0, spdY: (1.5+Math.random())*s, color: "#ff69b4", knockback: 90 });
            }
            break;
            
        case 5:
            if (arenaHP < arenaMaxHP) {
                attacks.push({ type: "circle", x: Math.random()*400, y: -30, radius: 15, spd: (Math.random()-0.5)*s, spdY: 2*s, color: "#44ff44", heal: 3 });
            } else {
                arenaAttackType = 0; spawnAttack();
            }
            break;
            
        case 6:
            attacks.push({ type: "rainbow", x: 50+Math.random()*300, y: -60, radius: 28, spd: (Math.random()-0.5)*0.5, spdY: (0.8+Math.random()*0.5)*s, color: "rainbow", oneshot: true });
            break;
            
        case 7:
            let sx = Math.random() * 400, sy = -40;
            let sa = Math.atan2(heart.y - sy, heart.x - sx);
            attacks.push({ type: "sword", x: sx, y: sy, angle: sa, size: 40, width: 12, color: "#ffaa00", spd: Math.cos(sa)*2*s, spdY: Math.sin(sa)*2*s, damageOnStanding: true });
            attacks.push({ type: "danger", x: Math.random()*400, y: 540, size: 28, spd: (Math.random()-0.5)*s, spdY: -2*s, color: "#ff3333", damageOnMoving: true });
            break;

        case 8:
            let layout = Math.floor(Math.random() * 4);
            if (bw < 350 && layout === 3) layout = 0;
            
            if (layout === 0) {
                for(let i=0; i<3; i++) {
                    attacks.push({ type: "danger", x: -50, y: 10+Math.random()*120, size: 24, spd: 2.5*s, spdY: 0, color: "#ff3333", damageOnMoving: true });
                    attacks.push({ type: "danger", x: 450, y: 360+Math.random()*120, size: 24, spd: -2.5*s, spdY: 0, color: "#ff3333", damageOnMoving: true });
                    attacks.push({ type: "square", x: Math.random()>0.5?-50:450, y: 160+Math.random()*160, size: 24, spd: (Math.random()>0.5?2:-2)*s, spdY: 0, color: "#fff" });
                }
            } else if (layout === 1) {
                for(let i=0; i<3; i++) {
                    attacks.push({ type: "danger", x: 10+Math.random()*100, y: -50, size: 24, spd: 0, spdY: 2.5*s, color: "#ff3333", damageOnMoving: true });
                    attacks.push({ type: "danger", x: 280+Math.random()*100, y: 550, size: 24, spd: 0, spdY: -2.5*s, color: "#ff3333", damageOnMoving: true });
                    attacks.push({ type: "square", x: 130+Math.random()*140, y: Math.random()>0.5?-50:550, size: 24, spd: 0, spdY: (Math.random()>0.5?2:-2)*s, color: "#fff" });
                }
            } else if (layout === 2) {
                let ix = 100+Math.random()*200, iy = 150+Math.random()*200;
                for(let i=0; i<5; i++) {
                    let isWhite = (i === 0);
                    let px = Math.random()*400, py = Math.random()>0.5?-50:550;
                    let pAng = Math.atan2((isWhite?iy:heart.y)-py, (isWhite?ix:heart.x)-px);
                    if (isWhite) attacks.push({ type: "square", x: px, y: py, size: 24, spd: Math.cos(pAng)*2*s, spdY: Math.sin(pAng)*2*s, color: "#fff" });
                    else attacks.push({ type: "danger", x: px, y: py, size: 28, spd: Math.cos(pAng)*2.5*s, spdY: Math.sin(pAng)*2.5*s, color: "#ff3333", damageOnMoving: true });
                }
            } else {
                for(let i=0; i<4; i++) {
                    let isWhite = Math.random()>0.5;
                    let px = Math.random()*400, py = Math.random()>0.5?-50:550;
                    let pAng = Math.atan2(heart.y-py, heart.x-px);
                    if (isWhite) attacks.push({ type: "square", x: px, y: py, size: 24, spd: Math.cos(pAng)*2*s, spdY: Math.sin(pAng)*2*s, color: "#fff" });
                    else attacks.push({ type: "danger", x: px, y: py, size: 28, spd: Math.cos(pAng)*2.5*s, spdY: Math.sin(pAng)*2.5*s, color: "#ff3333", damageOnMoving: true });
                }
            }
            break;

        case 9:
            let numPulsars = bw >= 500 ? (Math.random()>0.5?2:3) : (Math.random()>0.5?1:2);
            for(let i=0; i<numPulsars; i++) {
                attacks.push({
                    type: "pulsar",
                    x: 60+Math.random()*280, y: 60+Math.random()*380,
                    spd: bw>=500 ? (Math.random()-0.5)*0.5*s : 0,
                    spdY: bw>=500 ? (Math.random()-0.5)*0.5*s : 0,
                    phase: Math.random()*Math.PI,
                    maxRadius: bw>=500 ? 50 : 60,
                    lastHit: 0, color: "#ffdd00"
                });
            }
            for(let i=0; i<3; i++) attacks.push({ type: "square", x: Math.random()*400, y: -40, size: 20, spd: 0, spdY: 2*s, color: "#fff" });
            break;

        case 10:
            spawnBlaster(bw);
            for(let i=0; i<3; i++) {
                attacks.push({ type: "square", x: Math.random()*400, y: -40, size: 20, spd: (Math.random()-0.5)*2*s, spdY: 1.8*s, color: "#fff" });
            }
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
}

function winArena() {
    stopArena();
    if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = Math.floor(currentEnemy.maxHp * 0.25);
    if (typeof victory === 'function') victory();
}

function loseArena() {
    arenaShake = 20;
    setTimeout(() => {
        stopArena();
        if (typeof playerHp !== 'undefined') playerHp = 0;
        if (typeof defeat === 'function') defeat();
    }, 1000);
}

function applyHit(dmg, textMsg = null) {
    if (invulnTimer > 0) return;
    
    arenaHP -= dmg;
    arenaHitFlash = 10;
    invulnTimer = 40; 
    arenaShake = 8;
    
    if (!isMobile) spawnFloatingText(heart.x, heart.y - 20, textMsg || "-" + dmg, "#ff4444");
    document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
    
    for (let j = 0; j < (isMobile ? 5 : 10); j++) {
        arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 20, color: "#f00", size: 2+Math.random()*3 });
    }
    if (arenaHP <= 0) loseArena();
}

function renderArena() {
    if (!arenaActive || !ctx) return;
    let now = Date.now();
    
    if (arenaPhase === "dodge") {
        moveHeart();
        if (arenaAllowedTypes.includes(10) && !heartWasMoving) {
            let bw = typeof wave !== 'undefined' ? wave : 50;
            let camperThreshold = bw >= 700 ? 120 : (bw >= 350 ? 150 : 180);
            if (heartStandingTime > camperThreshold) {
                spawnBlaster(bw);
                heartStandingTime = 0;
            }
        }
    }
    
    let sx = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    let sy = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    if (arenaShake > 0) arenaShake *= 0.85;
    if (arenaHitFlash > 0) arenaHitFlash--;
    if (invulnTimer > 0) invulnTimer--;
    if (arenaComboTimer > 0) arenaComboTimer--;
    
    ctx.save();
    ctx.translate(sx, sy);
    ctx.clearRect(-10, -10, 420, 520);
    
    ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, 400, 500);
    
    // Рамка
    let borderColor = arenaPhase === "attack" ? "#ffdd00" : (["#fff","#4499ff","#ffdd00","#ff3333","#ff69b4","#44ff44","rainbow","#ffaa00","#ff3333","#ffdd00","#fff"][arenaAttackType] || "#fff");
    if (borderColor === "rainbow" || arenaAttackType === 6) borderColor = `hsl(${(now/5)%360}, 100%, 50%)`;
    if (arenaHitFlash > 0) borderColor = "#ff0000";
    
    ctx.strokeStyle = borderColor; ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 496);
    
    // HP
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8, 6, 384, 22);
    ctx.fillStyle = "#400"; ctx.fillRect(14, 12, 372, 5);
    ctx.fillStyle = arenaHitFlash > 0 ? "#fff" : "#0f0"; 
    ctx.fillRect(14, 12, 372 * Math.max(0, arenaHP/arenaMaxHP), 5);
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif";
    ctx.fillText(`❤️ ${Math.max(0, arenaHP)} / ${arenaMaxHP}`, 16, 24);
    
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8, 32, 384, 14);
    let maxHp = (typeof currentEnemy !== 'undefined' && currentEnemy) ? currentEnemy.maxHp : 1000;
    ctx.fillStyle = "#222"; ctx.fillRect(14, 36, 372, 3);
    ctx.fillStyle = "#ff0"; ctx.fillRect(14, 36, 372 * Math.max(0, arenaBossMaxHP/maxHp), 3);
    ctx.fillStyle = "#aaa"; ctx.font = "bold 8px sans-serif";
    ctx.fillText(`👾 ${arenaBoss}`, 16, 42);
    
    // Комбо текст
    if (arenaComboTimer > 0 && arenaComboText) {
        ctx.fillStyle = `rgba(255, 255, 0, ${Math.min(1, arenaComboTimer/20)})`;
        ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(arenaComboText, 200, 260); ctx.textAlign = "left";
    }
    
    if (arenaPhase === "dodge") {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            
            if (a.type === "pulsar") {
                a.spd ? a.x += a.spd : 0; a.spdY ? a.y += a.spdY : 0;
                a.phase += 0.05 * arenaSpeedMult;
                a.radius = 5 + Math.abs(Math.sin(a.phase)) * (a.maxRadius - 5);
                
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.abs(Math.sin(a.phase))*0.4;
                ctx.fillStyle = a.color;
                ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.restore();
                
                if (a.radius > 15 && invulnTimer <= 0) {
                    let dx = heart.x - a.x, dy = heart.y - a.y;
                    if (Math.sqrt(dx*dx + dy*dy) < (a.radius + heart.hitbox)) {
                        if (now - (a.lastHit || 0) > 300) {
                            applyHit(5, "ПУЛЬСАР!");
                            a.lastHit = now;
                        }
                    }
                }
                continue;
            }
            
            a.spd ? a.x += a.spd : 0; a.spdY ? a.y += a.spdY : 0;
            
            let sz = a.size || a.radius || 20;
            if (a.spd) if (a.x < 5 || a.x > 395 - sz) a.spd *= -1;
            if (a.spdY) if (a.y < 5 || a.y > 495 - sz) a.spdY *= -1;
            a.x = Math.max(5, Math.min(395 - sz, a.x));
            a.y = Math.max(5, Math.min(495 - sz, a.y));

            let hit = false;
            let cx = a.x + (a.size ? a.size/2 : 0), cy = a.y + (a.size ? a.size/2 : 0);
            
            if (a.type === "circle" || a.type === "rainbow") {
                let dx = heart.x - a.x, dy = heart.y - a.y;
                hit = Math.sqrt(dx*dx + dy*dy) < (heart.hitbox + a.radius - 2);
            } else if (a.type === "sword") {
                let dx = heart.x - a.x, dy = heart.y - a.y;
                hit = Math.sqrt(dx*dx + dy*dy) < (heart.hitbox + a.size/2); 
            } else {
                hit = Math.abs(heart.x - cx) < (sz/2 + heart.hitbox) && Math.abs(heart.y - cy) < (sz/2 + heart.hitbox);
            }
            
            if (hit && invulnTimer <= 0) {
                if (a.damageOnStanding && !heartWasMoving) { applyHit(6, "ДВИГАЙСЯ!"); attacks.splice(i, 1); continue; }
                if (a.damageOnMoving && heartWasMoving) { applyHit(6, "СТОЙ!"); attacks.splice(i, 1); continue; }
                if (a.knockback) {
                    let dx = heart.x - a.x, dy = heart.y - a.y;
                    let dist = Math.sqrt(dx*dx+dy*dy) || 1;
                    heart.x += (dx/dist)*a.knockback;
                    heart.y += (dy/dist)*a.knockback;
                    clampHeart();
                    attacks.splice(i, 1); continue;
                }
                if (a.heal) {
                    arenaHP = Math.min(arenaMaxHP, arenaHP + a.heal);
                    attacks.splice(i, 1); continue;
                }
                if (a.oneshot) { applyHit(999, "ФАТАЛЬНО!"); continue; }
                
                if (!a.damageOnStanding && !a.damageOnMoving && !a.heal && !a.knockback && !a.oneshot) {
                    applyHit(5); attacks.splice(i, 1); continue;
                }
            }
            
            if (a.y > 600 || a.y < -100 || a.x < -100 || a.x > 500) { attacks.splice(i, 1); continue; }
            
            ctx.save();
            let col = a.color;
            if (a.type === "rainbow") col = `hsl(${(now/2 + a.x)%360}, 100%, 60%)`;
            
            ctx.fillStyle = col;
            
            if (a.type === "square" || a.type === "danger") {
                ctx.translate(a.x + sz/2, a.y + sz/2);
                if (a.type === "danger") {
                    ctx.beginPath(); ctx.moveTo(0, -sz/2); ctx.lineTo(sz/2, 0); ctx.lineTo(0, sz/2); ctx.lineTo(-sz/2, 0); ctx.fill();
                } else {
                    ctx.fillRect(-sz/2, -sz/2, sz, sz);
                    if (!isMobile) ctx.clearRect(-sz/4, -sz/4, sz/2, sz/2);
                }
            } else if (a.type === "sword") {
                ctx.translate(a.x, a.y); ctx.rotate(a.angle || 0);
                ctx.beginPath(); ctx.moveTo(a.size, 0); ctx.lineTo(0, a.width/2); ctx.lineTo(-a.size, 0); ctx.lineTo(0, -a.width/2); ctx.fill();
            } else if (a.type === "circle" || a.type === "rainbow") {
                ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
                if (a.type === "rainbow") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(a.x, a.y, a.radius*0.5, 0, Math.PI*2); ctx.fill(); }
            }
            ctx.restore();
        }

        // Бластеры
        for (let i = arenaBlasters.length - 1; i >= 0; i--) {
            let b = arenaBlasters[i];
            let actualColor = b.color === "rainbow" ? `hsl(${(now/2)%360}, 100%, 60%)` : b.color;
            
            if (b.state === "aiming") {
                if (b.timer > 30) b.angle = Math.atan2(heart.y - b.y, heart.x - b.x);
                
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.abs(Math.sin(b.timer * 0.2)) * 0.3;
                ctx.strokeStyle = actualColor; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.angle)*800, b.y + Math.sin(b.angle)*800); ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.globalAlpha = 1; ctx.translate(b.x, b.y); ctx.rotate(b.angle);
                ctx.fillStyle = "#222"; ctx.fillRect(-12, -12, 24, 24);
                ctx.fillStyle = actualColor; ctx.fillRect(3, -4, 10, 8);
                ctx.restore();
                
                b.timer--;
                if (b.timer <= 0) { b.state = "firing"; b.timer = 15; arenaShake = 12; }
            } 
            else if (b.state === "firing") {
                ctx.save();
                ctx.strokeStyle = actualColor; ctx.lineWidth = b.width + Math.random()*4;
                ctx.shadowBlur = 15; ctx.shadowColor = actualColor;
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.angle)*800, b.y + Math.sin(b.angle)*800); ctx.stroke();
                ctx.restore();
                
                if (!b.hasHit && invulnTimer <= 0) {
                    let dx = heart.x - b.x, dy = heart.y - b.y;
                    let dist = Math.abs(dx * Math.sin(b.angle) - dy * Math.cos(b.angle));
                    if (dist < b.width / 2 + heart.hitbox) {
                        let dmg = 0; let msg = "";
                        if (b.color === "rainbow") { applyHit(999, "ФАТАЛЬНО!"); }
                        else if (b.color === "#fff") { dmg = 12; msg = "ЛУЧ!"; }
                        else if (b.color === "#ffdd00") { if (!heartWasMoving) { dmg = 24; msg = "СТОЙ!"; } else { dmg = 6; msg = "ЛУЧ!"; } }
                        else if (b.color === "#ff3333") { if (heartWasMoving) { dmg = 24; msg = "ДВИГАЙСЯ!"; } else { dmg = 6; msg = "ЛУЧ!"; } }
                        
                        if (dmg > 0) applyHit(dmg, msg);
                        b.hasHit = true;
                    }
                }
                
                b.timer--;
                if (b.timer <= 0) { b.state = "fading"; b.timer = 20; }
            }
            else if (b.state === "fading") {
                ctx.save();
                ctx.globalAlpha = b.timer / 20; ctx.strokeStyle = actualColor; ctx.lineWidth = b.width;
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.angle)*800, b.y + Math.sin(b.angle)*800); ctx.stroke();
                ctx.restore();
                
                b.timer--;
                if (b.timer <= 0) arenaBlasters.splice(i, 1);
            }
        }
        
        // Шлейф (только ПК)
        if (!isMobile) {
            for (let i = arenaTrail.length - 1; i >= 0; i--) {
                let t = arenaTrail[i]; t.life--;
                if (t.life <= 0) { arenaTrail.splice(i, 1); continue; }
                ctx.fillStyle = `rgba(255, 50, 50, ${(t.life/8)*0.5})`;
                ctx.beginPath(); ctx.arc(t.x, t.y, t.size*(t.life/8), 0, Math.PI*2); ctx.fill();
            }
        }
        
        // Сердечко
        if (invulnTimer === 0 || Math.floor(now / 100) % 2 === 0) {
            let hx = heart.x, hy = heart.y, s = heart.size;
            
            if (!isMobile) {
                ctx.fillStyle = "rgba(255,0,0,0.3)";
                ctx.shadowBlur = 15; ctx.shadowColor = "#ff0000";
                ctx.beginPath(); ctx.arc(hx, hy, s+3, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            ctx.fillStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(hx, hy + s*0.3);
            ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
            ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.3);
            ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
            ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
            ctx.fill();
            
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.beginPath(); ctx.arc(hx, hy + s*0.3, heart.hitbox, 0, Math.PI*2); ctx.fill();
        }
    }
    
    if (arenaPhase === "attack") {
        arenaClickTargets.forEach(t => {
            t.pulse += 0.1;
            let r = t.radius + Math.sin(t.pulse)*3;
            
            ctx.fillStyle = t.hit ? "rgba(0, 255, 0, 0.6)" : "rgba(255, 200, 0, 0.7)";
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = t.hit ? "#0f0" : "#fff"; ctx.lineWidth = 2; ctx.stroke();
            
            if (!t.hit) {
                let innerR = r * (arenaAttackTimeLeft / 2);
                ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(t.x, t.y, innerR, 0, Math.PI*2); ctx.stroke();
            }
        });
    }
    
    // Частицы
    ctx.shadowBlur = 0;
    for (let i = arenaParticles.length - 1; i >= 0; i--) {
        let p = arenaParticles[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life--;
        if (p.life <= 0) { arenaParticles.splice(i, 1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life/20;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Всплывающий текст (только ПК)
    if (!isMobile) {
        ctx.textAlign = "center"; ctx.font = "bold 14px sans-serif";
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            let ft = floatingTexts[i];
            ft.y += ft.vy; ft.life--;
            if (ft.life <= 0) { floatingTexts.splice(i, 1); continue; }
            ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life / 35;
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1; ctx.textAlign = "left";
    }
    
    ctx.restore();
    animFrameId = requestAnimationFrame(renderArena);
}
