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
        projectiles: [],
        seedCooldownUntil: 0,
        targetId: null,
        attackCooldown: 0,
        windup: 0,
        swingTimer: 0,
        attackAngle: 0,
        nextSeedAt: 0,
        lastSeedImpactAt: 0,
        lastSeedImpactX: 0,
        lastSeedImpactY: 0,
        nextHealAt: 0,
        healState: "idle",
        healTimer: 0,
        healCooldownUntil: 0,
        healTotal: 0,
        healRemaining: 0,
        healSide: 1,
        healStartedAt: 0,
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
        return !!(isGERMain() && state.active);
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
        var list = [];
        try {
            if (ctx && typeof ctx.getAttacks === "function") {
                var attacks = ctx.getAttacks();
                if (Array.isArray(attacks)) list = list.concat(attacks);
            }
            if (ctx && typeof ctx.getBlasters === "function") {
                var blasters = ctx.getBlasters();
                if (Array.isArray(blasters)) list = list.concat(blasters);
            }
        } catch (e) {}
        return list.filter(function (attack, index) {
            return attack && list.indexOf(attack) === index;
        });
    }

    function getCompanionShockwaves(ctx) {
        try {
            if (ctx && typeof ctx.getShockwaves === "function") {
                var waves = ctx.getShockwaves();
                return Array.isArray(waves) ? waves : [];
            }
        } catch (e) {}
        return [];
    }

    function companionShockwaveThreat(wave, x, y, frames, alert) {
        if (!wave || wave.odenHit || !(Number(wave.damage) > 0)) return null;
        var radius = Math.max(0, Number(wave.radius) || 0) +
            Math.max(0, Number(wave.speed) || 0) * Math.max(0, Number(frames) || 0);
        var cx = Number(wave.x) || 0, cy = Number(wave.y) || 0;
        var distance = Math.hypot(x - cx, y - cy);
        var limit = (Number(wave.width) || 5) * 0.7 +
            getCompanionSize(null) * 0.72 + (alert ? 34 : 0);
        if (Math.abs(distance - radius) >= limit) return null;
        return { x: cx, y: cy, axis: "point", distance: Math.abs(distance - radius), attack: wave };
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

        return Math.max(0.5, Math.min(12, speed));
    }

    function companionSegmentDistance(px, py, x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1, length2 = dx * dx + dy * dy;
        var t = length2 > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length2)) : 0;
        return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
    }

    // Oden-style threat recognition, expanded for the actual attacks of every boss.
    function companionThreatAt(attack, x, y, frames, alert) {
        if (!attack || attack.dioAggroNoPlayer || attack.dioStandHitOnce ||
            attack._mbGEIgnored || attack.state === "done") return null;

        var type = String(attack.type || "").toLowerCase();
        var telegraph = attack.state === "warning" || attack.state === "windup" ||
            Number(attack.warningTimer) > 0 || type.indexOf("warning") !== -1 ||
            type.indexOf("telegraph") !== -1;
        if (telegraph && !alert) return null;

        var t = Math.max(0, Number(frames) || 0);
        var body = getCompanionSize(null) * 0.72;
        var padding = alert ? 38 : 0;
        var ax = Number.isFinite(Number(attack.x)) ? Number(attack.x) : Number(attack.targetX);
        var ay = Number.isFinite(Number(attack.y)) ? Number(attack.y) : Number(attack.targetY);
        if (!Number.isFinite(ax)) ax = Number(attack.originX);
        if (!Number.isFinite(ay)) ay = Number(attack.originY);

        var vx = Number(attack.vx) || 0, vy = Number(attack.vy) || 0;
        if (!telegraph) {
            ax = (Number.isFinite(ax) ? ax : 0) + vx * t;
            ay = (Number.isFinite(ay) ? ay : 0) + vy * t;
            var gravity = Number(attack.gravity) || 0;
            if (gravity) ay += gravity * t * (t + 1) * 0.5;
        }
        if (!Number.isFinite(ax)) ax = x;
        if (!Number.isFinite(ay)) ay = y;

        var width = Math.max(6, Number(attack.width) || Number(attack.thickness) || 14);
        var height = Math.max(0, Number(attack.height) || Number(attack.currentHeight) || 0);
        var shiftX = !telegraph ? vx * t : 0;
        var shiftY = !telegraph ? vy * t : 0;

        // Oden's special handling for Roger and Whitebeard warnings.
        if (type === "roger_slash") {
            var rAxis = attack.direction === "horizontal" ? "horizontal" : "vertical";
            var rLine = rAxis === "horizontal" ? Number(attack.y) : Number(attack.x);
            var rLimit = (Number(attack.width) || 58) * 0.5 + body + padding + (telegraph ? 18 : 0);
            if (Number.isFinite(rLine)) {
                var rDist = rAxis === "horizontal" ? Math.abs(y - rLine) : Math.abs(x - rLine);
                if (rDist < rLimit) return { x: rAxis === "horizontal" ? x : rLine,
                    y: rAxis === "horizontal" ? rLine : y, axis: rAxis, distance: rDist, attack: attack };
            }
            return null;
        }
        if (type === "roger_cross") {
            var cAxis = attack.dir === "vertical" ? "vertical" : "horizontal";
            var cLine = cAxis === "vertical" ? Number(attack.x) : Number(attack.y);
            var cLimit = (Number(attack.width) || 78) * 0.35 + body + padding + (telegraph ? 18 : 0);
            if (Number.isFinite(cLine)) {
                var cDist = cAxis === "vertical" ? Math.abs(x - cLine) : Math.abs(y - cLine);
                if (cDist < cLimit) return { x: cAxis === "vertical" ? cLine : x,
                    y: cAxis === "vertical" ? y : cLine, axis: cAxis, distance: cDist, attack: attack };
            }
            return null;
        }
        if (type === "wb_giant_rock_warning") {
            var rockLine = Number(attack.targetX !== undefined ? attack.targetX : attack.x);
            if (Number.isFinite(rockLine) && Math.abs(x - rockLine) < 22 + body + padding) {
                return { x: rockLine, y: y, axis: "vertical", distance: Math.abs(x - rockLine), attack: attack };
            }
            return null;
        }
        if (type === "wb_combo_gate_warning") {
            var gateTargetY = Number(attack.targetY);
            for (var gi = 0; gi < 2; gi++) {
                var gateY = gateTargetY + (gi === 0 ? -24 : 24);
                if (Number.isFinite(gateY) && Math.abs(y - gateY) < 15 + body + padding) {
                    return { x: x, y: gateY, axis: "horizontal", distance: Math.abs(y - gateY), attack: attack };
                }
            }
            return null;
        }
        if (type === "wb_attack_telegraph") {
            var attackId = Number(attack.attackId), attackKind = attack.attackKind || "normal";
            var columns = Array.isArray(attack.columns) ? attack.columns : [];
            if ((attackKind === "normal" && (attackId === 0 || attackId === 5)) ||
                (attackKind === "super" && attackId === 0)) {
                for (var col = 0; col < columns.length; col++) {
                    if (Math.abs(x - Number(columns[col])) < 20 + body + padding) {
                        return { x: Number(columns[col]), y: y, axis: "vertical",
                            distance: Math.abs(x - Number(columns[col])), attack: attack };
                    }
                }
            }
            if (attackKind === "normal" && [2, 3, 7].indexOf(attackId) !== -1) {
                var targetLane = Number(attack.targetY);
                if (Number.isFinite(targetLane) && Math.abs(y - targetLane) < 18 + body + padding) {
                    return { x: x, y: targetLane, axis: "horizontal", distance: Math.abs(y - targetLane), attack: attack };
                }
            }
            if (attackKind === "normal" && attackId === 1) {
                var ox = Number(attack.originX) || Number(attack.x) || 320;
                var oy = Number(attack.originY) || Number(attack.y) || 120;
                var od = Math.hypot(x - ox, y - oy);
                if (od < 76 + body + padding) return { x: ox, y: oy, axis: "point", distance: od, attack: attack };
            }
            if (Number.isFinite(Number(attack.targetX)) &&
                Math.abs(x - Number(attack.targetX)) < 30 + body + padding) {
                return { x: Number(attack.targetX), y: Number(attack.targetY) || y,
                    axis: "vertical", distance: Math.abs(x - Number(attack.targetX)), attack: attack };
            }
            return null;
        }
        if (type === "wb_center_wave") {
            var waveY = Number(attack.y) - (Number(attack.speed) || 3.4) * t;
            var halfH = (Number(attack.height) || 92) * 0.5 + body + padding;
            if (Math.abs(x - 200) < (Number(attack.width) || 400) * 0.5 + body &&
                Math.abs(y - waveY) < halfH) {
                return { x: x, y: waveY, axis: "horizontal", distance: Math.abs(y - waveY), attack: attack };
            }
            if (telegraph && Number.isFinite(Number(attack.targetY)) &&
                Math.abs(y - Number(attack.targetY)) < halfH) {
                return { x: x, y: Number(attack.targetY), axis: "horizontal",
                    distance: Math.abs(y - Number(attack.targetY)), attack: attack };
            }
            return null;
        }
        if (type === "wb_fruit_punch" &&
            [attack.originX, attack.originY, attack.endX, attack.endY].every(function(v) { return Number.isFinite(Number(v)); })) {
            var punchDistance = companionSegmentDistance(x, y,
                Number(attack.originX), Number(attack.originY),
                Number(attack.endX), Number(attack.endY));
            var punchLimit = (Number(attack.width) || 38) * 0.5 + body + padding + (telegraph ? 16 : 0);
            if (punchDistance < punchLimit) {
                return { x: (Number(attack.originX) + Number(attack.endX)) * 0.5,
                    y: (Number(attack.originY) + Number(attack.endY)) * 0.5,
                    axis: "segment", distance: punchDistance, attack: attack };
            }
            return null;
        }
        if (type === "wb_crescent_slash") {
            if (telegraph && attack.state === "windup") {
                var low = Math.min(Number(attack.startY) || Number(attack.y) || 0,
                    Number(attack.targetY) || Number(attack.y) || 0);
                var high = Math.max(Number(attack.startY) || Number(attack.y) || 0,
                    Number(attack.targetY) || Number(attack.y) || 0);
                var warningLimit = (Number(attack.width) || 92) * 0.5 + body + padding + 14;
                if (y >= low - warningLimit && y <= high + warningLimit) {
                    var safeTop = Math.max(10, low - warningLimit - 24);
                    var safeBottom = Math.min(480, high + warningLimit + 24);
                    return { x: x, y: y, axis: "horizontal", distance: 0,
                        safeY: Math.abs(y - safeTop) <= Math.abs(y - safeBottom) ? safeTop : safeBottom,
                        attack: attack };
                }
                return null;
            }
            if (attack.state !== "flying") return null;
            var travel = Math.min(1, ((Number(attack.travelElapsed) || 0) + t) /
                Math.max(1, Number(attack.travelTime) || 90));
            var laneY = (Number(attack.startY) || Number(attack.y) || 0) +
                ((Number(attack.targetY) || Number(attack.y) || 0) -
                 (Number(attack.startY) || Number(attack.y) || 0)) * travel;
            var slashLimit = (Number(attack.width) || 92) * 0.5 + body + padding;
            if (x >= -10 && x <= 410 && Math.abs(y - laneY) < slashLimit) {
                return { x: x, y: laneY, axis: "horizontal", distance: Math.abs(y - laneY), attack: attack };
            }
            return null;
        }
        if (type === "tsunami") {
            var tsunamiY = Number(attack.y) + (Number(attack.vy) || 0) * t;
            var tsunamiHalf = (Number(attack.currentHeight) || Number(attack.height) || 150) * 0.5 + body + padding;
            var inside = attack.fromRight
                ? x >= (Number(attack.x) || 0) && x <= 400
                : x >= 0 && x <= (Number(attack.width) || 0);
            if (inside && Math.abs(y - tsunamiY) < tsunamiHalf) {
                return { x: x, y: tsunamiY, axis: "horizontal", distance: Math.abs(y - tsunamiY), attack: attack };
            }
            return null;
        }

        var path = Array.isArray(attack.path) ? attack.path : null;
        if (path && path.length > 1) {
            for (var p = 1; p < path.length; p++) {
                var p0 = path[p - 1], p1 = path[p];
                if (!p0 || !p1) continue;
                var pd = companionSegmentDistance(x, y,
                    (Number(p0.x) || 0) + shiftX, (Number(p0.y) || 0) + shiftY,
                    (Number(p1.x) || 0) + shiftX, (Number(p1.y) || 0) + shiftY);
                if (pd < width * 0.5 + body + padding) {
                    return { x: ax, y: ay, axis: "segment", distance: pd, attack: attack };
                }
            }
        }
        if ([attack.x1, attack.y1, attack.x2, attack.y2].every(function(v) {
            return Number.isFinite(Number(v));
        })) {
            var segmentDistance = companionSegmentDistance(x, y,
                Number(attack.x1) + shiftX, Number(attack.y1) + shiftY,
                Number(attack.x2) + shiftX, Number(attack.y2) + shiftY);
            if (segmentDistance < width * 0.5 + body + padding) {
                return { x: ax, y: ay, axis: "segment", distance: segmentDistance, attack: attack };
            }
        }
        if ([attack.originX, attack.originY, attack.endX, attack.endY].every(function(v) {
            return Number.isFinite(Number(v));
        })) {
            var originSegment = companionSegmentDistance(x, y,
                Number(attack.originX) + shiftX, Number(attack.originY) + shiftY,
                Number(attack.endX) + shiftX, Number(attack.endY) + shiftY);
            if (originSegment < width * 0.5 + body + padding) {
                return { x: ax, y: ay, axis: "segment", distance: originSegment, attack: attack };
            }
        }

        var dx = x - ax, dy = y - ay;
        var distance = Math.hypot(dx, dy);
        if (type.indexOf("laser") !== -1 || type.indexOf("beam") !== -1 ||
            type.indexOf("slash") !== -1 || type.indexOf("blade") !== -1) {
            var hasAngle = Number.isFinite(Number(attack.angle));
            if (hasAngle && (attack.length || attack.range || attack.endX !== undefined || attack.endY !== undefined)) {
                var a = Number(attack.angle), ux = Math.cos(a), uy = Math.sin(a);
                var along = dx * ux + dy * uy, across = Math.abs(dx * uy - dy * ux);
                var beamLength = Math.max(60, Number(attack.length) || Number(attack.range) || 420);
                if (along >= -body - padding && along <= beamLength + body + padding &&
                    across < Math.max(12, width * 0.5 + body + padding)) {
                    return { x: ax, y: ay, axis: "segment", distance: across, attack: attack };
                }
                return null;
            }
            var horizontal = attack.direction === "horizontal" || attack.zone === "upper" ||
                attack.zone === "lower" || attack.horizontal === true ||
                (hasAngle && Math.abs(Math.sin(Number(attack.angle))) < 0.25);
            var lineDistance = horizontal ? Math.abs(y - ay) : Math.abs(x - ax);
            if (lineDistance < Math.max(12, (width || height || 20) * 0.5 + body + padding)) {
                return { x: ax, y: ay, axis: horizontal ? "horizontal" : "vertical",
                    distance: lineDistance, attack: attack };
            }
            return null;
        }
        if (type === "ring" || type.indexOf("shockwave") !== -1) {
            var ringRadius = Math.max(0, Number(attack.radius) || Number(attack.currentRadius) || 0);
            var ringSpeed = Number(attack.speed) || Number(attack.expansionSpeed) || 0;
            ringRadius = Math.max(0, ringRadius + ringSpeed * t);
            if (Math.abs(distance - ringRadius) < Math.max(10, Number(attack.thickness) * 0.5 + body + padding)) {
                return { x: ax, y: ay, axis: "point", distance: distance, radius: ringRadius, attack: attack };
            }
            return null;
        }
        if (type.indexOf("wall") !== -1 || type.indexOf("plate") !== -1 ||
            type.indexOf("gate") !== -1) {
            var halfW = Math.max(16, (width || Number(attack.size) || 28) * 0.5 + body + padding);
            var halfH = Math.max(16, (height || Number(attack.size) || 28) * 0.5 + body + padding);
            if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
                return { x: ax, y: ay, axis: "rect", distance: distance, attack: attack };
            }
            return null;
        }
        var radius = Math.max(5, Number(attack.radius) || Number(attack.size) ||
            Math.max(width, height) * 0.5 || 12);
        var limit = radius + body + padding;
        return distance < limit
            ? { x: ax, y: ay, axis: "point", distance: distance, limit: limit, attack: attack }
            : null;
    }

    function companionShockwaveThreat(wave, x, y, frames, alert) {
        if (!wave || wave.odenHit || !(Number(wave.damage) > 0)) return null;
        var radius = Math.max(0, Number(wave.radius) || 0) +
            Math.max(0, Number(wave.speed) || 0) * Math.max(0, Number(frames) || 0);
        var distance = Math.hypot(x - (Number(wave.x) || 0), y - (Number(wave.y) || 0));
        var limit = (Number(wave.width) || 5) * 0.7 + getCompanionSize(null) * 0.72 + (alert ? 34 : 0);
        return Math.abs(distance - radius) < limit
            ? { x: Number(wave.x) || 0, y: Number(wave.y) || 0, axis: "point",
                distance: Math.abs(distance - radius), attack: wave }
            : null;
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
        var waves = getCompanionShockwaves(ctx);
        if (!attacks.length && !waves.length) return null;
        var skill = Math.max(0.14, Math.min(1, Number(state.aiSkill) || 0.94));
        var horizon = Math.round(150 + skill * 56);
        var times = [0];
        for (var t = 4; t < horizon; t += 4) times.push(t);
        if (times[times.length - 1] !== horizon) times.push(horizon);
        var tx = Number.isFinite(Number(state.moveTargetX)) ? Number(state.moveTargetX) : state.x;
        var ty = Number.isFinite(Number(state.moveTargetY)) ? Number(state.moveTargetY) : state.y;
        var route = predictCompanionRoute(ctx, tx, ty, times);
        var earliest = null, bestTime = Infinity;

        for (var a = attacks.length - 1; a >= 0; a--) {
            for (var p = 0; p < route.length; p++) {
                var point = route[p];
                var risk = companionThreatAt(attacks[a], point.x, point.y, point.time, true);
                if (risk && point.time < bestTime) {
                    bestTime = point.time;
                    earliest = { risk: risk, time: point.time, attack: attacks[a],
                        attackType: attacks[a].type, predictedX: point.x, predictedY: point.y };
                    break;
                }
            }
        }
        for (var w = waves.length - 1; w >= 0; w--) {
            for (var wp = 0; wp < route.length; wp++) {
                var wavePoint = route[wp];
                var waveRisk = companionShockwaveThreat(waves[w], wavePoint.x, wavePoint.y, wavePoint.time, true);
                if (waveRisk && wavePoint.time < bestTime) {
                    bestTime = wavePoint.time;
                    earliest = { risk: waveRisk, time: wavePoint.time, attack: waves[w],
                        attackType: "shockwave", predictedX: wavePoint.x, predictedY: wavePoint.y };
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
        var attacks = getAttackList(ctx), waves = getCompanionShockwaves(ctx);
        var boss = getBossPosition(ctx, state.x, state.y);
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
                            collisions++; score -= p < 2 ? 38 : 27;
                        }
                    }
                    for (var w = waves.length - 1; w >= 0; w--) {
                        if (companionShockwaveThreat(waves[w], point.x, point.y, point.time, true)) {
                            collisions++; score -= p < 2 ? 34 : 24;
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
                    var alignment = ((Number(state.vx) || 0) * routeDx + (Number(state.vy) || 0) * routeDy) /
                        Math.max(1, currentSpeed * routeLength);
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
                if (score > bestScore) { bestScore = score; best = { x: tx, y: ty, safe: collisions === 0 }; }
            }
        }
        return best || {
            x: Math.max(left, Math.min(right, state.x + (state.x < 200 ? 100 : -100))),
            y: Math.max(top, Math.min(bottom, state.y - 55)), safe: false
        };
    }

        function chooseCompanionGoal(ctx, playerX, playerY, boss, frameScale) {
        var playerHp = Math.max(0, Number(ctx.getPlayerHp && ctx.getPlayerHp()) || 0);
        var playerMaxHp = Math.max(1, Number(ctx.getPlayerMaxHp && ctx.getPlayerMaxHp()) || 1);
        var lowHp = playerHp / playerMaxHp < 0.45;
        state.companionModeTimer = Math.max(0, (Number(state.companionModeTimer) || 0) - frameScale);
        if (state.companionModeTimer <= 0) {
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
            var side = Number(state.healSide) || 1;
            return { x: Math.max(30, Math.min(370, playerX + side * 43)),
                y: Math.max(28, Math.min(456, playerY - 7)) };
        }

        var bossX = Number(boss && boss.x), bossY = Number(boss && boss.y);
        if (Number.isFinite(bossX) && Number.isFinite(bossY)) {
            // Oden's lower-lane formation, translated for the small Golden Heart.
            // It tracks the opponent's horizontal movement instead of hovering beside Giorno.
            var leadX = Math.max(-24, Math.min(24, (Number(boss.vx) || 0) * 5));
            var targetX = Math.max(28, Math.min(372, bossX + leadX));
            var targetY = Math.max(360, Math.min(456, playerY + 22));
            var toBoss = Math.hypot(targetX - bossX, targetY - bossY);
            if (toBoss < 132) {
                var awayX = state.x - bossX, awayY = state.y - bossY;
                var awayLength = Math.max(1, Math.hypot(awayX, awayY));
                targetX = Math.max(24, Math.min(376, bossX + awayX / awayLength * 145));
                targetY = Math.max(18, Math.min(474, bossY + awayY / awayLength * 145));
            }
            // When Giorno is critically hurt, the formation shifts slightly toward him.
            if (lowHp) targetX = targetX * 0.86 + playerX * 0.14;
            return { x: targetX, y: targetY };
        }

        // No active target yet: remain close to the player but keep independent footwork.
        var sideFallback = Number(state.companionSide) || 1;
        var offsetX = Number(state.companionOffsetX) || 0;
        var offsetY = Number(state.companionOffsetY) || 0;
        if (state.companionMode === "roam") {
            state.wanderTimer = Math.max(0, (Number(state.wanderTimer) || 0) - frameScale);
            if (state.wanderTimer <= 0 ||
                Math.hypot(state.moveTargetX - state.x, state.moveTargetY - state.y) < 18) {
                state.companionOffsetX = (Math.random() - 0.5) * 90;
                state.companionOffsetY = (Math.random() - 0.5) * 52;
                state.wanderTimer = 42 + Math.floor(Math.random() * 54);
            }
            offsetX = Number(state.companionOffsetX) || 0;
            offsetY = Number(state.companionOffsetY) || 0;
        }
        return {
            x: Math.max(28, Math.min(372, playerX + sideFallback * 48 + offsetX)),
            y: Math.max(18, Math.min(476, playerY - 18 + offsetY))
        };
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

    function registerCompanionInterception(sourceAction) {
        if (sourceAction && sourceAction._mbGERInterceptionRegistered) return;
        if (sourceAction && typeof sourceAction === "object") sourceAction._mbGERInterceptionRegistered = true;
        state.hitFlash = Math.max(Number(state.hitFlash) || 0, 8);
        state.lastHitAt = now();
        addCharge(8);
        spawnHitEffect(state.x, state.y, "#ffe887");
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
        var total = Math.max(6, Math.floor(maxHp * 0.012));
        var comboDuration = GE_MUDA_DURATION;
        var boss = target || getBossPosition(ctx, state.x, state.y);
        state.windup = 0;
        state.swingTimer = 0;
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
        state.comboCooldownUntil = current + comboDuration + 700;
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
        var attackRate = 1;
        duration = Math.max(1, Math.round(duration / attackRate));
        firstHitDelay = Math.max(1, Math.round(firstHitDelay / attackRate));
        interval = Math.max(1, Math.round(interval / attackRate));
        var damagePercent = seeds ? 0.0085 : 0.009;
        var maxHp = getAttackBossMaxHp(ctx, target);
        var boss = target || getBossPosition(ctx, state.x, state.y);

        state.windup = 0;
        state.swingTimer = 0;
        state.specialAttack = {
            type: type,
            targetType: ctx.type,
            targetId: target ? target.id : null,
            total: Math.max(4, Math.floor(maxHp * damagePercent)),
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
        state.nextAttackAt = current + duration + 520;
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
        if (distance <= 145) choices.push("muda", "muda", "muda");
        if (distance <= 330) choices.push("vines", "vines");
        if (distance <= 560) choices.push("seeds", "seeds", "seeds");
        if (!choices.length) return false;
        var freshChoices = choices.filter(function (type) { return type !== state.lastAttackType; });
        if (!freshChoices.length) freshChoices = choices;
        var selected = freshChoices[Math.floor(Math.random() * freshChoices.length)];
        if (selected === "muda") return beginMudaCombo(ctx, target, currentCard());
        return beginSpecialAttack(ctx, target, selected);
    }

    function beginSeedShot(ctx, target) {
        if (!ctx || (ctx.type !== "arena" && !target) || state.windup > 0 || state.attackCooldown > 0) return false;
        var boss = target || getBossPosition(ctx, state.x, state.y);
        var dx = Number(boss.x) - state.x, dy = Number(boss.y) - state.y;
        var distance = Math.max(1, Math.hypot(dx, dy));
        var travelFrames = Math.min(18, Math.max(2, distance / 9));
        var lead = 0.34 + Math.max(0.94, Number(state.aiSkill) || 0.94) * 0.36;
        var leadX = Math.max(-2.2, Math.min(2.2, Number(boss.vx) || 0)) * travelFrames * lead;
        var leadY = Math.max(-1.8, Math.min(1.8, Number(boss.vy) || 0)) * travelFrames * lead;
        var aimError = (Math.random() - 0.5) * 0.06;
        state.targetId = target ? target.id : null;
        state.attackAngle = Math.atan2(dy + leadY, dx + leadX) + aimError;
        state.windup = 3;
        state.swingTimer = 5;
        state.attackCooldown = 18;
        state.facing = Math.cos(state.attackAngle) < 0 ? -1 : 1;
        return true;
    }

    function fireSeedProjectile(ctx, target) {
        if (!ctx) return false;
        if (ctx.type !== "arena" && !target) return false;
        var maxHp = getAttackBossMaxHp(ctx, target);
        var angle = Number(state.attackAngle) || 0;
        var damage = Math.max(1, Math.floor(maxHp * 0.0012));
        state.projectiles.push({
            x: state.x + Math.cos(angle) * 9,
            y: state.y + Math.sin(angle) * 9,
            vx: Math.cos(angle) * 9.5,
            vy: Math.sin(angle) * 9.5,
            speed: 9.5,
            angle: angle,
            life: 75,
            damage: damage,
            targetType: ctx.type,
            targetId: target ? target.id : null,
            phase: Math.random() * Math.PI * 2
        });
        state.lastAttackType = "life-seed";
        state.attackUntil = now() + 110;
        state.nextSeedAt = now() + 420;
        return true;
    }

    function updateSeedProjectiles(ctx, frameScale) {
        if (!Array.isArray(state.projectiles) || !state.projectiles.length) return;
        for (var i = state.projectiles.length - 1; i >= 0; i--) {
            var seed = state.projectiles[i];
            if (!seed || seed.targetType !== ctx.type) {
                state.projectiles.splice(i, 1);
                continue;
            }
            var target = ctx.type === "arena" ? null : getUniqueBossTarget(ctx, seed.targetId);
            if (ctx.type !== "arena" && !target) {
                target = getUniqueBossTarget(ctx);
                if (target) seed.targetId = target.id;
            }
            if (ctx.type !== "arena" && !target) {
                state.projectiles.splice(i, 1);
                continue;
            }
            var boss = target || getBossPosition(ctx, state.x, state.y);
            var dx = Number(boss.x) - seed.x, dy = Number(boss.y) - seed.y;
            var dist = Math.max(1, Math.hypot(dx, dy));
            var desiredVx = dx / dist * seed.speed, desiredVy = dy / dist * seed.speed;
            seed.vx += (desiredVx - seed.vx) * 0.055 * frameScale;
            seed.vy += (desiredVy - seed.vy) * 0.055 * frameScale;
            var speed = Math.hypot(seed.vx, seed.vy) || seed.speed;
            if (speed > seed.speed) {
                seed.vx = seed.vx / speed * seed.speed;
                seed.vy = seed.vy / speed * seed.speed;
            }
            seed.x += seed.vx * frameScale;
            seed.y += seed.vy * frameScale;
            seed.angle = Math.atan2(seed.vy, seed.vx);
            seed.phase += 0.18 * frameScale;
            seed.life -= frameScale;

            var hitRadius = target ? Math.max(12, (Number(target.size) || 28) * 0.5 + 7) : 23;
            if (Math.hypot(Number(boss.x) - seed.x, Number(boss.y) - seed.y) <= hitRadius) {
                applyCompanionBossDamage(ctx, target, seed.damage);
                state.lastSeedImpactAt = now();
                state.lastSeedImpactX = Number(boss.x) || seed.x;
                state.lastSeedImpactY = Number(boss.y) || seed.y;
                spawnHitEffect(state.lastSeedImpactX, state.lastSeedImpactY, "#9bffad");
                state.projectiles.splice(i, 1);
                continue;
            }
            if (seed.life <= 0 || seed.x < -40 || seed.x > 440 || seed.y < -40 || seed.y > 540) {
                state.projectiles.splice(i, 1);
            }
        }
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
        var current = now(), ctx = getContext();
        if (!ctx || typeof ctx.getHeartX !== "function" || typeof ctx.getHeartY !== "function") return;
        var frameScale = Math.max(0.35, Math.min(2.2, (Number(dt) || 16.667) / 16.667));
        var playerX = Number(ctx.getHeartX()) || 200;
        var playerY = Number(ctx.getHeartY()) || 400;
        var playerHp = Math.max(0, Number(ctx.getPlayerHp && ctx.getPlayerHp()) || 0);
        var playerMaxHp = Math.max(1, Number(ctx.getPlayerMaxHp && ctx.getPlayerMaxHp()) || 1);
        var target = ctx.type === "arena" ? null : getUniqueBossTarget(ctx, state.targetId);
        if (ctx.type !== "arena" && !target) target = getUniqueBossTarget(ctx);
        if (target) state.targetId = target.id;
        var boss = target || getBossPosition(ctx, playerX, playerY);

        state.heartSize = getCompanionSize(ctx);
        state.aiSkill = Math.min(0.99, Math.max(0.96, Number(state.aiSkill) || 0.96) + 0.0002 * frameScale);

        if (state.healState === "idle" && current >= (Number(state.healCooldownUntil) || 0) &&
            playerHp > 0 && playerHp < playerMaxHp * 0.40 && (Number(state.stunTimer) || 0) <= 0) {
            beginCompanionHeal(ctx, playerX, playerY, playerMaxHp, current);
        }

        if (state.stunTimer > 0) {
            state.stunTimer = Math.max(0, state.stunTimer - frameScale);
            state.vx *= 0.72; state.vy *= 0.72;
            state.moveTargetX = state.x; state.moveTargetY = state.y;
        }
        if (state.dodgeCooldown > 0) state.dodgeCooldown = Math.max(0, state.dodgeCooldown - frameScale);
        if (state.dodgePlanTimer > 0) state.dodgePlanTimer = Math.max(0, state.dodgePlanTimer - frameScale);
        if (state.dodgeFlashTimer > 0) state.dodgeFlashTimer = Math.max(0, state.dodgeFlashTimer - frameScale);
        if (state.hitFlash > 0) state.hitFlash = Math.max(0, state.hitFlash - frameScale);
        if (state.attackCooldown > 0) state.attackCooldown = Math.max(0, state.attackCooldown - frameScale);
        if (state.swingTimer > 0) state.swingTimer = Math.max(0, state.swingTimer - frameScale);

        var goal = chooseCompanionGoal(ctx, playerX, playerY, boss, frameScale);
        state.moveTargetX = goal.x;
        state.moveTargetY = goal.y;
        var incoming = state.stunTimer > 0 ? null : findIncomingCompanionThreat(ctx);
        var urgentThreat = !!incoming && incoming.time <= 8;
        var newThreat = !!incoming && incoming.attack !== state.lastThreatAttack;
        var dodging = false;

        if (incoming && incoming.time <= Math.round(150 + state.aiSkill * 56) &&
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

        // Same eased movement as Oden: accelerate towards a real combat lane and brake naturally.
        var calm = !incoming && !dodging && state.healState === "idle";
        var driftX = calm ? Math.sin(current / 420 + (Number(state.footworkPhase) || 0)) * 4.2 : 0;
        var driftY = calm ? Math.cos(current / 610 + (Number(state.footworkPhase) || 0)) * 3.0 : 0;
        var toX = state.moveTargetX + driftX - state.x;
        var toY = state.moveTargetY + driftY - state.y;
        var distanceToGoal = Math.hypot(toX, toY) || 1;
        var maxSpeed = getCompanionMovementSpeed(ctx);
        var desiredSpeed = distanceToGoal < (calm ? 7 : 2)
            ? 0 : Math.min(maxSpeed, Math.max(0.45, distanceToGoal * 0.22));
        var desiredVx = toX / distanceToGoal * desiredSpeed;
        var desiredVy = toY / distanceToGoal * desiredSpeed;
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

        if (state.trail) {
            state.trail.push({ x: state.x, y: state.y, life: 10 });
            if (state.trail.length > 9) state.trail.shift();
            for (var tr = state.trail.length - 1; tr >= 0; tr--) state.trail[tr].life -= frameScale;
            while (state.trail.length && state.trail[0].life <= 0) state.trail.shift();
        }

        if (state.healState === "approach" &&
            Math.hypot(state.x - playerX, state.y - playerY) <= 58) {
            state.healState = "channel";
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

        var bossDistance = Math.hypot(state.x - (Number(boss.x) || state.x),
            state.y - (Number(boss.y) || state.y));
        if (state.healState === "idle" && state.stunTimer <= 0) {
            // Oden's short wind-up, repeated independently of the signature abilities.
            if (state.windup > 0) {
                state.windup = Math.max(0, state.windup - frameScale);
                if (state.windup <= 0) {
                    var shotTarget = ctx.type === "arena" ? null :
                        (getUniqueBossTarget(ctx, state.targetId) || getUniqueBossTarget(ctx));
                    fireSeedProjectile(ctx, shotTarget);
                }
            } else if (!dodging && !state.combo && !state.specialAttack &&
                state.attackCooldown <= 0 && (ctx.type === "arena" || target)) {
                beginSeedShot(ctx, target);
            }

            updateSeedProjectiles(ctx, frameScale);

            if (state.combo) updateMudaCombo(ctx);
            else if (state.specialAttack) updateSpecialAttack(ctx);

            var currentTarget = ctx.type === "arena" ? null :
                (getUniqueBossTarget(ctx, state.targetId) || getUniqueBossTarget(ctx));
            var activePosition = currentTarget || getBossPosition(ctx, state.x, state.y);
            var attackDistance = Math.hypot(state.x - Number(activePosition.x),
                state.y - Number(activePosition.y));
            if (!state.combo && !state.specialAttack && current >= state.nextAttackAt &&
                (ctx.type === "arena" || currentTarget) && attackDistance <= 560) {
                beginCompanionAttack(ctx, currentTarget, attackDistance);
            }
        } else {
            state.windup = 0;
            state.swingTimer = 0;
        }
        if (state.healState !== "idle" || state.stunTimer > 0) {
            state.combo = null;
            state.specialAttack = null;
            state.attackType = null;
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
        var current = now(), ctx = getContext();
        var size = getCompanionSize(ctx);
        state.heartSize = size;
        var scale = size / 15, hitFlash = state.hitFlash > 0;
        var healing = state.healState !== "idle";
        var dodging = !!state.isDodging || state.dodgeFlashTimer > 0;
        var attacking = !!(state.combo || state.specialAttack || current < state.attackUntil);
        function heartPath(target, r) {
            target.beginPath();
            target.moveTo(0, r * 0.45);
            target.bezierCurveTo(-r * 0.13, r * 0.25, -r * 0.64, -r * 0.05, -r * 0.64, -r * 0.38);
            target.bezierCurveTo(-r * 0.64, -r * 0.80, -r * 0.16, -r * 0.88, 0, -r * 0.58);
            target.bezierCurveTo(r * 0.16, -r * 0.88, r * 0.64, -r * 0.80, r * 0.64, -r * 0.38);
            target.bezierCurveTo(r * 0.64, -r * 0.05, r * 0.13, r * 0.25, 0, r * 0.45);
            target.closePath();
        }
        c.save();
        c.translate(state.x, state.y + Math.sin(current / 170) * 0.75);
        c.scale(scale, scale);
        c.globalAlpha = hitFlash ? 0.8 : 1;
        var halo = c.createRadialGradient(0, -1, 1, 0, 0, 14);
        halo.addColorStop(0, healing ? "rgba(126,255,166,.24)" : "rgba(255,218,105,.22)");
        halo.addColorStop(1, "rgba(255,190,55,0)");
        c.fillStyle = halo; c.beginPath(); c.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2); c.fill();
        if (dodging || healing) {
            c.strokeStyle = healing ? "#8bffbd" : "#a8ff9a";
            c.lineWidth = healing ? 1.8 : 1.5;
            c.shadowColor = c.strokeStyle; c.shadowBlur = 11;
            c.globalAlpha *= 0.82;
            c.beginPath(); c.ellipse(0, 0, 13 + Math.sin(current / 50) * 0.7, 10, 0, 0, Math.PI * 2); c.stroke();
            c.shadowBlur = 0; c.globalAlpha = hitFlash ? 0.8 : 1;
        }
        var gradient = c.createLinearGradient(-3, -18, 5, 13);
        gradient.addColorStop(0, hitFlash ? "#fffdf0" : "#fff2b2");
        gradient.addColorStop(0.24, hitFlash ? "#fff4c9" : "#ffdf72");
        gradient.addColorStop(0.58, "#f4ad35");
        gradient.addColorStop(0.82, "#d77a1d");
        gradient.addColorStop(1, "#8e4a14");
        c.fillStyle = gradient; c.strokeStyle = "#65370f"; c.lineWidth = 1.35;
        c.shadowColor = "#ffd34f"; c.shadowBlur = attacking ? 15 : 8;
        heartPath(c, 15); c.fill(); c.stroke(); c.shadowBlur = 0;
        c.save();
        heartPath(c, 14); c.clip();
        c.strokeStyle = "rgba(255,246,190,.55)"; c.lineWidth = 1.1;
        c.beginPath(); c.moveTo(-12, -8); c.quadraticCurveTo(-9, -17, -2, -15); c.stroke();
        c.fillStyle = "rgba(255,255,225,.22)";
        c.beginPath(); c.ellipse(-6.5, -9.5, 3.8, 5.2, -0.48, 0, Math.PI * 2); c.fill();
        c.restore();
        c.save();
        c.strokeStyle = "#27743e"; c.lineWidth = 1.1; c.lineCap = "round";
        c.beginPath(); c.moveTo(0, -7); c.quadraticCurveTo(0, -12, 0, -14); c.stroke();
        c.fillStyle = "#67df82"; c.strokeStyle = "#286e3d";
        c.beginPath();
        c.ellipse(-3.3, -11.8, 3.5, 1.7, -0.45, 0, Math.PI * 2);
        c.ellipse(3.3, -11.8, 3.5, 1.7, 0.45, 0, Math.PI * 2);
        c.fill(); c.stroke();
        c.shadowColor = "#8dff9d"; c.shadowBlur = 7;
        c.fillStyle = "#58d878"; c.strokeStyle = "#236d39"; c.lineWidth = 0.9;
        c.beginPath(); c.moveTo(0, -4.8); c.lineTo(3.8, -0.8); c.lineTo(0, 3.2); c.lineTo(-3.8, -0.8); c.closePath();
        c.fill(); c.stroke(); c.shadowBlur = 0;
        c.strokeStyle = "#d9ffac"; c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(-1.3, -1.2); c.lineTo(1, 1); c.stroke();
        c.restore();
        c.restore();

        if (Array.isArray(state.projectiles)) {
            for (var seedIndex = 0; seedIndex < state.projectiles.length; seedIndex++) {
                var seed = state.projectiles[seedIndex];
                if (!seed) continue;
                c.save();
                c.translate(seed.x, seed.y);
                c.rotate(Number(seed.angle) || 0);
                c.globalCompositeOperation = "lighter";
                c.globalAlpha = 0.9;
                c.shadowColor = "#76ff9c";
                c.shadowBlur = 8;
                c.fillStyle = "#a8ffb5";
                c.strokeStyle = "#337c42";
                c.lineWidth = 0.8;
                c.beginPath();
                c.ellipse(0, 0, 4.8, 2.1, 0, 0, Math.PI * 2);
                c.fill(); c.stroke();
                c.strokeStyle = "rgba(205,255,210,.8)";
                c.beginPath(); c.moveTo(-1.5, 0); c.lineTo(2.4, 0); c.stroke();
                c.restore();
            }
        }

        var seedImpactAge = current - state.lastSeedImpactAt;
        if (seedImpactAge >= 0 && seedImpactAge < 130) {
            c.save();
            c.globalCompositeOperation = "lighter";
            c.globalAlpha = Math.max(0, 1 - seedImpactAge / 130) * 0.72;
            c.strokeStyle = "#b5ffc2";
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(state.lastSeedImpactX, state.lastSeedImpactY,
                4 + seedImpactAge * 0.09, 0, Math.PI * 2);
            c.stroke();
            c.restore();
        }

        var impactAge = current - state.lastMudaImpactAt;
        if (state.combo && impactAge >= 0 && impactAge < 95) {
            c.save(); c.globalCompositeOperation = "lighter";
            c.globalAlpha = Math.max(0, 1 - impactAge / 95) * 0.78;
            c.translate(state.lastMudaImpactX, state.lastMudaImpactY);
            c.rotate((state.lastMudaImpactIndex % 2 ? 1 : -1) * 0.35);
            c.strokeStyle = "#ffe6a0"; c.lineWidth = 2;
            c.beginPath(); c.moveTo(-10, -5); c.lineTo(7, 4); c.moveTo(-7, 7); c.lineTo(8, -6); c.stroke();
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
            title.textContent = activeLeft > 0
                ? "RETURN TO ZERO · " + state.gerCharges + " ЗАРЯДА · " + (activeLeft / 1000).toFixed(1) + "с"
                : "REQUIEM · ЗАРЯД " + Math.floor(state.charge) + "%";
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
            btn.title = "При 100% заряда: 5 секунд и 2 обнуления. Золотое Сердце сопровождает Джорно, уклоняется, атакует и перенаправляет попавшие по нему удары Джорно со снижением урона на 50%.";
            if (status) {
                status.textContent = "";
                status.style.display = "none";
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
        state.nextAttackAt = current + 950;
        state.nextHealAt = current;
        state.healCooldownUntil = current;
        state.projectiles = [];
        state.targetId = null;
        state.attackCooldown = 0;
        state.windup = 0;
        state.swingTimer = 0;
        state.seedCooldownUntil = current;
        state.nextSeedAt = current;
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
        finishMudaCombo();
        state.specialAttack = null;
        state.attackType = null;
        state.trail = [];
        state.projectiles = [];
        state.targetId = null;
        state.windup = 0;
        state.swingTimer = 0;
        state.attackCooldown = 0;
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
        state.projectiles = [];
        state.targetId = null;
        state.attackCooldown = 0;
        state.windup = 0;
        state.swingTimer = 0;
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
            registerCompanionInterception(null);
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
        attack.dioStandHitOnce = true;
        registerCompanionInterception(attack);
        return true;
    };
    window.MBGoldExperienceRedirectDamage = function (rawDamage, ctx, sourceAction) {
        if (!window.MBIsGoldExperienceNpcActive() || !sourceAction ||
            typeof sourceAction !== "object" ||
            typeof window.dioAttackTouchesStand !== "function") return null;
        if (sourceAction._mbGERStandDamageRedirected || sourceAction.dioStandHitOnce) return null;
        var hit = false;
        try { hit = window.dioAttackTouchesStand(ctx || getContext(), sourceAction) === true; } catch (e) {}
        if (!hit) return null;
        sourceAction.dioStandHitOnce = true;
        sourceAction._mbGERStandDamageRedirected = true;
        registerCompanionInterception(sourceAction);
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