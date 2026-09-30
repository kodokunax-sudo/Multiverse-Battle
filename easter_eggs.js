// ============================================================
// EASTER EGGS v1.3 — Промокоды и пасхалки
// ============================================================
// ★ v1.3:
// - ФИКС: пасхалки больше НЕ дублируются при ребиртхе
// - Модеры могут ПРОДАВАТЬ пасхалки
// - Сохранение по уникальному ID
// ============================================================
// ПОДКЛЮЧАТЬ ПОСЛЕ data.js, НО ДО game.js!
// game.js НЕ требует изменений
// ============================================================

if (window._easterEggsLoaded === true) {
    console.warn("[EASTER] Уже загружен, игнорирую повтор.");
} else {
    window._easterEggsLoaded = true;

// ========== СПИСОК ПАСХАЛОЧНЫХ КАРТ ==========
// Эти карты НЕ удаляются при ребиртхе
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

// ========== ПОЛУЧИТЬ ВСЕ ПРОМОКОДЫ ==========
function getAllCodes() {
    let base = {};
    if (typeof codeList !== 'undefined' && codeList) {
        base = Object.assign({}, codeList);
    }
    return Object.assign(base, EASTER_CODES);
}

// ========== ЯВЛЯЕТСЯ ЛИ КАРТА ПАСХАЛКОЙ ==========
function isEasterCard(card) {
    if (!card) return false;
    if (card._isEasterEgg === true) return true;
    if (EASTER_CARD_NAMES.includes(card.name)) return true;
    if (card._originalName && EASTER_CARD_NAMES.includes(card._originalName)) return true;
    return false;
}

// ========== ВЫДАТЬ ПАСХАЛЬНУЮ КАРТУ ==========
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

    console.log("[EASTER] Выдана пасхалка:", card.name, "id:", card.id, "редкость:", templateRarity);
    return true;
}

// ========== ПЕРЕХВАТ SUBMITCODE ==========
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
                if (resultEl) resultEl.innerHTML = "❌ Ошибка выдачи карты";
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
// ★★★ СОХРАНЕНИЕ / ВОССТАНОВЛЕНИЕ ПАСХАЛОК ★★★
// ============================================================
function saveEasterCards() {
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return [];
    
    let saved = [];
    let seenIds = {};
    
    for (let c of myCards) {
        if (!c) continue;
        if (!isEasterCard(c)) continue;
        
        // ★ ЗАЩИТА ОТ ДУБЛИРОВАНИЯ — берём только уникальные ID ★
        let uniqueKey = c.id || c.name;
        if (seenIds[uniqueKey]) {
            console.warn("[EASTER] Обнаружен дубликат пасхалки при сохранении:", c.name);
            continue;
        }
        seenIds[uniqueKey] = true;
        saved.push(JSON.parse(JSON.stringify(c)));
    }
    
    console.log("[EASTER] Сохранено пасхалок:", saved.length, saved.map(c => c.name + "(" + c.id + ")"));
    return saved;
}

function restoreEasterCards(savedCards) {
    if (!Array.isArray(savedCards) || savedCards.length === 0) return;
    if (typeof myCards === 'undefined' || !Array.isArray(myCards)) return;

    // ★ ЗАЩИТА ОТ ДУБЛИРОВАНИЯ — собираем существующие ID ★
    let existingIds = {};
    for (let c of myCards) {
        if (c && c.id) existingIds[c.id] = true;
    }

    let restored = 0;
    for (let c of savedCards) {
        if (!c) continue;
        
        // ★ ПРОПУСКАЕМ если ID уже есть в myCards ★
        if (c.id && existingIds[c.id]) {
            console.warn("[EASTER] Пропущен дубликат при восстановлении:", c.name, "id:", c.id);
            continue;
        }
        
        c._isEasterEgg = true;
        myCards.push(c);
        if (c.id) existingIds[c.id] = true;
        restored++;
        
        if (typeof discoveredCards !== 'undefined' && Array.isArray(discoveredCards)) {
            if (!discoveredCards.includes(c.name)) {
                discoveredCards.push(c.name);
            }
        }
    }
    
    console.log("[EASTER] Восстановлено пасхалок:", restored, "из", savedCards.length);
}

// ============================================================
// ★★★ ФЛАГ ЗАЩИТЫ ОТ ДВОЙНОГО ВОССТАНОВЛЕНИЯ ★★★
// ============================================================
if (typeof window._easterRestoreLock === 'undefined') {
    window._easterRestoreLock = false;
}

function safeRestoreEasterCards(savedCards) {
    // ★ Защита: не восстанавливать, если уже идёт восстановление ★
    if (window._easterRestoreLock) {
        console.warn("[EASTER] Восстановление уже идёт, пропускаем");
        return;
    }
    window._easterRestoreLock = true;
    try {
        restoreEasterCards(savedCards);
    } finally {
        window._easterRestoreLock = false;
    }
}

// ============================================================
// ★★★ ПАТЧ КНОПКИ РЕБИРТХА ★★★
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

        safeRestoreEasterCards(savedEasterCards);

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

// ============================================================
// ПАТЧ WINDOW.DOREBIRTH
// ============================================================
function patchRebirthFunction() {
    if (typeof window.doRebirth !== 'function') return false;
    if (window._easterRebirthFnPatched) return true;

    let originalRebirth = window.doRebirth;
    let isRunning = false;

    window.doRebirth = function() {
        // ★ Защита от рекурсии ★
        if (isRunning) {
            console.warn("[EASTER] doRebirth уже выполняется, пропускаем");
            return originalRebirth.apply(this, arguments);
        }
        isRunning = true;
        
        let savedEasterCards = saveEasterCards();
        console.log("[EASTER] Программный ребиртх, сохранено пасхалок:", savedEasterCards.length);

        try {
            originalRebirth.apply(this, arguments);
        } finally {
            safeRestoreEasterCards(savedEasterCards);
            isRunning = false;
        }

        if (typeof saveAll === 'function') saveAll();
        if (typeof renderAll === 'function') renderAll();
    };

    window._easterRebirthFnPatched = true;
    console.log("[EASTER] Функция doRebirth пропатчена");
    return true;
}

// ============================================================
// ПАТЧ SUBMITCODE
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
// ПАТЧ LOADGAMEDATA (с миграцией + дедупликацией)
// ============================================================
function patchLoadGameData() {
    if (typeof window.loadGameData !== 'function') return false;
    if (window._easterLoadPatched) return true;

    let originalLoad = window.loadGameData;

    window.loadGameData = function(d) {
        originalLoad.apply(this, arguments);

        if (typeof myCards !== 'undefined' && Array.isArray(myCards)) {
            // ★ ДЕДУПЛИКАЦИЯ при загрузке — убираем дубликаты по ID ★
            let seenIds = {};
            let uniqueCards = [];
            for (let c of myCards) {
                if (!c) continue;
                
                // Пометка пасхалок
                if (EASTER_CARD_NAMES.includes(c.name) || (c._originalName && EASTER_CARD_NAMES.includes(c._originalName))) {
                    c._isEasterEgg = true;
                }
                
                // Миграция Кофе → DrinkTea2Win
                if (c.name === "Кофе") {
                    c._originalName = "Кофе";
                    c.name = "DrinkTea2Win";
                    c._isEasterEgg = true;
                    console.log("[EASTER] Миграция: 'Кофе' → 'DrinkTea2Win'");
                }
                
                // ★ Уникальность по ID ★
                let uniqueKey = c.id || (c.name + "_" + Math.random());
                if (seenIds[uniqueKey]) {
                    console.warn("[EASTER] Удалён дубликат:", c.name, "id:", c.id);
                    continue;
                }
                seenIds[uniqueKey] = true;
                uniqueCards.push(c);
            }
            
            // Заменяем массив на уникальный
            if (uniqueCards.length !== myCards.length) {
                myCards.length = 0;
                for (let c of uniqueCards) myCards.push(c);
                console.log("[EASTER] Дедупликация: " + uniqueCards.length + " карт (было " + (uniqueCards.length + (myCards.length - uniqueCards.length)) + ")");
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
// ★★★ ПАТЧ sellCard — МОДЕРЫ МОГУТ ПРОДАВАТЬ ПАСХАЛКИ ★★★
// ============================================================
function patchSellCard() {
    if (typeof window.sellCard !== 'function') return false;
    if (window._easterSellPatched) return true;

    let originalSell = window.sellCard;

    window.sellCard = function(idx) {
        let c = null;
        try {
            c = (typeof myCards !== 'undefined' && myCards[idx]) ? myCards[idx] : null;
        } catch(e) {}

        if (!c) {
            return originalSell.apply(this, arguments);
        }

        // ★ Проверяем: модер-режим и пасхалка ★
        let isModer = false;
        try {
            isModer = (typeof mode !== 'undefined' && mode === "moder" && typeof moderUnlocked !== 'undefined' && moderUnlocked);
        } catch(e) {}

        if (isModer && isEasterCard(c)) {
            // ★ МОДЕР МОЖЕТ ПРОДАТЬ ПАСХАЛКУ ★
            console.log("[EASTER] Модер продаёт пасхалку:", c.name);
            
            // Временная цена для пасхалок
            let price = c.sellPrice || 500;
            
            if (confirm("👑 МОДЕР: Продать пасхалку " + c.name + " за " + price + "⭐?")) {
                if (typeof points !== 'undefined') {
                    points += Math.floor(price * (typeof getStarMult === 'function' ? getStarMult() : 1));
                    if (typeof maxPoints !== 'undefined' && points > maxPoints) maxPoints = points;
                }
                
                // Удаляем карту через removeCard
                if (typeof removeCard === 'function') {
                    removeCard(idx);
                } else {
                    myCards.splice(idx, 1);
                }
                
                if (typeof renderPoints === 'function') renderPoints();
                if (typeof saveAll === 'function') saveAll();
                if (typeof renderAll === 'function') renderAll();
                if (typeof sfxUISell === 'function') sfxUISell();
                if (typeof showFloatingText === 'function') {
                    showFloatingText("💰 +" + Math.floor(price * (typeof getStarMult === 'function' ? getStarMult() : 1)) + "⭐", "#f5af19");
                }
            }
            return;
        }

        // ★ Обычная продажа ★
        return originalSell.apply(this, arguments);
    };

    window._easterSellPatched = true;
    console.log("[EASTER] sellCard пропатчен — модеры могут продавать пасхалки");
    return true;
}

// ============================================================
// ★★★ ФУНКЦИЯ ПРОДАЖИ ПАСХАЛКИ ДЛЯ UI ★★★
// ============================================================
window.sellEasterCard = function(idx) {
    let c = myCards[idx];
    if (!c) return;
    
    let isModer = (typeof mode !== 'undefined' && mode === "moder" && typeof moderUnlocked !== 'undefined' && moderUnlocked);
    if (!isModer) {
        if (typeof showFloatingText === 'function') showFloatingText("Только для модеров!", "#ff3333");
        return;
    }
    
    if (!isEasterCard(c)) {
        if (typeof showFloatingText === 'function') showFloatingText("Это не пасхалка!", "#ff3333");
        return;
    }
    
    let price = c.sellPrice || 500;
    if (!confirm("👑 Продать пасхалку " + c.name + " за " + price + "⭐?")) return;
    
    if (typeof points !== 'undefined') {
        points += Math.floor(price * (typeof getStarMult === 'function' ? getStarMult() : 1));
        if (typeof maxPoints !== 'undefined' && points > maxPoints) maxPoints = points;
    }
    
    if (typeof removeCard === 'function') {
        removeCard(idx);
    } else {
        myCards.splice(idx, 1);
    }
    
    if (typeof renderPoints === 'function') renderPoints();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderAll === 'function') renderAll();
    if (typeof sfxUISell === 'function') sfxUISell();
    if (typeof showFloatingText === 'function') {
        showFloatingText("💰 +" + Math.floor(price * (typeof getStarMult === 'function' ? getStarMult() : 1)) + "⭐", "#f5af19");
    }
};

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
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
            console.log("║  ✅ Модеры могут ПРОДАВАТЬ пасхалки    ║");
            console.log("║  ✅ Защита от дублирования по ID       ║");
            console.log("║  Промокод: DrinkTea2Win                ║");
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

// ========== ЭКСПОРТ ==========
window.EASTER_CODES = EASTER_CODES;
window.EASTER_CARD_NAMES = EASTER_CARD_NAMES;
window.giveEasterCard = giveEasterCard;
window.saveEasterCards = saveEasterCards;
window.restoreEasterCards = restoreEasterCards;
window.safeRestoreEasterCards = safeRestoreEasterCards;
window.isEasterCard = isEasterCard;
window.easterSubmitCode = easterSubmitCode;
window.getAllCodes = getAllCodes;
window.sellEasterCard = sellEasterCard;

} // ★ КОНЕЦ ЗАЩИТЫ ★
