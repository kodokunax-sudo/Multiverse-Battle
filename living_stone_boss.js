// ============================================================
// ЖИВОЙ КАМЕНЬ - БОСС 200 ВОЛНЫ v6.4
// + ОРУЖИЕ РАБОТАЕТ
// ============================================================

let livingStoneActive = false;
let livingStoneState = "phase1";
let livingStoneBoss = { x: 200, y: 100, size: 40, vx: 0.8, rotation: 0 };
let livingStonePlayer = { x: 200, y: 400 };
let livingStoneBossHp = 0;
let livingStoneBossMaxHp = 0;
let livingStonePlayerHp = 150;
let livingStonePlayerMaxHp = 150;
let livingStoneAttacks = [];
let livingStoneBullets = [];
let livingStoneParticles = [];
let livingStoneTexts = [];
let livingStoneAttackTimer = 0;
let livingStoneAttackType = 0;
let livingStoneTypeTimer = 0;
let livingStoneShootTimer = 0;
let livingStoneInvulnTimer = 0;
let livingStoneShake = 0;
let livingStoneScreenFlash = 0;
let livingStoneScreenFlashColor = "#ffffff";
let livingStoneBossFlash = 0;
let livingStoneAnimFrame = null;
let livingStoneBgParticles = [];
let livingStoneRestoreCount = 0;
let livingStoneRestoring = false;

let lsSpeedMult = 0.5;
let activeGravityWell = false;
let lsMobileMode = false;
let lsPerfMult = 1.0;
let qteClickTarget = 100;

// Мобильное
let lsTouchActive = false, lsTouchId = null, lsTouchX = 0, lsTouchY = 0;

// QTE
let qteBullets = [], qtePunches = [], qteActive = false, qteClicks = 0;
let qteTimerRef = null, qteStartDelayTimer = null, qteEndTimer = null, qteBarrageInterval = null;

// Кинематик
let qteCinematicActive = false, qteCinematicPhase = "idle", qteCinematicTimer = 0;
let qtePlayerVel = { x: 0, y: 0 }, qtePlayerAngry = false, qtePlayerTrail = [];
let qteBossArm = null, qtePunchImpact = null, qteCinematicShake = 0, qteCinematicTexts = [];
let qteBossDamageLevel = 0, qteBossShake = 0;

// Эффекты
let qteShockwaves = [], qteLightningBolts = [], qteSlashMarks = [], qteSparks = [];
let qteScreenDistort = 0, qteFlashBursts = [];
let chainExplosionsQueue = [];

// Текстуры
let stoneTexturePoints = [];
let stoneTexturePhase2 = [];

// Финальная сцена
let finalSceneActive = false;
let finalScenePhase = "idle";
let finalSceneTimer = 0;
let finalBlackHole = null;
let finalCracksLevel = 0;
let finalHeartVel = { x: 0, y: 0 };
let finalHeartVisible = true;
let finalLaughOffset = 0;
let finalDialogIndex = 0;
let finalTexts = [];
let finalTextTimer = 0;
let finalSceneEndTimer = 0;

// ★ МОДИФИКАЦИИ ★
let lsModCapsules = [];
let lsModSpawnTimer = 0;
let lsModSpawnInterval = 25 * 60;
let lsActiveMod = null;
let lsModDuration = 10 * 60;
let lsPlayerVelocity = { x: 0, y: 0 };
let lsAutoFireSkip = 0;
let lsShotgunSkip = 0;

const LS_MODS = [
    { id: 1, name: "ДРОБОВИК", icon: "🎯", color: "#ff8800", desc: "3 пульки веером (очень быстрые!)" },
    { id: 2, name: "САМОНАВЕДЕНИЕ", icon: "🧲", color: "#00d4ff", desc: "Быстрая стрельба + слабое наведение" },
    { id: 3, name: "ЩИТ", icon: "🛡️", color: "#2ecc71", desc: "-50% урона, -15% скорости" },
    { id: 4, name: "ОТРАЖЕНИЕ", icon: "🔷", color: "#00aaff", desc: "75% шанс отразить в босса" },
    { id: 5, name: "ПЕРЕГРУЗКА", icon: "⚡", color: "#ffd700", desc: "+35% скорости, +25% урона" }
];

// Музыка
let qteMusic = null;
let qteMusicBlobUrl = null;
let qteMusicPreloaded = false;
let qteMusicReady = false;
let qteMusicStartOffset = 30;
let qteMusicPaths = [
    "music/стендзи хер ай реалзайз.mp3",
    "music/standing_here_i_realize.mp3",
    "music/standing_here.mp3",
    "music/qte.mp3"
];

// ========== LITE MODE ==========
function _disableCtxShadows(c) {
    if (!c) return;
    try {
        let _blur = 0;
        let _color = 'rgba(0,0,0,0)';
        Object.defineProperty(c, 'shadowBlur', {
            get: function() { return _blur; },
            set: function(v) { _blur = 0; },
            configurable: true
        });
        Object.defineProperty(c, 'shadowColor', {
            get: function() { return _color; },
            set: function(v) { _color = 'rgba(0,0,0,0)'; },
            configurable: true
        });
        console.log("[LS] LITE MODE: тени отключены");
    } catch(e) {}
}

// ========== ГЕНЕРАЦИЯ ТЕКСТУРЫ ==========
function generateStoneTextures() {
    stoneTexturePoints = [];
    stoneTexturePhase2 = [];
    for (var i = 0; i < 40; i++) {
        stoneTexturePoints.push({
            type: "spot", angle: Math.random() * Math.PI * 2,
            dist: Math.random() * 0.7, size: 2 + Math.random() * 5,
            alpha: 0.15 + Math.random() * 0.25
        });
    }
    for (var i = 0; i < 10; i++) {
        stoneTexturePoints.push({
            type: "vein",
            a1: Math.random() * Math.PI * 2, a2: Math.random() * Math.PI * 2, a3: Math.random() * Math.PI * 2,
            r1: 0.2 + Math.random() * 0.2, r2: 0.5 + Math.random() * 0.15, r3: 0.65 + Math.random() * 0.15,
            w: 1 + Math.random() * 2, alpha: 0.3 + Math.random() * 0.3
        });
    }
    for (var i = 0; i < 25; i++) {
        stoneTexturePoints.push({
            type: "grain", angle: Math.random() * Math.PI * 2,
            dist: Math.random() * 0.75, size: 1 + Math.random() * 2,
            alpha: 0.2 + Math.random() * 0.3
        });
    }
    for (var i = 0; i < 35; i++) {
        stoneTexturePhase2.push({
            type: "burn", angle: Math.random() * Math.PI * 2,
            dist: Math.random() * 0.7, size: 4 + Math.random() * 8,
            alpha: 0.3 + Math.random() * 0.4
        });
    }
    for (var i = 0; i < 15; i++) {
        stoneTexturePhase2.push({
            type: "crack",
            a1: Math.random() * Math.PI * 2, a2: Math.random() * Math.PI * 2, a3: Math.random() * Math.PI * 2,
            r1: 0.1 + Math.random() * 0.2, r2: 0.5 + Math.random() * 0.15, r3: 0.7 + Math.random() * 0.15,
            w: 1 + Math.random() * 2, alpha: 0.6 + Math.random() * 0.3
        });
    }
    for (var i = 0; i < 20; i++) {
        stoneTexturePhase2.push({
            type: "glow", angle: Math.random() * Math.PI * 2,
            dist: 0.2 + Math.random() * 0.5, size: 3 + Math.random() * 6,
            alpha: 0.3 + Math.random() * 0.4
        });
    }
}

// ========== ПРЕДЗАГРУЗКА МУЗЫКИ ==========
function preloadQTEMusic() {
    if (qteMusicPreloaded) return;
    qteMusicPreloaded = true;
    var tryFetchIndex = 0;
    function tryFetch() {
        if (tryFetchIndex >= qteMusicPaths.length) return;
        var path = qteMusicPaths[tryFetchIndex++];
        fetch(path, { method: 'GET' })
            .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); })
            .then(function(blob) {
                qteMusicBlobUrl = URL.createObjectURL(blob);
                console.log("[LS] Музыка загружена:", path);
                silentWarmupMusic();
            })
            .catch(function() { tryFetch(); });
    }
    tryFetch();
}

function silentWarmupMusic() {
    if (!qteMusicBlobUrl || qteMusic) return;
    try {
        qteMusic = new Audio(qteMusicBlobUrl);
        qteMusic.volume = 0;
        qteMusic.currentTime = qteMusicStartOffset;
        var seek = function() { try { qteMusic.currentTime = qteMusicStartOffset; } catch(e) {} };
        qteMusic.addEventListener('loadedmetadata', seek);
        if (qteMusic.readyState >= 1) seek();
        qteMusic.addEventListener('timeupdate', function() {
            if (!qteMusic || !qteMusic.duration) return;
            if (qteMusic.currentTime >= qteMusic.duration - 0.5) {
                try { qteMusic.currentTime = qteMusicStartOffset; } catch(e) {}
            }
        });
        qteMusic.play().then(function() { qteMusicReady = true; }).catch(function() {
            var retry = function() {
                try { qteMusic.play().then(function() { qteMusicReady = true; }); } catch(e) {}
                document.removeEventListener("click", retry);
                document.removeEventListener("touchstart", retry);
            };
            document.addEventListener("click", retry);
            document.addEventListener("touchstart", retry);
        });
    } catch(e) {}
}
preloadQTEMusic();
generateStoneTextures();

// ========== СТАРТ ==========
function startLivingStoneFight() {
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(200)) {
        if (typeof showFloatingText === 'function') {
            showFloatingText("⏭️ Живой Камень уже побеждён! Бей его кликами.", "#ffaa00");
        }
        return;
    }
    var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var isPhone;
    if (isMobile) {
        isPhone = confirm("ОБНАРУЖЕН ТЕЛЕФОН\n\nВключить режим производительности?\n\nOK = Телефон (без теней, быстрее)\nОтмена = ПК (полные эффекты)");
    } else {
        isPhone = confirm("Ты на телефоне?\n\nOK = Телефон (LITE MODE, без теней)\nОтмена = ПК (полные эффекты)");
    }
    lsMobileMode = isPhone;
    lsPerfMult = isPhone ? 0.35 : 1.0;
    _startLivingStoneFightInternal();
}

function _startLivingStoneFightInternal() {
    livingStoneActive = true;
    livingStoneState = "phase1";
    livingStoneBossMaxHp = 78400;
    livingStoneBossHp = livingStoneBossMaxHp;
    livingStoneBoss = { x: 200, y: 100, size: 40, vx: 0.8, rotation: 0 };
    livingStonePlayer = { x: 200, y: 400 };
    livingStonePlayerHp = 150;
    livingStonePlayerMaxHp = 150;
    livingStoneInvulnTimer = 0;
    livingStoneAttacks = []; livingStoneBullets = []; livingStoneParticles = []; livingStoneTexts = [];
    livingStoneAttackTimer = 0; livingStoneAttackType = 0; livingStoneTypeTimer = 400;
    livingStoneShootTimer = 0; livingStoneShake = 0; livingStoneScreenFlash = 0; livingStoneBossFlash = 0;
    livingStoneRestoreCount = 0; livingStoneRestoring = false; activeGravityWell = false;
    qteBullets = []; qtePunches = []; qteActive = false; qteClicks = 0;
    qteBossDamageLevel = 0; qteBossShake = 0; qteCinematicActive = false; qteCinematicPhase = "idle";
    qtePlayerVel = { x: 0, y: 0 }; qtePlayerAngry = false; qtePlayerTrail = [];
    qteBossArm = null; qtePunchImpact = null; qteCinematicShake = 0; qteCinematicTexts = [];
    qteShockwaves = []; qteLightningBolts = []; qteSlashMarks = []; qteSparks = []; qteFlashBursts = [];
    qteScreenDistort = 0; chainExplosionsQueue = [];
    finalSceneActive = false; finalScenePhase = "idle"; finalSceneTimer = 0;
    finalBlackHole = null; finalCracksLevel = 0;
    finalHeartVel = { x: 0, y: 0 }; finalHeartVisible = true; finalLaughOffset = 0;
    finalDialogIndex = 0; finalTexts = []; finalTextTimer = 0; finalSceneEndTimer = 0;
    lsTouchActive = false; lsTouchId = null;
    lsModCapsules = [];
    lsModSpawnTimer = 0;
    lsActiveMod = null;
    lsPlayerVelocity = { x: 0, y: 0 };
    lsAutoFireSkip = 0;
    lsShotgunSkip = 0;
    initLivingStoneBgParticles();
    preloadQTEMusic();
    if (typeof stopAllMusic === 'function') stopAllMusic();
    
    ['superBtn', 'superBtn2', 'superBtnDeactivate', 'startArenaBtn', 'skipBossBtn', 'spareBtn', 'startLivingStoneBtn'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    
    var overlay = document.getElementById("arenaOverlay");
    if (overlay) overlay.style.display = "flex";
    var bossNameEl = document.getElementById("arenaBossName");
    if (bossNameEl) bossNameEl.innerText = "ЖИВОЙ КАМЕНЬ";
    var arenaHpEl = document.getElementById("arenaHP");
    if (arenaHpEl) arenaHpEl.innerText = livingStonePlayerHp;
    var timerEl = document.getElementById("arenaTimer");
    if (timerEl) timerEl.innerText = "∞";
    
    if (typeof initArena === 'function') initArena();
    if (typeof canvas === 'undefined' || !canvas) return;
    if (typeof arenaActive !== 'undefined') arenaActive = false;
    
    if (lsMobileMode && typeof ctx !== 'undefined' && ctx) {
        _disableCtxShadows(ctx);
    }
    
    canvas.addEventListener("click", handleQTEClick);
    canvas.addEventListener("touchstart", handleLSTouchStart);
    canvas.addEventListener("touchmove", handleLSTouchMove);
    canvas.addEventListener("touchend", handleLSTouchEnd);
    canvas.addEventListener("touchcancel", handleLSTouchEnd);
    
    if (livingStoneAnimFrame) cancelAnimationFrame(livingStoneAnimFrame);
    livingStoneAnimFrame = requestAnimationFrame(livingStoneRenderLoop);
    
    if (typeof playArenaSound === 'function') {
        playArenaSound(60, 'sawtooth', 1.5, 0.2);
        setTimeout(function() { playArenaSound(50, 'sawtooth', 1.5, 0.15); }, 300);
    }
    spawnLivingStoneText(200, 220, "ЖИВОЙ КАМЕНЬ", "#888888", 120);
    spawnLivingStoneText(200, 260, "Попробуй меня пробить!", "#aaaaaa", 120);
}

function stopLivingStoneFight() {
    livingStoneActive = false;
    if (livingStoneAnimFrame) { cancelAnimationFrame(livingStoneAnimFrame); livingStoneAnimFrame = null; }
    livingStoneAttacks = []; livingStoneBullets = []; livingStoneParticles = []; livingStoneTexts = [];
    qteBullets = []; qtePunches = []; qtePlayerTrail = []; qteCinematicTexts = [];
    qteShockwaves = []; qteLightningBolts = []; qteSlashMarks = []; qteSparks = []; qteFlashBursts = [];
    chainExplosionsQueue = []; activeGravityWell = false;
    lsModCapsules = []; lsActiveMod = null;
    stopQTEMusic();
    if (qteTimerRef) { clearTimeout(qteTimerRef); qteTimerRef = null; }
    if (qteStartDelayTimer) { clearTimeout(qteStartDelayTimer); qteStartDelayTimer = null; }
    if (qteEndTimer) { clearTimeout(qteEndTimer); qteEndTimer = null; }
    if (qteBarrageInterval) { clearInterval(qteBarrageInterval); qteBarrageInterval = null; }
    if (typeof canvas !== 'undefined' && canvas) {
        canvas.removeEventListener("click", handleQTEClick);
        canvas.removeEventListener("touchstart", handleLSTouchStart);
        canvas.removeEventListener("touchmove", handleLSTouchMove);
        canvas.removeEventListener("touchend", handleLSTouchEnd);
        canvas.removeEventListener("touchcancel", handleLSTouchEnd);
    }
    var overlay = document.getElementById("arenaOverlay");
    if (overlay) overlay.style.display = "none";
    if (typeof startBattleMusic === 'function') startBattleMusic();
}

function handleLSTouchStart(ev) {
    if (!livingStoneActive) return;
    if (livingStoneState === "qte_punch" && qteActive) {
        ev.preventDefault();
        for (var i = 0; i < ev.touches.length; i++) handleQTEClick(ev.touches[i]);
        return;
    }
    if ((livingStoneState === "phase1" || livingStoneState === "phase2") && !finalSceneActive) {
        ev.preventDefault();
        if (ev.touches.length > 0 && !lsTouchActive) {
            lsTouchActive = true; lsTouchId = ev.touches[0].identifier;
            var rect = canvas.getBoundingClientRect();
            lsTouchX = ev.touches[0].clientX - rect.left;
            lsTouchY = ev.touches[0].clientY - rect.top;
        }
    }
}

function handleLSTouchMove(ev) {
    if (!livingStoneActive || !lsTouchActive) return;
    if (livingStoneState !== "phase1" && livingStoneState !== "phase2") return;
    if (finalSceneActive) return;
    ev.preventDefault();
    for (var i = 0; i < ev.touches.length; i++) {
        if (ev.touches[i].identifier === lsTouchId) {
            var rect = canvas.getBoundingClientRect();
            lsTouchX = ev.touches[i].clientX - rect.left;
            lsTouchY = ev.touches[i].clientY - rect.top;
            break;
        }
    }
}

function handleLSTouchEnd(ev) {
    if (!livingStoneActive || !lsTouchActive) return;
    var still = false;
    for (var i = 0; i < ev.touches.length; i++) if (ev.touches[i].identifier === lsTouchId) { still = true; break; }
    if (!still) { lsTouchActive = false; lsTouchId = null; }
}

function initLivingStoneBgParticles() {
    livingStoneBgParticles = [];
    var bgCount = lsMobileMode ? 15 : 50;
    for (var i = 0; i < bgCount; i++) {
        livingStoneBgParticles.push({
            x: Math.random() * 400, y: Math.random() * 500,
            size: 0.5 + Math.random() * 2, speed: 0.05 + Math.random() * 0.2,
            alpha: 0.1 + Math.random() * 0.4,
            type: Math.random() > 0.7 ? "rock" : "dust"
        });
    }
}

// ========== ВСПОМОГАТЕЛЬНОЕ ==========
function spawnLivingStoneText(x, y, text, color, life) {
    livingStoneTexts.push({ x: x, y: y, text: text, color: color, life: life || 60, vy: -0.3, vx: 0 });
}
function spawnCinematicText(x, y, text, color, life, size) {
    qteCinematicTexts.push({ x: x, y: y, text: text, color: color, life: life || 60, maxLife: life || 60, size: size || 24, vy: -0.2 });
}
function spawnLivingStoneParticles(x, y, count, color, speed) {
    var n = Math.max(1, Math.floor(count * lsPerfMult));
    for (var i = 0; i < n; i++) {
        var angle = Math.random() * Math.PI * 2, spd = speed * (0.5 + Math.random());
        livingStoneParticles.push({
            x: x, y: y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
            life: 30 + Math.random() * 20, maxLife: 50, color: color, size: 1 + Math.random() * 3
        });
    }
}

function createExplosion(x, y, damage) {
    spawnLivingStoneParticles(x, y, 15, "#ffcc00", 6);
    spawnLivingStoneParticles(x, y, 10, "#ff4400", 5);
    spawnLivingStoneParticles(x, y, 8, "#ffffff", 4);
    livingStoneShake = Math.max(livingStoneShake, 10);
    var dxP = livingStonePlayer.x - x, dyP = livingStonePlayer.y - y;
    var distP = Math.sqrt(dxP * dxP + dyP * dyP);
    if (distP < 40 && livingStoneInvulnTimer <= 0) {
        damageLivingStonePlayer(Math.floor(damage * 0.5));
    }
    var chainRadius = 55;
    for (var i = livingStoneAttacks.length - 1; i >= 0; i--) {
        var a = livingStoneAttacks[i];
        if (a.type === "falling_star") {
            var dx = a.x - x, dy = a.y - y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < chainRadius && dist > 5) {
                chainExplosionsQueue.push({ x: a.x, y: a.y, delay: 5, damage: damage });
                spawnLivingStoneParticles(a.x, a.y, 8, "#ffdd00", 4);
                livingStoneAttacks.splice(i, 1);
            }
        }
    }
    if (typeof playArenaSound === 'function') playArenaSound(120 + Math.random() * 80, 'square', 0.25, 0.15);
}

function updateChainExplosions() {
    for (var i = chainExplosionsQueue.length - 1; i >= 0; i--) {
        var e = chainExplosionsQueue[i];
        e.delay--;
        if (e.delay <= 0) {
            createExplosion(e.x, e.y, e.damage);
            chainExplosionsQueue.splice(i, 1);
        }
    }
}

function spawnMegaImpact(x, y) {
    var waveCount = lsMobileMode ? 2 : 4;
    var allWaves = [
        { r: 250, life: 40, color: "#ffffff", width: 8 },
        { r: 200, life: 35, color: "#ffdd00", width: 6 },
        { r: 180, life: 30, color: "#ff4400", width: 5 },
        { r: 320, life: 50, color: "rgba(255,255,255,0.5)", width: 3 }
    ];
    for (var w = 0; w < waveCount; w++) {
        var wave = allWaves[w];
        qteShockwaves.push({ x: x, y: y, radius: 10, maxRadius: wave.r, life: wave.life, maxLife: wave.life, color: wave.color, width: wave.width });
    }
    var lCount = lsMobileMode ? 3 : 8;
    for (var i = 0; i < lCount; i++) {
        var angle = (i / lCount) * Math.PI * 2 + Math.random() * 0.3;
        var length = 150 + Math.random() * 100;
        var points = [], steps = 6;
        for (var k = 0; k <= steps; k++) {
            var t = k / steps;
            points.push({ x: x + Math.cos(angle) * length * t + (Math.random() - 0.5) * 30, y: y + Math.sin(angle) * length * t + (Math.random() - 0.5) * 30 });
        }
        qteLightningBolts.push({ points: points, life: 25, maxLife: 25, color: i % 2 === 0 ? "#ffffff" : "#ffdd00", width: 3 + Math.random() * 3 });
    }
    var slashCount = lsMobileMode ? 2 : 6;
    for (var i = 0; i < slashCount; i++) {
        qteSlashMarks.push({
            x: x + (Math.random() - 0.5) * 80, y: y + (Math.random() - 0.5) * 80,
            angle: Math.random() * Math.PI * 2, length: 60 + Math.random() * 60,
            life: 30, maxLife: 30, width: 4 + Math.random() * 4
        });
    }
    var sparkCount = lsMobileMode ? 30 : 100;
    for (var i = 0; i < sparkCount; i++) {
        var a3 = Math.random() * Math.PI * 2, spd = 8 + Math.random() * 18;
        qteSparks.push({
            x: x, y: y, vx: Math.cos(a3) * spd, vy: Math.sin(a3) * spd,
            life: 40 + Math.random() * 30, maxLife: 70,
            color: ["#ffffff", "#ffdd00", "#ff4400", "#ff2222"][Math.floor(Math.random() * 4)],
            size: 2 + Math.random() * 4, trail: []
        });
    }
    var flashCount = lsMobileMode ? 2 : 5;
    for (var i = 0; i < flashCount; i++) {
        qteFlashBursts.push({
            x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 60,
            size: 30 + Math.random() * 40, life: 20, maxLife: 20
        });
    }
    qteScreenDistort = lsMobileMode ? 0 : 30;
    qteCinematicShake = 60;
    livingStoneScreenFlash = 40;
    livingStoneScreenFlashColor = "#ffffff";
}

// ========== ★ СТРЕЛЬБА С ОРУЖИЕМ ★ ==========
function livingStoneShoot() {
    var baseSpeed = 7 * lsSpeedMult;
    var bulletSize = 4;
    var bulletDamage = 250;
    var modId = lsActiveMod ? lsActiveMod.type : 0;

    // ★★★ ПРОВЕРКА ОРУЖИЯ ★★★
    if (typeof window.firePlayerWeapon === 'function' && !lsActiveMod) {
        let result = window.firePlayerWeapon(livingStonePlayer.x, livingStonePlayer.y, "normal", livingStonePlayerHp, livingStonePlayerMaxHp);
        if (result && result.bullets) {
            for (var i = 0; i < result.bullets.length; i++) {
                var b = result.bullets[i];
                // Масштабируем урон оружия под Живого Камня
                b.damage = bulletDamage * (b.damage / 2);
                livingStoneBullets.push(b);
            }
            if (typeof playArenaSound === 'function') playArenaSound(900, 'square', 0.05, 0.02);
            return;
        }
    }

    // Стандартная стрельба
    if (modId === 5) bulletSize *= 1.25;

    if (modId === 1) {
        lsShotgunSkip++;
        if (lsShotgunSkip % 2 !== 0) return;
    }

    var bulletsToSpawn = [];
    var startX = livingStonePlayer.x;
    var startY = livingStonePlayer.y - 8;

    if (modId === 1) {
        var shotgunSpeed = baseSpeed * 4;
        var spreadAngles = [-0.35, 0, 0.35];
        for (var i = 0; i < 3; i++) {
            var ang = -Math.PI / 2 + spreadAngles[i];
            var vx = Math.cos(ang) * shotgunSpeed;
            var vy = Math.sin(ang) * shotgunSpeed;
            bulletsToSpawn.push({
                x: startX, y: startY, vx: vx, vy: vy,
                size: bulletSize, damage: bulletDamage, life: 120, homing: false, reflect: false
            });
        }
    } else if (modId === 2) {
        var dx = livingStoneBoss.x - startX;
        var dy = livingStoneBoss.y - startY;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        bulletsToSpawn.push({
            x: startX, y: startY,
            vx: (dx / len) * baseSpeed,
            vy: (dy / len) * baseSpeed,
            size: bulletSize, damage: bulletDamage, life: 180, homing: true, homingSpeed: 0.05, reflect: false
        });
    } else {
        bulletsToSpawn.push({
            x: startX, y: startY, vx: 0, vy: -baseSpeed,
            size: bulletSize, damage: bulletDamage, life: 120, homing: false, reflect: false
        });
    }

    for (var i = 0; i < bulletsToSpawn.length; i++) {
        livingStoneBullets.push(bulletsToSpawn[i]);
    }

    if (typeof playArenaSound === 'function') playArenaSound(900, 'square', 0.05, 0.02);
}

// ========== АТАКИ БОССА ==========
function livingStoneSpawnAttack() {
    var type = livingStoneAttackType;
    var isPhase2 = (livingStoneState === "phase2");
    var speedMult = (isPhase2 ? 1.4 : 1.0) * lsSpeedMult;
    var dmgMult = isPhase2 ? 1.3 : 1.0;
    
    if (type === 0) {
        var count = isPhase2 ? 5 : 3;
        for (var i = 0; i < count; i++) {
            livingStoneAttacks.push({
                type: "rock", x: 30 + Math.random() * 340, y: -20,
                vx: (Math.random() - 0.5) * 1.2 * lsSpeedMult,
                vy: (2.2 + Math.random() * 1.2) * speedMult,
                size: 14, rotation: 0, rotSpeed: (Math.random() - 0.5) * 0.1,
                damage: Math.floor(8 * dmgMult)
            });
        }
    } else if (type === 1) {
        livingStoneAttacks.push({
            type: "ring", x: livingStoneBoss.x, y: livingStoneBoss.y,
            radius: 10, maxRadius: 320, growth: 2.0 * speedMult,
            damage: Math.floor(7 * dmgMult), thickness: 18, color: "#8B7355"
        });
    } else if (type === 2) {
        var count2 = isPhase2 ? 12 : 8;
        for (var i = 0; i < count2; i++) {
            var angle = (i / count2) * Math.PI * 2;
            livingStoneAttacks.push({
                type: "orb", x: livingStoneBoss.x, y: livingStoneBoss.y,
                vx: Math.cos(angle) * 2.2 * speedMult, vy: Math.sin(angle) * 2.2 * speedMult,
                size: 8, damage: Math.floor(6 * dmgMult), life: 200, color: "#a08060"
            });
        }
    } else if (type === 3) {
        var count3 = isPhase2 ? 3 : 2;
        for (var i = 0; i < count3; i++) {
            var angle = Math.random() * Math.PI * 2;
            livingStoneAttacks.push({
                type: "homing", x: livingStoneBoss.x, y: livingStoneBoss.y,
                vx: Math.cos(angle) * 1.2 * lsSpeedMult, vy: Math.sin(angle) * 1.2 * lsSpeedMult,
                size: 11, damage: Math.floor(8 * dmgMult), life: 350, color: "#8B7355"
            });
        }
    } else if (type === 4) {
        var laserX = 60 + Math.random() * 280;
        livingStoneAttacks.push({ type: "laser_warning", x: laserX, y: 0, width: 40, timer: Math.floor(60 / lsSpeedMult), damage: Math.floor(10 * dmgMult) });
    } else if (type === 5) {
        var countV = isPhase2 ? 10 : 7;
        var baseAngle = Math.PI * 0.5;
        for (var i = 0; i < countV; i++) {
            var offset = (i - countV / 2) * 0.18;
            livingStoneAttacks.push({
                type: "orb", x: livingStoneBoss.x, y: livingStoneBoss.y,
                vx: Math.cos(baseAngle + offset) * 2.5 * speedMult,
                vy: Math.sin(baseAngle + offset) * 2.5 * speedMult,
                size: 7, damage: Math.floor(5 * dmgMult), life: 200, color: "#c09070"
            });
        }
    } else if (type === 6) {
        var countR = isPhase2 ? 10 : 6;
        for (var i = 0; i < countR; i++) {
            livingStoneAttacks.push({
                type: "rock", x: Math.random() * 400, y: -20 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 0.8 * lsSpeedMult,
                vy: (3.0 + Math.random() * 1.0) * speedMult,
                size: 10 + Math.random() * 6, rotation: 0, rotSpeed: (Math.random() - 0.5) * 0.15,
                damage: Math.floor(6 * dmgMult)
            });
        }
    }
    
    if (type === 7) {
        var spiralCount = isPhase2 ? 24 : 16;
        for (var i = 0; i < spiralCount; i++) {
            var baseAngle = (i / spiralCount) * Math.PI * 2;
            var delay = i * Math.floor(60 / lsSpeedMult);
            (function(ang, dly) {
                setTimeout(function() {
                    if (!livingStoneActive || (livingStoneState !== "phase1" && livingStoneState !== "phase2")) return;
                    livingStoneAttacks.push({
                        type: "orb", x: livingStoneBoss.x, y: livingStoneBoss.y,
                        vx: Math.cos(ang) * 2.0 * speedMult, vy: Math.sin(ang) * 2.0 * speedMult,
                        size: 7, damage: Math.floor(5 * dmgMult), life: 250, color: "#ff8800"
                    });
                }, dly);
            })(baseAngle, delay);
        }
    }
    
    if (type === 8 && !activeGravityWell) {
        activeGravityWell = true;
        var wellX = 100 + Math.random() * 200, wellY = 150 + Math.random() * 200, wellDur = 300;
        livingStoneAttacks.push({
            type: "gravity_well", x: wellX, y: wellY,
            radius: 45, maxRadius: 55, life: wellDur, maxLife: wellDur,
            pulse: 0, damage: 0, hit: false, hitCooldown: 0
        });
        var stoneCount = isPhase2 ? 14 : 10;
        for (var i = 0; i < stoneCount; i++) {
            var angle = (i / stoneCount) * Math.PI * 2 + Math.random() * 0.3;
            var spawnDist = 250 + Math.random() * 80;
            livingStoneAttacks.push({
                type: "gravity_stone", x: wellX + Math.cos(angle) * spawnDist, y: wellY + Math.sin(angle) * spawnDist,
                vx: 0, vy: 0, wellX: wellX, wellY: wellY,
                size: 10 + Math.random() * 6, rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2, damage: Math.floor(7 * dmgMult),
                pullSpeed: 0, maxPullSpeed: (3.5 + Math.random() * 1.5) * speedMult,
                life: 250, color: "#8B7355"
            });
        }
        setTimeout(function() {
            if (!livingStoneActive) return;
            for (var k = livingStoneAttacks.length - 1; k >= 0; k--) {
                if (livingStoneAttacks[k].type === "gravity_well") {
                    var w = livingStoneAttacks[k];
                    for (var j = 0; j < 12; j++) {
                        var ang = (j / 12) * Math.PI * 2;
                        livingStoneAttacks.push({
                            type: "orb", x: w.x, y: w.y,
                            vx: Math.cos(ang) * 3.5 * speedMult, vy: Math.sin(ang) * 3.5 * speedMult,
                            size: 9, damage: Math.floor(9 * dmgMult), life: 200, color: "#ffcc00"
                        });
                    }
                    livingStoneAttacks.splice(k, 1);
                }
            }
            activeGravityWell = false;
            livingStoneShake = 15; livingStoneScreenFlash = 10; livingStoneScreenFlashColor = "#ffcc00";
            if (typeof playArenaSound === 'function') playArenaSound(80, 'square', 0.6, 0.3);
        }, Math.floor(1500 / lsSpeedMult));
    }
    
    if (type === 9) {
        var rainCount = isPhase2 ? 20 : 14;
        for (var i = 0; i < rainCount; i++) {
            var rx = 20 + Math.random() * 360;
            var delay = i * Math.floor(80 / lsSpeedMult);
            (function(x2, dly) {
                setTimeout(function() {
                    if (!livingStoneActive || (livingStoneState !== "phase1" && livingStoneState !== "phase2")) return;
                    livingStoneAttacks.push({
                        type: "falling_star", x: x2, y: -30,
                        vx: (Math.random() - 0.5) * 0.5 * lsSpeedMult,
                        vy: (3.5 + Math.random() * 1.5) * speedMult,
                        size: 8 + Math.random() * 5,
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.2,
                        damage: Math.floor(6 * dmgMult),
                        life: 250, trail: [],
                        color: Math.random() > 0.5 ? "#ffcc00" : "#ff8800"
                    });
                }, dly);
            })(rx, delay);
        }
        if (typeof playArenaSound === 'function') playArenaSound(180, 'sine', 0.8, 0.15);
    }
    
    if (type === 10 && isPhase2) {
        for (var i = 0; i < 5; i++) {
            var x = 30 + i * 85 + Math.random() * 30;
            livingStoneAttacks.push({
                type: "spike", x: x, y: 500, height: 0,
                maxHeight: 60 + Math.random() * 40,
                warningTimer: Math.floor(45 / lsSpeedMult),
                damage: Math.floor(12 * dmgMult), color: "#5a4030"
            });
        }
    } else if (type === 11 && isPhase2) {
        var isVertical = Math.random() > 0.5;
        if (isVertical) {
            var gapCenter = livingStonePlayer.y, gapSize = 90;
            var startX = Math.random() > 0.5 ? -30 : 430;
            var dirX = startX < 0 ? 4 * speedMult : -4 * speedMult;
            for (var i = 10; i < 490; i += 30) {
                if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                livingStoneAttacks.push({ type: "rock", x: startX, y: i, vx: dirX, vy: 0, size: 22, rotation: 0, rotSpeed: 0.05, damage: Math.floor(9 * dmgMult) });
            }
        } else {
            var gapCenter2 = livingStonePlayer.x, gapSize2 = 90;
            var startY = Math.random() > 0.5 ? -30 : 530;
            var dirY = startY < 0 ? 3.0 * speedMult : -3.0 * speedMult;
            for (var i = 10; i < 390; i += 30) {
                if (Math.abs(i - gapCenter2) < gapSize2 / 2) continue;
                livingStoneAttacks.push({ type: "rock", x: i, y: startY, vx: 0, vy: dirY, size: 22, rotation: 0, rotSpeed: 0.05, damage: Math.floor(9 * dmgMult) });
            }
        }
    } else if (type === 12 && isPhase2) {
        var laserX2 = 100 + Math.random() * 200;
        livingStoneAttacks.push({ type: "laser_warning", x: laserX2, y: 0, width: 70, timer: Math.floor(50 / lsSpeedMult), damage: Math.floor(15 * dmgMult) });
        for (var i = 0; i < 4; i++) {
            livingStoneAttacks.push({
                type: "rock", x: Math.random() * 400, y: -20,
                vx: (Math.random() - 0.5) * 1.0 * lsSpeedMult,
                vy: (2.8 + Math.random() * 1.0) * speedMult,
                size: 12, rotation: 0, rotSpeed: 0.08, damage: Math.floor(7 * dmgMult)
            });
        }
    }
}

// ========== ОБНОВЛЕНИЯ ==========
function updateLivingStonePlayer() {
    if (livingStoneState === "restore" || livingStoneState === "qte_intro" || 
        livingStoneState === "qte_cinematic" || livingStoneState === "qte_punch" || 
        livingStoneState === "qte_finish" || finalSceneActive) return;
    if (typeof keys === 'undefined') return;
    var mx = 0, my = 0;
    var speed = ((livingStoneState === "phase2") ? 4.5 : 3.0) * lsSpeedMult;
    if (lsActiveMod && lsActiveMod.type === 3) speed *= 0.85;
    if (lsActiveMod && lsActiveMod.type === 5) speed *= 1.35;
    if (lsTouchActive) {
        var tx = lsTouchX - livingStonePlayer.x, ty = lsTouchY - livingStonePlayer.y;
        var dist = Math.sqrt(tx * tx + ty * ty);
        if (dist > 5) {
            mx = tx / dist; my = ty / dist;
            if (dist > 50) speed *= 1.3;
        }
    } else {
        if (keys.w || keys.up) my -= 1;
        if (keys.s || keys.down) my += 1;
        if (keys.a || keys.left) mx -= 1;
        if (keys.d || keys.right) mx += 1;
        if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }
    }
    var oldX = livingStonePlayer.x, oldY = livingStonePlayer.y;
    livingStonePlayer.x += mx * speed;
    livingStonePlayer.y += my * speed;
    livingStonePlayer.x = Math.max(16, Math.min(384, livingStonePlayer.x));
    livingStonePlayer.y = Math.max(80, Math.min(484, livingStonePlayer.y));
    lsPlayerVelocity.x = livingStonePlayer.x - oldX;
    lsPlayerVelocity.y = livingStonePlayer.y - oldY;
}

function updateLivingStoneBoss() {
    if (livingStoneState !== "phase1" && livingStoneState !== "phase2") return;
    if (finalSceneActive) return;
    var speedMult = ((livingStoneState === "phase2") ? 1.8 : 1.0) * lsSpeedMult;
    livingStoneBoss.x += livingStoneBoss.vx * speedMult;
    if (livingStoneBoss.x < 80 || livingStoneBoss.x > 320) livingStoneBoss.vx *= -1;
    livingStoneBoss.rotation += 0.01 * speedMult;
}

function updateLivingStoneBullets() {
    for (var i = livingStoneBullets.length - 1; i >= 0; i--) {
        var b = livingStoneBullets[i];
        if (b.homing && b.homingSpeed) {
            var dxH = livingStoneBoss.x - b.x;
            var dyH = livingStoneBoss.y - b.y;
            var lenH = Math.sqrt(dxH * dxH + dyH * dyH) || 1;
            b.vx += (dxH / lenH) * b.homingSpeed;
            b.vy += (dyH / lenH) * b.homingSpeed;
            var maxSpd = 9 * lsSpeedMult;
            var curSpd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (curSpd > maxSpd) {
                b.vx = (b.vx / curSpd) * maxSpd;
                b.vy = (b.vy / curSpd) * maxSpd;
            }
        }
        b.x += b.vx; b.y += b.vy; b.life--;

        var dx = b.x - livingStoneBoss.x, dy = b.y - livingStoneBoss.y;
        if (Math.sqrt(dx * dx + dy * dy) < livingStoneBoss.size + b.size) {
            var dmg = b.damage;
            if (lsActiveMod && lsActiveMod.type === 5) dmg = Math.floor(dmg * 1.25);
            damageLivingStone(dmg);
            spawnLivingStoneParticles(b.x, b.y, 6, "#ffdd00", 3);
            livingStoneBullets.splice(i, 1);
            continue;
        }
        if (b.life <= 0 || b.y < -20 || b.y > 520 || b.x < -20 || b.x > 420) livingStoneBullets.splice(i, 1);
    }
}

function damageLivingStone(dmg) {
    if (livingStoneState !== "phase1" && livingStoneState !== "phase2") return;
    if (livingStoneState === "phase2" && livingStoneBossHp <= 0) return;
    livingStoneBossHp -= dmg;
    livingStoneBossFlash = 5;
    if (livingStoneBossHp <= livingStoneBossMaxHp * 0.05 && livingStoneRestoreCount === 0) { triggerRestoreScene(); return; }
    if (livingStoneBossHp <= 0 && livingStoneState === "phase2") { livingStoneBossHp = 0; livingStoneVictory(); }
}

// ========== МОДИФИКАЦИИ ==========
function spawnLSModCapsule() {
    if (!livingStoneActive) return;
    if (livingStoneState !== "phase1" && livingStoneState !== "phase2") return;
    if (finalSceneActive) return;
    var mod = LS_MODS[Math.floor(Math.random() * LS_MODS.length)];
    var x = 60 + Math.random() * 280;
    lsModCapsules.push({
        x: x, y: -30,
        vy: 1.5 + Math.random() * 0.8,
        mod: mod,
        size: 18,
        rotation: 0,
        rotSpeed: 0.02,
        life: 600,
        wobble: Math.random() * Math.PI * 2
    });
    if (typeof playArenaSound === 'function') playArenaSound(600, 'sine', 0.2, 0.08);
}

function updateLSModCapsules() {
    for (var i = lsModCapsules.length - 1; i >= 0; i--) {
        var c = lsModCapsules[i];
        c.y += c.vy;
        c.rotation += c.rotSpeed;
        c.wobble += 0.1;
        c.life--;

        var dx = c.x - livingStonePlayer.x;
        var dy = c.y - livingStonePlayer.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < c.size + 12) {
            activateLSMod(c.mod);
            spawnLivingStoneParticles(c.x, c.y, 20, c.mod.color, 5);
            lsModCapsules.splice(i, 1);
            continue;
        }

        if (c.y > 520 || c.life <= 0) {
            lsModCapsules.splice(i, 1);
        }
    }

    lsModSpawnTimer++;
    if (lsModSpawnTimer >= lsModSpawnInterval) {
        lsModSpawnTimer = 0;
        spawnLSModCapsule();
    }
}

function activateLSMod(mod) {
    lsActiveMod = {
        type: mod.id,
        name: mod.name,
        icon: mod.icon,
        color: mod.color,
        timer: lsModDuration,
        duration: lsModDuration
    };
    spawnLivingStoneText(livingStonePlayer.x, livingStonePlayer.y - 40, mod.icon + " " + mod.name, mod.color, 100);
    if (typeof playArenaSound === 'function') {
        playArenaSound(800, 'sine', 0.15, 0.15);
        setTimeout(function() { playArenaSound(1000, 'sine', 0.15, 0.15); }, 100);
    }
}

function updateLSActiveMod() {
    if (!lsActiveMod) return;
    lsActiveMod.timer--;
    if (lsActiveMod.timer <= 0) {
        spawnLivingStoneText(livingStonePlayer.x, livingStonePlayer.y - 40, lsActiveMod.name + " ЗАКОНЧИЛСЯ", "#888888", 60);
        lsActiveMod = null;
    }
}

// ========== СЦЕНА ВОССТАНОВЛЕНИЯ ==========
function triggerRestoreScene() {
    livingStoneState = "restore";
    livingStoneRestoring = true;
    livingStoneRestoreCount = 1;
    spawnLivingStoneText(200, 100, "ХА-ХА-ХА!", "#ffffff", 120);
    spawnLivingStoneText(200, 140, "ТЫ ДУМАЛ Я УМРУ?", "#888888", 120);
    var healInterval = setInterval(function() {
        if (!livingStoneActive) { clearInterval(healInterval); return; }
        livingStoneBossHp = Math.min(livingStoneBossMaxHp, livingStoneBossHp + livingStoneBossMaxHp * 0.06);
        spawnLivingStoneParticles(livingStoneBoss.x + (Math.random() - 0.5) * 40, livingStoneBoss.y + (Math.random() - 0.5) * 40, 3, "#a08060", 3);
        if (livingStoneBossHp >= livingStoneBossMaxHp) { clearInterval(healInterval); livingStoneBossHp = livingStoneBossMaxHp; }
    }, Math.floor(40 / lsSpeedMult));
    if (typeof playArenaSound === 'function') {
        playArenaSound(80, 'sawtooth', 2.0, 0.25);
        setTimeout(function() { playArenaSound(100, 'sawtooth', 1.5, 0.2); }, 400);
        setTimeout(function() { playArenaSound(150, 'sawtooth', 1.2, 0.15); }, 800);
    }
    livingStoneShake = 25;
    setTimeout(function() { if (livingStoneActive) triggerMusicScene(); }, 3000);
}

// ========== СЦЕНА ВСТУПЛЕНИЯ ==========
function triggerMusicScene() {
    if (!livingStoneActive) return;
    livingStoneState = "qte_intro";
    livingStoneBossHp = livingStoneBossMaxHp;
    livingStoneRestoring = false;
    livingStoneBoss.vx = 0;
    startQTEMusic();
    
    spawnCinematicText(200, 65, "STANDING HERE...", "#ffffff", 400, 28);
    for (var i = 0; i < 20; i++) {
        spawnLivingStoneParticles(
            200 + (Math.random() - 0.5) * 200,
            400 + (Math.random() - 0.5) * 60,
            1, "#ffffff", 2
        );
    }
    if (typeof playArenaSound === 'function') playArenaSound(400, 'sine', 0.6, 0.1);
    
    setTimeout(function() {
        if (!livingStoneActive) return;
        spawnCinematicText(200, 105, "I REALIZE...", "#ffdd00", 400, 26);
        livingStoneScreenFlash = 15; livingStoneScreenFlashColor = "#ffffff";
        if (typeof playArenaSound === 'function') playArenaSound(500, 'sine', 0.5, 0.12);
    }, 3000);
    
    setTimeout(function() {
        if (!livingStoneActive) return;
        spawnCinematicText(200, 145, "ТЫ НЕ СМОЖЕШЬ МЕНЯ ПРОБИТЬ", "#ff6644", 300, 22);
        spawnCinematicText(200, 180, "НИКОГДА!", "#ff2200", 300, 20);
        livingStoneScreenFlash = 10; livingStoneScreenFlashColor = "#ff0000";
        livingStoneShake = 12;
        if (typeof playArenaSound === 'function') playArenaSound(120, 'sawtooth', 0.5, 0.15);
        for (var i = 0; i < 15; i++) {
            spawnLivingStoneParticles(200 + (Math.random() - 0.5) * 100, 100, 1, "#ff3300", 3);
        }
    }, 6000);
    
    setTimeout(function() {
        if (!livingStoneActive) return;
        spawnCinematicText(200, 220, "ХА-ХА-ХА!", "#ff0000", 250, 26);
        spawnCinematicText(200, 255, "ТЫ ВСЁ РАВНО УМРЁШЬ!", "#ff4400", 250, 18);
        livingStoneShake = 18;
        livingStoneScreenFlash = 12; livingStoneScreenFlashColor = "#ff0000";
        if (typeof playArenaSound === 'function') {
            playArenaSound(100, 'sawtooth', 0.8, 0.2);
            setTimeout(function() { playArenaSound(150, 'square', 0.4, 0.15); }, 300);
        }
        for (var i = 0; i < 20; i++) {
            spawnLivingStoneParticles(200 + (Math.random() - 0.5) * 150, 100 + (Math.random() - 0.5) * 40, 1, "#ff6600", 4);
        }
    }, 8000);
    
    setTimeout(function() {
        if (!livingStoneActive) return;
        spawnCinematicText(200, 300, "ПОШЁЛ ПРОЧЬ!", "#ffffff", 200, 22);
        livingStoneScreenFlash = 20; livingStoneScreenFlashColor = "#ffffff";
        livingStoneShake = 25;
        if (typeof playArenaSound === 'function') {
            playArenaSound(80, 'sawtooth', 0.8, 0.3);
            setTimeout(function() { playArenaSound(140, 'sawtooth', 0.6, 0.25); }, 200);
        }
    }, 10000);
    
    setTimeout(function() { 
        if (livingStoneActive) triggerCinematic(); 
    }, 11000);
}

// ========== КИНЕМАТИК ==========
function triggerCinematic() {
    if (!livingStoneActive) return;
    livingStoneState = "qte_cinematic";
    qteCinematicActive = true;
    qteCinematicPhase = "grabbed";
    qteCinematicTimer = 0;
    spawnLivingStoneText(200, 200, "ТЫ СЛАБ!", "#888888", 120);
    qteBossArm = { startX: livingStoneBoss.x, startY: livingStoneBoss.y, endX: livingStonePlayer.x, endY: livingStonePlayer.y, progress: 0, duration: 1.2 };
    if (typeof playArenaSound === 'function') playArenaSound(120, 'sawtooth', 0.6, 0.3);
    setTimeout(function() {
        if (!livingStoneActive) return;
        qteCinematicPhase = "flying";
        qteCinematicShake = 30; livingStoneScreenFlash = 20; livingStoneScreenFlashColor = "#ff0000";
        if (typeof playArenaSound === 'function') { playArenaSound(80, 'square', 0.5, 0.4); setTimeout(function() { playArenaSound(40, 'sawtooth', 1.0, 0.3); }, 200); }
        spawnLivingStoneParticles(livingStonePlayer.x, livingStonePlayer.y, 30, "#ffffff", 8);
        qtePlayerVel = { x: 12, y: 8 };
        setTimeout(function() {
            if (!livingStoneActive) return;
            qteCinematicPhase = "angry";
            qteCinematicShake = 25;
            livingStonePlayer.x = 350; livingStonePlayer.y = 450; qtePlayerVel = { x: 0, y: 0 };
            spawnLivingStoneParticles(350, 450, 25, "#ff3333", 6);
            livingStoneScreenFlash = 15; livingStoneScreenFlashColor = "#ff0000";
            if (typeof playArenaSound === 'function') playArenaSound(60, 'sawtooth', 0.8, 0.3);
            qtePlayerAngry = true;
            setTimeout(function() {
                if (!livingStoneActive) return;
                qteCinematicPhase = "running_slow";
                spawnLivingStoneText(300, 400, "ХВАТИТ!", "#ff2222", 120);
                spawnLivingStoneText(300, 440, "Я ТЕБЯ РАЗОБЬЮ!", "#ff4444", 120);
                if (typeof playArenaSound === 'function') playArenaSound(100, 'square', 0.5, 0.25);
                setTimeout(function() {
                    if (!livingStoneActive) return;
                    qteCinematicPhase = "running_fast";
                    if (typeof playArenaSound === 'function') {
                        playArenaSound(200, 'square', 0.4, 0.3);
                        setTimeout(function() { playArenaSound(300, 'square', 0.3, 0.25); }, 100);
                    }
                    setTimeout(function() {
                        if (!livingStoneActive) return;
                        qteCinematicPhase = "punch";
                        spawnMegaImpact(livingStoneBoss.x, livingStoneBoss.y);
                        qtePunchImpact = { x: livingStoneBoss.x, y: livingStoneBoss.y, life: 40, maxLife: 40, size: 200 };
                        spawnLivingStoneParticles(livingStoneBoss.x, livingStoneBoss.y, 150, "#ffffff", 20);
                        spawnLivingStoneParticles(livingStoneBoss.x, livingStoneBoss.y, 80, "#ffdd00", 15);
                        spawnLivingStoneParticles(livingStoneBoss.x, livingStoneBoss.y, 60, "#ff4400", 12);
                        if (typeof playArenaSound === 'function') {
                            playArenaSound(40, 'sawtooth', 1.5, 0.5);
                            setTimeout(function() { playArenaSound(60, 'square', 0.8, 0.4); }, 200);
                            setTimeout(function() { playArenaSound(100, 'sawtooth', 1.0, 0.3); }, 400);
                        }
                        spawnLivingStoneText(200, 200, "ТЫ!", "#ffffff", 150);
                        spawnLivingStoneText(200, 240, "...ХВАТИТ!", "#ffdd00", 150);
                        setTimeout(function() {
                            if (!livingStoneActive) return;
                            qteCinematicActive = false;
                            qteCinematicPhase = "done";
                            triggerQTEStart();
                        }, 1200);
                    }, 1500);
                }, 1500);
            }, 1500);
        }, 1500);
    }, 1200);
}

// ========== QTE ==========
function triggerQTEStart() {
    if (!livingStoneActive) return;
    livingStoneState = "qte_punch";
    qteActive = true; qteClicks = 0; qteBossDamageLevel = 0; qteBossShake = 0;
    livingStoneShake = 20; livingStoneScreenFlash = 12; livingStoneScreenFlashColor = "#ffffff";
    if (typeof playArenaSound === 'function') playArenaSound(60, 'square', 0.3, 0.3);
    spawnLivingStoneText(200, 200, "100 УДАРОВ!", "#ffdd00", 180);
    spawnQTEBarrage();
    qteBarrageInterval = setInterval(function() {
        if (!qteActive || !livingStoneActive) { clearInterval(qteBarrageInterval); qteBarrageInterval = null; return; }
        spawnQTEBarrage();
    }, 400);
    qteEndTimer = setTimeout(function() {
        if (qteBarrageInterval) { clearInterval(qteBarrageInterval); qteBarrageInterval = null; }
        if (!livingStoneActive) return;
        if (qteClicks < qteClickTarget) {
            qteActive = false; livingStoneState = "qte_finish";
            spawnLivingStoneText(200, 250, "СЛИШКОМ МЕДЛЕННО!", "#ff0000", 180);
            livingStoneScreenFlash = 40; livingStoneScreenFlashColor = "#ff0000";
            if (typeof playArenaSound === 'function') playArenaSound(40, 'sawtooth', 2.0, 0.4);
            setTimeout(function() { stopLivingStoneFight(); livingStoneDefeat(); }, 1500);
            return;
        }
        triggerQTEFinish();
    }, 30000);
}

function spawnQTEBarrage() {
    var sides = ["left", "right", "top", "bottom"];
    var barrageCount = lsMobileMode ? 3 : 6;
    for (var i = 0; i < barrageCount; i++) {
        var side = sides[Math.floor(Math.random() * sides.length)];
        var startX, startY;
        if (side === "left") { startX = -20 - Math.random() * 30; startY = 50 + Math.random() * 400; }
        else if (side === "right") { startX = 420 + Math.random() * 30; startY = 50 + Math.random() * 400; }
        else if (side === "top") { startX = 50 + Math.random() * 300; startY = -20 - Math.random() * 30; }
        else { startX = 50 + Math.random() * 300; startY = 520 + Math.random() * 30; }
        var dx = livingStoneBoss.x - startX, dy = livingStoneBoss.y - startY;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var speed = 12 + Math.random() * 8;
        qteBullets.push({
            x: startX, y: startY, vx: (dx / len) * speed, vy: (dy / len) * speed,
            size: 4 + Math.random() * 4, life: 60,
            color: Math.random() > 0.5 ? "#ffdd00" : "#ffffff"
        });
    }
    var fromPlayer = lsMobileMode ? 1 : 3;
    for (var j = 0; j < fromPlayer; j++) {
        qteBullets.push({
            x: livingStonePlayer.x + (Math.random() - 0.5) * 30, y: livingStonePlayer.y,
            vx: (Math.random() - 0.5) * 3, vy: -15 - Math.random() * 5,
            size: 5 + Math.random() * 4, life: 60, color: "#ffffff"
        });
    }
    livingStoneShake = Math.max(livingStoneShake, 8);
}

function updateQTEBullets() {
    for (var i = qteBullets.length - 1; i >= 0; i--) {
        var b = qteBullets[i];
        b.x += b.vx; b.y += b.vy; b.life--;
        var dx = b.x - livingStoneBoss.x, dy = b.y - livingStoneBoss.y;
        if (Math.sqrt(dx * dx + dy * dy) < livingStoneBoss.size) {
            spawnLivingStoneParticles(b.x, b.y, 5, b.color, 5);
            qteBullets.splice(i, 1);
            continue;
        }
        if (b.life <= 0 || b.x < -100 || b.x > 500 || b.y < -100 || b.y > 600) qteBullets.splice(i, 1);
    }
}

function handleQTEClick(ev) {
    if (livingStoneState !== "qte_punch" || !qteActive) return;
    qteClicks++;
    qteBossDamageLevel = Math.min(1, qteClicks / qteClickTarget);
    qteBossShake = 6;
    qtePunches.push({
        x: livingStoneBoss.x + (Math.random() - 0.5) * 80,
        y: livingStoneBoss.y + (Math.random() - 0.5) * 80,
        life: 12, maxLife: 12, size: 20 + Math.random() * 25, angle: Math.random() * Math.PI * 2
    });
    var clickBullets = lsMobileMode ? 2 : 4;
    for (var i = 0; i < clickBullets; i++) {
        var angle = Math.random() * Math.PI * 2;
        var startDist = 100 + Math.random() * 50;
        var sx = livingStoneBoss.x + Math.cos(angle) * startDist;
        var sy = livingStoneBoss.y + Math.sin(angle) * startDist;
        var dx = livingStoneBoss.x - sx, dy = livingStoneBoss.y - sy;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        qteBullets.push({
            x: sx, y: sy, vx: (dx / len) * 15, vy: (dy / len) * 15,
            size: 4 + Math.random() * 3, life: 60,
            color: Math.random() > 0.5 ? "#ffdd00" : "#ffffff"
        });
    }
    livingStoneShake = Math.max(livingStoneShake, 6);
    if (typeof playArenaSound === 'function') playArenaSound(200 + Math.random() * 300, 'square', 0.08, 0.12);
    if (qteClicks >= qteClickTarget) {
        if (qteEndTimer) { clearTimeout(qteEndTimer); qteEndTimer = null; }
        if (qteBarrageInterval) { clearInterval(qteBarrageInterval); qteBarrageInterval = null; }
        triggerQTEFinish();
    }
}

function triggerQTEFinish() {
    if (!qteActive) return;
    qteActive = false;
    livingStoneState = "qte_finish";
    setTimeout(function() {
        if (!livingStoneActive) return;
        var angle = Math.atan2(livingStonePlayer.y - livingStoneBoss.y, livingStonePlayer.x - livingStoneBoss.x);
        var power = 25;
        for (var i = 0; i < 8; i++) {
            (function(idx) {
                setTimeout(function() {
                    var t = idx / 8;
                    livingStonePlayer.x += Math.cos(angle) * power * (1 - t);
                    livingStonePlayer.y += Math.sin(angle) * power * (1 - t);
                    livingStonePlayer.x = Math.max(16, Math.min(384, livingStonePlayer.x));
                    livingStonePlayer.y = Math.max(80, Math.min(484, livingStonePlayer.y));
                    spawnLivingStoneParticles(livingStonePlayer.x, livingStonePlayer.y, 5, "#ff3333", 4);
                }, idx * 50);
            })(i);
        }
        livingStoneShake = 40; livingStoneScreenFlash = 30; livingStoneScreenFlashColor = "#ff0000";
        livingStonePlayerHp -= 15;
        if (typeof playArenaSound === 'function') playArenaSound(40, 'sawtooth', 1.5, 0.4);
        spawnLivingStoneText(200, 250, "БЕСПОЛЕЗНО!", "#888888", 120);
        spawnLivingStoneText(200, 290, "ТЫ НИЧЕГО МНЕ НЕ СДЕЛАЕШЬ!", "#666666", 120);
        setTimeout(function() { if (livingStoneActive) triggerPhase2(); }, 2500);
    }, 500);
}

function triggerPhase2() {
    livingStoneState = "phase2";
    livingStoneRestoring = false;
    qtePunches = []; qteBullets = []; livingStoneAttacks = [];
    livingStoneBossMaxHp = Math.floor(livingStoneBossMaxHp / 2);
    livingStoneBossHp = livingStoneBossMaxHp;
    livingStoneBoss.vx = 1.5;
    livingStoneAttackType = 10;
    livingStoneTypeTimer = 200;
    livingStoneInvulnTimer = 60;
    qteBossDamageLevel = 0;
    activeGravityWell = false;
    livingStoneScreenFlash = 20; livingStoneScreenFlashColor = "#ff4400"; livingStoneShake = 25;
    spawnLivingStoneText(200, 220, "ФАЗА 2", "#ff4400", 120);
    spawnLivingStoneText(200, 260, "ТЕПЕРЬ Я ЗЛОЙ!", "#ff6600", 120);
    if (typeof playArenaSound === 'function') {
        playArenaSound(80, 'sawtooth', 1.5, 0.3);
        setTimeout(function() { playArenaSound(120, 'sawtooth', 1.0, 0.25); }, 300);
    }
}

// ========== ПОБЕДА / ПОРАЖЕНИЕ ==========
function livingStoneVictory() {
    livingStoneState = "victory";
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
        if (!defeatedBosses.includes(200)) {
            defeatedBosses.push(200);
            if (typeof saveAll === 'function') saveAll();
        }
    }
    if (typeof dropLivingStoneLoot === 'function') dropLivingStoneLoot();
    spawnLivingStoneText(200, 200, "КАМЕНЬ РАЗБИТ!", "#ffffff", 180);
    livingStoneScreenFlash = 40; livingStoneScreenFlashColor = "#ffffff";
    if (typeof playArenaSound === 'function') {
        setTimeout(function() { playArenaSound(400, 'sine', 1.0, 0.15); }, 100);
        setTimeout(function() { playArenaSound(500, 'sine', 1.0, 0.15); }, 400);
        setTimeout(function() { playArenaSound(700, 'sine', 1.5, 0.2); }, 700);
    }
    for (var i = 0; i < 60; i++) {
        spawnLivingStoneParticles(
            livingStoneBoss.x + (Math.random() - 0.5) * 80,
            livingStoneBoss.y + (Math.random() - 0.5) * 80,
            1, ["#8B7355", "#a08060", "#666666"][Math.floor(Math.random() * 3)], 8
        );
    }
    setTimeout(function() {
        if (livingStoneActive) startFinalScene();
    }, 2500);
}

function livingStoneDefeat() {
    livingStoneState = "defeat";
    spawnLivingStoneText(200, 250, "КАМЕНЬ НЕПОБЕДИМ", "#ff0000", 180);
    livingStoneScreenFlash = 40; livingStoneScreenFlashColor = "#ff0000";
    if (typeof playArenaSound === 'function') playArenaSound(40, 'sawtooth', 2.5, 0.3);
    setTimeout(function() {
        stopLivingStoneFight();
        if (typeof playerHp !== 'undefined') playerHp = 0;
        if (typeof defeat === 'function') defeat();
    }, 2500);
}

// ========== ФИНАЛЬНАЯ СЦЕНА ==========
function startFinalScene() {
    finalSceneActive = true;
    finalScenePhase = "cracks";
    finalSceneTimer = 0;
    finalCracksLevel = 0;
    finalBlackHole = null;
    finalHeartVel = { x: 0, y: 0 };
    finalHeartVisible = true;
    finalLaughOffset = 0;
    finalDialogIndex = 0;
    finalTexts = [];
    finalTextTimer = 0;
    finalSceneEndTimer = 0;
    stopQTEMusic();
    livingStoneAttacks = [];
    livingStoneBullets = [];
    chainExplosionsQueue = [];
    lsModCapsules = [];
    lsActiveMod = null;
    finalTexts = [
        { text: "...не может быть...", time: 90 },
        { text: "я... я не могу проиграть!", time: 90 },
        { text: "ты... ты просто...", time: 90 },
        { text: "...ха-ха-ха!", time: 60 },
        { text: "знаешь что? ИДИ СЮДА!", time: 90 }
    ];
    spawnLivingStoneText(200, 380, finalTexts[0].text, "#ffffff", 150);
    finalDialogIndex = 1;
    if (typeof playArenaSound === 'function') playArenaSound(80, 'sawtooth', 1.5, 0.3);
}

function updateFinalScene() {
    finalSceneTimer++;
    if (finalScenePhase === "cracks") {
        finalCracksLevel = Math.min(1, finalCracksLevel + 0.01);
        qteBossShake = 3;
        if (finalDialogIndex < finalTexts.length) {
            finalTextTimer++;
            if (finalTextTimer >= finalTexts[finalDialogIndex].time) {
                finalTextTimer = 0;
                spawnLivingStoneText(200, 380, finalTexts[finalDialogIndex].text, "#ffffff", 150);
                if (typeof playArenaSound === 'function') playArenaSound(100 + finalDialogIndex * 30, 'square', 0.4, 0.15);
                finalDialogIndex++;
            }
        }
        if (finalSceneTimer > 480) {
            finalScenePhase = "blackhole_appear";
            finalSceneTimer = 0;
        }
    } else if (finalScenePhase === "blackhole_appear") {
        if (!finalBlackHole) {
            finalBlackHole = {
                x: 200,
                y: 250,
                radius: 5,
                maxRadius: 80,
                progress: 0
            };
            if (typeof playArenaSound === 'function') {
                playArenaSound(60, 'sawtooth', 1.5, 0.3);
                setTimeout(function() { playArenaSound(45, 'sawtooth', 1.2, 0.25); }, 300);
            }
        }
        finalBlackHole.progress = Math.min(1, finalSceneTimer / 90);
        finalBlackHole.radius = 5 + (finalBlackHole.maxRadius - 5) * finalBlackHole.progress;
        if (finalSceneTimer > 90) { finalScenePhase = "pull_heart"; finalSceneTimer = 0; }
    } else if (finalScenePhase === "pull_heart") {
        if (finalBlackHole) {
            finalBlackHole.radius = finalBlackHole.maxRadius + Math.sin(finalSceneTimer / 15) * 5;
            var dx = finalBlackHole.x - livingStonePlayer.x;
            var dy = finalBlackHole.y - livingStonePlayer.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                var pullStrength = 2.5 + finalSceneTimer * 0.04;
                livingStonePlayer.x += (dx / dist) * pullStrength;
                livingStonePlayer.y += (dy / dist) * pullStrength;
            }
            if (dist < 10 || finalSceneTimer > 240) {
                finalHeartVisible = false;
                finalScenePhase = "heart_gone";
                finalSceneTimer = 0;
                spawnLivingStoneParticles(finalBlackHole.x, finalBlackHole.y, 40, "#ffffff", 6);
                spawnLivingStoneParticles(finalBlackHole.x, finalBlackHole.y, 30, "#ff3333", 5);
                if (typeof playArenaSound === 'function') {
                    playArenaSound(200, 'square', 0.5, 0.4);
                    setTimeout(function() { playArenaSound(100, 'sawtooth', 1.5, 0.3); }, 200);
                }
            }
        }
    } else if (finalScenePhase === "heart_gone") {
        if (finalBlackHole) {
            finalBlackHole.radius *= 0.95;
            finalBlackHole.x += (200 - finalBlackHole.x) * 0.02;
            finalBlackHole.y += (250 - finalBlackHole.y) * 0.02;
            if (finalBlackHole.radius < 2 || finalSceneTimer > 120) {
                finalBlackHole = null;
                finalScenePhase = "laugh";
                finalSceneTimer = 0;
            }
        } else if (finalSceneTimer > 30) {
            finalScenePhase = "laugh";
            finalSceneTimer = 0;
        }
    } else if (finalScenePhase === "laugh") {
        finalLaughOffset = Math.sin(finalSceneTimer / 8) * 4;
        if (finalSceneTimer % 20 === 0 && finalSceneTimer < 180) {
            spawnLivingStoneText(
                200 + Math.random() * 60 - 30,
                200 + Math.random() * 20,
                ["ХА!", "ХА-ХА!", "ХА-ХА-ХА!"][Math.floor(Math.random() * 3)],
                "#ff2200", 60
            );
            if (typeof playArenaSound === 'function') playArenaSound(150 + Math.random() * 100, 'square', 0.15, 0.12);
        }
        if (finalSceneTimer > 240) { finalScenePhase = "done"; finalSceneTimer = 0; }
    } else if (finalScenePhase === "done") {
        finalSceneEndTimer++;
        if (finalSceneEndTimer > 60) {
            finalSceneActive = false;
            stopLivingStoneFight();
            if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
            if (typeof victory === 'function') victory();
        }
    }
}

// ========== ОБНОВЛЕНИЕ АТАК ==========
function updateLivingStoneAttacks() {
    for (var i = livingStoneAttacks.length - 1; i >= 0; i--) {
        var a = livingStoneAttacks[i];

        if (a.type === "reflected") {
            a.x += a.vx;
            a.y += a.vy;
            a.life--;
            var dxB = a.x - livingStoneBoss.x;
            var dyB = a.y - livingStoneBoss.y;
            var distB = Math.sqrt(dxB * dxB + dyB * dyB);
            if (distB < livingStoneBoss.size + (a.size || a.radius || 10)) {
                var reflectDmg = a.reflectedDamage || a.damage || 5;
                damageLivingStone(reflectDmg);
                spawnLivingStoneParticles(a.x, a.y, 25, "#00aaff", 8);
                spawnLivingStoneParticles(a.x, a.y, 15, "#ffffff", 6);
                spawnLivingStoneText(livingStoneBoss.x, livingStoneBoss.y - 50, "-" + reflectDmg + " ОТРАЖЕНО!", "#00aaff", 70);
                livingStoneShake = 18;
                if (typeof playArenaSound === 'function') {
                    playArenaSound(400, 'square', 0.2, 0.25);
                    setTimeout(function() { playArenaSound(200, 'sawtooth', 0.3, 0.2); }, 100);
                }
                livingStoneAttacks.splice(i, 1);
                continue;
            }
            if (a.life <= 0 || a.x < -100 || a.x > 500 || a.y < -100 || a.y > 600) {
                livingStoneAttacks.splice(i, 1);
            }
            continue;
        }

        if (a.type === "rock") {
            a.x += a.vx; a.y += a.vy; a.rotation += a.rotSpeed;
            if (a.y > 520 || a.y < -150 || a.x < -100 || a.x > 500) livingStoneAttacks.splice(i, 1);
        } else if (a.type === "ring") {
            a.radius += a.growth;
            if (a.radius > a.maxRadius) livingStoneAttacks.splice(i, 1);
        } else if (a.type === "orb") {
            a.x += a.vx; a.y += a.vy; a.life--;
            if (a.life <= 0 || a.y > 520 || a.y < -20 || a.x < -20 || a.x > 420) livingStoneAttacks.splice(i, 1);
        } else if (a.type === "homing") {
            var dx = livingStonePlayer.x - a.x, dy = livingStonePlayer.y - a.y;
            var len = Math.sqrt(dx * dx + dy * dy) || 1;
            a.vx += (dx / len) * 0.12 * lsSpeedMult;
            a.vy += (dy / len) * 0.12 * lsSpeedMult;
            var spd = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
            var maxSpd = 2.8 * lsSpeedMult;
            if (spd > maxSpd) { a.vx = (a.vx / spd) * maxSpd; a.vy = (a.vy / spd) * maxSpd; }
            a.x += a.vx; a.y += a.vy; a.life--;
            if (a.life <= 0 || a.y > 520 || a.y < -20 || a.x < -20 || a.x > 420) livingStoneAttacks.splice(i, 1);
        } else if (a.type === "gravity_well") {
            a.life--;
            a.pulse += 0.15;
            a.radius = a.maxRadius * (0.9 + Math.sin(a.pulse) * 0.15);
            if (a.hitCooldown > 0) a.hitCooldown--;
            var dxP = a.x - livingStonePlayer.x;
            var dyP = a.y - livingStonePlayer.y;
            var distP = Math.sqrt(dxP * dxP + dyP * dyP);
            if (distP < 180 && distP > 25) {
                var pull = 0.05 * (1 - distP / 180);
                livingStonePlayer.x += (dxP / distP) * pull * 2;
                livingStonePlayer.y += (dyP / distP) * pull * 2;
            }
            if (a.life <= 0) { activeGravityWell = false; livingStoneAttacks.splice(i, 1); }
        } else if (a.type === "gravity_stone") {
            var dx = a.wellX - a.x, dy = a.wellY - a.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (a.pullSpeed < a.maxPullSpeed) a.pullSpeed += 0.15 * lsSpeedMult;
            if (a.pullSpeed > a.maxPullSpeed) a.pullSpeed = a.maxPullSpeed;
            a.vx += (dx / dist) * a.pullSpeed * 0.3;
            a.vy += (dy / dist) * a.pullSpeed * 0.3;
            var spd2 = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
            if (spd2 > a.maxPullSpeed) { a.vx = (a.vx / spd2) * a.maxPullSpeed; a.vy = (a.vy / spd2) * a.maxPullSpeed; }
            a.x += a.vx; a.y += a.vy; a.rotation += a.rotSpeed; a.life--;
            if (dist < 30) { spawnLivingStoneParticles(a.x, a.y, 5, "#8B7355", 3); livingStoneAttacks.splice(i, 1); }
            else if (a.life <= 0) livingStoneAttacks.splice(i, 1);
        } else if (a.type === "falling_star") {
            a.trail.push({ x: a.x, y: a.y, life: 15 });
            if (a.trail.length > 8) a.trail.shift();
            a.x += a.vx; a.y += a.vy; a.rotation += a.rotSpeed; a.life--;
            if (a.life <= 0 || a.y > 520) {
                if (a.y > 520) createExplosion(a.x, 500, a.damage);
                livingStoneAttacks.splice(i, 1);
            }
        } else if (a.type === "spike") {
            if (a.warningTimer > 0) a.warningTimer--;
            else {
                a.height += 4 * lsSpeedMult;
                if (a.height >= a.maxHeight) {
                    a.height = a.maxHeight;
                    a.stayTimer = (a.stayTimer || 0) + 1;
                    if (a.stayTimer > 30) { a.height -= 3 * lsSpeedMult; if (a.height <= 0) livingStoneAttacks.splice(i, 1); }
                }
            }
        } else if (a.type === "laser_warning") {
            a.timer--;
            if (a.timer <= 0) {
                livingStoneAttacks.splice(i, 1);
                livingStoneAttacks.push({ type: "laser", x: a.x, y: 0, width: a.width, timer: Math.floor(25 / lsSpeedMult), damage: a.damage, hit: false });
                livingStoneShake = 12;
            }
        } else if (a.type === "laser") {
            a.timer--;
            if (a.timer <= 0) livingStoneAttacks.splice(i, 1);
        }
    }
}

function checkLivingStoneCollisions() {
    if (livingStoneInvulnTimer > 0) return;
    if (livingStoneState !== "phase1" && livingStoneState !== "phase2") return;
    if (finalSceneActive) return;
    var px = livingStonePlayer.x, py = livingStonePlayer.y, ph = 6;
    var shieldActive = lsActiveMod && lsActiveMod.type === 4;
    var shieldX = px, shieldY = py - 22, shieldR = 16;

    for (var i = 0; i < livingStoneAttacks.length; i++) {
        var a = livingStoneAttacks[i];
        if (a.type === "reflected") continue;
        var hit = false;
        if (a.type === "rock" || a.type === "homing" || a.type === "orb" || a.type === "falling_star") {
            var dx = px - a.x, dy = py - a.y;
            if (Math.sqrt(dx * dx + dy * dy) < a.size + ph) hit = true;
        } else if (a.type === "ring") {
            var dx = px - a.x, dy = py - a.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(dist - a.radius) < a.thickness / 2 + ph) hit = true;
        } else if (a.type === "spike" && a.warningTimer <= 0 && a.height > 10) {
            if (Math.abs(px - a.x) < 30 + ph && py > 500 - a.height) hit = true;
        } else if (a.type === "laser") {
            if (Math.abs(px - a.x) < a.width / 2 + ph) hit = true;
        } else if (a.type === "gravity_well") {
        } else if (a.type === "gravity_stone") {
            var dx = px - a.x, dy = py - a.y;
            if (Math.sqrt(dx * dx + dy * dy) < a.size + ph) hit = true;
        }

        if (shieldActive && !hit) {
            var shieldDx = shieldX - (a.x || px);
            var shieldDy = shieldY - (a.y || py);
            var shieldDist = Math.sqrt(shieldDx * shieldDx + shieldDy * shieldDy);
            var aSize = a.size || a.radius || 15;
            if (shieldDist < shieldR + aSize) {
                if (Math.random() < 0.75) {
                    var toBossX = livingStoneBoss.x - (a.x || px);
                    var toBossY = livingStoneBoss.y - (a.y || py);
                    var toBossLen = Math.sqrt(toBossX * toBossX + toBossY * toBossY) || 1;
                    var baseSpeed = 6 * lsSpeedMult;

                    a.type = "reflected";
                    a.reflectedDamage = a.damage || 5;
                    a.vx = (toBossX / toBossLen) * baseSpeed;
                    a.vy = (toBossY / toBossLen) * baseSpeed;
                    a.spd = a.vx;
                    a.spdY = a.vy;
                    if (a.size) a.size = Math.max(6, a.size * 0.8);
                    if (a.radius) a.radius = Math.max(6, a.radius * 0.8);
                    a.life = 200;

                    spawnLivingStoneParticles(a.x || px, a.y || py, 20, "#00aaff", 6);
                    spawnLivingStoneParticles(a.x || px, a.y || py, 10, "#ffffff", 4);
                    if (typeof playArenaSound === 'function') {
                        playArenaSound(1200, 'square', 0.1, 0.15);
                        setTimeout(function() { playArenaSound(800, 'square', 0.15, 0.12); }, 80);
                    }
                    spawnLivingStoneText(shieldX, shieldY - 25, "ОТРАЖЕНО!", "#00aaff", 60);
                    continue;
                } else {
                    spawnLivingStoneText(shieldX, shieldY - 25, "ПРОБИТ!", "#ff3333", 60);
                }
            }
        }

        if (hit) {
            if (a.type === "falling_star") {
                var starX = a.x, starY = a.y, starDmg = a.damage;
                damageLivingStonePlayer(a.damage || 5);
                livingStoneAttacks.splice(i, 1);
                triggerChainExplosion(starX, starY, starDmg);
                return;
            }
            damageLivingStonePlayer(a.damage || 5);
            if (a.type !== "ring" && a.type !== "laser" && a.type !== "gravity_well") {
                spawnLivingStoneParticles(a.x || px, a.y || py, 8, "#ffffff", 5);
                livingStoneAttacks.splice(i, 1);
            }
            return;
        }
    }
}

function triggerChainExplosion(x, y, damage) {
    chainExplosionsQueue.push({ x: x, y: y, delay: 0, damage: damage });
}

function damageLivingStonePlayer(dmg) {
    if (livingStoneInvulnTimer > 0) return;
    if (lsActiveMod && lsActiveMod.type === 3) dmg = Math.floor(dmg * 0.5);
    if (lsActiveMod && lsActiveMod.type === 5) dmg = Math.floor(dmg * 0.8);
    livingStonePlayerHp -= dmg;
    livingStoneInvulnTimer = 50;
    livingStoneShake = 12; livingStoneScreenFlash = 8; livingStoneScreenFlashColor = "#ff0000";
    var hpEl = document.getElementById("arenaHP");
    if (hpEl) hpEl.innerText = Math.max(0, Math.ceil(livingStonePlayerHp));
    spawnLivingStoneParticles(livingStonePlayer.x, livingStonePlayer.y, 15, "#ff3333", 4);
    if (typeof playArenaSound === 'function') playArenaSound(60, 'sawtooth', 0.5, 0.15);
    if (livingStonePlayerHp <= 0) livingStoneDefeat();
}

// ========== МУЗЫКА ==========
function startQTEMusic() {
    if (typeof stopAllMusic === 'function') stopAllMusic();
    if (typeof initAudio === 'function') { try { initAudio(); } catch(e) {} }
    if (typeof initArenaAudio === 'function') { try { initArenaAudio(); } catch(e) {} }
    if (qteMusic && qteMusicReady) {
        qteMusic.volume = 0.6;
        try { qteMusic.currentTime = qteMusicStartOffset; } catch(e) {}
        try { qteMusic.play().catch(function() {}); } catch(e) {}
        return;
    }
    if (qteMusicBlobUrl) { playQTEMusicFromUrl(qteMusicBlobUrl); return; }
    var tryLoadIndex = 0;
    function tryLoadNext() {
        if (tryLoadIndex >= qteMusicPaths.length) return;
        var path = qteMusicPaths[tryLoadIndex++];
        fetch(path).then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); })
            .then(function(blob) { qteMusicBlobUrl = URL.createObjectURL(blob); playQTEMusicFromUrl(qteMusicBlobUrl); })
            .catch(function() { tryLoadNext(); });
    }
    tryLoadNext();
}

function playQTEMusicFromUrl(url) {
    qteMusic = new Audio(url);
    qteMusic.volume = 0.6;
    var seek = function() { try { qteMusic.currentTime = qteMusicStartOffset; } catch(e) {} };
    qteMusic.addEventListener('loadedmetadata', seek);
    if (qteMusic.readyState >= 1) seek();
    qteMusic.addEventListener('timeupdate', function() {
        if (!qteMusic || !qteMusic.duration) return;
        if (qteMusic.currentTime >= qteMusic.duration - 0.5) {
            try { qteMusic.currentTime = qteMusicStartOffset; } catch(e) {}
        }
    });
    qteMusic.play().then(function() { qteMusicReady = true; }).catch(function() {
        qteMusicReady = false;
        var retry = function() { try { qteMusic.play().then(function() { qteMusicReady = true; }); } catch(e) {} document.removeEventListener("click", retry); document.removeEventListener("touchstart", retry); };
        document.addEventListener("click", retry);
        document.addEventListener("touchstart", retry);
    });
}

function stopQTEMusic() {
    if (qteMusic) {
        try { qteMusic.pause(); qteMusic.currentTime = 0; } catch(e) {}
        qteMusic = null;
    }
    qteMusicReady = false;
}

// ========== КИНЕМАТИК ОБНОВЛЕНИЕ ==========
function updateCinematic() {
    if (qteCinematicPhase === "grabbed") {
        if (qteBossArm) { qteBossArm.progress += 0.02; if (qteBossArm.progress > 1) qteBossArm.progress = 1; }
    } else if (qteCinematicPhase === "flying") {
        livingStonePlayer.x += qtePlayerVel.x;
        livingStonePlayer.y += qtePlayerVel.y;
        qtePlayerVel.x *= 0.92; qtePlayerVel.y *= 0.92;
        if (Math.abs(qtePlayerVel.x) + Math.abs(qtePlayerVel.y) > 1) {
            qtePlayerTrail.push({ x: livingStonePlayer.x, y: livingStonePlayer.y, life: 30, maxLife: 30 });
        }
        livingStonePlayer.x = Math.max(16, Math.min(384, livingStonePlayer.x));
        livingStonePlayer.y = Math.max(80, Math.min(484, livingStonePlayer.y));
    } else if (qteCinematicPhase === "angry") {
        qteCinematicTimer++;
        if (Math.random() < 0.4) spawnLivingStoneParticles(livingStonePlayer.x + (Math.random() - 0.5) * 30, livingStonePlayer.y + (Math.random() - 0.5) * 30, 1, "#ff2222", 3);
    } else if (qteCinematicPhase === "running_slow") {
        var tx = livingStoneBoss.x - 55, ty = livingStoneBoss.y + 40;
        var dx = tx - livingStonePlayer.x, dy = ty - livingStonePlayer.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        if (len > 3) { livingStonePlayer.x += (dx / len) * 2.5; livingStonePlayer.y += (dy / len) * 2.5; }
        qtePlayerTrail.push({ x: livingStonePlayer.x, y: livingStonePlayer.y, life: 20, maxLife: 20 });
    } else if (qteCinematicPhase === "running_fast") {
        var tx2 = livingStoneBoss.x - 55, ty2 = livingStoneBoss.y + 40;
        var dx2 = tx2 - livingStonePlayer.x, dy2 = ty2 - livingStonePlayer.y;
        var len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
        if (len2 > 3) { livingStonePlayer.x += (dx2 / len2) * 7; livingStonePlayer.y += (dy2 / len2) * 7; }
        qtePlayerTrail.push({ x: livingStonePlayer.x, y: livingStonePlayer.y, life: 20, maxLife: 20 });
        spawnLivingStoneParticles(livingStonePlayer.x, livingStonePlayer.y, 1, "#ff4444", 2);
    } else if (qteCinematicPhase === "punch") {
        livingStonePlayer.x = livingStoneBoss.x - 55;
        livingStonePlayer.y = livingStoneBoss.y + 40;
    }
}

function updateMegaEffects() {
    for (var i = qteShockwaves.length - 1; i >= 0; i--) {
        var sw = qteShockwaves[i];
        sw.radius = sw.maxRadius * (1 - sw.life / sw.maxLife);
        sw.life--;
        if (sw.life <= 0) qteShockwaves.splice(i, 1);
    }
    for (var i = qteLightningBolts.length - 1; i >= 0; i--) { qteLightningBolts[i].life--; if (qteLightningBolts[i].life <= 0) qteLightningBolts.splice(i, 1); }
    for (var i = qteSlashMarks.length - 1; i >= 0; i--) { qteSlashMarks[i].life--; if (qteSlashMarks[i].life <= 0) qteSlashMarks.splice(i, 1); }
    for (var i = qteSparks.length - 1; i >= 0; i--) {
        var sp = qteSparks[i];
        sp.trail.push({ x: sp.x, y: sp.y, life: 10 });
        if (sp.trail.length > 5) sp.trail.shift();
        sp.x += sp.vx; sp.y += sp.vy; sp.vx *= 0.96; sp.vy *= 0.96; sp.life--;
        if (sp.life <= 0) qteSparks.splice(i, 1);
    }
    for (var i = qteFlashBursts.length - 1; i >= 0; i--) { qteFlashBursts[i].life--; if (qteFlashBursts[i].life <= 0) qteFlashBursts.splice(i, 1); }
    if (qteScreenDistort > 0) qteScreenDistort *= 0.9;
    if (qteScreenDistort < 0.5) qteScreenDistort = 0;
    if (qteBossShake > 0) qteBossShake *= 0.88;
    if (qteBossShake < 0.3) qteBossShake = 0;
}

// ========== РЕНДЕР ==========
function livingStoneRenderLoop() {
    if (!livingStoneActive) return;
    if (typeof ctx === 'undefined' || !ctx) return;
    if (typeof canvas === 'undefined' || !canvas) return;
    
    updateLivingStonePlayer();
    updateLivingStoneBoss();
    if (qteCinematicActive) updateCinematic();
    updateMegaEffects();
    updateChainExplosions();
    if (finalSceneActive) updateFinalScene();
    
    if (!finalSceneActive && (livingStoneState === "phase1" || livingStoneState === "phase2")) {
        updateLSModCapsules();
    }
    updateLSActiveMod();

    if (!finalSceneActive && (livingStoneState === "phase1" || livingStoneState === "phase2")) {
        livingStoneShootTimer++;
        var shootRate = Math.max(2, Math.floor(6 / lsSpeedMult));
        if (lsActiveMod && lsActiveMod.type === 2) shootRate = Math.max(1, Math.floor(shootRate / 2));
        
        // ★ ЕСЛИ ОРУЖИЕ НАДЕТО — берём rate от него ★
        if (typeof window.firePlayerWeapon === 'function' && !lsActiveMod) {
            let eqData = window.getEquippedWeapon && window.getEquippedWeapon();
            if (eqData && eqData.shootRate) {
                shootRate = eqData.shootRate;
            }
        }
        
        if (livingStoneShootTimer >= shootRate) { livingStoneShootTimer = 0; livingStoneShoot(); }
        livingStoneAttackTimer++;
        var attackRate = Math.floor(((livingStoneState === "phase2") ? 30 : 45) / lsSpeedMult);
        if (livingStoneAttackTimer >= attackRate) { livingStoneAttackTimer = 0; livingStoneSpawnAttack(); }
        livingStoneTypeTimer--;
        if (livingStoneTypeTimer <= 0) {
            if (livingStoneState === "phase2") {
                var allowedP2 = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                livingStoneAttackType = allowedP2[Math.floor(Math.random() * allowedP2.length)];
                livingStoneTypeTimer = Math.floor((200 + Math.random() * 200) / lsSpeedMult);
            } else {
                livingStoneAttackType = Math.floor(Math.random() * 10);
                livingStoneTypeTimer = Math.floor((250 + Math.random() * 250) / lsSpeedMult);
            }
            var typeNames = ["КАМНЕПАД", "КОЛЬЦО", "ОБЛОМКИ", "ГОМИНГ", "ЛАЗЕР", "ВЕЕР", "ДОЖДЬ КАМНЕЙ", "СПИРАЛЬ", "ЧЁРНАЯ ДЫРА", "НЕБЕСНЫЙ ЛИВЕНЬ", "РАЗЛОМ", "СТЕНА", "МЕГА-ЛАЗЕР"];
            spawnLivingStoneText(200, 60, typeNames[livingStoneAttackType], "#888888", 60);
        }
    }
    
    updateLivingStoneBullets();
    updateLivingStoneAttacks();
    if (!finalSceneActive) checkLivingStoneCollisions();
    updateQTEBullets();
    
    for (var i = qtePunches.length - 1; i >= 0; i--) { qtePunches[i].life--; if (qtePunches[i].life <= 0) qtePunches.splice(i, 1); }
    for (var i = livingStoneParticles.length - 1; i >= 0; i--) {
        var p = livingStoneParticles[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life--;
        if (p.life <= 0) livingStoneParticles.splice(i, 1);
    }
    for (var i = livingStoneTexts.length - 1; i >= 0; i--) {
        var t = livingStoneTexts[i];
        t.y += t.vy; t.life--;
        if (t.life <= 0) livingStoneTexts.splice(i, 1);
    }
    for (var i = qteCinematicTexts.length - 1; i >= 0; i--) {
        var t = qteCinematicTexts[i];
        t.y += t.vy; t.life--;
        if (t.life <= 0) qteCinematicTexts.splice(i, 1);
    }
    for (var i = qtePlayerTrail.length - 1; i >= 0; i--) { qtePlayerTrail[i].life--; if (qtePlayerTrail[i].life <= 0) qtePlayerTrail.splice(i, 1); }
    for (var i = 0; i < livingStoneBgParticles.length; i++) {
        var bp = livingStoneBgParticles[i];
        bp.y += bp.speed * lsSpeedMult;
        if (bp.y > 500) { bp.y = 0; bp.x = Math.random() * 400; }
    }
    
    if (livingStoneInvulnTimer > 0) livingStoneInvulnTimer--;
    if (livingStoneBossFlash > 0) livingStoneBossFlash--;
    if (livingStoneScreenFlash > 0) livingStoneScreenFlash--;
    if (qteCinematicShake > 0) qteCinematicShake *= 0.9;
    if (qtePunchImpact) { qtePunchImpact.life--; if (qtePunchImpact.life <= 0) qtePunchImpact = null; }
    
    var shakeTotal = livingStoneShake + qteCinematicShake;
    var sx = 0, sy = 0;
    if (shakeTotal > 0.5) {
        sx = (Math.random() - 0.5) * shakeTotal;
        sy = (Math.random() - 0.5) * shakeTotal;
        if (livingStoneShake > 0) { livingStoneShake *= 0.88; if (livingStoneShake < 0.5) livingStoneShake = 0; }
    }
    
    ctx.save();
    ctx.translate(sx, sy);
    if (qteScreenDistort > 0.5) {
        ctx.translate((Math.random() - 0.5) * qteScreenDistort, (Math.random() - 0.5) * qteScreenDistort);
        ctx.scale(1 + qteScreenDistort / 600, 1 + qteScreenDistort / 600);
    }
    ctx.clearRect(-30, -30, 460, 560);
    
    var isQTE = (livingStoneState === "qte_intro" || livingStoneState === "qte_cinematic" || 
                 livingStoneState === "qte_punch" || livingStoneState === "qte_finish");
    var bgGrad = ctx.createLinearGradient(0, 0, 0, 500);
    if (isQTE || finalSceneActive) {
        bgGrad.addColorStop(0, "#1a0505");
        bgGrad.addColorStop(0.5, "#0f0202");
        bgGrad.addColorStop(1, "#000000");
    } else {
        bgGrad.addColorStop(0, "#2a1f15");
        bgGrad.addColorStop(0.5, "#1a1208");
        bgGrad.addColorStop(1, "#0a0805");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 500);
    
    for (var i = 0; i < livingStoneBgParticles.length; i++) {
        var bp = livingStoneBgParticles[i];
        ctx.globalAlpha = bp.alpha;
        ctx.fillStyle = bp.type === "rock" ? "#5a4030" : "#a08060";
        ctx.fillRect(bp.x, bp.y, bp.size * (bp.type === "rock" ? 2 : 1), bp.size * (bp.type === "rock" ? 2 : 1));
    }
    ctx.globalAlpha = 1;
    
    if (livingStoneScreenFlash > 0) {
        ctx.globalAlpha = livingStoneScreenFlash / 30;
        ctx.fillStyle = livingStoneScreenFlashColor;
        ctx.fillRect(0, 0, 400, 500);
        ctx.globalAlpha = 1;
    }
    
    var borderColor = "#8B7355";
    if (livingStoneState === "phase2") borderColor = "#ff4400";
    if (isQTE) borderColor = "#ff0000";
    if (finalSceneActive) borderColor = "#ff0000";
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 15;
    ctx.strokeRect(2, 2, 396, 496);
    ctx.shadowBlur = 0;
    
    for (var i = 0; i < lsModCapsules.length; i++) {
        var c = lsModCapsules[i];
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(Math.sin(c.wobble) * 0.15);
        
        var glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, c.size * 2);
        glowGrad.addColorStop(0, c.mod.color + "cc");
        glowGrad.addColorStop(0.5, c.mod.color + "66");
        glowGrad.addColorStop(1, c.mod.color + "00");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, c.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = c.mod.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = c.mod.color;
        ctx.beginPath();
        for (var k = 0; k < 6; k++) {
            var ang = (k / 6) * Math.PI * 2 - Math.PI / 2;
            var px = Math.cos(ang) * c.size;
            var py = Math.sin(ang) * c.size;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.arc(0, 0, c.size * 0.65, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold " + (c.size * 1.1) + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 8;
        ctx.fillText(c.mod.icon, 0, 2);
        
        ctx.restore();
    }
    
    if (finalSceneActive && finalBlackHole && finalScenePhase !== "laugh" && finalScenePhase !== "done") {
        ctx.save();
        var bh = finalBlackHole;
        var g = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.radius * 2);
        g.addColorStop(0, "rgba(120, 0, 200, 0.7)");
        g.addColorStop(0.5, "rgba(60, 0, 100, 0.4)");
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bh.x, bh.y, bh.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(180, 100, 255, 0.6)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#aa44ff";
        ctx.shadowBlur = 25;
        for (var k = 0; k < 12; k++) {
            var ang = k / 12 * Math.PI * 2 + finalSceneTimer / 30;
            ctx.beginPath();
            ctx.moveTo(bh.x + Math.cos(ang) * bh.radius * 0.4, bh.y + Math.sin(ang) * bh.radius * 0.4);
            ctx.lineTo(bh.x + Math.cos(ang) * bh.radius * 1.3, bh.y + Math.sin(ang) * bh.radius * 1.3);
            ctx.stroke();
        }
        var core = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.radius);
        core.addColorStop(0, "#000000");
        core.addColorStop(0.7, "#1a0030");
        core.addColorStop(1, "#6600aa");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(bh.x, bh.y, bh.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#cc66ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#cc66ff";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(bh.x, bh.y, bh.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    for (var i = 0; i < livingStoneAttacks.length; i++) {
        var a = livingStoneAttacks[i];

        if (a.type === "reflected") {
            ctx.save();
            var size = a.size || a.radius || 10;
            var rg = ctx.createRadialGradient(a.x, a.y, 1, a.x, a.y, size * 2.5);
            rg.addColorStop(0, "rgba(200, 240, 255, 0.9)");
            rg.addColorStop(0.4, "rgba(0, 170, 255, 0.7)");
            rg.addColorStop(1, "rgba(0, 100, 200, 0)");
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.arc(a.x, a.y, size * 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = "#00d4ff";
            ctx.shadowBlur = 25;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(a.x, a.y, size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            var rot = performance.now() / 100;
            ctx.strokeStyle = "#00d4ff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (var k = 0; k < 3; k++) {
                var an1 = rot + (k / 3) * Math.PI * 2;
                var an2 = an1 + Math.PI * 0.6;
                ctx.arc(a.x, a.y, size * 1.2, an1, an2);
            }
            ctx.stroke();
            ctx.restore();
            continue;
        }

        if (a.type === "rock") {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation);
            ctx.shadowColor = "#000000";
            ctx.shadowBlur = 8;
            ctx.fillStyle = "#8B7355";
            ctx.beginPath();
            ctx.moveTo(-a.size, -a.size * 0.5);
            ctx.lineTo(a.size * 0.7, -a.size);
            ctx.lineTo(a.size, a.size * 0.3);
            ctx.lineTo(0, a.size);
            ctx.lineTo(-a.size * 0.8, a.size * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#5a4030";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else if (a.type === "falling_star") {
            ctx.save();
            for (var k = 0; k < a.trail.length; k++) {
                var tr = a.trail[k];
                var ta = (1 - k / a.trail.length) * 0.7;
                ctx.globalAlpha = ta;
                ctx.fillStyle = a.color;
                ctx.shadowColor = a.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, a.size * (1 - k / a.trail.length) * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation);
            ctx.shadowColor = a.color;
            ctx.shadowBlur = 20;
            ctx.fillStyle = a.color;
            ctx.beginPath();
            for (var p = 0; p < 5; p++) {
                var an1 = (p / 5) * Math.PI * 2 - Math.PI / 2;
                var an2 = an1 + Math.PI / 5;
                var x1 = Math.cos(an1) * a.size, y1 = Math.sin(an1) * a.size;
                var x2 = Math.cos(an2) * a.size * 0.45, y2 = Math.sin(an2) * a.size * 0.45;
                if (p === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(0, 0, a.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (a.type === "ring") {
            ctx.save();
            ctx.strokeStyle = a.color || "#8B7355";
            ctx.lineWidth = a.thickness;
            ctx.globalAlpha = Math.max(0, 1 - a.radius / a.maxRadius);
            ctx.shadowColor = a.color || "#8B7355";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else if (a.type === "orb") {
            ctx.save();
            ctx.shadowColor = a.color || "#000000";
            ctx.shadowBlur = 12;
            ctx.fillStyle = a.color || "#a08060";
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#5a4030";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else if (a.type === "homing") {
            ctx.save();
            ctx.shadowColor = "#ff4400";
            ctx.shadowBlur = 15;
            ctx.fillStyle = a.color || "#8B7355";
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ff6600";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else if (a.type === "gravity_well") {
            ctx.save();
            var ps = 1 + Math.sin(a.pulse) * 0.1;
            var r = a.radius * ps;
            var g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r * 2);
            g.addColorStop(0, "rgba(80, 20, 120, 0.9)");
            g.addColorStop(0.3, "rgba(150, 50, 200, 0.6)");
            g.addColorStop(0.6, "rgba(80, 20, 120, 0.3)");
            g.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(a.x, a.y, r * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = "#aa44ff";
            ctx.shadowBlur = 25;
            for (var k = 0; k < 6; k++) {
                var an = a.pulse * 0.5 + (k / 6) * Math.PI * 2;
                ctx.strokeStyle = "rgba(180, 100, 255, " + (0.4 + Math.sin(a.pulse * 2 + k) * 0.3) + ")";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(a.x + Math.cos(an) * r * 0.4, a.y + Math.sin(an) * r * 0.4);
                ctx.lineTo(a.x + Math.cos(an) * r * 1.3, a.y + Math.sin(an) * r * 1.3);
                ctx.stroke();
            }
            var cg = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r * 0.6);
            cg.addColorStop(0, "#000000");
            cg.addColorStop(0.5, "#1a0030");
            cg.addColorStop(1, "#6600aa");
            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.arc(a.x, a.y, r * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#cc66ff";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#cc66ff";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(a.x, a.y, r * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            for (var k = 0; k < 8; k++) {
                var an2 = -a.pulse * 0.8 + (k / 8) * Math.PI * 2;
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "#aa44ff";
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(a.x + Math.cos(an2) * r * 1.1, a.y + Math.sin(an2) * r * 1.1, 3 + Math.sin(a.pulse * 3 + k) * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        } else if (a.type === "gravity_stone") {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = "#aa44ff";
            ctx.shadowColor = "#aa44ff";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(a.x - a.vx * 1.5, a.y - a.vy * 1.5, a.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation);
            ctx.shadowColor = "#000000";
            ctx.shadowBlur = 8;
            ctx.fillStyle = "#8B7355";
            ctx.beginPath();
            ctx.moveTo(-a.size, -a.size * 0.5);
            ctx.lineTo(a.size * 0.7, -a.size);
            ctx.lineTo(a.size, a.size * 0.3);
            ctx.lineTo(0, a.size);
            ctx.lineTo(-a.size * 0.8, a.size * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#5a4030";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.strokeStyle = "#cc66ff";
            ctx.lineWidth = 1.5;
            ctx.shadowColor = "#cc66ff";
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();
        } else if (a.type === "spike") {
            if (a.warningTimer > 0) {
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.abs(Math.sin(a.warningTimer * 0.3)) * 0.4;
                ctx.fillStyle = "#ff4400";
                ctx.fillRect(a.x - 30, 500 - 5, 60, 5);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1;
                ctx.strokeRect(a.x - 30, 500 - 5, 60, 5);
                ctx.restore();
            } else if (a.height > 0) {
                ctx.save();
                ctx.fillStyle = a.color || "#5a4030";
                ctx.shadowColor = "#000000";
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(a.x - 30, 500);
                ctx.lineTo(a.x, 500 - a.height);
                ctx.lineTo(a.x + 30, 500);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = "#8B7355";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
        } else if (a.type === "laser_warning") {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.abs(Math.sin(a.timer * 0.3)) * 0.4;
            ctx.fillStyle = "#ff3333";
            ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.strokeRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.restore();
        } else if (a.type === "laser") {
            ctx.save();
            ctx.globalAlpha = Math.min(1, a.timer / 25 * lsSpeedMult);
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ff4400";
            ctx.shadowBlur = 30;
            ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.fillStyle = "#ff4400";
            ctx.fillRect(a.x - a.width / 3, 0, a.width * 2 / 3, 500);
            ctx.restore();
        }
    }
    
    for (var i = 0; i < livingStoneBullets.length; i++) {
        var b = livingStoneBullets[i];
        ctx.save();
        var bulletColor = "#ffffff";
        if (lsActiveMod && lsActiveMod.type === 1) bulletColor = "#ff8800";
        if (lsActiveMod && lsActiveMod.type === 2) bulletColor = "#00d4ff";
        if (lsActiveMod && lsActiveMod.type === 5) bulletColor = "#ffd700";
        ctx.shadowColor = bulletColor;
        ctx.shadowBlur = 12;
        var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.6, bulletColor);
        g.addColorStop(1, "rgba(255,255,136,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    if (!isQTE || livingStoneState === "qte_punch" || livingStoneState === "qte_finish" || 
        livingStoneState === "qte_cinematic" || livingStoneState === "qte_intro" || finalSceneActive) {
        drawLivingStoneBoss();
    }
    if (qteBossArm && qteCinematicPhase === "grabbed") drawBossArm();
    if (finalHeartVisible && (!isQTE || livingStoneState === "qte_punch" || livingStoneState === "qte_finish" || 
        livingStoneState === "qte_cinematic" || finalSceneActive)) {
        drawLivingStonePlayer();
    }
    
    if (lsActiveMod && lsActiveMod.type === 4 && (livingStoneState === "phase1" || livingStoneState === "phase2") && !finalSceneActive) {
        ctx.save();
        var shieldPulse = 1 + Math.sin(performance.now() / 150) * 0.15;
        var shieldX = livingStonePlayer.x;
        var shieldY = livingStonePlayer.y - 22;
        ctx.globalAlpha = 0.6 + Math.sin(performance.now() / 200) * 0.2;
        var sg = ctx.createRadialGradient(shieldX, shieldY, 2, shieldX, shieldY, 20 * shieldPulse);
        sg.addColorStop(0, "rgba(100, 200, 255, 0.9)");
        sg.addColorStop(0.5, "rgba(0, 150, 255, 0.6)");
        sg.addColorStop(1, "rgba(0, 100, 200, 0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(shieldX, shieldY, 20 * shieldPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#00d4ff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00d4ff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(shieldX, shieldY, 16, 0, Math.PI * 2);
        ctx.stroke();
        var rot = performance.now() / 500;
        for (var k = 0; k < 6; k++) {
            var an = rot + (k / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(shieldX + Math.cos(an) * 12, shieldY + Math.sin(an) * 12);
            ctx.lineTo(shieldX + Math.cos(an) * 18, shieldY + Math.sin(an) * 18);
            ctx.stroke();
        }
        ctx.restore();
    }

    for (var i = 0; i < qtePlayerTrail.length; i++) {
        var tr = qtePlayerTrail[i];
        ctx.save();
        ctx.globalAlpha = tr.life / tr.maxLife * 0.5;
        ctx.fillStyle = "#ff2222";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, 8 * (tr.life / tr.maxLife), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    for (var i = 0; i < qteShockwaves.length; i++) {
        var sw = qteShockwaves[i];
        var progress = 1 - sw.life / sw.maxLife;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.width * (1 - progress);
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    for (var i = 0; i < qteLightningBolts.length; i++) {
        var lb = qteLightningBolts[i];
        ctx.save();
        ctx.globalAlpha = lb.life / lb.maxLife;
        ctx.strokeStyle = lb.color;
        ctx.lineWidth = lb.width;
        ctx.shadowColor = lb.color;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        for (var k = 0; k < lb.points.length; k++) {
            if (k === 0) ctx.moveTo(lb.points[k].x, lb.points[k].y);
            else ctx.lineTo(lb.points[k].x, lb.points[k].y);
        }
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = lb.width * 0.4;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
    }
    for (var i = 0; i < qteSlashMarks.length; i++) {
        var sm = qteSlashMarks[i];
        ctx.save();
        ctx.globalAlpha = sm.life / sm.maxLife;
        ctx.translate(sm.x, sm.y);
        ctx.rotate(sm.angle);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = sm.width * (sm.life / sm.maxLife);
        ctx.shadowColor = "#ffdd00";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(-sm.length / 2, 0);
        ctx.lineTo(sm.length / 2, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -sm.length / 2);
        ctx.lineTo(0, sm.length / 2);
        ctx.stroke();
        ctx.restore();
    }
    for (var i = 0; i < qteSparks.length; i++) {
        var sp = qteSparks[i];
        for (var k = 0; k < sp.trail.length; k++) {
            var tr = sp.trail[k];
            ctx.save();
            ctx.globalAlpha = (1 - k / sp.trail.length) * (sp.life / sp.maxLife) * 0.6;
            ctx.fillStyle = sp.color;
            ctx.shadowColor = sp.color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, sp.size * (1 - k / sp.trail.length) * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = sp.life / sp.maxLife;
        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    for (var i = 0; i < qteFlashBursts.length; i++) {
        var fb = qteFlashBursts[i];
        ctx.save();
        ctx.globalAlpha = (fb.life / fb.maxLife) * 0.8;
        var r = fb.size * (1 - fb.life / fb.maxLife + 0.3);
        var g = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.5, "rgba(255,255,255,0.5)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    if (livingStoneState === "qte_punch") {
        for (var i = 0; i < qteBullets.length; i++) {
            var b = qteBullets[i];
            ctx.save();
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 15;
            var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2);
            g.addColorStop(0, "#ffffff");
            g.addColorStop(0.5, b.color);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    if (livingStoneState === "qte_punch" || livingStoneState === "qte_finish") {
        for (var i = 0; i < qtePunches.length; i++) {
            var p = qtePunches[i];
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#ffff00";
            ctx.shadowBlur = 20;
            for (var j = 0; j < 4; j++) {
                var an = (p.angle || 0) + j * Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + Math.cos(an) * p.size, p.y + Math.sin(an) * p.size);
                ctx.stroke();
            }
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5 * (p.life / p.maxLife), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    if (qtePunchImpact) {
        var impact = qtePunchImpact;
        var progress = 1 - impact.life / impact.maxLife;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        var r = impact.size * progress;
        var g = ctx.createRadialGradient(impact.x, impact.y, 0, impact.x, impact.y, r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.3, "#ffdd00");
        g.addColorStop(0.7, "#ff4400");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(impact.x, impact.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4 * (1 - progress);
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 20;
        var rays = lsMobileMode ? 6 : 12;
        for (var j = 0; j < rays; j++) {
            var an = (j / rays) * Math.PI * 2 + progress;
            ctx.beginPath();
            ctx.moveTo(impact.x, impact.y);
            ctx.lineTo(impact.x + Math.cos(an) * r, impact.y + Math.sin(an) * r);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    for (var i = 0; i < livingStoneParticles.length; i++) {
        var p = livingStoneParticles[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
    }
    for (var i = 0; i < livingStoneTexts.length; i++) {
        var t = livingStoneTexts[i];
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life / 30);
        ctx.font = "bold 18px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 10;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    }
    for (var i = 0; i < qteCinematicTexts.length; i++) {
        var t = qteCinematicTexts[i];
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life / 40);
        ctx.font = "bold " + t.size + "px Impact, Arial Black, sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 15;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    }
    
    if (lsTouchActive && (livingStoneState === "phase1" || livingStoneState === "phase2") && !finalSceneActive) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lsTouchX, lsTouchY, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(lsTouchX, lsTouchY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    if (livingStoneState === "qte_intro" || livingStoneState === "qte_punch" || livingStoneState === "qte_finish") {
        drawQTEOverlay();
    }
    if (!isQTE && !finalSceneActive) drawLivingStoneHpBars();
    drawLSActiveModUI();
    if (lsMobileMode) {
        ctx.save();
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("LITE", 395, 495);
        ctx.restore();
    }
    ctx.restore();
    livingStoneAnimFrame = requestAnimationFrame(livingStoneRenderLoop);
}

function drawLSActiveModUI() {
    if (!lsActiveMod) return;
    ctx.save();
    var w = 180, h = 44;
    var x = 200 - w / 2;
    var y = 458;
    var progress = lsActiveMod.timer / lsActiveMod.duration;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.strokeStyle = lsActiveMod.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = lsActiveMod.color;
    ctx.shadowBlur = 12;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = lsActiveMod.color + "44";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = lsActiveMod.color + "aa";
    ctx.fillRect(x, y, w * progress, h);
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(lsActiveMod.icon, x + 8, y + h / 2);
    ctx.font = "bold 14px monospace";
    ctx.fillText(lsActiveMod.name, x + 38, y + h / 2 - 5);
    var secLeft = (lsActiveMod.timer / 60).toFixed(1);
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = lsActiveMod.color;
    ctx.fillText(secLeft + "с", x + 38, y + h / 2 + 10);
    ctx.restore();
}

function drawBossArm() {
    if (!qteBossArm) return;
    var arm = qteBossArm;
    var p = arm.progress;
    var ep = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    var cx = arm.startX + (arm.endX - arm.startX) * ep;
    var cy = arm.startY + (arm.endY - arm.startY) * ep;
    ctx.save();
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#8B7355";
    ctx.strokeStyle = "#3a2818";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#a08060";
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a4030";
    ctx.lineWidth = 3;
    for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 20 + i * 15, cy - 20);
        ctx.lineTo(cx - 20 + i * 15, cy + 20);
        ctx.stroke();
    }
    ctx.restore();
}

function drawLivingStoneBoss() {
    var b = livingStoneBoss;
    var pulse = 1.0 + Math.sin(performance.now() / 300) * 0.05;
    var size = b.size * pulse;
    var isPhase2 = (livingStoneState === "phase2");
    var isQTEPunch = (livingStoneState === "qte_punch");
    var isFinal = finalSceneActive;
    
    var bossShakeX = 0, bossShakeY = 0;
    if (qteBossShake > 0.5) {
        bossShakeX = (Math.random() - 0.5) * qteBossShake;
        bossShakeY = (Math.random() - 0.5) * qteBossShake;
    }
    if (isFinal && finalScenePhase === "laugh") {
        bossShakeY += finalLaughOffset;
    }
    
    var damage = isQTEPunch ? qteBossDamageLevel : 0;
    
    ctx.save();
    ctx.translate(b.x + bossShakeX, b.y + bossShakeY);
    ctx.rotate(Math.sin(b.rotation) * 0.05);
    
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.35, 0, Math.PI * 2);
    ctx.fill();
    
    var grad = ctx.createRadialGradient(-size * 0.3, -size * 0.3, 1, 0, 0, size * 1.5);
    if (livingStoneBossFlash > 0) {
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#ff8800");
    } else if (isPhase2 || isFinal) {
        grad.addColorStop(0, "#c09070");
        grad.addColorStop(0.5, "#8B4a30");
        grad.addColorStop(1, "#3a1808");
    } else {
        grad.addColorStop(0, "#b89878");
        grad.addColorStop(0.5, "#8B7355");
        grad.addColorStop(1, "#4a3828");
    }
    ctx.fillStyle = grad;
    
    var sides = 8;
    ctx.beginPath();
    for (var i = 0; i < sides; i++) {
        var ang = (i / sides) * Math.PI * 2;
        var rad = size * (0.9 + Math.sin(i * 1.7) * 0.15);
        var px = Math.cos(ang) * rad;
        var py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.save();
    ctx.clip();
    
    var texPoints = (isPhase2 || isFinal) ? stoneTexturePhase2 : stoneTexturePoints;
    for (var i = 0; i < texPoints.length; i++) {
        var tp = texPoints[i];
        if (tp.type === "spot" || tp.type === "grain" || tp.type === "burn" || tp.type === "glow") {
            var x = Math.cos(tp.angle) * size * tp.dist;
            var y = Math.sin(tp.angle) * size * tp.dist;
            if (tp.type === "burn") ctx.fillStyle = "rgba(20, 8, 3, " + tp.alpha + ")";
            else if (tp.type === "glow") ctx.fillStyle = "rgba(255, 100, 20, " + tp.alpha + ")";
            else ctx.fillStyle = "rgba(60, 40, 25, " + tp.alpha + ")";
            ctx.beginPath();
            ctx.arc(x, y, tp.size * (size / 40), 0, Math.PI * 2);
            ctx.fill();
        } else if (tp.type === "vein" || tp.type === "crack") {
            ctx.strokeStyle = (tp.type === "crack") ? "rgba(20, 8, 3, " + tp.alpha + ")" : "rgba(60, 40, 25, " + tp.alpha + ")";
            ctx.lineWidth = tp.w;
            ctx.beginPath();
            ctx.moveTo(Math.cos(tp.a1) * size * tp.r1, Math.sin(tp.a1) * size * tp.r1);
            ctx.lineTo(Math.cos(tp.a2) * size * tp.r2, Math.sin(tp.a2) * size * tp.r2);
            ctx.lineTo(Math.cos(tp.a3) * size * tp.r3, Math.sin(tp.a3) * size * tp.r3);
            ctx.stroke();
        }
    }
    
    ctx.restore();
    
    ctx.strokeStyle = "#2a1810";
    ctx.lineWidth = 4;
    ctx.stroke();
    
    if ((isPhase2 || isFinal) && finalCracksLevel > 0) {
        ctx.strokeStyle = "#1a0808";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff2200";
        ctx.shadowBlur = 8;
        var crackCount = 8 + Math.floor(finalCracksLevel * 8);
        for (var i = 0; i < crackCount; i++) {
            var a1 = (i / crackCount) * Math.PI * 2 + 0.3;
            var a2 = a1 + 0.8 + Math.random() * 0.4;
            var a3 = a2 + 0.6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a1) * size * 0.15, Math.sin(a1) * size * 0.15);
            var mx = Math.cos(a2) * size * 0.5, my = Math.sin(a2) * size * 0.5;
            ctx.lineTo(mx, my);
            ctx.lineTo(Math.cos(a3) * size * 0.85, Math.sin(a3) * size * 0.85);
            ctx.stroke();
            if (i % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(mx + Math.cos(a2 + 1) * size * 0.2, my + Math.sin(a2 + 1) * size * 0.2);
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;
    }
    
    if (isQTEPunch && damage > 0) {
        var dCracks = Math.floor(damage * 12);
        ctx.strokeStyle = "rgba(255, 100, 0, " + (0.6 + damage * 0.4) + ")";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff4400";
        ctx.shadowBlur = 10;
        for (var i = 0; i < dCracks; i++) {
            var a3 = (i / dCracks) * Math.PI * 2 + performance.now() / 1000;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a3) * size * 0.2, Math.sin(a3) * size * 0.2);
            for (var k = 1; k <= 4; k++) {
                var t = k / 4;
                var r = size * (0.2 + t * 0.7);
                ctx.lineTo(Math.cos(a3 + (Math.random() - 0.5) * 0.3) * r, Math.sin(a3 + (Math.random() - 0.5) * 0.3) * r);
            }
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }
    
    var eyeColor = (isPhase2 || isFinal) ? "#ff0000" : "#ffaa00";
    if (isQTEPunch) eyeColor = "#ff0000";
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = (isPhase2 || isFinal) ? 25 : 15;
    var eyeOX = size * 0.3, eyeOY = -size * 0.15, eyeS = size * 0.12;
    if (isQTEPunch && damage > 0.5) eyeS *= (1 - (damage - 0.5) * 0.5);
    ctx.beginPath();
    ctx.arc(-eyeOX, eyeOY, eyeS, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeOX, eyeOY, eyeS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.shadowBlur = 0;
    var pupOff = (isQTEPunch ? damage : 0) * size * 0.08;
    ctx.beginPath();
    ctx.arc(-eyeOX + pupOff, eyeOY, eyeS * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeOX + pupOff, eyeOY, eyeS * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    if (isPhase2 || isFinal) {
        ctx.strokeStyle = "#1a0808";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 18;
        var bSq = 1 + (isQTEPunch ? damage * 0.3 : 0);
        var bY = eyeOY - size * 0.4;
        ctx.beginPath();
        ctx.moveTo(-size * 0.55 * bSq, bY - size * 0.08);
        ctx.lineTo(-size * 0.1 * bSq, bY + size * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(size * 0.55 * bSq, bY - size * 0.08);
        ctx.lineTo(size * 0.1 * bSq, bY + size * 0.12);
        ctx.stroke();
        ctx.lineCap = "butt";
        ctx.shadowBlur = 0;
    }
    
    if (isFinal && finalScenePhase === "laugh") {
        ctx.fillStyle = "#1a0808";
        ctx.beginPath();
        var laughW = size * 0.6 * (1 + Math.abs(Math.sin(finalSceneTimer / 8)) * 0.15);
        var laughH = size * 0.33 * (1 + Math.abs(Math.sin(finalSceneTimer / 8)) * 0.2);
        ctx.ellipse(0, size * 0.3, laughW, laughH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        for (var i = 0; i < 5; i++) {
            var tx = -laughW + (i + 0.5) * (laughW * 2 / 5);
            ctx.fillRect(tx - 2, size * 0.3 - laughH + 2, 4, 5);
        }
    }
    
    ctx.restore();
}

function drawLivingStonePlayer() {
    var p = livingStonePlayer;
    if (livingStoneInvulnTimer > 0 && Math.floor(livingStoneInvulnTimer / 4) % 2 === 0) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (qtePlayerAngry && qteCinematicPhase === "angry") {
        var pa = 1.0 + Math.sin(performance.now() / 80) * 0.3;
        var ag = ctx.createRadialGradient(0, 0, 5, 0, 0, 40 * pa);
        ag.addColorStop(0, "rgba(255,50,50,0.8)");
        ag.addColorStop(0.5, "rgba(255,0,0,0.4)");
        ag.addColorStop(1, "rgba(255,0,0,0)");
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(0, 0, 40 * pa, 0, Math.PI * 2);
        ctx.fill();
        for (var i = 0; i < 4; i++) {
            var ang = Math.random() * Math.PI * 2;
            ctx.strokeStyle = "#ff2222";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            var lx = 0, ly = 0;
            for (var k = 0; k < 4; k++) {
                ang += (Math.random() - 0.5) * 1.5;
                lx += Math.cos(ang) * 8;
                ly += Math.sin(ang) * 8;
                ctx.lineTo(lx, ly);
            }
            ctx.stroke();
        }
    }
    var finalScale = 1;
    if (finalSceneActive && finalScenePhase === "pull_heart") {
        finalScale = Math.max(0.2, 1 - finalSceneTimer / 240);
    }
    ctx.scale(finalScale, finalScale);
    var gg = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    gg.addColorStop(0, "rgba(255,100,100,0.6)");
    gg.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff2222";
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 10;
    var hs = 11;
    ctx.beginPath();
    ctx.moveTo(0, hs * 0.7);
    ctx.bezierCurveTo(-hs * 1.3, -hs * 0.2, -hs * 0.7, -hs, 0, -hs * 0.3);
    ctx.bezierCurveTo(hs * 0.7, -hs, hs * 1.3, -hs * 0.2, 0, hs * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawLivingStoneHpBars() {
    var barW = 360, barH = 14, x = 20, y = 8;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 4, y - 4, barW + 8, barH + 8);
    ctx.fillStyle = "#2a1a00";
    ctx.fillRect(x, y, barW, barH);
    var ratio = Math.max(0, livingStoneBossHp / livingStoneBossMaxHp);
    var hpW = barW * ratio;
    var hg = ctx.createLinearGradient(x, y, x, y + barH);
    if (livingStoneState === "phase2") {
        hg.addColorStop(0, "#ff8800");
        hg.addColorStop(1, "#cc2200");
    } else {
        hg.addColorStop(0, "#a08060");
        hg.addColorStop(1, "#5a4030");
    }
    ctx.fillStyle = hg;
    ctx.shadowColor = livingStoneState === "phase2" ? "#ff4400" : "#8B7355";
    ctx.shadowBlur = 10;
    ctx.fillRect(x, y, hpW, barH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barW, barH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 3;
    ctx.fillText(livingStoneBossHp + " / " + livingStoneBossMaxHp, x + barW / 2, y + barH - 3);
    ctx.restore();
    var y2 = 480;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 4, y2 - 4, barW + 8, 20);
    ctx.fillStyle = "#2a0000";
    ctx.fillRect(x, y2, barW, 12);
    var r2 = Math.max(0, livingStonePlayerHp / livingStonePlayerMaxHp);
    ctx.fillStyle = r2 > 0.3 ? "#00ff66" : "#ff3333";
    ctx.shadowColor = r2 > 0.3 ? "#00ff66" : "#ff3333";
    ctx.shadowBlur = 8;
    ctx.fillRect(x, y2, barW * r2, 12);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y2, barW, 12);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 3;
    ctx.fillText(livingStonePlayerHp + " / " + livingStonePlayerMaxHp, x + barW / 2, y2 + 10);
    ctx.restore();
}

function drawQTEOverlay() {
    ctx.save();
    ctx.font = "bold 28px Impact, Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 20;
    var tm = performance.now() / 1000;
    var sc = 1.0 + Math.sin(tm * 4) * 0.05;
    ctx.translate(200, 80);
    ctx.scale(sc, sc);
    ctx.strokeText("STANDING HERE", 0, 0);
    ctx.fillText("STANDING HERE", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.font = "bold 24px Impact, Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 15;
    ctx.fillText("I REALIZE", 200, 115);
    ctx.restore();
    if (livingStoneState === "qte_intro") {
        ctx.save();
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffdd00";
        ctx.shadowColor = "#ffdd00";
        ctx.shadowBlur = 15;
        var bl = Math.floor(performance.now() / 300) % 2 === 0;
        if (bl) ctx.fillText("ПРИГОТОВЬСЯ...", 200, 460);
        ctx.restore();
    } else if (livingStoneState === "qte_punch") {
        var bW = 300, bH = 20, bX = 50, bY = 430;
        var pr = Math.min(1, qteClicks / qteClickTarget);
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(bX - 4, bY - 4, bW + 8, bH + 8);
        ctx.fillStyle = "#1a0000";
        ctx.fillRect(bX, bY, bW, bH);
        var g = ctx.createLinearGradient(bX, 0, bX + bW, 0);
        g.addColorStop(0, "#ff0000");
        g.addColorStop(0.5, "#ff4400");
        g.addColorStop(1, "#ffdd00");
        ctx.fillStyle = g;
        ctx.shadowColor = "#ff4400";
        ctx.shadowBlur = 15;
        ctx.fillRect(bX, bY, bW * pr, bH);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(bX, bY, bW, bH);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 3;
        ctx.fillText(qteClicks + " / " + qteClickTarget, bX + bW / 2, bY + bH / 2 + 5);
        ctx.restore();
        ctx.save();
        ctx.font = "bold 22px Impact, Arial Black, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 20;
        var bl2 = Math.floor(performance.now() / 150) % 2 === 0;
        if (bl2) ctx.fillText("НАЖИМАЙ!", 200, 470);
        ctx.restore();
    } else if (livingStoneState === "qte_finish") {
        ctx.save();
        ctx.font = "bold 24px Impact, Arial Black, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#888888";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 10;
        ctx.fillText("БЕСПОЛЕЗНО...", 200, 440);
        ctx.restore();
    }
}

// ========== ЭКСПОРТ ==========
window.startLivingStoneFight = startLivingStoneFight;
window.stopLivingStoneFight = stopLivingStoneFight;
window.preloadQTEMusic = preloadQTEMusic;

// ★★★ ЭКСПОРТ ДЛЯ EQUIPMENT_COMBAT ★★★
window.getLSPlayer = function() { return livingStonePlayer; };
window.getLSPlayerHp = function() { return livingStonePlayerHp; };
window.getLSBossHp = function() { return livingStoneBossHp; };
window.getLSActive = function() { return livingStoneActive; };
window.getLSState = function() { return livingStoneState; };
window.applyArenaDamageLS = applyArenaDamage;

console.log("[LIVING STONE] v6.4 — оружие работает + LITE MODE + EXPORT");
