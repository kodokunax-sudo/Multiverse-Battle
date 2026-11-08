/* GER Training Pool: 100 independent primary GER agents learning in parallel. */
(function () {
    "use strict";
    var COUNT = 100;
    // Keep roughly the previous compute budget by updating half the pool per 30Hz tick.
    var UPDATE_BATCH_SIZE = 50;
    var updateBatch = 0;
    var agents = [];
    var active = false;
    var raf = 0;
    var lastAt = 0;
    var lastUiAt = 0;
    var trainingBossContext = null;
    var overlay = null;
    var overlayCtx = null;
    var panel = null;
    var inputHandlers = [];
    var lastBossHp = null;
    var zeroHpSince = 0;
    var damageLeaderboard = null;
    var ended = false;
    var trainingDecisionOrder = 0;
    var trainingSessionPromise = null;
    var trainingBossKey = "unknown";
    var lastAgentCheckpointAt = 0;
    var lastOverlayLayoutAt = 0;
    // Native boss attacks read one player position. During training that position
    // is reassigned to a rotating live swarm agent so aimed attacks train the stands.
    var trainingTargetAgentIndex = -1;
    var trainingTargetAgentId = null;
    var trainingTargetHoldUntil = 0;
    var TRAINING_TARGET_HOLD_MS = 900;
    // First stage of player-imitation training. It observes the human-controlled
    // soul without locking input or starting the 100-agent swarm.
    var teacherActive = false;
    var teacherRaf = 0;
    var teacherLastAt = 0;
    var teacherLastX = null;
    var teacherLastY = null;
    var teacherLastHp = null;
    var teacherLastBossZeroAt = 0;
    var teacherPending = [];
    var teacherDecisionOrder = 0;
    var teacherRecorded = 0;
    var teacherPanel = null;
    var teacherControls = null;
    var teacherInputHandlers = [];
    var teacherKeys = Object.create(null);
    var teacherPointerActive = false;
    var teacherPointerTarget = null;

    function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function context() {
        try { return typeof window.getBossContext === "function" ? window.getBossContext() : null; }
        catch (e) { return null; }
    }
    function playerHeartHitbox(ctx) {
        ctx = ctx || trainingBossContext || context();
        try {
            if (ctx && typeof ctx.getHeartHitbox === "function") {
                var radius = Number(ctx.getHeartHitbox());
                if (Number.isFinite(radius) && radius >= 0) return clamp(radius, 0, 40);
            }
        } catch (e) {}
        return 4;
    }
    function playerHeartSize(ctx) {
        ctx = ctx || trainingBossContext || context();
        try {
            if (ctx && typeof ctx.getHeartSize === "function") {
                var size = Number(ctx.getHeartSize());
                if (Number.isFinite(size) && size > 0) return clamp(size, 5, 32);
            }
        } catch (e) {}
        return 14;
    }
    function createAgent(i) {
        var angle = i / COUNT * Math.PI * 2;
        var ring = 65 + (i % 5) * 16;
        var style = i % 5;
        var aggression = [0.62, 0.84, 1.02, 1.18, 1.38][style] + (Math.random() - 0.5) * 0.16;
        var riskTolerance = [0.18, 0.34, 0.52, 0.7, 0.88][(i * 3) % 5] + (Math.random() - 0.5) * 0.08;
        var preferredRange = [118, 100, 84, 72, 94][style] + (Math.random() - 0.5) * 16;
        var movementSpeed = [0.92, 1.04, 1.12, 1.2, 0.99][(i * 2) % 5] + (Math.random() - 0.5) * 0.08;
        return {
            id: i + 1, x: clamp(200 + Math.cos(angle) * ring, 18, 382),
            y: clamp(315 + Math.sin(angle) * ring, 18, 482),
            vx: 0, vy: 0, tx: 200, ty: 260, hp: 5, maxHp: 5,
            alive: true, respawnAt: 0, score: 0, positionScore: 0, lastPositionScoreAt: now(),
            damageDealt: 0, damageTaken: 0,
            hits: 0, dodges: 0, failedDodges: 0, decisions: 0,
            aggression: aggression, riskTolerance: clamp(riskTolerance, 0, 1), aiSkill: 0.62,
            preferredRange: preferredRange, movementSpeed: movementSpeed,
            reactionMs: 75 + Math.random() * 115,
            attackCooldownMs: 720 + Math.random() * 520,
            orbitDirection: i % 2 ? 1 : -1,
            pendingDodge: null,
            nextAttackAt: now() + Math.random() * 900,
            nextDecisionAt: 0,
            nextThreatCheckAt: now() + 28 + (i % 7) * 9,
            nextHitCheckAt: now() + 36 + (i % 5) * 7,
            lastUpdatedAt: now(),
            lastHitAt: 0, flashUntil: 0, attackUntil: 0, attackTargetX: 200, attackTargetY: 130,
            impactUntil: 0, impactX: 0, impactY: 0, phase: Math.random() * Math.PI * 2
        };
    }
    function makeOverlay() {
        var canvas = document.getElementById("arenaCanvas");
        if (!canvas || !canvas.parentNode) return;
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = document.createElement("canvas");
        overlay.id = "mbGERTrainingSwarmCanvas";
        overlay.width = 400;
        overlay.height = 500;
        overlay.style.cssText = "position:fixed;pointer-events:none;z-index:100020;left:0;top:0;width:1px;height:1px;";
        document.body.appendChild(overlay);
        overlayCtx = overlay.getContext("2d");
    }
    function placeOverlay(force) {
        if (!overlay) return;
        var time = now();
        if (!force && time - lastOverlayLayoutAt < 350) return;
        lastOverlayLayoutAt = time;
        var canvas = document.getElementById("arenaCanvas");
        if (!canvas) return;
        var r = canvas.getBoundingClientRect();
        overlay.style.left = r.left + "px";
        overlay.style.top = r.top + "px";
        overlay.style.width = r.width + "px";
        overlay.style.height = r.height + "px";
        overlay.style.display = r.width && r.height ? "block" : "none";
    }
    function makePanel() {
        if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
        panel = document.createElement("div");
        panel.id = "mbGERTrainingSwarmPanel";
        panel.style.cssText = "position:fixed;z-index:100030;top:calc(12px + env(safe-area-inset-top));left:12px;width:min(270px,calc(100vw - 24px));max-height:42vh;overflow:auto;padding:10px 12px;border:1px solid rgba(255,214,112,.65);border-radius:12px;background:rgba(9,12,20,.92);color:#fff2c6;font:700 11px/1.45 Arial,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35);";
        panel.innerHTML = '<div style="font-weight:900;font-size:12px;color:#ffe19a">GER TRAINING · 100 ОСНОВНЫХ СТЕНДОВ</div><div style="margin:3px 0 6px;color:#c7d2e2;font-size:10px">Очки: попадание +20 · уклонение +1 · смерть −300. Позиция: ≤145 +1,5/с · 145–210 +0,4/с · >280 −1,5/с · край −0,8…−2,2/с. Для каждого типа атаки своя тактика</div><div id="mbGERSwarmSummary">Подготовка арены…</div><div id="mbGERSwarmLeaders" style="margin-top:5px"></div>';
        document.body.appendChild(panel);
    }
    function allowExit(ev) {
        var t = ev && ev.target;
        var label = t && String(t.textContent || "").toLowerCase();
        return !!(t && (t.id === "bossTestExitFightBtn" || (t.closest && t.closest("#bossTestExitFightBtn")) ||
            t.id === "gerTrainingStopBtn" || (t.closest && t.closest("#gerTrainingStopBtn")) ||
            (t.tagName === "BUTTON" && label.indexOf("выйти") !== -1)));
    }
    function blockInput(ev) {
        if (!active || allowExit(ev)) return;
        if (ev && ev.cancelable) ev.preventDefault();
        if (ev && ev.stopPropagation) ev.stopPropagation();
        if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        return false;
    }
    function lockPlayerInput() {
        if (inputHandlers.length) return;
        ["pointerdown","pointerup","pointermove","mousedown","mouseup","click","dblclick","touchstart","touchmove","touchend","keydown","keyup","keypress","contextmenu"].forEach(function (type) {
            var fn = blockInput;
            window.addEventListener(type, fn, {capture:true, passive:false});
            inputHandlers.push([type, fn]);
        });
    }
    function unlockPlayerInput() {
        inputHandlers.forEach(function (pair) { window.removeEventListener(pair[0], pair[1], true); });
        inputHandlers = [];
    }
    function installTrainingCollisionIsolation() {
        if (window.__mbGERTrainingCollisionGuardInstalled) return;
        var original = window.dioAttackTouchesStand;
        if (typeof original !== "function") return;
        window.dioAttackTouchesStand = function () {
            if (window.__mbGERTrainingSwarmActive === true) return false;
            return original.apply(this, arguments);
        };
        window.__mbGERTrainingCollisionGuardInstalled = true;
    }
    function collectTrainingAttacks(ctx) {
        var result = [];
        ["getAttacks", "getBlasters"].forEach(function (method) {
            if (!ctx || typeof ctx[method] !== "function") return;
            try {
                var rows = ctx[method]();
                if (!Array.isArray(rows)) return;
                rows.forEach(function (attack) {
                    if (attack && result.indexOf(attack) === -1) result.push(attack);
                });
            } catch (e) {}
        });
        return result;
    }
    function getThreat(attack, x, y, frames, alert) {
        try {
            if (typeof window.MBGERTrainingThreatAt === "function") return window.MBGERTrainingThreatAt(attack, x, y, frames || 0, alert === true, trainingBossContext || context());
        } catch (e) {}
        return null;
    }
    function waveThreatAt(wave, x, y, frames, alert) {
        if (!wave || wave.odenHit || !(Number(wave.damage) > 0)) return null;
        var radius = Math.max(0, Number(wave.radius) || 0) +
            Math.max(0, Number(wave.speed) || 0) * Math.max(0, Number(frames) || 0);
        var cx = Number(wave.x) || 0, cy = Number(wave.y) || 0;
        var distance = Math.hypot(x - cx, y - cy);
        var limit = (Number(wave.width) || 5) * 0.7 + playerHeartHitbox() + (alert ? 34 : 0);
        if (Math.abs(distance - radius) >= limit) return null;
        return { source: wave, kind: "shockwave", info: { x: cx, y: cy, distance: Math.abs(distance - radius), attack: wave } };
    }
    function findThreatAt(attacks, waves, x, y, frames, alert) {
        for (var i = 0; i < attacks.length; i++) {
            var hit = getThreat(attacks[i], x, y, frames, alert);
            if (hit) return { source: attacks[i], kind: "attack", info: hit };
        }
        for (var j = 0; j < waves.length; j++) {
            var waveHit = waveThreatAt(waves[j], x, y, frames, alert);
            if (waveHit) return waveHit;
        }
        return null;
    }
    function dangerAt(attacks, waves, x, y, frames) {
        return !!findThreatAt(attacks, waves, x, y, frames, true);
    }
    function chooseTarget(c, boss, attacks, waves) {
        var best = null, bestScore = -Infinity;
        var riskWeight = 0.75 + (1 - c.riskTolerance) * 1.65;
        for (var k = 0; k < 8; k++) {
            var a = k * Math.PI / 4 + c.phase + c.orbitDirection * (c.id % 3) * 0.09;
            var d = c.preferredRange + ((k % 3) - 1) * 17;
            var x = clamp(boss.x + Math.cos(a) * d, 20, 380);
            var y = clamp(boss.y + Math.sin(a) * d, 20, 480);
            var score = -Math.hypot(x - c.x, y - c.y) * 0.06;
            if (dangerAt(attacks, waves, x, y, 0)) score -= 140 * riskWeight;
            if (dangerAt(attacks, waves, x, y, 12)) score -= 90 * riskWeight;
            score += Math.min(30, Math.min(x - 20, 380 - x, y - 20, 480 - y)) * 0.2;
            score += (c.aggression - 1) * (145 - d) * 0.035;
            score += Math.random() * (1.5 + c.riskTolerance * 4);
            if (score > bestScore) { bestScore = score; best = {x:x,y:y}; }
        }
        return best || {x:clamp(boss.x+100,20,380),y:clamp(boss.y+100,20,480)};
    }
    function normalizeTrainingKey(value, fallback) {
        var key = String(value || fallback || "unknown").toLowerCase()
            .replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
        return key || "unknown";
    }
    function getCurrentTrainingBossKey() {
        var ctx = context();
        return normalizeTrainingKey(
            window.__mbGERTrainingBossKey || (ctx && ctx.type) || "unknown",
            "unknown"
        ).slice(0, 64);
    }
    function trainingDirection(x1, y1, x2, y2) {
        return (Math.round(Math.atan2(y2 - y1, x2 - x1) / (Math.PI / 4)) + 8) % 8;
    }
    function agentTrainingContext(agent, boss, attacks, waves) {
        // Match the primary GER context buckets so the main brain and the 100-agent
        // pool learn from the same situations rather than incompatible labels.
        var bossDistance = Math.hypot(agent.x - boss.x, agent.y - boss.y);
        var position = "s" + trainingDirection(boss.x, boss.y, agent.x, agent.y);
        var bossRange = bossDistance < 100 ? "close" : (bossDistance < 210 ? "mid" : "far");
        var wallDistance = Math.max(0, Math.min(
            agent.x - 24, 376 - agent.x, agent.y - 18, 474 - agent.y
        ));
        var wall = wallDistance < 42 ? "edge" : (wallDistance < 92 ? "near" : "open");
        var nearestHazard = Infinity;
        var nearbyHazards = 0;
        for (var i = 0; i < attacks.length; i++) {
            var attack = attacks[i];
            if (!attack || attack.state === "done") continue;
            var ax = Number.isFinite(Number(attack.x)) ? Number(attack.x) : Number(attack.targetX);
            var ay = Number.isFinite(Number(attack.y)) ? Number(attack.y) : Number(attack.targetY);
            if (!Number.isFinite(ax) || !Number.isFinite(ay)) continue;
            var radius = Math.max(0, Number(attack.radius) || 0);
            var width = Math.max(6, Number(attack.width) || Number(attack.size) || 14);
            var height = Math.max(6, Number(attack.height) || Number(attack.size) || width);
            var halfW = radius > 0 ? radius : width * 0.5;
            var halfH = radius > 0 ? radius : height * 0.5;
            var dx = Math.max(0, Math.abs(agent.x - ax) - halfW);
            var dy = Math.max(0, Math.abs(agent.y - ay) - halfH);
            var distance = Math.hypot(dx, dy);
            if (distance < nearestHazard) nearestHazard = distance;
            if (distance < 145) nearbyHazards++;
        }
        for (var w = 0; w < waves.length; w++) {
            var wave = waves[w];
            if (!wave || wave.odenHit) continue;
            var waveDistance = Math.abs(
                Math.hypot(agent.x - (Number(wave.x) || 0), agent.y - (Number(wave.y) || 0)) -
                Math.max(0, Number(wave.radius) || 0)
            );
            if (waveDistance < nearestHazard) nearestHazard = waveDistance;
            if (waveDistance < 145) nearbyHazards++;
        }
        var hazard = !Number.isFinite(nearestHazard) ? "clear" :
            (nearestHazard < 58 ? "near" : (nearestHazard < 138 ? "mid" : "far"));
        return {
            positionBucket: position,
            bossRangeBucket: bossRange,
            hazardBucket: hazard,
            wallBucket: wall,
            bossDistance: Math.round(bossDistance),
            bossDx: Number(Math.max(-1, Math.min(1, (agent.x - boss.x) / 200)).toFixed(2)),
            bossDy: Number(Math.max(-1, Math.min(1, (agent.y - boss.y) / 250)).toFixed(2)),
            nearestHazardDistance: Number.isFinite(nearestHazard) ? Math.round(nearestHazard) : null,
            nearbyHazards: nearbyHazards,
            nearestWallDistance: Math.round(wallDistance)
        };
    }
    function predictAgentRoute(agent, targetX, targetY, futureTimes) {
        var route = [];
        var maxSpeed = Math.max(0.5, Math.min(8, 3.6 * agent.movementSpeed));
        var skill = Math.max(0.14, Math.min(1, Number(agent.aiSkill) || 0.62));
        var steering = 0.17 + skill * 0.13;
        var x = Number(agent.x) || 0, y = Number(agent.y) || 0;
        var vx = Number(agent.vx) || 0, vy = Number(agent.vy) || 0;
        var previousTime = 0;

        for (var i = 0; i < futureTimes.length; i++) {
            var targetTime = Math.max(previousTime, Number(futureTimes[i]) || 0);
            var remaining = targetTime - previousTime;
            // Integrate in 6-frame chunks instead of simulating every frame.
            while (remaining > 0) {
                var step = Math.min(6, remaining);
                var dx = targetX - x, dy = targetY - y;
                var distance = Math.hypot(dx, dy);
                var desiredSpeed = distance < 3 ? 0 : Math.min(maxSpeed, Math.max(0.45, distance * 0.22));
                var desiredVx = distance > 0 ? dx / distance * desiredSpeed : 0;
                var desiredVy = distance > 0 ? dy / distance * desiredSpeed : 0;
                var blend = 1 - Math.pow(1 - steering, step);
                var oldVx = vx, oldVy = vy;
                vx += (desiredVx - vx) * blend;
                vy += (desiredVy - vy) * blend;
                var currentSpeed = Math.hypot(vx, vy);
                if (currentSpeed > maxSpeed) {
                    vx = vx / currentSpeed * maxSpeed;
                    vy = vy / currentSpeed * maxSpeed;
                }
                var nextX = x + (oldVx + vx) * 0.5 * step;
                var nextY = y + (oldVy + vy) * 0.5 * step;
                x = clamp(nextX, 18, 382);
                y = clamp(nextY, 8, 482);
                if (x !== nextX) vx *= -0.18;
                if (y !== nextY) vy *= -0.18;
                remaining -= step;
            }
            route.push({time:targetTime,x:x,y:y});
            previousTime = targetTime;
        }
        return route;
    }
    function findIncomingAgentThreat(agent, boss, attacks, waves) {
        var skill = Math.max(0.14, Math.min(1, Number(agent.aiSkill) || 0.62));
        var horizon = Math.round(168 + skill * 66);
        var times = [0,5,12,22,36,54,76,104,138,178,horizon];
        var route = predictAgentRoute(agent, agent.tx, agent.ty, times);
        var earliest = null;
        var bestTime = Infinity;

        for (var a = attacks.length - 1; a >= 0; a--) {
            for (var p = 0; p < route.length; p++) {
                var point = route[p];
                var risk = getThreat(attacks[a], point.x, point.y, point.time, true);
                if (risk && point.time < bestTime) {
                    bestTime = point.time;
                    earliest = {
                        source: attacks[a], kind: "attack", info: risk,
                        time: point.time, attackType: attacks[a].type || attacks[a].kind,
                        predictedX: point.x, predictedY: point.y
                    };
                    break;
                }
            }
        }
        for (var w = waves.length - 1; w >= 0; w--) {
            for (var wp = 0; wp < route.length; wp++) {
                var wavePoint = route[wp];
                var waveRisk = waveThreatAt(waves[w], wavePoint.x, wavePoint.y, wavePoint.time, true);
                if (waveRisk && wavePoint.time < bestTime) {
                    bestTime = wavePoint.time;
                    earliest = {
                        source: waves[w], kind: "shockwave", info: waveRisk,
                        time: wavePoint.time, attackType: "shockwave",
                        predictedX: wavePoint.x, predictedY: wavePoint.y
                    };
                    break;
                }
            }
        }
        return earliest;
    }
    function strategyRayClearance(agent, angle) {
        var dx = Math.cos(angle), dy = Math.sin(angle);
        var limits = [];
        if (dx > 0.0001) limits.push((376 - agent.x) / dx);
        else if (dx < -0.0001) limits.push((24 - agent.x) / dx);
        if (dy > 0.0001) limits.push((474 - agent.y) / dy);
        else if (dy < -0.0001) limits.push((18 - agent.y) / dy);
        var valid = limits.filter(function (value) { return Number.isFinite(value) && value >= 0; });
        return valid.length ? Math.min.apply(Math, valid) : 0;
    }
    function openSideAngle(agent, nx, ny) {
        var length = Math.hypot(nx, ny) || 1;
        nx /= length;
        ny /= length;
        var angle = Math.atan2(ny, nx);
        return strategyRayClearance(agent, angle) >=
            strategyRayClearance(agent, angle + Math.PI) ? angle : angle + Math.PI;
    }
    function getAttackStrategy(agent, incoming) {
        var attack = incoming && incoming.source || {};
        var info = incoming && incoming.info || {};
        var type = String(attack.type || attack.kind ||
            incoming && incoming.attackType || incoming && incoming.kind || "unknown").toLowerCase();
        var lower = type.indexOf("lower") !== -1 ||
            String(attack.zone || "").toLowerCase() === "lower";
        var upper = type.indexOf("upper") !== -1 ||
            String(attack.zone || "").toLowerCase() === "upper";
        var ax = Number.isFinite(Number(attack.x)) ? Number(attack.x) :
            Number.isFinite(Number(attack.targetX)) ? Number(attack.targetX) :
            Number.isFinite(Number(info.x)) ? Number(info.x) : agent.x;
        var ay = Number.isFinite(Number(attack.y)) ? Number(attack.y) :
            Number.isFinite(Number(attack.targetY)) ? Number(attack.targetY) :
            Number.isFinite(Number(info.y)) ? Number(info.y) : agent.y;
        var awayX = agent.x - ax, awayY = agent.y - ay;
        var awayLength = Math.hypot(awayX, awayY);
        if (awayLength < 1) {
            awayX = agent.x - 200;
            awayY = agent.y - 250;
            awayLength = Math.hypot(awayX, awayY) || 1;
        }
        var vx = Number(attack.vx) || 0, vy = Number(attack.vy) || 0;
        var angle = Math.atan2(awayY, awayX);
        var family = "predictive";
        var label = "predictive_escape";
        var isRing = type === "ring" || type.indexOf("shockwave") !== -1 ||
            (incoming && incoming.kind === "shockwave");
        var isLine = type === "sweep" || type === "barrierlaser" ||
            type === "laser" || type.indexOf("laser") !== -1 ||
            type.indexOf("beam") !== -1 || type.indexOf("slash") !== -1 ||
            type.indexOf("blade") !== -1 || type === "roger_cross" ||
            info.axis === "segment";
        var isWall = type.indexOf("wall") !== -1 || type.indexOf("plate") !== -1 ||
            type.indexOf("gate") !== -1 || info.axis === "rect";

        if (type === "wb_giant_rock_warning") {
            family = "vertical_impact_lane";
            label = "sidestep_rock_column";
            var rockX = Number(attack.targetX !== undefined ? attack.targetX : attack.x);
            if (Number.isFinite(rockX)) angle = agent.x <= rockX ? Math.PI : 0;
            else angle = openSideAngle(agent, 1, 0);
        } else if (type === "wb_combo_gate_warning") {
            family = "combo_gate_gap";
            label = "enter_combo_gate_gap";
            var gateY = Number(attack.targetY);
            if (Number.isFinite(gateY)) angle = agent.y <= gateY ? Math.PI / 2 : -Math.PI / 2;
            else angle = openSideAngle(agent, 0, 1);
        } else if (type === "wb_attack_telegraph") {
            var attackId = Number(attack.attackId);
            var attackKind = String(attack.attackKind || "normal").toLowerCase();
            if (Array.isArray(attack.columns) && attack.columns.length) {
                family = "column_pattern";
                label = "find_gap_between_columns";
                var columns = attack.columns.map(Number).filter(Number.isFinite).sort(function(a,b){return a-b;});
                var gapOptions = [24,376];
                if (columns.length) {
                    gapOptions.push((24 + columns[0]) * 0.5);
                    gapOptions.push((columns[columns.length-1] + 376) * 0.5);
                }
                for (var gapIndex=0; gapIndex<columns.length-1; gapIndex++) {
                    gapOptions.push((columns[gapIndex] + columns[gapIndex+1]) * 0.5);
                }
                var bestGapX = gapOptions[0], bestGapScore = -Infinity;
                gapOptions.forEach(function(optionX) {
                    var clearance = columns.reduce(function(minimum,column) {
                        return Math.min(minimum,Math.abs(optionX-column));
                    },Infinity);
                    var gapScore = clearance - Math.abs(optionX-agent.x)*0.12;
                    if (gapScore > bestGapScore) {
                        bestGapScore = gapScore;
                        bestGapX = optionX;
                    }
                });
                angle = Math.abs(bestGapX-agent.x) < 8 ? openSideAngle(agent,1,0) :
                    (bestGapX > agent.x ? 0 : Math.PI);
            } else if (attackKind === "normal" && [2,3,7].indexOf(attackId)!==-1) {
                family = "horizontal_lane";
                label = "leave_telegraphed_horizontal_lane";
                var telegraphY = Number(attack.targetY);
                angle = Number.isFinite(telegraphY) ? (agent.y <= telegraphY ? -Math.PI/2 : Math.PI/2) :
                    openSideAngle(agent,0,1);
            } else if (attackKind === "normal" && attackId === 1) {
                family = "radial_impact";
                label = "escape_telegraphed_radial_impact";
                var originX = Number(attack.originX !== undefined ? attack.originX : attack.x);
                var originY = Number(attack.originY !== undefined ? attack.originY : attack.y);
                angle = Math.atan2(agent.y-originY,agent.x-originX);
            } else if (Number.isFinite(Number(attack.targetX))) {
                family = "vertical_impact_lane";
                label = "sidestep_telegraphed_column";
                angle = agent.x <= Number(attack.targetX) ? Math.PI : 0;
            } else {
                family = "telegraph_escape";
                label = "leave_telegraphed_attack";
                angle = openSideAngle(agent,-awayY,awayX);
            }
        } else if (type === "wb_fruit_punch") {
            family = "segment_sidestep";
            label = "sidestep_fruit_punch";
            var punchDx = Number(attack.endX)-Number(attack.originX);
            var punchDy = Number(attack.endY)-Number(attack.originY);
            if ([attack.endX,attack.endY,attack.originX,attack.originY].every(function(v){return v!==null&&v!==undefined&&Number.isFinite(Number(v));})) {
                angle = openSideAngle(agent,-punchDy,punchDx);
            } else {
                angle = openSideAngle(agent,-awayY,awayX);
            }
        } else if (type === "wb_crescent_slash") {
            family = "crescent_lane";
            label = "leave_crescent_slash_lane";
            var safeY = Number(info.safeY);
            if (info.safeY !== null && info.safeY !== undefined && Number.isFinite(safeY)) {
                angle = agent.y <= safeY ? Math.PI/2 : -Math.PI/2;
            } else {
                angle = openSideAngle(agent,0,1);
            }
        } else if (type === "wb_center_wave" || type === "tsunami") {
            family = "horizontal_wave_front";
            label = type === "tsunami" ? "escape_tsunami_front" : "escape_center_wave_front";
            var frontTime = Math.max(0,Number(incoming && incoming.time)||0);
            var frontY = type === "tsunami"
                ? Number(attack.y) + (Number(attack.vy)||0)*frontTime
                : Number(attack.y) - (Number(attack.speed)||3.4)*frontTime;
            angle = Number.isFinite(frontY)
                ? (agent.y <= frontY ? -Math.PI/2 : Math.PI/2)
                : openSideAngle(agent,0,1);
        } else if (type === "zonelaser") {
            family = "zone_escape";
            label = lower ? "leave_lower_zone" : upper ? "leave_upper_zone" : "leave_laser_zone";
            angle = lower ? -Math.PI / 2 : upper ? Math.PI / 2 : angle;
        } else if (type === "spike") {
            family = "spike_sidestep";
            label = "sidestep_spike_lane";
            var spikeX = Number(attack.x);
            angle = Number.isFinite(spikeX) ? (agent.x <= spikeX ? Math.PI : 0) : openSideAngle(agent, 1, 0);
        } else if (type === "mark" || type === "well") {
            family = type === "well" ? "gravity_well_escape" : "marked_impact_escape";
            label = type === "well" ? "escape_well_radius" : "leave_marked_area";
            angle = Math.atan2(awayY, awayX);
        } else if (isRing) {
            family = "radial_wave";
            label = "cross_radial_wave";
            var radius = Math.max(0, Number(attack.radius) || Number(attack.currentRadius) || 0);
            radius += (Number(attack.speed)||Number(attack.expansionSpeed)||Number(attack.growth)||0) *
                Math.max(0,Number(incoming && incoming.time)||0);
            var currentDistance = Math.hypot(agent.x - ax, agent.y - ay);
            // Stay on the same side of an expanding ring: inward if already inside,
            // outward if already outside it.
            angle = currentDistance <= radius ? Math.atan2(ay - agent.y, ax - agent.x) :
                Math.atan2(awayY, awayX);
        } else if (isWall) {
            family = "barrier_gap";
            label = "move_around_barrier";
            var orientation = String(attack.orientation || "").toLowerCase();
            if (orientation === "vertical" || (info.axis === "rect" &&
                Math.abs(agent.x - ax) <= Math.abs(agent.y - ay))) {
                angle = openSideAngle(agent, 1, 0);
            } else {
                angle = openSideAngle(agent, 0, 1);
            }
        } else if (isLine) {
            family = "line_crossing";
            label = "cross_attack_line";
            var lineAngle = Number(attack.angle);
            var hasLineAngle = attack.angle !== null && attack.angle !== undefined &&
                attack.angle !== "" && Number.isFinite(lineAngle);
            if (hasLineAngle) {
                angle = openSideAngle(agent, -Math.sin(lineAngle), Math.cos(lineAngle));
            } else if (String(attack.orientation || "").toLowerCase() === "vertical" ||
                info.axis === "vertical") {
                angle = openSideAngle(agent, 1, 0);
            } else if (String(attack.orientation || "").toLowerCase() === "horizontal" ||
                info.axis === "horizontal") {
                angle = openSideAngle(agent, 0, 1);
            } else if (Math.hypot(vx, vy) > 0.1) {
                angle = openSideAngle(agent, -vy, vx);
            } else {
                angle = openSideAngle(agent, -awayY, awayX);
            }
        } else if (Math.hypot(vx, vy) > 0.1) {
            family = "moving_projectile";
            label = "sidestep_projectile_trajectory";
            angle = openSideAngle(agent, -vy, vx);
        } else if (Math.abs(Number(attack.targetX) - Number(attack.x)) > 8 ||
            Math.abs(Number(attack.targetY) - Number(attack.y)) > 8) {
            family = "aimed_strike";
            label = "evade_aimed_strike";
            angle = Math.atan2(awayY, awayX);
        } else if (info.axis === "vertical") {
            family = "vertical_lane";
            label = "leave_vertical_lane";
            angle = openSideAngle(agent, 1, 0);
        } else if (info.axis === "horizontal") {
            family = "horizontal_lane";
            label = "leave_horizontal_lane";
            angle = openSideAngle(agent, 0, 1);
        } else {
            family = "impact_escape";
            label = "move_away_from_impact";
            angle = Math.atan2(awayY, awayX);
        }
        return {
            angle: angle,
            family: family,
            name: normalizeTrainingKey(label + "_" + type, "predictive_escape").slice(0, 64)
        };
    }

    function chooseDodgeTarget(agent, boss, attacks, waves, incoming) {
        var left = 24, right = 376, top = 18, bottom = 474;
        var distances = [92,152];
        var futureTimes = [0,8,18,32,50,72];
        var currentSpeed = Math.hypot(Number(agent.vx)||0, Number(agent.vy)||0);
        var trainingApi = window.MBGERTraining;
        var bossKey = getCurrentTrainingBossKey();
        var attack = incoming && incoming.source || {};
        var rawKey = attack.type || attack.kind || attack.attackType ||
            (incoming && incoming.attackType) || "unknown";
        if (attack.attackKind) rawKey += "_" + String(attack.attackKind);
        var attackKey = normalizeTrainingKey(rawKey, "unknown");
        var strategy = getAttackStrategy(agent, incoming);
        var trainingContext = agentTrainingContext(agent, boss, attacks, waves);
        var best = null, bestScore = -Infinity;

        for (var d = 0; d < distances.length; d++) {
            for (var k = 0; k < 12; k++) {
                var angle = k * Math.PI * 2 / 12;
                var tx = clamp(agent.x + Math.cos(angle) * distances[d], left, right);
                var ty = clamp(agent.y + Math.sin(angle) * distances[d], top, bottom);
                var route = predictAgentRoute(agent, tx, ty, futureTimes);
                var candidateAngle = Math.atan2(ty - agent.y, tx - agent.x);
                var score = Math.cos(candidateAngle - strategy.angle) * 78;
                var collisions = 0;
                for (var p = 0; p < route.length; p++) {
                    var point = route[p];
                    for (var a = attacks.length - 1; a >= 0; a--) {
                        if (getThreat(attacks[a], point.x, point.y, point.time, true)) {
                            collisions++;
                            score -= p < 2 ? 132 : 92;
                        }
                    }
                    for (var w = waves.length - 1; w >= 0; w--) {
                        if (waveThreatAt(waves[w], point.x, point.y, point.time, true)) {
                            collisions++;
                            score -= p < 2 ? 118 : 84;
                        }
                    }
                }
                if (collisions === 0) score += 330;
                else score -= collisions * 24;
                if (incoming && incoming.info) {
                    score += Math.min(220, Math.hypot(tx - (Number(incoming.info.x)||0),
                        ty - (Number(incoming.info.y)||0))) * 0.42;
                }
                if (currentSpeed > 0.8) {
                    var routeDx = tx - agent.x, routeDy = ty - agent.y;
                    var routeLength = Math.hypot(routeDx, routeDy) || 1;
                    var alignment = ((Number(agent.vx)||0) * routeDx + (Number(agent.vy)||0) * routeDy) /
                        Math.max(1, currentSpeed * routeLength);
                    score += alignment * 12;
                }
                var continuity = Math.hypot(tx - agent.tx, ty - agent.ty);
                score -= Math.min(80, continuity) * 0.035;
                var margin = Math.min(tx-left,right-tx,ty-top,bottom-ty);
                score += Math.min(28, Math.max(0, margin)) * 0.55;
                var bossDistance = Math.hypot(tx - boss.x, ty - boss.y);
                if (bossDistance < 92) score -= (92 - bossDistance) * 1.8;
                else score += Math.min(70, bossDistance - 92) * 0.08;

                if (trainingApi && typeof trainingApi.getDirectionStats === "function") {
                    var direction = trainingDirection(agent.x, agent.y, tx, ty);
                    var learned = trainingApi.getDirectionStats(
                        bossKey,
                        attackKey, direction
                    );
                    var count = Number(learned && learned.sample_count) || 0;
                    if (count >= 5) {
                        var success = ((Number(learned.evaded_count)||0) +
                            (Number(learned.blocked_count)||0) * 0.72 + 1) / (count + 2);
                        score += (success - 0.5) * 34 * Math.min(1, count / 28);
                    }
                    if (typeof trainingApi.getContextStats === "function") {
                        var contextStats = trainingApi.getContextStats(
                            bossKey,
                            attackKey, trainingContext.positionBucket,
                            trainingContext.hazardBucket, trainingContext.wallBucket, direction
                        );
                        var contextCount = Number(contextStats && contextStats.sample_count) || 0;
                        if (contextCount >= 3) {
                            var contextSuccess = ((Number(contextStats.evaded_count)||0) +
                                (Number(contextStats.blocked_count)||0) * 0.72 + 1) / (contextCount + 2);
                            score += (contextSuccess - 0.5) * 50 * Math.min(1, contextCount / 14);
                        }
                    }
                }
                score += Math.random() * (1.5 + agent.riskTolerance * 2);
                if (score > bestScore) bestScore = score, best = {
                    x:tx,y:ty,safe:collisions===0,
                    strategyName:strategy.name,strategyFamily:strategy.family
                };
            }
        }
        return best || {x:clamp(agent.x + (agent.x < 200 ? 100 : -100),left,right),
            y:clamp(agent.y - 55,top,bottom),safe:false,
            strategyName:strategy.name,strategyFamily:strategy.family};
    }
    function reportAgentOutcome(c, pending, outcome, damage, boss, attacks, waves, ctx) {
        var api = window.MBGERTraining;
        if (!api || typeof api.recordOutcome !== "function") return false;
        var attack = pending && pending.source || {};
        var rawKey = attack.type || attack.kind || attack.attackType ||
            (pending && pending.attackType) || (pending && pending.kind) || "unknown";
        if (attack.attackKind) rawKey += "_" + String(attack.attackKind);
        var startX = pending && Number.isFinite(Number(pending.startX)) ? Number(pending.startX) : c.x;
        var startY = pending && Number.isFinite(Number(pending.startY)) ? Number(pending.startY) : c.y;
        var targetX = pending && Number.isFinite(Number(pending.targetX)) ? Number(pending.targetX) : c.tx;
        var targetY = pending && Number.isFinite(Number(pending.targetY)) ? Number(pending.targetY) : c.ty;
        var direction = pending && Number.isFinite(Number(pending.direction))
            ? Number(pending.direction) : trainingDirection(startX, startY, targetX, targetY);
        var snapshot = Object.assign({}, c, {x: startX, y: startY});
        var learnedContext = agentTrainingContext(snapshot, boss, attacks, waves);
        c.decisions++;
        return api.recordOutcome({
            attackKey: normalizeTrainingKey(rawKey, "unknown"),
            attackFamily: normalizeTrainingKey(attack.attackFamily || rawKey, "unknown").slice(0, 40),
            bossPhase: normalizeTrainingKey(attack.bossPhase || attack.phase ||
                attack.phaseIndex || (ctx && ctx.phase) || (ctx && ctx.type), "unknown").slice(0, 32),
            timeToImpactMs: Math.max(0, Math.round((Number(pending && pending.timeToImpactFrames) || 0) * 16.667)),
            heartX: startX,
            heartY: startY,
            velocityX: Number(pending && pending.velocityX) || c.vx,
            velocityY: Number(pending && pending.velocityY) || c.vy,
            chosenDirection: direction,
            targetX: targetX,
            targetY: targetY,
            features: Object.assign({}, learnedContext, {
                sampleType: "dodge",
                agentId: c.id,
                agentRole: "primary_stand",
                decisionOrder: ++trainingDecisionOrder,
                threatKind: pending && pending.kind || "attack",
                dodgeStrategy: pending && pending.strategyName || "predictive_escape",
                dodgeStrategyFamily: pending && pending.strategyFamily || "predictive",
                aiSkill: Number(c.aiSkill.toFixed(3)),
                aggression: Number(c.aggression.toFixed(3)),
                riskTolerance: Number(c.riskTolerance.toFixed(3)),
                preferredRange: Math.round(c.preferredRange),
                movementSpeed: Number(c.movementSpeed.toFixed(3))
            })
        }, outcome, damage || 0);
    }
    function isThreatTelegraph(attack) {
        if (!attack) return false;
        var type = String(attack.type || attack.kind || "").toLowerCase();
        return attack.state === "warning" || attack.state === "windup" ||
            Number(attack.warningTimer) > 0 || Number(attack.warning) > 0 ||
            type.indexOf("warning") !== -1 || type.indexOf("telegraph") !== -1;
    }
    function pendingThreatStillActive(pending, c, attacks, waves) {
        if (!pending || !pending.source) return false;
        if (pending.kind === "shockwave") {
            return waves.indexOf(pending.source) !== -1 &&
                !!waveThreatAt(pending.source, c.x, c.y, 0, false);
        }
        if (attacks.indexOf(pending.source) === -1) return false;
        if (isThreatTelegraph(pending.source)) return true;
        return !!getThreat(pending.source, c.x, c.y, 0, false);
    }
    function createDodgeDecision(c, threat, time) {
        if (!threat) return null;
        var safe = threat.safeTarget || null;
        return {
            source: threat.source,
            kind: threat.kind,
            attackType: threat.attackType || null,
            startedAt: time,
            timeToImpactFrames: Math.max(0, Number(threat.time) || 0),
            startX: c.x,
            startY: c.y,
            velocityX: c.vx,
            velocityY: c.vy,
            targetX: safe ? safe.x : c.tx,
            targetY: safe ? safe.y : c.ty,
            strategyName: safe && safe.strategyName || "predictive_escape",
            strategyFamily: safe && safe.strategyFamily || "predictive",
            direction: trainingDirection(c.x, c.y, safe ? safe.x : c.tx, safe ? safe.y : c.ty)
        };
    }
    function bossTarget(ctx) {
        // The native boss may already have been stopped by its victory callback.
        // Keep using the last live context captured during the teacher fight.
        ctx = ctx || trainingBossContext || context();
        var target = null;
        try {
            if (ctx && ctx.type !== "arena" && typeof window.getDioUniqueBossTarget === "function") {
                target = window.getDioUniqueBossTarget(ctx);
            }
        } catch (e) {}
        var p = target;
        if (!p && ctx && typeof ctx.getBossPosition === "function") {
            try { p = ctx.getBossPosition(); } catch (e) {}
        }
        p = p || {x:200,y:130};
        return {x:Number(p.x)||200,y:Number(p.y)||130,ref:target};
    }
    function currentBossHp(ctx) {
        try { return Math.max(0, Number(ctx.getBossHp && ctx.getBossHp()) || 0); } catch (e) { return 0; }
    }
    function maxBossHp(ctx) {
        try { return Math.max(1, Number(ctx.getBossMaxHp && ctx.getBossMaxHp()) || currentBossHp(ctx) || 1); } catch (e) { return 1; }
    }
    function dealDamage(ctx, c) {
        var hitTarget = bossTarget(ctx);
        c.attackUntil = now() + 360;
        c.attackTargetX = hitTarget.x;
        c.attackTargetY = hitTarget.y;
        var maxHp = maxBossHp(ctx);
        var damage = 0.1;
        var before = currentBossHp(ctx);
        var ok = false;
        try {
            window.__mbGERTrainingSwarmDamageInFlight = true;
            if (typeof ctx.damageBoss === "function") ok = ctx.damageBoss(damage) !== false;
            else if (typeof window.MBApplyBossDamage === "function") ok = window.MBApplyBossDamage(ctx, damage, "GER Swarm") > 0;
        } catch (e) {}
        window.__mbGERTrainingSwarmDamageInFlight = false;
        var after = currentBossHp(ctx);
        var dealt = Math.max(0, before - after);
        if (dealt > 0) {
            c.impactX = hitTarget.x;
            c.impactY = hitTarget.y;
            c.impactUntil = now() + 260;
            c.damageDealt += dealt;
            c.hits++;
            c.score += 20;
            c.flashUntil = now() + 120;
            return true;
        }
        // Count an attack only when the boss HP really decreased.
        return dealt > 0;
    }
    function applyPositionScore(agent, boss, time) {
        var last = Number(agent.lastPositionScoreAt) || time;
        var elapsed = clamp(time - last, 0, 1000);
        agent.lastPositionScoreAt = time;
        if (elapsed <= 0) return;
        var distance = Math.hypot(agent.x - boss.x, agent.y - boss.y);
        var rate = distance <= 145 ? 1.5 :
            distance <= 210 ? 0.4 :
            distance <= 280 ? -0.6 : -1.5;
        var edgeDistance = Math.max(0, Math.min(
            agent.x - 18, 382 - agent.x, agent.y - 8, 482 - agent.y
        ));
        if (edgeDistance < 24) rate -= 2.2;
        else if (edgeDistance < 52) rate -= 0.8;
        var points = rate * elapsed / 1000;
        agent.score += points;
        agent.positionScore = (Number(agent.positionScore) || 0) + points;
    }
    function updateAgent(c, ctx, boss, attacks, waves, time, frameScale) {
        if (!c.alive) {
            if (Number(c.respawnAt) > 0 && time >= c.respawnAt) {
                // Re-enter the fight at a currently safer point around the boss.
                // Keep the learned score and lifetime combat statistics across deaths.
                var spawn = chooseTarget(c, boss, attacks, waves);
                c.alive = true;
                c.hp = c.maxHp;
                c.respawnAt = 0;
                c.lastPositionScoreAt = time;
                c.x = spawn.x;
                c.y = spawn.y;
                c.tx = spawn.x;
                c.ty = spawn.y;
                c.vx = 0;
                c.vy = 0;
                c.pendingDodge = null;
                c.nextDecisionAt = time + Math.min(120, c.reactionMs * 0.5);
                c.nextThreatCheckAt = time + 24;
                c.nextHitCheckAt = time + 42;
                c.nextAttackAt = time + 300 + Math.random() * 400;
                c.flashUntil = time + 220;
            }
            return;
        }
        applyPositionScore(c, boss, time);
        if (time >= c.nextDecisionAt) {
            var chosen = chooseTarget(c, boss, attacks, waves);
            c.tx = chosen.x;
            c.ty = chosen.y;
            c.nextDecisionAt = time + c.reactionMs + Math.random() * 70;
        }

        // Predict the agent's actual trajectory, then choose an escape route using
        // the same danger model and saved direction/context statistics as the main GER.
        var incoming = null;
        if (time >= c.nextThreatCheckAt) {
            incoming = findIncomingAgentThreat(c, boss, attacks, waves);
            c.nextThreatCheckAt = time + 48 + (c.id % 7) * 7;
        }
        if (incoming) {
            var safe = chooseDodgeTarget(c, boss, attacks, waves, incoming);
            c.tx = safe.x;
            c.ty = safe.y;
            incoming.safeTarget = safe;
            if (!c.pendingDodge || c.pendingDodge.source !== incoming.source) {
                if (c.pendingDodge) {
                    reportAgentOutcome(c, c.pendingDodge, "unknown", 0, boss, attacks, waves, ctx);
                }
                c.pendingDodge = createDodgeDecision(c, incoming, time);
                c.lastDodgeStrategy = safe.strategyName || "predictive_escape";
                c.lastAttackType = normalizeTrainingKey(incoming.attackType || incoming.kind || "unknown","unknown");
            } else {
                c.pendingDodge.targetX = safe.x;
                c.pendingDodge.targetY = safe.y;
                c.pendingDodge.direction = trainingDirection(c.x, c.y, safe.x, safe.y);
                c.pendingDodge.strategyName = safe.strategyName || "predictive_escape";
                c.pendingDodge.strategyFamily = safe.strategyFamily || "predictive";
                c.pendingDodge.timeToImpactFrames = Math.max(0, Number(incoming.time) || 0);
            }
            c.nextDecisionAt = time + c.reactionMs * 0.55;
        }

        var dx = c.tx - c.x, dy = c.ty - c.y;
        var distanceToGoal = Math.hypot(dx, dy);
        var maxSpeed = Math.max(0.5, Math.min(8, 3.6 * c.movementSpeed));
        var desiredSpeed = distanceToGoal < 3 ? 0 : Math.min(maxSpeed, Math.max(0.45, distanceToGoal * 0.22));
        var desiredVx = distanceToGoal > 0 ? dx / distanceToGoal * desiredSpeed : 0;
        var desiredVy = distanceToGoal > 0 ? dy / distanceToGoal * desiredSpeed : 0;
        var steering = 0.17 + Math.max(0.14, Math.min(1, Number(c.aiSkill) || 0.62)) * 0.13;
        var steeringBlend = 1 - Math.pow(1 - steering, frameScale);
        c.vx += (desiredVx - c.vx) * steeringBlend;
        c.vy += (desiredVy - c.vy) * steeringBlend;
        var currentSpeed = Math.hypot(c.vx, c.vy);
        if (currentSpeed > maxSpeed) {
            c.vx = c.vx / currentSpeed * maxSpeed;
            c.vy = c.vy / currentSpeed * maxSpeed;
        }
        var nextX = c.x + c.vx * frameScale;
        var nextY = c.y + c.vy * frameScale;
        c.x = clamp(nextX, 18, 382);
        c.y = clamp(nextY, 8, 482);
        if (c.x !== nextX) c.vx *= -0.18;
        if (c.y !== nextY) c.vy *= -0.18;

        if (c.pendingDodge && time - c.pendingDodge.startedAt >= 150 &&
            !pendingThreatStillActive(c.pendingDodge, c, attacks, waves)) {
            reportAgentOutcome(c, c.pendingDodge, "evaded", 0, boss, attacks, waves, ctx);
            c.dodges++;
            c.score += 1;
            c.pendingDodge = null;
        }

        var actualHit = null;
        if (time >= c.nextHitCheckAt) {
            actualHit = findThreatAt(attacks, waves, c.x, c.y, 0, false);
            c.nextHitCheckAt = time + 44 + (c.id % 5) * 7;
        }
        if (actualHit && time - c.lastHitAt > 500) {
            c.lastHitAt = time;
            var hitAttack = actualHit.source || {};
            var damage = Math.max(1, Number(hitAttack.damage) || 10);
            var hitDecision = c.pendingDodge && c.pendingDodge.source === actualHit.source
                ? c.pendingDodge : createDodgeDecision(c, actualHit, time);
            reportAgentOutcome(c, hitDecision, "hit", damage, boss, attacks, waves, ctx);
            c.failedDodges++;
            if (c.pendingDodge && c.pendingDodge.source === actualHit.source) c.pendingDodge = null;
            c.damageTaken += damage;
            c.hp--;
            c.flashUntil = time + 180;
            if (c.hp <= 0) {
                c.alive = false;
                c.score -= 300;
                c.respawnAt = time + 2000;
                c.pendingDodge = null;
            }
        }

        if (c.alive && time >= c.nextAttackAt &&
            Math.hypot(c.x - boss.x, c.y - boss.y) <= 142 + (c.aggression - 1) * 22) {
            if (dealDamage(ctx, c)) c.nextAttackAt = time + c.attackCooldownMs + Math.random() * 250;
            else c.nextAttackAt = time + 450;
        }
    }
    function buildAgentResultSnapshot(reason, completed) {
        var survivors = agents.filter(function (agent) { return agent.alive; });
        return {
            poolType: "parallel_primary_stands",
            agentRole: "primary_stand",
            agentCount: COUNT,
            reason: reason || "checkpoint",
            completed: completed === true,
            survivors: survivors.length,
            totalHits: agents.reduce(function (n, agent) { return n + agent.hits; }, 0),
            totalDodges: agents.reduce(function (n, agent) { return n + agent.dodges; }, 0),
            totalDecisions: agents.reduce(function (n, agent) { return n + agent.decisions; }, 0),
            totalFailedDodges: agents.reduce(function (n, agent) { return n + agent.failedDodges; }, 0),
            totalDamage: Math.floor(agents.reduce(function (n, agent) { return n + agent.damageDealt; }, 0)),
            totalDamageTaken: Math.floor(agents.reduce(function (n, agent) { return n + agent.damageTaken; }, 0)),
            totalPositionScore: Number(agents.reduce(function (n, agent) {
                return n + (Number(agent.positionScore) || 0);
            }, 0).toFixed(2)),
            results: agents.map(function (agent) {
                return {
                    id: agent.id,
                    score: Math.floor(agent.score),
                    positionScore: Number((Number(agent.positionScore) || 0).toFixed(2)),
                    lastDodgeStrategy: agent.lastDodgeStrategy || null,
                    lastAttackType: agent.lastAttackType || null,
                    damageDealt: Math.floor(agent.damageDealt),
                    damageTaken: Math.floor(agent.damageTaken),
                    hits: agent.hits,
                    dodges: agent.dodges,
                    decisions: agent.decisions,
                    failedDodges: agent.failedDodges,
                    alive: agent.alive,
                    x: Number(agent.x.toFixed(2)),
                    y: Number(agent.y.toFixed(2)),
                    velocityX: Number(agent.vx.toFixed(3)),
                    velocityY: Number(agent.vy.toFixed(3)),
                    targetX: Number(agent.tx.toFixed(2)),
                    targetY: Number(agent.ty.toFixed(2)),
                    hp: agent.hp,
                    maxHp: agent.maxHp,
                    personality: {
                        aggression: Number(agent.aggression.toFixed(3)),
                        riskTolerance: Number(agent.riskTolerance.toFixed(3)),
                        aiSkill: Number((Number(agent.aiSkill) || 0.62).toFixed(3)),
                        preferredRange: Math.round(agent.preferredRange),
                        movementSpeed: Number(agent.movementSpeed.toFixed(3))
                    }
                };
            })
        };
    }
    function saveAgentCheckpoint(time) {
        if (!active || ended || time - lastAgentCheckpointAt < 10000) return;
        var trainingApi = window.MBGERTraining;
        if (!trainingApi || typeof trainingApi.saveAgentResults !== "function") return;
        lastAgentCheckpointAt = time;
        var snapshot = buildAgentResultSnapshot("checkpoint", false);
        window.__mbGERTrainingParallelAgentsCheckpoint = snapshot;
        Promise.resolve(trainingApi.saveAgentResults(snapshot)).then(function (response) {
            if (response && response.ok === true) {
                console.info("[GER TRAINING] Saved live checkpoint for", response.savedAgents,
                    "primary stands.");
            }
        }).catch(function (error) {
            console.warn("[GER TRAINING] Live checkpoint remains queued:",
                error && error.message ? error.message : error);
        });
    }

    function update(dt) {
        if (!active || ended) return;
        var ctx = context();
        if (!ctx || !ctx.getAttacks || !ctx.getBossPosition) return;
        trainingBossContext = ctx;
        var time = now();
        var boss = bossTarget(ctx);
        var attacks = collectTrainingAttacks(ctx);
        var waves = [];
        try { waves = ctx.getShockwaves ? ctx.getShockwaves() || [] : []; } catch (e) {}
        var scale = clamp((Number(dt)||16.667)/16.667,0.5,2.2);
        // Run half the pool per simulation tick. Across two alternating ticks all 100
        // agents are updated; each agent therefore thinks at ~15Hz while drawing stays at RAF.
        var batchCount = Math.max(1, Math.ceil(agents.length / UPDATE_BATCH_SIZE));
        var batchIndex = updateBatch % batchCount;
        var batchStart = batchIndex * UPDATE_BATCH_SIZE;
        var batchEnd = Math.min(agents.length, batchStart + UPDATE_BATCH_SIZE);
        for (var i = batchStart; i < batchEnd; i++) {
            var agent = agents[i];
            var agentElapsed = Math.max(16.667, time - (Number(agent.lastUpdatedAt) || time));
            var agentScale = clamp(agentElapsed / 16.667, 0.5, 4.2);
            updateAgent(agent, ctx, boss, attacks, waves, time, agentScale);
            agent.lastUpdatedAt = time;
        }
        updateBatch = (batchIndex + 1) % batchCount;
        if (time - lastUiAt > 1000) { updatePanel(ctx); lastUiAt = time; }
        saveAgentCheckpoint(time);
        if (ctx.type === "rwb") {
            // Roger/Whitebeard has native phase and result callbacks. A zero HP
            // reading during intro/phase transition must never end training early.
            zeroHpSince = 0;
        } else {
            var hpNow = currentBossHp(ctx);
            if (hpNow > 0) zeroHpSince = 0;
            else {
                if (!zeroHpSince) zeroHpSince = time;
                // Other unique bosses can briefly have 0 HP between native phases.
                if (time - zeroHpSince >= 5000) {
                    finishScores("boss_defeated");
                    if (window.__mbBossTestMode && typeof window.MBBossTestFinish === "function") {
                        window.MBBossTestFinish("win", false);
                    }
                }
            }
        }
    }
    function drawAgent(ctx, agent, time, heartSize) {
        var hitFlash = agent.flashUntil > time;
        var sizeScale = Math.max(0.35, Math.min(2.3, (Number(heartSize) || 14) / 14));

        ctx.save();
        ctx.translate(agent.x, agent.y);
        ctx.globalAlpha = agent.alive ? 0.98 : 0.35;
        ctx.scale(sizeScale, sizeScale);

        // Same compact SOUL silhouette used by the player, recolored yellow-orange.
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(-2, 4, -9, -1, -9, -5);
        ctx.bezierCurveTo(-9, -11, -2, -12, 0, -7);
        ctx.bezierCurveTo(2, -12, 9, -11, 9, -5);
        ctx.bezierCurveTo(9, -1, 2, 4, 0, 6);
        ctx.closePath();
        ctx.fillStyle = hitFlash ? "#fff0b5" : "#ffad24";
        ctx.strokeStyle = hitFlash ? "#fffaf0" : "#e87516";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    function draw() {
        if (!active || !overlayCtx || !overlay) return;
        placeOverlay();
        var c = overlayCtx;
        var time = now();
        var liveCtx = trainingBossContext || context();
        var heartSize = playerHeartSize(liveCtx);
        c.clearRect(0,0,400,500);
        for (var i=0;i<agents.length;i++) {
            var p=agents[i];
            if (p.alive) drawAgent(c, p, time, heartSize);
        }
        // Keep the real player's GER visible as a separate, full-size companion.
        if (typeof window.MBDrawGoldExperience === "function") {
            try { window.MBDrawGoldExperience(c); } catch (e) {}
        }
    }
    function updatePanel(ctx) {
        if (!panel) return;
        var alive=agents.filter(function(agent){return agent.alive;}).length;
        var totalDamage=agents.reduce(function(n,agent){return n+agent.damageDealt;},0);
        var totalTaken=agents.reduce(function(n,agent){return n+agent.damageTaken;},0);
        var totalDecisions=agents.reduce(function(n,agent){return n+agent.decisions;},0);
        var totalDodges=agents.reduce(function(n,agent){return n+agent.dodges;},0);
        var totalFailed=agents.reduce(function(n,agent){return n+agent.failedDodges;},0);
        var totalPosition=agents.reduce(function(n,agent){return n+(Number(agent.positionScore)||0);},0);
        var sorted=agents.slice().sort(function(a,b){return b.score-a.score;});
        var summary=panel.querySelector("#mbGERSwarmSummary");
        var leaders=panel.querySelector("#mbGERSwarmLeaders");
        if(summary) summary.textContent="Стенды: "+alive+"/"+COUNT+" живы · Цель атак: "+(trainingTargetAgentId?"GER-"+String(trainingTargetAgentId).padStart(2,"0"):"—")+" · Позиционные очки: "+Math.floor(totalPosition)+" · Решения: "+totalDecisions+" · Уклонения: "+totalDodges+" · Попадания по стендам: "+totalFailed+" · Урон боссу: "+Math.floor(totalDamage)+" · Получено: "+Math.floor(totalTaken);
        if(leaders) leaders.innerHTML=sorted.slice(0,5).map(function(c){return "<div style='display:flex;justify-content:space-between;gap:8px'><span>GER-"+String(c.id).padStart(2,"0")+" · "+(c.alive?"жив":"выбыл")+"</span><b>"+Math.floor(c.score)+" оч.</b></div>";}).join("");
    }
    function finishScores(reason) {
        if (ended) return;
        ended = true;
        var survivors = agents.filter(function (agent) { return agent.alive; });
        var completed = reason === "boss_defeated" || reason === "win";
        // Positioning adds small continuous bonuses/penalties; boss damage remains the main objective.

        // Resolve unfinished decisions as unknown for traceability, not as successful dodges.
        var finishCtx = context();
        var finishBoss = finishCtx ? bossTarget(finishCtx) : {x:200,y:130};
        agents.forEach(function (agent) {
            if (agent.pendingDodge) {
                reportAgentOutcome(agent, agent.pendingDodge, "unknown", 0,
                    finishBoss, [], [], finishCtx);
                agent.pendingDodge = null;
            }
        });

        var totalHits = agents.reduce(function (n, agent) { return n + agent.hits; }, 0);
        var totalDodges = agents.reduce(function (n, agent) { return n + agent.dodges; }, 0);
        var totalDecisions = agents.reduce(function (n, agent) { return n + agent.decisions; }, 0);
        var totalFailedDodges = agents.reduce(function (n, agent) { return n + agent.failedDodges; }, 0);
        var totalDamage = agents.reduce(function (n, agent) { return n + agent.damageDealt; }, 0);
        var totalTaken = agents.reduce(function (n, agent) { return n + agent.damageTaken; }, 0);
        agents.sort(function (a, b) { return b.score - a.score; });
        var top = agents.slice(0, 10).map(function (agent) {
            return "GER-" + String(agent.id).padStart(2, "0") + ": " +
                Math.floor(agent.score) + " оч. (урон " + Math.floor(agent.damageDealt) +
                ", получено " + Math.floor(agent.damageTaken) + ", " +
                (agent.alive ? "выжил" : "выбыл") + ")";
        });
        console.log("[GER PARALLEL PRIMARY AGENTS]", reason, {
            survivors: survivors.length, totalDecisions: totalDecisions,
            totalHits: totalHits, totalDodges: totalDodges,
            totalFailedDodges: totalFailedDodges, totalDamage: Math.floor(totalDamage),
            totalDamageTaken: Math.floor(totalTaken), agents: agents, top: top
        });

        if (panel) {
            var summary = panel.querySelector("#mbGERSwarmSummary");
            var leaders = panel.querySelector("#mbGERSwarmLeaders");
            if (summary) summary.textContent = "ИТОГ · Живы " + survivors.length + "/" + COUNT +
                " · Решения: " + totalDecisions + " · Уклонения: " + totalDodges +
                " · Попадания: " + totalFailedDodges + " · Урон боссу: " +
                Math.floor(totalDamage) + " · Получено: " + Math.floor(totalTaken);
            if (leaders) leaders.innerHTML = top.map(function (line) {
                return "<div>" + line + "</div>";
            }).join("");
        }

        var resultRows = agents.map(function (agent) {
            return {
                id: agent.id,
                score: Math.floor(agent.score),
                damageDealt: Math.floor(agent.damageDealt),
                damageTaken: Math.floor(agent.damageTaken),
                hits: agent.hits,
                dodges: agent.dodges,
                decisions: agent.decisions,
                failedDodges: agent.failedDodges,
                alive: agent.alive,
                x: Number(agent.x.toFixed(2)),
                y: Number(agent.y.toFixed(2)),
                velocityX: Number(agent.vx.toFixed(3)),
                velocityY: Number(agent.vy.toFixed(3)),
                targetX: Number(agent.tx.toFixed(2)),
                targetY: Number(agent.ty.toFixed(2)),
                hp: agent.hp,
                maxHp: agent.maxHp,
                personality: {
                    aggression: Number(agent.aggression.toFixed(3)),
                    riskTolerance: Number(agent.riskTolerance.toFixed(3)),
                    preferredRange: Math.round(agent.preferredRange),
                    movementSpeed: Number(agent.movementSpeed.toFixed(3))
                }
            };
        });
        damageLeaderboard = {
            poolType: "parallel_primary_stands",
            agentRole: "primary_stand",
            agentCount: COUNT,
            reason: reason,
            completed: completed,
            survivors: survivors.length,
            totalHits: totalHits,
            totalDodges: totalDodges,
            totalDecisions: totalDecisions,
            totalFailedDodges: totalFailedDodges,
            totalDamage: Math.floor(totalDamage),
            totalDamageTaken: Math.floor(totalTaken),
            results: resultRows
        };
        window.__mbGERTrainingSwarmResults = damageLeaderboard;
        window.__mbGERTrainingParallelAgentsResults = damageLeaderboard;

        var trainingApi = window.MBGERTraining;
        if (trainingApi && typeof trainingApi.saveAgentResults === "function") {
            window.__mbGERTrainingSwarmSavePromise = Promise.resolve(trainingSessionPromise)
                .catch(function () { return null; })
                .then(function () { return trainingApi.saveAgentResults(damageLeaderboard); })
                .then(function (response) {
                    console.info("[GER TRAINING] Persisted", response && response.savedAgents,
                        "primary-agent result rows with the learning session.");
                    return response;
                })
                .catch(function (error) {
                    console.warn("[GER TRAINING] Agent results could not be saved yet:",
                        error && error.message ? error.message : error);
                    throw error;
                });
        }
    }
    function tick(ts) {
        raf = 0;
        if (!active) return;
        var t = Number(ts) || now();
        if (!lastAt) lastAt = t;
        var elapsed = t - lastAt;
        // Keep simulation independent from visible rendering. fps-fix.js switches its RAF
        // scheduler to a background timer when the tab is hidden.
        if (elapsed >= 50) {
            update(clamp(elapsed, 1, 1000));
            lastAt = t;
        }
        if (!document.hidden) draw();
        raf = window.requestAnimationFrame(tick);
    }
    function selectTrainingAttackTarget(time) {
        time = Number(time) || now();
        var current = null;
        if (trainingTargetAgentId !== null && time < trainingTargetHoldUntil) {
            for (var currentIndex = 0; currentIndex < agents.length; currentIndex++) {
                if (agents[currentIndex].id === trainingTargetAgentId) {
                    current = agents[currentIndex];
                    break;
                }
            }
            if (current && current.alive && current.hp > 0 &&
                current.y >= 80 && current.y <= 480) return current;
        }

        // Rotate the native boss target through the live agents. The short lock
        // keeps a single aimed volley consistent instead of making it chase a
        // different stand every frame.
        for (var step = 0; step < agents.length; step++) {
            trainingTargetAgentIndex = (trainingTargetAgentIndex + 1) % agents.length;
            var candidate = agents[trainingTargetAgentIndex];
            if (!candidate || !candidate.alive || !(candidate.hp > 0)) continue;
            if (candidate.x < 16 || candidate.x > 384 || candidate.y < 80 || candidate.y > 480) continue;
            trainingTargetAgentId = candidate.id;
            trainingTargetHoldUntil = time + TRAINING_TARGET_HOLD_MS;
            window.__mbGERTrainingTargetAgentId = candidate.id;
            return candidate;
        }

        // If every live agent is temporarily outside the normal player bounds,
        // still point attacks at a living stand using the boss' own coordinate limits.
        for (var fallbackIndex = 0; fallbackIndex < agents.length; fallbackIndex++) {
            trainingTargetAgentIndex = (trainingTargetAgentIndex + 1) % agents.length;
            var fallback = agents[trainingTargetAgentIndex];
            if (!fallback || !fallback.alive || !(fallback.hp > 0)) continue;
            trainingTargetAgentId = fallback.id;
            trainingTargetHoldUntil = time + TRAINING_TARGET_HOLD_MS;
            window.__mbGERTrainingTargetAgentId = fallback.id;
            return fallback;
        }
        trainingTargetAgentId = null;
        window.__mbGERTrainingTargetAgentId = null;
        return null;
    }

    function skipOpeningMoments() {
        if (!active || !window.__mbGERTrainingMode) return;
        try {
            var ctx = context();
            if (ctx && typeof ctx.getPlayerMaxHp === "function" && typeof ctx.setPlayerHp === "function") {
                ctx.setPlayerHp(ctx.getPlayerMaxHp());
                // The native player object is now a target proxy for the swarm.
                // All boss attacks that aim at the player are aimed at this live stand.
                var targetAgent = selectTrainingAttackTarget(now());
                if (targetAgent) {
                    if (typeof ctx.setHeartX === "function") ctx.setHeartX(clamp(targetAgent.x, 16, 384));
                    if (typeof ctx.setHeartY === "function") ctx.setHeartY(clamp(targetAgent.y, 80, 480));
                }
            }
            var wave = Number(window.__mbBossTestMode && window.__mbBossTestMode.bossWave);
            // Keep the real player's collision/invulnerability timers out of the
            // training sample. The 100 simulated hearts receive the native attacks.
            if (wave===200 && typeof livingStoneInvulnTimer !== "undefined") livingStoneInvulnTimer = 999999;
            if (wave===500 && typeof waystarInvulnTimer !== "undefined") waystarInvulnTimer = 999999;
            if (wave===1000 && typeof window.getRWBPlayer === "function") {
                var rwbTrainingPlayer = window.getRWBPlayer();
                if (rwbTrainingPlayer) rwbTrainingPlayer.invulnTimer = 999999;
            }
            if (wave===1500 && typeof window.getAntiSpiralBossPlayer === "function") {
                var antiTrainingPlayer = window.getAntiSpiralBossPlayer();
                if (antiTrainingPlayer) antiTrainingPlayer.invuln = 999999;
            }
            if (wave===2000 && typeof livingStoneInvulnTimer !== "undefined") livingStoneInvulnTimer = 999999;
            if (wave===200 && typeof window.MBGERTrainingTickLivingStone==="function") window.MBGERTrainingTickLivingStone();
            if (wave===500 && typeof window.MBGERTrainingSkipWaystarScenes==="function") window.MBGERTrainingSkipWaystarScenes();
            if (wave===1000 && typeof window.MBGERTrainingSkipRWBScenes==="function") window.MBGERTrainingSkipRWBScenes();
            if (wave===2000 && window.__mbLS2TrainingSkipIntro) window.__mbLS2TrainingSkipIntro();
            if (wave===2000 && window.MBIsLivingStoneChaseActive && window.MBIsLivingStoneChaseActive() &&
                typeof window.MBSkipLivingStoneChase==="function") window.MBSkipLivingStoneChase();
        } catch(e) {}
    }
    function start() {
        if (active) return;
        active = true;
        ended = false;
        lastAt = 0;
        lastOverlayLayoutAt = 0;
        lastUiAt = 0;
        zeroHpSince = 0;
        trainingDecisionOrder = 0;
        updateBatch = 0;
        trainingTargetAgentIndex = -1;
        trainingTargetAgentId = null;
        trainingTargetHoldUntil = 0;
        window.__mbGERTrainingTargetAgentId = null;
        lastAgentCheckpointAt = now();
        window.__mbGERTrainingSwarmActive = true;
        installTrainingCollisionIsolation();
        window.__mbGERTrainingSwarmSavePromise = null;

        var ctx = context();
        var bossKey = normalizeTrainingKey(window.__mbGERTrainingBossKey || (ctx && ctx.type) || "unknown", "unknown").slice(0, 64);
        trainingBossKey = bossKey;
        window.__mbGERTrainingBossKey = bossKey;
        var trainingApi = window.MBGERTraining;
        if (trainingApi && typeof trainingApi.start === "function") {
            trainingSessionPromise = trainingApi.start(bossKey, {
                arenaMode: ctx && ctx.type ? ctx.type : "unknown",
                gameVersion: "ger-dodge-training-13",
                trainingMode: true,
                trainingProfile: "parallel_primary_stands",
                agentRole: "primary_stand",
                agentCount: COUNT
            }).then(function (result) {
                if (typeof trainingApi.getTrainingSkill === "function") {
                    var learnedSkill = Math.max(0.62, Math.min(0.88, trainingApi.getTrainingSkill(bossKey)));
                    agents.forEach(function (agent) { agent.aiSkill = learnedSkill; });
                }
                if (typeof trainingApi.annotateSession === "function") {
                    return trainingApi.annotateSession({
                        trainingPool: "parallel_primary_stands",
                        agentRole: "primary_stand",
                        agentCount: COUNT,
                        trainingProfileVersion: "ger-parallel-v2-100"
                    }).then(function () { return result; });
                }
                return result;
            }).catch(function (error) {
                console.warn("[GER TRAINING] Could not start persistent 100-agent session:",
                    error && error.message ? error.message : error);
                throw error;
            });
            window.__mbGERTrainingSwarmStartPromise = trainingSessionPromise;
        } else {
            trainingSessionPromise = Promise.resolve(null);
            console.warn("[GER TRAINING] Persistent learning client is unavailable.");
        }

        agents = [];
        for (var i = 0; i < COUNT; i++) agents.push(createAgent(i));
        makeOverlay();
        makePanel();
        lockPlayerInput();
        lastBossHp = null;
        if (!window.__mbGERTrainingIsolationTimer) {
            window.__mbGERTrainingIsolationTimer = window.setInterval(skipOpeningMoments, 80);
        }
        raf = window.requestAnimationFrame(tick);
        console.info("[GER TRAINING] Started 100 independent primary GER agents. Player input and player damage are disabled.");
    }
    function restoreTrainingPlayerProtection() {
        // These timers are temporarily raised so the parked human heart cannot
        // consume boss attacks before the 100 simulated agents see them.
        try { if (typeof livingStoneInvulnTimer !== "undefined") livingStoneInvulnTimer = 0; } catch (e) {}
        try { if (typeof waystarInvulnTimer !== "undefined") waystarInvulnTimer = 0; } catch (e) {}
        try {
            var rwbPlayer = typeof window.getRWBPlayer === "function" ? window.getRWBPlayer() : null;
            if (rwbPlayer) rwbPlayer.invulnTimer = 0;
        } catch (e) {}
        try {
            var antiPlayer = typeof window.getAntiSpiralBossPlayer === "function" ? window.getAntiSpiralBossPlayer() : null;
            if (antiPlayer) antiPlayer.invuln = 0;
        } catch (e) {}
        window.__mbGERTrainingWaystarDashHazard = null;
    }
    function stop(reason) {
        if(!active)return;
        active=false;
        window.__mbGERTrainingSwarmActive = false;
        trainingTargetAgentId = null;
        window.__mbGERTrainingTargetAgentId = null;
        restoreTrainingPlayerProtection();
        unlockPlayerInput();
        if(raf)window.cancelAnimationFrame(raf);
        raf=0;lastAt=0;
        if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);
        if(panel) {
            panel.style.position = "fixed";
            panel.style.top = "calc(12px + env(safe-area-inset-top))";
            panel.style.left = "12px";
            panel.style.pointerEvents = "auto";
        }
        overlay=null;overlayCtx=null;
        if(reason!=="boss_defeated"&&!ended)finishScores(reason||"stopped");
        console.info("[GER TRAINING] Primary-agent pool stopped:",reason||"stopped");
    }

    function teacherIsTelegraph(attack) {
        if (!attack) return false;
        var type = String(attack.type || attack.kind || "").toLowerCase();
        return attack.state === "warning" || attack.state === "windup" ||
            Number(attack.warningTimer) > 0 || Number(attack.warning) > 0 ||
            type.indexOf("warning") !== -1 || type.indexOf("telegraph") !== -1;
    }
    function teacherThreatFrames(attack, x, y) {
        if (!attack || attack.dioAggroNoPlayer || attack._mbGEIgnored || attack.state === "done") return null;
        if (teacherIsTelegraph(attack)) return 0;
        var frames = [0, 8, 16, 28, 42, 60, 82, 108];
        for (var i = 0; i < frames.length; i++) {
            if (getThreat(attack, x, y, frames[i], true)) return frames[i];
        }
        return null;
    }
    function teacherContextFeatures(startX, startY, velocityX, velocityY, boss, attacks, waves) {
        var snapshot = {
            x: startX, y: startY, vx: velocityX, vy: velocityY,
            id: 0, movementSpeed: 1, aiSkill: 1
        };
        return agentTrainingContext(snapshot, boss, attacks, waves);
    }
    function teacherReport(pending, outcome, damage, ctx, attacks, waves, x, y) {
        var api = window.MBGERTraining;
        if (!pending || !api || typeof api.recordOutcome !== "function") return false;
        var endX = Number.isFinite(Number(x)) ? Number(x) : pending.lastX;
        var endY = Number.isFinite(Number(y)) ? Number(y) : pending.lastY;
        var dx = endX - pending.startX, dy = endY - pending.startY;
        if (Math.hypot(dx, dy) < 2) {
            dx = Number(pending.velocityX) || 0;
            dy = Number(pending.velocityY) || 0;
        }
        var direction = trainingDirection(pending.startX, pending.startY,
            pending.startX + dx, pending.startY + dy);
        var boss = bossTarget(ctx);
        var learnedContext = teacherContextFeatures(
            pending.startX, pending.startY, pending.velocityX, pending.velocityY,
            boss, attacks, waves
        );
        var attack = pending.source || {};
        var rawKey = attack.type || attack.kind || attack.attackType || pending.attackType || pending.kind || "unknown";
        if (attack.attackKind) rawKey += "_" + String(attack.attackKind);
        var ok = api.recordOutcome({
            attackKey: normalizeTrainingKey(rawKey, "unknown"),
            attackFamily: normalizeTrainingKey(attack.attackFamily || rawKey, "unknown").slice(0, 40),
            bossPhase: normalizeTrainingKey(attack.bossPhase || attack.phase ||
                attack.phaseIndex || (ctx && ctx.phase) || (ctx && ctx.type), "unknown").slice(0, 32),
            timeToImpactMs: Math.max(0, Math.round((Number(pending.timeToImpactFrames) || 0) * 16.667)),
            heartX: pending.startX,
            heartY: pending.startY,
            velocityX: Number(pending.velocityX) || 0,
            velocityY: Number(pending.velocityY) || 0,
            chosenDirection: direction,
            targetX: endX,
            targetY: endY,
            features: Object.assign({}, learnedContext, {
                sampleType: "dodge",
                agentRole: "player_teacher",
                decisionOrder: ++teacherDecisionOrder,
                movementDistance: Math.round(Math.hypot(endX - pending.startX, endY - pending.startY)),
                teacherControlled: true,
                threatKind: pending.kind || "attack"
            })
        }, outcome, Math.max(0, Number(damage) || 0));
        if (ok) teacherRecorded++;
        return ok;
    }
    function teacherUiTarget(target) {
        return !!(target && target.closest &&
            (target.closest("#mbGERPlayerTeacherControls") ||
             target.closest("#bossTestExitFightBtn") ||
             target.closest("#gerTrainingStopBtn")));
    }
    function teacherCanvasPoint(ev) {
        var canvas = document.getElementById("arenaCanvas");
        if (!canvas || !ev) return null;
        var rect = canvas.getBoundingClientRect();
        if (!(rect.width > 0 && rect.height > 0)) return null;
        return {
            x: clamp((Number(ev.clientX) - rect.left) * 400 / rect.width, 0, 400),
            y: clamp((Number(ev.clientY) - rect.top) * 500 / rect.height, 0, 500)
        };
    }
    function preventTeacherEvent(ev) {
        if (!ev) return;
        if (ev.cancelable) ev.preventDefault();
        if (typeof ev.stopPropagation === "function") ev.stopPropagation();
        if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
    }
    function teacherPointerEvent(ev) {
        if (!teacherActive || !ev) return;
        var isUi = teacherUiTarget(ev.target) || allowExit(ev);
        if (ev.type === "pointerup" || ev.type === "pointercancel") {
            var wasActive = teacherPointerActive;
            teacherPointerActive = false;
            if (ev.type === "pointercancel" || isUi) teacherPointerTarget = null;
            if (wasActive && !isUi) preventTeacherEvent(ev);
            return;
        }
        if (isUi) return;
        var canvas = document.getElementById("arenaCanvas");
        if (ev.type === "pointerdown" && ev.target === canvas) {
            teacherPointerActive = true;
            teacherPointerTarget = teacherCanvasPoint(ev);
            preventTeacherEvent(ev);
        } else if (ev.type === "pointermove" && teacherPointerActive) {
            teacherPointerTarget = teacherCanvasPoint(ev) || teacherPointerTarget;
            preventTeacherEvent(ev);
        } else if (ev.type === "click" && ev.target === canvas) {
            preventTeacherEvent(ev);
        }
    }
    function triggerTeacherAttack(kind) {
        var ok = typeof window.MBGERPlayerTeacherAttack === "function" &&
            window.MBGERPlayerTeacherAttack(kind) === true;
        var status = teacherControls && teacherControls.querySelector("#mbGERTeacherAttackStatus");
        if (status) {
            status.textContent = ok
                ? (kind === "muda" ? "MUDA начата" : "Удар выполнен")
                : (kind === "muda" ? "MUDA на перезарядке" : "Подойди ближе или дождись перезарядки");
        }
        return ok;
    }
    function teacherKeyDown(ev) {
        if (!teacherActive || !ev || teacherUiTarget(ev.target) || allowExit(ev)) return;
        if (ev.target && ev.target.closest && ev.target.closest("input,textarea,select")) return;
        var key = String(ev.key || "").toLowerCase();
        var movementKeys = ["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"];
        if (movementKeys.indexOf(key) !== -1) {
            teacherKeys[key] = true;
            preventTeacherEvent(ev);
            return;
        }
        if (key === "z" || key === "x") {
            preventTeacherEvent(ev);
            if (!ev.repeat) triggerTeacherAttack(key === "z" ? "punch" : "muda");
            return;
        }
        if (key === " " || key === "enter") preventTeacherEvent(ev);
    }
    function teacherKeyUp(ev) {
        if (!teacherActive || !ev) return;
        var key = String(ev.key || "").toLowerCase();
        if (Object.prototype.hasOwnProperty.call(teacherKeys, key)) {
            teacherKeys[key] = false;
            preventTeacherEvent(ev);
        }
    }
    function installTeacherInput() {
        if (teacherInputHandlers.length) return;
        var handlers = [
            ["pointerdown", teacherPointerEvent],
            ["pointermove", teacherPointerEvent],
            ["pointerup", teacherPointerEvent],
            ["pointercancel", teacherPointerEvent],
            ["click", teacherPointerEvent],
            ["keydown", teacherKeyDown],
            ["keyup", teacherKeyUp]
        ];
        handlers.forEach(function (pair) {
            window.addEventListener(pair[0], pair[1], { capture: true, passive: false });
            teacherInputHandlers.push(pair);
        });
    }
    function removeTeacherInput() {
        teacherInputHandlers.forEach(function (pair) {
            window.removeEventListener(pair[0], pair[1], true);
        });
        teacherInputHandlers = [];
        teacherKeys = Object.create(null);
        teacherPointerActive = false;
        teacherPointerTarget = null;
    }
    function createTeacherControls() {
        if (teacherControls && teacherControls.parentNode) teacherControls.parentNode.removeChild(teacherControls);
        teacherControls = document.createElement("div");
        teacherControls.id = "mbGERPlayerTeacherControls";
        teacherControls.style.cssText = "position:fixed;z-index:100040;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:9px;max-width:calc(100vw - 20px);padding:9px 10px;border:1px solid rgba(255,214,112,.75);border-radius:14px;background:rgba(8,12,20,.95);box-shadow:0 8px 26px rgba(0,0,0,.42);pointer-events:auto;touch-action:manipulation;";
        function addAttackButton(label, kind, accent) {
            var button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.style.cssText = "min-width:108px;min-height:42px;padding:9px 14px;border:1px solid " + accent + ";border-radius:10px;background:rgba(30,34,43,.98);color:#fff3cb;font:900 12px Arial,sans-serif;cursor:pointer;touch-action:manipulation;";
            button.addEventListener("click", function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                triggerTeacherAttack(kind);
            });
            teacherControls.appendChild(button);
        }
        addAttackButton("УДАР · Z", "punch", "rgba(255,211,111,.8)");
        addAttackButton("MUDA · X", "muda", "rgba(255,154,74,.8)");
        var status = document.createElement("div");
        status.id = "mbGERTeacherAttackStatus";
        status.textContent = "WASD/стрелки или веди GER по арене";
        status.style.cssText = "max-width:190px;color:#c8d6e7;font:700 10px/1.35 Arial,sans-serif;text-align:center;";
        teacherControls.appendChild(status);
        document.body.appendChild(teacherControls);
    }
    function driveTeacherGER(ctx, dt) {
        if (!ctx || typeof ctx.setHeartX !== "function" || typeof ctx.setHeartY !== "function") return;
        var x = Number(ctx.getHeartX());
        var y = Number(ctx.getHeartY());
        if (!Number.isFinite(x)) x = 200;
        if (!Number.isFinite(y)) y = 400;
        var mx = (teacherKeys.d || teacherKeys.arrowright ? 1 : 0) -
            (teacherKeys.a || teacherKeys.arrowleft ? 1 : 0);
        var my = (teacherKeys.s || teacherKeys.arrowdown ? 1 : 0) -
            (teacherKeys.w || teacherKeys.arrowup ? 1 : 0);
        var dx = 0, dy = 0;
        if (mx || my) {
            teacherPointerTarget = null;
            var length = Math.hypot(mx, my) || 1;
            var speedMultiplier = clamp(Number(window.__mbGERTrainingOptions &&
                window.__mbGERTrainingOptions.speedMultiplier) || 2, 1, 5);
            var baseSpeed = Number(ctx.getHeartSpeed && ctx.getHeartSpeed()) || 4;
            var speed = clamp(baseSpeed * (0.8 + speedMultiplier * 0.16), 2.5, 10);
            dx = mx / length * speed * (dt / 16.667);
            dy = my / length * speed * (dt / 16.667);
        } else if (teacherPointerTarget) {
            var tx = teacherPointerTarget.x - x;
            var ty = teacherPointerTarget.y - y;
            var distance = Math.hypot(tx, ty);
            if (distance > 4) {
                var pointerMultiplier = clamp(Number(window.__mbGERTrainingOptions &&
                    window.__mbGERTrainingOptions.speedMultiplier) || 2, 1, 5);
                var pointerBaseSpeed = Number(ctx.getHeartSpeed && ctx.getHeartSpeed()) || 4;
                var pointerSpeed = clamp(pointerBaseSpeed * (0.8 + pointerMultiplier * 0.16), 2.5, 10);
                var step = Math.min(distance, pointerSpeed * (dt / 16.667));
                dx = tx / distance * step;
                dy = ty / distance * step;
            } else {
                teacherPointerTarget = null;
            }
        }
        if (!dx && !dy) return;
        var minX = 16, maxX = 384, minY = 80, maxY = 484;
        if (ctx.type === "stoneSuper") { minX = 8; maxX = 392; minY = 8; maxY = 492; }
        else if (ctx.type === "rwb") { minY = 0; maxY = 484; }
        else if (ctx.type === "antispiral") { minX = 14; maxX = 386; minY = 65; maxY = 486; }
        var nextX = clamp(x + dx, minX, maxX);
        var nextY = clamp(y + dy, minY, maxY);
        ctx.setHeartX(nextX);
        ctx.setHeartY(nextY);
        if (typeof ctx.clampHeart === "function") {
            try { ctx.clampHeart(); } catch (_error) {}
        }
    }
    function renderTeacherGER(ctx) {
        if (!overlay || !overlayCtx) makeOverlay();
        if (!overlay || !overlayCtx) return;
        placeOverlay();
        overlayCtx.clearRect(0, 0, 400, 500);
        if (typeof window.MBGERPlayerTeacherSyncPosition === "function") {
            window.MBGERPlayerTeacherSyncPosition(ctx);
        }
        if (typeof window.MBDrawGoldExperience === "function") {
            try { window.MBDrawGoldExperience(overlayCtx); } catch (error) {
                console.warn("[GER PLAYER TEACHER] GER render failed:", error);
            }
        }
    }
    function makeTeacherPanel() {
        if (teacherPanel && teacherPanel.parentNode) teacherPanel.parentNode.removeChild(teacherPanel);
        teacherPanel = document.createElement("div");
        teacherPanel.id = "mbGERPlayerTeacherPanel";
        teacherPanel.style.cssText = "position:fixed;z-index:100030;top:calc(12px + env(safe-area-inset-top));left:12px;max-width:min(300px,calc(100vw - 24px));padding:10px 12px;border:1px solid rgba(105,205,255,.65);border-radius:12px;background:rgba(7,17,29,.92);color:#e8f6ff;font:700 12px/1.45 Arial,sans-serif;white-space:pre-line;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35);";
        teacherPanel.textContent = "ЭТАП 1/2 · УПРАВЛЯЙ GER\nWASD/стрелки или веди стенд мышью/касанием.\nZ — удар · X — MUDA. Обычная стрельба отключена.";
        document.body.appendChild(teacherPanel);
    }
    function stopPlayerTeacher(reason) {
        if (!teacherActive) return Promise.resolve(true);
        teacherActive = false;
        window.__mbGERTrainingPlayerTeacherActive = false;
        removeTeacherInput();
        if (teacherRaf) window.cancelAnimationFrame(teacherRaf);
        teacherRaf = 0;
        // A boss victory callback can disable the native fight just before this
        // function runs. Use the last valid context captured during the fight.
        var ctx = context() || trainingBossContext;
        var attacks = ctx ? collectTrainingAttacks(ctx) : [];
        var waves = [];
        try { waves = ctx && ctx.getShockwaves ? ctx.getShockwaves() || [] : []; } catch (e) {}
        teacherPending.forEach(function (pending) {
            try {
                teacherReport(pending, "unknown", 0, ctx, attacks, waves,
                    pending.lastX, pending.lastY);
            } catch (reportError) {
                // A missing/stale boss context must never prevent the 100-agent stage.
                console.warn("[GER PLAYER TEACHER] Could not finalize one pending sample:", reportError);
            }
        });
        teacherPending = [];
        if (teacherPanel && teacherPanel.parentNode) teacherPanel.parentNode.removeChild(teacherPanel);
        teacherPanel = null;
        if (teacherControls && teacherControls.parentNode) teacherControls.parentNode.removeChild(teacherControls);
        teacherControls = null;
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
        overlayCtx = null;
        var flushPromise = Promise.resolve(true);
        try {
            var api = window.MBGERTraining;
            if (api && typeof api.flush === "function") {
                flushPromise = Promise.resolve(api.flush()).then(function (flushed) {
                    if (reason === "player_won" || typeof api.finish !== "function") return flushed;
                    return Promise.resolve(api.finish(
                        reason === "loss" || reason === "win" ? reason : "aborted"
                    )).then(function (finished) { return flushed === true && finished === true; });
                });
            }
        } catch (e) { flushPromise = Promise.reject(e); }
        console.info("[GER PLAYER TEACHER] Stopped:", reason || "stopped",
            "recorded decisions:", teacherRecorded);
        return flushPromise;
    }
    function playerTeacherTick(ts) {
        teacherRaf = 0;
        if (!teacherActive) return;
        var time = Number(ts) || now();
        if (!teacherLastAt) teacherLastAt = time;
        var dt = Math.max(16.667, Math.min(250, time - teacherLastAt));
        teacherLastAt = time;
        var ctx = context();
        if (ctx && typeof ctx.getHeartX === "function" && typeof ctx.getHeartY === "function") {
            trainingBossContext = ctx;
            driveTeacherGER(ctx, dt);
            renderTeacherGER(ctx);
            var x = Number(ctx.getHeartX()) || 0;
            var y = Number(ctx.getHeartY()) || 0;
            var hp = Number(ctx.getPlayerHp && ctx.getPlayerHp());
            var attacks = collectTrainingAttacks(ctx);
            var waves = [];
            try { waves = ctx.getShockwaves ? ctx.getShockwaves() || [] : []; } catch (e) {}
            var vx = teacherLastX === null ? 0 : (x - teacherLastX) / (dt / 16.667);
            var vy = teacherLastY === null ? 0 : (y - teacherLastY) / (dt / 16.667);

            // A fall in the real player HP marks the closest pending attack as a hit.
            if (Number.isFinite(hp) && Number.isFinite(teacherLastHp) && hp < teacherLastHp - 0.5 && teacherPending.length) {
                var hitIndex = 0, hitDistance = Infinity;
                for (var hi = 0; hi < teacherPending.length; hi++) {
                    var hd = Math.hypot(x - teacherPending[hi].lastX, y - teacherPending[hi].lastY);
                    if (hd < hitDistance) { hitDistance = hd; hitIndex = hi; }
                }
                var hit = teacherPending.splice(hitIndex, 1)[0];
                teacherReport(hit, "hit", teacherLastHp - hp, ctx, attacks, waves, x, y);
            }
            teacherLastHp = Number.isFinite(hp) ? hp : teacherLastHp;

            // Resolve prior observations only after the real hazard has passed or disappeared.
            for (var pi = teacherPending.length - 1; pi >= 0; pi--) {
                var pending = teacherPending[pi];
                pending.lastX = x; pending.lastY = y;
                var list = pending.kind === "shockwave" ? waves : attacks;
                var present = list.indexOf(pending.source) !== -1;
                var stillDangerous = false;
                if (present) {
                    stillDangerous = pending.kind === "shockwave"
                        ? !!waveThreatAt(pending.source, x, y, 0, false)
                        : !!getThreat(pending.source, x, y, 0, false) || teacherIsTelegraph(pending.source);
                }
                var minResolveMs = Math.max(300,
                    (Number(pending.timeToImpactFrames) || 0) * 16.667 + 260);
                var age = time - pending.startedAt;
                if (!present || (!stillDangerous && age >= minResolveMs)) {
                    teacherReport(pending, "evaded", 0, ctx, attacks, waves, x, y);
                    teacherPending.splice(pi, 1);
                } else if (age > 6500) {
                    teacherReport(pending, "unknown", 0, ctx, attacks, waves, x, y);
                    teacherPending.splice(pi, 1);
                }
            }

            // Begin a record when a real damaging attack is telegraphed or its trajectory
            // is predicted to intersect the player's current position.
            for (var ai = 0; ai < attacks.length && teacherPending.length < 24; ai++) {
                var attack = attacks[ai];
                if (!attack || teacherPending.some(function (p) { return p.source === attack; })) continue;
                var frames = teacherThreatFrames(attack, x, y);
                if (frames === null) continue;
                teacherPending.push({
                    source: attack, kind: "attack", attackType: attack.type || attack.kind || "unknown",
                    startedAt: time, timeToImpactFrames: frames,
                    startX: x, startY: y, velocityX: vx, velocityY: vy,
                    lastX: x, lastY: y
                });
            }
            for (var wi = 0; wi < waves.length && teacherPending.length < 24; wi++) {
                var shockwave = waves[wi];
                if (!shockwave || teacherPending.some(function (p) { return p.source === shockwave; })) continue;
                var waveFrames = null;
                [0, 8, 16, 28, 42, 60, 82, 108].some(function (frames) {
                    if (waveThreatAt(shockwave, x, y, frames, true)) {
                        waveFrames = frames;
                        return true;
                    }
                    return false;
                });
                if (waveFrames !== null) {
                    teacherPending.push({
                        source: shockwave, kind: "shockwave", attackType: "shockwave",
                        startedAt: time, timeToImpactFrames: waveFrames,
                        startX: x, startY: y, velocityX: vx, velocityY: vy,
                        lastX: x, lastY: y
                    });
                }
            }

            if (teacherPanel && time - (teacherPanel._mbLastUpdate || 0) > 300) {
                teacherPanel._mbLastUpdate = time;
                teacherPanel.textContent = "ЭТАП 1/2 · УПРАВЛЯЙ GER\nЗаписано реакций: " +
                    teacherRecorded + " · ожидают результата: " + teacherPending.length +
                    "\nWASD/стрелки или мышь/касание · Z — удар · X — MUDA.";
            }
            teacherLastX = x;
            teacherLastY = y;

            // Some bosses (notably the Roger/Whitebeard encounter) complete through
            // phase transitions rather than calling the test completion hook directly.
            var bossHp = currentBossHp(ctx);
            if (bossHp <= 0) {
                if (!teacherLastBossZeroAt) teacherLastBossZeroAt = time;
                if (time - teacherLastBossZeroAt >= 5000 &&
                    window.__mbBossTestMode && window.__mbBossTestMode.phase === "player" &&
                    typeof window.MBBossTestFinish === "function") {
                    window.MBBossTestFinish("win", false);
                    return;
                }
            } else {
                teacherLastBossZeroAt = 0;
            }
        }
        teacherRaf = window.requestAnimationFrame(playerTeacherTick);
    }
    function startPlayerTeacher() {
        if (teacherActive) return true;
        if (active) return false;
        teacherActive = true;
        teacherRaf = 0;
        teacherLastAt = 0;
        teacherLastX = null;
        teacherLastY = null;
        teacherLastHp = null;
        teacherLastBossZeroAt = 0;
        teacherPending = [];
        teacherDecisionOrder = 0;
        teacherRecorded = 0;
        var ctx = context();
        trainingBossContext = ctx || null;
        if (ctx) {
            try { teacherLastX = Number(ctx.getHeartX()); } catch (e) {}
            try { teacherLastY = Number(ctx.getHeartY()); } catch (e) {}
            try { teacherLastHp = Number(ctx.getPlayerHp()); } catch (e) {}
        }
        window.__mbGERTrainingPlayerTeacherActive = true;
        makeOverlay();
        placeOverlay(true);
        makeTeacherPanel();
        createTeacherControls();
        installTeacherInput();
        try {
            var api = window.MBGERTraining;
            if (api && typeof api.annotateSession === "function") {
                api.annotateSession({
                    teacherStage: "player_controlled",
                    teacherRole: "human_player",
                    imitationAgentCount: COUNT
                });
            }
        } catch (e) {}
        teacherRaf = window.requestAnimationFrame(playerTeacherTick);
        console.info("[GER PLAYER TEACHER] Recording real player movement and dodge outcomes.");
        return true;
    }

    window.MBGERTrainingSwarmStartPlayerTeacher = startPlayerTeacher;
    window.MBGERTrainingSwarmStopPlayerTeacher = stopPlayerTeacher;
    window.MBGERTrainingSwarmStart=start;
    window.MBGERTrainingSwarmStop=stop;
    window.MBGERTrainingSwarmFinish=finishScores;
})();
