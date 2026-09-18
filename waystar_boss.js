// ============================================================
// ПУТЕВОДНАЯ ЗВЕЗДА — БОСС 500 ВОЛНЫ v2.0
// Копия структуры Живого Камня + авто-стрельба сердечка
// Фаза 2: Space Invaders (30 кусочков)
// ============================================================

let waystarActive = false;
let waystarState = "dialogue";
let waystarBoss = { x: 200, y: 100, size: 55, vx: 0.8, rotation: 0, pulse: 0 };
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
let waystarTypeTimer = 400;
let waystarInvulnTimer = 0;
let waystarShake = 0;
let waystarScreenFlash = 0;
let waystarScreenFlashColor = "#ffffff";
let waystarBossFlash = 0;
let waystarAnimFrame = null;
let waystarBgStars = [];
let waystarSpeedMult = 0.6;
let waystarKeys = {};
let waystarTouchActive = false, waystarTouchId = null, waystarTouchX = 0, waystarTouchY = 0;

// ★ СТРЕЛЬБА СЕРДЕЧКА ★
let waystarShootCooldown = 0;
let waystarShootInterval = 9; // ~0.15 сек при 60fps (было бы 0.15)

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
let waystarInvaderSpeed = 0.9;
let waystarInvaderShootTimer = 0;
let waystarInvadersReachedBottom = false;
let waystarPiecesTotal = 30;
let waystarPiecesAlive = 30;

// ★ НАГРАДА ★
let waystarRewardGiven = false;

// ========== МУЗЫКА ==========
let waystarMusic = null;
let waystarMusicLoaded = false;
function startWaystarMusic() {
    if (typeof stopAllMusic === 'function') stopAllMusic();
    if (!waystarMusic) {
        try {
            waystarMusic = new Audio("music/Звезда.mp3");
            waystarMusic.loop = true;
            waystarMusic.volume = 0.35;
            waystarMusic.onerror = function() {
                console.warn("[WAYSTAR] Музыка не найдена: music/Звезда 1.mp3");
                waystarMusic = null;
            };
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

// ========== ЗВУКИ ==========
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
    
    // ★ HP по рекомендации B: playerDamage × 400 (бой ~1 минута) ★
    var playerDmg = (typeof window.playerFinalDamage !== 'undefined') ? window.playerFinalDamage : 100;
    waystarBossMaxHp = Math.max(50000, playerDmg * 400);
    waystarBossHp = waystarBossMaxHp;
    
    waystarBoss = { x: 200, y: 100, size: 55, vx: 0.8, rotation: 0, pulse: 0 };
    waystarPlayer = { x: 200, y: 430 };
    waystarPlayerHp = 200;
    waystarPlayerMaxHp = 200;
    waystarInvulnTimer = 0;
    waystarAttacks = []; waystarPlayerBullets = []; waystarParticles = []; waystarTexts = [];
    waystarAttackTimer = 0; waystarAttackType = 0; waystarTypeTimer = 400;
    waystarShake = 0; waystarScreenFlash = 0; waystarBossFlash = 0;
    waystarPieces = []; waystarEnemyBullets = [];
    waystarInvaderDir = 1; waystarInvaderShootTimer = 0;
    waystarInvadersReachedBottom = false;
    waystarPiecesTotal = 30; waystarPiecesAlive = 30;
    waystarShootCooldown = 0;
    waystarRewardGiven = false;
    waystarTouchActive = false; waystarTouchId = null;
    waystarKeys = {};
    waystarDialogActive = true; waystarDialogStep = 0; waystarChoiceActive = false; waystarChoiceResolved = false;
    waystarDialogAutoTimer = 0;
    
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
    
    if (typeof _disableCtxShadows === 'function') {
        var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) _disableCtxShadows(ctx);
    }
    
    canvas.addEventListener("click", handleWaystarClick);
    canvas.addEventListener("touchstart", handleWaystarTouchStart);
    canvas.addEventListener("touchmove", handleWaystarTouchMove);
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
    waystarAttacks = []; waystarPlayerBullets = []; waystarParticles = []; waystarTexts = [];
    waystarPieces = []; waystarEnemyBullets = [];
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
    for (var i = 0; i < 80; i++) {
        waystarBgStars.push({
            x: Math.random() * 400, y: Math.random() * 500,
            size: 0.5 + Math.random() * 1.8,
            speed: 0.05 + Math.random() * 0.2,
            alpha: 0.2 + Math.random() * 0.6,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}

// ========== ДИАЛОГ ==========
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
        var r = waystarDialogQueue[i];
        r.time = 2 + r.text.length * 0.06;
    }
}

function getWaystarChoices() {
    return [
        { id: 1, text: "Тебя это не касается! Ты тут не причем.", response: "Хорошо, то я думал, что ты пришёл за мной. В любом случае битва неизбежна." },
        { id: 2, text: "Это значит Рик... Я отомщу ему...!", response: "Да, это он. Но чтобы пройти дальше, ты должен победить меня. Я не дам какому-то мальчишке просто так попасть в сломанную часть космоса!" },
        { id: 3, text: "Ебать, даже звезда разговаривает. Прямо как тот камень. Живой камень.", response: "Живой камень? Ты его знаешь? Я сам удивлён, как обычный камень ЖИВОЙ. Видимо он пропитался силой и энергией звёзд. Но я буду сильнее!" }
    ];
}

function selectWaystarChoice(choiceId) {
    if (waystarChoiceResolved) return;
    waystarChoiceResolved = true;
    waystarChoiceActive = false;
    var choices = getWaystarChoices();
    var c = choices.find(function(x) { return x.id === choiceId; });
    if (!c) return;
    var responses = [
        { speaker: "🌟 Путеводная Звезда", text: c.response },
        { speaker: "🌟 Путеводная Звезда", text: "Достаточно разговоров. Покажи мне свою силу!" },
        { speaker: "🌟 Путеводная Звезда", text: "Или я раздавлю тебя, как остальных!" },
        { speaker: "🌟 Путеводная Звезда", text: "МУЛЬТИВСЕЛЕННАЯ НЕ ПРОЩАЕТ СЛАБЫХ!" }
    ];
    for (var i = 0; i < responses.length; i++) {
        responses[i].time = 2 + responses[i].text.length * 0.06;
        waystarDialogQueue.push(responses[i]);
    }
    waystarDialogStep++;
    waystarDialogAutoTimer = 0;
    wsPlaySound(600, 'square', 0.3, 0.2);
}

// ========== АВТО-СТРЕЛЬБА СЕРДЕЧКА ==========
function updateWaystarShooting() {
    if (waystarState !== "phase1") return;
    if (waystarShootCooldown > 0) { waystarShootCooldown--; return; }
    waystarShootCooldown = waystarShootInterval;
    
    // Направление — вверх (вариант A)
    waystarPlayerBullets.push({
        x: waystarPlayer.x,
        y: waystarPlayer.y - 12,
        vy: -9,
        vx: 0,
        size: 4,
        damage: Math.max(1, Math.floor((window.playerFinalDamage || 100) / 10)),
        life: 80
    });
    wsPlaySound(1100, 'square', 0.04, 0.05);
}

// ========== ФАЗА 1 — АТАКИ ==========
function waystarSpawnAttack() {
    var type = waystarAttackType;
    var s = waystarSpeedMult;
    var isSecond = waystarBossHp <= waystarBossMaxHp * 0.75;
    
    if (type === 0) {
        // 🌠 МЕТЕОРНЫЙ ДОЖДЬ
        var count = isSecond ? 5 : 3;
        for (var i = 0; i < count; i++) {
            waystarAttacks.push({
                type: "meteor",
                x: 30 + Math.random() * 340, y: -30,
                vx: (Math.random() - 0.5) * 1.5 * s,
                vy: (2.5 + Math.random() * 1.5) * s,
                size: 10 + Math.random() * 4,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                damage: 10,
                life: 300,
                trail: []
            });
        }
        wsPlaySound(200, 'square', 0.3, 0.1);
    } else if (type === 1) {
        // 💫 ИСПРАВЛЕННОЕ КОЛЬЦО — медленнее, тоньше, с брешью
        var gapAngle = Math.random() * Math.PI * 2;
        var gapSize = Math.PI * 0.7; // 126° — большая брешь чтобы успеть
        waystarAttacks.push({
            type: "ring",
            x: waystarBoss.x, y: waystarBoss.y,
            radius: 15, maxRadius: 380,
            growth: 1.3 * s, // было 2.2 — теперь медленнее
            thickness: 14, // было 20 — тоньше
            damage: 10,
            color: "#ffd700",
            gapAngle: gapAngle,
            gapSize: gapSize,
            bouncesLeft: 0
        });
        wsPlaySound(400, 'sine', 0.4, 0.1);
    } else if (type === 2) {
        // ⚡ ЛАЗЕР С ПРЕДУПРЕЖДЕНИЕМ
        var laserX = 60 + Math.random() * 280;
        waystarAttacks.push({
            type: "laser_warning",
            x: laserX, y: 0,
            width: 40,
            timer: 60,
            damage: 15
        });
        wsPlaySound(300, 'square', 0.3, 0.1);
    } else if (type === 3) {
        // 🌌 СОЗВЕЗДИЕ
        var points = [];
        var count2 = 4 + Math.floor(Math.random() * 2);
        for (var i = 0; i < count2; i++) {
            points.push({
                x: 50 + Math.random() * 300,
                y: 100 + Math.random() * 300
            });
        }
        waystarAttacks.push({
            type: "constellation",
            points: points,
            timer: 200,
            warning: 70,
            damage: 18,
            hit: false
        });
        wsPlaySound(500, 'sine', 0.4, 0.12);
    } else if (type === 4) {
        // 🔵 ПУЛЬС
        waystarAttacks.push({
            type: "pulse",
            x: waystarBoss.x, y: waystarBoss.y,
            radius: 10, maxRadius: 400,
            growth: 1.8 * s,
            thickness: 16,
            damage: 12,
            color: "#ffaa00"
        });
        wsPlaySound(350, 'triangle', 0.4, 0.12);
    }
}

// ========== ПЕРЕХОД НА ФАЗУ 2 ==========
function waystarTriggerSplit() {
    waystarState = "split";
    waystarShake = 40; waystarScreenFlash = 30; waystarScreenFlashColor = "#ffd700";
    wsPlaySound(200, 'sawtooth', 1.5, 0.3);
    setTimeout(function() { wsPlaySound(150, 'sawtooth', 1.2, 0.25); }, 200);
    setTimeout(function() { wsPlaySound(100, 'sawtooth', 1.0, 0.2); }, 500);
    
    for (var i = 0; i < 60; i++) {
        spawnWaystarParticles(200, 100, 1, "#ffd700", 12);
    }
    
    waystarDialogActive = true;
    waystarDialogStep = 0;
    waystarDialogAutoTimer = 0;
    waystarDialogQueue = [
        { speaker: "🌟 Путеводная Звезда", text: "Хм... ты сильнее, чем я думала, мальчик..." },
        { speaker: "🌟 Путеводная Звезда", text: "Но это только начало!" },
        { speaker: "🌟 Путеводная Звезда", text: "Я — ЛЕГИОН! Я — ТЫСЯЧА СОЛНЦ! Я — ВСЯ ВСЕЛЕННАЯ!" },
        { speaker: "🌟 Путеводная Звезда", text: "ГОТОВЬСЯ К НАСТОЯЩЕЙ БИТВЕ!" }
    ];
    for (var i = 0; i < waystarDialogQueue.length; i++) {
        var r = waystarDialogQueue[i];
        r.time = 2 + r.text.length * 0.06;
    }
    
    var totalTime = 0;
    for (var i = 0; i < waystarDialogQueue.length; i++) {
        totalTime += waystarDialogQueue[i].time;
    }
    
    setTimeout(function() {
        if (waystarActive) {
            waystarDialogActive = false;
            waystarTriggerPhase2();
        }
    }, totalTime * 1000 + 800);
}

// ========== ФАЗА 2 — SPACE INVADERS ==========
function waystarTriggerPhase2() {
    waystarState = "phase2";
    waystarAttacks = []; waystarPlayerBullets = [];
    wsPlaySound(300, 'square', 0.5, 0.3);
    
    waystarPieces = [];
    var cols = 6;
    var rows = 5;
    var startX = 60;
    var startY = 60;
    var gapX = 48;
    var gapY = 42;
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            waystarPieces.push({
                x: startX + c * gapX,
                y: startY + r * gapY,
                size: 11,
                hp: 3, maxHp: 3,
                alive: true,
                row: r, col: c,
                pulse: Math.random() * Math.PI * 2
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
    // ★ Стрельба в фазе 2 тоже авто ★
    if (waystarShootCooldown > 0) { waystarShootCooldown--; }
    else {
        waystarShootCooldown = waystarShootInterval;
        waystarPlayerBullets.push({
            x: waystarPlayer.x, y: waystarPlayer.y - 12,
            vy: -9, vx: 0, size: 4,
            damage: 1, life: 80
        });
        wsPlaySound(1100, 'square', 0.04, 0.05);
    }
    
    var alivePieces = waystarPieces.filter(function(p) { return p.alive; });
    if (alivePieces.length === 0) { waystarVictory(); return; }
    
    var speed = waystarInvaderSpeed + (waystarPiecesTotal - alivePieces.length) * 0.15;
    
    var hitEdge = false;
    for (var i = 0; i < waystarPieces.length; i++) {
        var p = waystarPieces[i];
        if (!p.alive) continue;
        p.x += waystarInvaderDir * speed;
        if (p.x - p.size < 10 || p.x + p.size > 390) hitEdge = true;
    }
    
    if (hitEdge) {
        waystarInvaderDir *= -1;
        var dropped = false;
        for (var i = 0; i < waystarPieces.length; i++) {
            var p = waystarPieces[i];
            if (!p.alive) continue;
            p.y += 18;
            if (p.y + p.size > 400 && !dropped) {
                waystarInvadersReachedBottom = true;
                dropped = true;
            }
        }
        wsPlaySound(150, 'square', 0.15, 0.1);
    }
    
    if (waystarInvadersReachedBottom) { waystarDefeat(); return; }
    
    waystarInvaderShootTimer++;
    var shootRate = Math.max(20, 60 - alivePieces.length);
    if (waystarInvaderShootTimer >= shootRate) {
        waystarInvaderShootTimer = 0;
        var shooters = alivePieces.filter(function(p) { return p.y < 350; });
        if (shooters.length > 0) {
            var shooter = shooters[Math.floor(Math.random() * shooters.length)];
            waystarEnemyBullets.push({
                x: shooter.x, y: shooter.y + 15,
                vy: 4 + Math.random() * 2,
                size: 4, life: 200
            });
            wsPlaySound(400, 'sawtooth', 0.1, 0.06);
        }
    }
    
    // Пули игрока
    for (var i = waystarPlayerBullets.length - 1; i >= 0; i--) {
        var b = waystarPlayerBullets[i];
        b.y += b.vy; b.life--;
        if (b.y < -10 || b.life <= 0) { waystarPlayerBullets.splice(i, 1); continue; }
        
        for (var j = 0; j < waystarPieces.length; j++) {
            var p = waystarPieces[j];
            if (!p.alive) continue;
            if (Math.abs(b.x - p.x) < p.size + 4 && Math.abs(b.y - p.y) < p.size + 4) {
                p.hp--;
                wsPlaySound(1200, 'square', 0.08, 0.1);
                spawnWaystarParticles(p.x, p.y, 8, "#ffd700", 4);
                if (p.hp <= 0) {
                    p.alive = false;
                    waystarPiecesAlive--;
                    spawnWaystarParticles(p.x, p.y, 20, "#ffdd00", 6);
                    spawnWaystarParticles(p.x, p.y, 12, "#ff8800", 5);
                    wsPlaySound(200, 'sawtooth', 0.3, 0.15);
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
        if (b.y > 520 || b.life <= 0) { waystarEnemyBullets.splice(i, 1); continue; }
        
        if (waystarInvulnTimer <= 0 && Math.abs(b.x - waystarPlayer.x) < 12 && Math.abs(b.y - waystarPlayer.y) < 14) {
            waystarPlayerHp -= 12;
            waystarInvulnTimer = 45;
            waystarShake = 15;
            waystarScreenFlash = 10; waystarScreenFlashColor = "#ff0000";
            spawnWaystarParticles(waystarPlayer.x, waystarPlayer.y, 15, "#ff3333", 5);
            wsPlaySound(60, 'sawtooth', 0.4, 0.15);
            waystarEnemyBullets.splice(i, 1);
            updateWaystarHpBar();
            if (waystarPlayerHp <= 0) { waystarDefeat(); return; }
        }
    }
    
    for (var i = 0; i < waystarPieces.length; i++) {
        if (waystarPieces[i].alive) waystarPieces[i].pulse += 0.15;
    }
}

// ========== ДВИЖЕНИЕ БОССА ==========
function updateWaystarBoss() {
    if (waystarState !== "phase1") return;
    if (waystarDialogActive) return;
    var speedMult = waystarSpeedMult;
    waystarBoss.x += waystarBoss.vx * speedMult;
    if (waystarBoss.x < 80 || waystarBoss.x > 320) waystarBoss.vx *= -1;
    waystarBoss.rotation += 0.01 * speedMult;
    waystarBoss.pulse += 0.05;
}

// ========== УПРАВЛЕНИЕ ==========
function handleWaystarClick(ev) {
    if (!waystarActive) return;
    if (waystarDialogActive) {
        handleWaystarDialogClick(ev);
    }
}

function handleWaystarDialogClick(ev) {
    if (!waystarChoiceActive) return;
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
}

function handleWaystarTouchStart(ev) {
    if (!waystarActive) return;
    ev.preventDefault();
    var rect = canvas.getBoundingClientRect();
    if (waystarDialogActive && waystarChoiceActive) {
        var t = ev.touches[0];
        handleWaystarDialogClick({ clientX: t.clientX, clientY: t.clientY });
        return;
    }
    if (ev.touches.length > 0) {
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
    var k = ev.key.toLowerCase();
    waystarKeys[k] = true;
}
function handleWaystarKeyUp(ev) {
    var k = ev.key.toLowerCase();
    waystarKeys[k] = false;
}

// ========== ОБНОВЛЕНИЯ ==========
function updateWaystarPlayer() {
    if (waystarState === "phase2") {
        var mx = 0;
        if (waystarKeys.a || waystarKeys.arrowleft) mx -= 1;
        if (waystarKeys.d || waystarKeys.arrowright) mx += 1;
        if (waystarTouchActive) {
            var tx = waystarTouchX - waystarPlayer.x;
            if (Math.abs(tx) > 5) mx = tx > 0 ? 1 : -1;
        }
        waystarPlayer.x += mx * 5;
        waystarPlayer.x = Math.max(20, Math.min(380, waystarPlayer.x));
    } else if (waystarState === "phase1") {
        var mx = 0, my = 0;
        var speed = 3.2;
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

function updateWaystarPlayerBullets() {
    for (var i = waystarPlayerBullets.length - 1; i >= 0; i--) {
        var b = waystarPlayerBullets[i];
        b.y += b.vy; b.x += (b.vx || 0); b.life--;
        
        // Столкновение с боссом (фаза 1)
        if (waystarState === "phase1" && !waystarDialogActive) {
            var dx = b.x - waystarBoss.x;
            var dy = b.y - waystarBoss.y;
            if (Math.sqrt(dx * dx + dy * dy) < waystarBoss.size + b.size) {
                waystarBossHp -= b.damage;
                waystarBossFlash = 5;
                spawnWaystarParticles(b.x, b.y, 8, "#ffd700", 4);
                wsPlaySound(1400, 'square', 0.08, 0.08);
                if (waystarBossHp <= 0 && waystarBossHp > -1000) {
                    // HP не может упасть ниже 1 в фазе 1 (переход на фазу 2)
                    if (waystarBossMaxHp * 0.5 >= waystarBossHp) {
                        waystarBossHp = waystarBossMaxHp * 0.5;
                    }
                }
                waystarPlayerBullets.splice(i, 1);
                continue;
            }
        }
        
        if (b.y < -10 || b.life <= 0) { waystarPlayerBullets.splice(i, 1); continue; }
    }
}

function updateWaystarAttacks() {
    for (var i = waystarAttacks.length - 1; i >= 0; i--) {
        var a = waystarAttacks[i];
        
        if (a.type === "meteor") {
            a.trail.push({ x: a.x, y: a.y, life: 10 });
            if (a.trail.length > 8) a.trail.shift();
            a.x += a.vx; a.y += a.vy; a.rotation += a.rotSpeed; a.life--;
            if (a.y > 520 || a.life <= 0) { waystarAttacks.splice(i, 1); continue; }
            var dx = waystarPlayer.x - a.x, dy = waystarPlayer.y - a.y;
            if (Math.sqrt(dx * dx + dy * dy) < a.size + 8 && waystarInvulnTimer <= 0) {
                applyWaystarHit(a.damage, "МЕТЕОР!");
                waystarAttacks.splice(i, 1);
                continue;
            }
        } else if (a.type === "ring") {
            a.radius += a.growth;
            if (a.radius > a.maxRadius) { waystarAttacks.splice(i, 1); continue; }
            var dx = waystarPlayer.x - a.x, dy = waystarPlayer.y - a.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(dist - a.radius) < a.thickness / 2 + 6 && waystarInvulnTimer <= 0) {
                // Проверка бреши
                var playerAngle = Math.atan2(dy, dx);
                var angleDiff = Math.abs(playerAngle - a.gapAngle);
                while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
                if (angleDiff > a.gapSize / 2) {
                    applyWaystarHit(a.damage, "КОЛЬЦО!");
                }
            }
        } else if (a.type === "laser_warning") {
            a.timer--;
            if (a.timer <= 0) {
                waystarAttacks.splice(i, 1);
                waystarAttacks.push({
                    type: "laser",
                    x: a.x, y: 0, width: a.width,
                    timer: 30,
                    damage: a.damage
                });
                wsPlaySound(150, 'sawtooth', 0.5, 0.15);
            }
        } else if (a.type === "laser") {
            a.timer--;
            if (a.timer <= 0) { waystarAttacks.splice(i, 1); continue; }
            if (waystarInvulnTimer <= 0 && Math.abs(waystarPlayer.x - a.x) < a.width / 2 + 6) {
                applyWaystarHit(a.damage, "ЛАЗЕР!");
            }
        } else if (a.type === "constellation") {
            a.timer--;
            if (a.warning > 0) a.warning--;
            if (a.timer <= 0) { waystarAttacks.splice(i, 1); continue; }
            if (a.warning <= 0 && waystarInvulnTimer <= 0 && !a.hit) {
                for (var p = 0; p < a.points.length - 1; p++) {
                    var p1 = a.points[p], p2 = a.points[p + 1];
                    var d = distToSegment(waystarPlayer.x, waystarPlayer.y, p1.x, p1.y, p2.x, p2.y);
                    if (d < 10) { a.hit = true; applyWaystarHit(a.damage, "СОЗВЕЗДИЕ!"); break; }
                }
            }
        } else if (a.type === "pulse") {
            a.radius += a.growth;
            if (a.radius > a.maxRadius) { waystarAttacks.splice(i, 1); continue; }
            var dx4 = waystarPlayer.x - a.x, dy4 = waystarPlayer.y - a.y;
            var d4 = Math.sqrt(dx4 * dx4 + dy4 * dy4);
            if (Math.abs(d4 - a.radius) < a.thickness / 2 + 6 && waystarInvulnTimer <= 0) {
                applyWaystarHit(a.damage, "ПУЛЬС!");
            }
        }
    }
}

function distToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    var t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    var projX = x1 + t * dx, projY = y1 + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

function applyWaystarHit(dmg, textMsg) {
    if (waystarInvulnTimer > 0) return;
    waystarPlayerHp -= dmg;
    waystarInvulnTimer = 40;
    waystarShake = 12;
    waystarScreenFlash = 8; waystarScreenFlashColor = "#ff0000";
    spawnWaystarParticles(waystarPlayer.x, waystarPlayer.y, 20, "#ff3333", 6);
    if (textMsg && typeof showFloatingText === 'function') showFloatingText(textMsg, "#ff3333");
    wsPlaySound(80, 'sawtooth', 0.4, 0.15);
    updateWaystarHpBar();
    if (waystarPlayerHp <= 0) waystarDefeat();
}

function updateWaystarHpBar() {
    var el = document.getElementById("arenaHP");
    if (el) el.innerText = Math.max(0, Math.ceil(waystarPlayerHp));
}

function spawnWaystarParticles(x, y, count, color, speed) {
    for (var i = 0; i < count; i++) {
        var a = Math.random() * Math.PI * 2;
        var s = speed * (0.5 + Math.random());
        waystarParticles.push({
            x: x, y: y,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life: 25 + Math.random() * 20, maxLife: 45,
            color: color, size: 1.5 + Math.random() * 3
        });
    }
}

// ========== ПОБЕДА / ПОРАЖЕНИЕ ==========
function waystarVictory() {
    if (waystarRewardGiven) return;
    waystarRewardGiven = true;
    waystarState = "victory";
    wsPlaySound(500, 'sine', 0.6, 0.2);
    setTimeout(function() { wsPlaySound(700, 'sine', 0.6, 0.2); }, 200);
    setTimeout(function() { wsPlaySound(1000, 'sine', 0.8, 0.25); }, 400);
    setTimeout(function() { wsPlaySound(1400, 'sine', 1.0, 0.3); }, 700);
    
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
        if (!defeatedBosses.includes(500)) {
            defeatedBosses.push(500);
            if (typeof saveAll === 'function') saveAll();
        }
    }
    
    if (typeof addItem === 'function') addItem("waystar", 1);
    if (typeof secretGachaTokens !== 'undefined') secretGachaTokens = (secretGachaTokens || 0) + 1;
    if (typeof saveAll === 'function') saveAll();
    
    for (var i = 0; i < 100; i++) {
        spawnWaystarParticles(200 + (Math.random() - 0.5) * 300, 250 + (Math.random() - 0.5) * 200, 1, ["#ffd700", "#ffffff", "#ff8800"][Math.floor(Math.random() * 3)], 8);
    }
    
    if (typeof showFloatingText === 'function') showFloatingText("⭐ ПОБЕДА! ⭐", "#ffd700");
    setTimeout(function() { if (typeof showFloatingText === 'function') showFloatingText("🌟 Путеводная Звезда получена!", "#ffd700"); }, 500);
    setTimeout(function() { if (typeof showFloatingText === 'function') showFloatingText("💎 +1 СЕКРЕТНЫЙ ТОКЕН", "#ff00ff"); }, 1200);
    
    setTimeout(function() {
        stopWaystarFight();
        if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
        if (typeof victory === 'function') victory();
    }, 2800);
}

function waystarDefeat() {
    waystarState = "defeat";
    if (typeof showFloatingText === 'function') showFloatingText("ТЫ ПАЛ...", "#ff0000");
    wsPlaySound(40, 'sawtooth', 2.0, 0.3);
    setTimeout(function() {
        stopWaystarFight();
        if (typeof playerHp !== 'undefined') playerHp = 0;
        if (typeof defeat === 'function') defeat();
    }, 2500);
}

// ========== РЕНДЕР-ЛУП ==========
function waystarRenderLoop() {
    if (!waystarActive) return;
    if (typeof ctx === 'undefined' || !ctx) return;
    if (typeof canvas === 'undefined' || !canvas) return;
    
    if (typeof waystarDialogAutoTimer === 'undefined') waystarDialogAutoTimer = 0;
    
    if (!waystarDialogActive) {
        if (waystarState === "phase1") {
            // Проверка перехода в фазу 2 (50% HP)
            if (waystarBossHp <= waystarBossMaxHp * 0.5 && waystarPieces.length === 0) {
                waystarTriggerSplit();
            } else {
                updateWaystarPlayer();
                updateWaystarShooting();
                updateWaystarPlayerBullets();
                updateWaystarBoss();
                updateWaystarAttacks();
                waystarAttackTimer++;
                var attackRate = Math.floor(50 / waystarSpeedMult);
                if (waystarAttackTimer >= attackRate) {
                    waystarAttackTimer = 0;
                    waystarSpawnAttack();
                }
                waystarTypeTimer--;
                if (waystarTypeTimer <= 0) {
                    waystarAttackType = Math.floor(Math.random() * 5);
                    waystarTypeTimer = Math.floor(250 + Math.random() * 200);
                    var typeNames = ["МЕТЕОРЫ", "КОЛЬЦО", "ЛАЗЕР", "СОЗВЕЗДИЕ", "ПУЛЬС"];
                    spawnWaystarText(200, 60, typeNames[waystarAttackType], "#888888", 60);
                }
            }
        } else if (waystarState === "phase2") {
            updateWaystarPlayer();
            updateWaystarSpaceInvaders();
        }
    } else {
        // Диалог
        waystarBoss.rotation += 0.01;
        waystarBoss.pulse += 0.05;
        
        var current = waystarDialogQueue[waystarDialogStep];
        if (current && current.choice && !waystarChoiceResolved) {
            waystarChoiceActive = true;
        }
        
        if (!waystarChoiceActive) {
            waystarDialogAutoTimer++;
            if (current && waystarDialogAutoTimer > current.time * 60) {
                waystarDialogAutoTimer = 0;
                waystarDialogStep++;
                if (waystarDialogStep >= waystarDialogQueue.length) {
                    waystarDialogActive = false;
                    waystarState = "phase1";
                }
            }
        }
    }
    
    if (waystarShake > 0.1) waystarShake *= 0.9;
    if (waystarScreenFlash > 0) waystarScreenFlash--;
    if (waystarBossFlash > 0) waystarBossFlash--;
    
    for (var i = waystarParticles.length - 1; i >= 0; i--) {
        var p = waystarParticles[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life--;
        if (p.life <= 0) waystarParticles.splice(i, 1);
    }
    for (var i = waystarTexts.length - 1; i >= 0; i--) {
        var t = waystarTexts[i];
        t.y += t.vy; t.life--;
        if (t.life <= 0) waystarTexts.splice(i, 1);
    }
    
    // Отрисовка
    ctx.save();
    if (waystarShake > 0.5) {
        ctx.translate((Math.random() - 0.5) * waystarShake, (Math.random() - 0.5) * waystarShake);
    }
    ctx.clearRect(-20, -20, 440, 540);
    
    var bg = ctx.createLinearGradient(0, 0, 0, 500);
    bg.addColorStop(0, "#0a0020");
    bg.addColorStop(0.5, "#150030");
    bg.addColorStop(1, "#000010");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 400, 500);
    
    // Звёзды фона
    for (var i = 0; i < waystarBgStars.length; i++) {
        var s = waystarBgStars[i];
        s.twinkle += 0.05;
        var a = s.alpha * (0.7 + Math.sin(s.twinkle) * 0.3);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    if (waystarScreenFlash > 0) {
        ctx.globalAlpha = waystarScreenFlash / 30;
        ctx.fillStyle = waystarScreenFlashColor;
        ctx.fillRect(0, 0, 400, 500);
        ctx.globalAlpha = 1;
    }
    
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 496);
    
    // Рендер
    if (waystarState === "phase1" || waystarDialogActive || waystarState === "split") {
        drawWaystarBoss();
        drawWaystarPhase1Attacks();
        drawWaystarPlayerBullets();
    } else if (waystarState === "phase2") {
        drawWaystarPieces();
        drawWaystarEnemyBullets();
        drawWaystarPlayerBullets();
    }
    
    if (waystarState === "phase1" || waystarState === "phase2") {
        drawWaystarPlayer();
    }
    
    // Частицы
    for (var i = 0; i < waystarParticles.length; i++) {
        var p = waystarParticles[i];
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Тексты
    for (var i = 0; i < waystarTexts.length; i++) {
        var t = waystarTexts[i];
        ctx.globalAlpha = Math.min(1, t.life / 30);
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    
    if (!waystarDialogActive) drawWaystarHpBars();
    if (waystarDialogActive) drawWaystarDialog();
    
    // Подсказки
    if (!waystarDialogActive && waystarState === "phase1") {
        ctx.save();
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,215,0,0.7)";
        ctx.fillText("⌨️ WASD — двигаться | 🔫 Авто-стрельба", 200, 495);
        ctx.restore();
    } else if (waystarState === "phase2") {
        ctx.save();
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,215,0,0.7)";
        ctx.fillText("← → двигаться | 🔫 Авто-стрельба", 200, 495);
        ctx.restore();
    }
    
    ctx.restore();
    waystarAnimFrame = requestAnimationFrame(waystarRenderLoop);
}

function spawnWaystarText(x, y, text, color, life) {
    waystarTexts.push({ x: x, y: y, text: text, color: color, life: life || 60, vy: -0.3 });
}

// ========== ОТРИСОВКА ==========
function drawWaystarBoss() {
    var b = waystarBoss;
    var pulse = 1 + Math.sin(b.pulse) * 0.1;
    var size = b.size * pulse;
    
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);
    
    var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 3);
    if (waystarBossFlash > 0) {
        glow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        glow.addColorStop(0.4, "rgba(255, 200, 100, 0.6)");
    } else {
        glow.addColorStop(0, "rgba(255, 215, 0, 0.9)");
        glow.addColorStop(0.4, "rgba(255, 170, 0, 0.5)");
    }
    glow.addColorStop(1, "rgba(255, 100, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = waystarBossFlash > 0 ? "#ffffff" : "#ffd700";
    ctx.beginPath();
    for (var i = 0; i < 16; i++) {
        var ang = (i / 16) * Math.PI * 2 - Math.PI / 2;
        var r = (i % 2 === 0) ? size : size * 0.45;
        var px = Math.cos(ang) * r;
        var py = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#fff8dc";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = "#fff8dc";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawWaystarPlayer() {
    if (waystarInvulnTimer > 0 && Math.floor(waystarInvulnTimer / 4) % 2 === 0) return;
    ctx.save();
    ctx.translate(waystarPlayer.x, waystarPlayer.y);
    var glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    glow.addColorStop(0, "rgba(255,100,100,0.6)");
    glow.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff2222";
    var hs = 11;
    ctx.beginPath();
    ctx.moveTo(0, hs * 0.7);
    ctx.bezierCurveTo(-hs * 1.3, -hs * 0.2, -hs * 0.7, -hs, 0, -hs * 0.3);
    ctx.bezierCurveTo(hs * 0.7, -hs, hs * 1.3, -hs * 0.2, 0, hs * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawWaystarPlayerBullets() {
    for (var i = 0; i < waystarPlayerBullets.length; i++) {
        var b = waystarPlayerBullets[i];
        ctx.save();
        var glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2);
        glow.addColorStop(0, "#ffffff");
        glow.addColorStop(0.5, "#00ffff");
        glow.addColorStop(1, "rgba(0, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawWaystarEnemyBullets() {
    for (var i = 0; i < waystarEnemyBullets.length; i++) {
        var b = waystarEnemyBullets[i];
        ctx.save();
        ctx.fillStyle = "#ff4444";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawWaystarPhase1Attacks() {
    for (var i = 0; i < waystarAttacks.length; i++) {
        var a = waystarAttacks[i];
        
        if (a.type === "meteor") {
            for (var j = 0; j < a.trail.length; j++) {
                var tr = a.trail[j];
                var alpha = (1 - j / a.trail.length) * 0.6;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = "#ff8800";
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, a.size * (1 - j / a.trail.length) * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation);
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.arc(0, 0, a.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff8dc";
            ctx.beginPath();
            ctx.arc(0, 0, a.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (a.type === "ring") {
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - a.radius / a.maxRadius);
            ctx.strokeStyle = a.color;
            ctx.lineWidth = a.thickness;
            ctx.shadowColor = a.color;
            ctx.shadowBlur = 15;
            // Кольцо с брешью
            var startAngle = a.gapAngle + a.gapSize / 2;
            var endAngle = a.gapAngle + Math.PI * 2 - a.gapSize / 2;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, startAngle, endAngle);
            ctx.stroke();
            // Подсветка бреши (зелёная зона — безопасно)
            ctx.globalAlpha = Math.max(0, 1 - a.radius / a.maxRadius) * 0.3;
            ctx.strokeStyle = "#00ff66";
            ctx.lineWidth = a.thickness * 0.8;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, a.gapAngle - a.gapSize / 2, a.gapAngle + a.gapSize / 2);
            ctx.stroke();
            ctx.restore();
        } else if (a.type === "laser_warning") {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 100) * 0.2;
            ctx.fillStyle = "#ff3333";
            ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.strokeRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.restore();
        } else if (a.type === "laser") {
            ctx.save();
            ctx.globalAlpha = Math.min(1, a.timer / 30);
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 30;
            ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(a.x - a.width / 3, 0, a.width * 2 / 3, 500);
            ctx.restore();
        } else if (a.type === "constellation") {
            ctx.save();
            var isWarning = a.warning > 0;
            ctx.globalAlpha = isWarning ? 0.3 + Math.sin(performance.now() / 100) * 0.2 : 1;
            ctx.strokeStyle = isWarning ? "#ff3333" : "#ffd700";
            ctx.lineWidth = isWarning ? 2 : 5;
            if (isWarning) ctx.setLineDash([6, 4]);
            ctx.shadowColor = isWarning ? "#ff3333" : "#ffd700";
            ctx.shadowBlur = isWarning ? 10 : 20;
            ctx.beginPath();
            for (var p = 0; p < a.points.length; p++) {
                if (p === 0) ctx.moveTo(a.points[p].x, a.points[p].y);
                else ctx.lineTo(a.points[p].x, a.points[p].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            for (var p = 0; p < a.points.length; p++) {
                ctx.fillStyle = isWarning ? "#ff3333" : "#ffd700";
                ctx.beginPath();
                ctx.arc(a.points[p].x, a.points[p].y, isWarning ? 4 : 7, 0, Math.PI * 2);
                ctx.fill();
                // Мерцание в виде звезды
                if (!isWarning) {
                    ctx.strokeStyle = "#fff8dc";
                    ctx.lineWidth = 1;
                    for (var k = 0; k < 4; k++) {
                        var ang = (k / 4) * Math.PI * 2;
                        ctx.beginPath();
                        ctx.moveTo(a.points[p].x + Math.cos(ang) * 4, a.points[p].y + Math.sin(ang) * 4);
                        ctx.lineTo(a.points[p].x + Math.cos(ang) * 10, a.points[p].y + Math.sin(ang) * 10);
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();
        } else if (a.type === "pulse") {
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - a.radius / a.maxRadius);
            ctx.strokeStyle = a.color;
            ctx.lineWidth = a.thickness;
            ctx.shadowColor = a.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

function drawWaystarPieces() {
    for (var i = 0; i < waystarPieces.length; i++) {
        var p = waystarPieces[i];
        if (!p.alive) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        var pulse = 1 + Math.sin(p.pulse) * 0.1;
        ctx.scale(pulse, pulse);
        var glow = ctx.createRadialGradient(0, 0, 2, 0, 0, p.size * 2);
        glow.addColorStop(0, "rgba(255, 215, 0, 0.8)");
        glow.addColorStop(1, "rgba(255, 100, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.hp === 3 ? "#ffd700" : p.hp === 2 ? "#ff8800" : "#ff4400";
        ctx.beginPath();
        for (var k = 0; k < 10; k++) {
            var ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
            var r = (k % 2 === 0) ? p.size : p.size * 0.5;
            var px = Math.cos(ang) * r;
            var py = Math.sin(ang) * r;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#fff8dc";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

function drawWaystarHpBars() {
    var barW = 360, barH = 14, x = 20, y = 6;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 4, y - 4, barW + 8, barH + 8);
    ctx.fillStyle = "#1a1000";
    ctx.fillRect(x, y, barW, barH);
    
    if (waystarState === "phase2") {
        var ratio = waystarPiecesAlive / waystarPiecesTotal;
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, barW * ratio, barH);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 3;
        ctx.fillText("🌟 " + waystarPiecesAlive + " / " + waystarPiecesTotal + " осколков", x + barW / 2, y + barH - 3);
    } else {
        var ratio = Math.max(0, waystarBossHp / waystarBossMaxHp);
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, barW * ratio, barH);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 3;
        ctx.fillText("🌟 " + Math.ceil(waystarBossHp) + " / " + Math.ceil(waystarBossMaxHp), x + barW / 2, y + barH - 3);
    }
    ctx.restore();
    
    // HP игрока
    var y2 = 478;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 4, y2 - 4, barW + 8, 20);
    ctx.fillStyle = "#2a0000";
    ctx.fillRect(x, y2, barW, 12);
    var r2 = Math.max(0, waystarPlayerHp / waystarPlayerMaxHp);
    ctx.fillStyle = r2 > 0.3 ? "#00ff66" : "#ff3333";
    ctx.shadowColor = r2 > 0.3 ? "#00ff66" : "#ff3333";
    ctx.shadowBlur = 8;
    ctx.fillRect(x, y2, barW * r2, 12);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y2, barW, 12);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 3;
    ctx.fillText(Math.ceil(waystarPlayerHp) + " / " + waystarPlayerMaxHp, x + barW / 2, y2 + 10);
    ctx.restore();
}

function drawWaystarDialog() {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, 400, 500);
    
    // Портрет звезды
    ctx.save();
    ctx.translate(200, 80);
    var t = performance.now() / 1000;
    var pulse = 1 + Math.sin(t * 2) * 0.15;
    ctx.scale(pulse, pulse);
    var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 60);
    glow.addColorStop(0, "rgba(255, 215, 0, 0.9)");
    glow.addColorStop(0.5, "rgba(255, 170, 0, 0.5)");
    glow.addColorStop(1, "rgba(255, 100, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    for (var i = 0; i < 16; i++) {
        var ang = (i / 16) * Math.PI * 2 - Math.PI / 2;
        var r = (i % 2 === 0) ? 40 : 18;
        var px = Math.cos(ang) * r;
        var py = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff8dc";
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    var current = waystarDialogQueue[waystarDialogStep];
    if (current) {
        ctx.font = "bold 14px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffd700";
        ctx.fillText(current.speaker, 200, 170);
        
        ctx.font = "bold 15px Nunito, sans-serif";
        ctx.fillStyle = "#ffffff";
        var lines = wrapText(current.text, 360, ctx);
        for (var i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], 200, 200 + i * 22);
        }
    }
    
    if (waystarChoiceActive && !waystarChoiceResolved) {
        var choices = getWaystarChoices();
        var btnW = 360, btnX = 20, startY = 240, btnH = 55, gap = 12;
        for (var i = 0; i < choices.length; i++) {
            var btnY = startY + i * (btnH + gap);
            ctx.fillStyle = "rgba(44,44,58,0.95)";
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (ctx.roundRect) { ctx.roundRect(btnX, btnY, btnW, btnH, 10); }
            else { ctx.rect(btnX, btnY, btnW, btnH); }
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#ffd700";
            ctx.font = "bold 14px Nunito, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText((i+1) + ".", btnX + 10, btnY + 22);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Nunito, sans-serif";
            var lines = wrapText(choices[i].text, btnW - 45, ctx);
            for (var li = 0; li < Math.min(lines.length, 3); li++) {
                ctx.fillText(lines[li], btnX + 32, btnY + 20 + li * 15);
            }
        }
    }
    
    ctx.restore();
}

function wrapText(text, maxWidth, ctx) {
    var words = text.split(' ');
    var lines = [];
    var currentLine = '';
    for (var i = 0; i < words.length; i++) {
        var testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        var metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

// ========== ЭКСПОРТ ==========
window.startWaystarFight = startWaystarFight;
window.stopWaystarFight = stopWaystarFight;
window.damageWaystarBoss = function(dmg) { if (waystarState === "phase1") waystarBossHp -= dmg; };
console.log("[WAYSTAR] v2.0 — авто-стрельба + музыка + копия структуры Камня");
