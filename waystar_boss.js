// ============================================================
// ПУТЕВОДНАЯ ЗВЕЗДА — БОСС 500 ВОЛНЫ v1.2
// Фикс: waystarDialogAutoTimer
// ============================================================

let waystarActive = false;
let waystarState = "phase1";
let waystarBoss = { x: 200, y: 120, size: 55, rotation: 0, pulse: 0 };
let waystarPlayer = { x: 200, y: 430 };
let waystarBossHp = 0;
let waystarBossMaxHp = 0;
let waystarPlayerHp = 200;
let waystarPlayerMaxHp = 200;
let waystarAttacks = [];
let waystarParticles = [];
let waystarTexts = [];
let waystarAttackTimer = 0;
let waystarAttackType = 0;
let waystarTypeTimer = 0;
let waystarInvulnTimer = 0;
let waystarShake = 0;
let waystarScreenFlash = 0;
let waystarScreenFlashColor = "#ffffff";
let waystarBossFlash = 0;
let waystarAnimFrame = null;
let waystarBgStars = [];
let waystarSpeedMult = 0.6;
let waystarTouchActive = false, waystarTouchId = null, waystarTouchX = 0, waystarTouchY = 0;
let waystarKeys = {};

// ★ ДИАЛОГ ★
let waystarDialogActive = false;
let waystarDialogStep = 0;
let waystarDialogQueue = [];
let waystarChoiceActive = false;
let waystarChoiceResolved = false;
let waystarDialogAutoTimer = 0;

// ★ SPACE INVADERS ★
let waystarPieces = [];
let waystarPlayerBullets = [];
let waystarEnemyBullets = [];
let waystarInvaderDir = 1;
let waystarInvaderSpeed = 0.9;
let waystarInvaderDropTimer = 0;
let waystarInvaderShootTimer = 0;
let waystarPlayerShootCooldown = 0;
let waystarInvadersReachedBottom = false;
let waystarPiecesTotal = 30;
let waystarPiecesAlive = 30;
let waystarPlayerLives = 3;

// ★ НАГРАДА ★
let waystarRewardGiven = false;

// ========== ЗВУКИ ==========
function wsPlaySound(freq, type, dur, vol) {
    if (typeof playArenaSound === 'function') playArenaSound(freq, type, dur, vol);
}

// ========== СТАРТ БОЯ ==========
function startWaystarFight() {
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(500)) {
        if (typeof showFloatingText === 'function') showFloatingText("⏭️ Путеводная Звезда уже побеждена!", "#ffaa00");
        return;
    }
    waystarActive = true;
    waystarState = "dialogue";
    waystarBossMaxHp = 250000;
    waystarBossHp = waystarBossMaxHp;
    waystarBoss = { x: 200, y: 120, size: 55, rotation: 0, pulse: 0 };
    waystarPlayer = { x: 200, y: 430 };
    waystarPlayerHp = 200;
    waystarPlayerMaxHp = 200;
    waystarInvulnTimer = 0;
    waystarAttacks = []; waystarParticles = []; waystarTexts = [];
    waystarAttackTimer = 0; waystarAttackType = 0; waystarTypeTimer = 300;
    waystarShake = 0; waystarScreenFlash = 0; waystarBossFlash = 0;
    waystarPieces = []; waystarPlayerBullets = []; waystarEnemyBullets = [];
    waystarInvaderDir = 1; waystarInvaderDropTimer = 0; waystarInvaderShootTimer = 0;
    waystarPlayerShootCooldown = 0; waystarInvadersReachedBottom = false;
    waystarPiecesTotal = 30; waystarPiecesAlive = 30; waystarPlayerLives = 3;
    waystarRewardGiven = false;
    waystarTouchActive = false; waystarTouchId = null;
    waystarKeys = {};
    // ★ ВАЖНО: сброс таймера диалога ★
    waystarDialogActive = true;
    waystarDialogStep = 0;
    waystarChoiceActive = false;
    waystarChoiceResolved = false;
    waystarDialogAutoTimer = 0;
    
    initWaystarBgStars();
    if (typeof stopAllMusic === 'function') stopAllMusic();
    
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
    if (waystarAnimFrame) { cancelAnimationFrame(waystarAnimFrame); waystarAnimFrame = null; }
    waystarAttacks = []; waystarParticles = []; waystarTexts = [];
    waystarPieces = []; waystarPlayerBullets = []; waystarEnemyBullets = [];
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
    var count = 80;
    for (var i = 0; i < count; i++) {
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
        { speaker: "🌟 Путеводная Звезда", text: "СТОЙ, ПУТНИК...", time: 3 },
        { speaker: "🌟 Путеводная Звезда", text: "Я — ПУТЕВОДНАЯ ЗВЕЗДА. Древнее существо, что освещает путь заблудшим в бескрайней тьме космоса.", time: 4.5 },
        { speaker: "🌟 Путеводная Звезда", text: "Ты проделал долгий путь. Пятьсот волн. Ты убивал. Ты собирал. Ты рос. Ты становился сильнее с каждым ударом.", time: 4.5 },
        { speaker: "🌟 Путеводная Звезда", text: "Но ЗАЧЕМ? Что движет тобой? Что ты ищешь здесь, среди обломков мультивселенной?", time: 4 },
        { speaker: "🌟 Путеводная Звезда", text: "Я чувствую... боль. Гнев. Что-то горит в твоей душе ярче любого солнца.", time: 4 },
        { speaker: "🌟 Путеводная Звезда", text: "Рик...", time: 2 },
        { speaker: "🌟 Путеводная Звезда", text: "Он тот, кто всё испортил. Тот, кто разорвал ткань реальности на осколки. Тот, кто создал этот... этот цирк.", time: 5 },
        { speaker: "🌟 Путеводная Звезда", text: "Не знаю, зачем тебе эта информация, но по твоим глазам видно, что ты жаждешь мести.", time: 4.5 },
        { speaker: "🌟 Путеводная Звезда", text: "Но кто это? Кому ты так хочешь отомстить?", time: 3, choice: true }
    ];
}

function getWaystarChoices() {
    return [
        { id: 1, text: "Тебя это не касается! Ты тут не причем.", response: "Хорошо, то я думал, что ты пришёл за мной. В любом случае битва неизбежна." },
        { id: 2, text: "Это значит Рик... Я отомщу ему...!", response: "Да, это он. Но чтобы пройти дальше, ты должен победить меня. Я же не дам какому-то мальчишке просто так попасть в сломанную часть космоса?" },
        { id: 3, text: "Ебать, даже звезда разговаривает. Прямо как тот камень. Живой камень.", response: "Живой камень? Ты его знаешь? Да я сам удивлён, как обычный камень ЖИВОЙ. Видимо он тот, кто пропитался силой и энергией звёзд. Но я буду сильнее, чем он!!!" }
    ];
}

function selectWaystarChoice(choiceId) {
    if (waystarChoiceResolved) return;
    waystarChoiceResolved = true;
    waystarChoiceActive = false;
    var choices = getWaystarChoices();
    var c = choices.find(function(x) { return x.id === choiceId; });
    if (!c) return;
    waystarDialogQueue.push({ speaker: "🌟 Путеводная Звезда", text: c.response, time: 5 });
    waystarDialogQueue.push({ speaker: "🌟 Путеводная Звезда", text: "Достаточно разговоров. Покажи мне свою силу!", time: 3 });
    waystarDialogQueue.push({ speaker: "🌟 Путеводная Звезда", text: "Или я раздавлю тебя, как остальных!", time: 3 });
    waystarDialogQueue.push({ speaker: "🌟 Путеводная Звезда", text: "МУЛЬТИВСЕЛЕННАЯ НЕ ПРОЩАЕТ СЛАБЫХ!", time: 3.5 });
    waystarDialogStep++;
    waystarDialogAutoTimer = 0;
    wsPlaySound(600, 'square', 0.3, 0.2);
}

// ========== ФАЗА 1 — АТАКИ ==========
function waystarSpawnAttack() {
    var type = waystarAttackType;
    var s = waystarSpeedMult;
    var isSecond = waystarBossHp <= waystarBossMaxHp * 0.75;
    
    if (type === 0) {
        var count = isSecond ? 6 : 4;
        for (var i = 0; i < count; i++) {
            waystarAttacks.push({
                type: "meteor",
                x: 20 + Math.random() * 360, y: -30,
                vx: (Math.random() - 0.5) * 1.5 * s,
                vy: (2.5 + Math.random() * 1.5) * s,
                size: 8 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                damage: 8,
                life: 300,
                trail: []
            });
        }
        wsPlaySound(200, 'square', 0.3, 0.1);
    } else if (type === 1) {
        waystarAttacks.push({
            type: "beam",
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() > 0.5 ? 1 : -1) * 0.02 * s,
            width: 30,
            timer: 240,
            damage: 12,
            warning: 40
        });
        wsPlaySound(800, 'sine', 0.5, 0.15);
    } else if (type === 2) {
        var side = Math.floor(Math.random() * 4);
        var x, y, vx, vy;
        if (side === 0) { x = -30; y = 80 + Math.random() * 300; vx = 3 * s; vy = 0; }
        else if (side === 1) { x = 430; y = 80 + Math.random() * 300; vx = -3 * s; vy = 0; }
        else if (side === 2) { x = 100 + Math.random() * 200; y = -30; vx = 0; vy = 2.5 * s; }
        else { x = 100 + Math.random() * 200; y = 530; vx = 0; vy = -2.5 * s; }
        waystarAttacks.push({
            type: "comet",
            x: x, y: y, vx: vx, vy: vy,
            size: 14, damage: 15, life: 400, trail: []
        });
        wsPlaySound(150, 'sawtooth', 0.6, 0.15);
    } else if (type === 3) {
        var points = [];
        var count2 = 4 + Math.floor(Math.random() * 3);
        for (var i = 0; i < count2; i++) {
            points.push({
                x: 60 + Math.random() * 280,
                y: 100 + Math.random() * 300
            });
        }
        waystarAttacks.push({
            type: "constellation",
            points: points,
            timer: 180,
            warning: 60,
            damage: 18,
            hit: false
        });
        wsPlaySound(500, 'sine', 0.4, 0.12);
    } else if (type === 4) {
        waystarAttacks.push({
            type: "pulse",
            x: 200, y: 250,
            radius: 10, maxRadius: 380,
            growth: 2.2 * s,
            thickness: 20,
            damage: 10,
            color: "#ffd700"
        });
        wsPlaySound(400, 'triangle', 0.4, 0.15);
    }
}

function waystarTriggerSplit() {
    waystarState = "split";
    waystarShake = 40; waystarScreenFlash = 30; waystarScreenFlashColor = "#ffd700";
    wsPlaySound(200, 'sawtooth', 1.5, 0.3);
    setTimeout(function() { wsPlaySound(150, 'sawtooth', 1.2, 0.25); }, 200);
    setTimeout(function() { wsPlaySound(100, 'sawtooth', 1.0, 0.2); }, 500);
    
    for (var i = 0; i < 60; i++) {
        spawnWaystarParticles(200, 120, 1, "#ffd700", 12);
    }
    
    waystarDialogActive = true;
    waystarDialogStep = 0;
    waystarDialogAutoTimer = 0;
    waystarDialogQueue = [
        { speaker: "🌟 Путеводная Звезда", text: "Хм... ты сильнее, чем я думала, мальчик...", time: 3.5 },
        { speaker: "🌟 Путеводная Звезда", text: "Но это только начало!", time: 2.5 },
        { speaker: "🌟 Путеводная Звезда", text: "Я — ЛЕГИОН! Я — ТЫСЯЧА СОЛНЦ! Я — ВСЯ ВСЕЛЕННАЯ!", time: 4.5 },
        { speaker: "🌟 Путеводная Звезда", text: "ГОТОВЬСЯ К НАСТОЯЩЕЙ БИТВЕ!", time: 3 }
    ];
    
    setTimeout(function() {
        if (waystarActive) {
            waystarDialogActive = false;
            waystarTriggerPhase2();
        }
    }, 14000);
}

// ========== ФАЗА 2 — SPACE INVADERS ==========
function waystarTriggerPhase2() {
    waystarState = "phase2";
    waystarAttacks = [];
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
                homeX: startX + c * gapX,
                homeY: startY + r * gapY,
                size: 11,
                hp: 3,
                maxHp: 3,
                alive: true,
                row: r, col: c,
                pulse: Math.random() * Math.PI * 2,
                shootCd: 100 + Math.floor(Math.random() * 200)
            });
        }
    }
    waystarPiecesTotal = waystarPieces.length;
    waystarPiecesAlive = waystarPieces.length;
    waystarInvaderDir = 1;
    waystarPlayerBullets = [];
    waystarEnemyBullets = [];
    waystarPlayer = { x: 200, y: 450 };
    waystarPlayerShootCooldown = 0;
    waystarPlayerLives = 3;
    waystarInvadersReachedBottom = false;
    waystarInvaderShootTimer = 0;
    waystarInvaderDropTimer = 0;
    
    if (typeof showFloatingText === 'function') showFloatingText("⭐ 30 ОСКОЛКОВ! ⭐", "#ffd700");
}

function waystarPlayerShoot() {
    if (waystarState !== "phase2" || waystarPlayerShootCooldown > 0) return;
    waystarPlayerShootCooldown = 12;
    waystarPlayerBullets.push({
        x: waystarPlayer.x,
        y: waystarPlayer.y - 15,
        vy: -8,
        size: 3,
        damage: 1,
        life: 60
    });
    wsPlaySound(900, 'square', 0.06, 0.08);
}

function updateWaystarSpaceInvaders() {
    if (waystarPlayerShootCooldown > 0) waystarPlayerShootCooldown--;
    
    var alivePieces = waystarPieces.filter(function(p) { return p.alive; });
    if (alivePieces.length === 0) {
        waystarVictory();
        return;
    }
    
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
    
    if (waystarInvadersReachedBottom) {
        waystarDefeat();
        return;
    }
    
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
                size: 4,
                life: 200
            });
            wsPlaySound(400, 'sawtooth', 0.1, 0.06);
        }
    }
    
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

// ========== УПРАВЛЕНИЕ ==========
function handleWaystarClick(ev) {
    if (!waystarActive) return;
    if (waystarDialogActive) {
        handleWaystarDialogClick(ev);
        return;
    }
    if (waystarState === "phase2") {
        waystarPlayerShoot();
    }
}

function handleWaystarDialogClick(ev) {
    if (!waystarChoiceActive) return;
    var rect = canvas.getBoundingClientRect();
    var mx = ev.clientX - rect.left;
    var my = ev.clientY - rect.top;
    var btnW = 320, btnH = 40;
    var btnX = 40, startY = 260;
    for (var i = 0; i < 3; i++) {
        var by = startY + i * (btnH + 10);
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
    if (ev.touches.length > 0 && waystarState === "phase2") {
        waystarTouchActive = true;
        waystarTouchId = ev.touches[0].identifier;
        waystarTouchX = ev.touches[0].clientX - rect.left;
        waystarTouchY = ev.touches[0].clientY - rect.top;
        waystarPlayerShoot();
    } else if (ev.touches.length > 0 && waystarState === "phase1") {
        if (ev.touches.length > 0 && !waystarTouchActive) {
            waystarTouchActive = true;
            waystarTouchId = ev.touches[0].identifier;
            waystarTouchX = ev.touches[0].clientX - rect.left;
            waystarTouchY = ev.touches[0].clientY - rect.top;
        }
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
    if (k === " " || k === "enter") {
        if (waystarState === "phase2") waystarPlayerShoot();
    }
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
        } else if (a.type === "beam") {
            a.timer--;
            if (a.warning > 0) a.warning--;
            else a.angle += a.rotSpeed;
            if (a.timer <= 0) { waystarAttacks.splice(i, 1); continue; }
            if (a.warning <= 0 && waystarInvulnTimer <= 0) {
                var dx2 = waystarPlayer.x - 200;
                var dy2 = waystarPlayer.y - 120;
                var dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                var playerAngle = Math.atan2(dy2, dx2);
                var angleDiff = Math.abs(playerAngle - a.angle);
                while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
                var perpDist = Math.abs(Math.sin(angleDiff)) * dist;
                if (perpDist < a.width / 2 + 6) {
                    applyWaystarHit(a.damage, "ЛУЧ!");
                }
            }
        } else if (a.type === "comet") {
            a.trail.push({ x: a.x, y: a.y, life: 15 });
            if (a.trail.length > 10) a.trail.shift();
            a.x += a.vx; a.y += a.vy; a.life--;
            if (a.x < -60 || a.x > 460 || a.y < -60 || a.y > 560 || a.life <= 0) {
                waystarAttacks.splice(i, 1); continue;
            }
            var dx3 = waystarPlayer.x - a.x, dy3 = waystarPlayer.y - a.y;
            if (Math.sqrt(dx3 * dx3 + dy3 * dy3) < a.size + 8 && waystarInvulnTimer <= 0) {
                applyWaystarHit(a.damage, "КОМЕТА!");
                waystarAttacks.splice(i, 1);
                continue;
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
    
    // ★ НАГРАДА: ПРЕДМЕТ "Путеводная Звезда" ★
    if (typeof addItem === 'function') addItem("waystar", 1);
    // +1 секретный токен
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

// ========== РЕНДЕР ==========
function waystarRenderLoop() {
    if (!waystarActive) return;
    if (typeof ctx === 'undefined' || !ctx) return;
    if (typeof canvas === 'undefined' || !canvas) return;
    
    // ★ БЕЗОПАСНАЯ ПРОВЕРКА таймера диалога ★
    if (typeof waystarDialogAutoTimer === 'undefined') waystarDialogAutoTimer = 0;
    
    if (!waystarDialogActive) {
        if (waystarState === "phase1") {
            if (waystarBossHp <= waystarBossMaxHp * 0.5 && !waystarPieces.length && waystarState === "phase1") {
                waystarTriggerSplit();
            } else {
                updateWaystarPlayer();
                updateWaystarAttacks();
                waystarAttackTimer++;
                var attackRate = Math.floor(45 / waystarSpeedMult);
                if (waystarAttackTimer >= attackRate) {
                    waystarAttackTimer = 0;
                    waystarSpawnAttack();
                }
                waystarTypeTimer--;
                if (waystarTypeTimer <= 0) {
                    waystarAttackType = Math.floor(Math.random() * 5);
                    waystarTypeTimer = Math.floor(200 + Math.random() * 200);
                }
                waystarBoss.rotation += 0.015;
                waystarBoss.pulse += 0.08;
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
        
        // Если достигли выбора — активируем
        if (current && current.choice && !waystarChoiceResolved) {
            waystarChoiceActive = true;
        }
        
        // Автопродвижение (когда нет выбора)
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
    
    // Отрисовка
    ctx.save();
    if (waystarShake > 0.5) {
        ctx.translate((Math.random() - 0.5) * waystarShake, (Math.random() - 0.5) * waystarShake);
    }
    ctx.clearRect(-20, -20, 440, 540);
    
    // Фон
    var bg = ctx.createLinearGradient(0, 0, 0, 500);
    bg.addColorStop(0, "#0a0020");
    bg.addColorStop(0.5, "#150030");
    bg.addColorStop(1, "#000010");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 400, 500);
    
    // Мерцающие звёзды фона
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
    
    // Экранная вспышка
    if (waystarScreenFlash > 0) {
        ctx.globalAlpha = waystarScreenFlash / 30;
        ctx.fillStyle = waystarScreenFlashColor;
        ctx.fillRect(0, 0, 400, 500);
        ctx.globalAlpha = 1;
    }
    
    // Рамка
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 496);
    
    // Рендер по состоянию
    if (waystarState === "phase1" || waystarDialogActive || waystarState === "split") {
        drawWaystarBoss();
        drawWaystarPhase1Attacks();
    } else if (waystarState === "phase2") {
        drawWaystarPieces();
        drawWaystarBullets();
    }
    
    // Игрок
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
    
    // HP бары
    if (!waystarDialogActive) drawWaystarHpBars();
    
    // Диалог
    if (waystarDialogActive) drawWaystarDialog();
    
    // Мобильная подсказка
    if (waystarState === "phase2") {
        ctx.save();
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,215,0,0.7)";
        ctx.fillText("← → тап для выстрела", 200, 495);
        ctx.restore();
    }
    
    ctx.restore();
    waystarAnimFrame = requestAnimationFrame(waystarRenderLoop);
}

function drawWaystarBoss() {
    var b = waystarBoss;
    var pulse = 1 + Math.sin(b.pulse) * 0.1;
    var size = b.size * pulse;
    
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);
    
    var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 3);
    glow.addColorStop(0, "rgba(255, 215, 0, 0.9)");
    glow.addColorStop(0.4, "rgba(255, 170, 0, 0.5)");
    glow.addColorStop(1, "rgba(255, 100, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#ffd700";
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
        } else if (a.type === "beam") {
            if (a.warning > 0) {
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 100) * 0.2;
                ctx.strokeStyle = "#ff3333";
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();
                ctx.moveTo(200, 120);
                ctx.lineTo(200 + Math.cos(a.angle) * 600, 120 + Math.sin(a.angle) * 600);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            } else {
                ctx.save();
                ctx.globalAlpha = 0.7;
                ctx.strokeStyle = "#ffd700";
                ctx.lineWidth = a.width;
                ctx.shadowColor = "#ffd700";
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.moveTo(200, 120);
                ctx.lineTo(200 + Math.cos(a.angle) * 800, 120 + Math.sin(a.angle) * 800);
                ctx.stroke();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = a.width * 0.3;
                ctx.shadowBlur = 0;
                ctx.stroke();
                ctx.restore();
            }
        } else if (a.type === "comet") {
            for (var j = 0; j < a.trail.length; j++) {
                var tr = a.trail[j];
                var alpha = (1 - j / a.trail.length) * 0.8;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = ["#ffd700", "#ff8800", "#ff4400"][j % 3];
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, a.size * (1 - j / a.trail.length) * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#fff8dc";
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (a.type === "constellation") {
            ctx.save();
            var isWarning = a.warning > 0;
            ctx.globalAlpha = isWarning ? 0.3 + Math.sin(performance.now() / 100) * 0.2 : 1;
            ctx.strokeStyle = isWarning ? "#ff3333" : "#ffd700";
            ctx.lineWidth = isWarning ? 2 : 5;
            if (isWarning) ctx.setLineDash([6, 4]);
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
                ctx.arc(a.points[p].x, a.points[p].y, isWarning ? 4 : 6, 0, Math.PI * 2);
                ctx.fill();
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

function drawWaystarBullets() {
    for (var i = 0; i < waystarPlayerBullets.length; i++) {
        var b = waystarPlayerBullets[i];
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
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

function drawWaystarHpBars() {
    var barW = 360, barH = 12, x = 20, y = 6;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 4, y - 4, barW + 8, barH + 8);
    ctx.fillStyle = "#1a1000";
    ctx.fillRect(x, y, barW, barH);
    if (waystarState === "phase2") {
        var ratio = waystarPiecesAlive / waystarPiecesTotal;
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(x, y, barW * ratio, barH);
        ctx.fillStyle = "#000";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(waystarPiecesAlive + " / " + waystarPiecesTotal + " осколков", x + barW / 2, y + barH - 2);
    } else {
        var ratio = Math.max(0, waystarBossHp / waystarBossMaxHp);
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(x, y, barW * ratio, barH);
        ctx.fillStyle = "#000";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("🌟 " + Math.ceil(waystarBossHp) + " / " + waystarBossMaxHp, x + barW / 2, y + barH - 2);
    }
    ctx.restore();
    
    var y2 = 478;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 4, y2 - 4, barW + 8, 20);
    ctx.fillStyle = "#2a0000";
    ctx.fillRect(x, y2, barW, 12);
    var r2 = Math.max(0, waystarPlayerHp / waystarPlayerMaxHp);
    ctx.fillStyle = r2 > 0.3 ? "#00ff66" : "#ff3333";
    ctx.fillRect(x, y2, barW * r2, 12);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y2, barW, 12);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(waystarPlayerHp + " / " + waystarPlayerMaxHp, x + barW / 2, y2 + 10);
    ctx.restore();
}

function drawWaystarDialog() {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, 400, 500);
    
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
        for (var i = 0; i < choices.length; i++) {
            var btnY = 260 + i * 50;
            ctx.fillStyle = "rgba(44,44,58,0.9)";
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 2;
            ctx.fillRect(40, btnY, 320, 40);
            ctx.strokeRect(40, btnY, 320, 40);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Nunito, sans-serif";
            ctx.textAlign = "left";
            var shortText = choices[i].text;
            if (shortText.length > 45) shortText = shortText.substring(0, 42) + "...";
            ctx.fillText((i+1) + ". " + shortText, 50, btnY + 24);
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

// ========== УРОН БОССУ (фаза 1) ==========
function damageWaystarBoss(dmg) {
    if (waystarState !== "phase1") return;
    waystarBossHp -= dmg;
    waystarBossFlash = 6;
    spawnWaystarParticles(waystarBoss.x + (Math.random() - 0.5) * 40, waystarBoss.y + (Math.random() - 0.5) * 40, 5, "#ffd700", 3);
    if (waystarBossHp <= 0) waystarBossHp = 1;
}

// ========== ЭКСПОРТ ==========
window.startWaystarFight = startWaystarFight;
window.stopWaystarFight = stopWaystarFight;
window.damageWaystarBoss = damageWaystarBoss;
console.log("[WAYSTAR] v1.2 — Путеводная Звезда (фикс таймера)");
