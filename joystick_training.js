/* ============================================================
   MULTIVERSE BATTLE — JOYSTICK TRAINING / LAYOUT PRESETS v1
   Immortal practice arena + draggable fixed joystick editor.
   ============================================================ */
(function () {
    "use strict";
    if (window.__mbJoystickTrainingLoaded) return;
    window.__mbJoystickTrainingLoaded = true;

    var activeSession = null;
    var styleNode = null;

    function settings() {
        try { if (typeof arenaSettings !== "undefined" && arenaSettings) return arenaSettings; } catch (e) {}
        return window.arenaSettings || null;
    }
    function saveSettings() {
        try { if (typeof saveArenaSettings === "function") saveArenaSettings(); } catch (e) {}
        try { if (typeof window.refreshJoystickSettings === "function") window.refreshJoystickSettings(); } catch (e) {}
    }
    function clamp(value, min, max) {
        var n = Number(value);
        return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
    }
    function ensurePresets(s) {
        if (!Array.isArray(s.joystickLayouts)) s.joystickLayouts = [];
        s.joystickLayouts = s.joystickLayouts.slice(0, 3);
        while (s.joystickLayouts.length < 3) s.joystickLayouts.push(null);
    }
    function currentLayout(s) {
        return {
            x: clamp(s.joystickPositionX == null ? 24 : s.joystickPositionX, 8, 92),
            y: clamp(s.joystickPositionY == null ? 80 : s.joystickPositionY, 8, 92),
            size: clamp(s.joystickSize == null ? 100 : s.joystickSize, 60, 160),
            opacity: clamp(s.joystickOpacity == null ? 60 : s.joystickOpacity, 20, 100),
            fixed: true
        };
    }
    function notify(message, color) {
        try {
            if (typeof showFloatingText === "function") showFloatingText(message, color || "#8deaff");
        } catch (e) {}
    }
    function setNotice(el, text, color) {
        if (!el) return;
        el.textContent = text;
        el.style.color = color || "#bfeaff";
    }

    function savePreset(index, noticeElement) {
        var s = settings();
        index = Number(index);
        if (!s || !Number.isInteger(index) || index < 0 || index > 2) return false;
        ensurePresets(s);
        s.joystickFixedPosition = true;
        s.joystickLayouts[index] = currentLayout(s);
        s.activeJoystickLayout = index;
        s.mobileControlStyle = "analog";
        if (s.arenaControl !== "joystick") s.arenaControl = "auto";
        saveSettings();
        renderPresetSettings();
        setNotice(noticeElement, "Раскладка " + (index + 1) + " сохранена", "#8dffc2");
        if (activeSession && activeSession.renderPresetButtons) activeSession.renderPresetButtons();
        notify("💾 Раскладка джойстика " + (index + 1) + " сохранена", "#8dffc2");
        return true;
    }

    function loadPreset(index, noticeElement) {
        var s = settings();
        index = Number(index);
        if (!s || !Number.isInteger(index) || index < 0 || index > 2) return false;
        ensurePresets(s);
        var preset = s.joystickLayouts[index];
        if (!preset || typeof preset !== "object") {
            setNotice(noticeElement, "Раскладка " + (index + 1) + " ещё не сохранена", "#ffd18c");
            return false;
        }
        s.joystickPositionX = clamp(preset.x, 8, 92);
        s.joystickPositionY = clamp(preset.y, 8, 92);
        s.joystickSize = clamp(preset.size, 60, 160);
        s.joystickOpacity = clamp(preset.opacity, 20, 100);
        s.joystickFixedPosition = true;
        s.mobileControlStyle = "analog";
        s.activeJoystickLayout = index;
        if (s.arenaControl !== "joystick") s.arenaControl = "auto";
        saveSettings();
        renderPresetSettings();
        if (activeSession && activeSession.renderPreview) activeSession.renderPreview();
        setNotice(noticeElement, "Загружена раскладка " + (index + 1), "#8dffc2");
        notify("🕹️ Загружена раскладка " + (index + 1), "#8dffc2");
        return true;
    }

    window.MBSaveJoystickLayout = function (index) { return savePreset(index); };
    window.MBLoadJoystickLayout = function (index) { return loadPreset(index); };

    function renderPresetSettings() {
        var container = document.getElementById("mbJoystickPresetSettings");
        if (!container) return;
        var s = settings();
        if (!s) return;
        ensurePresets(s);
        container.textContent = "";
        var title = document.createElement("div");
        title.textContent = "💾 Три сохранённые раскладки джойстика";
        title.style.cssText = "font-weight:900;margin:8px 0;color:#e6ddff;";
        container.appendChild(title);
        var row = document.createElement("div");
        row.style.cssText = "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;";
        for (var i = 0; i < 3; i++) {
            (function (index) {
                var saved = s.joystickLayouts[index];
                var card = document.createElement("div");
                card.style.cssText = "min-width:0;padding:8px;border:1px solid rgba(190,165,255,.28);border-radius:10px;background:rgba(20,15,35,.48);";
                var label = document.createElement("div");
                label.textContent = "РАСКЛАДКА " + (index + 1);
                label.style.cssText = "font-size:10px;font-weight:900;color:#d8c8ff;margin-bottom:6px;";
                var state = document.createElement("div");
                state.textContent = saved ? Math.round(saved.x) + "% · " + Math.round(saved.y) + "% · " + Math.round(saved.size) + "%" : "Пусто";
                state.style.cssText = "font-size:9px;color:#aaa;margin-bottom:7px;min-height:20px;";
                var load = document.createElement("button");
                load.type = "button";
                load.textContent = "Загрузить";
                load.disabled = !saved;
                load.style.cssText = "width:100%;padding:6px 3px;margin-bottom:5px;border:0;border-radius:7px;background:" + (saved ? "#514276" : "#34313f") + ";color:#fff;font-size:10px;font-weight:900;";
                load.addEventListener("click", function () { loadPreset(index); });
                var save = document.createElement("button");
                save.type = "button";
                save.textContent = "Сохранить";
                save.style.cssText = "width:100%;padding:6px 3px;border:0;border-radius:7px;background:#286b59;color:#fff;font-size:10px;font-weight:900;";
                save.addEventListener("click", function () { savePreset(index); });
                card.appendChild(label);
                card.appendChild(state);
                card.appendChild(load);
                card.appendChild(save);
                row.appendChild(card);
            })(i);
        }
        container.appendChild(row);
    }

    function ensureStyles() {
        if (styleNode) return;
        styleNode = document.createElement("style");
        styleNode.id = "mb-joystick-training-style";
        styleNode.textContent = [
            "#mbJoystickTrainingPanel{position:fixed;z-index:100300;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(440px,calc(100vw - 16px));max-height:34vh;overflow:auto;box-sizing:border-box;padding:10px;border:1px solid rgba(132,211,255,.62);border-radius:14px;background:linear-gradient(145deg,rgba(8,18,34,.97),rgba(27,18,48,.97));box-shadow:0 10px 36px #000b;color:#fff;font:12px Arial,sans-serif;}",
            "#mbJoystickTrainingPanel .mbjt-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:900;color:#9eeaff;font-size:13px;}",
            "#mbJoystickTrainingPanel .mbjt-help{margin:6px 0 8px;color:#d7ddec;line-height:1.35;font-size:11px;}",
            "#mbJoystickTrainingPanel .mbjt-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;}",
            "#mbJoystickTrainingPanel button{border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:8px 9px;background:#27364e;color:#fff;font-weight:900;font-size:10px;touch-action:manipulation;}",
            "#mbJoystickTrainingPanel button:disabled{opacity:.35;}",
            "#mbJoystickTrainingPanel .mbjt-primary{background:linear-gradient(135deg,#087b87,#2653a5);border-color:#6fdcf0;}",
            "#mbJoystickTrainingPanel .mbjt-exit{background:#7e2f43;border-color:#ff91a8;}",
            "#mbJoystickTrainingPanel input[type=range]{width:100%;accent-color:#65d9ee;}",
            "#mbJoystickEditorPreview{position:fixed;z-index:100250;box-sizing:border-box;border:2px solid rgba(255,255,255,.92);border-radius:50%;background:radial-gradient(circle,rgba(35,55,80,.16),rgba(20,25,48,.68));box-shadow:0 0 0 2px rgba(80,205,255,.35),0 0 22px rgba(64,192,255,.4);transform:translate(-50%,-50%);touch-action:none;pointer-events:auto;}",
            "#mbJoystickEditorPreview .mbjt-knob{position:absolute;left:50%;top:50%;width:38%;height:38%;transform:translate(-50%,-50%);border:2px solid #fff;border-radius:50%;background:radial-gradient(circle at 30% 25%,#fff8b8,#ffbf31 60%,#ad5900);box-shadow:0 0 14px #ffae23;pointer-events:none;}",
            "#mbJoystickEditorPreview .mbjt-center{position:absolute;left:50%;top:50%;width:5px;height:5px;border:1px solid #fff;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;}",
            "#mbJoystickEditorPreview .mbjt-resize{position:absolute;right:-7px;bottom:-7px;width:27px;height:27px;border:2px solid #fff;border-radius:50%;background:#147d91;color:#fff;font:900 15px Arial;display:flex;align-items:center;justify-content:center;touch-action:none;}",
            "@media(max-height:560px){#mbJoystickTrainingPanel{max-height:29vh;padding:7px}#mbJoystickTrainingPanel .mbjt-help{display:none}}"
        ].join("");
        document.head.appendChild(styleNode);
    }

    function cloneJson(value) {
        try { return JSON.parse(JSON.stringify(value)); } catch (e) { return null; }
    }

    function takeSnapshot() {
        var snapshot = {};
        try { snapshot.wave = typeof wave !== "undefined" ? wave : null; } catch (e) {}
        try { snapshot.playerHp = typeof playerHp !== "undefined" ? playerHp : null; } catch (e) {}
        try { snapshot.points = typeof points !== "undefined" ? points : null; } catch (e) {}
        try { snapshot.maxPoints = typeof maxPoints !== "undefined" ? maxPoints : null; } catch (e) {}
        try { snapshot.totalWins = typeof totalWins !== "undefined" ? totalWins : null; } catch (e) {}
        try { snapshot.totalClicks = typeof totalClicks !== "undefined" ? totalClicks : null; } catch (e) {}
        try { snapshot.highestWaveReached = typeof highestWaveReached !== "undefined" ? highestWaveReached : null; } catch (e) {}
        try { snapshot.highestCheckpoint = typeof highestCheckpoint !== "undefined" ? highestCheckpoint : null; } catch (e) {}
        try {
            snapshot.defeatedRef = typeof defeatedBosses !== "undefined" && Array.isArray(defeatedBosses) ? defeatedBosses : null;
            snapshot.defeatedValues = snapshot.defeatedRef ? snapshot.defeatedRef.slice() : null;
        } catch (e) {}
        try {
            snapshot.enemyRef = typeof currentEnemy !== "undefined" ? currentEnemy : null;
            snapshot.enemyData = snapshot.enemyRef ? cloneJson(snapshot.enemyRef) : null;
        } catch (e) {}
        try {
            snapshot.superState = typeof _superState !== "undefined" ? _superState : null;
            snapshot.superData = snapshot.superState ? cloneJson(snapshot.superState) : null;
        } catch (e) {}
        return snapshot;
    }

    function restoreSnapshot(snapshot) {
        if (!snapshot) return;
        try { if (snapshot.wave !== null && typeof wave !== "undefined") wave = snapshot.wave; } catch (e) {}
        try { if (snapshot.playerHp !== null && typeof playerHp !== "undefined") playerHp = snapshot.playerHp; } catch (e) {}
        try { if (snapshot.points !== null && typeof points !== "undefined") points = snapshot.points; } catch (e) {}
        try { if (snapshot.maxPoints !== null && typeof maxPoints !== "undefined") maxPoints = snapshot.maxPoints; } catch (e) {}
        try { if (snapshot.totalWins !== null && typeof totalWins !== "undefined") totalWins = snapshot.totalWins; } catch (e) {}
        try { if (snapshot.totalClicks !== null && typeof totalClicks !== "undefined") totalClicks = snapshot.totalClicks; } catch (e) {}
        try { if (snapshot.highestWaveReached !== null && typeof highestWaveReached !== "undefined") highestWaveReached = snapshot.highestWaveReached; } catch (e) {}
        try { if (snapshot.highestCheckpoint !== null && typeof highestCheckpoint !== "undefined") highestCheckpoint = snapshot.highestCheckpoint; } catch (e) {}
        try {
            if (snapshot.defeatedRef && snapshot.defeatedValues) {
                snapshot.defeatedRef.splice.apply(snapshot.defeatedRef, [0, snapshot.defeatedRef.length].concat(snapshot.defeatedValues));
            }
        } catch (e) {}
        try {
            if (snapshot.enemyRef && snapshot.enemyData) {
                Object.keys(snapshot.enemyRef).forEach(function (key) {
                    if (!Object.prototype.hasOwnProperty.call(snapshot.enemyData, key)) delete snapshot.enemyRef[key];
                });
                Object.assign(snapshot.enemyRef, snapshot.enemyData);
                currentEnemy = snapshot.enemyRef;
            }
        } catch (e) {}
        try {
            if (snapshot.superState && snapshot.superData) {
                Object.keys(snapshot.superState).forEach(function (key) {
                    if (!Object.prototype.hasOwnProperty.call(snapshot.superData, key)) delete snapshot.superState[key];
                });
                Object.assign(snapshot.superState, snapshot.superData);
                _superState = snapshot.superState;
            }
        } catch (e) {}
        try { if (typeof renderEnemy === "function") renderEnemy(); } catch (e) {}
        try { if (typeof updateStatusDisplay === "function") updateStatusDisplay(); } catch (e) {}
        try { if (typeof updatePlayerStats === "function") updatePlayerStats(); } catch (e) {}
        try { if (typeof updateSuperButton === "function") updateSuperButton(); } catch (e) {}
    }

    function createTrainingPanel(session) {
        ensureStyles();
        var panel = document.createElement("div");
        panel.id = "mbJoystickTrainingPanel";
        panel.innerHTML =
            '<div class="mbjt-head"><span>🕹️ ТРЕНИРОВКА УПРАВЛЕНИЯ</span><span style="color:#a9b7cf;font-size:9px;">БЕССМЕРТНЫЙ РЕЖИМ</span></div>' +
            '<div class="mbjt-help">Перетаскивай большой круг прямо на поле, чтобы переместить джойстик. Потяни за маленький уголок, чтобы изменить размер. В тестовом режиме можно двигаться, уклоняться и проверять способности.</div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><label for="mbjtSize">Размер джойстика</label><strong id="mbjtSizeLabel">100%</strong></div>' +
            '<input id="mbjtSize" type="range" min="60" max="160" value="100">' +
            '<div class="mbjt-row" id="mbjtPresets"></div>' +
            '<div style="margin-top:6px;color:#aebbd0;font-size:9px;" id="mbjtStatus">Перемести и сохрани подходящую раскладку.</div>' +
            '<div class="mbjt-row">' +
              '<button type="button" class="mbjt-primary" id="mbjtTestToggle">▶ Тестировать движение</button>' +
              '<button type="button" id="mbjtSaveCurrent">💾 Сохранить текущую</button>' +
              '<button type="button" class="mbjt-exit" id="mbjtExit">Выйти из тренировки</button>' +
            '</div>';
        document.body.appendChild(panel);
        session.panel = panel;

        var preview = document.createElement("div");
        preview.id = "mbJoystickEditorPreview";
        preview.innerHTML = '<div class="mbjt-knob"></div><div class="mbjt-center"></div><button type="button" class="mbjt-resize" aria-label="Изменить размер">↘</button>';
        document.body.appendChild(preview);
        session.preview = preview;

        var presetBox = panel.querySelector("#mbjtPresets");
        for (var i = 0; i < 3; i++) {
            (function (index) {
                var group = document.createElement("div");
                group.style.cssText = "display:flex;flex:1;min-width:88px;gap:4px;";
                var load = document.createElement("button");
                load.type = "button";
                load.textContent = "Загрузить " + (index + 1);
                load.style.flex = "1";
                load.addEventListener("click", function () {
                    if (loadPreset(index, panel.querySelector("#mbjtStatus"))) {
                        session.renderPreview();
                        var slider = panel.querySelector("#mbjtSize");
                        if (slider) slider.value = String(settings().joystickSize);
                        session.setEditor(true);
                    }
                });
                var save = document.createElement("button");
                save.type = "button";
                save.textContent = "💾" + (index + 1);
                save.title = "Сохранить раскладку " + (index + 1);
                save.addEventListener("click", function () { savePreset(index, panel.querySelector("#mbjtStatus")); session.renderPreview(); });
                group.appendChild(load);
                group.appendChild(save);
                presetBox.appendChild(group);
            })(i);
        }

        var sizeInput = panel.querySelector("#mbjtSize");
        sizeInput.value = String(settings().joystickSize || 100);
        sizeInput.addEventListener("input", function () {
            var s = settings();
            s.joystickSize = clamp(sizeInput.value, 60, 160);
            panel.querySelector("#mbjtSizeLabel").textContent = Math.round(s.joystickSize) + "%";
            saveSettings();
            session.renderPreview();
        });

        panel.querySelector("#mbjtSaveCurrent").addEventListener("click", function () {
            var s = settings();
            s.joystickPositionX = session.readPosition().x;
            s.joystickPositionY = session.readPosition().y;
            saveSettings();
            var index = Math.max(0, Math.min(2, Number(s.activeJoystickLayout) || 0));
            savePreset(index, panel.querySelector("#mbjtStatus"));
        });
        panel.querySelector("#mbjtTestToggle").addEventListener("click", function () {
            session.setEditor(!session.editing);
        });
        panel.querySelector("#mbjtExit").addEventListener("click", function () { window.MBEndJoystickTraining(); });

        session.setEditor(true);
        session.renderPreview();
        session.renderPresetButtons = function () {
            var s = settings();
            ensurePresets(s);
            var buttons = presetBox.querySelectorAll("button");
            var k = 0;
            for (var n = 0; n < 3; n++) {
                buttons[k++].disabled = !s.joystickLayouts[n];
                buttons[k++].disabled = false;
            }
        };
        session.renderPresetButtons();
    }

    function bindPreviewDrag(session) {
        var preview = session.preview;
        var panel = session.panel;
        var resizeHandle = preview.querySelector(".mbjt-resize");

        function begin(event, mode) {
            if (!session.editing) return;
            event.preventDefault();
            event.stopPropagation();
            session.drag = {
                mode: mode,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startLayout: currentLayout(settings())
            };
            try { event.currentTarget.setPointerCapture(event.pointerId); } catch (e) {}
        }
        function move(event) {
            var drag = session.drag;
            if (!drag || drag.pointerId !== event.pointerId) return;
            event.preventDefault();
            var s = settings();
            if (drag.mode === "move") {
                var rect = session.canvas.getBoundingClientRect();
                var x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
                var y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;
                var marginX = (80 * (Number(s.joystickSize) || 100) / 100 + 8) / 400 * 100;
                var marginY = (80 * (Number(s.joystickSize) || 100) / 100 + 8) / 500 * 100;
                s.joystickPositionX = clamp(x, marginX, 100 - marginX);
                s.joystickPositionY = clamp(y, marginY, 100 - marginY);
            } else {
                var scale = Math.min(session.canvas.getBoundingClientRect().width / 400,
                                     session.canvas.getBoundingClientRect().height / 500);
                var change = ((event.clientX - drag.startX) + (event.clientY - drag.startY)) / 2;
                s.joystickSize = clamp(drag.startLayout.size + change / Math.max(1, 80 * scale) * 100, 60, 160);
                var sizeInput = panel.querySelector("#mbjtSize");
                if (sizeInput) sizeInput.value = String(s.joystickSize);
                panel.querySelector("#mbjtSizeLabel").textContent = Math.round(s.joystickSize) + "%";
            }
            saveSettings();
            session.renderPreview();
        }
        function end(event) {
            if (!session.drag || (event && session.drag.pointerId !== event.pointerId)) return;
            session.drag = null;
        }

        preview.addEventListener("pointerdown", function (event) {
            if (event.target === resizeHandle) return;
            begin(event, "move");
        });
        resizeHandle.addEventListener("pointerdown", function (event) { begin(event, "resize"); });
        window.addEventListener("pointermove", move, { passive: false });
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
        session.cleanupDrag = function () {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", end);
            window.removeEventListener("pointercancel", end);
        };
    }

    function positionPreview(session) {
        if (!session || !session.canvas || !session.preview) return;
        var s = settings();
        var rect = session.canvas.getBoundingClientRect();
        var x = rect.left + rect.width * clamp(s.joystickPositionX == null ? 24 : s.joystickPositionX, 8, 92) / 100;
        var y = rect.top + rect.height * clamp(s.joystickPositionY == null ? 80 : s.joystickPositionY, 8, 92) / 100;
        var radius = 80 * clamp(s.joystickSize == null ? 100 : s.joystickSize, 60, 160) / 100;
        var scaleX = rect.width / 400;
        var scaleY = rect.height / 500;
        session.preview.style.left = x + "px";
        session.preview.style.top = y + "px";
        session.preview.style.width = (radius * 2 * scaleX) + "px";
        session.preview.style.height = (radius * 2 * scaleY) + "px";
        session.preview.style.opacity = String(clamp(s.joystickOpacity || 60, 20, 100) / 100);
        session.preview.style.display = session.editing ? "block" : "none";
        var label = session.panel && session.panel.querySelector("#mbjtSizeLabel");
        if (label) label.textContent = Math.round(s.joystickSize || 100) + "%";
    }

    function startTraining() {
        if (activeSession) return false;
        if (typeof window.startArena !== "function") {
            notify("⚠️ Арена ещё не готова. Перезагрузи игру.", "#ffb58a");
            return false;
        }
        if (window.__mbBossTestMode) {
            notify("Сначала заверши текущий тест босса.", "#ffb58a");
            return false;
        }
        var s = settings();
        if (!s) return false;
        ensurePresets(s);
        var snapshot = takeSnapshot();
        s.arenaControl = "joystick";
        s.mobileControlStyle = "analog";
        s.joystickFixedPosition = true;
        saveSettings();
        window.__mbJoystickTrainingMode = true;
        window.__mbJoystickTrainingEditing = true;
        if (typeof window.refreshJoystickSettings === "function") window.refreshJoystickSettings();

        try {
            window.startArena(50);
        } catch (error) {
            window.__mbJoystickTrainingMode = false;
            window.__mbJoystickTrainingEditing = false;
            restoreSnapshot(snapshot);
            console.error("[Joystick training] Не удалось запустить тренировку:", error);
            notify("⚠️ Не удалось открыть тренировочный бой", "#ffb58a");
            return false;
        }

        var canvas = document.getElementById("arenaCanvas");
        if (!canvas) {
            window.__mbJoystickTrainingMode = false;
            window.__mbJoystickTrainingEditing = false;
            try { if (typeof window.stopArena === "function") window.stopArena(); } catch (e) {}
            restoreSnapshot(snapshot);
            return false;
        }

        activeSession = {
            snapshot: snapshot,
            canvas: canvas,
            panel: null,
            preview: null,
            editing: true,
            drag: null,
            renderPreview: function () { positionPreview(activeSession); },
            readPosition: function () {
                var current = settings();
                return {
                    x: clamp(current.joystickPositionX == null ? 24 : current.joystickPositionX, 8, 92),
                    y: clamp(current.joystickPositionY == null ? 80 : current.joystickPositionY, 8, 92)
                };
            },
            setEditor: function (enabled) {
                activeSession.editing = !!enabled;
                window.__mbJoystickTrainingEditing = !!enabled;
                if (activeSession.preview) activeSession.preview.style.display = enabled ? "block" : "none";
                var toggle = activeSession.panel && activeSession.panel.querySelector("#mbjtTestToggle");
                if (toggle) toggle.textContent = enabled ? "▶ Тестировать движение" : "✋ Править расположение";
                try {
                    var j = window._joystick;
                    if (j) {
                        j.active = false; j.touchId = null;
                        j.vectorX = j.vectorY = j.targetVectorX = j.targetVectorY = 0;
                        if (typeof activeSession.canvas !== "undefined") {
                            j.baseX = activeSession.canvas.width * (Number(settings().joystickPositionX) || 24) / 100;
                            j.baseY = activeSession.canvas.height * (Number(settings().joystickPositionY) || 80) / 100;
                            j.knobX = j.baseX; j.knobY = j.baseY;
                        }
                    }
                } catch (e) {}
                activeSession.renderPreview();
            }
        };
        createTrainingPanel(activeSession);
        bindPreviewDrag(activeSession);
        window.addEventListener("resize", activeSession.renderPreview, { passive: true });
        window.addEventListener("orientationchange", activeSession.renderPreview, { passive: true });
        notify("🕹️ Тренировка открыта. Бессмертный бой, способности работают.", "#8deaff");
        return true;
    }

    function endTraining() {
        if (!activeSession) return false;
        var session = activeSession;
        activeSession = null;
        try { if (session.cleanupDrag) session.cleanupDrag(); } catch (e) {}
        window.removeEventListener("resize", session.renderPreview);
        window.removeEventListener("orientationchange", session.renderPreview);
        if (session.panel) session.panel.remove();
        if (session.preview) session.preview.remove();
        window.__mbJoystickTrainingEditing = false;
        try { if (typeof window.stopArena === "function") window.stopArena(); } catch (e) {}
        window.__mbJoystickTrainingMode = false;

        var s = settings();
        if (s) {
            s.arenaControl = "auto";
            s.mobileControlStyle = "analog";
            s.joystickFixedPosition = true;
            saveSettings();
        }
        restoreSnapshot(session.snapshot);
        try { if (typeof renderSettings === "function") renderSettings(); } catch (e) {}
        try { if (typeof renderSlotsInGame === "function") renderSlotsInGame(); } catch (e) {}
        notify("✅ Тренировка закрыта. Настройки джойстика сохранены.", "#8dffc2");
        return true;
    }

    window.MBStartJoystickTraining = startTraining;
    window.MBEndJoystickTraining = endTraining;
    window.MBRenderJoystickPresets = renderPresetSettings;

    function init() {
        renderPresetSettings();
        var trainingButton = document.getElementById("mbStartJoystickTrainingBtn");
        if (trainingButton) trainingButton.addEventListener("click", startTraining);
        var presetPanel = document.getElementById("mbJoystickPresetSettings");
        if (presetPanel) renderPresetSettings();
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();