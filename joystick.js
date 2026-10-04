// ============================================================
// JOYSTICK v1.0 — Универсальный виртуальный джойстик
// ============================================================
// Работает на ВСЕХ аренах:
//   - Undertale (battle.js)
//   - Живой Камень (living_stone_boss.js)
//   - Путеводная Звезда (waystar_boss.js)
//   - Роджер vs Белоус (roger_whitebeard_boss.js)
//
// Включается в настройках: Прочее → ⚙️ Настройки
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
    // Все боссы читают этот объект для получения вектора движения
    window._joystick = {
        enabled: false,          // включён ли джойстик (по настройкам)
        active: false,           // идёт ли управление сейчас
        touchId: null,           // ID пальца
        baseX: 0, baseY: 0,      // центр базы
        knobX: 0, knobY: 0,      // положение шайбы
        maxRadius: 70,           // радиус базы в пикселях canvas
        deadzone: 10,            // мёртвая зона
        // ★ Вектор движения (от -1 до 1) — читают боссы ★
        vectorX: 0,
        vectorY: 0,
        // ★ Настройки ★
        sizeMult: 1.0,           // 0.6 - 1.6
        opacity: 0.6,            // 0.2 - 1.0
        fixedBase: false,        // если true — база всегда в фикс. месте
        fixedBaseX: 0,
        fixedBaseY: 0
    };

    // ============================================================
    // ★★★ ЧТЕНИЕ НАСТРОЕК ИЗ arenaSettings ★★★
    // ============================================================
    function readSettings() {
        var settings = window.arenaSettings || (typeof arenaSettings !== 'undefined' ? arenaSettings : null);
        if (!settings) return;

        var control = settings.arenaControl || "auto";
        var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Определяем, включён ли джойстик
        if (control === "auto") {
            window._joystick.enabled = isMobile;
        } else if (control === "joystick") {
            window._joystick.enabled = true;
        } else {
            window._joystick.enabled = false;
        }

        // Размер
        window._joystick.sizeMult = (settings.joystickSize || 100) / 100;
        window._joystick.maxRadius = 70 * window._joystick.sizeMult;
        window._joystick.deadzone = 10 * window._joystick.sizeMult;

        // Прозрачность
        window._joystick.opacity = (settings.joystickOpacity || 60) / 100;

        console.log("[JOYSTICK] Настройки: enabled=" + window._joystick.enabled + ", size=" + window._joystick.maxRadius.toFixed(0) + "px, opacity=" + window._joystick.opacity.toFixed(2));
    }

    // ============================================================
    // ★★★ ОПРЕДЕЛЕНИЕ АКТИВНОЙ АРЕНЫ ★★★
    // ============================================================
    function getActiveArena() {
        try {
            // Обычная арена Undertale
            if (typeof arenaActive !== 'undefined' && arenaActive) {
                return {
                    type: 'arena',
                    canvas: (typeof canvas !== 'undefined') ? canvas : document.getElementById("arenaCanvas"),
                    phase: (typeof arenaPhase !== 'undefined') ? arenaPhase : "dodge",
                    playerX: (typeof heart !== 'undefined') ? heart.x : 200,
                    playerY: (typeof heart !== 'undefined') ? heart.y : 400
                };
            }
            // Живой Камень
            if (typeof livingStoneActive !== 'undefined' && livingStoneActive) {
                return {
                    type: 'stone',
                    canvas: (typeof canvas !== 'undefined') ? canvas : document.getElementById("arenaCanvas"),
                    phase: (typeof livingStoneState !== 'undefined') ? livingStoneState : "phase1",
                    playerX: (typeof livingStonePlayer !== 'undefined') ? livingStonePlayer.x : 200,
                    playerY: (typeof livingStonePlayer !== 'undefined') ? livingStonePlayer.y : 400
                };
            }
            // Путеводная Звезда
            if (typeof waystarActive !== 'undefined' && waystarActive) {
                return {
                    type: 'waystar',
                    canvas: (typeof canvas !== 'undefined') ? canvas : document.getElementById("arenaCanvas"),
                    phase: (typeof waystarState !== 'undefined') ? waystarState : "phase1",
                    playerX: (typeof waystarPlayer !== 'undefined') ? waystarPlayer.x : 200,
                    playerY: (typeof waystarPlayer !== 'undefined') ? waystarPlayer.y : 400
                };
            }
            // Роджер vs Белоус
            if (typeof window.rwbActive !== 'undefined' && window.rwbActive) {
                return {
                    type: 'rwb',
                    canvas: (typeof canvas !== 'undefined') ? canvas : document.getElementById("arenaCanvas"),
                    phase: (typeof rwbState !== 'undefined') ? rwbState : "fight1",
                    playerX: (typeof rwbPlayer !== 'undefined' && rwbPlayer) ? rwbPlayer.x : 200,
                    playerY: (typeof rwbPlayer !== 'undefined' && rwbPlayer) ? rwbPlayer.y : 400
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

        // Нормализуем (макс 1)
        var norm = Math.min(1, dist / j.maxRadius);
        j.vectorX = (dx / dist) * norm;
        j.vectorY = (dy / dist) * norm;
    }

    // ============================================================
    // ★★★ ПАТЧ CANVAS: перехватываем тач-события ★★★
    // ============================================================
    function patchCanvas(canvas) {
        if (!canvas || canvas._joystickPatched) return;
        canvas._joystickPatched = true;

        var originalTouchStart = null;
        var originalTouchMove = null;
        var originalTouchEnd = null;

        canvas.addEventListener("touchstart", function(ev) {
            readSettings();
            var j = window._joystick;
            if (!j.enabled) return;

            var arena = getActiveArena();
            if (!arena) return;

            // Если фаза атаки на Undertale — не активируем джойстик (тап по целям)
            if (arena.type === 'arena' && arena.phase === 'attack') return;

            if (!canControl(arena)) return;

            ev.preventDefault();

            for (var i = 0; i < ev.touches.length; i++) {
                var t = ev.touches[i];
                if (j.active) continue; // уже занят другим пальцем

                var rect = canvas.getBoundingClientRect();
                var tx = t.clientX - rect.left;
                var ty = t.clientY - rect.top;

                // ★ Активируем джойстик ★
                j.active = true;
                j.touchId = t.identifier;
                j.baseX = tx;
                j.baseY = ty;
                j.knobX = tx;
                j.knobY = ty;

                // Ограничиваем базу
                var minDist = j.maxRadius + 10;
                j.baseX = Math.max(minDist, Math.min(canvas.width - minDist, j.baseX));
                j.baseY = Math.max(minDist, Math.min(canvas.height - minDist, j.baseY));
                j.knobX = j.baseX;
                j.knobY = j.baseY;

                if (typeof playArenaSound === 'function') playArenaSound(400, 'sine', 0.05, 0.03);
                console.log("[JOYSTICK] Активирован на " + Math.floor(j.baseX) + "," + Math.floor(j.baseY) + " (арена: " + arena.type + ")");
            }
        }, { passive: false });

        canvas.addEventListener("touchmove", function(ev) {
            var j = window._joystick;
            if (!j.enabled || !j.active) return;

            var arena = getActiveArena();
            if (!canControl(arena)) return;

            ev.preventDefault();

            for (var i = 0; i < ev.touches.length; i++) {
                var t = ev.touches[i];
                if (t.identifier !== j.touchId) continue;

                var rect = canvas.getBoundingClientRect();
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

        canvas.addEventListener("touchend", function(ev) {
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

        canvas.addEventListener("touchcancel", function() {
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

        // Используем текущий ctx (общий для всех арен)
        var context = null;
        try {
            if (typeof ctx !== 'undefined' && ctx) context = ctx;
        } catch(e) {}
        if (!context) return;

        context.save();
        context.globalAlpha = j.opacity;

        // ===== База (внешний круг) =====
        context.strokeStyle = "#ffffff";
        context.lineWidth = 3;
        context.shadowColor = "#000000";
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.maxRadius, 0, Math.PI * 2);
        context.stroke();

        // ===== Заливка базы =====
        context.fillStyle = "rgba(255, 255, 255, 0.08)";
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.maxRadius, 0, Math.PI * 2);
        context.fill();

        // ===== Мёртвая зона =====
        context.strokeStyle = "rgba(255, 255, 255, 0.3)";
        context.lineWidth = 1;
        context.shadowBlur = 0;
        context.beginPath();
        context.arc(j.baseX, j.baseY, j.deadzone, 0, Math.PI * 2);
        context.stroke();

        // ===== Стрелки-подсказки =====
        context.strokeStyle = "rgba(255, 255, 255, 0.35)";
        context.lineWidth = 2;
        var arrowDist = j.maxRadius * 0.72;
        var arrowSize = j.maxRadius * 0.13;

        // Вверх
        context.beginPath();
        context.moveTo(j.baseX, j.baseY - arrowDist + arrowSize);
        context.lineTo(j.baseX - arrowSize, j.baseY - arrowDist);
        context.lineTo(j.baseX + arrowSize, j.baseY - arrowDist);
        context.closePath();
        context.stroke();
        // Вниз
        context.beginPath();
        context.moveTo(j.baseX, j.baseY + arrowDist - arrowSize);
        context.lineTo(j.baseX - arrowSize, j.baseY + arrowDist);
        context.lineTo(j.baseX + arrowSize, j.baseY + arrowDist);
        context.closePath();
        context.stroke();
        // Влево
        context.beginPath();
        context.moveTo(j.baseX - arrowDist + arrowSize, j.baseY);
        context.lineTo(j.baseX - arrowDist, j.baseY - arrowSize);
        context.lineTo(j.baseX - arrowDist, j.baseY + arrowSize);
        context.closePath();
        context.stroke();
        // Вправо
        context.beginPath();
        context.moveTo(j.baseX + arrowDist - arrowSize, j.baseY);
        context.lineTo(j.baseX + arrowDist, j.baseY - arrowSize);
        context.lineTo(j.baseX + arrowDist, j.baseY + arrowSize);
        context.closePath();
        context.stroke();

        // ===== Шайба (knob) =====
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

        // ===== Линия от базы к шайбе =====
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
    var _updateInterval = setInterval(function() {
        var j = window._joystick;
        if (!j.enabled) return;

        readSettings();
        updateVector();

        // Авто-деактивация, если арена закрылась
        var arena = getActiveArena();
        if (!arena && j.active) {
            j.active = false;
            j.touchId = null;
            j.vectorX = 0;
            j.vectorY = 0;
        }
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

    // Пытаемся патчить сразу и потом каждые 500мс (на случай поздней загрузки)
    setTimeout(tryPatchCanvas, 500);
    setInterval(tryPatchCanvas, 500);

    // ============================================================
    // ★★★ ЭКСПОРТ ФУНКЦИИ РИСОВАНИЯ ★★★
    // ============================================================
    // Боссы должны вызывать window.drawJoystick() в конце своего renderLoop
    window.drawJoystick = drawJoystick;

    // ★★★ ЭКСПОРТ ВЕКТОРА ДЛЯ БОССОВ ★★★
    // Боссы должны читать window._joystick.vectorX / vectorY
    window.getJoystickVector = function() {
        var j = window._joystick;
        if (!j.enabled || !j.active) return { x: 0, y: 0, active: false };
        return { x: j.vectorX, y: j.vectorY, active: true };
    };

    window.isJoystickEnabled = function() { return window._joystick.enabled; };
    window.refreshJoystickSettings = readSettings;

    // ============================================================
    // ЛОГ
    // ============================================================
    console.log("╔════════════════════════════════════════╗");
    console.log("║  🕹️ JOYSTICK v1.0 загружен             ║");
    console.log("║  ✅ Работает на ВСЕХ аренах            ║");
    console.log("║  ✅ Включается в настройках            ║");
    console.log("║  ✅ Авто-выбор для телефона            ║");
    console.log("║  Экспорт: window._joystick             ║");
    console.log("║  Вектор: window.getJoystickVector()    ║");
    console.log("╚════════════════════════════════════════╝");

})();
