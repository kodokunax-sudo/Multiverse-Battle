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

    // ========== ПАТЧ victory (уведомление при победе над 500) ==========
    function patchVictory() {
        if (typeof window.victory !== 'function') return false;
        if (window._evolutionVictoryPatched) return true;

        let originalVictory = window.victory;

        window.victory = function() {
            originalVictory.apply(this, arguments);

            setTimeout(function() {
                try {
                    if (typeof defeatedBosses !== 'undefined'
                        && Array.isArray(defeatedBosses)
                        && defeatedBosses.includes(500)) {
                        if (typeof window.renderEvoTab === 'function') window.renderEvoTab();
                        if (typeof showFloatingText === 'function') {
                            showFloatingText("🧬 ЭВОЛЮЦИЯ РАЗБЛОКИРОВАНА!", "#e056fd");
                        }
                        if (typeof saveAll === 'function') saveAll();
                    }
                } catch(e) {}
            }, 500);
        };

        window._evolutionVictoryPatched = true;
        return true;
    }

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
            let g = patchVictory();

            if (a && b && c && d && e && f && g) {
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
                console.warn("[EVO-UNLOCK] Не всё пропатчено. renderEvoTab:", a, "| checkEvolutionQuests:", b, "| switchSubTab:", c, "| doRebirth:", d, "| loadGameData:", e, "| saveAll:", f, "| victory:", g);
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
