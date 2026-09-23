// ============================================================
// FIX CODE v1.0 — Сброс использованного промокода
// ============================================================
// Убирает "DrinkTea2Win" из usedCodes, чтобы его можно было ввести заново.
// Работает автоматически при загрузке сейва + доступна ручная функция.
//
// ПОДКЛЮЧАТЬ ПОСЛЕ game.js
// ============================================================

(function() {
    'use strict';

    if (window._fixCodeLoaded) {
        console.warn("[FIX-CODE] Уже загружено, игнорирую повтор.");
        return;
    }
    window._fixCodeLoaded = true;

    // ========== КОДЫ, КОТОРЫЕ НАДО СБРОСИТЬ ==========
    // Добавляй сюда любые коды, если у друга забагались
    const CODES_TO_RESET = ["DrinkTea2Win"];

    // ========== ФУНКЦИЯ СБРОСА ==========
    function resetCodes(codesArray) {
        if (!codesArray || !codesArray.length) codesArray = CODES_TO_RESET;

        let removed = 0;
        try {
            if (typeof usedCodes !== 'undefined' && Array.isArray(usedCodes)) {
                for (let code of codesArray) {
                    let idx = usedCodes.indexOf(code);
                    while (idx !== -1) {
                        usedCodes.splice(idx, 1);
                        removed++;
                        idx = usedCodes.indexOf(code);
                    }
                }
                console.log("[FIX-CODE] Сброшено кодов:", removed, "| Удалены:", codesArray.join(", "));
            } else {
                console.warn("[FIX-CODE] usedCodes не найден");
            }

            // Синхронизируем с сейвом
            if (typeof slotData !== 'undefined' && slotData) {
                if (Array.isArray(slotData.usedCodes)) {
                    for (let code of codesArray) {
                        let idx = slotData.usedCodes.indexOf(code);
                        while (idx !== -1) {
                            slotData.usedCodes.splice(idx, 1);
                            idx = slotData.usedCodes.indexOf(code);
                        }
                    }
                }
                // На всякий случай — принудительно перезапишем
                slotData.usedCodes = usedCodes;
            }

            if (typeof saveAll === 'function') saveAll();

            return removed;
        } catch (e) {
            console.error("[FIX-CODE] Ошибка сброса:", e);
            return 0;
        }
    }

    // ========== ФУНКЦИЯ ДЛЯ РУЧНОГО СБРОСА ЧЕРЕЗ КОНСОЛЬ ==========
    window.resetPromoCode = function(code) {
        if (!code) {
            console.log("[FIX-CODE] Использование: resetPromoCode('DrinkTea2Win')");
            return;
        }
        let removed = resetCodes([code]);
        console.log("[FIX-CODE] Код '" + code + "' сброшен. Удалено:", removed);
        if (removed > 0) {
            if (typeof showFloatingText === 'function') {
                showFloatingText("✅ Код '" + code + "' можно ввести заново!", "#2ecc71");
            }
        } else {
            console.log("[FIX-CODE] Код '" + code + "' не был использован — вводи спокойно!");
        }
    };

    // ========== АВТО-СБРОС ПРИ ЗАГРУЗКЕ ==========
    // Ждём, пока игра загрузит сейв, потом сбрасываем коды
    function tryAutoReset() {
        if (typeof usedCodes === 'undefined') return false;
        if (typeof saveAll !== 'function') return false;

        console.log("[FIX-CODE] Авто-сброс при загрузке...");
        let removed = resetCodes(CODES_TO_RESET);
        console.log("[FIX-CODE] ✅ Авто-сброс завершён. Удалено:", removed);
        return true;
    }

    // Пытаемся сбросить при загрузке с задержкой (ждём загрузки сейва)
    let attempts = 0;
    let maxAttempts = 50;
    function waitForGame() {
        attempts++;
        // Ждём, пока currentSlot будет >= 0 (значит сейв загружен)
        if (typeof currentSlot !== 'undefined' && currentSlot >= 0) {
            setTimeout(tryAutoReset, 500);
            return;
        }
        if (attempts < maxAttempts) {
            setTimeout(waitForGame, 100);
        } else {
            console.warn("[FIX-CODE] Не удалось дождаться загрузки сейва");
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(waitForGame, 500);
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            setTimeout(waitForGame, 1000);
        });
    }

    // ========== ЭКСПОРТ ==========
    window.resetCodes = resetCodes;
    window.CODES_TO_RESET = CODES_TO_RESET;

    console.log("╔════════════════════════════════════════╗");
    console.log("║  🔧 FIX CODE v1.0 загружено           ║");
    console.log("║  Сброс кодов:", CODES_TO_RESET.join(", "));
    console.log("║  Ручной сброс: resetPromoCode('код')   ║");
    console.log("╚════════════════════════════════════════╝");

})();
