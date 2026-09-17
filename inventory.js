// ============================================================
// ИНВЕНТАРЬ v1.1 — фиксы + новые фрукты
// ============================================================

const ITEMS = {
    bone: {
        name: "Кость", icon: "🦴",
        desc: "Белесая кость. Продай — получишь звёзды.",
        sellPrice: 1, stack: 999, canSell: true
    },
    raw_meat: {
        name: "Сырое мясо", icon: "🥩",
        desc: "Вкусно пахнет, но есть сырым — плохая идея. Мгновенно +15% HP, но накладывает отравление на 60 секунд (-2% HP/сек). Повторное поедание УСКОРЯЕТ смерть (-10 сек). 10 очков антидота снимают отравление.",
        stack: 99, canSell: false, canCook: true,
        actionFunction: "eatRawMeat"
    },
    cooked_meat: {
        name: "Жареное мясо", icon: "🍖",
        desc: "Сочное жареное мясо. Восстанавливает 25% HP и убирает 30% голода. Но добавляет +2 очка ожирения.",
        stack: 99, canSell: false,
        actionFunction: "eatCookedMeat"
    },
    apple: {
        name: "Яблоко", icon: "🍏",
        desc: "+5% HP, -10% голода, -1 ожирение, +1 антидот",
        cost: 200, stack: 99, canEat: true,
        hp: 5, hunger: 10, obesity: 1, antidote: 1,
        actionFunction: "eatFruit"
    },
    banana: {
        name: "Банан", icon: "🍌",
        desc: "+10% HP, -20% голода, -2 ожирение, +2 антидот",
        cost: 500, stack: 99, canEat: true,
        hp: 10, hunger: 20, obesity: 2, antidote: 2,
        actionFunction: "eatFruit"
    },
    grapes: {
        name: "Виноград", icon: "🍇",
        desc: "+15% HP, -35% голода, -4 ожирение, +4 антидот",
        cost: 1500, stack: 99, canEat: true,
        hp: 15, hunger: 35, obesity: 4, antidote: 4,
        actionFunction: "eatFruit"
    },
    pineapple: {
        name: "Ананас", icon: "🍍",
        desc: "+25% HP, -60% голода, -10 ожирение, +10 антидот (мгновенно снимает отравление)",
        cost: 5000, stack: 99, canEat: true,
        hp: 25, hunger: 60, obesity: 10, antidote: 10,
        actionFunction: "eatFruit"
    },
    // ★ НОВЫЕ ФРУКТЫ ★
    orange: {
        name: "Апельсин", icon: "🍊",
        desc: "+8% HP, -15% голода, -1 ожирение, +2 антидот",
        cost: 350, stack: 99, canEat: true,
        hp: 8, hunger: 15, obesity: 1, antidote: 2,
        actionFunction: "eatFruit"
    },
    watermelon: {
        name: "Арбуз", icon: "🍉",
        desc: "+20% HP, -50% голода, -6 ожирение, +3 антидот",
        cost: 2500, stack: 99, canEat: true,
        hp: 20, hunger: 50, obesity: 6, antidote: 3,
        actionFunction: "eatFruit"
    },
    lemon: {
        name: "Лимон", icon: "🍋",
        desc: "+3% HP, -5% голода, -8 ожирение, +6 антидот (кислый!)",
        cost: 1200, stack: 99, canEat: true,
        hp: 3, hunger: 5, obesity: 8, antidote: 6,
        actionFunction: "eatFruit"
    },
    cherry: {
        name: "Вишня", icon: "🍒",
        desc: "+7% HP, -12% голода, -3 ожирение, +5 антидот",
        cost: 800, stack: 99, canEat: true,
        hp: 7, hunger: 12, obesity: 3, antidote: 5,
        actionFunction: "eatFruit"
    },
    mango: {
        name: "Манго", icon: "🥭",
        desc: "+18% HP, -45% голода, -7 ожирение, +8 антидот",
        cost: 3500, stack: 99, canEat: true,
        hp: 18, hunger: 45, obesity: 7, antidote: 8,
        actionFunction: "eatFruit"
    },
    coin: {
        name: "Монета", icon: "🪙",
        desc: "Блестит. Наверное, что-то значит. Но ты не знаешь что.",
        stack: 999, canSell: false
    },
    key: {
        name: "Ключ Живого Камня", icon: "🔑",
        desc: "Странный ключ. Открывает тайные товары в Лавке. Пропадёт при ребёрне.",
        stack: 1, canSell: false,
        actionFunction: "useKey"
    },
    stone_piece: {
        name: "Кусок камня", icon: "🪨",
        desc: "Напоминание о проигрыше против камня. Надеюсь я его больше не встречу.",
        stack: 1, canSell: false, unsellable: true
    }
};

let inventory = {};
let hunger = 0;
let obesityPoints = 0;
let poisonTimer = 0;
let antidotePoints = 0;
let treasureUnlocked = false;
let treasureKeyUsed = false; // ★ НОВОЕ: флаг что ключ уже применялся ★

// ========== БАЗОВЫЕ ==========
function addItem(id, count) {
    if (count === undefined) count = 1;
    if (!ITEMS[id]) return;
    if (!inventory[id]) inventory[id] = 0;
    inventory[id] += count;
    let maxStack = ITEMS[id].stack || 999;
    if (inventory[id] > maxStack) inventory[id] = maxStack;
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
}

function removeItem(id, count) {
    if (count === undefined) count = 1;
    if (!inventory[id]) return false;
    if (inventory[id] < count) return false;
    inventory[id] -= count;
    if (inventory[id] <= 0) delete inventory[id];
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    return true;
}

function getItemCount(id) { return inventory[id] || 0; }

// ========== ДРОП ==========
function tryDropLoot(isBoss) {
    if (isBoss) {
        addItem("bone", 10);
        if (Math.random() < 0.3) {
            let fruits = ["apple", "banana", "grapes", "pineapple", "orange", "watermelon", "lemon", "cherry", "mango"];
            let f = fruits[Math.floor(Math.random() * fruits.length)];
            addItem(f, 1);
            if (typeof showFloatingText === 'function') showFloatingText("🍎 " + ITEMS[f].name + "!", "#2ecc71");
        }
    } else {
        if (Math.random() < 0.3) addItem("bone", 1);
        if (Math.random() < 0.1) addItem("raw_meat", 1);
        if (Math.random() < 0.05) addItem("coin", 1);
    }
}

function dropLivingStoneLoot() {
    addItem("key", 1);
    addItem("stone_piece", 1);
    if (typeof showFloatingText === 'function') {
        showFloatingText("🔑 Ключ получен!", "#ffd700");
        setTimeout(function() { showFloatingText("🪨 Кусок камня!", "#888888"); }, 500);
    }
}

// ========== ДЕЙСТВИЯ ==========
function eatRawMeat() {
    if (getItemCount("raw_meat") <= 0) return;
    removeItem("raw_meat", 1);
    if (typeof playerHp !== 'undefined' && typeof window.playerMaxHp !== 'undefined') {
        playerHp = Math.min(window.playerMaxHp, playerHp + window.playerMaxHp * 0.15);
    }
    // ★ ПОВТОРНОЕ МЯСО УСКОРЯЕТ СМЕРТЬ НА 10 СЕК ★
    if (poisonTimer > 0) {
        poisonTimer = Math.max(0, poisonTimer - 10);
        if (typeof showFloatingText === 'function') showFloatingText("☠️ -10 сек до смерти!", "#ff00ff");
    }
    poisonTimer += 60;
    if (typeof showFloatingText === 'function') showFloatingText("☠️ ОТРАВЛЕНИЕ!", "#aa00aa");
    if (typeof updatePlayerStats === 'function') updatePlayerStats();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function eatCookedMeat() {
    if (getItemCount("cooked_meat") <= 0) return;
    removeItem("cooked_meat", 1);
    if (typeof playerHp !== 'undefined' && typeof window.playerMaxHp !== 'undefined') {
        playerHp = Math.min(window.playerMaxHp, playerHp + window.playerMaxHp * 0.25);
    }
    hunger = Math.max(0, hunger - 30);
    obesityPoints += 2;
    if (obesityPoints > 60) obesityPoints = 60;
    if (typeof showFloatingText === 'function') showFloatingText("🍖 +25% HP", "#2ecc71");
    if (typeof updatePlayerStats === 'function') updatePlayerStats();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function eatFruit(fruitId) {
    if (!ITEMS[fruitId] || !ITEMS[fruitId].canEat) return;
    if (getItemCount(fruitId) <= 0) return;
    let item = ITEMS[fruitId];
    removeItem(fruitId, 1);
    if (typeof playerHp !== 'undefined' && typeof window.playerMaxHp !== 'undefined') {
        playerHp = Math.min(window.playerMaxHp, playerHp + window.playerMaxHp * (item.hp / 100));
    }
    hunger = Math.max(0, hunger - item.hunger);
    obesityPoints = Math.max(0, obesityPoints - item.obesity);
    antidotePoints += item.antidote;
    if (antidotePoints >= 10) {
        poisonTimer = 0;
        antidotePoints = 0;
        if (typeof showFloatingText === 'function') showFloatingText("✅ Отравление снято!", "#2ecc71");
    }
    if (typeof showFloatingText === 'function') showFloatingText(item.icon + " +" + item.hp + "% HP", "#2ecc71");
    if (typeof updatePlayerStats === 'function') updatePlayerStats();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

// ★ ФИКС ЖАРКИ ★
function cookMeat() {
    if (getItemCount("raw_meat") <= 0) {
        if (typeof showFloatingText === 'function') showFloatingText("Нет сырого мяса!", "#ff3333");
        return;
    }
    let currentPoints = (typeof points !== 'undefined') ? points : 0;
    let isModer = (typeof mode !== 'undefined' && mode === "moder");
    if (!isModer && currentPoints < 10) {
        if (typeof showFloatingText === 'function') showFloatingText("Нужно 10⭐!", "#ff3333");
        return;
    }
    if (!isModer && typeof points !== 'undefined') points -= 10;
    removeItem("raw_meat", 1);
    addItem("cooked_meat", 1);
    if (typeof showFloatingText === 'function') showFloatingText("🔥 Готово!", "#f5af19");
    if (typeof renderPoints === 'function') renderPoints();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function sellBones() {
    let count = getItemCount("bone");
    if (count <= 0) return;
    let earned = count * 1;
    points += earned;
    if (points > maxPoints) maxPoints = points;
    removeItem("bone", count);
    if (typeof showFloatingText === 'function') showFloatingText("💰 +" + earned + "⭐ за " + count + " костей", "#f5af19");
    if (typeof renderPoints === 'function') renderPoints();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

// ★ ФИКС КЛЮЧА ★
function useKey() {
    if (getItemCount("key") <= 0) {
        if (typeof showFloatingText === 'function') showFloatingText("Нет ключа!", "#ff3333");
        return;
    }
    treasureUnlocked = true;
    treasureKeyUsed = true;
    removeItem("key", 1);
    if (typeof showFloatingText === 'function') showFloatingText("🔓 Тайник открыт!", "#ffd700");
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderShop === 'function') renderShop();
    if (typeof closeModal === 'function') closeModal();
}

// ========== ГОЛОД ==========
function tickHunger(dt) {
    if (hunger < 100) {
        hunger += 0.028 * dt;
        if (hunger > 100) hunger = 100;
    }
}

function getHungerHpMult() {
    if (hunger < 30) return 1.0;
    if (hunger < 60) return 0.85;
    if (hunger < 85) return 0.6;
    return 0.3;
}

function getHungerFatigueMult() {
    if (hunger < 30) return 1.0;
    if (hunger < 60) return 1.3;
    if (hunger < 85) return 1.7;
    return 2.5;
}

// ========== ОЖИРЕНИЕ ==========
function getObesitySpeedMult() {
    if (obesityPoints < 20) return 1.0;
    if (obesityPoints < 40) return 0.75;
    if (obesityPoints < 60) return 0.6;
    return 0.5;
}

function getObesityStageName() {
    if (obesityPoints < 20) return null;
    if (obesityPoints < 40) return "Ожирение I";
    if (obesityPoints < 60) return "Ожирение II";
    return "Ожирение III";
}

// ========== ОТРАВЛЕНИЕ ==========
function tickPoison(dt) {
    if (poisonTimer > 0) {
        poisonTimer -= dt;
        if (poisonTimer < 0) poisonTimer = 0;
        if (typeof playerHp !== 'undefined' && typeof window.playerMaxHp !== 'undefined') {
            let dmg = window.playerMaxHp * 0.02 * dt;
            playerHp -= dmg;
            if (playerHp <= 0 && typeof defeat === 'function') defeat();
        }
    }
}

// ========== СОХРАНЕНИЕ ==========
function saveInventory() {
    return {
        inventory: inventory,
        hunger: hunger,
        obesityPoints: obesityPoints,
        poisonTimer: poisonTimer,
        antidotePoints: antidotePoints,
        treasureUnlocked: treasureUnlocked,
        treasureKeyUsed: treasureKeyUsed
    };
}

function loadInventory(data) {
    if (!data) return;
    inventory = data.inventory || {};
    hunger = data.hunger || 0;
    obesityPoints = data.obesityPoints || 0;
    poisonTimer = data.poisonTimer || 0;
    antidotePoints = data.antidotePoints || 0;
    treasureUnlocked = data.treasureUnlocked || false;
    treasureKeyUsed = data.treasureKeyUsed || false;
    // ★ ФОЛБЭК: если ключа нет, но флаг использования стоит — считаем открыт ★
    if (!treasureUnlocked && treasureKeyUsed) treasureUnlocked = true;
}

function resetInventory() {
    inventory = {};
    hunger = 0;
    obesityPoints = 0;
    poisonTimer = 0;
    antidotePoints = 0;
    treasureUnlocked = false;
    treasureKeyUsed = false;
}

// ========== РЕНДЕР ==========
function renderInventory() {
    let container = document.getElementById("inventoryContent");
    if (!container) return;

    let html = '';

    html += '<div style="background:rgba(0,0,0,0.3);border-radius:14px;padding:12px;margin-bottom:12px;">';
    let hungerColor = hunger < 30 ? "#2ecc71" : hunger < 60 ? "#f5af19" : hunger < 85 ? "#e67e22" : "#e74c3c";
    html += '<div style="font-weight:800;font-size:13px;margin-bottom:6px;">🍽️ Голод: <span style="color:' + hungerColor + ';">' + Math.floor(hunger) + '%</span></div>';
    html += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:10px;overflow:hidden;"><div style="width:' + hunger + '%;height:100%;background:' + hungerColor + ';"></div></div>';
    if (obesityPoints > 0) {
        let obName = getObesityStageName() || "Норма";
        html += '<div style="font-weight:800;font-size:13px;margin-top:10px;">🍔 Ожирение: <span style="color:' + (obesityPoints >= 20 ? '#e74c3c' : '#aaa') + ';">' + obName + ' (' + obesityPoints + '/60)</span></div>';
        html += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:10px;overflow:hidden;"><div style="width:' + (obesityPoints / 60 * 100) + '%;height:100%;background:#e67e22;"></div></div>';
    }
    if (poisonTimer > 0) {
        html += '<div style="font-weight:800;font-size:13px;margin-top:10px;color:#aa00aa;">☠️ Отравление: ' + Math.floor(poisonTimer) + 'с (антидот ' + antidotePoints + '/10)</div>';
    } else if (antidotePoints > 0) {
        html += '<div style="font-weight:800;font-size:13px;margin-top:10px;color:#2ecc71;">💚 Антидот: ' + antidotePoints + '/10</div>';
    }
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;">';
    let hasAny = false;
    for (let id in ITEMS) {
        let count = getItemCount(id);
        if (count > 0) {
            hasAny = true;
            let item = ITEMS[id];
            html += '<div onclick="showItemModal(\'' + id + '\')" style="background:linear-gradient(180deg,#1e1e2f,#151522);border:2px solid rgba(255,255,255,0.08);border-radius:14px;padding:10px 6px;text-align:center;cursor:pointer;transition:0.2s;">';
            html += '<div style="font-size:36px;">' + item.icon + '</div>';
            html += '<div style="font-size:11px;font-weight:800;margin-top:4px;line-height:1.2;">' + item.name + '</div>';
            html += '<div style="font-size:12px;font-weight:900;color:#f5af19;margin-top:2px;">x' + count + '</div>';
            html += '</div>';
        }
    }
    if (!hasAny) html += '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#888;font-weight:bold;">📦 Инвентарь пуст</div>';
    html += '</div>';

    container.innerHTML = html;
}

function showItemModal(id) {
    let item = ITEMS[id];
    if (!item) return;
    let count = getItemCount(id);
    if (count <= 0) return;

    let html = '<h2>' + item.icon + ' ' + item.name.toUpperCase() + '</h2>';
    html += '<div style="text-align:center;font-size:14px;color:#aaa;margin-bottom:10px;">Количество: <b style="color:#f5af19;">' + count + '</b></div>';
    html += '<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;margin-bottom:12px;font-size:13px;line-height:1.5;">' + item.desc + '</div>';
    if (item.sellPrice) html += '<div style="text-align:center;margin-bottom:10px;font-size:14px;">💰 Продать: <b style="color:#f5af19;">' + item.sellPrice + '⭐</b> за штуку</div>';
    if (item.unsellable) html += '<div style="text-align:center;margin-bottom:10px;font-size:14px;color:#ff4444;">❌ Не продаётся</div>';

    html += '<div style="display:flex;flex-direction:column;gap:8px;">';
    if (item.actionFunction === "eatRawMeat") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatRawMeat();">🍴 Съесть (ОПАСНО — отравишься)</button>';
    } else if (item.actionFunction === "eatCookedMeat") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatCookedMeat();">🍴 Съесть (+25% HP, +2 ожирение)</button>';
    } else if (item.actionFunction === "eatFruit") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatFruit(\'' + id + '\');">' + item.icon + ' Съесть</button>';
    } else if (item.actionFunction === "useKey") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="useKey();">🔓 Использовать ключ</button>';
    } else if (item.canCook) {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="cookMeat();">🔥 Пожарить (10⭐)</button>';
    }
    if (item.canSell && item.sellPrice) {
        html += '<button class="btn" style="padding:12px;background:#f5af19;color:#000;font-weight:900;" onclick="sellBones();">💰 Продать всё (' + (count * item.sellPrice) + '⭐)</button>';
    }
    html += '<button class="btn" style="padding:10px;background:#555;" onclick="closeModal()">Закрыть</button>';
    html += '</div>';

    let el = document.getElementById("modalContent");
    if (el) el.innerHTML = html;
    el = document.getElementById("modalOverlay");
    if (el) el.style.display = "flex";
}

window.ITEMS = ITEMS;
window.addItem = addItem;
window.removeItem = removeItem;
window.getItemCount = getItemCount;
window.tryDropLoot = tryDropLoot;
window.dropLivingStoneLoot = dropLivingStoneLoot;
window.eatRawMeat = eatRawMeat;
window.eatCookedMeat = eatCookedMeat;
window.eatFruit = eatFruit;
window.cookMeat = cookMeat;
window.sellBones = sellBones;
window.useKey = useKey;
window.tickHunger = tickHunger;
window.tickPoison = tickPoison;
window.getHungerHpMult = getHungerHpMult;
window.getHungerFatigueMult = getHungerFatigueMult;
window.getObesitySpeedMult = getObesitySpeedMult;
window.saveInventory = saveInventory;
window.loadInventory = loadInventory;
window.resetInventory = resetInventory;
window.renderInventory = renderInventory;
window.showItemModal = showItemModal;
window.getTreasureUnlocked = function() { return treasureUnlocked; };

console.log("[INVENTORY] v1.1 — фиксы + 5 новых фруктов");
