// ============================================================
// EVOLUTION UNLOCK v1.0 — Разблокировка вкладки «Эволюция»
// ============================================================
// Теперь вкладка открывается после победы над Путеводной Звездой
// (босс 500 волны), НЕ зависит от количества ребиртхов.
//
// ПОДКЛЮЧАТЬ ПОСЛЕ ui.js, ПОСЛЕ game.js, ПОСЛЕ waystar_boss.js
// ============================================================

(function() {
    'use strict';

    if (window._evolutionUnlockLoaded) {
        console.warn("[EVO-UNLOCK] Уже загружено, игнорирую повтор.");
        return;
    }
    window._evolutionUnlockLoaded = true;

    // ========== ПРОВЕРКА: РАЗБЛОКИРОВАНА ЛИ ЭВОЛЮЦИЯ ==========
    function isEvolutionUnlocked() {
        // 1. Убил Путеводную Звезду (500 волна) — основное условие
        try {
            if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
                if (defeatedBosses.includes(500)) return true;
            }
        } catch(e) {}

        // 2. Запасной путь: если кто-то пощадил Звезду и записан долг
        try {
            if (typeof window !== 'undefined' && window.waystarOwesDebt === true) return true;
            if (typeof slotData !== 'undefined' && slotData && slotData.waystarOwesDebt === true) return true;
        } catch(e) {}

        // 3. Для старых сохранений: если уже открыта хоть одна эволюция
        try {
            if (typeof evoProgress !== 'undefined' && evoProgress) {
                if (evoProgress.luffyKingUnlocked ||
                    evoProgress.sgUnlocked ||
                    evoProgress.gkUnlocked ||
                    evoProgress.sevenUnlocked ||
                    evoProgress.williamUnlocked) {
                    return true;
                }
            }
        } catch(e) {}

        // 4. Флаг-сохранение в слоте (на случай будущих механик)
        try {
            if (typeof slotData !== 'undefined' && slotData && slotData.evolutionUnlocked === true) {
                return true;
            }
        } catch(e) {}

        return false;
    }

    // ========== ЗАМЕНА renderEvoTab ==========
    // Оригинал требует rebirthCount < 5. Наша версия — по Путеводной Звезде.
    function patchedRenderEvoTab() {
        let c = document.getElementById("evoContent");
        if (!c) return;

        // ★ НОВОЕ УСЛОВИЕ: победа над Путеводной Звездой ★
        if (!isEvolutionUnlocked()) {
            let progressHtml = `
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
            c.innerHTML = progressHtml;
            return;
        }

        // ★ РАЗБЛОКИРОВАНО — рисуем оригинальный контент ★
        // Вызываем оригинальную renderEvoTab (она рисует квесты)
        if (typeof window._originalRenderEvoTab === 'function') {
            window._originalRenderEvoTab();
        } else {
            // Если оригинала нет — минимальный fallback
            c.innerHTML = '<div style="text-align:center;color:#888;">Эволюция разблокирована! (перезагрузи страницу)</div>';
        }
    }

    // ========== ПАТЧ renderEvoTab ==========
    function patchRenderEvoTab() {
        if (typeof window.renderEvoTab !== 'function') return false;
        if (window._evolutionRenderPatched) return true;

        // Сохраняем оригинал
        window._originalRenderEvoTab = window.renderEvoTab;
        // Заменяем
        window.renderEvoTab = patchedRenderEvoTab;

        // Также на случай, если game.js вызывает функцию по имени в глобальном scope
        if (typeof window.renderEvoTab === 'function') {
            window.renderEvoTab = patchedRenderEvoTab;
        }

        window._evolutionRenderPatched = true;
        console.log("[EVO-UNLOCK] renderEvoTab пропатчен");
        return true;
    }

    // ========== ПАТЧ checkEvolutionQuests ==========
    // Оригинал: if (rebirthCount < 5) return;
    // Наш: if (!isEvolutionUnlocked()) return;
    function patchCheckEvolutionQuests() {
        if (typeof window.checkEvolutionQuests !== 'function') return false;
        if (window._evolutionCheckPatched) return true;

        let originalCheck = window.checkEvolutionQuests;

        window.checkEvolutionQuests = function() {
            // ★ НОВОЕ УСЛОВИЕ ★
            if (!isEvolutionUnlocked()) return;
            // Вызываем оригинал
            originalCheck.apply(this, arguments);
        };

        window._evolutionCheckPatched = true;
        console.log("[EVO-UNLOCK] checkEvolutionQuests пропатчен");
        return true;
    }

    // ========== ПАТЧ SWITCHSUBTAB (для правильного показа) ==========
    function patchSwitchSubTab() {
        if (typeof window.switchSubTab !== 'function') return false;
        if (window._evolutionSwitchPatched) return true;

        let originalSwitch = window.switchSubTab;

        window.switchSubTab = function(subtabName, parentTabId) {
            originalSwitch.apply(this, arguments);
            // Если открыли "Эволюцию" — вызываем наш renderEvoTab
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

    // ========== ПАТЧ DO REBIRTH (не сбрасывать флаг победы над Звездой) ==========
    // В doRebirth() defeatedBosses = [] — но нам нужно сохранить 500
    function patchDoRebirth() {
        if (typeof window.doRebirth !== 'function') return false;
        if (window._evolutionRebirthPatched) return true;

        let originalRebirth = window.doRebirth;

        window.doRebirth = function() {
            // ★ СОХРАНЯЕМ ПОБЕДУ НАД ЗВЕЗДОЙ ДО РЕБИРТХА ★
            let hadWaystar = false;
            try {
                hadWaystar = typeof defeatedBosses !== 'undefined'
                    && Array.isArray(defeatedBosses)
                    && defeatedBosses.includes(500);
            } catch(e) {}

            originalRebirth.apply(this, arguments);

            // ★ ВОССТАНАВЛИВАЕМ ФЛАГ ПОСЛЕ ★
            // (в doRebirth defeatedBosses = [], но эволюция должна остаться)
            if (hadWaystar) {
                try {
                    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
                        if (!defeatedBosses.includes(500)) defeatedBosses.push(500);
                    }
                    if (typeof slotData !== 'undefined' && slotData) {
                        slotData.evolutionUnlocked = true;
                    }
                } catch(e) {}
            }

            // ★ ПЕРЕРИСОВЫВАЕМ ВКЛАДКУ ПОСЛЕ ★
            setTimeout(function() {
                if (typeof window.renderEvoTab === 'function') {
                    window.renderEvoTab();
                }
                if (typeof saveAll === 'function') saveAll();
            }, 200);

            console.log("[EVO-UNLOCK] Ребиртх: флаг Путеводной Звезды сохранён:", hadWaystar);
        };

        window._evolutionRebirthPatched = true;
        return true;
    }

    // ========== ПАТЧ LOADGAMEDATA (при загрузке — проверка флага) ==========
    function patchLoadGameData() {
        if (typeof window.loadGameData !== 'function') return false;
        if (window._evolutionLoadPatched) return true;

        let originalLoad = window.loadGameData;

        window.loadGameData = function(d) {
            originalLoad.apply(this, arguments);

            // ★ Если в сохранении был флаг — восстановим defeatedBosses[500] ★
            try {
                if (d && d.evolutionUnlocked === true) {
                    if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses)) {
                        if (!defeatedBosses.includes(500)) defeatedBosses.push(500);
                    }
                }
            } catch(e) {}

            // ★ Перерисуем вкладку после загрузки ★
            setTimeout(function() {
                if (typeof window.renderEvoTab === 'function') {
                    window.renderEvoTab();
                }
            }, 300);
        };

        window._evolutionLoadPatched = true;
        return true;
    }

    // ========== ПАТЧ SAVEALL (записать флаг) ==========
    function patchSaveAll() {
        if (typeof window.saveAll !== 'function') return false;
        if (window._evolutionSavePatched) return true;

        let originalSave = window.saveAll;

        window.saveAll = function() {
            // Перед сохранением — записываем флаг в slotData
            try {
                if (typeof slotData !== 'undefined' && slotData) {
                    if (isEvolutionUnlocked()) {
                        slotData.evolutionUnlocked = true;
                    }
                }
            } catch(e) {}
            originalSave.apply(this, arguments);
        };

        window._evolutionSavePatched = true;
        return true;
    }

    // ========== ПАТЧ VICTORY (проверка победы над 500) ==========
    // Когда побеждаешь Путеводную Звезду — сейчас вызывается victory() и wave++
    // Нужно чтобы после победы сразу разблокировалась эволюция
    function patchVictory() {
        if (typeof window.victory !== 'function') return false;
        if (window._evolutionVictoryPatched) return true;

        let originalVictory = window.victory;

        window.victory = function() {
            originalVictory.apply(this, arguments);

            // ★ ПРОВЕРЯЕМ: если победили 500 — разблокируем эволюцию ★
            setTimeout(function() {
                try {
                    if (typeof defeatedBosses !== 'undefined'
                        && Array.isArray(defeatedBosses)
                        && defeatedBosses.includes(500)) {

                        // Помечаем флаг в сейве
                        if (typeof slotData !== 'undefined' && slotData) {
                            slotData.evolutionUnlocked = true;
                        }
                        // Перерисовываем вкладку
                        if (typeof window.renderEvoTab === 'function') {
                            window.renderEvoTab();
                        }
                        // Уведомление
                        if (typeof showFloatingText === 'function') {
                            showFloatingText("🧬 ЭВОЛЮЦИЯ РАЗБЛОКИРОВАНА!", "#e056fd");
                        }
                        if (typeof saveAll === 'function') saveAll();
                    }
                } catch(e) {
                    console.warn("[EVO-UNLOCK] Ошибка в victory-патче:", e);
                }
            }, 500);
        };

        window._evolutionVictoryPatched = true;
        return true;
    }

    // ========== ИНИЦИАЛИЗАЦИЯ С ЗАДЕРЖКОЙ ==========
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
                console.log("╔════════════════════════════════════════╗");
                console.log("║  🧬 EVOLUTION UNLOCK v1.0 загружено   ║");
                console.log("║  Открывается после победы над          ║");
                console.log("║  Путеводной Звездой (500)             ║");
                console.log("║  Не зависит от ребиртхов              ║");
                console.log("╚════════════════════════════════════════╝");

                // Первичный рендер вкладки
                if (typeof window.renderEvoTab === 'function') {
                    setTimeout(function() { window.renderEvoTab(); }, 500);
                }
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(tryPatch, 100);
            } else {
                console.warn("[EVO-UNLOCK] Не всё пропатчено (попыток:", attempts, ")");
                console.warn("[EVO-UNLOCK] renderEvoTab:", a, "| checkEvolutionQuests:", b, "| switchSubTab:", c, "| doRebirth:", d, "| loadGameData:", e, "| saveAll:", f, "| victory:", g);
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
    window.patchedRenderEvoTab = patchedRenderEvoTab;

})();
