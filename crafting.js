// ============================================================
// CRAFTING v2.1 — Хранилище снаряжения внутри "Снаряжение"
// ============================================================
// ПОДКЛЮЧАТЬ ПОСЛЕ inventory.js
// ============================================================

(function() {
    'use strict';

    if (window._craftingLoaded) {
        console.warn("[CRAFT] Уже загружено.");
        return;
    }
    window._craftingLoaded = true;

    // ============================================================
    // РЕСУРСЫ
    // ============================================================
    const RESOURCES = {
        plastic:      { name: "Пластик",              icon: "🟫", tier: 1, desc: "Обычный пластик. Основа для деталей." },
        iron:         { name: "Железо",               icon: "⚙️", tier: 1, desc: "Обычный металл." },
        wood:         { name: "Древесина",            icon: "🪵", tier: 1, desc: "Крепкое дерево." },
        avia_alum:    { name: "Авиационный алюминий", icon: "🪶", tier: 1, desc: "Лёгкий и прочный сплав." },
        coal:         { name: "Уголь",                icon: "⚫", tier: 1, desc: "Топливо для плавки." },
        sulfur:       { name: "Сера",                 icon: "🟡", tier: 1, desc: "Компонент пороха." },
        nitrate:      { name: "Селитра",              icon: "⚪", tier: 1, desc: "Окислитель для пороха." },

        steel:        { name: "Сталь",                icon: "🔩", tier: 2, desc: "Крепче железа." },
        chem:         { name: "Хим. реагенты",        icon: "🧪", tier: 2, desc: "Для обработки стали." },

        mithril:      { name: "Мифрил",               icon: "💠", tier: 3, desc: "Лёгкий и прочный металл." },
        polymer:      { name: "Ударопрочный полимер", icon: "🔷", tier: 3, desc: "В 250 раз прочнее стекла." },
        epic_stone:   { name: "Эпический камень",     icon: "🟪", tier: 3, desc: "Сгусток силы." },
        magic_dust:   { name: "Магическая пыль",      icon: "✨", tier: 3, desc: "Светящаяся пыль. Основа магии." },

        adamantite:   { name: "Адамантин",            icon: "🔶", tier: 4, desc: "Легендарный металл." },
        legendary_stone: { name: "Легендарный камень", icon: "🟨", tier: 4, desc: "Кристалл чистой силы." },
        soul_crystal: { name: "Кристалл души",        icon: "💜", tier: 5, desc: "Сердце живого существа." },
        elemental_heart: { name: "Сердце элементаля", icon: "❤️‍🔥", tier: 5, desc: "Пульсирующий огонь." }
    };

    const DROP_CHANCES = {
        plastic:    { minWave: 1,   baseChance: 0.15, maxChance: 0.30 },
        iron:       { minWave: 1,   baseChance: 0.12, maxChance: 0.25 },
        wood:       { minWave: 1,   baseChance: 0.18, maxChance: 0.32 },
        avia_alum:  { minWave: 1,   baseChance: 0.08, maxChance: 0.20 },
        coal:       { minWave: 1,   baseChance: 0.10, maxChance: 0.22 },
        sulfur:     { minWave: 1,   baseChance: 0.06, maxChance: 0.15 },
        nitrate:    { minWave: 1,   baseChance: 0.06, maxChance: 0.15 },

        steel:      { minWave: 100, baseChance: 0.06, maxChance: 0.18 },
        chem:       { minWave: 100, baseChance: 0.03, maxChance: 0.10 },

        mithril:    { minWave: 300, baseChance: 0.03, maxChance: 0.08 },
        polymer:    { minWave: 300, baseChance: 0.03, maxChance: 0.08 },
        epic_stone: { minWave: 300, baseChance: 0.02, maxChance: 0.05 },
        magic_dust: { minWave: 300, baseChance: 0.015, maxChance: 0.04 },

        adamantite: { minWave: 500, baseChance: 0.01, maxChance: 0.03 },
        legendary_stone: { minWave: 500, baseChance: 0.005, maxChance: 0.02 },
        soul_crystal:    { minWave: 700, baseChance: 0.003, maxChance: 0.015 },
        elemental_heart: { minWave: 700, baseChance: 0.003, maxChance: 0.015 }
    };

    // ============================================================
    // ПРОЦЕССЫ
    // ============================================================
    const PROCESSES = [
        { id: "melt_plastic",  name: "Плавка пластика",     icon: "🔥", desc: "Расплавить пластик в жидкую массу.",
          input: { plastic: 3 },  output: { melted_plastic: 1 }, tier: 1 },
        { id: "melt_steel",    name: "Плавка стали",         icon: "🔥", desc: "Железо + уголь = сталь.",
          input: { iron: 3, coal: 1 }, output: { steel: 1 }, tier: 1 },
        { id: "gunpowder",     name: "Газовый порох",        icon: "⚗️", desc: "Классический чёрный порох.",
          input: { nitrate: 1, sulfur: 1, coal: 1 }, output: { gas_powder: 1 }, tier: 1 },
        { id: "weak_parts",    name: "Слабые запчасти",      icon: "🛠️", desc: "Простые детали для оружия.",
          input: { iron: 3, avia_alum: 2 }, output: { weak_parts: 1 }, tier: 1 },

        { id: "carburizing",   name: "Карбонитрирование",    icon: "🧪", desc: "Упрочнение стали углеродом и азотом.",
          input: { steel: 2, chem: 1 }, output: { hardened_steel: 1 }, tier: 2 },
        { id: "normal_parts",  name: "Обычные запчасти",     icon: "🛠️", desc: "Детали среднего качества.",
          input: { steel: 2, avia_alum: 1 }, output: { normal_parts: 1 }, tier: 2 },

        { id: "quality_parts", name: "Качественные запчасти", icon: "🛠️", desc: "Детали высокого класса.",
          input: { mithril: 2, polymer: 1 }, output: { quality_parts: 1 }, tier: 3 },
        { id: "magic_powder",  name: "Магический порох",     icon: "🔮", desc: "Порох с магической пылью.",
          input: { gas_powder: 1, magic_dust: 1 }, output: { magic_powder: 1 }, tier: 3 },

        { id: "power_parts",   name: "Мощные запчасти",      icon: "🛠️", desc: "Элитные детали.",
          input: { epic_stone: 2, mithril: 1 }, output: { power_parts: 1 }, tier: 4 },
        { id: "power_steel",   name: "Мощная сталь",         icon: "💠", desc: "Сплав с редкими металлами.",
          input: { hardened_steel: 2, mithril: 1 }, output: { power_steel: 1 }, tier: 4 },

        { id: "magic_steel",   name: "Магическая сталь",     icon: "✨", desc: "Сталь, пропитанная магией.",
          input: { adamantite: 2, magic_dust: 1, legendary_stone: 1 }, output: { magic_steel: 1 }, tier: 5 }
    ];

    const INTERMEDIATE = {
        melted_plastic: { name: "Расплавленный пластик", icon: "🫗", desc: "Жидкая масса для литья." },
        gas_powder:     { name: "Газовый порох",          icon: "⚗️", desc: "Топливо для выстрела." },
        weak_parts:     { name: "Слабые запчасти",        icon: "🛠️", desc: "Простые детали." },
        hardened_steel: { name: "Карбонитрированная сталь", icon: "🔷", desc: "Твёрдая снаружи, вязкая внутри." },
        normal_parts:   { name: "Обычные запчасти",       icon: "🛠️", desc: "Средние детали." },
        quality_parts:  { name: "Качественные запчасти",  icon: "🛠️", desc: "Высококлассные детали." },
        magic_powder:   { name: "Магический порох",       icon: "🔮", desc: "Заряжен силой." },
        power_parts:    { name: "Мощные запчасти",        icon: "🛠️", desc: "Элитные детали." },
        power_steel:    { name: "Мощная сталь",           icon: "💠", desc: "Усиленная сталь." },
        magic_steel:    { name: "Магическая сталь",       icon: "✨", desc: "Легендарный сплав." }
    };

    // ============================================================
    // ОРУЖИЕ
    // ============================================================
    const WEAPON_RECIPES = [
        // ПИСТОЛЕТ
        { id: "pistol_c", name: "Пистолет", icon: "🔫", rarity: "Обычная", rarityClass: "common", tier: 1, damageMult: 1.0, shootRate: 12, bullets: 1, desc: "Стандартное оружие.", recipe: { melted_plastic: 5, weak_parts: 2, gas_powder: 1 } },
        { id: "pistol_r", name: "Пистолет+", icon: "🔫", rarity: "Редкая", rarityClass: "rare", tier: 2, damageMult: 1.6, shootRate: 11, bullets: 1, desc: "Улучшенный пистолет.", fromWeapon: "pistol_c", recipe: { normal_parts: 3, steel: 2, hardened_steel: 1 } },
        { id: "pistol_sr", name: "Пистолет++", icon: "🔫", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, damageMult: 2.5, shootRate: 10, bullets: 1, desc: "Продвинутый пистолет.", fromWeapon: "pistol_r", recipe: { quality_parts: 3, polymer: 2, hardened_steel: 2 } },
        { id: "pistol_e", name: "Пистолет Элит", icon: "🔫", rarity: "Эпик", rarityClass: "epic", tier: 4, damageMult: 4.0, shootRate: 9, bullets: 1, desc: "Элитный пистолет.", fromWeapon: "pistol_sr", recipe: { power_parts: 3, power_steel: 2, magic_powder: 1 } },
        { id: "pistol_l", name: "Пистолет Дракона", icon: "🐉🔫", rarity: "Легендарная", rarityClass: "legendary", tier: 5, damageMult: 6.5, shootRate: 8, bullets: 2, spread: 0.1, desc: "Двойной выстрел!", fromWeapon: "pistol_e", legendaryPerk: "doubleShot", recipe: { magic_steel: 2, soul_crystal: 1, elemental_heart: 1 } },

        // ДРОБОВИК
        { id: "shotgun_c", name: "Дробовик", icon: "🔫", rarity: "Обычная", rarityClass: "common", tier: 1, damageMult: 0.8, shootRate: 20, bullets: 3, spread: 0.3, desc: "3 пули веером.", recipe: { melted_plastic: 8, weak_parts: 3, gas_powder: 2 } },
        { id: "shotgun_r", name: "Дробовик+", icon: "🔫", rarity: "Редкая", rarityClass: "rare", tier: 2, damageMult: 1.2, shootRate: 18, bullets: 3, spread: 0.32, desc: "Улучшенный дробовик.", fromWeapon: "shotgun_c", recipe: { normal_parts: 4, steel: 3, hardened_steel: 2 } },
        { id: "shotgun_sr", name: "Дробовик++", icon: "🔫", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, damageMult: 1.9, shootRate: 17, bullets: 4, spread: 0.35, desc: "4 пули веером.", fromWeapon: "shotgun_r", recipe: { quality_parts: 4, polymer: 3, hardened_steel: 2 } },
        { id: "shotgun_e", name: "Дробовик Элит", icon: "🔫", rarity: "Эпик", rarityClass: "epic", tier: 4, damageMult: 3.0, shootRate: 16, bullets: 4, spread: 0.38, desc: "Мощный 4-ствольный.", fromWeapon: "shotgun_sr", recipe: { power_parts: 4, power_steel: 3, magic_powder: 2 } },
        { id: "shotgun_l", name: "Дробовик «Поглотитель»", icon: "🔫", rarity: "Легендарная", rarityClass: "legendary", tier: 5, damageMult: 4.5, shootRate: 15, bullets: 5, spread: 0.4, desc: "+15% поглощения урона.", fromWeapon: "shotgun_e", legendaryPerk: "absorb15", recipe: { magic_steel: 3, soul_crystal: 1, elemental_heart: 1 } },

        // СНАЙПЕРКА
        { id: "sniper_c", name: "Снайперка", icon: "🎯", rarity: "Обычная", rarityClass: "common", tier: 1, damageMult: 2.5, shootRate: 60, bullets: 1, desc: "Медленная, но мощная.", recipe: { melted_plastic: 6, weak_parts: 3, gas_powder: 2, avia_alum: 3 } },
        { id: "sniper_r", name: "Снайперка+", icon: "🎯", rarity: "Редкая", rarityClass: "rare", tier: 2, damageMult: 4.0, shootRate: 55, bullets: 1, desc: "Улучшенная дальность.", fromWeapon: "sniper_c", recipe: { normal_parts: 4, steel: 3, hardened_steel: 2 } },
        { id: "sniper_sr", name: "Снайперка++", icon: "🎯", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, damageMult: 6.0, shootRate: 50, bullets: 1, desc: "Пробивная мощь.", fromWeapon: "sniper_r", recipe: { quality_parts: 5, polymer: 3, hardened_steel: 3 } },
        { id: "sniper_e", name: "Снайперка Элит", icon: "🎯", rarity: "Эпик", rarityClass: "epic", tier: 4, damageMult: 9.0, shootRate: 45, bullets: 1, desc: "Элитная дальнобойность.", fromWeapon: "sniper_sr", recipe: { power_parts: 5, power_steel: 4, magic_powder: 2 } },
        { id: "sniper_l", name: "Снайперка «Прицел»", icon: "🎯", rarity: "Легендарная", rarityClass: "legendary", tier: 5, damageMult: 14.0, shootRate: 40, bullets: 1, desc: "+35% авто-наведение.", fromWeapon: "sniper_e", legendaryPerk: "autoAim35", recipe: { magic_steel: 4, soul_crystal: 2, elemental_heart: 1 } },

        // МЕЧ
        { id: "sword_c", name: "Меч", icon: "⚔️", rarity: "Обычная", rarityClass: "common", tier: 1, damageMult: 1.2, shootRate: 14, bullets: 1, isMelee: true, desc: "Летящая волна.", recipe: { iron: 10, wood: 5, weak_parts: 2 } },
        { id: "sword_r", name: "Меч+", icon: "⚔️", rarity: "Редкая", rarityClass: "rare", tier: 2, damageMult: 2.0, shootRate: 13, bullets: 1, isMelee: true, desc: "Заточенный клинок.", fromWeapon: "sword_c", recipe: { normal_parts: 3, steel: 4, hardened_steel: 1 } },
        { id: "sword_sr", name: "Меч++", icon: "⚔️", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, damageMult: 3.2, shootRate: 12, bullets: 1, isMelee: true, desc: "Клинок из крепкой стали.", fromWeapon: "sword_r", recipe: { quality_parts: 4, polymer: 2, hardened_steel: 3 } },
        { id: "sword_e", name: "Меч Элит", icon: "⚔️", rarity: "Эпик", rarityClass: "epic", tier: 4, damageMult: 5.0, shootRate: 11, bullets: 1, isMelee: true, desc: "Мощный клинок.", fromWeapon: "sword_sr", recipe: { power_parts: 4, power_steel: 4, magic_powder: 2 } },
        { id: "sword_l", name: "Меч «Разрушитель»", icon: "⚔️", rarity: "Легендарная", rarityClass: "legendary", tier: 5, damageMult: 8.0, shootRate: 10, bullets: 1, isMelee: true, desc: "Уничтожает атаки босса.", fromWeapon: "sword_e", legendaryPerk: "destroyAttacks", recipe: { magic_steel: 3, soul_crystal: 2, elemental_heart: 2 } },

        // ПУЛЕМЁТ
        { id: "smg_c", name: "Пулемёт", icon: "🔫", rarity: "Обычная", rarityClass: "common", tier: 1, damageMult: 0.4, shootRate: 6, bullets: 1, desc: "Быстрая стрельба.", recipe: { melted_plastic: 10, weak_parts: 4, gas_powder: 3, avia_alum: 4 } },
        { id: "smg_r", name: "Пулемёт+", icon: "🔫", rarity: "Редкая", rarityClass: "rare", tier: 2, damageMult: 0.6, shootRate: 5, bullets: 1, desc: "Ещё быстрее.", fromWeapon: "smg_c", recipe: { normal_parts: 4, steel: 3, hardened_steel: 2 } },
        { id: "smg_sr", name: "Пулемёт++", icon: "🔫", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, damageMult: 0.9, shootRate: 4, bullets: 1, desc: "Шквал пуль.", fromWeapon: "smg_r", recipe: { quality_parts: 5, polymer: 3, hardened_steel: 2 } },
        { id: "smg_e", name: "Пулемёт Элит", icon: "🔫", rarity: "Эпик", rarityClass: "epic", tier: 4, damageMult: 1.3, shootRate: 3, bullets: 1, desc: "Очень быстрая стрельба.", fromWeapon: "smg_sr", recipe: { power_parts: 5, power_steel: 3, magic_powder: 2 } },
        { id: "smg_l", name: "Пулемёт «Ярость»", icon: "🔫", rarity: "Легендарная", rarityClass: "legendary", tier: 5, damageMult: 1.8, shootRate: 3, bullets: 1, desc: "Чем меньше HP — тем быстрее.", fromWeapon: "smg_e", legendaryPerk: "rageSpeed", recipe: { magic_steel: 3, soul_crystal: 1, elemental_heart: 2 } }
    ];

    // ============================================================
    // БРОНЯ
    // ============================================================
    const ARMOR_RECIPES = [
        // КОЖАНАЯ КУРТКА
        { id: "jacket_c", name: "Кожаная куртка", icon: "🧥", rarity: "Обычная", rarityClass: "common", tier: 1, bonuses: { speedMult: 1.05 }, desc: "+5% скорость.", recipe: { plastic: 5, wood: 3 } },
        { id: "jacket_r", name: "Куртка+", icon: "🧥", rarity: "Редкая", rarityClass: "rare", tier: 2, bonuses: { speedMult: 1.10, hpMult: 1.05 }, desc: "+10% скор., +5% HP.", fromArmor: "jacket_c", recipe: { normal_parts: 2, steel: 2, hardened_steel: 1 } },
        { id: "jacket_sr", name: "Куртка++", icon: "🧥", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, bonuses: { speedMult: 1.15, hpMult: 1.10 }, desc: "+15% скор., +10% HP.", fromArmor: "jacket_r", recipe: { quality_parts: 2, polymer: 2, hardened_steel: 1 } },
        { id: "jacket_e", name: "Куртка Элит", icon: "🧥", rarity: "Эпик", rarityClass: "epic", tier: 4, bonuses: { speedMult: 1.20, hpMult: 1.15 }, desc: "+20% скор., +15% HP.", fromArmor: "jacket_sr", recipe: { power_parts: 2, power_steel: 2, magic_powder: 1 } },
        { id: "jacket_l", name: "Куртка «Скороход»", icon: "🧥", rarity: "Легендарная", rarityClass: "legendary", tier: 5, bonuses: { speedMult: 1.30, hpMult: 1.25 }, desc: "+30% скор., +25% HP.", fromArmor: "jacket_e", recipe: { magic_steel: 2, soul_crystal: 1, elemental_heart: 1 } },

        // КОЛЬЧУГА
        { id: "chain_c", name: "Кольчуга", icon: "⛓️", rarity: "Обычная", rarityClass: "common", tier: 1, bonuses: { hpMult: 1.10, damageReduction: 0.03 }, desc: "+10% HP, +3% погл.", recipe: { iron: 15, steel: 5 } },
        { id: "chain_r", name: "Кольчуга+", icon: "⛓️", rarity: "Редкая", rarityClass: "rare", tier: 2, bonuses: { hpMult: 1.20, damageReduction: 0.06 }, desc: "+20% HP, +6% погл.", fromArmor: "chain_c", recipe: { normal_parts: 3, hardened_steel: 2, steel: 4 } },
        { id: "chain_sr", name: "Кольчуга++", icon: "⛓️", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, bonuses: { hpMult: 1.35, damageReduction: 0.10 }, desc: "+35% HP, +10% погл.", fromArmor: "chain_r", recipe: { quality_parts: 3, polymer: 2, hardened_steel: 3 } },
        { id: "chain_e", name: "Кольчуга Элит", icon: "⛓️", rarity: "Эпик", rarityClass: "epic", tier: 4, bonuses: { hpMult: 1.60, damageReduction: 0.15 }, desc: "+60% HP, +15% погл.", fromArmor: "chain_sr", recipe: { power_parts: 3, power_steel: 3, magic_powder: 2 } },
        { id: "chain_l", name: "Кольчуга «Стальная стена»", icon: "⛓️", rarity: "Легендарная", rarityClass: "legendary", tier: 5, bonuses: { hpMult: 2.0, damageReduction: 0.22 }, desc: "+100% HP, +22% погл.", fromArmor: "chain_e", recipe: { magic_steel: 3, soul_crystal: 2, elemental_heart: 2 } },

        // ТЯЖЁЛЫЙ ДОСПЕХ
        { id: "heavy_c", name: "Тяжёлый доспех", icon: "🛡️", rarity: "Обычная", rarityClass: "common", tier: 1, bonuses: { hpMult: 1.25, speedMult: 0.92 }, desc: "+25% HP, -8% скор.", recipe: { iron: 25, steel: 10 } },
        { id: "heavy_r", name: "Тяжёлый+", icon: "🛡️", rarity: "Редкая", rarityClass: "rare", tier: 2, bonuses: { hpMult: 1.40, speedMult: 0.90, damageReduction: 0.05 }, desc: "+40% HP, -10% скор., +5% погл.", fromArmor: "heavy_c", recipe: { normal_parts: 4, hardened_steel: 3, steel: 5 } },
        { id: "heavy_sr", name: "Тяжёлый++", icon: "🛡️", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, bonuses: { hpMult: 1.60, speedMult: 0.88, damageReduction: 0.10 }, desc: "+60% HP, +10% погл.", fromArmor: "heavy_r", recipe: { quality_parts: 4, polymer: 3, hardened_steel: 4 } },
        { id: "heavy_e", name: "Тяжёлый Элит", icon: "🛡️", rarity: "Эпик", rarityClass: "epic", tier: 4, bonuses: { hpMult: 2.0, speedMult: 0.85, damageReduction: 0.15 }, desc: "+100% HP, +15% погл.", fromArmor: "heavy_sr", recipe: { power_parts: 4, power_steel: 4, magic_powder: 2 } },
        { id: "heavy_l", name: "Доспех титана", icon: "🗿", rarity: "Легендарная", rarityClass: "legendary", tier: 5, bonuses: { hpMult: 4.0, speedMult: 0.60, damageReduction: 0.30, regen: 0.03 }, desc: "+300% HP, +30% погл., реген 3%/сек.", fromArmor: "heavy_e", recipe: { magic_steel: 5, soul_crystal: 3, elemental_heart: 3 } },

        // МАНТИЯ
        { id: "mage_c", name: "Мантия мага", icon: "🧙", rarity: "Обычная", rarityClass: "common", tier: 1, bonuses: { hpMult: 1.05, reflectChance: 0.02 }, desc: "+5% HP, 2% отражение.", recipe: { plastic: 8, wood: 5 } },
        { id: "mage_r", name: "Мантия+", icon: "🧙", rarity: "Редкая", rarityClass: "rare", tier: 2, bonuses: { hpMult: 1.15, reflectChance: 0.05 }, desc: "+15% HP, 5% отражение.", fromArmor: "mage_c", recipe: { normal_parts: 3, steel: 3, magic_dust: 2 } },
        { id: "mage_sr", name: "Мантия++", icon: "🧙", rarity: "Сверх редкая", rarityClass: "superrare", tier: 3, bonuses: { hpMult: 1.25, reflectChance: 0.08 }, desc: "+25% HP, 8% отражение.", fromArmor: "mage_r", recipe: { quality_parts: 3, polymer: 3, magic_dust: 3 } },
        { id: "mage_e", name: "Мантия Элит", icon: "🧙", rarity: "Эпик", rarityClass: "epic", tier: 4, bonuses: { hpMult: 1.40, reflectChance: 0.12, speedMult: 1.05 }, desc: "+40% HP, 12% отражение.", fromArmor: "mage_sr", recipe: { power_parts: 3, power_steel: 3, magic_powder: 3 } },
        { id: "mage_l", name: "Мантия Архимага", icon: "🧙", rarity: "Легендарная", rarityClass: "legendary", tier: 5, bonuses: { hpMult: 1.60, reflectChance: 0.20, speedMult: 1.15, regen: 0.02 }, desc: "+60% HP, 20% отражение, реген 2%/сек.", fromArmor: "mage_e", recipe: { magic_steel: 3, soul_crystal: 2, elemental_heart: 2 } }
    ];

    // ============================================================
    // ДАННЫЕ
    // ============================================================
    let resources = {};
    let equipment = { weapon: null, armor: null };
    // ★ ХРАНИЛИЩЕ ★
    let weaponStorage = []; // массив оружия, которое не надето
    let armorStorage = [];  // массив брони, которая не надета

    // ============================================================
    // ФУНКЦИИ
    // ============================================================
    function isModer() {
        try {
            return typeof mode !== 'undefined' && mode === "moder" && (typeof moderUnlocked !== 'undefined' && moderUnlocked);
        } catch(e) { return false; }
    }

    function addResource(id, count) {
        if (!RESOURCES[id] && !INTERMEDIATE[id]) return;
        if (!resources[id]) resources[id] = 0;
        resources[id] += count;
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
    }

    function getResource(id) { return resources[id] || 0; }

    function removeResource(id, count) {
        if (!resources[id] || resources[id] < count) return false;
        resources[id] -= count;
        if (resources[id] <= 0) delete resources[id];
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        return true;
    }

    function syncToSlotData() {
        try {
            if (typeof slotData !== 'undefined' && slotData) {
                slotData.resources = JSON.parse(JSON.stringify(resources));
                slotData.equipment = JSON.parse(JSON.stringify(equipment));
                slotData.weaponStorage = JSON.parse(JSON.stringify(weaponStorage));
                slotData.armorStorage = JSON.parse(JSON.stringify(armorStorage));
            }
        } catch(e) {}
    }

    function getDropChance(id, wave) {
        let info = DROP_CHANCES[id];
        if (!info) return 0;
        if (wave < info.minWave) return 0;
        let t = Math.min(1, (wave - info.minWave) / 1000);
        return info.baseChance + (info.maxChance - info.baseChance) * t;
    }

    function tryDropResources(wave, isBoss) {
        let multiplier = isBoss ? 3 : 1;
        let dropped = 0;
        for (let id in DROP_CHANCES) {
            let chance = getDropChance(id, wave) * multiplier;
            if (Math.random() < chance) {
                let count = 1;
                if (isBoss && Math.random() < 0.3) count = 2;
                addResource(id, count);
                dropped++;
                if (typeof showFloatingText === 'function') {
                    let icon = RESOURCES[id] ? RESOURCES[id].icon : "📦";
                    let name = RESOURCES[id] ? RESOURCES[id].name : id;
                    showFloatingText(icon + " " + name + " +" + count, "#aaddff");
                }
            }
        }
        return dropped;
    }

    function canCraft(recipe) {
        if (isModer()) return true;
        for (let id in recipe) {
            if (getResource(id) < recipe[id]) return false;
        }
        return true;
    }

    function craftProcess(processId) {
        let proc = PROCESSES.find(p => p.id === processId);
        if (!proc) return;
        let freeMode = isModer();
        if (!freeMode && !canCraft(proc.input)) { alert("❌ Не хватает ресурсов!"); return; }
        if (!freeMode) {
            for (let id in proc.input) removeResource(id, proc.input[id]);
        }
        for (let id in proc.output) addResource(id, proc.output[id]);
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof sfxCardObtain === 'function') sfxCardObtain();
        if (typeof showFloatingText === 'function') showFloatingText(proc.icon + " " + proc.name + " готово!", "#f5af19");
    }

    // ★★★ КРАФТ С ХРАНИЛИЩЕМ ★★★
    function craftItem(recipeId, type) {
        let list = (type === "weapon") ? WEAPON_RECIPES : ARMOR_RECIPES;
        let recipe = list.find(r => r.id === recipeId);
        if (!recipe) { alert("❌ Рецепт не найден"); return; }
        let freeMode = isModer();

        // ★ Проверка "fromWeapon" / "fromArmor" — должно быть в СЛОТЕ или в ХРАНИЛИЩЕ ★
        if (recipe.fromWeapon && !freeMode) {
            let currentW = equipment.weapon;
            let inStorage = weaponStorage.some(w => w.id === recipe.fromWeapon);
            if ((!currentW || currentW.id !== recipe.fromWeapon) && !inStorage) {
                let baseName = WEAPON_RECIPES.find(r => r.id === recipe.fromWeapon);
                alert("❌ Нужно иметь: " + (baseName ? baseName.name : recipe.fromWeapon) + "\n(надень или положи в хранилище)");
                return;
            }
            // Списываем предыдущее из хранилища
            if (inStorage) {
                let idx = weaponStorage.findIndex(w => w.id === recipe.fromWeapon);
                if (idx !== -1) weaponStorage.splice(idx, 1);
            }
        }
        if (recipe.fromArmor && !freeMode) {
            let currentA = equipment.armor;
            let inStorage = armorStorage.some(a => a.id === recipe.fromArmor);
            if ((!currentA || currentA.id !== recipe.fromArmor) && !inStorage) {
                let baseName = ARMOR_RECIPES.find(r => r.id === recipe.fromArmor);
                alert("❌ Нужно иметь: " + (baseName ? baseName.name : recipe.fromArmor));
                return;
            }
            if (inStorage) {
                let idx = armorStorage.findIndex(a => a.id === recipe.fromArmor);
                if (idx !== -1) armorStorage.splice(idx, 1);
            }
        }

        if (!freeMode && !canCraft(recipe.recipe)) { alert("❌ Не хватает материалов!"); return; }
        if (!freeMode) {
            for (let id in recipe.recipe) removeResource(id, recipe.recipe[id]);
        }

        let item = JSON.parse(JSON.stringify(recipe));
        item.uid = Date.now() + Math.random() + Math.random(); // гарантируем уникальность
        item.craftedAt = Date.now();

        // ★★★ ЛОГИКА ХРАНИЛИЩА ★★★
        if (type === "weapon") {
            if (equipment.weapon) {
                // Старое — в хранилище
                weaponStorage.push(equipment.weapon);
            }
            equipment.weapon = item; // новое — надеваем
        } else if (type === "armor") {
            if (equipment.armor) {
                armorStorage.push(equipment.armor);
            }
            equipment.armor = item;
        }

        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof updatePlayerStats === 'function') { try { updatePlayerStats(); } catch(e) {} }
        if (typeof sfxCardObtain === 'function') sfxCardObtain();
        if (typeof showFloatingText === 'function') showFloatingText("🔨 " + item.icon + " " + item.name + " надето!", "#f5af19");
    }

    // ★ НАДЕТЬ ИЗ ХРАНИЛИЩА ★
    function equipFromStorage(uid, type) {
        if (type === "weapon") {
            let idx = weaponStorage.findIndex(w => w.uid === uid);
            if (idx === -1) return;
            let old = equipment.weapon;
            equipment.weapon = weaponStorage[idx];
            weaponStorage.splice(idx, 1);
            if (old) weaponStorage.push(old); // старое — в хранилище
        } else if (type === "armor") {
            let idx = armorStorage.findIndex(a => a.uid === uid);
            if (idx === -1) return;
            let old = equipment.armor;
            equipment.armor = armorStorage[idx];
            armorStorage.splice(idx, 1);
            if (old) armorStorage.push(old);
        }
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof updatePlayerStats === 'function') { try { updatePlayerStats(); } catch(e) {} }
        if (typeof showFloatingText === 'function') showFloatingText("⚔️ Надето из хранилища!", "#2ecc71");
    }

    // ★ ПРОДАТЬ ИЗ ХРАНИЛИЩА ★
    function sellFromStorage(uid, type) {
        let list, item;
        if (type === "weapon") {
            let idx = weaponStorage.findIndex(w => w.uid === uid);
            if (idx === -1) return;
            item = weaponStorage[idx];
            list = "weapon";
        } else if (type === "armor") {
            let idx = armorStorage.findIndex(a => a.uid === uid);
            if (idx === -1) return;
            item = armorStorage[idx];
            list = "armor";
        }
        if (!item) return;

        let rarityPrices = {
            "Обычная": 50, "Редкая": 200, "Сверх редкая": 800,
            "Эпик": 3000, "Легендарная": 15000
        };
        let price = rarityPrices[item.rarity] || 100;

        if (!confirm("💰 Продать " + item.icon + " " + item.name + " за " + price + "⭐?")) return;

        if (type === "weapon") {
            let idx = weaponStorage.findIndex(w => w.uid === uid);
            if (idx !== -1) weaponStorage.splice(idx, 1);
        } else {
            let idx = armorStorage.findIndex(a => a.uid === uid);
            if (idx !== -1) armorStorage.splice(idx, 1);
        }

        if (typeof points !== 'undefined') {
            points += price;
            if (typeof maxPoints !== 'undefined' && points > maxPoints) maxPoints = points;
        }
        if (typeof renderPoints === 'function') renderPoints();
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof showFloatingText === 'function') showFloatingText("💰 +" + price + "⭐", "#f5af19");
    }

    function unequipWeapon() {
        if (equipment.weapon) {
            weaponStorage.push(equipment.weapon);
            equipment.weapon = null;
        }
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof updatePlayerStats === 'function') { try { updatePlayerStats(); } catch(e) {} }
    }

    function unequipArmor() {
        if (equipment.armor) {
            armorStorage.push(equipment.armor);
            equipment.armor = null;
        }
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof updatePlayerStats === 'function') { try { updatePlayerStats(); } catch(e) {} }
    }

    function getEquipmentBonuses() {
        let total = { hpMult: 1.0, speedMult: 1.0, damageReduction: 0, reflectChance: 0, regen: 0 };
        if (equipment.armor && equipment.armor.bonuses) {
            let b = equipment.armor.bonuses;
            if (b.hpMult) total.hpMult *= b.hpMult;
            if (b.speedMult) total.speedMult *= b.speedMult;
            if (b.damageReduction) total.damageReduction += b.damageReduction;
            if (b.reflectChance) total.reflectChance += b.reflectChance;
            if (b.regen) total.regen += b.regen;
        }
        return total;
    }

    // ============================================================
    // ПАТЧИ
    // ============================================================
    function patchUpdatePlayerStats() {
        if (typeof window.updatePlayerStats !== 'function') return false;
        if (window._craftUpdateStatsPatched) return true;
        let original = window.updatePlayerStats;
        window.updatePlayerStats = function() {
            let eq = getEquipmentBonuses();
            let originalBonus = window.teamHpBonus || 0;
            try {
                if (eq.hpMult !== 1.0) {
                    let baseHp = 50 + (typeof upgrades !== 'undefined' ? upgrades.hp.level * upgrades.hp.increment : 0);
                    let currentTotalHp = baseHp + (window.teamHpBonus || 0);
                    let desiredTotal = currentTotalHp * eq.hpMult;
                    window.teamHpBonus = desiredTotal - baseHp;
                }
            } catch(e) {}
            let result = original.apply(this, arguments);
            window.teamHpBonus = originalBonus;
            return result;
        };
        window._craftUpdateStatsPatched = true;
        return true;
    }

    function patchSaveAll() {
        if (typeof window.saveAll !== 'function') return false;
        if (window._craftSaveAllPatched) return true;
        let original = window.saveAll;
        window.saveAll = function() {
            try {
                if (typeof slotData !== 'undefined' && slotData) {
                    slotData.resources = JSON.parse(JSON.stringify(resources));
                    slotData.equipment = JSON.parse(JSON.stringify(equipment));
                    slotData.weaponStorage = JSON.parse(JSON.stringify(weaponStorage));
                    slotData.armorStorage = JSON.parse(JSON.stringify(armorStorage));
                }
            } catch(e) {}
            return original.apply(this, arguments);
        };
        window._craftSaveAllPatched = true;
        return true;
    }

    function patchLoadGameData() {
        if (typeof window.loadGameData !== 'function') return false;
        if (window._craftLoadPatched) return true;
        let original = window.loadGameData;
        window.loadGameData = function(d) {
            resources = {};
            equipment = { weapon: null, armor: null };
            weaponStorage = [];
            armorStorage = [];
            if (d && d.resources) resources = JSON.parse(JSON.stringify(d.resources));
            if (d && d.equipment) equipment = JSON.parse(JSON.stringify(d.equipment));
            if (d && d.weaponStorage) weaponStorage = JSON.parse(JSON.stringify(d.weaponStorage));
            if (d && d.armorStorage) armorStorage = JSON.parse(JSON.stringify(d.armorStorage));
            let result = original.apply(this, arguments);
            syncToSlotData();
            return result;
        };
        window._craftLoadPatched = true;
        return true;
    }

    function patchInitNewGame() {
        if (typeof window.initNewGame !== 'function') return false;
        if (window._craftInitPatched) return true;
        let original = window.initNewGame;
        window.initNewGame = function() {
            resources = {};
            equipment = { weapon: null, armor: null };
            weaponStorage = [];
            armorStorage = [];
            let result = original.apply(this, arguments);
            syncToSlotData();
            return result;
        };
        window._craftInitPatched = true;
        return true;
    }

    function patchSwitchToSlot() {
        if (typeof window.switchToSlot !== 'function') return false;
        if (window._craftSwitchSlotPatched) return true;
        let original = window.switchToSlot;
        window.switchToSlot = function(slot) {
            syncToSlotData();
            if (typeof saveAll === 'function') saveAll();
            return original.apply(this, arguments);
        };
        window._craftSwitchSlotPatched = true;
        return true;
    }

    function patchVictory() {
        if (typeof window.victory !== 'function') return false;
        if (window._craftVictoryPatched) return true;
        let original = window.victory;
        window.victory = function() {
            try {
                let isBoss = (wave % 10 === 0);
                tryDropResources(wave, isBoss);
            } catch(e) {}
            return original.apply(this, arguments);
        };
        window._craftVictoryPatched = true;
        return true;
    }

    function patchRunAfkTick() {
        if (typeof window.runAfkTick !== 'function') return false;
        if (window._craftAfkPatched) return true;
        let original = window.runAfkTick;
        window.runAfkTick = function() {
            try {
                if (Math.random() < 0.3) tryDropResources(afkCurrentWave || wave, false);
            } catch(e) {}
            return original.apply(this, arguments);
        };
        window._craftAfkPatched = true;
        return true;
    }

    // ============================================================
    // РЕНДЕР
    // ============================================================
    let currentInvTab = "items";
    let currentCraftTab = "processes";
    let currentEquipTab = "weapons"; // weapons | armors

    function renderInventoryExtended() {
        let container = document.getElementById("inventoryContent");
        if (!container) return;
        let html = '';

        html += '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">';
        let tabs = [
            { id: "items", label: "📦 Предметы" },
            { id: "resources", label: "💎 Ресурсы" },
            { id: "equipment", label: "⚔️ Снаряжение" },
            { id: "craft", label: "🔥 Ковка" }
        ];
        for (let t of tabs) {
            let active = (t.id === currentInvTab);
            html += '<button class="btn" onclick="switchInvTab(\'' + t.id + '\')" style="flex:1;min-width:80px;padding:8px 4px;font-size:11px;font-weight:900;' + (active ? 'background:linear-gradient(135deg,#f5af19,#f12711);border:none;color:#fff;' : 'background:#2c2c3a;') + '">' + t.label + '</button>';
        }
        html += '</div>';

        html += '<div id="invTabContent">';
        if (currentInvTab === "items") html += renderItemsTab();
        else if (currentInvTab === "resources") html += renderResourcesTab();
        else if (currentInvTab === "equipment") html += renderEquipmentTab();
        else if (currentInvTab === "craft") html += renderCraftTab();
        html += '</div>';
        container.innerHTML = html;
    }

    function renderItemsTab() {
        let html = '';
        html += '<div style="background:rgba(0,0,0,0.3);border-radius:14px;padding:12px;margin-bottom:12px;">';
        let hungerColor = (typeof hunger !== 'undefined') ? (hunger < 30 ? "#2ecc71" : hunger < 60 ? "#f5af19" : hunger < 85 ? "#e67e22" : "#e74c3c") : "#aaa";
        html += '<div style="font-weight:800;font-size:13px;margin-bottom:6px;">🍽️ Голод: <span style="color:' + hungerColor + ';">' + Math.floor(hunger || 0) + '%</span></div>';
        html += '<div style="background:rgba(0,0,0,0.5);border-radius:6px;height:10px;overflow:hidden;"><div style="width:' + (hunger || 0) + '%;height:100%;background:' + hungerColor + ';"></div></div>';
        html += '</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;">';
        let currentStars = (typeof points !== 'undefined') ? points : 0;
        html += '<div style="background:linear-gradient(180deg,#3a2f15,#1a1510);border:2px solid #f5af19;border-radius:14px;padding:10px 6px;text-align:center;">';
        html += '<div onclick="showItemModal(\'star\')" style="cursor:pointer;">';
        html += '<div style="font-size:36px;">⭐</div>';
        html += '<div style="font-size:11px;font-weight:800;margin-top:4px;color:#f5af19;">Звезда</div>';
        html += '<div style="font-size:12px;font-weight:900;color:#f5af19;">x' + currentStars + '</div>';
        html += '</div></div>';
        if (typeof ITEMS !== 'undefined' && typeof getItemCount === 'function') {
            for (let id in ITEMS) {
                if (id === "star") continue;
                let count = getItemCount(id);
                if (count > 0) {
                    let item = ITEMS[id];
                    html += '<div style="background:linear-gradient(180deg,#1e1e2f,#151522);border:2px solid rgba(255,255,255,0.08);border-radius:14px;padding:10px 6px;text-align:center;">';
                    html += '<div onclick="showItemModal(\'' + id + '\')" style="cursor:pointer;">';
                    html += '<div style="font-size:36px;">' + item.icon + '</div>';
                    html += '<div style="font-size:11px;font-weight:800;margin-top:4px;">' + item.name + '</div>';
                    html += '<div style="font-size:12px;font-weight:900;color:#f5af19;">x' + count + '</div>';
                    html += '</div></div>';
                }
            }
        }
        html += '</div>';
        return html;
    }

    function renderResourcesTab() {
        let html = '';
        html += '<div style="font-weight:900;font-size:13px;color:#aaddff;margin-bottom:8px;">🌍 БАЗОВЫЕ РЕСУРСЫ</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(85px,1fr));gap:6px;margin-bottom:15px;">';
        for (let id in RESOURCES) html += renderResourceCell(id, RESOURCES[id]);
        html += '</div>';
        html += '<div style="font-weight:900;font-size:13px;color:#e056fd;margin-bottom:8px;">⚗️ ПРОМЕЖУТОЧНЫЕ МАТЕРИАЛЫ</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(85px,1fr));gap:6px;">';
        for (let id in INTERMEDIATE) html += renderResourceCell(id, INTERMEDIATE[id]);
        html += '</div>';
        return html;
    }

    function renderResourceCell(id, data) {
        let count = getResource(id);
        let countColor = count > 0 ? "#f5af19" : "#555";
        let borderColor = count > 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";
        let opacity = count > 0 ? "1" : "0.4";
        return '<div style="background:linear-gradient(180deg,#1e1e2f,#151522);border:2px solid ' + borderColor + ';border-radius:12px;padding:8px 4px;text-align:center;opacity:' + opacity + ';" onclick="showResourceInfo(\'' + id + '\')">' +
            '<div style="font-size:28px;">' + data.icon + '</div>' +
            '<div style="font-size:10px;font-weight:800;margin-top:2px;line-height:1.1;">' + data.name + '</div>' +
            '<div style="font-size:11px;font-weight:900;color:' + countColor + ';margin-top:2px;">x' + count + '</div>' +
            '</div>';
    }

    // ★★★ ГЛАВНОЕ: СНАРЯЖЕНИЕ С ХРАНИЛИЩЕМ ★★★
    function renderEquipmentTab() {
        let html = '';
        let eq = getEquipmentBonuses();

        // === 2 слота: надетое оружие + броня ===
        html += '<div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap;">';
        // Оружие
        html += '<div style="flex:1;min-width:150px;background:rgba(0,0,0,0.4);border:2px dashed rgba(255,255,255,0.15);border-radius:16px;padding:12px;text-align:center;">';
        html += '<div style="font-size:11px;color:#aaa;margin-bottom:6px;">⚔️ НАДЕТО</div>';
        if (equipment.weapon) {
            html += '<div style="font-size:36px;">' + equipment.weapon.icon + '</div>';
            html += '<div style="font-weight:900;font-size:13px;margin-top:6px;">' + equipment.weapon.name + '</div>';
            html += '<div class="rarity-tag ' + equipment.weapon.rarityClass + '" style="margin:4px 0;font-size:10px;">' + equipment.weapon.rarity + '</div>';
            html += '<button class="btn" style="margin-top:8px;padding:4px 10px;font-size:10px;background:#e74c3c;" onclick="unequipWeapon()">Снять</button>';
        } else {
            html += '<div style="font-size:36px;opacity:0.3;">⚔️</div>';
            html += '<div style="font-size:11px;color:#888;margin-top:6px;">Пусто</div>';
        }
        html += '</div>';
        // Броня
        html += '<div style="flex:1;min-width:150px;background:rgba(0,0,0,0.4);border:2px dashed rgba(255,255,255,0.15);border-radius:16px;padding:12px;text-align:center;">';
        html += '<div style="font-size:11px;color:#aaa;margin-bottom:6px;">🛡️ НАДЕТО</div>';
        if (equipment.armor) {
            html += '<div style="font-size:36px;">' + equipment.armor.icon + '</div>';
            html += '<div style="font-weight:900;font-size:13px;margin-top:6px;">' + equipment.armor.name + '</div>';
            html += '<div class="rarity-tag ' + equipment.armor.rarityClass + '" style="margin:4px 0;font-size:10px;">' + equipment.armor.rarity + '</div>';
            html += '<button class="btn" style="margin-top:8px;padding:4px 10px;font-size:10px;background:#e74c3c;" onclick="unequipArmor()">Снять</button>';
        } else {
            html += '<div style="font-size:36px;opacity:0.3;">🛡️</div>';
            html += '<div style="font-size:11px;color:#888;margin-top:6px;">Пусто</div>';
        }
        html += '</div>';
        html += '</div>';

        // Бонусы
        html += '<div style="background:rgba(0,0,0,0.3);border-radius:14px;padding:12px;font-size:12px;line-height:1.8;margin-bottom:15px;">';
        html += '<div style="font-weight:900;margin-bottom:8px;color:#f5af19;">📊 СУММАРНЫЕ БОНУСЫ</div>';
        let hasBonus = false;
        if (eq.hpMult !== 1.0) { html += '<div>❤️ HP: <b style="color:#2ecc71;">+' + Math.round((eq.hpMult - 1) * 100) + '%</b></div>'; hasBonus = true; }
        if (eq.speedMult !== 1.0) {
            let speedPct = Math.round((eq.speedMult - 1) * 100);
            let speedColor = speedPct >= 0 ? "#2ecc71" : "#e74c3c";
            html += '<div>⚡ Скорость: <b style="color:' + speedColor + ';">' + (speedPct >= 0 ? "+" : "") + speedPct + '%</b></div>';
            hasBonus = true;
        }
        if (eq.damageReduction > 0) { html += '<div>🛡️ Поглощение: <b style="color:#2ecc71;">' + Math.round(eq.damageReduction * 100) + '%</b></div>'; hasBonus = true; }
        if (eq.reflectChance > 0) { html += '<div>🪞 Отражение: <b style="color:#9b59b6;">' + Math.round(eq.reflectChance * 100) + '%</b></div>'; hasBonus = true; }
        if (eq.regen > 0) { html += '<div>💚 Регенерация: <b style="color:#2ecc71;">' + (eq.regen * 100).toFixed(1) + '%/сек</b></div>'; hasBonus = true; }
        if (!hasBonus) html += '<div style="color:#888;">Нет активных бонусов</div>';
        html += '</div>';

        // ★★★ ХРАНИЛИЩЕ ★★★
        html += '<div style="font-weight:900;font-size:14px;color:#f5af19;margin-bottom:10px;">🎒 ХРАНИЛИЩЕ</div>';

        // Подвкладки хранилища
        html += '<div style="display:flex;gap:6px;margin-bottom:10px;">';
        let eqTabs = [
            { id: "weapons", label: "⚔️ Оружие (" + weaponStorage.length + ")" },
            { id: "armors", label: "🛡️ Броня (" + armorStorage.length + ")" }
        ];
        for (let t of eqTabs) {
            let active = (t.id === currentEquipTab);
            html += '<button class="btn" onclick="switchEquipTab(\'' + t.id + '\')" style="flex:1;padding:6px 4px;font-size:11px;font-weight:900;' + (active ? 'background:linear-gradient(135deg,#f5af19,#f12711);border:none;color:#fff;' : 'background:#2c2c3a;') + '">' + t.label + '</button>';
        }
        html += '</div>';

        let storage = (currentEquipTab === "weapons") ? weaponStorage : armorStorage;
        if (storage.length === 0) {
            html += '<div style="text-align:center;color:#888;padding:20px;font-weight:bold;">Хранилище пусто</div>';
        } else {
            html += '<div style="display:flex;flex-direction:column;gap:6px;">';
            for (let item of storage) {
                html += '<div style="background:rgba(0,0,0,0.35);border-radius:12px;padding:10px;border-left:4px solid ' + getRarityHex(item.rarity) + ';display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">';
                html += '<div style="flex:1;min-width:120px;">';
                html += '<div style="font-weight:900;font-size:13px;">' + item.icon + ' ' + item.name + '</div>';
                html += '<div class="rarity-tag ' + item.rarityClass + '" style="margin:4px 0;font-size:10px;display:inline-block;">' + item.rarity + '</div>';
                if (item.damageMult) html += '<div style="font-size:10px;color:#aaa;">💪 x' + item.damageMult + ' | ⚡ ' + item.shootRate + '</div>';
                html += '</div>';
                html += '<div style="display:flex;gap:4px;">';
                html += '<button class="btn btn-primary" style="padding:5px 10px;font-size:11px;" onclick="equipFromStorage(' + item.uid + ',\'' + (currentEquipTab === "weapons" ? "weapon" : "armor") + '\')">⚔️ Надеть</button>';
                html += '<button class="btn" style="padding:5px 10px;font-size:11px;background:#f5af19;color:#000;" onclick="sellFromStorage(' + item.uid + ',\'' + (currentEquipTab === "weapons" ? "weapon" : "armor") + '\')">💰</button>';
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
        }

        return html;
    }

    function renderCraftTab() {
        let html = '';
        let freeMode = isModer();
        if (freeMode) {
            html += '<div style="background:linear-gradient(135deg,rgba(155,89,182,0.3),rgba(224,86,253,0.2));border:2px solid #e056fd;border-radius:14px;padding:10px;text-align:center;font-weight:900;color:#e056fd;margin-bottom:15px;">👑 МОДЕР-РЕЖИМ — ВСЁ БЕСПЛАТНО</div>';
        }
        html += '<div style="display:flex;gap:6px;margin-bottom:12px;">';
        let craftTabs = [
            { id: "processes", label: "⚗️ Материалы" },
            { id: "weapons", label: "⚔️ Оружие" },
            { id: "armors", label: "🛡️ Броня" }
        ];
        for (let t of craftTabs) {
            let active = (t.id === currentCraftTab);
            html += '<button class="btn" onclick="switchCraftTab(\'' + t.id + '\')" style="flex:1;padding:8px 4px;font-size:11px;font-weight:900;' + (active ? 'background:linear-gradient(135deg,#f5af19,#f12711);border:none;color:#fff;' : 'background:#2c2c3a;') + '">' + t.label + '</button>';
        }
        html += '</div>';
        if (currentCraftTab === "processes") {
            html += '<div style="font-weight:900;font-size:13px;color:#e056fd;margin-bottom:8px;">⚗️ ПРОЦЕССЫ И МАТЕРИАЛЫ</div>';
            for (let p of PROCESSES) html += renderProcess(p);
        } else if (currentCraftTab === "weapons") {
            html += '<div style="font-weight:900;font-size:13px;color:#f5af19;margin-bottom:8px;">⚔️ ОРУЖИЕ (по редкости)</div>';
            for (let r of WEAPON_RECIPES) html += renderRecipe(r, "weapon");
        } else if (currentCraftTab === "armors") {
            html += '<div style="font-weight:900;font-size:13px;color:#f5af19;margin-bottom:8px;">🛡️ БРОНЯ (по редкости)</div>';
            for (let r of ARMOR_RECIPES) html += renderRecipe(r, "armor");
        }
        return html;
    }

    function renderProcess(p) {
        let freeMode = isModer();
        let canMake = canCraft(p.input);
        let html = '';
        html += '<div style="background:rgba(0,0,0,0.35);border-radius:14px;padding:12px;margin-bottom:8px;border-left:4px solid #e056fd;">';
        html += '<div style="font-weight:900;font-size:13px;">' + p.icon + ' ' + p.name + '</div>';
        html += '<div style="font-size:10px;color:#aaa;margin-top:4px;">' + p.desc + '</div>';
        html += '<div style="margin-top:10px;font-size:11px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">';
        for (let id in p.input) {
            let need = p.input[id], have = getResource(id);
            let ok = have >= need;
            let color = freeMode ? "#2ecc71" : (ok ? "#2ecc71" : "#e74c3c");
            let icon = RESOURCES[id] ? RESOURCES[id].icon : (INTERMEDIATE[id] ? INTERMEDIATE[id].icon : "📦");
            html += '<span style="background:rgba(0,0,0,0.4);padding:3px 8px;border-radius:12px;color:' + color + ';font-weight:bold;">' + icon + ' ' + (freeMode ? "∞" : have) + '/' + need + '</span>';
        }
        html += '<span style="color:#e056fd;font-weight:900;">→</span>';
        for (let id in p.output) {
            let icon = RESOURCES[id] ? RESOURCES[id].icon : (INTERMEDIATE[id] ? INTERMEDIATE[id].icon : "📦");
            let name = RESOURCES[id] ? RESOURCES[id].name : (INTERMEDIATE[id] ? INTERMEDIATE[id].name : id);
            html += '<span style="background:rgba(224,86,253,0.2);padding:3px 8px;border-radius:12px;color:#e056fd;font-weight:bold;">' + icon + ' ' + name + '</span>';
        }
        html += '</div>';
        let btnText = freeMode ? '👑 СОЗДАТЬ БЕСПЛАТНО' : (canMake ? '⚗️ СОЗДАТЬ' : '❌ НЕ ХВАТАЕТ');
        let btnStyle = freeMode ? 'background:linear-gradient(135deg,#9b59b6,#e056fd);' : '';
        html += '<button class="btn ' + (canMake || freeMode ? 'btn-primary' : '') + '" style="width:100%;margin-top:10px;padding:8px;font-size:12px;font-weight:900;' + btnStyle + '" onclick="craftProcess(\'' + p.id + '\')" ' + (!canMake && !freeMode ? 'disabled' : '') + '>' + btnText + '</button>';
        html += '</div>';
        return html;
    }

    function renderRecipe(recipe, type) {
        let freeMode = isModer();
        let canMake = canCraft(recipe.recipe);
        let needsPrev = false, prevName = "";
        if (recipe.fromWeapon) {
            let currentW = equipment.weapon;
            let inStorage = weaponStorage.some(w => w.id === recipe.fromWeapon);
            if (!freeMode && (!currentW || currentW.id !== recipe.fromWeapon) && !inStorage) {
                needsPrev = true;
                let baseR = WEAPON_RECIPES.find(r => r.id === recipe.fromWeapon);
                prevName = baseR ? baseR.name : recipe.fromWeapon;
            }
        }
        if (recipe.fromArmor) {
            let currentA = equipment.armor;
            let inStorage = armorStorage.some(a => a.id === recipe.fromArmor);
            if (!freeMode && (!currentA || currentA.id !== recipe.fromArmor) && !inStorage) {
                needsPrev = true;
                let baseR = ARMOR_RECIPES.find(r => r.id === recipe.fromArmor);
                prevName = baseR ? baseR.name : recipe.fromArmor;
            }
        }
        let html = '';
        html += '<div style="background:rgba(0,0,0,0.35);border-radius:14px;padding:12px;margin-bottom:8px;border-left:4px solid ' + (freeMode ? '#e056fd' : getRarityHex(recipe.rarity)) + ';">';
        html += '<div style="font-weight:900;font-size:13px;">' + recipe.icon + ' ' + recipe.name + '</div>';
        html += '<div class="rarity-tag ' + recipe.rarityClass + '" style="margin:4px 0;font-size:10px;display:inline-block;">' + recipe.rarity + '</div>';
        html += '<div style="font-size:10px;color:#aaa;margin-top:4px;">' + recipe.desc + '</div>';
        if (type === "weapon") html += '<div style="font-size:10px;color:#aaa;margin-top:2px;">💪 x' + recipe.damageMult + ' | 🔫 ' + recipe.bullets + ' | ⚡ ' + recipe.shootRate + '</div>';
        if (needsPrev) html += '<div style="margin-top:8px;padding:6px 10px;background:rgba(231,76,60,0.2);border-radius:8px;font-size:11px;color:#e74c3c;font-weight:bold;">🔒 Требуется: ' + prevName + '</div>';
        if (!freeMode) {
            html += '<div style="margin-top:10px;font-size:11px;display:flex;flex-wrap:wrap;gap:6px;">';
            for (let id in recipe.recipe) {
                let need = recipe.recipe[id], have = getResource(id);
                let ok = have >= need;
                let color = ok ? "#2ecc71" : "#e74c3c";
                let icon = RESOURCES[id] ? RESOURCES[id].icon : (INTERMEDIATE[id] ? INTERMEDIATE[id].icon : "📦");
                html += '<span style="background:rgba(0,0,0,0.4);padding:3px 8px;border-radius:12px;color:' + color + ';font-weight:bold;">' + icon + ' ' + have + '/' + need + '</span>';
            }
            html += '</div>';
        }
        let btnText = freeMode ? '👑 СОЗДАТЬ БЕСПЛАТНО' : (needsPrev ? '🔒 ТРЕБУЕТСЯ ПРЕДЫДУЩЕЕ' : (canMake ? '🔨 СОЗДАТЬ' : '❌ НЕ ХВАТАЕТ'));
        let btnStyle = freeMode ? 'background:linear-gradient(135deg,#9b59b6,#e056fd);' : '';
        html += '<button class="btn ' + (canMake || freeMode ? 'btn-primary' : '') + '" style="width:100%;margin-top:10px;padding:8px;font-size:12px;font-weight:900;' + btnStyle + '" onclick="craftItem(\'' + recipe.id + '\',\'' + type + '\')" ' + ((!canMake && !freeMode) || (needsPrev && !freeMode) ? 'disabled' : '') + '>' + btnText + '</button>';
        html += '</div>';
        return html;
    }

    function getRarityHex(rarity) {
        let map = { "Обычная": "#6c757d", "Редкая": "#17a2b8", "Сверх редкая": "#28a745", "Эпик": "#9b59b6", "Мифическая": "#e74c3c", "Легендарная": "#ffd700" };
        return map[rarity] || "#6c757d";
    }

    // ============================================================
    // ЭКСПОРТ
    // ============================================================
    window.switchInvTab = function(tabId) { currentInvTab = tabId; renderInventoryExtended(); };
    window.switchCraftTab = function(tabId) { currentCraftTab = tabId; renderInventoryExtended(); };
    window.switchEquipTab = function(tabId) { currentEquipTab = tabId; renderInventoryExtended(); };

    window.showResourceInfo = function(id) {
        let r = RESOURCES[id] || INTERMEDIATE[id];
        if (!r) return;
        let html = '<h2>' + r.icon + ' ' + r.name + '</h2>';
        html += '<div style="text-align:center;margin:10px 0;">У тебя: <b style="color:#f5af19;font-size:20px;">' + getResource(id) + '</b></div>';
        html += '<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;font-size:13px;line-height:1.5;margin-bottom:12px;">' + r.desc + '</div>';
        if (DROP_CHANCES[id]) html += '<div style="font-size:11px;color:#aaa;margin-bottom:12px;">Где найти: с врагов с волны ' + DROP_CHANCES[id].minWave + '+</div>';
        html += '<button class="btn" style="width:100%;padding:10px;" onclick="closeModal()">Закрыть</button>';
        let el = document.getElementById("modalContent");
        if (el) el.innerHTML = html;
        el = document.getElementById("modalOverlay");
        if (el) el.style.display = "flex";
    };

    window.equipWeapon = equipWeapon;
    window.equipArmor = equipArmor;
    window.unequipWeapon = unequipWeapon;
    window.unequipArmor = unequipArmor;
    window.equipFromStorage = equipFromStorage;
    window.sellFromStorage = sellFromStorage;
    window.craftItem = craftItem;
    window.craftProcess = craftProcess;
    window.getEquipmentBonuses = getEquipmentBonuses;
    window.tryDropResources = tryDropResources;
    window.addResource = addResource;
    window.getResource = getResource;
    window.RESOURCES = RESOURCES;
    window.INTERMEDIATE = INTERMEDIATE;
    window.PROCESSES = PROCESSES;
    window.WEAPON_RECIPES = WEAPON_RECIPES;
    window.ARMOR_RECIPES = ARMOR_RECIPES;
    window.isCraftModer = isModer;

    window.getResourcesData = function() { return resources; };
    window.setResourcesData = function(data) { resources = data || {}; };
    window.getEquipmentData = function() { return equipment; };
    window.setEquipmentData = function(data) { equipment = data || { weapon: null, armor: null }; };
    window.getWeaponStorage = function() { return weaponStorage; };
    window.getArmorStorage = function() { return armorStorage; };

    window.renderInventory = renderInventoryExtended;

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================
    function init() {
        let attempts = 0;
        let maxAttempts = 100;
        function tryPatch() {
            attempts++;
            let a = patchSaveAll();
            let b = patchLoadGameData();
            let c = patchInitNewGame();
            let d = patchSwitchToSlot();
            let e = patchUpdatePlayerStats();
            let f = patchVictory();
            let g = patchRunAfkTick();
            if (a && b && c && d && e && f && g) {
                console.log("╔════════════════════════════════════════╗");
                console.log("║  🔨 CRAFTING v2.1 загружено            ║");
                console.log("║  🎒 Хранилище снаряжения работает      ║");
                console.log("║  Внутри вкладки «Снаряжение»           ║");
                console.log("╚════════════════════════════════════════╝");
                return;
            }
            if (attempts < maxAttempts) setTimeout(tryPatch, 100);
        }
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(tryPatch, 500);
        } else {
            document.addEventListener("DOMContentLoaded", function() { setTimeout(tryPatch, 800); });
        }
    }

    init();
})();
