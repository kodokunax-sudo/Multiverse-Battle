// ============================================================
// EASTER EGGS v1.3 — Промокоды и пасхалки
// ============================================================
// ★ v1.3:
// - ФИКС: пасхалки больше НЕ дублируются при ребиртхе
// - Модеры могут ПРОДАВАТЬ пасхалки (снимаем unsellable)
// - Проверка по id при восстановлении
// ============================================================

if (window._easterEggsLoaded === true) {
    console.warn("[EASTER] Уже загружен, игнорирую повтор.");
} else {
    window._easterEggsLoaded = true;

// ========== СПИСОК ПАСХАЛОЧНЫХ КАРТ ==========
const EASTER_CARD_NAMES = ["Пельмешка", "Попугай Соня", "Кофе", "DrinkTea2Win"];

// ========== ПРОМОКОДЫ ==========
const EASTER_CODES = {
    "DrinkTea2Win": {
        type: "easterCard",
        cardName: "DrinkTea2Win",
        displayName: "DrinkTea2Win",
        desc: "🥤 Пасхалка: карта DrinkTea2Win"
    }
};

function getAllCodes() {
    let base = {};
    if (typeof codeList !== 'undefined' && codeList) {
        base = Object.assign({}, codeList);
    }
    return Object.assign(base, EASTER_CODES);
}

// ============================================================
// ★ ПРОВЕРКА: ЕСТЬ ЛИ УЖЕ ТАКАЯ КАРТА В КОЛЛЕКЦИИ ★
// ============================================================
function hasEasterCard(cardName) {
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return false;
    for (let c of myCards) {
        if (c && c.name === cardName && c._isEasterEgg) return true;
    }
    return false;
}

// ============================================================
// ★ ВЫДАТЬ ПАСХАЛЬНУЮ КАРТУ ★
// ============================================================
function giveEasterCard(cardName, displayName) {
    let template = null;
    let templateRarity = null;

    if (typeof customCardTemplates === 'undefined') {
        console.error("[EASTER] customCardTemplates не найдено!");
        return false;
    }

    let pools = ["Пасхалка", "Секретная", "Легендарная", "Обычная"];
    for (let rarity of pools) {
        let arr = customCardTemplates[rarity];
        if (!arr) continue;
        let found = arr.find(t => t.name === cardName);
        if (found) {
            template = found;
            templateRarity = rarity;
            break;
        }
    }

    if (!template) {
        console.error("[EASTER] Шаблон карты не найден:", cardName);
        return false;
    }

    // ★ Проверка: уже есть такая карта? ★
    if (hasEasterCard(displayName || cardName)) {
        console.warn("[EASTER] Карта уже есть в коллекции:", displayName || cardName);
        return false;
    }

    let card = null;
    if (typeof createCardFromTemplate === 'function') {
        card = createCardFromTemplate(template, templateRarity);
    }

    if (!card) {
        let s = (typeof cardStats !== 'undefined' && cardStats[templateRarity])
            ? cardStats[templateRarity]
            : { damage: 10, hp: 20, sellPrice: 100, speed: 1.0 };
        card = {
            id: Date.now() + Math.random() * 10000,
            name: template.name,
            rarity: templateRarity,
            damage: template.damage ?? s.damage,
            hp: template.hp ?? s.hp,
            sellPrice: template.sellPrice ?? s.sellPrice,
            speed: template.speed ?? s.speed ?? 0.5,
            ability: template.ability || null,
            universe: template.universe || "?",
            unsellable: template.unsellable || false,
            minRebirth: template.minRebirth || 0,
            statusAbility: template.statusAbility || null,
            extraStatus: template.extraStatus || null,
            superAbility: template.superAbility || null,
            mastery: 1,
            masteryExp: 0
        };
    }

    if (displayName) {
        card._originalName = card.name;
        card.name = displayName;
    }

    card._isEasterEgg = true;

    if (typeof myCards !== 'undefined' && Array.isArray(myCards)) {
        myCards.push(card);
    }

    if (typeof discoveredCards !== 'undefined' && Array.isArray(discoveredCards)) {
        if (!discoveredCards.includes(card.name)) {
            discoveredCards.push(card.name);
        }
    }

    if (typeof saveAll === 'function') saveAll();
    if (typeof renderMyCards === 'function') renderMyCards();
    if (typeof renderBook === 'function') renderBook();
    if (typeof sfxCardObtain === 'function') sfxCardObtain();

    console.log("[EASTER] Выдана пасхалка:", card.name, "редкость:", templateRarity);
    return true;
}

// ============================================================
// ★ ПЕРЕХВАТ SUBMITCODE ★
// ============================================================
function easterSubmitCode() {
    let inpEl = document.getElementById("codeInput");
    if (!inpEl) return;
    let inp = inpEl.value.trim();
    let resultEl = document.getElementById("codeResult");

    if (EASTER_CODES[inp]) {
        let cd = EASTER_CODES[inp];

        if (typeof usedCodes !== 'undefined' && Array.isArray(usedCodes) && usedCodes.includes(inp)) {
            if (resultEl) resultEl.innerHTML = "⚠️ Код уже использован";
            return;
        }

        if (typeof usedCodes !== 'undefined' && Array.isArray(usedCodes)) {
            usedCodes.push(inp);
        }

        if (cd.type === "easterCard") {
            let ok = giveEasterCard(cd.cardName, cd.displayName);
            if (ok) {
                if (resultEl) resultEl.innerHTML = "✅ " + (cd.desc || "Пасхалка получена!");
                if (typeof showFloatingText === 'function') {
                    showFloatingText("🥤 Пасхалка: " + (cd.displayName || cd.cardName) + "!", "#f5af19");
                }
            } else {
                if (resultEl) resultEl.innerHTML = "⚠️ Такая карта уже есть в коллекции";
            }
        }

        if (typeof saveAll === 'function') saveAll();
        if (typeof renderAll === 'function') renderAll();
        return;
    }

    if (typeof window._originalSubmitCode === 'function') {
        window._originalSubmitCode();
    } else if (typeof submitCode === 'function') {
        submitCode();
    }
}

// ============================================================
// ★ СОХРАНЕНИЕ ПАСХАЛОК (без дубликатов!) ★
// ============================================================
function saveEasterCards() {
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return [];

    // ★ Берём УНИКАЛЬНЫЕ пасхалки (по имени) ★
    let seen = {};
    let result = [];

    for (let c of myCards) {
        if (!c) continue;
        if (!c._isEasterEgg && !EASTER_CARD_NAMES.includes(c.name)) continue;

        // ★ Пропускаем дубликаты по имени ★
        if (seen[c.name]) {
            console.warn("[EASTER] Пропускаем дубликат:", c.name);
            continue;
        }
        seen[c.name] = true;

        // ★ Глубокая копия карты ★
        let clone = JSON.parse(JSON.stringify(c));
        clone._isEasterEgg = true;
        result.push(clone);
    }

    console.log("[EASTER] Сохранено уникальных пасхалок:", result.length, "→", result.map(x => x.name));
    return result;
}

// ============================================================
// ★ ВОССТАНОВЛЕНИЕ ПАСХАЛОК (с защитой от дубликатов!) ★
// ============================================================
function restoreEasterCards(savedCards) {
    if (!Array.isArray(savedCards) || savedCards.length === 0) return 0;
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return 0;

    let restoredCount = 0;

    for (let c of savedCards) {
        if (!c) continue;

        // ★ ПРОВЕРКА: уже есть такая карта (по id)? ★
        let alreadyHas = false;
        for (let existing of myCards) {
            if (!existing) continue;
            if (existing.id === c.id) {
                alreadyHas = true;
                break;
            }
        }

        // ★ ПРОВЕРКА: уже есть карта с таким же именем-пасхалкой? ★
        if (!alreadyHas) {
            for (let existing of myCards) {
                if (!existing) continue;
                if (existing._isEasterEgg && existing.name === c.name) {
                    alreadyHas = true;
                    break;
                }
            }
        }

        if (alreadyHas) {
            console.log("[EASTER] Пропускаем дубликат при восстановлении:", c.name);
            continue;
        }

        c._isEasterEgg = true;
        myCards.push(c);
        restoredCount++;

        if (typeof discoveredCards !== 'undefined' && Array.isArray(discoveredCards)) {
            if (!discoveredCards.includes(c.name)) {
                discoveredCards.push(c.name);
            }
        }
    }

    console.log("[EASTER] Восстановлено пасхалок:", restoredCount);
    return restoredCount;
}

// ============================================================
// ★ ПАТЧ КНОПКИ РЕБИРТХА ★
// ============================================================
function patchRebirthButton() {
    let btn = document.getElementById("doRebirthBtn");
    if (!btn) return false;
    if (window._easterRebirthBtnPatched) return true;

    let newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", function() {
        let savedEasterCards = saveEasterCards();
        console.log("[EASTER] Перед ребиртхом сохранено пасхалок:", savedEasterCards.length);

        if (typeof doRebirth === 'function') {
            try {
                doRebirth();
            } catch(e) {
                console.error("[EASTER] Ошибка в doRebirth:", e);
            }
        }

        // ★ Восстанавливаем ПОСЛЕ ребиртха ★
        let restored = restoreEasterCards(savedEasterCards);

        if (typeof saveAll === 'function') saveAll();
        if (typeof renderAll === 'function') renderAll();

        if (restored > 0 && typeof showFloatingText === 'function') {
            showFloatingText("🥚 Пасхалки сохранены (" + restored + ")!", "#ffd700");
        }
    });

    window._easterRebirthBtnPatched = true;
    console.log("[EASTER] Кнопка ребиртха пропатчена");
    return true;
}

// ============================================================
// ★ ПАТЧ WINDOW.DOREBIRTH ★
// ============================================================
function patchRebirthFunction() {
    if (typeof window.doRebirth !== 'function') return false;
    if (window._easterRebirthFnPatched) return true;

    let originalRebirth = window.doRebirth;

    window.doRebirth = function() {
        let savedEasterCards = saveEasterCards();
        console.log("[EASTER] Программный ребиртх, сохранено пасхалок:", savedEasterCards.length);

        originalRebirth.apply(this, arguments);

        let restored = restoreEasterCards(savedEasterCards);

        if (typeof saveAll === 'function') saveAll();
        if (typeof renderAll === 'function') renderAll();
    };

    window._easterRebirthFnPatched = true;
    return true;
}

// ============================================================
// ★ ПАТЧ SUBMITCODE ★
// ============================================================
function patchSubmitCode() {
    if (typeof window.submitCode !== 'function') return false;
    if (window._easterSubmitPatched) return true;

    window._originalSubmitCode = window.submitCode;
    window.submitCode = easterSubmitCode;

    let btn = document.getElementById("submitCodeBtn");
    if (btn) {
        let newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", easterSubmitCode);
    }

    window._easterSubmitPatched = true;
    console.log("[EASTER] submitCode пропатчен");
    return true;
}

// ============================================================
// ★ ПАТЧ LOADGAMEDATA ★
// ============================================================
function patchLoadGameData() {
    if (typeof window.loadGameData !== 'function') return false;
    if (window._easterLoadPatched) return true;

    let originalLoad = window.loadGameData;

    window.loadGameData = function(d) {
        originalLoad.apply(this, arguments);

        if (typeof myCards !== 'undefined' && Array.isArray(myCards)) {
            // ★ Убираем дубликаты пасхалок при загрузке ★
            let seen = {};
            let toRemove = [];

            for (let i = 0; i < myCards.length; i++) {
                let c = myCards[i];
                if (!c) continue;

                // Мигрируем "Кофе" → "DrinkTea2Win"
                if (c.name === "Кофе") {
                    c._originalName = "Кофе";
                    c.name = "DrinkTea2Win";
                    c._isEasterEgg = true;
                    console.log("[EASTER] Миграция: 'Кофе' → 'DrinkTea2Win'");
                }

                if (EASTER_CARD_NAMES.includes(c.name)) {
                    c._isEasterEgg = true;
                }

                // ★ Проверка дубликатов ★
                if (c._isEasterEgg) {
                    if (seen[c.name]) {
                        console.warn("[EASTER] Найден дубликат пасхалки при загрузке:", c.name);
                        toRemove.push(i);
                    } else {
                        seen[c.name] = true;
                    }
                }
            }

            // ★ Удаляем дубликаты (с конца, чтобы не сбить индексы) ★
            for (let i = toRemove.length - 1; i >= 0; i--) {
                myCards.splice(toRemove[i], 1);
            }

            if (toRemove.length > 0) {
                console.log("[EASTER] Удалено дубликатов:", toRemove.length);
                // Чистим команду и afkTeam от невалидных индексов
                if (typeof team !== 'undefined' && Array.isArray(team)) {
                    team = team.filter(idx => idx >= 0 && idx < myCards.length);
                }
                if (typeof afkTeam !== 'undefined' && Array.isArray(afkTeam)) {
                    afkTeam = afkTeam.filter(idx => idx >= 0 && idx < myCards.length);
                }
                if (typeof saveAll === 'function') saveAll();
            }

            if (typeof discoveredCards !== 'undefined' && Array.isArray(discoveredCards)) {
                let idx = discoveredCards.indexOf("Кофе");
                if (idx !== -1) {
                    discoveredCards.splice(idx, 1);
                    if (!discoveredCards.includes("DrinkTea2Win")) {
                        discoveredCards.push("DrinkTea2Win");
                    }
                }
            }
        }
    };

    window._easterLoadPatched = true;
    return true;
}

// ============================================================
// ★ ПАТЧ PRODAZHI: модеры могут продавать пасхалки ★
// ============================================================
function patchSellCard() {
    if (typeof window.sellCard !== 'function') return false;
    if (window._easterSellPatched) return true;

    let originalSell = window.sellCard;

    window.sellCard = function(idx) {
        if (typeof mode !== 'undefined' && mode === 'moder' && typeof moderUnlocked !== 'undefined' && moderUnlocked) {
            // ★ МОДЕР: продаём пасхалку без вопросов ★
            let c = myCards[idx];
            if (c && c._isEasterEgg) {
                if (typeof doSellCard === 'function') {
                    doSellCard(idx);
                }
                return;
            }
        }
        // Иначе — обычная логика
        return originalSell.apply(this, arguments);
    };

    window._easterSellPatched = true;
    console.log("[EASTER] sellCard пропатчен (модеры могут продавать пасхалки)");
    return true;
}

// ============================================================
// ★ ИНИЦИАЛИЗАЦИЯ ★
// ============================================================
function initEasterEggs() {
    let attempts = 0;
    let maxAttempts = 50;

    function tryPatch() {
        attempts++;
        let rebirthBtnOk = patchRebirthButton();
        let rebirthFnOk = patchRebirthFunction();
        let submitOk = patchSubmitCode();
        let loadOk = patchLoadGameData();
        let sellOk = patchSellCard();

        if (rebirthBtnOk && rebirthFnOk && submitOk && loadOk && sellOk) {
            console.log("╔════════════════════════════════════════╗");
            console.log("║  🥚 EASTER EGGS v1.3 загружено        ║");
            console.log("║  ✅ Пасхалки НЕ дублируются            ║");
            console.log("║  ✅ Модеры могут продавать пасхалки    ║");
            console.log("║  Промокод: DrinkTea2Win → DrinkTea2Win║");
            console.log("╚════════════════════════════════════════╝");
            return;
        }

        if (attempts < maxAttempts) {
            setTimeout(tryPatch, 100);
        } else {
            console.warn("[EASTER] Патч не завершён (попыток:", attempts, ")");
            console.warn("[EASTER] Кнопка:", rebirthBtnOk, "| Функция:", rebirthFnOk, "| Коды:", submitOk, "| Загрузка:", loadOk, "| Продажа:", sellOk);
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(tryPatch, 100);
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            setTimeout(tryPatch, 200);
        });
    }
}

initEasterEggs();

// ============================================================
// ЭКСПОРТ
// ============================================================
window.EASTER_CODES = EASTER_CODES;
window.EASTER_CARD_NAMES = EASTER_CARD_NAMES;
window.giveEasterCard = giveEasterCard;
window.saveEasterCards = saveEasterCards;
window.restoreEasterCards = restoreEasterCards;
window.easterSubmitCode = easterSubmitCode;
window.getAllCodes = getAllCodes;
window.hasEasterCard = hasEasterCard;

} // ★ КОНЕЦ ЗАЩИТЫ ★
