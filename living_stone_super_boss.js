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

    var LS2_CENTER_X = 200, LS2_CENTER_Y = 366;
    var LS2_HEART_X = LS2_CENTER_X, LS2_HEART_Y = LS2_CENTER_Y;
    var ls2Phase = "intro", ls2PhaseTimer = 0, ls2NormalDuration = 1200, ls2GreenCount = 0;
    var ls2NativeMode = false;
    var ls2GravityDuration = 150, ls2GravityStartX = LS2_CENTER_X, ls2GravityStartY = LS2_CENTER_Y;
    var ls2PlayerAttackCooldown = 0, ls2BossStrikeFlash = 0, ls2HeldKeys = {}, ls2KeyUpHandler = null;
    var LS2_BOX = { x: 38, y: 242, w: 324, h: 222 };
    var LS2_DIR_NAMES = ["↑ ВВЕРХ", "→ ВПРАВО", "↓ ВНИЗ", "← ВЛЕВО"];
    var LS2_DIR_KEYS = {
        ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1,
        ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3
    };
    var LS2_ATTACK_SEQUENCE = [0, 3, 0, 1, 2, 3, 1, 0, 2, 1, 3, 2];

    function ls2SetShield(direction) {
        if (!ls2Active) return;
        direction = ((direction % 4) + 4) % 4;
        if (ls2NativeMode) {
            if (window.__mbLS2GreenPhase === "green") {
                window.__mbLS2ShieldDir = direction;
                if (typeof window.MBPlayLivingStoneSuperShieldSound === "function") window.MBPlayLivingStoneSuperShieldSound();
            }
            return;
        }
        if (ls2Phase === "normal") {
            var step = 28;
            if (direction === 0) LS2_HEART_Y -= step;
            else if (direction === 1) LS2_HEART_X += step;
            else if (direction === 2) LS2_HEART_Y += step;
            else LS2_HEART_X -= step;
            LS2_HEART_X = Math.max(LS2_BOX.x + 18, Math.min(LS2_BOX.x + LS2_BOX.w - 18, LS2_HEART_X));
            LS2_HEART_Y = Math.max(LS2_BOX.y + 18, Math.min(LS2_BOX.y + LS2_BOX.h - 18, LS2_HEART_Y));
            return;
        }
        if (ls2Phase !== "green") return;
        ls2ShieldDir = direction;
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
        if (!ls2Active || !ls2Canvas || ls2Phase === "intro" || ls2Phase === "gravity") return;
        var rect = ls2Canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = (ev.clientX - rect.left) * 400 / rect.width;
        var y = (ev.clientY - rect.top) * 500 / rect.height;
        if (ls2Phase === "normal") {
            if (y < 230 && x > 72 && x < 328) {
                if (ls2PlayerAttackCooldown <= 0) {
                    var rawDamage = Number(typeof window !== "undefined" ? window.playerFinalDamage : 1) || 1;
                    var attackDamage = Math.max(1, Math.min(9000, Math.floor(rawDamage)));
                    ls2PlayerAttackCooldown = 17;
                    ls2BossStrikeFlash = 17;
                    ls2SpawnSparks(Math.max(95, Math.min(305, x)), Math.max(72, Math.min(205, y)), "#ff6b4f", 12);
                    ls2PlayTone(145, "sawtooth", 0.11, 0.055);
                    ls2SetMessage("УДАР ПО ЖИВОМУ КАМНЮ  -" + attackDamage, 36);
                    ls2DamageBoss(attackDamage);
                }
                return;
            }
            LS2_HEART_X = Math.max(LS2_BOX.x + 18, Math.min(LS2_BOX.x + LS2_BOX.w - 18, x));
            LS2_HEART_Y = Math.max(LS2_BOX.y + 18, Math.min(LS2_BOX.y + LS2_BOX.h - 18, y));
            return;
        }
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
        var direction = Object.prototype.hasOwnProperty.call(LS2_DIR_KEYS, key) ? LS2_DIR_KEYS[key] : null;
        if (direction !== null) {
            ev.preventDefault(); ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
            if (ls2Phase === "green") ls2SetShield(direction);
            else if (ls2Phase === "normal") ls2HeldKeys[key] = true;
        }
    }
    function ls2OnKeyUp(ev) {
        var key = ev && ev.key || "";
        if (Object.prototype.hasOwnProperty.call(ls2HeldKeys, key)) delete ls2HeldKeys[key];
    }
    function ls2OnNativeKeyDown(ev) {
        if (!ls2NativeMode || !window.livingStoneSuperActive) return;
        var key = ev.key || "";
        if (key === "Escape") {
            ev.preventDefault(); ev.stopPropagation();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
            ls2Stop(true); return;
        }
        if (window.__mbLS2GreenPhase !== "green") return;
        var map = { ArrowUp:0, w:0, W:0, ArrowRight:1, d:1, D:1,
            ArrowDown:2, s:2, S:2, ArrowLeft:3, a:3, A:3 };
        if (!Object.prototype.hasOwnProperty.call(map,key)) return;
        ev.preventDefault(); ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        window.__mbLS2ShieldDir = map[key];
        ls2SetShield(map[key]);
    }
    function ls2SetControlVisibility() {
        if (!ls2Pad) return;
        if (ls2NativeMode) ls2Pad.style.display = window.__mbLS2GreenPhase === "green" ? "grid" : "none";
        else ls2Pad.style.display = (ls2Phase === "normal" || ls2Phase === "green") ? "grid" : "none";
    }
    function ls2EnterNormal(afterGreen) {
        ls2Phase = "normal"; ls2PhaseTimer = 0;
        ls2NormalDuration = afterGreen ? 900 : 1200;
        LS2_HEART_X = LS2_CENTER_X; LS2_HEART_Y = LS2_CENTER_Y;
        ls2Bullets = []; ls2WarningTimer = 0; ls2AttackTimer = 44;
        ls2FloatingText = afterGreen ? "КРАСНАЯ ДУША ВЕРНУЛАСЬ: УВОРАЧИВАЙСЯ И БЕЙ" : "ДВИГАЙСЯ И АТАКУЙ: ЖМИ НА КАМЕНЬ";
        ls2FloatingTimer = 100;
        ls2SetControlVisibility();
    }
    function ls2BeginGravity() {
        ls2Phase = "gravity"; ls2PhaseTimer = 0;
        ls2GravityDuration = ls2GreenCount === 0 ? 150 : 82;
        ls2GravityStartX = LS2_HEART_X; ls2GravityStartY = LS2_HEART_Y;
        ls2Bullets = []; ls2WarningTimer = 0; ls2Sparks = [];
        ls2SetMessage("ТЕПЕРЬ ТЫ НЕ СДВИНЕШЬСЯ С МЕСТА", 110);
        ls2PlayTone(58, "sawtooth", 0.28, 0.06);
        ls2SetControlVisibility();
    }
    function ls2EnterGreen() {
        ls2Phase = "green"; ls2PhaseTimer = 0; ls2GreenCount++;
        LS2_HEART_X = LS2_CENTER_X; LS2_HEART_Y = LS2_CENTER_Y;
        ls2ShieldDir = (ls2GreenCount % 4);
        ls2Invulnerable = Math.max(ls2Invulnerable, 35);
        ls2Bullets = []; ls2WarningTimer = 0; ls2AttackTimer = 34;
        ls2SetMessage("ЗЕЛЁНАЯ ДУША! ЩИТ ДОЛЖЕН СМОТРЕТЬ НА АТАКУ", 115);
        ls2PlayTone(410, "triangle", 0.18, 0.05);
        ls2SetControlVisibility();
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
        ls2SetMessage(ls2Phase === "green" ? "ЩИТ НЕ С ТОЙ СТОРОНЫ!" : "СНАРЯД ПОПАЛ! УВОРАЧИВАЙСЯ", 48);
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
            if (typeof window.MBPreserveGarouChargesForUniqueBossRetry === "function") {
                window.MBPreserveGarouChargesForUniqueBossRetry("stoneSuper");
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
        if (ls2PlayerAttackCooldown > 0) ls2PlayerAttackCooldown = Math.max(0, ls2PlayerAttackCooldown - dt);
        if (ls2BossStrikeFlash > 0) ls2BossStrikeFlash = Math.max(0, ls2BossStrikeFlash - dt);
        ls2PhaseTimer += dt;
        if (ls2Phase === "intro") {
            var approach = Math.min(1, ls2PhaseTimer / 108);
            LS2_HEART_X = LS2_CENTER_X;
            LS2_HEART_Y = 446 - 80 * (1 - Math.pow(1 - approach, 3));
            if (ls2PhaseTimer >= 270) ls2StartNativeGameplay();
            return;
        }
        if (ls2Phase === "gravity") {
            var gp = Math.min(1, ls2PhaseTimer / Math.max(1, ls2GravityDuration));
            var ease = gp * gp * (3 - 2 * gp);
            LS2_HEART_X = ls2GravityStartX + (LS2_CENTER_X - ls2GravityStartX) * ease;
            LS2_HEART_Y = ls2GravityStartY + (446 - ls2GravityStartY) * ease;
            if (Math.random() < (ls2ReduceEffects ? 0.05 : 0.18)) {
                ls2SpawnSparks(LS2_HEART_X + (Math.random() - .5) * 80, 425 + Math.random() * 35, "#c8ffd5", 2);
            }
            if (ls2PhaseTimer >= ls2GravityDuration) ls2EnterGreen();
            return;
        }
        if (ls2Phase === "normal") {
            var mx = 0, my = 0;
            if (ls2HeldKeys.ArrowLeft || ls2HeldKeys.a || ls2HeldKeys.A) mx--;
            if (ls2HeldKeys.ArrowRight || ls2HeldKeys.d || ls2HeldKeys.D) mx++;
            if (ls2HeldKeys.ArrowUp || ls2HeldKeys.w || ls2HeldKeys.W) my--;
            if (ls2HeldKeys.ArrowDown || ls2HeldKeys.s || ls2HeldKeys.S) my++;
            if (mx && my) { mx *= 0.7071; my *= 0.7071; }
            LS2_HEART_X += mx * 3.3 * dt;
            LS2_HEART_Y += my * 3.3 * dt;
            LS2_HEART_X = Math.max(LS2_BOX.x + 18, Math.min(LS2_BOX.x + LS2_BOX.w - 18, LS2_HEART_X));
            LS2_HEART_Y = Math.max(LS2_BOX.y + 18, Math.min(LS2_BOX.y + LS2_BOX.h - 18, LS2_HEART_Y));
            if (ls2PhaseTimer >= ls2NormalDuration) { ls2BeginGravity(); return; }
        } else if (ls2Phase === "green" && ls2PhaseTimer >= 420) {
            ls2EnterNormal(true); return;
        }
        if (ls2WarningTimer > 0) {
            ls2WarningTimer -= dt;
            if (ls2WarningTimer <= 0) {
                ls2SpawnAttackWave(ls2NextAttackDir);
                if (ls2Phase === "green") ls2AttackTimer = Math.max(42, 82 - Math.min(34, ls2AttackCount * 2.2));
                else ls2AttackTimer = Math.max(52, 102 - Math.min(28, ls2AttackCount * 0.65));
            }
        } else {
            ls2AttackTimer -= dt;
            if (ls2AttackTimer <= 0) {
                ls2NextAttackDir = LS2_ATTACK_SEQUENCE[ls2AttackCount % LS2_ATTACK_SEQUENCE.length];
                ls2WarningTimer = ls2Phase === "green" ? 25 : 20;
            }
        }
        for (var i = ls2Bullets.length - 1; i >= 0; i--) {
            var b = ls2Bullets[i];
            b.x += b.vx * dt; b.y += b.vy * dt; b.spin += 0.07 * dt; b.life -= dt;
            var dx = b.x - LS2_HEART_X, dy = b.y - LS2_HEART_Y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            if (ls2Phase === "green" && distance <= 27 && b.side === ls2ShieldDir) {
                ls2SpawnSparks(b.x, b.y, "#73ff9b", 7);
                ls2ShieldFlash = 12; ls2PlayTone(520, "triangle", 0.045, 0.025);
                ls2Bullets.splice(i, 1); continue;
            }
            if (distance <= (ls2Phase === "green" ? 13 : 16)) {
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
    function ls2DrawJaggedSpikes(c, now, bossY) {
        c.save(); c.translate(200, typeof bossY === "number" ? bossY : 128);
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
    function ls2DrawStoneFallback(c, bossY) {
        c.save(); c.translate(200, typeof bossY === "number" ? bossY : 128);
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
        var approach = ls2Phase === "intro" ? Math.min(1, ls2PhaseTimer / 108) : 1;
        var stoneY = 128;
        if (ls2Phase === "intro") stoneY = -34 + 162 * (approach * approach * (3 - 2 * approach));
        else if (ls2Phase === "gravity") stoneY = 120 + Math.sin(ls2PhaseTimer * 0.55) * 3;
        ls2DrawJaggedSpikes(c, now, stoneY);
        if (typeof drawLivingStoneBoss === "function" && typeof livingStoneBoss !== "undefined" &&
            typeof livingStoneState !== "undefined") {
            var oldBoss = livingStoneBoss, oldState = livingStoneState, oldFlash = livingStoneBossFlash;
            var oldFinalActive = finalSceneActive, oldFinalPhase = finalScenePhase;
            var oldCracks = finalCracksLevel, oldTimer = finalSceneTimer, oldLaugh = finalLaughOffset;
            var oldQteShake = qteBossShake, oldQteDamage = qteBossDamageLevel;
            try {
                livingStoneBoss = { x: 200, y: stoneY, size: ls2Phase === "intro" ? 56 + approach * 3 : 59, vx: 0, rotation: Math.sin(now / 900) * 0.055 };
                livingStoneState = "phase2"; livingStoneBossFlash = 0;
                finalSceneActive = true; finalScenePhase = "laugh";
                finalCracksLevel = ls2ReduceEffects ? 0.3 : 0.95;
                finalSceneTimer = now / 16; finalLaughOffset = Math.sin(now / 120) * 1.6;
                qteBossShake = ls2Phase === "gravity" ? 4 : 0; qteBossDamageLevel = 0;
                drawLivingStoneBoss();
            } catch (e) {
                ls2DrawStoneFallback(c, stoneY);
            } finally {
                livingStoneBoss = oldBoss; livingStoneState = oldState; livingStoneBossFlash = oldFlash;
                finalSceneActive = oldFinalActive; finalScenePhase = oldFinalPhase;
                finalCracksLevel = oldCracks; finalSceneTimer = oldTimer; finalLaughOffset = oldLaugh;
                qteBossShake = oldQteShake; qteBossDamageLevel = oldQteDamage;
            }
        } else ls2DrawStoneFallback(c, stoneY);
        c.save(); c.translate(200, stoneY); c.lineCap = "round"; c.lineJoin = "round";
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
        if (ls2BossStrikeFlash > 0) {
            c.globalAlpha = Math.min(0.9, ls2BossStrikeFlash / 17);
            c.fillStyle = "#fff6dd"; c.beginPath(); c.arc(0, 0, 88 + (17 - ls2BossStrikeFlash) * 2, 0, Math.PI * 2); c.fill();
        }
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
        var greenSoul = ls2Phase === "green" || (ls2Phase === "gravity" && ls2PhaseTimer > ls2GravityDuration * 0.55);
        c.save(); c.translate(LS2_HEART_X, LS2_HEART_Y);
        if (ls2Phase === "gravity") {
            c.translate(0, Math.sin(ls2PhaseTimer * 0.8) * 1.5);
            c.scale(1 + Math.min(0.18, ls2PhaseTimer / ls2GravityDuration * 0.18), 0.72);
        }
        if (!ls2ReduceEffects) {
            var glow=c.createRadialGradient(0,0,2,0,0,30);
            glow.addColorStop(0,ls2HitFlash>0?"rgba(255,50,50,.65)":(greenSoul?"rgba(65,255,125,.42)":"rgba(255,55,55,.42)"));
            glow.addColorStop(1,"rgba(0,0,0,0)");
            c.fillStyle=glow; c.beginPath(); c.arc(0,0,30,0,Math.PI*2); c.fill();
        }
        var hg=c.createLinearGradient(-11,-13,11,13);
        hg.addColorStop(0,ls2HitFlash>0?"#ff8b87":(greenSoul?"#d6ffdc":"#ffd1d1"));
        hg.addColorStop(.42,ls2HitFlash>0?"#ff2828":(greenSoul?"#45ff78":"#ff4545"));
        hg.addColorStop(1,ls2HitFlash>0?"#9e0000":(greenSoul?"#07943a":"#9e0000"));
        c.fillStyle=hg; c.strokeStyle=greenSoul?"#e3ffe9":"#ffe0e0"; c.lineWidth=1.4;
        if (!ls2ReduceEffects) { c.shadowColor=ls2HitFlash>0?"#ff2222":(greenSoul?"#46ff82":"#ff2828"); c.shadowBlur=14; }
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
        var isGreen = ls2Phase === "green";
        c.fillStyle=isGreen?"#d7ffe1":"#ffdada"; c.font="bold 10px Arial,sans-serif";
        c.fillText((isGreen ? "ЗЕЛЁНАЯ ДУША" : "КРАСНАЯ ДУША")+" · HP "+Math.ceil(ls2PlayerHp)+"/"+ls2PlayerMaxHp,200,222);
        c.fillStyle=isGreen?"#9affb5":"#ffb5b5"; c.font="bold 11px Arial,sans-serif";
        if (ls2Phase === "intro") {
            var line = ls2PhaseTimer < 90 ? "ТЫ СНОВА ВЕРНУЛСЯ..." : (ls2PhaseTimer < 180 ? "Я ПОМНЮ НАШУ ПРОШЛУЮ ВСТРЕЧУ." : "ПОКАЖИ, ЧТО В ЭТОТ РАЗ ТЫ СИЛЬНЕЕ.");
            c.fillStyle="#fff0e9"; c.font="900 13px Arial,sans-serif";
            c.fillText(line,200,405);
            c.fillStyle="#ffb8a7"; c.font="bold 10px Arial,sans-serif";
            c.fillText(ls2PhaseTimer < 150 ? "ЖИВОЙ КАМЕНЬ" : "ПЕРВАЯ ФАЗА · 20 СЕКУНД",200,425);
        } else if (ls2Phase === "gravity") {
            c.fillStyle="#e4ffe9"; c.font="900 12px Arial,sans-serif";
            c.fillText(ls2PhaseTimer < ls2GravityDuration * .55 ? "ГРАВИТАЦИЯ ПРИДАВЛИВАЕТ ТЕБЯ К ЗЕМЛЕ" : "ТВОЯ ДУША МЕНЯЕТ ЦВЕТ...",200,405);
        } else if (isGreen) {
            c.fillText("ЩИТ: "+LS2_DIR_NAMES[ls2ShieldDir],200,235);
        } else {
            c.fillText("WASD / СТРЕЛКИ · БОЙ "+Math.max(0,Math.ceil((ls2NormalDuration-ls2PhaseTimer)/60))+" СЕК.",200,235);
        }
        c.fillStyle="rgba(0,0,0,.70)"; c.fillRect(35,466,330,22);
        c.fillStyle="#e4ffeb"; c.font="bold 9px Arial,sans-serif";
        if (ls2Phase === "intro") c.fillText("ОН СНОВА ПЕРЕД ТОБОЙ",200,480);
        else if (ls2Phase === "gravity") c.fillText("СОПРОТИВЛЕНИЕ БЕСПОЛЕЗНО...",200,480);
        else if (isGreen) c.fillText("ПОВЕРНИ ЩИТ К СТОРОНЕ АТАКИ",200,480);
        else c.fillText("КЛИКНИ ПО КАМНЮ, ЧТОБЫ АТАКОВАТЬ · УКЛОНЯЙСЯ ОТ СНАРЯДОВ",200,480);
        if (ls2FloatingTimer>0 && ls2Phase !== "intro") {
            c.fillStyle=ls2HitFlash>0?"#ff8d82":"#caffd5"; c.font="900 11px Arial,sans-serif";
            c.fillText(ls2FloatingText,200,210);
        }
        c.restore();
    }
    function ls2DrawGravityCinematic(c, now) {
        var progress = Math.min(1, ls2PhaseTimer / Math.max(1, ls2GravityDuration));
        c.save();
        c.fillStyle="rgba(0,0,0," + (0.12 + progress * 0.38) + ")"; c.fillRect(0,0,400,500);
        var count = ls2ReduceEffects ? 7 : 18;
        c.strokeStyle="rgba(167,255,192,.50)"; c.lineWidth=ls2ReduceEffects?1:1.6;
        for (var i=0;i<count;i++) {
            var x=(i*47+Math.sin(now/160+i)*11)%400;
            var len=20+(i%4)*13;
            c.beginPath(); c.moveTo(x, (now*.32+i*57)%480); c.lineTo(x+Math.sin(now/240+i)*4, (now*.32+i*57)%480+len); c.stroke();
        }
        c.fillStyle="#080b08"; c.fillRect(0,445,400,55);
        c.strokeStyle="#a0ffb1"; c.lineWidth=2; c.beginPath();
        c.moveTo(0,446); c.lineTo(78,443); c.lineTo(112,450); c.lineTo(160,445); c.lineTo(200,448); c.lineTo(245,442); c.lineTo(304,450); c.lineTo(350,444); c.lineTo(400,447); c.stroke();
        if (!ls2ReduceEffects) {
            c.strokeStyle="rgba(202,255,213,"+(0.25+progress*.55)+")"; c.lineWidth=3;
            for (var k=0;k<5;k++) { c.beginPath(); c.moveTo(55+k*72,85); c.lineTo(200+(k-2)*12,430); c.stroke(); }
        }
        c.restore();
    }

    function ls2Render(now) {
        if (!ls2Active || !ls2Ctx) return;
        var dt=ls2LastTime?Math.min(2.2,Math.max(.35,(now-ls2LastTime)/(1000/60))):1;
        ls2LastTime=now; ls2Update(dt);
        if (!ls2Active || !ls2Ctx || ls2NativeMode) return;
        if(typeof tickSupers==="function"){try{tickSupers();}catch(e){}}
        var c=ls2Ctx; c.save(); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,400,500);
        ls2DrawBackground(c,now);
        ls2DrawStoneMonster(c,now);
        if (ls2Phase === "intro") {
            ls2DrawHeart(c,now);
        } else if (ls2Phase === "gravity") {
            ls2DrawGravityCinematic(c,now);
            ls2DrawHeart(c,now);
        } else {
            var box=LS2_BOX;
            c.fillStyle=ls2Phase==="green"?"rgba(0,7,5,.80)":"rgba(12,3,4,.78)"; c.fillRect(box.x,box.y,box.w,box.h);
            if (!ls2ReduceEffects) {
                var fieldGlow=c.createRadialGradient(LS2_HEART_X,LS2_HEART_Y,8,LS2_HEART_X,LS2_HEART_Y,185);
                fieldGlow.addColorStop(0,ls2Phase==="green"?"rgba(17,122,61,.10)":"rgba(150,20,20,.10)"); fieldGlow.addColorStop(1,"rgba(0,0,0,0)");
                c.fillStyle=fieldGlow; c.fillRect(box.x,box.y,box.w,box.h);
            }
            c.strokeStyle=ls2Phase==="green"?"#2f9d56":"#a93c42"; c.lineWidth=5; c.strokeRect(box.x,box.y,box.w,box.h);
            c.strokeStyle=ls2Phase==="green"?"rgba(174,255,192,.75)":"rgba(255,180,180,.62)"; c.lineWidth=1.2;
            c.strokeRect(box.x+5,box.y+5,box.w-10,box.h-10);
            ls2DrawWarnings(c);
            for (var i=0;i<ls2Bullets.length;i++) ls2DrawBullet(c,ls2Bullets[i]);
            for (var j=0;j<ls2Sparks.length;j++) {
                var p=ls2Sparks[j]; c.save(); c.globalAlpha=Math.max(0,p.life/p.maxLife);
                c.fillStyle=p.color; if (!ls2ReduceEffects) { c.shadowColor=p.color; c.shadowBlur=7; }
                c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fill(); c.restore();
            }
            if (ls2Phase === "green") ls2DrawShield(c);
            ls2DrawHeart(c,now);
        }
        ls2DrawUI(c);
        c.restore();
        if(typeof renderSuperVisuals==="function"){try{renderSuperVisuals();}catch(e){}}
        ls2Frame=requestAnimationFrame(ls2Render);
    }

    function ls2StartNativeGameplay() {
        if (!ls2Active || ls2NativeMode) return;
        if (ls2Frame) cancelAnimationFrame(ls2Frame);
        ls2Frame = 0;
        if (ls2Canvas && ls2PointerHandler) ls2Canvas.removeEventListener("pointerdown",ls2PointerHandler);
        ls2PointerHandler = null;
        if (ls2KeyHandler) window.removeEventListener("keydown",ls2KeyHandler,true);
        if (ls2KeyUpHandler) window.removeEventListener("keyup",ls2KeyUpHandler,true);
        ls2KeyHandler = null; ls2KeyUpHandler = null; ls2HeldKeys = {};
        ls2NativeMode = true;
        ls2KeyHandler = ls2OnNativeKeyDown;
        window.addEventListener("keydown", ls2KeyHandler, true);
        ls2Phase = "native";
        window.livingStoneSuperActive = true;
        window.__mbLS2GreenPhase = "normal";
        window.__mbLS2PhaseFrames = 0;
        window.__mbLS2LastPhaseTime = typeof performance !== "undefined" ? performance.now() : Date.now();
        window.__mbLS2ShieldDir = 0;
        window.__mbLS2GravityFromX = 200;
        window.__mbLS2GravityFromY = 400;
        window.__mbLS2GreenEventCount = 0;
        ls2UniqueFrame = 0; ls2UniqueAttackTimer = 260;
        ls2UniqueAttacks = []; ls2UniqueDecoys = []; ls2UniqueCracks = [];
        ls2BossDash = null; ls2BossStun = 0; ls2DodgeCooldown = 0;
        ls2DodgeStreak = 0; ls2BossHitCount = 0; ls2ShellBreak = null;
        ls2GreenStrikeTimer = 24; ls2GreenStrikeIndex = 0; ls2GreenBlockStreak = 0;
        ls2OpenWindowPending = false; ls2LastAttackName = "Ты промахнулся";
        ls2LastPlayerX = 200; ls2LastPlayerY = 400;
        if (typeof livingStoneActive !== "undefined") livingStoneActive = true;
        if (typeof livingStoneState !== "undefined") livingStoneState = "phase2";
        if (typeof livingStoneBossMaxHp !== "undefined") livingStoneBossMaxHp = ls2BossMaxHp;
        if (typeof livingStoneBossHp !== "undefined") livingStoneBossHp = ls2BossHp;
        if (typeof livingStoneBoss !== "undefined") livingStoneBoss = { x: 200, y: 112, size: 60, vx: 1.15, rotation: 0 };
        if (typeof livingStonePlayer !== "undefined") livingStonePlayer = { x: 200, y: 400 };
        if (typeof livingStonePlayerMaxHp !== "undefined") livingStonePlayerMaxHp = ls2PlayerMaxHp;
        if (typeof livingStonePlayerHp !== "undefined") livingStonePlayerHp = ls2PlayerHp;
        if (typeof livingStoneAttacks !== "undefined") livingStoneAttacks = [];
        if (typeof livingStoneBullets !== "undefined") livingStoneBullets = [];
        if (typeof livingStoneParticles !== "undefined") livingStoneParticles = [];
        if (typeof livingStoneTexts !== "undefined") livingStoneTexts = [];
        if (typeof livingStoneAttackTimer !== "undefined") livingStoneAttackTimer = 0;
        if (typeof livingStoneAttackType !== "undefined") livingStoneAttackType = 0;
        if (typeof livingStoneTypeTimer !== "undefined") livingStoneTypeTimer = 160;
        if (typeof livingStoneShootTimer !== "undefined") livingStoneShootTimer = 0;
        if (typeof livingStoneInvulnTimer !== "undefined") livingStoneInvulnTimer = 0;
        if (typeof livingStoneBossFlash !== "undefined") livingStoneBossFlash = 0;
        if (typeof livingStoneRestoreCount !== "undefined") livingStoneRestoreCount = 1;
        if (typeof livingStoneRestoring !== "undefined") livingStoneRestoring = false;
        if (typeof finalSceneActive !== "undefined") finalSceneActive = false;
        if (typeof finalScenePhase !== "undefined") finalScenePhase = "idle";
        if (typeof finalSceneTimer !== "undefined") finalSceneTimer = 0;
        if (typeof finalBlackHole !== "undefined") finalBlackHole = null;
        if (typeof finalHeartVisible !== "undefined") finalHeartVisible = true;
        if (typeof qteCinematicActive !== "undefined") qteCinematicActive = false;
        if (typeof qteActive !== "undefined") qteActive = false;
        if (typeof lsMobileMode !== "undefined") lsMobileMode = !!ls2ReduceEffects;
        if (typeof lsPerfMult !== "undefined") lsPerfMult = ls2ReduceEffects ? 0.12 : 1;
        if (typeof lsSpeedMult !== "undefined") lsSpeedMult = 0.5;
        if (typeof activeGravityWell !== "undefined") activeGravityWell = false;
        if (typeof lsModCapsules !== "undefined") lsModCapsules = [];
        if (typeof lsModSpawnTimer !== "undefined") lsModSpawnTimer = 0;
        if (typeof lsActiveMod !== "undefined") lsActiveMod = null;
        if (typeof lsModSpawnInterval !== "undefined") lsModSpawnInterval = 1500;
        if (typeof lsModDuration !== "undefined") lsModDuration = 600;
        if (typeof lsPlayerVelocity !== "undefined") lsPlayerVelocity = { x: 0, y: 0 };
        if (typeof lsShotgunSkip !== "undefined") lsShotgunSkip = 0;
        if (typeof initLivingStoneBgParticles === "function") initLivingStoneBgParticles();
        if (typeof initLSSupers === "function") { try { initLSSupers(); } catch(e) {} }
        if (typeof window !== "undefined") window._uniqueSuperBossId = "stoneSuper";
        if (typeof canvas !== "undefined" && canvas) {
            if (typeof handleQTEClick === "function") canvas.addEventListener("click", handleQTEClick);
            if (typeof handleLSTouchStart === "function") {
                canvas.addEventListener("touchstart", handleLSTouchStart, { passive:false });
                canvas.addEventListener("touchmove", handleLSTouchMove, { passive:false });
                canvas.addEventListener("touchend", handleLSTouchEnd);
                canvas.addEventListener("touchcancel", handleLSTouchEnd);
            }
        }
        if (typeof document !== "undefined") {
            var hpEl = document.getElementById("arenaHP");
            if (hpEl) hpEl.textContent = String(livingStonePlayerHp);
            var bossName = document.getElementById("arenaBossName");
            if (bossName) bossName.textContent = "🪨 СУПЕР-ЖИВОЙ КАМЕНЬ";
        }
        ls2SetControlVisibility();
        if (typeof livingStoneRenderLoop === "function") livingStoneAnimFrame = requestAnimationFrame(livingStoneRenderLoop);
    }

    var ls2UniqueFrame = 0, ls2UniqueAttackTimer = 300;
    var ls2UniqueAttacks = [], ls2UniqueDecoys = [], ls2UniqueCracks = [];
    var ls2BossDash = null, ls2BossStun = 0, ls2DodgeCooldown = 0;
    var ls2DodgeStreak = 0, ls2BossHitCount = 0, ls2ShellBreak = null;
    var ls2GreenStrikeTimer = 25, ls2GreenStrikeIndex = 0, ls2GreenBlockStreak = 0;
    var ls2OpenWindowPending = false;
    var ls2LastPlayerX = 200, ls2LastPlayerY = 400, ls2LastAttackName = "Ты промахнулся";
    var ls2BossWobble = 0;

    function ls2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function ls2Live() {
        return ls2NativeMode && !!window.livingStoneSuperActive &&
            typeof livingStoneBoss !== "undefined" && typeof livingStonePlayer !== "undefined";
    }
    function ls2CombatText(text, color, life) {
        if (typeof spawnLivingStoneText === "function" && typeof livingStoneBoss !== "undefined")
            spawnLivingStoneText(livingStoneBoss.x, Math.max(55, livingStoneBoss.y - 45), text, color || "#9affb9", life || 70);
    }
    function ls2SpawnOrbBurst(x, y, count, speed, color, damage) {
        if (typeof livingStoneAttacks === "undefined") return;
        for (var i = 0; i < count; i++) {
            var angle = i / count * Math.PI * 2;
            livingStoneAttacks.push({
                type: "orb", x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                size: 7, damage: damage || 7, life: 180, color: color || "#85ffae",
                superStoneAttack: true
            });
        }
    }
    function ls2SpawnCrack(x, y, delay) {
        ls2UniqueCracks.push({x:ls2Clamp(x,28,372),y:ls2Clamp(y,430,485),timer:delay||52,life:(delay||52)+75});
    }
    function ls2SpawnSpecial(name) {
        if (!ls2Live()) return;
        var b = livingStoneBoss, p = livingStonePlayer;
        var px = p.x, py = p.y;
        ls2LastAttackName = name;
        if (name === "Бег по лезвию") {
            ls2BossDash = {type:"blade", step:0, timer:0, fromX:b.x, fromY:b.y,
                targets:[{x:75,y:145},{x:328,y:185},{x:145,y:108}]};
            ls2CombatText("БЕГ ПО ЛЕЗВИЮ", "#91ffb0", 95);
        } else if (name === "Я уже знаю, куда ты побежишь") {
            var vx = px - ls2LastPlayerX, vy = py - ls2LastPlayerY;
            var tx = ls2Clamp(px + vx * 10, 38, 362), ty = ls2Clamp(py + vy * 10, 255, 460);
            ls2UniqueAttacks.push({type:"predict",x:tx,y:ty,radius:27,timer:0,life:76,sourceDir:0,damage:15,active:false});
            ls2CombatText("Я УЖЕ ЗНАЮ, КУДА ТЫ ПОБЕЖИШЬ", "#ffbd78", 100);
        } else if (name === "Поймай меня, если сможешь") {
            ls2BossDash = {type:"chase",step:0,timer:0,fromX:b.x,fromY:b.y,
                targets:[{x:px<200?350:50,y:110+Math.random()*100}],playerX:px,playerY:py};
            ls2UniqueAttacks.push({type:"boulder",x:b.x,y:b.y,vx:(px-b.x)/45,vy:(py-b.y)/45,
                timer:0,delay:20,life:240,bounces:0,size:17,damage:14,sourceDir:2,trail:[]});
            ls2CombatText("ПОЙМАЙ МЕНЯ, ЕСЛИ СМОЖЕШЬ", "#ffc0a0", 100);
        } else if (name === "Пустая оболочка") {
            var cloneCount = ls2BossHitCount > 10 ? 2 : 1;
            for (var ci=0; ci<cloneCount; ci++) {
                var cx = ls2Clamp(b.x + (ci ? -95 : 95), 50, 350);
                var cy = ls2Clamp(b.y + (ci ? 35 : -15), 85, 220);
                ls2UniqueDecoys.push({x:cx,y:cy,timer:230,kind:"shell",hits:0,core:0,flash:0});
            }
            b.x = ls2Clamp(400-b.x,65,335);
            b.vx = b.x < 200 ? 1.8 : -1.8;
            ls2CombatText("ПУСТАЯ ОБОЛОЧКА: ИЩИ ЗЕЛЁНОЕ ЯДРО", "#8dffb1", 110);
        } else if (name === "Рикошетное уклонение") {
            for (var pi=0;pi<3;pi++) {
                var dx=px-b.x, dy=py-b.y, base=Math.atan2(dy,dx)+(pi-1)*0.24, speed=3.3+pi*0.35;
                ls2UniqueAttacks.push({type:"plate",x:b.x,y:b.y,vx:Math.cos(base)*speed,vy:Math.sin(base)*speed,
                    timer:0,life:240,bounces:0,size:10,damage:10,trail:[],angle:base});
            }
            b.vx *= -1;
            ls2CombatText("РИКОШЕТНОЕ УКЛОНЕНИЕ", "#a8eaff", 90);
        } else if (name === "Гравитационный бумеранг") {
            var angle=Math.atan2(py-b.y,px-b.x), speed=4.0;
            ls2UniqueAttacks.push({type:"boomerang",x:b.x,y:b.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
                timer:0,life:185,turnAt:56,stage:"out",size:15,damage:13,originX:b.x,originY:b.y,trail:[]});
            ls2CombatText("ГРАВИТАЦИОННЫЙ БУМЕРАНГ", "#d6a5ff", 90);
        } else if (name === "Ты гонишься за мной") {
            ls2BossDash = {type:"hunt",step:0,timer:0,fromX:b.x,fromY:b.y,
                targets:[{x:ls2Clamp(b.x+(px<b.x?125:-125),45,355),y:Math.max(95,b.y-25)},
                         {x:ls2Clamp(px,45,355),y:ls2Clamp(py-90,75,240)}],
                playerX:px,playerY:py};
            ls2CombatText("НЕ ГОНЯЙСЯ ЗА МНОЙ!", "#ff9b78", 90);
        } else if (name === "Камень не промахивается дважды") {
            ls2ShellBreak = {x:b.x,y:b.y,timer:20,life:45};
            ls2BossStun = Math.max(ls2BossStun,25);
            b.vx *= -1;
            ls2CombatText("Я НЕ ПРОМАХИВАЮСЬ ДВАЖДЫ", "#fff0b1", 90);
        } else if (name === "Ты промахнулся") {
            ls2BossDash = {type:"evasive",step:0,timer:0,fromX:b.x,fromY:b.y,
                targets:[{x:ls2Clamp(b.x+(px<b.x?85:-85),42,358),y:ls2Clamp(b.y+(py<b.y?35:-35),75,235)}]};
        }
        if (typeof playArenaSound === "function") playArenaSound(180 + Math.random()*90,"sawtooth",0.13,0.07);
    }

    window.MBUpdateLivingStoneSuperBossMovement = function() {
        if (!ls2Live()) return false;
        var b = livingStoneBoss, p = livingStonePlayer;
        ls2UniqueFrame++;
        if (ls2DodgeCooldown > 0) ls2DodgeCooldown--;
        if (ls2BossStun > 0) {
            ls2BossStun--;
            b.rotation += Math.sin(ls2UniqueFrame*.55)*.04;
            b.x += Math.sin(ls2UniqueFrame*.3)*.15;
            return true;
        }
        if (ls2BossDash) {
            var d=ls2BossDash; d.timer++;
            var target=d.targets[d.step];
            var duration=d.type==="evasive"?10:(d.type==="hunt"?19:24);
            var t=ls2Clamp(d.timer/duration,0,1), ease=t*t*(3-2*t);
            b.x=d.fromX+(target.x-d.fromX)*ease;
            b.y=d.fromY+(target.y-d.fromY)*ease;
            b.rotation += .06;
            if (t>=1) {
                if (d.type==="blade") {
                    ls2SpawnCrack(b.x,470,55);
                    if (typeof spawnLivingStoneParticles==="function") spawnLivingStoneParticles(b.x,b.y,7,"#63ff91",4);
                }
                d.step++;
                if (d.step>=d.targets.length) {
                    ls2BossDash=null;
                    if (d.type==="blade") {
                        ls2UniqueCracks.slice(-3).forEach(function(cr) { cr.timer = Math.min(cr.timer, 15); });
                        ls2CombatText("ТРЕЩИНЫ РАСКРЫВАЮТСЯ!", "#70ff9a", 65);
                    } else if (d.type==="chase") {
                        ls2UniqueAttacks.push({type:"boulder",x:d.fromX,y:d.fromY,vx:(d.playerX-d.fromX)/34,
                            vy:(d.playerY-d.fromY)/34,timer:12,life:230,bounces:0,size:18,damage:15,trail:[]});
                        ls2SpawnCrack(b.x,470,36);
                    } else if (d.type==="hunt") {
                        ls2SpawnCrack(d.playerX,470,42);
                        ls2BossStun=Math.max(ls2BossStun,28);
                    } else if (d.type==="evasive") {
                        ls2CombatText("ПОПРОБУЙ ЕЩЁ РАЗ!", "#d1ffdd", 48);
                    }
                } else {
                    d.fromX=b.x; d.fromY=b.y; d.timer=0;
                }
            }
            return true;
        }
        if ((window.__mbLS2GreenPhase||"normal") !== "normal") {
            b.x += b.vx * 0.45;
            if (b.x < 55) { b.x=55; b.vx=Math.abs(b.vx); }
            if (b.x > 345) { b.x=345; b.vx=-Math.abs(b.vx); }
            b.y = 112 + Math.sin(ls2UniqueFrame*.035)*25;
            b.rotation += .01;
            return true;
        }
        var hpRatio = typeof livingStoneBossHp==="number" && typeof livingStoneBossMaxHp==="number" && livingStoneBossMaxHp>0
            ? livingStoneBossHp/livingStoneBossMaxHp : 1;
        if (hpRatio < .22 && ls2UniqueAttackTimer > 135) {
            ls2UniqueAttackTimer = 135;
            ls2CombatText("ТЫ МЕНЯ НЕ ПОЙМАЕШЬ!", "#ff795f", 70);
        }
        ls2UniqueAttackTimer--;
        if (ls2UniqueAttackTimer <= 0) {
            ls2UniqueAttackTimer = hpRatio < .22 ? 145 : (270+Math.floor(Math.random()*100));
            var options=["Бег по лезвию","Я уже знаю, куда ты побежишь","Поймай меня, если сможешь",
                "Пустая оболочка","Рикошетное уклонение","Гравитационный бумеранг","Ты гонишься за мной"];
            var choice = options[Math.floor(Math.random()*options.length)];
            if (hpRatio < .22 && Math.random()<.6) choice="Ты гонишься за мной";
            ls2SpawnSpecial(choice);
        }
        if (ls2UniqueFrame % 12 < 6) b.vx += Math.sin(ls2UniqueFrame*.075)*.04;
        b.x += b.vx * (hpRatio<.22?2.0:1.35);
        if (b.x < 55) { b.x=55; b.vx=Math.abs(b.vx); }
        if (b.x > 345) { b.x=345; b.vx=-Math.abs(b.vx); }
        b.y = 105 + Math.sin(ls2UniqueFrame*.025)*32 + (hpRatio<.22?Math.sin(ls2UniqueFrame*.14)*12:0);
        b.rotation += (hpRatio<.22?.035:.012);
        return true;
    };

    window.MBLivingStoneSuperTryDodgeBullet = function(bullet) {
        if (!ls2Live() || !bullet) return false;
        var b=livingStoneBoss;
        for (var i=ls2UniqueDecoys.length-1;i>=0;i--) {
            var decoy=ls2UniqueDecoys[i];
            var dx=bullet.x-decoy.x,dy=bullet.y-decoy.y;
            if (dx*dx+dy*dy < Math.pow((bullet.size||4)+28,2)) {
                decoy.flash=12;
                if (typeof livingStoneAttacks!=="undefined") ls2SpawnOrbBurst(decoy.x,decoy.y,10,3.2,"#8dffb1",8);
                if (typeof spawnLivingStoneParticles==="function") spawnLivingStoneParticles(decoy.x,decoy.y,18,"#8dffb1",5);
                ls2UniqueDecoys.splice(i,1);
                ls2CombatText("ЛОЖНАЯ ОБОЛОЧКА!", "#93ffba", 52);
                return true;
            }
        }
        var dxB=bullet.x-b.x,dyB=bullet.y-b.y;
        if (dxB*dxB+dyB*dyB > Math.pow((b.size||55)+(bullet.size||4)+17,2)) return false;
        if (ls2BossStun>0 || ls2DodgeCooldown>0 || (window.__mbLS2GreenPhase||"normal")!=="normal") return false;
        if (Math.random()>.68) return false;
        var fromX=b.x,fromY=b.y,side=(bullet.x<=b.x?1:-1);
        var toX=ls2Clamp(fromX+side*(88+Math.random()*30),48,352);
        if (Math.abs(toX-fromX)<28) toX=ls2Clamp(fromX-side*100,48,352);
        var toY=ls2Clamp(fromY+(Math.random()-.5)*66,72,235);
        ls2UniqueDecoys.push({x:fromX,y:fromY,timer:24,kind:"afterimage",hits:0,core:1,flash:0});
        ls2BossDash={type:"evasive",step:0,timer:0,fromX:fromX,fromY:fromY,
            targets:[{x:toX,y:toY}]};
        ls2DodgeCooldown=56; ls2DodgeStreak++;
        ls2CombatText("ТЫ ПРОМАХНУЛСЯ!", "#aaffc5", 45);
        if (ls2DodgeStreak>=3) {
            ls2DodgeStreak=0; ls2BossStun=82;
            ls2CombatText("ПОТЕРЯЛ РАВНОВЕСИЕ! АТАКУЙ!", "#fff0a8", 90);
        }
        return true;
    };

    window.MBLivingStoneSuperOnBossHit = function() {
        if (!ls2Live()) return;
        ls2BossHitCount++;
        ls2DodgeStreak=0;
        if (ls2BossStun>0) return;
        if (ls2BossHitCount%7===0 && (window.__mbLS2GreenPhase||"normal")==="normal") {
            ls2ShellBreak={x:livingStoneBoss.x,y:livingStoneBoss.y,timer:18,life:45};
            ls2CombatText("ОБОЛОЧКА ТРЕСКАЕТСЯ!", "#fff0bd", 55);
        }
    };

    window.MBUpdateLivingStoneSuperAttacks = function() {
        if (!ls2Live()) return;
        var p=livingStonePlayer, b=livingStoneBoss, phase=window.__mbLS2GreenPhase||"normal";
        ls2LastPlayerX = p.x; ls2LastPlayerY = p.y;
        if (ls2ShellBreak) {
            ls2ShellBreak.timer--;
            if (ls2ShellBreak.timer<=0) {
                ls2SpawnOrbBurst(ls2ShellBreak.x,ls2ShellBreak.y,12,3.4,"#9bffb5",9);
                if (typeof spawnLivingStoneParticles==="function") spawnLivingStoneParticles(ls2ShellBreak.x,ls2ShellBreak.y,24,"#aaffc2",6);
                ls2ShellBreak=null;
            }
        }
        for (var i=ls2UniqueDecoys.length-1;i>=0;i--) {
            var d=ls2UniqueDecoys[i];
            d.timer--; if (d.flash>0) d.flash--;
            if (d.kind==="afterimage" && d.timer<=0) {
                ls2SpawnOrbBurst(d.x,d.y,9,2.8,"#75ff9d",7);
                if (typeof spawnLivingStoneParticles==="function") spawnLivingStoneParticles(d.x,d.y,10,"#95ffba",4);
                ls2UniqueDecoys.splice(i,1); continue;
            }
            if (d.timer<=0) { ls2UniqueDecoys.splice(i,1); }
        }
        for (var ci=ls2UniqueCracks.length-1;ci>=0;ci--) {
            var cr=ls2UniqueCracks[ci]; cr.timer--; cr.life--;
            if (cr.timer===0 && typeof livingStoneAttacks!=="undefined") {
                livingStoneAttacks.push({type:"spike",x:cr.x,y:500,height:0,maxHeight:78,warningTimer:14,
                    damage:13,color:"#5aff8a",superStoneAttack:true});
            }
            if (cr.life<=0) ls2UniqueCracks.splice(ci,1);
        }
        if (phase==="gravity") {
            ls2UniqueAttacks = [];
            return;
        }
        if (phase==="green") {
            ls2GreenStrikeTimer--;
            if (ls2GreenStrikeTimer<=0) {
                ls2GreenStrikeTimer=62;
                var sides=[{x:12,y:420,vx:3.5,vy:0,sourceDir:3},
                    {x:388,y:420,vx:-3.5,vy:0,sourceDir:1},
                    {x:200,y:255,vx:0,vy:3.3,sourceDir:0}];
                var s=sides[ls2GreenStrikeIndex%3];
                ls2UniqueAttacks.push({type:"greenStrike",x:s.x,y:s.y,vx:s.vx,vy:s.vy,
                    timer:0,life:145,size:12,damage:12,sourceDir:s.sourceDir});
                ls2GreenStrikeIndex++;
            }
        } else {
            ls2GreenStrikeTimer=22; ls2GreenStrikeIndex=0;
        }
        for (var ai=ls2UniqueAttacks.length-1;ai>=0;ai--) {
            var a=ls2UniqueAttacks[ai];
            a.timer++; a.life--;
            if (a.type==="predict") {
                if (a.timer>=58 && !a.active) {
                    a.active=true;
                    if (Math.hypot(p.x-a.x,p.y-a.y)<a.radius+14 && livingStoneInvulnTimer<=0) {
                        damageLivingStonePlayer(a.damage);
                    }
                    ls2SpawnOrbBurst(a.x,a.y,5,2.5,"#ffcf8c",7);
                    a.life=0;
                }
            } else if (a.type==="plate" || a.type==="greenStrike" || a.type==="boulder") {
                if (a.type==="boulder" && a.timer<=20) {
                    a.x += a.vx; a.y += a.vy;
                } else {
                    a.x += a.vx; a.y += a.vy;
                }
                if (a.trail) { a.trail.push({x:a.x,y:a.y}); if(a.trail.length>10)a.trail.shift(); }
                if (a.type==="plate") {
                    if(a.x<15||a.x>385){a.vx*=-1;a.x=ls2Clamp(a.x,15,385);a.bounces++;}
                    if(a.y<75||a.y>475){a.vy*=-1;a.y=ls2Clamp(a.y,75,475);a.bounces++;}
                    if(a.bounces>=3){ls2SpawnOrbBurst(a.x,a.y,6,2.6,"#afffce",6);a.life=0;}
                } else if (a.type==="boulder") {
                    if (a.delay > 0) a.delay--;
                    else {
                        if(a.x<15||a.x>385){a.vx*=-1;a.x=ls2Clamp(a.x,15,385);a.bounces++;}
                        if(a.y<70||a.y>478){a.vy*=-1;a.y=ls2Clamp(a.y,70,478);a.bounces++;}
                        if(a.bounces>=2){ls2SpawnOrbBurst(a.x,a.y,8,2.9,"#b3ffcb",8);a.life=0;}
                    }
                }
                if (a.life>0 && (!a.delay || a.delay<=0) && Math.hypot(p.x-a.x,p.y-a.y)<(a.size||12)+9) {
                    var blocked=phase==="green" && a.type==="greenStrike" &&
                        ((Number(window.__mbLS2ShieldDir)||0)===a.sourceDir);
                    if (blocked) {
                        ls2GreenBlockStreak++;
                        if (typeof spawnLivingStoneParticles==="function") spawnLivingStoneParticles(a.x,a.y,10,"#73ff9b",4);
                        ls2CombatText("ЩИТ ПОПАЛ В ТОЧКУ!", "#9affb7", 40);
                        if(ls2GreenBlockStreak>=3) {
                            ls2GreenBlockStreak=0; ls2BossStun=Math.max(ls2BossStun,95);
                            ls2OpenWindowPending=true;
                            ls2CombatText("РУКА ЗАСТРЯЛА! БОСС УЯЗВИМ!", "#fff1ae", 100);
                        }
                    } else if (livingStoneInvulnTimer<=0) {
                        ls2GreenBlockStreak = 0;
                        damageLivingStonePlayer(a.damage||10);
                    } else {
                        ls2GreenBlockStreak = 0;
                    }
                    a.life=0;
                }
            } else if (a.type==="boomerang") {
                if (a.trail) { a.trail.push({x:a.x,y:a.y}); if(a.trail.length>12)a.trail.shift(); }
                if (a.timer>=a.turnAt) a.stage="return";
                if (a.stage==="return") {
                    var rx=b.x-a.x, ry=b.y-a.y, rl=Math.hypot(rx,ry)||1;
                    a.vx += rx/rl*.28; a.vy += ry/rl*.28;
                    var sp=Math.hypot(a.vx,a.vy)||1; if(sp>5.2){a.vx=a.vx/sp*5.2;a.vy=a.vy/sp*5.2;}
                }
                a.x+=a.vx; a.y+=a.vy;
                if (Math.hypot(p.x-a.x,p.y-a.y)<a.size+9 && livingStoneInvulnTimer<=0) {
                    if (phase==="green" && Math.hypot(p.x-a.x,p.y-a.y)<28 &&
                        ((Math.abs(a.x-p.x)>Math.abs(a.y-p.y)) ? (a.x>p.x?1:3):(a.y>p.y?2:0)) === (Number(window.__mbLS2ShieldDir)||0)) {
                        ls2GreenBlockStreak++; ls2CombatText("БУМЕРАНГ ОТБИТ!", "#9affb7", 42);
                    } else damageLivingStonePlayer(a.damage||12);
                    a.life=0;
                }
                if (Math.hypot(b.x-a.x,b.y-a.y)<b.size+10 && a.stage==="return") a.life=0;
            }
            if (a.life<=0 || a.x < -70 || a.x > 470 || a.y < -90 || a.y > 570) ls2UniqueAttacks.splice(ai,1);
        }
        if (phase==="green" && ls2GreenBlockStreak>=3) {
            ls2GreenBlockStreak=0; ls2BossStun=Math.max(ls2BossStun,95);
        }
    };

    window.MBDrawLivingStoneSuperAttacks = function(c) {
        if (!ls2Live() || !c) return;
        var now=performance.now(), phase=window.__mbLS2GreenPhase||"normal";
        c.save();
        for (var i=0;i<ls2UniqueCracks.length;i++) {
            var cr=ls2UniqueCracks[i], pulse=1+Math.sin(now/65)*.12;
            c.save(); c.globalAlpha=cr.timer>0?.9:Math.max(.1,cr.life/75);
            c.strokeStyle="#58ff8b"; c.lineWidth=2.5*pulse; c.shadowColor="#45ff7b"; c.shadowBlur=9;
            c.beginPath(); c.moveTo(cr.x-27,cr.y-4); c.lineTo(cr.x-10,cr.y+3); c.lineTo(cr.x-3,cr.y-13);
            c.lineTo(cr.x+4,cr.y+9); c.lineTo(cr.x+18,cr.y-2); c.lineTo(cr.x+30,cr.y+4); c.stroke();
            if(cr.timer<24){c.fillStyle="rgba(100,255,147,.16)";c.beginPath();c.ellipse(cr.x,cr.y,34,17,0,0,Math.PI*2);c.fill();}
            c.restore();
        }
        for (var d=0;d<ls2UniqueDecoys.length;d++) {
            var dec=ls2UniqueDecoys[d];
            c.save(); c.translate(dec.x,dec.y);
            var alpha=dec.kind==="afterimage"?Math.max(.08,dec.timer/24*.6):.78;
            c.globalAlpha=alpha;
            c.fillStyle="#57432f";c.strokeStyle="#b08d66";c.lineWidth=3;
            c.shadowColor=dec.kind==="shell"?"#73ff98":"#c7a77e";c.shadowBlur=dec.kind==="shell"?12:7;
            c.beginPath();c.moveTo(-35,11);c.lineTo(-30,-18);c.lineTo(-12,-36);c.lineTo(16,-33);c.lineTo(35,-12);c.lineTo(31,19);c.lineTo(8,32);c.lineTo(-22,27);c.closePath();c.fill();c.stroke();
            c.shadowBlur=0;c.fillStyle=dec.kind==="shell"?"#544b3c":"#bda182";
            c.beginPath();c.arc(0,0,dec.core?8:4,0,Math.PI*2);c.fill();
            if(dec.kind==="shell"){c.strokeStyle="#8d826f";c.lineWidth=1.5;c.beginPath();c.moveTo(-16,-18);c.lineTo(-4,-4);c.lineTo(12,-17);c.stroke();}
            c.restore();
        }
        for (var j=0;j<ls2UniqueAttacks.length;j++) {
            var a=ls2UniqueAttacks[j];
            c.save();
            if(a.trail && a.trail.length>1){
                c.strokeStyle=a.type==="boomerang"?"rgba(204,157,255,.58)":"rgba(142,255,179,.55)";
                c.lineWidth=a.type==="boulder"?5:2;c.beginPath();c.moveTo(a.trail[0].x,a.trail[0].y);
                for(var t=1;t<a.trail.length;t++)c.lineTo(a.trail[t].x,a.trail[t].y);c.stroke();
            }
            if(a.type==="predict"){
                var prog=ls2Clamp(a.timer/58,0,1);
                c.globalAlpha=.45+Math.sin(now/80)*.22;c.strokeStyle="#ffbb74";c.lineWidth=2.5;
                c.setLineDash([6,5]);c.beginPath();c.arc(a.x,a.y,a.radius*(.65+.4*prog),0,Math.PI*2);c.stroke();c.setLineDash([]);
                c.fillStyle="rgba(255,130,80,.11)";c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.fill();
                c.fillStyle="#ffdfb5";c.font="bold 10px Arial";c.textAlign="center";c.fillText("ПРЕДСКАЗАНИЕ",a.x,a.y-a.radius-7);
            } else if(a.type==="greenStrike"){
                c.translate(a.x,a.y);c.rotate(Math.atan2(a.vy,a.vx));
                c.fillStyle="#76ffa0";c.strokeStyle="#e4ffeb";c.lineWidth=1.8;c.shadowColor="#5dff8f";c.shadowBlur=15;
                c.beginPath();c.moveTo(-16,-5);c.lineTo(4,-9);c.lineTo(16,0);c.lineTo(4,9);c.lineTo(-16,5);c.closePath();c.fill();c.stroke();
            } else if(a.type==="plate"){
                c.translate(a.x,a.y);c.rotate(a.angle||0);c.fillStyle="#a9ffca";c.strokeStyle="#edfff3";c.lineWidth=1.2;c.shadowColor="#5dff8f";c.shadowBlur=10;
                c.beginPath();c.moveTo(-15,0);c.lineTo(-2,-7);c.lineTo(15,0);c.lineTo(-2,7);c.closePath();c.fill();c.stroke();
            } else if(a.type==="boulder"){
                c.translate(a.x,a.y);c.rotate(a.timer*.05);c.fillStyle="#6c563f";c.strokeStyle="#b2ffca";c.lineWidth=2;c.shadowColor="#73ff99";c.shadowBlur=12;
                c.beginPath();c.moveTo(-16,-12);c.lineTo(-6,-22);c.lineTo(13,-15);c.lineTo(20,3);c.lineTo(6,18);c.lineTo(-15,12);c.closePath();c.fill();c.stroke();
            } else if(a.type==="boomerang"){
                c.translate(a.x,a.y);c.rotate(Math.atan2(a.vy,a.vx));c.fillStyle="#bca1ff";c.strokeStyle="#f3ecff";c.lineWidth=2;c.shadowColor="#a583ff";c.shadowBlur=13;
                c.beginPath();c.moveTo(-17,-9);c.lineTo(16,0);c.lineTo(-17,9);c.lineTo(-8,0);c.closePath();c.fill();c.stroke();
            }
            c.restore();
        }
        if(ls2ShellBreak){
            c.save();c.globalAlpha=Math.min(1,ls2ShellBreak.timer/18);
            c.strokeStyle="#efffd8";c.lineWidth=2;c.shadowColor="#aaffb9";c.shadowBlur=14;
            c.beginPath();c.arc(ls2ShellBreak.x,ls2ShellBreak.y,32+(18-ls2ShellBreak.timer),0,Math.PI*2);c.stroke();c.restore();
        }
        c.restore();
    };

    window.MBLivingStoneSuperDamage = function(amount) { return ls2DamageBoss(amount); };
    window.MBUpdateLivingStoneSuperPhase = function() {
        if (!window.livingStoneSuperActive || !ls2NativeMode) return;
        var phase = window.__mbLS2GreenPhase || "normal";
        var frame = Number(window.__mbLS2PhaseFrames) || 0;
        var now = typeof performance !== "undefined" ? performance.now() : Date.now();
        var last = Number(window.__mbLS2LastPhaseTime) || now;
        var frameStep = Math.max(0.2, Math.min(4, (now - last) / (1000 / 60)));
        window.__mbLS2LastPhaseTime = now;
        if (phase === "normal") {
            frame += frameStep;
            if (frame >= 1200) {
                frame = 0;
                if (Math.random() < 0.5) {
                    window.__mbLS2GreenPhase = "gravity";
                    ls2UniqueAttacks = []; ls2UniqueCracks = []; ls2UniqueDecoys = [];
                    ls2ShellBreak = null; ls2BossDash = null;
                    ls2GreenBlockStreak = 0;
                    ls2GreenStrikeTimer = 24;
                    window.__mbLS2GravityFromX = typeof livingStonePlayer !== "undefined" ? livingStonePlayer.x : 200;
                    window.__mbLS2GravityFromY = typeof livingStonePlayer !== "undefined" ? livingStonePlayer.y : 400;
                    window.__mbLS2GreenEventCount = (Number(window.__mbLS2GreenEventCount) || 0) + 1;
                    if (typeof spawnLivingStoneText === "function") spawnLivingStoneText(200, 255, "ГРАВИТАЦИЯ! ТЕБЯ ПРИЖИМАЕТ К ЗЕМЛЕ", "#8dffb1", 100);
                    if (typeof livingStoneScreenFlash !== "undefined") { livingStoneScreenFlash = 12; livingStoneScreenFlashColor = "#76ff9a"; }
                    if (typeof playArenaSound === "function") playArenaSound(62, "sawtooth", 0.55, 0.15);
                }
            }
        } else if (phase === "gravity") {
            frame += frameStep;
            if (frame >= 95) {
                frame = 0; window.__mbLS2GreenPhase = "green";
                ls2UniqueAttacks = [];
                ls2GreenStrikeTimer = 20; ls2GreenStrikeIndex = 0; ls2GreenBlockStreak = 0;
                if (typeof livingStonePlayer !== "undefined") { livingStonePlayer.x = 200; livingStonePlayer.y = 420; }
                if (typeof spawnLivingStoneText === "function") spawnLivingStoneText(200, 350, "ЗЕЛЁНАЯ ДУША! ЗАЩИЩАЙСЯ ЩИТОМ", "#63ff91", 125);
                if (typeof playArenaSound === "function") playArenaSound(430, "triangle", 0.2, 0.08);
            }
        } else if (phase === "green") {
            frame += frameStep;
            if (frame >= 480) {
                frame = 0; window.__mbLS2GreenPhase = "normal";
                ls2UniqueAttacks = [];
                if (ls2OpenWindowPending) {
                    ls2BossStun = Math.max(ls2BossStun, 95);
                    ls2OpenWindowPending = false;
                    ls2CombatText("ТЫ СЛОМАЛ ЕГО ЗАЩИТУ! БЕЙ!", "#fff0a8", 95);
                }
                if (typeof spawnLivingStoneText === "function") spawnLivingStoneText(200, 350, "ГРАВИТАЦИЯ ОТПУСТИЛА ТЕБЯ", "#ffb1b1", 80);
                if (typeof playArenaSound === "function") playArenaSound(240, "triangle", 0.16, 0.05);
            }
        }
        window.__mbLS2PhaseFrames = frame;
        ls2SetControlVisibility();
    };
    window.MBGetLivingStoneSuperPhase = function() {
        return { phase: window.__mbLS2GreenPhase || "normal", frames: Number(window.__mbLS2PhaseFrames)||0,
            shieldDir: Number(window.__mbLS2ShieldDir)||0 };
    };
    window.MBPlayLivingStoneSuperShieldSound = function() {
        if (typeof playArenaSound === "function") playArenaSound(520, "triangle", 0.04, 0.035);
    };
    window.MBDrawLivingStoneSuperPhaseHud = function(c) {
        if (!window.livingStoneSuperActive || !c) return;
        var phase = window.__mbLS2GreenPhase || "normal";
        var frames = Number(window.__mbLS2PhaseFrames) || 0;
        var label = "СУПЕР-ЖИВОЙ КАМЕНЬ";
        var color = "#ffd5c9";
        if (phase === "normal") {
            label = "ГРАВИТАЦИЯ: шанс 50% через " + Math.ceil(Math.max(0,1200-frames)/60) + " сек.";
        } else if (phase === "gravity") {
            label = "ГРАВИТАЦИЯ СЖИМАЕТ ТЕБЯ...";
            color = "#a5ffc0";
        } else {
            var dirs = ["↑ ВВЕРХ","→ ВПРАВО","↓ ВНИЗ","← ВЛЕВО"];
            label = "ЗЕЛЁНАЯ ДУША · ЩИТ " + dirs[((Number(window.__mbLS2ShieldDir)||0)%4+4)%4] +
                " · " + Math.ceil(Math.max(0,480-frames)/60) + "с";
            color = "#86ffac";
        }
        c.save();
        c.fillStyle = "rgba(0,0,0,.72)";
        c.fillRect(66,35,268,22);
        c.strokeStyle = phase === "green" ? "rgba(111,255,155,.8)" : "rgba(255,120,95,.55)";
        c.lineWidth = 1.2; c.strokeRect(66,35,268,22);
        c.fillStyle = color; c.font = "bold 10px Arial,sans-serif"; c.textAlign = "center";
        c.fillText(label,200,49);
        if (phase === "gravity") {
            c.fillStyle = "rgba(70,255,130,.18)"; c.fillRect(70,59,260,3);
            c.fillStyle = "#62ff91"; c.fillRect(70,59,260*Math.min(1,frames/95),3);
        }
        c.restore();
    };
    window.MBDrawLivingStoneSuperBossCore = function(c) {
        if (!ls2Live() || !c || !ls2UniqueDecoys.some(function(d){return d.kind==="shell";})) return;
        var b=livingStoneBoss, pulse=1+Math.sin(performance.now()/75)*.16;
        c.save();
        var glow=c.createRadialGradient(b.x,b.y,2,b.x,b.y,30*pulse);
        glow.addColorStop(0,"rgba(103,255,151,.95)");
        glow.addColorStop(.35,"rgba(62,255,121,.38)");
        glow.addColorStop(1,"rgba(62,255,121,0)");
        c.fillStyle=glow;c.beginPath();c.arc(b.x,b.y,30*pulse,0,Math.PI*2);c.fill();
        c.fillStyle="#b6ffca";c.strokeStyle="#effff2";c.lineWidth=1.5;
        c.shadowColor="#55ff8b";c.shadowBlur=13;
        c.beginPath();c.arc(b.x,b.y,8*pulse,0,Math.PI*2);c.fill();c.stroke();
        c.shadowBlur=0;c.fillStyle="#ffffff";c.beginPath();c.arc(b.x-2,b.y-2,2.4,0,Math.PI*2);c.fill();
        c.restore();
    };
    window.MBDrawLivingStoneSuperShield = function(c) {
        if (!window.livingStoneSuperActive || window.__mbLS2GreenPhase !== "green" || !c ||
            typeof livingStonePlayer === "undefined") return;
        var dirs = [{x:0,y:-1,a:0},{x:1,y:0,a:Math.PI/2},{x:0,y:1,a:Math.PI},{x:-1,y:0,a:-Math.PI/2}];
        var dir = dirs[((Number(window.__mbLS2ShieldDir)||0)%4+4)%4];
        var p = livingStonePlayer;
        var pulse = 1 + Math.sin(performance.now()/95)*0.045;
        c.save();
        c.translate(p.x + dir.x*19, p.y + dir.y*19);
        c.rotate(dir.a);
        c.scale(pulse,pulse);
        var grad = c.createLinearGradient(-13,-10,13,12);
        grad.addColorStop(0,"#f2fff5"); grad.addColorStop(.35,"#69ff9a"); grad.addColorStop(1,"#087b36");
        c.shadowColor = "#3dff82"; c.shadowBlur = 18;
        c.fillStyle = grad; c.strokeStyle = "#d6ffe2"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0,-17); c.lineTo(12,-10); c.lineTo(11,5); c.lineTo(0,14); c.lineTo(-11,5); c.lineTo(-12,-10); c.closePath();
        c.fill(); c.stroke();
        c.shadowBlur = 0; c.strokeStyle="rgba(255,255,255,.82)"; c.lineWidth=1.3;
        c.beginPath(); c.moveTo(-5,-7); c.lineTo(0,-10); c.lineTo(5,-7); c.stroke();
        c.restore();
    };
    window.MBLivingStoneSuperShieldBlocks = function(a, px, py) {
        if (!window.livingStoneSuperActive || window.__mbLS2GreenPhase !== "green" || !a ||
            a.type === "gravity_well" || a.type === "laser_warning") return false;
        var ax = Number(a.x), ay = Number(a.y);
        if (!Number.isFinite(ax)) ax = px;
        if (!Number.isFinite(ay)) ay = py;
        var sourceX=ax, sourceY=ay, maxReach=36+(Number(a.size)||Number(a.radius)||0);
        if (a.type === "laser" || a.type === "laser_warning") { sourceY = py - 80; maxReach = 38; }
        if (a.type === "spike") { sourceY = py + 40; sourceX = Number(a.x)||px; maxReach = 44; }
        var dx=sourceX-px, dy=sourceY-py;
        var distance=Math.sqrt(dx*dx+dy*dy);
        if (a.type === "ring") {
            if (Math.abs(distance-(Number(a.radius)||0)) > (Number(a.thickness)||18)/2+24) return false;
        } else if (a.type === "laser" || a.type === "laser_warning") {
            if (Math.abs(px-ax) > (Number(a.width)||40)/2+18 || a.type !== "laser") return false;
        } else if (a.type === "spike") {
            if (a.warningTimer > 0 || a.height < 5 || Math.abs(px-ax)>42 || py < 500-(Number(a.height)||0)-12) return false;
        } else {
            if (distance > maxReach) return false;
        }
        var dir;
        if (Math.abs(dx)>Math.abs(dy)) dir=dx>=0?1:3;
        else dir=dy>=0?2:0;
        return dir === ((Number(window.__mbLS2ShieldDir)||0)%4);
    };

    window.MBLivingStoneSuperNativeVictory = function() {
        if (!window.livingStoneSuperActive) return;
        if (window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===2000) {
            ls2Stop(false);
            if (typeof window.MBBossTestFinish==="function") window.MBBossTestFinish("win",true);
            return;
        }
        if (typeof currentEnemy !== "undefined" && currentEnemy) currentEnemy.hp = 0;
        if (typeof defeatedBosses !== "undefined" && Array.isArray(defeatedBosses) && !defeatedBosses.includes(2000)) defeatedBosses.push(2000);
        if (typeof saveAll === "function") saveAll();
        ls2Stop(false);
        if (typeof victory === "function") victory();
    };
    window.MBLivingStoneSuperNativeDefeat = function() {
        if (!window.livingStoneSuperActive) return;
        if (window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===2000) {
            ls2Stop(false);
            if (typeof window.MBBossTestFinish==="function") window.MBBossTestFinish("loss",true);
            return;
        }
        if (typeof window.MBPreserveGarouChargesForUniqueBossRetry === "function") window.MBPreserveGarouChargesForUniqueBossRetry("stoneSuper");
        ls2Stop(false);
        if (typeof playerHp !== "undefined") playerHp = 0;
        if (typeof defeat === "function") defeat();
    };

    function ls2Stop(restoreMainScreen) {
        if (!ls2Active && !ls2ChoicePending) return;
        if (ls2NativeMode) {
            ls2NativeMode = false;
            ls2Active = false; ls2ChoicePending = false;
            window.livingStoneSuperActive = false;
            window.__mbLS2GreenPhase = "normal";
            window.__mbLS2PhaseFrames = 0;
            window.__mbLS2ShieldDir = 0;
            if (ls2Frame) cancelAnimationFrame(ls2Frame);
            ls2Frame = 0;
            if (ls2Canvas && ls2PointerHandler) ls2Canvas.removeEventListener("pointerdown", ls2PointerHandler);
            ls2PointerHandler = null;
            if (ls2KeyHandler) window.removeEventListener("keydown", ls2KeyHandler, true);
            if (ls2KeyUpHandler) window.removeEventListener("keyup", ls2KeyUpHandler, true);
            ls2KeyHandler = null; ls2KeyUpHandler = null; ls2HeldKeys = {};
            ls2RemoveControls();
            var didNativeStop = false;
            if (typeof livingStoneActive !== "undefined" && livingStoneActive && typeof stopLivingStoneFight === "function") {
                try { stopLivingStoneFight(); didNativeStop = true; } catch (e) { livingStoneActive = false; }
            }
            var nativeOverlay = document.getElementById("arenaOverlay");
            if (nativeOverlay) { nativeOverlay.classList.remove("living-stone-super-arena"); nativeOverlay.style.display = "none"; }
            if (!didNativeStop && typeof window.MBEndBossGraphicsModeForFight === "function") {
                try { window.MBEndBossGraphicsModeForFight(); } catch(e) {}
            }
            ls2Canvas = null; ls2Ctx = null; ls2Bullets = []; ls2Sparks = [];
            if (restoreMainScreen && Number(typeof wave!=="undefined"?wave:0)===2000 &&
                typeof currentEnemy!=="undefined" && currentEnemy && currentEnemy.hp>0 &&
                typeof generateEnemy==="function") generateEnemy();
            return;
        }
        ls2Active=false; ls2ChoicePending=false; window.livingStoneSuperActive=false;
        if (ls2Frame) cancelAnimationFrame(ls2Frame);
        ls2Frame=0;
        if (ls2Canvas && ls2PointerHandler) ls2Canvas.removeEventListener("pointerdown",ls2PointerHandler);
        ls2PointerHandler=null;
        if (ls2KeyHandler) window.removeEventListener("keydown",ls2KeyHandler,true);
        if (ls2KeyUpHandler) window.removeEventListener("keyup",ls2KeyUpHandler,true);
        ls2KeyHandler=null; ls2KeyUpHandler=null; ls2HeldKeys={}; ls2RemoveControls();
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
        ls2NativeMode = false;
        window.__mbLS2GreenPhase = "normal";
        window.__mbLS2PhaseFrames = 0;
        window.__mbLS2LastPhaseTime = 0;
        window.__mbLS2ShieldDir = 0;
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
        ls2Phase="intro"; ls2PhaseTimer=0; ls2NormalDuration=1200; ls2GreenCount=0;
        ls2GravityDuration=150; ls2GravityStartX=LS2_CENTER_X; ls2GravityStartY=LS2_CENTER_Y;
        ls2PlayerAttackCooldown=0; ls2BossStrikeFlash=0; ls2HeldKeys={};
        LS2_HEART_X=LS2_CENTER_X; LS2_HEART_Y=446;
        ls2FloatingText="ТЫ СНОВА ВЕРНУЛСЯ..."; ls2FloatingTimer=100; ls2LastTime=0;
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
        ls2KeyUpHandler=ls2OnKeyUp; window.addEventListener("keyup",ls2KeyUpHandler,true);
        ls2SetControlVisibility();
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
        if (ls2NativeMode) {
            amount = Number(amount);
            if (typeof window!=="undefined" && window.__mbBossTestMode && typeof window.MBBossTestModifyOutgoingDamage==="function") {
                amount = window.MBBossTestModifyOutgoingDamage(amount, 1);
            }
            if (!(amount > 0)) return true;
            if (typeof livingStoneBossHp !== "undefined") livingStoneBossHp = Math.max(0, livingStoneBossHp - amount);
            ls2BossHp = typeof livingStoneBossHp !== "undefined" ? livingStoneBossHp : Math.max(0, ls2BossHp - amount);
            if (typeof livingStoneBossFlash !== "undefined") livingStoneBossFlash = 7;
            if (typeof currentEnemy !== "undefined" && currentEnemy) currentEnemy.hp = ls2BossHp;
            if (ls2BossHp <= 0 && typeof window.MBLivingStoneSuperNativeVictory === "function") window.MBLivingStoneSuperNativeVictory();
            return true;
        }
        if (typeof window!=="undefined" && window.__mbBossTestMode && typeof window.MBBossTestModifyOutgoingDamage==="function") {
            amount=window.MBBossTestModifyOutgoingDamage(amount,1);
        }
        ls2BossHp=Math.max(0,ls2BossHp-Number(amount));
        if (ls2BossHp<=0) {
            if (typeof window!=="undefined" && window.__mbBossTestMode && window.__mbBossTestMode.kind==="unique" && Number(window.__mbBossTestMode.bossWave)===2000) {
                ls2Stop(false);
                if(typeof window.MBBossTestFinish==="function")window.MBBossTestFinish("win",true);
                return true;
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
    window.getLivingStoneSuperHeart=function(){
        if(ls2NativeMode && typeof livingStonePlayer!=="undefined") {
            return {x:livingStonePlayer.x,y:livingStonePlayer.y,shieldDir:Number(window.__mbLS2ShieldDir)||0,
                hp:livingStonePlayerHp,maxHp:livingStonePlayerMaxHp,phase:window.__mbLS2GreenPhase||"normal"};
        }
        return {x:LS2_HEART_X,y:LS2_HEART_Y,shieldDir:ls2ShieldDir,hp:ls2PlayerHp,maxHp:ls2PlayerMaxHp};
    };
    window.getLivingStoneSuperBossHp=function(){return ls2NativeMode && typeof livingStoneBossHp!=="undefined" ? livingStoneBossHp : ls2BossHp;};
    window.getLivingStoneSuperBossMaxHp=function(){return ls2NativeMode && typeof livingStoneBossMaxHp!=="undefined" ? livingStoneBossMaxHp : ls2BossMaxHp;};
    window.setLivingStoneSuperBossHp=function(v){
        ls2BossHp=Math.max(1,Math.min(ls2BossMaxHp,Number(v)||1));
        if(ls2NativeMode && typeof livingStoneBossHp!=="undefined") livingStoneBossHp=ls2BossHp;
    };
    window.setLivingStoneSuperPlayerHp=function(v){
        ls2PlayerHp=Math.max(1,Math.min(ls2PlayerMaxHp,Number(v)||1));
        if(ls2NativeMode && typeof livingStonePlayerHp!=="undefined") livingStonePlayerHp=ls2PlayerHp;
    };
    window.getLivingStoneSuperAttacks=function(){return ls2NativeMode && typeof livingStoneAttacks!=="undefined" ? livingStoneAttacks : ls2Bullets;};
    window.getLivingStoneSuperParticles=function(){return ls2NativeMode && typeof livingStoneParticles!=="undefined" ? livingStoneParticles : ls2Sparks;};
    window.isLivingStoneSuperActive=function(){return ls2Active;};
})();