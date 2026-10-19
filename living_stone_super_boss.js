// ============================================================
// ЖИВОЙ КАМЕНЬ: СУПЕР-ВЕРСИЯ — БОСС 2000 ВОЛНЫ
// Этап 1: неподвижная зелёная душа и направленный щит.
// Уклонение босса от пуль игрока будет добавлено отдельно.
// ============================================================
(function () {
    "use strict";

    var ls2Active = false, ls2ChoicePending = false;
    var ls2Canvas = null, ls2Ctx = null, ls2Frame = 0, ls2LastTime = 0;
    var ls2Elapsed = 0, ls2BossHp = 0, ls2BossMaxHp = 0;
    var ls2PlayerHp = 180, ls2PlayerMaxHp = 180;
    var ls2Invulnerable = 0, ls2HitFlash = 0, ls2ShieldFlash = 0;
    var ls2ShieldDir = 0; // 0 вверх, 1 вправо, 2 вниз, 3 влево
    var ls2Bullets = [], ls2Sparks = [];
    var ls2AttackTimer = 54, ls2WarningTimer = 0, ls2NextAttackDir = 0, ls2AttackCount = 0;
    var ls2FloatingText = "", ls2FloatingTimer = 0;
    var ls2ExitButton = null, ls2Pad = null, ls2PreviousArenaActive = false;
    var ls2KeyHandler = null, ls2PointerHandler = null, ls2ReduceEffects = false;

    var LS2_HEART_X = 200, LS2_HEART_Y = 366;
    var LS2_BOX = { x: 38, y: 242, w: 324, h: 222 };
    var LS2_DIR_NAMES = ["↑ ВВЕРХ", "→ ВПРАВО", "↓ ВНИЗ", "← ВЛЕВО"];
    var LS2_DIR_KEYS = {
        ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1,
        ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3
    };
    var LS2_ATTACK_SEQUENCE = [0, 3, 0, 1, 2, 3, 1, 0, 2, 1, 3, 2];

    function ls2SetShield(direction) {
        if (!ls2Active) return;
        ls2ShieldDir = ((direction % 4) + 4) % 4;
        ls2ShieldFlash = 8;
    }
    function ls2SetMessage(message, frames) {
        ls2FloatingText = message;
        ls2FloatingTimer = frames || 55;
    }
    function ls2PlayTone(freq, type, duration, volume) {
        if (typeof playArenaSound === "function") {
            try { playArenaSound(freq, type || "triangle", duration || 0.08, volume || 0.035); } catch (e) {}
        }
    }
    function ls2HideMainButtons() {
        ["superBtn", "superBtn2", "superBtnDeactivate", "startArenaBtn", "startLivingStoneBtn",
         "startLivingStoneSuperBtn", "startWaystarBtn", "startRogerWB", "startAntiSpiralBossBtn",
         "skipArenaBtn", "skipBossBtn", "spareBtn"].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
    }

    function ls2CreateControls() {
        ls2ExitButton = document.createElement("button");
        ls2ExitButton.type = "button";
        ls2ExitButton.textContent = "← ВЫЙТИ";
        ls2ExitButton.style.cssText = [
            "position:fixed", "top:calc(10px + env(safe-area-inset-top))", "right:12px",
            "z-index:100005", "padding:9px 13px", "border-radius:10px",
            "border:1px solid rgba(255,115,95,.75)", "background:rgba(18,8,10,.94)",
            "color:#fff", "font:900 12px Arial,sans-serif", "touch-action:manipulation"
        ].join(";");
        ls2ExitButton.addEventListener("pointerdown", function (ev) {
            ev.preventDefault(); ev.stopPropagation();
            if (typeof window!=="undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===2000) {
                ls2Stop(false);
                if(typeof window.MBBossTestFinish==="function")window.MBBossTestFinish("exit",true);
            } else ls2Stop(true);
        });
        document.body.appendChild(ls2ExitButton);

        ls2Pad = document.createElement("div");
        ls2Pad.style.cssText = [
            "position:fixed", "z-index:100004", "bottom:calc(9px + env(safe-area-inset-bottom))",
            "left:50%", "transform:translateX(-50%)", "display:grid",
            "grid-template-columns:repeat(3,46px)", "grid-template-rows:repeat(2,39px)",
            "gap:4px", "padding:5px", "border-radius:14px",
            "border:1px solid rgba(93,255,142,.48)", "background:rgba(0,12,8,.86)",
            "touch-action:manipulation", "user-select:none", "-webkit-user-select:none"
        ].join(";");
        function addPadButton(label, direction, column, row) {
            var btn = document.createElement("button");
            btn.type = "button"; btn.textContent = label;
            btn.style.cssText = [
                "grid-column:" + column, "grid-row:" + row, "padding:0",
                "border:1px solid rgba(105,255,152,.8)", "border-radius:9px",
                "background:linear-gradient(180deg,#155c36,#08291c)",
                "color:#e2ffe9", "font:900 18px Arial,sans-serif",
                "touch-action:manipulation"
            ].join(";");
            btn.addEventListener("pointerdown", function (ev) {
                ev.preventDefault(); ev.stopPropagation(); ls2SetShield(direction);
            });
            ls2Pad.appendChild(btn);
        }
        addPadButton("▲", 0, 2, 1);
        addPadButton("◀", 3, 1, 2);
        addPadButton("▼", 2, 2, 2);
        addPadButton("▶", 1, 3, 2);
        document.body.appendChild(ls2Pad);
    }
    function ls2RemoveControls() {
        if (ls2ExitButton && ls2ExitButton.parentNode) ls2ExitButton.parentNode.removeChild(ls2ExitButton);
        if (ls2Pad && ls2Pad.parentNode) ls2Pad.parentNode.removeChild(ls2Pad);
        ls2ExitButton = null; ls2Pad = null;
    }
    function ls2ChooseFromPointer(ev) {
        if (!ls2Active || !ls2Canvas) return;
        var rect = ls2Canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = (ev.clientX - rect.left) * 400 / rect.width;
        var y = (ev.clientY - rect.top) * 500 / rect.height;
        var dx = x - LS2_HEART_X, dy = y - LS2_HEART_Y;
        if (Math.abs(dx) > Math.abs(dy)) ls2SetShield(dx >= 0 ? 1 : 3);
        else ls2SetShield(dy >= 0 ? 2 : 0);
    }
    function ls2OnKeyDown(ev) {
        if (!ls2Active) return;
        var key = ev.key || "";
        if (key === "Escape") {
            ev.preventDefault(); ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
            ls2Stop(true); return;
        }
        if (Object.prototype.hasOwnProperty.call(LS2_DIR_KEYS, key)) {
            ev.preventDefault(); ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
            ls2SetShield(LS2_DIR_KEYS[key]);
        }
    }

    function ls2SpawnAttackWave(side) {
        var box = LS2_BOX, offsets = ls2AttackCount > 5 ? [-18, 0, 18] : [-12, 0, 12];
        for (var i = 0; i < offsets.length; i++) {
            var offset = offsets[i];
            var b = { x: 0, y: 0, vx: 0, vy: 0, r: 7 + (i === 1 ? 1 : 0),
                      side: side, spin: Math.random() * 6.28, life: 150 };
            if (side === 0) {
                b.x = LS2_HEART_X + offset; b.y = box.y + 8;
                b.vx = (LS2_HEART_X - b.x) * 0.024; b.vy = 2.75 + Math.random() * 0.25;
            } else if (side === 1) {
                b.x = box.x + box.w - 8; b.y = LS2_HEART_Y + offset;
                b.vx = -2.85 - Math.random() * 0.25; b.vy = (LS2_HEART_Y - b.y) * 0.026;
            } else if (side === 2) {
                b.x = LS2_HEART_X + offset; b.y = box.y + box.h - 8;
                b.vx = (LS2_HEART_X - b.x) * 0.024; b.vy = -2.8 - Math.random() * 0.2;
            } else {
                b.x = box.x + 8; b.y = LS2_HEART_Y + offset;
                b.vx = 2.85 + Math.random() * 0.25; b.vy = (LS2_HEART_Y - b.y) * 0.026;
            }
            ls2Bullets.push(b);
        }
        if (ls2ReduceEffects && ls2Bullets.length > 12) ls2Bullets.splice(0, ls2Bullets.length - 12);
        else if (ls2Bullets.length > 36) ls2Bullets.splice(0, ls2Bullets.length - 36);
        ls2AttackCount++;
        ls2PlayTone(side === 0 ? 245 : side === 1 ? 190 : side === 2 ? 160 : 220, "square", 0.07, 0.025);
    }
    function ls2SpawnSparks(x, y, color, count) {
        var amount = ls2ReduceEffects ? Math.min(3, count || 4) : (count || 7);
        for (var i = 0; i < amount; i++) {
            var a = Math.random() * Math.PI * 2, speed = 1 + Math.random() * 3;
            ls2Sparks.push({ x: x, y: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
                life: 12 + Math.random() * 12, maxLife: 24, color: color || "#72ff9b",
                r: 1 + Math.random() * 2 });
        }
        if (ls2Sparks.length > 70) ls2Sparks.splice(0, ls2Sparks.length - 70);
    }
    function ls2HandleHit() {
        if (ls2Invulnerable > 0) return;
        var incoming=16;
        if(typeof window!=="undefined" && window.__mbBossTestMode && typeof window.MBBossTestModifyIncomingDamage==="function") {
            incoming=window.MBBossTestModifyIncomingDamage(incoming,"stoneSuper");
            if(incoming<=0){ls2SetMessage("ПАССИВКА ЗАЩИТИЛА СЕРДЦЕ",35);return;}
        }
        ls2PlayerHp = Math.max(0, ls2PlayerHp - incoming);
        ls2Invulnerable = 52; ls2HitFlash = 12;
        ls2SetMessage("ЩИТ НЕ С ТОЙ СТОРОНЫ!", 48);
        ls2SpawnSparks(LS2_HEART_X, LS2_HEART_Y, "#ff4545", 10);
        ls2PlayTone(90, "sawtooth", 0.18, 0.075);
        var hpEl = document.getElementById("arenaHP");
        if (hpEl) hpEl.textContent = ls2PlayerHp;
        if (ls2PlayerHp <= 0) {
            if(typeof window!=="undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===2000) {
                ls2Stop(false);
                if(typeof window.MBBossTestFinish==="function")window.MBBossTestFinish("loss",true);
                return;
            }
            ls2Stop(false);
            if (typeof playerHp !== "undefined") playerHp = 0;
            if (typeof defeat === "function") defeat();
            if (typeof playerHp !== "undefined" && playerHp > 0 &&
                Number(typeof wave !== "undefined" ? wave : 0) === 2000 &&
                typeof generateEnemy === "function") generateEnemy();
        }
    }
    function ls2BoxEdgeMinX() { return LS2_BOX.x; }
    function ls2BoxEdgeMaxX() { return LS2_BOX.x + LS2_BOX.w; }
    function ls2BoxEdgeMinY() { return LS2_BOX.y; }
    function ls2BoxEdgeMaxY() { return LS2_BOX.y + LS2_BOX.h; }
    function ls2Update(dt) {
        ls2Elapsed += dt;
        if (ls2Invulnerable > 0) ls2Invulnerable = Math.max(0, ls2Invulnerable - dt);
        if (ls2HitFlash > 0) ls2HitFlash = Math.max(0, ls2HitFlash - dt);
        if (ls2ShieldFlash > 0) ls2ShieldFlash = Math.max(0, ls2ShieldFlash - dt);
        if (ls2FloatingTimer > 0) ls2FloatingTimer = Math.max(0, ls2FloatingTimer - dt);
        if (ls2WarningTimer > 0) {
            ls2WarningTimer -= dt;
            if (ls2WarningTimer <= 0) {
                ls2SpawnAttackWave(ls2NextAttackDir);
                ls2AttackTimer = Math.max(42, 82 - Math.min(34, ls2AttackCount * 2.2));
            }
        } else {
            ls2AttackTimer -= dt;
            if (ls2AttackTimer <= 0) {
                ls2NextAttackDir = LS2_ATTACK_SEQUENCE[ls2AttackCount % LS2_ATTACK_SEQUENCE.length];
                ls2WarningTimer = 25;
            }
        }
        for (var i = ls2Bullets.length - 1; i >= 0; i--) {
            var b = ls2Bullets[i];
            b.x += b.vx * dt; b.y += b.vy * dt; b.spin += 0.07 * dt; b.life -= dt;
            var dx = b.x - LS2_HEART_X, dy = b.y - LS2_HEART_Y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            // The shield intercepts only attacks from the direction it faces.
            if (distance <= 27 && b.side === ls2ShieldDir) {
                ls2SpawnSparks(b.x, b.y, "#73ff9b", 7);
                ls2ShieldFlash = 12; ls2PlayTone(520, "triangle", 0.045, 0.025);
                ls2Bullets.splice(i, 1); continue;
            }
            if (distance <= 13) {
                ls2Bullets.splice(i, 1); ls2HandleHit();
                if (!ls2Active) return;
                continue;
            }
            if (b.life <= 0 || b.x < ls2BoxEdgeMinX() - 30 || b.x > ls2BoxEdgeMaxX() + 30 ||
                b.y < ls2BoxEdgeMinY() - 30 || b.y > ls2BoxEdgeMaxY() + 30) {
                ls2Bullets.splice(i, 1);
            }
        }
        for (var s = ls2Sparks.length - 1; s >= 0; s--) {
            var p = ls2Sparks[s];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx *= Math.pow(0.96, dt); p.vy *= Math.pow(0.96, dt); p.life -= dt;
            if (p.life <= 0) ls2Sparks.splice(s, 1);
        }
    }

    function ls2DrawBackground(c, now) {
        var bg = c.createLinearGradient(0, 0, 0, 500);
        bg.addColorStop(0, "#0b1010"); bg.addColorStop(0.48, "#080c0b"); bg.addColorStop(1, "#020504");
        c.fillStyle = bg; c.fillRect(0, 0, 400, 500);
        if (!ls2ReduceEffects) {
            var aura = c.createRadialGradient(200, 128, 4, 200, 128, 150);
            aura.addColorStop(0, "rgba(170,24,20,.30)");
            aura.addColorStop(0.45, "rgba(75,14,12,.17)");
            aura.addColorStop(1, "rgba(0,0,0,0)");
            c.fillStyle = aura; c.fillRect(35, 18, 330, 220);
        } else {
            c.fillStyle = "rgba(85,12,11,.20)"; c.fillRect(35, 18, 330, 220);
        }
        c.fillStyle = "#111714"; c.beginPath(); c.moveTo(0, 195);
        for (var x = 0; x <= 400; x += 25) c.lineTo(x, 184 + Math.sin(x * 0.071) * 10 + (x % 3) * 2);
        c.lineTo(400, 0); c.lineTo(0, 0); c.closePath(); c.fill();
        c.strokeStyle = "rgba(189,45,34,.30)"; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(31,182); c.lineTo(46,163); c.lineTo(40,150);
        c.moveTo(343,175); c.lineTo(360,191); c.lineTo(353,209); c.stroke();
        if (!ls2ReduceEffects) {
            for (var i = 0; i < 22; i++) {
                var px = (i * 83 + Math.sin(now / 950 + i) * 8) % 400;
                var py = (i * 59 + now * (0.012 + (i % 3) * 0.003)) % 225;
                c.globalAlpha = 0.15 + Math.abs(Math.sin(now / 700 + i)) * 0.28;
                c.fillStyle = i % 3 ? "#ff573f" : "#75ff9f"; c.fillRect(px, py, 1.5, 1.5);
            }
            c.globalAlpha = 1;
        }
        c.fillStyle = "#1a1511"; c.fillRect(0, 466, 400, 34);
        c.strokeStyle = "rgba(177,66,40,.28)"; c.beginPath();
        c.moveTo(0,476); c.lineTo(70,469); c.lineTo(120,486);
        c.moveTo(236,478); c.lineTo(301,469); c.lineTo(400,483); c.stroke();
    }
    function ls2DrawJaggedSpikes(c, now) {
        c.save(); c.translate(200, 128);
        if (!ls2ReduceEffects) { c.shadowColor = "#fa2d22"; c.shadowBlur = 22; }
        var count = ls2ReduceEffects ? 10 : 14;
        for (var i = 0; i < count; i++) {
            var angle = i / count * Math.PI * 2 + Math.sin(now / 430) * 0.018;
            var base = 48 + (i % 3) * 3, tip = 82 + (i % 4) * 5;
            var leftA = angle - 0.16, rightA = angle + 0.16;
            c.beginPath();
            c.moveTo(Math.cos(leftA) * base, Math.sin(leftA) * base);
            c.lineTo(Math.cos(angle) * tip, Math.sin(angle) * tip);
            c.lineTo(Math.cos(rightA) * base, Math.sin(rightA) * base);
            c.closePath();
            c.fillStyle = i % 2 ? "#21110f" : "#32201a";
            c.strokeStyle = i % 2 ? "#a92a22" : "#57231c";
            c.lineWidth = i % 3 === 0 ? 2.5 : 1.4; c.fill(); c.stroke();
            c.strokeStyle = "rgba(255,76,52,.72)"; c.lineWidth = 1;
            c.beginPath(); c.moveTo(Math.cos(angle) * (tip - 2), Math.sin(angle) * (tip - 2));
            c.lineTo(Math.cos(angle) * (base + 4), Math.sin(angle) * (base + 4)); c.stroke();
        }
        c.restore();
    }
    function ls2DrawStoneFallback(c) {
        c.save(); c.translate(200, 128);
        var g = c.createRadialGradient(-18, -20, 3, 0, 0, 65);
        g.addColorStop(0, "#c09070"); g.addColorStop(0.45, "#7a3a28"); g.addColorStop(1, "#27100d");
        c.fillStyle = g; c.beginPath();
        for (var i = 0; i < 12; i++) {
            var a = i / 12 * Math.PI * 2, r = 56 + (i % 3) * 4;
            if (!i) c.moveTo(Math.cos(a) * r, Math.sin(a) * r); else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.closePath(); c.fill();
        c.fillStyle = "#ff1c18"; c.shadowColor = "#ff0000"; c.shadowBlur = 15;
        c.beginPath(); c.ellipse(-18,-7,6,4,-0.2,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(18,-7,6,4,0.2,0,Math.PI*2); c.fill();
        c.shadowBlur = 0; c.fillStyle = "#100604"; c.beginPath();
        c.ellipse(0,22,26,15,0,0,Math.PI*2); c.fill();
        c.fillStyle = "#fff"; for (var t=0;t<7;t++) c.fillRect(-21+t*7,10,4,8);
        c.restore();
    }
    function ls2DrawStoneMonster(c, now) {
        ls2DrawJaggedSpikes(c, now);
        if (typeof drawLivingStoneBoss === "function" && typeof livingStoneBoss !== "undefined" &&
            typeof livingStoneState !== "undefined") {
            var oldBoss = livingStoneBoss, oldState = livingStoneState, oldFlash = livingStoneBossFlash;
            var oldFinalActive = finalSceneActive, oldFinalPhase = finalScenePhase;
            var oldCracks = finalCracksLevel, oldTimer = finalSceneTimer, oldLaugh = finalLaughOffset;
            var oldQteShake = qteBossShake, oldQteDamage = qteBossDamageLevel;
            try {
                livingStoneBoss = { x: 200, y: 128, size: 59, vx: 0, rotation: Math.sin(now / 900) * 0.055 };
                livingStoneState = "phase2"; livingStoneBossFlash = 0;
                finalSceneActive = true; finalScenePhase = "laugh";
                finalCracksLevel = ls2ReduceEffects ? 0.3 : 0.95;
                finalSceneTimer = now / 16; finalLaughOffset = Math.sin(now / 120) * 1.6;
                qteBossShake = 0; qteBossDamageLevel = 0;
                drawLivingStoneBoss();
            } catch (e) {
                ls2DrawStoneFallback(c);
            } finally {
                livingStoneBoss = oldBoss; livingStoneState = oldState; livingStoneBossFlash = oldFlash;
                finalSceneActive = oldFinalActive; finalScenePhase = oldFinalPhase;
                finalCracksLevel = oldCracks; finalSceneTimer = oldTimer; finalLaughOffset = oldLaugh;
                qteBossShake = oldQteShake; qteBossDamageLevel = oldQteDamage;
            }
        } else ls2DrawStoneFallback(c);

        c.save(); c.translate(200, 128); c.lineCap = "round"; c.lineJoin = "round";
        c.strokeStyle = "#ff3929"; c.lineWidth = ls2ReduceEffects ? 1.8 : 2.6;
        if (!ls2ReduceEffects) { c.shadowColor = "#ff261c"; c.shadowBlur = 12; }
        [
            [[-31,-27],[-20,-16],[-24,-5],[-12,4],[-17,20]],
            [[28,-29],[17,-17],[24,-7],[12,4],[20,18]],
            [[-3,-2],[5,9],[-1,19],[8,28]]
        ].forEach(function (path) {
            c.beginPath(); c.moveTo(path[0][0], path[0][1]);
            for (var i=1;i<path.length;i++) c.lineTo(path[i][0],path[i][1]);
            c.stroke();
        });
        c.restore();
    }
    function ls2DrawBullet(c, b) {
        c.save(); c.translate(b.x,b.y); c.rotate(b.spin);
        if (!ls2ReduceEffects) { c.shadowColor = "#ff4936"; c.shadowBlur = 8; }
        c.fillStyle = "#30221c"; c.strokeStyle = "#bb3c2d"; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(-b.r,-b.r*.25); c.lineTo(-b.r*.35,-b.r);
        c.lineTo(b.r*.45,-b.r*.8); c.lineTo(b.r,b.r*.1); c.lineTo(b.r*.35,b.r);
        c.lineTo(-b.r*.75,b.r*.55); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle="#ff775b"; c.lineWidth=1.2; c.beginPath();
        c.moveTo(-b.r*.45,0); c.lineTo(0,-b.r*.25); c.lineTo(b.r*.45,b.r*.35); c.stroke();
        c.restore();
    }
    function ls2DrawShield(c) {
        c.save(); c.translate(LS2_HEART_X,LS2_HEART_Y); c.rotate(ls2ShieldDir*Math.PI/2);
        c.globalAlpha = ls2ShieldFlash > 0 ? 1 : 0.95;
        c.fillStyle = ls2ShieldFlash > 0 ? "#d8ffe2" : "#22bd60";
        c.strokeStyle = "#9affb5"; c.lineWidth = 2.5;
        if (!ls2ReduceEffects) { c.shadowColor="#45ff88"; c.shadowBlur=ls2ShieldFlash>0?22:12; }
        c.beginPath(); c.moveTo(-20,4); c.lineTo(-18,-5); c.lineTo(-10,-13);
        c.lineTo(10,-13); c.lineTo(18,-5); c.lineTo(20,4); c.lineTo(0,14); c.closePath();
        c.fill(); c.stroke(); c.shadowBlur=0;
        c.strokeStyle="rgba(235,255,240,.75)"; c.lineWidth=1.2;
        c.beginPath(); c.moveTo(-10,-7); c.lineTo(0,-10); c.lineTo(10,-7); c.stroke();
        c.restore();
    }
    function ls2DrawHeart(c, now) {
        if (ls2Invulnerable > 0 && Math.floor(now / 60) % 2 === 0) return;
        c.save(); c.translate(LS2_HEART_X,LS2_HEART_Y);
        if (!ls2ReduceEffects) {
            var glow=c.createRadialGradient(0,0,2,0,0,30);
            glow.addColorStop(0,ls2HitFlash>0?"rgba(255,50,50,.65)":"rgba(65,255,125,.42)");
            glow.addColorStop(1,"rgba(0,0,0,0)");
            c.fillStyle=glow; c.beginPath(); c.arc(0,0,30,0,Math.PI*2); c.fill();
        }
        var hg=c.createLinearGradient(-11,-13,11,13);
        hg.addColorStop(0,ls2HitFlash>0?"#ff8b87":"#d6ffdc");
        hg.addColorStop(.42,ls2HitFlash>0?"#ff2828":"#45ff78");
        hg.addColorStop(1,ls2HitFlash>0?"#9e0000":"#07943a");
        c.fillStyle=hg; c.strokeStyle=ls2HitFlash>0?"#ffb5b5":"#e3ffe9"; c.lineWidth=1.4;
        if (!ls2ReduceEffects) { c.shadowColor=ls2HitFlash>0?"#ff2222":"#46ff82"; c.shadowBlur=14; }
        c.beginPath(); c.moveTo(0,13); c.bezierCurveTo(-3,10,-15,1,-13,-7);
        c.bezierCurveTo(-12,-16,-3,-17,0,-9); c.bezierCurveTo(4,-17,13,-15,13,-7);
        c.bezierCurveTo(15,1,4,10,0,13); c.closePath(); c.fill(); c.stroke();
        c.shadowBlur=0; c.fillStyle="rgba(255,255,255,.92)";
        c.beginPath(); c.ellipse(-5,-8,2.2,3.3,-.35,0,Math.PI*2); c.fill();
        c.restore();
    }
    function ls2DrawWarnings(c) {
        if (ls2WarningTimer <= 0) return;
        var box=LS2_BOX;
        var p=[
            {x:200,y:box.y+15,tx:200,ty:box.y+35,angle:0},
            {x:box.x+box.w-15,y:LS2_HEART_Y,tx:box.x+box.w-35,ty:LS2_HEART_Y,angle:Math.PI/2},
            {x:200,y:box.y+box.h-15,tx:200,ty:box.y+box.h-35,angle:Math.PI},
            {x:box.x+15,y:LS2_HEART_Y,tx:box.x+35,ty:LS2_HEART_Y,angle:-Math.PI/2}
        ][ls2NextAttackDir];
        c.save(); c.globalAlpha=.55+Math.abs(Math.sin(ls2Elapsed*.35))*.4;
        c.strokeStyle="#ff6853"; c.fillStyle="#ffb19f"; c.lineWidth=2.8;
        if (!ls2ReduceEffects) { c.shadowColor="#ff3020"; c.shadowBlur=12; }
        c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(p.tx,p.ty); c.stroke();
        c.translate(p.tx,p.ty); c.rotate(p.angle);
        c.beginPath(); c.moveTo(-6,-5); c.lineTo(0,5); c.lineTo(6,-5); c.stroke();
        c.restore();
    }
    function ls2DrawUI(c) {
        c.save(); c.fillStyle="#f2fff5"; c.textAlign="center";
        c.font="900 13px Arial,sans-serif"; c.fillText("ЖИВОЙ КАМЕНЬ · СУПЕР-ВЕРСИЯ",200,17);
        c.fillStyle="rgba(0,0,0,.72)"; c.fillRect(44,27,312,13);
        c.fillStyle="#28110f"; c.fillRect(48,30,304,7);
        var ratio=ls2BossMaxHp>0?Math.max(0,ls2BossHp/ls2BossMaxHp):1;
        var hpG=c.createLinearGradient(48,0,352,0);
        hpG.addColorStop(0,"#7a110e"); hpG.addColorStop(.55,"#e12b20"); hpG.addColorStop(1,"#ff7660");
        c.fillStyle=hpG; c.fillRect(48,30,304*ratio,7);
        c.strokeStyle="rgba(255,110,85,.75)"; c.lineWidth=1; c.strokeRect(48,30,304,7);
        c.fillStyle="#d7ffe1"; c.font="bold 10px Arial,sans-serif";
        c.fillText("ЗЕЛЁНАЯ ДУША · HP "+Math.ceil(ls2PlayerHp)+"/"+ls2PlayerMaxHp,200,222);
        c.fillStyle="#9affb5"; c.font="bold 11px Arial,sans-serif";
        c.fillText("ЩИТ: "+LS2_DIR_NAMES[ls2ShieldDir],200,235);
        c.fillStyle="rgba(0,0,0,.70)"; c.fillRect(45,466,310,22);
        c.fillStyle="#e4ffeb"; c.font="bold 9px Arial,sans-serif";
        c.fillText("СЕРДЦЕ НЕ ДВИГАЕТСЯ · ПОВОРАЧИВАЙ ЩИТ",200,480);
        if (ls2FloatingTimer>0) {
            c.fillStyle=ls2HitFlash>0?"#ff8d82":"#caffd5"; c.font="900 11px Arial,sans-serif";
            c.fillText(ls2FloatingText,200,210);
        }
        c.restore();
    }
    function ls2Render(now) {
        if (!ls2Active || !ls2Ctx) return;
        var dt=ls2LastTime?Math.min(2.2,Math.max(.35,(now-ls2LastTime)/(1000/60))):1;
        ls2LastTime=now; ls2Update(dt);
        if (!ls2Active || !ls2Ctx) return;
        if(typeof tickSupers==="function"){try{tickSupers();}catch(e){}}
        var c=ls2Ctx; c.save(); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,400,500);
        ls2DrawBackground(c,now);
        ls2DrawStoneMonster(c,now);
        ls2DrawUI(c);
        var box=LS2_BOX;
        c.fillStyle="rgba(0,7,5,.80)"; c.fillRect(box.x,box.y,box.w,box.h);
        if (!ls2ReduceEffects) {
            var fieldGlow=c.createRadialGradient(200,366,8,200,366,185);
            fieldGlow.addColorStop(0,"rgba(17,122,61,.10)"); fieldGlow.addColorStop(1,"rgba(0,0,0,0)");
            c.fillStyle=fieldGlow; c.fillRect(box.x,box.y,box.w,box.h);
        }
        c.strokeStyle="#2f9d56"; c.lineWidth=5; c.strokeRect(box.x,box.y,box.w,box.h);
        c.strokeStyle="rgba(174,255,192,.75)"; c.lineWidth=1.2;
        c.strokeRect(box.x+5,box.y+5,box.w-10,box.h-10);
        ls2DrawWarnings(c);
        for (var i=0;i<ls2Bullets.length;i++) ls2DrawBullet(c,ls2Bullets[i]);
        for (var j=0;j<ls2Sparks.length;j++) {
            var p=ls2Sparks[j]; c.save(); c.globalAlpha=Math.max(0,p.life/p.maxLife);
            c.fillStyle=p.color; if (!ls2ReduceEffects) { c.shadowColor=p.color; c.shadowBlur=7; }
            c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fill(); c.restore();
        }
        ls2DrawShield(c); ls2DrawHeart(c,now); c.restore();
        if(typeof renderSuperVisuals==="function"){try{renderSuperVisuals();}catch(e){}}
        ls2Frame=requestAnimationFrame(ls2Render);
    }

    function ls2Stop(restoreMainScreen) {
        if (!ls2Active && !ls2ChoicePending) return;
        ls2Active=false; ls2ChoicePending=false; window.livingStoneSuperActive=false;
        if (ls2Frame) cancelAnimationFrame(ls2Frame);
        ls2Frame=0;
        if (ls2Canvas && ls2PointerHandler) ls2Canvas.removeEventListener("pointerdown",ls2PointerHandler);
        ls2PointerHandler=null;
        if (ls2KeyHandler) window.removeEventListener("keydown",ls2KeyHandler,true);
        ls2KeyHandler=null; ls2RemoveControls();
        var overlay=document.getElementById("arenaOverlay");
        if (overlay) { overlay.classList.remove("living-stone-super-arena"); overlay.style.display="none"; }
        if (typeof arenaActive!=="undefined") arenaActive=ls2PreviousArenaActive;
        if (typeof window.MBEndBossGraphicsModeForFight==="function") {
            try { window.MBEndBossGraphicsModeForFight(); } catch(e) {}
        }
        ls2Canvas=null; ls2Ctx=null; ls2Bullets=[]; ls2Sparks=[];
        if (restoreMainScreen && Number(typeof wave!=="undefined"?wave:0)===2000 &&
            typeof currentEnemy!=="undefined" && currentEnemy && currentEnemy.hp>0 &&
            typeof generateEnemy==="function") generateEnemy();
    }

    function startLivingStoneSuperFight(graphicsModeChoice) {
        if (ls2Active || ls2ChoicePending) return;
        if (Number(typeof wave!=="undefined"?wave:0)!==2000) return;
        if (typeof currentEnemy==="undefined" || !currentEnemy || currentEnemy.hp<=0) return;
        if (typeof defeatedBosses!=="undefined" && Array.isArray(defeatedBosses) && defeatedBosses.includes(2000)) {
            if (typeof showFloatingText==="function") showFloatingText("⏭️ Супер-Живой Камень уже побеждён!","#ffb34d");
            return;
        }
        if (graphicsModeChoice!=="full" && graphicsModeChoice!=="light" &&
            typeof window.MBChooseBossGraphicsMode==="function") {
            ls2ChoicePending=true;
            window.MBChooseBossGraphicsMode("Живой Камень: Супер-версия",function(mode) {
                ls2ChoicePending=false; startLivingStoneSuperFight(mode);
            });
            return;
        }
        ls2ChoicePending=false;
        if ((graphicsModeChoice==="full" || graphicsModeChoice==="light") &&
            typeof window.MBSetBossGraphicsModeForFight==="function") {
            window.MBSetBossGraphicsModeForFight(graphicsModeChoice);
        }
        ls2PreviousArenaActive=typeof arenaActive!=="undefined"?arenaActive:false;
        ls2ReduceEffects=!!(window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects());
        ls2Active=true; window.livingStoneSuperActive=true;
        ls2BossMaxHp=Math.max(1000000,Number(currentEnemy.maxHp)||1250000);
        ls2BossHp=ls2BossMaxHp; ls2PlayerMaxHp=180; ls2PlayerHp=ls2PlayerMaxHp;
        ls2Invulnerable=0; ls2HitFlash=0; ls2ShieldFlash=0; ls2ShieldDir=0;
        ls2Bullets=[]; ls2Sparks=[]; ls2Elapsed=0; ls2AttackTimer=54;
        ls2WarningTimer=0; ls2NextAttackDir=0; ls2AttackCount=0;
        ls2FloatingText="ПОВЕРНИ ЩИТ К СТОРОНЕ АТАКИ"; ls2FloatingTimer=100; ls2LastTime=0;
        if (typeof hpDecayInterval !== "undefined" && hpDecayInterval) {
            clearInterval(hpDecayInterval); hpDecayInterval = null;
        }
        if (typeof fireInterval !== "undefined" && fireInterval) {
            clearInterval(fireInterval); fireInterval = null;
        }
        if (typeof stopAllMusic==="function") { try { stopAllMusic(); } catch(e) {} }
        if (typeof initArena==="function") { try { initArena(); } catch(e) {} }
        if (typeof canvas==="undefined" || !canvas) {
            ls2Active=false; window.livingStoneSuperActive=false;
            if (typeof window.MBEndBossGraphicsModeForFight==="function") window.MBEndBossGraphicsModeForFight();
            return;
        }
        ls2Canvas=canvas; ls2Ctx=ls2Canvas.getContext("2d");
        if (!ls2Ctx) {
            ls2Active=false; window.livingStoneSuperActive=false;
            if (typeof window.MBEndBossGraphicsModeForFight==="function") window.MBEndBossGraphicsModeForFight();
            return;
        }
        ls2Canvas.width=400; ls2Canvas.height=500;
        if (typeof arenaActive!=="undefined") arenaActive=false;
        ls2HideMainButtons();
        var overlay=document.getElementById("arenaOverlay");
        if (overlay) {
            overlay.classList.remove("anti-spiral-arena");
            overlay.classList.add("living-stone-super-arena");
            overlay.style.display="flex";
        }
        var nameEl=document.getElementById("arenaBossName");
        if (nameEl) nameEl.textContent="🪨 ЖИВОЙ КАМЕНЬ: СУПЕР-ВЕРСИЯ";
        var hpEl=document.getElementById("arenaHP"); if (hpEl) hpEl.textContent=ls2PlayerHp;
        var timerEl=document.getElementById("arenaTimer"); if (timerEl) timerEl.textContent="∞";
        ls2CreateControls();
        ls2KeyHandler=ls2OnKeyDown; window.addEventListener("keydown",ls2KeyHandler,true);
        ls2PointerHandler=function(ev) {
            if (!ls2Active) return;
            ev.preventDefault(); ev.stopPropagation(); ls2ChooseFromPointer(ev);
        };
        ls2Canvas.addEventListener("pointerdown",ls2PointerHandler,{passive:false});
        if(typeof initSuperState==="function"){try{initSuperState();}catch(e){}}
        if(typeof updateSuperButton==="function"){try{updateSuperButton();}catch(e){}}
        if(typeof window!=="undefined" && window.__mbBossTestMode && window.__mbBossTestAbilityMode==="ultimate") {
            var testSuperButton=document.getElementById("superBtn"); if(testSuperButton)testSuperButton.style.display="block";
        }
        ls2Render(performance.now());
    }

    // Exported now so the next stage's player-bullet system can damage this boss.
    function ls2DamageBoss(amount) {
        if (!ls2Active || !(Number(amount)>0)) return false;
        ls2BossHp=Math.max(0,ls2BossHp-Number(amount));
        if (ls2BossHp<=0) {
            if (typeof window!=="undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===2000) {
                ls2Stop(false);
                if(typeof window.MBBossTestFinish==="function")window.MBBossTestFinish("win",true);
                return true;
            }
            if (typeof window!=="undefined" && window.__mbBossTestMode && typeof window.MBBossTestModifyOutgoingDamage==="function") {
                amount=window.MBBossTestModifyOutgoingDamage(amount,1);
                ls2BossHp=Math.max(0,ls2BossHp+Number(amount));
            }
            if (typeof defeatedBosses!=="undefined" && Array.isArray(defeatedBosses) &&
                !defeatedBosses.includes(2000)) {
                defeatedBosses.push(2000);
                if (typeof saveAll==="function") saveAll();
            }
            ls2Stop(false);
            if (typeof currentEnemy!=="undefined" && currentEnemy) currentEnemy.hp=0;
            if (typeof victory==="function") victory();
        }
        return true;
    }

    window.startLivingStoneSuperFight=startLivingStoneSuperFight;
    window.stopLivingStoneSuperFight=function(){ls2Stop(!(window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===2000));};
    window.damageLivingStoneSuperBoss=ls2DamageBoss;
    window.getLivingStoneSuperHeart=function(){return {x:LS2_HEART_X,y:LS2_HEART_Y,shieldDir:ls2ShieldDir,hp:ls2PlayerHp,maxHp:ls2PlayerMaxHp};};
    window.getLivingStoneSuperBossHp=function(){return ls2BossHp;};
    window.getLivingStoneSuperBossMaxHp=function(){return ls2BossMaxHp;};
    window.setLivingStoneSuperBossHp=function(v){ls2BossHp=Math.max(1,Math.min(ls2BossHp,Number(v)||1));};
    window.setLivingStoneSuperPlayerHp=function(v){ls2PlayerHp=Math.max(1,Math.min(ls2PlayerMaxHp,Number(v)||1));};
    window.getLivingStoneSuperAttacks=function(){return ls2Bullets;};
    window.getLivingStoneSuperParticles=function(){return ls2Sparks;};
    window.isLivingStoneSuperActive=function(){return ls2Active;};
})();