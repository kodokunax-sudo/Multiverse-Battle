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

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function unlocked() {
        return typeof slotData !== "undefined" && !!slotData &&
            slotData.tierListUnlocked === true;
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
        if (!saved.assignments || typeof saved.assignments !== "object" || Array.isArray(saved.assignments)) {
            saved.assignments = {};
        }
        saved.version = 1;
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
            '<div class="mb-tier-board">' + rows + '</div>' +
            '<div class="mb-tier-actions"><button type="button" class="btn" data-tier-action="add">＋ Создать тир</button><button type="button" class="btn" data-tier-action="reset">↺ Очистить тирлист</button></div>' +
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
                    if (getState().tiers.length >= 12) {
                        window.alert("Можно создать не больше 12 тиров.");
                        return;
                    }
                    var label = window.prompt("Название нового тира:", "EX");
                    if (label === null || !label.trim()) return;
                    label = label.trim().slice(0, 12);
                    var stateForAdd = getState();
                    if (stateForAdd.tiers.some(function (tier) { return tier.label.toLocaleLowerCase() === label.toLocaleLowerCase(); })) {
                        window.alert("Тир с таким названием уже существует.");
                        return;
                    }
                    stateForAdd.tiers.push({
                        id: "custom_" + Date.now(),
                        label: label,
                        color: TIER_COLORS[(stateForAdd.tiers.length - DEFAULT_TIERS.length) % TIER_COLORS.length]
                    });
                    persist(stateForAdd);
                    render();
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
                var currentState = getState();
                var catalogData = getCatalog();
                renderPool(catalogData, currentState);
                root.querySelectorAll(".mb-tier-character.is-selected").forEach(function (item) {
                    item.classList.remove("is-selected");
                });
                root.querySelectorAll("[data-card-key]").forEach(function (item) {
                    if (item.getAttribute("data-card-key") === selectedKey) item.classList.add("is-selected");
                });
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
        document.head.appendChild(style);
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
            selectedKey = null;
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
            unassign: unassign
        };
    }

    window.MBTierList = { __loaded: true, refreshAccess: refreshAccess, render: render, openInfo: openInfo, assign: assign, unassign: unassign };
    injectStyles();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();