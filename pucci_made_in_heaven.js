// MADE IN HEAVEN — progressive time acceleration for Enrico Pucci.
// Works through the shared boss context: arena, Living Stone, Super Living Stone,
// Waystar, Roger/Whitebeard and Anti-Spiral.

(function () {
    "use strict";

    if (window.__mbPucciMadeInHeavenLoaded) return;
    window.__mbPucciMadeInHeavenLoaded = true;

    var CARD_NAME = "Энрико Пуччи (Made in Heaven)";
    var DURATION_MS = 120000;
    var SPEED_CAP_TIME_MS = 120000;
    var TELEPORT_UNLOCK_MS = 50000;
    var TELEPORT_COOLDOWN_MS = 3000;
    var POST_ULTIMATE_COOLDOWN_MS = 45000;
    var state = {
        active: false,
        startedAt: 0,
        cooldownUntil: 0,
        cardName: null,
        contextType: null,
        baseSpeed: null,
        restoreSpeed: null,
        lastTrailAt: 0,
        lastUiAt: 0,
        trail: [],
        teleportCooldownUntil: 0,
        teleportFlash: null,
        rafId: 0,
        audioOne: null,
        audioTwo: null,
        audioTimer: 0
    };
    window.__mbPucciMadeInHeavenState = state;

    function now() {
        return (window.performance && typeof window.performance.now === "function")
            ? window.performance.now() : Date.now();
    }

    function mainCard() {
        try { return typeof window.getMainCard === "function" ? window.getMainCard() : null; }
        catch (e) { return null; }
    }

    function context() {
        try { return typeof window.getBossContext === "function" ? window.getBossContext() : null; }
        catch (e) { return null; }
    }

    function isPucci(card) {
        card = card || mainCard();
        return !!(card && String(card.name || "") === CARD_NAME);
    }

    function isTestUltimate() {
        return !!(window.__mbBossTestMode && window.__mbBossTestAbilityMode === "ultimate");
    }

    function isTestPassive() {
        return !!(window.__mbBossTestMode && window.__mbBossTestAbilityMode === "passive");
    }

    function elapsedMs() {
        return state.active ? Math.max(0, now() - state.startedAt) : 0;
    }

    function clamp01(value) {
        return Math.max(0, Math.min(1, Number(value) || 0));
    }

    function progress() {
        return state.active ? clamp01(elapsedMs() / DURATION_MS) : 0;
    }

    function speedLevel() {
        return state.active ? Math.min(1500, elapsedMs() / SPEED_CAP_TIME_MS * 1500) : 0;
    }

    function attackSpeedBonus() {
        return 0.30 * progress();
    }

    function worldTimeMultiplier() {
        return 1 + 0.40 * progress();
    }
    window.MBPucciGetWorldTimeMultiplier = worldTimeMultiplier;

    function damageBonus() {
        return 0.50 * progress();
    }

    function damageReduction() {
        return 0.35 * progress();
    }

    window.MBPucciGetAttackSpeedMultiplier = function () {
        return 1 + attackSpeedBonus();
    };
    window.MBPucciGetProgress = progress;
    window.MBPucciIsMadeInHeavenActive = function () { return !!state.active; };

    function showMessage(message, color) {
        try {
            if (typeof window.showFloatingText === "function") window.showFloatingText(message, color || "#dffaff");
        } catch (e) {}
    }

    function playSound(frequency, type, duration, volume) {
        try {
            if (typeof window.playArenaSound === "function") window.playArenaSound(frequency, type || "sine", duration || 0.12, volume || 0.07);
        } catch (e) {}
    }

    function canUseMastery(ctx) {
        if (isTestUltimate()) return true;
        if (window.__mbBossTestMode) return true;
        var card = mainCard();
        if (!card) return false;
        try {
            if (ctx && ctx.type !== "arena") {
                return typeof window.hasMasteryUniqueSuper !== "function" || window.hasMasteryUniqueSuper(card);
            }
            return typeof window.hasMasterySuper !== "function" || window.hasMasterySuper(card);
        } catch (e) { return false; }
    }

    function consumeUniqueCharge(ctx) {
        if (!ctx || ctx.type === "arena" || isTestUltimate() || window.__mbBossTestMode) return true;

        var charges = null;
        try {
            charges = typeof window.getHeroCurrentCharges === "function"
                ? window.getHeroCurrentCharges(CARD_NAME)
                : (window._heroSuperCharges ? window._heroSuperCharges[CARD_NAME] : null);
        } catch (e) {}

        if (charges === null || charges === undefined) {
            var limit = 3;
            try {
                if (typeof window.getEffectiveHeroChargeLimit === "function") {
                    limit = window.getEffectiveHeroChargeLimit(CARD_NAME, ctx.type);
                } else if (typeof window.getBossChargeLimit === "function") {
                    limit = window.getBossChargeLimit(ctx.type);
                }
            } catch (e) {}
            charges = Math.max(0, Number(limit) || 0);
            try {
                if (typeof window.setHeroCurrentCharges === "function") window.setHeroCurrentCharges(CARD_NAME, charges);
                else {
                    window._heroSuperCharges = window._heroSuperCharges || {};
                    window._heroSuperCharges[CARD_NAME] = charges;
                }
            } catch (e) {}
        }

        var shared = Number(window._uniqueSuperCharges);
        if (Number(charges) <= 0 || (Number.isFinite(shared) && shared <= 0)) {
            showMessage("❌ Заряды Made in Heaven закончились!", "#ff7777");
            return false;
        }

        var next = Math.max(0, Number(charges) - 1);
        try {
            if (typeof window.setHeroCurrentCharges === "function") window.setHeroCurrentCharges(CARD_NAME, next);
            else {
                window._heroSuperCharges = window._heroSuperCharges || {};
                window._heroSuperCharges[CARD_NAME] = next;
            }
        } catch (e) {}
        if (Number.isFinite(shared)) window._uniqueSuperCharges = Math.max(0, shared - 1);
        return true;
    }

    function restoreSpeed() {
        if (typeof state.restoreSpeed === "function" && Number.isFinite(Number(state.baseSpeed))) {
            try { state.restoreSpeed(Number(state.baseSpeed)); } catch (e) {}
        }
        state.baseSpeed = null;
        state.restoreSpeed = null;
    }

    function stopAbility(applyCooldown, reason) {
        if (!state.active) return;
        restoreSpeed();
        state.active = false;
        state.cardName = null;
        state.contextType = null;
        state.startedAt = 0;
        state.trail.length = 0;
        state.teleportFlash = null;
        state.teleportCooldownUntil = 0;
        if (state.audioTimer) window.clearTimeout(state.audioTimer);
        state.audioTimer = 0;
        try { if (state.audioOne) { state.audioOne.pause(); state.audioOne.currentTime = 0; } } catch (e) {}
        try { if (state.audioTwo) { state.audioTwo.pause(); state.audioTwo.currentTime = 0; } } catch (e) {}
        state.audioOne = null;
        state.audioTwo = null;
        if (applyCooldown) state.cooldownUntil = Date.now() + POST_ULTIMATE_COOLDOWN_MS;
        else state.cooldownUntil = 0;
        if (state.rafId && typeof window.cancelAnimationFrame === "function") {
            try { window.cancelAnimationFrame(state.rafId); } catch (e) {}
        }
        state.rafId = 0;
        if (reason === "complete") showMessage("🌌 УСКОРЕНИЕ ВРЕМЕНИ ЗАВЕРШЕНО", "#dffaff");
        if (typeof window.updateSuperButton === "function") window.updateSuperButton();
    }

    function beginAbility(ctx) {
        var card = mainCard();
        if (!ctx || typeof ctx.getHeartSpeed !== "function" || typeof ctx.setHeartSpeed !== "function") {
            showMessage("Made in Heaven не смог найти боевой контекст.", "#ff7777");
            return;
        }
        var phase = null;
        try { phase = typeof arenaPhase !== "undefined" ? arenaPhase : window.arenaPhase; } catch (e) {}
        if (ctx.type === "arena" && phase === "attack" && !isTestUltimate()) {
            showMessage("⚔️ СНАЧАЛА ЗАКОНЧИ АТАКУ!", "#ffdd00");
            return;
        }
        if (!canUseMastery(ctx)) {
            showMessage(ctx.type === "arena" ? "Нужно мастерство 5★!" : "Нужно мастерство 6★ для уникального босса!", "#ff7777");
            return;
        }
        if (Date.now() < state.cooldownUntil && !isTestUltimate()) {
            showMessage("⏳ Made in Heaven восстанавливается: " +
                Math.ceil((state.cooldownUntil - Date.now()) / 1000) + "с", "#ffdd77");
            return;
        }
        if (!consumeUniqueCharge(ctx)) return;

        var base = Number(ctx.getHeartSpeed());
        if (!(base > 0) || !Number.isFinite(base)) {
            showMessage("Не удалось определить скорость игрока.", "#ff7777");
            return;
        }

        state.active = true;
        state.startedAt = now();
        state.cardName = String(card && card.name || CARD_NAME);
        state.contextType = ctx.type;
        state.baseSpeed = base;
        state.restoreSpeed = ctx.setHeartSpeed;
        state.lastTrailAt = 0;
        state.lastUiAt = 0;
        state.trail.length = 0;
        state.teleportCooldownUntil = 0;
        state.teleportFlash = null;
        state.cooldownUntil = 0;

        showMessage("🌌 MADE IN HEAVEN: ВРЕМЯ УСКОРЯЕТСЯ!", "#e8fbff");
        try {
            if (typeof window.stopAllMusic === "function") window.stopAllMusic();
            state.audioOne = new Audio("music/майден хевен.mp3");
            state.audioOne.loop = false;
            state.audioOne.volume = 0.85;
            var firstPlay = state.audioOne.play();
            if (firstPlay && typeof firstPlay.catch === "function") firstPlay.catch(function () {});
            state.audioTimer = window.setTimeout(function () {
                if (!state.active) return;
                try {
                    if (state.audioOne) { state.audioOne.pause(); state.audioOne.currentTime = 0; }
                    state.audioTwo = new Audio("music/Ost пуччи.mp3");
                    state.audioTwo.loop = true;
                    state.audioTwo.volume = 0.85;
                    var secondPlay = state.audioTwo.play();
                    if (secondPlay && typeof secondPlay.catch === "function") secondPlay.catch(function () {});
                } catch (e) {}
            }, 17000);
        } catch (e) {}
        playSound(720, "sine", 0.35, 0.12);
        try {
            if (typeof window.notifyWaystarSuperAction === "function") window.notifyWaystarSuperAction("Made in Heaven");
            else if (window.MBOnlineWaystar && window.MBOnlineWaystar.active &&
                typeof window.MBOnlineWaystar.onSuperAction === "function") {
                window.MBOnlineWaystar.onSuperAction("Made in Heaven");
            }
        } catch (e) {}
        startFrameLoop();
        if (typeof window.updateSuperButton === "function") window.updateSuperButton();
    }

    function boundsFor(ctx) {
        var type = ctx && ctx.type;
        if (type === "stoneSuper") return { minX: 48, maxX: 352, minY: 260, maxY: 468 };
        if (type === "waystar" || type === "stone") return { minX: 22, maxX: 378, minY: 86, maxY: 476 };
        if (type === "rwb") return { minX: 22, maxX: 378, minY: 24, maxY: 476 };
        if (type === "antispiral") return { minX: 22, maxX: 378, minY: 72, maxY: 478 };
        return { minX: 20, maxX: 380, minY: 18, maxY: 482 };
    }

    function attackClearance(ctx, x, y) {
        var list = [];
        try { list = ctx && typeof ctx.getAttacks === "function" ? ctx.getAttacks() : []; } catch (e) {}
        if (!Array.isArray(list) || !list.length) return 500;
        var best = 500;
        for (var i = 0; i < list.length; i++) {
            var attack = list[i];
            if (!attack || attack.removed || attack.dead) continue;
            var ax = Number(attack.x);
            var ay = Number(attack.y);
            if (!Number.isFinite(ax) || !Number.isFinite(ay)) continue;
            var size = Math.max(8, Number(attack.size) || Number(attack.radius) * 2 || 14);
            var cx = ax + (Number(attack.w) || size) * 0.5;
            var cy = ay + (Number(attack.h) || size) * 0.5;
            var clearance = Math.hypot(x - cx, y - cy) - size * 0.5;
            if (clearance < best) best = clearance;
        }
        return best;
    }

    function teleport(ctx) {
        var elapsed = elapsedMs();
        if (elapsed < TELEPORT_UNLOCK_MS) {
            showMessage("⏳ Телепортация откроется через " +
                Math.ceil((TELEPORT_UNLOCK_MS - elapsed) / 1000) + "с", "#dffaff");
            return;
        }
        var timeLeft = state.teleportCooldownUntil - now();
        if (timeLeft > 0) {
            showMessage("⏳ Телепортация перезаряжается: " + (timeLeft / 1000).toFixed(1) + "с", "#dffaff");
            return;
        }
        var bounds = boundsFor(ctx);
        var x = Number(ctx.getHeartX()) || 200;
        var y = Number(ctx.getHeartY()) || 400;
        var best = null;
        var bestScore = -Infinity;
        var distance = 112;
        var offset = Math.random() * Math.PI * 2;
        for (var i = 0; i < 12; i++) {
            var angle = offset + (Math.PI * 2 * i / 12);
            var tx = Math.max(bounds.minX, Math.min(bounds.maxX, x + Math.cos(angle) * distance));
            var ty = Math.max(bounds.minY, Math.min(bounds.maxY, y + Math.sin(angle) * distance));
            var score = attackClearance(ctx, tx, ty);
            if (ctx.type === "stoneSuper" && ty < 255) score -= 100;
            if (Math.hypot(tx - x, ty - y) < 50) score -= 40;
            if (score > bestScore) {
                bestScore = score;
                best = { x: tx, y: ty };
            }
        }
        if (!best) return;

        try {
            if (typeof ctx.addShockwave === "function") {
                ctx.addShockwave(x, y, "#c8f5ff", 320, 0.35, 4);
            }
            ctx.setHeartX(best.x);
            ctx.setHeartY(best.y);
            if (typeof ctx.clampHeart === "function") ctx.clampHeart();
        } catch (e) {
            showMessage("Телепортация недоступна в этой фазе.", "#ffaaaa");
            return;
        }

        var finalX = Number(ctx.getHeartX()) || best.x;
        var finalY = Number(ctx.getHeartY()) || best.y;
        state.teleportFlash = { x: finalX, y: finalY, life: 0.48, maxLife: 0.48 };
        state.teleportCooldownUntil = now() + TELEPORT_COOLDOWN_MS;
        state.trail.length = 0;

        try {
            if (typeof ctx.addShockwave === "function") ctx.addShockwave(finalX, finalY, "#ffffff", 420, 0.42, 5);
            if (typeof ctx.getParticles === "function") {
                var particles = ctx.getParticles();
                if (Array.isArray(particles)) {
                    for (var p = 0; p < 12; p++) {
                        var a = Math.random() * Math.PI * 2;
                        var speed = 2 + Math.random() * 5;
                        particles.push({
                            x: finalX, y: finalY,
                            vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
                            life: 18, maxLife: 18, color: p % 2 ? "#ffffff" : "#9deeff", size: 2 + Math.random() * 2
                        });
                    }
                }
            }
        } catch (e) {}
        playSound(980, "triangle", 0.14, 0.1);
        showMessage("⚡ MADE IN HEAVEN: ТЕЛЕПОРТАЦИЯ", "#ffffff");
        if (typeof window.updateSuperButton === "function") window.updateSuperButton();
    }

    function useSuper() {
        if (isTestPassive()) {
            showMessage("В тесте выбрана пассивка, а не SUPER.", "#ffaa00");
            return;
        }
        var ctx = context();
        if (!ctx) return;
        if (state.active) {
            if (!isPucci() || state.contextType !== ctx.type) {
                stopAbility(false, "cancel");
                return;
            }
            teleport(ctx);
            return;
        }
        beginAbility(ctx);
    }

    function updateFrame(ctx, frameNow) {
        var elapsed = Math.max(0, frameNow - state.startedAt);
        if (elapsed >= DURATION_MS) {
            stopAbility(true, "complete");
            return false;
        }

        var speed = 1 + 15 * clamp01(elapsed / SPEED_CAP_TIME_MS);
        try { state.restoreSpeed(state.baseSpeed * speed); } catch (e) {}

        if (frameNow - state.lastTrailAt >= 42) {
            state.lastTrailAt = frameNow;
            state.trail.push({
                x: Number(ctx.getHeartX()) || 0,
                y: Number(ctx.getHeartY()) || 0,
                life: 0.42,
                maxLife: 0.42
            });
            if (state.trail.length > 12) state.trail.shift();
        }
        for (var i = state.trail.length - 1; i >= 0; i--) {
            state.trail[i].life -= 1 / 60;
            if (state.trail[i].life <= 0) state.trail.splice(i, 1);
        }
        if (state.teleportFlash) {
            state.teleportFlash.life -= 1 / 60;
            if (state.teleportFlash.life <= 0) state.teleportFlash = null;
        }
        if (frameNow - state.lastUiAt >= 100) {
            state.lastUiAt = frameNow;
            if (typeof window.updateSuperButton === "function") window.updateSuperButton();
        }
        return true;
    }

    function frameLoop(frameNow) {
        state.rafId = 0;
        if (!state.active) return;
        var ctx = context();
        if (!ctx || !isPucci() || String(mainCard() && mainCard().name || "") !== state.cardName ||
            ctx.type !== state.contextType) {
            stopAbility(false, "cancel");
            return;
        }
        if (!updateFrame(ctx, frameNow || now())) return;
        if (typeof window.requestAnimationFrame === "function") {
            state.rafId = window.requestAnimationFrame(frameLoop);
        } else {
            state.rafId = window.setTimeout(function () { frameLoop(now()); }, 16);
        }
    }

    function startFrameLoop() {
        if (state.rafId) return;
        if (typeof window.requestAnimationFrame === "function") {
            state.rafId = window.requestAnimationFrame(frameLoop);
        } else {
            state.rafId = window.setTimeout(function () { frameLoop(now()); }, 16);
        }
    }

    function updateButton() {
        var card = mainCard();
        var btn = document.getElementById("superBtn");
        var status = document.getElementById("standBuffStatus");
        if (!isPucci(card)) return;
        if (isTestPassive()) {
            if (btn) btn.style.display = "none";
            if (status) status.style.display = "none";
            return;
        }
        var ctx = context();
        if (!ctx) {
            if (btn) btn.style.display = "none";
            if (status) status.style.display = "none";
            return;
        }
        if (!btn) return;
        var test = isTestUltimate();
        var mastery = canUseMastery(ctx);
        if (!mastery) {
            btn.style.display = "none";
            if (status) status.style.display = "none";
            return;
        }

        btn.style.display = "block";
        btn.disabled = false;
        btn.onclick = function (event) { if (event) { event.preventDefault(); event.stopPropagation(); } useSuper(); };
        btn.style.background = "linear-gradient(135deg,#dffaff,#67cce8,#327baf)";
        btn.style.color = "#071b2b";
        btn.style.border = "2px solid #ffffff";
        btn.style.fontWeight = "900";
        btn.style.animation = state.active ? "none" : "superPulse 2s infinite";
        btn.title = "Made in Heaven: 120 секунд ускорения времени, затем телепортация";

        var label = "⚡ MADE IN HEAVEN";
        if (state.active) {
            var elapsed = elapsedMs();
            if (elapsed < TELEPORT_UNLOCK_MS) {
                label = "🌀 РАЗГОН " + Math.floor(elapsed / 1000) + "/120";
            } else {
                var cd = Math.max(0, state.teleportCooldownUntil - now());
                label = cd > 0 ? "⏳ ТЕЛЕПОРТ " + (cd / 1000).toFixed(1) + "с" : "⚡ ТЕЛЕПОРТ";
            }
        } else if (!test && Date.now() < state.cooldownUntil) {
            label = "⏳ СТАБИЛИЗАЦИЯ " + Math.ceil((state.cooldownUntil - Date.now()) / 1000) + "с";
            btn.disabled = true;
            btn.style.background = "#53616a";
            btn.style.color = "#d6e4ea";
            btn.style.animation = "none";
        }
        btn.textContent = label;

        var btn2 = document.getElementById("superBtn2");
        var btnDeact = document.getElementById("superBtnDeactivate");
        if (btn2) btn2.style.display = "none";
        if (btnDeact) btnDeact.style.display = "none";

        if (status) {
            status.style.display = "block";
            status.style.borderColor = "#9deeff";
            if (state.active) {
                var elapsedSec = elapsedMs() / 1000;
                var speedPct = Math.round(Math.min(1500, elapsedSec / 120 * 1500));
                var attackPct = Math.round(attackSpeedBonus() * 100);
                var damagePct = Math.round(damageBonus() * 100);
                var reductionPct = Math.round(damageReduction() * 100);
                status.textContent = "MADE IN HEAVEN · " + elapsedSec.toFixed(1) + "/120с" +
                    " · скорость +" + speedPct + "%" +
                    " · скорость мира +" + Math.round((worldTimeMultiplier() - 1) * 100) + "%" +
                    " · атаки +" + attackPct + "%" +
                    " · урон +" + damagePct + "%" +
                    " · поглощение " + reductionPct + "%";
            } else {
                status.textContent = "SUPER: 120 секунд ускорения. Пуччи разгоняется до +1500%, боссы и их атаки — до +40%. Телепортация откроется на 50-й секунде.";
            }
        }
    }

    function drawVisuals() {
        if (!state.active) return;
        var draw = null;
        try { if (typeof ctx !== "undefined") draw = ctx; } catch (e) {}
        if (!draw || typeof draw.save !== "function") return;
        var bossCtx = context();
        if (!bossCtx) return;
        var hx = Number(bossCtx.getHeartX()) || 0;
        var hy = Number(bossCtx.getHeartY()) || 0;
        var reduced = false;
        try { reduced = typeof window.MBShouldReduceBossEffects === "function" && window.MBShouldReduceBossEffects(); } catch (e) {}

        draw.save();

        var elapsed = elapsedMs();
        var w = draw.canvas ? draw.canvas.width : 400;
        var h = draw.canvas ? draw.canvas.height : 500;
        var p = progress();
        // The sky performs a full cinematic orbit: dawn, blazing day, sunset and night.
        // Its pace rises gradually but remains tied to the +40% world-time cap.
        var cyclePhase = (elapsed / 18000) * (1 + 0.20 * p);
        var cycle = cyclePhase - Math.floor(cyclePhase);
        var theta = cycle * Math.PI * 2;
        var palettes = [
            ["#f28a62", "#7886bb", "#29365f"],
            ["#35a9f2", "#8bdcff", "#efb38d"],
            ["#f05b48", "#754274", "#20294d"],
            ["#07112a", "#16264b", "#080d20"]
        ];
        function mixHex(a, b, t) {
            var ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
            var br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
            return "rgb(" + Math.round(ar + (br - ar) * t) + "," + Math.round(ag + (bg - ag) * t) + "," + Math.round(ab + (bb - ab) * t) + ")";
        }
        var palettePos = cycle * 4;
        var paletteIndex = Math.floor(palettePos) % 4;
        var paletteBlend = palettePos - Math.floor(palettePos);
        var nextPalette = (paletteIndex + 1) % 4;
        var sky = draw.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, mixHex(palettes[paletteIndex][0], palettes[nextPalette][0], paletteBlend));
        sky.addColorStop(0.56, mixHex(palettes[paletteIndex][1], palettes[nextPalette][1], paletteBlend));
        sky.addColorStop(1, mixHex(palettes[paletteIndex][2], palettes[nextPalette][2], paletteBlend));
        draw.globalCompositeOperation = "source-over";
        draw.globalAlpha = reduced ? 0.24 : 0.39;
        draw.fillStyle = sky;
        draw.fillRect(0, 0, w, h);

        var horizonY = h * 0.54;
        var sunX = w * (0.5 - Math.cos(theta) * 0.58);
        var sunY = horizonY - Math.sin(theta) * h * 0.42;
        var sunVisible = Math.max(0, Math.min(1, Math.sin(theta) * 2.8 + 0.35));
        var nightLevel = cycle < 0.5 ? 0 : Math.max(0, Math.sin((cycle - 0.5) * Math.PI * 2));
        var moonTheta = theta + Math.PI;
        var moonX = w * (0.5 - Math.cos(moonTheta) * 0.58);
        var moonY = horizonY - Math.sin(moonTheta) * h * 0.42;

        var horizonGlow = draw.createRadialGradient(w * 0.5, horizonY, 3, w * 0.5, horizonY, w * 0.72);
        horizonGlow.addColorStop(0, "rgba(255,158,105," + (0.34 + 0.16 * (1 - nightLevel)) + ")");
        horizonGlow.addColorStop(1, "rgba(255,100,80,0)");
        draw.globalAlpha = 0.84;
        draw.fillStyle = horizonGlow;
        draw.fillRect(0, horizonY - h * 0.28, w, h * 0.58);

        // Huge sun, expanding corona and rotating rays.
        var sunRadius = (reduced ? 36 : 48) + p * 18;
        if (sunVisible > 0.02) {
            var corona = draw.createRadialGradient(sunX, sunY, sunRadius * 0.12, sunX, sunY, sunRadius * 3.2);
            corona.addColorStop(0, "rgba(255,246,205," + (0.82 * sunVisible) + ")");
            corona.addColorStop(0.24, "rgba(255,178,91," + (0.52 * sunVisible) + ")");
            corona.addColorStop(1, "rgba(255,113,68,0)");
            draw.globalAlpha = 1;
            draw.fillStyle = corona;
            draw.fillRect(sunX - sunRadius * 3.3, sunY - sunRadius * 3.3, sunRadius * 6.6, sunRadius * 6.6);
            var sunGradient = draw.createRadialGradient(sunX - sunRadius * 0.28, sunY - sunRadius * 0.30, 2, sunX, sunY, sunRadius);
            sunGradient.addColorStop(0, "#fffde2");
            sunGradient.addColorStop(0.48, "#ffe7a1");
            sunGradient.addColorStop(0.82, "#ff9f59");
            sunGradient.addColorStop(1, "#f15a48");
            draw.globalAlpha = 0.96 * sunVisible;
            draw.fillStyle = sunGradient;
            draw.beginPath();
            draw.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            draw.fill();
            if (!reduced) {
                draw.save();
                draw.translate(sunX, sunY);
                draw.rotate(elapsed / 1100);
                draw.globalAlpha = 0.28 * sunVisible;
                draw.strokeStyle = "#fff4c7";
                draw.lineWidth = 2;
                for (var ray = 0; ray < 24; ray++) {
                    var ra = ray * Math.PI * 2 / 24;
                    var rayEnd = sunRadius * (2 + 0.25 * Math.sin(elapsed / 260 + ray));
                    draw.beginPath();
                    draw.moveTo(Math.cos(ra) * sunRadius * 1.18, Math.sin(ra) * sunRadius * 1.18);
                    draw.lineTo(Math.cos(ra) * rayEnd, Math.sin(ra) * rayEnd);
                    draw.stroke();
                }
                draw.restore();
            }
        }

        // The moon travels opposite the sun; stars and meteors appear in the night half.
        if (nightLevel > 0.015) {
            var moonRadius = reduced ? 20 : 27;
            var moonGlow = draw.createRadialGradient(moonX, moonY, 2, moonX, moonY, moonRadius * 3.4);
            moonGlow.addColorStop(0, "rgba(180,218,255," + (0.52 * nightLevel) + ")");
            moonGlow.addColorStop(1, "rgba(95,151,255,0)");
            draw.globalAlpha = 1;
            draw.fillStyle = moonGlow;
            draw.fillRect(moonX - moonRadius * 3.5, moonY - moonRadius * 3.5, moonRadius * 7, moonRadius * 7);
            draw.globalAlpha = nightLevel * 0.96;
            draw.fillStyle = "#e8f2ff";
            draw.beginPath();
            draw.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
            draw.fill();
            draw.globalAlpha = nightLevel * 0.96;
            draw.fillStyle = "#172448";
            draw.beginPath();
            draw.arc(moonX + moonRadius * 0.42, moonY - moonRadius * 0.12, moonRadius * 0.92, 0, Math.PI * 2);
            draw.fill();
            var starCount = reduced ? 28 : 76;
            draw.fillStyle = "#eaf4ff";
            for (var star = 0; star < starCount; star++) {
                var sx = (star * 83.17 + 19) % w;
                var sy = (star * 47.73 + 11) % (h * 0.72);
                var twinkle = 0.45 + 0.55 * Math.abs(Math.sin(elapsed / (155 + star % 7 * 28) + star * 2.3));
                draw.globalAlpha = nightLevel * twinkle * 0.9;
                draw.beginPath();
                draw.arc(sx, sy, star % 9 === 0 ? 1.8 : 1.0, 0, Math.PI * 2);
                draw.fill();
            }
            if (!reduced && (elapsed % 1300) > 990) {
                var meteorX = ((elapsed * 0.24) % (w + 100)) - 50;
                var meteorY = h * (0.12 + ((Math.floor(elapsed / 1300) * 37) % 24) / 100);
                var meteor = draw.createLinearGradient(meteorX - 90, meteorY - 30, meteorX, meteorY);
                meteor.addColorStop(0, "rgba(130,205,255,0)");
                meteor.addColorStop(1, "rgba(235,249,255,0.95)");
                draw.globalAlpha = nightLevel;
                draw.strokeStyle = meteor;
                draw.lineWidth = 2;
                draw.beginPath();
                draw.moveTo(meteorX - 90, meteorY - 30);
                draw.lineTo(meteorX, meteorY);
                draw.stroke();
            }
        }

        // Fast cloud bands and a rotating orbital ring make the atmosphere visibly move.
        draw.globalAlpha = reduced ? 0.12 : 0.21;
        draw.strokeStyle = nightLevel > 0.45 ? "#b4d3ff" : "#fff1da";
        draw.lineWidth = reduced ? 7 : 11;
        for (var cloud = 0; cloud < 5; cloud++) {
            var cloudX = ((elapsed * (0.035 + cloud * 0.009) * (1 + 0.4 * p) + cloud * w * 0.31) % (w + 180)) - 90;
            var cloudY = h * (0.16 + cloud * 0.075);
            draw.beginPath();
            draw.moveTo(cloudX - 55, cloudY);
            draw.bezierCurveTo(cloudX - 22, cloudY - 18, cloudX + 22, cloudY + 13, cloudX + 75, cloudY - 4);
            draw.stroke();
        }
        if (!reduced) {
            draw.globalAlpha = 0.20 + p * 0.16;
            draw.strokeStyle = "#bcefff";
            draw.lineWidth = 1.5;
            draw.setLineDash([18, 22]);
            draw.beginPath();
            draw.ellipse(w * 0.5, h * 0.5, w * (0.36 + 0.06 * Math.sin(elapsed / 700)), h * 0.24, -elapsed / 3600, 0, Math.PI * 2);
            draw.stroke();
            draw.setLineDash([]);
        }
        draw.globalCompositeOperation = "lighter";
        for (var i = 0; i < state.trail.length; i++) {
            var t = state.trail[i];
            var alpha = Math.max(0, t.life / t.maxLife) * (reduced ? 0.2 : 0.38);
            draw.globalAlpha = alpha;
            draw.fillStyle = "#b8f5ff";
            draw.shadowColor = "#7ceaff";
            draw.shadowBlur = reduced ? 3 : 11;
            draw.beginPath();
            draw.arc(t.x, t.y, 3 + (1 - alpha) * 3, 0, Math.PI * 2);
            draw.fill();
        }
        var pulse = 1 + Math.sin(now() / 55) * (0.035 + p * 0.045);
        draw.globalAlpha = 0.65 + p * 0.25;
        draw.strokeStyle = "#e8fcff";
        draw.lineWidth = 1.5 + p * 1.4;
        draw.shadowColor = "#8beaff";
        draw.shadowBlur = reduced ? 4 : 10 + p * 17;
        draw.beginPath();
        draw.arc(hx, hy, 16 * pulse + p * 7, 0, Math.PI * 2);
        draw.stroke();
        if (!reduced && p > 0.25) {
            draw.globalAlpha = 0.28 + p * 0.18;
            draw.lineWidth = 1;
            draw.beginPath();
            draw.arc(hx, hy, 25 + Math.sin(now() / 90) * 4, 0, Math.PI * 2);
            draw.stroke();
        }
        if (state.teleportFlash) {
            var flash = state.teleportFlash;
            draw.globalAlpha = Math.max(0, flash.life / flash.maxLife);
            draw.strokeStyle = "#ffffff";
            draw.lineWidth = 3;
            draw.shadowBlur = 20;
            draw.beginPath();
            draw.arc(flash.x, flash.y, 12 + (1 - flash.life / flash.maxLife) * 42, 0, Math.PI * 2);
            draw.stroke();
        }
        draw.restore();
    }

    // The common outgoing-damage hook is used by arena, Living Stone,
    // Super Living Stone, Waystar, Roger/Whitebeard and Anti-Spiral.
    var oldOutgoing = window.MBKarsApplyDamageBonus;
    if (typeof oldOutgoing === "function" && !window.__mbPucciOutgoingHookInstalled) {
        window.__mbPucciOutgoingHookInstalled = true;
        window.MBKarsApplyDamageBonus = function (rawDamage) {
            var damage = oldOutgoing.apply(this, arguments);
            if (!state.active || !(Number(damage) > 0)) return damage;
            return Math.max(1, Math.floor(Number(damage) * (1 + damageBonus())));
        };
    }

    // Every supported boss routes normal incoming hits through this hook.
    var oldIncoming = window.MBKarsProcessIncomingDamage;
    if (typeof oldIncoming === "function" && !window.__mbPucciIncomingHookInstalled) {
        window.__mbPucciIncomingHookInstalled = true;
        window.MBKarsProcessIncomingDamage = function (rawDamage) {
            var damage = oldIncoming.apply(this, arguments);
            if (!state.active || !(Number(damage) > 0)) return damage;
            return Math.max(1, Math.floor(Number(damage) * (1 - damageReduction())));
        };
    }

    // Shared weapon fire-rate hook. Individual boss timers remain authoritative;
    // only the player's returned cooldown is shortened.
    var oldFireWeapon = window.firePlayerWeapon;
    if (typeof oldFireWeapon === "function" && !window.__mbPucciFireRateHookInstalled) {
        window.__mbPucciFireRateHookInstalled = true;
        window.firePlayerWeapon = function () {
            var result = oldFireWeapon.apply(this, arguments);
            var multiplier = window.MBPucciGetAttackSpeedMultiplier();
            if (state.active && result && Number(result.rate) > 0) {
                result.rate = Math.max(1, Math.floor(Number(result.rate) / multiplier));
            }
            return result;
        };
    }

    var oldToggle = window.toggleSuper;
    window.toggleSuper = function () {
        if (isPucci()) return useSuper();
        return typeof oldToggle === "function" ? oldToggle.apply(this, arguments) : undefined;
    };

    var oldUpdateButton = window.updateSuperButton;
    window.updateSuperButton = function () {
        var result = typeof oldUpdateButton === "function" ? oldUpdateButton.apply(this, arguments) : undefined;
        updateButton();
        return result;
    };

    var oldRender = window.renderSuperVisuals;
    if (typeof oldRender === "function") {
        window.renderSuperVisuals = function () {
            var result = oldRender.apply(this, arguments);
            drawVisuals();
            return result;
        };
    }

    var oldReset = window.resetAllSupers;
    if (typeof oldReset === "function") {
        window.resetAllSupers = function () {
            stopAbility(false, "reset");
            return oldReset.apply(this, arguments);
        };
    }

    // Keep the custom button responsive during cooldown and when the selected
    // card changes. The loop sleeps completely while the ability is inactive.
    window.setInterval(function () {
        try {
            if (state.active) {
                var ctx = context();
                if (!ctx || !isPucci() || ctx.type !== state.contextType) {
                    stopAbility(false, "cancel");
                } else {
                    updateButton();
                }
            } else if (isPucci() && context()) {
                updateButton();
            }
        } catch (e) {}
    }, 250);

    console.log("[MADE IN HEAVEN] Two-minute cinematic acceleration loaded.");
})();
