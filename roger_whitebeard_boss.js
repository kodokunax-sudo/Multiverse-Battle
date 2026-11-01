// ============================================================
// РОДЖЕР vs БЕЛОУС — БОСС 1000 ВОЛНЫ v23.0
// ============================================================
// ★ v19.0 — ФИКС СУПЕРОВ:
//   - garouTimeStop останавливает ВСЕ атаки
//   - Поглощение урона (щит, редукция) работает правильно
//   - Увеличение урона (nikaDmgMult, dekusDmgMult, allmightDmgMult,
//     kaidoDmgBonus, dandyDmgBuff, markDmgBonus) применяется к пулям
//   - Ураган Всемогущего работает
//   - Анти-спираль реально замедляет игрока
//   - rwbSpeedMult — глобальный множитель скорости игрока
// ============================================================

(function() {
    'use strict';

    if (window._rogerWhitebeardLoaded) {
        console.warn("[ROGER-WB] Уже загружено.");
        return;
    }
    window._rogerWhitebeardLoaded = true;

    const RWB_SUPER_ROGER_HP = 2200;
    const RWB_SUPER_WB_HP = 1800;
    const RWB_ATTACK_SPEED = 45;
    const RWB_ATTACK_SPEED_SUPER_ROGER = 30;
    const RWB_SUPER_COOLDOWN = 300;
    const RWB_TITAN_INTERVAL = 640;
    const RWB_ROCK_INTERVAL = 1500;
    const RWB_MELEE_RANGE = 55;
    const RWB_MELEE_COOLDOWN = 40;
    const RWB_MELEE_DAMAGE = 15;
    const RWB_MELEE_KNOCKBACK = 40;

    const BALANCE = {
        playerHp: 250,
        playerDamageMult: 1.0,
        rogerHp: 800,
        rogerDamageMult: 1.3,
        whitebeardHp: 1000,
        whitebeardDamageMult: 0.8,
        superAttackRate: 40,
        superDamageMult: 1.7,
        superDuration: 2700,
        playerHitboxMult: 0.7,
        projectileSpeedMult: 1.0
    };

    window.rwbActive = false;

    // ★ ГЛОБАЛЬНЫЙ МНОЖИТЕЛЬ СКОРОСТИ (для Анти-спирали, Деку, etc.) ★
    let rwbSpeedMult = 1.0;
    let rwbBaseSpeed = 4.5;
    let rwbOriginalBaseSpeed = 4.5;

    let rwbState = "intro";
    let rwbTimer = 0;
    let rwbIntroTimer = 0;
    let rwbTransitionTimer = 0;
    let rwbEndTimer = 0;
    let rwbSurvivalTimer2 = 0;
    let rwbSurvivalTarget2 = BALANCE.superDuration;
    let rwbActiveBoss = null;
    let rwbTitanFistTimer = 0;
    let rwbTitanRockTimer = 0;
    let rwbSuperReady = true;
    let rwbSuperCooldown = 0;
    let rwbMeleeCooldown = 0;
    let rwbSupersInitialized = false;

    var rwbWinner = null;
    var rwbRewardGiven = false;
    var rwbWatchdog = null;
    var rwbDialogStage = 0;
    var rwbWhitebeardDisabled = [false, false, false];
    var rwbWBPhase = "intro";
    var rwbDialogQueue = [];

    var rwbDialogActive = false;
    var rwbDialogType = null;
    var rwbDialogTimer = 0;

    var RWB_ROGER_DIALOG = [
        { speaker: "🔥 РОДЖЕР", text: "Неужели я вот так погибну не найдя ван пис? Эх... Жаль..." }
    ];

    var RWB_ODEN_DEATH_DIALOG = [
        { speaker: "⚔️ ОДЭН", text: "Ха... Похоже, мой путь здесь заканчивается. Но я не жалею, что сражался рядом с тобой." },
        { speaker: "⚔️ ОДЭН", text: "Я верю в тебя. Ты сильнее, чем думаешь, и уже зашёл слишком далеко, чтобы отступить." },
        { speaker: "⚔️ ОДЭН", text: "Закончи то, что мы начали. Найди серверный блок и верни своё сохранение... Я доверяю это тебе." }
    ];

    var RWB_WHITEBEARD_DIALOG_INITIAL = [
        { speaker: "❄️ БЕЛОУС", text: "Ты победил меня в честном бою. Я уважаю силу, но ещё больше — волю человека. И зачем ты тут?" }
    ];

    var RWB_WB_CHOICES = [
        { id: 0, text: "Да я не знаю... Случайно попал сюда.." },
        { id: 1, text: "Я могу сделать тебя частью своей команды. Ну как ты любишь говорить... Семья.." },
        { id: 2, text: "Я ЗДОХ ИЗ ЗА ТЕБЯ СОТНИ РАЗ ТЫ УЖЕ ЗАДОЛБАЛ МЕНЯ" }
    ];

    var RWB_WB_RESPONSE_1 = [
        { speaker: "👤 ИГРОК", text: "Мне нужно найти блок сервера, где находится моё сохранение. Рик всё испортил..." },
        { speaker: "❄️ БЕЛОУС", text: "А, у меня на корабле есть какой-то кусок металла с проводами. Может, это то, что ты ищешь?" },
        { speaker: "👤 ИГРОК", text: "Стоп, серьёзно? Очуметь!" }
    ];
    var RWB_WB_RESPONSE_2 = [
        { speaker: "👤 ИГРОК", text: "Я не ищу подчинённого. Семья — это те, кто прикрывает друг другу спину." },
        { speaker: "❄️ БЕЛОУС", text: "Гурарара... Кстати, на моём корабле есть какой-то кусок металла с проводами. Не знаю, то ли это, что ты ищешь, но можешь забрать его после разговора." },
        { speaker: "❄️ БЕЛОУС", text: "А насчёт семьи — ты зовёшь меня не в команду, а в семью. Это большая ответственность." },
        { speaker: "👤 ИГРОК", text: "Я не прошу клясться мне. Я прошу идти рядом и не оставлять друг друга в беде." },
        { speaker: "❄️ БЕЛОУС", text: "Тогда я принимаю твоё приглашение. Запомни: назвал людей семьёй — стой за них до конца. Отныне я буду рядом." }
    ];
    var RWB_WB_RESPONSE_3_A = [
        { speaker: "❄️ БЕЛОУС", text: "Так ты сомной дерешься впервые, не?" }
    ];
    var RWB_WB_RESPONSE_3_B = [
        { speaker: "👤 ИГРОК", text: "У меня есть штука похожее на шкатулку. Оно заполняется прогрессом и с помощью него я могу перемещаться в прошлое с командой. Типо чекпойнт" }
    ];

    // This flag is intentionally separate from the boss reward: future companion features can read it.
    try {
        window.rwbWhitebeardFamilyAccepted = localStorage.getItem("rwbWhitebeardFamilyAccepted") === "yes";
    } catch (e) {
        window.rwbWhitebeardFamilyAccepted = false;
    }

    let roger = null;
    let whitebeard = null;
    let duel = null;
    let rwbPlayer = null;
    let rwbOden = null;
    let rwbOdenSlashes = [];
    let rwbOdenLastTargetId = null;
    let rwbOdenOfferShown = false;
    let rwbOdenDeathDialogShown = false;
    let rwbOdenConsentMemory = Object.create(null);
    let rwbPlayerFocusTargetId = null;

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
    let rwbWhitebeardPortraitImage = null;
    let rwbWhitebeardPortraitImageFailed = false;

    const rwbCombatSpriteBank = {
        roger: { path: "Model/роджер.png", preloadKey: "rogerBossModel", image: null, loading: false, failed: false },
        whitebeard: { path: "Model/белоус.png", preloadKey: "whitebeardBossModel", image: null, loading: false, failed: false },
        oden: { path: "Model/оден.png", preloadKey: "odenBossModel", image: null, loading: false, failed: false },
        rogerFlash: { path: "Model/роджер белый.png", preloadKey: "rogerBossModelFlash", image: null, loading: false, failed: false },
        whitebeardFlash: { path: "Model/белоус белый.png", preloadKey: "whitebeardBossModelFlash", image: null, loading: false, failed: false },
        odenFlash: { path: "Model/оден белый.png", preloadKey: "odenBossModelFlash", image: null, loading: false, failed: false }
    };

    function getRWBCombatSprite(key) {
        const entry = rwbCombatSpriteBank[key];
        if (!entry || entry.failed) return null;
        if (!entry.image && !entry.loading) {
            entry.loading = true;
            try {
                const preloaded = typeof window.getPreloadedImage === "function"
                    ? window.getPreloadedImage(entry.preloadKey, encodeURI(entry.path)) : null;
                const img = preloaded || new Image();
                entry.image = img;
                const onLoaded = function() {
                    entry.image = img;
                    entry.loading = false;
                    if (!img.naturalWidth) {
                        entry.failed = true;
                        entry.image = null;
                        console.warn("[ROGER-WB] Не удалось загрузить боевую модель:", entry.path);
                    }
                };
                const onFailed = function() {
                    entry.failed = true; entry.loading = false; entry.image = null;
                    console.warn("[ROGER-WB] Не удалось загрузить боевую модель:", entry.path);
                };
                if (!preloaded) {
                    img.onload = onLoaded;
                    img.onerror = onFailed;
                    img.src = encodeURI(entry.path);
                } else if (img.complete) {
                    entry.loading = false;
                    if (!img.naturalWidth) { entry.failed = true; entry.image = null; }
                } else {
                    img.addEventListener("load", onLoaded, { once: true });
                    img.addEventListener("error", onFailed, { once: true });
                }
            } catch (e) {
                entry.failed = true; entry.loading = false; entry.image = null;
            }
        }
        return entry.image && entry.image.complete && entry.image.naturalWidth > 0
            ? entry.image : null;
    }

    function drawRWBCombatSprite(key, cx, cy, size, flash, rotation, widthFactor, heightFactor) {
        const baseImage = getRWBCombatSprite(key);
        if (!baseImage) return false;
        const flashImage = flash ? getRWBCombatSprite(key + "Flash") : null;
        const usingDamageSprite = !!flashImage;
        const img = flashImage || baseImage;
        const maxW = Math.max(16, size * (widthFactor || 2.65));
        const maxH = Math.max(24, size * (heightFactor || 3.2));
        const fit = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
        const w = img.naturalWidth * fit, h = img.naturalHeight * fit;
        const glow = key === "whitebeard" ? "#9eeaff" : (key === "oden" ? "#ffd84d" : "#ff974f");
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Number(rotation) || 0);
        ctx.shadowColor = flash ? "#ffffff" : glow;
        ctx.shadowBlur = flash ? 23 : (key === "oden" ? 7 : 11);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        // Use the provided white hit sprite directly; tint the normal sprite only as fallback.
        if (flash && !usingDamageSprite) {
            ctx.globalCompositeOperation = "source-atop";
            ctx.globalAlpha = 0.52;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-w / 2, -h / 2, w, h);
        }
        ctx.restore();
        return true;
    }

    function preloadRWBCombatSprites() {
        Object.keys(rwbCombatSpriteBank).forEach(function(key) {
            getRWBCombatSprite(key);
        });
    }
    preloadRWBCombatSprites();

    let rwbWhiteCracks = [];
    let rwbPurpleCracks = [];

    let rwbKeys = {};
    let rwbTouchActive = false;
    let rwbTouchId = null;
    let rwbTouchX = 0;
    let rwbTouchY = 0;

    let rwbModeBtn = null;
    let rwbSuperBtn = null;
    let rwbGraphicsBtn = null;

    // Use the same per-fight graphics choice as the other unique bosses.
    // Do not auto-select mobile mode based on touch input or viewport size.
    window.rwbGraphicsMode = "pc";
    function isRWBMobileGraphics() {
        return !!(window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects());
    }

    let rwbTsunamiActive = false;
    // Белоус: супер-скилл «Воронка» + QTE
    let wbVortexElapsedMs = 0;
    let wbVortexClockAt = 0;
    let wbVortexActive = false;
    let wbVortexTimerLeft = 0;
    let wbVortexPoints = [];
    let wbVortexNextPoint = 0;
    let wbVortexFailed = false;
    let wbVortexPullStrength = 0;
    // Кэшированный спрайт воронки: тяжёлые дуги рисуются один раз, дальше вращается готовая текстура.
    let wbVortexSprite = null;
    // Лёгкая заранее отрисованная модель вихря, отражающего пули.
    let wbReflectVortexSprite = null;
    const WB_VORTEX_INTERVAL_MS = 20000; // ровно 20 секунд реального времени
    const WB_VORTEX_CHANCE = 0.35;
    const WB_VORTEX_QTE_DURATION = 180; // ровно 3 секунды на семь целей

    // Адаптивный ИИ Белоуса: запоминает привычки игрока в коротком временном окне.
    let wbBrain = {
        bottomFrames: 0, stationaryFrames: 0, farFrames: 0,
        shotsInWindow: 0, shotWindowTimer: 0, adaptiveCooldown: 0,
        lastX: 200, lastY: 420, playerVX: 0, playerVY: 0,
        lastAdaptive: null, lastAttackId: -1, lastSuperAttackId: -1,
        comboHint: null, phase: "idle", phaseTimer: 0, recoveryTimer: 0,
        plannedTargetX: 200, plannedTargetY: 360, plannedRockXs: []
    };
    // Scripted trap: tsunami pull -> crossfire fists -> falling rocks.
    let wbTrapCombo = { stage: "idle", timer: 0, cooldown: 300, targetX: 200, targetY: 380, pullTargetX: 200, pullTargetY: 300, startedAt: 0 };
    let rwbPlayerStunTimer = 0;
    let wbFruitFlashTimer = 0;
    let wbFruitFlashPower = 0.72;

    let rwbMusic = null;
    const RWB_MUSIC_PATH = "music/Dark_Souls_-_Ornstein_Smough_66400273.mp3";

    function syncWindowVars() {
        window.rwbPlayer = rwbPlayer;
        window.rwbAttacks = rwbAttacks;
        window.rwbParticles = rwbParticles;
        window.rwbActiveBoss = rwbActiveBoss;
        window.rwbState = rwbState;
    }
    setInterval(syncWindowVars, 100);

    function isModerActive() {
        try { return typeof mode !== 'undefined' && mode === "moder"; } catch(e) { return false; }
    }

    function startRWBMusic() {
        if (typeof stopAllMusic === 'function') stopAllMusic();
        if (!rwbMusic) {
            try {
                let src = RWB_MUSIC_PATH;
                if (typeof window.getLoadedMusic === 'function') {
                    let loaded = window.getLoadedMusic('rwb');
                    if (loaded && loaded.url) src = loaded.url;
                }
                rwbMusic = new Audio(src);
                rwbMusic.loop = true; rwbMusic.volume = 0.45;
                rwbMusic.onerror = function() { rwbMusic = null; };
            } catch(e) { rwbMusic = null; }
        }
        if (rwbMusic) { try { rwbMusic.currentTime = 0; rwbMusic.play().catch(function() {}); } catch(e) {} }
    }

    function stopRWBMusic() { if (rwbMusic) { try { rwbMusic.pause(); rwbMusic.currentTime = 0; } catch(e) {} } }

    let rwbAudioCtx = null;

    function initRWBAudio() {
        if (rwbAudioCtx) { if (rwbAudioCtx.state === 'suspended') rwbAudioCtx.resume(); return; }
        try { rwbAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }

    function playRWBSound(opts) {
        if (!rwbAudioCtx) initRWBAudio();
        if (!rwbAudioCtx) return;
        let freq = opts.freq || 200, freqEnd = opts.freqEnd || freq;
        let type = opts.type || 'sawtooth', duration = opts.duration || 0.3;
        let volume = opts.volume || 0.15, attack = opts.attack || 0.005;
        let release = opts.release || duration, detune = opts.detune || 0;
        try {
            let osc = rwbAudioCtx.createOscillator(), gain = rwbAudioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, rwbAudioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), rwbAudioCtx.currentTime + duration);
            if (detune) osc.detune.setValueAtTime(detune, rwbAudioCtx.currentTime);
            gain.gain.setValueAtTime(0, rwbAudioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(volume, rwbAudioCtx.currentTime + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, rwbAudioCtx.currentTime + release);
            osc.connect(gain); gain.connect(rwbAudioCtx.destination);
            osc.start(rwbAudioCtx.currentTime);
            osc.stop(rwbAudioCtx.currentTime + release + 0.05);
        } catch(e) {}
    }

    function playImpactSound(volume, pitch) {
        if (!rwbAudioCtx) initRWBAudio();
        if (!rwbAudioCtx) return;
        volume = volume || 0.4; pitch = pitch || 1;
        try {
            let bufferSize = rwbAudioCtx.sampleRate * 0.4;
            let buffer = rwbAudioCtx.createBuffer(1, bufferSize, rwbAudioCtx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
            let noise = rwbAudioCtx.createBufferSource(); noise.buffer = buffer;
            let noiseFilter = rwbAudioCtx.createBiquadFilter(); noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(400 * pitch, rwbAudioCtx.currentTime);
            noiseFilter.frequency.exponentialRampToValueAtTime(80, rwbAudioCtx.currentTime + 0.4);
            let noiseGain = rwbAudioCtx.createGain();
            noiseGain.gain.setValueAtTime(volume, rwbAudioCtx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, rwbAudioCtx.currentTime + 0.4);
            noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(rwbAudioCtx.destination);
            noise.start(rwbAudioCtx.currentTime);
            let osc = rwbAudioCtx.createOscillator(), oscGain = rwbAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120 * pitch, rwbAudioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(35, rwbAudioCtx.currentTime + 0.3);
            oscGain.gain.setValueAtTime(volume * 1.2, rwbAudioCtx.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.001, rwbAudioCtx.currentTime + 0.35);
            osc.connect(oscGain); oscGain.connect(rwbAudioCtx.destination);
            osc.start(rwbAudioCtx.currentTime);
            osc.stop(rwbAudioCtx.currentTime + 0.4);
        } catch(e) {}
    }

    function playBladeSound(volume) {
        volume = volume || 0.2;
        playRWBSound({ freq: 2000, freqEnd: 400, type: 'sawtooth', duration: 0.25, volume: volume * 0.4, attack: 0.002, release: 0.25 });
        playRWBSound({ freq: 3000, freqEnd: 800, type: 'triangle', duration: 0.15, volume: volume * 0.3, attack: 0.001, release: 0.15, detune: 20 });
    }

    function playExplosionSound(volume) {
        volume = volume || 0.5;
        if (!rwbAudioCtx) initRWBAudio();
        if (!rwbAudioCtx) return;
        try {
            let bufferSize = rwbAudioCtx.sampleRate * 0.8;
            let buffer = rwbAudioCtx.createBuffer(1, bufferSize, rwbAudioCtx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            let noise = rwbAudioCtx.createBufferSource(); noise.buffer = buffer;
            let filter = rwbAudioCtx.createBiquadFilter(); filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, rwbAudioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(60, rwbAudioCtx.currentTime + 0.8);
            let gain = rwbAudioCtx.createGain();
            gain.gain.setValueAtTime(volume, rwbAudioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, rwbAudioCtx.currentTime + 0.8);
            noise.connect(filter); filter.connect(gain); gain.connect(rwbAudioCtx.destination);
            noise.start(rwbAudioCtx.currentTime);
            let osc = rwbAudioCtx.createOscillator(), oscGain = rwbAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, rwbAudioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(25, rwbAudioCtx.currentTime + 0.6);
            oscGain.gain.setValueAtTime(volume * 1.5, rwbAudioCtx.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.001, rwbAudioCtx.currentTime + 0.7);
            osc.connect(oscGain); oscGain.connect(rwbAudioCtx.destination);
            osc.start(rwbAudioCtx.currentTime);
            osc.stop(rwbAudioCtx.currentTime + 0.8);
        } catch(e) {}
    }

    function playWhooshSound(volume) {
        volume = volume || 0.15;
        playRWBSound({ freq: 800, freqEnd: 100, type: 'sawtooth', duration: 0.3, volume: volume, attack: 0.01, release: 0.3, detune: -100 });
    }

    function playHakiChargeSound(volume) {
        volume = volume || 0.25;
        playRWBSound({ freq: 60, freqEnd: 400, type: 'sawtooth', duration: 1.2, volume: volume, attack: 0.1, release: 1.2 });
        playRWBSound({ freq: 100, freqEnd: 600, type: 'square', duration: 1.2, volume: volume * 0.5, attack: 0.1, release: 1.2, detune: 50 });
    }

    function playBossRoarSound(volume) {
        volume = volume || 0.4;
        playRWBSound({ freq: 150, freqEnd: 60, type: 'sawtooth', duration: 0.8, volume: volume, attack: 0.05, release: 0.8, detune: -200 });
        playRWBSound({ freq: 80, freqEnd: 40, type: 'square', duration: 1.0, volume: volume * 0.7, attack: 0.05, release: 1.0, detune: -300 });
    }

    function wrapText(text, maxWidth, ctx) {
        var words = text.split(' '), lines = [], currentLine = '';
        for (var i = 0; i < words.length; i++) {
            var testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
            if (ctx.measureText(testLine).width > maxWidth && currentLine) { lines.push(currentLine); currentLine = words[i]; }
            else { currentLine = testLine; }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    // ============================================================
    // ПОРТРЕТЫ
    // ============================================================
    function drawRogerPortrait(x, y, scale) {
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.fillStyle = "#8B0000";
        ctx.beginPath(); ctx.moveTo(-55, 80); ctx.lineTo(-45, 25); ctx.lineTo(-25, 15); ctx.lineTo(25, 15); ctx.lineTo(45, 25); ctx.lineTo(55, 80); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#FFD700";
        ctx.beginPath(); ctx.ellipse(-38, 30, 15, 10, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(38, 30, 15, 10, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#B8860B"; ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath(); ctx.moveTo(-48, 25 + i * 6); ctx.lineTo(-28, 25 + i * 6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(28, 25 + i * 6); ctx.lineTo(48, 25 + i * 6); ctx.stroke();
        }
        ctx.fillStyle = "#F5F5F5";
        ctx.beginPath(); ctx.moveTo(-22, 25); ctx.quadraticCurveTo(0, 50, 22, 25); ctx.lineTo(20, 15); ctx.quadraticCurveTo(0, 30, -20, 15); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#CCCCCC"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#E8B896"; ctx.fillRect(-10, 5, 20, 15);
        ctx.fillStyle = "#F0C9A8";
        ctx.beginPath(); ctx.ellipse(0, -20, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#C49A78"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#0a0a0a";
        ctx.beginPath(); ctx.arc(-20, -35, 15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, -35, 15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -40, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-24, -30); ctx.quadraticCurveTo(-30, -10, -28, 5); ctx.lineTo(-22, 5); ctx.quadraticCurveTo(-22, -15, -18, -25); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(24, -30); ctx.quadraticCurveTo(30, -10, 28, 5); ctx.lineTo(22, 5); ctx.quadraticCurveTo(22, -15, 18, -25); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#8B0000";
        ctx.beginPath();
        ctx.moveTo(-40, -42); ctx.quadraticCurveTo(-15, -75, 0, -75); ctx.quadraticCurveTo(15, -75, 40, -42);
        ctx.lineTo(30, -38); ctx.quadraticCurveTo(15, -55, 0, -55); ctx.quadraticCurveTo(-15, -55, -30, -38); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#5a0000"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-38, -40); ctx.quadraticCurveTo(-15, -70, 0, -70); ctx.quadraticCurveTo(15, -70, 38, -40); ctx.stroke();
        ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(0, -62, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(-2.5, -63, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(2.5, -63, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-3, -58, 6, 2);
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-12, -55); ctx.lineTo(-5, -60); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, -55); ctx.lineTo(5, -60); ctx.stroke();
        ctx.fillStyle = "#F0C9A8";
        ctx.beginPath(); ctx.ellipse(-22, -20, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(22, -20, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.ellipse(-8, -22, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8, -22, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(-8, -21, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -21, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0a0a0a";
        ctx.beginPath(); ctx.moveTo(-3, -12); ctx.quadraticCurveTo(-18, -10, -26, -5); ctx.quadraticCurveTo(-20, -3, -10, -8); ctx.quadraticCurveTo(-6, -6, -3, -7); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(3, -12); ctx.quadraticCurveTo(18, -10, 26, -5); ctx.quadraticCurveTo(20, -3, 10, -8); ctx.quadraticCurveTo(6, -6, 3, -7); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#3a1a0a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -10, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.moveTo(-6, -5); ctx.quadraticCurveTo(0, -3, 6, -5); ctx.lineTo(6, -6); ctx.quadraticCurveTo(0, -4, -6, -6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(2, -4.5, 1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#C49A78"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -14); ctx.stroke();
        ctx.restore();
    }

    function drawWhitebeardPortrait(x, y, scale) {
        // В диалоге показываем тот же арт Белоуса, что и у обычной карточки.
        if (!rwbWhitebeardPortraitImage && !rwbWhitebeardPortraitImageFailed) {
            try {
                rwbWhitebeardPortraitImage = new Image();
                rwbWhitebeardPortraitImage.onerror = function() {
                    rwbWhitebeardPortraitImageFailed = true;
                    rwbWhitebeardPortraitImage = null;
                };
                var portraitSrc = (typeof getCardImage === "function" ? getCardImage("Белоус") : null) || "images/Belous_1.png";
                rwbWhitebeardPortraitImage.src = portraitSrc;
            } catch (e) { rwbWhitebeardPortraitImageFailed = true; }
        }
        var portraitNow = performance.now();
        if (rwbWhitebeardPortraitImage && rwbWhitebeardPortraitImage.complete && rwbWhitebeardPortraitImage.naturalWidth > 0) {
            ctx.save();
            var frame = 112 * scale;
            ctx.translate(x, y + Math.sin(portraitNow / 260) * 2.4);
            ctx.rotate(Math.sin(portraitNow / 780) * 0.018);
            ctx.shadowColor = "#88ddff"; ctx.shadowBlur = 20;
            ctx.fillStyle = "#06080d"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 8;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-frame / 2 - 5, -frame / 2 - 5, frame + 10, frame + 10, 14);
            else ctx.rect(-frame / 2 - 5, -frame / 2 - 5, frame + 10, frame + 10);
            ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-frame / 2, -frame / 2, frame, frame, 10);
            else ctx.rect(-frame / 2, -frame / 2, frame, frame);
            ctx.clip();
            ctx.fillStyle = "#10131c"; ctx.fillRect(-frame / 2, -frame / 2, frame, frame);
            var img = rwbWhitebeardPortraitImage;
            var fit = Math.min(frame / img.naturalWidth, frame / img.naturalHeight);
            var drawW = img.naturalWidth * fit, drawH = img.naturalHeight * fit;
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
            ctx.shadowColor = "#000000"; ctx.shadowBlur = 0;
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 7;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-frame / 2, -frame / 2, frame, frame, 10);
            else ctx.rect(-frame / 2, -frame / 2, frame, frame);
            ctx.stroke();
            ctx.strokeStyle = "#88ddff"; ctx.lineWidth = 2;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-frame / 2 + 3, -frame / 2 + 3, frame - 6, frame - 6, 8);
            else ctx.rect(-frame / 2 + 3, -frame / 2 + 3, frame - 6, frame - 6);
            ctx.stroke();
            // Чёрно-белые молнии хаки вокруг портрета.
            for (var z = 0; z < 4; z++) {
                var ang = portraitNow / 420 + z * Math.PI / 2;
                var r1 = frame * 0.52, r2 = frame * 0.65;
                var sx = Math.cos(ang) * r1, sy = Math.sin(ang) * r1;
                var ex = Math.cos(ang + 0.22) * r2, ey = Math.sin(ang + 0.22) * r2;
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (Math.random() - .5) * 8, sy + (Math.random() - .5) * 8); ctx.lineTo(ex, ey); ctx.stroke();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (Math.random() - .5) * 8, sy + (Math.random() - .5) * 8); ctx.lineTo(ex, ey); ctx.stroke();
            }
            ctx.restore();
            return;
        }
        // Fallback: старая отрисовка, если PNG не загрузился.
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.fillStyle = "#8B0000";
        ctx.beginPath(); ctx.moveTo(-65, 90); ctx.lineTo(-55, 30); ctx.lineTo(55, 30); ctx.lineTo(65, 90); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#F5F5F5";
        ctx.beginPath(); ctx.moveTo(-50, 85); ctx.lineTo(-40, 25); ctx.lineTo(-15, 15); ctx.lineTo(15, 15); ctx.lineTo(40, 25); ctx.lineTo(50, 85); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#CCCCCC"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#FFD700";
        ctx.beginPath(); ctx.ellipse(-42, 32, 18, 12, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(42, 32, 18, 12, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#B8860B"; ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath(); ctx.moveTo(-55, 25 + i * 7); ctx.lineTo(-28, 25 + i * 7); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(28, 25 + i * 7); ctx.lineTo(55, 25 + i * 7); ctx.stroke();
        }
        ctx.fillStyle = "#E8B896";
        ctx.beginPath(); ctx.moveTo(-15, 15); ctx.lineTo(-20, 50); ctx.lineTo(20, 50); ctx.lineTo(15, 15); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#C49A78"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-10, 25); ctx.lineTo(5, 45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, 20); ctx.lineTo(-5, 48); ctx.stroke();
        ctx.strokeStyle = "#D4A880"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-15, 30); ctx.quadraticCurveTo(0, 35, 15, 30); ctx.stroke();
        ctx.fillStyle = "#E8B896"; ctx.fillRect(-12, 5, 24, 15);
        ctx.strokeStyle = "#C49A78"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(-8, 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, 10); ctx.lineTo(8, 18); ctx.stroke();
        ctx.fillStyle = "#F0C9A8";
        ctx.beginPath(); ctx.ellipse(0, -20, 24, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#C49A78"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#E8C878";
        ctx.beginPath(); ctx.moveTo(-24, -35); ctx.quadraticCurveTo(-38, -10, -35, 25); ctx.lineTo(-28, 25); ctx.quadraticCurveTo(-30, -10, -22, -30); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(24, -35); ctx.quadraticCurveTo(38, -10, 35, 25); ctx.lineTo(28, 25); ctx.quadraticCurveTo(30, -10, 22, -30); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -42, 26, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#C9A850"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-30, -20); ctx.quadraticCurveTo(-32, 0, -30, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(30, -20); ctx.quadraticCurveTo(32, 0, 30, 20); ctx.stroke();
        ctx.fillStyle = "#F5F5F5";
        ctx.beginPath();
        ctx.moveTo(-45, -45); ctx.quadraticCurveTo(-15, -80, 0, -80); ctx.quadraticCurveTo(15, -80, 45, -45);
        ctx.lineTo(35, -40); ctx.quadraticCurveTo(15, -60, 0, -60); ctx.quadraticCurveTo(-15, -60, -35, -40); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#999999"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-42, -43); ctx.quadraticCurveTo(-15, -74, 0, -74); ctx.quadraticCurveTo(15, -74, 42, -43); ctx.stroke();
        ctx.fillStyle = "#FFD700";
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * 11, -50 + Math.abs(i) * 3, 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(0, -66, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(-3, -67, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -67, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-3.5, -61, 7, 2);
        ctx.fillStyle = "#F0C9A8";
        ctx.beginPath(); ctx.ellipse(-24, -20, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(24, -20, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.ellipse(-9, -22, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(9, -22, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(-9, -22, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(9, -22, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(-3, -10); ctx.bezierCurveTo(-15, -8, -50, -5, -55, -18);
        ctx.bezierCurveTo(-52, -22, -40, -18, -30, -14); ctx.bezierCurveTo(-20, -11, -10, -12, -3, -13); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#CCCCCC"; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, -10); ctx.bezierCurveTo(15, -8, 50, -5, 55, -18);
        ctx.bezierCurveTo(52, -22, 40, -18, 30, -14); ctx.bezierCurveTo(20, -11, 10, -12, 3, -13); ctx.closePath(); ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#3a1a0a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-5, -5); ctx.quadraticCurveTo(0, -3, 5, -5); ctx.stroke();
        ctx.strokeStyle = "#C49A78"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -14); ctx.stroke();
        ctx.restore();
    }

    // ============================================================
    // МОДЕЛИ ДЛЯ БОЯ
    // ============================================================
    function drawRogerModel(cx, cy, size, flash, rotation) {
        if (drawRWBCombatSprite("roger", cx, cy - size * 0.10, size, flash, rotation, 2.65, 3.2)) return;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(rotation);
        ctx.save();
        let heartSize = size * 0.9;
        ctx.fillStyle = flash ? "#ffffff" : "#ff8800";
        ctx.shadowColor = "#ff8800"; ctx.shadowBlur = flash ? 25 : 12;
        ctx.beginPath();
        ctx.moveTo(0, heartSize * 0.7);
        ctx.bezierCurveTo(-heartSize * 1.4, -heartSize * 0.2, -heartSize * 0.7, -heartSize * 1.1, 0, -heartSize * 0.4);
        ctx.bezierCurveTo(heartSize * 0.7, -heartSize * 1.1, heartSize * 1.4, -heartSize * 0.2, 0, heartSize * 0.7);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        let s = size / 30;
        ctx.save();
        ctx.translate(0, -size * 0.9);
        ctx.fillStyle = "#8B0000";
        ctx.beginPath();
        ctx.moveTo(-16 * s, -3 * s); ctx.quadraticCurveTo(0, -18 * s, 16 * s, -3 * s);
        ctx.lineTo(12 * s, -1 * s); ctx.quadraticCurveTo(0, -12 * s, -12 * s, -1 * s); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-15 * s, -2 * s); ctx.quadraticCurveTo(0, -16 * s, 15 * s, -2 * s); ctx.stroke();
        ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(0, -10 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(-1 * s, -10.5 * s, 0.8 * s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(1 * s, -10.5 * s, 0.8 * s, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(0, size * 0.15);
        ctx.fillStyle = "#0a0a0a";
        ctx.beginPath();
        ctx.moveTo(-1 * s, 0); ctx.quadraticCurveTo(-8 * s, -1 * s, -12 * s, 3 * s);
        ctx.quadraticCurveTo(-8 * s, 1 * s, -1 * s, 1 * s); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(1 * s, 0); ctx.quadraticCurveTo(8 * s, -1 * s, 12 * s, 3 * s);
        ctx.quadraticCurveTo(8 * s, 1 * s, 1 * s, 1 * s); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(0, -size * 0.1);
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(-3.5 * s, 0, 1.2 * s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.5 * s, 0, 1.2 * s, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.restore();
    }

    function drawWhitebeardModel(cx, cy, size, flash, rotation) {
        if (drawRWBCombatSprite("whitebeard", cx, cy - size * 0.12, size, flash, rotation, 2.65, 3.2)) return;
        // Fallback: the original heart model remains available if the sprite fails to load.
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(rotation);
        ctx.save();
        let heartSize = size * 1.0;
        ctx.fillStyle = flash ? "#ffffff" : "#dce8ed";
        ctx.shadowColor = "#88ddff"; ctx.shadowBlur = flash ? 30 : 15;
        ctx.beginPath();
        ctx.moveTo(0, heartSize * 0.7);
        ctx.bezierCurveTo(-heartSize * 1.4, -heartSize * 0.2, -heartSize * 0.7, -heartSize * 1.1, 0, -heartSize * 0.4);
        ctx.bezierCurveTo(heartSize * 0.7, -heartSize * 1.1, heartSize * 1.4, -heartSize * 0.2, 0, heartSize * 0.7);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 2.8; ctx.stroke();
        ctx.restore();
        let s = size / 32;
        ctx.save();
        ctx.translate(0, -size * 0.95);
        ctx.fillStyle = "#F5F5F5";
        ctx.beginPath();
        ctx.moveTo(-18 * s, -3 * s); ctx.quadraticCurveTo(0, -20 * s, 18 * s, -3 * s);
        ctx.lineTo(13 * s, -1 * s); ctx.quadraticCurveTo(0, -13 * s, -13 * s, -1 * s); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-17 * s, -2 * s); ctx.quadraticCurveTo(0, -18 * s, 17 * s, -2 * s); ctx.stroke();
        ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(0, -11 * s, 3.5 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(-1.2 * s, -11.5 * s, 0.9 * s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(1.2 * s, -11.5 * s, 0.9 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-1.5 * s, -9 * s, 3 * s, 1 * s);
        ctx.restore();
        ctx.save();
        ctx.translate(0, size * 0.1);
        ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-1 * s, 0); ctx.bezierCurveTo(-10 * s, -1 * s, -26 * s, -1 * s, -28 * s, -10 * s);
        ctx.bezierCurveTo(-25 * s, -13 * s, -18 * s, -8 * s, -12 * s, -5 * s);
        ctx.bezierCurveTo(-7 * s, -3 * s, -3 * s, -1 * s, -1 * s, -1 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(1 * s, 0); ctx.bezierCurveTo(10 * s, -1 * s, 26 * s, -1 * s, 28 * s, -10 * s);
        ctx.bezierCurveTo(25 * s, -13 * s, 18 * s, -8 * s, 12 * s, -5 * s);
        ctx.bezierCurveTo(7 * s, -3 * s, 3 * s, -1 * s, 1 * s, -1 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.translate(0, -size * 0.15);
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(-4 * s, 0, 1.3 * s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4 * s, 0, 1.3 * s, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.restore();
    }

    // ============================================================
    // ВЫДАЧА НАГРАД
    // ============================================================
    function grantRogerReward() {
        console.log("[ROGER-WB] Сабля Роджера");
        try {
            if (typeof showFloatingText === 'function') showFloatingText("🗡️ САБЛЯ РОДЖЕРА!", "#ffd700");
            var rogerSaber = {
                id: "roger_saber", name: "Сабля Роджера", icon: "🗡️",
                rarity: "Легендарная", rarityClass: "legendary", tier: 5,
                damageMult: 2.2, shootRate: 10, bullets: 1, isMelee: true,
                desc: "Сабля Короля Пиратов. Прочная, острая, с историей.",
                recipe: {}, isReward: true,
                uid: Date.now() + Math.random() + Math.random(), craftedAt: Date.now()
            };
            if (typeof window !== 'undefined' && typeof window.getWeaponStorage === 'function') {
                var storage = window.getWeaponStorage();
                if (storage && Array.isArray(storage)) {
                    var alreadyHas = false;
                    for (var i = 0; i < storage.length; i++) {
                        if (storage[i] && storage[i].id === "roger_saber") { alreadyHas = true; break; }
                    }
                    if (!alreadyHas) storage.push(rogerSaber);
                }
            }
            if (typeof window.saveCraftingData === 'function') window.saveCraftingData();
            if (typeof window.renderInventory === 'function') setTimeout(window.renderInventory, 100);
        } catch(e) { console.error("[ROGER-WB] Ошибка Сабли:", e); }
        setTimeout(function() { if (typeof showFloatingText === 'function') showFloatingText("Проверь хранилище!", "#88ddff"); }, 1500);
    }

    function grantWhitebeardReward() {
        console.log("[ROGER-WB] Белоус");
        try {
            if (typeof showFloatingText === 'function') showFloatingText("🌊 БЕЛОУС В КОМАНДЕ!", "#ffffff");
            var alreadyHave = false;
            if (typeof myCards !== 'undefined' && Array.isArray(myCards)) {
                for (var i = 0; i < myCards.length; i++) {
                    if (myCards[i] && myCards[i].name === "Белоус") { alreadyHave = true; break; }
                }
            }
            if (alreadyHave) { if (typeof showFloatingText === 'function') showFloatingText("Карта уже есть!", "#ffaa00"); return; }
            var card = {
                id: Date.now() + Math.random() * 10000, name: "Белоус", rarity: "Секретная",
                damage: 400, hp: 250, sellPrice: 800, speed: 2.0,
                ability: { type: "whitebeardSpecial", desc: "3% воскрешение | 1% HP/волна | 2% x5 комбо" },
                universe: "One Piece", unsellable: true, minRebirth: 0,
                statusAbility: null, extraStatus: null, superAbility: null,
                mastery: 1, masteryExp: 0
            };
            if (typeof myCards !== 'undefined' && Array.isArray(myCards)) myCards.push(card);
            if (typeof discoveredCards !== 'undefined' && !discoveredCards.includes("Белоус")) discoveredCards.push("Белоус");
            if (typeof sfxCardObtain === 'function') sfxCardObtain();
            if (typeof renderMyCards === 'function') setTimeout(renderMyCards, 200);
        } catch(e) { console.error("[ROGER-WB] Ошибка Белоуса:", e); }
    }

    function rwbFinalCleanup() {
        if (typeof window!=="undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===1000) {
            if (rwbWatchdog) { clearTimeout(rwbWatchdog); rwbWatchdog = null; }
            try { stopRogerWhitebeardFight(); } catch(e) {}
            if(typeof window.MBBossTestFinish==="function")window.MBBossTestFinish("win",true);
            return;
        }
        if (rwbWatchdog) { clearTimeout(rwbWatchdog); rwbWatchdog = null; }
        try {
            if (!rwbRewardGiven && rwbWinner) {
                rwbRewardGiven = true;
                if (rwbWinner === "roger") grantRogerReward();
                else if (rwbWinner === "whitebeard") grantWhitebeardReward();
            }
        } catch(e) { console.error("[ROGER-WB] Ошибка награды:", e); }
        try {
            if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
                if (!defeatedBosses.includes(1000)) defeatedBosses.push(1000);
            }
        } catch(e) {}
        try { if (typeof saveAll === 'function') saveAll(); } catch(e) {}
        rwbState = "done";
        if (typeof window.MBUniqueBossFightFinish === "function") window.MBUniqueBossFightFinish("roger_whitebeard", "win");
        rwbDialogActive = false;
        if (typeof resetAllSupers === 'function') { try { resetAllSupers(); } catch(e) {} }
        rwbSupersInitialized = false;
        if (typeof window !== 'undefined') window._uniqueSuperBossId = null;
        try { stopRogerWhitebeardFight(); } catch(e) {}
        try { if (typeof currentEnemy !== 'undefined' && currentEnemy) currentEnemy.hp = 0; } catch(e) {}
        try { if (typeof victory === 'function') victory(); } catch(e) {}
    }

    function startRWBDialog() {
        rwbDialogActive = true; rwbDialogTimer = 0;
        if (rwbWinner === "roger") {
            rwbDialogType = "roger"; rwbDialogStage = 0;
        } else if (rwbWinner === "whitebeard") {
            rwbDialogType = "whitebeard"; rwbWBPhase = "intro";
            rwbWhitebeardDisabled = [false, false, false];
            rwbDialogQueue = RWB_WHITEBEARD_DIALOG_INITIAL.slice();
        }
    }

    function handleRogersDialogClick() {
        rwbDialogStage++;
        playWhooshSound(0.1);
        if (rwbDialogStage >= RWB_ROGER_DIALOG.length) { rwbDialogActive = false; rwbFinalCleanup(); }
    }

    function handleOdenDeathDialogClick() {
        if (!rwbDialogActive || rwbDialogType !== "oden_death") return;
        rwbDialogStage++;
        playWhooshSound(0.12);
        if (rwbDialogStage >= RWB_ODEN_DEATH_DIALOG.length) {
            rwbDialogActive = false;
            rwbDialogType = null;
            rwbDialogTimer = 0;
        }
    }

    function handleWhitebeardDialogClick(ev) {
        if (rwbDialogQueue.length > 0) {
            rwbDialogQueue.shift(); playWhooshSound(0.1);
            if (rwbDialogQueue.length === 0) {
                if (rwbWBPhase === "choice_response_1") {
                    if (!rwbWhitebeardDisabled[0]) {
                        rwbWhitebeardDisabled[0] = true;
                        if (typeof window.addItem === "function") window.addItem("server_block", 1);
                        if (typeof showFloatingText === "function") showFloatingText("🧱 Блок сервера получен!", "#7deaff");
                    }
                    rwbWBPhase = "choice";
                }
                else if (rwbWBPhase === "choice_response_2") {
                    try { localStorage.setItem("rwbWhitebeardFamilyAccepted", "yes"); } catch (e) {}
                    window.rwbWhitebeardFamilyAccepted = true;
                    rwbDialogActive = false;
                    rwbFinalCleanup();
                }
                else if (rwbWBPhase === "choice_response_3_a") { rwbWBPhase = "choice_response_3_b"; rwbDialogQueue = RWB_WB_RESPONSE_3_B.slice(); }
                else if (rwbWBPhase === "choice_response_3_b") {
                    rwbWhitebeardDisabled[2] = true;
                    rwbWBPhase = "choice";
                }
                else if (rwbWBPhase === "intro") { rwbWBPhase = "choice"; }
            }
            return;
        }
        if (rwbWBPhase === "choice") {
            var rect = canvas.getBoundingClientRect();
            var mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
            var btnW = 360, btnX = 20, startY = 240, btnH = 60, gap = 10;
            for (var i = 0; i < 3; i++) {
                if (rwbWhitebeardDisabled[i]) continue;
                var by = startY + i * (btnH + gap);
                if (mx > btnX && mx < btnX + btnW && my > by && my < by + btnH) {
                    if (i === 0) { rwbWBPhase = "choice_response_1"; rwbDialogQueue = RWB_WB_RESPONSE_1.slice(); }
                    else if (i === 1) { rwbWBPhase = "choice_response_2"; rwbDialogQueue = RWB_WB_RESPONSE_2.slice(); }
                    else if (i === 2) { rwbWBPhase = "choice_response_3_a"; rwbDialogQueue = RWB_WB_RESPONSE_3_A.slice(); }
                    playBladeSound(0.3);
                    return;
                }
            }
        }
    }

    // ============================================================
    // ★★★ КОНТЕКСТ ДЛЯ SUPERS.JS — ЕДИНЫЙ С rwbSpeedMult ★★★
    // ============================================================
    window.getRWBContext = function() {
        return {
            type: 'rwb',
            getHeartX: function() { return rwbPlayer ? rwbPlayer.x : 200; },
            setHeartX: function(v) { if (rwbPlayer) rwbPlayer.x = Math.max(16, Math.min(384, v)); },
            getHeartY: function() { return rwbPlayer ? rwbPlayer.y : 400; },
            setHeartY: function(v) { if (rwbPlayer) rwbPlayer.y = Math.max(0, Math.min(484, v)); },
            getHeartSize: function() { return 12; },
            setHeartSize: function(v) { /* размер сердца фиксирован */ },
            getHeartHitbox: function() { return 6; },
            setHeartHitbox: function(v) { /* хитбокс фиксирован */ },
            getHeartSpeed: function() { return rwbBaseSpeed * rwbSpeedMult; },
            setHeartSpeed: function(v) {
                // Устанавливаем множитель так, чтобы итоговая скорость = v
                if (rwbBaseSpeed > 0) {
                    rwbSpeedMult = v / rwbBaseSpeed;
                }
            },
            getAttacks: function() { return rwbAttacks; },
            getBlasters: function() { return []; },
            getParticles: function() { return rwbParticles; },
            getBossMaxHp: function() { return rwbActiveBoss ? rwbActiveBoss.maxHp : 500; },
            setBossMaxHp: function(v) { if (rwbActiveBoss) rwbActiveBoss.maxHp = v; },
            getBossHp: function() { return rwbActiveBoss ? rwbActiveBoss.hp : 0; },
            getPlayerHp: function() { return rwbPlayer ? rwbPlayer.hp : 250; },
            setPlayerHp: function(v) { if (rwbPlayer) rwbPlayer.hp = v; },
            getPlayerMaxHp: function() { return rwbPlayer ? rwbPlayer.maxHp : 250; },
            addShake: function(v) { rwbShake = Math.max(rwbShake || 0, v); },
            addFlash: function(v, color) { rwbScreenFlash = v; if (color) rwbScreenFlashColor = color; },
            addFlashWhite: function(v) { rwbScreenFlash = Math.max(rwbScreenFlash, v); rwbScreenFlashColor = "#ffffff"; },
            spawnFloatingText: function(x, y, text, color) { if (typeof window.spawnFloatingText === 'function') window.spawnFloatingText(x, y, text, color); },
            playSound: function(f, t, d, v) { if (typeof window.rwbSound === 'function') window.rwbSound(f, t, d, v); },
            addShockwave: function(x, y, color, speed, life, width) {
                rwbShockwaves.push({ x: x, y: y, radius: 10, maxRadius: 200, speed: speed, color: color, life: life, maxLife: life, width: width || 4 });
            },
            clampHeart: function() {},
            isDodgePhase: function() { return false; },
            // ★ Для Анти-спирали: доступ к исходной скорости ★
            getBaseSpeed: function() { return rwbBaseSpeed; },
            setBaseSpeed: function(v) { rwbBaseSpeed = v; }
        };
    };

    window.isRWBActive = function() { return window.rwbActive === true; };

    function rwbSound(freq, type, dur, vol) { if (typeof playArenaSound === 'function') playArenaSound(freq, type, dur, vol); }

    function spawnHakiLightning(x, y, count, isWhite) {
        if (isRWBMobileGraphics()) return;
        if (rwbHakiLightnings.length > 20) return;
        if (!count) count = 1;
        count = Math.min(count, 2);
        for (let i = 0; i < count; i++) {
            let ang = Math.random() * Math.PI * 2;
            let len = 20 + Math.random() * 35;
            let lightning = {
                x1: x, y1: y, x2: x + Math.cos(ang) * len, y2: y + Math.sin(ang) * len,
                points: [], life: 10, maxLife: 10,
                outerColor: "#000000", innerColor: isWhite ? "#ffffff" : "#ff2222",
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
        if (isRWBMobileGraphics()) return;
        if (!count) count = 3;
        count = Math.min(count, 4);
        for (let i = 0; i < count; i++) {
            let side = i % 2 === 0 ? -1 : 1;
            let startX = bossX + side * (25 + Math.random() * 15);
            let startY = bossY + (Math.random() - 0.5) * 50;
            rwbWhiteCracks.push({
                x: startX, y: startY,
                angle: (side === -1 ? Math.PI : 0) + (Math.random() - 0.5) * 0.5,
                length: 35 + Math.random() * 45, width: 2, life: 25, maxLife: 25
            });
        }
    }

    function spawnPurpleCracks(centerX, centerY, count) {
        if (isRWBMobileGraphics()) return;
        if (!count) count = 8;
        for (let i = 0; i < count; i++) {
            let ang = (i / count) * Math.PI * 2 + Math.random() * 0.3;
            let len = 80 + Math.random() * 120;
            rwbPurpleCracks.push({
                x: centerX, y: centerY, angle: ang, length: len,
                width: 3 + Math.random() * 2, life: 60, maxLife: 60,
                branches: [], seed: Math.random() * 1000
            });
        }
    }

    function drawPurpleCracks() {
        if (!ctx || rwbPurpleCracks.length === 0) return;
        for (let i = rwbPurpleCracks.length - 1; i >= 0; i--) {
            let crack = rwbPurpleCracks[i];
            crack.life--;
            if (crack.life <= 0) { rwbPurpleCracks.splice(i, 1); continue; }
            let alpha = crack.life / crack.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#aa00ff"; ctx.lineWidth = crack.width;
            ctx.shadowColor = "#cc44ff"; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.moveTo(crack.x, crack.y);
            let cx = crack.x, cy = crack.y, ang = crack.angle;
            let segLen = crack.length / 5;
            for (let s = 0; s < 5; s++) {
                ang += (Math.random() - 0.5) * 0.35;
                cx += Math.cos(ang) * segLen; cy += Math.sin(ang) * segLen;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = crack.width * 0.4; ctx.shadowBlur = 10; ctx.stroke();
            ctx.restore();
        }
    }

    function drawWhiteCracks() {
        if (!ctx || rwbWhiteCracks.length === 0) return;
        for (let i = rwbWhiteCracks.length - 1; i >= 0; i--) {
            let crack = rwbWhiteCracks[i];
            crack.life--;
            if (crack.life <= 0) { rwbWhiteCracks.splice(i, 1); continue; }
            let alpha = crack.life / crack.maxLife;
            ctx.save(); ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = crack.width;
            ctx.beginPath(); ctx.moveTo(crack.x, crack.y);
            let cx = crack.x, cy = crack.y, ang = crack.angle;
            let segLen = crack.length / 4;
            for (let s = 0; s < 4; s++) {
                ang += (Math.random() - 0.5) * 0.4;
                cx += Math.cos(ang) * segLen; cy += Math.sin(ang) * segLen;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke(); ctx.restore();
        }
    }

    function getRWBOdenConsentKey() {
        var slot = "default";
        try {
            var savedSlot = localStorage.getItem("cgV20_lastSlot");
            if (savedSlot && String(savedSlot).length <= 64) slot = String(savedSlot);
        } catch (e) {}
        return "rwb_oden_ally_decision_v1_" + slot;
    }

    function getRWBOdenConsent() {
        var key = getRWBOdenConsentKey();
        try {
            var saved = localStorage.getItem(key);
            if (saved === "yes" || saved === "no") return saved;
        } catch (e) {}
        return rwbOdenConsentMemory[key] || "";
    }

    function setRWBOdenConsent(value) {
        var key = getRWBOdenConsentKey();
        rwbOdenConsentMemory[key] = value === "yes" ? "yes" : "no";
        try { localStorage.setItem(key, rwbOdenConsentMemory[key]); } catch (e) {}
    }

    function resolveRWBOdenOffer(accept) {
        if (!rwbDialogActive || rwbDialogType !== "oden_offer") return;
        setRWBOdenConsent(accept ? "yes" : "no");
        rwbOdenOfferShown = true;
        rwbDialogActive = false;
        rwbDialogType = null;
        rwbDialogQueue = [];
        rwbEndTimer = 180;
        rwbFloatingTexts.push({
            x: 200, y: 185,
            text: accept ? "ОДЭН: ДОГОВОРИЛИСЬ. В СЛЕДУЮЩЕМ БОЮ Я ПРИКРОЮ ТЕБЯ!" : "ОДЭН: Я СПРОШУ ЕЩЁ РАЗ ПОТОМ.",
            color: accept ? "#ffe26a" : "#c79cff",
            life: 64, maxLife: 64, vy: -0.35, vx: 0, size: 11
        });
        playWhooshSound(0.12);
    }

    function handleRWBOdenOfferClick(ev) {
        if (!canvas || !ev) return;
        var rect = canvas.getBoundingClientRect();
        var mx = (ev.clientX - rect.left) * 400 / Math.max(1, rect.width);
        var my = (ev.clientY - rect.top) * 500 / Math.max(1, rect.height);
        if (mx < 18 || mx > 382) return;
        if (my >= 320 && my <= 382) resolveRWBOdenOffer(true);
        else if (my >= 390 && my <= 454) resolveRWBOdenOffer(false);
    }

    // ============================================================
    // СТАРТ БОЯ
    // ============================================================
    function startRogerWhitebeardFight(graphicsModeChoice) {
        if (window.rwbActive) return;
        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(1000)) {
            if (typeof showFloatingText === 'function') showFloatingText("⏭️ Босс уже побеждён!", "#ffaa00");
            return;
        }
        hideRWBGraphicsButton();
        if (graphicsModeChoice !== "full" && graphicsModeChoice !== "light" &&
            typeof window.MBChooseBossGraphicsMode === "function") {
            window.MBChooseBossGraphicsMode("Роджер vs Белоус", function(mode) {
                startRogerWhitebeardFight(mode);
            });
            return;
        }
        if ((graphicsModeChoice === "full" || graphicsModeChoice === "light") &&
            typeof window.MBSetBossGraphicsModeForFight === "function") {
            window.MBSetBossGraphicsModeForFight(graphicsModeChoice);
        }
        console.log("[ROGER-WB] Старт боя v19.0!");

        window.rwbActive = true;
        if (typeof window.MBUniqueBossFightStart === "function") window.MBUniqueBossFightStart("roger_whitebeard");
        rwbState = "intro"; rwbTimer = 0; rwbIntroTimer = 0;
        rwbTransitionTimer = 0; rwbEndTimer = 0; rwbSurvivalTimer2 = 0;
        rwbTitanFistTimer = 0; rwbTitanRockTimer = 0;
        rwbSuperReady = true; rwbSuperCooldown = 0; rwbMeleeCooldown = 0;
        rwbActiveBoss = null; rwbHakiAura = 0; rwbTsunamiActive = false;
        rwbWinner = null; rwbRewardGiven = false; rwbDialogStage = 0;
        rwbWhitebeardDisabled = [false, false, false]; rwbWBPhase = "intro";
        rwbDialogQueue = []; rwbDialogActive = false; rwbDialogType = null; rwbDialogTimer = 0;
        rwbOdenOfferShown = false;
        rwbOdenDeathDialogShown = false;
        wbBrain = { bottomFrames: 0, stationaryFrames: 0, farFrames: 0, shotsInWindow: 0, shotWindowTimer: 180, adaptiveCooldown: 0, lastX: 200, lastY: 420, playerVX: 0, playerVY: 0, lastAdaptive: null, lastAttackId: -1, lastSuperAttackId: -1, comboHint: null, phase: "idle", phaseTimer: 0, recoveryTimer: 0, plannedTargetX: 200, plannedTargetY: 360, plannedRockXs: [] };
        wbTrapCombo = { stage: "idle", timer: 0, cooldown: 300, targetX: 200, targetY: 380, pullTargetX: 200, pullTargetY: 300, startedAt: 0 };
        rwbPlayerStunTimer = 0; wbFruitFlashTimer = 0; wbFruitFlashPower = 0.72;
        if (rwbWatchdog) { clearTimeout(rwbWatchdog); rwbWatchdog = null; }

        // ★ СБРОС СКОРОСТИ ★
        rwbBaseSpeed = 4.5;
        rwbOriginalBaseSpeed = 4.5;
        rwbSpeedMult = 1.0;

        roger = {
            id: "roger", x: 80, y: 120, size: 28,
            hp: BALANCE.rogerHp, maxHp: BALANCE.rogerHp, superForm: false,
            vx: 1.2, vy: 0.8, pulse: 0, rotation: 0,
            attackTimer: 30, hitFlash: 0, meleeTimer: 0,
            name: "РОДЖЕР", color: "#ff8800", homeX: 80, homeY: 120
        };
        whitebeard = {
            id: "whitebeard", x: 320, y: 120, size: 32,
            hp: BALANCE.whitebeardHp, maxHp: BALANCE.whitebeardHp, superForm: false,
            vx: -1.0, vy: 0.6, pulse: 0, rotation: 0,
            attackTimer: 40, hitFlash: 0, damageFlashTimer: 0, meleeTimer: 0,
            name: "БЕЛОУС", color: "#ffffff", homeX: 320, homeY: 120
        };

        duel = { phase: "idle", timer: 0, clashX: 200, clashY: 200, clashes: 0 };
        rwbPlayer = {
            x: 200, y: 420, size: 12,
            hp: BALANCE.playerHp, maxHp: BALANCE.playerHp,
            invulnTimer: 0, attackMode: "normal",
            attackTimer: 0, shootRate: 10,
            vx: 0, vy: 0
        };
        var odenConsent = getRWBOdenConsent();
        var odenAvailable = odenConsent === "yes";
        rwbOden = {
            available: odenAvailable,
            x: 166, y: 372, size: 15, phase: 0,
            hp: 125, maxHp: 125, alive: odenAvailable, invulnTimer: 0,
            vx: 0, vy: 0, moveTargetX: 255, moveTargetY: 205,
            wanderTimer: 42, dodgeCooldown: 0, dodgeFlashTimer: 0,
            aiSkill: 0.62, hakiAwakened: true, lastBreath: false,
            tsunamiEvading: false, tsunamiPulled: false, tsunamiExitBlock: null, stunTimer: 0,
            dodgePlanTimer: 0, lastThreatAttack: null, attackAngle: -Math.PI / 3,
            attackCooldown: 8, windup: 0, swingTimer: 0,
            swordAngle: -Math.PI / 3, targetId: null, hitFlash: 0,
            healState: "idle", healTimer: 0, healCooldown: 0, healCooldownUntil: 0,
            healTotal: 0, healRemaining: 0, healSide: 1,
            companionMode: "guard", companionModeTimer: 115, companionSide: -1,
            companionOffsetX: 0, companionOffsetY: 0, footworkPhase: Math.random() * Math.PI * 2,
            blueModeTimer: 0, blueModeCooldown: 0, blueModeFlashTimer: 0, blueModeCheckTimer: 0
        };
        rwbOdenSlashes = [];
        rwbOdenLastTargetId = null;
        rwbPlayerFocusTargetId = null;

        rwbAttacks = []; rwbPlayerBullets = []; rwbParticles = []; rwbShockwaves = [];
        wbBrain.phase = "idle"; wbBrain.phaseTimer = 0; wbBrain.recoveryTimer = 0;
        rwbFloatingTexts = []; rwbSpeedLines = []; rwbHakiLightnings = [];
        rwbWhiteCracks = []; rwbPurpleCracks = []; rwbScreenFlash = 0; rwbShake = 0; rwbBgStars = [];
        wbVortexElapsedMs = 0; wbVortexClockAt = 0; wbVortexActive = false; wbVortexTimerLeft = 0; wbVortexPoints = []; wbVortexNextPoint = 0; wbVortexFailed = false; wbVortexPullStrength = 0;

        initIslandBackground(); startRWBMusic(); initRWBAudio();

        try {
            if (typeof initSuperState === 'function') initSuperState();
            if (typeof window !== 'undefined') {
                window._uniqueSuperCharges = 5;
                window._uniqueSuperBossId = 'rwb';
            }
            rwbSupersInitialized = true;
            console.log("[ROGER-WB] ✅ Суперы инициализированы (5 зарядов)");
            if (typeof updateSuperButton === 'function') setTimeout(updateSuperButton, 100);
        } catch(e) {
            console.error("[ROGER-WB] Ошибка initSuperState:", e);
        }

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

        ['superBtn2', 'superBtnDeactivate', 'startArenaBtn', 'skipBossBtn', 'spareBtn', 'startLivingStoneBtn', 'startWaystarBtn', 'startRogerWB'].forEach(function(id) {
            let el = document.getElementById(id);
            if (el) el.style.display = "none";
        });

        let superBtn = document.getElementById("superBtn");
        if (superBtn) {
            superBtn.style.display = "block";
            setTimeout(function() {
                if (typeof updateSuperButton === 'function') updateSuperButton();
            }, 200);
        }
        // Старую отдельную RWB-кнопку больше не используем.
        hideRWBSuperButton();

        canvas.addEventListener("click", handleRWBClick);
        canvas.addEventListener("touchstart", handleRWBTouchStart, { passive: false });
        canvas.addEventListener("touchmove", handleRWBTouchMove, { passive: false });
        canvas.addEventListener("touchend", handleRWBTouchEnd);
        canvas.addEventListener("touchcancel", handleRWBTouchEnd);
        window.addEventListener("keydown", handleRWBKeyDown);
        window.addEventListener("keyup", handleRWBKeyUp);

        createRWBModeButton(); showRWBModeButton();
        hideRWBGraphicsButton();

        if (rwbAnimFrame) cancelAnimationFrame(rwbAnimFrame);
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);

        playWhooshSound(0.3);
        setTimeout(function() { playBossRoarSound(0.3); }, 500);
    }

    let islandBg = null;

    function initIslandBackground() {
        islandBg = { clouds: [], birds: [], waveLines: [] };
        for (let i = 0; i < 6; i++) islandBg.clouds.push({ x: Math.random() * 400, y: 40 + Math.random() * 100, size: 30 + Math.random() * 40, speed: 0.08 + Math.random() * 0.15, alpha: 0.3 + Math.random() * 0.3 });
        for (let i = 0; i < 4; i++) islandBg.birds.push({ x: Math.random() * 400, y: 60 + Math.random() * 80, speed: 0.3 + Math.random() * 0.4, wingPhase: Math.random() * Math.PI * 2, size: 4 + Math.random() * 3 });
        for (let i = 0; i < 8; i++) islandBg.waveLines.push({ y: 320 + i * 8, offset: Math.random() * 100, speed: 0.15 + Math.random() * 0.2, length: 30 + Math.random() * 40 });
    }

    function drawIslandBackground() {
        if (!islandBg) initIslandBackground();
        // На телефоне фон остаётся полноценным, но без анимированных мелких деталей.
        let skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
        skyGrad.addColorStop(0, "#0d1b3d"); skyGrad.addColorStop(0.3, "#2d2a5c");
        skyGrad.addColorStop(0.55, "#8b3a5c"); skyGrad.addColorStop(0.75, "#e8794a");
        skyGrad.addColorStop(0.9, "#f5af19"); skyGrad.addColorStop(1, "#ffd97a");
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, 400, 320);
        ctx.save();
        let sunX = 300, sunY = 290;
        let sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 50);
        sunGrad.addColorStop(0, "#ffffff"); sunGrad.addColorStop(0.2, "#fff4c4");
        sunGrad.addColorStop(0.5, "rgba(245, 175, 25, 0.8)"); sunGrad.addColorStop(1, "rgba(245, 175, 25, 0)");
        ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(sunX, sunY, 50, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff8dc"; ctx.beginPath(); ctx.arc(sunX, sunY, 18, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (islandBg && !isRWBMobileGraphics()) {
            for (let cloud of islandBg.clouds) {
                cloud.x += cloud.speed;
                if (cloud.x > 450) cloud.x = -50;
                ctx.save(); ctx.globalAlpha = cloud.alpha; ctx.fillStyle = "rgba(255, 200, 150, 0.9)";
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.5, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.9, cloud.y, cloud.size * 0.55, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.4, cloud.y + cloud.size * 0.15, cloud.size * 0.45, 0, Math.PI * 2);
                ctx.fill(); ctx.restore();
            }
        }
        if (islandBg && !isRWBMobileGraphics()) {
            for (let bird of islandBg.birds) {
                bird.x += bird.speed; bird.wingPhase += 0.15;
                if (bird.x > 450) bird.x = -50;
                ctx.save(); ctx.strokeStyle = "rgba(30, 20, 40, 0.7)"; ctx.lineWidth = 1.5;
                let wingOffset = Math.sin(bird.wingPhase) * 2;
                ctx.beginPath();
                ctx.moveTo(bird.x - bird.size, bird.y + wingOffset);
                ctx.quadraticCurveTo(bird.x, bird.y - bird.size * 0.5, bird.x + bird.size, bird.y + wingOffset);
                ctx.stroke(); ctx.restore();
            }
        }
        let seaGrad = ctx.createLinearGradient(0, 320, 0, 420);
        seaGrad.addColorStop(0, "#f5a623"); seaGrad.addColorStop(0.3, "#3a6ea5");
        seaGrad.addColorStop(0.7, "#1e3a5f"); seaGrad.addColorStop(1, "#0a1a2e");
        ctx.fillStyle = seaGrad; ctx.fillRect(0, 320, 400, 100);
        ctx.save(); ctx.globalAlpha = 0.5;
        let reflGrad = ctx.createRadialGradient(sunX, 330, 0, sunX, 360, 60);
        reflGrad.addColorStop(0, "rgba(255, 240, 200, 0.8)"); reflGrad.addColorStop(1, "rgba(255, 200, 100, 0)");
        ctx.fillStyle = reflGrad; ctx.beginPath(); ctx.ellipse(sunX, 340, 40, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (islandBg && !isRWBMobileGraphics()) {
            ctx.save();
            for (let wave of islandBg.waveLines) {
                wave.offset += wave.speed;
                if (wave.offset > 200) wave.offset = -100;
                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"; ctx.lineWidth = 1.5;
                for (let x = wave.offset - 100; x < 450; x += 80) {
                    ctx.beginPath();
                    ctx.moveTo(x, wave.y);
                    ctx.quadraticCurveTo(x + wave.length * 0.5, wave.y - 2, x + wave.length, wave.y);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
        let groundGrad = ctx.createLinearGradient(0, 420, 0, 500);
        groundGrad.addColorStop(0, "#d4a574"); groundGrad.addColorStop(0.5, "#a87a4a"); groundGrad.addColorStop(1, "#5a3a20");
        ctx.fillStyle = groundGrad; ctx.fillRect(0, 420, 400, 80);
        drawPalmTree(30, 420, 1.0); drawPalmTree(370, 420, 0.9);
        ctx.fillStyle = "#5a4530"; ctx.beginPath(); ctx.ellipse(150, 470, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#4a3520"; ctx.beginPath(); ctx.ellipse(250, 485, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#3a5a2a"; ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            let gx = (i * 21) % 400, gy = 430 + (i * 7) % 40;
            ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 8);
            ctx.moveTo(gx, gy); ctx.lineTo(gx + 2, gy - 10);
            ctx.moveTo(gx, gy); ctx.lineTo(gx + 5, gy - 6); ctx.stroke();
        }
    }

    function drawPalmTree(x, baseY, scale) {
        ctx.save(); ctx.translate(x, baseY); ctx.scale(scale, scale);
        ctx.strokeStyle = "#4a2f1a"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5, -40, 5, -90); ctx.stroke();
        ctx.fillStyle = "#2d5a2d"; ctx.strokeStyle = "#1a3a1a"; ctx.lineWidth = 1;
        let leafAngles = [-2.5, -2.0, -1.5, -1.0, -0.5, 0, 0.5];
        for (let ang of leafAngles) {
            ctx.save(); ctx.translate(5, -90); ctx.rotate(ang);
            ctx.beginPath(); ctx.ellipse(25, 0, 25, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        ctx.fillStyle = "#3a2a10";
        ctx.beginPath();
        ctx.arc(0, -88, 3, 0, Math.PI * 2);
        ctx.arc(-4, -85, 3, 0, Math.PI * 2);
        ctx.arc(4, -85, 3, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
    }

    function hideRWBGraphicsButton() {
        if (rwbGraphicsBtn && rwbGraphicsBtn.parentNode) rwbGraphicsBtn.parentNode.removeChild(rwbGraphicsBtn);
        rwbGraphicsBtn = null;
        var staleButton = document.getElementById("rwbGraphicsBtn");
        if (staleButton) staleButton.remove();
    }

    function updateRWBModeButton() {
        if (!rwbModeBtn) return;
        var blueMode = !!(rwbPlayer && rwbPlayer.attackMode === "blue");
        rwbModeBtn.textContent = blueMode ? "🔵 СИНИЙ: АВТО-ПРИЦЕЛ" : "🟡 ЖЁЛТЫЙ: ОБЫЧНЫЙ";
        rwbModeBtn.style.background = blueMode
            ? "linear-gradient(135deg, #00aaff, #0044cc)"
            : "linear-gradient(135deg, #ffdd00, #ff8800)";
        rwbModeBtn.style.color = blueMode ? "#ffffff" : "#1a1a2e";
        rwbModeBtn.style.borderColor = blueMode ? "#b8f3ff" : "#fff3a0";
        rwbModeBtn.style.boxShadow = blueMode
            ? "0 3px 10px rgba(0,170,255,.45)"
            : "0 3px 10px rgba(255,136,0,.4)";
        rwbModeBtn.setAttribute("aria-pressed", blueMode ? "true" : "false");
    }

    function createRWBModeButton() {
        if (!rwbModeBtn) {
            rwbModeBtn = document.createElement("button");
            rwbModeBtn.id = "rwbModeBtn";
            // This is a normal item in the arena's wrapping button row, not an overlay
            // with fixed coordinates. It therefore cannot cover SUPER on small screens.
            rwbModeBtn.style.cssText = [
                "position:relative", "display:inline-flex", "align-items:center",
                "justify-content:center", "flex:0 1 auto", "max-width:100%",
                "min-width:0", "min-height:40px", "box-sizing:border-box",
                "margin:0", "padding:8px 14px", "border-radius:14px",
                "background:linear-gradient(135deg,#ffdd00,#ff8800)",
                "color:#1a1a2e", "font-weight:900", "font-size:13px",
                "font-family:\"Nunito\",sans-serif", "border:2px solid #fff",
                "cursor:pointer", "letter-spacing:.2px", "white-space:nowrap",
                "user-select:none", "touch-action:manipulation"
            ].join(";");
            rwbModeBtn.onclick = function(e) {
                e.preventDefault(); e.stopPropagation();
                if (!rwbPlayer) return;
                rwbPlayer.attackMode = rwbPlayer.attackMode === "normal" ? "blue" : "normal";
                if (rwbPlayer.attackMode === "blue" &&
                    rwbOden && rwbOden.alive && rwbOden.available &&
                    rwbState.indexOf("fight") === 0) {
                    rwbOdenActivateBlueMode(rwbOden, true);
                }
                updateRWBModeButton();
                playWhooshSound(0.15);
            };
        }

        // Put the mode toggle beside SUPER. The arena's existing flex row wraps
        // naturally on phones, so neither control can overlap the other.
        var superButton = document.getElementById("superBtn");
        var controlsRow = superButton && superButton.parentElement;
        if (controlsRow && rwbModeBtn.parentElement !== controlsRow) {
            controlsRow.insertBefore(rwbModeBtn, superButton);
        } else if (!controlsRow && !rwbModeBtn.parentNode) {
            document.body.appendChild(rwbModeBtn);
        }
        updateRWBModeButton();
    }

    function getRWBMainCard() {
        try {
            if (typeof getMainCard === "function") return getMainCard();
            if (typeof team !== "undefined" && typeof mainCardIndex !== "undefined" && team.length > 0 && typeof myCards !== "undefined") {
                var idx = team[mainCardIndex];
                return (idx >= 0 && idx < myCards.length) ? myCards[idx] : null;
            }
        } catch(e) {}
        return null;
    }

    function updateRWBMainSuperButton() {
        if (!rwbSuperBtn) return;
        var card = getRWBMainCard();
        if (!card) return;
        if (card.name === "Белоус" && typeof window._superState !== "undefined") {
            var st = window._superState;
            if (st.whitebeardTsunamiPending > 0) {
                rwbSuperBtn.innerHTML = '⏳ ЦУНАМИ (' + st.whitebeardTsunamiPending.toFixed(1) + 'с)';
                rwbSuperBtn.style.opacity = '0.55';
            } else if (st.whitebeardSkillWindow > 0 && st.whitebeardSkillMode === "tsunami" && !st.whitebeardTsunamiUsed) {
                rwbSuperBtn.innerHTML = '🌊 ЦУНАМИ (' + Math.ceil(st.whitebeardSkillWindow) + 'с)';
                rwbSuperBtn.style.opacity = '1';
            } else if (st.whitebeardSkillCooldown > 0) {
                rwbSuperBtn.innerHTML = '⏳ УДАР (' + Math.ceil(st.whitebeardSkillCooldown) + 'с)';
                rwbSuperBtn.style.opacity = '0.55';
            } else if (st.whitebeardSkillTsunamiActive) {
                rwbSuperBtn.innerHTML = '🌊 ЦУНАМИ ИДЁТ';
                rwbSuperBtn.style.opacity = '0.55';
            } else {
                rwbSuperBtn.innerHTML = '⚡ SUPER: БЕЛОУС';
                rwbSuperBtn.style.opacity = '1';
            }
            return;
        }
        if (typeof rwbSuperReady !== "undefined" && rwbSuperReady) {
            rwbSuperBtn.style.opacity = '1';
            rwbSuperBtn.innerHTML = '⚡ СУПЕР';
        }
    }

    function createRWBSuperButton() {
        if (rwbSuperBtn) return;
        rwbSuperBtn = document.createElement('button');
        rwbSuperBtn.id = 'rwbSuperBtn';
        rwbSuperBtn.style.cssText = [
            'position: fixed', 'bottom: 20px', 'left: 50%', 'transform: translateX(-50%)',
            'padding: 10px 30px', 'border-radius: 30px',
            'background: linear-gradient(135deg, #f5af19, #f12711)',
            'color: #fff', 'font-weight: 900', 'font-size: 14px',
            'font-family: "Nunito", sans-serif', 'border: 3px solid #fff',
            'box-shadow: 0 4px 15px rgba(245, 175, 25, 0.7)',
            'cursor: pointer', 'z-index: 99999', 'letter-spacing: 0.5px',
            'user-select: none', 'touch-action: manipulation', 'transition: all 0.2s',
            'animation: superPulse 2s infinite'
        ].join(';');
        rwbSuperBtn.innerHTML = '⚡ СУПЕР';
        rwbSuperBtn.onclick = function(e) {
            e.preventDefault(); e.stopPropagation();
            activateRWBPlayerSuper();
        };
        document.body.appendChild(rwbSuperBtn);
    }

    function showRWBSuperButton() {
        if (typeof window!=="undefined" && window.__mbBossTestMode && window.__mbBossTestAbilityMode==="passive") { if(rwbSuperBtn)rwbSuperBtn.style.display="none"; return; }
        if (rwbSuperBtn) rwbSuperBtn.style.display = 'block';
    }
    function hideRWBSuperButton() { if (rwbSuperBtn) rwbSuperBtn.style.display = 'none'; }

    function activateRWBPlayerSuper() {
        if (!window.rwbActive) return;
        if (!rwbSuperReady) {
            if (typeof showFloatingText === 'function') showFloatingText("⏳ Кулдаун: " + Math.ceil(rwbSuperCooldown / 60) + "с", "#ffaa00");
            return;
        }
        let mainCard = null;
        try {
            if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) {
                let idx = team[mainCardIndex];
                if (idx >= 0 && idx < myCards.length) mainCard = myCards[idx];
            }
        } catch(e) {}
        if (!mainCard) { if (typeof showFloatingText === 'function') showFloatingText("Нет главной карты!", "#ff3333"); return; }
        if (typeof hasMasterySuper === 'function' && !hasMasterySuper(mainCard)) {
            if (typeof showFloatingText === 'function') showFloatingText("Нужно мастерство 5★!", "#ff3333");
            return;
        }
        if (mainCard.name === "Белоус" && typeof window.useWhitebeardSkill === "function") {
            try {
                window.useWhitebeardSkill();
                if (typeof updateRWBMainSuperButton === "function") updateRWBMainSuperButton();
                return;
            } catch(e) { console.warn("[ROGER-WB] Whitebeard skill error:", e); }
        }
        if (typeof window.toggleSuper === 'function') {
            try {
                window.toggleSuper();
                rwbSuperReady = false; rwbSuperCooldown = RWB_SUPER_COOLDOWN;
                if (typeof showFloatingText === 'function') showFloatingText("⚡ " + (mainCard.superAbility ? mainCard.superAbility.name : "СУПЕР!"), "#ffd700");
                playHakiChargeSound(0.4);
                return;
            } catch(e) { console.warn("[ROGER-WB] Supers error:", e); }
        }
        if (typeof showFloatingText === 'function') showFloatingText("⚡ СУПЕР!", "#ffd700");
        rwbSuperReady = false; rwbSuperCooldown = RWB_SUPER_COOLDOWN;
        playHakiChargeSound(0.4);
    }

    function showRWBModeButton() { if (rwbModeBtn) rwbModeBtn.style.display = 'block'; }
    function hideRWBModeButton() { if (rwbModeBtn) rwbModeBtn.style.display = 'none'; }

    function handleRWBKeyDown(ev) {
        if (!window.rwbActive) return;
        var key = String(ev.key || "").toLowerCase();
        if (rwbDialogActive && rwbDialogType === "oden_offer") {
            if (key === "enter" || key === "y") { ev.preventDefault(); resolveRWBOdenOffer(true); }
            else if (key === "escape" || key === "n") { ev.preventDefault(); resolveRWBOdenOffer(false); }
            return;
        }
        if (rwbDialogActive && rwbDialogType === "oden_death") {
            if (key === "enter" || key === " " || key === "spacebar") {
                ev.preventDefault(); handleOdenDeathDialogClick();
            }
            return;
        }
        rwbKeys[key] = true;
    }
    function handleRWBKeyUp(ev) { if (!window.rwbActive) return; rwbKeys[ev.key.toLowerCase()] = false; }

    function handleRWBTouchStart(ev) {
        if (!window.rwbActive) return;
        if (wbVortexActive) {
            ev.preventDefault();
            if (ev.touches.length > 0) handleWhitebeardVortexClick(ev.touches[0].clientX, ev.touches[0].clientY);
            return;
        }
        if (rwbDialogActive) {
            ev.preventDefault();
            if (ev.touches.length > 0) {
                var fakeEvent = { clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY };
                if (rwbDialogType === "roger") handleRogersDialogClick();
                else if (rwbDialogType === "whitebeard") handleWhitebeardDialogClick(fakeEvent);
                else if (rwbDialogType === "oden_offer") handleRWBOdenOfferClick(fakeEvent);
                else if (rwbDialogType === "oden_death") handleOdenDeathDialogClick();
            }
            return;
        }
        if (rwbState !== "fight1" && rwbState !== "fight2") return;
        if (window._joystick && window._joystick.enabled && window._joystick.active) return;
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
        if (window._joystick && window._joystick.enabled && window._joystick.active) return;
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

    function handleRWBClick(ev) {
        if (!window.rwbActive) return;
        if (wbVortexActive) { handleWhitebeardVortexClick(ev.clientX, ev.clientY); return; }
        if (rwbDialogActive && rwbDialogType === "roger") { handleRogersDialogClick(); return; }
        if (rwbDialogActive && rwbDialogType === "whitebeard") { handleWhitebeardDialogClick(ev); return; }
        if (rwbDialogActive && rwbDialogType === "oden_offer") { handleRWBOdenOfferClick(ev); return; }
        if (rwbDialogActive && rwbDialogType === "oden_death") { handleOdenDeathDialogClick(); return; }
    }

    // ============================================================
    // ★★★ ПРИМЕНЕНИЕ СУПЕР-МНОЖИТЕЛЕЙ УРОНА ★★★
    // ============================================================
    function applySuperDmgMult(baseDmg) {
        let dmg = baseDmg;
        if (typeof _superState !== 'undefined') {
            if (_superState.nikaActive && _superState.nikaDmgMult > 1) dmg = Math.floor(dmg * _superState.nikaDmgMult);
            if (_superState.dekusActive && _superState.dekusDmgMult > 1) dmg = Math.floor(dmg * _superState.dekusDmgMult);
            if (_superState.allmightBuffTimer > 0 && _superState.allmightDmgMult > 1) dmg = Math.floor(dmg * _superState.allmightDmgMult);
            if (_superState.kaidoBuffActive && _superState.kaidoDmgBonus > 1) dmg = Math.floor(dmg * _superState.kaidoDmgBonus);
            if (_superState.dandyDmgBuff && _superState.dandyDmgBuff.timer > 0) dmg = Math.floor(dmg * _superState.dandyDmgBuff.mult);
            if (_superState.markBuffActive && _superState.markDmgBonus > 1) dmg = Math.floor(dmg * _superState.markDmgBonus);
            if (_superState.allmightDebuffActive && _superState.allmightDebuffDmgMult < 1) dmg = Math.floor(dmg * _superState.allmightDebuffDmgMult);
            if (_superState.allmightPermaSlow && _superState.allmightDebuffDmgMult < 1) dmg = Math.floor(dmg * _superState.allmightDebuffDmgMult);
            if (_superState.garpHakiActive) dmg = Math.floor(dmg * 1.25);
        }
        return Math.max(1, dmg);
    }

    function updateRWBPlayer() {
        if (rwbState !== "fight1" && rwbState !== "fight2") return;

        // ★ Проверяем заморозку времени и оглушение ★
        if (wbVortexActive) return;
        if(typeof window.dioIsKnifeWindupActive==="function"&&window.dioIsKnifeWindupActive())return;
        if (typeof _superState !== 'undefined') {
            // During DIO's two-second windup the player stays still; normal time stop still lets DIO move.
            if ((_superState.dioTimeStopWindupUntil || 0) > performance.now()) return;
            // ZA WARUDO freezes Roger/Whitebeard and their attacks, but DIO/player can move.
            if (_superState.garouTimeStop) return;
            if (_superState.usoppStunTimer > 0) return;
        }

        if (rwbPlayerStunTimer > 0) {
            rwbPlayerStunTimer--;
            if (rwbPlayer.invulnTimer > 0) rwbPlayer.invulnTimer--;
            return;
        }

        let mx = 0, my = 0;
        let speed = rwbBaseSpeed * rwbSpeedMult;
        if (typeof getTakabaCombatModifiers === 'function') {
            try { speed *= getTakabaCombatModifiers().speedMult; } catch(e) {}
        }

        if (window._joystick && window._joystick.enabled && window._joystick.active) {
            mx = window._joystick.vectorX;
            my = window._joystick.vectorY;
        } else if (rwbTouchActive) {
            let tx = rwbTouchX - rwbPlayer.x, ty = rwbTouchY - rwbPlayer.y;
            let dist = Math.sqrt(tx * tx + ty * ty);
            if (dist > 5) { mx = tx / dist; my = ty / dist; }
        } else {
            if (rwbKeys.w || rwbKeys.arrowup) my -= 1;
            if (rwbKeys.s || rwbKeys.arrowdown) my += 1;
            if (rwbKeys.a || rwbKeys.arrowleft) mx -= 1;
            if (rwbKeys.d || rwbKeys.arrowright) mx += 1;
            if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }
        }

        // ★ Инверсия управления (Кайдо/Дэнди) ★
        if (typeof _superState !== 'undefined' && _superState.invertControls) {
            mx = -mx; my = -my;
        }

        rwbPlayer.x += mx * speed; rwbPlayer.y += my * speed;
        rwbPlayer.x = Math.max(16, Math.min(384, rwbPlayer.x));
        rwbPlayer.y = Math.max(0, Math.min(484, rwbPlayer.y));
        if (rwbPlayer.invulnTimer > 0) rwbPlayer.invulnTimer--;
        observeWhitebeardHabit();

        if (rwbPlayer.attackTimer <= 0) {
            if (wbBrain.shotWindowTimer > 0) wbBrain.shotsInWindow++;

            let weaponUsed = false;
            if (typeof window.firePlayerWeapon === 'function') {
                try {
                    let result = window.firePlayerWeapon(rwbPlayer.x, rwbPlayer.y, "normal", rwbPlayer.hp, rwbPlayer.maxHp);
                    if (result && result.bullets) {
                        rwbPlayer.attackTimer = result.rate || rwbPlayer.shootRate;
                        for (let i = 0; i < result.bullets.length; i++) {
                            let b = result.bullets[i];
                            // ★★★ ПРИМЕНЯЕМ СУПЕР-МНОЖИТЕЛИ УРОНА ★★★
                            b.damage = applySuperDmgMult(Math.ceil(b.damage * BALANCE.playerDamageMult));
                            if (rwbPlayer.attackMode === "blue") {
                                b.isBlue = true; b.color = "#00aaff"; b.damage = 1;
                                aimBulletAtNearestAttack(b);
                            } else {
                                b.isBlue = false;
                            }
                            rwbPlayerBullets.push(b);
                        }
                        weaponUsed = true; playWhooshSound(0.05);
                    }
                } catch(e) {}
            }
            if (!weaponUsed) {
                rwbPlayer.attackTimer = rwbPlayer.shootRate;
                let bulletColor = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ffdd00";
                let dmg = applySuperDmgMult(3);
                let b = {
                    x: rwbPlayer.x, y: rwbPlayer.y - 14,
                    vx: 0, vy: -11, size: 5, life: 90, color: bulletColor,
                    isBlue: (rwbPlayer.attackMode === "blue"),
                    damage: (rwbPlayer.attackMode === "blue") ? 1 : dmg
                };
                if (rwbPlayer.attackMode === "blue") aimBulletAtNearestAttack(b);
                rwbPlayerBullets.push(b);
                playWhooshSound(0.06);
            }
        }
        if (rwbPlayer.attackTimer > 0) rwbPlayer.attackTimer--;
    }

    function aimBulletAtNearestAttack(bullet) {
        if (!rwbAttacks || rwbAttacks.length === 0) return;
        let nearestAttack = null, nearestDist = Infinity;
        for (let i = 0; i < rwbAttacks.length; i++) {
            let a = rwbAttacks[i];
            if (a.type === "tsunami" || a.type === "titan_fist" || a.type === "gura_crack" || a.type === "purple_crack_zone" || a.type === "haki_wave" || a.type === "wb_attack_telegraph" ||
                a.type === "wb_reflect_vortex" || a.type === "wb_center_wave" || a.type === "wb_fruit_punch" ||
                (a.type === "wb_crescent_slash" && a.state !== "flying")) continue;
            let ax = a.type === "wb_crescent_slash" ? 200 : a.x + (a.size || a.radius || 20) / 2;
            let ay = a.type === "wb_crescent_slash" ? a.y : a.y + (a.size || a.radius || 20) / 2;
            let dx = ax - bullet.x, dy = ay - bullet.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) { nearestDist = dist; nearestAttack = { x: ax, y: ay }; }
        }
        if (nearestAttack) {
            let dx = nearestAttack.x - bullet.x, dy = nearestAttack.y - bullet.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 1;
            let speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) || 11;
            speed = Math.max(speed, 13);
            bullet.vx = (dx / len) * speed; bullet.vy = (dy / len) * speed;
            bullet.life = Math.max(bullet.life, 120);
        }
    }

    function updateDuel() {
        if (dioIsWindupActive() && typeof dioShouldFreezeEntity === 'function' && rwbActiveBoss && dioShouldFreezeEntity(rwbActiveBoss)) return;
        if (!roger || !whitebeard) return;
        duel.timer++;
        if (duel.phase === "idle") {
            roger.x += (roger.homeX - roger.x) * 0.04; roger.y += (roger.homeY - roger.y) * 0.04;
            whitebeard.x += (whitebeard.homeX - whitebeard.x) * 0.04; whitebeard.y += (whitebeard.homeY - whitebeard.y) * 0.04;
            if (duel.clashes === 0 && duel.timer > 30) { duel.phase = "approach"; duel.timer = 0; duel.clashX = 100 + Math.random() * 200; duel.clashY = 150 + Math.random() * 150; playWhooshSound(0.2); }
            else if (duel.clashes > 0 && duel.timer > 60) duel.timer = 0;
        } else if (duel.phase === "approach") {
            let targetRX = duel.clashX - 30, targetRY = duel.clashY;
            let targetWX = duel.clashX + 30, targetWY = duel.clashY;
            roger.x += (targetRX - roger.x) * 0.15; roger.y += (targetRY - roger.y) * 0.15;
            whitebeard.x += (targetWX - whitebeard.x) * 0.15; whitebeard.y += (targetWY - whitebeard.y) * 0.15;
            if (duel.timer % 3 === 0) {
                rwbSpeedLines.push({ x: roger.x + (Math.random() - 0.5) * 20, y: roger.y + (Math.random() - 0.5) * 20, vx: -3, vy: 0, life: 12, maxLife: 12, color: "#ff8800" });
                rwbSpeedLines.push({ x: whitebeard.x + (Math.random() - 0.5) * 20, y: whitebeard.y + (Math.random() - 0.5) * 20, vx: 3, vy: 0, life: 12, maxLife: 12, color: "#ffffff" });
            }
            if (duel.timer > 20) { duel.phase = "clash"; duel.timer = 0; performClash(); }
        } else if (duel.phase === "clash") {
            roger.rotation += 0.15; whitebeard.rotation -= 0.15;
            if (duel.timer % 3 === 0) spawnClashParticles(duel.clashX, duel.clashY);
            if (duel.timer > 18) { duel.phase = "retreat"; duel.timer = 0; }
        } else if (duel.phase === "retreat") {
            let targetRX = roger.homeX, targetRY = roger.homeY + (Math.random() - 0.5) * 60;
            let targetWX = whitebeard.homeX, targetWY = whitebeard.homeY + (Math.random() - 0.5) * 60;
            roger.x += (targetRX - roger.x) * 0.12; roger.y += (targetRY - roger.y) * 0.12;
            whitebeard.x += (targetWX - whitebeard.x) * 0.12; whitebeard.y += (targetWY - whitebeard.y) * 0.12;
            if (duel.timer > 25) { duel.phase = "pause"; duel.timer = 0; }
        } else if (duel.phase === "pause") {
            roger.rotation *= 0.95; whitebeard.rotation *= 0.95;
            if (duel.timer % 60 === 0) {
                roger.homeX = 60 + Math.random() * 100; roger.homeY = 100 + Math.random() * 80;
                whitebeard.homeX = 240 + Math.random() * 100; whitebeard.homeY = 100 + Math.random() * 80;
            }
            if (duel.timer > 50) { duel.phase = "idle"; duel.timer = 0; }
        }
        roger.pulse += 0.08; whitebeard.pulse += 0.07;
        if (roger.hitFlash > 0) roger.hitFlash--;
        if (whitebeard.hitFlash > 0) whitebeard.hitFlash--;
        if (whitebeard.damageFlashTimer > 0) whitebeard.damageFlashTimer--;

        if (Math.random() < 0.08) spawnHakiLightning(roger.x + (Math.random() - 0.5) * 40, roger.y + (Math.random() - 0.5) * 40, 1, false);
        if (Math.random() < 0.16) spawnHakiLightning(whitebeard.x + (Math.random() - 0.5) * 46, whitebeard.y + (Math.random() - 0.5) * 46, 1, true);

        roger.attackTimer--;
        if (roger.attackTimer <= 0) { roger.attackTimer = RWB_ATTACK_SPEED + Math.random() * 20; spawnRogerAttack(); }
        whitebeard.attackTimer--;
        if (whitebeard.attackTimer <= 0) {
            whitebeard.attackTimer = (RWB_ATTACK_SPEED + Math.random() * 25) * (isWBReflectVortexActive() ? 1.43 : 1);
            spawnWhitebeardAttack();
        }
        let wbLock = getWhitebeardWindupAttack();
        if (wbLock && whitebeard) { whitebeard.x = wbLock.originX; whitebeard.y = wbLock.originY; }

        if (roger.hp <= 0) { roger.hp = 0; triggerSuper(whitebeard, roger); }
        else if (whitebeard.hp <= 0) { whitebeard.hp = 0; triggerSuper(roger, whitebeard); }
    }

    function checkMeleeContact() {
        if (rwbState !== "fight2") return;
        if (wbVortexActive) return;
        if (typeof _superState !== 'undefined' &&
            (_superState.garouTimeStop || _superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0 || _superState.takabaTimeStop ||
             _superState.antispiralFrozen || _superState.usoppStunTimer > 0)) return;
        if (rwbMeleeCooldown > 0) { rwbMeleeCooldown--; return; }
        if (!rwbActiveBoss) return;
        let boss = rwbActiveBoss;
        let dx = rwbPlayer.x - boss.x;
        let dy = rwbPlayer.y - boss.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RWB_MELEE_RANGE) {
            let pushAngle = Math.atan2(dy, dx);
            rwbPlayer.vx = Math.cos(pushAngle) * RWB_MELEE_KNOCKBACK;
            rwbPlayer.vy = Math.sin(pushAngle) * RWB_MELEE_KNOCKBACK;
            hitPlayer(RWB_MELEE_DAMAGE,{});
            rwbShake = 18;
            playBladeSound(0.6);
            rwbScreenFlash = 8;
            rwbScreenFlashColor = boss.id === "roger" ? "#ff4400" : "#88ddff";
            for (let i = 0; i < 3; i++) {
                rwbShockwaves.push({ x: boss.x, y: boss.y, radius: 10, maxRadius: RWB_MELEE_RANGE * 1.5, speed: 8, color: boss.id === "roger" ? "#ff4400" : "#ffffff", damage: 0, hit: true, life: 15, maxLife: 15, width: 4 });
            }
            for (let i = 0; i < 15; i++) {
                let ang = pushAngle + (Math.random() - 0.5) * 1.5;
                let spd = 4 + Math.random() * 6;
                rwbParticles.push({ x: boss.x + Math.cos(pushAngle) * 30, y: boss.y + Math.sin(pushAngle) * 30, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 25, maxLife: 25, color: boss.id === "roger" ? "#ff4400" : "#ffffff", size: 3 });
            }
            rwbFloatingTexts.push({ x: rwbPlayer.x, y: rwbPlayer.y - 30, text: "СЛЕШ!", color: boss.id === "roger" ? "#ff4400" : "#88ddff", life: 40, maxLife: 40, vy: -0.8, vx: 0, size: 18 });
            rwbMeleeCooldown = RWB_MELEE_COOLDOWN;
        }
    }

    function performClash() {
        duel.clashes++;
        let dmg = 12 + Math.random() * 8;
        roger.hp = Math.max(0, roger.hp - dmg);
        whitebeard.hp = Math.max(0, whitebeard.hp - dmg);
        roger.hitFlash = 10; whitebeard.hitFlash = 10; whitebeard.damageFlashTimer = 10;
        rwbShake = 25; rwbScreenFlash = 20; rwbScreenFlashColor = "#000000"; rwbHakiAura = 20;
        playImpactSound(0.6, 1.2); playBladeSound(0.4);
        setTimeout(function() { playImpactSound(0.4, 0.8); }, 80);
        for (let i = 0; i < 25; i++) {
            let ang = Math.random() * Math.PI * 2, spd = 3 + Math.random() * 6;
            rwbParticles.push({
                x: duel.clashX, y: duel.clashY,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 30, maxLife: 30,
                color: i % 3 === 0 ? "#000000" : (i % 3 === 1 ? "#ff2222" : "#ffffff"),
                size: 2 + Math.random() * 3
            });
        }
        for (let i = 0; i < 10; i++) spawnHakiLightning(duel.clashX, duel.clashY, 1, Math.random() > 0.7);
        rwbShockwaves.push({ x: duel.clashX, y: duel.clashY, radius: 10, maxRadius: 200, speed: 9, color: "#000000", damage: 0, hit: true, life: 28, maxLife: 28, width: 8 });
        rwbShockwaves.push({ x: duel.clashX, y: duel.clashY, radius: 5, maxRadius: 150, speed: 6, color: "#ff2222", damage: 0, hit: true, life: 25, maxLife: 25, width: 5 });
    }

    function spawnClashParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            let ang = Math.random() * Math.PI * 2, spd = 3 + Math.random() * 6;
            rwbParticles.push({
                x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 20, maxLife: 20,
                color: ["#000000", "#ff2222", "#ff8800", "#ffdd00"][Math.floor(Math.random() * 4)],
                size: 2 + Math.random() * 3
            });
        }
    }

    // ============================================================
    // АТАКИ РОДЖЕРА
    // ============================================================
    function spawnRogerSlash(position) {
        let isSuper = roger.superForm;
        let slashWidth = isSuper ? 65 : 50;
        let warningTime = isSuper ? 45 : 55;
        let maxActive = isSuper ? 26 : 22;
        let dmg = Math.ceil((isSuper ? 34 : 30) * BALANCE.superDamageMult);
        let slash;
        switch(position) {
            case 0: slash = { type: "roger_slash", direction: "vertical", x: 200, y: 0, width: slashWidth, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff4400", hp: 1, maxHp: 1 }; break;
            case 1: slash = { type: "roger_slash", direction: "vertical", x: rwbPlayer.x, y: 0, width: slashWidth, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff2200", hp: 1, maxHp: 1 }; break;
            case 2: slash = { type: "roger_slash", direction: "horizontal", x: 0, y: 250, width: slashWidth, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff6600", hp: 1, maxHp: 1 }; break;
            case 3: slash = { type: "roger_slash", direction: "horizontal", x: 0, y: rwbPlayer.y, width: slashWidth, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff3300", hp: 1, maxHp: 1 }; break;
            case 4: slash = { type: "roger_slash", direction: "vertical", x: 60, y: 0, width: slashWidth * 0.9, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff5500", hp: 1, maxHp: 1 }; break;
            case 5: slash = { type: "roger_slash", direction: "vertical", x: 340, y: 0, width: slashWidth * 0.9, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff5500", hp: 1, maxHp: 1 }; break;
            case 6: slash = { type: "roger_slash", direction: "horizontal", x: 0, y: 80, width: slashWidth * 0.9, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff5500", hp: 1, maxHp: 1 }; break;
            case 7: slash = { type: "roger_slash", direction: "horizontal", x: 0, y: 420, width: slashWidth * 0.9, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff5500", hp: 1, maxHp: 1 }; break;
            default: slash = { type: "roger_slash", direction: "vertical", x: 100 + Math.random() * 200, y: 0, width: slashWidth, warningTimer: warningTime, activeTimer: 0, maxActive: maxActive, damage: dmg, hit: false, state: "warning", color: "#ff4400", hp: 1, maxHp: 1 };
        }
        rwbAttacks.push(slash);
        rwbShake = 15; playBladeSound(0.3);
    }

    function spawnRogerDoubleSlash() {
        let crossX = 100 + Math.random() * 200, crossY = 150 + Math.random() * 200;
        rwbAttacks.push({ type: "roger_slash", direction: "vertical", x: crossX, y: 0, width: 55, warningTimer: 55, activeTimer: 0, maxActive: 22, damage: Math.ceil(28 * BALANCE.superDamageMult), hit: false, state: "warning", color: "#ff4400", hp: 1, maxHp: 1 });
        rwbAttacks.push({ type: "roger_slash", direction: "horizontal", x: 0, y: crossY, width: 55, warningTimer: 55, activeTimer: 0, maxActive: 22, damage: Math.ceil(28 * BALANCE.superDamageMult), hit: false, state: "warning", color: "#ff6600", hp: 1, maxHp: 1 });
        rwbShake = 20; playBladeSound(0.4);
    }

    function spawnRogerTripleSlash() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "⚔️⚔️⚔️ ТРОЙНОЕ ⚔️⚔️⚔️", color: "#ff2200", life: 80, maxLife: 80, vy: -0.3, vx: 0, size: 22 });
        playHakiChargeSound(0.5); rwbShake = 25;
        let positions = [{ dir: "vertical", x: 100, y: 0 }, { dir: "vertical", x: 300, y: 0 }, { dir: "horizontal", x: 0, y: 250 }];
        for (let pos of positions) {
            rwbAttacks.push({ type: "roger_slash", direction: pos.dir, x: pos.x, y: pos.y, width: 60, warningTimer: 60, activeTimer: 0, maxActive: 25, damage: Math.ceil(32 * BALANCE.superDamageMult), hit: false, state: "warning", color: "#ff3300", hp: 1, maxHp: 1 });
        }
        setTimeout(function() { playBladeSound(0.5); }, 300);
    }

    function spawnRogerWhirlwind() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "🌀 СМЕРЧ 🌀", color: "#ff00ff", life: 80, maxLife: 80, vy: -0.3, vx: 0, size: 22 });
        playHakiChargeSound(0.5); rwbShake = 25;
        let count = 16, baseAng = Math.random() * Math.PI * 2;
        for (let i = 0; i < count; i++) {
            let delay = i * 30;
            (function(idx, d) {
                setTimeout(function() {
                    if (!window.rwbActive) return;
                    let ang = baseAng + (idx / count) * Math.PI * 4;
                    rwbAttacks.push({ type: "blade", x: roger.x, y: roger.y, vx: Math.cos(ang) * 5.5, vy: Math.sin(ang) * 5.5, size: 11, hp: 2, maxHp: 2, damage: Math.ceil(15 * BALANCE.superDamageMult), life: 300, color: "#ff00ff", rotation: ang + Math.PI * 0.5, rotSpeed: 0.4, hasHaki: true });
                    if (idx % 4 === 0) playBladeSound(0.08);
                }, d);
            })(i, delay);
        }
    }

    function spawnRogerBladeRain() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "☔ ГРАД КЛИНКОВ ☔", color: "#ffaa00", life: 80, maxLife: 80, vy: -0.3, vx: 0, size: 22 });
        playHakiChargeSound(0.4); rwbShake = 30;
        for (let i = 0; i < 10; i++) {
            let delay = i * 60;
            (function(d) {
                setTimeout(function() {
                    if (!window.rwbActive) return;
                    let rx = 30 + Math.random() * 340;
                    rwbAttacks.push({ type: "blade", x: rx, y: -30, vx: (Math.random() - 0.5) * 1.5, vy: 5.5 + Math.random() * 2, size: 12, hp: 2, maxHp: 2, damage: Math.ceil(16 * BALANCE.superDamageMult), life: 350, color: "#ffaa00", rotation: Math.PI * 0.5, rotSpeed: 0.3, hasHaki: true });
                }, d);
            })(delay);
        }
    }

    function spawnRogerAttack() {
        let type = Math.floor(Math.random() * 8);
        let isSuper = roger.superForm;
        playBladeSound(0.25);
        spawnHakiLightning(roger.x, roger.y, 3, false);
        let dxPlayer = rwbPlayer.x - roger.x, dyPlayer = rwbPlayer.y - roger.y;
        let angleToPlayer = Math.atan2(dyPlayer, dxPlayer);

        if (type === 0) { spawnRogerSlash(Math.floor(Math.random() * 8)); }
        else if (type === 1) {
            let count = isSuper ? 3 : 2;
            for (let i = 0; i < count; i++) {
                let spread = (i - (count - 1) / 2) * 0.12;
                let ang = angleToPlayer + spread;
                let speed = (isSuper ? 5.5 : 4.8) * BALANCE.projectileSpeedMult;
                rwbAttacks.push({ type: "blade", x: roger.x, y: roger.y + 30, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, size: 12, hp: 2, maxHp: 2, damage: Math.ceil((isSuper ? 16 : 13) * BALANCE.rogerDamageMult), life: 250, color: "#ff6600", rotation: ang + Math.PI * 0.5, rotSpeed: 0.15, hasHaki: true });
            }
            playWhooshSound(0.3);
        } else if (type === 2) {
            let count = isSuper ? 7 : 5;
            for (let i = 0; i < count; i++) {
                let angle = Math.PI * 0.5 + (i - (count - 1) / 2) * 0.25;
                let speed = (isSuper ? 5.0 : 4.2) * BALANCE.projectileSpeedMult;
                rwbAttacks.push({ type: "blade", x: roger.x, y: roger.y + 30, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 11, hp: 2, maxHp: 2, damage: Math.ceil((isSuper ? 16 : 12) * BALANCE.rogerDamageMult), life: 250, color: "#ff8800", rotation: angle + Math.PI * 0.5, rotSpeed: 0.15, hasHaki: true });
            }
        } else if (type === 3) {
            let corners = [Math.PI * 0.25, Math.PI * 0.75, -Math.PI * 0.25, -Math.PI * 0.75];
            for (let baseAng of corners) {
                (function(a) {
                    setTimeout(function() {
                        if (!window.rwbActive || wbVortexActive) return;
                        let speed = (isSuper ? 5.2 : 4.5) * BALANCE.projectileSpeedMult;
                        rwbAttacks.push({ type: "big_blade", x: roger.x, y: roger.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, size: 14, hp: 3, maxHp: 3, damage: Math.ceil((isSuper ? 20 : 15) * BALANCE.rogerDamageMult), life: 250, color: "#ff4400", rotation: a + Math.PI * 0.5, rotSpeed: 0.2, trail: [], hasHaki: true });
                    }, 0);
                })(baseAng);
            }
        } else if (type === 4) {
            let count = isSuper ? 8 : 6;
            for (let i = 0; i < count; i++) {
                let angle = (i / count) * Math.PI * 2;
                let speed = (isSuper ? 4.2 : 3.5) * BALANCE.projectileSpeedMult;
                rwbAttacks.push({ type: "blade", x: roger.x, y: roger.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 10, hp: 2, maxHp: 2, damage: Math.ceil((isSuper ? 12 : 10) * BALANCE.rogerDamageMult), life: 250, color: "#ffaa00", rotation: angle + Math.PI * 0.5, rotSpeed: 0.1, hasHaki: true });
            }
        } else if (type === 5) { spawnRogerDoubleSlash(); }
        else if (type === 6) {
            let diagonals = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
            for (let ang of diagonals) {
                (function(a) {
                    setTimeout(function() {
                        if (!window.rwbActive) return;
                        let speed = 4.8 * BALANCE.projectileSpeedMult;
                        rwbAttacks.push({ type: "big_blade", x: roger.x, y: roger.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, size: 14, hp: 3, maxHp: 3, damage: Math.ceil(15 * BALANCE.rogerDamageMult), life: 250, color: "#ff4400", rotation: a + Math.PI * 0.5, rotSpeed: 0.25, trail: [], hasHaki: true });
                        playBladeSound(0.08);
                    }, 0);
                })(ang);
            }
        } else {
            let count = 12;
            for (let i = 0; i < count; i++) {
                let baseAng = (i / count) * Math.PI * 4;
                let delay = i * 5;
                (function(a, d) {
                    setTimeout(function() {
                        if (!window.rwbActive) return;
                        rwbAttacks.push({ type: "blade", x: roger.x, y: roger.y, vx: Math.cos(a) * 4.0 * BALANCE.projectileSpeedMult, vy: Math.sin(a) * 4.0 * BALANCE.projectileSpeedMult, size: 9, hp: 2, maxHp: 2, damage: Math.ceil(10 * BALANCE.rogerDamageMult), life: 250, color: "#ff8800", rotation: a + Math.PI * 0.5, rotSpeed: 0.35, hasHaki: true });
                    }, d);
                })(baseAng, delay);
            }
        }
    }

    // ============================================================
    // АТАКИ БЕЛОУСА
    // ============================================================
    function spawnTsunamiAttack(isSuper, comboOptions) {
        let tsunamiDamage = Math.ceil(26 * BALANCE.whitebeardDamageMult);
        comboOptions = comboOptions || null;
        if (rwbTsunamiActive) return;
        rwbTsunamiActive = true;
        const comboPull = !!(comboOptions && comboOptions.comboPull);
        // A pull-combo wave starts behind the player's current position and advances
        // toward them. The regular tsunami keeps its original top-of-screen spawn.
        const behindPlayerY = function(distanceBehind) {
            if (!comboPull || !rwbPlayer) return -60;
            return clampWhitebeard(rwbPlayer.y - distanceBehind, -60, 280);
        };
        const waveSpeed = comboPull ? 3.9 : 4.5;
        playWhooshSound(0.5); playBossRoarSound(0.3); rwbShake = 25;
        rwbFloatingTexts.push({ x: 200, y: 100, text: "🌊 ЦУНАМИ! 🌊", color: "#00ccff", life: 90, maxLife: 90, vy: -0.3, vx: 0, size: 24 });
        let wave1 = { type: "tsunami", fromRight: true, x: 130, y: behindPlayerY(145), vy: waveSpeed, width: 270, height: 55, currentWidth: 270, currentHeight: 55, damage: tsunamiDamage, life: 400, waveTime: 0, hit: false, color: "#0099ff",
            comboPull: comboPull, pullTargetX: comboOptions && comboOptions.pullTargetX, pullTargetY: comboOptions && comboOptions.pullTargetY };
        rwbAttacks.push(wave1);
        setTimeout(function() {
            if (!window.rwbActive) return;
            // The second pull wave spawns behind the player's updated position as well.
            let wave2 = { type: "tsunami", fromRight: false, x: 0, y: behindPlayerY(125), vy: waveSpeed, width: 270, height: 55, currentWidth: 270, currentHeight: 55, damage: tsunamiDamage, life: 400, waveTime: 0, hit: false, color: "#00aaff",
                comboPull: comboPull, pullTargetX: comboOptions && comboOptions.pullTargetX, pullTargetY: comboOptions && comboOptions.pullTargetY };
            rwbAttacks.push(wave2);
            playWhooshSound(0.5); rwbShake = 20;
            rwbFloatingTexts.push({ x: 200, y: 100, text: "🌊 ВТОРАЯ ВОЛНА! 🌊", color: "#00ddff", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 20 });
            setTimeout(function() { rwbTsunamiActive = false; }, 1500);
        }, 1600);
    }

    function chooseWhitebeardAttackId(isSuper) {
        let boss = getWhitebeardEntity();
        let dist = boss ? Math.hypot(rwbPlayer.x - boss.x, rwbPlayer.y - boss.y) : 180;
        let weights = isSuper ? [1.5, 1.5, 1.2, 1.3, 1.1] : [1.5, 1.4, 1.2, 1.2, 1.0, 1.1, 1.5, 1.3];

        if (isSuper) {
            if (dist < 100) { weights[2] += 2.5; weights[3] += 0.6; }
            else if (dist > 220) { weights[0] += 1.4; weights[4] += 2.0; }
            if (wbBrain.stationaryFrames > 40) weights[1] += 2.0;
            if (wbBrain.bottomFrames > 60) weights[4] += 2.2;
            if (wbBrain.shotsInWindow > 6) weights[0] += 1.1;
            if (wbBrain.comboHint !== null) {
                if (weights[wbBrain.comboHint] !== undefined) weights[wbBrain.comboHint] += 3.4;
                wbBrain.comboHint = null;
            }
            if (wbBrain.lastSuperAttackId >= 0) weights[wbBrain.lastSuperAttackId] *= 0.12;
        } else {
            if (dist < 90) { weights[1] += 3.2; weights[2] += 0.9; weights[3] += 0.9; weights[0] *= 0.45; }
            else if (dist > 220) { weights[0] += 1.5; weights[4] += 1.0; weights[7] += 1.0; weights[6] += 1.6; }
            if (rwbPlayer.x < (boss ? boss.x : 200)) weights[3] += 0.8;
            else weights[2] += 0.8;
            if (wbBrain.stationaryFrames > 45) { weights[6] += 1.2; weights[1] += 0.8; }
            if (wbBrain.bottomFrames > 60) { weights[5] += 1.1; weights[4] += 0.6; }
            if (wbBrain.shotsInWindow > 6) weights[0] += 0.7;
            if (wbBrain.comboHint !== null && weights[wbBrain.comboHint] !== undefined) {
                weights[wbBrain.comboHint] += 3.4;
                wbBrain.comboHint = null;
            }
            if (wbBrain.lastAttackId >= 0) weights[wbBrain.lastAttackId] *= 0.16;
        }

        let total = weights.reduce(function(sum, value) { return sum + Math.max(0.05, value); }, 0);
        let roll = Math.random() * total;
        for (let i = 0; i < weights.length; i++) {
            roll -= Math.max(0.05, weights[i]);
            if (roll <= 0) return i;
        }
        return weights.length - 1;
    }

    function getWBAttackTell(kind, id) {
        if (kind === "super") return ["ЗЕМЛЕТРЯСЕНИЕ", "ГУРА-ГУРА", "ТИТАН-КУЛАК", "НАВАЛА КУЛАКОВ", "ЦУНАМИ"][id] || "СУПЕР-АТАКА";
        return ["КАМНЕПАД", "УДАРНАЯ ВОЛНА", "КУЛАК СПРАВА", "КУЛАК СЛЕВА", "ЦУНАМИ", "ГРАД КУЛАКОВ", "ДВА ПРИЦЕЛЬНЫХ УДАРА", "ВОЛНА ХАКИ"][id] || "АТАКА БЕЛОУСА";
    }

    function queueWhitebeardAttack(kind, id) {
        let boss = getWhitebeardEntity();
        if (!boss || wbBrain.phase !== "idle" || wbTrapCombo.stage !== "idle") return false;
        let isSuper = kind === "super";
        let warning = isSuper ? 30 : 24 + Math.floor(Math.random() * 7);
        let tx = Math.max(22, Math.min(378, rwbPlayer.x + wbBrain.playerVX * 10));
        let ty = Math.max(35, Math.min(465, rwbPlayer.y + wbBrain.playerVY * 10));
        let columns = [];
        let count = isSuper ? 8 : (id === 0 ? 6 : 5);
        if (!isSuper && id === 5) {
            for (let n = 0; n < 5; n++) columns.push(60 + n * 70);
        } else if (!isSuper && id === 0) {
            for (let n = 0; n < 6; n++) columns.push(40 + n * 64);
        } else {
            for (let n = 0; n < count; n++) columns.push(28 + n * (344 / Math.max(1, count - 1)));
        }
        wbBrain.plannedTargetX = tx; wbBrain.plannedTargetY = ty; wbBrain.plannedRockXs = columns;
        wbBrain.phase = "windup"; wbBrain.phaseTimer = warning;
        if (isSuper) wbBrain.lastSuperAttackId = id;
        else wbBrain.lastAttackId = id;
        rwbAttacks.push({
            type: "wb_attack_telegraph", state: "warning", attackKind: kind, attackId: id,
            x: boss.x, y: boss.y, originX: boss.x, originY: boss.y,
            targetX: tx, targetY: ty, columns: columns, warningTimer: warning,
            title: getWBAttackTell(kind, id), color: isSuper ? "#ffffff" : "#9beaff",
            life: warning + 1
        });
        playHakiChargeSound(isSuper ? 0.34 : 0.22);
        spawnHakiLightning(boss.x, boss.y, isSuper ? 4 : 2, false);
        return true;
    }

    function spawnWhitebeardAttack() {
        if (wbTrapCombo.stage !== "idle" || isWhitebeardSpecialWindupActive() || wbBrain.phase !== "idle") return;
        if (maybeSpawnWhitebeardAdaptive(false)) return;
        queueWhitebeardAttack("normal", chooseWhitebeardAttackId(false));
    }

    function executeWhitebeardAttack(type) {
        let isSuper = whitebeard ? whitebeard.superForm : (rwbActiveBoss && rwbActiveBoss.superForm);
        playHakiChargeSound(0.2);
        spawnHakiLightning(whitebeard.x, whitebeard.y, 3, false);
        let dxPlayer = rwbPlayer.x - whitebeard.x, dyPlayer = rwbPlayer.y - whitebeard.y;
        let angleToPlayer = Math.atan2(dyPlayer, dxPlayer);

        if (type === 0) {
            let count = 6;
            for (let i = 0; i < count; i++) {
                let cx = wbBrain.plannedRockXs && wbBrain.plannedRockXs.length ? wbBrain.plannedRockXs[i % wbBrain.plannedRockXs.length] : 40 + Math.random() * 320;
                rwbAttacks.push({ type: "rock", x: cx, y: -40 - Math.random() * 30, vx: (Math.random() - 0.5) * 0.5, vy: (isSuper ? 4.2 : 3.5) * BALANCE.projectileSpeedMult, size: 17 + Math.random() * 5, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.06, hp: 3, maxHp: 3, damage: Math.ceil((isSuper ? 20 : 15) * BALANCE.whitebeardDamageMult), life: 400, color: "#8B7355", hasHaki: false, textureSeed: Math.random() * 1000 });
            }
            spawnWhiteCracks(whitebeard.x, whitebeard.y, 3); playImpactSound(0.4, 0.6);
            wbBrain.comboHint = 1;
        } else if (type === 1) {
            rwbShockwaves.push({ x: whitebeard.x, y: whitebeard.y, radius: 10, maxRadius: isSuper ? 240 : 200, speed: (isSuper ? 5.5 : 4.5) * BALANCE.projectileSpeedMult, color: "#ffdd44", damage: Math.ceil((isSuper ? 20 : 15) * BALANCE.whitebeardDamageMult), hit: false, hp: 6, maxHp: 6, canDestroy: true, life: 150, maxLife: 150, width: 14 });
            playImpactSound(0.35, 0.9);
        } else if (type === 2) {
            rwbAttacks.push({ type: "fist", x: 430, y: wbBrain.plannedTargetY || rwbPlayer.y, vx: -6 * BALANCE.projectileSpeedMult, vy: 0, size: 22, hp: 4, maxHp: 4, damage: Math.ceil((isSuper ? 24 : 18) * BALANCE.whitebeardDamageMult), life: 250, color: "#ffffff", owner: "whitebeard", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
            playImpactSound(0.4, 1.0);
        } else if (type === 3) {
            rwbAttacks.push({ type: "fist", x: -30, y: wbBrain.plannedTargetY || rwbPlayer.y, vx: 6 * BALANCE.projectileSpeedMult, vy: 0, size: 22, hp: 4, maxHp: 4, damage: Math.ceil((isSuper ? 24 : 18) * BALANCE.whitebeardDamageMult), life: 250, color: "#ffffff", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
            playImpactSound(0.4, 1.0);
        } else if (type === 4) { spawnTsunamiAttack(isSuper); wbBrain.comboHint = 5; }
        else if (type === 5) {
            let count = isSuper ? 8 : 5;
            for (let i = 0; i < count; i++) {
                let cx = 60 + i * (280 / (count - 1));
                rwbAttacks.push({ type: "fist", x: cx, y: -30, vx: (Math.random() - 0.5) * 1, vy: 5 * BALANCE.projectileSpeedMult, size: 16, hp: 3, maxHp: 3, damage: Math.ceil((isSuper ? 18 : 14) * BALANCE.whitebeardDamageMult), life: 300, color: "#ffffff", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
            }
            playImpactSound(0.35, 0.9);
            wbBrain.comboHint = 6;
        } else if (type === 6) {
            for (let side = -1; side <= 1; side += 2) {
                (function(s) {
                    setTimeout(function() {
                        if (!window.rwbActive) return;
                        let targetX = (wbBrain.plannedTargetX || rwbPlayer.x) + s * 60, targetY = wbBrain.plannedTargetY || rwbPlayer.y;
                        let dx = targetX - whitebeard.x, dy = targetY - whitebeard.y;
                        let len = Math.sqrt(dx * dx + dy * dy) || 1;
                        let speed = (isSuper ? 6.5 : 5.5) * BALANCE.projectileSpeedMult;
                        rwbAttacks.push({ type: "fist", x: whitebeard.x, y: whitebeard.y + 20, vx: (dx / len) * speed, vy: (dy / len) * speed, size: 18, hp: 4, maxHp: 4, damage: Math.ceil((isSuper ? 22 : 17) * BALANCE.whitebeardDamageMult), life: 250, color: "#ffffff", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
                    }, (s + 1) * 120);
                })(side);
            }
            playImpactSound(0.45, 0.85);
        } else {
            let side = Math.random() > 0.5 ? 1 : -1;
            rwbAttacks.push({ type: "haki_wave", x: side > 0 ? -40 : 440, y: wbBrain.plannedTargetY || rwbPlayer.y, vx: side * 3.5 * BALANCE.projectileSpeedMult, vy: 0, size: 30, hp: 5, maxHp: 5, damage: Math.ceil(22 * BALANCE.whitebeardDamageMult), life: 300, color: "#ff8800", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
            playHakiChargeSound(0.3);
        }
    }

    // ============================================================
    // АДАПТИВНЫЕ АТАКИ БЕЛОУСА
    // ============================================================
    function getWhitebeardEntity() {
        if (rwbActiveBoss && rwbActiveBoss.id === "whitebeard") return rwbActiveBoss;
        return whitebeard && whitebeard.id === "whitebeard" ? whitebeard : null;
    }

    function isWBReflectVortexActive() {
        return rwbAttacks.some(function(a) { return a.type === "wb_reflect_vortex" && a.life > 0; });
    }

    function isWhitebeardSpecialWindupActive() {
        return rwbAttacks.some(function(a) {
            return (a.type === "wb_attack_telegraph" && a.state === "warning") ||
                   (a.type === "wb_center_wave" && a.state === "warning") ||
                   (a.type === "wb_fruit_punch" && a.state === "warning") ||
                   (a.type === "wb_crescent_slash" && a.state === "windup");
        });
    }

    function getWhitebeardWindupAttack() {
        return rwbAttacks.find(function(a) {
            return (a.type === "wb_attack_telegraph" && a.state === "warning") ||
                   (a.type === "wb_fruit_punch" && a.state === "warning") ||
                   (a.type === "wb_crescent_slash" && a.state === "windup");
        }) || null;
    }

    function observeWhitebeardHabit() {
        if (!rwbPlayer || (rwbState !== "fight1" && rwbState !== "fight2")) return;
        if (wbBrain.shotWindowTimer <= 0) {
            wbBrain.shotWindowTimer = 180;
            wbBrain.shotsInWindow = 0;
        } else wbBrain.shotWindowTimer--;

        if (rwbPlayer.y >= 395) wbBrain.bottomFrames++;
        else wbBrain.bottomFrames = Math.max(0, wbBrain.bottomFrames - 3);

        let dxMoved = rwbPlayer.x - wbBrain.lastX;
        let dyMoved = rwbPlayer.y - wbBrain.lastY;
        let moved = Math.hypot(dxMoved, dyMoved);
        wbBrain.playerVX = wbBrain.playerVX * 0.58 + dxMoved * 0.42;
        wbBrain.playerVY = wbBrain.playerVY * 0.58 + dyMoved * 0.42;
        if (moved < 1.1) wbBrain.stationaryFrames++;
        else wbBrain.stationaryFrames = Math.max(0, wbBrain.stationaryFrames - 2);

        // Читаемый цикл в духе Souls: подготовка → атака → восстановление.
        if (wbBrain.phase === "windup") {
            wbBrain.phaseTimer--;
            if (wbBrain.phaseTimer <= 0) { wbBrain.phase = "attack"; wbBrain.phaseTimer = 7; }
        } else if (wbBrain.phase === "attack") {
            wbBrain.phaseTimer--;
            if (wbBrain.phaseTimer <= 0) {
                wbBrain.phase = "recovery";
                wbBrain.recoveryTimer = 10 + Math.floor(Math.random() * 8);
            }
        } else if (wbBrain.phase === "recovery") {
            wbBrain.recoveryTimer--;
            if (wbBrain.recoveryTimer <= 0) wbBrain.phase = "idle";
        }

        let boss = getWhitebeardEntity();
        if (boss && Math.hypot(rwbPlayer.x - boss.x, rwbPlayer.y - boss.y) > 180) wbBrain.farFrames++;
        else wbBrain.farFrames = Math.max(0, wbBrain.farFrames - 2);

        wbBrain.lastX = rwbPlayer.x;
        wbBrain.lastY = rwbPlayer.y;
        if (wbBrain.adaptiveCooldown > 0) wbBrain.adaptiveCooldown--;
    }

    function whitebeardRayEndpoint(x, y, targetX, targetY) {
        let dx = targetX - x, dy = targetY - y;
        let len = Math.hypot(dx, dy) || 1;
        let ux = dx / len, uy = dy / len;
        let t = Infinity;
        if (ux > 0) t = Math.min(t, (400 - x) / ux);
        else if (ux < 0) t = Math.min(t, (0 - x) / ux);
        if (uy > 0) t = Math.min(t, (500 - y) / uy);
        else if (uy < 0) t = Math.min(t, (0 - y) / uy);
        if (!Number.isFinite(t) || t < 0) t = 450;
        return { x: x + ux * t, y: y + uy * t };
    }

    function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        let dx = x2 - x1, dy = y2 - y1;
        let denom = dx * dx + dy * dy;
        let t = denom ? ((px - x1) * dx + (py - y1) * dy) / denom : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }

    function spawnWBReflectVortex(isSuper) {
        let boss = getWhitebeardEntity();
        if (!boss || isWBReflectVortexActive()) return false;
        let side = rwbPlayer.x >= boss.x ? -1 : 1;
        wbBrain.phase = "attack"; wbBrain.phaseTimer = 7;
        let vx = Math.max(52, Math.min(348, boss.x + side * 70));
        let vy = Math.max(72, Math.min(425, boss.y + 32));
        if (Math.hypot(rwbPlayer.x - vx, rwbPlayer.y - vy) < 92) vx = Math.max(52, Math.min(348, boss.x - side * 70));
        rwbAttacks.push({ type: "wb_reflect_vortex", x: vx, y: vy, radius: 62, life: 320, maxLife: 320, rotation: Math.random() * Math.PI * 2, color: "#9f5cff", isSuper: !!isSuper });
        if (whitebeard) whitebeard.attackTimer = Math.max(whitebeard.attackTimer || 0, Math.ceil(RWB_ATTACK_SPEED * 1.43));
        if (rwbActiveBoss && rwbActiveBoss.id === "whitebeard") rwbActiveBoss.attackTimer = Math.max(rwbActiveBoss.attackTimer || 0, Math.ceil(BALANCE.superAttackRate * 1.43));
        rwbFloatingTexts.push({ x: vx, y: vy - 48, text: "🌀 ОТРАЖЕНИЕ!", color: "#bb8cff", life: 75, maxLife: 75, vy: -0.25, vx: 0, size: 15 });
        playHakiChargeSound(0.3); playWhooshSound(0.4);
        return true;
    }

    function spawnWBCenterPullWave(isSuper) {
        wbBrain.phase = "windup"; wbBrain.phaseTimer = 120;
        let boss = getWhitebeardEntity();
        rwbAttacks.push({ type: "wb_center_wave", x: 200, y: 480, originX: boss ? boss.x : 320, originY: boss ? boss.y : 120, targetY: 250, speed: isSuper ? 4.6 : 4.0, state: "warning", warningTimer: 120, life: 130, color: "#9beaff", damage: 0, isSuper: !!isSuper });
        rwbFloatingTexts.push({ x: 200, y: 90, text: "🌊 ХВАТИТ ПРЯТАТЬСЯ!", color: "#9beaff", life: 125, maxLife: 125, vy: -0.25, vx: 0, size: 16 });
        playHakiChargeSound(0.3);
        return true;
    }

    function spawnWBFruitPunch(isSuper) {
        let boss = getWhitebeardEntity();
        if (!boss) return false;
        wbBrain.phase = "windup"; wbBrain.phaseTimer = 120;
        let end = whitebeardRayEndpoint(boss.x, boss.y, rwbPlayer.x, rwbPlayer.y);
        rwbAttacks.push({
            type: "wb_fruit_punch", x: boss.x, y: boss.y, originX: boss.x, originY: boss.y,
            targetX: rwbPlayer.x, targetY: rwbPlayer.y, endX: end.x, endY: end.y,
            state: "warning", warningTimer: 120, activeTimer: 0, hit: false,
            width: isSuper ? 66 : 58, damage: 20, life: 160, color: "#f7fbff", isSuper: !!isSuper
        });
        rwbFloatingTexts.push({ x: 200, y: 82, text: "⚠ РАЗЛОМ МИРА ⚠", color: "#ffffff", life: 125, maxLife: 125, vy: -0.2, vx: 0, size: 17 });
        playHakiChargeSound(0.45); spawnHakiLightning(boss.x, boss.y, 3, false);
        return true;
    }

    function spawnWBCrescentSlash(isSuper) {
        let boss = getWhitebeardEntity();
        if (!boss || !rwbPlayer) return false;
        // Фиксированная горизонтальная плоскость летит через арену 1,5 секунды.
        let startY = Math.max(45, Math.min(210, boss.y + 12));
        let targetY = Math.max(35, Math.min(465, rwbPlayer.y));
        wbBrain.phase = "windup"; wbBrain.phaseTimer = 120;
        rwbAttacks.push({
            type: "wb_crescent_slash", state: "windup",
            x: 200, y: startY, originX: boss.x, originY: boss.y,
            startY: startY, targetY: targetY, travelElapsed: 0, travelTime: 90,
            vx: 0, vy: 0, size: 0, width: 92, hp: 10, maxHp: 10,
            damage: 40, life: 90, warningTimer: 120,
            color: "#ffffff", rotation: 0, isSuper: !!isSuper, hit: false
        });
        rwbFloatingTexts.push({ x: 200, y: 82, text: "⚡ БЕЛОУС ЗАРЯЖАЕТ УДАР ХАКИ ⚡", color: "#ffffff", life: 115, maxLife: 115, vy: -0.2, vx: 0, size: 15 });
        rwbHakiAura = Math.max(rwbHakiAura, 28);
        playHakiChargeSound(0.55);
        spawnHakiLightning(boss.x, boss.y, 5, true);
        return true;
    }

    function maybeSpawnWhitebeardAdaptive(isSuper) {
        if (!getWhitebeardEntity() || wbBrain.adaptiveCooldown > 0 || wbBrain.phase !== "idle" || isWhitebeardSpecialWindupActive()) return false;
        if (isWBReflectVortexActive()) return false;
        let choice = null;
        if (wbBrain.bottomFrames >= 145 && Math.random() < 0.72) choice = "center_wave";
        else if (wbBrain.shotsInWindow >= 9 && Math.random() < 0.33) choice = "reflect_vortex";
        else if (wbBrain.stationaryFrames >= 100 && Math.random() < 0.48) choice = "fruit_punch";
        else if (wbBrain.farFrames >= 50 && Math.random() < 0.68) choice = "crescent_slash";
        else if (Math.random() < 0.22) {
            let roll = Math.random();
            choice = roll < 0.40 ? "crescent_slash" : (roll < 0.60 ? "reflect_vortex" : (roll < 0.80 ? "fruit_punch" : "center_wave"));
        }
        if (!choice) return false;

        // Не повторяет одну и ту же специальную контратаку два раза подряд.
        if (choice === wbBrain.lastAdaptive) {
            let alternatives = ["reflect_vortex", "center_wave", "fruit_punch", "crescent_slash"].filter(function(v) { return v !== choice; });
            choice = alternatives[Math.floor(Math.random() * alternatives.length)];
        }

        let started = false;
        if (choice === "reflect_vortex") started = spawnWBReflectVortex(isSuper);
        else if (choice === "center_wave") started = spawnWBCenterPullWave(isSuper);
        else if (choice === "fruit_punch") started = spawnWBFruitPunch(isSuper);
        else if (choice === "crescent_slash") started = spawnWBCrescentSlash(isSuper);
        if (!started) return false;

        wbBrain.lastAdaptive = choice;
        wbBrain.adaptiveCooldown = choice === "reflect_vortex" ? 240 : (choice === "center_wave" ? 205 : 180);
        if (choice === "center_wave") wbBrain.bottomFrames = 0;
        if (choice === "reflect_vortex") wbBrain.shotsInWindow = 0;
        if (choice === "fruit_punch") wbBrain.stationaryFrames = 0;
        if (choice === "crescent_slash") wbBrain.farFrames = 0;
        return true;
    }

    // ============================================================
    // СУПЕР-АТАКИ
    // ============================================================
    function spawnRogerSuperAttack() {
        let attackId = Math.floor(Math.random() * 7);
        playHakiChargeSound(0.25);
        spawnHakiLightning(roger.x, roger.y, 5, false);
        if (attackId === 0) spawnRogerCrossSlash();
        else if (attackId === 1) spawnRogerCrossStrike();
        else if (attackId === 2) spawnRogerHellFire();
        else if (attackId === 3) spawnRogerComboRush();
        else if (attackId === 4) spawnRogerDoubleSlash();
        else if (attackId === 5) spawnRogerTripleSlash();
        else if (attackId === 6) spawnRogerWhirlwind();
    }

    function spawnRogerCrossSlash() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "⚡ РАССЕЧЕНИЕ ⚡", color: "#ff4400", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 20 });
        playWhooshSound(0.5);
        setTimeout(function() { playImpactSound(0.5, 1.2); }, 300);
        spawnRogerSlash(Math.floor(Math.random() * 8));
    }

    function spawnRogerCrossStrike() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "❌ КРЕСТ ❌", color: "#ff6600", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 20 });
        playBladeSound(0.3);
        let cx = 130 + Math.random() * 140, cy = 180 + Math.random() * 120;
        rwbAttacks.push({ type: "roger_cross", x: cx, y: cy, dir: "vertical", length: 400, width: 35, warningTimer: 50, activeTimer: 0, maxActive: 20, damage: Math.ceil(26 * BALANCE.superDamageMult), hit: false, state: "warning", color: "#ff8800", hp: 1, maxHp: 1 });
        rwbAttacks.push({ type: "roger_cross", x: cx, y: cy, dir: "horizontal", length: 400, width: 35, warningTimer: 50, activeTimer: 0, maxActive: 20, damage: Math.ceil(26 * BALANCE.superDamageMult), hit: false, state: "warning", color: "#ff8800", hp: 1, maxHp: 1 });
        rwbShake = 18;
    }

    function spawnRogerHellFire() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "🔥 ПЛАМЯ 🔥", color: "#ff2200", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 20 });
        playWhooshSound(0.4);
        setTimeout(function() { playExplosionSound(0.5); }, 800);
        for (let i = 0; i < 2; i++) {
            setTimeout(function() {
                if (!window.rwbActive) return;
                rwbAttacks.push({ type: "hell_fire", x: roger.x + (Math.random() - 0.5) * 60, y: roger.y + 20, targetX: rwbPlayer.x + (Math.random() - 0.5) * 60, targetY: rwbPlayer.y + (Math.random() - 0.5) * 60, vx: 0, vy: 0, speed: 3.8 * BALANCE.projectileSpeedMult, size: 25, hp: 5, maxHp: 5, damage: Math.ceil(24 * BALANCE.superDamageMult), life: 300, state: "flying", flyTimer: 0, explosionTimer: 0, color: "#ff3300" });
            }, i * 300);
        }
    }

    function spawnRogerComboRush() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "⚔️ КОМБО ⚔️", color: "#ffdd00", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 20 });
        playBladeSound(0.35);
        for (let w = 0; w < 4; w++) {
            (function(waveIdx) {
                setTimeout(function() {
                    if (!window.rwbActive || rwbState !== "fight2") return;
                    let count = 6, baseAng = Math.random() * Math.PI * 2;
                    for (let i = 0; i < count; i++) {
                        let ang = baseAng + (i / count) * Math.PI * 2;
                        rwbAttacks.push({ type: "blade", x: roger.x, y: roger.y, vx: Math.cos(ang) * 5.5, vy: Math.sin(ang) * 5.5, size: 10, hp: 2, maxHp: 2, damage: Math.ceil(14 * BALANCE.superDamageMult), life: 250, color: "#ffcc00", rotation: ang + Math.PI * 0.5, rotSpeed: 0.3, hasHaki: true });
                    }
                    playBladeSound(0.15);
                }, waveIdx * 300);
            })(w);
        }
    }

    function clearWhitebeardVortexAttacks() {
        // Clear both damaging projectiles and lingering attack indicators when the pull begins.
        rwbAttacks.length = 0;
        rwbShockwaves.length = 0;
        rwbWhiteCracks.length = 0;
        rwbPurpleCracks.length = 0;
        rwbSpeedLines.length = 0;
        rwbHakiLightnings.length = 0;
    }

    function spawnWhitebeardVortex() {
        if (!window.rwbActive || rwbState !== "fight2" || !rwbActiveBoss || rwbActiveBoss.id !== "whitebeard" || wbVortexActive) return;
        wbVortexActive = true;
        clearWhitebeardVortexAttacks();
        // The vortex clears attacks, so release any interrupted wind-up/recovery state too.
        wbBrain.phase = "idle"; wbBrain.phaseTimer = 0; wbBrain.recoveryTimer = 0;
        wbBrain.adaptiveCooldown = 0;
        // Restart attack intervals so no queued boss attack leaks into the pull.
        rwbTitanFistTimer = 0;
        rwbTitanRockTimer = 0;
        wbVortexTimerLeft = WB_VORTEX_QTE_DURATION;
        wbVortexNextPoint = 0;
        wbVortexFailed = false;
        wbVortexPullStrength = 1;
        wbVortexPoints = [];
        for (let i = 0; i < 7; i++) {
            let ang = (i / 7) * Math.PI * 2 + Math.random() * 0.22;
            let rr = 75 + Math.random() * 55;
            wbVortexPoints.push({
                x: Math.max(28, Math.min(372, rwbPlayer.x + Math.cos(ang) * rr)),
                y: Math.max(45, Math.min(455, rwbPlayer.y + Math.sin(ang) * rr)),
                r: 42,
                hit: false,
                pulse: Math.random() * Math.PI * 2
            });
        }
        rwbFloatingTexts.push({ x: 200, y: 80, text: "🌀 ВОРОНКА — НАЖМИ 7 ТОЧЕК!", color: "#ffffff", life: 125, maxLife: 125, vy: 0, vx: 0, size: 16 });
        playBossRoarSound(0.55); playWhooshSound(0.55);
        rwbShake = 28;
    }

    function finishWhitebeardVortex(success) {
        if (!wbVortexActive) return;
        wbVortexActive = false;
        wbVortexTimerLeft = 0;
        wbVortexPullStrength = 0;
        wbVortexElapsedMs = 0;
        wbVortexClockAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (!success) {
            wbVortexFailed = true;
            rwbPlayer.vx = 0;
            rwbPlayer.vy = 10;
            hitPlayer(40,{});
            rwbShake = 28;
            rwbScreenFlash = 18;
            rwbScreenFlashColor = "#ffffff";
            rwbFloatingTexts.push({ x: 200, y: 120, text: "💥 БЕЛОУС УДАРИЛ!", color: "#ffffff", life: 70, maxLife: 70, vy: -0.4, vx: 0, size: 20 });
            playImpactSound(0.9, 0.5);
        } else {
            rwbFloatingTexts.push({ x: 200, y: 120, text: "✅ УСПЕЛ!", color: "#88ddff", life: 45, maxLife: 45, vy: -0.5, vx: 0, size: 18 });
            playWhooshSound(0.3);
        }
        wbVortexPoints = [];
        wbVortexNextPoint = 0;
    }

    function handleWhitebeardVortexClick(clientX, clientY) {
        if (!wbVortexActive || !canvas) return false;
        let rect = canvas.getBoundingClientRect();
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        let p = wbVortexPoints[wbVortexNextPoint];
        if (!p) return true;
        let dx = x - p.x, dy = y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) <= p.r + 20) {
            p.hit = true;
            wbVortexNextPoint++;
            playImpactSound(0.18, 1.5);
            if (wbVortexNextPoint >= 7) finishWhitebeardVortex(true);
        }
        return true;
    }

    function updateWhitebeardVortex() {
        if (!wbVortexActive || !rwbPlayer || !whitebeard && !rwbActiveBoss) return;
        let boss = rwbActiveBoss || whitebeard;
        wbVortexTimerLeft--;
        // Воронка постоянно тянет игрока к Белоусу.
        let dx = boss.x - rwbPlayer.x, dy = boss.y - rwbPlayer.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let pull = Math.min(8, 2.2 + (1 - Math.min(dist, 260) / 260) * 3.5);
        rwbPlayer.x += (dx / dist) * pull;
        rwbPlayer.y += (dy / dist) * pull;
        rwbPlayer.x = Math.max(16, Math.min(384, rwbPlayer.x));
        rwbPlayer.y = Math.max(0, Math.min(484, rwbPlayer.y));
        for (let p of wbVortexPoints) p.pulse += 0.12;
        if (wbVortexTimerLeft <= 0 && wbVortexActive) finishWhitebeardVortex(false);
    }

    function spawnWhitebeardSuperAttack() {
        if (wbTrapCombo.stage !== "idle" || isWhitebeardSpecialWindupActive() || wbBrain.phase !== "idle") return;
        if (maybeSpawnWhitebeardAdaptive(true)) return;
        queueWhitebeardAttack("super", chooseWhitebeardAttackId(true));
    }

    function executeWhitebeardSuperAttack(attackId) {
        let boss = getWhitebeardEntity();
        if (!boss) return;
        playHakiChargeSound(0.3);
        spawnHakiLightning(boss.x, boss.y, 5, false);
        if (attackId === 0) { spawnWhitebeardEarthquake(); wbBrain.comboHint = 1; }
        else if (attackId === 1) { spawnWhitebeardGuraGura(); wbBrain.comboHint = 2; }
        else if (attackId === 2) { spawnWhitebeardTitanFist(); wbBrain.comboHint = 3; }
        else if (attackId === 3) { spawnWhitebeardRush(); wbBrain.comboHint = 4; }
        else if (attackId === 4) { spawnTsunamiAttack(false); wbBrain.comboHint = 3; }
    }

    function spawnWhitebeardEarthquake() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "🌋 ЗЕМЛЕТРЯСЕНИЕ 🌋", color: "#8B7355", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 18 });
        playImpactSound(0.7, 0.5); playBossRoarSound(0.4); rwbShake = 25;
        for (let i = 0; i < 8; i++) {
            let cx = wbBrain.plannedRockXs && wbBrain.plannedRockXs.length ? wbBrain.plannedRockXs[i % wbBrain.plannedRockXs.length] : 40 + Math.random() * 320;
            rwbAttacks.push({ type: "rock", x: cx, y: -40 - Math.random() * 50, vx: (Math.random() - 0.5) * 1.2, vy: 3.2 + Math.random() * 1.5, size: 16 + Math.random() * 8, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.1, hp: 3, maxHp: 3, damage: Math.ceil(20 * BALANCE.superDamageMult), life: 400, color: "#8B7355", hasHaki: false, textureSeed: Math.random() * 1000 });
        }
        spawnWhiteCracks(whitebeard.x, whitebeard.y, 5);
        let shakeInterval = setInterval(function() {
            if (!window.rwbActive || rwbState !== "fight2") { clearInterval(shakeInterval); return; }
            rwbShake = Math.max(rwbShake, 12);
        }, 100);
        setTimeout(function() { clearInterval(shakeInterval); }, 1500);
    }

    function spawnWhitebeardGuraGura() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "💥 ГУРА-ГУРА 💥", color: "#ffffff", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 20 });
        playHakiChargeSound(0.4);
        setTimeout(function() { playExplosionSound(0.6); }, 500);
        for (let i = 0; i < 6; i++) {
            let rx = i === 0 ? (wbBrain.plannedTargetX || rwbPlayer.x) : 60 + Math.random() * 280;
            let ry = i === 0 ? (wbBrain.plannedTargetY || rwbPlayer.y) : 120 + Math.random() * 280;
            rwbAttacks.push({ type: "gura_crack", x: rx, y: ry, radius: 10, maxRadius: 85, damage: Math.ceil(24 * BALANCE.superDamageMult), life: 200, state: "warning", warningTimer: 70 + i * 15, activeTimer: 0, maxActive: 20, hit: false, color: "#ffffff" });
        }
        rwbShake = 20;
    }

    function spawnWhitebeardTitanFist() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "👊 ТИТАН-КУЛАК 👊", color: "#ffdd00", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 18 });
        playWhooshSound(0.5);
        setTimeout(function() { playImpactSound(0.8, 0.4); }, 900);
        rwbShake = 25;
        rwbAttacks.push({ type: "titan_fist", x: Math.max(75, Math.min(325, wbBrain.plannedTargetX || rwbPlayer.x)), y: -120, vy: 3.5, size: 75, damage: Math.ceil(35 * BALANCE.superDamageMult), life: 300, state: "falling", hit: false, color: "#8B7355" });
        for (let i = 0; i < 3; i++) {
            let cx = wbBrain.plannedRockXs && wbBrain.plannedRockXs.length ? wbBrain.plannedRockXs[i % wbBrain.plannedRockXs.length] : 40 + Math.random() * 320;
            rwbAttacks.push({ type: "rock", x: cx, y: -40 - Math.random() * 30, vx: (Math.random() - 0.5) * 0.6, vy: 3.0 + Math.random() * 1.0, size: 12 + Math.random() * 5, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.08, hp: 2, maxHp: 2, damage: Math.ceil(14 * BALANCE.superDamageMult), life: 350, color: "#8B7355", hasHaki: false, textureSeed: Math.random() * 1000 });
        }
    }

    function spawnWhitebeardRush() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "👊 НАВАЛА 👊", color: "#ffffff", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 20 });
        playBossRoarSound(0.4); playWhooshSound(0.4);
        for (let i = 0; i < 6; i++) {
            (function(idx) {
                setTimeout(function() {
                    if (!window.rwbActive || rwbState !== "fight2") return;
                    let targetX = (wbBrain.plannedTargetX || rwbPlayer.x) + (Math.random() - 0.5) * 80, targetY = (wbBrain.plannedTargetY || rwbPlayer.y) + (Math.random() - 0.5) * 80;
                    let dx = targetX - whitebeard.x, dy = targetY - whitebeard.y;
                    let len = Math.sqrt(dx * dx + dy * dy) || 1;
                    rwbAttacks.push({ type: "fist", x: whitebeard.x, y: whitebeard.y + 20, vx: (dx / len) * 6.0, vy: (dy / len) * 6.0, size: 14, hp: 3, maxHp: 3, damage: Math.ceil(16 * BALANCE.superDamageMult), life: 250, color: "#ffffff", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
                    playImpactSound(0.25, 1.0 + idx * 0.1);
                }, idx * 120);
            })(i);
        }
    }

    function spawnGiantRock() {
        let rx = 80 + Math.random() * 240;
        // The periodic arena boulder gets a visible warning instead of spawning without a tell.
        rwbAttacks.push({ type: "wb_giant_rock_warning", x: rx, targetX: rx, y: 470, warningTimer: 42, life: 43, color: "#b99a72" });
        rwbFloatingTexts.push({ x: rx, y: 80, text: "🪨 КАМЕНЬ НАД АРЕНОЙ 🪨", color: "#b99a72", life: 90, maxLife: 90, vy: -0.2, vx: 0, size: 16 });
        playWhooshSound(0.25);
    }

    function triggerSuper(winner, loser) {
        var superHp = RWB_SUPER_WB_HP;
        if (winner.id === "roger") superHp = RWB_SUPER_ROGER_HP;
        rwbState = "transition"; rwbTransitionTimer = 0;
        winner.superForm = true; winner.maxHp = superHp; winner.hp = superHp;
        winner.size *= 1.3; rwbActiveBoss = winner;
        rwbTitanFistTimer = 0; rwbTitanRockTimer = 0;
        rwbMeleeCooldown = 30;
        if (loser === roger) roger = null;
        if (loser === whitebeard) whitebeard = null;
        rwbAttacks = []; rwbShockwaves = [];
        // Reset Whitebeard AI when entering the second phase; otherwise a cleared wind-up can lock the brain forever.
        wbBrain.phase = "idle"; wbBrain.phaseTimer = 0; wbBrain.recoveryTimer = 0;
        wbBrain.adaptiveCooldown = 0; wbBrain.comboHint = null; wbBrain.lastAdaptive = null;
        rwbScreenFlash = 40; rwbScreenFlashColor = "#000000"; rwbShake = 35; rwbHakiAura = 40;
        playBossRoarSound(0.6); playHakiChargeSound(0.5);
        setTimeout(function() { playExplosionSound(0.4); }, 800);
        for (let i = 0; i < 40; i++) {
            let ang = Math.random() * Math.PI * 2, spd = 4 + Math.random() * 8;
            rwbParticles.push({ x: 200, y: 250, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 40, maxLife: 40, color: i % 3 === 0 ? "#000000" : (i % 3 === 1 ? "#ff2222" : "#ffffff"), size: 3 + Math.random() * 4 });
        }
        for (let i = 0; i < 15; i++) spawnHakiLightning(200 + (Math.random() - 0.5) * 150, 250 + (Math.random() - 0.5) * 150, 1, Math.random() > 0.6);
    }

    // ============================================================
    // ★★★ ОБНОВЛЕНИЕ АТАК — С ПРОВЕРКОЙ garouTimeStop ★★★
    // ============================================================
    function updateRWBAttacks() {
        if (wbVortexActive) return;
        // ★ ЕСЛИ ВРЕМЯ ОСТАНОВЛЕНО ИЛИ АНТИ-СПИРАЛЬ ЗАМОРОЗИЛА — НЕ ДВИГАЕМ АТАКИ ★
        var timeStopped = false;
        var frozen = false;
        if (typeof _superState !== 'undefined') {
            timeStopped = (_superState.garouTimeStop === true || _superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0 || _superState.takabaTimeStop === true);
            frozen = (_superState.antispiralFrozen === true);
        }
        var stopAll = timeStopped || frozen;

        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            let a = rwbAttacks[i];
            if (dioIsWindupActive() && typeof dioShouldFreezeEntity === 'function' && dioShouldFreezeEntity(a)) continue;

            // ★★★ ФИКС: при остановке времени — только визуал, никакой логики ★
            if (stopAll) {
                // Замораживаем таймеры
                // Но всё равно рисуем (рендер отдельно)
                continue;
            }
            if (a.type === "wb_combo_gate_warning") {
                a.warningTimer--;
                if (a.warningTimer <= 0) {
                    rwbAttacks.splice(i, 1);
                    let gateY = a.targetY;
                    for (let row = -1; row <= 1; row += 2) {
                        rwbAttacks.push({
                            type: "fist", x: -34, y: gateY + row * 24,
                            vx: 6.6 * BALANCE.projectileSpeedMult, vy: 0,
                            size: 27, hp: 5, maxHp: 5,
                            damage: Math.ceil(19 * BALANCE.whitebeardDamageMult),
                            life: 115, color: "#ffffff", owner: "whitebeard",
                            rotation: 0, rotSpeed: 0, trail: [], hasHaki: true
                        });
                        rwbAttacks.push({
                            type: "fist", x: 434, y: gateY - row * 24,
                            vx: -6.6 * BALANCE.projectileSpeedMult, vy: 0,
                            size: 27, hp: 5, maxHp: 5,
                            damage: Math.ceil(19 * BALANCE.whitebeardDamageMult),
                            life: 115, color: "#ffffff", owner: "whitebeard",
                            rotation: 0, rotSpeed: 0, trail: [], hasHaki: true
                        });
                    }
                    rwbShake = 12;
                    playImpactSound(0.42, 0.85);
                }
                continue;
            }
            if (a.type === "wb_attack_telegraph") {
                a.warningTimer--;
                if (a.warningTimer <= 0) {
                    let attackKind = a.attackKind, attackId = a.attackId;
                    rwbAttacks.splice(i, 1);
                    wbBrain.phase = "attack"; wbBrain.phaseTimer = 7;
                    if (attackKind === "super") executeWhitebeardSuperAttack(attackId);
                    else executeWhitebeardAttack(attackId);
                }
                continue;
            }

            var dioRWBCtx=(typeof getBossContext==="function")?getBossContext():null;
            if(rwbPlayer.invulnTimer<=0&&typeof window.dioAttackTouchesStand==="function"&&dioRWBCtx&&window.dioAttackTouchesStand(dioRWBCtx,a)){

                a.dioStandHitOnce=true;

                var hpBeforeStandHit = rwbPlayer.hp;

                var rwbStandDamage=(typeof window.MBIsGoldExperienceNpcActive==="function"&&window.MBIsGoldExperienceNpcActive()&&typeof window.scaleStandBlockedDamage==="function")?window.scaleStandBlockedDamage(Number(a.damage)||8):Math.max(1,Math.floor((Number(a.damage)||8)*.4));
                hitPlayer(rwbStandDamage,a);

                if (rwbPlayer.hp < hpBeforeStandHit && typeof dioRWBCtx.spawnFloatingText === "function") {

                    dioRWBCtx.spawnFloatingText(rwbPlayer.x, rwbPlayer.y - 25, "удар по стенду. меньше урона", "#ffffff");

                }

                rwbAttacks.splice(i,1);

                continue;

            }

            if (a.type === "wb_reflect_vortex") {
                a.life--; a.rotation += 0.028;
                if (a.life <= 0) { spawnDestroyParticles(a.x, a.y, a.color); rwbAttacks.splice(i, 1); }
                continue;
            }

            if (a.type === "wb_reflected_bullet") {
                a.x += a.vx; a.y += a.vy; a.life--;
                if (Math.random() < 0.5) rwbParticles.push({ x: a.x, y: a.y, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, life: 12, maxLife: 12, color: "#b989ff", size: 2 });
                if (rwbPlayer.invulnTimer <= 0 && Math.hypot(rwbPlayer.x - a.x, rwbPlayer.y - a.y) < a.size + rwbPlayer.size * 0.65) {
                    hitPlayer(a.damage,a); spawnHitParticles(a.x, a.y, "#b989ff", 6); rwbAttacks.splice(i, 1); continue;
                }
                if (a.life <= 0 || a.x < -25 || a.x > 425 || a.y < -25 || a.y > 525) rwbAttacks.splice(i, 1);
                continue;
            }

            if (a.type === "wb_center_wave") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) { a.state = "active"; a.y = 480; playImpactSound(0.4, 0.7); rwbShake = 8; }
                } else {
                    a.y -= a.speed; a.life--;
                    if (rwbPlayer.y > a.targetY) {
                        // Волна больше не гасит скорость и не перехватывает управление игроком.
                        // Игрок свободно двигается во время подъёма волны снизу.
                    }
                    if (Math.random() < 0.65) rwbParticles.push({ x: Math.random() * 400, y: a.y + (Math.random() - 0.5) * 14, vx: (Math.random() - 0.5) * 1.5, vy: -1.5 - Math.random() * 2, life: 18, maxLife: 18, color: "#9beaff", size: 2 + Math.random() * 2 });
                    if (a.y <= a.targetY || a.life <= 0) { spawnHitParticles(200, a.targetY, "#9beaff", 14); rwbAttacks.splice(i, 1); }
                }
                continue;
            }

            if (a.type === "wb_fruit_punch") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) {
                        a.state = "active"; a.activeTimer = 16; rwbShake = 28;
                        playExplosionSound(0.65); playImpactSound(0.65, 0.5);
                        for (let n = 1; n <= 6; n++) {
                            let t = n / 7;
                            spawnWhiteCracks(a.originX + (a.endX - a.originX) * t, a.originY + (a.endY - a.originY) * t, 2);
                        }
                        rwbShockwaves.push({ x: a.targetX, y: a.targetY, radius: 5, maxRadius: 115, speed: 8, color: "#ffffff", damage: 0, hit: true, canDestroy: false, life: 18, maxLife: 18, width: 5 });
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    let d = pointToSegmentDistance(rwbPlayer.x, rwbPlayer.y, a.originX, a.originY, a.endX, a.endY);
                    if (!a.hit && rwbPlayer.invulnTimer <= 0 && d < a.width / 2 + 7) {
                        a.hit = true; hitPlayer(20,{}); rwbPlayerStunTimer = 120; wbFruitFlashTimer = 180; wbFruitFlashPower = 0.72;
                    }
                    if (a.activeTimer <= 0) rwbAttacks.splice(i, 1);
                } else { rwbAttacks.splice(i, 1); }
                continue;
            }

            if (a.type === "wb_crescent_slash") {
                if (a.state === "windup") {
                    a.warningTimer--;
                    if (a.warningTimer % 9 === 0) {
                        spawnHakiLightning(a.originX, a.originY, 2, true);
                        rwbHakiAura = Math.max(rwbHakiAura, 12);
                    }
                    if (a.warningTimer <= 0) {
                        a.state = "flying"; a.life = 90; a.travelElapsed = 0;
                        a.x = 200; a.y = a.startY;
                        playImpactSound(0.95, 0.5); playWhooshSound(0.9); rwbShake = 26;
                        rwbScreenFlash = 10; rwbScreenFlashColor = "#ffffff";
                        for (let n = 0; n < 22; n++) spawnHakiLightning(Math.random() * 400, a.y + (Math.random() - 0.5) * 58, 1, true);
                    }
                } else if (a.state === "flying") {
                    a.travelElapsed = (a.travelElapsed || 0) + 1;
                    let travelProgress = Math.min(1, a.travelElapsed / (a.travelTime || 90));
                    a.y = a.startY + (a.targetY - a.startY) * travelProgress;
                    a.life = Math.max(0, (a.travelTime || 90) - a.travelElapsed);
                    if (Math.random() < 0.22) {
                        spawnHakiLightning(Math.random() * 400, a.y + (Math.random() - 0.5) * 42, 1, true);
                    }
                    if (!a.hit && rwbPlayer.invulnTimer <= 0 &&
                        Math.abs(rwbPlayer.y - a.y) < (a.width || 92) * 0.5 + rwbPlayer.size * 0.45) {
                        a.hit = true;
                        hitPlayer(40,{});
                        spawnHitParticles(rwbPlayer.x, a.y, "#ffffff", 24);
                        rwbScreenFlash = 8; rwbScreenFlashColor = "#ffffff"; rwbShake = 18;
                    }
                    if (a.hp <= 0) {
                        spawnDestroyParticles(200, a.y, "#ffffff");
                        rwbAttacks.splice(i, 1);
                        rwbFloatingTexts.push({ x: 200, y: Math.max(65, a.y - 35), text: "💥 СЛЭШ РАЗРУШЕН!", color: "#88ddff", life: 55, maxLife: 55, vy: -0.4, vx: 0, size: 15 });
                        continue;
                    }
                    if (a.life <= 0) { spawnHitParticles(200, a.y, "#ffffff", 28); rwbAttacks.splice(i, 1); continue; }
                } else { rwbAttacks.splice(i, 1); }
                continue;
            }

            if (a.type === "wb_giant_rock_warning") {
                a.warningTimer--;
                if (a.warningTimer <= 0) {
                    rwbAttacks.splice(i, 1);
                    rwbAttacks.push({
                        type: "giant_rock", x: a.targetX, y: a.combo ? -64 : -120,
                        vx: (Math.random() - 0.5) * (a.combo ? 0.2 : 0.4),
                        vy: a.combo ? 4.15 : 2.5,
                        size: a.combo ? 32 : 40,
                        rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * (a.combo ? 0.025 : 0.04),
                        hp: a.combo ? 4 : 5, maxHp: a.combo ? 4 : 5,
                        damage: Math.ceil((a.combo ? 23 : 28) * BALANCE.whitebeardDamageMult),
                        life: 500, color: "#8B7355", hasHaki: false, textureSeed: Math.random() * 1000
                    });
                    playWhooshSound(0.45);
                }
                continue;
            }

            if (a.type === "giant_rock") {
                a.x += a.vx; a.y += a.vy; a.rotation += a.rotSpeed; a.life--;
                if (Math.random() < 0.4) {
                    for (let k = 0; k < 2; k++) rwbParticles.push({ x: a.x + (Math.random() - 0.5) * a.size, y: a.y - a.size * 0.5, vx: (Math.random() - 0.5) * 2, vy: -1 - Math.random() * 2, life: 20, maxLife: 20, color: Math.random() > 0.5 ? "#8B7355" : "#5a4030", size: 2 + Math.random() * 3 });
                }
                if (rwbPlayer.invulnTimer <= 0) {
                    let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                    if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.7 * BALANCE.playerHitboxMult + getRWBSuperHitboxBonus()) { hitPlayer(a.damage,a); spawnRockSmash(a.x, a.y, a.size); rwbAttacks.splice(i, 1); continue; }
                }
                if (a.y > 480 || a.life <= 0) { spawnRockSmash(a.x, 480, a.size); playImpactSound(0.8, 0.4); rwbShake = 30; rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "tsunami") {
                a.waveTime += 0.08; a.y += a.vy; a.life--;
                a.currentHeight = a.height * (1 + Math.sin(a.waveTime) * 0.15);
                if (a.comboPull && wbTrapCombo.stage !== "idle" && rwbPlayer) {
                    // The current pulls even during temporary invulnerability; it is movement control,
                    // not damage. Keep the pull limited so active dodging can still resist it.
                    let nearWave = Math.abs(rwbPlayer.y - a.y) < 195;
                    if (nearWave) {
                        let pullTargetX = Number.isFinite(Number(a.pullTargetX)) ? Number(a.pullTargetX) : wbTrapCombo.pullTargetX;
                        let pullTargetY = Number.isFinite(Number(a.pullTargetY)) ? Number(a.pullTargetY) : wbTrapCombo.pullTargetY;
                        let pullX = clampWhitebeard((pullTargetX - rwbPlayer.x) * 0.025, -1.6, 1.6);
                        let pullY = clampWhitebeard((pullTargetY - rwbPlayer.y) * 0.014, -0.9, 0.9);
                        rwbPlayer.x = clampWhitebeard(rwbPlayer.x + pullX, 16, 384);
                        rwbPlayer.y = clampWhitebeard(rwbPlayer.y + pullY, 0, 484);
                    }
                }
                a.currentWidth = a.width * (1 + Math.cos(a.waveTime * 1.5) * 0.03);
                if (Math.random() < 0.3) rwbParticles.push({ x: a.x + Math.random() * a.currentWidth, y: a.y + (Math.random() - 0.5) * a.currentHeight, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 2, life: 25, maxLife: 25, color: Math.random() > 0.5 ? "#ffffff" : "#88ddff", size: 2 });
                if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                    let dy = Math.abs(rwbPlayer.y - a.y);
                    let hbY = a.currentHeight / 2 + 6;
                    if (a.fromRight) { if (dy < hbY && rwbPlayer.x >= a.x && rwbPlayer.x <= 400) { a.hit = true; hitPlayer(a.damage,a); } }
                    else { if (dy < hbY && rwbPlayer.x >= 0 && rwbPlayer.x <= a.width) { a.hit = true; hitPlayer(a.damage,a); } }
                }
                if (a.y > 600 || a.life <= 0) rwbAttacks.splice(i, 1);
                continue;
            }

            if (a.type === "rock") {
                a.x += a.vx; a.y += a.vy; a.rotation += a.rotSpeed; a.life--;
                if (Math.random() < 0.15) rwbParticles.push({ x: a.x + (Math.random() - 0.5) * a.size, y: a.y - a.size * 0.5, vx: (Math.random() - 0.5) * 1, vy: -0.5 - Math.random() * 1, life: 12, maxLife: 12, color: "#5a4030", size: 1.5 });
                if (rwbPlayer.invulnTimer <= 0) {
                    let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                    if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.75 * BALANCE.playerHitboxMult + getRWBSuperHitboxBonus()) { hitPlayer(a.damage,a); spawnRockSmash(a.x, a.y, a.size); rwbAttacks.splice(i, 1); continue; }
                }
                if (a.y > 500 || a.life <= 0) { spawnRockSmash(a.x, 480, a.size); rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "haki_wave") {
                a.x += a.vx; a.life--;
                if (Math.random() < 0.3) rwbParticles.push({ x: a.x, y: a.y + (Math.random() - 0.5) * a.size, vx: a.vx * 0.3, vy: (Math.random() - 0.5) * 2, life: 15, maxLife: 15, color: "#ff8800", size: 2 });
                if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                    let dx = Math.abs(rwbPlayer.x - a.x), dy = Math.abs(rwbPlayer.y - a.y);
                    if (dx < a.size * 0.6 + 4 && dy < a.size * 0.6 + 4) { a.hit = true; hitPlayer(a.damage,a); }
                }
                if (a.x < -60 || a.x > 460 || a.life <= 0) rwbAttacks.splice(i, 1);
                continue;
            }

            if (a.type === "roger_slash") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) { a.state = "active"; a.activeTimer = a.maxActive; rwbShake = 20; playBladeSound(0.5); playImpactSound(0.4, 1.0); }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let hit = (a.direction === "horizontal") ? Math.abs(rwbPlayer.y - a.y) < a.width / 2 * 0.7 + 4 : Math.abs(rwbPlayer.x - a.x) < a.width / 2 * 0.7 + 4;
                        if (hit) { a.hit = true; hitPlayer(a.damage,a); }
                    }
                    if (a.activeTimer <= 0) a.state = "done";
                } else { rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "roger_cross") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) { a.state = "active"; a.activeTimer = a.maxActive; rwbShake = 18; playBladeSound(0.4); }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                        let hb = a.width / 2 * 0.7 + 4;
                        let hit = (a.dir === "vertical") ? Math.abs(dx) < hb : Math.abs(dy) < hb;
                        if (hit) { a.hit = true; hitPlayer(a.damage,a); }
                    }
                    if (a.activeTimer <= 0) a.state = "done";
                } else { rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "hell_fire") {
                if (a.state === "flying") {
                    a.flyTimer++;
                    let dx = a.targetX - a.x, dy = a.targetY - a.y;
                    let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (dist < a.speed) {
                        a.state = "exploding"; a.explosionTimer = 50;
                        a.x = a.targetX; a.y = a.targetY;
                        rwbShake = 25; playExplosionSound(0.6);
                        for (let j = 0; j < 10; j++) {
                            let ang = (j / 10) * Math.PI * 2;
                            rwbAttacks.push({ type: "fire_piece", x: a.x, y: a.y, vx: Math.cos(ang) * 2.5, vy: Math.sin(ang) * 2.5, size: 7, hp: 1, maxHp: 1, damage: Math.ceil(16 * BALANCE.superDamageMult), life: 120, color: "#ff4400" });
                        }
                    } else { a.x += (dx / dist) * a.speed; a.y += (dy / dist) * a.speed; }
                    if (Math.random() < 0.3) rwbParticles.push({ x: a.x + (Math.random() - 0.5) * a.size, y: a.y + (Math.random() - 0.5) * a.size, vx: 0, vy: -1, life: 20, maxLife: 20, color: Math.random() > 0.5 ? "#ff4400" : "#ffcc00", size: 2 });
                } else if (a.state === "exploding") {
                    a.explosionTimer--;
                    if (a.explosionTimer <= 0) a.state = "done";
                } else { rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "fire_piece") {
                a.x += a.vx; a.y += a.vy; a.life--;
                if (rwbPlayer.invulnTimer <= 0) {
                    let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                    if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.7 * BALANCE.playerHitboxMult + Math.max(2, getRWBSuperHitboxBonus() - 1)) { hitPlayer(a.damage,a); rwbAttacks.splice(i, 1); continue; }
                }
                if (a.life <= 0 || a.x < -20 || a.x > 420 || a.y < -20 || a.y > 520) rwbAttacks.splice(i, 1);
                continue;
            }

            if (a.type === "gura_crack") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) {
                        a.state = "active"; a.activeTimer = a.maxActive;
                        rwbShake = 18; playExplosionSound(0.5);
                        for (let j = 0; j < 12; j++) {
                            let ang = (j / 12) * Math.PI * 2;
                            rwbParticles.push({ x: a.x, y: a.y, vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5, life: 22, maxLife: 22, color: "#ffffff", size: 2 });
                        }
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    a.radius = a.maxRadius * (1 - a.activeTimer / a.maxActive);
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                        if (Math.sqrt(dx * dx + dy * dy) < a.radius * 0.85 + 4) { a.hit = true; hitPlayer(a.damage,a); }
                    }
                    if (a.activeTimer <= 0) a.state = "done";
                } else { rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "titan_fist") {
                if (a.state === "falling") {
                    a.y += a.vy; a.life--;
                    if (Math.random() < 0.3) rwbParticles.push({ x: a.x + (Math.random() - 0.5) * a.size, y: a.y + a.size * 0.5, vx: (Math.random() - 0.5) * 2, vy: -1, life: 20, maxLife: 20, color: Math.random() > 0.5 ? "#ff6600" : "#ffaa00", size: 2 });
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                        if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.7 * BALANCE.playerHitboxMult + getRWBSuperHitboxBonus()) { a.hit = true; hitPlayer(a.damage,a); }
                    }
                    if (a.y > 380) {
                        a.state = "impact"; a.impactTimer = 30;
                        rwbShake = 40; playImpactSound(0.9, 0.4); playExplosionSound(0.5);
                        for (let j = 0; j < 12; j++) {
                            let ang = (j / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                            rwbAttacks.push({ type: "rock", x: a.x, y: a.y, vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3 - 1.5, size: 10 + Math.random() * 6, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.15, hp: 1, maxHp: 1, damage: Math.ceil(14 * BALANCE.superDamageMult), life: 200, color: "#8B7355", hasHaki: false, textureSeed: Math.random() * 1000 });
                        }
                    }
                } else if (a.state === "impact") {
                    a.impactTimer--;
                    if (a.impactTimer <= 0) a.state = "done";
                } else { rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.isHoming && a.targetX !== undefined) {
                let dx = a.targetX - a.x, dy = a.targetY - a.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                a.vx += (dx / dist) * a.homingSpeed;
                a.vy += (dy / dist) * a.homingSpeed;
                let maxSpd = 6;
                let curSpd = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
                if (curSpd > maxSpd) { a.vx = (a.vx / curSpd) * maxSpd; a.vy = (a.vy / curSpd) * maxSpd; }
            }

            a.x += a.vx; a.y += a.vy;
            a.rotation += a.rotSpeed || 0;
            a.life--;

            if (a.trail) { a.trail.push({ x: a.x, y: a.y, life: 10 }); if (a.trail.length > 4) a.trail.shift(); }
            if (a.hasHaki && Math.random() < 0.04) spawnHakiLightning(a.x, a.y, 1, false);

            if (rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.75 * BALANCE.playerHitboxMult + getRWBSuperHitboxBonus()) { hitPlayer(a.damage,a); rwbAttacks.splice(i, 1); continue; }
            }
            if (a.life <= 0 || a.y > 520 || a.x < -60 || a.x > 460 || a.y < -150) rwbAttacks.splice(i, 1);
        }
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            let sw = rwbShockwaves[i];
            // ★ При остановке времени шоквейвы тоже стоят ★
            if (!stopAll) {
                sw.radius += sw.speed; sw.life--;
            }
            if(!stopAll&&!sw.hit&&rwbPlayer.invulnTimer<=0&&typeof window.getDioStandPosition==="function"&&typeof window.isStandUserStandActive==="function"&&window.isStandUserStandActive()){
                let sd=window.getDioStandPosition((typeof getBossContext==="function")?getBossContext():null);
                if(sd&&Math.abs(Math.hypot(sd.x-sw.x,sd.y-sw.y)-sw.radius)<sw.width*.7+(sd.radius||7)){sw.hit=true;hitPlayer(typeof window.scaleStandBlockedDamage==="function"?window.scaleStandBlockedDamage(Number(sw.damage)||8):Math.max(1,Math.floor((Number(sw.damage)||8)*.4)));}
            }
            if (!stopAll && sw.canDestroy && !sw.hit && rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
                let dx = rwbPlayer.x - sw.x, dy = rwbPlayer.y - sw.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (Math.abs(dist - sw.radius) < sw.width * 0.7 + 4) { sw.hit = true; hitPlayer(sw.damage); }
            }
            if (sw.life <= 0 || sw.radius > sw.maxRadius) rwbShockwaves.splice(i, 1);
        }
    }

    function spawnRockSmash(x, y, size) {
        rwbShake = 8; playImpactSound(0.3, 0.8);
        for (let i = 0; i < 10; i++) {
            let ang = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 4;
            rwbParticles.push({ x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1.5, life: 22, maxLife: 22, color: Math.random() > 0.5 ? "#8B7355" : "#5a4030", size: 2 + Math.random() * 2 });
        }
    }

    function updateRWBPlayerBullets() {
        if (wbVortexActive) return;
        // ★ При остановке времени — пули тоже стоят ★
        var stopAll = false;
        if (typeof _superState !== 'undefined') {
            stopAll = (_superState.garouTimeStop === true ||
                       _superState.dioTimeStop > 0 ||
                       _superState.dioTeleportStop > 0 ||
                       _superState.takabaTimeStop === true ||
                       _superState.antispiralFrozen === true ||
                       _superState.usoppStunTimer > 0);
        }

        for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
            let b = rwbPlayerBullets[i];
            if (!stopAll) {
                b.x += b.vx; b.y += b.vy; b.life--;
            }
            let destroyed = false;

            // Воронка ловит любой снаряд игрока и разворачивает его обратно.
            if (!stopAll && !b.reflected) {
                let vortex = null;
                for (let k = rwbAttacks.length - 1; k >= 0; k--) {
                    let candidate = rwbAttacks[k];
                    if (candidate.type === "wb_reflect_vortex" && candidate.life > 0 &&
                        Math.hypot(b.x - candidate.x, b.y - candidate.y) < candidate.radius + (b.size || 4)) {
                        vortex = candidate; break;
                    }
                }
                if (vortex) {
                    let dx = rwbPlayer.x - b.x, dy = rwbPlayer.y - b.y;
                    let len = Math.hypot(dx, dy) || 1;
                    let speed = Math.max(6, Math.hypot(b.vx || 0, b.vy || 0));
                    rwbAttacks.push({ type: "wb_reflected_bullet", x: b.x, y: b.y, vx: dx / len * speed, vy: dy / len * speed, size: Math.max(5, b.size || 4), damage: 7, life: 120, color: "#b989ff" });
                    spawnHitParticles(b.x, b.y, "#b989ff", 4);
                    rwbPlayerBullets.splice(i, 1);
                    continue;
                }
            }

            if (b.isBlue) {
                for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                    let a = rwbAttacks[j];
                    if (a.type === "tsunami" || a.type === "titan_fist" || a.type === "gura_crack" || a.type === "purple_crack_zone" || a.type === "haki_wave" || a.type === "wb_attack_telegraph" ||
                        a.type === "wb_reflect_vortex" || a.type === "wb_center_wave" || a.type === "wb_fruit_punch" ||
                        (a.type === "wb_crescent_slash" && a.state !== "flying")) continue;
                    if (a.hp === undefined) continue;
                    let dx = b.x - a.x, dy = b.y - a.y;
                    let aSize = a.size || a.radius || 20;
                    let hitsSlashLane = a.type === "wb_crescent_slash" && a.state === "flying" &&
                        b.x >= 0 && b.x <= 400 &&
                        Math.abs(b.y - a.y) <= (a.width || 92) * 0.5 + (b.size || 4);
                    if (hitsSlashLane || (a.type !== "wb_crescent_slash" && Math.sqrt(dx * dx + dy * dy) < aSize * 0.7 + b.size + 4)) {
                        a.hp -= 1;
                        spawnHitParticles(b.x, b.y, "#00aaff", 3);
                        playWhooshSound(0.08);
                        if (a.hp <= 0) {
                            spawnDestroyParticles(a.x, a.y, a.color || "#ffffff");
                            playImpactSound(0.2, 1.3);
                            rwbAttacks.splice(j, 1);
                        }
                        destroyed = true; break;
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
                            if (sw.hp <= 0) { spawnDestroyParticles(b.x, b.y, sw.color); rwbShockwaves.splice(j, 1); }
                            destroyed = true; break;
                        }
                    }
                }
            } else {
                let targets = [];
                if (rwbState === "fight1") { if (roger) targets.push(roger); if (whitebeard) targets.push(whitebeard); }
                else if (rwbState === "fight2" && rwbActiveBoss) targets.push(rwbActiveBoss);
                for (let boss of targets) {
                    let dx = b.x - boss.x, dy = b.y - boss.y;
                    if (Math.sqrt(dx * dx + dy * dy) < boss.size * 0.75 + b.size) {
                        let dmg = b.damage;
                        let moderatorBulletDamage = window.MBGetModeratorBulletDamage(boss.maxHp);
                        if (moderatorBulletDamage !== null) dmg = moderatorBulletDamage;
                        if (typeof window.applyArmorToBossDamage === 'function' && !isModerActive()) {
                            let result = window.applyArmorToBossDamage(dmg);
                            if (result.blocked) { spawnHitParticles(b.x, b.y, "#9b59b6", 6); playImpactSound(0.15, 1.5); destroyed = true; break; }
                            dmg = result.dmg;
                        }
                        if (typeof window!=="undefined" && window.__mbBossTestMode && typeof window.MBBossTestModifyOutgoingDamage==="function") dmg=window.MBBossTestModifyOutgoingDamage(dmg,1);
                        if (typeof window.MBKarsApplyDamageBonus === "function") dmg = window.MBKarsApplyDamageBonus(dmg);
                        boss.hp = Math.max(0, boss.hp - dmg);
                        if (rwbState === "fight1") rwbPlayerFocusTargetId = boss.id;
                        // During the two-boss opening phase there is no single active boss HP
                        // for the common tracker, so charge directly from real, unblocked hits.
                        // Once fight2 selects a boss, dioTrackBossDamage handles its health bar.
                        let rwbBossIsTracked = typeof window.getRWBActiveBoss === 'function' && !!window.getRWBActiveBoss();
                        if (!rwbBossIsTracked && typeof window.dioAddEnergy === 'function' && dmg > 0) {
                            let bossMaxHpForDio = Math.max(1, Number(boss.maxHp) || 1);
                            window.dioAddEnergy((dmg / bossMaxHpForDio) * 35);
                        }
                        boss.hitFlash = 4;
                        if (boss.id === "whitebeard") boss.damageFlashTimer = Math.max(Number(boss.damageFlashTimer) || 0, 8);
                        spawnHitParticles(b.x, b.y, b.color, 4);
                        playImpactSound(0.15, 1.2 + Math.random() * 0.3);
                        destroyed = true; break;
                    }
                }
            }
            if (destroyed) { rwbPlayerBullets.splice(i, 1); continue; }
            if (b.life <= 0 || b.y < -20 || b.x < -20 || b.x > 420) rwbPlayerBullets.splice(i, 1);
        }
    }

    // ============================================================
    // ★★★ hitPlayer — ПОЛНАЯ ОБРАБОТКА СУПЕР-ЗАЩИТ ★★★
    // ============================================================
    function getRWBSuperHitboxBonus() {
        let hb = 4;
        if (typeof _superState !== 'undefined') {
            if (_superState.nikaActive) hb *= 2;
            if (_superState.antispiralActive) hb *= 0.7;
            if (_superState.allmightBuffTimer > 0) hb *= 2;
        }
        return hb;
    }

    function hitPlayer(dmg, sourceAction, damageCategory) {
        if (typeof window!=="undefined" && window.__mbBossTestMode && typeof window.MBBossTestModifyIncomingDamage==="function") {
            dmg=window.MBBossTestModifyIncomingDamage(dmg,"rwb");
            if(dmg<=0)return;
        }
        if (isModerActive()) return;

        // ★ 1. Проверка неуязвимости (ДО всего остального) ★
        if (typeof _superState !== 'undefined') {
            if (_superState.usoppInvuln) return;
            if (_superState.dandyInvuln) return;
            if (_superState.garouInvulnTimer > 0) return;
            if ((_superState.garouTimeStop || _superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0)) return;
            if (_superState.dekusActive && _superState.dekusInvuln) return;
        }

        // ★ 2. Проверка локальной неуязвимости ★
        if (rwbPlayer.invulnTimer > 0) return;
        if (typeof window.gojoTryNegateIncoming === "function" && window.gojoTryNegateIncoming(dmg, "rwb")) return;

        // ★ 3. Применяем множители редукции урона ★
        if (typeof _superState !== 'undefined') {
            if (_superState.nikaActive) dmg = Math.floor(dmg * 0.6);
            if (_superState.kaidoDmgReduction) dmg = Math.floor(dmg * 0.7);
            if (_superState.garpHakiActive) dmg = Math.floor(dmg * 0.4);
            if (_superState.dandyShield && _superState.dandyShield.timer > 0) dmg = Math.floor(dmg * _superState.dandyShield.mult);
            if (_superState.dandyVulnerable && _superState.dandyVulnerable.timer > 0) dmg = Math.floor(dmg * _superState.dandyVulnerable.mult);
            if (_superState.markBuffActive && _superState.markDmgReduction > 1) dmg = Math.floor(dmg / _superState.markDmgReduction);
        }
        if (typeof getTakabaCombatModifiers === 'function') {
            try { dmg = Math.floor(dmg * getTakabaCombatModifiers().damageTakenMult); } catch(e) {}
        }

        // ★ 4. Применяем броню (отражение, редукция) ★
        if (typeof window.applyArmorToBossDamage === 'function') {
            let result = window.applyArmorToBossDamage(dmg);
            if (result.blocked) return;
            dmg = result.dmg;
        }

        // ★ 5. Минимум 1 урона ★
        dmg = Math.max(1, Math.floor(dmg));

        if (typeof onTakabaDamageTaken === "function") {
            try { onTakabaDamageTaken(dmg); } catch(e) {}
        }
        if (typeof window.MBKarsProcessIncomingDamage === "function") dmg = window.MBKarsProcessIncomingDamage(dmg);
        if (typeof window.MBGERTryNullifyDamage === "function" &&
            window.MBGERTryNullifyDamage(dmg, sourceAction, damageCategory || "combat")) {
            rwbPlayer.invulnTimer = 50;
            var gerHpEl = document.getElementById("arenaHP");
            if (gerHpEl) gerHpEl.innerText = Math.max(0, rwbPlayer.hp);
            if (typeof window.rwbAddFlash === "function") window.rwbAddFlash(7,"#ffe27a");
            return;
        }
        rwbPlayer.hp -= dmg;
        rwbPlayer.invulnTimer = 50;
        rwbShake = 12; rwbScreenFlash = 8; rwbScreenFlashColor = "#ff0000";
        playImpactSound(0.5, 0.6); playWhooshSound(0.2);
        let hpEl = document.getElementById("arenaHP");
        if (hpEl) hpEl.innerText = Math.max(0, rwbPlayer.hp);
        for (let p = 0; p < 12; p++) {
            let ang = Math.random() * Math.PI * 2;
            rwbParticles.push({ x: rwbPlayer.x, y: rwbPlayer.y, vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5, life: 20, maxLife: 20, color: "#ff3333", size: 2 + Math.random() * 2 });
        }
        if (rwbPlayer.hp <= 0) rwbDefeat();
    }

    function spawnHitParticles(x, y, color, count) {
        if (!count) count = 6;
        for (let i = 0; i < count; i++) {
            let ang = Math.random() * Math.PI * 2;
            rwbParticles.push({ x: x, y: y, vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3, life: 15, maxLife: 15, color: color, size: 2 });
        }
    }

    function spawnDestroyParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            let ang = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 5;
            rwbParticles.push({ x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1, life: 22, maxLife: 22, color: i % 2 === 0 ? "#ff2222" : color, size: 2 });
        }
    }

    function rwbVictory() {
        if (rwbDialogActive || rwbState === "done" || rwbState === "victory") return;
        rwbWinner = rwbActiveBoss ? rwbActiveBoss.id : null;
        console.log("[ROGER-WB] Победа над:", rwbWinner);
        rwbState = "victory"; rwbEndTimer = 0; rwbRewardGiven = false;
        hideRWBModeButton(); hideRWBSuperButton();
        if (typeof showFloatingText === 'function') showFloatingText(rwbWinner === "roger" ? "🔥 РОДЖЕР ПАЛ!" : "❄️ БЕЛОУС ПАЛ!", "#ffd700");
        playImpactSound(0.5, 0.7);
        setTimeout(function() { playImpactSound(0.6, 0.9); }, 200);
        setTimeout(function() { playImpactSound(0.7, 1.2); }, 400);
        setTimeout(function() { if (window.rwbActive && !rwbDialogActive) startRWBDialog(); }, 1500);
    }

    function rwbDefeat() {
        if (typeof window!=="undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===1000) {
            stopRogerWhitebeardFight();
            if(typeof window.MBBossTestFinish==="function")window.MBBossTestFinish("loss",true);
            return;
        }
        if (isModerActive()) return;
        if (rwbState === "defeat") return;
        if (typeof window.MBTryMarkResurrection === "function" && rwbPlayer) {
            let markRestoredHp = window.MBTryMarkResurrection(rwbPlayer.maxHp);
            if (markRestoredHp > 0) {
                rwbPlayer.hp = markRestoredHp;
                rwbPlayer.invulnTimer = 90;
                let markHpEl = document.getElementById("arenaHP");
                if (markHpEl) markHpEl.innerText = Math.ceil(rwbPlayer.hp);
                rwbFloatingTexts.push({
                    x: rwbPlayer.x, y: rwbPlayer.y - 28,
                    text: "МАРК ВЕРНУЛ ТЕБЯ В БОЙ!", color: "#ffd966",
                    life: 80, maxLife: 80, vy: -0.5, vx: 0, size: 13
                });
                return;
            }
        }
        if (typeof window.MBUniqueBossFightFinish === "function") window.MBUniqueBossFightFinish("roger_whitebeard", "death");
        if (typeof window.MBPreserveGarouChargesForUniqueBossRetry === "function") {
            window.MBPreserveGarouChargesForUniqueBossRetry("rwb");
        }
        rwbState = "defeat"; rwbEndTimer = 0;
        hideRWBModeButton(); hideRWBSuperButton();
        playBossRoarSound(0.5); playExplosionSound(0.4);
        if (typeof showFloatingText === 'function') showFloatingText("💀 ТЫ ПАЛ...", "#ff0000");
    }

    function stopRogerWhitebeardFight() {
        if (typeof window.MBUniqueBossFightFinish === "function") window.MBUniqueBossFightFinish("roger_whitebeard", "abandoned");
        if (typeof window.MBEndBossGraphicsModeForFight === "function") window.MBEndBossGraphicsModeForFight();
        if (rwbWatchdog) { clearTimeout(rwbWatchdog); rwbWatchdog = null; }
        window.rwbActive = false; rwbDialogActive = false;
        rwbPlayerStunTimer = 0; wbFruitFlashTimer = 0;
        wbBrain = { bottomFrames: 0, stationaryFrames: 0, farFrames: 0, shotsInWindow: 0, shotWindowTimer: 0, adaptiveCooldown: 0, lastX: 200, lastY: 420, lastAdaptive: null };
        hideRWBModeButton(); hideRWBGraphicsButton(); hideRWBSuperButton(); stopRWBMusic();
        if (typeof resetAllSupers === 'function') { try { resetAllSupers(); } catch(e) {} }
        rwbSupersInitialized = false;
        if (typeof window !== 'undefined') window._uniqueSuperBossId = null;

        // ★ СБРОС СКОРОСТИ ★
        rwbBaseSpeed = rwbOriginalBaseSpeed;
        rwbSpeedMult = 1.0;

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
    // ГЛАВНЫЙ РЕНДЕР-ЛУП
    // ============================================================
    function rwbRenderLoop() {
        if (!window.rwbActive || !ctx || !canvas) return;
        var reduceBossEffects = isRWBMobileGraphics();
        if (reduceBossEffects) {
            rwbShake = 0; rwbScreenFlash = 0;
            if (typeof _superState !== "undefined") { _superState.screenFlashWhite = 0; _superState.screenShakeAmount = 0; }
            if (rwbParticles.length > 24) rwbParticles.splice(0, rwbParticles.length - 24);
            if (rwbShockwaves.length > 4) rwbShockwaves.splice(0, rwbShockwaves.length - 4);
            if (rwbSpeedLines.length > 0) rwbSpeedLines.length = 0;
            if (rwbHakiLightnings.length > 0) rwbHakiLightnings.length = 0;
            if (rwbWhiteCracks.length > 0) rwbWhiteCracks.length = 0;
            if (rwbPurpleCracks.length > 0) rwbPurpleCracks.length = 0;
        } else if (window.MBIsMediumGraphics && window.MBIsMediumGraphics()) {
            if (rwbParticles.length > 90) rwbParticles.splice(0, rwbParticles.length - 90);
            if (rwbShockwaves.length > 24) rwbShockwaves.splice(0, rwbShockwaves.length - 24);
        }

        // The boss path is calculated from rwbTimer. Do not advance that clock while
        // time is stopped (or during the vortex), otherwise the boss jumps on resume.
        var rwbWorldStopped = wbVortexActive;
        if (typeof _superState !== "undefined") {
            rwbWorldStopped = rwbWorldStopped || _superState.garouTimeStop === true ||
                (_superState.dioTimeStop || 0) > 0 || (_superState.dioTeleportStop || 0) > 0 ||
                _superState.takabaTimeStop === true || _superState.antispiralFrozen === true ||
                (_superState.usoppStunTimer || 0) > 0;
        }
        if (!rwbWorldStopped) rwbTimer++;
        if (!rwbWorldStopped && wbFruitFlashTimer > 0) wbFruitFlashTimer--;

        if (typeof tickSupers === 'function') {
            try { tickSupers(); } catch(e) { console.error("[ROGER-WB] tickSupers error:", e); }
        }

        // В телефонном режиме не применяем дорогую тряску камеры.
        if (isRWBMobileGraphics()) {
            rwbShake = 0;
        } else if (typeof _superState !== 'undefined' && _superState.screenShakeAmount > 0) {
            rwbShake = Math.max(rwbShake, _superState.screenShakeAmount);
        }

        if (typeof updateSuperButton === 'function') updateSuperButton();
        if (typeof updateRWBMainSuperButton === "function") updateRWBMainSuperButton();

        if (rwbDialogActive) {
            rwbDialogTimer++;
            if (rwbPlayer && rwbPlayer.invulnTimer > 0) rwbPlayer.invulnTimer--;
        } else {
            if (rwbState === "intro") {
                rwbIntroTimer++;
                if (rwbIntroTimer > 150) rwbState = "fight1";
            } else if (rwbState === "fight1") {
                updateRWBPlayer(); updateDuel(); updateRWBAttacks(); updateRWBPlayerBullets();
            } else if (rwbState === "transition") {
                rwbTransitionTimer++;
                if (rwbTransitionTimer > 100) { rwbState = "fight2"; rwbSurvivalTimer2 = 0; rwbTitanFistTimer = 0; rwbTitanRockTimer = 0; }
            } else if (rwbState === "fight2") {
                updateRWBPlayer(); updateSuperBoss(); updateRWBAttacks(); updateRWBPlayerBullets();
                checkMeleeContact();
                rwbSurvivalTimer2++;
                if (rwbActiveBoss && rwbActiveBoss.hp <= 0) rwbVictory();
                if (rwbActiveBoss && rwbActiveBoss.id === "whitebeard") {
                    // Воронка имеет отдельный реальный таймер, не зависящий от FPS.
                    // Один бросок шанса 35% ровно раз в 20 секунд.
                    let wbNow = (typeof performance !== 'undefined' ? performance.now() : Date.now());
                    if (!wbVortexActive) {
                        if (!wbVortexClockAt) wbVortexClockAt = wbNow;
                        let wbDelta = Math.max(0, wbNow - wbVortexClockAt);
                        wbVortexClockAt = wbNow;
                        wbVortexElapsedMs += Math.min(wbDelta, 250);
                        if (wbVortexElapsedMs >= WB_VORTEX_INTERVAL_MS) {
                            wbVortexElapsedMs = 0;
                            if (Math.random() < WB_VORTEX_CHANCE) {
                                spawnWhitebeardVortex();
                            }
                        }
                    } else {
                        // Пока QTE идёт, новый 20-секундный цикл не накапливается.
                        wbVortexClockAt = wbNow;
                    }
                    rwbTitanFistTimer++;
                    if (!wbVortexActive && rwbTitanFistTimer >= RWB_TITAN_INTERVAL * (isWBReflectVortexActive() ? 1.43 : 1)) {
                        rwbTitanFistTimer = 0;
                        // Periodic pressure uses the same readable wind-up as the normal super attack director.
                        if (wbBrain.phase === "idle") queueWhitebeardAttack("super", 2);
                    }
                    if (!wbVortexActive) {
                        rwbTitanRockTimer++;
                        if (rwbTitanRockTimer >= RWB_ROCK_INTERVAL * (isWBReflectVortexActive() ? 1.43 : 1)) { rwbTitanRockTimer = 0; spawnGiantRock(); }
                    }
                }
                let remaining = Math.max(0, Math.ceil((rwbSurvivalTarget2 - rwbSurvivalTimer2) / 60));
                let timerEl = document.getElementById("arenaTimer");
                if (timerEl) timerEl.innerText = remaining + "с";
            } else if (rwbState === "victory") {
                rwbEndTimer++;
            } else if (rwbState === "defeat") {
                if (rwbEndTimer > 120 && !rwbOdenOfferShown && getRWBOdenConsent() !== "yes") {
                    rwbOdenOfferShown = true;
                    rwbDialogActive = true;
                    rwbDialogType = "oden_offer";
                    rwbDialogTimer = 0;
                } else {
                    rwbEndTimer++;
                    if (rwbEndTimer > 180) {
                        stopRogerWhitebeardFight();
                        if (typeof playerHp !== 'undefined') playerHp = 0;
                        if (typeof defeat === 'function') defeat();
                        return;
                    }
                }
            } else if (rwbState === "done") { return; }
        }

        // Delayed attack callbacks may still fire during the vortex; keep the arena clear until it ends.
        if (wbVortexActive) clearWhitebeardVortexAttacks();

        // Oden only joins combat after the player accepts his offer following a defeat.
        // Time-stop effects freeze his sword and projectiles with the battlefield.
        if (!rwbWorldStopped && !rwbDialogActive &&
            (rwbState === "fight1" || rwbState === "fight2")) {
            updateRWBOdenSupport();
        }

        if (Math.abs(rwbPlayer.vx) > 0.1 || Math.abs(rwbPlayer.vy) > 0.1) {
            rwbPlayer.x += rwbPlayer.vx;
            rwbPlayer.y += rwbPlayer.vy;
            rwbPlayer.vx *= 0.88;
            rwbPlayer.vy *= 0.88;
            rwbPlayer.x = Math.max(16, Math.min(384, rwbPlayer.x));
            rwbPlayer.y = Math.max(0, Math.min(484, rwbPlayer.y));
            if (Math.abs(rwbPlayer.vx) < 0.2) rwbPlayer.vx = 0;
            if (Math.abs(rwbPlayer.vy) < 0.2) rwbPlayer.vy = 0;
        }

        // Ограничиваем только декоративные эффекты; реальные атаки и хитбоксы не трогаем.
        if (isRWBMobileGraphics()) {
            if (rwbParticles.length > 48) rwbParticles.splice(0, rwbParticles.length - 48);
            rwbSpeedLines.length = 0;
            rwbHakiLightnings.length = 0;
            rwbWhiteCracks.length = 0;
            rwbPurpleCracks.length = 0;
            if (rwbShockwaves.length > 5) rwbShockwaves.splice(0, rwbShockwaves.length - 5);
        }
        for (let i = rwbParticles.length - 1; i >= 0; i--) {
            let p = rwbParticles[i];
            p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life--;
            if (p.life <= 0) rwbParticles.splice(i, 1);
        }
        for (let i = rwbSpeedLines.length - 1; i >= 0; i--) {
            let s = rwbSpeedLines[i];
            s.x += s.vx; s.y += s.vy; s.life--;
            if (s.life <= 0) rwbSpeedLines.splice(i, 1);
        }
        for (let i = rwbHakiLightnings.length - 1; i >= 0; i--) {
            let h = rwbHakiLightnings[i];
            h.life--;
            if (h.life <= 0) rwbHakiLightnings.splice(i, 1);
        }
        for (let i = rwbFloatingTexts.length - 1; i >= 0; i--) {
            let t = rwbFloatingTexts[i];
            t.life--; t.y += t.vy;
            if (t.life <= 0) rwbFloatingTexts.splice(i, 1);
        }
        if (rwbHakiAura > 0) rwbHakiAura--;
        if (rwbShake > 0.1) rwbShake *= 0.88;
        if (rwbScreenFlash > 0) rwbScreenFlash--;

        ctx.save();
        if (!isRWBMobileGraphics() && rwbShake > 0.5) ctx.translate((Math.random() - 0.5) * rwbShake, (Math.random() - 0.5) * rwbShake);

        drawIslandBackground();

        if (!isRWBMobileGraphics() && rwbHakiAura > 0) { ctx.save(); ctx.globalAlpha = rwbHakiAura / 100; ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, 400, 500); ctx.restore(); }
        if (!isRWBMobileGraphics() && rwbScreenFlash > 0) { ctx.globalAlpha = rwbScreenFlash / 30; ctx.fillStyle = rwbScreenFlashColor; ctx.fillRect(0, 0, 400, 500); ctx.globalAlpha = 1; }

        ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 396, 496);

        for (let i = 0; i < rwbSpeedLines.length; i++) {
            let s = rwbSpeedLines[i];
            ctx.save(); ctx.globalAlpha = s.life / s.maxLife * 0.6;
            ctx.strokeStyle = s.color; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4); ctx.stroke();
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
            ctx.save(); ctx.globalAlpha = p * 0.95;
            ctx.strokeStyle = sw.color; ctx.lineWidth = sw.width * p;
            ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        for (let i = 0; i < rwbAttacks.length; i++) drawAttack(rwbAttacks[i]);

        // Видимое цунами активки Белоуса для отдельного canvas боя Роджера и Белоуса.
        // Раньше эффект рисовался только в renderArena() и здесь полностью пропадал.
        if (typeof _superState !== "undefined" && _superState.whitebeardSkillTsunamiActive) {
            var wbSkillWaveY = Number(_superState.whitebeardSkillTsunamiY);
            if (!isFinite(wbSkillWaveY)) wbSkillWaveY = 540;
            var wbSkillWaveNow = performance.now();
            var wbSkillWavePulse = 0.82 + Math.sin(wbSkillWaveNow / 90) * 0.18;
            var wbSkillWaveStep = reduceBossEffects ? 12 : 8;
            function wbSkillWaveLine(wx, offset) {
                return wbSkillWaveY + Math.sin(wx / 28 + wbSkillWaveNow / 110) * 18 +
                    Math.sin(wx / 11 + wbSkillWaveNow / 70) * 5 + (offset || 0);
            }
            ctx.save();
            ctx.globalCompositeOperation = "lighter";

            // Полупрозрачная водяная масса, чтобы волна читалась и без свечения на телефоне.
            ctx.beginPath();
            ctx.moveTo(-40, wbSkillWaveY);
            for (var wbwx = -40; wbwx <= 440; wbwx += wbSkillWaveStep) {
                ctx.lineTo(wbwx, wbSkillWaveLine(wbwx, 0));
            }
            ctx.lineTo(440, wbSkillWaveY + 58);
            ctx.lineTo(-40, wbSkillWaveY + 58);
            ctx.closePath();
            ctx.fillStyle = "rgba(80,220,255,0.32)";
            ctx.fill();

            ctx.strokeStyle = "rgba(0,220,255," + wbSkillWavePulse + ")";
            ctx.lineWidth = reduceBossEffects ? 12 : 18;
            ctx.shadowColor = "#00ccff";
            ctx.shadowBlur = reduceBossEffects ? 0 : 18;
            ctx.beginPath();
            for (var wbwx2 = -40; wbwx2 <= 440; wbwx2 += wbSkillWaveStep) {
                if (wbwx2 === -40) ctx.moveTo(wbwx2, wbSkillWaveLine(wbwx2, 0));
                else ctx.lineTo(wbwx2, wbSkillWaveLine(wbwx2, 0));
            }
            ctx.stroke();

            ctx.shadowBlur = reduceBossEffects ? 0 : 8;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = reduceBossEffects ? 3 : 5;
            ctx.beginPath();
            for (var wbwx3 = -40; wbwx3 <= 440; wbwx3 += wbSkillWaveStep) {
                if (wbwx3 === -40) ctx.moveTo(wbwx3, wbSkillWaveLine(wbwx3, -3));
                else ctx.lineTo(wbwx3, wbSkillWaveLine(wbwx3, -3));
            }
            ctx.stroke();

            if (!reduceBossEffects) {
                for (var wbFoam = 0; wbFoam < 16; wbFoam++) {
                    var wbFoamX = (wbFoam * 31 + wbSkillWaveNow * 0.12) % 440 - 20;
                    var wbFoamY = wbSkillWaveLine(wbFoamX, -8 - Math.sin(wbFoam * 1.7 + wbSkillWaveNow / 120) * 5);
                    ctx.globalAlpha = 0.65 + Math.sin(wbSkillWaveNow / 80 + wbFoam) * 0.25;
                    ctx.fillStyle = "#ffffff";
                    ctx.beginPath();
                    ctx.arc(wbFoamX, wbFoamY, 2 + (wbFoam % 3), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        for (let i = 0; i < rwbPlayerBullets.length; i++) {
            let b = rwbPlayerBullets[i];
            if (!isRWBMobileGraphics() && typeof window.drawEquipmentProjectile === 'function' && window.drawEquipmentProjectile(ctx, b)) continue;
            ctx.save();
            if (isRWBMobileGraphics()) {
                ctx.fillStyle = b.color || "#ffffff";
                ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(2, b.size * 0.85), 0, Math.PI * 2); ctx.fill();
            } else {
                let grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 1.5);
                grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.5, b.color); grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }

        if (rwbState === "fight1" || rwbState === "fight2") drawRWBPlayer();
        if (rwbOden && rwbOden.available !== false &&
            (rwbState === "fight1" || rwbState === "fight2" || rwbState === "transition")) {
            drawRWBOdenSupport();
        }

        for (let i = 0; i < rwbParticles.length; i++) {
            let p = rwbParticles[i];
            ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (let i = 0; i < rwbHakiLightnings.length; i++) {
            let h = rwbHakiLightnings[i];
            let alpha = h.life / h.maxLife;
            ctx.save(); ctx.globalAlpha = alpha;
            ctx.strokeStyle = h.outerColor; ctx.lineWidth = h.width + 1.5;
            ctx.beginPath(); ctx.moveTo(h.x1, h.y1);
            for (let p = 0; p < h.points.length; p++) ctx.lineTo(h.points[p].x, h.points[p].y);
            ctx.lineTo(h.x2, h.y2); ctx.stroke();
            ctx.strokeStyle = h.innerColor; ctx.lineWidth = h.width; ctx.stroke();
            ctx.restore();
        }

        for (let i = 0; i < rwbFloatingTexts.length; i++) {
            let t = rwbFloatingTexts[i];
            ctx.save(); ctx.globalAlpha = Math.min(1, t.life / 30);
            ctx.font = "bold " + (t.size || 16) + "px Impact, Arial Black, sans-serif";
            ctx.textAlign = "center"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 3;
            ctx.strokeText(t.text, t.x, t.y); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

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

        if (rwbState === "intro") {
            ctx.save(); ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(0, 0, 400, 500);
            ctx.font = "bold 24px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
            ctx.fillText("ЛЕГЕНДЫ ПРОБУДИЛИСЬ", 200, 220);
            ctx.font = "bold 15px monospace"; ctx.fillStyle = "#ff8800";
            ctx.fillText("🔥 РОДЖЕР vs ❄️ БЕЛОУС", 200, 260);
            ctx.font = "12px monospace"; ctx.fillStyle = "#dddddd";
            ctx.fillText("🔵 Синяя атака — авто-прицел", 200, 310);
            ctx.fillText("🟡 Жёлтая бьёт боссов", 200, 330);
            ctx.fillStyle = "#ffff00"; ctx.fillText("⚡ СУПЕР кнопка внизу", 200, 355);
            ctx.restore();
        } else if (rwbState === "transition") {
            ctx.save(); ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(0, 0, 400, 500);
            ctx.font = "bold 28px monospace"; ctx.textAlign = "center";
            if (rwbActiveBoss && rwbActiveBoss.id === "roger") {
                ctx.fillStyle = "#ff8800"; ctx.fillText("РОДЖЕР: СУПЕР!", 200, 230);
                ctx.font = "14px monospace"; ctx.fillStyle = "#ffdd00";
                ctx.fillText("Рассечение • Крест • Пламя • Комбо", 200, 270);
                ctx.fillText("+ Тройное • Смерч", 200, 290);
            } else {
                ctx.fillStyle = "#ffffff"; ctx.fillText("БЕЛОУС: СУПЕР!", 200, 230);
                ctx.font = "14px monospace"; ctx.fillStyle = "#ffdd00";
                ctx.fillText("Землетрясение • Гура-Гура • Кулак", 200, 270);
                ctx.fillText("Навала • Цунами • 🌀 Воронка", 200, 290);
            }
            ctx.font = "13px monospace"; ctx.fillStyle = "#ff4444";
            ctx.fillText("⚠️ HP: " + (rwbActiveBoss && rwbActiveBoss.id === "roger" ? RWB_SUPER_ROGER_HP : RWB_SUPER_WB_HP), 200, 320);
            ctx.font = "15px monospace"; ctx.fillStyle = "#ffd700";
            ctx.fillText("ФИНАЛЬНЫЙ РАУНД!", 200, 355);
            ctx.font = "12px monospace"; ctx.fillStyle = "#ff8888";
            ctx.fillText("⚠️ Близко = СЛЕШ!", 200, 385);
            ctx.restore();
        } else if (rwbState === "victory") {
            ctx.save(); ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(0, 0, 400, 500);
            ctx.font = "bold 32px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd700";
            ctx.fillText("ПОБЕДА!", 200, 250); ctx.restore();
        } else if (rwbState === "defeat") {
            ctx.save(); ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(0, 0, 400, 500);
            ctx.font = "bold 32px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ff0000";
            ctx.fillText("ПОРАЖЕНИЕ", 200, 250); ctx.restore();
        }

        if (wbVortexActive) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.30)";
            ctx.fillRect(0, 0, 400, 500);
            let boss = rwbActiveBoss || whitebeard;
            if (boss) {
                // Воронка заранее рисуется в отдельный canvas. В бою остаётся один drawImage,
                // вместо восьми дуг с дорогим размытием теней каждый кадр.
                const vortexNow = performance.now();
                const pulse = 1 + Math.sin(vortexNow / 100) * 0.08;
                if (!wbVortexSprite) {
                    try {
                        const sprite = document.createElement("canvas");
                        sprite.width = sprite.height = 240;
                        const vortexCtx = sprite.getContext("2d");
                        if (vortexCtx) {
                            for (let rr = 28; rr <= 105; rr += 22) {
                                const start = rr * 0.01;
                                const end = Math.PI * 1.5;
                                vortexCtx.strokeStyle = "#000000"; vortexCtx.lineWidth = 10;
                                vortexCtx.beginPath(); vortexCtx.arc(120, 120, rr, start, end); vortexCtx.stroke();
                                vortexCtx.strokeStyle = "#ffffff"; vortexCtx.lineWidth = 5;
                                vortexCtx.beginPath(); vortexCtx.arc(120, 120, rr, start, end); vortexCtx.stroke();
                            }
                            wbVortexSprite = sprite;
                        }
                    } catch (e) {}
                }
                if (wbVortexSprite) {
                    ctx.save();
                    ctx.translate(boss.x, boss.y);
                    ctx.rotate(vortexNow / 350);
                    ctx.scale(pulse, pulse);
                    ctx.drawImage(wbVortexSprite, -120, -120);
                    ctx.restore();
                } else {
                    // Лёгкий запасной вариант, если canvas-текстуру создать не удалось.
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 4;
                    for (let rr = 35; rr <= 95; rr += 30) {
                        ctx.beginPath();
                        ctx.arc(boss.x, boss.y, rr * pulse, vortexNow / 350 + rr * 0.01, vortexNow / 350 + Math.PI * 1.5);
                        ctx.stroke();
                    }
                }
                ctx.fillStyle = "#ffffff"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 4; ctx.strokeText("🌀 ВОРОНКА", boss.x, boss.y - 48);
                ctx.fillText("🌀 ВОРОНКА", boss.x, boss.y - 48);
            }
            ctx.font = "bold 16px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 4; ctx.strokeText("НАЖМИ 7 ТОЧЕК!", 200, 42);
            ctx.fillText("НАЖМИ 7 ТОЧЕК!", 200, 42);
            ctx.font = "bold 13px monospace"; ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 4; ctx.strokeText("Осталось: " + Math.ceil(wbVortexTimerLeft / 60) + "с", 200, 62);
            ctx.fillText("Осталось: " + Math.ceil(wbVortexTimerLeft / 60) + "с", 200, 62);
            for (let i = 0; i < wbVortexPoints.length; i++) {
                let p = wbVortexPoints[i], active = i === wbVortexNextPoint;
                if (p.hit) continue;
                ctx.save();
                ctx.globalAlpha = active ? 1 : 0.55;
                // Без размытой тени на каждом маркере: контраст сохраняет чёрная обводка.
                ctx.fillStyle = "#ffffff";
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 5; ctx.stroke();
                ctx.fillStyle = "#f4f4f4";
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.62, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 3; ctx.stroke();
                ctx.fillStyle = "#000000"; ctx.font = "bold 15px monospace"; ctx.textAlign = "center";
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeText(String(i + 1), p.x, p.y + 5);
                ctx.fillText(String(i + 1), p.x, p.y + 5);
                ctx.restore();
            }
            ctx.restore();
        }

        if (rwbDialogActive) drawRWBDialogOverlay();

        if (typeof renderSuperVisuals === 'function') {
            try {
                if (!isRWBMobileGraphics()) {
                    renderSuperVisuals();
                } else {
                    // Сохраняем сам визуал ДИО и его стенд, отключая тяжёлые VFX-слои суперспособностей.
                    var mobileSuperCtx = typeof window.getBossContext === "function" ? window.getBossContext() : null;
                    if (mobileSuperCtx && mobileSuperCtx.type !== "arena" &&
                        typeof window.dioRenderPlayerAndStand === "function") {
                        window.dioRenderPlayerAndStand(mobileSuperCtx);
                    }
                }
            } catch(e) { console.error("[ROGER-WB] renderSuperVisuals error:", e); }
        }

        // После попадания фруктового удара экран остаётся пересвеченным 3 секунды,
        // но игрок не ослеплён полностью: слабые полосы дают эффект искажения.
        if (!isRWBMobileGraphics() && wbFruitFlashTimer > 0) {
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255," + wbFruitFlashPower + ")";
            ctx.fillRect(0, 0, 400, 500);
            ctx.globalAlpha = 0.2;
            for (let band = 0; band < 8; band++) {
                let yy = (band * 67 + Math.floor(performance.now() / 17) % 67) % 500;
                ctx.fillStyle = band % 2 ? "#c8f4ff" : "#ffffff";
                ctx.fillRect((band % 3) * 7, yy, 400 - (band % 3) * 14, 3 + (band % 2) * 2);
            }
            ctx.restore();
        }

        if (isModerActive()) {
            ctx.save(); ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
            ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 8;
            ctx.globalAlpha = 0.85; ctx.fillText("👑 МОДЕР", 8, 495); ctx.restore();
        }
        if (typeof window.drawJoystick === 'function') { try { window.drawJoystick(); } catch(e) {} }
        ctx.restore();
        rwbAnimFrame = requestAnimationFrame(rwbRenderLoop);
    }

    function drawRWBDialogOverlay() {
        if (!ctx) return;
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)"; ctx.fillRect(0, 0, 400, 500);

        if (rwbDialogType === "roger") {
            drawRogerPortrait(200, 130, 1.2);
            var line = RWB_ROGER_DIALOG[rwbDialogStage];
            if (line) {
                ctx.font = "bold 16px Nunito, sans-serif"; ctx.textAlign = "center";
                ctx.fillStyle = "#ff8800"; ctx.shadowColor = "#ff8800"; ctx.shadowBlur = 15;
                ctx.fillText(line.speaker, 200, 230);
                ctx.shadowBlur = 0; ctx.fillStyle = "#ffffff";
                ctx.font = "italic bold 14px Nunito, sans-serif";
                var lines = wrapText(line.text, 340, ctx);
                for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], 200, 265 + i * 24);
            }
            if (Math.floor(performance.now() / 500) % 2 === 0) {
                ctx.font = "12px monospace"; ctx.fillStyle = "#aaaaaa";
                ctx.fillText(">> Кликните для продолжения <<", 200, 470);
            }
        } else if (rwbDialogType === "whitebeard") {
            drawWhitebeardPortrait(200, 130, 1.15);
            if (rwbDialogQueue.length > 0) {
                var line2 = rwbDialogQueue[0];
                ctx.font = "bold 15px Nunito, sans-serif"; ctx.textAlign = "center";
                ctx.fillStyle = line2.speaker.indexOf("БЕЛОУС") !== -1 ? "#88ddff" : "#ffd700";
                ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
                ctx.fillText(line2.speaker, 200, 235);
                ctx.shadowBlur = 0; ctx.fillStyle = "#ffffff";
                ctx.font = "bold 13px Nunito, sans-serif";
                var lines2 = wrapText(line2.text, 340, ctx);
                for (var i = 0; i < lines2.length; i++) ctx.fillText(lines2[i], 200, 265 + i * 22);
                if (Math.floor(performance.now() / 500) % 2 === 0) {
                    ctx.font = "12px monospace"; ctx.fillStyle = "#aaaaaa";
                    ctx.fillText(">> Кликните для продолжения <<", 200, 470);
                }
            } else if (rwbWBPhase === "choice") {
                ctx.font = "bold 15px Nunito, sans-serif"; ctx.textAlign = "center";
                ctx.fillStyle = "#88ddff"; ctx.shadowColor = "#88ddff"; ctx.shadowBlur = 12;
                ctx.fillText("ЧТО ОТВЕТИШЬ?", 200, 225); ctx.shadowBlur = 0;
                var btnW = 360, btnX = 20, startY = 245, btnH = 55, gap = 10;
                for (var i = 0; i < 3; i++) {
                    var by = startY + i * (btnH + gap);
                    var disabled = rwbWhitebeardDisabled[i];
                    if (disabled) { ctx.fillStyle = "rgba(30, 30, 30, 0.6)"; ctx.strokeStyle = "#444444"; }
                    else { ctx.fillStyle = "rgba(40, 60, 90, 0.95)"; ctx.strokeStyle = "#88ddff"; }
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(btnX, by, btnW, btnH, 12); else ctx.rect(btnX, by, btnW, btnH);
                    ctx.fill(); ctx.stroke();
                    ctx.font = "bold 12px Nunito, sans-serif"; ctx.textAlign = "left";
                    ctx.fillStyle = disabled ? "#666666" : "#ffffff";
                    var choiceLines = wrapText(RWB_WB_CHOICES[i].text, btnW - 30, ctx);
                    for (var li = 0; li < Math.min(choiceLines.length, 2); li++) ctx.fillText(choiceLines[li], btnX + 15, by + 24 + li * 16);
                    if (disabled) { ctx.font = "bold 10px monospace"; ctx.fillStyle = "#555555"; ctx.textAlign = "right"; ctx.fillText("✕", btnX + btnW - 12, by + btnH - 10); }
                }
            }
        } else if (rwbDialogType === "oden_offer") {
            ctx.save();
            ctx.translate(200, 118);
            ctx.shadowColor = "#ffd94e"; ctx.shadowBlur = 20;
            ctx.fillStyle = "#ffd94e"; ctx.strokeStyle = "#fff1a8"; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 34);
            ctx.bezierCurveTo(-42, 5, -39, -22, -18, -25);
            ctx.bezierCurveTo(-7, -27, 0, -17, 0, -10);
            ctx.bezierCurveTo(0, -17, 7, -27, 18, -25);
            ctx.bezierCurveTo(39, -22, 42, 5, 0, 34);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0; ctx.lineCap = "round"; ctx.lineWidth = 4;
            ctx.strokeStyle = "#54218e";
            ctx.beginPath();
            ctx.moveTo(-18, -17); ctx.bezierCurveTo(-55, -20, -43, 27, -12, 15);
            ctx.moveTo(17, 7); ctx.bezierCurveTo(51, 29, 50, -28, 15, -18);
            ctx.stroke();
            ctx.strokeStyle = "#c98cff"; ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(-18, -17); ctx.bezierCurveTo(-55, -20, -43, 27, -12, 15);
            ctx.moveTo(17, 7); ctx.bezierCurveTo(51, 29, 50, -28, 15, -18);
            ctx.stroke();
            ctx.restore();

            ctx.font = "bold 18px Nunito, sans-serif"; ctx.textAlign = "center";
            ctx.fillStyle = "#ffd94e"; ctx.shadowColor = "#ffd94e"; ctx.shadowBlur = 12;
            ctx.fillText("ОДЭН", 200, 190);
            ctx.shadowBlur = 0; ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px Nunito, sans-serif";
            var odenOfferLines = wrapText("Эй, твой путь ещё не окончен. В следующий раз позволь мне сражаться рядом с тобой — я прикрою тебе спину. Что скажешь?", 348, ctx);
            for (var odenLine = 0; odenLine < odenOfferLines.length; odenLine++) {
                ctx.fillText(odenOfferLines[odenLine], 200, 220 + odenLine * 22);
            }
            var offerButtons = [
                { y: 320, text: "ДА — ПОМОГИ МНЕ В СЛЕДУЮЩЕМ БОЮ", fill: "rgba(62, 101, 64, .96)", stroke: "#8dffc6" },
                { y: 390, text: "НЕТ — Я СПРАВЛЮСЬ САМ", fill: "rgba(56, 42, 79, .96)", stroke: "#c79cff" }
            ];
            for (var ob = 0; ob < offerButtons.length; ob++) {
                var opt = offerButtons[ob];
                ctx.fillStyle = opt.fill; ctx.strokeStyle = opt.stroke; ctx.lineWidth = 2;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(20, opt.y, 360, 54, 12);
                else ctx.rect(20, opt.y, 360, 54);
                ctx.fill(); ctx.stroke();
                ctx.font = "bold 13px Nunito, sans-serif"; ctx.textAlign = "center";
                ctx.fillStyle = "#ffffff"; ctx.shadowColor = opt.stroke; ctx.shadowBlur = 7;
                ctx.fillText(opt.text, 200, opt.y + 32); ctx.shadowBlur = 0;
            }
            ctx.font = "11px monospace"; ctx.fillStyle = "#aaaaaa"; ctx.textAlign = "center";
            ctx.fillText("ENTER / Y — ДА     ESC / N — НЕТ", 200, 472);
        } else if (rwbDialogType === "oden_death") {
            ctx.save();
            ctx.translate(200, 117);
            ctx.shadowColor = "#ff122b"; ctx.shadowBlur = 22;
            ctx.strokeStyle = "#070307"; ctx.lineWidth = 7; ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(-45, -30); ctx.lineTo(45, 30);
            ctx.moveTo(45, -30); ctx.lineTo(-45, 30);
            ctx.stroke();
            ctx.strokeStyle = "#ff253b"; ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-45, -30); ctx.lineTo(45, 30);
            ctx.moveTo(45, -30); ctx.lineTo(-45, 30);
            ctx.stroke();
            ctx.restore();

            var deathLine = RWB_ODEN_DEATH_DIALOG[rwbDialogStage];
            if (deathLine) {
                ctx.font = "bold 17px Nunito, sans-serif"; ctx.textAlign = "center";
                ctx.fillStyle = "#ff3448"; ctx.shadowColor = "#ff1028"; ctx.shadowBlur = 13;
                ctx.fillText(deathLine.speaker, 200, 215);
                ctx.shadowBlur = 0; ctx.fillStyle = "#ffffff";
                ctx.font = "bold 14px Nunito, sans-serif";
                var deathLines = wrapText(deathLine.text, 340, ctx);
                for (var deathLineIndex = 0; deathLineIndex < deathLines.length; deathLineIndex++) {
                    ctx.fillText(deathLines[deathLineIndex], 200, 258 + deathLineIndex * 25);
                }
            }
            if (Math.floor(performance.now() / 500) % 2 === 0) {
                ctx.font = "12px monospace"; ctx.fillStyle = "#aaaaaa"; ctx.textAlign = "center";
                ctx.fillText(">> Кликните или нажмите ENTER, чтобы продолжить <<", 200, 470);
            }
        }
        ctx.restore();
    }

    function clampWhitebeard(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function moveWhitebeardSmoothly(active) {
        if (!active || !rwbPlayer) return;
        // Pick a flank/approach point occasionally; the model always moves toward it,
        // never jumps to a new sin()-computed coordinate.
        if (!Number.isFinite(active.moveTargetX) || rwbTimer >= (active.moveTargetAt || 0)) {
            let leadX = clampWhitebeard(rwbPlayer.x + wbBrain.playerVX * 14, 35, 365);
            let side = leadX < active.x ? 1 : -1;
            if (Math.abs(leadX - active.x) < 85) side = Math.random() < 0.5 ? -1 : 1;
            active.moveTargetX = clampWhitebeard(leadX + side * (85 + Math.random() * 45), 65, 335);
            // Keep him in the upper arena: he can flank the player, not teleport to them.
            active.moveTargetY = clampWhitebeard(115 + (rwbPlayer.y < 210 ? -12 : 22) + (Math.random() - 0.5) * 54, 78, 218);
            active.moveTargetAt = rwbTimer + 72 + Math.floor(Math.random() * 42);
        }
        let dx = active.moveTargetX - active.x;
        let dy = active.moveTargetY - active.y;
        let dist = Math.hypot(dx, dy);
        let maxSpeed = active.superForm ? 1.45 : 1.12;
        let desiredVx = dist > 3 ? dx / dist * Math.min(maxSpeed, dist * 0.035) : 0;
        let desiredVy = dist > 3 ? dy / dist * Math.min(maxSpeed * 0.72, dist * 0.025) : 0;
        active.vx = (Number(active.vx) || 0) * 0.78 + desiredVx * 0.22;
        active.vy = (Number(active.vy) || 0) * 0.78 + desiredVy * 0.22;
        let speed = Math.hypot(active.vx, active.vy);
        if (speed > maxSpeed) { active.vx = active.vx / speed * maxSpeed; active.vy = active.vy / speed * maxSpeed; }
        active.x = clampWhitebeard(active.x + active.vx, 48, 352);
        active.y = clampWhitebeard(active.y + active.vy, 72, 225);
        if ((active.x <= 48 && active.vx < 0) || (active.x >= 352 && active.vx > 0)) active.vx *= -0.35;
        if ((active.y <= 72 && active.vy < 0) || (active.y >= 225 && active.vy > 0)) active.vy *= -0.35;
    }

    function spawnWhitebeardTrapCombo() {
        if (!rwbPlayer || rwbTsunamiActive || wbVortexActive) return false;
        wbTrapCombo.stage = "active";
        wbTrapCombo.timer = 0;
        wbTrapCombo.startedAt = rwbTimer;
        wbTrapCombo.targetX = clampWhitebeard(rwbPlayer.x + (wbBrain.playerVX || 0) * 12, 58, 342);
        wbTrapCombo.targetY = clampWhitebeard(rwbPlayer.y + (wbBrain.playerVY || 0) * 8, 95, 440);
        // Pull toward a point between the player and Whitebeard, slightly behind the player.
        // Rock lanes still target the player's predicted landing zone.
        const pullSource = getWhitebeardEntity();
        const pullSourceX = pullSource ? Number(pullSource.x) || 200 : 200;
        wbTrapCombo.pullTargetX = clampWhitebeard(rwbPlayer.x + (pullSourceX - rwbPlayer.x) * 0.55, 58, 342);
        wbTrapCombo.pullTargetY = clampWhitebeard(rwbPlayer.y - 105, 95, 420);
        // Three landing lanes form a crossfire instead of a single blind rock.
        wbBrain.plannedTargetX = wbTrapCombo.targetX;
        wbBrain.plannedTargetY = wbTrapCombo.targetY;
        wbBrain.plannedRockXs = [
            clampWhitebeard(wbTrapCombo.targetX - 65, 35, 365),
            clampWhitebeard(wbTrapCombo.targetX, 35, 365),
            clampWhitebeard(wbTrapCombo.targetX + 65, 35, 365)
        ];
        spawnTsunamiAttack(true, {
            comboPull: true,
            pullTargetX: wbTrapCombo.pullTargetX,
            pullTargetY: wbTrapCombo.pullTargetY
        });
        rwbFloatingTexts.push({ x: 200, y: 80, text: "🌊 ЦУНАМИ-КОМБО: НЕ ДАЙ СЕБЕ ЗАГНАТЬСЯ!", color: "#6feaff", life: 95, maxLife: 95, vy: -0.2, vx: 0, size: 13 });
        playBossRoarSound(0.5);
        wbTrapCombo.cooldown = 440 + Math.floor(Math.random() * 120);
        return true;
    }

    function updateWhitebeardTrapCombo(active) {
        if (!active || active.id !== "whitebeard") return false;
        if (wbTrapCombo.stage === "idle") {
            if (wbTrapCombo.cooldown > 0) { wbTrapCombo.cooldown--; return false; }
            if (wbVortexActive || rwbTsunamiActive || wbBrain.phase !== "idle" || isWhitebeardSpecialWindupActive()) return false;
            // The AI punishes camping, predictable movement and excessive distance.
            let playerMadeMistake = wbBrain.stationaryFrames > 45 || wbBrain.bottomFrames > 70 || wbBrain.farFrames > 40;
            if (!playerMadeMistake && Math.random() > 0.007) return false;
            return spawnWhitebeardTrapCombo();
        }

        wbTrapCombo.timer++;
        let t = wbTrapCombo.timer;
        if (t === 42) {
            rwbAttacks.push({
                type: "wb_combo_gate_warning",
                targetY: wbTrapCombo.targetY,
                warningTimer: 30, life: 31, color: "#ffffff",
                title: "КУЛАКИ ПЕРЕКРЫВАЮТ ВЫХОД"
            });
            rwbFloatingTexts.push({ x: 200, y: 112, text: "👊 КУЛАКИ ПЕРЕКРЫВАЮТ ВЫХОД!", color: "#ffffff", life: 68, maxLife: 68, vy: -0.2, vx: 0, size: 14 });
            playHakiChargeSound(0.35);
            spawnHakiLightning(active.x, active.y, 4, true);
        }
        if (t === 68) {
            for (let lane = 0; lane < wbBrain.plannedRockXs.length; lane++) {
                let rx = wbBrain.plannedRockXs[lane];
                rwbAttacks.push({
                    type: "wb_giant_rock_warning", x: rx, targetX: rx, y: 470,
                    warningTimer: 38 + lane * 5, life: 44 + lane * 5,
                    color: "#b99a72", combo: true
                });
            }
            rwbFloatingTexts.push({ x: 200, y: 95, text: "🪨 КАМНЕПАД! ВЫРЫВАЙСЯ ИЗ ТЕЧЕНИЯ!", color: "#ffe1a6", life: 82, maxLife: 82, vy: -0.2, vx: 0, size: 14 });
            playWhooshSound(0.35);
        }

        // The after-current remains active through invulnerability and visibly pulls
        // the player behind the advancing tsunami, without disabling their controls.
        if (t >= 35 && t <= 222 && rwbPlayer) {
            let pullX = wbTrapCombo.pullTargetX - rwbPlayer.x;
            let pullY = wbTrapCombo.pullTargetY - rwbPlayer.y;
            let pullXStep = clampWhitebeard(pullX * 0.030, -2.2, 2.2);
            let pullYStep = clampWhitebeard(pullY * 0.020, -1.2, 1.2);
            rwbPlayer.x = clampWhitebeard(rwbPlayer.x + pullXStep, 16, 384);
            rwbPlayer.y = clampWhitebeard(rwbPlayer.y + pullYStep, 0, 484);
            if (t % 4 === 0) {
                rwbParticles.push({
                    x: rwbPlayer.x + (Math.random() - 0.5) * 34,
                    y: rwbPlayer.y + (Math.random() - 0.5) * 18,
                    vx: (wbTrapCombo.targetX - rwbPlayer.x) * 0.04,
                    vy: -0.5 - Math.random() * 1.5,
                    life: 18, maxLife: 18,
                    color: Math.random() < 0.5 ? "#00ccff" : "#ffffff", size: 2 + Math.random() * 2
                });
            }
        }
        if (t > 246) {
            wbTrapCombo.stage = "idle";
            wbTrapCombo.timer = 0;
            wbBrain.phase = "idle";
            wbBrain.phaseTimer = 0;
            wbBrain.recoveryTimer = 0;
        }
        return true;
    }

    function updateSuperBoss() {
        let active = rwbActiveBoss;
        if (!active) return;
        if (wbVortexActive) { updateWhitebeardVortex(); return; }

        // Все эффекты контроля из общей системы SUPER должны работать
        // и на финального босса 1000-й волны.
        if (typeof _superState !== 'undefined' &&
            (_superState.garouTimeStop || _superState.dioTimeStop > 0 || _superState.dioTeleportStop > 0 || _superState.takabaTimeStop ||
             _superState.antispiralFrozen || _superState.usoppStunTimer > 0)) {
            return;
        }

        active.pulse += 0.12; active.rotation += 0.03;
        let wbWindup = active.id === "whitebeard" ? getWhitebeardWindupAttack() : null;
        if (wbWindup) {
            // Hold exactly where the readable telegraph began; no snap back to a stale origin.
            active.vx = (Number(active.vx) || 0) * 0.6;
            active.vy = (Number(active.vy) || 0) * 0.6;
            active.moveTargetAt = Math.max(active.moveTargetAt || 0, rwbTimer + 8);
        } else if (active.id === "whitebeard") {
            moveWhitebeardSmoothly(active);
        } else {
            active.x = 200 + Math.sin(rwbTimer / 110) * 22;
            active.y = 100 + Math.sin(rwbTimer / 80) * 8;
        }
        if (active.hitFlash > 0) active.hitFlash--;
        if (Math.random() < (active.id === "whitebeard" ? 0.27 : 0.15)) {
            spawnHakiLightning(active.x + (Math.random() - 0.5) * 50, active.y + (Math.random() - 0.5) * 50, active.id === "whitebeard" ? 2 : 1, active.id === "whitebeard");
        }
        let comboBusy = active.id === "whitebeard" && updateWhitebeardTrapCombo(active);
        if (comboBusy) {
            active.attackTimer = Math.max(active.attackTimer || 0, 12);
            return;
        }
        active.attackTimer--;
        if (active.attackTimer <= 0) {
            let interval = (active.id === "roger") ? RWB_ATTACK_SPEED_SUPER_ROGER : BALANCE.superAttackRate;
            active.attackTimer = (interval + Math.random() * 20) * (active.id === "whitebeard" && isWBReflectVortexActive() ? 1.43 : 1);
            if (active.id === "roger") spawnRogerSuperAttack();
            else spawnWhitebeardSuperAttack();
        }
    }

    function drawHpBar(x, y, w, h, current, max, color, label, alignRight) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = "#222"; ctx.fillRect(x, y, w, h);
        let ratio = Math.max(0, Math.min(1, current / max));
        let barW = w * ratio; ctx.fillStyle = color;
        if (alignRight) ctx.fillRect(x + w - barW, y, barW, h);
        else ctx.fillRect(x, y, barW, h);
        ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
        ctx.font = "bold 9px monospace"; ctx.textAlign = alignRight ? "right" : "left";
        ctx.fillStyle = "#ffffff";
        let labelText = label + " " + Math.ceil(current) + "/" + max;
        if (alignRight) ctx.fillText(labelText, x + w - 4, y + h - 3);
        else ctx.fillText(labelText, x + 4, y + h - 3);
        ctx.restore();
    }

    function drawHeartShape(cx, cy, size, color, glowColor) {
        ctx.save(); ctx.translate(cx, cy);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.7);
        ctx.bezierCurveTo(-size * 1.4, -size * 0.2, -size * 0.7, -size * 1.1, 0, -size * 0.4);
        ctx.bezierCurveTo(size * 0.7, -size * 1.1, size * 1.4, -size * 0.2, 0, size * 0.7);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath(); ctx.arc(-size * 0.3, -size * 0.4, size * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawRoger() {
        if (!roger) return;
        let pulse = 1 + Math.sin(roger.pulse) * 0.06;
        let size = roger.size * pulse;
        let flash = roger.hitFlash > 0;
        drawRogerModel(roger.x, roger.y, size, flash, Math.sin(roger.rotation) * 0.1);
    }

    function drawWhitebeardHakiAura(cx, cy, size) {
        var now = performance.now() / 1000;
        var pulse = 1 + Math.sin(now * 7) * 0.09;
        ctx.save();
        ctx.globalAlpha = 0.66;
        for (var ring = 0; ring < 2; ring++) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(now * (ring ? -0.75 : 0.55));
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 7; ctx.shadowColor = "#000000"; ctx.shadowBlur = 9;
            ctx.beginPath(); ctx.ellipse(0, 0, size * (1.75 + ring * 0.2) * pulse, size * (1.3 + ring * 0.16) * pulse, 0, Math.PI * 0.12, Math.PI * 1.22); ctx.stroke();
            ctx.strokeStyle = ring ? "#ffffff" : "#bfefff"; ctx.lineWidth = 2.2; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.ellipse(0, 0, size * (1.75 + ring * 0.2) * pulse, size * (1.3 + ring * 0.16) * pulse, 0, Math.PI * 0.12, Math.PI * 1.22); ctx.stroke();
            ctx.restore();
        }
        // Black-outlined white lightning arcs: visible armament/conqueror haki.
        for (var bolt = 0; bolt < 5; bolt++) {
            var ang = now * 1.7 + bolt * (Math.PI * 2 / 5);
            var r1 = size * 1.15, r2 = size * (1.55 + 0.12 * Math.sin(now * 11 + bolt));
            var x1 = cx + Math.cos(ang) * r1, y1 = cy + Math.sin(ang) * r1;
            var x2 = cx + Math.cos(ang + 0.18) * r2, y2 = cy + Math.sin(ang + 0.18) * r2;
            var xm = (x1 + x2) / 2 + Math.sin(now * 9 + bolt * 2) * size * 0.25;
            var ym = (y1 + y2) / 2 + Math.cos(now * 8 + bolt) * size * 0.25;
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 5; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xm, ym); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.7; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xm, ym); ctx.lineTo(x2, y2); ctx.stroke();
        }
        ctx.restore();
    }

    function drawWhitebeard() {
        if (!whitebeard) return;
        let pulse = 1 + Math.sin(whitebeard.pulse) * 0.06;
        let size = whitebeard.size * pulse;
        let flash = (Number(whitebeard.damageFlashTimer) || 0) > 0;
        drawWhitebeardHakiAura(whitebeard.x, whitebeard.y, size);
        drawWhitebeardModel(whitebeard.x, whitebeard.y, size, flash, Math.sin(whitebeard.rotation) * 0.1);
    }

    function getRWBOdenTargets() {
        if (rwbState === "fight1") {
            return [roger, whitebeard].filter(function(boss) {
                return !!boss && boss.hp > 0;
            });
        }
        if (rwbState === "fight2" && rwbActiveBoss && rwbActiveBoss.hp > 0) {
            return [rwbActiveBoss];
        }
        return [];
    }

    function getRWBOdenTargetById(id) {
        const targets = getRWBOdenTargets();
        for (let i = 0; i < targets.length; i++) {
            if (targets[i].id === id) return targets[i];
        }
        return null;
    }

    function getRWBOdenAttackTarget(targets) {
        if (!targets || !targets.length) return null;
        if (rwbState === "fight1") {
            const focused = targets.find(function(boss) {
                return boss && boss.hp > 0 && boss.id === rwbPlayerFocusTargetId;
            });
            if (focused) return focused;
            // Before the first confirmed player hit, favour the boss closest to the player's firing lane.
            return targets.slice().sort(function(a, b) {
                return Math.abs(a.x - rwbPlayer.x) - Math.abs(b.x - rwbPlayer.x);
            })[0] || targets[0];
        }
        // Phase two: Oden is free to roam; attack the currently active opponent.
        if (rwbState === "fight2" && rwbActiveBoss && rwbActiveBoss.hp > 0) return rwbActiveBoss;
        return targets[0];
    }

    function rwbOdenSegmentDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
        const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
        return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
    }

    // Returns a threat descriptor when an attack is close to Oden now or on its projected path.
    // "alert" adds a safety margin for dodging; actual damage uses the tighter collision bounds.
    function rwbOdenLaneRisk(axis, line, ox, oy, limit) {
        if (!Number.isFinite(line)) return null;
        if (axis === "vertical") {
            const distance = Math.abs(ox - line);
            if (distance >= limit) return null;
            const leftSafe = Math.max(18, line - limit - 24);
            const rightSafe = Math.min(382, line + limit + 24);
            const safeX = Math.abs(ox - leftSafe) <= Math.abs(ox - rightSafe) ? leftSafe : rightSafe;
            return { x: line, y: oy, axis: axis, distance: distance, safeX: safeX };
        }
        const distance = Math.abs(oy - line);
        if (distance >= limit) return null;
        const upperSafe = Math.max(10, line - limit - 24);
        const lowerSafe = Math.min(480, line + limit + 24);
        const safeY = Math.abs(oy - upperSafe) <= Math.abs(oy - lowerSafe) ? upperSafe : lowerSafe;
        return { x: ox, y: line, axis: axis, distance: distance, safeY: safeY };
    }

    function rwbOdenPointRisk(cx, cy, ox, oy, limit) {
        const dx = ox - cx, dy = oy - cy, distance = Math.hypot(dx, dy);
        if (distance >= limit) return null;
        const length = distance || 1;
        const ux = distance > 0 ? dx / length : 1;
        const uy = distance > 0 ? dy / length : 0;
        const safeDistance = limit + 24;
        return {
            x: cx, y: cy, axis: "point", distance: distance,
            safeX: Math.max(18, Math.min(382, cx + ux * safeDistance)),
            safeY: Math.max(10, Math.min(480, cy + uy * safeDistance))
        };
    }

    function rwbOdenAttackThreat(a, ox, oy, frames, alert) {
        const oden = rwbOden;
        if (!oden || !oden.alive || !a || a.odenHit || a.state === "done") return null;
        const pad = alert ? 38 : 0;
        const body = oden.size * 0.72;
        const fx = Number(ox), fy = Number(oy);
        const t = Math.max(0, Number(frames) || 0);
        const isTelegraph = a.state === "warning" || a.state === "windup" ||
            a.type === "wb_attack_telegraph" || a.type === "wb_giant_rock_warning" ||
            a.type === "wb_combo_gate_warning";

        // Warnings steer Oden away, but must never count as real hits.
        if (isTelegraph) {
            if (!alert) return null;
            const laneWidth = body + pad + 24;
            if (a.type === "roger_slash" && a.state === "warning") {
                return rwbOdenLaneRisk(a.direction === "horizontal" ? "horizontal" : "vertical",
                    a.direction === "horizontal" ? Number(a.y) : Number(a.x), fx, fy,
                    (Number(a.width) || 58) * 0.5 + body + pad + 18);
            }
            if (a.type === "roger_cross" && a.state === "warning") {
                return rwbOdenLaneRisk(a.dir === "vertical" ? "vertical" : "horizontal",
                    a.dir === "vertical" ? Number(a.x) : Number(a.y), fx, fy,
                    (Number(a.width) || 35) * 0.5 + body + pad + 18);
            }
            if (a.type === "wb_giant_rock_warning") {
                return rwbOdenLaneRisk("vertical", Number(a.targetX !== undefined ? a.targetX : a.x), fx, fy,
                    22 + body + pad);
            }
            if (a.type === "wb_combo_gate_warning") {
                for (const gateY of [Number(a.targetY) - 24, Number(a.targetY) + 24]) {
                    const risk = rwbOdenLaneRisk("horizontal", gateY, fx, fy, 15 + body + pad);
                    if (risk) return risk;
                }
                return null;
            }
            if (a.type === "wb_attack_telegraph") {
                const id = Number(a.attackId), kind = a.attackKind || "normal";
                const columns = Array.isArray(a.columns) ? a.columns : [];
                if ((kind === "normal" && (id === 0 || id === 5)) || (kind === "super" && id === 0)) {
                    let closest = null, nearest = Infinity;
                    for (const columnX of columns) {
                        const risk = rwbOdenLaneRisk("vertical", Number(columnX), fx, fy, 20 + body + pad);
                        if (risk && risk.distance < nearest) { closest = risk; nearest = risk.distance; }
                    }
                    return closest;
                }
                if (kind === "normal" && [2, 3, 7].includes(id)) {
                    return rwbOdenLaneRisk("horizontal", Number(a.targetY), fx, fy, 18 + body + pad);
                }
                if ((kind === "normal" && id === 4) || (kind === "super" && id === 4)) {
                    return rwbOdenLaneRisk("horizontal", 30, fx, fy, 30 + body + pad);
                }
                if (kind === "normal" && id === 1) {
                    return rwbOdenPointRisk(Number(a.originX) || a.x || 320, Number(a.originY) || a.y || 120, fx, fy, 76 + body + pad);
                }
                if (kind === "normal" && id === 6) {
                    return rwbOdenPointRisk(Number(a.targetX), Number(a.targetY), fx, fy, 26 + body + pad);
                }
                if (kind === "super" && (id === 1 || id === 3)) {
                    return rwbOdenPointRisk(Number(a.targetX), Number(a.targetY), fx, fy, (id === 1 ? 58 : 46) + body + pad);
                }
                if (kind === "super" && id === 2) {
                    const lineRisk = rwbOdenLaneRisk("vertical", Number(a.targetX), fx, fy, 30 + body + pad);
                    if (lineRisk) return lineRisk;
                    const groundRisk = rwbOdenLaneRisk("horizontal", 360, fx, fy, 18 + body + pad);
                    if (groundRisk && Math.abs(fx - Number(a.targetX)) < 62 + body + pad) return groundRisk;
                    return null;
                }
                return rwbOdenPointRisk(Number(a.targetX), Number(a.targetY), fx, fy, laneWidth + 18);
            }
            if (a.type === "wb_center_wave" && a.state === "warning") {
                const targetY = Number(a.targetY) || 250;
                const dangerTop = targetY - (Number(a.height) || 92) * 0.5 - body - pad;
                if (fy > dangerTop) {
                    return { x: 200, y: targetY, axis: "horizontal", distance: Math.abs(fy - targetY),
                        safeY: Math.max(10, dangerTop - 48) };
                }
                return null;
            }
            if (a.type === "wb_fruit_punch" && a.state === "warning") {
                const d = rwbOdenSegmentDistance(fx, fy, a.originX, a.originY, a.endX, a.endY);
                const limit = (Number(a.width) || 38) * 0.5 + body + pad + 16;
                if (d < limit) {
                    const cx = (a.originX + a.endX) * 0.5, cy = (a.originY + a.endY) * 0.5;
                    return rwbOdenPointRisk(cx, cy, fx, fy, limit + 10);
                }
                return null;
            }
            if (a.type === "wb_crescent_slash" && a.state === "windup") {
                const low = Math.min(Number(a.startY) || a.y, Number(a.targetY) || a.y);
                const high = Math.max(Number(a.startY) || a.y, Number(a.targetY) || a.y);
                const limit = (Number(a.width) || 92) * 0.5 + body + pad + 14;
                if (fy >= low - limit && fy <= high + limit) {
                    const upper = Math.max(10, low - limit - 24);
                    const lower = Math.min(480, high + limit + 24);
                    return { x: fx, y: Math.max(low, Math.min(high, fy)), axis: "horizontal",
                        distance: 0, safeY: Math.abs(fy - upper) <= Math.abs(fy - lower) ? upper : lower };
                }
                return null;
            }
            return null;
        }

        if (a.state === "warning" || a.state === "windup") return null;
        if (a.type === "roger_slash") {
            if (a.state !== "active") return null;
            const thick = (a.width || 80) * 0.35 + body + pad;
            if (a.direction === "horizontal" && Math.abs(fy - a.y) < thick) {
                return { x: fx, y: a.y, axis: "horizontal", distance: Math.abs(fy - a.y) };
            }
            if (a.direction !== "horizontal" && Math.abs(fx - a.x) < thick) {
                return { x: a.x, y: fy, axis: "vertical", distance: Math.abs(fx - a.x) };
            }
            return null;
        }
        if (a.type === "roger_cross") {
            if (a.state !== "active") return null;
            const thick = (a.width || 78) * 0.35 + body + pad;
            if (a.dir === "vertical" && Math.abs(fx - a.x) < thick) {
                return { x: a.x, y: fy, axis: "vertical", distance: Math.abs(fx - a.x) };
            }
            if (a.dir !== "vertical" && Math.abs(fy - a.y) < thick) {
                return { x: fx, y: a.y, axis: "horizontal", distance: Math.abs(fy - a.y) };
            }
            return null;
        }
        if (a.type === "wb_crescent_slash") {
            if (a.state !== "flying") return null;
            const travel = Math.min(1, ((a.travelElapsed || 0) + t) / (a.travelTime || 90));
            const laneY = a.startY + (a.targetY - a.startY) * travel;
            const thick = (a.width || 92) * 0.5 + body + pad;
            if (fx >= -10 && fx <= 410 && Math.abs(fy - laneY) < thick) {
                return { x: fx, y: laneY, axis: "horizontal", distance: Math.abs(fy - laneY) };
            }
            return null;
        }
        if (a.type === "wb_fruit_punch") {
            if (a.state !== "active") return null;
            const d = rwbOdenSegmentDistance(fx, fy, a.originX, a.originY, a.endX, a.endY);
            const limit = (a.width || 38) * 0.5 + body + pad;
            return d < limit ? { x: (a.originX + a.endX) * 0.5, y: (a.originY + a.endY) * 0.5, axis: "point", distance: d } : null;
        }
        if (a.type === "wb_center_wave") {
            if (a.state !== "active") return null;
            const waveY = a.y - (a.speed || 3.4) * t;
            const halfWidth = (a.width || 400) * 0.5 + body;
            const halfHeight = (a.height || 92) * 0.5 + body + pad;
            if (Math.abs(fx - 200) < halfWidth && Math.abs(fy - waveY) < halfHeight) {
                return { x: fx, y: waveY, axis: "horizontal", distance: Math.abs(fy - waveY) };
            }
            return null;
        }
        if (a.type === "tsunami") {
            const waveY = a.y + (a.vy || 0) * t;
            const halfHeight = ((a.currentHeight || a.height || 150) * 0.5) + body + pad;
            const inWave = a.fromRight ? (fx >= (a.x || 0) && fx <= 400) : (fx >= 0 && fx <= (a.width || 0));
            if (inWave && Math.abs(fy - waveY) < halfHeight) {
                return { x: fx, y: waveY, axis: "horizontal", distance: Math.abs(fy - waveY) };
            }
            return null;
        }
        if (a.type === "gura_crack") {
            if (a.state !== "active") return null;
            const progress = 1 - Math.max(0, (a.activeTimer || 0) - t) / Math.max(1, a.maxActive || 30);
            const radius = (a.maxRadius || a.radius || 35) * Math.max(0, Math.min(1, progress));
            const d = Math.hypot(fx - a.x, fy - a.y);
            const limit = radius * 0.85 + body + pad;
            return d < limit ? { x: a.x, y: a.y, axis: "point", distance: d } : null;
        }
        if (a.type === "hell_fire" && a.state === "exploding") {
            const d = Math.hypot(fx - a.x, fy - a.y);
            const limit = (a.explosionRadius || 48) + body + pad;
            return d < limit ? { x: a.x, y: a.y, axis: "point", distance: d } : null;
        }
        if (a.type === "wb_reflect_vortex" || a.type === "wb_reflected_bullet") {
            if (a.type === "wb_reflect_vortex") return null;
        }

        let vx = Number(a.vx) || 0, vy = Number(a.vy) || 0;
        if (a.type === "hell_fire" && a.state === "flying") {
            const dx = (a.targetX || a.x) - a.x, dy = (a.targetY || a.y) - a.y;
            const dist = Math.hypot(dx, dy) || 1;
            vx = dx / dist * (a.speed || 3.8);
            vy = dy / dist * (a.speed || 3.8);
        }
        const ax = a.x + vx * t, ay = a.y + vy * t;
        const d = Math.hypot(fx - ax, fy - ay);
        const limit = body + (a.size || a.radius || 12) * 0.68 + pad;
        return d < limit ? { x: ax, y: ay, axis: "point", distance: d } : null;
    }

    function rwbOdenShockwaveThreat(sw, ox, oy, frames, alert) {
        if (!sw || sw.odenHit || !(Number(sw.damage) > 0)) return null;
        const radius = (Number(sw.radius) || 0) + (Number(sw.speed) || 0) * Math.max(0, frames || 0);
        const d = Math.hypot(ox - sw.x, oy - sw.y);
        const limit = (Number(sw.width) || 5) * 0.7 + (rwbOden ? rwbOden.size : 12) * 0.72 + (alert ? 34 : 0);
        return Math.abs(d - radius) < limit ? { x: sw.x, y: sw.y, axis: "point", distance: Math.abs(d - radius) } : null;
    }

    function rwbOdenEnterLastBreath(oden) {
        if (!oden || !oden.alive || oden.lastBreath) return;
        oden.lastBreath = true;
        oden.hakiAwakened = true;
        oden.healState = "idle";
        oden.healTimer = 0;
        oden.healRemaining = 0;
        oden.healTotal = 0;
        oden.healCooldownUntil = Number.MAX_SAFE_INTEGER;
        oden.companionMode = "last_breath";
        oden.companionModeTimer = 999999;
        oden.windup = 1;
        oden.swingTimer = 2;
        oden.attackCooldown = 0;
        oden.dodgeCooldown = 0;
        oden.dodgePlanTimer = 0;
        oden.invulnTimer = Math.min(Number(oden.invulnTimer) || 0, 12);
        // Old normal slashes are cleared so every new non-blue slash shows the Haki awakening.
        rwbOdenSlashes = rwbOdenSlashes.filter(function(slash) { return slash && slash.isBlue; });
        rwbFloatingTexts.push({
            x: oden.x, y: oden.y - 36, text: "ПОСЛЕДНИЙ ВЗДОХ",
            color: "#ff1b2d", life: 120, maxLife: 120, vy: -0.65, vx: 0, size: 15
        });
        spawnHitParticles(oden.x, oden.y, "#f21d35", 22);
        spawnHakiLightning(oden.x, oden.y, 2, false);
        rwbScreenFlash = Math.max(rwbScreenFlash, 7);
        rwbScreenFlashColor = "#790014";
        rwbShake = Math.max(rwbShake, 8);
        playImpactSound(0.42, 0.72);
    }

    function rwbOdenDie(oden) {
        if (!oden || !oden.alive) return;
        oden.alive = false;
        oden.windup = 0;
        oden.swingTimer = 0;
        oden.healState = "idle";
        rwbOdenSlashes = [];
        rwbFloatingTexts.push({
            x: oden.x, y: oden.y - 36, text: "ОДЭН ПАЛ!",
            color: "#ff263b", life: 120, maxLife: 120, vy: -0.45, vx: 0, size: 17
        });
        spawnHitParticles(oden.x, oden.y, oden.lastBreath ? "#ff2038" : "#b77aff", 28);
        spawnHakiLightning(oden.x, oden.y, 2, false);
        rwbShake = Math.max(rwbShake, 8);
        if (oden.available && !rwbOdenDeathDialogShown &&
            (rwbState === "fight1" || rwbState === "fight2")) {
            rwbOdenDeathDialogShown = true;
            rwbDialogActive = true;
            rwbDialogType = "oden_death";
            rwbDialogStage = 0;
            rwbDialogTimer = 0;
        }
    }

    function rwbOdenApplyCurrentHits(oden) {
        if (!oden || !oden.alive) return;
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            const a = rwbAttacks[i];
            const risk = rwbOdenAttackThreat(a, oden.x, oden.y, 0, false);
            if (!risk) continue;
            a.odenHit = true;
            const projectile = ["fist", "rock", "giant_rock", "fire_piece", "haki_wave", "wb_reflected_bullet"].includes(a.type) ||
                (a.type === "hell_fire" && a.state === "flying");
            if (oden.invulnTimer <= 0) {
                const rawDamage = Math.max(4, Math.min(18, Math.ceil((Number(a.damage) || 12) * 0.45)));
                const damage = rawDamage * (oden.lastBreath ? 0.2 : 1);
                oden.hp = Math.max(0, oden.hp - damage);
                if (oden.hp > 0 && !oden.lastBreath &&
                    oden.hp <= Math.max(1, Number(oden.maxHp) || 125) * 0.25) {
                    rwbOdenEnterLastBreath(oden);
                }
                const stunDuration = Number(a.stunDuration || a.stunFrames) ||
                    (a.type === "wb_fruit_punch" && a.state === "active" ? 38 :
                    (a.type === "tsunami" ? (a.comboPull ? 18 : 10) : 0));
                if (stunDuration > 0) {
                    oden.stunTimer = Math.max(Number(oden.stunTimer) || 0, stunDuration);
                    oden.windup = 0;
                    oden.swingTimer = 0;
                }
                oden.invulnTimer = oden.lastBreath ? 24 : 64;
                oden.hitFlash = 12;
                oden.dodgeCooldown = Math.max(oden.dodgeCooldown || 0, 12);
                let knockX = oden.x - risk.x, knockY = oden.y - risk.y;
                let knockLen = Math.hypot(knockX, knockY);
                if (knockLen < 0.01 && risk.axis === "horizontal") { knockX = 0; knockY = oden.y < risk.y ? -1 : 1; knockLen = 1; }
                else if (knockLen < 0.01 && risk.axis === "vertical") { knockX = oden.x < risk.x ? -1 : 1; knockY = 0; knockLen = 1; }
                else if (knockLen < 0.01) { const fallbackAngle = Math.random() * Math.PI * 2; knockX = Math.cos(fallbackAngle); knockY = Math.sin(fallbackAngle); knockLen = 1; }
                oden.vx += knockX / knockLen * 3.8;
                oden.vy += knockY / knockLen * 3.8;
                rwbFloatingTexts.push({
                    x: oden.x, y: oden.y - 25, text: "ОДЭН −" + damage,
                    color: "#ffe98a", life: 48, maxLife: 48, vy: -0.7, vx: 0, size: 13
                });
                if (stunDuration > 0) {
                    rwbFloatingTexts.push({
                        x: oden.x, y: oden.y - 42, text: "ОГЛУШЁН!",
                        color: "#bba0ff", life: 44, maxLife: 44, vy: -0.6, vx: 0, size: 12
                    });
                }
                spawnHitParticles(oden.x, oden.y, "#ffd44f", 12);
                playImpactSound(0.16, 1.0);
                if (oden.hp <= 0) rwbOdenDie(oden);
            }
            if (projectile) rwbAttacks.splice(i, 1);
        }
        if (!oden.alive) return;
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            const sw = rwbShockwaves[i];
            if (!rwbOdenShockwaveThreat(sw, oden.x, oden.y, 0, false)) continue;
            sw.odenHit = true;
            if (oden.invulnTimer > 0) continue;
            const rawDamage = Math.max(4, Math.min(15, Math.ceil((Number(sw.damage) || 10) * 0.45)));
            const damage = rawDamage * (oden.lastBreath ? 0.2 : 1);
            oden.hp = Math.max(0, oden.hp - damage);
            if (oden.hp > 0 && !oden.lastBreath &&
                oden.hp <= Math.max(1, Number(oden.maxHp) || 125) * 0.25) {
                rwbOdenEnterLastBreath(oden);
            }
            oden.invulnTimer = oden.lastBreath ? 24 : 64; oden.hitFlash = 12;
            rwbFloatingTexts.push({x:oden.x,y:oden.y-25,text:"ОДЭН −"+damage.toFixed(1).replace(/\.0$/,""),color:oden.lastBreath ? "#ff263b" : "#ffe98a",life:48,maxLife:48,vy:-0.7,vx:0,size:13});
            spawnHitParticles(oden.x, oden.y, oden.lastBreath ? "#ff263b" : "#ffd44f", 12);
            if (oden.hp <= 0) {
                rwbOdenDie(oden);
                return;
            }
        }
    }

    // Oden's speed is tied to the player's current movement modifiers, not his AI skill.
    function rwbOdenGetMovementSpeed() {
        let speed = (Number(rwbBaseSpeed) || 4.5) * (Number(rwbSpeedMult) || 1);
        if (rwbOden && rwbOden.lastBreath) speed *= 1.35;
        if (typeof getTakabaCombatModifiers === "function") {
            try {
                const modifiers = getTakabaCombatModifiers();
                if (modifiers && Number.isFinite(Number(modifiers.speedMult))) speed *= Number(modifiers.speedMult);
            } catch (e) {}
        }
        return Math.max(0.5, Math.min(12, Number.isFinite(speed) ? speed : 4.5));
    }

    // Predict Oden's actual eased route, including acceleration, braking and arena boundaries.
    // The same predictor is used for incoming hazards and candidate dodge routes.
    function rwbOdenPredictRoute(oden, targetX, targetY, futureTimes) {
        const maxTime = Math.max(0, ...futureTimes);
        const wantedTimes = new Set(futureTimes);
        const path = [];
        const maxSpeed = rwbOdenGetMovementSpeed();
        const skill = Math.max(0.14, Math.min(1, Number(oden.aiSkill) || 0.3));
        const steering = oden.tsunamiEvading ? 0.28 : 0.17 + skill * 0.13;
        let x = Number(oden.x) || 0, y = Number(oden.y) || 0;
        let vx = Number(oden.vx) || 0, vy = Number(oden.vy) || 0;

        for (let frame = 0; frame <= maxTime; frame++) {
            if (wantedTimes.has(frame)) path.push({ time: frame, x: x, y: y });
            if (frame === maxTime) break;

            const dx = targetX - x, dy = targetY - y;
            const dist = Math.hypot(dx, dy);
            const desiredSpeed = dist < 3 ? 0 : Math.min(maxSpeed, Math.max(0.45, dist * 0.22));
            const desiredVx = dist > 0 ? dx / dist * desiredSpeed : 0;
            const desiredVy = dist > 0 ? dy / dist * desiredSpeed : 0;
            vx += (desiredVx - vx) * steering;
            vy += (desiredVy - vy) * steering;

            const currentSpeed = Math.hypot(vx, vy);
            if (currentSpeed > maxSpeed) {
                vx = vx / currentSpeed * maxSpeed;
                vy = vy / currentSpeed * maxSpeed;
            }

            const nextX = x + vx, nextY = y + vy;
            x = Math.max(18, Math.min(382, nextX));
            y = Math.max(8, Math.min(482, nextY));
            if (x !== nextX) vx *= -0.18;
            if (y !== nextY) vy *= -0.18;
        }
        return path;
    }

    function rwbOdenFindIncoming(oden) {
        if (!oden || !oden.alive) return null;
        const skill = Math.max(0.14, Math.min(1, Number(oden.aiSkill) || 0.14));
        // Higher skill looks farther ahead, but the path always respects Oden's real top speed.
        const horizon = Math.round(150 + skill * 56);
        const sampleTimes = [0];
        for (let t = 4; t < horizon; t += 4) sampleTimes.push(t);
        if (sampleTimes[sampleTimes.length - 1] !== horizon) sampleTimes.push(horizon);

        const targetX = Number.isFinite(Number(oden.moveTargetX)) ? Number(oden.moveTargetX) : oden.x;
        const targetY = Number.isFinite(Number(oden.moveTargetY)) ? Number(oden.moveTargetY) : oden.y;
        const path = rwbOdenPredictRoute(oden, targetX, targetY, sampleTimes);
        let closest = null, bestT = Infinity;

        // Every visible warning and live projectile is checked against the predicted trajectory.
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            const attack = rwbAttacks[i];
            for (let p = 0; p < path.length; p++) {
                const point = path[p];
                const risk = rwbOdenAttackThreat(attack, point.x, point.y, point.time, true);
                if (risk && point.time < bestT) {
                    bestT = point.time;
                    closest = {
                        risk: risk, time: point.time, attackType: attack.type,
                        attack: attack, predictedX: point.x, predictedY: point.y
                    };
                    break;
                }
            }
        }
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            const wave = rwbShockwaves[i];
            for (let p = 0; p < path.length; p++) {
                const point = path[p];
                const risk = rwbOdenShockwaveThreat(wave, point.x, point.y, point.time, true);
                if (risk && point.time < bestT) {
                    bestT = point.time;
                    closest = {
                        risk: risk, time: point.time, attackType: "shockwave",
                        attack: wave, predictedX: point.x, predictedY: point.y
                    };
                    break;
                }
            }
        }
        return closest;
    }

    function rwbOdenChooseDodgeTarget(oden, incoming, preferredX) {
        const left = 24, right = 376, top = 18, bottom = 474;
        const angles = 16, distances = [88, 128, 164];
        const futureTimes = [4, 8, 13, 19, 27, 37, 49];
        const targets = getRWBOdenTargets().filter(function(boss) { return boss && boss.hp > 0; });
        const playerSpeed = rwbOdenGetMovementSpeed();
        let best = null, bestScore = -Infinity;
        const currentSpeed = Math.hypot(Number(oden.vx) || 0, Number(oden.vy) || 0);

        for (let d = 0; d < distances.length; d++) {
            for (let k = 0; k < angles; k++) {
                const angle = k * Math.PI * 2 / angles;
                const tx = Math.max(left, Math.min(right, oden.x + Math.cos(angle) * distances[d]));
                const ty = Math.max(top, Math.min(bottom, oden.y + Math.sin(angle) * distances[d]));
                const route = rwbOdenPredictRoute(oden, tx, ty, futureTimes);
                let score = 0, collisions = 0;

                for (let ti = 0; ti < route.length; ti++) {
                    const point = route[ti];
                    for (let ai = rwbAttacks.length - 1; ai >= 0; ai--) {
                        if (rwbOdenAttackThreat(rwbAttacks[ai], point.x, point.y, point.time, true)) {
                            collisions++;
                            score -= ti < 2 ? 38 : 27;
                        }
                    }
                    for (let wi = rwbShockwaves.length - 1; wi >= 0; wi--) {
                        if (rwbOdenShockwaveThreat(rwbShockwaves[wi], point.x, point.y, point.time, true)) {
                            collisions++;
                            score -= ti < 2 ? 34 : 24;
                        }
                    }
                }
                if (collisions === 0) score += 180;
                if (incoming && incoming.risk) {
                    score += Math.min(180, Math.hypot(tx - incoming.risk.x, ty - incoming.risk.y)) * 0.14;
                }
                if (Number.isFinite(preferredX)) score -= Math.abs(tx - preferredX) * 0.26;

                // Prefer a smooth change of direction over a robotic instant reversal.
                if (currentSpeed > 0.8) {
                    const routeDX = tx - oden.x, routeDY = ty - oden.y;
                    const routeLength = Math.hypot(routeDX, routeDY) || 1;
                    const movementAlignment = ((Number(oden.vx) || 0) * routeDX + (Number(oden.vy) || 0) * routeDY) /
                        Math.max(1, currentSpeed * routeLength);
                    score += movementAlignment * 12;
                }
                const continuity = Math.hypot(tx - (Number(oden.moveTargetX) || oden.x),
                    ty - (Number(oden.moveTargetY) || oden.y));
                score -= Math.min(80, continuity) * 0.035;

                const margin = Math.min(tx - left, right - tx, ty - top, bottom - ty);
                score += Math.min(28, Math.max(0, margin)) * 0.55;
                let nearestBoss = Infinity;
                for (let bi = 0; bi < targets.length; bi++) {
                    nearestBoss = Math.min(nearestBoss, Math.hypot(tx - targets[bi].x, ty - targets[bi].y));
                }
                if (nearestBoss < 132) score -= (132 - nearestBoss) * 2.25;
                else if (nearestBoss < Infinity) score += Math.min(70, nearestBoss - 132) * 0.12;

                // A little controlled variation makes choices feel less like a repeated script.
                score += Math.random() * 1.5;
                if (score > bestScore) {
                    bestScore = score;
                    best = { x: tx, y: ty, safe: collisions === 0 };
                }
            }
        }
        return best || {
            x: Math.max(left, Math.min(right, oden.x + (oden.x < 200 ? 100 : -100))),
            y: Math.max(top, Math.min(bottom, oden.y - 55)), safe: false
        };
    }

    function rwbOdenIsBreakableBlock(a) {
        if (!a || !Number.isFinite(Number(a.hp)) || Number(a.hp) <= 0) return false;
        return ["blade", "big_blade", "rock", "giant_rock", "fist",
            "hell_fire", "fire_piece", "wb_reflected_bullet"].includes(a.type) ||
            (a.type === "wb_crescent_slash" && a.state === "flying");
    }

    // Blue shots track destructible attacks and breakable shockwave fronts only.
    // This target set deliberately excludes Roger and Whitebeard.
    function rwbOdenGetNearestBlueBlock(fromX, fromY) {
        const ox = Number(fromX), oy = Number(fromY);
        if (!Number.isFinite(ox) || !Number.isFinite(oy)) return null;
        const exitPriority = rwbOden && rwbOden.tsunamiExitBlock;
        if (exitPriority && exitPriority.kind === "attack" &&
            rwbAttacks.includes(exitPriority.object) &&
            rwbOdenIsBreakableBlock(exitPriority.object) &&
            exitPriority.object.state !== "warning" &&
            exitPriority.object.state !== "windup" &&
            exitPriority.object.state !== "done") {
            const object = exitPriority.object;
            return { kind: "attack", object: object, x: Number(object.x), y: Number(object.y),
                dist: Math.hypot(Number(object.x) - ox, Number(object.y) - oy) };
        }
        if (exitPriority && exitPriority.kind === "shockwave" &&
            rwbShockwaves.includes(exitPriority.object) &&
            exitPriority.object.canDestroy && Number(exitPriority.object.hp) > 0) {
            const sw = exitPriority.object;
            const cx = Number(sw.x), cy = Number(sw.y), radius = Math.max(0, Number(sw.radius) || 0);
            const dx = ox - cx, dy = oy - cy, dist = Math.hypot(dx, dy) || 1;
            const x = cx + dx / dist * radius, y = cy + dy / dist * radius;
            return { kind: "shockwave", object: sw, x: x, y: y, dist: Math.hypot(x - ox, y - oy) };
        }
        let best = null, bestDist = Infinity;
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            const a = rwbAttacks[i];
            if (!rwbOdenIsBreakableBlock(a) ||
                a.state === "warning" || a.state === "windup" || a.state === "done") continue;
            const x = Number(a.x), y = Number(a.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            const d = Math.hypot(x - ox, y - oy);
            if (d < bestDist) { bestDist = d; best = { kind: "attack", object: a, x: x, y: y, dist: d }; }
        }
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            const sw = rwbShockwaves[i];
            if (!sw || !sw.canDestroy || !Number.isFinite(Number(sw.hp)) || sw.hp <= 0) continue;
            const cx = Number(sw.x), cy = Number(sw.y), radius = Math.max(0, Number(sw.radius) || 0);
            if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
            const dx = ox - cx, dy = oy - cy, dist = Math.hypot(dx, dy) || 1;
            const tx = cx + dx / dist * radius, ty = cy + dy / dist * radius;
            const d = Math.hypot(tx - ox, ty - oy);
            if (d < bestDist) { bestDist = d; best = { kind: "shockwave", object: sw, x: tx, y: ty, dist: d }; }
        }
        return best;
    }

    // Blue mode activates when a destructible hazard blocks the straight sword lane to Oden's target.
    function rwbOdenHasBreakableBlockOnAttackLane(oden) {
        if (!oden) return false;
        const target = getRWBOdenAttackTarget(getRWBOdenTargets());
        if (!target) return false;
        const dx = target.x - oden.x, dy = target.y - oden.y;
        const length2 = dx * dx + dy * dy;
        if (length2 < 95 * 95) return false;
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            const a = rwbAttacks[i];
            if (!rwbOdenIsBreakableBlock(a) ||
                a.state === "warning" || a.state === "windup" || a.state === "done") continue;
            const ax = Number(a.x), ay = Number(a.y);
            if (!Number.isFinite(ax) || !Number.isFinite(ay)) continue;
            const along = ((ax - oden.x) * dx + (ay - oden.y) * dy) / length2;
            if (along < 0.10 || along > 0.90) continue;
            const radius = (Number(a.size) || Number(a.radius) || 18) * 0.72 + 15;
            if (rwbOdenSegmentDistance(ax, ay, oden.x, oden.y, target.x, target.y) < radius) return true;
        }
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            const sw = rwbShockwaves[i];
            if (!sw || !sw.canDestroy || !Number.isFinite(Number(sw.hp)) || sw.hp <= 0) continue;
            const alongDistance = ((sw.x - oden.x) * dx + (sw.y - oden.y) * dy) / Math.sqrt(length2);
            if (alongDistance < 20 || alongDistance > Math.sqrt(length2) - 20) continue;
            const waveRadius = Number(sw.radius) || 0;
            const waveBand = (Number(sw.width) || 8) + 18;
            const distToLane = rwbOdenSegmentDistance(sw.x, sw.y, oden.x, oden.y, target.x, target.y);
            const endpointMax = Math.max(Math.hypot(sw.x - oden.x, sw.y - oden.y),
                Math.hypot(sw.x - target.x, sw.y - target.y));
            if (distToLane <= waveRadius + waveBand &&
                endpointMax >= Math.max(0, waveRadius - waveBand)) return true;
        }
        return false;
    }

    // The combo's attraction field pulls allies as well as the player; Oden cannot simply ignore it.
    function rwbOdenFindTsunamiPull(oden) {
        if (!oden || !oden.alive || !wbTrapCombo || wbTrapCombo.stage === "idle") return null;
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            const wave = rwbAttacks[i];
            if (!wave || wave.type !== "tsunami" || !wave.comboPull) continue;
            if (Math.abs(oden.y - wave.y) >= 175) continue;
            return {
                targetX: clampWhitebeard(Number(wave.pullTargetX) || wbTrapCombo.targetX || 200, 35, 365),
                targetY: clampWhitebeard(Number(wave.pullTargetY) || wbTrapCombo.targetY || 380, 35, 465),
                wave: wave
            };
        }
        return null;
    }

    // Predict the next tsunami crossing and rush to the uncovered side of the arena.
    function rwbOdenFindTsunamiEscape(oden, skill) {
        if (!oden || !oden.alive) return null;
        const horizon = 112 + Math.max(0, Math.min(1, skill || 0)) * 46;
        const body = oden.size * 0.72;
        let best = null;
        for (let i = 0; i < rwbAttacks.length; i++) {
            const wave = rwbAttacks[i];
            if (!wave || wave.type !== "tsunami") continue;
            const vy = Number(wave.vy) || 0;
            if (vy <= 0) continue;
            const halfBand = (Number(wave.currentHeight) || Number(wave.height) || 55) * 0.5 + body + 12;
            const framesToReach = (oden.y - wave.y) / vy;
            if (framesToReach < -halfBand / vy || framesToReach > horizon) continue;
            const safeX = wave.fromRight
                ? Math.max(26, Math.min(112, (Number(wave.x) || 130) - 48))
                : Math.max(288, Math.min(376, (Number(wave.width) || 270) + 48));
            if (!best || framesToReach < best.framesToReach) {
                best = { safeX: safeX, framesToReach: framesToReach, side: wave.fromRight ? "left" : "right", wave: wave };
            }
        }
        return best;
    }

    // Check whether a destructible object or a falling boulder blocks the predicted tsunami exit.
    function rwbOdenFindTsunamiExitBlock(oden, escape) {
        if (!oden || !oden.alive || !escape) return null;
        const exitX = Math.max(22, Math.min(378, Number(escape.safeX) || 200));
        const exitY = Math.max(365, Math.min(466, Number(oden.y) || 420));
        let best = null, bestScore = Infinity;
        function consider(kind, object, x, y, radius, canShoot) {
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            const routeDistance = rwbOdenSegmentDistance(x, y, oden.x, oden.y, exitX, exitY);
            const nearExit = Math.abs(x - exitX) <= radius + 28 && y >= 260 && y <= 505;
            if (routeDistance > radius + 24 && !nearExit) return;
            const score = Math.min(routeDistance, Math.hypot(x - exitX, y - exitY) + 10);
            if (score < bestScore) {
                bestScore = score;
                best = { kind: kind, object: object, x: x, y: y,
                    dist: Math.hypot(x - oden.x, y - oden.y), canShoot: canShoot };
            }
        }
        for (let i = 0; i < rwbAttacks.length; i++) {
            const a = rwbAttacks[i];
            if (!a) continue;
            const warning = a.type === "wb_giant_rock_warning" && Number(a.warningTimer) > 0;
            const breakable = rwbOdenIsBreakableBlock(a) &&
                a.state !== "warning" && a.state !== "windup" && a.state !== "done";
            if (!warning && !breakable) continue;
            const x = warning ? (Number(a.targetX) || Number(a.x)) : Number(a.x);
            const y = Number(a.y);
            const radius = warning ? 58 : (Number(a.size) || Number(a.radius) || 18) * 0.72 + 18;
            consider(warning ? "warning" : "attack", a, x, y, radius, breakable);
        }
        for (let i = 0; i < rwbShockwaves.length; i++) {
            const sw = rwbShockwaves[i];
            if (!sw || !sw.canDestroy || !(Number(sw.hp) > 0)) continue;
            const cx = Number(sw.x), cy = Number(sw.y), radius = Math.max(0, Number(sw.radius) || 0);
            if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
            const routeDx = exitX - oden.x, routeDy = exitY - oden.y;
            const len2 = routeDx * routeDx + routeDy * routeDy;
            const t = len2 > 0 ? Math.max(0, Math.min(1,
                ((cx - oden.x) * routeDx + (cy - oden.y) * routeDy) / len2)) : 0;
            const nearestX = oden.x + routeDx * t, nearestY = oden.y + routeDy * t;
            const dx = nearestX - cx, dy = nearestY - cy, dist = Math.hypot(dx, dy) || 1;
            consider("shockwave", sw, cx + dx / dist * radius, cy + dy / dist * radius,
                (Number(sw.width) || 8) + 18, true);
        }
        return best;
    }

    function rwbOdenHasNoEscape(oden) {
        if (!oden || !oden.alive) return false;
        const directions = 12, distances = [82, 122];
        const left = 22, right = 378, top = 14, bottom = 478;
        for (const distance of distances) {
            for (let i = 0; i < directions; i++) {
                const angle = i * Math.PI * 2 / directions;
                const x = oden.x + Math.cos(angle) * distance;
                const y = oden.y + Math.sin(angle) * distance;
                if (x < left || x > right || y < top || y > bottom) continue;
                let safe = true;
                for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                    if (rwbOdenAttackThreat(rwbAttacks[j], x, y, 8, true)) { safe = false; break; }
                }
                if (!safe) continue;
                for (let j = rwbShockwaves.length - 1; j >= 0; j--) {
                    if (rwbOdenShockwaveThreat(rwbShockwaves[j], x, y, 8, true)) { safe = false; break; }
                }
                if (safe) return false;
            }
        }
        return true;
    }

    function rwbOdenActivateBlueMode(oden, force) {
        if (!oden || oden.blueModeTimer > 0 || (!force && oden.blueModeCooldown > 0)) return;
        oden.blueModeTimer = 180;
        oden.blueModeCooldown = 720;
        oden.blueModeFlashTimer = 42;
        oden.dodgeCooldown = 0;
        rwbFloatingTexts.push({
            x: oden.x, y: oden.y - 35, text: "ОДЭН: СИНИЙ РЕЖИМ!",
            color: "#66eaff", life: 82, maxLife: 82, vy: -0.55, vx: 0, size: 14
        });
        spawnHitParticles(oden.x, oden.y, "#36d9ff", 22);
        rwbShockwaves.push({
            x: oden.x, y: oden.y, radius: 8, maxRadius: 100, speed: 7,
            color: "#48e9ff", life: 20, maxLife: 20, width: 4, damage: 0, hit: true
        });
        rwbScreenFlash = Math.max(rwbScreenFlash, 5);
        rwbScreenFlashColor = "#50deff";
        rwbShake = Math.max(rwbShake, 6);
        playImpactSound(0.22, 1.1);
    }

    function rwbOdenBlueSlashBreaksBlock(slash, x1, y1, x2, y2) {
        if (!slash || !slash.isBlue) return false;
        const damage = Math.max(1, Number(slash.blockDamage) || 2);
        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            const a = rwbAttacks[i];
            if (!rwbOdenIsBreakableBlock(a) ||
                a.state === "warning" || a.state === "windup" || a.state === "done") continue;
            const ax = Number(a.x), ay = Number(a.y);
            if (!Number.isFinite(ax) || !Number.isFinite(ay)) continue;
            const radius = (Number(a.size) || Number(a.radius) || 18) * 0.72 + (Number(slash.size) || 12) * 0.55;
            if (rwbOdenSegmentDistance(ax, ay, x1, y1, x2, y2) >= radius) continue;
            a.hp -= damage;
            spawnHitParticles(ax, ay, "#43e7ff", 7);
            rwbFloatingTexts.push({x:ax,y:ay-15,text:"ОДЭН: ПРОЛОМ!",color:"#7ceeff",life:32,maxLife:32,vy:-0.7,vx:0,size:10});
            if (a.hp <= 0) {
                spawnDestroyParticles(ax, ay, a.color || "#55ddff");
                rwbAttacks.splice(i, 1);
                playImpactSound(0.22, 1.25);
            } else {
                playWhooshSound(0.09);
            }
            return true;
        }
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            const sw = rwbShockwaves[i];
            if (!sw || !sw.canDestroy || !Number.isFinite(Number(sw.hp)) || sw.hp <= 0) continue;
            const radius = (Number(sw.width) || 5) * 0.7 + (Number(slash.size) || 12) * 0.6;
            const waveRadius = Number(sw.radius) || 0;
            const closest = rwbOdenSegmentDistance(sw.x, sw.y, x1, y1, x2, y2);
            const endpointMax = Math.max(Math.hypot(sw.x - x1, sw.y - y1), Math.hypot(sw.x - x2, sw.y - y2));
            if (closest > waveRadius + radius || endpointMax < Math.max(0, waveRadius - radius)) continue;
            sw.hp -= damage;
            spawnHitParticles(sw.x, sw.y, "#43e7ff", 6);
            if (sw.hp <= 0) {
                spawnDestroyParticles(sw.x, sw.y, sw.color || "#52e6ff");
                rwbShockwaves.splice(i, 1);
                playImpactSound(0.22, 1.25);
            }
            return true;
        }
        return false;
    }

    function updateRWBOdenSupport() {
        if (!rwbOden || !rwbPlayer || !rwbOden.alive) return;
        const oden = rwbOden;
        oden.phase += 0.11;
        if (!oden.lastBreath && oden.hp > 0 &&
            oden.hp <= Math.max(1, Number(oden.maxHp) || 125) * 0.25) {
            rwbOdenEnterLastBreath(oden);
        }
        // IQ improves during the fight, but never reaches perfect, inhuman prediction.
        oden.aiSkill = Math.min(0.99, (Number(oden.aiSkill) || 0.62) + (rwbState === "fight2" ? 0.0018 : 0.00045));
        if (rwbState === "fight2") oden.aiSkill = Math.max(0.96, oden.aiSkill);
        const aiSkill = Math.max(0.30, Math.min(1, oden.aiSkill));
        if (oden.hitFlash > 0) oden.hitFlash--;
        if (oden.invulnTimer > 0) oden.invulnTimer--;
        if (oden.dodgeCooldown > 0) oden.dodgeCooldown--;
        if (oden.dodgePlanTimer > 0) oden.dodgePlanTimer--;
        if (oden.dodgeFlashTimer > 0) oden.dodgeFlashTimer--;
        if (oden.blueModeTimer > 0) oden.blueModeTimer--;
        if (oden.blueModeCooldown > 0) oden.blueModeCooldown--;
        if (oden.blueModeFlashTimer > 0) oden.blueModeFlashTimer--;
        if (oden.blueModeCheckTimer > 0) oden.blueModeCheckTimer--;
        const odenNow = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
        const playerMaxHp = Math.max(1, Number(rwbPlayer.maxHp) || 1);
        if (!oden.lastBreath && oden.healState === "idle" &&
            odenNow >= (Number(oden.healCooldownUntil) || 0) &&
            Number(rwbPlayer.hp) < playerMaxHp * 0.35 &&
            (Number(oden.stunTimer) || 0) <= 0) {
            oden.healState = "approach";
            oden.healTimer = 300;
            oden.healTotal = playerMaxHp * 0.15;
            oden.healRemaining = oden.healTotal;
            oden.healSide = oden.x <= rwbPlayer.x ? -1 : 1;
            oden.healCooldownUntil = odenNow + 40000;
            oden.windup = 0;
            oden.swingTimer = 0;
            rwbOdenSlashes = [];
            rwbFloatingTexts.push({
                x: oden.x, y: oden.y - 30, text: "ОДЭН: Я ТЕБЯ ПРИКРОЮ!",
                color: "#8dffc6", life: 72, maxLife: 72, vy: -0.55, vx: 0, size: 12
            });
        }

        // Predict and dodge first; actual hits/stuns are resolved after this frame's movement.
        let stunned = (Number(oden.stunTimer) || 0) > 0;
        if (stunned) {
            oden.stunTimer = Math.max(0, oden.stunTimer - 1);
            oden.windup = 0;
            oden.swingTimer = 0;
            oden.vx *= 0.72;
            oden.vy *= 0.72;
            oden.moveTargetX = oden.x;
            oden.moveTargetY = oden.y;
            oden.tsunamiEvading = false;
            oden.tsunamiPulled = false;
        }

        let odenAvoidingFruitPunch = false;
        let odenDodgingForThreat = false;
        if (!stunned) {
        // If the safe side is barricaded, prioritize reaching it and break the blocker with Blue Mode,
        // even when Whitebeard's combo pull is active.
        const tsunamiPull = rwbOdenFindTsunamiPull(oden);
        const tsunamiEscape = rwbOdenFindTsunamiEscape(oden, aiSkill);
        const tsunamiExitBlock = tsunamiEscape ? rwbOdenFindTsunamiExitBlock(oden, tsunamiEscape) : null;
        const forceTsunamiExit = !!(tsunamiEscape && tsunamiExitBlock);
        oden.tsunamiExitBlock = tsunamiExitBlock && tsunamiExitBlock.canShoot ? tsunamiExitBlock : null;
        if (forceTsunamiExit && oden.blueModeTimer <= 0) rwbOdenActivateBlueMode(oden, true);
        oden.tsunamiPulled = !!tsunamiPull && !forceTsunamiExit;
        oden.tsunamiEvading = !!tsunamiEscape && (!tsunamiPull || forceTsunamiExit);
        if (forceTsunamiExit) {
            oden.moveTargetX = tsunamiEscape.safeX;
            oden.moveTargetY = Math.max(380, Math.min(455, Number(oden.y) || 420));
            oden.wanderTimer = Math.max(oden.wanderTimer, 30);
            oden.dodgeCooldown = Math.max(oden.dodgeCooldown, 16);
            oden.dodgeFlashTimer = Math.max(oden.dodgeFlashTimer, 7);
        } else if (tsunamiPull) {
            // The combo really pulls Oden, unless the predicted escape route is blocked.
            oden.moveTargetX = oden.x + clampWhitebeard((tsunamiPull.targetX - oden.x) * 0.28, -82, 82);
            oden.moveTargetY = oden.y + clampWhitebeard((tsunamiPull.targetY - oden.y) * 0.22, -64, 64);
            oden.vx += clampWhitebeard((tsunamiPull.targetX - oden.x) * 0.018, -1.35, 1.35) * 0.65;
            oden.vy += clampWhitebeard((tsunamiPull.targetY - oden.y) * 0.008, -0.55, 0.55) * 0.65;
            oden.wanderTimer = Math.max(oden.wanderTimer, 16);
        } else if (tsunamiEscape) {
            oden.moveTargetX = tsunamiEscape.safeX;
            oden.moveTargetY = Math.max(380, Math.min(455, Number(oden.y) || 420));
            oden.wanderTimer = Math.max(oden.wanderTimer, 24);
            oden.dodgeCooldown = Math.max(oden.dodgeCooldown, 16);
            oden.dodgeFlashTimer = Math.max(oden.dodgeFlashTimer, 7);
        } else if (oden.healState !== "idle") {
            // Healing mode keeps Oden on the player's flank; he never attacks during this support action.
            const side = Number(oden.healSide) || 1;
            oden.moveTargetX = Math.max(30, Math.min(370, rwbPlayer.x + side * 43));
            oden.moveTargetY = Math.max(28, Math.min(456, rwbPlayer.y - 7));
            oden.wanderTimer = Math.max(oden.wanderTimer, 8);
        } else {
            oden.companionModeTimer = Math.max(0, (Number(oden.companionModeTimer) || 0) - 1);
            if (oden.companionModeTimer <= 0) {
                const playerHpRatio = (Number(rwbPlayer.hp) || 0) / Math.max(1, Number(rwbPlayer.maxHp) || 1);
                // When the player is hurt, Oden naturally spends more time guarding than roaming.
                oden.companionMode = playerHpRatio < 0.45
                    ? (Math.random() < 0.78 ? "guard" : "roam")
                    : (Math.random() < 0.52 ? "guard" : "roam");
                oden.companionSide = Math.random() < 0.5 ? -1 : 1;
                oden.companionOffsetX = (Math.random() - 0.5) * 24;
                oden.companionOffsetY = (Math.random() - 0.5) * 18;
                oden.companionModeTimer = oden.companionMode === "guard"
                    ? 95 + Math.floor(Math.random() * 85)
                    : 125 + Math.floor(Math.random() * 125);
            }
            if (oden.companionMode === "guard") {
                // Guard near the player for a short stretch, then resume independent movement.
                oden.moveTargetX = Math.max(32, Math.min(368, rwbPlayer.x + oden.companionSide * 50 + (Number(oden.companionOffsetX) || 0)));
                oden.moveTargetY = Math.max(28, Math.min(456, rwbPlayer.y - 12 + (Number(oden.companionOffsetY) || 0)));
                oden.wanderTimer = Math.max(oden.wanderTimer, 8);
            } else {
                oden.wanderTimer--;
                if (oden.wanderTimer <= 0 ||
                    Math.hypot(oden.moveTargetX - oden.x, oden.moveTargetY - oden.y) < 18) {
                    oden.moveTargetX = 38 + Math.random() * 324;
                    oden.moveTargetY = 100 + Math.random() * 340;
                    oden.wanderTimer = 42 + Math.floor(Math.random() * 54);
                }
            }
        }

        // Usually hold the lower lane and shadow the target's horizontal movement, looking up at the boss.
        if (oden.healState === "idle" && !tsunamiPull && !tsunamiEscape && !oden.lastBreath) {
            const bottomBoss = getRWBOdenAttackTarget(getRWBOdenTargets());
            if (bottomBoss) {
                const bossLeadX = Math.max(-24, Math.min(24, (Number(bottomBoss.vx) || 0) * 5));
                oden.moveTargetX = Math.max(28, Math.min(372, Number(bottomBoss.x) + bossLeadX));
                oden.moveTargetY = 422;
                oden.wanderTimer = Math.max(oden.wanderTimer, 12);
            }
        }

        // Keep the lower-lane formation unless a support/emergency state overrides it.
        if (oden.healState === "idle" && !tsunamiPull && !tsunamiEscape &&
            Math.abs((Number(oden.moveTargetY) || 0) - 422) > 38) {
            const bosses = getRWBOdenTargets().filter(function(boss) { return boss && boss.hp > 0; });
            const targetTooClose = bosses.some(function(boss) {
                return Math.hypot(oden.moveTargetX - boss.x, oden.moveTargetY - boss.y) < 132;
            });
            if (targetTooClose) {
                const safeFlank = rwbOdenChooseDodgeTarget(oden, null, undefined);
                if (safeFlank) {
                    oden.moveTargetX = safeFlank.x;
                    oden.moveTargetY = safeFlank.y;
                    oden.wanderTimer = Math.max(oden.wanderTimer, 24);
                }
            }
        }

        let incoming = rwbOdenFindIncoming(oden);
        // Oden treats Whitebeard's fruit punch as a priority threat, even during healing.
        const fruitPunchThreat = rwbAttacks.find(function(a) {
            return a && a.type === "wb_fruit_punch" && (a.state === "warning" || a.state === "active");
        });
        if (fruitPunchThreat) {
            const currentRisk = rwbOdenAttackThreat(fruitPunchThreat, oden.x, oden.y, 0, true);
            const plannedRisk = rwbOdenAttackThreat(fruitPunchThreat, oden.moveTargetX, oden.moveTargetY, 0, true);
            const nearTarget = Math.hypot(oden.x - (Number(fruitPunchThreat.targetX) || 0),
                oden.y - (Number(fruitPunchThreat.targetY) || 0)) < 160;
            const routeRisk = incoming && incoming.attack === fruitPunchThreat ? incoming.risk : null;
            if (currentRisk || plannedRisk || nearTarget || routeRisk) {
                odenAvoidingFruitPunch = true;
                incoming = {
                    risk: currentRisk || plannedRisk || routeRisk || {
                        x: Number(fruitPunchThreat.targetX) || 200,
                        y: Number(fruitPunchThreat.targetY) || 250,
                        axis: "point", distance: 0
                    },
                    time: 0, attackType: "wb_fruit_punch", attack: fruitPunchThreat,
                    predictedX: oden.x, predictedY: oden.y
                };
            }
        }
        if (!oden.lastBreath && oden.healState === "idle" && oden.blueModeCooldown <= 0 && oden.blueModeTimer <= 0 &&
            oden.blueModeCheckTimer <= 0) {
            oden.blueModeCheckTimer = 12;
            const laneBlocked = rwbOdenHasBreakableBlockOnAttackLane(oden);
            const noSafeRoute = aiSkill >= 0.42 && rwbOdenHasNoEscape(oden);
            if (laneBlocked || noSafeRoute) rwbOdenActivateBlueMode(oden);
        }
        const urgentThreat = !!incoming && incoming.time <= 8;
        const newThreat = !!incoming && incoming.attack !== oden.lastThreatAttack;
        if (!oden.lastBreath && incoming && incoming.time <= Math.round(96 + aiSkill * 34) &&
            (oden.dodgeCooldown <= 0 || urgentThreat || oden.healState !== "idle") &&
            (oden.dodgePlanTimer <= 0 || urgentThreat || oden.healState !== "idle" || (newThreat && incoming.time <= 22))) {
            const escapeX = tsunamiEscape && Number.isFinite(tsunamiEscape.safeX) ? tsunamiEscape.safeX : undefined;
            const safeTarget = rwbOdenChooseDodgeTarget(oden, incoming, escapeX);
            odenDodgingForThreat = true;
            oden.moveTargetX = safeTarget.x;
            oden.moveTargetY = safeTarget.y;
            oden.wanderTimer = 28 + Math.floor((1 - aiSkill) * 12);
            oden.dodgePlanTimer = Math.max(8, Math.round(19 - aiSkill * 7));
            oden.lastThreatAttack = incoming.attack || null;
            oden.dodgeCooldown = incoming.time <= 12
                ? Math.max(3, Math.round(8 - aiSkill * 3))
                : Math.max(6, Math.round(14 - aiSkill * 5));
            oden.dodgeFlashTimer = 13;
            spawnHitParticles(oden.x, oden.y, "#d9a7ff", 4);
        } else if (!incoming && oden.dodgePlanTimer <= 0) {
            oden.lastThreatAttack = null;
        }

        if (oden.lastBreath) {
            const rushTarget = getRWBOdenAttackTarget(getRWBOdenTargets());
            if (rushTarget) {
                const awayX = oden.x - rushTarget.x, awayY = oden.y - rushTarget.y;
                const awayLength = Math.max(1, Math.hypot(awayX, awayY));
                oden.moveTargetX = clampWhitebeard(rushTarget.x + awayX / awayLength * 42, 18, 382);
                oden.moveTargetY = clampWhitebeard(rushTarget.y + awayY / awayLength * 42, 8, 482);
                oden.wanderTimer = 0;
            }
        }

        // Same top movement speed as the player, but with eased acceleration/braking.
        // No teleporting impulses: even a dodge follows a smooth, readable trajectory.
        // Calm movement gets tiny, slow footwork; during danger the AI drops this drift and commits to the dodge.
        const calmFootwork = !incoming && oden.healState === "idle" && !oden.tsunamiPulled && !oden.tsunamiEvading;
        const driftX = calmFootwork ? Math.sin(oden.phase * 0.42 + (Number(oden.footworkPhase) || 0)) * 4.2 : 0;
        const driftY = calmFootwork ? Math.cos(oden.phase * 0.31 + (Number(oden.footworkPhase) || 0)) * 3.0 : 0;
        const toX = oden.moveTargetX + driftX - oden.x, toY = oden.moveTargetY + driftY - oden.y;
        const dist = Math.hypot(toX, toY) || 1;
        const maxSpeed = rwbOdenGetMovementSpeed();
        const desiredSpeed = dist < (calmFootwork ? 7 : 2) ? 0 : Math.min(maxSpeed, Math.max(0.45, dist * 0.22));
        const desiredVx = dist > 0 ? toX / dist * desiredSpeed : 0;
        const desiredVy = dist > 0 ? toY / dist * desiredSpeed : 0;
        const steering = oden.tsunamiPulled ? 0.23 : (oden.tsunamiEvading ? 0.28 :
            (urgentThreat ? 0.33 : (0.14 + aiSkill * 0.12)));
        oden.vx += (desiredVx - oden.vx) * steering;
        oden.vy += (desiredVy - oden.vy) * steering;
        const currentSpeed = Math.hypot(oden.vx, oden.vy);
        if (currentSpeed > maxSpeed) {
            oden.vx = oden.vx / currentSpeed * maxSpeed;
            oden.vy = oden.vy / currentSpeed * maxSpeed;
        }
        const nextX = oden.x + oden.vx;
        const nextY = oden.y + oden.vy;
        oden.x = Math.max(18, Math.min(382, nextX));
        oden.y = Math.max(8, Math.min(482, nextY));
        if (oden.x !== nextX) oden.vx *= -0.18;
        if (oden.y !== nextY) oden.vy *= -0.18;

        } else {
            // Stun decays smoothly; no fresh dodge/attack steering is performed during this window.
            oden.x = Math.max(18, Math.min(382, oden.x + oden.vx));
            oden.y = Math.max(8, Math.min(482, oden.y + oden.vy));
        }

        rwbOdenApplyCurrentHits(oden);
        if (!oden.alive) return;
        if ((Number(oden.stunTimer) || 0) > 0) {
            stunned = true;
            oden.windup = 0;
            oden.swingTimer = 0;
        }

        if (oden.healState === "approach" &&
            Math.hypot(oden.x - rwbPlayer.x, oden.y - rwbPlayer.y) <= 58) {
            oden.healState = "channel";
            oden.windup = 0;
            oden.swingTimer = 0;
            rwbOdenSlashes = [];
            rwbFloatingTexts.push({
                x: oden.x, y: oden.y - 28, text: "ЛЕЧЕНИЕ · 5 СЕКУНД",
                color: "#8dffc6", life: 64, maxLife: 64, vy: -0.5, vx: 0, size: 11
            });
        }
        if (oden.healState === "channel") {
            const closeToPlayer = Math.hypot(oden.x - rwbPlayer.x, oden.y - rwbPlayer.y) <= 82;
            if (!closeToPlayer) {
                // Keep the remaining healing budget and timer if the player moves away.
                oden.healState = "approach";
            } else if (!stunned && !odenAvoidingFruitPunch && !odenDodgingForThreat) {
                // Pause healing while Oden makes an evasive move; the remaining heal is preserved.
                const maximum = Math.max(1, Number(rwbPlayer.maxHp) || 1);
                const hpBefore = Math.max(0, Number(rwbPlayer.hp) || 0);
                const healStep = Math.min(Math.max(0, Number(oden.healRemaining) || 0),
                    Math.max(0, Number(oden.healTotal) || maximum * 0.15) / 300);
                rwbPlayer.hp = Math.min(maximum, hpBefore + healStep);
                const actuallyHealed = Math.max(0, rwbPlayer.hp - hpBefore);
                oden.healRemaining = Math.max(0, (Number(oden.healRemaining) || 0) - actuallyHealed);
                oden.healTimer = Math.max(0, oden.healTimer - 1);
                if (oden.healTimer <= 0 || oden.healRemaining <= 0.001) {
                    oden.healState = "idle";
                    oden.healTimer = 0;
                    oden.healRemaining = 0;
                    oden.healTotal = 0;
                    // Cooldown starts again after the heal finishes, not during it.
                    oden.healCooldownUntil = odenNow + 40000;
                    oden.companionMode = "guard";
                    oden.companionModeTimer = 105;
                    rwbFloatingTexts.push({
                        x: rwbPlayer.x, y: rwbPlayer.y - 30, text: "ОДЭН: ДЕРЖИСЬ!",
                        color: "#9affcf", life: 66, maxLife: 66, vy: -0.55, vx: 0, size: 12
                    });
                }
            }
        }

        const targets = getRWBOdenTargets();
        const focus = getRWBOdenAttackTarget(targets);
        const odenAttackRate = oden.blueModeTimer > 0 ? 3 : (oden.lastBreath ? 1.65 : 1); // Blue mode unchanged; last breath attacks faster.
        for (let i = rwbOdenSlashes.length - 1; i >= 0; i--) {
            const slash = rwbOdenSlashes[i];
            const previousX = slash.x, previousY = slash.y;
            if (slash.isBlue) {
                // Retarget dynamically to the nearest breakable attack. There is intentionally
                // no boss-target lookup or boss-hit path for blue-mode projectiles.
                const blockTarget = rwbOdenGetNearestBlueBlock(slash.x, slash.y);
                if (!blockTarget) {
                    rwbOdenSlashes.splice(i, 1);
                    continue;
                }
                const dx = blockTarget.x - slash.x, dy = blockTarget.y - slash.y;
                const dist = Math.max(1, Math.hypot(dx, dy));
                const speed = Math.max(10, Number(slash.speed) || 12);
                slash.vx = dx / dist * speed;
                slash.vy = dy / dist * speed;
                slash.x += slash.vx;
                slash.y += slash.vy;
                slash.angle = Math.atan2(slash.vy, slash.vx);
                slash.life -= 1;
                if (rwbOdenBlueSlashBreaksBlock(slash, previousX, previousY, slash.x, slash.y)) {
                    rwbOdenSlashes.splice(i, 1);
                    continue;
                }
                if (slash.life <= 0 || slash.x < -25 || slash.x > 425 || slash.y < -25 || slash.y > 525) {
                    rwbOdenSlashes.splice(i, 1);
                }
                // Critical: blue projectiles are block-only and cannot damage either boss.
                continue;
            }
            const target = getRWBOdenTargetById(slash.targetId);
            if (!target) {
                rwbOdenSlashes.splice(i, 1);
                continue;
            }
            // Ordinary Haki slashes receive only a small course correction. Blue mode
            // took the separate block-only branch above and keeps its full lock-on.
            if (!slash.isBlue && Number(slash.homingStrength) > 0) {
                const currentSpeed = Math.max(1, Math.hypot(slash.vx, slash.vy));
                const currentAngle = Math.atan2(slash.vy, slash.vx);
                const targetAngle = Math.atan2(target.y - slash.y, target.x - slash.x);
                const angleDelta = Math.atan2(
                    Math.sin(targetAngle - currentAngle),
                    Math.cos(targetAngle - currentAngle)
                );
                const correctedAngle = currentAngle + angleDelta * Math.min(0.02, Number(slash.homingStrength) || 0.012);
                slash.vx = Math.cos(correctedAngle) * currentSpeed;
                slash.vy = Math.sin(correctedAngle) * currentSpeed;
            }
            slash.x += slash.vx;
            slash.y += slash.vy;
            slash.angle = Math.atan2(slash.vy, slash.vx);
            slash.life -= 1;

            if (rwbOdenBlueSlashBreaksBlock(slash, previousX, previousY, slash.x, slash.y)) {
                rwbOdenSlashes.splice(i, 1);
                continue;
            }
            const actualPathDistance = rwbOdenSegmentDistance(target.x, target.y, previousX, previousY, slash.x, slash.y);
            if (actualPathDistance <= (target.size || 28) * 0.72 + slash.size * 0.5) {
                const damage = slash.damage;
                target.hp = Math.max(0, target.hp - damage);
                target.hitFlash = Math.max(target.hitFlash || 0, 8);
                if (target.id === "whitebeard") target.damageFlashTimer = Math.max(Number(target.damageFlashTimer) || 0, 8);
                rwbShockwaves.push({
                    x: target.x, y: target.y, radius: 7, maxRadius: 62,
                    speed: 6, color: "#b97aff", life: 16, maxLife: 16, width: 3
                });
                rwbFloatingTexts.push({
                    x: target.x, y: target.y - (target.size || 28) - 8,
                    text: "ОДЭН −" + damage, color: "#e8c9ff",
                    life: 44, maxLife: 44, vy: -0.75, vx: 0, size: 13
                });
                spawnHitParticles(target.x, target.y, "#bb7aff", 8);
                playBladeSound(0.22);
                if (target.hp <= 0) {
                    rwbScreenFlash = Math.max(rwbScreenFlash, 5);
                    rwbScreenFlashColor = "#c898ff";
                }
                rwbOdenSlashes.splice(i, 1);
                continue;
            }
            if (slash.life <= 0 || slash.x < -25 || slash.x > 425 || slash.y < -25 || slash.y > 525) {
                rwbOdenSlashes.splice(i, 1);
            }
        }

        if (oden.healState !== "idle") {
            // No attacking while approaching the player or channeling the heal.
            oden.windup = 0;
            oden.swingTimer = 0;
            rwbOdenSlashes = [];
        } else if (stunned) {
            oden.windup = 0;
            oden.swingTimer = 0;
        } else if (oden.swingTimer > 0) {
            oden.swingTimer = Math.max(0, oden.swingTimer - odenAttackRate);
        }
        if (oden.healState === "idle" && !stunned && oden.windup > 0) {
            oden.windup = Math.max(0, oden.windup - odenAttackRate);
            // attackAngle is locked at the start of the wind-up; never follow the target during it.
            const angle = Number.isFinite(oden.attackAngle) ? oden.attackAngle : oden.swordAngle;
            oden.swordAngle = angle;
            if (oden.windup <= 0) {
                if (oden.blueModeTimer > 0) {
                    const blockTarget = rwbOdenGetNearestBlueBlock(oden.x, oden.y);
                    if (blockTarget) {
                        const dx = blockTarget.x - oden.x, dy = blockTarget.y - oden.y;
                        const dist = Math.max(1, Math.hypot(dx, dy));
                        const lockedAngle = Math.atan2(dy, dx);
                        rwbOdenSlashes.push({
                            x: oden.x + Math.cos(lockedAngle) * 17,
                            y: oden.y + Math.sin(lockedAngle) * 17,
                            vx: dx / dist * 12, vy: dy / dist * 12,
                            speed: 12, angle: lockedAngle, size: 13,
                            damage: 0, targetId: null, life: 60, homing: true,
                            isBlue: true, blockDamage: 3, phase: Math.random() * Math.PI * 2
                        });
                        spawnHakiLightning(oden.x, oden.y, 1, false);
                        playBladeSound(0.28);
                    }
                } else {
                    const target = getRWBOdenTargetById(oden.targetId);
                    if (target) {
                        const baseDamage = target.superForm ? 3 : 2;
                        const damage = baseDamage * (oden.lastBreath ? 1.6 : 1);
                        // Haki coats ordinary slashes; homing is deliberately subtle, never full tracking.
                        const lockedAngle = angle;
                        rwbOdenSlashes.push({
                            x: oden.x + Math.cos(lockedAngle) * 17,
                            y: oden.y + Math.sin(lockedAngle) * 17,
                            vx: Math.cos(lockedAngle) * 9,
                            vy: Math.sin(lockedAngle) * 9,
                            speed: 9, angle: lockedAngle, size: 12,
                            damage: damage, targetId: target.id, life: 60, homing: true,
                            homingStrength: 0.012, hasHaki: true, lastBreath: !!oden.lastBreath,
                            aimX: target.x, aimY: target.y,
                            isBlue: false, blockDamage: 0,
                            phase: Math.random() * Math.PI * 2
                        });
                        spawnHakiLightning(oden.x, oden.y, 1, false);
                        playBladeSound(0.32);
                    }
                }
            }
        } else if (oden.healState === "idle" && !stunned && oden.attackCooldown > 0) {
            oden.attackCooldown = Math.max(0, oden.attackCooldown - odenAttackRate);
        } else if (oden.healState === "idle" && !stunned && oden.blueModeTimer > 0) {
            const blockTarget = rwbOdenGetNearestBlueBlock(oden.x, oden.y);
            if (blockTarget) {
                oden.targetId = null;
                oden.attackAngle = Math.atan2(blockTarget.y - oden.y, blockTarget.x - oden.x);
                oden.swordAngle = oden.attackAngle;
                oden.windup = 1;
                oden.swingTimer = 2;
                oden.attackCooldown = 8;
            } else {
                oden.windup = 0;
                oden.swingTimer = 0;
                oden.attackCooldown = Math.min(Number(oden.attackCooldown) || 0, 3);
            }
        } else if (oden.healState === "idle" && !stunned && focus) {
            oden.targetId = focus.id;
            // Lead moving bosses a little based on projectile travel time, with a small human-sized aim error.
            const targetDx = focus.x - oden.x, targetDy = focus.y - oden.y;
            const targetDistance = Math.hypot(targetDx, targetDy);
            const travelFrames = Math.min(18, Math.max(2, targetDistance / 9));
            const leadFactor = 0.34 + aiSkill * 0.36;
            const leadX = Math.max(-2.2, Math.min(2.2, Number(focus.vx) || 0)) * travelFrames * leadFactor;
            const leadY = Math.max(-1.8, Math.min(1.8, Number(focus.vy) || 0)) * travelFrames * leadFactor;
            const aimError = (Math.random() - 0.5) * (0.085 + (1 - aiSkill) * 0.22);
            oden.attackAngle = Math.atan2(targetDy + leadY, targetDx + leadX) + aimError;
            oden.swordAngle = oden.attackAngle;
            oden.windup = 3;
            oden.swingTimer = 5;
            oden.attackCooldown = 8;
        }
    }

    function drawRWBOdenSupport() {
        if (!rwbOden || !rwbOden.available) return;
        const oden = rwbOden;
        if (!oden.alive) {
            ctx.save();
            ctx.globalAlpha = 0.86; ctx.textAlign = "center";
            ctx.font = "bold 10px monospace"; ctx.fillStyle = "#c7a0ff";
            ctx.shadowColor = "#a85cff"; ctx.shadowBlur = 10;
            ctx.fillText("ОДЭН ВЫБЫЛ", oden.x, oden.y - 21);
            ctx.restore();
            return;
        }
        const bobY = Math.sin(oden.phase) * 2.2;
        const cx = oden.x, cy = oden.y + bobY, size = oden.size;
        const attacking = oden.swingTimer > 0 || oden.windup > 0;
        const blueMode = oden.blueModeTimer > 0;
        if (oden.hakiAwakened) {
            ctx.save();
            const hakiPulse = 0.22 + Math.abs(Math.sin(oden.phase * 1.55)) * 0.22;
            ctx.globalAlpha = oden.lastBreath ? Math.min(0.85, hakiPulse + 0.3) : hakiPulse;
            ctx.strokeStyle = oden.lastBreath ? "#f21c35" : "#241020";
            ctx.shadowColor = oden.lastBreath ? "#ff0c2a" : "#10030f";
            ctx.shadowBlur = oden.lastBreath ? 18 : 10;
            ctx.lineWidth = oden.lastBreath ? 3.2 : 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, size * (1.55 + Math.sin(oden.phase) * 0.08),
                size * (1.95 + Math.cos(oden.phase * 0.8) * 0.08), oden.phase * 0.12, 0, Math.PI * 2);
            ctx.stroke();
            if (oden.lastBreath) {
                ctx.globalAlpha = 0.7;
                ctx.strokeStyle = "#050505"; ctx.lineWidth = 4.5; ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(cx - size * 1.7, cy - size * 0.9);
                ctx.lineTo(cx - size * 0.9, cy - size * 0.2);
                ctx.lineTo(cx - size * 1.25, cy + size * 0.35);
                ctx.moveTo(cx + size * 1.65, cy - size * 0.7);
                ctx.lineTo(cx + size * 0.85, cy + size * 0.1);
                ctx.lineTo(cx + size * 1.3, cy + size * 0.65);
                ctx.stroke();
            }
            ctx.restore();
        }
        if (oden.lastBreath) {
            ctx.save();
            ctx.textAlign = "center"; ctx.font = "bold 8px monospace";
            ctx.fillStyle = "#ff263b"; ctx.shadowColor = "#ff001e"; ctx.shadowBlur = 10;
            ctx.fillText("ПОСЛЕДНИЙ ВЗДОХ", cx, cy - size - 23);
            ctx.restore();
        }
        if (blueMode || oden.healState === "channel") {
            ctx.save();
            const healing = oden.healState === "channel";
            ctx.globalAlpha = .35 + Math.abs(Math.sin(oden.phase * 1.8)) * .25;
            ctx.strokeStyle = healing ? "#83ffc0" : "#4bdfff";
            ctx.lineWidth = healing ? 2.4 : 2.8;
            ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.ellipse(cx, cy, size * (1.9 + Math.sin(oden.phase) * .15),
                size * (1.45 + Math.cos(oden.phase) * .12), oden.phase * .18, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            ctx.save();
            ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
            ctx.fillStyle = healing ? "#9affc8" : "#73efff";
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
            ctx.fillText(healing ? "ЛЕЧИТ ИГРОКА" : "ЛОМАЕТ БЛОКИ", cx, cy - size - 13);
            ctx.restore();
        }
        if (oden.stunTimer > 0) {
            ctx.save();
            ctx.fillStyle = "#d6bdff"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
            ctx.shadowColor = "#a86bff"; ctx.shadowBlur = 10;
            for (let star = 0; star < 3; star++) {
                const sx = cx + Math.cos(oden.phase * 1.6 + star * Math.PI * 2 / 3) * 19;
                const sy = cy - size - 9 + Math.sin(oden.phase * 1.6 + star * Math.PI * 2 / 3) * 4;
                ctx.beginPath(); ctx.moveTo(sx, sy - 4); ctx.lineTo(sx + 2, sy - 1);
                ctx.lineTo(sx + 5, sy); ctx.lineTo(sx + 2, sy + 2); ctx.lineTo(sx, sy + 5);
                ctx.lineTo(sx - 2, sy + 2); ctx.lineTo(sx - 5, sy); ctx.lineTo(sx - 2, sy - 1);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }
            ctx.restore();
        }

        // Flying purple ribbons curl around Oden's golden heart.
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.strokeStyle = "#54218e"; ctx.lineWidth = 4.5; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.45, cy - size * 0.45);
        ctx.bezierCurveTo(cx - size * 1.9, cy - size * 1.0, cx - size * 1.8, cy + size * 0.6, cx - size * 0.8, cy + size * 0.38);
        ctx.moveTo(cx + size * 0.4, cy + size * 0.15);
        ctx.bezierCurveTo(cx + size * 1.7, cy + size * 1.1, cx + size * 1.85, cy - size * 0.7, cx + size * 0.8, cy - size * 0.75);
        ctx.stroke();
        ctx.strokeStyle = "#c98cff"; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.45, cy - size * 0.45);
        ctx.bezierCurveTo(cx - size * 1.9, cy - size * 1.0, cx - size * 1.8, cy + size * 0.6, cx - size * 0.8, cy + size * 0.38);
        ctx.moveTo(cx + size * 0.4, cy + size * 0.15);
        ctx.bezierCurveTo(cx + size * 1.7, cy + size * 1.1, cx + size * 1.85, cy - size * 0.7, cx + size * 0.8, cy - size * 0.75);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = "#a65cff"; ctx.lineWidth = 1.3; ctx.shadowColor = "#9f55ff"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(0, 0, size * 1.55, size * 1.05, oden.phase * 0.15, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        if (oden.dodgeFlashTimer > 0 || oden.tsunamiEvading || oden.tsunamiPulled) {
            ctx.save();
            ctx.globalAlpha = (oden.tsunamiEvading || oden.tsunamiPulled) ? 0.88 : Math.min(0.9, 0.35 + oden.dodgeFlashTimer * 0.035);
            ctx.strokeStyle = oden.tsunamiPulled ? "#ff9cda" : (oden.tsunamiEvading ? "#61f0ff" : "#d9b0ff");
            ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
            ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(oden.moveTargetX, oden.moveTargetY); ctx.stroke();
            ctx.setLineDash([]);
            const arrowAngle = Math.atan2(oden.moveTargetY - cy, oden.moveTargetX - cx);
            ctx.beginPath();
            ctx.moveTo(oden.moveTargetX, oden.moveTargetY);
            ctx.lineTo(oden.moveTargetX - Math.cos(arrowAngle - 0.5) * 9, oden.moveTargetY - Math.sin(arrowAngle - 0.5) * 9);
            ctx.lineTo(oden.moveTargetX - Math.cos(arrowAngle + 0.5) * 9, oden.moveTargetY - Math.sin(arrowAngle + 0.5) * 9);
            ctx.closePath(); ctx.fill();
            ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
            ctx.fillText(oden.tsunamiPulled ? "ЦУНАМИ ТЯНЕТ!" : (oden.tsunamiEvading ? "ЦУНАМИ! УХОД" : "УКЛОНЕНИЕ"), cx, cy - size * 1.35);
            ctx.restore();
        }

        if (!drawRWBCombatSprite("oden", cx, cy - size * 0.24, size, oden.hitFlash > 0,
            Math.sin(oden.phase) * 0.018, 2.55, 2.8)) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.shadowColor = oden.hitFlash > 0 ? "#ffffff" : "#ffd44f";
            ctx.shadowBlur = oden.hitFlash > 0 ? 24 : 13;
            const heartGradient = ctx.createLinearGradient(0, -size * 1.1, 0, size * 0.85);
            heartGradient.addColorStop(0, oden.hitFlash > 0 ? "#ffffff" : (blueMode ? "#e9ffff" : "#fff6a0"));
            heartGradient.addColorStop(0.42, oden.hitFlash > 0 ? "#fff3c6" : (blueMode ? "#51dfff" : "#ffd52f"));
            heartGradient.addColorStop(1, oden.hitFlash > 0 ? "#ffffff" : (blueMode ? "#087cda" : "#ff9e00"));
            ctx.fillStyle = heartGradient;
            ctx.strokeStyle = "#5a3500"; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(0, size * 0.72);
            ctx.bezierCurveTo(-size * 1.35, -size * 0.15, -size * 0.7, -size * 1.08, 0, -size * 0.4);
            ctx.bezierCurveTo(size * 0.7, -size * 1.08, size * 1.35, -size * 0.15, 0, size * 0.72);
            ctx.closePath(); ctx.fill(); ctx.stroke();
    
            // Purple cloth is clipped to the heart, so the bands look wrapped around the body.
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, size * 0.72);
            ctx.bezierCurveTo(-size * 1.35, -size * 0.15, -size * 0.7, -size * 1.08, 0, -size * 0.4);
            ctx.bezierCurveTo(size * 0.7, -size * 1.08, size * 1.35, -size * 0.15, 0, size * 0.72);
            ctx.closePath(); ctx.clip();
            ctx.lineCap = "round";
            for (let band = -1; band <= 1; band++) {
                ctx.strokeStyle = "#6421a4"; ctx.lineWidth = size * 0.32;
                ctx.beginPath(); ctx.moveTo(-size * 1.55, band * size * 0.62 - size * 0.4);
                ctx.lineTo(size * 1.25, band * size * 0.62 + size * 0.55); ctx.stroke();
                ctx.strokeStyle = "#d9a7ff"; ctx.lineWidth = 1.3;
                ctx.beginPath(); ctx.moveTo(-size * 1.5, band * size * 0.62 - size * 0.4);
                ctx.lineTo(size * 1.2, band * size * 0.62 + size * 0.55); ctx.stroke();
            }
            ctx.restore();
            ctx.strokeStyle = "rgba(255,255,220,0.8)"; ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.arc(-size * 0.3, -size * 0.42, size * 0.18, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fill(); ctx.stroke();
            ctx.restore();А
    
            }

        // Oden carries two katanas, one in each hand. During attacks they sweep in alternating arcs.
        const baseAngle = Number.isFinite(oden.swordAngle) ? oden.swordAngle : -Math.PI / 3;
        const swordAttackActive = attacking && oden.healState === "idle" && oden.stunTimer <= 0;
        const swordClock = oden.phase * 3.05 + Math.max(0, 5 - (Number(oden.swingTimer) || 0)) * 0.42;
        const leftSwing = swordAttackActive ? Math.sin(swordClock) * 1.08 : -0.36 + Math.sin(oden.phase * 0.7) * 0.07;
        const rightSwing = swordAttackActive ? Math.sin(swordClock + Math.PI) * 1.08 : 0.36 - Math.sin(oden.phase * 0.7) * 0.07;
        function drawOdenKatana(handX, handY, angle, side) {
            ctx.save();
            ctx.translate(handX, handY);
            ctx.rotate(angle);
            const lastBreathSword = !!oden.lastBreath && !blueMode;
            ctx.shadowColor = blueMode ? "#50eaff" : (lastBreathSword ? "#ff102b" : "#10040e");
            ctx.shadowBlur = swordAttackActive ? (lastBreathSword ? 24 : 17) : 9;
            const blade = ctx.createLinearGradient(0, -3, 35, 3);
            blade.addColorStop(0, blueMode ? "#8ff6ff" : (lastBreathSword ? "#050505" : "#fff0a8"));
            blade.addColorStop(0.45, lastBreathSword ? "#d71932" : "#ffffff");
            blade.addColorStop(1, blueMode ? "#19b9ff" : (lastBreathSword ? "#170006" : "#a8caff"));
            ctx.fillStyle = blade; ctx.strokeStyle = "#30203f"; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(2, -2.8); ctx.lineTo(28, -1.8); ctx.lineTo(35, 0);
            ctx.lineTo(28, 1.8); ctx.lineTo(2, 2.8); ctx.closePath();
            ctx.fill(); ctx.stroke();
            // Distinct guard, wrapped grip and pommel on each sword.
            ctx.shadowBlur = 0;
            ctx.strokeStyle = side === "left" ? "#e3b958" : "#b98cff";
            ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(3, -6); ctx.lineTo(3, 6); ctx.stroke();
            ctx.strokeStyle = "#4d207d"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(2, 0); ctx.stroke();
            ctx.strokeStyle = "#c8a4ff"; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(-6, -1); ctx.lineTo(1, 1); ctx.stroke();
            ctx.fillStyle = "#ffdb62"; ctx.beginPath(); ctx.arc(-8, 0, 2.1, 0, Math.PI * 2); ctx.fill();
            if (swordAttackActive) {
                ctx.globalAlpha = 0.34;
                ctx.strokeStyle = side === "left" ? "#ffeaa0" : "#a7f7ff";
                ctx.lineWidth = 2.2;
                ctx.beginPath(); ctx.arc(5, 0, 29, -0.42, 0.42); ctx.stroke();
            }
            ctx.restore();
        }
        drawOdenKatana(cx - size * 0.49, cy - size * 0.08, baseAngle + leftSwing, "left");
        drawOdenKatana(cx + size * 0.49, cy - size * 0.02, baseAngle + rightSwing, "right");

        // Haki-coated sword waves; blue-mode shots keep their cyan lock-on look.
        for (let i = 0; i < rwbOdenSlashes.length; i++) {
            const slash = rwbOdenSlashes[i];
            const blueSlash = !!slash.isBlue;
            const lastBreathSlash = !!slash.lastBreath && !blueSlash;
            ctx.save(); ctx.translate(slash.x, slash.y); ctx.rotate(slash.angle);
            ctx.globalAlpha = Math.min(1, slash.life / 16);
            ctx.shadowColor = blueSlash ? "#087cda" : (lastBreathSlash ? "#ff102b" : "#080309");
            ctx.shadowBlur = lastBreathSlash ? 23 : 16;
            ctx.strokeStyle = blueSlash ? "#087cda" : (lastBreathSlash ? "#030303" : "#21101f");
            ctx.lineWidth = 9; ctx.lineCap = "round";
            ctx.beginPath(); ctx.arc(0, 0, slash.size * 1.25, -0.78, 0.78); ctx.stroke();
            ctx.strokeStyle = blueSlash ? "#69f2ff" : (lastBreathSlash ? "#fa1a32" : "#6e1f35");
            ctx.lineWidth = 3.1;
            ctx.beginPath(); ctx.arc(0, 0, slash.size * 1.2, -0.78, 0.78); ctx.stroke();
            ctx.strokeStyle = blueSlash ? "#eaffff" : (lastBreathSlash ? "#090909" : "#c84a63");
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(0, 0, slash.size * 1.05, -0.58, 0.58); ctx.stroke();
            if (lastBreathSlash) {
                ctx.strokeStyle = "#ff2138"; ctx.lineWidth = 1.1; ctx.globalAlpha *= 0.7;
                ctx.beginPath(); ctx.moveTo(-slash.size * 1.1, -slash.size * 0.6);
                ctx.lineTo(-slash.size * 0.2, slash.size * 0.25);
                ctx.lineTo(slash.size * 0.7, -slash.size * 0.45); ctx.stroke();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.textAlign = "center"; ctx.font = "bold 9px monospace";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(38,8,58,.9)"; ctx.strokeText("ОДЭН", cx, cy + size + 14);
        ctx.fillStyle = "#ffe99a"; ctx.fillText("ОДЭН", cx, cy + size + 14);
        ctx.restore();

        // Oden has a separate visible health bar. Flashing pale means a recent hit/dodge.
        const hasOdenSprite = !!getRWBCombatSprite("oden");
        const barW = 42, barX = cx - barW / 2, barY = cy + size + (hasOdenSprite ? 8 : 7);
        ctx.save();
        ctx.globalAlpha = oden.invulnTimer > 0 && oden.invulnTimer % 6 < 3 ? 0.48 : 0.94;
        ctx.fillStyle = "rgba(7,4,18,.92)"; ctx.fillRect(barX - 2, barY - 2, barW + 4, 13);
        ctx.fillStyle = "#39244e"; ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = oden.lastBreath ? "#ff1b32" : (oden.hp / oden.maxHp > .45 ? "#a9f78d" : "#ff708e");
        ctx.fillRect(barX, barY, barW * Math.max(0, oden.hp / oden.maxHp), 4);
        ctx.font = "bold 7px monospace"; ctx.textAlign = "center";
        ctx.fillStyle = "#f4e8ff"; ctx.fillText("ОДЭН " + Math.ceil(oden.hp) + "/" + oden.maxHp, cx, barY + 11);
        ctx.restore();
    }

    function drawRWBPlayer() {
        if (rwbPlayer.invulnTimer > 0 && Math.floor(rwbPlayer.invulnTimer / 4) % 2 === 0) return;
        let color = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ff2222";
        if (!drawSecretHeartTexture(ctx, rwbPlayer.x, rwbPlayer.y, rwbPlayer.size, (typeof getSecretHeartMainCardName === "function" ? getSecretHeartMainCardName() : ""), {rotation:0})) {
            drawHeartShape(rwbPlayer.x, rwbPlayer.y, rwbPlayer.size, color, color);
        }
    }
    function drawAttack(a) {
        if (a.type === "wb_combo_gate_warning") {
            ctx.save();
            var pulse = 0.38 + Math.sin(performance.now() / 65) * 0.22;
            ctx.globalAlpha = pulse; ctx.strokeStyle = "#000000"; ctx.lineWidth = 7;
            ctx.setLineDash([8, 7]);
            for (var gateOffset of [-24, 24]) {
                ctx.beginPath(); ctx.moveTo(0, a.targetY + gateOffset); ctx.lineTo(400, a.targetY + gateOffset); ctx.stroke();
            }
            ctx.setLineDash([]); ctx.globalAlpha = 0.95;
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
            for (var gateOffset2 of [-24, 24]) {
                ctx.beginPath(); ctx.moveTo(0, a.targetY + gateOffset2); ctx.lineTo(400, a.targetY + gateOffset2); ctx.stroke();
            }
            ctx.globalAlpha = 1; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 4; ctx.strokeText("КУЛАКИ ПЕРЕКРЫВАЮТ ПУТЬ — МЕНЯЙ ВЫСОТУ!", 200, a.targetY - 42);
            ctx.fillStyle = "#ffffff"; ctx.fillText("КУЛАКИ ПЕРЕКРЫВАЮТ ПУТЬ — МЕНЯЙ ВЫСОТУ!", 200, a.targetY - 42);
            ctx.restore(); return;
        }
        if (a.type === "wb_attack_telegraph") {
            ctx.save();
            let pulse = 0.36 + Math.sin(performance.now() / 75) * 0.14;
            ctx.globalAlpha = pulse; ctx.strokeStyle = a.color; ctx.fillStyle = a.color;
            ctx.shadowColor = a.color; ctx.shadowBlur = 16; ctx.lineWidth = 3;
            if (a.attackKind === "normal" && a.attackId === 1) {
                ctx.beginPath(); ctx.arc(a.originX, a.originY, 75 + Math.sin(performance.now() / 70) * 5, 0, Math.PI * 2); ctx.stroke();
            } else if (a.attackKind === "normal" && [2, 3, 7].includes(a.attackId)) {
                ctx.fillRect(0, a.targetY - 13, 400, 26);
                ctx.globalAlpha = 0.95; ctx.setLineDash([7, 7]);
                ctx.beginPath(); ctx.moveTo(0, a.targetY - 13); ctx.lineTo(400, a.targetY - 13); ctx.moveTo(0, a.targetY + 13); ctx.lineTo(400, a.targetY + 13); ctx.stroke(); ctx.setLineDash([]);
            } else if (a.attackKind === "normal" && a.attackId === 6) {
                ctx.beginPath(); ctx.arc(a.targetX, a.targetY, 23, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(a.targetX - 17, a.targetY); ctx.lineTo(a.targetX + 17, a.targetY); ctx.moveTo(a.targetX, a.targetY - 17); ctx.lineTo(a.targetX, a.targetY + 17); ctx.stroke();
            } else if ((a.attackKind === "normal" && (a.attackId === 0 || a.attackId === 5)) || (a.attackKind === "super" && a.attackId === 0)) {
                (a.columns || []).forEach(function(cx) { ctx.beginPath(); ctx.moveTo(cx, 18); ctx.lineTo(cx, 94); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, 92, 7, 0, Math.PI * 2); ctx.stroke(); });
            } else if (a.attackKind === "super" && a.attackId === 1) {
                ctx.beginPath(); ctx.arc(a.targetX, a.targetY, 58, 0, Math.PI * 2); ctx.stroke();
            } else if (a.attackKind === "super" && a.attackId === 2) {
                ctx.beginPath(); ctx.ellipse(a.targetX, 360, 43, 12, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(a.targetX, 0); ctx.lineTo(a.targetX, 450); ctx.stroke();
            } else if (a.attackKind === "super" && a.attackId === 4) {
                ctx.fillRect(0, 0, 400, 22); ctx.strokeRect(0, 0, 400, 40);
            } else if (a.attackKind === "super" && a.attackId === 3) {
                ctx.beginPath(); ctx.arc(a.targetX, a.targetY, 46, 0, Math.PI * 2); ctx.stroke();
            } else if (a.attackKind === "normal" && a.attackId === 4) {
                ctx.fillRect(0, 0, 400, 24); ctx.strokeRect(0, 0, 400, 42);
            }
            ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
            ctx.strokeStyle = "#111111"; ctx.lineWidth = 3; ctx.strokeText("⚠ " + a.title + " ⚠", 200, 120);
            ctx.fillText("⚠ " + a.title + " ⚠", 200, 120);
            ctx.font = "10px monospace"; ctx.fillStyle = "#ffe9a6"; ctx.fillText("ПОДГОТОВКА", 200, 137);
            ctx.restore(); return;
        }

        if (a.type === "wb_giant_rock_warning") {
            ctx.save();
            let pulse = 0.35 + Math.sin(performance.now() / 65) * 0.2;
            ctx.globalAlpha = pulse; ctx.strokeStyle = "#ffcc88"; ctx.fillStyle = "#ffcc88";
            ctx.shadowColor = "#ffcc88"; ctx.shadowBlur = 14; ctx.lineWidth = 3;
            ctx.setLineDash([7, 6]);
            ctx.beginPath(); ctx.moveTo(a.targetX, 10); ctx.lineTo(a.targetX, 470); ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath(); ctx.ellipse(a.targetX, 475, 40, 11, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1; ctx.fillStyle = "#ffffff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
            ctx.strokeStyle = "#111111"; ctx.lineWidth = 3; ctx.strokeText("КАМЕНЬ!", a.targetX, 450);
            ctx.fillText("КАМЕНЬ!", a.targetX, 450); ctx.restore(); return;
        }

        if (a.type === "wb_reflect_vortex") {
            // Рисуем сложную геометрию только при первом появлении; в бою используем один drawImage.
            if (!wbReflectVortexSprite) {
                try {
                    var vortexSprite = document.createElement("canvas");
                    vortexSprite.width = vortexSprite.height = 192;
                    var vortexCtx = vortexSprite.getContext("2d");
                    if (vortexCtx) {
                        // Почти белый вихрь: светлая пылевая кромка и тёмное горло без неонового свечения.
                        var vortexBody = vortexCtx.createRadialGradient(96, 96, 4, 96, 96, 86);
                        vortexBody.addColorStop(0, "rgba(0,0,0,1)");
                        vortexBody.addColorStop(0.18, "rgba(17,17,17,0.98)");
                        vortexBody.addColorStop(0.35, "rgba(70,70,70,0.94)");
                        vortexBody.addColorStop(0.62, "rgba(220,220,220,0.72)");
                        vortexBody.addColorStop(0.86, "rgba(250,250,250,0.34)");
                        vortexBody.addColorStop(1, "rgba(255,255,255,0)");
                        vortexCtx.fillStyle = vortexBody;
                        vortexCtx.beginPath();
                        vortexCtx.ellipse(96, 96, 85, 57, 0, 0, Math.PI * 2);
                        vortexCtx.fill();

                        // Узкий белый край диска и всего три потока, закрученных к центру.
                        vortexCtx.lineCap = "round";
                        vortexCtx.strokeStyle = "rgba(255,255,255,0.82)";
                        vortexCtx.lineWidth = 3;
                        vortexCtx.beginPath(); vortexCtx.ellipse(96, 96, 79, 53, -0.06, 0, Math.PI * 2); vortexCtx.stroke();
                        vortexCtx.strokeStyle = "rgba(45,45,45,0.72)";
                        vortexCtx.lineWidth = 5;
                        vortexCtx.beginPath(); vortexCtx.ellipse(96, 96, 67, 43, 0.08, 0, Math.PI * 2); vortexCtx.stroke();

                        for (var spiral = 0; spiral < 3; spiral++) {
                            vortexCtx.beginPath();
                            for (var step = 0; step <= 44; step++) {
                                var t = step / 44;
                                var angle = spiral * Math.PI * 2 / 3 + t * Math.PI * 3.2;
                                var radius = 73 - t * 53;
                                var sx = 96 + Math.cos(angle) * radius;
                                var sy = 96 + Math.sin(angle) * radius * 0.67;
                                if (step === 0) vortexCtx.moveTo(sx, sy);
                                else vortexCtx.lineTo(sx, sy);
                            }
                            vortexCtx.strokeStyle = "rgba(25,25,25,0.82)";
                            vortexCtx.lineWidth = 5;
                            vortexCtx.stroke();
                            vortexCtx.strokeStyle = "rgba(255,255,255,0.9)";
                            vortexCtx.lineWidth = 2;
                            vortexCtx.stroke();
                        }

                        // Тёмная воронка в центре с тонкой белой кромкой, без вспышек и частиц.
                        var vortexCore = vortexCtx.createRadialGradient(96, 96, 1, 96, 96, 27);
                        vortexCore.addColorStop(0, "rgba(0,0,0,1)");
                        vortexCore.addColorStop(0.68, "rgba(4,4,4,1)");
                        vortexCore.addColorStop(0.9, "rgba(35,35,35,0.98)");
                        vortexCore.addColorStop(1, "rgba(245,245,245,0.92)");
                        vortexCtx.fillStyle = vortexCore;
                        vortexCtx.beginPath(); vortexCtx.ellipse(96, 96, 26, 18, -0.04, 0, Math.PI * 2); vortexCtx.fill();
                        vortexCtx.strokeStyle = "rgba(255,255,255,0.92)";
                        vortexCtx.lineWidth = 2;
                        vortexCtx.beginPath(); vortexCtx.ellipse(96, 96, 26, 18, -0.04, 0, Math.PI * 2); vortexCtx.stroke();

                        wbReflectVortexSprite = vortexSprite;
                    }
                } catch (e) {}
            }

            var vortexNow = performance.now();
            var pulse = 1 + Math.sin(vortexNow / 390) * 0.025;
            var vortexSize = (a.radius || 62) * 2.42 * pulse;
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation || 0);
            if (wbReflectVortexSprite) {
                ctx.globalAlpha = 0.96;
                ctx.drawImage(wbReflectVortexSprite, -vortexSize / 2, -vortexSize / 2, vortexSize, vortexSize);
            } else {
                // Самый лёгкий запасной вариант: никаких размытия и циклов частиц.
                ctx.globalAlpha = 0.9;
                ctx.strokeStyle = "#f2f2f2";
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.ellipse(0, 0, a.radius * pulse, a.radius * 0.72 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(0, 0, a.radius * 0.45, a.radius * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = "#080310";
                ctx.beginPath(); ctx.ellipse(0, 0, a.radius * 0.2, a.radius * 0.15, 0, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.restore(); return;
        }

        if (a.type === "wb_reflected_bullet") {
            ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(a.vy, a.vx));
            ctx.shadowColor = "#a66bff"; ctx.shadowBlur = 12; ctx.fillStyle = "#d8baff";
            ctx.beginPath(); ctx.ellipse(0, 0, a.size * 1.6, a.size * 0.65, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); return;
        }

        if (a.type === "wb_center_wave") {
            ctx.save();
            ctx.strokeStyle = "#9beaff"; ctx.shadowColor = "#9beaff"; ctx.shadowBlur = 18;
            if (a.state === "warning") {
                let alpha = 0.35 + Math.sin(performance.now() / 90) * 0.2;
                ctx.globalAlpha = alpha; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.moveTo(0, 480); ctx.lineTo(400, 480); ctx.stroke();
                ctx.globalAlpha = 1; ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
                ctx.fillText("ВОЛНА ПРИТЯЖЕНИЯ", 200, 460);
            } else {
                ctx.lineWidth = 15; ctx.globalAlpha = 0.48;
                ctx.beginPath(); ctx.moveTo(0, a.y); ctx.lineTo(400, a.y); ctx.stroke();
                ctx.globalAlpha = 1; ctx.lineWidth = 4;
                for (let j = -1; j <= 1; j++) {
                    ctx.beginPath(); ctx.moveTo(0, a.y + j * 9 + Math.sin(performance.now() / 50) * 3); ctx.lineTo(400, a.y + j * 9); ctx.stroke();
                }
                ctx.fillStyle = "#ffffff"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText("ЦЕНТР", 200, a.y - 10);
            }
            ctx.restore(); return;
        }

        if (a.type === "wb_fruit_punch") {
            ctx.save();
            if (a.state === "warning") {
                let pulse = 0.45 + Math.sin(performance.now() / 65) * 0.18;
                ctx.globalAlpha = pulse; ctx.strokeStyle = "#000000"; ctx.lineWidth = a.width + 18;
                ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = a.width + 8;
                ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke();
                ctx.globalAlpha = 1; ctx.strokeStyle = "#000000"; ctx.lineWidth = 7;
                ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke();
                ctx.strokeStyle = "#dff8ff"; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = "#ffffff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 4; ctx.strokeText("УДАР ФРУКТОМ!", a.targetX, a.targetY - 18);
                ctx.fillText("УДАР ФРУКТОМ!", a.targetX, a.targetY - 18);
            } else {
                ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 24; ctx.strokeStyle = "#000000"; ctx.lineWidth = a.width + 22;
                ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = a.width + 12;
                ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke();
                ctx.strokeStyle = "#dff8ff"; ctx.lineWidth = a.width * 0.65;
                ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke();
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(a.originX, a.originY); ctx.lineTo(a.endX, a.endY); ctx.stroke();
            }
            ctx.restore(); return;
        }

        if (a.type === "wb_crescent_slash") {
            ctx.save();
            var now = performance.now();
            var band = a.width || 92;
            if (a.state === "windup") {
                var chargePulse = 0.45 + Math.sin(now / 70) * 0.28;
                // Контур зоны и указатель целевой линии.
                ctx.globalAlpha = 0.14 + chargePulse * 0.13;
                ctx.fillStyle = "#ffffff";
                var lowY = Math.min(a.startY, a.targetY), highY = Math.max(a.startY, a.targetY);
                ctx.fillRect(0, lowY, 400, Math.max(2, highY - lowY));
                ctx.globalAlpha = 0.72;
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 7; ctx.setLineDash([9, 8]);
                ctx.beginPath(); ctx.moveTo(0, a.targetY); ctx.lineTo(400, a.targetY); ctx.stroke();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(0, a.targetY); ctx.lineTo(400, a.targetY); ctx.stroke();
                ctx.setLineDash([]);
                // Заряжающаяся энергия над Белоусом.
                ctx.globalAlpha = 0.55 + chargePulse * 0.35;
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 8; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 22;
                ctx.beginPath(); ctx.ellipse(a.originX, a.originY, 22 + chargePulse * 14, 20 + chargePulse * 10, now / 800, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.ellipse(a.originX, a.originY, 22 + chargePulse * 14, 20 + chargePulse * 10, -now / 600, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 1; ctx.shadowBlur = 0;
                ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 4;
                ctx.strokeText("БЕЛОУС ЗАРЯЖАЕТ РАЗРУБ ХАКИ", 200, Math.max(24, a.originY - 44));
                ctx.fillStyle = "#ffffff"; ctx.fillText("БЕЛОУС ЗАРЯЖАЕТ РАЗРУБ ХАКИ", 200, Math.max(24, a.originY - 44));
                ctx.font = "bold 10px monospace";
                ctx.strokeText("УЙДИ С ЛИНИИ УДАРА", 200, a.targetY - 18);
                ctx.fillStyle = "#ffeefc"; ctx.fillText("УЙДИ С ЛИНИИ УДАРА", 200, a.targetY - 18);
            } else if (a.state === "flying") {
                var pulse = 0.78 + Math.sin(now / 42) * 0.15;
                ctx.globalAlpha = 0.22 * pulse; ctx.fillStyle = "#dff8ff";
                ctx.fillRect(0, a.y - band * 0.78, 400, band * 1.56);
                // Широкий горизонтальный разрез: чёрный контур, белое хаки внутри.
                ctx.globalAlpha = 0.92;
                ctx.fillStyle = "#000000"; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 26;
                ctx.fillRect(0, a.y - band * 0.48, 400, band * 0.96);
                ctx.globalAlpha = 0.95; ctx.fillStyle = "#f8fdff";
                ctx.fillRect(0, a.y - band * 0.23, 400, band * 0.46);
                ctx.globalAlpha = 1; ctx.shadowBlur = 0;
                // Неровное лезвие по всей ширине арены, но без вращения.
                ctx.beginPath();
                for (var xx = 0; xx <= 400; xx += 10) {
                    var yy = a.y + Math.sin(xx * 0.045 + now / 90) * 7 + Math.sin(xx * 0.11 - now / 120) * 3;
                    if (xx === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
                }
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 18; ctx.stroke();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 7; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 22; ctx.stroke();
                ctx.strokeStyle = "#bcefff"; ctx.lineWidth = 2; ctx.stroke();
                // Короткие чёрно-белые вспышки хаки на лезвии.
                ctx.shadowBlur = 0;
                for (var streak = 0; streak < 11; streak++) {
                    var sx = (streak * 53 + now * 0.18) % 400;
                    var sy = a.y + Math.sin(sx * 0.06 + now / 80) * 9;
                    ctx.strokeStyle = "#000000"; ctx.lineWidth = 5;
                    ctx.beginPath(); ctx.moveTo(sx - 8, sy - 18); ctx.lineTo(sx + 2, sy - 4); ctx.lineTo(sx - 5, sy + 12); ctx.stroke();
                    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.7;
                    ctx.beginPath(); ctx.moveTo(sx - 8, sy - 18); ctx.lineTo(sx + 2, sy - 4); ctx.lineTo(sx - 5, sy + 12); ctx.stroke();
                }
                ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 4; ctx.strokeText("РАЗРУБ ХАКИ — 40 УРОНА", 200, a.y - band * 0.55 - 8);
                ctx.fillStyle = "#ffffff"; ctx.fillText("РАЗРУБ ХАКИ — 40 УРОНА", 200, a.y - band * 0.55 - 8);
                drawHpBar(130, Math.max(5, Math.min(480, a.y - band * 0.55 + 2)), 140, 7, a.hp, a.maxHp || 10, "#88ddff", "СЛЭШ " + a.hp + "/10", false);
            }
            ctx.restore(); return;
        }

        if (a.type === "giant_rock") { drawGiantRock(a); return; }
        if (a.type === "tsunami") { drawTsunami(a); return; }
        if (a.type === "rock") { drawRock(a); return; }

        if (a.type === "roger_slash") {
            ctx.save();
            let isHorizontal = (a.direction === "horizontal");
            if (a.state === "warning") {
                let pulseAlpha = 0.4 + Math.sin(performance.now() / 100) * 0.2;
                ctx.globalAlpha = pulseAlpha; ctx.fillStyle = a.color || "#ff4400";
                if (isHorizontal) {
                    ctx.fillRect(0, a.y - a.width / 2, 400, a.width);
                    ctx.globalAlpha = 1; ctx.strokeStyle = "#000000"; ctx.lineWidth = 2.5;
                    ctx.setLineDash([12, 8]);
                    ctx.beginPath(); ctx.moveTo(0, a.y - a.width / 2); ctx.lineTo(400, a.y - a.width / 2);
                    ctx.moveTo(0, a.y + a.width / 2); ctx.lineTo(400, a.y + a.width / 2); ctx.stroke();
                    ctx.setLineDash([]); ctx.fillStyle = "#000";
                    ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillText("⚠️", 200, a.y + 4);
                } else {
                    ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
                    ctx.globalAlpha = 1; ctx.strokeStyle = "#000000"; ctx.lineWidth = 2.5;
                    ctx.setLineDash([12, 8]);
                    ctx.beginPath(); ctx.moveTo(a.x - a.width / 2, 0); ctx.lineTo(a.x - a.width / 2, 500);
                    ctx.moveTo(a.x + a.width / 2, 0); ctx.lineTo(a.x + a.width / 2, 500); ctx.stroke();
                    ctx.setLineDash([]); ctx.fillStyle = "#000";
                    ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillText("⚠️", a.x, 250);
                }
            } else if (a.state === "active") {
                let fade = Math.min(1, a.activeTimer / 10);
                ctx.globalAlpha = fade;
                if (isHorizontal) {
                    ctx.fillStyle = a.color || "#ff2200";
                    ctx.fillRect(0, a.y - a.width / 2, 400, a.width);
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(0, a.y - a.width * 0.15, 400, a.width * 0.3);
                } else {
                    ctx.fillStyle = a.color || "#ff2200";
                    ctx.fillRect(a.x - a.width / 2, 0, a.width, 500);
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(a.x - a.width * 0.15, 0, a.width * 0.3, 500);
                }
            }
            ctx.restore(); return;
        }

        if (a.type === "roger_cross") {
            ctx.save();
            let angle = 0;
            if (a.dir === "vertical") angle = 0;
            else if (a.dir === "horizontal") angle = Math.PI / 2;
            ctx.translate(a.x, a.y); ctx.rotate(angle);
            if (a.state === "warning") {
                let pulseAlpha = 0.4 + Math.sin(performance.now() / 100) * 0.2;
                ctx.globalAlpha = pulseAlpha; ctx.fillStyle = "#ff6600";
                ctx.fillRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.globalAlpha = 1; ctx.strokeStyle = "#000000"; ctx.lineWidth = 2.5;
                ctx.setLineDash([12, 8]);
                ctx.strokeRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.setLineDash([]);
            } else if (a.state === "active") {
                let fade = Math.min(1, a.activeTimer / 8);
                ctx.globalAlpha = fade;
                ctx.fillStyle = "#ff4400";
                ctx.fillRect(-a.width / 2, -a.length / 2, a.width, a.length);
                ctx.fillStyle = "#000000";
                ctx.fillRect(-a.width * 0.15, -a.length / 2, a.width * 0.3, a.length);
            }
            ctx.restore(); return;
        }

        if (a.type === "hell_fire") {
            ctx.save();
            if (a.state === "flying") {
                ctx.fillStyle = "#ff3300"; ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = "#ffcc00"; ctx.beginPath(); ctx.arc(a.x, a.y, a.size * 0.6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#000000";
                ctx.beginPath(); ctx.arc(a.x, a.y, a.size * 0.3, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "rgba(255, 50, 50, 0.7)"; ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(a.targetX, a.targetY, 30, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
            } else if (a.state === "exploding") {
                let p = 1 - a.explosionTimer / 50; let r = 70 * p;
                ctx.globalAlpha = 1 - p;
                ctx.fillStyle = "#ff4400"; ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 3; ctx.stroke();
            }
            ctx.restore(); return;
        }

        if (a.type === "fire_piece") {
            ctx.save();
            ctx.fillStyle = "#ff4400"; ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore(); return;
        }

        if (a.type === "gura_crack") {
            ctx.save();
            if (a.state === "warning") {
                let pulseAlpha = 0.5 + Math.sin(performance.now() / 80) * 0.3;
                ctx.globalAlpha = pulseAlpha; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(a.x, a.y, a.maxRadius, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(a.x, a.y, a.maxRadius * 0.5, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 1; ctx.fillStyle = "#ffffff";
                ctx.font = "bold 14px monospace"; ctx.textAlign = "center"; ctx.fillText("💥", a.x, a.y + 5);
            } else if (a.state === "active") {
                let fade = a.activeTimer / a.maxActive; ctx.globalAlpha = fade;
                ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#aaddff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore(); return;
        }

        if (a.type === "titan_fist") {
            ctx.save(); ctx.translate(a.x, a.y);
            if (a.state === "falling") {
                ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = "#000000";
                ctx.beginPath(); ctx.ellipse(0, 400 - a.y, a.size * 1.1, 18, 0, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                ctx.fillStyle = "#8B7355"; ctx.beginPath(); ctx.arc(0, 0, a.size, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 4; ctx.stroke();
                ctx.fillStyle = "#a89070";
                for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * a.size * 0.3, -a.size * 0.3, a.size * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 2; ctx.stroke(); }
            } else if (a.state === "impact") {
                let p = 1 - a.impactTimer / 30; let r = a.size * 1.2 + 50 * p;
                ctx.globalAlpha = 1 - p; ctx.fillStyle = "#ff4400";
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#000000"; ctx.lineWidth = 3; ctx.stroke();
            }
            ctx.restore(); return;
        }

        if (a.type === "haki_wave") {
            ctx.save(); ctx.translate(a.x, a.y);
            ctx.fillStyle = "#dff8ff"; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 16;
            ctx.beginPath(); ctx.ellipse(0, 0, a.size * 1.3, a.size * 0.8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.ellipse(0, 0, a.size, a.size * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#aeeeff";
            ctx.beginPath(); ctx.ellipse(0, 0, a.size * 0.5, a.size * 0.3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore(); return;
        }

        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rotation || 0);
        if (a.type === "blade" || a.type === "big_blade") {
            ctx.fillStyle = "#000000";
            ctx.beginPath(); ctx.moveTo(0, -a.size - 3); ctx.lineTo(a.size * 0.4 + 2, 0); ctx.lineTo(0, a.size + 3); ctx.lineTo(-a.size * 0.4 - 2, 0); ctx.closePath(); ctx.fill();
            ctx.fillStyle = a.color;
            ctx.beginPath(); ctx.moveTo(0, -a.size); ctx.lineTo(a.size * 0.4, 0); ctx.lineTo(0, a.size); ctx.lineTo(-a.size * 0.4, 0); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "#000000";
            ctx.beginPath(); ctx.moveTo(0, -a.size * 0.6); ctx.lineTo(a.size * 0.15, 0); ctx.lineTo(0, a.size * 0.6); ctx.lineTo(-a.size * 0.15, 0); ctx.closePath(); ctx.fill();
        } else if (a.type === "fist") {
            let isWhitebeardFist = (a.color === "#ffffff" || a.owner === "whitebeard");
            ctx.fillStyle = isWhitebeardFist ? "#ffffff" : "#000000"; ctx.beginPath(); ctx.arc(0, 0, a.size + 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = isWhitebeardFist ? "#ffffff" : a.color; ctx.beginPath(); ctx.arc(0, 0, a.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = isWhitebeardFist ? "#eaf9ff" : "#000000";
            ctx.beginPath(); ctx.arc(0, 0, a.size * 0.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    function drawRock(a) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rotation || 0);
        let s = a.size, seed = a.textureSeed || 0;
        let points = []; let sides = 6;
        for (let i = 0; i < sides; i++) {
            let ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
            let noise = Math.sin(seed + i * 1.7) * 0.15;
            let r = s * (1 + noise);
            points.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
        }
        let grad = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s * 1.2);
        grad.addColorStop(0, "#a89070"); grad.addColorStop(0.6, "#8B7355"); grad.addColorStop(1, "#3a2818");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.strokeStyle = "rgba(30, 20, 10, 0.7)"; ctx.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) {
            let ang1 = (seed + i * 1.3) % (Math.PI * 2); let ang2 = ang1 + 1.2;
            ctx.beginPath(); ctx.moveTo(Math.cos(ang1) * s * 0.3, Math.sin(ang1) * s * 0.3);
            ctx.lineTo(Math.cos(ang2) * s * 0.8, Math.sin(ang2) * s * 0.8); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.35, s * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawGiantRock(a) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rotation || 0);
        let s = a.size, seed = a.textureSeed || 0;
        let points = []; let sides = 8;
        for (let i = 0; i < sides; i++) {
            let ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
            let noise = Math.sin(seed + i * 1.7) * 0.12;
            let r = s * (1 + noise);
            points.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
        }
        ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.ellipse(0, 480 - a.y, s * 0.9, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        let grad = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s * 1.3);
        grad.addColorStop(0, "#b8a080"); grad.addColorStop(0.5, "#8B7355"); grad.addColorStop(1, "#2a1808");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = "rgba(30, 20, 10, 0.8)"; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            let ang1 = (seed + i * 1.3) % (Math.PI * 2); let ang2 = ang1 + 1.2;
            ctx.beginPath(); ctx.moveTo(Math.cos(ang1) * s * 0.2, Math.sin(ang1) * s * 0.2);
            ctx.lineTo(Math.cos(ang2) * s * 0.8, Math.sin(ang2) * s * 0.8); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.35, s * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.5, s * 0.08, 0, Math.PI * 2); ctx.fill();
        if (a.hp !== undefined && a.hp < a.maxHp) {
            let barW = s * 1.6, barH = 8;
            let barX = -barW / 2, barY = -s - 25;
            ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
            ctx.fillStyle = "#333"; ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = "#e74c3c"; ctx.fillRect(barX, barY, barW * (a.hp / a.maxHp), barH);
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
            ctx.fillStyle = "#ffffff"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
            ctx.fillText(a.hp + "/" + a.maxHp, 0, barY + barH - 2);
        }
        ctx.restore();
    }

    function drawTsunami(a) {
        ctx.save();
        let cy = a.y, w = a.currentWidth || a.width, h = a.currentHeight || a.height;
        let waveTime = a.waveTime, fromRight = a.fromRight;
        if (a.y > 0 && a.y < 500) {
            ctx.save();
            ctx.globalAlpha = 0.15 + Math.sin(performance.now() / 200) * 0.08;
            ctx.fillStyle = "#00ff00";
            if (fromRight) ctx.fillRect(0, cy - h / 2, a.x, h);
            else ctx.fillRect(a.width, cy - h / 2, 400 - a.width, h);
            ctx.restore();
        }
        let grad = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
        if (fromRight) { grad.addColorStop(0, "#003366"); grad.addColorStop(0.3, "#0088dd"); grad.addColorStop(0.7, "#00ccff"); grad.addColorStop(1, "#003366"); }
        else { grad.addColorStop(0, "#003366"); grad.addColorStop(0.3, "#00aaff"); grad.addColorStop(0.7, "#00ddff"); grad.addColorStop(1, "#003366"); }
        ctx.fillStyle = grad;
        ctx.beginPath();
        if (fromRight) {
            ctx.moveTo(a.x, cy - h / 2);
            for (let i = 0; i <= 20; i++) { let t = i / 20; let x = a.x + t * w; let yTop = cy - h / 2 + Math.sin(t * Math.PI * 3 + waveTime * 2) * 10; ctx.lineTo(x, yTop); }
            for (let i = 20; i >= 0; i--) { let t = i / 20; let x = a.x + t * w; let yBot = cy + h / 2 + Math.sin(t * Math.PI * 3 + waveTime * 2) * 10; ctx.lineTo(x, yBot); }
        } else {
            ctx.moveTo(0, cy - h / 2);
            for (let i = 0; i <= 20; i++) { let t = i / 20; let x = t * w; let yTop = cy - h / 2 + Math.sin(t * Math.PI * 3 + waveTime * 2) * 10; ctx.lineTo(x, yTop); }
            for (let i = 20; i >= 0; i--) { let t = i / 20; let x = t * w; let yBot = cy + h / 2 + Math.sin(t * Math.PI * 3 + waveTime * 2) * 10; ctx.lineTo(x, yBot); }
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#001a33"; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i <= 20; i++) { let t = i / 20; let x = fromRight ? a.x + t * w : t * w; let yTop = cy - h / 2 + Math.sin(t * Math.PI * 3 + waveTime * 2) * 10; ctx.beginPath(); ctx.arc(x, yTop, 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; ctx.lineWidth = 2;
        for (let li = 0; li < 3; li++) {
            let lineOffset = -h * 0.2 + li * h * 0.2;
            ctx.beginPath();
            for (let i = 0; i <= 20; i++) { let t = i / 20; let x = fromRight ? a.x + t * w : t * w; let y = cy + lineOffset + Math.sin(t * Math.PI * 4 + waveTime * 2 + li) * 4; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
            ctx.stroke();
        }
        ctx.restore();
    }

    window.getRWBActive = function() { return window.rwbActive === true; };
    // SUPER-контекст не должен читать локальную let-переменную через window.
    // Экспортируем реальные ссылки на текущего босса/игрока.
    window.getRWBActiveBoss = function() { return rwbActiveBoss; };
    window.getRWBTargets = function() { return [roger,whitebeard].filter(function(b){return !!b;}); };
    window.rwbApplySuperDamage = function(amount, source) {
        var target=rwbActiveBoss;
        if(!window.rwbActive || !target || rwbState!=="fight2" || !(Number(target.hp)>0)) return 0;
        var dealt=Math.min(Number(target.hp),Math.max(1,Math.floor(Number(amount)||1)));
        target.hp=Math.max(0,target.hp-dealt);
        target.hitFlash=12;
        if(target.id==="whitebeard")target.damageFlashTimer=12;
        rwbScreenFlash=Math.max(rwbScreenFlash,4);rwbScreenFlashColor="#ffffff";
        rwbShake=Math.max(rwbShake,8);
        rwbFloatingTexts.push({x:target.x,y:target.y-35,text:(source||"SUPER")+" −"+dealt,color:"#fff0a0",life:55,maxLife:55,vy:-.6,vx:0,size:14});
        spawnHitParticles(target.x,target.y,"#fff0a0",12);
        if(target.hp<=0) rwbVictory();
        return dealt;
    };
    window.rwbApplyDioSkillDamage = function(bossId,amount) {
        let target=(rwbActiveBoss&&rwbActiveBoss.id===bossId)?rwbActiveBoss:[roger,whitebeard].find(function(b){return b&&b.id===bossId;});
        if(!target)return false;
        target.hp=Math.max(0,target.hp-Math.max(1,Math.floor(Number(amount)||1)));target.hitFlash=10;
        if(target.id==="whitebeard")target.damageFlashTimer=10;
        rwbShockwaves.push({x:target.x,y:target.y,radius:10,maxRadius:100,speed:9,color:"#fff0a0",damage:0,hit:true,life:18,maxLife:18,width:4});
        rwbFloatingTexts.push({x:target.x,y:target.y-35,text:"DIO −"+Math.max(1,Math.floor(Number(amount)||1)),color:"#fff0a0",life:55,maxLife:55,vy:-.6,vx:0,size:14});
        return true;
    };
    window.MBRWBCompanionTargetPosition = function() {
        var targets=[roger,whitebeard].filter(function(b){return b&&Number(b.hp)>0;});
        if(rwbState==="fight2"&&rwbActiveBoss&&Number(rwbActiveBoss.hp)>0) {
            return {x:rwbActiveBoss.x,y:rwbActiveBoss.y,id:rwbActiveBoss.id};
        }
        if(rwbPlayerFocusTargetId) {
            var focused=targets.find(function(b){return b.id===rwbPlayerFocusTargetId;});
            if(focused)return {x:focused.x,y:focused.y,id:focused.id};
        }
        if(!targets.length)return null;
        var px=rwbPlayer?Number(rwbPlayer.x)||200:200,py=rwbPlayer?Number(rwbPlayer.y)||400:400;
        targets.sort(function(a,b){return Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py);});
        return {x:targets[0].x,y:targets[0].y,id:targets[0].id};
    };
    window.MBRWBCompanionDamageBoss = function(amount,bossId) {
        var target=(rwbState==="fight2"&&rwbActiveBoss)?rwbActiveBoss:[roger,whitebeard].find(function(b){return b&&b.id===bossId&&Number(b.hp)>0;});
        if(!target||!(Number(target.hp)>0))return false;
        return window.rwbApplyDioSkillDamage(target.id,amount);
    };
    window.getRWBState  = function() { return rwbState; };
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
    window.rwbAddShake = function(v) { rwbShake = Math.max(rwbShake, v); };
    window.rwbAddFlash = function(v, color) { rwbScreenFlash = v; if (color) rwbScreenFlashColor = color; };
    window.rwbAddFlashWhite = function(v) { rwbScreenFlash = Math.max(rwbScreenFlash, v); rwbScreenFlashColor = "#ffffff"; };
    window.rwbAddShockwave = function(x, y, color, speed, life, width) {
        rwbShockwaves.push({ x: x, y: y, radius: 10, maxRadius: 200, speed: speed, color: color, life: life, maxLife: life, width: width || 4 });
    };
    window.getRWBBaseSpeed = function() { return rwbBaseSpeed; };
    window.setRWBBaseSpeed = function(v) { rwbBaseSpeed = v; };
    window.getRWBSpeedMult = function() { return rwbSpeedMult; };
    window.setRWBSpeedMult = function(v) { rwbSpeedMult = v; };

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║  🏴‍☠️ ROGER vs WHITEBEARD v23.0                             ║");
    console.log("║  ✅ garouTimeStop останавливает ВСЕ атаки                  ║");
    console.log("║  ✅ Поглощение урона работает                              ║");
    console.log("║  ✅ Увеличение урона применяется к пулям                   ║");
    console.log("║  ✅ Анти-спираль реально замедляет игрока                  ║");
    console.log("║  ✅ rwbSpeedMult — глобальный множитель                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

})();
