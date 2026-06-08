// ========== АВТОМАТИЧЕСКАЯ ИНЪЕКЦИЯ РЕТРО-АРКАДНЫХ СТИЛЕЙ (8-BIT PIXEL ART) ==========
(function injectRetroArcadeStyles() {
    if (document.getElementById("retro-arcade-styles")) return;
    let style = document.createElement("style");
    style.id = "retro-arcade-styles";
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        /* Глобальные пиксельные правила */
        * {
            font-family: 'Press Start 2P', cursive, monospace !important;
            image-rendering: pixelated !important;
            image-rendering: crisp-edges !important;
        }
        
        body {
            background-color: #0a0a14 !important;
            color: #ffffff !important;
        }
        
        /* Стилизация карточек, магазинов и блоков под старые аркадные автоматы */
        .card-item, .shop-item, .upgrade-item, .book-item, .checkpoint-item, .evo-quest, .dialog-box, .dialog-option, .challenge-item {
            border: 3px solid #ffffff !important;
            background: #000000 !important;
            border-radius: 0px !important; /* Убираем скругления для пиксельного стиля */
            box-shadow: 4px 4px 0px #4a4a4a !important;
            position: relative;
            transition: transform 0.05s, box-shadow 0.05s;
        }
        
        /* Эффект нажатия/наведения на кнопки и элементы */
        .card-item:hover, .shop-item:hover, .book-item:hover, .dialog-option:hover {
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0px #666666 !important;
        }
        
        /* Ретро-свечение для выбранных в команду карт */
        .card-item.team-selected {
            border-color: #f5af19 !important;
            box-shadow: 4px 4px 0px #f5af19 !important;
            animation: arcade-blink-gold 1.5s infinite alternate;
        }
        .card-item.afk-selected {
            border-color: #2ecc71 !important;
            box-shadow: 4px 4px 0px #2ecc71 !important;
            animation: arcade-blink-green 1.5s infinite alternate;
        }
        
        @keyframes arcade-blink-gold {
            0% { border-color: #f5af19; }
            100% { border-color: #fff; box-shadow: 4px 4px 8px #f5af19 !important; }
        }
        @keyframes arcade-blink-green {
            0% { border-color: #2ecc71; }
            100% { border-color: #fff; box-shadow: 4px 4px 8px #2ecc71 !important; }
        }
        
        /* Аркадные олдскульные кнопки */
        .btn, button, .remove-icon {
            border: 2px solid #ffffff !important;
            background: #111111 !important;
            color: #ffffff !important;
            border-radius: 0px !important;
            box-shadow: 2px 2px 0px #555555 !important;
            text-transform: uppercase;
            cursor: pointer;
            font-size: 9px !important;
            padding: 5px 10px;
        }
        .btn:active, button:active, .remove-icon:active {
            transform: translate(2px, 2px);
            box-shadow: 0px 0px 0px #000000 !important;
        }
        .btn-primary { background-color: #2980b9 !important; }
        
        /* Теги редкости */
        .rarity-tag {
            border-radius: 0px !important;
            border: 1px solid #ffffff !important;
            text-transform: uppercase;
            font-weight: bold;
        }
        
        /* Эффект пульсации для статус-эффектов */
        .status-effect {
            display: inline-block;
            border: 2px dashed #ffffff !important;
            border-radius: 0px !important;
            padding: 4px !important;
            font-size: 8px !important;
            background: #000000 !important;
            animation: pulse-effect 1s infinite alternate;
        }
        @keyframes pulse-effect {
            0% { opacity: 0.8; }
            100% { opacity: 1; border-color: #f5af19; }
        }
        
        /* МАКСИМАЛЬНАЯ ОПТИМИЗАЦИЯ ДЛЯ ТЕЛЕФОНОВ: 4 КАРТЫ В СТРОКУ */
        @media (max-width: 768px) {
            #collectionGrid {
                display: grid !important;
                grid-template-columns: repeat(4, 1fr) !important;
                gap: 4px !important;
                padding: 4px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .card-item {
                padding: 3px !important;
                margin: 0 !important;
                min-width: 0 !important;
                max-width: 100% !important;
                box-shadow: 2px 2px 0px #222222 !important;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                height: auto !important;
            }
            .card-image {
                width: 100% !important;
                height: 32px !important;
                object-fit: cover !important;
                border-radius: 0px !important;
                margin-bottom: 2px !important;
            }
            .card-name {
                font-size: 5px !important;
                line-height: 1.1 !important;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
                margin: 1px 0 !important;
            }
            .rarity-tag {
                font-size: 4px !important;
                padding: 1px !important;
                line-height: 1 !important;
                width: 100%;
                text-align: center;
                box-sizing: border-box;
                white-space: nowrap;
                overflow: hidden;
            }
            .card-stats {
                font-size: 5px !important;
                margin-top: 1px !important;
                white-space: nowrap;
            }
            .card-item div[style*="font-size"] {
                font-size: 4px !important;
                line-height: 1 !important;
            }
            /* Кнопки действий внутри карточки на мобилках */
            .card-item div[style*="display:flex;gap:4px"] {
                gap: 2px !important;
                margin-top: 3px !important;
                width: 100%;
                justify-content: center !important;
            }
            .remove-icon {
                width: 13px !important;
                height: 13px !important;
                font-size: 6px !important;
                line-height: 13px !important;
                padding: 0 !important;
                margin: 0 !important;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #fff !important;
                box-shadow: 1px 1px 0px #000 !important;
            }
        }
    `;
    document.head.appendChild(style);
})();

// ========== ОТРИСОВКА КАРТОЧЕК ==========
function renderMyCards() { 
    let c = document.getElementById("collectionGrid"); 
    document.getElementById("totalCards").innerText = myCards.length; 
    if (!myCards.length) { 
        c.innerHTML = "<div style='width:100%;text-align:center;padding:20px;color:#888;font-size:12px;'>НЕТ КАРТ</div>"; 
        return; 
    } 
    c.innerHTML = myCards.map((cd, idx) => { 
        let isSeven = cd.name === "Семёрка"; 
        let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); 
        let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); 
        let skFinger = hasSukunaFingers && cd === myCards[team[0]]; 
        let dmgMult = 1; 
        if (cd.ability?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.ability.value); 
        if (cd.statusAbility?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.statusAbility.value); 
        let dmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1)); 
        let hp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1)); 
        let showImage = ["Эволюционная", "Секретная", "Легендарная"].includes(cd.rarity); 
        let cardImg = showImage ? getCardImage(cd.name) : null; 
        let imgHTML = cardImg ? '<img src="' + cardImg + '" class="card-image">' : ''; 
        return '<div class="card-item ' + (team.includes(idx) ? 'team-selected' : '') + ' ' + (afkTeam.includes(idx) ? 'afk-selected' : '') + '" onclick="toggleTeam(' + idx + ')">' + imgHTML + '<div class="card-name">' + escapeHtml(cd.name) + '</div>' + '<div class="rarity-tag ' + rarityColors[cd.rarity] + '">' + cd.rarity + '</div>' + '<div class="card-stats">💪' + dmg + ' ❤️' + hp + '</div>' + (cd.ability ? '<div style="font-size:10px;color:#f5af19;font-weight:bold;margin-top:2px;">✨ ' + cd.ability.desc + '</div>' : '') + (cd.statusAbility ? '<div style="font-size:9px;color:#f5af19;margin-top:2px;">' + cd.statusAbility.desc + '</div>' : '') + '<div style="display:flex;gap:4px;justify-content:center;margin-top:6px;flex-wrap:wrap;">' + '<div class="remove-icon" onclick="event.stopPropagation();toggleTeam(' + idx + ')" style="background:#f5af19;color:#000;">⚔️</div>' + '<div class="remove-icon" onclick="event.stopPropagation();toggleAfk(' + idx + ')" style="background:#2ecc71;color:#000;">💤</div>' + (!cd.unsellable ? '<div class="remove-icon" onclick="event.stopPropagation();sellCard(' + idx + ')">💰</div>' : '') + '</div></div>'; 
    }).join(''); 
}

function renderTeam() { 
    let c = document.getElementById("teamList"), d = 0, h = 0, html = ""; 
    if (!team.length) { 
        c.innerHTML = "<div style='padding:10px;text-align:center;color:#888;font-size:10px;'>ПУСТО</div>"; 
        return; 
    } 
    team.forEach((idx, s) => { 
        let cd = myCards[idx]; 
        if (!cd) return; 
        let isSeven = cd.name === "Семёрка"; 
        let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); 
        let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); 
        let skFinger = hasSukunaFingers && s === 0; 
        let dmgMult = 1; 
        if (cd.ability?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.ability.value); 
        if (cd.statusAbility?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.statusAbility.value); 
        let cDmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1)); 
        let cHp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1)); 
        if (cd.ability?.type === 'copyEnemyChance' && currentEnemy && Math.random() < cd.ability.chance) { 
            cDmg = currentEnemy.damage; 
            cHp = currentEnemy.hp; 
        } 
        d += cDmg; 
        h += cHp; 
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,0,0,0.6);border:2px solid #fff;margin-bottom:6px;"><span style="font-weight:800;font-size:10px;">' + escapeHtml(cd.name) + '</span><span style="font-size:9px;">💪' + cDmg + ' ❤️' + cHp + '</span><button class="btn" style="padding:4px 10px;background:rgba(231,76,60,0.8);border:none;" onclick="team.splice(' + s + ',1);renderAll();updatePlayerStats();">X</button></div>'; 
    }); 
    c.innerHTML = html; 
    document.getElementById("totalDamage").innerText = d; 
    document.getElementById("totalHpBonus").innerText = h; 
    window.teamDamage = d; 
    window.teamHpBonus = h; 
}

function renderAfkTeam() { 
    let c = document.getElementById("afkTeamList"), d = 0, h = 0, html = ""; 
    if (!afkTeam.length) { 
        c.innerHTML = "<div style='padding:10px;text-align:center;color:#888;font-size:10px;'>ПУСТО</div>"; 
        return; 
    } 
    afkTeam.forEach((idx, s) => { 
        let cd = myCards[idx]; 
        if (!cd) return; 
        let isSeven = cd.name === "Семёрка"; 
        let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); 
        let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); 
        let skFinger = hasSukunaFingers && s === 0; 
        let dmgMult = 1; 
        if (cd.ability?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.ability.value); 
        if (cd.statusAbility?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.statusAbility.value); 
        let cDmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1)); 
        let cHp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1)); 
        d += cDmg; 
        h += cHp; 
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,0,0,0.6);border:2px solid #fff;margin-bottom:6px;"><span style="font-weight:800;font-size:10px;">' + escapeHtml(cd.name) + '</span><span style="font-size:9px;">💪' + Math.floor(cDmg * 0.8) + ' ❤️' + Math.floor(cHp * 0.8) + '</span><button class="btn" style="padding:4px 10px;background:rgba(231,76,60,0.8);border:none;" onclick="afkTeam.splice(' + s + ',1);renderAll();">X</button></div>'; 
    }); 
    c.innerHTML = html; 
    document.getElementById("afkTotalDamage").innerText = Math.floor(d * 0.8); 
    document.getElementById("afkTotalHpBonus").innerText = Math.floor(h * 0.8); 
    window.afkTeamDamage = Math.floor(d * 0.8); 
    window.afkTeamHpBonus = Math.floor(h * 0.8); 
}

function renderEnemy() { 
    if (!currentEnemy) generateEnemy(); 
    let p = (currentEnemy.hp / currentEnemy.maxHp) * 100; 
    let rew = currentEnemy.isBoss ? Math.floor(wave / 2 * getStarMult()) : Math.floor(wave / 3 * getStarMult()); 
    document.getElementById("enemyContainer").innerHTML = '<div style="font-size:18px;font-weight:900;margin-bottom:8px;">' + currentEnemy.name + '</div><div style="font-size:12px;margin-bottom:5px;">❤️ ' + Math.floor(currentEnemy.hp) + ' / ' + currentEnemy.maxHp + '</div><div style="background:rgba(0,0,0,0.7);border:2px solid #fff;margin-bottom:8px;"><div style="width:' + p + '%;background:linear-gradient(90deg, #e74c3c, #f5af19);height:14px;"></div></div><div style="font-size:12px;color:#aaa;">⚔️ УРОН: ' + currentEnemy.damage + '</div>'; 
    document.getElementById("waveNumber").innerText = wave; 
    document.getElementById("rewardPreview").innerText = rew; 
    if (currentEnemy.isBoss && currentEnemy.hp <= currentEnemy.maxHp * 0.3 && currentEnemy.hp > 0) { 
        document.getElementById("spareBtn").style.display = "block"; 
    } else { 
        document.getElementById("spareBtn").style.display = "none"; 
    } 
    if (currentDialog && wave === 10000 && currentEnemy.hp <= currentEnemy.maxHp * 0.5 && currentEnemy.hp > 0) { 
        renderDialog(); 
    } 
    document.getElementById("worldIndicator").innerHTML = '🌍 МИР: <span style="color:' + getCurrentWorld().color + ';">' + getCurrentWorld().name + '</span> <button id="musicToggleBtn" class="btn" style="padding:2px 8px;font-size:10px;margin-left:8px;" onclick="toggleMusic()">' + (musicEnabled ? '🔊' : '🔇') + '</button>'; 
}

function renderDialog() { 
    if (!currentDialog || !Array.isArray(currentDialog)) return; 
    let html = '<div class="dialog-box" style="padding:10px;font-size:10px;"><b>' + currentEnemy.name + ':</b> «' + bossTemplates[10000].dialogue + '»</div>'; 
    html += '<div style="margin-top:10px;font-weight:800;font-size:11px;">ОТВЕТИТЬ:</div>'; 
    currentDialog.forEach((d, i) => { 
        html += '<div class="dialog-option" style="padding:8px;margin-top:4px;font-size:9px;cursor:pointer;" onclick="selectDialog(' + i + ')">' + d.text + '</div>'; 
    }); 
    document.getElementById("dialogBox").innerHTML = html; 
    document.getElementById("dialogBox").style.display = "block"; 
}

function selectDialog(index) { 
    if (!currentDialog || !currentDialog[index]) return; 
    let d = currentDialog[index]; 
    let html = '<div class="dialog-box" style="padding:10px;font-size:10px;"><b>ВЫ:</b> «' + d.text + '»</div>'; 
    html += '<div class="dialog-box" style="padding:10px;font-size:10px;margin-top:5px;"><b>' + currentEnemy.name + ':</b> «' + d.response + '» ' + d.mood + '</div>'; 
    document.getElementById("dialogBox").innerHTML = html; 
    currentDialog = null; 
}

function updateStatusDisplay() { 
    let html = ''; 
    if (enemyStatuses.fireTicks > 0) html += '<span class="status-effect">🔥 ГОРИТ (' + enemyStatuses.fireTicks + ')</span>'; 
    if (enemyStatuses.poisonDamage > 0) html += '<span class="status-effect">🌀 ЯД: ' + enemyStatuses.poisonDamage + '</span>'; 
    if (enemyStatuses.bleedMult > 1.0) html += '<span class="status-effect">🩸 КРОВОТЕЧЕНИЕ: x' + enemyStatuses.bleedMult.toFixed(2) + '</span>'; 
    if (enemyStatuses.freezeStacks > 0) html += '<span class="status-effect">❄️ ОБЛЕДЕНЕНИЕ: +' + enemyStatuses.freezeStacks + '</span>'; 
    if (enemyStatuses.shockChance > 0) html += '<span class="status-effect">⚡ ШОК: ' + Math.floor(enemyStatuses.shockChance * 100) + '%</span>'; 
    if (enemyStatuses.blindStacks > 0) html += '<span class="status-effect">🕶️ ОСЛЕПЛЕНИЕ: +' + enemyStatuses.blindStacks + '</span>'; 
    html += ' <span class="status-effect" style="background:#ff4400;color:#fff;border-style:solid;">⚡КОМБО: x' + comboMultiplier + '</span>'; 
    document.getElementById("statusEffects").innerHTML = html; 
}

function updateEnemyStatusDisplay() { 
    let html = ''; 
    if (enemyStatuses.freezeStacks > 0) html += '<span class="status-effect">❄️ ЗАМОРОЗКА ВРАГА: +' + enemyStatuses.freezeStacks + '</span>'; 
    if (enemyStatuses.bleedMult > 1.0) html += '<span class="status-effect">🩸 УСИЛЕНИЕ ВРАГА: x' + enemyStatuses.bleedMult.toFixed(1) + '</span>'; 
    if (enemyStatuses.shockChance > 0) html += '<span class="status-effect">⚡ ШОК ВРАГА: ' + Math.floor(enemyStatuses.shockChance * 100) + '%</span>'; 
    document.getElementById("enemyStatusEffects").innerHTML = html; 
}

function renderDefeatHistory() { 
    document.getElementById("fightHistory").innerHTML = defeatHistory.length ? defeatHistory.map(h => '<div style="padding:4px 0;border-bottom:2px dashed rgba(255,255,255,0.2);font-size:9px;">💀 ВОЛНА ' + h.wave + ' <span style="color:#aaa;">| HP ' + h.hp + '</span></div>').join('') : "НЕТ ПОРАЖЕНИЙ"; 
}

function renderAchievements() { 
    let c = document.getElementById("achievementsList"), l = []; 
    if (achievements.win10) l.push("10🏆"); 
    if (achievements.win50) l.push("50🏆"); 
    if (achievements.win100) l.push("100🏆"); 
    if (achievements.win500) l.push("500🏆"); 
    if (achievements.legendaryTeam) l.push("ЛЕГЕНДЫ"); 
    if (achievements.secretTeam) l.push("СЕКРЕТЫ"); 
    if (achievements.level20) l.push("20УР"); 
    if (achievements.level50) l.push("50УР"); 
    c.innerHTML = l.length ? l.map(a => '<span class="rarity-tag" style="background:#f5af19;color:#1a1a2e;box-shadow:none;padding:2px 4px;font-size:9px;margin:2px;display:inline-block;">' + a + '</span>').join('') : "НЕТ"; 
}

function renderChallenges() { 
    let c = document.getElementById("challengeList"); 
    if (!challenges.length) { 
        c.innerHTML = "КВЕСТЫ ЗАГРУЖАЮТСЯ..."; 
        return; 
    } 
    c.innerHTML = challenges.map(ch => '<div class="challenge-item" style="opacity:' + (ch.completed ? 0.6 : 1) + ';padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><b>' + ch.name + '</b><br><small>' + (ch.progress || 0) + '/' + ch.target + '</small></div><div><span style="color:#f5af19;">' + ch.reward + '⭐</span> ' + (ch.completed ? '✅' : '') + '</div></div>').join(''); 
}

function renderShop() { 
    let c = document.getElementById("shopItems"); 
    c.innerHTML = shopItems.map((it, i) => it ? '<div class="shop-item" style="padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><strong>' + it.name + '</strong>' + (it.desc ? '<br><small style="color:#aaa;">' + it.desc + '</small>' : '') + '</div><div><span class="shop-price" style="color:#f5af19;margin-right:6px;">' + it.cost + '⭐</span><button class="btn btn-primary" style="padding:4px 8px;" onclick="buyShopItem(' + i + ')">КУПИТЬ</button></div></div>' : '<div class="shop-item"><div style="color:#888;padding:8px;text-align:center;">ПУСТО</div></div>').join(''); 
    let artHtml = ''; 
    if (rebirthCount >= 4) { 
        artHtml += '<div class="shop-item" style="padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><b>🗿 ПАЛЬЦЫ СУКУНЫ</b><br><small style="color:#aaa;">Баффает первого в команде: +50% урона, +40% HP.</small></div><div><span class="shop-price" style="color:#f5af19;margin-right:6px;">15000⭐</span><button class="btn" style="padding:4px 8px;" onclick="buySukuna()" ' + (hasSukunaFingers ? 'disabled' : '') + '>' + (hasSukunaFingers ? 'КУПЛЕНО' : 'КУПИТЬ') + '</button></div></div>'; 
        artHtml += '<div class="shop-item" style="padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><b>💉 ПРЕПАРАТ V</b><br><small style="color:#aaa;">Баффает героя: +20% урона, +30% HP.</small></div><div><span class="shop-price" style="color:#f5af19;margin-right:6px;">5000⭐</span><button class="btn" style="padding:4px 8px;" onclick="showCompoundVModal()">КУПИТЬ</button></div></div>'; 
        artHtml += '<div class="shop-item" style="padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><b>📓 ТЕТРАДЬ СМЕРТИ</b></div><div><input id="dnInput" type="number" min="1" style="width:50px;background:#000;color:white;border:2px solid #fff;padding:2px;text-align:center;font-size:9px;" value="' + (deathNoteTarget || '') + '" placeholder="ВОЛНА"><span class="shop-price" style="color:#f5af19;margin:0 6px;">500К⭐</span><button class="btn" style="padding:4px 8px;" onclick="buyDeathNote()">КУПИТЬ</button></div></div>'; 
        artHtml += '<div class="shop-item" style="padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><b>🔥 ОГОНЬ ДОМА</b></div><div><button class="btn use-artifact-btn" style="padding:4px 8px;" onclick="useFireArtifact()" ' + (hasFireArtifact ? '' : 'disabled') + '>' + (hasFireArtifact ? '🔥 ИСП.' : 'КУПИТЬ (100К)') + '</button></div></div>'; 
    } else { 
        artHtml = '<div class="shop-item"><div style="color:#888;text-align:center;width:100%;padding:10px;font-size:9px;">🔒 АРТЕФАКТЫ ОТКРОЮТСЯ ПОСЛЕ 4 РЕБИРТХА</div></div>'; 
    } 
    document.getElementById("artifactItems").innerHTML = artHtml; 
    renderBulkSell(); 
    renderAutoRest(); 
}

function renderActiveBuffs() { 
    let n = Date.now(), l = []; 
    for (let [id, exp] of Object.entries(activeBuffs)) { 
        if (exp > n) { 
            let r = exp - n, h = Math.floor(r / 3600000), m = Math.floor((r % 3600000) / 60000); 
            let name = id === "dmg13" ? "УРОН x1.3" : id === "doubleDamage" ? "УРОН x2" : id === "quadDamage" ? "УРОН x4" : id === "doubleStars" ? "ЗВЁЗДЫ x2" : id === "tripleHp" ? "HP x3" : id; 
            l.push('<span style="color:#f5af19;">' + name + '</span> (' + h + 'Ч ' + m + 'М)'); 
        } else delete activeBuffs[id]; 
    } 
    if (hasSukunaFingers) l.push('<span style="color:#f5af19;">🗿 ПАЛЬЦЫ СУКУНЫ</span>'); 
    if (deathNoteTarget) l.push('<span style="color:#f5af19;">📓 ПРОПУСК ВОЛНЫ ' + deathNoteTarget + '</span>'); 
    for (let name in hasCompoundV) { 
        if (hasCompoundV[name]) l.push('<span style="color:#f5af19;">💉 ПРЕПАРАТ V: ' + name + '</span>'); 
    } 
    document.getElementById("activeBuffs").innerHTML = l.length ? l.join("<br>") : "<span style='color:#888;font-size:9px;'>НЕТ АКТИВНЫХ БАФФОВ</span>"; 
}

function renderFreeSpins() { document.getElementById("freeSpinsCount").innerText = freeSpins; }

function renderBulkSell() { 
    let c = document.getElementById("bulkSellItems"); 
    if (rebirthCount < 1) { 
        c.innerHTML = '<div class="shop-item"><div style="color:#888;font-weight:bold;text-align:center;width:100%;padding:10px;font-size:9px;">🔒 АВТО-ПРОДАЖА ПОСЛЕ 1 РЕБИРТХА</div></div>'; 
        return; 
    } 
    c.innerHTML = bulkSellOptions.map(o => { 
        let cost = getAutoSellCost(o.rarity); 
        let pur = purchasedAutoSell[o.rarity] || false; 
        let act = autoSellSettings[o.rarity] || false; 
        let desc = !pur ? '<span style="color:#f5af19;">КУПИТЬ ЗА ' + cost + '⭐</span>' : (act ? '<span style="color:#2ecc71;">АКТИВНА</span>' : 'КУПЛЕНА'); 
        let btn; 
        if (!pur) { 
            btn = '<button class="btn btn-primary" style="padding:4px 8px;" onclick="purchaseAutoSell(\'' + o.rarity + '\')">КУПИТЬ</button>'; 
        } else if (act) { 
            btn = '<button class="btn" style="padding:4px 8px;border-color:#2ecc71 !important;" onclick="toggleAutoSell(\'' + o.rarity + '\')">ВЫКЛ</button>'; 
        } else { 
            btn = '<button class="btn" style="padding:4px 8px;" onclick="toggleAutoSell(\'' + o.rarity + '\')">ВКЛ ▶</button>'; 
        } 
        return '<div class="shop-item ' + (act ? 'auto-active' : '') + '" style="padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><strong>' + o.name + '</strong><br><small>' + desc + '</small></div><div>' + btn + '</div></div>'; 
    }).join(''); 
}

function renderAutoRest() { 
    let c = document.getElementById("autoRestItems"); 
    if (rebirthCount < 3) { 
        c.innerHTML = '<div class="shop-item"><div style="color:#888;font-weight:bold;text-align:center;width:100%;padding:10px;font-size:9px;">🔒 АВТО-ОТДЫХ ПОСЛЕ 3 РЕБИРТХА</div></div>'; 
        return; 
    } 
    c.innerHTML = autoRestOptions.map(o => { 
        let cost = getAutoRestCost(o.threshold); 
        let pur = autoRest.purchased && autoRest.threshold === o.threshold; 
        let act = autoRest.active && autoRest.threshold === o.threshold; 
        let desc = !pur ? '<span style="color:#f5af19;">КУПИТЬ ЗА ' + cost + '⭐</span>' : (act ? '<span style="color:#2ecc71;">АКТИВЕН</span>' : 'КУПЛЕН'); 
        let btn; 
        if (!pur) { 
            btn = '<button class="btn btn-primary" style="padding:4px 8px;" onclick="purchaseAutoRest(' + o.threshold + ')">КУПИТЬ</button>'; 
        } else if (act) { 
            btn = '<button class="btn" style="padding:4px 8px;border-color:#2ecc71 !important;" onclick="toggleAutoRest(' + o.threshold + ')">ВЫКЛ</button>'; 
        } else { 
            btn = '<button class="btn" style="padding:4px 8px;" onclick="toggleAutoRest(' + o.threshold + ')">ВКЛ ▶</button>'; 
        } 
        return '<div class="shop-item ' + (act ? 'auto-active' : '') + '" style="padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><strong>' + o.name + ' УСТАЛОСТИ</strong><br><small>' + desc + '</small></div><div>' + btn + '</div></div>'; 
    }).join(''); 
}

function renderUpgrades() { 
    let h = ""; 
    for (let [k, u] of Object.entries(upgrades)) { 
        let un = isUpgradeUnlocked(k), c = Math.floor(u.baseCost * (1 + u.level * 0.3)), cur = u.level * u.increment; 
        h += '<div class="upgrade-item ' + (un ? '' : 'locked') + '" style="padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div><strong>' + u.name + '</strong> (+' + cur.toFixed(1) + ')' + (un ? '' : '<br><span style="color:#e74c3c;">🔒 НУЖЕН УР. ' + u.reqLevel + '</span>') + '</div><div><span class="upgrade-price" style="color:#f5af19;margin-right:6px;">' + c + '⭐</span><button class="btn btn-primary" style="border-radius:0px !important;width:32px;height:32px;font-size:16px;padding:0;" onclick="buyUpgrade(\'' + k + '\')" ' + (un ? '' : 'disabled') + '>+</button></div></div>'; 
    } 
    document.getElementById("upgradeItems").innerHTML = h; 
}

function renderBook() { 
    let all = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))); 
    let ds = new Set(discoveredCards); 
    document.getElementById("bookList").innerHTML = all.map(t => { 
        let kn = ds.has(t.name); 
        let s = cardStats[t.rarity]; 
        let clickAction = (moderUnlocked && mode === 'moder') ? 'bookGet(\'' + t.rarity + '\',\'' + t.name.replace(/'/g, "\\'") + '\')' : 'bookInfoCard(\'' + t.rarity + '\',\'' + t.name.replace(/'/g, "\\'") + '\')'; 
        return '<div class="book-item ' + (kn ? '' : 'unknown-card') + '" style="padding:6px;margin-bottom:4px;font-size:9px;cursor:pointer;" onclick="' + clickAction + '"><div class="name">' + (kn ? t.name : '???') + '</div><div class="rarity-tag ' + rarityColors[t.rarity] + '">' + t.rarity + '</div><div style="font-size:8px;margin-top:2px;">💪' + (t.damage ?? s.damage) + ' ❤️' + (t.hp ?? s.hp) + '</div></div>'; 
    }).join(''); 
    document.getElementById("discoveredCount").innerText = discoveredCards.length; 
    document.getElementById("totalTemplatesCount").innerText = all.length; 
}

function bookInfoCard(rarity, name) { 
    let t = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))).find(t => t.name === name && t.rarity === rarity); 
    if (!t) return; 
    let s = cardStats[rarity]; 
    let info = '📄 ' + t.name + '\n\n'; 
    info += '⭐ РЕДКОСТЬ: ' + rarity + '\n'; 
    info += '🌌 ВСЕЛЕННАЯ: ' + (t.universe || 'НЕИЗВЕСТНО') + '\n'; 
    info += '💪 УРОН: ' + (t.damage ?? s.damage) + '\n'; 
    info += '❤️ ЗДОРОВЬЕ: ' + (t.hp ?? s.hp) + '\n'; 
    if (t.sellPrice) info += '💰 ЦЕНА ПРОДАЖИ: ' + t.sellPrice + '⭐\n'; 
    if (t.minRebirth) info += '🔒 МИН. РЕБИРТХ: ' + t.minRebirth + '\n'; 
    if (t.desc) { info += '\n📝 ОПИСАНИЕ:\n' + t.desc + '\n'; } 
    if (t.ability) { info += '\n✨ СПОСОБНОСТЬ: ' + t.ability.desc + '\n'; } 
    if (t.statusAbility) { info += '🌀 СТАТУС-ЭФФЕКТ: ' + t.statusAbility.desc + '\n'; } 
    if (t.unsellable) info += '\n🔒 НЕ ПРОДАЁТСЯ\n'; 
    showModal('📄 ИНФОРМАЦИЯ О КАРТЕ', info); 
}

window.bookGet = function(r, n) { 
    if (!moderUnlocked || mode !== 'moder') return; 
    let t = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))).find(t => t.name === n && t.rarity === r); 
    if (t) { 
        let s = cardStats[r]; 
        let c = { id: Date.now() + Math.random() * 10000, name: t.name, rarity: r, damage: t.damage ?? s.damage, hp: t.hp ?? s.hp, sellPrice: t.sellPrice ?? s.sellPrice, ability: t.ability || null, universe: t.universe || "?", unsellable: t.unsellable || false, minRebirth: t.minRebirth || 0, statusAbility: t.statusAbility || null, extraStatus: t.extraStatus || null }; 
        if (!discoveredCards.includes(t.name)) { discoveredCards.push(t.name); } 
        myCards.push(c); 
        saveAll(); 
        renderMyCards(); 
        sfxCardObtain(); 
        alert("🎴 ПОЛУЧЕНА КАРТА: " + t.name + " (" + r + ")"); 
    } 
};

function renderEvoTab() { 
    let c = document.getElementById("evoContent"); 
    if (rebirthCount < 5) { 
        c.innerHTML = "<div style='text-align:center;color:#888;font-size:10px;padding:15px;'>СДЕЛАЙТЕ 5 РЕБИРТХОВ.</div>"; 
        return; 
    } 
    let html = ""; 
    html += '<div class="evo-quest ' + (evoProgress.luffyKingUnlocked ? 'done' : '') + '" style="padding:8px;margin-bottom:6px;font-size:9px;"><b>👑 ЛУФФИ : КОРОЛЬ ПИРАТОВ</b><br>Пощадите Короля Пиратов на 500 волне.<br><b>СТАТУС:</b> ' + (evoProgress.luffyKingUnlocked ? '✅' : '❌') + '</div>'; 
    html += '<div class="evo-quest ' + (evoProgress.sgUnlocked ? 'done' : '') + '" style="padding:8px;margin-bottom:6px;font-size:9px;"><b>👊 САЙТАМА/ГАРОУ</b><br>20000 волн.<br>' + evoProgress.wavesSaitamaGarou + '/20000<br><b>СТАТУС:</b> ' + (evoProgress.sgUnlocked ? '✅' : 'В ПРОЦЕССЕ') + '</div>'; 
    html += '<div class="evo-quest ' + (evoProgress.gkUnlocked ? 'done' : '') + '" style="padding:8px;margin-bottom:6px;font-size:9px;"><b>❄️ ГАРП/КУДЗАН</b><br>100000 урона.<br>' + Math.floor(evoProgress.damageGarpKuzan) + '/100000</div>'; 
    html += '<div class="evo-quest ' + (evoProgress.sevenUnlocked ? 'done' : '') + '" style="padding:8px;margin-bottom:6px;font-size:9px;"><b>🦸 СЕМЁРКА</b><br>20 ур. Семёрка + V.<br><b>СТАТУС:</b> ' + (evoProgress.sevenUnlocked ? '✅' : '❌') + '</div>'; 
    html += '<div class="evo-quest ' + (evoProgress.williamUnlocked ? 'done' : '') + '" style="padding:8px;margin-bottom:6px;font-size:9px;"><b>💀 УИЛЬЯМ ФРЭНСИС</b><br>500 волна, только обычные карты.<br><b>СТАТУС:</b> ' + (evoProgress.williamUnlocked ? '✅' : '❌') + '</div>'; 
    c.innerHTML = html; 
}

function renderRebirthInfo() { 
    let req = getRebirthRequirement(); 
    let world = getWorldForWave(highestCheckpoint); 
    document.getElementById("rebirthInfo").innerHTML = '<div style="background:rgba(0,0,0,0.7);padding:12px;border:3px solid #fff;font-size:9px;line-height:1.4;"><div>ТЕКУЩИЙ РЕБИРТХ: <b>' + rebirthCount + '</b></div><div>МНОЖИТЕЛЬ: <b>x' + getRebirthMult().toFixed(1) + '</b></div><div>ТЕКУЩИЙ МИР: <b style="color:' + world.color + ';">' + world.name + '</b></div><div>ТРЕБУЕТСЯ ВОЛН: <b>' + req + '</b> (ПРОЙДЕНО ' + highestCheckpoint + ')</div></div>'; 
    document.getElementById("doRebirthBtn").disabled = highestCheckpoint < req; 
}

function renderRebirthStats() { 
    let c = document.getElementById("rebirthStatsList"); 
    if (!rebirthStats.length) { 
        c.innerHTML = "<div style='color:#888;text-align:center;font-size:9px;padding:10px;'>НЕТ ДАННЫХ</div>"; 
        return; 
    } 
    c.innerHTML = rebirthStats.map(s => '<div class="shop-item" style="padding:8px;margin-bottom:6px;font-size:9px;line-height:1.3;"><div><b>РЕБИРТХ ' + s.rebirth + '</b></div><div style="color:#aaa;margin-top:2px;">🌊 ВОЛНА: ' + s.highestWave + '<br>🌍 МИР: ' + (s.world || 'Лес начала') + '<br>📊 УР: ' + s.playerLevel + '<br>👆 КЛИКОВ: ' + (s.totalClicks || 0) + '<br>⭐ МАКС. ЗВЁЗД: ' + (s.maxPoints || 0) + '<br>🃏 КАРТ: ' + s.totalCards + '</div></div>').join(''); 
}

function renderGlobalStats() { 
    let el = document.getElementById("globalStats"); 
    if (!el) return; 
    el.innerHTML = '<div style="font-size:9px;line-height:1.5;">' +
        '<div>👆 ВСЕГО КЛИКОВ: <b>' + totalClicks + '</b></div>' + 
        '<div>🃏 ВСЕГО КАРТ ПОЛУЧЕНО: <b>' + totalCardsObtained + '</b></div>' + 
        '<div>⭐ МАКСИМУМ ЗВЁЗД: <b>' + maxPoints + '</b></div>' + 
        '<div>🌊 ТЕКУЩАЯ ВОЛНА: <b>' + wave + '</b></div>' + 
        '<div>💀 ВСЕГО ПОРАЖЕНИЙ: <b>' + defeatHistory.length + '</b></div>' + 
        '<div>🏆 ВСЕГО ПОБЕД: <b>' + totalWins + '</b></div>' + 
        '<div>🔄 РЕБИРТХОВ: <b>' + rebirthCount + '</b></div>' + 
        (gameCompleted ? '<div style="color:#f5af19;margin-top:5px;font-size:11px;animation:pulse-effect 0.5s infinite alternate;">🏆 <b>ИГРА ПРОЙДЕНА!</b></div>' : '') + '</div>'; 
}

function renderModerControls() { 
    let el = document.getElementById("moderControls"); 
    if (!el) return; 
    if (moderUnlocked && mode === "moder") { el.style.display = "block"; } else { el.style.display = "none"; } 
}

function renderCheckpoints() { 
    let c = document.getElementById("checkpointList"); 
    let html = ''; 
    let maxCp = Math.max(highestCheckpoint, Math.floor(wave / 50) * 50); 
    for (let cp = 50; cp <= maxCp; cp += 50) { 
        let unlocked = cp <= highestCheckpoint; 
        html += '<div class="checkpoint-item" style="opacity:' + (unlocked ? '1' : '0.5') + ';padding:8px;margin-bottom:6px;font-size:9px;display:flex;justify-content:space-between;align-items:center;"><div>🚩 ВОЛНА ' + cp + (unlocked ? '' : ' 🔒') + '</div><button class="btn ' + (activeCheckpoint === cp ? 'auto-active' : '') + '" style="padding:4px 8px;' + (activeCheckpoint === cp ? 'border-color:#2ecc71 !important;' : '') + '" onclick="toggleCheckpoint(' + cp + ')" ' + (unlocked ? '' : 'disabled') + '>' + (activeCheckpoint === cp ? 'ВЫБРАНО ✅' : 'ВЫБРАТЬ ▶') + '</button></div>'; 
    } 
    c.innerHTML = html || "<div style='text-align:center;padding:15px;color:#888;font-size:9px;'>ДОЙДИТЕ ДО 50 ВОЛНЫ</div>"; 
}

// ========== РЕНДЕР ГАЧА-КРУТОК ==========
function renderGachaTab() {
    let container = document.getElementById("gachaItems");
    if (!container) return;
    if (typeof checkGachaReset === 'function') checkGachaReset();
    let html = '';
    let types = [
        { id: "common", name: "ОБЫЧНАЯ", icon: "⚪", color: "#6c757d", minRarity: "Обычная", maxRarity: "Мифическая", maxChance: 1 },
        { id: "rare", name: "РЕДКАЯ", icon: "🔵", color: "#17a2b8", minRarity: "Обычная", maxRarity: "Мифическая", maxChance: 3 },
        { id: "superRare", name: "СВЕРХРЕДКАЯ", icon: "🟢", color: "#28a745", minRarity: "Редкая", maxRarity: "Легендарная", maxChance: 2 },
        { id: "epic", name: "ЭПИЧЕСКАЯ", icon: "🟣", color: "#9b59b6", minRarity: "Сверх редкая", maxRarity: "Секретная", maxChance: 0.2 },
        { id: "mythic", name: "МИФИЧЕСКАЯ", icon: "🔴", color: "#e74c3c", minRarity: "Эпик", maxRarity: "Секретная", maxChance: 0.8 }
    ];
    types.forEach(t => {
        let bought = (typeof gachaDailyLimits !== 'undefined' && gachaDailyLimits[t.id]) || 0;
        let max = (typeof gachaDailyMax !== 'undefined' && gachaDailyMax[t.id]) || 0;
        let canBuy = (typeof mode !== 'undefined' && mode === "moder") || (bought < max && (typeof points !== 'undefined' && points >= (typeof gachaPrices !== 'undefined' ? gachaPrices[t.id] : 0)));
        let displayPrice = (typeof mode !== 'undefined' && mode === "moder") ? "∞ БЕСПЛАТНО" : ((typeof gachaPrices !== 'undefined' ? gachaPrices[t.id] : 0) + "⭐");
        html += '<div class="shop-item gacha-item" style="border-left: 6px solid ' + t.color + ' !important; padding:8px; margin-bottom:6px; font-size:9px; display:flex; justify-content:space-between; align-items:center;">';
        html += '<div><strong>' + t.icon + ' ' + t.name + '</strong>';
        html += '<br><small style="color:#aaa;">' + displayPrice + ' | ' + bought + '/' + max + ' СЕГОДНЯ</small>';
        html += '<br><small style="color:#666; font-size:8px;">МИН: ' + t.minRarity + ' | МАКС: ' + t.maxRarity + ' (' + t.maxChance + '%)</small></div>';
        html += '<button class="btn btn-primary gacha-btn" onclick="performGacha(\'' + t.id + '\')" ' + (!canBuy ? 'disabled' : '') + '>КРУТИТЬ</button>';
        html += '</div>';
    });
    if ((typeof legendaryGachaTokens !== 'undefined' && legendaryGachaTokens > 0) || (typeof mode !== 'undefined' && mode === "moder")) {
        let canBuy = (typeof mode !== 'undefined' && mode === "moder") || ((typeof legendaryGachaTokens !== 'undefined' && legendaryGachaTokens > 0) && (typeof points !== 'undefined' && points >= (typeof gachaPrices !== 'undefined' ? gachaPrices.legendary : 0)));
        let displayPrice = (typeof mode !== 'undefined' && mode === "moder") ? "∞ БЕСПЛАТНО" : ((typeof gachaPrices !== 'undefined' ? gachaPrices.legendary : 0) + "⭐");
        let tokenDisplay = (typeof mode !== 'undefined' && mode === "moder") ? "∞" : (typeof legendaryGachaTokens !== 'undefined' ? legendaryGachaTokens : 0);
        html += '<div class="shop-item gacha-item legendary-gacha" style="border-left: 6px solid #ffd700 !important; background: rgba(255,215,0,0.1) !important; padding:8px; margin-bottom:6px; font-size:9px; display:flex; justify-content:space-between; align-items:center;">';
        html += '<div><strong>🟡 ЛЕГЕНДАРНАЯ</strong>';
        html += '<br><small style="color:#aaa;">' + displayPrice + ' | ТОКЕНЫ: ' + tokenDisplay + '</small>';
        html += '<br><small style="color:#666; font-size:8px;">МИН: Мифическая | МАКС: Секретная (2%)</small></div>';
        html += '<button class="btn btn-primary gacha-btn legendary-btn" style="background:#ffd700 !important; color:#000 !important; border-color:#fff !important;" onclick="performGacha(\'legendary\')" ' + (!canBuy ? 'disabled' : '') + '>КРУТИТЬ</button>';
        html += '</div>';
    }
    if ((typeof secretGachaTokens !== 'undefined' && secretGachaTokens > 0) || (typeof mode !== 'undefined' && mode === "moder")) {
        let canBuy = (typeof mode !== 'undefined' && mode === "moder") || ((typeof secretGachaTokens !== 'undefined' && secretGachaTokens > 0) && (typeof points !== 'undefined' && points >= (typeof gachaPrices !== 'undefined' ? gachaPrices.secret : 0)));
        let displayPrice = (typeof mode !== 'undefined' && mode === "moder") ? "∞ БЕСПЛАТНО" : ((typeof gachaPrices !== 'undefined' ? gachaPrices.secret : 0) + "⭐");
        let tokenDisplay = (typeof mode !== 'undefined' && mode === "moder") ? "∞" : (typeof secretGachaTokens !== 'undefined' ? secretGachaTokens : 0);
        html += '<div class="shop-item gacha-item secret-gacha" style="border-left: 6px solid #ff00ff !important; background: rgba(255,0,255,0.1) !important; padding:8px; margin-bottom:6px; font-size:9px; display:flex; justify-content:space-between; align-items:center;">';
        html += '<div><strong>🟣 СЕКРЕТНАЯ</strong>';
        html += '<br><small style="color:#aaa;">' + displayPrice + ' | ТОКЕНЫ: ' + tokenDisplay + '</small>';
        html += '<br><small style="color:#666; font-size:8px;">Легендарная (80%) | Секретная (20%)</small></div>';
        html += '<button class="btn btn-primary gacha-btn secret-btn" style="background:#ff00ff !important; color:#fff !important; border-color:#fff !important;" onclick="performGacha(\'secret\')" ' + (!canBuy ? 'disabled' : '') + '>КРУТИТЬ</button>';
        html += '</div>';
    }
    if (!html) html = '<div style="text-align:center;color:#888;padding:20px;font-size:9px;font-weight:bold;">🔒 ПОБЕДИТЕ НОВОГО БОССА (КАЖДЫЕ 50 ВОЛН) ЧТОБЫ ОТКРЫТЬ ЛЕГЕНДАРНЫЕ И СЕКРЕТНЫЕ КРУТКИ!</div>';
    container.innerHTML = html;
}

// ========== АНИМАЦИЯ ГАЧА-КРУТКИ (CS:GO STYLE) ==========
window._gachaAnimFrame = null;
window._gachaStripX = 0;
window._gachaSpeed = 0;

window._startGachaOverlay = function(animData) {
    if (!animData || !animData.cards) return;
    let overlay = document.getElementById("gachaOverlay");
    if (!overlay) return;
    let strip = document.getElementById("gachaStrip");
    if (strip) {
        strip.innerHTML = animData.cards.map(card => {
            let rarityColor = typeof getRarityColor === 'function' ? getRarityColor(card.rarity) : "#fff";
            let showImage = ["Эволюционная", "Секретная", "Легендарная"].includes(card.rarity);
            let cardImg = showImage && typeof getCardImage === 'function' ? getCardImage(card.name) : null;
            let imgHTML = cardImg ? '<img src="' + cardImg + '" style="width:60px;height:60px;border-radius:0px;object-fit:cover;margin-bottom:4px;border:1px solid #fff;">' : '<div style="width:60px;height:60px;border-radius:0px;background:#111;border:2px dashed #fff;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:20px;">🎴</div>';
            return '<div style="min-width:150px;text-align:center;background:#000;border-radius:0px;padding:15px 10px;border:3px solid ' + rarityColor + ';box-shadow: 4px 4px 0px #222;">' +
                imgHTML + '<div style="font-weight:900;font-size:9px;color:' + rarityColor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (typeof escapeHtml === 'function' ? escapeHtml(card.name) : card.name) + '</div>' +
                '<div style="font-size:8px;margin-top:4px;color:#aaa;">' + card.rarity + '</div><div style="font-size:8px;margin-top:2px;">💪' + card.damage + ' ❤️' + card.hp + '</div></div>';
        }).join('');
        strip.style.display = "flex"; strip.style.transition = "none"; strip.style.transform = "translateX(0px)";
    }
    document.getElementById("gachaResultCard").style.display = "none";
    document.getElementById("gachaSkipBtn").style.display = "block";
    document.getElementById("gachaSkipBtn").onclick = window._skipGachaAnimation;
    overlay.style.display = "flex";
    window._gachaStripX = 0; window._gachaSpeed = 25;
    if (window._gachaAnimFrame) cancelAnimationFrame(window._gachaAnimFrame);
    window._gachaAnimFrame = requestAnimationFrame(window._renderGachaAnimation);
};

window._hideGachaOverlay = function() {
    let overlay = document.getElementById("gachaOverlay");
    if (overlay) overlay.style.display = "none";
    if (window._gachaAnimFrame) { cancelAnimationFrame(window._gachaAnimFrame); window._gachaAnimFrame = null; }
    window.gachaAnimationActive = false;
    window.gachaAnimationData = null;
};

window._skipGachaAnimation = function() {
    if (!window.gachaAnimationActive || !window.gachaAnimationData) return;
    let card = window.gachaAnimationData.resultCard;
    document.getElementById("gachaSkipBtn").style.display = "none";
    document.getElementById("gachaStrip").style.display = "none";
    let resultDiv = document.getElementById("gachaResultCard");
    resultDiv.style.display = "flex";
    resultDiv.style.borderRadius = "0px";
    resultDiv.style.border = "3px solid #fff";
    resultDiv.style.background = "#000";
    resultDiv.style.padding = "20px";
    resultDiv.innerHTML = '<div style="text-align:center;font-size:40px;">🎴</div><div style="font-size:16px;font-weight:900;margin-top:10px;text-transform:uppercase;">' + card.name + '</div><div style="font-size:10px;color:#f5af19;margin-top:5px;">' + card.rarity + '</div>';
    if (typeof sfxCardObtain === 'function') sfxCardObtain();
    setTimeout(() => window._hideGachaOverlay(), 2000);
};

window._renderGachaAnimation = function(timestamp) {
    if (!window.gachaAnimationActive || !window.gachaAnimationData) { window._hideGachaOverlay(); return; }
    let elapsed = timestamp - window.gachaAnimationData.startTime;
    let totalDuration = window.gachaAnimationData.duration;
    let strip = document.getElementById("gachaStrip");
    if (!strip) { window._hideGachaOverlay(); return; }
    let progress = Math.min(1, elapsed / totalDuration);
    if (progress < 0.8) {
        window._gachaStripX -= window._gachaSpeed;
        window._gachaSpeed += 0.3;
        strip.style.transform = "translateX(" + window._gachaStripX + "px)";
        strip.style.transition = "none";
    } else if (progress < 0.95) {
        window._gachaSpeed *= 0.9;
        window._gachaStripX -= window._gachaSpeed;
        strip.style.transform = "translateX(" + window._gachaStripX + "px)";
        strip.style.transition = "none";
    } else {
        let targetX = -(window.gachaAnimationData.resultIndex * 160 + 80);
        strip.style.transition = "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)";
        strip.style.transform = "translateX(" + targetX + "px)";
        setTimeout(() => {
            document.getElementById("gachaSkipBtn").style.display = "none";
            if (strip) strip.style.display = "none";
            let resultDiv = document.getElementById("gachaResultCard");
            if (resultDiv) {
                resultDiv.style.display = "flex";
                resultDiv.style.borderRadius = "0px";
                resultDiv.style.border = "3px solid #fff";
                resultDiv.style.background = "#000";
                resultDiv.style.padding = "20px";
                let card = window.gachaAnimationData.resultCard;
                resultDiv.innerHTML = '<div style="text-align:center;font-size:40px;">🎴</div><div style="font-size:14px;font-weight:900;margin-top:10px;text-transform:uppercase;">' + card.name + '</div><div style="font-size:10px;color:#f5af19;margin-top:5px;">' + card.rarity + '</div>';
            }
            if (typeof sfxCardObtain === 'function') sfxCardObtain();
            setTimeout(() => window._hideGachaOverlay(), 2500);
        }, 600);
        if (window._gachaAnimFrame) cancelAnimationFrame(window._gachaAnimFrame);
        window._gachaAnimFrame = null;
        return;
    }
    window._gachaAnimFrame = requestAnimationFrame(window._renderGachaAnimation);
};

function renderAll() { 
    renderMyCards(); 
    renderTeam(); 
    renderAfkTeam(); 
    renderEnemy(); 
    renderPoints(); 
    renderShop(); 
    renderUpgrades(); 
    renderActiveBuffs(); 
    renderDefeatHistory(); 
    renderFreeSpins(); 
    renderAchievements(); 
    renderChallenges(); 
    renderBook(); 
    renderCheckpoints(); 
    renderRebirthInfo(); 
    renderRebirthStats(); 
    renderEvoTab(); 
    renderGlobalStats(); 
    renderModerControls(); 
    if (typeof renderGachaTab === 'function') renderGachaTab(); 
    updatePlayerStats(); 
    updateStatusDisplay(); 
}
