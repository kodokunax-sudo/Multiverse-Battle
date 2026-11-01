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
    var GE_COMPANION_DAMAGE_RATE = 0.002;
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
    state.punch = state.punch || null;
    state.punchEffects = Array.isArray(state.punchEffects) ? state.punchEffects : [];
    state.nextMudaAt = Number(state.nextMudaAt) || 0;
    state.punchHand = Number(state.punchHand) || 1;
    state.orbitPhase = Number(state.orbitPhase) || Math.random() * Math.PI * 2;
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

        var type = String(attack.type || attack.kind || "").toLowerCase();
        var telegraph = attack.state === "warning" || attack.state === "windup" ||
            Number(attack.warningTimer) > 0 || Number(attack.warning) > 0 ||
            type.indexOf("warning") !== -1 || type.indexOf("telegraph") !== -1;
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

        // Anti-Spiral stores attack kinds in "kind" and warning counters in "warning".
        if (type === "sweep" || type === "barrierlaser") {
            var sweepOrientation = String(attack.orientation || "horizontal").toLowerCase();
            var sweepThickness = Math.max(12, Number(attack.thickness) || Number(attack.width) || 22);
            if (sweepOrientation === "vertical") {
                var sweepX = Number(attack.x);
                if (Number.isFinite(sweepX) && Math.abs(x - sweepX) < sweepThickness * 0.5 + body + padding) {
                    return { x: sweepX, y: y, axis: "vertical", distance: Math.abs(x - sweepX), attack: attack };
                }
            } else {
                var sweepY = Number(attack.y);
                if (Number.isFinite(sweepY) && Math.abs(y - sweepY) < sweepThickness * 0.5 + body + padding) {
                    return { x: x, y: sweepY, axis: "horizontal", distance: Math.abs(y - sweepY), attack: attack };
                }
            }
            return null;
        }
        if (type === "zonelaser") {
            var zoneHeight = Math.max(30, Number(attack.height) || 80);
            var zoneDistance = Math.max(0, Number(attack.sweepDistance) || 0) * Math.min(1, t / 30);
            var zone = String(attack.zone || "").toLowerCase();
            var inZone = zone === "lower"
                ? y >= 500 - zoneHeight - zoneDistance - body - padding
                : zone === "upper"
                    ? y <= zoneHeight + zoneDistance + body + padding
                    : false;
            if (inZone) {
                var zoneY = zone === "lower" ? 500 - zoneHeight * 0.5 : zoneHeight * 0.5;
                return { x: x, y: zoneY, axis: "horizontal", distance: Math.abs(y - zoneY), attack: attack };
            }
            return null;
        }
        if (type === "mark" || type === "well") {
            var areaRadius = Math.max(8, Number(attack.radius) || (type === "well" ? 84 : 26));
            var areaDistance = Math.hypot(x - ax, y - ay);
            var areaPadding = type === "well" ? body + (alert ? 24 : 0) : body + padding;
            if (areaDistance < areaRadius + areaPadding) {
                return { x: ax, y: ay, axis: "point", distance: areaDistance, attack: attack };
            }
            return null;
        }
        if (type === "spike") {
            var spikeX = Number(attack.x);
            var spikeHeight = Math.max(Number(attack.height) || 0, Number(attack.maxHeight) || 0);
            var spikeWidth = Math.max(12, Number(attack.width) || Number(attack.size) || 20);
            var spikeTop = 500 - spikeHeight;
            if (Number.isFinite(spikeX) && Math.abs(x - spikeX) < spikeWidth * 0.5 + body + padding &&
                y >= spikeTop - body - padding) {
                return { x: spikeX, y: spikeTop, axis: "vertical", distance: Math.abs(x - spikeX), attack: attack };
            }
            return null;
        }

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

        var hasAnchor = [attack.x, attack.y, attack.targetX, attack.targetY,
            attack.originX, attack.originY].some(function (value) {
                return value !== undefined && value !== null && Number.isFinite(Number(value));
            });
        var hasSegment = [attack.x1, attack.y1, attack.x2, attack.y2,
            attack.originX, attack.originY, attack.endX, attack.endY].every(function (value) {
                return value !== undefined && value !== null && Number.isFinite(Number(value));
            });
        var hasPath = Array.isArray(attack.path) && attack.path.length > 1;
        if (!hasAnchor && !hasSegment && !hasPath) return null;

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
            var horizontal = attack.direction === "horizontal" || attack.orientation === "horizontal" ||
                attack.zone === "upper" || attack.zone === "lower" || attack.horizontal === true ||
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
            var ringSpeed = Number(attack.speed) || Number(attack.expansionSpeed) || Number(attack.growth) || 0;
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
        var horizon = Math.round(168 + skill * 66);
        var times = [0, 2, 4, 7, 11, 16, 23, 32, 44, 58, 74, 92, 116, 145, horizon];
        var goalX = Number.isFinite(Number(state.moveTargetX)) ? Number(state.moveTargetX) : state.x;
        var goalY = Number.isFinite(Number(state.moveTargetY)) ? Number(state.moveTargetY) : state.y;
        var coastX = Math.max(18, Math.min(382, state.x + (Number(state.vx) || 0) * 9));
        var coastY = Math.max(8, Math.min(482, state.y + (Number(state.vy) || 0) * 9));
        var routes = [
            predictCompanionRoute(ctx, goalX, goalY, times),
            predictCompanionRoute(ctx, coastX, coastY, times)
        ];
        var earliest = null;
        var bestTime = Infinity;

        for (var r = 0; r < routes.length; r++) {
            var route = routes[r];
            for (var a = attacks.length - 1; a >= 0; a--) {
                for (var p = 0; p < route.length; p++) {
                    var point = route[p];
                    var risk = companionThreatAt(attacks[a], point.x, point.y, point.time, true);
                    if (risk && point.time < bestTime) {
                        bestTime = point.time;
                        earliest = {
                            risk: risk, time: point.time, attack: attacks[a],
                            attackType: attacks[a].type || attacks[a].kind,
                            predictedX: point.x, predictedY: point.y
                        };
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
                        earliest = {
                            risk: waveRisk, time: wavePoint.time, attack: waves[w],
                            attackType: "shockwave", predictedX: wavePoint.x, predictedY: wavePoint.y
                        };
                        break;
                    }
                }
            }
        }
        return earliest;
    }

    function chooseSafeCompanionDodge(ctx, incoming) {
        var left = 24, right = 376, top = 18, bottom = 474;
        var angles = 24, distances = [76, 112, 152, 188];
        var futureTimes = [0, 4, 8, 13, 20, 29, 41, 56, 74];
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
                            collisions++; score -= p < 2 ? 132 : 92;
                        }
                    }
                    for (var w = waves.length - 1; w >= 0; w--) {
                        if (companionShockwaveThreat(waves[w], point.x, point.y, point.time, true)) {
                            collisions++; score -= p < 2 ? 118 : 84;
                        }
                    }
                }
                if (collisions === 0) score += 330;
                else score -= collisions * 24;
                if (incoming && incoming.risk) {
                    score += Math.min(220, Math.hypot(tx - incoming.risk.x, ty - incoming.risk.y)) * 0.42;
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
                if (bossDistance < 92) score -= (92 - bossDistance) * 1.8;
                else score += Math.min(70, bossDistance - 92) * 0.08;
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

        if (state.healState !== "idle") {
            var healSide = Number(state.healSide) || 1;
            return {
                x: Math.max(30, Math.min(370, playerX + healSide * 43)),
                y: Math.max(28, Math.min(456, playerY - 7))
            };
        }

        var bossX = Number(boss && boss.x);
        var bossY = Number(boss && boss.y);
        if (Number.isFinite(bossX) && Number.isFinite(bossY)) {
            // Close the gap, hold striking range, and keep changing angle like an active fighter.
            var leadX = Math.max(-20, Math.min(20, (Number(boss.vx) || 0) * 5));
            var leadY = Math.max(-15, Math.min(15, (Number(boss.vy) || 0) * 5));
            var predictedX = bossX + leadX;
            var predictedY = bossY + leadY;
            var awayX = state.x - predictedX;
            var awayY = state.y - predictedY;
            var distance = Math.hypot(awayX, awayY);

            if (distance < 12) {
                awayX = playerX - predictedX;
                awayY = playerY - predictedY;
                distance = Math.hypot(awayX, awayY);
            }
            if (distance < 1) {
                awayX = 1;
                awayY = 0;
                distance = 1;
            }

            var angle = Math.atan2(awayY, awayX);
            angle += Math.sin(now() / 620 + state.orbitPhase) * 0.34;
            var desiredRange = 122 + Math.sin(now() / 510 + state.orbitPhase * 0.7) * 9;
            var goalX = predictedX + Math.cos(angle) * desiredRange;
            var goalY = predictedY + Math.sin(angle) * desiredRange;

            if (goalX < 28 || goalX > 372) {
                angle = Math.PI - angle;
                goalX = predictedX + Math.cos(angle) * desiredRange;
                goalY = predictedY + Math.sin(angle) * desiredRange;
            }
            if (goalY < 24 || goalY > 476) {
                angle = -angle;
                goalX = predictedX + Math.cos(angle) * desiredRange;
                goalY = predictedY + Math.sin(angle) * desiredRange;
            }
            goalX = Math.max(24, Math.min(376, goalX));
            goalY = Math.max(20, Math.min(480, goalY));

            if (lowHp) {
                goalX = goalX * 0.91 + playerX * 0.09;
                goalY = goalY * 0.91 + playerY * 0.09;
            }
            return { x: goalX, y: goalY };
        }

        // Anti-Spiral fallback: patrol near the boss, never follow Giorno.
        if (ctx.type === "antispiral") {
            var antiBoss = typeof window.getAntiSpiralBossPosition === "function"
                ? window.getAntiSpiralBossPosition() : null;
            var antiBossX = Number(antiBoss && antiBoss.x);
            var antiBossY = Number(antiBoss && antiBoss.y);
            if (Number.isFinite(antiBossX) && Number.isFinite(antiBossY)) {
                var patrolAngle = Math.atan2(state.y - antiBossY, state.x - antiBossX) +
                    Math.sin(now() / 680 + state.orbitPhase) * 0.28;
                return {
                    x: Math.max(24, Math.min(376, antiBossX + Math.cos(patrolAngle) * 122)),
                    y: Math.max(20, Math.min(480, antiBossY + Math.sin(patrolAngle) * 122))
                };
            }
        }
        // Other bosses: stay beside Giorno only when no boss target exists.
        state.companionModeTimer = Math.max(0, (Number(state.companionModeTimer) || 0) - frameScale);
        if (state.companionModeTimer <= 0) {
            state.companionSide = Math.random() < 0.5 ? -1 : 1;
            state.companionOffsetX = (Math.random() - 0.5) * 38;
            state.companionOffsetY = (Math.random() - 0.5) * 28;
            state.companionModeTimer = 80 + Math.floor(Math.random() * 70);
        }
        return {
            x: Math.max(28, Math.min(372, playerX + (Number(state.companionSide) || 1) * 42 + (Number(state.companionOffsetX) || 0))),
            y: Math.max(18, Math.min(476, playerY - 18 + (Number(state.companionOffsetY) || 0)))
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
        if (!ctx) return false;
        var damage = Math.max(1, Math.ceil(Number(amount) || 1));

        if (target && typeof window.MBDioApplyBossDamage === "function") {
            var beforeTarget = getUniqueBossTarget(ctx, target.id) || target;
            var beforeHp = Number(beforeTarget && beforeTarget.hp);
            try {
                window.MBDioApplyBossDamage(target.type, target.id, damage);
                var afterTarget = getUniqueBossTarget(ctx, target.id);
                var afterHp = Number(afterTarget && afterTarget.hp);
                if (Number.isFinite(beforeHp) && Number.isFinite(afterHp) && afterHp < beforeHp) {
                    if (typeof window.showFloatingText === "function") {
                        window.showFloatingText("-" + Math.ceil(beforeHp - afterHp) + " GER", "#ffe29a");
                    }
                    return true;
                }
            } catch (e) {}
        }

        if (typeof window.MBApplyBossDamage === "function") {
            try {
                var dealt = Number(window.MBApplyBossDamage(ctx, damage, "Gold Experience Requiem")) || 0;
                if (dealt > 0) return true;
            } catch (e) {}
        }

        if (ctx.type === "arena") {
            var before = Number(ctx.getBossHp && ctx.getBossHp()) || 0;
            if (!(before > 0) || typeof ctx.setBossMaxHp !== "function") return false;
            try {
                ctx.setBossMaxHp(Math.max(0, before - damage));
                return Number(ctx.getBossHp()) < before;
            } catch (e) {}
        }
        return false;
    }

    function getAttackBossMaxHp(ctx, target) {
        if (ctx && ctx.type === "waystar" && typeof ctx.getBossMaxHp === "function") {
            try {
                var sharedMax = Number(ctx.getBossMaxHp()) || 0;
                if (sharedMax > 0) return sharedMax;
            } catch (e) {}
        }
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
        var damagePerHit = Math.max(1, Math.ceil(maxHp * GE_COMPANION_DAMAGE_RATE));
        var total = damagePerHit * GE_MUDA_HITS;
        var comboDuration = GE_MUDA_DURATION;
        var boss = target || getBossPosition(ctx, state.x, state.y);
        state.windup = 0;
        state.swingTimer = 0;
        state.punch = null;
        state.combo = {
            type: ctx.type,
            id: target ? target.id : null,
            total: total,
            damagePerHit: damagePerHit,
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
        state.nextMudaAt = current + 11000 + Math.random() * 6000;
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
            var hitDamage = Math.max(1, Number(combo.damagePerHit) ||
                Math.ceil(getAttackBossMaxHp(ctx, target) * GE_COMPANION_DAMAGE_RATE));
            applyCompanionBossDamage(ctx, target, hitDamage);
            combo.nextHitAt = combo.startedAt + combo.hitIndex * hitInterval;
            state.attackUntil = current + 145;
            state.lastMudaImpactAt = current;
            state.lastMudaImpactX = combo.x + (Math.random() - 0.5) * 7;
            state.lastMudaImpactY = combo.y + (Math.random() - 0.5) * 7;
            state.lastMudaImpactIndex = combo.hitIndex;
            spawnPunchEffect(state.lastMudaImpactX, state.lastMudaImpactY,
                Math.atan2(combo.y - state.y, combo.x - state.x), true);
        }

        if (current >= combo.endsAt) {
            finishMudaCombo();
        }
    }

    function spawnPunchEffect(x, y, angle, heavy) {
        var current = now();
        var effects = Array.isArray(state.punchEffects) ? state.punchEffects : [];
        state.punchEffects = effects;
        effects.push({
            kind: "burst", x: Number(x) || 0, y: Number(y) || 0,
            angle: Number(angle) || 0, startedAt: current,
            duration: heavy ? 300 : 220, heavy: !!heavy
        });

        var count = heavy ? 13 : 8;
        for (var i = 0; i < count; i++) {
            var a = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.45;
            var speed = (heavy ? 2.4 : 1.7) + Math.random() * (heavy ? 3.8 : 2.6);
            var life = 10 + Math.random() * 9;
            effects.push({
                kind: "spark", x: Number(x) || 0, y: Number(y) || 0,
                vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
                life: life, maxLife: life,
                size: 1.2 + Math.random() * (heavy ? 2.5 : 1.8),
                color: i % 3 === 0 ? "#fff8d8" : (i % 2 === 0 ? "#ffd66b" : "#f4a52b")
            });
        }
        if (effects.length > 110) effects.splice(0, effects.length - 110);
        spawnHitEffect(Number(x) || 0, Number(y) || 0, heavy ? "#fff0a4" : "#ffd66b");
    }

    function updatePunchEffects(frameScale) {
        var effects = state.punchEffects;
        if (!Array.isArray(effects) || !effects.length) return;
        for (var i = effects.length - 1; i >= 0; i--) {
            var effect = effects[i];
            if (!effect) {
                effects.splice(i, 1);
                continue;
            }
            if (effect.kind === "spark") {
                effect.x += (Number(effect.vx) || 0) * frameScale;
                effect.y += (Number(effect.vy) || 0) * frameScale;
                effect.vx *= Math.pow(0.91, frameScale);
                effect.vy *= Math.pow(0.91, frameScale);
                effect.life -= frameScale;
                if (effect.life <= 0) effects.splice(i, 1);
            } else if (now() - effect.startedAt >= effect.duration) {
                effects.splice(i, 1);
            }
        }
    }

    function beginCompanionPunch(ctx, target) {
        if (!ctx || state.punch || state.combo || state.attackCooldown > 0) return false;
        if (ctx.type !== "arena" && !target) return false;
        var boss = target || getBossPosition(ctx, state.x, state.y);
        var dx = Number(boss.x) - state.x;
        var dy = Number(boss.y) - state.y;
        var distance = Math.max(1, Math.hypot(dx, dy));
        if (distance < 72 || distance > 190) return false;

        var travelFrames = Math.max(3, Math.min(16, distance / 8));
        var leadX = Math.max(-2.2, Math.min(2.2, Number(boss.vx) || 0)) * travelFrames * 0.65;
        var leadY = Math.max(-1.8, Math.min(1.8, Number(boss.vy) || 0)) * travelFrames * 0.65;
        var angle = Math.atan2(dy + leadY, dx + leadX);
        var maxHp = getAttackBossMaxHp(ctx, target);

        state.punchHand = (Number(state.punchHand) || 1) * -1;
        state.punch = {
            targetType: ctx.type, targetId: target ? target.id : null,
            targetX: Number(boss.x) || state.x, targetY: Number(boss.y) || state.y,
            angle: angle, side: state.punchHand, startedAt: now(), duration: 235,
            damage: Math.max(1, Math.ceil(maxHp * GE_COMPANION_DAMAGE_RATE)), hitDone: false
        };
        state.attackCooldown = 24 + Math.floor(Math.random() * 5);
        state.attackUntil = now() + 235;
        state.attackType = "punch";
        state.lastAttackType = "punch";
        state.facing = Math.cos(angle) < 0 ? -1 : 1;
        return true;
    }

    function beginCompanionSealPunch(ctx, seal) {
        if (!ctx || ctx.type !== "antispiral" || !seal || state.punch || state.combo ||
            state.attackCooldown > 0) return false;
        var dx = Number(seal.x) - state.x;
        var dy = Number(seal.y) - state.y;
        var distance = Math.hypot(dx, dy);
        if (distance < 14 || distance > 104) return false;
        var angle = Math.atan2(dy, dx);
        state.punchHand = (Number(state.punchHand) || 1) * -1;
        state.punch = {
            targetType: "antispiral", targetId: null,
            targetX: Number(seal.x), targetY: Number(seal.y),
            angle: angle, side: state.punchHand,
            startedAt: now(), duration: 235, damage: 0.5,
            hitDone: false, antiSpiralSeal: true, sealIndex: Number(seal.index)
        };
        state.attackCooldown = 32;
        state.attackUntil = now() + 235;
        state.attackType = "sealPunch";
        state.lastAttackType = "sealPunch";
        state.facing = Math.cos(angle) < 0 ? -1 : 1;
        return true;
    }

    function updateCompanionPunch(ctx, current) {
        var punch = state.punch;
        if (!punch || !ctx) return;
        if (punch.antiSpiralSeal && ctx.type === "antispiral") {
            var sealInfo = typeof window.getAntiSpiralBossCompanionInfo === "function"
                ? window.getAntiSpiralBossCompanionInfo() : null;
            var activeSeals = sealInfo && Array.isArray(sealInfo.seals) ? sealInfo.seals : [];
            var activeSeal = null;
            for (var si = 0; si < activeSeals.length; si++) {
                if (activeSeals[si] && activeSeals[si].index === punch.sealIndex) {
                    activeSeal = activeSeals[si];
                    break;
                }
            }
            if (!activeSeal) {
                state.punch = null;
                state.attackType = null;
                state.antiSpiralSealTargetIndex = null;
                return;
            }
            punch.targetX = Number(activeSeal.x);
            punch.targetY = Number(activeSeal.y);
            punch.angle = Math.atan2(punch.targetY - state.y, punch.targetX - state.x);
            state.facing = Math.cos(punch.angle) < 0 ? -1 : 1;
            var sealElapsed = current - punch.startedAt;
            if (!punch.hitDone && sealElapsed >= 92) {
                if (typeof window.damageAntiSpiralSeal === "function") {
                    window.damageAntiSpiralSeal(punch.sealIndex, 0.5);
                }
                punch.hitDone = true;
                spawnPunchEffect(punch.targetX, punch.targetY, punch.angle, false);
            }
            if (sealElapsed >= punch.duration) {
                state.punch = null;
                if (state.attackType === "sealPunch") state.attackType = null;
            }
            return;
        }
        if (punch.targetType !== ctx.type) {
            state.punch = null;
            return;
        }

        var target = ctx.type === "arena" ? null : getUniqueBossTarget(ctx, punch.targetId);
        if (ctx.type !== "arena" && !target) target = getUniqueBossTarget(ctx);
        if (ctx.type !== "arena" && !target) {
            state.punch = null;
            state.attackType = null;
            return;
        }

        var boss = target || getBossPosition(ctx, state.x, state.y);
        punch.targetX = Number(boss.x) || punch.targetX;
        punch.targetY = Number(boss.y) || punch.targetY;
        punch.angle = Math.atan2(punch.targetY - state.y, punch.targetX - state.x);
        state.facing = Math.cos(punch.angle) < 0 ? -1 : 1;

        var elapsed = current - punch.startedAt;
        if (!punch.hitDone && elapsed >= 92) {
            applyCompanionBossDamage(ctx, target, punch.damage);
            punch.hitDone = true;
            spawnPunchEffect(
                punch.targetX + (Math.random() - 0.5) * 9,
                punch.targetY + (Math.random() - 0.5) * 9,
                punch.angle, false
            );
        }
        if (elapsed >= punch.duration) {
            state.punch = null;
            if (state.attackType === "punch") state.attackType = null;
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
        state.punch = null;
        state.specialAttack = null;
        state.attackType = null;
        state.healStartedAt = current;
        toast("GOLD EXPERIENCE REQUIEM: ЖИЗНЕННАЯ ЭНЕРГИЯ!", "#9cffaa");
        spawnHitEffect(playerX, playerY, "#9cffaa");
    }

    function updateAntiSpiralCompanionPhysics(info, playerX, playerY, frameScale, current) {
        var direction = Math.max(0, Math.min(3, Number(info.gravityDirection) || 0));
        var gravity = info.gravity || [
            { x: 0, y: 1 }, { x: -1, y: 0 },
            { x: 0, y: -1 }, { x: 1, y: 0 }
        ][direction];
        var player = info.player || {};
        var playerScale = Number(player.scaleMode) || 1;
        var superSpeed = Math.max(0.15, Number(info.superSpeed) || 1);
        var speedMultiplier = (playerScale === 0.5 ? 1.5 : (playerScale === 2 ? 0.62 : 1)) * superSpeed;
        var radius = Math.max(7, Math.min(24, Number(player.size) || Number(state.heartSize) || 12));
        var bounds = info.bounds || { left: radius, right: 400 - radius, top: 55 + radius, bottom: 488 };
        var timeScale = Math.max(0.25, Math.min(1, Number(info.timeScale) || 1));
        var platforms = Array.isArray(info.platforms) ? info.platforms : [];

        if (!state.antiSpiralPhysicsInitialized) {
            // Spawn away from Giorno. From here the stand navigates to the boss by itself.
            var sideX = -gravity.y, sideY = gravity.x;
            state.x = Math.max(bounds.left, Math.min(bounds.right, playerX + sideX * 58));
            state.y = Math.max(bounds.top, Math.min(bounds.bottom, playerY + sideY * 58));
            state.vx = 0;
            state.vy = 0;
            state.antiSpiralGrounded = false;
            state.antiSpiralPlatformIndex = null;
            state.antiSpiralJumpCooldownUntil = 0;
            state.antiSpiralPhysicsInitialized = true;
        }
        if (state.antiSpiralGravityDirection !== direction) {
            state.antiSpiralGravityDirection = direction;
            state.antiSpiralGrounded = false;
            state.antiSpiralPlatformIndex = null;
            state.antiSpiralRoutePlatformIndex = null;
        }

        // AI direction is the equivalent of a joystick vector aimed at its own combat goal.
        // Route toward real intermediate platforms when the destination is on a higher level.
        var destinationX = state.antiSpiralSealTargetIndex != null &&
            Number.isFinite(Number(state.antiSpiralSealGoalX))
            ? Number(state.antiSpiralSealGoalX) : Number(state.moveTargetX);
        var destinationY = state.antiSpiralSealTargetIndex != null &&
            Number.isFinite(Number(state.antiSpiralSealGoalY))
            ? Number(state.antiSpiralSealGoalY) : Number(state.moveTargetY);
        if (!Number.isFinite(destinationX)) destinationX = Number(info.boss && info.boss.x) || 200;
        if (!Number.isFinite(destinationY)) destinationY = Number(info.boss && info.boss.y) || 135;
        var normalX = -gravity.x, normalY = -gravity.y;
        var tangentX = -gravity.y, tangentY = gravity.x;
        var currentHeight = state.x * normalX + state.y * normalY;
        var destinationHeight = destinationX * normalX + destinationY * normalY;
        var destinationTangent = destinationX * tangentX + destinationY * tangentY;
        var routeIdentity = state.antiSpiralSealTargetIndex != null
            ? Number(state.antiSpiralSealTargetIndex) : -1;
        if (state.antiSpiralRouteIdentity !== routeIdentity) {
            state.antiSpiralRouteIdentity = routeIdentity;
            state.antiSpiralRoutePlatformIndex = null;
        }
        if (state.antiSpiralGrounded && state.antiSpiralRoutePlatformIndex != null &&
            state.antiSpiralPlatformIndex === state.antiSpiralRoutePlatformIndex) {
            state.antiSpiralRoutePlatformIndex = null;
        }

        var routePlatform = null;
        if (!state.antiSpiralGrounded && state.antiSpiralRoutePlatformIndex != null) {
            for (var ri = 0; ri < platforms.length; ri++) {
                if (platforms[ri] && platforms[ri].index === state.antiSpiralRoutePlatformIndex) {
                    routePlatform = platforms[ri];
                    break;
                }
            }
            if (!routePlatform) state.antiSpiralRoutePlatformIndex = null;
        }
        if (state.antiSpiralGrounded && destinationHeight > currentHeight + radius * 1.6) {
            var bestRouteScore = Infinity;
            for (var pi = 0; pi < platforms.length; pi++) {
                var candidate = platforms[pi];
                if (!candidate || candidate.index === state.antiSpiralPlatformIndex) continue;
                var centerX = Number(candidate.x) + Number(candidate.w) / 2;
                var centerY = Number(candidate.y) + Number(candidate.h) / 2;
                var candidateHeight = centerX * normalX + centerY * normalY;
                var heightGain = candidateHeight - currentHeight;
                if (heightGain < radius * 1.4 || heightGain > 250) continue;
                if (candidateHeight > destinationHeight + 58) continue;
                var candidateTangent = centerX * tangentX + centerY * tangentY;
                var surfaceDistance = Math.hypot(centerX - destinationX, centerY - destinationY);
                var score = surfaceDistance + Math.abs(destinationHeight - candidateHeight) * 0.24 +
                    Math.abs(destinationTangent - candidateTangent) * 0.10;
                if (score < bestRouteScore) {
                    bestRouteScore = score;
                    routePlatform = candidate;
                }
            }
            if (routePlatform) state.antiSpiralRoutePlatformIndex = routePlatform.index;
        }

        var goalX = Number(state.moveTargetX);
        var goalY = Number(state.moveTargetY);
        if (routePlatform && destinationHeight > currentHeight + radius * 1.6) {
            goalX = Number(routePlatform.x) + Number(routePlatform.w) / 2 + normalX * (radius + 12);
            goalY = Number(routePlatform.y) + Number(routePlatform.h) / 2 + normalY * (radius + 12);
        }
        if (!Number.isFinite(goalX)) goalX = destinationX;
        if (!Number.isFinite(goalY)) goalY = destinationY;
        var dx = goalX - state.x, dy = goalY - state.y;
        var inputLength = Math.hypot(dx, dy);
        var mx = inputLength > 1 ? dx / inputLength : 0;
        var my = inputLength > 1 ? dy / inputLength : 0;

        // A jump is an explicit AI action, even when the next platform is sideways.
        var jumpDot = mx * normalX + my * normalY;
        var needsPlatformJump = destinationHeight > currentHeight + radius * 1.6;
        if (state.antiSpiralGrounded && (needsPlatformJump || jumpDot > 0.58)) {
            var jumpMultiplier = (playerScale === 0.5 ? 0.65 : (playerScale === 2 ? 1.3 : 1)) * superSpeed;
            state.vx = -gravity.x * (23.2 / 1.5) * jumpMultiplier;
            state.vy = -gravity.y * (23.2 / 1.5) * jumpMultiplier;
            state.antiSpiralGrounded = false;
            state.antiSpiralPlatformIndex = null;
        }

        // Same active singularity pull fields as the player.
        var pullX = 0, pullY = 0;
        var pulls = Array.isArray(info.pulls) ? info.pulls : [];
        for (var wi = 0; wi < pulls.length; wi++) {
            var well = pulls[wi];
            if (!well) continue;
            var pullDx = Number(well.x) - state.x, pullDy = Number(well.y) - state.y;
            var distance = Math.max(1, Math.hypot(pullDx, pullDy));
            var pullRadius = Math.max(0, Number(well.radius) || 0);
            if (distance < pullRadius) {
                var force = 1 - distance / pullRadius;
                var pull = (0.95 + force * 1.35) * force;
                pullX += pullDx / distance * pull;
                pullY += pullDy / distance * pull;
            }
        }

        // The same gravity, acceleration, damping and speed limits used by asPlayer.
        var tangentX = -gravity.y, tangentY = gravity.x;
        var tangentInput = mx * tangentX + my * tangentY;
        var nextVx = (state.vx +
            (tangentX * tangentInput * 0.43 * speedMultiplier + gravity.x * 0.32 + pullX) * timeScale) *
            Math.pow(0.91, timeScale);
        var nextVy = (state.vy +
            (tangentY * tangentInput * 0.43 * speedMultiplier + gravity.y * 0.32 + pullY) * timeScale) *
            Math.pow(0.91, timeScale);
        var tangentLimit = 6.2 * speedMultiplier;
        var normalLimit = 24.8 * (playerScale === 0.5 ? 0.72 : (playerScale === 2 ? 1.3 : 1));
        state.vx = Math.max(gravity.x ? -normalLimit : -tangentLimit,
            Math.min(gravity.x ? normalLimit : tangentLimit, nextVx));
        state.vy = Math.max(gravity.y ? -normalLimit : -tangentLimit,
            Math.min(gravity.y ? normalLimit : tangentLimit, nextVy));

        var previousX = state.x, previousY = state.y;
        state.x += state.vx * timeScale;
        state.y += state.vy * timeScale;
        var boundaryGrounded = false;
        if (state.x < bounds.left) {
            state.x = bounds.left;
            if (direction === 1) { state.vx = 0; boundaryGrounded = true; }
            else state.vx = Math.abs(state.vx) * 0.28;
        }
        if (state.x > bounds.right) {
            state.x = bounds.right;
            if (direction === 3) { state.vx = 0; boundaryGrounded = true; }
            else state.vx = -Math.abs(state.vx) * 0.28;
        }
        if (state.y < bounds.top) {
            state.y = bounds.top;
            if (direction === 2) { state.vy = 0; boundaryGrounded = true; }
            else state.vy = Math.abs(state.vy) * 0.28;
        }
        if (state.y > bounds.bottom) {
            state.y = bounds.bottom;
            if (direction === 0) { state.vy = 0; boundaryGrounded = true; }
            else state.vy = -Math.abs(state.vy) * 0.28;
        }

        // Same directional landing checks as the player's six real platforms.
        var landed = false;
        for (var pi = 0; pi < platforms.length; pi++) {
            var platform = platforms[pi];
            if (!platform) continue;
            var overlapX = state.x + radius > platform.x && state.x - radius < platform.x + platform.w;
            var overlapY = state.y + radius > platform.y && state.y - radius < platform.y + platform.h;
            var hit = false;
            if (direction === 0 && state.vy > 0 &&
                previousY + radius <= platform.y + 3 && state.y + radius >= platform.y && overlapX) {
                state.y = platform.y - radius; state.vy = 0; hit = true;
            } else if (direction === 2 && state.vy < 0 &&
                previousY - radius >= platform.y + platform.h - 3 &&
                state.y - radius <= platform.y + platform.h && overlapX) {
                state.y = platform.y + platform.h + radius; state.vy = 0; hit = true;
            } else if (direction === 1 && state.vx < 0 &&
                previousX - radius >= platform.x + platform.w - 3 &&
                state.x - radius <= platform.x + platform.w && overlapY) {
                state.x = platform.x + platform.w + radius; state.vx = 0; hit = true;
            } else if (direction === 3 && state.vx > 0 &&
                previousX + radius <= platform.x + 3 &&
                state.x + radius >= platform.x && overlapY) {
                state.x = platform.x - radius; state.vx = 0; hit = true;
            }
            if (hit) {
                state.antiSpiralGrounded = true;
                state.antiSpiralPlatformIndex = platform.index;
                landed = true;
                break;
            }
        }
        if (!landed) {
            state.antiSpiralGrounded = boundaryGrounded;
            state.antiSpiralPlatformIndex = boundaryGrounded ? -1 : null;
        }
    }

    function updateAntiSpiralMiniCompanionPhysics(info, frameScale, current) {
        var mini = info && info.mini ? info.mini : {};
        var player = info && info.player ? info.player : { x: 200, y: 260, size: 12 };
        var bounds = mini.bounds || { left: 34, right: 366, top: 91, bottom: 466 };
        var radius = Math.max(7, Math.min(24, Number(player.size) || Number(state.heartSize) || 12));
        var margin = radius + 1;
        var left = bounds.left + margin, right = bounds.right - margin;
        var top = bounds.top + margin, bottom = bounds.bottom - margin;
        var speedMultiplier = Math.max(0.15, Math.min(3, Number(mini.speedMultiplier) || 1));
        var spheres = Array.isArray(mini.spheres) ? mini.spheres : [];
        var target = null;

        if (!state.antiSpiralMiniInitialized) {
            state.x = Math.max(left, Math.min(right, (Number(player.x) || 200) + 34));
            state.y = Math.max(top, Math.min(bottom, Number(player.y) || 260));
            state.vx = 0; state.vy = 0;
            state.antiSpiralMiniInitialized = true;
            state.antiSpiralMiniTargetIndex = null;
            state.antiSpiralPhysicsInitialized = false;
        }

        // Lock the target until collection. This prevents aim-switching between nearby spheres.
        if (!mini.intro) {
            for (var i = 0; i < spheres.length; i++) {
                if (spheres[i] && spheres[i].index === state.antiSpiralMiniTargetIndex) {
                    target = spheres[i];
                    break;
                }
            }
            if (!target && spheres.length) {
                var nearestDistance = Infinity;
                for (var si = 0; si < spheres.length; si++) {
                    var candidate = spheres[si];
                    if (!candidate) continue;
                    var candidateDistance = Math.hypot(candidate.x - state.x, candidate.y - state.y);
                    if (candidateDistance < nearestDistance) {
                        nearestDistance = candidateDistance;
                        target = candidate;
                    }
                }
                state.antiSpiralMiniTargetIndex = target ? target.index : null;
            }
        }

        var goalX = target ? Number(target.x) : (Number(player.x) || 200);
        var goalY = target ? Number(target.y) : (Number(player.y) || 260);
        var dx = goalX - state.x, dy = goalY - state.y;
        var distanceToGoal = Math.hypot(dx, dy);
        var mx = distanceToGoal > 1 ? Math.max(-1, Math.min(1, dx / Math.max(24, distanceToGoal))) : 0;
        var my = distanceToGoal > 1 ? Math.max(-1, Math.min(1, dy / Math.max(24, distanceToGoal))) : 0;

        // Pocket mode shares the player's exact 2D gravity cycle and movement damping.
        var gravityIndex = Math.max(0, Math.min(4, Number(mini.gravityIndex) || 0));
        var gx = 0, gy = 0;
        if (gravityIndex === 0) gy = 0.23;
        else if (gravityIndex === 1) gy = -0.23;
        else if (gravityIndex === 2) gx = -0.23;
        else if (gravityIndex === 3) gx = 0.23;
        else {
            gx = (200 - state.x) * 0.0016;
            gy = (260 - state.y) * 0.0016;
        }
        state.vx = Math.max(-4.6 * speedMultiplier,
            Math.min(4.6 * speedMultiplier, (state.vx + mx * 0.43 * speedMultiplier + gx) * 0.965));
        state.vy = Math.max(-4.6 * speedMultiplier,
            Math.min(4.6 * speedMultiplier, (state.vy + my * 0.43 * speedMultiplier + gy) * 0.965));
        state.x += state.vx;
        state.y += state.vy;
        if (state.x < left) { state.x = left; state.vx = Math.abs(state.vx) * 0.42; }
        if (state.x > right) { state.x = right; state.vx = -Math.abs(state.vx) * 0.42; }
        if (state.y < top) { state.y = top; state.vy = Math.abs(state.vy) * 0.42; }
        if (state.y > bottom) { state.y = bottom; state.vy = -Math.abs(state.vy) * 0.42; }

        // Check collection after movement, against the updated position.
        if (target && Math.hypot(state.x - Number(target.x), state.y - Number(target.y)) <= 11 + radius &&
            typeof window.collectAntiSpiralMiniSphere === "function") {
            window.collectAntiSpiralMiniSphere(target.index);
            state.antiSpiralMiniTargetIndex = null;
        }
    }

    function updateCompanion(dt) {
        if (!state.active || !isGERMain()) return;
        var current = now(), ctx = getContext();
        if (!ctx || typeof ctx.getHeartX !== "function" || typeof ctx.getHeartY !== "function") return;
        var frameScale = Math.max(0.35, Math.min(2.2, (Number(dt) || 16.667) / 16.667));
        var playerX = Number(ctx.getHeartX()) || 200;
        var playerY = Number(ctx.getHeartY()) || 400;
        var antiInfo = ctx.type === "antispiral" &&
            typeof window.getAntiSpiralBossCompanionInfo === "function"
            ? window.getAntiSpiralBossCompanionInfo() : null;
        if (antiInfo && antiInfo.hidden) {
            state.combo = null;
            state.punch = null;
            state.specialAttack = null;
            state.attackType = null;
            state.attackUntil = 0;
            state.punchEffects = [];
            state.trail = [];
            state.vx = 0;
            state.vy = 0;
            state.isDodging = false;
            state.antiSpiralPhysicsInitialized = false;
            state.antiSpiralMiniInitialized = false;
            stopMudaMusic();
            return;
        }
        if (antiInfo && antiInfo.state === "mini") {
            var miniPlayer = antiInfo.player || { x: playerX, y: playerY };
            playerX = Number(miniPlayer.x) || playerX;
            playerY = Number(miniPlayer.y) || playerY;
            state.heartSize = getCompanionSize(ctx);
            state.combo = null;
            state.punch = null;
            state.specialAttack = null;
            state.attackType = null;
            state.attackUntil = 0;
            state.punchEffects = [];
            state.isDodging = false;
            state.healState = "idle";
            state.healTimer = 0;
            state.healRemaining = 0;
            state.healTotal = 0;
            state.antiSpiralPhysicsInitialized = false;
            state.moveTargetX = playerX;
            state.moveTargetY = playerY;
            updateAntiSpiralMiniCompanionPhysics(antiInfo, frameScale, current);
            if (state.trail) {
                state.trail.push({ x: state.x, y: state.y, life: 10 });
                if (state.trail.length > 9) state.trail.shift();
                for (var miniTrail = state.trail.length - 1; miniTrail >= 0; miniTrail--) {
                    state.trail[miniTrail].life -= frameScale;
                }
                while (state.trail.length && state.trail[0].life <= 0) state.trail.shift();
            }
            stopMudaMusic();
            return;
        }
        if (state.antiSpiralMiniInitialized) {
            state.antiSpiralMiniInitialized = false;
            state.antiSpiralPhysicsInitialized = false;
        }
        if (antiInfo && antiInfo.state !== "fight") {
            var anchor = antiInfo.player || { x: playerX, y: playerY };
            var anchorGravity = antiInfo.gravity || { x: 0, y: 1 };
            var anchorSide = Number(state.companionSide) || 1;
            var anchorX = -anchorGravity.y * anchorSide;
            var anchorY = anchorGravity.x * anchorSide;
            state.x = Math.max(8, Math.min(392, (Number(anchor.x) || 0) + anchorX * 22));
            state.y = Math.max(8, Math.min(492, (Number(anchor.y) || 0) + anchorY * 22));
            state.vx = 0;
            state.vy = 0;
            state.combo = null;
            state.punch = null;
            state.specialAttack = null;
            state.attackType = null;
            state.attackUntil = 0;
            state.punchEffects = [];
            state.trail = [];
            state.isDodging = false;
            state.antiSpiralPhysicsInitialized = false;
            stopMudaMusic();
            return;
        }
        if (antiInfo && antiInfo.player) {
            playerX = Number(antiInfo.player.x) || playerX;
            playerY = Number(antiInfo.player.y) || playerY;
        }
        var cloneMode = !!(antiInfo && antiInfo.cloneMode);
        if (cloneMode) {
            state.combo = null;
            state.punch = null;
            state.specialAttack = null;
            state.attackType = null;
            state.attackUntil = 0;
            state.punchEffects = [];
            stopMudaMusic();
        }
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
            state.vx *= 0.72;
            state.vy *= 0.72;
            state.moveTargetX = state.x;
            state.moveTargetY = state.y;
        }
        if (state.dodgeCooldown > 0) state.dodgeCooldown = Math.max(0, state.dodgeCooldown - frameScale);
        if (state.dodgePlanTimer > 0) state.dodgePlanTimer = Math.max(0, state.dodgePlanTimer - frameScale);
        if (state.dodgeFlashTimer > 0) state.dodgeFlashTimer = Math.max(0, state.dodgeFlashTimer - frameScale);
        if (state.hitFlash > 0) state.hitFlash = Math.max(0, state.hitFlash - frameScale);
        if (state.attackCooldown > 0) state.attackCooldown = Math.max(0, state.attackCooldown - frameScale);
        if (state.swingTimer > 0) state.swingTimer = Math.max(0, state.swingTimer - frameScale);

        var sealTarget = null;
        if (antiInfo && !cloneMode && Array.isArray(antiInfo.seals) && antiInfo.seals.length) {
            for (var asi = 0; asi < antiInfo.seals.length; asi++) {
                if (antiInfo.seals[asi] &&
                    antiInfo.seals[asi].index === state.antiSpiralSealTargetIndex) {
                    sealTarget = antiInfo.seals[asi];
                    break;
                }
            }
            if (!sealTarget) {
                var nearestSealDistance = Infinity;
                for (var asn = 0; asn < antiInfo.seals.length; asn++) {
                    var possibleSeal = antiInfo.seals[asn];
                    if (!possibleSeal) continue;
                    var possibleDistance = Math.hypot(possibleSeal.x - state.x, possibleSeal.y - state.y);
                    if (possibleDistance < nearestSealDistance) {
                        nearestSealDistance = possibleDistance;
                        sealTarget = possibleSeal;
                    }
                }
                state.antiSpiralSealTargetIndex = sealTarget ? sealTarget.index : null;
            }
        } else {
            state.antiSpiralSealTargetIndex = null;
        }

        var goal;
        if (cloneMode) {
            var cloneGravity = antiInfo.gravity || { x: 0, y: 1 };
            var cloneTangentX = -cloneGravity.y;
            var cloneTangentY = cloneGravity.x;
            var cloneSide = Number(state.companionSide) || 1;
            goal = {
                x: Math.max(18, Math.min(382, playerX + cloneTangentX * cloneSide * 20)),
                y: Math.max(8, Math.min(482, playerY + cloneTangentY * cloneSide * 20))
            };
        } else if (sealTarget) {
            var fromSealX = state.x - Number(sealTarget.x);
            var fromSealY = state.y - Number(sealTarget.y);
            var fromSealLength = Math.max(1, Math.hypot(fromSealX, fromSealY));
            goal = {
                x: Math.max(18, Math.min(382, Number(sealTarget.x) + fromSealX / fromSealLength * 46)),
                y: Math.max(8, Math.min(482, Number(sealTarget.y) + fromSealY / fromSealLength * 46))
            };
            state.antiSpiralSealGoalX = Number(sealTarget.x);
            state.antiSpiralSealGoalY = Number(sealTarget.y);
        } else {
            goal = chooseCompanionGoal(ctx, playerX, playerY, boss, frameScale);
            state.antiSpiralSealGoalX = null;
            state.antiSpiralSealGoalY = null;
        }
        state.moveTargetX = goal.x;
        state.moveTargetY = goal.y;
        var incoming = state.stunTimer > 0 || cloneMode ? null : findIncomingCompanionThreat(ctx);
        var urgentThreat = !!incoming && incoming.time <= 13;
        var newThreat = !!incoming && incoming.attack !== state.lastThreatAttack;
        var dodging = false;

        if (incoming && incoming.time <= Math.round(168 + state.aiSkill * 66) &&
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
            state.dodgeFlashTimer = 17;
            dodging = true;
            spawnHitEffect(state.x, state.y, "#ffe29a");
        } else if (incoming && state.dodgePlanTimer > 0) {
            dodging = true;
        } else if (!incoming && state.dodgePlanTimer <= 0) {
            state.lastThreatAttack = null;
        }
        state.isDodging = dodging;

        // Pursue the boss, strafe around it, and brake naturally before the next punch.
        var calm = !incoming && !dodging && state.healState === "idle";
        var driftX = calm ? Math.sin(current / 420 + state.orbitPhase) * 2.6 : 0;
        var driftY = calm ? Math.cos(current / 610 + state.orbitPhase) * 2.1 : 0;
        if (antiInfo) {
            // Never mix free-flight steering with the Anti-Spiral gravity controller.
            updateAntiSpiralCompanionPhysics(antiInfo, playerX, playerY, frameScale, current);
        } else {
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
        }

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

        var currentTarget = ctx.type === "arena" ? null :
            (getUniqueBossTarget(ctx, state.targetId) || getUniqueBossTarget(ctx));
        var activePosition = sealTarget || currentTarget || getBossPosition(ctx, state.x, state.y);
        var attackDistance = Math.hypot(state.x - Number(activePosition.x),
            state.y - Number(activePosition.y));

        if (sealTarget && state.punch && !state.punch.antiSpiralSeal) {
            state.punch = null;
            state.combo = null;
            state.specialAttack = null;
            state.attackType = null;
            state.attackUntil = 0;
        }
        if (!cloneMode && state.healState === "idle" && state.stunTimer <= 0) {
            if (state.punch) {
                if (dodging) {
                    state.punch = null;
                    if (state.attackType === "punch" || state.attackType === "sealPunch") state.attackType = null;
                } else {
                    updateCompanionPunch(ctx, current);
                }
            } else if (sealTarget) {
                state.combo = null;
                state.specialAttack = null;
                if (!dodging && state.attackCooldown <= 0 &&
                    attackDistance >= 14 && attackDistance <= 104) {
                    beginCompanionSealPunch(ctx, sealTarget);
                }
            } else if (state.combo) {
                updateMudaCombo(ctx);
            } else if (!dodging && !state.specialAttack && (ctx.type === "arena" || currentTarget)) {
                if (current >= (Number(state.nextMudaAt) || 0) && attackDistance >= 72 && attackDistance <= 184) {
                    beginMudaCombo(ctx, currentTarget, currentCard());
                } else if (state.attackCooldown <= 0 && attackDistance >= 72 && attackDistance <= 190) {
                    beginCompanionPunch(ctx, currentTarget);
                }
            }
        } else {
            state.windup = 0;
            state.swingTimer = 0;
            state.punch = null;
        }

        if (cloneMode || state.healState !== "idle" || state.stunTimer > 0) {
            state.combo = null;
            state.specialAttack = null;
            state.attackType = null;
            state.punch = null;
        }
        updatePunchEffects(frameScale);
    }

    function drawGERFist(c, x, y, angle, alpha, size) {
        c.save();
        c.translate(x, y);
        c.rotate(angle || 0);
        c.globalAlpha *= Math.max(0, Math.min(1, Number(alpha) || 1));
        var r = Number(size) || 1;
        c.shadowColor = "#ffd66d";
        c.shadowBlur = 12 * r;
        c.fillStyle = "#f8c653";
        c.strokeStyle = "#704014";
        c.lineWidth = 1.2 * r;
        c.beginPath();
        c.ellipse(0, 0, 6.1 * r, 4.7 * r, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.shadowBlur = 0;
        c.strokeStyle = "#fff0b0";
        c.lineWidth = 1.05 * r;
        for (var n = -1; n <= 1; n++) {
            c.beginPath();
            c.moveTo((n * 2.3 - 1) * r, -3.2 * r);
            c.quadraticCurveTo(n * 2.3 * r, -5.0 * r, (n * 2.3 + 1.4) * r, -2.8 * r);
            c.stroke();
        }
        c.strokeStyle = "#9a5a20";
        c.lineWidth = 1.1 * r;
        c.beginPath();
        c.moveTo(-4.1 * r, 1.2 * r);
        c.quadraticCurveTo(-2.0 * r, 4.7 * r, 1.0 * r, 3.2 * r);
        c.stroke();
        c.restore();
    }

    function drawGERArm(c, x1, y1, x2, y2, alpha, width) {
        c.save();
        c.globalAlpha *= Math.max(0, Math.min(1, Number(alpha) || 1));
        c.lineCap = "round";
        c.lineJoin = "round";
        c.strokeStyle = "#704014";
        c.lineWidth = Number(width) || 5.4;
        c.shadowColor = "#e9a936";
        c.shadowBlur = 8;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
        c.strokeStyle = "#f4bd4d";
        c.lineWidth = Math.max(2, (Number(width) || 5.4) - 2.2);
        c.shadowBlur = 4;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
        c.restore();
    }

    function drawPunchEffects(c, current) {
        var effects = state.punchEffects;
        if (!Array.isArray(effects)) return;
        for (var i = 0; i < effects.length; i++) {
            var effect = effects[i];
            if (!effect) continue;
            if (effect.kind === "spark") {
                var sparkAlpha = Math.max(0, Math.min(1, effect.life / Math.max(1, effect.maxLife)));
                c.save();
                c.globalCompositeOperation = "lighter";
                c.globalAlpha = sparkAlpha;
                c.strokeStyle = effect.color || "#ffe08a";
                c.fillStyle = effect.color || "#ffe08a";
                c.lineWidth = 1.4;
                c.shadowColor = effect.color || "#ffe08a";
                c.shadowBlur = 8;
                c.beginPath();
                c.moveTo(effect.x - effect.vx * 1.7, effect.y - effect.vy * 1.7);
                c.lineTo(effect.x, effect.y);
                c.stroke();
                c.beginPath();
                c.arc(effect.x, effect.y, Math.max(0.8, effect.size * sparkAlpha), 0, Math.PI * 2);
                c.fill();
                c.restore();
                continue;
            }

            var age = Math.max(0, current - effect.startedAt);
            var progress = Math.max(0, Math.min(1, age / Math.max(1, effect.duration)));
            var alpha = 1 - progress;
            var radius = (effect.heavy ? 7 : 5) + progress * (effect.heavy ? 34 : 25);
            c.save();
            c.globalCompositeOperation = "lighter";
            c.globalAlpha = alpha * (effect.heavy ? 0.9 : 0.75);
            c.strokeStyle = effect.heavy ? "#fff2b6" : "#ffd96d";
            c.lineWidth = effect.heavy ? 3.2 : 2.2;
            c.shadowColor = "#ffbf43";
            c.shadowBlur = effect.heavy ? 19 : 12;
            c.beginPath();
            c.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            c.stroke();
            c.strokeStyle = "#fffbe5";
            c.lineWidth = 1.2;
            c.beginPath();
            c.arc(effect.x, effect.y, radius * 0.62, effect.angle - 0.82, effect.angle + 0.82);
            c.stroke();
            for (var ray = 0; ray < 6; ray++) {
                var a = effect.angle + ray * Math.PI / 3 + progress * 0.28;
                var inner = radius * 0.55;
                var outer = radius + (effect.heavy ? 13 : 8);
                c.beginPath();
                c.moveTo(effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner);
                c.lineTo(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer);
                c.stroke();
            }
            c.restore();
        }
    }

    function drawMudaBarrage(c, current) {
        var combo = state.combo;
        if (!combo) return;
        var elapsed = Math.max(0, current - combo.startedAt);
        var dx = combo.x - state.x;
        var dy = combo.y - state.y;
        var angle = Math.atan2(dy, dx);
        var sideAngle = angle + Math.PI / 2;

        c.save();
        c.globalCompositeOperation = "lighter";
        for (var fist = 0; fist < 3; fist++) {
            var beat = (elapsed / 118 + fist * 0.37) % 1;
            var reach = 0.28 + Math.sin(beat * Math.PI) * 0.65;
            var side = fist % 2 === 0 ? -1 : 1;
            var startX = state.x + Math.cos(sideAngle) * side * 5;
            var startY = state.y + Math.sin(sideAngle) * side * 5;
            var endX = startX + dx * Math.min(0.91, reach);
            var endY = startY + dy * Math.min(0.91, reach);
            c.globalAlpha = 0.24 + (1 - beat) * 0.27;
            c.strokeStyle = fist === 1 ? "#fff5cc" : "#ffc94f";
            c.lineWidth = 8.5 - fist * 0.8;
            c.lineCap = "round";
            c.shadowColor = "#ffbd43";
            c.shadowBlur = 16;
            c.beginPath();
            c.moveTo(startX, startY);
            c.lineTo(endX, endY);
            c.stroke();
            c.globalAlpha = 0.95;
            drawGERFist(c, endX, endY, angle, 0.8, 0.9);
        }
        c.restore();

        c.save();
        c.textAlign = "center";
        c.font = "900 12px Arial, sans-serif";
        c.lineJoin = "round";
        c.lineWidth = 4;
        c.strokeStyle = "rgba(72,34,5,.95)";
        c.shadowColor = "#ffd45c";
        c.shadowBlur = 12;
        c.strokeText("MUDA MUDA MUDA!", combo.x, combo.y - 30);
        c.fillStyle = "#fff1a8";
        c.fillText("MUDA MUDA MUDA!", combo.x, combo.y - 30);
        c.restore();
    }

    function drawGoldExperience(c) {
        if (!c || !state.active || !isGERMain()) return;
        var current = now(), ctx = getContext();
        if (ctx && ctx.type === "antispiral" &&
            typeof window.getAntiSpiralBossCompanionInfo === "function") {
            var antiInfo = window.getAntiSpiralBossCompanionInfo();
            if (antiInfo && antiInfo.hidden) return;
        }
        var size = getCompanionSize(ctx);
        state.heartSize = size;
        var scale = size / 15;
        var hitFlash = state.hitFlash > 0;
        var healing = state.healState !== "idle";
        var dodging = !!state.isDodging || state.dodgeFlashTimer > 0;
        var attacking = !!(state.combo || state.punch || current < state.attackUntil);
        var bob = Math.sin(current / 170) * 0.75;
        var companionGravityAngle = 0;
        if (ctx && ctx.type === "antispiral" &&
            typeof window.getAntiSpiralBossCompanionInfo === "function") {
            var rotationInfo = window.getAntiSpiralBossCompanionInfo();
            if (rotationInfo && rotationInfo.state === "mini" && rotationInfo.mini) {
                companionGravityAngle = [0, Math.PI, Math.PI / 2, -Math.PI / 2, 0][
                    Math.max(0, Math.min(4, Number(rotationInfo.mini.gravityIndex) || 0))
                ];
            } else if (rotationInfo) {
                companionGravityAngle = Math.max(0, Math.min(3,
                    Number(rotationInfo.gravityDirection) || 0)) * Math.PI / 2;
            }
        }
        c.save();
        c.translate(state.x, state.y);
        c.rotate(companionGravityAngle);
        c.translate(-state.x, -state.y);

        var idleHands = [-1, 1];
        for (var handIndex = 0; handIndex < idleHands.length; handIndex++) {
            var handSide = idleHands[handIndex];
            var shoulderX = state.x + handSide * 6.3;
            var shoulderY = state.y + bob + 1.5;
            var handX = state.x + handSide * 13.5;
            var handY = state.y + bob + 5.5;
            if (!state.punch || state.punch.side !== handSide) {
                drawGERArm(c, shoulderX, shoulderY, handX, handY, 0.96, 4.8);
                drawGERFist(c, handX, handY, handSide * 0.18, 1, 0.72);
            }
        }

        c.save();
        c.translate(state.x, state.y + bob);
        c.scale(scale, scale);
        c.rotate(Math.max(-0.12, Math.min(0.12, (Number(state.vx) || 0) * 0.018)));
        c.globalAlpha = hitFlash ? 0.82 : 1;
        var halo = c.createRadialGradient(0, -1, 1, 0, 0, 16);
        halo.addColorStop(0, healing ? "rgba(126,255,166,.28)" : "rgba(255,218,105,.3)");
        halo.addColorStop(1, "rgba(255,190,55,0)");
        c.fillStyle = halo;
        c.beginPath();
        c.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
        c.fill();

        if (dodging || healing) {
            c.strokeStyle = healing ? "#8bffbd" : "#fff0a6";
            c.lineWidth = healing ? 1.9 : 1.6;
            c.shadowColor = c.strokeStyle;
            c.shadowBlur = 13;
            c.globalAlpha *= 0.85;
            c.beginPath();
            c.ellipse(0, 0, 14 + Math.sin(current / 50) * 1.0, 10.5, 0, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;
            c.globalAlpha = hitFlash ? 0.82 : 1;
        }

        var gradient = c.createLinearGradient(-3, -18, 5, 13);
        gradient.addColorStop(0, hitFlash ? "#fffdf0" : "#fff2b2");
        gradient.addColorStop(0.24, hitFlash ? "#fff4c9" : "#ffdf72");
        gradient.addColorStop(0.58, "#f4ad35");
        gradient.addColorStop(0.82, "#d77a1d");
        gradient.addColorStop(1, "#8e4a14");
        c.fillStyle = gradient;
        c.strokeStyle = "#65370f";
        c.lineWidth = 1.35;
        c.shadowColor = "#ffd34f";
        c.shadowBlur = attacking ? 18 : 9;
        c.beginPath();
        c.moveTo(0, 15 * 0.45);
        c.bezierCurveTo(-15 * 0.13, 15 * 0.25, -15 * 0.64, -15 * 0.05, -15 * 0.64, -15 * 0.38);
        c.bezierCurveTo(-15 * 0.64, -15 * 0.80, -15 * 0.16, -15 * 0.88, 0, -15 * 0.58);
        c.bezierCurveTo(15 * 0.16, -15 * 0.88, 15 * 0.64, -15 * 0.80, 15 * 0.64, -15 * 0.38);
        c.bezierCurveTo(15 * 0.64, -15 * 0.05, 15 * 0.13, 15 * 0.25, 0, 15 * 0.45);
        c.closePath();
        c.fill();
        c.stroke();
        c.shadowBlur = 0;

        c.save();
        c.beginPath();
        c.moveTo(0, 15 * 0.45);
        c.bezierCurveTo(-15 * 0.13, 15 * 0.25, -15 * 0.64, -15 * 0.05, -15 * 0.64, -15 * 0.38);
        c.bezierCurveTo(-15 * 0.64, -15 * 0.80, -15 * 0.16, -15 * 0.88, 0, -15 * 0.58);
        c.bezierCurveTo(15 * 0.16, -15 * 0.88, 15 * 0.64, -15 * 0.80, 15 * 0.64, -15 * 0.38);
        c.bezierCurveTo(15 * 0.64, -15 * 0.05, 15 * 0.13, 15 * 0.25, 0, 15 * 0.45);
        c.closePath();
        c.clip();
        c.strokeStyle = "rgba(255,246,190,.62)";
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(-12, -8);
        c.quadraticCurveTo(-9, -17, -2, -15);
        c.stroke();
        c.fillStyle = "rgba(255,255,225,.22)";
        c.beginPath();
        c.ellipse(-6.5, -9.5, 3.8, 5.2, -0.48, 0, Math.PI * 2);
        c.fill();
        c.restore();

        c.save();
        c.strokeStyle = "#27743e";
        c.lineWidth = 1.1;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(0, -7);
        c.quadraticCurveTo(0, -12, 0, -14);
        c.stroke();
        c.fillStyle = "#67df82";
        c.strokeStyle = "#286e3d";
        c.beginPath();
        c.ellipse(-3.3, -11.8, 3.5, 1.7, -0.45, 0, Math.PI * 2);
        c.ellipse(3.3, -11.8, 3.5, 1.7, 0.45, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.shadowColor = "#8dff9d";
        c.shadowBlur = 7;
        c.fillStyle = "#58d878";
        c.strokeStyle = "#236d39";
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(0, -4.8);
        c.lineTo(3.8, -0.8);
        c.lineTo(0, 3.2);
        c.lineTo(-3.8, -0.8);
        c.closePath();
        c.fill();
        c.stroke();
        c.shadowBlur = 0;
        c.restore();
        c.restore();
        c.restore();

        if (state.punch) {
            var punch = state.punch;
            var elapsed = Math.max(0, current - punch.startedAt);
            var phase = Math.max(0, Math.min(1, elapsed / punch.duration));
            var extension = phase < 0.34
                ? phase / 0.34
                : (phase < 0.68 ? 1 : Math.max(0, 1 - (phase - 0.68) / 0.32));
            extension = extension * extension * (3 - 2 * extension);
            var dx = punch.targetX - state.x;
            var dy = punch.targetY - state.y;
            var dist = Math.max(1, Math.hypot(dx, dy));
            var angle = Math.atan2(dy, dx);
            var sideX = -Math.sin(angle) * punch.side * 4.5;
            var sideY = Math.cos(angle) * punch.side * 4.5;
            var startX = state.x + sideX * 0.7;
            var startY = state.y + sideY * 0.7;
            var reach = Math.min(104, dist * 0.84) * extension;
            var endX = state.x + Math.cos(angle) * reach + sideX;
            var endY = state.y + Math.sin(angle) * reach + sideY;
            c.save();
            c.globalCompositeOperation = "lighter";
            c.globalAlpha = 0.28 + extension * 0.54;
            c.strokeStyle = "#ffe49a";
            c.lineWidth = 7;
            c.lineCap = "round";
            c.shadowColor = "#ffc34d";
            c.shadowBlur = 16;
            c.beginPath();
            c.moveTo(endX, endY);
            c.lineTo(punch.targetX, punch.targetY);
            c.stroke();
            c.restore();
            drawGERArm(c, startX, startY, endX, endY, 1, 6.3);
            drawGERFist(c, endX, endY, angle, 1, 1.05);
        }

        if (state.combo) drawMudaBarrage(c, current);
        drawPunchEffects(c, current);
    }

    window.MBDrawGoldExperience = function(c) {
        drawGoldExperience(c || ensureLoopContext());
    };

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
        state.nextMudaAt = current + 6500 + Math.random() * 3000;
        state.nextHealAt = current;
        state.healCooldownUntil = current;
        state.projectiles = [];
        state.punch = null;
        state.punchEffects = [];
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
        state.punch = null;
        state.punchEffects = [];
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
        state.punch = null;
        state.punchEffects = [];
        state.specialAttack = null;
        state.attackType = null;
        state.lastAttackType = null;
        state.nextAttackAt = 0;
        state.nextMudaAt = 0;
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
            var activeContext = getContext();
            if (c && (!activeContext || activeContext.type !== "antispiral")) {
                drawGoldExperience(c);
            }
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