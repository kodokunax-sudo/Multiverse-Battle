// ============================================================
// EVOLUTION UNLOCK v2.0 — Разблокировка вкладки «Эволюция»
// ============================================================
// ЧИСТЫЕ УСЛОВИЯ: победа над Путеводной Звездой (500) ИЛИ её пощада
// НЕ зависит от ребиртхов
// НЕ делает флаг "залипающим"
// Автоматически чистит устаревший флаг
// ============================================================

(function() {
    'use strict';

    if (window._evolutionUnlockLoaded) {
        console.warn("[EVO-UNLOCK] Уже загружено, игнорирую повтор.");
        return;
    }
    window._evolutionUnlockLoaded = true;

    // ========== ЧИСТАЯ ПРОВЕРКА РАЗБЛОКИРОВКИ ==========
    function isEvolutionUnlocked() {
        // Условие 1: победа над Путеводной Звездой (500) — есть в defeatedBosses
        try {
            if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
                if (defeatedBosses.includes(500)) return true;
            }
        } catch(e) {}

        // Условие 2: пощада Звезды (записан флаг долга)
        try {
            if (typeof window !== 'undefined' && window.waystarOwesDebt === true) return true;
            if (typeof slotData !== 'undefined' && slotData && slotData.waystarOwesDebt === true) return true;
        } catch(e) {}

        return false;
    }

    // ========== ОЧИСТКА УСТАРЕВШЕГО ФЛАГА ==========
    // Если флаг стоит, но легитимных причин нет — сбрасываем
    function cleanStaleFlag() {
        try {
            if (typeof slotData !== 'undefined' && slotData) {
                if (slotData.evolutionUnlocked === true && !isEvolutionUnlocked()) {
                    console.warn("[EVO-UNLOCK] Устаревший флаг evolutionUnlocked найден. Сбрасываю.");
                    slotData.evolutionUnlocked = false;
                }
            }
        } catch(e) {}
    }

    // ========== ПАТЧ renderEvoTab ==========
    function patchedRenderEvoTab() {
        let c = document.getElementById("evoContent");
        if (!c) return;

        if (!isEvolutionUnlocked()) {
            c.innerHTML = `
                <div style="text-align:center;padding:20px 10px;">
                    <div style="font-size:60px;margin-bottom:15px;filter:drop-shadow(0 0 20px #9b59b6);">🧬</div>
                    <div style="font-weight:900;font-size:18px;color:#e056fd;margin-bottom:10px;text-shadow:0 0 12px rgba(224,86,253,0.5);">ЭВОЛЮЦИЯ ЗАКРЫТА</div>
                    <div style="font-size:13px;color:#bbb;line-height:1.6;margin-bottom:20px;padding:0 10px;">
                        Чтобы открыть эту вкладку, нужно<br>
                        победить особого босса на <b style="color:#ffd700;">500 волне</b>:
                    </div>
                    <div style="background:linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,170,0,0.08));border:2px solid #ffd700;border-radius:16px;padding:15px;margin:0 auto;max-width:280px;box-shadow:0 0 25px rgba(255,215,0,0.3);">
                        <div style="font-size:50px;margin-bottom:8px;filter:drop-shadow(0 0 15px #ffd700);">🌟</div>
                        <div style="font-weight:900;font-size:16px;color:#ffd700;margin-bottom:4px;text-shadow:0 0 10px rgba(255,215,0,0.6);">ПУТЕВОДНАЯ ЗВЕЗДА</div>
                        <div style="font-size:11px;color:#ffd700;">Волна 500</div>
                    </div>
                    <div style="margin-top:20px;padding:12px;background:rgba(0,0,0,0.3);border-radius:12px;font-size:11px;color:#aaa;line-height:1.6;">
                        💡 <b>Как добраться до 500 волны:</b><br>
                        • Фарми волны кликером<br>
                        • Качай мастерство карт<br>
                        • Побеждай боссов на каждой 50-й волне<br>
                        • Делай ребиртх при упоре в стену
                    </div>
                </div>
            `;
            return;
        }

        // Разблокировано — вызываем оригинал (из ui.js)
        if (typeof window._originalRenderEvoTab === 'function') {
            window._originalRenderEvoTab();
        } else {
            c.innerHTML = '<div style="text-align:center;color:#2ecc71;padding:20px;font-weight:900;">🧬 ЭВОЛЮЦИЯ РАЗБЛОКИРОВАНА!</div>';
        }
    }

    // ========== ПАТЧ saveAll (убираем «залипание») ==========
    function patchSaveAll() {
        if (typeof window.saveAll !== 'function') return false;
        if (window._evolutionSavePatched) return true;

        let originalSave = window.saveAll;

        window.saveAll = function() {
            // Пересчитываем флаг КАЖДЫЙ РАЗ без залипания
            try {
                if (typeof slotData !== 'undefined' && slotData) {
                    slotData.evolutionUnlocked = isEvolutionUnlocked();
                }
            } catch(e) {}
            originalSave.apply(this, arguments);
        };

        window._evolutionSavePatched = true;
        return true;
    }

    // ========== ПАТЧ loadGameData (убираем авто-пуш 500) ==========
    function patchLoadGameData() {
        if (typeof window.loadGameData !== 'function') return false;
        if (window._evolutionLoadPatched) return true;

        let originalLoad = window.loadGameData;

        window.loadGameData = function(d) {
            originalLoad.apply(this, arguments);

            // Просто чистим устаревший флаг — НЕ пушим 500
            cleanStaleFlag();

            // Перерисовываем вкладку
            setTimeout(function() {
                if (typeof window.renderEvoTab === 'function') {
                    window.renderEvoTab();
                }
            }, 300);
        };

        window._evolutionLoadPatched = true;
        return true;
    }

    // ========== ПАТЧ renderEvoTab ==========
    function patchRenderEvoTab() {
        if (typeof window.renderEvoTab !== 'function') return false;
        if (window._evolutionRenderPatched) return true;

        window._originalRenderEvoTab = window.renderEvoTab;
        window.renderEvoTab = patchedRenderEvoTab;

        window._evolutionRenderPatched = true;
        console.log("[EVO-UNLOCK] renderEvoTab пропатчен");
        return true;
    }

    // ========== ПАТЧ checkEvolutionQuests ==========
    function patchCheckEvolutionQuests() {
        if (typeof window.checkEvolutionQuests !== 'function') return false;
        if (window._evolutionCheckPatched) return true;

        let originalCheck = window.checkEvolutionQuests;

        window.checkEvolutionQuests = function() {
            if (!isEvolutionUnlocked()) return;
            originalCheck.apply(this, arguments);
        };

        window._evolutionCheckPatched = true;
        return true;
    }

    // ========== ПАТЧ switchSubTab ==========
    function patchSwitchSubTab() {
        if (typeof window.switchSubTab !== 'function') return false;
        if (window._evolutionSwitchPatched) return true;

        let originalSwitch = window.switchSubTab;

        window.switchSubTab = function(subtabName, parentTabId) {
            originalSwitch.apply(this, arguments);
            if (subtabName === "evolution") {
                setTimeout(function() {
                    if (typeof window.renderEvoTab === 'function') {
                        window.renderEvoTab();
                    }
                }, 10);
            }
        };

        window._evolutionSwitchPatched = true;
        return true;
    }

    // ========== ПАТЧ doRebirth (сохраняем 500 в defeatedBosses) ==========
    function patchDoRebirth() {
        if (typeof window.doRebirth !== 'function') return false;
        if (window._evolutionRebirthPatched) return true;

        let originalRebirth = window.doRebirth;

        window.doRebirth = function() {
            let hadWaystar = false;
            try {
                hadWaystar = typeof defeatedBosses !== 'undefined'
                    && Array.isArray(defeatedBosses)
                    && defeatedBosses.includes(500);
            } catch(e) {}

            originalRebirth.apply(this, arguments);

            // Восстанавливаем 500 после очистки
            if (hadWaystar) {
                try {
                    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
                        if (!defeatedBosses.includes(500)) defeatedBosses.push(500);
                    }
                } catch(e) {}
            }

            // Обновляем флаг и перерисовываем
            setTimeout(function() {
                try {
                    if (typeof slotData !== 'undefined' && slotData) {
                        slotData.evolutionUnlocked = isEvolutionUnlocked();
                    }
                } catch(e) {}
                if (typeof window.renderEvoTab === 'function') window.renderEvoTab();
                if (typeof saveAll === 'function') saveAll();
            }, 200);
        };

        window._evolutionRebirthPatched = true;
        return true;
    }

    // ========== ОДНОРАЗОВОЕ УВЕДОМЛЕНИЕ ОБ ОТКРЫТИИ ВКЛАДКИ ==========
    function showEvolutionUnlockToast() {
        if (typeof document === "undefined" || !document.body) return;
        if (document.getElementById("mbEvolutionUnlockToast")) return;

        var toast = document.createElement("div");
        toast.id = "mbEvolutionUnlockToast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.style.cssText = "position:fixed;top:16px;left:50%;transform:translate(-50%,-24px);opacity:0;z-index:999999;width:min(480px,calc(100vw - 24px));box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:13px 42px 13px 14px;border:1px solid rgba(184,153,255,.48);border-radius:17px;background:linear-gradient(120deg,rgba(30,23,48,.98),rgba(16,19,32,.98));box-shadow:0 16px 48px rgba(0,0,0,.48),0 0 28px rgba(151,105,255,.18);backdrop-filter:blur(14px);color:#f5f0ff;transition:opacity .24s ease,transform .24s ease;font-family:inherit;";

        var icon = document.createElement("div");
        icon.textContent = "🧬";
        icon.style.cssText = "flex:0 0 42px;width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:rgba(160,125,255,.17);font-size:24px;";

        var content = document.createElement("div");
        content.style.cssText = "min-width:0;display:flex;flex-direction:column;gap:3px;";
        var kicker = document.createElement("div");
        kicker.textContent = "🧬 ДОСТУП К РАЗДЕЛУ ОТКРЫТ";
        kicker.style.cssText = "font-size:10px;letter-spacing:1.2px;font-weight:950;color:#bda7ff;";
        var heading = document.createElement("div");
        heading.textContent = "Вкладка «Эволюция»";
        heading.style.cssText = "font-size:15px;font-weight:950;line-height:1.25;color:#fff;";
        var detail = document.createElement("div");
        detail.textContent = "Теперь видны условия получения эволюционных карт. Сами карты нужно открыть отдельно.";
        detail.style.cssText = "font-size:11px;line-height:1.35;color:#c9c1da;overflow-wrap:anywhere;";
        content.appendChild(kicker);
        content.appendChild(heading);
        content.appendChild(detail);

        var close = document.createElement("button");
        close.type = "button";
        close.textContent = "×";
        close.setAttribute("aria-label", "Закрыть уведомление");
        close.style.cssText = "position:absolute;right:10px;top:8px;border:0;background:transparent;color:#bdb4d0;font-size:23px;line-height:1;cursor:pointer;padding:3px 5px;";
        close.addEventListener("click", function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        });

        toast.appendChild(icon);
        toast.appendChild(content);
        toast.appendChild(close);
        document.body.appendChild(toast);
        window.requestAnimationFrame(function () {
            toast.style.opacity = "1";
            toast.style.transform = "translate(-50%,0)";
        });
        if (typeof window.sfxUINotification === "function") window.sfxUINotification();
        window.setTimeout(function () {
            if (!toast.parentNode) return;
            toast.style.opacity = "0";
            toast.style.transform = "translate(-50%,-24px)";
            window.setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 280);
        }, 6200);
    }

    function notifyEvolutionTabUnlocked() {
        if (!isEvolutionUnlocked()) return false;
        if (typeof currentSlot === "undefined" || currentSlot < 0 ||
            typeof slotData === "undefined" || !slotData) return false;
        if (Number(slotData.evolutionUnlockNotificationVersion) >= 1) return false;

        // Save the notification ledger per save slot, just like one-time title notifications.
        slotData.evolutionUnlockNotificationVersion = 1;
        if (typeof window.saveAll === "function") window.saveAll();
        showEvolutionUnlockToast();
        return true;
    }
    window.MBNotifyEvolutionTabUnlocked = notifyEvolutionTabUnlocked;

    // ========== ФУНКЦИЯ СБРОСА (для отладки) ==========
    window.resetEvolutionUnlock = function() {
        console.log("[EVO-UNLOCK] Принудительный сброс...");
        try {
            // Убираем 500 из defeatedBosses
            if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
                let idx = defeatedBosses.indexOf(500);
                while (idx !== -1) {
                    defeatedBosses.splice(idx, 1);
                    idx = defeatedBosses.indexOf(500);
                }
            }
            // Сбрасываем флаги
            if (typeof slotData !== 'undefined' && slotData) {
                slotData.evolutionUnlocked = false;
                slotData.waystarOwesDebt = false;
            }
            if (typeof window !== 'undefined') {
                window.waystarOwesDebt = false;
            }
            // Сбрасываем прогресс эволюций
            if (typeof evoProgress !== 'undefined' && evoProgress) {
                evoProgress.luffyKingUnlocked = false;
                evoProgress.sgUnlocked = false;
                evoProgress.gkUnlocked = false;
                evoProgress.sevenUnlocked = false;
                evoProgress.williamUnlocked = false;
            }
            // Сохраняем и перерисовываем
            if (typeof saveAll === 'function') saveAll();
            if (typeof window.renderEvoTab === 'function') window.renderEvoTab();
            console.log("[EVO-UNLOCK] ✅ Сброс завершён. Эволюция закрыта.");
        } catch(e) {
            console.error("[EVO-UNLOCK] Ошибка сброса:", e);
        }
    };

    // ========== ФУНКЦИЯ РАЗБЛОКИРОВКИ (для отладки) ==========
    window.forceUnlockEvolution = function() {
        console.log("[EVO-UNLOCK] Принудительная разблокировка...");
        try {
            if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
                if (!defeatedBosses.includes(500)) defeatedBosses.push(500);
            }
            if (typeof slotData !== 'undefined' && slotData) {
                slotData.evolutionUnlocked = true;
            }
            if (typeof saveAll === 'function') saveAll();
            if (typeof window.renderEvoTab === 'function') window.renderEvoTab();
            console.log("[EVO-UNLOCK] ✅ Разблокировано!");
        } catch(e) {
            console.error("[EVO-UNLOCK] Ошибка:", e);
        }
    };

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        let attempts = 0;
        let maxAttempts = 100;

        function tryPatch() {
            attempts++;
            let a = patchRenderEvoTab();
            let b = patchCheckEvolutionQuests();
            let c = patchSwitchSubTab();
            let d = patchDoRebirth();
            let e = patchLoadGameData();
            let f = patchSaveAll();
            if (a && b && c && d && e && f) {
                // Чистим устаревший флаг сразу
                cleanStaleFlag();

                console.log("╔════════════════════════════════════════╗");
                console.log("║  🧬 EVOLUTION UNLOCK v2.0 загружено   ║");
                console.log("║  Условие: победа над Путеводной        ║");
                console.log("║  Звездой (500) ИЛИ её пощада           ║");
                console.log("║  Флаг больше не «залипает»             ║");
                console.log("║  Сброс: resetEvolutionUnlock()         ║");
                console.log("║  Форс: forceUnlockEvolution()          ║");
                console.log("╚════════════════════════════════════════╝");

                setTimeout(function() {
                    if (typeof window.renderEvoTab === 'function') {
                        window.renderEvoTab();
                    }
                }, 500);
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(tryPatch, 100);
            } else {
                console.warn("[EVO-UNLOCK] Не всё пропатчено. renderEvoTab:", a, "| checkEvolutionQuests:", b, "| switchSubTab:", c, "| doRebirth:", d, "| loadGameData:", e, "| saveAll:", f);
            }
        }

        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(tryPatch, 300);
        } else {
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(tryPatch, 500);
            });
        }
    }

    init();

    // ========== ЭКСПОРТ ==========
    window.isEvolutionUnlocked = isEvolutionUnlocked;

})();
