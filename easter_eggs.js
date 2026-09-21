// ============================================================
// EASTER EGGS v1.0 — Промокоды и пасхалки
// Пасхалочные карты НЕ исчезают после ребиртха
// ============================================================
// ПОДКЛЮЧАТЬ ПОСЛЕ data.js, НО ДО game.js!
// ============================================================

// ★★★ ЗАЩИТА ОТ ДВОЙНОЙ ЗАГРУЗКИ ★★★
if (window._easterEggsLoaded === true) {
    console.warn("[EASTER] Уже загружен, игнорирую повтор.");
} else {
    window._easterEggsLoaded = true;

// ========== СПИСОК ПАСХАЛОЧНЫХ КАРТ ==========
// Эти карты НЕ удаляются при ребиртхе
const EASTER_CARD_NAMES = ["Пельмешка", "Попугай Соня", "Кофе"];

// ========== ПРОМОКОДЫ (расширение codeList из data.js) ==========
// Добавляются к существующим промокодам
const EASTER_CODES = {
    "DrinkTea2Win": {
        type: "easterCard",
        cardName: "Кофе",
        desc: "🥤 Пасхалка: карта Кофе"
    }
    // Сюда можно добавлять новые промокоды:
    // "НовыйКод": { type: "easterCard", cardName: "Пельмешка", desc: "..." }
};

// ========== ФУНКЦИЯ: получить все промокоды (старые + пасхальные) ==========
function getAllCodes() {
    let base = {};
    if (typeof codeList !== 'undefined' && codeList) {
        base = Object.assign({}, codeList);
    }
    return Object.assign(base, EASTER_CODES);
}

// ========== ФУНКЦИЯ: выдать пасхальную карту по имени ==========
function giveEasterCard(cardName) {
    // Ищем шаблон во всех редкостях
    let template = null;
    let templateRarity = null;

    if (typeof customCardTemplates === 'undefined') {
        console.error("[EASTER] customCardTemplates не найдено!");
        return false;
    }

    // Сначала ищем в "Пасхалка"
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
    let card;
    if (typeof createCardFromTemplate === 'function') {
        card = createCardFromTemplate(template, templateRarity);
    } else if (typeof createCard === 'function') {
        // Fallback: ищем карту через createCard N раз (не идеально, но сработает)
        console.warn("[EASTER] createCardFromTemplate не найдено, использую fallback");
        card = null;
    }

    if (!card) {
        // Ручное создание карты
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

    // ★ Помечаем карту как пасхалку — она не исчезнет при ребиртхе ★
    card._isEasterEgg = true;

    // Добавляем в коллекцию
    if (typeof myCards !== 'undefined' && Array.isArray(myCards)) {
        myCards.push(card);
    }

    // Записываем в бестиарий
    if (typeof discoveredCards !== 'undefined' && Array.isArray(discoveredCards)) {
        if (!discoveredCards.includes(card.name)) {
            discoveredCards.push(card.name);
        }
    }

    // Сохраняем
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderMyCards === 'function') renderMyCards();
    if (typeof renderBook === 'function') renderBook();
    if (typeof sfxCardObtain === 'function') sfxCardObtain();

    return true;
}

// ========== ПЕРЕХВАТ SUBMITCODE ==========
// Заменяем стандартный submitCode на расширенный
function easterSubmitCode() {
    let inpEl = document.getElementById("codeInput");
    if (!inpEl) return;
    let inp = inpEl.value.trim();
    let resultEl = document.getElementById("codeResult");

    // Проверяем пасхальные промокоды
    if (EASTER_CODES[inp]) {
        let cd = EASTER_CODES[inp];

        // Проверка "уже использован"
        if (typeof usedCodes !== 'undefined' && Array.isArray(usedCodes) && usedCodes.includes(inp)) {
            if (resultEl) resultEl.innerHTML = "⚠️ Код уже использован";
            return;
        }

        // Помечаем как использованный
        if (typeof usedCodes !== 'undefined' && Array.isArray(usedCodes)) {
            usedCodes.push(inp);
        }

        // Выдаём награду
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

    // Если это не пасхальный код — вызываем оригинальный submitCode
    if (typeof window._originalSubmitCode === 'function') {
        window._originalSubmitCode();
    } else if (typeof submitCode === 'function') {
        // Старая версия submitCode (если перехват не удался)
        submitCode();
    }
}

// ========== ФУНКЦИЯ ДЛЯ СОХРАНЕНИЯ ПАСХАЛОК ПРИ РЕБИРТХЕ ==========
// Вызывается в doRebirth() ДО очистки myCards
function saveEasterCards() {
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return [];
    return myCards.filter(c => c && (c._isEasterEgg || EASTER_CARD_NAMES.includes(c.name)));
}

// Восстанавливает пасхалки после ребиртха
function restoreEasterCards(savedCards) {
    if (!Array.isArray(savedCards) || savedCards.length === 0) return;
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return;

    for (let c of savedCards) {
        // На всякий случай помечаем
        c._isEasterEgg = true;
        // Восстанавливаем карту
        myCards.push(c);
        // Возвращаем в бестиарий
        if (typeof discoveredCards !== 'undefined' && Array.isArray(discoveredCards)) {
            if (!discoveredCards.includes(c.name)) {
                discoveredCards.push(c.name);
            }
        }
    }
    console.log("[EASTER] Восстановлено пасхалок:", savedCards.length);
}

// ========== АВТОПАТЧ DO REBIRTH ==========
// Оборачиваем doRebirth, чтобы сохранить пасхалки
function patchRebirth() {
    if (typeof window.doRebirth !== 'function') {
        console.warn("[EASTER] doRebirth не найдена, патч отложен");
        return false;
    }
    if (window._easterRebirthPatched) return true;

    let originalRebirth = window.doRebirth;

    window.doRebirth = function() {
        // ★ СОХРАНЯЕМ ПАСХАЛКИ ДО РЕБИРТХА ★
        let savedEasterCards = saveEasterCards();
        console.log("[EASTER] Сохранено пасхалок перед ребиртхом:", savedEasterCards.length);

        // Вызываем оригинальный doRebirth
        originalRebirth.apply(this, arguments);

        // ★ ВОССТАНАВЛИВАЕМ ПАСХАЛКИ ПОСЛЕ ★
        restoreEasterCards(savedEasterCards);

        // Пересохраняем
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderAll === 'function') renderAll();
    };

    window._easterRebirthPatched = true;
    console.log("[EASTER] doRebirth пропатчен — пасхалки сохраняются");
    return true;
}

// ========== АВТОПАТЧ SUBMITCODE ==========
function patchSubmitCode() {
    if (typeof window.submitCode !== 'function') return false;
    if (window._easterSubmitPatched) return true;

    // Сохраняем оригинал
    window._originalSubmitCode = window.submitCode;

    // Заменяем на наш
    window.submitCode = easterSubmitCode;

    // Перепривязываем кнопку
    let btn = document.getElementById("submitCodeBtn");
    if (btn) {
        // Убираем старый обработчик, вешаем новый
        let newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", easterSubmitCode);
    }

    window._easterSubmitPatched = true;
    console.log("[EASTER] submitCode пропатчен");
    return true;
}

// ========== АВТОПАТЧ LOADGAMEDATA ==========
// Чтобы при загрузке сохранения старые пасхалки тоже помечались
function patchLoadGameData() {
    if (typeof window.loadGameData !== 'function') return false;
    if (window._easterLoadPatched) return true;

    let originalLoad = window.loadGameData;

    window.loadGameData = function(d) {
        originalLoad.apply(this, arguments);
        // Помечаем все пасхалки в загруженной коллекции
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

// ========== ИНИЦИАЛИЗАЦИЯ С ЗАДЕРЖКОЙ ==========
// Ждём, пока загрузятся game.js и ui.js
function initEasterEggs() {
    let attempts = 0;
    let maxAttempts = 50;

    function tryPatch() {
        attempts++;
        let rebirthOk = patchRebirth();
        let submitOk = patchSubmitCode();
        let loadOk = patchLoadGameData();

        if (rebirthOk && submitOk && loadOk) {
            console.log("╔════════════════════════════════════════╗");
            console.log("║  🥚 EASTER EGGS v1.0 загружено        ║");
            console.log("║  Промокод: DrinkTea2Win → Кофе        ║");
            console.log("║  Пасхалки сохраняются при ребиртхе    ║");
            console.log("╚════════════════════════════════════════╝");
            return;
        }

        if (attempts < maxAttempts) {
            setTimeout(tryPatch, 100);
        } else {
            console.warn("[EASTER] Не удалось пропатчить всё, но промокоды работают");
        }
    }

    // Если DOM уже загружен — стартуем сразу
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

} // ★ КОНЕЦ ЗАЩИТЫ ★
