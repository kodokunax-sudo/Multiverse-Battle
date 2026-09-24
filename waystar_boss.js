// ============================================================
// ПУТЕВОДНАЯ ЗВЕЗДА — БОСС 500 ВОЛНЫ v11.0
// Медленнее в 1.5 раза + Змейка вместо Созвездия + лёгкие эффекты
// ============================================================

if (window._waystarBossLoaded === true) {
    console.warn("[WAYSTAR] Уже загружен, игнорирую повтор.");
} else {
    window._waystarBossLoaded = true;

var WAYSTAR_MODER_DAMAGE = 100000;
var WAYSTAR_SLOWDOWN = 1.5; // ★ Множитель замедления боя ★

function isWaystarModerActive() {
    try { return typeof mode !== 'undefined' && mode === "moder"; } catch(e) { return false; }
}

var waystarActive = false;
var waystarState = "dialogue";
var waystarBoss = { x: 200, y: 100, size: 55, vx: 1.5, rotation: 0, pulse: 0, time: 0, alpha: 1 };
var waystarBoss2 = { x: 200, y: 100, size: 40, vx: -1.5, rotation: 0, pulse: 0, alpha: 1, active: false };
var waystarPlayer = { x: 200, y: 430 };
var waystarBossHp = 0;
var waystarBossMaxHp = 0;
var waystarPlayerHp = 200;
var waystarPlayerMaxHp = 200;
var waystarAttacks = [];
var waystarPlayerBullets = [];
var waystarParticles = [];
var waystarTexts = [];
var waystarAttackTimer = 0;
var waystarAttackType = 0;
var waystarTypeTimer = 600;
var waystarInvulnTimer = 0;
var waystarShake = 0;
var waystarScreenFlash = 0;
var waystarScreenFlashColor = "#ffffff";
var waystarBossFlash = 0;
var waystarAnimFrame = null;
var waystarBgStars = [];
var waystarSpeedMult = 1.3;
var waystarKeys = {};
var waystarTouchActive = false, waystarTouchId = null, waystarTouchX = 0, waystarTouchY = 0;
var waystarShootCooldown = 0;
var waystarShootInterval = 6;
var waystarShockwaves = [];
var waystarLightningBolts = [];
var waystarSlashMarks = [];
var waystarFlashBursts = [];
var waystarScreenDistort = 0;
var waystarVignette = 0;
var waystarNebulas = [];
var waystarAmbientTimer = 0;
var waystarRageMode = false;
var waystarEscalationLevel = 0;
var waystarEscalationTimer = 0;
var waystarDialogActive = false;
var waystarDialogStep = 0;
var waystarDialogQueue = [];
var waystarChoiceActive = false;
var waystarChoiceResolved = false;
var waystarDialogAutoTimer = 0;
var waystarDialogOnComplete = null;
var waystarSplitAnim = null;
var waystarEscapeAnim = null;
var waystarPieces = [];
var waystarEnemyBullets = [];
var waystarInvaderDir = 1;
var waystarInvaderSpeed = 1.0;
var waystarInvaderShootTimer = 0;
var waystarPiecesTotal = 60;
var waystarPiecesAlive = 60;
var waystarReturning = false;
var waystarReturnTimer = 0;
var waystarSmallBoss = { x: 200, y: 100, size: 28, rotation: 0, pulse: 0, time: 0, alpha: 0, trail: [] };
var waystarBombs = [];
var waystarDash = null;
var waystarRewardGiven = false;
var waystarPhase3Embers = [];
var waystarPhase3Rings = [];
var waystarPhase3AuraPulse = 0;
var waystarPhase3AttacksStarted = false;
var waystarFinalActive = false;
var waystarFinalPhase = "idle";
var waystarFinalTimer = 0;
var waystarChoiceSelection = null;
var waystarStone = { x: 200, y: 480, size: 40, alpha: 0, rotation: 0, scale: 1, vx: 0, vy: 0 };
var waystarStoneText = "";
var waystarBlackoutAlpha = 0;
var waystarWakeText = "";
var waystarWakeAlpha = 0;
var waystarFinalRewardGiven = false;
var waystarFinalDone = false;
var waystarFinalWatchdog = 0;
var waystarSpareBlessing = { active: false, progress: 0, flash: 0 };
var waystarSpareDialog = [];
var waystarSpareDialogStep = 0;
var waystarSpareDialogTimer = 0;

// ★ Флаг: созвездие использовалось (не повторяется) ★
var waystarConstellationUsed = false;

// ========== ЗМЕЙКА (новая атака) ==========
var waystarSnakes = [];

function addWaystarShockwave(x, y, color, maxRadius, life, width) {
    if (width === undefined) width = 4;
    waystarShockwaves.push({ x: x, y: y, radius: 10, maxRadius: maxRadius, life: life, maxLife: life, color: color, width: width });
}
function addWaystarLightning(x1, y1, x2, y2, color, alpha, width) {
    if (width === undefined) width = 2;
    var pts = [];
    var steps = 4 + Math.floor(Math.random() * 3);
    for (var i = 1; i < steps; i++) { var t = i / steps; pts.push({ x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20, y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20 }); }
    waystarLightningBolts.push({ x1: x1, y1: y1, x2: x2, y2: y2, pts: pts, color: color, alpha: alpha, life: 12, maxLife: 12, width: width });
}
function addWaystarSlash(x, y, angle, length, width) { waystarSlashMarks.push({ x: x, y: y, angle: angle, length: length, width: width || 4, life: 20, maxLife: 20 }); }
function addWaystarFlash(x, y, size) { waystarFlashBursts.push({ x: x, y: y, size: size || 40, life: 15, maxLife: 15 }); }
function spawnWaystarParticles(x, y, count, color, speed) {
    for (var i = 0; i < count; i++) { var a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random()); waystarParticles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 20 + Math.random() * 15, maxLife: 35, color: color, size: 1.5 + Math.random() * 2.5 }); }
}
function updateWaystarMegaEffects() {
    for (var i = waystarShockwaves.length - 1; i >= 0; i--) { var sw = waystarShockwaves[i]; sw.radius += (sw.maxRadius - sw.radius) * 0.15; sw.life--; if (sw.life <= 0) waystarShockwaves.splice(i, 1); }
    for (var i = waystarLightningBolts.length - 1; i >= 0; i--) { waystarLightningBolts[i].life--; if (waystarLightningBolts[i].life <= 0) waystarLightningBolts.splice(i, 1); }
    for (var i = waystarSlashMarks.length - 1; i >= 0; i--) { waystarSlashMarks[i].life--; if (waystarSlashMarks[i].life <= 0) waystarSlashMarks.splice(i, 1); }
    for (var i = waystarFlashBursts.length - 1; i >= 0; i--) { waystarFlashBursts[i].life--; if (waystarFlashBursts[i].life <= 0) waystarFlashBursts.splice(i, 1); }
    if (waystarScreenDistort > 0) waystarScreenDistort *= 0.85;
    if (waystarScreenDistort < 0.5) waystarScreenDistort = 0;
    if (waystarVignette > 0) waystarVignette--;
    for(var i=0; i<waystarNebulas.length; i++) { waystarNebulas[i].y += waystarNebulas[i].speed; waystarNebulas[i].angle += waystarNebulas[i].rotSpeed; if(waystarNebulas[i].y > 600) waystarNebulas[i].y = -100; }
}
function updateWaystarAmbient() {
    if (waystarState !== "phase3") return;
    waystarAmbientTimer++; waystarPhase3AuraPulse += 0.1;
    var escMult = 1 + waystarEscalationLevel * 0.15;
    if (waystarAmbientTimer % 6 === 0) { waystarPhase3Rings.push({ x: waystarSmallBoss.x, y: waystarSmallBoss.y, radius: 30, maxRadius: 90 + waystarEscalationLevel * 12, angle: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2, life: 30, maxLife: 30, color: Math.random() > 0.5 ? "#ff00ff" : "#ffffff" }); }
    if (waystarAmbientTimer % Math.max(3, Math.floor(5 / escMult)) === 0) { waystarPhase3Embers.push({ x: Math.random() * 400, y: 500 + Math.random() * 40, vx: (Math.random() - 0.5) * 1.0, vy: -(1.2 + Math.random() * 1.5) * escMult, size: 1 + Math.random() * 2, life: 60 + Math.random() * 30, color: Math.random() > 0.5 ? "#ff00ff" : "#ffaa00" }); }
    if (waystarAmbientTimer % Math.max(15, Math.floor(40 / escMult)) === 0) { var ang = Math.random() * Math.PI * 2; addWaystarLightning(waystarSmallBoss.x, waystarSmallBoss.y, waystarSmallBoss.x + Math.cos(ang) * (100 + Math.random() * 60), waystarSmallBoss.y + Math.sin(ang) * (100 + Math.random() * 60), Math.random() > 0.5 ? "#ff00ff" : "#ffffff", 0.8, 2); }
    if (waystarAmbientTimer % Math.max(10, Math.floor(25 / escMult)) === 0) { addWaystarSlash(30 + Math.random() * 340, 60 + Math.random() * 380, Math.random() * Math.PI * 2, 30 + Math.random() * 50, 2.5); }
    if (waystarAmbientTimer % Math.max(12, Math.floor(30 / escMult)) === 0) { addWaystarFlash(waystarSmallBoss.x + (Math.random() - 0.5) * 80, waystarSmallBoss.y + (Math.random() - 0.5) * 80, 25 + Math.random() * 30); }
    if (waystarAmbientTimer % Math.max(40, Math.floor(100 / escMult)) === 0) { waystarScreenFlash = 8; waystarScreenFlashColor = waystarEscalationLevel >= 3 ? "#ff0000" : "#ff00ff"; }
    if (waystarAmbientTimer % 3 === 0) { spawnWaystarParticles(waystarSmallBoss.x + (Math.random() - 0.5) * 40, waystarSmallBoss.y + (Math.random() - 0.5) * 40, 1, ["#ff00ff", "#ffaa00", "#ffffff"][Math.floor(Math.random() * 3)], 2); }
    waystarSmallBoss.trail.push({ x: waystarSmallBoss.x, y: waystarSmallBoss.y, life: 15, maxLife: 15 });
    if (waystarSmallBoss.trail.length > 6) waystarSmallBoss.trail.shift();
}
function updateWaystarPhase3Special() {
    for (var i = waystarPhase3Embers.length - 1; i >= 0; i--) { var e = waystarPhase3Embers[i]; e.x += e.vx; e.y += e.vy; e.life--; e.vy *= 0.99; if (e.life <= 0 || e.y < -20) waystarPhase3Embers.splice(i, 1); }
    for (var i = waystarPhase3Rings.length - 1; i >= 0; i--) { var r = waystarPhase3Rings[i]; r.radius += 2; r.angle += r.rotSpeed; r.life--; if (r.life <= 0 || r.radius > r.maxRadius) waystarPhase3Rings.splice(i, 1); }
    for (var i = waystarSmallBoss.trail.length - 1; i >= 0; i--) { waystarSmallBoss.trail[i].life--; if (waystarSmallBoss.trail[i].life <= 0) waystarSmallBoss.trail.splice(i, 1); }
}

var waystarMusic = null;
function startWaystarMusic() {
    if (typeof stopAllMusic === 'function') stopAllMusic();
    if (!waystarMusic) { try { waystarMusic = new Audio("music/Звезда.mp3"); waystarMusic.loop = true; waystarMusic.volume = 0.45; waystarMusic.onerror = function() { waystarMusic = null; }; } catch(e) { waystarMusic = null; } }
    if (waystarMusic) { try { waystarMusic.currentTime = 0; waystarMusic.play().catch(function(){}); } catch(e) {} }
}
function stopWaystarMusic() { if (waystarMusic) { try { waystarMusic.pause(); waystarMusic.currentTime = 0; } catch(e) {} } }
function wsPlaySound(freq, type, dur, vol) { if (typeof playArenaSound === 'function') playArenaSound(freq, type, dur, vol); }

function startWaystarFight() {
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(500)) {
        if (typeof showFloatingText === 'function') showFloatingText("⏭️ Путеводная Звезда уже побеждена!", "#ffaa00");
        return;
    }
    console.log("[WAYSTAR] Старт боя v11.0. Модер:", isWaystarModerActive());
    waystarActive = true;
    waystarState = "dialogue";
    waystarRageMode = false;
    waystarEscalationLevel = 0;
    waystarEscalationTimer = 0;
    waystarPhase3AttacksStarted = false;
    waystarConstellationUsed = false; // ★ Сброс флага созвездия ★
    waystarSnakes = [];
    waystarFinalActive = false;
    waystarFinalPhase = "idle";
    waystarFinalTimer = 0;
    waystarFinalWatchdog = 0;
    waystarChoiceSelection = null;
    waystarFinalRewardGiven = false;
    waystarFinalDone = false;
    waystarBlackoutAlpha = 0;
    waystarWakeAlpha = 0;
    waystarWakeText = "";
    waystarStoneText = "";
    waystarStone = { x: 200, y: 480, size: 40, alpha: 0, rotation: 0, scale: 1, vx: 0, vy: 0 };
    waystarSpareBlessing = { active: false, progress: 0, flash: 0 };
    waystarSpareDialog = [];
    waystarSpareDialogStep = 0;
    waystarSpareDialogTimer = 0;
    var playerDmg = (typeof window.playerFinalDamage !== 'undefined') ? window.playerFinalDamage : 100;
    waystarBossMaxHp = Math.max(25000, playerDmg * 120);
    waystarBossHp = waystarBossMaxHp;
    waystarBoss = { x: 200, y: 100, size: 55, vx: 1.5, rotation: 0, pulse: 0, time: 0, alpha: 1 };
    waystarBoss2 = { x: 200, y: 100, size: 40, vx: -1.5, rotation: 0, pulse: 0, alpha: 1, active: false };
    waystarSmallBoss = { x: 200, y: 100, size: 28, rotation: 0, pulse: 0, time: 0, alpha: 0, trail: [] };
    waystarPlayer = { x: 200, y: 430 };
    if (isWaystarModerActive()) { waystarPlayerHp = 999999; waystarPlayerMaxHp = 999999; }
    else { waystarPlayerHp = 200; waystarPlayerMaxHp = 200; }
    waystarInvulnTimer = 0;
    waystarAttacks = []; waystarPlayerBullets = []; waystarParticles = []; waystarTexts = [];
    waystarShockwaves = []; waystarLightningBolts = []; waystarSlashMarks = []; waystarFlashBursts = [];
    waystarPhase3Embers = []; waystarPhase3Rings = [];
    waystarAttackTimer = 0; waystarAttackType = 0; waystarTypeTimer = 600;
    waystarShake = 0; waystarScreenFlash = 0; waystarBossFlash = 0;
    waystarScreenDistort = 0; waystarVignette = 0;
    waystarPieces = []; waystarEnemyBullets = [];
    waystarBombs = []; waystarDash = null;
    waystarReturning = false; waystarReturnTimer = 0;
    waystarSplitAnim = null; waystarEscapeAnim = null;
    waystarAmbientTimer = 0;
    waystarShootCooldown = 0;
    waystarRewardGiven = false;
    waystarDialogOnComplete = null;
    waystarTouchActive = false; waystarTouchId = null;
    waystarKeys = {};
    waystarDialogActive = true; waystarDialogStep = 0; waystarChoiceActive = false; waystarChoiceResolved = false;
    waystarDialogAutoTimer = 0;
    initWaystarBgStars();
    startWaystarMusic();
    ['superBtn', 'superBtn2', 'superBtnDeactivate', 'startArenaBtn', 'skipBossBtn', 'spareBtn', 'startLivingStoneBtn', 'startWaystarBtn'].forEach(function(id) { var el = document.getElementById(id); if (el) el.style.display = "none"; });
    var overlay = document.getElementById("arenaOverlay"); if (overlay) overlay.style.display = "flex";
    var bossNameEl = document.getElementById("arenaBossName"); if (bossNameEl) bossNameEl.innerText = "🌟 ПУТЕВОДНАЯ ЗВЕЗДА";
    var arenaHpEl = document.getElementById("arenaHP"); if (arenaHpEl) arenaHpEl.innerText = waystarPlayerHp;
    var timerEl = document.getElementById("arenaTimer"); if (timerEl) timerEl.innerText = "∞";
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
    console.log("[WAYSTAR] Стоп боя");
    waystarActive = false;
    waystarFinalActive = false;
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
    var overlay = document.getElementById("arenaOverlay"); if (overlay) overlay.style.display = "none";
    if (typeof startBattleMusic === 'function') startBattleMusic();
}

function initWaystarBgStars() {
    waystarBgStars = []; waystarNebulas = [];
    for (var i = 0; i < 80; i++) { waystarBgStars.push({ x: Math.random() * 400, y: Math.random() * 500, size: 0.5 + Math.random() * 2, speed: 0.1 + Math.random() * 0.3, alpha: 0.2 + Math.random() * 0.7, twinkle: Math.random() * Math.PI * 2 }); }
    var colors = ["#1a0a2e", "#0a1a3a", "#2a0a2a", "#0a1a2a"];
    for(var j=0; j<3; j++) { waystarNebulas.push({ x: Math.random() * 400, y: Math.random() * 500, radius: 100 + Math.random() * 150, color: colors[Math.floor(Math.random() * colors.length)], speed: 0.2 + Math.random() * 0.3, angle: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.01 }); }
}

function startWaystarDialog() {
    waystarDialogActive = true; waystarDialogStep = 0; waystarChoiceActive = false; waystarChoiceResolved = false; waystarDialogAutoTimer = 0;
    waystarDialogOnComplete = function() { waystarState = "phase1"; waystarDialogActive = false; waystarAttackTimer = 0; };
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
    for (var i = 0; i < waystarDialogQueue.length; i++) { waystarDialogQueue[i].time = 2.5 + waystarDialogQueue[i].text.length * 0.04; }
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
    waystarChoiceResolved = true; waystarChoiceActive = false;
    var c = getWaystarChoices().find(function(x) { return x.id === choiceId; });
    var responses = [
        { speaker: "🌟 Путеводная Звезда", text: c.response },
        { speaker: "🌟 Путеводная Звезда", text: "Достаточно разговоров. Покажи мне свою силу!" },
        { speaker: "🌟 Путеводная Звезда", text: "МУЛЬТИВСЕЛЕННАЯ НЕ ПРОЩАЕТ СЛАБЫХ!" }
    ];
    for (var i = 0; i < responses.length; i++) { responses[i].time = 2.5 + responses[i].text.length * 0.05; waystarDialogQueue.push(responses[i]); }
    waystarDialogStep++;
    waystarDialogAutoTimer = 0;
    wsPlaySound(600, 'square', 0.3, 0.2);
}

function waystarProgressDialog() {
    waystarDialogStep++;
    waystarDialogAutoTimer = 0;
    wsPlaySound(800, 'triangle', 0.05, 0.1);
    if (waystarDialogStep >= waystarDialogQueue.length) {
        waystarDialogActive = false;
        if (waystarDialogOnComplete) { var cb = waystarDialogOnComplete; waystarDialogOnComplete = null; cb(); }
    }
}

function updateWaystarShooting() {
    if (waystarState !== "phase1" && waystarState !== "phase3") return;
    if (waystarShootCooldown > 0) { waystarShootCooldown--; return; }
    waystarShootCooldown = waystarShootInterval;
    var dmgBase;
    if (isWaystarModerActive()) { dmgBase = WAYSTAR_MODER_DAMAGE; }
    else { dmgBase = Math.max(1, Math.floor((window.playerFinalDamage || 100) / 4)); }
    waystarPlayerBullets.push({ x: waystarPlayer.x, y: waystarPlayer.y - 12, vy: -12, vx: 0, size: 5, damage: dmgBase, life: 80, trail: [] });
    addWaystarFlash(waystarPlayer.x, waystarPlayer.y - 12, 15);
    wsPlaySound(1100, 'square', 0.04, 0.06);
}

// ========== НОВАЯ АТАКА: ЗМЕЙКА ==========
function spawnWaystarSnake(startX, startY) {
    var segments = [];
    var segCount = 20;
    for (var i = 0; i < segCount; i++) {
        segments.push({ x: startX, y: startY });
    }
    var targetX = waystarPlayer.x;
    var targetY = waystarPlayer.y;
    var dx = targetX - startX;
    var dy = targetY - startY;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    waystarSnakes.push({
        segments: segments,
        headX: startX,
        headY: startY,
        vx: (dx / dist) * 3.0 * waystarSpeedMult,
        vy: (dy / dist) * 3.0 * waystarSpeedMult,
        targetX: targetX,
        targetY: targetY,
        wiggle: 0,
        life: 400,
        maxLife: 400,
        damage: 15,
        hit: false,
        color: "#00ffff",
        size: 12
    });
    wsPlaySound(400, 'sine', 0.5, 0.18);
    addWaystarShockwave(startX, startY, "#00ffff", 100, 15, 3);
}

function updateWaystarSnakes() {
    for (var i = waystarSnakes.length - 1; i >= 0; i--) {
        var snake = waystarSnakes[i];
        snake.life--;
        snake.wiggle += 0.3;

        // ★ Голова двигается к цели по кривой ★
        var targetX = waystarPlayer.x;
        var targetY = waystarPlayer.y;
        var dx = targetX - snake.headX;
        var dy = targetY - snake.headY;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Плавно поворачиваем к цели
        var targetVx = (dx / dist) * 3.2 * waystarSpeedMult;
        var targetVy = (dy / dist) * 3.2 * waystarSpeedMult;

        // Плюс небольшое покачивание для эффекта "змейки"
        var perpX = -dy / dist;
        var perpY = dx / dist;
        var wiggleAmp = Math.sin(snake.wiggle) * 1.2;
        targetVx += perpX * wiggleAmp;
        targetVy += perpY * wiggleAmp;

        snake.vx += (targetVx - snake.vx) * 0.15;
        snake.vy += (targetVy - snake.vy) * 0.15;

        snake.headX += snake.vx;
        snake.headY += snake.vy;

        // Обновляем сегменты: каждый сегмент тянется к предыдущему
        var prevX = snake.headX;
        var prevY = snake.headY;
        for (var s = 0; s < snake.segments.length; s++) {
            var seg = snake.segments[s];
            var sdx = prevX - seg.x;
            var sdy = prevY - seg.y;
            var sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
            var segSpacing = 14;
            if (sdist > segSpacing) {
                seg.x += (sdx / sdist) * (sdist - segSpacing) * 0.5;
                seg.y += (sdy / sdist) * (sdist - segSpacing) * 0.5;
            }
            prevX = seg.x;
            prevY = seg.y;
        }

        // ★ Проверка попадания в игрока ★
        if (!snake.hit && waystarInvulnTimer <= 0) {
            var hdx = snake.headX - waystarPlayer.x;
            var hdy = snake.headY - waystarPlayer.y;
            if (Math.sqrt(hdx * hdx + hdy * hdy) < snake.size + 10) {
                snake.hit = true;
                applyWaystarHit(snake.damage, "ЗМЕЙКА!");
                // При попадании — голова останавливается
                snake.vx *= 0.3;
                snake.vy *= 0.3;
            }
        }

        // Убираем если жизнь кончилась или ушла за экран
        if (snake.life <= 0 || snake.headX < -100 || snake.headX > 500 || snake.headY < -100 || snake.headY > 600) {
            waystarSnakes.splice(i, 1);
        }
    }
}

function drawWaystarSnakes() {
    for (var i = 0; i < waystarSnakes.length; i++) {
        var snake = waystarSnakes[i];
        var alpha = Math.min(1, snake.life / 40);

        // Рисуем с хвоста к голове (чтобы голова была сверху)
        for (var s = snake.segments.length - 1; s >= 0; s--) {
            var seg = snake.segments[s];
            var t = s / snake.segments.length;
            var segSize = snake.size * (1 - t * 0.6);

            // Внутреннее ядро
            ctx.save();
            ctx.globalAlpha = alpha * (0.9 - t * 0.5);
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 8;
            ctx.fillStyle = "#00ffff";
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, segSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, segSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Голова — побольше и с ярким свечением
        ctx.save();
        ctx.globalAlpha = alpha;
        var headGlow = ctx.createRadialGradient(snake.headX, snake.headY, 0, snake.headX, snake.headY, snake.size * 2);
        headGlow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        headGlow.addColorStop(0.4, "rgba(0, 255, 255, 0.7)");
        headGlow.addColorStop(1, "transparent");
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(snake.headX, snake.headY, snake.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(snake.headX, snake.headY, snake.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function spawnLightningLines(startX, startY) {
    // ★ Лёгкие молнии-линии (вместо тяжёлого созвездия) ★
    for (var i = 0; i < 8; i++) {
        var endX = startX + (Math.random() - 0.5) * 300;
        var endY = startY + (Math.random() - 0.5) * 300;
        addWaystarLightning(startX, startY, endX, endY, "#00ffff", 0.8, 2);
    }
    addWaystarShockwave(startX, startY, "#00ffff", 150, 20, 4);
}

function waystarSpawnAttack() {
    var type = waystarAttackType; var s = waystarSpeedMult; var isSecond = waystarBossHp <= waystarBossMaxHp * 0.75;
    if (type === 0) {
        // ★ МЕТЕОРЫ (замедлено в 1.5 раза) ★
        var count = isSecond ? 4 : 2;
        for (var i = 0; i < count; i++) { waystarAttacks.push({ type: "meteor", x: 20 + Math.random() * 360, y: -40 - Math.random()*50, vx: (Math.random() - 0.5) * 1.5 * s, vy: (2.5 + Math.random() * 1.8) * s, size: 12 + Math.random() * 6, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2, damage: 12, life: 400, trail: [] }); }
        addWaystarShockwave(waystarBoss.x, waystarBoss.y, "#ff8800", 100, 15, 3);
        wsPlaySound(200, 'square', 0.3, 0.15);
    } else if (type === 1) {
        // ★ ВИХРЬ (замедлено) ★
        var count = isSecond ? 14 : 10; var baseAngle = Math.random() * Math.PI * 2;
        for (var i = 0; i < count; i++) { var ang = baseAngle + (i / count) * Math.PI * 4; var delay = i * 6; (function(a, d) { setTimeout(function() { if (!waystarActive || waystarState !== "phase1") return; waystarAttacks.push({ type: "spiral", x: waystarBoss.x, y: waystarBoss.y, vx: Math.cos(a) * 3 * s, vy: Math.sin(a) * 3 * s, size: 7, damage: 10, life: 350, trail: [] }); }, d); })(ang, delay); }
        addWaystarShockwave(waystarBoss.x, waystarBoss.y, "#ff00ff", 80, 12, 3);
        wsPlaySound(400, 'sine', 0.5, 0.12);
    } else if (type === 2) {
        // ★ ЛАЗЕРЫ (замедлено) ★
        if (Math.random() < 0.33) { var targetX = 60 + Math.random() * 280; waystarAttacks.push({ type: "laser", state: "warning", x: targetX, width: 55, warningTimer: 70, activeTimer: 0, maxActive: 50, damage: 18, hit: false, chargeParticles: 0 }); }
        wsPlaySound(300, 'square', 0.3, 0.15);
    } else if (type === 3) {
        // ★ ЗМЕЙКА (вместо созвездия, только один раз за бой) ★
        if (!waystarConstellationUsed) {
            waystarConstellationUsed = true;
            spawnWaystarSnake(waystarBoss.x, waystarBoss.y);
            spawnLightningLines(waystarBoss.x, waystarBoss.y);
            console.log("[WAYSTAR] Змейка выпущена!");
        } else {
            // Если уже использовалось — заменяем на метеоры
            var count = isSecond ? 4 : 2;
            for (var i = 0; i < count; i++) { waystarAttacks.push({ type: "meteor", x: 20 + Math.random() * 360, y: -40 - Math.random()*50, vx: (Math.random() - 0.5) * 1.5 * s, vy: (2.5 + Math.random() * 1.8) * s, size: 12 + Math.random() * 6, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2, damage: 12, life: 400, trail: [] }); }
            wsPlaySound(200, 'square', 0.3, 0.15);
        }
    } else if (type === 4) {
        // ★ ЗВЁЗДНЫЙ ДОЖДЬ (замедлено) ★
        var count3 = isSecond ? 10 : 7;
        for (var i = 0; i < count3; i++) { var side = Math.random() > 0.5 ? 1 : -1; waystarAttacks.push({ type: "star_rain", x: side > 0 ? -30 : 430, y: Math.random() * 200 - 100, vx: side > 0 ? 3.5 * s : -3.5 * s, vy: 2.2 * s, size: 10, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2, damage: 11, life: 350, trail: [] }); }
        addWaystarShockwave(waystarBoss.x, waystarBoss.y, "#ffffff", 90, 12, 3);
        wsPlaySound(800, 'sawtooth', 0.2, 0.1);
    }
}

function waystarTriggerSplit() {
    waystarState = "split1_anim"; waystarDialogActive = false;
    waystarShake = 50; waystarScreenFlash = 40; waystarScreenFlashColor = "#ffffff"; waystarScreenDistort = 35; waystarVignette = 25;
    wsPlaySound(200, 'sawtooth', 1.5, 0.4); setTimeout(function() { wsPlaySound(100, 'sawtooth', 1.5, 0.4); }, 400);
    for (var i = 0; i < 6; i++) { setTimeout(function(idx) { addWaystarShockwave(waystarBoss.x, waystarBoss.y, ["#ffffff", "#ffd700", "#ff00ff", "#ff4400"][idx%4], 350, 30, 6); }, i * 150); }
    for (var i = 0; i < 15; i++) { var ang = (i / 15) * Math.PI * 2 + Math.random() * 0.3; addWaystarLightning(waystarBoss.x, waystarBoss.y, waystarBoss.x + Math.cos(ang) * 200, waystarBoss.y + Math.sin(ang) * 200, i % 2 === 0 ? "#ffffff" : "#ffd700", 1.0, 3); }
    for (var i = 0; i < 150; i++) spawnWaystarParticles(waystarBoss.x, waystarBoss.y, 1, ["#ffd700", "#ffffff", "#ff8800", "#ff00ff"][Math.floor(Math.random() * 4)], 15);
    waystarSplitAnim = { timer: 0, duration: 120, boss1StartX: waystarBoss.x, boss2StartX: waystarBoss.x, boss1TargetX: waystarBoss.x - 60, boss2TargetX: waystarBoss.x + 60 };
    waystarBoss2.active = true; waystarBoss2.x = waystarBoss.x; waystarBoss2.y = waystarBoss.y; waystarBoss2.alpha = 0;
    setTimeout(function() {
        if (!waystarActive) return;
        waystarSplitAnim = null; waystarBoss.x = 140; waystarBoss2.x = 260; waystarBoss2.alpha = 1; waystarBoss2.vx = -1.5;
        waystarState = "pre_split2_dialog"; waystarDialogActive = true; waystarDialogStep = 0; waystarDialogAutoTimer = 0;
        waystarDialogQueue = [
            { speaker: "🌟 Путеводная Звезда", text: "Ты сильнее, чем я думала..." },
            { speaker: "🌟 Путеводная Звезда (двойник)", text: "Я ухожу... но я вернусь. И буду вдвое сильнее!" },
            { speaker: "🌟 Путеводная Звезда", text: "А пока — принимай мой Легион!" }
        ];
        for (var i = 0; i < waystarDialogQueue.length; i++) waystarDialogQueue[i].time = 2.5 + waystarDialogQueue[i].text.length * 0.05;
        waystarDialogOnComplete = function() { waystarState = "split2_anim"; waystarStartSplit2Animation(); };
    }, 3000);
}

function waystarStartSplit2Animation() {
    waystarDialogActive = false; wsPlaySound(150, 'sawtooth', 0.8, 0.2);
    waystarEscapeAnim = { timer: 0, duration: 180, startX: waystarBoss2.x, startY: waystarBoss2.y };
    waystarBoss2.active = "escaping";
    setTimeout(function() {
        if (!waystarActive) return;
        waystarShake = 60; waystarScreenFlash = 50; waystarScreenFlashColor = "#ffffff"; waystarScreenDistort = 40;
        wsPlaySound(200, 'sawtooth', 1.5, 0.4); setTimeout(function() { wsPlaySound(100, 'sawtooth', 1.2, 0.35); }, 300);
        for (var i = 0; i < 40; i++) { var ang = (i / 40) * Math.PI * 2 + Math.random() * 0.2; var len = 150 + Math.random() * 150; addWaystarLightning(waystarBoss.x, waystarBoss.y, waystarBoss.x + Math.cos(ang) * len, waystarBoss.y + Math.sin(ang) * len, i % 3 === 0 ? "#ffffff" : (i % 3 === 1 ? "#ffd700" : "#ff00ff"), 1.0, 3); }
        for (var i = 0; i < 6; i++) { setTimeout(function(idx) { addWaystarShockwave(waystarBoss.x, waystarBoss.y, ["#ffffff", "#ffd700", "#ff00ff", "#ff4400"][idx%4], 400, 35, 7); }, i * 120); }
        for (var i = 0; i < 40; i++) { var ang = (i / 40) * Math.PI * 2; var dist = 100 + Math.random() * 60; waystarParticles.push({ x: waystarBoss.x, y: waystarBoss.y, vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3, targetX: waystarBoss.x + Math.cos(ang) * dist, targetY: waystarBoss.y + Math.sin(ang) * dist, isSplitPiece: true, life: 90, maxLife: 90, color: ["#ffd700", "#ff00ff", "#ffffff"][i % 3], size: 4 + Math.random() * 3 }); }
        for (var i = 0; i < 200; i++) spawnWaystarParticles(waystarBoss.x, waystarBoss.y, 1, ["#ffd700", "#ffffff", "#ff8800", "#ff00ff"][Math.floor(Math.random() * 4)], 18);
        waystarBoss.alpha = 0;
        setTimeout(function() {
            if (!waystarActive) return;
            waystarState = "pre_phase2_dialog"; waystarDialogActive = true; waystarDialogStep = 0; waystarDialogAutoTimer = 0;
            waystarDialogQueue = [
                { speaker: "🌟 Путеводная Звезда", text: "Я — ЛЕГИОН! Я — 60 ОСКОЛКОВ!" },
                { speaker: "🌟 Путеводная Звезда", text: "Попробуй пробей каждого!" }
            ];
            for (var i = 0; i < waystarDialogQueue.length; i++) waystarDialogQueue[i].time = 2.5 + waystarDialogQueue[i].text.length * 0.05;
            waystarDialogOnComplete = function() { waystarStartPhase2(); };
        }, 3500);
    }, 1500);
}

function waystarStartPhase2() {
    waystarState = "phase2"; waystarDialogActive = false; waystarAttacks = []; waystarPlayerBullets = [];
    wsPlaySound(300, 'square', 0.5, 0.3);
    waystarPieces = [];
    var cols = 10, rows = 6; var startX = 25, startY = 60, gapX = 38, gapY = 40;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { waystarPieces.push({ x: startX + c * gapX, y: startY + r * gapY, size: 10, hp: 2, maxHp: 2, alive: true, row: r, col: c, pulse: Math.random() * Math.PI * 2, trail: [] }); }
    waystarPiecesTotal = waystarPieces.length; waystarPiecesAlive = waystarPieces.length;
    waystarInvaderDir = 1; waystarEnemyBullets = []; waystarPlayer = { x: 200, y: 450 };
    waystarShootCooldown = 0; waystarInvaderShootTimer = 0;
    if (typeof showFloatingText === 'function') showFloatingText("⭐ 60 ОСКОЛКОВ! ⭐", "#ffd700");
}

function updateWaystarSpaceInvaders() {
    if (waystarShootCooldown > 0) waystarShootCooldown--;
    else { waystarShootCooldown = waystarShootInterval; waystarPlayerBullets.push({ x: waystarPlayer.x, y: waystarPlayer.y - 12, vy: -12, vx: 0, size: 5, damage: 1, life: 80, trail: [] }); addWaystarFlash(waystarPlayer.x, waystarPlayer.y - 12, 12); wsPlaySound(1100, 'square', 0.04, 0.06); }
    var alivePieces = waystarPieces.filter(function(p) { return p.alive; });
    if (alivePieces.length === 0) { waystarStartReturning(); return; }
    // ★ Замедлено ★
    var speed = (waystarInvaderSpeed + (waystarPiecesTotal - alivePieces.length) * 0.05) / WAYSTAR_SLOWDOWN;
    var minX = 9999, maxX = -9999;
    for (var i = 0; i < waystarPieces.length; i++) { var p = waystarPieces[i]; if (!p.alive) continue; if (p.x - p.size < minX) minX = p.x - p.size; if (p.x + p.size > maxX) maxX = p.x + p.size; }
    if (waystarInvaderDir > 0 && maxX + speed > 390) waystarInvaderDir = -1;
    if (waystarInvaderDir < 0 && minX - speed < 10) waystarInvaderDir = 1;
    for (var i = 0; i < waystarPieces.length; i++) { var p = waystarPieces[i]; if (!p.alive) continue; p.trail.push({ x: p.x, y: p.y, life: 10 }); if (p.trail.length > 5) p.trail.shift(); p.x += waystarInvaderDir * speed; }
    waystarInvaderShootTimer++;
    // ★ Замедлено: стреляют реже ★
    var shootRate = Math.max(30, 80 - alivePieces.length / 2);
    if (waystarInvaderShootTimer >= shootRate) { waystarInvaderShootTimer = 0; var shooter = alivePieces[Math.floor(Math.random() * alivePieces.length)]; waystarEnemyBullets.push({ x: shooter.x, y: shooter.y + 15, vy: 3.5 + Math.random() * 2, size: 8, life: 300, trail: [] }); wsPlaySound(400, 'sawtooth', 0.1, 0.1); }
    for (var i = waystarPlayerBullets.length - 1; i >= 0; i--) {
        var b = waystarPlayerBullets[i]; b.y += b.vy; b.life--;
        b.trail.push({ x: b.x, y: b.y, life: 10 }); if (b.trail.length > 5) b.trail.shift();
        if (b.y < -10 || b.life <= 0) { waystarPlayerBullets.splice(i, 1); continue; }
        for (var j = 0; j < waystarPieces.length; j++) {
            var p = waystarPieces[j]; if (!p.alive) continue;
            if (Math.abs(b.x - p.x) < p.size + 5 && Math.abs(b.y - p.y) < p.size + 5) {
                p.hp--;
                wsPlaySound(1200, 'square', 0.08, 0.1);
                spawnWaystarParticles(p.x, p.y, 6, "#ffd700", 3);
                addWaystarFlash(p.x, p.y, 12);
                if (p.hp <= 0) { p.alive = false; waystarPiecesAlive--; addWaystarShockwave(p.x, p.y, "#ff00ff", 60, 12, 3); addWaystarFlash(p.x, p.y, 25); spawnWaystarParticles(p.x, p.y, 15, "#ff00ff", 5); wsPlaySound(200, 'sawtooth', 0.3, 0.2); }
                waystarPlayerBullets.splice(i, 1); break;
            }
        }
    }
    for (var i = waystarEnemyBullets.length - 1; i >= 0; i--) {
        var b = waystarEnemyBullets[i]; b.y += b.vy; b.life--;
        if (b.trail) { b.trail.push({ x: b.x, y: b.y, life: 8 }); if (b.trail.length > 4) b.trail.shift(); }
        if (b.y > 520 || b.life <= 0) { waystarEnemyBullets.splice(i, 1); continue; }
        if (waystarInvulnTimer <= 0 && Math.abs(b.x - waystarPlayer.x) < 14 && Math.abs(b.y - waystarPlayer.y) < 16) { applyWaystarHit(15, "ОСКОЛОК!"); waystarEnemyBullets.splice(i, 1); }
    }
    for (var i = 0; i < waystarPieces.length; i++) if (waystarPieces[i].alive) waystarPieces[i].pulse += 0.15;
}

function waystarStartReturning() {
    waystarState = "returning_anim"; waystarDialogActive = false; waystarReturning = true; waystarReturnTimer = 0;
    wsPlaySound(500, 'sine', 1.0, 0.3);
    addWaystarShockwave(200, 100, "#ff00ff", 400, 30, 6);
    for (var i = 0; i < 20; i++) { var ang = (i / 20) * Math.PI * 2; addWaystarLightning(200, 100, 200 + Math.cos(ang) * 250, 100 + Math.sin(ang) * 250, "#ff00ff", 0.8, 3); }
    for (var i = 0; i < 100; i++) spawnWaystarParticles(200, 100, 1, ["#ff00ff", "#ffffff", "#ffaa00"][Math.floor(Math.random() * 3)], 12);
    waystarSmallBoss = { x: 200, y: 100, size: 28, rotation: 0, pulse: 0, time: 0, alpha: 0, trail: [] };
    setTimeout(function() {
        if (!waystarActive) return;
        waystarState = "pre_phase3_dialog"; waystarDialogActive = true; waystarDialogStep = 0; waystarDialogAutoTimer = 0;
        waystarDialogQueue = [
            { speaker: "🌟 Путеводная Звезда (двойник)", text: "Ты справился с моим Легионом..." },
            { speaker: "🌟 Путеводная Звезда (двойник)", text: "Я стала вдвое сильнее! И вдвое меньше!" },
            { speaker: "🌟 Путеводная Звезда (двойник)", text: "Это твой последний шанс!" },
            { speaker: "🌟 Путеводная Звезда (двойник)", text: "УМРИ!" }
        ];
        for (var i = 0; i < waystarDialogQueue.length; i++) waystarDialogQueue[i].time = 2.5 + waystarDialogQueue[i].text.length * 0.05;
        waystarDialogOnComplete = function() { waystarStartPhase3(); };
    }, 3000);
}

function waystarStartPhase3() {
    waystarState = "phase3"; waystarDialogActive = false;
    waystarBossMaxHp = Math.max(15000, (window.playerFinalDamage || 80) * 60);
    waystarBossHp = waystarBossMaxHp;
    waystarSmallBoss.alpha = 0; waystarSmallBoss.size = 28; waystarSmallBoss.x = 200; waystarSmallBoss.y = 100; waystarSmallBoss.trail = [];
    waystarAttackTimer = 0; waystarAttackType = 0; waystarTypeTimer = 600;
    waystarAmbientTimer = 0; waystarShootCooldown = 0; waystarRageMode = false;
    waystarPhase3Embers = []; waystarPhase3Rings = [];
    waystarEscalationLevel = 0; waystarEscalationTimer = 0; waystarPhase3AttacksStarted = false;
    wsPlaySound(200, 'sawtooth', 1.0, 0.3); setTimeout(function() { wsPlaySound(400, 'square', 0.5, 0.25); }, 300); setTimeout(function() { wsPlaySound(800, 'sawtooth', 0.8, 0.3); }, 600);
    waystarShake = 40; waystarScreenFlash = 30; waystarScreenFlashColor = "#ff00ff"; waystarScreenDistort = 35;
    for (var i = 0; i < 6; i++) { setTimeout(function(idx) { addWaystarShockwave(200, 100, ["#ff00ff", "#ffd700", "#ffffff", "#ff00ff"][idx%4], 350, 30, 6); }, i * 150); }
    for (var i = 0; i < 30; i++) { var ang = (i / 30) * Math.PI * 2; addWaystarLightning(200, 100, 200 + Math.cos(ang) * 250, 100 + Math.sin(ang) * 250, i % 2 === 0 ? "#ff00ff" : "#ffffff", 1.0, 3); }
    for (var i = 0; i < 200; i++) spawnWaystarParticles(200, 100, 1, ["#ff00ff", "#ffffff", "#ffd700", "#ff4400"][Math.floor(Math.random() * 4)], 18);
    if (typeof showFloatingText === 'function') showFloatingText("💥 ФИНАЛЬНАЯ ФАЗА! 💥", "#ff00ff");
}

function waystarSpawnPhase3Attack() {
    var type = waystarAttackType; var s = waystarSpeedMult * (waystarRageMode ? 0.9 : 0.7); // ★ Замедлено ★
    if (type === 0) {
        var count = 5 + Math.floor(waystarEscalationLevel / 2); if (waystarRageMode) count += 1;
        var baseAngle = Math.atan2(waystarPlayer.y - waystarSmallBoss.y, waystarPlayer.x - waystarSmallBoss.x);
        for (var i = 0; i < count; i++) { var offset = (i - (count-1)/2) * 0.14; var ang = baseAngle + offset; waystarAttacks.push({ type: "shotgun_bullet", x: waystarSmallBoss.x, y: waystarSmallBoss.y, vx: Math.cos(ang) * 2.8 * s, vy: Math.sin(ang) * 2.8 * s, size: 6, damage: 9, life: 350, trail: [] }); }
        addWaystarShockwave(waystarSmallBoss.x, waystarSmallBoss.y, "#ff4400", 80, 15, 4);
        addWaystarFlash(waystarSmallBoss.x, waystarSmallBoss.y, 50);
        wsPlaySound(200, 'sawtooth', 0.2, 0.2);
    } else if (type === 1) {
        var bombCount = 1 + Math.floor(waystarEscalationLevel / 2); if (waystarRageMode) bombCount += 1;
        for (var k = 0; k < bombCount; k++) { var bx = 60 + Math.random() * 280; var by = 80 + Math.random() * 300; waystarBombs.push({ x: bx, y: by, timer: 220, maxTimer: 220, radius: 70, damage: 25, exploded: false, explosionTimer: 0, sunPhase: "big", sunScale: 1.0, sunColor: "#ffdd00", phaseTimer: 0 }); }
        wsPlaySound(500, 'sine', 0.3, 0.15);
    } else if (type === 2) {
        if (!waystarDash) { var dx = waystarPlayer.x - waystarSmallBoss.x; var dy = waystarPlayer.y - waystarSmallBoss.y; var len = Math.sqrt(dx * dx + dy * dy) || 1; waystarDash = { x: waystarSmallBoss.x, y: waystarSmallBoss.y, startX: waystarSmallBoss.x, startY: waystarSmallBoss.y, targetX: waystarPlayer.x, targetY: waystarPlayer.y, dirX: dx / len, dirY: dy / len, progress: 0, duration: 80, damage: 20, hit: false }; }
        wsPlaySound(150, 'sawtooth', 0.5, 0.25);
    } else if (type === 3) {
        waystarAttacks.push({ type: "giant_laser", state: "warning", x: waystarSmallBoss.x, y: waystarSmallBoss.y, angle: Math.atan2(waystarPlayer.y - waystarSmallBoss.y, waystarPlayer.x - waystarSmallBoss.x), width: 55, warningTimer: 100, activeTimer: 0, maxActive: 40, damage: 25, hit: false, trackTimer: 60 });
        wsPlaySound(400, 'square', 0.4, 0.2);
    } else if (type === 4) {
        var count = 14 + waystarEscalationLevel * 2; if (waystarRageMode) count += 3;
        for (var i = 0; i < count; i++) {
            var baseAng = (i / count) * Math.PI * 4; var delay = i * 9;
            (function(a, d) { setTimeout(function() { if (!waystarActive || waystarState !== "phase3") return; waystarAttacks.push({ type: "spiral", x: waystarSmallBoss.x, y: waystarSmallBoss.y, vx: Math.cos(a) * 1.8 * s, vy: Math.sin(a) * 1.8 * s, size: 6, damage: 9, life: 350, trail: [] }); }, d); })(baseAng, delay);
            (function(a, d) { setTimeout(function() { if (!waystarActive || waystarState !== "phase3") return; waystarAttacks.push({ type: "spiral", x: waystarSmallBoss.x, y: waystarSmallBoss.y, vx: Math.cos(-a) * 1.8 * s, vy: Math.sin(-a) * 1.8 * s, size: 6, damage: 9, life: 350, trail: [] }); }, d); })(baseAng, delay);
        }
        wsPlaySound(600, 'sine', 0.5, 0.15);
    } else if (type === 5) {
        var mineCount = 3 + Math.floor(waystarEscalationLevel / 2); if (waystarRageMode) mineCount += 1;
        for (var i = 0; i < mineCount; i++) { var bx = 40 + Math.random() * 320; var by = 80 + Math.random() * 320; waystarBombs.push({ x: bx, y: by, timer: 160, maxTimer: 160, radius: 40, damage: 12, exploded: false, explosionTimer: 0, small: true, sunPhase: "big", sunScale: 0.7, sunColor: "#ffdd00", phaseTimer: 0 }); }
        wsPlaySound(450, 'sine', 0.2, 0.12);
    }
}

function handleWaystarClick(ev) {
    if (!waystarActive) return;
    if (waystarFinalActive && waystarFinalPhase === "choice" && waystarChoiceSelection === null) {
        var rect = canvas.getBoundingClientRect();
        var mx = ev.clientX - rect.left;
        var my = ev.clientY - rect.top;
        var btnW = 300, btnX = 50, btnH = 70;
        var killY = 235;
        var spareY = 325;
        if (mx > btnX && mx < btnX + btnW) {
            if (my > killY && my < killY + btnH) {
                waystarChoiceSelection = "kill";
                waystarFinalPhase = "kill_flash";
                waystarFinalTimer = 0;
                wsPlaySound(300, 'sawtooth', 0.8, 0.4);
                waystarScreenFlash = 40; waystarScreenFlashColor = "#ffffff";
                waystarShake = 30;
                console.log("[WAYSTAR] Выбор: УБИТЬ");
                return;
            }
            if (my > spareY && my < spareY + btnH) {
                waystarChoiceSelection = "spare";
                waystarFinalPhase = "spare_dialog";
                waystarFinalTimer = 0;
                waystarSpareDialogStep = 0;
                waystarSpareDialogTimer = 0;
                setupWaystarSpareDialog();
                wsPlaySound(500, 'sine', 0.6, 0.25);
                console.log("[WAYSTAR] Выбор: ПОЩАДИТЬ");
                return;
            }
        }
    }
    if (waystarFinalActive && waystarFinalPhase === "spare_dialog") { advanceWaystarSpareDialog(); return; }
    if (waystarDialogActive) {
        if (waystarChoiceActive) {
            var rect = canvas.getBoundingClientRect();
            var mx = ev.clientX - rect.left;
            var my = ev.clientY - rect.top;
            var btnW = 360, btnX = 20, startY = 240, btnH = 55, gap = 12;
            for (var i = 0; i < 3; i++) { var by = startY + i * (btnH + gap); if (mx > btnX && mx < btnX + btnW && my > by && my < by + btnH) { selectWaystarChoice(i + 1); return; } }
        } else {
            waystarProgressDialog();
        }
    }
}
function handleWaystarTouchStart(ev) {
    if (!waystarActive) return;
    ev.preventDefault();
    if (waystarDialogActive || (waystarFinalActive && (waystarFinalPhase === "choice" || waystarFinalPhase === "spare_dialog"))) { var t = ev.touches[0]; handleWaystarClick({ clientX: t.clientX, clientY: t.clientY }); return; }
    if (ev.touches.length > 0) { var rect = canvas.getBoundingClientRect(); waystarTouchActive = true; waystarTouchId = ev.touches[0].identifier; waystarTouchX = ev.touches[0].clientX - rect.left; waystarTouchY = ev.touches[0].clientY - rect.top; }
}
function handleWaystarTouchMove(ev) { if (!waystarActive || !waystarTouchActive) return; ev.preventDefault(); var rect = canvas.getBoundingClientRect(); for (var i = 0; i < ev.touches.length; i++) if (ev.touches[i].identifier === waystarTouchId) { waystarTouchX = ev.touches[i].clientX - rect.left; waystarTouchY = ev.touches[i].clientY - rect.top; break; } }
function handleWaystarTouchEnd(ev) { if (!waystarTouchActive) return; var still = false; for (var i = 0; i < ev.touches.length; i++) if (ev.touches[i].identifier === waystarTouchId) { still = true; break; } if (!still) { waystarTouchActive = false; waystarTouchId = null; } }
function handleWaystarKeyDown(ev) { if (!waystarActive) return; waystarKeys[ev.key.toLowerCase()] = true; }
function handleWaystarKeyUp(ev) { if (!waystarActive) return; waystarKeys[ev.key.toLowerCase()] = false; }

function setupWaystarSpareDialog() {
    waystarSpareDialog = [
        { speaker: "🌟 Путеводная Звезда", text: "Ты... ты пощадил меня?" },
        { speaker: "🌟 Путеводная Звезда", text: "Прости меня, путник. Я не хотела с тобой сражаться." },
        { speaker: "🌟 Путеводная Звезда", text: "Я просто... не могла тебя пропустить дальше." },
        { speaker: "🌟 Путеводная Звезда", text: "За этим рубежом — места, куда не ступала нога ни одного живого существа. Там правит сама смерть." },
        { speaker: "🌟 Путеводная Звезда", text: "Я видела, как тысячи сильных мира сего уходили туда — и не возвращались." },
        { speaker: "🌟 Путеводная Звезда", text: "Я думала, что ты станешь ещё одним. Что ты не готов." },
        { speaker: "🌟 Путеводная Звезда", text: "Но ты победил меня. Ты оказался сильнее, чем я могла себе представить." },
        { speaker: "🌟 Путеводная Звезда", text: "Значит... ты готов. Ты действительно готов идти дальше." },
        { speaker: "🌟 Путеводная Звезда", text: "Иди, путник. Путь перед тобой открыт." },
        { speaker: "🌟 Путеводная Звезда", text: "И знай — я в долгу перед тобой. Однажды, когда тебе будет тяжело..." },
        { speaker: "🌟 Путеводная Звезда", text: "...я приду на помощь. Обещаю." },
        { speaker: "🌟 Путеводная Звезда", text: "Прощай, герой. Пусть звёзды осветят твой путь." }
    ];
    waystarSpareDialogStep = 0;
    waystarSpareDialogTimer = 0;
}

function advanceWaystarSpareDialog() {
    waystarSpareDialogStep++;
    waystarSpareDialogTimer = 0;
    wsPlaySound(700, 'triangle', 0.05, 0.1);
    if (waystarSpareDialogStep >= waystarSpareDialog.length) {
        waystarFinalPhase = "spare_blessing";
        waystarFinalTimer = 0;
        waystarSpareBlessing = { active: true, progress: 0, flash: 0 };
        console.log("[WAYSTAR] Финал: диалог завершён");
    }
}

function updateWaystarPlayer() {
    if (waystarState === "phase2") {
        var mx = 0; if (waystarKeys.a || waystarKeys.arrowleft) mx -= 1; if (waystarKeys.d || waystarKeys.arrowright) mx += 1;
        if (waystarTouchActive) { var tx = waystarTouchX - waystarPlayer.x; if (Math.abs(tx) > 5) mx = tx > 0 ? 1 : -1; }
        waystarPlayer.x += mx * 5; waystarPlayer.x = Math.max(20, Math.min(380, waystarPlayer.x));
    } else if (waystarState === "phase1" || waystarState === "phase3") {
        var mx = 0, my = 0, speed = 4; // ★ Чуть медленнее игрока ★
        if (waystarTouchActive) { var tx = waystarTouchX - waystarPlayer.x, ty = waystarTouchY - waystarPlayer.y; var dist = Math.sqrt(tx * tx + ty * ty); if (dist > 5) { mx = tx / dist; my = ty / dist; } }
        else { if (waystarKeys.w || waystarKeys.arrowup) my -= 1; if (waystarKeys.s || waystarKeys.arrowdown) my += 1; if (waystarKeys.a || waystarKeys.arrowleft) mx -= 1; if (waystarKeys.d || waystarKeys.arrowright) mx += 1; if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; } }
        waystarPlayer.x += mx * speed; waystarPlayer.y += my * speed;
        waystarPlayer.x = Math.max(16, Math.min(384, waystarPlayer.x)); waystarPlayer.y = Math.max(80, Math.min(484, waystarPlayer.y));
    }
    if (waystarInvulnTimer > 0) waystarInvulnTimer--;
}

function updateWaystarBoss() {
    if (waystarDialogActive) return;
    if (waystarState === "phase1") { waystarBoss.x += waystarBoss.vx * waystarSpeedMult / WAYSTAR_SLOWDOWN; if (waystarBoss.x < 60 || waystarBoss.x > 340) waystarBoss.vx *= -1; waystarBoss.rotation += 0.01 * waystarSpeedMult; waystarBoss.pulse += 0.06; waystarBoss.time += 0.015; }
    else if (waystarState === "phase3") { waystarSmallBoss.alpha = Math.min(1, waystarSmallBoss.alpha + 0.015); var mSpeed = (waystarRageMode ? 1.3 : 0.9) / WAYSTAR_SLOWDOWN; mSpeed += waystarEscalationLevel * 0.08; waystarSmallBoss.x += Math.sin(waystarSmallBoss.time) * mSpeed * waystarSpeedMult; waystarSmallBoss.x = Math.max(40, Math.min(360, waystarSmallBoss.x)); waystarSmallBoss.y = 100 + Math.sin(waystarSmallBoss.time * 0.7) * (waystarRageMode ? 15 : 10); waystarSmallBoss.rotation += (waystarRageMode ? 0.05 : 0.03) * waystarSpeedMult; waystarSmallBoss.pulse += (waystarRageMode ? 0.18 : 0.11); waystarSmallBoss.time += (waystarRageMode ? 0.045 : 0.03); }
    if (waystarBoss2.active === true) { waystarBoss2.x += waystarBoss2.vx * waystarSpeedMult / WAYSTAR_SLOWDOWN; if (waystarBoss2.x < 60 || waystarBoss2.x > 340) waystarBoss2.vx *= -1; waystarBoss2.rotation -= 0.015 * waystarSpeedMult; waystarBoss2.pulse += 0.08; }
    else if (waystarBoss2.active === "leaving") { waystarBoss2.y -= 4; waystarBoss2.alpha -= 0.02; if (waystarBoss2.alpha <= 0) waystarBoss2.active = false; }
}

function updateWaystarAttacks() {
    for (var i = waystarAttacks.length - 1; i >= 0; i--) {
        var a = waystarAttacks[i];
        if (a.type === "meteor" || a.type === "spiral" || a.type === "star_rain" || a.type === "shotgun_bullet") {
            a.trail.push({ x: a.x, y: a.y, life: 10 }); if (a.trail.length > 6) a.trail.shift();
            a.x += a.vx; a.y += a.vy; a.rotation += (a.rotSpeed||0); a.life--;
            if (a.y > 520 || a.x < -30 || a.x > 430 || a.life <= 0) { if (a.y > 500 && a.type === "meteor") { addWaystarShockwave(a.x, 500, "#ff8800", 50, 12, 3); spawnWaystarParticles(a.x, 500, 10, "#ff8800", 5); } waystarAttacks.splice(i, 1); continue; }
            if (waystarInvulnTimer <= 0 && Math.sqrt(Math.pow(waystarPlayer.x - a.x, 2) + Math.pow(waystarPlayer.y - a.y, 2)) < a.size + 8) { var msg = a.type === "meteor" ? "МЕТЕОР!" : (a.type === "spiral" ? "ВИХРЬ!" : (a.type === "shotgun_bullet" ? "ДРОБЬ!" : "ЗВЕЗДА!")); applyWaystarHit(a.damage, msg); waystarAttacks.splice(i, 1); }
        }
        else if (a.type === "laser") {
            if (a.state === "warning") { a.warningTimer--; a.chargeParticles++; if (a.chargeParticles % 5 === 0) { spawnWaystarParticles(a.x + (Math.random() - 0.5) * a.width, 490 - Math.random() * 40, 1, "#ff3333", 3); } if (a.warningTimer <= 0) { a.state = "active"; a.activeTimer = a.maxActive; addWaystarFlash(a.x, 250, 100); addWaystarShockwave(a.x, 250, "#ff3333", 120, 18, 4); wsPlaySound(150, 'sawtooth', 0.7, 0.35); waystarShake = 15; waystarScreenFlash = 8; waystarScreenFlashColor = "#ff3333"; for (var l = 0; l < 3; l++) addWaystarLightning(a.x, 0, a.x + (Math.random() - 0.5) * 30, 500, "#ffffff", 0.8, 1.5); } }
            else if (a.state === "active") { a.activeTimer--; if (!a.hit && waystarInvulnTimer <= 0 && Math.abs(waystarPlayer.x - a.x) < a.width / 2 + 8) { a.hit = true; applyWaystarHit(a.damage, "ЛАЗЕР!"); } if (a.activeTimer % 3 === 0) spawnWaystarParticles(a.x + (Math.random() - 0.5) * a.width, Math.random() * 500, 2, Math.random() > 0.5 ? "#ffffff" : "#ff3333", 4); if (a.activeTimer <= 0) a.state = "done"; }
            else { waystarAttacks.splice(i, 1); continue; }
        }
        else if (a.type === "giant_laser") {
            if (a.state === "warning") { a.warningTimer--; if (a.trackTimer > 0) { a.trackTimer--; a.x = waystarSmallBoss.x; a.y = waystarSmallBoss.y; a.angle = Math.atan2(waystarPlayer.y - a.y, waystarPlayer.x - a.x); } if (a.warningTimer <= 0) { a.state = "active"; a.activeTimer = a.maxActive; a.x = waystarSmallBoss.x; a.y = waystarSmallBoss.y; addWaystarFlash(a.x, a.y, 150); addWaystarShockwave(a.x, a.y, "#ff00ff", 180, 22, 5); wsPlaySound(150, 'sawtooth', 0.9, 0.4); waystarShake = 20; waystarScreenFlash = 15; waystarScreenFlashColor = "#ff00ff"; for (var sIdx = 0; sIdx < 5; sIdx++) addWaystarSlash(a.x, a.y, a.angle + (Math.random()-0.5)*0.6, 70, 4); } }
            else if (a.state === "active") { a.activeTimer--; if (!a.hit && waystarInvulnTimer <= 0) { var dx = waystarPlayer.x - a.x, dy = waystarPlayer.y - a.y; var dist = Math.sqrt(dx*dx + dy*dy); var playerAngle = Math.atan2(dy, dx); var angleDiff = Math.abs(playerAngle - a.angle); while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2); var perpDist = Math.abs(Math.sin(angleDiff)) * dist; if (perpDist < a.width / 2 + 10) { a.hit = true; applyWaystarHit(a.damage, "ГИГА-ЛАЗЕР!"); } } if (a.activeTimer % 3 === 0) { var dist2 = Math.random() * 400; spawnWaystarParticles(a.x + Math.cos(a.angle) * dist2, a.y + Math.sin(a.angle) * dist2, 2, ["#ff00ff", "#ffffff"][Math.floor(Math.random()*2)], 5); } if (a.activeTimer <= 0) a.state = "done"; }
            else { waystarAttacks.splice(i, 1); continue; }
        }
        else if (a.type === "constellation") {
            // ★ Не используется (заменено на змейку) ★
            waystarAttacks.splice(i, 1);
        }
    }
    for (var i = waystarBombs.length - 1; i >= 0; i--) {
        var bomb = waystarBombs[i];
        if (!bomb.exploded) {
            bomb.timer--; bomb.phaseTimer++;
            var totalTime = bomb.maxTimer; var elapsed = totalTime - bomb.timer; var progress = elapsed / totalTime;
            if (progress < 0.4) { bomb.sunPhase = "big"; bomb.sunColor = "#ffdd00"; bomb.sunScale = 1.0 + Math.sin(performance.now() / 150) * 0.04; }
            else if (progress < 0.7) { bomb.sunPhase = "shrink"; var t = (progress - 0.4) / 0.3; bomb.sunScale = 1.0 - t * 0.6; bomb.sunColor = t < 0.5 ? "#ffdd00" : "#ffffff"; }
            else if (progress < 0.9) { bomb.sunPhase = "blue"; var t2 = (progress - 0.7) / 0.2; bomb.sunScale = 0.4 - t2 * 0.15; bomb.sunColor = "#0088ff"; }
            else { bomb.sunPhase = "flash"; bomb.sunScale = 0.25 + Math.abs(Math.sin(performance.now() / 60)) * 0.12; bomb.sunColor = "#ffffff"; }
            if (bomb.phaseTimer % 8 === 0) { spawnWaystarParticles(bomb.x + (Math.random() - 0.5) * 50 * bomb.sunScale, bomb.y + (Math.random() - 0.5) * 50 * bomb.sunScale, 1, bomb.sunColor, 2.5); }
            if (bomb.timer <= 0) {
                bomb.exploded = true; bomb.explosionTimer = 20;
                addWaystarShockwave(bomb.x, bomb.y, "#00aaff", bomb.radius * 1.8, 25, 6);
                addWaystarShockwave(bomb.x, bomb.y, "#ffffff", bomb.radius * 1.3, 18, 4);
                addWaystarFlash(bomb.x, bomb.y, bomb.radius * 1.5);
                spawnWaystarParticles(bomb.x, bomb.y, 40, "#0088ff", 10);
                spawnWaystarParticles(bomb.x, bomb.y, 25, "#ffffff", 7);
                for (var lb = 0; lb < 5; lb++) { var lang = Math.random() * Math.PI * 2; addWaystarLightning(bomb.x, bomb.y, bomb.x + Math.cos(lang) * (bomb.radius * 1.3), bomb.y + Math.sin(lang) * (bomb.radius * 1.3), Math.random() > 0.5 ? "#00aaff" : "#ffffff", 0.85, 2.5); }
                wsPlaySound(60, 'sawtooth', 1.2, 0.5);
                waystarShake = 30; waystarScreenFlash = 12; waystarScreenFlashColor = "#00aaff";
                var dx = waystarPlayer.x - bomb.x, dy = waystarPlayer.y - bomb.y;
                if (Math.sqrt(dx*dx + dy*dy) < bomb.radius && waystarInvulnTimer <= 0) applyWaystarHit(bomb.damage, "ВЗРЫВ!");
            }
        } else { bomb.explosionTimer--; if (bomb.explosionTimer <= 0) waystarBombs.splice(i, 1); }
    }
    if (waystarDash) {
        waystarDash.progress++;
        var t = waystarDash.progress / waystarDash.duration;
        if (t >= 1) waystarDash = null;
        else {
            var newX = waystarDash.startX + (waystarDash.targetX - waystarDash.startX) * t;
            var newY = waystarDash.startY + (waystarDash.targetY - waystarDash.startY) * t;
            for (var k = waystarAttacks.length - 1; k >= 0; k--) { if (waystarAttacks[k].type === "shotgun_bullet" || waystarAttacks[k].type === "spiral" || waystarAttacks[k].type === "star_rain") { var d = Math.sqrt(Math.pow(waystarAttacks[k].x - newX, 2) + Math.pow(waystarAttacks[k].y - newY, 2)); if (d < 80) { spawnWaystarParticles(waystarAttacks[k].x, waystarAttacks[k].y, 6, "#ff00ff", 4); waystarAttacks.splice(k, 1); } } }
            if (!waystarDash.hit && waystarInvulnTimer <= 0) { var d = Math.sqrt(Math.pow(waystarPlayer.x - newX, 2) + Math.pow(waystarPlayer.y - newY, 2)); if (d < 25) { waystarDash.hit = true; applyWaystarHit(waystarDash.damage, "РЫВОК!"); var angle = Math.atan2(waystarPlayer.y - newY, waystarPlayer.x - newX); waystarPlayer.x += Math.cos(angle) * 60; waystarPlayer.y += Math.sin(angle) * 60; waystarPlayer.x = Math.max(16, Math.min(384, waystarPlayer.x)); waystarPlayer.y = Math.max(80, Math.min(484, waystarPlayer.y)); waystarShake = 35; addWaystarShockwave(waystarPlayer.x, waystarPlayer.y, "#ff00ff", 180, 18, 5); } }
            waystarSmallBoss.x = newX; waystarSmallBoss.y = newY;
            for (var i = 0; i < 3; i++) spawnWaystarParticles(newX + (Math.random()-0.5)*25, newY + (Math.random()-0.5)*25, 1, ["#ff00ff", "#ffffff"][Math.floor(Math.random()*2)], 4);
            if (waystarDash.progress % 5 === 0) addWaystarSlash(newX, newY, Math.random() * Math.PI * 2, 35, 3);
        }
    }
    // ★ Обновляем змейки ★
    updateWaystarSnakes();
}

function distToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    var projX = x1 + t * dx, projY = y1 + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

function applyWaystarHit(dmg, textMsg) {
    if (isWaystarModerActive()) { if (textMsg && typeof showFloatingText === 'function') showFloatingText(textMsg + " (∞ HP)", "#ffff00"); return; }
    if (waystarInvulnTimer > 0) return;
    waystarPlayerHp -= dmg; waystarInvulnTimer = 45; waystarShake = 15;
    waystarScreenFlash = 8; waystarScreenFlashColor = "#ff0000"; waystarVignette = 15;
    spawnWaystarParticles(waystarPlayer.x, waystarPlayer.y, 18, "#ff3333", 6);
    addWaystarShockwave(waystarPlayer.x, waystarPlayer.y, "#ff0000", 70, 12, 3);
    addWaystarFlash(waystarPlayer.x, waystarPlayer.y, 18);
    if (textMsg && typeof showFloatingText === 'function') showFloatingText(textMsg, "#ff3333");
    wsPlaySound(80, 'sawtooth', 0.5, 0.2);
    updateWaystarHpBar();
    if (waystarState === "phase3" && !waystarRageMode && waystarPlayerHp < waystarPlayerMaxHp * 0.5) {
        waystarRageMode = true;
        waystarScreenFlash = 25; waystarScreenFlashColor = "#ff0000"; waystarShake = 30;
        if (typeof showFloatingText === 'function') showFloatingText("🔥 RAGE MODE!", "#ff0000");
        for (var i = 0; i < 40; i++) spawnWaystarParticles(waystarSmallBoss.x, waystarSmallBoss.y, 1, ["#ff0000", "#ff6600", "#ffff00"][Math.floor(Math.random()*3)], 12);
        wsPlaySound(120, 'sawtooth', 1.5, 0.4);
    }
    if (waystarPlayerHp <= 0) waystarDefeat();
}

function updateWaystarHpBar() {
    var el = document.getElementById("arenaHP");
    if (el) { if (isWaystarModerActive()) { el.innerText = "∞"; } else { el.innerText = Math.max(0, Math.ceil(waystarPlayerHp)); } }
}

function waystarVictory() {
    if (waystarRewardGiven) return;
    waystarRewardGiven = true;
    console.log("[WAYSTAR] ПОБЕДА! Запуск финальной сцены");
    waystarAttacks = [];
    waystarPlayerBullets = [];
    waystarEnemyBullets = [];
    waystarBombs = [];
    waystarDash = null;
    waystarSnakes = [];
    waystarDialogActive = false;
    waystarDialogQueue = [];
    waystarDialogStep = 0;
    waystarChoiceActive = false;
    waystarChoiceResolved = false;
    waystarFinalActive = true;
    waystarFinalPhase = "choice";
    waystarFinalTimer = 0;
    waystarFinalWatchdog = 0;
    waystarChoiceSelection = null;
    waystarSpareBlessing = { active: false, progress: 0, flash: 0 };
    waystarSpareDialog = [];
    waystarSpareDialogStep = 0;
    waystarSpareDialogTimer = 0;
    if (waystarAnimFrame) { try { cancelAnimationFrame(waystarAnimFrame); } catch(e) {} }
    waystarAnimFrame = requestAnimationFrame(waystarRenderLoop);
    wsPlaySound(500, 'sine', 0.6, 0.2);
    setTimeout(function() { wsPlaySound(800, 'sine', 0.6, 0.2); }, 200);
}

function grantWaystarReward() {
    console.log("[WAYSTAR] Выдача награды (убийство)");
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && !defeatedBosses.includes(500)) { defeatedBosses.push(500); if (typeof saveAll === 'function') saveAll(); }
    if (typeof addItem === 'function') addItem("waystar", 1);
    if (typeof secretGachaTokens !== 'undefined') secretGachaTokens = (secretGachaTokens || 0) + 1;
    if (typeof saveAll === 'function') saveAll();
    if (typeof showFloatingText === 'function') {
        showFloatingText("⭐ ПОБЕДА! ⭐", "#ffd700");
        setTimeout(function() { showFloatingText("🌟 Путеводная Звезда получена!", "#ffd700"); }, 600);
        setTimeout(function() { showFloatingText("💎 +1 СЕКРЕТНЫЙ ТОКЕН", "#ff00ff"); }, 1200);
    }
}

function grantWaystarSpareDebt() {
    console.log("[WAYSTAR] Пощада: долг записан (без предмета)");
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && !defeatedBosses.includes(500)) { defeatedBosses.push(500); if (typeof saveAll === 'function') saveAll(); }
    try {
        if (typeof window !== 'undefined') {
            window.waystarOwesDebt = true;
            if (typeof slotData !== 'undefined' && slotData) {
                slotData.waystarOwesDebt = true;
                if (typeof saveAll === 'function') saveAll();
            }
        }
    } catch(e) { console.warn("[WAYSTAR] Не удалось сохранить флаг долга:", e); }
    if (typeof showFloatingText === 'function') {
        showFloatingText("🤝 Звезда запомнила твою доброту", "#88ddff");
        setTimeout(function() { showFloatingText("💫 Однажды она вернёт долг...", "#88ddff"); }, 1500);
    }
}

function waystarDefeat() {
    if (isWaystarModerActive()) { waystarPlayerHp = 999999; return; }
    console.log("[WAYSTAR] Поражение");
    waystarState = "defeat";
    if (typeof showFloatingText === 'function') showFloatingText("ТЫ ПАЛ...", "#ff0000");
    wsPlaySound(40, 'sawtooth', 2.0, 0.4);
    waystarScreenFlash = 60; waystarScreenFlashColor = "#ff0000";
    for (var i = 0; i < 60; i++) spawnWaystarParticles(waystarPlayer.x, waystarPlayer.y, 1, "#ff3333", 10);
    setTimeout(function() { stopWaystarFight(); if (typeof playerHp !== 'undefined') playerHp = 0; if (typeof defeat === 'function') defeat(); }, 2500);
}

function updateWaystarFinalScene() {
    if (!waystarFinalActive) return;
    try {
        waystarFinalTimer++;
        waystarFinalWatchdog++;
        if (waystarFinalWatchdog > 4000 && waystarFinalPhase !== "done") {
            console.warn("[WAYSTAR] WATCHDOG (фаза: " + waystarFinalPhase + ")");
            waystarFinalPhase = "done";
            waystarFinalTimer = 0;
            return;
        }
        if (waystarFinalPhase === "choice") { /* ждём клик */ }
        else if (waystarFinalPhase === "kill_flash") {
            if (waystarFinalTimer > 40) {
                waystarFinalPhase = "kill_reward"; waystarFinalTimer = 0;
                grantWaystarReward();
                if (typeof showFloatingText === 'function') showFloatingText("💀 ЗВЕЗДА УНИЧТОЖЕНА!", "#ffd700");
                for (var i = 0; i < 150; i++) spawnWaystarParticles(200 + (Math.random()-0.5)*300, 250 + (Math.random()-0.5)*300, 1, ["#ffd700", "#ffffff", "#ffaa00"][Math.floor(Math.random()*3)], 12);
            }
        }
        else if (waystarFinalPhase === "kill_reward") {
            if (waystarFinalTimer > 80) { waystarFinalPhase = "blackout"; waystarFinalTimer = 0; waystarWakeText = "Вы очнулись, но чувствуете себя плохо.\nПродолжайте путь..."; }
        }
        else if (waystarFinalPhase === "spare_dialog") {
            if (waystarFinalTimer % 4 === 0) { spawnWaystarParticles(waystarSmallBoss.x + (Math.random()-0.5)*60, waystarSmallBoss.y + (Math.random()-0.5)*60, 1, ["#ffd700", "#88ddff", "#ffffff"][Math.floor(Math.random()*3)], 3); }
            waystarSmallBoss.pulse += 0.08;
            waystarSpareDialogTimer++;
            var currentLine = waystarSpareDialog[waystarSpareDialogStep];
            if (currentLine) {
                var lineDuration = 3.5 + currentLine.text.length * 0.06;
                if (waystarSpareDialogTimer > lineDuration * 60) { advanceWaystarSpareDialog(); }
            }
        }
        else if (waystarFinalPhase === "spare_blessing") {
            var beamProgress = Math.min(1, waystarFinalTimer / 120);
            if (waystarFinalTimer % 3 === 0) {
                var bx = waystarSmallBoss.x + (waystarPlayer.x - waystarSmallBoss.x) * beamProgress;
                var by = waystarSmallBoss.y + (waystarPlayer.y - waystarSmallBoss.y) * beamProgress;
                spawnWaystarParticles(bx, by, 2, "#ffd700", 3);
            }
            if (waystarFinalTimer % 6 === 0) { addWaystarLightning(waystarSmallBoss.x, waystarSmallBoss.y, waystarPlayer.x, waystarPlayer.y, "#ffd700", 0.85, 2.5); }
            waystarSmallBoss.pulse += 0.25;
            if (waystarFinalTimer % 15 === 0) { addWaystarShockwave(waystarSmallBoss.x, waystarSmallBoss.y, "#ffd700", 100, 15, 2); }
            if (waystarFinalTimer >= 120) {
                waystarScreenFlash = 35; waystarScreenFlashColor = "#ffd700";
                for (var i = 0; i < 50; i++) { spawnWaystarParticles(waystarPlayer.x + (Math.random()-0.5)*40, waystarPlayer.y + (Math.random()-0.5)*40, 1, ["#ffd700", "#ffffff", "#88ddff"][Math.floor(Math.random()*3)], 7); }
                addWaystarShockwave(waystarPlayer.x, waystarPlayer.y, "#ffd700", 200, 30, 5);
                wsPlaySound(500, 'sine', 0.8, 0.25);
                setTimeout(function() { wsPlaySound(700, 'sine', 0.6, 0.2); }, 200);
                setTimeout(function() { wsPlaySound(1000, 'sine', 0.8, 0.25); }, 400);
                grantWaystarSpareDebt();
                waystarFinalPhase = "spare_farewell";
                waystarFinalTimer = 0;
                console.log("[WAYSTAR] Финал: благословение передано, долг записан");
            }
        }
        else if (waystarFinalPhase === "spare_farewell") {
            waystarSmallBoss.alpha -= 0.008;
            waystarSmallBoss.size *= 0.997;
            if (waystarFinalTimer % 5 === 0) { spawnWaystarParticles(waystarSmallBoss.x + (Math.random()-0.5)*50, waystarSmallBoss.y + (Math.random()-0.5)*50, 1, ["#ffd700", "#88ddff"][Math.floor(Math.random()*2)], 1.5); }
            if (waystarFinalTimer % 40 === 0) { addWaystarShockwave(waystarSmallBoss.x, waystarSmallBoss.y, "#ffd700", 100, 20, 2); wsPlaySound(700 + Math.random()*300, 'sine', 0.5, 0.08); }
            if (waystarSmallBoss.alpha <= 0 || waystarFinalTimer > 300) {
                waystarSmallBoss.alpha = 0;
                waystarScreenFlash = 30; waystarScreenFlashColor = "#ffd700";
                for (var i = 0; i < 60; i++) { spawnWaystarParticles(200 + (Math.random()-0.5)*400, 100 + (Math.random()-0.5)*200, 1, ["#ffd700", "#ffffff", "#88ddff"][Math.floor(Math.random()*3)], 8); }
                addWaystarShockwave(200, 100, "#ffd700", 350, 35, 5);
                addWaystarShockwave(200, 100, "#ffffff", 280, 28, 3);
                wsPlaySound(400, 'sine', 1.0, 0.25);
                setTimeout(function() { wsPlaySound(600, 'sine', 1.0, 0.2); }, 250);
                setTimeout(function() { wsPlaySound(900, 'sine', 1.2, 0.25); }, 500);
                console.log("[WAYSTAR] Финал: звезда растворилась");
                setTimeout(function() {
                    if (!waystarFinalActive) return;
                    waystarFinalPhase = "blackout";
                    waystarFinalTimer = 0;
                    waystarWakeText = "Звезда исчезла в тёплом свете...\n\nПуть перед тобой открыт. Ты готов.\n\nОна запомнила твою доброту. Однажды... она вернёт долг.";
                }, 2000);
            }
        }
        else if (waystarFinalPhase === "blackout") {
            if (waystarBlackoutAlpha < 1) waystarBlackoutAlpha = Math.min(1, waystarBlackoutAlpha + 0.025);
            if (waystarBlackoutAlpha >= 1 && waystarFinalTimer > 80) { waystarFinalPhase = "wakeup"; waystarFinalTimer = 0; if (!waystarWakeText) waystarWakeText = "Продолжайте путь..."; }
        }
        else if (waystarFinalPhase === "wakeup") {
            waystarBlackoutAlpha = 1;
            waystarWakeAlpha = Math.min(1, waystarWakeAlpha + 0.015);
            if (waystarFinalTimer > 400) { waystarFinalPhase = "done"; waystarFinalTimer = 0; }
        }
        else if (waystarFinalPhase === "done") {
            if (!waystarFinalDone) {
                waystarFinalDone = true;
                console.log("[WAYSTAR] Финал: завершение");
                waystarFinalActive = false;
                stopWaystarFight();
                if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
                if (typeof victory === 'function') victory();
            }
        }
    } catch(e) {
        console.error("[WAYSTAR] ОШИБКА в updateWaystarFinalScene:", e);
        console.error(e.stack);
        waystarFinalPhase = "done";
        waystarFinalTimer = 0;
    }
}

function waystarRenderLoop() {
    if (!waystarActive || !ctx || !canvas) return;
    if (waystarFinalActive) {
        try {
            updateWaystarFinalScene();
            renderWaystarFinalScene();
            updateWaystarMegaEffects();
            for (var i = waystarParticles.length - 1; i >= 0; i--) { var p = waystarParticles[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life--; if (p.life <= 0) waystarParticles.splice(i, 1); }
            for (var i = waystarTexts.length - 1; i >= 0; i--) { var t = waystarTexts[i]; t.y += t.vy; t.life--; if (t.life <= 0) waystarTexts.splice(i, 1); }
            if (waystarShake > 0.1) waystarShake *= 0.85;
            if (waystarScreenFlash > 0) waystarScreenFlash--;
        } catch(e) { console.error("[WAYSTAR] ОШИБКА в финале:", e); waystarFinalPhase = "done"; }
        waystarAnimFrame = requestAnimationFrame(waystarRenderLoop);
        return;
    }
    if (waystarSplitAnim) { waystarSplitAnim.timer++; var t = Math.min(1, waystarSplitAnim.timer / waystarSplitAnim.duration); waystarBoss.x = waystarSplitAnim.boss1StartX + (waystarSplitAnim.boss1TargetX - waystarSplitAnim.boss1StartX) * t; waystarBoss2.x = waystarSplitAnim.boss2StartX + (waystarSplitAnim.boss2TargetX - waystarSplitAnim.boss2StartX) * t; waystarBoss2.alpha = Math.min(1, t * 2); waystarBoss.rotation += 0.025; waystarBoss2.rotation -= 0.025; }
    if (waystarEscapeAnim) { waystarEscapeAnim.timer++; var et = Math.min(1, waystarEscapeAnim.timer / waystarEscapeAnim.duration); waystarBoss2.y = waystarEscapeAnim.startY - et * 300; waystarBoss2.x = waystarEscapeAnim.startX + Math.sin(et * Math.PI * 2) * 30; waystarBoss2.size = 40 * (1 - et * 0.6); waystarBoss2.alpha = 1 - et * 0.5; waystarBoss2.rotation += 0.08; if (et < 0.9) spawnWaystarParticles(waystarBoss2.x, waystarBoss2.y, 2, "#ff00ff", 3); }
    if (!waystarDialogActive) {
        if (waystarState === "phase1") {
            if (waystarBossHp <= waystarBossMaxHp * 0.5 && waystarBossHp > 0) { waystarTriggerSplit(); }
            else {
                updateWaystarPlayer(); updateWaystarShooting();
                for (var i = waystarPlayerBullets.length - 1; i >= 0; i--) {
                    var b = waystarPlayerBullets[i]; b.y += b.vy; b.x += (b.vx || 0); b.life--;
                    b.trail.push({ x: b.x, y: b.y, life: 10 }); if (b.trail.length > 5) b.trail.shift();
                    var dx = b.x - waystarBoss.x, dy = b.y - waystarBoss.y;
                    if (Math.sqrt(dx * dx + dy * dy) < waystarBoss.size + b.size) {
                        waystarBossHp -= b.damage; waystarBossFlash = 6;
                        spawnWaystarParticles(b.x, b.y, 6, "#ffd700", 4); addWaystarFlash(b.x, b.y, 12);
                        if (Math.random() < 0.3) addWaystarLightning(b.x, b.y, b.x+(Math.random()-0.5)*50, b.y+(Math.random()-0.5)*50, "#ffffff", 0.6, 2);
                        wsPlaySound(1400, 'square', 0.08, 0.08);
                        if (waystarBossHp < waystarBossMaxHp * 0.5) waystarBossHp = waystarBossMaxHp * 0.5;
                        waystarPlayerBullets.splice(i, 1); continue;
                    }
                    if (b.y < -20 || b.life <= 0) waystarPlayerBullets.splice(i, 1);
                }
                updateWaystarBoss(); updateWaystarAttacks();
                waystarAttackTimer++;
                // ★ Замедлено: интервал атак увеличен в 1.5 раза ★
                var aRate = Math.floor((50 / waystarSpeedMult) * WAYSTAR_SLOWDOWN);
                if (waystarAttackTimer >= aRate) { waystarAttackTimer = 0; waystarSpawnAttack(); }
                waystarTypeTimer--;
                if (waystarTypeTimer <= 0) { waystarAttackType = Math.floor(Math.random() * 5); waystarTypeTimer = Math.floor(400 + Math.random() * 200); var typeNames = ["МЕТЕОРЫ", "ВИХРЬ", "ЛАЗЕРЫ", "ЗМЕЙКА", "ЗВЁЗДНЫЙ ДОЖДЬ"]; spawnWaystarText(200, 60, typeNames[waystarAttackType], "#ffffff", 70); addWaystarShockwave(waystarBoss.x, waystarBoss.y, "#ffffff", 60, 12, 2); }
            }
        } else if (waystarState === "phase2") { updateWaystarPlayer(); updateWaystarSpaceInvaders(); }
        else if (waystarState === "phase3") {
            updateWaystarAmbient(); updateWaystarPhase3Special(); updateWaystarPlayer(); updateWaystarShooting();
            for (var i = waystarPlayerBullets.length - 1; i >= 0; i--) {
                var b = waystarPlayerBullets[i]; b.y += b.vy; b.life--;
                b.trail.push({ x: b.x, y: b.y, life: 10 }); if (b.trail.length > 5) b.trail.shift();
                var dx = b.x - waystarSmallBoss.x, dy = b.y - waystarSmallBoss.y;
                if (Math.sqrt(dx * dx + dy * dy) < waystarSmallBoss.size + b.size) {
                    waystarBossHp -= b.damage; waystarBossFlash = 6;
                    spawnWaystarParticles(b.x, b.y, 8, "#ff00ff", 4); addWaystarFlash(b.x, b.y, 18);
                    addWaystarShockwave(b.x, b.y, "#ff00ff", 40, 10, 2);
                    if (Math.random() < 0.4) addWaystarLightning(b.x, b.y, b.x+(Math.random()-0.5)*60, b.y+(Math.random()-0.5)*60, "#ff00ff", 0.7, 2);
                    if (Math.random() < 0.3) addWaystarSlash(b.x, b.y, Math.random()*Math.PI*2, 30, 3);
                    wsPlaySound(1400, 'square', 0.08, 0.08);
                    waystarPlayerBullets.splice(i, 1);
                    if (waystarBossHp <= 0) { waystarVictory(); return; }
                    continue;
                }
                if (b.y < -20 || b.life <= 0) waystarPlayerBullets.splice(i, 1);
            }
            updateWaystarBoss(); updateWaystarAttacks();
            waystarEscalationTimer++;
            // ★ Эскалация медленнее ★
            if (waystarEscalationTimer >= 140) {
                waystarEscalationTimer = 0;
                var hpRatio = waystarBossHp / waystarBossMaxHp;
                var newLevel = Math.floor((1 - hpRatio) * 4);
                if (newLevel > waystarEscalationLevel) {
                    waystarEscalationLevel = newLevel;
                    waystarScreenFlash = 10; waystarScreenFlashColor = "#ff00ff"; waystarShake = 15;
                    var escNames = ["", "ЭСКАЛАЦИЯ I", "ЭСКАЛАЦИЯ II", "ЭСКАЛАЦИЯ III", "ФИНАЛЬНАЯ ЯРОСТЬ!"];
                    if (waystarEscalationLevel < escNames.length) spawnWaystarText(200, 120, escNames[waystarEscalationLevel], "#ff00ff", 100);
                    wsPlaySound(200 + waystarEscalationLevel * 100, 'square', 0.5, 0.3);
                    for (var ei = 0; ei < 30; ei++) spawnWaystarParticles(waystarSmallBoss.x, waystarSmallBoss.y, 1, ["#ff00ff", "#ff0000", "#ffffff"][Math.floor(Math.random()*3)], 10);
                }
            }
            // ★ Атаки сильно замедлены ★
            var escalationMult = 1 - waystarEscalationLevel * 0.04;
            if (escalationMult < 0.8) escalationMult = 0.8;
            var aRate = Math.floor((120 / waystarSpeedMult) * escalationMult);
            if (waystarRageMode) aRate = Math.floor(aRate * 0.9);
            if (aRate < 80) aRate = 80;
            waystarAttackTimer++;
            if (!waystarPhase3AttacksStarted) { waystarPhase3AttacksStarted = true; waystarAttackTimer = 0; waystarSpawnPhase3Attack(); }
            else if (waystarAttackTimer >= aRate) { waystarAttackTimer = 0; waystarSpawnPhase3Attack(); }
            waystarTypeTimer--;
            if (waystarTypeTimer <= 0) {
                waystarAttackType = Math.floor(Math.random() * 6);
                var typeBase = waystarRageMode ? 500 : 700;
                var typeEsc = typeBase - waystarEscalationLevel * 25;
                if (typeEsc < 400) typeEsc = 400;
                waystarTypeTimer = Math.floor(typeEsc + Math.random() * 200);
                var typeNames = ["ДРОБОВИК", "ЗВЕЗДА-БОМБА", "РЫВОК", "ГИГА-ЛАЗЕР", "СПИРАЛЬ", "МИНИ-ВЗРЫВЫ"];
                spawnWaystarText(200, 60, typeNames[waystarAttackType], "#ff00ff", 70);
                addWaystarShockwave(waystarSmallBoss.x, waystarSmallBoss.y, "#ff00ff", 80, 12, 3);
            }
        }
    } else {
        waystarBoss.rotation += 0.015; waystarBoss.pulse += 0.06;
        if (waystarBoss2.active === true) { waystarBoss2.rotation -= 0.015; waystarBoss2.pulse += 0.08; }
        else if (waystarBoss2.active === "leaving") { waystarBoss2.y -= 4; waystarBoss2.alpha -= 0.02; if (waystarBoss2.alpha <= 0) waystarBoss2.active = false; }
        if (waystarState === "returning_anim") { waystarSmallBoss.alpha = Math.min(1, waystarSmallBoss.alpha + 0.015); waystarSmallBoss.rotation += 0.025; waystarSmallBoss.pulse += 0.08; waystarSmallBoss.time += 0.03; }
        var current = waystarDialogQueue[waystarDialogStep];
        if (current && current.choice && !waystarChoiceResolved) waystarChoiceActive = true;
        if (!waystarChoiceActive) { waystarDialogAutoTimer++; if (current && waystarDialogAutoTimer > current.time * 60) waystarProgressDialog(); }
    }
    if (waystarShake > 0.1) waystarShake *= 0.85;
    if (waystarScreenFlash > 0) waystarScreenFlash--;
    if (waystarBossFlash > 0) waystarBossFlash--;
    updateWaystarMegaEffects();
    for (var i = waystarParticles.length - 1; i >= 0; i--) { var p = waystarParticles[i]; if (p.isSplitPiece && p.targetX !== undefined) { p.vx += (p.targetX - p.x) * 0.008; p.vy += (p.targetY - p.y) * 0.008; } p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life--; if (p.life <= 0) waystarParticles.splice(i, 1); }
    for (var i = waystarTexts.length - 1; i >= 0; i--) { var t = waystarTexts[i]; t.y += t.vy; t.life--; if (t.life <= 0) waystarTexts.splice(i, 1); }
    ctx.save();
    if (waystarShake > 0.5) ctx.translate((Math.random() - 0.5) * waystarShake, (Math.random() - 0.5) * waystarShake);
    if (waystarScreenDistort > 0.5) { ctx.translate((Math.random() - 0.5) * waystarScreenDistort, (Math.random() - 0.5) * waystarScreenDistort); ctx.scale(1 + waystarScreenDistort / 500, 1 + waystarScreenDistort / 500); }
    var bg = ctx.createLinearGradient(0, 0, 0, 500);
    if (waystarState === "phase3" && waystarRageMode) { bg.addColorStop(0, "#1a0000"); bg.addColorStop(0.5, "#200015"); bg.addColorStop(1, "#000000"); }
    else if (waystarState === "phase3") { bg.addColorStop(0, "#150015"); bg.addColorStop(0.5, "#200030"); bg.addColorStop(1, "#000000"); }
    else { bg.addColorStop(0, "#050015"); bg.addColorStop(0.5, "#0a0020"); bg.addColorStop(1, "#000000"); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 400, 500);
    for(var i=0; i<waystarNebulas.length; i++) { var neb = waystarNebulas[i]; ctx.save(); ctx.translate(neb.x, neb.y); ctx.rotate(neb.angle); var ng = ctx.createRadialGradient(0,0,0,0,0,neb.radius); ng.addColorStop(0, neb.color); ng.addColorStop(1, "transparent"); ctx.fillStyle = ng; ctx.globalAlpha = waystarState === "phase3" ? (waystarRageMode ? 0.45 : 0.3) : 0.2; ctx.beginPath(); ctx.arc(0,0,neb.radius,0,Math.PI*2); ctx.fill(); ctx.restore(); }
    ctx.globalAlpha = 1;
    for (var i = 0; i < waystarBgStars.length; i++) { var s = waystarBgStars[i]; s.twinkle += 0.1; ctx.globalAlpha = s.alpha * (0.5 + Math.sin(s.twinkle) * 0.5); ctx.fillStyle = waystarState === "phase3" ? (waystarRageMode ? "#ffaaaa" : "#ffaaff") : "#ffffff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (waystarState === "phase3") {
        for (var i = 0; i < waystarPhase3Embers.length; i++) { var e = waystarPhase3Embers[i]; ctx.save(); ctx.globalAlpha = Math.max(0, e.life / 100); ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        for (var i = 0; i < waystarPhase3Rings.length; i++) { var r = waystarPhase3Rings[i]; ctx.save(); ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.5; ctx.translate(r.x, r.y); ctx.rotate(r.angle); ctx.strokeStyle = r.color; ctx.lineWidth = 2; ctx.shadowColor = r.color; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, 0, r.radius, 0, Math.PI * 1.7); ctx.stroke(); ctx.restore(); }
    }
    if (waystarScreenFlash > 0) { ctx.globalAlpha = waystarScreenFlash / 40; ctx.fillStyle = waystarScreenFlashColor; ctx.fillRect(0, 0, 400, 500); ctx.globalAlpha = 1; }
    if (waystarVignette > 0) { var vg = ctx.createRadialGradient(200, 250, 100, 200, 250, 400); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(255,0,0," + (waystarVignette / 30) + ")"); ctx.fillStyle = vg; ctx.fillRect(0, 0, 400, 500); }
    ctx.strokeStyle = waystarState === "phase3" ? (waystarRageMode ? "#ff0000" : "#ff00ff") : "#ffd700"; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 396, 496);
    for (var i = 0; i < waystarShockwaves.length; i++) { var sw = waystarShockwaves[i]; var progress = 1 - sw.life / sw.maxLife; ctx.save(); ctx.globalAlpha = (1 - progress) * 0.8; ctx.strokeStyle = sw.color; ctx.lineWidth = sw.width * (1 - progress); ctx.beginPath(); ctx.arc(sw.x, sw.y, Math.max(0.1, sw.radius), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    for (var i = 0; i < waystarLightningBolts.length; i++) { var lb = waystarLightningBolts[i]; ctx.save(); ctx.globalAlpha = (lb.life / lb.maxLife) * 0.9; ctx.strokeStyle = lb.color; ctx.lineWidth = lb.width; ctx.beginPath(); ctx.moveTo(lb.x1, lb.y1); for (var p = 0; p < lb.pts.length; p++) ctx.lineTo(lb.pts[p].x, lb.pts[p].y); ctx.lineTo(lb.x2, lb.y2); ctx.stroke(); ctx.restore(); }
    for (var i = 0; i < waystarSlashMarks.length; i++) { var sm = waystarSlashMarks[i]; ctx.save(); ctx.globalAlpha = sm.life / sm.maxLife; ctx.translate(sm.x, sm.y); ctx.rotate(sm.angle); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = sm.width * (sm.life / sm.maxLife); ctx.beginPath(); ctx.moveTo(-sm.length / 2, 0); ctx.lineTo(sm.length / 2, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -sm.length / 2); ctx.lineTo(0, sm.length / 2); ctx.stroke(); ctx.restore(); }
    for (var i = 0; i < waystarFlashBursts.length; i++) { var fb = waystarFlashBursts[i]; ctx.save(); ctx.globalAlpha = (fb.life / fb.maxLife) * 0.5; var r = fb.size * (1 - fb.life / fb.maxLife + 0.5); var g = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, r); g.addColorStop(0, "#ffffff"); g.addColorStop(0.4, "rgba(255,215,0,0.4)"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fb.x, fb.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    if (waystarState === "phase1" || waystarDialogActive || waystarState === "split1_anim" || waystarState === "split2_anim" || waystarState === "pre_split2_dialog" || waystarState === "pre_phase2_dialog" || waystarState === "pre_phase3_dialog") { if (waystarBoss.alpha > 0) drawWaystarBoss(); if (waystarBoss2.active) drawWaystarBoss2(); if (waystarState === "phase1") { drawWaystarPhase1Attacks(); drawWaystarPlayerBullets(); } }
    else if (waystarState === "phase2") { drawWaystarPieces(); drawWaystarEnemyBullets(); drawWaystarPlayerBullets(); }
    else if (waystarState === "returning_anim" || waystarState === "phase3") { if (waystarSmallBoss.alpha > 0) drawWaystarSmallBoss(); if (waystarState === "phase3") { drawWaystarPhase1Attacks(); drawWaystarPlayerBullets(); drawWaystarBombs(); drawWaystarDash(); } }
    // ★ Рисуем змейки в фазе 1 ★
    if (waystarState === "phase1") { drawWaystarSnakes(); }
    if (waystarState === "phase1" || waystarState === "phase2" || waystarState === "phase3") drawWaystarPlayer();
    for (var i = 0; i < waystarParticles.length; i++) { var p = waystarParticles[i]; ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.8; ctx.fillStyle = p.color; if (p.isSplitPiece) { ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); } }
    ctx.globalAlpha = 1;
    for (var i = 0; i < waystarTexts.length; i++) { var t = waystarTexts[i]; ctx.globalAlpha = Math.min(1, t.life / 30); ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y); }
    ctx.globalAlpha = 1;
    if (!waystarDialogActive) drawWaystarHpBars();
    if (waystarDialogActive) drawWaystarDialog();
    if (!waystarDialogActive) { ctx.save(); ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillStyle = waystarState === "phase3" ? "rgba(255,100,255,0.9)" : "rgba(255,215,0,0.7)"; var hintText = ""; if (waystarState === "phase1" || waystarState === "phase3") hintText = "⌨️ WASD — двигаться | 🔫 Авто-стрельба"; else if (waystarState === "phase2") hintText = "← → двигаться | 🔫 Авто-стрельба"; if (hintText) ctx.fillText(hintText, 200, 495); ctx.restore(); }
    if (waystarRageMode && waystarState === "phase3") { ctx.save(); ctx.font = "bold 16px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ff0000"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 15; var rageGlow = 0.5 + Math.abs(Math.sin(performance.now() / 150)) * 0.5; ctx.globalAlpha = rageGlow; ctx.fillText("🔥 RAGE MODE 🔥", 200, 470); ctx.restore(); }
    if (waystarState === "phase3" && waystarEscalationLevel > 0) { ctx.save(); ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; var escColors = ["#ff00ff", "#ff00ff", "#ff4400", "#ff4400", "#ff0000"]; var escName = waystarEscalationLevel >= 4 ? "💀 ФИНАЛЬНАЯ ЯРОСТЬ 💀" : "⚠ ЭСКАЛАЦИЯ " + "I".repeat(waystarEscalationLevel); ctx.fillStyle = escColors[Math.min(waystarEscalationLevel, 4)]; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12; ctx.globalAlpha = 0.7 + Math.abs(Math.sin(performance.now() / 250)) * 0.3; ctx.fillText(escName, 200, 455); ctx.restore(); }
    if (isWaystarModerActive()) { ctx.save(); ctx.font = "bold 11px monospace"; ctx.textAlign = "right"; ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 8; ctx.globalAlpha = 0.8; ctx.fillText("👑 MODER", 395, 20); ctx.restore(); }
    ctx.restore();
    waystarAnimFrame = requestAnimationFrame(waystarRenderLoop);
}

function renderWaystarFinalScene() {
    try {
        ctx.save();
        if (waystarShake > 0.5) ctx.translate((Math.random() - 0.5) * waystarShake, (Math.random() - 0.5) * waystarShake);
        var bg = ctx.createLinearGradient(0, 0, 0, 500);
        if (waystarFinalPhase === "spare_dialog" || waystarFinalPhase === "spare_blessing" || waystarFinalPhase === "spare_farewell") { bg.addColorStop(0, "#15100a"); bg.addColorStop(0.5, "#1a1530"); bg.addColorStop(1, "#000000"); }
        else { bg.addColorStop(0, "#0a0015"); bg.addColorStop(0.5, "#1a0025"); bg.addColorStop(1, "#000000"); }
        ctx.fillStyle = bg; ctx.fillRect(0, 0, 400, 500);
        for (var i = 0; i < waystarBgStars.length; i++) { var s = waystarBgStars[i]; s.twinkle += 0.1; ctx.globalAlpha = s.alpha * (0.5 + Math.sin(s.twinkle) * 0.5); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
        for (var i = 0; i < waystarParticles.length; i++) { var p = waystarParticles[i]; ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.8; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
        for (var i = 0; i < waystarLightningBolts.length; i++) { var lb = waystarLightningBolts[i]; ctx.save(); ctx.globalAlpha = (lb.life / lb.maxLife) * 0.9; ctx.strokeStyle = lb.color; ctx.lineWidth = lb.width; ctx.beginPath(); ctx.moveTo(lb.x1, lb.y1); for (var p = 0; p < lb.pts.length; p++) ctx.lineTo(lb.pts[p].x, lb.pts[p].y); ctx.lineTo(lb.x2, lb.y2); ctx.stroke(); ctx.restore(); }
        for (var i = 0; i < waystarShockwaves.length; i++) { var sw = waystarShockwaves[i]; var progress = 1 - sw.life / sw.maxLife; ctx.save(); ctx.globalAlpha = (1 - progress) * 0.8; ctx.strokeStyle = sw.color; ctx.lineWidth = sw.width * (1 - progress); ctx.beginPath(); ctx.arc(sw.x, sw.y, Math.max(0.1, sw.radius), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        for (var i = 0; i < waystarFlashBursts.length; i++) { var fb = waystarFlashBursts[i]; ctx.save(); ctx.globalAlpha = (fb.life / fb.maxLife) * 0.6; var r = fb.size * (1 - fb.life / fb.maxLife + 0.5); var g = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, r); g.addColorStop(0, "#ffffff"); g.addColorStop(0.4, "rgba(255,215,0,0.4)"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fb.x, fb.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        if (waystarSmallBoss.alpha > 0) { drawWaystarSmallBoss(); }
        if (waystarFinalPhase !== "blackout" && waystarFinalPhase !== "wakeup" && waystarFinalPhase !== "done" && waystarFinalPhase !== "spare_dialog" && waystarFinalPhase !== "spare_blessing" && waystarFinalPhase !== "spare_farewell") { drawWaystarPlayer(); }
        if (waystarFinalPhase === "choice") { drawWaystarFinalChoice(); }
        if (waystarFinalPhase === "spare_dialog") { drawWaystarSpareDialog(); }
        if (waystarFinalPhase === "spare_blessing" && waystarFinalTimer > 40) { ctx.save(); ctx.font = "italic bold 14px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#88ddff"; ctx.shadowColor = "#88ddff"; ctx.shadowBlur = 12; ctx.globalAlpha = 0.85 + Math.abs(Math.sin(waystarFinalTimer / 20)) * 0.15; ctx.fillText("«Иди, герой. Путь открыт...»", 200, 400); ctx.restore(); }
        if (waystarFinalPhase === "spare_farewell" && waystarFinalTimer > 40) { ctx.save(); ctx.font = "italic bold 14px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 12; var fadeAlpha = Math.min(1, (waystarFinalTimer - 40) / 50); ctx.globalAlpha = fadeAlpha * 0.9; ctx.fillText("«Прощай...»", 200, 400); ctx.restore(); }
        if (waystarBlackoutAlpha > 0) { ctx.save(); ctx.globalAlpha = waystarBlackoutAlpha; ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, 400, 500); ctx.restore(); }
        if (waystarWakeText && waystarWakeAlpha > 0) { ctx.save(); ctx.globalAlpha = waystarWakeAlpha; ctx.font = "bold 17px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#aaaaaa"; ctx.shadowBlur = 10; var lines = waystarWakeText.split("\n"); for (var i = 0; i < lines.length; i++) { ctx.fillText(lines[i], 200, 180 + i * 26); } ctx.restore(); }
        if (waystarVignette > 0) { var vg = ctx.createRadialGradient(200, 250, 100, 200, 250, 400); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(255,0,0," + (waystarVignette / 30) + ")"); ctx.fillStyle = vg; ctx.fillRect(0, 0, 400, 500); }
        if (waystarScreenFlash > 0) { ctx.globalAlpha = waystarScreenFlash / 40; ctx.fillStyle = waystarScreenFlashColor; ctx.fillRect(0, 0, 400, 500); ctx.globalAlpha = 1; }
        ctx.restore();
    } catch(e) { console.error("[WAYSTAR] ОШИБКА в renderWaystarFinalScene:", e); }
}

function drawWaystarSpareDialog() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, 400, 500);
    ctx.save();
    ctx.translate(200, 90);
    var t = performance.now() / 1000;
    var pulse = 1 + Math.sin(t * 3) * 0.12;
    ctx.scale(pulse, pulse);
    var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 125);
    glow.addColorStop(0, "rgba(255, 215, 0, 0.9)");
    glow.addColorStop(0.5, "rgba(255, 200, 100, 0.5)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 125, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd700";
    ctx.beginPath(); for (var i = 0; i < 16; i++) { var ang = (i / 16) * Math.PI * 2 - Math.PI / 2, r = (i % 2 === 0) ? 42 : 18; if (i === 0) ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r); else ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    var currentLine = waystarSpareDialog[waystarSpareDialogStep];
    if (currentLine) {
        ctx.font = "bold 15px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd700"; ctx.fillText(currentLine.speaker, 200, 175);
        ctx.font = "bold 15px Nunito, sans-serif"; ctx.fillStyle = "#ffffff";
        var lines = wrapText(currentLine.text, 360, ctx);
        for (var i = 0; i < lines.length; i++) { ctx.fillText(lines[i], 200, 205 + i * 24); }
        ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.5;
        ctx.font = "12px monospace"; ctx.fillStyle = "#aaaaaa";
        ctx.fillText(">> Кликните для продолжения (" + (waystarSpareDialogStep + 1) + "/" + waystarSpareDialog.length + ") <<", 200, 480);
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}

function drawWaystarFinalChoice() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(0, 0, 400, 500);
    ctx.font = "bold 22px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 15;
    ctx.fillText("ВЫБОР ЗА ТОБОЙ", 200, 130);
    ctx.font = "bold 14px monospace"; ctx.fillStyle = "#ffd700"; ctx.shadowBlur = 8;
    ctx.fillText("Звезда побеждена. Что ты сделаешь?", 200, 165);
    ctx.restore();
    drawFinalButton(50, 235, 300, 70, "#8B0000", "#ff2222", "💀 УБИТЬ", "Забрать силу звезды");
    drawFinalButton(50, 325, 300, 70, "#0a5a2a", "#2ecc71", "🕊️ ПОЩАДИТЬ", "Проявить милосердие");
}

function drawFinalButton(x, y, w, h, bgColor, borderColor, title, subtitle) {
    ctx.save();
    var pulse = 0.7 + Math.abs(Math.sin(performance.now() / 400)) * 0.3;
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, bgColor); grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad; ctx.strokeStyle = borderColor; ctx.lineWidth = 3;
    ctx.shadowColor = borderColor; ctx.shadowBlur = 20 * pulse;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 15); else ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 10; ctx.font = "bold 22px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
    ctx.fillText(title, x + w / 2, y + 32);
    ctx.font = "12px monospace"; ctx.fillStyle = "#cccccc"; ctx.shadowBlur = 0;
    ctx.fillText(subtitle, x + w / 2, y + 55);
    ctx.restore();
}

function spawnWaystarText(x, y, text, color, life) { waystarTexts.push({ x: x, y: y, text: text, color: color, life: life || 60, vy: -0.5 }); }

function drawWaystarBoss() { var b = waystarBoss; var pulse = 1 + Math.sin(b.pulse) * 0.12; var size = b.size * pulse; ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha = b.alpha; var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 4.7); if (waystarBossFlash > 0) { glow.addColorStop(0, "rgba(255, 255, 255, 0.95)"); glow.addColorStop(0.5, "rgba(255, 200, 100, 0.6)"); glow.addColorStop(1, "transparent"); } else { glow.addColorStop(0, "rgba(255, 215, 0, 0.8)"); glow.addColorStop(0.5, "rgba(255, 150, 0, 0.4)"); glow.addColorStop(1, "transparent"); } ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, size * 4.7, 0, Math.PI * 2); ctx.fill(); ctx.rotate(b.time); ctx.strokeStyle = "rgba(255,215,0,0.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); for (var i = 0; i < 6; i++) { var a = (i / 6) * Math.PI * 2; ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*size*1.6, Math.sin(a)*size*1.6); } ctx.stroke(); ctx.rotate(-b.time * 2 + b.rotation); ctx.fillStyle = waystarBossFlash > 0 ? "#ffffff" : "#ffd700"; ctx.shadowColor = "#ffaa00"; ctx.shadowBlur = 15; ctx.beginPath(); for (var i = 0; i < 16; i++) { var ang = (i / 16) * Math.PI * 2 - Math.PI / 2; var r = (i % 2 === 0) ? size : size * 0.4; var px = Math.cos(ang) * r, py = Math.sin(ang) * r; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
function drawWaystarBoss2() { var b = waystarBoss2; var pulse = 1 + Math.sin(b.pulse) * 0.12; var size = b.size * pulse; ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha = b.alpha; var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 3.75); glow.addColorStop(0, "rgba(255, 0, 255, 0.7)"); glow.addColorStop(0.5, "rgba(200, 0, 200, 0.35)"); glow.addColorStop(1, "transparent"); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, size * 3.75, 0, Math.PI * 2); ctx.fill(); ctx.rotate(b.rotation); ctx.fillStyle = "#ff00ff"; ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 15; ctx.beginPath(); for (var i = 0; i < 16; i++) { var ang = (i / 16) * Math.PI * 2 - Math.PI / 2; var r = (i % 2 === 0) ? size : size * 0.4; if (i === 0) ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r); else ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r); } ctx.closePath(); ctx.fill(); ctx.restore(); }

function drawWaystarSmallBoss() {
    var b = waystarSmallBoss; if (b.alpha <= 0) return; var pulse = 1 + Math.sin(b.pulse) * (waystarRageMode ? 0.32 : 0.2); var size = b.size * pulse;
    ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha = b.alpha;
    for (var i = 0; i < b.trail.length; i++) { var tr = b.trail[i]; var alpha = (tr.life / tr.maxLife) * 0.5; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = waystarRageMode ? "#ff0000" : "#ff00ff"; ctx.beginPath(); ctx.arc(tr.x - b.x, tr.y - b.y, size * (tr.life / tr.maxLife) * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    var isSpare = (waystarFinalActive && (waystarFinalPhase === "spare_dialog" || waystarFinalPhase === "spare_blessing" || waystarFinalPhase === "spare_farewell"));
    var auraColor = isSpare ? "#ffd700" : (waystarRageMode ? "#ff0000" : "#ff00ff");
    var auraSize = size * (isSpare ? 6.5 : (waystarRageMode ? 5.5 : 4.7)) + waystarEscalationLevel * 5;
    var glow = ctx.createRadialGradient(0, 0, 3, 0, 0, auraSize);
    if (isSpare) { glow.addColorStop(0, "rgba(255, 215, 0, 0.95)"); glow.addColorStop(0.3, "rgba(255, 200, 100, 0.7)"); glow.addColorStop(0.6, "rgba(255, 180, 50, 0.4)"); glow.addColorStop(1, "transparent"); }
    else if (waystarRageMode) { glow.addColorStop(0, "rgba(255, 0, 0, 0.95)"); glow.addColorStop(0.3, "rgba(255, 100, 100, 0.6)"); glow.addColorStop(0.6, "rgba(255, 0, 0, 0.3)"); glow.addColorStop(1, "transparent"); }
    else { glow.addColorStop(0, "rgba(255, 0, 255, 0.95)"); glow.addColorStop(0.3, "rgba(255, 100, 255, 0.6)"); glow.addColorStop(0.6, "rgba(255, 0, 255, 0.3)"); glow.addColorStop(1, "transparent"); }
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, auraSize, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.rotate(-b.time * 0.5); ctx.strokeStyle = isSpare ? "rgba(255, 215, 0, 0.8)" : (waystarRageMode ? "rgba(255, 100, 100, 0.7)" : "rgba(255, 100, 255, 0.6)"); ctx.lineWidth = 2;
    var rayCount = isSpare ? 16 : (waystarRageMode ? 12 : 8); rayCount += waystarEscalationLevel;
    ctx.beginPath(); for (var i = 0; i < rayCount; i++) { var a = (i / rayCount) * Math.PI * 2; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*size*2.4, Math.sin(a)*size*2.4); } ctx.stroke(); ctx.restore();
    ctx.rotate(b.time); ctx.fillStyle = isSpare ? "#ffd700" : (waystarRageMode ? "#ff0000" : "#ff00ff"); ctx.shadowColor = auraColor; ctx.shadowBlur = isSpare ? 45 : (waystarRageMode ? 35 : 25);
    ctx.beginPath(); for (var i = 0; i < 16; i++) { var ang = (i / 16) * Math.PI * 2 - Math.PI / 2; var r = (i % 2 === 0) ? size : size * 0.4; if (i === 0) ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r); else ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawWaystarPlayer() { if (waystarInvulnTimer > 0 && Math.floor(waystarInvulnTimer / 3) % 2 === 0) return; ctx.save(); ctx.translate(waystarPlayer.x, waystarPlayer.y); var glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 22); glow.addColorStop(0, "rgba(255,100,100,0.5)"); glow.addColorStop(1, "transparent"); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "rgba(255, 100, 0, 0.4)"; ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(4, 8); ctx.lineTo(0, 15 + Math.random()*8); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#ff1111"; var hs = 12; ctx.beginPath(); ctx.moveTo(0, hs * 0.7); ctx.bezierCurveTo(-hs * 1.4, -hs * 0.2, -hs * 0.7, -hs * 1.1, 0, -hs * 0.4); ctx.bezierCurveTo(hs * 0.7, -hs * 1.1, hs * 1.4, -hs * 0.2, 0, hs * 0.7); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }

function drawWaystarPlayerBullets() { for (var i = 0; i < waystarPlayerBullets.length; i++) { var b = waystarPlayerBullets[i]; if (b.trail) { for (var j = 0; j < b.trail.length; j++) { var tr = b.trail[j], alpha = (1 - j / b.trail.length) * 0.5; ctx.globalAlpha = alpha; ctx.fillStyle = "#00d4ff"; ctx.beginPath(); ctx.arc(tr.x, tr.y, b.size * (1 - j / b.trail.length) * 0.7, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; } var glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 1.8); glow.addColorStop(0, "#ffffff"); glow.addColorStop(0.5, "#00d4ff"); glow.addColorStop(1, "transparent"); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 1.8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.6, 0, Math.PI * 2); ctx.fill(); } }

function drawWaystarEnemyBullets() { for (var i = 0; i < waystarEnemyBullets.length; i++) { var b = waystarEnemyBullets[i]; if (b.trail) { for (var j = 0; j < b.trail.length; j++) { var tr = b.trail[j], alpha = (1 - j / b.trail.length) * 0.6; ctx.globalAlpha = alpha; ctx.fillStyle = "#ff6600"; ctx.beginPath(); ctx.arc(tr.x, tr.y, b.size * (1 - j / b.trail.length) * 0.8, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; } var bigGlow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 4); bigGlow.addColorStop(0, "rgba(255, 100, 100, 0.8)"); bigGlow.addColorStop(0.5, "rgba(255, 50, 50, 0.5)"); bigGlow.addColorStop(1, "rgba(255, 0, 0, 0)"); ctx.fillStyle = bigGlow; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 1.4, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "#ff2222"; ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2); ctx.fill(); } }

function drawWaystarPhase1Attacks() {
    for (var i = 0; i < waystarAttacks.length; i++) {
        var a = waystarAttacks[i];
        if (a.type === "meteor" || a.type === "spiral" || a.type === "star_rain" || a.type === "shotgun_bullet") {
            for (var j = 0; j < a.trail.length; j++) { var tr = a.trail[j], alpha = (1 - j / a.trail.length) * 0.5; ctx.globalAlpha = alpha; ctx.fillStyle = a.type === "meteor" ? "#ff8800" : (a.type === "spiral" ? "#ff00ff" : (a.type === "shotgun_bullet" ? "#ff4400" : "#ffd700")); ctx.beginPath(); ctx.arc(tr.x, tr.y, a.size * (1 - j / a.trail.length) * 0.7, 0, Math.PI * 2); ctx.fill(); }
            ctx.globalAlpha = 1; ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rotation||0);
            ctx.fillStyle = a.type === "meteor" ? "#ffd700" : (a.type === "spiral" ? "#ff00ff" : (a.type === "shotgun_bullet" ? "#ff4400" : "#ffd700"));
            ctx.beginPath(); ctx.arc(0, 0, a.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, a.size * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (a.type === "laser") {
            ctx.save();
            if (a.state === "warning") { var pulseAlpha = 0.3 + Math.sin(performance.now() / 80) * 0.2; var chargeR = 12 + Math.abs(Math.sin(performance.now() / 100)) * 12; var chargeGlow = ctx.createRadialGradient(a.x, 490, 0, a.x, 490, chargeR * 2); chargeGlow.addColorStop(0, "rgba(255, 255, 255, 0.9)"); chargeGlow.addColorStop(0.4, "rgba(255, 100, 100, 0.6)"); chargeGlow.addColorStop(1, "transparent"); ctx.fillStyle = chargeGlow; ctx.beginPath(); ctx.arc(a.x, 490, chargeR * 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = pulseAlpha; ctx.fillStyle = "#ff3333"; ctx.fillRect(a.x - a.width / 2, 0, a.width, 500); ctx.globalAlpha = 0.9; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(a.x - a.width / 2, 0); ctx.lineTo(a.x - a.width / 2, 500); ctx.moveTo(a.x + a.width / 2, 0); ctx.lineTo(a.x + a.width / 2, 500); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
            else if (a.state === "active") { var fadeIn = Math.min(1, (a.maxActive - a.activeTimer) / 5 + 0.3); var fadeOut = Math.min(1, a.activeTimer / 12); var activeAlpha = Math.min(fadeIn, fadeOut); ctx.globalAlpha = activeAlpha; var outerGlow = ctx.createLinearGradient(a.x - a.width * 1.5, 0, a.x + a.width * 1.5, 0); outerGlow.addColorStop(0, "rgba(255, 50, 50, 0)"); outerGlow.addColorStop(0.3, "rgba(255, 100, 50, 0.5)"); outerGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.9)"); outerGlow.addColorStop(0.7, "rgba(255, 100, 50, 0.5)"); outerGlow.addColorStop(1, "rgba(255, 50, 50, 0)"); ctx.fillStyle = outerGlow; ctx.fillRect(a.x - a.width * 1.5, 0, a.width * 3, 500); ctx.fillStyle = "#ff3333"; ctx.globalAlpha = activeAlpha * 0.95; ctx.fillRect(a.x - a.width / 2, 0, a.width, 500); var coreWidth = a.width * (0.35 + Math.sin(performance.now() / 50) * 0.06); ctx.fillStyle = "#ffffff"; ctx.globalAlpha = activeAlpha; ctx.fillRect(a.x - coreWidth / 2, 0, coreWidth, 500); ctx.fillStyle = "#00d4ff"; ctx.globalAlpha = activeAlpha * 0.6; ctx.fillRect(a.x - a.width / 2 + 4, 0, 6, 500); ctx.fillRect(a.x + a.width / 2 - 10, 0, 6, 500); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.globalAlpha = activeAlpha; ctx.beginPath(); ctx.moveTo(a.x - a.width / 2, 0); ctx.lineTo(a.x - a.width / 2, 500); ctx.moveTo(a.x + a.width / 2, 0); ctx.lineTo(a.x + a.width / 2, 500); ctx.stroke(); }
            ctx.restore();
        } else if (a.type === "giant_laser") {
            ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle);
            if (a.state === "warning") { var pulseAlpha2 = 0.4 + Math.sin(performance.now() / 80) * 0.2; var chargeR2 = 15 + Math.abs(Math.sin(performance.now() / 90)) * 20; var chargeGlow2 = ctx.createRadialGradient(0, 0, 0, 0, 0, chargeR2 * 2.5); chargeGlow2.addColorStop(0, "rgba(255, 255, 255, 0.95)"); chargeGlow2.addColorStop(0.4, "rgba(255, 100, 255, 0.7)"); chargeGlow2.addColorStop(1, "transparent"); ctx.fillStyle = chargeGlow2; ctx.beginPath(); ctx.arc(0, 0, chargeR2 * 2.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = pulseAlpha2; ctx.fillStyle = "#ff00ff"; ctx.fillRect(0, -a.width / 2, 800, a.width); ctx.globalAlpha = 0.95; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(0, -a.width / 2); ctx.lineTo(800, -a.width / 2); ctx.moveTo(0, a.width / 2); ctx.lineTo(800, a.width / 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.font = "bold 22px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.fillText("⚠", 200, 8); }
            else if (a.state === "active") { var fadeIn2 = Math.min(1, (a.maxActive - a.activeTimer) / 5 + 0.3); var fadeOut2 = Math.min(1, a.activeTimer / 12); var activeAlpha2 = Math.min(fadeIn2, fadeOut2); ctx.globalAlpha = activeAlpha2; var outerGlow2 = ctx.createLinearGradient(0, -a.width * 1.5, 0, a.width * 1.5); outerGlow2.addColorStop(0, "rgba(255, 0, 255, 0)"); outerGlow2.addColorStop(0.3, "rgba(255, 100, 255, 0.5)"); outerGlow2.addColorStop(0.5, "rgba(255, 255, 255, 0.95)"); outerGlow2.addColorStop(0.7, "rgba(255, 100, 255, 0.5)"); outerGlow2.addColorStop(1, "rgba(255, 0, 255, 0)"); ctx.fillStyle = outerGlow2; ctx.fillRect(0, -a.width * 1.5, 800, a.width * 3); ctx.fillStyle = "#ff00ff"; ctx.globalAlpha = activeAlpha2 * 0.95; ctx.fillRect(0, -a.width / 2, 800, a.width); var coreWidth2 = a.width * (0.35 + Math.sin(performance.now() / 50) * 0.08); ctx.fillStyle = "#ffffff"; ctx.globalAlpha = activeAlpha2; ctx.fillRect(0, -coreWidth2 / 2, 800, coreWidth2); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.globalAlpha = activeAlpha2; ctx.beginPath(); ctx.moveTo(0, -a.width / 2); ctx.lineTo(800, -a.width / 2); ctx.moveTo(0, a.width / 2); ctx.lineTo(800, a.width / 2); ctx.stroke(); if (a.activeTimer % 6 === 0) { var dist3 = Math.random() * 400; addWaystarSlash(a.x + Math.cos(a.angle) * dist3, a.y + Math.sin(a.angle) * dist3, a.angle + Math.PI/2, 60, 4); } }
            ctx.restore();
        }
    }
}

function drawWaystarBombs() {
    for (var i = 0; i < waystarBombs.length; i++) {
        var b = waystarBombs[i]; ctx.save();
        if (!b.exploded) {
            var baseSize = b.small ? 25 : 45; var size = baseSize * (b.sunScale || 1.0); var sunColor = b.sunColor || "#ffdd00";
            var auraSize = size * 3.5;
            var auraGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, auraSize);
            if (b.sunPhase === "big") { auraGrad.addColorStop(0, "rgba(255, 255, 200, 0.9)"); auraGrad.addColorStop(0.3, "rgba(255, 200, 50, 0.6)"); auraGrad.addColorStop(0.6, "rgba(255, 100, 0, 0.3)"); auraGrad.addColorStop(1, "transparent"); }
            else if (b.sunPhase === "shrink") { auraGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)"); auraGrad.addColorStop(0.3, "rgba(255, 220, 100, 0.6)"); auraGrad.addColorStop(0.6, "rgba(255, 150, 50, 0.3)"); auraGrad.addColorStop(1, "transparent"); }
            else if (b.sunPhase === "blue") { auraGrad.addColorStop(0, "rgba(200, 240, 255, 0.9)"); auraGrad.addColorStop(0.3, "rgba(50, 150, 255, 0.6)"); auraGrad.addColorStop(0.6, "rgba(0, 80, 200, 0.3)"); auraGrad.addColorStop(1, "transparent"); }
            else { auraGrad.addColorStop(0, "rgba(255, 255, 255, 1)"); auraGrad.addColorStop(0.3, "rgba(200, 240, 255, 0.8)"); auraGrad.addColorStop(0.6, "rgba(0, 150, 255, 0.5)"); auraGrad.addColorStop(1, "transparent"); }
            ctx.fillStyle = auraGrad; ctx.beginPath(); ctx.arc(b.x, b.y, auraSize, 0, Math.PI * 2); ctx.fill();
            var coreGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, size);
            coreGrad.addColorStop(0, "#ffffff"); coreGrad.addColorStop(0.4, sunColor); coreGrad.addColorStop(0.85, sunColor); coreGrad.addColorStop(1, "rgba(255, 255, 255, 0.2)");
            ctx.fillStyle = coreGrad; ctx.shadowColor = sunColor; ctx.shadowBlur = b.sunPhase === "flash" ? 30 : 18;
            ctx.beginPath(); ctx.arc(b.x, b.y, size, 0, Math.PI * 2); ctx.fill();
            if (b.sunPhase === "big" || b.sunPhase === "shrink") { ctx.strokeStyle = sunColor; ctx.lineWidth = 2; ctx.shadowBlur = 12; var rayCount = b.sunPhase === "big" ? 6 : 4; for (var r = 0; r < rayCount; r++) { var ang = (r / rayCount) * Math.PI * 2 + performance.now() / 700; var innerR = size * 1.1; var outerR = size * (1.25 + Math.sin(performance.now() / 150 + r) * 0.08); ctx.beginPath(); ctx.moveTo(b.x + Math.cos(ang) * innerR, b.y + Math.sin(ang) * innerR); ctx.lineTo(b.x + Math.cos(ang) * outerR, b.y + Math.sin(ang) * outerR); ctx.stroke(); } }
            if (b.sunPhase === "blue") { ctx.strokeStyle = "#00aaff"; ctx.lineWidth = 2; ctx.shadowBlur = 15; for (var k = 0; k < 2; k++) { var offset = (k / 2) * Math.PI * 2 + performance.now() / 400; ctx.beginPath(); for (var step = 0; step <= 15; step++) { var t = step / 15; var spiralAng = offset + t * Math.PI * 4; var spiralR = size * 0.8 * (1 - t * 0.5); var sx = b.x + Math.cos(spiralAng) * spiralR; var sy = b.y + Math.sin(spiralAng) * spiralR; if (step === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy); } ctx.stroke(); } }
            var warnPulse = Math.max(0, 0.25 + Math.sin(b.timer / 10) * 0.25); ctx.strokeStyle = b.sunPhase === "blue" ? "#00aaff" : "#ff3333"; ctx.lineWidth = 2; ctx.globalAlpha = warnPulse; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.restore();
        } else {
            var explProgress = 1 - b.explosionTimer / 20; var explAlpha = 1 - explProgress;
            ctx.globalAlpha = explAlpha; var ringR = b.radius * explProgress * 1.3;
            var ringGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, ringR);
            ringGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)"); ringGrad.addColorStop(0.3, "rgba(100, 200, 255, 0.7)"); ringGrad.addColorStop(0.6, "rgba(0, 100, 255, 0.4)"); ringGrad.addColorStop(1, "transparent");
            ctx.fillStyle = ringGrad; ctx.beginPath(); ctx.arc(b.x, b.y, ringR, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = explAlpha * 0.9; var coreR = b.radius * explProgress * 0.5;
            var coreGrad2 = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, coreR);
            coreGrad2.addColorStop(0, "#ffffff"); coreGrad2.addColorStop(0.5, "#aaddff"); coreGrad2.addColorStop(1, "transparent");
            ctx.fillStyle = coreGrad2; ctx.beginPath(); ctx.arc(b.x, b.y, coreR, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }
}

function drawWaystarDash() { if (!waystarDash) return; ctx.save(); var d = waystarDash; for (var i = 0; i < 6; i++) { var t = i / 6; var x = d.startX + (d.targetX - d.startX) * t; var y = d.startY + (d.targetY - d.startY) * t; ctx.globalAlpha = (1 - t) * 0.35; ctx.fillStyle = "#ff00ff"; ctx.beginPath(); ctx.arc(x, y, 18 * (1 - t), 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }

function drawWaystarPieces() { for (var i = 0; i < waystarPieces.length; i++) { var p = waystarPieces[i]; if (!p.alive) continue; if (p.trail) { for (var j = 0; j < p.trail.length; j++) { var tr = p.trail[j], alpha = (1 - j / p.trail.length) * 0.4; ctx.globalAlpha = alpha; ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(tr.x, tr.y, p.size * (1 - j / p.trail.length) * 0.6, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; } ctx.save(); ctx.translate(p.x, p.y); var pulse = 1 + Math.sin(p.pulse) * 0.12; ctx.scale(pulse, pulse); ctx.fillStyle = p.hp >= 2 ? "#ffd700" : "#ff6600"; ctx.beginPath(); for (var k = 0; k < 10; k++) { var ang = (k / 10) * Math.PI * 2 - Math.PI / 2; var r = (k % 2 === 0) ? p.size : p.size * 0.4; if (k === 0) ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r); else ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); } }

function drawWaystarHpBars() {
    var barW = 360, barH = 14, x = 20, y = 6;
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(x - 4, y - 4, barW + 8, barH + 8); ctx.fillStyle = "#1a001a"; ctx.fillRect(x, y, barW, barH);
    var ratio, color, label;
    if (waystarState === "phase2") { ratio = waystarPiecesAlive / waystarPiecesTotal; color = "#ff00ff"; label = "🌟 " + waystarPiecesAlive + " / " + waystarPiecesTotal + " осколков"; }
    else if (waystarState === "phase3") { ratio = Math.max(0, waystarBossHp / waystarBossMaxHp); color = waystarRageMode ? "#ff0000" : "#ff00ff"; label = "💥 " + Math.ceil(waystarBossHp) + " / " + Math.ceil(waystarBossMaxHp); }
    else { ratio = Math.max(0, waystarBossHp / waystarBossMaxHp); color = "#ffd700"; label = "🌟 " + Math.ceil(waystarBossHp) + " / " + Math.ceil(waystarBossMaxHp); }
    ctx.fillStyle = color; ctx.fillRect(x, y, barW * ratio, barH);
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillText(label, x + barW / 2, y + barH - 3);
    ctx.restore();
    var y2 = 478; ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(x - 4, y2 - 4, barW + 8, 20); ctx.fillStyle = "#2a0000"; ctx.fillRect(x, y2, barW, 12);
    if (isWaystarModerActive()) { ctx.fillStyle = "#ffd700"; ctx.fillRect(x, y2, barW, 12); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(x, y2, barW, 12); ctx.fillStyle = "#000"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillText("∞ HP (МОДЕР)", x + barW / 2, y2 + 10); }
    else { var r2 = Math.max(0, waystarPlayerHp / waystarPlayerMaxHp); ctx.fillStyle = r2 > 0.3 ? "#00ff66" : "#ff3333"; ctx.fillRect(x, y2, barW * r2, 12); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(x, y2, barW, 12); ctx.fillStyle = "#fff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillText(Math.ceil(waystarPlayerHp) + " / " + waystarPlayerMaxHp, x + barW / 2, y2 + 10); }
    ctx.restore();
}

function drawWaystarDialog() {
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, 400, 500);
    ctx.save(); ctx.translate(200, 90); var t = performance.now() / 1000, pulse = 1 + Math.sin(t * 3) * 0.1; ctx.scale(pulse, pulse);
    var glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 125);
    glow.addColorStop(0, "rgba(255, 215, 0, 0.8)"); glow.addColorStop(0.5, "rgba(255, 170, 0, 0.4)"); glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 125, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd700"; ctx.beginPath(); for (var i = 0; i < 16; i++) { var ang = (i / 16) * Math.PI * 2 - Math.PI / 2, r = (i % 2 === 0) ? 42 : 18; if (i === 0) ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r); else ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    var current = waystarDialogQueue[waystarDialogStep];
    if (current) { ctx.font = "bold 15px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd700"; ctx.fillText(current.speaker, 200, 175); ctx.font = "bold 16px Nunito, sans-serif"; ctx.fillStyle = "#ffffff"; var lines = wrapText(current.text, 360, ctx); for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], 200, 205 + i * 24); if (!waystarChoiceActive) { ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.5; ctx.font = "12px monospace"; ctx.fillStyle = "#aaaaaa"; ctx.fillText(">> Кликните для пропуска <<", 200, 480); ctx.globalAlpha = 1; } }
    if (waystarChoiceActive && !waystarChoiceResolved) { var choices = getWaystarChoices(); var btnW = 360, btnX = 20, startY = 260, btnH = 55, gap = 12; for (var i = 0; i < choices.length; i++) { var btnY = startY + i * (btnH + gap); ctx.fillStyle = "rgba(40,20,50,0.95)"; ctx.strokeStyle = "#ffaa00"; ctx.lineWidth = 2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(btnX, btnY, btnW, btnH, 12); else ctx.rect(btnX, btnY, btnW, btnH); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffd700"; ctx.font = "bold 15px Nunito, sans-serif"; ctx.textAlign = "left"; ctx.fillText((i+1) + ".", btnX + 12, btnY + 23); ctx.fillStyle = "#ffffff"; ctx.font = "bold 13px Nunito, sans-serif"; var lines = wrapText(choices[i].text, btnW - 50, ctx); for (var li = 0; li < Math.min(lines.length, 3); li++) ctx.fillText(lines[li], btnX + 35, btnY + 21 + li * 16); } }
    ctx.restore();
}

function wrapText(text, maxWidth, ctx) {
    var words = text.split(' '), lines = [], currentLine = '';
    for (var i = 0; i < words.length; i++) { var testLine = currentLine ? currentLine + ' ' + words[i] : words[i]; if (ctx.measureText(testLine).width > maxWidth && currentLine) { lines.push(currentLine); currentLine = words[i]; } else { currentLine = testLine; } }
    if (currentLine) lines.push(currentLine);
    return lines;
}

window.startWaystarFight = startWaystarFight;
window.stopWaystarFight = stopWaystarFight;
window.damageWaystarBoss = function(dmg) { if (waystarState === "phase1") waystarBossHp -= dmg; };
window.getWaystarActive = function() { return waystarActive; };

// ★★★ ЭКСПОРТ ДЛЯ EQUIPMENT_COMBAT ★★★
window.updateWaystarShooting = updateWaystarShooting;
window.getWaystarPlayer = function() { return waystarPlayer; };
window.getWaystarBullets = function() { return waystarPlayerBullets; };
window.getWaystarKeys = function() { return waystarKeys; };
window.getWaystarTouch = function() { return { active: waystarTouchActive, x: waystarTouchX, y: waystarTouchY }; };
window.waystarSound = wsPlaySound;
window.isWaystarModerActive = isWaystarModerActive;

console.log("[WAYSTAR] v11.0 + EXPORT загружено! Медленнее в 1.5x + Змейка + лёгкие эффекты");

} // ★ КОНЕЦ ЗАЩИТЫ ★
