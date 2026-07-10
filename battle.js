// ========== АРЕНА UNDERTALE v9.3 FINAL ==========
// Исправлено: анти-ваншот только для Марка, пассивка Анти-спираля, аура Има

let arenaActive = false;
let arenaBoss = null;
let arenaHP = 70;
let arenaMaxHP = 70;
let arenaBossMaxHP = 1000;
let arenaAttackType = 0;
let arenaClickTargets = [];
let arenaClicksHit = 0;
let arenaTotalTargets = 8;
let arenaAttackTimeLeft = 2;
let heart = { x: 200, y: 400, size: 14, hitbox: 4, vx: 0, vy: 0 };
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
let heartSpeed = 1.2;
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
let arenaAmbientSoundInterval = null;
let wallGapIndicator = null;
let arenaKarma = 0;
let ghostBossHP = 1000;
let screenFlash = 0;
let screenFlashColor = "#ffffff";
let heartRotation = 0;
let arenaVignette = 0;
let arenaGlobalSpeedMod = 1.0;

// ========== ЗВУКОВАЯ СИСТЕМА АРЕНЫ ==========
let arenaAudioCtx = null;

function initArenaAudio() {
    if (arenaAudioCtx) {
        if (arenaAudioCtx.state === 'suspended') arenaAudioCtx.resume();
        return;
    }
    try {
        arenaAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {}
}

function playArenaSound(frequency, type, duration, volume = 0.12, detune = 0) {
    if (!arenaAudioCtx) {
        try { initArenaAudio(); } catch(e) { return; }
    }
    if (!arenaAudioCtx) return;
    try {
        const oscillator = arenaAudioCtx.createOscillator();
        const gainNode = arenaAudioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, arenaAudioCtx.currentTime);
        if (detune) oscillator.detune.setValueAtTime(detune, arenaAudioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume, arenaAudioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, arenaAudioCtx.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(arenaAudioCtx.destination);
        oscillator.start(arenaAudioCtx.currentTime);
        oscillator.stop(arenaAudioCtx.currentTime + duration);
    } catch(e) {}
}

function startArenaAmbient() {
    if (arenaAmbientSoundInterval) return;
    arenaAmbientSoundInterval = setInterval(() => {
        if (!arenaActive) {
            clearInterval(arenaAmbientSoundInterval);
            arenaAmbientSoundInterval = null;
            return;
        }
        playArenaSound(30 + Math.random() * 15, 'sine', 2.0, 0.03);
    }, 3000);
}

function stopArenaAmbient() {
    if (arenaAmbientSoundInterval) {
        clearInterval(arenaAmbientSoundInterval);
        arenaAmbientSoundInterval = null;
    }
}

// ====== ЗВУКИ ДЛЯ КАЖДОГО ТИПА АТАК ======
function sfxWhiteWalls() { playArenaSound(80, 'sawtooth', 0.5, 0.08); setTimeout(() => playArenaSound(60, 'sawtooth', 0.4, 0.06), 150); setTimeout(() => playArenaSound(100, 'triangle', 0.3, 0.05), 300); }
function sfxBlueChaos() { playArenaSound(600, 'square', 0.15, 0.04); setTimeout(() => playArenaSound(800, 'square', 0.12, 0.03), 50); setTimeout(() => playArenaSound(400, 'square', 0.1, 0.04), 100); }
function sfxYellowSwords() { playArenaSound(200, 'sawtooth', 0.3, 0.08); setTimeout(() => playArenaSound(300, 'sawtooth', 0.25, 0.06), 60); setTimeout(() => playArenaSound(500, 'triangle', 0.2, 0.05), 120); }
function sfxRedTriangles() { playArenaSound(50, 'sawtooth', 0.6, 0.1); setTimeout(() => playArenaSound(40, 'sawtooth', 0.5, 0.08), 200); setTimeout(() => playArenaSound(70, 'triangle', 0.4, 0.06), 400); }
function sfxPinkKnockback() { playArenaSound(500, 'sine', 0.2, 0.06); setTimeout(() => playArenaSound(300, 'sine', 0.25, 0.08), 60); setTimeout(() => playArenaSound(700, 'sine', 0.15, 0.04), 120); }
function sfxGreenHealSpawn() { playArenaSound(800, 'sine', 0.3, 0.06); setTimeout(() => playArenaSound(1000, 'sine', 0.25, 0.05), 100); setTimeout(() => playArenaSound(1200, 'sine', 0.2, 0.04), 200); }
function sfxRainbowDeathSpawn() { playArenaSound(30, 'sawtooth', 1.5, 0.15); setTimeout(() => playArenaSound(20, 'sawtooth', 1.2, 0.12), 200); setTimeout(() => playArenaSound(50, 'sawtooth', 1.0, 0.1), 400); }
function sfxMixAttack() { playArenaSound(150, 'square', 0.2, 0.06); setTimeout(() => playArenaSound(60, 'sawtooth', 0.3, 0.08), 100); setTimeout(() => playArenaSound(300, 'triangle', 0.15, 0.04), 200); }
function sfxZoneAttack() { playArenaSound(100, 'sawtooth', 0.5, 0.08); setTimeout(() => playArenaSound(130, 'sawtooth', 0.4, 0.06), 150); setTimeout(() => playArenaSound(90, 'triangle', 0.3, 0.05), 300); }
function sfxBombTick() { playArenaSound(1000, 'square', 0.08, 0.05); setTimeout(() => playArenaSound(800, 'square', 0.06, 0.03), 100); }
function sfxBlasterCharge() { playArenaSound(60, 'sawtooth', 0.8, 0.1); setTimeout(() => playArenaSound(90, 'sawtooth', 0.6, 0.08), 100); setTimeout(() => playArenaSound(120, 'sawtooth', 0.5, 0.06), 200); }

// ====== ОБЩИЕ ЗВУКИ ======
function sfxArenaAttackSpawn() { playArenaSound(220, 'sawtooth', 0.25, 0.06); setTimeout(() => playArenaSound(330, 'sawtooth', 0.2, 0.05), 80); }
function sfxArenaMiss() { playArenaSound(100, 'sine', 0.6, 0.1); setTimeout(() => playArenaSound(80, 'sine', 0.5, 0.08), 150); }
function sfxArenaHit() { playArenaSound(60, 'sawtooth', 0.8, 0.25); setTimeout(() => playArenaSound(45, 'sawtooth', 0.9, 0.2), 100); }
function sfxArenaHeal() { playArenaSound(400, 'sine', 0.5, 0.1); setTimeout(() => playArenaSound(600, 'sine', 0.5, 0.1), 100); setTimeout(() => playArenaSound(800, 'sine', 0.4, 0.1), 200); }
function sfxArenaBombExplosion() { playArenaSound(25, 'sawtooth', 1.5, 0.4); setTimeout(() => playArenaSound(20, 'sawtooth', 1.3, 0.35), 100); setTimeout(() => playArenaSound(15, 'sawtooth', 1.1, 0.3), 250); }
function sfxArenaBlasterFire() { playArenaSound(80, 'square', 0.8, 0.25); setTimeout(() => playArenaSound(120, 'square', 0.7, 0.2), 60); setTimeout(() => playArenaSound(200, 'square', 0.6, 0.15), 120); }
function sfxArenaTargetHit() { playArenaSound(500, 'square', 0.15, 0.06); setTimeout(() => playArenaSound(700, 'square', 0.1, 0.05), 40); }
function sfxArenaPerfect() { playArenaSound(300, 'sine', 0.4, 0.1); setTimeout(() => playArenaSound(450, 'sine', 0.4, 0.1), 80); setTimeout(() => playArenaSound(600, 'sine', 0.4, 0.1), 160); }
function sfxArenaFailAttack() { playArenaSound(100, 'triangle', 0.8, 0.2); setTimeout(() => playArenaSound(70, 'triangle', 0.7, 0.2), 150); }
function sfxArenaDeath() { playArenaSound(40, 'sawtooth', 2.0, 0.35); setTimeout(() => playArenaSound(30, 'sawtooth', 1.8, 0.3), 200); setTimeout(() => playArenaSound(20, 'sawtooth', 1.5, 0.25), 500); }
function sfxArenaVictory() { playArenaSound(400, 'sine', 0.6, 0.12); setTimeout(() => playArenaSound(500, 'sine', 0.6, 0.12), 100); setTimeout(() => playArenaSound(600, 'sine', 0.6, 0.12), 200); setTimeout(() => playArenaSound(800, 'sine', 0.7, 0.15), 300); }
function sfxArenaRainbow() { playArenaSound(50, 'sawtooth', 1.5, 0.15); setTimeout(() => playArenaSound(80, 'sawtooth', 1.2, 0.12), 200); setTimeout(() => playArenaSound(60, 'sawtooth', 1.0, 0.1), 400); }
function sfxWhoosh() { playArenaSound(200, 'sine', 0.3, 0.05, -200); setTimeout(() => playArenaSound(150, 'sine', 0.2, 0.04, -300), 50); }
function sfxBounce() { playArenaSound(300, 'square', 0.1, 0.03); setTimeout(() => playArenaSound(200, 'square', 0.08, 0.02), 40); }
function sfxShieldBreak() { playArenaSound(150, 'sawtooth', 0.3, 0.08); setTimeout(() => playArenaSound(100, 'sawtooth', 0.2, 0.06), 80); }

// ====== ОСНОВНЫЕ ФУНКЦИИ ======
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
            joystickActive = true;
            joystickId = e.touches[0].identifier;
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
    canvas.addEventListener("touchend", () => {
        joystickActive = false;
        joystickId = null;
    });
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
    if (typeof _superState !== 'undefined' && _superState.usoppStunTimer > 0) return;
    if (typeof _superState !== 'undefined' && _superState.garouTimeStop) return;
    
    let mx = 0;
    let my = 0;
    if (keys.w || keys.up) my -= 1;
    if (keys.s || keys.down) my += 1;
    if (keys.a || keys.left) mx -= 1;
    if (keys.d || keys.right) mx += 1;
    if (joystickActive) {
        mx = (joystickX - heart.x) / 15;
        my = (joystickY - heart.y) / 15;
        let len = Math.sqrt(mx * mx + my * my);
        if (len > 1) {
            mx /= len;
            my /= len;
        }
    }
    
    if (typeof _superState !== 'undefined' && _superState.invertControls) {
        mx = -mx;
        my = -my;
    }
    
    let isMoving = Math.abs(mx) > 0.05 || Math.abs(my) > 0.05;
    heartWasMoving = isMoving;
    if (isMoving) {
        heartStandingTime = 0;
        heartRotation += 0.15;
        let len = Math.sqrt(mx * mx + my * my);
        if (len > 1) {
            mx /= len;
            my /= len;
        }
        heart.x += mx * heartSpeed;
        heart.y += my * heartSpeed;
    } else {
        heartStandingTime++;
        heartRotation *= 0.9;
    }
    
    if (Math.abs(heart.vx) > 0.01 || Math.abs(heart.vy) > 0.01) {
        heart.x += heart.vx;
        heart.y += heart.vy;
        heart.vx *= 0.92;
        heart.vy *= 0.92;
        if (Math.abs(heart.vx) < 0.1) heart.vx = 0;
        if (Math.abs(heart.vy) < 0.1) heart.vy = 0;
    }
    clampHeart();
    
    if (Math.random() > 0.3) {
        let trailLife = 12;
        arenaTrail.push({
            x: heart.x,
            y: heart.y,
            life: trailLife,
            maxLife: trailLife,
            size: heart.size * 0.75,
            color: "rgba(255, 30, 30, 0.35)"
        });
    }
    
    if (arenaAttackType === 4) {
        if (heart.x - heart.hitbox < 2 || heart.x + heart.hitbox > 398 ||
            heart.y - heart.hitbox < 2 || heart.y + heart.hitbox > 498) {
            if (invulnTimer <= 0) {
                invulnTimer = 20;
                applyHit(Math.max(8, Math.floor(arenaBaseDmg * 1.5)), "ШИПЫ!");
            }
        }
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 50,
        vy: -1.8,
        vx: (Math.random() - 0.5) * 1.5
    });
}

function checkClickTarget(mx, my) {
    for (let i = arenaClickTargets.length - 1; i >= 0; i--) {
        let t = arenaClickTargets[i];
        if (Math.sqrt((mx - t.x) ** 2 + (my - t.y) ** 2) < t.radius + 15 && !t.hit) {
            t.hit = true;
            arenaClicksHit++;
            arenaShake = 8;
            arenaShockwaves.push({ x: t.x, y: t.y, r: 8, v: 6, life: 16, maxLife: 16, color: "#ffdd00" });
            sfxArenaTargetHit();
            let pCount = 35;
            for (let j = 0; j < pCount; j++) {
                let angle = Math.random() * Math.PI * 2;
                let spd = 3 + Math.random() * 6;
                arenaParticles.push({
                    x: t.x, y: t.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
                    life: 28, maxLife: 28, color: Math.random() > 0.3 ? "#ffdd00" : "#ffffff", size: 1.5 + Math.random() * 4
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
    let hpUpgradeBonus = 0;
    if (typeof upgrades !== 'undefined' && upgrades.hp) {
        hpUpgradeBonus = Math.floor(upgrades.hp.level * upgrades.hp.increment / 2);
    }
    let playerMaxHp = (typeof window !== 'undefined' && window.playerMaxHp) ? window.playerMaxHp : 100;
    let hpScaleBonus = Math.floor(playerMaxHp / 20);
    arenaMaxHP = 70 + bonus + hpUpgradeBonus + hpScaleBonus;
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
    initArenaAudio();
    let btn = document.getElementById("startArenaBtn"); if (btn) btn.style.display = "none";
    let spareBtn = document.getElementById("spareBtn"); if (spareBtn) spareBtn.style.display = "none";
    let skipBtn = document.getElementById("skipArenaBtn"); if (skipBtn) skipBtn.style.display = "none";
    
    arenaBossDefeatedBefore = (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(bossWave));
    arenaActive = true;
    arenaCurrentWave = bossWave;
    calculateArenaHP();
    arenaKarma = 0;
    screenFlash = 0;
    arenaVignette = 0;
    arenaGlobalSpeedMod = 1.0;
    
    if (typeof _superState !== 'undefined') {
        _superState.markResurrectCharges = 2;
        _superState.allmightPermaSlow = false;
        _superState.allmightDmgMult = 1;
        _superState.allmightBuffTimer = 0;
        _superState.antispiralSpeedBoost = false;
        _superState.antispiralFrozen = false;
        _superState.imAuraActive = false;
        _superState.kaidoDrinking = false;
        _superState.kaidoBuffActive = false;
        _superState.kaidoDmgReduction = false;
        _superState.kaidoDmgBonus = 1;
        _superState.kaidoSpeedBonus = 1;
        _superState.invertControls = false;
        _superState.dandyInvuln = false;
        _superState.dandyLightnings = false;
        _superState.dandyDoubleTargets = false;
        _superState.dandyDmgBuff = null;
        _superState.dandyShield = null;
        _superState.dandyVulnerable = null;
        _superState.garpHakiActive = false;
        _superState.garpHakiTimer = 0;
        _superState.garpChargeTimer = 0;
        _superState.garpImpactActive = false;
        _superState.garouInvulnTimer = 0;
        _superState.garouTimeStop = false;
        _superState.screenShakeAmount = 0;
        _superState.screenFlashWhite = 0;
    }
    
    heartSpeed = 1.2;
    if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0 && mainCardIndex >= 0 && mainCardIndex < team.length) {
        let mainCardIdx = team[mainCardIndex];
        if (typeof myCards !== 'undefined' && mainCardIdx >= 0 && mainCardIdx < myCards.length) {
            let mainCard = myCards[mainCardIdx];
            if (mainCard && typeof mainCard.speed === 'number') {
                heartSpeed = mainCard.speed;
            }
        }
    }
    let speedDisplay = document.getElementById("arenaSpeedDisplay");
    if (speedDisplay) speedDisplay.innerText = heartSpeed.toFixed(1);
    
    arenaClickTargets = [];
    arenaClicksHit = 0;
    arenaPhase = "dodge";
    attacks = [];
    arenaBlasters = [];
    arenaParticles = [];
    floatingTexts = [];
    arenaTrail = [];
    arenaShockwaves = [];
    wallGapIndicator = null;
    arenaShake = 0;
    arenaHitFlash = 0;
    invulnTimer = 0;
    arenaComboText = "";
    arenaComboTimer = 0;
    heart.x = 200;
    heart.y = 400;
    heart.vx = 0;
    heart.vy = 0;
    heartRotation = 0;
    heartWasMoving = false;
    heartStandingTime = 0;
    
    arenaSpeedMult = Math.min(15.0, 1.0 + Math.floor((bossWave - 50) / 50) * 0.1);
    if (bossWave < 50) arenaSpeedMult = 1.0;
    
    arenaAllowedTypes = getAttackTypes(bossWave);
    let bt = typeof bossTemplates !== 'undefined' ? bossTemplates[bossWave] : null;
    arenaBoss = bt ? bt.name : "БОСС ВРАТ";
    arenaBossMaxHP = bt ? Math.floor((50 + bossWave * 12) * bt.hpMult) : 1000 + bossWave * 10;
    ghostBossHP = arenaBossMaxHP;
    
    if (bt && bt.dmgMult) arenaBossDmgMult = bt.dmgMult;
    else arenaBossDmgMult = 1.0 + (bossWave - 50) / 100 * 0.5;
    
    arenaBaseDmg = Math.max(2, Math.floor((5 + bossWave * 1.5) * arenaBossDmgMult / 3));
    
    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
    document.getElementById("arenaTimer").innerText = "∞";
    
    let skipBossBtn = document.getElementById("skipBossBtn");
    if (skipBossBtn) skipBossBtn.style.display = arenaBossDefeatedBefore ? "block" : "none";
    
    if (typeof initSuperState === 'function') initSuperState();
    
    if (!ctx) initArena();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    
    startArenaAmbient();
    startDodgePhase();
    animFrameId = requestAnimationFrame(renderArena);
}

function startDodgePhase() {
    arenaPhase = "dodge";
    attacks = [];
    arenaBlasters = [];
    wallGapIndicator = null;
    heart.x = 200; heart.y = 400; heart.vx = 0; heart.vy = 0;
    
    arenaAttackType = arenaAllowedTypes[Math.floor(Math.random() * arenaAllowedTypes.length)];
    let typeNames = {
        0: "⬜ СТЕНЫ", 1: "🔷 ХАОС", 2: "⚡ ЖЁЛТЫЕ", 3: "🛑 КРАСНЫЕ", 4: "💗 РОЗОВЫЕ",
        5: "💚 ЗЕЛЁНЫЕ", 6: "🌈 РАДУЖНЫЕ", 7: "⚡🛑 МИКС", 8: "🟥⬜ ЗОНЫ", 9: "💣 БОМБЫ", 10: "🔫 БЛАСТЕРЫ"
    };
    document.getElementById("arenaBossName").innerText = arenaBoss + " — " + (typeNames[arenaAttackType] || "Атака") + " | ⚡" + heartSpeed.toFixed(1);
    
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    let baseInterval = 2400;
    if (arenaAttackType === 0) baseInterval = 3400;
    if (arenaAttackType === 2 || arenaAttackType === 3) baseInterval = 2200;
    if (arenaAttackType === 6) baseInterval = 4000;
    if (arenaAttackType === 7) baseInterval = 2400;
    if (arenaAttackType === 8) baseInterval = 2800;
    if (arenaAttackType === 9) baseInterval = 3400;
    if (arenaAttackType === 10) baseInterval = 2400;
    
    switch(arenaAttackType) {
        case 0: sfxWhiteWalls(); break; case 1: sfxBlueChaos(); break; case 2: sfxYellowSwords(); break;
        case 3: sfxRedTriangles(); break; case 4: sfxPinkKnockback(); break; case 5: sfxGreenHealSpawn(); break;
        case 6: sfxRainbowDeathSpawn(); break; case 7: sfxMixAttack(); break; case 8: sfxZoneAttack(); break;
        case 9: sfxBombTick(); break; case 10: sfxBlasterCharge(); break; default: sfxArenaAttackSpawn();
    }
    
    arenaAttackInterval = setInterval(() => {
        if (arenaPhase === "dodge" && arenaActive) {
            spawnAttack();
            switch(arenaAttackType) { case 9: sfxBombTick(); break; case 10: sfxBlasterCharge(); break; default: sfxWhoosh(); }
        }
    }, Math.max(800, baseInterval / arenaSpeedMult));
    
    let dodgeTime = Math.max(10000, 13000 + Math.random() * 6000);
    // Пассивка Анти-спираля: +30% к длительности фазы уклонения
    if (typeof getMainCard === 'function') {
        let mainCard = getMainCard();
        if (mainCard && mainCard.name === "Анти-спираль") {
            dodgeTime = Math.floor(dodgeTime * 1.3);
        }
    }
    setTimeout(() => { if (arenaPhase === "dodge" && arenaActive) startAttackPhase(); }, dodgeTime);
}

function startAttackPhase() {
    arenaPhase = "attack";
    attacks = []; arenaBlasters = []; wallGapIndicator = null; arenaClickTargets = []; arenaClicksHit = 0;
    arenaTotalTargets = 4 + Math.floor(arenaSpeedMult * 0.8);
    if (typeof _superState !== 'undefined' && _superState.dandyDoubleTargets) {
        arenaTotalTargets *= 2;
        _superState.dandyDoubleTargets = false;
    }
    arenaAttackTimeLeft = 2;
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    
    document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
    playArenaSound(200, 'square', 0.3, 0.08); setTimeout(() => playArenaSound(300, 'square', 0.2, 0.06), 100);
    
    let usedPositions = [];
    for (let i = 0; i < arenaTotalTargets; i++) {
        let x, y, tooClose, attempts = 0;
        do {
            x = 40 + Math.random() * 320; y = 80 + Math.random() * 340;
            tooClose = false;
            for (let p of usedPositions) { if (Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2) < 60) { tooClose = true; break; } }
            attempts++;
        } while (tooClose && attempts < 50);
        usedPositions.push({ x: x, y: y });
        arenaClickTargets.push({ x: x, y: y, radius: 26, hit: false, pulse: Math.random() * Math.PI * 2 });
    }
    
    let attackTimer = setInterval(() => {
        arenaAttackTimeLeft--;
        document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
        playArenaSound(1000, 'square', 0.05, 0.02);
        if (arenaAttackTimeLeft <= 0) { clearInterval(attackTimer); applyArenaDamage(); }
    }, 1000);
}

function applyArenaDamage() {
    if (!arenaActive) return;
    let dmgMult = 0;
    let ratio = arenaClicksHit / arenaTotalTargets;
    if (ratio >= 1.0) { dmgMult = 2.5; arenaComboText = "🔥 ИДЕАЛЬНО! x2.5"; sfxArenaPerfect(); }
    else if (ratio >= 0.8) { dmgMult = 1.8; arenaComboText = "⚡ ОТЛИЧНО! x1.8"; sfxArenaPerfect(); }
    else if (ratio >= 0.6) { dmgMult = 1.3; arenaComboText = "✨ ХОРОШО! x1.3"; sfxArenaTargetHit(); }
    else if (ratio >= 0.4) { dmgMult = 1.0; arenaComboText = "👍 КЛАССИКА! x1.0"; }
    else if (ratio >= 0.2) { dmgMult = 0.6; arenaComboText = "💤 СЛАБОВАТО... x0.6"; sfxArenaFailAttack(); }
    else if (ratio > 0.0) { dmgMult = 0.2; arenaComboText = "🥱 ПОЧТИ МИМО... x0.2"; sfxArenaFailAttack(); }
    else { dmgMult = 0.0; arenaComboText = "❌ ПРОМАХ! x0"; sfxArenaMiss(); }
    
    arenaComboTimer = 55;
    let baseDmg = typeof window !== 'undefined' && window.playerFinalDamage ? window.playerFinalDamage : 20;
    let finalDmg = Math.floor(baseDmg * dmgMult);
    
    if (typeof _superState !== 'undefined') {
        if (_superState.dekusDmgMult && _superState.dekusDmgMult > 1) finalDmg = Math.floor(finalDmg * _superState.dekusDmgMult);
        if (_superState.nikaDmgMult && _superState.nikaDmgMult > 1) finalDmg = Math.floor(finalDmg * _superState.nikaDmgMult);
        if (_superState.kaidoBuffActive && _superState.kaidoDmgBonus > 1) finalDmg = Math.floor(finalDmg * _superState.kaidoDmgBonus);
        if (_superState.garpHakiActive) finalDmg = Math.floor(finalDmg * 1.3);
        if (_superState.allmightDmgMult && _superState.allmightDmgMult > 1) finalDmg = Math.floor(finalDmg * _superState.allmightDmgMult);
        if (_superState.dandyDmgBuff && _superState.dandyDmgBuff.timer > 0) finalDmg = Math.floor(finalDmg * _superState.dandyDmgBuff.mult);
    }
    
    if (finalDmg > 0) {
        arenaBossMaxHP -= finalDmg;
        arenaShake = 20;
        screenFlash = 10;
        screenFlashColor = "#ffdd00";
        arenaShockwaves.push({ x: 200, y: 250, r: 15, v: 14, life: 22, maxLife: 22, color: "rgba(255, 255, 255, 0.9)" });
        for (let j = 0; j < 30; j++) {
            let angle = Math.random() * Math.PI * 2;
            arenaParticles.push({ x: 200, y: 250, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, life: 35, maxLife: 35, color: "#ffdd00", size: 2 + Math.random() * 5 });
        }
    }
    setTimeout(() => {
        if (arenaBossMaxHP <= 0) { sfxArenaVictory(); winArena(); return; }
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
    if (side === 0) { x = Math.random() * 400; y = -30; }
    else if (side === 1) { x = Math.random() * 400; y = 530; }
    else if (side === 2) { x = -30; y = Math.random() * 500; }
    else { x = 430; y = Math.random() * 500; }
    arenaBlasters.push({
        x: x, y: y, angle: Math.atan2(heart.y - y, heart.x - x),
        color: bColor, state: "aiming", timer: 70, width: isRainbow ? 15 : 30, hasHit: false
    });
    sfxBlasterCharge();
}

function spawnAttack() {
    let s = arenaSpeedMult;
    let bw = arenaCurrentWave;
    let isEarly = bw < 100;
    let dmg = arenaBaseDmg;
    switch (arenaAttackType) {
        case 0:
            let isVertical = Math.random() > 0.5;
            if (isVertical) {
                let offsetDirection = Math.random() > 0.5 ? 1 : -1;
                let gapCenter = heart.y + offsetDirection * (50 + Math.random() * 80);
                let gapSize = 70 + Math.random() * 40;
                let startX = Math.random() > 0.5 ? -30 : 430;
                let dirX = startX < 0 ? 3.5 * s : -3.5 * s;
                wallGapIndicator = { x: startX < 0 ? 0 : 370, y: gapCenter, w: 30, h: gapSize, life: 35, vertical: true };
                for (let i = 10; i < 490; i += 22) {
                    if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                    attacks.push({ type: "square", x: startX, y: i, size: 24, spd: dirX, spdY: 0, color: "#fff", damage: dmg, bouncesLeft: 0 });
                }
            } else {
                let offsetDirection = Math.random() > 0.5 ? 1 : -1;
                let gapCenter = heart.x + offsetDirection * (50 + Math.random() * 80);
                let gapSize = 70 + Math.random() * 40;
                let startY = Math.random() > 0.5 ? -30 : 530;
                let dirY = startY < 0 ? 2.4 * s : -2.4 * s;
                wallGapIndicator = { x: gapCenter, y: startY < 0 ? 0 : 470, w: gapSize, h: 30, life: 35, vertical: false };
                for (let i = 10; i < 390; i += 22) {
                    if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                    attacks.push({ type: "square", x: i, y: startY, size: 24, spd: 0, spdY: dirY, color: "#fff", damage: dmg, bouncesLeft: 0 });
                }
            }
            break;
        case 1:
            let chaosCount = isEarly ? 1 : 2;
            for (let i = 0; i < chaosCount; i++) {
                let side = Math.floor(Math.random() * 4);
                let x, y;
                if (side === 0) { x = Math.random() * 400; y = -30; }
                else if (side === 1) { x = Math.random() * 400; y = 530; }
                else if (side === 2) { x = -30; y = Math.random() * 500; }
                else { x = 430; y = Math.random() * 500; }
                let angle = Math.atan2(heart.y - y, heart.x - x);
                attacks.push({ type: "square", x: x, y: y, size: 20, spd: Math.cos(angle) * 2.0, spdY: Math.sin(angle) * 2.0, color: "#4499ff", damage: Math.floor(dmg / 2), bouncesLeft: 3 });
            }
            break;
        case 2: 
            for (let i = 0; i < (isEarly ? 1 : 2); i++) {
                let side = Math.floor(Math.random() * 4);
                let xPos, yPos;
                if (side === 0) { xPos = Math.random() * 400; yPos = -40; }
                else if (side === 1) { xPos = Math.random() * 400; yPos = 540; }
                else if (side === 2) { xPos = -40; yPos = Math.random() * 500; }
                else { xPos = 440; yPos = Math.random() * 500; }
                let angle = Math.atan2(heart.y - yPos, heart.x - xPos);
                attacks.push({ type: "sword", x: xPos, y: yPos, angle: angle, size: 45, width: 15, color: "#ffaa00", spd: Math.cos(angle) * 2.4, spdY: Math.sin(angle) * 2.4, damageOnStanding: true, damage: Math.floor(dmg * 1.2), bouncesLeft: 0 });
            }
            break;
        case 3:
            for (let i = 0; i < (isEarly ? 1 : 2); i++) {
                let vx = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4) * s;
                let vy = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4) * s;
                attacks.push({ type: "danger", x: 200, y: 180, size: 70, spd: vx, spdY: vy, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.6), bouncesLeft: 1 });
            }
            break;
        case 4:
            for (let i = 0; i < (isEarly ? 2 : 3); i++) {
                let rx = (Math.random() - 0.5) * 2;
                attacks.push({ type: "square", x: heart.x + (Math.random() - 0.5) * 120, y: -40, size: 25, spd: rx, spdY: 1.8 + Math.random() * 1.0, color: "#ff69b4", knockback: 80, bouncesLeft: Infinity });
            }
            break;
        case 5:
            if (arenaHP < arenaMaxHP) {
                attacks.push({ type: "circle", x: Math.random() * 400, y: -30, radius: 18, spd: (Math.random() - 0.5) * 1.5, spdY: 2.5, color: "#44ff44", healPercent: 0.15, bouncesLeft: 2 });
            } else {
                attacks.push({ type: "square", x: Math.random() * 360 + 20, y: -30, size: 22, spd: 0, spdY: 3.0, color: "#fff", damage: dmg, bouncesLeft: 2 });
            }
            break;
        case 6:
            attacks.push({ type: "rainbow", x: 50 + Math.random() * 300, y: -60, radius: 30, spd: (Math.random() - 0.5) * 0.8, spdY: 1.2 + Math.random() * 0.5, color: "rainbow", oneshot: true, bouncesLeft: 0 });
            break;
        case 7:
            for (let i = 0; i < (isEarly ? 1 : 2); i++) {
                let side = Math.floor(Math.random() * 4);
                let sx, sy;
                if (side === 0) { sx = Math.random() * 400; sy = -40; }
                else if (side === 1) { sx = Math.random() * 400; sy = 540; }
                else if (side === 2) { sx = -40; sy = Math.random() * 500; }
                else { sx = 440; sy = Math.random() * 500; }
                let sa = Math.atan2(heart.y - sy, heart.x - sx);
                attacks.push({ type: "sword", x: sx, y: sy, angle: sa, size: 40, width: 12, color: "#ffaa00", spd: Math.cos(sa) * 2.2, spdY: Math.sin(sa) * 2.2, damageOnStanding: true, damage: Math.floor(dmg * 1.3), bouncesLeft: 0 });
                attacks.push({ type: "danger", x: heart.x + (Math.random() - 0.5) * 100, y: 540, size: 25, spd: (Math.random() - 0.5) * 1.2, spdY: -2.2, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.3), bouncesLeft: 0 });
            }
            break;
        case 8:
            attacks.push({ type: "danger", x: -40, y: heart.y, size: 40, spd: 2.5 * s, spdY: 0, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.5), bouncesLeft: 0 });
            if (!isEarly) attacks.push({ type: "square", x: 440, y: heart.y + (Math.random() > 0.5 ? 60 : -60), size: 30, spd: -2.5 * s, spdY: 0, color: "#fff", damage: Math.floor(dmg * 1.5), bouncesLeft: 2 });
            break;
        case 9:
            for (let i = 0; i < (isEarly ? 1 : (bw >= 500 ? 2 : 1)); i++) {
                let bx = 50 + Math.random() * 300; let by = 50 + Math.random() * 400;
                attacks.push({ type: "bomb", x: bx, y: by, timer: 60, maxRadius: isEarly ? 75 : (80 + Math.random() * 40), hit: false, damage: Math.floor(dmg * 2), bouncesLeft: 0, particlesSpawned: false, shakeTime: 0 });
            }
            break;
        case 10:
            spawnBlaster(bw);
            break;
    }
}

function stopArena() {
    if (typeof resetAllSupers === 'function') resetAllSupers();
    
    arenaActive = false;
    stopArenaAmbient();
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    arenaAttackInterval = null; animFrameId = null;
    attacks = []; arenaClickTargets = []; arenaParticles = []; arenaTrail = []; floatingTexts = []; arenaBlasters = []; arenaShockwaves = [];
    document.getElementById("arenaOverlay").style.display = "none";
    let skipBtn = document.getElementById("skipBossBtn"); if (skipBtn) skipBtn.style.display = "none";
    let superBtn = document.getElementById("superBtn"); if (superBtn) superBtn.style.display = "none";
}

function winArena() {
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
        if (!defeatedBosses.includes(arenaCurrentWave)) defeatedBosses.push(arenaCurrentWave);
    }
    if (typeof grantBossGachaReward === 'function') grantBossGachaReward(arenaCurrentWave);
    if (typeof resetAllCooldowns === 'function') resetAllCooldowns();
    stopArena();
    if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = Math.floor(currentEnemy.maxHp * 0.25);
    if (typeof victory === 'function') victory();
}

function loseArena() {
    // Анти-ваншот ТОЛЬКО для Императора Марка
    if (typeof _superState !== 'undefined' && _superState.markResurrectCharges > 0) {
        let mainCard = typeof getMainCard === 'function' ? getMainCard() : null;
        if (mainCard && mainCard.name === "Император Марк") {
            _superState.markResurrectCharges--;
            arenaHP = Math.ceil(arenaMaxHP * 0.25);
            document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
            _superState.screenFlashWhite = 30;
            spawnFloatingText(heart.x, heart.y - 20, "ВОСКРЕС! (" + _superState.markResurrectCharges + ")", "#ffd700");
            return;
        }
    }
    
    if (typeof resetAllCooldowns === 'function') resetAllCooldowns();
    if (typeof resetAllSupers === 'function') resetAllSupers();
    
    sfxArenaDeath();
    arenaShake = 25;
    screenFlash = 25;
    screenFlashColor = "#ff0000";
    for (let j = 0; j < 60; j++) {
        let angle = Math.random() * Math.PI * 2;
        arenaParticles.push({ x: heart.x, y: heart.y, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, life: 40, maxLife: 40, color: "#ff0000", size: 3 + Math.random() * 6 });
    }
    setTimeout(() => {
        stopArena();
        if (typeof playerHp !== 'undefined') playerHp = 0;
        if (typeof defeat === 'function') defeat();
    }, 1200);
}

function applyHit(dmg, textMsg = null, isTrueOneshot = false) {
    if (typeof _superState !== 'undefined' && _superState.usoppInvuln) return;
    if (typeof _superState !== 'undefined' && _superState.garouInvulnTimer > 0) return;
    if (typeof _superState !== 'undefined' && _superState.dandyInvuln) return;
    
    if (typeof _superState !== 'undefined' && _superState.nikaActive) dmg = Math.floor(dmg * 0.6);
    if (typeof _superState !== 'undefined' && _superState.kaidoDmgReduction) dmg = Math.floor(dmg * 0.7);
    if (typeof _superState !== 'undefined' && _superState.garpHakiActive) dmg = Math.floor(dmg * 0.4);
    if (typeof _superState !== 'undefined' && _superState.dandyShield && _superState.dandyShield.timer > 0) dmg = Math.floor(dmg * _superState.dandyShield.mult);
    if (typeof _superState !== 'undefined' && _superState.dandyVulnerable && _superState.dandyVulnerable.timer > 0) dmg = Math.floor(dmg * _superState.dandyVulnerable.mult);
    
    if (invulnTimer > 0) return;
    if (arenaAttackType !== 10) invulnTimer = 45;

    if (isTrueOneshot || dmg >= arenaMaxHP) {
        arenaHP = 0;
    } else {
        let directDmg = 1;
        let karmaDmg = dmg - directDmg;
        if (karmaDmg < 0) karmaDmg = 0;
        arenaHP -= directDmg;
        arenaKarma += karmaDmg;
    }

    arenaHitFlash = 12;
    arenaShake = 18;
    sfxArenaHit();
    screenFlash = 6;
    screenFlashColor = "#ff4444";
    arenaVignette = 15;
    arenaShockwaves.push({ x: heart.x, y: heart.y, r: 5, v: 5, life: 20, maxLife: 20, color: "rgba(255, 50, 50, 0.8)" });
    spawnFloatingText(heart.x, heart.y - 20, textMsg || "-" + dmg, "#ff3333");
    document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP));
    
    let pCount = 35;
    for (let j = 0; j < pCount; j++) {
        arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16, life: 28, maxLife: 28, color: "#ff2222", size: 2 + Math.random() * 4 });
    }
    
    if (Math.ceil(arenaHP) <= 0) loseArena();
}

function renderArena() {
    if (!arenaActive || !ctx) return;
    
    if (typeof tickSupers === 'function') tickSupers();
    
    let now = Date.now();
    if (arenaPhase === "dodge") {
        moveHeart();
        if (arenaAllowedTypes.includes(10) && !heartWasMoving) {
            let bw = arenaCurrentWave;
            let ct = bw >= 700 ? 70 : (bw >= 350 ? 90 : 110);
            if (heartStandingTime > ct) { spawnBlaster(bw); heartStandingTime = 0; }
        }
    }
    
    if (arenaKarma > 0) {
        let drain = Math.max(0.15, arenaKarma * 0.05);
        if (arenaKarma < drain) drain = arenaKarma;
        arenaKarma -= drain;
        if (arenaHP > 1) {
            arenaHP -= drain;
            if (arenaHP < 1) arenaHP = 1;
        }
        document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP));
    }
    
    if (ghostBossHP > arenaBossMaxHP) { ghostBossHP -= (ghostBossHP - arenaBossMaxHP) * 0.08; if (ghostBossHP - arenaBossMaxHP < 1) ghostBossHP = arenaBossMaxHP; }
    if (ghostBossHP < arenaBossMaxHP) ghostBossHP = arenaBossMaxHP;
    
    let superShakeX = 0, superShakeY = 0;
    if (typeof _superState !== 'undefined' && _superState.screenShakeAmount > 0) {
        superShakeX = (Math.random() - 0.5) * _superState.screenShakeAmount;
        superShakeY = (Math.random() - 0.5) * _superState.screenShakeAmount;
    }
    
    let sx = (arenaShake ? (Math.random() - 0.5) * arenaShake : 0) + superShakeX;
    let sy = (arenaShake ? (Math.random() - 0.5) * arenaShake : 0) + superShakeY;
    if (arenaShake > 0) { arenaShake *= 0.88; if (arenaShake < 0.1) arenaShake = 0; }
    if (arenaHitFlash > 0) arenaHitFlash -= 3;
    if (invulnTimer > 0) invulnTimer--;
    if (arenaComboTimer > 0) arenaComboTimer--;
    if (wallGapIndicator) { wallGapIndicator.life--; if (wallGapIndicator.life <= 0) wallGapIndicator = null; }
    if (screenFlash > 0) screenFlash--;
    if (arenaVignette > 0) arenaVignette--;
    
    ctx.save(); ctx.translate(sx, sy);
    ctx.clearRect(-15, -15, 430, 530); ctx.fillStyle = "#03030b"; ctx.fillRect(0, 0, 400, 500);
    
    if (typeof _superState !== 'undefined' && _superState.screenFlashWhite > 0) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = Math.min(1, _superState.screenFlashWhite / 20);
        ctx.fillRect(0, 0, 400, 500);
        ctx.restore();
    }
    
    if (screenFlash > 0) {
        ctx.save();
        ctx.fillStyle = screenFlashColor;
        ctx.globalAlpha = screenFlash / 25;
        ctx.fillRect(0, 0, 400, 500);
        ctx.restore();
    }
    
    if (arenaVignette > 0) {
        ctx.save();
        let vignetteGrad = ctx.createRadialGradient(200, 250, 150, 200, 250, 350);
        vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vignetteGrad.addColorStop(1, `rgba(255,0,0,${arenaVignette / 30})`);
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, 400, 500);
        ctx.restore();
    }
    
    ctx.save(); ctx.strokeStyle = "rgba(255, 255, 255, 0.02)"; ctx.lineWidth = 1;
    let step = 25;
    for (let x = 0; x <= 400; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke(); }
    for (let y = 0; y <= 500; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke(); }
    ctx.restore();
    
    let bgCap = 25;
    if (arenaBgParticles.length < bgCap) {
        arenaBgParticles.push({ x: Math.random() * 400, y: Math.random() * 500, spd: 0.1 + Math.random() * 0.3, sz: 1 + Math.random() * 2, alpha: 0.08 + Math.random() * 0.2 });
    }
    ctx.save();
    for (let bp of arenaBgParticles) {
        bp.y += bp.spd; if (bp.y > 500) { bp.y = 0; bp.x = Math.random() * 400; }
        ctx.fillStyle = "#ffffff"; ctx.globalAlpha = bp.alpha; ctx.fillRect(bp.x, bp.y, bp.sz, bp.sz);
    }
    ctx.restore();
    
    let bc = arenaPhase === "attack" ? "#ffdd00" : (["#fff","#4499ff","#ffdd00","#ff3333","#ff69b4","#44ff44","rainbow","#ffaa00","#ff3333","#ff3333","#fff"][arenaAttackType] || "#fff");
    if (bc === "rainbow" || arenaAttackType === 6) bc = `hsl(${(now / 5) % 360}, 100%, 50%)`;
    if (arenaHitFlash > 0) bc = "#ff3333";
    ctx.save(); ctx.strokeStyle = bc; ctx.lineWidth = 3; ctx.shadowColor = bc; ctx.shadowBlur = arenaHitFlash > 0 ? 18 : 8;
    ctx.strokeRect(2, 2, 396, 496); ctx.restore();
    
    if (arenaAttackType === 4 && arenaPhase === "dodge") {
        ctx.save();
        let spikeGlow = Math.sin(now / 200) * 0.3 + 0.7;
        ctx.fillStyle = "#ff3333";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10 * spikeGlow;
        for (let x = 0; x < 400; x += 15) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 7, 18); ctx.lineTo(x + 15, 0); ctx.fill(); }
        for (let x = 0; x < 400; x += 15) { ctx.beginPath(); ctx.moveTo(x, 500); ctx.lineTo(x + 7, 482); ctx.lineTo(x + 15, 500); ctx.fill(); }
        for (let y = 0; y < 500; y += 15) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(18, y + 7); ctx.lineTo(0, y + 15); ctx.fill(); }
        for (let y = 0; y < 500; y += 15) { ctx.beginPath(); ctx.moveTo(400, y); ctx.lineTo(382, y + 7); ctx.lineTo(400, y + 15); ctx.fill(); }
        ctx.restore();
    }
    
    ctx.fillStyle = "rgba(10,10,20,0.9)"; ctx.fillRect(8, 6, 384, 22);
    
    let totalWidth = 372 * Math.max(0, arenaHP / arenaMaxHP);
    let yellowWidth = 372 * Math.max(0, arenaKarma / arenaMaxHP);
    if (yellowWidth > totalWidth) yellowWidth = totalWidth;
    let greenWidth = totalWidth - yellowWidth;
    ctx.fillStyle = "#301010"; ctx.fillRect(14, 14, 372, 6);
    if (greenWidth > 0) {
        ctx.fillStyle = arenaHitFlash > 0 ? "#fff" : "#00ff66";
        ctx.fillRect(14, 14, greenWidth, 6);
    }
    if (yellowWidth > 0) {
        let karmaGlow = Math.sin(now / 120) * 0.2 + 0.8;
        ctx.fillStyle = "#ffaa00";
        ctx.globalAlpha = karmaGlow;
        ctx.fillRect(14 + greenWidth, 14, yellowWidth, 6);
        ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px monospace";
    ctx.shadowColor = "#000"; ctx.shadowBlur = 2;
    ctx.fillText(`❤️ HP: ${Math.max(0, Math.ceil(arenaHP))} / ${arenaMaxHP}`, 16, 24);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "rgba(10,10,20,0.9)"; ctx.fillRect(8, 32, 384, 14);
    let maxHp = (typeof currentEnemy !== 'undefined' && currentEnemy) ? currentEnemy.maxHp : 1000;
    ctx.fillStyle = "#202020"; ctx.fillRect(14, 37, 372, 4);
    ctx.fillStyle = "#ff3333"; ctx.fillRect(14, 37, 372 * Math.max(0, ghostBossHP / maxHp), 4);
    let bossGlow = Math.sin(now / 250) * 0.15 + 0.85;
    ctx.fillStyle = "#ffdd00";
    ctx.globalAlpha = bossGlow;
    ctx.fillRect(14, 37, 372 * Math.max(0, arenaBossMaxHP / maxHp), 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ccc"; ctx.font = "bold 9px monospace"; ctx.fillText(`👾 ${arenaBoss}`, 16, 43);
    
    if (arenaComboTimer > 0 && arenaComboText) {
        ctx.save();
        let comboAlpha = Math.min(1, arenaComboTimer / 20);
        ctx.fillStyle = `rgba(255, 255, 255, ${comboAlpha})`;
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ffdd00";
        ctx.shadowBlur = 15;
        ctx.fillText(arenaComboText, 200, 260);
        ctx.restore();
    }
    
    if (wallGapIndicator && wallGapIndicator.life > 0) {
        ctx.save();
        let alpha = wallGapIndicator.life / 35;
        let pulse = Math.sin(now / 200) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(46, 204, 113, ${0.35 * alpha * pulse})`;
        ctx.strokeStyle = `rgba(46, 204, 113, ${0.7 * alpha})`;
        ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -now / 30;
        if (wallGapIndicator.vertical) {
            ctx.fillRect(wallGapIndicator.x, wallGapIndicator.y - wallGapIndicator.h / 2, wallGapIndicator.w, wallGapIndicator.h);
            ctx.strokeRect(wallGapIndicator.x, wallGapIndicator.y - wallGapIndicator.h / 2, wallGapIndicator.w, wallGapIndicator.h);
        } else {
            ctx.fillRect(wallGapIndicator.x - wallGapIndicator.w / 2, wallGapIndicator.y, wallGapIndicator.w, wallGapIndicator.h);
            ctx.strokeRect(wallGapIndicator.x - wallGapIndicator.w / 2, wallGapIndicator.y, wallGapIndicator.w, wallGapIndicator.h);
        }
        ctx.setLineDash([]); ctx.restore();
    }
    
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = arenaTrail.length - 1; i >= 0; i--) {
        let t = arenaTrail[i]; t.life--; let ratio = t.life / t.maxLife;
        ctx.fillStyle = t.color; ctx.globalAlpha = ratio * 0.7; ctx.beginPath(); ctx.arc(t.x, t.y - 2, t.size * ratio, 0, Math.PI * 2); ctx.fill();
        if (t.life <= 0) arenaTrail.splice(i, 1);
    }
    ctx.restore();

    if (arenaPhase === "dodge") {
        let frozen = (typeof _superState !== 'undefined' && _superState.antispiralFrozen);
        let speedMod = arenaGlobalSpeedMod * (typeof _superState !== 'undefined' && _superState.antispiralSpeedBoost ? 1.5 : 1.0);
        let timeStopped = (typeof _superState !== 'undefined' && _superState.garouTimeStop);
        
        for (let i = attacks.length - 1; i >= 0; i--) {
            let a = attacks[i];
            
            if (!frozen && !timeStopped) {
                if (a.spd) a.x += a.spd * speedMod;
                if (a.spdY) a.y += a.spdY * speedMod;
            }
            
            // Аура Има: уничтожение атак с шансом 50%
            if (typeof _superState !== 'undefined' && _superState.imAuraActive && invulnTimer <= 0) {
                let ax = a.x + (a.size || a.radius || 20) / 2;
                let ay = a.y + (a.size || a.radius || 20) / 2;
                let dist = Math.hypot(ax - heart.x, ay - heart.y);
                if (dist < 85 && Math.random() < 0.5) {
                    attacks.splice(i, 1);
                    arenaParticles.push({
                        x: ax, y: ay,
                        vx: 0, vy: 0,
                        life: 15, maxLife: 15,
                        color: "#ff00ff", size: 5
                    });
                    continue;
                }
            }
            
            if (a.type === "bomb") {
                if (!frozen && !timeStopped) a.timer--;
                if (a.timer > 0) {
                    ctx.save(); let isFlashing = Math.floor(a.timer / 6) % 2 === 0; let bombX = a.x; let bombY = a.y;
                    let bombRadius = 11 + Math.abs(Math.sin(a.timer * 0.45)) * 4; ctx.shadowColor = "#ff3333"; ctx.shadowBlur = isFlashing ? 25 : 10;
                    let gradient = ctx.createRadialGradient(bombX, bombY, bombRadius * 0.2, bombX, bombY, bombRadius);
                    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.3, '#ff6600'); gradient.addColorStop(0.7, '#ff0000'); gradient.addColorStop(1, '#990000');
                    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(bombX, bombY, bombRadius, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = "#8B4513"; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(bombX, bombY - bombRadius - 2); ctx.quadraticCurveTo(bombX + 5, bombY - bombRadius - 16, bombX + 3, bombY - bombRadius - 20); ctx.stroke();
                    ctx.fillStyle = isFlashing ? "#ffff00" : "#ff8800"; ctx.shadowColor = isFlashing ? "#ffff00" : "#ff6600"; ctx.shadowBlur = isFlashing ? 12 : 6;
                    ctx.beginPath(); ctx.arc(bombX + 3, bombY - bombRadius - 20, isFlashing ? 5 : 4, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                } else if (a.timer > -35) {
                    let progress = Math.abs(a.timer) / 35; let cr = a.maxRadius * progress;
                    if (!a.particlesSpawned && progress > 0.05) { a.particlesSpawned = true; sfxArenaBombExplosion(); a.shakeTime = 25; }
                    if (a.shakeTime > 0) { arenaShake = Math.max(arenaShake, 20); a.shakeTime--; }
                    ctx.save(); ctx.globalCompositeOperation = 'lighter';
                    let grad = ctx.createRadialGradient(a.x, a.y, cr*0.1, a.x, a.y, cr);
                    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.15, '#ffff00'); grad.addColorStop(0.4, '#ff8800'); grad.addColorStop(0.7, '#ff0000'); grad.addColorStop(1, 'rgba(139,0,0,0)');
                    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(a.x, a.y, cr, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 3*(1-progress);
                    for (let r = 0; r < 12; r++) { let angle = (r/12)*Math.PI*2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x+Math.cos(angle)*cr*0.8, a.y+Math.sin(angle)*cr*0.8); ctx.stroke(); }
                    ctx.fillStyle = "#ffffff"; for (let ep = 0; ep < 50; ep++) { let eAngle = Math.random()*Math.PI*2; ctx.beginPath(); ctx.arc(a.x+Math.cos(eAngle)*Math.random()*cr, a.y+Math.sin(eAngle)*Math.random()*cr, 1+Math.random()*3, 0, Math.PI*2); ctx.fill(); }
                    ctx.restore();
                    if (!a.hit && invulnTimer <= 0) { let dx = heart.x-a.x, dy = heart.y-a.y; if (Math.sqrt(dx*dx+dy*dy) < (cr+heart.hitbox)) { applyHit(a.damage||30, "ВЗРЫВ!"); a.hit = true; } }
                } else { attacks.splice(i, 1); }
                continue;
            }
            
            if (a.type !== "wall" && a.bouncesLeft !== undefined && a.bouncesLeft > 0 && !frozen && !timeStopped) {
                let sz = a.size || (a.radius ? a.radius*2 : 20);
                if (a.x < 4 && a.spd < 0) { a.spd = -a.spd; if (a.bouncesLeft !== Infinity) a.bouncesLeft--; sfxBounce(); }
                else if (a.x + sz > 396 && a.spd > 0) { a.spd = -a.spd; if (a.bouncesLeft !== Infinity) a.bouncesLeft--; sfxBounce(); }
                if (a.y < 4 && a.spdY < 0) { a.spdY = -a.spdY; if (a.bouncesLeft !== Infinity) a.bouncesLeft--; sfxBounce(); }
                else if (a.y + sz > 496 && a.spdY > 0) { a.spdY = -a.spdY; if (a.bouncesLeft !== Infinity) a.bouncesLeft--; sfxBounce(); }
            }
            
            let hit = false;
            if (a.type === "circle" || a.type === "rainbow") { let dx = heart.x-a.x, dy = heart.y-a.y; hit = Math.sqrt(dx*dx+dy*dy) < (heart.hitbox + a.radius - 2); }
            else if (a.type === "sword") { let dx = heart.x-a.x, dy = heart.y-a.y; hit = Math.sqrt(dx*dx+dy*dy) < (heart.hitbox + a.size/2); }
            else { let sz = a.size||20, cx = a.x+sz/2, cy = a.y+sz/2; hit = Math.abs(heart.x-cx) < (sz/2+heart.hitbox) && Math.abs(heart.y-cy) < (sz/2+heart.hitbox); }
            
            if (hit && invulnTimer <= 0) {
                let bhd = a.damage || arenaBaseDmg || 5;
                if (a.color === "#ffaa00" || a.type === "sword") { if (!heartWasMoving) applyHit(Math.max(1,Math.floor(bhd/4)), "ЗАЩИТА!"); else applyHit(bhd, "ДВИЖЕНИЕ!"); attacks.splice(i,1); continue; }
                if (a.color === "#ff3333" || a.type === "danger") { if (heartWasMoving) applyHit(Math.max(1,Math.floor(bhd/4)), "ЗАЩИТА!"); else applyHit(bhd, "ЗАМЕР!"); attacks.splice(i,1); continue; }
                if (a.color === "#ff69b4" || a.knockback) { let dx = heart.x-a.x, dy = heart.y-a.y, dist = Math.sqrt(dx*dx+dy*dy)||1; heart.vx += (dx/dist)*a.knockback*0.5; heart.vy += (dy/dist)*a.knockback*0.5; sfxPinkKnockback(); attacks.splice(i,1); continue; }
                if (a.heal) { 
                    let healAmount = Math.floor(arenaMaxHP * (a.healPercent || 0.15));
                    arenaHP = Math.min(arenaMaxHP, arenaHP + healAmount);
                    arenaKarma = Math.max(0, arenaKarma - Math.floor(arenaMaxHP * 0.1));
                    sfxArenaHeal(); 
                    spawnFloatingText(heart.x, heart.y - 20, "+" + healAmount, "#44ff44");
                    document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); 
                    attacks.splice(i,1); continue; 
                }
                if (a.oneshot) { sfxArenaDeath(); applyHit(arenaMaxHP, "ФАТАЛЬНО!", true); continue; }
                applyHit(bhd); attacks.splice(i,1); continue;
            }
            if (a.y > 560 || a.y < -150 || a.x < -160 || a.x > 560) { attacks.splice(i, 1); continue; }
            
            if (frozen || timeStopped) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = timeStopped ? "#ff8800" : "#aaddff";
                ctx.strokeStyle = timeStopped ? "#ff8800" : "#88bbff";
                ctx.lineWidth = 2;
                let sz = a.size || a.radius || 20;
                if (a.type === "circle" || a.type === "rainbow") {
                    ctx.beginPath(); ctx.arc(a.x, a.y, a.radius + 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                } else if (a.type === "sword") {
                    ctx.fillRect(a.x - a.size/2 - 2, a.y - a.width/2 - 2, a.size + 4, a.width + 4);
                    ctx.strokeRect(a.x - a.size/2 - 2, a.y - a.width/2 - 2, a.size + 4, a.width + 4);
                } else {
                    ctx.fillRect(a.x - 2, a.y - 2, sz + 4, sz + 4);
                    ctx.strokeRect(a.x - 2, a.y - 2, sz + 4, sz + 4);
                }
                ctx.restore();
            }
            
            ctx.save(); let col = a.color; if (a.type === "rainbow") col = `hsl(${(now/2+a.x)%360},100%,60%)`; ctx.fillStyle = col;
            if (a.type === "square" || a.type === "danger") {
                let sz = a.size||20; ctx.translate(a.x+sz/2, a.y+sz/2);
                if (a.color === "#ff3333") { ctx.beginPath(); ctx.moveTo(0,-sz/2); ctx.lineTo(sz/2,sz/2); ctx.lineTo(-sz/2,sz/2); ctx.closePath(); ctx.fill(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.moveTo(0,-sz/5); ctx.lineTo(sz/5,sz/3); ctx.lineTo(-sz/5,sz/3); ctx.closePath(); ctx.fill(); }
                else if (a.color === "#ff69b4") { ctx.fillRect(-sz/2,-sz/2,sz,sz); ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.strokeRect(-sz/4,-sz/4,sz/2,sz/2); }
                else if (a.color === "#4499ff") { 
                    ctx.fillRect(-sz/2,-sz/2,sz,sz); 
                    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.strokeRect(-sz/2+2,-sz/2+2,sz-4,sz-4);
                    ctx.fillStyle = "#fff"; ctx.fillRect(-sz/4,-sz/4,sz/2,sz/2);
                }
                else { ctx.fillRect(-sz/2,-sz/2,sz,sz); ctx.strokeStyle="rgba(0,0,0,0.25)"; ctx.lineWidth=1.5; ctx.strokeRect(-sz/2+2,-sz/2+2,sz-4,sz-4); ctx.fillStyle="#fff"; ctx.fillRect(-sz/4,-sz/4,sz/2,sz/2); }
            } else if (a.type === "sword") { ctx.translate(a.x,a.y); ctx.rotate(a.angle||0); ctx.globalAlpha=0.4; ctx.beginPath(); ctx.moveTo(a.size+3,0); ctx.lineTo(0,a.width/2+2); ctx.lineTo(-a.size-3,0); ctx.lineTo(0,-a.width/2-2); ctx.fill(); ctx.globalAlpha=1.0; ctx.fillStyle="#fff"; ctx.beginPath(); ctx.moveTo(a.size,0); ctx.lineTo(0,a.width/4); ctx.lineTo(-a.size,0); ctx.lineTo(0,-a.width/4); ctx.fill(); }
            else if (a.type === "circle") { 
                ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 12;
                ctx.beginPath(); ctx.arc(a.x,a.y,a.radius,0,Math.PI*2); ctx.fill(); 
                ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(a.x,a.y,a.radius*0.7,0,Math.PI*2); ctx.stroke(); 
                ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(a.x,a.y,a.radius*0.4,0,Math.PI*2); ctx.fill(); 
            }
            else if (a.type === "rainbow") { ctx.beginPath(); ctx.arc(a.x,a.y,a.radius,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(a.x,a.y,a.radius*0.7,0,Math.PI*2); ctx.stroke(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(a.x,a.y,a.radius*0.4,0,Math.PI*2); ctx.fill(); }
            ctx.restore();
        }
        
        if (typeof renderSuperVisuals === 'function') renderSuperVisuals();
        
        for (let i = arenaBlasters.length-1; i >= 0; i--) {
            let b = arenaBlasters[i], ac = b.color === "rainbow" ? `hsl(${(now/2)%360},100%,60%)` : b.color;
            if (!frozen && !timeStopped) {
                if (b.state === "aiming") { b.timer--; if (b.timer <= 0) { b.state = "firing"; b.timer = 15; arenaShake = 18; sfxArenaBlasterFire(); } }
                else if (b.state === "firing") { b.timer--; if (b.timer <= 0) { b.state="fading"; b.timer=20; } }
                else if (b.state === "fading") { b.timer--; if (b.timer <= 0) arenaBlasters.splice(i,1); }
            }
            if (b.state === "aiming") { if (b.timer > 30) b.angle = Math.atan2(heart.y-b.y, heart.x-b.x); ctx.save(); ctx.globalAlpha = 0.2+Math.abs(Math.sin(b.timer*0.25))*0.2; ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.setLineDash([6,4]); ctx.lineDashOffset = -now / 40; ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x+Math.cos(b.angle)*800, b.y+Math.sin(b.angle)*800); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
            else if (b.state === "firing" || b.state === "fading") { 
                ctx.save(); ctx.globalCompositeOperation='lighter'; 
                ctx.shadowColor = ac; ctx.shadowBlur = 15;
                ctx.strokeStyle=ac; ctx.lineWidth=b.width+16+Math.random()*10; ctx.globalAlpha=0.3; ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x+Math.cos(b.angle)*800, b.y+Math.sin(b.angle)*800); ctx.stroke(); 
                ctx.lineWidth=b.width; ctx.globalAlpha=0.9; ctx.stroke(); 
                ctx.strokeStyle="#fff"; ctx.lineWidth=b.width*0.4; ctx.globalAlpha=1.0; ctx.stroke(); ctx.restore(); 
                if (!b.hasHit && invulnTimer <= 0 && !frozen && !timeStopped) { 
                    let dx = heart.x-b.x, dy = heart.y-b.y, dist = Math.abs(dx*Math.sin(b.angle)-dy*Math.cos(b.angle)); 
                    if (dist < b.width/2+heart.hitbox) { 
                        let bdmg=0, msg=""; 
                        if (b.color==="rainbow") applyHit(arenaMaxHP,"ФАТАЛЬНО!", true); 
                        else if (b.color==="#fff") { bdmg=Math.floor(arenaBaseDmg*2); msg="ЛУЧ!"; } 
                        else if (b.color==="#ffdd00") { if (!heartWasMoving) { bdmg=Math.max(1,Math.floor(arenaBaseDmg*3/4)); msg="ЗАЩИТА!"; } else { bdmg=Math.floor(arenaBaseDmg*3); msg="ДВИЖЕНИЕ!"; } } 
                        else if (b.color==="#ff3333") { if (heartWasMoving) { bdmg=Math.max(1,Math.floor(arenaBaseDmg*3/4)); msg="ЗАЩИТА!"; } else { bdmg=Math.floor(arenaBaseDmg*3); msg="ЗАМЕР!"; } } 
                        if (bdmg>0) applyHit(bdmg,msg); 
                        b.hasHit=true; 
                    } 
                } 
            }
        }
        
        if (invulnTimer <= 0 || Math.floor(now/80)%2===0) { 
            ctx.save(); ctx.translate(heart.x, heart.y-2); 
            let heartPulse = 1.0+Math.abs(Math.sin(now/140))*0.1; 
            ctx.rotate(heartRotation * 0.3);
            ctx.scale(heartPulse,heartPulse); 
            let heartGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 8);
            heartGrad.addColorStop(0, '#ff4444');
            heartGrad.addColorStop(1, '#990000');
            ctx.fillStyle = heartGrad;
            ctx.shadowColor = (typeof _superState !== 'undefined' && _superState.dekusParticles) ? "#44ff44" : 
                             (typeof _superState !== 'undefined' && _superState.allmightBuffTimer > 0) ? "#ffd700" :
                             (typeof _superState !== 'undefined' && _superState.usoppInvuln) ? "#ffff00" : "#ff0000";
            ctx.shadowBlur = (typeof _superState !== 'undefined' && (_superState.dekusParticles || _superState.allmightBuffTimer > 0)) ? 30 : 12;
            ctx.beginPath(); ctx.arc(-3.5,-2,4.5,Math.PI,0); ctx.arc(3.5,-2,4.5,Math.PI,0); ctx.lineTo(0,6); ctx.closePath(); ctx.fill(); 
            ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(-2,-2,1.5,0,Math.PI*2); ctx.fill(); 
            if (invulnTimer>0) { 
                let shieldGrad = ctx.createRadialGradient(0, 2, heart.size*1.1, 0, 2, heart.size*1.4);
                shieldGrad.addColorStop(0, 'rgba(0,191,255,0.1)');
                shieldGrad.addColorStop(1, 'rgba(0,191,255,0.6)');
                ctx.strokeStyle = shieldGrad; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,2,heart.size*1.3,0,Math.PI*2); ctx.stroke(); 
            } 
            ctx.restore();
        }
    } else if (arenaPhase === "attack") {
        for (let i = 0; i < arenaClickTargets.length; i++) { 
            let t = arenaClickTargets[i]; if (t.hit) continue; 
            t.pulse += 0.12; let r = t.radius+Math.sin(t.pulse)*3; 
            ctx.save(); 
            let glowPulse = Math.sin(now / 300 + i) * 0.3 + 0.7;
            let grad = ctx.createRadialGradient(t.x,t.y,2,t.x,t.y,r); 
            grad.addColorStop(0,"rgba(255,255,255,0.4)"); grad.addColorStop(0.7,"rgba(255,221,0,0.15)"); grad.addColorStop(1,"rgba(255,221,0,0)"); 
            ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(t.x,t.y,r,0,Math.PI*2); ctx.fill(); 
            ctx.strokeStyle="#ffdd00"; ctx.lineWidth=2; ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 8 * glowPulse;
            ctx.beginPath(); ctx.arc(t.x,t.y,t.radius,0,Math.PI*2); ctx.stroke(); ctx.restore(); 
        }
    }
    
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for (let i = arenaParticles.length-1; i >= 0; i--) { 
        let p = arenaParticles[i]; 
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.95; p.vy*=0.95; p.life--; 
        let ratio = p.life/p.maxLife;
        if (!p.isLightning) {
            ctx.fillStyle=p.color; ctx.globalAlpha=Math.max(0,ratio); ctx.beginPath(); ctx.arc(p.x,p.y,p.size*ratio,0,Math.PI*2); ctx.fill(); 
        }
        if (p.life<=0) arenaParticles.splice(i,1); 
    }
    ctx.restore();
    
    ctx.save(); for (let i = arenaShockwaves.length-1; i >= 0; i--) { let sw = arenaShockwaves[i]; sw.r+=sw.v; sw.life--; let ratio = sw.life/sw.maxLife; ctx.strokeStyle=sw.color; ctx.lineWidth=2.5*ratio; ctx.globalAlpha=ratio; ctx.beginPath(); ctx.arc(sw.x,sw.y,sw.r,0,Math.PI*2); ctx.stroke(); if (sw.life<=0) arenaShockwaves.splice(i,1); } ctx.restore();
    
    ctx.save(); for (let i = floatingTexts.length-1; i >= 0; i--) { let ft = floatingTexts[i]; ft.y+=ft.vy; ft.x += (ft.vx || 0); ft.life--; ctx.fillStyle=ft.color; ctx.globalAlpha=Math.max(0,ft.life/50); ctx.font="bold 14px monospace"; ctx.shadowColor = ft.color; ctx.shadowBlur = 4; ctx.textAlign="center"; ctx.fillText(ft.text,ft.x,ft.y); if (ft.life<=0) floatingTexts.splice(i,1); } ctx.restore();
    
    ctx.restore();
    animFrameId = requestAnimationFrame(renderArena);
}
