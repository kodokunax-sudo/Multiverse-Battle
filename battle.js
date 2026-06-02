// ========== АРЕНА UNDERTALE v3.0 (FULL INTEGRATED WITH AUDIO & FX) ==========
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
let arenaShockwaves = []; 
let arenaBgParticles = []; 
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
let arenaBossDmgMult = 1.0;
let arenaBaseDmg = 5;

let ghostHP = 30;
let ghostBossHP = 1000;

// ========== ЗВУКОВОЙ ДВИЖОК (Web Audio API) ==========
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'explode') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.45);
        gainNode.gain.setValueAtTime(0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now); osc.stop(now + 0.45);
    } else if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'heal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(550, now + 0.08);
        osc.frequency.linearRampToValueAtTime(750, now + 0.2);
        gainNode.gain.setValueAtTime(0.35, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'bossHit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now); osc.stop(now + 0.18);
    }
}

// Авто-активация звука от действий пользователя
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });

// ========== ИНИЦИАЛИЗАЦИЯ И СИСТЕМНЫЕ ФУНКЦИИ ==========
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
            initAudio();
            let rect = canvas.getBoundingClientRect();
            if (arenaPhase === "attack") {
                for (let i = 0; i < e.touches.length; i++) checkClickTarget(e.touches[i].clientX - rect.left, e.touches[i].clientY - rect.top);
                return;
            }
            if (e.touches.length === 1) { joystickActive = true; joystickId = e.touches[0].identifier; joystickX = e.touches[0].clientX - rect.left; joystickY = e.touches[0].clientY - rect.top; }
        });
        canvas.addEventListener("touchmove", (e) => {
            if (!arenaActive || arenaPhase !== "dodge") return;
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) { if (e.touches[i].identifier === joystickId) { let rect = canvas.getBoundingClientRect(); joystickX = e.touches[i].clientX - rect.left; joystickY = e.touches[i].clientY - rect.top; break; } }
        });
        canvas.addEventListener("touchend", () => { joystickActive = false; joystickId = null; });
    }
    canvas.addEventListener("click", (e) => { if (!arenaActive || arenaPhase !== "attack") return; initAudio(); let rect = canvas.getBoundingClientRect(); checkClickTarget(e.clientX - rect.left, e.clientY - rect.top); });
}

function clampHeart() { heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x)); heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y)); }

function moveHeart() {
    let mx = 0, my = 0;
    if (keys.w || keys.up) my -= 1;
    if (keys.s || keys.down) my += 1;
    if (keys.a || keys.left) mx -= 1;
    if (keys.d || keys.right) mx += 1;
    if (joystickActive && isMobile) { mx = (joystickX - heart.x) / 15; my = (joystickY - heart.y) / 15; let len = Math.sqrt(mx*mx + my*my); if (len > 1) { mx /= len; my /= len; } }
    let isMoving = Math.abs(mx) > 0.05 || Math.abs(my) > 0.05;
    heartWasMoving = isMoving;
    if (isMoving) { 
        heartStandingTime = 0; 
        let len = Math.sqrt(mx*mx + my*my); 
        if (len > 1) { mx /= len; my /= len; } 
        heart.x += mx * heartSpeed; 
        heart.y += my * heartSpeed; 
        clampHeart(); 
        
        if (!isMobile || Math.random() > 0.4) {
            let trailLife = isMobile ? 4 : 10;
            arenaTrail.push({ x: heart.x, y: heart.y, life: trailLife, maxLife: trailLife, size: heart.size * 0.75, color: "rgba(255, 30, 30, 0.4)" }); 
        }
    }
    else { heartStandingTime++; }
}

function spawnFloatingText(x, y, text, color) { if (!isMobile) floatingTexts.push({ x, y, text, color, life: 45, vy: -1.8 }); }

function checkClickTarget(mx, my) {
    for (let i = arenaClickTargets.length - 1; i >= 0; i--) { 
        let t = arenaClickTargets[i]; 
        if (Math.sqrt((mx-t.x)**2 + (my-t.y)**2) < t.radius + 15 && !t.hit) { 
            t.hit = true; 
            arenaClicksHit++; 
            arenaShake = isMobile ? 8 : 16; 
            playSound('bossHit');
            arenaShockwaves.push({ x: t.x, y: t.y, r: 10, v: 6, life: 14, maxLife: 14, color: "#ffdd00" });
            
            let pCount = isMobile ? 8 : 30;
            for (let j = 0; j < pCount; j++) {
                let angle = Math.random() * Math.PI * 2;
                let spd = 4 + Math.random() * 6;
                arenaParticles.push({ 
                    x: t.x, y: t.y, 
                    vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, 
                    life: 25, maxLife: 25, 
                    color: Math.random() > 0.3 ? "#ffdd00" : "#ffffff", 
                    size: 1.5 + Math.random() * 3 
                }); 
            }
            break; 
        } 
    }
}

function calculateArenaHP() {
    let bonus = 0;
    let cards = window.myCards || (typeof myCards !== 'undefined' ? myCards : null);
    let teamArr = window.team || (typeof team !== 'undefined' ? team : null);
    if (cards && teamArr && Array.isArray(cards) && Array.isArray(teamArr)) {
        for (let i = 0; i < teamArr.length; i++) {
            let idx = teamArr[i];
            if (idx >= 0 && idx < cards.length && cards[idx] && typeof cards[idx].hp === 'number') {
                bonus += Math.floor(cards[idx].hp / 50);
            }
        }
    }
    arenaMaxHP = 30 + bonus; arenaHP = arenaMaxHP; ghostHP = arenaHP;
}

function getAttackTypes(bossWave) {
    if (typeof bossTemplates !== 'undefined' && bossTemplates[bossWave] && bossTemplates[bossWave].arenaTypes) return bossTemplates[bossWave].arenaTypes;
    if (bossWave < 100) return [0, 1];
    if (bossWave < 400) return [0, 1, 2, 3];
    if (bossWave < 1000) return [0, 1, 2, 3, 4, 5];
    if (bossWave < 2000) return [0, 1, 2, 3, 4, 5, 7, 8];
    return [0, 1, 2, 3, 4, 5, 7, 8, 9, 10];
}

function skipDefeatedBoss() { 
    stopArena(); 
    if (typeof currentEnemy !== 'undefined' && currentEnemy) { currentEnemy.hp = 0; }
    if (typeof victory === 'function') { victory(); }
}

// ========== УПРАВЛЕНИЕ ФАЗАМИ И СТАДИЯМИ ==========
function startArena(bossWave) {
    let btn = document.getElementById("startArenaBtn"); if (btn) btn.style.display = "none";
    let spareBtn = document.getElementById("spareBtn"); if (spareBtn) spareBtn.style.display = "none";
    arenaBossDefeatedBefore = (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(bossWave));
    arenaActive = true; arenaCurrentWave = bossWave;
    calculateArenaHP();
    arenaClickTargets = []; arenaClicksHit = 0; arenaPhase = "dodge"; attacks = []; arenaBlasters = []; arenaParticles = []; floatingTexts = []; arenaTrail = []; arenaShockwaves = [];
    arenaShake = 0; arenaHitFlash = 0; invulnTimer = 0; arenaComboText = ""; arenaComboTimer = 0; heart.x = 200; heart.y = 400; heartWasMoving = false; heartStandingTime = 0;
    arenaSpeedMult = Math.min(15.0, 1.0 + Math.floor((bossWave - 50) / 50) * 0.1);
    if (bossWave < 50) arenaSpeedMult = 1.0;
    arenaAllowedTypes = getAttackTypes(bossWave);
    let bt = typeof bossTemplates !== 'undefined' ? bossTemplates[bossWave] : null;
    arenaBoss = bt ? bt.name : "БОСС ВРАТ";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000 + bossWave * 10;
    ghostBossHP = arenaBossMaxHP;
    if (bt && bt.dmgMult) { arenaBossDmgMult = bt.dmgMult; } else { arenaBossDmgMult = 1.0 + (bossWave - 50) / 100 * 0.5; }
    arenaBaseDmg = Math.max(2, Math.floor(5 * arenaBossDmgMult / 3));
    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = arenaHP;
    document.getElementById("arenaTimer").innerText = "∞";
    let skipBtn = document.getElementById("skipBossBtn"); if (skipBtn) skipBtn.style.display = arenaBossDefeatedBefore ? "block" : "none";
    if (!ctx) initArena();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    startDodgePhase();
    animFrameId = requestAnimationFrame(renderArena);
}

function startDodgePhase() {
    arenaPhase = "dodge"; attacks = []; arenaBlasters = []; heart.x = 200; heart.y = 400;
    arenaAttackType = arenaAllowedTypes[Math.floor(Math.random() * arenaAllowedTypes.length)];
    let typeNames = { 0: "⬜ СТЕНЫ ЗЛА", 1: "🔷 ХАОС", 2: "⚡ ЖЁЛТЫЕ", 3: "🛑 КРАСНЫЕ", 4: "💗 РОЗОВЫЕ", 5: "💚 ЗЕЛЁНЫЕ", 6: "🌈 РАДУЖНЫЕ", 7: "⚡🛑 МИКС", 8: "🟥⬜ ЗОНЫ", 9: "💣 БОМБЫ", 10: "🔫 БЛАСТЕРЫ" };
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + (typeNames[arenaAttackType] || "Атака");
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    let baseInterval = 2400;
    if (arenaAttackType === 0) baseInterval = 3400;
    if (arenaAttackType === 2 || arenaAttackType === 3) baseInterval = 2200;
    if (arenaAttackType === 6) baseInterval = 4000;
    if (arenaAttackType === 7) baseInterval = 2400;
    if (arenaAttackType === 8) baseInterval = 2800;
    if (arenaAttackType === 9) baseInterval = 3400;
    if (arenaAttackType === 10) baseInterval = 2400;
    arenaAttackInterval = setInterval(() => { if (arenaPhase === "dodge" && arenaActive) spawnAttack(); }, Math.max(800, baseInterval / arenaSpeedMult));
    let dodgeTime = Math.max(10000, 13000 + Math.random() * 6000);
    setTimeout(() => { if (arenaPhase === "dodge" && arenaActive) startAttackPhase(); }, dodgeTime);
}

function startAttackPhase() {
    arenaPhase = "attack"; attacks = []; arenaBlasters = []; arenaClickTargets = []; arenaClicksHit = 0;
    arenaTotalTargets = 4 + Math.floor(arenaSpeedMult * 0.8); arenaAttackTimeLeft = 2;
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
    let usedPositions = [];
    for (let i = 0; i < arenaTotalTargets; i++) { 
        let x, y, tooClose, attempts = 0; 
        do { 
            x = 40 + Math.random() * 320; y = 80 + Math.random() * 340; tooClose = false; 
            for (let p of usedPositions) { if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < 60) { tooClose = true; break; } } 
            attempts++; 
        } while (tooClose && attempts < 50); 
        usedPositions.push({x, y}); 
        arenaClickTargets.push({ x, y, radius: 26, hit: false, pulse: Math.random()*Math.PI*2 }); 
    }
    let attackTimer = setInterval(() => { arenaAttackTimeLeft--; document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)"; if (arenaAttackTimeLeft <= 0) { clearInterval(attackTimer); applyArenaDamage(); } }, 1000);
}

function applyArenaDamage() {
    if (!arenaActive) return;
    let dmgMult = 0, ratio = arenaClicksHit / arenaTotalTargets;
    
    if (ratio >= 1.0) { dmgMult = 2.5; arenaComboText = "🔥 ИДЕАЛЬНО! x2.5"; } 
    else if (ratio >= 0.8) { dmgMult = 1.8; arenaComboText = "⚡ ОТЛИЧНО! x1.8"; } 
    else if (ratio >= 0.6) { dmgMult = 1.3; arenaComboText = "✨ ХОРОШО! x1.3"; } 
    else if (ratio >= 0.4) { dmgMult = 1.0; arenaComboText = "👍 КЛАССИКА! x1.0"; } 
    else if (ratio >= 0.2) { dmgMult = 0.6; arenaComboText = "💤 СЛАБОВАТО... x0.6"; } 
    else if (ratio > 0.0) { dmgMult = 0.2; arenaComboText = "🥱 ПОЧТИ МИМО... x0.2"; } 
    else { dmgMult = 0.0; arenaComboText = "❌ ПРОМАХ! x0"; }
    
    arenaComboTimer = 50;
    let baseDmg = typeof window !== 'undefined' && window.playerFinalDamage ? window.playerFinalDamage : 20;
    let finalDmg = Math.floor(baseDmg * dmgMult);
    if (finalDmg > 0) { 
        arenaBossMaxHP -= finalDmg; arenaShake = isMobile ? 12 : 26; 
        arenaShockwaves.push({ x: 200, y: 250, r: 20, v: 12, life: 20, maxLife: 20, color: "rgba(255, 255, 255, 0.8)" });
    }
    setTimeout(() => { if (arenaBossMaxHP <= 0) { winArena(); return; } startDodgePhase(); }, 1500);
}

// ========== СПАВН АТАК И ХИТБОКСЫ ==========
function spawnBlaster(w) {
    let bossW = arenaCurrentWave, isRainbow = Math.random() < 0.05 && bossW >= 800;
    let colors = ["#fff", "#ffdd00", "#ff3333"], bColor = isRainbow ? "rainbow" : colors[Math.floor(Math.random() * colors.length)];
    let side = Math.floor(Math.random() * 4), x, y;
    if (side === 0) { x = Math.random()*400; y = -30; } else if (side === 1) { x = Math.random()*400; y = 530; } else if (side === 2) { x = -30; y = Math.random()*500; } else { x = 430; y = Math.random()*500; }
    arenaBlasters.push({ x, y, angle: Math.atan2(heart.y - y, heart.x - x), color: bColor, state: "aiming", timer: 70, width: isRainbow ? 15 : 30, hasHit: false });
}

function spawnAttack() {
    let s = arenaSpeedMult, bw = arenaCurrentWave, isEarly = bw < 100, dmg = arenaBaseDmg;
    
    switch(arenaAttackType) {
        case 0: 
            if (isEarly) {
                if (Math.random() > 0.5) {
                    attacks.push({ type: "square", x: 60, y: -30, size: 26, spd: 0, spdY: 3.2*s, color: "#fff", damage: dmg, bouncesLeft: 2 });
                    attacks.push({ type: "square", x: 310, y: -30, size: 26, spd: 0, spdY: 3.2*s, color: "#fff", damage: dmg, bouncesLeft: 2 });
                } else {
                    attacks.push({ type: "square", x: -30, y: 180, size: 26, spd: 3.5*s, spdY: 0, color: "#fff", damage: dmg, bouncesLeft: 1 });
                    attacks.push({ type: "square", x: 430, y: 320, size: 26, spd: -3.5*s, spdY: 0, color: "#fff", damage: dmg, bouncesLeft: 1 });
                }
            } else {
                let isVertical = Math.random() > 0.5;
                if (isVertical) {
                    let gapCenter = 80 + Math.random() * 340;
                    let gapSize = 70 + Math.random() * 40;
                    let startX = Math.random() > 0.5 ? -30 : 430;
                    let dirX = startX < 0 ? 3.5*s : -3.5*s;
                    for (let i = 10; i < 490; i += 22) {
                        if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                        attacks.push({ type: "square", x: startX, y: i, size: 24, spd: dirX, spdY: 0, color: "#fff", damage: dmg, bouncesLeft: 1 });
                    }
                } else {
                    let gapCenter = 60 + Math.random() * 280;
                    let gapSize = 70 + Math.random() * 40;
                    let startY = Math.random() > 0.5 ? -30 : 530;
                    let dirY = startY < 0 ? 2.4*s : -2.4*s;
                    for (let i = 10; i < 390; i += 22) {
                        if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                        attacks.push({ type: "square", x: i, y: startY, size: 24, spd: 0, spdY: dirY, color: "#fff", damage: dmg, bouncesLeft: 1 });
                    }
                }
            }
            break;
            
        case 1: 
            for (let i = 0; i < (isEarly ? 1 : 2); i++) {
                let side = Math.floor(Math.random()*4), x, y;
                if (side===0) { x=Math.random()*400; y=-30; } else if (side===1) { x=Math.random()*400; y=530; } else if (side===2) { x=-30; y=Math.random()*500; } else { x=430; y=Math.random()*500; }
                let angle = Math.atan2(heart.y - y, heart.x - x);
                if (!isEarly) angle += (Math.random() - 0.5) * 0.2;
                attacks.push({ type: "square", x, y, size: 20, spd: Math.cos(angle)*2.1*s, spdY: Math.sin(angle)*2.1*s, color: "#4499ff", damage: dmg, bouncesLeft: 1 });
            }
            break;
            
        case 2: 
            { let xPos = Math.random() * 400, yPos = -40, angle = Math.atan2(heart.y - yPos, heart.x - xPos);
            attacks.push({ type: "sword", x: xPos, y: yPos, angle: angle, size: 45, width: 15, color: "#ffaa00", spd: Math.cos(angle)*2.4*s, spdY: Math.sin(angle)*2.4*s, damageOnStanding: true, damage: Math.floor(dmg * 1.2), bouncesLeft: 0 });
            if (!isEarly) { attacks.push({ type: "sword", x: 400 - xPos, y: 540, angle: angle + Math.PI, size: 45, width: 15, color: "#ffaa00", spd: -Math.cos(angle)*2.4*s, spdY: -Math.sin(angle)*2.4*s, damageOnStanding: true, damage: Math.floor(dmg * 1.2), bouncesLeft: 0 }); } }
            break;
            
        case 3: 
            { let vx = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4) * s;
            let vy = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4) * s;
            attacks.push({ type: "danger", x: 200, y: 180, size: 70, spd: vx, spdY: vy, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.6), bouncesLeft: 1 }); }
            break;
            
        case 4: 
            for (let i = 0; i < (isEarly ? 1 : 2); i++) {
                let rx = (Math.random() - 0.5) * 2 * s;
                attacks.push({ type: "square", x: heart.x + (Math.random()-0.5)*120, y: -40, size: 25, spd: rx, spdY: (1.8+Math.random()*1.0)*s, color: "#ff69b4", knockback: 120, bouncesLeft: Infinity });
            }
            break;
            
        case 5: 
            if (arenaHP < arenaMaxHP) {
                attacks.push({ type: "circle", x: Math.random()*400, y: -30, radius: 15, spd: (Math.random()-0.5)*1.5*s, spdY: 2.5*s, color: "#44ff44", heal: 3, bouncesLeft: 0 });
            } else {
                attacks.push({ type: "square", x: Math.random()*360 + 20, y: -30, size: 22, spd: 0, spdY: 3.0*s, color: "#fff", damage: dmg, bouncesLeft: 2 });
            }
            break;
            
        case 6: 
            attacks.push({ type: "rainbow", x: 50+Math.random()*300, y: -60, radius: 30, spd: (Math.random()-0.5)*0.8*s, spdY: (1.2+Math.random()*0.5)*s, color: "rainbow", oneshot: true, bouncesLeft: 0 });
            break;
            
        case 7: 
            { let sx = Math.random() * 400, sy = -40, sa = Math.atan2(heart.y - sy, heart.x - sx);
            attacks.push({ type: "sword", x: sx, y: sy, angle: sa, size: 40, width: 12, color: "#ffaa00", spd: Math.cos(sa)*2.2*s, spdY: Math.sin(sa)*2.2*s, damageOnStanding: true, damage: Math.floor(dmg * 1.3), bouncesLeft: 0 });
            if (!isEarly) { attacks.push({ type: "danger", x: heart.x + (Math.random()-0.5)*100, y: 540, size: 25, spd: (Math.random()-0.5)*1.2*s, spdY: -2.2*s, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.3), bouncesLeft: 0 }); } }
            break;

        case 8: 
            attacks.push({ type: "danger", x: -40, y: heart.y, size: 40, spd: 2.5*s, spdY: 0, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.5), bouncesLeft: 0 });
            if (!isEarly) { attacks.push({ type: "square", x: 440, y: heart.y + (Math.random()>0.5?60:-60), size: 30, spd: -2.5*s, spdY: 0, color: "#fff", damage: Math.floor(dmg * 1.5), bouncesLeft: 2 }); }
            break;

        case 9: 
            for(let i=0; i < (isEarly ? 1 : (bw >= 500 ? 2 : 1)); i++) {
                attacks.push({ type: "bomb", x: heart.x + (Math.random()-0.5)*140, y: heart.y + (Math.random()-0.5)*140, timer: 60, maxRadius: isEarly ? 75 : (80 + Math.random() * 40), hit: false, damage: Math.floor(dmg * 2), bouncesLeft: 0 });
            }
            break;

        case 10: 
            spawnBlaster(bw);
            attacks.push({ type: "square", x: heart.x, y: -40, size: 15, spd: (Math.random()-0.5)*1.5*s, spdY: 2.5*s, color: "#fff", damage: dmg, bouncesLeft: 2 });
            break;
    }
}

function stopArena() { arenaActive = false; if (arenaAttackInterval) clearInterval(arenaAttackInterval); if (animFrameId) cancelAnimationFrame(animFrameId); arenaAttackInterval = null; animFrameId = null; attacks = []; arenaClickTargets = []; arenaParticles = []; arenaTrail = []; floatingTexts = []; arenaBlasters = []; arenaShockwaves = []; document.getElementById("arenaOverlay").style.display = "none"; let skipBtn = document.getElementById("skipBossBtn"); if (skipBtn) skipBtn.style.display = "none"; }

function winArena() { 
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
        if (!defeatedBosses.includes(arenaCurrentWave)) { defeatedBosses.push(arenaCurrentWave); }
    }
    stopArena(); 
    if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = Math.floor(currentEnemy.maxHp * 0.25); 
    if (typeof victory === 'function') victory(); 
}

function loseArena() { arenaShake = isMobile ? 15 : 30; setTimeout(() => { stopArena(); if (typeof playerHp !== 'undefined') playerHp = 0; if (typeof defeat === 'function') defeat(); }, 1000); }

function applyHit(dmg, textMsg = null) { 
    if (invulnTimer > 0) return; 
    arenaHP -= dmg; arenaHitFlash = 12; invulnTimer = 45; arenaShake = isMobile ? 22 : 36; 
    playSound('hit');
    arenaShockwaves.push({ x: heart.x, y: heart.y, r: 6, v: 4.5, life: 18, maxLife: 18, color: "rgba(255, 50, 50, 0.7)" });
    if (!isMobile) spawnFloatingText(heart.x, heart.y - 20, textMsg || "-" + dmg, "#ff3333"); 
    document.getElementById("arenaHP").innerText = Math.max(0, arenaHP); 
    
    let pCount = isMobile ? 12 : 35;
    for (let j = 0; j < pCount; j++) { 
        arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 25, maxLife: 25, color: "#ff2222", size: 2+Math.random()*3 }); 
    } 
    if (arenaHP <= 0) loseArena(); 
}

// ========== ГЛАВНЫЙ ЦИКЛ РЕНДЕРИНГА ==========
function renderArena() {
    if (!arenaActive || !ctx) return;
    let now = Date.now();
    
    if (arenaPhase === "dodge") { 
        moveHeart(); 
        if (arenaAllowedTypes.includes(10) && !heartWasMoving) { 
            let bw = arenaCurrentWave, ct = bw >= 700 ? 70 : (bw >= 350 ? 90 : 110); 
            if (heartStandingTime > ct) { spawnBlaster(bw); heartStandingTime = 0; } 
        } 
    }
    
    if (ghostHP > arenaHP) { ghostHP -= 0.3; if (ghostHP < arenaHP) ghostHP = arenaHP; }
    if (ghostHP < arenaHP) ghostHP = arenaHP;
    if (ghostBossHP > arenaBossMaxHP) { ghostBossHP -= (ghostBossHP - arenaBossMaxHP) * 0.08; if (ghostBossHP - arenaBossMaxHP < 1) ghostBossHP = arenaBossMaxHP; }
    if (ghostBossHP < arenaBossMaxHP) ghostBossHP = arenaBossMaxHP;

    let sx = arenaShake ? (Math.random()-0.5)*arenaShake : 0, sy = arenaShake ? (Math.random()-0.5)*arenaShake : 0;
    if (arenaShake > 0) { arenaShake *= 0.88; if (arenaShake < 0.1) arenaShake = 0; }
    if (arenaHitFlash > 0) arenaHitFlash--; 
    if (invulnTimer > 0) invulnTimer--; 
    if (arenaComboTimer > 0) arenaComboTimer--;
    
    ctx.save(); ctx.translate(sx, sy); ctx.clearRect(-15, -15, 430, 530);
    ctx.fillStyle = "#03030b"; ctx.fillRect(0, 0, 400, 500);
    
    // СЕТКА ФОНА
    ctx.save(); ctx.strokeStyle = "rgba(255, 255, 255, 0.015)"; ctx.lineWidth = 1;
    let step = isMobile ? 50 : 25;
    for (let x = 0; x <= 400; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke(); }
    for (let y = 0; y <= 500; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke(); }
    ctx.restore();
    
    // ЗВЕЗДЫ ФОНА
    let bgCap = isMobile ? 8 : 20;
    if (arenaBgParticles.length < bgCap) {
        arenaBgParticles.push({ x: Math.random()*400, y: Math.random()*500, spd: 0.1 + Math.random()*0.2, sz: 1+Math.random()*1, alpha: 0.1+Math.random()*0.2 });
    }
    ctx.save();
    for (let bp of arenaBgParticles) {
        bp.y += bp.spd; if (bp.y > 500) { bp.y = 0; bp.x = Math.random()*400; }
        ctx.fillStyle = "#ffffff"; ctx.globalAlpha = bp.alpha; ctx.fillRect(bp.x, bp.y, bp.sz, bp.sz);
    }
    ctx.restore();

    let bc = arenaPhase === "attack" ? "#ffdd00" : (["#fff","#4499ff","#ffdd00","#ff3333","#ff69b4","#44ff44","rainbow","#ffaa00","#ff3333","#ff3333","#fff"][arenaAttackType] || "#fff");
    if (bc === "rainbow" || arenaAttackType === 6) bc = `hsl(${(now/5)%360}, 100%, 50%)`; 
    if (arenaHitFlash > 0) bc = "#ff3333";
    
    ctx.save(); ctx.strokeStyle = bc; ctx.lineWidth = 3;
    if (!isMobile) {
        ctx.shadowColor = bc; 
        ctx.shadowBlur = arenaHitFlash > 0 ? 15 : 6; 
    }
    ctx.strokeRect(2, 2, 396, 496); ctx.restore();
    
    // HUD ЗДОРОВЬЯ И БОССА
    ctx.fillStyle = "rgba(10,10,20,0.85)"; ctx.fillRect(8, 6, 384, 22); 
    ctx.fillStyle = "#301010"; ctx.fillRect(14, 14, 372, 6); 
    ctx.fillStyle = "#ffaa00"; ctx.fillRect(14, 14, 372 * Math.max(0, ghostHP/arenaMaxHP), 6); 
    ctx.fillStyle = arenaHitFlash > 0 ? "#fff" : "#00ff66"; ctx.fillRect(14, 14, 372 * Math.max(0, arenaHP/arenaMaxHP), 6); 
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px monospace"; ctx.fillText(`❤️ HP: ${Math.max(0, arenaHP)} / ${arenaMaxHP}`, 16, 24);
    
    ctx.fillStyle = "rgba(10,10,20,0.85)"; ctx.fillRect(8, 32, 384, 14); 
    let maxHp = (typeof currentEnemy !== 'undefined' && currentEnemy) ? currentEnemy.maxHp : 1000;
    ctx.fillStyle = "#202020"; ctx.fillRect(14, 37, 372, 4); 
    ctx.fillStyle = "#ff3333"; ctx.fillRect(14, 37, 372 * Math.max(0, ghostBossHP/maxHp), 4); 
    ctx.fillStyle = "#ffdd00"; ctx.fillRect(14, 37, 372 * Math.max(0, arenaBossMaxHP/maxHp), 4); 
    ctx.fillStyle = "#ccc"; ctx.font = "bold 9px monospace"; ctx.fillText(`👾 ${arenaBoss}`, 16, 43);
    
    if (arenaComboTimer > 0 && arenaComboText) { 
        ctx.save(); ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, arenaComboTimer/15)})`; 
        ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center"; 
        if (!isMobile) { ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 10; }
        ctx.fillText(arenaComboText, 200, 260); ctx.restore();
    }
    
    // ШЛЕЙФ СЕРДЦА
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = arenaTrail.length - 1; i >= 0; i--) {
        let t = arenaTrail[i]; t.life--; let ratio = t.life / t.maxLife;
        ctx.fillStyle = t.color; ctx.globalAlpha = ratio; ctx.beginPath(); ctx.arc(t.x, t.y - 2, t.size * ratio, 0, Math.PI*2); ctx.fill();
        if (t.life <= 0) arenaTrail.splice(i, 1);
    }
    ctx.restore();

    // ОБРАБОТКА ОБЫЧНЫХ АТАК
    if (arenaPhase === "dodge") {
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            
            // Новая логика бомб
            if (a.type === "bomb") { 
                a.timer--; 
                
                if (a.timer === 0) {
                    playSound('explode');
                    arenaShake = isMobile ? 24 : 45; 
                    
                    let pCount = isMobile ? 15 : 50;
                    for (let j = 0; j < pCount; j++) {
                        let angle = Math.random() * Math.PI * 2;
                        let spd = 6 + Math.random() * 10;
                        arenaParticles.push({
                            x: a.x, y: a.y,
                            vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
                            life: 30, maxLife: 30,
                            color: Math.random() > 0.5 ? "#ffaa00" : "#ff3333",
                            size: 2.5 + Math.random() * 4
                        });
                    }
                    arenaShockwaves.push({ x: a.x, y: a.y, r: 10, v: a.maxRadius / 6, life: 18, maxLife: 18, color: "#ff5555" });
                }

                if (a.timer > 0) { 
                    ctx.save(); 
                    let flashRate = Math.max(2, Math.floor(a.timer / 8));
                    let isFlashing = a.timer % flashRate < flashRate / 2;
                    ctx.fillStyle = isFlashing ? "#ffffff" : "#ff3333"; 
                    if (!isMobile) { ctx.shadowColor = "#ff3333"; ctx.shadowBlur = isFlashing ? 18 : 4; }
                    
                    ctx.beginPath(); ctx.arc(a.x, a.y, 11 + Math.abs(Math.sin(a.timer * 0.45)) * 4, 0, Math.PI*2); ctx.fill(); 
                    
                    let pulseR = a.maxRadius + Math.sin(now * 0.01) * 4;
                    ctx.strokeStyle = isFlashing ? "rgba(255, 100, 100, 0.6)" : "rgba(255, 51, 51, 0.3)"; 
                    ctx.lineWidth = 2; ctx.setLineDash([4, 4]); 
                    ctx.beginPath(); ctx.arc(a.x, a.y, pulseR, 0, Math.PI*2); ctx.stroke(); 
                    ctx.restore(); 
                } else if (a.timer > -18) { 
                    let progress = Math.abs(a.timer) / 18;
                    let cr = a.maxRadius * Math.pow(progress, 0.5); 
                    
                    ctx.save(); 
                    ctx.globalCompositeOperation = 'lighter';
                    let grad = ctx.createRadialGradient(a.x, a.y, cr*0.1, a.x, a.y, cr); 
                    grad.addColorStop(0, `rgba(255, 255, 255, ${1 - progress})`); 
                    grad.addColorStop(0.2, `rgba(255, 160, 0, ${1 - progress})`); 
                    grad.addColorStop(0.8, `rgba(255, 40, 40, ${0.4 * (1 - progress)})`); 
                    grad.addColorStop(1, 'rgba(255,0,0,0)');
                    
                    ctx.fillStyle = grad; 
                    ctx.beginPath(); ctx.arc(a.x, a.y, cr, 0, Math.PI*2); ctx.fill(); 
                    
                    if (a.timer > -4) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 * (1 + a.timer/4)})`;
                        ctx.fillRect(0, 0, 400, 500);
                    }
                    ctx.restore(); 
                    
                    if (!a.hit && invulnTimer <= 0) { 
                        let dx = heart.x - a.x, dy = heart.y - a.y; 
                        if (Math.sqrt(dx*dx + dy*dy) < (cr + heart.hitbox)) { 
                            applyHit(a.damage || 30, "ВЗРЫВ!"); 
                            a.hit = true; 
                        } 
                    } 
                } else { 
                    attacks.splice(i, 1); 
                } 
                continue; 
            }
            
            if (a.spd) a.x += a.spd;
            if (a.spdY) a.y += a.spdY;
            
            // Расчет отскоков
            if (a.type !== "wall" && a.bouncesLeft !== undefined && a.bouncesLeft > 0) {
                let sz = a.size || (a.radius ? a.radius * 2 : 20);
                if (a.x < 4 && a.spd < 0) {
                    a.spd = -a.spd; if (a.bouncesLeft !== Infinity) a.bouncesLeft--;
                    arenaShockwaves.push({ x: 4, y: a.y + sz/2, r: 4, v: 2, life: 10, maxLife: 10, color: a.color });
                } else if (a.x + sz > 396 && a.spd > 0) {
                    a.spd = -a.spd; if (a.bouncesLeft !== Infinity) a.bouncesLeft--;
                    arenaShockwaves.push({ x: 396, y: a.y + sz/2, r: 4, v: 2, life: 10, maxLife: 10, color: a.color });
                }
                if (a.y < 4 && a.spdY < 0) {
                    a.spdY = -a.spdY; if (a.bouncesLeft !== Infinity) a.bouncesLeft--;
                    arenaShockwaves.push({ x: a.x + sz/2, y: 4, r: 4, v: 2, life: 10, maxLife: 10, color: a.color });
                } else if (a.y + sz > 496 && a.spdY > 0) {
                    a.spdY = -a.spdY; if (a.bouncesLeft !== Infinity) a.bouncesLeft--;
                    arenaShockwaves.push({ x: a.x + sz/2, y: 496, r: 4, v: 2, life: 10, maxLife: 10, color: a.color });
                }
            }
            
            let hit = false;
            if (a.type === "circle" || a.type === "rainbow") { 
                let dx = heart.x - a.x, dy = heart.y - a.y; hit = Math.sqrt(dx*dx + dy*dy) < (heart.hitbox + a.radius - 2); 
            } 
            else if (a.type === "sword") { 
                let dx = heart.x - a.x, dy = heart.y - a.y; hit = Math.sqrt(dx*dx + dy*dy) < (heart.hitbox + a.size/2); 
            } 
            else {
                let sz = a.size || 20; let cx = a.x + sz/2, cy = a.y + sz/2;
                hit = Math.abs(heart.x - cx) < (sz/2 + heart.hitbox) && Math.abs(heart.y - cy) < (sz/2 + heart.hitbox);
            }
            
            // Восстановленный и дополненный блок получения урона / хила
            if (hit && invulnTimer <= 0) { 
                let bhd = a.damage || arenaBaseDmg || 5; 
                if (a.color === "#ffaa00" || a.damageOnStanding) { 
                    if (heartWasMoving) applyHit(Math.max(1, Math.floor(bhd / 4)), "ЗАЩИТА!");
                    else applyHit(bhd, "СТОИШЬ!");
                    attacks.splice(i, 1); continue; 
                } 
                if (a.color === "#ff3333" || a.damageOnMoving) { 
                    if (!heartWasMoving) applyHit(Math.max(1, Math.floor(bhd / 4)), "ЗАМЕР!");
                    else applyHit(bhd, "ДВИЖЕНИЕ!");
                    attacks.splice(i, 1); continue; 
                } 
                if (a.color === "#ff69b4" || a.knockback) { 
                    let dx = heart.x - a.x, dy = heart.y - a.y, dist = Math.sqrt(dx*dx+dy*dy) || 1; 
                    heart.x += (dx/dist)*a.knockback; heart.y += (dy/dist)*a.knockback; clampHeart(); 
                    spawnFloatingText(heart.x, heart.y - 20, "ОТБРОС!", "#ff69b4");
                    attacks.splice(i, 1); continue; 
                } 
                if (a.heal) { 
                    arenaHP = Math.min(arenaMaxHP, arenaHP + a.heal);
                    playSound('heal');
                    if (!isMobile) spawnFloatingText(heart.x, heart.y - 20, "+" + a.heal, "#44ff44");
                    document.getElementById("arenaHP").innerText = arenaHP;
                    attacks.splice(i, 1); continue;
                }
                
                applyHit(bhd);
                attacks.splice(i, 1);
                continue;
            }
            
            // Отрисовка стандартных снарядов
            ctx.fillStyle = a.color === "rainbow" ? `hsl(${(now/4)%360}, 100%, 50%)` : a.color;
            if (a.type === "circle") {
                ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2); ctx.fill();
            } else if (a.type === "sword") {
                ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle);
                ctx.fillRect(-a.size/2, -a.width/2, a.size, a.width); ctx.restore();
            } else if (a.type === "square" || a.type === "danger") {
                ctx.fillRect(a.x, a.y, a.size, a.size);
            }
            
            // Чистка за экраном
            if (a.x < -60 || a.x > 460 || a.y < -60 || a.y > 560) { attacks.splice(i, 1); }
        }
    }

    // ОБРАБОТКА БЛАСТЕРОВ ГАСТЕНА
    for (let i = arenaBlasters.length - 1; i >= 0; i--) {
        let b = arenaBlasters[i];
        b.timer--;
        ctx.save();
        if (b.state === "aiming") {
            ctx.strokeStyle = "rgba(255, 30, 30, 0.35)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + Math.cos(b.angle)*1000, b.y + Math.sin(b.angle)*1000); ctx.stroke();
            
            ctx.fillStyle = b.color === "rainbow" ? `hsl(${(now/2)%360}, 100%, 50%)` : b.color;
            ctx.fillRect(b.x - 12, b.y - 12, 24, 24);
            
            if (b.timer <= 0) { b.state = "firing"; b.timer = 14; playSound('shoot'); }
        } else if (b.state === "firing") {
            ctx.strokeStyle = b.color === "rainbow" ? `hsl(${(now/2)%360}, 100%, 50%)` : "#ffffff";
            ctx.lineWidth = b.width;
            if (!isMobile) { ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 15; }
            ctx.beginPath(); ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + Math.cos(b.angle)*1000, b.y + Math.sin(b.angle)*1000); ctx.stroke();
            
            if (!b.hasHit && invulnTimer <= 0 && arenaPhase === "dodge") {
                let A = Math.sin(b.angle), B = -Math.cos(b.angle), C = Math.cos(b.angle)*b.y - Math.sin(b.angle)*b.x;
                let dist = Math.abs(A*heart.x + B*heart.y + C) / Math.sqrt(A*A + B*B);
                if (dist < b.width/2 + heart.hitbox) { applyHit(arenaBaseDmg, "БЛАСТЕР!"); b.hasHit = true; }
            }
            if (b.timer <= 0) arenaBlasters.splice(i, 1);
        }
        ctx.restore();
    }

    // ОТРИСОВКА СЕРДЦА ИГРОКА
    if (arenaPhase === "dodge") {
        ctx.save();
        let hColor = invulnTimer > 0 && Math.floor(now / 40) % 2 === 0 ? "rgba(255,34,34,0.25)" : "#ff2222";
        ctx.fillStyle = hColor;
        if (!isMobile) { ctx.shadowColor = "#ff2222"; ctx.shadowBlur = 8; }
        ctx.beginPath();
        ctx.moveTo(heart.x, heart.y - heart.size/2);
        ctx.bezierCurveTo(heart.x - heart.size, heart.y - heart.size, heart.x - heart.size, heart.y + heart.size/3, heart.x, heart.y + heart.size);
        ctx.bezierCurveTo(heart.x + heart.size, heart.y + heart.size/3, heart.x + heart.size, heart.y - heart.size, heart.x, heart.y - heart.size/2);
        ctx.fill(); ctx.restore();
    }

    // ОТРИСОВКА КЛИК-МИШЕНЕЙ (ФАЗА АТАКИ)
    if (arenaPhase === "attack") {
        for (let t of arenaClickTargets) {
            if (t.hit) continue;
            t.pulse += 0.05;
            let r = t.radius + Math.sin(t.pulse) * 2.5;
            ctx.save(); ctx.strokeStyle = "#ffdd00"; ctx.lineWidth = 2;
            if (!isMobile) { ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 6; }
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = "rgba(255, 221, 0, 0.12)"; ctx.fill();
            ctx.beginPath(); ctx.moveTo(t.x - 7, t.y); ctx.lineTo(t.x + 7, t.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(t.x, t.y - 7); ctx.lineTo(t.x, t.y + 7); ctx.stroke();
            ctx.restore();
        }
    }

    // ИСКРЫ (ЧАСТИЦЫ)
    for (let i = arenaParticles.length - 1; i >= 0; i--) {
        let p = arenaParticles[i]; p.life--;
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; // Гравитация искр
        ctx.fillStyle = p.color;
        let sizeRatio = p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, p.size * sizeRatio, p.size * sizeRatio);
        if (p.life <= 0) arenaParticles.splice(i, 1);
    }

    // УДАРНЫЕ ВОЛНЫ
    for (let i = arenaShockwaves.length - 1; i >= 0; i--) {
        let sw = arenaShockwaves[i]; sw.life--; sw.r += sw.v;
        ctx.save(); ctx.strokeStyle = sw.color; ctx.globalAlpha = sw.life / sw.maxLife;
        ctx.lineWidth = 3 * (sw.life / sw.maxLife);
        ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI*2); ctx.stroke(); ctx.restore();
        if (sw.life <= 0) arenaShockwaves.splice(i, 1);
    }

    // ВСЛЫВАЮЩИЙ ТЕКСТ УРОНА
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i]; ft.life--; ft.y += ft.vy;
        ctx.save(); ctx.fillStyle = ft.color; ctx.font = "bold 13px monospace";
        ctx.globalAlpha = ft.life / 45; ctx.fillText(ft.text, ft.x, ft.y); ctx.restore();
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    ctx.restore(); // Сброс матрицы тряски
    if (arenaActive) animFrameId = requestAnimationFrame(renderArena);
}
