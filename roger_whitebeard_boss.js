// ============================================================
// ГОЛ Д. РОДЖЕР и ЭДВАРД НЬЮГЕЙТ (БЕЛОУС) — БОСС 1000 ВОЛНЫ v1.0
// ============================================================
// Механика: выживание под атаками двух легенд
// Кнопка СИНИЙ: ломает блоки, но не наносит урон
// ============================================================

(function() {
    'use strict';

    if (window._rogerWhitebeardLoaded) {
        console.warn("[ROGER-WB] Уже загружено, игнорирую повтор.");
        return;
    }
    window._rogerWhitebeardLoaded = true;

    // ========== СОСТОЯНИЕ БОЯ ==========
    let rwbActive = false;
    let rwbState = "intro"; // intro, fight, victory, defeat
    let rwbPhase = 1;
    let rwbTimer = 0;
    let rwbIntroTimer = 0;
    let rwbVictoryTimer = 0;
    let rwbDefeatTimer = 0;

    // Боссы
    let roger = {
        x: 100, y: 120, size: 55,
        vx: 0.8, rotation: 0, pulse: 0,
        hp: 100, // "HP" для визуала — на самом деле не убивается
        active: true,
        attackTimer: 0,
        attackType: 0,
        color: "#ff8800" // оранжевый
    };

    let whitebeard = {
        x: 300, y: 120, size: 65,
        vx: -0.6, rotation: 0, pulse: 0,
        hp: 100,
        active: true,
        attackTimer: 0,
        attackType: 0,
        color: "#ffffff" // белый
    };

    // Игрок
    let rwbPlayer = {
        x: 200, y: 420,
        size: 12,
        hp: 200,
        maxHp: 200,
        invulnTimer: 0,
        attackMode: "normal", // normal | blue
        attackCooldown: 0,
        attackTimer: 0
    };

    // Атаки боссов
    let rwbAttacks = [];
    let rwbBlocks = []; // блоки, которые можно ломать в синем режиме
    let rwbPlayerBullets = [];
    let rwbParticles = [];
    let rwbTexts = [];
    let rwbShockwaves = [];
    let rwbScreenFlash = 0;
    let rwbScreenFlashColor = "#ffffff";
    let rwbShake = 0;
    let rwbAnimFrame = null;
    let rwbBgParticles = [];

    // Управление
    let rwbKeys = {};
    let rwbTouchActive = false;
    let rwbTouchId = null;
    let rwbTouchX = 0;
    let rwbTouchY = 0;

    // UI кнопка
    let rwbButtonCreated = false;

    // Текстуры для шляпы Роджера и оружия Белоуса
    let rogerHatPoints = [];
    let whitebeardWeaponPoints = [];

    // ========== ГЕНЕРАЦИЯ ТЕКСТУР ==========
    function generateRogerHatTexture() {
        rogerHatPoints = [];
        // Шляпа Роджера — пиратская треуголка с Jolly Roger
        // Основная форма
        for (let i = 0; i < 12; i++) {
            rogerHatPoints.push({
                angle: (i / 12) * Math.PI * 2,
                dist: 0.3 + Math.random() * 0.4,
                size: 2 + Math.random() * 3,
                alpha: 0.3 + Math.random() * 0.4
            });
        }
        // Поля шляпы
        for (let i = 0; i < 8; i++) {
            rogerHatPoints.push({
                angle: Math.PI + (i / 8) * Math.PI,
                dist: 0.7 + Math.random() * 0.3,
                size: 3 + Math.random() * 4,
                alpha: 0.2 + Math.random() * 0.3
            });
        }
    }

    function generateWhitebeardWeaponTexture() {
        whitebeardWeaponPoints = [];
        // Оружие Белоуса — нагината (бисэнто) Муракумогири
        // Длинное древко
        for (let i = 0; i < 20; i++) {
            whitebeardWeaponPoints.push({
                type: "shaft",
                t: i / 20,
                width: 3 + Math.random() * 2,
                alpha: 0.4 + Math.random() * 0.4
            });
        }
        // Лезвие
        for (let i = 0; i < 15; i++) {
            whitebeardWeaponPoints.push({
                type: "blade",
                t: i / 15,
                width: 2 + Math.random() * 3,
                alpha: 0.5 + Math.random() * 0.5
            });
        }
    }

    // ========== ЗВУКИ ==========
    function rwbSound(freq, type, dur, vol) {
        if (typeof playArenaSound === 'function') {
            playArenaSound(freq, type, dur, vol);
        }
    }

    // ========== СТАРТ БОЯ ==========
    function startRogerWhitebeardFight() {
        if (rwbActive) return;
        console.log("[ROGER-WB] Старт боя!");

        // Проверяем, не побеждён ли уже
        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(1000)) {
            if (typeof showFloatingText === 'function') {
                showFloatingText("⏭️ Босс 1000 волны уже побеждён!", "#ffaa00");
            }
            return;
        }

        // Инициализация
        rwbActive = true;
        rwbState = "intro";
        rwbPhase = 1;
        rwbTimer = 0;
        rwbIntroTimer = 0;
        rwbVictoryTimer = 0;
        rwbDefeatTimer = 0;

        // Боссы
        roger = { x: 100, y: 120, size: 55, vx: 0.8, rotation: 0, pulse: 0, hp: 100, active: true, attackTimer: 0, attackType: 0, color: "#ff8800" };
        whitebeard = { x: 300, y: 120, size: 65, vx: -0.6, rotation: 0, pulse: 0, hp: 100, active: true, attackTimer: 0, attackType: 0, color: "#ffffff" };

        // Игрок
        rwbPlayer = { x: 200, y: 420, size: 12, hp: 200, maxHp: 200, invulnTimer: 0, attackMode: "normal", attackCooldown: 0, attackTimer: 0 };

        // Очистка
        rwbAttacks = [];
        rwbBlocks = [];
        rwbPlayerBullets = [];
        rwbParticles = [];
        rwbTexts = [];
        rwbShockwaves = [];
        rwbScreenFlash = 0;
        rwbShake = 0;
        rwbBgParticles = [];

        // Генерация текстур
        generateRogerHatTexture();
        generateWhitebeardWeaponTexture();

        // Фоновые частицы
        for (let i = 0; i < 60; i++) {
            rwbBgParticles.push({
                x: Math.random() * 400,
                y: Math.random() * 500,
                size: 1 + Math.random() * 2,
                speed: 0.2 + Math.random() * 0.5,
                alpha: 0.1 + Math.random() * 0.4,
                color: Math.random() > 0.5 ? "#ff8800" : "#ffffff"
            });
        }

        // Останавливаем музыку
        if (typeof stopAllMusic === 'function') stopAllMusic();

        // Показываем оверлей
        let overlay = document.getElementById("arenaOverlay");
        if (overlay) overlay.style.display = "flex";

        let bossNameEl = document.getElementById("arenaBossName");
        if (bossNameEl) bossNameEl.innerText = "👑 РОДЖЕР и БЕЛОУС 👑";

        let arenaHpEl = document.getElementById("arenaHP");
        if (arenaHpEl) arenaHpEl.innerText = rwbPlayer.hp;

        let timerEl = document.getElementById("arenaTimer");
        if (timerEl) timerEl.innerText = "∞";

        // Инициализация canvas
        if (typeof initArena === 'function') initArena();
        if (typeof canvas === 'undefined' || !canvas) return;
        if (typeof arenaActive !== 'undefined') arenaActive = false;
        if (typeof livingStoneActive !== 'undefined') livingStoneActive = false;
        if (typeof waystarActive !== 'undefined') waystarActive = false;

        // Обработчики
        canvas.addEventListener("click", handleRWBClick);
        canvas.addEventListener("touchstart", handleRWBTouchStart, { passive: false });
        canvas.addEventListener("touchmove", handleRWBTouchMove, { passive: false });
        canvas.addEventListener("touchend", handleRWBTouchEnd);
        canvas.addEventListener("touchcancel", handleRWBTouchEnd);
        window.addEventListener("keydown", handleRWBKeyDown);
        window.addEventListener("keyup", handleRWBKeyUp);

        // Создаём кнопку переключения режима
        createRWBButton();

        // Запускаем рендер
        if (rwbAnimFrame) cancelAnimationFrame(rwbAnimFrame);
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);

        // Звук старта
        rwbSound(200, 'sine', 1.5, 0.3);
        setTimeout(() => rwbSound(300, 'sine', 1.0, 0.25), 300);
    }

    // ========== КНОПКА РЕЖИМА АТАКИ ==========
    function createRWBButton() {
        if (rwbButtonCreated) return;

        let btn = document.createElement('button');
        btn.id = 'rwbModeBtn';
        btn.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 30px;
            background: linear-gradient(135deg, #f5af19, #f12711);
            color: white;
            font-weight: 900;
            font-size: 16px;
            border: 3px solid #fff;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            cursor: pointer;
            z-index: 9999;
            font-family: 'Nunito', sans-serif;
            transition: all 0.2s;
            display: none;
        `;
        btn.innerText = '🔵 СИНИЙ РЕЖИМ';
        btn.onclick = function() {
            rwbPlayer.attackMode = rwbPlayer.attackMode === "normal" ? "blue" : "normal";
            if (rwbPlayer.attackMode === "blue") {
                btn.innerText = '🔵 СИНИЙ';
                btn.style.background = 'linear-gradient(135deg, #00aaff, #0044cc)';
            } else {
                btn.innerText = '⚪ ОБЫЧНЫЙ';
                btn.style.background = 'linear-gradient(135deg, #f5af19, #f12711)';
            }
            rwbSound(800, 'square', 0.1, 0.2);
        };

        document.body.appendChild(btn);
        rwbButtonCreated = true;
    }

    function showRWBButton() {
        let btn = document.getElementById('rwbModeBtn');
        if (btn) btn.style.display = 'block';
    }

    function hideRWBButton() {
        let btn = document.getElementById('rwbModeBtn');
        if (btn) btn.style.display = 'none';
    }

    // ========== УПРАВЛЕНИЕ ==========
    function handleRWBKeyDown(ev) {
        if (!rwbActive) return;
        rwbKeys[ev.key.toLowerCase()] = true;
    }

    function handleRWBKeyUp(ev) {
        if (!rwbActive) return;
        rwbKeys[ev.key.toLowerCase()] = false;
    }

    function handleRWBTouchStart(ev) {
        if (!rwbActive) return;
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
        if (!rwbActive || !rwbTouchActive) return;
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
        if (!rwbActive) return;
        if (rwbState !== "fight") return;
        // Клик по арене — выстрел (в обычном режиме)
        if (rwbPlayer.attackMode === "normal") {
            let rect = canvas.getBoundingClientRect();
            let clickX = ev.clientX - rect.left;
            let clickY = ev.clientY - rect.top;
            // Стрельба в направлении клика
            let dx = clickX - rwbPlayer.x;
            let dy = clickY - rwbPlayer.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            rwbPlayerBullets.push({
                x: rwbPlayer.x,
                y: rwbPlayer.y - 10,
                vx: (dx / len) * 10,
                vy: (dy / len) * 10,
                size: 4,
                life: 80,
                color: "#ffdd00",
                damage: 1
            });
            rwbSound(1200, 'square', 0.05, 0.1);
        }
    }

    // ========== ЛОГИКА БОЯ ==========
    function updateRWBPlayer() {
        if (rwbState !== "fight") return;

        let mx = 0, my = 0;
        let speed = 4;

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
        rwbPlayer.y = Math.max(80, Math.min(484, rwbPlayer.y));

        if (rwbPlayer.invulnTimer > 0) rwbPlayer.invulnTimer--;
        if (rwbPlayer.attackCooldown > 0) rwbPlayer.attackCooldown--;

        // Автострельба в обычном режиме
        if (rwbPlayer.attackMode === "normal" && rwbPlayer.attackTimer <= 0) {
            rwbPlayer.attackTimer = 12;
            // Стреляем в ближайшего босса
            let target = roger.active ? roger : whitebeard;
            let dx = target.x - rwbPlayer.x;
            let dy = target.y - rwbPlayer.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            rwbPlayerBullets.push({
                x: rwbPlayer.x,
                y: rwbPlayer.y - 10,
                vx: (dx / len) * 10,
                vy: (dy / len) * 10,
                size: 4,
                life: 80,
                color: "#ffdd00",
                damage: 1
            });
            rwbSound(1200, 'square', 0.03, 0.05);
        }
        if (rwbPlayer.attackTimer > 0) rwbPlayer.attackTimer--;
    }

    function updateRWBBosses() {
        if (rwbState !== "fight") return;

        // Движение Роджера
        roger.x += roger.vx;
        if (roger.x < 60 || roger.x > 180) roger.vx *= -1;
        roger.rotation += 0.02;
        roger.pulse += 0.08;

        // Движение Белоуса
        whitebeard.x += whitebeard.vx;
        if (whitebeard.x < 220 || whitebeard.x > 340) whitebeard.vx *= -1;
        whitebeard.rotation -= 0.015;
        whitebeard.pulse += 0.06;

        // Атаки боссов
        roger.attackTimer++;
        if (roger.attackTimer > 90) {
            roger.attackTimer = 0;
            spawnRogerAttack();
        }

        whitebeard.attackTimer++;
        if (whitebeard.attackTimer > 120) {
            whitebeard.attackTimer = 0;
            spawnWhitebeardAttack();
        }

        // Спавн блоков
        if (rwbTimer % 180 === 0 && rwbBlocks.length < 8) {
            spawnRWBBlock();
        }
    }

    function spawnRogerAttack() {
        // Роджер — атаки мечом (оранжевые)
        let type = Math.floor(Math.random() * 3);

        if (type === 0) {
            // Волна мечей
            for (let i = 0; i < 5; i++) {
                rwbAttacks.push({
                    type: "sword_wave",
                    x: roger.x,
                    y: roger.y + 30,
                    vx: (Math.random() - 0.5) * 3,
                    vy: 4 + Math.random() * 2,
                    size: 20,
                    damage: 15,
                    life: 120,
                    color: "#ff8800",
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: 0.1
                });
            }
            rwbSound(400, 'sawtooth', 0.3, 0.2);
        } else if (type === 1) {
            // Круговая волна
            for (let i = 0; i < 8; i++) {
                let angle = (i / 8) * Math.PI * 2;
                rwbAttacks.push({
                    type: "slash",
                    x: roger.x,
                    y: roger.y,
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3,
                    size: 15,
                    damage: 12,
                    life: 100,
                    color: "#ffaa00",
                    rotation: angle,
                    rotSpeed: 0
                });
            }
            rwbSound(300, 'square', 0.4, 0.2);
        } else {
            // Мощный удар
            rwbAttacks.push({
                type: "big_slash",
                x: roger.x,
                y: roger.y,
                vx: 0,
                vy: 0,
                size: 40,
                damage: 25,
                life: 60,
                color: "#ff6600",
                rotation: 0,
                rotSpeed: 0,
                warning: true,
                warningTimer: 40
            });
            rwbSound(200, 'sawtooth', 0.5, 0.3);
        }
    }

    function spawnWhitebeardAttack() {
        // Белоус — атаки сейсмическими волнами (белые)
        let type = Math.floor(Math.random() * 3);

        if (type === 0) {
            // Ударная волна
            for (let i = 0; i < 6; i++) {
                rwbAttacks.push({
                    type: "quake_wave",
                    x: whitebeard.x + (Math.random() - 0.5) * 100,
                    y: whitebeard.y + 40,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 3 + Math.random() * 2,
                    size: 25,
                    damage: 18,
                    life: 140,
                    color: "#ffffff",
                    rotation: 0,
                    rotSpeed: 0
                });
            }
            rwbSound(150, 'sine', 0.6, 0.3);
        } else if (type === 1) {
            // Круговой удар
            for (let i = 0; i < 10; i++) {
                let angle = (i / 10) * Math.PI * 2;
                rwbAttacks.push({
                    type: "quake_ring",
                    x: whitebeard.x,
                    y: whitebeard.y,
                    vx: Math.cos(angle) * 2.5,
                    vy: Math.sin(angle) * 2.5,
                    size: 20,
                    damage: 15,
                    life: 120,
                    color: "#eeffff",
                    rotation: angle,
                    rotSpeed: 0
                });
            }
            rwbSound(120, 'square', 0.5, 0.25);
        } else {
            // Мощный сейсмический удар
            rwbAttacks.push({
                type: "big_quake",
                x: whitebeard.x,
                y: whitebeard.y + 50,
                vx: 0,
                vy: 0,
                size: 60,
                damage: 30,
                life: 80,
                color: "#ffffff",
                rotation: 0,
                rotSpeed: 0,
                warning: true,
                warningTimer: 50
            });
            rwbSound(100, 'sawtooth', 0.8, 0.4);
        }
    }

    function spawnRWBBlock() {
        // Блоки, которые можно ломать в синем режиме
        rwbBlocks.push({
            x: 40 + Math.random() * 320,
            y: 150 + Math.random() * 250,
            size: 35,
            hp: 3,
            maxHp: 3,
            color: "#4488ff",
            breakTimer: 0,
            pulse: Math.random() * Math.PI * 2
        });
    }

    function updateRWBAttacks() {
        // Обновление атак
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            let a = rwbAttacks[i];

            if (a.warning) {
                a.warningTimer--;
                if (a.warningTimer <= 0) {
                    a.warning = false;
                    // Спавним реальную атаку
                    for (let j = 0; j < 12; j++) {
                        let angle = (j / 12) * Math.PI * 2;
                        rwbAttacks.push({
                            type: a.type.replace("big_", ""),
                            x: a.x,
                            y: a.y,
                            vx: Math.cos(angle) * 4,
                            vy: Math.sin(angle) * 4,
                            size: a.size / 2,
                            damage: a.damage / 2,
                            life: 100,
                            color: a.color,
                            rotation: angle,
                            rotSpeed: 0
                        });
                    }
                    rwbSound(80, 'sawtooth', 0.5, 0.4);
                }
                continue;
            }

            a.x += a.vx;
            a.y += a.vy;
            a.rotation += a.rotSpeed;
            a.life--;

            // Проверка попадания в игрока
            if (rwbPlayer.invulnTimer <= 0) {
                let dx = rwbPlayer.x - a.x;
                let dy = rwbPlayer.y - a.y;
                if (Math.sqrt(dx * dx + dy * dy) < a.size + rwbPlayer.size) {
                    rwbPlayer.hp -= a.damage;
                    rwbPlayer.invulnTimer = 40;
                    rwbShake = 15;
                    rwbScreenFlash = 8;
                    rwbScreenFlashColor = "#ff0000";
                    rwbSound(60, 'sawtooth', 0.5, 0.3);

                    // Частицы
                    for (let p = 0; p < 15; p++) {
                        let ang = Math.random() * Math.PI * 2;
                        rwbParticles.push({
                            x: rwbPlayer.x,
                            y: rwbPlayer.y,
                            vx: Math.cos(ang) * 5,
                            vy: Math.sin(ang) * 5,
                            life: 25,
                            maxLife: 25,
                            color: "#ff3333",
                            size: 2 + Math.random() * 3
                        });
                    }

                    // Проверка смерти
                    if (rwbPlayer.hp <= 0) {
                        rwbDefeat();
                    }
                }
            }

            if (a.life <= 0 || a.y > 520 || a.x < -30 || a.x > 430) {
                rwbAttacks.splice(i, 1);
            }
        }

        // Обновление блоков
        for (let i = rwbBlocks.length - 1; i >= 0; i--) {
            let b = rwbBlocks[i];
            b.pulse += 0.1;
            if (b.breakTimer > 0) {
                b.breakTimer--;
                if (b.breakTimer <= 0) {
                    rwbBlocks.splice(i, 1);
                }
            }
        }

        // Обновление пуль игрока
        for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
            let b = rwbPlayerBullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life--;

            // Проверка попадания в блоки (синий режим)
            if (rwbPlayer.attackMode === "blue") {
                let hitBlock = false;
                for (let j = rwbBlocks.length - 1; j >= 0; j--) {
                    let bl = rwbBlocks[j];
                    if (bl.breakTimer > 0) continue;
                    let dx = b.x - bl.x;
                    let dy = b.y - bl.y;
                    if (Math.sqrt(dx * dx + dy * dy) < bl.size + b.size) {
                        bl.hp--;
                        if (bl.hp <= 0) {
                            bl.breakTimer = 15;
                            // Осколки
                            for (let p = 0; p < 10; p++) {
                                let ang = Math.random() * Math.PI * 2;
                                rwbParticles.push({
                                    x: bl.x,
                                    y: bl.y,
                                    vx: Math.cos(ang) * 4,
                                    vy: Math.sin(ang) * 4,
                                    life: 20,
                                    maxLife: 20,
                                    color: "#4488ff",
                                    size: 2 + Math.random() * 3
                                });
                            }
                            rwbSound(600, 'square', 0.2, 0.2);
                        } else {
                            rwbSound(400, 'square', 0.1, 0.1);
                        }
                        hitBlock = true;
                        break;
                    }
                }
                if (hitBlock) {
                    rwbPlayerBullets.splice(i, 1);
                    continue;
                }
            }

            if (b.life <= 0 || b.y < -20 || b.x < -20 || b.x > 420) {
                rwbPlayerBullets.splice(i, 1);
            }
        }
    }

    // ========== ПОБЕДА / ПОРАЖЕНИЕ ==========
    function rwbVictory() {
        if (rwbState === "victory") return;
        rwbState = "victory";
        rwbVictoryTimer = 0;
        hideRWBButton();

        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
            if (!defeatedBosses.includes(1000)) defeatedBosses.push(1000);
        }

        if (typeof saveAll === 'function') saveAll();
        if (typeof showFloatingText === 'function') {
            showFloatingText("👑 ПОБЕДА НАД ЛЕГЕНДАМИ!", "#ffd700");
        }

        rwbSound(500, 'sine', 1.0, 0.3);
        setTimeout(() => rwbSound(700, 'sine', 1.0, 0.3), 300);
        setTimeout(() => rwbSound(1000, 'sine', 1.5, 0.4), 600);
    }

    function rwbDefeat() {
        if (rwbState === "defeat") return;
        rwbState = "defeat";
        rwbDefeatTimer = 0;
        hideRWBButton();

        rwbSound(40, 'sawtooth', 2.0, 0.4);

        if (typeof showFloatingText === 'function') {
            showFloatingText("💀 ТЫ ПАЛ...", "#ff0000");
        }
    }

    function stopRogerWhitebeardFight() {
        console.log("[ROGER-WB] Остановка боя");
        rwbActive = false;
        hideRWBButton();

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

        // Возвращаем обычную музыку
        if (typeof startBattleMusic === 'function') startBattleMusic();
    }

    // ========== РЕНДЕР ==========
    function rwbRenderLoop() {
        if (!rwbActive || !ctx || !canvas) return;

        rwbTimer++;

        // Обновление
        if (rwbState === "intro") {
            rwbIntroTimer++;
            if (rwbIntroTimer > 180) {
                rwbState = "fight";
                showRWBButton();
            }
        } else if (rwbState === "fight") {
            updateRWBPlayer();
            updateRWBBosses();
            updateRWBAttacks();
        } else if (rwbState === "victory") {
            rwbVictoryTimer++;
            if (rwbVictoryTimer > 180) {
                stopRogerWhitebeardFight();
                if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
                if (typeof victory === 'function') victory();
                return;
            }
        } else if (rwbState === "defeat") {
            rwbDefeatTimer++;
            if (rwbDefeatTimer > 180) {
                stopRogerWhitebeardFight();
                if (typeof playerHp !== 'undefined') playerHp = 0;
                if (typeof defeat === 'function') defeat();
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

        // Тряска
        if (rwbShake > 0.1) rwbShake *= 0.85;
        if (rwbScreenFlash > 0) rwbScreenFlash--;

        // Отрисовка
        ctx.save();
        if (rwbShake > 0.5) {
            ctx.translate((Math.random() - 0.5) * rwbShake, (Math.random() - 0.5) * rwbShake);
        }

        // Фон
        let bg = ctx.createLinearGradient(0, 0, 0, 500);
        bg.addColorStop(0, "#0a0a1a");
        bg.addColorStop(0.5, "#1a0a2a");
        bg.addColorStop(1, "#000000");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 400, 500);

        // Фоновые частицы
        for (let i = 0; i < rwbBgParticles.length; i++) {
            let bp = rwbBgParticles[i];
            bp.y += bp.speed;
            if (bp.y > 500) { bp.y = 0; bp.x = Math.random() * 400; }
            ctx.globalAlpha = bp.alpha;
            ctx.fillStyle = bp.color;
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2);
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
        ctx.strokeRect(2, 2, 396, 496);

        // === БОССЫ ===
        if (rwbState !== "victory" && rwbState !== "defeat") {
            drawRoger();
            drawWhitebeard();
        }

        // === БЛОКИ ===
        for (let i = 0; i < rwbBlocks.length; i++) {
            let b = rwbBlocks[i];
            if (b.breakTimer > 0) {
                let alpha = b.breakTimer / 15;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size * (1 + (1 - alpha) * 0.5), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                continue;
            }
            let pulse = 1 + Math.sin(b.pulse) * 0.1;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.scale(pulse, pulse);
            ctx.fillStyle = b.color;
            ctx.shadowColor = "#4488ff";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.roundRect(-b.size / 2, -b.size / 2, b.size, b.size, 6);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
            // HP блоков
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(b.hp + "/" + b.maxHp, 0, 4);
            ctx.restore();
        }

        // === АТАКИ ===
        for (let i = 0; i < rwbAttacks.length; i++) {
            let a = rwbAttacks[i];
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation || 0);

            if (a.warning) {
                let pulse = 0.3 + Math.abs(Math.sin(a.warningTimer * 0.2)) * 0.4;
                ctx.globalAlpha = pulse;
                ctx.fillStyle = a.color;
                ctx.beginPath();
                ctx.arc(0, 0, a.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, a.size * 1.5, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = a.color;
                ctx.shadowColor = a.color;
                ctx.shadowBlur = 10;
                if (a.type.includes("slash") || a.type.includes("sword")) {
                    // Меч
                    ctx.beginPath();
                    ctx.moveTo(0, -a.size);
                    ctx.lineTo(a.size * 0.3, 0);
                    ctx.lineTo(0, a.size);
                    ctx.lineTo(-a.size * 0.3, 0);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Круглая волна
                    ctx.beginPath();
                    ctx.arc(0, 0, a.size, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = "#ffffff";
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(0, 0, a.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // === ПУЛИ ИГРОКА ===
        for (let i = 0; i < rwbPlayerBullets.length; i++) {
            let b = rwbPlayerBullets[i];
            ctx.save();
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // === ИГРОК ===
        if (rwbState === "fight" || rwbState === "intro") {
            drawRWBPlayer();
        }

        // === ЧАСТИЦЫ ===
        for (let i = 0; i < rwbParticles.length; i++) {
            let p = rwbParticles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // === ТЕКСТЫ ===
        if (rwbState === "intro") {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 24px monospace";
            ctx.textAlign = "center";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 20;
            ctx.fillText("ЛЕГЕНДЫ ПРОБУДИЛИСЬ", 200, 250);
            ctx.font = "16px monospace";
            ctx.fillStyle = "#ff8800";
            ctx.fillText("ГОЛ Д. РОДЖЕР", 120, 290);
            ctx.fillStyle = "#ffffff";
            ctx.fillText("ЭДВАРД НЬЮГЕЙТ", 280, 290);
        } else if (rwbState === "victory") {
            ctx.fillStyle = "#ffd700";
            ctx.font = "bold 28px monospace";
            ctx.textAlign = "center";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 30;
            ctx.fillText("ПОБЕДА!", 200, 250);
        } else if (rwbState === "defeat") {
            ctx.fillStyle = "#ff0000";
            ctx.font = "bold 28px monospace";
            ctx.textAlign = "center";
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 30;
            ctx.fillText("ПОРАЖЕНИЕ", 200, 250);
        }

        // === HP БАР ===
        if (rwbState === "fight" || rwbState === "intro") {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(8, 6, 384, 22);
            let hpRatio = Math.max(0, rwbPlayer.hp / rwbPlayer.maxHp);
            let barColor = hpRatio > 0.3 ? "#00ff66" : "#ff3333";
            ctx.fillStyle = barColor;
            ctx.fillRect(14, 14, 372 * hpRatio, 6);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "left";
            ctx.fillText("❤️ " + rwbPlayer.hp + " / " + rwbPlayer.maxHp, 16, 24);
        }

        ctx.restore();
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);
    }

    // ========== ОТРИСОВКА ПЕРСОНАЖЕЙ ==========
    function drawRoger() {
        ctx.save();
        ctx.translate(roger.x, roger.y);
        let pulse = 1 + Math.sin(roger.pulse) * 0.1;
        ctx.scale(pulse, pulse);
        ctx.rotate(Math.sin(roger.rotation) * 0.1);

        // Свечение
        let glow = ctx.createRadialGradient(0, 0, 5, 0, 0, roger.size * 2.5);
        glow.addColorStop(0, "rgba(255, 136, 0, 0.8)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, roger.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Шляпа Роджера (оранжевая)
        ctx.fillStyle = "#ff8800";
        ctx.shadowColor = "#ff8800";
        ctx.shadowBlur = 20;

        // Основа шляпы (треуголка)
        ctx.beginPath();
        ctx.moveTo(-roger.size * 0.8, -roger.size * 0.3);
        ctx.quadraticCurveTo(0, -roger.size * 1.2, roger.size * 0.8, -roger.size * 0.3);
        ctx.quadraticCurveTo(roger.size * 0.9, roger.size * 0.3, 0, roger.size * 0.5);
        ctx.quadraticCurveTo(-roger.size * 0.9, roger.size * 0.3, -roger.size * 0.8, -roger.size * 0.3);
        ctx.closePath();
        ctx.fill();

        // Поля шляпы
        ctx.fillStyle = "#cc6600";
        ctx.beginPath();
        ctx.ellipse(0, roger.size * 0.2, roger.size * 1.0, roger.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jolly Roger (череп с крестом)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, -roger.size * 0.2, roger.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Глаза
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(-roger.size * 0.05, -roger.size * 0.22, roger.size * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(roger.size * 0.05, -roger.size * 0.22, roger.size * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // Кости
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-roger.size * 0.2, -roger.size * 0.1);
        ctx.lineTo(roger.size * 0.2, roger.size * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(roger.size * 0.2, -roger.size * 0.1);
        ctx.lineTo(-roger.size * 0.2, roger.size * 0.1);
        ctx.stroke();

        ctx.restore();
    }

    function drawWhitebeard() {
        ctx.save();
        ctx.translate(whitebeard.x, whitebeard.y);
        let pulse = 1 + Math.sin(whitebeard.pulse) * 0.1;
        ctx.scale(pulse, pulse);
        ctx.rotate(Math.sin(whitebeard.rotation) * 0.08);

        // Свечение
        let glow = ctx.createRadialGradient(0, 0, 5, 0, 0, whitebeard.size * 2.5);
        glow.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, whitebeard.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Оружие Белоуса (нагината) — белое
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 25;

        // Древко (наклонное)
        ctx.save();
        ctx.rotate(0.4);
        ctx.fillRect(-whitebeard.size * 0.05, -whitebeard.size * 1.2, whitebeard.size * 0.1, whitebeard.size * 2.4);

        // Лезвие
        ctx.beginPath();
        ctx.moveTo(0, -whitebeard.size * 1.2);
        ctx.lineTo(whitebeard.size * 0.5, -whitebeard.size * 1.6);
        ctx.lineTo(whitebeard.size * 0.2, -whitebeard.size * 0.8);
        ctx.lineTo(0, -whitebeard.size * 0.6);
        ctx.closePath();
        ctx.fill();

        // Обмотка на древке
        ctx.fillStyle = "#cccccc";
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(-whitebeard.size * 0.08, -whitebeard.size * 0.8 + i * whitebeard.size * 0.4, whitebeard.size * 0.16, whitebeard.size * 0.1);
        }
        ctx.restore();

        // Усы Белоуса (белые)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-whitebeard.size * 0.4, whitebeard.size * 0.1);
        ctx.quadraticCurveTo(-whitebeard.size * 0.8, whitebeard.size * 0.5, -whitebeard.size * 0.3, whitebeard.size * 0.6);
        ctx.quadraticCurveTo(-whitebeard.size * 0.5, whitebeard.size * 0.3, -whitebeard.size * 0.4, whitebeard.size * 0.1);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(whitebeard.size * 0.4, whitebeard.size * 0.1);
        ctx.quadraticCurveTo(whitebeard.size * 0.8, whitebeard.size * 0.5, whitebeard.size * 0.3, whitebeard.size * 0.6);
        ctx.quadraticCurveTo(whitebeard.size * 0.5, whitebeard.size * 0.3, whitebeard.size * 0.4, whitebeard.size * 0.1);
        ctx.fill();

        ctx.restore();
    }

    function drawRWBPlayer() {
        // Мерцание при неуязвимости
        if (rwbPlayer.invulnTimer > 0 && Math.floor(rwbPlayer.invulnTimer / 4) % 2 === 0) return;

        ctx.save();
        ctx.translate(rwbPlayer.x, rwbPlayer.y);

        // Свечение
        let glowColor = rwbPlayer.attackMode === "blue" ? "#00aaff" : "#ff3333";
        let glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 25);
        glow.addColorStop(0, glowColor + "cc");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();

        // Сердечко
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        let hs = rwbPlayer.size;
        ctx.beginPath();
        ctx.moveTo(0, hs * 0.7);
        ctx.bezierCurveTo(-hs * 1.4, -hs * 0.2, -hs * 0.7, -hs * 1.1, 0, -hs * 0.4);
        ctx.bezierCurveTo(hs * 0.7, -hs * 1.1, hs * 1.4, -hs * 0.2, 0, hs * 0.7);
        ctx.closePath();
        ctx.fill();

        // Блик
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-hs * 0.3, -hs * 0.4, hs * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ========== ЭКСПОРТ ==========
    window.startRogerWhitebeardFight = startRogerWhitebeardFight;
    window.stopRogerWhitebeardFight = stopRogerWhitebeardFight;

    console.log("[ROGER-WB] v1.0 загружено! Босс 1000 волны готов.");

})();
