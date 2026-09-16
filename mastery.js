// ============================================================
// МАСТЕРСТВО КАРТ v2.0 — СИСТЕМА ОПЫТА
// ============================================================

// Множители характеристик по уровням
const MASTERY_MULT = [0, 0.60, 0.75, 0.85, 0.95, 1.00];

// Стоимость апгрейда (индекс = целевой уровень)
const MASTERY_BASE_STARS = [0, 0, 100, 200, 400, 800];
const MASTERY_BASE_POWER = [0, 0, 5, 10, 20, 40];

// ★ ОПЫТ ДЛЯ ПРОКАЧКИ ★
const MASTERY_BASE_EXP = 200;
const MASTERY_EXP_LEVEL_MULT = [0, 0, 1, 2, 4, 8];

// Множители по редкости
const MASTERY_RARITY_MULT = {
    "Обычная": 1, "Редкая": 1.5, "Сверх редкая": 2.5, "Эпик": 4,
    "Мифическая": 6, "Легендарная": 10, "Секретная": 15,
    "Эволюционная": 25, "Босс": 20, "Пасхалка": 3
};

let powerPoints = 0;

// ========== ПОЛУЧЕНИЕ ОЧКОВ СИЛЫ ==========
function addPowerPoints(amount) {
    powerPoints += amount;
    saveAll();
    renderPowerPoints();
    renderPoints();
}

// ========== МНОЖИТЕЛЬ МАСТЕРСТВА ==========
function getMasteryMult(card) {
    if (!card) return 1.0;
    let lvl = Math.max(1, Math.min(5, card.mastery || 1));
    return MASTERY_MULT[lvl];
}

// ========== ПРОВЕРКИ РАЗБЛОКИРОВКИ ==========
function hasMasteryStatus(card) { return card && (card.mastery || 1) >= 3; }
function hasMasteryAbility(card) { return card && (card.mastery || 1) >= 4; }
function hasMasterySuper(card) { return card && (card.mastery || 1) >= 5; }

// ========== СТОИМОСТЬ АПГРЕЙДА ==========
function getMasteryUpgradeCost(card, targetLevel) {
    if (!card) return { stars: 999999, power: 99999 };
    let rarMult = MASTERY_RARITY_MULT[card.rarity] || 1;
    return {
        stars: Math.floor((MASTERY_BASE_STARS[targetLevel] || 0) * rarMult),
        power: Math.ceil((MASTERY_BASE_POWER[targetLevel] || 0) * rarMult)
    };
}

// ========== СКОЛЬКО ОПЫТА НУЖНО ==========
function getMasteryExpNeeded(card, targetLevel) {
    if (!card || targetLevel < 2 || targetLevel > 5) return 0;
    let rarMult = MASTERY_RARITY_MULT[card.rarity] || 1;
    let lvlMult = MASTERY_EXP_LEVEL_MULT[targetLevel] || 1;
    return Math.floor(MASTERY_BASE_EXP * lvlMult * rarMult);
}

// ========== НАЧИСЛЕНИЕ ОПЫТА КАРТЕ ==========
function addCardMasteryExp(card, expAmount) {
    if (!card || expAmount <= 0) return;
    if ((card.mastery || 1) >= 5) return;
    if (typeof card.masteryExp === 'undefined') card.masteryExp = 0;
    card.masteryExp += expAmount;
}

// ========== ОПЫТ ЗА БОЙ (урон + полученный урон) ==========
function grantMasteryExpFromFight(damageDealt, damageTaken) {
    let exp = 0;
    if (damageDealt > 0) {
        let bonus = Math.min(50, Math.floor(damageDealt / 100));
        exp += 1 + bonus;
    }
    if (damageTaken > 0) {
        exp += Math.min(20, Math.floor(damageTaken / 10));
    }
    if (exp <= 0) return;
    if (typeof team === 'undefined' || !team.length) return;
    for (let idx of team) {
        let card = myCards[idx];
        if (!card) continue;
        addCardMasteryExp(card, exp);
    }
}

// ========== АПГРЕЙД МАСТЕРСТВА ==========
function upgradeMastery(cardIndex) {
    let card = myCards[cardIndex];
    if (!card) return;
    let currentLvl = card.mastery || 1;
    if (currentLvl >= 5) { showFloatingText("МАКС УРОВЕНЬ!", "#ff8800"); return; }
    let targetLevel = currentLvl + 1;
    let cost = getMasteryUpgradeCost(card, targetLevel);
    let expNeeded = getMasteryExpNeeded(card, targetLevel);
    let currentExp = card.masteryExp || 0;

    if (mode !== "moder") {
        if (points < cost.stars) { showFloatingText("НЕ ХВАТАЕТ ЗВЁЗД! (" + cost.stars + ")", "#ff3333"); return; }
        if (powerPoints < cost.power) { showFloatingText("НЕ ХВАТАЕТ СИЛЫ! (" + cost.power + ")", "#ff3333"); return; }
        if (currentExp < expNeeded) { showFloatingText("НЕ ХВАТАЕТ ОПЫТА! (" + Math.floor(currentExp) + "/" + expNeeded + ")", "#ff3333"); return; }
        points -= cost.stars;
        powerPoints -= cost.power;
    }

    card.mastery = targetLevel;
    card.masteryExp = 0;
    saveAll();
    renderAll();
    updatePlayerStats();
    if (typeof sfxLevelUp === 'function') sfxLevelUp();
    showFloatingText("⭐ МАСТЕРСТВО " + targetLevel + "!", "#ffd700");
    renderPowerPoints();

    if (targetLevel === 3 && card.statusAbility) setTimeout(function() { alert("⭐ Уровень 3!\nРазблокирован статус-эффект:\n" + card.statusAbility.desc); }, 300);
    if (targetLevel === 4 && card.ability) setTimeout(function() { alert("⭐ Уровень 4!\nРазблокирована способность:\n" + card.ability.desc); }, 300);
    if (targetLevel === 5 && card.superAbility) setTimeout(function() { alert("⭐ Уровень 5!\nРазблокирована СУПЕР-УЛЬТА:\n" + card.superAbility.name + "\n" + card.superAbility.desc); }, 300);
}

// ========== HTML КАРТОЧКИ (звёзды + полоска опыта) ==========
function getMasteryHTML(card) {
    let lvl = card.mastery || 1;
    let percent = Math.floor(MASTERY_MULT[lvl] * 100);
    let color = lvl >= 5 ? "#ffd700" : lvl >= 4 ? "#e056fd" : lvl >= 3 ? "#9b59b6" : lvl >= 2 ? "#3498db" : "#95a5a6";
    let stars = "";
    for (let i = 1; i <= 5; i++) stars += (i <= lvl ? "★" : "☆");
    let expHtml = "";
    if (lvl < 5) {
        let expNeeded = getMasteryExpNeeded(card, lvl + 1);
        let currentExp = card.masteryExp || 0;
        let expPct = Math.min(100, (currentExp / expNeeded) * 100);
        expHtml = '<div style="font-size:8px;color:#00d4ff;font-weight:bold;margin-top:2px;">📊 ' + Math.floor(currentExp) + '/' + expNeeded + '</div>';
        expHtml += '<div style="background:rgba(0,0,0,0.5);border-radius:4px;height:3px;margin-top:1px;overflow:hidden;"><div style="width:' + expPct + '%;height:100%;background:linear-gradient(90deg, #00d4ff, #0099ff);"></div></div>';
    }
    return '<div style="font-size:9px;color:' + color + ';font-weight:bold;margin-top:2px;">' + stars + ' ' + percent + '%</div>' + expHtml;
}

// ========== МОДАЛКА МАСТЕРСТВА ==========
function showMasteryModal(cardIndex) {
    let card = myCards[cardIndex];
    if (!card) return;
    let lvl = card.mastery || 1;
    let currentExp = card.masteryExp || 0;

    let html = '<h2>⭐ МАСТЕРСТВО КАРТЫ</h2>';
    html += '<div style="text-align:center;font-size:18px;font-weight:900;margin-bottom:5px;">' + (typeof escapeHtml === 'function' ? escapeHtml(card.name) : card.name) + '</div>';
    html += '<div style="text-align:center;font-size:11px;color:#aaa;margin-bottom:15px;">' + card.rarity + '</div>';
    html += '<div style="font-size:14px;color:#aaa;margin-bottom:15px;text-align:center;">Уровень: <span style="color:#ffd700;font-weight:900;">' + lvl + '/5</span> (' + Math.floor(MASTERY_MULT[lvl]*100) + '% характеристик)</div>';

    html += '<div style="display:flex;gap:4px;margin-bottom:20px;">';
    for (let i = 1; i <= 5; i++) {
        let col = i <= lvl ? "#ffd700" : "#333";
        html += '<div style="flex:1;height:10px;background:' + col + ';border-radius:5px;box-shadow:' + (i <= lvl ? '0 0 8px #ffd700' : 'none') + ';"></div>';
    }
    html += '</div>';

    html += '<div style="text-align:left;font-size:12px;margin-bottom:20px;line-height:1.8;background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;">';
    html += '<div style="opacity:' + (lvl >= 1 ? 1 : 0.4) + ';">✅ Ур 1: Базовые характеристики (60%)</div>';
    html += '<div style="opacity:' + (lvl >= 2 ? 1 : 0.4) + ';">' + (lvl >= 2 ? '✅' : '🔒') + ' Ур 2: +15% (75%)</div>';
    html += '<div style="opacity:' + (lvl >= 3 ? 1 : 0.4) + ';">' + (lvl >= 3 ? '✅' : '🔒') + ' Ур 3: +10% (85%)' + (card.statusAbility ? '<br><span style="color:#e056fd;font-size:10px;margin-left:15px;">✨ ' + card.statusAbility.desc + '</span>' : '') + '</div>';
    html += '<div style="opacity:' + (lvl >= 4 ? 1 : 0.4) + ';">' + (lvl >= 4 ? '✅' : '🔒') + ' Ур 4: +10% (95%)' + (card.ability ? '<br><span style="color:#e056fd;font-size:10px;margin-left:15px;">✨ ' + card.ability.desc + '</span>' : '') + '</div>';
    html += '<div style="opacity:' + (lvl >= 5 ? 1 : 0.4) + ';">' + (lvl >= 5 ? '✅' : '🔒') + ' Ур 5: +5% (100%)' + (card.superAbility ? '<br><span style="color:#e056fd;font-size:10px;margin-left:15px;">⚡ ' + card.superAbility.name + '</span>' : '') + '</div>';
    html += '</div>';

    if (lvl < 5) {
        let cost = getMasteryUpgradeCost(card, lvl + 1);
        let expNeeded = getMasteryExpNeeded(card, lvl + 1);
        let canStars = mode === "moder" || points >= cost.stars;
        let canPower = mode === "moder" || powerPoints >= cost.power;
        let canExp = mode === "moder" || currentExp >= expNeeded;
        let canAfford = canStars && canPower && canExp;

        // Опыт
        html += '<div style="background:rgba(0,0,0,0.4);border-radius:12px;padding:12px;margin-bottom:12px;">';
        html += '<div style="font-size:12px;color:#aaa;margin-bottom:6px;text-align:center;">📊 Опыт карты:</div>';
        html += '<div style="background:rgba(0,0,0,0.5);border-radius:8px;height:16px;overflow:hidden;position:relative;">';
        let expPct = Math.min(100, (currentExp / expNeeded) * 100);
        html += '<div style="width:' + expPct + '%;height:100%;background:linear-gradient(90deg, #00d4ff, #0099ff);transition:width 0.4s;"></div>';
        html += '<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;text-shadow:0 0 4px #000;">' + Math.floor(currentExp) + ' / ' + expNeeded + '</div>';
        html += '</div>';
        if (!canExp) html += '<div style="text-align:center;font-size:10px;color:#ff8888;margin-top:6px;">⚠️ Недостаточно опыта!</div>';
        html += '</div>';

        // Стоимость
        html += '<div style="background:rgba(0,0,0,0.4);border-radius:12px;padding:12px;margin-bottom:12px;">';
        html += '<div style="font-size:12px;color:#aaa;margin-bottom:8px;text-align:center;">До уровня ' + (lvl+1) + ':</div>';
        html += '<div style="display:flex;justify-content:space-around;font-size:15px;font-weight:900;">';
        html += '<span style="color:' + (canStars ? '#ffd700' : '#ff3333') + ';">⭐ ' + cost.stars.toLocaleString() + '</span>';
        html += '<span style="color:' + (canPower ? '#a855f7' : '#ff3333') + ';">🔮 ' + cost.power + '</span>';
        html += '</div></div>';

        html += '<button class="btn btn-primary" style="width:100%;padding:14px;font-size:16px;" onclick="closeModal();upgradeMastery(' + cardIndex + ');" ' + (!canAfford ? 'disabled' : '') + '>⬆️ ПРОКАЧАТЬ ДО УР ' + (lvl+1) + '</button>';
    } else {
        html += '<div style="text-align:center;color:#ffd700;font-size:18px;font-weight:900;padding:15px;">🏆 МАКСИМУМ</div>';
    }
    html += '<button class="btn" style="width:100%;padding:10px;margin-top:10px;background:#555;" onclick="closeModal()">Закрыть</button>';

    let el = document.getElementById("modalContent");
    if (el) el.innerHTML = html;
    el = document.getElementById("modalOverlay");
    if (el) el.style.display = "flex";
}

// ========== РЕНДЕР ОЧКОВ СИЛЫ (🔮) ==========
function renderPowerPoints() {
    let elem = document.getElementById("powerPointsDisplay");
    if (!elem) {
        let pointsElem = document.getElementById("pointsAmount");
        if (pointsElem && pointsElem.parentNode) {
            let newElem = document.createElement("div");
            newElem.id = "powerPointsDisplay";
            newElem.style.cssText = "font-size:20px;font-weight:900;color:#a855f7;text-align:center;margin-bottom:10px;text-shadow:0 2px 8px rgba(168,85,247,0.4);background:rgba(0,0,0,0.2);padding:8px;border-radius:15px;";
            newElem.innerHTML = '🔮 <span id="powerPointsAmount">0</span> Сила';
            pointsElem.parentNode.insertBefore(newElem, pointsElem.nextSibling);
            elem = newElem;
        }
    }
    let amt = document.getElementById("powerPointsAmount");
    if (amt) amt.innerText = powerPoints.toLocaleString();
}

// ========== НАГРАДА СИЛЫ ЗА БОССА ==========
function grantMasteryPowerForBoss() {
    addPowerPoints(3);
    showFloatingText("🔮 +3 СИЛЫ!", "#a855f7");
}

// ========== ЭКСПОРТ ==========
window.MASTERY_MULT = MASTERY_MULT;
window.getMasteryMult = getMasteryMult;
window.hasMasteryStatus = hasMasteryStatus;
window.hasMasteryAbility = hasMasteryAbility;
window.hasMasterySuper = hasMasterySuper;
window.getMasteryUpgradeCost = getMasteryUpgradeCost;
window.getMasteryExpNeeded = getMasteryExpNeeded;
window.addCardMasteryExp = addCardMasteryExp;
window.grantMasteryExpFromFight = grantMasteryExpFromFight;
window.upgradeMastery = upgradeMastery;
window.showMasteryModal = showMasteryModal;
window.getMasteryHTML = getMasteryHTML;
window.renderPowerPoints = renderPowerPoints;
window.addPowerPoints = addPowerPoints;
window.grantMasteryPowerForBoss = grantMasteryPowerForBoss;
window.getPowerPoints = function() { return powerPoints; };
window.setPowerPoints = function(v) { powerPoints = v; };

console.log("[MASTERY] v2.0 — с опытом");
