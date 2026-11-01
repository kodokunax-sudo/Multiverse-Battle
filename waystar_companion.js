/* Waystar companion: returns for every eligible Living Stone phase-two encounter.
   The existing slotData.waystarOwesDebt value remains the sole mercy source. */
(function () {
    "use strict";

    var active = false, supportRequested = false, frame = 0, activeEncounterGeneration = -1;
    var strikeTimer = 95, guardCooldown = 0;
    var guardFlash = 0, strikeFlash = 0, supportDimTimer = 0, attackPause = 0;
    var supportX = 0, supportY = 0;
    var route = null, routeTimer = 0, routeHitFlash = 0;
    var blockStars = 0, constellationFlash = 0;
    var finalLockTimer = 0, finalLockTriggered = false, finalDialogueStage = 0;
    var lastPhase = "";

    function wasSpared() {
        try {
            var savedValue = (typeof slotData !== "undefined" && slotData) ? slotData.waystarOwesDebt : false;
            var legacyValue = (typeof slotData !== "undefined" && slotData) ? slotData.waystarDefeatedThisRun : false;
            return window.waystarOwesDebt === true || savedValue === true || savedValue === 1 || savedValue === "true" ||
                window.waystarDefeatedThisRun === true || legacyValue === true || legacyValue === 1 || legacyValue === "true";
        } catch (e) { return false; }
    }

    function phase() {
        return (typeof window !== "undefined" && window.__mbLS2GreenPhase) || "normal";
    }

    function encounterEligible() {
        // The spared Star is reserved exclusively for Living Stone Prime.
        // Ordinary Living Stone must never activate or display this companion.
        if (!wasSpared() ||
            typeof livingStoneActive === "undefined" || !livingStoneActive ||
            window.livingStoneSuperActive !== true ||
            window.__mbLS2AfterChase !== true ||
            (typeof finalSceneActive !== "undefined" && finalSceneActive) ||
            window.__mbLivingStoneChaseActive === true) return false;

        return phase() === "normal" || phase() === "green";
    }

    function normalActionsEligible() {
        return encounterEligible() && phase() === "normal";
    }

    function announce(message, color, life) {
        if (typeof spawnLivingStoneText === "function")
            spawnLivingStoneText(200, 305, message, color || "#bcefff", life || 70);
    }

    function burst(x, y, count, color, speed) {
        if (typeof spawnLivingStoneParticles === "function")
            spawnLivingStoneParticles(x, y, count, color || "#aeeaff", speed || 4);
    }

    function maxBossHp() {
        var hp = 0;
        if (window.livingStoneSuperActive === true && typeof window.getLivingStoneSuperBossMaxHp === "function") {
            try { hp = Number(window.getLivingStoneSuperBossMaxHp()) || 0; } catch (e) {}
        }
        if (!(hp > 0) && typeof livingStoneBossMaxHp !== "undefined") hp = Number(livingStoneBossMaxHp) || 0;
        return Math.max(1, hp);
    }

    function currentBossHp() {
        if (typeof livingStoneBossHp !== "undefined" && Number.isFinite(Number(livingStoneBossHp)))
            return Number(livingStoneBossHp);
        return maxBossHp();
    }

    function startSupport() {
        if (!wasSpared() || window.livingStoneSuperActive !== true) return false;
        supportRequested = true;
        active = false;
        frame = 0;
        strikeTimer = 95;
        guardCooldown = 0;
        guardFlash = 0;
        strikeFlash = 0;
        supportDimTimer = 0;
        attackPause = 0;
        route = null;
        routeTimer = 0;
        routeHitFlash = 0;
        blockStars = 0;
        constellationFlash = 0;
        finalLockTimer = 0;
        finalLockTriggered = false;
        finalDialogueStage = 0;
        lastPhase = "";
        return true;
    }

    function strike() {
        if (!normalActionsEligible() || attackPause > 0 ||
            typeof livingStoneBoss === "undefined" || !livingStoneBoss) return;
        var damage = Math.min(Math.max(1, Math.floor(maxBossHp() * 0.012)), Math.max(0, currentBossHp() - 1));
        if (!(damage > 0)) return;
        if (typeof damageLivingStone === "function") damageLivingStone(damage);
        else if (typeof window.MBLivingStoneSuperDamage === "function") window.MBLivingStoneSuperDamage(damage);
        else return;

        strikeFlash = 42;
        burst(livingStoneBoss.x || 200, livingStoneBoss.y || 110, 18, "#aeeaff", 5);
        announce("ЗВЁЗДНЫЙ УДАР!", "#bcefff", 48);
        if (typeof playArenaSound === "function") playArenaSound(960, "sine", 0.22, 0.075);
    }

    function beginFinalLock() {
        if (finalLockTriggered || !normalActionsEligible() ||
            typeof window.MBLivingStoneSuperWaystarFinalLock !== "function") return;
        var started = window.MBLivingStoneSuperWaystarFinalLock(165);
        if (started === false) return;

        finalLockTriggered = true;
        finalLockTimer = 165;
        finalDialogueStage = 1;
        route = null;
        routeTimer = 0;
        announce("В ПРОШЛЫЙ РАЗ ТЫ НЕ ДАЛ МНЕ ПРОИГРАТЬ...", "#d8f5ff", 105);
        burst(livingStoneBoss.x || 200, livingStoneBoss.y || 110, 26, "#b8edff", 5);
        if (typeof playArenaSound === "function") playArenaSound(1180, "sine", 0.42, 0.09);
    }

    function update() {
        if (!encounterEligible()) {
            active = false;
            if (guardFlash > 0) guardFlash--;
            if (strikeFlash > 0) strikeFlash--;
            return;
        }

        var generation = typeof livingStoneEncounterGeneration !== "undefined"
            ? Number(livingStoneEncounterGeneration) || 0 : 0;
        if (!active || activeEncounterGeneration !== generation) {
            active = true;
            supportRequested = true;
            activeEncounterGeneration = generation;
            frame = 0;
            strikeTimer = 95;
            guardCooldown = 0;
            guardFlash = 0;
            strikeFlash = 0;
            supportDimTimer = 0;
            attackPause = 0;
            route = null;
            routeTimer = 0;
            routeHitFlash = 0;
            blockStars = 0;
            constellationFlash = 0;
            finalLockTimer = 0;
            finalLockTriggered = false;
            finalDialogueStage = 0;
            lastPhase = "";
            supportX = Number(livingStonePlayer.x) || 200;
            supportY = Number(livingStonePlayer.y) || 400;
            announce("Я ОБЕЩАЛА ВЕРНУТЬСЯ. И Я ЗДЕСЬ.", "#bcefff", 95);
        }

        frame++;
        var currentPhase = phase();
        if (lastPhase === "green" && currentPhase !== "green") {
            blockStars = 0;
            constellationFlash = 0;
        }
        lastPhase = currentPhase;

        if (currentPhase === "normal") {
            if (guardCooldown > 0) guardCooldown--;
            if (strikeTimer > 0) strikeTimer--;
            if (attackPause > 0) attackPause--;
            if (routeTimer > 0) routeTimer--;
            if (routeHitFlash > 0) routeHitFlash--;
            if (supportDimTimer > 0) supportDimTimer--;
            if (finalLockTimer > 0) {
                finalLockTimer--;
                if (finalDialogueStage === 1 && finalLockTimer <= 95) {
                    finalDialogueStage = 2;
                    announce("ТЕПЕРЬ Я НЕ ДАМ ТЕБЕ ЗАБРАТЬ ЕГО ПОБЕДУ!", "#d8f5ff", 95);
                }
            }
            if (strikeTimer <= 0) {
                strikeTimer = 300;
                strike();
            }
            if (routeTimer <= 0) route = null;

            var hpRatio = currentBossHp() / maxBossHp();
            if (hpRatio <= 0.12 && !finalLockTriggered) beginFinalLock();
        } else {
            // In green-heart mode ordinary attacks, protection and old route predictions pause.
            // The companion stays visible so successful blocks can charge her constellation.
            route = null;
            routeTimer = 0;
            if (constellationFlash > 0) {
                constellationFlash--;
                if (constellationFlash <= 0) blockStars = 0;
            }
            if (routeHitFlash > 0) routeHitFlash--;
        }

        if (guardFlash > 0) guardFlash--;
        if (strikeFlash > 0) strikeFlash--;

        if (typeof livingStonePlayer !== "undefined" && livingStonePlayer) {
            var side = livingStonePlayer.x < 200 ? 1 : -1;
            var tx = livingStonePlayer.x + side * (34 + Math.sin(frame / 95) * 5);
            var ty = livingStonePlayer.y - 20 + Math.sin(frame / 38) * 7;
            supportX += (tx - supportX) * 0.13;
            supportY += (ty - supportY) * 0.11;
        }
    }

    function tryProtect(incoming) {
        if (!normalActionsEligible() || guardCooldown > 0) return false;

        incoming = Math.max(0, Number(incoming) || 0);
        var hp = typeof livingStonePlayerHp !== "undefined" ? Number(livingStonePlayerHp) : 0;
        var maxHp = typeof livingStonePlayerMaxHp !== "undefined" ? Number(livingStonePlayerMaxHp) : hp;
        if (!(hp > 0) || !(maxHp > 0)) return false;

        var remainingHp = hp - incoming;
        var critical = remainingHp <= 0 || remainingHp <= maxHp * 0.22;
        if (!critical) return false;

        guardCooldown = 900;
        guardFlash = 64;
        if (typeof livingStoneInvulnTimer !== "undefined") livingStoneInvulnTimer = 55;
        supportDimTimer = 240;
        attackPause = 240;
        strikeTimer = Math.max(strikeTimer, 240);
        route = null;
        routeTimer = 0;

        if (typeof livingStonePlayer !== "undefined" && livingStonePlayer &&
            typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            var dx = livingStonePlayer.x - livingStoneBoss.x;
            var dy = livingStonePlayer.y - livingStoneBoss.y;
            var length = Math.sqrt(dx * dx + dy * dy) || 1;
            livingStonePlayer.x = Math.max(18, Math.min(382, livingStonePlayer.x + dx / length * 12));
            livingStonePlayer.y = Math.max(82, Math.min(482, livingStonePlayer.y + dy / length * 12));
            supportX = livingStonePlayer.x + dx / length * 18;
            supportY = livingStonePlayer.y + dy / length * 18;
        }

        burst(livingStonePlayer.x, livingStonePlayer.y, 24, "#9deaff", 5);
        announce("НА ЭТОТ РАЗ Я УСПЕЛА!", "#d8f5ff", 90);
        if (typeof playArenaSound === "function") playArenaSound(620, "triangle", 0.35, 0.08);
        return true;
    }

    function onDodgePrediction(from, target) {
        if (!normalActionsEligible() || !from || !target) return false;
        var fromX = Number(from.x), fromY = Number(from.y);
        var targetX = Number(target.x), targetY = Number(target.y);
        if (![fromX, fromY, targetX, targetY].every(Number.isFinite)) return false;
        route = { fromX: fromX, fromY: fromY, targetX: targetX, targetY: targetY };
        routeTimer = 190;
        return true;
    }

    function tryRouteHit(bullet, boss) {
        if (!normalActionsEligible() || !route || routeTimer <= 0 || !bullet || !boss) return false;
        var bossDistance = Math.hypot(Number(boss.x) - route.targetX, Number(boss.y) - route.targetY);
        var bulletDistance = Math.hypot(Number(bullet.x) - route.targetX, Number(bullet.y) - route.targetY);
        if (bossDistance > 58 || bulletDistance > 66) return false;
        route = null;
        routeTimer = 0;
        routeHitFlash = 42;
        return true;
    }

    function onGreenBlock() {
        if (!encounterEligible() || phase() !== "green" || constellationFlash > 0) return false;
        blockStars = Math.min(3, blockStars + 1);
        burst(supportX, supportY, 5, "#baf4ff", 2.5);
        if (blockStars >= 3) {
            constellationFlash = 95;
            announce("ДА! ВОТ ТАК!", "#d8f5ff", 75);
            if (typeof playArenaSound === "function") playArenaSound(1040, "triangle", 0.2, 0.07);
            return true;
        }
        return false;
    }

    function resetGreenBlocks() {
        blockStars = 0;
        constellationFlash = 0;
    }

    function drawStar(c, x, y, radius, rotation, color) {
        c.save();
        c.translate(x, y);
        c.rotate(rotation || 0);
        c.beginPath();
        for (var i = 0; i < 8; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 4;
            var r = i % 2 === 0 ? radius : radius * 0.38;
            var px = Math.cos(a) * r, py = Math.sin(a) * r;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = color || "#dff8ff";
        c.shadowColor = color || "#a8eaff";
        c.shadowBlur = 10;
        c.fill();
        c.restore();
    }

    function draw(c) {
        if (!active || !encounterEligible() || !c ||
            typeof livingStonePlayer === "undefined" ||
            typeof window.MBDrawWaystarCompanion !== "function") return;

        var now = typeof performance !== "undefined" ? performance.now() : Date.now();
        var pulse = 1 + Math.sin(now / 135) * 0.1;
        var px = livingStonePlayer.x, py = livingStonePlayer.y;
        var sx = supportX || px + 35, sy = supportY || py - 22;
        var isGreen = phase() === "green";
        var alpha = supportDimTimer > 0 ? 0.38 : 1;

        c.save();
        c.globalAlpha = 0.65 * alpha;
        c.strokeStyle = "rgba(111,218,255,.60)";
        c.lineWidth = 1.6;
        c.shadowColor = "#80dcff";
        c.shadowBlur = window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects() ? 0 : 12;
        c.beginPath();
        c.ellipse(sx, sy, 26 * pulse, 13 * pulse, Math.sin(now / 700) * 0.35, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;

        if (route && routeTimer > 0 && !isGreen) {
            var routeAlpha = Math.min(0.95, routeTimer / 42);
            c.globalAlpha = routeAlpha;
            c.strokeStyle = "#b7eeff";
            c.lineWidth = 2;
            c.setLineDash([4, 6]);
            c.beginPath();
            c.moveTo(route.fromX, route.fromY);
            c.lineTo(route.targetX, route.targetY);
            c.stroke();
            c.setLineDash([]);
            for (var ri = 1; ri <= 5; ri++) {
                var rt = ri / 6;
                drawStar(c, route.fromX + (route.targetX - route.fromX) * rt,
                    route.fromY + (route.targetY - route.fromY) * rt,
                    4 + Math.sin(now / 90 + ri) * 1.2, now / 500, "#c9f4ff");
            }
            c.strokeStyle = "#effcff";
            c.lineWidth = 2.3;
            c.beginPath();
            c.arc(route.targetX, route.targetY, 17 + Math.sin(now / 70) * 3, 0, Math.PI * 2);
            c.stroke();
            drawStar(c, route.targetX, route.targetY, 10, now / 300, "#f0fcff");
        }

        if (constellationFlash > 65 && typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            c.globalAlpha = Math.min(1, (constellationFlash - 65) / 20);
            c.strokeStyle = "#e8fbff";
            c.lineWidth = 4;
            c.shadowColor = "#a7eaff";
            c.shadowBlur = 16;
            c.beginPath();
            c.moveTo(sx, sy);
            c.lineTo(livingStoneBoss.x, livingStoneBoss.y);
            c.stroke();
            c.shadowBlur = 0;
        }

        if (blockStars > 0 && isGreen) {
            var starOffsets = [{ x: -15, y: -28 }, { x: 0, y: -36 }, { x: 15, y: -28 }];
            c.globalAlpha = 0.9;
            if (blockStars >= 3 || constellationFlash > 0) {
                c.strokeStyle = "#d9f7ff";
                c.lineWidth = 2;
                c.shadowColor = "#9eeaff";
                c.shadowBlur = constellationFlash > 0 ? 14 : 6;
                c.beginPath();
                c.moveTo(sx + starOffsets[0].x, sy + starOffsets[0].y);
                c.lineTo(sx + starOffsets[1].x, sy + starOffsets[1].y);
                c.lineTo(sx + starOffsets[2].x, sy + starOffsets[2].y);
                c.closePath();
                c.stroke();
                c.shadowBlur = 0;
            }
            for (var bi = 0; bi < blockStars; bi++) {
                drawStar(c, sx + starOffsets[bi].x, sy + starOffsets[bi].y,
                    constellationFlash > 0 ? 7 : 5, now / 420, "#e3faff");
            }
        }

        if (strikeFlash > 0 || routeHitFlash > 0) {
            c.globalAlpha = Math.min(1, Math.max(strikeFlash, routeHitFlash) / 22);
            c.strokeStyle = "#f1fcff";
            c.lineWidth = routeHitFlash > 0 ? 4 : 3;
            c.beginPath();
            c.moveTo(sx, sy);
            c.lineTo(livingStoneBoss.x || 200, livingStoneBoss.y || 110);
            c.stroke();
        }

        if (guardFlash > 0) {
            c.globalAlpha = Math.min(0.9, guardFlash / 30);
            c.strokeStyle = "#b9efff";
            c.lineWidth = 3;
            c.beginPath();
            c.arc(px, py, 26 + (64 - guardFlash) * 0.55, 0, Math.PI * 2);
            c.stroke();
        }

        if (finalLockTimer > 0 && typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            var bx = livingStoneBoss.x, by = livingStoneBoss.y;
            var lockAlpha = Math.min(1, finalLockTimer / 24);
            var lockPulse = 1 + Math.sin(now / 75) * 0.045;
            c.globalAlpha = lockAlpha;
            c.strokeStyle = "#d6f6ff";
            c.lineWidth = 2.4;
            c.shadowColor = "#84ddff";
            c.shadowBlur = 14;
            c.beginPath();
            c.arc(bx, by, 58 * lockPulse, 0, Math.PI * 2);
            c.stroke();
            c.beginPath();
            for (var ci = 0; ci < 8; ci++) {
                var ca = -Math.PI / 2 + ci * Math.PI / 4;
                var cx = bx + Math.cos(ca) * 58 * lockPulse;
                var cy = by + Math.sin(ca) * 58 * lockPulse;
                if (ci === 0) c.moveTo(cx, cy);
                else c.lineTo(cx, cy);
            }
            c.closePath();
            c.stroke();
            c.shadowBlur = 0;
            for (var si = 0; si < 8; si++) {
                var sa = now / 700 + si * Math.PI / 4;
                drawStar(c, bx + Math.cos(sa) * 58, by + Math.sin(sa) * 58, 6, sa, "#effcff");
            }
        }
        c.restore();

        window.MBDrawWaystarCompanion(sx, sy, 23);
    }

    function stop() {
        active = false;
        supportRequested = false;
        frame = 0;
        guardFlash = 0;
        strikeFlash = 0;
        supportDimTimer = 0;
        attackPause = 0;
        strikeTimer = 95;
        guardCooldown = 0;
        route = null;
        routeTimer = 0;
        routeHitFlash = 0;
        blockStars = 0;
        constellationFlash = 0;
        finalLockTimer = 0;
        finalLockTriggered = false;
        finalDialogueStage = 0;
        lastPhase = "";
        activeEncounterGeneration = -1;
    }

    window.MBHasWaystarCompanion = wasSpared;
    window.MBStartWaystarCompanionSupport = startSupport;
    window.MBUpdateWaystarCompanion = update;
    window.MBDrawWaystarCompanionSupport = draw;
    window.MBWaystarTryProtect = tryProtect;
    window.MBWaystarOnDodgePrediction = onDodgePrediction;
    window.MBWaystarTryRouteHit = tryRouteHit;
    window.MBWaystarOnGreenBlock = onGreenBlock;
    window.MBWaystarResetGreenBlocks = resetGreenBlocks;
    window.MBStopWaystarCompanion = stop;
})();