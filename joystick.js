// ============================================================
// JOYSTICK v1.1 — Универсальный виртуальный джойстик
// ============================================================
// Работает на ВСЕХ аренах:
//   - Undertale (battle.js)
//   - Живой Камень (living_stone_boss.js)
//   - Путеводная Звезда (waystar_boss.js)
//   - Роджер vs Белоус (roger_whitebeard_boss.js)
//
// ★ v1.1: убран спам в консоль (лог только при изменении)
// ПОДКЛЮЧАТЬ В КОНЦЕ index.html, ПОСЛЕ всех боссов
// ============================================================

(function() {
    'use strict';

    if (window._joystickLoaded) {
        console.warn("[JOYSTICK] Уже загружено, игнорирую повтор.");
        return;
    }
    window._joystickLoaded = true;

    // ============================================================
    // ★★★ ГЛОБАЛЬНОЕ СОСТОЯНИЕ ДЖОЙСТИКА ★★★
    // ============================================================
    window._joystick = {
        enabled: false,
        active: false,
        touchId: null,
        baseX: 0, baseY: 0,
        knobX: 0, knobY: 0,
        maxRadius: 70,
        deadzone: 10,
        vectorX: 0,
        vectorY: 0,
        sizeMult: 1.0,
        opacity: 0.6
    };

    // ★ Кэш настроек — чтобы не логировать каждый кадр ★
    var _lastSettings = {
        enabled: null,
        size: null,
        opacity: null
    };

    // ============================================================
    // ★★★ ЧТЕНИЕ НАСТРОЕК ИЗ arenaSettings ★★★
    // ============================================================
    function readSettings() {
        var settings = window.arenaSettings || (typeof arenaSettings !== 'undefined' ? arenaSettings : null);
        if (!settings) return;

        var control = settings.arenaControl || "auto";
        var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        var newEnabled;
        if (control === "auto") {
            newEnabled = isMobile;
        } else if (control === "joystick") {
            newEnabled = true;
        } else {
            newEnabled = false;
        }

        var newSizeMult = (settings.joystickSize || 100) / 100;
        var newMaxRadius = Math.round(70 * newSizeMult);
        var newDeadzone = Math.round(10 * newSizeMult);
        var newOpacity = (settings.joystickOpacity || 60) / 100;

        var j = window._joystick;
        j.enabled = newEnabled;
        j.sizeMult = newSizeMult;
        j.maxRadius = newMaxRadius;
        j.deadzone = newDeadzone;
        j.opacity = newOpacity;

        // ★ Логируем ТОЛЬКО если что-то изменилось ★
        var changed = (
            _lastSettings.enabled !== newEnabled ||
            _lastSettings.size !== newMaxRadius ||
            _lastSettings.opacity !== newOpacity
        );
        if (changed) {
            _lastSettings.enabled = newEnabled;
            _lastSettings.size = newMaxRadius;
            _lastSettings.opacity = newOpacity;
            console.log("[JOYSTICK] Настройки: enabled=" + newEnabled + ", size=" + newMaxRadius + "px, opacity=" + newOpacity.toFixed(2));
        }
    }

    // ============================================================
    // ★★★ ОПРЕДЕЛЕНИЕ АКТИВНОЙ АРЕНЫ ★★★
    // ============================================================
    function getActiveArena() {
        try {
            if (typeof arenaActive !== 'undefined' && arenaActive) {
                return {
                    type: 'arena',
                    canvas: (typeof canvas !== 'undefined') ? canvas : document.getElementById("arenaCanvas"),
                    phase: (typeof arenaPhase !== 'undefined') ? arenaPhase : "dodge"
                };
            }
            if (typeof livingStoneActive !== 'undefined' && livingStoneActive) {
                return {
                    type: 'stone',
                    canvas: (typeof canvas !== 'undefined') ? canvas : document.getElementById("arenaCanvas"),
                    phase: (typeof livingStoneState !== 'undefined') ? livingStoneState : "phase1"
                };
            }
            if (typeof waystarActive !== 'undefined' && waystarActive) {
                return {
                    type: 'waystar',
                    canvas: (typeof canvas !== 'undefined') ? canvas : document.getElementById("arenaCanvas"),
                    phase: (typeof waystarState !== 'undefined') ? waystarState : "phase1"
                };
            }
            if (typeof window.rwbActive !== 'undefined' && window.rwbActive) {
                return {
                    type: 'rwb',
                    canvas: (typeof canvas !== 'undefined') ? canvas : document.getElementById("arenaCanvas"),
                    phase: (typeof rwbState !== 'undefined') ? rwbState : "fight1"
                };
            }
        } catch(e) {}
        return null;
    }

    // ============================================================
    // ★★★ ПРОВЕРКА: МОЖНО ЛИ УПРАВЛЯТЬ СЕЙЧАС ★★★
    // ============================================================
    function canControl(arena) {
        if (!arena) return false;
        if (arena.type === 'arena') return arena.phase === "dodge";
        if (arena.type === 'stone') return arena.phase === "phase1" || arena.phase === "phase2";
        if (arena.type === 'waystar') return arena.phase === "phase1" || arena.phase === "phase2" || arena.phase === "phase3";
        if (arena.type === 'rwb') return arena.phase === "fight1" || arena.phase === "fight2";
        return false;
    }

    // ============================================================
    // ★★★ ОБНОВЛЕНИЕ ВЕКТОРА ДВИЖЕНИЯ ★★★
    // ============================================================
    function updateVector() {
        var j = window._joystick;
        if (!j.active) {
            j.vectorX = 0;
            j.vectorY = 0;
            return;
        }

        var dx = j.knobX - j.baseX;
        var dy = j.knobY - j.baseY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < j.deadzone) {
            j.vectorX = 0;
            j.vectorY = 0;
            return;
        }

        var norm = Math.min(1, dist / j.maxRadius);
        j.vectorX = (dx / dist) * norm;
        j.vectorY = (dy / dist) * norm;
    }

    // ============================================================
    // ★★★ ПАТЧ CANVAS: перехватываем тач-события ★★★
    // ============================================================
    function patchCanvas(c) {
        if (!c || c._joystickPatched) return;
        c._joystickPatched = true;

        c.addEventListener("touchstart", function(ev) {
            var j = window._joystick;
            if (!j.enabled) return;

            var arena = getActiveArena();
            if (!arena) return;
            if (arena.type === 'arena' && arena.phase === 'attack') return;
            if (!canControl(arena)) return;

            ev.preventDefault();

            for (var i = 0; i < ev.touches.length; i++) {
                var t = ev.touches[i];
                if (j.active) continue;

                var rect = c.getBoundingClientRect();
                var tx = t.clientX - rect.left;
                var ty = t.clientY - rect.top;

                j.active = true;
                j.touchId = t.identifier;
                j.baseX = tx;
                j.baseY = ty;
                j.knobX = tx;
                j.knobY = ty;

                var minDist = j.maxRadius + 10;
                j.baseX = Math.max(minDist, Math.min(c.width - minDist, j.baseX));
                j.baseY = Math.max(minDist, Math.min(c.height - minDist, j.baseY));
                j.knobX = j.baseX;
                j.knobY = j.baseY;

                if (typeof playArenaSound === 'function') playArenaSound(400, 'sine', 0.05, 0.03);
            }
        }, { passive: false });

        c.addEventListener("touchmove", function(ev) {
            var j = window._joystick;
            if (!j.enabled || !j.active) return;

            var arena = getActiveArena();
            if (!canControl(arena)) return;

            ev.preventDefault();

            for (var i = 0; i < ev.touches.length; i++) {
                var t = ev.touches[i];
                if (t.identifier !== j.touchId) continue;

                var rect = c.getBoundingClientRect();
                var tx = t.clientX - rect.left;
                var ty = t.clientY - rect.top;

                var dx = tx - j.baseX;
                var dy = ty - j.baseY;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > j.maxRadius) {
                    dx = (dx / dist) * j.maxRadius;
                    dy = (dy / dist) * j.maxRadius;
                }

                j.knobX = j.baseX + dx;
                j.knobY = j.baseY + dy;
                break;
            }
        }, { passive: false });

        c.addEventListener("touchend", function(ev) {
            var j = window._joystick;
            if (!j.enabled) return;

            var stillHeld = false;
            for (var i = 0; i < ev.touches.length; i++) {
                if (ev.touches[i].identifier === j.touchId) { stillHeld = true; break; }
            }

            if (!stillHeld) {
                j.active = false;
                j.touchId = null;
                j.vectorX = 0;
                j.vectorY = 0;
            }
        });

        c.addEventListener("touchcancel", function() {
            var j = window._joystick;
            j.active = false;
            j.touchId = null;
            j.vectorX = 0;
            j.vectorY = 0;
        });

        console.log("[JOYSTICK] Canvas пропатчен");
    }

    // ============================================================
    // ★★★ РИСУЕМ ДЖОЙСТИК ★★★
    // ============================================================
    function drawJoystick() {
        var j = window._joystick;
        if (!j.enabled || !j.active) return;

        var context = null;
        try {
            if (typeof ctx !== 'undefined' && ctx) context = ctx;
        } catch(e) {}
        if (!context) return;

        context.save();
        context.globalAlpha = j.opacity;

        // Внешний круг
        context.strokeStyle = "#ffffff";
        context.lineWidth = 3;
        context.shadowColor = "#000000";
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.maxRadius, 0, Math.PI * 2);
        context.stroke();

        // Заливка
        context.fillStyle = "rgba(255, 255, 255, 0.08)";
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.maxRadius, 0, Math.PI * 2);
        context.fill();

        // Мёртвая зона
        context.strokeStyle = "rgba(255, 255, 255, 0.3)";
        context.lineWidth = 1;
        context.shadowBlur = 0;
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.deadzone, 0, Math.PI * 2);
        context.stroke();

        // Стрелки
        context.strokeStyle = "rgba(255, 255, 255, 0.35)";
        context.lineWidth = 2;
        var arrowDist = j.maxRadius * 0.72;
        var arrowSize = j.maxRadius * 0.13;

        context.beginPath();
        context.moveTo(j.baseX, j.baseY - arrowDist + arrowSize);
        context.lineTo(j.baseX - arrowSize, j.baseY - arrowDist);
        context.lineTo(j.baseX + arrowSize, j.baseY - arrowDist);
        context.closePath();
        context.stroke();
        context.beginPath();
        context.moveTo(j.baseX, j.baseY + arrowDist - arrowSize);
        context.lineTo(j.baseX - arrowSize, j.baseY + arrowDist);
        context.lineTo(j.baseX + arrowSize, j.baseY + arrowDist);
        context.closePath();
        context.stroke();
        context.beginPath();
        context.moveTo(j.baseX - arrowDist + arrowSize, j.baseY);
        context.lineTo(j.baseX - arrowDist, j.baseY - arrowSize);
        context.lineTo(j.baseX - arrowDist, j.baseY + arrowSize);
        context.closePath();
        context.stroke();
        context.beginPath();
        context.moveTo(j.baseX + arrowDist - arrowSize, j.baseY);
        context.lineTo(j.baseX + arrowDist, j.baseY - arrowSize);
        context.lineTo(j.baseX + arrowDist, j.baseY + arrowSize);
        context.closePath();
        context.stroke();

        // Шайба
        context.fillStyle = "#ffdd00";
        context.shadowColor = "#ffaa00";
        context.shadowBlur = 15;
        context.beginPath();
        context.arc(j.knobX, j.knobY, j.maxRadius * 0.35, 0, Math.PI * 2);
        context.fill();

        // Блик
        context.fillStyle = "rgba(255, 255, 255, 0.6)";
        context.shadowBlur = 0;
        context.beginPath();
        context.arc(j.knobX - j.maxRadius * 0.1, j.knobY - j.maxRadius * 0.1, j.maxRadius * 0.12, 0, Math.PI * 2);
        context.fill();

        // Линия от базы к шайбе
        context.strokeStyle = "rgba(255, 221, 0, 0.5)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(j.baseX, j.baseY);
        context.lineTo(j.knobX, j.knobY);
        context.stroke();

        context.restore();
    }

    // ============================================================
    // ★★★ АВТО-ОБНОВЛЕНИЕ ВЕКТОРА (60 раз в секунду) ★★★
    // ============================================================
    setInterval(function() {
        var j = window._joystick;
        if (!j.enabled) return;
        updateVector();
    }, 16);

    // ============================================================
    // ★★★ ПАТЧ CANVAS — при появлении ★★★
    // ============================================================
    function tryPatchCanvas() {
        var c = null;
        try {
            if (typeof canvas !== 'undefined' && canvas) c = canvas;
            else c = document.getElementById("arenaCanvas");
        } catch(e) {}
        if (c && !c._joystickPatched) patchCanvas(c);
    }

    setTimeout(tryPatchCanvas, 500);
    setInterval(tryPatchCanvas, 2000);

    // ============================================================
    // ★★★ ПАТЧИ ДЛЯ БОССОВ ★★★
    // ============================================================

    // -------- ПАТЧ 1: Undertale (moveHeart) --------
    function patchBattleMoveHeart() {
        if (typeof window.moveHeart !== 'function') return false;
        if (window._joystickMoveHeartPatched) return true;

        var originalMoveHeart = window.moveHeart;
        window.moveHeart = function() {
            var j = window._joystick;
            if (j && j.enabled && j.active) {
                if (typeof _superState !== 'undefined' && _superState.usoppStunTimer > 0) return;
                if (typeof _superState !== 'undefined' && _superState.garouTimeStop) return;

                var mx = j.vectorX;
                var my = j.vectorY;

                if (typeof _superState !== 'undefined' && _superState.invertControls) {
                    mx = -mx; my = -my;
                }

                var isMoving = Math.abs(mx) > 0.05 || Math.abs(my) > 0.05;
                if (typeof heartWasMoving !== 'undefined') heartWasMoving = isMoving;

                if (isMoving) {
                    if (typeof heartStandingTime !== 'undefined') heartStandingTime = 0;
                    if (typeof heartRotation !== 'undefined') heartRotation += 0.15;
                    if (typeof heart !== 'undefined') {
                        heart.x += mx * heartSpeed;
                        heart.y += my * heartSpeed;
                    }
                } else {
                    if (typeof heartStandingTime !== 'undefined') heartStandingTime++;
                    if (typeof heartRotation !== 'undefined') heartRotation *= 0.9;
                }

                if (typeof heart !== 'undefined') {
                    if (Math.abs(heart.vx) > 0.01 || Math.abs(heart.vy) > 0.01) {
                        heart.x += heart.vx;
                        heart.y += heart.vy;
                        heart.vx *= 0.92;
                        heart.vy *= 0.92;
                        if (Math.abs(heart.vx) < 0.1) heart.vx = 0;
                        if (Math.abs(heart.vy) < 0.1) heart.vy = 0;
                    }
                }

                if (typeof clampHeart === 'function') clampHeart();

                if (typeof arenaTrail !== 'undefined' && Math.random() > 0.3) {
                    arenaTrail.push({ x: heart.x, y: heart.y, life: 12, maxLife: 12, size: Math.max(1, heart.size*0.75), color: "rgba(255, 30, 30, 0.35)" });
                }

                if (typeof arenaAttackType !== 'undefined' && arenaAttackType === 4) {
                    if (heart.x - heart.hitbox < 2 || heart.x + heart.hitbox > 398 || heart.y - heart.hitbox < 2 || heart.y + heart.hitbox > 498) {
                        if (invulnTimer <= 0) {
                            invulnTimer = 20;
                            applyHit(Math.max(8, Math.floor(arenaBaseDmg*1.5)), "ШИПЫ!");
                        }
                    }
                }
                return;
            }
            return originalMoveHeart.apply(this, arguments);
        };

        window._joystickMoveHeartPatched = true;
        console.log("[JOYSTICK] ✅ moveHeart пропатчен (Undertale)");
        return true;
    }

    // -------- ПАТЧ 2: Живой Камень --------
    function patchLivingStonePlayer() {
        if (typeof window.updateLivingStonePlayer !== 'function') return false;
        if (window._joystickLSPlayerPatched) return true;

        var original = window.updateLivingStonePlayer;
        window.updateLivingStonePlayer = function() {
            var j = window._joystick;
            var arena = getActiveArena();
            if (j && j.enabled && j.active && arena && arena.type === 'stone') {
                if (typeof lsTouchActive !== 'undefined') {
                    lsTouchActive = true;
                    if (typeof livingStonePlayer !== 'undefined') {
                        if (typeof lsTouchX !== 'undefined') lsTouchX = livingStonePlayer.x + j.vectorX * 100;
                        if (typeof lsTouchY !== 'undefined') lsTouchY = livingStonePlayer.y + j.vectorY * 100;
                    }
                }
            }
            return original.apply(this, arguments);
        };

        window._joystickLSPlayerPatched = true;
        console.log("[JOYSTICK] ✅ updateLivingStonePlayer пропатчен");
        return true;
    }

    // -------- ПАТЧ 3: Путеводная Звезда --------
    function patchWaystarPlayer() {
        if (typeof window.updateWaystarPlayer !== 'function') return false;
        if (window._joystickWSPlayerPatched) return true;

        var original = window.updateWaystarPlayer;
        window.updateWaystarPlayer = function() {
            var j = window._joystick;
            var arena = getActiveArena();
            if (j && j.enabled && j.active && arena && arena.type === 'waystar') {
                if (typeof waystarTouchActive !== 'undefined') {
                    waystarTouchActive = true;
                    if (typeof waystarPlayer !== 'undefined') {
                        if (typeof waystarTouchX !== 'undefined') waystarTouchX = waystarPlayer.x + j.vectorX * 100;
                        if (typeof waystarTouchY !== 'undefined') waystarTouchY = waystarPlayer.y + j.vectorY * 100;
                    }
                }
            }
            return original.apply(this, arguments);
        };

        window._joystickWSPlayerPatched = true;
        console.log("[JOYSTICK] ✅ updateWaystarPlayer пропатчен");
        return true;
    }

    // -------- ПАТЧ 4: Роджер vs Белоус --------
    function patchRWBPlayer() {
        if (typeof window.updateRWBPlayer !== 'function') return false;
        if (window._joystickRWBPlayerPatched) return true;

        var original = window.updateRWBPlayer;
        window.updateRWBPlayer = function() {
            var j = window._joystick;
            var arena = getActiveArena();
            if (j && j.enabled && j.active && arena && arena.type === 'rwb') {
                // RWB использует rwbTouchActive/rwbTouchX/rwbTouchY
                if (typeof rwbTouchActive !== 'undefined') {
                    rwbTouchActive = true;
                    if (typeof rwbPlayer !== 'undefined' && rwbPlayer) {
                        if (typeof rwbTouchX !== 'undefined') rwbTouchX = rwbPlayer.x + j.vectorX * 100;
                        if (typeof rwbTouchY !== 'undefined') rwbTouchY = rwbPlayer.y + j.vectorY * 100;
                    }
                }
            }
            return original.apply(this, arguments);
        };

        window._joystickRWBPlayerPatched = true;
        console.log("[JOYSTICK] ✅ updateRWBPlayer пропатчен");
        return true;
    }

    // -------- ИНИЦИАЛИЗАЦИЯ ПАТЧЕЙ --------
    function tryPatches() {
        patchBattleMoveHeart();
        patchLivingStonePlayer();
        patchWaystarPlayer();
        patchRWBPlayer();
    }

    setTimeout(tryPatches, 800);
    setTimeout(tryPatches, 2000);
    setInterval(tryPatches, 3000);

    // ============================================================
    // ★★★ ЭКСПОРТ ★★★
    // ============================================================
    window.drawJoystick = drawJoystick;
    window.getJoystickVector = function() {
        var j = window._joystick;
        if (!j.enabled || !j.active) return { x: 0, y: 0, active: false };
        return { x: j.vectorX, y: j.vectorY, active: true };
    };
    window.isJoystickEnabled = function() { return window._joystick.enabled; };
    window.refreshJoystickSettings = readSettings;

    // ★ Первое чтение настроек при загрузке ★
    readSettings();

    // ============================================================
    // ЛОГ
    // ============================================================
    console.log("╔════════════════════════════════════════╗");
    console.log("║  🕹️ JOYSTICK v1.1 загружен             ║");
    console.log("║  ✅ Работает на ВСЕХ аренах            ║");
    console.log("║  ✅ Логи только при изменении          ║");
    console.log("║  ✅ Патчи для всех 4 боссов            ║");
    console.log("╚════════════════════════════════════════╝");

})();
