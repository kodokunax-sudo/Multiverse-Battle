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
        { name: "Луффи", universe: "One Piece", damage: 4, hp: 8, speed: 0.6, desc: "Базовый Луффи. Никаких способностей, просто бьёт.",
            masteryTitle: "Не по одному, я резиновый", masteryTitleId: "mastery_character_d0f6ddc9", masteryTitleIcon: "✦" },
        { name: "Усопп", universe: "One Piece", damage: 3, hp: 6, speed: 0.4, desc: "Трусливый снайпер. Без способностей.",
            masteryTitle: "Снайпер", masteryTitleId: "mastery_character_9e346493", masteryTitleIcon: "✦" },
        { name: "Нами", universe: "One Piece", damage: 2, hp: 8, speed: 0.5, desc: "Навигатор. Без способностей.",
            masteryTitle: "Вор", masteryTitleId: "mastery_character_9808410c", masteryTitleIcon: "✦" },
        { name: "Ездок", universe: "OPM", damage: 1, hp: 11, speed: 0.3, desc: "Герой класса С. Много HP.",
            masteryTitle: "СИЛЬНЕЙШИЙ ГЕРОЙ", masteryTitleId: "mastery_character_de506a67", masteryTitleIcon: "✦" },
        { name: "Деку (безпричудный)", universe: "MHA", damage: 2, hp: 12, speed: 0.5, ability: { type: "desperateStrike", value: 0.05, threshold: 0.30, desc: "+5% урона при HP ниже 30%" }, desc: "Без причуды, но мечтающий стать героем. Разве не глупо? В критический момент помогает команде наносить больше урона.",
            masteryTitle: "У меня нет будущего", masteryTitleId: "mastery_character_96f4c2ef", masteryTitleIcon: "✦" },
        { name: "Консперон (обычный)", universe: "Dandadan", damage: 4, hp: 5, speed: 0.7, desc: "ИНОПЛОНЕТЯНЫ СУЩЕСТВУЮТ!!!!!",
            masteryTitle: "Посланник зелёных человечков", masteryTitleId: "mastery_character_a0558461", masteryTitleIcon: "✦" },
        { name: "Танджиро", universe: "DS", damage: 3, hp: 10, speed: 0.5, desc: "Охотник на демонов.",
            masteryTitle: "Если я умру, то покажите мой грустный флешбек", masteryTitleId: "mastery_character_d9e8e302", masteryTitleIcon: "✦" },
        { name: "Уборщик Коби", universe: "One piece", damage: 1, hp: 1, speed: 0.1, desc: "Самый слабый персонаж. С него всё начиналось.",
            masteryTitle: "Бог швабр", masteryTitleId: "mastery_character_319d7b5d", masteryTitleIcon: "✦" },
        { name: "Аста", universe: "Black Clover", damage: 3, hp: 8, speed: 0.6, desc: "Маг без магии с анти-мечом.",
            masteryTitle: "Король антимагии", masteryTitleId: "mastery_character_8e145eb8", masteryTitleIcon: "✦" },
        { name: "Хьюи (слабый)", universe: "The Boys", damage: 2, hp: 10, speed: 0.4, desc: "Парень, чью девушку сбил А Train.",
            masteryTitle: "Парень. Да, он", masteryTitleId: "mastery_character_f41f6e34", masteryTitleIcon: "✦" },
        { name: "Френчи", universe: "The Boys", damage: 4, hp: 6, speed: 0.5, desc: "Оружейник и спецназовец.",
            masteryTitle: "Француз", masteryTitleId: "mastery_character_54ffd2b4", masteryTitleIcon: "✦" },
        { name: "Дональд", universe: "Invincible", damage: 3, hp: 9, speed: 0.4, desc: "К счастью это не Дональд Трамп....",
            masteryTitle: "Дональд Трамп", masteryTitleId: "mastery_character_9c41001b", masteryTitleIcon: "✦" },
        {
            "name": "Поко",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 2,
            "hp": 7,
            "speed": 0.4,
            "desc": "Мальчик из первой части, который помогает Джонатану найти дорогу и преодолеть страх.",
            masteryTitle: "Маленкьйи и черный", masteryTitleId: "mastery_character_9183d180", masteryTitleIcon: "✦"
        },
        {
            "name": "Дэнни (пёс Джонатана)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 3,
            "hp": 9,
            "speed": 0.45,
            "desc": "Преданный пёс Джонатана. Одна из самых запоминающихся частей его детства.",
            masteryTitle: "Собака", masteryTitleId: "mastery_character_00b89ba0", masteryTitleIcon: "✦"
        },
        {
            "name": "Эрина Пендлтон (юность)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 2,
            "hp": 10,
            "speed": 0.4,
            "ability": {
                "type": "healOnWin",
                "percent": 0.01,
                "desc": "+1% HP после победы"
            },
            "desc": "Подруга детства Джонатана. Не боец, но её поддержка помогает пережить следующий бой.",
            masteryTitle: "Жду принца на белом коне", masteryTitleId: "mastery_character_b093031f", masteryTitleIcon: "✦"
        }
    ],
    "Редкая": [
        { name: "Брук", universe: "One Piece", damage: 7, hp: 12, speed: 0.9, desc: "Скелет-музыкант. Йохохо!",
            masteryTitle: "Музыкант холодного ада", masteryTitleId: "mastery_character_b841843d", masteryTitleIcon: "✦" },
        { name: "Иноске", universe: "DS", damage: 9, hp: 15, speed: 1.0, desc: "Человек-кабан с двумя мечами.",
            masteryTitle: "Клыки горного кабана", masteryTitleId: "mastery_character_846e91ea", masteryTitleIcon: "✦" },
        { name: "Киллуа", universe: "HxH", damage: 10, hp: 13, speed: 1.3, desc: "Молниеносный ассасин семьи Золдик.",
            masteryTitle: "Молния дома Золдик", masteryTitleId: "mastery_character_160eb926", masteryTitleIcon: "✦" },
        { name: "Рейген", universe: "Mob 100", damage: 4, hp: 25, speed: 0.5, desc: "Великий экстрасенс XXI века (нет).",
            masteryTitle: "Величайший экстрасенс (по собственному мнению)", masteryTitleId: "mastery_character_911d15b8", masteryTitleIcon: "✦" },
        { name: "Марк (начало)", universe: "Invincible", damage: 8, hp: 18, speed: 0.8, desc: "Сын Омни-Мэна. Только получил силы.",
            masteryTitle: "Наследник Вилтрума", masteryTitleId: "mastery_character_008cb5e3", masteryTitleIcon: "✦" },
        { name: "ММ (Марвин)", universe: "The Boys", damage: 7, hp: 20, speed: 0.6, desc: "Лидер команды Пацаны. Тактик.",
            masteryTitle: "Я соглашался не на такое...", masteryTitleId: "mastery_character_45f129f7", masteryTitleIcon: "✦" },
        { name: "Кимико (начало)", universe: "The Boys", damage: 9, hp: 14, speed: 0.9, desc: "Немая убийца с супер-регенерацией.",
            masteryTitle: "Неукротимое исцеление", masteryTitleId: "mastery_character_001d3777", masteryTitleIcon: "✦" },
        { name: "Ева Уилкинс", universe: "Invincible", damage: 6, hp: 22, speed: 0.7, desc: "Девушка-герой с левитацией.",
            masteryTitle: "Розовая", masteryTitleId: "mastery_character_126af18a", masteryTitleIcon: "✦" },
        {"name":"Тони Тони Чоппер","universe":"One Piece","patchId":"one_piece","damage":8,"hp":20,"speed":0.7,"ability":{"type":"healOnWin","percent":0.02,"desc":"+2% HP после победы"},"desc":"Доктор команды Мугивар. Его медицинские знания помогают отряду восстановиться после боя.",
            masteryTitle: "Награда за голову 50 бейли", masteryTitleId: "mastery_character_33b1cf91", masteryTitleIcon: "✦"},
        {"name":"Нефертари Виви","universe":"One Piece","patchId":"one_piece","damage":7,"hp":18,"speed":0.7,"ability":{"type":"damageAura","value":0.03,"desc":"+3% урона команде"},"desc":"Принцесса Алабасты и союзница пиратов. Поддерживает команду храбростью и тактикой.",
            masteryTitle: "Принцесса", masteryTitleId: "mastery_character_169c2312", masteryTitleIcon: "✦"},
        {"name":"Бон Клей (Мистер 2)","universe":"One Piece","patchId":"one_piece","damage":12,"hp":15,"speed":1,"ability":{"type":"damageMultChance","chance":0.12,"mult":1.2,"desc":"12% шанс нанести ×1,2 урона"},"desc":"Мастер маскировки и стремительных ударов, который всегда сражается за друзей.",
            masteryTitle: "Король дружбы и маскировки", masteryTitleId: "mastery_character_121b1a35", masteryTitleIcon: "✦"},
        {"name":"Гальдино (Мистер 3)","universe":"One Piece","patchId":"one_piece","damage":9,"hp":22,"speed":0.55,"ability":{"type":"damageReduction","value":0.03,"desc":"−3% получаемого урона"},"desc":"Хитрый мастер воска. Создаёт защитные конструкции и ловушки.",
            masteryTitle: "Белая штука", masteryTitleId: "mastery_character_eb729048", masteryTitleIcon: "✦"},
        {"name":"Фокси","universe":"One Piece","patchId":"one_piece","damage":6,"hp":15,"speed":0.55,"statusAbility":{"type":"freezeStacks","value":1,"desc":"Замедление: +1 клик до контратаки"},"desc":"Капитан Пиратов Фокси использует силу замедляющего фрукта, чтобы сбивать темп противника.",
            masteryTitle: "Ненавижу эту арку", masteryTitleId: "mastery_character_4795ce8e", masteryTitleIcon: "✦"},
        { name: "Бесправный Ездок на велосипеде", universe: "OPM", patchId: "one_punch_man", damage: 6, hp: 22, speed: 0.6, ability: { type: "desperateStrike", value: 0.06, threshold: 0.30, desc: "+6% урона при HP ниже 30%" }, desc: "Герой класса C, который не отступает даже перед заведомо более сильным врагом. Когда здоровье команды падает ниже 30%, его решимость усиливает общий урон.",
            masteryTitle: "Типо круто", masteryTitleId: "mastery_character_f3231cde", masteryTitleIcon: "✦" },
        { name: "Кинг (без шрама)", universe: "OPM", patchId: "one_punch_man", damage: 4, hp: 18, speed: 0.45, ability: { type: "desperateStrike", value: 0.05, threshold: 0.30, desc: "+5% урона при HP ниже 30%" }, desc: "Его легендарная аура усиливает урон команды, когда здоровье падает ниже 30%.",
            masteryTitle: "Герой, которого боятся чудовища", masteryTitleId: "mastery_character_a5268849", masteryTitleIcon: "✦" },
        {
            "name": "Роберт Э. О. Спидвагон",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 8,
            "hp": 17,
            "speed": 0.7,
            "desc": "Бывший уличный боец, ставший верным союзником Джонатана и основателем фонда Спидвагонов.",
            masteryTitle: "Буду стоять в АФК и рассказать все что происходит", masteryTitleId: "mastery_character_d3a97fac", masteryTitleIcon: "✦"
        },
        {
            "name": "Игги (The Fool)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 11,
            "hp": 16,
            "speed": 1.2,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.08,
                "mult": 1.25,
                "desc": "8% шанс нанести ×1,25 урона"
            },
            "desc": "Упрямый пёс-стенд-юзер. The Fool позволяет ему создавать конструкции из песка. Стенд: The Fool. Способность стенда: Песчаный щит: большой запас защиты. Бафф при призыве: скорость +8%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 72% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — The Fool", desc: "Нажми SUPER, чтобы призвать The Fool как отдельное хитбокс-сердечко. Песчаный щит: большой запас защиты. Бафф: скорость +8%; хитбокс радиусом 12 принимает на себя 72% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Та же собака, но с стендом", masteryTitleId: "mastery_character_e8b4eabd", masteryTitleIcon: "✦"},
        {
            "name": "Бруфорд",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 10,
            "hp": 22,
            "speed": 0.65,
            "ability": {
                "type": "damageReduction",
                "value": 0.03,
                "desc": "−3% получаемого урона"
            },
            "desc": "Рыцарь-зомби с длинными волосами, которыми он может связывать противников.",
            masteryTitle: "Зомби с волосами", masteryTitleId: "mastery_character_7f9aa2a3", masteryTitleIcon: "✦"
        },
        {
            "name": "Таркус",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 12,
            "hp": 25,
            "speed": 0.6,
            "desc": "Могучий рыцарь, превращённый в жестокого зомби.",
            masteryTitle: "Большой", masteryTitleId: "mastery_character_60d012a9", masteryTitleIcon: "✦"
        },
        {
            "name": "Маунтин Тим",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 12,
            "hp": 20,
            "speed": 0.9,
            "ability": {
                "type": "critChance",
                "value": 0.05,
                "desc": "+5% шанс критического удара"
            },
            "desc": "Охотник за головами из Steel Ball Run, использующий верёвку для атак и передвижения. Стенд: Oh! Lonesome Me. Способность стенда: Лассо: средний радиус перехвата. Бафф при призыве: скорость +13%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 66% урона; на обычной арене получаемый урон снижен на 4% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Oh! Lonesome Me", desc: "Нажми SUPER, чтобы призвать Oh! Lonesome Me как отдельное хитбокс-сердечко. Лассо: средний радиус перехвата. Бафф: скорость +13%; хитбокс радиусом 10 принимает на себя 66% урона при столкновении; на обычной арене получаемый урон снижается на 4%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Ковбой с длинными волосами", masteryTitleId: "mastery_character_e1404698", masteryTitleIcon: "✦"},
        {
            "name": "Шигекиё Янгу (Шигечи)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 10,
            "hp": 23,
            "speed": 0.65,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.08,
                "mult": 1.2,
                "desc": "8% шанс нанести ×1,2 урона"
            },
            "desc": "Школьник со стендом Harvest, который действует сразу множеством крошечных помощников. Стенд: Harvest. Способность стенда: Рой Harvest: самый широкий хитбокс. Бафф при призыве: скорость +6%; хитбокс-сердечко радиусом 14 перехватывает атаки и принимает на себя 69% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Harvest", desc: "Нажми SUPER, чтобы призвать Harvest как отдельное хитбокс-сердечко. Рой Harvest: самый широкий хитбокс. Бафф: скорость +6%; хитбокс радиусом 14 принимает на себя 69% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Я выйграю в лотерей", masteryTitleId: "mastery_character_62247556", masteryTitleIcon: "✦"},
        {
            "name": "Димпл (слабая форма)",
            "universe": "Mob 100",
            "damage": 7,
            "hp": 13,
            "speed": 0.75,
            "desc": "Дух Димпл в ранней форме. Может летать и влиять на людей, но в прямом бою слаб.",
            masteryTitle: "Дух с планом мирового захвата", masteryTitleId: "mastery_character_b4b90010", masteryTitleIcon: "✦"
        },
        {
            "name": "Рицу Кагеяма",
            "universe": "Mob 100",
            "damage": 8,
            "hp": 15,
            "speed": 0.8,
            "desc": "Младший брат Моба. Его экстрасенсорные способности пробуждаются постепенно.",
            masteryTitle: "Брат экстрасенса", masteryTitleId: "mastery_character_11fc9715", masteryTitleIcon: "✦"
        },
        {
            "name": "Соломон (Vermeil in Gold)",
            "universe": "Vermeil in Gold",
            "damage": 8,
            "hp": 16,
            "speed": 0.75,
            "desc": "Ученик академии магии, который полагается на заклинания и знания, а не на грубую силу.",
            masteryTitle: "Ученик, связавший судьбу с демоном", masteryTitleId: "mastery_character_eeb7360c", masteryTitleIcon: "✦"
        }
    ],
    "Сверх редкая": [
        { name: "Луффи (2 гир)", universe: "One Piece", damage: 16, hp: 25, speed: 1.5, desc: "Ускоренный кровоток. Быстрее и сильнее.",
            masteryTitle: "Я скорость!", masteryTitleId: "mastery_character_c3146213", masteryTitleIcon: "✦" },
        { name: "Зоро (до таймскипа)", universe: "One Piece", damage: 18, hp: 22, speed: 1.1, desc: "Зоро, чтоб не заблудиться,\nК нитке вздумал прицепиться.\nНить порвалась — он улетел\nИ в кастрюлю к Санджи прилетел.",
            masteryTitle: "Голова-трава", masteryTitleId: "mastery_character_7f036b9e", masteryTitleIcon: "✦" },
        { name: "Санджи (до таймскипа)", universe: "One Piece", damage: 16, hp: 20, speed: 1.3, desc: "Чёрная нога. Шеф-повар.",
            masteryTitle: "Любитель женщин", masteryTitleId: "mastery_character_e1106341", masteryTitleIcon: "✦" },
        { name: "Гаара", universe: "Naruto", damage: 17, hp: 28, speed: 0.9, desc: "Джинчурики с песчаной бронёй.",
            masteryTitle: "Люблю только себя", masteryTitleId: "mastery_character_ad620a92", masteryTitleIcon: "✦" },
        { name: "Имир", universe: "AoT", damage: 25, hp: 10, speed: 1.4, desc: "Солдат разведкорпуса.",
            masteryTitle: "Мигрантка", masteryTitleId: "mastery_character_9eea8654", masteryTitleIcon: "✦" },
        { name: "Эрен (Кадет)", universe: "AoT", damage: 27, hp: 10, speed: 1.2, desc: "Кадет с жаждой мести титанам.",
            masteryTitle: "По своей воле пошел мобелизироваться", masteryTitleId: "mastery_character_3959a942", masteryTitleIcon: "✦" },
        { name: "Коби (Солдат)", universe: "One Piece", damage: 15, hp: 30, speed: 0.8, desc: "Доказывает, что слабый может стать сильным.",
            masteryTitle: "Из грязи в князи", masteryTitleId: "mastery_character_fc4a78a5", masteryTitleIcon: "✦" },
        { name: "Ренджи", universe: "Bleach", damage: 15, hp: 25, speed: 1.0, desc: "Шинигами с мечом-хлыстом.",
            masteryTitle: "Забимару, пожиратель небес", masteryTitleId: "mastery_character_ba4e4d31", masteryTitleIcon: "✦" },
        { name: "Киришима", universe: "MHA", damage: 13, hp: 35, speed: 0.7, desc: "Красный бунтарь. Твердеет кожей.",
            masteryTitle: "Я уже красный. По хорошему не получится", masteryTitleId: "mastery_character_914d2833", masteryTitleIcon: "✦" },
        { name: "Райан (Ребенок)", universe: "The Boys", damage: 20, hp: 25, speed: 1.1, desc: "Сын Хоумлендера. Ещё учится.",
            masteryTitle: "Кто мой отец?", masteryTitleId: "mastery_character_0098ea54", masteryTitleIcon: "✦" },
        { name: "Рекс Слоан", universe: "Invincible", damage: 18, hp: 28, speed: 1.0, desc: "Взрывной герой-подросток.",
            masteryTitle: "Дам надежду и сразу же сдохну", masteryTitleId: "mastery_character_06629fda", masteryTitleIcon: "✦" },
        { name: "Дупли-Кейт", universe: "Invincible", damage: 15, hp: 20, speed: 1.2, desc: "Множится на клонов.",
            masteryTitle: "Удваюваюсь", masteryTitleId: "mastery_character_0139f65f", masteryTitleIcon: "✦" },
        { name: "Пучино", universe: "The Boys", damage: 17, hp: 26, speed: 0.8, desc: "Подводный герой. Любит рыбу.",
            masteryTitle: "Любитель рыб", masteryTitleId: "mastery_character_849d64d3", masteryTitleIcon: "✦" },
        { name: "Мреющий", universe: "The Boys", damage: 9, hp: 40, speed: 0.6, desc: "Невидимый шпион Семёрки.",
            masteryTitle: "Хожу без одежды", masteryTitleId: "mastery_character_bb9464e2", masteryTitleIcon: "✦" },
        {"name":"Фрэнки","universe":"One Piece","patchId":"one_piece","damage":20,"hp":32,"speed":1,"ability":{"type":"bossDamage","value":0.05,"desc":"+5% урона боссам"},"desc":"Киборг-кораблестроитель. Мощные механические руки и оружие особенно эффективны против крупных врагов.",
            masteryTitle: "SUPE-E-E-E-E-E-RRRRRR", masteryTitleId: "mastery_character_f76286d9", masteryTitleIcon: "✦"},
        {"name":"Нико Робин","universe":"One Piece","patchId":"one_piece","damage":20,"hp":31,"speed":1,"ability":{"type":"damageMultChance","chance":0.12,"mult":1.25,"desc":"12% шанс нанести ×1,25 урона"},"desc":"Археолог с силой цветочного фрукта: может создавать руки и конечности прямо на противнике.",
            masteryTitle: "Сколько рук?", masteryTitleId: "mastery_character_a798e3c2", masteryTitleIcon: "✦"},
        {"name":"Джимбей (Флешбек)","universe":"One Piece","patchId":"one_piece","damage":20,"hp":38,"speed":0.8,"ability":{"type":"damageReduction","value":0.07,"desc":"−7% получаемого урона"},"desc":"Мастер рыбочеловеческого каратэ. Выдерживает тяжёлые удары и уверенно держит оборону.",
            masteryTitle: "Толстая рыба, которая дышит на суше", masteryTitleId: "mastery_character_f1ac999b", masteryTitleIcon: "✦"},
        {"name":"Смокер","universe":"One Piece","patchId":"one_piece","damage":22,"hp":30,"speed":1.15,"statusAbility":{"type":"freezeStacks","value":1,"desc":"Дымовая ловушка: +1 клик до контратаки"},"desc":"Морской дозорный с дымовым логиа-фруктом. Связывает противника клубами дыма.",
            masteryTitle: "Любитель покурить", masteryTitleId: "mastery_character_0753502d", masteryTitleIcon: "✦"},
        {"name":"Ташиги","universe":"One Piece","patchId":"one_piece","damage":17,"hp":25,"speed":1.15,"ability":{"type":"critChance","value":0.05,"desc":"+5% шанс критического удара"},"desc":"Офицер морского дозора и искусный фехтовальщик. Находит слабые места противника.",
            masteryTitle: "Женщины не добьются больших успех", masteryTitleId: "mastery_character_b24f5fac", masteryTitleIcon: "✦"},
        {"name":"Бартоломео","universe":"One Piece","patchId":"one_piece","damage":15,"hp":42,"speed":0.7,"ability":{"type":"damageReduction","value":0.1,"desc":"−10% получаемого урона"},"desc":"Преданный фанат Луффи. Барьерный фрукт позволяет ему выдерживать сильные атаки.",
            masteryTitle: "Стена для своих", masteryTitleId: "mastery_character_1c9b60b8", masteryTitleIcon: "✦"},
        {"name":"Кавендиш","universe":"One Piece","patchId":"one_piece","damage":23,"hp":25,"speed":1.35,"ability":{"type":"critChance","value":0.08,"desc":"+8% шанс критического удара"},"desc":"Быстрый и эффектный фехтовальщик. В атаке полагается на скорость и точность.",
            masteryTitle: "Дай поспать...", masteryTitleId: "mastery_character_e0836c1f", masteryTitleIcon: "✦"},
        {"name":"Бепо","universe":"One Piece","patchId":"one_piece","damage":18,"hp":34,"speed":1.05,"ability":{"type":"damageReduction","value":0.06,"desc":"−6% получаемого урона"},"desc":"Навигатор Сердечных пиратов и сильный боец-минк, особенно опасный в ближнем бою.",
            masteryTitle: "Разумный", masteryTitleId: "mastery_character_c5b2d466", masteryTitleIcon: "✦"},
        {"name":"Кинъэмон","universe":"One Piece","patchId":"one_piece","damage":21,"hp":33,"speed":1,"statusAbility":{"type":"fire","damage":4,"duration":2500,"desc":"Стиль лисьего огня: 4 урона в секунду"},"desc":"Самурай Вано, владеющий стилем лисьего огня и умеющий рассекать пламя.",
            masteryTitle: "Прямо как ниндзя", masteryTitleId: "mastery_character_33b91d74", masteryTitleIcon: "✦"},
        {"name":"Арлонг","universe":"One Piece","patchId":"one_piece","damage":32,"hp":45,"speed":1.1,"ability":{"type":"damageReduction","value":0.06,"desc":"−6% получаемого урона"},"desc":"Жестокий рыбочеловек с огромной физической силой и мощной челюстью.",
            masteryTitle: "Ты хоть видел мой нос?", masteryTitleId: "mastery_character_e0e2bb18", masteryTitleIcon: "✦"},
        { name: "Фубуки", universe: "OPM", patchId: "one_punch_man", damage: 18, hp: 34, speed: 0.95, ability: { type: "damageAura", value: 0.03, desc: "+3% урона всей команде" }, desc: "Лидер группы Blizzard. Её телекинез и умение руководить союзниками дают небольшой бонус всему отряду.",
            masteryTitle: "Я раздавлю тебя", masteryTitleId: "mastery_character_3a30f492", masteryTitleIcon: "✦" },
        { name: "Император Дитя", universe: "OPM", patchId: "one_punch_man", damage: 19, hp: 30, speed: 1.0, ability: { type: "critChance", value: 0.04, desc: "+4% к шансу критического удара" }, desc: "Юный S-класс герой, полагающийся на интеллект, гаджеты и точечные удары по слабым местам.",
            masteryTitle: "Гений детского S-класса", masteryTitleId: "mastery_character_2681d666", masteryTitleIcon: "✦" },
        { name: "Узник Пури-Пури", universe: "OPM", patchId: "one_punch_man", damage: 20, hp: 40, speed: 0.8, ability: { type: "damageReduction", value: 0.03, desc: "−3% получаемого урона" }, desc: "Герой S-класса с огромной физической силой и стойкостью. Хорошо держит удар, но не относится к верхушке рейтинга.",
            masteryTitle: "Ангел тюрьмы", masteryTitleId: "mastery_character_6131399f", masteryTitleIcon: "✦" },
        {
            "name": "Уилл Антонио Цеппели",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 19,
            "hp": 31,
            "speed": 1,
            "ability": {
                "type": "damageAura",
                "value": 0.03,
                "desc": "+3% урона команде"
            },
            "desc": "Наставник Джонатана, обучающий его Хамону.",
            masteryTitle: "Наставник хамона", masteryTitleId: "mastery_character_5e8e6ae5", masteryTitleIcon: "✦"
        },
        {
            "name": "Рудол фон Штрохайм (киборг)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 22,
            "hp": 34,
            "speed": 0.8,
            "ability": {
                "type": "damageReduction",
                "value": 0.04,
                "desc": "−4% получаемого урона"
            },
            "desc": "Немецкий офицер, усиленный механическими имплантами и мощным оружием.",
            masteryTitle: "Фашист", masteryTitleId: "mastery_character_4823c9d1", masteryTitleIcon: "✦"
        },
        {
            "name": "Хол Хорс (Emperor)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 21,
            "hp": 28,
            "speed": 1.1,
            "ability": {
                "type": "critChance",
                "value": 0.08,
                "desc": "+8% шанс критического удара"
            },
            "desc": "Стрелок, чей стенд Emperor создаёт управляемые пули. Стенд: Emperor. Способность стенда: Точная стрельба: упор на скорость. Бафф при призыве: скорость +17%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 64% урона; на обычной арене получаемый урон снижен на 3% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Emperor", desc: "Нажми SUPER, чтобы призвать Emperor как отдельное хитбокс-сердечко. Точная стрельба: упор на скорость. Бафф: скорость +17%; хитбокс радиусом 10 принимает на себя 64% урона при столкновении; на обычной арене получаемый урон снижается на 3%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Смешно", masteryTitleId: "mastery_character_6110e4e2", masteryTitleIcon: "✦"},
        {
            "name": "Н'Дул (Geb)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 22,
            "hp": 29,
            "speed": 0.85,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.3,
                "desc": "10% шанс нанести ×1,3 урона"
            },
            "desc": "Слепой пользователь Geb, управляющий водой с опасной точностью. Стенд: Geb. Способность стенда: Водяной щит: сильное поглощение урона. Бафф при призыве: скорость +4%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 78% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Geb", desc: "Нажми SUPER, чтобы призвать Geb как отдельное хитбокс-сердечко. Водяной щит: сильное поглощение урона. Бафф: скорость +4%; хитбокс радиусом 13 принимает на себя 78% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Управляю водой", masteryTitleId: "mastery_character_c2030c0c", masteryTitleIcon: "✦"},
        {
            "name": "Коити Хиросэ (Echoes Act 1)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 20,
            "hp": 32,
            "speed": 0.95,
            "ability": {
                "type": "damageReduction",
                "value": 0.03,
                "desc": "−3% получаемого урона"
            },
            "desc": "Начальная форма Echoes, способная создавать звуковые эффекты и слова. Стенд: Echoes ACT 1. Способность стенда: Звуковая волна: лёгкий разгон. Бафф при призыве: скорость +9%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 63% урона; на обычной арене получаемый урон снижен на 4% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Echoes ACT 1", desc: "Нажми SUPER, чтобы призвать Echoes ACT 1 как отдельное хитбокс-сердечко. Звуковая волна: лёгкий разгон. Бафф: скорость +9%; хитбокс радиусом 11 принимает на себя 63% урона при столкновении; на обычной арене получаемый урон снижается на 4%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Шёпот Эхо", masteryTitleId: "mastery_character_72cb3013", masteryTitleIcon: "✦"},
        {
            "name": "Пески (Beach Boy)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 19,
            "hp": 33,
            "speed": 0.85,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.09,
                "mult": 1.25,
                "desc": "9% шанс нанести ×1,25 урона"
            },
            "desc": "Молодой член команды Bucciarati, использующий стенд-удочку для атак сквозь препятствия. Стенд: Beach Boy. Способность стенда: Леска: расширенная зона перехвата. Бафф при призыве: скорость +11%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 74% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Beach Boy", desc: "Нажми SUPER, чтобы призвать Beach Boy как отдельное хитбокс-сердечко. Леска: расширенная зона перехвата. Бафф: скорость +11%; хитбокс радиусом 13 принимает на себя 74% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "А-А-А-НИКИ-И-И-И-И", masteryTitleId: "mastery_character_e4b58d7a", masteryTitleIcon: "✦"},
        {
            "name": "Векапипо (Wrecking Ball)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 24,
            "hp": 31,
            "speed": 1,
            "ability": {
                "type": "critChance",
                "value": 0.08,
                "desc": "+8% шанс критического удара"
            },
            "desc": "Боец Steel Ball Run, применяющий вращение и особые стальные сферы. Стенд: Wrecking Ball. Способность стенда: Стальные шары: плотная защита. Бафф при призыве: скорость +3%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 76% урона; на обычной арене получаемый урон снижен на 2% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Wrecking Ball", desc: "Нажми SUPER, чтобы призвать Wrecking Ball как отдельное хитбокс-сердечко. Стальные шары: плотная защита. Бафф: скорость +3%; хитбокс радиусом 12 принимает на себя 76% урона при столкновении; на обычной арене получаемый урон снижается на 2%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Кручу шар", masteryTitleId: "mastery_character_c713fd6a", masteryTitleIcon: "✦"},
        {
            "name": "Сантана",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 24,
            "hp": 38,
            "speed": 0.85,
            "ability": {
                "type": "healOnWin",
                "percent": 0.02,
                "desc": "+2% HP после победы"
            },
            "desc": "Пробудившийся Человек из колонны. Способен изменять тело и поглощать противников.",
            masteryTitle: "Пробуждение древнего столпа", masteryTitleId: "mastery_character_f94a198c", masteryTitleIcon: "✦"
        },
        {
            "name": "Кейчо Нидзимура (Bad Company)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 22,
            "hp": 32,
            "speed": 0.95,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.25,
                "desc": "10% шанс нанести ×1,25 урона"
            },
            "desc": "Старший брат Окуясу, командующий армией миниатюрных солдат и техники. Стенд: Bad Company. Способность стенда: Армия мини-солдаты: большой радиус. Бафф при призыве: скорость +7%; хитбокс-сердечко радиусом 14 перехватывает атаки и принимает на себя 81% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Bad Company", desc: "Нажми SUPER, чтобы призвать Bad Company как отдельное хитбокс-сердечко. Армия мини-солдаты: большой радиус. Бафф: скорость +7%; хитбокс радиусом 14 принимает на себя 81% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Командир карманной армии", masteryTitleId: "mastery_character_4fc6aa54", masteryTitleIcon: "✦"},
        {
            "name": "Акира Отоиси (Red Hot Chili Pepper)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 24,
            "hp": 30,
            "speed": 1.2,
            "ability": {
                "type": "critChance",
                "value": 0.1,
                "desc": "+10% шанс критического удара"
            },
            "desc": "Гитарист, чей стенд питается электричеством и становится сильнее от энергии. Стенд: Red Hot Chili Pepper. Способность стенда: Электрический разряд: максимальная скорость. Бафф при призыве: скорость +24%; хитбокс-сердечко радиусом 9 перехватывает атаки и принимает на себя 63% урона; на обычной арене получаемый урон снижен на 2% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Red Hot Chili Pepper", desc: "Нажми SUPER, чтобы призвать Red Hot Chili Pepper как отдельное хитбокс-сердечко. Электрический разряд: максимальная скорость. Бафф: скорость +24%; хитбокс радиусом 9 принимает на себя 63% урона при столкновении; на обычной арене получаемый урон снижается на 2%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Сегодня без электричества...", masteryTitleId: "mastery_character_e739a6da", masteryTitleIcon: "✦"},
        {
            "name": "Тэруки Ханадзава",
            "universe": "Mob 100",
            "damage": 18,
            "hp": 30,
            "speed": 1,
            "ability": {
                "type": "critChance",
                "value": 0.06,
                "desc": "+6% шанс критического удара"
            },
            "desc": "Сильный экстрасенс, который сначала высокомерен, но затем становится союзником Моба.",
            masteryTitle: "Вершина экстрасенсорной гордыни", masteryTitleId: "mastery_character_274f22ea", masteryTitleIcon: "✦"
        },
        {
            "name": "Сё Судзуки",
            "universe": "Mob 100",
            "damage": 21,
            "hp": 32,
            "speed": 1.05,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.08,
                "mult": 1.25,
                "desc": "8% шанс нанести ×1,25 урона"
            },
            "desc": "Экстрасенс с большим потенциалом и сын лидера организации Claw.",
            masteryTitle: "Наследник психической войны", masteryTitleId: "mastery_character_aaa556df", masteryTitleIcon: "✦"
        },
        {
            "name": "Элиза (Vermeil in Gold)",
            "universe": "Vermeil in Gold",
            "damage": 20,
            "hp": 31,
            "speed": 0.95,
            "desc": "Магическая ученица, умеющая использовать боевые заклинания, но не на уровне сильнейших магов.",
            masteryTitle: "Угадай сколько мне лет", masteryTitleId: "mastery_character_f298817c", masteryTitleIcon: "✦"
        }
    ],
    "Эпик": [
        { name: "Луффи (Таймскип)", universe: "One Piece", damage: 28, hp: 45, speed: 1.6, ability: { type: "damageMultChance", chance: 0.35, mult: 1.3, desc: "35% урон x1.3" }, desc: "После двух лет тренировок. Шанс 35% нанести в 1.3 раза больше урона.",
            masteryTitle: "Пират, покоривший Новый Свет", masteryTitleId: "mastery_character_fd813dab", masteryTitleIcon: "✦" },
        { name: "Ло", universe: "One Piece", damage: 25, hp: 40, speed: 1.2, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Хирург смерти. Увеличивает урон всей команды на 5%.",
            masteryTitle: "Хирург смерти", masteryTitleId: "mastery_character_87d0df0c", masteryTitleIcon: "✦" },
        { name: "Итачи", universe: "Naruto", damage: 30, hp: 38, speed: 1.5, desc: "Гений клана Учиха. Без активных способностей.",
            masteryTitle: "Ворон, несущий правду", masteryTitleId: "mastery_character_884e7b22", masteryTitleIcon: "✦" },
        { name: "Эрен", universe: "AoT", damage: 35, hp: 50, speed: 1.3, ability: { type: "teamHealOnWave", value: 0.02, desc: "Хил 2% за волну" }, desc: "После каждой победы лечит команду на 2%.",
            masteryTitle: "ЭРЕЕН ЙЕГАААА", masteryTitleId: "mastery_character_3fe8502e", masteryTitleIcon: "✦" },
        { name: "Гатс", universe: "Berserk", damage: 40, hp: 55, speed: 1.0, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Чёрный мечник. +5% урона команде.",
            masteryTitle: "Только не лимон...", masteryTitleId: "mastery_character_0595f447", masteryTitleIcon: "✦" },
        { name: "Кид", universe: "One Piece", damage: 28, hp: 35, speed: 1.1, ability: { type: "critChance", value: 0.05, desc: "+5% крит" }, desc: "Магнитный пират. +5% к шансу крита.",
            masteryTitle: "Магнитный бунтарь", masteryTitleId: "mastery_character_f9985a41", masteryTitleIcon: "✦" },
        { name: "Какаши", universe: "Naruto", damage: 26, hp: 42, speed: 1.4, desc: "Копирующий ниндзя. Без активных способностей.",
            masteryTitle: "Копирующий ниндзя Шарингана", masteryTitleId: "mastery_character_57c5680d", masteryTitleIcon: "✦" },
        { name: "Коби (Honestly impact)", universe: "One Piece", damage: 32, hp: 45, speed: 1.2, ability: { type: "critChance", value: 0.05, desc: "+5% крит" }, desc: "Честный удар. +5% к шансу крита.",
            masteryTitle: "Кулак новой эпохи", masteryTitleId: "mastery_character_5cd75e1d", masteryTitleIcon: "✦" },
        { name: "Луччи (Сп-9)", universe: "One Piece", damage: 38, hp: 45, speed: 1.5, desc: "Агент Леопард. Без активных способностей.",
            masteryTitle: "Леопард правительства", masteryTitleId: "mastery_character_e7d15638", masteryTitleIcon: "✦" },
        { name: "Робот (Руди)", universe: "Invincible", damage: 30, hp: 48, speed: 0.9, desc: "Киборг-подросток.",
            masteryTitle: "Стратег в стальном теле", masteryTitleId: "mastery_character_a7398bea", masteryTitleIcon: "✦" },
        { name: "Чёрный Нуар", universe: "The Boys", damage: 35, hp: 52, speed: 1.6, ability: { type: "damageReduction", value: 0.07, desc: "-7% урона" }, desc: "Молчаливый ниндзя Семёрки. Уменьшает получаемый урон на 7%.",
            masteryTitle: "Стояк на трупак", masteryTitleId: "mastery_character_a9a02fbe", masteryTitleIcon: "✦" },
        { name: "Кимико (финал)", universe: "The Boys", damage: 32, hp: 48, speed: 1.4, ability: { type: "teamHealOnWave", value: 0.02, desc: "Хил 2% за волну" }, desc: "Девушка с супер-регенерацией. Лечит команду на 2% за волну.",
            masteryTitle: "Быстро регенирирую", masteryTitleId: "mastery_character_3de97d9f", masteryTitleIcon: "✦" },
        { name: "Ракета (а-трейн)", universe: "The Boys", damage: 38, hp: 40, speed: 1.8, ability: { type: "nonBossOneShot", chance: 0.03, desc: "3% ваншот (не босс)" }, desc: "К вам летит РАКЕТААААААА!!!! 3% шанс мгновенно убить врага (кроме боссов).",
            masteryTitle: "К вам летит ракет-а-а-а-а!", masteryTitleId: "mastery_character_f1d58cc7", masteryTitleIcon: "✦" },
        { name: "Деку (5%)", universe: "MHA", damage: 29, hp: 70, speed: 0.6, ability: { type: "desperateStrike", value: 0.10, threshold: 0.30, desc: "+10% урона при HP ниже 30%" }, statusAbility: { type: "clickDmgSelf", value: 0.02, desc: "-2% HP за клик" }, desc: "Слабый сосуд, мощная сила. Каждый клик отнимает 2% HP команды, зато в критический момент урон возрастает на 10%.",
            masteryTitle: "Наследник силы в пяти процентах", masteryTitleId: "mastery_character_69dd0c46", masteryTitleIcon: "✦" }
,
{ name: "Зверь", universe: "The Boys", patchId: "the_boys", damage: 35, hp: 45, speed: 1.5, ability: { type: "damageMultChance", chance: 0.12, mult: 1.25, desc: "12% шанс нанести ×1,25 урона" }, desc: "Человек-паук в стиле Пацанов. Ах ты сволочь, Человек-паук! ",
            masteryTitle: "Ах ты сволочь, Человек-паук!", masteryTitleId: "mastery_character_4c3852b7", masteryTitleIcon: "✦" },
        { name: "Звёздочка ", universe: "The Boys", patchId: "the_boys", damage: 32, hp: 48, speed: 1.3, ability: { type: "critChance", value: 0.06, desc: "+6% шанс критического удара" }, statusAbility: { type: "shock", chance: 0.10, desc: "10% шанс электрического шока" }, desc: "Которая еще не ела детей",
            masteryTitle: "Ем детей", masteryTitleId: "mastery_character_5cf64f63", masteryTitleIcon: "✦" },
        
        { name: "Файркрекер (Пропагандистка)", universe: "The Boys", patchId: "the_boys", damage: 27, hp: 45, speed: 1, desc: "Умеет выпускать искры и мастерски управляет пропагандой. В прямом бою заметно уступает сильнейшим суперам.",
            masteryTitle: "Голос пропаганды", masteryTitleId: "mastery_character_783e252e", masteryTitleIcon: "✦" },
        {"name":"Санджи (Таймскип)","universe":"One Piece","patchId":"one_piece","damage":32,"hp":45,"speed":1.6,"ability":{"type":"damageMultChance","chance":0.15,"mult":1.25,"desc":"15% шанс нанести ×1,25 урона"},"desc":"Чёрная нога после таймскипа. Усиленные удары ногами и высокая скорость дают преимущество в темпе.",
            masteryTitle: "У меня горит нога", masteryTitleId: "mastery_character_6eaf6dcd", masteryTitleIcon: "✦"},
        {"name":"Нами (Зевс)","universe":"One Piece","patchId":"one_piece","damage":28,"hp":44,"speed":1.5,"statusAbility":{"type":"shock","chance":0.12,"desc":"12% шанс электрического шока"},"desc":"Навигатор использует Зевса, чтобы усиливать климатические атаки молниями.",
            masteryTitle: "Гроза в ладонях", masteryTitleId: "mastery_character_80fc3500", masteryTitleIcon: "✦"},
        {"name":"Боа Хэнкок","universe":"One Piece","patchId":"one_piece","damage":42,"hp":55,"speed":1.4,"statusAbility":{"type":"blind","value":1,"desc":"Взгляд ослепляет: +1 клик до контратаки"},"desc":"Императрица Амазон Лили. Её красота и сила Меро-фрукта дезориентируют противников.",
            masteryTitle: "Настолько красивая, что окаменеешь", masteryTitleId: "mastery_character_97686caf", masteryTitleIcon: "✦"},
        {"name":"Крокодайл","universe":"One Piece","patchId":"one_piece","damage":40,"hp":60,"speed":1.2,"ability":{"type":"damageReduction","value":0.06,"desc":"−6% получаемого урона"},"desc":"Бывший сичибукай и хозяин песчаного фрукта. Песчаная броня помогает переживать удары.",
            masteryTitle: "Мать Луффи", masteryTitleId: "mastery_character_acb88227", masteryTitleIcon: "✦"},
        {"name":"Сабо (без фрукта)","universe":"One Piece","patchId":"one_piece","damage":43,"hp":52,"speed":1.7,"statusAbility":{"type":"fire","damage":5,"duration":3000,"desc":"Пламя: 5 урона в секунду"},"desc":"Начальник штаба Революционной армии. Настолько горячий парень, что прожигает врагов своей крутостью.",
            masteryTitle: "Революционер без огненного дара", masteryTitleId: "mastery_character_f355b7a0", masteryTitleIcon: "✦"},
        {"name":"Перона","universe":"One Piece","patchId":"one_piece","damage":27,"hp":42,"speed":1.2,"statusAbility":{"type":"blind","value":2,"desc":"Призраки: +2 клика до контратаки"},"desc":"Королева призраков. Её негативные полые призраки подавляют боевой дух врагов.",
            masteryTitle: "Принцесса негативных призраков", masteryTitleId: "mastery_character_345a146a", masteryTitleIcon: "✦"},
        {"name":"Джевелри Бонни","universe":"One Piece","patchId":"one_piece","damage":35,"hp":50,"speed":1.4,"ability":{"type":"healOnWin","percent":0.025,"desc":"+2,5% HP после победы"},"desc":"Пиратка с силой изменения возраста. Использует обманчивую внешность и нестандартные приёмы.",
            masteryTitle: "Пожирательница лет", masteryTitleId: "mastery_character_3e66a6f3", masteryTitleIcon: "✦"},
        {"name":"Икс Дрейк","universe":"One Piece","patchId":"one_piece","damage":38,"hp":55,"speed":1.25,"ability":{"type":"damageReduction","value":0.08,"desc":"−8% получаемого урона"},"desc":"Бывший морской офицер, умеющий превращаться в древнего динозавра.",
            masteryTitle: "Древний хищник флота", masteryTitleId: "mastery_character_82b6908a", masteryTitleIcon: "✦"},
        {"name":"Капоне Беге","universe":"One Piece","patchId":"one_piece","damage":30,"hp":70,"speed":0.9,"ability":{"type":"damageReduction","value":0.1,"desc":"−10% получаемого урона"},"desc":"Капитан с крепостным фруктом: его тело превращается в вооружённую крепость.",
            masteryTitle: "Крепость на двух ногах", masteryTitleId: "mastery_character_f699e2fa", masteryTitleIcon: "✦"},
        {"name":"Бэзил Хокинс","universe":"One Piece","patchId":"one_piece","damage":34,"hp":55,"speed":1.1,"ability":{"type":"damageMultChance","chance":0.12,"mult":1.3,"desc":"12% шанс нанести ×1,3 урона"},"desc":"Маг-пират, читающий карты таро и использующий соломенные куклы для защиты и ответных атак.",
            masteryTitle: "Гадатель смерти", masteryTitleId: "mastery_character_a19986c4", masteryTitleIcon: "✦"},
        {"name":"Скрэтчмен Апу","universe":"One Piece","patchId":"one_piece","damage":32,"hp":45,"speed":1.6,"statusAbility":{"type":"shock","chance":0.1,"desc":"10% шанс звукового шока"},"desc":"Музыкальный пират превращает звук и ритм в разрушительные атаки.",
            masteryTitle: "Диджей разрушения", masteryTitleId: "mastery_character_4945fc42", masteryTitleIcon: "✦"},
        {"name":"Эмпорио Иванков","universe":"One Piece","patchId":"one_piece","damage":29,"hp":47,"speed":1.2,"ability":{"type":"healOnWin","percent":0.035,"desc":"+3,5% HP после победы"},"desc":"Командир Революционной армии. Гормональные техники помогают союзникам переживать тяжёлые бои.",
            masteryTitle: "Угадай мой пол", masteryTitleId: "mastery_character_f5f52020", masteryTitleIcon: "✦"},
        {"name":"Пероспреро","universe":"One Piece","patchId":"one_piece","damage":34,"hp":52,"speed":1.05,"statusAbility":{"type":"freezeStacks","value":1,"desc":"Конфетные путы: +1 клик до контратаки"},"desc":"Старший сын Большой Мамочки управляет липкими конфетами и сковывает противников.",
            masteryTitle: "Кондитер из конфетного ада", masteryTitleId: "mastery_character_fd22706a", masteryTitleIcon: "✦"},
        {"name":"Шарлотта Пудинг","universe":"One Piece","patchId":"one_piece","damage":28,"hp":44,"speed":1.1,"ability":{"type":"damageAura","value":0.03,"desc":"+3% урона команде"},"desc":"Дочь Большой Мамочки с силой памяти. Поддерживает союзников хитростью и тонким расчётом.",
            masteryTitle: "Третий глаз шоколадной принцессы", masteryTitleId: "mastery_character_96962174", masteryTitleIcon: "✦"},
        {"name":"Педро","universe":"One Piece","patchId":"one_piece","damage":36,"hp":47,"speed":1.3,"statusAbility":{"type":"shock","chance":0.08,"desc":"8% шанс электрического шока"},"desc":"Мускетёр минков, готовый рискнуть собой ради команды Луффи.",
            masteryTitle: "Страж рассвета", masteryTitleId: "mastery_character_65eb2e79", masteryTitleIcon: "✦"},
        {"name":"Каррот (Сулонг)","universe":"One Piece","patchId":"one_piece","damage":65,"hp":78,"speed":2.5,"ability":{"type":"damageMultChance","chance":0.2,"mult":1.3,"desc":"20% шанс нанести ×1,3 урона"},"statusAbility":{"type":"shock","chance":0.08,"desc":"8% шанс электрического шока"},"desc":"Каррот под полной луной входит в форму Сулонг: скорость и электрические атаки резко возрастают.",
            masteryTitle: "Белая луна Минков", masteryTitleId: "mastery_character_b3c6b2dd", masteryTitleIcon: "✦"},
        { name: "Генос", universe: "OPM", patchId: "one_punch_man", damage: 36, hp: 47, speed: 1.6, statusAbility: { type: "fire", damage: 4, duration: 2500, desc: "Взрывные руки: 4 урона в секунду" }, desc: "Демон-киборг постоянно модернизирует тело. Его энергетические выстрелы наносят дополнительный огненный урон.",
            masteryTitle: "Демон-киборг", masteryTitleId: "mastery_character_1adb6e29", masteryTitleIcon: "✦" },
        { name: "Соник (Скорость звука)", universe: "OPM", patchId: "one_punch_man", damage: 35, hp: 43, speed: 1.9, ability: { type: "critChance", value: 0.05, desc: "+5% к шансу критического удара" }, desc: "Ниндзя-убийца, делающий ставку на скорость и точность. Быстрые атаки чаще попадают в уязвимые места.",
            masteryTitle: "Ниндзя скорости звука", masteryTitleId: "mastery_character_1e32e5b8", masteryTitleIcon: "✦" },
        { name: "Металлическая Бита", universe: "OPM", patchId: "one_punch_man", damage: 36, hp: 60, speed: 1.3, ability: { type: "damageMultChance", chance: 0.15, mult: 1.25, desc: "15% шанс нанести ×1,25 урона" }, desc: "Чем дольше продолжается схватка, тем яростнее он сражается. Иногда наносит особенно мощный удар.",
            masteryTitle: "Бита, что сильнее ярости", masteryTitleId: "mastery_character_68e71433", masteryTitleIcon: "✦" },
        { name: "Девушка-комар", universe: "OPM", patchId: "one_punch_man", damage: 35, hp: 45, speed: 1.7, ability: { type: "healOnWin", percent: 0.025, desc: "+2,5% HP после победы" }, desc: "Монстр с высокой скоростью и способностью восстанавливать силы за счёт крови. Её регенерация помогает после боя.",
            masteryTitle: "Кровавая королева роя", masteryTitleId: "mastery_character_e0522a00", masteryTitleIcon: "✦" },
        { name: "Сторожевой пёс", universe: "OPM", patchId: "one_punch_man", damage: 38, hp: 58, speed: 1.65, desc: "Загадочный герой S-класса, сражающийся резкими и непредсказуемыми движениями. Сильный боец без чрезмерных бонусов.",
            masteryTitle: "Страж Q-сити", masteryTitleId: "mastery_character_f1d1b931", masteryTitleIcon: "✦" },
        {
            "name": "Джонатан Джостар (Хамон)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 36,
            "hp": 58,
            "speed": 1.1,
            "ability": {
                "type": "damageAura",
                "value": 0.04,
                "desc": "+4% урона команде"
            },
            "desc": "Первый Джостар: честный и невероятно сильный боец, освоивший Хамон.",
            masteryTitle: "Меня сольют очень быстро", masteryTitleId: "mastery_character_9724cc7d", masteryTitleIcon: "✦"
        },
        {
            "name": "Дио Брандо (часть 1)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 44,
            "hp": 56,
            "speed": 1.25,
            "ability": {
                "type": "healOnWin",
                "percent": 0.025,
                "desc": "+2,5% HP после победы"
            },
            "desc": "Дио после превращения в вампира. Регенерация делает его опасным противником.",
            masteryTitle: "Kono Dio da!", masteryTitleId: "mastery_character_347f5789", masteryTitleIcon: "✦"
        },
        {
            "name": "Джозеф Джостар (часть 2)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 41,
            "hp": 54,
            "speed": 1.4,
            "ability": {
                "type": "critChance",
                "value": 0.1,
                "desc": "+10% шанс критического удара"
            },
            "desc": "Изобретательный Джозеф сочетает Хамон, ловушки и психологические уловки.",
            masteryTitle: "Твое следующее слово....", masteryTitleId: "mastery_character_03bdecfb", masteryTitleIcon: "✦"
        },
        {
            "name": "Джозеф Джостар (часть 3: Hermit Purple)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 44,
            "hp": 61,
            "speed": 1.25,
            "ability": {
                "type": "damageAura",
                "value": 0.04,
                "desc": "+4% урона команде"
            },
            "desc": "Постаревший Джозеф использует Хамон и стенд Hermit Purple для разведки и контроля. Стенд: Hermit Purple. Способность стенда: Лозы: широкая защита. Бафф при призыве: скорость +12%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 75% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Hermit Purple", desc: "Нажми SUPER, чтобы призвать Hermit Purple как отдельное хитбокс-сердечко. Лозы: широкая защита. Бафф: скорость +12%; хитбокс радиусом 13 принимает на себя 75% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Пенсия", masteryTitleId: "mastery_character_987544e7", masteryTitleIcon: "✦"},
        {
            "name": "Цезарь Антонио Цеппели",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 39,
            "hp": 49,
            "speed": 1.3,
            "ability": {
                "type": "bossDamage",
                "value": 0.05,
                "desc": "+5% урона боссам"
            },
            "desc": "Мастер Хамона, сражающийся с помощью пузырей, наполненных солнечной энергией.",
            masteryTitle: "ЦЕЗА-А-А-А-А-А-АРЬ!!!!", masteryTitleId: "mastery_character_9d9822c6", masteryTitleIcon: "✦"
        },
        {
            "name": "Лиза Лиза",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 38,
            "hp": 60,
            "speed": 1.05,
            "ability": {
                "type": "damageReduction",
                "value": 0.06,
                "desc": "−6% получаемого урона"
            },
            "desc": "Опытная наставница Хамона, сочетающая дисциплину и точные удары.",
            masteryTitle: "Подлиза", masteryTitleId: "mastery_character_8aeaf477", masteryTitleIcon: "✦"
        },
        {
            "name": "Страйдзо (вампир)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 48,
            "hp": 59,
            "speed": 1.3,
            "ability": {
                "type": "healOnWin",
                "percent": 0.03,
                "desc": "+3% HP после победы"
            },
            "desc": "Бывший пользователь Хамона, который обратился в вампира ради вечной молодости.",
            masteryTitle: "Предатель хамона", masteryTitleId: "mastery_character_0b195748", masteryTitleIcon: "✦"
        },
        {
            "name": "Нориаки Какёин (Hierophant Green)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 44,
            "hp": 49,
            "speed": 1.25,
            "statusAbility": {
                "type": "shock",
                "chance": 0.08,
                "desc": "8% шанс шока"
            },
            "desc": "Стенд Какёина атакует на расстоянии и может опутывать цели изумрудными нитями. Стенд: Hierophant Green. Способность стенда: Изумрудный барьер: сбалансированный щит. Бафф при призыве: скорость +10%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 71% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Hierophant Green", desc: "Нажми SUPER, чтобы призвать Hierophant Green как отдельное хитбокс-сердечко. Изумрудный барьер: сбалансированный щит. Бафф: скорость +10%; хитбокс радиусом 12 принимает на себя 71% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Зеленый", masteryTitleId: "mastery_character_0029b894", masteryTitleIcon: "✦"},
        {
            "name": "Жан-Пьер Польнарефф (Silver Chariot)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 49,
            "hp": 47,
            "speed": 1.5,
            "ability": {
                "type": "critChance",
                "value": 0.11,
                "desc": "+11% шанс критического удара"
            },
            "desc": "Фехтовальщик с молниеносным стендом Silver Chariot. Стенд: Silver Chariot. Способность стенда: Рапира: быстрый стенд и узкий хитбокс. Бафф при призыве: скорость +27%; хитбокс-сердечко радиусом 9 перехватывает атаки и принимает на себя 62% урона; на обычной арене получаемый урон снижен на 2% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Silver Chariot", desc: "Нажми SUPER, чтобы призвать Silver Chariot как отдельное хитбокс-сердечко. Рапира: быстрый стенд и узкий хитбокс. Бафф: скорость +27%; хитбокс радиусом 9 принимает на себя 62% урона при столкновении; на обычной арене получаемый урон снижается на 2%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Я - черепаха", masteryTitleId: "mastery_character_4a94c347", masteryTitleIcon: "✦"},
        {
            "name": "Мухаммед Абдул (Magician's Red)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 46,
            "hp": 56,
            "speed": 1.05,
            "statusAbility": {
                "type": "fire",
                "damage": 5,
                "duration": 3000,
                "desc": "Пламя наносит 5 урона за тик"
            },
            "desc": "Пользователь огненного стенда Magician's Red. Стенд: Magician's Red. Способность стенда: Пламя: усиленное поглощение урона. Бафф при призыве: скорость +8%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 77% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Magician's Red", desc: "Нажми SUPER, чтобы призвать Magician's Red как отдельное хитбокс-сердечко. Пламя: усиленное поглощение урона. Бафф: скорость +8%; хитбокс радиусом 12 принимает на себя 77% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Tsk tsk... YES, I AM!", masteryTitleId: "mastery_character_c098eec6", masteryTitleIcon: "✦"},
        {
            "name": "Пет Шоп (Horus)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 42,
            "hp": 51,
            "speed": 1.2,
            "statusAbility": {
                "type": "freezeStacks",
                "value": 1,
                "desc": "Замедление противника"
            },
            "desc": "Сокол, использующий ледяной стенд Horus и атакующий с воздуха. Стенд: Horus. Способность стенда: Ледяной панцирь: крепкая защита. Бафф при призыве: скорость +16%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 79% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Horus", desc: "Нажми SUPER, чтобы призвать Horus как отдельное хитбокс-сердечко. Ледяной панцирь: крепкая защита. Бафф: скорость +16%; хитбокс радиусом 11 принимает на себя 79% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Сокол ледяного ада", masteryTitleId: "mastery_character_f8602e22", masteryTitleIcon: "✦"},
        {
            "name": "Окуясу Нидзимура (The Hand)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 47,
            "hp": 63,
            "speed": 0.95,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.4,
                "desc": "10% шанс нанести ×1,4 урона"
            },
            "desc": "Стенд Окуясу стирает пространство правой рукой, но его владелец действует импульсивно. Стенд: The Hand. Способность стенда: Стирание пространства: блокирует много урона. Бафф при призыве: скорость +5%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 82% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — The Hand", desc: "Нажми SUPER, чтобы призвать The Hand как отдельное хитбокс-сердечко. Стирание пространства: блокирует много урона. Бафф: скорость +5%; хитбокс радиусом 13 принимает на себя 82% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Ты думаешь, что я тупой?", masteryTitleId: "mastery_character_f10aab01", masteryTitleIcon: "✦"},
        {
            "name": "Коити Хиросэ (Echoes Act 3)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 48,
            "hp": 62,
            "speed": 1,
            "ability": {
                "type": "damageReduction",
                "value": 0.05,
                "desc": "−5% получаемого урона"
            },
            "desc": "Третья форма Echoes способна резко увеличивать вес выбранной цели. Стенд: Echoes ACT 3. Способность стенда: 3 FREEZE: тяжёлый защитный стенд. Бафф при призыве: скорость +7%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 80% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Echoes ACT 3", desc: "Нажми SUPER, чтобы призвать Echoes ACT 3 как отдельное хитбокс-сердечко. 3 FREEZE: тяжёлый защитный стенд. Бафф: скорость +7%; хитбокс радиусом 12 принимает на себя 80% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Низкий", masteryTitleId: "mastery_character_fed089a5", masteryTitleIcon: "✦"},
        {
            "name": "Юкако Ямагиси (Love Deluxe)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 43,
            "hp": 63,
            "speed": 1.1,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.3,
                "desc": "10% шанс нанести ×1,3 урона"
            },
            "desc": "Опасная пользовательница стенда, управляющего её волосами. Стенд: Love Deluxe. Способность стенда: Волосы: увеличенная зона стенда. Бафф при призыве: скорость +14%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 70% урона; на обычной арене получаемый урон снижен на 4% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Love Deluxe", desc: "Нажми SUPER, чтобы призвать Love Deluxe как отдельное хитбокс-сердечко. Волосы: увеличенная зона стенда. Бафф: скорость +14%; хитбокс радиусом 13 принимает на себя 70% урона при столкновении; на обычной арене получаемый урон снижается на 4%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Любовь, ставшая ловушкой", masteryTitleId: "mastery_character_74cd20a2", masteryTitleIcon: "✦"},
        {
            "name": "Гвидо Миста (Sex Pistols)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 43,
            "hp": 47,
            "speed": 1.5,
            "ability": {
                "type": "critChance",
                "value": 0.12,
                "desc": "+12% шанс критического удара"
            },
            "desc": "Меткий стрелок, чьи маленькие стенды перенаправляют пули. Стенд: Sex Pistols. Способность стенда: Пули: скорость и точное прикрытие. Бафф при призыве: скорость +22%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 65% урона; на обычной арене получаемый урон снижен на 3% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Sex Pistols", desc: "Нажми SUPER, чтобы призвать Sex Pistols как отдельное хитбокс-сердечко. Пули: скорость и точное прикрытие. Бафф: скорость +22%; хитбокс радиусом 10 принимает на себя 65% урона при столкновении; на обычной арене получаемый урон снижается на 3%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Когда в тебя стреляют лучше всего не двигаться...", masteryTitleId: "mastery_character_f2c11e44", masteryTitleIcon: "✦"},
        {
            "name": "Наранча Гирга (Aerosmith)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 43,
            "hp": 49,
            "speed": 1.35,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.3,
                "desc": "12% шанс нанести ×1,3 урона"
            },
            "desc": "Пилот миниатюрного самолёта Aerosmith, отслеживающего дыхание и атакующего пулемётами. Стенд: Aerosmith. Способность стенда: Радар: скорость для уклонения. Бафф при призыве: скорость +20%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 68% урона; на обычной арене получаемый урон снижен на 4% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Aerosmith", desc: "Нажми SUPER, чтобы призвать Aerosmith как отдельное хитбокс-сердечко. Радар: скорость для уклонения. Бафф: скорость +20%; хитбокс радиусом 11 принимает на себя 68% урона при столкновении; на обычной арене получаемый урон снижается на 4%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Самолёт в кармане", masteryTitleId: "mastery_character_8dc04869", masteryTitleIcon: "✦"},
        {
            "name": "Триш Уна (Spice Girl)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 45,
            "hp": 61,
            "speed": 1.15,
            "ability": {
                "type": "damageReduction",
                "value": 0.06,
                "desc": "−6% получаемого урона"
            },
            "desc": "Пробуждённый стенд Trish смягчает любые материалы, помогая ей защищаться и атаковать. Стенд: Spice Girl. Способность стенда: Упругость: прочная защита. Бафф при призыве: скорость +12%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 78% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Spice Girl", desc: "Нажми SUPER, чтобы призвать Spice Girl как отдельное хитбокс-сердечко. Упругость: прочная защита. Бафф: скорость +12%; хитбокс радиусом 12 принимает на себя 78% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Дочь босса мафии", masteryTitleId: "mastery_character_66b08272", masteryTitleIcon: "✦"},
        {
            "name": "Просчутто (The Grateful Dead)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 50,
            "hp": 58,
            "speed": 1.1,
            "statusAbility": {
                "type": "bleed",
                "value": 0.05,
                "desc": "+5% урона через кровотечение"
            },
            "desc": "Безжалостный член команды убийц, чья способность ускоряет старение целей. Стенд: The Grateful Dead. Способность стенда: Старение: максимально плотный щит. Бафф при призыве: скорость +5%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 83% урона; на обычной арене получаемый урон снижен на 10% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — The Grateful Dead", desc: "Нажми SUPER, чтобы призвать The Grateful Dead как отдельное хитбокс-сердечко. Старение: максимально плотный щит. Бафф: скорость +5%; хитбокс радиусом 12 принимает на себя 83% урона при столкновении; на обычной арене получаемый урон снижается на 10%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Стареющая смерть", masteryTitleId: "mastery_character_ddd37f8b", masteryTitleIcon: "✦"},
        {
            "name": "Гьяччо (White Album)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 49,
            "hp": 66,
            "speed": 1.1,
            "ability": {
                "type": "damageReduction",
                "value": 0.07,
                "desc": "−7% получаемого урона"
            },
            "desc": "Создаёт ледяную броню и замораживает окружающее пространство. Стенд: White Album. Способность стенда: Ледяная броня: один из лучших блоков урона. Бафф при призыве: скорость +8%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 84% урона; на обычной арене получаемый урон снижен на 10% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — White Album", desc: "Нажми SUPER, чтобы призвать White Album как отдельное хитбокс-сердечко. Ледяная броня: один из лучших блоков урона. Бафф: скорость +8%; хитбокс радиусом 13 принимает на себя 84% урона при столкновении; на обычной арене получаемый урон снижается на 10%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Мне холодно", masteryTitleId: "mastery_character_781ea80c", masteryTitleIcon: "✦"},
        {
            "name": "Эрмес Костелло (Kiss)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 46,
            "hp": 63,
            "speed": 1.2,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.35,
                "desc": "10% шанс нанести ×1,35 урона"
            },
            "desc": "Использует наклейки Kiss, чтобы создавать копии объектов и затем резко соединять их. Стенд: Kiss. Способность стенда: Дубликаты: широкий защитный хитбокс. Бафф при призыве: скорость +15%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 73% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Kiss", desc: "Нажми SUPER, чтобы призвать Kiss как отдельное хитбокс-сердечко. Дубликаты: широкий защитный хитбокс. Бафф: скорость +15%; хитбокс радиусом 12 принимает на себя 73% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Поцелуй, размножающий реальность", masteryTitleId: "mastery_character_14153f71", masteryTitleIcon: "✦"},
        {
            "name": "Foo Fighters (F.F.)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 40,
            "hp": 61,
            "speed": 1.2,
            "ability": {
                "type": "healOnWin",
                "percent": 0.03,
                "desc": "+3% HP после победы"
            },
            "desc": "Разумная колония планктонов, которая может восстанавливать собственное тело. Стенд: Foo Fighters. Способность стенда: Планктон: устойчивость и скорость. Бафф при призыве: скорость +13%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 75% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Foo Fighters", desc: "Нажми SUPER, чтобы призвать Foo Fighters как отдельное хитбокс-сердечко. Планктон: устойчивость и скорость. Бафф: скорость +13%; хитбокс радиусом 11 принимает на себя 75% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Планктон с человеческой волей", masteryTitleId: "mastery_character_58a71bee", masteryTitleIcon: "✦"},
        {
            "name": "Эмпорио Алниньо",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 39,
            "hp": 56,
            "speed": 1,
            "ability": {
                "type": "damageAura",
                "value": 0.03,
                "desc": "+3% урона команде"
            },
            "desc": "Юный союзник Джолин, умеющий использовать призрачные комнаты и найденные предметы. Стенд: Burning Down the House. Способность стенда: Призрачная комната: быстрый отклик. Бафф при призыве: скорость +10%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 67% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Burning Down the House", desc: "Нажми SUPER, чтобы призвать Burning Down the House как отдельное хитбокс-сердечко. Призрачная комната: быстрый отклик. Бафф: скорость +10%; хитбокс радиусом 10 принимает на себя 67% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Последний ребёнок Грин Долфин", masteryTitleId: "mastery_character_568c167c", masteryTitleIcon: "✦"},
        {
            "name": "Хот Пэнтс",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 47,
            "hp": 60,
            "speed": 1.2,
            "ability": {
                "type": "healOnWin",
                "percent": 0.025,
                "desc": "+2,5% HP после победы"
            },
            "desc": "Участница гонки Steel Ball Run, использующая стенд Cream Starter для лечения и маскировки. Стенд: Cream Starter. Способность стенда: Лечебный спрей: усиленная зона защиты. Бафф при призыве: скорость +16%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 72% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Cream Starter", desc: "Нажми SUPER, чтобы призвать Cream Starter как отдельное хитбокс-сердечко. Лечебный спрей: усиленная зона защиты. Бафф: скорость +16%; хитбокс радиусом 12 принимает на себя 72% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Охотница, лечащая плотью", masteryTitleId: "mastery_character_3a7271f2", masteryTitleIcon: "✦"},
        {
            "name": "Сэндмен (In a Silent Way)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 46,
            "hp": 45,
            "speed": 1.65,
            "ability": {
                "type": "critChance",
                "value": 0.11,
                "desc": "+11% шанс критического удара"
            },
            "desc": "Быстрый боец Steel Ball Run, превращающий звук и движение в разрушительные атаки. Стенд: In a Silent Way. Способность стенда: Звуковая скорость: быстрое движение. Бафф при призыве: скорость +26%; хитбокс-сердечко радиусом 9 перехватывает атаки и принимает на себя 63% урона; на обычной арене получаемый урон снижен на 2% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — In a Silent Way", desc: "Нажми SUPER, чтобы призвать In a Silent Way как отдельное хитбокс-сердечко. Звуковая скорость: быстрое движение. Бафф: скорость +26%; хитбокс радиусом 9 принимает на себя 63% урона при столкновении; на обычной арене получаемый урон снижается на 2%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Шаг в безмолвии", masteryTitleId: "mastery_character_2e62dddd", masteryTitleIcon: "✦"},
        {
            "name": "Ясухо Хиросэ (Paisley Park)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 39,
            "hp": 57,
            "speed": 1.1,
            "ability": {
                "type": "damageAura",
                "value": 0.04,
                "desc": "+4% урона команде"
            },
            "desc": "Помогает союзникам с помощью поискового и навигационного стенда Paisley Park. Стенд: Paisley Park. Способность стенда: Навигация: скорость и средняя защита. Бафф при призыве: скорость +18%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 69% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Paisley Park", desc: "Нажми SUPER, чтобы призвать Paisley Park как отдельное хитбокс-сердечко. Навигация: скорость и средняя защита. Бафф: скорость +18%; хитбокс радиусом 11 принимает на себя 69% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Проводник Пэйсли-Парк", masteryTitleId: "mastery_character_4d59144e", masteryTitleIcon: "✦"},
        {
            "name": "Драгона Джостар",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 43,
            "hp": 59,
            "speed": 1.25,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.1,
                "mult": 1.3,
                "desc": "10% шанс нанести ×1,3 урона"
            },
            "desc": "Союзник Джодио, способный изменять положение и размер частей тела с помощью Smooth Operators. Стенд: Smooth Operators. Способность стенда: Коррекция тела: прочный стенд. Бафф при призыве: скорость +19%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 76% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Smooth Operators", desc: "Нажми SUPER, чтобы призвать Smooth Operators как отдельное хитбокс-сердечко. Коррекция тела: прочный стенд. Бафф: скорость +19%; хитбокс радиусом 12 принимает на себя 76% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Грациозное искажение", masteryTitleId: "mastery_character_90ca657c", masteryTitleIcon: "✦"},
        {
            "name": "Усаги Алохаоэ",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 41,
            "hp": 51,
            "speed": 1.3,
            "ability": {
                "type": "critChance",
                "value": 0.08,
                "desc": "+8% шанс критического удара"
            },
            "desc": "Член команды Джодио, использующий стенд The Matte Kudasai для исполнения просьб. Стенд: The Matte Kudasai. Способность стенда: Копирование: лёгкое и быстрое прикрытие. Бафф при призыве: скорость +11%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 66% урона; на обычной арене получаемый урон снижен на 4% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — The Matte Kudasai", desc: "Нажми SUPER, чтобы призвать The Matte Kudasai как отдельное хитбокс-сердечко. Копирование: лёгкое и быстрое прикрытие. Бафф: скорость +11%; хитбокс радиусом 10 принимает на себя 66% урона при столкновении; на обычной арене получаемый урон снижается на 4%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Удача лунного зайца", masteryTitleId: "mastery_character_c969a3fd", masteryTitleIcon: "✦"},
        {
            "name": "Ринго Роудэгейн (Mandom)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 52,
            "hp": 61,
            "speed": 1.15,
            "ability": {
                "type": "damageReduction",
                "value": 0.07,
                "desc": "−7% получаемого урона"
            },
            "desc": "Стрелок Steel Ball Run, способный отматывать время на несколько секунд. Стенд: Mandom. Способность стенда: Возврат времени: сильнее снижает урон. Бафф при призыве: скорость +14%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 77% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Mandom", desc: "Нажми SUPER, чтобы призвать Mandom как отдельное хитбокс-сердечко. Возврат времени: сильнее снижает урон. Бафф: скорость +14%; хитбокс радиусом 11 принимает на себя 77% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Пистолет времени Мандом", masteryTitleId: "mastery_character_6bdd3f12", masteryTitleIcon: "✦"},
        {
            "name": "Аратака Рейген (серьёзный бой)",
            "universe": "Mob 100",
            "damage": 31,
            "hp": 47,
            "speed": 1.15,
            "ability": {
                "type": "damageAura",
                "value": 0.03,
                "desc": "+3% урона команде"
            },
            "desc": "Обычный человек без собственных экстрасенсорных сил, который компенсирует это хитростью и уверенностью.",
            masteryTitle: "Мастер экстрасенсорной скидки", masteryTitleId: "mastery_character_c93a5092", masteryTitleIcon: "✦"
        },
        {
            "name": "Димпл (божественная форма)",
            "universe": "Mob 100",
            "damage": 39,
            "hp": 55,
            "speed": 1.2,
            "ability": {
                "type": "healOnWin",
                "percent": 0.025,
                "desc": "+2,5% HP после победы"
            },
            "desc": "Димпл, усилившийся благодаря поклонникам. Значительно опаснее своей слабой формы.",
            masteryTitle: "Бог с улыбкой-приманкой", masteryTitleId: "mastery_character_7322910b", masteryTitleIcon: "✦"
        },
        {
            "name": "Моб (обычный экстрасенс)",
            "universe": "Mob 100",
            "damage": 44,
            "hp": 62,
            "speed": 1.1,
            "ability": {
                "type": "damageReduction",
                "value": 0.05,
                "desc": "−5% получаемого урона"
            },
            "desc": "Сигэо Кагеяма обычно подавляет эмоции и силу, стараясь не причинять вреда другим.",
            masteryTitle: "Сто процентов сдержанности", masteryTitleId: "mastery_character_a86008cb", masteryTitleIcon: "✦"
        },
        {
            "name": "Алто Голдфилд",
            "universe": "Vermeil in Gold",
            "damage": 37,
            "hp": 56,
            "speed": 1,
            "ability": {
                "type": "critChance",
                "value": 0.06,
                "desc": "+6% шанс критического удара"
            },
            "desc": "Ученик магической академии, чья сила заметно растёт благодаря контракту с Вермейль.",
            masteryTitle: "Ученик, бросивший вызов демонам", masteryTitleId: "mastery_character_1b00853d", masteryTitleIcon: "✦"
        }
    ],
    "Мифическая": [
        { name: "Годжо (флешбек)", universe: "JJK", damage: 72, hp: 85, speed: 2.4, ability: { type: "critChance", value: 0.15, desc: "+15% шанс крита" }, desc: "Годжо из флешбека. Сильный мифический персонаж без секретных техник.",
            masteryTitle: "До того, как он сломал баланс", masteryTitleId: "mastery_character_01fc069f", masteryTitleIcon: "✦" },
        { name: "Луффи (4 гир: боусман)", universe: "One Piece", damage: 45, hp: 75, speed: 1.8, ability: { type: "damageReduction", value: 0.15, desc: "-15% урона" }, desc: "Boundman. Уменьшает получаемый урон на 15%.",
            masteryTitle: "Резиновый шар с претензией на трон", masteryTitleId: "mastery_character_793ac819", masteryTitleIcon: "✦" },
        { name: "Наруто (Мудрец)", universe: "Naruto", damage: 52, hp: 85, speed: 2.0, statusAbility: { type: "bleed", value: 0.10, desc: "Кровотечение +10%" }, desc: "Режим Мудреца. Увеличивает урон по врагу на 10% (кровотечение).",
            masteryTitle: "Ниндзя, подписанный на жабью мудрость", masteryTitleId: "mastery_character_1f64ba4a", masteryTitleIcon: "✦" },
        { name: "Гоку (SSJ)", universe: "DB", damage: 60, hp: 70, speed: 2.2, ability: { type: "bossDamage", value: 0.10, desc: "+10% боссам" }, desc: "Супер Сайян. +10% урона боссам.",
            masteryTitle: "Волосы пожелтели, враги посинели", masteryTitleId: "mastery_character_19876178", masteryTitleIcon: "✦" },
        { name: "Эйс", universe: "One Piece", damage: 70, hp: 47, speed: 2.1, statusAbility: { type: "fire", damage: 5, duration: 5000, desc: "Огонь 5/сек" }, desc: "Огненный кулак. Поджигает врага — 5 урона каждые 2 секунды.",
            masteryTitle: "Горячий парень", masteryTitleId: "mastery_character_67c9bd96", masteryTitleIcon: "✦" },
        { name: "Дедушка Гарп", universe: "One Piece", damage: 55, hp: 90, speed: 1.2, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, desc: "Герой морпехов. +10% урона всей команде.",
            masteryTitle: "Внуков воспитывает кулаком", masteryTitleId: "mastery_character_0c506253", masteryTitleIcon: "✦" },
        { name: "Неуязвимый (Коалиция планет)", universe: "Invincible", damage: 65, hp: 80, speed: 2.0, ability: { type: "critChance", value: 0.20, desc: "+20% крит" }, desc: "Марк Грейсон в прайме. +20% к шансу крита.",
            masteryTitle: "Много друзей", masteryTitleId: "mastery_character_48e22fbf", masteryTitleIcon: "✦" },
        { name: "Бог Скайпии Энель", universe: "One Piece", damage: 68, hp: 72, speed: 2.8, statusAbility: { type: "shock", chance: 0.12, desc: "Шок 12%" }, desc: "Бог молний. 12% шанс шокнуть врага.",
            masteryTitle: "Слишком сильный для начало", masteryTitleId: "mastery_character_b344b258", masteryTitleIcon: "✦" },
        { name: "Альбер (Кинг)", universe: "One Piece", damage: 72, hp: 68, speed: 2.3, statusAbility: { type: "fire", damage: 8, duration: 4000, desc: "Огонь 8/сек" }, desc: "Правая рука Кайдо. Поджигает врага — 8 урона каждые 2 секунды.",
            masteryTitle: "Рожденный в огне", masteryTitleId: "mastery_character_766bbf4b", masteryTitleIcon: "✦" },
        { name: "Виктория Ньюман", universe: "The Boys", damage: 65, hp: 85, speed: 1.6, statusAbility: { type: "bleed", value: 0.20, desc: "Кровотечение +20%" }, desc: "Глава секретного отдела. +20% урона через кровотечение (взрыв головы).",
            masteryTitle: "Не смотри мне в глаза", masteryTitleId: "mastery_character_ed7a6a00", masteryTitleIcon: "✦" },
        { name: "Королева Мэйв", universe: "The Boys", damage: 70, hp: 88, speed: 1.8, ability: { type: "damageReduction", value: 0.15, desc: "-15% меньше урона" }, desc: "Самая сильная женщина. Уменьшает получаемый урон на 15%.",
            masteryTitle: "Последний щит Семёрки", masteryTitleId: "mastery_character_85be46cb", masteryTitleIcon: "✦" },
        { name: "Солдатик (флешбек)", universe: "The Boys", damage: 72, hp: 82, speed: 1.7, ability: { type: "bossDamage", value: 0.12, desc: "+12% боссам" }, desc: "Первый супергерой. +12% урона боссам.",
            masteryTitle: "Невыносимый", masteryTitleId: "mastery_character_f4175002", masteryTitleIcon: "✦" },
        { name: "Штормфронт", universe: "The Boys", damage: 68, hp: 78, speed: 2.4, statusAbility: { type: "shock", chance: 0.15, desc: "Электричество 15%" }, desc: "Нацистка с молниями. 15% шанс шокнуть врага.",
            masteryTitle: "Нацисткая тварь", masteryTitleId: "mastery_character_9260ac74", masteryTitleIcon: "✦" },
        { name: "Ален (перерождённый)", universe: "Invincible", damage: 70, hp: 70, speed: 2.2, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, desc: "Инопланетянин-герой. +10% урона команде.",
            masteryTitle: "Герой вселенной", masteryTitleId: "mastery_character_3d48aea9", masteryTitleIcon: "✦" },
        { name: "Звёздочка (прайм)", universe: "The Boys", damage: 65, hp: 80, speed: 1.9, statusAbility: { type: "blind", value: 2, desc: "Ослепление +2" }, desc: "Световая героиня. Ослепляет врага — +2 клика до ответной атаки. Которая ест детей",
            masteryTitle: "Звезда", masteryTitleId: "mastery_character_3b515e52", masteryTitleIcon: "✦" },
        { name: "Деку: полное покрытие (20%)", universe: "MHA", damage: 58, hp: 68, speed: 1.3, ability: { type: "desperateStrike", value: 0.15, threshold: 0.30, desc: "+15% урона при HP ниже 30%" }, statusAbility: { type: "dmgTakenIncrease", value: 0.10, desc: "+10% получ. урона" }, desc: "20% One For All. Получаемый урон увеличен на 10%, зато при критически низком HP атаки становятся сильнее.",
            masteryTitle: "20% силы, 80% переломов", masteryTitleId: "mastery_character_ccba91c0", masteryTitleIcon: "✦" }
,
{ name: "Билли Бутчер (V24)", universe: "The Boys", patchId: "the_boys", damage: 70, hp: 85, speed: 1.5, ability: { type: "bossDamage", value: 0.08, desc: "+8% урона боссам" }, statusAbility: { type: "fire", damage: 7, duration: 3500, desc: "Тепловое зрение: 7 урона/сек" }, desc: "Бутчер под временным V24 получает силу, выносливость, тепловое зрение и щупальца симбионта. Препарат крайне опасен для его здоровья.",
            masteryTitle: "Отец года", masteryTitleId: "mastery_character_c23e88c3", masteryTitleIcon: "✦" },
        { name: "Взрослый Райан ", universe: "The Boys", patchId: "the_boys", damage: 65, hp: 80, speed: 1.8, ability: { type: "critChance", value: 0.09, desc: "+9% шанс критического удара" }, statusAbility: { type: "fire", damage: 8, duration: 3000, desc: "Тепловое зрение: 8 урона/сек" }, desc: "Райан унаследовал полёт, сверхсилу, прочность и тепловое зрение, но ещё уступает Хоумлендеру в опыте и контроле.",
            masteryTitle: "Глаза отца, воспитание спорное", masteryTitleId: "mastery_character_1c7733ba", masteryTitleIcon: "✦" },
        { name: "Сестра Сейдж (Гений)", universe: "The Boys", patchId: "the_boys", damage: 45, hp: 80, speed: 1.1, ability: { type: "damageAura", value: 0.06, desc: "+6% урона всей команде" }, desc: "Самый умный человек в мире. Её главная сила — гиперинтеллект, анализ, наука и манипуляция, а не грубая физическая мощь.",
            masteryTitle: "Гений, который буквально выносит себе мозг", masteryTitleId: "mastery_character_bf8b6f04", masteryTitleIcon: "✦" },
        { name: "Кимико (Боевая регенерация)", universe: "The Boys", patchId: "the_boys", damage: 55, hp: 105, speed: 1.2, ability: { type: "damageReduction", value: 0.10, desc: "−10% получаемого урона" }, desc: "Кимико обладает сверхсилой, боевыми рефлексами и чрезвычайной регенерацией, благодаря которой переживает ранения, смертельные для обычного человека.",
            masteryTitle: "Обнимается только с ударом", masteryTitleId: "mastery_character_a74c3cd9", masteryTitleIcon: "✦" },
        {"name":"Кинг (Пламя угасло)","universe":"One Piece","patchId":"one_piece","damage":68,"hp":80,"speed":2.6,"ability":{"type":"damageMultChance","chance":0.18,"mult":1.3,"desc":"18% шанс нанести ×1,3 урона"},"desc":"Кинг гасит пламя на спине, жертвуя частью защиты ради взрывного роста скорости и силы атак.",
            masteryTitle: "Огненный режим: батарейка села", masteryTitleId: "mastery_character_b2621cc1", masteryTitleIcon: "✦"},
        {"name":"Санджи (Ифрит Джамбе)","universe":"One Piece","patchId":"one_piece","damage":70,"hp":72,"speed":2.2,"statusAbility":{"type":"fire","damage":8,"duration":3000,"desc":"Пылающие удары: 8 урона в секунду"},"desc":"Продвинутая техника Чёрной ноги: раскалённые удары становятся ещё быстрее и мощнее.",
            masteryTitle: "Синяя нога", masteryTitleId: "mastery_character_e0b71638", masteryTitleIcon: "✦"},
        {"name":"Луффи (Гир 4: Снейкмен)","universe":"One Piece","patchId":"one_piece","damage":72,"hp":85,"speed":2.4,"ability":{"type":"damageMultChance","chance":0.28,"mult":1.35,"desc":"28% шанс нанести ×1,35 урона"},"desc":"Отдельная форма Четвёртого Гира: Снейкмен делает резиновые удары непредсказуемыми и быстрыми.",
            masteryTitle: "Язык змеи", masteryTitleId: "mastery_character_40b84fe3", masteryTitleIcon: "✦"},
        {"name":"Ямато","universe":"One Piece","patchId":"one_piece","damage":68,"hp":100,"speed":1.9,"ability":{"type":"damageReduction","value":0.12,"desc":"−12% получаемого урона"},"desc":"Воин Вано, владеющий тяжёлой дубиной и мощной гибридной формой мифического зоана.",
            masteryTitle: "Папа сказал нельзя, я пошёл", masteryTitleId: "mastery_character_488d981a", masteryTitleIcon: "✦"},
        {"name":"Дракуль Михок","universe":"One Piece","patchId":"one_piece","damage":82,"hp":80,"speed":2,"ability":{"type":"critChance","value":0.16,"desc":"+16% шанс критического удара"},"desc":"Сильнейший фехтовальщик мира. Один точный удар способен решить исход боя.",
            masteryTitle: "Сильнейший мечник мира", masteryTitleId: "mastery_character_fcc6c95c", masteryTitleIcon: "✦"},
        {"name":"Фудзитора (Иссё)","universe":"One Piece","patchId":"one_piece","damage":74,"hp":95,"speed":1.7,"statusAbility":{"type":"freezeStacks","value":2,"desc":"Гравитация: +2 клика до контратаки"},"desc":"Адмирал гравитации утяжеляет противника и сбивает ритм его атак.",
            masteryTitle: "Чуствуй", masteryTitleId: "mastery_character_91ccf189", masteryTitleIcon: "✦"},
        {"name":"Магеллан (Начальник Импел Дауна)","universe":"One Piece","patchId":"one_piece","damage":74,"hp":85,"speed":1.5,"statusAbility":{"type":"poison","damage":7,"desc":"Яд: 7 урона за тик"},"desc":"Начальник Импел Дауна. Его ядовитые атаки крайне опасны даже для сильных противников.",
            masteryTitle: "Мне нужно в туалет!", masteryTitleId: "mastery_character_4513b2f2", masteryTitleIcon: "✦"},
        {"name":"Чоппер (Монстр-пойнт)","universe":"One Piece","patchId":"one_piece","damage":66,"hp":95,"speed":1.5,"ability":{"type":"damageReduction","value":0.08,"desc":"−8% получаемого урона"},"desc":"Чоппер принимает гигантскую боевую форму, жертвуя тонким контролем ради грубой силы.",
            masteryTitle: "Под веществами", masteryTitleId: "mastery_character_d3043a52", masteryTitleIcon: "✦"},
        {"name":"Куин (Чума)","universe":"One Piece","patchId":"one_piece","damage":76,"hp":88,"speed":1.4,"statusAbility":{"type":"poison","damage":6,"desc":"Биооружие: 6 урона за тик"},"desc":"Один из трёх бедствий Кайдо: кибернетическое оружие и вирусные атаки.",
            masteryTitle: "Учёный, у которого лаборатория не прошла проверку", masteryTitleId: "mastery_character_d1f0d43a", masteryTitleIcon: "✦"},
        {"name":"Джек (Засуха)","universe":"One Piece","patchId":"one_piece","damage":72,"hp":110,"speed":1.35,"ability":{"type":"damageReduction","value":0.13,"desc":"−13% получаемого урона"},"desc":"Неутомимый тяжеловес команды Кайдо, выдерживающий огромный объём повреждений.",
            masteryTitle: "Засуха Зверей", masteryTitleId: "mastery_character_db0b1c11", masteryTitleIcon: "✦"},
        {"name":"Ульти","universe":"One Piece","patchId":"one_piece","damage":62,"hp":78,"speed":1.9,"ability":{"type":"critChance","value":0.1,"desc":"+10% шанс критического удара"},"desc":"Древний зоан и яростный боец Пиратов Зверей, полагающийся на резкие лобовые атаки.",
            masteryTitle: "Голова твёрже аргументов", masteryTitleId: "mastery_character_65e1f707", masteryTitleIcon: "✦"},
        {"name":"Генирал фрэнки","universe":"One Piece","patchId":"one_piece","damage":35,"hp":50,"speed":1.4,"ability":{"type":"critChance","value":0.08,"desc":"+8% шанс критического удара"},"desc":"Это типо как халкбастер.",
            masteryTitle: "SUPER! Работает на коле и криках «СУПЕЕЕР!»", masteryTitleId: "mastery_character_e6efac2b", masteryTitleIcon: "✦"},
        {"name":"Донкихот Дофламинго","universe":"One Piece","patchId":"one_piece","damage":45,"hp":48,"speed":1.5,"ability":{"type":"damageMultChance","chance":0.18,"mult":1.3,"desc":"18% шанс нанести ×1,3 урона"},"statusAbility":{"type":"bleed","value":0.05,"desc":"+5% урона через кровотечение"},"desc":"Тиран Дресс Розы управляет режущими нитями и способен атаковать сразу с нескольких направлений.",
            masteryTitle: "Харизматичный", masteryTitleId: "mastery_character_57d15408", masteryTitleIcon: "✦"},
        {"name":"Шарлотта Смуси","universe":"One Piece","patchId":"one_piece","damage":108,"hp":130,"speed":1.8,"ability":{"type":"damageAura","value":0.1,"desc":"+10% урона команде"},"desc":"Одна из трёх сладких командиров Пиратов Большой Мамочки. Сила выжимания жидкости и огромный меч делают её опасным бойцом.",
            masteryTitle: "Собирательница жизненных соков", masteryTitleId: "mastery_character_44dbb11d", masteryTitleIcon: "✦"},
        { name: "Атомный Самурай", universe: "OPM", patchId: "one_punch_man", damage: 78, hp: 80, speed: 2.2, statusAbility: { type: "bleed", value: 0.12, desc: "+12% урона через кровотечение" }, desc: "Мастер меча S-класса. Его стремительные разрезы оставляют глубокие раны и усиливают общий урон отряда.",
            masteryTitle: "Мастер тысячи разрезов", masteryTitleId: "mastery_character_b87abd37", masteryTitleIcon: "✦" },
        { name: "Серебряный Клык (Бэнг)", universe: "OPM", patchId: "one_punch_man", damage: 66, hp: 102, speed: 1.8, ability: { type: "damageReduction", value: 0.06, desc: "−6% получаемого урона" }, desc: "Легендарный мастер боевых искусств, превращающий оборону и контратаки в преимущество.",
            masteryTitle: "Дед, который не получил трамву в молодости", masteryTitleId: "mastery_character_64626056", masteryTitleIcon: "✦" },
        { name: "Зомби-мэн", universe: "OPM", patchId: "one_punch_man", damage: 55, hp: 125, speed: 1.4, ability: { type: "healOnWin", percent: 0.04, desc: "+4% HP после победы" }, desc: "Герой S-класса с чудовищной регенерацией. Его слабее выраженная атака компенсируется способностью восстановиться после боя.",
            masteryTitle: "Смерть опять не приняла заявку", masteryTitleId: "mastery_character_d16f5af2", masteryTitleIcon: "✦" },
        { name: "Тёмное Сияние", universe: "OPM", patchId: "one_punch_man", damage: 65, hp: 150, speed: 1.35, ability: { type: "damageReduction", value: 0.08, desc: "−8% получаемого урона" }, desc: "Мастер бодибилдинга с огромной физической мощью и чрезвычайно прочным телом. Одна из самых выносливых карт мифического уровня.",
            masteryTitle: "Блестящая стена мышц", masteryTitleId: "mastery_character_447ffe28", masteryTitleIcon: "✦" },
        { name: "Кабуто (Режим резни)", universe: "OPM", patchId: "one_punch_man", damage: 74, hp: 108, speed: 1.8, ability: { type: "damageMultChance", chance: 0.12, mult: 1.25, desc: "12% шанс нанести ×1,25 урона" }, desc: "Carnage Mode резко увеличивает агрессию и физическую мощь монстра, но не поднимает его до космического уровня.",
            masteryTitle: "Жук, которому отключили тормоза", masteryTitleId: "mastery_character_a4e8b6ca", masteryTitleIcon: "✦" },
        { name: "Психос", universe: "OPM", patchId: "one_punch_man", damage: 58, hp: 80, speed: 1.5, ability: { type: "damageAura", value: 0.04, desc: "+4% урона всей команде" }, desc: "Могущественная экстрасенс и стратег Ассоциации монстров. Её психическая поддержка усиливает урон отряда.",
            masteryTitle: "Мозг за катастрофой", masteryTitleId: "mastery_character_5728d523", masteryTitleIcon: "✦" },
        {
            "name": "Вамуу",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 72,
            "hp": 108,
            "speed": 1.35,
            "ability": {
                "type": "damageReduction",
                "value": 0.09,
                "desc": "−9% получаемого урона"
            },
            "desc": "Воин людей из колонны, управляющий ветром и воздушными потоками.",
            masteryTitle: "Вихрь ветрового боя", masteryTitleId: "mastery_character_03bf2997", masteryTitleIcon: "✦"
        },
        {
            "name": "Эйсидиси",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 66,
            "hp": 102,
            "speed": 1.2,
            "statusAbility": {
                "type": "fire",
                "damage": 9,
                "duration": 3500,
                "desc": "Пламя наносит 9 урона за тик"
            },
            "desc": "Человек из колонны, использующий собственную перегретую кровь как оружие.",
            masteryTitle: "Пылающая ярость столпа", masteryTitleId: "mastery_character_8ca9d7e7", masteryTitleIcon: "✦"
        },
        {
            "name": "Карс (обычная форма)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 86,
            "hp": 124,
            "speed": 1.45,
            "ability": {
                "type": "karsEvolutionOnWave",
                "hpGrowth": 0.004,
                "damageGrowth": 0.003,
                "speedGrowth": 0.001,
                "maxSpeed": 12,
                "desc": "За каждую победу: +0.4% HP, +0.3% урона и +0.1% скорости (макс. 12)"
            },
            "desc": "Глава людей из колонны, мастер клинков света и биологической эволюции.",
            masteryTitle: "Совершенный разум столпов", masteryTitleId: "mastery_character_81219658", masteryTitleIcon: "✦"
        },
        {
            "name": "Ванилла Айс (Cream)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 91,
            "hp": 112,
            "speed": 1.45,
            "ability": {
                "type": "damageReduction",
                "value": 0.1,
                "desc": "−10% получаемого урона"
            },
            "desc": "Преданный Дио пользователь Cream, способного стирать материю в пустоте. Стенд: Cream. Способность стенда: Пустота: большой щит с сильным блоком. Бафф при призыве: скорость +8%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 81% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Cream", desc: "Нажми SUPER, чтобы призвать Cream как отдельное хитбокс-сердечко. Пустота: большой щит с сильным блоком. Бафф: скорость +8%; хитбокс радиусом 13 принимает на себя 81% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Чёрная дыра Cream", masteryTitleId: "mastery_character_aebdf35b", masteryTitleIcon: "✦"},
        {
            "name": "Рохан Кишибэ (Heaven's Door)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 77,
            "hp": 101,
            "speed": 1.2,
            "ability": {
                "type": "critChance",
                "value": 0.14,
                "desc": "+14% шанс критического удара"
            },
            "desc": "Мангака, чей стенд превращает людей в книги и позволяет читать или менять их содержимое. Стенд: Heaven's Door. Способность стенда: Запись: ускоренная реакция. Бафф при призыве: скорость +13%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 71% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Heaven's Door", desc: "Нажми SUPER, чтобы призвать Heaven's Door как отдельное хитбокс-сердечко. Запись: ускоренная реакция. Бафф: скорость +13%; хитбокс радиусом 10 принимает на себя 71% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Писатель, открывающий души", masteryTitleId: "mastery_character_133c6fe1", masteryTitleIcon: "✦"},
        {
            "name": "Бруно Буччеллати (Sticky Fingers)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 84,
            "hp": 112,
            "speed": 1.45,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.45,
                "desc": "12% шанс нанести ×1,45 урона"
            },
            "desc": "Лидер отряда, создающий молнии-замки на поверхностях и противниках. Стенд: Sticky Fingers. Способность стенда: Молнии-застёжки: расширенная защита. Бафф при призыве: скорость +17%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 74% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Sticky Fingers", desc: "Нажми SUPER, чтобы призвать Sticky Fingers как отдельное хитбокс-сердечко. Молнии-застёжки: расширенная защита. Бафф: скорость +17%; хитбокс радиусом 12 принимает на себя 74% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Золотой замок молнии", masteryTitleId: "mastery_character_522ce19f", masteryTitleIcon: "✦"},
        {
            "name": "Леоне Аббаккио (Moody Blues)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 68,
            "hp": 96,
            "speed": 1.05,
            "ability": {
                "type": "damageAura",
                "value": 0.06,
                "desc": "+6% урона команде"
            },
            "desc": "Стенд Аббаккио воспроизводит события прошлого, помогая отряду находить уязвимости. Стенд: Moody Blues. Способность стенда: Повторение: равномерная защита. Бафф при призыве: скорость +5%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 68% урона; на обычной арене получаемый урон снижен на 4% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Moody Blues", desc: "Нажми SUPER, чтобы призвать Moody Blues как отдельное хитбокс-сердечко. Повторение: равномерная защита. Бафф: скорость +5%; хитбокс радиусом 11 принимает на себя 68% урона при столкновении; на обычной арене получаемый урон снижается на 4%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Перемотка была, а кто пульт спрятал?", masteryTitleId: "mastery_character_2300a2c7", masteryTitleIcon: "✦"},
        {
            "name": "Ризотто Неро (Metallica)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 90,
            "hp": 107,
            "speed": 1.3,
            "statusAbility": {
                "type": "bleed",
                "value": 0.1,
                "desc": "+10% урона через кровотечение"
            },
            "desc": "Лидер команды убийц, управляющий железом в крови противника. Стенд: Metallica. Способность стенда: Железо: мощное поглощение урона. Бафф при призыве: скорость +9%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 82% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Metallica", desc: "Нажми SUPER, чтобы призвать Metallica как отдельное хитбокс-сердечко. Железо: мощное поглощение урона. Бафф: скорость +9%; хитбокс радиусом 13 принимает на себя 82% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Хозяин металлической крови", masteryTitleId: "mastery_character_8204a5ad", masteryTitleIcon: "✦"},
        {
            "name": "Нарцисо Анасуй (Diver Down)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 84,
            "hp": 110,
            "speed": 1.25,
            "ability": {
                "type": "damageReduction",
                "value": 0.08,
                "desc": "−8% получаемого урона"
            },
            "desc": "Стенд Diver Down проникает внутрь объектов и перестраивает их изнутри. Стенд: Diver Down. Способность стенда: Внутренний удар: плотный защитный контур. Бафф при призыве: скорость +16%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 79% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Diver Down", desc: "Нажми SUPER, чтобы призвать Diver Down как отдельное хитбокс-сердечко. Внутренний удар: плотный защитный контур. Бафф: скорость +16%; хитбокс радиусом 12 принимает на себя 79% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Мастер внутреннего разрушения", masteryTitleId: "mastery_character_5242dc76", masteryTitleIcon: "✦"},
        {
            "name": "Диего Брандо (Scary Monsters)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 92,
            "hp": 109,
            "speed": 1.6,
            "ability": {
                "type": "critChance",
                "value": 0.13,
                "desc": "+13% шанс критического удара"
            },
            "desc": "Альтернативный Диего из Steel Ball Run, способный превращать себя и других в динозавров. Стенд: Scary Monsters. Способность стенда: Динозавр: высокая скорость. Бафф при призыве: скорость +23%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 70% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Scary Monsters", desc: "Нажми SUPER, чтобы призвать Scary Monsters как отдельное хитбокс-сердечко. Динозавр: высокая скорость. Бафф: скорость +23%; хитбокс радиусом 11 принимает на себя 70% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Король динозавров", masteryTitleId: "mastery_character_0a9f8e17", masteryTitleIcon: "✦"},
        {
            "name": "Винегар Доппио",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 81,
            "hp": 106,
            "speed": 1.25,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.4,
                "desc": "12% шанс нанести ×1,4 урона"
            },
            "desc": "Вторая личность босса мафии. Его звонки и резкие выпады делают его опасным даже без полного контроля над King Crimson. Стенд: Epitaph. Способность стенда: Предвидение: снижает получаемый урон. Бафф при призыве: скорость +12%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 80% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Epitaph", desc: "Нажми SUPER, чтобы призвать Epitaph как отдельное хитбокс-сердечко. Предвидение: снижает получаемый урон. Бафф: скорость +12%; хитбокс радиусом 12 принимает на себя 80% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Предсказывает будущее, но всё равно нервничает", masteryTitleId: "mastery_character_a20f31c8", masteryTitleIcon: "✦"},
        {
            "name": "Джонни Джостар (Tusk Act 2)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 94,
            "hp": 113,
            "speed": 1.4,
            "ability": {
                "type": "bossDamage",
                "value": 0.1,
                "desc": "+10% урона боссам"
            },
            "desc": "Вторая форма Tusk использует вращение, оставляя движущиеся отверстия и пробивая защиту. Стенд: Tusk ACT 2. Способность стенда: Спираль: быстрый и плотный хитбокс. Бафф при призыве: скорость +14%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 76% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Tusk ACT 2", desc: "Нажми SUPER, чтобы призвать Tusk ACT 2 как отдельное хитбокс-сердечко. Спираль: быстрый и плотный хитбокс. Бафф: скорость +14%; хитбокс радиусом 11 принимает на себя 76% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Маникюр, который пробивает измерения", masteryTitleId: "mastery_character_e519e45a", masteryTitleIcon: "✦"},
        {
            "name": "Рай Маме́дзуку (Doggy Style)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 82,
            "hp": 112,
            "speed": 1.3,
            "ability": {
                "type": "damageAura",
                "value": 0.06,
                "desc": "+6% урона команде"
            },
            "desc": "Опытный проводник и союзник Джоске из JoJolion. Его стенд разделяет тело на нити. Стенд: Doggy Style. Способность стенда: Разделение тела: широкий защитный контур. Бафф при призыве: скорость +9%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 73% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Doggy Style", desc: "Нажми SUPER, чтобы призвать Doggy Style как отдельное хитбокс-сердечко. Разделение тела: широкий защитный контур. Бафф: скорость +9%; хитбокс радиусом 13 принимает на себя 73% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Садовник-следопыт", masteryTitleId: "mastery_character_2e454a41", masteryTitleIcon: "✦"},
        {
            "name": "Пако Лабурентес (The Hustle)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 70,
            "hp": 97,
            "speed": 1.35,
            "ability": {
                "type": "damageReduction",
                "value": 0.06,
                "desc": "−6% получаемого урона"
            },
            "desc": "Боец команды Джодио, способный контролировать мышцы и крепко цепляться за поверхности. Стенд: The Hustle. Способность стенда: Мышечная броня: стенд хорошо гасит удары. Бафф при призыве: скорость +12%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 78% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — The Hustle", desc: "Нажми SUPER, чтобы призвать The Hustle как отдельное хитбокс-сердечко. Мышечная броня: стенд хорошо гасит удары. Бафф: скорость +12%; хитбокс радиусом 11 принимает на себя 78% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Мышцы, что держат удар", masteryTitleId: "mastery_character_80b694d4", masteryTitleIcon: "✦"},
        {
            "name": "Джодио Джостар (November Rain)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 94,
            "hp": 117,
            "speed": 1.35,
            "ability": {
                "type": "bossDamage",
                "value": 0.08,
                "desc": "+8% урона боссам"
            },
            "desc": "Главный герой The JOJOLands. Его стенд создаёт тяжёлые капли дождя, которые бьют по выбранной области. Стенд: November Rain. Способность стенда: Тяжёлые капли: большая зона перехвата. Бафф при призыве: скорость +18%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 75% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — November Rain", desc: "Нажми SUPER, чтобы призвать November Rain как отдельное хитбокс-сердечко. Тяжёлые капли: большая зона перехвата. Бафф: скорость +18%; хитбокс радиусом 12 принимает на себя 75% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Чёрный дождь Гавайев", masteryTitleId: "mastery_character_eea8b56b", masteryTitleIcon: "✦"},
        {
            "name": "Йошикаге Кира (JoJolion)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 86,
            "hp": 104,
            "speed": 1.45,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.4,
                "desc": "12% шанс нанести ×1,4 урона"
            },
            "desc": "Другая версия Киры из JoJolion, врач и пользователь Killer Queen в альтернативной вселенной. Стенд: Killer Queen (JoJolion). Способность стенда: Взрывной щит: сильная защита. Бафф при призыве: скорость +10%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 81% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Killer Queen (JoJolion)", desc: "Нажми SUPER, чтобы призвать Killer Queen (JoJolion) как отдельное хитбокс-сердечко. Взрывной щит: сильная защита. Бафф: скорость +10%; хитбокс радиусом 12 принимает на себя 81% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Тихая бомба Морио", masteryTitleId: "mastery_character_47798593", masteryTitleIcon: "✦"},
        {
            "name": "Джошу Хигашиката (Nut King Call)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 68,
            "hp": 94,
            "speed": 1.05,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.08,
                "mult": 1.3,
                "desc": "8% шанс нанести ×1,3 урона"
            },
            "desc": "Член семьи Хигашиката, чей стенд умеет разбирать объекты на части при помощи болтов и гаек. Стенд: Nut King Call. Способность стенда: Болты: стойкий хитбокс. Бафф при призыве: скорость +6%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 72% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Nut King Call", desc: "Нажми SUPER, чтобы призвать Nut King Call как отдельное хитбокс-сердечко. Болты: стойкий хитбокс. Бафф: скорость +6%; хитбокс радиусом 12 принимает на себя 72% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Мастер гаек", masteryTitleId: "mastery_character_33823f15", masteryTitleIcon: "✦"},
        {
            "name": "Моб (100%: ярость)",
            "universe": "Mob 100",
            "damage": 74,
            "hp": 105,
            "speed": 1.35,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.12,
                "mult": 1.35,
                "desc": "12% шанс нанести ×1,35 урона"
            },
            "desc": "Моб достигает предела одной из своих эмоций, высвобождая огромную психическую силу.",
            masteryTitle: "Вышел из себя, а себя там уже нет", masteryTitleId: "mastery_character_420e8829", masteryTitleIcon: "✦"
        },
        {
            "name": "Тодзиро Сэки (Босс Claw)",
            "universe": "Mob 100",
            "damage": 69,
            "hp": 112,
            "speed": 1.25,
            "ability": {
                "type": "damageReduction",
                "value": 0.08,
                "desc": "−8% получаемого урона"
            },
            "desc": "Опытный боец организации Claw, опасный благодаря силе и боевому опыту.",
            masteryTitle: "Лидер организации Claw", masteryTitleId: "mastery_character_7e233aa9", masteryTitleIcon: "✦"
        },
        {
            "name": "Вермейль (обычная демоническая форма)",
            "universe": "Vermeil in Gold",
            "damage": 76,
            "hp": 108,
            "speed": 1.4,
            "ability": {
                "type": "critChance",
                "value": 0.11,
                "desc": "+11% шанс критического удара"
            },
            "desc": "Могущественный демон, призванный Алто. Обладает разрушительной магией и высокой физической силой.",
            masteryTitle: "Демонесса золотой печати", masteryTitleId: "mastery_character_2547f1c7", masteryTitleIcon: "✦"
        },
        {
            "name": "ДИО (The World, часть 3)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Дио в финальной битве Stardust Crusaders. The World способен останавливать время. Стенд: The World. Способность стенда: Остановка: крепкий защитный стенд. Бафф при призыве: скорость +16%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 80% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — The World", desc: "Нажми SUPER, чтобы призвать The World как отдельное хитбокс-сердечко. Остановка: крепкий защитный стенд. Бафф: скорость +16%; хитбокс радиусом 12 принимает на себя 80% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Остановивший время", masteryTitleId: "mastery_character_ae3d0958", masteryTitleIcon: "✦"}
    ],
    "Легендарная": [
        { name: "Сукуна (15 пальцев)", universe: "JJK", damage: 105, hp: 95, speed: 2.4, statusAbility: { type: "bleed", value: 0.08, desc: "Кровотечение +8%" }, desc: "Король Проклятий. Высокий урон и кровотечение, добавляющее 8% урона.",
            masteryTitle: "Пальцев много, уважения ноль", masteryTitleId: "mastery_character_f9ba75bb", masteryTitleIcon: "✦" },
        { name: "Кудзан", universe: "One Piece", damage: 85, hp: 120, speed: 1.8, statusAbility: { type: "freezeStacks", value: 2, desc: "Заморозка +2" }, desc: "Бывший адмирал Аокидзи. Замораживает врага — +2 клика до ответной атаки.",
            masteryTitle: "Ушёл за мороженым и заморозил карьеру", masteryTitleId: "mastery_character_4781ff88", masteryTitleIcon: "✦" },
        { name: "Йонко Шанкс", universe: "One Piece", damage: 95, hp: 90, speed: 3.0, ability: { type: "critChance", value: 0.15, desc: "+15% крит" }, desc: "Рыжеволосый император. +15% к шансу крита.",
            masteryTitle: "Рыжий, чьё хаки глушит море", masteryTitleId: "mastery_character_7169cf8f", masteryTitleIcon: "✦" },
        { name: "Хоумлендер", universe: "The Boys", damage: 115, hp: 125, speed: 2.5, ability: { type: "bossDamage", value: 0.18, desc: "+18% боссам" }, statusAbility: { type: "fire", damage: 10, duration: 3000, desc: "Лазеры 10/сек" }, desc: "Лидер Семёрки. +18% урона боссам и поджигает врага лазерами — 10 урона/2 сек.",
            masteryTitle: "Мам, я правда хороший", masteryTitleId: "mastery_character_ec0b8151", masteryTitleIcon: "✦" },
        { name: "Наруто (Барион)", universe: "Naruto", damage: 100, hp: 120, speed: 2.8, ability: { type: "damageAura", value: 0.10, desc: "+10% урона" }, statusAbility: { type: "bleed", value: 0.1, desc: "Кровотечение +10%" }, desc: "Режим Бариона. +10% урона команде и +10% урона через кровотечение.",
            masteryTitle: "Лис на последнем проценте батареи", masteryTitleId: "mastery_character_b787d3c8", masteryTitleIcon: "✦" },
        { name: "Гоку (UI)", universe: "DB", damage: 110, hp: 110, speed: 3.5, ability: { type: "damageAura", value: 0.13, desc: "+13% урона" }, desc: "Ультра Инстинкт. +13% урона всей команде.",
            masteryTitle: "Тело дерётся, мозг всё ещё на обеде", masteryTitleId: "mastery_character_12730a30", masteryTitleIcon: "✦" },
        { name: "Вегета (UE)", universe: "DB", damage: 115, hp: 105, speed: 3.2, ability: { type: "damageAura", value: 0.20, desc: "+20% урона, +10% враг", damageTakenMod: 0.10 }, desc: "Ультра Эго. +20% урона команде, но враг бьёт на 10% сильнее.",
            masteryTitle: "Гордость выше уровня мощности", masteryTitleId: "mastery_character_49bb0faf", masteryTitleIcon: "✦" },
        { name: "Мадара", universe: "Naruto", damage: 120, hp: 100, speed: 2.2, ability: { type: "damageReduction", value: 0.05, desc: "-5% урона" }, statusAbility: { type: "freezeStacks", value: 1, desc: "Заморозка +1" }, desc: "Призрак Учиха. -5% получаемого урона и заморозка +1.",
            masteryTitle: "Призрак Учиха", masteryTitleId: "mastery_character_c99d8ed5", masteryTitleIcon: "✦" },
        { name: "Гарп (Galaxy impact)", universe: "One Piece", damage: 105, hp: 140, speed: 2.0, ability: { type: "damageAura", value: 0.20, desc: "+20% урона" }, desc: "Кулак галактики. +20% урона всей команде.",
            masteryTitle: "Семейный разговор на мощности галактики", masteryTitleId: "mastery_character_aa8e9ffa", masteryTitleIcon: "✦" },
        { name: "Омни-Мэн", universe: "Invincible", damage: 120, hp: 130, speed: 2.6, ability: { type: "damageAura", value: 0.12, desc: "+12% урона" }, statusAbility: { type: "bleed", value: 0.15, desc: "Кровотечение +15%" }, desc: "Нолан Грейсон. +12% урона команде и +15% урона через кровотечение.",
            masteryTitle: "Отец года. Земля не согласна", masteryTitleId: "mastery_character_cb333525", masteryTitleIcon: "✦" },
        { name: "Ло (Пробужденный)", universe: "One Piece", damage: 105, hp: 145, speed: 2.4, ability: { type: "healOnWin", percent: 0.03, desc: "+3% HP" }, statusAbility: { type: "shock", chance: 0.10, desc: "Электричество 10%" }, desc: "Пробуждённый фрукт. Лечит 3% HP при победе и 10% шанс шока.",
            masteryTitle: "Операция прошла успешно, сюжет не выжил", masteryTitleId: "mastery_character_5f4efb55", masteryTitleIcon: "✦" },
        
,
{ name: "Солдатик (Прайм)", universe: "The Boys", patchId: "the_boys", damage: 120, hp: 180, speed: 1.5, ability: { type: "damageReduction", value: 0.12, desc: "−12% получаемого урона" }, statusAbility: { type: "shock", chance: 0.10, desc: "10% шанс радиоактивного шока" }, desc: "Солдатик — крайне выносливый тяжеловес. Он способен накапливать радиоактивную энергию и высвобождать разрушительный импульс.",
            masteryTitle: "Щит, переживший эпоху", masteryTitleId: "mastery_character_4f98567a", masteryTitleIcon: "✦" },
        { name: "Чёрный Нуар II (Комиксный)", universe: "The Boys", patchId: "the_boys", damage: 105, hp: 155, speed: 1.7, ability: { type: "damageReduction", value: 0.10, desc: "−10% получаемого урона" }, desc: "Новый Чёрный Нуар обладает сверхсилой, стойкостью и способностью летать. Он опасен в ближнем бою, хотя характером отличается от оригинала.",
            masteryTitle: "Новая тень Семёрки", masteryTitleId: "mastery_character_667d0e47", masteryTitleIcon: "✦" },
        
        { name: "Тек Найт (Охотник)", universe: "The Boys", patchId: "the_boys", damage: 95, hp: 130, speed: 1.6, ability: { type: "critChance", value: 0.10, desc: "+10% шанс критического удара" }, desc: "Тек Найт — детектив с усиленными чувствами, дедукцией и боевыми навыками. Чем больше он успел изучить противника, тем опаснее.",
            masteryTitle: "Детектив, видящий каждую улику", masteryTitleId: "mastery_character_eda56fd1", masteryTitleIcon: "✦" },
        {"name":"Зоро (Тайм скип)","universe":"One Piece","patchId":"one_piece","damage":118,"hp":130,"speed":2.2,"ability":{"type":"critChance","value":0.2,"desc":"+20% шанс критического удара"},"statusAbility":{"type":"bleed","value":0.1,"desc":"+10% урона через кровотечение"},"desc":"Зоро после таймскипа хоть как то развивался не считая Вано?.",
            masteryTitle: "Заблудился и случайно нашёл Новый Свет", masteryTitleId: "mastery_character_bdab4cac", masteryTitleIcon: "✦"},
        {"name":"Санджи (Вано)","universe":"One Piece","patchId":"one_piece","damage":104,"hp":116,"speed":2.7,"ability":{"type":"damageReduction","value":0.1,"desc":"−10% получаемого урона"},"desc":"Санджи в рейд-костюме получает маскировку, повышенную скорость и усиленную защиту.",
            masteryTitle: "Адская нога Вано", masteryTitleId: "mastery_character_7ca2ea05", masteryTitleIcon: "✦"},
        {"name":"Согекинг (0.000000000001%)","universe":"One Piece","patchId":"one_piece","damage":125,"hp":120,"speed":2.6,"ability":{"type":"bossDamage","value":0.18,"desc":"+18% урона боссам"},"desc":"Друг бога Усоппа.",
            masteryTitle: "Герой острова снайперов", masteryTitleId: "mastery_character_b4d41abb", masteryTitleIcon: "✦"},
        {"name":"Старичок Рэйли","universe":"One Piece","patchId":"one_piece","damage":112,"hp":115,"speed":2.5,"ability":{"type":"damageAura","value":0.12,"desc":"+12% урона команде"},"desc":"Тёмный король, правая рука Роджера. Опыт и хаки усиливают весь отряд.",
            masteryTitle: "Тёмный король", masteryTitleId: "mastery_character_3d8859fe", masteryTitleIcon: "✦"},
        {"name":"Козуки Одэн","universe":"One Piece","patchId":"one_piece","damage":115,"hp":132,"speed":2.2,"ability":{"type":"bossDamage","value":0.2,"desc":"+20% урона боссам"},"desc":"Легендарный самурай Вано, чьи два меча оставили шрамы даже на Кайдо.",
            masteryTitle: "Сварился за Вано, а не в супе", masteryTitleId: "mastery_character_ef427ea3", masteryTitleIcon: "✦"},
        {"name":"Монки Д. Драгон","universe":"One Piece","patchId":"one_piece","damage":104,"hp":136,"speed":2,"ability":{"type":"damageAura","value":0.15,"desc":"+15% урона команде"},"desc":"Загадочный лидер Революционной армии и отец Луффи. Его роль — менять ход мировой истории.",
            masteryTitle: "Отец, который ушёл за хлебом", masteryTitleId: "mastery_character_7fcde9da", masteryTitleIcon: "✦"},
        {"name":"Сенгоку (Будда)","universe":"One Piece","patchId":"one_piece","damage":115,"hp":145,"speed":1.8,"ability":{"type":"damageReduction","value":0.17,"desc":"−17% получаемого урона"},"desc":"Бывший адмирал флота. Мифический зоан Будды даёт огромную силу и стойкость.",
            masteryTitle: "Золотой Будда флота", masteryTitleId: "mastery_character_b0dec777", masteryTitleIcon: "✦"},
        {"name":"Бартоломью Кума ","universe":"One Piece","patchId":"one_piece","damage":102,"hp":155,"speed":1.7,"ability":{"type":"damageReduction","value":0.15,"desc":"−15% получаемого урона"},"desc":"Кума использует лапы отталкивания, отражая атаки и выдерживая тяжёлые столкновения.",
            masteryTitle: "Тиран с сердцем спасителя", masteryTitleId: "mastery_character_76e47590", masteryTitleIcon: "✦"},
        {"name":"Катакури","universe":"One Piece","patchId":"one_piece","damage":112,"hp":120,"speed":2.2,"ability":{"type":"damageReduction","value":0.12,"desc":"−12% получаемого урона"},"statusAbility":{"type":"freezeStacks","value":1,"desc":"Моти связывает врага: +1 клик до контратаки"},"desc":"Катакури пробуждает силу моти и превращает окружение в продолжение собственных атак.",
            masteryTitle: "Предвидит всё, кроме плохого доната", masteryTitleId: "mastery_character_0d1d7e0a", masteryTitleIcon: "✦"},
        {"name":"Кид (Пробуждение: Дамнед Панк)","universe":"One Piece","patchId":"one_piece","damage":108,"hp":145,"speed":2.4,"ability":{"type":"damageMultChance","chance":0.24,"mult":1.35,"desc":"24% шанс нанести ×1,35 урона"},"desc":"Пробуждённый Кид собирает металл магнитными силами и выпускает разрушительный Дамнед Панк.",
            masteryTitle: "Собрал металлолом и решил, что он Йонко", masteryTitleId: "mastery_character_4be47764", masteryTitleIcon: "✦"},
        {"name":"Рёкугю (Арамаки)","universe":"One Piece","patchId":"one_piece","damage":100,"hp":140,"speed":2,"ability":{"type":"healOnWin","percent":0.04,"desc":"+4% HP после победы"},"desc":"Адмирал леса управляет растительной жизнью и восстанавливается, поглощая жизненную силу.",
            masteryTitle: "Деревце, которому выдали адмиральский погон", masteryTitleId: "mastery_character_c508349d", masteryTitleIcon: "✦"},
        {"name":" Серафима S-Хок","universe":"One Piece","patchId":"one_piece","damage":85,"hp":55,"speed":1.6,"ability":{"type":"damageReduction","value":0.1,"desc":"−10% получаемого урона"},"desc":"Вроде мелкий, а вроде мелкий.",
            masteryTitle: "Михок с AliExpress, зато с лазерами", masteryTitleId: "mastery_character_26be2662", masteryTitleIcon: "✦"},
        {"name":"Марко (Феникс)","universe":"One Piece","patchId":"one_piece","damage":35,"hp":62,"speed":1.7,"ability":{"type":"healOnWin","percent":0.03,"desc":"+3% HP после победы"},"desc":"Командир первой дивизии Белоуса. Феникс-форма даёт ему регенерацию и воздушную мобильность.",
            masteryTitle: "Феникс Белоуса", masteryTitleId: "mastery_character_96b6d57b", masteryTitleIcon: "✦"},
        {"name":"Кизару ","universe":"One Piece","patchId":"one_piece","damage":76,"hp":75,"speed":2.6,"ability":{"type":"damageMultChance","chance":0.25,"mult":1.35,"desc":"25% шанс нанести ×1,35 урона"},"desc":"Адмирал света. Мгновенные перемещения и лазерные удары обеспечивают высокую скорость.",
            masteryTitle: "Свет, который нельзя догнать", masteryTitleId: "mastery_character_4f758f13", masteryTitleIcon: "✦"},
        {"name":"Шарлотта Линлин (Большая Мамочка)","universe":"One Piece","patchId":"one_piece","damage":82,"hp":95,"speed":1.8,"ability":{"type":"damageAura","value":0.08,"desc":"+8% урона всей команде"},"desc":"Императрица моря усиливает отряд своим присутствием и атакует силами души и хоумисов.",
            masteryTitle: "Императрица душ", masteryTitleId: "mastery_character_d02f7d11", masteryTitleIcon: "✦"},
        {"name":"Луччи (Пробуждение CP0)","universe":"One Piece","patchId":"one_piece","damage":80,"hp":87,"speed":2.3,"ability":{"type":"critChance","value":0.14,"desc":"+14% шанс критического удара"},"statusAbility":{"type":"bleed","value":0.06,"desc":"+6% урона через кровотечение"},"desc":"Пробуждённый зоан Роб Луччи после таймскипа. Более быстрая и опасная версия агента CP9.",
            masteryTitle: "Король хищников CP0", masteryTitleId: "mastery_character_d4409747", masteryTitleIcon: "✦"},
        { name: "Татсумаки (Торнадо ужаса)", universe: "OPM", patchId: "one_punch_man", damage: 115, hp: 125, speed: 2.5, ability: { type: "damageAura", value: 0.07, desc: "+7% урона всей команде" }, desc: "Одна из сильнейших героинь S-класса. Её телекинез позволяет подавлять множество противников и усиливает давление всей команды.",
            masteryTitle: "Маленькая, злая, парит недвижимость", masteryTitleId: "mastery_character_3d44e195", masteryTitleIcon: "✦" },
        { name: "Флэши Флэш", universe: "OPM", patchId: "one_punch_man", damage: 104, hp: 100, speed: 3.0, ability: { type: "critChance", value: 0.08, desc: "+8% к шансу критического удара" }, desc: "Невероятно быстрый ниндзя S-класса, побеждающий за счёт скорости, точности и серии смертельных ударов.",
            masteryTitle: "Ниндзюцу: скип катсцены", masteryTitleId: "mastery_character_89133ba5", masteryTitleIcon: "✦" },
        { name: "Гароу (Чудовищная форма)", universe: "OPM", patchId: "one_punch_man", damage: 120, hp: 135, speed: 2.6, ability: { type: "damageMultChance", chance: 0.18, mult: 1.25, desc: "18% шанс нанести ×1,25 урона" }, desc: "Гароу после серьёзного превращения в монстра. Это его не-космическая форма: опасный мастер адаптации, но не божественный противник.",
            masteryTitle: "Учит адаптацию методом побоев", masteryTitleId: "mastery_character_119f04ad", masteryTitleIcon: "✦" },
        { name: "Гокецу", universe: "OPM", patchId: "one_punch_man", damage: 112, hp: 155, speed: 2.0, ability: { type: "bossDamage", value: 0.10, desc: "+10% урона боссам" }, desc: "Боец Ассоциации монстров с чудовищной физической мощью и мастерством единоборств. Особенно эффективен в схватках с боссами.",
            masteryTitle: "Чемпион чудовищного турнира", masteryTitleId: "mastery_character_edc471d6", masteryTitleIcon: "✦" },
        { name: "Старшая Многоножка", universe: "OPM", patchId: "one_punch_man", damage: 100, hp: 190, speed: 1.35, ability: { type: "damageReduction", value: 0.09, desc: "−9% получаемого урона" }, desc: "Гигантский драконий монстр с несколькими прочными панцирями. Его специализация — выдерживать тяжёлые атаки.",
            masteryTitle: "Сантоножка, тысяча ботинок не включена", masteryTitleId: "mastery_character_dccfdb22", masteryTitleIcon: "✦" },
        { name: "Орочи (Король монстров)", universe: "OPM", patchId: "one_punch_man", damage: 120, hp: 170, speed: 1.85, statusAbility: { type: "fire", damage: 6, duration: 3000, desc: "Поток энергии: 6 урона в секунду" }, desc: "Король монстров обладает огромной мощью и энергетическими атаками. Сильная легендарная карта, но без божественной формы.",
            masteryTitle: "Шеф монстров, который сам боится меню", masteryTitleId: "mastery_character_4215e144", masteryTitleIcon: "✦" },
        { name: "Платиновый Сперм", universe: "OPM", patchId: "one_punch_man", damage: 118, hp: 145, speed: 2.8, ability: { type: "critChance", value: 0.08, desc: "+8% к шансу критического удара" }, desc: "Слияние огромного числа клеток создаёт невероятно быстрого монстра драконьего уровня. Его скорость повышает вероятность критических ударов.",
            masteryTitle: "Слияние, не прошедшее проверку качества", masteryTitleId: "mastery_character_164d49cd", masteryTitleIcon: "✦" },
        { name: "Бласт", universe: "OPM", patchId: "one_punch_man", damage: 118, hp: 140, speed: 2.6, ability: { type: "damageReduction", value: 0.08, desc: "−8% получаемого урона" }, statusAbility: { type: "freezeStacks", value: 1, desc: "Пространственные порталы: +1 клик до контратаки" }, desc: "Герой №1 S-класса использует пространственные порталы и силу, связанную с измерениями. Сильнейшая карта разлома, но ниже космических и божественных форм.",
            masteryTitle: "Спасает вселенные удалённо", masteryTitleId: "mastery_character_37e2d378", masteryTitleIcon: "✦" },
        {
            "name": "Джотаро Куджо (часть 3: Star Platinum)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Пик Джотаро во время путешествия к Дио. Star Platinum невероятно силён, точен и быстр. Стенд: Star Platinum. Способность стенда: Точный удар: сильное поглощение урона. Бафф при призыве: скорость +15%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 83% урона; на обычной арене получаемый урон снижен на 10% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Star Platinum", desc: "Нажми SUPER, чтобы призвать Star Platinum как отдельное хитбокс-сердечко. Точный удар: сильное поглощение урона. Бафф: скорость +15%; хитбокс радиусом 13 принимает на себя 83% урона при столкновении; на обычной арене получаемый урон снижается на 10%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Звёздный платиновый кулак", masteryTitleId: "mastery_character_7743715e", masteryTitleIcon: "✦"},
        {
            "name": "Джотаро Куджо (часть 4)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Джотаро спустя годы после битвы с Дио: опытный стенд-юзер, помогающий команде в Морио. Стенд: Star Platinum: The World. Способность стенда: Остановка времени: скорость и защита. Бафф при призыве: скорость +19%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 79% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Star Platinum: The World", desc: "Нажми SUPER, чтобы призвать Star Platinum: The World как отдельное хитбокс-сердечко. Остановка времени: скорость и защита. Бафф: скорость +19%; хитбокс радиусом 12 принимает на себя 79% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Спокойствие, скрывающее остановку времени", masteryTitleId: "mastery_character_11577279", masteryTitleIcon: "✦"},
        {
            "name": "Джоске Хигашиката (часть 4: Crazy Diamond)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 123,
            "hp": 222,
            "speed": 1.85,
            "ability": {
                "type": "healOnWin",
                "percent": 0.05,
                "desc": "+5% HP после победы"
            },
            "minRebirth": 1,
            "desc": "Главный герой Diamond is Unbreakable. Crazy Diamond восстанавливает повреждённые предметы и тела. Стенд: Crazy Diamond. Способность стенда: Восстановление: широкий защитный контур. Бафф при призыве: скорость +12%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 77% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Crazy Diamond", desc: "Нажми SUPER, чтобы призвать Crazy Diamond как отдельное хитбокс-сердечко. Восстановление: широкий защитный контур. Бафф: скорость +12%; хитбокс радиусом 13 принимает на себя 77% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Алмаз, что чинит всё кроме себя", masteryTitleId: "mastery_character_34494f1b", masteryTitleIcon: "✦"},
        {
            "name": "Йошикаге Кира (часть 4: Killer Queen)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Серийный убийца Морио, превращающий прикоснувшиеся объекты в бомбы с помощью Killer Queen. Стенд: Killer Queen. Способность стенда: Первая бомба: очень сильный блок урона. Бафф при призыве: скорость +13%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 82% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Killer Queen", desc: "Нажми SUPER, чтобы призвать Killer Queen как отдельное хитбокс-сердечко. Первая бомба: очень сильный блок урона. Бафф: скорость +13%; хитбокс радиусом 12 принимает на себя 82% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Тихая жизнь серийного убийцы", masteryTitleId: "mastery_character_59b5710c", masteryTitleIcon: "✦"},
        {
            "name": "Джорно Джованна (Gold Experience)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 137,
            "hp": 218,
            "speed": 2.1,
            "ability": {
                "type": "healOnWin",
                "percent": 0.05,
                "desc": "+5% HP после победы"
            },
            "minRebirth": 2,
            "desc": "Джорно создаёт живые организмы с Gold Experience и стремится стать боссом, защищающим невинных. Стенд: Gold Experience. Способность стенда: Жизненная энергия: сбалансированный щит. Бафф при призыве: скорость +16%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 76% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Gold Experience", desc: "Нажми SUPER, чтобы призвать Gold Experience как отдельное хитбокс-сердечко. Жизненная энергия: сбалансированный щит. Бафф: скорость +16%; хитбокс радиусом 12 принимает на себя 76% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Золотая воля жизни", masteryTitleId: "mastery_character_6a702823", masteryTitleIcon: "✦"},
        {
            "name": "Дьяволо (King Crimson)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Босс Passione, который видит будущее и стирает короткие промежутки времени. Стенд: King Crimson. Способность стенда: Стирание времени: быстрый уход от атак. Бафф при призыве: скорость +21%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 80% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — King Crimson", desc: "Нажми SUPER, чтобы призвать King Crimson как отдельное хитбокс-сердечко. Стирание времени: быстрый уход от атак. Бафф: скорость +21%; хитбокс радиусом 11 принимает на себя 80% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Император стёртого времени", masteryTitleId: "mastery_character_a7ea4a04", masteryTitleIcon: "✦"},
        {
            "name": "Джолин Куджо (Stone Free)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 128,
            "hp": 228,
            "speed": 2,
            "ability": {
                "type": "damageReduction",
                "value": 0.1,
                "desc": "−10% получаемого урона"
            },
            "minRebirth": 2,
            "desc": "Джолин использует Stone Free, превращая своё тело в нити для защиты, ловушек и дальних ударов. Стенд: Stone Free. Способность стенда: Нити: широкий контур защиты. Бафф при призыве: скорость +17%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 77% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Stone Free", desc: "Нажми SUPER, чтобы призвать Stone Free как отдельное хитбокс-сердечко. Нити: широкий контур защиты. Бафф: скорость +17%; хитбокс радиусом 12 принимает на себя 77% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Свободная нить Стоун-Оушен", masteryTitleId: "mastery_character_1f16c3f2", masteryTitleIcon: "✦"},
        {
            "name": "Уэзер Репорт (часть 6)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Мастер погоды, управляющий атмосферными явлениями и опасными погодными эффектами. Стенд: Weather Report. Способность стенда: Погода: расширенная область перехвата. Бафф при призыве: скорость +13%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 78% урона; на обычной арене получаемый урон снижен на 7% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Weather Report", desc: "Нажми SUPER, чтобы призвать Weather Report как отдельное хитбокс-сердечко. Погода: расширенная область перехвата. Бафф: скорость +13%; хитбокс радиусом 13 принимает на себя 78% урона при столкновении; на обычной арене получаемый урон снижается на 7%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Погода, ставшая оружием", masteryTitleId: "mastery_character_0af8d254", masteryTitleIcon: "✦"},
        {
            "name": "Энрико Пуччи (Whitesnake)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 132,
            "hp": 203,
            "speed": 2,
            "ability": {
                "type": "bossDamage",
                "value": 0.15,
                "desc": "+15% урона боссам"
            },
            "minRebirth": 2,
            "desc": "Священник и главный антагонист Stone Ocean на раннем этапе своего плана. Whitesnake извлекает диски памяти и стендов. Стенд: Whitesnake. Способность стенда: Извлечение дисков: сильная защита. Бафф при призыве: скорость +10%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 81% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Whitesnake", desc: "Нажми SUPER, чтобы призвать Whitesnake как отдельное хитбокс-сердечко. Извлечение дисков: сильная защита. Бафф: скорость +10%; хитбокс радиусом 12 принимает на себя 81% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Вынул диск и потерял чек", masteryTitleId: "mastery_character_11fd79ff", masteryTitleIcon: "✦"},
        {
            "name": "Джироламо Джеппели (Gyro Zeppeli)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 134,
            "hp": 207,
            "speed": 1.9,
            "ability": {
                "type": "critChance",
                "value": 0.16,
                "desc": "+16% шанс критического удара"
            },
            "minRebirth": 2,
            "desc": "Мастер вращения и стальных сфер, участвующий в гонке Steel Ball Run. Стенд: Ball Breaker. Способность стенда: Золотое вращение: высокая скорость. Бафф при призыве: скорость +20%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 71% урона; на обычной арене получаемый урон снижен на 5% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Ball Breaker", desc: "Нажми SUPER, чтобы призвать Ball Breaker как отдельное хитбокс-сердечко. Золотое вращение: высокая скорость. Бафф: скорость +20%; хитбокс радиусом 10 принимает на себя 71% урона при столкновении; на обычной арене получаемый урон снижается на 5%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Стальной шар мастера вращения", masteryTitleId: "mastery_character_3040c412", masteryTitleIcon: "✦"},
        {
            "name": "Джонни Джостар (Tusk Act 3)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 151,
            "hp": 213,
            "speed": 2,
            "ability": {
                "type": "bossDamage",
                "value": 0.15,
                "desc": "+15% урона боссам"
            },
            "minRebirth": 3,
            "desc": "Продвинутая форма Tusk открывает вращающиеся порталы и позволяет атаковать через пространственные отверстия. Стенд: Tusk ACT 3. Способность стенда: Пространственные отверстия: защита + скорость. Бафф при призыве: скорость +18%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 78% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Tusk ACT 3", desc: "Нажми SUPER, чтобы призвать Tusk ACT 3 как отдельное хитбокс-сердечко. Пространственные отверстия: защита + скорость. Бафф: скорость +18%; хитбокс радиусом 12 принимает на себя 78% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Золотой гвоздь вращения", masteryTitleId: "mastery_character_c1176d17", masteryTitleIcon: "✦"},
        {
            "name": "Фанни Валентайн (D4C)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 156,
            "hp": 224,
            "speed": 1.9,
            "ability": {
                "type": "resurrect",
                "chance": 0.05,
                "desc": "5% шанс воскреснуть"
            },
            "minRebirth": 3,
            "desc": "Президент США и владелец Dirty Deeds Done Dirt Cheap, перемещающийся между параллельными мирами. Стенд: Dirty Deeds Done Dirt Cheap. Способность стенда: Параллельные миры: очень крепкий стенд. Бафф при призыве: скорость +13%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 82% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Dirty Deeds Done Dirt Cheap", desc: "Нажми SUPER, чтобы призвать Dirty Deeds Done Dirt Cheap как отдельное хитбокс-сердечко. Параллельные миры: очень крепкий стенд. Бафф: скорость +13%; хитбокс радиусом 13 принимает на себя 82% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Президент между измерениями", masteryTitleId: "mastery_character_f343ec18", masteryTitleIcon: "✦"},
        {
            "name": "Джоске Хигашиката (JoJolion: Soft & Wet)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Герой JoJolion, использующий пузыри Soft & Wet для кражи свойств у объектов. Стенд: Soft & Wet. Способность стенда: Пузырьки: снижение урона и разгон. Бафф при призыве: скорость +17%; хитбокс-сердечко радиусом 12 перехватывает атаки и принимает на себя 79% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Soft & Wet", desc: "Нажми SUPER, чтобы призвать Soft & Wet как отдельное хитбокс-сердечко. Пузырьки: снижение урона и разгон. Бафф: скорость +17%; хитбокс радиусом 12 принимает на себя 79% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Мягкая вода невозможного", masteryTitleId: "mastery_character_bae03c40", masteryTitleIcon: "✦"},
        {
            "name": "Джобин Хигашиката (Speed King)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Амбициозный член семьи Хигашиката, способный накапливать тепло в предметах и людях. Стенд: Speed King. Способность стенда: Тепло: скоростной стенд. Бафф при призыве: скорость +22%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 73% урона; на обычной арене получаемый урон снижен на 6% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Speed King", desc: "Нажми SUPER, чтобы призвать Speed King как отдельное хитбокс-сердечко. Тепло: скоростной стенд. Бафф: скорость +22%; хитбокс радиусом 10 принимает на себя 73% урона при столкновении; на обычной арене получаемый урон снижается на 6%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Король перегретого времени", masteryTitleId: "mastery_character_77443046", masteryTitleIcon: "✦"},
        {
            "name": "Диего Брандо (The World)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 153,
            "hp": 205,
            "speed": 2.35,
            "ability": {
                "type": "critChance",
                "value": 0.18,
                "desc": "+18% шанс критического удара"
            },
            "minRebirth": 3,
            "desc": "Альтернативный Диего из Steel Ball Run, получивший стенд The World в финальной гонке. Стенд: The World (Diego). Способность стенда: Альтернативная остановка: высокий разгон. Бафф при призыве: скорость +25%; хитбокс-сердечко радиусом 11 перехватывает атаки и принимает на себя 77% урона; на обычной арене получаемый урон снижен на 8% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — The World (Diego)", desc: "Нажми SUPER, чтобы призвать The World (Diego) как отдельное хитбокс-сердечко. Альтернативная остановка: высокий разгон. Бафф: скорость +25%; хитбокс радиусом 11 принимает на себя 77% урона при столкновении; на обычной арене получаемый урон снижается на 8%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Дино-император остановленного времени", masteryTitleId: "mastery_character_21303ebd", masteryTitleIcon: "✦"},
        {
            "name": "Энрико Пуччи (C-Moon)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 146,
            "hp": 213,
            "speed": 2.25,
            "ability": {
                "type": "damageReduction",
                "value": 0.1,
                "desc": "−10% получаемого урона"
            },
            "minRebirth": 3,
            "desc": "Промежуточная эволюция стенда Пуччи, создающая гравитационные аномалии и выворачивающая цели наизнанку. Стенд: C-Moon. Способность стенда: Гравитация: широкая зона и мощный блок. Бафф при призыве: скорость +17%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 81% урона; на обычной арене получаемый урон снижен на 9% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — C-Moon", desc: "Нажми SUPER, чтобы призвать C-Moon как отдельное хитбокс-сердечко. Гравитация: широкая зона и мощный блок. Бафф: скорость +17%; хитбокс радиусом 13 принимает на себя 81% урона при столкновении; на обычной арене получаемый урон снижается на 9%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Гравитация святого", masteryTitleId: "mastery_character_f7e4b0cd", masteryTitleIcon: "✦"},
        {
            "name": "Джонни Джостар (Tusk Act 1)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Начальная форма Tusk, пробуждённая через вращение и силу Святых останков. Стенд: Tusk ACT 1. Способность стенда: Спираль I: лёгкое ускорение. Бафф при призыве: скорость +8%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 69% урона; на обычной арене получаемый урон снижен на 4% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Tusk ACT 1", desc: "Нажми SUPER, чтобы призвать Tusk ACT 1 как отдельное хитбокс-сердечко. Спираль I: лёгкое ускорение. Бафф: скорость +8%; хитбокс радиусом 10 принимает на себя 69% урона при столкновении; на обычной арене получаемый урон снижается на 4%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Первая вращающаяся пуля", masteryTitleId: "mastery_character_bd1be3f9", masteryTitleIcon: "✦"},
        {
            "name": "Моб (???%: потеря контроля)",
            "universe": "Mob 100",
            "damage": 132,
            "hp": 208,
            "speed": 1.8,
            "ability": {
                "type": "damageReduction",
                "value": 0.12,
                "desc": "−12% получаемого урона"
            },
            "minRebirth": 1,
            "desc": "Состояние, в котором подавленные силы Моба выходят наружу и действуют почти независимо от его сознания.",
            masteryTitle: "???%: мама сказала, что пора спать", masteryTitleId: "mastery_character_b0b6fbdd", masteryTitleIcon: "✦"
        },
        {
            "name": "Вермейль (полная сила демона)",
            "universe": "Vermeil in Gold",
            "damage": 128,
            "hp": 202,
            "speed": 1.85,
            "ability": {
                "type": "damageMultChance",
                "chance": 0.14,
                "mult": 1.45,
                "desc": "14% шанс нанести ×1,45 урона"
            },
            "minRebirth": 1,
            "desc": "Вермейль раскрывает больше своей демонической мощи, становясь одной из наиболее опасных участниц магических сражений.",
            masteryTitle: "Золотая демонесса истинной силы", masteryTitleId: "mastery_character_97115f1a", masteryTitleIcon: "✦"
        }
    ],
    "Секретная": [
        {
            name: "Годжо", universe: "JJK", damage: 360, hp: 155, speed: 3.4, sellPrice: 2800,
            ability: { type: "critChance", value: 0.90, desc: "90% шанс крита (урон x2)" },
            statusAbility: { type: "gojoDodge", chance: 0.30, desc: "30% шанс полностью отменить входящий урон" },
            desc: "Секретный Сатору Годжо: огромный урон, но здоровье ниже среднего. На 4★ обычные атаки критуют с шансом 90%; на 3★ есть 30% шанс полностью отменить входящий удар.",
            superAbility: { name: "SUPER: БЕЗГРАНИЧНОСТЬ", desc: "Красный создаёт красную сферу и запускает её вверх, отталкивая пули; при попадании по уникальному боссу наносит 5% максимального HP и отбрасывает его. Синий создаёт синюю сферу, которая притягивает блоки и уникального босса. Бесконечность на 3 секунды уничтожает блоки вокруг игрока, но вдвое замедляет его. При 100% Проклятой энергии Красный и Синий заменяются Фиолетовым: Годжо соединяет их и выпускает луч длиной примерно в половину арены, уничтожающий блоки на пути и наносящий уникальному боссу 15% максимального HP.", passive: false },
            masteryTitle: "Nah, I’d win", masteryTitleId: "mastery_character_d5ce1394", masteryTitleIcon: "✦"
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
            },
            masteryTitle: "Шутник", masteryTitleId: "mastery_character_bbc2c00c", masteryTitleIcon: "✦"
        },
        { 
            name: "Луффи: Ника, Бог Солнца", universe: "One Piece", damage: 150, hp: 200, speed: 3.8, sellPrice: 1500, minRebirth: 2, 
            ability: { type: "bossDamage", value: 0.30, desc: "+30% боссам", damageReduction: 0.10 }, 
            desc: "Пробуждение дьявольского фрукта. +30% урона боссам и -10% получаемого урона.",
            superAbility: { name: "SUPER: ОСВОБОЖДЕНИЕ", desc: "Сердце становится огромным и быстрым. Получаешь больше урона, но бьёшь больнее. «Я и так уже смеюсь!»", passive: false },
            masteryTitle: "Нежданчик", masteryTitleId: "mastery_character_8612be69", masteryTitleIcon: "✦"
        },
        { 
            name: "Космический Гароу", universe: "OPM", damage: 250, hp: 400, speed: 3.5, sellPrice: 2800, minRebirth: 4, 
            ability: { type: "scaleWithWins", value: 0.01, desc: "+1% силы/волна" }, 
            desc: "Урон растёт на 1% за каждую победу. После смерти накопленный бонус сохраняется, только если в последних 5 победах команда ни разу не содержала Космического Гароу; если он участвовал хотя бы в одной из этих побед, бонус сбрасывается. После ребёрна бонус сбрасывается.",
            superAbility: { name: "SUPER: ПОТОК ВСЕЛЕННОЙ", desc: "Отматывает время на 2 секунды назад. Телепорт с неуязвимостью. Круто же, да?", passive: false },
            masteryTitle: "Я скопирую всё", masteryTitleId: "mastery_character_819e38ce", masteryTitleIcon: "✦"
        },
        { 
            name: "Сайтама", universe: "OPM", damage: 200, hp: 300, speed: 4.0, sellPrice: 1500, minRebirth: 3, 
            ability: { type: "oneShot", chance: 0.05, desc: "5% ваншот" }, 
            desc: "Лысый плащ. 5% шанс убить врага с одного удара.",
            superAbility: { name: "SUPER: ОБЫЧНЫЙ УДАР", desc: "Огромный красный кулак летит вверх, сметая все атаки. Шанс 1% ваншотнуть босса с SUPER атаки.", passive: false },
            masteryTitle: "Гонять лысого", masteryTitleId: "mastery_character_dc8f9149", masteryTitleIcon: "✦"
        },
        { 
            name: "Борос", universe: "OPM", damage: 180, hp: 350, speed: 3.2, sellPrice: 1400, minRebirth: 2, 
            ability: { type: "healOnWin", percent: 0.05, desc: "+5% HP" }, 
            desc: "Владыка вселенной. Лечит 5% HP при победе.",
            superAbility: { name: "SUPER: РЕГЕНЕРАЦИЯ", desc: "Медленно восстанавливает HP, но замедляет персонажа. А вот жалкие людишки так не могут! Хе-хе-хе", passive: false },
            masteryTitle: "Нашел не того", masteryTitleId: "mastery_character_078ba4df", masteryTitleIcon: "✦"
        },
        { 
            name: "Бог Усопп", universe: "One Piece", damage: 250, hp: 400, speed: 2.5, sellPrice: 2000, minRebirth: 3, 
            ability: { type: "resurrect", chance: 0.05, desc: "5% воскрес" }, 
            desc: "Великий воин морей. 5% шанс воскреснуть при смерти.",
            superAbility: { name: "SUPER: ЛОЖЬ СТАНОВИТСЯ ПРАВДОЙ", desc: "Полная неуязвимость на 3 секунды, но потом 2 секунды оглушения. А вы ему верите?", passive: false },
            masteryTitle: "Официальный свидетель своих подвигов", masteryTitleId: "mastery_character_f4b6b32b", masteryTitleIcon: "✦"
        },
        { 
            name: "Зено", universe: "DB", damage: 300, hp: 500, speed: 3.0, sellPrice: 3000, minRebirth: 4, 
            ability: { type: "zenoCheckpoint", desc: "10% след. чекпоинт" }, 
            statusAbility: { type: "fatigueResist", value: 0.30, desc: "-30% усталости" }, 
            desc: "Царь всего. 10% шанс открыть следующий чекпоинт и -30% усталости.",
            superAbility: { name: "SUPER: СТИРАНИЕ", desc: "Уничтожает ВСЕ атаки на экране и наносит 10% урона боссу. Скучно -_-", passive: false },
            masteryTitle: "Кнопка удаление", masteryTitleId: "mastery_character_d5c14556", masteryTitleIcon: "✦"
        },
        { 
            name: "Анти-спираль", universe: "GL", damage: 280, hp: 450, speed: 2.8, sellPrice: 2500, minRebirth: 2, 
            ability: { type: "damageReduction", value: 0.30, desc: "-30% урона" }, 
            desc: "Враг всего живого. Уменьшает получаемый урон на 30%.",
            superAbility: { name: "SUPER: СЖАТИЕ ПРОСТРАНСТВА", desc: "Увеличивает арену на 30%! Ну вроде :/", passive: false },
            masteryTitle: "Сильнее всех вместе взятых", masteryTitleId: "mastery_character_c9faaee6", masteryTitleIcon: "✦"
        },
        { 
            name: "Молодой Гарп", universe: "One Piece", damage: 260, hp: 380, speed: 3.3, sellPrice: 2500, minRebirth: 3, 
            ability: { type: "damageAura", value: 0.25, desc: "+25% урона" }, 
            desc: "Гарп в расцвете сил. +25% урона всей команде.",
            superAbility: { name: "SUPER: ГАЛАКТИЧЕСКИЙ УДАР", desc: "Заряжает Хаки 1.2 секунды, затем БА-БАХ! АоЕ взрыв, очистка атак и 5% урона боссу. После удара — бафф Хаки на 6 секунд. Правда, после этого у босса всего лишь шишка. А атака была такой зрелищной....", passive: false },
            masteryTitle: "Дед до травмы", masteryTitleId: "mastery_character_245ef0f3", masteryTitleIcon: "✦"
        },
        { 
            name: "Им (Правитель)", universe: "One Piece", damage: 290, hp: 450, speed: 2.2, sellPrice: 3000, minRebirth: 5, 
            ability: { type: "bossDamage", value: 0.20, desc: "+20% боссам" }, 
            desc: "Тайный правитель мира. +20% урона боссам.",
            superAbility: { name: "SUPER: ТЕНЕВОЕ ПРАВЛЕНИЕ", desc: "Тёмная аура вокруг сердца. Атаки, касающиеся ауры, имеют 50% шанс быть уничтоженными. Но сердце замедлено на 30%. Это для тех, кто не умеет уварачиваться. Для тебя, хех!", passive: false },
            masteryTitle: "Арендодатель пустого трона", masteryTitleId: "mastery_character_8ce0b805", masteryTitleIcon: "✦"
        },
        { 
            name: "Космический Дэнди", universe: "Space Dandy", damage: 200, hp: 650, speed: 2.7, sellPrice: 2200, minRebirth: 3, 
            ability: { type: "critChance", value: 0.15, desc: "+15% крит" }, 
            statusAbility: { type: "shock", chance: 0.20, desc: "Шок 20%" }, 
            desc: "Постоянный клиент космического фансервис-кафе «Груди»",
            superAbility: { name: "SUPER: КОСМИЧЕСКАЯ УДАЧА", desc: "Рулетка! 80% шанс получить крутой бафф (лечение, урон x2, очистка, скорость, щит и т.д.) и 20% шанс получить смешной дебафф. «Повезёт? Не повезёт? Дэнди знает!»", passive: false },
            masteryTitle: "Постоянный клиент космического ресторана \"Груди\"", masteryTitleId: "mastery_character_b3fbd772", masteryTitleIcon: "✦"
        },
        { 
            name: "Кайдо", universe: "One Piece", damage: 300, hp: 500, speed: 2.4, sellPrice: 3000, minRebirth: 4, 
            ability: { type: "bossDouble", desc: "x2 урон (босс)" }, 
            desc: "Сильнейший в мире. При битве с боссом наносит удвоенный урон.",
            superAbility: { name: "SUPER: ДЫХАНИЕ РАЗРУШЕНИЯ", desc: "Пьёт пиво 2 секунды, затем впадает в ЯРОСТЬ на 10 секунд: хил 10%, поглощение 30% урона, +80% урона, скорость x1.5. Но управление ИНВЕРТИРУЕТСЯ! После — похмелье (замедление). Как можно во время боя пить?", passive: false },
            masteryTitle: "Главный дебошир", masteryTitleId: "mastery_character_65a99bbc", masteryTitleIcon: "✦"
        },
        { 
            name: "Император Марк", universe: "Invincible", damage: 310, hp: 500, speed: 3.1, sellPrice: 3000, minRebirth: 5, 
            ability: { type: "bossSupport", desc: "+15% урона (босс)" }, 
            statusAbility: { type: "bleed", value: 0.12, desc: "Кровотечение +12%" }, 
            desc: "Марк спустя 500 лет. +15% урона команде при битве с боссом, +12% урона через кровотечение.",
            superAbility: { name: "ПАССИВКА: НЕПОБЕДИМАЯ ВОЛЯ", desc: "Два анти-ваншота за арену! При смерти воскресает с 25% HP. Ну проще говоря - сюжетная броня!", passive: true },
            masteryTitle: "Побеждаю сильнейших, но отлетаю от бомжей", masteryTitleId: "mastery_character_f98dde87", masteryTitleIcon: "✦"
        },
        { 
            name: "Деку (100%)", universe: "MHA", damage: 280, hp: 450, speed: 3.6, sellPrice: 2800, minRebirth: 4, 
            ability: { type: "bossDoubleSelf", desc: "x2 урон (босс), -30% на 10 волн" }, 
            desc: "Полная сила One For All. Удваивает урон при битве с боссом, но ослабляет на 30% на следующие 10 волн.",
            superAbility: { name: "SUPER: ПОЛНОЕ 100% ПОКРЫТИЕ", desc: "Скорость x3, урон x2! Но каждую секунду теряешь 2% HP. Зелёные молнии повсюду! А без Эри ты бы включил 100%?", passive: false },
            masteryTitle: "Спичка", masteryTitleId: "mastery_character_75294802", masteryTitleIcon: "✦"
        },
        { 
            name: "Всемогущий (прайм)", universe: "MHA", damage: 300, hp: 480, speed: 3.4, sellPrice: 3000, minRebirth: 4, 
            ability: { type: "damageAura", value: 0.15, desc: "+15% урона" }, 
            statusAbility: { type: "bossDamageAura", value: 0.10, desc: "+25% (босс)" }, 
            desc: "Символ мира в прайме. +15% урона команде и +25% при битве с боссом.",
            superAbility: { name: "SUPER: СИМВОЛ МИРА", desc: "Хитбокс x2, урон x3 на 15 секунд! Но потом теряешь 50% HP и НАВСЕГДА замедляешься в 3 раза. ПЛЮЮЮС УЛЬТРААААА!", passive: false },
            masteryTitle: "Символ мира", masteryTitleId: "mastery_character_7334dc86", masteryTitleIcon: "✦"
        },
        { 
            name: "ДИО Over Heaven", universe: "JoJo", damage: 280, hp: 420, speed: 3.1, sellPrice: 3500, minRebirth: 4,
            ability: { type: "oneShot", chance: 0.03, desc: "3% шанс мгновенно уничтожить врага, даже босса" },
            statusAbility: { type: "shock", chance: 0.15, desc: "15% шанс шока" },
            extraStatus: [],
            waveRegen: 0.01,
            desc: "Heaven Ascension DIO. Слабее по голой силе, зато The World Over Heaven даёт 4 дорогих тактических навыка: остановка времени, хил, возврат на позицию 1 секунду назад и агрессивные снаряды.",
            superAbility: { name: "SUPER: THE WORLD OVER HEAVEN", desc: "4 отдельных навыка с общей шкалой ЭНЕРГИИ 0–100. Энергия набирается от нанесённого урона. TIME STOP — 2.5с, HEAL — 10%, TELEPORT — 1с назад + 0.5с стопа, AGGRESSIVE — снаряды уничтожают друг друга.", passive: false },
            masteryTitle: "Переписал реальность", masteryTitleId: "mastery_character_293d5a88", masteryTitleIcon: "✦"
        },
        { 
            name: "Белоус", universe: "One Piece", damage: 400, hp: 250, speed: 2.0, sellPrice: 800, minRebirth: 0,
            unsellable: true,
            ability: { type: "whitebeardSpecial", desc: "Пассивно: 10% поглощения урона, 3% шанс воскреснуть, +1% HP за волну и бонус комбо 2% за серию из 5 ударов. При 4★+: регенерация 2% HP каждые 5 с. УДАР: перезарядка 30 с → ЦУНАМИ: окно 20 с, запуск с задержкой 1,5 с." },
            desc: "Эдвард Ньюгейт. Сильнейший человек в мире. Нельзя получить через гачу — только победив супер-Белоуса.",
            masteryTitle: "Отец, которого никто не выбирал", masteryTitleId: "mastery_character_e4d9361e", masteryTitleIcon: "✦"
        }
,
                        {"name":"Зоро (Вано: Король ада)","universe":"One Piece","patchId":"one_piece","damage":230,"hp":250,"speed":3,"ability":{"type":"bossDamage","value":0.25,"desc":"+25% урона боссам"},"statusAbility":{"type":"bleed","value":0.12,"desc":"+12% урона через кровотечение"},"desc":"Пиковая версия Зоро с продвинутым хаки короля и клинками, покрытыми чёрным пламенем.",
            masteryTitle: "Заблудился даже в собственном доме", masteryTitleId: "mastery_character_9c5fbdcb", masteryTitleIcon: "✦"},
        {"name":"Чёрная Борода (Два дьявольских плода)","universe":"One Piece","patchId":"one_piece","damage":280,"hp":310,"speed":2.5,"ability":{"type":"damageAura","value":0.12,"desc":"+12% урона команде"},"statusAbility":{"type":"shock","chance":0.12,"desc":"12% шанс сотрясающего шока"},"desc":"Тич сочетает тьму Ями-Ями и разрушительную силу Гура-Гура. Отдельная версия после получения второго плода.",
            masteryTitle: "Два фрукта, ноль мозгов", masteryTitleId: "mastery_character_7f0673ab", masteryTitleIcon: "✦"},
        {"name":"Гол Д. Роджер (Камусари)","universe":"One Piece","patchId":"one_piece","damage":265,"hp":275,"speed":3.1,"ability":{"type":"bossDamage","value":0.3,"desc":"+30% урона боссам"},"statusAbility":{"type":"bleed","value":0.08,"desc":"+8% урона через хаки"},"desc":"Роджер выпускает Камусари — стремительный удар хаки, прославивший Короля пиратов.",
            masteryTitle: "Король пиратов и безработных", masteryTitleId: "mastery_character_8062e6f3", masteryTitleIcon: "✦"},
                {
            "name": "Джорно Джованна (Gold Experience Requiem)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Requiem-форма Gold Experience, способная возвращать действия и волю противника к нулю. Стенд: Gold Experience Requiem. Способность стенда: Возврат к нулю: максимальная защита и радиус. Бафф при призыве: скорость +14%; хитбокс-сердечко радиусом 14 перехватывает атаки и принимает на себя 84% урона; на обычной арене получаемый урон снижен на 10% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Gold Experience Requiem", desc: "Нажми SUPER, чтобы призвать Gold Experience Requiem как отдельное хитбокс-сердечко. Возврат к нулю: максимальная защита и радиус. Бафф: скорость +14%; хитбокс радиусом 14 принимает на себя 84% урона при столкновении; на обычной арене получаемый урон снижается на 10%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Обнулил даже свой будильник", masteryTitleId: "mastery_character_96ba4ab3", masteryTitleIcon: "✦"},
        {
            "name": "Энрико Пуччи (Made in Heaven)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 300,
            "hp": 390,
            "speed": 3.2,
            "ability": {
                "type": "critChance",
                "value": 0.2,
                "desc": "+20% шанс критического удара"
            },
            "minRebirth": 4,
            "desc": "Финальная эволюция стенда Пуччи, ускоряющая время и движение всего мира. Стенд: Made in Heaven. Способность стенда: Ускорение: максимальная скорость. Бафф при призыве: скорость +30%; хитбокс-сердечко радиусом 10 перехватывает атаки и принимает на себя 66% урона; на обычной арене получаемый урон снижен на 3% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Made in Heaven", desc: "Нажми SUPER, чтобы призвать Made in Heaven как отдельное хитбокс-сердечко. Ускорение: максимальная скорость. Бафф: скорость +30%; хитбокс радиусом 10 принимает на себя 66% урона при столкновении; на обычной арене получаемый урон снижается на 3%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "В рай попадет никто", masteryTitleId: "mastery_character_c36af983", masteryTitleIcon: "✦"},
        {
            "name": "Джонни Джостар (Tusk Act 4)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 345,
            "hp": 420,
            "speed": 2.8,
            "ability": {
                "type": "bossDamage",
                "value": 0.22,
                "desc": "+22% урона боссам"
            },
            "minRebirth": 4,
            "desc": "Высшая форма Tusk, использующая бесконечное вращение для пробивания почти любой защиты. Стенд: Tusk ACT 4. Способность стенда: Бесконечное вращение: высокий блок урона. Бафф при призыве: скорость +21%; хитбокс-сердечко радиусом 13 перехватывает атаки и принимает на себя 83% урона; на обычной арене получаемый урон снижен на 10% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Tusk ACT 4", desc: "Нажми SUPER, чтобы призвать Tusk ACT 4 как отдельное хитбокс-сердечко. Бесконечное вращение: высокий блок урона. Бафф: скорость +21%; хитбокс радиусом 13 принимает на себя 83% урона при столкновении; на обычной арене получаемый урон снижается на 10%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Крутит сильнее стиральной машины", masteryTitleId: "mastery_character_59148ac8", masteryTitleIcon: "✦"},
        {
            "name": "Карс (Высшее существо)",
            "universe": "JoJo", "patchId": "jojo",
            "damage": 310,
            "hp": 490,
            "speed": 2.65,
            "ability": {
                "type": "karsAdaptation",
                "baseDamageReduction": 0.22,
                "desc": "Постоянно: −22% получаемого урона. Адаптация: серия попаданий в течение 2 секунд даёт +35% скорости и ещё 35% снижения входящего урона; 8 секунд без попаданий дают +50% наносимого урона; при HP ниже 40% восстанавливает 2% максимального HP каждые 4 секунды до 40%."
            },
            "minRebirth": 4,
            "desc": "Карс достигает совершенной формы, сочетая силу и способности практически всех живых существ. Постоянно снижает получаемый урон на 22%. Адаптация: серия попаданий в течение 2 секунд даёт +35% скорости и ещё 35% снижения входящего урона; 8 секунд без попаданий дают +50% наносимого урона; при HP ниже 40% восстанавливает 2% максимального HP каждые 4 секунды до 40%.",
            masteryTitle: "Совершенное существо с 400iQ которое делает тупые ошибки", masteryTitleId: "mastery_character_b9b093cc", masteryTitleIcon: "✦"
        },
        {
            "name": "Тору (Wonder of U)",
            "universe": "JoJo", "patchId": "jojo",
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
            "desc": "Пользователь Wonder of U, чья сила направляет бедствия на тех, кто преследует его или стенд. Стенд: Wonder of U. Способность стенда: Катастрофа: защита и максимальный радиус. Бафф при призыве: скорость +7%; хитбокс-сердечко радиусом 14 перехватывает атаки и принимает на себя 83% урона; на обычной арене получаемый урон снижен на 10% пока стенд активен."
        ,
        superAbility: { name: "SUPER: ПРИЗЫВ СТЕНДА — Wonder of U", desc: "Нажми SUPER, чтобы призвать Wonder of U как отдельное хитбокс-сердечко. Катастрофа: защита и максимальный радиус. Бафф: скорость +7%; хитбокс радиусом 14 принимает на себя 83% урона при столкновении; на обычной арене получаемый урон снижается на 10%. Нажми SUPER ещё раз, чтобы убрать стенд.", passive: false },
            masteryTitle: "Причина твоих проблем с интернетом", masteryTitleId: "mastery_character_c797933e", masteryTitleIcon: "✦"}
    ],
    "Эволюционная": [
        { name: "Луффи : Король пиратов", universe: "One Piece", damage: 1200, hp: 2000, speed: 4.5, minRebirth: 5, ability: { type: "bossDamage", value: 0.50, desc: "+50% боссам", bossReduction: 0.40 }, unsellable: true, desc: "Король пиратов. +50% урона боссам и -40% получаемого урона при битве с боссом. Чтобы получить: соберите 5 разных Луффи в команду (ровно 5 карт) и победите босса 500 волны.",
            masteryTitle: "Король пиратов, но сначала поесть", masteryTitleId: "mastery_character_04b0528f", masteryTitleIcon: "✦" },
        { name: "Сайтама/Гароу", universe: "Эволюция", damage: 1500, hp: 2500, speed: 5.0, minRebirth: 5, ability: { type: "oneShot", chance: 0.15, desc: "15% ваншот" }, statusAbility: { type: "scaleWithWins", value: 0.03, desc: "+3% силы/волна" }, unsellable: true, desc: "Слияние сильнейших. 15% шанс ваншота и +3% силы за каждую волну. Чтобы получить: ваншотните 2000 врагов способностью Сайтамы (Сайтама + Космический Гароу в команде).",
            masteryTitle: "Один бьёт с одного удара, второй ищет патч", masteryTitleId: "mastery_character_73126a34", masteryTitleIcon: "✦" },
        { name: "Гарп/Кудзан", universe: "Эволюция", damage: 1400, hp: 2200, speed: 3.5, minRebirth: 5, ability: { type: "damageAura", value: 0.40, desc: "+40% урона" }, statusAbility: { type: "absoluteFreeze", value: 0.5, desc: "-50% урона" }, unsellable: true, desc: "Учитель и ученик. +40% урона команде и -50% получаемого урона. Чтобы получить: накопите 1 000 000 000 урона (Молодой Гарп + Кудзан в команде).",
            masteryTitle: "Дедушкин кулак против кондиционера", masteryTitleId: "mastery_character_a219f9e1", masteryTitleIcon: "✦" },
        { name: "Семёрка", universe: "The Boys", damage: 1600, hp: 2600, speed: 4.0, minRebirth: 5, ability: { type: "sevenSpecial", desc: "V x3, хил 5%/волна", healOnWave: 0.05, damageReduction: 0.10 }, statusAbility: { type: "blind", value: 2, desc: "Ослепление +2" }, extraStatus: [{ type: "fire", damage: 10, duration: 3000 }, { type: "shock", chance: 0.15 }], unsellable: true, desc: "Вся Семёрка вместе. Препарат V утраивает баффы, хил 5% за волну, ослепление, лазеры и электричество. Чтобы получить: Хоумлендер, Звёздочка, Мреющий, Чёрный Нуар, Пучино, Королева Мэйв с V и 20 ур.",
            masteryTitle: "Семь супергероев, ноль моральных ориентиров", masteryTitleId: "mastery_character_451350ae", masteryTitleIcon: "✦" },
        { name: "Уильям Фрэнсис", universe: "Invincible", damage: 800, hp: 1200, speed: 3.0, minRebirth: 5, ability: { type: "copyEnemyChance", chance: 0.15, desc: "15% копирует врага" }, unsellable: true, desc: "Копирует характеристики врага с шансом 15%. Чтобы получить: победите босса 2000 волны только с обычными картами (6 шт).",
            masteryTitle: "Супергерой с арендованной личностью", masteryTitleId: "mastery_character_2d8fe918", masteryTitleIcon: "✦" }
    ],
    "Босс": [
        { name: "Охотник за головами", universe: "Боссы", damage: 150, hp: 300, speed: 2.0, sellPrice: 1000, minRebirth: 0, ability: { type: "bossDamage", value: 0.10, desc: "+10% боссам" }, desc: "Особая карта босса финальной волны. +10% урона боссам.",
            masteryTitle: "Контракт закрыл, звёзды зажали", masteryTitleId: "mastery_character_db327e2e", masteryTitleIcon: "✦" },
        { name: "Король Демонов", universe: "Боссы", damage: 200, hp: 400, speed: 1.5, sellPrice: 2000, minRebirth: 1, ability: { type: "damageAura", value: 0.05, desc: "+5% урона" }, desc: "Особая карта босса 100-й волны. +5% урона команде.",
            masteryTitle: "Финальный босс, который опять ничего не дропнул", masteryTitleId: "mastery_character_4d1aca24", masteryTitleIcon: "✦" },
        { name: "Маджин Буу", universe: "Боссы", damage: 250, hp: 500, speed: 1.8, sellPrice: 3000, minRebirth: 2, statusAbility: { type: "bleed", value: 0.10, desc: "Кровотечение +10%" }, desc: "Особая карта босса 200-й волны. +10% урона через кровотечение.",
            masteryTitle: "Розовая жвачка апокалипсиса", masteryTitleId: "mastery_character_df581c55", masteryTitleIcon: "✦" },
        { name: "Король Пиратов", universe: "Боссы", damage: 400, hp: 800, speed: 2.2, sellPrice: 5000, minRebirth: 3, ability: { type: "bossDamage", value: 0.20, desc: "+20% боссам" }, desc: "Особая карта, связанная с Путеводной Звездой. +20% урона боссам.",
            masteryTitle: "Кандидат на трон, ищет табуретку", masteryTitleId: "mastery_character_61472353", masteryTitleIcon: "✦" }
    ],
    "Пасхалка": [
        { name: "Пельмешка", universe: "Кухня", damage: 35, hp: 60, speed: 1.0, unsellable: true, ability: { type: "luckAura", value: 0.50, desc: "+50% удачи" }, desc: "Вкусный пельмень. +50% к удаче.",
            masteryTitle: "Картофельный император удачи", masteryTitleId: "mastery_character_fb275189", masteryTitleIcon: "✦" },
        { name: "Попугай Соня", universe: "Зоопарк", damage: 3, hp: 5, speed: 0.8, unsellable: true, ability: { type: "deathBonus", value: 0.30, desc: "+30% звёзд" }, desc: "После смерти даёт +30% к накопленным звёздам.",
            masteryTitle: "Пернатый оракул зоопарка", masteryTitleId: "mastery_character_a14c37eb", masteryTitleIcon: "✦" },
        { name: "DrinkTea2Win", universe: "Кухня", damage: 20, hp: 550, speed: 6, unsellable: true, ability: { type: "fatigueResist", value: 0.50, desc: "-50% усталости" }, desc: "Бодрящий напиток. Победа... в чашке? Снижает набор усталости на 50%.",
            masteryTitle: "Повелитель чайной паузы", masteryTitleId: "mastery_character_5c2c21e1", masteryTitleIcon: "✦" }
    ]
};


/* Character mastery titles are authored alongside each card in this file. */
const MB_MASTERY_TITLE_CATALOG_BY_NAME = Object.create(null);
const MB_MASTERY_TITLE_CATALOG_BY_ID = Object.create(null);
Object.values(customCardTemplates).flat().forEach(function (template) {
    if (!template || !template.name || !template.masteryTitleId || !template.masteryTitle) return;
    if (!MB_MASTERY_TITLE_CATALOG_BY_NAME[template.name]) {
        var title = {
            id: template.masteryTitleId,
            label: template.masteryTitle,
            icon: template.masteryTitleIcon || "✦",
            characterName: template.name,
            isMasteryTitle: true,
            description: "Доведи мастерство карты «" + template.name + "» до 6★.",
            unlocked: function (stats) {
                return !!stats && Array.isArray(stats.achievement_title_unlocks) &&
                    stats.achievement_title_unlocks.indexOf(this.id) !== -1;
            }
        };
        MB_MASTERY_TITLE_CATALOG_BY_NAME[template.name] = title;
        MB_MASTERY_TITLE_CATALOG_BY_ID[title.id] = title;
    }
});
window.MBGetMasteryTitleForCard = function (cardOrName) {
    var name = typeof cardOrName === "string" ? cardOrName :
        (cardOrName && typeof cardOrName.name === "string" ? cardOrName.name : "");
    return MB_MASTERY_TITLE_CATALOG_BY_NAME[name] || null;
};
window.MBGetMasteryTitleCatalog = function () {
    return Object.keys(MB_MASTERY_TITLE_CATALOG_BY_NAME).map(function (name) {
        return MB_MASTERY_TITLE_CATALOG_BY_NAME[name];
    });
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
    1500: { name: "Анти-Спираль", hpMult: 42.5, dmgMult: 4.2, dialogue: "Твоя воля ничего не значит перед бесконечностью. Склоняйся перед Анти-Спиралью.", enemyStatus: { type: "freezeStacks", value: 2 }, arenaTypes: [0,1,4,5,7,8,9,10] },
    1600: { name: "Гатс (Берсерк)", hpMult: 40, dmgMult: 4.0, dialogue: "Я буду бороться... до последнего вздоха.", enemyStatus: { type: "bleed", value: 0.5 }, arenaTypes: [1,3,5,7,9] },
    1700: { name: "Драконий Император", hpMult: 38.7, dmgMult: 3.8, dialogue: "Моя чешуя крепче любой брони.", enemyStatus: { type: "fire", damage: 20, duration: 2000 }, arenaTypes: [0,2,5,9,10] },
    1800: { name: "Великий Маг", hpMult: 30.7, dmgMult: 4.5, dialogue: "Магия — это искусство разрушения.", enemyStatus: { type: "shock", chance: 0.7 }, arenaTypes: [1,4,6,7,10] },
    1900: { name: "Луффи (Гир 5)", hpMult: 42.7, dmgMult: 4.2, dialogue: "Я стану Королём Пиратов!", enemyStatus: { type: "blind", value: 3 }, arenaTypes: [0,3,5,8,9] },
    2000: { name: "Живой Камень: Супер-версия", hpMult: 54.7, dmgMult: 5.2, dialogue: "Ты пережил две тысячи волн. Теперь попробуй выстоять передо мной.", enemyStatus: { type: "shock", chance: 0.65 }, arenaTypes: [0,1,2,3,4,5,6,7,8,9,10], isSpecial: true },
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
    "DrinkTea2Win": { type: "card", rarity: "Пасхалка", tpl: "DrinkTea2Win", points: 0 }
};

const worldMusicNotes = {};
