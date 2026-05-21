// ========== АРЕНА UNDERTALE v14 — ULTRA UPDATE ==========
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
let heart = { x: 200, y: 400, size: 14, hitbox: 4 }; // Уменьшен хитбокс для честности
let attacks = [];
let canvas = null;
let ctx = null;
let arenaParticles = [];
let floatingTexts = []; // Всплывающий урон/текст
let arenaShake = 0;
let arenaHitFlash = 0;
let arenaComboText = "";
let arenaComboTimer = 0;
let arenaTrail = [];
let keys = { w: false, a: false, s: false, d: false, up: false, left: false, down: false, right: false };
let heartSpeed = 3.5; // Чуть быстрее для динамики
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickId = null;
let arenaPhase = "dodge";
let arenaInterval = null;
let arenaAttackInterval = null;
let animFrameId = null;
let heartWasMoving = false;
let heartStandingTime = 0;
let arenaSpeedMult = 1.0;
let invulnTimer = 0; // Кадры неуязвимости

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
    
    canvas.addEventListener("mousemove", (e) => {
        if (!arenaActive || arenaPhase !== "dodge") return;
        if (keys.w || keys.a || keys.s || keys.d || keys.up || keys.down || keys.left || keys.right || joystickActive) return;
        let rect = canvas.getBoundingClientRect();
        heart.x = e.clientX - rect.left;
        heart.y = e.clientY - rect.top;
        clampHeart();
    });
    
    const handleTouch = (e) => {
        if (!arenaActive) return;
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        if (arenaPhase === "attack") {
            for (let i = 0; i < e.touches.length; i++) {
                checkClickTarget(e.touches[i].clientX - rect.left, e.touches[i].clientY - rect.top);
            }
            return;
        }
    };

    canvas.addEventListener("touchstart", (e) => {
        handleTouch(e);
        if (arenaPhase === "dodge" && e.touches.length === 1) {
            joystickActive = true; joystickId = e.touches[0].identifier;
            let rect = canvas.getBoundingClientRect();
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
    
    if (joystickActive) { 
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
        
        // Красивый шлейф
        if (Math.random() > 0.3) {
            arenaTrail.push({ x: heart.x, y: heart.y, life: 10, size: heart.size * 0.8 });
        }
    } else {
        heartStandingTime++;
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 40, vy: -1.5 });
}

function checkClickTarget(mx, my) {
    for (let i = arenaClickTargets.length - 1; i >= 0; i--) {
        let t = arenaClickTargets[i];
        if (Math.sqrt((mx-t.x)**2 + (my-t.y)**2) < t.radius + 10 && !t.hit) {
            t.hit = true; arenaClicksHit++;
            arenaShake = 3;
            // Сочный взрыв при клике
            for (let j = 0; j < 12; j++) {
                arenaParticles.push({ 
                    x: t.x, y: t.y, 
                    vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, 
                    life: 20 + Math.random()*10, color: "#fff", size: 2+Math.random()*4 
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
    if (bossWave <= 50) return [0, 1];
    if (bossWave <= 100) return [2, 3];
    if (bossWave <= 150) return [1, 4];
    if (bossWave <= 200) return [0, 5, 6]; // Радужные раньше
    if (bossWave <= 300) return [7, 2, 6];
    if (bossWave <= 500) return [3, 4, 6, 7];
    return [0,1,2,3,4,5,6,7];
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
    
    arenaSpeedMult = 1.0 + (bossWave - 50) / 100 * 0.4;
    
    let bt = typeof bossTemplates !== 'undefined' ? bossTemplates[bossWave] : null;
    arenaBoss = bt ? bt.name : "БОСС";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000;
    
    let types = getAttackTypes(bossWave);
    arenaAttackType = types[Math.floor(Math.random() * types.length)];
    
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
    heart.x = 200; heart.y = 400;
    let typeNames = ["⬜ ОБЫЧНЫЕ", "🔷 ХАОС", "⚡ ЖЁЛТЫЕ (СТОЙ!)", "🛑 КРАСНЫЕ (БЕГИ!)", "💗 РОЗОВЫЕ", "💚 ЗЕЛЁНЫЕ", "🌈 РАДУЖНЫЕ (СМЕРТЬ)", "⚡🛑 ЖЁЛТО-КРАСНЫЕ"];
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + (typeNames[arenaAttackType] || "Атака");
    
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    
    let baseInterval = 1500;
    if (arenaAttackType === 2 || arenaAttackType === 3) baseInterval = 800;
    if (arenaAttackType === 6) baseInterval = 3000; // Радужные спавнятся реже
    if (arenaAttackType === 7) baseInterval = 600;
    
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive) spawnAttack();
    }, Math.max(300, baseInterval / arenaSpeedMult));
    
    let dodgeTime = 8000 + Math.random() * 4000;
    setTimeout(() => { if (arenaPhase === "dodge" && arenaActive) startAttackPhase(); }, dodgeTime);
}

function startAttackPhase() {
    arenaPhase = "attack";
    attacks = [];
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaTotalTargets = 8 + Math.floor(arenaSpeedMult * 2); // Больше кругов на высоких уровнях
    arenaAttackTimeLeft = 2;
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    
    document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
    
    let usedPositions = [];
    for (let i = 0; i < arenaTotalTargets; i++) {
        let x, y, tooClose, attempts = 0;
        do {
            x = 40 + Math.random() * 320; y = 80 + Math.random() * 340;
            tooClose = false;
            for (let p of usedPositions) { if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < 55) { tooClose = true; break; } }
            attempts++;
        } while (tooClose && attempts < 50);
        usedPositions.push({x, y});
        arenaClickTargets.push({ x, y, radius: 26, hit: false, pulse: Math.random()*Math.PI*2, spawnAnim: 0 });
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
    
    if (ratio >= 1.0) { dmgMult = 2.5; arenaComboText = "ИДЕАЛЬНО! x2.5"; arenaShake = 15; }
    else if (ratio >= 0.7) { dmgMult = 1.5; arenaComboText = "ОТЛИЧНО! x1.5"; arenaShake = 10; }
    else if (ratio >= 0.4) { dmgMult = 1.0; arenaComboText = "ХОРОШО! x1"; arenaShake = 5; }
    else if (ratio > 0) { dmgMult = 0.5; arenaComboText = "СЛАБО... x0.5"; }
    else { arenaComboText = "ПРОМАХ!"; dmgMult = 0; }
    
    arenaComboTimer = 60;
    let baseDmg = typeof window !== 'undefined' && window.playerFinalDamage ? window.playerFinalDamage : 20;
    let finalDmg = Math.floor(baseDmg * dmgMult);
    
    if (finalDmg > 0) {
        arenaBossMaxHP -= finalDmg;
        spawnFloatingText(200, 150, "-" + finalDmg, "#fff");
        for (let i = 0; i < 40; i++) {
            arenaParticles.push({ 
                x: 200 + (Math.random()-0.5)*100, y: 200 + (Math.random()-0.5)*100, 
                vx: (Math.random()-0.5)*20, vy: (Math.random()-0.5)*20, 
                life: 30 + Math.random()*20, color: Math.random()<0.5?"#ff0":"#fff", size: 3+Math.random()*6 
            });
        }
    }
    
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) { winArena(); return; }
        let types = getAttackTypes(typeof wave !== 'undefined' ? wave : 50);
        arenaAttackType = types[Math.floor(Math.random() * types.length)];
        startDodgePhase();
    }, 1500);
}

function spawnAttack() {
    let s = arenaSpeedMult;
    let time = Date.now();
    
    switch(arenaAttackType) {
        case 0: // Белые — ровные ряды
            let t0 = Math.floor(Math.random() * 4);
            if (t0 === 0) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: -50-i*70, y: 60+i*80, size: 24, speedX: 1.5*s, speedY: 0, color: "#fff", angle: i });
            else if (t0 === 1) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 450+i*70, y: 70+i*80, size: 24, speedX: -1.5*s, speedY: 0, color: "#fff", angle: i });
            else if (t0 === 2) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 30+i*80, y: -50-i*50, size: 24, speedX: 0, speedY: 1.5*s, color: "#fff", angle: i });
            else for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 40+i*80, y: 550+i*50, size: 24, speedX: 0, speedY: -1.5*s, color: "#fff", angle: i });
            break;
            
        case 1: // Синие — наводятся
            for (let i = 0; i < 4; i++) {
                let side = Math.floor(Math.random()*4);
                let x, y;
                if (side===0) { x=Math.random()*400; y=-40; }
                else if (side===1) { x=Math.random()*400; y=540; }
                else if (side===2) { x=-40; y=Math.random()*500; }
                else { x=440; y=Math.random()*500; }
                
                let angle = Math.atan2(heart.y - y, heart.x - x);
                attacks.push({ type: "square", x, y, size: 20, speedX: Math.cos(angle)*1.5*s, speedY: Math.sin(angle)*1.5*s, color: "#4499ff", angle: 0, rotSpeed: 0.1 });
            }
            break;
            
        case 2: // Жёлтые мечи — СТОЙ
            for (let i = 0; i < 3; i++) {
                let x = Math.random() * 400, y = -40;
                let angle = Math.atan2(heart.y - y, heart.x - x);
                attacks.push({ type: "sword", x, y, angle: angle, rotSpeed: 0, size: 40, width: 12, color: "#ffaa00", speedX: Math.cos(angle)*2.5*s, speedY: Math.sin(angle)*2.5*s, damageOnStanding: true });
            }
            break;
            
        case 3: // Красные — БЕГИ
            for (let i = 0; i < 4; i++) {
                let side = Math.floor(Math.random()*4);
                let x, y, vx, vy;
                if (side===0) { x=Math.random()*400; y=-40; vx=(Math.random()-0.5)*2*s; vy=(1.5+Math.random()*2)*s; }
                else if (side===1) { x=Math.random()*400; y=540; vx=(Math.random()-0.5)*2*s; vy=-(1.5+Math.random()*2)*s; }
                else if (side===2) { x=-40; y=Math.random()*500; vx=(1.5+Math.random()*2)*s; vy=(Math.random()-0.5)*2*s; }
                else { x=440; y=Math.random()*500; vx=-(1.5+Math.random()*2)*s; vy=(Math.random()-0.5)*2*s; }
                attacks.push({ type: "danger", x, y, size: 28, speedX: vx, speedY: vy, color: "#ff3333", damageOnMoving: true, angle: Math.random() });
            }
            break;
            
        case 4: // Розовые — откидывают
            for (let i = 0; i < 3; i++) {
                attacks.push({ type: "square", x: Math.random()*400, y: -40, size: 30, speedX: 0, speedY: (1.5+Math.random())*s, color: "#ff69b4", knockback: 90, angle: 0, rotSpeed: 0.05 });
            }
            break;
            
        case 5: // Зелёные — хилят
            if (arenaHP < arenaMaxHP) {
                attacks.push({ type: "circle", x: Math.random()*400, y: -30, radius: 15, speedX: (Math.random()-0.5)*s, speedY: 2*s, color: "#44ff44", heal: 3 });
            } else {
                arenaAttackType = 0; spawnAttack();
            }
            break;
            
        case 6: // Радужные — ВАНШОТ. Исправлено на radius!
            let rx = 50 + Math.random() * 300;
            attacks.push({ type: "rainbow", x: rx, y: -60, radius: 28, speedX: (Math.random()-0.5)*0.5, speedY: (0.8 + Math.random()*0.5)*s, color: "rainbow", oneshot: true });
            break;
            
        case 7: // ЖЁЛТЫЕ + КРАСНЫЕ
            let x = Math.random() * 400, y = -40;
            let angle = Math.atan2(heart.y - y, heart.x - x);
            attacks.push({ type: "sword", x, y, angle: angle, rotSpeed: 0, size: 40, width: 12, color: "#ffaa00", speedX: Math.cos(angle)*2*s, speedY: Math.sin(angle)*2*s, damageOnStanding: true });
            attacks.push({ type: "danger", x: Math.random()*400, y: 540, size: 28, speedX: (Math.random()-0.5)*s, speedY: -2*s, color: "#ff3333", damageOnMoving: true, angle: 0 });
            break;
    }
}

function stopArena() {
    arenaActive = false;
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    arenaAttackInterval = null; animFrameId = null;
    attacks = []; arenaClickTargets = []; arenaParticles = []; arenaTrail = []; floatingTexts = [];
    document.getElementById("arenaOverlay").style.display = "none";
}

function winArena() {
    stopArena();
    if (typeof currentEnemy !== 'undefined' && currentEnemy) {
        currentEnemy.hp = Math.floor(currentEnemy.maxHp * 0.25);
    }
    if (typeof victory === 'function') victory();
}

function loseArena() {
    // Предсмертная анимация
    arenaShake = 20;
    for (let i = 0; i < 30; i++) {
        arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 40, color: "#f00", size: 3+Math.random()*5 });
    }
    setTimeout(() => {
        stopArena();
        if (typeof playerHp !== 'undefined') playerHp = 0;
        if (typeof defeat === 'function') defeat();
    }, 1000);
}

function applyHit(dmg, textMsg = null) {
    if (invulnTimer > 0) return; // Неуязвимость
    
    arenaHP -= dmg;
    arenaHitFlash = 10;
    invulnTimer = 40; // ~40 кадров неуязвимости
    arenaShake = 8;
    
    spawnFloatingText(heart.x, heart.y - 20, textMsg || "-" + dmg, "#ff4444");
    document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
    
    for (let j = 0; j < 10; j++) {
        arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 25, color: "#f00", size: 2+Math.random()*3 });
    }
    if (arenaHP <= 0) loseArena();
}

function renderArena() {
    if (!arenaActive || !ctx) return;
    
    let now = Date.now();
    if (arenaPhase === "dodge") moveHeart();
    
    let sx = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    let sy = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    if (arenaShake > 0) arenaShake *= 0.85;
    if (arenaHitFlash > 0) arenaHitFlash--;
    if (invulnTimer > 0) invulnTimer--;
    if (arenaComboTimer > 0) arenaComboTimer--;
    
    ctx.save();
    ctx.translate(sx, sy);
    ctx.clearRect(-10, -10, 420, 520);
    
    // Эпичный фон
    ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, 400, 500);
    
    // Скроллящаяся сетка
    let scrollY = (now / 20) % 40;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx <= 400; gx += 40) { ctx.moveTo(gx, 0); ctx.lineTo(gx, 500); }
    for (let gy = -40; gy <= 500; gy += 40) { ctx.moveTo(0, gy + scrollY); ctx.lineTo(400, gy + scrollY); }
    ctx.stroke();
    
    // Рамка арены
    let borderColor = arenaPhase === "attack" ? "#ffdd00" : (["#fff","#4499ff","#ffdd00","#ff3333","#ff69b4","#44ff44","rainbow","#ff8800"][arenaAttackType] || "#fff");
    if (borderColor === "rainbow") borderColor = `hsl(${(now/5)%360}, 100%, 50%)`;
    
    if (arenaHitFlash > 0) borderColor = "#ff0000";
    
    ctx.strokeStyle = borderColor; ctx.lineWidth = 4 + Math.sin(now/100)*1.5;
    ctx.shadowBlur = 15; ctx.shadowColor = borderColor;
    ctx.strokeRect(2, 2, 396, 496);
    ctx.shadowBlur = 0;
    
    // UI ХП и Босса
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8, 6, 384, 24);
    ctx.fillStyle = "#400"; ctx.fillRect(14, 14, 372, 6);
    ctx.fillStyle = arenaHitFlash > 0 ? "#fff" : "#0f0"; 
    ctx.fillRect(14, 14, 372 * Math.max(0, arenaHP/arenaMaxHP), 6);
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif";
    ctx.fillText(`❤️ HP: ${Math.max(0, arenaHP)} / ${arenaMaxHP}`, 16, 26);
    
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8, 34, 384, 16);
    let maxHp = (typeof currentEnemy !== 'undefined' && currentEnemy) ? currentEnemy.maxHp : 1000;
    ctx.fillStyle = "#222"; ctx.fillRect(14, 40, 372, 4);
    ctx.fillStyle = "#ff0"; ctx.fillRect(14, 40, 372 * Math.max(0, arenaBossMaxHP/maxHp), 4);
    ctx.fillStyle = "#aaa"; ctx.font = "bold 9px sans-serif";
    ctx.fillText(`👾 ${arenaBoss}`, 16, 48);
    
    // Текст комбо
    if (arenaComboTimer > 0 && arenaComboText) {
        ctx.fillStyle = `rgba(255, 255, 0, ${Math.min(1, arenaComboTimer/20)})`;
        ctx.font = "bold 26px sans-serif"; 
        ctx.textAlign = "center";
        ctx.fillText(arenaComboText, 200, 250);
        ctx.textAlign = "left";
    }
    
    if (arenaPhase === "dodge") {
        // Отрисовка и логика атак
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            
            a.x += a.speedX || 0;
            a.y += a.speedY || 0;
            if (a.rotSpeed) a.angle = (a.angle || 0) + a.rotSpeed;
            
            // Отскок от стен
            let size = a.size || a.radius || 20;
            if (a.x < 5 || a.x > 395 - size) a.speedX *= -1;
            if (a.y < 5 || a.y > 495 - size) a.speedY *= -1;
            
            a.x = Math.max(5, Math.min(395 - size, a.x));
            a.y = Math.max(5, Math.min(495 - size, a.y));

            // Столкновение (Честный хитбокс)
            let hit = false;
            let cx = a.x + (a.size ? a.size/2 : 0);
            let cy = a.y + (a.size ? a.size/2 : 0);
            
            if (a.type === "circle" || a.type === "rainbow") {
                let dx = heart.x - a.x, dy = heart.y - a.y;
                hit = Math.sqrt(dx*dx + dy*dy) < (heart.hitbox + a.radius - 2);
            } else if (a.type === "sword") {
                let dx = heart.x - a.x, dy = heart.y - a.y;
                hit = Math.sqrt(dx*dx + dy*dy) < (heart.hitbox + a.size/2); // Упрощенный хитбокс меча
            } else {
                hit = Math.abs(heart.x - cx) < (a.size/2 + heart.hitbox) && 
                      Math.abs(heart.y - cy) < (a.size/2 + heart.hitbox);
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
                    spawnFloatingText(heart.x, heart.y, "BOOP!", "#ff69b4");
                    attacks.splice(i, 1); continue;
                }
                if (a.heal) {
                    let healAmt = a.heal;
                    arenaHP = Math.min(arenaMaxHP, arenaHP + healAmt);
                    spawnFloatingText(heart.x, heart.y, "+" + healAmt, "#44ff44");
                    attacks.splice(i, 1); continue;
                }
                if (a.oneshot) { applyHit(999, "ФАТАЛЬНО!"); continue; }
                
                if (!a.damageOnStanding && !a.damageOnMoving && !a.heal && !a.knockback && !a.oneshot) {
                    applyHit(5); attacks.splice(i, 1); continue;
                }
            }
            
            // Удаление старых
            if (a.y > 600 || a.y < -100 || a.x < -100 || a.x > 500) { attacks.splice(i, 1); continue; }
            
            // Отрисовка атаки
            ctx.save();
            let col = a.color;
            if (a.type === "rainbow") col = `hsl(${(now/2 + a.x)%360}, 100%, 60%)`;
            
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = a.type === "rainbow" ? 25 : 10;
            
            if (a.type === "square" || a.type === "danger") {
                ctx.translate(a.x + a.size/2, a.y + a.size/2);
                ctx.rotate(a.angle || 0);
                if (a.type === "danger") {
                    ctx.beginPath();
                    ctx.moveTo(0, -a.size/2); ctx.lineTo(a.size/2, 0);
                    ctx.lineTo(0, a.size/2); ctx.lineTo(-a.size/2, 0);
                    ctx.fill();
                } else {
                    ctx.fillRect(-a.size/2, -a.size/2, a.size, a.size);
                    ctx.clearRect(-a.size/4, -a.size/4, a.size/2, a.size/2); // Пустой центр
                }
            } else if (a.type === "sword") {
                ctx.translate(a.x, a.y);
                ctx.rotate(a.angle);
                ctx.beginPath();
                ctx.moveTo(a.size, 0);
                ctx.lineTo(0, a.width/2);
                ctx.lineTo(-a.size, 0);
                ctx.lineTo(0, -a.width/2);
                ctx.fill();
            } else if (a.type === "circle" || a.type === "rainbow") {
                ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
                if (a.type === "rainbow") {
                    ctx.fillStyle = "#fff";
                    ctx.beginPath(); ctx.arc(a.x, a.y, a.radius*0.5, 0, Math.PI*2); ctx.fill();
                }
            }
            ctx.restore();
        }
        
        // Шлейф от сердечка
        for (let i = arenaTrail.length - 1; i >= 0; i--) {
            let t = arenaTrail[i]; t.life--;
            if (t.life <= 0) { arenaTrail.splice(i, 1); continue; }
            ctx.fillStyle = `rgba(255, 50, 50, ${(t.life/10)*0.6})`;
            ctx.beginPath(); ctx.arc(t.x, t.y, t.size*(t.life/10), 0, Math.PI*2); ctx.fill();
        }
        
        // Отрисовка Сердечка (Души)
        if (invulnTimer === 0 || Math.floor(now / 100) % 2 === 0) {
            let hx = heart.x, hy = heart.y, s = heart.size;
            
            // Свечение
            ctx.shadowBlur = 15; ctx.shadowColor = "#ff0000";
            ctx.fillStyle = "#ff0000";
            
            // Рисуем форму сердца
            ctx.beginPath();
            ctx.moveTo(hx, hy + s*0.3);
            ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
            ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.3);
            ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
            ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
            ctx.fill();
            
            // Центр (Реальный хитбокс) - маленькая белая точка для точности
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.beginPath(); ctx.arc(hx, hy + s*0.3, heart.hitbox, 0, Math.PI*2); ctx.fill();
        }
    }
    
    if (arenaPhase === "attack") {
        arenaClickTargets.forEach(t => {
            t.pulse += 0.1;
            t.spawnAnim = Math.min(1, (t.spawnAnim || 0) + 0.1);
            
            let r = t.radius * t.spawnAnim + Math.sin(t.pulse)*2;
            
            ctx.fillStyle = t.hit ? "rgba(0, 255, 0, 0.4)" : "rgba(255, 200, 0, 0.4)";
            ctx.shadowBlur = t.hit ? 20 : 10; 
            ctx.shadowColor = t.hit ? "#0f0" : "#ffaa00";
            
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = t.hit ? "#0f0" : "#fff"; 
            ctx.lineWidth = 3; 
            ctx.stroke();
            
            if (!t.hit) {
                // Внутреннее кольцо, сужающееся ко времени
                let innerR = r * (arenaAttackTimeLeft / 2);
                ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(t.x, t.y, innerR, 0, Math.PI*2); ctx.stroke();
            }
        });
    }
    
    // Частицы взрывов
    ctx.shadowBlur = 0;
    for (let i = arenaParticles.length - 1; i >= 0; i--) {
        let p = arenaParticles[i];
        p.x += p.vx; p.y += p.vy; 
        p.vx *= 0.95; p.vy *= 0.95; // Трение
        p.life--;
        if (p.life <= 0) { arenaParticles.splice(i, 1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life/30;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Всплывающий текст (урон/хил)
    ctx.textAlign = "center";
    ctx.font = "bold 16px sans-serif";
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life--;
        if (ft.life <= 0) { floatingTexts.splice(i, 1); continue; }
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 40;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
    
    ctx.restore();
    animFrameId = requestAnimationFrame(renderArena);
}
 
