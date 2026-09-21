// ============================================================
// EASTER EGGS v1.1 — Промокоды и пасхалки
// Пасхалочные карты НЕ исчезают после ребиртха
// ============================================================
// ПОДКЛЮЧАТЬ ПОСЛЕ data.js, НО ДО game.js!
// ВАЖНО: этот файл НЕ требует изменений в game.js
// ============================================================

if (window._easterEggsLoaded === true) {
    console.warn("[EASTER] Уже загружен, игнорирую повтор.");
} else {
    window._easterEggsLoaded = true;

// ========== СПИСОК ПАСХАЛОЧНЫХ КАРТ ==========
const EASTER_CARD_NAMES = ["Пельмешка", "Попугай Соня", "Кофе"];

// ========== ПРОМОКОДЫ ==========
const EASTER_CODES = {
    "DrinkTea2Win": {
        type: "easterCard",
        cardName: "Кофе",
        desc: "🥤 Пасхалка: карта Кофе"
    }
    // "НовыйКод": { type: "easterCard", cardName: "Пельмешка", desc: "..." }
};

// ========== ПОЛУЧИТЬ ВСЕ ПРОМОКОДЫ ==========
function getAllCodes() {
    let base = {};
    if (typeof codeList !== 'undefined' && codeList) {
        base = Object.assign({}, codeList);
    }
    return Object.assign(base, EASTER_CODES);
}

// ========== ВЫДАТЬ ПАСХАЛЬНУЮ КАРТУ ==========
function giveEasterCard(cardName) {
    let template = null;
    let templateRarity = null;

    if (typeof customCardTemplates === 'undefined') {
        console.error("[EASTER] customCardTemplates не найдено!");
        return false;
    }

    // Ищем шаблон
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

    // Создаём карту
    let card = null;
    if (typeof createCardFromTemplate === 'function') {
        card = createCardFromTemplate(template, templateRarity);
    }

    if (!card) {
        // Fallback: ручное создание
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

    // ★ Помечаем как пасхалку ★
    card._isEasterEgg = true;

    // Добавляем в коллекцию
    if (typeof myCards !== 'undefined' && Array.isArray(myCards)) {
        myCards.push(card);
    }

    // В бестиарий
    if (typeof discoveredCards !== 'undefined' && Array.isArray(discoveredCards)) {
        if (!discoveredCards.includes(card.name)) {
            discoveredCards.push(card.name);
        }
    }

    if (typeof saveAll === 'function') saveAll();
    if (typeof renderMyCards === 'function') renderMyCards();
    if (typeof renderBook === 'function') renderBook();
    if (typeof sfxCardObtain === 'function') sfxCardObtain();

    console.log("[EASTER] Выдана пасхалка:", cardName, "редкость:", templateRarity);
    return true;
}

// ========== ПЕРЕХВАТ SUBMITCODE ==========
function easterSubmitCode() {
    let inpEl = document.getElementById("codeInput");
    if (!inpEl) return;
    let inp = inpEl.value.trim();
    let resultEl = document.getElementById("codeResult");

    // Проверяем пасхальные промокоды
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
            let ok = giveEasterCard(cd.cardName);
            if (ok) {
                if (resultEl) resultEl.innerHTML = "✅ " + (cd.desc || "Пасхалка получена!");
                if (typeof showFloatingText === 'function') {
                    showFloatingText("🥤 Пасхалка: " + cd.cardName + "!", "#f5af19");
                }
            } else {
                if (resultEl) resultEl.innerHTML = "❌ Ошибка выдачи карты";
            }
        }

        if (typeof saveAll === 'function') saveAll();
        if (typeof renderAll === 'function') renderAll();
        return;
    }

    // Не пасхальный — отдаём оригиналу
    if (typeof window._originalSubmitCode === 'function') {
        window._originalSubmitCode();
    } else if (typeof submitCode === 'function') {
        submitCode();
    }
}

// ========== СОХРАНЕНИЕ ПАСХАЛОК ==========
function saveEasterCards() {
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return [];
    return myCards.filter(c => c && (c._isEasterEgg || EASTER_CARD_NAMES.includes(c.name)));
}

function restoreEasterCards(savedCards) {
    if (!Array.isArray(savedCards) || savedCards.length === 0) return;
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return;

    for (let c of savedCards) {
        c._isEasterEgg = true;
        myCards.push(c);
        if (typeof discoveredCards !== 'undefined' && Array.isArray(discoveredCards)) {
            if (!discoveredCards.includes(c.name)) {
                discoveredCards.push(c.name);
            }
        }
    }
    console.log("[EASTER] Восстановлено пасхалок:", savedCards.length);
}

// ========== ПАТЧ КНОПКИ РЕБИРТХА ==========
// Перевешиваем обработчик на кнопку doRebirthBtn,
// чтобы НЕ менять game.js
function patchRebirthButton() {
    let btn = document.getElementById("doRebirthBtn");
    if (!btn) return false;
    if (window._easterRebirthBtnPatched) return true;

    // Клонируем — снимаем все старые обработчики
    let newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // Вешаем свой
    newBtn.addEventListener("click", function() {
        // ★ СОХРАНЯЕМ ДО ★
        let savedEasterCards = saveEasterCards();
        console.log("[EASTER] Перед ребиртхом сохранено пасхалок:", savedEasterCards.length);

        // Вызываем оригинальную doRebirth
        if (typeof doRebirth === 'function') {
            try {
                doRebirth();
            } catch(e) {
                console.error("[EASTER] Ошибка в doRebirth:", e);
            }
        }

        // ★ ВОССТАНАВЛИВАЕМ ПОСЛЕ ★
        restoreEasterCards(savedEasterCards);

        if (typeof saveAll === 'function') saveAll();
        if (typeof renderAll === 'function') renderAll();

        if (savedEasterCards.length > 0 && typeof showFloatingText === 'function') {
            showFloatingText("🥚 Пасхалки сохранены!", "#ffd700");
        }
    });

    window._easterRebirthBtnPatched = true;
    console.log("[EASTER] Кнопка ребиртха пропатчена");
    return true;
}

// ========== ПАТЧ WINDOW.DOREbIRTH (для программных вызовов) ==========
function patchRebirthFunction() {
    if (typeof window.doRebirth !== 'function') return false;
    if (window._easterRebirthFnPatched) return true;

    let originalRebirth = window.doRebirth;

    window.doRebirth = function() {
        let savedEasterCards = saveEasterCards();
        console.log("[EASTER] Программный ребиртх, сохранено пасхалок:", savedEasterCards.length);

        originalRebirth.apply(this, arguments);

        restoreEasterCards(savedEasterCards);

        if (typeof saveAll === 'function') saveAll();
        if (typeof renderAll === 'function') renderAll();
    };

    window._easterRebirthFnPatched = true;
    return true;
}

// ========== ПАТЧ SUBMITCODE ==========
function patchSubmitCode() {
    if (typeof window.submitCode !== 'function') return false;
    if (window._easterSubmitPatched) return true;

    window._originalSubmitCode = window.submitCode;
    window.submitCode = easterSubmitCode;

    // Перепривязываем кнопку
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

// ========== ПАТЧ LOADGAMEDATA ==========
function patchLoadGameData() {
    if (typeof window.loadGameData !== 'function') return false;
    if (window._easterLoadPatched) return true;

    let originalLoad = window.loadGameData;

    window.loadGameData = function(d) {
        originalLoad.apply(this, arguments);
        if (typeof myCards !== 'undefined' && Array.isArray(myCards)) {
            for (let c of myCards) {
                if (c && EASTER_CARD_NAMES.includes(c.name)) {
                    c._isEasterEgg = true;
                }
            }
        }
    };

    window._easterLoadPatched = true;
    return true;
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initEasterEggs() {
    let attempts = 0;
    let maxAttempts = 50;

    function tryPatch() {
        attempts++;
        let rebirthBtnOk = patchRebirthButton();
        let rebirthFnOk = patchRebirthFunction();
        let submitOk = patchSubmitCode();
        let loadOk = patchLoadGameData();

        if (rebirthBtnOk && rebirthFnOk && submitOk && loadOk) {
            console.log("╔════════════════════════════════════════╗");
            console.log("║  🥚 EASTER EGGS v1.1 загружено        ║");
            console.log("║  Промокод: DrinkTea2Win → Кофе        ║");
            console.log("║  Пасхалки сохраняются при ребиртхе    ║");
            console.log("║  game.js НЕ изменялся                 ║");
            console.log("╚════════════════════════════════════════╝");
            return;
        }

        if (attempts < maxAttempts) {
            setTimeout(tryPatch, 100);
        } else {
            console.warn("[EASTER] Патч не завершён (попыток:", attempts, ")");
            console.warn("[EASTER] Кнопка ребиртха:", rebirthBtnOk, "| Функция:", rebirthFnOk, "| Коды:", submitOk, "| Загрузка:", loadOk);
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

// ========== ЭКСПОРТ ==========
window.EASTER_CODES = EASTER_CODES;
window.EASTER_CARD_NAMES = EASTER_CARD_NAMES;
window.giveEasterCard = giveEasterCard;
window.saveEasterCards = saveEasterCards;
window.restoreEasterCards = restoreEasterCards;
window.easterSubmitCode = easterSubmitCode;
window.getAllCodes = getAllCodes;

} // ★ КОНЕЦ ЗАЩИТЫ ★
