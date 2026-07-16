// ========== ЕЖЕДНЕВНЫЕ НАГРАДЫ v1.2 ==========
// Фикс: мифические/легендарные/секретные крутки сразу крутят с анимацией

let dailyRewards = {
    currentDay: 1,        // текущий день (1-10)
    lastClaimDate: null,  // дата последнего получения (строка YYYY-MM-DD)
    claimedToday: false   // получил ли сегодня
};

const dailyRewardList = [
    // День 1 — МИФИЧЕСКАЯ КРУТКА (сразу крутит)
    {
        name: "Мифическая крутка",
        icon: "🎫",
        desc: "Бесплатная мифическая крутка",
        apply() {
            let card = createCard("Мифическая");
            if (card) {
                myCards.push(card);
                saveAll();
                renderMyCards();
                sfxCardObtain();
                startDailyGachaAnimation(card, "mythic");
            }
            showFloatingText("🎫 Мифическая крутка!", "#e74c3c");
        }
    },
    // День 2
    {
        name: "Звёзды x2",
        icon: "⭐",
        desc: "В 2 раза больше звёзд на 1 час",
        apply() {
            activeBuffs["doubleStars"] = Date.now() + 3600000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("⭐ Звёзды x2 на 1 час!", "#f5af19");
        }
    },
    // День 3 — ЛЕГЕНДАРНАЯ КРУТКА (сразу крутит)
    {
        name: "Легендарная крутка",
        icon: "🟡",
        desc: "Бесплатная легендарная крутка",
        apply() {
            let card = createCard("Легендарная");
            if (card) {
                myCards.push(card);
                saveAll();
                renderMyCards();
                sfxCardObtain();
                startDailyGachaAnimation(card, "legendary");
            }
            showFloatingText("🟡 Легендарная крутка!", "#ffd700");
        }
    },
    // День 4
    {
        name: "Урон +50%",
        icon: "💪",
        desc: "+50% урона на 2 часа",
        apply() {
            activeBuffs["dmg15"] = Date.now() + 7200000;
            saveAll();
            renderActiveBuffs();
            updatePlayerStats();
            showFloatingText("💪 Урон +50% на 2 часа!", "#e74c3c");
        }
    },
    // День 5 — ЭПИЧЕСКАЯ КРУТКА (сразу крутит)
    {
        name: "Эпическая крутка + 500⭐",
        icon: "🟣",
        desc: "Бесплатная эпическая крутка + 500 звёзд",
        apply() {
            let card = createCard("Эпик");
            if (card) {
                myCards.push(card);
                saveAll();
                renderMyCards();
                sfxCardObtain();
                startDailyGachaAnimation(card, "epic");
            }
            points += Math.floor(500 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("🟣 Эпическая крутка + 500⭐!", "#9b59b6");
        }
    },
    // День 6
    {
        name: "Анти-усталость",
        icon: "🛡️",
        desc: "Сброс усталости + иммунитет на 30 минут",
        apply() {
            fatigue = 0;
            activeBuffs["fatigueImmune"] = Date.now() + 1800000;
            saveAll();
            updateFatigue();
            updateRestBtn();
            renderActiveBuffs();
            showFloatingText("🛡️ Усталость сброшена! Иммунитет 30 мин!", "#2ecc71");
        }
    },
    // День 7
    {
        name: "Токен легендарки",
        icon: "🎰",
        desc: "+1 легендарный токен для гача-крутки",
        apply() {
            legendaryGachaTokens = (legendaryGachaTokens || 0) + 1;
            saveAll();
            if (typeof renderGachaTab === 'function') renderGachaTab();
            showFloatingText("🎰 +1 легендарный токен!", "#ffd700");
        }
    },
    // День 8
    {
        name: "Скорость x3",
        icon: "⚡",
        desc: "Скорость на арене x3 на 20 минут",
        apply() {
            activeBuffs["arenaSpeedX3"] = Date.now() + 1200000;
            saveAll();
            renderActiveBuffs();
            showFloatingText("⚡ Скорость арены x3 на 20 мин!", "#f5af19");
        }
    },
    // День 9 — СЕКРЕТНАЯ КРУТКА (сразу крутит)
    {
        name: "Секретная крутка",
        icon: "💎",
        desc: "Бесплатная секретная крутка!",
        apply() {
            let card = createCard("Секретная");
            if (card) {
                myCards.push(card);
                saveAll();
                renderMyCards();
                sfxCardObtain();
                startDailyGachaAnimation(card, "secret");
            }
            showFloatingText("💎 Секретная крутка!", "#ff00ff");
        }
    },
    // День 10
    {
        name: "Звёзды x2 + 1000⭐",
        icon: "🌟",
        desc: "+100% звёзд на 2 часа + 1000 звёзд",
        apply() {
            activeBuffs["doubleStars"] = Date.now() + 7200000;
            points += Math.floor(1000 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderActiveBuffs();
            renderPoints();
            showFloatingText("🌟 Звёзды x2 на 2ч + 1000⭐!", "#ffd700");
        }
    }
];

// ========== ФУНКЦИИ ==========

function getTodayDate() {
    let d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function loadDailyRewards(savedData) {
    if (savedData && savedData.dailyRewards) {
        dailyRewards.currentDay = savedData.dailyRewards.currentDay || 1;
        dailyRewards.lastClaimDate = savedData.dailyRewards.lastClaimDate || null;
        dailyRewards.claimedToday = savedData.dailyRewards.claimedToday || false;
        let today = getTodayDate();
        if (dailyRewards.lastClaimDate !== today) {
            dailyRewards.claimedToday = false;
        }
    }
}

function resetDailyRewards() {
    dailyRewards = {
        currentDay: 1,
        lastClaimDate: null,
        claimedToday: false
    };
    saveAll();
}

function canClaimDaily() {
    if (mode === "moder" && moderUnlocked) return true;
    let today = getTodayDate();
    if (dailyRewards.claimedToday && dailyRewards.lastClaimDate === today) {
        return false;
    }
    if (dailyRewards.lastClaimDate !== today) {
        dailyRewards.claimedToday = false;
    }
    return true;
}

// Анимация крутки для ежедневных наград (без проверки звёзд)
function startDailyGachaAnimation(card, type) {
    let availableRarities = [];
    switch(type) {
        case "mythic": availableRarities = ["Эпик", "Мифическая", "Легендарная", "Секретная"]; break;
        case "epic": availableRarities = ["Сверх редкая", "Эпик", "Мифическая", "Легендарная"]; break;
        case "legendary": availableRarities = ["Мифическая", "Легендарная", "Секретная"]; break;
        case "secret": availableRarities = ["Легендарная", "Секретная"]; break;
        default: availableRarities = ["Редкая", "Сверх редкая", "Эпик", "Мифическая"];
    }
    let fakeCards = [];
    for (let i = 0; i < 8; i++) {
        let randomRarity = availableRarities[Math.floor(Math.random() * availableRarities.length)];
        let fc = createCard(randomRarity);
        if (fc) fakeCards.push(fc);
    }
    fakeCards.push(card);
    
    let modalContent = document.getElementById("modalContent");
    let modalOverlay = document.getElementById("modalOverlay");
    if (!modalContent || !modalOverlay) return;
    modalOverlay.style.display = "flex";
    
    let index = 0;
    let totalFlashes = 20;
    let flashCount = 0;
    let speed = 80;
    
    function flashNextCard() {
        if (flashCount >= totalFlashes) {
            let rarityColor = typeof getRarityColor === 'function' ? getRarityColor(card.rarity) : "#fff";
            let showImage = ["Эволюционная", "Секретная", "Легендарная"].includes(card.rarity);
            let cardImg = showImage && typeof getCardImage === 'function' ? getCardImage(card.name) : null;
            let imgHTML = cardImg ? '<img src="' + cardImg + '" style="width:100px;height:100px;border-radius:12px;object-fit:cover;margin-bottom:10px;">' : '';
            modalContent.innerHTML = '<h2>🎁 Ежедневная награда!</h2>' +
                '<div style="text-align:center;">' +
                '<div style="font-size:64px;margin-bottom:10px;">🎴</div>' +
                imgHTML +
                '<div style="font-size:32px;font-weight:900;color:' + rarityColor + ';text-shadow: 0 0 30px ' + rarityColor + ';margin-bottom:8px;">' + (typeof escapeHtml === 'function' ? escapeHtml(card.name) : card.name) + '</div>' +
                '<div class="rarity-tag ' + (typeof rarityColors !== 'undefined' ? rarityColors[card.rarity] : '') + '" style="font-size:18px;padding:10px 25px;">' + card.rarity + '</div>' +
                '<div style="margin-top:15px;font-size:18px;">💪 ' + card.damage + ' ❤️ ' + card.hp + '</div>' +
                (card.ability ? '<div style="margin-top:10px;color:#f5af19;font-weight:bold;">✨ ' + card.ability.desc + '</div>' : '') +
                '</div>' +
                '<button class="btn btn-primary" style="width:100%;padding:12px;margin-top:15px;" onclick="closeModal()">ЗАБРАТЬ</button>';
            if (typeof sfxCardObtain === 'function') sfxCardObtain();
            return;
        }
        let currentCard = fakeCards[index % fakeCards.length];
        let rarityColor = typeof getRarityColor === 'function' ? getRarityColor(currentCard.rarity) : "#fff";
        modalContent.innerHTML = '<h2>🎁 Ежедневная крутка...</h2>' +
            '<div style="text-align:center;padding:10px;">' +
            '<div style="font-size:48px;margin-bottom:10px;">🎴</div>' +
            '<div style="font-size:28px;font-weight:900;color:' + rarityColor + ';text-shadow: 0 0 20px ' + rarityColor + ';margin-bottom:8px;">' + (typeof escapeHtml === 'function' ? escapeHtml(currentCard.name) : currentCard.name) + '</div>' +
            '<div class="rarity-tag ' + (typeof rarityColors !== 'undefined' ? rarityColors[currentCard.rarity] : '') + '" style="font-size:16px;padding:8px 20px;">' + currentCard.rarity + '</div>' +
            '<div style="margin-top:12px;font-size:16px;">💪 ' + currentCard.damage + ' ❤️ ' + currentCard.hp + '</div>' +
            '</div>' +
            '<button class="btn" style="width:100%;padding:8px;margin-top:10px;background:#e74c3c;border:none;color:white;font-weight:bold;" onclick="closeModal()">⏭️ ПРОПУСТИТЬ</button>';
        index++;
        flashCount++;
        if (flashCount > totalFlashes * 0.7) speed += 40;
        else if (flashCount > totalFlashes * 0.5) speed += 20;
        else if (flashCount > totalFlashes * 0.3) speed += 10;
        setTimeout(flashNextCard, speed);
    }
    flashNextCard();
}

function claimDailyReward() {
    if (!canClaimDaily()) {
        alert("⏳ Вы уже получили награду сегодня! Приходите завтра.");
        return;
    }
    
    let today = getTodayDate();
    let rewardIndex = dailyRewards.currentDay - 1;
    
    if (rewardIndex < 0 || rewardIndex >= dailyRewardList.length) {
        dailyRewards.currentDay = 1;
        rewardIndex = 0;
    }
    
    let reward = dailyRewardList[rewardIndex];
    reward.apply();
    
    if (mode !== "moder" || !moderUnlocked) {
        dailyRewards.lastClaimDate = today;
        dailyRewards.claimedToday = true;
        dailyRewards.currentDay++;
        if (dailyRewards.currentDay > 10) {
            dailyRewards.currentDay = 1;
        }
    }
    
    saveAll();
    renderDailyRewards();
    
    if (mode !== "moder" || !moderUnlocked) {
        setTimeout(() => {
            if (dailyRewards.currentDay <= 10) {
                alert("🎁 Получено: " + reward.icon + " " + reward.name + "!\n\n" + reward.desc + "\n\nЗавтра: День " + dailyRewards.currentDay + " — " + dailyRewardList[dailyRewards.currentDay - 1].icon + " " + dailyRewardList[dailyRewards.currentDay - 1].name);
            } else {
                alert("🎁 Получено: " + reward.icon + " " + reward.name + "!\n\n" + reward.desc + "\n\nЦикл завершён! Завтра снова День 1!");
            }
        }, 500);
    }
}

function claimDailyDay(dayNum) {
    if (mode !== "moder" || !moderUnlocked) return;
    if (dayNum < 1 || dayNum > 10) return;
    
    let rewardIndex = dayNum - 1;
    let reward = dailyRewardList[rewardIndex];
    reward.apply();
    
    saveAll();
    renderDailyRewards();
    
    alert("🎁 [МОДЕР] Получено: " + reward.icon + " " + reward.name + " (День " + dayNum + ")!");
}

function renderDailyRewards() {
    let container = document.getElementById("dailyRewardsList");
    if (!container) return;
    
    let today = getTodayDate();
    let claimed = (mode === "moder" && moderUnlocked) ? false : (dailyRewards.claimedToday && dailyRewards.lastClaimDate === today);
    let currentDay = dailyRewards.currentDay;
    
    let html = '';
    
    html += '<div style="text-align:center;margin-bottom:15px;font-weight:800;font-size:14px;">';
    html += '📅 День ' + currentDay + ' из 10';
    if (claimed) {
        html += ' <span style="color:#2ecc71;">✅ Получено</span>';
    } else if (mode === "moder" && moderUnlocked) {
        html += ' <span style="color:#9b59b6;">👑 Модер-режим</span>';
    } else {
        html += ' <span style="color:#f5af19;">🎁 Можно забрать!</span>';
    }
    html += '</div>';
    
    html += '<button class="btn btn-primary" style="width:100%;padding:15px;font-size:16px;margin-bottom:15px;" onclick="claimDailyReward()" ' + (claimed && mode !== "moder" ? 'disabled' : '') + '>';
    if (claimed && mode !== "moder") {
        html += '✅ Награда получена! Приходите завтра';
    } else if (mode === "moder" && moderUnlocked) {
        html += '🎁 ЗАБРАТЬ НАГРАДУ ДНЯ ' + currentDay + ' (МОДЕР)';
    } else {
        html += '🎁 ЗАБРАТЬ НАГРАДУ ДНЯ ' + currentDay;
    }
    html += '</button>';
    
    if (mode === "moder" && moderUnlocked) {
        html += '<div style="margin-bottom:15px;padding:10px;background:rgba(155,89,182,0.15);border:2px solid #9b59b6;border-radius:14px;">';
        html += '<div style="font-weight:800;font-size:13px;color:#e056fd;margin-bottom:8px;text-align:center;">👑 МОДЕР: выбрать любой день</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;">';
        for (let d = 1; d <= 10; d++) {
            html += '<button class="btn" style="padding:6px 12px;font-size:11px;background:#9b59b6;border:none;color:white;border-radius:20px;" onclick="claimDailyDay(' + d + ')">День ' + d + '</button>';
        }
        html += '</div></div>';
    }
    
    html += '<div style="display:flex;flex-direction:column;gap:8px;">';
    for (let i = 0; i < dailyRewardList.length; i++) {
        let r = dailyRewardList[i];
        let dayNum = i + 1;
        let isPast = dayNum < currentDay;
        let isCurrent = dayNum === currentDay;
        let isFuture = dayNum > currentDay;
        
        let bgColor = isPast ? 'rgba(46, 204, 113, 0.15)' : (isCurrent ? 'rgba(245, 175, 25, 0.2)' : 'rgba(255,255,255,0.03)');
        let borderColor = isPast ? '#2ecc71' : (isCurrent ? '#f5af19' : 'rgba(255,255,255,0.1)');
        let statusIcon = isPast ? '✅' : (isCurrent ? '🎁' : '🔒');
        
        html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:' + bgColor + ';border:2px solid ' + borderColor + ';border-radius:14px;' + (isFuture ? 'opacity:0.5;' : '') + '">';
        html += '<div style="font-size:28px;">' + r.icon + '</div>';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:800;font-size:13px;">День ' + dayNum + ': ' + r.name + '</div>';
        html += '<div style="font-size:11px;color:#aaa;">' + r.desc + '</div>';
        html += '</div>';
        html += '<div style="font-size:20px;">' + statusIcon + '</div>';
        html += '</div>';
    }
    html += '</div>';
    
    container.innerHTML = html;
}
