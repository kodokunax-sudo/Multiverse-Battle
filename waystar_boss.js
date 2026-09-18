// ============================================================
// ПУТЕВОДНАЯ ЗВЕЗДА — БОСС 500 ВОЛНЫ v4.0 (EPIC OVERHAUL)
// + Ускоренные атаки, баланс колец, пропуск диалогов кликом,
// + Многослойные текстуры, режим смешивания (Lighter), новые спецэффекты
// ============================================================

let waystarActive = false;
let waystarState = "dialogue";
let waystarBoss = { x: 200, y: 100, size: 55, vx: 1.5, rotation: 0, pulse: 0, time: 0 };
let waystarPlayer = { x: 200, y: 430 };
let waystarBossHp = 0;
let waystarBossMaxHp = 0;
let waystarPlayerHp = 200;
let waystarPlayerMaxHp = 200;
let waystarAttacks = [];
let waystarPlayerBullets = [];
let waystarParticles = [];
let waystarTexts = [];
let waystarAttackTimer = 0;
let waystarAttackType = 0;
let waystarTypeTimer = 250; // Быстрее смена фаз атак
let waystarInvulnTimer = 0;
let waystarShake = 0;
let waystarScreenFlash = 0;
let waystarScreenFlashColor = "#ffffff";
let waystarBossFlash = 0;
let waystarAnimFrame = null;
let waystarBgStars = [];
let waystarSpeedMult = 1.3; // Глобальное ускорение боя
let waystarKeys = {};
let waystarTouchActive = false, waystarTouchId = null, waystarTouchX = 0, waystarTouchY = 0;

// ★ СТРЕЛЬБА СЕРДЕЧКА ★
let waystarShootCooldown = 0;
let waystarShootInterval = 6; // Быстрее стрельба игрока

// ★ ЭПИЧНЫЕ ЭФФЕКТЫ ★
let waystarShockwaves = [];
let waystarLightningBolts = [];
let waystarSlashMarks = [];
let waystarFlashBursts = [];
let waystarScreenDistort = 0;
let waystarVignette = 0;
let waystarNebulas = []; // Космические туманности на фоне

// ★ ДИАЛОГ ★
let waystarDialogActive = false;
let waystarDialogStep = 0;
let waystarDialogQueue = [];
let waystarChoiceActive = false;
let waystarChoiceResolved = false;
let waystarDialogAutoTimer = 0;

// ★ SPACE INVADERS ★
let waystarPieces = [];
let waystarEnemyBullets = [];
let waystarInvaderDir = 1;
let waystarInvaderSpeed = 1.3; // Быстрее захватчики
let waystarInvaderShootTimer = 0;
let waystarInvadersReachedBottom = false;
let waystarPiecesTotal = 30;
let waystarPiecesAlive = 30;

// ★ НАГРАДА ★
let waystarRewardGiven = false;

// ========== ЭПИЧНЫЕ ЭФФЕКТЫ ==========
function addWaystarShockwave(x, y, color, maxRadius, life, width) {
    if (width === undefined) width = 4;
    waystarShockwaves.push({ x: x, y: y, radius: 10, maxRadius: maxRadius, life: life, maxLife: life, color: color, width: width });
}

function addWaystarLightning(x1, y1, x2, y2, color, alpha, width) {
    if (width === undefined) width = 2;
    var pts = [];
    var steps = 5 + Math.floor(Math.random() * 4);
    for (var i = 1; i < steps; i++) {
        var t = i / steps;
        pts.push({
            x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30,
            y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30
        });
    }
    waystarLightningBolts.push({ x1: x1, y1: y1, x2: x2, y2: y2, pts: pts, color: color, alpha: alpha, life: 15, maxLife: 15, width: width });
}

function addWaystarSlash(x, y, angle, length, width) {
    waystarSlashMarks.push({ x: x, y: y, angle: angle, length: length, width: width || 4, life: 25, maxLife: 25 });
}

function addWaystarFlash(x, y, size) {
    waystarFlashBursts.push({ x: x, y: y, size: size || 40, life: 20, maxLife: 20 });
}

function updateWaystarMegaEffects() {
    for (var i = waystarShockwaves.length - 1; i >= 0; i--) {
        var sw = waystarShockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.15; // Более резкое расширение
        sw.life--;
        if (sw.life <= 0) waystarShockwaves.splice(i, 1);
    }
    for (var i = waystarLightningBolts.length - 1; i >= 0; i--) {
        waystarLightningBolts[i].life--;
        if (waystarLightningBolts[i].life <= 0) waystarLightningBolts.splice(i, 1);
    }
    for (var i = waystarSlashMarks.length - 1; i >= 0; i--) {
        waystarSlashMarks[i].life--;
        if (waystarSlashMarks[i].life <= 0) waystarSlashMarks.splice(i, 1);
    }
    for (var i = waystarFlashBursts.length - 1; i >= 0; i--) {
        waystarFlashBursts[i].life--;
        if (waystarFlashBursts[i].life <= 0) waystarFlashBursts.splice(i, 1);
    }
    if (waystarScreenDistort > 0) waystarScreenDistort *= 0.85;
    if (waystarScreenDistort < 0.5) waystarScreenDistort = 0;
    if (waystarVignette > 0) waystarVignette--;
    
    // Обновление туманностей
    for(var i=0; i<waystarNebulas.length; i++) {
        waystarNebulas[i].y += waystarNebulas[i].speed;
        waystarNebulas[i].angle += waystarNebulas[i].rotSpeed;
        if(waystarNebulas[i].y > 600) waystarNebulas[i].y = -100;
    }
}

// ========== МУЗЫКА И ЗВУКИ ==========
let waystarMusic = null;
function startWaystarMusic() {
    if (typeof stopAllMusic === 'function') stopAllMusic();
    if (!waystarMusic) {
        try {
            waystarMusic = new Audio("music/Звезда.mp3");
            waystarMusic.loop = true;
            waystarMusic.volume = 0.45;
            waystarMusic.onerror = function() { waystarMusic = null; };
        } catch(e) { waystarMusic = null; }
    }
    if (waystarMusic) {
        try { waystarMusic.currentTime = 0; waystarMusic.play().catch(function(){}); } catch(e) {}
    }
}
function stopWaystarMusic() {
    if (waystarMusic) {
        try { waystarMusic.pause(); waystarMusic.currentTime = 0; } catch(e) {}
    }
}
function wsPlaySound(freq, type, dur, vol) {
    if (typeof playArenaSound === 'function') playArenaSound(freq, type, dur, vol);
}

// ========== СТАРТ ==========
function startWaystarFight() {
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(500)) {
        if (typeof showFloatingText === 'function') showFloatingText("⏭️ Путеводная Звезда уже побеждена!", "#ffaa00");
        return;
    }
    waystarActive = true;
    waystarState = "dialogue";
    
    var playerDmg = (typeof window.playerFinalDamage !== 'undefined') ? window.playerFinalDamage : 100;
    waystarBossMaxHp = Math.max(12000, playerDmg * 55);
    waystarBossHp = waystarBossMaxHp;
    
    waystarBoss = { x: 200, y: 100, size: 55, vx: 1.5, rotation: 0, pulse: 0, time: 0 };
    waystarPlayer = { x: 200, y: 430 };
    waystarPlayerHp = 200;
    waystarPlayerMaxHp = 200;
    waystarInvulnTimer = 0;
    
    // Сброс массивов
    waystarAttacks = []; waystarPlayerBullets = []; waystarParticles = []; waystarTexts = [];
    waystarShockwaves = []; waystarLightningBolts = []; waystarSlashMarks = []; waystarFlashBursts = [];
    waystarAttackTimer = 0; waystarAttackType = 0; waystarTypeTimer = 250;
    waystarShake = 0; waystarScreenFlash = 0; waystarBossFlash = 0;
    waystarScreenDistort = 0; waystarVignette = 0;
    waystarPieces = []; waystarEnemyBullets = [];
    waystarShootCooldown = 0;
    
    initWaystarBgStars();
    startWaystarMusic();
    
    ['superBtn', 'superBtn2', 'superBtnDeactivate', 'startArenaBtn', 'skipBossBtn', 'spareBtn', 'startLivingStoneBtn', 'startWaystarBtn'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    
    var overlay = document.getElementById("arenaOverlay");
    if (overlay) overlay.style.display = "flex";
    var bossNameEl = document.getElementById("arenaBossName");
    if (bossNameEl) bossNameEl.innerText = "🌟 ПУТЕВОДНАЯ ЗВЕЗДА";
    var arenaHpEl = document.getElementById("arenaHP");
    if (arenaHpEl) arenaHpEl.innerText = waystarPlayerHp;
    var timerEl = document.getElementById("arenaTimer");
    if (timerEl) timerEl.innerText = "∞";
    
    if (typeof initArena === 'function') initArena();
    if (typeof canvas === 'undefined' || !canvas) return;
    if (typeof arenaActive !== 'undefined') arenaActive = false;
    if (typeof livingStoneActive !== 'undefined') livingStoneActive = false;
    
    canvas.addEventListener("click", handleWaystarClick);
    canvas.addEventListener("touchstart", handleWaystarTouchStart, {passive: false});
    canvas.addEventListener("touchmove", handleWaystarTouchMove, {passive: false});
    canvas.addEventListener("touchend", handleWaystarTouchEnd);
    canvas.addEventListener("touchcancel", handleWaystarTouchEnd);
    window.addEventListener("keydown", handleWaystarKeyDown);
    window.addEventListener("keyup", handleWaystarKeyUp);
    
    if (waystarAnimFrame) cancelAnimationFrame(waystarAnimFrame);
    waystarAnimFrame = requestAnimationFrame(waystarRenderLoop);
    
    wsPlaySound(300, 'sine', 1.5, 0.2);
    setTimeout(function() { wsPlaySound(400, 'sine', 1.0, 0.15); }, 300);
    
    startWaystarDialog();
}

function stopWaystarFight() {
    waystarActive = false;
    stopWaystarMusic();
    if (waystarAnimFrame) { cancelAnimationFrame(waystarAnimFrame); waystarAnimFrame = null; }
    if (typeof canvas !== 'undefined' && canvas) {
        canvas.removeEventListener("click", handleWaystarClick);
        canvas.removeEventListener("touchstart", handleWaystarTouchStart);
        canvas.removeEventListener("touchmove", handleWaystarTouchMove);
        canvas.removeEventListener("touchend", handleWaystarTouchEnd);
        canvas.removeEventListener("touchcancel", handleWaystarTouchEnd);
    }
    window.removeEventListener("keydown", handleWaystarKeyDown);
    window.removeEventListener("keyup", handleWaystarKeyUp);
    var overlay = document.getElementById("arenaOverlay");
    if (overlay) overlay.style.display = "none";
    if (typeof startBattleMusic === 'function') startBattleMusic();
}

function initWaystarBgStars() {
    waystarBgStars = [];
    waystarNebulas = [];
    for (var i = 0; i < 120; i++) {
        waystarBgStars.push({
            x: Math.random() * 400, y: Math.random() * 500,
            size: 0.5 + Math.random() * 2.2,
            speed: 0.1 + Math.random() * 0.4,
            alpha: 0.2 + Math.random() * 0.8,
            twinkle: Math.random() * Math.PI * 2
        });
    }
    // Эпичные туманности на фоне
    var colors = ["#4b0082", "#191970", "#800080", "#000080"];
    for(var j=0; j<5; j++) {
        waystarNebulas.push({
            x: Math.random() * 400, y: Math.random() * 500,
            radius: 100 + Math.random() * 150,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: 0.2 + Math.random() * 0.3,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.01
        });
    }
}

// ========== ДИАЛОГ (ПРОПУСК КЛИКОМ ДОБАВЛЕН) ==========
function startWaystarDialog() {
    waystarDialogActive = true;
    waystarDialogStep = 0;
    waystarChoiceActive = false;
    waystarChoiceResolved = false;
    waystarDialogAutoTimer = 0;
    waystarDialogQueue = [
        { speaker: "🌟 Путеводная Звезда", text: "СТОЙ, ПУТНИК..." },
        { speaker: "🌟 Путеводная Звезда", text: "Я — ПУТЕВОДНАЯ ЗВЕЗДА. Древнее существо, что освещает путь заблудшим в бескрайней тьме космоса." },
        { speaker: "🌟 Путеводная Звезда", text: "Ты проделал долгий путь. Пятьсот волн. Ты убивал. Ты собирал. Ты рос." },
        { speaker: "🌟 Путеводная Звезда", text: "Но ЗАЧЕМ? Что движет тобой? Что ты ищешь среди обломков мультивселенной?" },
        { speaker: "🌟 Путеводная Звезда", text: "Я чувствую... боль. Гнев. Что-то горит в твоей душе ярче любого солнца." },
        { speaker: "🌟 Путеводная Звезда", text: "Рик..." },
        { speaker: "🌟 Путеводная Звезда", text: "Он тот, кто всё испортил. Тот, кто разорвал ткань реальности на осколки." },
        { speaker: "🌟 Путеводная Звезда", text: "По твоим глазам видно, что ты жаждешь мести." },
        { speaker: "🌟 Путеводная Звезда", text: "Но кто это? Кому ты хочешь отомстить?", choice: true }
    ];
    for (var i = 0; i < waystarDialogQueue.length; i++) {
        waystarDialogQueue[i].time = 2 + waystarDialogQueue[i].text.length * 0.03;
    }
}

function getWaystarChoices() {
    return [
        { id: 1, text: "Тебя это не касается! Ты тут не причем.", response: "В любом случае битва неизбежна." },
        { id: 2, text: "Это значит Рик... Я отомщу ему...!", response: "Да. Но чтобы пройти, ты должен победить меня." },
        { id: 3, text: "Ебать, даже звезда разговаривает. Прямо как тот камень.", response: "Камень? Видимо он пропитался силой звёзд. Но я сильнее!" }
    ];
}

function selectWaystarChoice(choiceId) {
    if (waystarChoiceResolved) return;
    waystarChoiceResolved = true;
    waystarChoiceActive = false;
    var c = getWaystarChoices().find(function(x) { return x.id === choiceId; });
    var responses = [
        { speaker: "🌟 Путеводная Звезда", text: c.response },
        { speaker: "🌟 Путеводная Звезда", text: "Достаточно разговоров. Покажи мне свою силу!" },
        { speaker: "🌟 Путеводная Звезда", text: "МУЛЬТИВСЕЛЕННАЯ НЕ ПРОЩАЕТ СЛАБЫХ!" }
    ];
    for (var i = 0; i < responses.length; i++) {
        responses[i].time = 2 + responses[i].text.length * 0.04;
        waystarDialogQueue.push(responses[i]);
    }
    waystarDialogStep++;
    waystarDialogAutoTimer = 0;
    wsPlaySound(600, 'square', 0.3, 0.2);
}

function waystarProgressDialog() {
    waystarDialogStep++;
    waystarDialogAutoTimer = 0;
    wsPlaySound(800, 'triangle', 0.05, 0.1); // Звук пропуска
    if (waystarDialogStep >= waystarDialogQueue.length) {
        waystarDialogActive = false;
        if (waystarState === "split") {
            waystarTriggerPhase2();
        } else {
            waystarState = "phase1";
            waystarAttackTimer = 0;
        }
    }
}

// ========== АВТО-СТРЕЛЬБА СЕРДЕЧКА ==========
function updateWaystarShooting() {
    if (waystarState !== "phase1") return;
    if (waystarShootCooldown > 0) { waystarShootCooldown--; return; }
    waystarShootCooldown = waystarShootInterval;
    
    waystarPlayerBullets.push({
        x: waystarPlayer.x, y: waystarPlayer.y - 12,
        vy: -12, vx: 0, size: 5,
        damage: Math.max(1, Math.floor((window.playerFinalDamage || 100) / 4)), 
        life: 80, trail: []
    });
    addWaystarFlash(waystarPlayer.x, waystarPlayer.y - 12, 18);
    wsPlaySound(1100, 'square', 0.04, 0.06);
}

// ========== ЭПИЧНЫЕ АТАКИ ФАЗЫ 1 ==========
function waystarSpawnAttack() {
    var type = waystarAttackType;
    var s = waystarSpeedMult;
    var isSecond = waystarBossHp <= waystarBossMaxHp * 0.75;
    
    if (type === 0) {
        // 🌠 МЕТЕОРНЫЙ ДОЖДЬ (УСИЛЕНО)
        var count = isSecond ? 8 : 5;
        for (var i = 0; i < count; i++) {
            waystarAttacks.push({
                type: "meteor",
                x: 20 + Math.random() * 360, y: -40 - Math.random()*50,
                vx: (Math.random() - 0.5) * 2 * s,
                vy: (3.5 + Math.random() * 2.5) * s,
                size: 12 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3,
                damage: 12, life: 300, trail: []
            });
        }
        addWaystarShockwave(waystarBoss.x, waystarBoss.y, "#ff8800", 150, 20, 5);
        wsPlaySound(200, 'square', 0.3, 0.15);
        
    } else if (type === 1) {
        // 💫 МУЛЬТИ-КОЛЬЦО (ИСПРАВЛЕНО И СБАЛАНСИРОВАНО)
        var ringsCount = isSecond ? 3 : 2;
        var baseGap = Math.random() * Math.PI * 2;
        for(var r = 0; r < ringsCount; r++) {
            waystarAttacks.push({
                type: "ring",
                x: waystarBoss.x, y: waystarBoss.y,
                radius: 15 - r * 80, // Кольца идут друг за другом
                maxRadius: 450,
                growth: (2.2 + r*0.2) * s,
                thickness: 8,
                damage: 15,
                color: r % 2 === 0 ? "#ffd700" : "#ff4400",
                gapAngle: baseGap + (r * Math.PI/3), // Бреши смещены
                gapSize: Math.PI * 0.6 // 108 градусов - справедливо, но требует движения
            });
        }
        addWaystarShockwave(waystarBoss.x, waystarBoss.y, "#ffd700", 200, 25, 4);
        wsPlaySound(400, 'sine', 0.5, 0.15);
        
    } else if (type === 2) {
        // ⚡ ТРОЙНОЙ ЛАЗЕР
        var lasers = isSecond ? 3 : 2;
        for(var l=0; l<lasers; l++) {
            var laserX = 40 + (320 / lasers) * l + Math.random()*30;
            waystarAttacks.push({
                type: "laser_warning",
                x: laserX, y: 0, width: 30,
                timer: 45, damage: 18
            });
        }
        wsPlaySound(300, 'square', 0.3, 0.15);
        
    } else if (type === 3) {
        // 🌌 ВЗРЫВНОЕ СОЗВЕЗДИЕ
        var points = [];
        var count2 = isSecond ? 6 : 4;
        for (var i = 0; i < count2; i++) {
            points.push({ x: 40 + Math.random() * 320, y: 80 + Math.random() * 340 });
        }
        waystarAttacks.push({
            type: "constellation",
            points: points,
            timer: 150, warning: 50, damage: 20, hit: false
        });
        addWaystarShockwave(200, 250, "#00ffff", 200, 20, 3);
        wsPlaySound(500, 'sine', 0.4, 0.15);
        
    } else if (type === 4) {
        // 🔵 СВЕРХНОВАЯ (НОВАЯ АТАКА: СПИРАЛЬ)
        var bullets = isSecond ? 16 : 12;
        var angleOffset = Math.random() * Math.PI;
        for(var i=0; i<bullets; i++) {
            waystarAttacks.push({
                type: "supernova_bullet",
                x: waystarBoss.x, y: waystarBoss.y,
                vx: Math.cos(angleOffset + (i * Math.PI*2/bullets)) * 4 * s,
                vy: Math.sin(angleOffset + (i * Math.PI*2/bullets)) * 4 * s,
                size: 6, damage: 10, life: 300, trail: []
            });
        }
        addWaystarShockwave(waystarBoss.x, waystarBoss.y, "#ff00ff", 120, 15, 6);
        wsPlaySound(800, 'sawtooth', 0.2, 0.1);
    }
}

// ========== ПЕРЕХОД НА ФАЗУ 2 ==========
function waystarTriggerSplit() {
    waystarState = "split";
    
    waystarShake = 70; 
    waystarScreenFlash = 60; waystarScreenFlashColor = "#ffffff";
    waystarScreenDistort = 50;
    waystarVignette = 40;
    
    wsPlaySound(200, 'sawtooth', 1.5, 0.4);
    setTimeout(function() { wsPlaySound(100, 'sawtooth', 1.5, 0.4); }, 400);
    
    for (var i = 0; i < 6; i++) {
        setTimeout(function(idx) {
            addWaystarShockwave(waystarBoss.x, waystarBoss.y, ["#ffffff", "#ffd700", "#ff00ff", "#ff4400"][idx%4], 400, 35, 8);
        }, i * 120);
    }
    for (var i = 0; i < 20; i++) {
        var ang = (i / 20) * Math.PI * 2 + Math.random() * 0.2;
        addWaystarLightning(waystarBoss.x, waystarBoss.y, waystarBoss.x + Math.cos(ang) * 200, waystarBoss.y + Math.sin(ang) * 200, i % 2 === 0 ? "#ffffff" : "#ff00ff", 1.0, 4);
    }
    for (var i = 0; i < 200; i++) {
        spawnWaystarParticles(waystarBoss.x, waystarBoss.y, 1, ["#ffd700", "#ffffff", "#ff8800", "#ff00ff"][Math.floor(Math.random() * 4)], 18);
    }
    
    waystarDialogActive = true;
    waystarDialogStep = 0;
    waystarDialogAutoTimer = 0;
    waystarDialogQueue = [
        { speaker: "🌟 Путеводная Звезда", text: "Ты сильнее, чем я думала..." },
        { speaker: "🌟 Путеводная Звезда", text: "Но я — ЛЕГИОН! Я — ТЫСЯЧА СОЛНЦ!" },
        { speaker: "🌟 Путеводная Звезда", text: "ГОТОВЬСЯ К НАСТОЯЩЕЙ БИТВЕ!" }
    ];
    for (var i = 0; i < waystarDialogQueue.length; i++) {
        waystarDialogQueue[i].time = 2 + waystarDialogQueue[i].text.length * 0.04;
    }
}

function waystarTriggerPhase2() {
    waystarState = "phase2";
    waystarAttacks = []; waystarPlayerBullets = [];
    wsPlaySound(300, 'square', 0.5, 0.3);
    
    waystarPieces = [];
    var cols = 6, rows = 5;
    var startX = 60, startY = 60, gapX = 48, gapY = 42;
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            waystarPieces.push({
                x: startX + c * gapX, y: startY + r * gapY,
                size: 11, hp: 4, maxHp: 4, // Усиленные осколки
                alive: true, row: r, col: c,
                pulse: Math.random() * Math.PI * 2, trail: []
            });
        }
    }
    waystarPiecesTotal = waystarPieces.length;
    waystarPiecesAlive = waystarPieces.length;
    waystarInvaderDir = 1;
    waystarEnemyBullets = [];
    waystarPlayer = { x: 200, y: 450 };
    waystarShootCooldown = 0;
    waystarInvadersReachedBottom = false;
    waystarInvaderShootTimer = 0;
    
    if (typeof showFloatingText === 'function') showFloatingText("⭐ 30 ОСКОЛКОВ! ⭐", "#ffd700");
}

function updateWaystarSpaceInvaders() {
    if (waystarShootCooldown > 0) { waystarShootCooldown--; }
    else {
        waystarShootCooldown = waystarShootInterval;
        waystarPlayerBullets.push({
            x: waystarPlayer.x, y: waystarPlayer.y - 12,
            vy: -12, vx: 0, size: 5, damage: 1, life: 80, trail: []
        });
        addWaystarFlash(waystarPlayer.x, waystarPlayer.y - 12, 15);
        wsPlaySound(1100, 'square', 0.04, 0.06);
    }
    
    var alivePieces = waystarPieces.filter(function(p) { return p.alive; });
    if (alivePieces.length === 0) { waystarVictory(); return; }
    
    var speed = waystarInvaderSpeed + (waystarPiecesTotal - alivePieces.length) * 0.18;
    
    var hitEdge = false;
    for (var i = 0; i < waystarPieces.length; i++) {
        var p = waystarPieces[i];
        if (!p.alive) continue;
        p.trail.push({ x: p.x, y: p.y, life: 10 });
        if (p.trail.length > 5) p.trail.shift();
        p.x += waystarInvaderDir * speed;
        if (p.x - p.size < 10 || p.x + p.size > 390) hitEdge = true;
    }
    
    if (hitEdge) {
        waystarInvaderDir *= -1;
        var dropped = false;
        for (var i = 0; i < waystarPieces.length; i++) {
            var p = waystarPieces[i];
            if (!p.alive) continue;
            p.y += 20;
            if (p.y + p.size > 420 && !dropped) {
                waystarInvadersReachedBottom = true;
                dropped = true;
            }
        }
        wsPlaySound(150, 'square', 0.15, 0.15);
        addWaystarShockwave(200, 250, "#ff00ff", 300, 15, 2); // Волна при спуске
    }
    
    if (waystarInvadersReachedBottom) { waystarDefeat(); return; }
    
    waystarInvaderShootTimer++;
    var shootRate = Math.max(15, 45 - alivePieces.length);
    if (waystarInvaderShootTimer >= shootRate) {
        waystarInvaderShootTimer = 0;
        var shooters = alivePieces.filter(function(p) { return p.y < 380; });
        if (shooters.length > 0) {
            var shooter = shooters[Math.floor(Math.random() * shooters.length)];
            waystarEnemyBullets.push({
                x: shooter.x, y: shooter.y + 15,
                vy: 5 + Math.random() * 3,
                size: 5, life: 200, trail: []
            });
            wsPlaySound(400, 'sawtooth', 0.1, 0.1);
        }
    }
    
    // Пули игрока
    for (var i = waystarPlayerBullets.length - 1; i >= 0; i--) {
        var b = waystarPlayerBullets[i];
        b.y += b.vy; b.life--;
        b.trail.push({ x: b.x, y: b.y, life: 10 });
        if (b.trail.length > 5) b.trail.shift();
        if (b.y < -10 || b.life <= 0) { waystarPlayerBullets.splice(i, 1); continue; }
        
        for (var j = 0; j < waystarPieces.length; j++) {
            var p = waystarPieces[j];
            if (!p.alive) continue;
            if (Math.abs(b.x - p.x) < p.size + 5 && Math.abs(b.y - p.y) < p.size + 5) {
                p.hp--;
                wsPlaySound(1200, 'square', 0.08, 0.1);
                spawnWaystarParticles(p.x, p.y, 10, "#ffd700", 5);
                addWaystarFlash(p.x, p.y, 15);
                if (p.hp <= 0) {
                    p.alive = false;
                    waystarPiecesAlive--;
                    addWaystarShockwave(p.x, p.y, "#ff00ff", 80, 15, 4);
                    addWaystarFlash(p.x, p.y, 40);
                    spawnWaystarParticles(p.x, p.y, 35, "#ff00ff", 8);
                    wsPlaySound(200, 'sawtooth', 0.3, 0.2);
                }
                waystarPlayerBullets.splice(i, 1);
                break;
            }
        }
    }
    
    // Пули врагов
    for (var i = waystarEnemyBullets.length - 1; i >= 0; i--) {
        var b = waystarEnemyBullets[i];
        b.y += b.vy; b.life--;
        if (b.trail) {
            b.trail.push({ x: b.x, y: b.y, life: 8 });
            if (b.trail.length > 4) b.trail.shift();
        }
        if (b.y > 520 || b.life <= 0) { waystarEnemyBullets.splice(i, 1); continue; }
        
        if (waystarInvulnTimer <= 0 && Math.abs(b.x - waystarPlayer.x) < 12 && Math.abs(b.y - waystarPlayer.y) < 14) {
            applyWaystarHit(15, "ОСКОЛОК!");
            waystarEnemyBullets.splice(i, 1);
        }
    }
    
    for (var i = 0; i < waystarPieces.length; i++) {
        if (waystarPieces[i].alive) waystarPieces[i].pulse += 0.2;
    }
}

// ========== УПРАВЛЕНИЕ ==========
function handleWaystarClick(ev) {
    if (!waystarActive) return;
    if (waystarDialogActive) {
        if (waystarChoiceActive) {
            var rect = canvas.getBoundingClientRect();
            var mx = ev.clientX - rect.left;
            var my = ev.clientY - rect.top;
            var btnW = 360, btnX = 20, startY = 240, btnH = 55, gap = 12;
            for (var i = 0; i < 3; i++) {
                var by = startY + i * (btnH + gap);
                if (mx > btnX && mx < btnX + btnW && my > by && my < by + btnH) {
                    selectWaystarChoice(i + 1);
                    return;
                }
            }
        } else {
            // ★ ПРОПУСК ДИАЛОГА КЛИКОМ ★
            waystarProgressDialog();
        }
    }
}

function handleWaystarTouchStart(ev) {
    if (!waystarActive) return;
    ev.preventDefault();
    if (waystarDialogActive) {
        var t = ev.touches[0];
        handleWaystarClick({ clientX: t.clientX, clientY: t.clientY });
        return;
    }
    if (ev.touches.length > 0) {
        var rect = canvas.getBoundingClientRect();
        waystarTouchActive = true;
        waystarTouchId = ev.touches[0].identifier;
        waystarTouchX = ev.touches[0].clientX - rect.left;
        waystarTouchY = ev.touches[0].clientY - rect.top;
    }
}
function handleWaystarTouchMove(ev) {
    if (!waystarActive || !waystarTouchActive) return;
    ev.preventDefault();
    var rect = canvas.getBoundingClientRect();
    for (var i = 0; i < ev.touches.length; i++) {
        if (ev.touches[i].identifier === waystarTouchId) {
            waystarTouchX = ev.touches[i].clientX - rect.left;
            waystarTouchY = ev.touches[i].clientY - rect.top;
            break;
        }
    }
}
function handleWaystarTouchEnd(ev) {
    if (!waystarTouchActive) return;
    var still = false;
    for (var i = 0; i < ev.touches.length; i++) if (ev.touches[i].identifier === waystarTouchId) { still = true; break; }
    if (!still) { waystarTouchActive = false; waystarTouchId = null; }
}

function handleWaystarKeyDown(ev) {
    if (!waystarActive) return;
    waystarKeys[ev.key.toLowerCase()] = true;
}
function handleWaystarKeyUp(ev) {
    waystarKeys[ev.key.toLowerCase()] = false;
}

// ========== ОБНОВЛЕНИЯ ФАЗЫ 1 ==========
function updateWaystarPlayer() {
    if (waystarState === "phase2") {
        var mx = 0;
        if (waystarKeys.a || waystarKeys.arrowleft) mx -= 1;
        if (waystarKeys.d || waystarKeys.arrowright) mx += 1;
        if (waystarTouchActive) {
            var tx = waystarTouchX - waystarPlayer.x;
            if (Math.abs(tx) > 5) mx = tx > 0 ? 1 : -1;
        }
        waystarPlayer.x += mx * 6.5; // Быстрее бег
        waystarPlayer.x = Math.max(20, Math.min(380, waystarPlayer.x));
    } else if (waystarState === "phase1") {
        var mx = 0, my = 0, speed = 4.5; // Увеличен мувспид
        if (waystarTouchActive) {
            var tx = waystarTouchX - waystarPlayer.x, ty = waystarTouchY - waystarPlayer.y;
            var dist = Math.sqrt(tx * tx + ty * ty);
            if (dist > 5) { mx = tx / dist; my = ty / dist; }
        } else {
            if (waystarKeys.w || waystarKeys.arrowup) my -= 1;
            if (waystarKeys.s || waystarKeys.arrowdown) my += 1;
            if (waystarKeys.a || waystarKeys.arrowleft) mx -= 1;
            if (waystarKeys.d || waystarKeys.arrowright) mx += 1;
            if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }
        }
        waystarPlayer.x += mx * speed;
        waystarPlayer.y += my * speed;
        waystarPlayer.x = Math.max(16, Math.min(384, waystarPlayer.x));
        waystarPlayer.y = Math.max(80, Math.min(484, waystarPlayer.y));
    }
    if (waystarInvulnTimer > 0) waystarInvulnTimer--;
}

function updateWaystarBoss() {
    if (waystarState !== "phase1" || waystarDialogActive) return;
    waystarBoss.x += waystarBoss.vx * waystarSpeedMult;
    if (waystarBoss.x < 60 || waystarBoss.x > 340) waystarBoss.vx *= -1;
    waystarBoss.rotation += 0.015 * waystarSpeedMult;
    waystarBoss.pulse += 0.08;
    waystarBoss.time += 0.02;
}

function updateWaystarAttacks() {
    for (var i = waystarAttacks.length - 1; i >= 0; i--) {
        var a = waystarAttacks[i];
        
        if (a.type === "meteor" || a.type === "supernova_bullet") {
            a.trail.push({ x: a.x, y: a.y, life: 12 });
            if (a.trail.length > 8) a.trail.shift();
            a.x += a.vx; a.y += a.vy; a.rotation += (a.rotSpeed||0); a.life--;
            
            if (a.y > 520 || a.x < -20 || a.x > 420 || a.life <= 0) {
                if (a.y > 500 && a.type === "meteor") {
                    addWaystarShockwave(a.x, 500, "#ff8800", 70, 15, 4);
                    spawnWaystarParticles(a.x, 500, 20, "#ff8800", 6);
                }
                waystarAttacks.splice(i, 1); continue;
            }
            if (waystarInvulnTimer <= 0 && Math.sqrt(Math.pow(waystarPlayer.x - a.x, 2) + Math.pow(waystarPlayer.y - a.y, 2)) < a.size + 8) {
                applyWaystarHit(a.damage, a.type === "meteor" ? "МЕТЕОР!" : "ВЗРЫВ!");
                waystarAttacks.splice(i, 1);
            }
        } else if (a.type === "ring") {
            if (a.radius <= 0) { a.radius += a.growth; continue; } // Delay support
            a.radius += a.growth;
            if (a.radius > a.maxRadius) { waystarAttacks.splice(i, 1); continue; }
            var dx = waystarPlayer.x - a.x, dy = waystarPlayer.y - a.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(dist - a.radius) < a.thickness / 2 + 6 && waystarInvulnTimer <= 0) {
                var pAngle = Math.atan2(dy, dx);
                var aDiff = Math.abs(pAngle - a.gapAngle);
                while (aDiff > Math.PI) aDiff = Math.abs(aDiff - Math.PI * 2);
                if (aDiff > a.gapSize / 2) applyWaystarHit(a.damage, "КОЛЬЦО!");
            }
        } else if (a.type === "laser_warning") {
            a.timer--;
            if (a.timer % 10 === 0) addWaystarLightning(a.x+(Math.random()-0.5)*30, 0, a.x+(Math.random()-0.5)*30, 500, "#ff3333", 0.7, 3);
            if (a.timer <= 0) {
                waystarAttacks.splice(i, 1);
                waystarAttacks.push({ type: "laser", x: a.x, width: a.width, timer: 25, damage: a.damage });
                addWaystarFlash(a.x, 250, 100);
                wsPlaySound(150, 'sawtooth', 0.6, 0.2);
            }
        } else if (a.type === "laser") {
            a.timer--;
            if (a.timer <= 0) { waystarAttacks.splice(i, 1); continue; }
            if (waystarInvulnTimer <= 0 && Math.abs(waystarPlayer.x - a.x) < a.width / 2 + 6) applyWaystarHit(a.damage, "ЛАЗЕР!");
        } else if (a.type === "constellation") {
            a.timer--;
            if (a.warning > 0) a.warning--;
            if (a.timer <= 0) { waystarAttacks.splice(i, 1); continue; }
            if (a.warning <= 0 && waystarInvulnTimer <= 0 && !a.hit) {
                for (var p = 0; p < a.points.length - 1; p++) {
                    var p1 = a.points[p], p2 = a.points[p + 1];
                    var d = distToSegment(waystarPlayer.x, waystarPlayer.y, p1.x, p1.y, p2.x, p2.y);
                    if (d < 12) { a.hit = true; applyWaystarHit(a.damage, "СОЗВЕЗДИЕ!"); break; }
                }
            }
        }
    }
}

function distToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    var projX = x1 + t * dx, projY = y1 + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

function applyWaystarHit(dmg, textMsg) {
    if (waystarInvulnTimer > 0) return;
    waystarPlayerHp -= dmg;
    waystarInvulnTimer = 40;
    waystarShake = 25;
    waystarScreenFlash = 15; waystarScreenFlashColor = "#ff0000";
    waystarVignette = 30;
    spawnWaystarParticles(waystarPlayer.x, waystarPlayer.y, 40, "#ff3333", 9);
    addWaystarShockwave(waystarPlayer.x, waystarPlayer.y, "#ff0000", 120, 15, 5);
    addWaystarFlash(waystarPlayer.x, waystarPlayer.y, 35);
    for (var i = 0; i < 4; i++) {
        var ang = Math.random() * Math.PI * 2;
        addWaystarLightning(waystarPlayer.x, waystarPlayer.y, waystarPlayer.x + Math.cos(ang) * 60, waystarPlayer.y + Math.sin(ang) * 60, "#ff3333", 1.0, 3);
    }
    if (textMsg && typeof showFloatingText === 'function') showFloatingText(textMsg, "#ff3333");
    wsPlaySound(80, 'sawtooth', 0.5, 0.2);
    updateWaystarHpBar();
    if (waystarPlayerHp <= 0) waystarDefeat();
}

function updateWaystarHpBar() {
    var el = document.getElementById("arenaHP");
    if (el) el.innerText = Math.max(0, Math.ceil(waystarPlayerHp));
}

function spawnWaystarParticles(x, y, count, color, speed) {
    for (var i = 0; i < count; i++) {
        var a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random());
        waystarParticles.push({
            x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life: 30 + Math.random() * 25, maxLife: 55,
            color: color, size: 2 + Math.random() * 4
        });
    }
}

// ========== ПОБЕДА / ПОРАЖЕНИЕ ==========
function waystarVictory() {
    if (waystarRewardGiven) return;
    waystarRewardGiven = true;
    waystarState = "victory";
    wsPlaySound(500, 'sine', 0.6, 0.2);
    setTimeout(function() { wsPlaySound(800, 'sine', 0.6, 0.2); }, 200);
    setTimeout(function() { wsPlaySound(1200, 'sine', 0.8, 0.25); }, 400);
    setTimeout(function() { wsPlaySound(1600, 'sine', 1.0, 0.3); }, 700);
    
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && !defeatedBosses.includes(500)) {
        defeatedBosses.push(500);
        if (typeof saveAll === 'function') saveAll();
    }
    if (typeof addItem === 'function') addItem("waystar", 1);
    if (typeof secretGachaTokens !== 'undefined') secretGachaTokens = (secretGachaTokens || 0) + 1;
    if (typeof saveAll === 'function') saveAll();
    
    for (var i = 0; i < 7; i++) {
        setTimeout(function(idx) {
            addWaystarShockwave(200, 250, ["#ffffff", "#ffd700", "#ff00ff"][idx % 3], 500, 40, 8);
        }, i * 100);
    }
    for (var i = 0; i < 20; i++) {
        var ang = (i / 20) * Math.PI * 2;
        addWaystarLightning(200, 250, 200 + Math.cos(ang) * 250, 250 + Math.sin(ang) * 250, "#ffd700", 1.0, 4);
    }
    for (var i = 0; i < 250; i++) {
        spawnWaystarParticles(200 + (Math.random() - 0.5) * 400, 250 + (Math.random() - 0.5) * 400, 1, ["#ffd700", "#ffffff", "#ff00ff"][Math.floor(Math.random() * 3)], 15);
    }
    
    if (typeof showFloatingText === 'function') {
        showFloatingText("⭐ ПОБЕДА! ⭐", "#ffd700");
        setTimeout(function() { showFloatingText("🌟 Путеводная Звезда получена!", "#ffd700"); }, 600);
        setTimeout(function() { showFloatingText("💎 +1 СЕКРЕТНЫЙ ТОКЕН", "#ff00ff"); }, 1200);
    }
    setTimeout(function() {
        stopWaystarFight();
        if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
        if (typeof victory === 'function') victory();
    }, 4000);
}

function waystarDefeat() {
    waystarState = "defeat";
    if (typeof showFloatingText === 'function') showFloatingText("ТЫ ПАЛ...", "#ff0000");
    wsPlaySound(40, 'sawtooth', 2.0, 0.4);
    waystarScreenFlash = 80; waystarScreenFlashColor = "#ff0000";
    for (var i = 0; i < 120; i++) spawnWaystarParticles(waystarPlayer.x, waystarPlayer.y, 1, "#ff3333", 12);
    setTimeout(function() {
        stopWaystarFight();
        if (typeof playerHp !== 'undefined') playerHp = 0;
        if (typeof defeat === 'function') defeat();
    }, 3000);
}

// ========== MAIN RENDER LOOP ==========
function waystarRenderLoop() {
    if (!waystarActive || !ctx || !canvas) return;
    
    if (!waystarDialogActive) {
        if (waystarState === "phase1") {
            if (waystarBossHp <= waystarBossMaxHp * 0.5 && waystarPieces.length === 0) waystarTriggerSplit();
            else {
                updateWaystarPlayer();
                updateWaystarShooting();
                
                // Обновление пуль игрока (Фаза 1)
                for (var i = waystarPlayerBullets.length - 1; i >= 0; i--) {
                    var b = waystarPlayerBullets[i];
                    b.y += b.vy; b.x += (b.vx || 0); b.life--;
                    b.trail.push({ x: b.x, y: b.y, life: 10 });
                    if (b.trail.length > 5) b.trail.shift();
                    
                    var dx = b.x - waystarBoss.x, dy = b.y - waystarBoss.y;
                    if (Math.sqrt(dx * dx + dy * dy) < waystarBoss.size + b.size) {
                        waystarBossHp -= b.damage;
                        waystarBossFlash = 6;
                        spawnWaystarParticles(b.x, b.y, 10, "#ffd700", 6);
                        addWaystarFlash(b.x, b.y, 20);
                        if (Math.random() < 0.5) addWaystarLightning(b.x, b.y, b.x+(Math.random()-0.5)*70, b.y+(Math.random()-0.5)*70, "#ffffff", 0.8, 2);
                        if (Math.random() < 0.4) addWaystarSlash(b.x, b.y, Math.random()*Math.PI*2, 35, 4);
                        wsPlaySound(1400, 'square', 0.08, 0.08);
                        
                        if (waystarBossHp < waystarBossMaxHp * 0.5) waystarBossHp = waystarBossMaxHp * 0.5;
                        waystarPlayerBullets.splice(i, 1);
                        continue;
                    }
                    if (b.y < -20 || b.life <= 0) waystarPlayerBullets.splice(i, 1);
                }
                
                updateWaystarBoss();
                updateWaystarAttacks();
                
                waystarAttackTimer++;
                var aRate = Math.floor(35 / waystarSpeedMult); // Значительно более частые атаки
                if (waystarAttackTimer >= aRate) {
                    waystarAttackTimer = 0;
                    waystarSpawnAttack();
                }
                waystarTypeTimer--;
                if (waystarTypeTimer <= 0) {
                    waystarAttackType = Math.floor(Math.random() * 5); // 0..4 (включая Сверхновую)
                    waystarTypeTimer = Math.floor(200 + Math.random() * 150);
                    var typeNames = ["МЕТЕОРЫ", "КОЛЬЦА", "ЛАЗЕРЫ", "СОЗВЕЗДИЕ", "СВЕРХНОВАЯ"];
                    spawnWaystarText(200, 60, typeNames[waystarAttackType], "#ffffff", 70);
                    addWaystarShockwave(waystarBoss.x, waystarBoss.y, "#ffffff", 100, 15, 4);
                }
            }
        } else if (waystarState === "phase2") {
            updateWaystarPlayer();
            updateWaystarSpaceInvaders();
        }
    } else {
        waystarBoss.rotation += 0.02;
        waystarBoss.pulse += 0.08;
        var current = waystarDialogQueue[waystarDialogStep];
        if (current && current.choice && !waystarChoiceResolved) waystarChoiceActive = true;
        if (!waystarChoiceActive) {
            waystarDialogAutoTimer++;
            if (current && waystarDialogAutoTimer > current.time * 60) {
                waystarProgressDialog(); // Авто-пропуск
            }
        }
    }
    
    if (waystarShake > 0.1) waystarShake *= 0.85;
    if (waystarScreenFlash > 0) waystarScreenFlash--;
    if (waystarBossFlash > 0) waystarBossFlash--;
    
    updateWaystarMegaEffects();
    
    for (var i = waystarParticles.length - 1; i >= 0; i--) {
        var p = waystarParticles[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life--;
        if (p.life <= 0) waystarParticles.splice(i, 1);
    }
    for (var i = waystarTexts.length - 1; i >= 0; i--) {
        var t = waystarTexts[i];
        t.y += t.vy; t.life--;
        if (t.life <= 0) waystarTexts.splice(i, 1);
    }
    
    // ======== ОТРИСОВКА ========
    ctx.save();
    if (waystarShake > 0.5) ctx.translate((Math.random() - 0.5) * waystarShake, (Math.random() - 0.5) * waystarShake);
    if (waystarScreenDistort > 0.5) {
        ctx.translate((Math.random() - 0.5) * waystarScreenDistort, (Math.random() - 0.5) * waystarScreenDistort);
        ctx.scale(1 + waystarScreenDistort / 500, 1 + waystarScreenDistort / 500);
    }
    
    // Эпичный Космос-Фон
    var bg = ctx.createLinearGradient(0, 0, 0, 500);
    bg.addColorStop(0, "#050015");
    bg.addColorStop(0.5, "#0a0020");
    bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 400, 500);
    
    ctx.globalCompositeOperation = "lighter";
    // Туманности
    for(var i=0; i<waystarNebulas.length; i++) {
        var neb = waystarNebulas[i];
        ctx.save();
        ctx.translate(neb.x, neb.y);
        ctx.rotate(neb.angle);
        var ng = ctx.createRadialGradient(0,0,0,0,0,neb.radius);
        ng.addColorStop(0, neb.color);
        ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0,0,neb.radius,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
    
    // Звёзды
    for (var i = 0; i < waystarBgStars.length; i++) {
        var s = waystarBgStars[i];
        s.twinkle += 0.1;
        ctx.globalAlpha = s.alpha * (0.5 + Math.sin(s.twinkle) * 0.5);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    
    if (waystarScreenFlash > 0) {
        ctx.globalAlpha = waystarScreenFlash / 40;
        ctx.fillStyle = waystarScreenFlashColor;
        ctx.fillRect(0, 0, 400, 500);
        ctx.globalAlpha = 1;
    }
    if (waystarVignette > 0) {
        var vg = ctx.createRadialGradient(200, 250, 100, 200, 250, 400);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, "rgba(255,0,0," + (waystarVignette / 30) + ")");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, 400, 500);
    }
    
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 496);
    
    // ★ РЕНДЕР ЭФФЕКТОВ (Lighter для сочности) ★
    ctx.globalCompositeOperation = "lighter";
    
    for (var i = 0; i < waystarShockwaves.length; i++) {
        var sw = waystarShockwaves[i];
        var progress = 1 - sw.life / sw.maxLife;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.width * (1 - progress);
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, Math.max(0.1, sw.radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    for (var i = 0; i < waystarLightningBolts.length; i++) {
        var lb = waystarLightningBolts[i];
        ctx.save();
        ctx.globalAlpha = lb.life / lb.maxLife;
        ctx.strokeStyle = lb.color;
        ctx.lineWidth = lb.width;
        ctx.shadowColor = lb.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(lb.x1, lb.y1);
        for (var p = 0; p < lb.pts.length; p++) ctx.lineTo(lb.pts[p].x, lb.pts[p].y);
        ctx.lineTo(lb.x2, lb.y2);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = lb.width * 0.5;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
    }
    for (var i = 0; i < waystarSlashMarks.length; i++) {
        var sm = waystarSlashMarks[i];
        ctx.save();
        ctx.globalAlpha = sm.life / sm.maxLife;
        ctx.translate(sm.x, sm.y);
        ctx.rotate(sm.angle);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = sm.width * (sm.life / sm.maxLife);
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.moveTo(-sm.length / 2, 0); ctx.lineTo(sm.length / 2, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -sm.length / 2); ctx.lineTo(0, sm.length / 2);
        ctx.stroke();
        ctx.restore();
    }
    for (var i = 0; i < waystarFlashBursts.length; i++) {
        var fb = waystarFlashBursts[i];
        ctx.save();
        ctx.globalAlpha = (fb.life / fb.maxLife);
        var r = fb.size * (1 - fb.life / fb.maxLife + 0.5);
        var g = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.3, "rgba(255,215,0,0.8)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over"; // Возврат в норму
    
    // Игровые объекты
    if (waystarState === "phase1" || waystarDialogActive || waystarState === "split") {
        drawWaystarBoss();
        drawWaystarPhase1Attacks();
        drawWaystarPlayerBullets();
    } else if (waystarState === "phase2") {
        drawWaystarPieces();
        drawWaystarEnemyBullets();
        drawWaystarPlayerBullets();
    }
    
    if (waystarState === "phase1" || waystarState === "phase2") drawWaystarPlayer();
    
    // Частицы
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < waystarParticles.length; i++) {
        var p = waystarParticles[i];
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    
    for (var i = 0; i < waystarTexts.length; i++) {
        var t = waystarTexts[i];
        ctx.globalAlpha = Math.min(1, t.life / 30);
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = t.color;
        ctx.shadowColor = "#ff00ff";
        ctx.shadowBlur = 10;
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    
    if (!waystarDialogActive) drawWaystarHpBars();
    if (waystarDialogActive) drawWaystarDialog();
    
    if (!waystarDialogActive && (waystarState === "phase1" || waystarState === "phase2")) {
        ctx.save();
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,215,0,0.8)";
        ctx.fillText(waystarState==="phase1" ? "⌨️ WASD — двигаться | 🔫 Авто-стрельба" : "← → двигаться | 🔫 Авто-стрельба", 200, 495);
        ctx.restore();
    }
    
    ctx.restore();
    waystarAnimFrame = requestAnimationFrame(waystarRenderLoop);
}

function spawnWaystarText(x, y, text, color, life) {
    waystarTexts.push({ x: x, y: y, text: text, color: color, life: life || 60, vy: -0.5 });
}

// ========== ЭПИЧНАЯ ОТРИСОВКА БОССА ==========
function drawWaystarBoss() {
    var b = waystarBoss;
    var pulse = 1 + Math.sin(b.pulse) * 0.15;
    var size = b.size * pulse;
    
    ctx.save();
    ctx.translate(b.x, b.y);
    
    // Ауры Lighter
    ctx.globalCompositeOperation = "lighter";
    var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 4);
    if (waystarBossFlash > 0) {
        glow.addColorStop(0, "rgba(255, 255, 255, 1)");
        glow.addColorStop(0.3, "rgba(255, 200, 100, 0.8)");
        glow.addColorStop(1, "transparent");
    } else {
        glow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        glow.addColorStop(0.2, "rgba(255, 215, 0, 0.7)");
        glow.addColorStop(0.6, "rgba(255, 0, 255, 0.3)"); // Розовый оттенок
        glow.addColorStop(1, "transparent");
    }
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, size * 4, 0, Math.PI * 2); ctx.fill();
    
    // Вращающаяся мандала 1
    ctx.rotate(b.time);
    ctx.strokeStyle = "rgba(255,215,0,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2;
        ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(a)*size*1.8, Math.sin(a)*size*1.8);
    }
    ctx.stroke();
    
    // Вращающаяся звезда
    ctx.rotate(-b.time * 2 + b.rotation);
    ctx.fillStyle = waystarBossFlash > 0 ? "#ffffff" : "#ffd700";
    ctx.shadowColor = "#ff00ff";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    for (var i = 0; i < 16; i++) {
        var ang = (i / 16) * Math.PI * 2 - Math.PI / 2;
        var r = (i % 2 === 0) ? size : size * 0.4;
        var px = Math.cos(ang) * r, py = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2); ctx.fill();
    
    ctx.restore();
}

function drawWaystarPlayer() {
    if (waystarInvulnTimer > 0 && Math.floor(waystarInvulnTimer / 3) % 2 === 0) return;
    ctx.save();
    ctx.translate(waystarPlayer.x, waystarPlayer.y);
    
    ctx.globalCompositeOperation = "lighter";
    var glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 25);
    glow.addColorStop(0, "rgba(255,100,100,0.8)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill();
    
    // Пламенный след (двигатель)
    ctx.fillStyle = "rgba(255, 100, 0, 0.6)";
    ctx.beginPath();
    ctx.moveTo(-5, 8);
    ctx.lineTo(5, 8);
    ctx.lineTo(0, 20 + Math.random()*10);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ff1111";
    var hs = 12;
    ctx.beginPath();
    ctx.moveTo(0, hs * 0.7);
    ctx.bezierCurveTo(-hs * 1.4, -hs * 0.2, -hs * 0.7, -hs * 1.1, 0, -hs * 0.4);
    ctx.bezierCurveTo(hs * 0.7, -hs * 1.1, hs * 1.4, -hs * 0.2, 0, hs * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

function drawWaystarPlayerBullets() {
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < waystarPlayerBullets.length; i++) {
        var b = waystarPlayerBullets[i];
        if (b.trail) {
            for (var j = 0; j < b.trail.length; j++) {
                var tr = b.trail[j], alpha = (1 - j / b.trail.length) * 0.6;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = "#00ffff";
                ctx.beginPath(); ctx.arc(tr.x, tr.y, b.size * (1 - j / b.trail.length) * 0.8, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        ctx.save();
        var glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2.5);
        glow.addColorStop(0, "#ffffff");
        glow.addColorStop(0.4, "#00ffff");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
}

function drawWaystarEnemyBullets() {
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < waystarEnemyBullets.length; i++) {
        var b = waystarEnemyBullets[i];
        if (b.trail) {
            for (var j = 0; j < b.trail.length; j++) {
                var tr = b.trail[j], alpha = (1 - j / b.trail.length) * 0.6;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = "#ff00ff";
                ctx.beginPath(); ctx.arc(tr.x, tr.y, b.size * (1 - j / b.trail.length) * 0.8, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        ctx.save();
        ctx.fillStyle = "#ff00ff";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
}

function drawWaystarPhase1Attacks() {
    for (var i = 0; i < waystarAttacks.length; i++) {
        var a = waystarAttacks[i];
        if (a.type === "meteor" || a.type === "supernova_bullet") {
            ctx.globalCompositeOperation = "lighter";
            for (var j = 0; j < a.trail.length; j++) {
                var tr = a.trail[j], alpha = (1 - j / a.trail.length) * 0.7;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = a.type === "meteor" ? "#ff8800" : "#ff00ff";
                ctx.beginPath(); ctx.arc(tr.x, tr.y, a.size * (1 - j / a.trail.length), 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.translate(a.x, a.y); ctx.rotate(a.rotation||0);
            ctx.fillStyle = a.type === "meteor" ? "#ffd700" : "#ff8800";
            ctx.shadowColor = a.type === "meteor" ? "#ff4400" : "#ff00ff";
            ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(0, 0, a.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(0, 0, a.size * 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.globalCompositeOperation = "source-over";
            
        } else if (a.type === "ring" && a.radius > 0) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = Math.max(0, 1 - a.radius / a.maxRadius);
            ctx.strokeStyle = a.color;
            ctx.lineWidth = a.thickness;
            ctx.shadowColor = a.color;
            ctx.shadowBlur = 25;
            var startAngle = a.gapAngle + a.gapSize / 2;
            var endAngle = a.gapAngle + Math.PI * 2 - a.gapSize / 2;
            ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, startAngle, endAngle); ctx.stroke();
            
            // Указатель к бреши
            ctx.globalAlpha = Math.max(0, 1 - a.radius / a.maxRadius) * 0.9;
            ctx.strokeStyle = "#00ff66";
            ctx.lineWidth = 4;
            ctx.shadowColor = "#00ff66";
            ctx.shadowBlur = 20;
            var arrowLen = Math.max(25, a.radius * 0.35);
            var arrowStart = a.radius + 8, arrowEnd = arrowStart + arrowLen, gapMid = a.gapAngle;
            ctx.beginPath();
            ctx.moveTo(a.x + Math.cos(gapMid) * arrowStart, a.y + Math.sin(gapMid) * arrowStart);
            ctx.lineTo(a.x + Math.cos(gapMid) * arrowEnd, a.y + Math.sin(gapMid) * arrowEnd);
            ctx.stroke();
            var tipX = a.x + Math.cos(gapMid) * arrowEnd, tipY = a.y + Math.sin(gapMid) * arrowEnd, tipSize = 14;
            ctx.beginPath();
            ctx.moveTo(tipX + Math.cos(gapMid)*tipSize, tipY + Math.sin(gapMid)*tipSize);
            ctx.lineTo(tipX + Math.cos(gapMid+2.5)*tipSize, tipY + Math.sin(gapMid+2.5)*tipSize);
            ctx.lineTo(tipX + Math.cos(gapMid-2.5)*tipSize, tipY + Math.sin(gapMid-2.5)*tipSize);
            ctx.closePath();
            ctx.fillStyle = "#00ff66"; ctx.fill();
            ctx.restore();
            
        } else if (a.type === "laser_warning") {
            ctx.save(); ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 80) * 0.3;
            ctx.fillStyle = "#ff3333"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 25;
            ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.restore();
            
        } else if (a.type === "laser") {
            ctx.save(); ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = Math.min(1, a.timer / 25);
            ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 50;
            ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.fillStyle = "#00ffff";
            ctx.fillRect(a.x - a.width / 3, 0, a.width * 2 / 3, 500);
            ctx.restore();
            
        } else if (a.type === "constellation") {
            ctx.save(); ctx.globalCompositeOperation = "lighter";
            var isWarn = a.warning > 0;
            ctx.globalAlpha = isWarn ? 0.4 + Math.sin(performance.now() / 100) * 0.3 : 1;
            ctx.strokeStyle = isWarn ? "#00ffff" : "#ffffff";
            ctx.lineWidth = isWarn ? 3 : 6;
            if (isWarn) ctx.setLineDash([8, 6]);
            ctx.shadowColor = isWarn ? "#00ffff" : "#ffffff"; ctx.shadowBlur = isWarn ? 15 : 30;
            ctx.beginPath();
            for (var p = 0; p < a.points.length; p++) {
                if (p === 0) ctx.moveTo(a.points[p].x, a.points[p].y);
                else ctx.lineTo(a.points[p].x, a.points[p].y);
            }
            ctx.stroke(); ctx.setLineDash([]);
            
            for (var p = 0; p < a.points.length; p++) {
                ctx.fillStyle = isWarn ? "#00ffff" : "#ffffff";
                ctx.beginPath(); ctx.arc(a.points[p].x, a.points[p].y, isWarn ? 5 : 9, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }
    }
}

function drawWaystarPieces() {
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < waystarPieces.length; i++) {
        var p = waystarPieces[i];
        if (!p.alive) continue;
        if (p.trail) {
            for (var j = 0; j < p.trail.length; j++) {
                var tr = p.trail[j], alpha = (1 - j / p.trail.length) * 0.5;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = "#ffd700";
                ctx.beginPath(); ctx.arc(tr.x, tr.y, p.size * (1 - j / p.trail.length) * 0.8, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        var pulse = 1 + Math.sin(p.pulse) * 0.15;
        ctx.scale(pulse, pulse);
        var glow = ctx.createRadialGradient(0, 0, 2, 0, 0, p.size * 2.5);
        glow.addColorStop(0, "rgba(255, 215, 0, 0.9)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, p.size * 2.5, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = p.hp >= 3 ? "#ffd700" : p.hp === 2 ? "#ff00ff" : "#ff0000";
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15;
        ctx.beginPath();
        for (var k = 0; k < 10; k++) {
            var ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
            var r = (k % 2 === 0) ? p.size : p.size * 0.4;
            if (k === 0) ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r);
            else ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r);
        }
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
}

function drawWaystarHpBars() {
    var barW = 360, barH = 14, x = 20, y = 6;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(x - 4, y - 4, barW + 8, barH + 8);
    ctx.fillStyle = "#1a001a";
    ctx.fillRect(x, y, barW, barH);
    
    if (waystarState === "phase2") {
        var ratio = waystarPiecesAlive / waystarPiecesTotal;
        ctx.fillStyle = "#ff00ff"; ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 15;
        ctx.fillRect(x, y, barW * ratio, barH);
        ctx.shadowBlur = 0; ctx.fillStyle = "#fff";
        ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
        ctx.fillText("🌟 " + waystarPiecesAlive + " / " + waystarPiecesTotal + " осколков", x + barW / 2, y + barH - 3);
    } else {
        var ratio = Math.max(0, waystarBossHp / waystarBossMaxHp);
        ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 15;
        ctx.fillRect(x, y, barW * ratio, barH);
        ctx.shadowBlur = 0; ctx.fillStyle = "#fff";
        ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
        ctx.fillText("🌟 " + Math.ceil(waystarBossHp) + " / " + Math.ceil(waystarBossMaxHp), x + barW / 2, y + barH - 3);
    }
    ctx.restore();
    
    var y2 = 478;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(x - 4, y2 - 4, barW + 8, 20);
    ctx.fillStyle = "#2a0000";
    ctx.fillRect(x, y2, barW, 12);
    var r2 = Math.max(0, waystarPlayerHp / waystarPlayerMaxHp);
    ctx.fillStyle = r2 > 0.3 ? "#00ff66" : "#ff3333";
    ctx.shadowColor = r2 > 0.3 ? "#00ff66" : "#ff3333"; ctx.shadowBlur = 12;
    ctx.fillRect(x, y2, barW * r2, 12);
    ctx.shadowBlur = 0; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(x, y2, barW, 12);
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
    ctx.fillText(Math.ceil(waystarPlayerHp) + " / " + waystarPlayerMaxHp, x + barW / 2, y2 + 10);
    ctx.restore();
}

function drawWaystarDialog() {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, 400, 500);
    
    ctx.save();
    ctx.translate(200, 90);
    var t = performance.now() / 1000, pulse = 1 + Math.sin(t * 3) * 0.1;
    ctx.scale(pulse, pulse);
    
    ctx.globalCompositeOperation = "lighter";
    var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 80);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    glow.addColorStop(0.4, "rgba(255, 215, 0, 0.6)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    
    ctx.fillStyle = "#ffd700";
    ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 20;
    ctx.beginPath();
    for (var i = 0; i < 16; i++) {
        var ang = (i / 16) * Math.PI * 2 - Math.PI / 2, r = (i % 2 === 0) ? 45 : 20;
        if (i === 0) ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r); else ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r);
    }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    
    var current = waystarDialogQueue[waystarDialogStep];
    if (current) {
        ctx.font = "bold 15px Nunito, sans-serif";
        ctx.textAlign = "center"; ctx.fillStyle = "#ffd700";
        ctx.fillText(current.speaker, 200, 175);
        
        ctx.font = "bold 16px Nunito, sans-serif"; ctx.fillStyle = "#ffffff";
        var lines = wrapText(current.text, 360, ctx);
        for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], 200, 205 + i * 24);
        
        // Подсказка для пропуска
        if (!waystarChoiceActive) {
            ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.5;
            ctx.font = "12px monospace"; ctx.fillStyle = "#aaaaaa";
            ctx.fillText(">> Кликните для пропуска <<", 200, 480);
            ctx.globalAlpha = 1;
        }
    }
    
    if (waystarChoiceActive && !waystarChoiceResolved) {
        var choices = getWaystarChoices();
        var btnW = 360, btnX = 20, startY = 260, btnH = 55, gap = 12;
        for (var i = 0; i < choices.length; i++) {
            var btnY = startY + i * (btnH + gap);
            ctx.fillStyle = "rgba(40,20,50,0.95)";
            ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = 2;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(btnX, btnY, btnW, btnH, 12); else ctx.rect(btnX, btnY, btnW, btnH);
            ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = "#ffd700"; ctx.font = "bold 15px Nunito, sans-serif"; ctx.textAlign = "left";
            ctx.fillText((i+1) + ".", btnX + 12, btnY + 23);
            ctx.fillStyle = "#ffffff"; ctx.font = "bold 13px Nunito, sans-serif";
            var lines = wrapText(choices[i].text, btnW - 50, ctx);
            for (var li = 0; li < Math.min(lines.length, 3); li++) ctx.fillText(lines[li], btnX + 35, btnY + 21 + li * 16);
        }
    }
    ctx.restore();
}

function wrapText(text, maxWidth, ctx) {
    var words = text.split(' '), lines = [], currentLine = '';
    for (var i = 0; i < words.length; i++) {
        var testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        if (ctx.measureText(testLine).width > maxWidth && currentLine) { lines.push(currentLine); currentLine = words[i]; } 
        else { currentLine = testLine; }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

// ========== ЭКСПОРТ ==========
window.startWaystarFight = startWaystarFight;
window.stopWaystarFight = stopWaystarFight;
window.damageWaystarBoss = function(dmg) { if (waystarState === "phase1") waystarBossHp -= dmg; };
console.log("[WAYSTAR] v4.0 — EPIC OVERHAUL (Многослойный рендер, новые атаки, баланс, пропуск диалогов)");
