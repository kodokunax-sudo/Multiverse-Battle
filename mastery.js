// ============================================================
// МАСТЕРСТВО КАРТ v2.7 — БАЛАНС В МОДАЛКЕ + ЗВУКИ
// ============================================================

const MASTERY_MULT = [0, 0.60, 0.75, 0.85, 0.95, 1.00];

const MASTERY_BASE_STARS = [0, 0, 100, 200, 400, 800];
const MASTERY_BASE_POWER = [0, 0, 50, 100, 200, 400];

const MASTERY_BASE_EXP = 200;
const MASTERY_EXP_LEVEL_MULT = [0, 0, 1, 2, 4, 8];

const MASTERY_RARITY_MULT = {
    "Обычная": 1, "Редкая": 1.5, "Сверх редкая": 2.5, "Эпик": 4,
    "Мифическая": 6, "Легендарная": 10, "Секретная": 15,
    "Эволюционная": 25, "Босс": 20, "Пасхалка": 3
};

let powerPoints = 0;

const MASTERY_GAIN_TEXT = {
    1: "60%",
    2: "+15%",
    3: "+10%",
    4: "+10%",
    5: "+5%"
};

// ========== ПОЛУЧЕНИЕ ОЧКОВ СИЛЫ ==========
function addPowerPoints(amount) {
    powerPoints += amount;
    saveAll();
    renderPowerPoints();
    renderPoints();
    if (typeof renderPass === 'function') renderPass();
}

function getPowerPerWave(waveNum) {
    if (waveNum < 100) return 1;
    if (waveNum < 200) return 2;
    if (waveNum < 300) return 3;
    if (waveNum < 400) return 4;
    if (waveNum < 500) return 5;
    if (waveNum < 600) return 6;
    if (waveNum < 700) return 7;
    if (waveNum < 800) return 8;
    if (waveNum < 900) return 9;
    if (waveNum < 1000) return 10;
    if (waveNum < 2000) return 15;
    if (waveNum < 3000) return 20;
    if (waveNum < 5000) return 25;
    return 30;
}

function grantPowerForWave(waveNum) {
    let amount = getPowerPerWave(waveNum);
    powerPoints += amount;
    saveAll();
    renderPowerPoints();
    if (typeof renderPoints === 'function') renderPoints();
}

function getMasteryMult(card) {
    if (!card) return 1.0;
    let lvl = Math.max(1, Math.min(5, card.mastery || 1));
    return MASTERY_MULT[lvl];
}

function hasMasteryStatus(card) { return card && (card.mastery || 1) >= 3; }
function hasMasteryAbility(card) { return card && (card.mastery || 1) >= 4; }
function hasMasterySuper(card) { return card && (card.mastery || 1) >= 5; }

function getMasteryUpgradeCost(card, targetLevel) {
    if (!card) return { stars: 999999, power: 99999 };
    let rarMult = MASTERY_RARITY_MULT[card.rarity] || 1;
    return {
        stars: Math.floor((MASTERY_BASE_STARS[targetLevel] || 0) * rarMult),
        power: Math.ceil((MASTERY_BASE_POWER[targetLevel] || 0) * rarMult)
    };
}

function getMasteryExpNeeded(card, targetLevel) {
    if (!card || targetLevel < 2 || targetLevel > 5) return 0;
    let rarMult = MASTERY_RARITY_MULT[card.rarity] || 1;
    let lvlMult = MASTERY_EXP_LEVEL_MULT[targetLevel] || 1;
    return Math.floor(MASTERY_BASE_EXP * lvlMult * rarMult);
}

function addCardMasteryExp(card, expAmount) {
    if (!card || expAmount <= 0) return;
    if ((card.mastery || 1) >= 5) return;
    if (typeof card.masteryExp === 'undefined') card.masteryExp = 0;
    card.masteryExp += expAmount;
}

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

    let leftoverExp = Math.floor(currentExp - expNeeded);
    if (leftoverExp < 0) leftoverExp = 0;

    card.mastery = targetLevel;
    card.masteryExp = leftoverExp;

    saveAll();
    renderAll();
    updatePlayerStats();
    if (typeof sfxLevelUp === 'function') sfxLevelUp();
    if (typeof sfxUIMastery === 'function') sfxUIMastery();

    // ★ ОБНОВЛЯЕМ БАЛАНС В ОТКРЫТОЙ МОДАЛКЕ ★
    setTimeout(function() {
        if (document.getElementById("modalOverlay") && document.getElementById("modalOverlay").style.display === "flex") {
            showMasteryModal(cardIndex);
        }
    }, 100);

    if (leftoverExp > 0) {
        showFloatingText("⭐ МАСТЕРСТВО " + targetLevel + "! (+" + MASTERY_GAIN_TEXT[targetLevel] + ")", "#ffd700");
        setTimeout(function() { showFloatingText("📊 Осталось опыта: " + leftoverExp, "#00d4ff"); }, 400);
    } else {
        showFloatingText("⭐ МАСТЕРСТВО " + targetLevel + "! (+" + MASTERY_GAIN_TEXT[targetLevel] + ")", "#ffd700");
    }
    renderPowerPoints();
    if (typeof renderPoints === 'function') renderPoints();

    if (targetLevel === 3 && card.statusAbility) setTimeout(function() { alert("⭐ Уровень 3 (" + MASTERY_GAIN_TEXT[3] + ")!\nРазблокирован статус-эффект:\n" + card.statusAbility.desc); }, 300);
    if (targetLevel === 4 && card.ability) setTimeout(function() { alert("⭐ Уровень 4 (" + MASTERY_GAIN_TEXT[4] + ")!\nРазблокирована способность:\n" + card.ability.desc); }, 300);
    if (targetLevel === 5 && card.superAbility) setTimeout(function() { alert("⭐ Уровень 5 (" + MASTERY_GAIN_TEXT[5] + ")!\nРазблокирована СУПЕР-УЛЬТА:\n" + card.superAbility.name + "\n" + card.superAbility.desc); }, 300);
}

function getMasteryHTML(card) {
    let lvl = card.mastery || 1;
    let gainText = MASTERY_GAIN_TEXT[lvl] || "60%";
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
    return '<div style="font-size:9px;color:' + color + ';font-weight:bold;margin-top:2px;">' + stars + ' ' + gainText + '</div>' + expHtml;
}

function getLightningSVG(size, color) {
    if (size === undefined) size = 20;
    if (color === undefined) color = "#ffd700";
    return '<span style="display:inline-block;width:' + size + 'px;height:' + size + 'px;vertical-align:middle;flex-shrink:0;">' +
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;filter:drop-shadow(0 0 5px ' + color + ');">' +
        '<path d="M13 2L4.5 13.5H11L10 22L19.5 9.5H13L13 2Z" fill="' + color + '" stroke="#ffaa00" stroke-width="1.5" stroke-linejoin="round"/>' +
        '</svg></span>';
}

function showMasteryModal(cardIndex) {
    let card = myCards[cardIndex];
    if (!card) return;
    let lvl = card.mastery || 1;
    let currentExp = card.masteryExp || 0;

    let html = '<h2>⭐ МАСТЕРСТВО КАРТЫ</h2>';

    // ★ ПОКАЗЫВАЕМ БАЛАНС СВЕРХУ ★
    html += '<div style="display:flex;justify-content:center;gap:25px;align-items:center;flex-wrap:wrap;margin-bottom:15px;padding:10px;background:rgba(0,0,0,0.3);border-radius:14px;border:1px solid rgba(245,175,25,0.2);">';
    html += '<span style="font-weight:900;font-size:15px;color:#f5af19;text-shadow:0 0 8px rgba(245,175,25,0.4);">⭐ ' + (typeof points !== 'undefined' ? points.toLocaleString() : 0) + '</span>';
    html += '<span style="font-weight:900;font-size:15px;color:#ffd700;display:inline-flex;align-items:center;gap:5px;text-shadow:0 0 8px rgba(255,215,0,0.4);">' + (typeof getLightningSVG === 'function' ? getLightningSVG(18, '#ffd700') : '⚡') + ' ' + (typeof powerPoints !== 'undefined' ? powerPoints.toLocaleString() : 0) + ' Силы</span>';
    html += '</div>';

    html += '<div style="text-align:center;font-size:18px;font-weight:900;margin-bottom:5px;">' + (typeof escapeHtml === 'function' ? escapeHtml(card.name) : card.name) + '</div>';
    html += '<div style="text-align:center;font-size:11px;color:#aaa;margin-bottom:15px;">' + card.rarity + '</div>';

    let currentBonusText = "";
    if (lvl === 1) currentBonusText = "60% характеристик";
    else if (lvl === 2) currentBonusText = "+15% (всего 75%)";
    else if (lvl === 3) currentBonusText = "+10% (всего 85%)";
    else if (lvl === 4) currentBonusText = "+10% (всего 95%)";
    else if (lvl === 5) currentBonusText = "+5% (всего 100%)";
    html += '<div style="font-size:13px;color:#aaa;margin-bottom:15px;text-align:center;">Уровень: <span style="color:#ffd700;font-weight:900;">' + lvl + '/5</span> — <span style="color:#00d4ff;font-weight:bold;">' + currentBonusText + '</span></div>';

    html += '<div style="display:flex;gap:4px;margin-bottom:20px;">';
    for (let i = 1; i <= 5; i++) {
        let col = i <= lvl ? "#ffd700" : "#333";
        html += '<div style="flex:1;height:10px;background:' + col + ';border-radius:5px;box-shadow:' + (i <= lvl ? '0 0 8px #ffd700' : 'none') + ';"></div>';
    }
    html += '</div>';

    html += '<div style="text-align:left;font-size:12px;margin-bottom:20px;line-height:1.8;background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;">';
    html += '<div style="opacity:' + (lvl >= 1 ? 1 : 0.4) + ';">✅ Ур 1: <span style="color:#00d4ff;font-weight:bold;">60%</span> характеристик</div>';
    html += '<div style="opacity:' + (lvl >= 2 ? 1 : 0.4) + ';">' + (lvl >= 2 ? '✅' : '🔒') + ' Ур 2: <span style="color:#00d4ff;font-weight:bold;">+15%</span> (75%)</div>';
    html += '<div style="opacity:' + (lvl >= 3 ? 1 : 0.4) + ';">' + (lvl >= 3 ? '✅' : '🔒') + ' Ур 3: <span style="color:#00d4ff;font-weight:bold;">+10%</span> (85%)' + (card.statusAbility ? '<br><span style="color:#e056fd;font-size:10px;margin-left:15px;">✨ ' + card.statusAbility.desc + '</span>' : '') + '</div>';
    html += '<div style="opacity:' + (lvl >= 4 ? 1 : 0.4) + ';">' + (lvl >= 4 ? '✅' : '🔒') + ' Ур 4: <span style="color:#00d4ff;font-weight:bold;">+10%</span> (95%)' + (card.ability ? '<br><span style="color:#e056fd;font-size:10px;margin-left:15px;">✨ ' + card.ability.desc + '</span>' : '') + '</div>';
    html += '<div style="opacity:' + (lvl >= 5 ? 1 : 0.4) + ';">' + (lvl >= 5 ? '✅' : '🔒') + ' Ур 5: <span style="color:#00d4ff;font-weight:bold;">+5%</span> (100%)' + (card.superAbility ? '<br><span style="color:#e056fd;font-size:10px;margin-left:15px;">⚡ ' + card.superAbility.name + '</span>' : '') + '</div>';
    html += '</div>';

    if (lvl < 5) {
        let cost = getMasteryUpgradeCost(card, lvl + 1);
        let expNeeded = getMasteryExpNeeded(card, lvl + 1);
        let canStars = mode === "moder" || points >= cost.stars;
        let canPower = mode === "moder" || powerPoints >= cost.power;
        let canExp = mode === "moder" || currentExp >= expNeeded;
        let canAfford = canStars && canPower && canExp;

        let nextGain = MASTERY_GAIN_TEXT[lvl + 1] || "";
        let nextGainClean = nextGain.replace('+', '');
        let leftoverAfter = Math.max(0, Math.floor(currentExp - expNeeded));

        html += '<div style="background:rgba(0,0,0,0.4);border-radius:12px;padding:12px;margin-bottom:12px;">';
        html += '<div style="font-size:12px;color:#aaa;margin-bottom:6px;text-align:center;">📊 Опыт карты:</div>';
        html += '<div style="background:rgba(0,0,0,0.5);border-radius:8px;height:16px;overflow:hidden;position:relative;">';
        let expPct = Math.min(100, (currentExp / expNeeded) * 100);
        html += '<div style="width:' + expPct + '%;height:100%;background:linear-gradient(90deg, #00d4ff, #0099ff);transition:width 0.4s;"></div>';
        html += '<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;text-shadow:0 0 4px #000;">' + Math.floor(currentExp) + ' / ' + expNeeded + '</div>';
        html += '</div>';
        if (!canExp) {
            html += '<div style="text-align:center;font-size:10px;color:#ff8888;margin-top:6px;">⚠️ Недостаточно опыта!</div>';
        } else if (leftoverAfter > 0) {
            html += '<div style="text-align:center;font-size:11px;color:#00d4ff;margin-top:6px;font-weight:bold;">✅ После прокачки останется: ' + leftoverAfter + ' опыта</div>';
        }
        html += '</div>';

        html += '<div style="background:rgba(0,0,0,0.4);border-radius:12px;padding:12px;margin-bottom:12px;">';
        html += '<div style="font-size:12px;color:#aaa;margin-bottom:8px;text-align:center;">До уровня ' + (lvl+1) + ' — прирост <span style="color:#00d4ff;font-weight:bold;">' + nextGain + '</span>:</div>';
        html += '<div style="display:flex;justify-content:space-around;align-items:center;font-size:15px;font-weight:900;">';
        html += '<span style="color:' + (canStars ? '#ffd700' : '#ff3333') + ';">⭐ ' + cost.stars.toLocaleString() + '</span>';
        html += '<span style="color:' + (canPower ? '#ffd700' : '#ff3333') + ';display:inline-flex;align-items:center;gap:4px;">' + getLightningSVG(16, canPower ? '#ffd700' : '#ff3333') + ' ' + cost.power + '</span>';
        html += '</div></div>';

        html += '<button class="btn btn-primary" style="width:100%;padding:14px;font-size:16px;" onclick="closeModal();upgradeMastery(' + cardIndex + ');" ' + (!canAfford ? 'disabled' : '') + '>⬆️ ПРОКАЧАТЬ +' + nextGainClean + '</button>';
    } else {
        html += '<div style="text-align:center;color:#ffd700;font-size:18px;font-weight:900;padding:15px;">🏆 МАКСИМУМ (+5% бонус)</div>';
    }
    html += '<button class="btn" style="width:100%;padding:10px;margin-top:10px;background:#555;" onclick="closeModal()">Закрыть</button>';

    let el = document.getElementById("modalContent");
    if (el) el.innerHTML = html;
    el = document.getElementById("modalOverlay");
    if (el) el.style.display = "flex";
}

function renderPowerPoints() {
    let elem = document.getElementById("powerPointsDisplay");
    if (!elem) {
        let pointsElem = document.getElementById("pointsAmount");
        if (pointsElem && pointsElem.parentNode) {
            let newElem = document.createElement("div");
            newElem.id = "powerPointsDisplay";
            newElem.style.cssText = "font-size:20px;font-weight:900;color:#ffd700;text-align:center;margin-bottom:10px;text-shadow:0 2px 8px rgba(255,215,0,0.5);background:rgba(0,0,0,0.2);padding:8px;border-radius:15px;display:flex;align-items:center;justify-content:center;gap:6px;";
            newElem.innerHTML = getLightningSVG(20, '#ffd700') + ' <span id="powerPointsAmount">0</span> Сила';
            pointsElem.parentNode.insertBefore(newElem, pointsElem.nextSibling);
            elem = newElem;
        }
    }
    let amt = document.getElementById("powerPointsAmount");
    if (amt) amt.innerText = powerPoints.toLocaleString();
    let ppEl = document.getElementById("powerPointsAmountUpgrade");
    if (ppEl) ppEl.innerText = powerPoints.toLocaleString();
}

function grantMasteryPowerForBoss() {
    addPowerPoints(50);
    showFloatingText("⚡ +50 СИЛЫ ЗА БОССА!", "#ffd700");
}

window.MASTERY_MULT = MASTERY_MULT;
window.MASTERY_GAIN_TEXT = MASTERY_GAIN_TEXT;
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
window.getLightningSVG = getLightningSVG;
window.renderPowerPoints = renderPowerPoints;
window.addPowerPoints = addPowerPoints;
window.grantMasteryPowerForBoss = grantMasteryPowerForBoss;
window.getPowerPerWave = getPowerPerWave;
window.grantPowerForWave = grantPowerForWave;
window.getPowerPoints = function() { return powerPoints; };
window.setPowerPoints = function(v) { powerPoints = v; };

console.log("[MASTERY] v2.7 — баланс в модалке + звуки");
