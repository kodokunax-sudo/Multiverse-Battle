/* ============================================================
 * ЖИВОЙ КАМЕНЬ: ФИНАЛЬНАЯ ПОГОНЯ
 * Отдельная интерактивная сцена после победы над Камнем / Праймом.
 * Управление: A/D или стрелки в стороны, W/↑ прыжок, S/↓ пригнуться.
 * Если Путеводная Звезда была пощажена, она подхватывает игрока,
 * прикрывает его и включает отдельную музыкальную тему.
 * ============================================================ */
(function () {
    "use strict";

    var active = false;
    var raf = 0;
    var sceneCanvas = null;
    var sceneCtx = null;
    var sceneFrame = 0;
    var runFrames = 840;
    var totalFrames = 960;
    var lane = 1;
    var jumpTimer = 0;
    var slideTimer = 0;
    var spawnTimer = 32;
    var obstacles = [];
    var lastObstacleLane = 1;
    var hits = 0;
    var starAid = false;
    var starGuard = 0;
    var starGuardCooldown = 0;
    var starStrikeFlash = 0;
    var damageFlash = 0;
    var shake = 0;
    var pointerStart = null;
    var audio = null;
    var audioRetryBound = false;
    var onComplete = null;
    var reducedEffects = false;
    var lastStamp = 0;
    var previousTouchAction = "";

    var LANES = [76, 200, 324];

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function hasStarAid() {
        try {
            return window.waystarOwesDebt === true ||
                (typeof slotData !== "undefined" && slotData && slotData.waystarOwesDebt === true);
        } catch (e) {
            return false;
        }
    }

    function stopTheme() {
        if (!audio) return;
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch (e) {}
        audio = null;
    }

    function startTheme() {
        if (!starAid || typeof Audio === "undefined") return;
        try {
            if (typeof stopAllMusic === "function") stopAllMusic();
        } catch (e) {}

        // Старый код погони использует этот файл напрямую. Если файла нет в сборке,
        // переключаемся на подтверждённый звёздный трек из музыкального реестра.
        var sources = ["music/помощь звезды.mp3", "music/Звезда.mp3"];
        var sourceIndex = 0;
        function tryNextSource() {
            if (sourceIndex >= sources.length) {
                audio = null;
                return;
            }
            var candidate = null;
            try {
                candidate = new Audio(sources[sourceIndex++]);
                audio = candidate;
                candidate.volume = 0.82;
                candidate.loop = true;
                candidate.onerror = function () {
                    if (audio === candidate) {
                        audio = null;
                        tryNextSource();
                    }
                };
                var promise = candidate.play();
                if (promise && typeof promise.catch === "function") {
                    promise.catch(function () {
                        if (audioRetryBound) return;
                        audioRetryBound = true;
                        var retry = function () {
                            if (audio) {
                                try {
                                    var p = audio.play();
                                    if (p && typeof p.catch === "function") p.catch(function () {});
                                } catch (e) {}
                            }
                            window.removeEventListener("pointerdown", retry, true);
                            window.removeEventListener("keydown", retry, true);
                            audioRetryBound = false;
                        };
                        window.addEventListener("pointerdown", retry, true);
                        window.addEventListener("keydown", retry, true);
                    });
                }
            } catch (e) {
                if (audio === candidate) audio = null;
                tryNextSource();
            }
        }
        tryNextSource();
    }

    function moveLane(delta) {
        lane = clamp(lane + delta, 0, 2);
    }

    function jump() {
        if (jumpTimer <= 3) jumpTimer = 30;
    }

    function slide() {
        if (slideTimer <= 3) slideTimer = 30;
    }

    function keyDown(ev) {
        if (!active || !ev) return;
        var key = String(ev.key || "").toLowerCase();
        if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s", " "].indexOf(key) < 0) return;
        ev.preventDefault();
        if (ev.repeat) return;
        if (key === "arrowleft" || key === "a") moveLane(-1);
        else if (key === "arrowright" || key === "d") moveLane(1);
        else if (key === "arrowup" || key === "w" || key === " ") jump();
        else if (key === "arrowdown" || key === "s") slide();
    }

    function pointerDown(ev) {
        if (!active || !sceneCanvas) return;
        if (ev && ev.cancelable) ev.preventDefault();
        var rect = sceneCanvas.getBoundingClientRect();
        var x = (ev.clientX - rect.left) * (sceneCanvas.width / Math.max(1, rect.width));
        var y = (ev.clientY - rect.top) * (sceneCanvas.height / Math.max(1, rect.height));
        pointerStart = { x: x, y: y, id: ev.pointerId };

        // Кнопки в нижней полосе остаются удобными на телефонах и планшетах.
        if (y >= 442) {
            if (x < 100) moveLane(-1);
            else if (x < 200) jump();
            else if (x < 300) slide();
            else moveLane(1);
            pointerStart = null;
        }
    }

    function pointerUp(ev) {
        if (!active || !pointerStart) return;
        var rect = sceneCanvas.getBoundingClientRect();
        var x = (ev.clientX - rect.left) * (sceneCanvas.width / Math.max(1, rect.width));
        var y = (ev.clientY - rect.top) * (sceneCanvas.height / Math.max(1, rect.height));
        var dx = x - pointerStart.x;
        var dy = y - pointerStart.y;
        if (Math.abs(dx) > 24 || Math.abs(dy) > 24) {
            if (Math.abs(dx) > Math.abs(dy)) moveLane(dx < 0 ? -1 : 1);
            else if (dy < 0) jump();
            else slide();
        }
        pointerStart = null;
    }

    function bindInput() {
        if (!sceneCanvas) return;
        previousTouchAction = sceneCanvas.style.touchAction || "";
        sceneCanvas.style.touchAction = "none";
        sceneCanvas.addEventListener("pointerdown", pointerDown, { passive: false });
        window.addEventListener("pointerup", pointerUp, { passive: false });
        window.addEventListener("keydown", keyDown, true);
    }

    function unbindInput() {
        if (sceneCanvas) {
            sceneCanvas.removeEventListener("pointerdown", pointerDown);
            sceneCanvas.style.touchAction = previousTouchAction;
        }
        window.removeEventListener("pointerup", pointerUp);
        window.removeEventListener("keydown", keyDown, true);
        pointerStart = null;
    }

    function spawnObstacle() {
        if (obstacles.length >= (starAid ? 3 : 4)) return;
        var nextLane = Math.floor(Math.random() * 3);
        if (nextLane === lastObstacleLane && Math.random() < 0.72) nextLane = (nextLane + 1 + Math.floor(Math.random() * 2)) % 3;
        lastObstacleLane = nextLane;
        obstacles.push({
            lane: nextLane,
            kind: Math.random() < 0.56 ? "rubble" : "overhang",
            y: 112,
            warning: reducedEffects ? 13 : 22,
            speed: (starAid ? 4.0 : 4.25) + Math.min(1.15, sceneFrame / 700),
            spin: Math.random() * Math.PI * 2,
            hit: false,
            passed: false
        });
    }

    function update(step) {
        sceneFrame += step;
        if (jumpTimer > 0) jumpTimer = Math.max(0, jumpTimer - step);
        if (slideTimer > 0) slideTimer = Math.max(0, slideTimer - step);
        if (damageFlash > 0) damageFlash = Math.max(0, damageFlash - step);
        if (shake > 0) shake = Math.max(0, shake - step);
        if (starStrikeFlash > 0) starStrikeFlash = Math.max(0, starStrikeFlash - step);

        if (starAid) {
            if (starGuardCooldown > 0) starGuardCooldown -= step;
            if (starGuard <= 0 && starGuardCooldown <= 0) {
                starGuard = 1;
                starGuardCooldown = 250;
            }
            if (sceneFrame > 75 && Math.floor(sceneFrame / 270) !== Math.floor((sceneFrame - step) / 270)) {
                starStrikeFlash = 22;
            }
        }

        if (sceneFrame < runFrames - 70 && sceneFrame > 55) {
            spawnTimer -= step;
            if (spawnTimer <= 0) {
                spawnObstacle();
                spawnTimer = (starAid ? 54 : 43) + Math.random() * (starAid ? 16 : 13);
            }
        }

        for (var i = obstacles.length - 1; i >= 0; i--) {
            var o = obstacles[i];
            if (!o || typeof o !== "object") {
                obstacles.splice(i, 1);
                continue;
            }
            if (o.warning > 0) {
                o.warning = Math.max(0, o.warning - step);
            } else {
                var oldY = o.y;
                o.y += o.speed * step;
                o.spin += 0.065 * step;
                if (!o.hit && oldY < 410 && o.y >= 410 && o.lane === lane) {
                    var avoided = (o.kind === "rubble" && jumpTimer > 0) ||
                        (o.kind === "overhang" && slideTimer > 0);
                    if (!avoided) {
                        if (starAid && starGuard > 0) {
                            starGuard = 0;
                            starGuardCooldown = 250;
                            starStrikeFlash = 28;
                        } else {
                            hits++;
                            damageFlash = 14;
                            shake = 8;
                        }
                    }
                    o.hit = true;
                }
            }
            if (o.y > 545) obstacles.splice(i, 1);
        }
    }

    function drawStar(c, x, y, radius, rotation, alpha) {
        c.save();
        c.translate(x, y);
        c.rotate(rotation || 0);
        c.globalAlpha = alpha === undefined ? 1 : alpha;
        c.shadowColor = "#9feaff";
        c.shadowBlur = reducedEffects ? 5 : 17;
        c.fillStyle = "#8ee7ff";
        c.strokeStyle = "#efffff";
        c.lineWidth = 2;
        c.beginPath();
        for (var i = 0; i < 10; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 5;
            var r = i % 2 === 0 ? radius : radius * 0.43;
            var px = Math.cos(a) * r;
            var py = Math.sin(a) * r;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.closePath();
        c.fill();
        c.stroke();
        c.shadowBlur = 0;
        c.fillStyle = "rgba(255,255,255,.7)";
        c.beginPath();
        c.arc(-radius * 0.18, -radius * 0.2, Math.max(1.5, radius * 0.12), 0, Math.PI * 2);
        c.fill();
        c.restore();
    }

    function drawHeart(c, x, y, scale, running, stunned) {
        var stride = Math.sin(sceneFrame * 0.46) * (running ? 8 : 2);
        var lift = jumpTimer > 0 ? Math.sin((1 - jumpTimer / 30) * Math.PI) * 25 : 0;
        c.save();
        c.translate(x, y - lift);
        c.lineCap = "round";
        c.lineJoin = "round";
        c.strokeStyle = "#ffd2d2";
        c.lineWidth = 5 * scale;
        c.beginPath();
        c.moveTo(-7 * scale, 13 * scale);
        c.lineTo(-10 * scale + stride * scale, 23 * scale);
        c.moveTo(7 * scale, 13 * scale);
        c.lineTo(10 * scale - stride * scale, 23 * scale);
        c.stroke();
        c.strokeStyle = "#ff9a9a";
        c.lineWidth = 3.5 * scale;
        c.beginPath();
        c.moveTo(-12 * scale, 0);
        c.lineTo(-20 * scale, 8 * scale + stride * 0.18);
        c.moveTo(12 * scale, 0);
        c.lineTo(20 * scale, 8 * scale - stride * 0.18);
        c.stroke();

        c.shadowColor = stunned ? "#ff7e55" : "#ff344f";
        c.shadowBlur = reducedEffects ? 5 : 14;
        c.fillStyle = stunned ? "#ff7755" : "#ff263f";
        c.beginPath();
        c.moveTo(0, 12 * scale);
        c.bezierCurveTo(-30 * scale, -7 * scale, -22 * scale, -25 * scale, -9 * scale, -24 * scale);
        c.bezierCurveTo(-2 * scale, -25 * scale, 0, -19 * scale, 0, -16 * scale);
        c.bezierCurveTo(4 * scale, -26 * scale, 21 * scale, -27 * scale, 27 * scale, -14 * scale);
        c.bezierCurveTo(35 * scale, 1 * scale, 14 * scale, 10 * scale, 0, 12 * scale);
        c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = "rgba(255,255,255,.8)";
        c.lineWidth = 2 * scale;
        c.beginPath();
        c.moveTo(-13 * scale, -14 * scale);
        c.quadraticCurveTo(-9 * scale, -21 * scale, -3 * scale, -19 * scale);
        c.stroke();
        c.restore();
    }

    function drawStone(c, x, y, running, fallen) {
        // Reuse the actual in-game Living Stone renderer so the ending matches
        // the boss the player has just defeated, instead of drawing a substitute.
        try {
            if (typeof drawLivingStoneBoss === "function" &&
                typeof livingStoneBoss !== "undefined" &&
                typeof ctx !== "undefined" && ctx === c) {
                var b = livingStoneBoss;
                var old = {
                    x: b.x, y: b.y, size: b.size, rotation: b.rotation, vx: b.vx,
                    state: typeof livingStoneState !== "undefined" ? livingStoneState : "phase2",
                    finalActive: typeof finalSceneActive !== "undefined" ? finalSceneActive : false,
                    cracks: typeof finalCracksLevel !== "undefined" ? finalCracksLevel : 0,
                    shake: typeof qteBossShake !== "undefined" ? qteBossShake : 0,
                    flash: typeof livingStoneBossFlash !== "undefined" ? livingStoneBossFlash : 0
                };
                b.x = x;
                b.y = y + (running ? Math.sin(sceneFrame * 0.22) * 3 : 0);
                b.size = fallen ? 49 : 52;
                b.rotation = fallen ? -0.16 : Math.sin(sceneFrame * 0.16) * 0.22;
                b.vx = running ? Math.sin(sceneFrame * 0.08) * 1.5 : 0;
                if (typeof livingStoneState !== "undefined") livingStoneState = "phase2";
                if (typeof finalSceneActive !== "undefined") finalSceneActive = false;
                if (typeof finalCracksLevel !== "undefined") finalCracksLevel = 0.82;
                if (typeof qteBossShake !== "undefined") qteBossShake = 0;
                if (typeof livingStoneBossFlash !== "undefined") livingStoneBossFlash = 0;
                try {
                    drawLivingStoneBoss();
                } finally {
                    b.x = old.x; b.y = old.y; b.size = old.size; b.rotation = old.rotation; b.vx = old.vx;
                    if (typeof livingStoneState !== "undefined") livingStoneState = old.state;
                    if (typeof finalSceneActive !== "undefined") finalSceneActive = old.finalActive;
                    if (typeof finalCracksLevel !== "undefined") finalCracksLevel = old.cracks;
                    if (typeof qteBossShake !== "undefined") qteBossShake = old.shake;
                    if (typeof livingStoneBossFlash !== "undefined") livingStoneBossFlash = old.flash;
                }
                return;
            }
        } catch (e) {
            console.warn("[LS ENDING] Fallback renderer used:", e);
        }

        var stride = Math.sin(sceneFrame * 0.32) * 12;
        c.save();
        c.translate(x, y);
        if (fallen) c.rotate(-0.56);
        else c.rotate(Math.sin(sceneFrame * 0.05) * 0.035);
        c.lineCap = "round";
        c.lineJoin = "round";

        c.strokeStyle = "#594638";
        c.lineWidth = 13;
        c.beginPath();
        c.moveTo(-13, 23);
        c.lineTo(-19 + (running ? stride : 0), 45);
        c.moveTo(13, 23);
        c.lineTo(19 - (running ? stride : 0), 45);
        c.stroke();
        c.strokeStyle = "#a58a69";
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(-19 + (running ? stride : 0), 44);
        c.lineTo(-28 + (running ? stride : 0), 48);
        c.moveTo(19 - (running ? stride : 0), 44);
        c.lineTo(28 - (running ? stride : 0), 48);
        c.stroke();

        c.strokeStyle = "#79634c";
        c.lineWidth = 10;
        c.beginPath();
        c.moveTo(-25, -2);
        c.lineTo(-37 - stride * 0.35, 14);
        c.moveTo(25, -2);
        c.lineTo(37 + stride * 0.35, 14);
        c.stroke();

        c.shadowColor = "#ff6847";
        c.shadowBlur = reducedEffects ? 4 : 12;
        c.fillStyle = "#78634d";
        c.strokeStyle = "#c3a47d";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-29, 17);
        c.lineTo(-33, -11);
        c.lineTo(-21, -34);
        c.lineTo(-5, -43);
        c.lineTo(18, -37);
        c.lineTo(32, -14);
        c.lineTo(27, 15);
        c.lineTo(9, 31);
        c.lineTo(-17, 29);
        c.closePath();
        c.fill();
        c.stroke();
        c.shadowBlur = 0;

        c.fillStyle = "#372b25";
        c.beginPath();
        c.ellipse(-10, -9, 5, 7, -0.15, 0, Math.PI * 2);
        c.ellipse(12, -9, 5, 7, 0.15, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ff6b4f";
        c.shadowColor = "#ff3d2f";
        c.shadowBlur = 8;
        c.beginPath();
        c.arc(-10, -9, 2.1, 0, Math.PI * 2);
        c.arc(12, -9, 2.1, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = "#3e3028";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-7, 8);
        c.quadraticCurveTo(2, 15, 11, 7);
        c.stroke();
        c.restore();
    }

    function drawBackground(c) {
        var sky = c.createLinearGradient(0, 0, 0, 500);
        sky.addColorStop(0, "#100d16");
        sky.addColorStop(0.48, "#3b211f");
        sky.addColorStop(1, "#130f12");
        c.fillStyle = sky;
        c.fillRect(0, 0, 400, 500);

        // Разрушающийся тоннель и пролетающие обломки подчёркивают скорость погони.
        c.fillStyle = "rgba(8,7,12,.58)";
        c.beginPath();
        c.moveTo(0, 0); c.lineTo(112, 0); c.lineTo(166, 190); c.lineTo(0, 250); c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(400, 0); c.lineTo(288, 0); c.lineTo(235, 190); c.lineTo(400, 250); c.closePath(); c.fill();

        var horizon = 170;
        var road = c.createLinearGradient(0, horizon, 0, 500);
        road.addColorStop(0, "#604039");
        road.addColorStop(1, "#171316");
        c.fillStyle = road;
        c.beginPath();
        c.moveTo(168, horizon); c.lineTo(232, horizon); c.lineTo(400, 500); c.lineTo(0, 500); c.closePath(); c.fill();

        c.strokeStyle = "rgba(255,202,155,.28)";
        c.lineWidth = 2;
        for (var j = 0; j < 4; j++) {
            var offset = (sceneFrame * (4 + j * 0.7)) % 90;
            c.beginPath();
            c.moveTo(200 - (j + 1) * 13, horizon + 35 + offset);
            c.lineTo(200 - (j + 1) * 51, horizon + 125 + offset * 1.65);
            c.moveTo(200 + (j + 1) * 13, horizon + 35 + offset);
            c.lineTo(200 + (j + 1) * 51, horizon + 125 + offset * 1.65);
            c.stroke();
        }

        for (var i = 0; i < 14; i++) {
            var sx = (i * 83 + sceneFrame * (i % 3 + 2.5)) % 430 - 15;
            var sy = (i * 57 + sceneFrame * (3 + i % 4)) % 470;
            c.strokeStyle = i % 2 ? "rgba(255,177,129,.19)" : "rgba(255,255,255,.13)";
            c.lineWidth = i % 3 === 0 ? 2 : 1;
            c.beginPath();
            c.moveTo(sx, sy);
            c.lineTo(sx - 10, sy + 17);
            c.stroke();
        }

        c.fillStyle = "rgba(0,0,0,.16)";
        c.fillRect(0, 0, 400, 500);
        if (damageFlash > 0) {
            c.fillStyle = "rgba(255,65,48," + (damageFlash / 42) + ")";
            c.fillRect(0, 0, 400, 500);
        }
    }

    function drawObstacle(c, o) {
        var x = LANES[o.lane];
        if (o.warning > 0) {
            c.save();
            c.globalAlpha = 0.35 + Math.abs(Math.sin(sceneFrame * 0.17)) * 0.5;
            c.strokeStyle = o.kind === "rubble" ? "#ffe08a" : "#ff9c83";
            c.lineWidth = 2;
            c.setLineDash([6, 6]);
            c.beginPath();
            c.moveTo(x, 198);
            c.lineTo(x, 438);
            c.stroke();
            c.setLineDash([]);
            c.fillStyle = "#fff2c5";
            c.font = "bold 10px Arial,sans-serif";
            c.textAlign = "center";
            c.fillText(o.kind === "rubble" ? "ПРЫЖОК / СМЕНА ПОЛОСЫ" : "ПРИГНИСЬ / СМЕНИ ПОЛОСУ", x, 191);
            c.restore();
            return;
        }

        c.save();
        c.translate(x, o.y);
        if (o.kind === "rubble") {
            var size = 14 + Math.max(0, o.y - 150) * 0.045;
            c.rotate(o.spin);
            c.fillStyle = "#5c4b42";
            c.strokeStyle = "#c5a98e";
            c.lineWidth = 2.5;
            c.shadowColor = "#ff9d70";
            c.shadowBlur = reducedEffects ? 2 : 8;
            c.beginPath();
            c.moveTo(-size, -size * 0.3);
            c.lineTo(-size * 0.35, -size);
            c.lineTo(size * 0.5, -size * 0.8);
            c.lineTo(size, size * 0.05);
            c.lineTo(size * 0.3, size);
            c.lineTo(-size * 0.8, size * 0.7);
            c.closePath();
            c.fill();
            c.stroke();
        } else {
            var width = 35 + Math.max(0, o.y - 150) * 0.06;
            c.fillStyle = "#633c38";
            c.strokeStyle = "#ffb096";
            c.lineWidth = 3;
            c.shadowColor = "#ff705f";
            c.shadowBlur = reducedEffects ? 2 : 8;
            c.beginPath();
            c.moveTo(-width, -14);
            c.lineTo(-width * 0.72, -23);
            c.lineTo(width * 0.72, -23);
            c.lineTo(width, -14);
            c.lineTo(width, 3);
            c.lineTo(-width, 3);
            c.closePath();
            c.fill();
            c.stroke();
        }
        c.restore();
    }

    function drawControls(c) {
        var labels = [
            { x: 50, text: "◀", hint: "ВЛЕВО" },
            { x: 150, text: "↑", hint: "ПРЫЖОК" },
            { x: 250, text: "↓", hint: "ПРИГНУТЬСЯ" },
            { x: 350, text: "▶", hint: "ВПРАВО" }
        ];
        c.save();
        for (var i = 0; i < labels.length; i++) {
            var b = labels[i];
            c.fillStyle = "rgba(5,7,12,.76)";
            c.strokeStyle = "rgba(255,255,255,.38)";
            c.lineWidth = 1.5;
            c.beginPath();
            c.roundRect ? c.roundRect(b.x - 43, 446, 86, 47, 9) : c.rect(b.x - 43, 446, 86, 47);
            c.fill();
            c.stroke();
            c.fillStyle = "#fff";
            c.font = "bold 18px Arial,sans-serif";
            c.textAlign = "center";
            c.fillText(b.text, b.x, 467);
            c.fillStyle = "rgba(255,255,255,.78)";
            c.font = "bold 7px Arial,sans-serif";
            c.fillText(b.hint, b.x, 485);
        }
        c.restore();
    }

    function drawHUD(c) {
        var progress = clamp(sceneFrame / runFrames, 0, 1);
        c.save();
        c.fillStyle = "rgba(0,0,0,.7)";
        c.fillRect(16, 13, 368, 58);
        c.strokeStyle = starAid ? "rgba(145,225,255,.85)" : "rgba(255,151,119,.8)";
        c.lineWidth = 1.5;
        c.strokeRect(16, 13, 368, 58);
        c.textAlign = "center";
        c.fillStyle = starAid ? "#d4f5ff" : "#ffd5c8";
        c.font = "900 15px Arial,sans-serif";
        c.fillText(starAid ? "ПОГОНЯ СО ЗВЕЗДОЙ" : "ПОГОНЯ ЗА ЖИВЫМ КАМНЕМ", 200, 34);
        c.fillStyle = "#e6e0dc";
        c.font = "bold 10px Arial,sans-serif";
        c.fillText("Дистанция: " + Math.floor(progress * 100) + "%     Попадания: " + hits, 200, 52);
        c.fillStyle = "rgba(255,255,255,.17)";
        c.fillRect(34, 60, 332, 4);
        c.fillStyle = starAid ? "#9deaff" : "#ff9279";
        c.fillRect(34, 60, 332 * progress, 4);
        if (starAid) {
            c.fillStyle = starGuard > 0 ? "#aeeaff" : "#c5b6a4";
            c.font = "bold 9px Arial,sans-serif";
            c.fillText(starGuard > 0 ? "ЗВЕЗДА ГОТОВА ПРИНЯТЬ УДАР" : "ЗВЕЗДА ВОССТАНАВЛИВАЕТ СИЛЫ", 200, 85);
        }
        c.restore();
    }

    function draw() {
        if (!sceneCtx || !sceneCanvas) return;
        var c = sceneCtx;
        c.save();
        if (shake > 0) c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        drawBackground(c);

        var catching = sceneFrame >= runFrames;
        var bossX = catching ? 200 : 200 + Math.sin(sceneFrame * 0.035) * 33;
        var bossY = catching ? 282 : 127 + Math.sin(sceneFrame * 0.12) * 5;
        drawStone(c, bossX, bossY, !catching, catching && sceneFrame > runFrames + 36);

        for (var i = 0; i < obstacles.length; i++) drawObstacle(c, obstacles[i]);

        var playerX = catching ? 200 : LANES[lane];
        var playerY = catching ? 375 : 411;
        if (starAid) {
            var starY = playerY + 18;
            drawStar(c, playerX, starY, 27, sceneFrame * 0.035, 0.98);
            c.strokeStyle = "rgba(177,241,255,.5)";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(playerX - 22, starY + 13);
            c.lineTo(playerX - 35, starY + 30 + Math.sin(sceneFrame * 0.2) * 4);
            c.moveTo(playerX + 22, starY + 13);
            c.lineTo(playerX + 35, starY + 30 + Math.sin(sceneFrame * 0.2 + 1) * 4);
            c.stroke();
            if (starGuard > 0) {
                c.strokeStyle = "rgba(174,234,255,.78)";
                c.lineWidth = 2;
                c.beginPath();
                c.arc(playerX, starY, 39 + Math.sin(sceneFrame * 0.1) * 3, 0, Math.PI * 2);
                c.stroke();
            }
            drawStar(c, playerX + 39, playerY - 35 + Math.sin(sceneFrame * 0.09) * 5, 10, -sceneFrame * 0.07, 0.9);
            if (starStrikeFlash > 0) {
                c.save();
                c.strokeStyle = "rgba(175,239,255," + Math.min(1, starStrikeFlash / 10) + ")";
                c.lineWidth = 4;
                c.shadowColor = "#9deaff";
                c.shadowBlur = 14;
                c.beginPath();
                c.moveTo(playerX + 30, playerY - 30);
                c.lineTo(bossX, bossY + 6);
                c.stroke();
                c.restore();
            }
        }
        if (!catching || sceneFrame < runFrames + 70) drawHeart(c, playerX, playerY, 0.88, !catching, damageFlash > 0);

        if (sceneFrame < 95) {
            c.fillStyle = "rgba(0,0,0,.68)";
            c.fillRect(34, 104, 332, 42);
            c.textAlign = "center";
            c.fillStyle = starAid ? "#bdecff" : "#ffd1c3";
            c.font = "bold 13px Arial,sans-serif";
            c.fillText(starAid ? "ПУТЕВОДНАЯ ЗВЕЗДА: ДЕРЖИСЬ! Я ПОМОГУ!" : "ОН НЕ СОБИРАЕТСЯ СДАВАТЬСЯ. ДОГОНИ ЕГО!", 200, 130);
        } else if (catching) {
            c.fillStyle = "rgba(0,0,0,.76)";
            c.fillRect(42, 170, 316, 55);
            c.textAlign = "center";
            c.fillStyle = starAid ? "#d5f6ff" : "#ffd9cb";
            c.font = "900 18px Arial,sans-serif";
            c.fillText(starAid ? "ЗВЕЗДА: ТЕПЕРЬ ОН НЕ УЙДЁТ!" : "ТЫ ДОГНАЛ ЕГО!", 200, 194);
            c.fillStyle = "#fff";
            c.font = "bold 12px Arial,sans-serif";
            c.fillText("ЖИВОЙ КАМЕНЬ: ...НЕВОЗМОЖНО...", 200, 213);
        }

        drawHUD(c);
        drawControls(c);
        c.restore();
    }

    function finish() {
        if (!active) return;
        active = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        unbindInput();
        stopTheme();
        var overlay = document.getElementById("arenaOverlay");
        if (overlay) overlay.style.display = "none";
        var callback = onComplete;
        onComplete = null;
        if (typeof startBattleMusic === "function") {
            try { startBattleMusic(); } catch (e) {}
        }
        if (typeof callback === "function") {
            try { callback(); } catch (e) { console.error("[LS ENDING] Ошибка завершения сцены:", e); }
        }
    }

    function loop(stamp) {
        if (!active) return;
        if (!lastStamp) lastStamp = stamp;
        var step = clamp((stamp - lastStamp) / (1000 / 60), 0.35, 2.5);
        lastStamp = stamp;
        update(step);
        draw();
        if (sceneFrame >= totalFrames) {
            finish();
            return;
        }
        raf = requestAnimationFrame(loop);
    }

    function start(options) {
        if (active) return true;
        options = options || {};
        starAid = hasStarAid();
        onComplete = typeof options.onComplete === "function" ? options.onComplete : null;
        runFrames = starAid ? 720 : 840;
        totalFrames = runFrames + 120;
        sceneFrame = 0;
        lane = 1;
        jumpTimer = 0;
        slideTimer = 0;
        spawnTimer = 26;
        obstacles = [];
        lastObstacleLane = 1;
        hits = 0;
        starGuard = starAid ? 1 : 0;
        starGuardCooldown = 250;
        starStrikeFlash = 0;
        damageFlash = 0;
        shake = 0;
        lastStamp = 0;
        reducedEffects = !!(window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects());

        // Сначала корректно закрываем старую арену, затем забираем её canvas под финал.
        try {
            if (typeof livingStoneActive !== "undefined" && livingStoneActive &&
                typeof stopLivingStoneFight === "function") {
                stopLivingStoneFight();
            }
        } catch (e) {
            console.warn("[LS ENDING] Не удалось штатно остановить арену:", e);
        }

        sceneCanvas = typeof canvas !== "undefined" && canvas ? canvas : document.querySelector("#arenaCanvas, canvas");
        if (!sceneCanvas || typeof sceneCanvas.getContext !== "function") {
            sceneCanvas = null;
            var fallback = onComplete;
            onComplete = null;
            if (typeof fallback === "function") fallback();
            return true;
        }
        sceneCtx = sceneCanvas.getContext("2d");
        if (!sceneCtx) {
            sceneCanvas = null;
            var fallback2 = onComplete;
            onComplete = null;
            if (typeof fallback2 === "function") fallback2();
            return true;
        }
        sceneCanvas.width = 400;
        sceneCanvas.height = 500;

        var overlay = document.getElementById("arenaOverlay");
        if (overlay) {
            overlay.classList.remove("living-stone-super-arena");
            overlay.classList.remove("anti-spiral-arena");
            overlay.style.display = "flex";
        }
        var nameEl = document.getElementById("arenaBossName");
        if (nameEl) nameEl.textContent = starAid ? "🌟 ПОСЛЕДНИЙ РЫВОК СО ЗВЕЗДОЙ" : "🪨 ПОСЛЕДНЯЯ ПОГОНЯ";
        var hpEl = document.getElementById("arenaHP");
        if (hpEl) hpEl.textContent = "ФИНАЛ";
        var timerEl = document.getElementById("arenaTimer");
        if (timerEl) timerEl.textContent = "∞";

        active = true;
        bindInput();
        if (starAid) startTheme();
        raf = requestAnimationFrame(loop);
        return true;
    }

    window.MBStartLivingStoneEnding = start;
    window.MBIsLivingStoneEndingActive = function () { return active; };
})();
