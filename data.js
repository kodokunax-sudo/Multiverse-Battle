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

// ========== МУЗЫКАЛЬНЫЕ ТЕМЫ ==========
// music/main.mp3, music/battle.mp3, music/shop.mp3

// ========== МИРЫ ==========
const worlds = [
    { name: "Лес начала и конца", minWave: 1, maxWave: 250, color: "#2ecc71" },
    { name: "Огненная пустошь", minWave: 251, maxWave: 499, color: "#e74c3c" },
    { name: "Сломанный Космос", minWave: 500, maxWave: 600, color: "#2d3436" },
    { name: "Гранд Лайн", minWave: 601, maxWave: 950, color: "#3498db" },
    { name: "Легенды Роджера", minWave: 951, maxWave: 1000, color: "#ff8800" },
    { name: "Замороженные земли", minWave: 1001, maxWave: 1200, color: "#00cec9" },
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
        { name: "Луффи", universe: "One Piece", damage: 4, hp: 8, speed: 0.6, desc: "Базовый Луффи. Никаких способностей, просто бьёт." },
        { name: "Усопп", universe: "One Piece", damage: 3, hp: 6, speed: 0.4, desc: "Трусливый снайпер. Без способностей." },
        { name: "Нами", universe: "One Piece", damage: 2, hp: 8, speed: 0.5, desc: "Навигатор. Без способностей." },
        { name: "Ездок", universe: "OPM", damage: 1, hp: 11, speed: 0.3, desc: "Герой класса С. Много HP." },
        { name: "Деку (безпричудный)", universe: "MHA", damage: 2, hp: 12, speed: 0.5, ability: { type: "desperateStrike", value: 0.05, threshold: 0.30, desc: "+5% урона при HP ниже 30%" }, desc: "Без причуды, но мечтающий стать героем. Разве не глупо? В критический момент помогает команде наносить больше урона." },
        { name: "Консперон (обычный)", universe: "Dandadan", damage: 4, hp: 5, speed: 0.7, desc: "ИНОПЛОНЕТЯНЫ СУЩЕСТВУЮТ!!!!!" },
        { name: "Танджиро", universe: "DS", damage: 3, hp: 10, speed: 0.5, desc: "Охотник на демонов." },
        { name: "Уборщик Коби", universe: "One piece", damage: 1, hp: 1, speed: 0.1, desc: "Самый слабый персонаж. С него всё начиналось." },
        { name: "Аста", universe: "Black Clover", damage: 3, hp: 8, speed: 0.6, desc: "Маг без магии с анти-мечом." },
        { name: "Хьюи (слабый)", universe: "The Boys", damage: 2, hp: 10, speed: 0.4, desc: "Парень, чью девушку сбил А Train." },
        { name: "Френчи", universe: "The Boys", damage: 4, hp: 6, speed: 0.5, desc: "Оружейник и спецназовец." },
        { name: "Дональд", universe: "Invincible", damage: 3, hp: 9, speed: 0.4, desc: "К счастью это не Дональд Трамп...." },
        {
            "name": "Поко",
            "universe": "JoJo",
            "damage": 2,
            "hp": 7,
            "speed": 0.4,
            "desc": "Мальчик из первой части, который помогает Джонатану найти дорогу и преодолеть страх."
        },
        {
            "name": "Дэнни (пёс Джонатана)",
            "universe": "JoJo",
            "damage": 3,
            "hp": 9,
            "speed": 0.45,
            "desc": "Преданный пёс Джонатана. Одна из самых запоминающихся частей его детства."
        },
        {
            "name": "Эрина Пендлтон (юность)",
            "universe": "JoJo",
            "damage": 2,
            "hp": 10,
            "speed": 0.4,
            "ability": {
                "type": "healOnWin",
                "percent": 0.01,
                "desc": "+1% HP после победы"
            },
            "desc": "Подруга детства Джонатана. Не боец, но её поддержка помогает пережить следующий бой."
        }
    ],
    "Редкая": [
        { name: "Брук", universe: "One Piece", damage: 7, hp: 12, speed: 0.9, desc: "Скелет-музыкант. Йохохо!" },
        { name: "Иноске", universe: "DS", damage: 9, hp: 15, speed: 1.0, desc: "Человек-кабан с двумя мечами." },
        { name: "Киллуа", universe: "HxH", damage: 10, hp: 13, speed: 1.3, desc: "Молниеносный ассасин семьи Золдик." },
        { name: "Рейген", universe: "Mob 100", damage: 4, hp: 25, speed: 0.5, desc: "Великий экстрасенс XXI века (нет)." },
        { name: "Марк (начало)", universe: "Invincible", damage: 8, hp: 18, speed: 0.8, desc: "Сын Омни-Мэна. Только получил силы." },
        { name: "ММ (Марвин)", universe: "The Boys", damage: 7, hp: 20, speed: 0.6, desc: "Лидер команды Пацаны. Тактик." },
        { name: "Кимико (начало)", universe: "The Boys", damage: 9, hp: 14, speed: 0.9, desc: "Немая убийца с супер-регенерацией." },
        { name: "Ева Уилкинс", universe: "Invincible", damage: 6, hp: 22, speed: 0.7, desc: "Девушка-герой с левитацией." },
        {"name":"Тони Тони Чоппер","universe":"One Piece","patchId":"one_piece","damage":8,"hp":20,"speed":0.7,"ability":{"type":"healOnWin","percent":0.02,"desc":"+2% HP после победы"},"desc":"Доктор команды Мугивар. Его медицинские знания помогают отряду восстановиться после боя."},
        {"name":"Нефертари Виви","universe":"One Piece","patchId":"one_piece","damage":7,"hp":18,"speed":0.7,"ability":{"type":"damageAura","value":0.03,"desc":"+3% урона команде"},"desc":"Принцесса Алабасты и союзница пиратов. Поддерживает команду храбростью и тактикой."},
        {"name":"Бон Клей (Мистер 2)","universe":"One Piece","patchId":"one_piece","damage":12,"hp":15,"speed":1,"ability":{"type":"damageMultChance","chance":0.12,"mult":1.2,"desc":"12% шанс нанести ×1,2 урона"},"desc":"Мастер маскировки и стремительных ударов, который всегда сражается за друзей."},
        {"name":"Гальдино (Мистер 3)","universe":"One Piece","patchId":"one_piece","damage":9,"hp":22,"speed":0.55,"ability":{"type":"damageReduction","value":0.03,"desc":"−3% получаемого урона"},"desc":"Хитрый мастер воска. Создаёт защитные конструкции и ловушки."},
        {"name":"Фокси","universe":"One Piece","patchId":"one_piece","damage":6,"hp":15,"speed":0.55,"statusAbility":{"type":"freezeStacks","value":1,"desc":"Замедление: +1 клик до контратаки"},"desc":"Капитан Пиратов Фокси использует силу замедляющего фрукта, чтобы сбивать темп противника."},
        { name: "Мумен Райдер", universe: "OPM", patchId: "one_punch_man", damage: 6, hp: 22, speed: 0.6, ability: { type: "desperateStrike", value: 0.06, threshold: 0.30, desc: "+6% урона при HP ниже 30%" }, desc: "Герой класса C, который не отступает даже перед заведомо более сильным врагом. Когда здоровье команды падает ниже 30%, его решимость усиливает общий урон." },
        { name: "Кинг (без шрама)", universe: "OPM", patchId: "one_punch_man", damage: 4, hp: 18, speed: 0.45, ability: { type: "desperateStrike", value: 0.05, threshold: 0.30, desc: "+5% урона при HP ниже 30%" }, desc: "Его легендарная аура усиливает урон команды, когда здоровье падает ниже 30%." },
        {
            "name": "Роберт Э. О. Спидвагон",
            "universe": "JoJo",
            "damage": 8,
            "hp": 17,
            "speed": 0.7,
            "desc": "Бывший уличный боец, ставший верным союзником Джонатана и основателем фонда Спидвагонов."
        },
        {
            "name": "Игги (The Fool)",
            "universe": "JoJo",
            "damage": 11,
            "hp": 16,
            "speed": 1.2,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.08,
                "mult": 1.25,
                "desc": "8% шанс нанести ×1,25 урона"
            },
            "desc": "Упрямый пёс-стенд-юзер. The Fool позволяет ему создавать конструкции из песка."
        },
        {
            "name": "Бруфорд",
            "universe": "JoJo",
            "damage": 10,
            "hp": 22,
            "speed": 0.65,
            "ability": {
                "type": "damageReduction",
                "value": 0.03,
                "desc": "−3% получаемого урона"
            },
            "desc": "Рыцарь-зомби с длинными волосами, которыми он может связывать противников."
        },
        {
            "name": "Таркус",
            "universe": "JoJo",
            "damage": 12,
            "hp": 25,
            "speed": 0.6,
            "desc": "Могучий рыцарь, превращённый в жестокого зомби."
        },
        {
            "name": "Маунтин Тим",
            "universe": "JoJo",
            "damage": 12,
            "hp": 20,
            "speed": 0.9,
            "ability": {
                "type": "critChance",
                "value": 0.05,
                "desc": "+5% шанс критического удара"
            },
            "desc": "Охотник за головами из Steel Ball Run, использующий верёвку для атак и передвижения."
        },
        {
            "name": "Шигекиё Янгу (Шигечи)",
            "universe": "JoJo",
            "damage": 10,
            "hp": 23,
            "speed": 0.65,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.08,
                "mult": 1.2,
                "desc": "8% шанс нанести ×1,2 урона"
            },
            "desc": "Школьник со стендом Harvest, который действует сразу множеством крошечных помощников."
        }
    ],
    "Сверх редкая": [
        { name: "Луффи (2 гир)", universe: "One Piece", damage: 16, hp: 25, speed: 1.5, desc: "Ускоренный кровоток. Быстрее и сильнее." },
        { name: "Зоро (до таймскипа)", universe: "One Piece", damage: 18, hp: 22, speed: 1.1, desc: "Зоро, чтоб не заблудиться,\nК нитке вздумал прицепиться.\nНить порвалась — он улетел\nИ в кастрюлю к Санджи прилетел." },
        { name: "Санджи (до таймскипа)", universe: "One Piece", damage: 16, hp: 20, speed: 1.3, desc: "Чёрная нога. Шеф-повар." },
        { name: "Гаара", universe: "Naruto", damage: 17, hp: 28, speed: 0.9, desc: "Джинчурики с песчаной бронёй." },
        { name: "Эмир", universe: "AoT", damage: 25, hp: 10, speed: 1.4, desc: "Солдат разведкорпуса." },
        { name: "Эрен (Кадет)", universe: "AoT", damage: 27, hp: 10, speed: 1.2, desc: "Кадет с жаждой мести титанам." },
        { name: "Коби (Солдат)", universe: "One Piece", damage: 15, hp: 30, speed: 0.8, desc: "Доказывает, что слабый может стать сильным." },
        { name: "Ренджи", universe: "Bleach", damage: 15, hp: 25, speed: 1.0, desc: "Шинигами с мечом-хлыстом." },
        { name: "Киришима", universe: "MHA", damage: 13, hp: 35, speed: 0.7, desc: "Красный бунтарь. Твердеет кожей." },
        { name: "Райан (Ребенок)", universe: "The Boys", damage: 20, hp: 25, speed: 1.1, desc: "Сын Хоумлендера. Ещё учится." },
        { name: "Рекс Слоан", universe: "Invincible", damage: 18, hp: 28, speed: 1.0, desc: "Взрывной герой-подросток." },
        { name: "Дупли-Кейт", universe: "Invincible", damage: 15, hp: 20, speed: 1.2, desc: "Множится на клонов." },
        { name: "Пучино", universe: "The Boys", damage: 17, hp: 26, speed: 0.8, desc: "Подводный герой. Любит рыбу." },
        { name: "Мреющий", universe: "The Boys", damage: 9, hp: 40, speed: 0.6, desc: "Невидимый шпион Семёрки." },
        {"name":"Фрэнки","universe":"One Piece","patchId":"one_piece","damage":20,"hp":32,"speed":1,"ability":{"type":"bossDamage","value":0.05,"desc":"+5% урона боссам"},"desc":"Киборг-кораблестроитель. Мощные механические руки и оружие особенно эффективны против крупных врагов."},
        {"name":"Нико Робин","universe":"One Piece","patchId":"one_piece","damage":20,"hp":31,"speed":1,"ability":{"type":"damageMultChance","chance":0.12,"mult":1.25,"desc":"12% шанс нанести ×1,25 урона"},"desc":"Археолог с силой цветочного фрукта: может создавать руки и конечности прямо на противнике."},
        {"name":"Джимбей (Флешбек)","universe":"One Piece","patchId":"one_piece","damage":20,"hp":38,"speed":0.8,"ability":{"type":"damageReduction","value":0.07,"desc":"−7% получаемого урона"},"desc":"Мастер рыбочеловеческого каратэ. Выдерживает тяжёлые удары и уверенно держит оборону."},
        {"name":"Смокер","universe":"One Piece","patchId":"one_piece","damage":22,"hp":30,"speed":1.15,"statusAbility":{"type":"freezeStacks","value":1,"desc":"Дымовая ловушка: +1 клик до контратаки"},"desc":"Морской дозорный с дымовым логиа-фруктом. Связывает противника клубами дыма."},
        {"name":"Ташиги","universe":"One Piece","patchId":"one_piece","damage":17,"hp":25,"speed":1.15,"ability":{"type":"critChance","value":0.05,"desc":"+5% шанс критического удара"},"desc":"Офицер морского дозора и искусный фехтовальщик. Находит слабые места противника."},
        {"name":"Бартоломео","universe":"One Piece","patchId":"one_piece","damage":15,"hp":42,"speed":0.7,"ability":{"type":"damageReduction","value":0.1,"desc":"−10% получаемого урона"},"desc":"Преданный фанат Луффи. Барьерный фрукт позволяет ему выдерживать сильные атаки."},
        {"name":"Кавендиш","universe":"One Piece","patchId":"one_piece","damage":23,"hp":25,"speed":1.35,"ability":{"type":"critChance","value":0.08,"desc":"+8% шанс критического удара"},"desc":"Быстрый и эффектный фехтовальщик. В атаке полагается на скорость и точность."},
        {"name":"Бепо","universe":"One Piece","patchId":"one_piece","damage":18,"hp":34,"speed":1.05,"ability":{"type":"damageReduction","value":0.06,"desc":"−6% получаемого урона"},"desc":"Навигатор Сердечных пиратов и сильный боец-минк, особенно опасный в ближнем бою."},
        {"name":"Кинъэмон","universe":"One Piece","patchId":"one_piece","damage":21,"hp":33,"speed":1,"statusAbility":{"type":"fire","damage":4,"duration":2500,"desc":"Стиль лисьего огня: 4 урона в секунду"},"desc":"Самурай Вано, владеющий стилем лисьего огня и умеющий рассекать пламя."},
        {"name":"Арлонг","universe":"One Piece","patchId":"one_piece","damage":32,"hp":45,"speed":1.1,"ability":{"type":"damageReduction","value":0.06,"desc":"−6% получаемого урона"},"desc":"Жестокий рыбочеловек с огромной физической силой и мощной челюстью."},
        { name: "Фубуки", universe: "OPM", patchId: "one_punch_man", damage: 18, hp: 34, speed: 0.95, ability: { type: "damageAura", value: 0.03, desc: "+3% урона всей команде" }, desc: "Лидер группы Blizzard. Её телекинез и умение руководить союзниками дают небольшой бонус всему отряду." },
        { name: "Император Дитя", universe: "OPM", patchId: "one_punch_man", damage: 19, hp: 30, speed: 1.0, ability: { type: "critChance", value: 0.04, desc: "+4% к шансу критического удара" }, desc: "Юный S-класс герой, полагающийся на интеллект, гаджеты и точечные удары по слабым местам." },
        { name: "Узник Пури-Пури", universe: "OPM", patchId: "one_punch_man", damage: 20, hp: 40, speed: 0.8, ability: { type: "damageReduction", value: 0.03, desc: "−3% получаемого урона" }, desc: "Герой S-класса с огромной физической силой и стойкостью. Хорошо держит удар, но не относится к верхушке рейтинга." },
        {
            "name": "Уилл Антонио Цеппели",
            "universe": "JoJo",
            "damage": 19,
            "hp": 31,
            "speed": 1,
            "ability": {
                "type": "damageAura",
                "value": 0.03,
                "desc": "+3% урона команде"
            },
            "desc": "Наставник Джонатана, обучающий его Хамону."
        },
        {
            "name": "Рудол фон Штрохайм (киборг)",
            "universe": "JoJo",
            "damage": 22,
            "hp": 34,
            "speed": 0.8,
            "ability": {
                "type": "damageReduction",
                "value": 0.04,
                "desc": "−4% получаемого урона"
            },
            "desc": "Немецкий офицер, усиленный механическими имплантами и мощным оружием."
        },
        {
            "name": "Хол Хорс (Emperor)",
            "universe": "JoJo",
            "damage": 21,
            "hp": 28,
            "speed": 1.1,
            "ability": {
                "type": "critChance",
                "value": 0.08,
                "desc": "+8% шанс критического удара"
            },
            "desc": "Стрелок, чей стенд Emperor создаёт управляемые пули."
        },
        {
            "name": "Н'Дул (Geb)",
            "universe": "JoJo",
            "damage": 22,
            "hp": 29,
            "speed": 0.85,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.3,
                "desc": "10% шанс нанести ×1,3 урона"
            },
            "desc": "Слепой пользователь Geb, управляющий водой с опасной точностью."
        },
        {
            "name": "Коити Хиросэ (Echoes Act 1)",
            "universe": "JoJo",
            "damage": 20,
            "hp": 32,
            "speed": 0.95,
            "ability": {
                "type": "damageReduction",
                "value": 0.03,
                "desc": "−3% получаемого урона"
            },
            "desc": "Начальная форма Echoes, способная создавать звуковые эффекты и слова."
        },
        {
            "name": "Пески (Beach Boy)",
            "universe": "JoJo",
            "damage": 19,
            "hp": 33,
            "speed": 0.85,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.09,
                "mult": 1.25,
                "desc": "9% шанс нанести ×1,25 урона"
            },
            "desc": "Молодой член команды Bucciarati, использующий стенд-удочку для атак сквозь препятствия."
        },
        {
            "name": "Векапипо (Wrecking Ball)",
            "universe": "JoJo",
            "damage": 24,
            "hp": 31,
            "speed": 1,
            "ability": {
                "type": "critChance",
                "value": 0.08,
                "desc": "+8% шанс критического удара"
            },
            "desc": "Боец Steel Ball Run, применяющий вращение и особые стальные сферы."
        },
        {
            "name": "Сантана",
            "universe": "JoJo",
            "damage": 24,
            "hp": 38,
            "speed": 0.85,
            "ability": {
                "type": "healOnWin",
                "percent": 0.02,
                "desc": "+2% HP после победы"
            },
            "desc": "Пробудившийся Человек из колонны. Способен изменять тело и поглощать противников."
        },
        {
            "name": "Кейчо Нидзимура (Bad Company)",
            "universe": "JoJo",
            "damage": 22,
            "hp": 32,
            "speed": 0.95,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.25,
                "desc": "10% шанс нанести ×1,25 урона"
            },
            "desc": "Старший брат Окуясу, командующий армией миниатюрных солдат и техники."
        },
        {
            "name": "Акира Отоиси (Red Hot Chili Pepper)",
            "universe": "JoJo",
            "damage": 24,
            "hp": 30,
            "speed": 1.2,
            "ability": {
                "type": "critChance",
                "value": 0.1,
                "desc": "+10% шанс критического удара"
            },
            "desc": "Гитарист, чей стенд питается электричеством и становится сильнее от энергии."
        }
    ],
    "Эпик": [
        { name: "Луффи (Таймскип)", universe: "One Piece", damage: 28, hp: 45, speed: 1.6, ability: { type: "damageMultChance", chance: 0.35, mult: 1.3, desc: "35% урон x1.3" }, desc: "После двух лет тренировок. Шанс 35% нанести в 1.3 раза больше урона." },
        { name: "Ло", universe: "One Piece", damage: 25, hp: 40, speed: 1.2, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Хирург смерти. Увеличивает урон всей команды на 5%." },
        { name: "Итачи", universe: "Naruto", damage: 30, hp: 38, speed: 1.5, desc: "Гений клана Учиха. Без активных способностей." },
        { name: "Эрен", universe: "AoT", damage: 35, hp: 50, speed: 1.3, ability: { type: "teamHealOnWave", value: 0.02, desc: "Хил 2% за волну" }, desc: "После каждой победы лечит команду на 2%." },
        { name: "Гатс", universe: "Berserk", damage: 40, hp: 55, speed: 1.0, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Чёрный мечник. +5% урона команде." },
        { name: "Кид", universe: "One Piece", damage: 28, hp: 35, speed: 1.1, ability: { type: "critChance", value: 0.05, desc: "+5% крит" }, desc: "Магнитный пират. +5% к шансу крита." },
        { name: "Какаши", universe: "Naruto", damage: 26, hp: 42, speed: 1.4, desc: "Копирующий ниндзя. Без активных способностей." },
        { name: "Коби (Honestly impact)", universe: "One Piece", damage: 32, hp: 45, speed: 1.2, ability: { type: "critChance", value: 0.05, desc: "+5% крит" }, desc: "Честный удар. +5% к шансу крита." },
        { name: "Луччи (Сп-9)", universe: "One Piece", damage: 38, hp: 45, speed: 1.5, desc: "Агент Леопард. Без активных способностей." },
        { name: "Робот (Руди)", universe: "Invincible", damage: 30, hp: 48, speed: 0.9, desc: "Киборг-подросток." },
        { name: "Чёрный Нуар", universe: "The Boys", damage: 35, hp: 52, speed: 1.6, ability: { type: "damageReduction", value: 0.07, desc: "-7% урона" }, desc: "Молчаливый ниндзя Семёрки. Уменьшает получаемый урон на 7%." },
        { name: "Кимико", universe: "The Boys", damage: 32, hp: 48, speed: 1.4, ability: { type: "teamHealOnWave", value: 0.02, desc: "Хил 2% за волну" }, desc: "Девушка с супер-регенерацией. Лечит команду на 2% за волну." },
        { name: "Ракета (а-трейн)", universe: "The Boys", damage: 38, hp: 40, speed: 1.8, ability: { type: "nonBossOneShot", chance: 0.03, desc: "3% ваншот (не босс)" }, desc: "К вам летит РАКЕТААААААА!!!! 3% шанс мгновенно убить врага (кроме боссов)." },
        { name: "Деку (5%)", universe: "MHA", damage: 29, hp: 70, speed: 0.6, ability: { type: "desperateStrike", value: 0.10, threshold: 0.30, desc: "+10% урона при HP ниже 30%" }, statusAbility: { type: "clickDmgSelf", value: 0.02, desc: "-2% HP за клик" }, desc: "Слабый сосуд, мощная сила. Каждый клик отнимает 2% HP команды, зато в критический момент урон возрастает на 10%." }
,
{ name: "Зверь", universe: "The Boys", patchId: "the_boys", damage: 35, hp: 45, speed: 1.5, ability: { type: "damageMultChance", chance: 0.12, mult: 1.25, desc: "12% шанс нанести ×1,25 урона" }, desc: "Человек-паук в стиле Пацанов. Ах ты сволочь, Человек-паук! " },
        { name: "Звёздочка ", universe: "The Boys", patchId: "the_boys", damage: 32, hp: 48, speed: 1.3, ability: { type: "critChance", value: 0.06, desc: "+6% шанс критического удара" }, statusAbility: { type: "shock", chance: 0.10, desc: "10% шанс электрического шока" }, desc: "Которая еще не ела детей" },
        
        { name: "Файркрекер (Пропагандистка)", universe: "The Boys", patchId: "the_boys", damage: 27, hp: 45, speed: 1, desc: "Умеет выпускать искры и мастерски управляет пропагандой. В прямом бою заметно уступает сильнейшим суперам." },
        {"name":"Санджи (Таймскип)","universe":"One Piece","patchId":"one_piece","damage":32,"hp":45,"speed":1.6,"ability":{"type":"damageMultChance","chance":0.15,"mult":1.25,"desc":"15% шанс нанести ×1,25 урона"},"desc":"Чёрная нога после таймскипа. Усиленные удары ногами и высокая скорость дают преимущество в темпе."},
        {"name":"Нами (Зевс)","universe":"One Piece","patchId":"one_piece","damage":28,"hp":44,"speed":1.5,"statusAbility":{"type":"shock","chance":0.12,"desc":"12% шанс электрического шока"},"desc":"Навигатор использует Зевса, чтобы усиливать климатические атаки молниями."},
        {"name":"Боа Хэнкок","universe":"One Piece","patchId":"one_piece","damage":42,"hp":55,"speed":1.4,"statusAbility":{"type":"blind","value":1,"desc":"Взгляд ослепляет: +1 клик до контратаки"},"desc":"Императрица Амазон Лили. Её красота и сила Меро-фрукта дезориентируют противников."},
        {"name":"Крокодайл","universe":"One Piece","patchId":"one_piece","damage":40,"hp":60,"speed":1.2,"ability":{"type":"damageReduction","value":0.06,"desc":"−6% получаемого урона"},"desc":"Бывший сичибукай и хозяин песчаного фрукта. Песчаная броня помогает переживать удары."},
        {"name":"Сабо (без фрукта)","universe":"One Piece","patchId":"one_piece","damage":43,"hp":52,"speed":1.7,"statusAbility":{"type":"fire","damage":5,"duration":3000,"desc":"Пламя: 5 урона в секунду"},"desc":"Начальник штаба Революционной армии. Настолько горячий парень, что прожигает врагов своей крутостью."},
        {"name":"Перона","universe":"One Piece","patchId":"one_piece","damage":27,"hp":42,"speed":1.2,"statusAbility":{"type":"blind","value":2,"desc":"Призраки: +2 клика до контратаки"},"desc":"Королева призраков. Её негативные полые призраки подавляют боевой дух врагов."},
        {"name":"Джевелри Бонни","universe":"One Piece","patchId":"one_piece","damage":35,"hp":50,"speed":1.4,"ability":{"type":"healOnWin","percent":0.025,"desc":"+2,5% HP после победы"},"desc":"Пиратка с силой изменения возраста. Использует обманчивую внешность и нестандартные приёмы."},
        {"name":"Икс Дрейк","universe":"One Piece","patchId":"one_piece","damage":38,"hp":55,"speed":1.25,"ability":{"type":"damageReduction","value":0.08,"desc":"−8% получаемого урона"},"desc":"Бывший морской офицер, умеющий превращаться в древнего динозавра."},
        {"name":"Капоне Беге","universe":"One Piece","patchId":"one_piece","damage":30,"hp":70,"speed":0.9,"ability":{"type":"damageReduction","value":0.1,"desc":"−10% получаемого урона"},"desc":"Капитан с крепостным фруктом: его тело превращается в вооружённую крепость."},
        {"name":"Бэзил Хокинс","universe":"One Piece","patchId":"one_piece","damage":34,"hp":55,"speed":1.1,"ability":{"type":"damageMultChance","chance":0.12,"mult":1.3,"desc":"12% шанс нанести ×1,3 урона"},"desc":"Маг-пират, читающий карты таро и использующий соломенные куклы для защиты и ответных атак."},
        {"name":"Скрэтчмен Апу","universe":"One Piece","patchId":"one_piece","damage":32,"hp":45,"speed":1.6,"statusAbility":{"type":"shock","chance":0.1,"desc":"10% шанс звукового шока"},"desc":"Музыкальный пират превращает звук и ритм в разрушительные атаки."},
        {"name":"Эмпорио Иванков","universe":"One Piece","patchId":"one_piece","damage":29,"hp":47,"speed":1.2,"ability":{"type":"healOnWin","percent":0.035,"desc":"+3,5% HP после победы"},"desc":"Командир Революционной армии. Гормональные техники помогают союзникам переживать тяжёлые бои."},
        {"name":"Пероспреро","universe":"One Piece","patchId":"one_piece","damage":34,"hp":52,"speed":1.05,"statusAbility":{"type":"freezeStacks","value":1,"desc":"Конфетные путы: +1 клик до контратаки"},"desc":"Старший сын Большой Мамочки управляет липкими конфетами и сковывает противников."},
        {"name":"Шарлотта Пудинг","universe":"One Piece","patchId":"one_piece","damage":28,"hp":44,"speed":1.1,"ability":{"type":"damageAura","value":0.03,"desc":"+3% урона команде"},"desc":"Дочь Большой Мамочки с силой памяти. Поддерживает союзников хитростью и тонким расчётом."},
        {"name":"Педро","universe":"One Piece","patchId":"one_piece","damage":36,"hp":47,"speed":1.3,"statusAbility":{"type":"shock","chance":0.08,"desc":"8% шанс электрического шока"},"desc":"Мускетёр минков, готовый рискнуть собой ради команды Луффи."},
        {"name":"Каррот (Сулонг)","universe":"One Piece","patchId":"one_piece","damage":65,"hp":78,"speed":2.5,"ability":{"type":"damageMultChance","chance":0.2,"mult":1.3,"desc":"20% шанс нанести ×1,3 урона"},"statusAbility":{"type":"shock","chance":0.08,"desc":"8% шанс электрического шока"},"desc":"Каррот под полной луной входит в форму Сулонг: скорость и электрические атаки резко возрастают."},
        { name: "Генос", universe: "OPM", patchId: "one_punch_man", damage: 36, hp: 47, speed: 1.6, statusAbility: { type: "fire", damage: 4, duration: 2500, desc: "Взрывные руки: 4 урона в секунду" }, desc: "Демон-киборг постоянно модернизирует тело. Его энергетические выстрелы наносят дополнительный огненный урон." },
        { name: "Соник (Скорость звука)", universe: "OPM", patchId: "one_punch_man", damage: 35, hp: 43, speed: 1.9, ability: { type: "critChance", value: 0.05, desc: "+5% к шансу критического удара" }, desc: "Ниндзя-убийца, делающий ставку на скорость и точность. Быстрые атаки чаще попадают в уязвимые места." },
        { name: "Металлическая Бита", universe: "OPM", patchId: "one_punch_man", damage: 36, hp: 60, speed: 1.3, ability: { type: "damageMultChance", chance: 0.15, mult: 1.25, desc: "15% шанс нанести ×1,25 урона" }, desc: "Чем дольше продолжается схватка, тем яростнее он сражается. Иногда наносит особенно мощный удар." },
        { name: "Девушка-комар", universe: "OPM", patchId: "one_punch_man", damage: 35, hp: 45, speed: 1.7, ability: { type: "healOnWin", percent: 0.025, desc: "+2,5% HP после победы" }, desc: "Монстр с высокой скоростью и способностью восстанавливать силы за счёт крови. Её регенерация помогает после боя." },
        { name: "Сторожевой пёс", universe: "OPM", patchId: "one_punch_man", damage: 38, hp: 58, speed: 1.65, desc: "Загадочный герой S-класса, сражающийся резкими и непредсказуемыми движениями. Сильный боец без чрезмерных бонусов." },
        {
            "name": "Джонатан Джостар (Хамон)",
            "universe": "JoJo",
            "damage": 36,
            "hp": 58,
            "speed": 1.1,
            "ability": {
                "type": "damageAura",
                "value": 0.04,
                "desc": "+4% урона команде"
            },
            "desc": "Первый Джостар: честный и невероятно сильный боец, освоивший Хамон."
        },
        {
            "name": "Дио Брандо (часть 1)",
            "universe": "JoJo",
            "damage": 44,
            "hp": 56,
            "speed": 1.25,
            "ability": {
                "type": "healOnWin",
                "percent": 0.025,
                "desc": "+2,5% HP после победы"
            },
            "desc": "Дио после превращения в вампира. Регенерация делает его опасным противником."
        },
        {
            "name": "Джозеф Джостар (часть 2)",
            "universe": "JoJo",
            "damage": 41,
            "hp": 54,
            "speed": 1.4,
            "ability": {
                "type": "critChance",
                "value": 0.1,
                "desc": "+10% шанс критического удара"
            },
            "desc": "Изобретательный Джозеф сочетает Хамон, ловушки и психологические уловки."
        },
        {
            "name": "Джозеф Джостар (часть 3: Hermit Purple)",
            "universe": "JoJo",
            "damage": 44,
            "hp": 61,
            "speed": 1.25,
            "ability": {
                "type": "damageAura",
                "value": 0.04,
                "desc": "+4% урона команде"
            },
            "desc": "Постаревший Джозеф использует Хамон и стенд Hermit Purple для разведки и контроля."
        },
        {
            "name": "Цезарь Антонио Цеппели",
            "universe": "JoJo",
            "damage": 39,
            "hp": 49,
            "speed": 1.3,
            "ability": {
                "type": "bossDamage",
                "value": 0.05,
                "desc": "+5% урона боссам"
            },
            "desc": "Мастер Хамона, сражающийся с помощью пузырей, наполненных солнечной энергией."
        },
        {
            "name": "Лиза Лиза",
            "universe": "JoJo",
            "damage": 38,
            "hp": 60,
            "speed": 1.05,
            "ability": {
                "type": "damageReduction",
                "value": 0.06,
                "desc": "−6% получаемого урона"
            },
            "desc": "Опытная наставница Хамона, сочетающая дисциплину и точные удары."
        },
        {
            "name": "Страйдзо (вампир)",
            "universe": "JoJo",
            "damage": 48,
            "hp": 59,
            "speed": 1.3,
            "ability": {
                "type": "healOnWin",
                "percent": 0.03,
                "desc": "+3% HP после победы"
            },
            "desc": "Бывший пользователь Хамона, который обратился в вампира ради вечной молодости."
        },
        {
            "name": "Нориаки Какёин (Hierophant Green)",
            "universe": "JoJo",
            "damage": 44,
            "hp": 49,
            "speed": 1.25,
            "statusAbility": {
                "type": "shock",
                "chance": 0.08,
                "desc": "8% шанс шока"
            },
            "desc": "Стенд Какёина атакует на расстоянии и может опутывать цели изумрудными нитями."
        },
        {
            "name": "Жан-Пьер Польнарефф (Silver Chariot)",
            "universe": "JoJo",
            "damage": 49,
            "hp": 47,
            "speed": 1.5,
            "ability": {
                "type": "critChance",
                "value": 0.11,
                "desc": "+11% шанс критического удара"
            },
            "desc": "Фехтовальщик с молниеносным стендом Silver Chariot."
        },
        {
            "name": "Мухаммед Абдул (Magician's Red)",
            "universe": "JoJo",
            "damage": 46,
            "hp": 56,
            "speed": 1.05,
            "statusAbility": {
                "type": "fire",
                "damage": 5,
                "duration": 3000,
                "desc": "Пламя наносит 5 урона за тик"
            },
            "desc": "Пользователь огненного стенда Magician's Red."
        },
        {
            "name": "Пет Шоп (Horus)",
            "universe": "JoJo",
            "damage": 42,
            "hp": 51,
            "speed": 1.2,
            "statusAbility": {
                "type": "freezeStacks",
                "value": 1,
                "desc": "Замедление противника"
            },
            "desc": "Сокол, использующий ледяной стенд Horus и атакующий с воздуха."
        },
        {
            "name": "Окуясу Нидзимура (The Hand)",
            "universe": "JoJo",
            "damage": 47,
            "hp": 63,
            "speed": 0.95,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.4,
                "desc": "10% шанс нанести ×1,4 урона"
            },
            "desc": "Стенд Окуясу стирает пространство правой рукой, но его владелец действует импульсивно."
        },
        {
            "name": "Коити Хиросэ (Echoes Act 3)",
            "universe": "JoJo",
            "damage": 48,
            "hp": 62,
            "speed": 1,
            "ability": {
                "type": "damageReduction",
                "value": 0.05,
                "desc": "−5% получаемого урона"
            },
            "desc": "Третья форма Echoes способна резко увеличивать вес выбранной цели."
        },
        {
            "name": "Юкако Ямагиси (Love Deluxe)",
            "universe": "JoJo",
            "damage": 43,
            "hp": 63,
            "speed": 1.1,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.3,
                "desc": "10% шанс нанести ×1,3 урона"
            },
            "desc": "Опасная пользовательница стенда, управляющего её волосами."
        },
        {
            "name": "Гвидо Миста (Sex Pistols)",
            "universe": "JoJo",
            "damage": 43,
            "hp": 47,
            "speed": 1.5,
            "ability": {
                "type": "critChance",
                "value": 0.12,
                "desc": "+12% шанс критического удара"
            },
            "desc": "Меткий стрелок, чьи маленькие стенды перенаправляют пули."
        },
        {
            "name": "Наранча Гирга (Aerosmith)",
            "universe": "JoJo",
            "damage": 43,
            "hp": 49,
            "speed": 1.35,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.3,
                "desc": "12% шанс нанести ×1,3 урона"
            },
            "desc": "Пилот миниатюрного самолёта Aerosmith, отслеживающего дыхание и атакующего пулемётами."
        },
        {
            "name": "Триш Уна (Spice Girl)",
            "universe": "JoJo",
            "damage": 45,
            "hp": 61,
            "speed": 1.15,
            "ability": {
                "type": "damageReduction",
                "value": 0.06,
                "desc": "−6% получаемого урона"
            },
            "desc": "Пробуждённый стенд Trish смягчает любые материалы, помогая ей защищаться и атаковать."
        },
        {
            "name": "Просчутто (The Grateful Dead)",
            "universe": "JoJo",
            "damage": 50,
            "hp": 58,
            "speed": 1.1,
            "statusAbility": {
                "type": "bleed",
                "value": 0.05,
                "desc": "+5% урона через кровотечение"
            },
            "desc": "Безжалостный член команды убийц, чья способность ускоряет старение целей."
        },
        {
            "name": "Гьяччо (White Album)",
            "universe": "JoJo",
            "damage": 49,
            "hp": 66,
            "speed": 1.1,
            "ability": {
                "type": "damageReduction",
                "value": 0.07,
                "desc": "−7% получаемого урона"
            },
            "desc": "Создаёт ледяную броню и замораживает окружающее пространство."
        },
        {
            "name": "Эрмес Костелло (Kiss)",
            "universe": "JoJo",
            "damage": 46,
            "hp": 63,
            "speed": 1.2,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.35,
                "desc": "10% шанс нанести ×1,35 урона"
            },
            "desc": "Использует наклейки Kiss, чтобы создавать копии объектов и затем резко соединять их."
        },
        {
            "name": "Foo Fighters (F.F.)",
            "universe": "JoJo",
            "damage": 40,
            "hp": 61,
            "speed": 1.2,
            "ability": {
                "type": "healOnWin",
                "percent": 0.03,
                "desc": "+3% HP после победы"
            },
            "desc": "Разумная колония планктонов, которая может восстанавливать собственное тело."
        },
        {
            "name": "Эмпорио Алниньо",
            "universe": "JoJo",
            "damage": 39,
            "hp": 56,
            "speed": 1,
            "ability": {
                "type": "damageAura",
                "value": 0.03,
                "desc": "+3% урона команде"
            },
            "desc": "Юный союзник Джолин, умеющий использовать призрачные комнаты и найденные предметы."
        },
        {
            "name": "Хот Пэнтс",
            "universe": "JoJo",
            "damage": 47,
            "hp": 60,
            "speed": 1.2,
            "ability": {
                "type": "healOnWin",
                "percent": 0.025,
                "desc": "+2,5% HP после победы"
            },
            "desc": "Участница гонки Steel Ball Run, использующая стенд Cream Starter для лечения и маскировки."
        },
        {
            "name": "Сэндмен (In a Silent Way)",
            "universe": "JoJo",
            "damage": 46,
            "hp": 45,
            "speed": 1.65,
            "ability": {
                "type": "critChance",
                "value": 0.11,
                "desc": "+11% шанс критического удара"
            },
            "desc": "Быстрый боец Steel Ball Run, превращающий звук и движение в разрушительные атаки."
        },
        {
            "name": "Ясухо Хиросэ (Paisley Park)",
            "universe": "JoJo",
            "damage": 39,
            "hp": 57,
            "speed": 1.1,
            "ability": {
                "type": "damageAura",
                "value": 0.04,
                "desc": "+4% урона команде"
            },
            "desc": "Помогает союзникам с помощью поискового и навигационного стенда Paisley Park."
        },
        {
            "name": "Драгона Джостар",
            "universe": "JoJo",
            "damage": 43,
            "hp": 59,
            "speed": 1.25,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.3,
                "desc": "10% шанс нанести ×1,3 урона"
            },
            "desc": "Союзник Джодио, способный изменять положение и размер частей тела с помощью Smooth Operators."
        },
        {
            "name": "Усаги Алохаоэ",
            "universe": "JoJo",
            "damage": 41,
            "hp": 51,
            "speed": 1.3,
            "ability": {
                "type": "critChance",
                "value": 0.08,
                "desc": "+8% шанс критического удара"
            },
            "desc": "Член команды Джодио, использующий стенд The Matte Kudasai для исполнения просьб."
        },
        {
            "name": "Ринго Роудэгейн (Mandom)",
            "universe": "JoJo",
            "damage": 52,
            "hp": 61,
            "speed": 1.15,
            "ability": {
                "type": "damageReduction",
                "value": 0.07,
                "desc": "−7% получаемого урона"
            },
            "desc": "Стрелок Steel Ball Run, способный отматывать время на несколько секунд."
        }
    ],
    "Мифическая": [
        { name: "Годжо (флешбек)", universe: "JJK", damage: 72, hp: 85, speed: 2.4, ability: { type: "critChance", value: 0.15, desc: "+15% шанс крита" }, desc: "Годжо из флешбека. Сильный мифический персонаж без секретных техник." },
        { name: "Луффи (4 гир: боусман)", universe: "One Piece", damage: 45, hp: 75, speed: 1.8, ability: { type: "damageReduction", value: 0.15, desc: "-15% урона" }, desc: "Boundman. Уменьшает получаемый урон на 15%." },
        { name: "Наруто (Мудрец)", universe: "Naruto", damage: 52, hp: 85, speed: 2.0, statusAbility: { type: "bleed", value: 0.10, desc: "Кровотечение +10%" }, desc: "Режим Мудреца. Увеличивает урон по врагу на 10% (кровотечение)." },
        { name: "Гоку (SSJ)", universe: "DB", damage: 60, hp: 70, speed: 2.2, ability: { type: "bossDamage", value: 0.10, desc: "+10% боссам" }, desc: "Супер Сайян. +10% урона боссам." },
        { name: "Эйс", universe: "One Piece", damage: 70, hp: 47, speed: 2.1, statusAbility: { type: "fire", damage: 5, duration: 5000, desc: "Огонь 5/сек" }, desc: "Огненный кулак. Поджигает врага — 5 урона каждые 2 секунды." },
        { name: "Дедушка Гарп", universe: "One Piece", damage: 55, hp: 90, speed: 1.2, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, desc: "Герой морпехов. +10% урона всей команде." },
        { name: "Неуязвимый (Коалиция планет)", universe: "Invincible", damage: 65, hp: 80, speed: 2.0, ability: { type: "critChance", value: 0.20, desc: "+20% крит" }, desc: "Марк Грейсон в прайме. +20% к шансу крита." },
        { name: "Бог Скайпии Энель", universe: "One Piece", damage: 68, hp: 72, speed: 2.8, statusAbility: { type: "shock", chance: 0.12, desc: "Шок 12%" }, desc: "Бог молний. 12% шанс шокнуть врага." },
        { name: "Альбер (Кинг)", universe: "One Piece", damage: 72, hp: 68, speed: 2.3, statusAbility: { type: "fire", damage: 8, duration: 4000, desc: "Огонь 8/сек" }, desc: "Правая рука Кайдо. Поджигает врага — 8 урона каждые 2 секунды." },
        { name: "Виктория Ньюман", universe: "The Boys", damage: 65, hp: 85, speed: 1.6, statusAbility: { type: "bleed", value: 0.20, desc: "Кровотечение +20%" }, desc: "Глава секретного отдела. +20% урона через кровотечение (взрыв головы)." },
        { name: "Королева Мэйв", universe: "The Boys", damage: 70, hp: 88, speed: 1.8, ability: { type: "damageReduction", value: 0.15, desc: "-15% меньше урона" }, desc: "Самая сильная женщина. Уменьшает получаемый урон на 15%." },
        { name: "Солдатик (флешбек)", universe: "The Boys", damage: 72, hp: 82, speed: 1.7, ability: { type: "bossDamage", value: 0.12, desc: "+12% боссам" }, desc: "Первый супергерой. +12% урона боссам." },
        { name: "Штормфронт", universe: "The Boys", damage: 68, hp: 78, speed: 2.4, statusAbility: { type: "shock", chance: 0.15, desc: "Электричество 15%" }, desc: "Нацистка с молниями. 15% шанс шокнуть врага." },
        { name: "Ален (перерождённый)", universe: "Invincible", damage: 70, hp: 70, speed: 2.2, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, desc: "Инопланетянин-герой. +10% урона команде." },
        { name: "Звёздочка (прайм)", universe: "The Boys", damage: 65, hp: 80, speed: 1.9, statusAbility: { type: "blind", value: 2, desc: "Ослепление +2" }, desc: "Световая героиня. Ослепляет врага — +2 клика до ответной атаки. Которая ест детей" },
        { name: "Деку: полное покрытие (20%)", universe: "MHA", damage: 58, hp: 68, speed: 1.3, ability: { type: "desperateStrike", value: 0.15, threshold: 0.30, desc: "+15% урона при HP ниже 30%" }, statusAbility: { type: "dmgTakenIncrease", value: 0.10, desc: "+10% получ. урона" }, desc: "20% One For All. Получаемый урон увеличен на 10%, зато при критически низком HP атаки становятся сильнее." }
,
{ name: "Билли Бутчер (V24)", universe: "The Boys", patchId: "the_boys", damage: 70, hp: 85, speed: 1.5, ability: { type: "bossDamage", value: 0.08, desc: "+8% урона боссам" }, statusAbility: { type: "fire", damage: 7, duration: 3500, desc: "Тепловое зрение: 7 урона/сек" }, desc: "Бутчер под временным V24 получает силу, выносливость, тепловое зрение и щупальца симбионта. Препарат крайне опасен для его здоровья." },
        { name: "Райан (Лазерный взгляд)", universe: "The Boys", patchId: "the_boys", damage: 65, hp: 80, speed: 1.8, ability: { type: "critChance", value: 0.09, desc: "+9% шанс критического удара" }, statusAbility: { type: "fire", damage: 8, duration: 3000, desc: "Тепловое зрение: 8 урона/сек" }, desc: "Райан унаследовал полёт, сверхсилу, прочность и тепловое зрение, но ещё уступает Хоумлендеру в опыте и контроле." },
        { name: "Сестра Сейдж (Гений)", universe: "The Boys", patchId: "the_boys", damage: 45, hp: 80, speed: 1.1, ability: { type: "damageAura", value: 0.06, desc: "+6% урона всей команде" }, desc: "Самый умный человек в мире. Её главная сила — гиперинтеллект, анализ, наука и манипуляция, а не грубая физическая мощь." },
        { name: "Кимико (Боевая регенерация)", universe: "The Boys", patchId: "the_boys", damage: 55, hp: 105, speed: 1.2, ability: { type: "damageReduction", value: 0.10, desc: "−10% получаемого урона" }, desc: "Кимико обладает сверхсилой, боевыми рефлексами и чрезвычайной регенерацией, благодаря которой переживает ранения, смертельные для обычного человека." },
        {"name":"Кинг (Пламя угасло)","universe":"One Piece","patchId":"one_piece","damage":68,"hp":80,"speed":2.6,"ability":{"type":"damageMultChance","chance":0.18,"mult":1.3,"desc":"18% шанс нанести ×1,3 урона"},"desc":"Кинг гасит пламя на спине, жертвуя частью защиты ради взрывного роста скорости и силы атак."},
        {"name":"Санджи (Ифрит Джамбе)","universe":"One Piece","patchId":"one_piece","damage":70,"hp":72,"speed":2.2,"statusAbility":{"type":"fire","damage":8,"duration":3000,"desc":"Пылающие удары: 8 урона в секунду"},"desc":"Продвинутая техника Чёрной ноги: раскалённые удары становятся ещё быстрее и мощнее."},
        {"name":"Луффи (Гир 4: Снейкмен)","universe":"One Piece","patchId":"one_piece","damage":72,"hp":85,"speed":2.4,"ability":{"type":"damageMultChance","chance":0.28,"mult":1.35,"desc":"28% шанс нанести ×1,35 урона"},"desc":"Отдельная форма Четвёртого Гира: Снейкмен делает резиновые удары непредсказуемыми и быстрыми."},
        {"name":"Ямато","universe":"One Piece","patchId":"one_piece","damage":68,"hp":100,"speed":1.9,"ability":{"type":"damageReduction","value":0.12,"desc":"−12% получаемого урона"},"desc":"Воин Вано, владеющий тяжёлой дубиной и мощной гибридной формой мифического зоана."},
        {"name":"Дракуль Михок","universe":"One Piece","patchId":"one_piece","damage":82,"hp":80,"speed":2,"ability":{"type":"critChance","value":0.16,"desc":"+16% шанс критического удара"},"desc":"Сильнейший фехтовальщик мира. Один точный удар способен решить исход боя."},
        {"name":"Фудзитора (Иссё)","universe":"One Piece","patchId":"one_piece","damage":74,"hp":95,"speed":1.7,"statusAbility":{"type":"freezeStacks","value":2,"desc":"Гравитация: +2 клика до контратаки"},"desc":"Адмирал гравитации утяжеляет противника и сбивает ритм его атак."},
        {"name":"Магеллан (Начальник Импел Дауна)","universe":"One Piece","patchId":"one_piece","damage":74,"hp":85,"speed":1.5,"statusAbility":{"type":"poison","damage":7,"desc":"Яд: 7 урона за тик"},"desc":"Начальник Импел Дауна. Его ядовитые атаки крайне опасны даже для сильных противников."},
        {"name":"Чоппер (Монстр-пойнт)","universe":"One Piece","patchId":"one_piece","damage":66,"hp":95,"speed":1.5,"ability":{"type":"damageReduction","value":0.08,"desc":"−8% получаемого урона"},"desc":"Чоппер принимает гигантскую боевую форму, жертвуя тонким контролем ради грубой силы."},
        {"name":"Куин (Чума)","universe":"One Piece","patchId":"one_piece","damage":76,"hp":88,"speed":1.4,"statusAbility":{"type":"poison","damage":6,"desc":"Биооружие: 6 урона за тик"},"desc":"Один из трёх бедствий Кайдо: кибернетическое оружие и вирусные атаки."},
        {"name":"Джек (Засуха)","universe":"One Piece","patchId":"one_piece","damage":72,"hp":110,"speed":1.35,"ability":{"type":"damageReduction","value":0.13,"desc":"−13% получаемого урона"},"desc":"Неутомимый тяжеловес команды Кайдо, выдерживающий огромный объём повреждений."},
        {"name":"Ульти","universe":"One Piece","patchId":"one_piece","damage":62,"hp":78,"speed":1.9,"ability":{"type":"critChance","value":0.1,"desc":"+10% шанс критического удара"},"desc":"Древний зоан и яростный боец Пиратов Зверей, полагающийся на резкие лобовые атаки."},
        {"name":"Генирал фрэнки","universe":"One Piece","patchId":"one_piece","damage":35,"hp":50,"speed":1.4,"ability":{"type":"critChance","value":0.08,"desc":"+8% шанс критического удара"},"desc":"Это типо как халкбастер."},
        {"name":"Донкихот Дофламинго","universe":"One Piece","patchId":"one_piece","damage":45,"hp":48,"speed":1.5,"ability":{"type":"damageMultChance","chance":0.18,"mult":1.3,"desc":"18% шанс нанести ×1,3 урона"},"statusAbility":{"type":"bleed","value":0.05,"desc":"+5% урона через кровотечение"},"desc":"Тиран Дресс Розы управляет режущими нитями и способен атаковать сразу с нескольких направлений."},
        {"name":"Шарлотта Смуси","universe":"One Piece","patchId":"one_piece","damage":108,"hp":130,"speed":1.8,"ability":{"type":"damageAura","value":0.1,"desc":"+10% урона команде"},"desc":"Одна из трёх сладких командиров Пиратов Большой Мамочки. Сила выжимания жидкости и огромный меч делают её опасным бойцом."},
        { name: "Атомный Самурай", universe: "OPM", patchId: "one_punch_man", damage: 78, hp: 80, speed: 2.2, statusAbility: { type: "bleed", value: 0.12, desc: "+12% урона через кровотечение" }, desc: "Мастер меча S-класса. Его стремительные разрезы оставляют глубокие раны и усиливают общий урон отряда." },
        { name: "Серебряный Клык (Бэнг)", universe: "OPM", patchId: "one_punch_man", damage: 66, hp: 102, speed: 1.8, ability: { type: "damageReduction", value: 0.06, desc: "−6% получаемого урона" }, desc: "Легендарный мастер боевых искусств, превращающий оборону и контратаки в преимущество." },
        { name: "Зомби-мэн", universe: "OPM", patchId: "one_punch_man", damage: 55, hp: 125, speed: 1.4, ability: { type: "healOnWin", percent: 0.04, desc: "+4% HP после победы" }, desc: "Герой S-класса с чудовищной регенерацией. Его слабее выраженная атака компенсируется способностью восстановиться после боя." },
        { name: "Тёмное Сияние", universe: "OPM", patchId: "one_punch_man", damage: 65, hp: 150, speed: 1.35, ability: { type: "damageReduction", value: 0.08, desc: "−8% получаемого урона" }, desc: "Мастер бодибилдинга с огромной физической мощью и чрезвычайно прочным телом. Одна из самых выносливых карт мифического уровня." },
        { name: "Кабуто (Режим резни)", universe: "OPM", patchId: "one_punch_man", damage: 74, hp: 108, speed: 1.8, ability: { type: "damageMultChance", chance: 0.12, mult: 1.25, desc: "12% шанс нанести ×1,25 урона" }, desc: "Carnage Mode резко увеличивает агрессию и физическую мощь монстра, но не поднимает его до космического уровня." },
        { name: "Психос", universe: "OPM", patchId: "one_punch_man", damage: 58, hp: 80, speed: 1.5, ability: { type: "damageAura", value: 0.04, desc: "+4% урона всей команде" }, desc: "Могущественная экстрасенс и стратег Ассоциации монстров. Её психическая поддержка усиливает урон отряда." },
        {
            "name": "Вамуу",
            "universe": "JoJo",
            "damage": 72,
            "hp": 108,
            "speed": 1.35,
            "ability": {
                "type": "damageReduction",
                "value": 0.09,
                "desc": "−9% получаемого урона"
            },
            "desc": "Воин людей из колонны, управляющий ветром и воздушными потоками."
        },
        {
            "name": "Эйсидиси",
            "universe": "JoJo",
            "damage": 66,
            "hp": 102,
            "speed": 1.2,
            "statusAbility": {
                "type": "fire",
                "damage": 9,
                "duration": 3500,
                "desc": "Пламя наносит 9 урона за тик"
            },
            "desc": "Человек из колонны, использующий собственную перегретую кровь как оружие."
        },
        {
            "name": "Карс (обычная форма)",
            "universe": "JoJo",
            "damage": 86,
            "hp": 124,
            "speed": 1.45,
            "ability": {
                "type": "healOnWin",
                "percent": 0.04,
                "desc": "+4% HP после победы"
            },
            "desc": "Глава людей из колонны, мастер клинков света и биологической эволюции."
        },
        {
            "name": "Ванилла Айс (Cream)",
            "universe": "JoJo",
            "damage": 91,
            "hp": 112,
            "speed": 1.45,
            "ability": {
                "type": "damageReduction",
                "value": 0.1,
                "desc": "−10% получаемого урона"
            },
            "desc": "Преданный Дио пользователь Cream, способного стирать материю в пустоте."
        },
        {
            "name": "Рохан Кишибэ (Heaven's Door)",
            "universe": "JoJo",
            "damage": 77,
            "hp": 101,
            "speed": 1.2,
            "ability": {
                "type": "critChance",
                "value": 0.14,
                "desc": "+14% шанс критического удара"
            },
            "desc": "Мангака, чей стенд превращает людей в книги и позволяет читать или менять их содержимое."
        },
        {
            "name": "Бруно Буччеллати (Sticky Fingers)",
            "universe": "JoJo",
            "damage": 84,
            "hp": 112,
            "speed": 1.45,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.45,
                "desc": "12% шанс нанести ×1,45 урона"
            },
            "desc": "Лидер отряда, создающий молнии-замки на поверхностях и противниках."
        },
        {
            "name": "Леоне Аббаккио (Moody Blues)",
            "universe": "JoJo",
            "damage": 68,
            "hp": 96,
            "speed": 1.05,
            "ability": {
                "type": "damageAura",
                "value": 0.06,
                "desc": "+6% урона команде"
            },
            "desc": "Стенд Аббаккио воспроизводит события прошлого, помогая отряду находить уязвимости."
        },
        {
            "name": "Ризотто Неро (Metallica)",
            "universe": "JoJo",
            "damage": 90,
            "hp": 107,
            "speed": 1.3,
            "statusAbility": {
                "type": "bleed",
                "value": 0.1,
                "desc": "+10% урона через кровотечение"
            },
            "desc": "Лидер команды убийц, управляющий железом в крови противника."
        },
        {
            "name": "Нарцисо Анасуй (Diver Down)",
            "universe": "JoJo",
            "damage": 84,
            "hp": 110,
            "speed": 1.25,
            "ability": {
                "type": "damageReduction",
                "value": 0.08,
                "desc": "−8% получаемого урона"
            },
            "desc": "Стенд Diver Down проникает внутрь объектов и перестраивает их изнутри."
        },
        {
            "name": "Диего Брандо (Scary Monsters)",
            "universe": "JoJo",
            "damage": 92,
            "hp": 109,
            "speed": 1.6,
            "ability": {
                "type": "critChance",
                "value": 0.13,
                "desc": "+13% шанс критического удара"
            },
            "desc": "Альтернативный Диего из Steel Ball Run, способный превращать себя и других в динозавров."
        },
        {
            "name": "Винегар Доппио",
            "universe": "JoJo",
            "damage": 81,
            "hp": 106,
            "speed": 1.25,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.4,
                "desc": "12% шанс нанести ×1,4 урона"
            },
            "desc": "Вторая личность босса мафии. Его звонки и резкие выпады делают его опасным даже без полного контроля над King Crimson."
        },
        {
            "name": "Джонни Джостар (Tusk Act 2)",
            "universe": "JoJo",
            "damage": 94,
            "hp": 113,
            "speed": 1.4,
            "ability": {
                "type": "bossDamage",
                "value": 0.1,
                "desc": "+10% урона боссам"
            },
            "desc": "Вторая форма Tusk использует вращение, оставляя движущиеся отверстия и пробивая защиту."
        },
        {
            "name": "Рай Маме́дзуку (Doggy Style)",
            "universe": "JoJo",
            "damage": 82,
            "hp": 112,
            "speed": 1.3,
            "ability": {
                "type": "damageAura",
                "value": 0.06,
                "desc": "+6% урона команде"
            },
            "desc": "Опытный проводник и союзник Джоске из JoJolion. Его стенд разделяет тело на нити."
        },
        {
            "name": "Пако Лабурентес (The Hustle)",
            "universe": "JoJo",
            "damage": 70,
            "hp": 97,
            "speed": 1.35,
            "ability": {
                "type": "damageReduction",
                "value": 0.06,
                "desc": "−6% получаемого урона"
            },
            "desc": "Боец команды Джодио, способный контролировать мышцы и крепко цепляться за поверхности."
        },
        {
            "name": "Джодио Джостар (November Rain)",
            "universe": "JoJo",
            "damage": 94,
            "hp": 117,
            "speed": 1.35,
            "ability": {
                "type": "bossDamage",
                "value": 0.08,
                "desc": "+8% урона боссам"
            },
            "desc": "Главный герой The JOJOLands. Его стенд создаёт тяжёлые капли дождя, которые бьют по выбранной области."
        },
        {
            "name": "Йошикаге Кира (JoJolion)",
            "universe": "JoJo",
            "damage": 86,
            "hp": 104,
            "speed": 1.45,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.4,
                "desc": "12% шанс нанести ×1,4 урона"
            },
            "desc": "Другая версия Киры из JoJolion, врач и пользователь Killer Queen в альтернативной вселенной."
        },
        {
            "name": "Джошу Хигашиката (Nut King Call)",
            "universe": "JoJo",
            "damage": 68,
            "hp": 94,
            "speed": 1.05,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.08,
                "mult": 1.3,
                "desc": "8% шанс нанести ×1,3 урона"
            },
            "desc": "Член семьи Хигашиката, чей стенд умеет разбирать объекты на части при помощи болтов и гаек."
        }
    ],
    "Легендарная": [
        { name: "Сукуна (15 пальцев)", universe: "JJK", damage: 105, hp: 95, speed: 2.4, statusAbility: { type: "bleed", value: 0.08, desc: "Кровотечение +8%" }, desc: "Король Проклятий. Высокий урон и кровотечение, добавляющее 8% урона." },
        { name: "Кудзан", universe: "One Piece", damage: 85, hp: 120, speed: 1.8, statusAbility: { type: "freezeStacks", value: 2, desc: "Заморозка +2" }, desc: "Бывший адмирал Аокидзи. Замораживает врага — +2 клика до ответной атаки." },
        { name: "Йонко Шанкс", universe: "One Piece", damage: 95, hp: 90, speed: 3.0, ability: { type: "critChance", value: 0.15, desc: "+15% крит" }, desc: "Рыжеволосый император. +15% к шансу крита." },
        { name: "Хоумлендер", universe: "The Boys", damage: 115, hp: 125, speed: 2.5, ability: { type: "bossDamage", value: 0.18, desc: "+18% боссам" }, statusAbility: { type: "fire", damage: 10, duration: 3000, desc: "Лазеры 10/сек" }, desc: "Лидер Семёрки. +18% урона боссам и поджигает врага лазерами — 10 урона/2 сек." },
        { name: "Наруто (Барион)", universe: "Naruto", damage: 100, hp: 120, speed: 2.8, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, statusAbility: { type: "bleed", value: 0.1, desc: "Кровотечение +10%" }, desc: "Режим Бариона. +10% урона команде и +10% урона через кровотечение." },
        { name: "Гоку (UI)", universe: "DB", damage: 110, hp: 110, speed: 3.5, ability: { type: "damageAura", value: 0.13, desc: "+13% урона" }, desc: "Ультра Инстинкт. +13% урона всей команде." },
        { name: "Вегета (UE)", universe: "DB", damage: 115, hp: 105, speed: 3.2, ability: { type: "damageAura", value: 0.20, desc: "+20% урона, +10% враг", damageTakenMod: 0.10 }, desc: "Ультра Эго. +20% урона команде, но враг бьёт на 10% сильнее." },
        { name: "Мадара", universe: "Naruto", damage: 120, hp: 100, speed: 2.2, ability: { type: "damageReduction", value: 0.05, desc: "-5% урона" }, statusAbility: { type: "freezeStacks", value: 1, desc: "Заморозка +1" }, desc: "Призрак Учиха. -5% получаемого урона и заморозка +1." },
        { name: "Гарп (Galaxy impact)", universe: "One Piece", damage: 105, hp: 140, speed: 2.0, ability: { type: "damageAura", value: 0.20, desc: "+20% урона" }, desc: "Кулак галактики. +20% урона всей команде." },
        { name: "Омни-Мэн", universe: "Invincible", damage: 120, hp: 130, speed: 2.6, ability: { type: "damageAura", value: 0.12, desc: "+12% урона" }, statusAbility: { type: "bleed", value: 0.15, desc: "Кровотечение +15%" }, desc: "Нолан Грейсон. +12% урона команде и +15% урона через кровотечение." },
        { name: "Ло (Пробужденный)", universe: "One Piece", damage: 105, hp: 145, speed: 2.4, ability: { type: "healOnWin", percent: 0.03, desc: "+3% HP" }, statusAbility: { type: "shock", chance: 0.10, desc: "Электричество 10%" }, desc: "Пробуждённый фрукт. Лечит 3% HP при победе и 10% шанс шока." },
        
,
{ name: "Солдатик (Прайм)", universe: "The Boys", patchId: "the_boys", damage: 120, hp: 180, speed: 1.5, ability: { type: "damageReduction", value: 0.12, desc: "−12% получаемого урона" }, statusAbility: { type: "shock", chance: 0.10, desc: "10% шанс радиоактивного шока" }, desc: "Солдатик — крайне выносливый тяжеловес. Он способен накапливать радиоактивную энергию и высвобождать разрушительный импульс." },
        { name: "Чёрный Нуар II (Комиксный)", universe: "The Boys", patchId: "the_boys", damage: 105, hp: 155, speed: 1.7, ability: { type: "damageReduction", value: 0.10, desc: "−10% получаемого урона" }, desc: "Новый Чёрный Нуар обладает сверхсилой, стойкостью и способностью летать. Он опасен в ближнем бою, хотя характером отличается от оригинала." },
        
        { name: "Тек Найт (Охотник)", universe: "The Boys", patchId: "the_boys", damage: 95, hp: 130, speed: 1.6, ability: { type: "critChance", value: 0.10, desc: "+10% шанс критического удара" }, desc: "Тек Найт — детектив с усиленными чувствами, дедукцией и боевыми навыками. Чем больше он успел изучить противника, тем опаснее." },
        {"name":"Зоро (Тайм скип)","universe":"One Piece","patchId":"one_piece","damage":118,"hp":130,"speed":2.2,"ability":{"type":"critChance","value":0.2,"desc":"+20% шанс критического удара"},"statusAbility":{"type":"bleed","value":0.1,"desc":"+10% урона через кровотечение"},"desc":"Зоро после таймскипа хоть как то развивался не считая Вано?."},
        {"name":"Санджи (Вано)","universe":"One Piece","patchId":"one_piece","damage":104,"hp":116,"speed":2.7,"ability":{"type":"damageReduction","value":0.1,"desc":"−10% получаемого урона"},"desc":"Санджи в рейд-костюме получает маскировку, повышенную скорость и усиленную защиту."},
        {"name":"Согекинг (0.000000000001%)","universe":"One Piece","patchId":"one_piece","damage":125,"hp":120,"speed":2.6,"ability":{"type":"bossDamage","value":0.18,"desc":"+18% урона боссам"},"desc":"Друг бога Усоппа."},
        {"name":"Старичок Рэйли","universe":"One Piece","patchId":"one_piece","damage":112,"hp":115,"speed":2.5,"ability":{"type":"damageAura","value":0.12,"desc":"+12% урона команде"},"desc":"Тёмный король, правая рука Роджера. Опыт и хаки усиливают весь отряд."},
        {"name":"Козуки Одэн","universe":"One Piece","patchId":"one_piece","damage":115,"hp":132,"speed":2.2,"ability":{"type":"bossDamage","value":0.2,"desc":"+20% урона боссам"},"desc":"Легендарный самурай Вано, чьи два меча оставили шрамы даже на Кайдо."},
        {"name":"Монки Д. Драгон","universe":"One Piece","patchId":"one_piece","damage":104,"hp":136,"speed":2,"ability":{"type":"damageAura","value":0.15,"desc":"+15% урона команде"},"desc":"Загадочный лидер Революционной армии и отец Луффи. Его роль — менять ход мировой истории."},
        {"name":"Сенгоку (Будда)","universe":"One Piece","patchId":"one_piece","damage":115,"hp":145,"speed":1.8,"ability":{"type":"damageReduction","value":0.17,"desc":"−17% получаемого урона"},"desc":"Бывший адмирал флота. Мифический зоан Будды даёт огромную силу и стойкость."},
        {"name":"Бартоломью Кума ","universe":"One Piece","patchId":"one_piece","damage":102,"hp":155,"speed":1.7,"ability":{"type":"damageReduction","value":0.15,"desc":"−15% получаемого урона"},"desc":"Кума использует лапы отталкивания, отражая атаки и выдерживая тяжёлые столкновения."},
        {"name":"Катакури","universe":"One Piece","patchId":"one_piece","damage":112,"hp":120,"speed":2.2,"ability":{"type":"damageReduction","value":0.12,"desc":"−12% получаемого урона"},"statusAbility":{"type":"freezeStacks","value":1,"desc":"Моти связывает врага: +1 клик до контратаки"},"desc":"Катакури пробуждает силу моти и превращает окружение в продолжение собственных атак."},
        {"name":"Кид (Пробуждение: Дамнед Панк)","universe":"One Piece","patchId":"one_piece","damage":108,"hp":145,"speed":2.4,"ability":{"type":"damageMultChance","chance":0.24,"mult":1.35,"desc":"24% шанс нанести ×1,35 урона"},"desc":"Пробуждённый Кид собирает металл магнитными силами и выпускает разрушительный Дамнед Панк."},
        {"name":"Рёкугю (Арамаки)","universe":"One Piece","patchId":"one_piece","damage":100,"hp":140,"speed":2,"ability":{"type":"healOnWin","percent":0.04,"desc":"+4% HP после победы"},"desc":"Адмирал леса управляет растительной жизнью и восстанавливается, поглощая жизненную силу."},
        {"name":" Серафима S-Хок","universe":"One Piece","patchId":"one_piece","damage":85,"hp":55,"speed":1.6,"ability":{"type":"damageReduction","value":0.1,"desc":"−10% получаемого урона"},"desc":"Вроде мелкий, а вроде мелкий."},
        {"name":"Марко (Феникс)","universe":"One Piece","patchId":"one_piece","damage":35,"hp":62,"speed":1.7,"ability":{"type":"healOnWin","percent":0.03,"desc":"+3% HP после победы"},"desc":"Командир первой дивизии Белоуса. Феникс-форма даёт ему регенерацию и воздушную мобильность."},
        {"name":"Кизару ","universe":"One Piece","patchId":"one_piece","damage":76,"hp":75,"speed":2.6,"ability":{"type":"damageMultChance","chance":0.25,"mult":1.35,"desc":"25% шанс нанести ×1,35 урона"},"desc":"Адмирал света. Мгновенные перемещения и лазерные удары обеспечивают высокую скорость."},
        {"name":"Шарлотта Линлин (Большая Мамочка)","universe":"One Piece","patchId":"one_piece","damage":82,"hp":95,"speed":1.8,"ability":{"type":"damageAura","value":0.08,"desc":"+8% урона всей команде"},"desc":"Императрица моря усиливает отряд своим присутствием и атакует силами души и хоумисов."},
        {"name":"Луччи (Пробуждение CP0)","universe":"One Piece","patchId":"one_piece","damage":80,"hp":87,"speed":2.3,"ability":{"type":"critChance","value":0.14,"desc":"+14% шанс критического удара"},"statusAbility":{"type":"bleed","value":0.06,"desc":"+6% урона через кровотечение"},"desc":"Пробуждённый зоан Роб Луччи после таймскипа. Более быстрая и опасная версия агента CP9."},
        { name: "Татсумаки (Торнадо ужаса)", universe: "OPM", patchId: "one_punch_man", damage: 115, hp: 125, speed: 2.5, ability: { type: "damageAura", value: 0.07, desc: "+7% урона всей команде" }, desc: "Одна из сильнейших героинь S-класса. Её телекинез позволяет подавлять множество противников и усиливает давление всей команды." },
        { name: "Флэши Флэш", universe: "OPM", patchId: "one_punch_man", damage: 104, hp: 100, speed: 3.0, ability: { type: "critChance", value: 0.08, desc: "+8% к шансу критического удара" }, desc: "Невероятно быстрый ниндзя S-класса, побеждающий за счёт скорости, точности и серии смертельных ударов." },
        { name: "Гароу (Чудовищная форма)", universe: "OPM", patchId: "one_punch_man", damage: 120, hp: 135, speed: 2.6, ability: { type: "damageMultChance", chance: 0.18, mult: 1.25, desc: "18% шанс нанести ×1,25 урона" }, desc: "Гароу после серьёзного превращения в монстра. Это его не-космическая форма: опасный мастер адаптации, но не божественный противник." },
        { name: "Гокецу", universe: "OPM", patchId: "one_punch_man", damage: 112, hp: 155, speed: 2.0, ability: { type: "bossDamage", value: 0.10, desc: "+10% урона боссам" }, desc: "Боец Ассоциации монстров с чудовищной физической мощью и мастерством единоборств. Особенно эффективен в схватках с боссами." },
        { name: "Старшая Многоножка", universe: "OPM", patchId: "one_punch_man", damage: 100, hp: 190, speed: 1.35, ability: { type: "damageReduction", value: 0.09, desc: "−9% получаемого урона" }, desc: "Гигантский драконий монстр с несколькими прочными панцирями. Его специализация — выдерживать тяжёлые атаки." },
        { name: "Орочи (Король монстров)", universe: "OPM", patchId: "one_punch_man", damage: 120, hp: 170, speed: 1.85, statusAbility: { type: "fire", damage: 6, duration: 3000, desc: "Поток энергии: 6 урона в секунду" }, desc: "Король монстров обладает огромной мощью и энергетическими атаками. Сильная легендарная карта, но без божественной формы." },
        { name: "Платиновый Сперм", universe: "OPM", patchId: "one_punch_man", damage: 118, hp: 145, speed: 2.8, ability: { type: "critChance", value: 0.08, desc: "+8% к шансу критического удара" }, desc: "Слияние огромного числа клеток создаёт невероятно быстрого монстра драконьего уровня. Его скорость повышает вероятность критических ударов." },
        { name: "Бласт", universe: "OPM", patchId: "one_punch_man", damage: 118, hp: 140, speed: 2.6, ability: { type: "damageReduction", value: 0.08, desc: "−8% получаемого урона" }, statusAbility: { type: "freezeStacks", value: 1, desc: "Пространственные порталы: +1 клик до контратаки" }, desc: "Герой №1 S-класса использует пространственные порталы и силу, связанную с измерениями. Сильнейшая карта разлома, но ниже космических и божественных форм." },
        {
            "name": "Джотаро Куджо (часть 3: Star Platinum)",
            "universe": "JoJo",
            "damage": 142,
            "hp": 220,
            "speed": 2,
            "ability": {
                "type": "critChance",
                "value": 0.16,
                "desc": "+16% шанс критического удара"
            },
            "statusAbility": {
                "type": "shock",
                "chance": 0.1,
                "desc": "10% шанс шока"
            },
            "minRebirth": 1,
            "desc": "Пик Джотаро во время путешествия к Дио. Star Platinum невероятно силён, точен и быстр."
        },
        {
            "name": "Джотаро Куджо (часть 4)",
            "universe": "JoJo",
            "damage": 126,
            "hp": 211,
            "speed": 1.9,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.14,
                "mult": 1.45,
                "desc": "14% шанс нанести ×1,45 урона"
            },
            "minRebirth": 1,
            "desc": "Джотаро спустя годы после битвы с Дио: опытный стенд-юзер, помогающий команде в Морио."
        },
        {
            "name": "Джоске Хигашиката (часть 4: Crazy Diamond)",
            "universe": "JoJo",
            "damage": 123,
            "hp": 222,
            "speed": 1.85,
            "ability": {
                "type": "healOnWin",
                "percent": 0.05,
                "desc": "+5% HP после победы"
            },
            "minRebirth": 1,
            "desc": "Главный герой Diamond is Unbreakable. Crazy Diamond восстанавливает повреждённые предметы и тела."
        },
        {
            "name": "Йошикаге Кира (часть 4: Killer Queen)",
            "universe": "JoJo",
            "damage": 136,
            "hp": 199,
            "speed": 1.8,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.15,
                "mult": 1.5,
                "desc": "15% шанс нанести ×1,5 урона"
            },
            "statusAbility": {
                "type": "fire",
                "damage": 10,
                "duration": 3000,
                "desc": "Взрыв наносит 10 урона за тик"
            },
            "minRebirth": 2,
            "desc": "Серийный убийца Морио, превращающий прикоснувшиеся объекты в бомбы с помощью Killer Queen."
        },
        {
            "name": "Джорно Джованна (Gold Experience)",
            "universe": "JoJo",
            "damage": 137,
            "hp": 218,
            "speed": 2.1,
            "ability": {
                "type": "healOnWin",
                "percent": 0.05,
                "desc": "+5% HP после победы"
            },
            "minRebirth": 2,
            "desc": "Джорно создаёт живые организмы с Gold Experience и стремится стать боссом, защищающим невинных."
        },
        {
            "name": "Дьяволо (King Crimson)",
            "universe": "JoJo",
            "damage": 148,
            "hp": 211,
            "speed": 2.2,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.16,
                "mult": 1.5,
                "desc": "16% шанс нанести ×1,5 урона"
            },
            "minRebirth": 2,
            "desc": "Босс Passione, который видит будущее и стирает короткие промежутки времени."
        },
        {
            "name": "Джолин Куджо (Stone Free)",
            "universe": "JoJo",
            "damage": 128,
            "hp": 228,
            "speed": 2,
            "ability": {
                "type": "damageReduction",
                "value": 0.1,
                "desc": "−10% получаемого урона"
            },
            "minRebirth": 2,
            "desc": "Джолин использует Stone Free, превращая своё тело в нити для защиты, ловушек и дальних ударов."
        },
        {
            "name": "Уэзер Репорт (часть 6)",
            "universe": "JoJo",
            "damage": 132,
            "hp": 214,
            "speed": 1.85,
            "ability": {
                "type": "critChance",
                "value": 0.15,
                "desc": "+15% шанс критического удара"
            },
            "statusAbility": {
                "type": "shock",
                "chance": 0.14,
                "desc": "14% шанс шока"
            },
            "minRebirth": 2,
            "desc": "Мастер погоды, управляющий атмосферными явлениями и опасными погодными эффектами."
        },
        {
            "name": "Энрико Пуччи (Whitesnake)",
            "universe": "JoJo",
            "damage": 132,
            "hp": 203,
            "speed": 2,
            "ability": {
                "type": "bossDamage",
                "value": 0.15,
                "desc": "+15% урона боссам"
            },
            "minRebirth": 2,
            "desc": "Священник и главный антагонист Stone Ocean на раннем этапе своего плана. Whitesnake извлекает диски памяти и стендов."
        },
        {
            "name": "Джироламо Джеппели (Gyro Zeppeli)",
            "universe": "JoJo",
            "damage": 134,
            "hp": 207,
            "speed": 1.9,
            "ability": {
                "type": "critChance",
                "value": 0.16,
                "desc": "+16% шанс критического удара"
            },
            "minRebirth": 2,
            "desc": "Мастер вращения и стальных сфер, участвующий в гонке Steel Ball Run."
        },
        {
            "name": "Джонни Джостар (Tusk Act 3)",
            "universe": "JoJo",
            "damage": 151,
            "hp": 213,
            "speed": 2,
            "ability": {
                "type": "bossDamage",
                "value": 0.15,
                "desc": "+15% урона боссам"
            },
            "minRebirth": 3,
            "desc": "Продвинутая форма Tusk открывает вращающиеся порталы и позволяет атаковать через пространственные отверстия."
        },
        {
            "name": "Фанни Валентайн (D4C)",
            "universe": "JoJo",
            "damage": 156,
            "hp": 224,
            "speed": 1.9,
            "ability": {
                "type": "resurrect",
                "chance": 0.05,
                "desc": "5% шанс воскреснуть"
            },
            "minRebirth": 3,
            "desc": "Президент США и владелец Dirty Deeds Done Dirt Cheap, перемещающийся между параллельными мирами."
        },
        {
            "name": "Джоске Хигашиката (JoJolion: Soft & Wet)",
            "universe": "JoJo",
            "damage": 146,
            "hp": 218,
            "speed": 2.1,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.15,
                "mult": 1.45,
                "desc": "15% шанс нанести ×1,45 урона"
            },
            "minRebirth": 3,
            "desc": "Герой JoJolion, использующий пузыри Soft & Wet для кражи свойств у объектов."
        },
        {
            "name": "Джобин Хигашиката (Speed King)",
            "universe": "JoJo",
            "damage": 133,
            "hp": 198,
            "speed": 1.9,
            "ability": {
                "type": "bossDamage",
                "value": 0.12,
                "desc": "+12% урона боссам"
            },
            "statusAbility": {
                "type": "fire",
                "damage": 12,
                "duration": 3000,
                "desc": "Нагрев наносит 12 урона за тик"
            },
            "minRebirth": 3,
            "desc": "Амбициозный член семьи Хигашиката, способный накапливать тепло в предметах и людях."
        },
        {
            "name": "Диего Брандо (The World)",
            "universe": "JoJo",
            "damage": 153,
            "hp": 205,
            "speed": 2.35,
            "ability": {
                "type": "critChance",
                "value": 0.18,
                "desc": "+18% шанс критического удара"
            },
            "minRebirth": 3,
            "desc": "Альтернативный Диего из Steel Ball Run, получивший стенд The World в финальной гонке."
        },
        {
            "name": "Энрико Пуччи (C-Moon)",
            "universe": "JoJo",
            "damage": 146,
            "hp": 213,
            "speed": 2.25,
            "ability": {
                "type": "damageReduction",
                "value": 0.1,
                "desc": "−10% получаемого урона"
            },
            "minRebirth": 3,
            "desc": "Промежуточная эволюция стенда Пуччи, создающая гравитационные аномалии и выворачивающая цели наизнанку."
        },
        {
            "name": "Джонни Джостар (Tusk Act 1)",
            "universe": "JoJo",
            "damage": 118,
            "hp": 188,
            "speed": 1.8,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.4,
                "desc": "12% шанс нанести ×1,4 урона"
            },
            "minRebirth": 2,
            "desc": "Начальная форма Tusk, пробуждённая через вращение и силу Святых останков."
        }
    ],
    "Секретная": [
        {
            name: "Годжо", universe: "JJK", damage: 360, hp: 155, speed: 3.4, sellPrice: 2800,
            ability: { type: "critChance", value: 0.90, desc: "90% шанс крита (урон x2)" },
            statusAbility: { type: "gojoDodge", chance: 0.30, desc: "30% шанс полностью отменить входящий урон" },
            desc: "Секретный Сатору Годжо: огромный урон, но здоровье ниже среднего. На 4★ обычные атаки критуют с шансом 90%; на 3★ есть 30% шанс полностью отменить входящий удар.",
            superAbility: { name: "SUPER: БЕЗГРАНИЧНОСТЬ", desc: "Красный создаёт красную сферу и запускает её вверх, отталкивая пули; при попадании по уникальному боссу наносит 5% максимального HP и отбрасывает его. Синий создаёт синюю сферу, которая притягивает блоки и уникального босса. Бесконечность на 3 секунды уничтожает блоки вокруг игрока, но вдвое замедляет его. При 100% Проклятой энергии Красный и Синий заменяются Фиолетовым: Годжо соединяет их и выпускает луч длиной примерно в половину арены, уничтожающий блоки на пути и наносящий уникальному боссу 15% максимального HP.", passive: false }
        },
        // ★★★ ТАКАБА ★★★
        { 
            name: "Такаба", 
            universe: "JJK", 
            damage: 180, 
            hp: 300, 
            speed: 2.5, 
            sellPrice: 1800, 
            minRebirth: 3,
            ability: { 
                type: "takabaConfidence", 
                desc: "Уверенность 0-100. Чем выше — тем сильнее урон и защита" 
            }, 
            desc: "Техника «Комик»: уверенность 0–100% повышает урон и скорость на 0,6% за каждый пункт и настолько же снижает получаемый урон (максимум ±60%). Каждый полученный удар снимает 10 пунктов уверенности. После 5 секунд без урона восстанавливается 1 пункт каждые 2 секунды. При уверенности от 40% раз в 7 секунд может сработать случайный комедийный эффект.",
            superAbility: { 
                name: "SUPER: ШУТКА ТАКАБЫ", 
                desc: "Такаба рассказывает тупую шутку: арена замирает на 4 секунды, после чего Такаба получает +30% уверенности. Кулдаун: 20 сек.",
                passive: false 
            }
        },
        { 
            name: "Луффи: Ника, Бог Солнца", universe: "One Piece", damage: 150, hp: 200, speed: 3.8, sellPrice: 1500, minRebirth: 2, 
            ability: { type: "bossDamage", value: 0.30, desc: "+30% боссам", damageReduction: 0.10 }, 
            desc: "Пробуждение дьявольского фрукта. +30% урона боссам и -10% получаемого урона.",
            superAbility: { name: "SUPER: ОСВОБОЖДЕНИЕ", desc: "Сердце становится огромным и быстрым. Получаешь больше урона, но бьёшь больнее. «Я и так уже смеюсь!»", passive: false }
        },
        { 
            name: "Космический Гароу", universe: "OPM", damage: 250, hp: 400, speed: 3.5, sellPrice: 2800, minRebirth: 4, 
            ability: { type: "scaleWithWins", value: 0.01, desc: "+1% силы/волна" }, 
            desc: "Урон растёт на 1% за каждую победу. После смерти накопленный бонус сохраняется, только если в последних 5 победах команда ни разу не содержала Космического Гароу; если он участвовал хотя бы в одной из этих побед, бонус сбрасывается. После ребёрна бонус сбрасывается.",
            superAbility: { name: "SUPER: ПОТОК ВСЕЛЕННОЙ", desc: "Отматывает время на 2 секунды назад. Телепорт с неуязвимостью. Круто же, да?", passive: false }
        },
        { 
            name: "Сайтама", universe: "OPM", damage: 200, hp: 300, speed: 4.0, sellPrice: 1500, minRebirth: 3, 
            ability: { type: "oneShot", chance: 0.05, desc: "5% ваншот" }, 
            desc: "Лысый плащ. 5% шанс убить врага с одного удара.",
            superAbility: { name: "SUPER: ОБЫЧНЫЙ УДАР", desc: "Огромный красный кулак летит вверх, сметая все атаки. Шанс 1% ваншотнуть босса с SUPER атаки.", passive: false }
        },
        { 
            name: "Борос", universe: "OPM", damage: 180, hp: 350, speed: 3.2, sellPrice: 1400, minRebirth: 2, 
            ability: { type: "healOnWin", percent: 0.05, desc: "+5% HP" }, 
            desc: "Владыка вселенной. Лечит 5% HP при победе.",
            superAbility: { name: "SUPER: РЕГЕНЕРАЦИЯ", desc: "Медленно восстанавливает HP, но замедляет персонажа. А вот жалкие людишки так не могут! Хе-хе-хе", passive: false }
        },
        { 
            name: "Бог Усопп", universe: "One Piece", damage: 250, hp: 400, speed: 2.5, sellPrice: 2000, minRebirth: 3, 
            ability: { type: "resurrect", chance: 0.05, desc: "5% воскрес" }, 
            desc: "Великий воин морей. 5% шанс воскреснуть при смерти.",
            superAbility: { name: "SUPER: ЛОЖЬ СТАНОВИТСЯ ПРАВДОЙ", desc: "Полная неуязвимость на 3 секунды, но потом 2 секунды оглушения. А вы ему верите?", passive: false }
        },
        { 
            name: "Зено", universe: "DB", damage: 300, hp: 500, speed: 3.0, sellPrice: 3000, minRebirth: 4, 
            ability: { type: "zenoCheckpoint", desc: "10% след. чекпоинт" }, 
            statusAbility: { type: "fatigueResist", value: 0.30, desc: "-30% усталости" }, 
            desc: "Царь всего. 10% шанс открыть следующий чекпоинт и -30% усталости.",
            superAbility: { name: "SUPER: СТИРАНИЕ", desc: "Уничтожает ВСЕ атаки на экране и наносит 10% урона боссу. Скучно -_-", passive: false }
        },
        { 
            name: "Анти-спираль", universe: "GL", damage: 280, hp: 450, speed: 2.8, sellPrice: 2500, minRebirth: 2, 
            ability: { type: "damageReduction", value: 0.30, desc: "-30% урона" }, 
            desc: "Враг всего живого. Уменьшает получаемый урон на 30%.",
            superAbility: { name: "SUPER: СЖАТИЕ ПРОСТРАНСТВА", desc: "Увеличивает арену на 30%! Ну вроде :/", passive: false }
        },
        { 
            name: "Молодой Гарп", universe: "One Piece", damage: 260, hp: 380, speed: 3.3, sellPrice: 2500, minRebirth: 3, 
            ability: { type: "damageAura", value: 0.25, desc: "+25% урона" }, 
            desc: "Гарп в расцвете сил. +25% урона всей команде.",
            superAbility: { name: "SUPER: ГАЛАКТИЧЕСКИЙ УДАР", desc: "Заряжает Хаки 1.2 секунды, затем БА-БАХ! АоЕ взрыв, очистка атак и 5% урона боссу. После удара — бафф Хаки на 6 секунд. Правда, после этого у босса всего лишь шишка. А атака была такой зрелищной....", passive: false }
        },
        { 
            name: "Им (Правитель)", universe: "One Piece", damage: 290, hp: 450, speed: 2.2, sellPrice: 3000, minRebirth: 5, 
            ability: { type: "bossDamage", value: 0.20, desc: "+20% боссам" }, 
            desc: "Тайный правитель мира. +20% урона боссам.",
            superAbility: { name: "SUPER: ТЕНЕВОЕ ПРАВЛЕНИЕ", desc: "Тёмная аура вокруг сердца. Атаки, касающиеся ауры, имеют 50% шанс быть уничтоженными. Но сердце замедлено на 30%. Это для тех, кто не умеет уварачиваться. Для тебя, хех!", passive: false }
        },
        { 
            name: "Космический Дэнди", universe: "Space Dandy", damage: 200, hp: 650, speed: 2.7, sellPrice: 2200, minRebirth: 3, 
            ability: { type: "critChance", value: 0.15, desc: "+15% крит" }, 
            statusAbility: { type: "shock", chance: 0.20, desc: "Шок 20%" }, 
            desc: "Постоянный клиент космического фансервис-кафе «Груди»",
            superAbility: { name: "SUPER: КОСМИЧЕСКАЯ УДАЧА", desc: "Рулетка! 80% шанс получить крутой бафф (лечение, урон x2, очистка, скорость, щит и т.д.) и 20% шанс получить смешной дебафф. «Повезёт? Не повезёт? Дэнди знает!»", passive: false }
        },
        { 
            name: "Кайдо", universe: "One Piece", damage: 300, hp: 500, speed: 2.4, sellPrice: 3000, minRebirth: 4, 
            ability: { type: "bossDouble", desc: "x2 урон (босс)" }, 
            desc: "Сильнейший в мире. При битве с боссом наносит удвоенный урон.",
            superAbility: { name: "SUPER: ДЫХАНИЕ РАЗРУШЕНИЯ", desc: "Пьёт пиво 2 секунды, затем впадает в ЯРОСТЬ на 10 секунд: хил 10%, поглощение 30% урона, +80% урона, скорость x1.5. Но управление ИНВЕРТИРУЕТСЯ! После — похмелье (замедление). Как можно во время боя пить?", passive: false }
        },
        { 
            name: "Император Марк", universe: "Invincible", damage: 310, hp: 500, speed: 3.1, sellPrice: 3000, minRebirth: 5, 
            ability: { type: "bossSupport", desc: "+15% урона (босс)" }, 
            statusAbility: { type: "bleed", value: 0.12, desc: "Кровотечение +12%" }, 
            desc: "Марк спустя 500 лет. +15% урона команде при битве с боссом, +12% урона через кровотечение.",
            superAbility: { name: "ПАССИВКА: НЕПОБЕДИМАЯ ВОЛЯ", desc: "Два анти-ваншота за арену! При смерти воскресает с 25% HP. Ну проще говоря - сюжетная броня!", passive: true }
        },
        { 
            name: "Деку (100%)", universe: "MHA", damage: 280, hp: 450, speed: 3.6, sellPrice: 2800, minRebirth: 4, 
            ability: { type: "bossDoubleSelf", desc: "x2 урон (босс), -30% на 10 волн" }, 
            desc: "Полная сила One For All. Удваивает урон при битве с боссом, но ослабляет на 30% на следующие 10 волн.",
            superAbility: { name: "SUPER: ПОЛНОЕ 100% ПОКРЫТИЕ", desc: "Скорость x3, урон x2! Но каждую секунду теряешь 2% HP. Зелёные молнии повсюду! А без Эри ты бы включил 100%?", passive: false }
        },
        { 
            name: "Всемогущий (прайм)", universe: "MHA", damage: 300, hp: 480, speed: 3.4, sellPrice: 3000, minRebirth: 4, 
            ability: { type: "damageAura", value: 0.15, desc: "+15% урона" }, 
            statusAbility: { type: "bossDamageAura", value: 0.10, desc: "+25% (босс)" }, 
            desc: "Символ мира в прайме. +15% урона команде и +25% при битве с боссом.",
            superAbility: { name: "SUPER: СИМВОЛ МИРА", desc: "Хитбокс x2, урон x3 на 15 секунд! Но потом теряешь 50% HP и НАВСЕГДА замедляешься в 3 раза. ПЛЮЮЮС УЛЬТРААААА!", passive: false }
        },
        { 
            name: "ДИО Over Heaven", universe: "JoJo", damage: 280, hp: 420, speed: 3.1, sellPrice: 3500, minRebirth: 4,
            ability: { type: "oneShot", chance: 0.03, desc: "3% шанс мгновенно уничтожить врага, даже босса" },
            statusAbility: { type: "shock", chance: 0.15, desc: "15% шанс шока" },
            extraStatus: [],
            waveRegen: 0.01,
            desc: "Пассивные эффекты: 3% шанс мгновенно уничтожить врага (включая босса), 15% шанс шока и восстановление 1% HP за волну. На уникальных боссах The World Over Heaven даёт пять тактических навыков: остановка времени, лечение, телепорт, агрессивные снаряды и атака Стенда или ножевой залп.",
            superAbility: { name: "SUPER: THE WORLD OVER HEAVEN", desc: "Пять навыков используют общую шкалу энергии 0–100, которая заполняется нанесённым уроном. TIME STOP: кольцо появляется через 1,5 с и расширяется 1,8 с, останавливая объекты по мере прохождения. HEAL восстанавливает здоровье; TELEPORT возвращает на позицию примерно 1 секунду назад и ненадолго останавливает время; AGGRESSIVE выпускает снаряды, которые сталкиваются с вражескими атаками. Пятый навык: вблизи Стенд наносит уникальному боссу 10% максимального HP за серию ударов, издали DIO готовит ножевой залп 2 секунды, наносящий 8% HP.", passive: false }
        },
        { 
            name: "Белоус", universe: "One Piece", damage: 400, hp: 250, speed: 2.0, sellPrice: 800, minRebirth: 0,
            unsellable: true,
            ability: { type: "whitebeardSpecial", desc: "Пассивно: 10% поглощения урона, 3% шанс воскреснуть, +1% HP за волну и бонус комбо 2% за серию из 5 ударов. При 4★+: регенерация 2% HP каждые 5 с. УДАР: перезарядка 30 с → ЦУНАМИ: окно 20 с, запуск с задержкой 1,5 с." },
            desc: "Эдвард Ньюгейт. Сильнейший человек в мире. Нельзя получить через гачу — только победив супер-Белоуса."
        }
,
{ name: "Хоумлендер (Без ограничений)", universe: "The Boys", patchId: "the_boys", damage: 190, hp: 260, speed: 2.1, ability: { type: "bossDamage", value: 0.15, desc: "+15% урона боссам" }, statusAbility: { type: "fire", damage: 12, duration: 4500, desc: "Лазеры: 12 урона/сек" }, desc: "Самая сильная карта патча: полёт, сверхсила, скорость, сверхчувствительный слух, прочность и разрушительное тепловое зрение." },
        { name: "Бутчер (Монстр V)", universe: "The Boys", patchId: "the_boys", damage: 175, hp: 230, speed: 1.9, ability: { type: "bossDamage", value: 0.13, desc: "+13% урона боссам" }, statusAbility: { type: "bleed", value: 0.10, desc: "+10% урона через кровотечение" }, desc: "Бутчер с развитой силой V24, щупальцами и тепловым зрением — крайне опасный боец, но нестабилен из-за цены препарата." },
        { name: "Райан (Наследник)", universe: "The Boys", patchId: "the_boys", damage: 160, hp: 210, speed: 2, ability: { type: "bossDamage", value: 0.11, desc: "+11% урона боссам" }, statusAbility: { type: "fire", damage: 11, duration: 3500, desc: "Лазерное зрение: 11 урона/сек" }, desc: "Райан унаследовал почти весь набор сил Хоумлендера, а его потенциал огромен, но опыта всё ещё меньше." },
        {"name":"Зоро (Вано: Король ада)","universe":"One Piece","patchId":"one_piece","damage":230,"hp":250,"speed":3,"ability":{"type":"bossDamage","value":0.25,"desc":"+25% урона боссам"},"statusAbility":{"type":"bleed","value":0.12,"desc":"+12% урона через кровотечение"},"desc":"Пиковая версия Зоро с продвинутым хаки короля и клинками, покрытыми чёрным пламенем."},
        {"name":"Чёрная Борода (Два дьявольских плода)","universe":"One Piece","patchId":"one_piece","damage":280,"hp":310,"speed":2.5,"ability":{"type":"damageAura","value":0.12,"desc":"+12% урона команде"},"statusAbility":{"type":"shock","chance":0.12,"desc":"12% шанс сотрясающего шока"},"desc":"Тич сочетает тьму Ями-Ями и разрушительную силу Гура-Гура. Отдельная версия после получения второго плода."},
        {"name":"Гол Д. Роджер (Камусари)","universe":"One Piece","patchId":"one_piece","damage":265,"hp":275,"speed":3.1,"ability":{"type":"bossDamage","value":0.3,"desc":"+30% урона боссам"},"statusAbility":{"type":"bleed","value":0.08,"desc":"+8% урона через хаки"},"desc":"Роджер выпускает Камусари — стремительный удар хаки, прославивший Короля пиратов."},
        {
            "name": "ДИО (The World, часть 3)",
            "universe": "JoJo",
            "damage": 255,
            "hp": 365,
            "speed": 2.8,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.18,
                "mult": 1.7,
                "desc": "18% шанс нанести ×1,7 урона"
            },
            "statusAbility": {
                "type": "shock",
                "chance": 0.15,
                "desc": "15% шанс шока"
            },
            "minRebirth": 3,
            "desc": "Дио в финальной битве Stardust Crusaders. The World способен останавливать время."
        },
        {
            "name": "Джорно Джованна (Gold Experience Requiem)",
            "universe": "JoJo",
            "damage": 320,
            "hp": 460,
            "speed": 2.7,
            "ability": {
                "type": "damageReduction",
                "value": 0.22,
                "desc": "−22% получаемого урона"
            },
            "statusAbility": {
                "type": "shock",
                "chance": 0.12,
                "desc": "12% шанс шока"
            },
            "minRebirth": 4,
            "desc": "Requiem-форма Gold Experience, способная возвращать действия и волю противника к нулю."
        },
        {
            "name": "Энрико Пуччи (Made in Heaven)",
            "universe": "JoJo",
            "damage": 300,
            "hp": 390,
            "speed": 3.2,
            "ability": {
                "type": "critChance",
                "value": 0.2,
                "desc": "+20% шанс критического удара"
            },
            "minRebirth": 4,
            "desc": "Финальная эволюция стенда Пуччи, ускоряющая время и движение всего мира."
        },
        {
            "name": "Джонни Джостар (Tusk Act 4)",
            "universe": "JoJo",
            "damage": 345,
            "hp": 420,
            "speed": 2.8,
            "ability": {
                "type": "bossDamage",
                "value": 0.22,
                "desc": "+22% урона боссам"
            },
            "minRebirth": 4,
            "desc": "Высшая форма Tusk, использующая бесконечное вращение для пробивания почти любой защиты."
        },
        {
            "name": "Карс (Высшее существо)",
            "universe": "JoJo",
            "damage": 310,
            "hp": 490,
            "speed": 2.65,
            "ability": {
                "type": "damageReduction",
                "value": 0.22,
                "desc": "−22% получаемого урона"
            },
            "minRebirth": 4,
            "desc": "Карс достигает совершенной формы, сочетая силу и способности практически всех живых существ."
        },
        {
            "name": "Тору (Wonder of U)",
            "universe": "JoJo",
            "damage": 295,
            "hp": 435,
            "speed": 2.7,
            "ability": {
                "type": "damageReduction",
                "value": 0.2,
                "desc": "−20% получаемого урона"
            },
            "statusAbility": {
                "type": "bleed",
                "value": 0.12,
                "desc": "+12% урона через кровотечение"
            },
            "minRebirth": 4,
            "desc": "Пользователь Wonder of U, чья сила направляет бедствия на тех, кто преследует его или стенд."
        }
    ],
    "Эволюционная": [
        { name: "Луффи : Король пиратов", universe: "One Piece", damage: 1200, hp: 2000, speed: 4.5, minRebirth: 5, ability: { type: "bossDamage", value: 0.50, desc: "+50% боссам", bossReduction: 0.40 }, unsellable: true, desc: "Король пиратов. +50% урона боссам и -40% получаемого урона при битве с боссом. Чтобы получить: соберите 5 разных Луффи в команду (ровно 5 карт) и победите босса 500 волны." },
        { name: "Сайтама/Гароу", universe: "Эволюция", damage: 1500, hp: 2500, speed: 5.0, minRebirth: 5, ability: { type: "oneShot", chance: 0.15, desc: "15% ваншот" }, statusAbility: { type: "scaleWithWins", value: 0.03, desc: "+3% силы/волна" }, unsellable: true, desc: "Слияние сильнейших. 15% шанс ваншота и +3% силы за каждую волну. Чтобы получить: ваншотните 2000 врагов способностью Сайтамы (Сайтама + Космический Гароу в команде)." },
        { name: "Гарп/Кудзан", universe: "Эволюция", damage: 1400, hp: 2200, speed: 3.5, minRebirth: 5, ability: { type: "damageAura", value: 0.40, desc: "+40% урона" }, statusAbility: { type: "absoluteFreeze", value: 0.5, desc: "-50% урона" }, unsellable: true, desc: "Учитель и ученик. +40% урона команде и -50% получаемого урона. Чтобы получить: накопите 1 000 000 000 урона (Молодой Гарп + Кудзан в команде)." },
        { name: "Семёрка", universe: "The Boys", damage: 1600, hp: 2600, speed: 4.0, minRebirth: 5, ability: { type: "sevenSpecial", desc: "V x3, хил 5%/волна", healOnWave: 0.05, damageReduction: 0.10 }, statusAbility: { type: "blind", value: 2, desc: "Ослепление +2" }, extraStatus: [{ type: "fire", damage: 10, duration: 3000 }, { type: "shock", chance: 0.15 }], unsellable: true, desc: "Вся Семёрка вместе. Препарат V утраивает баффы, хил 5% за волну, ослепление, лазеры и электричество. Чтобы получить: Хоумлендер, Звёздочка, Мреющий, Чёрный Нуар, Пучино, Королева Мэйв с V и 20 ур." },
        { name: "Уильям Фрэнсис", universe: "Invincible", damage: 800, hp: 1200, speed: 3.0, minRebirth: 5, ability: { type: "copyEnemyChance", chance: 0.15, desc: "15% копирует врага" }, unsellable: true, desc: "Копирует характеристики врага с шансом 15%. Чтобы получить: победите босса 2000 волны только с обычными картами (6 шт)." }
    ],
    "Босс": [
        { name: "Охотник за головами", universe: "Боссы", damage: 150, hp: 300, speed: 2.0, sellPrice: 1000, minRebirth: 0, ability: { type: "bossDamage", value: 0.10, desc: "+10% боссам" }, desc: "Особая карта босса финальной волны. +10% урона боссам." },
        { name: "Король Демонов", universe: "Боссы", damage: 200, hp: 400, speed: 1.5, sellPrice: 2000, minRebirth: 1, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Особая карта босса 100-й волны. +5% урона команде." },
        { name: "Маджин Буу", universe: "Боссы", damage: 250, hp: 500, speed: 1.8, sellPrice: 3000, minRebirth: 2, statusAbility: { type: "bleed", value: 0.10, desc: "Кровотечение +10%" }, desc: "Особая карта босса 200-й волны. +10% урона через кровотечение." },
        { name: "Король Пиратов", universe: "Боссы", damage: 400, hp: 800, speed: 2.2, sellPrice: 5000, minRebirth: 3, ability: { type: "bossDamage", value: 0.20, desc: "+20% боссам" }, desc: "Особая карта, связанная с Путеводной Звездой. +20% урона боссам." }
    ],
    "Пасхалка": [
        { name: "Пельмешка", universe: "Кухня", damage: 35, hp: 60, speed: 1.0, unsellable: true, ability: { type: "luckAura", value: 0.50, desc: "+50% удачи" }, desc: "Вкусный пельмень. +50% к удаче." },
        { name: "Попугай Соня", universe: "Зоопарк", damage: 3, hp: 5, speed: 0.8, unsellable: true, ability: { type: "deathBonus", value: 0.30, desc: "+30% звёзд" }, desc: "После смерти даёт +30% к накопленным звёздам." },
        { name: "DrinkTea2Win", universe: "Кухня", damage: 20, hp: 550, speed: 6, unsellable: true, ability: { type: "fatigueResist", value: 0.50, desc: "-50% усталости" }, desc: "Бодрящий напиток. Победа... в чашке? Снижает набор усталости на 50%." }
    ]
};

// ========== БОССЫ ==========
const bossTemplates = {
    50:  { name: "Король Демонов", hpMult: 4, dmgMult: 0.8, dialogue: "Ты думаешь, что сможешь одолеть меня? Глупец.", enemyStatus: { type: "freezeStacks", value: 1 }, arenaTypes: [0] },
    100: { name: "Маджин Буу", hpMult: 5.3, dmgMult: 0.1, dialogue: "Буу, я голоден! Ты станешь моим обедом!", enemyStatus: { type: "bleed", value: 0.2 }, arenaTypes: [0] },
    150: { name: "Дзирэн", hpMult: 6, dmgMult: 1.3, dialogue: "Сила — это абсолютная справедливость.", enemyStatus: { type: "shock", chance: 0.2 }, arenaTypes: [0,1] },
    200: { name: "Живой камень", hpMult: 32, dmgMult: 0.5, dialogue: "Может я и наношу мало урона, но сначала попробуй меня пробить!", enemyStatus: { type: "shock", chance: 0.4 }, arenaTypes: [0,1] },
    250: { name: "Великий самурай", hpMult: 6.7, dmgMult: 2.1, dialogue: "У меня нет цели. Только путь.", enemyStatus: { type: "bleed", value: 0.2 }, arenaTypes: [1,2] },
    300: { name: "Бог Грома", hpMult: 8.7, dmgMult: 1.7, dialogue: "Ты всего лишь искра в моей буре!", enemyStatus: { type: "shock", chance: 0.5 }, arenaTypes: [1,2] },
    350: { name: "Ледяной Титан", hpMult: 12, dmgMult: 1.5, dialogue: "Я заморожу само время!", enemyStatus: { type: "freezeStacks", value: 3 }, arenaTypes: [0,1,8] },
    400: { name: "Теневой Дракон", hpMult: 10, dmgMult: 2.0, dialogue: "Тени поглотят тебя целиком.", enemyStatus: { type: "blind", value: 2 }, arenaTypes: [1,3] },
    450: { name: "Гаара (Хвостатый)", hpMult: 9.3, dmgMult: 2.3, dialogue: "Песок защитит меня... и похоронит тебя.", enemyStatus: { type: "bleed", value: 0.25 }, arenaTypes: [2,3] },
    500: { name: "Путеводная Звезда", hpMult: 200, dmgMult: 2.4, dialogue: "Ты дошел довольно долеко... Победи меня и я покажу тебе истенный путь", canSpare: true, spareReward: "Король Пиратов", isSpecial: true, arenaTypes: [0,1,2,3] },
    550: { name: "Кайдо (Гибрид)", hpMult: 14.7, dmgMult: 2.8, dialogue: "Хочешь умереть? Я дам тебе эту честь!", enemyStatus: { type: "fire", damage: 8, duration: 5000 }, arenaTypes: [2,3,7] },
    600: { name: "Мадара Учиха", hpMult: 16, dmgMult: 3.2, dialogue: "Реальность — лишь иллюзия. Моя иллюзия.", enemyStatus: { type: "blind", value: 3 }, arenaTypes: [0,1,2,3,8] },
    650: { name: "Король Смерти", hpMult: 18.7, dmgMult: 2.0, dialogue: "Твоя душа... такая вкусная.", enemyStatus: { type: "poison", damage: 5 }, arenaTypes: [5,6,7] },
    700: { name: "Гоку (SSJ Blue)", hpMult: 17.3, dmgMult: 3.6, dialogue: "Я покажу тебе настоящую силу саяна!", enemyStatus: { type: "shock", chance: 0.3 }, arenaTypes: [2,3,7] },
    750: { name: "Космический Титан", hpMult: 21.3, dmgMult: 2.9, dialogue: "Я видел рождение и смерть галактик.", enemyStatus: { type: "freezeStacks", value: 2 }, arenaTypes: [0,1,8,9] },
    800: { name: "Астарот", hpMult: 20, dmgMult: 3.3, dialogue: "Ад ждёт тебя с распростёртыми объятиями.", enemyStatus: { type: "fire", damage: 10, duration: 4000 }, arenaTypes: [0,1,8,10] },
    850: { name: "Левиафан (Пробуждённый)", hpMult: 24, dmgMult: 2.7, dialogue: "Океан поглотит всё.", enemyStatus: { type: "bleed", value: 0.3 }, arenaTypes: [2,3,5,7] },
    900: { name: "Властелин Молний", hpMult: 18.7, dmgMult: 3.9, dialogue: "Быстрее молнии? Не в этой жизни.", enemyStatus: { type: "shock", chance: 0.6 }, arenaTypes: [1,3,9,10] },
    950: { name: "Жнец Душ", hpMult: 22.7, dmgMult: 3.5, dialogue: "Твоя жизнь... она закончится здесь.", enemyStatus: { type: "poison", damage: 8 }, arenaTypes: [1,5,6,7] },
   1000: { name: "Гол Д. Роджер и Эдвард Ньюгейт", hpMult: 30, dmgMult: 3.0, dialogue: "Мы — легенды прошлого. Покажи, достоин ли ты идти дальше!", isSpecial: true, arenaTypes: [0,1,2,3] },
    1100: { name: "Архидемон Баал", hpMult: 29.3, dmgMult: 3.0, dialogue: "Я сожгу твою душу дотла.", enemyStatus: { type: "fire", damage: 15, duration: 3000 }, arenaTypes: [3,5,7,9,10] },
    1200: { name: "Хранитель Бездны", hpMult: 32, dmgMult: 2.7, dialogue: "Бездна смотрит в тебя... и улыбается.", enemyStatus: { type: "freezeStacks", value: 4 }, arenaTypes: [0,1,2,3,8] },
    1300: { name: "Небесный Страж", hpMult: 28, dmgMult: 3.4, dialogue: "Небеса не простят твоих грехов.", enemyStatus: { type: "blind", value: 4 }, arenaTypes: [4,6,7,10] },
    1400: { name: "Князь Тьмы", hpMult: 34.7, dmgMult: 3.2, dialogue: "Тьма — это не отсутствие света. Это сила.", enemyStatus: { type: "poison", damage: 10 }, arenaTypes: [2,3,6,8,9] },
    1500: { name: "Эрен (Титан-основатель)", hpMult: 37.3, dmgMult: 3.6, dialogue: "Я уничтожу всех... ради свободы.", enemyStatus: { type: "bleed", value: 0.4 }, arenaTypes: [0,1,4,5,8] },
    1600: { name: "Гатс (Берсерк)", hpMult: 40, dmgMult: 4.0, dialogue: "Я буду бороться... до последнего вздоха.", enemyStatus: { type: "bleed", value: 0.5 }, arenaTypes: [1,3,5,7,9] },
    1700: { name: "Драконий Император", hpMult: 38.7, dmgMult: 3.8, dialogue: "Моя чешуя крепче любой брони.", enemyStatus: { type: "fire", damage: 20, duration: 2000 }, arenaTypes: [0,2,5,9,10] },
    1800: { name: "Великий Маг", hpMult: 30.7, dmgMult: 4.5, dialogue: "Магия — это искусство разрушения.", enemyStatus: { type: "shock", chance: 0.7 }, arenaTypes: [1,4,6,7,10] },
    1900: { name: "Луффи (Гир 5)", hpMult: 42.7, dmgMult: 4.2, dialogue: "Я стану Королём Пиратов!", enemyStatus: { type: "blind", value: 3 }, arenaTypes: [0,3,5,8,9] },
    2000: { name: "Омни-Мэн (Пробуждённый)", hpMult: 46.7, dmgMult: 4.6, dialogue: "Подумай, сын! Ты сражаешься на неправильной стороне!", enemyStatus: { type: "bleed", value: 0.5 }, arenaTypes: [4,6,8,9,10] },
    2100: { name: "Сайтама (Серьёзный)", hpMult: 80, dmgMult: 7.0, dialogue: "Ну... я просто честно тренировался.", enemyStatus: { type: "shock", chance: 0.5 }, arenaTypes: [0,2,4,6,8,10] },
    2200: { name: "Король Проклятий (Полный)", hpMult: 50.7, dmgMult: 5.0, dialogue: "Ты даже не достоин быть моей закуской.", enemyStatus: { type: "poison", damage: 12 }, arenaTypes: [1,3,5,7,9,10] },
    2300: { name: "Бог Гароу", hpMult: 54.7, dmgMult: 5.4, dialogue: "Я — абсолютное зло. И я уничтожу всё.", enemyStatus: { type: "fire", damage: 25, duration: 1500 }, arenaTypes: [2,4,6,8,9,10] },
    2400: { name: "Зено (Рассерженный)", hpMult: 63.3, dmgMult: 6.0, dialogue: "Ты... ты меня разозлил.", enemyStatus: { type: "oneshot", chance: 0.05 }, arenaTypes: [0,3,6,7,8,9] },
    2500: { name: "Анти-Спираль (Финальная форма)", hpMult: 73.3, dmgMult: 6.5, dialogue: "Отчаяние... это всё что у тебя осталось.", enemyStatus: { type: "freezeStacks", value: 6 }, arenaTypes: [0,1,2,4,6,8,9] },
    2600: { name: "Деку (1.000.000%)", hpMult: 66.7, dmgMult: 6.8, dialogue: "Я передам эстафету... ВСЕМ!", enemyStatus: { type: "shock", chance: 0.8 }, arenaTypes: [1,3,5,7,9] },
    2700: { name: "Имир (Прародитель)", hpMult: 83.3, dmgMult: 6.3, dialogue: "Я прожила 2000 лет... и всё ради этого.", enemyStatus: { type: "bleed", value: 0.6 }, arenaTypes: [0,2,4,6,8] },
    2800: { name: "Властелин Времени", hpMult: 60, dmgMult: 7.5, dialogue: "Время... оно течёт только в одном направлении.", enemyStatus: { type: "blind", value: 5 }, arenaTypes: [3,5,7,9,10] },
    2900: { name: "Архитектор Реальности", hpMult: 72, dmgMult: 7.3, dialogue: "Я создал этот мир... и я могу его уничтожить.", enemyStatus: { type: "poison", damage: 15 }, arenaTypes: [0,1,4,6,8,10] },
    3000: { name: "Хоумлендер (Безудержный)", hpMult: 80, dmgMult: 8.0, dialogue: "Я — единственный бог в этом мире.", enemyStatus: { type: "fire", damage: 30, duration: 1000 }, arenaTypes: [2,5,8,9,10] },
    3200: { name: "Всеотец Один", hpMult: 93.3, dmgMult: 7.5, dialogue: "Мудрость... вот что побеждает силу.", enemyStatus: { type: "shock", chance: 0.9 }, arenaTypes: [0,3,5,7,9] },
    3400: { name: "Феникс Возрождённый", hpMult: 106.7, dmgMult: 7.0, dialogue: "Из пепла я восстану снова и снова!", enemyStatus: { type: "fire", damage: 35, duration: 800 }, arenaTypes: [1,4,6,8,10] },
    3600: { name: "Тёмный Рыцарь", hpMult: 116.7, dmgMult: 8.5, dialogue: "Я — возмездие. Я — ночь.", enemyStatus: { type: "bleed", value: 0.7 }, arenaTypes: [0,2,5,7,9,10] },
    3800: { name: "Разрушитель Миров", hpMult: 126.7, dmgMult: 9.3, dialogue: "Я уничтожил сотни миров. Твой будет последним.", enemyStatus: { type: "oneshot", chance: 0.03 }, arenaTypes: [1,3,6,8,9,10] },
    4000: { name: "Бог-Император", hpMult: 140, dmgMult: 10.0, dialogue: "Склонись... или умри стоя.", enemyStatus: { type: "freezeStacks", value: 8 }, arenaTypes: [0,1,2,3,4,5,6,7,8,9,10] },
    4200: { name: "Абсолютное Ничто", hpMult: 160, dmgMult: 9.0, dialogue: "...............", enemyStatus: { type: "blind", value: 6 }, arenaTypes: [6,7,8,9,10] },
    4400: { name: "Хранитель Врат", hpMult: 153.3, dmgMult: 11.0, dialogue: "За мной — бесконечность. Ты не пройдёшь.", enemyStatus: { type: "shock", chance: 1.0 }, arenaTypes: [0,2,4,6,8,10] },
    4600: { name: "Судья Душ", hpMult: 173.3, dmgMult: 12.0, dialogue: "Твоя душа взвешена... и признана недостойной.", enemyStatus: { type: "poison", damage: 20 }, arenaTypes: [1,3,5,7,9,10] },
    4800: { name: "Король-Звезда", hpMult: 186.7, dmgMult: 13.0, dialogue: "Я зажгу сверхновую... прямо здесь.", enemyStatus: { type: "fire", damage: 40, duration: 500 }, arenaTypes: [0,1,4,6,8,9,10] },
    5000: { name: "Предвестник Конца", hpMult: 206.7, dmgMult: 15.0, dialogue: "Конец... это только начало.", enemyStatus: { type: "oneshot", chance: 0.1 }, arenaTypes: [0,1,2,3,4,5,6,7,8,9,10] },
    10000: { name: "Охотник за головами (Финальная форма)", hpMult: 36.7, dmgMult: 2.5, dialogue: "Хах, пока вас не было я тренировался целыми днями ради этого момента! Теперь за вашу голову готовы отдать 100.000 тенге!", hasDialog: true, arenaTypes: [0,1,2,3,4,5,6,7,8,9,10] }
};
const finalBossResponses = [
    { text: "100.000 тенге? Это сколько? 10 копеек?", response: "Незнаю... Просто много ноликов и вот я подумал, что это много....", mood: "😅" },
    { text: "Ты серьёзно? Я думал ты сильнее стал.", response: "Я СТАЛ СИЛЬНЕЕ! Просто... инфляция...", mood: "😤" },
    { text: "Может договоримся?", response: "Договоримся? После всего что было? НЕТ!", mood: "💢" }
];

// ========== КОНСТАНТЫ ==========
const totalTemplatesCount = Object.values(customCardTemplates).flat().length;
const rarities = ["Обычная","Редкая","Сверх редкая","Эпик","Мифическая","Легендарная","Секретная","Эволюционная","Босс","Пасхалка"];
const rarityColors = { "Обычная":"common","Редкая":"rare","Сверх редкая":"superrare","Эпик":"epic","Мифическая":"mythic","Легендарная":"legendary","Секретная":"secret","Эволюционная":"evolutionary","Босс":"boss-rarity","Пасхалка":"easter","Подарочная":"gift" };
const cardStats = { 
    "Обычная":      { damage: 3,  hp: 5,  sellPrice: 20,  speed: 0.4 },
    "Редкая":       { damage: 6,  hp: 10, sellPrice: 45,  speed: 0.6 },
    "Сверх редкая": { damage: 12, hp: 20, sellPrice: 90,  speed: 0.8 },
    "Эпик":         { damage: 20, hp: 35, sellPrice: 150, speed: 1.0 },
    "Мифическая":   { damage: 35, hp: 60, sellPrice: 260, speed: 1.2 },
    "Легендарная":  { damage: 60, hp: 100, sellPrice: 450, speed: 1.5 },
    "Секретная":    { damage: 100, hp: 180, sellPrice: 800, speed: 2.0 },
    "Подарочная":   { damage: 100, hp: 180, sellPrice: 0,   speed: 3.0 },
    "Эволюционная": { damage: 500, hp: 1000, sellPrice: 0,  speed: 1.8 },
    "Босс":         { damage: 80,  hp: 150, sellPrice: 1000, speed: 1.1 },
    "Пасхалка":     { damage: 10,  hp: 20,  sellPrice: 0,   speed: 1.0 }
};
let cardWeights = { "Обычная":45,"Редкая":25,"Сверх редкая":12,"Эпик":8,"Мифическая":5,"Легендарная":3,"Секретная":1.5,"Эволюционная":0.0001,"Босс":0 };
const enemyNames = ["Эльф-лучник","Голем","Орк-берсерк","Слизь-убийца","Гоблин-шаман","Скелет-воин","Тёмный маг","Вампир-князь","Драконий прихвостень","Лесной дух","Кровавый берсерк","Ледяной элементаль"];
const enemyStatusPool = [null, null, null, { type: "freezeStacks", value: 1 }, { type: "bleed", value: 0.1 }, { type: "shock", chance: 0.1 }];
const shopItemsPool = { common: [{ name: "Обычная карта", type: "card", rarity: "Обычная", cost: 25 }, { name: "Зелье урона x1.3", type: "buff", buffId: "dmg13", duration: 7200000, cost: 150 }], rare: [{ name: "Редкая карта", type: "card", rarity: "Редкая", cost: 55 }, { name: "Зелье удачи", type: "buff", buffId: "luck13", duration: 7200000, cost: 150 }], epic: [{ name: "Эпик карта", type: "card", rarity: "Эпик", cost: 180 }, { name: "Зелье урона x2", type: "buff", buffId: "doubleDamage", duration: 14400000, cost: 800 }] };
const specialPotions = [{ name: "🧪 Зелье урона x4", desc: "12 часов", buffId: "quadDamage", duration: 43200000, cost: 3000 }, { name: "🧪 Зелье звёзд x2", desc: "6 часов", buffId: "doubleStars", duration: 21600000, cost: 5000 }, { name: "🧪 Зелье HP x3", desc: "4 часа", buffId: "tripleHp", duration: 14400000, cost: 2000 }];
const bulkSellOptions = [{ name: "Обычные", rarity: "Обычная" }, { name: "Редкие", rarity: "Редкая" }, { name: "Сверхредкие", rarity: "Сверх редкая" }, { name: "Эпики", rarity: "Эпик" }, { name: "Мифические", rarity: "Мифическая" }, { name: "Легендарные", rarity: "Легендарная" }];
const autoRestOptions = [{ name: "90%", threshold: 90 }, { name: "80%", threshold: 80 }, { name: "70%", threshold: 70 }, { name: "60%", threshold: 60 }, { name: "50%", threshold: 50 }, { name: "40%", threshold: 40 }, { name: "35%", threshold: 35 }, { name: "30%", threshold: 30 }, { name: "25%", threshold: 25 }, { name: "20%", threshold: 20 }, { name: "15%", threshold: 15 }, { name: "10%", threshold: 10 }, { name: "5%", threshold: 5 }, { name: "1%", threshold: 1 }];

// ========== КОДЫ (промокоды) ==========
const codeList = {
    "PELMESHKA": { type: "card", rarity: "Пасхалка", tpl: "Пельмешка", points: 1000 },
    "Хочу Звезды": { type: "points", amount: 5000 },
    "Сила": { type: "buff", buffId: "dmg13", duration: 86400000 },
    "СОСИ СЛАВА": { type: "moderUnlock" },
    "DrinkTea2Win": { type: "card", rarity: "Пасхалка", tpl: "DrinkTea2Win", points: 0 }
};

const worldMusicNotes = {};
