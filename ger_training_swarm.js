/* GER Training Pool: 50 independent primary GER agents learning in parallel. */
(function () {
    "use strict";
    var COUNT = 50;
    var agents = [];
    var active = false;
    var raf = 0;
    var lastAt = 0;
    var lastUiAt = 0;
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

    function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function context() {
        try { return typeof window.getBossContext === "function" ? window.getBossContext() : null; }
        catch (e) { return null; }
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
            vx: 0, vy: 0, tx: 200, ty: 260, hp: 3, maxHp: 3,
            alive: true, score: 0, damageDealt: 0, damageTaken: 0,
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
        panel.innerHTML = '<div style="font-weight:900;font-size:12px;color:#ffe19a">GER TRAINING · 50 ОСНОВНЫХ СТЕНДОВ</div><div style="margin:3px 0 6px;color:#c7d2e2;font-size:10px">Очки: попадание +1 · полученный урон −5 · выживание +150 · лучший урон +120 · максимум полученного урона −120</div><div id="mbGERSwarmSummary">Подготовка арены…</div><div id="mbGERSwarmLeaders" style="margin-top:5px"></div>';
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
    function getThreat(attack, x, y, frames, alert) {
        try {
            if (typeof window.MBGERTrainingThreatAt === "function") return window.MBGERTrainingThreatAt(attack, x, y, frames || 0, alert === true);
        } catch (e) {}
        return null;
    }
    function waveThreatAt(wave, x, y, frames, alert) {
        if (!wave || wave.odenHit || !(Number(wave.damage) > 0)) return null;
        var radius = Math.max(0, Number(wave.radius) || 0) +
            Math.max(0, Number(wave.speed) || 0) * Math.max(0, Number(frames) || 0);
        var cx = Number(wave.x) || 0, cy = Number(wave.y) || 0;
        var distance = Math.hypot(x - cx, y - cy);
        var limit = (Number(wave.width) || 5) * 0.7 + 20 + (alert ? 34 : 0);
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
        // Match the primary GER context buckets so the main brain and the 50-agent
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
        var trainingContext = agentTrainingContext(agent, boss, attacks, waves);
        var best = null, bestScore = -Infinity;

        for (var d = 0; d < distances.length; d++) {
            for (var k = 0; k < 12; k++) {
                var angle = k * Math.PI * 2 / 12;
                var tx = clamp(agent.x + Math.cos(angle) * distances[d], left, right);
                var ty = clamp(agent.y + Math.sin(angle) * distances[d], top, bottom);
                var route = predictAgentRoute(agent, tx, ty, futureTimes);
                var score = 0, collisions = 0;
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
                if (score > bestScore) bestScore = score, best = {x:tx,y:ty,safe:collisions===0};
            }
        }
        return best || {x:clamp(agent.x + (agent.x < 200 ? 100 : -100),left,right),
            y:clamp(agent.y - 55,top,bottom),safe:false};
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
            direction: trainingDirection(c.x, c.y, safe ? safe.x : c.tx, safe ? safe.y : c.ty)
        };
    }
    function bossTarget(ctx) {
        var target = null;
        try {
            if (ctx.type !== "arena" && typeof window.getDioUniqueBossTarget === "function") target = window.getDioUniqueBossTarget(ctx);
        } catch (e) {}
        var p = target || (ctx.getBossPosition && ctx.getBossPosition()) || {x:200,y:130};
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
        var damage = Math.max(1, Math.floor(maxHp * 0.00008));
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
            c.score += 1 + dealt / Math.max(1, maxHp) * 100000;
            c.flashUntil = now() + 120;
            return true;
        }
        return !!ok;
    }
    function updateAgent(c, ctx, boss, attacks, waves, time, frameScale) {
        if (!c.alive) return;
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
            } else {
                c.pendingDodge.targetX = safe.x;
                c.pendingDodge.targetY = safe.y;
                c.pendingDodge.direction = trainingDirection(c.x, c.y, safe.x, safe.y);
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
        c.vx += (desiredVx - c.vx) * steering;
        c.vy += (desiredVy - c.vy) * steering;
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
            c.score += 3;
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
            c.score -= 5;
            c.flashUntil = time + 180;
            if (c.hp <= 0) { c.alive = false; c.score -= 10; }
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
            results: agents.map(function (agent) {
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
        var time = now();
        var boss = bossTarget(ctx);
        var attacks = [];
        var waves = [];
        try { attacks = ctx.getAttacks() || []; } catch (e) {}
        try { waves = ctx.getShockwaves ? ctx.getShockwaves() || [] : []; } catch (e) {}
        var scale = clamp((Number(dt)||16.667)/16.667,0.5,2.2);
        for (var i=0;i<agents.length;i++) updateAgent(agents[i],ctx,boss,attacks,waves,time,scale);
        if (time - lastUiAt > 1000) { updatePanel(ctx); lastUiAt = time; }
        saveAgentCheckpoint(time);
        var hpNow = currentBossHp(ctx);
        if (hpNow > 0) zeroHpSince = 0;
        else {
            if (!zeroHpSince) zeroHpSince = time;
            // Unique bosses can briefly have 0 HP between real phases. Wait for the
            // native transition/next phase before declaring the training complete.
            if (time - zeroHpSince >= 5000) {
                finishScores("boss_defeated");
                if (window.__mbBossTestMode && typeof window.MBBossTestFinish === "function") {
                    window.MBBossTestFinish("win", false);
                }
            }
        }
    }
    function drawAgent(ctx, agent, time) {
        var hitFlash = agent.flashUntil > time;
        var attacking = agent.attackUntil > time;
        var moving = Math.min(1, Math.hypot(agent.vx, agent.vy) / 3.8);
        var step = Math.sin(time * 0.014 + agent.phase) * moving * 2.2;
        var gold = hitFlash ? "#fff4cf" : "#d8ac42";
        var darkGold = hitFlash ? "#fffdf1" : "#76501d";
        var lightGold = hitFlash ? "#ffffff" : "#f4d77d";

        ctx.save();
        ctx.translate(agent.x, agent.y);
        ctx.globalAlpha = agent.alive ? 0.98 : 0.35;

        // Collision radius visual, kept at the same 20px as the stand hitbox.
        ctx.strokeStyle = "rgba(255,225,120,.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Simple humanoid stand silhouette. No downloaded image, filters, or shadows.
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = darkGold;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-3, 7);
        ctx.lineTo(-5 - step, 15);
        ctx.moveTo(3, 7);
        ctx.lineTo(5 + step, 15);
        ctx.moveTo(-6, -6);
        ctx.lineTo(-12 - step * 0.5, 1);
        ctx.moveTo(6, -6);
        ctx.lineTo(12 + step * 0.5, 1);
        ctx.stroke();

        ctx.fillStyle = gold;
        ctx.strokeStyle = darkGold;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(6, -8);
        ctx.lineTo(7, 5);
        ctx.lineTo(4, 9);
        ctx.lineTo(-4, 9);
        ctx.lineTo(-7, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -12, 4.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = lightGold;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-3, -4);
        ctx.lineTo(3, -4);
        ctx.moveTo(-2, 2);
        ctx.lineTo(2, 2);
        ctx.stroke();

        if (attacking) {
            var angle = Math.atan2(
                (Number(agent.attackTargetY) || agent.y) - agent.y,
                (Number(agent.attackTargetX) || agent.x) - agent.x
            );
            ctx.strokeStyle = lightGold;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(7, -5);
            ctx.lineTo(7 + Math.cos(angle) * 14, -5 + Math.sin(angle) * 14);
            ctx.stroke();
        }
        ctx.restore();

        // Tiny impact marker, without bloom, text, or expensive compositing.
        if (agent.impactUntil > time) {
            var age = 1 - (agent.impactUntil - time) / 260;
            ctx.strokeStyle = "rgba(255,235,170," + (1 - age) + ")";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(agent.impactX, agent.impactY, 5 + age * 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    function draw() {
        if (!active || !overlayCtx || !overlay) return;
        placeOverlay();
        var c = overlayCtx;
        var time = now();
        c.clearRect(0,0,400,500);
        for (var i=0;i<agents.length;i++) {
            var p=agents[i];
            if (p.alive) drawAgent(c, p, time);
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
        var sorted=agents.slice().sort(function(a,b){return b.score-a.score;});
        var summary=panel.querySelector("#mbGERSwarmSummary");
        var leaders=panel.querySelector("#mbGERSwarmLeaders");
        if(summary) summary.textContent="Стенды: "+alive+"/"+COUNT+" живы · Решения: "+totalDecisions+" · Уклонения: "+totalDodges+" · Попадания по стендам: "+totalFailed+" · Урон боссу: "+Math.floor(totalDamage)+" · Получено: "+Math.floor(totalTaken);
        if(leaders) leaders.innerHTML=sorted.slice(0,5).map(function(c){return "<div style='display:flex;justify-content:space-between;gap:8px'><span>GER-"+String(c.id).padStart(2,"0")+" · "+(c.alive?"жив":"выбыл")+"</span><b>"+Math.floor(c.score)+" оч.</b></div>";}).join("");
    }
    function finishScores(reason) {
        if (ended) return;
        ended = true;
        var survivors = agents.filter(function (agent) { return agent.alive; });
        var completed = reason === "boss_defeated" || reason === "win";
        if (completed) survivors.forEach(function (agent) { agent.score += 150; });

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
        var damageRank = agents.slice().sort(function (a, b) { return b.damageDealt - a.damageDealt; });
        if (completed && damageRank[0]) damageRank[0].score += 120;
        var takenRank = agents.slice().sort(function (a, b) { return b.damageTaken - a.damageTaken; });
        if (completed && takenRank[0] && takenRank[0].damageTaken > 0) takenRank[0].score -= 120;

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
        // 30Hz simulation; drawing remains on the browser's normal animation cadence.
        if (elapsed >= 33) {
            update(clamp(elapsed, 1, 66));
            lastAt = t;
        }
        draw();
        raf = window.requestAnimationFrame(tick);
    }
    function skipOpeningMoments() {
        if (!active || !window.__mbGERTrainingMode) return;
        try {
            var ctx = context();
            if (ctx && typeof ctx.getPlayerMaxHp === "function" && typeof ctx.setPlayerHp === "function") {
                ctx.setPlayerHp(ctx.getPlayerMaxHp());
                // Keep the human heart parked as a harmless spectator anchor. Bosses
                // still generate their native patterns, but the player cannot fight.
                if (typeof ctx.setHeartX === "function") ctx.setHeartX(200);
                if (typeof ctx.setHeartY === "function") ctx.setHeartY(478);
            }
            var wave = Number(window.__mbBossTestMode && window.__mbBossTestMode.bossWave);
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
        lastAgentCheckpointAt = now();
        window.__mbGERTrainingSwarmActive = true;
        window.__mbGERTrainingSwarmSavePromise = null;

        var ctx = context();
        var bossKey = normalizeTrainingKey(window.__mbGERTrainingBossKey || (ctx && ctx.type) || "unknown", "unknown").slice(0, 64);
        trainingBossKey = bossKey;
        window.__mbGERTrainingBossKey = bossKey;
        var trainingApi = window.MBGERTraining;
        if (trainingApi && typeof trainingApi.start === "function") {
            trainingSessionPromise = trainingApi.start(bossKey, {
                arenaMode: ctx && ctx.type ? ctx.type : "unknown",
                gameVersion: "ger-dodge-training-3",
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
                        trainingProfileVersion: "ger-parallel-v1"
                    }).then(function () { return result; });
                }
                return result;
            }).catch(function (error) {
                console.warn("[GER TRAINING] Could not start persistent 50-agent session:",
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
        console.info("[GER TRAINING] Started 50 independent primary GER agents. Player input and player damage are disabled.");
    }
    function stop(reason) {
        if(!active)return;
        active=false;
        window.__mbGERTrainingSwarmActive = false;
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
    window.MBGERTrainingSwarmStart=start;
    window.MBGERTrainingSwarmStop=stop;
    window.MBGERTrainingSwarmFinish=finishScores;
})();
