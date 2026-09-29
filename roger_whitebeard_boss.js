// ============================================================
// РОДЖЕР vs БЕЛОУС — БОСС 1000 ВОЛНЫ v7.0
// ============================================================
// ★ v7.0:
// - УБРАНЫ ТЯЖЁЛЫЕ ЭФФЕКТЫ (лагает)
// - БАЛАНС: Белоус стал проще (урон -30%, скорость -20%)
// - ФОН: тропический остров + море + закат
// - ХИТБОКСЫ: уменьшены, видны чётко
// - АТАКИ: контрастные, видны сразу
// ============================================================

(function() {
    'use strict';

    if (window._rogerWhitebeardLoaded) {
        console.warn("[ROGER-WB] Уже загружено.");
        return;
    }
    window._rogerWhitebeardLoaded = true;

    // ============================================================
    // ★★★ НАСТРОЙКИ БАЛАНСА (меняй тут) ★★★
    // ============================================================
    const BALANCE = {
        // Игрок
        playerHp: 300,           // было 250 → 300 (чуть больше выживаемости)
        playerDamageMult: 1.3,   // +30% урона игрока
        
        // Роджер
        rogerHp: 450,            // было 500
        rogerAttackRate: 75,     // было 60 (реже атакует)
        rogerDamageMult: 0.85,   // -15% урона
        
        // Белоус (СИЛЬНО ослаблен)
        whitebeardHp: 450,       // было 500
        whitebeardAttackRate: 95,// было 70 (реже атакует)
        whitebeardDamageMult: 0.7,// -30% урона
        
        // Супер-фаза
        superAttackRate: 80,     // было 55 (реже)
        superDuration: 1500,     // было 1800 сек (короче на 5 сек)
        
        // Хитбоксы (уменьшены)
        playerHitboxMult: 0.7,   // хитбокс игрока -30%
        
        // Скорость снарядов (медленнее = легче уклоняться)
        projectileSpeedMult: 0.85
    };

    window.rwbActive = false;

    let rwbState = "intro";
    let rwbTimer = 0;
    let rwbIntroTimer = 0;
    let rwbTransitionTimer = 0;
    let rwbEndTimer = 0;
    let rwbSurvivalTimer2 = 0;
    let rwbSurvivalTarget2 = BALANCE.superDuration;
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
                // ★ Используем предзагруженный трек если есть ★
                let src = RWB_MUSIC_PATH;
                if (typeof window.getLoadedMusic === 'function') {
                    let loaded = window.getLoadedMusic('rwb');
                    if (loaded && loaded.url) src = loaded.url;
                }
                rwbMusic = new Audio(src);
                rwbMusic.loop = true;
                rwbMusic.volume = 0.45;
                rwbMusic.onerror = function() {
                    console.warn("[ROGER-WB] Музыка не загружена");
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

    // ============================================================
    // ★★★ УМЕНЬШЕННЫЕ ЭФФЕКТЫ (для оптимизации) ★★★
    // ============================================================
    function spawnHakiLightning(x, y, count, isWhite) {
        // ★ Ограничиваем количество молний ★
        if (rwbHakiLightnings.length > 20) return;
        if (!count) count = 1;
        count = Math.min(count, 2); // максимум 2 за раз
        
        for (let i = 0; i < count; i++) {
            let ang = Math.random() * Math.PI * 2;
            let len = 20 + Math.random() * 35;
            let lightning = {
                x1: x, y1: y,
                x2: x + Math.cos(ang) * len,
                y2: y + Math.sin(ang) * len,
                points: [],
                life: 10, maxLife: 10,
                outerColor: "#000000",
                innerColor: isWhite ? "#ffffff" : "#ff2222",
                width: 2 + Math.random() * 1.5
            };
            let steps = 3;
            for (let s = 1; s < steps; s++) {
                let t = s / steps;
                lightning.points.push({
                    x: x + Math.cos(ang) * len * t + (Math.random() - 0.5) * 15,
                    y: y + Math.sin(ang) * len * t + (Math.random() - 0.5) * 15
                });
            }
            rwbHakiLightnings.push(lightning);
        }
    }

    function spawnWhiteCracks(bossX, bossY, count) {
        // ★ Трещины теперь рисуются как простые линии (быстро) ★
        if (!count) count = 3;
        count = Math.min(count, 4);
        for (let i = 0; i < count; i++) {
            let side = i % 2 === 0 ? -1 : 1;
            let startX = bossX + side * (25 + Math.random() * 15);
            let startY = bossY + (Math.random() - 0.5) * 50;
            
            rwbWhiteCracks.push({
                x: startX, y: startY,
                angle: (side === -1 ? Math.PI : 0) + (Math.random() - 0.5) * 0.5,
                length: 35 + Math.random() * 45,
                width: 2,
                life: 25, maxLife: 25,
                branches: []
            });
        }
    }

    function drawWhiteCracks() {
        if (!ctx || rwbWhiteCracks.length === 0) return;
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
            ctx.beginPath();
            ctx.moveTo(crack.x, crack.y);
            
            let cx = crack.x, cy = crack.y;
            let ang = crack.angle;
            let segLen = crack.length / 4;
            
            for (let s = 0; s < 4; s++) {
                ang += (Math.random() - 0.5) * 0.4;
                cx += Math.cos(ang) * segLen;
                cy += Math.sin(ang) * segLen;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    // ============================================================
    // ★★★ СТАРТ ★★★
    // ============================================================
    function startRogerWhitebeardFight() {
        if (window.rwbActive) return;

        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(1000)) {
            if (typeof showFloatingText === 'function') showFloatingText("⏭️ Босс 1000 волны уже побеждён!", "#ffaa00");
            return;
        }

        console.log("[ROGER-WB] Старт боя v7.0 (BALANCED)!");

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
            hp: BALANCE.rogerHp, maxHp: BALANCE.rogerHp,
            superForm: false,
            vx: 1.2, vy: 0.8, pulse: 0, rotation: 0,
            attackTimer: 60, hitFlash: 0,
            name: "РОДЖЕР", color: "#ff8800",
            homeX: 80, homeY: 120
        };
        whitebeard = {
            id: "whitebeard", x: 320, y: 120, size: 32,
            hp: BALANCE.whitebeardHp, maxHp: BALANCE.whitebeardHp,
            superForm: false,
            vx: -1.0, vy: 0.6, pulse: 0, rotation: 0,
            attackTimer: 90, hitFlash: 0,
            name: "БЕЛОУС", color: "#ffffff",
            homeX: 320, homeY: 120
        };

        duel = { phase: "idle", timer: 0, clashX: 200, clashY: 200, clashes: 0 };

        rwbPlayer = {
            x: 200, y: 420, size: 12,
            hp: BALANCE.playerHp, maxHp: BALANCE.playerHp,
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

        // ★ Генерируем фон-остров ★
        initIslandBackground();

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

    // ============================================================
    // ★★★ ФОН-ОСТРОВ (генерируем один раз) ★★★
    // ============================================================
    let islandBg = null;

    function initIslandBackground() {
        // ★ Генерируем облака и элементы фона ОДИН РАЗ ★
        islandBg = {
            clouds: [],
            birds: [],
            waveLines: []
        };
        
        // Облака
        for (let i = 0; i < 6; i++) {
            islandBg.clouds.push({
                x: Math.random() * 400,
                y: 40 + Math.random() * 100,
                size: 30 + Math.random() * 40,
                speed: 0.08 + Math.random() * 0.15,
                alpha: 0.3 + Math.random() * 0.3
            });
        }
        
        // Птицы
        for (let i = 0; i < 4; i++) {
            islandBg.birds.push({
                x: Math.random() * 400,
                y: 60 + Math.random() * 80,
                speed: 0.3 + Math.random() * 0.4,
                wingPhase: Math.random() * Math.PI * 2,
                size: 4 + Math.random() * 3
            });
        }
        
        // Волны (линии на море)
        for (let i = 0; i < 8; i++) {
            islandBg.waveLines.push({
                y: 320 + i * 8,
                offset: Math.random() * 100,
                speed: 0.15 + Math.random() * 0.2,
                length: 30 + Math.random() * 40
            });
        }
    }

    function drawIslandBackground() {
        if (!islandBg) initIslandBackground();
        
        // ★ НЕБО (градиент заката) ★
        let skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
        skyGrad.addColorStop(0, "#0d1b3d");      // тёмно-синий вверху
        skyGrad.addColorStop(0.3, "#2d2a5c");    // фиолетовый
        skyGrad.addColorStop(0.55, "#8b3a5c");   // малиновый
        skyGrad.addColorStop(0.75, "#e8794a");   // оранжевый
        skyGrad.addColorStop(0.9, "#f5af19");    // жёлто-оранжевый (закат)
        skyGrad.addColorStop(1, "#ffd97a");      // светлый у горизонта
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 400, 320);
        
        // ★ СОЛНЦЕ (у горизонта) ★
        ctx.save();
        let sunX = 300, sunY = 290;
        let sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 50);
        sunGrad.addColorStop(0, "#ffffff");
        sunGrad.addColorStop(0.2, "#fff4c4");
        sunGrad.addColorStop(0.5, "rgba(245, 175, 25, 0.8)");
        sunGrad.addColorStop(1, "rgba(245, 175, 25, 0)");
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
        ctx.fill();
        // Яркое ядро
        ctx.fillStyle = "#fff8dc";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // ★ ОБЛАКА ★
        if (islandBg) {
            for (let cloud of islandBg.clouds) {
                cloud.x += cloud.speed;
                if (cloud.x > 450) cloud.x = -50;
                
                ctx.save();
                ctx.globalAlpha = cloud.alpha;
                ctx.fillStyle = "rgba(255, 200, 150, 0.9)";
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.5, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.9, cloud.y, cloud.size * 0.55, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.4, cloud.y + cloud.size * 0.15, cloud.size * 0.45, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // ★ ПТИЦЫ ★
        if (islandBg) {
            for (let bird of islandBg.birds) {
                bird.x += bird.speed;
                bird.wingPhase += 0.15;
                if (bird.x > 450) bird.x = -50;
                
                ctx.save();
                ctx.strokeStyle = "rgba(30, 20, 40, 0.7)";
                ctx.lineWidth = 1.5;
                let wingOffset = Math.sin(bird.wingPhase) * 2;
                ctx.beginPath();
                ctx.moveTo(bird.x - bird.size, bird.y + wingOffset);
                ctx.quadraticCurveTo(bird.x, bird.y - bird.size * 0.5, bird.x + bird.size, bird.y + wingOffset);
                ctx.stroke();
                ctx.restore();
            }
        }
        
        // ★ МОРЕ (градиент) ★
        let seaGrad = ctx.createLinearGradient(0, 320, 0, 420);
        seaGrad.addColorStop(0, "#f5a623");      // светлая полоса у горизонта (отражение)
        seaGrad.addColorStop(0.3, "#3a6ea5");    // синяя вода
        seaGrad.addColorStop(0.7, "#1e3a5f");    // темнее
        seaGrad.addColorStop(1, "#0a1a2e");      // тёмное
        ctx.fillStyle = seaGrad;
        ctx.fillRect(0, 320, 400, 100);
        
        // ★ ОТРАЖЕНИЕ СОЛНЦА НА ВОДЕ ★
        ctx.save();
        ctx.globalAlpha = 0.5;
        let reflGrad = ctx.createRadialGradient(sunX, 330, 0, sunX, 360, 60);
        reflGrad.addColorStop(0, "rgba(255, 240, 200, 0.8)");
        reflGrad.addColorStop(1, "rgba(255, 200, 100, 0)");
        ctx.fillStyle = reflGrad;
        ctx.beginPath();
        ctx.ellipse(sunX, 340, 40, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // ★ ВОЛНЫ НА МОРЕ (горизонтальные линии) ★
        if (islandBg) {
            ctx.save();
            for (let wave of islandBg.waveLines) {
                wave.offset += wave.speed;
                if (wave.offset > 200) wave.offset = -100;
                
                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                ctx.lineWidth = 1.5;
                for (let x = wave.offset - 100; x < 450; x += 80) {
                    ctx.beginPath();
                    ctx.moveTo(x, wave.y);
                    ctx.quadraticCurveTo(x + wave.length * 0.5, wave.y - 2, x + wave.length, wave.y);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
        
        // ★ ЗЕМЛЯ / БЕРЕГ (низ экрана) ★
        let groundGrad = ctx.createLinearGradient(0, 420, 0, 500);
        groundGrad.addColorStop(0, "#d4a574");    // светлый песок
        groundGrad.addColorStop(0.5, "#a87a4a");  // песок темнее
        groundGrad.addColorStop(1, "#5a3a20");    // земля внизу
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 420, 400, 80);
        
        // ★ ПАЛЬМЫ (по бокам) ★
        drawPalmTree(30, 420, 1.0);
        drawPalmTree(370, 420, 0.9);
        
        // ★ КАМНИ НА БЕРЕГУ ★
        ctx.fillStyle = "#5a4530";
        ctx.beginPath();
        ctx.ellipse(150, 470, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4a3520";
        ctx.beginPath();
        ctx.ellipse(250, 485, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6a5540";
        ctx.beginPath();
        ctx.ellipse(80, 495, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ★ Трава / кустики ★
        ctx.strokeStyle = "#3a5a2a";
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            let gx = (i * 21) % 400;
            let gy = 430 + (i * 7) % 40;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx - 3, gy - 8);
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + 2, gy - 10);
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + 5, gy - 6);
            ctx.stroke();
        }
    }

    function drawPalmTree(x, baseY, scale) {
        ctx.save();
        ctx.translate(x, baseY);
        ctx.scale(scale, scale);
        
        // Ствол
        ctx.strokeStyle = "#4a2f1a";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-5, -40, 5, -90);
        ctx.stroke();
        
        // Листья
        ctx.fillStyle = "#2d5a2d";
        ctx.strokeStyle = "#1a3a1a";
        ctx.lineWidth = 1;
        
        let leafAngles = [-2.5, -2.0, -1.5, -1.0, -0.5, 0, 0.5];
        for (let ang of leafAngles) {
            ctx.save();
            ctx.translate(5, -90);
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.ellipse(25, 0, 25, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        
        // Кокосы
        ctx.fillStyle = "#3a2a10";
        ctx.beginPath();
        ctx.arc(0, -88, 3, 0, Math.PI * 2);
        ctx.arc(-4, -85, 3, 0, Math.PI * 2);
        ctx.arc(4, -85, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // ============================================================
    // ★★★ КНОПКА РЕЖИМА ★★★
    // ============================================================
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
    // ★★★ ИГРОК ★★★
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
        rwbPlayer.y = Math.max(350, Math.min(484, rwbPlayer.y)); // ★ Ограничиваем внизу (земля)
        if (rwbPlayer.invulnTimer > 0) rwbPlayer.invulnTimer--;

        if (rwbPlayer.attackTimer <= 0) {
            let weaponUsed = false;
            if (typeof window.firePlayerWeapon === 'function') {
                try {
                    let result = window.firePlayerWeapon(rwbPlayer.x, rwbPlayer.y, "normal", rwbPlayer.hp, rwbPlayer.maxHp);
                    if (result && result.bullets) {
                        rwbPlayer.attackTimer = result.rate || rwbPlayer.shootRate;
                        for (let i = 0; i < result.bullets.length; i++) {
                            let b = result.bullets[i];
                            // ★ Увеличиваем урон игрока ★
                            b.damage = Math.ceil(b.damage * BALANCE.playerDamageMult);
                            
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
                } catch(e) {}
            }
            
            if (!weaponUsed) {
                rwbPlayer.attackTimer = rwbPlayer.shootRate;
                let bulletColor = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ffdd00";
                rwbPlayerBullets.push({
                    x: rwbPlayer.x, y: rwbPlayer.y - 14,
                    vx: 0, vy: -11, size: 5, life: 90,
                    color: bulletColor,
                    isBlue: (rwbPlayer.attackMode === "blue"),
                    damage: (rwbPlayer.attackMode === "blue") ? 1 : 3
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
            if (duel.timer > 50) {
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
            if (duel.timer % 3 === 0) {
                rwbSpeedLines.push({
                    x: roger.x + (Math.random() - 0.5) * 20,
                    y: roger.y + (Math.random() - 0.5) * 20,
                    vx: -3, vy: 0, life: 12, maxLife: 12, color: "#ff8800"
                });
                rwbSpeedLines.push({
                    x: whitebeard.x + (Math.random() - 0.5) * 20,
                    y: whitebeard.y + (Math.random() - 0.5) * 20,
                    vx: 3, vy: 0, life: 12, maxLife: 12, color: "#ffffff"
                });
            }
            if (duel.timer > 25) { duel.phase = "clash"; duel.timer = 0; performClash(); }
        } else if (duel.phase === "clash") {
            roger.rotation += 0.15;
            whitebeard.rotation -= 0.15;
            if (duel.timer % 4 === 0) spawnClashParticles(duel.clashX, duel.clashY);
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

        // ★ Молнии реже (оптимизация) ★
        if (Math.random() < 0.08) {
            spawnHakiLightning(roger.x + (Math.random() - 0.5) * 40, roger.y + (Math.random() - 0.5) * 40, 1, false);
        }
        if (Math.random() < 0.08) {
            spawnHakiLightning(whitebeard.x + (Math.random() - 0.5) * 40, whitebeard.y + (Math.random() - 0.5) * 40, 1, false);
        }

        roger.attackTimer--;
        if (roger.attackTimer <= 0) {
            roger.attackTimer = BALANCE.rogerAttackRate + Math.random() * 30;
            spawnRogerAttack();
        }
        whitebeard.attackTimer--;
        if (whitebeard.attackTimer <= 0) {
            whitebeard.attackTimer = BALANCE.whitebeardAttackRate + Math.random() * 40;
            spawnWhitebeardAttack();
        }

        if (roger.hp <= 0) { roger.hp = 0; triggerSuper(whitebeard, roger); }
        else if (whitebeard.hp <= 0) { whitebeard.hp = 0; triggerSuper(roger, whitebeard); }
    }

    function performClash() {
        duel.clashes++;
        let dmg = 8 + Math.random() * 6; // ★ Меньше урона ★
        roger.hp = Math.max(0, roger.hp - dmg);
        whitebeard.hp = Math.max(0, whitebeard.hp - dmg);
        roger.hitFlash = 10;
        whitebeard.hitFlash = 10;

        rwbShake = 25;
        rwbScreenFlash = 20;
        rwbScreenFlashColor = "#000000";
        rwbHakiAura = 20;

        // ★ Меньше частиц ★
        for (let i = 0; i < 20; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 3 + Math.random() * 6;
            rwbParticles.push({
                x: duel.clashX, y: duel.clashY,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 30, maxLife: 30,
                color: i % 3 === 0 ? "#000000" : (i % 3 === 1 ? "#ff2222" : "#ffffff"),
                size: 2 + Math.random() * 3
            });
        }

        for (let i = 0; i < 8; i++) {
            spawnHakiLightning(duel.clashX, duel.clashY, 1, Math.random() > 0.7);
        }

        rwbShockwaves.push({
            x: duel.clashX, y: duel.clashY,
            radius: 10, maxRadius: 200, speed: 9,
            color: "#000000", damage: 0, hit: true,
            life: 28, maxLife: 28, width: 8
        });
        rwbShockwaves.push({
            x: duel.clashX, y: duel.clashY,
            radius: 5, maxRadius: 150, speed: 6,
            color: "#ff2222", damage: 0, hit: true,
            life: 25, maxLife: 25, width: 5
        });

        rwbSound(300, 'sawtooth', 0.4, 0.3);
    }

    function spawnClashParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 3 + Math.random() * 6;
            rwbParticles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 20, maxLife: 20,
                color: ["#000000", "#ff2222", "#ff8800", "#ffdd00"][Math.floor(Math.random() * 4)],
                size: 2 + Math.random() * 3
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
        spawnHakiLightning(roger.x, roger.y, 3, false);

        if (type === 0) {
            // Веер клинков
            let count = isSuper ? 7 : 5; // ★ Меньше снарядов ★
            for (let i = 0; i < count; i++) {
                let angle = Math.PI * 0.5 + (i - (count - 1) / 2) * 0.3;
                let speed = (isSuper ? 4.5 : 3.8) * BALANCE.projectileSpeedMult;
                rwbAttacks.push({
                    type: "blade", x: roger.x, y: roger.y + 30,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 10, hp: 2, maxHp: 2,
                    damage: Math.ceil((isSuper ? 14 : 10) * BALANCE.rogerDamageMult),
                    life: 250, color: "#ff8800",
                    rotation: angle + Math.PI * 0.5, rotSpeed: 0.15,
                    hasHaki: true
                });
            }
        } else if (type === 1) {
            // Двойной большой клинок
            let offsets = [-0.2, 0.2];
            for (let off of offsets) {
                let dx = rwbPlayer.x - roger.x;
                let dy = rwbPlayer.y - roger.y;
                let baseAng = Math.atan2(dy, dx);
                let ang = baseAng + off;
                let speed = (isSuper ? 5 : 4) * BALANCE.projectileSpeedMult;
                rwbAttacks.push({
                    type: "big_blade", x: roger.x, y: roger.y + 20,
                    vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
                    size: 15, hp: 3, maxHp: 3, // ★ Меньше размер ★
                    damage: Math.ceil((isSuper ? 22 : 16) * BALANCE.rogerDamageMult),
                    life: 250, color: "#ff6600",
                    rotation: ang + Math.PI * 0.5, rotSpeed: 0.2,
                    trail: [], hasHaki: true
                });
            }
        } else if (type === 2) {
            // Круговая волна
            let count = isSuper ? 8 : 6;
            for (let i = 0; i < count; i++) {
                let angle = (i / count) * Math.PI * 2;
                let speed = (isSuper ? 3.8 : 3.2) * BALANCE.projectileSpeedMult;
                rwbAttacks.push({
                    type: "blade", x: roger.x, y: roger.y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 9, hp: 2, maxHp: 2,
                    damage: Math.ceil((isSuper ? 10 : 8) * BALANCE.rogerDamageMult),
                    life: 250, color: "#ffaa00",
                    rotation: angle + Math.PI * 0.5, rotSpeed: 0.1,
                    hasHaki: true
                });
            }
        } else {
            // Спираль клинков
            let count = isSuper ? 8 : 6;
            for (let i = 0; i < count; i++) {
                let baseAng = (i / count) * Math.PI * 2.5;
                let delay = i * 5;
                (function(a, d, sup) {
                    setTimeout(function() {
                        if (!window.rwbActive || (rwbState !== "fight1" && rwbState !== "fight2")) return;
                        rwbAttacks.push({
                            type: "blade", x: roger.x, y: roger.y,
                            vx: Math.cos(a) * 3.5 * BALANCE.projectileSpeedMult, 
                            vy: Math.sin(a) * 3.5 * BALANCE.projectileSpeedMult,
                            size: 10, hp: 2, maxHp: 2,
                            damage: Math.ceil((sup ? 12 : 9) * BALANCE.rogerDamageMult),
                            life: 250, color: "#ffcc00",
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
        rwbSound(150, 'sine', 0.5, 0.2);
        spawnHakiLightning(whitebeard.x, whitebeard.y, 3, false);

        if (type === 0) {
            // КАМНЕПАД: 4 камня (было 6 — уменьшили)
            let count = 4;
            for (let i = 0; i < count; i++) {
                let cx = 50 + Math.random() * 300;
                rwbAttacks.push({
                    type: "rock",
                    x: cx, y: -40 - Math.random() * 30,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (isSuper ? 3.5 : 2.8) * BALANCE.projectileSpeedMult,
                    size: 16 + Math.random() * 5,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.06,
                    hp: 3, maxHp: 3,
                    damage: Math.ceil((isSuper ? 18 : 12) * BALANCE.whitebeardDamageMult),
                    life: 400, color: "#8B7355",
                    hasHaki: false,
                    textureSeed: Math.random() * 1000
                });
            }
            spawnWhiteCracks(whitebeard.x, whitebeard.y, 3);
            rwbSound(120, 'sawtooth', 0.5, 0.25);
        } else if (type === 1) {
            // Кольцо
            rwbShockwaves.push({
                x: whitebeard.x, y: whitebeard.y,
                radius: 10,
                maxRadius: isSuper ? 220 : 180,
                speed: (isSuper ? 4.5 : 3.5) * BALANCE.projectileSpeedMult,
                color: "#ffdd44",
                damage: Math.ceil((isSuper ? 16 : 12) * BALANCE.whitebeardDamageMult),
                hit: false, hp: 6, maxHp: 6,
                canDestroy: true,
                life: 150, maxLife: 150, width: 14
            });
        } else if (type === 2) {
            // Кулак
            let dx = rwbPlayer.x - whitebeard.x;
            let dy = rwbPlayer.y - whitebeard.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            let speed = (isSuper ? 5 : 4) * BALANCE.projectileSpeedMult;
            rwbAttacks.push({
                type: "fist",
                x: whitebeard.x, y: whitebeard.y + 20,
                vx: (dx / len) * speed, vy: (dy / len) * speed,
                size: 16, hp: 4, maxHp: 4,
                damage: Math.ceil((isSuper ? 22 : 16) * BALANCE.whitebeardDamageMult),
                life: 250, color: "#ffffff",
                rotation: 0, rotSpeed: 0,
                trail: [], hasHaki: true
            });
        } else {
            spawnTsunamiAttack(isSuper);
        }
    }

    // ============================================================
    // ★★★ ЦУНАМИ (уменьшено) ★★★
    // ============================================================
    function spawnTsunamiAttack(isSuper) {
        let fromLeft = Math.random() > 0.5;
        let startX = fromLeft ? -80 : 480;
        let speed = (isSuper ? 2.5 : 1.8) * BALANCE.projectileSpeedMult;
        let waveHeight = isSuper ? 160 : 130;
        
        rwbAttacks.push({
            type: "tsunami",
            x: startX, y: 380, // ★ Ближе к земле (легче перепрыгнуть)
            vx: fromLeft ? speed : -speed,
            vy: 0,
            width: isSuper ? 70 : 55,
            height: waveHeight,
            currentWidth: isSuper ? 70 : 55,
            currentHeight: waveHeight,
            damage: Math.ceil((isSuper ? 22 : 16) * BALANCE.whitebeardDamageMult),
            life: 400,
            fromLeft: fromLeft,
            waveTime: 0,
            hit: false,
            color: "#0099ff"
        });
        
        rwbSound(80, 'sine', 1.0, 0.25);
        
        rwbFloatingTexts.push({
            x: fromLeft ? 40 : 360,
            y: 380,
            text: "🌊",
            color: "#00ccff",
            life: 70, maxLife: 70,
            vy: 0, vx: 0, size: 26
        });
    }

    // ============================================================
    // ★★★ 2-Я ФАЗА: УНИКАЛЬНЫЕ АТАКИ (оптимизировано) ★★★
    // ============================================================
    function spawnRogerSuperAttack() {
        let attackId = Math.floor(Math.random() * 3);
        rwbSound(600, 'sawtooth', 0.4, 0.2);
        spawnHakiLightning(roger.x, roger.y, 5, false);

        if (attackId === 0) spawnRogerCrossSlash();
        else if (attackId === 1) spawnRogerCrossStrike();
        else spawnRogerHellFire();
    }

    function spawnRogerCrossSlash() {
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "⚡ РАССЕЧЕНИЕ ⚡",
            color: "#ff4400",
            life: 70, maxLife: 70,
            vy: -0.3, vx: 0, size: 20
        });
        
        rwbSound(200, 'sawtooth', 0.6, 0.3);
        
        let slashX = 100 + Math.random() * 200;
        rwbAttacks.push({
            type: "roger_slash",
            x: slashX, y: 0,
            width: 50, // ★ Меньше (было 60) ★
            warningTimer: 70,
            activeTimer: 0,
            maxActive: 25,
            damage: Math.ceil(25 * BALANCE.rogerDamageMult),
            hit: false,
            state: "warning",
            color: "#ff4400"
        });
        
        rwbShake = 15;
    }

    function spawnRogerCrossStrike() {
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "❌ КРЕСТ ❌",
            color: "#ff6600",
            life: 70, maxLife: 70,
            vy: -0.3, vx: 0, size: 20
        });
        
        rwbSound(300, 'square', 0.5, 0.3);
        
        let cx = 130 + Math.random() * 140;
        let cy = 180 + Math.random() * 120;
        
        // ★ 2 линии вместо 4 (упрощено) ★
        rwbAttacks.push({
            type: "roger_cross",
            x: cx, y: cy,
            dir: "vertical",
            length: 400, width: 35,
            warningTimer: 60, activeTimer: 0, maxActive: 22,
            damage: Math.ceil(22 * BALANCE.rogerDamageMult),
            hit: false, state: "warning",
            color: "#ff8800"
        });
        
        rwbAttacks.push({
            type: "roger_cross",
            x: cx, y: cy,
            dir: "horizontal",
            length: 400, width: 35,
            warningTimer: 60, activeTimer: 0, maxActive: 22,
            damage: Math.ceil(22 * BALANCE.rogerDamageMult),
            hit: false, state: "warning",
            color: "#ff8800"
        });
        
        rwbShake = 18;
    }

    function spawnRogerHellFire() {
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "🔥 ПЛАМЯ 🔥",
            color: "#ff2200",
            life: 70, maxLife: 70,
            vy: -0.3, vx: 0, size: 20
        });
        
        rwbSound(150, 'sawtooth', 0.5, 0.3);
        
        rwbAttacks.push({
            type: "hell_fire",
            x: roger.x, y: roger.y + 20,
            targetX: rwbPlayer.x,
            targetY: rwbPlayer.y,
            vx: 0, vy: 0,
            speed: 3.5 * BALANCE.projectileSpeedMult,
            size: 25,
            hp: 5, maxHp: 5,
            damage: Math.ceil(20 * BALANCE.rogerDamageMult),
            life: 300,
            state: "flying",
            flyTimer: 0,
            explosionTimer: 0,
            color: "#ff3300"
        });
    }

    function spawnWhitebeardSuperAttack() {
        let attackId = Math.floor(Math.random() * 3);
        rwbSound(120, 'sawtooth', 0.4, 0.25);
        spawnHakiLightning(whitebeard.x, whitebeard.y, 5, false);

        if (attackId === 0) spawnWhitebeardEarthquake();
        else if (attackId === 1) spawnWhitebeardGuraGura();
        else spawnWhitebeardTitanFist();
    }

    function spawnWhitebeardEarthquake() {
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "🌋 ЗЕМЛЕТРЯСЕНИЕ 🌋",
            color: "#8B7355",
            life: 70, maxLife: 70,
            vy: -0.3, vx: 0, size: 18
        });
        
        rwbSound(60, 'sawtooth', 1.0, 0.3);
        rwbShake = 25;
        
        // ★ 5 камней (было 8) ★
        for (let i = 0; i < 5; i++) {
            let cx = 40 + Math.random() * 320;
            rwbAttacks.push({
                type: "rock",
                x: cx, y: -40 - Math.random() * 50,
                vx: (Math.random() - 0.5) * 1.2,
                vy: 2.5 + Math.random() * 1.5,
                size: 16 + Math.random() * 8,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.1,
                hp: 3, maxHp: 3,
                damage: Math.ceil(15 * BALANCE.whitebeardDamageMult),
                life: 400, color: "#8B7355",
                hasHaki: false,
                textureSeed: Math.random() * 1000
            });
        }
        
        spawnWhiteCracks(whitebeard.x, whitebeard.y, 4);
        
        // ★ Тряска короткая (1 сек вместо 2) ★
        let shakeInterval = setInterval(function() {
            if (!window.rwbActive || rwbState !== "fight2") { clearInterval(shakeInterval); return; }
            rwbShake = Math.max(rwbShake, 12);
        }, 100);
        setTimeout(function() { clearInterval(shakeInterval); }, 1000);
    }

    function spawnWhitebeardGuraGura() {
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "💥 ГУРА-ГУРА 💥",
            color: "#ffffff",
            life: 70, maxLife: 70,
            vy: -0.3, vx: 0, size: 20
        });
        
        rwbSound(200, 'sawtooth', 0.5, 0.3);
        
        // ★ 3 разлома вместо 5 ★
        let crackCount = 3;
        for (let i = 0; i < crackCount; i++) {
            let rx = 60 + Math.random() * 280;
            let ry = 120 + Math.random() * 280;
            rwbAttacks.push({
                type: "gura_crack",
                x: rx, y: ry,
                radius: 10,
                maxRadius: 70, // ★ Меньше радиус ★
                damage: Math.ceil(20 * BALANCE.whitebeardDamageMult),
                life: 200,
                state: "warning",
                warningTimer: 90 + i * 20,
                activeTimer: 0,
                maxActive: 20,
                hit: false,
                color: "#ffffff"
            });
        }
        
        rwbShake = 20;
    }

    function spawnWhitebeardTitanFist() {
        rwbFloatingTexts.push({
            x: 200, y: 100,
            text: "👊 ТИТАН-КУЛАК 👊",
            color: "#ffdd00",
            life: 70, maxLife: 70,
            vy: -0.3, vx: 0, size: 18
        });
        
        rwbSound(80, 'sawtooth', 0.8, 0.35);
        rwbShake = 25;
        
        let fistX = 120 + Math.random() * 160;
        rwbAttacks.push({
            type: "titan_fist",
            x: fistX, y: -120,
            vy: 3.0,
            size: 65, // ★ Меньше (было 90) ★
            damage: Math.ceil(30 * BALANCE.whitebeardDamageMult),
            life: 300,
            state: "falling",
            hit: false,
            color: "#8B7355"
        });
        
        // ★ 2 осколка вместо 4 ★
        for (let i = 0; i < 2; i++) {
            let cx = 40 + Math.random() * 320;
            rwbAttacks.push({
                type: "rock",
                x: cx, y: -40 - Math.random() * 30,
                vx: (Math.random() - 0.5) * 0.6,
                vy: 3.0 + Math.random() * 1.0,
                size: 12 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.08,
                hp: 2, maxHp: 2,
                damage: Math.ceil(10 * BALANCE.whitebeardDamageMult),
                life: 350, color: "#8B7355",
                hasHaki: false,
                textureSeed: Math.random() * 1000
            });
        }
    }

    // ============================================================
    // СУПЕР
    // ============================================================
    function triggerSuper(winner, loser) {
        console.log("[ROGER-WB] СУПЕР:", winner.name);
        rwbState = "transition";
        rwbTransitionTimer = 0;
        winner.superForm = true;
        winner.hp = winner.maxHp;
        winner.size *= 1.3;
        rwbActiveBoss = winner;

        if (loser === roger) roger = null;
        if (loser === whitebeard) whitebeard = null;

        rwbAttacks = [];
        rwbShockwaves = [];

        rwbScreenFlash = 40;
        rwbScreenFlashColor = "#000000";
        rwbShake = 35;
        rwbHakiAura = 40;

        // ★ Меньше частиц ★
        for (let i = 0; i < 40; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 4 + Math.random() * 8;
            rwbParticles.push({
                x: 200, y: 250,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 40, maxLife: 40,
                color: i % 3 === 0 ? "#000000" : (i % 3 === 1 ? "#ff2222" : "#ffffff"),
                size: 3 + Math.random() * 4
            });
        }

        for (let i = 0; i < 15; i++) {
            spawnHakiLightning(200 + (Math.random() - 0.5) * 150, 250 + (Math.random() - 0.5) * 150, 1, Math.random() > 0.6);
        }

        rwbSound(300, 'sawtooth', 0.8, 0.35);
    }

    // ============================================================
    // ОБНОВЛЕНИЕ АТАК
    // ============================================================
    function updateRWBAttacks() {
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            let a = rwbAttacks[i];
            
            // ЦУНАМИ
            if (a.type === "tsunami") {
                a.waveTime += 0.06;
                a.x += a.vx;
                a.life--;
                
                a.currentHeight = a.height * (1 + Math.sin(a.waveTime) * 0.08);
                a.currentWidth = a.width * (1 + Math.cos(a.waveTime * 1.3) * 0.05);
                
                if (Math.random() < 0.2) {
                    rwbParticles.push({
                        x: a.x + (Math.random() - 0.5) * a.currentWidth,
                        y: a.y + (Math.random() - 0.5) * a.currentHeight,
                        vx: a.fromLeft ? -1 : 1,
                        vy: (Math.random() - 0.5) * 2,
                        life: 20, maxLife: 20,
                        color: Math.random() > 0.5 ? "#ffffff" : "#88ddff",
                        size: 1.5
                    });
                }
                
                if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                    // ★ УМЕНЬШЕННЫЙ ХИТБОКС ★
                    let dx = Math.abs(rwbPlayer.x - a.x);
                    let dy = Math.abs(rwbPlayer.y - a.y);
                    let hbX = a.currentWidth / 2 * 0.6; // было 1.0 → 0.6
                    let hbY = a.currentHeight / 2 * 0.7;
                    if (dx < hbX + 4 && dy < hbY + 4) {
                        a.hit = true;
                        hitPlayer(a.damage);
                    }
                }
                
                if (a.x < -150 || a.x > 550 || a.life <= 0) {
                    rwbAttacks.splice(i, 1);
                }
                continue;
            }

            // КАМЕНЬ
            if (a.type === "rock") {
                a.x += a.vx;
                a.y += a.vy;
                a.rotation += a.rotSpeed;
                a.life--;
                
                if (Math.random() < 0.15) {
                    rwbParticles.push({
                        x: a.x + (Math.random() - 0.5) * a.size,
                        y: a.y - a.size * 0.5,
                        vx: (Math.random() - 0.5) * 1,
                        vy: -0.5 - Math.random() * 1,
                        life: 12, maxLife: 12,
                        color: "#5a4030", size: 1.5
                    });
                }
                
                if (rwbPlayer.invulnTimer <= 0) {
                    // ★ УМЕНЬШЕННЫЙ ХИТБОКС ★
                    let dx = rwbPlayer.x - a.x;
                    let dy = rwbPlayer.y - a.y;
                    let hb = a.size * 0.75 * BALANCE.playerHitboxMult + 4;
                    if (Math.sqrt(dx * dx + dy * dy) < hb) {
                        hitPlayer(a.damage);
                        spawnRockSmash(a.x, a.y, a.size);
                        rwbAttacks.splice(i, 1);
                        continue;
                    }
                }
                
                if (a.y > 500 || a.life <= 0) {
                    spawnRockSmash(a.x, 480, a.size);
                    rwbAttacks.splice(i, 1);
                    continue;
                }
                continue;
            }

            // РАССЕЧЕНИЕ
            if (a.type === "roger_slash") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) {
                        a.state = "active";
                        a.activeTimer = a.maxActive;
                        rwbShake = 20;
                        rwbSound(150, 'sawtooth', 0.6, 0.4);
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        // ★ УМЕНЬШЕННЫЙ ХИТБОКС ★
                        if (Math.abs(rwbPlayer.x - a.x) < a.width / 2 * 0.7 + 4) {
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

            // КРЕСТ
            if (a.type === "roger_cross") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) {
                        a.state = "active";
                        a.activeTimer = a.maxActive;
                        rwbShake = 18;
                        rwbSound(300, 'sawtooth', 0.4, 0.35);
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x;
                        let dy = rwbPlayer.y - a.y;
                        let hit = false;
                        // ★ УМЕНЬШЕННЫЙ ХИТБОКС ★
                        let hb = a.width / 2 * 0.7 + 4;
                        if (a.dir === "vertical") hit = Math.abs(dx) < hb;
                        else if (a.dir === "horizontal") hit = Math.abs(dy) < hb;
                        
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

            // АДСКОЕ ПЛАМЯ
            if (a.type === "hell_fire") {
                if (a.state === "flying") {
                    a.flyTimer++;
                    let dx = a.targetX - a.x;
                    let dy = a.targetY - a.y;
                    let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    if (dist < a.speed) {
                        a.state = "exploding";
                        a.explosionTimer = 50;
                        a.x = a.targetX;
                        a.y = a.targetY;
                        rwbShake = 25;
                        rwbSound(80, 'sawtooth', 0.8, 0.4);
                        
                        // ★ 8 осколков (было 12) ★
                        for (let j = 0; j < 8; j++) {
                            let ang = (j / 8) * Math.PI * 2;
                            rwbAttacks.push({
                                type: "fire_piece",
                                x: a.x, y: a.y,
                                vx: Math.cos(ang) * 2.5,
                                vy: Math.sin(ang) * 2.5,
                                size: 7,
                                damage: Math.ceil(12 * BALANCE.rogerDamageMult),
                                life: 120,
                                color: "#ff4400"
                            });
                        }
                    } else {
                        a.x += (dx / dist) * a.speed;
                        a.y += (dy / dist) * a.speed;
                    }
                    
                    if (Math.random() < 0.3) {
                        rwbParticles.push({
                            x: a.x + (Math.random() - 0.5) * a.size,
                            y: a.y + (Math.random() - 0.5) * a.size,
                            vx: 0, vy: -1,
                            life: 20, maxLife: 20,
                            color: Math.random() > 0.5 ? "#ff4400" : "#ffcc00",
                            size: 2
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

            // ОСКОЛКИ ОГНЯ
            if (a.type === "fire_piece") {
                a.x += a.vx;
                a.y += a.vy;
                a.life--;
                
                if (rwbPlayer.invulnTimer <= 0) {
                    // ★ УМЕНЬШЕННЫЙ ХИТБОКС ★
                    let dx = rwbPlayer.x - a.x;
                    let dy = rwbPlayer.y - a.y;
                    let hb = a.size * 0.7 * BALANCE.playerHitboxMult + 3;
                    if (Math.sqrt(dx*dx + dy*dy) < hb) {
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

            // ГУРА-ГУРА
            if (a.type === "gura_crack") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) {
                        a.state = "active";
                        a.activeTimer = a.maxActive;
                        rwbShake = 18;
                        rwbSound(300, 'square', 0.3, 0.35);
                        
                        for (let j = 0; j < 12; j++) {
                            let ang = (j / 12) * Math.PI * 2;
                            rwbParticles.push({
                                x: a.x, y: a.y,
                                vx: Math.cos(ang) * 5,
                                vy: Math.sin(ang) * 5,
                                life: 22, maxLife: 22,
                                color: "#ffffff", size: 2
                            });
                        }
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    a.radius = a.maxRadius * (1 - a.activeTimer / a.maxActive);
                    
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x;
                        let dy = rwbPlayer.y - a.y;
                        // ★ УМЕНЬШЕННЫЙ ХИТБОКС (внутри кольца) ★
                        if (Math.sqrt(dx*dx + dy*dy) < a.radius * 0.85 + 4) {
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

            // ТИТАН-КУЛАК
            if (a.type === "titan_fist") {
                if (a.state === "falling") {
                    a.y += a.vy;
                    a.life--;
                    
                    if (Math.random() < 0.3) {
                        rwbParticles.push({
                            x: a.x + (Math.random() - 0.5) * a.size,
                            y: a.y + a.size * 0.5,
                            vx: (Math.random() - 0.5) * 2,
                            vy: -1,
                            life: 20, maxLife: 20,
                            color: Math.random() > 0.5 ? "#ff6600" : "#ffaa00",
                            size: 2
                        });
                    }
                    
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x;
                        let dy = rwbPlayer.y - a.y;
                        // ★ УМЕНЬШЕННЫЙ ХИТБОКС ★
                        let hb = a.size * 0.7 * BALANCE.playerHitboxMult + 4;
                        if (Math.sqrt(dx*dx + dy*dy) < hb) {
                            a.hit = true;
                            hitPlayer(a.damage);
                        }
                    }
                    
                    if (a.y > 380) {
                        a.state = "impact";
                        a.impactTimer = 30;
                        rwbShake = 35;
                        rwbSound(40, 'sawtooth', 1.0, 0.5);
                        
                        // ★ 10 камней вместо 20 ★
                        for (let j = 0; j < 10; j++) {
                            let ang = (j / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                            rwbAttacks.push({
                                type: "rock",
                                x: a.x, y: a.y,
                                vx: Math.cos(ang) * 3,
                                vy: Math.sin(ang) * 3 - 1.5,
                                size: 10 + Math.random() * 6,
                                rotation: Math.random() * Math.PI * 2,
                                rotSpeed: (Math.random() - 0.5) * 0.15,
                                hp: 1, maxHp: 1,
                                damage: Math.ceil(10 * BALANCE.whitebeardDamageMult),
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

            // ОСТАЛЬНЫЕ АТАКИ
            a.x += a.vx; a.y += a.vy;
            a.rotation += a.rotSpeed || 0;
            a.life--;

            if (a.trail) {
                a.trail.push({ x: a.x, y: a.y, life: 10 });
                if (a.trail.length > 4) a.trail.shift(); // ★ Меньше трейла ★
            }

            if (a.hasHaki && Math.random() < 0.04) {
                spawnHakiLightning(a.x, a.y, 1, false);
            }

            if (rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                // ★ УМЕНЬШЕННЫЙ ХИТБОКС ★
                let hb = a.size * 0.75 * BALANCE.playerHitboxMult + 4;
                if (Math.sqrt(dx * dx + dy * dy) < hb) {
                    hitPlayer(a.damage);
                    rwbAttacks.splice(i, 1);
                    continue;
                }
            }

            if (a.life <= 0 || a.y > 520 || a.x < -60 || a.x > 460 || a.y < -150) {
                rwbAttacks.splice(i, 1);
            }
        }

        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            let sw = rwbShockwaves[i];
            sw.radius += sw.speed;
            sw.life--;

            if (sw.canDestroy && !sw.hit && rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - sw.x, dy = rwbPlayer.y - sw.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                // ★ УМЕНЬШЕННЫЙ ХИТБОКС КОЛЬЦА ★
                if (Math.abs(dist - sw.radius) < sw.width * 0.7 + 4) {
                    sw.hit = true;
                    hitPlayer(sw.damage);
                }
            }
            if (sw.life <= 0 || sw.radius > sw.maxRadius) rwbShockwaves.splice(i, 1);
        }
    }

    function spawnRockSmash(x, y, size) {
        rwbShake = 8;
        rwbSound(80, 'sawtooth', 0.3, 0.25);
        for (let i = 0; i < 10; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 2 + Math.random() * 4;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 1.5,
                life: 22, maxLife: 22,
                color: Math.random() > 0.5 ? "#8B7355" : "#5a4030",
                size: 2 + Math.random() * 2
            });
        }
    }

    // ============================================================
    // ПУЛИ
    // ============================================================
    function updateRWBPlayerBullets() {
        for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
            let b = rwbPlayerBullets[i];
            b.x += b.vx; b.y += b.vy; b.life--;
            let destroyed = false;

            if (b.isBlue) {
                for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                    let a = rwbAttacks[j];
                    // Не сбиваем "неуязвимые" атаки
                    if (a.type === "tsunami" || a.type === "titan_fist" || 
                        a.type === "roger_slash" || a.type === "roger_cross" || a.type === "gura_crack" ||
                        a.type === "hell_fire") continue;
                    
                    let dx = b.x - a.x, dy = b.y - a.y;
                    let aSize = a.size || 20;
                    // ★ УМЕНЬШЕННЫЙ ХИТБОКС СНАРЯДОВ ★
                    if (Math.sqrt(dx * dx + dy * dy) < aSize * 0.7 + b.size + 4) {
                        if (a.hp !== undefined) a.hp -= 1;
                        else a.hp = 1;
                        spawnHitParticles(b.x, b.y, "#00aaff", 3);
                        rwbSound(1200, 'square', 0.05, 0.08);
                        if (a.hp <= 0) {
                            spawnDestroyParticles(a.x, a.y, a.color || "#ffffff");
                            rwbSound(600, 'square', 0.12, 0.15);
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
                        if (Math.abs(dist - sw.radius) < sw.width * 0.7 + b.size) {
                            sw.hp -= 1;
                            spawnHitParticles(b.x, b.y, "#00aaff", 3);
                            if (sw.hp <= 0) {
                                spawnDestroyParticles(b.x, b.y, sw.color);
                                rwbShockwaves.splice(j, 1);
                            }
                            destroyed = true;
                            break;
                        }
                    }
                }
            } else {
                let targets = [];
                if (rwbState === "fight1") {
                    if (roger) targets.push(roger);
                    if (whitebeard) targets.push(whitebeard);
                } else if (rwbState === "fight2" && rwbActiveBoss) {
                    targets.push(rwbActiveBoss);
                }
                for (let boss of targets) {
                    let dx = b.x - boss.x, dy = b.y - boss.y;
                    // ★ УМЕНЬШЕННЫЙ ХИТБОКС БОССА ★
                    if (Math.sqrt(dx * dx + dy * dy) < boss.size * 0.75 + b.size) {
                        let dmg = b.damage;
                        if (typeof window.applyArmorToBossDamage === 'function') {
                            let result = window.applyArmorToBossDamage(dmg);
                            if (result.blocked) {
                                spawnHitParticles(b.x, b.y, "#9b59b6", 6);
                                destroyed = true;
                                break;
                            }
                            dmg = result.dmg;
                        }
                        
                        boss.hp = Math.max(0, boss.hp - dmg);
                        boss.hitFlash = 4;
                        spawnHitParticles(b.x, b.y, b.color, 4);
                        spawnHakiLightning(b.x, b.y, 1, false);
                        rwbSound(1400, 'square', 0.04, 0.06);
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
        
        if (typeof window.applyArmorToBossDamage === 'function') {
            let result = window.applyArmorToBossDamage(dmg);
            if (result.blocked) return;
            dmg = result.dmg;
        }
        
        rwbPlayer.hp -= dmg;
        rwbPlayer.invulnTimer = 55; // ★ Больше неуязвимости (было 40) ★
        rwbShake = 10;
        rwbScreenFlash = 6;
        rwbScreenFlashColor = "#ff0000";
        rwbSound(60, 'sawtooth', 0.4, 0.25);

        let hpEl = document.getElementById("arenaHP");
        if (hpEl) hpEl.innerText = Math.max(0, rwbPlayer.hp);

        for (let p = 0; p < 12; p++) {
            let ang = Math.random() * Math.PI * 2;
            rwbParticles.push({
                x: rwbPlayer.x, y: rwbPlayer.y,
                vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5,
                life: 20, maxLife: 20,
                color: "#ff3333", size: 2 + Math.random() * 2
            });
        }

        if (rwbPlayer.hp <= 0) rwbDefeat();
    }

    function spawnHitParticles(x, y, color, count) {
        if (!count) count = 6;
        for (let i = 0; i < count; i++) {
            let ang = Math.random() * Math.PI * 2;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3,
                life: 15, maxLife: 15,
                color: color, size: 2
            });
        }
    }

    function spawnDestroyParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            let ang = Math.random() * Math.PI * 2;
            let spd = 2 + Math.random() * 5;
            rwbParticles.push({
                x: x, y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 1,
                life: 22, maxLife: 22,
                color: i % 2 === 0 ? "#ff2222" : color,
                size: 2
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
        rwbSound(500, 'sine', 0.8, 0.25);
        setTimeout(function() { rwbSound(700, 'sine', 0.8, 0.25); }, 250);
        setTimeout(function() { rwbSound(1000, 'sine', 1.2, 0.3); }, 500);
    }

    function rwbDefeat() {
        if (rwbState === "defeat") return;
        rwbState = "defeat";
        rwbEndTimer = 0;
        hideRWBModeButton();
        rwbSound(40, 'sawtooth', 1.5, 0.35);
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

    // ============================================================
    // РЕНДЕР-ЛУП
    // ============================================================
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
            if (rwbTransitionTimer > 100) { rwbState = "fight2"; rwbSurvivalTimer2 = 0; }
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

        // ★ Обновление частиц (оптимизировано) ★
        for (let i = rwbParticles.length - 1; i >= 0; i--) {
            let p = rwbParticles[i];
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.94; p.vy *= 0.94;
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

        // ★★★ РИСУЕМ ОСТРОВ ★★★
        drawIslandBackground();

        // Тёмная полоса для читаемости
        if (rwbHakiAura > 0) {
            ctx.save();
            ctx.globalAlpha = rwbHakiAura / 100;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 400, 500);
            ctx.restore();
        }

        if (rwbScreenFlash > 0) {
            ctx.globalAlpha = rwbScreenFlash / 30;
            ctx.fillStyle = rwbScreenFlashColor;
            ctx.fillRect(0, 0, 400, 500);
            ctx.globalAlpha = 1;
        }

        // Рамка
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, 396, 496);

        for (let i = 0; i < rwbSpeedLines.length; i++) {
            let s = rwbSpeedLines[i];
            ctx.save();
            ctx.globalAlpha = s.life / s.maxLife * 0.6;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 2;
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

        // Кольца
        for (let i = 0; i < rwbShockwaves.length; i++) {
            let sw = rwbShockwaves[i];
            let p = sw.life / sw.maxLife;
            ctx.save();
            ctx.globalAlpha = p * 0.95;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.width * p;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        for (let i = 0; i < rwbAttacks.length; i++) drawAttack(rwbAttacks[i]);

        // Пули
        for (let i = 0; i < rwbPlayerBullets.length; i++) {
            let b = rwbPlayerBullets[i];
            ctx.save();
            let grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 1.5);
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.5, b.color);
            grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (rwbState === "fight1" || rwbState === "fight2") drawRWBPlayer();

        // Частицы
        for (let i = 0; i < rwbParticles.length; i++) {
            let p = rwbParticles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Молнии
        for (let i = 0; i < rwbHakiLightnings.length; i++) {
            let h = rwbHakiLightnings[i];
            let alpha = h.life / h.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = h.outerColor;
            ctx.lineWidth = h.width + 1.5;
            ctx.beginPath();
            ctx.moveTo(h.x1, h.y1);
            for (let p = 0; p < h.points.length; p++) ctx.lineTo(h.points[p].x, h.points[p].y);
            ctx.lineTo(h.x2, h.y2);
            ctx.stroke();
            ctx.strokeStyle = h.innerColor;
            ctx.lineWidth = h.width;
            ctx.stroke();
            ctx.restore();
        }

        // Тексты
        for (let i = 0; i < rwbFloatingTexts.length; i++) {
            let t = rwbFloatingTexts[i];
            ctx.save();
            ctx.globalAlpha = Math.min(1, t.life / 30);
            ctx.font = "bold " + (t.size || 16) + "px Impact, Arial Black, sans-serif";
            ctx.textAlign = "center";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

        // HP бары
        if (rwbState === "fight1" || rwbState === "transition") {
            drawHpBar(6, 4, 190, 14, roger ? roger.hp : 0, BALANCE.rogerHp, "#ff8800", "🔥 РОДЖЕР", false);
            drawHpBar(204, 4, 190, 14, whitebeard ? whitebeard.hp : 0, BALANCE.whitebeardHp, "#ffffff", "❄️ БЕЛОУС", true);
        } else if (rwbState === "fight2" && rwbActiveBoss) {
            let boss = rwbActiveBoss;
            let barColor = (boss.id === "roger") ? "#ff8800" : "#ffffff";
            let barName = (boss.id === "roger") ? "🔥 РОДЖЕР [СУПЕР]" : "❄️ БЕЛОУС [СУПЕР]";
            drawHpBar(6, 4, 388, 16, boss.hp, boss.maxHp, barColor, barName);
        }

        if (rwbState === "fight1" || rwbState === "fight2") {
            drawHpBar(6, 478, 388, 14, rwbPlayer.hp, rwbPlayer.maxHp, rwbPlayer.hp > rwbPlayer.maxHp * 0.3 ? "#00ff66" : "#ff3333", "❤️ ТЫ");
        }

        // Экран intro/transition/victory/defeat
        if (rwbState === "intro") {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, 400, 500);
            ctx.font = "bold 24px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("ЛЕГЕНДЫ ПРОБУДИЛИСЬ", 200, 220);
            ctx.font = "bold 15px monospace";
            ctx.fillStyle = "#ff8800";
            ctx.fillText("🔥 РОДЖЕР vs ❄️ БЕЛОУС", 200, 260);
            ctx.font = "12px monospace";
            ctx.fillStyle = "#dddddd";
            ctx.fillText("🔵 Синяя атака разрушает удары", 200, 310);
            ctx.fillText("🟡 Жёлтая бьёт только боссов", 200, 330);
            ctx.fillStyle = "#ffff00";
            ctx.fillText("💡 Совет: двигайся WASD или мышью", 200, 370);
            ctx.restore();
        } else if (rwbState === "transition") {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(0, 0, 400, 500);
            ctx.font = "bold 28px monospace";
            ctx.textAlign = "center";
            if (rwbActiveBoss && rwbActiveBoss.id === "roger") {
                ctx.fillStyle = "#ff8800";
                ctx.fillText("РОДЖЕР: СУПЕР!", 200, 230);
                ctx.font = "14px monospace";
                ctx.fillStyle = "#ffdd00";
                ctx.fillText("Рассечение • Крест • Пламя", 200, 270);
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.fillText("БЕЛОУС: СУПЕР!", 200, 230);
                ctx.font = "14px monospace";
                ctx.fillStyle = "#ffdd00";
                ctx.fillText("Землетрясение • Гура-Гура • Кулак", 200, 270);
            }
            ctx.font = "15px monospace";
            ctx.fillStyle = "#ffd700";
            ctx.fillText("ФИНАЛЬНЫЙ РАУНД!", 200, 320);
            ctx.restore();
        } else if (rwbState === "victory") {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(0, 0, 400, 500);
            ctx.font = "bold 32px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffd700";
            ctx.fillText("ПОБЕДА!", 200, 250);
            ctx.restore();
        } else if (rwbState === "defeat") {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(0, 0, 400, 500);
            ctx.font = "bold 32px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ff0000";
            ctx.fillText("ПОРАЖЕНИЕ", 200, 250);
            ctx.restore();
        }

        ctx.restore();
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);
    }

    function updateSuperBoss() {
        let active = rwbActiveBoss;
        if (!active) return;
        active.pulse += 0.12;
        active.rotation += 0.03;
        active.x = 200 + Math.sin(rwbTimer / 80) * 100;
        active.y = 100 + Math.sin(rwbTimer / 60) * 20;
        if (active.hitFlash > 0) active.hitFlash--;

        if (Math.random() < 0.15) {
            spawnHakiLightning(active.x + (Math.random() - 0.5) * 50, active.y + (Math.random() - 0.5) * 50, 1, false);
        }

        active.attackTimer--;
        if (active.attackTimer <= 0) {
            active.attackTimer = BALANCE.superAttackRate + Math.random() * 30;
            if (active.id === "roger") spawnRogerSuperAttack();
            else spawnWhitebeardSuperAttack();
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
        if (alignRight) ctx.fillRect(x + w - barW, y, barW, h);
        else ctx.fillRect(x, y, barW, h);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        ctx.font = "bold 9px monospace";
        ctx.textAlign = alignRight ? "right" : "left";
        ctx.fillStyle = "#ffffff";
        let labelText = label + " " + Math.ceil(current) + "/" + max;
        if (alignRight) ctx.fillText(labelText, x + w - 4, y + h - 3);
        else ctx.fillText(labelText, x + 4, y + h - 3);
        ctx.restore();
    }

    function drawHeartShape(cx, cy, size, color, glowColor) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.7);
        ctx.bezierCurveTo(-size * 1.4, -size * 0.2, -size * 0.7, -size * 1.1, 0, -size * 0.4);
        ctx.bezierCurveTo(size * 0.7, -size * 1.1, size * 1.4, -size * 0.2, 0, size * 0.7);
        ctx.closePath();
        ctx.fill();
        // Контур для видимости
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.4, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawRoger() {
        if (!roger) return;
        let pulse = 1 + Math.sin(roger.pulse) * 0.06;
        let size = roger.size * pulse;
        let flash = roger.hitFlash > 0;
        ctx.save();
        ctx.translate(roger.x, roger.y);
        ctx.rotate(Math.sin(roger.rotation) * 0.1);
        drawHeartShape(0, 0, size, flash ? "#ffffff" : "#ff8800", "#ff8800");
        // Корона
        ctx.save();
        ctx.translate(0, -size * 0.9);
        ctx.fillStyle = "#cc0000";
        ctx.beginPath();
        ctx.moveTo(-size * 0.9, size * 0.1);
        ctx.lineTo(0, -size * 0.7);
        ctx.lineTo(size * 0.9, size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        ctx.restore();
    }

    function drawWhitebeard() {
        if (!whitebeard) return;
        let pulse = 1 + Math.sin(whitebeard.pulse) * 0.06;
        let size = whitebeard.size * pulse;
        let flash = whitebeard.hitFlash > 0;
        ctx.save();
        ctx.translate(whitebeard.x, whitebeard.y);
        ctx.rotate(Math.sin(whitebeard.rotation) * 0.1);
        drawHeartShape(0, 0, size, flash ? "#ffffaa" : "#ffffff", "#ffffff");
        // Усы Белоуса
        ctx.save();
        ctx.fillStyle = "#ffdd00";
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
        ctx.restore();
        ctx.restore();
    }

    function drawRWBPlayer() {
        if (rwbPlayer.invulnTimer > 0 && Math.floor(rwbPlayer.invulnTimer / 4) % 2 === 0) return;
        let color = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ff2222";
        drawHeartShape(rwbPlayer.x, rwbPlayer.y, rwbPlayer.size, color, color);
    }

    // ============================================================
    // ★★★ РЕНДЕР АТАК (чёткий, видимый) ★★★
    // ============================================================
    function drawAttack(a) {
        if (a.type === "tsunami") { drawTsunami(a); return; }
        if (a.type === "rock") { drawRock(a); return; }

        // РАССЕЧЕНИЕ
        if (a.type === "roger_slash") {
            ctx.save();
            if (a.state === "warning") {
                let pulseAlpha = 0.4 + Math.sin(performance.now() / 100) * 0.2;
                ctx.globalAlpha = pulseAlpha;
                ctx.fillStyle = "#ff4400";
                ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
                // Чёткие границы
                ctx.globalAlpha = 1;
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2.5;
                ctx.setLineDash([12, 8]);
                ctx.beginPath();
                ctx.moveTo(a.x - a.width / 2, 0);
                ctx.lineTo(a.x - a.width / 2, 500);
                ctx.moveTo(a.x + a.width / 2, 0);
                ctx.lineTo(a.x + a.width / 2, 500);
                ctx.stroke();
                ctx.setLineDash([]);
                // Текст
                ctx.fillStyle = "#fff";
                ctx.font = "bold 12px monospace";
                ctx.textAlign = "center";
                ctx.fillText("⚠️", a.x, 250);
            } else if (a.state === "active") {
                let fade = Math.min(1, a.activeTimer / 10);
                ctx.globalAlpha = fade;
                ctx.fillStyle = "#ff2200";
                ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(a.x - a.width * 0.15, 0, a.width * 0.3, 500);
            }
            ctx.restore();
            return;
        }

        // КРЕСТ
        if (a.type === "roger_cross") {
            ctx.save();
            let angle = 0;
            if (a.dir === "vertical") angle = 0;
            else if (a.dir === "horizontal") angle = Math.PI / 2;
            
            ctx.translate(a.x, a.y);
            ctx.rotate(angle);
            
            if (a.state === "warning") {
                let pulseAlpha = 0.4 + Math.sin(performance.now() / 100) * 0.2;
                ctx.globalAlpha = pulseAlpha;
                ctx.fillStyle = "#ff6600";
                ctx.fillRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2.5;
                ctx.setLineDash([12, 8]);
                ctx.strokeRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.setLineDash([]);
            } else if (a.state === "active") {
                let fade = Math.min(1, a.activeTimer / 8);
                ctx.globalAlpha = fade;
                ctx.fillStyle = "#ff4400";
                ctx.fillRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(-a.width * 0.15, -a.length / 2, a.width * 0.3, a.length);
            }
            ctx.restore();
            return;
        }

        // АДСКОЕ ПЛАМЯ
        if (a.type === "hell_fire") {
            ctx.save();
            if (a.state === "flying") {
                // ★ Простой круг с чётким контуром ★
                ctx.fillStyle = "#ff3300";
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
                // Ядро
                ctx.fillStyle = "#ffcc00";
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Предупреждение цели
                ctx.strokeStyle = "rgba(255, 50, 50, 0.7)";
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.arc(a.targetX, a.targetY, 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            } else if (a.state === "exploding") {
                let p = 1 - a.explosionTimer / 50;
                let r = 70 * p;
                ctx.globalAlpha = 1 - p;
                ctx.fillStyle = "#ff4400";
                ctx.beginPath();
                ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // ОСКОЛКИ ОГНЯ
        if (a.type === "fire_piece") {
            ctx.save();
            ctx.fillStyle = "#ff4400";
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
            return;
        }

        // ГУРА-ГУРА
        if (a.type === "gura_crack") {
            ctx.save();
            if (a.state === "warning") {
                let pulseAlpha = 0.5 + Math.sin(performance.now() / 80) * 0.3;
                ctx.globalAlpha = pulseAlpha;
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.maxRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.maxRadius * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                // Текст
                ctx.globalAlpha = 1;
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 14px monospace";
                ctx.textAlign = "center";
                ctx.fillText("💥", a.x, a.y + 5);
            } else if (a.state === "active") {
                let fade = a.activeTimer / a.maxActive;
                ctx.globalAlpha = fade;
                let r = a.radius;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#aaddff";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // ТИТАН-КУЛАК
        if (a.type === "titan_fist") {
            ctx.save();
            ctx.translate(a.x, a.y);
            
            if (a.state === "falling") {
                // Тень на земле
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.ellipse(0, 400 - a.y, a.size * 1.1, 18, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                // Кулак
                ctx.fillStyle = "#8B7355";
                ctx.beginPath();
                ctx.arc(0, 0, a.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#1a1008";
                ctx.lineWidth = 4;
                ctx.stroke();
                // Пальцы
                ctx.fillStyle = "#a89070";
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.arc(i * a.size * 0.3, -a.size * 0.3, a.size * 0.18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = "#1a1008";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            } else if (a.state === "impact") {
                let p = 1 - a.impactTimer / 30;
                let r = a.size * 1.2 + 50 * p;
                ctx.globalAlpha = 1 - p;
                ctx.fillStyle = "#ff4400";
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // ОБЫЧНЫЕ АТАКИ (клинки, кулаки)
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rotation || 0);

        if (a.type === "blade" || a.type === "big_blade") {
            // Чёрная обводка
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.moveTo(0, -a.size - 3);
            ctx.lineTo(a.size * 0.4 + 2, 0);
            ctx.lineTo(0, a.size + 3);
            ctx.lineTo(-a.size * 0.4 - 2, 0);
            ctx.closePath();
            ctx.fill();
            // Цветной клинок
            ctx.fillStyle = a.color;
            ctx.beginPath();
            ctx.moveTo(0, -a.size);
            ctx.lineTo(a.size * 0.4, 0);
            ctx.lineTo(0, a.size);
            ctx.lineTo(-a.size * 0.4, 0);
            ctx.closePath();
            ctx.fill();
            // Белая сердцевина
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(0, -a.size * 0.6);
            ctx.lineTo(a.size * 0.15, 0);
            ctx.lineTo(0, a.size * 0.6);
            ctx.lineTo(-a.size * 0.15, 0);
            ctx.closePath();
            ctx.fill();
        } else if (a.type === "fist") {
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(0, 0, a.size + 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = a.color;
            ctx.beginPath();
            ctx.arc(0, 0, a.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(0, 0, a.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // ============================================================
    // КАМЕНЬ (упрощено)
    // ============================================================
    function drawRock(a) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rotation || 0);
        
        let s = a.size;
        let seed = a.textureSeed || 0;
        
        // Основной контур
        let points = [];
        let sides = 6;
        for (let i = 0; i < sides; i++) {
            let ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
            let noise = Math.sin(seed + i * 1.7) * 0.15;
            let r = s * (1 + noise);
            points.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
        }
        
        // Градиент объёма
        let grad = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s * 1.2);
        grad.addColorStop(0, "#a89070");
        grad.addColorStop(0.6, "#8B7355");
        grad.addColorStop(1, "#3a2818");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Чёткая обводка
        ctx.strokeStyle = "#1a1008";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Трещины
        ctx.strokeStyle = "rgba(30, 20, 10, 0.7)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) {
            let ang1 = (seed + i * 1.3) % (Math.PI * 2);
            let ang2 = ang1 + 1.2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang1) * s * 0.3, Math.sin(ang1) * s * 0.3);
            ctx.lineTo(Math.cos(ang2) * s * 0.8, Math.sin(ang2) * s * 0.8);
            ctx.stroke();
        }
        
        // Блик
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.35, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // ============================================================
    // ЦУНАМИ (упрощено)
    // ============================================================
    function drawTsunami(a) {
        ctx.save();
        
        let cx = a.x;
        let cy = a.y;
        let w = a.currentWidth || a.width;
        let h = a.currentHeight || a.height;
        let waveTime = a.waveTime;
        let fromLeft = a.fromLeft;
        
        // Тень
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.ellipse(cx, 480, w * 1.3, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Основная волна
        let grad = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
        if (fromLeft) {
            grad.addColorStop(0, "#001a33");
            grad.addColorStop(0.5, "#0088dd");
            grad.addColorStop(1, "#aae5ff");
        } else {
            grad.addColorStop(0, "#aae5ff");
            grad.addColorStop(0.5, "#0088dd");
            grad.addColorStop(1, "#001a33");
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, cy + h / 2);
        
        let segments = 8;
        for (let i = 0; i <= segments; i++) {
            let t = i / segments;
            let x = cx - w / 2 + t * w;
            let topY = cy - h / 2 - Math.sin(t * Math.PI * 3 + waveTime * 2) * 8;
            ctx.lineTo(x, topY);
        }
        
        ctx.lineTo(cx + w / 2, cy + h / 2);
        ctx.closePath();
        ctx.fill();
        
        // Чёткая обводка
        ctx.strokeStyle = "#003366";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Пенка (белые круги сверху)
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i <= segments; i++) {
            let t = i / segments;
            let x = cx - w / 2 + t * w;
            let topY = cy - h / 2 - Math.sin(t * Math.PI * 3 + waveTime * 2) * 8;
            ctx.beginPath();
            ctx.arc(x, topY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Внутренние линии
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        for (let li = 0; li < 2; li++) {
            let lineOffset = -h * 0.1 + li * h * 0.2;
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                let t = i / segments;
                let x = cx - w / 2 + 8 + t * (w - 16);
                let y = cy + lineOffset + Math.sin(t * Math.PI * 4 + waveTime * 2 + li) * 3;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
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
    console.log("║  🏴‍☠️ ROGER vs WHITEBEARD v7.0                              ║");
    console.log("║  🏝️ ФОН: остров + море + закат                            ║");
    console.log("║  🎯 ХИТБОКСЫ уменьшены                                    ║");
    console.log("║  ⚡ ЭФФЕКТЫ облегчены (меньше лагов)                     ║");
    console.log("║  💪 БАЛАНС: Белоус ослаблен на 30%                        ║");
    console.log("║  👁️ АТАКИ видны чётко                                     ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

})();
