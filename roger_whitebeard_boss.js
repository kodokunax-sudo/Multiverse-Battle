// ============================================================
// ГОЛ Д. РОДЖЕР и ЭДВАРД НЬЮГЕЙТ (БЕЛОУС) — БОСС 1000 ВОЛНЫ v2.0
// ============================================================
// Выживание 60 секунд. Роджер — оранжевое сердце + красная шляпа.
// Белоус — белое сердце + жёлтые усы.
// Кнопка внизу меняет режим атаки: жёлтый / синий (ломает блоки)
// ============================================================

(function() {
    'use strict';

    if (window._rogerWhitebeardLoaded) {
        console.warn("[ROGER-WB] Уже загружено, игнорирую повтор.");
        return;
    }
    window._rogerWhitebeardLoaded = true;

    // ========== ГЛОБАЛЬНЫЙ ФЛАГ ==========
    window.rwbActive = false;

    // ========== СОСТОЯНИЕ ==========
    let rwbState = "intro"; // intro | fight | victory | defeat
    let rwbTimer = 0;
    let rwbIntroTimer = 0;
    let rwbEndTimer = 0;
    let rwbSurvivalTimer = 0;
    let rwbSurvivalTarget = 3600; // 60 секунд (60 fps)

    // Боссы
    let roger = { x: 100, y: 110, size: 25, vx: 0.8, rotation: 0, pulse: 0, attackTimer: 0, attackType: 0, hitFlash: 0 };
    let whitebeard = { x: 300, y: 110, size: 25, vx: -0.6, rotation: 0, pulse: 0, attackTimer: 0, attackType: 0, hitFlash: 0 };

    // Игрок
    let rwbPlayer = {
        x: 200, y: 420, size: 12,
        hp: 200, maxHp: 200,
        invulnTimer: 0,
        attackMode: "normal", // normal | blue
        attackTimer: 0
    };

    // Объекты
    let rwbAttacks = [];
    let rwbBlocks = [];
    let rwbPlayerBullets = [];
    let rwbParticles = [];
    let rwbShockwaves = [];
    let rwbFloatingTexts = [];
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
    let rwbBlockSpawnTimer = 0;

    // ========== ЗВУКИ ==========
    function rwbSound(freq, type, dur, vol) {
        if (typeof playArenaSound === 'function') {
            playArenaSound(freq, type, dur, vol);
        }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ БОЯ ==========
    function startRogerWhitebeardFight() {
        if (window.rwbActive) return;

        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(1000)) {
            if (typeof showFloatingText === 'function') {
                showFloatingText("⏭️ Босс 1000 волны уже побеждён!", "#ffaa00");
            }
            return;
        }

        console.log("[ROGER-WB] Старт боя!");

        // Сброс всего
        window.rwbActive = true;
        rwbState = "intro";
        rwbTimer = 0;
        rwbIntroTimer = 0;
        rwbEndTimer = 0;
        rwbSurvivalTimer = 0;
        rwbBlockSpawnTimer = 0;

        roger = { x: 100, y: 110, size: 25, vx: 0.8, rotation: 0, pulse: 0, attackTimer: 0, attackType: 0, hitFlash: 0 };
        whitebeard = { x: 300, y: 110, size: 25, vx: -0.6, rotation: 0, pulse: 0, attackTimer: 0, attackType: 0, hitFlash: 0 };
        rwbPlayer = {
            x: 200, y: 420, size: 12,
            hp: 200, maxHp: 200,
            invulnTimer: 0,
            attackMode: "normal",
            attackTimer: 0
        };

        rwbAttacks = [];
        rwbBlocks = [];
        rwbPlayerBullets = [];
        rwbParticles = [];
        rwbShockwaves = [];
        rwbFloatingTexts = [];
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
        if (bossNameEl) bossNameEl.innerText = "👑 РОДЖЕР и БЕЛОУС 👑";

        let arenaHpEl = document.getElementById("arenaHP");
        if (arenaHpEl) arenaHpEl.innerText = rwbPlayer.hp;

        let timerEl = document.getElementById("arenaTimer");
        if (timerEl) timerEl.innerText = "60с";

        if (typeof initArena === 'function') initArena();
        if (typeof canvas === 'undefined' || !canvas) return;
        if (typeof arenaActive !== 'undefined') arenaActive = false;
        if (typeof livingStoneActive !== 'undefined') livingStoneActive = false;
        if (typeof waystarActive !== 'undefined') waystarActive = false;

        // Скрываем все стандартные кнопки
        ['superBtn', 'superBtn2', 'superBtnDeactivate', 'startArenaBtn', 'skipBossBtn', 'spareBtn', 'startLivingStoneBtn', 'startWaystarBtn', 'startRogerWB'].forEach(function(id) {
            let el = document.getElementById(id);
            if (el) el.style.display = "none";
        });

        // Обработчики
        canvas.addEventListener("click", handleRWBClick);
        canvas.addEventListener("touchstart", handleRWBTouchStart, { passive: false });
        canvas.addEventListener("touchmove", handleRWBTouchMove, { passive: false });
        canvas.addEventListener("touchend", handleRWBTouchEnd);
        canvas.addEventListener("touchcancel", handleRWBTouchEnd);
        window.addEventListener("keydown", handleRWBKeyDown);
        window.addEventListener("keyup", handleRWBKeyUp);

        // Кнопка
        createRWBModeButton();
        showRWBModeButton();

        // Рендер
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
            'bottom: 20px',
            'left: 50%',
            'transform: translateX(-50%)',
            'padding: 14px 32px',
            'border-radius: 40px',
            'background: linear-gradient(135deg, #ffdd00, #ff8800)',
            'color: #1a1a2e',
            'font-weight: 900',
            'font-size: 16px',
            'font-family: "Nunito", sans-serif',
            'border: 4px solid #fff',
            'box-shadow: 0 4px 20px rgba(255, 136, 0, 0.6)',
            'cursor: pointer',
            'z-index: 99999',
            'letter-spacing: 1px',
            'text-shadow: 0 1px 2px rgba(255,255,255,0.4)',
            'user-select: none',
            'touch-action: manipulation',
            'transition: all 0.2s'
        ].join(';');
        rwbModeBtn.innerHTML = '🟡 ОБЫЧНЫЙ РЕЖИМ';
        rwbModeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            rwbPlayer.attackMode = (rwbPlayer.attackMode === "normal") ? "blue" : "normal";
            if (rwbPlayer.attackMode === "blue") {
                rwbModeBtn.innerHTML = '🔵 СИНИЙ РЕЖИМ (ломает блоки)';
                rwbModeBtn.style.background = 'linear-gradient(135deg, #00aaff, #0044cc)';
                rwbModeBtn.style.color = '#fff';
                rwbModeBtn.style.textShadow = '0 1px 2px rgba(0,0,0,0.4)';
                rwbModeBtn.style.boxShadow = '0 4px 20px rgba(0, 170, 255, 0.7)';
            } else {
                rwbModeBtn.innerHTML = '🟡 ОБЫЧНЫЙ РЕЖИМ';
                rwbModeBtn.style.background = 'linear-gradient(135deg, #ffdd00, #ff8800)';
                rwbModeBtn.style.color = '#1a1a2e';
                rwbModeBtn.style.textShadow = '0 1px 2px rgba(255,255,255,0.4)';
                rwbModeBtn.style.boxShadow = '0 4px 20px rgba(255, 136, 0, 0.6)';
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
        if (rwbState !== "fight" && rwbState !== "intro") return;
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
        // Клик по арене — ничего, стрельба авто
    }

    // ========== ЛОГИКА ==========
    function updateRWBPlayer() {
        if (rwbState !== "fight") return;

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
        rwbPlayer.y = Math.max(80, Math.min(484, rwbPlayer.y));

        if (rwbPlayer.invulnTimer > 0) rwbPlayer.invulnTimer--;

        // ★ АВТОСТРЕЛЬБА (всегда, независимо от режима) ★
        if (rwbPlayer.attackTimer <= 0) {
            rwbPlayer.attackTimer = 14;
            let bulletColor = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ffdd00";
            rwbPlayerBullets.push({
                x: rwbPlayer.x,
                y: rwbPlayer.y - 14,
                vx: 0,
                vy: -12,
                size: 5,
                life: 90,
                color: bulletColor,
                isBlue: (rwbPlayer.attackMode === "blue")
            });
            rwbSound(rwbPlayer.attackMode === "blue" ? 900 : 1200, 'square', 0.04, 0.06);
        }
        if (rwbPlayer.attackTimer > 0) rwbPlayer.attackTimer--;
    }

    function updateRWBBosses() {
        if (rwbState !== "fight") return;

        // Движение
        roger.x += roger.vx;
        if (roger.x < 60 || roger.x > 180) roger.vx *= -1;
        roger.rotation += 0.02;
        roger.pulse += 0.08;
        if (roger.hitFlash > 0) roger.hitFlash--;

        whitebeard.x += whitebeard.vx;
        if (whitebeard.x < 220 || whitebeard.x > 340) whitebeard.vx *= -1;
        whitebeard.rotation -= 0.015;
        whitebeard.pulse += 0.06;
        if (whitebeard.hitFlash > 0) whitebeard.hitFlash--;

        // Атаки Роджера — каждые 1.5 сек
        roger.attackTimer++;
        if (roger.attackTimer > 90) {
            roger.attackTimer = 0;
            spawnRogerAttack();
        }

        // Атаки Белоуса — каждые 2.5 сек
        whitebeard.attackTimer++;
        if (whitebeard.attackTimer > 150) {
            whitebeard.attackTimer = 0;
            spawnWhitebeardAttack();
        }

        // Спавн блоков
        rwbBlockSpawnTimer++;
        if (rwbBlockSpawnTimer > 180 && rwbBlocks.length < 6) {
            rwbBlockSpawnTimer = 0;
            spawnRWBBlock();
        }
    }

    // ========== АТАКИ РОДЖЕРА (оранжевые, быстрые) ==========
    function spawnRogerAttack() {
        let type = Math.floor(Math.random() * 3);
        rwbSound(500, 'sawtooth', 0.3, 0.15);

        if (type === 0) {
            // ★ ВЕЕР МЕЧЕЙ — 5 снарядов-ромбов веером вниз ★
            let count = 5;
            for (let i = 0; i < count; i++) {
                let angle = Math.PI * 0.5 + (i - (count - 1) / 2) * 0.35;
                let speed = 4.5;
                rwbAttacks.push({
                    type: "blade",
                    x: roger.x,
                    y: roger.y + 30,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 12,
                    damage: 12,
                    life: 120,
                    color: "#ff8800",
                    rotation: angle + Math.PI * 0.5,
                    rotSpeed: 0.15
                });
            }
        } else if (type === 1) {
            // ★ БОЛЬШОЙ УДАР — один мощный снаряд в игрока ★
            let dx = rwbPlayer.x - roger.x;
            let dy = rwbPlayer.y - roger.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            rwbAttacks.push({
                type: "big_blade",
                x: roger.x,
                y: roger.y + 20,
                vx: (dx / len) * 5,
                vy: (dy / len) * 5,
                size: 22,
                damage: 20,
                life: 140,
                color: "#ff6600",
                rotation: Math.atan2(dy, dx) + Math.PI * 0.5,
                rotSpeed: 0.2,
                trail: []
            });
        } else {
            // ★ КРУГОВОЙ ВЗМАХ — 6 снарядов по кругу ★
            for (let i = 0; i < 6; i++) {
                let angle = (i / 6) * Math.PI * 2;
                rwbAttacks.push({
                    type: "blade",
                    x: roger.x,
                    y: roger.y,
                    vx: Math.cos(angle) * 3.5,
                    vy: Math.sin(angle) * 3.5,
                    size: 10,
                    damage: 10,
                    life: 120,
                    color: "#ffaa00",
                    rotation: angle + Math.PI * 0.5,
                    rotSpeed: 0.1
                });
            }
        }
    }

    // ========== АТАКИ БЕЛОУСА (белые, мощные) ==========
    function spawnWhitebeardAttack() {
        let type = Math.floor(Math.random() * 3);
        rwbSound(150, 'sine', 0.5, 0.25);

        if (type === 0) {
            // ★ ТРЕЩИНЫ — 3 вертикальные полосы ползут вниз ★
            for (let i = 0; i < 3; i++) {
                let cx = 50 + Math.random() * 300;
                rwbAttacks.push({
                    type: "crack",
                    x: cx,
                    y: -50,
                    vx: 0,
                    vy: 3.5,
                    size: 25,
                    damage: 15,
                    life: 250,
                    color: "#ffffff",
                    rotSpeed: 0
                });
            }
        } else if (type === 1) {
            // ★ ЗЕМЛЕТРЯСЕНИЕ — большое кольцо от Белоуса ★
            rwbShockwaves.push({
                x: whitebeard.x,
                y: whitebeard.y,
                radius: 10,
                maxRadius: 320,
                speed: 3.5,
                color: "#ffffaa",
                damage: 18,
                hit: false,
                life: 100,
                maxLife: 100,
                width: 15
            });
        } else {
            // ★ КУЛАК — быстрый мощный снаряд в игрока ★
            let dx = rwbPlayer.x - whitebeard.x;
            let dy = rwbPlayer.y - whitebeard.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            rwbAttacks.push({
                type: "fist",
                x: whitebeard.x,
                y: whitebeard.y + 20,
                vx: (dx / len) * 6,
                vy: (dy / len) * 6,
                size: 20,
                damage: 25,
                life: 100,
                color: "#ffffff",
                rotation: 0,
                rotSpeed: 0,
                trail: []
            });
        }
    }

    function spawnRWBBlock() {
        rwbBlocks.push({
            x: 40 + Math.random() * 320,
            y: -30,
            size: 38,
            hp: 3,
            maxHp: 3,
            vy: 0.8,
            vx: (Math.random() - 0.5) * 0.5,
            color: "#4488ff",
            breakFlash: 0,
            pulse: Math.random() * Math.PI * 2
        });
    }

    function updateRWBAttacks() {
        // === Атаки ===
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

            // Проверка попадания по игроку
            if (rwbPlayer.invulnTimer <= 0 && rwbState === "fight") {
                let dx = rwbPlayer.x - a.x;
                let dy = rwbPlayer.y - a.y;
                if (Math.sqrt(dx * dx + dy * dy) < a.size + rwbPlayer.size) {
                    hitPlayer(a.damage);
                    rwbAttacks.splice(i, 1);
                    continue;
                }
            }

            if (a.life <= 0 || a.y > 520 || a.x < -40 || a.x > 440 || a.y < -150) {
                rwbAttacks.splice(i, 1);
            }
        }

        // === Shockwaves ===
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            let sw = rwbShockwaves[i];
            sw.radius += sw.speed;
            sw.life--;
            if (!sw.hit && rwbPlayer.invulnTimer <= 0 && rwbState === "fight") {
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

        // === Блоки ===
        for (let i = rwbBlocks.length - 1; i >= 0; i--) {
            let b = rwbBlocks[i];
            b.pulse += 0.1;
            b.y += b.vy;
            b.x += b.vx;
            if (b.breakFlash > 0) b.breakFlash--;

            // Столкновение с игроком — урон
            if (rwbPlayer.invulnTimer <= 0 && rwbState === "fight") {
                let dx = rwbPlayer.x - b.x;
                let dy = rwbPlayer.y - b.y;
                if (Math.sqrt(dx * dx + dy * dy) < b.size / 2 + rwbPlayer.size + 3) {
                    hitPlayer(12);
                    spawnBreakParticles(b.x, b.y, b.color);
                    rwbBlocks.splice(i, 1);
                    continue;
                }
            }

            if (b.y > 520) {
                rwbBlocks.splice(i, 1);
            }
        }

        // === Пули игрока ===
        for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
            let b = rwbPlayerBullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life--;

            // Проверка попадания в блоки (только синие пули)
            if (b.isBlue) {
                let hitBlock = false;
                for (let j = rwbBlocks.length - 1; j >= 0; j--) {
                    let bl = rwbBlocks[j];
                    let dx = b.x - bl.x;
                    let dy = b.y - bl.y;
                    if (Math.abs(dx) < bl.size / 2 + b.size && Math.abs(dy) < bl.size / 2 + b.size) {
                        bl.hp--;
                        bl.breakFlash = 6;
                        spawnHitParticles(b.x, b.y, "#00aaff");
                        rwbSound(600, 'square', 0.08, 0.12);
                        if (bl.hp <= 0) {
                            spawnBreakParticles(bl.x, bl.y, "#4488ff");
                            rwbSound(300, 'square', 0.2, 0.2);
                            rwbBlocks.splice(j, 1);
                        }
                        hitBlock = true;
                        break;
                    }
                }
                if (hitBlock) {
                    rwbPlayerBullets.splice(i, 1);
                    continue;
                }
            } else {
                // Жёлтые пули — попадание в боссов (визуал, без урона)
                for (let boss of [roger, whitebeard]) {
                    let dx = b.x - boss.x;
                    let dy = b.y - boss.y;
                    if (Math.sqrt(dx * dx + dy * dy) < boss.size + b.size) {
                        boss.hitFlash = 4;
                        spawnHitParticles(b.x, b.y, "#ffdd00");
                        rwbSound(1400, 'square', 0.05, 0.08);
                        rwbPlayerBullets.splice(i, 1);
                        break;
                    }
                }
                if (!rwbPlayerBullets[i]) continue;
            }

            if (b.life <= 0 || b.y < -20 || b.x < -20 || b.x > 420) {
                rwbPlayerBullets.splice(i, 1);
            }
        }
    }

    function hitPlayer(dmg) {
        if (rwbPlayer.invulnTimer > 0) return;
        rwbPlayer.hp -= dmg;
        rwbPlayer.invulnTimer = 45;
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

    function spawnHitParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            let ang = Math.random() * Math.PI * 2;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4,
                life: 20, maxLife: 20,
                color: color, size: 2 + Math.random() * 2
            });
        }
    }

    function spawnBreakParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 3 + Math.random() * 4;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 2,
                life: 30, maxLife: 30,
                color: color, size: 3 + Math.random() * 3
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

        // === Обновление фаз ===
        if (rwbState === "intro") {
            rwbIntroTimer++;
            if (rwbIntroTimer > 150) {
                rwbState = "fight";
                rwbSurvivalTimer = 0;
            }
        } else if (rwbState === "fight") {
            updateRWBPlayer();
            updateRWBBosses();
            updateRWBAttacks();

            rwbSurvivalTimer++;
            let remaining = Math.max(0, Math.ceil((rwbSurvivalTarget - rwbSurvivalTimer) / 60));
            let timerEl = document.getElementById("arenaTimer");
            if (timerEl) timerEl.innerText = remaining + "с";

            if (rwbSurvivalTimer >= rwbSurvivalTarget) {
                rwbVictory();
            }
        } else if (rwbState === "victory" || rwbState === "defeat") {
            rwbEndTimer++;
            if (rwbEndTimer > 180) {
                let victory = (rwbState === "victory");
                stopRogerWhitebeardFight();
                if (victory) {
                    if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0;
                    if (typeof victory === 'function') victory();
                } else {
                    if (typeof playerHp !== 'undefined') playerHp = 0;
                    if (typeof defeat === 'function') defeat();
                }
                return;
            }
        }

        // === Частицы ===
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
        bg.addColorStop(0, "#0a0a1a");
        bg.addColorStop(0.5, "#1a0a2a");
        bg.addColorStop(1, "#000000");
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
        if (rwbState !== "victory" && rwbState !== "defeat") {
            drawRoger();
            drawWhitebeard();
        }

        // === Блоки ===
        for (let i = 0; i < rwbBlocks.length; i++) {
            drawBlock(rwbBlocks[i]);
        }

        // === Shockwaves ===
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

        // === Атаки ===
        for (let i = 0; i < rwbAttacks.length; i++) {
            drawAttack(rwbAttacks[i]);
        }

        // === Пули игрока ===
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

        // === Игрок ===
        if (rwbState === "fight" || rwbState === "intro") {
            drawRWBPlayer();
        }

        // === Частицы ===
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

        // === Тексты ===
        if (rwbState === "intro") {
            ctx.save();
            ctx.font = "bold 24px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 20;
            ctx.fillText("ЛЕГЕНДЫ ПРОБУДИЛИСЬ", 200, 250);
            ctx.font = "bold 16px monospace";
            ctx.fillStyle = "#ff8800";
            ctx.shadowColor = "#ff8800";
            ctx.fillText("🔥 РОДЖЕР", 100, 290);
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffffff";
            ctx.fillText("❄️ БЕЛОУС", 300, 290);
            ctx.font = "13px monospace";
            ctx.fillStyle = "#aaaaaa";
            ctx.shadowBlur = 0;
            ctx.fillText("Выживи 60 секунд", 200, 330);
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

        // === HP-бар игрока ===
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
            ctx.fillText("❤️ " + Math.max(0, rwbPlayer.hp) + " / " + rwbPlayer.maxHp, 16, 24);

            // Режим атаки
            ctx.textAlign = "right";
            if (rwbPlayer.attackMode === "blue") {
                ctx.fillStyle = "#00aaff";
                ctx.fillText("🔵 СИНИЙ", 388, 24);
            } else {
                ctx.fillStyle = "#ffdd00";
                ctx.fillText("🟡 ОБЫЧНЫЙ", 388, 24);
            }
        }

        ctx.restore();
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);
    }

    // ========== ОТРИСОВКА СЕРДЕЧКА (общая функция) ==========
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
        // Блик
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.4, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ========== РОДЖЕР (оранжевое сердце + красная шляпа) ==========
    function drawRoger() {
        let pulse = 1 + Math.sin(roger.pulse) * 0.08;
        let size = roger.size * pulse;
        let flash = roger.hitFlash > 0;

        ctx.save();
        ctx.translate(roger.x, roger.y);

        // ★ ОРАНЖЕВОЕ СЕРДЕЧКО ★
        drawHeartShape(0, 0, size, flash ? "#ffffff" : "#ff8800", "#ff8800");

        // ★ КРАСНАЯ ШЛЯПА сверху ★
        ctx.save();
        ctx.translate(0, -size * 0.9);
        ctx.fillStyle = "#cc0000";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 12;

        // Треуголка — треугольник
        ctx.beginPath();
        ctx.moveTo(-size * 0.9, size * 0.1);
        ctx.lineTo(0, -size * 0.7);
        ctx.lineTo(size * 0.9, size * 0.1);
        ctx.closePath();
        ctx.fill();

        // Поля шляпы — эллипс
        ctx.fillStyle = "#990000";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.1, size * 1.1, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Белая эмблема на шляпе (череп)
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

    // ========== БЕЛОУС (белое сердце + жёлтые усы) ==========
    function drawWhitebeard() {
        let pulse = 1 + Math.sin(whitebeard.pulse) * 0.08;
        let size = whitebeard.size * pulse;
        let flash = whitebeard.hitFlash > 0;

        ctx.save();
        ctx.translate(whitebeard.x, whitebeard.y);

        // ★ БЕЛОЕ СЕРДЕЧКО ★
        drawHeartShape(0, 0, size, flash ? "#ffffaa" : "#ffffff", "#ffffff");

        // ★ ЖЁЛТЫЕ УСЫ (по бокам) ★
        ctx.save();
        ctx.fillStyle = "#ffdd00";
        ctx.shadowColor = "#ffaa00";
        ctx.shadowBlur = 10;

        // Левый ус — большая закрученная дуга
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, size * 0.2);
        ctx.quadraticCurveTo(-size * 1.6, size * 0.3, -size * 1.7, -size * 0.3);
        ctx.quadraticCurveTo(-size * 1.5, size * 0.05, -size * 0.5, size * 0.35);
        ctx.closePath();
        ctx.fill();

        // Правый ус — зеркальная дуга
        ctx.beginPath();
        ctx.moveTo(size * 0.5, size * 0.2);
        ctx.quadraticCurveTo(size * 1.6, size * 0.3, size * 1.7, -size * 0.3);
        ctx.quadraticCurveTo(size * 1.5, size * 0.05, size * 0.5, size * 0.35);
        ctx.closePath();
        ctx.fill();

        // Кончики усов — толще
        ctx.beginPath();
        ctx.arc(-size * 1.65, -size * 0.25, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 1.65, -size * 0.25, size * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.restore();
    }

    // ========== ИГРОК (красное сердечко) ==========
    function drawRWBPlayer() {
        if (rwbPlayer.invulnTimer > 0 && Math.floor(rwbPlayer.invulnTimer / 4) % 2 === 0) return;

        let color = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ff2222";
        let glow = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ff0000";

        ctx.save();
        ctx.translate(rwbPlayer.x, rwbPlayer.y);

        // Свечение вокруг
        let glowGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 25);
        glowGrad.addColorStop(0, glow + "cc");
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Сердечко
        drawHeartShape(rwbPlayer.x, rwbPlayer.y, rwbPlayer.size, color, glow);
    }

    // ========== БЛОКИ ==========
    function drawBlock(b) {
        ctx.save();
        ctx.translate(b.x, b.y);

        let flash = b.breakFlash > 0;
        let pulse = 1 + Math.sin(b.pulse) * 0.06;
        ctx.scale(pulse, pulse);

        // Обводка свечения
        ctx.fillStyle = flash ? "#ffffff" : "#4488ff";
        ctx.shadowColor = "#00aaff";
        ctx.shadowBlur = flash ? 30 : 15;

        // Квадрат
        let size = b.size / 2;
        ctx.beginPath();
        ctx.moveTo(-size + 4, -size);
        ctx.lineTo(size - 4, -size);
        ctx.lineTo(size, -size + 4);
        ctx.lineTo(size, size - 4);
        ctx.lineTo(size - 4, size);
        ctx.lineTo(-size + 4, size);
        ctx.lineTo(-size, size - 4);
        ctx.lineTo(-size, -size + 4);
        ctx.closePath();
        ctx.fill();

        // Внутренний квадрат
        ctx.fillStyle = "#001a44";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.rect(-size * 0.6, -size * 0.6, size * 1.2, size * 1.2);
        ctx.fill();

        // HP блоков
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.hp + "/" + b.maxHp, 0, 1);

        ctx.restore();
    }

    // ========== АТАКИ ==========
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
            // Оранжевый ромб (клинок)
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
            // Белый кулак (круг)
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
            // Вертикальная трещина
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 20;
            // Волнистая линия
            ctx.beginPath();
            ctx.moveTo(-a.size * 0.2, -a.size);
            ctx.lineTo(a.size * 0.1, -a.size * 0.3);
            ctx.lineTo(-a.size * 0.1, a.size * 0.3);
            ctx.lineTo(a.size * 0.2, a.size);
            ctx.lineWidth = 6;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
            // Дополнительные тонкие линии
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
    console.log("║  🏴‍☠️ ROGER & WHITEBEARD v2.0            ║");
    console.log("║  Босс 1000 волны                       ║");
    console.log("║  Роджер — оранжевое сердце + шляпа     ║");
    console.log("║  Белоус — белое сердце + жёлтые усы    ║");
    console.log("║  Кнопка внизу — переключить режим      ║");
    console.log("╚════════════════════════════════════════╝");

})();
