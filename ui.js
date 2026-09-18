// ========== ОТРИСОВКА КАРТОЧЕК ==========
function renderMyCards() { 
    let c = document.getElementById("collectionGrid"); 
    let totalEl = document.getElementById("totalCards");
    let shownEl = document.getElementById("shownCards");
    if (totalEl) totalEl.innerText = myCards.length; 
    if (!myCards.length) { 
        c.innerHTML = "<div style='width:100%;text-align:center;padding:20px;color:#888;'>Нет карт</div>"; 
        if (shownEl) shownEl.innerText = 0;
        return; 
    } 
    
    // ★ ФИЛЬТРАЦИЯ И СОРТИРОВКА (фича #7) ★
    let filtered = myCards.map((cd, idx) => ({ cd, idx }));
    if (typeof cardFilter !== 'undefined') {
        if (cardFilter.search) {
            filtered = filtered.filter(item => item.cd.name.toLowerCase().includes(cardFilter.search));
        }
        if (cardFilter.rarity && cardFilter.rarity !== 'all') {
            filtered = filtered.filter(item => item.cd.rarity === cardFilter.rarity);
        }
        if (cardFilter.sort !== 'default') {
            filtered.sort((a, b) => {
                let ca = a.cd, cb = b.cd;
                switch(cardFilter.sort) {
                    case 'dmg_desc': return cb.damage - ca.damage;
                    case 'dmg_asc': return ca.damage - cb.damage;
                    case 'hp_desc': return cb.hp - ca.hp;
                    case 'speed_desc': return (cb.speed || 0.5) - (ca.speed || 0.5);
                    case 'rarity_desc': {
                        let order = ["Обычная","Редкая","Сверх редкая","Эпик","Мифическая","Легендарная","Секретная","Эволюционная","Босс"];
                        return order.indexOf(cb.rarity) - order.indexOf(ca.rarity);
                    }
                    case 'mastery_desc': return (cb.mastery || 1) - (ca.mastery || 1);
                    case 'name_asc': return ca.name.localeCompare(cb.name);
                    default: return 0;
                }
            });
        }
    }
    
    if (shownEl) shownEl.innerText = filtered.length;
    
    if (filtered.length === 0) {
        c.innerHTML = "<div style='width:100%;text-align:center;padding:20px;color:#888;'>🔍 Ничего не найдено</div>";
        return;
    }
    
    c.innerHTML = filtered.map(({ cd, idx }) => { 
        let isSeven = cd.name === "Семёрка"; 
        let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); 
        let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); 
        let skFinger = hasSukunaFingers && sukunaTarget && sukunaExpireTime > Date.now() && cd.name === sukunaTarget; 
        let dmgMult = 1; 
        if (cd.ability?.type === 'scaleWithWins' && (typeof hasMasteryAbility === 'function' ? hasMasteryAbility(cd) : true)) dmgMult *= (1 + totalWins * cd.ability.value); 
        if (cd.statusAbility?.type === 'scaleWithWins' && (typeof hasMasteryStatus === 'function' ? hasMasteryStatus(cd) : true)) dmgMult *= (1 + totalWins * cd.statusAbility.value); 
        let masteryMult = typeof getMasteryMult === 'function' ? getMasteryMult(cd) : 1;
        let dmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1) * masteryMult); 
        let hp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1) * masteryMult); 
        let showImage = ["Эволюционная", "Секретная", "Легендарная"].includes(cd.rarity); 
        let cardImg = showImage ? getCardImage(cd.name) : null; 
        let imgHTML = cardImg ? '<img src="' + cardImg + '" class="card-image">' : ''; 
        let superHTML = '';
        if (cd.superAbility && (typeof hasMasterySuper === 'function' ? hasMasterySuper(cd) : true)) {
            superHTML = '<div style="font-size:9px;color:#ffd700;font-weight:bold;margin-top:3px;text-align:center;line-height:1.2;background:rgba(0,0,0,0.3);border-radius:8px;padding:2px 4px;">' + cd.superAbility.name + '</div>';
        }
        let sukunaIndicator = skFinger ? '<div style="font-size:9px;color:#ff4444;font-weight:bold;margin-top:2px;">🗿 Сукуна</div>' : '';
        let masteryHTML = typeof getMasteryHTML === 'function' ? getMasteryHTML(cd) : '';
        return '<div class="card-item ' + (team.includes(idx) ? 'team-selected' : '') + ' ' + (afkTeam.includes(idx) ? 'afk-selected' : '') + '" onclick="toggleTeam(' + idx + ')">' 
            + imgHTML 
            + '<div class="card-name">' + escapeHtml(cd.name) + '</div>' 
            + '<div class="rarity-tag ' + rarityColors[cd.rarity] + '">' + cd.rarity + '</div>' 
            + '<div class="card-stats">💪' + dmg + ' ❤️' + hp + ' ⚡' + (cd.speed || 0.5).toFixed(1) + '</div>' 
            + superHTML 
            + sukunaIndicator 
            + masteryHTML 
            + (cd.ability ? '<div style="font-size:10px;color:#f5af19;font-weight:bold;margin-top:2px;">✨ ' + cd.ability.desc + '</div>' : '') 
            + (cd.statusAbility ? '<div style="font-size:9px;color:#f5af19;margin-top:2px;">' + cd.statusAbility.desc + '</div>' : '') 
            + '<div style="display:flex;gap:4px;justify-content:center;margin-top:6px;flex-wrap:wrap;">' 
            + '<div class="remove-icon" onclick="event.stopPropagation();showMasteryModal(' + idx + ')" style="background:#ffd700;color:#000;">⭐</div>' 
            + '<div class="remove-icon" onclick="event.stopPropagation();toggleTeam(' + idx + ')" style="background:#f5af19;color:#000;">⚔️</div>' 
            + '<div class="remove-icon" onclick="event.stopPropagation();toggleAfk(' + idx + ')" style="background:#2ecc71;color:#000;">💤</div>' 
            + (!cd.unsellable ? '<div class="remove-icon" onclick="event.stopPropagation();sellCard(' + idx + ')">💰</div>' : '') 
            + '</div></div>'; 
    }).join(''); 
}

function renderTeam() { 
    let c = document.getElementById("teamList"), d = 0, h = 0, html = ""; 
    if (!team.length) { c.innerHTML = "<div style='padding:10px;text-align:center;color:#888;'>Пусто</div>"; 
        document.getElementById("totalDamage").innerText = 0; 
        document.getElementById("totalHpBonus").innerText = 0; 
        window.teamDamage = 0; window.teamHpBonus = 0; 
        if (typeof renderTeamPresets === 'function') renderTeamPresets();
        return; 
    } 
    team.forEach((idx, s) => { 
        let cd = myCards[idx]; 
        if (!cd) return; 
        let isMain = (s === mainCardIndex);
        let isSeven = cd.name === "Семёрка"; 
        let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); 
        let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); 
        let skFinger = hasSukunaFingers && sukunaTarget && sukunaExpireTime > Date.now() && cd.name === sukunaTarget; 
        let dmgMult = 1; 
        if (cd.ability?.type === 'scaleWithWins' && (typeof hasMasteryAbility === 'function' ? hasMasteryAbility(cd) : true)) dmgMult *= (1 + totalWins * cd.ability.value); 
        if (cd.statusAbility?.type === 'scaleWithWins' && (typeof hasMasteryStatus === 'function' ? hasMasteryStatus(cd) : true)) dmgMult *= (1 + totalWins * cd.statusAbility.value); 
        let masteryMult = typeof getMasteryMult === 'function' ? getMasteryMult(cd) : 1;
        let cDmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1) * masteryMult); 
        let cHp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1) * masteryMult); 
        let cSpd = cd.speed || 0.5;
        if (cd.ability?.type === 'copyEnemyChance' && currentEnemy && Math.random() < cd.ability.chance && (typeof hasMasteryAbility === 'function' ? hasMasteryAbility(cd) : true)) { 
            cDmg = currentEnemy.damage; cHp = currentEnemy.hp; 
        } 
        d += cDmg; h += cHp; 
        let superInfo = '';
        if (cd.superAbility && (typeof hasMasterySuper === 'function' ? hasMasterySuper(cd) : true)) {
            superInfo = '<div style="font-size:10px;color:#ffd700;margin-top:2px;font-weight:bold;">' + cd.superAbility.name + '</div>';
        }
        let sukunaTag = skFinger ? ' <span style="color:#ff4444;font-size:10px;">🗿</span>' : '';
        let lvl = cd.mastery || 1;
        let mStars = "";
        for (let i = 1; i <= 5; i++) mStars += (i <= lvl ? "★" : "☆");
        let masteryTeam = '<div style="font-size:9px;color:' + (lvl >= 5 ? "#ffd700" : lvl >= 4 ? "#e056fd" : lvl >= 3 ? "#9b59b6" : lvl >= 2 ? "#3498db" : "#95a5a6") + ';font-weight:bold;margin-top:2px;">' + mStars + '</div>';
        let expTeam = '';
        if (lvl < 5 && typeof getMasteryExpNeeded === 'function') {
            let expNeeded = getMasteryExpNeeded(cd, lvl + 1);
            let currentExp = cd.masteryExp || 0;
            let expPct = Math.min(100, (currentExp / expNeeded) * 100);
            expTeam = '<div style="margin-top:3px;"><div style="font-size:8px;color:#00d4ff;font-weight:bold;">📊 ' + Math.floor(currentExp) + '/' + expNeeded + '</div><div style="background:rgba(0,0,0,0.5);border-radius:4px;height:3px;margin-top:1px;overflow:hidden;"><div style="width:' + expPct + '%;height:100%;background:linear-gradient(90deg, #00d4ff, #0099ff);"></div></div></div>';
        }
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,0,0,0.3);border:2px solid ' + (isMain ? '#f5af19' : (skFinger ? '#ff4444' : 'rgba(255,255,255,0.08)')) + ';border-radius:12px;margin-bottom:6px;' + (isMain ? 'box-shadow: 0 0 12px rgba(245,175,25,0.4);' : (skFinger ? 'box-shadow: 0 0 12px rgba(255,68,68,0.3);' : '')) + '">' +
            '<div style="flex:1;">' +
                '<span style="font-weight:800;">' + (isMain ? '👑 ' : '') + escapeHtml(cd.name) + sukunaTag + '</span>' +
                '<span style="font-size:12px;margin-left:8px;">💪' + cDmg + ' ❤️' + cHp + ' ⚡' + cSpd.toFixed(1) + '</span>' +
                superInfo +
                masteryTeam +
                expTeam +
            '</div>' +
            '<div style="display:flex;gap:4px;align-items:center;">' +
                (isMain ? '<span style="font-size:10px;color:#f5af19;font-weight:bold;">ГЛАВНЫЙ</span>' : '<button class="btn" style="padding:3px 8px;font-size:10px;background:rgba(245,175,25,0.3);border:1px solid #f5af19;color:#f5af19;border-radius:15px;" onclick="event.stopPropagation();setMainCard(' + s + ')">👑</button>') +
                '<button class="btn" style="padding:4px 10px;background:rgba(231,76,60,0.8);border:none;font-size:11px;" onclick="event.stopPropagation();team.splice(' + s + ',1);normalizeMainCard();renderAll();updatePlayerStats();">✕</button>' +
            '</div>' +
        '</div>'; 
    }); 
    c.innerHTML = html; 
    document.getElementById("totalDamage").innerText = d; 
    document.getElementById("totalHpBonus").innerText = h; 
    window.teamDamage = d; window.teamHpBonus = h; 
    
    if (team.length > 0 && mainCardIndex >= 0 && mainCardIndex < team.length) {
        let mainCard = myCards[team[mainCardIndex]];
        if (mainCard) {
            let mainSpeed = mainCard.speed || 0.5;
            let speedDiv = document.getElementById("mainCardSpeedDisplay");
            if (!speedDiv) {
                speedDiv = document.createElement("div");
                speedDiv.id = "mainCardSpeedDisplay";
                speedDiv.style.cssText = "margin-top:8px;padding:8px 12px;background:rgba(245,175,25,0.15);border:1px solid rgba(245,175,25,0.3);border-radius:10px;font-size:12px;font-weight:bold;text-align:center;";
                c.appendChild(speedDiv);
            }
            speedDiv.innerHTML = '👑 Главный: <span style="color:#f5af19;">' + escapeHtml(mainCard.name) + '</span> | ⚡ Скорость на арене: <span style="color:#f5af19;">' + mainSpeed.toFixed(1) + '</span>';
        }
    }
    // ★ ОБНОВЛЯЕМ ПРЕСЕТЫ (фича #8) ★
    if (typeof renderTeamPresets === 'function') renderTeamPresets();
}

// ★ РЕНДЕР ПРЕСЕТОВ ОТРЯДОВ (фича #8) ★
function renderTeamPresets() {
    let c = document.getElementById("teamPresetsList");
    if (!c) return;
    if (typeof teamPresets === 'undefined') { c.innerHTML = ''; return; }
    let html = '';
    for (let i = 0; i < 5; i++) {
        let p = teamPresets[i];
        if (!p) continue;
        let isEmpty = !p.team || p.team.length === 0;
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:rgba(0,0,0,0.4);border-radius:10px;margin-bottom:5px;gap:6px;flex-wrap:wrap;border:1px solid rgba(255,255,255,0.05);">';
        html += '<div style="flex:1;min-width:100px;cursor:pointer;" onclick="renameTeamPreset(' + i + ')" title="Переименовать">';
        html += '<div style="font-weight:800;font-size:12px;">' + (isEmpty ? '⬜' : '✅') + ' ' + escapeHtml(p.name) + '</div>';
        html += '<div style="font-size:10px;color:#aaa;">' + (isEmpty ? 'Пусто' : p.team.length + ' карт') + '</div>';
        html += '</div>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<button class="btn" style="padding:4px 9px;font-size:11px;background:#2ecc71;color:#fff;border:none;" onclick="saveTeamPreset(' + i + ')" title="Сохранить">💾</button>';
        html += '<button class="btn" style="padding:4px 9px;font-size:11px;background:#3498db;color:#fff;border:none;" onclick="loadTeamPreset(' + i + ')" ' + (isEmpty ? 'disabled style="opacity:0.4;"' : '') + ' title="Загрузить">📥</button>';
        html += '<button class="btn" style="padding:4px 9px;font-size:11px;background:#e74c3c;color:#fff;border:none;" onclick="deleteTeamPreset(' + i + ')" ' + (isEmpty ? 'disabled style="opacity:0.4;"' : '') + ' title="Удалить">🗑️</button>';
        html += '</div>';
        html += '</div>';
    }
    c.innerHTML = html;
}
window.renderTeamPresets = renderTeamPresets;

function renderAfkTeam() { 
    let c = document.getElementById("afkTeamList"), d = 0, h = 0, html = ""; 
    if (!afkTeam.length) { c.innerHTML = "<div style='padding:10px;text-align:center;color:#888;'>Пусто</div>"; return; } 
    afkTeam.forEach((idx, s) => { 
        let cd = myCards[idx]; 
        if (!cd) return; 
        let isSeven = cd.name === "Семёрка"; 
        let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); 
        let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); 
        let skFinger = hasSukunaFingers && sukunaTarget && sukunaExpireTime > Date.now() && cd.name === sukunaTarget; 
        let dmgMult = 1; 
        if (cd.ability?.type === 'scaleWithWins' && (typeof hasMasteryAbility === 'function' ? hasMasteryAbility(cd) : true)) dmgMult *= (1 + totalWins * cd.ability.value); 
        if (cd.statusAbility?.type === 'scaleWithWins' && (typeof hasMasteryStatus === 'function' ? hasMasteryStatus(cd) : true)) dmgMult *= (1 + totalWins * cd.statusAbility.value); 
        let masteryMult = typeof getMasteryMult === 'function' ? getMasteryMult(cd) : 1; 
        let cDmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1) * masteryMult); 
        let cHp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1) * masteryMult); 
        d += cDmg; h += cHp; 
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.05);border-radius:12px;margin-bottom:6px;"><span style="font-weight:800;">' + escapeHtml(cd.name) + (skFinger ? ' 🗿' : '') + '</span><span>💪' + Math.floor(cDmg * 0.8) + ' ❤️' + Math.floor(cHp * 0.8) + '</span><button class="btn" style="padding:4px 10px;background:rgba(231,76,60,0.8);border:none;" onclick="afkTeam.splice(' + s + ',1);renderAll();">X</button></div>'; 
    }); 
    c.innerHTML = html; 
    document.getElementById("afkTotalDamage").innerText = Math.floor(d * 0.8); 
    document.getElementById("afkTotalHpBonus").innerText = Math.floor(h * 0.8); 
    window.afkTeamDamage = Math.floor(d * 0.8); 
    window.afkTeamHpBonus = Math.floor(h * 0.8); 
}

function renderEnemy() { if (!currentEnemy) generateEnemy(); let p = (currentEnemy.hp / currentEnemy.maxHp) * 100; let rew = currentEnemy.isBoss ? Math.floor(wave / 2 * getStarMult()) : Math.floor(wave / 3 * getStarMult()); document.getElementById("enemyContainer").innerHTML = '<div style="font-size:22px;font-weight:900;margin-bottom:8px;">' + currentEnemy.name + '</div><div style="font-size:14px;margin-bottom:5px;">❤️ ' + Math.floor(currentEnemy.hp) + ' / ' + currentEnemy.maxHp + '</div><div style="background:rgba(0,0,0,0.5);border-radius:10px;margin-bottom:8px;"><div style="width:' + p + '%;background:linear-gradient(90deg, #e74c3c, #f5af19);height:12px;border-radius:10px;"></div></div><div style="font-size:14px;color:#aaa;">⚔️ Урон: ' + currentEnemy.damage + '</div>'; document.getElementById("waveNumber").innerText = wave; document.getElementById("rewardPreview").innerText = rew; if (currentEnemy.isBoss && currentEnemy.hp <= currentEnemy.maxHp * 0.3 && currentEnemy.hp > 0) { document.getElementById("spareBtn").style.display = "block"; } else { document.getElementById("spareBtn").style.display = "none"; } if (currentDialog && wave === 10000 && currentEnemy.hp <= currentEnemy.maxHp * 0.5 && currentEnemy.hp > 0) { renderDialog(); } document.getElementById("worldIndicator").innerHTML = '🌍 Мир: <span style="color:' + getCurrentWorld().color + ';">' + getCurrentWorld().name + '</span> <button id="musicToggleBtn" class="btn" style="padding:2px 8px;font-size:12px;margin-left:8px;" onclick="toggleMusic()">' + (musicEnabled ? '🔊' : '🔇') + '</button>'; }

function renderDialog() { if (!currentDialog || !Array.isArray(currentDialog)) return; let html = '<div class="dialog-box"><b>' + currentEnemy.name + ':</b> «' + bossTemplates[10000].dialogue + '»</div>'; html += '<div style="margin-top:10px;font-weight:800;">Ответить:</div>'; currentDialog.forEach((d, i) => { html += '<div class="dialog-option" onclick="selectDialog(' + i + ')">' + d.text + '</div>'; }); document.getElementById("dialogBox").innerHTML = html; document.getElementById("dialogBox").style.display = "block"; }

function selectDialog(index) { if (!currentDialog || !currentDialog[index]) return; let d = currentDialog[index]; let html = '<div class="dialog-box"><b>Вы:</b> «' + d.text + '»</div>'; html += '<div class="dialog-box"><b>' + currentEnemy.name + ':</b> «' + d.response + '» ' + d.mood + '</div>'; document.getElementById("dialogBox").innerHTML = html; currentDialog = null; }

function updateStatusDisplay() { let html = ''; if (enemyStatuses.fireTicks > 0) html += '<span class="status-effect">🔥 Горит (' + enemyStatuses.fireTicks + ')</span>'; if (enemyStatuses.poisonDamage > 0) html += '<span class="status-effect">🌀 Яд: ' + enemyStatuses.poisonDamage + '</span>'; if (enemyStatuses.bleedMult > 1.0) html += '<span class="status-effect">🩸 Кровотечение: x' + enemyStatuses.bleedMult.toFixed(2) + '</span>'; if (enemyStatuses.freezeStacks > 0) html += '<span class="status-effect">❄️ Обледенение: +' + enemyStatuses.freezeStacks + '</span>'; if (enemyStatuses.shockChance > 0) html += '<span class="status-effect">⚡ Шок: ' + Math.floor(enemyStatuses.shockChance * 100) + '%</span>'; if (enemyStatuses.blindStacks > 0) html += '<span class="status-effect">🕶️ Ослепление: +' + enemyStatuses.blindStacks + '</span>'; html += ' <span class="status-effect" style="background:#ff4400;color:#fff;">⚡Комбо: x' + comboMultiplier + '</span>'; 
    if (typeof hunger !== 'undefined' && hunger > 0) {
        let hColor = hunger < 30 ? "#2ecc71" : hunger < 60 ? "#f5af19" : hunger < 85 ? "#e67e22" : "#e74c3c";
        html += ' <span class="status-effect" style="color:' + hColor + ';">🍽️ Голод: ' + Math.floor(hunger) + '%</span>';
    }
    if (typeof obesityPoints !== 'undefined' && obesityPoints >= 20) {
        let obName = (typeof getObesityStageName === 'function') ? getObesityStageName() : "Ожирение";
        html += ' <span class="status-effect" style="color:#e67e22;">🍔 ' + obName + '</span>';
    }
    if (typeof poisonTimer !== 'undefined' && poisonTimer > 0) {
        html += ' <span class="status-effect" style="color:#aa00aa;">☠️ Отравление: ' + Math.floor(poisonTimer) + 'с</span>';
    }
    if (typeof activeBuffs !== 'undefined' && activeBuffs["pepperSpeed"] && activeBuffs["pepperSpeed"] > Date.now()) {
        html += ' <span class="status-effect" style="color:#ff4400;">🌶️ Перец!</span>';
    }
    document.getElementById("statusEffects").innerHTML = html; 
}

function updateEnemyStatusDisplay() { let html = ''; if (enemyStatuses.freezeStacks > 0) html += '<span class="status-effect">❄️ Заморозка врага: +' + enemyStatuses.freezeStacks + '</span>'; if (enemyStatuses.bleedMult > 1.0) html += '<span class="status-effect">🩸 Усиление врага: x' + enemyStatuses.bleedMult.toFixed(1) + '</span>'; if (enemyStatuses.shockChance > 0) html += '<span class="status-effect">⚡ Шок врага: ' + Math.floor(enemyStatuses.shockChance * 100) + '%</span>'; document.getElementById("enemyStatusEffects").innerHTML = html; }

function renderDefeatHistory() { document.getElementById("fightHistory").innerHTML = defeatHistory.length ? defeatHistory.map(h => '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">💀 Волна ' + h.wave + ' <span style="color:#aaa;">| HP ' + h.hp + '</span></div>').join('') : "Нет поражений"; }

function renderAchievements() { let c = document.getElementById("achievementsList"), l = []; if (achievements.win10) l.push("10🏆"); if (achievements.win50) l.push("50🏆"); if (achievements.win100) l.push("100🏆"); if (achievements.win500) l.push("500🏆"); if (achievements.legendaryTeam) l.push("Легенды"); if (achievements.secretTeam) l.push("Секреты"); if (achievements.level20) l.push("20ур"); if (achievements.level50) l.push("50ур"); c.innerHTML = l.length ? l.map(a => '<span class="rarity-tag" style="background:#f5af19;color:#1a1a2e;box-shadow:none;">' + a + '</span>').join('') : "Нет"; }

function renderChallenges() { let c = document.getElementById("challengeList"); if (!challenges.length) { c.innerHTML = "Квесты загружаются..."; return; } c.innerHTML = challenges.map(ch => '<div class="challenge-item" style="opacity:' + (ch.completed ? 0.6 : 1) + '"><div><b>' + ch.name + '</b><br><small>' + (ch.progress || 0) + '/' + ch.target + '</small></div><div><span style="color:#f5af19;">' + ch.reward + '⭐</span> ' + (ch.completed ? '✅' : '') + '</div></div>').join(''); }

// ============================================================
// ТАЙНИК
// ============================================================
const TREASURE_POOL = [
    { id: "apple", name: "🍏 Яблоко", cost: 200, desc: "+5% HP, -10% голода, -1 ожирение", rarity: "common", weight: 15 },
    { id: "orange", name: "🍊 Апельсин", cost: 350, desc: "+8% HP, -15% голода, -1 ожирение", rarity: "common", weight: 12 },
    { id: "banana", name: "🍌 Банан", cost: 500, desc: "+10% HP, -20% голода, -2 ожирение", rarity: "common", weight: 10 },
    { id: "cherry", name: "🍒 Вишня", cost: 800, desc: "+7% HP, -12% голода, -3 ожирение", rarity: "rare", weight: 8 },
    { id: "lemon", name: "🍋 Лимон", cost: 1200, desc: "+3% HP, -5% голода, -8 ожирение, +6 антидот", rarity: "rare", weight: 6 },
    { id: "grapes", name: "🍇 Виноград", cost: 1500, desc: "+15% HP, -35% голода, -4 ожирение", rarity: "rare", weight: 5 },
    { id: "watermelon", name: "🍉 Арбуз", cost: 2500, desc: "+20% HP, -50% голода, -6 ожирение", rarity: "epic", weight: 4 },
    { id: "mango", name: "🥭 Манго", cost: 3500, desc: "+18% HP, -45% голода, -7 ожирение", rarity: "epic", weight: 3 },
    { id: "pineapple", name: "🍍 Ананас", cost: 5000, desc: "+25% HP, -60% голода, -10 ожирение", rarity: "legendary", weight: 2 },
    { id: "bread", name: "🍞 Хлеб", cost: 250, desc: "-40% голода, +1 ожирение", rarity: "common", weight: 10 },
    { id: "mushroom", name: "🍄 Гриб", cost: 300, desc: "50/50: волшебный или ядовитый", rarity: "common", weight: 10 },
    { id: "pepper", name: "🌶️ Перец", cost: 400, desc: "+30% скорости, но жжёт HP", rarity: "common", weight: 8 },
    { id: "ice", name: "🧊 Лёд", cost: 600, desc: "Заморозка врага +5", rarity: "rare", weight: 6 },
    { id: "antidote_potion", name: "🧪 Мини-зелье", cost: 700, desc: "Мгновенно снять отравление", rarity: "rare", weight: 5 },
    { id: "honey", name: "🍯 Мёд", cost: 800, desc: "+3% HP/сек × 10 сек", rarity: "rare", weight: 5 },
    { id: "egg", name: "🥚 Яйцо", cost: 1000, desc: "Рандомная награда", rarity: "epic", weight: 3 }
];

window._treasureItems = window._treasureItems || [];

function getRandomTreasureItem() {
    let total = TREASURE_POOL.reduce((sum, it) => sum + it.weight, 0);
    let r = Math.random() * total;
    let acc = 0;
    for (let it of TREASURE_POOL) {
        acc += it.weight;
        if (r <= acc) return { ...it, uid: Date.now() + Math.random() };
    }
    return { ...TREASURE_POOL[0], uid: Date.now() + Math.random() };
}

function getTreasureItems() {
    if (!window._treasureItems || window._treasureItems.length !== 3) {
        window._treasureItems = [getRandomTreasureItem(), getRandomTreasureItem(), getRandomTreasureItem()];
    }
    return window._treasureItems;
}

function rerollTreasureItems() {
    let cost = 500;
    if (mode !== "moder" && points < cost) { if (typeof showFloatingText === 'function') showFloatingText("Нужно " + cost + "⭐!", "#ff3333"); return; }
    if (mode !== "moder") points -= cost;
    window._treasureItems = [getRandomTreasureItem(), getRandomTreasureItem(), getRandomTreasureItem()];
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderPoints === 'function') renderPoints();
    renderShop();
    if (typeof showFloatingText === 'function') showFloatingText("🔄 Товары обновлены!", "#f5af19");
}

window.buyTreasureItem = function(uid) {
    let items = getTreasureItems();
    let idx = items.findIndex(it => it.uid === uid);
    if (idx === -1) return;
    let item = items[idx];
    if (mode !== "moder" && points < item.cost) { if (typeof showFloatingText === 'function') showFloatingText("Не хватает ⭐!", "#ff3333"); return; }
    if (mode !== "moder") points -= item.cost;
    if (typeof addItem === 'function') addItem(item.id, 1);
    window._treasureItems[idx] = getRandomTreasureItem();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderPoints === 'function') renderPoints();
    renderShop();
    if (typeof showFloatingText === 'function') showFloatingText("🎁 " + item.name + " куплено!", "#2ecc71");
};

function renderShop() { 
    let subTab = document.getElementById("shopItemsSubTab");
    if (!subTab) return;
    
    let isUnlocked = (typeof getTreasureUnlocked === 'function') && getTreasureUnlocked();
    
    document.querySelectorAll("#treasureBlock, #treasureLockedBlock").forEach(function(el) { el.remove(); });
    
    let children = Array.from(subTab.children);
    for (let child of children) {
        if (child.id === "treasureBlock" || child.id === "treasureLockedBlock") continue;
        if (child.classList && child.classList.contains("card")) {
            child.style.display = isUnlocked ? "" : "none";
        }
    }
    
    if (!isUnlocked) {
        let hasKey = false;
        try { hasKey = (typeof getItemCount === 'function' && getItemCount("key") > 0); } catch(e) {}
        
        let lockHtml = '<div id="treasureLockedBlock" style="margin:20px 0;padding:40px 20px;background:linear-gradient(135deg,rgba(155,89,182,0.25),rgba(75,0,130,0.25));border:3px solid #9b59b6;border-radius:24px;text-align:center;box-shadow:0 0 40px rgba(155,89,182,0.4);">';
        lockHtml += '<div style="font-size:80px;margin-bottom:15px;filter:drop-shadow(0 0 20px #9b59b6);">🔐</div>';
        lockHtml += '<div style="font-weight:900;font-size:22px;color:#e056fd;margin-bottom:10px;text-shadow:0 0 15px rgba(224,86,253,0.6);">ТАЙНИК ЗАКРЫТ</div>';
        lockHtml += '<div style="font-size:14px;color:#bbb;line-height:1.6;margin-bottom:20px;">Все товары в этой вкладке недоступны.<br>Найди <b style="color:#f5af19;">Ключ Живого Камня</b>, чтобы открыть лавку.</div>';
        if (hasKey) {
            lockHtml += '<div style="font-size:13px;color:#f5af19;font-weight:bold;margin-bottom:15px;">🎉 У тебя есть ключ! Используй его:</div>';
            lockHtml += '<button class="btn btn-primary" style="padding:15px 30px;font-size:16px;font-weight:900;background:linear-gradient(135deg,#9b59b6,#e056fd);border:none;" onclick="useKey();renderShop();">🔓 ИСПОЛЬЗОВАТЬ КЛЮЧ</button>';
        } else {
            lockHtml += '<div style="font-size:12px;color:#888;padding:10px;background:rgba(0,0,0,0.3);border-radius:10px;">💡 Победи Живого Камня на 200 волне, чтобы получить ключ</div>';
        }
        lockHtml += '</div>';
        
        subTab.insertAdjacentHTML('afterbegin', lockHtml);
        return;
    }
    
    let treasureItems = getTreasureItems();
    let treasureHtml = '<div id="treasureBlock" style="margin-bottom:15px;padding:15px;background:linear-gradient(135deg,rgba(46,204,113,0.15),rgba(39,174,96,0.1));border:2px solid #2ecc71;border-radius:20px;box-shadow:0 0 20px rgba(46,204,113,0.3);">';
    treasureHtml += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">';
    treasureHtml += '<div style="font-weight:900;font-size:16px;color:#2ecc71;text-shadow:0 0 10px rgba(46,204,113,0.5);">🎁 ТАЙНЫЕ ТОВАРЫ</div>';
    treasureHtml += '<button class="btn" style="padding:6px 14px;font-size:11px;background:rgba(46,204,113,0.3);border:1px solid #2ecc71;color:#2ecc71;font-weight:900;" onclick="rerollTreasureItems()">🔄 Обновить (500⭐)</button>';
    treasureHtml += '</div>';
    treasureHtml += '<div style="font-size:11px;color:#aaa;margin-bottom:10px;text-align:center;">3 уникальных товара • обновляются вручную</div>';
    treasureHtml += '<div style="display:flex;flex-direction:column;gap:8px;">';
    
    let rarityColors = {
        "common": "#6c757d",
        "rare": "#17a2b8",
        "epic": "#9b59b6",
        "legendary": "#ffd700"
    };
    let rarityNames = {
        "common": "Обычный",
        "rare": "Редкий",
        "epic": "Эпический",
        "legendary": "Легендарный"
    };
    
    treasureItems.forEach(function(it) {
        let canBuy = (mode === "moder") || points >= it.cost;
        let rColor = rarityColors[it.rarity] || "#6c757d";
        treasureHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(0,0,0,0.35);border-radius:12px;border-left:4px solid ' + rColor + ';">';
        treasureHtml += '<div style="flex:1;">';
        treasureHtml += '<div style="font-weight:800;font-size:14px;">' + it.name + '</div>';
        treasureHtml += '<div style="font-size:10px;color:#aaa;margin-top:2px;">' + it.desc + '</div>';
        treasureHtml += '<div style="font-size:9px;color:' + rColor + ';font-weight:bold;margin-top:2px;">' + rarityNames[it.rarity] + '</div>';
        treasureHtml += '</div>';
        treasureHtml += '<div style="display:flex;align-items:center;gap:8px;">';
        treasureHtml += '<span style="color:#f5af19;font-weight:900;font-size:14px;">' + it.cost + '⭐</span>';
        treasureHtml += '<button class="btn btn-primary" style="padding:6px 14px;font-size:12px;font-weight:900;" onclick="buyTreasureItem(' + it.uid + ')" ' + (!canBuy ? 'disabled' : '') + '>Купить</button>';
        treasureHtml += '</div>';
        treasureHtml += '</div>';
    });
    
    treasureHtml += '</div></div>';
    
    subTab.insertAdjacentHTML('afterbegin', treasureHtml);
    
    let c = document.getElementById("shopItems");
    if (!c) return;
    c.innerHTML = shopItems.map((it, i) => it ? '<div class="shop-item"><div><strong>' + it.name + '</strong>' + (it.desc ? '<br><small>' + it.desc + '</small>' : '') + '</div><div><span class="shop-price">' + it.cost + '⭐</span><button class="btn btn-primary" style="padding:6px 12px;" onclick="buyShopItem(' + i + ')">Купить</button></div></div>' : '<div class="shop-item"><div style="color:#888;">Пусто</div></div>').join(''); 
    
    let timeLeft = shopRefreshTime ? Math.max(0, 3600000 - (Date.now() - shopRefreshTime)) : 0;
    let timerHtml = '';
    if (timeLeft > 0) {
        let h = Math.floor(timeLeft / 3600000);
        let m = Math.floor((timeLeft % 3600000) / 60000);
        let s = Math.floor((timeLeft % 60000) / 1000);
        timerHtml = '<div style="text-align:center;margin-top:8px;font-weight:600;color:#aaa;font-size:12px;">🔄 Бесплатное обновление через: ' + h + 'ч ' + m + 'м ' + s + 'с</div>';
    } else {
        timerHtml = '<div style="text-align:center;margin-top:8px;font-weight:600;color:#2ecc71;font-size:12px;">✅ Можно обновить бесплатно!</div>';
    }
    c.innerHTML += timerHtml;
    
    let artHtml = ''; 
    if (rebirthCount >= 4) { 
        artHtml += '<div class="shop-item"><div><b>🗿 Пальцы Сукуны</b><br><small>Усиливает одного героя на 1 час: +50% урона, +40% HP.</small></div><div><span class="shop-price">15000⭐</span><button class="btn" style="padding:6px 12px;" onclick="' + (hasSukunaFingers ? 'showSukunaModal()' : 'buySukuna()') + '">' + (hasSukunaFingers ? 'Выбрать героя' : 'Купить') + '</button></div></div>'; 
        artHtml += '<div class="shop-item"><div><b>💉 Препарат V</b><br><small>Баффает героя: +20% урона, +30% HP.</small></div><div><span class="shop-price">5000⭐</span><button class="btn" style="padding:6px 12px;" onclick="showCompoundVModal()">Купить</button></div></div>'; 
        artHtml += '<div class="shop-item"><div><b>📓 Тетрадь смерти</b></div><div><input id="dnInput" type="number" min="1" style="width:60px;background:rgba(0,0,0,0.5);color:white;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:4px;text-align:center;" value="' + (deathNoteTarget || '') + '" placeholder="Волна"><span class="shop-price">500к⭐</span><button class="btn" style="padding:4px 10px;" onclick="buyDeathNote()">Купить</button></div></div>'; 
        artHtml += '<div class="shop-item"><div><b>🔥 Огонь Дома</b></div><div><button class="btn use-artifact-btn" onclick="useFireArtifact()" ' + (hasFireArtifact ? '' : 'disabled') + '>' + (hasFireArtifact ? '🔥 Исп.' : 'Купить (100к)') + '</button></div></div>'; 
    } else { 
        artHtml = '<div class="shop-item"><div style="color:#888;text-align:center;width:100%;">🔒 Артефакты откроются после 4 ребиртха</div></div>'; 
    } 
    document.getElementById("artifactItems").innerHTML = artHtml; 
    renderBulkSell(); 
    renderAutoRest(); 
}

window.buyFruitFromTreasure = function(fruitId, cost) {
    if (typeof getTreasureUnlocked !== 'function' || !getTreasureUnlocked()) {
        if (typeof showFloatingText === 'function') showFloatingText("🔒 Тайник закрыт!", "#ff3333");
        return;
    }
    if (mode !== "moder" && points < cost) return;
    if (mode !== "moder") points -= cost;
    if (typeof addItem === 'function') addItem(fruitId, 1);
    if (typeof renderPoints === 'function') renderPoints();
    if (typeof renderShop === 'function') renderShop();
    if (typeof showFloatingText === 'function') showFloatingText("🍎 Куплено!", "#2ecc71");
};

function renderActiveBuffs() { 
    let n = Date.now(), l = []; 
    for (let [id, exp] of Object.entries(activeBuffs)) { 
        if (exp > n) { 
            let r = exp - n, h = Math.floor(r / 3600000), m = Math.floor((r % 3600000) / 60000);
            let s = Math.floor((r % 60000) / 1000);
            let name = id;
            if (id === "dmg13") name = "Урон x1.3";
            else if (id === "dmg15") name = "Урон +50%";
            else if (id === "doubleDamage") name = "Урон x2";
            else if (id === "quadDamage") name = "Урон x4";
            else if (id === "doubleStars") name = "Звёзды x2";
            else if (id === "tripleStars") name = "Звёзды x3";
            else if (id === "doubleHp") name = "HP x2";
            else if (id === "tripleHp") name = "HP x3";
            else if (id === "arenaSpeedX3") name = "Скорость арены x3";
            else if (id === "arenaSpeedX5") name = "Скорость арены x5";
            else if (id === "arenaSpeedX2") name = "Скорость арены x2";
            else if (id === "fatigueImmune") name = "Иммунитет к усталости";
            else if (id === "doubleExp") name = "Двойной опыт";
            else if (id === "arenaInvuln") name = "Неуязвимость (арена)";
            else if (id === "pepperSpeed") name = "🌶️ Перец (+30% скорости)";
            let timeStr = h > 0 ? h + 'ч ' + m + 'м' : (m > 0 ? m + 'м ' + s + 'с' : s + 'с');
            l.push('<span style="color:var(--gold);">' + name + '</span> (' + timeStr + ')'); 
        } else delete activeBuffs[id]; 
    } 
    if (hasSukunaFingers && sukunaTarget && sukunaExpireTime > Date.now()) {
        let remaining = Math.max(0, sukunaExpireTime - Date.now());
        let mins = Math.floor(remaining / 60000);
        let secs = Math.floor((remaining % 60000) / 1000);
        l.push('<span style="color:#ff4444;">🗿 Пальцы Сукуны: ' + sukunaTarget + ' (' + mins + 'м ' + secs + 'с)</span>');
    } else if (hasSukunaFingers && (!sukunaTarget || sukunaExpireTime <= Date.now())) {
        l.push('<span style="color:#ffaa00;">🗿 Пальцы Сукуны: выберите героя</span>');
    }
    if (deathNoteTarget) l.push('<span style="color:var(--gold);">📓 Пропуск волны ' + deathNoteTarget + '</span>'); 
    for (let name in hasCompoundV) { 
        if (hasCompoundV[name]) l.push('<span style="color:var(--gold);">💉 Препарат V: ' + name + '</span>'); 
    } 
    document.getElementById("activeBuffs").innerHTML = l.length ? l.join("<br>") : "<span style='color:#888;'>Нет активных баффов</span>"; 
}

function renderFreeSpins() { let el = document.getElementById("freeSpinsCount"); if (el) el.innerText = freeSpins; }

function renderBulkSell() { let c = document.getElementById("bulkSellItems"); if (rebirthCount < 1) { c.innerHTML = '<div class="shop-item"><div style="color:#888;font-weight:bold;text-align:center;width:100%;">🔒 Авто-продажа откроется после 1 ребиртха</div></div>'; return; } c.innerHTML = bulkSellOptions.map(o => { let cost = getAutoSellCost(o.rarity); let pur = purchasedAutoSell[o.rarity] || false; let act = autoSellSettings[o.rarity] || false; let desc = !pur ? '<span style="color:var(--gold);">Купить за ' + cost + '⭐</span>' : (act ? '<span style="color:var(--green);">Активна</span>' : 'Куплена'); let btn; if (!pur) { btn = '<button class="btn btn-primary" style="padding:6px 12px;" onclick="purchaseAutoSell(\'' + o.rarity + '\')">Купить</button>'; } else if (act) { btn = '<button class="btn" style="padding:6px 12px;border-color:var(--green);" onclick="toggleAutoSell(\'' + o.rarity + '\')">Выкл</button>'; } else { btn = '<button class="btn" style="padding:6px 12px;" onclick="toggleAutoSell(\'' + o.rarity + '\')">Выкл ▶</button>'; } return '<div class="shop-item ' + (act ? 'auto-active' : '') + '"><div><strong>' + o.name + '</strong><br><small>' + desc + '</small></div><div>' + btn + '</div></div>'; }).join(''); }

function renderAutoRest() { let c = document.getElementById("autoRestItems"); if (rebirthCount < 3) { c.innerHTML = '<div class="shop-item"><div style="color:#888;font-weight:bold;text-align:center;width:100%;">🔒 Авто-отдых откроется после 3 ребиртха</div></div>'; return; } c.innerHTML = autoRestOptions.map(o => { let cost = getAutoRestCost(o.threshold); let pur = autoRest.purchased && autoRest.threshold === o.threshold; let act = autoRest.active && autoRest.threshold === o.threshold; let desc = !pur ? '<span style="color:var(--gold);">Купить за ' + cost + '⭐</span>' : (act ? '<span style="color:var(--green);">Активен</span>' : 'Куплен'); let btn; if (!pur) { btn = '<button class="btn btn-primary" style="padding:6px 12px;" onclick="purchaseAutoRest(' + o.threshold + ')">Купить</button>'; } else if (act) { btn = '<button class="btn" style="padding:6px 12px;border-color:var(--green);" onclick="toggleAutoRest(' + o.threshold + ')">Выкл</button>'; } else { btn = '<button class="btn" style="padding:6px 12px;" onclick="toggleAutoRest(' + o.threshold + ')">Выкл ▶</button>'; } return '<div class="shop-item ' + (act ? 'auto-active' : '') + '"><div><strong>' + o.name + ' усталости</strong><br><small>' + desc + '</small></div><div>' + btn + '</div></div>'; }).join(''); }

function renderUpgrades() { 
    let h = ""; 
    for (let [k, u] of Object.entries(upgrades)) { 
        let un = isUpgradeUnlocked(k), c = Math.floor(u.baseCost * (1 + u.level * 0.3)), cur = u.level * u.increment; 
        let extraInfo = ''; 
        if (k === 'crit') extraInfo = '<br><span style="color:#aaa;font-size:10px;">⚡ +' + (cur * 100).toFixed(1) + '% к шансу крита</span>'; 
        if (k === 'fatigueResist') extraInfo = '<br><span style="color:#aaa;font-size:10px;">💪 -' + (cur * 100).toFixed(1) + '% набора усталости</span>'; 
        h += '<div class="upgrade-item ' + (un ? '' : 'locked') + '"><div><strong>' + u.name + '</strong> (+' + cur.toFixed(2) + ')' + (un ? '' : '<br><span style="color:var(--red);">🔒 Нужен ур. ' + u.reqLevel + '</span>') + extraInfo + '</div><div><span class="upgrade-price">' + c + '⭐</span><button class="btn btn-primary" style="border-radius:50%;width:36px;height:36px;font-size:20px;" onclick="buyUpgrade(\'' + k + '\')" ' + (un ? '' : 'disabled') + '>+</button></div></div>'; 
    } 
    document.getElementById("upgradeItems").innerHTML = h; 
}

function renderBook() { let all = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))); let ds = new Set(discoveredCards); document.getElementById("bookList").innerHTML = all.map(t => { let kn = ds.has(t.name); let s = cardStats[t.rarity]; let clickAction = (moderUnlocked && mode === 'moder') ? 'bookGet(\'' + t.rarity + '\',\'' + t.name.replace(/'/g, "\\'") + '\')' : 'bookInfoCard(\'' + t.rarity + '\',\'' + t.name.replace(/'/g, "\\'") + '\')'; let superPreview = ''; if (t.superAbility && kn) { superPreview = '<div style="font-size:8px;color:#ffd700;margin-top:2px;">' + t.superAbility.name + '</div>'; } return '<div class="book-item ' + (kn ? '' : 'unknown-card') + '" onclick="' + clickAction + '"><div class="name">' + (kn ? t.name : '???') + '</div><div class="rarity-tag ' + rarityColors[t.rarity] + '">' + t.rarity + '</div><div>💪' + (t.damage ?? s.damage) + ' ❤️' + (t.hp ?? s.hp) + ' ⚡' + (t.speed ?? s.speed ?? '?') + '</div>' + superPreview + '</div>'; }).join(''); document.getElementById("discoveredCount").innerText = discoveredCards.length; document.getElementById("totalTemplatesCount").innerText = all.length; }

function bookInfoCard(rarity, name) { let t = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))).find(t => t.name === name && t.rarity === rarity); if (!t) return; let s = cardStats[rarity]; let info = '📄 ' + t.name + '\n\n'; info += '⭐ Редкость: ' + rarity + '\n'; info += '🌌 Вселенная: ' + (t.universe || 'Неизвестно') + '\n'; info += '💪 Урон: ' + (t.damage ?? s.damage) + '\n'; info += '❤️ Здоровье: ' + (t.hp ?? s.hp) + '\n'; info += '⚡ Скорость: ' + (t.speed ?? s.speed ?? '?') + '\n'; if (t.sellPrice) info += '💰 Цена продажи: ' + t.sellPrice + '⭐\n'; if (t.minRebirth) info += '🔒 Мин. ребиртх: ' + t.minRebirth + '\n'; if (t.desc) { info += '\n📝 Описание:\n' + t.desc + '\n'; } if (t.ability) { info += '\n✨ Способность (ур.4): ' + t.ability.desc + '\n'; } if (t.statusAbility) { info += '🌀 Статус-эффект (ур.3): ' + t.statusAbility.desc + '\n'; } if (t.superAbility) { info += '\n⚡ ' + t.superAbility.name + ' (ур.5)\n' + t.superAbility.desc + '\n'; } if (t.unsellable) info += '\n🔒 Не продаётся\n'; 
    if (typeof getMasteryExpNeeded === 'function') {
        info += '\n📊 ОПЫТ ДЛЯ МАСТЕРСТВА:\n';
        info += '• Ур.2: ' + getMasteryExpNeeded({ rarity: rarity }, 2) + '\n';
        info += '• Ур.3: ' + getMasteryExpNeeded({ rarity: rarity }, 3) + '\n';
        info += '• Ур.4: ' + getMasteryExpNeeded({ rarity: rarity }, 4) + '\n';
        info += '• Ур.5: ' + getMasteryExpNeeded({ rarity: rarity }, 5) + '\n';
    }
    showModal('📄 Информация о карте', info); 
}

window.bookGet = function(r, n) { if (!moderUnlocked || mode !== 'moder') return; let t = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))).find(t => t.name === n && t.rarity === r); if (t) { let s = cardStats[r]; let c = { id: Date.now() + Math.random() * 10000, name: t.name, rarity: r, damage: t.damage ?? s.damage, hp: t.hp ?? s.hp, sellPrice: t.sellPrice ?? s.sellPrice, speed: t.speed ?? s.speed ?? 0.5, ability: t.ability || null, universe: t.universe || "?", unsellable: t.unsellable || false, minRebirth: t.minRebirth || 0, statusAbility: t.statusAbility || null, extraStatus: t.extraStatus || null, superAbility: t.superAbility || null, mastery: 1, masteryExp: 0 }; if (!discoveredCards.includes(t.name)) { discoveredCards.push(t.name); } myCards.push(c); saveAll(); renderMyCards(); sfxCardObtain(); alert("🎴 Получена карта: " + t.name + " (" + r + ")"); } };

// ========== ЭВОЛЮЦИИ ==========
function renderEvoTab() { 
    let c = document.getElementById("evoContent"); 
    if (rebirthCount < 5) { c.innerHTML = "<div style='text-align:center;color:#888;'>Сделайте 5 ребиртхов.</div>"; return; } 
    let tNames = team.map(idx => myCards[idx]?.name).filter(Boolean);
    let luffyForms = ["Луффи", "Луффи (2 гир)", "Луффи (Таймскип)", "Луффи (4 гир)", "Луффи: Ника, Бог Солнца"];
    let hasAllLuffys = luffyForms.every(form => tNames.includes(form));
    let onlyFive = team.length === 5;
    let allAreLuffys = team.every(idx => luffyForms.includes(myCards[idx]?.name));
    let luffyDone = evoProgress.luffyKingUnlocked;
    
    let html = "";
    html += '<div class="evo-quest ' + (luffyDone ? 'done' : '') + '"><b>👑 Луффи : Король пиратов</b><br>Соберите 5 Луффи в команду (только они) и победите босса 500 волны.<br>';
    html += '<small>Луффи: ' + (hasAllLuffys ? '✅' : '❌') + ' | 5 карт: ' + (onlyFive ? '✅' : '❌ (' + team.length + ')') + ' | Все Луффи: ' + (allAreLuffys ? '✅' : '❌') + '</small><br>';
    html += '<b>Статус:</b> ' + (luffyDone ? '✅' : '❌') + '</div>';
    
    let hasSaitama = tNames.includes("Сайтама");
    let hasGarou = tNames.includes("Космический Гароу");
    html += '<div class="evo-quest ' + (evoProgress.sgUnlocked ? 'done' : '') + '"><b>👊 Сайтама/Гароу</b><br>Ваншотните врагов 2000 раз способностью Сайтамы (Космический Гароу в команде).<br>';
    html += '<small>Сайтама: ' + (hasSaitama ? '✅' : '❌') + ' | Космический Гароу: ' + (hasGarou ? '✅' : '❌') + '</small><br>';
    html += evoProgress.oneShotCount + '/2000 ваншотов<br><b>Статус:</b> ' + (evoProgress.sgUnlocked ? '✅' : 'В процессе') + '</div>';
    
    let hasGarp = tNames.includes("Молодой Гарп");
    let hasKuzan = tNames.includes("Кудзан");
    html += '<div class="evo-quest ' + (evoProgress.gkUnlocked ? 'done' : '') + '"><b>❄️ Гарп/Кудзан</b><br>Накопите 1 000 000 000 урона (Молодой Гарп + Кудзан в команде).<br>';
    html += '<small>Гарп: ' + (hasGarp ? '✅' : '❌') + ' | Кудзан: ' + (hasKuzan ? '✅' : '❌') + '</small><br>';
    html += Math.floor(evoProgress.damageGarpKuzan).toLocaleString() + '/1 000 000 000<br><b>Статус:</b> ' + (evoProgress.gkUnlocked ? '✅' : 'В процессе') + '</div>';
    
    let sevenMembersNew = ["Хоумлендер", "Звёздочка", "Мреющий", "Чёрный Нуар", "Пучино", "Королева Мэйв"];
    let hasAllSeven = sevenMembersNew.every(n => tNames.includes(n));
    let allSevenV = sevenMembersNew.every(n => hasCompoundV[n]);
    let sevenDone = evoProgress.sevenUnlocked;
    html += '<div class="evo-quest ' + (sevenDone ? 'done' : '') + '"><b>🦸 Семёрка</b><br>Соберите новый состав: Хоумлендер, Звёздочка, Мреющий, Чёрный Нуар, Пучино, Королева Мэйв.<br>';
    html += 'Все 6 с Препаратом V и 20 уровень.<br>';
    html += '<small>Состав: ' + (hasAllSeven ? '✅' : '❌') + ' | V: ' + (allSevenV ? '✅' : '❌') + ' | Ур: ' + playerLevel + '/20</small><br>';
    html += '<b>Статус:</b> ' + (sevenDone ? '✅' : '❌') + '</div>';
    
    let williamDone = evoProgress.williamUnlocked;
    let allCommon = team.length === 6 && team.every(idx => myCards[idx]?.rarity === "Обычная");
    html += '<div class="evo-quest ' + (williamDone ? 'done' : '') + '"><b>💀 Уильям Фрэнсис</b><br>Победите босса 2000 волны только с обычными картами (6 шт).<br>';
    html += '<small>Обычные: ' + (allCommon ? '✅' : '❌ (нужно 6 обычных)') + '</small><br>';
    html += '<b>Статус:</b> ' + (williamDone ? '✅' : '❌') + '</div>';
    
    c.innerHTML = html; 
}

function renderRebirthInfo() { 
    let reqInfo = getRebirthRequirementInfo(); 
    let world = getWorldForWave(highestWaveReached); 
    let hasDefeatedBoss = canDoRebirth();
    let nextRebirth = rebirthCount + 1;
    
    let html = '<div style="background:rgba(0,0,0,0.3);padding:15px;border-radius:15px;">';
    html += '<div style="font-size:14px;line-height:1.8;">';
    html += '<div>🔄 Текущий ребёрн: <b>' + rebirthCount + '</b></div>';
    html += '<div>⚡ Множитель: <b>x' + getRebirthMult().toFixed(1) + '</b></div>';
    html += '<div>🌍 Текущий мир: <b style="color:' + world.color + ';">' + world.name + '</b></div>';
    html += '<div style="margin-top:8px;padding:8px 12px;background:rgba(0,0,0,0.4);border-radius:10px;">';
    html += '<div>📊 <b>Достигнута волна:</b> <b style="color:#f5af19;font-size:16px;">' + highestWaveReached + '</b></div>';
    html += '</div>';
    html += '</div>';
    
    html += '<div style="margin-top:12px;padding:12px;background:' + (hasDefeatedBoss ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)') + ';border:2px solid ' + (hasDefeatedBoss ? '#2ecc71' : '#e74c3c') + ';border-radius:12px;">';
    html += '<div style="font-size:11px;color:#aaa;margin-bottom:6px;">ТРЕБОВАНИЕ ДЛЯ РЕБЁРНА ' + nextRebirth + ':</div>';
    if (reqInfo.isBossRequirement) {
        html += '<div style="font-size:14px;font-weight:bold;">👑 Победить босса:</div>';
    } else {
        html += '<div style="font-size:14px;font-weight:bold;">🌊 Достигнуть волны:</div>';
    }
    html += '<div style="font-size:16px;font-weight:900;color:#f5af19;margin-top:4px;">Волна ' + reqInfo.wave + '</div>';
    if (reqInfo.bossName && reqInfo.bossName !== "—") {
        html += '<div style="font-size:13px;color:#fff;margin-top:2px;">«' + reqInfo.bossName + '»</div>';
    }
    html += '<div style="margin-top:8px;font-size:14px;font-weight:bold;color:' + (hasDefeatedBoss ? '#2ecc71' : '#e74c3c') + ';">';
    html += hasDefeatedBoss ? '✅ ГОТОВО — можно сделать ребёрн!' : '❌ Условие ещё не выполнено';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    document.getElementById("rebirthInfo").innerHTML = html; 
    document.getElementById("doRebirthBtn").disabled = !hasDefeatedBoss; 
}

function renderRebirthStats() { 
    let c = document.getElementById("rebirthStatsList"); 
    if (!rebirthStats.length) { c.innerHTML = "<div style='color:#888;'>Нет данных</div>"; return; } 
    c.innerHTML = rebirthStats.map(s => 
        '<div class="shop-item">' +
            '<div><b>🔄 Ребёрн ' + s.rebirth + '</b></div>' +
            '<div>' +
                '🌊 <b>Достигнута волна:</b> <span style="color:#f5af19;font-size:15px;font-weight:900;">' + (s.highestWave || s.highestCheckpoint || '?') + '</span><br>' +
                '🌍 Мир: ' + (s.world || 'Лес начала') + '<br>' +
                '📊 Уровень: ' + s.playerLevel + '<br>' +
                '👆 Кликов: ' + (s.totalClicks || 0) + '<br>' +
                '⭐ Макс. звёзд: ' + (s.maxPoints || 0) + '<br>' +
                '🃏 Карт: ' + s.totalCards +
            '</div>' +
        '</div>'
    ).join(''); 
}

function renderGlobalStats() { 
    let el = document.getElementById("globalStats"); 
    if (!el) return; 
    el.innerHTML = 
        '<div>📊 <b>Макс. достигнутая волна:</b> <span style="color:#f5af19;font-size:16px;font-weight:900;">' + highestWaveReached + '</span></div>' +
        '<div>🌊 Текущая волна: <b>' + wave + '</b></div>' +
        '<div>👆 Всего кликов: <b>' + totalClicks + '</b></div>' + 
        '<div>🃏 Всего карт получено: <b>' + totalCardsObtained + '</b></div>' + 
        '<div>⭐ Максимум звёзд: <b>' + maxPoints + '</b></div>' + 
        '<div>💀 Всего поражений: <b>' + defeatHistory.length + '</b></div>' + 
        '<div>🏆 Всего побед: <b>' + totalWins + '</b></div>' + 
        '<div>🔄 Ребёрнов: <b>' + rebirthCount + '</b></div>' + 
        (gameCompleted ? '<div>🏆 <b>ИГРА ПРОЙДЕНА!</b></div>' : ''); 
}

function renderModerControls() { let el = document.getElementById("moderControls"); if (!el) return; if (moderUnlocked && mode === "moder") { el.style.display = "block"; } else { el.style.display = "none"; } }

function renderCheckpoints() { let c = document.getElementById("checkpointList"); let html = ''; let maxCp = Math.max(highestCheckpoint, Math.floor(wave / 50) * 50); for (let cp = 50; cp <= maxCp; cp += 50) { let unlocked = cp <= highestCheckpoint; html += '<div class="checkpoint-item" style="opacity:' + (unlocked ? '1' : '0.5') + '"><div>🚩 Волна ' + cp + (unlocked ? '' : ' 🔒') + '</div><button class="btn ' + (activeCheckpoint === cp ? 'auto-active' : '') + '" style="padding:6px 12px;" onclick="toggleCheckpoint(' + cp + ')" ' + (unlocked ? '' : 'disabled') + '>' + (activeCheckpoint === cp ? 'Выбрано ✅' : 'Выбрать ▶') + '</button></div>'; } c.innerHTML = html || "<div style='text-align:center;padding:15px;color:#888;font-weight:bold;'>Дойдите до 50 волны</div>"; }

// ========== РЕНДЕР ГАЧА ==========
function renderGachaTab() {
    let container = document.getElementById("gachaItems");
    if (!container) return;
    if (typeof checkGachaReset === 'function') checkGachaReset();
    let html = '';
    let types = [
        { id: "common", name: "Обычная", icon: "⚪", color: "#6c757d", minRarity: "Обычная", maxRarity: "Мифическая", maxChance: 1 },
        { id: "rare", name: "Редкая", icon: "🔵", color: "#17a2b8", minRarity: "Обычная", maxRarity: "Мифическая", maxChance: 3 },
        { id: "superRare", name: "Сверхредкая", icon: "🟢", color: "#28a745", minRarity: "Редкая", maxRarity: "Легендарная", maxChance: 2 },
        { id: "epic", name: "Эпическая", icon: "🟣", color: "#9b59b6", minRarity: "Сверх редкая", maxRarity: "Секретная", maxChance: 0.2 },
        { id: "mythic", name: "Мифическая", icon: "🔴", color: "#e74c3c", minRarity: "Эпик", maxRarity: "Секретная", maxChance: 0.8 }
    ];
    types.forEach(t => {
        let bought = (typeof gachaDailyLimits !== 'undefined' && gachaDailyLimits[t.id]) || 0;
        let max = (typeof gachaDailyMax !== 'undefined' && gachaDailyMax[t.id]) || 0;
        let canBuy = (typeof mode !== 'undefined' && mode === "moder") || (bought < max && (typeof points !== 'undefined' && points >= (typeof gachaPrices !== 'undefined' ? gachaPrices[t.id] : 0)));
        let displayPrice = (typeof mode !== 'undefined' && mode === "moder") ? "∞ БЕСПЛАТНО" : ((typeof gachaPrices !== 'undefined' ? gachaPrices[t.id] : 0) + "⭐");
        html += '<div class="shop-item gacha-item" style="border-left: 3px solid ' + t.color + ';">';
        html += '<div><strong>' + t.icon + ' ' + t.name + ' крутка</strong>';
        html += '<br><small>' + displayPrice + ' | ' + bought + '/' + max + ' сегодня</small>';
        html += '<br><small style="color:#aaa;">Мин: ' + t.minRarity + ' | Макс: ' + t.maxRarity + ' (' + t.maxChance + '%)</small></div>';
        html += '<button class="btn btn-primary gacha-btn" onclick="performGacha(\'' + t.id + '\')" ' + (!canBuy ? 'disabled' : '') + '>Крутить</button>';
        html += '</div>';
    });
    if ((typeof legendaryGachaTokens !== 'undefined' && legendaryGachaTokens > 0) || (typeof mode !== 'undefined' && mode === "moder")) {
        let canBuy = (typeof mode !== 'undefined' && mode === "moder") || ((typeof legendaryGachaTokens !== 'undefined' && legendaryGachaTokens > 0) && (typeof points !== 'undefined' && points >= (typeof gachaPrices !== 'undefined' ? gachaPrices.legendary : 0)));
        let displayPrice = (typeof mode !== 'undefined' && mode === "moder") ? "∞ БЕСПЛАТНО" : ((typeof gachaPrices !== 'undefined' ? gachaPrices.legendary : 0) + "⭐");
        let tokenDisplay = (typeof mode !== 'undefined' && mode === "moder") ? "∞" : (typeof legendaryGachaTokens !== 'undefined' ? legendaryGachaTokens : 0);
        html += '<div class="shop-item gacha-item legendary-gacha" style="border-left: 3px solid #ffd700; background: rgba(255,215,0,0.1);">';
        html += '<div><strong>🟡 Легендарная крутка</strong>';
        html += '<br><small>' + displayPrice + ' | Разрешений: ' + tokenDisplay + '</small>';
        html += '<br><small style="color:#aaa;">Мин: Мифическая | Макс: Секретная (2%)</small></div>';
        html += '<button class="btn btn-primary gacha-btn legendary-btn" onclick="performGacha(\'legendary\')" ' + (!canBuy ? 'disabled' : '') + '>Крутить</button>';
        html += '</div>';
    }
    if ((typeof secretGachaTokens !== 'undefined' && secretGachaTokens > 0) || (typeof mode !== 'undefined' && mode === "moder")) {
        let canBuy = (typeof mode !== 'undefined' && mode === "moder") || ((typeof secretGachaTokens !== 'undefined' && secretGachaTokens > 0) && (typeof points !== 'undefined' && points >= (typeof gachaPrices !== 'undefined' ? gachaPrices.secret : 0)));
        let displayPrice = (typeof mode !== 'undefined' && mode === "moder") ? "∞ БЕСПЛАТНО" : ((typeof gachaPrices !== 'undefined' ? gachaPrices.secret : 0) + "⭐");
        let tokenDisplay = (typeof mode !== 'undefined' && mode === "moder") ? "∞" : (typeof secretGachaTokens !== 'undefined' ? secretGachaTokens : 0);
        html += '<div class="shop-item gacha-item secret-gacha" style="border-left: 3px solid #ff00ff; background: rgba(255,0,255,0.1);">';
        html += '<div><strong>🟣 Секретная крутка</strong>';
        html += '<br><small>' + displayPrice + ' | Разрешений: ' + tokenDisplay + '</small>';
        html += '<br><small style="color:#aaa;">Легендарная (80%) | Секретная (20%)</small></div>';
        html += '<button class="btn btn-primary gacha-btn secret-btn" onclick="performGacha(\'secret\')" ' + (!canBuy ? 'disabled' : '') + '>Крутить</button>';
        html += '</div>';
    }
    if (!html) html = '<div style="text-align:center;color:#888;padding:20px;font-weight:bold;">🔒 Победите нового босса (каждые 50 волн) чтобы открыть легендарные и секретные крутки!</div>';
    
    if (typeof lastGachaReset !== 'undefined' && lastGachaReset) {
        let timeLeft = Math.max(0, 86400000 - (Date.now() - lastGachaReset));
        if (timeLeft > 0) {
            let h = Math.floor(timeLeft / 3600000);
            let m = Math.floor((timeLeft % 3600000) / 60000);
            html += '<div style="text-align:center;margin-top:10px;font-weight:600;color:#aaa;font-size:12px;">🔄 Сброс дневных лимитов через: ' + h + 'ч ' + m + 'м</div>';
        } else {
            html += '<div style="text-align:center;margin-top:10px;font-weight:600;color:#2ecc71;font-size:12px;">✅ Лимиты сброшены! Обновите страницу.</div>';
        }
    }
    
    container.innerHTML = html;
}

function renderAll() { 
    renderMyCards(); 
    renderTeam(); 
    renderAfkTeam(); 
    renderEnemy(); 
    renderPoints(); 
    renderShop(); 
    if (typeof renderInventory === 'function') renderInventory();
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
    renderSettings(); 
    renderSlotsInGame(); 
    renderDailyRewards(); 
    renderPass(); 
    if (typeof renderGachaTab === 'function') renderGachaTab(); 
    if (typeof renderPowerPoints === 'function') renderPowerPoints(); 
    if (typeof renderTeamPresets === 'function') renderTeamPresets();
    updatePlayerStats(); 
    updateStatusDisplay(); 
}
