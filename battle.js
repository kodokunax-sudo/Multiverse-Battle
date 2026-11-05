// ========== АРЕНА UNDERTALE v18.0 ==========
// + ЭКСПОРТ arenaActive и arenaPhase в window для joystick.js
// + moveHeart читает window._joystick
// + ПОДДЕРЖКА ПАССИВКИ БЕЛОУСА (10% поглощение)
// + ПОДДЕРЖКА ТАКАБЫ (остановка времени / takabaTimeStop)

function isJoystickTrainingMode() {
    return typeof window !== "undefined" && window.__mbJoystickTrainingMode === true;
}

let arenaActive = false;
let arenaBoss = null;
let arenaHP = 70;
let arenaMaxHP = 70;
let arenaBossMaxHP = 1000;
let arenaBossOriginalMaxHP = 1000;
let arenaAttackType = 0;
let arenaClickTargets = [];
let arenaClicksHit = 0;
let arenaTotalTargets = 8;
let arenaAttackTimeLeft = 2;
let heart = { x: 200, y: 400, size: 14, hitbox: 4, vx: 0, vy: 0 };
let attacks = [];
let arenaBlasters = [];
let arenaExtendedState = null;
let arenaAllowedTypes = [];
let arenaGERUniqueTrainingAttacks = [];
let arenaGERUniqueTrainingState = null;
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
let keys = { w: false, a: false, s: false, d: false, up: false, left: false, down: false, right: false, jump: false };
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
let arenaDodgeTimer = 0;
let arenaDodgeTimerInterval = null;
let arenaPhaseTimeout = null;

let mobileSuperTapTimer = null;
let mobileSuperTapCount = 0;
let mobileSuperSwipeStart = null;

let wallSpeedMult = 1.0;
let wallCountMult = 1.0;
let wallWarningTimer = null;

// Anti-Spiral: blue soul, downward gravity, shifting arena dimensions.
let antiSpiralMusic = null;
let antiSpiralGravityVelocity = 0;
let antiSpiralArenaWidth = 396;
let antiSpiralArenaHeight = 496;
let antiSpiralArenaTargetWidth = 396;
let antiSpiralArenaTargetHeight = 496;
let antiSpiralArenaLastShift = 0;
let antiSpiralArenaWidePhase = true;
let antiSpiralJumpCooldown = 0;
let antiSpiralAttackStep = 0;
let antiSpiralActivePattern = 0;
let antiSpiralSpiralAngle = 0;
let antiSpiralVolleyDirection = 1;

function antiSpiralFloorY() {
    return 500 - (445 - antiSpiralArenaHeight) / 2 - heart.size;
}

// Four attack scripts unique to the wave-1500 fight.
// 0: rotating spiral; 1: ground-level wave (jump over it); 2: falling singularities;
// 3: aimed crossfire. All attacks use the arena's existing collision/rendering system.
function spawnAntiSpiralAttack() {
    if (!arenaActive || arenaPhase !== "dodge" || arenaCurrentWave !== 1500) return;
    var pattern = antiSpiralActivePattern;
    var dmg = Math.max(1, Math.floor(arenaBaseDmg * 0.38));
    var floorY = antiSpiralFloorY();

    if (pattern === 0) {
        var base = Math.atan2(heart.y - 70, heart.x - 200) + antiSpiralSpiralAngle;
        for (var i = -2; i <= 2; i++) {
            var angle = base + i * 0.22;
            attacks.push({
                type: "square", x: 200, y: 70, size: 17,
                spd: Math.cos(angle) * 2.8, spdY: Math.sin(angle) * 2.8,
                color: "#39c8ff", damage: dmg, bouncesLeft: 0
            });
        }
        antiSpiralSpiralAngle += 0.27;
    } else if (pattern === 1) {
        // A low moving wave forces the player to jump, not just run sideways.
        var dir = antiSpiralVolleyDirection;
        var startX = dir > 0 ? -28 : 428;
        var spacing = 48;
        for (var j = 0; j < 4; j++) {
            attacks.push({
                type: "square", x: startX - dir * j * spacing, y: floorY - 20,
                size: 23, spd: dir * 4.1, spdY: 0,
                color: "#55c8ff", damage: dmg, bouncesLeft: 0
            });
        }
        antiSpiralVolleyDirection *= -1;
    } else if (pattern === 2) {
        var left = (400 - antiSpiralArenaWidth) / 2 + 22;
        var right = (400 + antiSpiralArenaWidth) / 2 - 22;
        for (var k = 0; k < 5; k++) {
            var laneX = left + (right - left) * ((k + 0.5) / 5);
            // The lane closest to the soul is deliberately omitted to keep the volley readable.
            if (Math.abs(laneX - heart.x) < 28) continue;
            attacks.push({
                type: "square", x: laneX - 10, y: 58, size: 20,
                spd: Math.sin(antiSpiralSpiralAngle + k) * 0.25,
                spdY: 2.7 + (k % 2) * 0.45, color: "#35aaff",
                damage: dmg, bouncesLeft: 0
            });
        }
        antiSpiralSpiralAngle += 0.35;
    } else {
        // A short, aimed fan from the side opposite the player.
        var sourceX = heart.x < 200 ? 420 : -20;
        var sourceY = 110 + Math.random() * 110;
        var aim = Math.atan2(heart.y - sourceY, heart.x - sourceX);
        for (var m = -1; m <= 1; m++) {
            var a = aim + m * 0.19;
            attacks.push({
                type: "square", x: sourceX, y: sourceY, size: 19,
                spd: Math.cos(a) * 3.2, spdY: Math.sin(a) * 3.2,
                color: "#a45cff", damage: dmg, bouncesLeft: 0
            });
        }
    }
}

function startAntiSpiralDodgePhase() {
    if (arenaDodgeTimerInterval) { clearInterval(arenaDodgeTimerInterval); arenaDodgeTimerInterval = null; }
    if (arenaPhaseTimeout) { clearTimeout(arenaPhaseTimeout); arenaPhaseTimeout = null; }
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    if (wallWarningTimer) { clearTimeout(wallWarningTimer); wallWarningTimer = null; }

    arenaPhase = "dodge";
    attacks = [];
    arenaBlasters = [];
    arenaClickTargets = [];
    wallGapIndicator = null;
    antiSpiralActivePattern = antiSpiralAttackStep % 4;
    antiSpiralAttackStep++;
    arenaAttackType = [1, 8, 9, 10][antiSpiralActivePattern];
    antiSpiralSpiralAngle = 0;
    var names = [
        "СПИРАЛЬНЫЙ ШТОРМ",
        "ВОЛНА ГОРИЗОНТА — ПРЫГАЙ!",
        "ДОЖДЬ СИНГУЛЯРНОСТЕЙ",
        "ГРАВИТАЦИОННЫЙ РАЗЛОМ"
    ];
    arenaDodgeTimer = 9;
    var title = function() {
        return "АНТИ-СПИРАЛЬ — " + names[antiSpiralActivePattern] +
            " | ↑ / W / SPACE — ПРЫЖОК | " + arenaDodgeTimer + "с";
    };
    var bossNameEl = document.getElementById("arenaBossName");
    if (bossNameEl) bossNameEl.innerText = title();
    var timerEl = document.getElementById("arenaTimer");
    if (timerEl) timerEl.innerText = arenaDodgeTimer + "с";

    var interval = antiSpiralActivePattern === 1 ? 620 : 850;
    arenaAttackInterval = setInterval(function() {
        var stopped = typeof window.isDioTimeStopped === "function"
            ? window.isDioTimeStopped()
            : (typeof _superState !== "undefined" && (_superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0));
        if (arenaPhase === "dodge" && arenaActive && !stopped) spawnAntiSpiralAttack();
    }, interval);

    arenaDodgeTimerInterval = setInterval(function() {
        var stopped = typeof window.isDioTimeStopped === "function"
            ? window.isDioTimeStopped()
            : (typeof _superState !== "undefined" && (_superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0));
        if (arenaPhase !== "dodge" || !arenaActive || stopped) return;
        arenaDodgeTimer = Math.max(0, arenaDodgeTimer - 1);
        var bossEl = document.getElementById("arenaBossName");
        if (bossEl) bossEl.innerText = title();
        var timer = document.getElementById("arenaTimer");
        if (timer) timer.innerText = arenaDodgeTimer + "с";
    }, 1000);

    arenaPhaseTimeout = setTimeout(function waitForAntiSpiralTimeStop() {
        if (arenaPhase !== "dodge" || !arenaActive) return;
        var stopped = typeof window.isDioTimeStopped === "function"
            ? window.isDioTimeStopped()
            : (typeof _superState !== "undefined" && (_superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0));
        if (stopped) {
            arenaPhaseTimeout = setTimeout(waitForAntiSpiralTimeStop, 50);
            return;
        }
        if (arenaDodgeTimerInterval) { clearInterval(arenaDodgeTimerInterval); arenaDodgeTimerInterval = null; }
        startAttackPhase();
    }, 9000);
}

function startAntiSpiralMusic() {
    if (typeof musicEnabled !== "undefined" && !musicEnabled) return;
    try {
        if (!antiSpiralMusic) {
            antiSpiralMusic = new Audio("music/анти спираль.mp3");
            antiSpiralMusic.loop = true;
            antiSpiralMusic.volume = 0.28;
        }
        if (typeof currentMusic !== "undefined" && currentMusic) currentMusic.pause();
        antiSpiralMusic.currentTime = 0;
        antiSpiralMusic.play().catch(function() {});
    } catch (e) {}
}

function stopAntiSpiralMusic() {
    if (!antiSpiralMusic) return;
    try { antiSpiralMusic.pause(); antiSpiralMusic.currentTime = 0; } catch (e) {}
}

function updateAntiSpiralArena(now) {
    if (arenaCurrentWave !== 1500) return;
    if (!antiSpiralArenaLastShift) antiSpiralArenaLastShift = now;
    if (now - antiSpiralArenaLastShift >= 4200) {
        antiSpiralArenaLastShift = now;
        antiSpiralArenaWidePhase = !antiSpiralArenaWidePhase;
        antiSpiralArenaTargetWidth = antiSpiralArenaWidePhase ? 396 : 252;
        antiSpiralArenaTargetHeight = antiSpiralArenaWidePhase ? 300 : 438;
        playArenaSound(antiSpiralArenaWidePhase ? 90 : 150, "sawtooth", 0.35, 0.08);
        spawnFloatingText(200, 90, antiSpiralArenaWidePhase ? "ПРОСТРАНСТВО РАСШИРЯЕТСЯ" : "ПРОСТРАНСТВО СЖИМАЕТСЯ", "#55c8ff");
    }
    antiSpiralArenaWidth += (antiSpiralArenaTargetWidth - antiSpiralArenaWidth) * 0.045;
    antiSpiralArenaHeight += (antiSpiralArenaTargetHeight - antiSpiralArenaHeight) * 0.045;
}


// ★ Регенерация Белоуса ★
let whitebeardRegenTimer = 0;

if (typeof window._armorSpeedApplied === 'undefined') window._armorSpeedApplied = false;

// ========== ЗВУКОВАЯ СИСТЕМА АРЕНЫ ==========
let arenaAudioCtx = null;

function initArenaAudio() {
    if (arenaAudioCtx) { if (arenaAudioCtx.state === 'suspended') arenaAudioCtx.resume(); return; }
    try { arenaAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(err) {}
}

function playArenaSound(frequency, type, duration, volume, detune) {
    if (volume === undefined) volume = 0.12;
    if (detune === undefined) detune = 0;
    let globalVol = (typeof arenaSettings !== 'undefined') ? arenaSettings.volume : 0.20;
    let soundMaster = (typeof arenaSettings !== 'undefined' && Number.isFinite(Number(arenaSettings.soundVolume)))
        ? Math.max(0, Math.min(1, Number(arenaSettings.soundVolume))) : 1;
    let finalVolume = volume * globalVol * soundMaster;
    if (finalVolume <= 0.001) return;
    if (!arenaAudioCtx) { try { initArenaAudio(); } catch(err) { return; } }
    if (!arenaAudioCtx) return;
    try {
        const oscillator = arenaAudioCtx.createOscillator();
        const gainNode = arenaAudioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, arenaAudioCtx.currentTime);
        if (detune) oscillator.detune.setValueAtTime(detune, arenaAudioCtx.currentTime);
        gainNode.gain.setValueAtTime(finalVolume, arenaAudioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, arenaAudioCtx.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(arenaAudioCtx.destination);
        oscillator.start(arenaAudioCtx.currentTime);
        oscillator.stop(arenaAudioCtx.currentTime + duration);
    } catch(err) {}
}

function startArenaAmbient() {
    if (arenaAmbientSoundInterval) return;
    arenaAmbientSoundInterval = setInterval(function() {
        if (!arenaActive) { clearInterval(arenaAmbientSoundInterval); arenaAmbientSoundInterval = null; return; }
        playArenaSound(30 + Math.random() * 15, 'sine', 2.0, 0.03);
    }, 3000);
}

function stopArenaAmbient() { if (arenaAmbientSoundInterval) { clearInterval(arenaAmbientSoundInterval); arenaAmbientSoundInterval = null; } }

// ====== ЗВУКИ ======
function sfxWhiteWalls() { playArenaSound(80, 'sawtooth', 0.5, 0.08); setTimeout(function() { playArenaSound(60, 'sawtooth', 0.4, 0.06); }, 150); setTimeout(function() { playArenaSound(100, 'triangle', 0.3, 0.05); }, 300); }
function sfxBlueChaos() { playArenaSound(600, 'square', 0.15, 0.04); setTimeout(function() { playArenaSound(800, 'square', 0.12, 0.03); }, 50); setTimeout(function() { playArenaSound(400, 'square', 0.1, 0.04); }, 100); }
function sfxYellowSwords() { playArenaSound(200, 'sawtooth', 0.3, 0.08); setTimeout(function() { playArenaSound(300, 'sawtooth', 0.25, 0.06); }, 60); setTimeout(function() { playArenaSound(500, 'triangle', 0.2, 0.05); }, 120); }
function sfxRedTriangles() { playArenaSound(50, 'sawtooth', 0.6, 0.1); setTimeout(function() { playArenaSound(40, 'sawtooth', 0.5, 0.08); }, 200); setTimeout(function() { playArenaSound(70, 'triangle', 0.4, 0.06); }, 400); }
function sfxPinkKnockback() { playArenaSound(500, 'sine', 0.2, 0.06); setTimeout(function() { playArenaSound(300, 'sine', 0.25, 0.08); }, 60); setTimeout(function() { playArenaSound(700, 'sine', 0.15, 0.04); }, 120); }
function sfxGreenHealSpawn() { playArenaSound(800, 'sine', 0.3, 0.06); setTimeout(function() { playArenaSound(1000, 'sine', 0.25, 0.05); }, 100); setTimeout(function() { playArenaSound(1200, 'sine', 0.2, 0.04); }, 200); }
function sfxRainbowDeathSpawn() { playArenaSound(30, 'sawtooth', 1.5, 0.15); setTimeout(function() { playArenaSound(20, 'sawtooth', 1.2, 0.12); }, 200); setTimeout(function() { playArenaSound(50, 'sawtooth', 1.0, 0.1); }, 400); }
function sfxMixAttack() { playArenaSound(150, 'square', 0.2, 0.06); setTimeout(function() { playArenaSound(60, 'sawtooth', 0.3, 0.08); }, 100); setTimeout(function() { playArenaSound(300, 'triangle', 0.15, 0.04); }, 200); }
function sfxZoneAttack() { playArenaSound(100, 'sawtooth', 0.5, 0.08); setTimeout(function() { playArenaSound(130, 'sawtooth', 0.4, 0.06); }, 150); setTimeout(function() { playArenaSound(90, 'triangle', 0.3, 0.05); }, 300); }
function sfxBombTick() { playArenaSound(1000, 'square', 0.08, 0.05); setTimeout(function() { playArenaSound(800, 'square', 0.06, 0.03); }, 100); }
function sfxBlasterCharge() { playArenaSound(60, 'sawtooth', 0.8, 0.1); setTimeout(function() { playArenaSound(90, 'sawtooth', 0.6, 0.08); }, 100); setTimeout(function() { playArenaSound(120, 'sawtooth', 0.5, 0.06); }, 200); }
function sfxArenaAttackSpawn() { playArenaSound(220, 'sawtooth', 0.25, 0.06); setTimeout(function() { playArenaSound(330, 'sawtooth', 0.2, 0.05); }, 80); }
function sfxArenaMiss() { playArenaSound(100, 'sine', 0.6, 0.1); setTimeout(function() { playArenaSound(80, 'sine', 0.5, 0.08); }, 150); }
function sfxArenaHit() { playArenaSound(60, 'sawtooth', 0.8, 0.25); setTimeout(function() { playArenaSound(45, 'sawtooth', 0.9, 0.2); }, 100); }
function sfxArenaHeal() { playArenaSound(400, 'sine', 0.5, 0.1); setTimeout(function() { playArenaSound(600, 'sine', 0.5, 0.1); }, 100); setTimeout(function() { playArenaSound(800, 'sine', 0.4, 0.1); }, 200); }
function sfxArenaBombExplosion() { playArenaSound(25, 'sawtooth', 1.5, 0.4); setTimeout(function() { playArenaSound(20, 'sawtooth', 1.3, 0.35); }, 100); setTimeout(function() { playArenaSound(15, 'sawtooth', 1.1, 0.3); }, 250); }
function sfxArenaBlasterFire() { playArenaSound(80, 'square', 0.8, 0.25); setTimeout(function() { playArenaSound(120, 'square', 0.7, 0.2); }, 60); setTimeout(function() { playArenaSound(200, 'square', 0.6, 0.15); }, 120); }
function sfxArenaTargetHit() { playArenaSound(500, 'square', 0.15, 0.06); setTimeout(function() { playArenaSound(700, 'square', 0.1, 0.05); }, 40); }
function sfxArenaPerfect() { playArenaSound(300, 'sine', 0.4, 0.1); setTimeout(function() { playArenaSound(450, 'sine', 0.4, 0.1); }, 80); setTimeout(function() { playArenaSound(600, 'sine', 0.4, 0.1); }, 160); }
function sfxArenaFailAttack() { playArenaSound(100, 'triangle', 0.8, 0.2); setTimeout(function() { playArenaSound(70, 'triangle', 0.7, 0.2); }, 150); }
function sfxArenaDeath() { playArenaSound(40, 'sawtooth', 2.0, 0.35); setTimeout(function() { playArenaSound(30, 'sawtooth', 1.8, 0.3); }, 200); setTimeout(function() { playArenaSound(20, 'sawtooth', 1.5, 0.25); }, 500); }
function sfxArenaVictory() { playArenaSound(400, 'sine', 0.6, 0.12); setTimeout(function() { playArenaSound(500, 'sine', 0.6, 0.12); }, 100); setTimeout(function() { playArenaSound(600, 'sine', 0.6, 0.12); }, 200); setTimeout(function() { playArenaSound(800, 'sine', 0.7, 0.15); }, 300); }
function sfxWhoosh() { playArenaSound(200, 'sine', 0.3, 0.05, -200); setTimeout(function() { playArenaSound(150, 'sine', 0.2, 0.04, -300); }, 50); }
function sfxBounce() { playArenaSound(300, 'square', 0.1, 0.03); setTimeout(function() { playArenaSound(200, 'square', 0.08, 0.02); }, 40); }
function sfxShieldBreak() { playArenaSound(150, 'sawtooth', 0.3, 0.08); setTimeout(function() { playArenaSound(100, 'sawtooth', 0.2, 0.06); }, 80); }

// ====== ОСНОВНЫЕ ФУНКЦИИ ======
function initArena() {
    canvas = document.getElementById("arenaCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    var handleKey = function(ev, isDown) {
        // Не перехватываем игровые клавиши, пока игрок печатает текст.
        // Иначе пробел блокируется даже в поле ввода промокода.
        var target = ev.target;
        if (target && (
            target.isContentEditable ||
            /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || "") ||
            (typeof target.closest === "function" &&
                target.closest('input, textarea, select, [contenteditable="true"]'))
        )) return;

        var k = ev.key.toLowerCase();
        if (k in keys) { keys[k] = isDown; ev.preventDefault(); }
        if (k === " ") { keys.jump = isDown; ev.preventDefault(); }
        if (k === "arrowup") { keys.up = isDown; ev.preventDefault(); }
        if (k === "arrowdown") { keys.down = isDown; ev.preventDefault(); }
        if (k === "arrowleft") { keys.left = isDown; ev.preventDefault(); }
        if (k === "arrowright") { keys.right = isDown; ev.preventDefault(); }
    };
    window.addEventListener("keydown", function(ev) { handleKey(ev, true); });
    window.addEventListener("keyup", function(ev) { handleKey(ev, false); });

    canvas.addEventListener("touchstart", function(ev) {
        if (!arenaActive) return;

        if (window._joystick && window._joystick.enabled) {
            if (arenaPhase === "attack") {
                ev.preventDefault();
                var rectA = canvas.getBoundingClientRect();
                for (var i = 0; i < ev.touches.length; i++) {
                    checkClickTarget(getArenaCanvasPoint(ev.touches[i].clientX, ev.touches[i].clientY).x, getArenaCanvasPoint(ev.touches[i].clientX, ev.touches[i].clientY).y);
                }
            }
            return;
        }

        ev.preventDefault();
        var rect = canvas.getBoundingClientRect();
        if (arenaPhase === "attack") {
            for (var i = 0; i < ev.touches.length; i++) {
                checkClickTarget(getArenaCanvasPoint(ev.touches[i].clientX, ev.touches[i].clientY).x, getArenaCanvasPoint(ev.touches[i].clientX, ev.touches[i].clientY).y);
            }
            return;
        }
        if (ev.touches.length === 1) {
            var tx = ev.touches[0].clientX - rect.left;
            var ty = ev.touches[0].clientY - rect.top;
            var mobileMode = (typeof arenaSettings !== 'undefined') ? arenaSettings.mobileSuper : "button";
            if (mobileMode === "doubletap") {
                mobileSuperTapCount++;
                if (mobileSuperTapTimer) clearTimeout(mobileSuperTapTimer);
                if (mobileSuperTapCount >= 2) { mobileSuperTapCount = 0; if (typeof toggleSuper === 'function') toggleSuper(); return; }
                mobileSuperTapTimer = setTimeout(function() { mobileSuperTapCount = 0; }, 300);
            }
            if (mobileMode === "swipeup") { mobileSuperSwipeStart = { x: tx, y: ty, time: Date.now() }; }
            joystickActive = true; joystickId = ev.touches[0].identifier; joystickX = tx; joystickY = ty;
        }
    });

    canvas.addEventListener("touchmove", function(ev) {
        if (!arenaActive || arenaPhase !== "dodge") return;
        if (window._joystick && window._joystick.enabled) return;
        ev.preventDefault();
        for (var i = 0; i < ev.touches.length; i++) {
            if (ev.touches[i].identifier === joystickId) {
                var rect = canvas.getBoundingClientRect();
                joystickX = ev.touches[i].clientX - rect.left; joystickY = ev.touches[i].clientY - rect.top;
                break;
            }
        }
    });

    canvas.addEventListener("touchend", function(ev) {
        if (window._joystick && window._joystick.enabled) return;
        var mobileMode = (typeof arenaSettings !== 'undefined') ? arenaSettings.mobileSuper : "button";
        if (mobileMode === "swipeup" && mobileSuperSwipeStart) {
            var rect = canvas.getBoundingClientRect();
            var endY = 0;
            if (ev.changedTouches && ev.changedTouches.length > 0) { endY = ev.changedTouches[0].clientY || 0; }
            endY = endY - rect.top;
            var dy = mobileSuperSwipeStart.y - endY;
            var dt = Date.now() - mobileSuperSwipeStart.time;
            if (dy > 60 && dt < 500) { if (typeof toggleSuper === 'function') toggleSuper(); }
            mobileSuperSwipeStart = null;
        }
        joystickActive = false; joystickId = null;
    });

    canvas.addEventListener("click", function(ev) {
        if (!arenaActive || arenaPhase !== "attack") return;
        var rect = canvas.getBoundingClientRect();
        var point = getArenaCanvasPoint(ev.clientX, ev.clientY);
        checkClickTarget(point.x, point.y);
    });
}

function clampHeart() {
    if (arenaCurrentWave === 1500) {
        var left = (400 - antiSpiralArenaWidth) / 2 + heart.size;
        var right = (400 + antiSpiralArenaWidth) / 2 - heart.size;
        var top = 55 + (445 - antiSpiralArenaHeight) / 2 + heart.size;
        var bottom = 500 - (445 - antiSpiralArenaHeight) / 2 - heart.size;
        heart.x = Math.max(left, Math.min(right, heart.x));
        heart.y = Math.max(top, Math.min(bottom, heart.y));
        return;
    }
    heart.x = Math.max(heart.size, Math.min(400 - heart.size, heart.x));
    heart.y = Math.max(heart.size, Math.min(500 - heart.size, heart.y));
}

function updateTakabaConfidenceDisplay() {
    if (typeof _superState === 'undefined') return;
    var el = document.getElementById("arenaTakabaConfidenceDisplay");
    var mainCardForTakaba = null;
    try {
        if (typeof team !== 'undefined' && Array.isArray(team) && typeof myCards !== 'undefined' && Array.isArray(myCards) &&
            typeof mainCardIndex === 'number' && mainCardIndex >= 0 && mainCardIndex < team.length) {
            mainCardForTakaba = myCards[team[mainCardIndex]];
        }
    } catch(e) {}
    var hasTakaba = !!(mainCardForTakaba && mainCardForTakaba.name === "Такаба" &&
        (typeof hasMasteryAbility !== 'function' || hasMasteryAbility(mainCardForTakaba)));
    if (!hasTakaba) {
        if (el) el.style.display = "none";
        return;
    }
    if (!el) {
        var overlay = document.getElementById("arenaOverlay");
        if (!overlay) return;
        el = document.createElement("div");
        el.id = "arenaTakabaConfidenceDisplay";
        el.style.cssText = "position:absolute;top:8px;left:8px;right:auto;background:rgba(25,8,30,0.94);color:#fff;padding:7px 9px;border-radius:9px;font-size:11px;font-weight:900;z-index:1000;pointer-events:none;font-family:'Nunito',sans-serif;box-shadow:0 0 14px rgba(255,102,255,0.65);border:1px solid rgba(255,153,238,0.65);";
        overlay.appendChild(el);
    }
    var tc = Math.max(0, Math.min(100, Number(_superState.takabaConfidence) || 0));
    var tl = typeof getTakabaLevel === 'function' ? getTakabaLevel(tc) : 1;
    var pct = Math.round(tc);
    el.style.top = "8px";
    el.style.left = "8px";
    el.style.right = "auto";
    el.style.width = "190px";
    el.style.boxSizing = "border-box";
    el.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;"><span>🎭 УВЕРЕННОСТЬ</span><b>' + Math.round(tc) + ' / 100</b></div>' +
        '<div style="height:9px;background:rgba(0,0,0,.45);border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.25);">' +
        '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#ff4fd8,#ff9df0);transition:width .2s;"></div></div>' +
        '<div style="font-size:10px;margin-top:3px;text-align:center;">УР. ' + tl + '</div>';
    el.style.display = "block";
}

// ★★★ ФИКС: Такаба замораживает игрока ★★★
function getDrinkTeaEmergencySpeedMultiplier() {
    var mainCard = null;
    if (typeof window !== "undefined" && window.__mbBossTestMode && window.__mbBossTestMainCard) {
        mainCard = window.__mbBossTestMainCard;
    } else if (typeof team !== "undefined" && Array.isArray(team) &&
        typeof myCards !== "undefined" && Array.isArray(myCards) &&
        typeof mainCardIndex === "number" && mainCardIndex >= 0 && mainCardIndex < team.length) {
        mainCard = myCards[team[mainCardIndex]];
    }
    if (!mainCard || mainCard.name !== "DrinkTea2Win") return 1;
    var hp = NaN, maxHp = NaN;
    if (typeof livingStoneActive !== "undefined" && livingStoneActive) {
        hp = Number(livingStonePlayerHp); maxHp = Number(livingStonePlayerMaxHp);
    } else if (typeof waystarActive !== "undefined" && waystarActive) {
        hp = Number(waystarPlayerHp); maxHp = Number(waystarPlayerMaxHp);
    } else if (typeof window.rwbActive !== "undefined" && window.rwbActive &&
        typeof window.getRWBPlayer === "function" && window.getRWBPlayer()) {
        var rwbEmergencyPlayer = window.getRWBPlayer();
        hp = Number(rwbEmergencyPlayer.hp); maxHp = Number(rwbEmergencyPlayer.maxHp);
    } else if (typeof window.getAntiSpiralBossActive === "function" && window.getAntiSpiralBossActive() &&
        typeof window.getAntiSpiralPlayerHp === "function" && typeof window.getAntiSpiralPlayerMaxHp === "function") {
        hp = Number(window.getAntiSpiralPlayerHp()); maxHp = Number(window.getAntiSpiralPlayerMaxHp());
    } else {
        hp = Number(arenaHP); maxHp = Number(arenaMaxHP);
    }
    if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return 1;
    return hp / maxHp <= 0.30 ? 1.35 : 1;
}
window.getDrinkTeaEmergencySpeedMultiplier = getDrinkTeaEmergencySpeedMultiplier;

function moveHeart() {
    if (typeof _superState !== 'undefined' && (_superState.dioTimeStopWindupUntil || 0) > performance.now()) return;
    if (typeof _superState !== 'undefined' && _superState.takabaTimeStop) return;
    if (typeof _superState !== 'undefined' && _superState.usoppStunTimer > 0) return;
    if (typeof _superState !== 'undefined' && _superState.garouTimeStop) return;

    var mx = 0, my = 0;

    if (window._joystick && window._joystick.enabled && window._joystick.active) {
        mx = window._joystick.vectorX || 0;
        my = window._joystick.vectorY || 0;
    }
    else if (joystickActive) {
        mx = (joystickX - heart.x) / 15;
        my = (joystickY - heart.y) / 15;
        var len = Math.sqrt(mx * mx + my * my);
        if (len > 1) { mx /= len; my /= len; }
    }

    var jumpRequested = arenaCurrentWave === 1500 && my < -0.4;
    if (arenaCurrentWave === 1500) {
        // Blue soul: vertical input triggers a jump; it no longer fights gravity as weak upward movement.
        my = 0;
        if (keys.w || keys.up || keys.jump) jumpRequested = true;
    } else {
        if (keys.w || keys.up) my -= 1;
        if (keys.s || keys.down) my += 1;
    }
    if (keys.a || keys.left) mx -= 1;
    if (keys.d || keys.right) mx += 1;

    if (typeof _superState !== 'undefined' && _superState.invertControls) { mx = -mx; my = -my; }

    var isMoving = Math.abs(mx) > 0.05 || Math.abs(my) > 0.05;
    heartWasMoving = isMoving;

    if (isMoving) {
        heartStandingTime = 0;
        heartRotation += 0.15;
        var len2 = Math.sqrt(mx * mx + my * my);
        if (len2 > 1) { mx /= len2; my /= len2; }
        var emergencySpeedMult = getDrinkTeaEmergencySpeedMultiplier();
        var activeHeartSpeed = heartSpeed * emergencySpeedMult;
        if (emergencySpeedMult > 1) {
            window._drinkTeaEmergencySpeedActive = true;
            var emergencySpeedDisplay = document.getElementById("arenaSpeedDisplay");
            if (emergencySpeedDisplay) emergencySpeedDisplay.innerText = (heartSpeed * emergencySpeedMult).toFixed(2) + " (+35%)";
        } else {
            window._drinkTeaEmergencySpeedActive = false;
            var normalSpeedDisplay = document.getElementById("arenaSpeedDisplay");
            if (normalSpeedDisplay) normalSpeedDisplay.innerText = heartSpeed.toFixed(2);
        }
        if (arenaExtendedState && arenaExtendedState.type === 18 && performance.now() < Number(arenaExtendedState.gearSlowUntil || 0)) activeHeartSpeed *= 0.30;
        if (arenaExtendedState && arenaExtendedState.type === 19 && performance.now() < Number(arenaExtendedState.vineSlowUntil || 0)) activeHeartSpeed *= 0.58;
        heart.x += mx * activeHeartSpeed;
        heart.y += my * activeHeartSpeed;
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

    if (arenaCurrentWave === 1500) {
        var floorY = antiSpiralFloorY();
        if (antiSpiralJumpCooldown > 0) antiSpiralJumpCooldown--;
        var grounded = heart.y >= floorY - 1 && antiSpiralGravityVelocity >= 0;
        if (jumpRequested && grounded && antiSpiralJumpCooldown <= 0) {
            antiSpiralGravityVelocity = -7.6;
            antiSpiralJumpCooldown = 10;
            spawnFloatingText(heart.x, heart.y - 20, "ПРЫЖОК!", "#55c8ff");
            playArenaSound(520, "sine", 0.12, 0.045);
        } else {
            antiSpiralGravityVelocity = Math.min(5.2, antiSpiralGravityVelocity + 0.28);
        }
        heart.y += antiSpiralGravityVelocity;
        if (heart.y >= floorY) { heart.y = floorY; antiSpiralGravityVelocity = 0; }
    } else {
        antiSpiralGravityVelocity = 0;
        antiSpiralJumpCooldown = 0;
    }
    clampHeart();

    if (Math.random() > 0.3) {
        arenaTrail.push({ x: heart.x, y: heart.y, life: 12, maxLife: 12, size: Math.max(1, heart.size * 0.75), color: (typeof _superState !== 'undefined' && _superState.takabaRainbowTrail) ? "hsl(" + ((performance.now()/3)%360) + ",100%,60%)" : (arenaCurrentWave === 1500 ? "rgba(38, 191, 255, 0.45)" : "rgba(255, 30, 30, 0.35)") });
    }

    if (arenaAttackType === 4) {
        if (heart.x - heart.hitbox < 2 || heart.x + heart.hitbox > 398 || heart.y - heart.hitbox < 2 || heart.y + heart.hitbox > 498) {
            if (invulnTimer <= 0) {
                invulnTimer = 20;
                applyHit(Math.max(8, Math.floor(arenaBaseDmg * 1.5)), "ШИПЫ!", false, false, arenaExtDamageAction("arena-boundary-spikes", {type:"arenaBoundary",segments:[{x1:0,y1:0,x2:400,y2:0,width:6},{x1:0,y1:500,x2:400,y2:500,width:6},{x1:0,y1:0,x2:0,y2:500,width:6},{x1:400,y1:0,x2:400,y2:500,width:6}]}));
            }
        }
    }
}

function spawnFloatingText(x, y, text, color) { floatingTexts.push({ x: x, y: y, text: text, color: color, life: 50, vy: -1.8, vx: (Math.random() - 0.5) * 1.5 }); }

// Преобразует координаты экрана в реальные координаты canvas.
function getArenaCanvasPoint(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function checkClickTarget(mx, my) {
    for (var i = arenaClickTargets.length - 1; i >= 0; i--) {
        var t = arenaClickTargets[i];
        // Большая зона попадания делает жёлтые цели надёжнее на сенсорных экранах.
        var hitRadius = t.radius + 24;
        if ((mx - t.x) * (mx - t.x) + (my - t.y) * (my - t.y) <= hitRadius * hitRadius && !t.hit) {
            t.hit = true; arenaClicksHit++; arenaShake = 8;
            arenaShockwaves.push({ x: t.x, y: t.y, r: 8, v: 6, life: 16, maxLife: 16, color: "#ffdd00" });
            sfxArenaTargetHit();
            for (var j = 0; j < 35; j++) { var angle = Math.random() * Math.PI * 2; var spd = 3 + Math.random() * 6; arenaParticles.push({ x: t.x, y: t.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 28, maxLife: 28, color: Math.random() > 0.3 ? "#ffdd00" : "#ffffff", size: 1.5 + Math.random() * 4 }); }
            break;
        }
    }
}

function calculateArenaHP() {
    var bonus = 0;
    var cards = window.myCards || (typeof myCards !== 'undefined' ? myCards : null);
    var teamArr = window.team || (typeof team !== 'undefined' ? team : null);
    if (cards && teamArr && Array.isArray(cards) && Array.isArray(teamArr)) {
        for (var i = 0; i < teamArr.length; i++) { var idx = teamArr[i]; if (idx >= 0 && idx < cards.length && cards[idx] && typeof cards[idx].hp === 'number') bonus += Math.floor(cards[idx].hp / 50); }
    }
    var hpUpgradeBonus = 0;
    if (typeof upgrades !== 'undefined' && upgrades.hp) hpUpgradeBonus = Math.floor(upgrades.hp.level * upgrades.hp.increment / 2);
    var playerMaxHp = (typeof window !== 'undefined' && window.playerMaxHp) ? window.playerMaxHp : 100;
    var hpScaleBonus = Math.floor(playerMaxHp / 20);
    arenaMaxHP = 70 + bonus + hpUpgradeBonus + hpScaleBonus;
    arenaHP = arenaMaxHP;
}

function getAttackTypes(bossWave) {
    var types;
    if (typeof bossTemplates !== 'undefined' && bossTemplates[bossWave] && Array.isArray(bossTemplates[bossWave].arenaTypes)) {
        types = bossTemplates[bossWave].arenaTypes.slice();
    } else if (bossWave < 100) {
        types = [0, 1];
    } else if (bossWave < 400) {
        types = [0, 1, 2, 3];
    } else if (bossWave < 1000) {
        types = [0, 1, 2, 3, 4, 5];
    } else if (bossWave < 2000) {
        types = [0, 1, 2, 3, 4, 5, 7, 8];
    } else {
        types = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10];
    }

    // Ten new ordinary-boss patterns unlock gradually from wave 1100 to 2100.
    // Wave 1500 is reserved for the unique Anti-Spiral encounter and receives none.
    if (bossWave !== 1500) {
        var extendedUnlockWaves = [1100, 1200, 1300, 1400, 1600, 1700, 1800, 1900, 2000, 2100];
        for (var e = 0; e < extendedUnlockWaves.length; e++) {
            if (bossWave >= extendedUnlockWaves[e] && types.indexOf(11 + e) === -1) types.push(11 + e);
        }

        // From wave 1100 onward ordinary bosses use only the new extended patterns.
        // Preserve the unique Anti-Spiral fight at wave 1500 unchanged.
        if (bossWave >= 1100) {
            types = types.filter(function(type) { return type >= 11 && type <= 20; });
        }
    }
    return types;
}

function skipDefeatedBoss() { stopArena(); if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0; if (typeof victory === 'function') victory(); }

function getMainCardSpeedForArena() {
    if (typeof window !== "undefined" && window.__mbBossTestMode && window.__mbBossTestMainCard) {
        var testMain = window.__mbBossTestMainCard;
        var testSpeed = Number(testMain.speed) || 1.65;
        var isPucciTestCard = testMain.name === "Энрико Пуччи (Made in Heaven)";
        return { speed: Math.max(1.65, isPucciTestCard ? testSpeed : Math.min(6, testSpeed)), cardName: testMain.name || "Тестовый персонаж",
            cardRarity: testMain.rarity || "Тест", source: "bossTest", details: ["Выбрано во вкладке теста босса"] };
    }
    var result = { speed: 1.2, cardName: "Нет карты", cardRarity: "—", source: "базовая", details: [] };
    if (typeof team === 'undefined' || !Array.isArray(team) || team.length === 0) { result.details.push("Отряд пуст"); return result; }
    if (typeof myCards === 'undefined' || !Array.isArray(myCards) || myCards.length === 0) { result.details.push("myCards пуст"); return result; }
    var idxInTeam = (typeof mainCardIndex !== 'undefined') ? mainCardIndex : -1;
    var needFallback = false;
    if (idxInTeam < 0 || idxInTeam >= team.length) needFallback = true;
    else { var cardIdx = team[idxInTeam]; if (cardIdx < 0 || cardIdx >= myCards.length) needFallback = true; }
    var mainCard = null;
    if (!needFallback) {
        var cardIdx = team[idxInTeam];
        mainCard = myCards[cardIdx];
        if (!mainCard || typeof mainCard.speed !== 'number' || mainCard.speed <= 0) needFallback = true;
    }
    if (needFallback) {
        var bestSpeed = 1.2, bestCard = null;
        for (var i = 0; i < team.length; i++) {
            var ci = team[i];
            if (ci < 0 || ci >= myCards.length) continue;
            var c = myCards[ci];
            if (!c || typeof c.speed !== 'number' || c.speed <= 0) continue;
            if (c.speed > bestSpeed) { bestSpeed = c.speed; bestCard = c; }
        }
        if (bestCard) mainCard = bestCard;
        else return result;
    }
    result.speed = mainCard.speed;
    result.cardName = mainCard.name;
    result.cardRarity = mainCard.rarity || "—";
    result.source = needFallback ? "fallback" : "mainCardIndex";
    return result;
}

function startArena(bossWave) {
    initArenaAudio();
    var joystickTrainingMode = isJoystickTrainingMode();
    var gerTrainingMode = typeof window !== "undefined" && window.__mbGERTrainingMode === true;
    var gerTrainingOptions = gerTrainingMode ? (window.__mbGERTrainingOptions || {}) : {};
    var gerTrainingUniqueMode = gerTrainingMode && gerTrainingOptions.trainingProfile === "unique_mix";
    var trainingMode = joystickTrainingMode || gerTrainingMode;
    var bossTestMode = (!joystickTrainingMode && typeof window !== "undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind === "arena") ? window.__mbBossTestMode : null;
    var bossIdentityWave = bossTestMode ? Number(bossTestMode.bossWave || bossWave) : bossWave;
    var bossStrengthWave = bossTestMode ? Math.max(50, Math.min(10000, Number(bossTestMode.attackWave) || bossWave)) : bossWave;
    var btn = document.getElementById("startArenaBtn"); if (btn) btn.style.display = "none";
    var spareBtn = document.getElementById("spareBtn"); if (spareBtn) spareBtn.style.display = "none";
    var skipBtn = document.getElementById("skipArenaBtn"); if (skipBtn) skipBtn.style.display = "none";
    var superBtn2 = document.getElementById("superBtn2"); if (superBtn2) superBtn2.style.display = "none";
    var superBtnDeact = document.getElementById("superBtnDeactivate"); if (superBtnDeact) superBtnDeact.style.display = "none";

    arenaBossDefeatedBefore = !trainingMode && !bossTestMode && (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(bossIdentityWave));
    arenaGERUniqueTrainingAttacks = [];
    arenaGERUniqueTrainingState = gerTrainingUniqueMode ? { lastNow: Date.now(), nextSpawnAt: 0, patternIndex: 0, sequence: 0 } : null;
    window.__mbGERUniqueTrainingAttacks = arenaGERUniqueTrainingAttacks;
    arenaActive = true; arenaCurrentWave = bossIdentityWave; arenaExtendedState = null; calculateArenaHP();
    antiSpiralGravityVelocity = 0;
    antiSpiralJumpCooldown = 0;
    antiSpiralAttackStep = 0;
    antiSpiralActivePattern = 0;
    antiSpiralSpiralAngle = 0;
    antiSpiralVolleyDirection = 1;
    antiSpiralArenaWidth = 396;
    antiSpiralArenaHeight = (!bossTestMode && bossIdentityWave === 1500) ? 438 : 496;
    antiSpiralArenaTargetWidth = 396;
    antiSpiralArenaTargetHeight = antiSpiralArenaHeight;
    antiSpiralArenaLastShift = Date.now();
    antiSpiralArenaWidePhase = false;
    if (!bossTestMode && bossIdentityWave === 1500) startAntiSpiralMusic();
    else stopAntiSpiralMusic();
    arenaKarma = 0; screenFlash = 0; arenaVignette = 0; arenaGlobalSpeedMod = 1.0; arenaDodgeTimer = 0;
    whitebeardRegenTimer = 0;
    if (arenaDodgeTimerInterval) { clearInterval(arenaDodgeTimerInterval); arenaDodgeTimerInterval = null; }
    if (arenaPhaseTimeout) { clearTimeout(arenaPhaseTimeout); arenaPhaseTimeout = null; }
    if (wallWarningTimer) { clearTimeout(wallWarningTimer); wallWarningTimer = null; }

    if (typeof _superState !== 'undefined') {
        _superState.markResurrectCharges = 2; _superState.markBuffActive = false; _superState.markBuffTimer = 0; _superState.markWingsActive = false; _superState.markWingAnimTime = 0; _superState.markDmgReduction = 1; _superState.markDmgBonus = 1; _superState.markSpeedBonus = 1;
        _superState.allmightPermaSlow = false; _superState.allmightDmgMult = 1; _superState.allmightBuffTimer = 0;
        _superState.allmightDebuffActive = false; _superState.allmightDebuffTimer = 0; _superState.allmightDebuffDmgMult = 1;
        _superState.antispiralActive = false; _superState.antispiralShrinkAttacks = false; _superState.imAuraActive = false;
        _superState.kaidoDrinking = false; _superState.kaidoBuffActive = false; _superState.kaidoDmgReduction = false; _superState.kaidoDmgBonus = 1; _superState.kaidoSpeedBonus = 1; _superState.invertControls = false;
        _superState.dandyInvuln = false; _superState.dandyLightnings = false; _superState.dandyDoubleTargets = false; _superState.dandyDmgBuff = null; _superState.dandyShield = null; _superState.dandyVulnerable = null;
        _superState.dandyDarkness = 0; _superState.dandyAura = 0; _superState.dandyLava = 0; _superState.dandyAutoRevive = false;
        _superState.garpHakiActive = false; _superState.garpHakiTimer = 0; _superState.garpChargeTimer = 0; _superState.garpImpactActive = false;
        _superState.garouInvulnTimer = 0; _superState.garouTimeStop = false; _superState.screenShakeAmount = 0; _superState.screenFlashWhite = 0;
        // ★ ТАКАБА ★
        _superState.takabaConfidence = 50;
        _superState.takabaLastEventTime = 0;
        _superState.takabaEventTimer = 0;
        _superState.takabaEffectTimer = 0;
        _superState.takabaEffectType = null;
        _superState.takabaTimeStop = false;
        _superState.takabaJokeActive = false;
        _superState.takabaCurrentJoke = "";
        _superState.takabaBgColor = null;
        _superState.takabaDuckMode = false;
        _superState.takabaDmgMult = 1;
        _superState.takabaDamageTakenMult = 1;
        window._takabaSpeedMult = 1;
    }

    var speedInfo = getMainCardSpeedForArena();
    heartSpeed = speedInfo.speed;

    window._armorSpeedApplied = false;
    if (typeof window.getArmorBonusesPublic === 'function') {
        try {
            var eqBonus = window.getArmorBonusesPublic();
            if (eqBonus && eqBonus.speedMult && eqBonus.speedMult !== 1.0) {
                heartSpeed *= eqBonus.speedMult;
                window._armorSpeedApplied = true;
            }
        } catch(e) {}
    }

    if (typeof getObesitySpeedMult === 'function') {
        var obesityMult = getObesitySpeedMult();
        if (obesityMult !== 1.0) heartSpeed *= obesityMult;
    }

    if(typeof getTakabaCombatModifiers==="function"){try{var tm=getTakabaCombatModifiers();heartSpeed*=tm.speedMult;window._takabaSpeedMult=tm.speedMult;}catch(e){window._takabaSpeedMult=1;}}else window._takabaSpeedMult=1;
    var heartSpeedCap = speedInfo.cardName === "Энрико Пуччи (Made in Heaven)" ? Infinity : 6.0;
    heartSpeed = Math.max(bossTestMode ? 1.65 : 0.4, Math.min(heartSpeedCap, heartSpeed));
    window._currentHeartSpeed = heartSpeed;

    var speedDisplay = document.getElementById("arenaSpeedDisplay");
    if (speedDisplay) speedDisplay.innerText = heartSpeed.toFixed(2);

    var overlay = document.getElementById("arenaOverlay");
    var mainCardDisplay = document.getElementById("arenaMainCardDisplay");
    if (!mainCardDisplay) {
        mainCardDisplay = document.createElement("div");
        mainCardDisplay.id = "arenaMainCardDisplay";
        mainCardDisplay.style.cssText = "position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.7);color:#fff;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:bold;z-index:100;pointer-events:none;font-family:'Nunito',sans-serif;";
        if (overlay) overlay.appendChild(mainCardDisplay);
    }
    mainCardDisplay.innerHTML = '👑 ' + speedInfo.cardName + ' | ⚡ ' + heartSpeed.toFixed(2);
    updateTakabaConfidenceDisplay();

    arenaClickTargets = []; arenaClicksHit = 0; arenaPhase = "dodge"; attacks = []; arenaBlasters = []; arenaParticles = []; floatingTexts = []; arenaTrail = []; arenaShockwaves = []; wallGapIndicator = null;
    arenaShake = 0; arenaHitFlash = 0; invulnTimer = 0; arenaComboText = ""; arenaComboTimer = 0; heart.x = 200; heart.y = 400; heart.vx = 0; heart.vy = 0; heartRotation = 0; heartWasMoving = false; heartStandingTime = 0;
    if (!bossTestMode && bossIdentityWave === 1500) heart.y = antiSpiralFloorY();

    var earlyArenaStrength = (!trainingMode && !bossTestMode && typeof window.MBGetWaveEnemyStrengthMultiplier === "function")
        ? window.MBGetWaveEnemyStrengthMultiplier(bossIdentityWave, true)
        : 1;
    arenaSpeedMult = Math.min(15.0, 1.0 + Math.floor((bossStrengthWave - 50) / 50) * 0.1); if (bossStrengthWave < 50) arenaSpeedMult = 1.0;
    wallSpeedMult = Math.min(4.0, 1.0 + Math.floor((bossStrengthWave - 50) / 100) * 0.15);
    if (bossStrengthWave < 50) wallSpeedMult = 1.0;
    wallCountMult = Math.min(2.0, 1.0 + Math.floor((bossStrengthWave - 50) / 200) * 0.15);
    if (bossStrengthWave < 50) wallCountMult = 1.0;
    // Lower early bosses' attack pressure as well as their HP and hit damage.
    arenaSpeedMult = Math.max(0.5, arenaSpeedMult * earlyArenaStrength);
    wallSpeedMult = Math.max(0.5, wallSpeedMult * earlyArenaStrength);
    wallCountMult = Math.max(0.5, wallCountMult * earlyArenaStrength);
    if (gerTrainingMode) {
        var gerTrainingSpeed = Math.max(1, Math.min(5, Number(window.__mbGERTrainingOptions && window.__mbGERTrainingOptions.speedMultiplier) || 2));
        arenaSpeedMult = Math.min(15, arenaSpeedMult * gerTrainingSpeed);
        wallSpeedMult = Math.min(8, wallSpeedMult * Math.sqrt(gerTrainingSpeed));
        wallCountMult = Math.min(3, wallCountMult * Math.sqrt(gerTrainingSpeed));
    }

    arenaAllowedTypes = gerTrainingUniqueMode ? [21] : getAttackTypes(bossStrengthWave);
    if (!gerTrainingUniqueMode && bossTestMode && Array.isArray(bossTestMode.attackTypes) && bossTestMode.attackTypes.length) {
        arenaAllowedTypes = bossTestMode.attackTypes.filter(function(type) { return Number.isInteger(type) && type >= 0 && type <= 20; });
        if (!arenaAllowedTypes.length) arenaAllowedTypes = [0];
    }
    var bt = typeof bossTemplates !== 'undefined' ? bossTemplates[bossIdentityWave] : null;
    arenaBoss = gerTrainingUniqueMode
        ? "🧠 GER · УНИКАЛЬНЫЙ ТРЕНИРОВОЧНЫЙ МАНЕКЕН"
        : gerTrainingMode
        ? "🧠 GER · " + (bossTestMode && bossTestMode.bossName ? bossTestMode.bossName : (bt ? bt.name : "ОБЫЧНЫЙ БОСС"))
        : (trainingMode ? "ТРЕНИРОВОЧНЫЙ БОСС · БЕССМЕРТЕН" : (bossTestMode ? (bossTestMode.bossName || (bt ? bt.name : "ОБЫЧНЫЙ БОСС")) : (bt ? bt.name : "БОСС ВРАТ")));
    var strengthFactor = Math.max(0.5, 1.0 + (bossStrengthWave - 50) / 100 * 0.5);
    var identityFactor = Math.max(0.5, 1.0 + (bossIdentityWave - 50) / 100 * 0.5);
    arenaBossDmgMult = (bt && bt.dmgMult) ? bt.dmgMult * strengthFactor / identityFactor : strengthFactor;
    arenaBaseDmg = Math.max(2, Math.floor((5 + bossStrengthWave * 1.5) * arenaBossDmgMult / 3));
    arenaBaseDmg = Math.max(1, Math.floor(arenaBaseDmg * earlyArenaStrength));
    if (trainingMode) {
        // Normal drills use a practically unlimited target; unique-mix has configurable real HP.
        var configuredGERHp = Number(gerTrainingOptions.bossHp);
        arenaBossMaxHP = gerTrainingUniqueMode
            ? Math.max(10000, Math.min(1000000000000, Math.floor(Number.isFinite(configuredGERHp) && configuredGERHp > 0 ? configuredGERHp : 1000000)))
            : 1000000000;
    } else if (bossTestMode) {
        var idealTestDamage = Math.max(1, Math.floor((Number(window.playerFinalDamage) || 20) * 2.5));
        arenaBossMaxHP = Math.max(5, idealTestDamage * 5);
    } else {
        arenaBossMaxHP = bt ? Math.floor((50 + bossIdentityWave * 12) * bt.hpMult) : 1000 + bossIdentityWave * 10;
        arenaBossMaxHP = Math.max(1, Math.floor(arenaBossMaxHP * earlyArenaStrength));
    }
    arenaBossOriginalMaxHP = arenaBossMaxHP;
    ghostBossHP = arenaBossMaxHP;

    document.getElementById("arenaOverlay").style.display = "flex";
    document.getElementById("arenaBossName").innerText = arenaBoss;
    document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
    document.getElementById("arenaTimer").innerText = "∞";
    var skipBossBtn = document.getElementById("skipBossBtn");
    if (skipBossBtn) skipBossBtn.style.display = (trainingMode || bossTestMode) ? "none" : (arenaBossDefeatedBefore ? "block" : "none");
    if (typeof initSuperState === 'function') initSuperState();
    updateTakabaConfidenceDisplay();
    if (typeof updateWhitebeardSkillButton === 'function') updateWhitebeardSkillButton();
    if (!ctx) initArena();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    startArenaAmbient();
    startDodgePhase();
    animFrameId = requestAnimationFrame(renderArena);
}

function isGERUniqueMixTraining() {
    return !!(window.__mbGERTrainingMode === true && window.__mbGERTrainingOptions && window.__mbGERTrainingOptions.trainingProfile === "unique_mix");
}

function startDodgePhase() {
    if (arenaCurrentWave === 1500) { startAntiSpiralDodgePhase(); return; }
    arenaPhase = "dodge"; attacks = []; arenaBlasters = []; wallGapIndicator = null; heart.x = 200; heart.y = 400; heart.vx = 0; heart.vy = 0;
    if (arenaDodgeTimerInterval) { clearInterval(arenaDodgeTimerInterval); arenaDodgeTimerInterval = null; }
    if (arenaPhaseTimeout) { clearTimeout(arenaPhaseTimeout); arenaPhaseTimeout = null; }
    if (wallWarningTimer) { clearTimeout(wallWarningTimer); wallWarningTimer = null; }
    arenaAttackType = arenaAllowedTypes[Math.floor(Math.random() * arenaAllowedTypes.length)];
    arenaExtendedState = null;
    if (arenaAttackType >= 11 && arenaAttackType <= 20 && arenaCurrentWave !== 1500) {
        arenaExtendedState = { type: arenaAttackType, elapsed: 0, lastNow: Date.now(), hazards: [], nextSpawnAt: 0, gustIndex: -1, sequence: 0 };
    }
    if (arenaAttackInterval) clearInterval(arenaAttackInterval);
    var baseInterval = 2400;
    if (arenaAttackType === 0) baseInterval = 3400; if (arenaAttackType === 2 || arenaAttackType === 3) baseInterval = 2200; if (arenaAttackType === 6) baseInterval = 4000; if (arenaAttackType === 7) baseInterval = 2400; if (arenaAttackType === 8) baseInterval = 2800; if (arenaAttackType === 9) baseInterval = 3400; if (arenaAttackType === 10) baseInterval = 2400;
    if (!isGERUniqueMixTraining()) {
        switch (arenaAttackType) { case 0: sfxWhiteWalls(); break; case 1: sfxBlueChaos(); break; case 2: sfxYellowSwords(); break; case 3: sfxRedTriangles(); break; case 4: sfxPinkKnockback(); break; case 5: sfxGreenHealSpawn(); break; case 6: sfxRainbowDeathSpawn(); break; case 7: sfxMixAttack(); break; case 8: sfxZoneAttack(); break; case 9: sfxBombTick(); break; case 10: sfxBlasterCharge(); break; default: sfxArenaAttackSpawn(); }
    }
    if (!isGERUniqueMixTraining() && (arenaAttackType < 11 || arenaAttackType > 20)) {
        arenaAttackInterval = setInterval(function() {
            if (arenaPhase === "dodge" && arenaActive && !(typeof _superState !== 'undefined' && (_superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0))) {
                spawnAttack();
                switch (arenaAttackType) {
                    case 9: sfxBombTick(); break;
                    case 10: sfxBlasterCharge(); break;
                    default: sfxWhoosh(); break;
                }
            }
        }, Math.max(800, baseInterval / arenaSpeedMult));
    } else {
        arenaAttackInterval = null;
    }
    var gerTrainingOptions = typeof window !== "undefined" && window.__mbGERTrainingMode ? window.__mbGERTrainingOptions || {} : null;
    var dodgeTime = gerTrainingOptions
        ? Math.max(1800, Math.floor((6500 + Math.random() * 1800) / Math.max(1, Math.min(5, Number(gerTrainingOptions.speedMultiplier) || 2))))
        : Math.floor(10000 + Math.random() * 6000);
    arenaDodgeTimer = Math.max(1, Math.ceil(dodgeTime / 1000));
    arenaDodgeTimerInterval = setInterval(function() { if (arenaPhase === "dodge" && arenaActive && !(typeof _superState !== 'undefined' && (_superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0))) { arenaDodgeTimer--; if (arenaDodgeTimer <= 0) arenaDodgeTimer = 0; updateDodgeTimerDisplay(); } }, 1000);
    updateDodgeTimerDisplay();
    // Остановка времени DIO должна останавливать и переход между фазами.
    // Старый setTimeout продолжал жить независимо от time stop и "съедал" его.
    arenaPhaseTimeout = setTimeout(function waitForDioStop() {
        if (arenaPhase !== "dodge" || !arenaActive) return;
        var stopped = typeof window.isDioTimeStopped === "function"
            ? window.isDioTimeStopped()
            : (typeof _superState !== "undefined" && (_superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0));
        if (stopped) {
            arenaPhaseTimeout = setTimeout(waitForDioStop, 50);
            return;
        }
        if (isGERUniqueMixTraining()) {
            var uniqueWait = Math.max(1200, Math.floor((6500 + Math.random() * 1800) /
                Math.max(1, Math.min(5, Number(window.__mbGERTrainingOptions.speedMultiplier) || 2))));
            arenaDodgeTimer = Math.max(1, Math.ceil(uniqueWait / 1000));
            updateDodgeTimerDisplay();
            arenaPhaseTimeout = setTimeout(waitForDioStop, uniqueWait);
            return;
        }
        if (arenaDodgeTimerInterval) {
            clearInterval(arenaDodgeTimerInterval);
            arenaDodgeTimerInterval = null;
        }
        startAttackPhase();
    }, dodgeTime);
}

function updateDodgeTimerDisplay() {
    if (isGERUniqueMixTraining() && arenaPhase === "dodge") {
        var uniqueTitle = document.getElementById("arenaBossName");
        if (uniqueTitle) uniqueTitle.innerText = "🧠 УНИКАЛЬНЫЙ МИКС · ВСЕ АТАКИ · " + arenaDodgeTimer + "с";
        var uniqueTimer = document.getElementById("arenaTimer");
        if (uniqueTimer) uniqueTimer.innerText = arenaDodgeTimer + "с";
        return;
    }
    if (arenaCurrentWave === 1500 && arenaPhase === "dodge") {
        var antiName = ["СПИРАЛЬНЫЙ ШТОРМ", "ВОЛНА ГОРИЗОНТА — ПРЫГАЙ!", "ДОЖДЬ СИНГУЛЯРНОСТЕЙ", "ГРАВИТАЦИОННЫЙ РАЗЛОМ"][antiSpiralActivePattern];
        var antiTitle = document.getElementById("arenaBossName");
        if (antiTitle) antiTitle.innerText = "АНТИ-СПИРАЛЬ — " + antiName + " | ↑ / W / SPACE — ПРЫЖОК | " + arenaDodgeTimer + "с";
        var antiTimer = document.getElementById("arenaTimer"); if (antiTimer) antiTimer.innerText = arenaDodgeTimer + "с";
        return;
    }
    var typeNames = {
        0: "⬜ СТЕНЫ", 1: "🔷 ХАОС", 2: "⚡ ЖЁЛТЫЕ", 3: "🛑 КРАСНЫЕ", 4: "💗 РОЗОВЫЕ",
        5: "💚 ЗЕЛЁНЫЕ", 6: "🌈 РАДУЖНЫЕ", 7: "⚡🛑 МИКС", 8: "🟥⬜ ЗОНЫ", 9: "💣 БОМБЫ", 10: "🔫 БЛАСТЕРЫ",
        11: "💥 АРТИЛЛЕРИЙСКИЙ ОБСТРЕЛ", 12: "🪢 ЖИВЫЕ ТРОСЫ", 13: "☣️ КИСЛОТНАЯ КАРТА",
        14: "🌪️ ШТОРМОВОЙ КОРИДОР", 15: "🪃 БУМЕРАНГИ-КОСЫ", 16: "🌋 РАСКОЛОТАЯ ЗЕМЛЯ",
        17: "🐙 ОХОТА ЩУПАЛЕЦ", 18: "⚙️ ШЕСТЕРЁНЧАТАЯ ПОГОНЯ", 19: "🌿 САД ШИПОВ", 20: "🦾 КЛЕШНИ-ПЕРЕХВАТЧИКИ"
    };
    var timerEl = document.getElementById("arenaTimer"); if (timerEl && arenaPhase === "dodge") timerEl.innerText = arenaDodgeTimer + "с";
    var bossNameEl = document.getElementById("arenaBossName"); if (bossNameEl && arenaPhase === "dodge") bossNameEl.innerText = arenaBoss + " — " + (typeNames[arenaAttackType] || "Атака") + " | ⚡" + heartSpeed.toFixed(2) + " | ⏱️" + arenaDodgeTimer + "с";
}

function startAttackPhase() {
    if (arenaDodgeTimerInterval) { clearInterval(arenaDodgeTimerInterval); arenaDodgeTimerInterval = null; }
    if (wallWarningTimer) { clearTimeout(wallWarningTimer); wallWarningTimer = null; }
    arenaPhase = "attack"; arenaExtendedState = null; attacks = []; arenaBlasters = []; wallGapIndicator = null; arenaClickTargets = []; arenaClicksHit = 0;
    arenaTotalTargets = 4 + Math.floor(arenaSpeedMult * 0.8);
    if (typeof _superState !== 'undefined' && _superState.dandyDoubleTargets) { arenaTotalTargets *= 2; _superState.dandyDoubleTargets = false; }
    arenaAttackTimeLeft = 2;
    if (arenaAttackInterval) { clearInterval(arenaAttackInterval); arenaAttackInterval = null; }
    document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)";
    var timerEl = document.getElementById("arenaTimer"); if (timerEl) timerEl.innerText = arenaAttackTimeLeft + "с";
    playArenaSound(200, 'square', 0.3, 0.08); setTimeout(function() { playArenaSound(300, 'square', 0.2, 0.06); }, 100);
    var usedPositions = [];
    for (var i = 0; i < arenaTotalTargets; i++) { var x, y, tooClose, attempts = 0; do { x = 40 + Math.random() * 320; y = 80 + Math.random() * 340; tooClose = false; for (var p of usedPositions) { if (Math.sqrt((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y)) < 60) { tooClose = true; break; } } attempts++; } while (tooClose && attempts < 50); usedPositions.push({ x: x, y: y }); arenaClickTargets.push({ x: x, y: y, radius: 26, hit: false, pulse: Math.random() * Math.PI * 2 }); }
    var attackTimer = setInterval(function() { if (typeof _superState !== 'undefined' && (_superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0)) return; arenaAttackTimeLeft--; document.getElementById("arenaBossName").innerText = arenaBoss + " — ⚡ БЕЙ! (" + arenaAttackTimeLeft + "с)"; var timerEl = document.getElementById("arenaTimer"); if (timerEl) timerEl.innerText = arenaAttackTimeLeft + "с"; playArenaSound(1000, 'square', 0.05, 0.02); if (arenaAttackTimeLeft <= 0) { clearInterval(attackTimer); applyArenaDamage(); } }, 1000);
}

function applyArenaDamage() {
    if (!arenaActive) return;
    var dmgMult = 0; var ratio = arenaClicksHit / arenaTotalTargets;
    // Хорошая атака повышает уверенность, плохая — снижает.
    if (typeof adjustTakabaConfidence === 'function' && typeof _superState !== 'undefined' &&
        (typeof hasTakaba !== 'function' || hasTakaba())) {
        try {
            var confidenceDelta = ratio >= 1 ? 5 : ratio >= 0.8 ? 2 : ratio >= 0.6 ? 0 : ratio >= 0.4 ? -8 : ratio > 0 ? -15 : -20;
            adjustTakabaConfidence(confidenceDelta, true);
        } catch(e) {}
    }
    if (ratio >= 1.0) { dmgMult = 2.5; arenaComboText = "🔥 ИДЕАЛЬНО! x2.5"; sfxArenaPerfect(); }
    else if (ratio >= 0.8) { dmgMult = 1.8; arenaComboText = "⚡ ОТЛИЧНО! x1.8"; sfxArenaPerfect(); }
    else if (ratio >= 0.6) { dmgMult = 1.3; arenaComboText = "✨ ХОРОШО! x1.3"; sfxArenaTargetHit(); }
    else if (ratio >= 0.4) { dmgMult = 1.0; arenaComboText = "👍 КЛАССИКА! x1.0"; }
    else if (ratio >= 0.2) { dmgMult = 0.6; arenaComboText = "💤 СЛАБОВАТО... x0.6"; sfxArenaFailAttack(); }
    else if (ratio > 0.0) { dmgMult = 0.2; arenaComboText = "🥱 ПОЧТИ МИМО... x0.2"; sfxArenaFailAttack(); }
    else { dmgMult = 0.0; arenaComboText = "❌ ПРОМАХ! x0"; sfxArenaMiss(); }
    arenaComboTimer = 55;
    var baseDmg = typeof window !== 'undefined' && window.playerFinalDamage ? window.playerFinalDamage : 20;
    var finalDmg = Math.floor(baseDmg * dmgMult);
    if (typeof _superState !== 'undefined') {
        if (_superState.dekusDmgMult && _superState.dekusDmgMult > 1) finalDmg = Math.floor(finalDmg * _superState.dekusDmgMult);
        if (_superState.nikaDmgMult && _superState.nikaDmgMult > 1) finalDmg = Math.floor(finalDmg * _superState.nikaDmgMult);
        if (_superState.kaidoBuffActive && _superState.kaidoDmgBonus > 1) finalDmg = Math.floor(finalDmg * _superState.kaidoDmgBonus);
        if (_superState.garpHakiActive) finalDmg = Math.floor(finalDmg * 1.3);
        if (_superState.allmightDmgMult && _superState.allmightDmgMult > 1) finalDmg = Math.floor(finalDmg * _superState.allmightDmgMult);
        if (_superState.allmightDebuffActive && _superState.allmightDebuffDmgMult < 1) finalDmg = Math.floor(finalDmg * _superState.allmightDebuffDmgMult);
        if (_superState.allmightPermaSlow && _superState.allmightDebuffDmgMult < 1) finalDmg = Math.floor(finalDmg * _superState.allmightDebuffDmgMult);
        if (_superState.dandyDmgBuff && _superState.dandyDmgBuff.timer > 0) finalDmg = Math.floor(finalDmg * _superState.dandyDmgBuff.mult);
        if (_superState.markBuffActive && _superState.markDmgBonus > 1) finalDmg = Math.floor(finalDmg * _superState.markDmgBonus);
        if(typeof getTakabaCombatModifiers==="function"){try{finalDmg=Math.floor(finalDmg*getTakabaCombatModifiers().dmgMult);}catch(e){}}
        if (_superState.takabaDmgMult && _superState.takabaDmgMult > 1) finalDmg = Math.floor(finalDmg * _superState.takabaDmgMult);
    }
    if (typeof window.MBKarsApplyDamageBonus === "function") finalDmg = window.MBKarsApplyDamageBonus(finalDmg);
    if (typeof window !== "undefined" && window.__mbBossTestMode && typeof window.MBBossTestModifyOutgoingDamage === "function") {
        try { finalDmg = window.MBBossTestModifyOutgoingDamage(finalDmg, ratio); } catch(e) {}
    }
    // DIO OVER HEAVEN: quality hits add a modest amount; global rolling cap prevents instant charge.
    // Normal hit ~= 1.6 energy; perfect x2.5 hit = 4 energy.
    if (finalDmg > 0 && typeof isDioOverHeavenMain === "function" && isDioOverHeavenMain()) {
        dioAddEnergy(Math.min(4, 1.6 * dmgMult));
    }
    if (finalDmg > 0) {
        if (typeof adjustTakabaConfidence === "function" && typeof getTakabaLevel === "function" &&
            (typeof hasTakaba !== "function" || hasTakaba())) {
            try { if (getTakabaLevel(_superState.takabaConfidence || 0) >= 1) adjustTakabaConfidence(1, false); } catch(e) {}
        }
        if (!isJoystickTrainingMode()) arenaBossMaxHP -= finalDmg;
        arenaShake = 20; screenFlash = 10; screenFlashColor = "#ffdd00"; arenaShockwaves.push({ x: 200, y: 250, r: 15, v: 14, life: 22, maxLife: 22, color: "rgba(255,255,255,0.9)" }); for (var j = 0; j < 30; j++) { var angle = Math.random() * Math.PI * 2; arenaParticles.push({ x: 200, y: 250, vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10, life: 35, maxLife: 35, color: "#ffdd00", size: 2 + Math.random() * 5 }); } }
    setTimeout(function() { if (arenaBossMaxHP <= 0) { sfxArenaVictory(); winArena(); return; } startDodgePhase(); }, 1500);
}

function spawnBlaster(w) {
    var bossW = arenaCurrentWave; var isRainbow = Math.random() < 0.05 && bossW >= 800;
    var colors = ["#fff", "#ffdd00", "#ff3333"]; var bColor = isRainbow ? "rainbow" : colors[Math.floor(Math.random() * colors.length)];
    var side = Math.floor(Math.random() * 4); var x, y;
    if (side === 0) { x = Math.random() * 400; y = -30; } else if (side === 1) { x = Math.random() * 400; y = 530; } else if (side === 2) { x = -30; y = Math.random() * 500; } else { x = 430; y = Math.random() * 500; }
    arenaBlasters.push({ x: x, y: y, angle: Math.atan2(heart.y - y, heart.x - x), color: bColor, state: "aiming", timer: 70, width: isRainbow ? 15 : 30, hasHit: false });
    sfxBlasterCharge();
}

function shrinkAttack(a) { if (a.size) a.size *= 0.7; if (a.radius) a.radius *= 0.7; if (a.spd) a.spd *= 0.7; if (a.spdY) a.spdY *= 0.7; if (a.width) a.width *= 0.7; }

function spawnWallAttack(isEarly, dmg, shouldShrink) {
    var isVertical = Math.random() > 0.5;
    var wallSeriesCount = 1;
    if (wallCountMult >= 1.3) wallSeriesCount = 2;
    if (wallCountMult >= 1.7) wallSeriesCount = 3;
    var wallSpeed = wallSpeedMult;
    var gapSize = 90 + Math.random() * 30;
    var gapCenter;
    if (isVertical) {
        var minGap = gapSize / 2 + 15;
        var maxGap = 500 - gapSize / 2 - 15;
        var desired = heart.y + (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 60);
        gapCenter = Math.max(minGap, Math.min(maxGap, desired));
    } else {
        var minGapH = gapSize / 2 + 15;
        var maxGapH = 400 - gapSize / 2 - 15;
        var desiredH = heart.x + (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 60);
        gapCenter = Math.max(minGapH, Math.min(maxGapH, desiredH));
    }
    if (isVertical) {
        wallGapIndicator = { x: 0, y: gapCenter, w: 30, h: gapSize, life: 70, vertical: true, arrowFromX: heart.x, arrowFromY: heart.y, arrowToX: 200, arrowToY: gapCenter };
    } else {
        wallGapIndicator = { x: gapCenter, y: 0, w: gapSize, h: 30, life: 70, vertical: false, arrowFromX: heart.x, arrowFromY: heart.y, arrowToX: gapCenter, arrowToY: 250 };
    }
    playArenaSound(400, 'sine', 0.15, 0.06);
    setTimeout(function() { playArenaSound(500, 'sine', 0.1, 0.04); }, 150);
    wallWarningTimer = setTimeout(function() {
        if (arenaPhase !== "dodge" || !arenaActive) return;
        for (var seriesIdx = 0; seriesIdx < wallSeriesCount; seriesIdx++) {
            (function(idx) {
                var seriesDelay = idx * 500;
                setTimeout(function() {
                    if (arenaPhase !== "dodge" || !arenaActive) return;
                    if (isVertical) {
                        var startX = Math.random() > 0.5 ? -30 : 430;
                        var dirX = startX < 0 ? 3.0 * wallSpeed : -3.0 * wallSpeed;
                        for (var i = 10; i < 490; i += 22) {
                            if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                            var atk = { type: "square", x: startX, y: i, size: 24, spd: dirX, spdY: 0, color: "#fff", damage: dmg, bouncesLeft: 0 };
                            if (shouldShrink) shrinkAttack(atk);
                            attacks.push(atk);
                        }
                    } else {
                        var startY = Math.random() > 0.5 ? -30 : 530;
                        var dirY = startY < 0 ? 2.4 * wallSpeed : -2.4 * wallSpeed;
                        for (var i = 10; i < 390; i += 22) {
                            if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                            var atk = { type: "square", x: i, y: startY, size: 24, spd: 0, spdY: dirY, color: "#fff", damage: dmg, bouncesLeft: 0 };
                            if (shouldShrink) shrinkAttack(atk);
                            attacks.push(atk);
                        }
                    }
                    if (wallGapIndicator) { wallGapIndicator.arrowToX = undefined; wallGapIndicator.arrowToY = undefined; wallGapIndicator.life = 40; }
                    playArenaSound(200, 'sawtooth', 0.3, 0.08);
                }, seriesDelay);
            })(seriesIdx);
        }
    }, 1000);
}


function arenaExtLineDistance(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var lenSq = dx * dx + dy * dy;
    if (lenSq <= 0.001) return Math.hypot(px - x1, py - y1);
    var u = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.hypot(px - (x1 + u * dx), py - (y1 + u * dy));
}

function arenaExtDrawSegment(x1, y1, x2, y2, width, color, alpha, dashed) {
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = width > 9 ? 9 : 4;
    if (dashed) ctx.setLineDash([8, 7]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

var __mbArenaExtDamageActions = { wave: null, map: Object.create(null) };
function arenaExtDamageAction(key, shape) {
    var waveKey = String(typeof arenaCurrentWave !== "undefined" ? arenaCurrentWave : "arena");
    if (__mbArenaExtDamageActions.wave !== waveKey) {
        __mbArenaExtDamageActions.wave = waveKey;
        __mbArenaExtDamageActions.map = Object.create(null);
    }
    var id = String(key);
    var action = __mbArenaExtDamageActions.map[id] || (__mbArenaExtDamageActions.map[id] = {});
    Object.keys(shape || {}).forEach(function (k) { action[k] = shape[k]; });
    action._mbDamageActionKey = id;
    return action;
}

function arenaExtHitSegment(x1, y1, x2, y2, width, damage, label) {
    if (invulnTimer > 0 || (typeof _superState !== "undefined" && (
        _superState.takabaTimeStop || _superState.garouTimeStop ||
        _superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0
    ))) return;
    if (arenaExtLineDistance(heart.x, heart.y, x1, y1, x2, y2) < width / 2 + heart.hitbox) {
        applyHit(damage, label, false, false, arenaExtDamageAction("segment:" + label + ":" + [x1,y1,x2,y2].join(","), {x1:x1,y1:y1,x2:x2,y2:y2,width:width,damage:damage,type:"segment"}));
    }
}

function arenaExtDrawGear(x, y, radius, rotation, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color; ctx.strokeStyle = "#fff0cf"; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.beginPath();
    for (var i = 0; i < 16; i++) {
        var a = i * Math.PI / 8;
        var r = i % 2 === 0 ? radius : radius * 0.78;
        var px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = "#31251c"; ctx.beginPath(); ctx.arc(0, 0, radius * 0.46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff0cf"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-radius * 0.3, 0); ctx.lineTo(radius * 0.3, 0); ctx.moveTo(0, -radius * 0.3); ctx.lineTo(0, radius * 0.3); ctx.stroke();
    ctx.restore();
}

function arenaExtNewEdge(side, inset) {
    var pad = inset || 8;
    if (side === 0) return { x: pad, y: 65 + Math.random() * 365 };
    if (side === 1) return { x: 400 - pad, y: 65 + Math.random() * 365 };
    if (side === 2) return { x: 35 + Math.random() * 330, y: 55 + pad };
    return { x: 35 + Math.random() * 330, y: 500 - pad };
}

function arenaExtTouchCooldown(st,key,now,interval){if(!st._touchTimes)st._touchTimes={};if(now<Number(st._touchTimes[key]||0))return false;st._touchTimes[key]=now+interval;return true;}
function arenaExtPushHeart(x,y,power,lift){var dx=heart.x-x,dy=heart.y-y,len=Math.max(1,Math.hypot(dx,dy));heart.vx=(heart.vx||0)+dx/len*power;heart.vy=(heart.vy||0)+dy/len*power-(lift||0);}
function arenaExtLineTouchesHeart(x1,y1,x2,y2,width){var dx=x2-x1,dy=y2-y1,den=dx*dx+dy*dy,u=den?Math.max(0,Math.min(1,((heart.x-x1)*dx+(heart.y-y1)*dy)/den)):0;return Math.hypot(heart.x-(x1+u*dx),heart.y-(y1+u*dy))<width+heart.hitbox;}
function updateExtendedArenaAttack(now) {
    var st = arenaExtendedState;
    if (!st || st.type < 11 || st.type > 20 || !arenaActive || arenaPhase !== "dodge" || arenaCurrentWave === 1500) return;

    var delta = Math.max(0, Math.min(50, now - (st.lastNow || now)));
    st.lastNow = now;
    var frozen = typeof _superState !== "undefined" && (
        _superState.takabaTimeStop || _superState.garouTimeStop ||
        _superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0
    );
    if (!frozen) st.elapsed += delta;
    var t = st.elapsed;
    var wasMultiHit = !!st._multiHitActive;
    st._multiHitActive = false;
    var sec = t / 1000;
    var dmg = Math.max(1, Math.floor((arenaBaseDmg || 5) * 1.78));
    var strongDmg = Math.max(1, Math.floor((arenaBaseDmg || 5) * 2.35));
    var extWave = Math.max(1, Number(arenaCurrentWave) || 1);
    var extWaveDanger = 1 + Math.min(1.25, Math.max(0, extWave - 1) * 0.0125);
    var extImpactDamage = 2 * Math.max(1, 2 + Math.floor(Math.max(0, extWave - 1) / 20));
    var pulse = 0.5 + 0.5 * Math.sin(sec * 8);

    // 11. Артиллерийский залп: три пушки бьют одновременно, снаряды рикошетят и взрываются.
    if (st.type === 11) {
        if (t >= st.nextSpawnAt && st.hazards.length < 6) {
            var cannonSides = [0, 1, 2, 3];
            for (var csMix = cannonSides.length - 1; csMix > 0; csMix--) {
                var csSwap = Math.floor(Math.random() * (csMix + 1));
                var csTmp = cannonSides[csMix]; cannonSides[csMix] = cannonSides[csSwap]; cannonSides[csSwap] = csTmp;
            }
            for (var cs = 0; cs < 3; cs++) {
                var cannonSide = cannonSides[cs];
                var cannonX = cannonSide === 0 ? -24 : (cannonSide === 1 ? 424 : 28 + Math.random() * 344);
                var cannonY = cannonSide === 2 ? -24 : (cannonSide === 3 ? 524 : 78 + Math.random() * 394);
                var cannonTargetX = Math.max(28, Math.min(372, heart.x + (cs - 1) * 38));
                var cannonTargetY = Math.max(78, Math.min(478, heart.y + (cs === 0 ? -24 : (cs === 2 ? 24 : 0))));
                var cannonAngle = Math.atan2(cannonTargetY - cannonY, cannonTargetX - cannonX);
                var cannonId = ++st.sequence;
                st.hazards.push({
                    id:cannonId, x:cannonX, y:cannonY, angle:cannonAngle,
                    targetX:cannonTargetX, targetY:cannonTargetY,
                    age:0, phase:"aim", vx:0, vy:0, radius:14,
                    flightAge:0, entered:false, bounced:false, afterBounce:0,
                    explodedAt:0, blastHit:false
                });
            }
            st.nextSpawnAt = t + 2450;
        }

        var cannonFrameScale = Math.max(0, Math.min(3, delta / 16.667));
        for (var ci = st.hazards.length - 1; ci >= 0; ci--) {
            var shell = st.hazards[ci];
            if (!frozen) shell.age += delta;

            if (shell.phase === "aim" && shell.age >= 720) {
                shell.phase = "flight";
                var shellSpeed = 5.0 + 0.35 * Math.min(1, Math.max(0, extWave - 1100) / 1000);
                shell.vx = Math.cos(shell.angle) * shellSpeed;
                shell.vy = Math.sin(shell.angle) * shellSpeed;
                playArenaSound(105, "sawtooth", 0.18, 0.08);
            }

            if (shell.phase === "aim") {
                var lineEndX = shell.x + Math.cos(shell.angle) * 760;
                var lineEndY = shell.y + Math.sin(shell.angle) * 760;
                ctx.save();
                ctx.strokeStyle = "rgba(255,92,58,0.82)";
                ctx.lineWidth = 2.5;
                ctx.setLineDash([9, 6]);
                ctx.lineDashOffset = -now / 25;
                ctx.beginPath(); ctx.moveTo(shell.x, shell.y); ctx.lineTo(lineEndX, lineEndY); ctx.stroke();
                ctx.setLineDash([]);
                var aimPulse = 0.65 + Math.sin(now / 55) * 0.25;
                ctx.globalAlpha = aimPulse;
                ctx.strokeStyle = "#ffb36b"; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.arc(shell.targetX, shell.targetY, 17 + Math.sin(now / 70) * 4, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(shell.targetX - 11, shell.targetY); ctx.lineTo(shell.targetX + 11, shell.targetY);
                ctx.moveTo(shell.targetX, shell.targetY - 11); ctx.lineTo(shell.targetX, shell.targetY + 11);
                ctx.stroke();
                ctx.fillStyle = "#9caebd"; ctx.strokeStyle = "#fff0cf"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(shell.x, shell.y, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = "#ff7c45"; ctx.beginPath(); ctx.arc(shell.x, shell.y, 7, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            } else if (shell.phase === "flight") {
                if (!frozen) {
                    shell.x += shell.vx * cannonFrameScale;
                    shell.y += shell.vy * cannonFrameScale;
                    shell.flightAge += delta;
                    if (!shell.entered && shell.x >= 20 && shell.x <= 380 && shell.y >= 70 && shell.y <= 490) shell.entered = true;
                    if (shell.entered && !shell.bounced) {
                        var bouncedOnWall = false;
                        if (shell.x < 20 || shell.x > 380) {
                            shell.x = Math.max(20, Math.min(380, shell.x));
                            shell.vx *= -0.88;
                            bouncedOnWall = true;
                        }
                        if (shell.y < 70 || shell.y > 490) {
                            shell.y = Math.max(70, Math.min(490, shell.y));
                            shell.vy *= -0.88;
                            bouncedOnWall = true;
                        }
                        if (bouncedOnWall) {
                            shell.bounced = true;
                            shell.afterBounce = 0;
                        }
                    }
                    if (shell.bounced) {
                        shell.afterBounce += delta;
                    } else if (shell.flightAge >= 1450) {
                        // If the shell did not reach an arena edge, it ricochets once in mid-air.
                        var oldShellVX = shell.vx;
                        shell.vx = -shell.vy * 0.82;
                        shell.vy = oldShellVX * 0.82;
                        shell.bounced = true;
                        shell.afterBounce = 0;
                    }
                    if (shell.bounced && shell.afterBounce >= 470) {
                        shell.phase = "explode";
                        shell.explodedAt = t;
                        arenaShake = Math.max(arenaShake, 6);
                        playArenaSound(74, "sawtooth", 0.18, 0.08);
                        for (var ric = 0; ric < 7; ric++) {
                            var ricA = Math.random() * Math.PI * 2;
                            arenaParticles.push({x:shell.x,y:shell.y,vx:Math.cos(ricA)*(2+Math.random()*4),vy:Math.sin(ricA)*(2+Math.random()*4),life:15,maxLife:15,color:ric%2?"#ff9b45":"#fff0bd",size:2+Math.random()*2.5});
                        }
                    }
                }

                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                ctx.strokeStyle = "rgba(255,135,75,0.65)";
                ctx.lineWidth = 7;
                ctx.beginPath(); ctx.moveTo(shell.x - shell.vx * 4, shell.y - shell.vy * 4); ctx.lineTo(shell.x, shell.y); ctx.stroke();
                ctx.shadowColor = "#ff7138"; ctx.shadowBlur = 18;
                ctx.fillStyle = "#ff9a54"; ctx.beginPath(); ctx.arc(shell.x, shell.y, shell.radius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fff0c7"; ctx.beginPath(); ctx.arc(shell.x - 3, shell.y - 3, 4, 0, Math.PI * 2); ctx.fill();
                if (shell.bounced) {
                    ctx.strokeStyle = "#fff0bd"; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(shell.x, shell.y, 22 + Math.sin(now / 35) * 4, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.restore();

                if (!frozen && Math.hypot(heart.x - shell.x, heart.y - shell.y) < shell.radius + heart.hitbox) {
                    shell.phase = "explode";
                    shell.explodedAt = t;
                    shell.x = heart.x;
                    shell.y = heart.y;
                    shell.blastHit = false;
                    arenaShake = Math.max(arenaShake, 7);
                    playArenaSound(74, "sawtooth", 0.18, 0.08);
                }
            }

            if (shell.phase === "explode") {
                var explosionAge = Math.max(0, t - shell.explodedAt);
                var explosionProgress = Math.min(1, explosionAge / 340);
                var explosionRadius = 18 + explosionProgress * 86;
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                ctx.globalAlpha = Math.max(0, 1 - explosionProgress * 0.6);
                ctx.shadowColor = "#ff5b25"; ctx.shadowBlur = 24;
                var artilleryGrad = ctx.createRadialGradient(shell.x, shell.y, 1, shell.x, shell.y, explosionRadius);
                artilleryGrad.addColorStop(0, "#fffbd4");
                artilleryGrad.addColorStop(0.28, "#ffd15a");
                artilleryGrad.addColorStop(0.68, "#ff6428");
                artilleryGrad.addColorStop(1, "rgba(150,20,8,0)");
                ctx.fillStyle = artilleryGrad;
                ctx.beginPath(); ctx.arc(shell.x, shell.y, explosionRadius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "rgba(255,235,170,0.95)"; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(shell.x, shell.y, explosionRadius, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();

                if (!frozen && !shell.blastHit && explosionProgress > 0.12 &&
                    Math.hypot(heart.x - shell.x, heart.y - shell.y) < explosionRadius + heart.hitbox) {
                    shell.blastHit = true;
                    applyHit(extImpactDamage, "ВЗРЫВ АРТИЛЛЕРИЙСКОГО СНАРЯДА!", false, false,
                        arenaExtDamageAction("artillery-blast:" + shell.id, {type:"circle",x:shell.x,y:shell.y,radius:explosionRadius,damage:extImpactDamage}));
                    arenaExtPushHeart(shell.x, shell.y, 4.4, 1.3);
                }
                if (explosionAge >= 430) st.hazards.splice(ci, 1);
            }

            if (shell.age > 5000 || shell.x < -150 || shell.x > 550 || shell.y < -150 || shell.y > 650) {
                st.hazards.splice(ci, 1);
            }
        }
    }

    // 12. Живые тросы: парные стены идут с двух сторон, медленнее и с общим безопасным коридором.
    if (st.type === 12) {
        if (t >= st.nextSpawnAt && st.hazards.length < 4) {
            var cablePhase = Math.random() * Math.PI * 2;
            var cableBorn = t;
            var cableGap = 132;
            st.hazards.push({
                id:++st.sequence, x:-76, dir:1, born:cableBorn, phase:cablePhase,
                gapSize:cableGap, speed:2.05 + Math.min(0.45, extWaveDanger - 1) * 0.35,
                warningUntil:cableBorn + 720, lastHitAt:-1000
            });
            st.hazards.push({
                id:++st.sequence, x:476, dir:-1, born:cableBorn, phase:cablePhase,
                gapSize:cableGap, speed:2.05 + Math.min(0.45, extWaveDanger - 1) * 0.35,
                warningUntil:cableBorn + 720, lastHitAt:-1000
            });
            st.nextSpawnAt = t + 2700;
        }

        var movingWallFrameScale = Math.max(0, Math.min(3, delta / 16.667));
        for (var wi2 = st.hazards.length - 1; wi2 >= 0; wi2--) {
            var movingWall = st.hazards[wi2];
            var wallAge = Math.max(0, t - movingWall.born);
            var movingGapCenter = 250 + Math.sin(wallAge / 1050 + movingWall.phase) * 105;
            var movingGapTop = movingGapCenter - movingWall.gapSize / 2;
            var movingGapBottom = movingGapCenter + movingWall.gapSize / 2;
            var cableWarning = t < movingWall.warningUntil;

            if (!frozen && !cableWarning) movingWall.x += movingWall.dir * movingWall.speed * movingWallFrameScale;

            if (cableWarning) {
                var warningX = movingWall.dir > 0 ? 7 : 393;
                ctx.save();
                ctx.globalAlpha = 0.4 + Math.abs(Math.sin(now / 90)) * 0.35;
                ctx.strokeStyle = "#9affd5"; ctx.lineWidth = 3; ctx.setLineDash([9, 6]);
                ctx.beginPath(); ctx.moveTo(warningX, 62); ctx.lineTo(warningX, 493); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = "rgba(70,255,190,0.12)";
                ctx.fillRect(warningX - 9, movingGapTop, 18, movingWall.gapSize);
                ctx.strokeStyle = "#7dffcb"; ctx.lineWidth = 2;
                ctx.strokeRect(warningX - 13, movingGapTop, 26, movingWall.gapSize);
                ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#caffed";
                ctx.fillText("ТРОСЫ", warningX, 52);
                ctx.restore();
            } else {
                ctx.save();
                ctx.shadowColor = "#dceeff"; ctx.shadowBlur = 12;
                ctx.fillStyle = "#f4f8ff"; ctx.strokeStyle = "#aab9cb"; ctx.lineWidth = 2;
                ctx.fillRect(movingWall.x - 13, 55, 26, Math.max(0, movingGapTop - 55));
                ctx.strokeRect(movingWall.x - 13, 55, 26, Math.max(0, movingGapTop - 55));
                ctx.fillRect(movingWall.x - 13, movingGapBottom, 26, Math.max(0, 500 - movingGapBottom));
                ctx.strokeRect(movingWall.x - 13, movingGapBottom, 26, Math.max(0, 500 - movingGapBottom));
                ctx.shadowBlur = 0;
                ctx.strokeStyle = "rgba(90,115,145,0.65)"; ctx.lineWidth = 1;
                for (var seamY = 70; seamY < 490; seamY += 18) {
                    if (seamY > movingGapTop - 4 && seamY < movingGapBottom + 4) continue;
                    ctx.beginPath(); ctx.moveTo(movingWall.x - 12, seamY); ctx.lineTo(movingWall.x + 12, seamY); ctx.stroke();
                }
                ctx.strokeStyle = "rgba(90,235,170,0.95)"; ctx.lineWidth = 2.5;
                ctx.setLineDash([5, 4]);
                ctx.strokeRect(movingWall.x - 17, movingGapTop, 34, movingWall.gapSize);
                ctx.setLineDash([]);
                ctx.restore();

                var wallCrossing = Math.abs(heart.x - movingWall.x) < 13 + heart.hitbox;
                var playerInsideMovingGap = heart.y > movingGapTop + heart.hitbox + 3 &&
                    heart.y < movingGapBottom - heart.hitbox - 3;
                if (!frozen && wallCrossing && !playerInsideMovingGap &&
                    now - movingWall.lastHitAt >= 620 && invulnTimer <= 0) {
                    movingWall.lastHitAt = now;
                    applyHit(extImpactDamage, "ЖИВЫЕ ТРОСЫ!", false, false,
                        arenaExtDamageAction("moving-wall:" + movingWall.id, {
                            type:"rect",x:movingWall.x-13,y:heart.y-16,width:26,height:32,damage:extImpactDamage
                        }));
                    heart.vx += movingWall.dir * 1.6;
                }
            }
            if ((movingWall.dir > 0 && movingWall.x > 455) || (movingWall.dir < 0 && movingWall.x < -55)) {
                st.hazards.splice(wi2, 1);
            }
        }
        ctx.save();
        ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
        ctx.fillStyle = "rgba(220,238,255,0.88)";
        ctx.fillText("ЖИВЫЕ ТРОСЫ · ДВЕ СТОРОНЫ · ПРОХОД ДВИГАЕТСЯ", 200, 82);
        ctx.restore();
    }

    // 13. Flowing acid: pour, spread, merge with nearby puddles, then evaporate.
    if (st.type === 13) {
        if (t >= st.nextSpawnAt && st.hazards.length < 10) {
            var acidEdge = Math.floor(Math.random() * 4), acidSX, acidSY;
            if (acidEdge === 0) { acidSX = 20 + Math.random() * 360; acidSY = 65; }
            else if (acidEdge === 1) { acidSX = 20 + Math.random() * 360; acidSY = 490; }
            else if (acidEdge === 2) { acidSX = 8; acidSY = 85 + Math.random() * 390; }
            else { acidSX = 392; acidSY = 85 + Math.random() * 390; }
            var acidTX = 35 + Math.random() * 330, acidTY = 105 + Math.random() * 340;
            st.hazards.push({
                x: acidTX, y: acidTY, sourceX: acidSX, sourceY: acidSY, born: t,
                r: 3, targetR: 38 + Math.random() * 20,
                flowAngle: Math.atan2(acidTY - acidSY, acidTX - acidSX),
                elongation: 0.08, phase: Math.random() * Math.PI * 2
            });
            st.nextSpawnAt = t + Math.max(340, 850 / extWaveDanger);
        }
        for (var ai = st.hazards.length - 1; ai >= 0; ai--) {
            var pool = st.hazards[ai], age = t - pool.born;
            if (age > 16000) { st.hazards.splice(ai, 1); continue; }
            var pouring = age < 760, spreading = age >= 760 && age < 1600, fading = age > 14000;
            if (!frozen) {
                if (pouring) pool.r = Math.min(pool.targetR * 0.62, pool.r + delta * 0.052);
                else if (spreading) pool.r = Math.min(pool.targetR, pool.r + delta * 0.025);
                else if (fading) pool.r = Math.max(0, pool.r - delta * 0.014);
                if (!fading && age > 900 && age < 5200) {
                    pool.x += Math.cos(pool.flowAngle || 0) * delta * 0.0022;
                    pool.y += Math.sin(pool.flowAngle || 0) * delta * 0.0018;
                }
            }
            if (!frozen) for (var aj = ai - 1; aj >= 0; aj--) {
                var other = st.hazards[aj];
                if (Math.hypot(pool.x - other.x, pool.y - other.y) < pool.r + other.r - 2) {
                    var mergeDX = other.x - pool.x, mergeDY = other.y - pool.y;
                    var areaA = pool.r * pool.r, areaB = other.r * other.r, areaTotal = Math.max(1, areaA + areaB);
                    var mergedRadius = Math.sqrt(areaTotal);
                    pool.x = (pool.x * areaA + other.x * areaB) / areaTotal;
                    pool.y = (pool.y * areaA + other.y * areaB) / areaTotal;
                    pool.r = Math.min(130, mergedRadius);
                    pool.targetR = Math.min(130, Math.max(pool.targetR, other.targetR, pool.r));
                    pool.flowAngle = Math.atan2(mergeDY, mergeDX);
                    pool.elongation = Math.min(0.48, Math.max(pool.elongation || 0, other.elongation || 0) + 0.12);
                    pool.born = Math.min(pool.born, other.born);
                    st.hazards.splice(aj, 1); ai--;
                }
            }
            ctx.save();
            ctx.globalAlpha = fading ? Math.max(0.08, (16000 - age) / 2000) : (pouring ? 0.72 : 0.94);
            if (pouring) {
                var streamMidX = (pool.sourceX + pool.x) * 0.5 + Math.sin(sec * 3.1 + pool.phase) * 15;
                var streamMidY = (pool.sourceY + pool.y) * 0.5 + Math.cos(sec * 2.7 + pool.phase) * 12;
                ctx.lineCap = "round";
                ctx.beginPath(); ctx.moveTo(pool.sourceX, pool.sourceY); ctx.quadraticCurveTo(streamMidX, streamMidY, pool.x, pool.y);
                ctx.strokeStyle = "#194617"; ctx.lineWidth = 11; ctx.shadowColor = "#65ff35"; ctx.shadowBlur = 12; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(pool.sourceX, pool.sourceY); ctx.quadraticCurveTo(streamMidX, streamMidY, pool.x, pool.y);
                ctx.strokeStyle = "#72dc32"; ctx.lineWidth = 6; ctx.shadowBlur = 4; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(pool.sourceX, pool.sourceY); ctx.quadraticCurveTo(streamMidX, streamMidY, pool.x, pool.y);
                ctx.strokeStyle = "rgba(224,255,150,0.8)"; ctx.lineWidth = 1.7; ctx.shadowBlur = 0; ctx.stroke();
                for (var dropA = 0; dropA < 7; dropA++) {
                    var dropU = (age * 0.00125 + dropA * 0.143) % 1;
                    var dropV = 1 - dropU;
                    var dropX = dropV * dropV * pool.sourceX + 2 * dropV * dropU * streamMidX + dropU * dropU * pool.x;
                    var dropY = dropV * dropV * pool.sourceY + 2 * dropV * dropU * streamMidY + dropU * dropU * pool.y;
                    ctx.beginPath(); ctx.ellipse(dropX + Math.sin(sec * 7 + dropA) * 2, dropY, 1.5 + (dropA % 3) * 0.7, 2.2 + (dropA % 2), sec + dropA, 0, Math.PI * 2);
                    ctx.fillStyle = dropA % 2 ? "#a8ff55" : "#e4ff9b"; ctx.fill();
                }
            }
            // Irregular pool edge and translucent, layered green chemistry rather than a flat circle.
            ctx.beginPath();
            for (var aq = 0; aq <= 48; aq++) {
                var acidA = aq / 48 * Math.PI * 2;
                var acidWobble = 1
                    + Math.sin(acidA * 3 + sec * 1.15 + pool.phase) * 0.065
                    + Math.sin(acidA * 7 - sec * 1.8 + pool.phase) * 0.038
                    + Math.sin(acidA * 11 + pool.phase) * 0.018
                    + Math.cos(acidA - (pool.flowAngle || 0)) * (pool.elongation || 0);
                var acidPX = pool.x + Math.cos(acidA) * pool.r * acidWobble;
                var acidPY = pool.y + Math.sin(acidA) * pool.r * acidWobble * 0.78;
                if (!aq) ctx.moveTo(acidPX, acidPY); else ctx.lineTo(acidPX, acidPY);
            }
            ctx.closePath();
            var acidGradient = ctx.createRadialGradient(pool.x - pool.r * 0.24, pool.y - pool.r * 0.23, Math.max(1, pool.r * 0.04), pool.x, pool.y, pool.r * 1.2);
            acidGradient.addColorStop(0, "#c8ff78");
            acidGradient.addColorStop(0.24, "#79df36");
            acidGradient.addColorStop(0.62, "#419e25");
            acidGradient.addColorStop(0.88, "#255b1b");
            acidGradient.addColorStop(1, "#183a12");
            ctx.fillStyle = acidGradient; ctx.strokeStyle = "#9af34d"; ctx.lineWidth = 2;
            ctx.shadowColor = "#70ff2b"; ctx.shadowBlur = 9; ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0; ctx.globalAlpha *= 0.55;
            for (var ripple = 0; ripple < 3; ripple++) {
                var rippleR = pool.r * (0.18 + ripple * 0.21) + ((sec * (9 + ripple * 2) + ripple * 13 + pool.phase) % Math.max(8, pool.r * 0.16));
                ctx.beginPath();
                ctx.ellipse(pool.x + Math.sin(sec * 1.2 + ripple + pool.phase) * pool.r * 0.08,
                    pool.y + Math.cos(sec * 1.4 + ripple) * pool.r * 0.04,
                    Math.min(pool.r * 0.88, rippleR), Math.min(pool.r * 0.48, rippleR * 0.36),
                    (pool.flowAngle || 0) + Math.sin(sec + ripple) * 0.13, 0, Math.PI * 2);
                ctx.strokeStyle = ripple === 2 ? "#d8ff85" : "#326c1d"; ctx.lineWidth = ripple === 2 ? 1.5 : 2.5; ctx.stroke();
            }
            ctx.globalAlpha *= 1.6;
            for (var bubbleA = 0; bubbleA < 7; bubbleA++) {
                var bubbleAngle = sec * (0.55 + bubbleA * 0.035) + pool.phase + bubbleA * 2.399;
                var bubbleDist = pool.r * (0.17 + (bubbleA % 3) * 0.16);
                var bubbleX = pool.x + Math.cos(bubbleAngle) * bubbleDist;
                var bubbleY = pool.y + Math.sin(bubbleAngle * 1.13) * bubbleDist * 0.5;
                var bubbleRadius = 2 + (bubbleA % 3) * 0.85 + (0.5 + 0.5 * Math.sin(sec * 3 + bubbleA + pool.phase)) * 1.3;
                ctx.beginPath(); ctx.arc(bubbleX, bubbleY, bubbleRadius, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(24,65,12,0.78)"; ctx.fill();
                ctx.beginPath(); ctx.arc(bubbleX - bubbleRadius * 0.28, bubbleY - bubbleRadius * 0.32, Math.max(0.7, bubbleRadius * 0.27), 0, Math.PI * 2);
                ctx.fillStyle = "rgba(226,255,163,0.9)"; ctx.fill();
            }
            for (var foamA = 0; foamA < 9; foamA++) {
                var foamAngle = foamA / 9 * Math.PI * 2 + sec * 0.18 + pool.phase;
                var foamW = 1 + Math.sin(sec * 2 + foamA) * 0.025;
                ctx.beginPath(); ctx.arc(pool.x + Math.cos(foamAngle) * pool.r * foamW, pool.y + Math.sin(foamAngle) * pool.r * 0.78 * foamW,
                    1.4 + (foamA % 3) * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = "#d8ff8b"; ctx.fill();
            }
            ctx.restore();
            if (!frozen && !pouring && pool.r > 10 && Math.hypot(heart.x - pool.x, heart.y - pool.y) < pool.r + heart.hitbox) {
                st._multiHitActive = true;
                if (arenaExtTouchCooldown(st, "acid_" + pool.born, now, 240)) applyHit(extImpactDamage, "КИСЛОТА: РАЗЪЕДАЕТ!", false, true, arenaExtDamageAction("acid:"+pool.born,{type:"acid",x:pool.x,y:pool.y,radius:pool.r,damage:extImpactDamage}));
            }
        }
    }
    // 14. Штормовой коридор: ветер несёт обломки зданий, деревьев, машин и металла.
    if (st.type === 14) {
        var dirs = [{x:1,y:0.12},{x:-1,y:-0.12}];
        var windStage = Math.min(2, Math.floor(t / 3000));
        var di = Math.floor(t / 3000) % dirs.length, dir = dirs[di];
        if (st.gustIndex !== di) { st.gustIndex = di; st.nextSpawnAt = Math.min(st.nextSpawnAt, t); }
        var gustPulse = (windStage === 0 ? 0.065 : (windStage === 1 ? 0.09 : 0.12)) * Math.min(1.25, extWaveDanger);
        if (!frozen) {
            heart.vx += dir.x * gustPulse;
            heart.vy += dir.y * gustPulse;
            heart.vx = Math.max(-7, Math.min(7, heart.vx));
            heart.vy = Math.max(-7, Math.min(7, heart.vy));
        }

        if (t >= st.nextSpawnAt && st.hazards.length < 6) {
            var debrisSide = dir.x > 0 ? 0 : 1;
            var debrisSize = 12 + Math.random() * 7;
            var debrisKindRoll = Math.random();
            var debrisKind = debrisKindRoll < 0.28 ? "building" :
                (debrisKindRoll < 0.53 ? "tree" : (debrisKindRoll < 0.78 ? "car" : "metal"));
            var debrisX = debrisSide === 0 ? -45 : 445;
            var debrisY = 85 + Math.random() * 390;
            var debrisSpeed = (3.0 + windStage * 0.55 + Math.random() * 0.9) * Math.min(1.25, extWaveDanger);
            var debrisExplosive = debrisKind !== "tree" && (debrisKind === "car" ? Math.random() < 0.52 : (debrisKind === "metal" ? Math.random() < 0.4 : Math.random() < 0.16));
            var debrisId = ++st.sequence;
            st.hazards.push({
                id:debrisId, kind:debrisKind, x:debrisX, y:debrisY,
                vx:dir.x * debrisSpeed, vy:dir.y * debrisSpeed + (Math.random() - 0.5) * 0.55,
                size:debrisSize, radius:debrisKind === "car" ? debrisSize * 1.3 : debrisSize,
                born:t, rot:(Math.random() - 0.5) * 0.9, hit:false,
                explosive:debrisExplosive, fuse:980 + Math.random() * 260,
                phase:"flying", blastHit:false, explodedAt:0
            });
            st.nextSpawnAt = t + Math.max(310, 500 - windStage * 45) / Math.min(1.2, extWaveDanger);
        }

        var stormFrameScale = Math.max(0, Math.min(3, delta / 16.667));
        ctx.save();
        ctx.fillStyle = "#d7f6ff"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
        ctx.fillText("ШТОРМОВОЙ ПОТОК " + (windStage + 1) + "/3", 200, 82);
        ctx.strokeStyle = "rgba(150,220,255,0.38)"; ctx.lineWidth = 2;
        for (var windLine = 0; windLine < 10; windLine++) {
            var windX = 28 + windLine * 38;
            var windY = 112 + ((windLine * 61 + Math.floor(sec * 15)) % 300);
            ctx.beginPath();
            ctx.moveTo(windX - dir.x * 16, windY - dir.y * 16);
            ctx.lineTo(windX + dir.x * 16, windY + dir.y * 16);
            ctx.stroke();
        }
        ctx.restore();

        for (var di2 = st.hazards.length - 1; di2 >= 0; di2--) {
            var debris = st.hazards[di2];
            if (!frozen && debris.phase === "flying") {
                debris.x += debris.vx * stormFrameScale;
                debris.y += debris.vy * stormFrameScale;
                debris.rot += 0.018 * stormFrameScale;
            }
            var debrisAge = t - debris.born;

            if (debris.phase === "flying") {
                if (debris.explosive && debrisAge >= debris.fuse) {
                    debris.phase = "explode";
                    debris.explodedAt = t;
                    sfxArenaBombExplosion();
                    arenaShake = Math.max(arenaShake, 9);
                }

                if (debris.phase === "flying") {
                    ctx.save();
                    ctx.translate(debris.x, debris.y);
                    ctx.rotate(debris.rot);
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 7;

                    if (debris.kind === "building") {
                        ctx.shadowColor = "#d7ad83";
                        ctx.fillStyle = "#8c7566"; ctx.strokeStyle = "#e8d1b7";
                        ctx.beginPath();
                        ctx.moveTo(-debris.size * 1.2, -debris.size * 0.55);
                        ctx.lineTo(-debris.size * 0.35, -debris.size);
                        ctx.lineTo(debris.size * 1.1, -debris.size * 0.65);
                        ctx.lineTo(debris.size * 0.85, debris.size * 0.8);
                        ctx.lineTo(-debris.size * 0.9, debris.size * 0.65);
                        ctx.closePath(); ctx.fill(); ctx.stroke();
                        ctx.strokeStyle = "rgba(245,225,200,0.7)";
                        ctx.beginPath(); ctx.moveTo(-debris.size * 0.45, -debris.size * 0.4); ctx.lineTo(debris.size * 0.55, debris.size * 0.35); ctx.stroke();
                    } else if (debris.kind === "tree") {
                        ctx.shadowColor = "#85c96a";
                        ctx.strokeStyle = "#704b2e"; ctx.lineWidth = Math.max(4, debris.size * 0.28);
                        ctx.beginPath(); ctx.moveTo(-debris.size, debris.size * 0.45); ctx.lineTo(debris.size, -debris.size * 0.35); ctx.stroke();
                        ctx.fillStyle = "#477b3c"; ctx.strokeStyle = "#a5df78"; ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.arc(-debris.size * 0.45, -debris.size * 0.25, debris.size * 0.72, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                        ctx.beginPath(); ctx.arc(debris.size * 0.38, -debris.size * 0.38, debris.size * 0.58, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                    } else if (debris.kind === "car") {
                        ctx.shadowColor = "#ffb36b";
                        ctx.fillStyle = "#a84c37"; ctx.strokeStyle = "#ffd0a4";
                        ctx.fillRect(-debris.size * 1.35, -debris.size * 0.42, debris.size * 2.7, debris.size * 0.84);
                        ctx.strokeRect(-debris.size * 1.35, -debris.size * 0.42, debris.size * 2.7, debris.size * 0.84);
                        ctx.fillStyle = "#8ec9db";
                        ctx.fillRect(-debris.size * 0.55, -debris.size * 0.72, debris.size * 1.15, debris.size * 0.5);
                        ctx.fillStyle = "#232a32";
                        ctx.beginPath(); ctx.arc(-debris.size * 0.78, debris.size * 0.42, debris.size * 0.25, 0, Math.PI * 2);
                        ctx.arc(debris.size * 0.78, debris.size * 0.42, debris.size * 0.25, 0, Math.PI * 2); ctx.fill();
                    } else {
                        ctx.shadowColor = debris.explosive ? "#ff6238" : "#a8d7ed";
                        ctx.fillStyle = debris.explosive ? "#a94a32" : "#667d8b";
                        ctx.strokeStyle = debris.explosive ? "#ffc17a" : "#d8efff";
                        ctx.fillRect(-debris.size * 1.5, -debris.size * 0.38, debris.size * 3, debris.size * 0.76);
                        ctx.strokeRect(-debris.size * 1.5, -debris.size * 0.38, debris.size * 3, debris.size * 0.76);
                        ctx.beginPath(); ctx.moveTo(-debris.size, 0); ctx.lineTo(debris.size, 0); ctx.stroke();
                    }
                    ctx.restore();

                    if (debris.explosive && debris.fuse - debrisAge < 520) {
                        ctx.save();
                        ctx.strokeStyle = "rgba(255,75,45," + (0.45 + 0.4 * Math.abs(Math.sin(now / 55))) + ")";
                        ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
                        ctx.beginPath(); ctx.arc(debris.x, debris.y, 54, 0, Math.PI * 2); ctx.stroke();
                        ctx.setLineDash([]); ctx.restore();
                    }

                    if (!frozen && !debris.hit &&
                        Math.hypot(heart.x - debris.x, heart.y - debris.y) < debris.radius + heart.hitbox) {
                        debris.hit = true;
                        applyHit(extImpactDamage, "УДАР ОБЛОМКОМ!", false, false,
                            arenaExtDamageAction("storm-debris:" + debris.id, {
                                type:"circle",x:debris.x,y:debris.y,radius:debris.radius,damage:extImpactDamage
                            }));
                        arenaExtPushHeart(debris.x, debris.y, 2.7, 0.8);
                        if (debris.explosive) {
                            debris.phase = "explode";
                            debris.explodedAt = t;
                            sfxArenaBombExplosion();
                        }
                    }
                }
            }

            if (debris.phase === "explode") {
                var explosionAge = Math.max(0, t - debris.explodedAt);
                var explosionProgress = Math.min(1, explosionAge / 420);
                var explosionRadius = 20 + explosionProgress * 82;
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                ctx.globalAlpha = Math.max(0, 1 - explosionProgress * 0.65);
                ctx.shadowColor = "#ff5b25"; ctx.shadowBlur = 20;
                var explosionGrad = ctx.createRadialGradient(debris.x, debris.y, 1, debris.x, debris.y, explosionRadius);
                explosionGrad.addColorStop(0, "#fff6c9");
                explosionGrad.addColorStop(0.35, "#ffad36");
                explosionGrad.addColorStop(0.75, "#f04a1d");
                explosionGrad.addColorStop(1, "rgba(150,20,8,0)");
                ctx.fillStyle = explosionGrad;
                ctx.beginPath(); ctx.arc(debris.x, debris.y, explosionRadius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "rgba(255,230,170,0.95)"; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(debris.x, debris.y, explosionRadius, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();

                if (!frozen && !debris.blastHit &&
                    Math.hypot(heart.x - debris.x, heart.y - debris.y) < explosionRadius + heart.hitbox) {
                    debris.blastHit = true;
                    applyHit(extImpactDamage, "ВЗРЫВ ОБЛОМКА!", false, false,
                        arenaExtDamageAction("storm-blast:" + debris.id, {
                            type:"circle",x:debris.x,y:debris.y,radius:explosionRadius,damage:extImpactDamage
                        }));
                    arenaExtPushHeart(debris.x, debris.y, 4.2, 1.1);
                }
                if (explosionAge >= 470) st.hazards.splice(di2, 1);
            }

            if (debris.phase === "flying" &&
                (debris.x < -90 || debris.x > 490 || debris.y < -80 || debris.y > 580)) {
                st.hazards.splice(di2, 1);
            }
        }
    }

    // 15. Бумеранги-косы: три тяжёлых вращающихся клинка режут широкую дугу и возвращаются.
    if (st.type === 15) {
        if (st.hazards.length === 0 && t >= st.nextSpawnAt) {
            var bladeSide = Math.floor(Math.random() * 4);
            for (var bladeIndex = 0; bladeIndex < 3; bladeIndex++) {
                var bladeOrigin = arenaExtNewEdge((bladeSide + bladeIndex) % 4, 18);
                var bladeOffset = (bladeIndex - 1) * 68;
                var bladeTargetX = Math.max(42, Math.min(358, heart.x + (bladeIndex === 0 ? bladeOffset : (bladeIndex === 2 ? -bladeOffset : 0))));
                var bladeTargetY = Math.max(78, Math.min(462, heart.y + (bladeIndex - 1) * 52));
                var bladeDx = bladeTargetX - bladeOrigin.x;
                var bladeDy = bladeTargetY - bladeOrigin.y;
                var bladeLength = Math.max(1, Math.hypot(bladeDx, bladeDy));
                var bladePerpX = -bladeDy / bladeLength;
                var bladePerpY = bladeDx / bladeLength;
                st.hazards.push({
                    id:++st.sequence, x:bladeOrigin.x, y:bladeOrigin.y,
                    ox:bladeOrigin.x, oy:bladeOrigin.y, tx:bladeTargetX, ty:bladeTargetY,
                    curveX:bladePerpX * (bladeIndex - 1) * 135,
                    curveY:bladePerpY * (bladeIndex - 1) * 135,
                    age:0, born:t, delay:bladeIndex * 170, rot:0,
                    spin:bladeIndex % 2 ? -1 : 1, hit:false, trail:[], pass:0
                });
            }
            st.nextSpawnAt = t + 3200;
        }

        for (var bladeI = st.hazards.length - 1; bladeI >= 0; bladeI--) {
            var blade = st.hazards[bladeI];
            var bladeAge = Math.max(0, t - blade.born - blade.delay);
            if (!frozen) blade.age = bladeAge;
            var previousBladeX = blade.x, previousBladeY = blade.y;
            if (bladeAge <= 900) {
                var outU = Math.max(0, Math.min(1, bladeAge / 900));
                var outOne = 1 - outU;
                blade.x = outOne * outOne * blade.ox +
                    2 * outOne * outU * (blade.ox + (blade.tx - blade.ox) * 0.5 + blade.curveX) +
                    outU * outU * blade.tx;
                blade.y = outOne * outOne * blade.oy +
                    2 * outOne * outU * (blade.oy + (blade.ty - blade.oy) * 0.5 + blade.curveY) +
                    outU * outU * blade.ty;
                blade.pass = 1;
            } else if (bladeAge <= 2050) {
                var returnU = Math.max(0, Math.min(1, (bladeAge - 900) / 1150));
                var returnOne = 1 - returnU;
                blade.x = returnOne * returnOne * blade.tx +
                    2 * returnOne * returnU * (blade.ox + (blade.tx - blade.ox) * 0.5 - blade.curveX * 1.35) +
                    returnU * returnU * blade.ox;
                blade.y = returnOne * returnOne * blade.ty +
                    2 * returnOne * returnU * (blade.oy + (blade.ty - blade.oy) * 0.5 - blade.curveY * 1.35) +
                    returnU * returnU * blade.oy;
                blade.pass = 2;
            }

            var bladeAngle = Math.atan2(blade.y - previousBladeY, blade.x - previousBladeX);
            if (Number.isFinite(bladeAngle)) blade.rot = bladeAngle;
            if (!blade.trail) blade.trail = [];
            if (!frozen && bladeAge >= 0) {
                blade.trail.unshift({x:blade.x,y:blade.y});
                if (blade.trail.length > 16) blade.trail.pop();
            }

            for (var trailI = blade.trail.length - 1; trailI > 0; trailI--) {
                ctx.save();
                ctx.globalAlpha = (1 - trailI / blade.trail.length) * 0.46;
                ctx.strokeStyle = trailI % 2 ? "#ff8d32" : "#fff0a0";
                ctx.lineWidth = Math.max(1, 13 - trailI * 0.72);
                ctx.shadowColor = "#ff7b22"; ctx.shadowBlur = 17;
                ctx.beginPath();
                ctx.moveTo(blade.trail[trailI].x, blade.trail[trailI].y);
                ctx.lineTo(blade.trail[trailI - 1].x, blade.trail[trailI - 1].y);
                ctx.stroke(); ctx.restore();
            }

            if (bladeAge >= 0) {
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                ctx.strokeStyle = "rgba(255,210,105,0.48)"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(blade.x, blade.y, 29 + Math.sin(now / 45 + blade.id) * 5, blade.rot - 1.15, blade.rot + 1.15); ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.translate(blade.x, blade.y);
                ctx.rotate(blade.rot + bladeAge * 0.014 * blade.spin);
                ctx.scale(1.62, 1.62);
                ctx.shadowColor = "#ff8c28"; ctx.shadowBlur = 25;
                var bladeGrad = ctx.createLinearGradient(-28, -22, 30, 22);
                bladeGrad.addColorStop(0, "#fff4bd");
                bladeGrad.addColorStop(0.32, "#ffc14e");
                bladeGrad.addColorStop(0.72, "#a95720");
                bladeGrad.addColorStop(1, "#ffe6a0");
                ctx.beginPath();
                ctx.moveTo(-29,-16); ctx.quadraticCurveTo(-34,-28,-19,-25);
                ctx.quadraticCurveTo(-6,-19,1,-5); ctx.quadraticCurveTo(7,3,14,-7);
                ctx.lineTo(28,-23); ctx.quadraticCurveTo(37,-25,35,-14);
                ctx.lineTo(18,16); ctx.quadraticCurveTo(8,25,-5,13);
                ctx.lineTo(-27,-3); ctx.closePath();
                ctx.fillStyle = bladeGrad; ctx.strokeStyle = "#fff3bd"; ctx.lineWidth = 2.2;
                ctx.fill(); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(-19,-12); ctx.quadraticCurveTo(0,2,17,-13); ctx.stroke();
                ctx.restore();
            }

            if (!frozen && bladeAge >= 0 && !blade.hit &&
                Math.hypot(heart.x - blade.x, heart.y - blade.y) < 34 + heart.hitbox) {
                blade.hit = true;
                applyHit(extImpactDamage, blade.pass === 1 ? "БУМЕРАНГ: ПЕРВЫЙ ПРОХОД!" : "БУМЕРАНГ: ВОЗВРАЩЕНИЕ!",
                    false, false, arenaExtDamageAction("returning-blade:" + blade.id, {
                        type:"boomerang",x:blade.x,y:blade.y,radius:34,damage:extImpactDamage
                    }));
                arenaExtPushHeart(blade.x, blade.y, 4.3, 1.0);
                arenaShockwaves.push({x:blade.x,y:blade.y,r:7,v:3.2,life:13,maxLife:13,color:"rgba(255,190,75,0.8)"});
            }
            if (bladeAge > 2050) st.hazards.splice(bladeI, 1);
        }
    }

    // 16. Cracks branch through short marked paths; they are not a circular shockwave.
    if (st.type === 16) {
        if (t >= st.nextSpawnAt && st.hazards.length < 1) {
            var lavaX = 70 + Math.random() * 260, lavaY = 105 + Math.random() * 290, lavaBranches = [];
            var lavaBranchCount = Math.min(7, 4 + Math.floor(Math.max(0, extWaveDanger - 1) * 2));
            for (var lavaB = 0; lavaB < lavaBranchCount; lavaB++) {
                var lavaAngle = Math.random() * Math.PI * 2 + lavaB * Math.PI * 2 / lavaBranchCount;
                var lavaLen1 = 62 + Math.random() * 42, lavaLen2 = 66 + Math.random() * 44;
                var lavaMX = Math.max(12, Math.min(388, lavaX + Math.cos(lavaAngle) * lavaLen1));
                var lavaMY = Math.max(55, Math.min(490, lavaY + Math.sin(lavaAngle) * lavaLen1));
                var lavaAngle2 = lavaAngle + (Math.random() - 0.5) * 0.9;
                var lavaEX = Math.max(10, Math.min(390, lavaMX + Math.cos(lavaAngle2) * lavaLen2));
                var lavaEY = Math.max(55, Math.min(490, lavaMY + Math.sin(lavaAngle2) * lavaLen2));
                lavaBranches.push([{x:lavaX,y:lavaY},{x:lavaMX,y:lavaMY},{x:lavaEX,y:lavaEY}]);
            }
            st.hazards.push({ born:t, x:lavaX, y:lavaY, branches:lavaBranches, phase:Math.random()*Math.PI*2, erupted:false });
            st.nextSpawnAt = t + 2500;
        }
        for (var lavaRi = st.hazards.length - 1; lavaRi >= 0; lavaRi--) {
            var lavaCrack = st.hazards[lavaRi], lavaAge = t - lavaCrack.born;
            if (lavaAge > 2250) { st.hazards.splice(lavaRi, 1); continue; }
            var lavaWarning = lavaAge < 470;
            if (lavaAge >= 455 && !lavaCrack.erupted) {
                lavaCrack.erupted = true;
                arenaShake = Math.max(arenaShake, 13);
                screenFlash = Math.max(screenFlash, 3);
                playArenaSound(82, "sawtooth", 0.16, 0.065);
                for (var lavaSpark = 0; lavaSpark < lavaCrack.branches.length * 4; lavaSpark++) {
                    var lavaSparkBranch = lavaCrack.branches[lavaSpark % lavaCrack.branches.length];
                    var lavaSparkPoint = lavaSparkBranch[(lavaSpark % 2) + 1];
                    var lavaSparkA = Math.random() * Math.PI * 2;
                    arenaParticles.push({
                        x:lavaSparkPoint.x, y:lavaSparkPoint.y,
                        vx:Math.cos(lavaSparkA) * (1.5 + Math.random() * 5.5),
                        vy:-2 - Math.random() * 7,
                        life:18 + Math.random() * 18, maxLife:36,
                        color:lavaSpark % 3 === 0 ? "#fff0a3" : (lavaSpark % 2 ? "#ff4315" : "#ff9d28"),
                        size:2 + Math.random() * 4
                    });
                }
                arenaShockwaves.push({x:lavaCrack.x,y:lavaCrack.y,r:12,v:4.4,life:24,maxLife:24,color:"rgba(255,78,18,0.92)"});
            }
            // A ring of pressure races ahead of the molten fissures.
            if (lavaAge >= 470 && lavaAge < 1150) {
                var lavaShockR = (lavaAge - 470) * 0.25 * Math.min(1.3, extWaveDanger);
                ctx.save(); ctx.globalAlpha = Math.max(0.18, 0.78 - (lavaAge - 470) / 1050);
                ctx.strokeStyle = "#ff7a28"; ctx.lineWidth = 4 + pulse * 3; ctx.shadowColor = "#ff3b0d"; ctx.shadowBlur = 20;
                ctx.beginPath(); ctx.arc(lavaCrack.x, lavaCrack.y, lavaShockR, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = "rgba(255,225,108,0.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lavaCrack.x, lavaCrack.y, Math.max(0, lavaShockR - 6), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
                if (!frozen && Math.abs(Math.hypot(heart.x-lavaCrack.x, heart.y-lavaCrack.y) - lavaShockR) < 4 + heart.hitbox &&
                    arenaExtTouchCooldown(st, "lavaWave_" + lavaRi, now, 360)) {
                    var lavaPushA = Math.atan2(heart.y-lavaCrack.y, heart.x-lavaCrack.x);
                    heart.vx += Math.cos(lavaPushA) * 7.0 * extWaveDanger;
                    heart.vy += Math.sin(lavaPushA) * 7.0 * extWaveDanger;
                    st._multiHitActive = true; applyHit(extImpactDamage, "ЛАВА: УДАРНАЯ ВОЛНА!", false, true, arenaExtDamageAction("lavaWave:"+lavaRi,{type:"ring",x:lavaCrack.x,y:lavaCrack.y,radius:lavaShockR,thickness:8,damage:extImpactDamage}));
                }
            }
            // First show dark fissure telegraphs, then let the eruption travel out from the center.
            for (var lavaBi = 0; lavaBi < lavaCrack.branches.length; lavaBi++) {
                var lavaPath = lavaCrack.branches[lavaBi];
                for (var lavaSi = 0; lavaSi < lavaPath.length - 1; lavaSi++) {
                    var lavaP0 = lavaPath[lavaSi], lavaP1 = lavaPath[lavaSi+1];
                    var lavaStart = 455 + lavaBi * 38 + lavaSi * 145;
                    var lavaSegmentAge = lavaAge - lavaStart;
                    var lavaGrowth = Math.max(0, Math.min(1, lavaSegmentAge / 190));
                    var lavaTipX = lavaP0.x + (lavaP1.x-lavaP0.x) * lavaGrowth;
                    var lavaTipY = lavaP0.y + (lavaP1.y-lavaP0.y) * lavaGrowth;
                    arenaExtDrawSegment(lavaP0.x,lavaP0.y,lavaP1.x,lavaP1.y, lavaWarning ? 4 : 13,
                        lavaWarning ? "#e9a267" : "#31110b", lavaWarning ? 0.82 : 0.9, lavaWarning);
                    if (!lavaWarning && lavaGrowth > 0) {
                        arenaExtDrawSegment(lavaP0.x,lavaP0.y,lavaTipX,lavaTipY,18,"#4b160a",0.98,false);
                        arenaExtDrawSegment(lavaP0.x,lavaP0.y,lavaTipX,lavaTipY,12,"#c82d0b",0.98,false);
                        arenaExtDrawSegment(lavaP0.x,lavaP0.y,lavaTipX,lavaTipY,7,"#ff5816",0.99,false);
                        arenaExtDrawSegment(lavaP0.x,lavaP0.y,lavaTipX,lavaTipY,2.8,"#ffe17b",0.98,false);
                        var lavaActiveSeg = lavaSegmentAge > 55 && lavaSegmentAge < 720;
                        if (!frozen && lavaActiveSeg && lavaGrowth > 0.45 &&
                            arenaExtLineTouchesHeart(lavaP0.x,lavaP0.y,lavaTipX,lavaTipY,12) &&
                            arenaExtTouchCooldown(st,"lavaBurn_"+lavaRi,now,330)) {
                            st._multiHitActive = true; applyHit(extImpactDamage,"ЛАВА: ОЖОГ!",false,true,arenaExtDamageAction("lavaBurn:"+lavaRi+":"+lavaBi+":"+lavaSi,{type:"segment",x1:lavaP0.x,y1:lavaP0.y,x2:lavaTipX,y2:lavaTipY,width:12,damage:extImpactDamage}));
                            arenaExtPushHeart(lavaTipX,lavaTipY,5.2*extWaveDanger,2.0);
                            spawnFloatingText(heart.x,heart.y-18,"ОЖОГ!","#ff9a3c");
                        }
                    }
                }
                // Individual lava fountains erupt from the branching tips with a slight delay.
                for (var lavaPi = 1; lavaPi < lavaPath.length; lavaPi++) {
                    var lavaPoint = lavaPath[lavaPi];
                    var lavaFountainStart = 500 + lavaBi * 42 + (lavaPi - 1) * 210;
                    var lavaFountainT = (lavaAge - lavaFountainStart) / 360;
                    if (lavaFountainT >= 0 && lavaFountainT <= 1) {
                        var lavaJetHeight = Math.sin(lavaFountainT * Math.PI) * (34 + 10 * Math.min(1.4, extWaveDanger));
                        var lavaJetDrift = Math.sin(sec * 6 + lavaBi * 1.7 + lavaPi) * 13;
                        var lavaJetX = lavaPoint.x + lavaJetDrift, lavaJetY = lavaPoint.y - lavaJetHeight;
                        ctx.save(); ctx.lineCap = "round"; ctx.shadowColor = "#ff3c0c"; ctx.shadowBlur = 17;
                        ctx.strokeStyle = "#b6200b"; ctx.lineWidth = 12;
                        ctx.beginPath(); ctx.moveTo(lavaPoint.x,lavaPoint.y); ctx.quadraticCurveTo(lavaPoint.x+lavaJetDrift*0.35,lavaPoint.y-lavaJetHeight*0.65,lavaJetX,lavaJetY); ctx.stroke();
                        ctx.strokeStyle = "#ff5515"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(lavaPoint.x,lavaPoint.y); ctx.quadraticCurveTo(lavaPoint.x+lavaJetDrift*0.35,lavaPoint.y-lavaJetHeight*0.65,lavaJetX,lavaJetY); ctx.stroke();
                        ctx.strokeStyle = "#ffec8b"; ctx.lineWidth = 2.3; ctx.beginPath(); ctx.moveTo(lavaPoint.x,lavaPoint.y); ctx.quadraticCurveTo(lavaPoint.x+lavaJetDrift*0.35,lavaPoint.y-lavaJetHeight*0.65,lavaJetX,lavaJetY); ctx.stroke();
                        for (var lavaDrop = 0; lavaDrop < 3; lavaDrop++) {
                            var lavaDropT = (lavaDrop + 1) / 4;
                            var lavaDropY = lavaPoint.y - lavaJetHeight * lavaDropT + Math.sin(sec*9 + lavaDrop + lavaBi)*3;
                            ctx.beginPath(); ctx.arc(lavaPoint.x + lavaJetDrift*lavaDropT,lavaDropY,2.5 + (lavaDrop%2)*1.5,0,Math.PI*2);
                            ctx.fillStyle = lavaDrop%2 ? "#ff761d" : "#fff0a0"; ctx.fill();
                        }
                        ctx.restore();
                        if (!frozen && lavaFountainT > 0.12 && lavaFountainT < 0.92 &&
                            arenaExtLineTouchesHeart(lavaPoint.x,lavaPoint.y,lavaJetX,lavaJetY,9) &&
                            arenaExtTouchCooldown(st,"lavaBurn_"+lavaRi,now,330)) {
                            st._multiHitActive = true; applyHit(extImpactDamage,"ЛАВА: ГЕЙЗЕР!",false,true,arenaExtDamageAction("lavaJet:"+lavaRi+":"+lavaBi+":"+lavaPi,{type:"segment",x1:lavaPoint.x,y1:lavaPoint.y,x2:lavaJetX,y2:lavaJetY,width:9,damage:extImpactDamage}));
                            arenaExtPushHeart(lavaJetX,lavaJetY,5.5*extWaveDanger,2.2);
                        }
                    }
                    // Cooling spots keep a red glow for a moment after the jet collapses.
                    if (lavaAge > lavaFountainStart + 150 && lavaAge < 2050) {
                        var lavaGlow = Math.max(0.12, 0.72 - Math.max(0,lavaAge-lavaFountainStart-400)/1900);
                        ctx.save(); ctx.globalAlpha = lavaGlow; ctx.shadowColor = "#ff3109"; ctx.shadowBlur = 15;
                        ctx.fillStyle = "#ff4e13"; ctx.beginPath(); ctx.ellipse(lavaPoint.x,lavaPoint.y,9+Math.sin(sec*8+lavaPi)*2,5+Math.cos(sec*7+lavaBi)*1.5,sec*0.25+lavaPi,0,Math.PI*2); ctx.fill();
                        ctx.fillStyle = "#ffd76d"; ctx.beginPath(); ctx.ellipse(lavaPoint.x,lavaPoint.y,4,2.5,0,0,Math.PI*2); ctx.fill(); ctx.restore();
                        // Остывшая точка остаётся только визуальным следом. Урон здесь не наносится.
                    }
                }
            }
            ctx.save(); ctx.globalAlpha = Math.max(0, 1 - lavaAge / 1800);
            ctx.shadowColor = "#ff3e0b"; ctx.shadowBlur = 18;
            ctx.fillStyle = "#e7350c"; ctx.beginPath(); ctx.arc(lavaCrack.x,lavaCrack.y,15+pulse*5,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ffd86d"; ctx.beginPath(); ctx.arc(lavaCrack.x,lavaCrack.y,6+pulse*2,0,Math.PI*2); ctx.fill(); ctx.restore();
        }
    }
    // 17. Tentacles track briefly, lock their aim, then lunge.
    if (st.type === 17) {
        if (t >= st.nextSpawnAt && st.hazards.length < 4) {
            var sideT = Math.floor(Math.random() * 4), org = arenaExtNewEdge(sideT, 5);
            st.hazards.push({ x:org.x, y:org.y, side:sideT, born:t, angle:0, originX:org.x, originY:org.y, caught:false, clawHitAt:0 });
            st.nextSpawnAt = t + Math.max(300, 880 / extWaveDanger);
        }
        for (var ti = st.hazards.length - 1; ti >= 0; ti--) {
            var tent = st.hazards[ti], ageT = t - tent.born;
            if (ageT > 1900) { st.hazards.splice(ti, 1); continue; }
            if (ageT < 430) tent.angle = Math.atan2(heart.y - tent.y, heart.x - tent.x);
            var progressT = ageT < 500 ? 0 : Math.min(1, (ageT - 500) / 350);
            var lengthT = Math.min(390, 310 * extWaveDanger) * progressT;
            var drawLengthT = ageT < 500 ? 275 : lengthT;
            var tx = tent.x + Math.cos(tent.angle) * lengthT, ty = tent.y + Math.sin(tent.angle) * lengthT;
            var warnX = tent.x + Math.cos(tent.angle) * drawLengthT, warnY = tent.y + Math.sin(tent.angle) * drawLengthT;
            var curveOffset = Math.sin(sec * 7 + ti * 1.9) * 19;
            var midX = tent.x + Math.cos(tent.angle) * lengthT * 0.52 - Math.sin(tent.angle) * curveOffset;
            var midY = tent.y + Math.sin(tent.angle) * lengthT * 0.52 + Math.cos(tent.angle) * curveOffset;
            arenaExtDrawSegment(tent.x, tent.y, ageT < 650 ? warnX : midX, ageT < 650 ? warnY : midY, 27, "#b56b48", ageT < 650 ? 0.45 : 0.95, ageT < 650);
            if (ageT >= 650) arenaExtDrawSegment(midX, midY, tx, ty, 23, "#d68659", 0.95, false);
            if (ageT < 500) { ctx.save(); ctx.strokeStyle = "rgba(255,203,150," + (0.25 + pulse * 0.55) + ")"; ctx.lineWidth = 2; ctx.setLineDash([4,5]); ctx.beginPath(); ctx.moveTo(tent.x, tent.y); ctx.lineTo(tent.x + Math.cos(tent.angle - 0.14) * 245, tent.y + Math.sin(tent.angle - 0.14) * 245); ctx.moveTo(tent.x, tent.y); ctx.lineTo(tent.x + Math.cos(tent.angle + 0.14) * 245, tent.y + Math.sin(tent.angle + 0.14) * 245); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
            ctx.save(); ctx.fillStyle = "#e7a37d"; ctx.strokeStyle = "#fff0df"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(tx, ty, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            for (var spike = -1; spike <= 1; spike++) {
                var sa = tent.angle + Math.PI + spike * 0.55;
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(sa) * 13, ty + Math.sin(sa) * 13); ctx.stroke();
            }
            ctx.restore();
            if(tent.caught&&ageT<1850){var pullDX=tent.originX-heart.x,pullDY=tent.originY-heart.y,pullLen=Math.max(1,Math.hypot(pullDX,pullDY));if(!frozen){heart.vx=pullDX/pullLen*Math.min(12,7.0*extWaveDanger);heart.vy=pullDY/pullLen*Math.min(12,7.0*extWaveDanger);heart.x+=heart.vx;heart.y+=heart.vy;heart.x=Math.max(heart.hitbox,Math.min(400-heart.hitbox,heart.x));heart.y=Math.max(55+heart.hitbox,Math.min(500-heart.hitbox,heart.y));if(pullLen<96&&now-Number(tent.clawHitAt||0)>240){tent.clawHitAt=now;st._multiHitActive=true;applyHit(extImpactDamage,"КЛЕШНИ: ЗАХВАТ!",false,true,arenaExtDamageAction("tentacle-claw:"+ti,{type:"circle",x:tent.originX,y:tent.originY,radius:40,damage:extImpactDamage}));heart.vx=(heart.x-tent.originX)*.045;heart.vy=(heart.y-tent.originY)*.045;spawnFloatingText(heart.x,heart.y-20,"КЛЕШНИ СЖАЛИСЬ!","#ff9b8f");}}ctx.save();ctx.translate(tent.originX,tent.originY);ctx.rotate(tent.angle+Math.PI);ctx.fillStyle="#c3ccd5";ctx.strokeStyle="#fff0d4";ctx.lineWidth=2;ctx.fillRect(-24,-20,48,40);ctx.strokeRect(-24,-20,48,40);ctx.fillStyle="#4c5966";for(var clawFinger=-1;clawFinger<=1;clawFinger++){ctx.beginPath();ctx.moveTo(-22,clawFinger*11-4);ctx.lineTo(-38,clawFinger*11);ctx.lineTo(-22,clawFinger*11+4);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(22,clawFinger*11-4);ctx.lineTo(38,clawFinger*11);ctx.lineTo(22,clawFinger*11+4);ctx.closePath();ctx.fill();}ctx.restore();}
            if(!frozen&&ageT>500&&ageT<1500&&progressT>.1&&!tent.caught&&arenaExtLineTouchesHeart(tent.x,tent.y,tx,ty,27)&&arenaExtTouchCooldown(st,"tentacle_"+ti,now,650)){tent.caught=true;tent.caughtAt=t;tent.clawHitAt=0;heart.vx=0;heart.vy=0;st._multiHitActive=true;applyHit(extImpactDamage,"ЩУПАЛЬЦЕ: ХВАТКА!",false,true,arenaExtDamageAction("tentacle-grab:"+ti,{type:"segment",x1:tent.x,y1:tent.y,x2:tx,y2:ty,width:27,damage:extImpactDamage}));spawnFloatingText(heart.x,heart.y-18,"ЩУПАЛЬЦЕ СХВАТИЛО!","#e5b08d");}
        }
    }

    // 18. Infinite pinball gears: bounce off arena boundaries and collide with one another.
    if (st.type === 18) {
        // Clear the slow immediately after the player leaves every gear hitbox.
        st.gearSlowUntil = 0;
        if (t >= st.nextSpawnAt && st.hazards.length < 3) {
            var spawnCountG = st.hazards.length < 2 ? 2 - st.hazards.length : 1;
            for (var gs0 = 0; gs0 < spawnCountG && st.hazards.length < 3; gs0++) {
                var sideG = Math.floor(Math.random() * 4), rG = (19 + Math.random() * 6) * Math.min(1.18,extWaveDanger);
                var gearWaveScale = Math.min(1.35, 1 + Math.max(0, extWaveDanger - 1) * 0.28);
                var speedG = (2.35 + Math.random() * 0.75) * gearWaveScale, alongG = (Math.random() - 0.5) * 2.5 * gearWaveScale;
                var gx, gy, gvx, gvy;
                if (sideG === 0) { gx = rG + 8; gy = 82 + Math.random() * 390; gvx = speedG; gvy = alongG; }
                else if (sideG === 1) { gx = 400 - rG - 8; gy = 82 + Math.random() * 390; gvx = -speedG; gvy = alongG; }
                else if (sideG === 2) { gx = 30 + Math.random() * 340; gy = 62 + rG; gvx = alongG; gvy = speedG; }
                else { gx = 30 + Math.random() * 340; gy = 492 - rG; gvx = alongG; gvy = -speedG; }
                st.hazards.push({ x:gx, y:gy, vx:gvx, vy:gvy, r:rG, born:t, age:0, rot:Math.random()*Math.PI*2, trail:[], nextContactHitAt:0, lastClankAt:0, lastWallBounceAt:0, roll:Math.random()*Math.PI*2 });
            }
            st.nextSpawnAt = t + Math.max(1050, (st.hazards.length < 3 ? 1550 : 2050) / Math.min(1.25, extWaveDanger));
        }
        var frameScaleG = Math.max(0, Math.min(3, delta / 16.667));
        for (var gm = 0; gm < st.hazards.length; gm++) {
            var movingGear = st.hazards[gm];
            if (!movingGear.trail) movingGear.trail = [];
            if (!frozen) {
                movingGear.age += delta;
                var gearTouchingPlayer = Math.hypot(heart.x-movingGear.x,heart.y-movingGear.y)<movingGear.r+heart.hitbox+2;
                var gearMotionScale = gearTouchingPlayer ? 0.30 : 1;
                movingGear.x += movingGear.vx*frameScaleG*gearMotionScale;
                movingGear.y += movingGear.vy*frameScaleG*gearMotionScale;
                movingGear.rot += (movingGear.vx-movingGear.vy)/Math.max(11,movingGear.r)*frameScaleG*gearMotionScale;
                movingGear.roll += 0.09 * frameScaleG;
                movingGear.trail.unshift({x:movingGear.x,y:movingGear.y});
                if (movingGear.trail.length > 6) movingGear.trail.pop();
            }
            var minGX = movingGear.r + 5, maxGX = 400 - movingGear.r - 5;
            var minGY = 62 + movingGear.r, maxGY = 494 - movingGear.r;
            var wallBouncedG = false;
            if (movingGear.x < minGX) { movingGear.x = minGX; movingGear.vx = Math.abs(movingGear.vx); wallBouncedG = true; }
            else if (movingGear.x > maxGX) { movingGear.x = maxGX; movingGear.vx = -Math.abs(movingGear.vx); wallBouncedG = true; }
            if (movingGear.y < minGY) { movingGear.y = minGY; movingGear.vy = Math.abs(movingGear.vy); wallBouncedG = true; }
            else if (movingGear.y > maxGY) { movingGear.y = maxGY; movingGear.vy = -Math.abs(movingGear.vy); wallBouncedG = true; }
            if (wallBouncedG && !frozen && t - Number(movingGear.lastWallBounceAt || -1000) > 120) {
                movingGear.lastWallBounceAt = t; arenaShake = Math.max(arenaShake, 4);
                for (var wpG = 0; wpG < 5; wpG++) arenaParticles.push({x:movingGear.x,y:movingGear.y,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5,life:14,maxLife:14,color:wpG%2?"#ffba54":"#fff0b6",size:1.8+Math.random()*2.2});
                arenaShockwaves.push({x:movingGear.x,y:movingGear.y,r:movingGear.r*0.35,v:2.4,life:11,maxLife:11,color:"rgba(255,178,72,0.72)"});
                playArenaSound(125 + Math.random()*50, "square", 0.07, 0.045);
            }
        }
        if (!frozen) {
            for (var ga0 = 0; ga0 < st.hazards.length; ga0++) {
                for (var gb0 = ga0 + 1; gb0 < st.hazards.length; gb0++) {
                    var gearA = st.hazards[ga0], gearB = st.hazards[gb0];
                    var dxG = gearB.x - gearA.x, dyG = gearB.y - gearA.y;
                    var distG = Math.hypot(dxG, dyG), minDistG = gearA.r + gearB.r;
                    if (distG >= minDistG) continue;
                    if (distG < 0.001) { dxG = 1; dyG = 0; distG = 1; }
                    var nxG = dxG / distG, nyG = dyG / distG, overlapG = minDistG - distG + 0.7;
                    gearA.x -= nxG * overlapG * 0.5; gearA.y -= nyG * overlapG * 0.5;
                    gearB.x += nxG * overlapG * 0.5; gearB.y += nyG * overlapG * 0.5;
                    var rvG = (gearB.vx - gearA.vx) * nxG + (gearB.vy - gearA.vy) * nyG;
                    if (rvG < 0) {
                        gearA.vx += rvG * nxG; gearA.vy += rvG * nyG;
                        gearB.vx -= rvG * nxG; gearB.vy -= rvG * nyG;
                    }
                    var clankAtG = Math.max(Number(gearA.lastClankAt || 0), Number(gearB.lastClankAt || 0));
                    if (t - clankAtG > 150) {
                        gearA.lastClankAt = t; gearB.lastClankAt = t; arenaShake = Math.max(arenaShake, 5);
                        for (var cpG = 0; cpG < 7; cpG++) arenaParticles.push({x:(gearA.x+gearB.x)*0.5,y:(gearA.y+gearB.y)*0.5,vx:(Math.random()-0.5)*7,vy:(Math.random()-0.5)*7,life:17,maxLife:17,color:cpG%3?"#ffc15e":"#fff4c4",size:2+Math.random()*2.7});
                        arenaShockwaves.push({x:(gearA.x+gearB.x)*0.5,y:(gearA.y+gearB.y)*0.5,r:4,v:3,life:13,maxLife:13,color:"rgba(255,190,80,0.85)"});
                        playArenaSound(180 + Math.random()*70, "sawtooth", 0.08, 0.05);
                    }
                }
            }
        }
        for (var gd = 0; gd < st.hazards.length; gd++) {
            var gear = st.hazards[gd];
            for (var gt = gear.trail.length - 1; gt > 0; gt--) {
                ctx.save(); ctx.globalAlpha = (1 - gt / gear.trail.length) * 0.32;
                ctx.strokeStyle = "#ffb84e"; ctx.lineWidth = Math.max(1, 7 - gt * 0.62);
                ctx.shadowColor = "#ff9928"; ctx.shadowBlur = 9;
                ctx.beginPath(); ctx.moveTo(gear.trail[gt].x, gear.trail[gt].y); ctx.lineTo(gear.trail[gt-1].x, gear.trail[gt-1].y); ctx.stroke(); ctx.restore();
            }
            ctx.save(); ctx.globalAlpha = 0.26 + pulse * 0.27; ctx.strokeStyle = "#ffc875"; ctx.lineWidth = 2.5;
            ctx.shadowColor = "#ff9b26"; ctx.shadowBlur = 13;
            ctx.beginPath(); ctx.arc(gear.x, gear.y, gear.r + 8 + pulse * 4, gear.rot, gear.rot + Math.PI * 1.55); ctx.stroke(); ctx.restore();
            arenaExtDrawGear(gear.x, gear.y, gear.r, gear.rot, "#b78a53", 0.99);
            ctx.save(); ctx.translate(gear.x, gear.y); ctx.rotate(gear.roll);
            ctx.strokeStyle = "rgba(255,242,201,0.7)"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, gear.r * 0.61, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            if (!frozen && Math.hypot(heart.x - gear.x, heart.y - gear.y) < gear.r + heart.hitbox + 2) {
                st._multiHitActive = true;
                st.gearSlowUntil = now + 40;
                if (now >= Number(gear.nextContactHitAt || 0)) {
                    gear.nextContactHitAt = now + 320; arenaShake = Math.max(arenaShake, 10);
                    for (var hpG = 0; hpG < 9; hpG++) arenaParticles.push({x:heart.x,y:heart.y,vx:(Math.random()-0.5)*9,vy:(Math.random()-0.5)*9,life:19,maxLife:19,color:hpG%2?"#ff9b32":"#fff2c6",size:2.2+Math.random()*3});
                    applyHit(extImpactDamage, "ШЕСТЕРНЯ: МУЛЬТИ-УДАР!", false, true, arenaExtDamageAction("gear:"+String(gear.born||gd),{type:"gear",x:gear.x,y:gear.y,radius:gear.r,damage:extImpactDamage}));
                }
            }
        }
    }

    // 19. Vines grow through the arena. Touching a thorn calls the roots to pull you back.
    if (st.type === 19) {
        if (!frozen && st.vineSnare && now < st.vineSnare.until) {
            var rootDX=st.vineSnare.x-heart.x,rootDY=st.vineSnare.y-heart.y,rootDist=Math.max(1,Math.hypot(rootDX,rootDY));
            heart.vx += rootDX/rootDist*0.62*extWaveDanger;
            heart.vy += rootDY/rootDist*0.62*extWaveDanger;
        }
        if (t >= st.nextSpawnAt) {
            var gardenWave = Number(st.gardenWave || 0);
            st.gardenWave = gardenWave + 1;
            var gardenCount = Math.min(7, 2 + Math.floor(gardenWave * 0.7));
            for (var gardenSpawn = 0; gardenSpawn < gardenCount && st.hazards.length < 18; gardenSpawn++) {
                var sideV = Math.floor(Math.random() * 4), root = arenaExtNewEdge(sideV, 14);
                var pointsV = [{x:root.x,y:root.y}], angleV = sideV === 0 ? 0 : sideV === 1 ? Math.PI : sideV === 2 ? Math.PI/2 : -Math.PI/2;
                for (var vi = 0; vi < 4; vi++) {
                    angleV += (Math.random() - 0.5) * 1.25;
                    var vx = Math.max(12, Math.min(388, pointsV[pointsV.length-1].x + Math.cos(angleV) * (73 + Math.random()*27)));
                    var vy = Math.max(55, Math.min(490, pointsV[pointsV.length-1].y + Math.sin(angleV) * (73 + Math.random()*27)));
                    pointsV.push({x:vx,y:vy});
                }
                st.hazards.push({ born:t, points:pointsV, gardenWave:gardenWave, duration:3500*(1+gardenWave*0.5) });
            }
            st.nextSpawnAt = t + Math.max(180, 820/(1+gardenWave*0.5)/extWaveDanger);
        }
        for (var vi2 = st.hazards.length - 1; vi2 >= 0; vi2--) {
            var vine = st.hazards[vi2], ageV = t - vine.born, vineDuration = vine.duration || 3500;
            if (ageV > vineDuration) { st.hazards.splice(vi2, 1); continue; }
            var warningV = ageV < Math.min(660,440*(1+(vine.gardenWave||0)*0.5));
            for (var vs = 0; vs < vine.points.length - 1; vs++) {
                var segmentAge = ageV - Math.min(660,440*(1+(vine.gardenWave||0)*0.5)) - vs * Math.max(110,220/(1+(vine.gardenWave||0)*0.5));
                if (segmentAge <= 0) {
                    arenaExtDrawSegment(vine.points[vs].x, vine.points[vs].y, vine.points[vs+1].x, vine.points[vs+1].y, 3, "#b9e88a", 0.45, true);
                    continue;
                }
                var ratioV = Math.max(0, Math.min(1, segmentAge / 280));
                var exV = vine.points[vs].x + (vine.points[vs+1].x - vine.points[vs].x) * ratioV;
                var eyV = vine.points[vs].y + (vine.points[vs+1].y - vine.points[vs].y) * ratioV;
                arenaExtDrawSegment(vine.points[vs].x, vine.points[vs].y, exV, eyV, 19, ageV > 1400 ? "#7d9e4c" : "#b0dc69", 0.95, false);
                var dxV = exV - vine.points[vs].x, dyV = eyV - vine.points[vs].y, lenV = Math.max(1, Math.hypot(dxV,dyV)), nxV = -dyV / lenV, nyV = dxV / lenV;
                for (var th = 0; th < 3; th++) { var tu = 0.24 + th * 0.25; if (tu > ratioV) continue; var txV = vine.points[vs].x + dxV * tu, tyV = vine.points[vs].y + dyV * tu; ctx.save(); ctx.fillStyle = "#e7ff9d"; ctx.strokeStyle = "#547c35"; ctx.lineWidth = 1; ctx.shadowColor = "#caff6f"; ctx.shadowBlur = 7; ctx.beginPath(); ctx.moveTo(txV + nxV * 2, tyV + nyV * 2); ctx.lineTo(txV + nxV * 12 - dxV / lenV * 3, tyV + nyV * 12 - dyV / lenV * 3); ctx.lineTo(txV - nxV * 4, tyV - nyV * 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
                if(ageV>610&&ratioV>.4&&ageV<vineDuration-180&&arenaExtLineTouchesHeart(vine.points[vs].x,vine.points[vs].y,exV,eyV,19)){st.vineSlowUntil=now+460;st.vineSnare={x:vine.points[0].x,y:vine.points[0].y,until:now+680};heart.vx*=.78;heart.vy*=.78;if(arenaExtTouchCooldown(st,"vine_"+vi2+"_"+vs,now,180)){st._multiHitActive=true;applyHit(extImpactDamage,"САД ШИПОВ: ПРОКОЛ!",false,true,arenaExtDamageAction("vine:"+vi2+":"+vs,{type:"segment",x1:vine.points[vs].x,y1:vine.points[vs].y,x2:exV,y2:eyV,width:19,damage:extImpactDamage}));spawnFloatingText(heart.x,heart.y-18,"КОРНИ СХВАТИЛИ!","#d7f3a5");}}
            }
            ctx.save(); ctx.fillStyle = warningV ? "#eaffbd" : "#7d9e4c"; ctx.beginPath(); ctx.arc(vine.points[0].x, vine.points[0].y, warningV ? 7 : 5, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }
    }

    // 20. Twin interceptor fists: a hand can grab the player mid-flight and drag them into its partner.
    if (st.type === 20) {
        if (!st.clawPair && t >= st.nextSpawnAt) {
            var horizontal = Math.random() < 0.5;
            var lane = horizontal ? 95 + Math.random() * 310 : 90 + Math.random() * 320;
            st.clawPair = {
                born: t, horizontal: horizontal, lane: lane,
                meet: horizontal ? 200 : 270,
                phase: "warning", warningUntil: t + 850,
                x1: horizontal ? -150 : lane, y1: horizontal ? lane : -150,
                x2: horizontal ? 550 : lane, y2: horizontal ? lane : 650,
                holdUntil: 0, didSlam: false
            };
            st.nextSpawnAt = t + Math.max(360, 1180 / extWaveDanger);
        }
        var pair = st.clawPair;
        if (pair) {
            var horizontalC = pair.horizontal;
            var laneC = pair.lane;
            var meetC = pair.meet;
            var leftX = horizontalC ? pair.x1 : laneC;
            var leftY = horizontalC ? laneC : pair.y1;
            var rightX = horizontalC ? pair.x2 : laneC;
            var rightY = horizontalC ? laneC : pair.y2;
            var stepC = Math.min(18, Math.max(0, delta) * 0.32 * extWaveDanger);
            if (pair.phase === "warning") {
                ctx.save();
                var clawWarnPulse = 0.45 + Math.abs(Math.sin(now / 75)) * 0.4;
                ctx.globalAlpha = clawWarnPulse;
                ctx.fillStyle = "rgba(255,95,65,0.15)";
                ctx.strokeStyle = "#ff9b72"; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
                if (horizontalC) {
                    ctx.fillRect(5, laneC - 42, 390, 84);
                    ctx.strokeRect(5, laneC - 42, 390, 84);
                    ctx.beginPath(); ctx.moveTo(15, laneC); ctx.lineTo(385, laneC); ctx.stroke();
                } else {
                    ctx.fillRect(laneC - 42, 60, 84, 435);
                    ctx.strokeRect(laneC - 42, 60, 84, 435);
                    ctx.beginPath(); ctx.moveTo(laneC, 65); ctx.lineTo(laneC, 490); ctx.stroke();
                }
                ctx.setLineDash([]);
                ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
                ctx.fillStyle = "#ffe0c9";
                ctx.fillText("КЛЕШНИ! УХОДИ С ЛИНИИ", 200, horizontalC ? laneC - 49 : 82);
                ctx.restore();
                if (t >= pair.warningUntil) pair.phase = "approach";
            } else if (pair.phase === "approach") {
                // Two fists rush in from opposite edges and collide at the center.
                if (horizontalC) {
                    pair.x1 = Math.min(meetC - 12, pair.x1 + stepC);
                    pair.x2 = Math.max(meetC + 12, pair.x2 - stepC);
                } else {
                    pair.y1 = Math.min(meetC - 12, pair.y1 + stepC);
                    pair.y2 = Math.max(meetC + 12, pair.y2 - stepC);
                }
                leftX = horizontalC ? pair.x1 : laneC;
                leftY = horizontalC ? laneC : pair.y1;
                rightX = horizontalC ? pair.x2 : laneC;
                rightY = horizontalC ? laneC : pair.y2;
                var nearFirst = horizontalC
                    ? Math.abs(heart.y - laneC) < 62 && Math.abs(heart.x - leftX) < 78
                    : Math.abs(heart.x - laneC) < 62 && Math.abs(heart.y - leftY) < 78;
                var nearSecond = horizontalC
                    ? Math.abs(heart.y - laneC) < 62 && Math.abs(heart.x - rightX) < 78
                    : Math.abs(heart.x - laneC) < 62 && Math.abs(heart.y - rightY) < 78;
                if (nearFirst || nearSecond) {
                    st._multiHitActive=true;applyHit(extImpactDamage,"КЛЕШНЯ: ЗАХВАТ!",false,true,arenaExtDamageAction("claw-pair:"+String(pair.born||"active"),{type:"rect",x:horizontalC?leftX:laneC,y:horizontalC?laneC:leftY,width:horizontalC?156:124,height:horizontalC?124:156,damage:extImpactDamage}));
                    pair.phase = "caught";
                    pair.grabSide = nearFirst ? "first" : "second";
                    pair.caughtAt = t;
                    pair.holdUntil = t + 560;
                    pair.caughtX = heart.x;
                    pair.caughtY = heart.y;
                    arenaShake = Math.max(arenaShake, 5);
                    spawnFloatingText(heart.x, heart.y - 20, "СХВАТИЛИ!", "#ffd18b");
                } else {
                    var gapC = horizontalC ? pair.x2 - pair.x1 : pair.y2 - pair.y1;
                    if (gapC <= 25) {
                        pair.phase = "slam";
                        pair.slamAt = t;
                    }
                }
            } else if (pair.phase === "caught") {
                // Both fists drag the captured heart toward their collision point.
                var playerCarryStep = Math.min(16, Math.max(0, delta) * 0.52 * extWaveDanger);
                if (horizontalC) {
                    pair.x1 = Math.min(meetC - 18, pair.x1 + stepC * 0.72);
                    pair.x2 = Math.max(meetC + 18, pair.x2 - stepC * 0.72);
                    heart.x += Math.sign(meetC - heart.x) * Math.min(Math.abs(meetC - heart.x), playerCarryStep);
                    heart.y += (laneC - heart.y) * Math.min(0.25, Math.max(0, delta) * 0.002);
                } else {
                    pair.y1 = Math.min(meetC - 18, pair.y1 + stepC * 0.72);
                    pair.y2 = Math.max(meetC + 18, pair.y2 - stepC * 0.72);
                    heart.y += Math.sign(meetC - heart.y) * Math.min(Math.abs(meetC - heart.y), playerCarryStep);
                    heart.x += (laneC - heart.x) * Math.min(0.25, Math.max(0, delta) * 0.002);
                }
                if (t >= pair.holdUntil) {
                    pair.phase = "slam";
                    pair.slamAt = t;
                }
            } else if (pair.phase === "slam") {
                if (!pair.didSlam) {
                    pair.didSlam = true;
                    arenaShake = Math.max(arenaShake, 15);
                    screenFlash = Math.max(screenFlash, 4);
                    playArenaSound(90, "sawtooth", 0.2, 0.08);
                    var nearMeeting = horizontalC
                        ? Math.abs(heart.x - meetC) < 125 && Math.abs(heart.y - laneC) < 110
                        : Math.abs(heart.x - laneC) < 110 && Math.abs(heart.y - meetC) < 125;
                    if (nearMeeting) {
                        st._multiHitActive=true;applyHit(extImpactDamage,"КЛЕШНИ: РАЗДАВИЛИ!",false,true,arenaExtDamageAction("claw-pair:"+String(pair.born||"active"),{type:"rect",x:horizontalC?meetC:laneC,y:horizontalC?laneC:meetC,width:horizontalC?250:220,height:horizontalC?220:250,damage:extImpactDamage}));
                        // Rebound away from the fist that delivered the slam.
                        var awaySign = pair.grabSide === "first" ? -1 : 1;
                        if (horizontalC) {
                            heart.vx = awaySign * 8.2;
                            heart.vy += (heart.y - laneC) * 0.13;
                        } else {
                            heart.vy = awaySign * 8.2;
                            heart.vx += (heart.x - laneC) * 0.13;
                        }
                        spawnFloatingText(heart.x, heart.y - 18, "УДАР ОБ КУЛАК!", "#ffc36c");
                    }
                    for (var spC = 0; spC < 22; spC++) {
                        arenaParticles.push({
                            x: horizontalC ? meetC : laneC,
                            y: horizontalC ? laneC : meetC,
                            vx: (Math.random() - 0.5) * 10,
                            vy: (Math.random() - 0.5) * 10,
                            life: 22, maxLife: 22,
                            color: spC % 2 ? "#ffc36c" : "#fff1d4",
                            size: 2 + Math.random() * 3
                        });
                    }
                }
                if (t - pair.slamAt > 270) {
                    pair.phase = "retract";
                    pair.retractAt = t;
                }
            } else if (pair.phase === "retract") {
                var retractC = Math.min(1, Math.max(0, delta) * 0.003);
                if (horizontalC) {
                    pair.x1 += (-150 - pair.x1) * retractC;
                    pair.x2 += (550 - pair.x2) * retractC;
                } else {
                    pair.y1 += (-150 - pair.y1) * retractC;
                    pair.y2 += (650 - pair.y2) * retractC;
                }
                if (t - pair.retractAt > 400) st.clawPair = null;
            }
            leftX = horizontalC ? pair.x1 : laneC;
            leftY = horizontalC ? laneC : pair.y1;
            rightX = horizontalC ? pair.x2 : laneC;
            rightY = horizontalC ? laneC : pair.y2;
            function drawClaw(cx, cy, flip) {
                ctx.save();
                ctx.translate(cx, cy);
                // The same broad claw is rotated for vertical approaches, so its art and hitbox agree.
                if (!horizontalC) ctx.rotate(Math.PI / 2);
                ctx.fillStyle = "#b8c2cc";
                ctx.strokeStyle = "#fff0d4";
                ctx.lineWidth = 2.5;
                ctx.shadowColor = "#ffc66f";
                ctx.shadowBlur = 14;
                ctx.fillRect(-66, -42, 132, 84);
                ctx.strokeRect(-66, -42, 132, 84);
                ctx.fillStyle = "#4c5966";
                for (var qC = -1; qC <= 1; qC++) {
                    ctx.beginPath();
                    ctx.moveTo(flip ? -65 : 65, qC * 23 - 10);
                    ctx.lineTo(flip ? -96 : 96, qC * 23);
                    ctx.lineTo(flip ? -65 : 65, qC * 23 + 10);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }
            drawClaw(leftX, leftY, false);
            drawClaw(rightX, rightY, true);
            if (pair.phase === "approach") {
                ctx.save();
                ctx.strokeStyle = "rgba(255,205,125,0.7)";
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 2;
                if (horizontalC) {
                    ctx.beginPath(); ctx.moveTo(15, laneC); ctx.lineTo(385, laneC); ctx.stroke();
                } else {
                    ctx.beginPath(); ctx.moveTo(laneC, 65); ctx.lineTo(laneC, 490); ctx.stroke();
                }
                ctx.restore();
            }
        }
    }
    // Multi-hit bypasses shields during contact; ordinary invulnerability returns after leaving it.
    if (st._multiHitActive) invulnTimer = 0;
    else if (wasMultiHit) invulnTimer = Math.max(Number(invulnTimer || 0), 45);
}

function arenaRainbowOtherRadius(a) {
    if (!a || a.type === "wall") return 0;
    if (a.type === "rainbow" || a.type === "circle" || a.type === "healCircle") {
        return Math.max(1, Number(a.radius) || 10);
    }
    if (a.type === "bomb") return Number(a.timer) < 0 ? 0 : 14;
    if (a.type === "sword") {
        return Math.max(8, Math.hypot((Number(a.size) || 36) * 0.5, (Number(a.width) || 12) * 0.5));
    }
    if (Number(a.width) > 0 || Number(a.height) > 0) {
        return Math.max(1, Math.hypot(Number(a.width) || Number(a.size) || 20, Number(a.height) || Number(a.size) || 20) * 0.5);
    }
    return Math.max(8, (Number(a.size) || 20) * 0.70710678);
}

function arenaRainbowOtherCenter(a) {
    if (a.type === "rainbow" || a.type === "circle" || a.type === "healCircle" ||
        a.type === "bomb" || a.type === "sword") {
        return { x: Number(a.x) || 0, y: Number(a.y) || 0 };
    }
    if (Number(a.width) > 0 || Number(a.height) > 0) {
        return {
            x: (Number(a.x) || 0) + (Number(a.width) || Number(a.size) || 20) * 0.5,
            y: (Number(a.y) || 0) + (Number(a.height) || Number(a.size) || 20) * 0.5
        };
    }
    var size = Number(a.size) || 20;
    return { x: (Number(a.x) || 0) + size * 0.5, y: (Number(a.y) || 0) + size * 0.5 };
}

function arenaUpdateRainbowAttacks(list, speedMod, globallyFrozen, globallyStopped) {
    if (!Array.isArray(list) || globallyFrozen) return;
    var leftBound = 0, rightBound = 400, topBound = 55, bottomBound = 500;

    // Move each rainbow orb once, then resolve its collisions in a separate pass.
    for (var i = 0; i < list.length; i++) {
        var orb = list[i];
        if (!orb || orb.type !== "rainbow") continue;
        var orbStopped = globallyStopped ||
            (typeof dioShouldFreezeEntity === "function" && dioShouldFreezeEntity(orb));
        orb._mbRainbowOrb = true;
        var radius = Math.max(1, Number(orb.radius) || 30);

        if (!orbStopped) {
            orb.x += (Number(orb.spd) || 0) * speedMod;
            orb.y += (Number(orb.spdY) || 0) * speedMod;
        }

        // Rainbow spheres enter from above before they begin reflecting from the arena edges.
        if (!orb._mbRainbowEntered && orb.y >= topBound + radius) orb._mbRainbowEntered = true;
        if (!orb._mbRainbowEntered || orbStopped) continue;

        if (orb.x - radius < leftBound) {
            orb.x = leftBound + radius;
            if (orb.spd < 0) orb.spd = Math.abs(orb.spd);
            sfxBounce();
        } else if (orb.x + radius > rightBound) {
            orb.x = rightBound - radius;
            if (orb.spd > 0) orb.spd = -Math.abs(orb.spd);
            sfxBounce();
        }
        if (orb.y - radius < topBound) {
            orb.y = topBound + radius;
            if (orb.spdY < 0) orb.spdY = Math.abs(orb.spdY);
            sfxBounce();
        } else if (orb.y + radius > bottomBound) {
            orb.y = bottomBound - radius;
            if (orb.spdY > 0) orb.spdY = -Math.abs(orb.spdY);
            sfxBounce();
        }
    }

    // A rainbow orb is an unbreakable solid projectile. It reflects from other attacks
    // without removing them; two rainbow orbs exchange their normal velocity components.
    for (var ri = 0; ri < list.length; ri++) {
        var rainbow = list[ri];
        if (!rainbow || rainbow.type !== "rainbow" || !rainbow._mbRainbowEntered) continue;
        if (globallyStopped || (typeof dioShouldFreezeEntity === "function" && dioShouldFreezeEntity(rainbow))) continue;
        var rainbowRadius = Math.max(1, Number(rainbow.radius) || 30);

        for (var oi = 0; oi < list.length; oi++) {
            if (oi === ri) continue;
            var other = list[oi];
            if (!other || other === rainbow || other.type === "wall") continue;
            var otherIsRainbow = other.type === "rainbow";
            if (otherIsRainbow && (oi < ri || !other._mbRainbowEntered)) continue;
            if (otherIsRainbow && (typeof dioShouldFreezeEntity === "function" && dioShouldFreezeEntity(other))) continue;

            var otherRadius = arenaRainbowOtherRadius(other);
            if (!(otherRadius > 0)) continue;
            var otherStopped = globallyStopped ||
                (typeof dioShouldFreezeEntity === "function" && dioShouldFreezeEntity(other));
            var otherPosition = other;
            if (!otherIsRainbow && !otherStopped) {
                otherPosition = {
                    type: other.type, x: (Number(other.x) || 0) + (Number(other.spd) || 0) * speedMod,
                    y: (Number(other.y) || 0) + (Number(other.spdY) || 0) * speedMod,
                    radius: other.radius, size: other.size, width: other.width, height: other.height
                };
            }
            var center = arenaRainbowOtherCenter(otherPosition);
            var dx = rainbow.x - center.x, dy = rainbow.y - center.y;
            var distance = Math.hypot(dx, dy);
            var minDistance = rainbowRadius + otherRadius;
            if (distance >= minDistance) continue;

            if (distance < 0.001) {
                dx = (ri % 2 === 0) ? 1 : -1;
                dy = 0;
                distance = 1;
            }
            var nx = dx / distance, ny = dy / distance;
            var overlap = minDistance - distance + 0.35;

            if (otherIsRainbow) {
                // Equal-mass elastic collision: both spheres bounce away from one another.
                rainbow.x += nx * overlap * 0.5;
                rainbow.y += ny * overlap * 0.5;
                other.x -= nx * overlap * 0.5;
                other.y -= ny * overlap * 0.5;
                var relativeNormal = ((Number(rainbow.spd) || 0) - (Number(other.spd) || 0)) * nx +
                    ((Number(rainbow.spdY) || 0) - (Number(other.spdY) || 0)) * ny;
                if (relativeNormal < 0) {
                    rainbow.spd = (Number(rainbow.spd) || 0) - relativeNormal * nx;
                    rainbow.spdY = (Number(rainbow.spdY) || 0) - relativeNormal * ny;
                    other.spd = (Number(other.spd) || 0) + relativeNormal * nx;
                    other.spdY = (Number(other.spdY) || 0) + relativeNormal * ny;
                    sfxBounce();
                }
            } else {
                // For rectangular projectiles use the closest point on their hitbox.
                var isBox = other.type !== "sword" && other.type !== "bomb" &&
                    other.type !== "circle" && other.type !== "healCircle";
                if (isBox) {
                    var halfW = (Number(other.width) > 0 ? Number(other.width) : (Number(other.size) || 20)) * 0.5;
                    var halfH = (Number(other.height) > 0 ? Number(other.height) : (Number(other.size) || 20)) * 0.5;
                    var left = center.x - halfW, right = center.x + halfW;
                    var top = center.y - halfH, bottom = center.y + halfH;
                    var closestX = Math.max(left, Math.min(right, rainbow.x));
                    var closestY = Math.max(top, Math.min(bottom, rainbow.y));
                    dx = rainbow.x - closestX; dy = rainbow.y - closestY;
                    distance = Math.hypot(dx, dy);
                    if (distance > 0.001) {
                        nx = dx / distance; ny = dy / distance;
                        overlap = rainbowRadius - distance + 0.35;
                    } else {
                        var escapeLeft = Math.abs(rainbow.x - left);
                        var escapeRight = Math.abs(right - rainbow.x);
                        var escapeTop = Math.abs(rainbow.y - top);
                        var escapeBottom = Math.abs(bottom - rainbow.y);
                        var minEscape = Math.min(escapeLeft, escapeRight, escapeTop, escapeBottom);
                        if (minEscape === escapeLeft) { nx = -1; ny = 0; overlap = rainbowRadius + escapeLeft + 0.35; }
                        else if (minEscape === escapeRight) { nx = 1; ny = 0; overlap = rainbowRadius + escapeRight + 0.35; }
                        else if (minEscape === escapeTop) { nx = 0; ny = -1; overlap = rainbowRadius + escapeTop + 0.35; }
                        else { nx = 0; ny = 1; overlap = rainbowRadius + escapeBottom + 0.35; }
                    }
                } else {
                    overlap += 0.35;
                }

                rainbow.x += nx * overlap;
                rainbow.y += ny * overlap;
                var otherVX = otherStopped ? 0 : (Number(other.spd) || 0);
                var otherVY = otherStopped ? 0 : (Number(other.spdY) || 0);
                var approachSpeed = ((Number(rainbow.spd) || 0) - otherVX) * nx +
                    ((Number(rainbow.spdY) || 0) - otherVY) * ny;
                if (approachSpeed < 0) {
                    rainbow.spd = (Number(rainbow.spd) || 0) - 2 * approachSpeed * nx;
                    rainbow.spdY = (Number(rainbow.spdY) || 0) - 2 * approachSpeed * ny;
                    sfxBounce();
                }
            }
        }
    }
}

function spawnAttack() {
    if (arenaAttackType >= 11 && arenaAttackType <= 20) return;
    var s = arenaSpeedMult; var bw = arenaCurrentWave; var isEarly = bw < 100; var dmg = arenaBaseDmg;
    var shouldShrink = (typeof _superState !== 'undefined' && _superState.antispiralShrinkAttacks);
    switch (arenaAttackType) {
        case 0: spawnWallAttack(isEarly, dmg, shouldShrink); break;
        case 1: var chaosCount = isEarly ? 1 : 2; for (var i = 0; i < chaosCount; i++) { var side = Math.floor(Math.random() * 4); var x, y; if (side === 0) { x = Math.random() * 400; y = -30; } else if (side === 1) { x = Math.random() * 400; y = 530; } else if (side === 2) { x = -30; y = Math.random() * 500; } else { x = 430; y = Math.random() * 500; } var angle = Math.atan2(heart.y - y, heart.x - x); var atk = { type: "square", x: x, y: y, size: 20, spd: Math.cos(angle) * 2.0, spdY: Math.sin(angle) * 2.0, color: "#4499ff", damage: Math.floor(dmg / 2), bouncesLeft: 3 }; if (shouldShrink) shrinkAttack(atk); attacks.push(atk); } break;
        case 2: for (var i = 0; i < (isEarly ? 1 : 2); i++) { var side = Math.floor(Math.random() * 4); var xPos, yPos; if (side === 0) { xPos = Math.random() * 400; yPos = -40; } else if (side === 1) { xPos = Math.random() * 400; yPos = 540; } else if (side === 2) { xPos = -40; yPos = Math.random() * 500; } else { xPos = 440; yPos = Math.random() * 500; } var angle = Math.atan2(heart.y - yPos, heart.x - xPos); var atk = { type: "sword", x: xPos, y: yPos, angle: angle, size: 45, width: 15, color: "#ffaa00", spd: Math.cos(angle) * 2.4, spdY: Math.sin(angle) * 2.4, damageOnStanding: true, damage: Math.floor(dmg * 1.2), bouncesLeft: 0 }; if (shouldShrink) shrinkAttack(atk); attacks.push(atk); } break;
        case 3: for (var i = 0; i < (isEarly ? 1 : 2); i++) { var vx = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4) * s; var vy = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4) * s; var atk = { type: "danger", x: 200, y: 180, size: 70, spd: vx, spdY: vy, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.6), bouncesLeft: 1 }; if (shouldShrink) shrinkAttack(atk); attacks.push(atk); } break;
        case 4: for (var i = 0; i < (isEarly ? 2 : 3); i++) { var rx = (Math.random() - 0.5) * 2; var atk = { type: "square", x: heart.x + (Math.random() - 0.5) * 120, y: -40, size: 25, spd: rx, spdY: 1.8 + Math.random() * 1.0, color: "#ff69b4", knockback: 80, bouncesLeft: Infinity }; if (shouldShrink) shrinkAttack(atk); attacks.push(atk); } break;
        case 5: if (arenaHP < arenaMaxHP) { var atk = { type: "circle", x: Math.random() * 400, y: -30, radius: 18, spd: (Math.random() - 0.5) * 1.5, spdY: 2.5, color: "#44ff44", healPercent: 0.15, bouncesLeft: 2 }; if (shouldShrink) shrinkAttack(atk); attacks.push(atk); } else { var atk = { type: "square", x: Math.random() * 360 + 20, y: -30, size: 22, spd: 0, spdY: 3.0, color: "#fff", damage: dmg, bouncesLeft: 2 }; if (shouldShrink) shrinkAttack(atk); attacks.push(atk); } break;
        case 6: var atk6 = { type: "rainbow", x: 50 + Math.random() * 300, y: -60, radius: 30, spd: (Math.random() - 0.5) * 0.8, spdY: 1.2 + Math.random() * 0.5, color: "rainbow", oneshot: true, bouncesLeft: Infinity, _mbRainbowOrb: true, _mbRainbowEntered: false }; attacks.push(atk6); break;
        case 7: for (var i = 0; i < (isEarly ? 1 : 2); i++) { var side = Math.floor(Math.random() * 4); var sx, sy; if (side === 0) { sx = Math.random() * 400; sy = -40; } else if (side === 1) { sx = Math.random() * 400; sy = 540; } else if (side === 2) { sx = -40; sy = Math.random() * 500; } else { sx = 440; sy = Math.random() * 500; } var sa = Math.atan2(heart.y - sy, heart.x - sx); var atk1 = { type: "sword", x: sx, y: sy, angle: sa, size: 40, width: 12, color: "#ffaa00", spd: Math.cos(sa) * 2.2, spdY: Math.sin(sa) * 2.2, damageOnStanding: true, damage: Math.floor(dmg * 1.3), bouncesLeft: 0 }; var atk2 = { type: "danger", x: heart.x + (Math.random() - 0.5) * 100, y: 540, size: 25, spd: (Math.random() - 0.5) * 1.2, spdY: -2.2, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.3), bouncesLeft: 0 }; if (shouldShrink) { shrinkAttack(atk1); shrinkAttack(atk2); } attacks.push(atk1); attacks.push(atk2); } break;
        case 8: var atk81 = { type: "danger", x: -40, y: heart.y, size: 40, spd: 2.5 * s, spdY: 0, color: "#ff3333", damageOnMoving: true, damage: Math.floor(dmg * 1.5), bouncesLeft: 0 }; if (shouldShrink) shrinkAttack(atk81); attacks.push(atk81); if (!isEarly) { var atk82 = { type: "square", x: 440, y: heart.y + (Math.random() > 0.5 ? 60 : -60), size: 30, spd: -2.5 * s, spdY: 0, color: "#fff", damage: Math.floor(dmg * 1.5), bouncesLeft: 2 }; if (shouldShrink) shrinkAttack(atk82); attacks.push(atk82); } break;
        case 9: for (var i = 0; i < (isEarly ? 1 : (bw >= 500 ? 2 : 1)); i++) { var bx = 50 + Math.random() * 300; var by = 50 + Math.random() * 400; var atk = { type: "bomb", x: bx, y: by, timer: 60, maxRadius: isEarly ? 75 : (80 + Math.random() * 40), hit: false, damage: Math.floor(dmg * 2), bouncesLeft: 0, particlesSpawned: false, shakeTime: 0 }; if (shouldShrink) { if (atk.maxRadius) atk.maxRadius *= 0.7; } attacks.push(atk); } break;
        case 10: spawnBlaster(bw); break;
    }
}

function stopArena() {
    if (arenaDodgeTimerInterval) { clearInterval(arenaDodgeTimerInterval); arenaDodgeTimerInterval = null; }
    if (arenaPhaseTimeout) { clearTimeout(arenaPhaseTimeout); arenaPhaseTimeout = null; }
    if (wallWarningTimer) { clearTimeout(wallWarningTimer); wallWarningTimer = null; }
    if (typeof resetAllSupers === 'function') resetAllSupers();
    arenaActive = false; arenaExtendedState = null; stopArenaAmbient(); stopAntiSpiralMusic();
    if (arenaCurrentWave === 1500 && typeof currentMusic !== "undefined") {
        currentMusic = null;
        if (typeof musicEnabled !== "undefined" && musicEnabled && typeof startBattleMusic === "function") startBattleMusic();
    }
    if (arenaAttackInterval) clearInterval(arenaAttackInterval); if (animFrameId) cancelAnimationFrame(animFrameId);
    arenaAttackInterval = null; animFrameId = null;
    attacks = []; arenaClickTargets = []; arenaParticles = []; arenaTrail = []; floatingTexts = []; arenaBlasters = []; arenaShockwaves = [];
    arenaGERUniqueTrainingAttacks = []; arenaGERUniqueTrainingState = null;
    window.__mbGERUniqueTrainingAttacks = arenaGERUniqueTrainingAttacks;
    window._armorSpeedApplied = false;
    whitebeardRegenTimer = 0;
    document.getElementById("arenaOverlay").style.display = "none";
    var skipBtn = document.getElementById("skipBossBtn"); if (skipBtn) skipBtn.style.display = "none";
    var superBtn = document.getElementById("superBtn"); if (superBtn) superBtn.style.display = "none";
    var superBtn2 = document.getElementById("superBtn2"); if (superBtn2) superBtn2.style.display = "none";
    var superBtnDeact = document.getElementById("superBtnDeactivate"); if (superBtnDeact) superBtnDeact.style.display = "none";
    var mainCardDisplay = document.getElementById("arenaMainCardDisplay"); if (mainCardDisplay) mainCardDisplay.remove();
}

function winArena() {
    if (isJoystickTrainingMode()) return;
    if (typeof window !== "undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind === "arena") {
        stopArena();
        if (typeof window.MBBossTestFinish === "function") window.MBBossTestFinish("win", true);
        return;
    }
    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) { if (!defeatedBosses.includes(arenaCurrentWave)) defeatedBosses.push(arenaCurrentWave); }
    if (typeof grantBossGachaReward === 'function') grantBossGachaReward(arenaCurrentWave);
    if (typeof resetAllCooldowns === 'function') resetAllCooldowns();
    stopArena(); if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = Math.floor(currentEnemy.maxHp * 0.25);
    if (typeof victory === 'function') victory();
}

function loseArena() {
    if (isJoystickTrainingMode()) {
        arenaHP = arenaMaxHP;
        arenaKarma = 0;
        invulnTimer = 0;
        var trainingHp = document.getElementById("arenaHP");
        if (trainingHp) trainingHp.innerText = Math.ceil(arenaHP);
        return;
    }
    if (typeof window !== "undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind === "arena") {
        stopArena();
        if (typeof window.MBBossTestFinish === "function") window.MBBossTestFinish("loss", true);
        return;
    }
    if (typeof _superState !== 'undefined' && _superState.dandyAutoRevive) {
        _superState.dandyAutoRevive = false;
        arenaHP = Math.ceil(arenaMaxHP * 0.5);
        document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
        spawnFloatingText(heart.x, heart.y - 20, "ВОСКРЕС ДЭНДИ!", "#ffcc00");
        return;
    }
    if (typeof window.MBTryMarkResurrection === "function") {
        var markRestoredHp = window.MBTryMarkResurrection(arenaMaxHP);
        if (markRestoredHp > 0) {
            arenaHP = markRestoredHp;
            var markHpEl = document.getElementById("arenaHP");
            if (markHpEl) markHpEl.innerText = Math.ceil(arenaHP);
            invulnTimer = Math.max(Number(invulnTimer) || 0, 90);
            return;
        }
    }
    if (typeof resetAllCooldowns === 'function') resetAllCooldowns();
    if (typeof resetAllSupers === 'function') resetAllSupers();
    sfxArenaDeath(); arenaShake = 25; screenFlash = 25; screenFlashColor = "#ff0000";
    for (var j = 0; j < 60; j++) { var angle = Math.random() * Math.PI * 2; arenaParticles.push({ x: heart.x, y: heart.y, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, life: 40, maxLife: 40, color: "#ff0000", size: 3 + Math.random() * 6 }); }
    setTimeout(function() { stopArena(); if (typeof playerHp !== 'undefined') playerHp = 0; if (typeof defeat === 'function') defeat(); }, 1200);
}

// ★★★ ФИКС: Белоус 10% поглощение + Такаба ★★★
function applyHit(dmg, textMsg, isTrueOneshot, ignoreInvulnerability, sourceAction, damageCategory) {
    if (typeof window !== "undefined" && window.__mbBossTestMode && typeof window.MBBossTestModifyIncomingDamage === "function") {
        try { dmg = window.MBBossTestModifyIncomingDamage(dmg, "arena"); } catch(e) {}
        if (dmg <= 0) return;
    }
    // ★ БЕЛОУС + ТАКАБА: поглощение урона ★
    if (typeof applyWhitebeardPassiveReduction === 'function') {
        dmg = applyWhitebeardPassiveReduction(dmg);
    }
    
    if (textMsg === undefined) textMsg = null; if (isTrueOneshot === undefined) isTrueOneshot = false;
    if (typeof _superState !== 'undefined' && _superState.usoppInvuln) return;
    if (typeof _superState !== 'undefined' && _superState.garouInvulnTimer > 0) return;
    if (typeof _superState !== 'undefined' && _superState.dandyInvuln) return;
    if (typeof _superState !== 'undefined' && _superState.nikaActive) dmg = Math.floor(dmg * 0.6);
    if (typeof _superState !== 'undefined' && _superState.kaidoDmgReduction) dmg = Math.floor(dmg * 0.7);
    if (typeof _superState !== 'undefined' && _superState.garpHakiActive) dmg = Math.floor(dmg * 0.4);
    if (typeof _superState !== 'undefined' && _superState.dandyShield && _superState.dandyShield.timer > 0) dmg = Math.floor(dmg * _superState.dandyShield.mult);
    if (typeof _superState !== 'undefined' && _superState.dandyVulnerable && _superState.dandyVulnerable.timer > 0) dmg = Math.floor(dmg * _superState.dandyVulnerable.mult);
    if (typeof _superState !== 'undefined' && _superState.markBuffActive && _superState.markDmgReduction > 1) dmg = Math.floor(dmg / _superState.markDmgReduction);
    if(typeof getTakabaCombatModifiers==="function"){try{dmg=Math.max(1,Math.floor(dmg*getTakabaCombatModifiers().damageTakenMult));}catch(e){}}
    if (invulnTimer > 0 && !ignoreInvulnerability) return;
    if (typeof window.gojoTryNegateIncoming === "function" && window.gojoTryNegateIncoming(dmg, "arena")) return;
    if (typeof window.MBGERTryNullifyDamage === "function" &&
        window.MBGERTryNullifyDamage(dmg, sourceAction, damageCategory || (isTrueOneshot ? "instant" : "combat"))) {
        invulnTimer = Math.max(invulnTimer || 0, 18);
        return;
    }
    if (typeof onTakabaDamageTaken === "function") {
        try { onTakabaDamageTaken(dmg); } catch(e) {}
    }
    if (isJoystickTrainingMode()) {
        // Preserve hit reactions and passive triggers, but never reduce training HP.
        arenaHP = arenaMaxHP;
        arenaKarma = 0;
        invulnTimer = 0;
    } else {
        if (typeof window.MBKarsProcessIncomingDamage === "function") dmg = window.MBKarsProcessIncomingDamage(dmg);
        if (sourceAction && typeof window.MBGoldExperienceRedirectDamage === "function") {
            var geRedirectedDamage = window.MBGoldExperienceRedirectDamage(dmg, typeof getBossContext === "function" ? getBossContext() : null, sourceAction);
            if (geRedirectedDamage !== null) { dmg = geRedirectedDamage; textMsg = "удар по Gold Experience. Джорно получает 50% урона"; }
        }
        if (window.__mbGERTrainingMode === true && window.__mbBossTestMode && window.__mbBossTestMode.invulnerable) {
            // Keep the hit/interception callbacks alive for GER training, but never consume Giorno HP.
            arenaHP = arenaMaxHP;
            arenaKarma = 0;
            invulnTimer = 0;
        } else {
            if (arenaAttackType !== 10 && !ignoreInvulnerability) invulnTimer = 45;
            if (isTrueOneshot || dmg >= arenaMaxHP) { arenaHP = 0; }
            else { var directDmg = 1; var karmaDmg = dmg - directDmg; if (karmaDmg < 0) karmaDmg = 0; arenaHP -= directDmg; arenaKarma += karmaDmg; }
        }
    }
    arenaHitFlash = 12; arenaShake = 18; sfxArenaHit(); screenFlash = 6; screenFlashColor = "#ff4444"; arenaVignette = 15;
    arenaShockwaves.push({ x: heart.x, y: heart.y, r: 5, v: 5, life: 20, maxLife: 20, color: "rgba(255,50,50,0.8)" });
    spawnFloatingText(heart.x, heart.y - 20, textMsg || "-" + dmg, "#ff3333"); document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP));
    for (var j = 0; j < 35; j++) { arenaParticles.push({ x: heart.x, y: heart.y, vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16, life: 28, maxLife: 28, color: "#ff2222", size: 2 + Math.random() * 4 }); }
    if (Math.ceil(arenaHP) <= 0) loseArena();
}

// ★★★ БЕЛОУС: регенерация 2% HP каждые 5 сек ★★★
function tickWhitebeardRegenArena(dt) {
    try {
        if (typeof team === 'undefined' || !Array.isArray(team)) return;
        if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return;
        var hasWhitebeard = false;
        for (var i = 0; i < team.length; i++) {
            var idx = team[i];
            var cd = myCards[idx];
            if (cd && cd.name === "Белоус") {
                if (typeof hasMasteryAbility === 'function' && !hasMasteryAbility(cd)) continue;
                if (typeof mainCardIndex === 'undefined' || team[mainCardIndex] !== idx) continue;
                hasWhitebeard = true;
                break;
            }
        }
        if (!hasWhitebeard) {
            whitebeardRegenTimer = 0;
            return;
        }
        
        whitebeardRegenTimer += dt;
        if (whitebeardRegenTimer >= 5) {
            whitebeardRegenTimer = 0;
            
            if (arenaHP >= arenaMaxHP) return;
            
            var heal = Math.floor(arenaMaxHP * 0.02);
            arenaHP = Math.min(arenaMaxHP, arenaHP + heal);
            
            var hpEl = document.getElementById("arenaHP");
            if (hpEl) hpEl.innerText = Math.ceil(arenaHP);
            
            spawnFloatingText(heart.x, heart.y - 25, "+" + heal + " 🌊", "#66ccff");
            
            for (var i = 0; i < 8; i++) {
                var ang = (i / 8) * Math.PI * 2;
                arenaParticles.push({
                    x: heart.x + Math.cos(ang) * 20,
                    y: heart.y + Math.sin(ang) * 20,
                    vx: Math.cos(ang) * 1.5,
                    vy: Math.sin(ang) * 1.5 - 1,
                    life: 30, maxLife: 30,
                    color: "#66ccff", size: 3
                });
            }
            
            playArenaSound(600, 'sine', 0.15, 0.05);
        }
    } catch(e) {}
}

function drawActiveBuffs() {
    if (!ctx || typeof _superState === 'undefined') return;
    var lines = [];
    if (_superState.dekusActive) lines.push("⚡Деку: 100%");
    if (_superState.borosHeal && _superState.borosHeal.active) { var remain = (_superState.borosHeal.totalDuration - _superState.borosHeal.elapsed).toFixed(1); lines.push("💚Борос: реген " + remain + "с"); }
    if (_superState.usoppInvuln) lines.push("⭐Усопп: неуязвим");
    if (_superState.usoppStunTimer > 0) lines.push("💫Усопп: оглушение " + _superState.usoppStunTimer.toFixed(1) + "с");
    if (_superState.nikaActive) lines.push("☀️Луффи: Ника");
    if (_superState.garouInvulnTimer > 0) lines.push("🟠Гароу: неуязвимость " + _superState.garouInvulnTimer.toFixed(1) + "с");
    if (_superState.garpChargeTimer > 0) lines.push("🔴Гарп: зарядка Хаки " + _superState.garpChargeTimer.toFixed(1) + "с");
    if (_superState.garpHakiActive) lines.push("🔴Гарп: Хаки " + _superState.garpHakiTimer.toFixed(1) + "с");
    if (_superState.imAuraActive) lines.push("🟣Им: аура");
    if (_superState.antispiralActive) lines.push("🔵Анти-спираль: сжатие");
    if (_superState.dandyInvuln) lines.push("🌟Дэнди: неуязвимость");
    if (_superState.dandyShield && _superState.dandyShield.timer > 0) lines.push("🛡️Дэнди: щит " + _superState.dandyShield.timer.toFixed(1) + "с");
    if (_superState.dandyVulnerable && _superState.dandyVulnerable.timer > 0) lines.push("☠️Дэнди: уязвимость " + _superState.dandyVulnerable.timer.toFixed(1) + "с");
    if (_superState.dandyDmgBuff && _superState.dandyDmgBuff.timer > 0) lines.push("⚔️Дэнди: урон x" + _superState.dandyDmgBuff.mult + " " + _superState.dandyDmgBuff.timer.toFixed(1) + "с");
    if (_superState.dandyLightnings) lines.push("⚡Дэнди: молнии");
    if (_superState.dandyDarkness > 0) lines.push("🌑Дэнди: темнота " + _superState.dandyDarkness.toFixed(1) + "с");
    if (_superState.dandyAura > 0) lines.push("🔥Дэнди: аура " + _superState.dandyAura.toFixed(1) + "с");
    if (_superState.dandyLava > 0) lines.push("🌋Дэнди: лава " + _superState.dandyLava.toFixed(1) + "с");
    if (_superState.dandyAutoRevive) lines.push("💫Дэнди: воскрешение готово");
    if (_superState.kaidoDrinking) lines.push("🍺Кайдо: глоток");
    if (_superState.kaidoBuffActive) lines.push("🔥Кайдо: ярость");
    if (_superState.allmightBuffTimer > 0) lines.push("💛Всемогущий: бафф " + _superState.allmightBuffTimer.toFixed(1) + "с");
    if (_superState.allmightPermaSlow) lines.push("💔Всемогущий: истощён НАВСЕГДА");
    if (_superState.markBuffActive) lines.push("💛Марк: бафф " + _superState.markBuffTimer.toFixed(1) + "с");
    if (_superState.invertControls) lines.push("🔄Инверт упр.");
    if (lines.length === 0) return;
    var textX = 14, textY = 52, lineHeight = 12, padding = 4, maxWidth = 0;
    ctx.font = "bold 9px monospace";
    for (var li = 0; li < lines.length; li++) { var w = ctx.measureText(lines[li]).width; if (w > maxWidth) maxWidth = w; }
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(textX - padding, textY - padding - 2, maxWidth + padding * 2, lines.length * lineHeight + padding * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1; ctx.strokeRect(textX - padding, textY - padding - 2, maxWidth + padding * 2, lines.length * lineHeight + padding * 2);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 9px monospace"; ctx.textBaseline = "middle";
    for (var li = 0; li < lines.length; li++) { ctx.fillText(lines[li], textX, textY + li * lineHeight); }
}

function drawMarkResurrections() {
    if (!ctx || typeof _superState === 'undefined') return;
    var mainCard = typeof getMainCard === 'function' ? getMainCard() : null;
    if (!mainCard || mainCard.name !== "Император Марк") return;
    if (_superState.markResurrectCharges <= 0) return;
    var text = "💀Марк: воскрешения " + _superState.markResurrectCharges;
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.font = "bold 9px monospace"; var w = ctx.measureText(text).width + 8;
    ctx.fillRect(14, 48, w, 14); ctx.strokeStyle = "rgba(255,215,0,0.5)"; ctx.lineWidth = 1; ctx.strokeRect(14, 48, w, 14);
    ctx.fillStyle = "#ffd700"; ctx.fillText(text, 18, 58); ctx.restore();
}

function drawObesityWarning() {
    if (!ctx) return;
    if (typeof obesityPoints === 'undefined' || obesityPoints <= 0) return;

    var obStage = (typeof getObesityStageName === "function") ? getObesityStageName() : null;
    var obesityMult = (typeof getObesitySpeedMult === "function") ? getObesitySpeedMult() : 1;
    var speedPenalty = Math.round((1 - obesityMult) * 100);
    var obName = obStage || "НАБОР ВЕСА";
    var detail = speedPenalty > 0 ? " · СКОРОСТЬ -" + speedPenalty + "%" : "";
    var text = "🍔 " + obName + " (" + obesityPoints + "/60)" + detail;
    var obColor = speedPenalty >= 40 ? "#e74c3c" : speedPenalty > 0 ? "#e67e22" : "#d6a85a";

    ctx.save();
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var w = Math.max(150, ctx.measureText(text).width + 18);
    var h = 22;
    var x = 200 - w / 2;
    var y = 470;
    var pulse = 0.78 + Math.abs(Math.sin(performance.now() / 300)) * 0.22;
    ctx.fillStyle = "rgba(0,0,0,0.86)";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.strokeStyle = obColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulse;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = obColor;
    ctx.fillText(text, 200, y + h / 2);
    ctx.restore();
}

// ★★★ ТАКАБА: показать шутку ★★★
function drawTakabaJoke() {
    if (!ctx || typeof _superState === 'undefined') return;
    if (!_superState.takabaJokeActive) return;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(30, 200, 340, 100);
    ctx.strokeStyle = "#ff66ff";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ff66ff";
    ctx.shadowBlur = 20;
    ctx.strokeRect(30, 200, 340, 100);
    ctx.shadowBlur = 0;
    
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff66ff";
    ctx.fillText("🎭 ТАКАБА ГОВОРИТ:", 200, 220);
    
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#ffffff";
    var words = _superState.takabaCurrentJoke.split(' ');
    var line = '';
    var y = 245;
    for (var i = 0; i < words.length; i++) {
        var testLine = line + words[i] + ' ';
        if (testLine.length > 40 && line.length > 0) {
            ctx.fillText(line, 200, y);
            y += 16;
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }
    if (line) ctx.fillText(line, 200, y);
    
    ctx.restore();
}


function gerUniqueTrainingPushAttack(attack) {
    if (!attack || !Array.isArray(arenaGERUniqueTrainingAttacks)) return;
    attack.id = "geru_" + (++arenaGERUniqueTrainingState.sequence);
    attack.elapsed = 0;
    attack.lifeMs = Math.max(700, Number(attack.lifeMs) || 4200);
    if (attack.type === "laser" || attack.type === "spike") attack.state = attack.state || "warning";
    attack.attackKind = String(attack.attackKind || "unique_pattern");
    attack.sourceName = String(attack.sourceName || "Уникальный босс");
    arenaGERUniqueTrainingAttacks.push(attack);
    if (arenaGERUniqueTrainingAttacks.length > 78) arenaGERUniqueTrainingAttacks.splice(0, arenaGERUniqueTrainingAttacks.length - 78);
}
function gerUniqueTrainingProjectile(sourceName, attackKind, x, y, vx, vy, color, radius, extra) {
    var attack = {
        type: "circle", shape: "orb", sourceName: sourceName, attackKind: attackKind,
        x: x, y: y, vx: vx, vy: vy, radius: radius || 9, size: (radius || 9) * 2,
        color: color || "#ffffff", damage: 10, lifeMs: 4700
    };
    Object.assign(attack, extra || {});
    gerUniqueTrainingPushAttack(attack);
}
function spawnGERUniqueTrainingPattern() {
    if (!isGERUniqueMixTraining() || !arenaGERUniqueTrainingState) return;
    var st = arenaGERUniqueTrainingState;
    var speed = Math.max(1, Math.min(5, Number(window.__mbGERTrainingOptions.speedMultiplier) || 2));
    var wave = Math.max(50, Math.min(10000, Number(window.__mbGERTrainingOptions.attackWave) || 500));
    var intensity = Math.max(0.7, Math.min(2.2, Math.sqrt(wave / 500)));
    var scale = (0.85 + speed * 0.28) * intensity;
    var pattern = st.patternIndex++ % 20;
    var i, x, y, angle, count, source, kind;
    if (pattern === 0) {
        source = "Живой Камень"; kind = "stone_rock_volley";
        for (i = 0; i < 6; i++) gerUniqueTrainingProjectile(source, kind, 28 + i * 68, -24 - (i % 2) * 48,
            (i % 2 ? -0.45 : 0.45) * scale, (2.4 + (i % 3) * 0.35) * scale, "#a9b1ba", 11 + (i % 2) * 2,
            { shape: "rock", lifeMs: 5600 });
    } else if (pattern === 1) {
        source = "Живой Камень"; kind = "stone_laser_lane";
        for (i = 0; i < 2; i++) gerUniqueTrainingPushAttack({
            type: "laser", shape: "beam", sourceName: source, attackKind: kind,
            x: 92 + i * 216, y: 250, direction: "vertical", orientation: "vertical",
            width: 34, height: 500, color: "#b8f0ff", warningMs: 720, activeMs: 960, lifeMs: 1750, damage: 18
        });
    } else if (pattern === 2) {
        source = "Живой Камень"; kind = "stone_ground_spikes";
        for (i = 0; i < 4; i++) gerUniqueTrainingPushAttack({
            type: "spike", shape: "spike_lane", sourceName: source, attackKind: kind,
            x: 55 + i * 96, y: 500, width: 48, height: 92, color: "#93e5b0",
            warningMs: 820, activeMs: 800, lifeMs: 1900, damage: 15
        });
    } else if (pattern === 3) {
        source = "Путеводная Звезда"; kind = "waystar_meteor_shower";
        for (i = 0; i < 7; i++) gerUniqueTrainingProjectile(source, kind, -20 + i * 72, -28 - (i % 3) * 58,
            (0.75 + (i % 3) * 0.28) * scale, (2.5 + (i % 2) * 0.7) * scale, "#f6d87d", 8 + (i % 3),
            { shape: "meteor", lifeMs: 5200 });
    } else if (pattern === 4) {
        source = "Путеводная Звезда"; kind = "waystar_spiral_stars";
        count = 12;
        for (i = 0; i < count; i++) {
            angle = i / count * Math.PI * 2;
            gerUniqueTrainingProjectile(source, kind, 200, 128, Math.cos(angle) * 2.6 * scale, Math.sin(angle) * 2.6 * scale,
                "#ffe9a1", 6, { shape: "star", lifeMs: 5200 });
        }
    } else if (pattern === 5) {
        source = "Путеводная Звезда"; kind = "waystar_giant_beam";
        gerUniqueTrainingPushAttack({
            type: "laser", shape: "beam", sourceName: source, attackKind: kind,
            x: 200, y: 168 + Math.random() * 240, direction: "horizontal", orientation: "horizontal",
            width: 390, height: 36, color: "#fff0a8", warningMs: 880, activeMs: 720, lifeMs: 1780, damage: 20
        });
    } else if (pattern === 6) {
        source = "Роджер и Белоус"; kind = "whitebeard_haki_wave";
        gerUniqueTrainingPushAttack({
            type: "laser", shape: "haki_wave", sourceName: source, attackKind: kind,
            x: 200, y: 110 + Math.random() * 280, direction: "horizontal", orientation: "horizontal",
            width: 400, height: 60, color: "#8ceaff", warningMs: 500, activeMs: 1150, lifeMs: 1800, damage: 22
        });
    } else if (pattern === 7) {
        source = "Роджер и Белоус"; kind = "roger_whitebeard_fist_barrage";
        for (i = 0; i < 5; i++) {
            var fromLeft = i % 2 === 0;
            gerUniqueTrainingProjectile(source, kind, fromLeft ? -24 : 424, 80 + i * 78,
                (fromLeft ? 1 : -1) * (3.1 + (i % 2) * 0.5) * scale, (i % 2 ? -0.35 : 0.35) * scale,
                "#e7f4ff", 12, { shape: "fist", lifeMs: 3900 });
        }
    } else if (pattern === 8) {
        source = "Роджер и Белоус"; kind = "whitebeard_quake_ring";
        gerUniqueTrainingPushAttack({
            type: "ring", shape: "ring", sourceName: source, attackKind: kind,
            x: 200, y: 130, radius: 14, speed: 3.1 * scale, thickness: 18, width: 18,
            color: "#d9f7ff", lifeMs: 3800, damage: 22
        });
    } else if (pattern === 9) {
        source = "Гол Д. Роджер"; kind = "roger_cross_slash";
        for (i = 0; i < 2; i++) gerUniqueTrainingPushAttack({
            type: "laser", shape: "slash", sourceName: source, attackKind: kind,
            x: 200, y: 165 + i * 165, direction: "horizontal", orientation: "horizontal",
            width: 400, height: 27, color: "#f4f7ff", warningMs: 560 + i * 180, activeMs: 660, lifeMs: 1440, damage: 20
        });
    } else if (pattern === 10) {
        source = "Супер-Живой Камень"; kind = "stone_super_ricochet_plates";
        for (i = 0; i < 5; i++) {
            angle = (i / 5) * Math.PI * 2 + 0.25;
            gerUniqueTrainingProjectile(source, kind, 200, 135, Math.cos(angle) * 2.9 * scale, Math.sin(angle) * 2.9 * scale,
                "#91f3bb", 10, { shape: "plate", bounces: 3, lifeMs: 6000 });
        }
    } else if (pattern === 11) {
        source = "Супер-Живой Камень"; kind = "stone_super_boomerang";
        gerUniqueTrainingProjectile(source, kind, 36, 120 + Math.random() * 190, 4.1 * scale, 1.1 * scale,
            "#b7ffd0", 13, { shape: "boomerang", turnAtMs: 900, lifeMs: 2600 });
        gerUniqueTrainingProjectile(source, kind, 364, 150 + Math.random() * 180, -4.1 * scale, -1.0 * scale,
            "#b7ffd0", 13, { shape: "boomerang", turnAtMs: 900, lifeMs: 2600 });
    } else if (pattern === 12) {
        source = "Супер-Живой Камень"; kind = "stone_super_green_spear_fan";
        for (i = 0; i < 7; i++) {
            angle = Math.PI * (0.18 + i * 0.106);
            gerUniqueTrainingProjectile(source, kind, 200, 130, Math.cos(angle) * 3.0 * scale, Math.sin(angle) * 3.0 * scale,
                "#82ff9e", 7, { shape: "spear", lifeMs: 5000 });
        }
    } else if (pattern === 13) {
        source = "Супер-Живой Камень"; kind = "stone_super_predicted_ground_strike";
        x = 48 + Math.floor(Math.random() * 6) * 60;
        gerUniqueTrainingPushAttack({
            type: "spike", shape: "ground_warning", sourceName: source, attackKind: kind,
            x: x, y: 500, width: 74, height: 128, color: "#92ffb2",
            warningMs: 980, activeMs: 760, lifeMs: 1950, damage: 24
        });
    } else if (pattern === 14) {
        source = "Роджер и Белоус"; kind = "quake_plus_haki";
        gerUniqueTrainingPushAttack({
            type: "ring", shape: "ring", sourceName: source, attackKind: kind,
            x: 200, y: 128, radius: 8, speed: 2.5 * scale, thickness: 16, width: 16,
            color: "#8ceaff", lifeMs: 3600, damage: 18
        });
        for (i = 0; i < 3; i++) gerUniqueTrainingProjectile(source, kind, 70 + i * 130, -18,
            (i - 1) * 0.7 * scale, 3.7 * scale, "#e8f7ff", 10, { shape: "rock", lifeMs: 3700 });
    } else if (pattern === 15) {
        source = "Путеводная Звезда"; kind = "waystar_starfall";
        for (i = 0; i < 9; i++) {
            x = 20 + i * 45;
            gerUniqueTrainingProjectile(source, kind, x, -16 - (i % 2) * 35, (i % 2 ? -0.35 : 0.35) * scale,
                (2.3 + (i % 3) * 0.45) * scale, "#ffe5a3", 7 + (i % 2) * 2, { shape: "star", lifeMs: 4400 });
        }
    } else if (pattern === 16) {
        source = "Путеводная Звезда"; kind = "waystar_sun_shards";
        for (i = 0; i < 6; i++) {
            angle = i / 6 * Math.PI * 2 + 0.3;
            gerUniqueTrainingProjectile(source, kind, 200, 128,
                Math.cos(angle) * 3.8 * scale, Math.sin(angle) * 3.8 * scale,
                "#fff0b0", 9, { shape: "meteor", lifeMs: 3800 });
        }
    } else if (pattern === 17) {
        source = "Белоус"; kind = "whitebeard_tsunami";
        gerUniqueTrainingPushAttack({
            type: "laser", shape: "tsunami_wave", sourceName: source, attackKind: kind,
            x: 200, y: 430, vy: -0.75 * scale, direction: "horizontal", orientation: "horizontal",
            width: 400, height: 105, color: "#78ddff", warningMs: 520, activeMs: 1900, lifeMs: 2450, damage: 25
        });
    } else if (pattern === 18) {
        source = "Гол Д. Роджер"; kind = "roger_dual_slash";
        gerUniqueTrainingPushAttack({
            type: "laser", shape: "slash", sourceName: source, attackKind: kind,
            x: 118, y: 250, direction: "vertical", orientation: "vertical",
            width: 28, height: 500, color: "#f2f5ff", warningMs: 640, activeMs: 850, lifeMs: 1550, damage: 24
        });
        gerUniqueTrainingPushAttack({
            type: "laser", shape: "slash", sourceName: source, attackKind: kind,
            x: 282, y: 250, direction: "vertical", orientation: "vertical",
            width: 28, height: 500, color: "#f2f5ff", warningMs: 840, activeMs: 850, lifeMs: 1750, damage: 24
        });
    } else {
        source = "Живой Камень"; kind = "stone_crystal_pillars";
        for (i = 0; i < 5; i++) gerUniqueTrainingPushAttack({
            type: "spike", shape: "crystal_pillar", sourceName: source, attackKind: kind,
            x: 42 + i * 78, y: 500, width: 50, height: 65 + (i % 2) * 42,
            color: "#b9e5f7", warningMs: 560 + (i % 2) * 180, activeMs: 760, lifeMs: 1550, damage: 20
        });
    }
}
function updateGERUniqueTrainingAttacks(nowTime) {
    if (!isGERUniqueMixTraining() || !arenaActive || !ctx || !arenaGERUniqueTrainingState) return;
    if (arenaBossMaxHP <= 0) { winArena(); return; }
    var st = arenaGERUniqueTrainingState;
    var delta = Math.max(0, Math.min(50, nowTime - (st.lastNow || nowTime)));
    st.lastNow = nowTime;
    var options = window.__mbGERTrainingOptions || {};
    var speed = Math.max(1, Math.min(5, Number(options.speedMultiplier) || 2));
    var wave = Math.max(50, Math.min(10000, Number(options.attackWave) || 500));
    var intensity = Math.max(0.7, Math.min(2.2, Math.sqrt(wave / 500)));
    var interval = Math.max(360, 1250 / (0.8 + speed * 0.42) / intensity);
    if (nowTime >= st.nextSpawnAt) {
        spawnGERUniqueTrainingPattern();
        st.nextSpawnAt = nowTime + interval;
    }
    var frameScale = delta / 16.667 * speed;
    for (var i = arenaGERUniqueTrainingAttacks.length - 1; i >= 0; i--) {
        var a = arenaGERUniqueTrainingAttacks[i];
        a.elapsed += delta * speed;
        if (a.type === "laser" || a.type === "spike") {
            if (a.type === "laser") { a.x += (Number(a.vx) || 0) * frameScale; a.y += (Number(a.vy) || 0) * frameScale; }
            if (a.elapsed >= (Number(a.warningMs) || 0) && !a.active) {
                a.active = true;
                a.state = "active";
            }
            if (a.elapsed >= (Number(a.warningMs) || 0) + (Number(a.activeMs) || 900)) {
                arenaGERUniqueTrainingAttacks.splice(i, 1);
                continue;
            }
        } else {
            if (a.shape === "boomerang" && a.elapsed >= (Number(a.turnAtMs) || 900) && !a.returning) {
                a.returning = true;
                a.vx *= -1;
                a.vy *= -1;
            }
            a.x += (Number(a.vx) || 0) * frameScale;
            a.y += (Number(a.vy) || 0) * frameScale;
            if (a.type === "ring") {
                a.radius += (Number(a.speed) || 0) * frameScale;
                if (a.radius > 430) { arenaGERUniqueTrainingAttacks.splice(i, 1); continue; }
            }
            if (a.bounces > 0) {
                var r = Math.max(5, Number(a.radius) || Number(a.size) * 0.5 || 8);
                if (a.x < r || a.x > 400 - r) { a.vx *= -1; a.x = Math.max(r, Math.min(400 - r, a.x)); a.bounces--; }
                if (a.y < r || a.y > 500 - r) { a.vy *= -1; a.y = Math.max(r, Math.min(500 - r, a.y)); a.bounces--; }
            }
            if (a.elapsed >= a.lifeMs || a.x < -90 || a.x > 490 || a.y < -100 || a.y > 590) {
                arenaGERUniqueTrainingAttacks.splice(i, 1);
                continue;
            }
        }
        var isWarning = (a.type === "laser" || a.type === "spike") && !a.active;
        if (!isWarning && !a.dioStandHitOnce && typeof window.MBGoldExperienceTryStandHit === "function") {
            var trainingContext = typeof getBossContext === "function" ? getBossContext() : null;
            if (trainingContext && window.MBGoldExperienceTryStandHit(trainingContext, a)) {
                arenaGERUniqueTrainingAttacks.splice(i, 1);
                continue;
            }
        }
        var alpha = isWarning ? (0.35 + 0.25 * Math.sin(nowTime / 65)) : 0.88;
        ctx.save();
        ctx.globalAlpha = alpha;
        if (a.type === "spike") {
            var spikeHeight = Math.max(20, Number(a.height) || 90);
            var spikeWidth = Math.max(16, Number(a.width) || 48);
            var sx = Number(a.x) || 200;
            ctx.fillStyle = a.color || "#9cffb4";
            ctx.strokeStyle = "rgba(240,255,245,.9)";
            ctx.shadowColor = a.color || "#9cffb4";
            ctx.shadowBlur = isWarning ? 4 : 14;
            ctx.beginPath();
            ctx.moveTo(sx - spikeWidth / 2, 500);
            ctx.lineTo(sx, 500 - spikeHeight);
            ctx.lineTo(sx + spikeWidth / 2, 500);
            ctx.closePath();
            if (!isWarning) ctx.fill();
            ctx.stroke();
        } else if (a.type === "laser") {
            var horizontal = a.direction === "horizontal" || a.orientation === "horizontal";
            ctx.lineCap = "round";
            ctx.lineWidth = isWarning ? Math.max(3, Number(a.width) * 0.3) : Math.max(7, Number(a.width) || 24);
            ctx.strokeStyle = a.color || "#ffffff";
            ctx.shadowColor = a.color || "#ffffff";
            ctx.shadowBlur = isWarning ? 5 : 18;
            ctx.setLineDash(isWarning ? [9, 7] : []);
            ctx.beginPath();
            if (horizontal) {
                ctx.moveTo(0, a.y);
                ctx.lineTo(400, a.y);
            } else {
                ctx.moveTo(a.x, 0);
                ctx.lineTo(a.x, 500);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            if (isWarning) {
                ctx.fillStyle = a.color || "#ffffff";
                ctx.font = "bold 10px monospace";
                ctx.textAlign = "center";
                ctx.fillText("АТАКА", horizontal ? a.x : a.x + 22, horizontal ? a.y - 12 : 250);
            }
        } else if (a.type === "ring") {
            ctx.strokeStyle = a.color || "#9beaff";
            ctx.lineWidth = Math.max(3, Number(a.thickness) || 16);
            ctx.shadowColor = a.color || "#9beaff";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(a.x, a.y, Math.max(1, a.radius), 0, Math.PI * 2);
            ctx.stroke();
        } else {
            var radius = Math.max(5, Number(a.radius) || Number(a.size) * 0.5 || 9);
            ctx.translate(a.x, a.y);
            if (a.shape === "plate" || a.shape === "boomerang" || a.shape === "spear") {
                var rotation = Math.atan2(Number(a.vy) || 0, Number(a.vx) || 1);
                ctx.rotate(rotation);
                ctx.fillStyle = a.color || "#aaffc8";
                ctx.strokeStyle = "rgba(255,255,255,.9)";
                ctx.shadowColor = a.color || "#aaffc8";
                ctx.shadowBlur = 10;
                ctx.beginPath();
                if (a.shape === "spear") {
                    ctx.moveTo(radius * 1.8, 0); ctx.lineTo(-radius, -radius * 0.55);
                    ctx.lineTo(-radius * 0.55, 0); ctx.lineTo(-radius, radius * 0.55);
                } else if (a.shape === "boomerang") {
                    ctx.moveTo(-radius, -radius); ctx.quadraticCurveTo(radius * 1.5, 0, -radius, radius);
                    ctx.lineTo(-radius * 0.2, 0);
                } else {
                    ctx.moveTo(0, -radius * 1.25); ctx.lineTo(radius * 1.2, 0);
                    ctx.lineTo(0, radius * 1.25); ctx.lineTo(-radius * 1.2, 0);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();
            } else {
                ctx.fillStyle = a.color || "#ffffff";
                ctx.strokeStyle = "rgba(255,255,255,.78)";
                ctx.shadowColor = a.color || "#ffffff";
                ctx.shadowBlur = a.shape === "meteor" ? 16 : 9;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                if (a.shape === "meteor" || a.shape === "rock") {
                    ctx.strokeStyle = "rgba(255,255,255,.65)";
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(-radius * 0.5, -radius * 0.45); ctx.lineTo(radius * 0.45, radius * 0.35); ctx.stroke();
                }
            }
        }
        ctx.restore();
    }
    // Fixed central dummy: the attack stream never takes the player's position as a target.
    ctx.save();
    var pulse = 0.86 + Math.sin(nowTime / 260) * 0.08;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = "#f2d477";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#29313b";
    ctx.strokeStyle = "#d8c27b";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(200, 128, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f3d77e";
    ctx.beginPath(); ctx.arc(200, 128, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,239,179,.8)";
    ctx.lineWidth = 1.4;
    for (var k = 0; k < 4; k++) {
        var a = nowTime / 850 + k * Math.PI / 2;
        ctx.beginPath(); ctx.arc(200, 128, 29 + k * 2, a, a + 0.72); ctx.stroke();
    }
    ctx.fillStyle = "#fff0b3";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("TRAINING TARGET", 200, 165);
    ctx.restore();
    if (arenaBossMaxHP <= 0) winArena();
}

function renderArena() {
    if (!arenaActive || !ctx) return;
    var reduceBossEffects = !!(window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects());
    if (reduceBossEffects) {
        arenaShake = 0; screenFlash = 0; arenaVignette = 0;
        if (typeof _superState !== "undefined") { _superState.screenFlashWhite = 0; _superState.screenShakeAmount = 0; }
        if (arenaParticles.length > 18) arenaParticles.splice(0, arenaParticles.length - 18);
        if (arenaShockwaves.length > 5) arenaShockwaves.splice(0, arenaShockwaves.length - 5);
        if (arenaTrail.length > 8) arenaTrail.splice(0, arenaTrail.length - 8);
        if (floatingTexts.length > 8) floatingTexts.splice(0, floatingTexts.length - 8);
    } else if (window.MBIsMediumGraphics && window.MBIsMediumGraphics()) {
        if (arenaParticles.length > 90) arenaParticles.splice(0, arenaParticles.length - 90);
        if (arenaShockwaves.length > 24) arenaShockwaves.splice(0, arenaShockwaves.length - 24);
        if (arenaTrail.length > 30) arenaTrail.splice(0, arenaTrail.length - 30);
        if (floatingTexts.length > 24) floatingTexts.splice(0, floatingTexts.length - 24);
    }

    if (typeof tickSupers === 'function') tickSupers();
    if (typeof arenaSettings !== 'undefined' && arenaSettings.autoSuper) {
        var mainCard = typeof getMainCard === 'function' ? getMainCard() : null;
        if (mainCard && typeof _superCooldowns !== 'undefined' && _superCooldowns[mainCard.name] && _superCooldowns[mainCard.name].ready) {
            if (typeof hasMasterySuper !== 'function' || hasMasterySuper(mainCard)) {
                if (typeof toggleSuper === 'function') toggleSuper();
            }
        }
    }
    var now = Date.now();
    updateAntiSpiralArena(now);
    // ★ ФИКС: Такаба замораживает всех ★
    var takabaFreeze = (typeof _superState !== 'undefined' && _superState.takabaTimeStop);
    
    if (arenaPhase === "dodge" && !takabaFreeze) { moveHeart(); if (arenaAllowedTypes.includes(10) && !heartWasMoving) { var bw = arenaCurrentWave; var ct = bw >= 700 ? 70 : (bw >= 350 ? 90 : 110); if (heartStandingTime > ct) { spawnBlaster(bw); heartStandingTime = 0; } } }
    if (arenaKarma > 0) { var drain = Math.max(0.15, arenaKarma * 0.05); if (arenaKarma < drain) drain = arenaKarma; arenaKarma -= drain; if (arenaHP > 1) { arenaHP -= drain; if (arenaHP < 1) arenaHP = 1; } document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP)); }
    if (ghostBossHP > arenaBossMaxHP) { ghostBossHP -= (ghostBossHP - arenaBossMaxHP) * 0.08; if (ghostBossHP - arenaBossMaxHP < 1) ghostBossHP = arenaBossMaxHP; }
    if (ghostBossHP < arenaBossMaxHP) ghostBossHP = arenaBossMaxHP;
    
    var superShakeX = 0, superShakeY = 0;
    if (!reduceBossEffects && typeof _superState !== 'undefined' && _superState.screenShakeAmount > 0) { superShakeX = (Math.random() - 0.5) * _superState.screenShakeAmount; superShakeY = (Math.random() - 0.5) * _superState.screenShakeAmount; }

    var sx = 0, sy = 0;
    if (!reduceBossEffects && arenaShake > 0.1) {
        arenaShake *= 0.88;
        if (arenaShake < 0.15) arenaShake = 0;
        sx = (Math.random() - 0.5) * arenaShake + superShakeX;
        sy = (Math.random() - 0.5) * arenaShake + superShakeY;
    } else {
        arenaShake = 0;
        sx = superShakeX;
        sy = superShakeY;
    }

    if (arenaHitFlash > 0) arenaHitFlash -= 3; if (invulnTimer > 0) invulnTimer--; if (arenaComboTimer > 0) arenaComboTimer--;
    if (wallGapIndicator) { wallGapIndicator.life--; if (wallGapIndicator.life <= 0) wallGapIndicator = null; }
    if (screenFlash > 0) screenFlash--; if (arenaVignette > 0) arenaVignette--;
    var effectsOpacity = (typeof arenaSettings !== 'undefined') ? arenaSettings.effectsOpacity : 1.0;
    ctx.save(); if (effectsOpacity < 1.0) ctx.globalAlpha = effectsOpacity;
    ctx.translate(sx, sy); ctx.clearRect(-15, -15, 430, 530); ctx.fillStyle = "#03030b"; ctx.fillRect(0, 0, 400, 500);
    
    // ★ ТАКАБА: цветной фон ★
    if (typeof _superState !== 'undefined' && _superState.takabaBgColor) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = _superState.takabaBgColor;
        ctx.fillRect(0, 0, 400, 500);
        ctx.restore();
    }
    
    if (!reduceBossEffects && typeof _superState !== 'undefined' && _superState.screenFlashWhite > 0) { ctx.save(); ctx.fillStyle = "#ffffff"; ctx.globalAlpha = Math.min(1, _superState.screenFlashWhite / 20); ctx.fillRect(0, 0, 400, 500); ctx.restore(); }
    if (!reduceBossEffects && screenFlash > 0) { ctx.save(); ctx.fillStyle = screenFlashColor; ctx.globalAlpha = screenFlash / 25; ctx.fillRect(0, 0, 400, 500); ctx.restore(); }
    if (!reduceBossEffects && arenaVignette > 0) { ctx.save(); var vignetteGrad = ctx.createRadialGradient(200, 250, 150, 200, 250, 350); vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)'); vignetteGrad.addColorStop(1, 'rgba(255,0,0,' + (arenaVignette / 30) + ')'); ctx.fillStyle = vignetteGrad; ctx.fillRect(0, 0, 400, 500); ctx.restore(); }
    if (typeof _superState !== 'undefined' && _superState.dandyDarkness > 0) { ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, 400, 500); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.02)"; ctx.lineWidth = 1; var step = 25;
    for (var x = 0; x <= 400; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke(); }
    for (var y = 0; y <= 500; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke(); } ctx.restore();
    var bgCap = 25; if (arenaBgParticles.length < bgCap) { arenaBgParticles.push({ x: Math.random() * 400, y: Math.random() * 500, spd: 0.1 + Math.random() * 0.3, sz: 1 + Math.random() * 2, alpha: 0.08 + Math.random() * 0.2 }); }
    ctx.save(); for (var bpi = 0; bpi < arenaBgParticles.length; bpi++) { var bp = arenaBgParticles[bpi]; bp.y += bp.spd; if (bp.y > 500) { bp.y = 0; bp.x = Math.random() * 400; } ctx.fillStyle = "#ffffff"; ctx.globalAlpha = bp.alpha; ctx.fillRect(bp.x, bp.y, bp.sz, bp.sz); } ctx.restore();
    var bc = arenaPhase === "attack" ? "#ffdd00" : (["#fff", "#4499ff", "#ffdd00", "#ff3333", "#ff69b4", "#44ff44", "rainbow", "#ffaa00", "#ff3333", "#ff3333", "#fff", "#b4c3d5", "#cad7e4", "#92ef64", "#8edcff", "#f0d18a", "#ff7047", "#bc7959", "#c49a60", "#9fce63", "#d6dbe0"][arenaAttackType] || "#fff");
    if (bc === "rainbow" || arenaAttackType === 6) bc = "hsl(" + ((now / 5) % 360) + ",100%,50%)"; if (arenaHitFlash > 0) bc = "#ff3333";
    ctx.save();
    ctx.strokeStyle = bc; ctx.lineWidth = 3; ctx.shadowColor = bc; ctx.shadowBlur = arenaHitFlash > 0 ? 18 : 8;
    if (arenaCurrentWave === 1500) {
        var boxW = antiSpiralArenaWidth;
        var boxH = antiSpiralArenaHeight;
        var boxX = (400 - boxW) / 2;
        var boxY = 55 + (445 - boxH) / 2;
        ctx.fillStyle = "rgba(0,0,0,0.94)";
        ctx.fillRect(0, 50, boxX, 450);
        ctx.fillRect(boxX + boxW, 50, 400 - (boxX + boxW), 450);
        ctx.fillRect(boxX, 50, boxW, Math.max(0, boxY - 50));
        ctx.fillRect(boxX, boxY + boxH, boxW, Math.max(0, 500 - (boxY + boxH)));
        ctx.strokeStyle = "#3ebdff";
        ctx.shadowColor = "#168bff";
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.save();
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#8edfff";
        ctx.shadowColor = "#168bff"; ctx.shadowBlur = 8;
        ctx.fillText("↑ / W / SPACE — ПРЫЖОК", boxX + boxW / 2, boxY + 17);
        ctx.restore();
    } else {
        ctx.strokeRect(2, 2, 396, 496);
    }
    ctx.restore();
    if (arenaAttackType === 4 && arenaPhase === "dodge") { ctx.save(); var spikeGlow = Math.sin(now / 200) * 0.3 + 0.7; ctx.fillStyle = "#ff3333"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 10 * spikeGlow; for (var x = 0; x < 400; x += 15) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 7, 18); ctx.lineTo(x + 15, 0); ctx.fill(); } for (var x = 0; x < 400; x += 15) { ctx.beginPath(); ctx.moveTo(x, 500); ctx.lineTo(x + 7, 482); ctx.lineTo(x + 15, 500); ctx.fill(); } for (var y = 0; y < 500; y += 15) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(18, y + 7); ctx.lineTo(0, y + 15); ctx.fill(); } for (var y = 0; y < 500; y += 15) { ctx.beginPath(); ctx.moveTo(400, y); ctx.lineTo(382, y + 7); ctx.lineTo(400, y + 15); ctx.fill(); } ctx.restore(); }
    ctx.fillStyle = "rgba(10,10,20,0.9)"; ctx.fillRect(8, 6, 384, 22);
    var totalWidth = 372 * Math.max(0, arenaHP / arenaMaxHP), yellowWidth = 372 * Math.max(0, arenaKarma / arenaMaxHP);
    if (yellowWidth > totalWidth) yellowWidth = totalWidth; var greenWidth = totalWidth - yellowWidth;
    ctx.fillStyle = "#301010"; ctx.fillRect(14, 14, 372, 6);
    if (greenWidth > 0) { ctx.fillStyle = arenaHitFlash > 0 ? "#fff" : "#00ff66"; ctx.fillRect(14, 14, greenWidth, 6); }
    if (yellowWidth > 0) { var karmaGlow = Math.sin(now / 120) * 0.2 + 0.8; ctx.fillStyle = "#ffaa00"; ctx.globalAlpha = karmaGlow; ctx.fillRect(14 + greenWidth, 14, yellowWidth, 6); ctx.globalAlpha = 1; }
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px monospace"; ctx.shadowColor = "#000"; ctx.shadowBlur = 2; ctx.fillText("❤️ HP: " + Math.max(0, Math.ceil(arenaHP)) + " / " + arenaMaxHP, 16, 24); ctx.shadowBlur = 0;
    drawMarkResurrections();
    ctx.fillStyle = "rgba(10,10,20,0.9)"; ctx.fillRect(8, 32, 384, 14);
    var maxHp = (isJoystickTrainingMode() || isGERUniqueMixTraining())
        ? Math.max(1, Number(arenaBossOriginalMaxHP) || Number(arenaBossMaxHP) || 1)
        : ((typeof currentEnemy !== 'undefined' && currentEnemy) ? currentEnemy.maxHp : 1000);
    ctx.fillStyle = "#202020"; ctx.fillRect(14, 37, 372, 4); ctx.fillStyle = "#ff3333"; ctx.fillRect(14, 37, 372 * Math.max(0, ghostBossHP / maxHp), 4);
    var bossGlow = Math.sin(now / 250) * 0.15 + 0.85; ctx.fillStyle = "#ffdd00"; ctx.globalAlpha = bossGlow; ctx.fillRect(14, 37, 372 * Math.max(0, arenaBossMaxHP / maxHp), 4); ctx.globalAlpha = 1;
    ctx.fillStyle = "#ccc"; ctx.font = "bold 9px monospace"; ctx.fillText("👾 " + arenaBoss, 16, 43);
    drawActiveBuffs();
    if (arenaComboTimer > 0 && arenaComboText) { ctx.save(); var comboAlpha = Math.min(1, arenaComboTimer / 20); ctx.fillStyle = "rgba(255,255,255," + comboAlpha + ")"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 15; ctx.fillText(arenaComboText, 200, 260); ctx.restore(); }

    if (wallGapIndicator && wallGapIndicator.life > 0) {
        ctx.save();
        var alpha = Math.min(1, wallGapIndicator.life / 20);
        var pulse = Math.sin(now / 200) * 0.2 + 0.8;
        ctx.fillStyle = "rgba(46,204,113," + (0.20 * alpha * pulse) + ")";
        ctx.strokeStyle = "rgba(46,204,113," + (0.45 * alpha) + ")";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -now / 30;
        if (wallGapIndicator.vertical) {
            ctx.fillRect(wallGapIndicator.x, wallGapIndicator.y - wallGapIndicator.h / 2, wallGapIndicator.w, wallGapIndicator.h);
            ctx.strokeRect(wallGapIndicator.x, wallGapIndicator.y - wallGapIndicator.h / 2, wallGapIndicator.w, wallGapIndicator.h);
        } else {
            ctx.fillRect(wallGapIndicator.x - wallGapIndicator.w / 2, wallGapIndicator.y, wallGapIndicator.w, wallGapIndicator.h);
            ctx.strokeRect(wallGapIndicator.x - wallGapIndicator.w / 2, wallGapIndicator.y, wallGapIndicator.w, wallGapIndicator.h);
        }
        ctx.setLineDash([]);
        if (wallGapIndicator.life > 30 && wallGapIndicator.arrowToX !== undefined && wallGapIndicator.arrowToY !== undefined) {
            var ax1 = wallGapIndicator.arrowFromX;
            var ay1 = wallGapIndicator.arrowFromY;
            var ax2 = wallGapIndicator.arrowToX;
            var ay2 = wallGapIndicator.arrowToY;
            var midX, midY;
            if (wallGapIndicator.vertical) {
                if (Math.abs(ay1 - ay2) < 10) { midX = ax2; midY = ay2; }
                else { midX = ax1; midY = ay2; }
            } else {
                if (Math.abs(ax1 - ax2) < 10) { midX = ax2; midY = ay2; }
                else { midX = ax2; midY = ay1; }
            }
            var points = [{ x: ax1, y: ay1 }, { x: midX, y: midY }, { x: ax2, y: ay2 }];
            var cleanPoints = [points[0]];
            for (var p = 1; p < points.length; p++) {
                var prev = cleanPoints[cleanPoints.length - 1];
                if (Math.abs(prev.x - points[p].x) > 2 || Math.abs(prev.y - points[p].y) > 2) cleanPoints.push(points[p]);
            }
            ctx.strokeStyle = "rgba(46,255,113," + (0.9 * alpha) + ")";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#2ecc71";
            ctx.shadowBlur = 12;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(cleanPoints[0].x, cleanPoints[0].y);
            for (var p = 1; p < cleanPoints.length; p++) ctx.lineTo(cleanPoints[p].x, cleanPoints[p].y);
            ctx.stroke();
            if (cleanPoints.length >= 2) {
                var last = cleanPoints[cleanPoints.length - 1];
                var beforeLast = cleanPoints[cleanPoints.length - 2];
                var angle = Math.atan2(last.y - beforeLast.y, last.x - beforeLast.x);
                var arrowSize = 14;
                ctx.fillStyle = "rgba(46,255,113," + (0.95 * alpha) + ")";
                ctx.beginPath();
                ctx.moveTo(last.x, last.y);
                ctx.lineTo(last.x - Math.cos(angle - 0.4) * arrowSize, last.y - Math.sin(angle - 0.4) * arrowSize);
                ctx.lineTo(last.x - Math.cos(angle + 0.4) * arrowSize, last.y - Math.sin(angle + 0.4) * arrowSize);
                ctx.closePath();
                ctx.fill();
            }
            ctx.strokeStyle = "rgba(46,255,113," + (0.8 * alpha) + ")";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ax2, ay2, 10 + Math.sin(now / 100) * 3, 0, Math.PI * 2);
            ctx.stroke();
            for (var p = 1; p < cleanPoints.length - 1; p++) {
                ctx.fillStyle = "rgba(46,255,113," + (0.9 * alpha) + ")";
                ctx.beginPath();
                ctx.arc(cleanPoints[p].x, cleanPoints[p].y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }

    // ★ БЕЛОУС: ВИДИМОЕ ЦУНАМИ ★
    if (typeof _superState !== 'undefined' && _superState.whitebeardSkillTsunamiActive) {
        var wy = _superState.whitebeardSkillTsunamiY;
        ctx.save();
        var pulse = 0.82 + Math.sin(now / 90) * 0.18;
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = "#00ccff"; ctx.shadowBlur = 24;
        ctx.strokeStyle = "rgba(0,220,255," + pulse + ")"; ctx.lineWidth = 18;
        ctx.beginPath();
        for (var wx = -40; wx <= 440; wx += 8) {
            var waveY = wy + Math.sin(wx / 28 + now / 110) * 18 + Math.sin(wx / 11 + now / 70) * 5;
            if (wx === -40) ctx.moveTo(wx, waveY); else ctx.lineTo(wx, waveY);
        }
        ctx.stroke();
        ctx.shadowBlur = 8; ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.beginPath();
        for (var wx2 = -40; wx2 <= 440; wx2 += 8) {
            var waveY2 = wy + Math.sin(wx2 / 28 + now / 110) * 18 + Math.sin(wx2 / 11 + now / 70) * 5 - 3;
            if (wx2 === -40) ctx.moveTo(wx2, waveY2); else ctx.lineTo(wx2, waveY2);
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(80,220,255,0.28)"; ctx.beginPath(); ctx.moveTo(-40,wy);
        for (var wx3=-40;wx3<=440;wx3+=8) ctx.lineTo(wx3,wy+Math.sin(wx3/28+now/110)*18);
        ctx.lineTo(440,wy+58);ctx.lineTo(-40,wy+58);ctx.closePath();ctx.fill();
        for(var wi=0;wi<16;wi++){var px=(wi*31+now*.12)%440-20,py=wy+Math.sin(wi*1.7+now/120)*18;ctx.fillStyle="#fff";ctx.globalAlpha=.65+Math.sin(now/80+wi)*.25;ctx.beginPath();ctx.arc(px,py-8,3+(wi%3),0,Math.PI*2);ctx.fill();}
        ctx.globalAlpha=1;ctx.restore();
    }

    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = arenaTrail.length - 1; i >= 0; i--) { var t = arenaTrail[i]; t.life--; var ratio = Math.max(0, t.life / t.maxLife); var trailRadius = Math.max(0.1, t.size * ratio); ctx.fillStyle = t.color; ctx.globalAlpha = ratio * 0.7; ctx.beginPath(); ctx.arc(t.x, t.y - 2, trailRadius, 0, Math.PI * 2); ctx.fill(); if (t.life <= 0) arenaTrail.splice(i, 1); } ctx.restore();

    // Draw/advance extended patterns after clearing the canvas; drawing earlier erased every frame.
    if (arenaPhase === "dodge" && !takabaFreeze && arenaExtendedState && arenaAttackType >= 11 && arenaAttackType <= 20 && arenaCurrentWave !== 1500) updateExtendedArenaAttack(now);

    if (arenaPhase === "dodge" && !takabaFreeze) {
        var frozen = (typeof _superState !== 'undefined' && _superState.antispiralFrozen), speedMod = arenaGlobalSpeedMod * (typeof _superState !== 'undefined' && _superState.antispiralSpeedBoost ? 1.5 : 1.0) * (typeof _superState !== 'undefined' ? (_superState.takabaArenaSpeedMult || 1) : 1), timeStopped = (typeof _superState !== 'undefined' && (_superState.garouTimeStop || _superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0));
        arenaUpdateRainbowAttacks(attacks, speedMod, frozen, timeStopped);
        for (var i = attacks.length - 1; i >= 0; i--) {
            var a = attacks[i];
            var attackTimeStopped = timeStopped || (typeof dioShouldFreezeEntity === 'function' && dioShouldFreezeEntity(a));
            if (!frozen && !attackTimeStopped && a.type !== "rainbow") { if (a.spd) a.x += a.spd * speedMod; if (a.spdY) a.y += a.spdY * speedMod; }
            // ZA WARUDO: снаряды остаются видимыми, но не могут разрушаться аурами
            // или наносить урон касанием до возобновления времени.
            if (a.type !== "rainbow" && !attackTimeStopped && typeof _superState !== 'undefined' && _superState.imAuraActive && invulnTimer <= 0) { var ax = a.x + (a.size || a.radius || 20) / 2, ay = a.y + (a.size || a.radius || 20) / 2; var dist = Math.hypot(ax - heart.x, ay - heart.y); if (dist < 55) { if (Math.random() < 0.5) { attacks.splice(i, 1); arenaParticles.push({ x: ax, y: ay, vx: 0, vy: 0, life: 15, maxLife: 15, color: "#ff00ff", size: 5 }); continue; } } }
            if (a.type !== "rainbow" && !attackTimeStopped && typeof _superState !== 'undefined' && _superState.dandyAura > 0) { var ax = a.x + (a.size || a.radius || 20) / 2, ay = a.y + (a.size || a.radius || 20) / 2; if (Math.hypot(ax - heart.x, ay - heart.y) < 60) { attacks.splice(i, 1); arenaParticles.push({ x: ax, y: ay, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 15, maxLife: 15, color: "#ff3300", size: 3 }); continue; } }
            if (a.type === "bomb") { if (!frozen && !attackTimeStopped) a.timer--; if (attackTimeStopped && a.timer <= 0) { ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = "#ff8800"; ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(1, Math.min(a.maxRadius || 40, 18)), 0, Math.PI * 2); ctx.fill(); ctx.restore(); continue; } if (a.timer > 0) { ctx.save(); var isFlashing = Math.floor(a.timer / 6) % 2 === 0, bombX = a.x, bombY = a.y; var bombRadius = Math.max(1, 11 + Math.abs(Math.sin(a.timer * 0.45)) * 4); ctx.shadowColor = "#ff3333"; ctx.shadowBlur = isFlashing ? 25 : 10; var gradient = ctx.createRadialGradient(bombX, bombY, Math.max(0.1, bombRadius * 0.2), bombX, bombY, bombRadius); gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.3, '#ff6600'); gradient.addColorStop(0.7, '#ff0000'); gradient.addColorStop(1, '#990000'); ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(bombX, bombY, bombRadius, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#8B4513"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bombX, bombY - bombRadius - 2); ctx.quadraticCurveTo(bombX + 5, bombY - bombRadius - 16, bombX + 3, bombY - bombRadius - 20); ctx.stroke(); ctx.fillStyle = isFlashing ? "#ffff00" : "#ff8800"; ctx.shadowColor = isFlashing ? "#ffff00" : "#ff6600"; ctx.shadowBlur = isFlashing ? 12 : 6; ctx.beginPath(); ctx.arc(bombX + 3, bombY - bombRadius - 20, Math.max(1, isFlashing ? 5 : 4), 0, Math.PI * 2); ctx.fill(); ctx.restore(); } else if (a.timer > -35) { var progress = Math.abs(a.timer) / 35, cr = Math.max(1, a.maxRadius * progress); if (!a.particlesSpawned && progress > 0.05) { a.particlesSpawned = true; sfxArenaBombExplosion(); a.shakeTime = 25; } if (a.shakeTime > 0) { arenaShake = Math.max(arenaShake, 20); a.shakeTime--; } ctx.save(); ctx.globalCompositeOperation = 'lighter'; var grad = ctx.createRadialGradient(a.x, a.y, Math.max(0.1, cr * 0.1), a.x, a.y, cr); grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.15, '#ffff00'); grad.addColorStop(0.4, '#ff8800'); grad.addColorStop(0.7, '#ff0000'); grad.addColorStop(1, 'rgba(139,0,0,0)'); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(a.x, a.y, cr, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = Math.max(0.1, 3 * (1 - progress)); for (var r = 0; r < 12; r++) { var angle = (r / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + Math.cos(angle) * cr * 0.8, a.y + Math.sin(angle) * cr * 0.8); ctx.stroke(); } ctx.fillStyle = "#ffffff"; for (var ep = 0; ep < 50; ep++) { var eAngle = Math.random() * Math.PI * 2; ctx.beginPath(); ctx.arc(a.x + Math.cos(eAngle) * Math.random() * cr, a.y + Math.sin(eAngle) * Math.random() * cr, Math.max(0.1, 1 + Math.random() * 3), 0, Math.PI * 2); ctx.fill(); } ctx.restore(); if (!a.hit && invulnTimer <= 0 && !attackTimeStopped) { var dioBombStandHit=false;var dioBombCtx=(typeof getBossContext==="function")?getBossContext():null;if(typeof window.dioAttackTouchesStand==="function"&&dioBombCtx)dioBombStandHit=window.dioAttackTouchesStand(dioBombCtx,{type:"bomb",x:a.x,y:a.y,radius:cr,timer:-1});var dx=heart.x-a.x,dy=heart.y-a.y;if(dioBombStandHit){a.dioStandHitOnce=true;var geBombDamage=(typeof window.MBIsGoldExperienceNpcActive==="function"&&window.MBIsGoldExperienceNpcActive()&&typeof window.scaleStandBlockedDamage==="function")?window.scaleStandBlockedDamage(a.damage||30):Math.max(1,Math.floor((a.damage||30)*.4));applyHit(geBombDamage,"удар по стенду. Джорно получает 50% урона",false,false,a);}else if(Math.sqrt(dx*dx+dy*dy)<(cr+heart.hitbox)){applyHit(a.damage||30,"ВЗРЫВ!",false,false,a);a.hit=true;} } } else { attacks.splice(i, 1); } continue; }
            if (a.type !== "wall" && a.type !== "rainbow" && a.bouncesLeft !== undefined && a.bouncesLeft > 0 && !frozen && !attackTimeStopped) { var sz = a.size || (a.radius ? a.radius * 2 : 20); if (a.x < 4 && a.spd < 0) { a.spd = -a.spd; if (a.bouncesLeft !== Infinity) a.bouncesLeft--; sfxBounce(); } else if (a.x + sz > 396 && a.spd > 0) { a.spd = -a.spd; if (a.bouncesLeft !== Infinity) a.bouncesLeft--; sfxBounce(); } if (a.y < 4 && a.spdY < 0) { a.spdY = -a.spdY; if (a.bouncesLeft !== Infinity) a.bouncesLeft--; sfxBounce(); } else if (a.y + sz > 496 && a.spdY > 0) { a.spdY = -a.spdY; if (a.bouncesLeft !== Infinity) a.bouncesLeft--; sfxBounce(); } }
            var hit = false;
            var dioArenaCtx=(typeof getBossContext==="function")?getBossContext():null;
            var dioStandHit=a.type!=="rainbow"&&typeof window.dioAttackTouchesStand==="function"&&dioArenaCtx&&window.dioAttackTouchesStand(dioArenaCtx,a);
            if (a.type === "circle" || a.type === "rainbow" || a.type === "healCircle") { var dx = heart.x - a.x, dy = heart.y - a.y; var radToCheck = Math.max(0.1, (a.radius || 10) - 2); hit = Math.sqrt(dx * dx + dy * dy) < (heart.hitbox + radToCheck); }
            else if (a.type === "sword") { var dx = heart.x - a.x, dy = heart.y - a.y; hit = Math.sqrt(dx * dx + dy * dy) < (heart.hitbox + a.size / 2); }
            else { var sz = a.size || 20, cx = a.x + sz / 2, cy = a.y + sz / 2; hit = Math.abs(heart.x - cx) < (sz / 2 + heart.hitbox) && Math.abs(heart.y - cy) < (sz / 2 + heart.hitbox); }
            if(a.dioAggroNoPlayer){hit=false;dioStandHit=false;}
            if(dioStandHit)hit=true;
            if (hit && invulnTimer <= 0 && !attackTimeStopped) {
                if (a.type === "healCircle") { var healAmount = Math.floor(arenaMaxHP * (a.healPercent || 0.10)); arenaHP = Math.min(arenaMaxHP, arenaHP + healAmount); arenaKarma = Math.max(0, arenaKarma - Math.floor(arenaMaxHP * 0.05)); sfxArenaHeal(); spawnFloatingText(heart.x, heart.y - 20, "+" + healAmount, "#44ff44"); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); attacks.splice(i, 1); continue; }
                var bhd = a.damage || arenaBaseDmg || 5;
                if(dioStandHit){a.dioStandHitOnce=true;var geArenaDamage=(typeof window.MBIsGoldExperienceNpcActive==="function"&&window.MBIsGoldExperienceNpcActive()&&typeof window.scaleStandBlockedDamage==="function")?window.scaleStandBlockedDamage(bhd):Math.max(1,Math.floor(bhd*.4));applyHit(geArenaDamage,"удар по стенду. Джорно получает 50% урона",false,false,a);attacks.splice(i,1);continue;}
                if (a.color === "#ffaa00" || a.type === "sword") { if (!heartWasMoving) applyHit(Math.max(1, Math.floor(bhd / 4)), "ЗАЩИТА!",false,false,a); else applyHit(bhd, "ДВИЖЕНИЕ!",false,false,a); attacks.splice(i, 1); continue; }
                if (a.color === "#ff3333" || a.type === "danger") { if (heartWasMoving) applyHit(Math.max(1, Math.floor(bhd / 4)), "ЗАЩИТА!",false,false,a); else applyHit(bhd, "ЗАМЕР!",false,false,a); attacks.splice(i, 1); continue; }
                if (a.color === "#ff69b4" || a.knockback) { var dx = heart.x - a.x, dy = heart.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1; heart.vx += (dx / dist) * a.knockback * 0.5; heart.vy += (dy / dist) * a.knockback * 0.5; sfxPinkKnockback(); attacks.splice(i, 1); continue; }
                if (a.heal) { var healAmount = Math.floor(arenaMaxHP * (a.healPercent || 0.15)); arenaHP = Math.min(arenaMaxHP, arenaHP + healAmount); arenaKarma = Math.max(0, arenaKarma - Math.floor(arenaMaxHP * 0.1)); sfxArenaHeal(); spawnFloatingText(heart.x, heart.y - 20, "+" + healAmount, "#44ff44"); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); attacks.splice(i, 1); continue; }
                if (a.oneshot) { sfxArenaDeath(); applyHit(arenaMaxHP, "ФАТАЛЬНО!", true, false, a, "instant"); continue; }
                applyHit(bhd, null, false, false, a); attacks.splice(i, 1); continue;
            }
            if (a.type !== "rainbow" && !attackTimeStopped && (a.y > 560 || a.y < -150 || a.x < -160 || a.x > 560)) { attacks.splice(i, 1); continue; }
            if (frozen || attackTimeStopped) { ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = attackTimeStopped ? "#ff8800" : "#aaddff"; ctx.strokeStyle = attackTimeStopped ? "#ff8800" : "#88bbff"; ctx.lineWidth = 2; var sz = a.size || a.radius || 20; if (a.type === "circle" || a.type === "rainbow" || a.type === "healCircle") { var circR = Math.max(0.1, (a.radius || 10) + 3); ctx.beginPath(); ctx.arc(a.x, a.y, circR, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } else if (a.type === "sword") { ctx.fillRect(a.x - a.size / 2 - 2, a.y - a.width / 2 - 2, a.size + 4, a.width + 4); ctx.strokeRect(a.x - a.size / 2 - 2, a.y - a.width / 2 - 2, a.size + 4, a.width + 4); } else { var sz2 = Math.max(1, sz); ctx.fillRect(a.x - 2, a.y - 2, sz2 + 4, sz2 + 4); ctx.strokeRect(a.x - 2, a.y - 2, sz2 + 4, sz2 + 4); } ctx.restore(); }
            ctx.save(); var col = a.color;
             if (a.type !== "rainbow" && typeof _superState !== 'undefined' && _superState.takabaRandomColors) col = "hsl(" + Math.floor(Math.random()*360) + ",100%,60%)";
             if (a.type !== "rainbow" && typeof _superState !== 'undefined' && _superState.takabaBallMode) col = "#ff9f43";
             if (a.type === "rainbow") col = "hsl(" + ((now / 2 + a.x) % 360) + ",100%,60%)"; if (a.type === "healCircle") col = "#44ff44";
            // ★ ТАКАБА: утки ★
            if (a.type !== "rainbow" && typeof _superState !== 'undefined' && _superState.takabaDuckMode) col = "#ffcc00";
            ctx.fillStyle = col;
            if (a.type !== "rainbow" && typeof _superState !== 'undefined' && _superState.takabaBallMode) {
                var br = Math.max(7, (a.radius || a.size || 16) / 2);
                ctx.beginPath(); ctx.arc(a.x, a.y, br, 0, Math.PI*2); ctx.fill();
                ctx.font="14px sans-serif"; ctx.textAlign="center"; ctx.fillText("🎈", a.x, a.y+5);
             } else if (a.type === "square" || a.type === "danger") { var sz = a.size || 20; ctx.translate(a.x + sz / 2, a.y + sz / 2); if (a.color === "#ff3333") { ctx.beginPath(); ctx.moveTo(0, -sz / 2); ctx.lineTo(sz / 2, sz / 2); ctx.lineTo(-sz / 2, sz / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, -sz / 5); ctx.lineTo(sz / 5, sz / 3); ctx.lineTo(-sz / 5, sz / 3); ctx.closePath(); ctx.fill(); } else if (a.color === "#ff69b4") { ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(-sz / 4, -sz / 4, sz / 2, sz / 2); } else if (a.color === "#4499ff") { ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.strokeRect(-sz / 2 + 2, -sz / 2 + 2, sz - 4, sz - 4); ctx.fillStyle = "#fff"; ctx.fillRect(-sz / 4, -sz / 4, sz / 2, sz / 2); } else { ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 1.5; ctx.strokeRect(-sz / 2 + 2, -sz / 2 + 2, sz - 4, sz - 4); ctx.fillStyle = "#fff"; ctx.fillRect(-sz / 4, -sz / 4, sz / 2, sz / 2); } }
            else if (a.type === "sword") { ctx.translate(a.x, a.y); ctx.rotate(a.angle || 0); ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.moveTo(a.size + 3, 0); ctx.lineTo(0, a.width / 2 + 2); ctx.lineTo(-a.size - 3, 0); ctx.lineTo(0, -a.width / 2 - 2); ctx.fill(); ctx.globalAlpha = 1.0; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(a.size, 0); ctx.lineTo(0, a.width / 4); ctx.lineTo(-a.size, 0); ctx.lineTo(0, -a.width / 4); ctx.fill(); }
            else if (a.type === "circle" || a.type === "healCircle") { var circleR = Math.max(0.1, a.radius || 10); ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(a.x, a.y, circleR, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(0.1, circleR * 0.7), 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(0.1, circleR * 0.4), 0, Math.PI * 2); ctx.fill(); }
            else if (a.type === "rainbow") { var rainbowR = Math.max(0.1, a.radius || 10); ctx.beginPath(); ctx.arc(a.x, a.y, rainbowR, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(0.1, rainbowR * 0.7), 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(0.1, rainbowR * 0.4), 0, Math.PI * 2); ctx.fill(); }
            ctx.restore();
        }
        if (typeof renderSuperVisuals === 'function') { ctx.save(); renderSuperVisuals(); ctx.restore(); }
        for (var i = arenaBlasters.length - 1; i >= 0; i--) { var b = arenaBlasters[i]; var blasterTimeStopped = timeStopped || (typeof dioShouldFreezeEntity === 'function' && dioShouldFreezeEntity(b)); var ac = b.color === "rainbow" ? "hsl(" + ((now / 2) % 360) + ",100%,60%)" : b.color; if (!frozen && !blasterTimeStopped) { if (b.state === "aiming") { b.timer--; if (b.timer <= 0) { b.state = "firing"; b.timer = 15; arenaShake = 18; sfxArenaBlasterFire(); } } else if (b.state === "firing") { b.timer--; if (b.timer <= 0) { b.state = "fading"; b.timer = 20; } } else if (b.state === "fading") { b.timer--; if (b.timer <= 0) arenaBlasters.splice(i, 1); } } if (b.state === "aiming") { if (!blasterTimeStopped && b.timer > 30) b.angle = Math.atan2(heart.y - b.y, heart.x - b.x); ctx.save(); ctx.globalAlpha = 0.2 + Math.abs(Math.sin(b.timer * 0.25)) * 0.2; ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -now / 40; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.angle) * 800, b.y + Math.sin(b.angle) * 800); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); } else if (b.state === "firing" || b.state === "fading") { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = ac; ctx.shadowBlur = 15; var bWidth = Math.max(1, b.width + 16 + Math.random() * 10); ctx.strokeStyle = ac; ctx.lineWidth = bWidth; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.angle) * 800, b.y + Math.sin(b.angle) * 800); ctx.stroke(); ctx.lineWidth = Math.max(1, b.width); ctx.globalAlpha = 0.9; ctx.stroke(); ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(0.5, b.width * 0.4); ctx.globalAlpha = 1.0; ctx.stroke(); ctx.restore(); if (!b.hasHit && invulnTimer <= 0 && !frozen && !blasterTimeStopped) { var dx = heart.x - b.x, dy = heart.y - b.y, dist = Math.abs(dx * Math.sin(b.angle) - dy * Math.cos(b.angle)); var dioBlastStand=null,dioBlastCtx=(typeof getBossContext==="function")?getBossContext():null;if(typeof window.getDioStandPosition==="function"&&dioBlastCtx)dioBlastStand=window.getDioStandPosition(dioBlastCtx);var dioStandDist=Infinity;if(dioBlastStand)dioStandDist=Math.abs((dioBlastStand.x-b.x)*Math.sin(b.angle)-(dioBlastStand.y-b.y)*Math.cos(b.angle));var dioBlastStandHit=typeof isDioOverHeavenMain==="function"&&isDioOverHeavenMain()&&dioStandDist<Math.max(1,b.width/2)+((dioBlastStand&&dioBlastStand.radius)||7);if(dioBlastStandHit){var sd=b.color==="rainbow"?Math.max(1,Math.floor(arenaMaxHP*.4)):(b.color==="#fff"?Math.floor(arenaBaseDmg*.8):((b.color==="#ffdd00"||b.color==="#ff3333")?Math.max(1,Math.floor(arenaBaseDmg*1.2)):Math.max(1,Math.floor(arenaBaseDmg*.4))));applyHit(sd,"удар по стенду. меньше урона");b.hasHit=true;}else if (dist < Math.max(1, b.width / 2) + heart.hitbox) { var bdmg = 0, msg = ""; if (b.color === "rainbow") applyHit(arenaMaxHP, "ФАТАЛЬНО!", true); else if (b.color === "#fff") { bdmg = Math.floor(arenaBaseDmg * 2); msg = "ЛУЧ!"; } else if (b.color === "#ffdd00") { if (!heartWasMoving) { bdmg = Math.max(1, Math.floor(arenaBaseDmg * 3 / 4)); msg = "ЗАЩИТА!"; } else { bdmg = Math.floor(arenaBaseDmg * 3); msg = "ДВИЖЕНИЕ!"; } } else if (b.color === "#ff3333") { if (heartWasMoving) { bdmg = Math.max(1, Math.floor(arenaBaseDmg * 3 / 4)); msg = "ЗАЩИТА!"; } else { bdmg = Math.floor(arenaBaseDmg * 3); msg = "ЗАМЕР!"; } } if (bdmg > 0) applyHit(bdmg, msg); b.hasHit = true; } } } }
    // ★ DIO: визуал остановки должен рисоваться даже тогда, когда основной цикл атак заморожен.
    // Раньше renderSuperVisuals находился внутри dodge-блока и при time stop вообще не вызывался.
    if (typeof _superState !== 'undefined' &&
        (_superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0) &&
        typeof renderDioVisuals === 'function') {
        ctx.save();
        renderDioVisuals(typeof getBossContext === 'function' ? getBossContext() : null);
        ctx.restore();
    }

    if (invulnTimer <= 0 || Math.floor(now / 80) % 2 === 0) {
        ctx.save();
        ctx.translate(heart.x, heart.y - 2);
        ctx.rotate(heartRotation * 0.3);
        var dioMainHeart = arenaCurrentWave !== 1500 && typeof isDioOverHeavenMain === "function" && isDioOverHeavenMain();
        if (dioMainHeart) {
            // Сердце DIO: классический красный SOUL-силуэт с тёмной окантовкой и золотым бликом.
            var hs = Math.max(0.7, heart.size / 14);
            ctx.save();
            ctx.scale(hs, hs);
            var dioHeartPath = function() {
                ctx.beginPath();
                ctx.moveTo(0, 6);
                ctx.bezierCurveTo(-2, 4, -9, -1, -9, -5);
                ctx.bezierCurveTo(-9, -11, -2, -12, 0, -7);
                ctx.bezierCurveTo(2, -12, 9, -11, 9, -5);
                ctx.bezierCurveTo(9, -1, 2, 4, 0, 6);
                ctx.closePath();
            };
            ctx.shadowColor = "#ff1f35"; ctx.shadowBlur = 9;
            var dioHeartGrad = ctx.createLinearGradient(-7, -10, 7, 7);
            dioHeartGrad.addColorStop(0, "#ff6472");
            dioHeartGrad.addColorStop(0.42, "#ed1235");
            dioHeartGrad.addColorStop(1, "#780018");
            ctx.fillStyle = dioHeartGrad;
            dioHeartPath(); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#510014"; ctx.lineWidth = 1.1; dioHeartPath(); ctx.stroke();
            ctx.fillStyle = "rgba(255,245,195,.9)";
            ctx.beginPath(); ctx.ellipse(-3.5, -6.5, 1.7, 2.4, -0.5, 0, Math.PI * 2); ctx.fill();

            // THE WORLD постоянно находится рядом с ДИО, как в прежней версии.
            ctx.save();
            ctx.translate(heart.size * 0.95, -heart.size * 0.35);
            ctx.scale(0.84, 0.84);
            ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 13;
            var standGrad = ctx.createLinearGradient(-7, -10, 7, 7);
            standGrad.addColorStop(0, "#ffffff");
            standGrad.addColorStop(0.55, "#f4f8ff");
            standGrad.addColorStop(1, "#cbd8e8");
            ctx.fillStyle = standGrad;
            dioHeartPath(); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.98)"; ctx.lineWidth = 1.2; dioHeartPath(); ctx.stroke();
            ctx.restore();
            ctx.restore();
            if (typeof window.drawDioPlayerVisual === "function") {
                window.drawDioPlayerVisual(ctx, 0, 0, heart.size);
                var dioCtxForStand = (typeof getBossContext === "function") ? getBossContext() : null;
                var dioStandHere = (typeof window.getDioStandPosition === "function") ? window.getDioStandPosition(dioCtxForStand) : null;
                if (dioStandHere && typeof window.drawDioStandVisual === "function") window.drawDioStandVisual(ctx, dioStandHere.x - heart.x, dioStandHere.y - (heart.y - 2), Math.max(8, heart.size * 0.72));
            }
        } else if (arenaCurrentWave === 1500) {
            var antiSpiralHeartGrad = ctx.createLinearGradient(-8, -10, 8, 8);
            antiSpiralHeartGrad.addColorStop(0, "#b9f3ff");
            antiSpiralHeartGrad.addColorStop(0.45, "#20b8ff");
            antiSpiralHeartGrad.addColorStop(1, "#0645d8");
            ctx.shadowColor = "#26bfff"; ctx.shadowBlur = 16;
            ctx.fillStyle = antiSpiralHeartGrad;
            ctx.beginPath();
            ctx.moveTo(0, 7);
            ctx.bezierCurveTo(-3, 4, -10, -1, -9, -6);
            ctx.bezierCurveTo(-8, -12, -2, -12, 0, -7);
            ctx.bezierCurveTo(3, -12, 9, -11, 9, -5);
            ctx.bezierCurveTo(9, -1, 3, 4, 0, 7);
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0; ctx.strokeStyle = "#d9f8ff"; ctx.lineWidth = 1.2; ctx.stroke();
        } else if (!drawSecretHeartTexture(ctx, 0, 0, heart.size, getSecretHeartMainCardName(), {rotation: 0})) {
            var heartGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 8);
            heartGrad.addColorStop(0, '#ff4444'); heartGrad.addColorStop(1, '#990000');
            ctx.fillStyle = heartGrad;
            ctx.beginPath(); ctx.arc(-3.5,-2,4.5,Math.PI,0); ctx.arc(3.5,-2,4.5,Math.PI,0); ctx.lineTo(0,6); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(-2,-2,1.5,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
        if (invulnTimer > 0) {
            ctx.save();
            var shieldGrad = ctx.createRadialGradient(0, 2, Math.max(0.1, heart.size * 1.1), 0, 2, Math.max(0.1, heart.size * 1.4));
            shieldGrad.addColorStop(0, 'rgba(0,191,255,0.1)'); shieldGrad.addColorStop(1, 'rgba(0,191,255,0.6)');
            ctx.strokeStyle = shieldGrad; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 1.3), 0, Math.PI*2); ctx.stroke();
            ctx.restore();
        }
    }
    } else if (arenaPhase === "attack") { for (var i = 0; i < arenaClickTargets.length; i++) { var t = arenaClickTargets[i]; if (t.hit) continue; t.pulse += 0.12; var r = Math.max(0.1, t.radius + Math.sin(t.pulse) * 3); ctx.save(); var glowPulse = Math.sin(now / 300 + i) * 0.3 + 0.7; var grad = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, r); grad.addColorStop(0, "rgba(255,255,255,0.4)"); grad.addColorStop(0.7, "rgba(255,221,0,0.15)"); grad.addColorStop(1, "rgba(255,221,0,0)"); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#ffdd00"; ctx.lineWidth = 2; ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 8 * glowPulse; ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(0.1, t.radius), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (var i = arenaParticles.length - 1; i >= 0; i--) { var p = arenaParticles[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life--; var ratio = Math.max(0, p.life / p.maxLife); if (!p.isLightning) { var pSize = Math.max(0.1, p.size * ratio); ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, ratio); ctx.beginPath(); ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2); ctx.fill(); } if (p.life <= 0) arenaParticles.splice(i, 1); } ctx.restore();
    ctx.save(); for (var i = arenaShockwaves.length - 1; i >= 0; i--) { var sw = arenaShockwaves[i]; sw.r += sw.v; sw.life--; var ratio = Math.max(0, sw.life / sw.maxLife); var swR = Math.max(0.1, sw.r); ctx.strokeStyle = sw.color; ctx.lineWidth = Math.max(0.1, 2.5 * ratio); ctx.globalAlpha = ratio; ctx.beginPath(); ctx.arc(sw.x, sw.y, swR, 0, Math.PI * 2); ctx.stroke(); if (sw.life <= 0) arenaShockwaves.splice(i, 1); } ctx.restore();
    ctx.save(); for (var i = floatingTexts.length - 1; i >= 0; i--) { var ft = floatingTexts[i]; ft.y += ft.vy; ft.x += (ft.vx || 0); ft.life--; ctx.fillStyle = ft.color; if (typeof _superState !== 'undefined' && _superState.takabaLaughText) ft.text = "ХА-ХА-ХА"; ctx.globalAlpha = Math.max(0, ft.life / 50); ctx.font = "bold 14px monospace"; ctx.shadowColor = ft.color; ctx.shadowBlur = 4; ctx.textAlign = "center"; ctx.fillText(ft.text, ft.x, ft.y); if (ft.life <= 0) floatingTexts.splice(i, 1); } ctx.restore();
    if (typeof _superState !== 'undefined' && _superState.dandyLava > 0) { ctx.save(); for (var i = 0; i < 60; i++) { var lx = Math.random() * 400, ly = 460 + Math.random() * 40; ctx.fillStyle = "#ff4400"; ctx.globalAlpha = 0.6 + Math.random() * 0.4; ctx.beginPath(); ctx.arc(lx, ly, 2 + Math.random() * 4, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); if (heart.y > 420) { applyHit(3, "ЛАВА!"); } }

    if (isGERUniqueMixTraining()) updateGERUniqueTrainingAttacks(now);
    if (typeof window.MBDrawGoldExperience === "function") window.MBDrawGoldExperience(ctx);
    drawObesityWarning();
    updateTakabaConfidenceDisplay();
    // ★ ТАКАБА: шутка ★
    drawTakabaJoke();

    if (typeof window.drawJoystick === 'function') window.drawJoystick();

    ctx.restore();
    animFrameId = requestAnimationFrame(renderArena);
}

// ============================================================
// ★★★ ЭКСПОРТ В WINDOW ★★★
// ============================================================
window.getArenaActive = function() { return arenaActive; };
window.getArenaPhase = function() { return arenaPhase; };
window.tickWhitebeardRegenArena = tickWhitebeardRegenArena;

console.log("[BATTLE] v18.0 — Такаба-заморозка + Белоус поглощение + реген");
