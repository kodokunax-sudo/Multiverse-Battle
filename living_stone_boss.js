// ============================================================
// ЖИВОЙ КАМЕНЬ - БОСС 200 ВОЛНЫ v3.1
// Больше атак, новые атаки во 2-й фазе, музыка перекрывает фоновую
// ============================================================

let livingStoneActive = false;
let livingStoneState = "phase1";
let livingStoneBoss = { x: 200, y: 100, size: 40, vx: 0.8, rotation: 0 };
let livingStonePlayer = { x: 200, y: 400 };
let livingStoneBossHp = 0;
let livingStoneBossMaxHp = 0;
let livingStonePlayerHp = 70;
let livingStonePlayerMaxHp = 70;
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

// QTE
let qteBullets = [];
let qtePunches = [];
let qteActive = false;
let qteClicks = 0;
let qteTimerRef = null;
let qteStartDelayTimer = null;
let qteEndTimer = null;

// Музыка
let qteMusic = null;
let qteMusicReady = false;
let qteMusicStartOffset = 30;
let qteMusicQteStart = 52;
let qteMusicQteEnd = 80;

// ========== ЗАПУСК ==========
function startLivingStoneFight() {
    livingStoneActive = true;
    livingStoneState = "phase1";
    livingStoneBossMaxHp = 78400;
    livingStoneBossHp = livingStoneBossMaxHp;
    livingStoneBoss = { x: 200, y: 100, size: 40, vx: 0.8, rotation: 0 };
    livingStonePlayer = { x: 200, y: 400 };
    livingStonePlayerHp = 70;
    livingStonePlayerMaxHp = 70;
    livingStoneInvulnTimer = 0;
    livingStoneAttacks = [];
    livingStoneBullets = [];
    livingStoneParticles = [];
    livingStoneTexts = [];
    livingStoneAttackTimer = 0;
    livingStoneAttackType = 0;
    livingStoneTypeTimer = 400;
    livingStoneShootTimer = 0;
    livingStoneShake = 0;
    livingStoneScreenFlash = 0;
    livingStoneBossFlash = 0;
    livingStoneRestoreCount = 0;
    livingStoneRestoring = false;
    qteBullets = [];
    qtePunches = [];
    qteActive = false;
    qteClicks = 0;
    initLivingStoneBgParticles();
    
    // ★ ГЛУШИМ ФОНОВУЮ МУЗЫКУ ★
    if (typeof stopAllMusic === 'function') {
        stopAllMusic();
    }
    
    ['superBtn', 'superBtn2', 'superBtnDeactivate', 'startArenaBtn', 'skipBossBtn', 'spareBtn', 'startLivingStoneBtn'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    
    var overlay = document.getElementById("arenaOverlay");
    if (overlay) overlay.style.display = "flex";
    
    var bossNameEl = document.getElementById("arenaBossName");
    if (bossNameEl) bossNameEl.innerText = "🪨 ЖИВОЙ КАМЕНЬ";
    var arenaHpEl = document.getElementById("arenaHP");
    if (arenaHpEl) arenaHpEl.innerText = livingStonePlayerHp;
    var timerEl = document.getElementById("arenaTimer");
    if (timerEl) timerEl.innerText = "∞";
    
    if (typeof initArena === 'function') initArena();
    if (typeof canvas === 'undefined' || !canvas) return;
    if (typeof arenaActive !== 'undefined') arenaActive = false;
    
    canvas.addEventListener("click", handleQTEClick);
    canvas.addEventListener("touchstart", handleQTETouch);
    
    if (livingStoneAnimFrame) cancelAnimationFrame(livingStoneAnimFrame);
    livingStoneAnimFrame = requestAnimationFrame(livingStoneRenderLoop);
    
    if (typeof playArenaSound === 'function') {
        playArenaSound(60, 'sawtooth', 1.5, 0.2);
        setTimeout(function() { playArenaSound(50, 'sawtooth', 1.5, 0.15); }, 300);
    }
    
    spawnLivingStoneText(200, 220, "ЖИВОЙ КАМЕНЬ", "#888888", 120);
    spawnLivingStoneText(200, 260, "«Попробуй меня пробить!»", "#aaaaaa", 120);
}

function stopLivingStoneFight() {
    livingStoneActive = false;
    if (livingStoneAnimFrame) {
        cancelAnimationFrame(livingStoneAnimFrame);
        livingStoneAnimFrame = null;
    }
    livingStoneAttacks = [];
    livingStoneBullets = [];
    livingStoneParticles = [];
    livingStoneTexts = [];
    qteBullets = [];
    qtePunches = [];
    stopQTEMusic();
    if (qteTimerRef) { clearTimeout(qteTimerRef); qteTimerRef = null; }
    if (qteStartDelayTimer) { clearTimeout(qteStartDelayTimer); qteStartDelayTimer = null; }
    if (qteEndTimer) { clearTimeout(qteEndTimer); qteEndTimer = null; }
    
    if (typeof canvas !== 'undefined' && canvas) {
        canvas.removeEventListener("click", handleQTEClick);
        canvas.removeEventListener("touchstart", handleQTETouch);
    }
    
    var overlay = document.getElementById("arenaOverlay");
    if (overlay) overlay.style.display = "none";
    
    // ★ ВОЗВРАЩАЕМ ФОНОВУЮ МУЗЫКУ ★
    if (typeof startBattleMusic === 'function') {
        startBattleMusic();
    }
}

function initLivingStoneBgParticles() {
    livingStoneBgParticles = [];
    for (var i = 0; i < 50; i++) {
        livingStoneBgParticles.push({
            x: Math.random() * 400,
            y: Math.random() * 500,
            size: 0.5 + Math.random() * 2,
            speed: 0.05 + Math.random() * 0.2,
            alpha: 0.1 + Math.random() * 0.4,
            type: Math.random() > 0.7 ? "rock" : "dust"
        });
    }
}

// ========== ВСПОМОГАТЕЛЬНОЕ ==========
function spawnLivingStoneText(x, y, text, color, life) {
    livingStoneTexts.push({ x: x, y: y, text: text, color: color, life: life || 60, vy: -0.3, vx: 0 });
}

function spawnLivingStoneParticles(x, y, count, color, speed) {
    for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var spd = speed * (0.5 + Math.random());
        livingStoneParticles.push({
            x: x, y: y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            color: color,
            size: 1 + Math.random() * 3
        });
    }
}

// ========== СТРЕЛЬБА (ТОЛЬКО ВВЕРХ) ==========
function livingStoneShoot() {
    livingStoneBullets.push({
        x: livingStonePlayer.x,
        y: livingStonePlayer.y - 8,
        vx: 0,
        vy: -7,
        size: 4,
        damage: 250,
        life: 120
    });
    if (typeof playArenaSound === 'function') {
        playArenaSound(900, 'square', 0.05, 0.02);
    }
}

// ========== АТАКИ БОССА (ФАЗА 1) ==========
function livingStoneSpawnAttack() {
    var type = livingStoneAttackType;
    var isPhase2 = (livingStoneState === "phase2");
    var speedMult = isPhase2 ? 1.4 : 1.0;
    var dmgMult = isPhase2 ? 1.3 : 1.0;
    
    // ФАЗА 1: 7 типов атак (0-6)
    // ФАЗА 2: 11 типов атак (0-10)
    
    if (type === 0) {
        // КАМНЕПАД
        var count = isPhase2 ? 5 : 3;
        for (var i = 0; i < count; i++) {
            livingStoneAttacks.push({
                type: "rock",
                x: 30 + Math.random() * 340,
                y: -20,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (2.2 + Math.random() * 1.2) * speedMult,
                size: 14,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.1,
                damage: Math.floor(8 * dmgMult)
            });
        }
    } else if (type === 1) {
        // КОЛЬЦО
        livingStoneAttacks.push({
            type: "ring",
            x: livingStoneBoss.x,
            y: livingStoneBoss.y,
            radius: 10,
            maxRadius: 320,
            growth: 2.0 * speedMult,
            damage: Math.floor(7 * dmgMult),
            thickness: 18,
            color: "#8B7355"
        });
    } else if (type === 2) {
        // ОБЛОМКИ
        var count2 = isPhase2 ? 12 : 8;
        for (var i = 0; i < count2; i++) {
            var angle = (i / count2) * Math.PI * 2;
            livingStoneAttacks.push({
                type: "orb",
                x: livingStoneBoss.x,
                y: livingStoneBoss.y,
                vx: Math.cos(angle) * 2.2 * speedMult,
                vy: Math.sin(angle) * 2.2 * speedMult,
                size: 8,
                damage: Math.floor(6 * dmgMult),
                life: 200,
                color: "#a08060"
            });
        }
    } else if (type === 3) {
        // ГОМИНГ
        var count3 = isPhase2 ? 3 : 2;
        for (var i = 0; i < count3; i++) {
            var angle = Math.random() * Math.PI * 2;
            livingStoneAttacks.push({
                type: "homing",
                x: livingStoneBoss.x,
                y: livingStoneBoss.y,
                vx: Math.cos(angle) * 1.2,
                vy: Math.sin(angle) * 1.2,
                size: 11,
                damage: Math.floor(8 * dmgMult),
                life: 350,
                color: "#8B7355"
            });
        }
    } else if (type === 4) {
        // ★ ЛАЗЕРНЫЙ ЛУЧ (новый в фазе 1) ★
        var laserX = 60 + Math.random() * 280;
        livingStoneAttacks.push({
            type: "laser_warning",
            x: laserX,
            y: 0,
            width: 40,
            timer: 60,
            damage: Math.floor(10 * dmgMult)
        });
    } else if (type === 5) {
        // ★ ВЕЕР ОБЛОМКОВ (новый в фазе 1) ★
        var countV = isPhase2 ? 10 : 7;
        var baseAngle = Math.PI * 0.5;
        for (var i = 0; i < countV; i++) {
            var offset = (i - countV/2) * 0.18;
            livingStoneAttacks.push({
                type: "orb",
                x: livingStoneBoss.x,
                y: livingStoneBoss.y,
                vx: Math.cos(baseAngle + offset) * 2.5 * speedMult,
                vy: Math.sin(baseAngle + offset) * 2.5 * speedMult,
                size: 7,
                damage: Math.floor(5 * dmgMult),
                life: 200,
                color: "#c09070"
            });
        }
    } else if (type === 6) {
        // ★ ДОЖДЬ КАМНЕЙ (новый в фазе 1) ★
        var countR = isPhase2 ? 10 : 6;
        for (var i = 0; i < countR; i++) {
            livingStoneAttacks.push({
                type: "rock",
                x: Math.random() * 400,
                y: -20 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (3.0 + Math.random() * 1.0) * speedMult,
                size: 10 + Math.random() * 6,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.15,
                damage: Math.floor(6 * dmgMult)
            });
        }
    }
    
    // ===== ФАЗА 2: ЭКСКЛЮЗИВНЫЕ АТАКИ =====
    
    if (type === 7 && isPhase2) {
        // ★ РАЗЛОМ ЗЕМЛИ (шипы) ★
        for (var i = 0; i < 5; i++) {
            var x = 30 + i * 85 + Math.random() * 30;
            livingStoneAttacks.push({
                type: "spike",
                x: x,
                y: 500,
                height: 0,
                maxHeight: 60 + Math.random() * 40,
                warningTimer: 45,
                damage: Math.floor(12 * dmgMult),
                color: "#5a4030"
            });
        }
    } else if (type === 8 && isPhase2) {
        // ★ ДВОЙНОЕ КОЛЬЦО (кольцо + кольцо с задержкой) ★
        livingStoneAttacks.push({
            type: "ring",
            x: livingStoneBoss.x,
            y: livingStoneBoss.y,
            radius: 10,
            maxRadius: 350,
            growth: 2.2 * speedMult,
            damage: Math.floor(8 * dmgMult),
            thickness: 15,
            color: "#ff8800"
        });
        setTimeout(function() {
            if (!livingStoneActive) return;
            livingStoneAttacks.push({
                type: "ring",
                x: livingStoneBoss.x,
                y: livingStoneBoss.y,
                radius: 10,
                maxRadius: 350,
                growth: 2.2 * speedMult,
                damage: Math.floor(8 * dmgMult),
                thickness: 15,
                color: "#ff4400"
            });
        }, 300);
    } else if (type === 9 && isPhase2) {
        // ★ СТЕНА С ПРОХОДОМ (как в Undertale) ★
        var isVertical = Math.random() > 0.5;
        if (isVertical) {
            var gapCenter = livingStonePlayer.y;
            var gapSize = 90;
            var startX = Math.random() > 0.5 ? -30 : 430;
            var dirX = startX < 0 ? 4 * speedMult : -4 * speedMult;
            for (var i = 10; i < 490; i += 30) {
                if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                livingStoneAttacks.push({
                    type: "rock",
                    x: startX,
                    y: i,
                    vx: dirX,
                    vy: 0,
                    size: 22,
                    rotation: 0,
                    rotSpeed: 0.05,
                    damage: Math.floor(9 * dmgMult)
                });
            }
        } else {
            var gapCenter = livingStonePlayer.x;
            var gapSize = 90;
            var startY = Math.random() > 0.5 ? -30 : 530;
            var dirY = startY < 0 ? 3.0 * speedMult : -3.0 * speedMult;
            for (var i = 10; i < 390; i += 30) {
                if (Math.abs(i - gapCenter) < gapSize / 2) continue;
                livingStoneAttacks.push({
                    type: "rock",
                    x: i,
                    y: startY,
                    vx: 0,
                    vy: dirY,
                    size: 22,
                    rotation: 0,
                    rotSpeed: 0.05,
                    damage: Math.floor(9 * dmgMult)
                });
            }
        }
    } else if (type === 10 && isPhase2) {
        // ★ МЕГА-ЛАЗЕР + КАМНЕПАД ★
        var laserX2 = 100 + Math.random() * 200;
        livingStoneAttacks.push({
            type: "laser_warning",
            x: laserX2,
            y: 0,
            width: 70,
            timer: 50,
            damage: Math.floor(15 * dmgMult)
        });
        for (var i = 0; i < 4; i++) {
            livingStoneAttacks.push({
                type: "rock",
                x: Math.random() * 400,
                y: -20,
                vx: (Math.random() - 0.5) * 1.0,
                vy: (2.8 + Math.random() * 1.0) * speedMult,
                size: 12,
                rotation: 0,
                rotSpeed: 0.08,
                damage: Math.floor(7 * dmgMult)
            });
        }
    }
}

// ========== ОБНОВЛЕНИЯ ==========
function updateLivingStonePlayer() {
    if (livingStoneState === "restore" || livingStoneState === "qte_intro" || 
        livingStoneState === "qte_punch" || livingStoneState === "qte_finish") return;
    if (typeof keys === 'undefined') return;
    
    var mx = 0, my = 0;
    if (keys.w || keys.up) my -= 1;
    if (keys.s || keys.down) my += 1;
    if (keys.a || keys.left) mx -= 1;
    if (keys.d || keys.right) mx += 1;
    
    var speed = 3.0;
    if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }
    
    livingStonePlayer.x += mx * speed;
    livingStonePlayer.y += my * speed;
    
    livingStonePlayer.x = Math.max(16, Math.min(384, livingStonePlayer.x));
    livingStonePlayer.y = Math.max(80, Math.min(484, livingStonePlayer.y));
}

function updateLivingStoneBoss() {
    if (livingStoneRestoring) return;
    
    var speedMult = (livingStoneState === "phase2") ? 1.8 : 1.0;
    livingStoneBoss.x += livingStoneBoss.vx * speedMult;
    if (livingStoneBoss.x < 80 || livingStoneBoss.x > 320) livingStoneBoss.vx *= -1;
    livingStoneBoss.rotation += 0.01 * speedMult;
}

function updateLivingStoneBullets() {
    for (var i = livingStoneBullets.length - 1; i >= 0; i--) {
        var b = livingStoneBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        
        var dx = b.x - livingStoneBoss.x;
        var dy = b.y - livingStoneBoss.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < livingStoneBoss.size + b.size) {
            damageLivingStone(b.damage);
            spawnLivingStoneParticles(b.x, b.y, 6, "#ffdd00", 3);
            livingStoneBullets.splice(i, 1);
            continue;
        }
        
        if (b.life <= 0 || b.y < -20 || b.y > 520 || b.x < -20 || b.x > 420) {
            livingStoneBullets.splice(i, 1);
        }
    }
}

function damageLivingStone(dmg) {
    if (livingStoneRestoring) return;
    if (livingStoneState !== "phase1" && livingStoneState !== "phase2") return;
    if (livingStoneState === "phase2" && livingStoneBossHp <= 0) return;
    
    livingStoneBossHp -= dmg;
    livingStoneBossFlash = 5;
    
    if (livingStoneBossHp <= livingStoneBossMaxHp * 0.05 && livingStoneRestoreCount === 0) {
        triggerRestoreScene();
        return;
    }
    
    if (livingStoneBossHp <= 0 && livingStoneState === "phase2") {
        livingStoneBossHp = 0;
        livingStoneVictory();
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
        if (!livingStoneRestoring) { clearInterval(healInterval); return; }
        livingStoneBossHp = Math.min(livingStoneBossMaxHp, livingStoneBossHp + livingStoneBossMaxHp * 0.04);
        spawnLivingStoneParticles(livingStoneBoss.x + (Math.random() - 0.5) * 40, livingStoneBoss.y + (Math.random() - 0.5) * 40, 3, "#a08060", 3);
        if (livingStoneBossHp >= livingStoneBossMaxHp) {
            clearInterval(healInterval);
            livingStoneBossHp = livingStoneBossMaxHp;
        }
    }, 40);
    
    if (typeof playArenaSound === 'function') {
        playArenaSound(80, 'sawtooth', 2.0, 0.25);
        setTimeout(function() { playArenaSound(100, 'sawtooth', 1.5, 0.2); }, 400);
        setTimeout(function() { playArenaSound(150, 'sawtooth', 1.2, 0.15); }, 800);
    }
    
    livingStoneShake = 25;
    
    setTimeout(function() {
        if (livingStoneActive) triggerMusicScene();
    }, 3000);
}

// ========== МУЗЫКАЛЬНАЯ СЦЕНА ==========
function triggerMusicScene() {
    if (!livingStoneActive) return;
    livingStoneState = "qte_intro";
    livingStoneBossHp = livingStoneBossMaxHp;
    
    startQTEMusic();
    
    spawnLivingStoneText(200, 200, "STANDING HERE...", "#ffffff", 180);
    
    setTimeout(function() {
        if (!livingStoneActive) return;
        spawnLivingStoneText(200, 240, "I REALIZE...", "#ffdd00", 180);
        livingStoneScreenFlash = 15;
        livingStoneScreenFlashColor = "#ffffff";
    }, 5000);
    
    setTimeout(function() {
        if (!livingStoneActive) return;
        spawnLivingStoneText(200, 280, "ТЫ ВСЁ ЕЩЁ СТОИШЬ?", "#888888", 180);
    }, 12000);
    
    setTimeout(function() {
        if (!livingStoneActive) return;
        spawnLivingStoneText(200, 320, "Я ПОКАЖУ ТЕБЕ!", "#ff4444", 180);
    }, 18000);
    
    qteStartDelayTimer = setTimeout(function() {
        if (!livingStoneActive) return;
        triggerQTEStart();
    }, 22000);
}

// ========== QTE ==========
function triggerQTEStart() {
    if (!livingStoneActive) return;
    livingStoneState = "qte_punch";
    qteActive = true;
    qteClicks = 0;
    
    livingStonePlayer.x = livingStoneBoss.x - 60;
    livingStonePlayer.y = livingStoneBoss.y + 60;
    
    livingStoneShake = 20;
    livingStoneScreenFlash = 12;
    livingStoneScreenFlashColor = "#ffffff";
    
    if (typeof playArenaSound === 'function') {
        playArenaSound(60, 'square', 0.3, 0.3);
    }
    
    spawnLivingStoneText(200, 200, "«ПОКАЖИ МНЕ СВОЮ СИЛУ!»", "#ffdd00", 180);
    
    spawnQTEBarrage();
    
    var barrageInterval = setInterval(function() {
        if (!qteActive || !livingStoneActive) { clearInterval(barrageInterval); return; }
        spawnQTEBarrage();
    }, 400);
    
    qteEndTimer = setTimeout(function() {
        clearInterval(barrageInterval);
        if (!livingStoneActive) return;
        triggerQTEFinish();
    }, 28000);
}

function spawnQTEBarrage() {
    var sides = ["left", "right", "top", "bottom"];
    for (var i = 0; i < 6; i++) {
        var side = sides[Math.floor(Math.random() * sides.length)];
        var startX, startY;
        
        if (side === "left") {
            startX = -20 - Math.random() * 30;
            startY = 50 + Math.random() * 400;
        } else if (side === "right") {
            startX = 420 + Math.random() * 30;
            startY = 50 + Math.random() * 400;
        } else if (side === "top") {
            startX = 50 + Math.random() * 300;
            startY = -20 - Math.random() * 30;
        } else {
            startX = 50 + Math.random() * 300;
            startY = 520 + Math.random() * 30;
        }
        
        var dx = livingStoneBoss.x - startX;
        var dy = livingStoneBoss.y - startY;
        var len = Math.sqrt(dx*dx + dy*dy) || 1;
        var speed = 12 + Math.random() * 8;
        
        qteBullets.push({
            x: startX,
            y: startY,
            vx: (dx/len) * speed,
            vy: (dy/len) * speed,
            size: 4 + Math.random() * 4,
            life: 60,
            color: Math.random() > 0.5 ? "#ffdd00" : "#ffffff"
        });
    }
    
    for (var j = 0; j < 3; j++) {
        qteBullets.push({
            x: livingStonePlayer.x + (Math.random() - 0.5) * 30,
            y: livingStonePlayer.y,
            vx: (Math.random() - 0.5) * 3,
            vy: -15 - Math.random() * 5,
            size: 5 + Math.random() * 4,
            life: 60,
            color: "#ffffff"
        });
    }
    
    livingStoneShake = Math.max(livingStoneShake, 8);
}

function updateQTEBullets() {
    for (var i = qteBullets.length - 1; i >= 0; i--) {
        var b = qteBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        
        var dx = b.x - livingStoneBoss.x;
        var dy = b.y - livingStoneBoss.y;
        if (Math.sqrt(dx*dx + dy*dy) < livingStoneBoss.size) {
            spawnLivingStoneParticles(b.x, b.y, 5, b.color, 5);
            qteBullets.splice(i, 1);
            continue;
        }
        
        if (b.life <= 0 || b.x < -100 || b.x > 500 || b.y < -100 || b.y > 600) {
            qteBullets.splice(i, 1);
        }
    }
}

function handleQTEClick(ev) {
    if (livingStoneState !== "qte_punch" || !qteActive) return;
    qteClicks++;
    
    qtePunches.push({
        x: livingStoneBoss.x + (Math.random() - 0.5) * 80,
        y: livingStoneBoss.y + (Math.random() - 0.5) * 80,
        life: 12,
        maxLife: 12,
        size: 20 + Math.random() * 25,
        angle: Math.random() * Math.PI * 2
    });
    
    for (var i = 0; i < 4; i++) {
        var angle = Math.random() * Math.PI * 2;
        var startDist = 100 + Math.random() * 50;
        var sx = livingStoneBoss.x + Math.cos(angle) * startDist;
        var sy = livingStoneBoss.y + Math.sin(angle) * startDist;
        var dx = livingStoneBoss.x - sx;
        var dy = livingStoneBoss.y - sy;
        var len = Math.sqrt(dx*dx + dy*dy) || 1;
        
        qteBullets.push({
            x: sx,
            y: sy,
            vx: (dx/len) * 15,
            vy: (dy/len) * 15,
            size: 4 + Math.random() * 3,
            life: 60,
            color: Math.random() > 0.5 ? "#ffdd00" : "#ffffff"
        });
    }
    
    livingStoneShake = Math.max(livingStoneShake, 6);
    
    if (typeof playArenaSound === 'function') {
        playArenaSound(200 + Math.random() * 300, 'square', 0.08, 0.12);
    }
}

function handleQTETouch(ev) {
    if (livingStoneState !== "qte_punch" || !qteActive) return;
    ev.preventDefault();
    handleQTEClick(ev);
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
        
        livingStoneShake = 40;
        livingStoneScreenFlash = 30;
        livingStoneScreenFlashColor = "#ff0000";
        livingStonePlayerHp -= 15;
        
        if (typeof playArenaSound === 'function') {
            playArenaSound(40, 'sawtooth', 1.5, 0.4);
        }
        
        spawnLivingStoneText(200, 250, "БЕСПОЛЕЗНО!", "#888888", 120);
        spawnLivingStoneText(200, 290, "«ТЫ НИЧЕГО МНЕ НЕ СДЕЛАЕШЬ!»", "#666666", 120);
        
        setTimeout(function() {
            if (!livingStoneActive) return;
            triggerPhase2();
        }, 2500);
    }, 500);
}

function triggerPhase2() {
    livingStoneState = "phase2";
    qtePunches = [];
    qteBullets = [];
    livingStoneAttacks = [];
    livingStoneBossHp = livingStoneBossMaxHp;
    livingStoneBoss.vx = 1.5;
    livingStoneAttackType = 7; // Разлом земли
    livingStoneTypeTimer = 200;
    livingStoneInvulnTimer = 60;
    
    livingStoneScreenFlash = 20;
    livingStoneScreenFlashColor = "#ff4400";
    livingStoneShake = 25;
    
    spawnLivingStoneText(200, 220, "ФАЗА 2", "#ff4400", 120);
    spawnLivingStoneText(200, 260, "«ТЕПЕРЬ Я ЗЛОЙ!»", "#ff6600", 120);
    
    if (typeof playArenaSound === 'function') {
        playArenaSound(80, 'sawtooth', 1.5, 0.3);
        setTimeout(function() { playArenaSound(120, 'sawtooth', 1.0, 0.25); }, 300);
    }
}

// ========== РЕЗУЛЬТАТЫ ==========
function livingStoneVictory() {
    livingStoneState = "victory";
    spawnLivingStoneText(200, 200, "КАМЕНЬ РАЗБИТ!", "#ffffff", 180);
    livingStoneScreenFlash = 40;
    livingStoneScreenFlashColor = "#ffffff";
    
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
        stopLivingStoneFight();
        if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
        if (typeof victory === 'function') victory();
    }, 2500);
}

function livingStoneDefeat() {
    livingStoneState = "defeat";
    spawnLivingStoneText(200, 250, "КАМЕНЬ НЕПОБЕДИМ", "#ff0000", 180);
    livingStoneScreenFlash = 40;
    livingStoneScreenFlashColor = "#ff0000";
    
    if (typeof playArenaSound === 'function') playArenaSound(40, 'sawtooth', 2.5, 0.3);
    
    setTimeout(function() {
        stopLivingStoneFight();
        if (typeof playerHp !== 'undefined') playerHp = 0;
        if (typeof defeat === 'function') defeat();
    }, 2500);
}

// ========== ОБНОВЛЕНИЕ АТАК ==========
function updateLivingStoneAttacks() {
    for (var i = livingStoneAttacks.length - 1; i >= 0; i--) {
        var a = livingStoneAttacks[i];
        
        if (a.type === "rock") {
            a.x += a.vx;
            a.y += a.vy;
            a.rotation += a.rotSpeed;
            if (a.y > 520 || a.y < -150 || a.x < -100 || a.x > 500) livingStoneAttacks.splice(i, 1);
        } else if (a.type === "ring") {
            a.radius += a.growth;
            if (a.radius > a.maxRadius) livingStoneAttacks.splice(i, 1);
        } else if (a.type === "orb") {
            a.x += a.vx;
            a.y += a.vy;
            a.life--;
            if (a.life <= 0 || a.y > 520 || a.y < -20 || a.x < -20 || a.x > 420) {
                livingStoneAttacks.splice(i, 1);
            }
        } else if (a.type === "homing") {
            var dx = livingStonePlayer.x - a.x;
            var dy = livingStonePlayer.y - a.y;
            var len = Math.sqrt(dx*dx + dy*dy) || 1;
            a.vx += (dx/len) * 0.12;
            a.vy += (dy/len) * 0.12;
            var spd = Math.sqrt(a.vx*a.vx + a.vy*a.vy);
            if (spd > 2.8) { a.vx = (a.vx/spd)*2.8; a.vy = (a.vy/spd)*2.8; }
            a.x += a.vx;
            a.y += a.vy;
            a.life--;
            if (a.life <= 0 || a.y > 520 || a.y < -20 || a.x < -20 || a.x > 420) {
                livingStoneAttacks.splice(i, 1);
            }
        } else if (a.type === "spike") {
            if (a.warningTimer > 0) {
                a.warningTimer--;
            } else {
                a.height += 4;
                if (a.height >= a.maxHeight) {
                    a.height = a.maxHeight;
                    a.stayTimer = (a.stayTimer || 0) + 1;
                    if (a.stayTimer > 30) {
                        a.height -= 3;
                        if (a.height <= 0) livingStoneAttacks.splice(i, 1);
                    }
                }
            }
        } else if (a.type === "laser_warning") {
            a.timer--;
            if (a.timer <= 0) {
                livingStoneAttacks.splice(i, 1);
                livingStoneAttacks.push({
                    type: "laser",
                    x: a.x,
                    y: 0,
                    width: a.width,
                    timer: 25,
                    damage: a.damage,
                    hit: false
                });
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
    
    var px = livingStonePlayer.x, py = livingStonePlayer.y;
    var ph = 6;
    
    for (var i = 0; i < livingStoneAttacks.length; i++) {
        var a = livingStoneAttacks[i];
        var hit = false;
        
        if (a.type === "rock" || a.type === "homing" || a.type === "orb") {
            var dx = px - a.x, dy = py - a.y;
            if (Math.sqrt(dx*dx + dy*dy) < a.size + ph) hit = true;
        } else if (a.type === "ring") {
            var dx = px - a.x, dy = py - a.y;
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (Math.abs(dist - a.radius) < a.thickness/2 + ph) hit = true;
        } else if (a.type === "spike" && a.warningTimer <= 0 && a.height > 10) {
            if (Math.abs(px - a.x) < 30 + ph && py > 500 - a.height) hit = true;
        } else if (a.type === "laser") {
            if (Math.abs(px - a.x) < a.width/2 + ph) hit = true;
        }
        
        if (hit) {
            damageLivingStonePlayer(a.damage || 5);
            return;
        }
    }
}

function damageLivingStonePlayer(dmg) {
    if (livingStoneInvulnTimer > 0) return;
    livingStonePlayerHp -= dmg;
    livingStoneInvulnTimer = 50;
    livingStoneShake = 12;
    livingStoneScreenFlash = 8;
    livingStoneScreenFlashColor = "#ff0000";
    
    var hpEl = document.getElementById("arenaHP");
    if (hpEl) hpEl.innerText = Math.max(0, Math.ceil(livingStonePlayerHp));
    
    spawnLivingStoneParticles(livingStonePlayer.x, livingStonePlayer.y, 15, "#ff3333", 4);
    
    if (typeof playArenaSound === 'function') playArenaSound(60, 'sawtooth', 0.5, 0.15);
    
    if (livingStonePlayerHp <= 0) {
        livingStoneDefeat();
    }
}

// ========== МУЗЫКА ==========
function startQTEMusic() {
    if (qteMusic) {
        try { qteMusic.pause(); } catch(e) {}
        qteMusic = null;
    }
    
    // ★ ГЛУШИМ ВСЮ ФОНОВУЮ МУЗЫКУ ★
    if (typeof stopAllMusic === 'function') {
        stopAllMusic();
    }
    
    try {
        qteMusic = new Audio("music/стендзи хер ай реалзайз.mp3");
        qteMusic.volume = 0.6;
        qteMusic.currentTime = qteMusicStartOffset;
        
        qteMusic.addEventListener('loadedmetadata', function() {
            try { qteMusic.currentTime = qteMusicStartOffset; } catch(e) {}
        });
        
        qteMusic.addEventListener('timeupdate', function() {
            if (!qteMusic || !qteMusic.duration) return;
            if (qteMusic.currentTime >= qteMusic.duration - 0.5) {
                try { qteMusic.currentTime = qteMusicStartOffset; } catch(e) {}
            }
        });
        
        qteMusic.play().then(function() {
            qteMusicReady = true;
        }).catch(function(err) {
            console.warn("Не удалось запустить музыку Живого Камня:", err);
            qteMusicReady = false;
        });
    } catch(e) {
        console.warn("Ошибка музыки:", e);
        qteMusicReady = false;
    }
}

function stopQTEMusic() {
    if (qteMusic) {
        try {
            qteMusic.pause();
            qteMusic.currentTime = 0;
        } catch(e) {}
        qteMusic = null;
    }
    qteMusicReady = false;
}

// ========== РЕНДЕР ==========
function livingStoneRenderLoop() {
    if (!livingStoneActive) return;
    if (typeof ctx === 'undefined' || !ctx) return;
    if (typeof canvas === 'undefined' || !canvas) return;
    
    updateLivingStonePlayer();
    updateLivingStoneBoss();
    
    if (livingStoneState === "phase1" || livingStoneState === "phase2") {
        livingStoneShootTimer++;
        if (livingStoneShootTimer >= 6) {
            livingStoneShootTimer = 0;
            livingStoneShoot();
        }
        
        livingStoneAttackTimer++;
        var attackRate = (livingStoneState === "phase2") ? 30 : 45;
        if (livingStoneAttackTimer >= attackRate) {
            livingStoneAttackTimer = 0;
            livingStoneSpawnAttack();
        }
        
        livingStoneTypeTimer--;
        if (livingStoneTypeTimer <= 0) {
            // ★ РАЗНЫЕ АТАКИ ДЛЯ РАЗНЫХ ФАЗ ★
            if (livingStoneState === "phase2") {
                // Фаза 2: 11 типов (0-10)
                livingStoneAttackType = Math.floor(Math.random() * 11);
                livingStoneTypeTimer = 200 + Math.floor(Math.random() * 200);
            } else {
                // Фаза 1: 7 типов (0-6)
                livingStoneAttackType = Math.floor(Math.random() * 7);
                livingStoneTypeTimer = 250 + Math.floor(Math.random() * 250);
            }
            var typeNames = [
                "🪨 КАМНЕПАД", "💫 КОЛЬЦО", "🌀 ОБЛОМКИ", "🎯 ГОМИНГ",
                "🔺 ЛАЗЕР", "🌊 ВЕЕР", "☔ ДОЖДЬ КАМНЕЙ",
                "⚡ РАЗЛОМ", "💥 ДВОЙНОЕ КОЛЬЦО", "🧱 СТЕНА", "🔴 МЕГА-ЛАЗЕР"
            ];
            spawnLivingStoneText(200, 60, typeNames[livingStoneAttackType], "#888888", 60);
        }
    }
    
    updateLivingStoneBullets();
    updateLivingStoneAttacks();
    checkLivingStoneCollisions();
    updateQTEBullets();
    
    for (var i = qtePunches.length - 1; i >= 0; i--) {
        qtePunches[i].life--;
        if (qtePunches[i].life <= 0) qtePunches.splice(i, 1);
    }
    
    for (var i = livingStoneParticles.length - 1; i >= 0; i--) {
        var p = livingStoneParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;
        if (p.life <= 0) livingStoneParticles.splice(i, 1);
    }
    
    for (var i = livingStoneTexts.length - 1; i >= 0; i--) {
        var t = livingStoneTexts[i];
        t.y += t.vy;
        t.life--;
        if (t.life <= 0) livingStoneTexts.splice(i, 1);
    }
    
    for (var i = 0; i < livingStoneBgParticles.length; i++) {
        var bp = livingStoneBgParticles[i];
        bp.y += bp.speed;
        if (bp.y > 500) { bp.y = 0; bp.x = Math.random() * 400; }
    }
    
    if (livingStoneInvulnTimer > 0) livingStoneInvulnTimer--;
    if (livingStoneBossFlash > 0) livingStoneBossFlash--;
    if (livingStoneScreenFlash > 0) livingStoneScreenFlash--;
    
    var sx = 0, sy = 0;
    if (livingStoneShake > 0.5) {
        sx = (Math.random() - 0.5) * livingStoneShake;
        sy = (Math.random() - 0.5) * livingStoneShake;
        livingStoneShake *= 0.88;
        if (livingStoneShake < 0.5) livingStoneShake = 0;
    }
    
    ctx.save();
    ctx.translate(sx, sy);
    ctx.clearRect(-15, -15, 430, 530);
    
    var isQTE = (livingStoneState === "qte_intro" || livingStoneState === "qte_punch" || livingStoneState === "qte_finish");
    var bgGrad = ctx.createLinearGradient(0, 0, 0, 500);
    if (isQTE) {
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
        if (bp.type === "rock") {
            ctx.fillStyle = "#5a4030";
            ctx.fillRect(bp.x, bp.y, bp.size * 2, bp.size * 2);
        } else {
            ctx.fillStyle = "#a08060";
            ctx.fillRect(bp.x, bp.y, bp.size, bp.size);
        }
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
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 15;
    ctx.strokeRect(2, 2, 396, 496);
    ctx.shadowBlur = 0;
    
    for (var i = 0; i < livingStoneAttacks.length; i++) {
        var a = livingStoneAttacks[i];
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
            ctx.shadowColor = "#000000";
            ctx.shadowBlur = 10;
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
            ctx.fillRect(a.x - a.width/2, 0, a.width, 500);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.strokeRect(a.x - a.width/2, 0, a.width, 500);
            ctx.restore();
        } else if (a.type === "laser") {
            ctx.save();
            ctx.globalAlpha = a.timer / 25;
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ff4400";
            ctx.shadowBlur = 30;
            ctx.fillRect(a.x - a.width/2, 0, a.width, 500);
            ctx.fillStyle = "#ff4400";
            ctx.fillRect(a.x - a.width/3, 0, a.width * 2/3, 500);
            ctx.restore();
        }
    }
    
    for (var i = 0; i < livingStoneBullets.length; i++) {
        var b = livingStoneBullets[i];
        ctx.save();
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 12;
        var grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.6, "#ffff88");
        grad.addColorStop(1, "rgba(255,255,136,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    if (!isQTE || livingStoneState === "qte_punch" || livingStoneState === "qte_finish") {
        drawLivingStoneBoss();
    }
    
    if (!isQTE || livingStoneState === "qte_punch" || livingStoneState === "qte_finish") {
        drawLivingStonePlayer();
    }
    
    if (livingStoneState === "qte_punch") {
        for (var i = 0; i < qteBullets.length; i++) {
            var b = qteBullets[i];
            ctx.save();
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 15;
            var grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2);
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.5, b.color);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
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
            var alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#ffff00";
            ctx.shadowBlur = 20;
            for (var j = 0; j < 4; j++) {
                var ang = (p.angle || 0) + j * Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + Math.cos(ang) * p.size, p.y + Math.sin(ang) * p.size);
                ctx.stroke();
            }
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5 * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    for (var i = 0; i < livingStoneParticles.length; i++) {
        var p = livingStoneParticles[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
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
    
    if (isQTE) drawQTEOverlay();
    
    if (!isQTE) drawLivingStoneHpBars();
    
    ctx.restore();
    
    livingStoneAnimFrame = requestAnimationFrame(livingStoneRenderLoop);
}

function drawLivingStoneBoss() {
    var b = livingStoneBoss;
    var pulse = 1.0 + Math.sin(performance.now() / 300) * 0.05;
    var size = b.size * pulse;
    
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.sin(b.rotation) * 0.05);
    
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    var grad = ctx.createRadialGradient(-size*0.3, -size*0.3, 1, 0, 0, size * 1.5);
    if (livingStoneBossFlash > 0) {
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#ff8800");
    } else if (livingStoneState === "phase2") {
        grad.addColorStop(0, "#c09070");
        grad.addColorStop(0.5, "#8B4a30");
        grad.addColorStop(1, "#5a2010");
    } else {
        grad.addColorStop(0, "#a08060");
        grad.addColorStop(0.5, "#8B7355");
        grad.addColorStop(1, "#5a4030");
    }
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    var sides = 8;
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
    ctx.strokeStyle = "#3a2818";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.strokeStyle = "#3a2818";
    ctx.lineWidth = 2;
    for (var i = 0; i < 4; i++) {
        ctx.beginPath();
        var ang1 = (i / 4) * Math.PI * 2 + 0.5;
        var ang2 = ang1 + 1.2;
        ctx.moveTo(Math.cos(ang1) * size * 0.3, Math.sin(ang1) * size * 0.3);
        ctx.lineTo(Math.cos(ang1) * size * 0.8, Math.sin(ang1) * size * 0.8);
        ctx.lineTo(Math.cos(ang2) * size * 0.9, Math.sin(ang2) * size * 0.9);
        ctx.stroke();
    }
    
    var eyeColor = (livingStoneState === "phase2") ? "#ff2200" : "#ffaa00";
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(-size * 0.3, -size * 0.15, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.3, -size * 0.15, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#000000";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(-size * 0.28, -size * 0.13, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.32, -size * 0.13, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawLivingStonePlayer() {
    var p = livingStonePlayer;
    if (livingStoneInvulnTimer > 0 && Math.floor(livingStoneInvulnTimer / 4) % 2 === 0) return;
    
    ctx.save();
    ctx.translate(p.x, p.y);
    
    var glowGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    glowGrad.addColorStop(0, "rgba(255,100,100,0.6)");
    glowGrad.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = glowGrad;
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
    var barWidth = 360;
    var barHeight = 14;
    var x = 20;
    var y = 8;
    
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 4, y - 4, barWidth + 8, barHeight + 8);
    
    ctx.fillStyle = "#2a1a00";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    var ratio = Math.max(0, livingStoneBossHp / livingStoneBossMaxHp);
    var hpWidth = barWidth * ratio;
    var hpGrad = ctx.createLinearGradient(x, y, x, y + barHeight);
    if (livingStoneState === "phase2") {
        hpGrad.addColorStop(0, "#ff8800");
        hpGrad.addColorStop(1, "#cc2200");
    } else {
        hpGrad.addColorStop(0, "#a08060");
        hpGrad.addColorStop(1, "#5a4030");
    }
    ctx.fillStyle = hpGrad;
    ctx.shadowColor = livingStoneState === "phase2" ? "#ff4400" : "#8B7355";
    ctx.shadowBlur = 10;
    ctx.fillRect(x, y, hpWidth, barHeight);
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 3;
    ctx.fillText("🪨 " + Math.ceil(livingStoneBossHp).toLocaleString() + " / " + livingStoneBossMaxHp.toLocaleString(), x + barWidth/2, y + barHeight - 3);
    ctx.restore();
    
    var y2 = 480;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 4, y2 - 4, barWidth + 8, 20);
    
    ctx.fillStyle = "#2a0000";
    ctx.fillRect(x, y2, barWidth, 12);
    
    var ratio2 = Math.max(0, livingStonePlayerHp / livingStonePlayerMaxHp);
    ctx.fillStyle = ratio2 > 0.3 ? "#00ff66" : "#ff3333";
    ctx.shadowColor = ratio2 > 0.3 ? "#00ff66" : "#ff3333";
    ctx.shadowBlur = 8;
    ctx.fillRect(x, y2, barWidth * ratio2, 12);
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y2, barWidth, 12);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 3;
    ctx.fillText("❤️ " + Math.max(0, Math.ceil(livingStonePlayerHp)) + " / " + livingStonePlayerMaxHp, x + barWidth/2, y2 + 10);
    ctx.restore();
}

function drawQTEOverlay() {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 400, 500);
    ctx.restore();
    
    ctx.save();
    ctx.font = "bold 28px Impact, Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 20;
    
    var time = performance.now() / 1000;
    var scale = 1.0 + Math.sin(time * 4) * 0.05;
    
    ctx.translate(200, 80);
    ctx.scale(scale, scale);
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
        var blink = Math.floor(performance.now() / 300) % 2 === 0;
        if (blink) {
            ctx.fillText("▶ ПРИГОТОВЬСЯ...", 200, 440);
        }
        ctx.restore();
    } else if (livingStoneState === "qte_punch") {
        ctx.save();
        ctx.font = "bold 22px Impact, Arial Black, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 20;
        var blink2 = Math.floor(performance.now() / 150) % 2 === 0;
        if (blink2) {
            ctx.fillText("👊 НАЖИМАЙ! 👊", 200, 460);
        }
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
console.log("[LIVING STONE] Модуль загружен v3.1, startLivingStoneFight:", typeof window.startLivingStoneFight);
