// ============================================================
// РОДЖЕР vs БЕЛОУС — БОСС 1000 ВОЛНЫ v19.0
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
    const RWB_SUPER_WB_HP = 1560;
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
        whitebeardHp: 900,
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

    var RWB_WHITEBEARD_DIALOG_INITIAL = [
        { speaker: "❄️ БЕЛОУС", text: "Я настолько слабак, что меня победил какой-то чел, который любит играть в какие-то игры..." }
    ];

    var RWB_WB_CHOICES = [
        { id: 0, text: "Проблемы с навыками. Играть не умеешь" },
        { id: 1, text: "Вступи в мою команду и стань сильнее" },
        { id: 2, text: "КАКОЙ СЛАБАК!!???? Я МИЛЛИАРД РАЗ СДОХ ИЗ ЗА ВАС" }
    ];

    var RWB_WB_RESPONSE_1 = [
        { speaker: "❄️ БЕЛОУС", text: "Может ты и прав... Но откуда мне знать кто ты? А вдруг ты читер?" }
    ];
    var RWB_WB_RESPONSE_2 = [
        { speaker: "❄️ БЕЛОУС", text: "Хорошо, надеюсь это правда" }
    ];
    var RWB_WB_RESPONSE_3_A = [
        { speaker: "❄️ БЕЛОУС", text: "Ты о чем?" }
    ];
    var RWB_WB_RESPONSE_3_B = [
        { speaker: "👤 ИГРОК", text: "Временная шкатулка... Она наполняется прогрессом и можно путешествовать по времени. Это как снимать фильм" }
    ];

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
    let rwbPurpleCracks = [];

    let rwbKeys = {};
    let rwbTouchActive = false;
    let rwbTouchId = null;
    let rwbTouchX = 0;
    let rwbTouchY = 0;

    let rwbModeBtn = null;
    let rwbSuperBtn = null;

    let rwbTsunamiActive = false;

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
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(rotation);
        ctx.save();
        let heartSize = size * 1.0;
        ctx.fillStyle = flash ? "#ffffff" : "#ffffff";
        ctx.shadowColor = "#88ddff"; ctx.shadowBlur = flash ? 30 : 15;
        ctx.beginPath();
        ctx.moveTo(0, heartSize * 0.7);
        ctx.bezierCurveTo(-heartSize * 1.4, -heartSize * 0.2, -heartSize * 0.7, -heartSize * 1.1, 0, -heartSize * 0.4);
        ctx.bezierCurveTo(heartSize * 0.7, -heartSize * 1.1, heartSize * 1.4, -heartSize * 0.2, 0, heartSize * 0.7);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#1a3a6a"; ctx.lineWidth = 2.5; ctx.stroke();
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

    function handleWhitebeardDialogClick(ev) {
        if (rwbDialogQueue.length > 0) {
            rwbDialogQueue.shift(); playWhooshSound(0.1);
            if (rwbDialogQueue.length === 0) {
                if (rwbWBPhase === "choice_response_1") { rwbWhitebeardDisabled[0] = true; rwbWBPhase = "choice"; }
                else if (rwbWBPhase === "choice_response_2") { rwbDialogActive = false; rwbFinalCleanup(); }
                else if (rwbWBPhase === "choice_response_3_a") { rwbWBPhase = "choice_response_3_b"; rwbDialogQueue = RWB_WB_RESPONSE_3_B.slice(); }
                else if (rwbWBPhase === "choice_response_3_b") { rwbWBPhase = "choice"; }
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

    // ============================================================
    // СТАРТ БОЯ
    // ============================================================
    function startRogerWhitebeardFight() {
        if (window.rwbActive) return;
        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(1000)) {
            if (typeof showFloatingText === 'function') showFloatingText("⏭️ Босс уже побеждён!", "#ffaa00");
            return;
        }
        console.log("[ROGER-WB] Старт боя v19.0!");

        window.rwbActive = true;
        rwbState = "intro"; rwbTimer = 0; rwbIntroTimer = 0;
        rwbTransitionTimer = 0; rwbEndTimer = 0; rwbSurvivalTimer2 = 0;
        rwbTitanFistTimer = 0; rwbTitanRockTimer = 0;
        rwbSuperReady = true; rwbSuperCooldown = 0; rwbMeleeCooldown = 0;
        rwbActiveBoss = null; rwbHakiAura = 0; rwbTsunamiActive = false;
        rwbWinner = null; rwbRewardGiven = false; rwbDialogStage = 0;
        rwbWhitebeardDisabled = [false, false, false]; rwbWBPhase = "intro";
        rwbDialogQueue = []; rwbDialogActive = false; rwbDialogType = null; rwbDialogTimer = 0;
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
            attackTimer: 40, hitFlash: 0, meleeTimer: 0,
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

        rwbAttacks = []; rwbPlayerBullets = []; rwbParticles = []; rwbShockwaves = [];
        rwbFloatingTexts = []; rwbSpeedLines = []; rwbHakiLightnings = [];
        rwbWhiteCracks = []; rwbPurpleCracks = []; rwbScreenFlash = 0; rwbShake = 0; rwbBgStars = [];

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
        if (islandBg) {
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
        if (islandBg) {
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
        if (islandBg) {
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

    function createRWBModeButton() {
        if (rwbModeBtn) return;
        rwbModeBtn = document.createElement('button');
        rwbModeBtn.id = 'rwbModeBtn';
        rwbModeBtn.style.cssText = [
            'position: fixed', 'bottom: 70px', 'left: 50%', 'transform: translateX(-50%)',
            'padding: 10px 22px', 'border-radius: 30px',
            'background: linear-gradient(135deg, #ffdd00, #ff8800)',
            'color: #1a1a2e', 'font-weight: 900', 'font-size: 14px',
            'font-family: "Nunito", sans-serif', 'border: 3px solid #fff',
            'box-shadow: 0 4px 15px rgba(255, 136, 0, 0.6)',
            'cursor: pointer', 'z-index: 99999', 'letter-spacing: 0.5px',
            'user-select: none', 'touch-action: manipulation', 'transition: all 0.2s'
        ].join(';');
        rwbModeBtn.innerHTML = '🟡 ОБЫЧНЫЙ';
        rwbModeBtn.onclick = function(e) {
            e.preventDefault(); e.stopPropagation();
            rwbPlayer.attackMode = (rwbPlayer.attackMode === "normal") ? "blue" : "normal";
            if (rwbPlayer.attackMode === "blue") {
                rwbModeBtn.innerHTML = '🔵 АВТО-ПРИЦЕЛ';
                rwbModeBtn.style.background = 'linear-gradient(135deg, #00aaff, #0044cc)';
                rwbModeBtn.style.color = '#fff';
                rwbModeBtn.style.boxShadow = '0 4px 15px rgba(0, 170, 255, 0.7)';
            } else {
                rwbModeBtn.innerHTML = '🟡 ОБЫЧНЫЙ';
                rwbModeBtn.style.background = 'linear-gradient(135deg, #ffdd00, #ff8800)';
                rwbModeBtn.style.color = '#1a1a2e';
                rwbModeBtn.style.boxShadow = '0 4px 15px rgba(255, 136, 0, 0.6)';
            }
            playWhooshSound(0.15);
        };
        document.body.appendChild(rwbModeBtn);
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

    function showRWBSuperButton() { if (rwbSuperBtn) rwbSuperBtn.style.display = 'block'; }
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

    function handleRWBKeyDown(ev) { if (!window.rwbActive) return; rwbKeys[ev.key.toLowerCase()] = true; }
    function handleRWBKeyUp(ev) { if (!window.rwbActive) return; rwbKeys[ev.key.toLowerCase()] = false; }

    function handleRWBTouchStart(ev) {
        if (!window.rwbActive) return;
        if (rwbDialogActive) {
            ev.preventDefault();
            if (ev.touches.length > 0) {
                var fakeEvent = { clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY };
                if (rwbDialogType === "roger") handleRogersDialogClick();
                else if (rwbDialogType === "whitebeard") handleWhitebeardDialogClick(fakeEvent);
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
        if (rwbDialogActive && rwbDialogType === "roger") { handleRogersDialogClick(); return; }
        if (rwbDialogActive && rwbDialogType === "whitebeard") { handleWhitebeardDialogClick(ev); return; }
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
        if (typeof _superState !== 'undefined') {
            if (_superState.garouTimeStop) return;
            if (_superState.usoppStunTimer > 0) return;
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

        if (rwbPlayer.attackTimer <= 0) {
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
            if (a.type === "tsunami" || a.type === "titan_fist" || a.type === "gura_crack" || a.type === "purple_crack_zone" || a.type === "haki_wave") continue;
            let ax = a.x + (a.size || a.radius || 20) / 2;
            let ay = a.y + (a.size || a.radius || 20) / 2;
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
        if (!roger || !whitebeard) return;
        duel.timer++;
        if (duel.phase === "idle") {
            roger.x += (roger.homeX - roger.x) * 0.04; roger.y += (roger.homeY - roger.y) * 0.04;
            whitebeard.x += (whitebeard.homeX - whitebeard.x) * 0.04; whitebeard.y += (whitebeard.homeY - whitebeard.y) * 0.04;
            if (duel.timer > 30) { duel.phase = "approach"; duel.timer = 0; duel.clashX = 100 + Math.random() * 200; duel.clashY = 150 + Math.random() * 150; playWhooshSound(0.2); }
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

        if (Math.random() < 0.08) spawnHakiLightning(roger.x + (Math.random() - 0.5) * 40, roger.y + (Math.random() - 0.5) * 40, 1, false);
        if (Math.random() < 0.08) spawnHakiLightning(whitebeard.x + (Math.random() - 0.5) * 40, whitebeard.y + (Math.random() - 0.5) * 40, 1, false);

        roger.attackTimer--;
        if (roger.attackTimer <= 0) { roger.attackTimer = RWB_ATTACK_SPEED + Math.random() * 20; spawnRogerAttack(); }
        whitebeard.attackTimer--;
        if (whitebeard.attackTimer <= 0) { whitebeard.attackTimer = RWB_ATTACK_SPEED + Math.random() * 25; spawnWhitebeardAttack(); }

        if (roger.hp <= 0) { roger.hp = 0; triggerSuper(whitebeard, roger); }
        else if (whitebeard.hp <= 0) { whitebeard.hp = 0; triggerSuper(roger, whitebeard); }
    }

    function checkMeleeContact() {
        if (rwbState !== "fight2") return;
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
            hitPlayer(RWB_MELEE_DAMAGE);
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
        roger.hitFlash = 10; whitebeard.hitFlash = 10;
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
                        if (!window.rwbActive) return;
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
    function spawnTsunamiAttack(isSuper) {
        let tsunamiDamage = Math.ceil(26 * BALANCE.whitebeardDamageMult);
        if (rwbTsunamiActive) return;
        rwbTsunamiActive = true;
        playWhooshSound(0.5); playBossRoarSound(0.3); rwbShake = 25;
        rwbFloatingTexts.push({ x: 200, y: 100, text: "🌊 ЦУНАМИ! 🌊", color: "#00ccff", life: 90, maxLife: 90, vy: -0.3, vx: 0, size: 24 });
        let wave1 = { type: "tsunami", fromRight: true, x: 130, y: -60, vy: 4.5, width: 270, height: 55, currentWidth: 270, currentHeight: 55, damage: tsunamiDamage, life: 400, waveTime: 0, hit: false, color: "#0099ff" };
        rwbAttacks.push(wave1);
        setTimeout(function() {
            if (!window.rwbActive) return;
            let wave2 = { type: "tsunami", fromRight: false, x: 0, y: -60, vy: 4.5, width: 270, height: 55, currentWidth: 270, currentHeight: 55, damage: tsunamiDamage, life: 400, waveTime: 0, hit: false, color: "#00aaff" };
            rwbAttacks.push(wave2);
            playWhooshSound(0.5); rwbShake = 20;
            rwbFloatingTexts.push({ x: 200, y: 100, text: "🌊 ВТОРАЯ ВОЛНА! 🌊", color: "#00ddff", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 20 });
            setTimeout(function() { rwbTsunamiActive = false; }, 1500);
        }, 1600);
    }

    function spawnWhitebeardAttack() {
        let type = Math.floor(Math.random() * 8);
        let isSuper = whitebeard.superForm;
        playHakiChargeSound(0.2);
        spawnHakiLightning(whitebeard.x, whitebeard.y, 3, false);
        let dxPlayer = rwbPlayer.x - whitebeard.x, dyPlayer = rwbPlayer.y - whitebeard.y;
        let angleToPlayer = Math.atan2(dyPlayer, dxPlayer);

        if (type === 0) {
            let count = 6;
            for (let i = 0; i < count; i++) {
                let cx = 40 + Math.random() * 320;
                rwbAttacks.push({ type: "rock", x: cx, y: -40 - Math.random() * 30, vx: (Math.random() - 0.5) * 0.5, vy: (isSuper ? 4.2 : 3.5) * BALANCE.projectileSpeedMult, size: 17 + Math.random() * 5, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.06, hp: 3, maxHp: 3, damage: Math.ceil((isSuper ? 20 : 15) * BALANCE.whitebeardDamageMult), life: 400, color: "#8B7355", hasHaki: false, textureSeed: Math.random() * 1000 });
            }
            spawnWhiteCracks(whitebeard.x, whitebeard.y, 3); playImpactSound(0.4, 0.6);
        } else if (type === 1) {
            rwbShockwaves.push({ x: whitebeard.x, y: whitebeard.y, radius: 10, maxRadius: isSuper ? 240 : 200, speed: (isSuper ? 5.5 : 4.5) * BALANCE.projectileSpeedMult, color: "#ffdd44", damage: Math.ceil((isSuper ? 20 : 15) * BALANCE.whitebeardDamageMult), hit: false, hp: 6, maxHp: 6, canDestroy: true, life: 150, maxLife: 150, width: 14 });
            playImpactSound(0.35, 0.9);
        } else if (type === 2) {
            rwbAttacks.push({ type: "fist", x: 430, y: 150 + Math.random() * 200, vx: -6 * BALANCE.projectileSpeedMult, vy: 0, size: 22, hp: 4, maxHp: 4, damage: Math.ceil((isSuper ? 24 : 18) * BALANCE.whitebeardDamageMult), life: 250, color: "#ffffff", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
            playImpactSound(0.4, 1.0);
        } else if (type === 3) {
            rwbAttacks.push({ type: "fist", x: -30, y: 150 + Math.random() * 200, vx: 6 * BALANCE.projectileSpeedMult, vy: 0, size: 22, hp: 4, maxHp: 4, damage: Math.ceil((isSuper ? 24 : 18) * BALANCE.whitebeardDamageMult), life: 250, color: "#ffffff", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
            playImpactSound(0.4, 1.0);
        } else if (type === 4) { spawnTsunamiAttack(isSuper); }
        else if (type === 5) {
            let count = isSuper ? 8 : 5;
            for (let i = 0; i < count; i++) {
                let cx = 60 + i * (280 / (count - 1));
                rwbAttacks.push({ type: "fist", x: cx, y: -30, vx: (Math.random() - 0.5) * 1, vy: 5 * BALANCE.projectileSpeedMult, size: 16, hp: 3, maxHp: 3, damage: Math.ceil((isSuper ? 18 : 14) * BALANCE.whitebeardDamageMult), life: 300, color: "#ffffff", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
            }
            playImpactSound(0.35, 0.9);
        } else if (type === 6) {
            for (let side = -1; side <= 1; side += 2) {
                (function(s) {
                    setTimeout(function() {
                        if (!window.rwbActive) return;
                        let targetX = rwbPlayer.x + s * 60, targetY = rwbPlayer.y;
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
            rwbAttacks.push({ type: "haki_wave", x: side > 0 ? -40 : 440, y: 200 + Math.random() * 200, vx: side * 3.5 * BALANCE.projectileSpeedMult, vy: 0, size: 30, hp: 5, maxHp: 5, damage: Math.ceil(22 * BALANCE.whitebeardDamageMult), life: 300, color: "#ff8800", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true });
            playHakiChargeSound(0.3);
        }
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

    function spawnWhitebeardGuraRazlom() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "💜 ГУРА-ГУРА РАЗЛОМ 💜", color: "#aa00ff", life: 100, maxLife: 100, vy: -0.3, vx: 0, size: 24 });
        playHakiChargeSound(0.5); playBossRoarSound(0.4); rwbShake = 30;
        spawnPurpleCracks(whitebeard.x, whitebeard.y, 10);
        for (let i = 0; i < 4; i++) {
            let rx = 60 + Math.random() * 280, ry = 100 + Math.random() * 300;
            rwbAttacks.push({ type: "purple_crack_zone", x: rx, y: ry, radius: 10, maxRadius: 70 + Math.random() * 30, warningTimer: 60 + i * 10, activeTimer: 0, maxActive: 25, state: "warning", damage: Math.ceil(22 * BALANCE.whitebeardDamageMult), hit: false, color: "#aa00ff" });
        }
        setTimeout(function() {
            if (!window.rwbActive || rwbState !== "fight2") return;
            rwbAttacks.push({ type: "fist", x: whitebeard.x, y: whitebeard.y + 20, vx: 0, vy: 0, size: 26, hp: 3, maxHp: 3, damage: Math.ceil(24 * BALANCE.superDamageMult), life: 300, color: "#aa00ff", rotation: 0, rotSpeed: 0, trail: [], hasHaki: true, isHoming: true, targetX: rwbPlayer.x, targetY: rwbPlayer.y, homingSpeed: 0.05 });
        }, 800);
    }

    function spawnWhitebeardSuperAttack() {
        let attackId = Math.floor(Math.random() * 6);
        playHakiChargeSound(0.3);
        spawnHakiLightning(whitebeard.x, whitebeard.y, 5, false);
        if (attackId === 0) spawnWhitebeardEarthquake();
        else if (attackId === 1) spawnWhitebeardGuraGura();
        else if (attackId === 2) spawnWhitebeardTitanFist();
        else if (attackId === 3) spawnWhitebeardRush();
        else if (attackId === 4) spawnTsunamiAttack(false);
        else spawnWhitebeardGuraRazlom();
    }

    function spawnWhitebeardEarthquake() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "🌋 ЗЕМЛЕТРЯСЕНИЕ 🌋", color: "#8B7355", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 18 });
        playImpactSound(0.7, 0.5); playBossRoarSound(0.4); rwbShake = 25;
        for (let i = 0; i < 8; i++) {
            let cx = 40 + Math.random() * 320;
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
            let rx = 60 + Math.random() * 280, ry = 120 + Math.random() * 280;
            rwbAttacks.push({ type: "gura_crack", x: rx, y: ry, radius: 10, maxRadius: 85, damage: Math.ceil(24 * BALANCE.superDamageMult), life: 200, state: "warning", warningTimer: 70 + i * 15, activeTimer: 0, maxActive: 20, hit: false, color: "#ffffff" });
        }
        rwbShake = 20;
    }

    function spawnWhitebeardTitanFist() {
        rwbFloatingTexts.push({ x: 200, y: 100, text: "👊 ТИТАН-КУЛАК 👊", color: "#ffdd00", life: 70, maxLife: 70, vy: -0.3, vx: 0, size: 18 });
        playWhooshSound(0.5);
        setTimeout(function() { playImpactSound(0.8, 0.4); }, 900);
        rwbShake = 25;
        rwbAttacks.push({ type: "titan_fist", x: 120 + Math.random() * 160, y: -120, vy: 3.5, size: 75, damage: Math.ceil(35 * BALANCE.superDamageMult), life: 300, state: "falling", hit: false, color: "#8B7355" });
        for (let i = 0; i < 3; i++) {
            let cx = 40 + Math.random() * 320;
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
                    let targetX = rwbPlayer.x + (Math.random() - 0.5) * 80, targetY = rwbPlayer.y + (Math.random() - 0.5) * 80;
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
        rwbAttacks.push({ type: "giant_rock", x: rx, y: -120, vx: (Math.random() - 0.5) * 0.4, vy: 2.5, size: 40, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.04, hp: 5, maxHp: 5, damage: Math.ceil(28 * BALANCE.whitebeardDamageMult), life: 500, color: "#8B7355", hasHaki: false, textureSeed: Math.random() * 1000 });
        rwbFloatingTexts.push({ x: rx, y: 80, text: "🪨 ОГРОМНЫЙ КАМЕНЬ 🪨", color: "#8B7355", life: 90, maxLife: 90, vy: -0.2, vx: 0, size: 16 });
        playWhooshSound(0.6);
        setTimeout(function() { playImpactSound(0.7, 0.5); }, 1200);
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
        // ★ ЕСЛИ ВРЕМЯ ОСТАНОВЛЕНО ИЛИ АНТИ-СПИРАЛЬ ЗАМОРОЗИЛА — НЕ ДВИГАЕМ АТАКИ ★
        var timeStopped = false;
        var frozen = false;
        if (typeof _superState !== 'undefined') {
            timeStopped = (_superState.garouTimeStop === true || _superState.takabaTimeStop === true);
            frozen = (_superState.antispiralFrozen === true);
        }
        var stopAll = timeStopped || frozen;

        for (let i = rwbAttacks.length - 1; i >= 0; i--) {
            let a = rwbAttacks[i];

            // ★★★ ФИКС: при остановке времени — только визуал, никакой логики ★
            if (stopAll) {
                // Замораживаем таймеры
                // Но всё равно рисуем (рендер отдельно)
                continue;
            }

            if (a.type === "purple_crack_zone") {
                if (a.state === "warning") {
                    a.warningTimer--;
                    if (a.warningTimer <= 0) {
                        a.state = "active"; a.activeTimer = a.maxActive;
                        rwbShake = 20; playExplosionSound(0.5);
                        spawnPurpleCracks(a.x, a.y, 6);
                        for (let j = 0; j < 15; j++) {
                            let ang = (j / 15) * Math.PI * 2;
                            rwbParticles.push({ x: a.x, y: a.y, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6, life: 25, maxLife: 25, color: "#aa00ff", size: 3 });
                        }
                    }
                } else if (a.state === "active") {
                    a.activeTimer--;
                    a.radius = a.maxRadius * (1 - a.activeTimer / a.maxActive);
                    if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                        let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                        if (Math.sqrt(dx * dx + dy * dy) < a.radius * 0.85 + 4) { a.hit = true; hitPlayer(a.damage); }
                    }
                    if (a.activeTimer <= 0) a.state = "done";
                } else { rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "giant_rock") {
                a.x += a.vx; a.y += a.vy; a.rotation += a.rotSpeed; a.life--;
                if (Math.random() < 0.4) {
                    for (let k = 0; k < 2; k++) rwbParticles.push({ x: a.x + (Math.random() - 0.5) * a.size, y: a.y - a.size * 0.5, vx: (Math.random() - 0.5) * 2, vy: -1 - Math.random() * 2, life: 20, maxLife: 20, color: Math.random() > 0.5 ? "#8B7355" : "#5a4030", size: 2 + Math.random() * 3 });
                }
                if (rwbPlayer.invulnTimer <= 0) {
                    let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                    if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.7 * BALANCE.playerHitboxMult + getRWBSuperHitboxBonus()) { hitPlayer(a.damage); spawnRockSmash(a.x, a.y, a.size); rwbAttacks.splice(i, 1); continue; }
                }
                if (a.y > 480 || a.life <= 0) { spawnRockSmash(a.x, 480, a.size); playImpactSound(0.8, 0.4); rwbShake = 30; rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "tsunami") {
                a.waveTime += 0.08; a.y += a.vy; a.life--;
                a.currentHeight = a.height * (1 + Math.sin(a.waveTime) * 0.15);
                a.currentWidth = a.width * (1 + Math.cos(a.waveTime * 1.5) * 0.03);
                if (Math.random() < 0.3) rwbParticles.push({ x: a.x + Math.random() * a.currentWidth, y: a.y + (Math.random() - 0.5) * a.currentHeight, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 2, life: 25, maxLife: 25, color: Math.random() > 0.5 ? "#ffffff" : "#88ddff", size: 2 });
                if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                    let dy = Math.abs(rwbPlayer.y - a.y);
                    let hbY = a.currentHeight / 2 + 6;
                    if (a.fromRight) { if (dy < hbY && rwbPlayer.x >= a.x && rwbPlayer.x <= 400) { a.hit = true; hitPlayer(a.damage); } }
                    else { if (dy < hbY && rwbPlayer.x >= 0 && rwbPlayer.x <= a.width) { a.hit = true; hitPlayer(a.damage); } }
                }
                if (a.y > 600 || a.life <= 0) rwbAttacks.splice(i, 1);
                continue;
            }

            if (a.type === "rock") {
                a.x += a.vx; a.y += a.vy; a.rotation += a.rotSpeed; a.life--;
                if (Math.random() < 0.15) rwbParticles.push({ x: a.x + (Math.random() - 0.5) * a.size, y: a.y - a.size * 0.5, vx: (Math.random() - 0.5) * 1, vy: -0.5 - Math.random() * 1, life: 12, maxLife: 12, color: "#5a4030", size: 1.5 });
                if (rwbPlayer.invulnTimer <= 0) {
                    let dx = rwbPlayer.x - a.x, dy = rwbPlayer.y - a.y;
                    if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.75 * BALANCE.playerHitboxMult + getRWBSuperHitboxBonus()) { hitPlayer(a.damage); spawnRockSmash(a.x, a.y, a.size); rwbAttacks.splice(i, 1); continue; }
                }
                if (a.y > 500 || a.life <= 0) { spawnRockSmash(a.x, 480, a.size); rwbAttacks.splice(i, 1); continue; }
                continue;
            }

            if (a.type === "haki_wave") {
                a.x += a.vx; a.life--;
                if (Math.random() < 0.3) rwbParticles.push({ x: a.x, y: a.y + (Math.random() - 0.5) * a.size, vx: a.vx * 0.3, vy: (Math.random() - 0.5) * 2, life: 15, maxLife: 15, color: "#ff8800", size: 2 });
                if (!a.hit && rwbPlayer.invulnTimer <= 0) {
                    let dx = Math.abs(rwbPlayer.x - a.x), dy = Math.abs(rwbPlayer.y - a.y);
                    if (dx < a.size * 0.6 + 4 && dy < a.size * 0.6 + 4) { a.hit = true; hitPlayer(a.damage); }
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
                        if (hit) { a.hit = true; hitPlayer(a.damage); }
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
                        if (hit) { a.hit = true; hitPlayer(a.damage); }
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
                    if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.7 * BALANCE.playerHitboxMult + Math.max(2, getRWBSuperHitboxBonus() - 1)) { hitPlayer(a.damage); rwbAttacks.splice(i, 1); continue; }
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
                        if (Math.sqrt(dx * dx + dy * dy) < a.radius * 0.85 + 4) { a.hit = true; hitPlayer(a.damage); }
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
                        if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.7 * BALANCE.playerHitboxMult + getRWBSuperHitboxBonus()) { a.hit = true; hitPlayer(a.damage); }
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
                if (Math.sqrt(dx * dx + dy * dy) < a.size * 0.75 * BALANCE.playerHitboxMult + getRWBSuperHitboxBonus()) { hitPlayer(a.damage); rwbAttacks.splice(i, 1); continue; }
            }
            if (a.life <= 0 || a.y > 520 || a.x < -60 || a.x > 460 || a.y < -150) rwbAttacks.splice(i, 1);
        }
        for (let i = rwbShockwaves.length - 1; i >= 0; i--) {
            let sw = rwbShockwaves[i];
            // ★ При остановке времени шоквейвы тоже стоят ★
            if (!stopAll) {
                sw.radius += sw.speed; sw.life--;
            }
            if (sw.canDestroy && !sw.hit && rwbPlayer.invulnTimer <= 0 && (rwbState === "fight1" || rwbState === "fight2")) {
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
        // ★ При остановке времени — пули тоже стоят ★
        var stopAll = false;
        if (typeof _superState !== 'undefined') {
            stopAll = (_superState.garouTimeStop === true);
        }

        for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
            let b = rwbPlayerBullets[i];
            if (!stopAll) {
                b.x += b.vx; b.y += b.vy; b.life--;
            }
            let destroyed = false;

            if (b.isBlue) {
                for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                    let a = rwbAttacks[j];
                    if (a.type === "tsunami" || a.type === "titan_fist" || a.type === "gura_crack" || a.type === "purple_crack_zone" || a.type === "haki_wave") continue;
                    if (a.hp === undefined) continue;
                    let dx = b.x - a.x, dy = b.y - a.y;
                    let aSize = a.size || a.radius || 20;
                    if (Math.sqrt(dx * dx + dy * dy) < aSize * 0.7 + b.size + 4) {
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
                        if (isModerActive()) dmg = boss.maxHp + 999999;
                        if (typeof window.applyArmorToBossDamage === 'function' && !isModerActive()) {
                            let result = window.applyArmorToBossDamage(dmg);
                            if (result.blocked) { spawnHitParticles(b.x, b.y, "#9b59b6", 6); playImpactSound(0.15, 1.5); destroyed = true; break; }
                            dmg = result.dmg;
                        }
                        boss.hp = Math.max(0, boss.hp - dmg);
                        boss.hitFlash = 4;
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

    function hitPlayer(dmg) {
        if (isModerActive()) return;

        // ★ 1. Проверка неуязвимости (ДО всего остального) ★
        if (typeof _superState !== 'undefined') {
            if (_superState.usoppInvuln) return;
            if (_superState.dandyInvuln) return;
            if (_superState.garouInvulnTimer > 0) return;
            if (_superState.garouTimeStop) return;
            if (_superState.dekusActive && _superState.dekusInvuln) return;
        }

        // ★ 2. Проверка локальной неуязвимости ★
        if (rwbPlayer.invulnTimer > 0) return;

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
        if (isModerActive()) return;
        if (rwbState === "defeat") return;
        rwbState = "defeat"; rwbEndTimer = 0;
        hideRWBModeButton(); hideRWBSuperButton();
        playBossRoarSound(0.5); playExplosionSound(0.4);
        if (typeof showFloatingText === 'function') showFloatingText("💀 ТЫ ПАЛ...", "#ff0000");
    }

    function stopRogerWhitebeardFight() {
        if (rwbWatchdog) { clearTimeout(rwbWatchdog); rwbWatchdog = null; }
        window.rwbActive = false; rwbDialogActive = false;
        hideRWBModeButton(); hideRWBSuperButton(); stopRWBMusic();
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
        rwbTimer++;

        if (typeof tickSupers === 'function') {
            try { tickSupers(); } catch(e) { console.error("[ROGER-WB] tickSupers error:", e); }
        }

        // Общие SUPER-эффекты должны управлять и RWB-рендером.
        if (typeof _superState !== 'undefined' && _superState.screenShakeAmount > 0) {
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
                    rwbTitanFistTimer++;
                    if (rwbTitanFistTimer >= RWB_TITAN_INTERVAL) {
                        rwbTitanFistTimer = 0;
                        rwbAttacks.push({ type: "titan_fist", x: 120 + Math.random() * 160, y: -120, vy: 3.5, size: 75, damage: Math.ceil(35 * BALANCE.superDamageMult), life: 300, state: "falling", hit: false, color: "#8B7355" });
                        rwbFloatingTexts.push({ x: 200, y: 100, text: "👊 ТИТАН-КУЛАК 👊", color: "#ffdd00", life: 60, maxLife: 60, vy: -0.3, vx: 0, size: 18 });
                        playWhooshSound(0.5);
                        setTimeout(function() { playImpactSound(0.8, 0.4); }, 900);
                    }
                    rwbTitanRockTimer++;
                    if (rwbTitanRockTimer >= RWB_ROCK_INTERVAL) { rwbTitanRockTimer = 0; spawnGiantRock(); }
                }
                let remaining = Math.max(0, Math.ceil((rwbSurvivalTarget2 - rwbSurvivalTimer2) / 60));
                let timerEl = document.getElementById("arenaTimer");
                if (timerEl) timerEl.innerText = remaining + "с";
            } else if (rwbState === "victory") {
                rwbEndTimer++;
            } else if (rwbState === "defeat") {
                rwbEndTimer++;
                if (rwbEndTimer > 180) {
                    stopRogerWhitebeardFight();
                    if (typeof playerHp !== 'undefined') playerHp = 0;
                    if (typeof defeat === 'function') defeat();
                    return;
                }
            } else if (rwbState === "done") { return; }
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
        if (rwbShake > 0.5) ctx.translate((Math.random() - 0.5) * rwbShake, (Math.random() - 0.5) * rwbShake);

        drawIslandBackground();

        if (rwbHakiAura > 0) { ctx.save(); ctx.globalAlpha = rwbHakiAura / 100; ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, 400, 500); ctx.restore(); }
        if (rwbScreenFlash > 0) { ctx.globalAlpha = rwbScreenFlash / 30; ctx.fillStyle = rwbScreenFlashColor; ctx.fillRect(0, 0, 400, 500); ctx.globalAlpha = 1; }

        ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 396, 496);

        for (let i = 0; i < rwbSpeedLines.length; i++) {
            let s = rwbSpeedLines[i];
            ctx.save(); ctx.globalAlpha = s.life / s.maxLife * 0.6;
            ctx.strokeStyle = s.color; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4); ctx.stroke();
            ctx.restore();
        }

        drawWhiteCracks(); drawPurpleCracks();

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

        for (let i = 0; i < rwbPlayerBullets.length; i++) {
            let b = rwbPlayerBullets[i];
            ctx.save();
            let grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 1.5);
            grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.5, b.color); grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        if (rwbState === "fight1" || rwbState === "fight2") drawRWBPlayer();

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
                ctx.fillText("Навала • Цунами • 💜 РАЗЛОМ", 200, 290);
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

        if (rwbDialogActive) drawRWBDialogOverlay();

        if (typeof renderSuperVisuals === 'function') {
            try { renderSuperVisuals(); } catch(e) { console.error("[ROGER-WB] renderSuperVisuals error:", e); }
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
        }
        ctx.restore();
    }

    function updateSuperBoss() {
        let active = rwbActiveBoss;
        if (!active) return;
        active.pulse += 0.12; active.rotation += 0.03;
        active.x = 200 + Math.sin(rwbTimer / 80) * 100;
        active.y = 100 + Math.sin(rwbTimer / 60) * 20;
        if (active.hitFlash > 0) active.hitFlash--;
        if (Math.random() < 0.15) spawnHakiLightning(active.x + (Math.random() - 0.5) * 50, active.y + (Math.random() - 0.5) * 50, 1, false);
        active.attackTimer--;
        if (active.attackTimer <= 0) {
            let interval = (active.id === "roger") ? RWB_ATTACK_SPEED_SUPER_ROGER : BALANCE.superAttackRate;
            active.attackTimer = interval + Math.random() * 20;
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

    function drawWhitebeard() {
        if (!whitebeard) return;
        let pulse = 1 + Math.sin(whitebeard.pulse) * 0.06;
        let size = whitebeard.size * pulse;
        let flash = whitebeard.hitFlash > 0;
        drawWhitebeardModel(whitebeard.x, whitebeard.y, size, flash, Math.sin(whitebeard.rotation) * 0.1);
    }

    function drawRWBPlayer() {
        if (rwbPlayer.invulnTimer > 0 && Math.floor(rwbPlayer.invulnTimer / 4) % 2 === 0) return;
        let color = (rwbPlayer.attackMode === "blue") ? "#00aaff" : "#ff2222";
        drawHeartShape(rwbPlayer.x, rwbPlayer.y, rwbPlayer.size, color, color);
    }

    function drawAttack(a) {
        if (a.type === "giant_rock") { drawGiantRock(a); return; }
        if (a.type === "tsunami") { drawTsunami(a); return; }
        if (a.type === "rock") { drawRock(a); return; }

        if (a.type === "purple_crack_zone") {
            ctx.save();
            if (a.state === "warning") {
                let pulseAlpha = 0.5 + Math.sin(performance.now() / 80) * 0.3;
                ctx.globalAlpha = pulseAlpha;
                ctx.strokeStyle = "#aa00ff"; ctx.lineWidth = 3; ctx.shadowColor = "#aa00ff"; ctx.shadowBlur = 15;
                ctx.beginPath(); ctx.arc(a.x, a.y, a.maxRadius, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(a.x, a.y, a.maxRadius * 0.5, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 1; ctx.fillStyle = "#aa00ff";
                ctx.font = "bold 14px monospace"; ctx.textAlign = "center"; ctx.fillText("💜", a.x, a.y + 5);
            } else if (a.state === "active") {
                let fade = a.activeTimer / a.maxActive;
                ctx.globalAlpha = fade;
                ctx.fillStyle = "#aa00ff"; ctx.shadowColor = "#cc44ff"; ctx.shadowBlur = 20;
                ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore(); return;
        }

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
            ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.ellipse(0, 0, a.size * 1.3, a.size * 0.8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ff6600"; ctx.beginPath(); ctx.ellipse(0, 0, a.size, a.size * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.ellipse(0, 0, a.size * 0.5, a.size * 0.3, 0, 0, Math.PI * 2); ctx.fill();
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
            let isWhitebeardFist = (a.color === "#ffffff");
            ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(0, 0, a.size + 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = a.color; ctx.beginPath(); ctx.arc(0, 0, a.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = isWhitebeardFist ? "#ffffff" : "#000000";
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
    console.log("║  🏴‍☠️ ROGER vs WHITEBEARD v19.0                             ║");
    console.log("║  ✅ garouTimeStop останавливает ВСЕ атаки                  ║");
    console.log("║  ✅ Поглощение урона работает                              ║");
    console.log("║  ✅ Увеличение урона применяется к пулям                   ║");
    console.log("║  ✅ Анти-спираль реально замедляет игрока                  ║");
    console.log("║  ✅ rwbSpeedMult — глобальный множитель                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

})();
