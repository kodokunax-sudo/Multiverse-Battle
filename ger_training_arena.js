/* Moderator-only GER dodge training arena. */
(function () {
    "use strict";

    var SETTINGS_KEY = "mb_ger_training_arena_settings_v2";
    var UNIQUE_WAVES = [200, 500, 1000, 1500, 2000];
    var ATTACKS = [
        "⬜ Стены", "🔷 Хаос", "⚡ Жёлтые мечи", "🔺 Красные треугольники",
        "💗 Розовый удар", "💚 Зелёное лечение", "🌈 Радужная смерть", "⚡🛑 Микс атак",
        "🟥⬜ Опасные зоны", "💣 Бомбы", "🔫 Бластеры", "⚙️ Маятники",
        "⛓️ Живые тросы", "☣️ Кислотная карта", "🌪️ Штормовой коридор",
        "🪃 Бумеранги", "🌋 Расколотая земля", "🐙 Охота щупалец",
        "⚙️ Шестерёнчатая погоня", "🌿 Сад шипов", "🦾 Клешни"
    ];
    var DIRECTIONS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
    var running = false;
    var runEndsAt = 0;
    var timerId = 0;
    var statsBusy = false;

    function byId(id) { return document.getElementById(id); }
    function clamp(value, fallback, min, max) {
        var n = Number(value);
        if (!Number.isFinite(n)) n = Number(fallback);
        if (!Number.isFinite(n)) n = min;
        return Math.max(min, Math.min(max, n));
    }
    function moderatorAllowed() {
        return typeof window.MBHasModeratorAccess === "function" &&
            window.MBHasModeratorAccess() === true;
    }
    function setStatus(message, kind) {
        var el = byId("gerTrainingStatus");
        if (!el) return;
        el.textContent = String(message || "");
        el.style.color = kind === "error" ? "#ffaaa1" :
            kind === "success" ? "#a6ffc4" :
            kind === "warning" ? "#ffd59c" : "#ffe4a6";
    }
    function setNotice(message, allowed) {
        var el = byId("gerTrainingAccessNotice");
        if (!el) return;
        el.textContent = message;
        el.style.color = allowed ? "#c3ffd7" : "#ffd7aa";
    }
    window.MBGERTrainingArenaSetStatus = setStatus;

    function updateAccess(allowed) {
        var start = byId("gerTrainingStartBtn");
        var stop = byId("gerTrainingStopBtn");
        var refresh = byId("gerTrainingRefreshStatsBtn");
        if (start) start.disabled = !allowed || running;
        if (stop) stop.disabled = !allowed || !running;
        if (refresh) refresh.disabled = !allowed || statsBusy;
        setNotice(
            allowed
                ? "✓ Доступ подтверждён сервером. Можно запускать тренировочные бои."
                : "🔒 Эта арена доступна только аккаунтам с подтверждёнными правами модератора.",
            allowed
        );
    }

    function selectedTrainingType() {
        var el = byId("gerTrainingType");
        return el && el.value === "unique_mix" ? "unique_mix" : "standard";
    }
    function updateModeVisibility() {
        var unique = selectedTrainingType() === "unique_mix";
        var standard = byId("gerTrainingStandardSettings");
        var uniquePanel = byId("gerTrainingUniqueSettings");
        var standardAttacks = byId("gerTrainingStandardAttacks");
        var invulnerable = byId("gerTrainingInvulnerable");
        if (standard) standard.style.display = unique ? "none" : "block";
        if (uniquePanel) uniquePanel.style.display = unique ? "block" : "none";
        if (standardAttacks) standardAttacks.style.display = unique ? "none" : "block";
        if (invulnerable) { if (unique) invulnerable.checked = true; invulnerable.disabled = unique; }
    }
    function updateControls() {
        updateModeVisibility();
        updateAccess(moderatorAllowed());
        var runningLabel = running ? "■ ТРЕНИРОВКА ИДЁТ" : "▶ НАЧАТЬ ОБУЧЕНИЕ";
        var start = byId("gerTrainingStartBtn");
        if (start) start.textContent = runningLabel;
        var wave = byId("gerTrainingAttackWave");
        var waveValue = byId("gerTrainingAttackWaveValue");
        if (wave && waveValue) waveValue.textContent = String(clamp(wave.value, 500, 50, 10000));
        var speed = byId("gerTrainingSpeed");
        var speedValue = byId("gerTrainingSpeedValue");
        if (speed && speedValue) speedValue.textContent = clamp(speed.value, 2, 1, 5).toFixed(1).replace(/\.0$/, "") + "×";
    }

    function fillBossList() {
        var select = byId("gerTrainingBossWave");
        if (!select) return;
        select.textContent = "";
        var templates = typeof bossTemplates !== "undefined" ? bossTemplates : null;
        var entries = templates
            ? Object.keys(templates).map(Number).filter(function (wave) {
                return Number.isFinite(wave) && wave > 0 && UNIQUE_WAVES.indexOf(wave) === -1 && templates[wave];
            }).sort(function (a, b) { return a - b; })
            : [];
        if (!entries.length) entries = [50];
        entries.forEach(function (wave) {
            var template = templates && templates[wave];
            var option = document.createElement("option");
            option.value = String(wave);
            option.textContent = wave + " волна · " + (template && template.name ? template.name : "Обычный босс");
            select.appendChild(option);
        });
        var desired = entries.indexOf(50) >= 0 ? "50" : String(entries[0]);
        select.value = desired;
    }

    function renderAttackChecks(selected) {
        var list = byId("gerTrainingAttackList");
        if (!list) return;
        list.textContent = "";
        var chosen = selected instanceof Set ? selected : new Set(ATTACKS.map(function (_item, i) { return i; }));
        ATTACKS.forEach(function (name, index) {
            var label = document.createElement("label");
            label.style.cssText = "display:flex;gap:8px;align-items:center;padding:9px 10px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.09);border-radius:10px;font-size:12px;line-height:1.3;";
            var input = document.createElement("input");
            input.type = "checkbox";
            input.checked = chosen.has(index);
            input.dataset.gerTrainingAttack = String(index);
            input.style.cssText = "accent-color:#e7bd67;flex-shrink:0;width:16px;height:16px;";
            var span = document.createElement("span");
            span.textContent = name;
            label.appendChild(input);
            label.appendChild(span);
            list.appendChild(label);
        });
    }

    function selectedAttackTypes() {
        return Array.from(document.querySelectorAll("#gerTrainingAttackList input[data-ger-training-attack]:checked"))
            .map(function (input) { return Number(input.dataset.gerTrainingAttack); })
            .filter(function (n) { return Number.isInteger(n) && n >= 0 && n < ATTACKS.length; });
    }
    function setAttackPreset(predicate) {
        document.querySelectorAll("#gerTrainingAttackList input[data-ger-training-attack]").forEach(function (input) {
            input.checked = !!predicate(Number(input.dataset.gerTrainingAttack));
        });
        saveSettings();
    }

    function readSettings() {
        var type = selectedTrainingType();
        return {
            type: type,
            bossWave: type === "unique_mix" ? 50 : (Number(byId("gerTrainingBossWave") && byId("gerTrainingBossWave").value) || 50),
            bossHp: clamp(byId("gerTrainingBossHp") && byId("gerTrainingBossHp").value, 2000000, 10000, 1000000000000),
            attackWave: clamp(byId("gerTrainingAttackWave") && byId("gerTrainingAttackWave").value, 500, 50, 10000),
            speed: clamp(byId("gerTrainingSpeed") && byId("gerTrainingSpeed").value, 2, 1, 5),
            duration: Number(byId("gerTrainingDuration") && byId("gerTrainingDuration").value) || 0,
            attacks: selectedAttackTypes(),
            invulnerable: type === "unique_mix" || !!(byId("gerTrainingInvulnerable") && byId("gerTrainingInvulnerable").checked)
        };
    }
    function saveSettings() {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(readSettings())); } catch (_error) {}
    }
    function restoreSettings() {
        var saved = null;
        try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"); } catch (_error) {}
        if (!saved || typeof saved !== "object") return;
        if (byId("gerTrainingType") && ["standard", "unique_mix"].indexOf(saved.type) >= 0) byId("gerTrainingType").value = saved.type;
        if (byId("gerTrainingBossHp")) byId("gerTrainingBossHp").value = String(clamp(saved.bossHp, 2000000, 10000, 1000000000000));
        if (byId("gerTrainingBossWave")) {
            var exists = Array.from(byId("gerTrainingBossWave").options).some(function (option) {
                return option.value === String(saved.bossWave);
            });
            if (exists) byId("gerTrainingBossWave").value = String(saved.bossWave);
        }
        if (byId("gerTrainingAttackWave")) byId("gerTrainingAttackWave").value = String(clamp(saved.attackWave, 500, 50, 10000));
        if (byId("gerTrainingSpeed")) byId("gerTrainingSpeed").value = String(clamp(saved.speed, 2, 1, 5));
        if (byId("gerTrainingDuration") && [0, 120000, 300000, 480000, 600000].indexOf(Number(saved.duration)) >= 0) {
            byId("gerTrainingDuration").value = String(saved.duration);
        }
        if (byId("gerTrainingInvulnerable")) byId("gerTrainingInvulnerable").checked = saved.invulnerable !== false;
        if (Array.isArray(saved.attacks)) {
            var chosen = new Set(saved.attacks.map(Number).filter(function (n) { return Number.isInteger(n) && n >= 0 && n <= 20; }));
            renderAttackChecks(chosen);
        }
        updateControls();
    }

    function currentBrainKey() {
        if (selectedTrainingType() === "unique_mix") return "ger_unique_mix";
        var wave = Number(byId("gerTrainingBossWave") && byId("gerTrainingBossWave").value) || 50;
        return "arena_wave_" + wave;
    }

    async function refreshStats() {
        if (!moderatorAllowed()) return setStatus("Нет подтверждённого доступа к тренировочной арене.", "error");
        if (statsBusy) return;
        var api = window.MBGERTraining;
        var summary = byId("gerTrainingStatsSummary");
        var list = byId("gerTrainingStatsList");
        if (!api || typeof api.refreshBrain !== "function") {
            if (summary) summary.textContent = "Модуль серверной памяти ещё не загрузился.";
            return;
        }
        statsBusy = true;
        updateAccess(true);
        if (summary) summary.textContent = "Загружаем общую память GER…";
        if (list) list.textContent = "";
        try {
            var bossKey = currentBrainKey();
            var entry = await api.refreshBrain(bossKey);
            if (!entry) {
                if (summary) summary.textContent = "Память пока недоступна. Проверь вход в игровой аккаунт и соединение.";
                return;
            }
            var rows = Object.keys(entry.attacks || {}).map(function (key) {
                return { key: key, stats: entry.attacks[key] };
            }).sort(function (a, b) {
                return Number(b.stats.sample_count) - Number(a.stats.sample_count);
            });
            var totals = { samples: 0, evaded: 0, hits: 0, blocked: 0, unknown: 0 };
            rows.forEach(function (row) {
                totals.samples += Number(row.stats.sample_count) || 0;
                totals.evaded += Number(row.stats.evaded_count) || 0;
                totals.hits += Number(row.stats.hit_count) || 0;
                totals.blocked += Number(row.stats.blocked_count) || 0;
                totals.unknown += Number(row.stats.unknown_count) || 0;
            });
            if (summary) {
                var evadePercent = totals.samples ? Math.round(totals.evaded / totals.samples * 100) : 0;
                summary.textContent = "Память босса " + bossKey + " · " + totals.samples +
                    " наблюдений · " + evadePercent + "% зафиксированных уклонений · " +
                    totals.hits + " попаданий по стенду · " + totals.blocked + " перехватов";
            }
            if (!rows.length) {
                if (list) {
                    var empty = document.createElement("div");
                    empty.style.cssText = "padding:12px;border:1px dashed rgba(255,255,255,.15);border-radius:10px;font-size:12px;color:#aeb8c8;";
                    empty.textContent = "Для этого босса пока нет обучающих записей. Запусти арену и дай GER несколько циклов атак.";
                    list.appendChild(empty);
                }
                return;
            }
            rows.forEach(function (row) {
                var s = row.stats;
                var count = Number(s.sample_count) || 0;
                var evaded = Number(s.evaded_count) || 0;
                var hits = Number(s.hit_count) || 0;
                var blocked = Number(s.blocked_count) || 0;
                var bestDirection = null;
                var bestRate = -1;
                for (var direction = 0; direction < 8; direction++) {
                    var learned = entry.directions[row.key + "|" + direction];
                    if (!learned) continue;
                    var directionCount = Number(learned.sample_count) || 0;
                    var rate = directionCount ? (Number(learned.evaded_count) || 0) / directionCount : -1;
                    if (directionCount >= 3 && rate > bestRate) {
                        bestRate = rate;
                        bestDirection = direction;
                    }
                }
                var item = document.createElement("div");
                item.style.cssText = "display:grid;grid-template-columns:minmax(0,1.5fr) repeat(3,minmax(55px,.55fr)) minmax(65px,.6fr);gap:8px;align-items:center;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(0,0,0,.2);font-size:12px;";
                var attackName = document.createElement("strong");
                attackName.style.cssText = "min-width:0;overflow-wrap:anywhere;color:#ffe5ae;";
                attackName.textContent = row.key;
                item.appendChild(attackName);
                [
                    ["Наблюдения", count],
                    ["Уклонения", evaded],
                    ["Попадания", hits],
                    ["Направление", bestDirection === null ? "—" : DIRECTIONS[bestDirection]]
                ].forEach(function (pair) {
                    var cell = document.createElement("div");
                    cell.style.cssText = "text-align:center;color:#c5d0df;";
                    var label = document.createElement("div");
                    label.style.cssText = "font-size:10px;color:#8794a8;margin-bottom:3px;";
                    label.textContent = pair[0];
                    var value = document.createElement("strong");
                    value.textContent = String(pair[1]);
                    cell.appendChild(label);
                    cell.appendChild(value);
                    item.appendChild(cell);
                });
                list.appendChild(item);
            });
        } catch (error) {
            console.warn("[GER training arena] Stats refresh failed:", error);
            if (summary) summary.textContent = "Не удалось загрузить память: " + (error && error.message ? error.message : "ошибка соединения");
        } finally {
            statsBusy = false;
            updateAccess(moderatorAllowed());
        }
    }

    function formatTime(ms) {
        var seconds = Math.max(0, Math.ceil(ms / 1000));
        var minutes = Math.floor(seconds / 60);
        var rest = seconds % 60;
        return minutes + ":" + String(rest).padStart(2, "0");
    }
    function updateRunTimer() {
        if (!running || !runEndsAt) return;
        var remaining = runEndsAt - Date.now();
        var timer = byId("gerTrainingRunTimer");
        if (timer) timer.textContent = remaining > 0 ? "Автоматическая остановка через " + formatTime(remaining) : "Завершаем тренировку…";
        if (remaining <= 0) stopTraining("exit");
    }
    function clearRunTimer() {
        if (timerId) window.clearInterval(timerId);
        timerId = 0;
        runEndsAt = 0;
        var timer = byId("gerTrainingRunTimer");
        if (timer) timer.textContent = "";
    }

    function startTraining() {
        if (!moderatorAllowed()) return setStatus("Запуск заблокирован: права модератора не подтверждены сервером.", "error");
        if (running || window.__mbBossTestMode) return setStatus("Сначала заверши текущий тестовый бой.", "warning");
        var settings = readSettings();
        if (settings.type === "standard" && !settings.attacks.length) return setStatus("Выбери хотя бы один тип атаки.", "error");
        if (typeof window.MBBossTestStartGERTraining !== "function") {
            return setStatus("Не загрузился модуль запуска арены. Обнови страницу.", "error");
        }
        saveSettings();
        var started = window.MBBossTestStartGERTraining({
            trainingProfile: settings.type,
            bossWave: settings.bossWave,
            bossHp: settings.bossHp,
            attackWave: settings.attackWave,
            attackTypes: settings.type === "unique_mix" ? [] : settings.attacks,
            speedMultiplier: settings.speed,
            invulnerable: settings.invulnerable
        });
        if (!started) return;
        running = true;
        var duration = Math.max(0, Number(settings.duration) || 0);
        runEndsAt = duration > 0 ? Date.now() + duration : 0;
        if (duration > 0) {
            timerId = window.setInterval(updateRunTimer, 250);
            updateRunTimer();
        } else {
            var timer = byId("gerTrainingRunTimer");
            if (timer) timer.textContent = "Автоматической остановки нет.";
        }
        updateControls();
    }

    function stopTraining(result) {
        if (!running && !(window.__mbBossTestMode && window.__mbBossTestMode.gerTraining)) return;
        if (typeof window.MBBossTestFinish === "function" && window.__mbBossTestMode && window.__mbBossTestMode.gerTraining) {
            window.MBBossTestFinish(result || "exit", false);
        } else {
            running = false;
            clearRunTimer();
            updateControls();
        }
    }

    window.MBGERTrainingArenaOnStarted = function (modeData) {
        running = true;
        setStatus(modeData && modeData.trainingProfile === "unique_mix"
            ? "GER вызван против универсального манекена. Основные паттерны уникальных боссов чередуются, игрок неуязвим."
            : "GER вызван. Босс: " + (modeData && modeData.bossName ? modeData.bossName : "обычный") +
                ". Выбрано типов атак: " + (modeData && Array.isArray(modeData.attackTypes) ? modeData.attackTypes.length : 0) +
                ". Не закрывай вкладку, пока он собирает опыт.", "success");
        updateControls();
    };
    window.MBGERTrainingArenaOnFinished = function (result) {
        running = false;
        clearRunTimer();
        updateControls();
        var text = result === "loss" ? "Тренировка закончилась поражением." :
            result === "error" ? "Не удалось запустить тренировку." :
            "Тренировка остановлена. Прогресс игры не изменён.";
        setStatus(text + " Обновляем накопленную память…", result === "error" ? "error" : "success");
        window.setTimeout(function () {
            refreshStats().then(function () {
                setStatus(text, "success");
            });
        }, 1400);
    };
    window.MBGERTrainingArenaAccessChanged = function (allowed) {
        updateAccess(allowed === true);
        if (!allowed && running) stopTraining("exit");
    };

    function initialize() {
        fillBossList();
        renderAttackChecks();
        restoreSettings();

        var start = byId("gerTrainingStartBtn");
        var stop = byId("gerTrainingStopBtn");
        var refresh = byId("gerTrainingRefreshStatsBtn");
        if (start) start.addEventListener("click", startTraining);
        if (stop) stop.addEventListener("click", function () { stopTraining("exit"); });
        if (refresh) refresh.addEventListener("click", refreshStats);
        if (byId("gerTrainingAttackWave")) byId("gerTrainingAttackWave").addEventListener("input", function () { updateControls(); saveSettings(); });
        if (byId("gerTrainingBossHp")) byId("gerTrainingBossHp").addEventListener("input", function () { saveSettings(); });
        if (byId("gerTrainingSpeed")) byId("gerTrainingSpeed").addEventListener("input", function () { updateControls(); saveSettings(); });
        ["gerTrainingBossWave", "gerTrainingDuration", "gerTrainingInvulnerable"].forEach(function (id) {
            var control = byId(id);
            if (control) control.addEventListener("change", saveSettings);
        });
        if (byId("gerTrainingType")) byId("gerTrainingType").addEventListener("change", function () {
            updateControls();
            saveSettings();
        });
        if (byId("gerTrainingPresetAll")) byId("gerTrainingPresetAll").addEventListener("click", function () { setAttackPreset(function () { return true; }); });
        if (byId("gerTrainingPresetBasic")) byId("gerTrainingPresetBasic").addEventListener("click", function () { setAttackPreset(function (i) { return i <= 10; }); });
        if (byId("gerTrainingPresetAdvanced")) byId("gerTrainingPresetAdvanced").addEventListener("click", function () { setAttackPreset(function (i) { return i >= 11; }); });
        if (byId("gerTrainingPresetNone")) byId("gerTrainingPresetNone").addEventListener("click", function () { setAttackPreset(function () { return false; }); });
        var list = byId("gerTrainingAttackList");
        if (list) list.addEventListener("change", saveSettings);
        updateControls();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();