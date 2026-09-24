// ============================================================
// CRAFTING & EQUIPMENT v1.1 — Фикс сохранения ресурсов по слотам
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

    // ========== РЕСУРСЫ ==========
    const RESOURCES = {
        leather:   { name: "Кожа",              icon: "🟫", tier: 1, desc: "Прочная кожа. Основа лёгкой брони." },
        iron:      { name: "Железо",            icon: "⚙️", tier: 1, desc: "Обычный металл. Для оружия и доспехов." },
        wood:      { name: "Древесина",         icon: "🪵", tier: 1, desc: "Крепкое дерево. Для рукоятей." },
        steel:     { name: "Сталь",             icon: "🔩", tier: 2, desc: "Крепче железа. Для хорошего оружия." },
        silver:    { name: "Серебро",           icon: "🥈", tier: 2, desc: "Благородный металл. Усиливает оружие." },
        mithril:   { name: "Мифрил",            icon: "💠", tier: 3, desc: "Лёгкий и прочный. Для эпической брони." },
        epic_stone:{ name: "Эпический камень",  icon: "🟪", tier: 3, desc: "Сгусток силы. Усиливает оружие." },
        adamantite:{ name: "Адамантин",         icon: "🔶", tier: 4, desc: "Легендарный металл. Оружие богов." },
        legendary_stone:{ name: "Легендарный камень", icon: "🟨", tier: 4, desc: "Кристалл чистой силы." }
    };

    const DROP_CHANCES = {
        leather:    { minWave: 1,   baseChance: 0.15, maxChance: 0.30 },
        iron:       { minWave: 1,   baseChance: 0.12, maxChance: 0.25 },
        wood:       { minWave: 1,   baseChance: 0.18, maxChance: 0.32 },
        steel:      { minWave: 100, baseChance: 0.06, maxChance: 0.18 },
        silver:     { minWave: 100, baseChance: 0.03, maxChance: 0.10 },
        mithril:    { minWave: 300, baseChance: 0.03, maxChance: 0.08 },
        epic_stone: { minWave: 300, baseChance: 0.015, maxChance: 0.05 },
        adamantite: { minWave: 500, baseChance: 0.01, maxChance: 0.03 },
        legendary_stone: { minWave: 500, baseChance: 0.005, maxChance: 0.02 }
    };

    // ========== РЕЦЕПТЫ ОРУЖИЯ ==========
    const WEAPON_RECIPES = [
        { id: "pistol_common", name: "Пистолет", icon: "🔫", rarity: "Обычная", rarityClass: "common",
          damageMult: 1.0, shootRate: 12, bullets: 1,
          desc: "Стандартное оружие. 1 пуля.",
          recipe: { iron: 10, wood: 5 } },

        { id: "shotgun_common", name: "Дробовик", icon: "🔫", rarity: "Обычная", rarityClass: "common",
          damageMult: 0.8, shootRate: 20, bullets: 3, spread: 0.3,
          desc: "3 пули веером. Мощнее, но реже.",
          recipe: { iron: 15, wood: 10 } },

        { id: "sniper_rare", name: "Снайперка", icon: "🎯", rarity: "Редкая", rarityClass: "rare",
          damageMult: 4.0, shootRate: 60, bullets: 1,
          desc: "1 мощная пуля раз в 2 сек.",
          recipe: { steel: 20, silver: 5 } },

        { id: "sword_rare", name: "Меч", icon: "⚔️", rarity: "Редкая", rarityClass: "rare",
          damageMult: 1.5, shootRate: 18, bullets: 1, isMelee: true,
          desc: "Ближний бой + летящая волна.",
          recipe: { steel: 25, silver: 10 } },

        { id: "smg_superrare", name: "Пулемёт", icon: "🔫", rarity: "Сверх редкая", rarityClass: "superrare",
          damageMult: 0.5, shootRate: 5, bullets: 1,
          desc: "Очень быстрая стрельба.",
          recipe: { mithril: 30, epic_stone: 10 } },

        { id: "dual_pistol_legendary", name: "Двойной пистолет", icon: "🔫🔫", rarity: "Легендарная", rarityClass: "legendary",
          damageMult: 2.0, shootRate: 10, bullets: 2, spread: 0.15,
          desc: "Два пистолета — двойной урон.",
          legendaryPerk: "doubleShot",
          recipe: { adamantite: 50, legendary_stone: 20 } },

        { id: "sniper_autolock_legendary", name: "Снайперка «Прицел»", icon: "🎯", rarity: "Легендарная", rarityClass: "legendary",
          damageMult: 5.0, shootRate: 60, bullets: 1,
          desc: "+35% авто-наведение на босса.",
          legendaryPerk: "autoAim35",
          recipe: { adamantite: 50, legendary_stone: 20 } },

        { id: "sword_destroyer_legendary", name: "Меч «Разрушитель»", icon: "⚔️", rarity: "Легендарная", rarityClass: "legendary",
          damageMult: 2.0, shootRate: 16, bullets: 1, isMelee: true,
          desc: "Шанс уничтожать атаки босса.",
          legendaryPerk: "destroyAttacks",
          recipe: { adamantite: 60, legendary_stone: 25 } },

        { id: "shotgun_absorb_legendary", name: "Дробовик «Поглотитель»", icon: "🔫", rarity: "Легендарная", rarityClass: "legendary",
          damageMult: 1.2, shootRate: 18, bullets: 4, spread: 0.4,
          desc: "+15% поглощения урона.",
          legendaryPerk: "absorb15",
          recipe: { adamantite: 55, legendary_stone: 20 } },

        { id: "smg_rage_legendary", name: "Пулемёт «Ярость»", icon: "🔫", rarity: "Легендарная", rarityClass: "legendary",
          damageMult: 0.7, shootRate: 5, bullets: 1,
          desc: "Чем меньше HP — тем быстрее (макс +25%).",
          legendaryPerk: "rageSpeed",
          recipe: { adamantite: 60, legendary_stone: 25 } }
    ];

    // ========== РЕЦЕПТЫ БРОНИ ==========
    const ARMOR_RECIPES = [
        { id: "jacket_common", name: "Кожаная куртка", icon: "🧥", rarity: "Обычная", rarityClass: "common",
          bonuses: { speedMult: 1.05 },
          desc: "+5% скорость передвижения.",
          recipe: { leather: 10, wood: 5 } },

        { id: "chainmail_rare", name: "Кольчуга", icon: "⛓️", rarity: "Редкая", rarityClass: "rare",
          bonuses: { hpMult: 1.10, damageReduction: 0.03 },
          desc: "+10% HP, +3% поглощение урона.",
          recipe: { iron: 20, steel: 10 } },

        { id: "heavy_superrare", name: "Тяжёлый доспех", icon: "🛡️", rarity: "Сверх редкая", rarityClass: "superrare",
          bonuses: { hpMult: 1.30, speedMult: 0.90 },
          desc: "+30% HP, -10% скорость.",
          recipe: { steel: 30, mithril: 15 } },

        { id: "mage_epic", name: "Мантия мага", icon: "🧙", rarity: "Эпик", rarityClass: "epic",
          bonuses: { reflectChance: 0.05, hpMult: 1.05 },
          desc: "5% шанс отражения урона, +5% HP.",
          recipe: { mithril: 15, epic_stone: 5 } },

        { id: "jacket_legendary", name: "Куртка «Скороход»", icon: "🧥", rarity: "Легендарная", rarityClass: "legendary",
          bonuses: { speedMult: 1.25, hpMult: 1.10 },
          desc: "+25% скорость, +10% HP.",
          recipe: { adamantite: 40, legendary_stone: 15 } },

        { id: "chainmail_legendary", name: "Кольчуга «Стальная стена»", icon: "⛓️", rarity: "Легендарная", rarityClass: "legendary",
          bonuses: { hpMult: 1.50, damageReduction: 0.15 },
          desc: "+50% HP, +15% поглощение урона.",
          recipe: { adamantite: 50, legendary_stone: 20 } },

        { id: "titan_legendary", name: "Доспех титана", icon: "🗿", rarity: "Легендарная", rarityClass: "legendary",
          bonuses: { hpMult: 4.0, speedMult: 0.60, regen: 0.03 },
          desc: "+300% HP, реген 3%/сек, -40% скорость.",
          recipe: { adamantite: 80, legendary_stone: 30 } }
    ];

    // ========== ДАННЫЕ (привязаны к слоту через slotData) ==========
    let resources = {};        // текущие ресурсы игрока
    let equipment = { weapon: null, armor: null };

    // ========== ФУНКЦИИ РЕСУРСОВ ==========
    function addResource(id, count) {
        if (!RESOURCES[id]) return;
        if (!resources[id]) resources[id] = 0;
        resources[id] += count;
        // ★ Сразу сохраняем в slotData ★
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
    }

    function getResource(id) {
        return resources[id] || 0;
    }

    function removeResource(id, count) {
        if (!resources[id] || resources[id] < count) return false;
        resources[id] -= count;
        if (resources[id] <= 0) delete resources[id];
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        return true;
    }

    // ★ Синхронизация с slotData (чтобы сохранялось и грузилось правильно) ★
    function syncToSlotData() {
        try {
            if (typeof slotData !== 'undefined' && slotData) {
                slotData.resources = JSON.parse(JSON.stringify(resources));
                slotData.equipment = JSON.parse(JSON.stringify(equipment));
            }
        } catch(e) {}
    }

    // ========== ШАНС ДРОПА ==========
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
        for (let id in RESOURCES) {
            let chance = getDropChance(id, wave) * multiplier;
            if (Math.random() < chance) {
                let count = 1;
                if (isBoss && Math.random() < 0.3) count = 2;
                addResource(id, count);
                dropped++;
                if (typeof showFloatingText === 'function') {
                    showFloatingText(RESOURCES[id].icon + " " + RESOURCES[id].name + " +" + count, "#aaddff");
                }
            }
        }
        return dropped;
    }

    // ========== КРАФТ ==========
    function canCraft(recipe) {
        for (let id in recipe) {
            if (getResource(id) < recipe[id]) return false;
        }
        return true;
    }

    function craftItem(recipeId, type) {
        let list = (type === "weapon") ? WEAPON_RECIPES : ARMOR_RECIPES;
        let recipe = list.find(r => r.id === recipeId);
        if (!recipe) { alert("❌ Рецепт не найден"); return; }

        if (!canCraft(recipe.recipe)) {
            alert("❌ Не хватает ресурсов!");
            return;
        }

        for (let id in recipe.recipe) removeResource(id, recipe.recipe[id]);

        let item = JSON.parse(JSON.stringify(recipe));
        item.uid = Date.now() + Math.random();
        item.craftedAt = Date.now();

        if (type === "weapon" && !equipment.weapon) equipment.weapon = item;
        else if (type === "armor" && !equipment.armor) equipment.armor = item;

        syncToSlotData();

        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();

        if (typeof sfxCardObtain === 'function') sfxCardObtain();
        if (typeof showFloatingText === 'function') {
            showFloatingText("🔨 " + item.icon + " " + item.name + " создан!", "#f5af19");
        }
        alert("🔨 Создано: " + item.icon + " " + item.name + " (" + item.rarity + ")");
    }

    // ========== СНАРЯЖЕНИЕ ==========
    function equipWeapon(recipeId) {
        let recipe = WEAPON_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return;
        let item = JSON.parse(JSON.stringify(recipe));
        item.uid = Date.now() + Math.random();
        equipment.weapon = item;
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof showFloatingText === 'function') showFloatingText("⚔️ Надето: " + item.name, "#f5af19");
    }

    function equipArmor(recipeId) {
        let recipe = ARMOR_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return;
        let item = JSON.parse(JSON.stringify(recipe));
        item.uid = Date.now() + Math.random();
        equipment.armor = item;
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof showFloatingText === 'function') showFloatingText("🛡️ Надето: " + item.name, "#f5af19");
    }

    function unequipWeapon() {
        equipment.weapon = null;
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
    }

    function unequipArmor() {
        equipment.armor = null;
        syncToSlotData();
        if (typeof saveAll === 'function') saveAll();
        if (typeof renderInventory === 'function') renderInventory();
    }

    // ========== ПОЛУЧЕНИЕ БОНУСОВ ==========
    function getEquipmentBonuses() {
        let total = {
            hpMult: 1.0,
            speedMult: 1.0,
            damageReduction: 0,
            reflectChance: 0,
            regen: 0
        };
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

    // ========== ПАТЧ saveAll (принудительно сохраняем ресурсы) ==========
    function patchSaveAll() {
        if (typeof window.saveAll !== 'function') return false;
        if (window._craftSaveAllPatched) return true;

        let original = window.saveAll;
        window.saveAll = function() {
            // ★ Гарантированно записываем ресурсы и снаряжение в slotData ★
            try {
                if (typeof slotData !== 'undefined' && slotData) {
                    slotData.resources = JSON.parse(JSON.stringify(resources));
                    slotData.equipment = JSON.parse(JSON.stringify(equipment));
                }
            } catch(e) {}
            return original.apply(this, arguments);
        };

        window._craftSaveAllPatched = true;
        console.log("[CRAFT] saveAll пропатчен");
        return true;
    }

    // ========== ПАТЧ loadGameData (загружаем ресурсы ИЗ сейва) ==========
    function patchLoadGameData() {
        if (typeof window.loadGameData !== 'function') return false;
        if (window._craftLoadPatched) return true;

        let original = window.loadGameData;
        window.loadGameData = function(d) {
            // ★ Сначала сбрасываем текущие ★
            resources = {};
            equipment = { weapon: null, armor: null };

            // ★ Загружаем ИЗ сейва ★
            if (d && d.resources) {
                resources = JSON.parse(JSON.stringify(d.resources));
            }
            if (d && d.equipment) {
                equipment = JSON.parse(JSON.stringify(d.equipment));
            }

            // Вызываем оригинал (там может быть ещё код)
            let result = original.apply(this, arguments);

            // Синхронизируем slotData
            syncToSlotData();

            console.log("[CRAFT] Ресурсы загружены:", Object.keys(resources).length, "типов | Оружие:", equipment.weapon ? equipment.weapon.name : "нет", "| Броня:", equipment.armor ? equipment.armor.name : "нет");
            return result;
        };

        window._craftLoadPatched = true;
        console.log("[CRAFT] loadGameData пропатчен");
        return true;
    }

    // ========== ПАТЧ initNewGame (сброс при новой игре) ==========
    function patchInitNewGame() {
        if (typeof window.initNewGame !== 'function') return false;
        if (window._craftInitPatched) return true;

        let original = window.initNewGame;
        window.initNewGame = function() {
            resources = {};
            equipment = { weapon: null, armor: null };
            let result = original.apply(this, arguments);
            syncToSlotData();
            return result;
        };

        window._craftInitPatched = true;
        console.log("[CRAFT] initNewGame пропатчен");
        return true;
    }

    // ========== ПАТЧ switchToSlot (переключение слотов) ==========
    function patchSwitchToSlot() {
        if (typeof window.switchToSlot !== 'function') return false;
        if (window._craftSwitchSlotPatched) return true;

        let original = window.switchToSlot;
        window.switchToSlot = function(slot) {
            // ★ Перед переключением сохраняем текущие ресурсы в старый слот ★
            syncToSlotData();
            if (typeof saveAll === 'function') saveAll();

            // Переключаем
            let result = original.apply(this, arguments);

            // ★ После — загрузка ресурсов нового слота уже произошла в loadGameData ★
            console.log("[CRAFT] Слот переключён:", slot, "| Ресурсов:", Object.keys(resources).length);
            return result;
        };

        window._craftSwitchSlotPatched = true;
        return true;
    }

    // ========== ПАТЧ getPassiveModifiers (HP от брони) ==========
    function patchPassiveModifiers() {
        if (typeof window.getPassiveModifiers !== 'function') return false;
        if (window._craftPassivePatched) return true;

        let original = window.getPassiveModifiers;
        window.getPassiveModifiers = function() {
            let result = original.apply(this, arguments);
            let eq = getEquipmentBonuses();
            if (eq.hpMult !== 1.0) result.hpMult *= eq.hpMult;
            return result;
        };
        window._craftPassivePatched = true;
        return true;
    }

    // ========== ПАТЧ victory (дроп ресурсов) ==========
    function patchVictory() {
        if (typeof window.victory !== 'function') return false;
        if (window._craftVictoryPatched) return true;

        let original = window.victory;
        window.victory = function() {
            try {
                let isBoss = (wave % 10 === 0);
                tryDropResources(wave, isBoss);
            } catch(e) { console.warn("[CRAFT] Ошибка дропа:", e); }
            return original.apply(this, arguments);
        };
        window._craftVictoryPatched = true;
        return true;
    }

    // ========== ПАТЧ runAfkTick (дроп в АФК) ==========
    function patchRunAfkTick() {
        if (typeof window.runAfkTick !== 'function') return false;
        if (window._craftAfkPatched) return true;

        let original = window.runAfkTick;
        window.runAfkTick = function() {
            try {
                if (Math.random() < 0.3) {
                    tryDropResources(afkCurrentWave || wave, false);
                }
            } catch(e) {}
            return original.apply(this, arguments);
        };
        window._craftAfkPatched = true;
        return true;
    }

    // ========== РЕНДЕР ИНВЕНТАРЯ ==========
    let currentInvTab = "items";

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
        let hasAny = false;

        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;">';

        for (let id in RESOURCES) {
            let count = getResource(id);
            if (count > 0) hasAny = true;
            let r = RESOURCES[id];
            let countColor = count > 0 ? "#f5af19" : "#555";
            let borderColor = count > 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";
            let opacity = count > 0 ? "1" : "0.4";
            html += '<div style="background:linear-gradient(180deg,#1e1e2f,#151522);border:2px solid ' + borderColor + ';border-radius:14px;padding:10px 6px;text-align:center;opacity:' + opacity + ';" onclick="showResourceInfo(\'' + id + '\')">';
            html += '<div style="font-size:36px;">' + r.icon + '</div>';
            html += '<div style="font-size:11px;font-weight:800;margin-top:4px;line-height:1.2;">' + r.name + '</div>';
            html += '<div style="font-size:12px;font-weight:900;color:' + countColor + ';margin-top:2px;">x' + count + '</div>';
            html += '</div>';
        }

        html += '</div>';

        if (!hasAny) {
            html += '<div style="text-align:center;color:#888;padding:20px;font-weight:bold;">Нет ресурсов. Убивай врагов — они падают!</div>';
        }

        return html;
    }

    function renderEquipmentTab() {
        let html = '';
        let eq = getEquipmentBonuses();

        html += '<div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap;">';

        html += '<div style="flex:1;min-width:150px;background:rgba(0,0,0,0.4);border:2px dashed rgba(255,255,255,0.15);border-radius:16px;padding:12px;text-align:center;">';
        html += '<div style="font-size:11px;color:#aaa;margin-bottom:6px;">⚔️ ОРУЖИЕ</div>';
        if (equipment.weapon) {
            html += '<div style="font-size:36px;">' + equipment.weapon.icon + '</div>';
            html += '<div style="font-weight:900;font-size:13px;margin-top:6px;">' + equipment.weapon.name + '</div>';
            html += '<div class="rarity-tag ' + equipment.weapon.rarityClass + '" style="margin:4px 0;font-size:10px;">' + equipment.weapon.rarity + '</div>';
            html += '<div style="font-size:10px;color:#aaa;margin-top:4px;">💪 x' + equipment.weapon.damageMult + ' | ⚡ ' + equipment.weapon.shootRate + '</div>';
            html += '<button class="btn" style="margin-top:8px;padding:4px 10px;font-size:10px;background:#e74c3c;" onclick="unequipWeapon()">Снять</button>';
        } else {
            html += '<div style="font-size:36px;opacity:0.3;">⚔️</div>';
            html += '<div style="font-size:11px;color:#888;margin-top:6px;">Пусто</div>';
        }
        html += '</div>';

        html += '<div style="flex:1;min-width:150px;background:rgba(0,0,0,0.4);border:2px dashed rgba(255,255,255,0.15);border-radius:16px;padding:12px;text-align:center;">';
        html += '<div style="font-size:11px;color:#aaa;margin-bottom:6px;">🛡️ БРОНЯ</div>';
        if (equipment.armor) {
            html += '<div style="font-size:36px;">' + equipment.armor.icon + '</div>';
            html += '<div style="font-weight:900;font-size:13px;margin-top:6px;">' + equipment.armor.name + '</div>';
            html += '<div class="rarity-tag ' + equipment.armor.rarityClass + '" style="margin:4px 0;font-size:10px;">' + equipment.armor.rarity + '</div>';
            html += '<div style="font-size:10px;color:#aaa;margin-top:4px;">' + equipment.armor.desc + '</div>';
            html += '<button class="btn" style="margin-top:8px;padding:4px 10px;font-size:10px;background:#e74c3c;" onclick="unequipArmor()">Снять</button>';
        } else {
            html += '<div style="font-size:36px;opacity:0.3;">🛡️</div>';
            html += '<div style="font-size:11px;color:#888;margin-top:6px;">Пусто</div>';
        }
        html += '</div>';

        html += '</div>';

        html += '<div style="background:rgba(0,0,0,0.3);border-radius:14px;padding:12px;font-size:12px;line-height:1.8;">';
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

        return html;
    }

    function renderCraftTab() {
        let html = '';

        html += '<div style="font-weight:900;font-size:14px;color:#f5af19;margin-bottom:10px;text-align:center;">⚔️ ОРУЖИЕ</div>';
        for (let r of WEAPON_RECIPES) html += renderRecipe(r, "weapon");

        html += '<div style="font-weight:900;font-size:14px;color:#f5af19;margin:20px 0 10px;text-align:center;">🛡️ БРОНЯ</div>';
        for (let r of ARMOR_RECIPES) html += renderRecipe(r, "armor");

        return html;
    }

    function renderRecipe(recipe, type) {
        let canMake = canCraft(recipe.recipe);
        let html = '';

        html += '<div style="background:rgba(0,0,0,0.35);border-radius:14px;padding:12px;margin-bottom:8px;border-left:4px solid ' + getRarityHex(recipe.rarity) + ';">';

        html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:900;font-size:14px;">' + recipe.icon + ' ' + recipe.name + '</div>';
        html += '<div class="rarity-tag ' + recipe.rarityClass + '" style="margin:4px 0;font-size:10px;display:inline-block;">' + recipe.rarity + '</div>';
        html += '<div style="font-size:10px;color:#aaa;margin-top:4px;">' + recipe.desc + '</div>';
        if (type === "weapon") {
            html += '<div style="font-size:10px;color:#aaa;margin-top:2px;">💪 x' + recipe.damageMult + ' | 🔫 ' + recipe.bullets + ' пул(и) | ⚡ ' + recipe.shootRate + '</div>';
        }
        html += '</div>';
        html += '</div>';

        html += '<div style="margin-top:10px;font-size:11px;display:flex;flex-wrap:wrap;gap:6px;">';
        let allOk = true;
        for (let id in recipe.recipe) {
            let need = recipe.recipe[id];
            let have = getResource(id);
            let ok = have >= need;
            if (!ok) allOk = false;
            let color = ok ? "#2ecc71" : "#e74c3c";
            html += '<span style="background:rgba(0,0,0,0.4);padding:3px 8px;border-radius:12px;color:' + color + ';font-weight:bold;">' + RESOURCES[id].icon + ' ' + have + '/' + need + '</span>';
        }
        html += '</div>';

        html += '<button class="btn ' + (allOk ? 'btn-primary' : '') + '" style="width:100%;margin-top:10px;padding:8px;font-size:12px;font-weight:900;" onclick="craftItem(\'' + recipe.id + '\',\'' + type + '\')" ' + (!allOk ? 'disabled' : '') + '>' + (allOk ? '🔨 СОЗДАТЬ' : '❌ НЕ ХВАТАЕТ') + '</button>';

        html += '</div>';
        return html;
    }

    function getRarityHex(rarity) {
        let map = {
            "Обычная": "#6c757d",
            "Редкая": "#17a2b8",
            "Сверх редкая": "#28a745",
            "Эпик": "#9b59b6",
            "Мифическая": "#e74c3c",
            "Легендарная": "#ffd700"
        };
        return map[rarity] || "#6c757d";
    }

    // ========== ЭКСПОРТ ==========
    window.switchInvTab = function(tabId) {
        currentInvTab = tabId;
        renderInventoryExtended();
    };

    window.showResourceInfo = function(id) {
        let r = RESOURCES[id];
        if (!r) return;
        let html = '<h2>' + r.icon + ' ' + r.name + '</h2>';
        html += '<div style="text-align:center;margin:10px 0;">У тебя: <b style="color:#f5af19;font-size:20px;">' + getResource(id) + '</b></div>';
        html += '<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;font-size:13px;line-height:1.5;margin-bottom:12px;">' + r.desc + '</div>';
        html += '<div style="font-size:11px;color:#aaa;margin-bottom:12px;">Где найти: с врагов с волны ' + DROP_CHANCES[id].minWave + '+</div>';
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
    window.craftItem = craftItem;
    window.getEquipmentBonuses = getEquipmentBonuses;
    window.tryDropResources = tryDropResources;
    window.addResource = addResource;
    window.getResource = getResource;
    window.RESOURCES = RESOURCES;
    window.WEAPON_RECIPES = WEAPON_RECIPES;
    window.ARMOR_RECIPES = ARMOR_RECIPES;

    window.getResourcesData = function() { return resources; };
    window.setResourcesData = function(data) { resources = data || {}; };
    window.getEquipmentData = function() { return equipment; };
    window.setEquipmentData = function(data) { equipment = data || { weapon: null, armor: null }; };

    // ★ Перезаписываем рендер инвентаря ★
    window.renderInventory = renderInventoryExtended;

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        let attempts = 0;
        let maxAttempts = 100;

        function tryPatch() {
            attempts++;
            let a = patchSaveAll();
            let b = patchLoadGameData();
            let c = patchInitNewGame();
            let d = patchSwitchToSlot();
            let e = patchPassiveModifiers();
            let f = patchVictory();
            let g = patchRunAfkTick();

            if (a && b && c && d && e && f && g) {
                console.log("╔════════════════════════════════════════╗");
                console.log("║  🔨 CRAFTING v1.1 загружено            ║");
                console.log("║  ✅ Ресурсы сохраняются по слотам      ║");
                console.log("║  ✅ Ковка, снаряжение работают         ║");
                console.log("╚════════════════════════════════════════╝");
                return;
            }
            if (attempts < maxAttempts) setTimeout(tryPatch, 100);
            else console.warn("[CRAFT] Не всё пропатчено:", { saveAll: a, load: b, init: c, switch: d, passive: e, victory: f, afk: g });
        }

        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(tryPatch, 500);
        } else {
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(tryPatch, 800);
            });
        }
    }

    init();

})();
