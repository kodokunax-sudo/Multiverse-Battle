// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let currentSlot = -1;
let slotData = {};

// ========== СЛОТЫ СОХРАНЕНИЙ ==========
function getSlotKey(slot) { return "cgV20_slot" + slot; }
function loadSlotMeta(slot) { let s = localStorage.getItem(getSlotKey(slot) + "_meta"); return s ? JSON.parse(s) : { nickname: "Слот " + (slot + 1), exists: false }; }
function saveSlotMeta(slot, meta) { localStorage.setItem(getSlotKey(slot) + "_meta", JSON.stringify(meta)); }
function loadGameFromSlot(slot) { let s = localStorage.getItem(getSlotKey(slot)); return s ? JSON.parse(s) : null; }
function saveGameToSlot(slot) { localStorage.setItem(getSlotKey(slot), JSON.stringify(slotData)); let meta = loadSlotMeta(slot); meta.exists = true; meta.nickname = slotData.nickname || meta.nickname; saveSlotMeta(slot, meta); }

function selectSlot(slot) {
    currentSlot = slot;
    let saved = loadGameFromSlot(slot);
    let meta = loadSlotMeta(slot);
    
    if (!saved && slot === 0) {
        let oldData = localStorage.getItem("cgV20") || localStorage.getItem("cgV19") || localStorage.getItem("cgV18");
        if (oldData) {
            try {
                let d = JSON.parse(oldData);
                if (d.myCards && d.myCards.length > 0) {
                    if (confirm("Найдено старое сохранение! Перенести в Слот 1?")) {
                        loadGameData(d);
                        slotData.nickname = meta.nickname || "Игрок";
                        saveGameToSlot(slot);
                        finishSlotLoad(slot);
                        return;
                    }
                }
            } catch(e) {}
        }
    }
    
    if (saved) {
        loadGameData(saved);
    } else {
        initNewGame();
        slotData.nickname = meta.nickname;
    }
    saveGameToSlot(slot);
    finishSlotLoad(slot);
}

function finishSlotLoad(slot) {
    let el;
    
    el = document.getElementById("slotSelectScreen");
    if (el) el.style.display = "none";
    
    el = document.getElementById("gameScreen");
    if (el) el.style.display = "block";
    
    el = document.getElementById("nicknameDisplay");
    if (el) el.innerText = slotData.nickname || loadSlotMeta(slot).nickname;
    
    localStorage.setItem("cgV20_lastSlot", slot);
    
    team = team.filter(i => myCards[i]);
    if (team.length > 6) team = team.slice(0, 6);
    afkTeam = afkTeam.filter(i => myCards[i]);
    if (afkTeam.length > 6) afkTeam = afkTeam.slice(0, 6);
    
    refreshShop();
    generateEnemy();
    saveAll();
    
    renderAll();
    updateLevelDisplay();
    updateFatigue();
    updateRestBtn();
    updateClaimTimer();
    setMode(mode);
    
    el = document.getElementById("waveNumber");
    if (el) el.innerText = wave;
    
    el = document.getElementById("afkWave");
    if (el) el.innerText = wave;
    
    el = document.getElementById("playerHp");
    if (el) el.innerText = Math.floor(playerHp);
    
    el = document.getElementById("playerDamage");
    if (el) el.innerText = window.playerFinalDamage || 0;
    
    el = document.getElementById("playerMaxHp");
    if (el) el.innerText = window.playerMaxHp || 100;
    
    el = document.getElementById("clicksToCounter");
    if (el) el.innerText = Math.max(1, 3 - enemyStatuses.freezeStacks + enemyStatuses.blindStacks);
    
    el = document.getElementById("rewardPreview");
    if (el && currentEnemy) {
        el.innerText = currentEnemy.isBoss ? Math.floor(wave / 2 * getStarMult()) : Math.floor(wave / 3 * getStarMult());
    }
    
    startMainMusic();
    
    if (afkActive) stopAfk();
}

function loadGameData(d) {
    myCards = d.myCards || []; team = d.team || []; afkTeam = d.afkTeam || []; points = d.points || 100; wave = d.wave || 1; playerHp = d.playerHp || 100; activeBuffs = d.activeBuffs || {}; mode = d.mode || "normal"; defeatHistory = d.defeatHistory || []; shopItems = d.shopItems || [null, null, null]; freeSpins = d.freeSpins ?? 5; fatigue = d.fatigue || 0; achievements = d.achievements || achievements; totalWins = d.totalWins || 0; playerLevel = d.playerLevel || 1; playerExp = d.playerExp || 0; if (d.upgrades) { for (let k in upgrades) { if (d.upgrades[k]) upgrades[k] = d.upgrades[k]; } } discoveredCards = d.discoveredCards || []; hasSukunaFingers = d.hasSukunaFingers || false; deathNoteTarget = d.deathNoteTarget; skipUsed = d.skipUsed || false; hasFireArtifact = d.hasFireArtifact || false; hasCompoundV = d.hasCompoundV || {}; usedCodes = d.usedCodes || []; moderUnlocked = d.moderUnlocked || false; afkWavesCompleted = d.afkWavesCompleted || 0; highestCheckpoint = d.highestCheckpoint || 1; rebirthCount = d.rebirthCount || 0; rebirthStats = d.rebirthStats || []; activeCheckpoint = d.activeCheckpoint || 0; autoSellSettings = d.autoSellSettings || {}; purchasedAutoSell = d.purchasedAutoSell || {}; autoRest = d.autoRest || {active:false,threshold:90,purchased:false}; abilityUpgradeLevel = d.abilityUpgradeLevel || 0; if (d.evoProgress) evoProgress = d.evoProgress; dekusNerfWaves = d.dekusNerfWaves || 0; newcomerBonus = d.newcomerBonus || false; newcomerBonusEnd = d.newcomerBonusEnd || 0; totalClicks = d.totalClicks || 0; totalCardsObtained = d.totalCardsObtained || 0; maxPoints = d.maxPoints || points; gameCompleted = d.gameCompleted || false; slotData.nickname = d.nickname || loadSlotMeta(currentSlot).nickname;
}

function initNewGame() {
    myCards = []; team = []; afkTeam = []; points = 100; wave = 1; playerHp = 100; activeBuffs = {}; mode = "normal"; defeatHistory = []; shopItems = [null, null, null]; freeSpins = 5; fatigue = 0; achievements = {win10:false,win50:false,win100:false,win500:false,legendaryTeam:false,secretTeam:false,level20:false,level50:false}; totalWins = 0; playerLevel = 1; playerExp = 0; upgrades = {damage:{level:0,baseCost:25,increment:2,name:"💪 Сила удара",reqLevel:1},hp:{level:0,baseCost:25,increment:5,name:"❤️ Живучесть",reqLevel:1},luck:{level:0,baseCost:30,increment:0.1,name:"🍀 Удача",reqLevel:3},crit:{level:0,baseCost:40,increment:0.03,name:"⚡ Крит. шанс",reqLevel:5},fatigueResist:{level:0,baseCost:50,increment:0.5,name:"💪 Сопр. усталости",reqLevel:10},abilityPower:{level:0,baseCost:200,increment:0.1,name:"✨ Усиление спос.",reqLevel:30}}; discoveredCards = []; hasSukunaFingers = false; deathNoteTarget = null; skipUsed = false; hasFireArtifact = false; hasCompoundV = {}; usedCodes = []; moderUnlocked = false; afkWavesCompleted = 0; highestCheckpoint = 1; rebirthCount = 0; rebirthStats = []; activeCheckpoint = 0; autoSellSettings = {"Обычная":false,"Редкая":false,"Сверх редкая":false,"Эпик":false,"Мифическая":false,"Легендарная":false}; purchasedAutoSell = {"Обычная":false,"Редкая":false,"Сверх редкая":false,"Эпик":false,"Мифическая":false,"Легендарная":false}; autoRest = {active:false,threshold:90,purchased:false}; abilityUpgradeLevel = 0; evoProgress = {wavesSaitamaGarou:0,damageGarpKuzan:0,luffyKingUnlocked:false,sgUnlocked:false,gkUnlocked:false,sevenUnlocked:false,williamUnlocked:false}; dekusNerfWaves = 0; newcomerBonus = true; newcomerBonusEnd = Date.now() + 600000; totalClicks = 0; totalCardsObtained = 0; maxPoints = 100; gameCompleted = false; for (let i = 0; i < 3; i++) { let c = createCard(getRandomRarity()); if (c) myCards.push(c); } team = [0, 1, 2];
}

function saveAll() { if (currentSlot < 0) return; slotData.myCards = myCards; slotData.team = team; slotData.afkTeam = afkTeam; slotData.points = points; slotData.wave = wave; slotData.playerHp = playerHp; slotData.activeBuffs = activeBuffs; slotData.mode = mode; slotData.defeatHistory = defeatHistory; slotData.shopItems = shopItems; slotData.upgrades = upgrades; slotData.freeSpins = freeSpins; slotData.fatigue = fatigue; slotData.achievements = achievements; slotData.totalWins = totalWins; slotData.playerLevel = playerLevel; slotData.playerExp = playerExp; slotData.discoveredCards = discoveredCards; slotData.hasSukunaFingers = hasSukunaFingers; slotData.deathNoteTarget = deathNoteTarget; slotData.skipUsed = skipUsed; slotData.hasFireArtifact = hasFireArtifact; slotData.hasCompoundV = hasCompoundV; slotData.usedCodes = usedCodes; slotData.moderUnlocked = moderUnlocked; slotData.afkWavesCompleted = afkWavesCompleted; slotData.highestCheckpoint = highestCheckpoint; slotData.rebirthCount = rebirthCount; slotData.rebirthStats = rebirthStats; slotData.activeCheckpoint = activeCheckpoint; slotData.autoSellSettings = autoSellSettings; slotData.purchasedAutoSell = purchasedAutoSell; slotData.autoRest = autoRest; slotData.abilityUpgradeLevel = abilityUpgradeLevel; slotData.evoProgress = evoProgress; slotData.dekusNerfWaves = dekusNerfWaves; slotData.newcomerBonus = newcomerBonus; slotData.newcomerBonusEnd = newcomerBonusEnd; slotData.totalClicks = totalClicks; slotData.totalCardsObtained = totalCardsObtained; slotData.maxPoints = maxPoints; slotData.gameCompleted = gameCompleted; slotData.nickname = slotData.nickname || loadSlotMeta(currentSlot).nickname; saveGameToSlot(currentSlot); window._needSave = false; }

// ========== ИГРОВЫЕ ПЕРЕМЕННЫЕ ==========
let myCards=[],team=[],afkTeam=[],points=100,wave=1,playerHp=100,currentEnemy=null,clicksSinceLastCounter=0,activeBuffs={},defeatHistory=[],mode="normal",shopItems=[null,null,null],shopRefreshTime=null,lastCardClaimTime=null,freeSpins=5,lastFreeSpinReset=null,fatigue=0,achievements={win10:false,win50:false,win100:false,win500:false,legendaryTeam:false,secretTeam:false,level20:false,level50:false},totalWins=0,playerLevel=1,playerExp=0,resurrectedThisFight=false,firstAttackThisFight=true,hasSukunaFingers=false,deathNoteTarget=null,afkActive=false,afkTimer=null,afkWavesCompleted=0,afkCurrentWave=1,usedCodes=[],moderUnlocked=false,discoveredCards=[],highestCheckpoint=1;
let rebirthCount=0, rebirthStats=[], activeCheckpoint=0, autoSellSettings={"Обычная":false,"Редкая":false,"Сверх редкая":false,"Эпик":false,"Мифическая":false,"Легендарная":false}, purchasedAutoSell={"Обычная":false,"Редкая":false,"Сверх редкая":false,"Эпик":false,"Мифическая":false,"Легендарная":false}, autoRest={active:false,threshold:90,purchased:false}, abilityUpgradeLevel=0;
let evoProgress = { wavesSaitamaGarou:0, damageGarpKuzan:0, luffyKingUnlocked:false, sgUnlocked:false, gkUnlocked:false, sevenUnlocked:false, williamUnlocked:false };
let upgrades={damage:{level:0,baseCost:25,increment:2,name:"💪 Сила удара",reqLevel:1},hp:{level:0,baseCost:25,increment:5,name:"❤️ Живучесть",reqLevel:1},luck:{level:0,baseCost:30,increment:0.1,name:"🍀 Удача",reqLevel:3},crit:{level:0,baseCost:40,increment:0.03,name:"⚡ Крит. шанс",reqLevel:5},fatigueResist:{level:0,baseCost:50,increment:0.5,name:"💪 Сопр. усталости",reqLevel:10},abilityPower:{level:0,baseCost:200,increment:0.1,name:"✨ Усиление спос.",reqLevel:30}};
let enemyStatuses = { fireTicks:0, fireDamage:0, poisonDamage:0, bleedMult:1.0, freezeStacks:0, shockChance:0, blindStacks:0 };
let hasFireArtifact = false, hasCompoundV = {}, skipUsed = false, dekusNerfWaves = 0, currentDialog = null;
let challenges = [], lastChallengeReset = null;
let comboCount = 0, lastClickTime = 0, comboMultiplier = 1;
let musicEnabled = false;
let newcomerBonus = false, newcomerBonusEnd = 0;
let fireInterval = null;
let spareBonusFromTeam = 0;
let totalClicks = 0, totalCardsObtained = 0, maxPoints = 100;
let gameCompleted = false;
window._needSave = false;

// ========== МУЗЫКА (АУДИОФАЙЛЫ) ==========
let mainMusic = null;
let battleMusic = null;
let shopMusic = null;
let currentMusic = null;

function initMusic() {
    mainMusic = new Audio("music/main.mp3");
    mainMusic.loop = true;
    mainMusic.volume = 0.3;
    
    battleMusic = new Audio("music/battle.mp3");
    battleMusic.loop = true;
    battleMusic.volume = 0.3;
    
    shopMusic = new Audio("music/shop.mp3");
    shopMusic.loop = true;
    shopMusic.volume = 0.3;
}

function stopAllMusic() {
    if (mainMusic) { mainMusic.pause(); mainMusic.currentTime = 0; }
    if (battleMusic) { battleMusic.pause(); battleMusic.currentTime = 0; }
    if (shopMusic) { shopMusic.pause(); shopMusic.currentTime = 0; }
    currentMusic = null;
}

function startMainMusic() {
    if (!musicEnabled) return;
    if (!mainMusic) initMusic();
    if (currentMusic === mainMusic) return;
    stopAllMusic();
    currentMusic = mainMusic;
    if (mainMusic) mainMusic.play().catch(e => {});
}

function startBattleMusic() {
    if (!musicEnabled) return;
    if (!battleMusic) initMusic();
    if (currentMusic === battleMusic) return;
    stopAllMusic();
    currentMusic = battleMusic;
    if (battleMusic) battleMusic.play().catch(e => {});
}

function startShopMusic() {
    if (!musicEnabled) return;
    if (!shopMusic) initMusic();
    if (currentMusic === shopMusic) return;
    stopAllMusic();
    currentMusic = shopMusic;
    if (shopMusic) shopMusic.play().catch(e => {});
}

function toggleMusic() { 
    musicEnabled = !musicEnabled; 
    if (musicEnabled) { 
        if (currentMusic) {
            currentMusic.play().catch(e => {});
        } else {
            startMainMusic();
        }
    } else { 
        stopAllMusic(); 
    } 
    let btn = document.getElementById("musicToggleBtn"); 
    if (btn) btn.innerText = musicEnabled ? "🔊" : "🔇"; 
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function getRebirthMult() { return 1 + rebirthCount * 0.3; }
function getStarMult() { let mult = 1 + rebirthCount * 0.3; if (newcomerBonus && Date.now() < newcomerBonusEnd) mult += 2; return mult; }
function createCard(r) { let templates = customCardTemplates[r] || []; if (r === "Босс") return null; let template = null; let minRebirth = (r === "Секретная") ? 1 : 0; if (templates.length > 0) { let validTemplates = templates.filter(t => (t.minRebirth || minRebirth) <= rebirthCount); if (validTemplates.length > 0) { template = validTemplates[Math.floor(Math.random() * validTemplates.length)]; } else { template = templates[Math.floor(Math.random() * templates.length)]; } } if (!template) { let s = cardStats[r] || { damage: 5, hp: 10, sellPrice: 10 }; return { id: Date.now() + Math.random() * 10000, name: "???", rarity: r, damage: s.damage, hp: s.hp, sellPrice: s.sellPrice, ability: null, universe: "?", unsellable: false, minRebirth: 0, statusAbility: null, extraStatus: null }; } let s = cardStats[r] || { damage: 5, hp: 10, sellPrice: 10 }; let n = template.name, d = template.damage ?? s.damage, hp = template.hp ?? s.hp, sp = template.sellPrice ?? s.sellPrice; let a = template.ability || null, u = template.universe || "?", uns = template.unsellable || false; if (!discoveredCards.includes(n)) { discoveredCards.push(n); saveAll(); sfxCardObtain(); } totalCardsObtained++; if (points > maxPoints) maxPoints = points; return { id: Date.now() + Math.random() * 10000, name: n, rarity: r, damage: d, hp: hp, sellPrice: sp, ability: a, universe: u, unsellable: uns, minRebirth: template.minRebirth || minRebirth, statusAbility: template.statusAbility || null, extraStatus: template.extraStatus || null }; }
function getRandomRarity() { let t = 0; for (let k in cardWeights) t += cardWeights[k]; let r = Math.random() * t, ac = 0; for (let k in cardWeights) { ac += cardWeights[k]; if (r <= ac) return k; } return "Обычная"; }
function getBossRewardRarity(w) { let m = Math.min(3, 1 + Math.floor(w / 10) / 10), wg = { ...cardWeights }; for (let r in wg) { wg[r] *= (1 + rarities.indexOf(r) * m * 0.3); } let t = 0; for (let k in wg) t += wg[k]; let r = Math.random() * t, ac = 0; for (let k in wg) { ac += wg[k]; if (r <= ac) return k; } return "Обычная"; }
function getExpNeeded(l) { return 150 * l; }
function addExp(a) { playerExp += a; let lu = false; while (playerExp >= getExpNeeded(playerLevel)) { playerExp -= getExpNeeded(playerLevel); playerLevel++; lu = true; points += Math.floor(50 * playerLevel * getStarMult()); if (playerLevel >= 20 && !achievements.level20) { achievements.level20 = true; points += Math.floor(500 * getStarMult()); } if (playerLevel >= 50 && !achievements.level50) { achievements.level50 = true; points += Math.floor(2000 * getStarMult()); } } if (lu) { renderUpgrades(); sfxLevelUp(); showFloatingText("🎉 УРОВЕНЬ " + playerLevel + "!", "#f5af19"); } updateLevelDisplay(); saveAll(); }
function updateLevelDisplay() { let el = document.getElementById("playerLevel"); if (el) el.innerText = playerLevel; el = document.getElementById("playerExp"); if (el) el.innerText = Math.floor(playerExp); let n = getExpNeeded(playerLevel); el = document.getElementById("expToNext"); if (el) el.innerText = n; el = document.getElementById("expBar"); if (el) el.style.width = (playerExp / n) * 100 + "%"; }
function isUpgradeUnlocked(k) { return playerLevel >= upgrades[k].reqLevel; }
function getRestCost() { return Math.min(200, Math.floor(30 + fatigue * 2.5)); }
function increaseFatigue(clickSpeedMultiplier = 1) { let resist = upgrades.fatigueResist.level * upgrades.fatigueResist.increment; if (hasSukunaFingers) resist *= 4; team.forEach(idx => { let cd = myCards[idx]; if (cd?.ability?.type === 'fatigueResist') resist += cd.ability.value; if (cd?.ability?.type === 'bossDouble' && currentEnemy?.isBoss) resist = 100; }); let baseIncrease = 2 * clickSpeedMultiplier; let increase = Math.max(0.1, baseIncrease - resist); fatigue = Math.min(100, fatigue + increase); updateFatigue(); updateRestBtn(); checkAutoRest(); }
function rest() { let c = getRestCost(); if (points < c) return; points -= c; fatigue = Math.max(0, fatigue - 40); updateFatigue(); updateRestBtn(); renderPoints(); }
function updateFatigue() { let el = document.getElementById("fatiguePercent"); if (el) el.innerText = fatigue.toFixed(1); el = document.getElementById("fatigueBar"); if (el) el.style.width = fatigue + "%"; }
function updateRestBtn() { let el = document.getElementById("restCost"); if (el) el.innerText = getRestCost(); }
function checkAutoRest() { if (!autoRest.active || !autoRest.purchased || rebirthCount < 3) return; if (fatigue >= autoRest.threshold) { let cost = getRestCost(); if (points >= cost) { points -= cost; fatigue = Math.max(0, fatigue - 40); updateFatigue(); updateRestBtn(); renderPoints(); } } }
function checkAchievements() { if (totalWins >= 10 && !achievements.win10) { achievements.win10 = true; points += Math.floor(100 * getStarMult()); } if (totalWins >= 50 && !achievements.win50) { achievements.win50 = true; points += Math.floor(500 * getStarMult()); } if (totalWins >= 100 && !achievements.win100) { achievements.win100 = true; points += Math.floor(1000 * getStarMult()); } if (totalWins >= 500 && !achievements.win500) { achievements.win500 = true; points += Math.floor(5000 * getStarMult()); } let al = team.length === 6 && team.every(i => myCards[i]?.rarity === "Легендарная"); if (al && !achievements.legendaryTeam) { achievements.legendaryTeam = true; points += Math.floor(1000 * getStarMult()); } let as = team.length === 6 && team.every(i => myCards[i]?.rarity === "Секретная"); if (as && !achievements.secretTeam) { achievements.secretTeam = true; points += Math.floor(5000 * getStarMult()); } saveAll(); }
function claimCardByTimer() { let n = Date.now(); if (mode !== "moder" && lastCardClaimTime && (n - lastCardClaimTime) < 7200000) return; let c = createCard(getRandomRarity()); if (!c) return; myCards.push(c); lastCardClaimTime = n; saveAll(); renderMyCards(); updateClaimTimer(); sfxCardObtain(); }
function updateClaimTimer() { let n = Date.now(), r = (mode !== "moder" && lastCardClaimTime) ? Math.max(0, 7200000 - (n - lastCardClaimTime)) : 0; let d = document.getElementById("claimTimer"); if (d) { if (r <= 0) d.innerHTML = "✅ Можно получать!"; else { let h = Math.floor(r / 3600000), m = Math.floor((r % 3600000) / 60000); d.innerHTML = '⏳ Доступно через: ' + h + 'ч ' + m + 'м'; } } }
function checkFreeSpinReset() { let n = Date.now(); if (!lastFreeSpinReset) { lastFreeSpinReset = n; saveAll(); return; } let p = (n - lastFreeSpinReset) / 3600000; if (p >= 24) { let rs = Math.floor(p / 24); freeSpins += rs * 3; lastFreeSpinReset += rs * 86400000; saveAll(); } }
function useFreeSpin() { if (freeSpins <= 0) return; let c = createCard(getRandomRarity()); if (!c) return; myCards.push(c); freeSpins--; saveAll(); renderMyCards(); sfxCardObtain(); }
function buySpin() { if (points < 150) return; points -= 150; let c = createCard(getRandomRarity()); if (!c) return; myCards.push(c); saveAll(); renderMyCards(); renderPoints(); sfxCardObtain(); }
function sellCard(idx) { let c = myCards[idx]; if (!c || c.unsellable) return; let requiresConfirmation = ["Мифическая", "Легендарная", "Секретная", "Босс"].includes(c.rarity); if (!requiresConfirmation) { doSellCard(idx); return; } if (confirm("⚠️ Вы точно хотите продать " + c.name + " (" + c.rarity + ")?")) doSellCard(idx); }
function doSellCard(idx) { let c = myCards[idx]; points += Math.floor((c.sellPrice || 0) * getStarMult()); if (points > maxPoints) maxPoints = points; removeCard(idx); }
function removeCard(idx) { let p = team.indexOf(idx); if (p !== -1) team.splice(p, 1); p = afkTeam.indexOf(idx); if (p !== -1) afkTeam.splice(p, 1); myCards.splice(idx, 1); for (let i = 0; i < team.length; i++) if (team[i] > idx) team[i]--; for (let i = 0; i < afkTeam.length; i++) if (afkTeam[i] > idx) afkTeam[i]--; saveAll(); renderAll(); updatePlayerStats(); }
function toggleTeam(idx) { let p = team.indexOf(idx); if (p !== -1) team.splice(p, 1); else { if (afkTeam.includes(idx)) return; if (team.length >= 6) return; team.push(idx); } saveAll(); renderAll(); updatePlayerStats(); checkAchievements(); }
function toggleAfk(idx) { let p = afkTeam.indexOf(idx); if (p !== -1) afkTeam.splice(p, 1); else { if (team.includes(idx)) return; if (afkTeam.length >= 6) return; afkTeam.push(idx); } saveAll(); renderAll(); }
function countTeamDuplicates() { let counts = {}; team.forEach(idx => { let cd = myCards[idx]; if (cd) { counts[cd.name] = (counts[cd.name] || 0) + 1; } }); return counts; }
function getStatusEffects() { let bleed = 1.0, freeze = 0, shock = 0, blind = 0, fireDmg = 0, fireDur = 0, poisonDmg = 0; let dupes = countTeamDuplicates(); let dupMult = {}; for (let name in dupes) { if (dupes[name] >= 3) dupMult[name] = Math.floor(dupes[name] / 2); else dupMult[name] = 1; } team.forEach(idx => { let cd = myCards[idx]; if (!cd) return; let mult = dupMult[cd.name] || 1; let statuses = [cd?.statusAbility, cd?.ability?.type === 'sevenSpecial' ? { type: 'blind', value: 2 } : null, ...(cd?.extraStatus || [])].filter(Boolean); statuses.forEach(sa => { if (sa.type === 'bleed') bleed += sa.value * mult; if (sa.type === 'freezeStacks') freeze += sa.value * mult; if (sa.type === 'shock') shock += sa.chance * mult; if (sa.type === 'blind') blind += sa.value * mult; if (sa.type === 'fire') { fireDmg += sa.damage * mult; fireDur = Math.max(fireDur, sa.duration); } if (sa.type === 'poison') poisonDmg += sa.damage * mult; }); }); return { bleed, freeze, shock, blind, fireDmg, fireDur, poisonDmg }; }
function applyStatusEffects() { let eff = getStatusEffects(); enemyStatuses.bleedMult = eff.bleed; enemyStatuses.freezeStacks = eff.freeze; enemyStatuses.shockChance = eff.shock; enemyStatuses.blindStacks = eff.blind; enemyStatuses.fireTicks = Math.floor(eff.fireDur / 1000); enemyStatuses.fireDamage = eff.fireDmg; enemyStatuses.poisonDamage = eff.poisonDmg; }
function getPassiveModifiers() { let dm = 1.0, tm = 1.0, bb = 0, hm = 1.0, sb = 0; let ab = 1 + abilityUpgradeLevel * upgrades.abilityPower.increment; let dupes = countTeamDuplicates(); let dupMult = {}; for (let name in dupes) { if (dupes[name] >= 3) dupMult[name] = Math.floor(dupes[name] / 2); else dupMult[name] = 1; } team.forEach(idx => { let cd = myCards[idx]; if (!cd) return; let mult = dupMult[cd.name] || 1; let a = cd.ability; if (a) { if (a.type === 'damageAura') dm += a.value * ab * mult; if (a.type === 'bossDamage') bb += a.value * ab * mult; if (a.type === 'damageReduction') tm -= a.value * ab * mult; if (a.type === 'hpBuff') hm += a.value * ab * mult; if (a.type === 'bossSupport' && currentEnemy?.isBoss) { fatigue = Math.max(0, fatigue - 50); bb += 0.15 * ab * mult; } if (a.type === 'bossDoubleSelf' && currentEnemy?.isBoss) dm += 1.0 * ab * mult; if (a.type === 'bossDouble' && currentEnemy?.isBoss) dm += 1.0 * ab * mult; if (a.type === 'sevenSpecial') { tm -= (a.damageReduction || 0.10) * ab * mult; } if (a.type === 'bossDamage' && a.bossReduction && currentEnemy?.isBoss) tm -= a.bossReduction * ab * mult; if (a.type === 'bossDamage' && a.damageReduction && !currentEnemy?.isBoss) tm -= a.damageReduction * ab * mult; if (a.type === 'damageAura' && a.damageTakenMod) tm += a.damageTakenMod * ab * mult; if (a.type === 'dmgTakenIncrease') tm += a.value * ab * mult; if (a.type === 'spareChanceBonus') { sb += a.value * ab; } if (a.type === 'zenoCheckpoint') { window.hasZenoInTeam = true; } } if (cd.statusAbility?.type === 'absoluteFreeze') tm -= cd.statusAbility.value * ab * mult; if (cd.statusAbility?.type === 'bossDamageAura' && currentEnemy?.isBoss) bb += cd.statusAbility.value * ab * mult; }); if (dekusNerfWaves > 0) dm -= 0.30; if (hasSukunaFingers) { if (playerLevel < 30) dm *= 0.1; else dm += 0.5; } dm *= getRebirthMult(); spareBonusFromTeam = sb; return { dmgMult: dm, takenMult: Math.max(0.01, tm), bossBonus: bb, hpMult: hm }; }
function updatePlayerStats() { let m = getPassiveModifiers(); let fm = 1 - fatigue / 100; let base = 5 + upgrades.damage.level * upgrades.damage.increment; let total = (base + (window.teamDamage || 0)) * fm; let db = 1.0; if (activeBuffs["doubleDamage"] && activeBuffs["doubleDamage"] > Date.now()) db = 2.0; else if (activeBuffs["dmg13"] && activeBuffs["dmg13"] > Date.now()) db = 1.3; else if (activeBuffs["dmg15"] && activeBuffs["dmg15"] > Date.now()) db = 1.5; else if (activeBuffs["quadDamage"] && activeBuffs["quadDamage"] > Date.now()) db = 4.0; let fd = Math.floor(total * m.dmgMult * db); let el = document.getElementById("playerDamage"); if (el) el.innerText = fd; window.playerFinalDamage = fd; let baseHp = 50 + upgrades.hp.level * upgrades.hp.increment; let totalHp = (baseHp + (window.teamHpBonus || 0)) * fm * m.hpMult; if (hasSukunaFingers && playerLevel >= 30) totalHp *= 1.4; let hb = 1.0; if (activeBuffs["doubleHp"] && activeBuffs["doubleHp"] > Date.now()) hb = 2.0; else if (activeBuffs["tripleHp"] && activeBuffs["tripleHp"] > Date.now()) hb = 3.0; let maxHp = Math.floor(totalHp * hb); if (playerHp > maxHp) playerHp = maxHp; el = document.getElementById("playerHp"); if (el) el.innerText = Math.floor(playerHp); el = document.getElementById("playerMaxHp"); if (el) el.innerText = maxHp; window.playerMaxHp = maxHp; }
function showFloatingText(text, color) { const area = document.getElementById('clickArea'); if (!area) return; const el = document.createElement('div'); el.className = 'floating-text'; el.textContent = text; el.style.color = color; el.style.left = Math.random() * 60 + 20 + '%'; el.style.top = '50%'; area.appendChild(el); setTimeout(() => el.remove(), 1000); }
function showModal(title, content) { let el = document.getElementById("modalContent"); if (el) el.innerHTML = '<h2>' + title + '</h2><p style="margin-top:10px;white-space:pre-line;">' + content + '</p><button class="btn btn-primary" style="width:100%;padding:12px;" onclick="closeModal()">Закрыть</button>'; el = document.getElementById("modalOverlay"); if (el) el.style.display = "flex"; }
function closeModal() { let el = document.getElementById("modalOverlay"); if (el) el.style.display = "none"; }
function startFireEffectPassive(damage, durationMs) { if (fireInterval) { clearInterval(fireInterval); fireInterval = null; } let elapsed = 0; fireInterval = setInterval(() => { if (!currentEnemy || currentEnemy.hp <= 0) { if (fireInterval) { clearInterval(fireInterval); fireInterval = null; } return; } currentEnemy.hp -= damage; showFloatingText("🔥 -" + damage, "#ff6b6b"); renderEnemy(); elapsed += 2000; if (elapsed >= durationMs || currentEnemy.hp <= 0) { if (fireInterval) { clearInterval(fireInterval); fireInterval = null; } if (currentEnemy && currentEnemy.hp <= 0) victory(); } }, 2000); }
function generateEnemy() { firstAttackThisFight = true; let el = document.getElementById("spareBtn"); if (el) el.style.display = "none"; el = document.getElementById("dialogBox"); if (el) el.style.display = "none"; currentDialog = null; let world = getCurrentWorld(); let isBoss = wave % 10 === 0, isUnique = bossTemplates[wave]; let hp, dmg, name, dialogue = "", enemyStat = null; if (isUnique) { let bt = bossTemplates[wave]; hp = Math.floor((50 + wave * 12) * bt.hpMult); dmg = Math.floor((15 + wave * 6) * bt.dmgMult); name = bt.name; dialogue = bt.dialogue || ""; if (bt.enemyStatus) enemyStat = bt.enemyStatus; showBossDialogue(dialogue); sfxBossAppear(); if (wave === 10000) currentDialog = finalBossResponses; } else if (isBoss) { hp = Math.floor((50 + wave * 12) * 4); dmg = Math.floor((15 + wave * 6) * 3); name = "👑 БОСС"; hideBossDialogue(); } else { hp = 50 + wave * 12; dmg = 15 + wave * 6; name = enemyNames[Math.floor(Math.random() * enemyNames.length)]; let randomStat = enemyStatusPool[Math.floor(Math.random() * enemyStatusPool.length)]; if (randomStat) enemyStat = randomStat; hideBossDialogue(); } enemyStatuses = { fireTicks:0, fireDamage:0, poisonDamage:0, bleedMult:1.0, freezeStacks:0, shockChance:0, blindStacks:0 }; if (enemyStat) { if (enemyStat.type === "freezeStacks") enemyStatuses.freezeStacks = enemyStat.value; if (enemyStat.type === "bleed") enemyStatuses.bleedMult = 1 + enemyStat.value; if (enemyStat.type === "shock") enemyStatuses.shockChance = enemyStat.chance; } applyStatusEffects(); currentEnemy = { name, hp, maxHp:hp, damage:dmg, isBoss:isBoss||isUnique }; startBattleMusic(); renderEnemy(); updateStatusDisplay(); updateEnemyStatusDisplay(); }
function showBossDialogue(msg) { let d = document.getElementById("bossDialogue"); if (d) { d.innerText = '«' + msg + '»'; d.style.display = "block"; } }
function hideBossDialogue() { let d = document.getElementById("bossDialogue"); if (d) d.style.display = "none"; }

function spareBoss() {
    if (!currentEnemy || !currentEnemy.isBoss || currentEnemy.hp <= 0) return;
    if (currentEnemy.hp > currentEnemy.maxHp * 0.3) {
        alert("⚠️ Здоровье босса должно быть ниже 30% чтобы пощадить!");
        return;
    }
    let spareChance = 0.30 + spareBonusFromTeam;
    if (Math.random() < spareChance) {
        let bt = bossTemplates[wave];
        if (bt && bt.spareReward) {
            let template = customCardTemplates["Босс"].find(t => t.name === bt.spareReward);
            if (template) {
                let rewardCard = createCardFromTemplate(template, "Босс");
                myCards.push(rewardCard);
                sfxCardObtain();
                alert("🎉 Босс присоединился! Получена карта: " + bt.spareReward + " (шанс был " + Math.floor(spareChance*100) + "%)");
                saveAll();
            }
        }
        if (bt && bt.isSpecial && wave === 500) { 
            checkEvolutionQuests(); 
        }
        currentEnemy.hp = 0;
        victory();
    } else {
        let extraDmg = Math.floor(currentEnemy.damage * 3);
        playerHp -= extraDmg;
        alert("💢 Босс отказался! Он наносит тройной урон: " + extraDmg + "!");
        let el = document.getElementById("spareBtn");
        if (el) el.style.display = "none";
        if (playerHp <= 0) defeat();
        else { renderEnemy(); updatePlayerStats(); }
    }
}

function createCardFromTemplate(tm, r) { let s = cardStats[r]; let d = tm.damage ?? s.damage, hp = tm.hp ?? s.hp, sp = tm.sellPrice ?? s.sellPrice; let n = tm.name, a = tm.ability || null, u = tm.universe || "?", uns = tm.unsellable || false; if (!discoveredCards.includes(n)) { discoveredCards.push(n); saveAll(); } totalCardsObtained++; if (points > maxPoints) maxPoints = points; return { id: Date.now() + Math.random() * 10000, name: n, rarity: r, damage: d, hp: hp, sellPrice: sp, ability: a, universe: u, unsellable: uns, minRebirth: tm.minRebirth || 0, statusAbility: tm.statusAbility || null, extraStatus: tm.extraStatus || null }; }
function checkEvolutionQuests() { 
    if (rebirthCount < 5) return; 
    let tNames = team.map(idx => myCards[idx]?.name).filter(Boolean); 
    let luffyForms = ["Луффи", "Луффи (2 гир)", "Луффи (Таймскип)", "Луффи (4 гир)", "Луффи: Ника, Бог Солнца"];
    if (wave === 500 && currentEnemy && currentEnemy.name === "Король Пиратов" && !evoProgress.luffyKingUnlocked) {
        let hasAllLuffys = luffyForms.every(form => tNames.includes(form));
        if (hasAllLuffys && currentEnemy.hp <= 0) {
            evoProgress.luffyKingUnlocked = true; 
            let template = customCardTemplates["Эволюционная"].find(t => t.name === "Луффи : Король пиратов"); 
            if (template) { let c = createCardFromTemplate(template, "Эволюционная"); c.unsellable = true; myCards.push(c); alert("🧬 Эволюция: Луффи : Король пиратов!\n\nТы собрал всех Луффи и пощадил Короля Пиратов!"); sfxRebirth(); saveAll(); } 
        }
    }
    if (tNames.includes("Сайтама") && tNames.includes("Бог Гароу") && !evoProgress.sgUnlocked) { evoProgress.wavesSaitamaGarou++; if (evoProgress.wavesSaitamaGarou >= 20000) { evoProgress.sgUnlocked = true; let template = customCardTemplates["Эволюционная"].find(t => t.name === "Сайтама/Гароу"); if (template) { let c = createCardFromTemplate(template, "Эволюционная"); c.unsellable = true; myCards.push(c); alert("🧬 Эволюция: Сайтама/Гароу!"); sfxRebirth(); saveAll(); } } } 
    if (tNames.includes("Молодой Гарп") && tNames.includes("Кудзан") && !evoProgress.gkUnlocked) { evoProgress.damageGarpKuzan += (window.playerFinalDamage || 0); if (evoProgress.damageGarpKuzan >= 100000) { evoProgress.gkUnlocked = true; let template = customCardTemplates["Эволюционная"].find(t => t.name === "Гарп/Кудзан"); if (template) { let c = createCardFromTemplate(template, "Эволюционная"); c.unsellable = true; myCards.push(c); alert("🧬 Эволюция: Гарп/Кудзан!"); sfxRebirth(); saveAll(); } } } 
    let sevenMembersNew = ["Хоумлендер", "Звёздочка", "Мреющий", "Ракета", "Пучино", "Королева Мэйв"]; 
    if (tNames.length >= 6 && sevenMembersNew.every(n => tNames.includes(n)) && !evoProgress.sevenUnlocked && playerLevel >= 20) { if (sevenMembersNew.every(n => hasCompoundV[n])) { evoProgress.sevenUnlocked = true; let template = customCardTemplates["Эволюционная"].find(t => t.name === "Семёрка"); if (template) { let c = createCardFromTemplate(template, "Эволюционная"); c.unsellable = true; myCards.push(c); alert("🧬 Эволюция: Семёрка!\n\nВся Семёрка с Препаратом V!"); sfxRebirth(); saveAll(); } } } 
    if (wave === 500 && currentEnemy && currentEnemy.name === "Омни-Мэн" && !evoProgress.williamUnlocked) { let allCommon = tNames.length === 6 && team.every(idx => myCards[idx]?.rarity === "Обычная"); if (allCommon) { evoProgress.williamUnlocked = true; let template = customCardTemplates["Эволюционная"].find(t => t.name === "Уильям Фрэнсис"); if (template) { let c = createCardFromTemplate(template, "Эволюционная"); c.unsellable = true; myCards.push(c); alert("🧬 Эволюция: Уильям Фрэнсис!"); sfxRebirth(); saveAll(); } } } 
    renderEvoTab(); 
}
function handleClick() { initAudio(); if (playerHp <= 0) { resetGame(); return; } if (!currentEnemy || currentEnemy.hp <= 0) return; if (deathNoteTarget && wave === deathNoteTarget && !skipUsed) { currentEnemy.hp = 0; skipUsed = true; deathNoteTarget = null; victory(); return; } totalClicks++; let now = Date.now(); let clickInterval = lastClickTime ? (now - lastClickTime) / 1000 : 999; lastClickTime = now; let fatigueMultiplier = 1; if (clickInterval < 0.1) { fatigueMultiplier = 3; } else if (clickInterval < 0.5) { comboCount++; } else { comboCount = 0; comboMultiplier = 1; } if (comboCount >= 50) comboMultiplier = 5; else if (comboCount >= 25) comboMultiplier = 3; else if (comboCount >= 10) comboMultiplier = 2; if (comboCount === 10) showFloatingText("⚡ КОМБО x2!", "#ffaa00"); if (comboCount === 25) showFloatingText("⚡ КОМБО x3!", "#ff8800"); if (comboCount === 50) showFloatingText("⚡ КОМБО x5!", "#ff4400"); if (firstAttackThisFight) { firstAttackThisFight = false; for (let idx of team) { let cd = myCards[idx]; if (cd?.ability) { let canWipe = cd.ability.type === 'oneShot' || cd.ability.type === 'instantWin' || cd.ability.type === 'erase'; let nonBossWipe = cd.ability.type === 'nonBossOneShot' && !currentEnemy.isBoss; if ((canWipe || nonBossWipe) && Math.random() < (cd.ability.chance || 0) * (1 + abilityUpgradeLevel * 0.1)) { currentEnemy.hp = 0; sfxAbility(); victory(); return; } } } if (enemyStatuses.poisonDamage > 0) { currentEnemy.hp -= enemyStatuses.poisonDamage; if (currentEnemy.hp <= 0) { victory(); return; } } } let dmg = window.playerFinalDamage || 1; let m = getPassiveModifiers(); if (currentEnemy.isBoss) dmg = Math.floor(dmg * (1 + m.bossBonus)); let cc = upgrades.crit.level * upgrades.crit.increment; team.forEach(idx => { let cd = myCards[idx]; if (cd?.ability?.type === 'critChance') cc += cd.ability.value * (1 + abilityUpgradeLevel * 0.1); if (cd?.ability?.type === 'damageMultChance' && Math.random() < cd.ability.chance) dmg = Math.floor(dmg * cd.ability.mult); }); dmg = Math.floor(dmg * comboMultiplier); if (Math.random() < cc) { dmg = Math.floor(dmg * 2); sfxCrit(); showFloatingText("💥 КРИТ! x2", "#feca57"); } else { sfxClick(); showFloatingText("-" + dmg, "#fff"); } dmg = Math.floor(dmg * enemyStatuses.bleedMult); checkEvolutionQuests(); if (enemyStatuses.fireTicks > 0 && enemyStatuses.fireDamage > 0) { startFireEffectPassive(enemyStatuses.fireDamage, enemyStatuses.fireTicks * 1000); enemyStatuses.fireTicks = 0; } currentEnemy.hp -= dmg; team.forEach(idx => { let cd = myCards[idx]; if (cd?.ability?.type === 'clickDmgSelf' && currentEnemy.hp > 0) { playerHp -= Math.floor(window.playerMaxHp * cd.ability.value); } }); if (playerHp <= 0) { defeat(); return; } if (currentEnemy.hp <= 0) { victory(); return; } clicksSinceLastCounter++; let maxClicks = Math.max(1, 3 - enemyStatuses.freezeStacks + enemyStatuses.blindStacks); if (clicksSinceLastCounter >= maxClicks) { playerHp -= Math.floor(currentEnemy.damage * m.takenMult); clicksSinceLastCounter = 0; if (playerHp <= 0) { defeat(); return; } } if (Math.random() < enemyStatuses.shockChance && clicksSinceLastCounter === maxClicks - 1) { clicksSinceLastCounter = 0; } increaseFatigue(fatigueMultiplier); renderEnemy(); let el = document.getElementById("playerHp"); if (el) el.innerText = Math.floor(playerHp); el = document.getElementById("clicksToCounter"); if (el) el.innerText = maxClicks - clicksSinceLastCounter; updateStatusDisplay(); window._needSave = true; }

function victory() {
    let isBoss = wave % 10 === 0;
    let rew = isBoss ? Math.floor(wave / 2 * getStarMult()) : Math.floor(wave / 3 * getStarMult());
    points += rew;
    if (points > maxPoints) maxPoints = points;
    totalWins++;
    addExp(isBoss ? 25 : 5);
    if (isBoss && wave % 50 === 0) { highestCheckpoint = Math.max(highestCheckpoint, wave); saveAll(); }
    if (wave >= 10000 && isBoss) { gameCompleted = true; saveAll(); alert("🏆 ПОЗДРАВЛЯЕМ! Вы победили финального босса на 10000 волне!\n\nИгра пройдена! Но вы можете продолжать играть бесконечно.\n\nВсе ваши чекпоинты сохранены."); }
    if (isBoss) { let rarity = getBossRewardRarity(wave); if (rarity !== "Босс") { let c = createCard(rarity); if (c) myCards.push(c); } renderMyCards(); let hasZeno = team.some(idx => myCards[idx]?.ability?.type === 'zenoCheckpoint'); if (hasZeno && Math.random() < 0.10) { let nextCp = Math.floor(wave / 50) * 50 + 50; if (nextCp > highestCheckpoint) { highestCheckpoint = nextCp; saveAll(); } showFloatingText("🌀 ЗЕНО: чекпоинт " + nextCp + "!", "#9b59b6"); } sfxVictory(); } else { sfxVictory(); }
    if (team.some(idx => myCards[idx]?.ability?.type === 'teamHealOnWave')) { playerHp = Math.min(window.playerMaxHp, playerHp + window.playerMaxHp * 0.02); }
    if (team.some(idx => myCards[idx]?.ability?.type === 'sevenSpecial')) { playerHp = Math.min(window.playerMaxHp, playerHp + window.playerMaxHp * 0.05); }
    enemyStatuses.poisonDamage = 0;
    if (!gameCompleted || wave < 10000) wave++;
    if (dekusNerfWaves > 0) dekusNerfWaves--;
    increaseFatigue();
    playerHp = Math.min(window.playerMaxHp, playerHp + Math.floor(window.playerMaxHp * 0.2));
    clicksSinceLastCounter = 0;
    team.forEach(idx => { let cd = myCards[idx]; if (cd?.ability?.type === 'healOnWin') playerHp = Math.min(window.playerMaxHp, playerHp + window.playerMaxHp * cd.ability.percent); });
    checkAutoSell();
    generateEnemy();
    renderPoints();
    updatePlayerStats();
    renderTeam();
    checkAchievements();
    saveAll();
}

function defeat() {
    if (!resurrectedThisFight) { for (let idx of team) { let cd = myCards[idx]; if (cd?.ability?.type === 'resurrect' && Math.random() < cd.ability.chance * (1 + abilityUpgradeLevel * 0.1)) { playerHp = window.playerMaxHp; resurrectedThisFight = true; sfxAbility(); showFloatingText("✨ Воскрешение!", "#2ecc71"); renderEnemy(); updatePlayerStats(); return; } } }
    let bonus = 0; team.forEach(idx => { let cd = myCards[idx]; if (cd?.ability?.type === 'deathBonus') bonus += cd.ability.value; });
    if (bonus > 0) points += Math.floor(points * bonus);
    if (points > maxPoints) maxPoints = points;
    defeatHistory.unshift({ wave, hp: Math.floor(playerHp) });
    if (defeatHistory.length > 10) defeatHistory.pop();
    sfxDefeat();
    let nearestCheckpoint = Math.floor(wave / 50) * 50;
    if (nearestCheckpoint > highestCheckpoint) { highestCheckpoint = nearestCheckpoint; }
    if (activeCheckpoint > 0 && activeCheckpoint <= highestCheckpoint) { wave = activeCheckpoint; playerHp = window.playerMaxHp || 100; clicksSinceLastCounter = 0; fatigue = Math.max(0, fatigue - 20); updateFatigue(); updateRestBtn(); resurrectedThisFight = false; generateEnemy(); saveAll(); renderEnemy(); renderDefeatHistory(); updatePlayerStats(); renderCheckpoints(); return; }
    if (highestCheckpoint > 1) { let useCp = confirm("💀 Вы погибли на волне " + wave + "!\n\nУ вас есть чекпоинт на волне " + highestCheckpoint + ".\n\nНачать с чекпоинта? (OK = Да, Отмена = с 1 волны)"); if (useCp) { activeCheckpoint = highestCheckpoint; wave = highestCheckpoint; playerHp = window.playerMaxHp || 100; clicksSinceLastCounter = 0; fatigue = Math.max(0, fatigue - 20); updateFatigue(); updateRestBtn(); resurrectedThisFight = false; generateEnemy(); saveAll(); renderEnemy(); renderDefeatHistory(); updatePlayerStats(); renderCheckpoints(); return; } }
    wave = 1; playerHp = window.playerMaxHp || 100; clicksSinceLastCounter = 0; generateEnemy(); fatigue = Math.max(0, fatigue - 20); updateFatigue(); updateRestBtn(); resurrectedThisFight = false; saveAll(); renderEnemy(); renderDefeatHistory(); updatePlayerStats();
}

function resetGame() { wave = 1; playerHp = window.playerMaxHp || 100; clicksSinceLastCounter = 0; generateEnemy(); fatigue = 0; updateFatigue(); updateRestBtn(); saveAll(); renderEnemy(); }
function checkAutoSell() { if (rebirthCount < 1) return; let anyActive = false; for (let r in autoSellSettings) { if (autoSellSettings[r]) { anyActive = true; break; } } if (!anyActive) return; for (let i = myCards.length - 1; i >= 0; i--) { let c = myCards[i]; if (!c.unsellable && autoSellSettings[c.rarity]) { points += Math.floor((c.sellPrice || 0) * getStarMult()); if (points > maxPoints) maxPoints = points; removeCard(i); } } saveAll(); renderMyCards(); renderPoints(); }
function startAfk() { if (afkActive || !afkTeam.length) return; afkActive = true; afkCurrentWave = wave; let el = document.getElementById("afkStatus"); if (el) { el.innerText = "Активен"; el.className = "afk-active"; } el = document.getElementById("toggleAfkBtn"); if (el) el.innerText = "⏹ Остановить"; runAfkTick(); }
function stopAfk() { afkActive = false; if (afkTimer) clearTimeout(afkTimer); let el = document.getElementById("afkStatus"); if (el) { el.innerText = "Неактивен"; el.className = "afk-inactive"; } el = document.getElementById("toggleAfkBtn"); if (el) el.innerText = "▶ Запустить"; }
function runAfkTick() { if (!afkActive) return; let dmg = (5 + upgrades.damage.level * upgrades.damage.increment + (window.afkTeamDamage || 0)) * 0.8; let ehp = 50 + afkCurrentWave * 12; let edmg = 15 + afkCurrentWave * 6; if (afkCurrentWave % 10 === 0) { ehp *= 4; edmg *= 3; } ehp -= dmg; if (ehp <= 0) { let rew = afkCurrentWave % 10 === 0 ? Math.floor(afkCurrentWave / 2 * getStarMult()) : Math.floor(afkCurrentWave / 3 * getStarMult()); points += rew; if (points > maxPoints) maxPoints = points; totalWins++; addExp(afkCurrentWave % 10 === 0 ? 25 : 5); if (afkCurrentWave % 10 === 0) { let rarity = getBossRewardRarity(afkCurrentWave); if (rarity !== "Босс") { let c = createCard(rarity); if (c) myCards.push(c); } renderMyCards(); } afkCurrentWave++; afkWavesCompleted++; let el = document.getElementById("afkWave"); if (el) el.innerText = afkCurrentWave; el = document.getElementById("afkWavesCompleted"); if (el) el.innerText = afkWavesCompleted; playerHp = Math.min(window.playerMaxHp, playerHp + Math.floor((50 + upgrades.hp.level * upgrades.hp.increment + (window.afkTeamHpBonus || 0)) * 0.8 * 0.2)); increaseFatigue(); renderPoints(); updatePlayerStats(); checkAchievements(); checkAutoSell(); } else { if (Math.random() < 0.33) { playerHp -= Math.floor(edmg * 0.9); if (playerHp <= 0) { afkCurrentWave = 1; playerHp = (50 + upgrades.hp.level * upgrades.hp.increment + (window.afkTeamHpBonus || 0)) * 0.8; fatigue = Math.max(0, fatigue - 20); updateFatigue(); updateRestBtn(); let el = document.getElementById("afkWave"); if (el) el.innerText = afkCurrentWave; } } } let el = document.getElementById("playerHp"); if (el) el.innerText = Math.floor(playerHp); if (afkActive) afkTimer = setTimeout(runAfkTick, 2000); saveAll(); }
function toggleCheckpoint(cp) { if (activeCheckpoint === cp) { activeCheckpoint = 0; } else { activeCheckpoint = cp; } saveAll(); renderCheckpoints(); }
function genShopItem() { let r = Math.random(); if (r < 0.3) { return { ...specialPotions[Math.floor(Math.random() * specialPotions.length)], type: "buff", id: Date.now() + "_" + Math.random() }; } let poolKeys = Object.keys(shopItemsPool); let key = poolKeys[Math.floor(Math.random() * poolKeys.length)]; let items = shopItemsPool[key]; return { ...items[Math.floor(Math.random() * items.length)], id: Date.now() + "_" + Math.random() }; }
function refreshShop() { for (let i = 0; i < 3; i++) shopItems[i] = genShopItem(); shopRefreshTime = Date.now(); saveAll(); renderShop(); }
function refreshShopNow() { if (points < 1000) return; points -= 1000; refreshShop(); renderPoints(); }
function stackBuff(buffId, duration) { if (activeBuffs[buffId] && activeBuffs[buffId] > Date.now()) { activeBuffs[buffId] += duration; } else { activeBuffs[buffId] = Date.now() + duration; } saveAll(); renderActiveBuffs(); }
window.buyShopItem = function (i) { let it = shopItems[i]; if (!it || points < it.cost) return; points -= it.cost; if (it.type === "card") { let c = createCard(it.rarity); if (!c) return; myCards.push(c); renderMyCards(); sfxCardObtain(); } else if (it.type === "buff") { stackBuff(it.buffId, it.duration); } shopItems[i] = null; saveAll(); renderShop(); renderPoints(); renderActiveBuffs(); updatePlayerStats(); };
function showCompoundVModal() { if (rebirthCount < 4 || points < 5000) return; let html = '<h2>💉 Выберите героя</h2><div style="max-height:300px;overflow-y:auto;">'; if (!team.length) { html += '<p style="color:#888;">Нет героев в команде.</p>'; } else { team.forEach((idx, s) => { let cd = myCards[idx]; if (!cd) return; let hasV = hasCompoundV[cd.name] || false; html += '<div class="team-select-item ' + (hasV ? 'disabled' : '') + '" onclick="' + (hasV ? '' : 'applyCompoundV(\'' + cd.name.replace(/'/g, "\\'") + '\')') + '"><span>' + escapeHtml(cd.name) + '</span><span>' + (hasV ? '✅ Куплен' : '▶ Выбрать') + '</span></div>'; }); } html += '</div><button class="btn" style="width:100%;margin-top:10px;background:#e74c3c;" onclick="closeModal()">Отмена</button>'; let el = document.getElementById("modalContent"); if (el) el.innerHTML = html; el = document.getElementById("modalOverlay"); if (el) el.style.display = "flex"; }
function applyCompoundV(name) { if (points < 5000) return; if (hasCompoundV[name]) return; points -= 5000; hasCompoundV[name] = true; saveAll(); renderAll(); updatePlayerStats(); closeModal(); }
window.buySukuna = function () { if (rebirthCount < 4 || points < 15000) return; points -= 15000; hasSukunaFingers = true; saveAll(); renderShop(); renderPoints(); updatePlayerStats(); };
window.buyDeathNote = function () { if (rebirthCount < 4 || points < 500000) return; let v = parseInt(document.getElementById("dnInput").value); if (!v || v < 1) return; points -= 500000; deathNoteTarget = v; skipUsed = false; saveAll(); renderShop(); renderPoints(); };
function useFireArtifact() { if (!hasFireArtifact) return; if (points < 100000) { alert("Не хватает звёзд!"); return; } points -= 100000; hasFireArtifact = false; startFireEffectPassive(Math.floor(currentEnemy.maxHp / 5), 10000); saveAll(); }
function getAutoSellCost(rarity) { let idx = rarities.indexOf(rarity); return 100 * Math.pow(2, idx); }
function purchaseAutoSell(rarity) { if (rebirthCount < 1) return; let cost = getAutoSellCost(rarity); if (points < cost) return; points -= cost; purchasedAutoSell[rarity] = true; autoSellSettings[rarity] = true; saveAll(); renderBulkSell(); renderPoints(); }
function toggleAutoSell(rarity) { if (!purchasedAutoSell[rarity]) return; autoSellSettings[rarity] = !autoSellSettings[rarity]; saveAll(); renderBulkSell(); }
function getAutoRestCost(th) { return 100 * Math.pow(2, autoRestOptions.findIndex(o => o.threshold === th)); }
function purchaseAutoRest(th) { if (rebirthCount < 3) return; let cost = getAutoRestCost(th); if (points < cost) return; points -= cost; autoRest.purchased = true; autoRest.threshold = th; autoRest.active = true; saveAll(); renderAutoRest(); renderPoints(); }
function toggleAutoRest(th) { if (!autoRest.purchased || autoRest.threshold !== th) return; autoRest.active = !autoRest.active; saveAll(); renderAutoRest(); }
window.buyUpgrade = function (k) { if (!isUpgradeUnlocked(k)) return; let u = upgrades[k], c = Math.floor(u.baseCost * (1 + u.level * 0.3)); if (points < c) return; points -= c; u.level++; saveAll(); renderUpgrades(); renderPoints(); updatePlayerStats(); };

function goToWave() { if (mode !== "moder" || !moderUnlocked) return; let w = parseInt(prompt("Введите номер волны:")); if (!w || w < 1) return; wave = w; playerHp = window.playerMaxHp || 100; generateEnemy(); saveAll(); renderAll(); }

function submitCode() { let inp = document.getElementById("codeInput").value.trim(); let cd = codeList[inp]; if (!cd) { document.getElementById("codeResult").innerHTML = "❌ Неверный код"; return; } if (usedCodes.includes(inp)) { document.getElementById("codeResult").innerHTML = "⚠️ Код уже использован"; return; } usedCodes.push(inp); switch (cd.type) { case "points": points += cd.amount; if (points > maxPoints) maxPoints = points; break; case "card": let t = customCardTemplates[cd.rarity].find(t => t.name === cd.tpl); if (t) { let c = createCardFromTemplate(t, cd.rarity); if (c) myCards.push(c); if (cd.points) { points += cd.points; if (points > maxPoints) maxPoints = points; } } break; case "buff": stackBuff(cd.buffId, cd.duration); break; case "moderUnlock": moderUnlocked = true; let modeEl = document.querySelector('.toggle span[data-mode="moder"]'); if (modeEl) modeEl.style.display = ''; saveAll(); document.getElementById("codeResult").innerHTML = "✅ Модер разблокирован!"; return; } document.getElementById("codeResult").innerHTML = "✅ Успешно активировано!"; saveAll(); renderAll(); renderActiveBuffs(); updatePlayerStats(); }

function genChallenges() { let t = [{ name: "10 боссов", target: 10, reward: Math.floor(500 * getStarMult()), type: "bossKills", progress: 0 }, { name: "1000⭐", target: 1000, reward: Math.floor(300 * getStarMult()), type: "earnPoints", progress: 0 }, { name: "50 побед", target: 50, reward: Math.floor(400 * getStarMult()), type: "wins", progress: 0 }, { name: "10к урон", target: 10000, reward: Math.floor(350 * getStarMult()), type: "bigDamage", progress: 0 }, { name: "10 ур.", target: 10, reward: Math.floor(800 * getStarMult()), type: "levelUp", progress: playerLevel }]; challenges = []; for (let i = 0; i < 3; i++) { let tp = t[Math.floor(Math.random() * t.length)]; challenges.push({ ...tp, id: Date.now() + i, completed: false }); } lastChallengeReset = Date.now(); saveAll(); renderChallenges(); }
function updateChallengeProgress(tp, v) { challenges.forEach(ch => { if (!ch.completed && ch.type === tp) { ch.progress = (ch.progress || 0) + v; if (ch.type === "levelUp") ch.progress = playerLevel; if (ch.progress >= ch.target) { ch.completed = true; points += ch.reward; if (points > maxPoints) maxPoints = points; } } }); renderChallenges(); saveAll(); }
function getRebirthRequirement() { return 75 + rebirthCount * 75 + Math.floor(Math.pow(rebirthCount, 1.5)) * 10; }
function doRebirth() { let req = getRebirthRequirement(); if (highestCheckpoint < req) { alert('Нужно ' + req + ' волн!'); return; } rebirthStats.push({ rebirth: rebirthCount, totalWins, highestWave: highestCheckpoint, totalCards: myCards.length, playerLevel, world: getWorldForWave(highestCheckpoint).name, totalClicks, maxPoints }); myCards = []; team = []; afkTeam = []; points = 100; wave = 1; playerHp = 100; playerLevel = 1; playerExp = 0; fatigue = 0; activeBuffs = {}; deathNoteTarget = null; skipUsed = false; hasFireArtifact = false; hasCompoundV = {}; autoSellSettings = {"Обычная":false,"Редкая":false,"Сверх редкая":false,"Эпик":false,"Мифическая":false,"Легендарная":false}; purchasedAutoSell = {"Обычная":false,"Редкая":false,"Сверх редкая":false,"Эпик":false,"Мифическая":false,"Легендарная":false}; autoRest = {active:false,threshold:90,purchased:false}; upgrades = {damage:{level:0,baseCost:25,increment:2,name:"💪 Сила",reqLevel:1},hp:{level:0,baseCost:25,increment:5,name:"❤️ Живучесть",reqLevel:1},luck:{level:0,baseCost:30,increment:0.1,name:"🍀 Удача",reqLevel:3},crit:{level:0,baseCost:40,increment:0.03,name:"⚡ Крит",reqLevel:5},fatigueResist:{level:0,baseCost:50,increment:0.5,name:"💪 Усталость",reqLevel:10},abilityPower:{level:abilityUpgradeLevel,baseCost:200,increment:0.1,name:"✨ Усиление",reqLevel:30}}; rebirthCount++; highestCheckpoint = 1; newcomerBonus = true; newcomerBonusEnd = Date.now() + 600000; gameCompleted = false; for (let i = 0; i < 3; i++) { let c = createCard(getRandomRarity()); if (c) myCards.push(c); } team = [0, 1, 2]; sfxRebirth(); refreshShop(); generateEnemy(); saveAll(); renderAll(); startMainMusic(); alert('Ребиртх ' + rebirthCount + '! Множитель x' + getRebirthMult().toFixed(1)); }
function switchTab(tabName) { document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active")); let btn = document.querySelector(".tab-btn[data-tab='" + tabName + "']"); if (btn) btn.classList.add("active"); document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active")); let tab = document.getElementById(tabName + "Tab"); if (tab) tab.classList.add("active"); if (tabName === "battle") { startBattleMusic(); } else if (tabName === "shop") { startShopMusic(); } else { startMainMusic(); } if (tabName === "shop") renderShop(); if (tabName === "rebirth") { renderRebirthInfo(); renderRebirthStats(); } if (tabName === "slots") { renderSlotsInGame(); } }
function switchSubTab(subtabName, parentTabId) { let parent = document.getElementById(parentTabId); if (!parent) return; parent.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active")); let subBtn = parent.querySelector(".sub-tab-btn[data-subtab='" + subtabName + "']"); if (subBtn) subBtn.classList.add("active"); parent.querySelectorAll(".sub-tab-content").forEach(t => t.classList.remove("active")); let sub = document.getElementById(subtabName + "SubTab"); if (sub) sub.classList.add("active"); if (subtabName === "book") renderBook(); if (subtabName === "evolution") renderEvoTab(); if (subtabName === "shopItems") renderShop(); if (subtabName === "bulkSell") renderBulkSell(); if (subtabName === "autoRest") renderAutoRest(); if (subtabName === "upgrades") renderUpgrades(); if (subtabName === "challenges") renderChallenges(); if (subtabName === "checkpoint") renderCheckpoints(); if (subtabName === "rebirthMain") renderRebirthInfo(); if (subtabName === "rebirthStats") renderRebirthStats(); }
function renderAll() { renderMyCards(); renderTeam(); renderAfkTeam(); renderEnemy(); renderPoints(); renderShop(); renderUpgrades(); renderActiveBuffs(); renderDefeatHistory(); renderFreeSpins(); renderAchievements(); renderChallenges(); renderBook(); renderCheckpoints(); renderRebirthInfo(); renderRebirthStats(); renderEvoTab(); renderGlobalStats(); renderModerControls(); updatePlayerStats(); updateStatusDisplay(); }
function renderPoints() { ['pointsAmount', 'pointsAmount2', 'pointsAmount3', 'pointsAmountBulk', 'pointsAmountRest'].forEach(id => { let e = document.getElementById(id); if (e) e.innerText = points; }); }
function escapeHtml(s) { return s ? s.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])) : ''; }

function showSlotSelectScreen() { let el = document.getElementById("slotSelectScreen"); if (el) el.style.display = "block"; el = document.getElementById("gameScreen"); if (el) el.style.display = "none"; let html = ''; for (let i = 0; i < 3; i++) { let meta = loadSlotMeta(i); html += '<div class="slot-select" onclick="showNicknamePrompt(' + i + ')"><div style="font-size:20px;font-weight:900;">' + meta.nickname + '</div><div style="font-size:12px;color:#aaa;">' + (meta.exists ? 'Есть сохранение' : 'Пустой слот') + '</div></div>'; } el = document.getElementById("slotList"); if (el) el.innerHTML = html; }
function showNicknamePrompt(slot) { let meta = loadSlotMeta(slot); let nickname = prompt("Введите ник для слота " + (slot + 1) + ":", meta.nickname); if (nickname === null) return; if (nickname.trim() === "" && !meta.exists) return; if (nickname.trim() !== "") { meta.nickname = nickname.trim(); } saveSlotMeta(slot, meta); selectSlot(slot); }
function renameSlot(slot) { let meta = loadSlotMeta(slot); let nickname = prompt("Новое имя для слота " + (slot + 1) + ":", meta.nickname); if (nickname === null) return; if (nickname.trim() === "") return; meta.nickname = nickname.trim(); saveSlotMeta(slot, meta); if (slot === currentSlot) { slotData.nickname = nickname.trim(); let el = document.getElementById("nicknameDisplay"); if (el) el.innerText = nickname.trim(); } renderSlotsInGame(); }
function renderSlotsInGame() { let html = '<div style="display:flex;flex-direction:column;gap:10px;">'; for (let i = 0; i < 3; i++) { let meta = loadSlotMeta(i); html += '<div class="slot-select ' + (i === currentSlot ? 'active' : '') + '"><div style="font-size:18px;font-weight:900;">' + meta.nickname + '</div><div style="font-size:12px;color:#aaa;">' + (meta.exists ? 'Есть сохранение' : 'Пустой слот') + (i === currentSlot ? ' ← Текущий' : '') + '</div><div style="display:flex;gap:8px;margin-top:8px;"><button class="btn" style="padding:4px 12px;font-size:11px;" onclick="event.stopPropagation();switchToSlot(' + i + ')">Загрузить</button><button class="btn" style="padding:4px 12px;font-size:11px;background:#9b59b6;" onclick="event.stopPropagation();renameSlot(' + i + ')">✏️ Имя</button></div></div>'; } html += '</div>'; let el = document.getElementById("slotsListInGame"); if (el) el.innerHTML = html; }
function switchToSlot(slot) { if (slot === currentSlot) return; saveAll(); currentSlot = slot; let saved = loadGameFromSlot(slot); let meta = loadSlotMeta(slot); if (saved) { loadGameData(saved); } else { initNewGame(); slotData.nickname = meta.nickname; } slotData.nickname = slotData.nickname || meta.nickname; saveGameToSlot(slot); let el = document.getElementById("slotSelectScreen"); if (el) el.style.display = "none"; el = document.getElementById("gameScreen"); if (el) el.style.display = "block"; finishSlotLoad(slot); renderSlotsInGame(); }
function setMode(m) { if (m === "moder" && !moderUnlocked) return; mode = m; saveAll(); updateClaimTimer(); renderModerControls(); document.querySelectorAll(".toggle span").forEach(s => s.classList.toggle("active", s.dataset.mode === m)); }

document.addEventListener("DOMContentLoaded", function () {
    let lastSlot = parseInt(localStorage.getItem("cgV20_lastSlot") || "-1");
    if (lastSlot >= 0 && lastSlot < 3 && loadSlotMeta(lastSlot).exists) { currentSlot = lastSlot; let saved = loadGameFromSlot(lastSlot); let meta = loadSlotMeta(lastSlot); if (saved) { loadGameData(saved); } else { initNewGame(); slotData.nickname = meta.nickname; } slotData.nickname = slotData.nickname || meta.nickname; saveGameToSlot(lastSlot); finishSlotLoad(lastSlot); } else { showSlotSelectScreen(); }
    let clickArea = document.getElementById("clickArea"); if (clickArea) clickArea.addEventListener("click", function() { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); handleClick(); });
    let clearTeamBtn = document.getElementById("clearTeamBtn"); if (clearTeamBtn) clearTeamBtn.addEventListener("click", function () { team = []; saveAll(); renderAll(); updatePlayerStats(); });
    let clearAfkTeamBtn = document.getElementById("clearAfkTeamBtn"); if (clearAfkTeamBtn) clearAfkTeamBtn.addEventListener("click", function () { afkTeam = []; saveAll(); renderAll(); });
    let useFreeSpinBtn = document.getElementById("useFreeSpinBtn"); if (useFreeSpinBtn) useFreeSpinBtn.addEventListener("click", useFreeSpin);
    let buySpinBtn = document.getElementById("buySpinBtn"); if (buySpinBtn) buySpinBtn.addEventListener("click", buySpin);
    let claimCardBtn = document.getElementById("claimCardBtn"); if (claimCardBtn) claimCardBtn.addEventListener("click", claimCardByTimer);
    let restBtn = document.getElementById("restBtn"); if (restBtn) restBtn.addEventListener("click", rest);
    let toggleAfkBtn = document.getElementById("toggleAfkBtn"); if (toggleAfkBtn) toggleAfkBtn.addEventListener("click", function () { afkActive ? stopAfk() : startAfk(); });
    let submitCodeBtn = document.getElementById("submitCodeBtn"); if (submitCodeBtn) submitCodeBtn.addEventListener("click", submitCode);
    let doRebirthBtn = document.getElementById("doRebirthBtn"); if (doRebirthBtn) doRebirthBtn.addEventListener("click", doRebirth);
    let goWaveBtn = document.getElementById("goWaveBtn"); if (goWaveBtn) goWaveBtn.addEventListener("click", goToWave);
    document.querySelectorAll(".tab-btn").forEach(function (btn) { btn.addEventListener("click", function () { switchTab(this.dataset.tab); }); });
    document.querySelectorAll(".sub-tab-btn").forEach(function (btn) { btn.addEventListener("click", function () { var parent = this.parentElement; while (parent && !parent.classList.contains("tab-content")) { parent = parent.parentElement; } if (!parent) return; switchSubTab(this.dataset.subtab, parent.id); }); });
    document.querySelectorAll(".toggle span").forEach(function (s) { s.addEventListener("click", function () { setMode(this.dataset.mode); }); });
    let moderEl = document.querySelector('.toggle span[data-mode="moder"]'); if (moderEl && !moderUnlocked) moderEl.style.display = "none";
    startMainMusic();
    setInterval(function () { if (currentSlot >= 0) { renderShop(); renderActiveBuffs(); updatePlayerStats(); renderFreeSpins(); checkFreeSpinReset(); updateClaimTimer(); if (Date.now() - (lastChallengeReset || 0) >= 86400000) genChallenges(); saveAll(); } }, 1000);
});
