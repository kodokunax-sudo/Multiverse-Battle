/// ============================================================
// РОДЖЕР vs БЕЛОУС — БОСС 1000 ВОЛНЫ v3.0
// ============================================================
// Фаза 1: два босса дерутся между собой + посылают атаки в игрока
// Когда HP одного падает до 0 — он активирует СУПЕР-форму,
// убивает второго, начинается 1 на 1 выживание.
// Кнопка внизу: жёлтый / синий режим (синий уничтожает атаки)
// ============================================================

(function() {
    'use strict';

    if (window._rogerWhitebeardLoaded) {
        console.warn("[ROGER-WB] Уже загружено, игнорирую повтор.");
        return;
    }
    window._rogerWhitebeardLoaded = true;

    window.rwbActive = false;

    // ========== СОСТОЯНИЕ ==========
    let rwbState = "intro"; // intro | fight1 | transition | fight2 | victory | defeat
    let rwbTimer = 0;
    let rwbIntroTimer = 0;
    let rwbTransitionTimer = 0;
    let rwbEndTimer = 0;
    let rwbSurvivalTimer1 = 0;
    let rwbSurvivalTimer2 = 0;
    let rwbSurvivalTarget1 = 2400; // 40 сек фаза 1 (~3 HP/сек урон)
    let rwbSurvivalTarget2 = 1800; // 30 сек фаза 2
    let rwbActiveBoss = null; // кто в супер-форме

    // Боссы
    let roger = null;
    let whitebeard = null;

    // Игрок
    let rwbPlayer = null;

    // Объекты
    let rwbAttacks = [];
    let rwbPlayerBullets = [];
    let rwbParticles = [];
    let rwbShockwaves = [];
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

    // Кнопка режима
    let rwbModeBtn = null;

    // Таймеры
    let bossFightTimer = 0;

    // ========== ЗВУКИ ==========
    function rwbSound(freq, type, dur, vol) {
        if (typeof playArenaSound === 'function') {
            playArenaSound(freq, type, dur, vol);
        }
    }

    // ========== СТАРТ БОЯ ==========
    function startRogerWhitebeardFight() {
        if (window.rwbActive) return;

        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(1000)) {
            if (typeof showFloatingText === 'function') {
                showFloatingText("⏭️ Босс 1000 волны уже побеждён!", "#ffaa00");
            }
            return;
        }

        console.log("[ROGER-WB] Старт боя v3.0!");

        window.rwbActive = true;
        rwbState = "intro";
        rwbTimer = 0;
        rwbIntroTimer = 0;
        rwbTransitionTimer = 0;
        rwbEndTimer = 0;
        rwbSurvivalTimer1 = 0;
        rwbSurvivalTimer2 = 0;
        rwbActiveBoss = null;
        bossFightTimer = 0;

        roger = {
            x: 100, y: 110, size: 26,
            hp: 100, maxHp: 100,
            superForm: false,
            vx: 0.6, pulse: 0, rotation: 0,
            attackTimer: 0, hitFlash: 0,
            name: "РОДЖЕР", color: "#ff8800"
        };
        whitebeard = {
            x: 300, y: 110, size: 30,
            hp: 100, maxHp: 100,
            superForm: false,
            vx: -0.5, pulse: 0, rotation: 0,
            attackTimer: 0, hitFlash: 0,
            name: "БЕЛОУС", color: "#ffffff"
        };

        rwbPlayer = {
            x: 200, y: 420, size: 12,
            hp: 200, maxHp: 200,
            invulnTimer: 0,
            attackMode: "normal",
            attackTimer: 0,
            shootRate: 12
        };

        rwbAttacks = [];
        rwbPlayerBullets = [];
        rwbParticles = [];
        rwbShockwaves = [];
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

    // ========== КНОПКА РЕЖИМА ==========
    function createRWBModeButton() {
        if (rwbModeBtn) return;

        rwbModeBtn = document.createElement('button');
        rwbModeBtn.id = 'rwbModeBtn';
        rwbModeBtn.style.cssText = [
            'position: fixed',
            'bottom: 8px',
            'left: 50%',
            'transform: translateX(-50%)',
            'padding: 10px 22px',
            'border-radius: 30px',
            'background: linear-gradient(135deg, #ffdd00, #ff8800)',
            'color: #1a1a2e',
            'font-weight: 900',
            'font-size: 14px',
            'font-family: "Nunito", sans-serif',
            'border: 3px solid #fff',
            'box-shadow: 0 4px 15px rgba(255, 136, 0, 0.6)',
            'cursor: pointer',
            'z-index: 99999',
            'letter-spacing: 0.5px',
            'user-select: none',
            'touch-action: manipulation',
            'transition: all 0.2s'
        ].join(';');
        rwbModeBtn.innerHTML = '🟡 ОБЫЧНЫЙ';
        rwbModeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            rwbPlayer.attackMode = (rwbPlayer.attackMode === "normal") ? "blue" : "normal";
            if (rwbPlayer.attackMode === "blue") {
                rwbModeBtn.innerHTML = '🔵 СИНИЙ (сбивает атаки)';
                rwbModeBtn.style.background = 'linear-gradient(135deg, #00aaff, #0044cc)';
                rwbModeBtn.style.color = '#fff';
                rwbModeBtn.style.boxShadow = '0 4px 15px rgba(0, 170, 255, 0.7)';
            } else {
                rwbModeBtn.innerHTML = '🟡 ОБЫЧНЫЙ';
                rwbModeBtn.style.background = 'linear-gradient(135deg, #ffdd00, #ff8800)';
                rwbModeBtn.style.color = '#1a1a2e';
                rwbModeBtn.style.boxShadow = '0 4px 15px rgba(255, 136, 0, 0.6)';
            }
            rwbSound(800, 'square', 0.1, 0.2);
        };

        document.body.appendChild(rwbModeBtn);
    }

    function showRWBModeButton() {
        if (rwbModeBtn) rwbModeBtn.style.display = 'block';
    }

    function hideRWBModeButton() {
        if (rwbModeBtn) rwbModeBtn.style.display = 'none';
    }

    // ========== УПРАВЛЕНИЕ ==========
    function handleRWBKeyDown(ev) {
        if (!window.rwbActive) return;
        rwbKeys[ev.key.toLowerCase()] = true;
    }
    function handleRWBKeyUp(ev) {
        if (!window.rwbActive) return;
        rwbKeys[ev.key.toLowerCase()] = false;
    }
    function handleRWBTouchStart(ev) {
        if (!window.rwbActive) return;
        if (rwbState !== "fight1" && rwbState !== "fight2") return;
        ev.preventDefault();
        if (ev.touches.length > 0) {
            let rect = canvas.getBoundingClientRect();
            rwbTouchActive = true;
            rwbTouchId = ev.touches[0].identifier;
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
        if (!still) {
            rwbTouchActive = false;
            rwbTouchId = null;
        }
    }
    function handleRWBClick(ev) {
        // пусто — стрельба авто
    }

    // ========== ИГРОК ==========
    function updateRWBPlayer() {
        if (rwbState !== "fight1" && rwbState !== "fight2") return;

        let mx = 0, my = 0;
        let speed = 4.5;

        if (rwbTouchActive) {
            let tx = rwbTouchX - rwbPlayer.x;
            let ty = rwbTouchY - rwbPlayer.y;
            let dist = Math.sqrt(tx * tx + ty * ty);
            if (dist > 5) {
                mx = tx / dist;
                my = ty / dist;
            }
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
        rwbPlayer.y = Math.max(120, Math.min(484, rwbPlayer.y));

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
                isBlue: (rwbPlayer.attackMode === "blue")
            });
            rwbSound(rwbPlayer.attackMode === "blue" ? 900 : 1200, 'square', 0.03, 0.05);
        }
        if (rwbPlayer.attackTimer > 0) rwbPlayer.attackTimer--;
    }

    // ========== БОССЫ ==========
    function updateRWBBosses() {
        if (rwbState === "fight1") {
            // Оба живы — дерутся
            roger.x += roger.vx;
            whitebeard.x += whitebeard.vx;
            if (roger.x < 60 || roger.x > 160) roger.vx *= -1;
            if (whitebeard.x < 240 || whitebeard.x > 340) whitebeard.vx *= -1;

            roger.pulse += 0.08;
            whitebeard.pulse += 0.06;
            roger.rotation += 0.02;
            whitebeard.rotation -= 0.015;

            if (roger.hitFlash > 0) roger.hitFlash--;
            if (whitebeard.hitFlash > 0) whitebeard.hitFlash--;

            // Медленная потеря HP (от постоянных столкновений)
            roger.hp -= 0.02;
            whitebeard.hp -= 0.02;

            // Обмен ударами
            bossFightTimer++;
            if (bossFightTimer > 90) {
                bossFightTimer = 0;
                if (Math.random() > 0.5) {
                    whitebeard.hp -= 4 + Math.random() * 3;
                    whitebeard.hitFlash = 8;
                    spawnHitParticles(whitebeard.x, whitebeard.y, "#ff8800", 12);
                    rwbSound(250, 'sawtooth', 0.15, 0.12);
                } else {
                    roger.hp -= 4 + Math.random() * 3;
                    roger.hitFlash = 8;
                    spawnHitParticles(roger.x, roger.y, "#ffffff", 12);
                    rwbSound(250, 'sawtooth', 0.15, 0.12);
                }
            }

            // Атаки в игрока
            roger.attackTimer++;
            if (roger.attackTimer > 90) {
                roger.attackTimer = 0;
                spawnRogerAttack();
            }
            whitebeard.attackTimer++;
            if (whitebeard.attackTimer > 110) {
                whitebeard.attackTimer = 0;
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
        } else if (rwbState === "fight2") {
            // Один супер-босс
            let active = rwbActiveBoss;
            if (!active) return;

            active.pulse += 0.15;
            active.rotation += 0.04;
            active.x = 200 + Math.sin(rwbTimer / 55) * 70;
            active.y = 100 + Math.sin(rwbTimer / 40) * 12;

            if (active.hitFlash > 0) active.hitFlash--;

            // Интенсивные атаки
            active.attackTimer++;
            let rate = (active === roger) ? 55 : 65;
            if (active.attackTimer > rate) {
                active.attackTimer = 0;
                if (active === roger) spawnRogerAttack();
                else spawnWhitebeardAttack();
            }
        }
    }

    // ========== АТАКИ РОДЖЕРА ==========
    function spawnRogerAttack() {
        let type = Math.floor(Math.random() * 3);
        let isSuper = roger.superForm;
        rwbSound(500, 'sawtooth', 0.25, 0.15);

        if (type === 0) {
            // Веер мечей
            let count = isSuper ? 7 : 5;
            for (let i = 0; i < count; i++) {
                let angle = Math.PI * 0.5 + (i - (count - 1) / 2) * 0.3;
                let speed = isSuper ? 5.5 : 4.5;
                rwbAttacks.push({
                    type: "blade",
                    x: roger.x,
                    y: roger.y + 30,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 12,
                    damage: isSuper ? 16 : 12,
                    life: 130,
                    color: "#ff8800",
                    rotation: angle + Math.PI * 0.5,
                    rotSpeed: 0.15
                });
            }
        } else if (type === 1) {
            // Мощный удар в игрока
            let dx = rwbPlayer.x - roger.x;
            let dy = rwbPlayer.y - roger.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            let speed = isSuper ? 6 : 5;
            rwbAttacks.push({
                type: "big_blade",
                x: roger.x,
                y: roger.y + 20,
                vx: (dx / len) * speed,
                vy: (dy / len) * speed,
                size: 22,
                damage: isSuper ? 28 : 20,
                life: 140,
                color: "#ff6600",
                rotation: Math.atan2(dy, dx) + Math.PI * 0.5,
                rotSpeed: 0.2,
                trail: []
            });
        } else {
            // Круговой взмах
            let count = isSuper ? 8 : 6;
            for (let i = 0; i < count; i++) {
                let angle = (i / count) * Math.PI * 2;
                let speed = isSuper ? 4.2 : 3.5;
                rwbAttacks.push({
                    type: "blade",
                    x: roger.x,
                    y: roger.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 10,
                    damage: isSuper ? 12 : 10,
                    life: 120,
                    color: "#ffaa00",
                    rotation: angle + Math.PI * 0.5,
                    rotSpeed: 0.1
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
            // Трещины
            let count = isSuper ? 5 : 3;
            for (let i = 0; i < count; i++) {
                let cx = 40 + Math.random() * 320;
                rwbAttacks.push({
                    type: "crack",
                    x: cx,
                    y: -50,
                    vx: 0,
                    vy: isSuper ? 4.5 : 3.5,
                    size: 28,
                    damage: isSuper ? 20 : 15,
                    life: 250,
                    color: "#ffffff",
                    rotSpeed: 0
                });
            }
        } else if (type === 1) {
            // Землетрясение
            rwbShockwaves.push({
                x: whitebeard.x,
                y: whitebeard.y,
                radius: 10,
                maxRadius: isSuper ? 400 : 320,
                speed: isSuper ? 4.5 : 3.5,
                color: "#ffffaa",
                damage: isSuper ? 22 : 18,
                hit: false,
                life: 100,
                maxLife: 100,
                width: 15
            });
        } else {
            // Кулак
            let dx = rwbPlayer.x - whitebeard.x;
            let dy = rwbPlayer.y - whitebeard.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            let speed = isSuper ? 7 : 6;
            rwbAttacks.push({
                type: "fist",
                x: whitebeard.x,
                y: whitebeard.y + 20,
                vx: (dx / len) * speed,
                vy: (dy / len) * speed,
                size: 20,
                damage: isSuper ? 32 : 25,
                life: 100,
                color: "#ffffff",
                rotation: 0,
                rotSpeed: 0,
                trail: []
            });
        }
    }

    // ========== ПЕРЕХОД В СУПЕР ==========
    function triggerSuper(winner, loser) {
        console.log("[ROGER-WB] Переход в СУПЕР:", winner.name);
        rwbState = "transition";
        rwbTransitionTimer = 0;
        winner.superForm = true;
        winner.hp = winner.maxHp;
        rwbActiveBoss = winner;

        // Убираем проигравшего
        if (loser === roger) roger = null;
        if (loser === whitebeard) whitebeard = null;

        // Очищаем атаки
        rwbAttacks = [];
        rwbShockwaves = [];

        rwbScreenFlash = 50;
        rwbScreenFlashColor = (winner === roger) ? "#ff8800" : "#ffffff";
        rwbShake = 40;

        // Частицы взрыва
        for (let i = 0; i < 60; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 4 + Math.random() * 8;
            rwbParticles.push({
                x: 200, y: 250,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 50, maxLife: 50,
                color: (winner === roger) ? "#ff8800" : "#ffffff",
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
            a.x += a.vx;
            a.y += a.vy;
            a.rotation += a.rotSpeed || 0;
            a.life--;

            if (a.trail) {
                a.trail.push({ x: a.x, y: a.y, life: 12 });
                if (a.trail.length > 6) a.trail.shift();
            }

            if (rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - a.x;
                let dy = rwbPlayer.y - a.y;
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
            if (!sw.hit && rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - sw.x;
                let dy = rwbPlayer.y - sw.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (Math.abs(dist - sw.radius) < sw.width) {
                    sw.hit = true;
                    hitPlayer(sw.damage);
                }
            }
            if (sw.life <= 0 || sw.radius > sw.maxRadius) {
                rwbShockwaves.splice(i, 1);
            }
        }
    }

    // ========== ПУЛИ ИГРОКА (УНИЧТОЖЕНИЕ АТАК) ==========
    function updateRWBPlayerBullets() {
        for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
            let b = rwbPlayerBullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life--;

            // ★ СИНЯЯ ПУЛЯ УНИЧТОЖАЕТ АТАКИ ★
            if (b.isBlue) {
                let destroyed = false;
                for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                    let a = rwbAttacks[j];
                    let dx = b.x - a.x;
                    let dy = b.y - a.y;
                    if (Math.sqrt(dx * dx + dy * dy) < a.size + b.size + 8) {
                        spawnDestroyParticles(a.x, a.y, a.color);
                        rwbSound(1200, 'square', 0.08, 0.15);
                        rwbAttacks.splice(j, 1);
                        destroyed = true;
                        break;
                    }
                }
                if (destroyed) {
                    rwbPlayerBullets.splice(i, 1);
                    continue;
                }
            } else {
                // Жёлтая — просто визуал, попадает в боссов
                if (rwbState === "fight1" && roger) {
                    let dx = b.x - roger.x;
                    let dy = b.y - roger.y;
                    if (Math.sqrt(dx * dx + dy * dy) < roger.size + b.size) {
                        roger.hitFlash = 3;
                        spawnHitParticles(b.x, b.y, "#ffdd00", 5);
                        rwbPlayerBullets.splice(i, 1);
                        continue;
                    }
                }
                if (rwbState === "fight1" && whitebeard) {
                    let dx = b.x - whitebeard.x;
                    let dy = b.y - whitebeard.y;
                    if (Math.sqrt(dx * dx + dy * dy) < whitebeard.size + b.size) {
                        whitebeard.hitFlash = 3;
                        spawnHitParticles(b.x, b.y, "#ffdd00", 5);
                        rwbPlayerBullets.splice(i, 1);
                        continue;
                    }
                }
                if (rwbState === "fight2" && rwbActiveBoss) {
                    let dx = b.x - rwbActiveBoss.x;
                    let dy = b.y - rwbActiveBoss.y;
                    if (Math.sqrt(dx * dx + dy * dy) < rwbActiveBoss.size + b.size) {
                        rwbActiveBoss.hitFlash = 3;
                        spawnHitParticles(b.x, b.y, "#ffdd00", 5);
                        rwbPlayerBullets.splice(i, 1);
                        continue;
                    }
                }
            }

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

        if (rwbPlayer.hp <= 0) {
            rwbDefeat();
        }
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
        for (let i = 0; i < 12; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 3 + Math.random() * 4;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 1,
                life: 25, maxLife: 25,
                color: i % 2 === 0 ? "#00aaff" : color,
                size: 2 + Math.random() * 3
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
        if (typeof showFloatingText === 'function') {
            showFloatingText("👑 ЛЕГЕНДЫ ПОБЕЖДЕНЫ!", "#ffd700");
        }

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
        if (typeof showFloatingText === 'function') {
            showFloatingText("💀 ТЫ ПАЛ...", "#ff0000");
        }
    }

    function stopRogerWhitebeardFight() {
        window.rwbActive = false;
        hideRWBModeButton();

        if (rwbAnimFrame) {
            cancelAnimationFrame(rwbAnimFrame);
            rwbAnimFrame = null;
        }

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

        // Фазы
        if (rwbState === "intro") {
            rwbIntroTimer++;
            if (rwbIntroTimer > 150) {
                rwbState = "fight1";
                rwbSurvivalTimer1 = 0;
            }
        } else if (rwbState === "fight1") {
            updateRWBPlayer();
            updateRWBBosses();
            updateRWBAttacks();
            updateRWBPlayerBullets();

            rwbSurvivalTimer1++;
            // Если бойцы не убили друг друга за 40 сек — ускоренный обмен
            if (rwbSurvivalTimer1 > rwbSurvivalTarget1) {
                if (roger) roger.hp -= 1.5;
                if (whitebeard) whitebeard.hp -= 1.5;
            }
        } else if (rwbState === "transition") {
            rwbTransitionTimer++;
            if (rwbTransitionTimer > 120) {
                rwbState = "fight2";
                rwbSurvivalTimer2 = 0;
            }
        } else if (rwbState === "fight2") {
            updateRWBPlayer();
            updateRWBBosses();
            updateRWBAttacks();
            updateRWBPlayerBullets();

            rwbSurvivalTimer2++;
            let remaining = Math.max(0, Math.ceil((rwbSurvivalTarget2 - rwbSurvivalTimer2) / 60));
            let timerEl = document.getElementById("arenaTimer");
            if (timerEl) timerEl.innerText = remaining + "с";

            if (rwbSurvivalTimer2 >= rwbSurvivalTarget2) {
                rwbVictory();
            }
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

        // Частицы
        for (let i = rwbParticles.length - 1; i >= 0; i--) {
            let p = rwbParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life--;
            if (p.life <= 0) rwbParticles.splice(i, 1);
        }

        if (rwbShake > 0.1) rwbShake *= 0.85;
        if (rwbScreenFlash > 0) rwbScreenFlash--;

        // === Рисование ===
        ctx.save();
        if (rwbShake > 0.5) {
            ctx.translate((Math.random() - 0.5) * rwbShake, (Math.random() - 0.5) * rwbShake);
        }

        // Фон
        let bg = ctx.createLinearGradient(0, 0, 0, 500);
        if (rwbState === "fight2") {
            let isRoger = (rwbActiveBoss === roger);
            bg.addColorStop(0, isRoger ? "#1a0a00" : "#0a0a1a");
            bg.addColorStop(0.5, isRoger ? "#2a1500" : "#1a1530");
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
            ctx.globalAlpha = rwbScreenFlash / 25;
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

        // === БОССЫ ===
        if (rwbState === "fight1" || rwbState === "transition") {
            if (roger) drawRoger();
            if (whitebeard) drawWhitebeard();
        } else if (rwbState === "fight2" && rwbActiveBoss) {
            if (rwbActiveBoss === roger) drawRoger();
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
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
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
        if (rwbState === "fight1" || rwbState === "fight2") {
            drawRWBPlayer();
        }

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

        // === ПОЛОСКИ HP ===
        if (rwbState === "fight1" || rwbState === "transition") {
            // HP Роджера (сверху слева)
            drawHpBar(8, 6, 180, 14, roger ? roger.hp : 0, 100, "#ff8800", "🔥 РОДЖЕР");
            // HP Белоуса (сверху справа)
            drawHpBar(212, 6, 180, 14, whitebeard ? whitebeard.hp : 0, 100, "#ffffff", "❄️ БЕЛОУС", true);
        } else if (rwbState === "fight2" && rwbActiveBoss) {
            let boss = rwbActiveBoss;
            let barColor = (boss === roger) ? "#ff8800" : "#ffffff";
            let barName = (boss === roger) ? "🔥 РОДЖЕР [СУПЕР]" : "❄️ БЕЛОУС [СУПЕР]";
            drawHpBar(8, 6, 384, 16, boss.hp, boss.maxHp, barColor, barName);
        }

        // HP игрока (снизу)
        if (rwbState === "fight1" || rwbState === "fight2") {
            drawHpBar(8, 476, 384, 14, rwbPlayer.hp, rwbPlayer.maxHp, rwbPlayer.hp > 60 ? "#00ff66" : "#ff3333", "❤️ ТЫ");
        }

        // === Тексты ===
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
            ctx.fillText("Выживи под их битвой", 200, 330);
            ctx.fillText("🔵 Синяя атака сбивает их удары", 200, 355);
            ctx.restore();
        } else if (rwbState === "transition") {
            ctx.save();
            ctx.font = "bold 30px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 30;
            if (rwbActiveBoss === roger) {
                ctx.fillStyle = "#ff8800";
                ctx.fillText("РОДЖЕР: СУПЕР!", 200, 250);
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.fillText("БЕЛОУС: СУПЕР!", 200, 250);
            }
            ctx.font = "15px monospace";
            ctx.fillStyle = "#ffd700";
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

        // Индикатор режима
        if (rwbState === "fight1" || rwbState === "fight2") {
            ctx.save();
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            if (rwbPlayer.attackMode === "blue") {
                ctx.fillStyle = "rgba(0, 170, 255, 0.9)";
                ctx.fillText("🔵 СИНИЙ РЕЖИМ", 200, 468);
            } else {
                ctx.fillStyle = "rgba(255, 221, 0, 0.9)";
                ctx.fillText("🟡 ОБЫЧНЫЙ РЕЖИМ", 200, 468);
            }
            ctx.restore();
        }

        ctx.restore();
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);
    }

    // ========== ПОЛОСКА HP ==========
    function drawHpBar(x, y, w, h, current, max, color, label, alignRight) {
        ctx.save();

        // Фон
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

        // Тёмный след
        ctx.fillStyle = "#222";
        ctx.fillRect(x, y, w, h);

        // Заполнение
        let ratio = Math.max(0, Math.min(1, current / max));
        let barW = w * ratio;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        if (alignRight) {
            ctx.fillRect(x + w - barW, y, barW, h);
        } else {
            ctx.fillRect(x, y, barW, h);
        }
        ctx.shadowBlur = 0;

        // Рамка
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        // Текст
        ctx.font = "bold 9px monospace";
        ctx.textAlign = alignRight ? "right" : "left";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 3;
        let labelText = label + " " + Math.ceil(current) + "/" + max;
        if (alignRight) {
            ctx.fillText(labelText, x + w - 4, y + h - 3);
        } else {
            ctx.fillText(labelText, x + 4, y + h - 3);
        }
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
        if (roger.superForm) size *= 1.3;
        let flash = roger.hitFlash > 0;

        ctx.save();
        ctx.translate(roger.x, roger.y);

        // Свечение супер-формы
        if (roger.superForm) {
            let auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 3);
            auraGrad.addColorStop(0, "rgba(255, 136, 0, 0.6)");
            auraGrad.addColorStop(1, "transparent");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Оранжевое сердце
        drawHeartShape(0, 0, size, flash ? "#ffffff" : "#ff8800", "#ff8800");

        // Красная шляпа
        ctx.save();
        ctx.translate(0, -size * 0.9);

        ctx.fillStyle = "#cc0000";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 12;

        // Треуголка
        ctx.beginPath();
        ctx.moveTo(-size * 0.9, size * 0.1);
        ctx.lineTo(0, -size * 0.7);
        ctx.lineTo(size * 0.9, size * 0.1);
        ctx.closePath();
        ctx.fill();

        // Поля
        ctx.fillStyle = "#990000";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.1, size * 1.1, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Череп на шляпе
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
        if (whitebeard.superForm) size *= 1.3;
        let flash = whitebeard.hitFlash > 0;

        ctx.save();
        ctx.translate(whitebeard.x, whitebeard.y);

        // Свечение супер-формы
        if (whitebeard.superForm) {
            let auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 3);
            auraGrad.addColorStop(0, "rgba(255, 255, 200, 0.6)");
            auraGrad.addColorStop(1, "transparent");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Белое сердце
        drawHeartShape(0, 0, size, flash ? "#ffffaa" : "#ffffff", "#ffffff");

        // Жёлтые усы
        ctx.save();
        ctx.fillStyle = "#ffdd00";
        ctx.shadowColor = "#ffaa00";
        ctx.shadowBlur = 10;

        // Левый ус
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, size * 0.2);
        ctx.quadraticCurveTo(-size * 1.6, size * 0.3, -size * 1.7, -size * 0.3);
        ctx.quadraticCurveTo(-size * 1.5, size * 0.05, -size * 0.5, size * 0.35);
        ctx.closePath();
        ctx.fill();

        // Правый ус
        ctx.beginPath();
        ctx.moveTo(size * 0.5, size * 0.2);
        ctx.quadraticCurveTo(size * 1.6, size * 0.3, size * 1.7, -size * 0.3);
        ctx.quadraticCurveTo(size * 1.5, size * 0.05, size * 0.5, size * 0.35);
        ctx.closePath();
        ctx.fill();

        // Кончики
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
    }

    // ========== ЭКСПОРТ ==========
    window.startRogerWhitebeardFight = startRogerWhitebeardFight;
    window.stopRogerWhitebeardFight = stopRogerWhitebeardFight;

    console.log("╔════════════════════════════════════════╗");
    console.log("║  🏴‍☠️ ROGER vs WHITEBEARD v3.0            ║");
    console.log("║  Фаза 1: 2 босса дерутся между собой    ║");
    console.log("║  Фаза 2: супер-форма 1 на 1            ║");
    console.log("║  Синяя атака сбивает атаки боссов      ║");
    console.log("╚════════════════════════════════════════╝");

})();
