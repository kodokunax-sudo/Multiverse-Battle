// ============================================================
// JOYSTICK v3.0 — Mobile control + anti pull-to-refresh
// ============================================================
// ★ v3.0:
//   - ПЛАВАЮЩИЙ джойстик (появляется где тапнул)
//   - Красивый дизайн (градиенты, стрелки, блики)
//   - Плавный отклик (нелинейная кривая)
//   - ФИКС PULL-TO-REFRESH (не перезагружает при свайпе вниз)
//   - Работает на всех аренах
// ============================================================

(function() {
    'use strict';

    if (window._joystickLoaded) {
        console.warn("[JOYSTICK] Уже загружено.");
        return;
    }
    window._joystickLoaded = true;

    // ============================================================
    // ★★★ ФИКС PULL-TO-REFRESH ★★★
    // ============================================================
    var pullFixStyle = document.createElement('style');
    pullFixStyle.id = 'joystick-pull-fix';
    pullFixStyle.textContent = `
        /* Глобальный фикс pull-to-refresh */
        html, body {
            overscroll-behavior: none !important;
            overscroll-behavior-y: none !important;
            overscroll-behavior-x: none !important;
        }
        
        /* На арене — полная блокировка скролла и жестов */
        #arenaCanvas,
        #arenaOverlay,
        #arenaOverlay * {
            touch-action: none !important;
            -ms-touch-action: none !important;
            overscroll-behavior: contain !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-tap-highlight-color: transparent !important;
        }
        
        /* Пока идёт бой — блокируем body скролл */
        body.battle-active {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
        }
    `;
    document.head.appendChild(pullFixStyle);

    // Жёсткий anti-pull-to-refresh для всей игры. Особенно важен iOS/Safari,
    // где одного overscroll-behavior недостаточно.
    var pullGuard = { active: false, lastY: 0 };
    document.addEventListener('touchstart', function(e) {
        if (!e.touches || !e.touches.length) return;
        pullGuard.active = true;
        pullGuard.lastY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function() { pullGuard.active = false; }, { passive: true });
    document.addEventListener('touchcancel', function() { pullGuard.active = false; }, { passive: true });

    // Блокируем touchmove на документе когда идёт бой И защищаем верх страницы
    // от нисходящего свайпа, который браузер трактует как pull-to-refresh.
    document.addEventListener('touchmove', function(e) {
        var inBattle = false;
        try {
            inBattle = (
                (typeof arenaActive !== 'undefined' && arenaActive) ||
                (typeof livingStoneActive !== 'undefined' && livingStoneActive) ||
                (typeof waystarActive !== 'undefined' && waystarActive) ||
                (window.rwbActive === true)
            );
        } catch(err) {}
        
        var target = e.target;
        var isGameSurface = !!(target && (target.id === 'arenaCanvas' || (target.closest && target.closest('#arenaOverlay'))));
        var y = (e.touches && e.touches.length) ? e.touches[0].clientY : pullGuard.lastY;
        var movingDown = y > pullGuard.lastY + 1;
        pullGuard.lastY = y;

        // На самой верхушке страницы нисходящий жест НИКОГДА не отдаём браузеру.
        // Это закрывает pull-to-refresh даже вне боя.
        var atTop = (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0) <= 0;
        if (atTop && movingDown) {
            if (e.cancelable) e.preventDefault();
            return;
        }

        if (!inBattle) return;
        
        // Если тап был по canvas или overlay — блокируем скролл
        if (target && (
            target.id === 'arenaCanvas' ||
            (target.closest && target.closest('#arenaOverlay'))
        )) {
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    // Следим за состоянием боя и ставим класс на body
    setInterval(function() {
        var inBattle = false;
        try {
            inBattle = (
                (typeof arenaActive !== 'undefined' && arenaActive) ||
                (typeof livingStoneActive !== 'undefined' && livingStoneActive) ||
                (typeof waystarActive !== 'undefined' && waystarActive) ||
                (window.rwbActive === true)
            );
        } catch(err) {}
        
        if (inBattle && !document.body.classList.contains('battle-active')) {
            document.body.classList.add('battle-active');
        } else if (!inBattle && document.body.classList.contains('battle-active')) {
            document.body.classList.remove('battle-active');
        }
    }, 150);

    // ============================================================
    // ★★★ ГЛОБАЛЬНОЕ СОСТОЯНИЕ ★★★
    // ============================================================
    window._joystick = {
        enabled: false,
        active: false,
        touchId: null,
        baseX: 0, baseY: 0,
        knobX: 0, knobY: 0,
        maxRadius: 80,
        deadzone: 8,
        vectorX: 0,
        vectorY: 0,
        sizeMult: 1.0,
        opacity: 0.65,
        floating: true,
        // Для плавности
        targetVectorX: 0,
        targetVectorY: 0,
        currentVectorX: 0,
        currentVectorY: 0,
        smoothFactor: 0.55
    };

    var _lastSettings = { enabled: null, size: null, opacity: null };

    // ============================================================
    // ЧТЕНИЕ НАСТРОЕК
    // ============================================================
    function readSettings() {
        var settings = window.arenaSettings || (typeof arenaSettings !== 'undefined' ? arenaSettings : null);
        if (!settings) return;

        var control = settings.arenaControl || "auto";
        var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        var newEnabled;
        if (control === "auto") newEnabled = isMobile;
        else if (control === "joystick") newEnabled = true;
        else newEnabled = false;

        var newSizeMult = (settings.joystickSize || 100) / 100;
        var newMaxRadius = Math.round(80 * newSizeMult);
        var newDeadzone = Math.round(8 * newSizeMult);
        var newOpacity = (settings.joystickOpacity || 60) / 100;

        var j = window._joystick;
        j.enabled = newEnabled;
        j.sizeMult = newSizeMult;
        j.maxRadius = newMaxRadius;
        j.deadzone = newDeadzone;
        j.opacity = newOpacity;

        _lastSettings.enabled = newEnabled;
        _lastSettings.size = newMaxRadius;
        _lastSettings.opacity = newOpacity;
    }

    // ============================================================
    // ОПРЕДЕЛЕНИЕ АКТИВНОЙ АРЕНЫ
    // ============================================================
    function getActiveArena() {
        try {
            if (typeof window.getArenaActive === 'function' && window.getArenaActive() === true) {
                return { type: 'arena', canvas: document.getElementById("arenaCanvas"), phase: (typeof window.getArenaPhase === 'function') ? window.getArenaPhase() : "dodge" };
            }
            if (typeof window.getLivingStoneActive === 'function' && window.getLivingStoneActive() === true) {
                return { type: 'stone', canvas: document.getElementById("arenaCanvas"), phase: (typeof window.getLivingStoneState === 'function') ? window.getLivingStoneState() : "phase1" };
            }
            if (typeof window.getWaystarActive === 'function' && window.getWaystarActive() === true) {
                return { type: 'waystar', canvas: document.getElementById("arenaCanvas"), phase: (typeof window.getWaystarState === 'function') ? window.getWaystarState() : "phase1" };
            }
            if (typeof window.getRWBActive === 'function' && window.getRWBActive() === true) {
                return { type: 'rwb', canvas: document.getElementById("arenaCanvas"), phase: (typeof window.getRWBState === 'function') ? window.getRWBState() : "fight1" };
            }
            if (window.arenaActive === true) return { type: 'arena', canvas: document.getElementById("arenaCanvas"), phase: window.arenaPhase || "dodge" };
            if (window.livingStoneActive === true) return { type: 'stone', canvas: document.getElementById("arenaCanvas"), phase: window.livingStoneState || "phase1" };
            if (window.waystarActive === true) return { type: 'waystar', canvas: document.getElementById("arenaCanvas"), phase: window.waystarState || "phase1" };
            if (window.rwbActive === true) return { type: 'rwb', canvas: document.getElementById("arenaCanvas"), phase: window.rwbState || "fight1" };
        } catch(e) {}
        return null;
    }

    function canControl(arena) {
        if (!arena) return false;
        if (arena.type === 'arena') return arena.phase === "dodge";
        if (arena.type === 'stone') return arena.phase === "phase1" || arena.phase === "phase2";
        if (arena.type === 'waystar') return arena.phase === "phase1" || arena.phase === "phase2" || arena.phase === "phase3";
        if (arena.type === 'rwb') return arena.phase === "fight1" || arena.phase === "fight2";
        return false;
    }

    // ============================================================
    // ОБНОВЛЕНИЕ ВЕКТОРА (с плавностью)
    // ============================================================
    function updateVector() {
        var j = window._joystick;
        if (!j.active) {
            j.targetVectorX = 0;
            j.targetVectorY = 0;
        } else {
            var dx = j.knobX - j.baseX;
            var dy = j.knobY - j.baseY;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < j.deadzone) {
                j.targetVectorX = 0;
                j.targetVectorY = 0;
            } else {
                var norm = Math.min(1, dist / j.maxRadius);
                // ★ Нелинейная кривая — плавный старт, полная скорость в конце
                var curve = norm < 0.5 ? norm * 0.6 : 0.3 + (norm - 0.5) * 1.4;
                j.targetVectorX = (dx / dist) * curve;
                j.targetVectorY = (dy / dist) * curve;
            }
        }

        // ★ Сглаживание — плавный переход
        j.currentVectorX += (j.targetVectorX - j.currentVectorX) * j.smoothFactor;
        j.currentVectorY += (j.targetVectorY - j.currentVectorY) * j.smoothFactor;
        j.vectorX = j.currentVectorX;
        j.vectorY = j.currentVectorY;
    }

    // ============================================================
    // ПАТЧ CANVAS
    // ============================================================
    function patchCanvas(c) {
        if (!c || c._joystickPatched) return;
        c._joystickPatched = true;

        // ============ TOUCHSTART — ПОЯВЛЕНИЕ ДЖОЙСТИКА ============
        c.addEventListener("touchstart", function(ev) {
            var j = window._joystick;
            if (!j.enabled) return;

            var arena = getActiveArena();
            if (!arena) return;
            if (arena.type === 'arena' && arena.phase === 'attack') return;
            if (!canControl(arena)) return;

            // Если уже активен — не переключаем
            if (j.active) return;

            ev.preventDefault();
            ev.stopPropagation();

            var t = ev.touches[0];
            var rect = c.getBoundingClientRect();
            var tx = t.clientX - rect.left;
            var ty = t.clientY - rect.top;

            // ★★★ ПЛАВАЮЩИЙ — база появляется где тапнул ★★★
            j.baseX = tx;
            j.baseY = ty;
            j.knobX = tx;
            j.knobY = ty;
            j.touchId = t.identifier;
            j.active = true;
            j.targetVectorX = 0;
            j.targetVectorY = 0;
            j.currentVectorX = 0;
            j.currentVectorY = 0;
            j.vectorX = 0;
            j.vectorY = 0;

            // Подгоняем базу чтобы круг не вылезал за пределы
            var minDist = j.maxRadius + 8;
            j.baseX = Math.max(minDist, Math.min(c.width - minDist, j.baseX));
            j.baseY = Math.max(minDist, Math.min(c.height - minDist, j.baseY));
            j.knobX = j.baseX;
            j.knobY = j.baseY;

            if (typeof playArenaSound === 'function') {
                playArenaSound(500, 'sine', 0.04, 0.03);
            }
        }, { passive: false });

        // ============ TOUCHMOVE — движение пальца ============
        c.addEventListener("touchmove", function(ev) {
            var j = window._joystick;
            if (!j.enabled || !j.active) return;

            var arena = getActiveArena();
            if (!canControl(arena)) return;

            ev.preventDefault();
            ev.stopPropagation();

            for (var i = 0; i < ev.touches.length; i++) {
                var t = ev.touches[i];
                if (t.identifier !== j.touchId) continue;

                var rect = c.getBoundingClientRect();
                var tx = t.clientX - rect.left;
                var ty = t.clientY - rect.top;

                var dx = tx - j.baseX;
                var dy = ty - j.baseY;
                var dist = Math.sqrt(dx * dx + dy * dy);

                // ★ Если сильно оттянули — двигаем базу за пальцем (плавающий)
                if (dist > j.maxRadius * 1.4) {
                    var moveAmount = Math.min(dist - j.maxRadius * 1.4, j.maxRadius * 0.35);
                    j.baseX += (dx / dist) * moveAmount;
                    j.baseY += (dy / dist) * moveAmount;
                    // Ограничиваем базу
                    var minDist = j.maxRadius + 8;
                    j.baseX = Math.max(minDist, Math.min(c.width - minDist, j.baseX));
                    j.baseY = Math.max(minDist, Math.min(c.height - minDist, j.baseY));
                    dx = tx - j.baseX;
                    dy = ty - j.baseY;
                    dist = Math.sqrt(dx * dx + dy * dy);
                }

                if (dist > j.maxRadius) {
                    dx = (dx / dist) * j.maxRadius;
                    dy = (dy / dist) * j.maxRadius;
                }

                j.knobX = j.baseX + dx;
                j.knobY = j.baseY + dy;
                break;
            }
        }, { passive: false });

        // ============ TOUCHEND ============
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
                j.targetVectorX = 0;
                j.targetVectorY = 0;
            }
        });

        c.addEventListener("touchcancel", function() {
            var j = window._joystick;
            j.active = false;
            j.touchId = null;
            j.targetVectorX = 0;
            j.targetVectorY = 0;
        });

        // ============ MOUSE (для ПК/теста) ============
        c.addEventListener("mousedown", function(ev) {
            var j = window._joystick;
            if (!j.enabled) return;

            var arena = getActiveArena();
            if (!arena) return;
            if (arena.type === 'arena' && arena.phase === 'attack') return;
            if (!canControl(arena)) return;
            if (ev.button !== 0) return;

            ev.preventDefault();

            var rect = c.getBoundingClientRect();
            var tx = ev.clientX - rect.left;
            var ty = ev.clientY - rect.top;

            j.baseX = tx;
            j.baseY = ty;
            j.knobX = tx;
            j.knobY = ty;
            j.touchId = "mouse";
            j.active = true;
            j.targetVectorX = 0;
            j.targetVectorY = 0;
            j.currentVectorX = 0;
            j.currentVectorY = 0;

            var minDist = j.maxRadius + 8;
            j.baseX = Math.max(minDist, Math.min(c.width - minDist, j.baseX));
            j.baseY = Math.max(minDist, Math.min(c.height - minDist, j.baseY));
            j.knobX = j.baseX;
            j.knobY = j.baseY;
        });

        window.addEventListener("mousemove", function(ev) {
            var j = window._joystick;
            if (!j.enabled || !j.active || j.touchId !== "mouse") return;
            var arena = getActiveArena();
            if (!canControl(arena)) return;

            var rect = c.getBoundingClientRect();
            var tx = ev.clientX - rect.left;
            var ty = ev.clientY - rect.top;

            var dx = tx - j.baseX;
            var dy = ty - j.baseY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > j.maxRadius) { dx = (dx / dist) * j.maxRadius; dy = (dy / dist) * j.maxRadius; }
            j.knobX = j.baseX + dx;
            j.knobY = j.baseY + dy;
        });

        window.addEventListener("mouseup", function(ev) {
            var j = window._joystick;
            if (j.touchId === "mouse" && j.active) {
                j.active = false;
                j.touchId = null;
                j.targetVectorX = 0;
                j.targetVectorY = 0;
            }
        });

        c.addEventListener("contextmenu", function(ev) { ev.preventDefault(); });

        console.log("[JOYSTICK] Canvas пропатчен");
    }

    // ============================================================
    // РИСУЕМ ДЖОЙСТИК
    // ============================================================
    function drawJoystick() {
        var j = window._joystick;
        if (!j.enabled || !j.active) return;

        var context = null;
        try { if (typeof ctx !== 'undefined' && ctx) context = ctx; } catch(e) {}
        if (!context) return;

        context.save();
        context.globalAlpha = j.opacity;

        // ====== ВНЕШНИЙ КРУГ (фон) ======
        var outerGrad = context.createRadialGradient(
            j.baseX, j.baseY, j.maxRadius * 0.3,
            j.baseX, j.baseY, j.maxRadius
        );
        outerGrad.addColorStop(0, "rgba(20, 20, 40, 0.3)");
        outerGrad.addColorStop(0.7, "rgba(30, 30, 60, 0.4)");
        outerGrad.addColorStop(1, "rgba(10, 10, 25, 0.6)");
        context.fillStyle = outerGrad;
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.maxRadius, 0, Math.PI * 2);
        context.fill();

        // ====== ВНЕШНИЙ КОНТУР ======
        context.strokeStyle = "rgba(255, 255, 255, 0.85)";
        context.lineWidth = 3;
        context.shadowColor = "#000000";
        context.shadowBlur = 12;
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.maxRadius, 0, Math.PI * 2);
        context.stroke();
        context.shadowBlur = 0;

        // ====== ВНУТРЕННЯЯ ОБВОДКА (для красоты) ======
        context.strokeStyle = "rgba(255, 255, 255, 0.2)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.maxRadius - 4, 0, Math.PI * 2);
        context.stroke();

        // ====== СТРЕЛКИ ======
        var arrowDist = j.maxRadius * 0.78;
        var arrowSize = j.maxRadius * 0.13;
        var currentX = j.vectorX;
        var currentY = j.vectorY;

        // Цвет стрелок — ярче в направлении движения
        function getArrowColor(dirX, dirY) {
            var dot = currentX * dirX + currentY * dirY;
            if (dot > 0.3) return "#ffdd00";  // активная
            return "rgba(255, 255, 255, 0.5)";
        }

        // Вверх
        context.strokeStyle = getArrowColor(0, -1);
        context.lineWidth = 3;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(j.baseX, j.baseY - arrowDist + arrowSize);
        context.lineTo(j.baseX - arrowSize, j.baseY - arrowDist + arrowSize * 2);
        context.moveTo(j.baseX, j.baseY - arrowDist + arrowSize);
        context.lineTo(j.baseX + arrowSize, j.baseY - arrowDist + arrowSize * 2);
        context.stroke();

        // Вниз
        context.strokeStyle = getArrowColor(0, 1);
        context.beginPath();
        context.moveTo(j.baseX, j.baseY + arrowDist - arrowSize);
        context.lineTo(j.baseX - arrowSize, j.baseY + arrowDist - arrowSize * 2);
        context.moveTo(j.baseX, j.baseY + arrowDist - arrowSize);
        context.lineTo(j.baseX + arrowSize, j.baseY + arrowDist - arrowSize * 2);
        context.stroke();

        // Влево
        context.strokeStyle = getArrowColor(-1, 0);
        context.beginPath();
        context.moveTo(j.baseX - arrowDist + arrowSize, j.baseY);
        context.lineTo(j.baseX - arrowDist + arrowSize * 2, j.baseY - arrowSize);
        context.moveTo(j.baseX - arrowDist + arrowSize, j.baseY);
        context.lineTo(j.baseX - arrowDist + arrowSize * 2, j.baseY + arrowSize);
        context.stroke();

        // Вправо
        context.strokeStyle = getArrowColor(1, 0);
        context.beginPath();
        context.moveTo(j.baseX + arrowDist - arrowSize, j.baseY);
        context.lineTo(j.baseX + arrowDist - arrowSize * 2, j.baseY - arrowSize);
        context.moveTo(j.baseX + arrowDist - arrowSize, j.baseY);
        context.lineTo(j.baseX + arrowDist - arrowSize * 2, j.baseY + arrowSize);
        context.stroke();

        context.lineCap = "butt";

        // ====== ШАЙБА (KNOB) ======
        var knobRadius = j.maxRadius * 0.38;

        // Свечение под шайбой
        var glowGrad = context.createRadialGradient(
            j.knobX, j.knobY, 0,
            j.knobX, j.knobY, knobRadius * 2
        );
        glowGrad.addColorStop(0, "rgba(255, 221, 0, 0.5)");
        glowGrad.addColorStop(0.5, "rgba(255, 170, 0, 0.2)");
        glowGrad.addColorStop(1, "rgba(255, 170, 0, 0)");
        context.fillStyle = glowGrad;
        context.beginPath();
        context.arc(j.knobX, j.knobY, knobRadius * 2, 0, Math.PI * 2);
        context.fill();

        // Тело шайбы с градиентом
        var knobGrad = context.createRadialGradient(
            j.knobX - knobRadius * 0.35, j.knobY - knobRadius * 0.35, 1,
            j.knobX, j.knobY, knobRadius
        );
        knobGrad.addColorStop(0, "#ffffcc");
        knobGrad.addColorStop(0.3, "#ffdd44");
        knobGrad.addColorStop(0.7, "#ffaa00");
        knobGrad.addColorStop(1, "#cc6600");

        context.fillStyle = knobGrad;
        context.shadowColor = "#ff8800";
        context.shadowBlur = 22;
        context.beginPath();
        context.arc(j.knobX, j.knobY, knobRadius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;

        // Обводка шайбы
        context.strokeStyle = "#ffffff";
        context.lineWidth = 3;
        context.beginPath();
        context.arc(j.knobX, j.knobY, knobRadius, 0, Math.PI * 2);
        context.stroke();

        // Внутренняя обводка
        context.strokeStyle = "rgba(255, 200, 50, 0.8)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(j.knobX, j.knobY, knobRadius - 3, 0, Math.PI * 2);
        context.stroke();

        // Блик
        context.fillStyle = "rgba(255, 255, 255, 0.75)";
        context.beginPath();
        context.arc(
            j.knobX - knobRadius * 0.35,
            j.knobY - knobRadius * 0.35,
            knobRadius * 0.22,
            0, Math.PI * 2
        );
        context.fill();

        // ====== ЛИНИЯ ОТ БАЗЫ К ШАЙБЕ ======
        context.strokeStyle = "rgba(255, 221, 0, 0.55)";
        context.lineWidth = 3;
        context.shadowColor = "#ffdd00";
        context.shadowBlur = 8;
        context.beginPath();
        context.moveTo(j.baseX, j.baseY);
        context.lineTo(j.knobX, j.knobY);
        context.stroke();
        context.shadowBlur = 0;

        // ====== ТОЧКА В ЦЕНТРЕ БАЗЫ ======
        context.fillStyle = "rgba(255, 255, 255, 0.4)";
        context.beginPath();
        context.arc(j.baseX, j.baseY, 4, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "rgba(255, 255, 255, 0.7)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(j.baseX, j.baseY, 4, 0, Math.PI * 2);
        context.stroke();

        context.restore();
    }

    // ============================================================
    // АВТО-ОБНОВЛЕНИЕ ВЕКТОРА (60 fps)
    // ============================================================
    var vectorInterval = setInterval(function() {
        var j = window._joystick;
        if (!j.enabled) return;
        updateVector();
    }, 16);

    // ============================================================
    // ПАТЧ CANVAS при появлении
    // ============================================================
    function tryPatchCanvas() {
        var c = document.getElementById("arenaCanvas");
        if (c && !c._joystickPatched) patchCanvas(c);
    }

    setTimeout(tryPatchCanvas, 500);
    setInterval(tryPatchCanvas, 1500);

    // ============================================================
    // ПАТЧИ ДЛЯ БОССОВ
    // ============================================================
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

                if (typeof _superState !== 'undefined' && _superState.invertControls) { mx = -mx; my = -my; }

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
                    arenaTrail.push({
                        x: heart.x, y: heart.y, life: 12, maxLife: 12,
                        size: Math.max(1, heart.size * 0.75),
                        color: "rgba(255, 30, 30, 0.35)"
                    });
                }

                if (typeof arenaAttackType !== 'undefined' && arenaAttackType === 4) {
                    if (heart.x - heart.hitbox < 2 || heart.x + heart.hitbox > 398 || heart.y - heart.hitbox < 2 || heart.y + heart.hitbox > 498) {
                        if (invulnTimer <= 0) {
                            invulnTimer = 20;
                            applyHit(Math.max(8, Math.floor(arenaBaseDmg * 1.5)), "ШИПЫ!");
                        }
                    }
                }
                return;
            }
            return originalMoveHeart.apply(this, arguments);
        };

        window._joystickMoveHeartPatched = true;
        console.log("[JOYSTICK] ✅ moveHeart пропатчен");
        return true;
    }

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
        return true;
    }

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
        return true;
    }

    function patchRWBPlayer() {
        if (typeof window.updateRWBPlayer !== 'function') return false;
        if (window._joystickRWBPlayerPatched) return true;

        var original = window.updateRWBPlayer;
        window.updateRWBPlayer = function() {
            var j = window._joystick;
            var arena = getActiveArena();
            if (j && j.enabled && j.active && arena && arena.type === 'rwb') {
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
        return true;
    }

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
    // ЭКСПОРТ
    // ============================================================
    window.drawJoystick = drawJoystick;
    window.getJoystickVector = function() {
        var j = window._joystick;
        if (!j.enabled || !j.active) return { x: 0, y: 0, active: false };
        return { x: j.vectorX, y: j.vectorY, active: true };
    };
    window.isJoystickEnabled = function() { return window._joystick.enabled; };
    window.refreshJoystickSettings = readSettings;

    readSettings();

    console.log("╔════════════════════════════════════════╗");
    console.log("║  🕹️ JOYSTICK v3.0 загружен             ║");
    console.log("║  ✅ Плавающий джойстик                  ║");
    console.log("║  ✅ Красивый дизайн                     ║");
    console.log("║  ✅ Плавный отклик                      ║");
    console.log("║  ✅ Жёсткий anti-pull-to-refresh        ║");
    console.log("║  ✅ Mobile touch guard                  ║");
    console.log("╚════════════════════════════════════════╝");

})();
