// Gold Experience: отдельный NPC-компаньон Джорно и общая логика GER.
(function () {
    "use strict";

    var GE_CARD = "Джорно Джованна (Gold Experience)";
    var GER_CARD = "Джорно Джованна (Gold Experience Requiem)";
    var GE_DURATION = 15000;
    var GE_COOLDOWN = 20000;
    var GER_DURATION = 5000;
    var GER_CHARGES = 2;

    var state = window.__mbGoldExperienceState || {
        active: false,
        activeUntil: 0,
        cooldownUntil: 0,
        x: 200,
        y: 360,
        vx: 0,
        vy: 0,
        nextAttackAt: 0,
        attackUntil: 0,
        combo: null,
        comboCooldownUntil: 0,
        attackFrame: 0,
        nextHealAt: 0,
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

    var rafId = 0;
    var lastFrameAt = 0;
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
        if (!amount || !isGiornoMain()) return;
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

    function attackThreatAt(x, y, attacks) {
        var score = 0;
        for (var i = 0; i < attacks.length; i++) {
            var a = attacks[i];
            if (!a || a.dioAggroNoPlayer || a.dioStandHitOnce || a._mbGEIgnored) continue;
            if (a.state === "warning" || a.state === "done" || a.warningTimer > 0) continue;
            var ax = Number(a.x), ay = Number(a.y);
            if (!Number.isFinite(ax) || !Number.isFinite(ay)) continue;
            var type = String(a.type || "").toLowerCase();
            var width = Math.max(0, Number(a.width) || 0);
            var radius = Math.max(5, Number(a.radius) || Number(a.size) || 12);
            var dx = x - ax, dy = y - ay;
            var dist = Math.hypot(dx, dy);
            if (type.indexOf("laser") !== -1 || type.indexOf("beam") !== -1) {
                var horizontal = a.direction === "horizontal" || a.zone === "upper" || a.zone === "lower";
                var inside = horizontal
                    ? Math.abs(y - ay) < Math.max(12, width * 0.5 + 14)
                    : Math.abs(x - ax) < Math.max(12, width * 0.5 + 14);
                if (inside) score += 260;
            } else if (type === "ring") {
                if (Math.abs(dist - radius) < Math.max(12, Number(a.thickness) * 0.5 + 12)) score += 210;
            } else if (type.indexOf("wall") !== -1 || type.indexOf("plate") !== -1) {
                var w = Math.max(16, Number(a.width) || Number(a.size) || 28);
                var h = Math.max(16, Number(a.height) || Number(a.size) || 28);
                if (Math.abs(dx) < w * 0.5 + 12 && Math.abs(dy) < h * 0.5 + 12) score += 240;
            } else if (dist < radius + 17) {
                score += 210 + (radius + 17 - dist) * 1.5;
            }
        }
        return score;
    }

    function chooseCompanionGoal(ctx, playerX, playerY, boss) {
        var dx = boss.x - playerX, dy = boss.y - playerY;
        var dist = Math.hypot(dx, dy) || 1;
        var ux = dx / dist, uy = dy / dist;
        var advance = Math.min(98, Math.max(30, dist * 0.42));
        var baseX = playerX + ux * advance;
        var baseY = playerY + uy * advance;
        var attacks = getAttackList(ctx);
        var best = { x: baseX, y: baseY, score: Infinity };

        for (var i = 0; i < 12; i++) {
            var angle = i * Math.PI / 6;
            var radius = i < 8 ? 24 : 37;
            var x = Math.max(22, Math.min(378, baseX + Math.cos(angle) * radius));
            var y = Math.max(28, Math.min(475, baseY + Math.sin(angle) * radius));
            var playerDistance = Math.hypot(x - playerX, y - playerY);
            var bossDistance = Math.hypot(x - boss.x, y - boss.y);
            var score = attackThreatAt(x, y, attacks) * 2.8 +
                Math.hypot(x - baseX, y - baseY) * 0.9 +
                Math.max(0, 24 - playerDistance) * 4 +
                Math.max(0, playerDistance - 82) * 1.6 +
                bossDistance * 0.08;
            if (score < best.score) best = { x: x, y: y, score: score };
        }
        return best;
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

    function getUniqueBossTarget(ctx) {
        try {
            if (ctx && ctx.type !== "arena" && typeof window.getDioUniqueBossTarget === "function") {
                return window.getDioUniqueBossTarget(ctx) || null;
            }
        } catch (e) {}
        return null;
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

    function beginMudaCombo(ctx, target, card) {
        if (!target || !ctx || now() < state.comboCooldownUntil) return false;
        var total = Math.max(6, Math.floor(Math.max(1, Number(target.maxHp) || 1) * 0.012));
        state.combo = {
            type: target.type, id: target.id, total: total,
            hitIndex: 0, nextHitAt: now(), startedAt: now(),
            x: Number(target.x) || state.x, y: Number(target.y) || state.y
        };
        state.comboCooldownUntil = now() + 2450;
        state.nextAttackAt = state.comboCooldownUntil;
        state.attackUntil = now() + 1320;
        state.attackFrame = 0;
        try { if (typeof window.showFloatingText === "function") window.showFloatingText("GOLD EXPERIENCE: MUDA MUDA MUDA!", "#ffe28a"); } catch (e) {}
        spawnHitEffect(state.x, state.y, "#ffe28a");
        return true;
    }

    function updateMudaCombo(ctx) {
        var combo = state.combo;
        if (!combo) return;
        var current = now();
        var target = null;
        try {
            if (typeof window.getDioUniqueBossTarget === "function") {
                target = window.getDioUniqueBossTarget(ctx, combo.id) || null;
            }
        } catch (e) {}
        if (!target || target.type !== combo.type) {
            state.combo = null;
            return;
        }
        combo.x = Number(target.x) || combo.x;
        combo.y = Number(target.y) || combo.y;
        var strikeInterval = 175;
        while (combo.hitIndex < 7 && current >= combo.nextHitAt) {
            combo.hitIndex++;
            state.attackFrame = combo.hitIndex;
            var hitDamage = Math.floor(combo.total * combo.hitIndex / 7) -
                Math.floor(combo.total * (combo.hitIndex - 1) / 7);
            if (hitDamage > 0) applyCompanionBossDamage(ctx, target, hitDamage);
            combo.nextHitAt += strikeInterval;
            state.attackUntil = current + 115;
            spawnHitEffect(combo.x + (Math.random() - 0.5) * 22,
                combo.y + (Math.random() - 0.5) * 22, "#ffe27a");
        }
        if (combo.hitIndex >= 7 && current > combo.nextHitAt + 90) {
            state.combo = null;
            state.attackFrame = 0;
        }
    }

    function healWithGoldExperience(ctx) {
        if (!ctx || typeof ctx.getPlayerHp !== "function" || typeof ctx.getPlayerMaxHp !== "function") return;
        var hp = Math.max(0, Number(ctx.getPlayerHp()) || 0);
        var maxHp = Math.max(1, Number(ctx.getPlayerMaxHp()) || 1);
        if (hp <= 0 || hp >= maxHp * 0.55 || now() < state.nextHealAt) return;
        var heal = Math.max(1, Math.floor(maxHp * 0.08));
        var actual = Math.min(maxHp - hp, heal);
        if (actual <= 0 || !setPlayerHp(ctx, hp + actual)) return;
        state.nextHealAt = now() + 3600;
        state.lastHealAt = now();
        addCharge(5);
        toast("🌱 GOLD EXPERIENCE: +" + Math.ceil(actual) + " HP", "#9cffaa");
        spawnHitEffect(state.x, state.y, "#9cffaa");
    }

    function updateCompanion(dt) {
        if (!state.active || !isGoldExperienceMain()) return;
        var current = now();
        if (current >= state.activeUntil) {
            state.active = false;
            state.cooldownUntil = current + GE_COOLDOWN;
            toast("GOLD EXPERIENCE ВЕРНУЛСЯ · ПЕРЕЗАРЯДКА 20 СЕК.", "#e9cb54");
            updateSuperButton();
            return;
        }

        var ctx = getContext();
        if (!ctx || typeof ctx.getHeartX !== "function" || typeof ctx.getHeartY !== "function") return;
        var playerX = Number(ctx.getHeartX()) || 200;
        var playerY = Number(ctx.getHeartY()) || 400;
        var boss = getBossPosition(ctx, playerX, playerY);
        var goal = chooseCompanionGoal(ctx, playerX, playerY, boss);
        var frameScale = Math.max(0.35, Math.min(2.2, dt / 16.667));
        var dx = goal.x - state.x, dy = goal.y - state.y;
        var maxStep = 6.8 * frameScale;
        var distance = Math.hypot(dx, dy) || 1;
        var step = Math.min(maxStep, distance);
        state.vx = dx / distance * step;
        state.vy = dy / distance * step;
        state.x += state.vx;
        state.y += state.vy;
        state.x = Math.max(18, Math.min(382, state.x));
        state.y = Math.max(22, Math.min(478, state.y));
        if (Math.abs(state.vx) > 0.15) state.facing = state.vx < 0 ? -1 : 1;
        state.trail.push({ x: state.x, y: state.y, life: 10 });
        if (state.trail.length > 7) state.trail.shift();
        for (var t = state.trail.length - 1; t >= 0; t--) state.trail[t].life -= frameScale;
        while (state.trail.length && state.trail[0].life <= 0) state.trail.shift();

        healWithGoldExperience(ctx);
        updateMudaCombo(ctx);

        var target = getUniqueBossTarget(ctx);
        var targetX = target ? Number(target.x) : boss.x;
        var targetY = target ? Number(target.y) : boss.y;
        var bossDistance = Math.hypot(state.x - targetX, state.y - targetY);
        if (!state.combo && current >= state.nextAttackAt && bossDistance <= 128) {
            if (target) beginMudaCombo(ctx, target, currentCard());
            else if (ctx.type === "arena" && bossDistance <= 112) {
                var arenaDamage = Math.max(1, Math.floor((Number(currentCard() && currentCard().damage) || 137) * 0.22));
                if (applyCompanionBossDamage(ctx, null, arenaDamage)) {
                    state.attackUntil = current + 260;
                    state.nextAttackAt = current + 930;
                } else state.nextAttackAt = current + 250;
            }
        }
    }

    function drawGoldExperience(c) {
        if (!state.active || !isGoldExperienceMain()) return;
        var current = now();
        var walk = Math.sin(current / 85) * 0.9;
        var attack = current < state.attackUntil;
        var comboStrike = state.combo ? Math.max(0, state.combo.hitIndex) : 0;
        var punch = attack ? (0.72 + Math.sin(current / 24) * 0.28) : 0;
        var scale = 1.22;
        c.save();
        c.globalCompositeOperation = "lighter";
        for (var i = 0; i < state.trail.length; i++) {
            var tr = state.trail[i];
            c.globalAlpha = Math.max(0, tr.life / 12) * 0.22;
            c.fillStyle = "#f5d65c";
            c.beginPath();
            c.arc(tr.x, tr.y + 8, 5 * (tr.life / 10), 0, Math.PI * 2);
            c.fill();
        }
        c.restore();

        c.save();
        c.translate(state.x, state.y);
        c.scale(scale * state.facing, scale);
        c.globalAlpha = 0.98;

        // Мягкая золотая аура под ногами.
        var aura = c.createRadialGradient(0, 12, 2, 0, 12, 24);
        aura.addColorStop(0, "rgba(255,235,130,.36)");
        aura.addColorStop(1, "rgba(255,200,60,0)");
        c.fillStyle = aura;
        c.beginPath(); c.ellipse(0, 13, 23, 8, 0, 0, Math.PI * 2); c.fill();

        var gold = c.createLinearGradient(-14, -24, 15, 26);
        gold.addColorStop(0, "#fff5bd");
        gold.addColorStop(0.25, "#f6d95a");
        gold.addColorStop(0.55, "#c89325");
        gold.addColorStop(0.78, "#ffdf66");
        gold.addColorStop(1, "#76501d");

        // Ноги и ботинки.
        c.strokeStyle = "#61451d"; c.lineWidth = 4; c.lineCap = "round";
        c.beginPath();
        c.moveTo(-5, 8); c.lineTo(-7 + walk * 2, 20);
        c.moveTo(5, 8); c.lineTo(7 - walk * 2, 20);
        c.stroke();
        c.fillStyle = gold;
        c.beginPath(); c.ellipse(-8 + walk * 2, 21, 5, 2.8, -0.12, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(8 - walk * 2, 21, 5, 2.8, 0.12, 0, Math.PI * 2); c.fill();

        // Корпус и плечи.
        c.fillStyle = gold;
        c.beginPath();
        c.moveTo(-8, -12); c.quadraticCurveTo(-13, -7, -10, 5);
        c.lineTo(-5, 10); c.lineTo(5, 10); c.lineTo(10, 5);
        c.quadraticCurveTo(13, -7, 8, -12); c.closePath(); c.fill();
        c.strokeStyle = "#fff0a0"; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = "#d9b13d";
        c.beginPath(); c.ellipse(-11, -10, 5, 4, -0.25, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(11, -10, 5, 4, 0.25, 0, Math.PI * 2); c.fill();

        // Руки: во время атаки ведущая рука вытянута.
        c.strokeStyle = "#9d6f24"; c.lineWidth = 4.4; c.lineCap = "round";
        c.beginPath();
        c.moveTo(-9, -8); c.lineTo(-14, -1 + walk);
        c.moveTo(9, -8); c.lineTo(attack ? 18 + punch * 7 : 14, attack ? -9 - punch * 4 : 1 - walk);
        c.stroke();
        c.fillStyle = gold;
        c.beginPath(); c.arc(-14, -1 + walk, 3.4, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(attack ? 18 + punch * 7 : 14, attack ? -9 - punch * 4 : 1 - walk, attack ? 4.8 : 3.8, 0, Math.PI * 2); c.fill();

        // Грудная пластина и зелёные жизненные камни.
        c.fillStyle = "#8b5e1b";
        c.beginPath(); c.moveTo(-6, -8); c.lineTo(0, -11); c.lineTo(6, -8); c.lineTo(5, 1); c.lineTo(0, 5); c.lineTo(-5, 1); c.closePath(); c.fill();
        c.fillStyle = "#64e69a";
        c.shadowColor = "#71ffb3"; c.shadowBlur = 8;
        c.beginPath(); c.arc(0, -5, 2.8, 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#6ee6a0";
        c.beginPath(); c.arc(-9, -10, 1.7, 0, Math.PI * 2); c.arc(9, -10, 1.7, 0, Math.PI * 2); c.fill();

        // Шея и голова с характерным золотым шлемом.
        c.fillStyle = "#a87625"; c.fillRect(-3, -18, 6, 5);
        c.fillStyle = gold;
        c.beginPath();
        c.moveTo(-7, -18); c.quadraticCurveTo(-9, -29, -2, -31);
        c.lineTo(0, -34); c.lineTo(2, -31);
        c.quadraticCurveTo(9, -29, 7, -18);
        c.quadraticCurveTo(0, -14, -7, -18); c.fill();
        c.strokeStyle = "#fff2aa"; c.lineWidth = 1; c.stroke();
        c.fillStyle = "#5c4422";
        c.beginPath(); c.ellipse(-3, -25, 1.1, 1.8, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(3, -25, 1.1, 1.8, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#67e7a2";
        c.beginPath(); c.arc(0, -30, 2, 0, Math.PI * 2); c.fill();

        // Контурные блики делают NPC читаемым на ярких аренах.
        c.strokeStyle = "rgba(255,255,230,.9)";
        c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(-4, -16); c.lineTo(-4, -7); c.moveTo(4, -16); c.lineTo(4, -7); c.stroke();

        c.restore();

        if (attack) {
            c.save();
            c.globalAlpha = Math.max(0, (state.attackUntil - current) / 260);
            c.strokeStyle = "#fff1a1"; c.lineWidth = 2.2;
            c.shadowColor = "#ffe06a"; c.shadowBlur = 10;
            c.beginPath(); c.arc(state.x + state.facing * (18 + punch * 10), state.y - 8, 19 + (comboStrike % 2) * 3, -0.8, 0.8); c.stroke();
            if (state.combo) {
                c.globalAlpha *= 0.72;
                c.beginPath(); c.arc(state.x + state.facing * 28, state.y - 8, 25, -0.65, 0.65); c.stroke();
            }
            c.restore();
        }
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
            var left = state.active ? Math.max(0, state.activeUntil - t) : Math.max(0, state.cooldownUntil - t);
            title.textContent = state.active
                ? "✦ GOLD EXPERIENCE · АКТИВЕН " + (left / 1000).toFixed(1) + "с · АТАКУЕТ / УКЛОНЯЕТСЯ"
                : left > 0
                    ? "✦ GOLD EXPERIENCE · ПЕРЕЗАРЯДКА " + (left / 1000).toFixed(1) + "с"
                    : "✦ GOLD EXPERIENCE · ГОТОВ К ПРИЗЫВУ";
            bar.style.display = "none";
        } else {
            var activeLeft = Math.max(0, state.gerUntil - now());
            title.textContent = activeLeft > 0
                ? "✦ RETURN TO ZERO · " + state.gerCharges + " ЗАРЯДА · " + (activeLeft / 1000).toFixed(1) + "с"
                : "✦ REQUIEM · ЗАРЯД " + Math.floor(state.charge) + "%";
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
        if (card.name === GE_CARD) {
            var left = state.active ? Math.max(0, state.activeUntil - now()) : Math.max(0, state.cooldownUntil - now());
            btn.textContent = state.active
                ? "✦ GOLD EXPERIENCE · " + (left / 1000).toFixed(1) + "с"
                : left > 0
                    ? "⏳ ПЕРЕЗАРЯДКА · " + (left / 1000).toFixed(1) + "с"
                    : "✦ ПРИЗВАТЬ GOLD EXPERIENCE";
            btn.disabled = !state.active && left > 0;
            btn.title = "NPC действует 15 секунд. После исчезновения перезарядка 20 секунд.";
            if (status) {
                status.style.display = "block";
                status.textContent = state.active
                    ? "GOLD EXPERIENCE: следует за Джорно, уклоняется, атакует босса и лечит при HP ниже 55%. Попадание по стенду передаёт Джорно 50% урона; прямое попадание по Джорно наносит полный урон."
                    : "GOLD EXPERIENCE: 15 секунд в бою · затем 20 секунд перезарядки.";
                status.style.borderColor = "#e9cb54";
            }
        } else {
            var activeLeft = Math.max(0, state.gerUntil - now());
            btn.textContent = activeLeft > 0
                ? "✦ ВОЗВРАЩЕНИЕ К НУЛЮ · " + state.gerCharges + " ЗАРЯДА"
                : state.charge >= 100
                    ? "✦ SUPER: ВОЗВРАЩЕНИЕ К НУЛЮ"
                    : "✦ REQUIEM · " + Math.floor(state.charge) + "%";
            btn.disabled = activeLeft <= 0 && state.charge < 100;
            btn.title = "При 100% заряда: 5 секунд и 2 обнуления. Серия ударов считается одним действием. QTE и сюжетные события не отменяются.";
            if (status) {
                status.style.display = "block";
                status.textContent = "Возврат к нулю: отменяет до 2 обычных боевых действий за 5 секунд. После успешного обнуления следующая атака Джорно наносит +50% урона.";
                status.style.borderColor = "#ffe07a";
            }
        }
        var btn2 = document.getElementById("superBtn2");
        var deact = document.getElementById("superBtnDeactivate");
        if (btn2) btn2.style.display = "none";
        if (deact) deact.style.display = "none";
        updateHUD();
    }

    function summonGoldExperience() {
        var card = currentCard();
        var combat = getCombat();
        if (!card || card.name !== GE_CARD || !canUseSuper(card, combat)) return;
        var current = now();
        if (state.active && current < state.activeUntil) {
            toast("GOLD EXPERIENCE УЖЕ В БОЮ", "#ffe28a");
            return;
        }
        if (current < state.cooldownUntil) {
            toast("GOLD EXPERIENCE ПЕРЕЗАРЯЖАЕТСЯ", "#ffcf79");
            return;
        }
        var ctx = getContext();
        if (!ctx || typeof ctx.getHeartX !== "function" || typeof ctx.getHeartY !== "function") return;
        state.active = true;
        state.activeUntil = current + GE_DURATION;
        state.cooldownUntil = state.activeUntil + GE_COOLDOWN;
        state.x = Number(ctx.getHeartX()) || 200;
        state.y = (Number(ctx.getHeartY()) || 400) - 28;
        state.vx = 0;
        state.vy = 0;
        state.nextAttackAt = current + 400;
        state.nextHealAt = current + 1200;
        state.attackUntil = 0;
        state.trail = [];
        toast("✦ GOLD EXPERIENCE: ДЕЙСТВУЙ!", "#ffe28a");
        updateSuperButton();
        startLoop();
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
        if (isGoldExperienceMain()) return summonGoldExperience();
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
        state.active = false;
        state.activeUntil = 0;
        state.cooldownUntil = 0;
        state.trail = [];
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
        if (isGoldExperienceMain() && state.active && now() < state.activeUntil) return true;
        if (typeof baseStandActive === "function") return baseStandActive.apply(this, arguments);
        return false;
    };

    var baseStandPosition = window.getStandUserHitboxPosition;
    window.getStandUserHitboxPosition = function (ctx) {
        if (isGoldExperienceMain() && state.active && now() < state.activeUntil) {
            return { x: state.x, y: state.y - 4, radius: 15, color: "#e9cb54", stand: "Gold Experience" };
        }
        return typeof baseStandPosition === "function" ? baseStandPosition.apply(this, arguments) : null;
    };

    var baseStandFactor = window.getStandUserDamageFactor;
    window.getStandUserDamageFactor = function () {
        if (isGoldExperienceMain() && state.active && now() < state.activeUntil) return 0.4;
        return typeof baseStandFactor === "function" ? baseStandFactor.apply(this, arguments) : 0.4;
    };

    var baseScaleStandDamage = window.scaleStandBlockedDamage;
    window.scaleStandBlockedDamage = function (baseDamage) {
        var base = Math.max(0, Number(baseDamage) || 0);
        if (isGoldExperienceMain() && state.active && now() < state.activeUntil) {
            addCharge(8);
            state.lastHitAt = now();
            return Math.max(1, Math.floor(base * 0.5));
        }
        return typeof baseScaleStandDamage === "function"
            ? baseScaleStandDamage.apply(this, arguments)
            : Math.max(1, Math.floor(base * 0.4));
    };

    window.MBIsGoldExperienceNpcActive = function () {
        return isGoldExperienceMain() && state.active && now() < state.activeUntil;
    };
    window.MBGoldExperienceTryStandHit = function (ctx, attack) {
        if (!window.MBIsGoldExperienceNpcActive() || !attack ||
            typeof window.dioAttackTouchesStand !== "function") return false;
        return window.dioAttackTouchesStand(ctx || getContext(), attack);
    };

    // Shared damage gateway: only an attack that geometrically touches the NPC
    // is redirected. Damage aimed straight at Giorno never enters this branch.
    window.MBGoldExperienceRedirectDamage = function (rawDamage, ctx, sourceAction) {
        if (!window.MBIsGoldExperienceNpcActive() || !sourceAction ||
            typeof sourceAction !== "object" || sourceAction.dioStandHitOnce ||
            typeof window.dioAttackTouchesStand !== "function") return null;
        var hit = false;
        try { hit = window.dioAttackTouchesStand(ctx || getContext(), sourceAction) === true; } catch (e) {}
        if (!hit) return null;
        sourceAction.dioStandHitOnce = true;
        return typeof window.scaleStandBlockedDamage === "function"
            ? window.scaleStandBlockedDamage(rawDamage)
            : Math.max(1, Math.floor((Number(rawDamage) || 1) * 0.5));
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
            if (damage > 0 && isGiornoMain()) addCharge(2);
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

        if (state.active) {
            if (!isGoldExperienceMain() || !getCombat().active) {
                state.active = false;
                state.trail = [];
            } else {
                updateCompanion(dt);
                var c = ensureLoopContext();
                if (c) drawGoldExperience(c);
            }
        }
        if (state.gerUntil > current && isGERMain()) updateHUD();
        if (state.active || isGERMain() || state.markUntil > current) {
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
        startLoop();
        updateHUD();
    };

    // Keep the HUD and summon button synchronized while the NPC is active or cooling down.
    if (typeof window.setInterval === "function" && !window.__mbGoldExperienceUiTimer) {
        window.__mbGoldExperienceUiTimer = window.setInterval(function () {
            var card = currentCard();
            if (card && (card.name === GE_CARD || card.name === GER_CARD)) {
                if (state.active && now() >= state.activeUntil) {
                    state.active = false;
                    state.cooldownUntil = now() + GE_COOLDOWN;
                }
                updateSuperButton();
            } else {
                updateHUD();
            }
        }, 160);
    }

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden && (state.active || isGERMain())) startLoop();
    });

    window.addEventListener("beforeunload", function () {
        if (rafId && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(rafId);
        rafId = 0;
    });
})();