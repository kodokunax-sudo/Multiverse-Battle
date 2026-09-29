// ============================================================
// РОДЖЕР vs БЕЛОУС — БОСС 1000 ВОЛНЫ v6.0
// ============================================================
// ★ НОВОЕ v6.0:
// - ОРУЖИЕ работает (firePlayerWeapon)
// - БРОНЯ работает (applyArmorToBossDamage)
// - 2-я фаза: 3 УНИКАЛЬНЫЕ атаки на КАЖДОГО босса
//   • РОДЖЕР: Рассечение, Крест, Адское пламя
//   • БЕЛОУС: Землетрясение, Гура-Гура, Титан-Кулак
// ============================================================

(function() {
    'use strict';

    if (window._rogerWhitebeardLoaded) {
        console.warn("[ROGER-WB] Уже загружено.");
        return;
    }
    window._rogerWhitebeardLoaded = true;

    window.rwbActive = false;

    let rwbState = "intro";
    let rwbTimer = 0;
    let rwbIntroTimer = 0;
    let rwbTransitionTimer = 0;
    let rwbEndTimer = 0;
    let rwbSurvivalTimer2 = 0;
    let rwbSurvivalTarget2 = 1800;
    let rwbActiveBoss = null;

    let roger = null;
    let whitebeard = null;
    let duel = null;
    let rwbPlayer = null;

    let rwbAttacks = [];
    let rwbPlayerBullets = [];
    let rwbParticles = [];
    let rwbShockwaves = [];
    let rwbFloatingTexts = [];
    let rwbSpeedLines = [];
    let rwbHakiLightnings = [];
    let rwbHakiAura = 0;
    let rwbScreenFlash = 0;
    let rwbScreenFlashColor = "#ffffff";
    let rwbShake = 0;
    let rwbAnimFrame = null;
    let rwbBgStars = [];

    let rwbWhiteCracks = [];

    let rwbKeys = {};
    let rwbTouchActive = false;
    let rwbTouchId = null;
    let rwbTouchX = 0;
    let rwbTouchY = 0;

    let rwbModeBtn = null;

    // ★ МУЗЫКА ★
    let rwbMusic = null;
    const RWB_MUSIC_PATH = "music/Dark_Souls_-_Ornstein_Smough_66400273.mp3";

    function startRWBMusic() {
        if (typeof stopAllMusic === 'function') stopAllMusic();
        if (!rwbMusic) {
            try {
                rwbMusic = new Audio(RWB_MUSIC_PATH);
                rwbMusic.loop = true;
                rwbMusic.volume = 0.5;
                rwbMusic.onerror = function() {
                    console.warn("[ROGER-WB] Музыка не загружена:", RWB_MUSIC_PATH);
                    rwbMusic = null;
                };
            } catch(e) { rwbMusic = null; }
        }
        if (rwbMusic) {
            try {
                rwbMusic.currentTime = 0;
                rwbMusic.play().catch(function() {});
            } catch(e) {}
        }
    }

    function stopRWBMusic() {
        if (rwbMusic) {
            try { rwbMusic.pause(); rwbMusic.currentTime = 0; } catch(e) {}
        }
    }

    function rwbSound(freq, type, dur, vol) {
        if (typeof playArenaSound === 'function') playArenaSound(freq, type, dur, vol);
    }

    // ========== ХАКИ МОЛНИИ ==========
    function spawnHakiLightning(x, y, count, isWhite) {
        if (!count) count = 1;
        for (let i = 0; i < count; i++) {
            let ang = Math.random() * Math.PI * 2;
            let len = 25 + Math.random() * 50;
            let lightning = {
                x1: x, y1: y,
                x2: x + Math.cos(ang) * len,
                y2: y + Math.sin(ang) * len,
                points: [],
                life: 14, maxLife: 14,
                outerColor: "#000000",
                innerColor: isWhite ? "#ffffff" : "#ff2222",
                width: 2 + Math.random() * 2
            };
            let steps = 4;
            for (let s = 1; s < steps; s++) {
                let t = s / steps;
                lightning.points.push({
                    x: x + Math.cos(ang) * len * t + (Math.random() - 0.5) * 20,
                    y: y + Math.sin(ang) * len * t + (Math.random() - 0.5) * 20
                });
            }
            rwbHakiLightnings.push(lightning);
        }
    }

    // ========== БЕЛЫЕ ТРЕЩИНЫ ==========
    function spawnWhiteCracks(bossX, bossY, count) {
        if (!count) count = 3;
        for (let i = 0; i < count; i++) {
            let side = i % 2 === 0 ? -1 : 1;
            let startX = bossX + side * (30 + Math.random() * 20);
            let startY = bossY + (Math.random() - 0.5) * 60;
            
            let crack = {
                x: startX, y: startY,
                angle: (side === -1 ? Math.PI : 0) + (Math.random() - 0.5) * 0.6,
                length: 40 + Math.random() * 60,
                width: 2 + Math.random() * 2,
                life: 40, maxLife: 40,
                branches: []
            };
            
            let bCount = 2 + Math.floor(Math.random() * 3);
            for (let b = 0; b < bCount; b++) {
                crack.branches.push({
                    offsetT: 0.3 + Math.random() * 0.6,
                    angle: crack.angle + (Math.random() - 0.5) * 1.5,
                    length: 15 + Math.random() * 30
                });
            }
            
            rwbWhiteCracks.push(crack);
        }
    }

    function drawWhiteCracks() {
        if (!ctx) return;
        for (let i = rwbWhiteCracks.length - 1; i >= 0; i--) {
            let crack = rwbWhiteCracks[i];
            crack.life--;
            if (crack.life <= 0) {
                rwbWhiteCracks.splice(i, 1);
                continue;
            }
            
            let alpha = crack.life / crack.maxLife;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = crack.width;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(crack.x, crack.y);
            
            let segments = 6;
            let cx = crack.x, cy = crack.y;
            let ang = crack.angle;
            let segLen = crack.length / segments;
            
            for (let s = 0; s < segments; s++) {
                ang += (Math.random() - 0.5) * 0.5;
                cx += Math.cos(ang) * segLen;
                cy += Math.sin(ang) * segLen;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
            
            let bx = crack.x, by = crack.y;
            ang = crack.angle;
            for (let s = 0; s < segments; s++) {
                ang += (Math.random() - 0.5) * 0.5;
                bx += Math.cos(ang) * segLen;
                by += Math.sin(ang) * segLen;
                
                if (s % 2 === 1) {
                    for (let br of crack.branches) {
                        let branchStartX = bx;
                        let branchStartY = by;
                        let branchAng = br.angle + (Math.random() - 0.5) * 0.3;
                        let branchEndX = branchStartX + Math.cos(branchAng) * br.length;
                        let branchEndY = branchStartY + Math.sin(branchAng) * br.length;
                        
                        ctx.lineWidth = crack.width * 0.6;
                        ctx.beginPath();
                        ctx.moveTo(branchStartX, branchStartY);
                        ctx.lineTo(branchEndX, branchEndY);
                        ctx.stroke();
                    }
                }
            }
            
            if (crack.life > crack.maxLife * 0.8) {
                let flashAlpha = (crack.life - crack.maxLife * 0.8) / (crack.maxLife * 0.2);
                ctx.globalAlpha = flashAlpha * alpha;
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(crack.x, crack.y, 10 * flashAlpha, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // ========== СТАРТ ==========
    function startRogerWhitebeardFight() {
        if (window.rwbActive) return;

        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(1000)) {
            if (typeof showFloatingText === 'function') showFloatingText("⏭️ Босс 1000 волны уже побеждён!", "#ffaa00");
            return;
        }

        console.log("[ROGER-WB] Старт боя v6.0!");

        window.rwbActive = true;
        rwbState = "intro";
        rwbTimer = 0;
        rwbIntroTimer = 0;
        rwbTransitionTimer = 0;
        rwbEndTimer = 0;
        rwbSurvivalTimer2 = 0;
        rwbActiveBoss = null;
        rwbHakiAura = 0;

        roger = {
            id: "roger", x: 80, y: 120, size: 28,
            hp: 500, maxHp: 500,
            superForm: false,
            vx: 1.2, vy: 0.8, pulse: 0, rotation: 0,
            attackTimer: 50, hitFlash: 0,
            name: "РОДЖЕР", color: "#ff8800",
            homeX: 80, homeY: 120
        };
        whitebeard = {
            id: "whitebeard", x: 320, y: 120, size: 32,
            hp: 500, maxHp: 500,
            superForm: false,
            vx: -1.0, vy: 0.6, pulse: 0, rotation: 0,
            attackTimer: 75, hitFlash: 0,
            name: "БЕЛОУС", color: "#ffffff",
            homeX: 320, homeY: 120
        };

        duel = { phase: "idle", timer: 0, clashX: 200, clashY: 200, clashes: 0 };

        rwbPlayer = {
            x: 200, y: 420, size: 12,
            hp: 250, maxHp: 250,
            invulnTimer: 0, attackMode: "normal",
            attackTimer: 0, shootRate: 10
        };

        rwbAttacks = [];
        rwbPlayerBullets = [];
        rwbParticles = [];
        rwbShockwaves = [];
        rwbFloatingTexts = [];
        rwbSpeedLines = [];
        rwbHakiLightnings = [];
        rwbWhiteCracks = [];
        rwbScreenFlash = 0;
        rwbShake = 0;
        rwbBgStars = [];

        for (let i = 0; i < 100; i++) {
            rwbBgStars.push({
                x: Math.random() * 400, y: Math.random() * 500,
                size: 0.5 + Math.random() * 1.5,
                alpha: 0.2 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? "#ff8800" : "#ffffff"
            });
        }

        startRWBMusic();

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

    // ============================================================
    // ★★★ ИГРОК — ТЕПЕРЬ С ОРУЖИЕМ ★★★
    // ============================================================
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

        if (rwbPlayer.attackTimer <= 0) {
            // ★ ПРОБУЕМ ИСПОЛЬЗОВАТЬ ОРУЖИЕ ★
            let weaponUsed = false;
            if (typeof window.firePlayerWeapon === 'function') {
                try {
                    let result = window.firePlayerWeapon(rwbPlayer.x, rwbPlayer.y, "normal", rwbPlayer.hp, rwbPlayer.maxHp);
                    if (result && result.bullets) {
                        rwbPlayer.attackTimer = result.rate || rwbPlayer.shootRate;
                        for (let i = 0; i < result.bullets.length; i++) {
                            let b = result.bullets[i];
                            // Учёт бронзовых бонусов через applyArmorToBossDamage будет при попадании
                            // Применяем базовую логику: если синий режим — превращаем в синие
                            if (rwbPlayer.attackMode === "blue") {
                                b.isBlue = true;
                                b.color = "#00aaff";
                                b.damage = 1;
                            } else {
                                b.isBlue = false;
                            }
                            rwbPlayerBullets.push(b);
                        }
                        weaponUsed = true;
                        rwbSound(rwbPlayer.attackMode === "blue" ? 900 : 1100, 'square', 0.03, 0.05);
                    }
                } catch(e) { console.warn("[ROGER-WB] weapon error:", e); }
            }
            
            // ★ ЕСЛИ ОРУЖИЕ НЕ ИСПОЛЬЗОВАНО — БАЗОВЫЙ ВЫСТРЕЛ ★
            if (!weaponUsed) {
                rwbPlayer.attackTimer = rwbPlayer.shootRate;
                let bulletColor = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ffdd00";
                rwbPlayerBullets.push({
                    x: rwbPlayer.x, y: rwbPlayer.y - 14,
                    vx: 0, vy: -11, size: 5, life: 90,
                    color: bulletColor,
                    isBlue: (rwbPlayer.attackMode === "blue"),
                    damage: (rwbPlayer.attackMode === "blue") ? 1 : 2
                });
                rwbSound(rwbPlayer.attackMode === "blue" ? 900 : 1200, 'square', 0.03, 0.05);
            }
        }
        if (rwbPlayer.attackTimer > 0) rwbPlayer.attackTimer--;
    }

    // ========== ДУЭЛЬ ==========
    function updateDuel() {
        if (!roger || !whitebeard) return;
        duel.timer++;

        if (duel.phase === "idle") {
            roger.x += (roger.homeX - roger.x) * 0.04;
            roger.y += (roger.homeY - roger.y) * 0.04;
            whitebeard.x += (whitebeard.homeX - whitebeard.x) * 0.04;
            whitebeard.y += (whitebeard.homeY - whitebeard.y) * 0.04;
            if (duel.timer > 40) {
                duel.phase = "approach";
                duel.timer = 0;
                duel.clashX = 100 + Math.random() * 200;
                duel.clashY = 150 + Math.random() * 150;
                rwbSound(500, 'sawtooth', 0.3, 0.15);
            }
        } else if (duel.phase === "approach") {
            let targetRX = duel.clashX - 30;
            let targetRY = duel.clashY;
            let targetWX = duel.clashX + 30;
            let targetWY = duel.clashY;
            roger.x += (targetRX - roger.x) * 0.15;
            roger.y += (targetRY - roger.y) * 0.15;
            whitebeard.x += (targetWX - whitebeard.x) * 0.15;
            whitebeard.y += (targetWY - whitebeard.y) * 0.15;
            if (duel.timer % 2 === 0) {
                rwbSpeedLines.push({
                    x: roger.x + (Math.random() - 0.5) * 20,
                    y: roger.y + (Math.random() - 0.5) * 20,
                    vx: -3, vy: 0, life: 15, maxLife: 15, color: "#ff8800"
                });
                rwbSpeedLines.push({
                    x: whitebeard.x + (Math.random() - 0.5) * 20,
                    y: whitebeard.y + (Math.random() - 0.5) * 20,
                    vx: 3, vy: 0, life: 15, maxLife: 15, color: "#ffffff"
                });
            }
            if (duel.timer > 25) { duel.phase = "clash"; duel.timer = 0; performClash(); }
        } else if (duel.phase === "clash") {
            roger.rotation += 0.15;
            whitebeard.rotation -= 0.15;
            if (duel.timer % 3 === 0) spawnClashParticles(duel.clashX, duel.clashY);
            if (duel.timer > 20) { duel.phase = "retreat"; duel.timer = 0; }
        } else if (duel.phase === "retreat") {
            let targetRX = roger.homeX;
            let targetRY = roger.homeY + (Math.random() - 0.5) * 60;
            let targetWX = whitebeard.homeX;
            let targetWY = whitebeard.homeY + (Math.random() - 0.5) * 60;
            roger.x += (targetRX - roger.x) * 0.12;
            roger.y += (targetRY - roger.y) * 0.12;
            whitebeard.x += (targetWX - whitebeard.x) * 0.12;
            whitebeard.y += (targetWY - whitebeard.y) * 0.12;
            if (duel.timer > 30) { duel.phase = "pause"; duel.timer = 0; }
        } else if (duel.phase === "pause") {
            roger.rotation *= 0.95;
            whitebeard.rotation *= 0.95;
            if (duel.timer % 60 === 0) {
                roger.homeX = 60 + Math.random() * 100;
                roger.homeY = 100 + Math.random() * 80;
                whitebeard.homeX = 240 + Math.random() * 100;
                whitebeard.homeY = 100 + Math.random() * 80;
            }
            if (duel.timer > 70) { duel.phase = "idle"; duel.timer = 0; }
        }

        roger.pulse += 0.08;
        whitebeard.pulse += 0.07;
        if (roger.hitFlash > 0) roger.hitFlash--;
        if (whitebeard.hitFlash > 0) whitebeard.hitFlash--;

        if (Math.random() < 0.15) {
            spawnHakiLightning(roger.x + (Math.random() - 0.5) * 40, roger.y + (Math.random() - 0.5) * 40, 1, false);
        }
        if (Math.random() < 0.15) {
            spawnHakiLightning(whitebeard.x + (Math.random() - 0.5) * 40, whitebeard.y + (Math.random() - 0.5) * 40, 1, false);
        }

        roger.attackTimer--;
        if (roger.attackTimer <= 0) {
            roger.attackTimer = 60 + Math.random() * 30;
            spawnRogerAttack();
        }
        whitebeard.attackTimer--;
        if (whitebeard.attackTimer <= 0) {
            whitebeard.attackTimer = 70 + Math.random() * 40;
            spawnWhitebeardAttack();
        }

        if (roger.hp <= 0) { roger.hp = 0; triggerSuper(whitebeard, roger); }
        else if (whitebeard.hp <= 0) { whitebeard.hp = 0; triggerSuper(roger, whitebeard); }
    }

    function performClash() {
        duel.clashes++;
        let dmg = 12 + Math.random() * 8;
        roger.hp = Math.max(0, roger.hp - dmg);
        whitebeard.hp = Math.max(0, whitebeard.hp - dmg);
        roger.hitFlash = 12;
        whitebeard.hitFlash = 12;

        rwbShake = 40;
        rwbScreenFlash = 30;
        rwbScreenFlashColor = "#000000";
        rwbHakiAura = 30;

        for (let i = 0; i < 50; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 3 + Math.random() * 10;
            rwbParticles.push({
                x: duel.clashX, y: duel.clashY,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 45, maxLife: 45,
                color: i % 3 === 0 ? "#000000" : (i % 3 === 1 ? "#ff2222" : "#ffffff"),
                size: 2 + Math.random() * 5
            });
        }

        for (let i = 0; i < 25; i++) {
            spawnHakiLightning(duel.clashX, duel.clashY, 1, Math.random() > 0.7);
        }

        rwbShockwaves.push({
            x: duel.clashX, y: duel.clashY,
            radius: 10, maxRadius: 250, speed: 10,
            color: "#000000", damage: 0, hit: true,
            life: 35, maxLife: 35, width: 10
        });
        rwbShockwaves.push({
            x: duel.clashX, y: duel.clashY,
            radius: 5, maxRadius: 180, speed: 7,
            color: "#ff2222", damage: 0, hit: true,
            life: 30, maxLife: 30, width: 6
        });

        rwbSound(300, 'sawtooth', 0.4, 0.35);
        setTimeout(function() { rwbSound(150, 'square', 0.5, 0.3); }, 100);
    }

    function spawnClashParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 4 + Math.random() * 8;
            rwbParticles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 25, maxLife: 25,
                color: ["#000000", "#ff2222", "#ff8800", "#ffdd00"][Math.floor(Math.random() * 4)],
                size: 2 + Math.random() * 4
            });
        }
    }

    // ============================================================
    // ★★★ АТАКИ РОДЖЕРА (фаза 1) ★★★
    // ============================================================
    function spawnRogerAttack() {
        let type = Math.floor(Math.random() * 4);
        let isSuper = roger.superForm;
        rwbSound(500, 'sawtooth', 0.25, 0.15);
        spawnHakiLightning(roger.x, roger.y, 6, false);

        if (type === 0) {
            let count = isSuper ? 9 : 7;
            for (let i = 0; i < count; i++) {
                let angle = Math.PI * 0.5 + (i - (count - 1) / 2) * 0.25;
                let speed = isSuper ? 5.5 : 4.5;
                rwbAttacks.push({
                    type: "blade", x: roger.x, y: roger.y + 30,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 12, hp: 2, maxHp: 2,
                    damage: isSuper ? 16 : 12,
                    life: 200, color: "#ff8800",
                    rotation: angle + Math.PI * 0.5, rotSpeed: 0.15,
                    hasHaki: true
                });
            }
        } else if (type === 1) {
            let offsets = [-0.15, 0.15];
            for (let off of offsets) {
                let dx = rwbPlayer.x - roger.x;
                let dy = rwbPlayer.y - roger.y;
                let baseAng = Math.atan2(dy, dx);
                let ang = baseAng + off;
                let speed = isSuper ? 6 : 5;
                rwbAttacks.push({
                    type: "big_blade", x: roger.x, y: roger.y + 20,
                    vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
                    size: 20, hp: 3, maxHp: 3,
                    damage: isSuper ? 28 : 20,
                    life: 200, color: "#ff6600",
                    rotation: ang + Math.PI * 0.5, rotSpeed: 0.2,
                    trail: [], hasHaki: true
                });
            }
        } else if (type === 2) {
            let count = isSuper ? 10 : 8;
            for (let i = 0; i < count; i++) {
                let angle = (i / count) * Math.PI * 2;
                let speed = isSuper ? 4.5 : 3.8;
                rwbAttacks.push({
                    type: "blade", x: roger.x, y: roger.y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 10, hp: 2, maxHp: 2,
                    damage: isSuper ? 12 : 10,
                    life: 200, color: "#ffaa00",
                    rotation: angle + Math.PI * 0.5, rotSpeed: 0.1,
                    hasHaki: true
                });
            }
        } else {
            let count = isSuper ? 12 : 9;
            for (let i = 0; i < count; i++) {
                let baseAng = (i / count) * Math.PI * 3;
                let delay = i * 3;
                (function(a, d, sup) {
                    setTimeout(function() {
                        if (!window.rwbActive || (rwbState !== "fight1" && rwbState !== "fight2")) return;
                        rwbAttacks.push({
                            type: "blade", x: roger.x, y: roger.y,
                            vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
                            size: 11, hp: 2, maxHp: 2,
                            damage: sup ? 14 : 10,
                            life: 200, color: "#ffcc00",
                            rotation: a + Math.PI * 0.5, rotSpeed: 0.3,
                            hasHaki: true
                        });
                    }, d);
                })(baseAng, delay, isSuper);
            }
        }
    }

    // ============================================================
    // ★★★ АТАКИ БЕЛОУСА (фаза 1) ★★★
    // ============================================================
    function spawnWhitebeardAttack() {
        let type = Math.floor(Math.random() * 4);
        let isSuper = whitebeard.superForm;
        rwbSound(150, 'sine', 0.5, 0.25);
        spawnHakiLightning(whitebeard.x, whitebeard.y, 6, false);

        if (type === 0) {
            // КАМНЕПАД: 6 камней
            let count = 6;
            for (let i = 0; i < count; i++) {
                let cx = 40 + Math.random() * 320;
                rwbAttacks.push({
                    type: "rock",
                    x: cx, y: -50 - Math.random() * 40,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: isSuper ? 4.5 : 3.5,
                    size: 18 + Math.random() * 8,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.08,
                    hp: 3, maxHp: 3,
                    damage: isSuper ? 20 : 15,
                    life: 400, color: "#8B7355",
                    hasHaki: false,
                    textureSeed: Math.random() * 1000
                });
            }
            spawnWhiteCracks(whitebeard.x, whitebeard.y, 6);
            rwbSound(120, 'sawtooth', 0.6, 0.3);
            setTimeout(function() { rwbSound(90, 'sawtooth', 0.5, 0.25); }, 150);
        } else if (type === 1) {
            rwbShockwaves.push({
                x: whitebeard.x, y: whitebeard.y,
                radius: 10,
                maxRadius: isSuper ? 266 : 213,
                speed: isSuper ? 5.5 : 4.5,
                color: "#ffffaa",
                damage: isSuper ? 22 : 18,
                hit: false, hp: 8, maxHp: 8,
                canDestroy: true,
                life: 180, maxLife: 180, width: 18
            });
            setTimeout(function() {
                if (!window.rwbActive || (rwbState !== "fight1" && rwbState !== "fight2")) return;
                if (!whitebeard) return;
                rwbShockwaves.push({
                    x: whitebeard.x, y: whitebeard.y,
                    radius: 10,
                    maxRadius: isSuper ? 200 : 160,
                    speed: isSuper ? 4 : 3.5,
                    color: "#ffffff",
                    damage: isSuper ? 16 : 12,
                    hit: false, hp: 6, maxHp: 6,
                    canDestroy: true,
                    life: 150, maxLife: 150, width: 12
                });
            }, 250);
        } else if (type === 2) {
            let dx = rwbPlayer.x - whitebeard.x;
            let dy = rwbPlayer.y - whitebeard.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            let speed = isSuper ? 7 : 6;
            rwbAttacks.push({
                type: "fist",
                x: whitebeard.x, y: whitebeard.y + 20,
                vx: (dx / len) * speed, vy: (dy / len) * speed,
                size: 20, hp: 4, maxHp: 4,
                damage: isSuper ? 32 : 25,
                life: 200, color: "#ffffff",
                rotation: 0, rotSpeed: 0,
                trail: [], hasHaki: true
            });
        } else {
            spawnTsunamiAttack(isSuper);
        }
    }

    // ============================================================
    // ★★★ НОВАЯ АТАКА: ЦУНАМИ ★★★
    // ============================================================
    function spawnTsunamiAttack(isSuper) {
        let fromLeft = Math.random() > 0.5;
        let startX = fromLeft ? -80 : 480;
        let speed = isSuper ? 3.0 : 2.2;
        let waveHeight = isSuper ? 200 : 160;
        
        rwbAttacks.push({
            type: "tsunami",
            x: startX, y: 250,
            vx: fromLeft ? speed : -speed,
            vy: 0,
            width: isSuper ? 90 : 70,
            height: waveHeight,
            currentWidth: isSuper ? 90 : 70,
            currentHeight: waveHeight,
            damage: isSuper ? 30 : 22,
            life: 400,
            fromLeft: fromLeft,
            waveTime: 0,
            hit: false,
            color: "#0099ff",
            trail: []
        });
        
        rwbSound(80, 'sine', 1.5, 0.3);
        setTimeout(function() { rwbSound(60, 'sine', 1.2, 0.25); }, 300);
        setTimeout(function() { rwbSound(120, 'sawtooth', 0.8, 0.2); }, 600);
        
        rwbFloatingTexts.push({
            x: fromLeft ? 30 : 370,
            y: 250,
            text: "🌊 ЦУНАМИ! 🌊",
            color: "#00ccff",
            life: 90, maxLife: 90,
            vy: 0, vx: 0, size: 20
        });
    }

    // ============================================================
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★★★                                                                ★★★
    // ★★★            2-Я ФАЗА: 3 УНИКАЛЬНЫЕ АТАКИ НА КАЖДОГО            ★★★
    // ★★★                                                                ★★★
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ============================================================

    // ★★★ АТАКИ РОДЖЕРА (СУПЕР) ★★★
    function spawnRogerSuperAttack() {
        let attackId = Math.floor(Math.random() * 3); // 0, 1, 2
        rwbSound(600, 'sawtooth', 0.4, 0.25);
        spawnHakiLightning(roger.x, roger.y, 10, false);

        if (attackId === 0) {
            // ★★★ 1. РАССЕЧЕНИЕ — огромный вертикальный разрез ★★★
            spawnRogerCrossSlash();
        } else if (attackId === 1) {
            // ★★★ 2. КРЕСТ — 4 клинка в форме креста ★★★
            spawnRogerCrossStrike();
        } else {
            // ★★★ 3. АДСКОЕ ПЛАМЯ — огненный шар, разлетающийся на части ★★★
            spawnRogerHellFire();
        }
    }

    function spawnRogerCrossSlash() {
        // Роджер делает огромный вертикальный разрез через всю арену
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "⚡ РАССЕЧЕНИЕ ⚡",
            color: "#ff4400",
            life: 90, maxLife: 90,
            vy: -0.3, vx: 0, size: 24
        });
        
        rwbSound(200, 'sawtooth', 0.8, 0.4);
        setTimeout(function() { rwbSound(100, 'sawtooth', 1.0, 0.3); }, 200);
        
        // Линия предупреждения — белая вертикальная
        let slashX = 80 + Math.random() * 240;
        rwbAttacks.push({
            type: "roger_slash",
            x: slashX,
            y: 0,
            width: 60,
            warningTimer: 60,
            activeTimer: 0,
            maxActive: 30,
            damage: 35,
            hit: false,
            state: "warning",
            color: "#ff4400"
        });
        
        rwbShake = 20;
        rwbScreenFlash = 15;
        rwbScreenFlashColor = "#ff4400";
    }

    function spawnRogerCrossStrike() {
        // 4 клинка в форме креста (2 вертикальных + 2 горизонтальных)
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "❌ КРЕСТ ❌",
            color: "#ff6600",
            life: 90, maxLife: 90,
            vy: -0.3, vx: 0, size: 24
        });
        
        rwbSound(300, 'square', 0.5, 0.35);
        
        // Вертикальная линия (сверху-вниз)
        let cx = 120 + Math.random() * 160;
        let cy = 150 + Math.random() * 150;
        
        // Вертикальная
        rwbAttacks.push({
            type: "roger_cross",
            x: cx, y: cy,
            dir: "vertical",
            length: 500, width: 40,
            warningTimer: 50, activeTimer: 0, maxActive: 25,
            damage: 30, hit: false, state: "warning",
            color: "#ff8800"
        });
        
        // Горизонтальная
        rwbAttacks.push({
            type: "roger_cross",
            x: cx, y: cy,
            dir: "horizontal",
            length: 500, width: 40,
            warningTimer: 50, activeTimer: 0, maxActive: 25,
            damage: 30, hit: false, state: "warning",
            color: "#ff8800"
        });
        
        // Диагональная /
        rwbAttacks.push({
            type: "roger_cross",
            x: cx, y: cy,
            dir: "diag1",
            length: 500, width: 30,
            warningTimer: 50, activeTimer: 0, maxActive: 25,
            damage: 25, hit: false, state: "warning",
            color: "#ffaa00"
        });
        
        // Диагональная \
        rwbAttacks.push({
            type: "roger_cross",
            x: cx, y: cy,
            dir: "diag2",
            length: 500, width: 30,
            warningTimer: 50, activeTimer: 0, maxActive: 25,
            damage: 25, hit: false, state: "warning",
            color: "#ffaa00"
        });
        
        rwbShake = 25;
    }

    function spawnRogerHellFire() {
        // Огненный шар летит к игроку, потом разлетается на осколки
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "🔥 АДСКОЕ ПЛАМЯ 🔥",
            color: "#ff2200",
            life: 90, maxLife: 90,
            vy: -0.3, vx: 0, size: 22
        });
        
        rwbSound(150, 'sawtooth', 0.6, 0.35);
        setTimeout(function() { rwbSound(300, 'sawtooth', 0.4, 0.25); }, 200);
        
        rwbAttacks.push({
            type: "hell_fire",
            x: roger.x,
            y: roger.y + 20,
            targetX: rwbPlayer.x,
            targetY: rwbPlayer.y,
            vx: 0, vy: 0,
            speed: 4,
            size: 30,
            hp: 5, maxHp: 5,
            damage: 25,
            life: 250,
            state: "flying", // "flying" -> "exploding" -> "done"
            flyTimer: 0,
            explosionTimer: 0,
            color: "#ff3300"
        });
    }

    // ★★★ АТАКИ БЕЛОУСА (СУПЕР) ★★★
    function spawnWhitebeardSuperAttack() {
        let attackId = Math.floor(Math.random() * 3);
        rwbSound(120, 'sawtooth', 0.5, 0.35);
        spawnHakiLightning(whitebeard.x, whitebeard.y, 10, false);

        if (attackId === 0) {
            // ★★★ 1. ЗЕМЛЕТРЯСЕНИЕ — тряска всей арены + падающие обломки ★★★
            spawnWhitebeardEarthquake();
        } else if (attackId === 1) {
            // ★★★ 2. ГУРА-ГУРА — воздушные разломы, телепорт игрока ★★★
            spawnWhitebeardGuraGura();
        } else {
            // ★★★ 3. ТИТАН-КУЛАК — огромный кулак, покрывающий пол-арены ★★★
            spawnWhitebeardTitanFist();
        }
    }

    function spawnWhitebeardEarthquake() {
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "🌋 ЗЕМЛЕТРЯСЕНИЕ 🌋",
            color: "#8B7355",
            life: 90, maxLife: 90,
            vy: -0.3, vx: 0, size: 22
        });
        
        rwbSound(60, 'sawtooth', 1.5, 0.4);
        rwbShake = 40;
        rwbScreenFlash = 15;
        rwbScreenFlashColor = "#8B7355";
        
        // Камни сыпятся со всех сторон
        for (let i = 0; i < 8; i++) {
            let cx = 30 + Math.random() * 340;
            rwbAttacks.push({
                type: "rock",
                x: cx,
                y: -50 - Math.random() * 60,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 3.0 + Math.random() * 2.0,
                size: 20 + Math.random() * 12,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.15,
                hp: 3, maxHp: 3,
                damage: 20,
                life: 400, color: "#8B7355",
                hasHaki: false,
                textureSeed: Math.random() * 1000
            });
        }
        
        // Белые трещины у Белоуса
        spawnWhiteCracks(whitebeard.x, whitebeard.y, 8);
        
        // Мощная тряска
        let shakeInterval = setInterval(function() {
            if (!window.rwbActive || rwbState !== "fight2") { clearInterval(shakeInterval); return; }
            rwbShake = Math.max(rwbShake, 20);
        }, 100);
        setTimeout(function() { clearInterval(shakeInterval); }, 2000);
    }

    function spawnWhitebeardGuraGura() {
        // Воздушные разломы — появляются в 4-6 местах, потом взрываются
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "💥 ГУРА-ГУРА 💥",
            color: "#ffffff",
            life: 90, maxLife: 90,
            vy: -0.3, vx: 0, size: 24
        });
        
        rwbSound(200, 'sawtooth', 0.6, 0.4);
        setTimeout(function() { rwbSound(400, 'sawtooth', 0.5, 0.35); }, 300);
        setTimeout(function() { rwbSound(600, 'sawtooth', 0.6, 0.3); }, 600);
        
        // Создаём 5 разломов
        let crackCount = 5;
        for (let i = 0; i < crackCount; i++) {
            let rx = 40 + Math.random() * 320;
            let ry = 80 + Math.random() * 350;
            rwbAttacks.push({
                type: "gura_crack",
                x: rx, y: ry,
                radius: 10,
                maxRadius: 90,
                damage: 28,
                life: 200,
                state: "warning",
                warningTimer: 80 + i * 15, // поочерёдно
                activeTimer: 0,
                maxActive: 25,
                hit: false,
                color: "#ffffff"
            });
        }
        
        rwbShake = 30;
    }

    function spawnWhitebeardTitanFist() {
        // Огромный кулак летит вниз, покрывая большую часть арены
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "👊 ТИТАН-КУЛАК 👊",
            color: "#ffdd00",
            life: 90, maxLife: 90,
            vy: -0.3, vx: 0, size: 22
        });
        
        rwbSound(80, 'sawtooth', 1.0, 0.45);
        rwbShake = 35;
        rwbScreenFlash = 20;
        rwbScreenFlashColor = "#ffffff";
        
        // Кулак сверху
        let fistX = 100 + Math.random() * 200;
        rwbAttacks.push({
            type: "titan_fist",
            x: fistX,
            y: -150,
            vy: 3.5,
            size: 90, // ОГРОМНЫЙ
            damage: 45,
            life: 300,
            state: "falling",
            hit: false,
            color: "#8B7355",
            trail: []
        });
        
        // Плюс мелкие осколки для атмосферы
        for (let i = 0; i < 4; i++) {
            let cx = 30 + Math.random() * 340;
            rwbAttacks.push({
                type: "rock",
                x: cx,
                y: -50 - Math.random() * 40,
                vx: (Math.random() - 0.5) * 0.8,
                vy: 3.5 + Math.random() * 1.5,
                size: 12 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.1,
                hp: 2, maxHp: 2,
                damage: 12,
                life: 350, color: "#8B7355",
                hasHaki: false,
                textureSeed: Math.random() * 1000
            });
        }
    }

    // ============================================================
    // ★★★ СУПЕР (активация) ★★★
    // ============================================================
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

        rwbScreenFlash = 60;
        rwbScreenFlashColor = "#000000";
        rwbShake = 60;
        rwbHakiAura = 60;

        for (let i = 0; i < 120; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 4 + Math.random() * 12;
            rwbParticles.push({
                x: 200, y: 250,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 60, maxLife: 60,
                color: i % 3 === 0 ? "#000000" : (i % 3 === 1 ? "#ff2222" : "#ffffff"),
                size: 3 + Math.random() * 5
            });
        }

        for (let i = 0; i < 50; i++) {
            spawnHakiLightning(200 + (Math.random() - 0.5) * 200, 250 + (Math.random() - 0.5) * 200, 1, Math.random() > 0.6);
        }

        rwbSound(300, 'sawtooth', 1.0, 0.4);
        setTimeout(function() { rwbSound(150, 'sawtooth', 1.2, 0.35); }, 200);
    }

    // ============================================================
    // ★★★ ОБНОВЛЕНИЕ АТАК ★★★
    // ============================================================
    function updateRWBAttacks() {
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            let a = rwbAttacks[i];
            
            // ========== ЦУНАМИ ==========
            if (a.type === "tsunami") {
                a.waveTime += 0.08;
                a.x += a.vx;
                a.life--;
                
                a.currentHeight = a.height * (1 + Math.sin(a.waveTime) * 0.1);
                a.currentWidth = a.width * (1 + Math.cos(a.waveTime * 1.3) * 0.08);
                
                if (Math.random() < 0.4) {
                    for (let k = 0; k < 3; k++) {
                        rwbParticles.push({
                            x: a.x + (Math.random() - 0.5) * a.currentWidth,
                            y: a.y + (Math.random() - 0.5) * a.currentHeight,
                            vx: a.fromLeft ? -1 - Math.random() * 2 : 1 + Math.random() * 2,
                            vy: (Math.random() - 0.5) * 3 - 1,
                            life: 25 + Math.random() * 15, maxLife: 40,
                            color: Math.random() > 0.5 ? "#ffffff" : "#88ddff",
                            size: 1 + Math.random() * 2
                        });
                    }
                }
                
                if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                    let dx = Math.abs(rwbPlayer.x - a.x);
                    let dy = Math.abs(rwbPlayer.y - a.y);
                    if (dx < a.currentWidth / 2 + 8 && dy < a.currentHeight / 2 + 8) {
                        a.hit = true;
                        hitPlayer(a.damage);
                    }
                }
                
                if (a.x < -150 || a.x > 550 || a.life <= 0) {
                    rwbAttacks.splice(i, 1);
                }
                continue;
            }

            // ========== КАМЕНЬ (rock) ==========
            if (a.type === "rock") {
                a.x += a.vx;
                a.y += a.vy;
                a.rotation += a.rotSpeed;
                a.life--;
                
                if (Math.random() < 0.3) {
                    rwbParticles.push({
                        x: a.x + (Math.random() - 0.5) * a.size,
                        y: a.y - a.size * 0.5,
                        vx: (Math.random() - 0.5) * 1,
                        vy: -0.5 - Math.random() * 1,
                        life: 15 + Math.random() * 10, maxLife: 25,
                        color: "#5a4030", size: 1 + Math.random() * 2
                    });
                }
                
                if (Math.random() < 0.1) {
                    spawnHakiLightning(a.x, a.y, 1, false);
                }
                
                if (rwbPlayer.invulnTimer <= 0) {
                    let dx = rwbPlayer.x - a.x;
                    let dy = rwbPlayer.y - a.y;
                    if (Math.sqrt(dx * dx + dy * dy) < a.size + rwbPlayer.size) {
                        hitPlayer(a.damage);
                        spawnRockSmash(a.x, a.y, a.size);
                        rwbAttacks.splice(i, 1);
                        continue;
                    }
                }
                
                if (a.y > 520 || a.life <= 0) {
                    spawnRockSmash(a.x, 500, a.size);
                    rwbAttacks.splice(i, 1);
                    continue;
                }
                continue;
            }

            // ========== ★ РАССЕЧЕНИЕ РОДЖЕРА (roger_slash) ★ ==========
            if (a.type === "roger_slash") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) {
                        a.state = "active";
                        a.activeTimer = a.maxActive;
                        rwbShake = 30;
                        rwbScreenFlash = 20;
                        rwbScreenFlashColor = "#ff4400";
                        rwbSound(150, 'sawtooth', 0.8, 0.5);
                        // Молнии по всей линии
                        for (let k = 0; k < 15; k++) {
                            spawnHakiLightning(a.x, Math.random() * 500, 1, false);
                        }
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    // Урон
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        if (Math.abs(rwbPlayer.x - a.x) < a.width / 2 + 8) {
                            a.hit = true;
                            hitPlayer(a.damage);
                        }
                    }
                    // Частицы
                    if (Math.random() < 0.6) {
                        rwbParticles.push({
                            x: a.x + (Math.random() - 0.5) * a.width,
                            y: Math.random() * 500,
                            vx: (Math.random() - 0.5) * 3,
                            vy: (Math.random() - 0.5) * 3,
                            life: 20, maxLife: 20,
                            color: "#ff4400", size: 2 + Math.random() * 3
                        });
                    }
                    if (a.activeTimer <= 0) a.state = "done";
                } else {
                    rwbAttacks.splice(i, 1);
                    continue;
                }
                continue;
            }

            // ========== ★ КРЕСТ РОДЖЕРА (roger_cross) ★ ==========
            if (a.type === "roger_cross") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) {
                        a.state = "active";
                        a.activeTimer = a.maxActive;
                        rwbShake = 25;
                        rwbSound(300, 'sawtooth', 0.5, 0.4);
                        // Молнии по линии
                        for (let k = 0; k < 10; k++) {
                            spawnHakiLightning(a.x + (Math.random()-0.5)*200, a.y + (Math.random()-0.5)*200, 1, false);
                        }
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    // Урон по форме
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x;
                        let dy = rwbPlayer.y - a.y;
                        let hit = false;
                        
                        if (a.dir === "vertical") {
                            hit = Math.abs(dx) < a.width / 2 + 8;
                        } else if (a.dir === "horizontal") {
                            hit = Math.abs(dy) < a.width / 2 + 8;
                        } else if (a.dir === "diag1") {
                            // / линия: y = -x (при условии что x,y от центра)
                            let d1 = Math.abs(dx - dy) / Math.sqrt(2);
                            hit = d1 < a.width / 2 + 8;
                        } else if (a.dir === "diag2") {
                            // \ линия: y = x
                            let d2 = Math.abs(dx + dy) / Math.sqrt(2);
                            hit = d2 < a.width / 2 + 8;
                        }
                        
                        if (hit) {
                            a.hit = true;
                            hitPlayer(a.damage);
                        }
                    }
                    if (a.activeTimer <= 0) a.state = "done";
                } else {
                    rwbAttacks.splice(i, 1);
                    continue;
                }
                continue;
            }

            // ========== ★ АДСКОЕ ПЛАМЯ РОДЖЕРА (hell_fire) ★ ==========
            if (a.type === "hell_fire") {
                if (a.state === "flying") {
                    a.flyTimer++;
                    // Летит к цели
                    let dx = a.targetX - a.x;
                    let dy = a.targetY - a.y;
                    let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    if (dist < a.speed) {
                        // Достиг цели — взрыв
                        a.state = "exploding";
                        a.explosionTimer = 60;
                        a.x = a.targetX;
                        a.y = a.targetY;
                        rwbShake = 35;
                        rwbScreenFlash = 25;
                        rwbScreenFlashColor = "#ff2200";
                        rwbSound(80, 'sawtooth', 1.0, 0.5);
                        
                        // Разлёт осколков огня
                        for (let j = 0; j < 12; j++) {
                            let ang = (j / 12) * Math.PI * 2;
                            rwbAttacks.push({
                                type: "fire_piece",
                                x: a.x, y: a.y,
                                vx: Math.cos(ang) * 3,
                                vy: Math.sin(ang) * 3,
                                size: 8,
                                damage: 15,
                                life: 150,
                                color: "#ff4400",
                                trail: []
                            });
                        }
                    } else {
                        a.x += (dx / dist) * a.speed;
                        a.y += (dy / dist) * a.speed;
                    }
                    
                    // Частицы пламени
                    if (Math.random() < 0.7) {
                        rwbParticles.push({
                            x: a.x + (Math.random() - 0.5) * a.size,
                            y: a.y + (Math.random() - 0.5) * a.size,
                            vx: (Math.random() - 0.5) * 2,
                            vy: -1 - Math.random() * 2,
                            life: 25, maxLife: 25,
                            color: Math.random() > 0.5 ? "#ff4400" : "#ffcc00",
                            size: 2 + Math.random() * 3
                        });
                    }
                } else if (a.state === "exploding") {
                    a.explosionTimer--;
                    if (a.explosionTimer <= 0) a.state = "done";
                } else {
                    rwbAttacks.splice(i, 1);
                    continue;
                }
                continue;
            }

            // ========== ★ ОСКОЛКИ ОГНЯ (fire_piece) ★ ==========
            if (a.type === "fire_piece") {
                a.x += a.vx;
                a.y += a.vy;
                a.life--;
                
                if (a.trail) {
                    a.trail.push({ x: a.x, y: a.y, life: 10 });
                    if (a.trail.length > 5) a.trail.shift();
                }
                
                if (Math.random() < 0.4) {
                    rwbParticles.push({
                        x: a.x, y: a.y,
                        vx: (Math.random() - 0.5) * 1,
                        vy: (Math.random() - 0.5) * 1,
                        life: 15, maxLife: 15,
                        color: "#ff6600", size: 2 + Math.random() * 2
                    });
                }
                
                if (rwbPlayer.invulnTimer <= 0) {
                    let dx = rwbPlayer.x - a.x;
                    let dy = rwbPlayer.y - a.y;
                    if (Math.sqrt(dx*dx + dy*dy) < a.size + rwbPlayer.size) {
                        hitPlayer(a.damage);
                        rwbAttacks.splice(i, 1);
                        continue;
                    }
                }
                
                if (a.life <= 0 || a.x < -20 || a.x > 420 || a.y < -20 || a.y > 520) {
                    rwbAttacks.splice(i, 1);
                }
                continue;
            }

            // ========== ★ ГУРА-ГУРА РАЗЛОМ (gura_crack) ★ ==========
            if (a.type === "gura_crack") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    // Вращение радиуса предупреждения
                    if (a.warningTimer <= 0) {
                        a.state = "active";
                        a.activeTimer = a.maxActive;
                        rwbShake = 25;
                        rwbSound(300, 'square', 0.4, 0.4);
                        // Взрыв
                        for (let j = 0; j < 20; j++) {
                            let ang = (j / 20) * Math.PI * 2;
                            rwbParticles.push({
                                x: a.x, y: a.y,
                                vx: Math.cos(ang) * 6,
                                vy: Math.sin(ang) * 6,
                                life: 30, maxLife: 30,
                                color: "#ffffff", size: 2 + Math.random() * 3
                            });
                        }
                        // Белые трещины
                        for (let j = 0; j < 4; j++) {
                            spawnHakiLightning(a.x + (Math.random()-0.5)*60, a.y + (Math.random()-0.5)*60, 1, true);
                        }
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    a.radius = a.maxRadius * (1 - a.activeTimer / a.maxActive);
                    
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x;
                        let dy = rwbPlayer.y - a.y;
                        if (Math.sqrt(dx*dx + dy*dy) < a.radius) {
                            a.hit = true;
                            hitPlayer(a.damage);
                        }
                    }
                    
                    // Частицы взрыва
                    if (Math.random() < 0.5) {
                        let ang = Math.random() * Math.PI * 2;
                        rwbParticles.push({
                            x: a.x + Math.cos(ang) * a.radius,
                            y: a.y + Math.sin(ang) * a.radius,
                            vx: Math.cos(ang) * 2,
                            vy: Math.sin(ang) * 2,
                            life: 20, maxLife: 20,
                            color: "#ffffff", size: 2 + Math.random() * 3
                        });
                    }
                    
                    if (a.activeTimer <= 0) a.state = "done";
                } else {
                    rwbAttacks.splice(i, 1);
                    continue;
                }
                continue;
            }

            // ========== ★ ТИТАН-КУЛАК (titan_fist) ★ ==========
            if (a.type === "titan_fist") {
                if (a.state === "falling") {
                    a.y += a.vy;
                    a.life--;
                    
                    // Огонь/дым вокруг
                    if (Math.random() < 0.6) {
                        rwbParticles.push({
                            x: a.x + (Math.random() - 0.5) * a.size,
                            y: a.y + a.size * 0.5,
                            vx: (Math.random() - 0.5) * 3,
                            vy: -1 - Math.random() * 2,
                            life: 25, maxLife: 25,
                            color: Math.random() > 0.5 ? "#ff6600" : "#ffaa00",
                            size: 2 + Math.random() * 4
                        });
                    }
                    
                    // Урон при попадании
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x;
                        let dy = rwbPlayer.y - a.y;
                        if (Math.sqrt(dx*dx + dy*dy) < a.size + rwbPlayer.size) {
                            a.hit = true;
                            hitPlayer(a.damage);
                        }
                    }
                    
                    // Достиг низа — взрыв
                    if (a.y > 400) {
                        a.state = "impact";
                        a.impactTimer = 40;
                        rwbShake = 60;
                        rwbScreenFlash = 30;
                        rwbScreenFlashColor = "#ff8800";
                        rwbSound(40, 'sawtooth', 1.5, 0.6);
                        
                        // Разлёт камней
                        for (let j = 0; j < 20; j++) {
                            let ang = (j / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                            rwbAttacks.push({
                                type: "rock",
                                x: a.x, y: a.y,
                                vx: Math.cos(ang) * 4,
                                vy: Math.sin(ang) * 4 - 2,
                                size: 12 + Math.random() * 8,
                                rotation: Math.random() * Math.PI * 2,
                                rotSpeed: (Math.random() - 0.5) * 0.2,
                                hp: 1, maxHp: 1,
                                damage: 15,
                                life: 200, color: "#8B7355",
                                hasHaki: false,
                                textureSeed: Math.random() * 1000
                            });
                        }
                    }
                } else if (a.state === "impact") {
                    a.impactTimer--;
                    if (a.impactTimer <= 0) a.state = "done";
                } else {
                    rwbAttacks.splice(i, 1);
                    continue;
                }
                continue;
            }

            // ========== ОСТАЛЬНЫЕ АТАКИ ==========
            a.x += a.vx; a.y += a.vy;
            a.rotation += a.rotSpeed || 0;
            a.life--;

            if (a.trail) {
                a.trail.push({ x: a.x, y: a.y, life: 12 });
                if (a.trail.length > 6) a.trail.shift();
            }

            if (a.hasHaki && Math.random() < 0.08) {
                spawnHakiLightning(a.x + (Math.random() - 0.5) * a.size, a.y + (Math.random() - 0.5) * a.size, 1, false);
            }

            if (Math.random() < 0.15) {
                rwbParticles.push({
                    x: a.x + (Math.random() - 0.5) * a.size,
                    y: a.y + (Math.random() - 0.5) * a.size,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    life: 12, maxLife: 12,
                    color: a.color, size: 1.5 + Math.random() * 2
                });
            }

            if (rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                if (Math.sqrt(dx * dx + dy * dy) < a.size + rwbPlayer.size) {
                    hitPlayer(a.damage);
                    rwbAttacks.splice(i, 1);
                    continue;
                }
            }

            if (a.life <= 0 || a.y > 540 || a.x < -60 || a.x > 460 || a.y < -150) {
                rwbAttacks.splice(i, 1);
            }
        }

        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            let sw = rwbShockwaves[i];
            sw.radius += sw.speed;
            sw.life--;

            if (sw.canDestroy && Math.random() < 0.4) {
                let ang = Math.random() * Math.PI * 2;
                rwbParticles.push({
                    x: sw.x + Math.cos(ang) * sw.radius,
                    y: sw.y + Math.sin(ang) * sw.radius,
                    vx: Math.cos(ang) * 2, vy: Math.sin(ang) * 2,
                    life: 15, maxLife: 15,
                    color: sw.color, size: 2 + Math.random() * 2
                });
            }

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

    function spawnRockSmash(x, y, size) {
        rwbShake = 12;
        rwbSound(80, 'sawtooth', 0.4, 0.3);
        for (let i = 0; i < 20; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 2 + Math.random() * 6;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 2,
                life: 30, maxLife: 30,
                color: Math.random() > 0.5 ? "#8B7355" : "#5a4030",
                size: 2 + Math.random() * 3
            });
        }
        for (let i = 0; i < 10; i++) {
            rwbParticles.push({
                x: x + (Math.random() - 0.5) * size,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: -1 - Math.random() * 2,
                life: 25, maxLife: 25,
                color: "#aaaaaa", size: 3 + Math.random() * 3
            });
        }
    }

    // ============================================================
    // ★★★ ПУЛИ — ТЕПЕРЬ С БРОНЁЙ ★★★
    // ============================================================
    function updateRWBPlayerBullets() {
        for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
            let b = rwbPlayerBullets[i];
            b.x += b.vx; b.y += b.vy; b.life--;
            let destroyed = false;

            if (b.isBlue) {
                // Синяя — сбивает атаки
                for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                    let a = rwbAttacks[j];
                    if (a.type === "tsunami" || a.type === "titan_fist") continue;
                    if (a.type === "roger_slash" || a.type === "roger_cross" || a.type === "gura_crack") {
                        // По этим нельзя — они не материальные
                        continue;
                    }
                    
                    let dx = b.x - a.x, dy = b.y - a.y;
                    let aSize = a.size || 30;
                    if (Math.sqrt(dx * dx + dy * dy) < aSize + b.size + 6) {
                        if (a.hp !== undefined) {
                            a.hp -= 1;
                        } else {
                            a.hp = 1;
                        }
                        spawnHitParticles(b.x, b.y, "#00aaff", 4);
                        rwbSound(1200, 'square', 0.06, 0.1);
                        if (a.hp <= 0) {
                            spawnDestroyParticles(a.x, a.y, a.color || "#ffffff");
                            rwbSound(600, 'square', 0.15, 0.2);
                            rwbAttacks.splice(j, 1);
                        }
                        destroyed = true;
                        break;
                    }
                }
                if (!destroyed) {
                    for (let j = rwbShockwaves.length - 1; j >= 0; j--) {
                        let sw = rwbShockwaves[j];
                        if (!sw.canDestroy) continue;
                        let dx = b.x - sw.x, dy = b.y - sw.y;
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        if (Math.abs(dist - sw.radius) < sw.width + b.size) {
                            sw.hp -= 1;
                            spawnHitParticles(b.x, b.y, "#00aaff", 4);
                            rwbSound(1200, 'square', 0.06, 0.1);
                            if (sw.hp <= 0) {
                                spawnDestroyParticles(b.x, b.y, sw.color);
                                rwbSound(600, 'square', 0.15, 0.2);
                                rwbShockwaves.splice(j, 1);
                            }
                            destroyed = true;
                            break;
                        }
                    }
                }
            } else {
                // ★ Жёлтая — урон по боссам ★
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
                        // ★ ПРИМЕНЯЕМ БРОНЮ ★
                        let dmg = b.damage;
                        if (typeof window.applyArmorToBossDamage === 'function') {
                            let result = window.applyArmorToBossDamage(dmg);
                            if (result.blocked) {
                                // Отражено — показываем
                                if (typeof showFloatingText === 'function') showFloatingText("🛡️ ОТРАЖЕНО!", "#9b59b6");
                                spawnHitParticles(b.x, b.y, "#9b59b6", 8);
                                destroyed = true;
                                break;
                            }
                            dmg = result.dmg;
                        }
                        
                        boss.hp = Math.max(0, boss.hp - dmg);
                        boss.hitFlash = 4;
                        spawnHitParticles(b.x, b.y, b.color, 5);
                        spawnHakiLightning(b.x, b.y, 3, false);
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
        
        // ★ ПРИМЕНЯЕМ БРОНЮ (для защиты) ★
        if (typeof window.applyArmorToBossDamage === 'function') {
            let result = window.applyArmorToBossDamage(dmg);
            if (result.blocked) return;
            dmg = result.dmg;
        }
        
        rwbPlayer.hp -= dmg;
        rwbPlayer.invulnTimer = 40;
        rwbShake = 15;
        rwbScreenFlash = 8;
        rwbScreenFlashColor = "#ff0000";
        rwbSound(60, 'sawtooth', 0.5, 0.3);

        let hpEl = document.getElementById("arenaHP");
        if (hpEl) hpEl.innerText = Math.max(0, rwbPlayer.hp);

        for (let p = 0; p < 20; p++) {
            let ang = Math.random() * Math.PI * 2;
            rwbParticles.push({
                x: rwbPlayer.x, y: rwbPlayer.y,
                vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6,
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
        for (let i = 0; i < 25; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 3 + Math.random() * 7;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 2,
                life: 30, maxLife: 30,
                color: i % 3 === 0 ? "#000000" : (i % 2 === 0 ? "#ff2222" : color),
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
        stopRWBMusic();
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
            if (rwbIntroTimer > 150) rwbState = "fight1";
        } else if (rwbState === "fight1") {
            updateRWBPlayer();
            updateDuel();
            updateRWBAttacks();
            updateRWBPlayerBullets();
        } else if (rwbState === "transition") {
            rwbTransitionTimer++;
            if (rwbTransitionTimer > 120) { rwbState = "fight2"; rwbSurvivalTimer2 = 0; }
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
        for (let i = rwbHakiLightnings.length - 1; i >= 0; i--) {
            let h = rwbHakiLightnings[i];
            h.life--;
            if (h.life <= 0) rwbHakiLightnings.splice(i, 1);
        }
        for (let i = rwbFloatingTexts.length - 1; i >= 0; i--) {
            let t = rwbFloatingTexts[i];
            t.life--;
            t.y += t.vy;
            if (t.life <= 0) rwbFloatingTexts.splice(i, 1);
        }

        if (rwbHakiAura > 0) rwbHakiAura--;
        if (rwbShake > 0.1) rwbShake *= 0.88;
        if (rwbScreenFlash > 0) rwbScreenFlash--;

        ctx.save();
        if (rwbShake > 0.5) ctx.translate((Math.random() - 0.5) * rwbShake, (Math.random() - 0.5) * rwbShake);

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

        if (rwbHakiAura > 0) {
            ctx.save();
            ctx.globalAlpha = rwbHakiAura / 80;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 400, 500);
            ctx.restore();
        }

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

        if (rwbScreenFlash > 0) {
            ctx.globalAlpha = rwbScreenFlash / 30;
            ctx.fillStyle = rwbScreenFlashColor;
            ctx.fillRect(0, 0, 400, 500);
            ctx.globalAlpha = 1;
        }

        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 12;
        ctx.strokeRect(2, 2, 396, 496);
        ctx.shadowBlur = 0;

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

        drawWhiteCracks();

        if (rwbState === "fight1" || rwbState === "transition") {
            if (roger) drawRoger();
            if (whitebeard) drawWhitebeard();
        } else if (rwbState === "fight2" && rwbActiveBoss) {
            if (rwbActiveBoss.id === "roger") drawRoger();
            else drawWhitebeard();
        }

        for (let i = 0; i < rwbShockwaves.length; i++) {
            let sw = rwbShockwaves[i];
            let p = sw.life / sw.maxLife;
            ctx.save();
            ctx.globalAlpha = p * 0.9;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.width * p;
            ctx.shadowColor = sw.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = p * 0.4;
            ctx.lineWidth = sw.width * p * 0.4;
            ctx.strokeStyle = "#ff2222";
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            if (sw.canDestroy && sw.hp !== undefined) {
                ctx.font = "bold 11px monospace";
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.shadowBlur = 4;
                ctx.fillText(sw.hp + "/" + sw.maxHp, sw.x, sw.y - sw.radius - 5);
            }
            ctx.restore();
        }

        for (let i = 0; i < rwbAttacks.length; i++) drawAttack(rwbAttacks[i]);

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

        if (rwbState === "fight1" || rwbState === "fight2") drawRWBPlayer();

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

        for (let i = 0; i < rwbHakiLightnings.length; i++) {
            let h = rwbHakiLightnings[i];
            let alpha = h.life / h.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;

            ctx.strokeStyle = h.outerColor;
            ctx.lineWidth = h.width + 2;
            ctx.shadowColor = "#000000";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(h.x1, h.y1);
            for (let p = 0; p < h.points.length; p++) {
                ctx.lineTo(h.points[p].x, h.points[p].y);
            }
            ctx.lineTo(h.x2, h.y2);
            ctx.stroke();

            ctx.strokeStyle = h.innerColor;
            ctx.lineWidth = h.width;
            ctx.shadowColor = h.innerColor === "#ffffff" ? "#ffffff" : "#ff2222";
            ctx.shadowBlur = 10;
            ctx.stroke();

            ctx.restore();
        }

        for (let i = 0; i < rwbFloatingTexts.length; i++) {
            let t = rwbFloatingTexts[i];
            ctx.save();
            ctx.globalAlpha = Math.min(1, t.life / 30);
            ctx.font = "bold " + (t.size || 16) + "px Impact, Arial Black, sans-serif";
            ctx.textAlign = "center";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 4;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 15;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

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

        if (rwbState === "intro") {
            ctx.save();
            ctx.font = "bold 24px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#000000";
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
            ctx.fillText("🟡 Жёлтая бьёт только боссов", 200, 375);
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
                ctx.font = "14px monospace";
                ctx.fillStyle = "#ffdd00";
                ctx.fillText("Атаки: Рассечение • Крест • Пламя", 200, 290);
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "#ffffff";
                ctx.fillText("БЕЛОУС: СУПЕР!", 200, 250);
                ctx.font = "14px monospace";
                ctx.fillStyle = "#ffdd00";
                ctx.fillText("Атаки: Землетрясение • Гура-Гура • Кулак", 200, 290);
            }
            ctx.font = "15px monospace";
            ctx.fillStyle = "#ffd700";
            ctx.shadowColor = "#ffd700";
            ctx.fillText("ПОСЛЕДНИЙ РАУНД!", 200, 330);
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

    // ============================================================
    // ★★★ ОБНОВЛЕНИЕ СУПЕР-БОССА (2-я фаза) ★★★
    // ============================================================
    function updateSuperBoss() {
        let active = rwbActiveBoss;
        if (!active) return;
        active.pulse += 0.15;
        active.rotation += 0.04;
        active.x = 200 + Math.sin(rwbTimer / 60) * 120;
        active.y = 100 + Math.sin(rwbTimer / 45) * 25;
        if (active.hitFlash > 0) active.hitFlash--;

        if (Math.random() < 0.3) {
            spawnHakiLightning(active.x + (Math.random() - 0.5) * 60, active.y + (Math.random() - 0.5) * 60, 1, false);
        }

        active.attackTimer--;
        if (active.attackTimer <= 0) {
            active.attackTimer = 55 + Math.random() * 30; // Реже, но больнее
            if (active.id === "roger") {
                spawnRogerSuperAttack(); // ★ НОВЫЕ УНИКАЛЬНЫЕ АТАКИ РОДЖЕРА ★
            } else {
                spawnWhitebeardSuperAttack(); // ★ НОВЫЕ УНИКАЛЬНЫЕ АТАКИ БЕЛОУСА ★
            }
        }
    }

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

    function drawRoger() {
        if (!roger) return;
        let pulse = 1 + Math.sin(roger.pulse) * 0.08;
        let size = roger.size * pulse;
        let flash = roger.hitFlash > 0;
        ctx.save();
        ctx.translate(roger.x, roger.y);
        if (roger.superForm) {
            let auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 3.5);
            auraGrad.addColorStop(0, "rgba(255, 136, 0, 0.7)");
            auraGrad.addColorStop(0.5, "rgba(255, 68, 0, 0.3)");
            auraGrad.addColorStop(1, "transparent");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, size * 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.save();
            ctx.rotate(roger.rotation);
            ctx.strokeStyle = "rgba(255, 136, 0, 0.6)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 10; i++) {
                let ang = (i / 10) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * size * 1.5, Math.sin(ang) * size * 1.5);
                ctx.lineTo(Math.cos(ang) * size * 2.8, Math.sin(ang) * size * 2.8);
                ctx.stroke();
            }
            ctx.restore();
        }
        ctx.rotate(Math.sin(roger.rotation) * 0.1);
        drawHeartShape(0, 0, size, flash ? "#ffffff" : "#ff8800", "#ff8800");
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
            for (let i = 0; i < 10; i++) {
                let ang = (i / 10) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * size * 1.5, Math.sin(ang) * size * 1.5);
                ctx.lineTo(Math.cos(ang) * size * 2.8, Math.sin(ang) * size * 2.8);
                ctx.stroke();
            }
            ctx.restore();
        }
        ctx.rotate(Math.sin(whitebeard.rotation) * 0.1);
        drawHeartShape(0, 0, size, flash ? "#ffffaa" : "#ffffff", "#ffffff");
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

    // ============================================================
    // ★★★ РЕНДЕР АТАК ★★★
    // ============================================================
    function drawAttack(a) {
        if (a.trail && a.trail.length > 0) {
            for (let j = 0; j < a.trail.length; j++) {
                let tr = a.trail[j];
                ctx.globalAlpha = (1 - j / a.trail.length) * 0.5;
                ctx.fillStyle = a.color;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, (a.size || 20) * 0.6 * (1 - j / a.trail.length), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        if (a.type === "tsunami") { drawTsunami(a); return; }
        if (a.type === "rock") { drawRock(a); return; }

        // ★ РАССЕЧЕНИЕ РОДЖЕРА ★
        if (a.type === "roger_slash") {
            ctx.save();
            if (a.state === "warning") {
                let pulseAlpha = 0.3 + Math.sin(performance.now() / 80) * 0.25;
                ctx.globalAlpha = pulseAlpha;
                ctx.fillStyle = "#ff4400";
                ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 6]);
                ctx.beginPath();
                ctx.moveTo(a.x - a.width / 2, 0);
                ctx.lineTo(a.x - a.width / 2, 500);
                ctx.moveTo(a.x + a.width / 2, 0);
                ctx.lineTo(a.x + a.width / 2, 500);
                ctx.stroke();
                ctx.setLineDash([]);
            } else if (a.state === "active") {
                let fade = Math.min(1, a.activeTimer / 12);
                ctx.globalAlpha = fade;
                // Внешнее свечение
                let outerGlow = ctx.createLinearGradient(a.x - a.width * 1.2, 0, a.x + a.width * 1.2, 0);
                outerGlow.addColorStop(0, "rgba(255, 68, 0, 0)");
                outerGlow.addColorStop(0.3, "rgba(255, 150, 50, 0.6)");
                outerGlow.addColorStop(0.5, "rgba(255, 255, 255, 1)");
                outerGlow.addColorStop(0.7, "rgba(255, 150, 50, 0.6)");
                outerGlow.addColorStop(1, "rgba(255, 68, 0, 0)");
                ctx.fillStyle = outerGlow;
                ctx.fillRect(a.x - a.width * 1.2, 0, a.width * 2.4, 500);
                // Ядро
                ctx.fillStyle = "#ff2200";
                ctx.globalAlpha = fade * 0.95;
                ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha = fade;
                ctx.fillRect(a.x - a.width * 0.15, 0, a.width * 0.3, 500);
            }
            ctx.restore();
            return;
        }

        // ★ КРЕСТ РОДЖЕРА ★
        if (a.type === "roger_cross") {
            ctx.save();
            let angle = 0;
            if (a.dir === "vertical") angle = 0;
            else if (a.dir === "horizontal") angle = Math.PI / 2;
            else if (a.dir === "diag1") angle = Math.PI / 4;
            else if (a.dir === "diag2") angle = -Math.PI / 4;
            
            ctx.translate(a.x, a.y);
            ctx.rotate(angle);
            
            if (a.state === "warning") {
                let pulseAlpha = 0.3 + Math.sin(performance.now() / 80) * 0.25;
                ctx.globalAlpha = pulseAlpha;
                ctx.fillStyle = "#ff6600";
                ctx.fillRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 6]);
                ctx.strokeRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.setLineDash([]);
            } else if (a.state === "active") {
                let fade = Math.min(1, a.activeTimer / 8);
                ctx.globalAlpha = fade;
                let glow = ctx.createLinearGradient(-a.width * 1.2, 0, a.width * 1.2, 0);
                glow.addColorStop(0, "rgba(255, 102, 0, 0)");
                glow.addColorStop(0.5, "rgba(255, 200, 100, 0.8)");
                glow.addColorStop(1, "rgba(255, 102, 0, 0)");
                ctx.fillStyle = glow;
                ctx.fillRect(-a.width * 1.2, -a.length / 2, a.width * 2.4, a.length);
                ctx.fillStyle = "#ff4400";
                ctx.globalAlpha = fade * 0.95;
                ctx.fillRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha = fade;
                ctx.fillRect(-a.width * 0.15, -a.length / 2, a.width * 0.3, a.length);
            }
            ctx.restore();
            return;
        }

        // ★ АДСКОЕ ПЛАМЯ ★
        if (a.type === "hell_fire") {
            ctx.save();
            if (a.state === "flying") {
                let glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size * 2);
                glow.addColorStop(0, "#ffffff");
                glow.addColorStop(0.3, "#ffcc00");
                glow.addColorStop(0.6, "#ff4400");
                glow.addColorStop(1, "transparent");
                ctx.fillStyle = glow;
                ctx.shadowColor = "#ff2200";
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.size * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ff2200";
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffcc00";
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            } else if (a.state === "exploding") {
                let p = 1 - a.explosionTimer / 60;
                let r = 80 * p;
                let glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r);
                glow.addColorStop(0, "#ffffff");
                glow.addColorStop(0.3, "#ffcc00");
                glow.addColorStop(0.6, "#ff4400");
                glow.addColorStop(1, "transparent");
                ctx.globalAlpha = 1 - p;
                ctx.fillStyle = glow;
                ctx.shadowColor = "#ff2200";
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            return;
        }

        // ★ ОСКОЛКИ ОГНЯ ★
        if (a.type === "fire_piece") {
            ctx.save();
            let glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size * 2);
            glow.addColorStop(0, "#ffffff");
            glow.addColorStop(0.4, "#ffcc00");
            glow.addColorStop(0.7, "#ff4400");
            glow.addColorStop(1, "transparent");
            ctx.fillStyle = glow;
            ctx.shadowColor = "#ff2200";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        // ★ ГУРА-ГУРА РАЗЛОМ ★
        if (a.type === "gura_crack") {
            ctx.save();
            if (a.state === "warning") {
                let pulseAlpha = 0.4 + Math.sin(performance.now() / 60) * 0.3;
                ctx.globalAlpha = pulseAlpha;
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.maxRadius, 0, Math.PI * 2);
                ctx.stroke();
                // Внутреннее кольцо
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.maxRadius * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                // Зигзаги в центре
                for (let i = 0; i < 5; i++) {
                    let ang = (i / 5) * Math.PI * 2 + performance.now() / 500;
                    ctx.beginPath();
                    ctx.moveTo(a.x + Math.cos(ang) * 10, a.y + Math.sin(ang) * 10);
                    ctx.lineTo(a.x + Math.cos(ang) * (a.maxRadius * 0.7), a.y + Math.sin(ang) * (a.maxRadius * 0.7));
                    ctx.stroke();
                }
            } else if (a.state === "active") {
                let fade = a.activeTimer / a.maxActive;
                ctx.globalAlpha = fade;
                let r = a.radius;
                let glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r);
                glow.addColorStop(0, "#ffffff");
                glow.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
                glow.addColorStop(0.6, "rgba(200, 200, 255, 0.4)");
                glow.addColorStop(1, "transparent");
                ctx.fillStyle = glow;
                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3 * fade;
                ctx.beginPath();
                ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // ★ ТИТАН-КУЛАК ★
        if (a.type === "titan_fist") {
            ctx.save();
            ctx.translate(a.x, a.y);
            
            if (a.state === "falling") {
                // Тень на земле
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.ellipse(0, 480 - a.y, a.size * 1.2, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                // Кулак
                ctx.shadowColor = "#ff4400";
                ctx.shadowBlur = 30;
                ctx.fillStyle = "#8B7355";
                ctx.beginPath();
                ctx.arc(0, 0, a.size, 0, Math.PI * 2);
                ctx.fill();
                // Пальцы
                ctx.fillStyle = "#a89070";
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.arc(i * a.size * 0.35, -a.size * 0.3, a.size * 0.2, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Контур
                ctx.strokeStyle = "#1a1008";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, a.size, 0, Math.PI * 2);
                ctx.stroke();
                // Свечение сверху
                let topGlow = ctx.createRadialGradient(0, -a.size * 0.4, 0, 0, -a.size * 0.4, a.size);
                topGlow.addColorStop(0, "rgba(255, 200, 100, 0.5)");
                topGlow.addColorStop(1, "transparent");
                ctx.fillStyle = topGlow;
                ctx.beginPath();
                ctx.arc(0, 0, a.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (a.state === "impact") {
                let p = 1 - a.impactTimer / 40;
                let r = a.size * 1.5 + 60 * p;
                let glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
                glow.addColorStop(0, "#ffffff");
                glow.addColorStop(0.3, "#ffcc00");
                glow.addColorStop(0.6, "#ff4400");
                glow.addColorStop(1, "transparent");
                ctx.globalAlpha = 1 - p;
                ctx.fillStyle = glow;
                ctx.shadowColor = "#ff2200";
                ctx.shadowBlur = 40;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            return;
        }

        // === ОБЫЧНЫЕ АТАКИ ===
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rotation || 0);

        if (a.type === "blade" || a.type === "big_blade") {
            if (a.hasHaki) {
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 5;
                ctx.shadowColor = "#000000";
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(0, -a.size - 4);
                ctx.lineTo(a.size * 0.4 + 3, 0);
                ctx.lineTo(0, a.size + 4);
                ctx.lineTo(-a.size * 0.4 - 3, 0);
                ctx.closePath();
                ctx.stroke();
            }
            ctx.fillStyle = a.hasHaki ? "#cc2222" : a.color;
            ctx.shadowColor = "#ff2222";
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
            if (a.hasHaki) {
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 6;
                ctx.shadowColor = "#000000";
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(0, 0, a.size + 4, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = a.hasHaki ? "#cc2222" : a.color;
            ctx.shadowColor = "#ff2222";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, a.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(0, 0, a.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(-a.size * 0.3, -a.size * 0.2, a.size * 0.12, 0, Math.PI * 2);
            ctx.arc(a.size * 0.3, -a.size * 0.2, a.size * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        if (a.hp !== undefined && a.hp < a.maxHp && a.hp > 0 && a.type !== "rock") {
            ctx.save();
            ctx.translate(a.x, a.y - a.size - 10);
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(-16, -8, 32, 12);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(a.hp + "/" + a.maxHp, 0, 2);
            ctx.restore();
        }
    }

    function drawRock(a) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rotation || 0);
        
        let s = a.size;
        let seed = a.textureSeed || 0;
        
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(0, s * 0.9, s * 1.0, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        let points = [];
        let sides = 7 + Math.floor(seed) % 3;
        for (let i = 0; i < sides; i++) {
            let ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
            let noise = Math.sin(seed + i * 1.7) * 0.15 + Math.cos(seed * 2 + i * 2.3) * 0.1;
            let r = s * (1 + noise);
            points.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
        }
        
        let grad = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s * 1.3);
        grad.addColorStop(0, "#a89070");
        grad.addColorStop(0.5, "#8B7355");
        grad.addColorStop(1, "#3a2818");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = "#1a1008";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = "rgba(40, 25, 15, 0.7)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            let ang1 = (seed + i * 1.3) % (Math.PI * 2);
            let ang2 = ang1 + 1.2 + Math.sin(seed + i) * 0.6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang1) * s * 0.2, Math.sin(ang1) * s * 0.2);
            ctx.lineTo(Math.cos(ang1) * s * 0.5 + Math.cos(ang2) * s * 0.15, Math.sin(ang1) * s * 0.5 + Math.sin(ang2) * s * 0.15);
            ctx.lineTo(Math.cos(ang2) * s * 0.85, Math.sin(ang2) * s * 0.85);
            ctx.stroke();
        }
        
        ctx.strokeStyle = "rgba(220, 200, 170, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(points[0].x * 0.9, points[0].y * 0.9);
        ctx.lineTo(points[1].x * 0.9, points[1].y * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(points[2].x * 0.85, points[2].y * 0.85);
        ctx.lineTo(points[3].x * 0.85, points[3].y * 0.85);
        ctx.stroke();
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.beginPath();
        ctx.arc(-s * 0.35, -s * 0.4, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.55, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "rgba(40, 25, 15, 0.4)";
        for (let i = 0; i < 8; i++) {
            let r = seed + i * 7.3;
            let px = Math.sin(r) * s * 0.6;
            let py = Math.cos(r * 1.3) * s * 0.6;
            ctx.beginPath();
            ctx.arc(px, py, 1 + Math.abs(Math.sin(r * 2)) * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    function drawTsunami(a) {
        ctx.save();
        
        let cx = a.x;
        let cy = a.y;
        let w = a.currentWidth || a.width;
        let h = a.currentHeight || a.height;
        let waveTime = a.waveTime;
        let fromLeft = a.fromLeft;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.ellipse(cx, 490, w * 1.5, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        
        let grad = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
        if (fromLeft) {
            grad.addColorStop(0, "#001a33");
            grad.addColorStop(0.4, "#0055aa");
            grad.addColorStop(0.7, "#0088dd");
            grad.addColorStop(1, "#aae5ff");
        } else {
            grad.addColorStop(0, "#aae5ff");
            grad.addColorStop(0.3, "#0088dd");
            grad.addColorStop(0.6, "#0055aa");
            grad.addColorStop(1, "#001a33");
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, cy + h / 2);
        
        let segments = 10;
        for (let i = 0; i <= segments; i++) {
            let t = i / segments;
            let x = cx - w / 2 + t * w;
            let topY = cy - h / 2 - Math.sin(t * Math.PI * 3 + waveTime * 2) * 12 - Math.sin(t * 8 + waveTime * 3) * 6;
            ctx.lineTo(x, topY);
        }
        
        ctx.lineTo(cx + w / 2, cy + h / 2);
        ctx.closePath();
        
        ctx.shadowColor = "#00aaff";
        ctx.shadowBlur = 25;
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        for (let li = 0; li < 3; li++) {
            let lineOffset = -h * 0.1 + li * h * 0.15;
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                let t = i / segments;
                let x = cx - w / 2 + 10 + t * (w - 20);
                let y = cy + lineOffset + Math.sin(t * Math.PI * 4 + waveTime * 2 + li) * 4;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i <= segments; i++) {
            let t = i / segments;
            let x = cx - w / 2 + t * w;
            let topY = cy - h / 2 - Math.sin(t * Math.PI * 3 + waveTime * 2) * 12 - Math.sin(t * 8 + waveTime * 3) * 6;
            let foamSize = 3 + Math.random() * 4;
            ctx.beginPath();
            ctx.arc(x, topY, foamSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.9;
        for (let i = 0; i < 8; i++) {
            let ang = (i / 8) * Math.PI * 2 + waveTime * 2;
            let dist = h * 0.5 + Math.sin(waveTime * 3 + i) * 15;
            let sx = cx + Math.cos(ang) * w * 0.3;
            let sy = cy + Math.sin(ang) * dist * 0.5;
            ctx.fillStyle = "rgba(255, 255, 255, " + (0.5 + Math.sin(waveTime * 4 + i) * 0.3) + ")";
            ctx.beginPath();
            ctx.arc(sx, sy, 2 + Math.abs(Math.sin(waveTime + i)) * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        ctx.save();
        ctx.strokeStyle = "#003366";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            let t = i / segments;
            let x = cx - w / 2 + t * w;
            let topY = cy - h / 2 - Math.sin(t * Math.PI * 3 + waveTime * 2) * 12 - Math.sin(t * 8 + waveTime * 3) * 6;
            if (i === 0) ctx.moveTo(x, topY);
            else ctx.lineTo(x, topY);
        }
        ctx.stroke();
        ctx.restore();
        
        ctx.restore();
    }

    window.startRogerWhitebeardFight = startRogerWhitebeardFight;
    window.stopRogerWhitebeardFight = stopRogerWhitebeardFight;

    window.updateRWBPlayer = updateRWBPlayer;
    window.updateRWBPlayerBullets = updateRWBPlayerBullets;
    window.getRWBPlayer = function() { return rwbPlayer; };
    window.getRWBBullets = function() { return rwbPlayerBullets; };
    window.getRWBAttacks = function() { return rwbAttacks; };
    window.getRWBKeys = function() { return rwbKeys; };
    window.getRWBTouch = function() { return { active: rwbTouchActive, x: rwbTouchX, y: rwbTouchY }; };
    window.rwbSound = rwbSound;

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║  🏴‍☠️ ROGER vs WHITEBEARD v6.0                              ║");
    console.log("║  ⚔️ ОРУЖИЕ + БРОНЯ работают                               ║");
    console.log("║  🎵 Музыка: Dark Souls                                     ║");
    console.log("║  🪨 Камнепад: 6 камней                                     ║");
    console.log("║  🌊 Цунами                                                 ║");
    console.log("║  ★ 2-я фаза: 3 УНИКАЛЬНЫЕ атаки на КАЖДОГО босса:        ║");
    console.log("║     РОДЖЕР: Рассечение / Крест / Адское пламя             ║");
    console.log("║     БЕЛОУС: Землетрясение / Гура-Гура / Титан-Кулак       ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

})();
