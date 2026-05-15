// ========== ЗВУКИ ==========
const AudioCtx = window.AudioContext || window.webkitAudioContext; let audioCtx;
function initAudio() { if (audioCtx) { if (audioCtx.state === 'suspended') audioCtx.resume(); return; } audioCtx = new AudioCtx(); }
function playSound(freq, type, duration, vol = 0.15) { if (!audioCtx) return; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime); g.gain.setValueAtTime(vol, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration); o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + duration); }
function sfxClick() { playSound(600, 'square', 0.08); }
function sfxCrit() { playSound(900, 'sawtooth', 0.15); }
function sfxVictory() { playSound(500, 'square', 0.1); setTimeout(() => playSound(700, 'square', 0.1), 100); }
function sfxDefeat() { playSound(150, 'sawtooth', 0.4); }
function sfxBossAppear() { playSound(200, 'sawtooth', 0.3); }
function sfxCardObtain() { playSound(800, 'sine', 0.12); }
function sfxLevelUp() { playSound(1000, 'square', 0.1); setTimeout(() => playSound(1200, 'square', 0.1), 80); }
function sfxAbility() { playSound(400, 'sawtooth', 0.15); }
function sfxRebirth() { playSound(300, 'triangle', 0.3); }

// ========== МИРЫ ==========
const worlds = [
    { name: "Лес начала и конца", minWave: 1, maxWave: 300, color: "#2ecc71" },
    { name: "Огненная пустошь", minWave: 301, maxWave: 600, color: "#e74c3c" },
    { name: "Гранд Лайн", minWave: 601, maxWave: 900, color: "#3498db" },
    { name: "Замороженные земли", minWave: 901, maxWave: 1200, color: "#00cec9" },
    { name: "Тёмное измерение", minWave: 1201, maxWave: 1500, color: "#6c5ce7" },
    { name: "Небесный дворец", minWave: 1501, maxWave: 2000, color: "#fdcb6e" },
    { name: "Бездна отчаяния", minWave: 2001, maxWave: 3000, color: "#636e72" },
    { name: "Предел силы", minWave: 3001, maxWave: 5000, color: "#d63031" },
    { name: "Космическая пустота", minWave: 5001, maxWave: 7500, color: "#2d3436" },
    { name: "Финальный рубеж", minWave: 7501, maxWave: 9999, color: "#e17055" },
    { name: "Возвращение Охотника", minWave: 10000, maxWave: 10000, color: "#ff4500" }
];
function getCurrentWorld() { for (let w of worlds) { if (wave >= w.minWave && wave <= w.maxWave) return w; } return worlds[worlds.length - 1]; }
function getWorldForWave(w) { for (let world of worlds) { if (w >= world.minWave && w <= world.maxWave) return world; } return worlds[0]; }

// ========== ШАБЛОНЫ КАРТ ==========
const customCardTemplates = {
    "Обычная": [
        { name: "Луффи", universe: "One Piece", damage: 4, hp: 8 },
        { name: "Усопп", universe: "One Piece", damage: 3, hp: 6 },
        { name: "Нами", universe: "One Piece", damage: 2, hp: 8 },
        { name: "Ездок", universe: "OPM", damage: 1, hp: 11 },
        { name: "Деку (безпричудный) ", universe: "MHA", damage: 2, hp: 12, ability: { type: "spareChanceBonus", value: 0.05, desc: "+5% к пощаде" } },
        { name: "Консперон (обычный) ", universe: "Dandadan", damage: 4, hp: 5 },
        { name: "Танджиро", universe: "DS", damage: 3, hp: 10 },
        { name: "Уборщик Коби", universe: "One piece", damage: 1, hp: 1 },
        { name: "Аста", universe: "Black Clover", damage: 3, hp: 8 },
        { name: "Хьюи (слабый)", universe: "The Boys", damage: 2, hp: 10 },
        { name: "Френчи", universe: "The Boys", damage: 4, hp: 6 },
        { name: "Дональд", universe: "Invincible", damage: 3, hp: 9 }
    ],
    "Редкая": [
        { name: "Брук", universe: "One Piece", damage: 7, hp: 12 },
        { name: "Иноске", universe: "DS", damage: 9, hp: 15 },
        { name: "Киллуа", universe: "HxH", damage: 10, hp: 13 },
        { name: "Рейген", universe: "Mob 100", damage: 4, hp: 25 },
        { name: "Марк (слабый)", universe: "Invincible", damage: 8, hp: 18 },
        { name: "ММ (Марвин)", universe: "The Boys", damage: 7, hp: 20 },
        { name: "Кимико (начало)", universe: "The Boys", damage: 9, hp: 14 },
        { name: "Ева Уилкинс", universe: "Invincible", damage: 6, hp: 22 }
    ],
    "Сверх редкая": [
        { name: "Луффи (2 гир)", universe: "One Piece", damage: 16, hp: 25 },
        { name: "Зоро (до таймскипа) ", universe: "One Piece", damage: 18, hp: 22 },
        { name: "Санджи (до таймскипа) ", universe: "One Piece", damage: 16, hp: 20 },
        { name: "Гаара", universe: "Naruto", damage: 17, hp: 28 },
        { name: "Эмир", universe: "AoT", damage: 25, hp: 10 },
        { name: "Эрен (Кадет) ", universe: "AoT", damage: 27, hp: 10 },
        { name: "Коби (Солдат) ", universe: "One Piece", damage: 15, hp: 30 },
        { name: "Ренджи", universe: "Bleach", damage: 15, hp: 25 },
        { name: "Киришима", universe: "MHA", damage: 13, hp: 35 },
        { name: "Райан (Ребенок) ", universe: "The Boys", damage: 20, hp: 25 },
        { name: "Рекс Слоан", universe: "Invincible", damage: 18, hp: 28 },
        { name: "Дупли-Кейт", universe: "Invincible", damage: 15, hp: 20 },
        { name: "Пучино", universe: "The Boys", damage: 17, hp: 26 },
        { name: "Мреющий", universe: "The Boys", damage: 9, hp: 40 }
    ],
    "Эпик": [
        { name: "Луффи (Таймскип)", universe: "One Piece", damage: 28, hp: 45, ability: { type: "damageMultChance", chance: 0.35, mult: 1.3, desc: "35% урон x1.3" } },
        { name: "Ло", universe: "One Piece", damage: 25, hp: 40, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" } },
        { name: "Итачи", universe: "Naruto", damage: 30, hp: 38 },
        { name: "Эрен", universe: "AoT", damage: 35, hp: 50, ability: { type: "teamHealOnWave", value: 0.02, desc: "Хил 2% за волну" } },
        { name: "Гатс", universe: "Berserk", damage: 40, hp: 55, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" } },
        { name: "Кид", universe: "One Piece", damage: 28, hp: 35, ability: { type: "critChance", value: 0.05, desc: "+5% крит" } },
        { name: "Какаши", universe: "Naruto", damage: 26, hp: 42 },
        { name: "Коби (Honestly impact)", universe: "One Piece", damage: 32, hp: 45, ability: { type: "critChance", value: 0.05, desc: "+5% крит" } },
        { name: "Луччи (Сп-9)", universe: "One Piece", damage: 38, hp: 45 },
        { name: "Робот (Руди)", universe: "Invincible", damage: 30, hp: 48 },
        { name: "Чёрный Нуар", universe: "The Boys", damage: 35, hp: 52, ability: { type: "damageReduction", value: 0.07, desc: "-7% урона" } },
        { name: "Кимико", universe: "The Boys", damage: 32, hp: 48, ability: { type: "teamHealOnWave", value: 0.02, desc: "Хил 2% за волну" } },
        { name: "Ракета", universe: "The Boys", damage: 38, hp: 40, ability: { type: "nonBossOneShot", chance: 0.03, desc: "3% ваншот (не босс)" } },
        { name: "Деку (5%)", universe: "MHA", damage: 34, hp: 44, ability: { type: "spareChanceBonus", value: 0.08, desc: "+8% к пощаде" }, statusAbility: { type: "clickDmgSelf", value: 0.02, desc: "-2% HP за клик" } }
    ],
    "Мифическая": [
        { name: "Луффи (4 гир)", universe: "One Piece", damage: 45, hp: 75, ability: { type: "damageReduction", value: 0.15, desc: "-15% урона" } },
        { name: "Наруто (Мудрец)", universe: "Naruto", damage: 52, hp: 85, statusAbility: { type: "bleed", value: 0.10, desc: "Кровотечение +10%" } },
        { name: "Гоку (SSJ)", universe: "DB", damage: 60, hp: 70, ability: { type: "bossDamage", value: 0.10, desc: "+10% боссам" } },
        { name: "Годжо (флешбек)", universe: "JJK", damage: 66, hp: 66, statusAbility: { type: "shock", chance: 0.1, desc: "Шок 10%" } },
        { name: "Сукуна (15 пальцев)", universe: "JJK", damage: 70, hp: 70, statusAbility: { type: "bleed", value: 0.08, desc: "Кровотечение +8%" } },
        { name: "Эйс", universe: "One Piece", damage: 70, hp: 47, statusAbility: { type: "fire", damage: 5, duration: 5000, desc: "Огонь 5/сек" } },
        { name: "Дедушка Гарп", universe: "One Piece", damage: 55, hp: 90, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" } },
        { name: "Неуязвимый (Коалиция планет)", universe: "Invincible", damage: 65, hp: 80, ability: { type: "critChance", value: 0.20, desc: "+20% крит" } },
        { name: "Бог Скайпии Энель", universe: "One Piece", damage: 68, hp: 72, statusAbility: { type: "shock", chance: 0.12, desc: "Шок 12%" } },
        { name: "Альбер (Кинг)", universe: "One Piece", damage: 72, hp: 68, statusAbility: { type: "fire", damage: 8, duration: 4000, desc: "Огонь 8/сек" } },
        { name: "Виктория Ньюман", universe: "The Boys", damage: 65, hp: 85, statusAbility: { type: "bleed", value: 0.20, desc: "Кровотечение +20%" } },
        { name: "Королева Мэйв", universe: "The Boys", damage: 70, hp: 88, ability: { type: "damageReduction", value: 0.15, desc: "-15% меньше урона" } },
        { name: "Солдатик (флешбек)", universe: "The Boys", damage: 72, hp: 82, ability: { type: "bossDamage", value: 0.12, desc: "+12% боссам" } },
        { name: "Штормфронт", universe: "The Boys", damage: 68, hp: 78, statusAbility: { type: "shock", chance: 0.15, desc: "Электричество 15%" } },
        { name: "Ален (перерождённый)", universe: "Invincible", damage: 70, hp: 70, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" } },
        { name: "Звёздочка", universe: "The Boys", damage: 65, hp: 80, statusAbility: { type: "blind", value: 2, desc: "Ослепление +2" } },
        { name: "Деку: полное покрытие (20%)", universe: "MHA", damage: 58, hp: 68, ability: { type: "spareChanceBonus", value: 0.10, desc: "+10% к пощаде" }, statusAbility: { type: "dmgTakenIncrease", value: 0.10, desc: "+10% получ. урона" } }
    ],
    "Легендарная": [
        { name: "Кудзан", universe: "One Piece", damage: 85, hp: 120, statusAbility: { type: "freezeStacks", value: 2, desc: "Заморозка +2" } },
        { name: "Йонко Шанкс", universe: "One Piece", damage: 95, hp: 90, ability: { type: "critChance", value: 0.15, desc: "+15% крит" } },
        { name: "Хоумлендер", universe: "The Boys", damage: 115, hp: 125, ability: { type: "bossDamage", value: 0.18, desc: "+18% боссам" }, statusAbility: { type: "fire", damage: 10, duration: 3000, desc: "Лазеры 10/сек" } },
        { name: "Наруто (Барион)", universe: "Naruto", damage: 100, hp: 120, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, statusAbility: { type: "bleed", value: 0.1, desc: "Кровотечение +10%" } },
        { name: "Гоку (UI)", universe: "DB", damage: 110, hp: 110, ability: { type: "damageAura", value: 0.13, desc: "+13% урона" } },
        { name: "Вегета (UE)", universe: "DB", damage: 115, hp: 105, ability: { type: "damageAura", value: 0.20, desc: "+20% урона", damageTakenMod: 0.10 } },
        { name: "Мадара", universe: "Naruto", damage: 120, hp: 100, ability: { type: "damageReduction", value: 0.05, desc: "-5% урона" }, statusAbility: { type: "freezeStacks", value: 1, desc: "Заморозка +1" } },
        { name: "Гарп (Galaxy impact)", universe: "One Piece", damage: 105, hp: 140, ability: { type: "damageAura", value: 0.20, desc: "+20% урона" } },
        { name: "Омни-Мэн", universe: "Invincible", damage: 120, hp: 130, ability: { type: "damageAura", value: 0.12, desc: "+12% урона" }, statusAbility: { type: "bleed", value: 0.15, desc: "Кровотечение +15%" } },
        { name: "Ло (Пробужденный)", universe: "One Piece", damage: 105, hp: 145, ability: { type: "healOnWin", percent: 0.03, desc: "+3% HP" }, statusAbility: { type: "shock", chance: 0.10, desc: "Электричество 10%" } }
    ],
    "Секретная": [
        { name: "Луффи: Ника, Бог Солнца", universe: "One Piece", damage: 150, hp: 200, sellPrice: 1500, minRebirth: 2, ability: { type: "bossDamage", value: 0.30, desc: "+30% боссам", damageReduction: 0.10 } },
        { name: "Космический Гароу", universe: "OPM", damage: 250, hp: 400, sellPrice: 2800, minRebirth: 4, ability: { type: "scaleWithWins", value: 0.01, desc: "+1% силы/волна" } },
        { name: "Сайтама", universe: "OPM", damage: 200, hp: 300, sellPrice: 1500, minRebirth: 3, ability: { type: "oneShot", chance: 0.05, desc: "5% ваншот" } },
        { name: "Борос", universe: "OPM", damage: 180, hp: 350, sellPrice: 1400, minRebirth: 2, ability: { type: "healOnWin", percent: 0.05, desc: "+5% HP" } },
        { name: "Бог Усопп", universe: "One Piece", damage: 250, hp: 400, sellPrice: 2000, minRebirth: 3, ability: { type: "resurrect", chance: 0.05, desc: "5% воскрес" } },
        { name: "Зено", universe: "DB", damage: 300, hp: 500, sellPrice: 3000, minRebirth: 4, ability: { type: "zenoCheckpoint", desc: "10% след. чекпоинт" }, statusAbility: { type: "fatigueResist", value: 0.30, desc: "-30% усталости" } },
        { name: "Анти-спираль", universe: "GL", damage: 280, hp: 450, sellPrice: 2500, minRebirth: 2, ability: { type: "damageReduction", value: 0.30, desc: "-30% урона" } },
        { name: "Молодой Гарп", universe: "One Piece", damage: 260, hp: 380, sellPrice: 2500, minRebirth: 3, ability: { type: "damageAura", value: 0.25, desc: "+25% урона" } },
        { name: "Им (Правитель)", universe: "One Piece", damage: 290, hp: 450, sellPrice: 3000, minRebirth: 5, ability: { type: "bossDamage", value: 0.20, desc: "+20% боссам" } },
        { name: "Бэтмен (Который смеётся)", universe: "DC", damage: 250, hp: 380, sellPrice: 2200, minRebirth: 3, ability: { type: "critChance", value: 0.15, desc: "+15% крит" }, statusAbility: { type: "shock", chance: 0.20, desc: "Шок 20%" } },
        { name: "Кайдо", universe: "One Piece", damage: 300, hp: 500, sellPrice: 3000, minRebirth: 4, ability: { type: "bossDouble", desc: "x2 урон (босс)" } },
        { name: "Император Марк", universe: "Invincible", damage: 310, hp: 500, sellPrice: 3000, minRebirth: 5, ability: { type: "bossSupport", desc: "+15% урона (босс)" }, statusAbility: { type: "bleed", value: 0.12, desc: "Кровотечение +12%" } },
        { name: "Деку (100%)", universe: "MHA", damage: 280, hp: 450, sellPrice: 2800, minRebirth: 4, ability: { type: "bossDoubleSelf", desc: "x2 урон (босс), -30% на 10 волн" } },
        { name: "Всемогущий (прайм)", universe: "MHA", damage: 300, hp: 480, sellPrice: 3000, minRebirth: 4, ability: { type: "damageAura", value: 0.15, desc: "+15% урона" }, statusAbility: { type: "bossDamageAura", value: 0.10, desc: "+25% (босс)" } }
    ],
    "Эволюционная": [
        { name: "Луффи : Король пиратов", universe: "One Piece", damage: 1200, hp: 2000, minRebirth: 5, ability: { type: "bossDamage", value: 0.50, desc: "+50% боссам", bossReduction: 0.40 }, unsellable: true },
        { name: "Сайтама/Гароу", universe: "Эволюция", damage: 1500, hp: 2500, minRebirth: 5, ability: { type: "oneShot", chance: 0.15, desc: "15% ваншот" }, statusAbility: { type: "scaleWithWins", value: 0.03, desc: "+3% силы/волна" }, unsellable: true },
        { name: "Гарп/Кудзан", universe: "Эволюция", damage: 1400, hp: 2200, minRebirth: 5, ability: { type: "damageAura", value: 0.40, desc: "+40% урона" }, statusAbility: { type: "absoluteFreeze", value: 0.5, desc: "-50% урона" }, unsellable: true },
        { name: "Семёрка", universe: "The Boys", damage: 1600, hp: 2600, minRebirth: 5, ability: { type: "sevenSpecial", desc: "V x3, хил 5%/волна", healOnWave: 0.05, damageReduction: 0.10 }, statusAbility: { type: "blind", value: 2, desc: "Ослепление +2" }, extraStatus: [{ type: "fire", damage: 10, duration: 3000 }, { type: "shock", chance: 0.15 }], unsellable: true },
        { name: "Уильям Фрэнсис", universe: "Invincible", damage: 800, hp: 1200, minRebirth: 5, ability: { type: "copyEnemyChance", chance: 0.15, desc: "15% копирует врага" }, unsellable: true }
    ],
    "Босс": [
        { name: "Охотник за головами", universe: "Боссы", damage: 150, hp: 300, sellPrice: 1000, minRebirth: 0, ability: { type: "bossDamage", value: 0.10, desc: "+10% боссам" } },
        { name: "Король Демонов", universe: "Боссы", damage: 200, hp: 400, sellPrice: 2000, minRebirth: 1, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" } },
        { name: "Маджин Буу", universe: "Боссы", damage: 250, hp: 500, sellPrice: 3000, minRebirth: 2, statusAbility: { type: "bleed", value: 0.10, desc: "Кровотечение +10%" } },
        { name: "Король Пиратов", universe: "Боссы", damage: 400, hp: 800, sellPrice: 5000, minRebirth: 3, ability: { type: "bossDamage", value: 0.20, desc: "+20% боссам" } }
    ],
    "Пасхалка": [
        { name: "Пельмешка", universe: "Кухня", damage: 35, hp: 60, unsellable: true, ability: { type: "luckAura", value: 0.50, desc: "+50% удачи" } },
        { name: "Попугай Соня", universe: "Зоопарк", damage: 3, hp: 5, unsellable: true, ability: { type: "deathBonus", value: 0.30, desc: "+30% звёзд" } },
        { name: "Кофе", universe: "AoT", damage: 20, hp: 50, unsellable: true, ability: { type: "fatigueResist", value: 0.50, desc: "-50% усталости" } }
    ]
};

// ========== БОССЫ И ДИАЛОГИ ==========
const bossTemplates = {
    100: { name: "Король Демонов", hpMult: 8, dmgMult: 5, dialogue: "Ты думаешь, что сможешь одолеть меня? Глупец.", enemyStatus: { type: "freezeStacks", value: 1 }, canSpare: true, spareReward: "Король Демонов" },
    200: { name: "Маджин Буу", hpMult: 12, dmgMult: 7, dialogue: "Буу , я голоден! Ты станешь моим обедом!", enemyStatus: { type: "bleed", value: 0.2 }, canSpare: true, spareReward: "Маджин Буу" },
    300: { name: "Дзирэн", hpMult: 15, dmgMult: 9, dialogue: "Сила — это абсолютная справедливость.", enemyStatus: { type: "shock", chance: 0.2 }, canSpare: true },
    500: { name: "Король Пиратов", hpMult: 25, dmgMult: 15, dialogue: "Мое сокровище? Ищите! Я всё оставил там!", canSpare: true, spareReward: "Король Пиратов", isSpecial: true },
    10000: { name: "Охотник за головами (Финальная форма)", hpMult: 100, dmgMult: 50, dialogue: "Хах, пока вас не было я тренировался целыми днями ради этого момента! Теперь за вашу голову готовы отдать 100.000 тенге!", canSpare: false, hasDialog: true }
};
const finalBossResponses = [
    { text: "100.000 тенге? Это сколько? 10 копеек?", response: "Незнаю... Просто много ноликов и вот я подумал, что это много....", mood: "😅" },
    { text: "Ты серьёзно? Я думал ты сильнее стал.", response: "Я СТАЛ СИЛЬНЕЕ! Просто... инфляция...", mood: "😤" },
    { text: "Может договоримся?", response: "Договоримся? После всего что было? НЕТ!", mood: "💢" }
];

// ========== КОНСТАНТЫ ==========
const totalTemplatesCount = Object.values(customCardTemplates).flat().length;
const rarities = ["Обычная","Редкая","Сверх редкая","Эпик","Мифическая","Легендарная","Секретная","Эволюционная","Босс","Пасхалка"];
const rarityColors = { "Обычная":"common","Редкая":"rare","Сверх редкая":"superrare","Эпик":"epic","Мифическая":"mythic","Легендарная":"legendary","Секретная":"secret","Эволюционная":"evolutionary","Босс":"boss-rarity","Пасхалка":"easter" };
const cardStats = { "Обычная":{damage:3,hp:5,sellPrice:20},"Редкая":{damage:6,hp:10,sellPrice:45},"Сверх редкая":{damage:12,hp:20,sellPrice:90},"Эпик":{damage:20,hp:35,sellPrice:150},"Мифическая":{damage:35,hp:60,sellPrice:260},"Легендарная":{damage:60,hp:100,sellPrice:450},"Секретная":{damage:100,hp:180,sellPrice:800},"Эволюционная":{damage:500,hp:1000,sellPrice:0},"Босс":{damage:80,hp:150,sellPrice:1000},"Пасхалка":{damage:10,hp:20,sellPrice:0} };
let cardWeights = { "Обычная":45,"Редкая":25,"Сверх редкая":12,"Эпик":8,"Мифическая":5,"Легендарная":3,"Секретная":1.5,"Эволюционная":0.0001,"Босс":0.05 };
const enemyNames = ["Эльф-лучник","Голем","Орк-берсерк","Слизь-убийца","Гоблин-шаман","Скелет-воин","Тёмный маг","Вампир-князь","Драконий прихвостень","Лесной дух","Кровавый берсерк","Ледяной элементаль"];
const enemyStatusPool = [null, null, null, { type: "freezeStacks", value: 1 }, { type: "bleed", value: 0.1 }, { type: "shock", chance: 0.1 }];
const shopItemsPool = { common: [{ name: "Обычная карта", type: "card", rarity: "Обычная", cost: 25 }, { name: "Зелье урона x1.3", type: "buff", buffId: "dmg13", duration: 7200000, cost: 150 }], rare: [{ name: "Редкая карта", type: "card", rarity: "Редкая", cost: 55 }, { name: "Зелье удачи", type: "buff", buffId: "luck13", duration: 7200000, cost: 150 }], epic: [{ name: "Эпик карта", type: "card", rarity: "Эпик", cost: 180 }, { name: "Зелье урона x2", type: "buff", buffId: "doubleDamage", duration: 14400000, cost: 800 }] };
const specialPotions = [{ name: "🧪 Зелье урона x4", desc: "12 часов", buffId: "quadDamage", duration: 43200000, cost: 3000 }, { name: "🧪 Зелье звёзд x2", desc: "6 часов", buffId: "doubleStars", duration: 21600000, cost: 5000 }, { name: "🧪 Зелье HP x3", desc: "4 часа", buffId: "tripleHp", duration: 14400000, cost: 2000 }];
const bulkSellOptions = [{ name: "Обычные", rarity: "Обычная" }, { name: "Редкие", rarity: "Редкая" }, { name: "Сверхредкие", rarity: "Сверх редкая" }, { name: "Эпики", rarity: "Эпик" }, { name: "Мифические", rarity: "Мифическая" }, { name: "Легендарные", rarity: "Легендарная" }];
const autoRestOptions = [{ name: "90%", threshold: 90 }, { name: "80%", threshold: 80 }, { name: "70%", threshold: 70 }, { name: "60%", threshold: 60 }, { name: "50%", threshold: 50 }];
const codeList = { "PELMESHKA": { type: "card", rarity: "Пасхалка", tpl: "Пельмешка", points: 1000 }, "Хочу Звезды": { type: "points", amount: 500 }, "Сила": { type: "buff", buffId: "dmg13", duration: 86400000 }, "789456123": { type: "moderUnlock" } };
const worldMusicNotes = {
    "Лес начала и конца": [262, 294, 330, 349, 392, 349, 330, 294],
    "Огненная пустошь": [392, 440, 494, 523, 494, 440, 392, 349],
    "Гранд Лайн": [523, 587, 659, 698, 784, 698, 659, 587],
    "Замороженные земли": [349, 330, 294, 262, 294, 330, 349, 294],
    "Тёмное измерение": [440, 494, 523, 587, 659, 587, 523, 494],
    "Небесный дворец": [587, 659, 784, 880, 784, 659, 587, 523],
    "Бездна отчаяния": [196, 220, 247, 262, 247, 220, 196, 165],
    "Предел силы": [330, 392, 440, 523, 440, 392, 330, 262],
    "Космическая пустота": [247, 262, 294, 330, 294, 262, 247, 220],
    "Финальный рубеж": [523, 440, 392, 330, 392, 440, 523, 659],
    "Возвращение Охотника": [440, 494, 523, 587, 659, 587, 523, 494]
};