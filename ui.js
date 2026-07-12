// ========== ОТРИСОВКА КАРТОЧЕК ==========
function renderMyCards() { let c = document.getElementById("collectionGrid"); document.getElementById("totalCards").innerText = myCards.length; if (!myCards.length) { c.innerHTML = "<div style='width:100%;text-align:center;padding:20px;color:#888;'>Нет карт</div>"; return; } c.innerHTML = myCards.map((cd, idx) => { let isSeven = cd.name === "Семёрка"; let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); let skFinger = hasSukunaFingers && cd === myCards[team[0]]; let dmgMult = 1; if (cd.ability?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.ability.value); if (cd.statusAbility?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.statusAbility.value); let dmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1)); let hp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1)); let showImage = ["Эволюционная", "Секретная", "Легендарная"].includes(cd.rarity); let cardImg = showImage ? getCardImage(cd.name) : null; let imgHTML = cardImg ? '<img src="' + cardImg + '" class="card-image">' : ''; 
    let superHTML = '';
    if (cd.superAbility) {
        superHTML = '<div style="font-size:9px;color:#ffd700;font-weight:bold;margin-top:3px;text-align:center;line-height:1.2;">' + cd.superAbility.name + '</div><div style="font-size:8px;color:#ffaa00;text-align:center;line-height:1.1;max-width:110px;">' + cd.superAbility.desc + '</div>';
    }
    return '<div class="card-item ' + (team.includes(idx) ? 'team-selected' : '') + ' ' + (afkTeam.includes(idx) ? 'afk-selected' : '') + '" onclick="toggleTeam(' + idx + ')">' + imgHTML + '<div class="card-name">' + escapeHtml(cd.name) + '</div>' + '<div class="rarity-tag ' + rarityColors[cd.rarity] + '">' + cd.rarity + '</div>' + '<div class="card-stats">💪' + dmg + ' ❤️' + hp + ' ⚡' + (cd.speed || 0.5).toFixed(1) + '</div>' + superHTML + (cd.ability ? '<div style="font-size:10px;color:#f5af19;font-weight:bold;margin-top:2px;">✨ ' + cd.ability.desc + '</div>' : '') + (cd.statusAbility ? '<div style="font-size:9px;color:#f5af19;margin-top:2px;">' + cd.statusAbility.desc + '</div>' : '') + '<div style="display:flex;gap:4px;justify-content:center;margin-top:6px;flex-wrap:wrap;">' + '<div class="remove-icon" onclick="event.stopPropagation();toggleTeam(' + idx + ')" style="background:#f5af19;color:#000;">⚔️</div>' + '<div class="remove-icon" onclick="event.stopPropagation();toggleAfk(' + idx + ')" style="background:#2ecc71;color:#000;">💤</div>' + (!cd.unsellable ? '<div class="remove-icon" onclick="event.stopPropagation();sellCard(' + idx + ')">💰</div>' : '') + '</div></div>'; }).join(''); }

function renderTeam() { 
    let c = document.getElementById("teamList"), d = 0, h = 0, html = ""; 
    if (!team.length) { c.innerHTML = "<div style='padding:10px;text-align:center;color:#888;'>Пусто</div>"; 
        document.getElementById("totalDamage").innerText = 0; 
        document.getElementById("totalHpBonus").innerText = 0; 
        window.teamDamage = 0; window.teamHpBonus = 0; 
        return; 
    } 
    team.forEach((idx, s) => { 
        let cd = myCards[idx]; 
        if (!cd) return; 
        let isMain = (s === mainCardIndex);
        let isSeven = cd.name === "Семёрка"; 
        let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); 
        let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); 
        let skFinger = hasSukunaFingers && s === 0; 
        let dmgMult = 1; 
        if (cd.ability?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.ability.value); 
        if (cd.statusAbility?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.statusAbility.value); 
        let cDmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1)); 
        let cHp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1)); 
        let cSpd = cd.speed || 0.5;
        if (cd.ability?.type === 'copyEnemyChance' && currentEnemy && Math.random() < cd.ability.chance) { 
            cDmg = currentEnemy.damage; cHp = currentEnemy.hp; 
        } 
        d += cDmg; h += cHp; 
        let superInfo = '';
        if (cd.superAbility) {
            superInfo = '<div style="font-size:10px;color:#ffd700;margin-top:2px;"><b>' + cd.superAbility.name + '</b></div><div style="font-size:9px;color:#ffaa00;">' + cd.superAbility.desc + '</div>';
        }
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,0,0,0.3);border:2px solid ' + (isMain ? '#f5af19' : 'rgba(255,255,255,0.08)') + ';border-radius:12px;margin-bottom:6px;' + (isMain ? 'box-shadow: 0 0 12px rgba(245,175,25,0.4);' : '') + '">' +
            '<div style="flex:1;">' +
                '<span style="font-weight:800;">' + (isMain ? '👑 ' : '') + escapeHtml(cd.name) + '</span>' +
                '<span style="font-size:12px;margin-left:8px;">💪' + cDmg + ' ❤️' + cHp + ' ⚡' + cSpd.toFixed(1) + '</span>' +
                superInfo +
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
}

function renderAfkTeam() { let c = document.getElementById("afkTeamList"), d = 0, h = 0, html = ""; if (!afkTeam.length) { c.innerHTML = "<div style='padding:10px;text-align:center;color:#888;'>Пусто</div>"; return; } afkTeam.forEach((idx, s) => { let cd = myCards[idx]; if (!cd) return; let isSeven = cd.name === "Семёрка"; let cvMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.2 : 1); let cvHpMult = isSeven && hasCompoundV[cd.name] ? 3 : (hasCompoundV[cd.name] ? 1.3 : 1); let skFinger = hasSukunaFingers && s === 0; let dmgMult = 1; if (cd.ability?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.ability.value); if (cd.statusAbility?.type === 'scaleWithWins') dmgMult *= (1 + totalWins * cd.statusAbility.value); let cDmg = Math.floor(cd.damage * dmgMult * cvMult * (skFinger ? 1.5 : 1)); let cHp = Math.floor(cd.hp * cvHpMult * (skFinger ? 1.4 : 1)); d += cDmg; h += cHp; html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.05);border-radius:12px;margin-bottom:6px;"><span style="font-weight:800;">' + escapeHtml(cd.name) + '</span><span>💪' + Math.floor(cDmg * 0.8) + ' ❤️' + Math.floor(cHp * 0.8) + '</span><button class="btn" style="padding:4px 10px;background:rgba(231,76,60,0.8);border:none;" onclick="afkTeam.splice(' + s + ',1);renderAll();">X</button></div>'; }); c.innerHTML = html; document.getElementById("afkTotalDamage").innerText = Math.floor(d * 0.8); document.getElementById("afkTotalHpBonus").innerText = Math.floor(h * 0.8); window.afkTeamDamage = Math.floor(d * 0.8); window.afkTeamHpBonus = Math.floor(h * 0.8); }

function renderEnemy() { if (!currentEnemy) generateEnemy(); let p = (currentEnemy.hp / currentEnemy.maxHp) * 100; let rew = currentEnemy.isBoss ? Math.floor(wave / 2 * getStarMult()) : Math.floor(wave / 3 * getStarMult()); document.getElementById("enemyContainer").innerHTML = '<div style="font-size:22px;font-weight:900;margin-bottom:8px;">' + currentEnemy.name + '</div><div style="font-size:14px;margin-bottom:5px;">❤️ ' + Math.floor(currentEnemy.hp) + ' / ' + currentEnemy.maxHp + '</div><div style="background:rgba(0,0,0,0.5);border-radius:10px;margin-bottom:8px;"><div style="width:' + p + '%;background:linear-gradient(90deg, #e74c3c, #f5af19);height:12px;border-radius:10px;"></div></div><div style="font-size:14px;color:#aaa;">⚔️ Урон: ' + currentEnemy.damage + '</div>'; document.getElementById("waveNumber").innerText = wave; document.getElementById("rewardPreview").innerText = rew; if (currentEnemy.isBoss && currentEnemy.hp <= currentEnemy.maxHp * 0.3 && currentEnemy.hp > 0) { document.getElementById("spareBtn").style.display = "block"; } else { document.getElementById("spareBtn").style.display = "none"; } if (currentDialog && wave === 10000 && currentEnemy.hp <= currentEnemy.maxHp * 0.5 && currentEnemy.hp > 0) { renderDialog(); } document.getElementById("worldIndicator").innerHTML = '🌍 Мир: <span style="color:' + getCurrentWorld().color + ';">' + getCurrentWorld().name + '</span> <button id="musicToggleBtn" class="btn" style="padding:2px 8px;font-size:12px;margin-left:8px;" onclick="toggleMusic()">' + (musicEnabled ? '🔊' : '🔇') + '</button>'; }

function renderDialog() { if (!currentDialog || !Array.isArray(currentDialog)) return; let html = '<div class="dialog-box"><b>' + currentEnemy.name + ':</b> «' + bossTemplates[10000].dialogue + '»</div>'; html += '<div style="margin-top:10px;font-weight:800;">Ответить:</div>'; currentDialog.forEach((d, i) => { html += '<div class="dialog-option" onclick="selectDialog(' + i + ')">' + d.text + '</div>'; }); document.getElementById("dialogBox").innerHTML = html; document.getElementById("dialogBox").style.display = "block"; }

function selectDialog(index) { if (!currentDialog || !currentDialog[index]) return; let d = currentDialog[index]; let html = '<div class="dialog-box"><b>Вы:</b> «' + d.text + '»</div>'; html += '<div class="dialog-box"><b>' + currentEnemy.name + ':</b> «' + d.response + '» ' + d.mood + '</div>'; document.getElementById("dialogBox").innerHTML = html; currentDialog = null; }

function updateStatusDisplay() { let html = ''; if (enemyStatuses.fireTicks > 0) html += '<span class="status-effect">🔥 Горит (' + enemyStatuses.fireTicks + ')</span>'; if (enemyStatuses.poisonDamage > 0) html += '<span class="status-effect">🌀 Яд: ' + enemyStatuses.poisonDamage + '</span>'; if (enemyStatuses.bleedMult > 1.0) html += '<span class="status-effect">🩸 Кровотечение: x' + enemyStatuses.bleedMult.toFixed(2) + '</span>'; if (enemyStatuses.freezeStacks > 0) html += '<span class="status-effect">❄️ Обледенение: +' + enemyStatuses.freezeStacks + '</span>'; if (enemyStatuses.shockChance > 0) html += '<span class="status-effect">⚡ Шок: ' + Math.floor(enemyStatuses.shockChance * 100) + '%</span>'; if (enemyStatuses.blindStacks > 0) html += '<span class="status-effect">🕶️ Ослепление: +' + enemyStatuses.blindStacks + '</span>'; html += ' <span class="status-effect" style="background:#ff4400;color:#fff;">⚡Комбо: x' + comboMultiplier + '</span>'; document.getElementById("statusEffects").innerHTML = html; }

function updateEnemyStatusDisplay() { let html = ''; if (enemyStatuses.freezeStacks > 0) html += '<span class="status-effect">❄️ Заморозка врага: +' + enemyStatuses.freezeStacks + '</span>'; if (enemyStatuses.bleedMult > 1.0) html += '<span class="status-effect">🩸 Усиление врага: x' + enemyStatuses.bleedMult.toFixed(1) + '</span>'; if (enemyStatuses.shockChance > 0) html += '<span class="status-effect">⚡ Шок врага: ' + Math.floor(enemyStatuses.shockChance * 100) + '%</span>'; document.getElementById("enemyStatusEffects").innerHTML = html; }

function renderDefeatHistory() { document.getElementById("fightHistory").innerHTML = defeatHistory.length ? defeatHistory.map(h => '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">💀 Волна ' + h.wave + ' <span style="color:#aaa;">| HP ' + h.hp + '</span></div>').join('') : "Нет поражений"; }

function renderAchievements() { let c = document.getElementById("achievementsList"), l = []; if (achievements.win10) l.push("10🏆"); if (achievements.win50) l.push("50🏆"); if (achievements.win100) l.push("100🏆"); if (achievements.win500) l.push("500🏆"); if (achievements.legendaryTeam) l.push("Легенды"); if (achievements.secretTeam) l.push("Секреты"); if (achievements.level20) l.push("20ур"); if (achievements.level50) l.push("50ур"); c.innerHTML = l.length ? l.map(a => '<span class="rarity-tag" style="background:#f5af19;color:#1a1a2e;box-shadow:none;">' + a + '</span>').join('') : "Нет"; }

function renderChallenges() { let c = document.getElementById("challengeList"); if (!challenges.length) { c.innerHTML = "Квесты загружаются..."; return; } c.innerHTML = challenges.map(ch => '<div class="challenge-item" style="opacity:' + (ch.completed ? 0.6 : 1) + '"><div><b>' + ch.name + '</b><br><small>' + (ch.progress || 0) + '/' + ch.target + '</small></div><div><span style="color:#f5af19;">' + ch.reward + '⭐</span> ' + (ch.completed ? '✅' : '') + '</div></div>').join(''); }

function renderShop() { let c = document.getElementById("shopItems"); c.innerHTML = shopItems.map((it, i) => it ? '<div class="shop-item"><div><strong>' + it.name + '</strong>' + (it.desc ? '<br><small>' + it.desc + '</small>' : '') + '</div><div><span class="shop-price">' + it.cost + '⭐</span><button class="btn btn-primary" style="padding:6px 12px;" onclick="buyShopItem(' + i + ')">Купить</button></div></div>' : '<div class="shop-item"><div style="color:#888;">Пусто</div></div>').join(''); 
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
    let artHtml = ''; if (rebirthCount >= 4) { artHtml += '<div class="shop-item"><div><b>🗿 Пальцы Сукуны</b><br><small>Баффает первого в команде: +50% урона, +40% HP.</small></div><div><span class="shop-price">15000⭐</span><button class="btn" style="padding:6px 12px;" onclick="buySukuna()" ' + (hasSukunaFingers ? 'disabled' : '') + '>' + (hasSukunaFingers ? 'Куплено' : 'Купить') + '</button></div></div>'; artHtml += '<div class="shop-item"><div><b>💉 Препарат V</b><br><small>Баффает героя: +20% урона, +30% HP.</small></div><div><span class="shop-price">5000⭐</span><button class="btn" style="padding:6px 12px;" onclick="showCompoundVModal()">Купить</button></div></div>'; artHtml += '<div class="shop-item"><div><b>📓 Тетрадь смерти</b></div><div><input id="dnInput" type="number" min="1" style="width:60px;background:rgba(0,0,0,0.5);color:white;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:4px;text-align:center;" value="' + (deathNoteTarget || '') + '" placeholder="Волна"><span class="shop-price">500к⭐</span><button class="btn" style="padding:4px 10px;" onclick="buyDeathNote()">Купить</button></div></div>'; artHtml += '<div class="shop-item"><div><b>🔥 Огонь Дома</b></div><div><button class="btn use-artifact-btn" onclick="useFireArtifact()" ' + (hasFireArtifact ? '' : 'disabled') + '>' + (hasFireArtifact ? '🔥 Исп.' : 'Купить (100к)') + '</button></div></div>'; } else { artHtml = '<div class="shop-item"><div style="color:#888;text-align:center;width:100%;">🔒 Артефакты откроются после 4 ребиртха</div></div>'; } document.getElementById("artifactItems").innerHTML = artHtml; renderBulkSell(); renderAutoRest(); }

function renderActiveBuffs() { let n = Date.now(), l = []; for (let [id, exp] of Object.entries(activeBuffs)) { if (exp > n) { let r = exp - n, h = Math.floor(r / 3600000), m = Math.floor((r % 3600000) / 60000); let name = id === "dmg13" ? "Урон x1.3" : id === "doubleDamage" ? "Урон x2" : id === "quadDamage" ? "Урон x4" : id === "doubleStars" ? "Звёзды x2" : id === "tripleHp" ? "HP x3" : id; l.push('<span style="color:var(--gold);">' + name + '</span> (' + h + 'ч ' + m + 'м)'); } else delete activeBuffs[id]; } if (hasSukunaFingers) l.push('<span style="color:var(--gold);">🗿 Пальцы Сукуны</span>'); if (deathNoteTarget) l.push('<span style="color:var(--gold);">📓 Пропуск волны ' + deathNoteTarget + '</span>'); for (let name in hasCompoundV) { if (hasCompoundV[name]) l.push('<span style="color:var(--gold);">💉 Препарат V: ' + name + '</span>'); } document.getElementById("activeBuffs").innerHTML = l.length ? l.join("<br>") : "<span style='color:#888;'>Нет активных баффов</span>"; }

function renderFreeSpins() { document.getElementById("freeSpinsCount").innerText = freeSpins; }

function renderBulkSell() { let c = document.getElementById("bulkSellItems"); if (rebirthCount < 1) { c.innerHTML = '<div class="shop-item"><div style="color:#888;font-weight:bold;text-align:center;width:100%;">🔒 Авто-продажа откроется после 1 ребиртха</div></div>'; return; } c.innerHTML = bulkSellOptions.map(o => { let cost = getAutoSellCost(o.rarity); let pur = purchasedAutoSell[o.rarity] || false; let act = autoSellSettings[o.rarity] || false; let desc = !pur ? '<span style="color:var(--gold);">Купить за ' + cost + '⭐</span>' : (act ? '<span style="color:var(--green);">Активна</span>' : 'Куплена'); let btn; if (!pur) { btn = '<button class="btn btn-primary" style="padding:6px 12px;" onclick="purchaseAutoSell(\'' + o.rarity + '\')">Купить</button>'; } else if (act) { btn = '<button class="btn" style="padding:6px 12px;border-color:var(--green);" onclick="toggleAutoSell(\'' + o.rarity + '\')">Выкл</button>'; } else { btn = '<button class="btn" style="padding:6px 12px;" onclick="toggleAutoSell(\'' + o.rarity + '\')">Выкл ▶</button>'; } return '<div class="shop-item ' + (act ? 'auto-active' : '') + '"><div><strong>' + o.name + '</strong><br><small>' + desc + '</small></div><div>' + btn + '</div></div>'; }).join(''); }

function renderAutoRest() { let c = document.getElementById("autoRestItems"); if (rebirthCount < 3) { c.innerHTML = '<div class="shop-item"><div style="color:#888;font-weight:bold;text-align:center;width:100%;">🔒 Авто-отдых откроется после 3 ребиртха</div></div>'; return; } c.innerHTML = autoRestOptions.map(o => { let cost = getAutoRestCost(o.threshold); let pur = autoRest.purchased && autoRest.threshold === o.threshold; let act = autoRest.active && autoRest.threshold === o.threshold; let desc = !pur ? '<span style="color:var(--gold);">Купить за ' + cost + '⭐</span>' : (act ? '<span style="color:var(--green);">Активен</span>' : 'Куплен'); let btn; if (!pur) { btn = '<button class="btn btn-primary" style="padding:6px 12px;" onclick="purchaseAutoRest(' + o.threshold + ')">Купить</button>'; } else if (act) { btn = '<button class="btn" style="padding:6px 12px;border-color:var(--green);" onclick="toggleAutoRest(' + o.threshold + ')">Выкл</button>'; } else { btn = '<button class="btn" style="padding:6px 12px;" onclick="toggleAutoRest(' + o.threshold + ')">Выкл ▶</button>'; } return '<div class="shop-item ' + (act ? 'auto-active' : '') + '"><div><strong>' + o.name + ' усталости</strong><br><small>' + desc + '</small></div><div>' + btn + '</div></div>'; }).join(''); }

function renderUpgrades() { let h = ""; for (let [k, u] of Object.entries(upgrades)) { let un = isUpgradeUnlocked(k), c = Math.floor(u.baseCost * (1 + u.level * 0.3)), cur = u.level * u.increment; let extraInfo = ''; if (k === 'luck') extraInfo = '<br><span style="color:#aaa;font-size:10px;">🎲 Работает на легендарных+ крутках</span>'; if (k === 'crit') extraInfo = '<br><span style="color:#aaa;font-size:10px;">⚡ +' + (cur * 100).toFixed(1) + '% к шансу крита</span>'; if (k === 'fatigueResist') extraInfo = '<br><span style="color:#aaa;font-size:10px;">💪 -' + (cur * 100).toFixed(1) + '% набора усталости</span>'; h += '<div class="upgrade-item ' + (un ? '' : 'locked') + '"><div><strong>' + u.name + '</strong> (+' + cur.toFixed(2) + ')' + (un ? '' : '<br><span style="color:var(--red);">🔒 Нужен ур. ' + u.reqLevel + '</span>') + extraInfo + '</div><div><span class="upgrade-price">' + c + '⭐</span><button class="btn btn-primary" style="border-radius:50%;width:36px;height:36px;font-size:20px;" onclick="buyUpgrade(\'' + k + '\')" ' + (un ? '' : 'disabled') + '>+</button></div></div>'; } document.getElementById("upgradeItems").innerHTML = h; }

function renderBook() { let all = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))); let ds = new Set(discoveredCards); document.getElementById("bookList").innerHTML = all.map(t => { let kn = ds.has(t.name); let s = cardStats[t.rarity]; let clickAction = (moderUnlocked && mode === 'moder') ? 'bookGet(\'' + t.rarity + '\',\'' + t.name.replace(/'/g, "\\'") + '\')' : 'bookInfoCard(\'' + t.rarity + '\',\'' + t.name.replace(/'/g, "\\'") + '\')'; let superPreview = ''; if (t.superAbility && kn) { superPreview = '<div style="font-size:8px;color:#ffd700;margin-top:2px;">' + t.superAbility.name + '</div>'; } return '<div class="book-item ' + (kn ? '' : 'unknown-card') + '" onclick="' + clickAction + '"><div class="name">' + (kn ? t.name : '???') + '</div><div class="rarity-tag ' + rarityColors[t.rarity] + '">' + t.rarity + '</div><div>💪' + (t.damage ?? s.damage) + ' ❤️' + (t.hp ?? s.hp) + ' ⚡' + (t.speed ?? s.speed ?? '?') + '</div>' + superPreview + '</div>'; }).join(''); document.getElementById("discoveredCount").innerText = discoveredCards.length; document.getElementById("totalTemplatesCount").innerText = all.length; }

function bookInfoCard(rarity, name) { let t = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))).find(t => t.name === name && t.rarity === rarity); if (!t) return; let s = cardStats[rarity]; let info = '📄 ' + t.name + '\n\n'; info += '⭐ Редкость: ' + rarity + '\n'; info += '🌌 Вселенная: ' + (t.universe || 'Неизвестно') + '\n'; info += '💪 Урон: ' + (t.damage ?? s.damage) + '\n'; info += '❤️ Здоровье: ' + (t.hp ?? s.hp) + '\n'; info += '⚡ Скорость: ' + (t.speed ?? s.speed ?? '?') + '\n'; if (t.sellPrice) info += '💰 Цена продажи: ' + t.sellPrice + '⭐\n'; if (t.minRebirth) info += '🔒 Мин. ребиртх: ' + t.minRebirth + '\n'; if (t.desc) { info += '\n📝 Описание:\n' + t.desc + '\n'; } if (t.ability) { info += '\n✨ Способность: ' + t.ability.desc + '\n'; } if (t.statusAbility) { info += '🌀 Статус-эффект: ' + t.statusAbility.desc + '\n'; } if (t.superAbility) { info += '\n⚡ ' + t.superAbility.name + '\n' + t.superAbility.desc + '\n'; } if (t.unsellable) info += '\n🔒 Не продаётся\n'; showModal('📄 Информация о карте', info); }

window.bookGet = function(r, n) { if (!moderUnlocked || mode !== 'moder') return; let t = Object.entries(customCardTemplates).flatMap(([r, arr]) => arr.map(t => ({ ...t, rarity: r }))).find(t => t.name === n && t.rarity === r); if (t) { let s = cardStats[r]; let c = { id: Date.now() + Math.random() * 10000, name: t.name, rarity: r, damage: t.damage ?? s.damage, hp: t.hp ?? s.hp, sellPrice: t.sellPrice ?? s.sellPrice, speed: t.speed ?? s.speed ?? 0.5, ability: t.ability || null, universe: t.universe || "?", unsellable: t.unsellable || false, minRebirth: t.minRebirth || 0, statusAbility: t.statusAbility || null, extraStatus: t.extraStatus || null, superAbility: t.superAbility || null }; if (!discoveredCards.includes(t.name)) { discoveredCards.push(t.name); } myCards.push(c); saveAll(); renderMyCards(); sfxCardObtain(); alert("🎴 Получена карта: " + t.name + " (" + r + ")"); } };

// ========== ОТРИСОВКА ЭВОЛЮЦИЙ ==========
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

function renderRebirthInfo() { let req = getRebirthRequirement(); let world = getWorldForWave(highestCheckpoint); document.getElementById("rebirthInfo").innerHTML = '<div style="background:rgba(0,0,0,0.3);padding:15px;border-radius:15px;"><div>Текущий ребиртх: <b>' + rebirthCount + '</b></div><div>Множитель: <b>x' + getRebirthMult().toFixed(1) + '</b></div><div>Текущий мир: <b style="color:' + world.color + ';">' + world.name + '</b></div><div>Требуется волн: <b>' + req + '</b> (пройдено ' + highestCheckpoint + ')</div></div>'; document.getElementById("doRebirthBtn").disabled = highestCheckpoint < req; }

function renderRebirthStats() { let c = document.getElementById("rebirthStatsList"); if (!rebirthStats.length) { c.innerHTML = "<div style='color:#888;'>Нет данных</div>"; return; } c.innerHTML = rebirthStats.map(s => '<div class="shop-item"><div><b>Ребиртх ' + s.rebirth + '</b></div><div>🌊 Волна: ' + s.highestWave + '<br>🌍 Мир: ' + (s.world || 'Лес начала') + '<br>📊 Ур: ' + s.playerLevel + '<br>👆 Кликов: ' + (s.totalClicks || 0) + '<br>⭐ Макс. звёзд: ' + (s.maxPoints || 0) + '<br>🃏 Карт: ' + s.totalCards + '</div></div>').join(''); }

function renderGlobalStats() { let el = document.getElementById("globalStats"); if (!el) return; el.innerHTML = '<div>👆 Всего кликов: <b>' + totalClicks + '</b></div>' + '<div>🃏 Всего карт получено: <b>' + totalCardsObtained + '</b></div>' + '<div>⭐ Максимум звёзд: <b>' + maxPoints + '</b></div>' + '<div>🌊 Текущая волна: <b>' + wave + '</b></div>' + '<div>💀 Всего поражений: <b>' + defeatHistory.length + '</b></div>' + '<div>🏆 Всего побед: <b>' + totalWins + '</b></div>' + '<div>🔄 Ребиртхов: <b>' + rebirthCount + '</b></div>' + (gameCompleted ? '<div>🏆 <b>ИГРА ПРОЙДЕНА!</b></div>' : ''); }

function renderModerControls() { let el = document.getElementById("moderControls"); if (!el) return; if (moderUnlocked && mode === "moder") { el.style.display = "block"; } else { el.style.display = "none"; } }

function renderCheckpoints() { let c = document.getElementById("checkpointList"); let html = ''; let maxCp = Math.max(highestCheckpoint, Math.floor(wave / 50) * 50); for (let cp = 50; cp <= maxCp; cp += 50) { let unlocked = cp <= highestCheckpoint; html += '<div class="checkpoint-item" style="opacity:' + (unlocked ? '1' : '0.5') + '"><div>🚩 Волна ' + cp + (unlocked ? '' : ' 🔒') + '</div><button class="btn ' + (activeCheckpoint === cp ? 'auto-active' : '') + '" style="padding:6px 12px;" onclick="toggleCheckpoint(' + cp + ')" ' + (unlocked ? '' : 'disabled') + '>' + (activeCheckpoint === cp ? 'Выбрано ✅' : 'Выбрать ▶') + '</button></div>'; } c.innerHTML = html || "<div style='text-align:center;padding:15px;color:#888;font-weight:bold;'>Дойдите до 50 волны</div>"; }

// ========== РЕНДЕР ГАЧА-КРУТОК ==========
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

// ========== АНИМАЦИЯ ГАЧА-КРУТКИ ==========
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
            let imgHTML = cardImg ? '<img src="' + cardImg + '" style="width:60px;height:60px;border-radius:8px;object-fit:cover;margin-bottom:4px;">' : '<div style="width:60px;height:60px;border-radius:8px;background:#2c2c3a;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:20px;">🎴</div>';
            return '<div style="min-width:150px;text-align:center;background:rgba(30,30,47,0.95);border-radius:16px;padding:15px 10px;border:2px solid ' + rarityColor + ';box-shadow: 0 0 15px ' + rarityColor + ';">' +
                imgHTML + '<div style="font-weight:900;font-size:12px;color:' + rarityColor + ';">' + (typeof escapeHtml === 'function' ? escapeHtml(card.name) : card.name) + '</div>' +
                '<div style="font-size:10px;margin-top:4px;">' + card.rarity + '</div><div style="font-size:10px;">💪' + card.damage + ' ❤️' + card.hp + '</div></div>';
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
    resultDiv.innerHTML = '<div style="text-align:center;font-size:48px;">🎴</div><div style="font-size:24px;font-weight:900;">' + card.name + '</div><div>' + card.rarity + '</div>';
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
                let card = window.gachaAnimationData.resultCard;
                resultDiv.innerHTML = '<div style="text-align:center;font-size:48px;">🎴</div><div style="font-size:24px;font-weight:900;">' + card.name + '</div><div>' + card.rarity + '</div>';
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

function renderAll() { renderMyCards(); renderTeam(); renderAfkTeam(); renderEnemy(); renderPoints(); renderShop(); renderUpgrades(); renderActiveBuffs(); renderDefeatHistory(); renderFreeSpins(); renderAchievements(); renderChallenges(); renderBook(); renderCheckpoints(); renderRebirthInfo(); renderRebirthStats(); renderEvoTab(); renderGlobalStats(); renderModerControls(); if (typeof renderGachaTab === 'function') renderGachaTab(); updatePlayerStats(); updateStatusDisplay(); }