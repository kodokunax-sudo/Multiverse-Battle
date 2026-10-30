// ============================================================
// ИНВЕНТАРЬ v1.7 — фикс слотов + Путеводная Звезда
// ============================================================

const ITEMS = {
    star: {
        name: "Звезда", icon: "⭐",
        desc: "Твоя основная валюта. Тратится на крутки, товары, прокачку и готовку. Зарабатывается за победы над врагами и боссами. Чем выше волна — тем больше звёзд. Говорят, звезды дают силу",
        stack: 9999999, canSell: false, isVirtual: true
    },
    bone: {
        name: "Кость", icon: "🦴",
        desc: "Белесая кость. Продай — получишь звёзды. Ну а зачем они еще нужны?",
        sellPrice: 1, stack: 9999, canSell: true
    },
    raw_meat: {
        name: "Сырое мясо", icon: "🥩",
        desc: "Мясо, но есть сырым — плохая идея. Почти. Мгновенно +15% HP, но накладывает отравление на 60 секунд (-2% HP/сек). Повторное поедание УСКОРЯЕТ смерть (-10 сек). 10 очков антидота снимают отравление.",
        stack: 999, canSell: false, canCook: true,
        actionFunction: "eatRawMeat"
    },
    cooked_meat: {
        name: "Жареное мясо", icon: "🍖",
        desc: "Нормально приготовленное мясо. Восстанавливает 25% HP, убирает 30% голода и добавляет +2 пищевой тяжести.",
        stack: 999, canSell: false,
        actionFunction: "eatCookedMeat"
    },
    perfect_cooked_meat: {
        name: "Идеально жареное мясо", icon: "🥩✨",
        desc: "Мясо с золотистой корочкой и сочной серединой. Восстанавливает 32% HP, убирает 40% голода и добавляет только +1 пищевую тяжесть.",
        stack: 999, canSell: false,
        actionFunction: "eatPerfectCookedMeat"
    },
    burnt_meat: {
        name: "Подгоревшее мясо", icon: "🥓",
        desc: "Ты немного отвлёкся у плиты. Восстанавливает 10% HP, убирает 10% голода и добавляет +3 пищевой тяжести.",
        stack: 999, canSell: false,
        actionFunction: "eatBurntMeat"
    },
    mushroom: {
        name: "Гриб", icon: "🍄",
        desc: "Странный гриб. Мгновенно +15% HP. 50% шанс что это ядовитый гриб (накладывает короткое отравление на 15 сек). 50% шанс что волшебный (даёт +10 очков антидота и -1 ожирение). Это мой гриб!",
        cost: 300, stack: 999, canEat: true,
        actionFunction: "eatMushroom"
    },
    honey: {
        name: "Мёд", icon: "🍯",
        desc: "Сладкий мёд. Восстанавливает +3% HP в секунду в течение 10 секунд. Всего +30% HP. Не вызывает ожирение. Это буквально отходы пчел...",
        cost: 800, stack: 999, canEat: true,
        actionFunction: "eatHoney"
    },
    pepper: {
        name: "Перец", icon: "🌶️",
        desc: "Жгучий перец! Даёт +30% скорости сердечка на 30 секунд. НО пока эффект активен — теряешь 1% HP каждую секунду (жжёт!).",
        cost: 400, stack: 999, canEat: true,
        actionFunction: "eatPepper"
    },
    ice: {
        name: "Лёд", icon: "🧊",
        desc: "Кусок вечного льда. Замораживает текущего врага на 5 дополнительных кликов (враг не отвечает ударом).",
        cost: 600, stack: 999, canEat: true,
        actionFunction: "eatIce"
    },
    egg: {
        name: "Яйцо", icon: "🥚",
        desc: "Загадочное яйцо. Что внутри — неизвестно! При съедании мгновенно даёт случайную награду: звёзды, карту, или... ничего.",
        cost: 1000, stack: 999, canEat: true,
        actionFunction: "eatEgg"
    },
    bread: {
        name: "Хлеб", icon: "🍞",
        desc: "Свежий хлеб. Убирает 40% голода. Но добавляет +1 очко ожирения. Приставьте жизнь без хлеба. Жуть....",
        cost: 250, stack: 999, canEat: true,
        actionFunction: "eatBread"
    },
    antidote_potion: {
        name: "Мини-зелье", icon: "🧪",
        desc: "Маленькое зелье. Мгновенно снимает отравление и обнуляет счётчик антидота.",
        cost: 700, stack: 999, canEat: true,
        actionFunction: "drinkAntidote"
    },
    apple: {
        name: "Яблоко", icon: "🍏",
        desc: "+5% HP, -10% голода, -1 ожирение, +1 антидот. Люблю яблоко",
        cost: 200, stack: 999, canEat: true,
        hp: 5, hunger: 10, obesity: 1, antidote: 1,
        actionFunction: "eatFruit"
    },
    orange: {
        name: "Апельсин", icon: "🍊",
        desc: "+8% HP, -15% голода, -1 ожирение, +2 антидот. Я считаю, что мандарин лучше апельсина. А ты что думаешь?",
        cost: 350, stack: 999, canEat: true,
        hp: 8, hunger: 15, obesity: 1, antidote: 2,
        actionFunction: "eatFruit"
    },
    banana: {
        name: "Банан", icon: "🍌",
        desc: "+10% HP, -20% голода, -2 ожирение, +2 антидот. Ммм.....бананчики....",
        cost: 500, stack: 999, canEat: true,
        hp: 10, hunger: 20, obesity: 2, antidote: 2,
        actionFunction: "eatFruit"
    },
    cherry: {
        name: "Вишня", icon: "🍒",
        desc: "+7% HP, -12% голода, -3 ожирение, +5 антидот. Просто вишня",
        cost: 800, stack: 999, canEat: true,
        hp: 7, hunger: 12, obesity: 3, antidote: 5,
        actionFunction: "eatFruit"
    },
    lemon: {
        name: "Лимон", icon: "🍋",
        desc: "+3% HP, -5% голода, -8 ожирение, +6 антидот. Обожаю!!!",
        cost: 1200, stack: 999, canEat: true,
        hp: 3, hunger: 5, obesity: 8, antidote: 6,
        actionFunction: "eatFruit"
    },
    grapes: {
        name: "Виноград", icon: "🍇",
        desc: "+15% HP, -35% голода, -4 ожирение, +4 антидот. В Таджикистане их море",
        cost: 1500, stack: 999, canEat: true,
        hp: 15, hunger: 35, obesity: 4, antidote: 4,
        actionFunction: "eatFruit"
    },
    watermelon: {
        name: "Арбуз", icon: "🍉",
        desc: "+20% HP, -50% голода, -6 ожирение, +3 антидот. Арбуз арбуз привет...",
        cost: 2500, stack: 999, canEat: true,
        hp: 20, hunger: 50, obesity: 6, antidote: 3,
        actionFunction: "eatFruit"
    },
    mango: {
        name: "Манго", icon: "🥭",
        desc: "+18% HP, -45% голода, -7 ожирение, +8 антидот. Давай в этот раз без эдитов. Да?",
        cost: 3500, stack: 999, canEat: true,
        hp: 18, hunger: 45, obesity: 7, antidote: 8,
        actionFunction: "eatFruit"
    },
    pineapple: {
        name: "Ананас", icon: "🍍",
        desc: "+25% HP, -60% голода, -10 ожирение, +10 антидот. А я знаю другое применение ананаса...",
        cost: 5000, stack: 999, canEat: true,
        hp: 25, hunger: 60, obesity: 10, antidote: 10,
        actionFunction: "eatFruit"
    },
    coin: {
        name: "Монета", icon: "🪙",
        desc: "Блестит. Наверное, что-то значит. Но ты не знаешь что.",
        stack: 9999, canSell: false
    },
    server_block: {
        name: "Блок сервера", icon: "📔",
        desc: "Фрагмент блока сервера, который нужен, чтобы вернуть украденное сохранение любимой игры. Похоже, существует ещё одна часть.",
        stack: 20, canSell: false, unsellable: true
    },
    key: {
        name: "Ключ Живого Камня", icon: "🔑",
        desc: "Странный ключ. Открывает тайные товары в Лавке. Пропадёт при ребиртхе.",
        stack: 10, canSell: false,
        actionFunction: "useKey"
    },
    stone_piece: {
        name: "Кусок камня", icon: "🪨",
        desc: "Напоминание о проигрыше против камня. Надеюсь я его больше не встречу. Хотя, кто знает...",
        stack: 9999999, canSell: false, unsellable: true
    },
    // ★ НОВЫЙ ПРЕДМЕТ: ПУТЕВОДНАЯ ЗВЕЗДА ★
    waystar: {
        name: "Путеводная Звезда", icon: "🌟",
        desc: "Кусок Путеводной звезды, что освещала путь в бескрайней тьме. Предмет космической силы, которое при активации даёт 25 000 ⭐. Но стоило ли это того?",
        stack: 999, canSell: false, unsellable: true,
        actionFunction: "useWaystar"
    }
};

let inventory = {};
let hunger = 0;
let obesityPoints = 0;
let poisonTimer = 0;
let antidotePoints = 0;
let treasureUnlocked = false;
let treasureKeyUsed = false;
let pepperActive = false;

// ========== БАЗОВЫЕ ==========
function addItem(id, count) {
    if (count === undefined) count = 1;
    if (!ITEMS[id]) return;
    if (ITEMS[id].isVirtual) return;
    if (!inventory[id]) inventory[id] = 0;
    inventory[id] += count;
    let maxStack = ITEMS[id].stack || 9999;
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

function getItemCount(id) {
    if (id === "star") return (typeof points !== 'undefined') ? points : 0;
    return inventory[id] || 0;
}

// ========== ДРОП ==========
function tryDropLoot(isBoss) {
    if (isBoss) {
        addItem("bone", 10);
        if (Math.random() < 0.03) {
            let fruits = ["apple", "orange", "banana", "cherry", "lemon", "grapes", "watermelon", "mango", "pineapple"];
            let f = fruits[Math.floor(Math.random() * fruits.length)];
            addItem(f, 1);
            if (typeof showFloatingText === 'function') showFloatingText("🍎 " + ITEMS[f].name + "!", "#2ecc71");
        }
        if (Math.random() < 0.005) {
            addItem("egg", 1);
            if (typeof showFloatingText === 'function') showFloatingText("🥚 Яйцо!", "#f5af19");
        }
    } else {
        if (Math.random() < 0.03) addItem("bone", 1);
        if (Math.random() < 0.01) addItem("raw_meat", 1);
        if (Math.random() < 0.005) addItem("coin", 1);
        if (Math.random() < 0.005) addItem("mushroom", 1);
        if (Math.random() < 0.003) addItem("pepper", 1);
        if (Math.random() < 0.008) addItem("bread", 1);
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

// ========== ★ ИСПОЛЬЗОВАНИЕ ПУТЕВОДНОЙ ЗВЕЗДЫ ★ ==========
function useWaystar() {
    if (getItemCount("waystar") <= 0) {
        if (typeof showFloatingText === 'function') showFloatingText("Нет Путеводной Звезды!", "#ff3333");
        return;
    }
    removeItem("waystar", 1);
    let reward = 25000;
    if (typeof points !== 'undefined') {
        points += reward;
        if (typeof maxPoints !== 'undefined' && points > maxPoints) maxPoints = points;
    }
    if (typeof renderPoints === 'function') renderPoints();
    if (typeof saveAll === 'function') saveAll();
    if (typeof showFloatingText === 'function') {
        showFloatingText("🌟 +" + reward.toLocaleString() + "⭐!", "#ffd700");
        setTimeout(function() { showFloatingText("СИЛА ЗВЕЗДЫ ТВОЯ!", "#ff8800"); }, 500);
    }
    // Звук
    if (typeof sfxUINotification === 'function') sfxUINotification();
    if (typeof closeModal === 'function') closeModal();
}

// ========== ЕДА ==========
function eatRawMeat() {
    if (getItemCount("raw_meat") <= 0) return;
    removeItem("raw_meat", 1);
    if (typeof playerHp !== 'undefined' && typeof window.playerMaxHp !== 'undefined') {
        playerHp = Math.min(window.playerMaxHp, playerHp + window.playerMaxHp * 0.15);
    }
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

function eatPreparedMeat(itemId) {
    var food = {
        cooked_meat: { hp: 0.25, hunger: 30, obesity: 2, text: "🍖 +25% HP · -30% голода" },
        perfect_cooked_meat: { hp: 0.32, hunger: 40, obesity: 1, text: "🥩✨ +32% HP · -40% голода" },
        burnt_meat: { hp: 0.10, hunger: 10, obesity: 3, text: "🥓 +10% HP · -10% голода" }
    }[itemId];
    if (!food || getItemCount(itemId) <= 0) return false;

    if (!removeItem(itemId, 1)) return false;
    if (typeof playerHp !== 'undefined') {
        var maxHp = Number(window.playerMaxHp) || 100;
        playerHp = Math.min(maxHp, playerHp + maxHp * food.hp);
    }
    hunger = Math.max(0, hunger - food.hunger);
    obesityPoints = Math.min(60, obesityPoints + food.obesity);

    if (typeof updateStatusDisplay === 'function') updateStatusDisplay();
    if (typeof updatePlayerStats === 'function') updatePlayerStats();
    if (typeof showFloatingText === 'function') showFloatingText(food.text, itemId === "perfect_cooked_meat" ? "#ffd700" : "#2ecc71");
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
    return true;
}

function eatCookedMeat() { return eatPreparedMeat("cooked_meat"); }
function eatPerfectCookedMeat() { return eatPreparedMeat("perfect_cooked_meat"); }
function eatBurntMeat() { return eatPreparedMeat("burnt_meat"); }

function eatMushroom() {
    if (getItemCount("mushroom") <= 0) return;
    removeItem("mushroom", 1);
    if (typeof playerHp !== 'undefined' && typeof window.playerMaxHp !== 'undefined') {
        playerHp = Math.min(window.playerMaxHp, playerHp + window.playerMaxHp * 0.15);
    }
    if (Math.random() < 0.5) {
        antidotePoints += 10;
        obesityPoints = Math.max(0, obesityPoints - 1);
        if (typeof showFloatingText === 'function') showFloatingText("✨ ВОЛШЕБНЫЙ ГРИБ!", "#e056fd");
    } else {
        poisonTimer += 15;
        if (typeof showFloatingText === 'function') showFloatingText("☠️ ЯДОВИТЫЙ! +15 сек яда!", "#aa00aa");
    }
    if (antidotePoints >= 10) {
        poisonTimer = 0;
        antidotePoints = 0;
        if (typeof showFloatingText === 'function') showFloatingText("✅ Отравление снято!", "#2ecc71");
    }
    if (typeof updateStatusDisplay === 'function') updateStatusDisplay();
    if (typeof updatePlayerStats === 'function') updatePlayerStats();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function eatHoney() {
    if (getItemCount("honey") <= 0) return;
    removeItem("honey", 1);
    let healPerTick = (typeof window.playerMaxHp !== 'undefined') ? window.playerMaxHp * 0.03 : 3;
    let ticks = 0;
    let honeyInterval = setInterval(function() {
        if (typeof playerHp !== 'undefined' && typeof window.playerMaxHp !== 'undefined') {
            playerHp = Math.min(window.playerMaxHp, playerHp + healPerTick);
            if (typeof updatePlayerStats === 'function') updatePlayerStats();
        }
        ticks++;
        if (ticks >= 10) clearInterval(honeyInterval);
    }, 1000);
    if (typeof showFloatingText === 'function') showFloatingText("🍯 МЁД! +30% HP за 10 сек", "#f5af19");
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function eatPepper() {
    if (getItemCount("pepper") <= 0) return;
    removeItem("pepper", 1);
    if (typeof activeBuffs !== 'undefined') {
        activeBuffs["pepperSpeed"] = Date.now() + 30000;
    }
    pepperActive = true;
    if (typeof showFloatingText === 'function') showFloatingText("🌶️ ПЕРЕЦ! Скорость +30% на 30 сек", "#ff4400");
    if (typeof updatePlayerStats === 'function') updatePlayerStats();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function eatIce() {
    if (getItemCount("ice") <= 0) return;
    removeItem("ice", 1);
    if (typeof enemyStatuses !== 'undefined') {
        enemyStatuses.freezeStacks = (enemyStatuses.freezeStacks || 0) + 5;
    }
    if (typeof showFloatingText === 'function') showFloatingText("🧊 ВРАГ ЗАМОРОЖЕН! +5 кликов", "#00d4ff");
    if (typeof updateStatusDisplay === 'function') updateStatusDisplay();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function eatEgg() {
    if (getItemCount("egg") <= 0) return;
    removeItem("egg", 1);
    let roll = Math.random();
    if (roll < 0.40) {
        let earned = Math.floor(100 + Math.random() * 200);
        if (typeof points !== 'undefined') {
            points += earned;
            if (typeof maxPoints !== 'undefined' && points > maxPoints) maxPoints = points;
        }
        if (typeof showFloatingText === 'function') showFloatingText("🥚 +" + earned + "⭐!", "#f5af19");
    } else if (roll < 0.70) {
        if (typeof createCard === 'function' && typeof myCards !== 'undefined') {
            let c = createCard("Обычная");
            if (c) myCards.push(c);
        }
        if (typeof showFloatingText === 'function') showFloatingText("🥚 Обычная карта!", "#fff");
    } else if (roll < 0.90) {
        if (typeof showFloatingText === 'function') showFloatingText("🥚 ...пусто. Мусор.", "#888");
    } else {
        if (typeof createCard === 'function' && typeof myCards !== 'undefined') {
            let c = createCard("Редкая");
            if (c) myCards.push(c);
        }
        if (typeof showFloatingText === 'function') showFloatingText("🥚 РЕДКАЯ КАРТА!", "#17a2b8");
    }
    if (typeof renderPoints === 'function') renderPoints();
    if (typeof renderMyCards === 'function') renderMyCards();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function eatBread() {
    if (getItemCount("bread") <= 0) return;
    removeItem("bread", 1);
    hunger = Math.max(0, hunger - 40);
    obesityPoints += 1;
    if (obesityPoints > 60) obesityPoints = 60;
    if (typeof updateStatusDisplay === 'function') updateStatusDisplay();
    if (typeof showFloatingText === 'function') showFloatingText("🍞 ХЛЕБ! -40% голода (+1 ожирение)", "#f5af19");
    if (typeof updatePlayerStats === 'function') updatePlayerStats();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof closeModal === 'function') closeModal();
}

function drinkAntidote() {
    if (getItemCount("antidote_potion") <= 0) return;
    removeItem("antidote_potion", 1);
    poisonTimer = 0;
    antidotePoints = 0;
    if (typeof showFloatingText === 'function') showFloatingText("🧪 ОТРАВЛЕНИЕ СНЯТО!", "#2ecc71");
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
    if (typeof updateStatusDisplay === 'function') updateStatusDisplay();
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

// ========== ГОТОВКА ==========
function cookMeat() {
    if (getItemCount("raw_meat") <= 0) {
        if (typeof showFloatingText === 'function') showFloatingText("Нет сырого мяса!", "#ff3333");
        return false;
    }
    var currentPoints = (typeof points !== 'undefined') ? Number(points) || 0 : 0;
    var isModer = (typeof mode !== 'undefined' && mode === "moder");
    if (!isModer && currentPoints < 10) {
        if (typeof showFloatingText === 'function') showFloatingText("Для готовки нужно 10⭐!", "#ff3333");
        return false;
    }
    if (typeof window.startCookingMiniGame !== "function") {
        if (typeof showFloatingText === 'function') showFloatingText("Кухня пока не загрузилась. Обнови страницу.", "#ff3333");
        return false;
    }
    return window.startCookingMiniGame();
}

// Ингредиент и звёзды списываются одной операцией только после получения результата.
function completeMeatCooking(resultId) {
    var validResults = ["perfect_cooked_meat", "cooked_meat", "burnt_meat"];
    if (validResults.indexOf(resultId) === -1) return false;
    if (getItemCount("raw_meat") < 1) {
        if (typeof showFloatingText === 'function') showFloatingText("Сырое мясо больше не найдено.", "#ff3333");
        return false;
    }

    var isModer = (typeof mode !== 'undefined' && mode === "moder");
    var currentPoints = (typeof points !== 'undefined') ? Number(points) || 0 : 0;
    if (!isModer && currentPoints < 10) {
        if (typeof showFloatingText === 'function') showFloatingText("Не хватает 10⭐ для завершения готовки.", "#ff3333");
        return false;
    }

    var cap = Number(ITEMS[resultId].stack) || 999;
    if ((Number(inventory[resultId]) || 0) >= cap) {
        if (typeof showFloatingText === 'function') showFloatingText("Нет места для этого блюда. Освободи слот предмета.", "#ff3333");
        return false;
    }

    inventory.raw_meat = (Number(inventory.raw_meat) || 0) - 1;
    if (inventory.raw_meat <= 0) delete inventory.raw_meat;
    if (!isModer) points = Math.max(0, currentPoints - 10);
    inventory[resultId] = (Number(inventory[resultId]) || 0) + 1;

    if (typeof renderPoints === 'function') renderPoints();
    if (typeof saveAll === 'function') saveAll();
    if (typeof renderInventory === 'function') renderInventory();

    var resultNames = {
        perfect_cooked_meat: "🥩✨ Идеально приготовлено!",
        cooked_meat: "🍖 Получилось жареное мясо!",
        burnt_meat: "🥓 Мясо подгорело..."
    };
    if (typeof showFloatingText === 'function') {
        showFloatingText(resultNames[resultId], resultId === "perfect_cooked_meat" ? "#ffd700" : resultId === "burnt_meat" ? "#e67e22" : "#2ecc71");
    }
    return true;
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

// ========== ГОЛОД / ОЖИРЕНИЕ ==========
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

// ========== ОТРАВЛЕНИЕ + ПЕРЕЦ ==========
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
    if (typeof activeBuffs !== 'undefined' && activeBuffs["pepperSpeed"] && activeBuffs["pepperSpeed"] > Date.now()) {
        if (typeof playerHp !== 'undefined' && typeof window.playerMaxHp !== 'undefined') {
            playerHp -= window.playerMaxHp * 0.01 * dt;
            if (playerHp <= 0 && typeof defeat === 'function') defeat();
        }
    } else if (pepperActive && (!activeBuffs || !activeBuffs["pepperSpeed"] || activeBuffs["pepperSpeed"] <= Date.now())) {
        pepperActive = false;
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
        treasureKeyUsed: treasureKeyUsed,
        pepperActive: pepperActive
    };
}

function loadInventory(data) {
    resetInventory();
    if (!data) return;
    inventory = data.inventory || {};
    hunger = data.hunger || 0;
    obesityPoints = data.obesityPoints || 0;
    poisonTimer = data.poisonTimer || 0;
    antidotePoints = data.antidotePoints || 0;
    if (data.treasureUnlocked === true) treasureUnlocked = true;
    if (data.treasureKeyUsed === true) treasureKeyUsed = true;
    pepperActive = data.pepperActive || false;
    try {
        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(200)) {
            if ((inventory["key"] || 0) <= 0) {
                treasureUnlocked = true;
                treasureKeyUsed = true;
            }
        }
    } catch(e) {}
}

function resetInventory() {
    inventory = {};
    hunger = 0;
    obesityPoints = 0;
    poisonTimer = 0;
    antidotePoints = 0;
    treasureUnlocked = false;
    treasureKeyUsed = false;
    pepperActive = false;
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

    // Быстрая готовка доступна прямо из инвентаря, без открытия карточки предмета.
    let rawMeatCount = getItemCount("raw_meat");
    if (rawMeatCount > 0) {
        let currentPoints = (typeof points !== 'undefined') ? points : 0;
        let isModer = (typeof mode !== 'undefined' && mode === "moder");
        let canCook = isModer || currentPoints >= 10;
        html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:linear-gradient(135deg,rgba(112,68,22,.28),rgba(34,25,18,.92));border:1px solid rgba(245,175,25,.4);border-radius:12px;padding:10px 12px;margin-bottom:12px;">';
        html += '<div style="font-size:12px;font-weight:900;">🥩 Кухня <span style="color:#f5af19;">· сырое мясо x' + rawMeatCount + '</span><div style="font-size:10px;color:#aaa;font-weight:600;margin-top:3px;">Мини-игра · стоимость: 10⭐</div></div>';
        html += '<button onclick="cookMeat();" style="padding:8px 13px;font-size:12px;background:' + (canCook ? 'linear-gradient(135deg,#f5af19,#f12711)' : '#555') + ';border:none;border-radius:9px;color:white;font-weight:900;cursor:' + (canCook ? 'pointer' : 'not-allowed') + ';" ' + (!canCook ? 'disabled' : '') + '>🎮 Начать готовку</button>';
        html += '</div>';
    }

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;">';
    
    let currentStars = (typeof points !== 'undefined') ? points : 0;
    html += '<div style="background:linear-gradient(180deg,#3a2f15,#1a1510);border:2px solid #f5af19;border-radius:14px;padding:10px 6px;text-align:center;box-shadow:0 0 15px rgba(245,175,25,0.3);">';
    html += '<div onclick="showItemModal(\'star\')" style="cursor:pointer;">';
    html += '<div style="font-size:36px;">⭐</div>';
    html += '<div style="font-size:11px;font-weight:800;margin-top:4px;line-height:1.2;color:#f5af19;">Звезда</div>';
    html += '<div style="font-size:12px;font-weight:900;color:#f5af19;margin-top:2px;">x' + currentStars + '</div>';
    html += '</div></div>';
    
    let hasAny = false;
    for (let id in ITEMS) {
        if (id === "star") continue;
        let count = getItemCount(id);
        if (count > 0) {
            hasAny = true;
            let item = ITEMS[id];
            // Особая подсветка для Путеводной Звезды
            let isWaystar = (id === "waystar");
            let borderColor = isWaystar ? "#ffd700" : "rgba(255,255,255,0.08)";
            let extraShadow = isWaystar ? "box-shadow:0 0 15px rgba(255,215,0,0.5);" : "";
            html += '<div style="background:linear-gradient(180deg,#1e1e2f,#151522);border:2px solid ' + borderColor + ';border-radius:14px;padding:10px 6px;text-align:center;' + extraShadow + '">';
            html += '<div onclick="showItemModal(\'' + id + '\')" style="cursor:pointer;">';
            html += '<div style="font-size:36px;">' + item.icon + '</div>';
            html += '<div style="font-size:11px;font-weight:800;margin-top:4px;line-height:1.2;">' + item.name + '</div>';
            html += '<div style="font-size:12px;font-weight:900;color:#f5af19;margin-top:2px;">x' + count + '</div>';
            html += '</div>';
            html += '</div>';
        }
    }
    if (!hasAny) html += '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#888;font-weight:bold;">📦 Больше предметов нет</div>';
    html += '</div>';

    container.innerHTML = html;
}

function showItemModal(id) {
    let item = ITEMS[id];
    if (!item) return;
    let count;
    if (item.isVirtual) {
        count = (typeof points !== 'undefined') ? points : 0;
    } else {
        count = getItemCount(id);
        if (count <= 0) return;
    }

    let html = '<h2>' + item.icon + ' ' + item.name.toUpperCase() + '</h2>';
    html += '<div style="text-align:center;font-size:14px;color:#aaa;margin-bottom:10px;">Количество: <b style="color:#f5af19;">' + count + '</b></div>';
    html += '<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;margin-bottom:12px;font-size:13px;line-height:1.5;">' + item.desc + '</div>';
    if (item.sellPrice) html += '<div style="text-align:center;margin-bottom:10px;font-size:14px;">💰 Продать: <b style="color:#f5af19;">' + item.sellPrice + '⭐</b> за штуку</div>';
    if (item.unsellable) html += '<div style="text-align:center;margin-bottom:10px;font-size:14px;color:#ff4444;">❌ Не продаётся</div>';

    html += '<div style="display:flex;flex-direction:column;gap:8px;">';
    if (item.isVirtual) {
        html += '<div style="text-align:center;font-size:13px;color:#f5af19;font-weight:900;padding:10px;background:rgba(245,175,25,0.15);border-radius:10px;">⭐ Твоя валюта — тратится на всё в игре</div>';
    } else if (item.actionFunction === "eatRawMeat") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatRawMeat();">🍴 Съесть (ОПАСНО — отравишься)</button>';
        html += '<button class="btn" style="padding:12px;background:linear-gradient(135deg,#f5af19,#f12711);color:white;font-weight:900;border:none;" onclick="cookMeat();">🎮 Готовить · 10⭐</button>';
    } else if (item.actionFunction === "eatCookedMeat") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatCookedMeat();">🍴 Съесть (+25% HP, -30% голода)</button>';
    } else if (item.actionFunction === "eatPerfectCookedMeat") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatPerfectCookedMeat();">🍴 Съесть (+32% HP, -40% голода)</button>';
    } else if (item.actionFunction === "eatBurntMeat") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatBurntMeat();">🍴 Съесть (+10% HP, -10% голода)</button>';
    } else if (item.actionFunction === "eatMushroom") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatMushroom();">🍄 Съесть гриб (50/50)</button>';
    } else if (item.actionFunction === "eatHoney") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatHoney();">🍯 Съесть мёд (+30% HP за 10 сек)</button>';
    } else if (item.actionFunction === "eatPepper") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatPepper();">🌶️ Съесть перец (+30% скорости, жжёт)</button>';
    } else if (item.actionFunction === "eatIce") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatIce();">🧊 Съесть лёд (заморозка врага +5)</button>';
    } else if (item.actionFunction === "eatEgg") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatEgg();">🥚 Открыть яйцо (рандом)</button>';
    } else if (item.actionFunction === "eatBread") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatBread();">🍞 Съесть хлеб (-40% голода)</button>';
    } else if (item.actionFunction === "drinkAntidote") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="drinkAntidote();">🧪 Выпить (снять отравление)</button>';
    } else if (item.actionFunction === "eatFruit") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="eatFruit(\'' + id + '\');">' + item.icon + ' Съесть</button>';
    } else if (item.actionFunction === "useKey") {
        html += '<button class="btn btn-primary" style="padding:12px;" onclick="useKey();">🔓 Использовать ключ</button>';
    } else if (item.actionFunction === "useWaystar") {
        html += '<button class="btn" style="padding:14px;background:linear-gradient(135deg,#ffd700,#ff8800);color:#1a1a2e;font-weight:900;border:none;font-size:15px;box-shadow:0 0 20px rgba(255,215,0,0.5);" onclick="useWaystar();">🌟 АКТИВИРОВАТЬ (+25 000⭐)</button>';
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
window.eatPerfectCookedMeat = eatPerfectCookedMeat;
window.eatBurntMeat = eatBurntMeat;
window.completeMeatCooking = completeMeatCooking;
window.eatMushroom = eatMushroom;
window.eatHoney = eatHoney;
window.eatPepper = eatPepper;
window.eatIce = eatIce;
window.eatEgg = eatEgg;
window.eatBread = eatBread;
window.drinkAntidote = drinkAntidote;
window.eatFruit = eatFruit;
window.cookMeat = cookMeat;
window.sellBones = sellBones;
window.useKey = useKey;
window.useWaystar = useWaystar;
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

window.getTreasureUnlocked = function() { 
    if (treasureUnlocked === true) return true;
    if (treasureKeyUsed === true) return true;
    try {
        if (typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) && defeatedBosses.includes(200)) {
            if (getItemCount("key") <= 0) {
                treasureUnlocked = true;
                treasureKeyUsed = true;
                return true;
            }
        }
    } catch(e) {}
    return false;
};

console.log("[INVENTORY] v1.7 — фикс слотов + Путеводная Звезда");
