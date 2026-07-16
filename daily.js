// ========== ЕЖЕДНЕВНЫЕ НАГРАДЫ v1.0 ==========

let dailyRewards = {
    currentDay: 1,        // текущий день (1-10)
    lastClaimDate: null,  // дата последнего получения (строка YYYY-MM-DD)
    claimedToday: false   // получил ли сегодня
};

const dailyRewardList = [
    // День 1
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
                showFloatingText("🎫 Мифическая карта!", "#e74c3c");
            }
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
    // День 3
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
                showFloatingText("🟡 Легендарная карта!", "#ffd700");
            }
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
    // День 5
    {
        name: "Эпик + 500⭐",
        icon: "🟣",
        desc: "Бесплатная эпическая крутка + 500 звёзд",
        apply() {
            let card = createCard("Эпик");
            if (card) {
                myCards.push(card);
                saveAll();
                renderMyCards();
                sfxCardObtain();
            }
            points += Math.floor(500 * getStarMult());
            if (points > maxPoints) maxPoints = points;
            saveAll();
            renderPoints();
            showFloatingText("🟣 Эпик карта + 500⭐!", "#9b59b6");
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
            activeBuffs["arenaSpeedX3"] = Date.now() + 1200000; // 20 минут
            saveAll();
            renderActiveBuffs();
            showFloatingText("⚡ Скорость арены x3 на 20 мин!", "#f5af19");
        }
    },
    // День 9
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
                showFloatingText("💎 СЕКРЕТНАЯ КАРТА!", "#ff00ff");
            }
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

// Получить сегодняшнюю дату как строку YYYY-MM-DD
function getTodayDate() {
    let d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Загрузить данные ежедневных наград из сохранения
function loadDailyRewards(savedData) {
    if (savedData && savedData.dailyRewards) {
        dailyRewards.currentDay = savedData.dailyRewards.currentDay || 1;
        dailyRewards.lastClaimDate = savedData.dailyRewards.lastClaimDate || null;
        dailyRewards.claimedToday = savedData.dailyRewards.claimedToday || false;
        
        // Проверяем, не прошёл ли уже день
        let today = getTodayDate();
        if (dailyRewards.lastClaimDate !== today) {
            dailyRewards.claimedToday = false;
        }
    }
}

// Сбросить ежедневные награды (при ребиртхе)
function resetDailyRewards() {
    dailyRewards = {
        currentDay: 1,
        lastClaimDate: null,
        claimedToday: false
    };
    saveAll();
}

// Проверить, можно ли забрать награду
function canClaimDaily() {
    let today = getTodayDate();
    
    // Если уже забрал сегодня
    if (dailyRewards.claimedToday && dailyRewards.lastClaimDate === today) {
        return false;
    }
    
    // Если это первый заход или новый день
    if (dailyRewards.lastClaimDate !== today) {
        // Если прошлый раз был не вчера и не сегодня, сбрасываем прогресс?
        // Нет, не сбрасываем — игрок продолжает с того же дня
        dailyRewards.claimedToday = false;
    }
    
    return true;
}

// Забрать награду
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
    
    // Применяем награду
    reward.apply();
    
    // Обновляем состояние
    dailyRewards.lastClaimDate = today;
    dailyRewards.claimedToday = true;
    dailyRewards.currentDay++;
    
    // Если прошли все 10 дней, начинаем заново
    if (dailyRewards.currentDay > 10) {
        dailyRewards.currentDay = 1;
    }
    
    saveAll();
    renderDailyRewards();
    
    // Показываем уведомление
    setTimeout(() => {
        alert("🎁 Получено: " + reward.icon + " " + reward.name + "!\n\n" + reward.desc + "\n\nЗавтра: День " + dailyRewards.currentDay + " — " + dailyRewardList[dailyRewards.currentDay - 1].icon + " " + dailyRewardList[dailyRewards.currentDay - 1].name);
    }, 300);
}

// Отрисовать ежедневные награды
function renderDailyRewards() {
    let container = document.getElementById("dailyRewardsList");
    if (!container) return;
    
    let today = getTodayDate();
    let claimed = dailyRewards.claimedToday && dailyRewards.lastClaimDate === today;
    let currentDay = dailyRewards.currentDay;
    
    let html = '';
    
    // Показываем прогресс
    html += '<div style="text-align:center;margin-bottom:15px;font-weight:800;font-size:14px;">';
    html += '📅 День ' + currentDay + ' из 10';
    if (claimed) {
        html += ' <span style="color:#2ecc71;">✅ Получено</span>';
    } else {
        html += ' <span style="color:#f5af19;">🎁 Можно забрать!</span>';
    }
    html += '</div>';
    
    // Кнопка получения
    html += '<button class="btn btn-primary" style="width:100%;padding:15px;font-size:16px;margin-bottom:15px;" onclick="claimDailyReward()" ' + (claimed ? 'disabled' : '') + '>';
    if (claimed) {
        html += '✅ Награда получена! Приходите завтра';
    } else {
        html += '🎁 ЗАБРАТЬ НАГРАДУ ДНЯ ' + currentDay;
    }
    html += '</button>';
    
    // Список всех наград
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
