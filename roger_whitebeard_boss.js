// ============================================================
// РОДЖЕР vs БЕЛОУС — БОСС 1000 ВОЛНЫ v4.0
// ============================================================
// Фаза 1: дерутся между собой + атакуют игрока
// Фаза 2: супер-форма, выживание 1 на 1
// Кнопка внизу: жёлтый / синий (сбивает атаки)
// У каждой атаки своё HP. Синяя пуля = 1 урон по атаке
// ============================================================

(function() {
    'use strict';

    if (window._rogerWhitebeardLoaded) {
        console.warn("[ROGER-WB] Уже загружено.");
        return;
    }
    window._rogerWhitebeardLoaded = true;

    window.rwbActive = false;

    // ========== СОСТОЯНИЕ ==========
    let rwbState = "intro";
    let rwbTimer = 0;
    let rwbIntroTimer = 0;
    let rwbTransitionTimer = 0;
    let rwbEndTimer = 0;
    let rwbSurvivalTimer2 = 0;
    let rwbSurvivalTarget2 = 1800; // 30 сек фаза 2
    let rwbActiveBoss = null;

    // Боссы
    let roger = null;
    let whitebeard = null;

    // Дуэль боссов
    let duel = null;

    // Игрок
    let rwbPlayer = null;

    // Объекты
    let rwbAttacks = [];
    let rwbPlayerBullets = [];
    let rwbParticles = [];
    let rwbShockwaves = [];
    let rwbFloatingTexts = [];
    let rwbSpeedLines = [];
    let rwbScreenFlash = 0;
    let rwbScreenFlashColor = "#ffffff";
    let rwbShake = 0;
    let rwbAnimFrame = null;
    let rwbBgStars = [];

    // Управление
    let rwbKeys = {};
    let rwbTouchActive = false;
    let rwbTouchId = null;
    let rwbTouchX = 0;
    let rwbTouchY = 0;

    let rwbModeBtn = null;

    // ========== ЗВУКИ ==========
    function rwbSound(freq, type, dur, vol) {
        if (typeof playArenaSound === 'function') playArenaSound(freq, type, dur, vol);
    }

    // ========== СТАРТ ==========
    function startRogerWhitebeardFight() {
        if (window.rwbActive) return;

        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(1000)) {
            if (typeof showFloatingText === 'function') {
                showFloatingText("⏭️ Босс 1000 волны уже побеждён!", "#ffaa00");
            }
            return;
        }

        console.log("[ROGER-WB] Старт боя v4.0!");

        window.rwbActive = true;
        rwbState = "intro";
        rwbTimer = 0;
        rwbIntroTimer = 0;
        rwbTransitionTimer = 0;
        rwbEndTimer = 0;
        rwbSurvivalTimer2 = 0;
        rwbActiveBoss = null;

        roger = {
            id: "roger",
            x: 80, y: 120, size: 28,
            hp: 500, maxHp: 500,
            superForm: false,
            vx: 1.2, vy: 0.8, pulse: 0, rotation: 0,
            attackTimer: 60, hitFlash: 0,
            name: "РОДЖЕР", color: "#ff8800",
            homeX: 80, homeY: 120,
            combatTimer: 0
        };
        whitebeard = {
            id: "whitebeard",
            x: 320, y: 120, size: 32,
            hp: 500, maxHp: 500,
            superForm: false,
            vx: -1.0, vy: 0.6, pulse: 0, rotation: 0,
            attackTimer: 90, hitFlash: 0,
            name: "БЕЛОУС", color: "#ffffff",
            homeX: 320, homeY: 120,
            combatTimer: 0
        };

        duel = {
            phase: "idle", // idle | approach | clash | retreat | pause
            timer: 0,
            clashX: 200,
            clashY: 200,
            clashes: 0
        };

        rwbPlayer = {
            x: 200, y: 420, size: 12,
            hp: 250, maxHp: 250,
            invulnTimer: 0,
            attackMode: "normal",
            attackTimer: 0,
            shootRate: 12
        };

        rwbAttacks = [];
        rwbPlayerBullets = [];
        rwbParticles = [];
        rwbShockwaves = [];
        rwbFloatingTexts = [];
        rwbSpeedLines = [];
        rwbScreenFlash = 0;
        rwbShake = 0;
        rwbBgStars = [];

        for (let i = 0; i < 80; i++) {
            rwbBgStars.push({
                x: Math.random() * 400,
                y: Math.random() * 500,
                size: 0.5 + Math.random() * 1.5,
                alpha: 0.2 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? "#ff8800" : "#ffffff"
            });
        }

        if (typeof stopAllMusic === 'function') stopAllMusic();

        let overlay = document.getElementById("arenaOverlay");
        if (overlay) overlay.style.display = "flex";
        let bossNameEl = document.getElementById("arenaBossName");
        if (bossNameEl) bossNameEl.innerText = "👑 РОДЖЕР vs БЕЛОУС 👑";
        let arenaHpEl = document.getElementById("arenaHP");
        if (arenaHpEl) arenaHpEl.innerText = rwbPlayer.hp;
        let timerEl = document.getElementById("arenaTimer");
        if (timerEl) timerEl.innerText = "";

        if (typeof initArena === 'function') initArena();
        if (typeof canvas === 'undefined' || !canvas) return;
        if (typeof arenaActive !== 'undefined') arenaActive = false;
        if (typeof livingStoneActive !== 'undefined') livingStoneActive = false;
        if (typeof waystarActive !== 'undefined') waystarActive = false;

        ['superBtn', 'superBtn2', 'superBtnDeactivate', 'startArenaBtn', 'skipBossBtn', 'spareBtn', 'startLivingStoneBtn', 'startWaystarBtn', 'startRogerWB'].forEach(function(id) {
            let el = document.getElementById(id);
            if (el) el.style.display = "none";
        });

        canvas.addEventListener("click", handleRWBClick);
        canvas.addEventListener("touchstart", handleRWBTouchStart, { passive: false });
        canvas.addEventListener("touchmove", handleRWBTouchMove, { passive: false });
        canvas.addEventListener("touchend", handleRWBTouchEnd);
        canvas.addEventListener("touchcancel", handleRWBTouchEnd);
        window.addEventListener("keydown", handleRWBKeyDown);
        window.addEventListener("keyup", handleRWBKeyUp);

        createRWBModeButton();
        showRWBModeButton();

        if (rwbAnimFrame) cancelAnimationFrame(rwbAnimFrame);
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);

        rwbSound(200, 'sine', 1.5, 0.3);
        setTimeout(function() { rwbSound(400, 'sine', 1.0, 0.25); }, 300);
    }

    // ========== КНОПКА ==========
    function createRWBModeButton() {
        if (rwbModeBtn) return;
        rwbModeBtn = document.createElement('button');
        rwbModeBtn.id = 'rwbModeBtn';
        rwbModeBtn.style.cssText = [
            'position: fixed', 'bottom: 8px', 'left: 50%', 'transform: translateX(-50%)',
            'padding: 10px 22px', 'border-radius: 30px',
            'background: linear-gradient(135deg, #ffdd00, #ff8800)',
            'color: #1a1a2e', 'font-weight: 900', 'font-size: 14px',
            'font-family: "Nunito", sans-serif', 'border: 3px solid #fff',
            'box-shadow: 0 4px 15px rgba(255, 136, 0, 0.6)',
            'cursor: pointer', 'z-index: 99999', 'letter-spacing: 0.5px',
            'user-select: none', 'touch-action: manipulation', 'transition: all 0.2s'
        ].join(';');
        rwbModeBtn.innerHTML = '🟡 ОБЫЧНЫЙ (урон по боссам)';
        rwbModeBtn.onclick = function(e) {
            e.preventDefault(); e.stopPropagation();
            rwbPlayer.attackMode = (rwbPlayer.attackMode === "normal") ? "blue" : "normal";
            if (rwbPlayer.attackMode === "blue") {
                rwbModeBtn.innerHTML = '🔵 СИНИЙ (сбивает атаки)';
                rwbModeBtn.style.background = 'linear-gradient(135deg, #00aaff, #0044cc)';
                rwbModeBtn.style.color = '#fff';
                rwbModeBtn.style.boxShadow = '0 4px 15px rgba(0, 170, 255, 0.7)';
            } else {
                rwbModeBtn.innerHTML = '🟡 ОБЫЧНЫЙ (урон по боссам)';
                rwbModeBtn.style.background = 'linear-gradient(135deg, #ffdd00, #ff8800)';
                rwbModeBtn.style.color = '#1a1a2e';
                rwbModeBtn.style.boxShadow = '0 4px 15px rgba(255, 136, 0, 0.6)';
            }
            rwbSound(800, 'square', 0.1, 0.2);
        };
        document.body.appendChild(rwbModeBtn);
    }
    function showRWBModeButton() { if (rwbModeBtn) rwbModeBtn.style.display = 'block'; }
    function hideRWBModeButton() { if (rwbModeBtn) rwbModeBtn.style.display = 'none'; }

    // ========== УПРАВЛЕНИЕ ==========
    function handleRWBKeyDown(ev) { if (!window.rwbActive) return; rwbKeys[ev.key.toLowerCase()] = true; }
    function handleRWBKeyUp(ev) { if (!window.rwbActive) return; rwbKeys[ev.key.toLowerCase()] = false; }
    function handleRWBTouchStart(ev) {
        if (!window.rwbActive) return;
        if (rwbState !== "fight1" && rwbState !== "fight2") return;
        ev.preventDefault();
        if (ev.touches.length > 0) {
            let rect = canvas.getBoundingClientRect();
            rwbTouchActive = true; rwbTouchId = ev.touches[0].identifier;
            rwbTouchX = ev.touches[0].clientX - rect.left;
            rwbTouchY = ev.touches[0].clientY - rect.top;
        }
    }
    function handleRWBTouchMove(ev) {
        if (!window.rwbActive || !rwbTouchActive) return;
        ev.preventDefault();
        let rect = canvas.getBoundingClientRect();
        for (let i = 0; i < ev.touches.length; i++) {
            if (ev.touches[i].identifier === rwbTouchId) {
                rwbTouchX = ev.touches[i].clientX - rect.left;
                rwbTouchY = ev.touches[i].clientY - rect.top;
                break;
            }
        }
    }
    function handleRWBTouchEnd(ev) {
        if (!rwbTouchActive) return;
        let still = false;
        for (let i = 0; i < ev.touches.length; i++) {
            if (ev.touches[i].identifier === rwbTouchId) { still = true; break; }
        }
        if (!still) { rwbTouchActive = false; rwbTouchId = null; }
    }
    function handleRWBClick(ev) {}

    // ========== ИГРОК ==========
    function updateRWBPlayer() {
        if (rwbState !== "fight1" && rwbState !== "fight2") return;

        let mx = 0, my = 0;
        let speed = 4.5;

        if (rwbTouchActive) {
            let tx = rwbTouchX - rwbPlayer.x;
            let ty = rwbTouchY - rwbPlayer.y;
            let dist = Math.sqrt(tx * tx + ty * ty);
            if (dist > 5) { mx = tx / dist; my = ty / dist; }
        } else {
            if (rwbKeys.w || rwbKeys.arrowup) my -= 1;
            if (rwbKeys.s || rwbKeys.arrowdown) my += 1;
            if (rwbKeys.a || rwbKeys.arrowleft) mx -= 1;
            if (rwbKeys.d || rwbKeys.arrowright) mx += 1;
            if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }
        }

        rwbPlayer.x += mx * speed;
        rwbPlayer.y += my * speed;
        rwbPlayer.x = Math.max(16, Math.min(384, rwbPlayer.x));
        rwbPlayer.y = Math.max(160, Math.min(484, rwbPlayer.y));

        if (rwbPlayer.invulnTimer > 0) rwbPlayer.invulnTimer--;

        // Автострельба
        if (rwbPlayer.attackTimer <= 0) {
            rwbPlayer.attackTimer = rwbPlayer.shootRate;
            let bulletColor = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ffdd00";
            rwbPlayerBullets.push({
                x: rwbPlayer.x,
                y: rwbPlayer.y - 14,
                vx: 0,
                vy: -11,
                size: 5,
                life: 90,
                color: bulletColor,
                isBlue: (rwbPlayer.attackMode === "blue"),
                damage: (rwbPlayer.attackMode === "blue") ? 1 : 2
            });
            rwbSound(rwbPlayer.attackMode === "blue" ? 900 : 1200, 'square', 0.03, 0.05);
        }
        if (rwbPlayer.attackTimer > 0) rwbPlayer.attackTimer--;
    }

    // ========== ДУЭЛЬ БОССОВ ==========
    function updateDuel() {
        if (!roger || !whitebeard) return;

        duel.timer++;

        if (duel.phase === "idle") {
            // Стоят на месте, готовятся
            let targetRX = roger.homeX;
            let targetRY = roger.homeY;
            let targetWX = whitebeard.homeX;
            let targetWY = whitebeard.homeY;

            roger.x += (targetRX - roger.x) * 0.04;
            roger.y += (targetRY - roger.y) * 0.04;
            whitebeard.x += (targetWX - whitebeard.x) * 0.04;
            whitebeard.y += (targetWY - whitebeard.y) * 0.04;

            if (duel.timer > 60) {
                duel.phase = "approach";
                duel.timer = 0;
                duel.clashX = 100 + Math.random() * 200;
                duel.clashY = 150 + Math.random() * 150;
                rwbSound(500, 'sawtooth', 0.3, 0.15);
            }
        } else if (duel.phase === "approach") {
            // Сближаются
            let targetRX = duel.clashX - 30;
            let targetRY = duel.clashY;
            let targetWX = duel.clashX + 30;
            let targetWY = duel.clashY;

            roger.x += (targetRX - roger.x) * 0.15;
            roger.y += (targetRY - roger.y) * 0.15;
            whitebeard.x += (targetWX - whitebeard.x) * 0.15;
            whitebeard.y += (targetWY - whitebeard.y) * 0.15;

            // Линии скорости
            if (duel.timer % 3 === 0) {
                rwbSpeedLines.push({
                    x: roger.x + (Math.random() - 0.5) * 20,
                    y: roger.y + (Math.random() - 0.5) * 20,
                    vx: -3, vy: 0,
                    life: 15, maxLife: 15,
                    color: "#ff8800"
                });
                rwbSpeedLines.push({
                    x: whitebeard.x + (Math.random() - 0.5) * 20,
                    y: whitebeard.y + (Math.random() - 0.5) * 20,
                    vx: 3, vy: 0,
                    life: 15, maxLife: 15,
                    color: "#ffffff"
                });
            }

            if (duel.timer > 30) {
                duel.phase = "clash";
                duel.timer = 0;
                performClash();
            }
        } else if (duel.phase === "clash") {
            // Стоят вплотную, идёт столкновение
            roger.rotation += 0.15;
            whitebeard.rotation -= 0.15;

            if (duel.timer % 6 === 0) {
                spawnClashParticles(duel.clashX, duel.clashY);
            }

            if (duel.timer > 25) {
                duel.phase = "retreat";
                duel.timer = 0;
            }
        } else if (duel.phase === "retreat") {
            // Отходят на исходные
            let targetRX = roger.homeX;
            let targetRY = roger.homeY + (Math.random() - 0.5) * 60;
            let targetWX = whitebeard.homeX;
            let targetWY = whitebeard.homeY + (Math.random() - 0.5) * 60;

            roger.x += (targetRX - roger.x) * 0.12;
            roger.y += (targetRY - roger.y) * 0.12;
            whitebeard.x += (targetWX - whitebeard.x) * 0.12;
            whitebeard.y += (targetWY - whitebeard.y) * 0.12;

            if (duel.timer > 40) {
                duel.phase = "pause";
                duel.timer = 0;
            }
        } else if (duel.phase === "pause") {
            // Стоят, атакуют игрока
            roger.rotation *= 0.95;
            whitebeard.rotation *= 0.95;

            // Иногда двигаются по всей карте
            if (duel.timer % 90 === 0) {
                roger.homeX = 60 + Math.random() * 100;
                roger.homeY = 100 + Math.random() * 80;
                whitebeard.homeX = 240 + Math.random() * 100;
                whitebeard.homeY = 100 + Math.random() * 80;
            }

            if (duel.timer > 90) {
                duel.phase = "idle";
                duel.timer = 0;
            }
        }

        roger.pulse += 0.08;
        whitebeard.pulse += 0.07;

        if (roger.hitFlash > 0) roger.hitFlash--;
        if (whitebeard.hitFlash > 0) whitebeard.hitFlash--;

        // Атаки игрока
        roger.attackTimer--;
        if (roger.attackTimer <= 0) {
            roger.attackTimer = 100 + Math.random() * 60;
            spawnRogerAttack();
        }
        whitebeard.attackTimer--;
        if (whitebeard.attackTimer <= 0) {
            whitebeard.attackTimer = 120 + Math.random() * 70;
            spawnWhitebeardAttack();
        }

        // Проверка смерти
        if (roger.hp <= 0) {
            roger.hp = 0;
            triggerSuper(whitebeard, roger);
        } else if (whitebeard.hp <= 0) {
            whitebeard.hp = 0;
            triggerSuper(roger, whitebeard);
        }
    }

    // ========== СТОЛКНОВЕНИЕ (ХАКИ-УДАР) ==========
    function performClash() {
        duel.clashes++;

        // Урон обоим
        let dmg = 12 + Math.random() * 8;
        roger.hp = Math.max(0, roger.hp - dmg);
        whitebeard.hp = Math.max(0, whitebeard.hp - dmg);
        roger.hitFlash = 12;
        whitebeard.hitFlash = 12;

        // Эффекты
        rwbShake = 30;
        rwbScreenFlash = 20;
        rwbScreenFlashColor = "#ffffff";

        // Взрыв
        for (let i = 0; i < 40; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 3 + Math.random() * 8;
            rwbParticles.push({
                x: duel.clashX, y: duel.clashY,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 40, maxLife: 40,
                color: i % 2 === 0 ? "#ff8800" : "#ffffff",
                size: 2 + Math.random() * 4
            });
        }

        // Ударная волна
        rwbShockwaves.push({
            x: duel.clashX, y: duel.clashY,
            radius: 10, maxRadius: 200, speed: 8,
            color: "#ffffff",
            damage: 0, hit: true,
            life: 30, maxLife: 30, width: 6
        });

        rwbSound(300, 'sawtooth', 0.4, 0.35);
        setTimeout(function() { rwbSound(150, 'square', 0.5, 0.3); }, 100);
    }

    function spawnClashParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 4 + Math.random() * 6;
            rwbParticles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 25, maxLife: 25,
                color: ["#ff8800", "#ffffff", "#ffaa00"][Math.floor(Math.random() * 3)],
                size: 2 + Math.random() * 3
            });
        }
    }

    // ========== АТАКИ РОДЖЕРА ==========
    function spawnRogerAttack() {
        let type = Math.floor(Math.random() * 3);
        let isSuper = roger.superForm;
        rwbSound(500, 'sawtooth', 0.25, 0.15);

        if (type === 0) {
            let count = isSuper ? 7 : 5;
            for (let i = 0; i < count; i++) {
                let angle = Math.PI * 0.5 + (i - (count - 1) / 2) * 0.3;
                let speed = isSuper ? 5.5 : 4.5;
                rwbAttacks.push({
                    type: "blade",
                    x: roger.x, y: roger.y + 30,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 12,
                    hp: 2, maxHp: 2,
                    damage: isSuper ? 16 : 12,
                    life: 200,
                    color: "#ff8800",
                    rotation: angle + Math.PI * 0.5, rotSpeed: 0.15
                });
            }
        } else if (type === 1) {
            let dx = rwbPlayer.x - roger.x;
            let dy = rwbPlayer.y - roger.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            let speed = isSuper ? 6 : 5;
            rwbAttacks.push({
                type: "big_blade",
                x: roger.x, y: roger.y + 20,
                vx: (dx / len) * speed, vy: (dy / len) * speed,
                size: 22,
                hp: 3, maxHp: 3,
                damage: isSuper ? 28 : 20,
                life: 200,
                color: "#ff6600",
                rotation: Math.atan2(dy, dx) + Math.PI * 0.5, rotSpeed: 0.2,
                trail: []
            });
        } else {
            let count = isSuper ? 8 : 6;
            for (let i = 0; i < count; i++) {
                let angle = (i / count) * Math.PI * 2;
                let speed = isSuper ? 4.2 : 3.5;
                rwbAttacks.push({
                    type: "blade",
                    x: roger.x, y: roger.y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 10,
                    hp: 2, maxHp: 2,
                    damage: isSuper ? 12 : 10,
                    life: 200,
                    color: "#ffaa00",
                    rotation: angle + Math.PI * 0.5, rotSpeed: 0.1
                });
            }
        }
    }

    // ========== АТАКИ БЕЛОУСА ==========
    function spawnWhitebeardAttack() {
        let type = Math.floor(Math.random() * 3);
        let isSuper = whitebeard.superForm;
        rwbSound(150, 'sine', 0.5, 0.25);

        if (type === 0) {
            let count = isSuper ? 5 : 3;
            for (let i = 0; i < count; i++) {
                let cx = 40 + Math.random() * 320;
                rwbAttacks.push({
                    type: "crack",
                    x: cx, y: -50,
                    vx: 0, vy: isSuper ? 4.5 : 3.5,
                    size: 28,
                    hp: 3, maxHp: 3,
                    damage: isSuper ? 20 : 15,
                    life: 250,
                    color: "#ffffff",
                    rotation: 0, rotSpeed: 0
                });
            }
        } else if (type === 1) {
            rwbShockwaves.push({
                x: whitebeard.x, y: whitebeard.y,
                radius: 10,
                maxRadius: isSuper ? 400 : 320,
                speed: isSuper ? 4.5 : 3.5,
                color: "#ffffaa",
                damage: isSuper ? 22 : 18,
                hit: false,
                hp: 8, maxHp: 8,
                canDestroy: true,
                life: 200, maxLife: 200, width: 15
            });
        } else {
            let dx = rwbPlayer.x - whitebeard.x;
            let dy = rwbPlayer.y - whitebeard.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            let speed = isSuper ? 7 : 6;
            rwbAttacks.push({
                type: "fist",
                x: whitebeard.x, y: whitebeard.y + 20,
                vx: (dx / len) * speed, vy: (dy / len) * speed,
                size: 20,
                hp: 4, maxHp: 4,
                damage: isSuper ? 32 : 25,
                life: 200,
                color: "#ffffff",
                rotation: 0, rotSpeed: 0,
                trail: []
            });
        }
    }

    // ========== СУПЕР-ФОРМА ==========
    function triggerSuper(winner, loser) {
        console.log("[ROGER-WB] СУПЕР:", winner.name);
        rwbState = "transition";
        rwbTransitionTimer = 0;
        winner.superForm = true;
        winner.hp = winner.maxHp;
        winner.size *= 1.4;
        rwbActiveBoss = winner;

        if (loser === roger) roger = null;
        if (loser === whitebeard) whitebeard = null;

        rwbAttacks = [];
        rwbShockwaves = [];

        rwbScreenFlash = 50;
        rwbScreenFlashColor = (winner.id === "roger") ? "#ff8800" : "#ffffff";
        rwbShake = 50;

        for (let i = 0; i < 80; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 4 + Math.random() * 10;
            rwbParticles.push({
                x: 200, y: 250,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 60, maxLife: 60,
                color: (winner.id === "roger") ? "#ff8800" : "#ffffff",
                size: 3 + Math.random() * 4
            });
        }

        rwbSound(300, 'sawtooth', 1.0, 0.4);
        setTimeout(function() { rwbSound(150, 'sawtooth', 1.2, 0.35); }, 200);
    }

    // ========== ОБНОВЛЕНИЕ АТАК ==========
    function updateRWBAttacks() {
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            let a = rwbAttacks[i];
            a.x += a.vx; a.y += a.vy;
            a.rotation += a.rotSpeed || 0;
            a.life--;

            if (a.trail) {
                a.trail.push({ x: a.x, y: a.y, life: 12 });
                if (a.trail.length > 6) a.trail.shift();
            }

            // Попадание по игроку
            if (rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                if (Math.sqrt(dx * dx + dy * dy) < a.size + rwbPlayer.size) {
                    hitPlayer(a.damage);
                    rwbAttacks.splice(i, 1);
                    continue;
                }
            }

            if (a.life <= 0 || a.y > 540 || a.x < -40 || a.x > 440 || a.y < -150) {
                rwbAttacks.splice(i, 1);
            }
        }

        // Shockwaves
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            let sw = rwbShockwaves[i];
            sw.radius += sw.speed;
            sw.life--;

            if (sw.canDestroy && !sw.hit && rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - sw.x, dy = rwbPlayer.y - sw.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (Math.abs(dist - sw.radius) < sw.width) {
                    sw.hit = true;
                    hitPlayer(sw.damage);
                }
            }
            if (sw.life <= 0 || sw.radius > sw.maxRadius) rwbShockwaves.splice(i, 1);
        }
    }

    // ========== ПУЛИ ИГРОКА ==========
    function updateRWBPlayerBullets() {
        for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
            let b = rwbPlayerBullets[i];
            b.x += b.vx; b.y += b.vy; b.life--;

            let destroyed = false;

            // Попадание в атаки
            for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                let a = rwbAttacks[j];
                let dx = b.x - a.x, dy = b.y - a.y;
                if (Math.sqrt(dx * dx + dy * dy) < a.size + b.size + 6) {
                    // Урон по HP атаки (только синие пули)
                    if (b.isBlue) {
                        a.hp -= 1;
                        spawnHitParticles(b.x, b.y, "#00aaff", 4);
                        rwbSound(1200, 'square', 0.06, 0.1);
                        if (a.hp <= 0) {
                            spawnDestroyParticles(a.x, a.y, a.color);
                            rwbSound(600, 'square', 0.15, 0.2);
                            rwbAttacks.splice(j, 1);
                        }
                    } else {
                        // Жёлтая — просто искра
                        spawnHitParticles(b.x, b.y, "#ffdd00", 3);
                    }
                    destroyed = true;
                    break;
                }
            }

            // Попадание в кольцо
            if (!destroyed) {
                for (let j = rwbShockwaves.length - 1; j >= 0; j--) {
                    let sw = rwbShockwaves[j];
                    if (!sw.canDestroy) continue;
                    let dx = b.x - sw.x, dy = b.y - sw.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (Math.abs(dist - sw.radius) < sw.width + b.size) {
                        if (b.isBlue) {
                            sw.hp -= 1;
                            spawnHitParticles(b.x, b.y, "#00aaff", 4);
                            rwbSound(1200, 'square', 0.06, 0.1);
                            if (sw.hp <= 0) {
                                spawnDestroyParticles(b.x, b.y, sw.color);
                                rwbSound(600, 'square', 0.15, 0.2);
                                rwbShockwaves.splice(j, 1);
                            }
                        }
                        destroyed = true;
                        break;
                    }
                }
            }

            if (destroyed) { rwbPlayerBullets.splice(i, 1); continue; }

            // Попадание в боссов (урон)
            if (!destroyed) {
                let targets = [];
                if (rwbState === "fight1") {
                    if (roger) targets.push(roger);
                    if (whitebeard) targets.push(whitebeard);
                } else if (rwbState === "fight2" && rwbActiveBoss) {
                    targets.push(rwbActiveBoss);
                }
                for (let boss of targets) {
                    let dx = b.x - boss.x, dy = b.y - boss.y;
                    if (Math.sqrt(dx * dx + dy * dy) < boss.size + b.size) {
                        boss.hp = Math.max(0, boss.hp - b.damage);
                        boss.hitFlash = 4;
                        spawnHitParticles(b.x, b.y, b.color, 5);
                        rwbSound(1400, 'square', 0.05, 0.08);
                        destroyed = true;
                        break;
                    }
                }
            }

            if (destroyed) { rwbPlayerBullets.splice(i, 1); continue; }

            if (b.life <= 0 || b.y < -20 || b.x < -20 || b.x > 420) {
                rwbPlayerBullets.splice(i, 1);
            }
        }
    }

    // ========== ХЕЛПЕРЫ ==========
    function hitPlayer(dmg) {
        if (rwbPlayer.invulnTimer > 0) return;
        rwbPlayer.hp -= dmg;
        rwbPlayer.invulnTimer = 40;
        rwbShake = 15;
        rwbScreenFlash = 8;
        rwbScreenFlashColor = "#ff0000";
        rwbSound(60, 'sawtooth', 0.5, 0.3);

        let hpEl = document.getElementById("arenaHP");
        if (hpEl) hpEl.innerText = Math.max(0, rwbPlayer.hp);

        for (let p = 0; p < 15; p++) {
            let ang = Math.random() * Math.PI * 2;
            rwbParticles.push({
                x: rwbPlayer.x, y: rwbPlayer.y,
                vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5,
                life: 25, maxLife: 25,
                color: "#ff3333", size: 2 + Math.random() * 3
            });
        }

        if (rwbPlayer.hp <= 0) rwbDefeat();
    }

    function spawnHitParticles(x, y, color, count) {
        if (!count) count = 8;
        for (let i = 0; i < count; i++) {
            let ang = Math.random() * Math.PI * 2;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4,
                life: 20, maxLife: 20,
                color: color, size: 2 + Math.random() * 2
            });
        }
    }

    function spawnDestroyParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 3 + Math.random() * 6;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 2,
                life: 30, maxLife: 30,
                color: i % 2 === 0 ? "#ffffff" : color,
                size: 2 + Math.random() * 4
            });
        }
    }

    // ========== ПОБЕДА / ПОРАЖЕНИЕ ==========
    function rwbVictory() {
        if (rwbState === "victory") return;
        rwbState = "victory";
        rwbEndTimer = 0;
        hideRWBModeButton();

        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
            if (!defeatedBosses.includes(1000)) defeatedBosses.push(1000);
        }
        if (typeof saveAll === 'function') saveAll();
        if (typeof showFloatingText === 'function') showFloatingText("👑 ЛЕГЕНДЫ ПОБЕЖДЕНЫ!", "#ffd700");

        rwbSound(500, 'sine', 1.0, 0.3);
        setTimeout(function() { rwbSound(700, 'sine', 1.0, 0.3); }, 300);
        setTimeout(function() { rwbSound(1000, 'sine', 1.5, 0.4); }, 600);
    }

    function rwbDefeat() {
        if (rwbState === "defeat") return;
        rwbState = "defeat";
        rwbEndTimer = 0;
        hideRWBModeButton();
        rwbSound(40, 'sawtooth', 2.0, 0.4);
        if (typeof showFloatingText === 'function') showFloatingText("💀 ТЫ ПАЛ...", "#ff0000");
    }

    function stopRogerWhitebeardFight() {
        window.rwbActive = false;
        hideRWBModeButton();
        if (rwbAnimFrame) { cancelAnimationFrame(rwbAnimFrame); rwbAnimFrame = null; }
        if (typeof canvas !== 'undefined' && canvas) {
            canvas.removeEventListener("click", handleRWBClick);
            canvas.removeEventListener("touchstart", handleRWBTouchStart);
            canvas.removeEventListener("touchmove", handleRWBTouchMove);
            canvas.removeEventListener("touchend", handleRWBTouchEnd);
            canvas.removeEventListener("touchcancel", handleRWBTouchEnd);
        }
        window.removeEventListener("keydown", handleRWBKeyDown);
        window.removeEventListener("keyup", handleRWBKeyUp);
        let overlay = document.getElementById("arenaOverlay");
        if (overlay) overlay.style.display = "none";
        if (typeof startBattleMusic === 'function') startBattleMusic();
    }

    // ========== РЕНДЕР ==========
    function rwbRenderLoop() {
        if (!window.rwbActive || !ctx || !canvas) return;
        rwbTimer++;

        if (rwbState === "intro") {
            rwbIntroTimer++;
            if (rwbIntroTimer > 150) {
                rwbState = "fight1";
            }
        } else if (rwbState === "fight1") {
            updateRWBPlayer();
            updateDuel();
            updateRWBAttacks();
            updateRWBPlayerBullets();
        } else if (rwbState === "transition") {
            rwbTransitionTimer++;
            if (rwbTransitionTimer > 120) {
                rwbState = "fight2";
                rwbSurvivalTimer2 = 0;
            }
        } else if (rwbState === "fight2") {
            updateRWBPlayer();
            updateSuperBoss();
            updateRWBAttacks();
            updateRWBPlayerBullets();

            rwbSurvivalTimer2++;
            let remaining = Math.max(0, Math.ceil((rwbSurvivalTarget2 - rwbSurvivalTimer2) / 60));
            let timerEl = document.getElementById("arenaTimer");
            if (timerEl) timerEl.innerText = remaining + "с";

            if (rwbSurvivalTimer2 >= rwbSurvivalTarget2) rwbVictory();
        } else if (rwbState === "victory" || rwbState === "defeat") {
            rwbEndTimer++;
            if (rwbEndTimer > 180) {
                let wasVictory = (rwbState === "victory");
                stopRogerWhitebeardFight();
                if (wasVictory) {
                    if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
                    if (typeof victory === 'function') victory();
                } else {
                    if (typeof playerHp !== 'undefined') playerHp = 0;
                    if (typeof defeat === 'function') defeat();
                }
                return;
            }
        }

        // Обновление частиц
        for (let i = rwbParticles.length - 1; i >= 0; i--) {
            let p = rwbParticles[i];
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.95; p.vy *= 0.95;
            p.life--;
            if (p.life <= 0) rwbParticles.splice(i, 1);
        }
        for (let i = rwbSpeedLines.length - 1; i >= 0; i--) {
            let s = rwbSpeedLines[i];
            s.x += s.vx; s.y += s.vy;
            s.life--;
            if (s.life <= 0) rwbSpeedLines.splice(i, 1);
        }

        if (rwbShake > 0.1) rwbShake *= 0.88;
        if (rwbScreenFlash > 0) rwbScreenFlash--;

        // === Рисование ===
        ctx.save();
        if (rwbShake > 0.5) ctx.translate((Math.random() - 0.5) * rwbShake, (Math.random() - 0.5) * rwbShake);

        // Фон
        let bg = ctx.createLinearGradient(0, 0, 0, 500);
        if (rwbState === "fight2") {
            let isRoger = (rwbActiveBoss && rwbActiveBoss.id === "roger");
            bg.addColorStop(0, isRoger ? "#1a0500" : "#050515");
            bg.addColorStop(0.5, isRoger ? "#3a1500" : "#151530");
            bg.addColorStop(1, "#000000");
        } else {
            bg.addColorStop(0, "#0a0a1a");
            bg.addColorStop(0.5, "#1a0a2a");
            bg.addColorStop(1, "#000000");
        }
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 400, 500);

        // Звёзды
        for (let i = 0; i < rwbBgStars.length; i++) {
            let s = rwbBgStars[i];
            s.twinkle += 0.08;
            ctx.globalAlpha = s.alpha * (0.5 + Math.sin(s.twinkle) * 0.5);
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Вспышка
        if (rwbScreenFlash > 0) {
            ctx.globalAlpha = rwbScreenFlash / 30;
            ctx.fillStyle = rwbScreenFlashColor;
            ctx.fillRect(0, 0, 400, 500);
            ctx.globalAlpha = 1;
        }

        // Рамка
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 12;
        ctx.strokeRect(2, 2, 396, 496);
        ctx.shadowBlur = 0;

        // Линии скорости
        for (let i = 0; i < rwbSpeedLines.length; i++) {
            let s = rwbSpeedLines[i];
            ctx.save();
            ctx.globalAlpha = s.life / s.maxLife * 0.7;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 2;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
            ctx.stroke();
            ctx.restore();
        }

        // === БОССЫ ===
        if (rwbState === "fight1" || rwbState === "transition") {
            if (roger) drawRoger();
            if (whitebeard) drawWhitebeard();
        } else if (rwbState === "fight2" && rwbActiveBoss) {
            if (rwbActiveBoss.id === "roger") drawRoger();
            else drawWhitebeard();
        }

        // Shockwaves
        for (let i = 0; i < rwbShockwaves.length; i++) {
            let sw = rwbShockwaves[i];
            let p = sw.life / sw.maxLife;
            ctx.save();
            ctx.globalAlpha = p * 0.9;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.width * p;
            ctx.shadowColor = sw.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            // HP кольца если есть
            if (sw.canDestroy && sw.hp !== undefined) {
                ctx.font = "bold 10px monospace";
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.shadowBlur = 3;
                ctx.fillText(sw.hp + "/" + sw.maxHp, sw.x, sw.y - sw.radius - 5);
            }
            ctx.restore();
        }

        // Атаки
        for (let i = 0; i < rwbAttacks.length; i++) {
            drawAttack(rwbAttacks[i]);
        }

        // Пули игрока
        for (let i = 0; i < rwbPlayerBullets.length; i++) {
            let b = rwbPlayerBullets[i];
            ctx.save();
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 15;
            let grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 1.5);
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.5, b.color);
            grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Игрок
        if (rwbState === "fight1" || rwbState === "fight2") drawRWBPlayer();

        // Частицы
        for (let i = 0; i < rwbParticles.length; i++) {
            let p = rwbParticles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // === HP-БАРЫ ===
        if (rwbState === "fight1" || rwbState === "transition") {
            drawHpBar(6, 4, 190, 14, roger ? roger.hp : 0, 500, "#ff8800", "🔥 РОДЖЕР", false);
            drawHpBar(204, 4, 190, 14, whitebeard ? whitebeard.hp : 0, 500, "#ffffff", "❄️ БЕЛОУС", true);
        } else if (rwbState === "fight2" && rwbActiveBoss) {
            let boss = rwbActiveBoss;
            let barColor = (boss.id === "roger") ? "#ff8800" : "#ffffff";
            let barName = (boss.id === "roger") ? "🔥 РОДЖЕР [СУПЕР]" : "❄️ БЕЛОУС [СУПЕР]";
            drawHpBar(6, 4, 388, 16, boss.hp, boss.maxHp, barColor, barName);
        }

        if (rwbState === "fight1" || rwbState === "fight2") {
            drawHpBar(6, 478, 388, 14, rwbPlayer.hp, rwbPlayer.maxHp, rwbPlayer.hp > 75 ? "#00ff66" : "#ff3333", "❤️ ТЫ");
        }

        // === ТЕКСТ ===
        if (rwbState === "intro") {
            ctx.save();
            ctx.font = "bold 24px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 20;
            ctx.fillText("ЛЕГЕНДЫ ПРОБУДИЛИСЬ", 200, 250);
            ctx.font = "bold 15px monospace";
            ctx.fillStyle = "#ff8800";
            ctx.fillText("🔥 РОДЖЕР vs ❄️ БЕЛОУС", 200, 290);
            ctx.font = "12px monospace";
            ctx.fillStyle = "#aaaaaa";
            ctx.shadowBlur = 0;
            ctx.fillText("Наблюдай их битву и выживай", 200, 330);
            ctx.fillText("🔵 Синяя атака разрушает их удары", 200, 355);
            ctx.restore();
        } else if (rwbState === "transition") {
            ctx.save();
            ctx.font = "bold 28px monospace";
            ctx.textAlign = "center";
            ctx.shadowBlur = 30;
            if (rwbActiveBoss && rwbActiveBoss.id === "roger") {
                ctx.fillStyle = "#ff8800";
                ctx.shadowColor = "#ff8800";
                ctx.fillText("РОДЖЕР: СУПЕР!", 200, 250);
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "#ffffff";
                ctx.fillText("БЕЛОУС: СУПЕР!", 200, 250);
            }
            ctx.font = "15px monospace";
            ctx.fillStyle = "#ffd700";
            ctx.shadowColor = "#ffd700";
            ctx.fillText("ПОСЛЕДНИЙ РАУНД!", 200, 290);
            ctx.restore();
        } else if (rwbState === "victory") {
            ctx.save();
            ctx.font = "bold 32px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffd700";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 30;
            ctx.fillText("ПОБЕДА!", 200, 250);
            ctx.restore();
        } else if (rwbState === "defeat") {
            ctx.save();
            ctx.font = "bold 32px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ff0000";
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 30;
            ctx.fillText("ПОРАЖЕНИЕ", 200, 250);
            ctx.restore();
        }

        ctx.restore();
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);
    }

    // ========== СУПЕР-БОСС (фаза 2) ==========
    function updateSuperBoss() {
        let active = rwbActiveBoss;
        if (!active) return;

        active.pulse += 0.15;
        active.rotation += 0.04;

        // Двигается по всей карте
        active.x = 200 + Math.sin(rwbTimer / 60) * 120;
        active.y = 100 + Math.sin(rwbTimer / 45) * 25;

        if (active.hitFlash > 0) active.hitFlash--;

        active.attackTimer--;
        if (active.attackTimer <= 0) {
            active.attackTimer = 60 + Math.random() * 30;
            if (active.id === "roger") spawnRogerAttack();
            else spawnWhitebeardAttack();
        }
    }

    // ========== ПОЛОСКА HP ==========
    function drawHpBar(x, y, w, h, current, max, color, label, alignRight) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = "#222";
        ctx.fillRect(x, y, w, h);
        let ratio = Math.max(0, Math.min(1, current / max));
        let barW = w * ratio;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        if (alignRight) ctx.fillRect(x + w - barW, y, barW, h);
        else ctx.fillRect(x, y, barW, h);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        ctx.font = "bold 9px monospace";
        ctx.textAlign = alignRight ? "right" : "left";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 3;
        let labelText = label + " " + Math.ceil(current) + "/" + max;
        if (alignRight) ctx.fillText(labelText, x + w - 4, y + h - 3);
        else ctx.fillText(labelText, x + 4, y + h - 3);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ========== СЕРДЕЧКО ==========
    function drawHeartShape(cx, cy, size, color, glowColor) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = color;
        ctx.shadowColor = glowColor || color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.7);
        ctx.bezierCurveTo(-size * 1.4, -size * 0.2, -size * 0.7, -size * 1.1, 0, -size * 0.4);
        ctx.bezierCurveTo(size * 0.7, -size * 1.1, size * 1.4, -size * 0.2, 0, size * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.4, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ========== РОДЖЕР ==========
    function drawRoger() {
        if (!roger) return;
        let pulse = 1 + Math.sin(roger.pulse) * 0.08;
        let size = roger.size * pulse;
        let flash = roger.hitFlash > 0;

        ctx.save();
        ctx.translate(roger.x, roger.y);

        // Супер-аура
        if (roger.superForm) {
            let auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 3.5);
            auraGrad.addColorStop(0, "rgba(255, 136, 0, 0.7)");
            auraGrad.addColorStop(0.5, "rgba(255, 68, 0, 0.3)");
            auraGrad.addColorStop(1, "transparent");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, size * 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Лучи супер-формы
            ctx.save();
            ctx.rotate(roger.rotation);
            ctx.strokeStyle = "rgba(255, 136, 0, 0.6)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                let ang = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * size * 1.5, Math.sin(ang) * size * 1.5);
                ctx.lineTo(Math.cos(ang) * size * 2.5, Math.sin(ang) * size * 2.5);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.rotate(Math.sin(roger.rotation) * 0.1);

        // Оранжевое сердце
        drawHeartShape(0, 0, size, flash ? "#ffffff" : "#ff8800", "#ff8800");

        // Красная шляпа
        ctx.save();
        ctx.translate(0, -size * 0.9);
        ctx.fillStyle = "#cc0000";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-size * 0.9, size * 0.1);
        ctx.lineTo(0, -size * 0.7);
        ctx.lineTo(size * 0.9, size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#990000";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.1, size * 1.1, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, -size * 0.15, size * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(-size * 0.05, -size * 0.17, size * 0.03, 0, Math.PI * 2);
        ctx.arc(size * 0.05, -size * 0.17, size * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
    }

    // ========== БЕЛОУС ==========
    function drawWhitebeard() {
        if (!whitebeard) return;
        let pulse = 1 + Math.sin(whitebeard.pulse) * 0.08;
        let size = whitebeard.size * pulse;
        let flash = whitebeard.hitFlash > 0;

        ctx.save();
        ctx.translate(whitebeard.x, whitebeard.y);

        if (whitebeard.superForm) {
            let auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 3.5);
            auraGrad.addColorStop(0, "rgba(255, 255, 200, 0.7)");
            auraGrad.addColorStop(0.5, "rgba(255, 255, 100, 0.3)");
            auraGrad.addColorStop(1, "transparent");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, size * 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.rotate(whitebeard.rotation);
            ctx.strokeStyle = "rgba(255, 255, 200, 0.6)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                let ang = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * size * 1.5, Math.sin(ang) * size * 1.5);
                ctx.lineTo(Math.cos(ang) * size * 2.5, Math.sin(ang) * size * 2.5);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.rotate(Math.sin(whitebeard.rotation) * 0.1);

        // Белое сердце
        drawHeartShape(0, 0, size, flash ? "#ffffaa" : "#ffffff", "#ffffff");

        // Жёлтые усы
        ctx.save();
        ctx.fillStyle = "#ffdd00";
        ctx.shadowColor = "#ffaa00";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, size * 0.2);
        ctx.quadraticCurveTo(-size * 1.6, size * 0.3, -size * 1.7, -size * 0.3);
        ctx.quadraticCurveTo(-size * 1.5, size * 0.05, -size * 0.5, size * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.5, size * 0.2);
        ctx.quadraticCurveTo(size * 1.6, size * 0.3, size * 1.7, -size * 0.3);
        ctx.quadraticCurveTo(size * 1.5, size * 0.05, size * 0.5, size * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-size * 1.65, -size * 0.25, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 1.65, -size * 0.25, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
    }

    // ========== ИГРОК ==========
    function drawRWBPlayer() {
        if (rwbPlayer.invulnTimer > 0 && Math.floor(rwbPlayer.invulnTimer / 4) % 2 === 0) return;
        let color = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ff2222";
        let glow = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ff0000";
        ctx.save();
        ctx.translate(rwbPlayer.x, rwbPlayer.y);
        let glowGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 25);
        glowGrad.addColorStop(0, glow + "cc");
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        drawHeartShape(rwbPlayer.x, rwbPlayer.y, rwbPlayer.size, color, glow);
    }

    // ========== АТАКИ РЕНДЕР ==========
    function drawAttack(a) {
        if (a.trail && a.trail.length > 0) {
            for (let j = 0; j < a.trail.length; j++) {
                let tr = a.trail[j];
                ctx.globalAlpha = (1 - j / a.trail.length) * 0.5;
                ctx.fillStyle = a.color;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, a.size * 0.6 * (1 - j / a.trail.length), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rotation || 0);

        if (a.type === "blade" || a.type === "big_blade") {
            ctx.fillStyle = a.color;
            ctx.shadowColor = a.color;
            ctx.shadowBlur = 18;
            let s = a.size;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.4, 0);
            ctx.lineTo(0, s);
            ctx.lineTo(-s * 0.4, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.5);
            ctx.lineTo(s * 0.15, 0);
            ctx.lineTo(0, s * 0.5);
            ctx.lineTo(-s * 0.15, 0);
            ctx.closePath();
            ctx.fill();
        } else if (a.type === "fist") {
            ctx.fillStyle = a.color;
            ctx.shadowColor = "#ffffaa";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, a.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#aaaaaa";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(0, 0, a.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(-a.size * 0.3, -a.size * 0.2, a.size * 0.12, 0, Math.PI * 2);
            ctx.arc(a.size * 0.3, -a.size * 0.2, a.size * 0.12, 0, Math.PI * 2);
            ctx.fill();
        } else if (a.type === "crack") {
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(-a.size * 0.2, -a.size);
            ctx.lineTo(a.size * 0.1, -a.size * 0.3);
            ctx.lineTo(-a.size * 0.1, a.size * 0.3);
            ctx.lineTo(a.size * 0.2, a.size);
            ctx.lineWidth = 6;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#aaffff";
            ctx.beginPath();
            ctx.moveTo(-a.size * 0.5, -a.size);
            ctx.lineTo(-a.size * 0.3, a.size);
            ctx.moveTo(a.size * 0.5, -a.size);
            ctx.lineTo(a.size * 0.3, a.size);
            ctx.stroke();
        }
        ctx.restore();

        // HP атаки
        if (a.hp !== undefined && a.hp < a.maxHp && a.hp > 0) {
            ctx.save();
            ctx.translate(a.x, a.y - a.size - 10);
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(-16, -8, 32, 12);
            ctx.fillStyle = a.isBlue ? "#00aaff" : "#ffffff";
            ctx.fillText(a.hp + "/" + a.maxHp, 0, 2);
            ctx.restore();
        }
    }

    // ========== ЭКСПОРТ ==========
    window.startRogerWhitebeardFight = startRogerWhitebeardFight;
    window.stopRogerWhitebeardFight = stopRogerWhitebeardFight;

    console.log("╔════════════════════════════════════════╗");
    console.log("║  🏴‍☠️ ROGER vs WHITEBEARD v4.0            ║");
    console.log("║  У атак своё HP (кольцо 8, кулак 4)     ║");
    console.log("║  Боссы видны в бою, двигаются по карте  ║");
    console.log("║  Игрок бьёт боссов мало (2/1 урона)     ║");
    console.log("╚════════════════════════════════════════╝");

})();
