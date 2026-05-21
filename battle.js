// ========== АРЕНА UNDERTALE v12 ==========
// ВСЕ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ УЖЕ В game.js, ЗДЕСЬ ТОЛЬКО АРЕНА

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
let heart = { x: 200, y: 400, size: 15 };
let attacks = [];
let canvas = null;
let ctx = null;
let arenaParticles = [];
let arenaShake = 0;
let arenaHitFlash = 0;
let arenaComboText = "";
let arenaComboTimer = 0;
let arenaTrail = [];
let keys = { w: false, a: false, s: false, d: false, up: false, left: false, down: false, right: false };
let heartSpeed = 2.5;
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickId = null;
let arenaPhase = "dodge";
let arenaInterval = null;
let arenaAttackInterval = null;
let arenaBgTime = 0;
let heartWasMoving = false;
let heartStandingTime = 0;
let arenaSpeedMult = 1.0;

function initArena() {
    canvas = document.getElementById("arenaCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    
    window.addEventListener("keydown", (e) => {
        let k = e.key.toLowerCase();
        if (k in keys) { keys[k] = true; e.preventDefault(); }
        if (k === "arrowup") { keys.up = true; e.preventDefault(); }
        if (k === "arrowdown") { keys.down = true; e.preventDefault(); }
        if (k === "arrowleft") { keys.left = true; e.preventDefault(); }
        if (k === "arrowright") { keys.right = true; e.preventDefault(); }
    });
    window.addEventListener("keyup", (e) => {
        let k = e.key.toLowerCase();
        if (k in keys) { keys[k] = false; e.preventDefault(); }
        if (k === "arrowup") { keys.up = false; e.preventDefault(); }
        if (k === "arrowdown") { keys.down = false; e.preventDefault(); }
        if (k === "arrowleft") { keys.left = false; e.preventDefault(); }
        if (k === "arrowright") { keys.right = false; e.preventDefault(); }
    });
    
    canvas.addEventListener("mousemove", (e) => {
        if (!arenaActive || arenaPhase !== "dodge") return;
        if (keys.w || keys.a || keys.s || keys.d || keys.up || keys.down || keys.left || keys.right || joystickActive) return;
        let rect = canvas.getBoundingClientRect();
        heart.x = e.clientX - rect.left;
        heart.y = e.clientY - rect.top;
        clampHeart();
    });
    
    canvas.addEventListener("touchstart", (e) => {
        if (!arenaActive) return;
        e.preventDefault();
        if (arenaPhase === "attack") {
            let rect = canvas.getBoundingClientRect();
            for (let i = 0; i < e.touches.length; i++) {
                checkClickTarget(e.touches[i].clientX - rect.left, e.touches[i].clientY - rect.top);
            }
            return;
        }
        if (e.touches.length === 1) {
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
    if (joystickActive) { mx = (joystickX - heart.x) / 20; my = (joystickY - heart.y) / 20; }
    
    let isMoving = Math.abs(mx) > 0.05 || Math.abs(my) > 0.05;
    heartWasMoving = isMoving;
    
    if (isMoving) {
        heartStandingTime = 0;
        let len = Math.sqrt(mx*mx + my*my);
        if (len > 1) { mx /= len; my /= len; }
        heart.x += mx * heartSpeed;
        heart.y += my * heartSpeed;
        clampHeart();
        arenaTrail.push({ x: heart.x, y: heart.y, life: 8, size: heart.size });
        if (arenaTrail.length > 10) arenaTrail.shift();
    } else {
        heartStandingTime++;
    }
}

function checkClickTarget(mx, my) {
    for (let i = arenaClickTargets.length - 1; i >= 0; i--) {
        let t = arenaClickTargets[i];
        if (Math.sqrt((mx-t.x)**2 + (my-t.y)**2) < t.radius && !t.hit) {
            t.hit = true; arenaClicksHit++;
            for (let j = 0; j < 12; j++) {
                arenaParticles.push({ x: t.x, y: t.y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 20, color: "#ff0", size: 2+Math.random()*3 });
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
    if (bossWave === 50) return [0, 1];
    if (bossWave === 100) return [2, 3];
    if (bossWave === 150) return [1, 4];
    if (bossWave === 200) return [0, 5];
    if (bossWave === 300) return [6, 2];
    if (bossWave === 500) return [3, 4, 6];
    if (bossWave === 10000) return [0,1,2,3,4,5,6];
    return [0, 1];
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
    arenaTrail = [];
    arenaShake = 0;
    arenaHitFlash = 0;
    arenaComboText = "";
    arenaComboTimer = 0;
    heart.x = 200; heart.y = 400;
    heartWasMoving = false;
    heartStandingTime = 0;
    
    arenaSpeedMult = 1.0 + (bossWave - 50) / 50 * 0.3;
    
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
    startDodgePhase();
    requestAnimationFrame(renderArena);
}

function startDodgePhase() {
    arenaPhase = "dodge";
    attacks = [];
    heart.x = 200; heart.y = 400;
    let typeNames = ["⬜ ОБЫЧНЫЕ", "🔷 ХАОС", "⚡ ЖЁЛТЫЕ", "🛑 КРАСНЫЕ", "💗 РОЗОВЫЕ", "💚 ЗЕЛЁНЫЕ", "🌈 РАДУЖНЫЕ"];
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + (typeNames[arenaAttackType] || "Атака");
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    let baseInterval = arenaAttackType === 2 ? 700 : (arenaAttackType === 6 ? 4000 : (arenaAttackType === 0 ? 1500 : 2200));
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive) spawnAttack();
    }, Math.max(250, baseInterval / arenaSpeedMult));
    let dodgeTime = 8000 + Math.random() * 5000;
    setTimeout(() => { if (arenaPhase === "dodge" && arenaActive) startAttackPhase(); }, dodgeTime);
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
            x = 50 + Math.random() * 300; y = 100 + Math.random() * 330;
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
    setTimeout(() => { if (arenaPhase === "attack" && arenaActive) applyArenaDamage(); }, 2000);
}

function applyArenaDamage() {
    if (!arenaActive) return;
    let dmgMult = 0;
    if (arenaClicksHit >= 8) { dmgMult = 2.0; arenaComboText = "ОТЛИЧНО! x2"; }
    else if (arenaClicksHit >= 4) { dmgMult = 1.0; arenaComboText = "ХОРОШО! x1"; }
    else if (arenaClicksHit >= 1) { dmgMult = 0.5; arenaComboText = "СЛАБО... x0.5"; }
    else { arenaComboText = "ПРОМАХ!"; }
    arenaComboTimer = 45;
    
    let baseDmg = typeof window !== 'undefined' && window.playerFinalDamage ? window.playerFinalDamage : 10;
    let finalDmg = Math.floor(baseDmg * dmgMult);
    
    if (finalDmg > 0) {
        arenaBossMaxHP -= finalDmg;
        arenaShake = 20;
        for (let i = 0; i < 30; i++) {
            arenaParticles.push({ x: 200, y: 250, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 30, color: Math.random()<0.5?"#ff0":"#f80", size: 2+Math.random()*5 });
        }
    }
    
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) { winArena(); return; }
        let types = getAttackTypes(typeof wave !== 'undefined' ? wave : 50);
        arenaAttackType = types[Math.floor(Math.random() * types.length)];
        arenaPhase = "dodge";
        startDodgePhase();
    }, 1200);
}

function spawnAttack() {
    let s = arenaSpeedMult;
    switch(arenaAttackType) {
        case 0: // Белые — предсказуемые ряды
            let t0 = Math.floor(Math.random() * 4);
            if (t0 === 0) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: -50-i*80, y: 60+i*85, size: 28, speed: 1.05*s, speedX: null, speedY: null, color: "#fff" });
            else if (t0 === 1) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 450+i*80, y: 70+i*80, size: 28, speed: -1.05*s, speedX: null, speedY: null, color: "#fff" });
            else if (t0 === 2) for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 25+i*90, y: -40, size: 28, speed: null, speedX: 0, speedY: 0.9*s, color: "#fff" });
            else for (let i = 0; i < 5; i++) attacks.push({ type: "square", x: 40+i*85, y: 540, size: 28, speed: null, speedX: 0, speedY: -0.9*s, color: "#fff" });
            break;
            
        case 1: // Синие — хаос
            for (let i = 0; i < 4; i++) {
                let side = Math.floor(Math.random()*4);
                let x, y, spX, spY;
                if (side===0) { x=Math.random()*380; y=-40; spX=(Math.random()-0.5)*1.5; spY=(0.8+Math.random()*1.4)*s; }
                else if (side===1) { x=Math.random()*380; y=540; spX=(Math.random()-0.5)*1.5; spY=-(0.8+Math.random()*1.4)*s; }
                else if (side===2) { x=-40; y=Math.random()*460; spX=(0.8+Math.random()*1.4)*s; spY=(Math.random()-0.5)*1.5; }
                else { x=440; y=Math.random()*460; spX=-(0.8+Math.random()*1.4)*s; spY=(Math.random()-0.5)*1.5; }
                attacks.push({ type: "square", x, y, size: 18+Math.random()*14, speed: null, speedX: spX, speedY: spY, color: "#4499ff" });
            }
            break;
            
        case 2: // Жёлтые мечи — летают свободно (не застревают)
            for (let i = 0; i < 3; i++) {
                let angle = Math.random()*Math.PI*2;
                attacks.push({ 
                    type: "sword", 
                    x: 80 + Math.random()*240, 
                    y: 80 + Math.random()*340, 
                    angle: angle, 
                    rotSpeed: (0.05+Math.random()*0.1)*s, 
                    size: 35, 
                    color: "#ffdd00", 
                    damageOnStanding: true,
                    vx: (Math.random()-0.5)*2*s, 
                    vy: (Math.random()-0.5)*2*s 
                });
            }
            break;
            
        case 3: // Красные — летают по карте
            for (let i = 0; i < 5; i++) {
                attacks.push({ 
                    type: "square", 
                    x: 20 + Math.random()*360, 
                    y: 20 + Math.random()*460, 
                    size: 28, 
                    speedX: (Math.random()-0.5)*2*s, 
                    speedY: (Math.random()-0.5)*2*s, 
                    color: "#ff3333", 
                    damageOnMoving: true 
                });
            }
            break;
            
        case 4: // Розовые — падают сверху
            for (let i = 0; i < 4; i++) {
                attacks.push({ 
                    type: "square", 
                    x: 20 + Math.random()*360, 
                    y: -30 - Math.random()*50, 
                    size: 26, 
                    speed: null, 
                    speedX: 0, 
                    speedY: (1+Math.random()*2)*s, 
                    color: "#ff69b4", 
                    knockback: 70 
                });
            }
            break;
            
        case 5: // Зелёные — падают сверху (хил)
            if (arenaHP < arenaMaxHP * 0.5) {
                for (let i = 0; i < 4; i++) {
                    attacks.push({ 
                        type: "circle", 
                        x: 30 + Math.random()*340, 
                        y: -30, 
                        radius: 16, 
                        speed: (1+Math.random())*s, 
                        color: "#44ff44", 
                        heal: 5 
                    });
                }
            } else {
                arenaAttackType = 0;
                spawnAttack();
                return;
            }
            break;
            
        case 6: // Радужные — редкий ваншот
            if (Math.random() < 0.4) {
                attacks.push({ 
                    type: "rainbow", 
                    x: 60 + Math.random()*280, 
                    y: -50, 
                    size: 40, 
                    speed: (0.3+Math.random()*0.3)*s, 
                    color: "rainbow", 
                    oneshot: true 
                });
            }
            break;
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
    if (typeof currentEnemy !== 'undefined' && currentEnemy) {
        currentEnemy.hp = Math.floor(currentEnemy.maxHp * 0.25);
    }
    if (typeof victory === 'function') victory();
}

function loseArena() {
    stopArena();
    if (typeof playerHp !== 'undefined') playerHp = 0;
    if (typeof defeat === 'function') defeat();
}

function renderArena() {
    if (!arenaActive || !ctx) return;
    if (arenaPhase === "dodge") moveHeart();
    
    let sx = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    let sy = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    if (arenaShake > 0) arenaShake *= 0.85;
    if (arenaHitFlash > 0) arenaHitFlash--;
    if (arenaComboTimer > 0) arenaComboTimer--;
    arenaBgTime += 0.016;
    
    ctx.save();
    ctx.translate(sx, sy);
    ctx.clearRect(-10, -10, 420, 520);
    
    ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, 400, 500);
    
    ctx.strokeStyle = "rgba(255,255,255,0.02)"; ctx.lineWidth = 0.5;
    for (let gx = 0; gx < 400; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 500); ctx.stroke(); }
    for (let gy = 0; gy < 500; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(400, gy); ctx.stroke(); }
    
    let borderColor = arenaPhase === "attack" ? "#ffdd00" : (["#fff","#4499ff","#ffdd00","#ff3333","#ff69b4","#44ff44","rainbow"][arenaAttackType] || "#fff");
    if (borderColor === "rainbow") borderColor = "hsl(" + (arenaBgTime*200%360) + ",100%,50%)";
    ctx.strokeStyle = borderColor; ctx.lineWidth = 3 + Math.sin(arenaBgTime*3)*1;
    ctx.shadowBlur = 15; ctx.shadowColor = borderColor;
    ctx.strokeRect(2, 2, 396, 496);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(8, 6, 384, 24);
    ctx.fillStyle = "#400"; ctx.fillRect(14, 14, 372, 4);
    ctx.fillStyle = "#0f0"; ctx.fillRect(14, 14, 372*(arenaHP/arenaMaxHP), 4);
    ctx.fillStyle = "#fff"; ctx.font = "bold 9px Nunito, sans-serif";
    ctx.fillText("❤️ " + arenaHP + "/" + arenaMaxHP, 16, 26);
    
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(8, 34, 384, 14);
    let maxHp = (typeof currentEnemy !== 'undefined' && currentEnemy) ? currentEnemy.maxHp : 1000;
    ctx.fillStyle = "#ff0"; ctx.fillRect(14, 40, 372*Math.max(0, arenaBossMaxHP/maxHp), 3);
    ctx.fillStyle = "#aaa"; ctx.font = "bold 7px Nunito, sans-serif";
    ctx.fillText("👾 " + arenaBoss, 16, 46);
    
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px Nunito, sans-serif";
    ctx.fillText(arenaPhase === "attack" ? "⚡ ЖМИ КРУГИ! (" + arenaClicksHit + "/8)" : "🛡️ WASD", 120, 68);
    
    if (arenaComboTimer > 0 && arenaComboText) {
        ctx.fillStyle = "rgba(255,255,0," + Math.min(1, arenaComboTimer/30) + ")";
        ctx.font = "bold 22px Nunito, sans-serif"; ctx.fillText(arenaComboText, 120, 270);
    }
    
    if (arenaPhase === "dodge") {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            
            // ДВИЖЕНИЕ — безопасная проверка всех возможных типов
            if (a.vx !== undefined && a.vx !== null) { 
                a.x += a.vx; 
                a.y += (a.vy !== undefined && a.vy !== null) ? a.vy : 0; 
            }
            else if (a.speedX !== undefined && a.speedX !== null) { 
                a.x += a.speedX; 
                a.y += (a.speedY !== undefined && a.speedY !== null) ? a.speedY : 0; 
            }
            else if (a.speedY !== undefined && a.speedY !== null) { 
                a.y += a.speedY; 
            }
            else if (a.speed !== undefined && a.speed !== null) {
                if (a.type === "circle" || a.type === "rainbow") a.y += a.speed;
                else a.x += a.speed;
            }
            
            if (a.rotSpeed) a.angle = (a.angle || 0) + a.rotSpeed;
            
            // ОТРАЖЕНИЕ ОТ СТЕН (только для атак у которых есть vx/vy)
            let hasVelocity = (a.vx !== undefined && a.vx !== null) || (a.speedX !== undefined && a.speedX !== null);
            if (hasVelocity) {
                // Определяем размер для отражения
                let hitSize = a.size || a.radius || 28;
                
                // Отражение от левой/правой стены
                if (a.x < 5) {
                    if (a.vx !== undefined && a.vx !== null) a.vx = Math.abs(a.vx);
                    if (a.speedX !== undefined && a.speedX !== null) a.speedX = Math.abs(a.speedX);
                    a.x = 5;
                }
                if (a.x > 395 - hitSize) {
                    if (a.vx !== undefined && a.vx !== null) a.vx = -Math.abs(a.vx);
                    if (a.speedX !== undefined && a.speedX !== null) a.speedX = -Math.abs(a.speedX);
                    a.x = 395 - hitSize;
                }
                
                // Отражение от верхней/нижней стены
                if (a.y < 5) {
                    if (a.vy !== undefined && a.vy !== null) a.vy = Math.abs(a.vy);
                    if (a.speedY !== undefined && a.speedY !== null) a.speedY = Math.abs(a.speedY);
                    a.y = 5;
                }
                if (a.y > 495 - hitSize) {
                    if (a.vy !== undefined && a.vy !== null) a.vy = -Math.abs(a.vy);
                    if (a.speedY !== undefined && a.speedY !== null) a.speedY = -Math.abs(a.speedY);
                    a.y = 495 - hitSize;
                }
            }
            
            // СТОЛКНОВЕНИЕ С СЕРДЕЧКОМ
            let hit = false;
            if (a.type === "sword" || a.type === "circle" || a.type === "rainbow") {
                let dx = heart.x - a.x, dy = heart.y - a.y;
                hit = Math.sqrt(dx*dx + dy*dy) < (heart.size + (a.radius || a.size || 28));
            } else {
                let halfSize = (a.size || 28) / 2;
                let cx = a.x + halfSize;
                let cy = a.y + halfSize;
                hit = (heart.x + heart.size > a.x && heart.x - heart.size < a.x + (a.size || 28) &&
                       heart.y + heart.size > a.y && heart.y - heart.size < a.y + (a.size || 28));
            }
            
            if (hit) {
                if (a.damageOnStanding && !heartWasMoving) { applyHit(5); attacks.splice(i, 1); continue; }
                if (a.damageOnStanding && heartWasMoving) { /* нет урона */ }
                else if (a.damageOnMoving && heartWasMoving) { applyHit(5); attacks.splice(i, 1); continue; }
                else if (a.damageOnMoving && !heartWasMoving) { /* нет урона */ }
                else if (a.knockback) {
                    let dx = heart.x - a.x, dy = heart.y - a.y;
                    let dist = Math.sqrt(dx*dx+dy*dy) || 1;
                    heart.x += (dx/dist)*a.knockback;
                    heart.y += (dy/dist)*a.knockback;
                    clampHeart();
                    attacks.splice(i, 1); continue;
                }
                else if (a.heal) {
                    arenaHP = Math.min(arenaMaxHP, arenaHP + a.heal);
                    document.getElementById("arenaHP").innerText = arenaHP;
                    attacks.splice(i, 1); continue;
                }
                else if (a.oneshot) { loseArena(); ctx.restore(); return; }
                else if (!a.damageOnStanding && !a.damageOnMoving && !a.heal && !a.knockback && !a.oneshot) {
                    applyHit(5); attacks.splice(i, 1); continue;
                }
            }
            
            // УДАЛЕНИЕ ЗА ЭКРАНОМ
            if (a.x < -200 || a.x > 600 || a.y < -200 || a.y > 700) { attacks.splice(i, 1); continue; }
            
            // ОТРИСОВКА
            let col = a.color || "#fff";
            if (col === "rainbow") col = "hsl(" + (arenaBgTime*300 + a.x) % 360 + ",100%,60%)";
            ctx.fillStyle = col;
            ctx.shadowBlur = a.type === "rainbow" ? 20 : 6;
            ctx.shadowColor = col;
            
            if (a.type === "sword") {
                ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle || 0);
                ctx.fillRect(-2, -a.size/2, 4, a.size);
                ctx.restore();
            } else if (a.type === "circle" || a.type === "rainbow") {
                ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.fillRect(a.x, a.y, a.size, a.size);
            }
            ctx.shadowBlur = 0;
        }
        
        // Шлейф сердечка
        for (let i = arenaTrail.length - 1; i >= 0; i--) {
            let t = arenaTrail[i]; t.life--;
            if (t.life <= 0) { arenaTrail.splice(i, 1); continue; }
            ctx.fillStyle = "rgba(255,50,50," + (t.life/8)*0.5 + ")";
            ctx.beginPath(); ctx.arc(t.x, t.y, t.size*(t.life/8), 0, Math.PI*2); ctx.fill();
        }
        
        // Сердечко
        let hx = heart.x, hy = heart.y, s = heart.size + Math.sin(Date.now()/150)*1.5;
        ctx.fillStyle = "rgba(255,0,0,0.3)";
        ctx.shadowBlur = 20; ctx.shadowColor = "#ff0000";
        ctx.beginPath(); ctx.arc(hx, hy, s+4, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ff0000";
        ctx.shadowBlur = 8; ctx.shadowColor = "#ff4444";
        ctx.beginPath();
        ctx.moveTo(hx, hy + s*0.3);
        ctx.bezierCurveTo(hx, hy - s*0.3, hx - s, hy - s*0.3, hx - s, hy + s*0.3);
        ctx.bezierCurveTo(hx - s, hy + s*0.8, hx, hy + s, hx, hy + s*1.2);
        ctx.bezierCurveTo(hx, hy + s, hx + s, hy + s*0.8, hx + s, hy + s*0.3);
        ctx.bezierCurveTo(hx + s, hy - s*0.3, hx, hy - s*0.3, hx, hy + s*0.3);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    if (arenaPhase === "attack") {
        arenaClickTargets.forEach(t => {
            t.pulse += 0.06; let r = t.radius + Math.sin(t.pulse)*3;
            ctx.fillStyle = t.hit ? "rgba(0,255,0,0.7)" : "rgba(255,255,0,0.8)";
            ctx.shadowBlur = t.hit ? 10 : 15; ctx.shadowColor = t.hit ? "#0f0" : "#ff0";
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = t.hit ? "#0f0" : "#ff0"; ctx.lineWidth = 2; ctx.stroke();
            if (!t.hit) { ctx.fillStyle = "#000"; ctx.font = "bold 11px Nunito, sans-serif"; ctx.fillText("ЖМИ", t.x-15, t.y+4); }
        });
    }
    
    // Частицы
    for (let i = arenaParticles.length - 1; i >= 0; i--) {
        let p = arenaParticles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) { arenaParticles.splice(i, 1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life/30;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    ctx.restore();
    requestAnimationFrame(renderArena);
}
function applyHit(dmg) {
    arenaHP -= dmg;
    arenaHitFlash = 8;
    document.getElementById("arenaHP").innerText = Math.max(0, arenaHP);
    if (arenaHP <= 0) loseArena();
}
