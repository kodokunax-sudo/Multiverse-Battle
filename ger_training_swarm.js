/* GER Training Swarm: 50 lightweight autonomous copies for unique-boss testing. */
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
            aggression: aggression, riskTolerance: clamp(riskTolerance, 0, 1),
            preferredRange: preferredRange, movementSpeed: movementSpeed,
            reactionMs: 75 + Math.random() * 115,
            attackCooldownMs: 720 + Math.random() * 520,
            orbitDirection: i % 2 ? 1 : -1,
            pendingDodge: null,
            nextAttackAt: now() + Math.random() * 900, nextDecisionAt: 0,
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
    function placeOverlay() {
        var canvas = document.getElementById("arenaCanvas");
        if (!canvas || !overlay) return;
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
        for (var k = 0; k < 12; k++) {
            var a = k * Math.PI / 6 + c.phase + c.orbitDirection * (c.id % 3) * 0.09;
            var d = c.preferredRange + ((k % 3) - 1) * 17;
            var x = clamp(boss.x + Math.cos(a) * d, 20, 380);
            var y = clamp(boss.y + Math.sin(a) * d, 20, 480);
            var score = -Math.hypot(x - c.x, y - c.y) * 0.06;
            var riskWeight = 0.75 + (1 - c.riskTolerance) * 1.65;
            if (dangerAt(attacks, waves, x, y, 0)) score -= 140 * riskWeight;
            if (dangerAt(attacks, waves, x, y, 8)) score -= 90 * riskWeight;
            if (dangerAt(attacks, waves, x, y, 18)) score -= 45 * riskWeight;
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
    function trainingDirection(x1, y1, x2, y2) {
        return (Math.round(Math.atan2(y2 - y1, x2 - x1) / (Math.PI / 4)) + 8) % 8;
    }
    function positionBucket(x, y, boss) {
        var dx = x - boss.x, dy = y - boss.y;
        return (dy < -22 ? "above" : (dy > 22 ? "below" : "level")) + "_" +
            (dx < -22 ? "left" : (dx > 22 ? "right" : "center"));
    }
    function hazardBucket(attacks, waves) {
        var count = attacks.length + waves.length;
        return count <= 2 ? "low" : (count <= 6 ? "medium" : "high");
    }
    function wallBucket(x, y) {
        return Math.min(x, 400 - x, y, 500 - y) < 42 ? "near" : "far";
    }
    function reportAgentOutcome(c, pending, outcome, damage, boss, attacks, waves, ctx) {
        var api = window.MBGERTraining;
        if (!api || typeof api.recordOutcome !== "function") return false;
        var attack = pending && pending.source || {};
        var rawKey = attack.type || attack.kind || attack.attackType || (pending && pending.kind) || "unknown";
        if (attack.attackKind) rawKey += "_" + String(attack.attackKind);
        var direction = pending && Number.isFinite(Number(pending.direction))
            ? pending.direction : trainingDirection(c.x, c.y, c.tx, c.ty);
        var startX = pending && Number.isFinite(Number(pending.startX)) ? pending.startX : c.x;
        var startY = pending && Number.isFinite(Number(pending.startY)) ? pending.startY : c.y;
        var targetX = pending && Number.isFinite(Number(pending.targetX)) ? pending.targetX : c.tx;
        var targetY = pending && Number.isFinite(Number(pending.targetY)) ? pending.targetY : c.ty;
        c.decisions++;
        return api.recordOutcome({
            attackKey: normalizeTrainingKey(rawKey, "unknown"),
            attackFamily: normalizeTrainingKey(attack.attackFamily || rawKey, "unknown").slice(0, 40),
            bossPhase: normalizeTrainingKey(attack.bossPhase || attack.phase || (ctx && ctx.type), "unknown").slice(0, 32),
            heartX: startX, heartY: startY,
            velocityX: Number(pending && pending.velocityX) || c.vx,
            velocityY: Number(pending && pending.velocityY) || c.vy,
            chosenDirection: direction,
            targetX: targetX, targetY: targetY,
            features: {
                sampleType: "dodge",
                agentId: c.id,
                agentRole: "primary_stand",
                decisionOrder: ++trainingDecisionOrder,
                positionBucket: positionBucket(startX, startY, boss),
                hazardBucket: hazardBucket(attacks, waves),
                wallBucket: wallBucket(startX, startY),
                threatKind: pending && pending.kind || "attack",
                aggression: Number(c.aggression.toFixed(3)),
                riskTolerance: Number(c.riskTolerance.toFixed(3)),
                preferredRange: Math.round(c.preferredRange),
                movementSpeed: Number(c.movementSpeed.toFixed(3))
            }
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
            startedAt: time,
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

        var incoming = findThreatAt(attacks, waves, c.x + c.vx * 4, c.y + c.vy * 4, 4, true) ||
            findThreatAt(attacks, waves, c.x, c.y, 0, true);
        if (incoming) {
            var safe = chooseTarget(c, boss, attacks, waves);
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
            }
            c.nextDecisionAt = time + c.reactionMs * 0.55;
        }

        var dx = c.tx - c.x, dy = c.ty - c.y;
        var len = Math.hypot(dx,dy) || 1;
        var baseSpeed = Math.min(3.6, Math.max(0.7, len * 0.09));
        var speed = baseSpeed * c.movementSpeed;
        c.vx += (dx / len * speed - c.vx) * 0.18;
        c.vy += (dy / len * speed - c.vy) * 0.18;
        c.x = clamp(c.x + c.vx * frameScale, 12, 388);
        c.y = clamp(c.y + c.vy * frameScale, 12, 488);

        if (c.pendingDodge && time - c.pendingDodge.startedAt >= 150 &&
            !pendingThreatStillActive(c.pendingDodge, c, attacks, waves)) {
            reportAgentOutcome(c, c.pendingDodge, "evaded", 0, boss, attacks, waves, ctx);
            c.dodges++;
            c.score += 3;
            c.pendingDodge = null;
        }

        var actualHit = findThreatAt(attacks, waves, c.x, c.y, 0, false);
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
    var swarmGERImage = null;
    var swarmGERImageReady = false;
    function loadSwarmGERImage() {
        if (swarmGERImage || typeof window.Image !== "function") return;
        swarmGERImage = new Image();
        swarmGERImage.onload = function () { swarmGERImageReady = true; };
        swarmGERImage.onerror = function () { swarmGERImageReady = false; };
        swarmGERImage.src = "Model/голден експириес рквием.jpg";
    }
    function drawAgent(c, p, time) {
        var pulse = 0.94 + Math.sin(time / 185 + p.phase) * 0.035;
        var attacking = p.attackUntil > time;
        var attackProgress = attacking ? 1 - Math.max(0, p.attackUntil - time) / 360 : 0;
        var targetX = Number(p.attackTargetX) || p.x;
        var targetY = Number(p.attackTargetY) || p.y;
        var angle = Math.atan2(targetY - p.y, targetX - p.x);
        var hitFlash = p.flashUntil > time;
        c.save();
        c.globalAlpha = hitFlash ? 1 : pulse;
        c.translate(p.x, p.y + Math.sin(time / 120 + p.phase) * 1.1);
        c.rotate(Math.sin(time / 310 + p.phase) * 0.025 + (attacking ? Math.cos(angle) * 0.08 : 0));
        if (swarmGERImageReady) {
            var iw = swarmGERImage.naturalWidth || swarmGERImage.width;
            var ih = swarmGERImage.naturalHeight || swarmGERImage.height;
            var fit = Math.min(54 / iw, 66 / ih);
            var w = iw * fit, h = ih * fit;
            c.save();
            c.scale(attacking ? 1.04 : 1, attacking ? 0.97 : 1);
            c.shadowColor = hitFlash ? "#ffffff" : "#d6a83e";
            c.shadowBlur = hitFlash ? 14 : 5;
            c.drawImage(swarmGERImage, -w / 2, -h / 2, w, h);
            c.restore();
        } else {
            c.fillStyle = "#e9b83f";
            c.strokeStyle = "#704516";
            c.lineWidth = 2;
            c.beginPath(); c.ellipse(0, 0, 13, 18, 0, 0, Math.PI * 2); c.fill(); c.stroke();
            c.fillStyle = "#76df88";
            c.beginPath(); c.arc(0, -13, 4, 0, Math.PI * 2); c.fill();
        }
        // The original GER's collision radius is max(20, heartSize * 1.3).
        // The swarm uses the same 20px radius, not the old tiny decorative dot.
        c.strokeStyle = "rgba(255,225,120,.28)";
        c.lineWidth = 1;
        c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.stroke();
        if (attacking) {
            var reach = 24 + Math.sin(attackProgress * Math.PI) * 70;
            var fistX = Math.cos(angle) * reach;
            var fistY = Math.sin(angle) * reach;
            c.save();
            c.globalCompositeOperation = "lighter";
            c.globalAlpha = 0.9;
            c.strokeStyle = "#ffe49a";
            c.lineWidth = 8;
            c.lineCap = "round";
            c.shadowColor = "#ffc34d";
            c.shadowBlur = 15;
            c.beginPath(); c.moveTo(7, 1); c.lineTo(fistX, fistY); c.stroke();
            c.fillStyle = "#fff0b0";
            c.beginPath(); c.arc(fistX, fistY, 7, 0, Math.PI * 2); c.fill();
            c.restore();
        }
        c.restore();
        if (p.impactUntil > time) {
            var age = 1 - (p.impactUntil - time) / 260;
            c.save();
            c.globalCompositeOperation = "lighter";
            c.globalAlpha = 1 - age;
            c.strokeStyle = "#fff1a6";
            c.lineWidth = 3;
            c.shadowColor = "#ffbd43";
            c.shadowBlur = 16;
            c.beginPath(); c.arc(p.impactX, p.impactY, 7 + age * 24, 0, Math.PI * 2); c.stroke();
            c.fillStyle = "#fff8d7";
            c.font = "900 11px Arial";
            c.textAlign = "center";
            c.fillText("HIT!", p.impactX, p.impactY - 15 - age * 12);
            c.restore();
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
        raf=0;
        if(!active)return;
        var t=Number(ts)||now();
        var dt=lastAt?clamp(t-lastAt,1,40):16.667;
        lastAt=t;
        update(dt);
        draw();
        raf=window.requestAnimationFrame(tick);
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
        lastUiAt = 0;
        zeroHpSince = 0;
        trainingDecisionOrder = 0;
        window.__mbGERTrainingSwarmActive = true;
        window.__mbGERTrainingSwarmSavePromise = null;
        loadSwarmGERImage();

        var ctx = context();
        var bossKey = normalizeTrainingKey(window.__mbGERTrainingBossKey || (ctx && ctx.type) || "unknown", "unknown").slice(0, 64);
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
        console.info("[GER SWARM] Stopped:",reason||"stopped");
    }
    window.MBGERTrainingSwarmStart=start;
    window.MBGERTrainingSwarmStop=stop;
    window.MBGERTrainingSwarmFinish=finishScores;
})();
