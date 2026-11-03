/* Multiverse-Battle: unlockable character tier list */
(function () {
    "use strict";

    if (window.MBTierList && window.MBTierList.__loaded) return;

    var DEFAULT_TIERS = [
        { id: "tier_s", label: "S", color: "#ef5965" },
        { id: "tier_a", label: "A", color: "#f59e42" },
        { id: "tier_b", label: "B", color: "#e5c64c" },
        { id: "tier_c", label: "C", color: "#62b879" },
        { id: "tier_d", label: "D", color: "#579de0" },
        { id: "tier_f", label: "F", color: "#8d83a8" }
    ];
    var TIER_COLORS = ["#c77dff", "#56cfe1", "#f28482", "#90be6d", "#f6bd60", "#8d99ae"];
    var RARITY_ORDER = ["Обычная", "Редкая", "Сверх редкая", "Эпик", "Мифическая", "Легендарная", "Секретная", "Эволюционная", "Босс", "Пасхалка", "Подарочная"];
    var UNIVERSE_ALIASES = {
        "OPM": "One Punch Man",
        "JJK": "Jujutsu Kaisen",
        "MHA": "My Hero Academia",
        "AoT": "Attack on Titan",
        "DB": "Dragon Ball",
        "DS": "Demon Slayer",
        "HxH": "Hunter x Hunter",
        "Mob 100": "Mob Psycho 100",
        "One piece": "One Piece"
    };
    var view = { search: "", universe: "all", rarity: "all", sort: "source" };
    var selectedKey = null;
    var bound = false;
    var sessionUnlocked = false;

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function unlocked() {
        // The promo code grants access only for the current page session.
        // Tier assignments remain saved, but the tab itself closes on reload.
        return sessionUnlocked === true;
    }

    function safeColor(value, fallback) {
        var color = String(value || "");
        return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
    }

    function getState() {
        var saved = typeof slotData !== "undefined" && slotData ? slotData.tierListData : null;
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
            saved = {
                version: 1,
                tiers: DEFAULT_TIERS.map(function (tier) { return Object.assign({}, tier); }),
                assignments: {}
            };
        }
        if (!Array.isArray(saved.tiers) || !saved.tiers.length) {
            saved.tiers = DEFAULT_TIERS.map(function (tier) { return Object.assign({}, tier); });
        }
        saved.tiers = saved.tiers.filter(function (tier) {
            return tier && typeof tier.id === "string" && typeof tier.label === "string";
        }).slice(0, 12);
        if (!saved.tiers.length) saved.tiers = DEFAULT_TIERS.map(function (tier) { return Object.assign({}, tier); });
        saved.tiers.forEach(function (tier, index) {
            tier.label = String(tier.label || "Тир").trim().slice(0, 20) || "Тир";
            tier.color = safeColor(tier.color, DEFAULT_TIERS[index % DEFAULT_TIERS.length].color);
        });
        if (!saved.assignments || typeof saved.assignments !== "object" || Array.isArray(saved.assignments)) {
            saved.assignments = {};
        }
        saved.version = 2;
        return saved;
    }

    function persist(state) {
        if (typeof slotData === "undefined" || !slotData) return;
        slotData.tierListData = state;
        if (typeof saveAll === "function") saveAll();
    }

    function universeName(template) {
        var raw = String(template.universe || "Неизвестно");
        return UNIVERSE_ALIASES[raw] || raw;
    }

    function getCatalog() {
        var result = [];
        var seen = Object.create(null);
        var lockedCount = 0;

        function add(template, rarity, ownedOnly) {
            if (!template || typeof template.name !== "string" || !template.name.trim()) return;
            var key = String(rarity || "Неизвестно") + "::" + template.name;
            if (seen[key]) return;
            seen[key] = true;

            var patchLocked = !!(template.patchId &&
                !(window.MBPatches && typeof window.MBPatches.isUnlocked === "function" &&
                  window.MBPatches.isUnlocked(template.patchId)) &&
                !(typeof isBookCardUnlocked === "function" && isBookCardUnlocked(template.name)));
            if (patchLocked) {
                lockedCount++;
                return;
            }

            result.push({
                key: key,
                name: template.name,
                rarity: rarity || template.rarity || "Неизвестно",
                universe: universeName(template),
                template: template,
                ownedOnly: !!ownedOnly,
                sourceIndex: result.length
            });
        }

        if (typeof customCardTemplates !== "undefined" && customCardTemplates) {
            Object.entries(customCardTemplates).forEach(function (entry) {
                var rarity = entry[0];
                (Array.isArray(entry[1]) ? entry[1] : []).forEach(function (template) {
                    add(template, rarity, false);
                });
            });
        }

        if (typeof myCards !== "undefined" && Array.isArray(myCards)) {
            myCards.forEach(function (card) {
                if (!card || typeof card !== "object") return;
                add(card, card.rarity, true);
            });
        }

        return { characters: result, lockedCount: lockedCount };
    }

    function assignedTier(state, key) {
        var id = state.assignments[key];
        return state.tiers.some(function (tier) { return tier.id === id; }) ? id : null;
    }

    function cardImage(name) {
        try {
            var src = typeof getCardImage === "function" ? getCardImage(name) : null;
            return typeof src === "string" && src.trim() ? src : null;
        } catch (_error) {
            return null;
        }
    }

    function infoText(entry) {
        var t = entry.template || {};
        var stats = typeof cardStats !== "undefined" && cardStats ? (cardStats[entry.rarity] || {}) : {};
        var lines = [
            "Редкость: " + entry.rarity,
            "Вселенная: " + entry.universe,
            "Урон: " + (t.damage != null ? t.damage : (stats.damage != null ? stats.damage : "?")),
            "Здоровье: " + (t.hp != null ? t.hp : (stats.hp != null ? stats.hp : "?")),
            "Скорость: " + (t.speed != null ? t.speed : (stats.speed != null ? stats.speed : "?"))
        ];
        if (t.minRebirth) lines.push("Минимальный ребёрн: " + t.minRebirth);
        if (t.desc) lines.push("", "Описание:", t.desc);
        if (t.ability) lines.push("", "Обычная способность:", t.ability.desc || t.ability.name || "Есть");
        if (t.statusAbility) lines.push("", "Статус-эффект:", t.statusAbility.desc || t.statusAbility.name || "Есть");
        if (t.superAbility) {
            lines.push("", t.superAbility.name || "SUPER", t.superAbility.desc || "Есть суперспособность");
        }
        return lines.join("\n");
    }

    function openInfo(key) {
        var catalog = getCatalog().characters;
        var entry = catalog.find(function (item) { return item.key === key; });
        if (!entry) return;
        var title = esc("📄 " + entry.name);
        var text = esc(infoText(entry));
        var image = cardImage(entry.name);
        var modal = document.getElementById("modalContent");
        var overlay = document.getElementById("modalOverlay");
        if (!modal || !overlay) {
            if (typeof showModal === "function") showModal(title, text);
            return;
        }
        if (typeof sfxUIModalOpen === "function") sfxUIModalOpen();
        modal.innerHTML =
            "<h2>" + title + "</h2>" +
            (image ? '<img src="' + esc(image) + '" alt="' + esc(entry.name) + '" loading="lazy" style="display:block;width:112px;height:112px;object-fit:cover;border-radius:14px;margin:12px auto;border:1px solid rgba(255,255,255,.16);">' : "") +
            '<p style="margin-top:10px;white-space:pre-line;text-align:left;line-height:1.55;">' + text + "</p>" +
            '<button class="btn btn-primary" style="width:100%;padding:12px;" onclick="closeModal()">Закрыть</button>';
        overlay.style.display = "flex";
    }


    function closeTierEditor() {
        var overlay = document.getElementById("mbTierEditorOverlay");
        if (overlay) overlay.style.display = "none";
    }

    function openTierEditor(tierId) {
        var state = getState();
        var tier = state.tiers.find(function (item) { return item.id === tierId; });
        if (!tier) return;
        var overlay = document.getElementById("mbTierEditorOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "mbTierEditorOverlay";
            overlay.className = "mb-tier-editor-overlay";
            document.body.appendChild(overlay);
        }
        overlay.innerHTML =
            '<section class="mb-tier-editor" role="dialog" aria-modal="true" aria-labelledby="mbTierEditorTitle">' +
                '<div class="mb-tier-editor-head"><div><small>MULTIVERSE · TIER SETTINGS</small><h3 id="mbTierEditorTitle">Настройка тира</h3></div>' +
                '<button type="button" data-editor-close aria-label="Закрыть">×</button></div>' +
                '<label class="mb-tier-editor-field"><span>Название тира</span><input id="mbTierEditorName" type="text" maxlength="20" value="' + esc(tier.label) + '" autocomplete="off" placeholder="Например, GOD"></label>' +
                '<label class="mb-tier-editor-field"><span>Цвет тира</span><div class="mb-tier-color-control"><input id="mbTierEditorColor" type="color" value="' + safeColor(tier.color, "#8d99ae") + '"><strong id="mbTierEditorColorValue">' + safeColor(tier.color, "#8d99ae").toUpperCase() + '</strong></div></label>' +
                '<div class="mb-tier-editor-preview" id="mbTierEditorPreview" style="--tier-color:' + safeColor(tier.color, "#8d99ae") + '"><strong id="mbTierEditorPreviewName">' + esc(tier.label) + '</strong><span>ПРЕДПРОСМОТР ТИРА</span></div>' +
                '<div class="mb-tier-editor-actions"><button type="button" class="btn" data-editor-close>Отмена</button><button type="button" class="btn btn-primary" id="mbTierEditorSave">Сохранить</button></div>' +
            '</section>';
        overlay.style.display = "flex";
        var nameInput = overlay.querySelector("#mbTierEditorName");
        var colorInput = overlay.querySelector("#mbTierEditorColor");
        var preview = overlay.querySelector("#mbTierEditorPreview");
        var previewName = overlay.querySelector("#mbTierEditorPreviewName");
        var colorValue = overlay.querySelector("#mbTierEditorColorValue");
        function updatePreview() {
            var color = safeColor(colorInput.value, "#8d99ae");
            preview.style.setProperty("--tier-color", color);
            previewName.textContent = nameInput.value.trim() || "Новый тир";
            colorValue.textContent = color.toUpperCase();
        }
        nameInput.addEventListener("input", updatePreview);
        colorInput.addEventListener("input", updatePreview);
        overlay.querySelectorAll("[data-editor-close]").forEach(function (button) {
            button.addEventListener("click", closeTierEditor);
        });
        overlay.onclick = function (event) {
            if (event.target === overlay) closeTierEditor();
        };
        overlay.querySelector("#mbTierEditorSave").addEventListener("click", function () {
            var label = String(nameInput.value || "").trim().slice(0, 20);
            if (!label) {
                window.alert("Название тира не может быть пустым.");
                nameInput.focus();
                return;
            }
            var duplicate = state.tiers.some(function (item) {
                return item.id !== tierId && item.label.toLocaleLowerCase() === label.toLocaleLowerCase();
            });
            if (duplicate) {
                window.alert("Тир с таким названием уже существует.");
                nameInput.focus();
                return;
            }
            tier.label = label;
            tier.color = safeColor(colorInput.value, tier.color);
            persist(state);
            closeTierEditor();
            render();
        });
        nameInput.focus();
        nameInput.select();
    }

    function characterTile(entry, selected) {
        var image = cardImage(entry.name);
        var art = image
            ? '<img class="mb-tier-art" src="' + esc(image) + '" alt="' + esc(entry.name) + '" loading="lazy" decoding="async">'
            : '<div class="mb-tier-art mb-tier-no-art">✦</div>';
        return '<article class="mb-tier-character' + (selected ? " is-selected" : "") + '" draggable="true" data-card-key="' + esc(entry.key) + '" title="Нажми, чтобы выбрать, или перетащи в тир">' +
            '<div class="mb-tier-art-wrap">' + art + '</div>' +
            '<div class="mb-tier-character-name">' + esc(entry.name) + '</div>' +
            '<div class="mb-tier-character-meta">' + esc(entry.rarity) + '</div>' +
            '<button type="button" class="mb-tier-info" data-info-key="' + esc(entry.key) + '" title="Описание персонажа" aria-label="Описание ' + esc(entry.name) + '">ⓘ</button>' +
            '</article>';
    }

    function renderPool(catalogData, state) {
        var pool = document.getElementById("mbTierPool");
        var meta = document.getElementById("mbTierPoolMeta");
        if (!pool) return;

        var characters = catalogData.characters.filter(function (entry) {
            if (assignedTier(state, entry.key)) return false;
            if (view.universe !== "all" && entry.universe !== view.universe) return false;
            if (view.rarity !== "all" && entry.rarity !== view.rarity) return false;
            if (view.search && (entry.name + " " + entry.universe).toLocaleLowerCase().indexOf(view.search) === -1) return false;
            return true;
        });

        characters.sort(function (a, b) {
            var rankA = RARITY_ORDER.indexOf(a.rarity);
            var rankB = RARITY_ORDER.indexOf(b.rarity);
            if (rankA < 0) rankA = RARITY_ORDER.length;
            if (rankB < 0) rankB = RARITY_ORDER.length;
            switch (view.sort) {
                case "name":
                    return a.name.localeCompare(b.name, "ru");
                case "rarity":
                    return rankB - rankA || a.name.localeCompare(b.name, "ru");
                case "damage":
                    return (Number(b.template.damage) || 0) - (Number(a.template.damage) || 0);
                case "hp":
                    return (Number(b.template.hp) || 0) - (Number(a.template.hp) || 0);
                case "speed":
                    return (Number(b.template.speed) || 0) - (Number(a.template.speed) || 0);
                case "universe":
                    return a.universe.localeCompare(b.universe, "ru") || a.name.localeCompare(b.name, "ru");
                default:
                    return a.sourceIndex - b.sourceIndex;
            }
        });

        if (meta) meta.textContent = "Показано: " + characters.length + " · Не распределено: " +
            catalogData.characters.filter(function (entry) { return !assignedTier(state, entry.key); }).length;
        pool.innerHTML = characters.length
            ? characters.map(function (entry) { return characterTile(entry, selectedKey === entry.key); }).join("")
            : '<div class="mb-tier-empty">Ничего не найдено. Попробуй изменить фильтры.</div>';
    }


    function selectionMarkup(catalogData, state) {
        var entry = selectedKey && catalogData.characters.find(function (item) { return item.key === selectedKey; });
        if (!entry) return '<div id="mbTierSelection" class="mb-tier-selection" style="display:none"></div>';
        return '<div id="mbTierSelection" class="mb-tier-selection">' +
            '<div class="mb-tier-selection-copy"><strong>Выбран: ' + esc(entry.name) + '</strong><small>На телефоне выбери персонажа, затем тир. Перетаскивание необязательно.</small></div>' +
            '<select id="mbTierTarget" aria-label="Куда переместить персонажа">' +
                state.tiers.map(function (tier) { return '<option value="' + esc(tier.id) + '">' + esc(tier.label) + '</option>'; }).join("") +
            '</select>' +
            '<button type="button" class="btn btn-primary" data-assign-selected>Переместить</button>' +
            '<button type="button" class="btn" data-clear-selection aria-label="Снять выбор">×</button>' +
        '</div>';
    }

    function render() {
        var root = document.getElementById("tierListRoot");
        if (!root || !unlocked()) return;
        var state = getState();
        var catalogData = getCatalog();
        var characters = catalogData.characters;
        var assignedCount = characters.filter(function (entry) { return !!assignedTier(state, entry.key); }).length;
        var universes = Array.from(new Set(characters.map(function (entry) { return entry.universe; }))).sort(function (a, b) {
            return a.localeCompare(b, "ru");
        });
        var rarities = Array.from(new Set(characters.map(function (entry) { return entry.rarity; }))).sort(function (a, b) {
            return RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b);
        });

        var rows = state.tiers.map(function (tier) {
            var placed = characters.filter(function (entry) { return assignedTier(state, entry.key) === tier.id; });
            var cards = placed.map(function (entry) {
                return characterTile(entry, selectedKey === entry.key).replace(
                    '<button type="button" class="mb-tier-info"',
                    '<button type="button" class="mb-tier-return" data-return-key="' + esc(entry.key) + '" title="Вернуть в список">↩</button><button type="button" class="mb-tier-info"'
                );
            }).join("");
            return '<section class="mb-tier-row" data-tier-drop="' + esc(tier.id) + '">' +
                '<div class="mb-tier-label" style="--tier-color:' + esc(tier.color || "#8d99ae") + '">' +
                    '<strong>' + esc(tier.label) + '</strong><span>' + placed.length + '</span>' +
                    '<button type="button" class="mb-tier-edit" data-edit-tier="' + esc(tier.id) + '" title="Изменить название и цвет" aria-label="Настроить тир">✎</button>' +
                    (String(tier.id).indexOf("custom_") === 0 ? '<button type="button" class="mb-tier-delete" data-delete-tier="' + esc(tier.id) + '" title="Удалить тир">×</button>' : "") +
                '</div>' +
                '<div class="mb-tier-dropzone' + (placed.length ? " has-cards" : "") + '">' +
                    (cards || '<span class="mb-tier-drop-hint">Перетащи персонажа сюда или выбери его и нажми на этот тир</span>') +
                '</div>' +
            '</section>';
        }).join("");

        root.innerHTML =
            '<div class="mb-tier-topline"><div><div class="mb-tier-kicker">MULTIVERSE · CHARACTER RANKING</div><h2>🏆 Тирлист персонажей</h2><p>Распредели персонажей по силе, полезности или собственному вкусу. Твой тирлист сохраняется в этом слоте.</p></div>' +
            '<div class="mb-tier-counter"><strong>' + assignedCount + '</strong><span>/ ' + characters.length + '</span><small>оценено</small></div></div>' +
            '<div class="mb-tier-toolbar">' +
                '<input id="mbTierSearch" data-tier-filter="search" type="search" placeholder="🔎 Найти персонажа..." value="' + esc(view.search) + '">' +
                '<select id="mbTierUniverse" data-tier-filter="universe" aria-label="Фильтр по вселенной"><option value="all">🌌 Все вселенные</option>' +
                    universes.map(function (name) { return '<option value="' + esc(name) + '"' + (view.universe === name ? " selected" : "") + '>' + esc(name) + '</option>'; }).join("") +
                '</select>' +
                '<select id="mbTierRarity" data-tier-filter="rarity" aria-label="Фильтр по редкости"><option value="all">⭐ Все редкости</option>' +
                    rarities.map(function (name) { return '<option value="' + esc(name) + '"' + (view.rarity === name ? " selected" : "") + '>' + esc(name) + '</option>'; }).join("") +
                '</select>' +
                '<select id="mbTierSort" data-tier-filter="sort" aria-label="Сортировка персонажей">' +
                    '<option value="source"' + (view.sort === "source" ? " selected" : "") + '>↕ Порядок игры</option>' +
                    '<option value="name"' + (view.sort === "name" ? " selected" : "") + '>🔤 По имени</option>' +
                    '<option value="rarity"' + (view.sort === "rarity" ? " selected" : "") + '>⭐ По редкости</option>' +
                    '<option value="damage"' + (view.sort === "damage" ? " selected" : "") + '>💪 По урону</option>' +
                    '<option value="hp"' + (view.sort === "hp" ? " selected" : "") + '>❤️ По здоровью</option>' +
                    '<option value="speed"' + (view.sort === "speed" ? " selected" : "") + '>⚡ По скорости</option>' +
                    '<option value="universe"' + (view.sort === "universe" ? " selected" : "") + '>🌌 По вселенной</option>' +
                '</select>' +
            '</div>' +
            '<div class="mb-tier-board-head"><span>ТИР</span><span>ПЕРСОНАЖИ · ПЕРЕТАСКИВАЙ ИЛИ ВЫБИРАЙ КЛИКОМ</span></div>' +
            selectionMarkup(catalogData, state) +
            '<div class="mb-tier-board">' + rows + '</div>' +
            '<div class="mb-tier-actions"><button type="button" class="btn" data-tier-action="add">＋ Создать тир</button><button type="button" class="btn" data-tier-action="save">💾 Сохранить в игре</button><button type="button" class="btn btn-primary" data-tier-action="export">🖼️ Сохранить PNG</button><button type="button" class="btn" data-tier-action="reset">↺ Очистить тирлист</button></div>' +
            '<div class="mb-tier-feedback" id="mbTierFeedback" role="status" aria-live="polite"></div>' +
            '<div class="mb-tier-pool-head"><div><h3>🎴 Персонажи без оценки</h3><p>Нажми на карточку, затем выбери нужный тир. Кнопка ⓘ открывает описание.</p></div><strong id="mbTierPoolMeta"></strong></div>' +
            '<div id="mbTierPool" class="mb-tier-pool"></div>' +
            (catalogData.lockedCount ? '<div class="mb-tier-locked-note">🔒 Ещё ' + catalogData.lockedCount + ' персонажей из закрытых разломов появятся после открытия соответствующего контента.</div>' : "");

        renderPool(catalogData, state);
        bindEvents();
    }

    function assign(key, tierId) {
        var state = getState();
        if (!state.tiers.some(function (tier) { return tier.id === tierId; })) return;
        var exists = getCatalog().characters.some(function (entry) { return entry.key === key; });
        if (!exists) return;
        state.assignments[key] = tierId;
        selectedKey = null;
        persist(state);
        render();
    }

    function unassign(key) {
        var state = getState();
        delete state.assignments[key];
        selectedKey = null;
        persist(state);
        render();
    }


    function roundedRect(ctx, x, y, width, height, radius) {
        var r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function loadExportImage(entry) {
        return new Promise(function (resolve) {
            var src = cardImage(entry.name);
            if (!src) { resolve(null); return; }
            var image = new Image();
            var finished = false;
            var timer = window.setTimeout(function () {
                if (finished) return;
                finished = true;
                resolve(null);
            }, 7000);
            image.onload = function () {
                if (finished) return;
                finished = true;
                window.clearTimeout(timer);
                resolve(image);
            };
            image.onerror = function () {
                if (finished) return;
                finished = true;
                window.clearTimeout(timer);
                resolve(null);
            };
            try { image.crossOrigin = "anonymous"; } catch (_error) {}
            image.src = src;
        });
    }

    function buildTierListCanvas() {
        var state = getState();
        var catalog = getCatalog().characters;
        var rows = state.tiers.map(function (tier) {
            return {
                tier: tier,
                entries: catalog.filter(function (entry) { return assignedTier(state, entry.key) === tier.id; })
            };
        });
        var total = rows.reduce(function (sum, row) { return sum + row.entries.length; }, 0);
        if (!total) {
            window.alert("Сначала добавь хотя бы одного персонажа в тирлист.");
            return Promise.resolve(null);
        }

        var width = 1800;
        var cardWidth = 136;
        var cardHeight = 154;
        var gap = 12;
        var labelWidth = 190;
        var cardStartX = 220;
        var perRow = Math.max(1, Math.floor((width - cardStartX - 30) / (cardWidth + gap)));
        var headerHeight = 132;
        rows.forEach(function (row) {
            row.lines = Math.max(1, Math.ceil(row.entries.length / perRow));
            row.height = Math.max(136, row.lines * (cardHeight + 10) + 18);
        });
        var totalHeight = headerHeight + rows.reduce(function (sum, row) { return sum + row.height + 10; }, 0) + 55;
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = totalHeight;
        var ctx = canvas.getContext("2d");
        if (!ctx) {
            window.alert("Не удалось создать изображение на этом устройстве.");
            return Promise.resolve(null);
        }
        var uniqueEntries = [];
        var seen = Object.create(null);
        rows.forEach(function (row) {
            row.entries.forEach(function (entry) {
                var src = cardImage(entry.name);
                if (src && !seen[src]) {
                    seen[src] = true;
                    uniqueEntries.push({ entry: entry, src: src });
                }
            });
        });
        var imagePromises = uniqueEntries.map(function (item) {
            return loadExportImage(item.entry).then(function (image) {
                return { src: item.src, image: image };
            });
        });

        return Promise.all(imagePromises).then(function (loaded) {
            var imageMap = Object.create(null);
            loaded.forEach(function (item) { imageMap[item.src] = item.image; });
            var bg = ctx.createLinearGradient(0, 0, width, totalHeight);
            bg.addColorStop(0, "#111326");
            bg.addColorStop(1, "#090a12");
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width, totalHeight);

            ctx.fillStyle = "#e8dcff";
            ctx.font = "900 18px Arial, sans-serif";
            ctx.fillText("MULTIVERSE BATTLE  /  CHARACTER RANKING", 42, 34);
            ctx.fillStyle = "#ffffff";
            ctx.font = "900 42px Arial, sans-serif";
            ctx.fillText("TIER LIST", 40, 88);
            ctx.fillStyle = "#a9a1bd";
            ctx.font = "16px Arial, sans-serif";
            ctx.fillText("Персонажей в рейтинге: " + total + "   •   " + new Date().toLocaleDateString("ru-RU"), 43, 116);

            var y = headerHeight;
            rows.forEach(function (row) {
                var color = safeColor(row.tier.color, "#8d99ae");
                roundedRect(ctx, 28, y, width - 56, row.height, 14);
                ctx.fillStyle = "rgba(255,255,255,0.045)";
                ctx.fill();
                roundedRect(ctx, 28, y, labelWidth, row.height, 14);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.save();
                ctx.beginPath();
                ctx.rect(28, y, labelWidth, row.height);
                ctx.clip();
                ctx.fillStyle = "#17131e";
                ctx.textAlign = "center";
                ctx.font = row.tier.label.length > 9 ? "900 23px Arial, sans-serif" : "900 34px Arial, sans-serif";
                ctx.fillText(row.tier.label, 28 + labelWidth / 2, y + Math.min(58, row.height / 2 - 3), labelWidth - 16);
                ctx.font = "700 14px Arial, sans-serif";
                ctx.fillText(row.entries.length + " персонажей", 28 + labelWidth / 2, y + Math.min(88, row.height / 2 + 23), labelWidth - 16);
                ctx.restore();

                row.entries.forEach(function (entry, index) {
                    var col = index % perRow;
                    var line = Math.floor(index / perRow);
                    var x = cardStartX + col * (cardWidth + gap);
                    var cardY = y + 10 + line * (cardHeight + 10);
                    roundedRect(ctx, x, cardY, cardWidth, cardHeight, 10);
                    ctx.fillStyle = "#1b1c2c";
                    ctx.fill();
                    var image = imageMap[cardImage(entry.name)];
                    if (image) {
                        ctx.save();
                        roundedRect(ctx, x + 18, cardY + 8, 100, 100, 8);
                        ctx.clip();
                        var scale = Math.max(100 / image.width, 100 / image.height);
                        var dw = image.width * scale;
                        var dh = image.height * scale;
                        ctx.drawImage(image, x + 18 + (100 - dw) / 2, cardY + 8 + (100 - dh) / 2, dw, dh);
                        ctx.restore();
                    } else {
                        roundedRect(ctx, x + 18, cardY + 8, 100, 100, 8);
                        ctx.fillStyle = "#34304a";
                        ctx.fill();
                        ctx.fillStyle = "#d6c6f5";
                        ctx.textAlign = "center";
                        ctx.font = "36px Arial, sans-serif";
                        ctx.fillText("✦", x + 68, cardY + 72);
                    }
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "center";
                    ctx.font = "700 12px Arial, sans-serif";
                    var name = entry.name;
                    if (name.length > 21) name = name.slice(0, 19) + "…";
                    ctx.fillText(name, x + cardWidth / 2, cardY + 126, cardWidth - 8);
                    ctx.fillStyle = "#aaa3bd";
                    ctx.font = "10px Arial, sans-serif";
                    ctx.fillText(entry.rarity, x + cardWidth / 2, cardY + 143, cardWidth - 8);
                });
                y += row.height + 10;
            });

            ctx.fillStyle = "#777187";
            ctx.textAlign = "right";
            ctx.font = "12px Arial, sans-serif";
            ctx.fillText("MULTIVERSE-BATTLE", width - 38, totalHeight - 20);
            return canvas;
        });
    }

    async function exportTierListImage(button) {
        var feedback = document.getElementById("mbTierFeedback");
        var oldText = button ? button.textContent : "";
        if (button) {
            button.disabled = true;
            button.textContent = "⏳ Создаю PNG…";
        }
        if (feedback) feedback.textContent = "Готовлю изображение тирлиста…";
        try {
            var canvas = await buildTierListCanvas();
            if (!canvas) return;
            var blob = await new Promise(function (resolve) {
                canvas.toBlob(resolve, "image/png");
            });
            if (!blob) throw new Error("PNG export is not supported");
            var file = new File([blob], "Multiverse-Battle-Tierlist.png", { type: "image/png" });
            var shared = false;
            if (navigator.share && navigator.canShare) {
                try {
                    shared = navigator.canShare({ files: [file] });
                } catch (_error) {
                    shared = false;
                }
            }
            if (shared) {
                await navigator.share({
                    files: [file],
                    title: "Мой тирлист Multiverse-Battle",
                    text: "Тирлист персонажей Multiverse-Battle"
                });
                if (feedback) feedback.textContent = "Изображение отправлено в меню «Поделиться». На телефоне выбери «Сохранить изображение» или «Фото».";
            } else {
                var url = URL.createObjectURL(blob);
                var link = document.createElement("a");
                link.href = url;
                link.download = "Multiverse-Battle-Tierlist.png";
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
                if (feedback) feedback.textContent = "PNG подготовлен. На телефоне файл появится в загрузках, оттуда его можно сохранить в галерею.";
            }
        } catch (error) {
            if (error && error.name === "AbortError") {
                if (feedback) feedback.textContent = "Сохранение отменено.";
            } else {
                console.error("[MB TIER LIST] Export failed:", error);
                if (feedback) feedback.textContent = "Не удалось создать PNG. Попробуй ещё раз или сохрани тирлист в игре.";
                window.alert("Не удалось создать изображение тирлиста на этом устройстве.");
            }
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = oldText || "🖼️ Сохранить PNG";
            }
        }
    }

    function bindEvents() {
        var root = document.getElementById("tierListRoot");
        if (!root || root.dataset.mbTierBound === "1") return;
        root.dataset.mbTierBound = "1";

        root.addEventListener("click", function (event) {
            var target = event.target && event.target.closest ? event.target : null;
            if (!target) return;

            var info = target.closest("[data-info-key]");
            if (info) {
                event.stopPropagation();
                openInfo(info.getAttribute("data-info-key"));
                return;
            }

            var assignSelected = target.closest("[data-assign-selected]");
            if (assignSelected) {
                var targetSelect = root.querySelector("#mbTierTarget");
                if (selectedKey && targetSelect) assign(selectedKey, targetSelect.value);
                return;
            }

            var clearSelection = target.closest("[data-clear-selection]");
            if (clearSelection) {
                selectedKey = null;
                render();
                return;
            }

            var editTier = target.closest("[data-edit-tier]");
            if (editTier) {
                event.stopPropagation();
                openTierEditor(editTier.getAttribute("data-edit-tier"));
                return;
            }

            var returned = target.closest("[data-return-key]");
            if (returned) {
                event.stopPropagation();
                unassign(returned.getAttribute("data-return-key"));
                return;
            }

            var deleteTier = target.closest("[data-delete-tier]");
            if (deleteTier) {
                event.stopPropagation();
                var deleteId = deleteTier.getAttribute("data-delete-tier");
                if (!window.confirm("Удалить этот тир? Персонажи вернутся в список без оценки.")) return;
                var state = getState();
                state.tiers = state.tiers.filter(function (tier) { return tier.id !== deleteId; });
                Object.keys(state.assignments).forEach(function (key) {
                    if (state.assignments[key] === deleteId) delete state.assignments[key];
                });
                persist(state);
                render();
                return;
            }

            var action = target.closest("[data-tier-action]");
            if (action) {
                var kind = action.getAttribute("data-tier-action");
                if (kind === "add") {
                    var stateForAdd = getState();
                    if (stateForAdd.tiers.length >= 12) {
                        window.alert("Можно создать не больше 12 тиров.");
                        return;
                    }
                    var newId = "custom_" + Date.now();
                    stateForAdd.tiers.push({
                        id: newId,
                        label: "Новый тир",
                        color: TIER_COLORS[(stateForAdd.tiers.length - DEFAULT_TIERS.length) % TIER_COLORS.length] || "#c77dff"
                    });
                    persist(stateForAdd);
                    render();
                    openTierEditor(newId);
                } else if (kind === "save") {
                    persist(getState());
                    var saveFeedback = root.querySelector("#mbTierFeedback");
                    if (saveFeedback) saveFeedback.textContent = "✓ Тирлист сохранён в текущем слоте. Автосохранение также включено.";
                } else if (kind === "export") {
                    exportTierListImage(action);
                } else if (kind === "reset") {
                    if (!window.confirm("Убрать всех персонажей из тиров? Сам список тиров останется.")) return;
                    var stateForReset = getState();
                    stateForReset.assignments = {};
                    selectedKey = null;
                    persist(stateForReset);
                    render();
                }
                return;
            }

            var card = target.closest("[data-card-key]");
            if (card) {
                selectedKey = card.getAttribute("data-card-key");
                render();
                return;
            }

            var row = target.closest("[data-tier-drop]");
            if (row && selectedKey) {
                assign(selectedKey, row.getAttribute("data-tier-drop"));
            }
        });

        root.addEventListener("input", function (event) {
            if (event.target && event.target.getAttribute("data-tier-filter") === "search") {
                view.search = String(event.target.value || "").trim().toLocaleLowerCase();
                renderPool(getCatalog(), getState());
            }
        });

        root.addEventListener("change", function (event) {
            var filter = event.target && event.target.getAttribute("data-tier-filter");
            if (!filter || filter === "search") return;
            view[filter] = event.target.value;
            renderPool(getCatalog(), getState());
        });

        root.addEventListener("dragstart", function (event) {
            var target = event.target && event.target.closest ? event.target.closest("[data-card-key]") : null;
            if (!target || (event.target && event.target.closest("[data-info-key], [data-return-key]"))) {
                event.preventDefault();
                return;
            }
            var key = target.getAttribute("data-card-key");
            if (event.dataTransfer) {
                event.dataTransfer.setData("text/plain", key);
                event.dataTransfer.effectAllowed = "move";
            }
            selectedKey = key;
            target.classList.add("is-dragging");
        });

        root.addEventListener("dragend", function () {
            root.querySelectorAll(".is-dragging, .is-dragover").forEach(function (node) {
                node.classList.remove("is-dragging", "is-dragover");
            });
        });

        root.addEventListener("dragover", function (event) {
            var row = event.target && event.target.closest ? event.target.closest("[data-tier-drop]") : null;
            if (!row) return;
            event.preventDefault();
            row.classList.add("is-dragover");
            if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        });

        root.addEventListener("dragleave", function (event) {
            var row = event.target && event.target.closest ? event.target.closest("[data-tier-drop]") : null;
            if (row && !row.contains(event.relatedTarget)) row.classList.remove("is-dragover");
        });

        root.addEventListener("drop", function (event) {
            var row = event.target && event.target.closest ? event.target.closest("[data-tier-drop]") : null;
            if (!row) return;
            event.preventDefault();
            row.classList.remove("is-dragover");
            var key = event.dataTransfer ? event.dataTransfer.getData("text/plain") : selectedKey;
            if (key) assign(key, row.getAttribute("data-tier-drop"));
        });
    }

    function injectStyles() {
        if (document.getElementById("mbTierListStyles")) return;
        var style = document.createElement("style");
        style.id = "mbTierListStyles";
        style.textContent =
            "#tierListRoot{color:#f5f3ff}" +
            "#tierListRoot .mb-tier-topline{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}" +
            "#tierListRoot .mb-tier-kicker{font:900 9px monospace;letter-spacing:2px;color:#bba7e9;opacity:.8}" +
            "#tierListRoot h2{margin:4px 0 5px;font-size:22px;color:#fff}" +
            "#tierListRoot p{margin:0;color:#aaa;font-size:12px;line-height:1.45}" +
            "#tierListRoot .mb-tier-counter{min-width:66px;text-align:center;padding:9px 12px;border:1px solid #a98ce044;border-radius:14px;background:linear-gradient(145deg,#32234e,#1b1a31)}" +
            "#tierListRoot .mb-tier-counter strong{font-size:22px;color:#e3c9ff}" +
            "#tierListRoot .mb-tier-counter span{font-size:12px;color:#9586b9}" +
            "#tierListRoot .mb-tier-counter small{display:block;font-size:9px;color:#a99ac6;text-transform:uppercase;letter-spacing:1px}" +
            "#tierListRoot .mb-tier-toolbar{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:7px;margin:12px 0 18px}" +
            "#tierListRoot .mb-tier-toolbar input,#tierListRoot .mb-tier-toolbar select{min-width:0;width:100%;box-sizing:border-box;padding:9px 10px;border-radius:10px;border:1px solid #ffffff20;background:#111322;color:#fff;font:700 11px 'Nunito',sans-serif}" +
            "#tierListRoot .mb-tier-board-head{display:grid;grid-template-columns:62px 1fr;gap:8px;margin:0 0 7px;padding:0 4px;color:#877f9d;font:900 9px monospace;letter-spacing:1px}" +
            "#tierListRoot .mb-tier-row{display:grid;grid-template-columns:62px minmax(0,1fr);gap:8px;margin:0 0 7px;min-height:82px;border:1px solid #ffffff12;border-radius:12px;background:#090b15;overflow:hidden;transition:border-color .15s,background .15s}" +
            "#tierListRoot .mb-tier-row.is-dragover{border-color:#d7b5ff;background:#1c1930;box-shadow:0 0 14px #b58cff30}" +
            "#tierListRoot .mb-tier-label{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:var(--tier-color);color:#17131e;min-height:82px}" +
            "#tierListRoot .mb-tier-label strong{font-size:26px;font-weight:1000;text-shadow:0 1px #ffffff55}" +
            "#tierListRoot .mb-tier-label span{font:900 9px monospace;opacity:.78}" +
            "#tierListRoot .mb-tier-delete{position:absolute;top:2px;right:4px;border:0;background:transparent;color:#191421;font-size:16px;font-weight:900;cursor:pointer}" +
            "#tierListRoot .mb-tier-dropzone{display:flex;align-content:flex-start;align-items:flex-start;flex-wrap:wrap;gap:6px;padding:7px;min-width:0;min-height:68px}" +
            "#tierListRoot .mb-tier-drop-hint{align-self:center;margin:auto;color:#77748c;font-size:10px;text-align:center;padding:10px}" +
            "#tierListRoot .mb-tier-character{position:relative;display:flex;flex:0 0 78px;width:78px;min-height:95px;box-sizing:border-box;flex-direction:column;align-items:center;gap:3px;padding:5px 4px 6px;border:1px solid #ffffff17;border-radius:10px;background:linear-gradient(155deg,#25233a,#141522);cursor:grab;user-select:none;transition:transform .14s,border-color .14s,box-shadow .14s}" +
            "#tierListRoot .mb-tier-character:hover{transform:translateY(-2px);border-color:#b99be9aa;box-shadow:0 5px 13px #0008}" +
            "#tierListRoot .mb-tier-character.is-selected{border-color:#f5d16d;box-shadow:0 0 0 2px #f5d16d55,0 0 14px #f5d16d22}" +
            "#tierListRoot .mb-tier-character.is-dragging{opacity:.45}" +
            "#tierListRoot .mb-tier-art-wrap{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:9px;overflow:hidden;background:#090b15;border:1px solid #ffffff12}" +
            "#tierListRoot .mb-tier-art{display:block;width:100%;height:100%;object-fit:cover}" +
            "#tierListRoot .mb-tier-no-art{display:flex;align-items:center;justify-content:center;color:#9b8ac4;font-size:25px;background:radial-gradient(circle,#393151,#171624)}" +
            "#tierListRoot .mb-tier-character-name{width:100%;font-size:9px;font-weight:900;line-height:1.15;text-align:center;overflow-wrap:anywhere;color:#f4efff}" +
            "#tierListRoot .mb-tier-character-meta{font-size:7px;color:#a99ebd;text-align:center;line-height:1.1}" +
            "#tierListRoot .mb-tier-info,#tierListRoot .mb-tier-return{position:absolute;top:3px;right:3px;width:19px;height:19px;padding:0;border:1px solid #ffffff2b;border-radius:50%;background:#141321eF;color:#e9d8ff;font-size:12px;line-height:17px;font-weight:900;cursor:pointer;z-index:2}" +
            "#tierListRoot .mb-tier-return{right:auto;left:3px;color:#ffd9a1}" +
            "#tierListRoot .mb-tier-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 20px}" +
            "#tierListRoot .mb-tier-actions .btn{padding:7px 12px;font-size:11px}" +
            "#tierListRoot .mb-tier-pool-head{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin:16px 0 8px;padding-top:15px;border-top:1px solid #ffffff14}" +
            "#tierListRoot .mb-tier-pool-head h3{font-size:15px;margin:0 0 4px;color:#e8d8ff}" +
            "#tierListRoot .mb-tier-pool-head strong{font:800 9px monospace;color:#a99ebd;text-align:right}" +
            "#tierListRoot .mb-tier-pool{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:7px}" +
            "#tierListRoot .mb-tier-empty{grid-column:1/-1;padding:22px;text-align:center;color:#8d879d;font-size:12px;border:1px dashed #ffffff22;border-radius:12px}" +
            "#tierListRoot .mb-tier-locked-note{margin-top:12px;color:#8f89a1;font-size:10px;line-height:1.4}" +
            "@media(max-width:520px){#tierListRoot .mb-tier-topline{align-items:flex-start}#tierListRoot h2{font-size:19px}#tierListRoot .mb-tier-toolbar{grid-template-columns:1fr 1fr}#tierListRoot .mb-tier-toolbar input{grid-column:1/-1}#tierListRoot .mb-tier-row{grid-template-columns:48px minmax(0,1fr);gap:5px}#tierListRoot .mb-tier-board-head{grid-template-columns:48px 1fr;font-size:8px}#tierListRoot .mb-tier-label{min-height:75px}#tierListRoot .mb-tier-label strong{font-size:23px}#tierListRoot .mb-tier-character{flex-basis:70px;width:70px;min-height:90px}#tierListRoot .mb-tier-art-wrap{width:43px;height:43px}#tierListRoot .mb-tier-pool{grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:5px}}";
        style.textContent +=
            "#tierListRoot .mb-tier-edit{position:absolute;right:4px;bottom:3px;width:20px;height:20px;padding:0;border:1px solid #17131e44;border-radius:6px;background:#17131e22;color:#17131e;font-size:13px;font-weight:900;cursor:pointer}" +
            "#tierListRoot .mb-tier-delete{top:3px;right:4px}" +
            "#tierListRoot .mb-tier-selection{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:0 0 10px;padding:10px;border:1px solid #e7c76d55;border-radius:12px;background:linear-gradient(120deg,#342b1c,#171827)}" +
            "#tierListRoot .mb-tier-selection-copy{display:flex;flex:1 1 210px;min-width:0;flex-direction:column;gap:3px}" +
            "#tierListRoot .mb-tier-selection-copy strong{color:#ffe4a0;font-size:12px;overflow-wrap:anywhere}" +
            "#tierListRoot .mb-tier-selection-copy small{color:#bdb3a0;font-size:10px;line-height:1.35}" +
            "#tierListRoot .mb-tier-selection select{min-width:100px;max-width:180px;padding:9px;border:1px solid #ffffff2b;border-radius:8px;background:#111322;color:#fff}" +
            "#tierListRoot .mb-tier-selection .btn{padding:9px 12px;font-size:11px}" +
            "#tierListRoot .mb-tier-feedback{min-height:16px;margin:-12px 0 14px;color:#a9dfb1;font-size:11px}" +
            ".mb-tier-editor-overlay{position:fixed;inset:0;z-index:10050;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(4,5,12,.82);backdrop-filter:blur(8px)}" +
            ".mb-tier-editor{width:min(420px,100%);box-sizing:border-box;padding:20px;border:1px solid #bca0ec55;border-radius:18px;background:linear-gradient(155deg,#232039,#10121e);box-shadow:0 20px 70px #000b;color:#fff}" +
            ".mb-tier-editor-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}" +
            ".mb-tier-editor-head small{color:#bca0ec;font:800 9px monospace;letter-spacing:1.5px}" +
            ".mb-tier-editor-head h3{margin:5px 0 0;font-size:20px}" +
            ".mb-tier-editor-head button{width:32px;height:32px;border:1px solid #ffffff20;border-radius:9px;background:#ffffff0b;color:#fff;font-size:22px}" +
            ".mb-tier-editor-field{display:block;margin:12px 0;color:#bdb7ce;font-size:11px;font-weight:800}" +
            ".mb-tier-editor-field>span{display:block;margin-bottom:7px}" +
            ".mb-tier-editor-field input[type=text]{width:100%;box-sizing:border-box;padding:11px;border:1px solid #ffffff25;border-radius:9px;background:#0c0e18;color:#fff;font:700 14px Arial,sans-serif}" +
            ".mb-tier-color-control{display:flex;align-items:center;gap:12px}" +
            ".mb-tier-color-control input{width:54px;height:42px;padding:3px;border:1px solid #ffffff30;border-radius:9px;background:#111}" +
            ".mb-tier-color-control strong{font:800 12px monospace;color:#fff}" +
            ".mb-tier-editor-preview{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:16px 0;padding:13px 15px;border-radius:10px;background:var(--tier-color);color:#17131e}" +
            ".mb-tier-editor-preview strong{font-size:23px;font-weight:1000;overflow-wrap:anywhere}" +
            ".mb-tier-editor-preview span{font:900 9px monospace;text-align:right}" +
            ".mb-tier-editor-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}" +
            ".mb-tier-editor-actions .btn{padding:10px 15px;font-size:12px}" +
            "@media(max-width:520px){#tierListRoot .mb-tier-selection{align-items:stretch}#tierListRoot .mb-tier-selection select{flex:1 1 115px;max-width:none}#tierListRoot .mb-tier-selection .btn{flex:1 1 auto}.mb-tier-editor{padding:16px}}";
        document.head.appendChild(style);
    }

    function openSession() {
        if (typeof slotData === "undefined" || !slotData ||
            typeof currentSlot === "undefined" || currentSlot < 0) return false;
        sessionUnlocked = true;
        refreshAccess(true);
        return true;
    }

    function refreshAccess(openTab) {
        var button = document.querySelector('.sub-tab-btn[data-subtab="tierList"]');
        var panel = document.getElementById("tierListSubTab");
        var access = unlocked();
        if (button) button.style.display = access ? "" : "none";
        if (panel && !access) panel.classList.remove("active");
        if (!access) {
            selectedKey = null;
            var collection = document.getElementById("collectionTab");
            if (collection && collection.classList.contains("active") && button && button.classList.contains("active") &&
                typeof switchSubTab === "function") {
                switchSubTab("myCards", "collectionTab");
            }
            return false;
        }
        injectStyles();
        if (openTab) {
            if (typeof switchTab === "function") switchTab("collection");
            if (typeof switchSubTab === "function") switchSubTab("tierList", "collectionTab");
            render();
        }
        return true;
    }

    function init() {
        refreshAccess(false);
        bindEvents();
        var button = document.querySelector('.sub-tab-btn[data-subtab="tierList"]');
        if (button && !button.dataset.mbTierClickBound) {
            button.dataset.mbTierClickBound = "1";
            button.addEventListener("click", function () {
                window.setTimeout(render, 0);
            });
        }
        window.addEventListener("mb:slot-changing", function () {
            sessionUnlocked = false;
            selectedKey = null;
            refreshAccess(false);
            var buttonToHide = document.querySelector('.sub-tab-btn[data-subtab="tierList"]');
            if (buttonToHide) buttonToHide.style.display = "none";
        });
        window.addEventListener("mb:slot-ready", function () {
            refreshAccess(false);
            if (unlocked()) render();
        });
        window.MBTierList = {
            __loaded: true,
            refreshAccess: refreshAccess,
            render: render,
            openInfo: openInfo,
            assign: assign,
            unassign: unassign,
            openSession: openSession
        };
    }

    window.MBTierList = { __loaded: true, refreshAccess: refreshAccess, render: render, openInfo: openInfo, assign: assign, unassign: unassign, openSession: openSession };
    injectStyles();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();