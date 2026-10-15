// Стандартный призыв стенда для JoJo-персонажей в боевых аренах.
(function () {
    "use strict";

    var STAND_PROFILES = Object.create(null);
    STAND_PROFILES["Игги (The Fool)"] = { stand: "The Fool", color: "#d4c0a1", speed: 1.08, damageFactor: 0.28, arenaDamageMult: 0.94, radius: 12, trait: "Песчаный щит: большой запас защиты" };
    STAND_PROFILES["Маунтин Тим"] = { stand: "Oh! Lonesome Me", color: "#c5b7a8", speed: 1.13, damageFactor: 0.34, arenaDamageMult: 0.96, radius: 10, trait: "Лассо: средний радиус перехвата" };
    STAND_PROFILES["Шигекиё Янгу (Шигечи)"] = { stand: "Harvest", color: "#ffd45e", speed: 1.06, damageFactor: 0.31, arenaDamageMult: 0.93, radius: 14, trait: "Рой Harvest: самый широкий хитбокс" };
    STAND_PROFILES["Хол Хорс (Emperor)"] = { stand: "Emperor", color: "#e4bb72", speed: 1.17, damageFactor: 0.36, arenaDamageMult: 0.97, radius: 10, trait: "Точная стрельба: упор на скорость" };
    STAND_PROFILES["Н'Дул (Geb)"] = { stand: "Geb", color: "#4b8cce", speed: 1.04, damageFactor: 0.22, arenaDamageMult: 0.91, radius: 13, trait: "Водяной щит: сильное поглощение урона" };
    STAND_PROFILES["Коити Хиросэ (Echoes Act 1)"] = { stand: "Echoes ACT 1", color: "#a9f1cf", speed: 1.09, damageFactor: 0.37, arenaDamageMult: 0.96, radius: 11, trait: "Звуковая волна: лёгкий разгон" };
    STAND_PROFILES["Пески (Beach Boy)"] = { stand: "Beach Boy", color: "#d6a56f", speed: 1.11, damageFactor: 0.26, arenaDamageMult: 0.95, radius: 13, trait: "Леска: расширенная зона перехвата" };
    STAND_PROFILES["Векапипо (Wrecking Ball)"] = { stand: "Wrecking Ball", color: "#b6e4ee", speed: 1.03, damageFactor: 0.24, arenaDamageMult: 0.98, radius: 12, trait: "Стальные шары: плотная защита" };
    STAND_PROFILES["Кейчо Нидзимура (Bad Company)"] = { stand: "Bad Company", color: "#8bc6a4", speed: 1.07, damageFactor: 0.19, arenaDamageMult: 0.92, radius: 14, trait: "Армия мини-солдаты: большой радиус" };
    STAND_PROFILES["Акира Отоиси (Red Hot Chili Pepper)"] = { stand: "Red Hot Chili Pepper", color: "#ffdc48", speed: 1.24, damageFactor: 0.37, arenaDamageMult: 0.98, radius: 9, trait: "Электрический разряд: максимальная скорость" };
    STAND_PROFILES["Джозеф Джостар (часть 3: Hermit Purple)"] = { stand: "Hermit Purple", color: "#9b69cc", speed: 1.12, damageFactor: 0.25, arenaDamageMult: 0.95, radius: 13, trait: "Лозы: широкая защита" };
    STAND_PROFILES["Нориаки Какёин (Hierophant Green)"] = { stand: "Hierophant Green", color: "#48d9a0", speed: 1.1, damageFactor: 0.29, arenaDamageMult: 0.93, radius: 12, trait: "Изумрудный барьер: сбалансированный щит" };
    STAND_PROFILES["Жан-Пьер Польнарефф (Silver Chariot)"] = { stand: "Silver Chariot", color: "#c8d8e8", speed: 1.27, damageFactor: 0.38, arenaDamageMult: 0.98, radius: 9, trait: "Рапира: быстрый стенд и узкий хитбокс" };
    STAND_PROFILES["Мухаммед Абдул (Magician's Red)"] = { stand: "Magician's Red", color: "#ff6845", speed: 1.08, damageFactor: 0.23, arenaDamageMult: 0.92, radius: 12, trait: "Пламя: усиленное поглощение урона" };
    STAND_PROFILES["Пет Шоп (Horus)"] = { stand: "Horus", color: "#a9eaff", speed: 1.16, damageFactor: 0.21, arenaDamageMult: 0.94, radius: 11, trait: "Ледяной панцирь: крепкая защита" };
    STAND_PROFILES["Окуясу Нидзимура (The Hand)"] = { stand: "The Hand", color: "#8c87ff", speed: 1.05, damageFactor: 0.18, arenaDamageMult: 0.91, radius: 13, trait: "Стирание пространства: блокирует много урона" };
    STAND_PROFILES["Коити Хиросэ (Echoes Act 3)"] = { stand: "Echoes ACT 3", color: "#c8ff7a", speed: 1.07, damageFactor: 0.2, arenaDamageMult: 0.92, radius: 12, trait: "3 FREEZE: тяжёлый защитный стенд" };
    STAND_PROFILES["Юкако Ямагиси (Love Deluxe)"] = { stand: "Love Deluxe", color: "#e98ecb", speed: 1.14, damageFactor: 0.3, arenaDamageMult: 0.96, radius: 13, trait: "Волосы: увеличенная зона стенда" };
    STAND_PROFILES["Гвидо Миста (Sex Pistols)"] = { stand: "Sex Pistols", color: "#ffb3c9", speed: 1.22, damageFactor: 0.35, arenaDamageMult: 0.97, radius: 10, trait: "Пули: скорость и точное прикрытие" };
    STAND_PROFILES["Наранча Гирга (Aerosmith)"] = { stand: "Aerosmith", color: "#f6a54c", speed: 1.2, damageFactor: 0.32, arenaDamageMult: 0.96, radius: 11, trait: "Радар: скорость для уклонения" };
    STAND_PROFILES["Триш Уна (Spice Girl)"] = { stand: "Spice Girl", color: "#ff75ad", speed: 1.12, damageFactor: 0.22, arenaDamageMult: 0.93, radius: 12, trait: "Упругость: прочная защита" };
    STAND_PROFILES["Просчутто (The Grateful Dead)"] = { stand: "The Grateful Dead", color: "#b5a58f", speed: 1.05, damageFactor: 0.17, arenaDamageMult: 0.9, radius: 12, trait: "Старение: максимально плотный щит" };
    STAND_PROFILES["Гьяччо (White Album)"] = { stand: "White Album", color: "#bdeaff", speed: 1.08, damageFactor: 0.16, arenaDamageMult: 0.9, radius: 13, trait: "Ледяная броня: один из лучших блоков урона" };
    STAND_PROFILES["Эрмес Костелло (Kiss)"] = { stand: "Kiss", color: "#ee7f6e", speed: 1.15, damageFactor: 0.27, arenaDamageMult: 0.94, radius: 12, trait: "Дубликаты: широкий защитный хитбокс" };
    STAND_PROFILES["Foo Fighters (F.F.)"] = { stand: "Foo Fighters", color: "#72f0cf", speed: 1.13, damageFactor: 0.25, arenaDamageMult: 0.92, radius: 11, trait: "Планктон: устойчивость и скорость" };
    STAND_PROFILES["Эмпорио Алниньо"] = { stand: "Burning Down the House", color: "#a4b8ff", speed: 1.1, damageFactor: 0.33, arenaDamageMult: 0.95, radius: 10, trait: "Призрачная комната: быстрый отклик" };
    STAND_PROFILES["Хот Пэнтс"] = { stand: "Cream Starter", color: "#f4bfd5", speed: 1.16, damageFactor: 0.28, arenaDamageMult: 0.94, radius: 12, trait: "Лечебный спрей: усиленная зона защиты" };
    STAND_PROFILES["Сэндмен (In a Silent Way)"] = { stand: "In a Silent Way", color: "#cfbd86", speed: 1.26, damageFactor: 0.37, arenaDamageMult: 0.98, radius: 9, trait: "Звуковая скорость: быстрое движение" };
    STAND_PROFILES["Ясухо Хиросэ (Paisley Park)"] = { stand: "Paisley Park", color: "#79e2d2", speed: 1.18, damageFactor: 0.31, arenaDamageMult: 0.95, radius: 11, trait: "Навигация: скорость и средняя защита" };
    STAND_PROFILES["Драгона Джостар"] = { stand: "Smooth Operators", color: "#f3a3d2", speed: 1.19, damageFactor: 0.24, arenaDamageMult: 0.93, radius: 12, trait: "Коррекция тела: прочный стенд" };
    STAND_PROFILES["Усаги Алохаоэ"] = { stand: "The Matte Kudasai", color: "#e5d5ff", speed: 1.11, damageFactor: 0.34, arenaDamageMult: 0.96, radius: 10, trait: "Копирование: лёгкое и быстрое прикрытие" };
    STAND_PROFILES["Ринго Роудэгейн (Mandom)"] = { stand: "Mandom", color: "#d8ad79", speed: 1.14, damageFactor: 0.23, arenaDamageMult: 0.93, radius: 11, trait: "Возврат времени: сильнее снижает урон" };
    STAND_PROFILES["Ванилла Айс (Cream)"] = { stand: "Cream", color: "#9d9dbb", speed: 1.08, damageFactor: 0.19, arenaDamageMult: 0.91, radius: 13, trait: "Пустота: большой щит с сильным блоком" };
    STAND_PROFILES["Рохан Кишибэ (Heaven's Door)"] = { stand: "Heaven's Door", color: "#f1dc73", speed: 1.13, damageFactor: 0.29, arenaDamageMult: 0.95, radius: 10, trait: "Запись: ускоренная реакция" };
    STAND_PROFILES["Бруно Буччеллати (Sticky Fingers)"] = { stand: "Sticky Fingers", color: "#80d6dc", speed: 1.17, damageFactor: 0.26, arenaDamageMult: 0.94, radius: 12, trait: "Молнии-застёжки: расширенная защита" };
    STAND_PROFILES["Леоне Аббаккио (Moody Blues)"] = { stand: "Moody Blues", color: "#8797e5", speed: 1.05, damageFactor: 0.32, arenaDamageMult: 0.96, radius: 11, trait: "Повторение: равномерная защита" };
    STAND_PROFILES["Ризотто Неро (Metallica)"] = { stand: "Metallica", color: "#bbc5d0", speed: 1.09, damageFactor: 0.18, arenaDamageMult: 0.91, radius: 13, trait: "Железо: мощное поглощение урона" };
    STAND_PROFILES["Нарцисо Анасуй (Diver Down)"] = { stand: "Diver Down", color: "#f0a4aa", speed: 1.16, damageFactor: 0.21, arenaDamageMult: 0.92, radius: 12, trait: "Внутренний удар: плотный защитный контур" };
    STAND_PROFILES["Диего Брандо (Scary Monsters)"] = { stand: "Scary Monsters", color: "#e0c27b", speed: 1.23, damageFactor: 0.3, arenaDamageMult: 0.95, radius: 11, trait: "Динозавр: высокая скорость" };
    STAND_PROFILES["Винегар Доппио"] = { stand: "Epitaph", color: "#bc8fff", speed: 1.12, damageFactor: 0.2, arenaDamageMult: 0.92, radius: 12, trait: "Предвидение: снижает получаемый урон" };
    STAND_PROFILES["Джонни Джостар (Tusk Act 2)"] = { stand: "Tusk ACT 2", color: "#87c4ff", speed: 1.14, damageFactor: 0.24, arenaDamageMult: 0.94, radius: 11, trait: "Спираль: быстрый и плотный хитбокс" };
    STAND_PROFILES["Рай Маме́дзуку (Doggy Style)"] = { stand: "Doggy Style", color: "#a6c1a0", speed: 1.09, damageFactor: 0.27, arenaDamageMult: 0.95, radius: 13, trait: "Разделение тела: широкий защитный контур" };
    STAND_PROFILES["Пако Лабурентес (The Hustle)"] = { stand: "The Hustle", color: "#e7b36d", speed: 1.12, damageFactor: 0.22, arenaDamageMult: 0.93, radius: 11, trait: "Мышечная броня: стенд хорошо гасит удары" };
    STAND_PROFILES["Джодио Джостар (November Rain)"] = { stand: "November Rain", color: "#9a9eea", speed: 1.18, damageFactor: 0.25, arenaDamageMult: 0.94, radius: 12, trait: "Тяжёлые капли: большая зона перехвата" };
    STAND_PROFILES["Йошикаге Кира (JoJolion)"] = { stand: "Killer Queen (JoJolion)", color: "#ffa7a7", speed: 1.1, damageFactor: 0.19, arenaDamageMult: 0.91, radius: 12, trait: "Взрывной щит: сильная защита" };
    STAND_PROFILES["Джошу Хигашиката (Nut King Call)"] = { stand: "Nut King Call", color: "#c6a4e8", speed: 1.06, damageFactor: 0.28, arenaDamageMult: 0.95, radius: 12, trait: "Болты: стойкий хитбокс" };
    STAND_PROFILES["ДИО (The World, часть 3)"] = { stand: "The World", color: "#fff0a8", speed: 1.16, damageFactor: 0.2, arenaDamageMult: 0.92, radius: 12, trait: "Остановка: крепкий защитный стенд" };
    STAND_PROFILES["Джотаро Куджо (часть 3: Star Platinum)"] = { stand: "Star Platinum", color: "#c5a2ff", speed: 1.15, damageFactor: 0.17, arenaDamageMult: 0.9, radius: 13, trait: "Точный удар: сильное поглощение урона" };
    STAND_PROFILES["Джотаро Куджо (часть 4)"] = { stand: "Star Platinum: The World", color: "#c5a2ff", speed: 1.19, damageFactor: 0.21, arenaDamageMult: 0.92, radius: 12, trait: "Остановка времени: скорость и защита" };
    STAND_PROFILES["Джоске Хигашиката (часть 4: Crazy Diamond)"] = { stand: "Crazy Diamond", color: "#f29aa9", speed: 1.12, damageFactor: 0.23, arenaDamageMult: 0.93, radius: 13, trait: "Восстановление: широкий защитный контур" };
    STAND_PROFILES["Йошикаге Кира (часть 4: Killer Queen)"] = { stand: "Killer Queen", color: "#fa95b8", speed: 1.13, damageFactor: 0.18, arenaDamageMult: 0.91, radius: 12, trait: "Первая бомба: очень сильный блок урона" };
    STAND_PROFILES["Джорно Джованна (Gold Experience)"] = { stand: "Gold Experience", color: "#e9cb54", speed: 1.16, damageFactor: 0.24, arenaDamageMult: 0.94, radius: 12, trait: "Жизненная энергия: сбалансированный щит" };
    STAND_PROFILES["Дьяволо (King Crimson)"] = { stand: "King Crimson", color: "#d987ad", speed: 1.21, damageFactor: 0.2, arenaDamageMult: 0.91, radius: 11, trait: "Стирание времени: быстрый уход от атак" };
    STAND_PROFILES["Джолин Куджо (Stone Free)"] = { stand: "Stone Free", color: "#83e1de", speed: 1.17, damageFactor: 0.23, arenaDamageMult: 0.93, radius: 12, trait: "Нити: широкий контур защиты" };
    STAND_PROFILES["Уэзер Репорт (часть 6)"] = { stand: "Weather Report", color: "#9de8ef", speed: 1.13, damageFactor: 0.22, arenaDamageMult: 0.93, radius: 13, trait: "Погода: расширенная область перехвата" };
    STAND_PROFILES["Энрико Пуччи (Whitesnake)"] = { stand: "Whitesnake", color: "#d1c8ff", speed: 1.1, damageFactor: 0.19, arenaDamageMult: 0.91, radius: 12, trait: "Извлечение дисков: сильная защита" };
    STAND_PROFILES["Джироламо Джеппели (Gyro Zeppeli)"] = { stand: "Ball Breaker", color: "#d8c08a", speed: 1.2, damageFactor: 0.29, arenaDamageMult: 0.95, radius: 10, trait: "Золотое вращение: высокая скорость" };
    STAND_PROFILES["Джонни Джостар (Tusk Act 3)"] = { stand: "Tusk ACT 3", color: "#8ac4ff", speed: 1.18, damageFactor: 0.22, arenaDamageMult: 0.92, radius: 12, trait: "Пространственные отверстия: защита + скорость" };
    STAND_PROFILES["Фанни Валентайн (D4C)"] = { stand: "Dirty Deeds Done Dirt Cheap", color: "#e7a8b7", speed: 1.13, damageFactor: 0.18, arenaDamageMult: 0.91, radius: 13, trait: "Параллельные миры: очень крепкий стенд" };
    STAND_PROFILES["Джоске Хигашиката (JoJolion: Soft & Wet)"] = { stand: "Soft & Wet", color: "#91c9e8", speed: 1.17, damageFactor: 0.21, arenaDamageMult: 0.92, radius: 12, trait: "Пузырьки: снижение урона и разгон" };
    STAND_PROFILES["Джобин Хигашиката (Speed King)"] = { stand: "Speed King", color: "#f59b5f", speed: 1.22, damageFactor: 0.27, arenaDamageMult: 0.94, radius: 10, trait: "Тепло: скоростной стенд" };
    STAND_PROFILES["Диего Брандо (The World)"] = { stand: "The World (Diego)", color: "#e5edff", speed: 1.25, damageFactor: 0.23, arenaDamageMult: 0.92, radius: 11, trait: "Альтернативная остановка: высокий разгон" };
    STAND_PROFILES["Энрико Пуччи (C-Moon)"] = { stand: "C-Moon", color: "#99c9ff", speed: 1.17, damageFactor: 0.19, arenaDamageMult: 0.91, radius: 13, trait: "Гравитация: широкая зона и мощный блок" };
    STAND_PROFILES["Джонни Джостар (Tusk Act 1)"] = { stand: "Tusk ACT 1", color: "#9dbdfd", speed: 1.08, damageFactor: 0.31, arenaDamageMult: 0.96, radius: 10, trait: "Спираль I: лёгкое ускорение" };
    STAND_PROFILES["Джорно Джованна (Gold Experience Requiem)"] = { stand: "Gold Experience Requiem", color: "#ffdf72", speed: 1.14, damageFactor: 0.16, arenaDamageMult: 0.9, radius: 14, trait: "Возврат к нулю: максимальная защита и радиус" };
    STAND_PROFILES["Энрико Пуччи (Made in Heaven)"] = { stand: "Made in Heaven", color: "#d7f2ff", speed: 1.3, damageFactor: 0.34, arenaDamageMult: 0.97, radius: 10, trait: "Ускорение: максимальная скорость" };
    STAND_PROFILES["Джонни Джостар (Tusk Act 4)"] = { stand: "Tusk ACT 4", color: "#8ea8ff", speed: 1.21, damageFactor: 0.17, arenaDamageMult: 0.9, radius: 13, trait: "Бесконечное вращение: высокий блок урона" };
    STAND_PROFILES["Тору (Wonder of U)"] = { stand: "Wonder of U", color: "#c8b2e6", speed: 1.07, damageFactor: 0.17, arenaDamageMult: 0.9, radius: 14, trait: "Катастрофа: защита и максимальный радиус" };
    STAND_PROFILES["ДИО Over Heaven"] = { stand: "The World Over Heaven", color: "#fff7d1", speed: 1.2, damageFactor: 0.15, arenaDamageMult: 0.9, radius: 14, trait: "Перезапись реальности: максимальный защитный контур" };

    var state = window.__mbStandUserState || {
        active: false,
        cardName: null,
        info: null,
        restoreSpeed: null,
        originalSpeed: null,
        contextType: null,
        lastRegenAt: 0
    };
    window.__mbStandUserState = state;

    function mainCard() {
        return typeof window.getMainCard === "function" ? window.getMainCard() : null;
    }

    function isStandUser(card) {
        if (!card) return false;
        // DIO Over Heaven keeps his original custom SUPER/stand behavior.
        // Do not turn his SUPER button into the generic summon toggle.
        if (card.name === "ДИО Over Heaven" || card.dioGiftVariant === true) return false;
        var isJoJo = String(card.universe || "").toLowerCase() === "jojo" ||
            String(card.patchId || "").toLowerCase() === "jojo";
        return isJoJo && !!STAND_PROFILES[String(card.name || "")];
    }

    function getStandInfo(card) {
        var profile = card && STAND_PROFILES[String(card.name || "")];
        if (!profile) return null;
        return profile;
    }

    function formatStandBuff(info) {
        if (!info) return "Нет данных о стенде";
        var speed = Math.round((info.speed - 1) * 100);
        var blocked = Math.round((1 - info.damageFactor) * 100);
        var arenaReduction = Math.round((1 - info.arenaDamageMult) * 100);
        var sign = speed >= 0 ? "+" : "";
        return info.stand + " — " + info.trait +
            " • скорость " + sign + speed + "%" +
            " • стенд блокирует " + blocked + "% урона" +
            " • хитбокс " + info.radius +
            " • в арене получаемый урон -" + arenaReduction + "%";
    }

    function inCombat() {
        var unique = typeof window.isUniqueBossActive === "function" ? window.isUniqueBossActive() : null;
        var arena = typeof arenaActive !== "undefined" && arenaActive;
        return { unique: unique !== null, bossType: unique, arena: !!arena, active: unique !== null || !!arena };
    }

    function currentContext() {
        return typeof window.getBossContext === "function" ? window.getBossContext() : null;
    }

    function isActiveForCurrentCard() {
        var card = mainCard();
        return !!(state.active && card && isStandUser(card) && card.name === state.cardName);
    }

    function deactivateStand() {
        if (!state.active) return;
        var restore = state.restoreSpeed;
        var speed = state.originalSpeed;
        state.active = false;
        state.cardName = null;
        state.info = null;
        state.restoreSpeed = null;
        state.originalSpeed = null;
        state.contextType = null;
        state.lastRegenAt = 0;
        if (typeof restore === "function" && Number.isFinite(Number(speed))) {
            try { restore(Number(speed)); } catch (e) {}
        }
    }

    function toggleStand() {
        var card = mainCard();
        var combat = inCombat();
        if (!combat.active || !isStandUser(card)) return;

        if (combat.arena && typeof arenaPhase !== "undefined" && arenaPhase === "attack") {
            if (typeof window.showFloatingText === "function") window.showFloatingText("⚔️ СНАЧАЛА ЗАКОНЧИ АТАКУ!", "#ffdd00");
            return;
        }

        if (combat.unique) {
            if (typeof window.hasMasteryUniqueSuper === "function" && !window.hasMasteryUniqueSuper(card)) {
                if (typeof window.showFloatingText === "function") window.showFloatingText("Нужно мастерство 6★ для уникального босса!", "#ff3333");
                return;
            }
        } else if (typeof window.hasMasterySuper === "function" && !window.hasMasterySuper(card)) {
            if (typeof window.showFloatingText === "function") window.showFloatingText("Нужно мастерство 5★!", "#ff3333");
            return;
        }

        if (isActiveForCurrentCard()) {
            deactivateStand();
            if (typeof window.showFloatingText === "function") window.showFloatingText("СТЕНД УБРАН", "#c8b6ff");
            if (typeof window.updateSuperButton === "function") window.updateSuperButton();
            return;
        }

        deactivateStand();
        var ctxB = currentContext();
        var info = getStandInfo(card);
        state.active = true;
        state.cardName = card.name;
        state.info = info;
        state.contextType = ctxB ? ctxB.type : null;
        state.lastRegenAt = Date.now();

        if (ctxB && typeof ctxB.getHeartSpeed === "function" && typeof ctxB.setHeartSpeed === "function") {
            var speed = Number(ctxB.getHeartSpeed());
            if (Number.isFinite(speed) && speed > 0) {
                state.originalSpeed = speed;
                state.restoreSpeed = ctxB.setHeartSpeed;
                ctxB.setHeartSpeed(speed * info.speed);
            }
        }

        if (typeof window.showFloatingText === "function") {
            window.showFloatingText("🌀 " + info.stand + " призван! Скорость +" + Math.round((info.speed - 1) * 100) + "%", info.color);
        }
        if (typeof window.updateSuperButton === "function") window.updateSuperButton();
    }

    function getHitboxPosition(ctxB) {
        if (!isActiveForCurrentCard()) return null;
        ctxB = ctxB || currentContext();
        if (!ctxB || typeof ctxB.getHeartX !== "function" || typeof ctxB.getHeartY !== "function") return null;
        var x = Number(ctxB.getHeartX()) || 0;
        var y = Number(ctxB.getHeartY()) || 0;
        return {
            x: x > 300 ? x - 23 : x + 23,
            y: y - 9,
            radius: state.info ? state.info.radius : 10,
            color: state.info ? state.info.color : "#d5c1ff"
        };
    }

    function renderStand() {
        if (!isActiveForCurrentCard()) {
            if (state.active) deactivateStand();
            return;
        }
        if (typeof ctx === "undefined" || !ctx) return;
        var p = getHitboxPosition();
        if (!p) return;
        var pulse = 1 + Math.sin(Date.now() / 115) * 0.08;
        var modelScale = Math.max(0.65, Number(p.radius || 10) / 10);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(pulse * modelScale, pulse * modelScale);
        ctx.globalAlpha = 0.92;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        var heartPath = function () {
            ctx.beginPath();
            ctx.moveTo(0, 8);
            ctx.bezierCurveTo(-3, 5, -11, -1, -10, -7);
            ctx.bezierCurveTo(-9, -14, -2, -14, 0, -8);
            ctx.bezierCurveTo(3, -14, 10, -13, 10, -7);
            ctx.bezierCurveTo(11, -1, 3, 5, 0, 8);
            ctx.closePath();
        };
        var gradient = ctx.createLinearGradient(-8, -13, 8, 8);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.42, p.color);
        gradient.addColorStop(1, "#37304a");
        ctx.fillStyle = gradient;
        heartPath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        heartPath();
        ctx.stroke();
        ctx.fillStyle = "#262238";
        ctx.beginPath();
        ctx.arc(-3.2, -5.5, 1.2, 0, Math.PI * 2);
        ctx.arc(3.2, -5.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    window.isStandUserCard = isStandUser;
    window.isStandUserStandActive = isActiveForCurrentCard;
    window.getStandUserHitboxPosition = getHitboxPosition;
    window.getStandUserDamageFactor = function () {
        return isActiveForCurrentCard() && state.info ? state.info.damageFactor : 0.4;
    };
    window.scaleStandBlockedDamage = function (baseDamage) {
        var base = Math.max(0, Number(baseDamage) || 0);
        var factor = typeof window.getStandUserDamageFactor === "function" ? Number(window.getStandUserDamageFactor()) : 0.4;
        factor = Math.max(0.15, Math.min(0.4, Number.isFinite(factor) ? factor : 0.4));
        return Math.max(1, Math.floor(base * factor));
    };
    window.toggleStandUser = toggleStand;
    window.renderStandUser = renderStand;
    window.resetStandUser = deactivateStand;

    // Для стенд-юзеров кнопка SUPER превращается в обычный переключатель призыва.
    var originalToggleSuper = window.toggleSuper;
    if (typeof originalToggleSuper === "function") {
        window.toggleSuper = function () {
            var card = mainCard();
            if (isStandUser(card)) {
                toggleStand();
                return;
            }
            return originalToggleSuper.apply(this, arguments);
        };
    }

    var originalUpdateSuperButton = window.updateSuperButton;
    if (typeof originalUpdateSuperButton === "function") {
        window.updateSuperButton = function () {
            if (state.active && !isActiveForCurrentCard()) deactivateStand();
            var result = originalUpdateSuperButton.apply(this, arguments);
            var card = mainCard();
            var combat = inCombat();
            var btn = document.getElementById("superBtn");
            var buffStatus = document.getElementById("standBuffStatus");
            if (!btn || !isStandUser(card) || !combat.active) { if (buffStatus) buffStatus.style.display = "none"; return result; }

            var standInfo = getStandInfo(card);
            var hasMastery = combat.unique
                ? (typeof window.hasMasteryUniqueSuper !== "function" || window.hasMasteryUniqueSuper(card))
                : (typeof window.hasMasterySuper !== "function" || window.hasMasterySuper(card));
            if (!hasMastery) {
                btn.style.display = "none";
                if (buffStatus) buffStatus.style.display = "none";
                return result;
            }

            btn.style.display = "block";
            btn.disabled = false;
            btn.textContent = isActiveForCurrentCard() ? "⏹ УБРАТЬ СТЕНД" : "🌀 ПРИЗВАТЬ СТЕНД";
            btn.title = formatStandBuff(standInfo);
            if (buffStatus) {
                buffStatus.style.display = "block";
                buffStatus.textContent = (isActiveForCurrentCard() ? "АКТИВЕН: " : "БАФФ СТЕНДА: ") + formatStandBuff(standInfo);
                buffStatus.style.borderColor = standInfo.color;
            }
            btn.style.background = isActiveForCurrentCard() && state.info
                ? "linear-gradient(135deg," + state.info.color + ",#574080)"
                : "linear-gradient(135deg,#6d42a8,#32204e)";
            btn.style.animation = isActiveForCurrentCard() ? "none" : "superPulse 2s infinite";
            var btn2 = document.getElementById("superBtn2");
            var btnDeact = document.getElementById("superBtnDeactivate");
            if (btn2) btn2.style.display = "none";
            if (btnDeact) btnDeact.style.display = "none";
            return result;
        };
    }

    var originalResetAllSupers = window.resetAllSupers;
    if (typeof originalResetAllSupers === "function") {
        window.resetAllSupers = function () {
            deactivateStand();
            return originalResetAllSupers.apply(this, arguments);
        };
    }

    var originalRenderSuperVisuals = window.renderSuperVisuals;
    if (typeof originalRenderSuperVisuals === "function") {
        window.renderSuperVisuals = function () {
            var result = originalRenderSuperVisuals.apply(this, arguments);
            renderStand();
            return result;
        };
    }

    // Арена обычная принимает урон через applyHit; стенд даёт небольшой универсальный бонус защиты.
    var originalApplyHit = window.applyHit;
    if (typeof originalApplyHit === "function") {
        window.applyHit = function (damage, textMsg, isTrueOneshot) {
            if (isActiveForCurrentCard() && state.info && Number(damage) > 0) {
                damage = Math.max(1, Math.floor(Number(damage) * state.info.arenaDamageMult));
            }
            return originalApplyHit.call(this, damage, textMsg, isTrueOneshot);
        };
    }
})();
