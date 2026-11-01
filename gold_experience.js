// Gold Experience: отдельный NPC-компаньон Джорно и общая логика GER.
(function () {
    "use strict";

    var GE_CARD = "Джорно Джованна (Gold Experience)";
    var GER_CARD = "Джорно Джованна (Gold Experience Requiem)";
    var GE_LIFE_DURATION = 6000;
    var GE_LIFE_COOLDOWN = 18000;
    var GE_LIFE_HEAL = 0.18;
    var GE_LIFE_SPEED = 1.25;
    var GE_MUDA_DURATION = 4000;
    var GE_MUDA_HITS = 30;
    var GE_MUDA_SOUND = "music/susmanz.mp3";
    var GER_DURATION = 5000;
    var GER_CHARGES = 2;

    var state = window.__mbGoldExperienceState || {
        active: false,
        activeUntil: 0,
        cooldownUntil: 0,
        heartHp: 180,
        heartMaxHp: 180,
        heartAlive: true,
        heartRespawnAt: 0,
        heartInvulnUntil: 0,
        heartLastHitAt: 0,
        lifeBurstUntil: 0,
        lifeBurstCooldownUntil: 0,
        lifeBurstRestoreSpeed: null,
        lifeBurstOriginalSpeed: null,
        lifeBurstContextType: null,
        x: 200,
        y: 360,
        vx: 0,
        vy: 0,
        nextAttackAt: 0,
        attackUntil: 0,
        combo: null,
        specialAttack: null,
        lastAttackType: null,
        attackType: null,
        comboCooldownUntil: 0,
        attackFrame: 0,
        lastMudaImpactAt: 0,
        lastMudaImpactX: 0,
        lastMudaImpactY: 0,
        lastMudaImpactIndex: 0,
        nextHealAt: 0,
        healState: "idle",
        healTimer: 0,
        healCooldownUntil: 0,
        healTotal: 0,
        healRemaining: 0,
        healSide: 1,
        healStartedAt: 0,
        lastBreath: false,
        stunTimer: 0,
        hitFlash: 0,
        aiSkill: 0.62,
        moveTargetX: 200,
        moveTargetY: 360,
        wanderTimer: 42,
        dodgeCooldown: 0,
        dodgePlanTimer: 0,
        dodgeFlashTimer: 0,
        lastThreatAttack: null,
        companionMode: "guard",
        companionModeTimer: 115,
        companionSide: -1,
        companionOffsetX: 0,
        companionOffsetY: 0,
        footworkPhase: Math.random() * Math.PI * 2,
        heartSize: 15,
        isDodging: false,
        facing: -1,
        trail: [],
        charge: 0,
        gerUntil: 0,
        gerCharges: 0,
        markUntil: 0,
        markBossType: null,
        lastHitAt: 0,
        lastHealAt: 0
    };
    window.__mbGoldExperienceState = state;
    state.heartMaxHp = Math.max(1, Number(state.heartMaxHp) || 180);
    state.heartHp = Math.max(0, Math.min(state.heartMaxHp, Number(state.heartHp) || state.heartMaxHp));
    if (typeof state.heartAlive !== "boolean") state.heartAlive = true;
    state.lifeBurstUntil = Number(state.lifeBurstUntil) || 0;
    state.lifeBurstCooldownUntil = Number(state.lifeBurstCooldownUntil) || 0;

    var rafId = 0;
    var lastFrameAt = 0;
    var mudaAudio = null;
    var mudaAudioStopTimer = 0;
    var mudaAudioToken = 0;
    var nulledActions = typeof WeakSet === "function" ? new WeakSet() : null;

    function now() {
        return (window.performance && typeof window.performance.now === "function")
            ? window.performance.now() : Date.now();
    }

    function currentCard() {
        try {
            if (window.rwbActive && typeof window.getRWBMainCard === "function") {
                var rwbCard = window.getRWBMainCard();
                if (rwbCard) return rwbCard;
            }
        } catch (e) {}
        try {
            return typeof window.getMainCard === "function" ? window.getMainCard() : null;
        } catch (e) { return null; }
    }

    function isGoldExperienceMain() {
        var card = currentCard();
        return !!(card && card.name === GE_CARD);
    }

    function isGERMain() {
        var card = currentCard();
        return !!(card && card.name === GER_CARD);
    }

    function isGiornoMain() {
        var card = currentCard();
        return !!(card && (card.name === GE_CARD || card.name === GER_CARD));
    }

    function isRequiemCompanionActive() {
        return !!(isGERMain() && state.active && state.heartAlive);
    }

    function getCombat() {
        var unique = null;
        try {
            unique = typeof window.isUniqueBossActive === "function" ? window.isUniqueBossActive() : null;
        } catch (e) {}
        var arena = window.arenaActive === true;
        try { if (typeof arenaActive !== "undefined" && arenaActive === true) arena = true; } catch (e) {}
        return { unique: unique !== null && unique !== false, bossType: unique, arena: arena, active: unique !== null && unique !== false || arena };
    }

    function getContext() {
        try {
            return typeof window.getBossContext === "function" ? window.getBossContext() : null;
        } catch (e) { return null; }
    }

    function canUseSuper(card, combat) {
        if (!card || !combat || !combat.active) return false;
        if (window.__mbBossTestMode && window.__mbBossTestAbilityMode === "passive") return false;
        if (window.__mbBossTestMode && window.__mbBossTestAbilityMode === "ultimate") return true;
        try {
            if (combat.unique) {
                return typeof window.hasMasteryUniqueSuper !== "function" || window.hasMasteryUniqueSuper(card);
            }
            return typeof window.hasMasterySuper !== "function" || window.hasMasterySuper(card);
        } catch (e) { return false; }
    }

    function toast(message, color) {
        try {
            if (typeof window.showFloatingText === "function") window.showFloatingText(message, color || "#ffe28a");
        } catch (e) {}
    }

    function addCharge(amount) {
        amount = Math.max(0, Number(amount) || 0);
        if (!amount || !isGERMain()) return;
        state.charge = Math.max(0, Math.min(100, Number(state.charge) + amount));
        updateHUD();
    }
    window.MBGERRegisterCharge = addCharge;

    function setPlayerHp(ctx, value) {
        if (!ctx || typeof ctx.setPlayerHp !== "function") return false;
        try {
            var maxHp = Math.max(1, Number(ctx.getPlayerMaxHp && ctx.getPlayerMaxHp()) || 1);
            var next = Math.max(0, Math.min(maxHp, Number(value) || 0));
            ctx.setPlayerHp(next);
            var hpEl = document.getElementById("arenaHP");
            if (hpEl) hpEl.textContent = String(Math.ceil(next));
            return true;
        } catch (e) { return false; }
    }

    function getBossPosition(ctx, playerX, playerY) {
        try {
            if (ctx && typeof ctx.getBossPosition === "function") {
                var p = ctx.getBossPosition();
                if (p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))) {
                    return { x: Number(p.x), y: Number(p.y) };
                }
            }
        } catch (e) {}
        return { x: playerX, y: Math.max(45, playerY - 170) };
    }

    function getAttackList(ctx) {
        try {
            var list = ctx && typeof ctx.getAttacks === "function" ? ctx.getAttacks() : [];
            return Array.isArray(list) ? list : [];
        } catch (e) { return []; }
    }

    function getCompanionSize(ctx) {
        var size = Math.max(7, Number(state.heartSize) || 15);
        try {
            if (ctx && typeof ctx.getHeartSize === "function") size = Number(ctx.getHeartSize()) || size;
        } catch (e) {}
        return Math.max(7, Math.min(24, size));
    }

    function getCompanionMovementSpeed(ctx) {
        var speed = 4.5;
        try {
            if (ctx && typeof ctx.getHeartSpeed === "function") speed = Number(ctx.getHeartSpeed()) || speed;
        } catch (e) {}
        if (state.lastBreath) speed *= 1.35;
        return Math.max(0.5, Math.min(12, speed));
    }

    // Oden-style danger prediction, generalized for every boss context.
    function companionThreatAt(attack, x, y, frames, alert) {
        if (!attack || attack.dioAggroNoPlayer || attack.dioStandHitOnce ||
            attack._mbGEIgnored || attack.state === "done") return null;

        var type = String(attack.type || "").toLowerCase();
        var telegraph = attack.state === "warning" || attack.state === "windup" ||
            Number(attack.warningTimer) > 0 || type.indexOf("warning") !== -1 ||
            type.indexOf("telegraph") !== -1;
        if (telegraph && !alert) return null;

        var t = Math.max(0, Number(frames) || 0);
        var ax = Number.isFinite(Number(attack.x)) ? Number(attack.x) : Number(attack.targetX);
        var ay = Number.isFinite(Number(attack.y)) ? Number(attack.y) : Number(attack.targetY);
        if (!Number.isFinite(ax) || !Number.isFinite(ay)) return null;

        if (!telegraph) {
            ax += (Number(attack.vx) || 0) * t;
            ay += (Number(attack.vy) || 0) * t;
            var gravity = Number(attack.gravity) || 0;
            if (gravity) ay += gravity * t * (t + 1) * 0.5;
        }

        var body = getCompanionSize(null) * 0.72;
        var padding = alert ? 34 : 5;
        var width = Math.max(0, Number(attack.width) || 0);
        var height = Math.max(0, Number(attack.height) || 0);
        var dx = x - ax, dy = y - ay;
        var distance = Math.hypot(dx, dy);

        if (type.indexOf("laser") !== -1 || type.indexOf("beam") !== -1) {
            var horizontal = attack.direction === "horizontal" || attack.zone === "upper" ||
                attack.zone === "lower" || attack.horizontal === true;
            var lineDistance = horizontal ? Math.abs(y - ay) : Math.abs(x - ax);
            var halfWidth = Math.max(12, (width || height || 20) * 0.5 + body + padding);
            if (lineDistance < halfWidth) {
                return { x: ax, y: ay, axis: horizontal ? "horizontal" : "vertical",
                    distance: lineDistance, attack: attack };
            }
            return null;
        }

        if (type === "ring" || type.indexOf("shockwave") !== -1) {
            var ringRadius = Math.max(0, Number(attack.radius) || Number(attack.currentRadius) || 0);
            var ringSpeed = Number(attack.speed) || Number(attack.expansionSpeed) || 0;
            ringRadius = Math.max(0, ringRadius + ringSpeed * t);
            var ringBand = Math.max(10, Number(attack.thickness) * 0.5 + body + padding);
            if (Math.abs(distance - ringRadius) < ringBand) {
                return { x: ax, y: ay, axis: "point", distance: distance,
                    radius: ringRadius, attack: attack };
            }
            return null;
        }

        if (type.indexOf("wall") !== -1 || type.indexOf("plate") !== -1 ||
            type.indexOf("gate") !== -1) {
            var halfW = Math.max(16, (width || Number(attack.size) || 28) * 0.5 + body + padding);
            var halfH = Math.max(16, (height || Number(attack.size) || 28) * 0.5 + body + padding);
            if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
                return { x: ax, y: ay, axis: "rect", distance: distance,
                    attack: attack };
            }
            return null;
        }

        var radius = Math.max(5, Number(attack.radius) || Number(attack.size) ||
            Math.max(width, height) * 0.5 || 12);
        var limit = radius + body + padding;
        if (distance < limit) {
            return { x: ax, y: ay, axis: "point", distance: distance,
                limit: limit, attack: attack };
        }
        return null;
    }

    // Simulates the same eased acceleration and braking used by Oden before judging a route.
    function predictCompanionRoute(ctx, targetX, targetY, futureTimes) {
        var maxTime = Math.max.apply(null, futureTimes);
        var wanted = Object.create(null);
        for (var i = 0; i < futureTimes.length; i++) wanted[futureTimes[i]] = true;
        var path = [];
        var maxSpeed = getCompanionMovementSpeed(ctx);
        var skill = Math.max(0.14, Math.min(1, Number(state.aiSkill) || 0.62));
        var steering = state.tsunamiEvading ? 0.28 : 0.17 + skill * 0.13;
        var x = Number(state.x) || 0, y = Number(state.y) || 0;
        var vx = Number(state.vx) || 0, vy = Number(state.vy) || 0;

        for (var frame = 0; frame <= maxTime; frame++) {
            if (wanted[frame]) path.push({ time: frame, x: x, y: y });
            if (frame === maxTime) break;
            var dx = targetX - x, dy = targetY - y;
            var distance = Math.hypot(dx, dy);
            var desiredSpeed = distance < 3 ? 0 : Math.min(maxSpeed, Math.max(0.45, distance * 0.22));
            var desiredVx = distance > 0 ? dx / distance * desiredSpeed : 0;
            var desiredVy = distance > 0 ? dy / distance * desiredSpeed : 0;
            vx += (desiredVx - vx) * steering;
            vy += (desiredVy - vy) * steering;
            var currentSpeed = Math.hypot(vx, vy);
            if (currentSpeed > maxSpeed) {
                vx = vx / currentSpeed * maxSpeed;
                vy = vy / currentSpeed * maxSpeed;
            }
            var nextX = x + vx, nextY = y + vy;
            x = Math.max(18, Math.min(382, nextX));
            y = Math.max(8, Math.min(482, nextY));
            if (x !== nextX) vx *= -0.18;
            if (y !== nextY) vy *= -0.18;
        }
        return path;
    }

    function findIncomingCompanionThreat(ctx) {
        var attacks = getAttackList(ctx);
        if (!attacks.length) return null;
        var skill = Math.max(0.14, Math.min(1, Number(state.aiSkill) || 0.62));
        var horizon = Math.round(150 + skill * 56);
        var times = [0];
        for (var t = 4; t < horizon; t += 4) times.push(t);
        if (times[times.length - 1] !== horizon) times.push(horizon);

        var tx = Number.isFinite(Number(state.moveTargetX)) ? Number(state.moveTargetX) : state.x;
        var ty = Number.isFinite(Number(state.moveTargetY)) ? Number(state.moveTargetY) : state.y;
        var route = predictCompanionRoute(ctx, tx, ty, times);
        var earliest = null, bestTime = Infinity;

        for (var a = attacks.length - 1; a >= 0; a--) {
            var attack = attacks[a];
            for (var p = 0; p < route.length; p++) {
                var point = route[p];
                var risk = companionThreatAt(attack, point.x, point.y, point.time, true);
                if (risk && point.time < bestTime) {
                    bestTime = point.time;
                    earliest = {
                        risk: risk, time: point.time, attack: attack,
                        attackType: attack.type, predictedX: point.x, predictedY: point.y
                    };
                    break;
                }
            }
        }
        return earliest;
    }

    function chooseSafeCompanionDodge(ctx, incoming) {
        var left = 24, right = 376, top = 18, bottom = 474;
        var angles = 16, distances = [88, 128, 164];
        var futureTimes = [4, 8, 13, 19, 27, 37, 49];
        var attacks = getAttackList(ctx);
        var boss = getBossPosition(ctx, state.x, state.y);
        var maxSpeed = getCompanionMovementSpeed(ctx);
        var currentSpeed = Math.hypot(Number(state.vx) || 0, Number(state.vy) || 0);
        var best = null, bestScore = -Infinity;

        for (var d = 0; d < distances.length; d++) {
            for (var k = 0; k < angles; k++) {
                var angle = k * Math.PI * 2 / angles;
                var tx = Math.max(left, Math.min(right, state.x + Math.cos(angle) * distances[d]));
                var ty = Math.max(top, Math.min(bottom, state.y + Math.sin(angle) * distances[d]));
                var route = predictCompanionRoute(ctx, tx, ty, futureTimes);
                var score = 0, collisions = 0;

                for (var p = 0; p < route.length; p++) {
                    var point = route[p];
                    for (var a = attacks.length - 1; a >= 0; a--) {
                        if (companionThreatAt(attacks[a], point.x, point.y, point.time, true)) {
                            collisions++;
                            score -= p < 2 ? 38 : 27;
                        }
                    }
                }

                if (collisions === 0) score += 180;
                if (incoming && incoming.risk) {
                    score += Math.min(180, Math.hypot(tx - incoming.risk.x, ty - incoming.risk.y)) * 0.14;
                }
                if (currentSpeed > 0.8) {
                    var routeDx = tx - state.x, routeDy = ty - state.y;
                    var routeLength = Math.hypot(routeDx, routeDy) || 1;
                    var alignment = ((Number(state.vx) || 0) * routeDx +
                        (Number(state.vy) || 0) * routeDy) / Math.max(1, currentSpeed * routeLength);
                    score += alignment * 12;
                }
                var continuity = Math.hypot(tx - (Number(state.moveTargetX) || state.x),
                    ty - (Number(state.moveTargetY) || state.y));
                score -= Math.min(80, continuity) * 0.035;
                var margin = Math.min(tx - left, right - tx, ty - top, bottom - ty);
                score += Math.min(28, Math.max(0, margin)) * 0.55;
                var bossDistance = Math.hypot(tx - boss.x, ty - boss.y);
                if (bossDistance < 132) score -= (132 - bossDistance) * 2.25;
                else score += Math.min(70, bossDistance - 132) * 0.12;
                score += Math.random() * 1.5;
                if (score > bestScore) {
                    bestScore = score;
                    best = { x: tx, y: ty, safe: collisions === 0 };
                }
            }
        }
        return best || {
            x: Math.max(left, Math.min(right, state.x + (state.x < 200 ? 100 : -100))),
            y: Math.max(top, Math.min(bottom, state.y - 55)),
            safe: false
        };
    }

    function chooseCompanionGoal(ctx, playerX, playerY, boss, frameScale) {
        var playerHp = Math.max(0, Number(ctx.getPlayerHp && ctx.getPlayerHp()) || 0);
        var playerMaxHp = Math.max(1, Number(ctx.getPlayerMaxHp && ctx.getPlayerMaxHp()) || 1);
        state.companionModeTimer = Math.max(0, (Number(state.companionModeTimer) || 0) - frameScale);
        if (state.companionModeTimer <= 0) {
            var lowHp = playerHp / playerMaxHp < 0.45;
            state.companionMode = lowHp
                ? (Math.random() < 0.78 ? "guard" : "roam")
                : (Math.random() < 0.52 ? "guard" : "roam");
            state.companionSide = Math.random() < 0.5 ? -1 : 1;
            state.companionOffsetX = (Math.random() - 0.5) * 24;
            state.companionOffsetY = (Math.random() - 0.5) * 18;
            state.companionModeTimer = state.companionMode === "guard"
                ? 95 + Math.floor(Math.random() * 85)
                : 125 + Math.floor(Math.random() * 125);
        }

        if (state.healState !== "idle") {
            var healSide = Number(state.healSide) || 1;
            return {
                x: Math.max(30, Math.min(370, playerX + healSide * 43)),
                y: Math.max(28, Math.min(456, playerY - 7))
            };
        }

        var bossX = Number(boss && boss.x);
        var bossY = Number(boss && boss.y);
        var hasBoss = Number.isFinite(bossX) && Number.isFinite(bossY);
        var side = Number(state.companionSide) || 1;
        var targetX = playerX + side * 48 + (Number(state.companionOffsetX) || 0);
        var targetY = playerY - 12 + (Number(state.companionOffsetY) || 0);

        if (hasBoss) {
            if (state.companionMode === "guard") {
                targetX = targetX * 0.72 + (bossX + Math.max(-18, Math.min(18, (Number(boss.vx) || 0) * 4))) * 0.28;
            } else {
                state.wanderTimer = Math.max(0, (Number(state.wanderTimer) || 0) - frameScale);
                if (state.wanderTimer <= 0 ||
                    Math.hypot(state.moveTargetX - state.x, state.moveTargetY - state.y) < 18) {
                    state.companionOffsetX = (Math.random() - 0.5) * 110;
                    state.companionOffsetY = -24 - Math.random() * 58;
                    state.wanderTimer = 42 + Math.floor(Math.random() * 54);
                }
                targetX = bossX + (Number(state.companionOffsetX) || 0) * 0.55;
                targetY = playerY - 26 + (Number(state.companionOffsetY) || 0) * 0.45;
            }
        }
        targetX = Math.max(28, Math.min(372, targetX));
        targetY = Math.max(18, Math.min(476, targetY));
        return { x: targetX, y: targetY };
    }

    function spawnHitEffect(x, y, color) {
        try {
            if (typeof window.addWaystarShockwave === "function") {
                window.addWaystarShockwave(x, y, color || "#f7d95d", 48, 10, 2);
            } else if (typeof window.addShockwaveRing === "function") {
                window.addShockwaveRing(x, y, color || "#f7d95d", 48, 10, 2);
            }
        } catch (e) {}
    }

    function getUniqueBossTarget(ctx, targetId) {
        try {
            if (ctx && ctx.type !== "arena" && typeof window.getDioUniqueBossTarget === "function") {
                return window.getDioUniqueBossTarget(ctx, targetId) || null;
            }
        } catch (e) {}
        return null;
    }

    function stopMudaMusic() {
        mudaAudioToken++;
        if (mudaAudioStopTimer && typeof window.clearTimeout === "function") {
            window.clearTimeout(mudaAudioStopTimer);
        }
        mudaAudioStopTimer = 0;
        if (mudaAudio) {
            try {
                mudaAudio.pause();
                mudaAudio.currentTime = 0;
            } catch (e) {}
        }
    }

    function startMudaMusic() {
        stopMudaMusic();
        var token = mudaAudioToken;
        var playedBySharedAudio = false;
        try {
            if (typeof window.dioPlaySound === "function") {
                var sharedAudio = window.dioPlaySound(GE_MUDA_SOUND, 0.82);
                if (sharedAudio) {
                    mudaAudio = sharedAudio;
                    playedBySharedAudio = true;
                }
            }
        } catch (e) {}

        try {
            if (!mudaAudio) {
                mudaAudio = new Audio();
                mudaAudio.preload = "auto";
                mudaAudio.src = GE_MUDA_SOUND;
            }
            if (!playedBySharedAudio) {
                mudaAudio.pause();
                mudaAudio.currentTime = 0;
                mudaAudio.volume = 0.82;
                mudaAudio.playbackRate = 1;
                var playPromise = mudaAudio.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {});
                }
            }
        } catch (e) {}

        if (typeof window.setTimeout === "function") {
            mudaAudioStopTimer = window.setTimeout(function () {
                if (token === mudaAudioToken) stopMudaMusic();
            }, GE_MUDA_DURATION);
        }
    }

    function damageRequiemHeart(rawDamage, sourceAction) {
        if (!isRequiemCompanionActive()) return false;
        if (sourceAction && sourceAction._mbGERHeartDamageApplied) return true;
        if (sourceAction && typeof sourceAction === "object") sourceAction._mbGERHeartDamageApplied = true;
        var current = now();
        if (current < state.heartInvulnUntil) return true;
        var damage = Math.max(4, Math.min(18, Math.ceil((Number(rawDamage) || 12) * 0.45)));
        if (state.lastBreath) damage *= 0.2;
        state.heartHp = Math.max(0, Number(state.heartHp) - damage);
        state.heartLastHitAt = current;
        state.heartInvulnUntil = current + (state.lastBreath ? 400 : 1067);
        state.hitFlash = 12;
        addCharge(8);
        spawnHitEffect(state.x, state.y, state.lastBreath ? "#ff5268" : "#ffe887");
        if (state.heartHp > 0 && !state.lastBreath &&
            state.heartHp <= Math.max(1, state.heartMaxHp) * 0.25) {
            state.lastBreath = true;
            state.healState = "idle";
            state.healTimer = 0;
            state.healRemaining = 0;
            state.healTotal = 0;
            state.dodgeCooldown = 0;
            state.dodgePlanTimer = 0;
            toast("GOLDEN HEART: ПОСЛЕДНИЙ ВЗДОХ!", "#ff5268");
        }
        if (state.heartHp <= 0) {
            state.heartHp = 0;
            state.heartAlive = false;
            state.heartRespawnAt = current + 4800;
            state.lastBreath = false;
            finishMudaCombo();
            state.specialAttack = null;
            state.attackType = null;
            toast("GOLDEN HEART ВЫБЫЛ · ВОССТАНОВЛЕНИЕ 4,8 СЕК.", "#ffbb72");
        }
        updateHUD();
        return true;
    }

    function applyCompanionBossDamage(ctx, target, amount) {
        if (target && typeof window.MBDioApplyBossDamage === "function") {
            try { window.MBDioApplyBossDamage(target.type, target.id, amount); return true; }
            catch (e) { return false; }
        }
        if (ctx && ctx.type === "arena") {
            var before = Number(ctx.getBossHp && ctx.getBossHp()) || 0;
            if (!(before > 0)) return false;
            var damage = Math.max(1, Math.floor(Number(amount) || 1));
            try {
                if (typeof window.MBKarsApplyDamageBonus === "function") damage = window.MBKarsApplyDamageBonus(damage);
                ctx.setBossMaxHp(Math.max(0, before - damage));
                return Number(ctx.getBossHp()) < before;
            } catch (e) {}
        }
        return false;
    }

    function getAttackBossMaxHp(ctx, target) {
        var hp = Number(target && target.maxHp) || 0;
        if (!(hp > 0) && ctx && typeof ctx.getBossMaxHp === "function") {
            try { hp = Number(ctx.getBossMaxHp()) || 0; } catch (e) {}
        }
        if (!(hp > 0) && ctx && typeof ctx.getBossHp === "function") {
            try { hp = Number(ctx.getBossHp()) || 0; } catch (e) {}
        }
        return Math.max(1, hp);
    }

    function finishMudaCombo() {
        state.combo = null;
        state.attackFrame = 0;
        state.attackType = null;
        stopMudaMusic();
    }

    function beginMudaCombo(ctx, target, card) {
        if (!ctx || now() < state.comboCooldownUntil) return false;
        if (ctx.type !== "arena" && !target) return false;
        var current = now();
        var maxHp = getAttackBossMaxHp(ctx, target);
        var total = Math.max(6, Math.floor(maxHp * 0.012 * (state.lastBreath ? 1.6 : 1)));
        var comboDuration = state.lastBreath ? Math.round(GE_MUDA_DURATION / 1.65) : GE_MUDA_DURATION;
        var boss = target || getBossPosition(ctx, state.x, state.y);
        state.combo = {
            type: ctx.type,
            id: target ? target.id : null,
            total: total,
            hitIndex: 0,
            hitCount: GE_MUDA_HITS,
            nextHitAt: current,
            startedAt: current,
            duration: comboDuration,
            endsAt: current + comboDuration,
            x: Number(boss.x) || state.x,
            y: Number(boss.y) || state.y
        };
        state.comboCooldownUntil = current + comboDuration + (state.lastBreath ? 300 : 1100);
        state.nextAttackAt = state.comboCooldownUntil;
        state.attackUntil = current + 150;
        state.attackFrame = 0;
        state.attackType = "muda";
        state.lastAttackType = "muda";
        toast("GOLD EXPERIENCE: MUDA MUDA MUDA!", "#ffe28a");
        spawnHitEffect(state.x, state.y, "#ffe28a");
        startMudaMusic();
        return true;
    }

    function updateMudaCombo(ctx) {
        var combo = state.combo;
        if (!combo) return;
        var current = now();
        if (!ctx || ctx.type !== combo.type) {
            finishMudaCombo();
            return;
        }

        var target = combo.type === "arena" ? null : getUniqueBossTarget(ctx, combo.id);
        if (combo.type !== "arena" && !target) {
            finishMudaCombo();
            return;
        }
        var boss = target || getBossPosition(ctx, state.x, state.y);
        combo.x = Number(boss.x) || combo.x;
        combo.y = Number(boss.y) || combo.y;

        var hitInterval = (Number(combo.duration) || GE_MUDA_DURATION) / GE_MUDA_HITS;
        while (combo.hitIndex < combo.hitCount &&
            current >= combo.startedAt + combo.hitIndex * hitInterval) {
            var previousIndex = combo.hitIndex;
            combo.hitIndex++;
            state.attackFrame = combo.hitIndex;
            var hitDamage = Math.floor(combo.total * combo.hitIndex / combo.hitCount) -
                Math.floor(combo.total * previousIndex / combo.hitCount);
            if (hitDamage > 0) applyCompanionBossDamage(ctx, target, hitDamage);
            combo.nextHitAt = combo.startedAt + combo.hitIndex * hitInterval;
            state.attackUntil = current + 145;
            state.lastMudaImpactAt = current;
            state.lastMudaImpactX = combo.x + (Math.random() - 0.5) * 7;
            state.lastMudaImpactY = combo.y + (Math.random() - 0.5) * 7;
            state.lastMudaImpactIndex = combo.hitIndex;
        }

        if (current >= combo.endsAt) {
            finishMudaCombo();
        }
    }

    function beginSpecialAttack(ctx, target, type) {
        if (!ctx || (ctx.type !== "arena" && !target)) return false;
        var current = now();
        var seeds = type === "seeds";
        var duration = seeds ? 1250 : 1500;
        var hitCount = seeds ? 5 : 4;
        var firstHitDelay = seeds ? 340 : 300;
        var interval = seeds ? 155 : 330;
        var attackRate = state.lastBreath ? 1.65 : 1;
        duration = Math.max(1, Math.round(duration / attackRate));
        firstHitDelay = Math.max(1, Math.round(firstHitDelay / attackRate));
        interval = Math.max(1, Math.round(interval / attackRate));
        var damagePercent = seeds ? 0.0085 : 0.009;
        var maxHp = getAttackBossMaxHp(ctx, target);
        var boss = target || getBossPosition(ctx, state.x, state.y);

        state.specialAttack = {
            type: type,
            targetType: ctx.type,
            targetId: target ? target.id : null,
            total: Math.max(4, Math.floor(maxHp * damagePercent * (state.lastBreath ? 1.6 : 1))),
            hitIndex: 0,
            hitCount: hitCount,
            nextHitAt: current + firstHitDelay,
            interval: interval,
            startedAt: current,
            endsAt: current + duration,
            firstHitDelay: firstHitDelay,
            x: Number(boss.x) || state.x,
            y: Number(boss.y) || state.y
        };
        state.attackType = type;
        state.lastAttackType = type;
        state.nextAttackAt = current + duration + Math.round(1350 / attackRate);
        state.attackUntil = current + 320;
        if (seeds) {
            toast("GOLD EXPERIENCE: LIFE SEEDS!", "#8dffae");
            spawnHitEffect(state.x, state.y, "#8dffae");
        } else {
            toast("GOLD EXPERIENCE: VINE BIND!", "#8dffae");
            spawnHitEffect(Number(boss.x) || state.x, Number(boss.y) || state.y, "#8dffae");
        }
        return true;
    }

    function updateSpecialAttack(ctx) {
        var attack = state.specialAttack;
        if (!attack) return;
        var current = now();
        if (!ctx || ctx.type !== attack.targetType) {
            state.specialAttack = null;
            state.attackType = null;
            return;
        }

        var target = attack.targetType === "arena" ? null : getUniqueBossTarget(ctx, attack.targetId);
        if (attack.targetType !== "arena" && !target) {
            state.specialAttack = null;
            state.attackType = null;
            return;
        }
        var boss = target || getBossPosition(ctx, state.x, state.y);
        attack.x = Number(boss.x) || attack.x;
        attack.y = Number(boss.y) || attack.y;

        while (attack.hitIndex < attack.hitCount && current >= attack.nextHitAt) {
            var previousIndex = attack.hitIndex;
            attack.hitIndex++;
            var hitDamage = Math.floor(attack.total * attack.hitIndex / attack.hitCount) -
                Math.floor(attack.total * previousIndex / attack.hitCount);
            if (hitDamage > 0) applyCompanionBossDamage(ctx, target, hitDamage);
            attack.nextHitAt += attack.interval;
            state.attackUntil = current + 140;
            spawnHitEffect(
                attack.x + (Math.random() - 0.5) * 28,
                attack.y + (Math.random() - 0.5) * 22,
                "#8dffae"
            );
        }

        if (current >= attack.endsAt) {
            state.specialAttack = null;
            state.attackType = null;
        }
    }

    function beginCompanionAttack(ctx, target, distance) {
        var choices = [];
        if (distance <= 135) choices.push("muda", "muda", "muda");
        if (distance <= 185) choices.push("vines", "vines");
        if (distance <= 230) choices.push("seeds", "seeds");
        if (!choices.length) return false;

        var freshChoices = choices.filter(function (type) {
            return type !== state.lastAttackType;
        });
        if (!freshChoices.length) freshChoices = choices;
        var selected = freshChoices[Math.floor(Math.random() * freshChoices.length)];

        if (selected === "muda") return beginMudaCombo(ctx, target, currentCard());
        return beginSpecialAttack(ctx, target, selected);
    }

    function beginCompanionHeal(ctx, playerX, playerY, playerMaxHp, current) {
        state.healState = "approach";
        state.healTimer = 300;
        state.healTotal = playerMaxHp * 0.15;
        state.healRemaining = state.healTotal;
        state.healSide = state.x <= playerX ? -1 : 1;
        state.healCooldownUntil = current + 40000;
        state.attackUntil = 0;
        state.combo = null;
        state.specialAttack = null;
        state.attackType = null;
        state.healStartedAt = current;
        toast("GOLD EXPERIENCE REQUIEM: ЖИЗНЕННАЯ ЭНЕРГИЯ!", "#9cffaa");
        spawnHitEffect(playerX, playerY, "#9cffaa");
    }

    function updateCompanion(dt) {
        if (!state.active || !isGERMain()) return;
        var current = now();
        if (!state.heartAlive) {
            if (current >= state.heartRespawnAt) {
                state.heartAlive = true;
                state.heartHp = state.heartMaxHp;
                state.lastBreath = false;
                state.heartInvulnUntil = current + 900;
                state.nextAttackAt = current + 650;
                toast("✦ GOLD EXPERIENCE REQUIEM ВЕРНУЛСЯ!", "#ffe88a");
            } else {
                return;
            }
        }

        var ctx = getContext();
        if (!ctx || typeof ctx.getHeartX !== "function" || typeof ctx.getHeartY !== "function") return;
        var frameScale = Math.max(0.35, Math.min(2.2, (Number(dt) || 16.667) / 16.667));
        var playerX = Number(ctx.getHeartX()) || 200;
        var playerY = Number(ctx.getHeartY()) || 400;
        var playerHp = Math.max(0, Number(ctx.getPlayerHp && ctx.getPlayerHp()) || 0);
        var playerMaxHp = Math.max(1, Number(ctx.getPlayerMaxHp && ctx.getPlayerMaxHp()) || 1);
        var boss = getBossPosition(ctx, playerX, playerY);

        state.heartSize = getCompanionSize(ctx);
        state.aiSkill = Math.min(0.99, (Number(state.aiSkill) || 0.62) + 0.00055 * frameScale);
        if (state.heartHp > 0 && !state.lastBreath &&
            state.heartHp <= Math.max(1, state.heartMaxHp) * 0.25) {
            state.lastBreath = true;
            state.healState = "idle";
            state.healTimer = 0;
            state.healRemaining = 0;
            state.healTotal = 0;
            state.dodgeCooldown = 0;
            state.dodgePlanTimer = 0;
            toast("GOLDEN HEART: ПОСЛЕДНИЙ ВЗДОХ!", "#ff5268");
            spawnHitEffect(state.x, state.y, "#ff5268");
        }

        // Copy Oden's support trigger, with the requested 40% player-HP threshold.
        if (!state.lastBreath && state.healState === "idle" &&
            current >= (Number(state.healCooldownUntil) || 0) &&
            playerHp > 0 && playerHp < playerMaxHp * 0.40 &&
            (Number(state.stunTimer) || 0) <= 0) {
            beginCompanionHeal(ctx, playerX, playerY, playerMaxHp, current);
        }

        if (state.stunTimer > 0) {
            state.stunTimer = Math.max(0, state.stunTimer - frameScale);
            state.vx *= 0.72;
            state.vy *= 0.72;
            state.moveTargetX = state.x;
            state.moveTargetY = state.y;
        }

        if (state.dodgeCooldown > 0) state.dodgeCooldown = Math.max(0, state.dodgeCooldown - frameScale);
        if (state.dodgePlanTimer > 0) state.dodgePlanTimer = Math.max(0, state.dodgePlanTimer - frameScale);
        if (state.dodgeFlashTimer > 0) state.dodgeFlashTimer = Math.max(0, state.dodgeFlashTimer - frameScale);
        if (state.hitFlash > 0) state.hitFlash = Math.max(0, state.hitFlash - frameScale);

        var goal = chooseCompanionGoal(ctx, playerX, playerY, boss, frameScale);
        state.moveTargetX = goal.x;
        state.moveTargetY = goal.y;
        if (state.lastBreath && boss) {
            var rushX = state.x - boss.x;
            var rushY = state.y - boss.y;
            var rushLength = Math.max(1, Math.hypot(rushX, rushY));
            state.moveTargetX = Math.max(18, Math.min(382, boss.x + rushX / rushLength * 42));
            state.moveTargetY = Math.max(8, Math.min(482, boss.y + rushY / rushLength * 42));
        }

        var incoming = state.stunTimer > 0 ? null : findIncomingCompanionThreat(ctx);
        var urgentThreat = !!incoming && incoming.time <= 8;
        var newThreat = !!incoming && incoming.attack !== state.lastThreatAttack;
        var dodging = false;

        if (!state.lastBreath && incoming &&
            incoming.time <= Math.round(96 + state.aiSkill * 34) &&
            (state.dodgeCooldown <= 0 || urgentThreat || state.healState !== "idle") &&
            (state.dodgePlanTimer <= 0 || urgentThreat || state.healState !== "idle" ||
                (newThreat && incoming.time <= 22))) {
            var safeTarget = chooseSafeCompanionDodge(ctx, incoming);
            state.moveTargetX = safeTarget.x;
            state.moveTargetY = safeTarget.y;
            state.wanderTimer = 28 + Math.floor((1 - state.aiSkill) * 12);
            state.dodgePlanTimer = Math.max(8, Math.round(19 - state.aiSkill * 7));
            state.lastThreatAttack = incoming.attack || null;
            state.dodgeCooldown = incoming.time <= 12
                ? Math.max(3, Math.round(8 - state.aiSkill * 3))
                : Math.max(6, Math.round(14 - state.aiSkill * 5));
            state.dodgeFlashTimer = 13;
            dodging = true;
            spawnHitEffect(state.x, state.y, "#8bffad");
        } else if (incoming && state.dodgePlanTimer > 0) {
            dodging = true;
        } else if (!incoming && state.dodgePlanTimer <= 0) {
            state.lastThreatAttack = null;
        }

        state.isDodging = dodging;
        // Match Oden's smooth movement: accelerate into a chosen route, then brake naturally.
        var calmFootwork = !incoming && !dodging && state.healState === "idle";
        var driftX = calmFootwork ? Math.sin(current / 420 + (Number(state.footworkPhase) || 0)) * 4.2 : 0;
        var driftY = calmFootwork ? Math.cos(current / 610 + (Number(state.footworkPhase) || 0)) * 3.0 : 0;
        var toX = state.moveTargetX + driftX - state.x;
        var toY = state.moveTargetY + driftY - state.y;
        var distance = Math.hypot(toX, toY) || 1;
        var maxSpeed = getCompanionMovementSpeed(ctx);
        var desiredSpeed = distance < (calmFootwork ? 7 : 2)
            ? 0 : Math.min(maxSpeed, Math.max(0.45, distance * 0.22));
        var desiredVx = distance > 0 ? toX / distance * desiredSpeed : 0;
        var desiredVy = distance > 0 ? toY / distance * desiredSpeed : 0;
        var steering = urgentThreat ? 0.33 : (0.14 + state.aiSkill * 0.12);
        state.vx += (desiredVx - state.vx) * steering;
        state.vy += (desiredVy - state.vy) * steering;
        var currentSpeed = Math.hypot(state.vx, state.vy);
        if (currentSpeed > maxSpeed) {
            state.vx = state.vx / currentSpeed * maxSpeed;
            state.vy = state.vy / currentSpeed * maxSpeed;
        }
        var nextX = state.x + state.vx * frameScale;
        var nextY = state.y + state.vy * frameScale;
        state.x = Math.max(18, Math.min(382, nextX));
        state.y = Math.max(8, Math.min(482, nextY));
        if (state.x !== nextX) state.vx *= -0.18;
        if (state.y !== nextY) state.vy *= -0.18;

        state.trail.push({ x: state.x, y: state.y, life: 10 });
        if (state.trail.length > 9) state.trail.shift();
        for (var tr = state.trail.length - 1; tr >= 0; tr--) state.trail[tr].life -= frameScale;
        while (state.trail.length && state.trail[0].life <= 0) state.trail.shift();

        if (state.healState === "approach" &&
            Math.hypot(state.x - playerX, state.y - playerY) <= 58) {
            state.healState = "channel";
            state.stunTimer = Math.max(0, Number(state.stunTimer) || 0);
            toast("GOLDEN HEART: ЛЕЧЕНИЕ · 5 СЕКУНД", "#9affc8");
        }

        if (state.healState === "channel") {
            var closeToPlayer = Math.hypot(state.x - playerX, state.y - playerY) <= 82;
            if (!closeToPlayer) {
                state.healState = "approach";
            } else if (!dodging && state.stunTimer <= 0) {
                var hpBefore = Math.max(0, Number(ctx.getPlayerHp()) || 0);
                var healStep = Math.min(Math.max(0, Number(state.healRemaining) || 0),
                    Math.max(0, Number(state.healTotal) || playerMaxHp * 0.15) / 300 * frameScale);
                if (healStep > 0) setPlayerHp(ctx, hpBefore + healStep);
                var healed = Math.max(0, Math.min(playerMaxHp, Number(ctx.getPlayerHp()) || 0) - hpBefore);
                state.healRemaining = Math.max(0, state.healRemaining - healed);
                state.healTimer = Math.max(0, state.healTimer - frameScale);
                if (state.healTimer <= 0 || state.healRemaining <= 0.001) {
                    state.healState = "idle";
                    state.healTimer = 0;
                    state.healRemaining = 0;
                    state.healTotal = 0;
                    state.healCooldownUntil = current + 40000;
                    state.companionMode = "guard";
                    state.companionModeTimer = 105;
                    toast("GOLDEN HEART: ДЕРЖИСЬ!", "#9affcf");
                }
            }
        }

        if (state.healState !== "idle" || state.stunTimer > 0) {
            state.attackUntil = 0;
            state.combo = null;
            state.specialAttack = null;
            state.attackType = null;
        } else {
            if (state.combo) updateMudaCombo(ctx);
            else if (state.specialAttack) updateSpecialAttack(ctx);
            var target = getUniqueBossTarget(ctx);
            var targetX = target ? Number(target.x) : boss.x;
            var targetY = target ? Number(target.y) : boss.y;
            var bossDistance = Math.hypot(state.x - targetX, state.y - targetY);
            if (!state.combo && !state.specialAttack &&
                current >= state.nextAttackAt && bossDistance <= 230) {
                beginCompanionAttack(ctx, target, bossDistance);
            }
        }
    }

    function drawSpecialAttackEffects(c, current) {
        var attack = state.specialAttack;
        if (!attack) return;
        var elapsed = Math.max(0, current - attack.startedAt);
        c.save();

        if (attack.type === "seeds") {
            var fromX = state.x + state.facing * 18;
            var fromY = state.y - 8;
            for (var i = 0; i < attack.hitCount; i++) {
                var age = elapsed - i * 145;
                if (age < 0 || age > 650) continue;
                var progress = Math.max(0, Math.min(1, age / 650));
                var x = fromX + (attack.x - fromX) * progress;
                var y = fromY + (attack.y - fromY) * progress -
                    Math.sin(progress * Math.PI) * 38 + Math.sin(current / 55 + i) * 3;
                c.globalAlpha = Math.max(0, 1 - progress * 0.35);
                c.fillStyle = "#a8ffc0";
                c.shadowColor = "#62ff9a";
                c.shadowBlur = 12;
                c.beginPath();
                c.arc(x, y, 3.2 + Math.sin(current / 40 + i) * 0.7, 0, Math.PI * 2);
                c.fill();
                c.shadowBlur = 0;
                c.strokeStyle = "rgba(145,255,180,.55)";
                c.lineWidth = 1.2;
                c.beginPath();
                c.moveTo(x - (attack.x - fromX) * 0.035, y - (attack.y - fromY) * 0.035);
                c.lineTo(x, y);
                c.stroke();
            }
        } else if (attack.type === "vines") {
            var grow = Math.max(0, Math.min(1, (elapsed - 80) / 520));
            c.globalAlpha = 0.9;
            c.strokeStyle = "#72e99b";
            c.lineWidth = 3;
            c.lineCap = "round";
            c.shadowColor = "#52ff91";
            c.shadowBlur = 8;
            for (var vine = 0; vine < 5; vine++) {
                var angle = vine * Math.PI * 2 / 5 + elapsed / 950;
                var outerX = attack.x + Math.cos(angle) * 62;
                var outerY = attack.y + Math.sin(angle) * 42;
                var innerX = attack.x + Math.cos(angle + 0.8) * 9;
                var innerY = attack.y + Math.sin(angle + 0.8) * 8;
                c.beginPath();
                c.moveTo(attack.x + (outerX - attack.x) * (1 - grow), attack.y + (outerY - attack.y) * (1 - grow));
                c.quadraticCurveTo(
                    attack.x + Math.cos(angle + 0.45) * 48,
                    attack.y + Math.sin(angle + 0.45) * 34,
                    innerX,
                    innerY
                );
                c.stroke();
                c.fillStyle = "#b4ffc4";
                c.beginPath();
                c.ellipse(
                    attack.x + Math.cos(angle + 0.45) * 32,
                    attack.y + Math.sin(angle + 0.45) * 25,
                    4,
                    2,
                    angle,
                    0,
                    Math.PI * 2
                );
                c.fill();
            }
        }
        c.restore();
    }

    function drawGoldExperience(c) {
        if (!state.active || !isGERMain()) return;
        var current = now();
        var ctx = getContext();
        var size = getCompanionSize(ctx);
        state.heartSize = size;
        var scale = size / 15;
        var invulnerable = current < state.heartInvulnUntil;
        var healing = state.healState !== "idle";
        var dodging = !!state.isDodging || state.dodgeFlashTimer > 0;
        var attacking = !!(state.combo || state.specialAttack || current < state.attackUntil);
        var bob = Math.sin(current / 170) * 1.1;

        function heartPath(target, radius) {
            target.beginPath();
            target.moveTo(0, radius * 0.72);
            target.bezierCurveTo(-radius * 1.35, -radius * 0.15,
                -radius * 0.72, -radius * 1.08, 0, -radius * 0.42);
            target.bezierCurveTo(radius * 0.72, -radius * 1.08,
                radius * 1.35, -radius * 0.15, 0, radius * 0.72);
            target.closePath();
        }

        // The trail stays the same small scale as the player's heart.
        c.save();
        c.globalCompositeOperation = "lighter";
        for (var i = 0; i < state.trail.length; i++) {
            var tr = state.trail[i];
            var alpha = Math.max(0, tr.life / 10) * 0.17;
            if (alpha <= 0) continue;
            c.save();
            c.translate(tr.x, tr.y);
            c.scale(scale * 0.48, scale * 0.48);
            c.globalAlpha = alpha;
            c.fillStyle = "#ffd75a";
            heartPath(c, 8);
            c.fill();
            c.restore();
        }
        c.restore();

        if (!state.heartAlive) {
            c.save();
            c.globalAlpha = 0.42 + Math.sin(current / 180) * 0.12;
            c.strokeStyle = "#e7bd57";
            c.lineWidth = 1.5;
            c.setLineDash([3, 3]);
            c.beginPath();
            c.ellipse(state.x, state.y, size * 1.25, size * 0.95, 0, 0, Math.PI * 2);
            c.stroke();
            c.setLineDash([]);
            c.font = "bold 7px Arial";
            c.textAlign = "center";
            c.fillStyle = "#f7d97b";
            c.fillText("ВОССТАНОВЛЕНИЕ", state.x, state.y - size - 7);
            c.restore();
            return;
        }

        c.save();
        c.translate(state.x, state.y + bob);
        c.rotate(Math.max(-0.18, Math.min(0.18, (Number(state.vx) || 0) * 0.018)));
        c.scale(scale, scale);
        c.globalAlpha = invulnerable ? (0.56 + Math.sin(current / 36) * 0.25) : 0.99;

        var halo = c.createRadialGradient(0, 0, 2, 0, 0, 23);
        halo.addColorStop(0, state.lastBreath ? "rgba(255,55,78,.42)" :
            (healing ? "rgba(126,255,166,.34)" : "rgba(255,218,105,.32)"));
        halo.addColorStop(1, "rgba(255,190,55,0)");
        c.fillStyle = halo;
        c.beginPath();
        c.ellipse(0, 1, 23, 18, 0, 0, Math.PI * 2);
        c.fill();

        if (dodging) {
            c.strokeStyle = "#a8ff9a";
            c.lineWidth = 1.8;
            c.shadowColor = "#9dff8b";
            c.shadowBlur = 12;
            c.globalAlpha *= 0.9;
            c.beginPath();
            c.ellipse(0, 0, 23 + Math.sin(current / 35) * 2, 17, 0, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;
        } else if (healing) {
            c.strokeStyle = "#8bffbd";
            c.lineWidth = 2;
            c.shadowColor = "#65ffac";
            c.shadowBlur = 13;
            c.beginPath();
            c.ellipse(0, 0, 22 + Math.sin(current / 90) * 1.5, 17, 0, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;
        }

        var heartGradient = c.createLinearGradient(0, -16, 0, 12);
        heartGradient.addColorStop(0, invulnerable ? "#fffbe3" : (state.lastBreath ? "#ffd5dc" : "#fff2ad"));
        heartGradient.addColorStop(0.38, state.lastBreath ? "#ff657d" : "#ffd958");
        heartGradient.addColorStop(0.72, state.lastBreath ? "#bd163d" : "#efa72d");
        heartGradient.addColorStop(1, state.lastBreath ? "#4c071e" : "#b96a1a");
        c.fillStyle = heartGradient;
        c.strokeStyle = state.lastBreath ? "#3a0617" : "#704313";
        c.lineWidth = 1.2;
        c.shadowColor = "#ffd34f";
        c.shadowBlur = attacking ? 16 : 9;
        heartPath(c, 15);
        c.fill();
        c.stroke();
        c.shadowBlur = 0;

        // Living vines replace Oden's purple cloth, preserving his wrapped-heart silhouette.
        c.save();
        heartPath(c, 15);
        c.clip();
        c.lineCap = "round";
        for (var band = -1; band <= 1; band++) {
            c.strokeStyle = "#3a9850";
            c.lineWidth = 3.4;
            c.beginPath();
            c.moveTo(-23, band * 9 - 6);
            c.bezierCurveTo(-10, band * 8 - 1, 5, band * 8 + 2, 22, band * 8 + 8);
            c.stroke();
            c.strokeStyle = "#bcf58a";
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(-22, band * 9 - 6);
            c.bezierCurveTo(-10, band * 8 - 1, 5, band * 8 + 2, 21, band * 8 + 8);
            c.stroke();
        }
        c.restore();

        // Central green life gem and tiny leaves.
        c.save();
        c.shadowColor = "#8dff9d";
        c.shadowBlur = 7;
        c.fillStyle = "#58d878";
        c.strokeStyle = "#236d39";
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(0, -5.5);
        c.lineTo(4.1, -1.2);
        c.lineTo(0, 3.4);
        c.lineTo(-4.1, -1.2);
        c.closePath();
        c.fill();
        c.stroke();
        c.shadowBlur = 0;
        c.strokeStyle = "#d9ffac";
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(-1.5, -1.4);
        c.lineTo(1.1, 1.1);
        c.stroke();
        c.restore();

        c.globalAlpha *= 0.8;
        c.strokeStyle = "rgba(255,255,220,.8)";
        c.lineWidth = 1;
        c.beginPath();
        c.arc(-4, -8, 2.4, Math.PI * 1.05, Math.PI * 1.8);
        c.stroke();
        c.restore();

        // Compact HP bar, like Oden's, without enlarging the companion.
        var hpRatio = Math.max(0, Math.min(1, state.heartHp / Math.max(1, state.heartMaxHp)));
        var barWidth = 30 * scale;
        var barX = state.x - barWidth / 2;
        var barY = state.y + size * 0.92;
        c.save();
        c.globalAlpha = 0.88;
        c.fillStyle = "rgba(20,12,5,.9)";
        c.fillRect(barX - 1, barY - 1, barWidth + 2, 5);
        c.fillStyle = "#483719";
        c.fillRect(barX, barY, barWidth, 3);
        c.fillStyle = state.lastBreath ? "#ff425c" : (hpRatio > 0.45 ? "#9df28e" : "#ffc45f");
        c.fillRect(barX, barY, barWidth * hpRatio, 3);
        c.restore();

        // Short impact marks stay on the boss; the heart itself remains compact.
        var impactAge = current - state.lastMudaImpactAt;
        if (state.combo && impactAge >= 0 && impactAge < 95) {
            c.save();
            c.globalCompositeOperation = "lighter";
            c.globalAlpha = Math.max(0, 1 - impactAge / 95) * 0.78;
            c.translate(state.lastMudaImpactX, state.lastMudaImpactY);
            c.rotate((state.lastMudaImpactIndex % 2 ? 1 : -1) * 0.35);
            c.strokeStyle = "#ffe6a0";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(-10, -5);
            c.lineTo(7, 4);
            c.moveTo(-7, 7);
            c.lineTo(8, -6);
            c.stroke();
            c.restore();
        }

        drawSpecialAttackEffects(c, current);
    }

    function ensureHud() {
        var hud = document.getElementById("mbGoldExperienceHUD");
        if (hud) return hud;
        var parent = document.getElementById("arenaOverlay") || document.body;
        hud = document.createElement("div");
        hud.id = "mbGoldExperienceHUD";
        hud.style.cssText = "display:none;width:min(390px,calc(100% - 24px));box-sizing:border-box;margin:6px auto 0;padding:7px 10px;border:1px solid rgba(235,205,94,.75);border-radius:9px;background:rgba(30,22,9,.9);color:#fff4c2;font:700 11px/1.35 Arial,sans-serif;z-index:25;pointer-events:none;text-align:left;";
        var title = document.createElement("div");
        title.id = "mbGoldExperienceHUDTitle";
        title.style.cssText = "display:flex;justify-content:space-between;gap:8px;align-items:center;";
        var bar = document.createElement("div");
        bar.id = "mbGoldExperienceHUDBar";
        bar.style.cssText = "height:7px;margin-top:5px;border-radius:8px;background:#261d0d;overflow:hidden;border:1px solid rgba(255,225,130,.25);";
        var fill = document.createElement("div");
        fill.id = "mbGoldExperienceHUDFill";
        fill.style.cssText = "height:100%;width:0%;background:linear-gradient(90deg,#b98220,#ffe27d,#75e7a2);transition:width .12s;";
        bar.appendChild(fill);
        hud.appendChild(title);
        hud.appendChild(bar);
        parent.appendChild(hud);
        return hud;
    }

    function updateHUD() {
        var combat = getCombat();
        var card = currentCard();
        var showGE = !!(combat.active && card && card.name === GE_CARD);
        var showGER = !!(combat.active && card && card.name === GER_CARD);
        var hud = ensureHud();
        var title = document.getElementById("mbGoldExperienceHUDTitle");
        var fill = document.getElementById("mbGoldExperienceHUDFill");
        var bar = document.getElementById("mbGoldExperienceHUDBar");
        if (!showGE && !showGER) {
            hud.style.display = "none";
            return;
        }
        hud.style.display = "block";
        if (showGE) {
            var t = now();
            var burstLeft = Math.max(0, state.lifeBurstUntil - t);
            var cooldownLeft = Math.max(0, state.lifeBurstCooldownUntil - t);
            title.textContent = burstLeft > 0
                ? "✦ GOLD EXPERIENCE · ЖИЗНЕННАЯ ЭНЕРГИЯ " + (burstLeft / 1000).toFixed(1) + "с"
                : cooldownLeft > 0
                    ? "✦ GOLD EXPERIENCE · ПЕРЕЗАРЯДКА " + (cooldownLeft / 1000).toFixed(1) + "с"
                    : "✦ GOLD EXPERIENCE · ЖИЗНЕННАЯ ЭНЕРГИЯ ГОТОВА";
            bar.style.display = "none";
        } else {
            var activeLeft = Math.max(0, state.gerUntil - now());
            var heartStatus = state.heartAlive
                ? "GOLD EXPERIENCE REQUIEM " + Math.ceil(state.heartHp) + "/" + Math.ceil(state.heartMaxHp) + " HP"
                : "СЕРДЦЕ ВОССТАНАВЛИВАЕТСЯ";
            title.textContent = heartStatus + " · " + (activeLeft > 0
                ? "RETURN TO ZERO " + state.gerCharges + " ЗАРЯДА · " + (activeLeft / 1000).toFixed(1) + "с"
                : "REQUIEM · ЗАРЯД " + Math.floor(state.charge) + "%");
            bar.style.display = "block";
            fill.style.width = Math.max(0, Math.min(100, state.charge)) + "%";
        }
    }

    function updateSuperButton() {
        var card = currentCard();
        var combat = getCombat();
        if (!card || !combat.active || (card.name !== GE_CARD && card.name !== GER_CARD)) {
            updateHUD();
            return;
        }
        var btn = document.getElementById("superBtn");
        var status = document.getElementById("standBuffStatus");
        if (!btn) { updateHUD(); return; }
        if (!canUseSuper(card, combat)) {
            btn.style.display = "none";
            if (status) status.style.display = "none";
            updateHUD();
            return;
        }
        btn.style.display = "block";
        btn.disabled = false;
        var current = now();
        if (card.name === GE_CARD) {
            var burstLeft = Math.max(0, state.lifeBurstUntil - current);
            var cooldownLeft = Math.max(0, state.lifeBurstCooldownUntil - current);
            btn.textContent = burstLeft > 0
                ? "✦ ЖИЗНЕННАЯ ЭНЕРГИЯ · " + (burstLeft / 1000).toFixed(1) + "с"
                : cooldownLeft > 0
                    ? "⏳ ПЕРЕЗАРЯДКА · " + (cooldownLeft / 1000).toFixed(1) + "с"
                    : "✦ SUPER: ЖИЗНЕННАЯ ЭНЕРГИЯ";
            btn.disabled = burstLeft > 0 || cooldownLeft > 0;
            btn.title = "Восстанавливает 18% максимального HP и повышает скорость Джорно на 25% на 6 секунд. Перезарядка 18 секунд.";
            if (status) {
                status.style.display = "block";
                status.textContent = "GOLD EXPERIENCE: мгновенно лечит Джорно на 18% максимального HP и ускоряет его на 25% на 6 секунд. Перезарядка 18 секунд.";
                status.style.borderColor = "#e9cb54";
            }
        } else {
            var activeLeft = Math.max(0, state.gerUntil - current);
            btn.textContent = activeLeft > 0
                ? "✦ ВОЗВРАЩЕНИЕ К НУЛЮ · " + state.gerCharges + " ЗАРЯДА"
                : state.charge >= 100
                    ? "✦ SUPER: ВОЗВРАЩЕНИЕ К НУЛЮ"
                    : "✦ REQUIEM · " + Math.floor(state.charge) + "%";
            btn.disabled = activeLeft <= 0 && state.charge < 100;
            btn.title = "При 100% заряда: 5 секунд и 2 обнуления. Пассивное Золотое Сердце постоянно следует за Джорно, уклоняется, сражается и восстанавливается после поражения.";
            if (status) {
                status.style.display = "block";
                status.textContent = "ПАССИВКА GOLDEN HEART: автономный жёлтый стенд-сердце с собственным HP. Уклоняется от атак, сближается с боссом, бьёт кулаками сериями, использует MUDA MUDA (30 ударов за 4 секунды), Life Seeds и Vine Bind, лечит Джорно на 8% максимального HP при HP ниже 55%. Также Requiem сохраняет Возвращение к нулю и снижает получаемый урон.";
                status.style.borderColor = "#ffe07a";
            }
        }
        var btn2 = document.getElementById("superBtn2");
        var deact = document.getElementById("superBtnDeactivate");
        if (btn2) btn2.style.display = "none";
        if (deact) deact.style.display = "none";
        updateHUD();
    }

    function restoreLifeBurstSpeed() {
        var restore = state.lifeBurstRestoreSpeed;
        var speed = state.lifeBurstOriginalSpeed;
        state.lifeBurstRestoreSpeed = null;
        state.lifeBurstOriginalSpeed = null;
        state.lifeBurstContextType = null;
        state.lifeBurstUntil = 0;
        if (typeof restore === "function" && Number.isFinite(Number(speed))) {
            try { restore(Number(speed)); } catch (e) {}
        }
    }

    function updateLifeBurst() {
        if (state.lifeBurstUntil > 0 && now() >= state.lifeBurstUntil) {
            restoreLifeBurstSpeed();
            updateSuperButton();
        }
    }

    function activateGoldExperienceLife() {
        var card = currentCard();
        var combat = getCombat();
        if (!card || card.name !== GE_CARD || !canUseSuper(card, combat)) return;
        var current = now();
        if (state.lifeBurstUntil > current) {
            toast("ЖИЗНЕННАЯ ЭНЕРГИЯ УЖЕ АКТИВНА", "#ffe28a");
            return;
        }
        if (current < state.lifeBurstCooldownUntil) {
            toast("GOLD EXPERIENCE ПЕРЕЗАРЯЖАЕТСЯ", "#ffcf79");
            return;
        }
        var ctx = getContext();
        if (!ctx || typeof ctx.getHeartSpeed !== "function" || typeof ctx.setHeartSpeed !== "function") return;
        var hp = Math.max(0, Number(ctx.getPlayerHp && ctx.getPlayerHp()) || 0);
        var maxHp = Math.max(1, Number(ctx.getPlayerMaxHp && ctx.getPlayerMaxHp()) || 1);
        if (hp > 0 && hp < maxHp) {
            var healed = Math.min(maxHp - hp, Math.floor(maxHp * GE_LIFE_HEAL));
            if (healed > 0) setPlayerHp(ctx, hp + healed);
            toast("🌱 ЖИЗНЕННАЯ ЭНЕРГИЯ · +" + Math.ceil(healed) + " HP", "#9cffaa");
        } else {
            toast("✦ GOLD EXPERIENCE: ЖИЗНЕННАЯ ЭНЕРГИЯ!", "#ffe28a");
        }
        var speed = Number(ctx.getHeartSpeed());
        if (Number.isFinite(speed) && speed > 0) {
            state.lifeBurstOriginalSpeed = speed;
            state.lifeBurstRestoreSpeed = ctx.setHeartSpeed;
            state.lifeBurstContextType = ctx.type;
            ctx.setHeartSpeed(speed * GE_LIFE_SPEED);
        }
        state.lifeBurstUntil = current + GE_LIFE_DURATION;
        state.lifeBurstCooldownUntil = current + GE_LIFE_COOLDOWN;
        try {
            if (typeof ctx.addShockwave === "function") ctx.addShockwave(ctx.getHeartX(), ctx.getHeartY(), "#ffe36b", 58, 12, 3);
        } catch (e) {}
        updateSuperButton();
        startLoop();
    }

    function ensureRequiemCompanion() {
        if (!isGERMain() || !getCombat().active) return false;
        var ctx = getContext();
        if (!ctx || typeof ctx.getHeartX !== "function" || typeof ctx.getHeartY !== "function") return false;
        if (state.active) return true;
        var current = now();
        state.active = true;
        state.activeUntil = Infinity;
        state.heartMaxHp = 125;
        state.heartHp = state.heartMaxHp;
        state.heartAlive = true;
        state.heartRespawnAt = 0;
        state.heartInvulnUntil = current + 700;
        state.lastBreath = false;
        state.stunTimer = 0;
        state.hitFlash = 0;
        state.aiSkill = 0.62;
        state.heartSize = getCompanionSize(ctx);
        state.x = Number(ctx.getHeartX()) || 200;
        state.y = (Number(ctx.getHeartY()) || 400) - 24;
        state.moveTargetX = state.x;
        state.moveTargetY = state.y;
        state.wanderTimer = 42;
        state.dodgeCooldown = 0;
        state.dodgePlanTimer = 0;
        state.dodgeFlashTimer = 0;
        state.lastThreatAttack = null;
        state.companionMode = "guard";
        state.companionModeTimer = 115;
        state.companionSide = -1;
        state.companionOffsetX = 0;
        state.companionOffsetY = 0;
        state.footworkPhase = Math.random() * Math.PI * 2;
        state.isDodging = false;
        state.healState = "idle";
        state.healTimer = 0;
        state.healCooldownUntil = 0;
        state.healTotal = 0;
        state.healRemaining = 0;
        state.healSide = 1;
        state.vx = 0;
        state.vy = 0;
        state.nextAttackAt = current + 520;
        state.nextHealAt = current;
        state.healCooldownUntil = current;
        state.attackUntil = 0;
        state.combo = null;
        state.specialAttack = null;
        state.attackType = null;
        state.lastAttackType = null;
        state.comboCooldownUntil = current + 750;
        state.attackFrame = 0;
        state.trail = [];
        toast("✦ GOLDEN HEART: Я БУДУ СРАЖАТЬСЯ РЯДОМ!", "#ffe88a");
        return true;
    }

    function clearRequiemCompanion() {
        if (!state.active) return;
        state.active = false;
        state.activeUntil = 0;
        state.heartAlive = true;
        state.heartHp = state.heartMaxHp;
        state.heartRespawnAt = 0;
        finishMudaCombo();
        state.specialAttack = null;
        state.attackType = null;
        state.trail = [];
    }

    function activateGER() {
        var card = currentCard();
        var combat = getCombat();
        if (!card || card.name !== GER_CARD || !canUseSuper(card, combat)) return;
        var current = now();
        if (current < state.gerUntil && state.gerCharges > 0) {
            toast("ВОЗВРАЩЕНИЕ К НУЛЮ УЖЕ АКТИВНО", "#ffe28a");
            return;
        }
        if (state.charge < 100) {
            toast("REQUIEM НУЖНО ЕЩЁ " + Math.ceil(100 - state.charge) + "%", "#ffe28a");
            return;
        }
        state.charge = 0;
        state.gerUntil = current + GER_DURATION;
        state.gerCharges = GER_CHARGES;
        state.markUntil = 0;
        state.markBossType = null;
        toast("✦ GER: ВОЗВРАЩЕНИЕ К НУЛЮ · 2 ЗАРЯДА", "#ffe28a");
        updateSuperButton();
        startLoop();
    }

    function originalToggleSuper() {
        if (typeof window.__mbGoldExperienceOriginalToggleSuper === "function") {
            return window.__mbGoldExperienceOriginalToggleSuper.apply(this, arguments);
        }
    }
    if (!window.__mbGoldExperienceOriginalToggleSuper && typeof window.toggleSuper === "function") {
        window.__mbGoldExperienceOriginalToggleSuper = window.toggleSuper;
    }
    window.toggleSuper = function () {
        if (isGoldExperienceMain()) return activateGoldExperienceLife();
        if (isGERMain()) return activateGER();
        return originalToggleSuper.apply(this, arguments);
    };

    var baseUpdateButton = window.updateSuperButton;
    window.updateSuperButton = function () {
        if (typeof baseUpdateButton === "function") baseUpdateButton.apply(this, arguments);
        var card = currentCard();
        if (card && (card.name === GE_CARD || card.name === GER_CARD)) {
            updateSuperButton();
            return;
        }
    };

    var baseResetSupers = window.resetAllSupers;
    window.resetAllSupers = function () {
        restoreLifeBurstSpeed();
        state.active = false;
        state.activeUntil = 0;
        state.cooldownUntil = 0;
        state.lifeBurstCooldownUntil = 0;
        stopMudaMusic();
        state.heartAlive = true;
        state.heartHp = state.heartMaxHp;
        state.heartRespawnAt = 0;
        state.lastBreath = false;
        state.healState = "idle";
        state.healTimer = 0;
        state.healCooldownUntil = 0;
        state.healTotal = 0;
        state.healRemaining = 0;
        state.isDodging = false;
        state.dodgeCooldown = 0;
        state.dodgePlanTimer = 0;
        state.dodgeFlashTimer = 0;
        state.trail = [];
        state.combo = null;
        state.specialAttack = null;
        state.attackType = null;
        state.lastAttackType = null;
        state.nextAttackAt = 0;
        state.nextHealAt = 0;
        state.gerUntil = 0;
        state.gerCharges = 0;
        state.markUntil = 0;
        state.markBossType = null;
        state.charge = 0;
        if (typeof baseResetSupers === "function") return baseResetSupers.apply(this, arguments);
    };

    var baseStandActive = window.isStandUserStandActive;
    window.isStandUserStandActive = function () {
        if (isRequiemCompanionActive()) return true;
        if (typeof baseStandActive === "function") return baseStandActive.apply(this, arguments);
        return false;
    };

    var baseStandPosition = window.getStandUserHitboxPosition;
    window.getStandUserHitboxPosition = function (ctx) {
        if (isRequiemCompanionActive()) {
            var ctx = getContext();
            return { x: state.x, y: state.y, radius: getCompanionSize(ctx) * 0.72,
                color: "#ffe36b", stand: "Gold Experience Requiem" };
        }
        return typeof baseStandPosition === "function" ? baseStandPosition.apply(this, arguments) : null;
    };

    var baseStandFactor = window.getStandUserDamageFactor;
    window.getStandUserDamageFactor = function () {
        if (isRequiemCompanionActive()) return 0.4;
        return typeof baseStandFactor === "function" ? baseStandFactor.apply(this, arguments) : 0.4;
    };

    var baseScaleStandDamage = window.scaleStandBlockedDamage;
    window.scaleStandBlockedDamage = function (baseDamage) {
        var base = Math.max(0, Number(baseDamage) || 0);
        if (isRequiemCompanionActive()) {
            damageRequiemHeart(base, null);
            addCharge(8);
            state.lastHitAt = now();
            return Math.max(1, Math.floor(base * 0.5));
        }
        return typeof baseScaleStandDamage === "function"
            ? baseScaleStandDamage.apply(this, arguments)
            : Math.max(1, Math.floor(base * 0.4));
    };

    window.MBIsGoldExperienceNpcActive = function () {
        return isRequiemCompanionActive();
    };
    window.MBGoldExperienceTryStandHit = function (ctx, attack) {
        if (!window.MBIsGoldExperienceNpcActive() || !attack ||
            typeof window.dioAttackTouchesStand !== "function") return false;
        var hit = false;
        try { hit = window.dioAttackTouchesStand(ctx || getContext(), attack) === true; } catch (e) {}
        if (!hit) return false;
        damageRequiemHeart(attack.damage || attack.dmg || 8, attack);
        return true;
    };
    window.MBGoldExperienceRedirectDamage = function (rawDamage, ctx, sourceAction) {
        if (!window.MBIsGoldExperienceNpcActive() || !sourceAction ||
            typeof sourceAction !== "object" ||
            typeof window.dioAttackTouchesStand !== "function") return null;
        if (sourceAction._mbGERHeartDamageApplied) {
            return Math.max(1, Math.floor((Number(rawDamage) || 1) * 0.5));
        }
        if (sourceAction.dioStandHitOnce) return null;
        var hit = false;
        try { hit = window.dioAttackTouchesStand(ctx || getContext(), sourceAction) === true; } catch (e) {}
        if (!hit) return null;
        damageRequiemHeart(rawDamage, sourceAction);
        sourceAction.dioStandHitOnce = true;
        return Math.max(1, Math.floor((Number(rawDamage) || 1) * 0.5));
    };

    // true means the action was cancelled. Repeated hits from the same attack
    // object remain cancelled without spending an additional charge.
    window.MBGERTryNullifyDamage = function (damage, sourceAction, category) {
        if (!isGERMain()) return false;
        var kind = String(category || "combat").toLowerCase();
        if (kind === "qte" || kind === "story" || kind === "phase" ||
            kind === "instant" || kind === "scripted" || kind === "transition") return false;
        if (!sourceAction || typeof sourceAction !== "object") return false;
        var current = now();
        if (sourceAction && typeof sourceAction === "object" && nulledActions && nulledActions.has(sourceAction)) return true;
        if (current >= state.gerUntil || state.gerCharges <= 0) return false;

        if (sourceAction && typeof sourceAction === "object" && nulledActions) {
            try { nulledActions.add(sourceAction); } catch (e) {}
        }
        state.gerCharges = Math.max(0, state.gerCharges - 1);
        var ctx = getContext();
        state.markUntil = current + 5000;
        state.markBossType = ctx && ctx.type ? ctx.type : null;
        toast("✦ ДЕЙСТВИЕ ОБНУЛЕНО · " + state.gerCharges + " ЗАРЯДА", "#ffe28a");
        updateSuperButton();
        return true;
    };

    // A successful Return to Zero empowers only the next attack on the same boss.
    var baseBossDamageBonus = window.MBKarsApplyDamageBonus;
    if (typeof baseBossDamageBonus === "function") {
        window.MBKarsApplyDamageBonus = function (rawDamage) {
            var damage = baseBossDamageBonus.apply(this, arguments);
            if (damage > 0 && isGERMain()) addCharge(2);
            if (damage > 0 && isGERMain() && state.markUntil > now()) {
                var ctx = getContext();
                if (!state.markBossType || !ctx || ctx.type === state.markBossType) {
                    damage = Math.max(1, Math.floor(damage * 1.5));
                    state.markUntil = 0;
                    state.markBossType = null;
                    toast("✦ ЗОЛОТАЯ МЕТКА · +50% УРОНА", "#ffe28a");
                }
            }
            return damage;
        };
    }

    function ensureLoopContext() {
        var canvas = document.getElementById("arenaCanvas");
        return canvas && typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
    }

    function frame(timestamp) {
        rafId = 0;
        var current = Number(timestamp) || now();
        var dt = lastFrameAt ? Math.max(1, Math.min(50, current - lastFrameAt)) : 16.667;
        lastFrameAt = current;
        updateLifeBurst();
        if (isGERMain() && getCombat().active) ensureRequiemCompanion();
        else if (state.active) clearRequiemCompanion();
        if (state.active && isGERMain() && getCombat().active) {
            updateCompanion(dt);
            var c = ensureLoopContext();
            if (c) drawGoldExperience(c);
        }
        if (state.gerUntil > current && isGERMain()) updateHUD();
        if (state.active || isGERMain() || state.lifeBurstUntil > current || state.markUntil > current) {
            rafId = window.requestAnimationFrame(frame);
        } else {
            lastFrameAt = 0;
        }
        updateHUD();
    }

    function startLoop() {
        if (rafId || typeof window.requestAnimationFrame !== "function") return;
        lastFrameAt = 0;
        rafId = window.requestAnimationFrame(frame);
    }

    window.MBUpdateGoldExperience = function () {
        if (isGERMain() && getCombat().active) ensureRequiemCompanion();
        updateLifeBurst();
        startLoop();
        updateHUD();
    };

    if (typeof window.setInterval === "function" && !window.__mbGoldExperienceUiTimer) {
        window.__mbGoldExperienceUiTimer = window.setInterval(function () {
            var card = currentCard();
            if (card && (card.name === GE_CARD || card.name === GER_CARD)) {
                updateLifeBurst();
                if (card.name === GER_CARD && getCombat().active) {
                    ensureRequiemCompanion();
                    startLoop();
                } else if (state.active && card.name !== GER_CARD) {
                    clearRequiemCompanion();
                }
                updateSuperButton();
            } else {
                if (state.active) clearRequiemCompanion();
                updateHUD();
            }
        }, 160);
    }

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden && (state.active || isGERMain() || state.lifeBurstUntil > now())) startLoop();
    });

    window.addEventListener("beforeunload", function () {
        if (rafId && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(rafId);
        rafId = 0;
    });
})();