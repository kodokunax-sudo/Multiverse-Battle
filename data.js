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

// ========== МУЗЫКАЛЬНЫЕ ТЕМЫ (АУДИОФАЙЛЫ) ==========
// Файлы должны быть в папке music/ :
// music/main.mp3 - основная музыка (меню, коллекция, слоты, ребиртх)
// music/battle.mp3 - музыка битвы
// music/shop.mp3 - музыка магазина

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
        { name: "Луффи", universe: "One Piece", damage: 4, hp: 8, desc: "Базовый Луффи. Никаких способностей, просто бьёт." },
        { name: "Усопп", universe: "One Piece", damage: 3, hp: 6, desc: "Трусливый снайпер. Без способностей." },
        { name: "Нами", universe: "One Piece", damage: 2, hp: 8, desc: "Навигатор. Без способностей." },
        { name: "Ездок", universe: "OPM", damage: 1, hp: 11, desc: "Герой класса С. Много HP." },
        { name: "Деку (безпричудный) ", universe: "MHA", damage: 2, hp: 12, ability: { type: "spareChanceBonus", value: 0.05, desc: "+5% к пощаде" }, desc: "Без причуды, но мечтающий стать героем. Разве не глупо? +5% к шансу пощады." },
        { name: "Консперон (обычный) ", universe: "Dandadan", damage: 4, hp: 5, desc: "ИНОПЛОНЕТЯНЫ СУЩЕСТВУЮТ!!!!!" },
        { name: "Танджиро", universe: "DS", damage: 3, hp: 10, desc: "Охотник на демонов." },
        { name: "Уборщик Коби", universe: "One piece", damage: 1, hp: 1, desc: "Самый слабый персонаж. С него всё начиналось." },
        { name: "Аста", universe: "Black Clover", damage: 3, hp: 8, desc: "Маг без магии с анти-мечом." },
        { name: "Хьюи (слабый)", universe: "The Boys", damage: 2, hp: 10, desc: "Парень, чью девушку сбил А Train." },
        { name: "Френчи", universe: "The Boys", damage: 4, hp: 6, desc: "Оружейник и спецназовец." },
        { name: "Дональд", universe: "Invincible", damage: 3, hp: 9, desc: "К счастью это не Дональд Трамп...." }
    ],
    "Редкая": [
        { name: "Брук", universe: "One Piece", damage: 7, hp: 12, desc: "Скелет-музыкант. Йохохо!" },
        { name: "Иноске", universe: "DS", damage: 9, hp: 15, desc: "Человек-кабан с двумя мечами." },
        { name: "Киллуа", universe: "HxH", damage: 10, hp: 13, desc: "Молниеносный ассасин семьи Золдик." },
        { name: "Рейген", universe: "Mob 100", damage: 4, hp: 25, desc: "Великий экстрасенс XXI века (нет)." },
        { name: "Марк (слабый)", universe: "Invincible", damage: 8, hp: 18, desc: "Сын Омни-Мэна. Только получил силы." },
        { name: "ММ (Марвин)", universe: "The Boys", damage: 7, hp: 20, desc: "Лидер команды Пацаны. Тактик." },
        { name: "Кимико (начало)", universe: "The Boys", damage: 9, hp: 14, desc: "Немая убийца с супер-регенерацией." },
        { name: "Ева Уилкинс", universe: "Invincible", damage: 6, hp: 22, desc: "Девушка-герой с левитацией." }
    ],
    "Сверх редкая": [
        { name: "Луффи (2 гир)", universe: "One Piece", damage: 16, hp: 25, desc: "Ускоренный кровоток. Быстрее и сильнее." },
        { name: "Зоро (до таймскипа) ", universe: "One Piece", damage: 18, hp: 22, desc: "Зоро, чтоб не заблудиться,\nК нитке вздумал прицепиться.\nНить порвалась — он улетел\nИ в кастрюлю к Санджи прилетел." },
        { name: "Санджи (до таймскипа) ", universe: "One Piece", damage: 16, hp: 20, desc: "Чёрная нога. Шеф-повар." },
        { name: "Гаара", universe: "Naruto", damage: 17, hp: 28, desc: "Джинчурики с песчаной бронёй." },
        { name: "Эмир", universe: "AoT", damage: 25, hp: 10, desc: "Солдат разведкорпуса." },
        { name: "Эрен (Кадет) ", universe: "AoT", damage: 27, hp: 10, desc: "Кадет с жаждой мести титанам." },
        { name: "Коби (Солдат) ", universe: "One Piece", damage: 15, hp: 30, desc: "Доказывает, что слабый может стать сильным." },
        { name: "Ренджи", universe: "Bleach", damage: 15, hp: 25, desc: "Шинигами с мечом-хлыстом." },
        { name: "Киришима", universe: "MHA", damage: 13, hp: 35, desc: "Красный бунтарь. Твердеет кожей." },
        { name: "Райан (Ребенок) ", universe: "The Boys", damage: 20, hp: 25, desc: "Сын Хоумлендера. Ещё учится." },
        { name: "Рекс Слоан", universe: "Invincible", damage: 18, hp: 28, desc: "Взрывной герой-подросток." },
        { name: "Дупли-Кейт", universe: "Invincible", damage: 15, hp: 20, desc: "Множится на клонов." },
        { name: "Пучино", universe: "The Boys", damage: 17, hp: 26, desc: "Подводный герой. Любит рыбу." },
        { name: "Мреющий", universe: "The Boys", damage: 9, hp: 40, desc: "Невидимый шпион Семёрки." }
    ],
    "Эпик": [
        { name: "Луффи (Таймскип)", universe: "One Piece", damage: 28, hp: 45, ability: { type: "damageMultChance", chance: 0.35, mult: 1.3, desc: "35% урон x1.3" }, desc: "После двух лет тренировок. Шанс 35% нанести в 1.3 раза больше урона." },
        { name: "Ло", universe: "One Piece", damage: 25, hp: 40, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Хирург смерти. Увеличивает урон всей команды на 5%." },
        { name: "Итачи", universe: "Naruto", damage: 30, hp: 38, desc: "Гений клана Учиха. Без активных способностей." },
        { name: "Эрен", universe: "AoT", damage: 35, hp: 50, ability: { type: "teamHealOnWave", value: 0.02, desc: "Хил 2% за волну" }, desc: "После каждой победы лечит команду на 2%." },
        { name: "Гатс", universe: "Berserk", damage: 40, hp: 55, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Чёрный мечник. +5% урона команде." },
        { name: "Кид", universe: "One Piece", damage: 28, hp: 35, ability: { type: "critChance", value: 0.05, desc: "+5% крит" }, desc: "Магнитный пират. +5% к шансу крита." },
        { name: "Какаши", universe: "Naruto", damage: 26, hp: 42, desc: "Копирующий ниндзя. Без активных способностей." },
        { name: "Коби (Honestly impact)", universe: "One Piece", damage: 32, hp: 45, ability: { type: "critChance", value: 0.05, desc: "+5% крит" }, desc: "Честный удар. +5% к шансу крита." },
        { name: "Луччи (Сп-9)", universe: "One Piece", damage: 38, hp: 45, desc: "Агент Леопард. Без активных способностей." },
        { name: "Робот (Руди)", universe: "Invincible", damage: 30, hp: 48, desc: "Киборг-подросток." },
        { name: "Чёрный Нуар", universe: "The Boys", damage: 35, hp: 52, ability: { type: "damageReduction", value: 0.07, desc: "-7% урона" }, desc: "Молчаливый ниндзя Семёрки. Уменьшает получаемый урон на 7%." },
        { name: "Кимико", universe: "The Boys", damage: 32, hp: 48, ability: { type: "teamHealOnWave", value: 0.02, desc: "Хил 2% за волну" }, desc: "Девушка с супер-регенерацией. Лечит команду на 2% за волну." },
        { name: "Ракета", universe: "The Boys", damage: 38, hp: 40, ability: { type: "nonBossOneShot", chance: 0.03, desc: "3% ваншот (не босс)" }, desc: "К вам летит РАКЕТААААААА!!!! 3% шанс мгновенно убить врага (кроме боссов)." },
        { name: "Деку (5%)", universe: "MHA", damage: 34, hp: 44, ability: { type: "spareChanceBonus", value: 0.08, desc: "+8% к пощаде" }, statusAbility: { type: "clickDmgSelf", value: 0.02, desc: "-2% HP за клик" }, desc: "5% силы One For All. +8% к пощаде, но каждый клик отнимает 2% HP команды." }
    ],
    "Мифическая": [
        { name: "Луффи (4 гир)", universe: "One Piece", damage: 45, hp: 75, ability: { type: "damageReduction", value: 0.15, desc: "-15% урона" }, desc: "Boundman. Уменьшает получаемый урон на 15%." },
        { name: "Наруто (Мудрец)", universe: "Naruto", damage: 52, hp: 85, statusAbility: { type: "bleed", value: 0.10, desc: "Кровотечение +10%" }, desc: "Режим Мудреца. Увеличивает урон по врагу на 10% (кровотечение)." },
        { name: "Гоку (SSJ)", universe: "DB", damage: 60, hp: 70, ability: { type: "bossDamage", value: 0.10, desc: "+10% боссам" }, desc: "Супер Сайян. +10% урона боссам." },
        { name: "Годжо (флешбек)", universe: "JJK", damage: 66, hp: 66, statusAbility: { type: "shock", chance: 0.1, desc: "Шок 10%" }, desc: "Молодой сильнейший маг. 10% шанс шокнуть врага и сбросить его атаку." },
        { name: "Сукуна (15 пальцев)", universe: "JJK", damage: 70, hp: 70, statusAbility: { type: "bleed", value: 0.08, desc: "Кровотечение +8%" }, desc: "Король Проклятий. +8% урона через кровотечение." },
        { name: "Эйс", universe: "One Piece", damage: 70, hp: 47, statusAbility: { type: "fire", damage: 5, duration: 5000, desc: "Огонь 5/сек" }, desc: "Огненный кулак. Поджигает врага — 5 урона каждые 2 секунды." },
        { name: "Дедушка Гарп", universe: "One Piece", damage: 55, hp: 90, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, desc: "Герой морпехов. +10% урона всей команде." },
        { name: "Неуязвимый (Коалиция планет)", universe: "Invincible", damage: 65, hp: 80, ability: { type: "critChance", value: 0.20, desc: "+20% крит" }, desc: "Марк Грейсон в прайме. +20% к шансу крита." },
        { name: "Бог Скайпии Энель", universe: "One Piece", damage: 68, hp: 72, statusAbility: { type: "shock", chance: 0.12, desc: "Шок 12%" }, desc: "Бог молний. 12% шанс шокнуть врага." },
        { name: "Альбер (Кинг)", universe: "One Piece", damage: 72, hp: 68, statusAbility: { type: "fire", damage: 8, duration: 4000, desc: "Огонь 8/сек" }, desc: "Правая рука Кайдо. Поджигает врага — 8 урона каждые 2 секунды." },
        { name: "Виктория Ньюман", universe: "The Boys", damage: 65, hp: 85, statusAbility: { type: "bleed", value: 0.20, desc: "Кровотечение +20%" }, desc: "Глава секретного отдела. +20% урона через кровотечение (взрыв головы)." },
        { name: "Королева Мэйв", universe: "The Boys", damage: 70, hp: 88, ability: { type: "damageReduction", value: 0.15, desc: "-15% меньше урона" }, desc: "Самая сильная женщина. Уменьшает получаемый урон на 15%." },
        { name: "Солдатик (флешбек)", universe: "The Boys", damage: 72, hp: 82, ability: { type: "bossDamage", value: 0.12, desc: "+12% боссам" }, desc: "Первый супергерой. +12% урона боссам." },
        { name: "Штормфронт", universe: "The Boys", damage: 68, hp: 78, statusAbility: { type: "shock", chance: 0.15, desc: "Электричество 15%" }, desc: "Нацистка с молниями. 15% шанс шокнуть врага." },
        { name: "Ален (перерождённый)", universe: "Invincible", damage: 70, hp: 70, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, desc: "Инопланетянин-герой. +10% урона команде." },
        { name: "Звёздочка", universe: "The Boys", damage: 65, hp: 80, statusAbility: { type: "blind", value: 2, desc: "Ослепление +2" }, desc: "Световая героиня. Ослепляет врага — +2 клика до ответной атаки." },
        { name: "Деку: полное покрытие (20%)", universe: "MHA", damage: 58, hp: 68, ability: { type: "spareChanceBonus", value: 0.10, desc: "+10% к пощаде" }, statusAbility: { type: "dmgTakenIncrease", value: 0.10, desc: "+10% получ. урона" }, desc: "20% One For All. +10% к пощаде, но получаемый урон увеличен на 10%." }
    ],
    "Легендарная": [
        { name: "Кудзан", universe: "One Piece", damage: 85, hp: 120, statusAbility: { type: "freezeStacks", value: 2, desc: "Заморозка +2" }, desc: "Бывший адмирал Аокидзи. Замораживает врага — +2 клика до ответной атаки." },
        { name: "Йонко Шанкс", universe: "One Piece", damage: 95, hp: 90, ability: { type: "critChance", value: 0.15, desc: "+15% крит" }, desc: "Рыжеволосый император. +15% к шансу крита." },
        { name: "Хоумлендер", universe: "The Boys", damage: 115, hp: 125, ability: { type: "bossDamage", value: 0.18, desc: "+18% боссам" }, statusAbility: { type: "fire", damage: 10, duration: 3000, desc: "Лазеры 10/сек" }, desc: "Лидер Семёрки. +18% урона боссам и поджигает врага лазерами — 10 урона/2 сек." },
        { name: "Наруто (Барион)", universe: "Naruto", damage: 100, hp: 120, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, statusAbility: { type: "bleed", value: 0.1, desc: "Кровотечение +10%" }, desc: "Режим Бариона. +10% урона команде и +10% урона через кровотечение." },
        { name: "Гоку (UI)", universe: "DB", damage: 110, hp: 110, ability: { type: "damageAura", value: 0.13, desc: "+13% урона" }, desc: "Ультра Инстинкт. +13% урона всей команде." },
        { name: "Вегета (UE)", universe: "DB", damage: 115, hp: 105, ability: { type: "damageAura", value: 0.20, desc: "+20% урона, +10% враг", damageTakenMod: 0.10 }, desc: "Ультра Эго. +20% урона команде, но враг бьёт на 10% сильнее." },
        { name: "Мадара", universe: "Naruto", damage: 120, hp: 100, ability: { type: "damageReduction", value: 0.05, desc: "-5% урона" }, statusAbility: { type: "freezeStacks", value: 1, desc: "Заморозка +1" }, desc: "Призрак Учиха. -5% получаемого урона и заморозка +1." },
        { name: "Гарп (Galaxy impact)", universe: "One Piece", damage: 105, hp: 140, ability: { type: "damageAura", value: 0.20, desc: "+20% урона" }, desc: "Кулак галактики. +20% урона всей команде." },
        { name: "Омни-Мэн", universe: "Invincible", damage: 120, hp: 130, ability: { type: "damageAura", value: 0.12, desc: "+12% урона" }, statusAbility: { type: "bleed", value: 0.15, desc: "Кровотечение +15%" }, desc: "Нолан Грейсон. +12% урона команде и +15% урона через кровотечение." },
        { name: "Ло (Пробужденный)", universe: "One Piece", damage: 105, hp: 145, ability: { type: "healOnWin", percent: 0.03, desc: "+3% HP" }, statusAbility: { type: "shock", chance: 0.10, desc: "Электричество 10%" }, desc: "Пробуждённый фрукт. Лечит 3% HP при победе и 10% шанс шока." }
    ],
    "Секретная": [
        { name: "Луффи: Ника, Бог Солнца", universe: "One Piece", damage: 150, hp: 200, sellPrice: 1500, minRebirth: 2, ability: { type: "bossDamage", value: 0.30, desc: "+30% боссам", damageReduction: 0.10 }, desc: "Пробуждение дьявольского фрукта. +30% урона боссам и -10% получаемого урона." },
        { name: "Космический Гароу", universe: "OPM", damage: 250, hp: 400, sellPrice: 2800, minRebirth: 4, ability: { type: "scaleWithWins", value: 0.01, desc: "+1% силы/волна" }, desc: "Космический монстр. Увеличивает свою силу на 1% за каждую побеждённую волну." },
        { name: "Сайтама", universe: "OPM", damage: 200, hp: 300, sellPrice: 1500, minRebirth: 3, ability: { type: "oneShot", chance: 0.05, desc: "5% ваншот" }, desc: "Лысый плащ. 5% шанс убить врага с одного удара." },
        { name: "Борос", universe: "OPM", damage: 180, hp: 350, sellPrice: 1400, minRebirth: 2, ability: { type: "healOnWin", percent: 0.05, desc: "+5% HP" }, desc: "Владыка вселенной. Лечит 5% HP при победе." },
        { name: "Бог Усопп", universe: "One Piece", damage: 250, hp: 400, sellPrice: 2000, minRebirth: 3, ability: { type: "resurrect", chance: 0.05, desc: "5% воскрес" }, desc: "Великий воин морей. 5% шанс воскреснуть при смерти." },
        { name: "Зено", universe: "DB", damage: 300, hp: 500, sellPrice: 3000, minRebirth: 4, ability: { type: "zenoCheckpoint", desc: "10% след. чекпоинт" }, statusAbility: { type: "fatigueResist", value: 0.30, desc: "-30% усталости" }, desc: "Царь всего. 10% шанс открыть следующий чекпоинт и -30% усталости." },
        { name: "Анти-спираль", universe: "GL", damage: 280, hp: 450, sellPrice: 2500, minRebirth: 2, ability: { type: "damageReduction", value: 0.30, desc: "-30% урона" }, desc: "Враг всего живого. Уменьшает получаемый урон на 30%." },
        { name: "Молодой Гарп", universe: "One Piece", damage: 260, hp: 380, sellPrice: 2500, minRebirth: 3, ability: { type: "damageAura", value: 0.25, desc: "+25% урона" }, desc: "Гарп в расцвете сил. +25% урона всей команде." },
        { name: "Им (Правитель)", universe: "One Piece", damage: 290, hp: 450, sellPrice: 3000, minRebirth: 5, ability: { type: "bossDamage", value: 0.20, desc: "+20% боссам" }, desc: "Тайный правитель мира. +20% урона боссам." },
        { name: "Дэнди", universe: "Space Dandy", damage: 200, hp: 650, sellPrice: 2200, minRebirth: 3, ability: { type: "critChance", value: 0.15, desc: "+15% крит" }, statusAbility: { type: "shock", chance: 0.20, desc: "Шок 20%" }, desc: "Постоянный клиент космического фансервис-кафе «Груди» " },
        { name: "Кайдо", universe: "One Piece", damage: 300, hp: 500, sellPrice: 3000, minRebirth: 4, ability: { type: "bossDouble", desc: "x2 урон (босс)" }, desc: "Сильнейший в мире. При битве с боссом наносит удвоенный урон." },
        { name: "Император Марк", universe: "Invincible", damage: 310, hp: 500, sellPrice: 3000, minRebirth: 5, ability: { type: "bossSupport", desc: "+15% урона (босс)" }, statusAbility: { type: "bleed", value: 0.12, desc: "Кровотечение +12%" }, desc: "Марк спустя 500 лет. +15% урона команде при битве с боссом, +12% урона через кровотечение." },
        { name: "Деку (100%)", universe: "MHA", damage: 280, hp: 450, sellPrice: 2800, minRebirth: 4, ability: { type: "bossDoubleSelf", desc: "x2 урон (босс), -30% на 10 волн" }, desc: "Полная сила One For All. Удваивает урон при битве с боссом, но ослабляет на 30% на следующие 10 волн." },
        { name: "Всемогущий (прайм)", universe: "MHA", damage: 300, hp: 480, sellPrice: 3000, minRebirth: 4, ability: { type: "damageAura", value: 0.15, desc: "+15% урона" }, statusAbility: { type: "bossDamageAura", value: 0.10, desc: "+25% (босс)" }, desc: "Символ мира в прайме. +15% урона команде и +25% при битве с боссом." }
    ],
    "Эволюционная": [
        { name: "Луффи : Король пиратов", universe: "One Piece", damage: 1200, hp: 2000, minRebirth: 5, ability: { type: "bossDamage", value: 0.50, desc: "+50% боссам", bossReduction: 0.40 }, unsellable: true, desc: "Король пиратов. +50% урона боссам и -40% получаемого урона при битве с боссом." },
        { name: "Сайтама/Гароу", universe: "Эволюция", damage: 1500, hp: 2500, minRebirth: 5, ability: { type: "oneShot", chance: 0.15, desc: "15% ваншот" }, statusAbility: { type: "scaleWithWins", value: 0.03, desc: "+3% силы/волна" }, unsellable: true, desc: "Слияние сильнейших. 15% шанс ваншота и +3% силы за каждую волну." },
        { name: "Гарп/Кудзан", universe: "Эволюция", damage: 1400, hp: 2200, minRebirth: 5, ability: { type: "damageAura", value: 0.40, desc: "+40% урона" }, statusAbility: { type: "absoluteFreeze", value: 0.5, desc: "-50% урона" }, unsellable: true, desc: "Учитель и ученик. +40% урона команде и -50% получаемого урона." },
        { name: "Семёрка", universe: "The Boys", damage: 1600, hp: 2600, minRebirth: 5, ability: { type: "sevenSpecial", desc: "V x3, хил 5%/волна", healOnWave: 0.05, damageReduction: 0.10 }, statusAbility: { type: "blind", value: 2, desc: "Ослепление +2" }, extraStatus: [{ type: "fire", damage: 10, duration: 3000 }, { type: "shock", chance: 0.15 }], unsellable: true, desc: "Вся Семёрка вместе. Препарат V утраивает баффы, хил 5% за волну, ослепление, лазеры и электричество." },
        { name: "Уильям Фрэнсис", universe: "Invincible", damage: 800, hp: 1200, minRebirth: 5, ability: { type: "copyEnemyChance", chance: 0.15, desc: "15% копирует врага" }, unsellable: true, desc: "Копирует характеристики врага с шансом 15%." }
    ],
    "Босс": [
        { name: "Охотник за головами", universe: "Боссы", damage: 150, hp: 300, sellPrice: 1000, minRebirth: 0, ability: { type: "bossDamage", value: 0.10, desc: "+10% боссам" }, desc: "Получен после пощады босса 10000 волны. +10% урона боссам." },
        { name: "Король Демонов", universe: "Боссы", damage: 200, hp: 400, sellPrice: 2000, minRebirth: 1, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Получен после пощады босса 100 волны. +5% урона команде." },
        { name: "Маджин Буу", universe: "Боссы", damage: 250, hp: 500, sellPrice: 3000, minRebirth: 2, statusAbility: { type: "bleed", value: 0.10, desc: "Кровотечение +10%" }, desc: "Получен после пощады босса 200 волны. +10% урона через кровотечение." },
        { name: "Король Пиратов", universe: "Боссы", damage: 400, hp: 800, sellPrice: 5000, minRebirth: 3, ability: { type: "bossDamage", value: 0.20, desc: "+20% боссам" }, desc: "Получен после пощады босса 500 волны. +20% урона боссам." }
    ],
    "Пасхалка": [
        { name: "Пельмешка", universe: "Кухня", damage: 35, hp: 60, unsellable: true, ability: { type: "luckAura", value: 0.50, desc: "+50% удачи" }, desc: "Вкусный пельмень. +50% к удаче." },
        { name: "Попугай Соня", universe: "Зоопарк", damage: 3, hp: 5, unsellable: true, ability: { type: "deathBonus", value: 0.30, desc: "+30% звёзд" }, desc: "После смерти даёт +30% к накопленным звёздам." },
        { name: "Кофе", universe: "AoT", damage: 20, hp: 50, unsellable: true, ability: { type: "fatigueResist", value: 0.50, desc: "-50% усталости" }, desc: "Бодрящий напиток. Снижает набор усталости на 50%." }
    ]
};

// ========== БОССЫ И ДИАЛОГИ ==========
const bossTemplates = {
    // ===== НАЧАЛО: 50–500 (плавный старт) =====
    50:  { name: "Король Демонов", hpMult: 6, dmgMult: 1.2, dialogue: "Ты думаешь, что сможешь одолеть меня? Глупец.", enemyStatus: { type: "freezeStacks", value: 1 }, canSpare: true, spareReward: "Король Демонов", arenaTypes: [0] },
    100: { name: "Маджин Буу", hpMult: 8, dmgMult: 1.6, dialogue: "Буу, я голоден! Ты станешь моим обедом!", enemyStatus: { type: "bleed", value: 0.2 }, canSpare: true, spareReward: "Маджин Буу", arenaTypes: [0] },
    150: { name: "Дзирэн", hpMult: 9, dmgMult: 2.0, dialogue: "Сила — это абсолютная справедливость.", enemyStatus: { type: "shock", chance: 0.2 }, canSpare: true, arenaTypes: [0,1] },
    200: { name: "Живой камень", hpMult: 16, dmgMult: 1.4, dialogue: "Может я и наношу мало урона, но сначала попробуй меня пробить!", enemyStatus: { type: "shock", chance: 0.4 }, canSpare: true, arenaTypes: [0,1] },
    250: { name: "Великий самурай", hpMult: 10, dmgMult: 3.2, dialogue: "У меня нет цели. Только путь.", enemyStatus: { type: "bleed", value: 0.2 }, canSpare: true, arenaTypes: [1,2] },
    300: { name: "Бог Грома", hpMult: 13, dmgMult: 2.6, dialogue: "Ты всего лишь искра в моей буре!", enemyStatus: { type: "shock", chance: 0.5 }, canSpare: true, arenaTypes: [1,2] },
    350: { name: "Ледяной Титан", hpMult: 18, dmgMult: 2.2, dialogue: "Я заморожу само время!", enemyStatus: { type: "freezeStacks", value: 3 }, canSpare: true, arenaTypes: [0,1,8] },
    400: { name: "Теневой Дракон", hpMult: 15, dmgMult: 3.0, dialogue: "Тени поглотят тебя целиком.", enemyStatus: { type: "blind", value: 2 }, canSpare: true, arenaTypes: [1,3] },
    450: { name: "Гаара (Хвостатый)", hpMult: 14, dmgMult: 3.4, dialogue: "Песок защитит меня... и похоронит тебя.", enemyStatus: { type: "bleed", value: 0.25 }, canSpare: true, arenaTypes: [2,3] },
    500: { name: "Король Пиратов", hpMult: 17, dmgMult: 3.6, dialogue: "Моё сокровище? Ищите! Я всё оставил там!", canSpare: true, spareReward: "Король Пиратов", isSpecial: true, arenaTypes: [0,1,2,3] },

    // ===== АРКИ: 550–1000 =====
    550: { name: "Кайдо (Гибрид)", hpMult: 22, dmgMult: 4.2, dialogue: "Хочешь умереть? Я дам тебе эту честь!", enemyStatus: { type: "fire", damage: 8, duration: 5000 }, canSpare: true, spareReward: "Кайдо", arenaTypes: [2,3,7] },
    600: { name: "Мадара Учиха", hpMult: 24, dmgMult: 4.8, dialogue: "Реальность — лишь иллюзия. Моя иллюзия.", enemyStatus: { type: "blind", value: 3 }, canSpare: true, arenaTypes: [0,1,2,3,8] },
    650: { name: "Король Смерти", hpMult: 28, dmgMult: 3.0, dialogue: "Твоя душа... такая вкусная.", enemyStatus: { type: "poison", damage: 5 }, canSpare: true, arenaTypes: [5,6,7] },
    700: { name: "Гоку (SSJ Blue)", hpMult: 26, dmgMult: 5.4, dialogue: "Я покажу тебе настоящую силу саяна!", enemyStatus: { type: "shock", chance: 0.3 }, canSpare: true, arenaTypes: [2,3,7] },
    750: { name: "Космический Титан", hpMult: 32, dmgMult: 4.4, dialogue: "Я видел рождение и смерть галактик.", enemyStatus: { type: "freezeStacks", value: 2 }, canSpare: true, arenaTypes: [0,1,8,9] },
    800: { name: "Астарот", hpMult: 30, dmgMult: 5.0, dialogue: "Ад ждёт тебя с распростёртыми объятиями.", enemyStatus: { type: "fire", damage: 10, duration: 4000 }, canSpare: true, arenaTypes: [0,1,8,10] },
    850: { name: "Левиафан (Пробуждённый)", hpMult: 36, dmgMult: 4.0, dialogue: "Океан поглотит всё.", enemyStatus: { type: "bleed", value: 0.3 }, canSpare: true, arenaTypes: [2,3,5,7] },
    900: { name: "Властелин Молний", hpMult: 28, dmgMult: 5.8, dialogue: "Быстрее молнии? Не в этой жизни.", enemyStatus: { type: "shock", chance: 0.6 }, canSpare: true, arenaTypes: [1,3,9,10] },
    950: { name: "Жнец Душ", hpMult: 34, dmgMult: 5.2, dialogue: "Твоя жизнь... она закончится здесь.", enemyStatus: { type: "poison", damage: 8 }, canSpare: true, arenaTypes: [1,5,6,7] },

    // ===== СРЕДНЯЯ АРКА: 1000–2000 =====
    1000: { name: "Император Хаоса", hpMult: 40, dmgMult: 5.6, dialogue: "Хаос — это не беспорядок. Это свобода!", enemyStatus: { type: "bleed", value: 0.35 }, canSpare: true, arenaTypes: [0,2,4,6,8] },
    1100: { name: "Архидемон Баал", hpMult: 44, dmgMult: 6.0, dialogue: "Я сожгу твою душу дотла.", enemyStatus: { type: "fire", damage: 15, duration: 3000 }, canSpare: true, arenaTypes: [3,5,7,9,10] },
    1200: { name: "Хранитель Бездны", hpMult: 48, dmgMult: 5.4, dialogue: "Бездна смотрит в тебя... и улыбается.", enemyStatus: { type: "freezeStacks", value: 4 }, canSpare: true, arenaTypes: [0,1,2,3,8] },
    1300: { name: "Небесный Страж", hpMult: 42, dmgMult: 6.8, dialogue: "Небеса не простят твоих грехов.", enemyStatus: { type: "blind", value: 4 }, canSpare: true, arenaTypes: [4,6,7,10] },
    1400: { name: "Князь Тьмы", hpMult: 52, dmgMult: 6.4, dialogue: "Тьма — это не отсутствие света. Это сила.", enemyStatus: { type: "poison", damage: 10 }, canSpare: true, arenaTypes: [2,3,6,8,9] },
    1500: { name: "Эрен (Титан-основатель)", hpMult: 56, dmgMult: 7.2, dialogue: "Я уничтожу всех... ради свободы.", enemyStatus: { type: "bleed", value: 0.4 }, canSpare: true, arenaTypes: [0,1,4,5,8] },
    1600: { name: "Гатс (Берсерк)", hpMult: 60, dmgMult: 8.0, dialogue: "Я буду бороться... до последнего вздоха.", enemyStatus: { type: "bleed", value: 0.5 }, canSpare: true, spareReward: "Гатс (Берсерк)", arenaTypes: [1,3,5,7,9] },
    1700: { name: "Драконий Император", hpMult: 58, dmgMult: 7.6, dialogue: "Моя чешуя крепче любой брони.", enemyStatus: { type: "fire", damage: 20, duration: 2000 }, canSpare: true, arenaTypes: [0,2,5,9,10] },
    1800: { name: "Великий Маг", hpMult: 46, dmgMult: 9.0, dialogue: "Магия — это искусство разрушения.", enemyStatus: { type: "shock", chance: 0.7 }, canSpare: true, arenaTypes: [1,4,6,7,10] },
    1900: { name: "Луффи (Гир 5)", hpMult: 64, dmgMult: 8.4, dialogue: "Я стану Королём Пиратов!", enemyStatus: { type: "blind", value: 3 }, canSpare: true, arenaTypes: [0,3,5,8,9] },

    // ===== ВЫСОКАЯ АРКА: 2000–3500 =====
    2000: { name: "Омни-Мэн (Пробуждённый)", hpMult: 70, dmgMult: 9.2, dialogue: "Подумай, сын! Ты сражаешься на неправильной стороне!", enemyStatus: { type: "bleed", value: 0.5 }, canSpare: true, spareReward: "Омни-Мэн", arenaTypes: [4,6,8,9,10] },
    2100: { name: "Сайтама (Серьёзный)", hpMult: 120, dmgMult: 14.0, dialogue: "Ну... я просто честно тренировался.", enemyStatus: { type: "shock", chance: 0.5 }, canSpare: true, spareReward: "Сайтама", arenaTypes: [0,2,4,6,8,10] },
    2200: { name: "Король Проклятий (Полный)", hpMult: 76, dmgMult: 10.0, dialogue: "Ты даже не достоин быть моей закуской.", enemyStatus: { type: "poison", damage: 12 }, canSpare: true, arenaTypes: [1,3,5,7,9,10] },
    2300: { name: "Бог Гароу", hpMult: 82, dmgMult: 10.8, dialogue: "Я — абсолютное зло. И я уничтожу всё.", enemyStatus: { type: "fire", damage: 25, duration: 1500 }, canSpare: true, arenaTypes: [2,4,6,8,9,10] },
    2400: { name: "Зено (Рассерженный)", hpMult: 95, dmgMult: 12.0, dialogue: "Ты... ты меня разозлил.", enemyStatus: { type: "oneshot", chance: 0.05 }, canSpare: false, arenaTypes: [0,3,6,7,8,9] },
    2500: { name: "Анти-Спираль (Финальная форма)", hpMult: 110, dmgMult: 13.0, dialogue: "Отчаяние... это всё что у тебя осталось.", enemyStatus: { type: "freezeStacks", value: 6 }, canSpare: true, arenaTypes: [0,1,2,4,6,8,9] },
    2600: { name: "Деку (1.000.000%)", hpMult: 100, dmgMult: 13.5, dialogue: "Я передам эстафету... ВСЕМ!", enemyStatus: { type: "shock", chance: 0.8 }, canSpare: true, arenaTypes: [1,3,5,7,9] },
    2700: { name: "Имир (Прародитель)", hpMult: 125, dmgMult: 12.5, dialogue: "Я прожила 2000 лет... и всё ради этого.", enemyStatus: { type: "bleed", value: 0.6 }, canSpare: true, arenaTypes: [0,2,4,6,8] },
    2800: { name: "Властелин Времени", hpMult: 90, dmgMult: 15.0, dialogue: "Время... оно течёт только в одном направлении.", enemyStatus: { type: "blind", value: 5 }, canSpare: true, arenaTypes: [3,5,7,9,10] },
    2900: { name: "Архитектор Реальности", hpMult: 108, dmgMult: 14.5, dialogue: "Я создал этот мир... и я могу его уничтожить.", enemyStatus: { type: "poison", damage: 15 }, canSpare: true, arenaTypes: [0,1,4,6,8,10] },

    // ===== ЭПИЧЕСКАЯ АРКА: 3000–5000 =====
    3000: { name: "Хоумлендер (Безудержный)", hpMult: 120, dmgMult: 16.0, dialogue: "Я — единственный бог в этом мире.", enemyStatus: { type: "fire", damage: 30, duration: 1000 }, canSpare: true, arenaTypes: [2,5,8,9,10] },
    3200: { name: "Всеотец Один", hpMult: 140, dmgMult: 15.0, dialogue: "Мудрость... вот что побеждает силу.", enemyStatus: { type: "shock", chance: 0.9 }, canSpare: true, arenaTypes: [0,3,5,7,9] },
    3400: { name: "Феникс Возрождённый", hpMult: 160, dmgMult: 14.0, dialogue: "Из пепла я восстану снова и снова!", enemyStatus: { type: "fire", damage: 35, duration: 800 }, canSpare: true, arenaTypes: [1,4,6,8,10] },
    3600: { name: "Тёмный Рыцарь", hpMult: 175, dmgMult: 17.0, dialogue: "Я — возмездие. Я — ночь.", enemyStatus: { type: "bleed", value: 0.7 }, canSpare: true, arenaTypes: [0,2,5,7,9,10] },
    3800: { name: "Разрушитель Миров", hpMult: 190, dmgMult: 18.5, dialogue: "Я уничтожил сотни миров. Твой будет последним.", enemyStatus: { type: "oneshot", chance: 0.03 }, canSpare: true, arenaTypes: [1,3,6,8,9,10] },
    4000: { name: "Бог-Император", hpMult: 210, dmgMult: 20.0, dialogue: "Склонись... или умри стоя.", enemyStatus: { type: "freezeStacks", value: 8 }, canSpare: true, arenaTypes: [0,1,2,3,4,5,6,7,8,9,10] },
    4200: { name: "Абсолютное Ничто", hpMult: 240, dmgMult: 18.0, dialogue: "...............", enemyStatus: { type: "blind", value: 6 }, canSpare: false, arenaTypes: [6,7,8,9,10] },
    4400: { name: "Хранитель Врат", hpMult: 230, dmgMult: 22.0, dialogue: "За мной — бесконечность. Ты не пройдёшь.", enemyStatus: { type: "shock", chance: 1.0 }, canSpare: true, arenaTypes: [0,2,4,6,8,10] },
    4600: { name: "Судья Душ", hpMult: 260, dmgMult: 24.0, dialogue: "Твоя душа взвешена... и признана недостойной.", enemyStatus: { type: "poison", damage: 20 }, canSpare: true, arenaTypes: [1,3,5,7,9,10] },
    4800: { name: "Король-Звезда", hpMult: 280, dmgMult: 26.0, dialogue: "Я зажгу сверхновую... прямо здесь.", enemyStatus: { type: "fire", damage: 40, duration: 500 }, canSpare: true, arenaTypes: [0,1,4,6,8,9,10] },
    5000: { name: "Предвестник Конца", hpMult: 310, dmgMult: 30.0, dialogue: "Конец... это только начало.", enemyStatus: { type: "oneshot", chance: 0.1 }, canSpare: false, arenaTypes: [0,1,2,3,4,5,6,7,8,9,10] },

    // ===== ФИНАЛ =====
    10000: { name: "Охотник за головами (Финальная форма)", hpMult: 55, dmgMult: 5.0, dialogue: "Хах, пока вас не было я тренировался целыми днями ради этого момента! Теперь за вашу голову готовы отдать 100.000 тенге!", canSpare: true, spareReward: "Охотник за головами", hasDialog: true, arenaTypes: [0,1,2,3,4,5,6,7,8,9,10] }
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
let cardWeights = { "Обычная":45,"Редкая":25,"Сверх редкая":12,"Эпик":8,"Мифическая":5,"Легендарная":3,"Секретная":1.5,"Эволюционная":0.0001,"Босс":0 };
const enemyNames = ["Эльф-лучник","Голем","Орк-берсерк","Слизь-убийца","Гоблин-шаман","Скелет-воин","Тёмный маг","Вампир-князь","Драконий прихвостень","Лесной дух","Кровавый берсерк","Ледяной элементаль"];
const enemyStatusPool = [null, null, null, { type: "freezeStacks", value: 1 }, { type: "bleed", value: 0.1 }, { type: "shock", chance: 0.1 }];
const shopItemsPool = { common: [{ name: "Обычная карта", type: "card", rarity: "Обычная", cost: 25 }, { name: "Зелье урона x1.3", type: "buff", buffId: "dmg13", duration: 7200000, cost: 150 }], rare: [{ name: "Редкая карта", type: "card", rarity: "Редкая", cost: 55 }, { name: "Зелье удачи", type: "buff", buffId: "luck13", duration: 7200000, cost: 150 }], epic: [{ name: "Эпик карта", type: "card", rarity: "Эпик", cost: 180 }, { name: "Зелье урона x2", type: "buff", buffId: "doubleDamage", duration: 14400000, cost: 800 }] };
const specialPotions = [{ name: "🧪 Зелье урона x4", desc: "12 часов", buffId: "quadDamage", duration: 43200000, cost: 3000 }, { name: "🧪 Зелье звёзд x2", desc: "6 часов", buffId: "doubleStars", duration: 21600000, cost: 5000 }, { name: "🧪 Зелье HP x3", desc: "4 часа", buffId: "tripleHp", duration: 14400000, cost: 2000 }];
const bulkSellOptions = [{ name: "Обычные", rarity: "Обычная" }, { name: "Редкие", rarity: "Редкая" }, { name: "Сверхредкие", rarity: "Сверх редкая" }, { name: "Эпики", rarity: "Эпик" }, { name: "Мифические", rarity: "Мифическая" }, { name: "Легендарные", rarity: "Легендарная" }];
const autoRestOptions = [{ name: "90%", threshold: 90 }, { name: "80%", threshold: 80 }, { name: "70%", threshold: 70 }, { name: "60%", threshold: 60 }, { name: "50%", threshold: 50 }, { name: "40%", threshold: 40 }, { name: "35%", threshold: 35 }, { name: "30%", threshold: 30 }, { name: "25%", threshold: 25 }, { name: "20%", threshold: 20 }, { name: "15%", threshold: 15 }, { name: "10%", threshold: 10 }, { name: "5%", threshold: 5 }, { name: "1%", threshold: 1 }];
const codeList = { "PELMESHKA": { type: "card", rarity: "Пасхалка", tpl: "Пельмешка", points: 1000 }, "Хочу Звезды": { type: "points", amount: 5000 }, "Сила": { type: "buff", buffId: "dmg13", duration: 86400000 }, "789456123": { type: "moderUnlock" } };
const worldMusicNotes = {};
