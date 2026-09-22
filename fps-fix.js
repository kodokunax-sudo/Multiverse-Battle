// ============================================================
// FPS-FIX v2.0 — Фиксированный FPS 60 для всей игры
// Устраняет проблему "быстро на телефоне, медленно на ноутбуке"
// ============================================================
// ПОДКЛЮЧАТЬ ПЕРВЫМ в index.html, ДО всех остальных скриптов!
// ============================================================

(function() {
    'use strict';

    // ★★★ ЗАЩИТА ОТ ДВОЙНОЙ ЗАГРУЗКИ ★★★
    if (window._fpsFixLoaded) {
        console.warn("[FPS-FIX] Уже загружен, игнорирую повтор.");
        return;
    }
    window._fpsFixLoaded = true;

    // ========== НАСТРОЙКИ ==========
    var TARGET_FPS = 60;                    // Целевой FPS
    var FRAME_TIME = 1000 / TARGET_FPS;     // ~16.67 мс
    var MAX_FRAME_TIME = 200;               // Защита от скачков (после таба)
    var MAX_FRAMES_PER_LOOP = 3;            // Защита от "спирали смерти"

    // ========== СОХРАНЯЕМ ОРИГИНАЛЬНЫЕ ФУНКЦИИ ==========
    var originalRAF = window.requestAnimationFrame.bind(window);
    var originalCAF = window.cancelAnimationFrame.bind(window);

    // ========== ХРАНИЛИЩЕ CALLBACK'ОВ ==========
    var rafCallbacks = {};      // { id: callback }
    var rafIdCounter = 1;       // Счётчик ID
    var mainLoopId = null;      // ID главного лупа
    var isRunning = false;      // Запущен ли главный луп
    var lastTime = performance.now();
    var accumulator = 0;

    // ========== СТАТИСТИКА ==========
    var stats = {
        framesProcessed: 0,
        lastFPS: 0,
        lastFPSTime: performance.now(),
        frameCount: 0
    };

    // ========== ПРОВЕРКА: ЕСТЬ ЛИ CALLBACK'И? ==========
    function hasCallbacks() {
        for (var id in rafCallbacks) {
            if (rafCallbacks.hasOwnProperty(id)) return true;
        }
        return false;
    }

    // ========== ГЛАВНЫЙ ЛУП ==========
    function mainLoop(currentTime) {
        var deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // ★ Защита от больших скачков (после переключения таба)
        if (deltaTime > MAX_FRAME_TIME) {
            deltaTime = MAX_FRAME_TIME;
        }
        // ★ Защита от отрицательного deltaTime (редкий баг браузеров)
        if (deltaTime < 0) deltaTime = 0;

        accumulator += deltaTime;

        // ★ Обрабатываем фиксированные кадры
        var framesProcessed = 0;

        while (accumulator >= FRAME_TIME && framesProcessed < MAX_FRAMES_PER_LOOP) {
            // Копируем callback'и и очищаем хранилище
            // (чтобы callback'и могли зарегать новый RAF)
            var callbacks = [];
            for (var id in rafCallbacks) {
                if (rafCallbacks.hasOwnProperty(id)) {
                    callbacks.push({ id: id, cb: rafCallbacks[id] });
                }
            }
            rafCallbacks = {};

            // Вызываем все callback'и
            for (var i = 0; i < callbacks.length; i++) {
                try {
                    callbacks[i].cb(currentTime);
                } catch(e) {
                    console.error("[FPS-FIX] Ошибка в callback (id " + callbacks[i].id + "):", e);
                }
            }

            accumulator -= FRAME_TIME;
            framesProcessed++;
            stats.framesProcessed++;
        }

        // ★ Если накопилось слишком много — сбрасываем
        if (accumulator > FRAME_TIME * MAX_FRAMES_PER_LOOP) {
            accumulator = FRAME_TIME;
        }

        // ★ Статистика FPS (обновляется раз в секунду)
        stats.frameCount++;
        var now = performance.now();
        var statsElapsed = now - stats.lastFPSTime;
        if (statsElapsed >= 1000) {
            stats.lastFPS = stats.frameCount * 1000 / statsElapsed;
            stats.frameCount = 0;
            stats.lastFPSTime = now;
        }

        // ★ Если есть ещё callback'и — продолжаем луп
        if (hasCallbacks()) {
            mainLoopId = originalRAF(mainLoop);
        } else {
            // Нет callback'ов — останавливаем луп (экономия батареи)
            isRunning = false;
            mainLoopId = null;
        }
    }

    // ========== ПЕРЕОПРЕДЕЛЯЕМ requestAnimationFrame ==========
    window.requestAnimationFrame = function(callback) {
        if (typeof callback !== 'function') {
            console.warn("[FPS-FIX] requestAnimationFrame: callback не функция");
            return -1;
        }

        var id = rafIdCounter++;
        rafCallbacks[id] = callback;

        // Запускаем главный луп если не запущен
        if (!isRunning) {
            isRunning = true;
            lastTime = performance.now();
            accumulator = 0;
            mainLoopId = originalRAF(mainLoop);
        }

        return id;
    };

    // ========== ПЕРЕОПРЕДЕЛЯЕМ cancelAnimationFrame ==========
    window.cancelAnimationFrame = function(id) {
        if (rafCallbacks[id]) {
            delete rafCallbacks[id];
        }
    };

    // ========== ЭКСПОРТ ДЛЯ ОТЛАДКИ ==========
    window.getFPSStats = function() {
        return {
            currentFPS: stats.lastFPS.toFixed(1),
            totalFramesProcessed: stats.framesProcessed,
            activeCallbacks: Object.keys(rafCallbacks).length,
            isRunning: isRunning,
            targetFPS: TARGET_FPS
        };
    };

    // ========== ОТЛАДОЧНЫЙ ВЫВОД ==========
    console.log("╔════════════════════════════════════════╗");
    console.log("║  🎯 FPS-FIX v2.0 загружен              ║");
    console.log("║  Целевой FPS: " + TARGET_FPS + "                       ║");
    console.log("║  Статистика: getFPSStats()             ║");
    console.log("╚════════════════════════════════════════╝");

})();
