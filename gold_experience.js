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
        var approach = Math.min(150, Math.max(48, dist * 0.58));
        var baseX = playerX + ux * approach;
        var baseY = playerY + uy * approach;
        var attacks = getAttackList(ctx);
        var predicted = [];
        for (var a = 0; a < attacks.length; a++) {
            var attack = attacks[a];
            if (!attack || !Number.isFinite(Number(attack.x)) || !Number.isFinite(Number(attack.y))) continue;
            var copy = Object.assign({}, attack);
            copy.x = Number(copy.x) + (Number(copy.vx) || 0) * 7;
            copy.y = Number(copy.y) + (Number(copy.vy) || 0) * 7;
            predicted.push(copy);
        }
        var best = { x: baseX, y: baseY, score: Infinity };
        for (var i = 0; i < 24; i++) {
            var angle = i * Math.PI / 12;
            var radius = i % 3 === 0 ? 18 : (i % 3 === 1 ? 34 : 52);
            var x = Math.max(20, Math.min(380, baseX + Math.cos(angle) * radius));
            var y = Math.max(24, Math.min(478, baseY + Math.sin(angle) * radius));
            var playerDistance = Math.hypot(x - playerX, y - playerY);
            var bossDistance = Math.hypot(x - boss.x, y - boss.y);
            var immediateRisk = attackThreatAt(x, y, attacks);
            var futureRisk = attackThreatAt(x, y, predicted);
            var score = immediateRisk * 3.2 + futureRisk * 2.2 +
                Math.hypot(x - baseX, y - baseY) * 0.48 +
                Math.max(0, 28 - playerDistance) * 3.5 +
                Math.max(0, playerDistance - 178) * 1.2 +
                Math.max(0, 42 - bossDistance) * 0.9 +
                Math.max(0, bossDistance - 145) * 0.18;
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
        var damage = Math.max(1, Math.floor(Number(rawDamage) || 8));
        state.heartHp = Math.max(0, Number(state.heartHp) - damage);
        state.heartLastHitAt = current;
        state.heartInvulnUntil = current + 380;
        addCharge(8);
        spawnHitEffect(state.x, state.y, "#ffe887");
        if (state.heartHp <= 0) {
            state.heartHp = 0;
            state.heartAlive = false;
            state.heartRespawnAt = current + 4800;
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
        var total = Math.max(6, Math.floor(maxHp * 0.012));
        var boss = target || getBossPosition(ctx, state.x, state.y);
        state.combo = {
            type: ctx.type,
            id: target ? target.id : null,
            total: total,
            hitIndex: 0,
            hitCount: GE_MUDA_HITS,
            nextHitAt: current,
            startedAt: current,
            endsAt: current + GE_MUDA_DURATION,
            x: Number(boss.x) || state.x,
            y: Number(boss.y) || state.y
        };
        state.comboCooldownUntil = current + GE_MUDA_DURATION + 1100;
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

        var hitInterval = GE_MUDA_DURATION / GE_MUDA_HITS;
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
        var damagePercent = seeds ? 0.0085 : 0.009;
        var maxHp = getAttackBossMaxHp(ctx, target);
        var boss = target || getBossPosition(ctx, state.x, state.y);

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
        state.nextAttackAt = current + duration + 1350;
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
        if (!state.active || !isGERMain()) return;
        var current = now();
        if (!state.heartAlive) {
            if (current >= state.heartRespawnAt) {
                state.heartAlive = true;
                state.heartHp = state.heartMaxHp;
                state.heartInvulnUntil = current + 900;
                state.nextAttackAt = current + 650;
                toast("✦ GOLDEN HEART ВОССТАНОВЛЕН!", "#ffe88a");
            } else {
                return;
            }
        }
        var ctx = getContext();
        if (!ctx || typeof ctx.getHeartX !== "function" || typeof ctx.getHeartY !== "function") return;
        var playerX = Number(ctx.getHeartX()) || 200;
        var playerY = Number(ctx.getHeartY()) || 400;
        var boss = getBossPosition(ctx, playerX, playerY);
        var goal = chooseCompanionGoal(ctx, playerX, playerY, boss);
        var frameScale = Math.max(0.35, Math.min(2.2, dt / 16.667));
        var dx = goal.x - state.x, dy = goal.y - state.y;
        var maxStep = 5.2 * frameScale;
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
        if (state.trail.length > 9) state.trail.shift();
        for (var t = state.trail.length - 1; t >= 0; t--) state.trail[t].life -= frameScale;
        while (state.trail.length && state.trail[0].life <= 0) state.trail.shift();
        healWithGoldExperience(ctx);
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
        var combo = state.combo;
        var special = state.specialAttack;
        var attacking = !!(combo || special || current < state.attackUntil);
        var walk = Math.sin(current / 105) * 0.75;
        var scale = 0.96;
        var comboElapsed = combo ? Math.max(0, current - combo.startedAt) : 0;
        var comboPulse = combo ? (comboElapsed % (GE_MUDA_DURATION / GE_MUDA_HITS)) / (GE_MUDA_DURATION / GE_MUDA_HITS) : 0;
        var leadRight = combo ? (combo.hitIndex % 2 === 1) : true;
        var jab = combo ? (0.45 + 0.55 * Math.sin(comboPulse * Math.PI)) : (attacking ? 0.72 : 0.12);
        var leadReach = combo ? 15 + jab * 11 : (attacking ? 13 : 0);
        var leadY = combo ? -10 + Math.sin(comboElapsed / 70) * 2.5 : (attacking ? -12 : -2);
        var invulnerable = current < state.heartInvulnUntil;
        var orangeGold = c.createLinearGradient(-14, -28, 16, 25);
        orangeGold.addColorStop(0, "#fff0b2");
        orangeGold.addColorStop(0.2, "#ffd96a");
        orangeGold.addColorStop(0.43, "#f4a329");
        orangeGold.addColorStop(0.68, "#dd7a18");
        orangeGold.addColorStop(0.86, "#f6bc43");
        orangeGold.addColorStop(1, "#8f4d17");

        // Short golden movement trail, kept tight around the body.
        c.save();
        c.globalCompositeOperation = "lighter";
        for (var i = 0; i < state.trail.length; i++) {
            var tr = state.trail[i];
            c.globalAlpha = Math.max(0, tr.life / 12) * 0.15;
            c.fillStyle = "#f4b34a";
            c.beginPath();
            c.ellipse(tr.x, tr.y + 7, 4.5 * (tr.life / 10), 2.6 * (tr.life / 10), 0, 0, Math.PI * 2);
            c.fill();
        }
        c.restore();

        if (!state.heartAlive) {
            c.save();
            c.globalAlpha = 0.78;
            c.fillStyle = "#f7bd53";
            c.font = "bold 9px Arial";
            c.textAlign = "center";
            c.fillText("ВОССТАНОВЛЕНИЕ", state.x, state.y - 39);
            c.restore();
            return;
        }

        c.save();
        c.translate(state.x, state.y);
        c.scale(scale * state.facing, scale);
        c.globalAlpha = invulnerable ? (0.62 + Math.sin(current / 35) * 0.22) : 0.99;

        // Compact orange-gold aura.
        var aura = c.createRadialGradient(0, 12, 2, 0, 12, 21);
        aura.addColorStop(0, "rgba(255,204,94,.28)");
        aura.addColorStop(1, "rgba(255,166,44,0)");
        c.fillStyle = aura;
        c.beginPath();
        c.ellipse(0, 13, 19, 6.5, 0, 0, Math.PI * 2);
        c.fill();

        // Legs and boots.
        c.lineCap = "round";
        c.strokeStyle = "#874a1c";
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(-5, 7);
        c.lineTo(-7 + walk * 1.6, 19);
        c.moveTo(5, 7);
        c.lineTo(7 - walk * 1.6, 19);
        c.stroke();
        c.fillStyle = orangeGold;
        c.beginPath();
        c.ellipse(-8 + walk * 1.6, 20, 4.6, 2.4, -0.12, 0, Math.PI * 2);
        c.ellipse(8 - walk * 1.6, 20, 4.6, 2.4, 0.12, 0, Math.PI * 2);
        c.fill();

        // Arm pose: both shoulders and elbows move. During MUDA MUDA the fists alternate.
        function drawArm(side, isLead) {
            var shoulderX = side * 8.5;
            var shoulderY = -9;
            var extension = isLead ? leadReach : (combo ? 2.5 : (attacking ? 4 : 0));
            var elbowX = side * (isLead ? 15.5 : 12.8) + (isLead ? extension * 0.38 : 0);
            var elbowY = isLead ? (leadY + 1.5) : (-3 + walk * 0.6);
            var handX = side * (isLead ? 22 : 17) + (isLead ? extension : 0);
            var handY = isLead ? leadY : (1 - walk * 0.55);
            var armDark = "#9a581e";
            var armLight = orangeGold;

            c.lineCap = "round";
            c.lineJoin = "round";
            c.strokeStyle = armDark;
            c.lineWidth = 5.2;
            c.beginPath();
            c.moveTo(shoulderX, shoulderY);
            c.quadraticCurveTo(elbowX - side * 1.5, elbowY - 1, handX - side * 2, handY);
            c.stroke();

            c.strokeStyle = "#efb24b";
            c.lineWidth = 3.15;
            c.beginPath();
            c.moveTo(shoulderX, shoulderY);
            c.quadraticCurveTo(elbowX - side * 1.5, elbowY - 1, handX - side * 2, handY);
            c.stroke();

            // Cuff and a shaped closed fist, not floating circles.
            c.strokeStyle = "#7b461d";
            c.lineWidth = 2.5;
            c.beginPath();
            c.moveTo(handX - side * 4, handY - 2.3);
            c.lineTo(handX - side * 2.1, handY + 2.4);
            c.stroke();

            c.fillStyle = armLight;
            c.strokeStyle = "#8c4d1a";
            c.lineWidth = 0.9;
            c.beginPath();
            c.moveTo(handX - 3.7, handY - 2.9);
            c.quadraticCurveTo(handX - 1, handY - 5.1, handX + 3.4, handY - 3);
            c.quadraticCurveTo(handX + 6, handY - 0.7, handX + 3.7, handY + 2.7);
            c.quadraticCurveTo(handX + 0.8, handY + 4.2, handX - 3.2, handY + 1.7);
            c.closePath();
            c.fill();
            c.stroke();

            c.strokeStyle = "rgba(255,242,190,.9)";
            c.lineWidth = 0.8;
            c.beginPath();
            c.moveTo(handX - 1.8, handY - 2.2);
            c.lineTo(handX - 0.8, handY - 0.1);
            c.moveTo(handX + 0.2, handY - 2.4);
            c.lineTo(handX + 1.2, handY - 0.2);
            c.stroke();

            if (isLead && combo) {
                c.save();
                c.globalAlpha *= 0.48 + jab * 0.25;
                c.strokeStyle = "#ffe7a0";
                c.lineWidth = 1.8;
                c.beginPath();
                c.moveTo(handX - 9 - jab * 4, handY - 4);
                c.lineTo(handX - 16 - jab * 5, handY - 6);
                c.moveTo(handX - 8 - jab * 4, handY + 2);
                c.lineTo(handX - 14 - jab * 5, handY + 4);
                c.stroke();
                c.restore();
            }
        }

        drawArm(-1, combo ? !leadRight : false);
        drawArm(1, combo ? leadRight : true);

        // Torso and shoulder armour.
        c.fillStyle = orangeGold;
        c.beginPath();
        c.moveTo(-8, -13);
        c.quadraticCurveTo(-13, -7, -10, 4);
        c.lineTo(-5, 9);
        c.lineTo(5, 9);
        c.lineTo(10, 4);
        c.quadraticCurveTo(13, -7, 8, -13);
        c.closePath();
        c.fill();
        c.strokeStyle = "#ffe5a0";
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = "#dd902c";
        c.beginPath();
        c.ellipse(-11, -10, 4.6, 3.7, -0.25, 0, Math.PI * 2);
        c.ellipse(11, -10, 4.6, 3.7, 0.25, 0, Math.PI * 2);
        c.fill();

        // Chest plate and green life gemstones.
        c.fillStyle = "#98551e";
        c.beginPath();
        c.moveTo(-6, -8);
        c.lineTo(0, -11);
        c.lineTo(6, -8);
        c.lineTo(5, 1);
        c.lineTo(0, 5);
        c.lineTo(-5, 1);
        c.closePath();
        c.fill();
        c.fillStyle = "#64e69a";
        c.shadowColor = "#71ffb3";
        c.shadowBlur = 5;
        c.beginPath();
        c.arc(0, -5, 2.4, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#72e6a2";
        c.beginPath();
        c.arc(-9, -10, 1.5, 0, Math.PI * 2);
        c.arc(9, -10, 1.5, 0, Math.PI * 2);
        c.fill();

        // Neck and characteristic golden helmet.
        c.fillStyle = "#a76624";
        c.fillRect(-2.7, -18, 5.4, 5);
        c.fillStyle = orangeGold;
        c.beginPath();
        c.moveTo(-7, -18);
        c.quadraticCurveTo(-9, -29, -2, -31);
        c.lineTo(0, -34);
        c.lineTo(2, -31);
        c.quadraticCurveTo(9, -29, 7, -18);
        c.quadraticCurveTo(0, -14, -7, -18);
        c.fill();
        c.strokeStyle = "#ffeab0";
        c.lineWidth = 0.9;
        c.stroke();
        c.fillStyle = "#62401e";
        c.beginPath();
        c.ellipse(-3, -25, 1, 1.6, 0, 0, Math.PI * 2);
        c.ellipse(3, -25, 1, 1.6, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#67e7a2";
        c.beginPath();
        c.arc(0, -30, 1.8, 0, Math.PI * 2);
        c.fill();

        // Small armour seams and highlights.
        c.strokeStyle = "rgba(255,245,205,.8)";
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(-4, -16);
        c.lineTo(-4, -7);
        c.moveTo(4, -16);
        c.lineTo(4, -7);
        c.stroke();
        c.restore();

        // Thin impact marks appear only at the boss, without filling the screen with dots.
        var impactAge = current - state.lastMudaImpactAt;
        if (combo && impactAge >= 0 && impactAge < 95) {
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
        state.heartMaxHp = 180;
        state.heartHp = state.heartMaxHp;
        state.heartAlive = true;
        state.heartRespawnAt = 0;
        state.heartInvulnUntil = current + 700;
        state.x = Number(ctx.getHeartX()) || 200;
        state.y = (Number(ctx.getHeartY()) || 400) - 34;
        state.vx = 0;
        state.vy = 0;
        state.nextAttackAt = current + 520;
        state.nextHealAt = current + 1200;
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
            return { x: state.x, y: state.y, radius: 17, color: "#ffe36b", stand: "Gold Experience Requiem" };
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