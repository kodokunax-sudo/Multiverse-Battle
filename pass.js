// ========== МУЛЬТИВЕРС ПАСС v1.0 ==========

let passData = {
    currentTier: 1,       // текущий этап (1-60)
    passExp: 0,           // текущий опыт
    claimedTiers: []      // список уже полученных этапов
};

// Награды для каждого этапа (60 этапов)
const passRewards = [
    // 1 этап
    {
        name: "3 обычные карты",
        icon: "⚪⚪⚪",
        apply() {
            for (let i = 0; i < 3; i++) {
                let card = createCard("Обычная");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("⚪ +3 обычные карты!", "#fff");
        }
    },
    // 2 этап
    {
        name: "100 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(100 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +100 звёзд!", "#f5af19");
        }
    },
    // 3 этап
    {
        name: "Урон x1.3 на 30 мин",
        icon: "💪",
        apply() {
            activeBuffs["dmg13"] = Date.now() + 1800000;
            saveAll();
            renderActiveBuffs();
            updatePlayerStats();
            showFloatingText("💪 Урон x1.3 на 30 мин!", "#e74c3c");
        }
    },
    // 4 этап
    {
        name: "1 редкая карта",
        icon: "🔵",
        apply() {
            let card = createCard("Редкая");
            if (card) { myCards.push(card); saveAll(); renderMyCards(); }
            showFloatingText("🔵 Редкая карта!", "#17a2b8");
        }
    },
    // 5 этап
    {
        name: "1 сверхредкая карта",
        icon: "🟢",
        apply() {
            let card = createCard("Сверх редкая");
            if (card) { myCards.push(card); saveAll(); renderMyCards(); }
            showFloatingText("🟢 Сверхредкая карта!", "#28a745");
        }
    },
    // 6 этап
    {
        name: "200 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(200 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +200 звёзд!", "#f5af19");
        }
    },
    // 7 этап
    {
        name: "Звёзды x2 на 15 мин",
        icon: "🌟",
        apply() {
            activeBuffs["doubleStars"] = Date.now() + 900000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("🌟 Звёзды x2 на 15 мин!", "#f5af19");
        }
    },
    // 8 этап
    {
        name: "2 обычные карты",
        icon: "⚪⚪",
        apply() {
            for (let i = 0; i < 2; i++) {
                let card = createCard("Обычная");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("⚪ +2 обычные карты!", "#fff");
        }
    },
    // 9 этап
    {
        name: "1 эпическая карта",
        icon: "🟣",
        apply() {
            let card = createCard("Эпик");
            if (card) { myCards.push(card); saveAll(); renderMyCards(); }
            showFloatingText("🟣 Эпическая карта!", "#9b59b6");
        }
    },
    // 10 этап
    {
        name: "1 легендарный токен",
        icon: "🎰",
        apply() {
            legendaryGachaTokens = (legendaryGachaTokens || 0) + 1;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("🎰 +1 легендарный токен!", "#ffd700");
        }
    },
    // 11 этап
    {
        name: "300 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(300 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +300 звёзд!", "#f5af19");
        }
    },
    // 12 этап
    {
        name: "Урон x2 на 15 мин",
        icon: "💥",
        apply() {
            activeBuffs["doubleDamage"] = Date.now() + 900000;
            saveAll();
            renderActiveBuffs();
            updatePlayerStats();
            showFloatingText("💥 Урон x2 на 15 мин!", "#e74c3c");
        }
    },
    // 13 этап
    {
        name: "2 редкие карты",
        icon: "🔵🔵",
        apply() {
            for (let i = 0; i < 2; i++) {
                let card = createCard("Редкая");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("🔵 +2 редкие карты!", "#17a2b8");
        }
    },
    // 14 этап
    {
        name: "1 мифическая карта",
        icon: "🔴",
        apply() {
            let card = createCard("Мифическая");
            if (card) { myCards.push(card); saveAll(); renderMyCards(); }
            showFloatingText("🔴 Мифическая карта!", "#e74c3c");
        }
    },
    // 15 этап
    {
        name: "1 секретный токен",
        icon: "💎",
        apply() {
            secretGachaTokens = (secretGachaTokens || 0) + 1;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("💎 +1 секретный токен!", "#ff00ff");
        }
    },
    // 16 этап
    {
        name: "500 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(500 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +500 звёзд!", "#f5af19");
        }
    },
    // 17 этап
    {
        name: "Скорость арены x3 на 10 мин",
        icon: "⚡",
        apply() {
            activeBuffs["arenaSpeedX3"] = Date.now() + 600000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("⚡ Скорость арены x3 на 10 мин!", "#f5af19");
        }
    },
    // 18 этап
    {
        name: "3 сверхредкие карты",
        icon: "🟢🟢🟢",
        apply() {
            for (let i = 0; i < 3; i++) {
                let card = createCard("Сверх редкая");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("🟢 +3 сверхредкие карты!", "#28a745");
        }
    },
    // 19 этап
    {
        name: "Препарат V (бесплатно)",
        icon: "💉",
        apply() {
            showCompoundVModalFree();
            showFloatingText("💉 Бесплатный Препарат V!", "#9b59b6");
        }
    },
    // 20 этап
    {
        name: "2 эпические + 200 ⭐",
        icon: "🟣🟣",
        apply() {
            for (let i = 0; i < 2; i++) {
                let card = createCard("Эпик");
                if (card) myCards.push(card);
            }
            points += Math.floor(200 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderMyCards();
            renderPoints();
            showFloatingText("🟣 +2 эпика + 200⭐!", "#9b59b6");
        }
    },
    // 21 этап
    {
        name: "2 легендарных токена",
        icon: "🎰🎰",
        apply() {
            legendaryGachaTokens = (legendaryGachaTokens || 0) + 2;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("🎰 +2 легендарных токена!", "#ffd700");
        }
    },
    // 22 этап
    {
        name: "Звёзды x3 на 20 мин",
        icon: "🌟",
        apply() {
            activeBuffs["tripleStars"] = Date.now() + 1200000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("🌟 Звёзды x3 на 20 мин!", "#f5af19");
        }
    },
    // 23 этап
    {
        name: "1 легендарная карта",
        icon: "🟡",
        apply() {
            let card = createCard("Легендарная");
            if (card) { myCards.push(card); saveAll(); renderMyCards(); }
            showFloatingText("🟡 Легендарная карта!", "#ffd700");
        }
    },
    // 24 этап
    {
        name: "1000 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(1000 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +1000 звёзд!", "#f5af19");
        }
    },
    // 25 этап
    {
        name: "2 секретных токена",
        icon: "💎💎",
        apply() {
            secretGachaTokens = (secretGachaTokens || 0) + 2;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("💎 +2 секретных токена!", "#ff00ff");
        }
    },
    // 26 этап
    {
        name: "Иммунитет к усталости на 1 час",
        icon: "🛡️",
        apply() {
            activeBuffs["fatigueImmune"] = Date.now() + 3600000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("🛡️ Иммунитет к усталости 1 час!", "#2ecc71");
        }
    },
    // 27 этап
    {
        name: "3 мифические карты",
        icon: "🔴🔴🔴",
        apply() {
            for (let i = 0; i < 3; i++) {
                let card = createCard("Мифическая");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("🔴 +3 мифические карты!", "#e74c3c");
        }
    },
    // 28 этап
    {
        name: "Пальцы Сукуны (бесплатно)",
        icon: "🗿",
        apply() {
            hasSukunaFingers = true;
            saveAll();
            renderShop();
            updatePlayerStats();
            showSukunaModal();
            showFloatingText("🗿 Бесплатные Пальцы Сукуны!", "#ff4444");
        }
    },
    // 29 этап
    {
        name: "1500 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(1500 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +1500 звёзд!", "#f5af19");
        }
    },
    // 30 этап
    {
        name: "2 легендарные + токен",
        icon: "🟡🟡",
        apply() {
            for (let i = 0; i < 2; i++) {
                let card = createCard("Легендарная");
                if (card) myCards.push(card);
            }
            legendaryGachaTokens = (legendaryGachaTokens || 0) + 1;
            saveAll();
            renderMyCards();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("🟡 +2 легендарки + токен!", "#ffd700");
        }
    },
    // 31 этап
    {
        name: "Урон x4 на 10 мин",
        icon: "💥",
        apply() {
            activeBuffs["quadDamage"] = Date.now() + 600000;
            saveAll();
            renderActiveBuffs();
            updatePlayerStats();
            showFloatingText("💥 Урон x4 на 10 мин!", "#ff0000");
        }
    },
    // 32 этап
    {
        name: "2 секретных токена",
        icon: "💎💎",
        apply() {
            secretGachaTokens = (secretGachaTokens || 0) + 2;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("💎 +2 секретных токена!", "#ff00ff");
        }
    },
    // 33 этап
    {
        name: "2000 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(2000 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +2000 звёзд!", "#f5af19");
        }
    },
    // 34 этап
    {
        name: "1 секретная карта",
        icon: "💎",
        apply() {
            let card = createCard("Секретная");
            if (card) { myCards.push(card); saveAll(); renderMyCards(); }
            showFloatingText("💎 Секретная карта!", "#ff00ff");
        }
    },
    // 35 этап
    {
        name: "Скорость арены x5 на 5 мин",
        icon: "⚡",
        apply() {
            activeBuffs["arenaSpeedX5"] = Date.now() + 300000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("⚡ Скорость арены x5 на 5 мин!", "#f5af19");
        }
    },
    // 36 этап
    {
        name: "3 эпические + 500 ⭐",
        icon: "🟣🟣🟣",
        apply() {
            for (let i = 0; i < 3; i++) {
                let card = createCard("Эпик");
                if (card) myCards.push(card);
            }
            points += Math.floor(500 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderMyCards();
            renderPoints();
            showFloatingText("🟣 +3 эпика + 500⭐!", "#9b59b6");
        }
    },
    // 37 этап
    {
        name: "3 легендарных токена",
        icon: "🎰🎰🎰",
        apply() {
            legendaryGachaTokens = (legendaryGachaTokens || 0) + 3;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("🎰 +3 легендарных токена!", "#ffd700");
        }
    },
    // 38 этап
    {
        name: "Двойной опыт на 30 мин",
        icon: "📊",
        apply() {
            activeBuffs["doubleExp"] = Date.now() + 1800000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("📊 Двойной опыт на 30 мин!", "#f5af19");
        }
    },
    // 39 этап
    {
        name: "Легендарка + Препарат V",
        icon: "🟡💉",
        apply() {
            let card = createCard("Легендарная");
            if (card) myCards.push(card);
            showCompoundVModalFree();
            saveAll();
            renderMyCards();
            showFloatingText("🟡 Легендарка + V бесплатно!", "#ffd700");
        }
    },
    // 40 этап
    {
        name: "3000 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(3000 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +3000 звёзд!", "#f5af19");
        }
    },
    // 41 этап
    {
        name: "3 секретных токена",
        icon: "💎💎💎",
        apply() {
            secretGachaTokens = (secretGachaTokens || 0) + 3;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("💎 +3 секретных токена!", "#ff00ff");
        }
    },
    // 42 этап
    {
        name: "Мега-бафф на 15 мин",
        icon: "🔥",
        apply() {
            activeBuffs["doubleDamage"] = Date.now() + 900000;
            activeBuffs["doubleStars"] = Date.now() + 900000;
            activeBuffs["arenaSpeedX2"] = Date.now() + 900000;
            saveAll();
            renderActiveBuffs();
            updatePlayerStats();
            showFloatingText("🔥 Урон x2 + Звёзды x2 + Скорость x2!", "#ff4400");
        }
    },
    // 43 этап
    {
        name: "5 мифических карт",
        icon: "🔴🔴🔴🔴🔴",
        apply() {
            for (let i = 0; i < 5; i++) {
                let card = createCard("Мифическая");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("🔴 +5 мифических карт!", "#e74c3c");
        }
    },
    // 44 этап
    {
        name: "Огонь Дома (бесплатно)",
        icon: "🔥",
        apply() {
            hasFireArtifact = true;
            saveAll();
            renderShop();
            showFloatingText("🔥 Бесплатный Огонь Дома!", "#ff6b6b");
        }
    },
    // 45 этап
    {
        name: "5000 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(5000 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +5000 звёзд!", "#f5af19");
        }
    },
    // 46 этап
    {
        name: "5 легендарных токенов",
        icon: "🎰🎰🎰🎰🎰",
        apply() {
            legendaryGachaTokens = (legendaryGachaTokens || 0) + 5;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("🎰 +5 легендарных токенов!", "#ffd700");
        }
    },
    // 47 этап
    {
        name: "Неуязвимость на арене 1 мин",
        icon: "🛡️",
        apply() {
            activeBuffs["arenaInvuln"] = Date.now() + 60000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("🛡️ Неуязвимость на арене 1 мин!", "#ffd700");
        }
    },
    // 48 этап
    {
        name: "2 секретные карты",
        icon: "💎💎",
        apply() {
            for (let i = 0; i < 2; i++) {
                let card = createCard("Секретная");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("💎 +2 секретные карты!", "#ff00ff");
        }
    },
    // 49 этап
    {
        name: "3 легендарки + 2000⭐",
        icon: "🟡🟡🟡",
        apply() {
            for (let i = 0; i < 3; i++) {
                let card = createCard("Легендарная");
                if (card) myCards.push(card);
            }
            points += Math.floor(2000 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderMyCards();
            renderPoints();
            showFloatingText("🟡 +3 легендарки + 2000⭐!", "#ffd700");
        }
    },
    // 50 этап
    {
        name: "5 секретных токенов",
        icon: "💎💎💎💎💎",
        apply() {
            secretGachaTokens = (secretGachaTokens || 0) + 5;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("💎 +5 секретных токенов!", "#ff00ff");
        }
    },
    // 51 этап
    {
        name: "Скип следующего боя",
        icon: "⏭️",
        apply() {
            skipUsed = false;
            deathNoteTarget = wave;
            saveAll();
            showFloatingText("⏭️ Следующий бой будет пропущен!", "#ffaa00");
        }
    },
    // 52 этап
    {
        name: "10 мифических карт",
        icon: "🔴x10",
        apply() {
            for (let i = 0; i < 10; i++) {
                let card = createCard("Мифическая");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("🔴 +10 мифических карт!", "#e74c3c");
        }
    },
    // 53 этап
    {
        name: "3 Препарата V",
        icon: "💉💉💉",
        apply() {
            showCompoundVModalFree();
            setTimeout(() => showCompoundVModalFree(), 500);
            setTimeout(() => showCompoundVModalFree(), 1000);
            showFloatingText("💉 +3 Препарата V!", "#9b59b6");
        }
    },
    // 54 этап
    {
        name: "10000 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(10000 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +10000 звёзд!", "#f5af19");
        }
    },
    // 55 этап
    {
        name: "5 секретных + 5 лег. токенов",
        icon: "💎🎰",
        apply() {
            secretGachaTokens = (secretGachaTokens || 0) + 5;
            legendaryGachaTokens = (legendaryGachaTokens || 0) + 5;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("💎🎰 +5 секретных + 5 легендарных токенов!", "#ff00ff");
        }
    },
    // 56 этап
    {
        name: "Бесконечная выносливость 1 час",
        icon: "🛡️",
        apply() {
            fatigue = 0;
            activeBuffs["fatigueImmune"] = Date.now() + 3600000;
            saveAll();
            updateFatigue();
            renderActiveBuffs();
            showFloatingText("🛡️ Усталость 0 на 1 час!", "#2ecc71");
        }
    },
    // 57 этап
    {
        name: "3 секретные карты",
        icon: "💎💎💎",
        apply() {
            for (let i = 0; i < 3; i++) {
                let card = createCard("Секретная");
                if (card) myCards.push(card);
            }
            saveAll();
            renderMyCards();
            showFloatingText("💎 +3 секретные карты!", "#ff00ff");
        }
    },
    // 58 этап
    {
        name: "20000 ⭐",
        icon: "⭐",
        apply() {
            points += Math.floor(20000 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("⭐ +20000 звёзд!", "#f5af19");
        }
    },
    // 59 этап
    {
        name: "5 секретных + 10 лег. токенов",
        icon: "💎🎰",
        apply() {
            secretGachaTokens = (secretGachaTokens || 0) + 5;
            legendaryGachaTokens = (legendaryGachaTokens || 0) + 10;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("💎🎰 +5 секретных + 10 легендарных токенов!", "#ff00ff");
        }
    },
    // 60 этап — ФИНАЛ
    {
        name: "3 БЕСПЛАТНЫЕ СЕКРЕТНЫЕ КРУТКИ!",
        icon: "🎉",
        apply() {
            for (let i = 0; i < 3; i++) {
                let card = createCard("Секретная");
                if (card) { myCards.push(card); sfxCardObtain(); }
            }
            saveAll();
            renderMyCards();
            showFloatingText("🎉 3 СЕКРЕТНЫЕ КРУТКИ!", "#ff00ff");
            alert("🎉 ПОЗДРАВЛЯЕМ! 🎉\n\nВы завершили Мультиверс Пасс!\nПолучено 3 бесплатные секретные крутки!\n\nСпасибо за игру!");
        }
    }
];

// ========== ФУНКЦИИ ==========

// Получить опыт для перехода на следующий этап
function getPassExpNeeded(tier) {
    // Формула: 10 + (tier-1) * (tier-1) * 1.5
    return Math.floor(10 + Math.pow(tier - 1, 1.5) * 3);
}

// Добавить опыт пасса
function addPassExp(amount) {
    if (!passData) return;
    
    // Двойной опыт если есть бафф
    if (activeBuffs["doubleExp"] && activeBuffs["doubleExp"] > Date.now()) {
        amount *= 2;
    }
    
    passData.passExp += amount;
    
    // Проверяем повышение этапа
    while (passData.currentTier < 60) {
        let needed = getPassExpNeeded(passData.currentTier);
        if (passData.passExp >= needed) {
            passData.passExp -= needed;
            passData.currentTier++;
            showFloatingText("🎫 Пасс: этап " + passData.currentTier + "!", "#ffd700");
        } else {
            break;
        }
    }
    
    saveAll();
    renderPass();
}

// Забрать награду за этап
function claimPassReward(tier) {
    if (tier < 1 || tier > 60) return;
    
    // Проверяем, открыт ли этап
    if (tier > passData.currentTier && (mode !== "moder" || !moderUnlocked)) {
        alert("🔒 Этот этап ещё не открыт! Нужно набрать больше опыта.");
        return;
    }
    
    // Проверяем, не получена ли уже награда
    if (passData.claimedTiers.includes(tier)) {
        alert("✅ Вы уже получили награду за этот этап!");
        return;
    }
    
    let reward = passRewards[tier - 1];
    
    // Применяем награду
    reward.apply();
    
    // Отмечаем как полученную
    passData.claimedTiers.push(tier);
    
    saveAll();
    renderPass();
    
    if (tier === 60) {
        setTimeout(() => {
            alert("🎉 ПОЗДРАВЛЯЕМ! 🎉\n\nВы полностью завершили Мультиверс Пасс!\nВсе 60 этапов пройдены!\n\nВы настоящий герой мультивселенной!");
        }, 500);
    }
}

// Сбросить пасс (при ребиртхе — НЕ сбрасываем!)
function resetPass() {
    // Пасс не сбрасывается при ребиртхе
    // passData = { currentTier: 1, passExp: 0, claimedTiers: [] };
}

// Бесплатный Препарат V (без траты звёзд)
function showCompoundVModalFree() {
    let html = '<h2>💉 Бесплатный Препарат V</h2><div style="max-height:300px;overflow-y:auto;">';
    if (!team.length) {
        html += '<p style="color:#888;">Нет героев в команде.</p>';
    } else {
        team.forEach((idx, s) => {
            let cd = myCards[idx];
            if (!cd) return;
            let hasV = hasCompoundV[cd.name] || false;
            html += '<div class="team-select-item ' + (hasV ? 'disabled' : '') + '" onclick="' + (hasV ? '' : 'applyCompoundVFree(\'' + cd.name.replace(/'/g, "\\'") + '\')') + '"><span>' + escapeHtml(cd.name) + '</span><span>' + (hasV ? '✅ Куплен' : '▶ Выбрать (БЕСПЛАТНО)') + '</span></div>';
        });
    }
    html += '</div><button class="btn" style="width:100%;margin-top:10px;background:#e74c3c;" onclick="closeModal()">Отмена</button>';
    let el = document.getElementById("modalContent");
    if (el) el.innerHTML = html;
    el = document.getElementById("modalOverlay");
    if (el) el.style.display = "flex";
}

function applyCompoundVFree(name) {
    if (hasCompoundV[name]) return;
    hasCompoundV[name] = true;
    saveAll();
    renderAll();
    updatePlayerStats();
    closeModal();
    showFloatingText("💉 Препарат V: " + name + " (бесплатно)!", "#9b59b6");
}

// Отрисовать пасс
function renderPass() {
    let container = document.getElementById("passContent");
    if (!container) return;
    
    let html = '';
    
    // Прогресс
    let nextExp = getPassExpNeeded(passData.currentTier);
    let progressPercent = passData.currentTier >= 60 ? 100 : Math.floor((passData.passExp / nextExp) * 100);
    
    html += '<div style="text-align:center;margin-bottom:15px;">';
    html += '<div style="font-size:24px;font-weight:900;color:#ffd700;">🎫 МУЛЬТИВЕРС ПАСС</div>';
    html += '<div style="font-size:16px;font-weight:800;margin-top:5px;">Этап ' + passData.currentTier + ' из 60</div>';
    if (passData.currentTier < 60) {
        html += '<div style="margin-top:8px;font-size:13px;">Опыт: ' + passData.passExp + ' / ' + nextExp + '</div>';
        html += '<div style="background:rgba(0,0,0,0.5);border-radius:10px;margin:8px 0;height:12px;"><div style="width:' + progressPercent + '%;background:linear-gradient(90deg, #ffd700, #ff8c00);height:12px;border-radius:10px;transition:width 0.5s;"></div></div>';
    } else {
        html += '<div style="margin-top:8px;font-size:16px;color:#ffd700;font-weight:900;">🎉 ПАСС ПОЛНОСТЬЮ ЗАВЕРШЁН! 🎉</div>';
    }
    html += '<div style="font-size:12px;color:#aaa;">💡 Опыт начисляется за клики, победы и убийства боссов</div>';
    html += '</div>';
    
    // Список этапов
    html += '<div style="display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto;padding-right:5px;">';
    for (let i = 0; i < passRewards.length; i++) {
        let tier = i + 1;
        let reward = passRewards[i];
        let unlocked = tier <= passData.currentTier || (mode === "moder" && moderUnlocked);
        let claimed = passData.claimedTiers.includes(tier);
        let isCurrent = tier === passData.currentTier;
        
        let bgColor = claimed ? 'rgba(46, 204, 113, 0.15)' : (unlocked ? (isCurrent ? 'rgba(245, 175, 25, 0.2)' : 'rgba(255,255,255,0.05)') : 'rgba(255,255,255,0.02)');
        let borderColor = claimed ? '#2ecc71' : (unlocked ? (isCurrent ? '#f5af19' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.05)');
        let opacity = unlocked ? '1' : '0.4';
        
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:' + bgColor + ';border:2px solid ' + borderColor + ';border-radius:14px;opacity:' + opacity + ';transition:all 0.2s;">';
        html += '<div style="font-size:20px;min-width:30px;text-align:center;">' + reward.icon + '</div>';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:800;font-size:12px;">Этап ' + tier + ': ' + reward.name + '</div>';
        html += '</div>';
        if (claimed) {
            html += '<div style="font-size:16px;color:#2ecc71;">✅</div>';
        } else if (unlocked) {
            html += '<button class="btn btn-primary" style="padding:4px 12px;font-size:11px;" onclick="claimPassReward(' + tier + ')">Забрать</button>';
        } else {
            html += '<div style="font-size:16px;color:#aaa;">🔒</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    
    container.innerHTML = html;
}
