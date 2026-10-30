/* Living Stone chase: Subway-Surfers-style 3-lane endless runner, 40 seconds. */
(function () {
    "use strict";

    var active = false, superMode = false, startedAt = 0, lastAt = 0, elapsed = 0;
    var lane = 1, laneVisual = 1, jumpLeft = 0, slideLeft = 0;
    var obstacles = [], coins = [], particles = [];
    var spawnClock = 0, trackOffset = 0, distance = 0, coinCount = 0;
    var starAid = false, starGuard = false, nextGuard = 0, nextStrike = 0;
    var chaseLives = 3, chaseFailed = false, chaseFailTimer = 0;
    var starFlash = 0, damageFlash = 0, callback = null, music = null;
    var musicKeepAlive = false;
    var retryBound = false, reduced = false, lastHud = -1;
    var pointerStart = null, oldTouchAction = "";
    var introElapsed = 0, introDuration = 0, introFinished = false;
    var DURATION = 116000;
    var LANE_COUNT = 3;

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function clock() { return typeof performance !== "undefined" ? performance.now() : Date.now(); }
    function debt() {
        try {
            var savedValue = (typeof slotData !== "undefined" && slotData) ? slotData.waystarOwesDebt : false;
            return window.waystarOwesDebt === true || savedValue === true || savedValue === 1 || savedValue === "true";
        } catch (e) { return false; }
    }
    function musicAllowed() {
        // The Waystar rescue theme is part of this story sequence. It plays even
        // when ordinary background music defaults to muted; the music toggle can still mute it.
        return window.__mbChaseMusicMuted !== true;
    }
    function message(txt, color) {
        if (typeof spawnLivingStoneText === "function") spawnLivingStoneText(200, 300, txt, color, 100);
    }
    function removeMusicRetry() {
        if (!retryBound) return;
        window.removeEventListener("pointerdown", retryMusic, true);
        window.removeEventListener("keydown", retryMusic, true);
        window.removeEventListener("touchstart", retryMusic, true);
        retryBound = false;
    }
    function retryMusic() {
        if ((!active && !musicKeepAlive) || !music || !musicAllowed()) return;
        try {
            var p = music.play();
            if (p && p.then) p.then(removeMusicRetry).catch(function () {});
            else removeMusicRetry();
        } catch (e) {}
    }
    function stopMusic(preserveSession) {
        removeMusicRetry();
        musicKeepAlive = preserveSession === true;
        window.__mbLivingStoneChaseMusicPersistent = preserveSession === true;
        if (!music) return;
        try { music.pause(); music.currentTime = 0; music.removeAttribute("src"); music.load(); } catch (e) {}
        music = null;
    }
    function startMusic() {
        var preserveSession = window.__mbLivingStoneChaseMusicPersistent === true;
        stopMusic(preserveSession);
        if (!musicAllowed()) return;
        try {
            if (typeof stopAllMusic === "function") stopAllMusic();
            music = new Audio("music/помощь звезды.mp3");
            music.preload = "auto";
            music.loop = true;
            music.volume = 0.78;
            music.playsInline = true;
            music.onerror = function () {
                console.error("[LS CHASE] Не удалось загрузить music/помощь звезды.mp3");
            };
            var p = music.play();
            if (p && p.catch) {
                p.catch(function () {
                    if ((!active && !musicKeepAlive) || retryBound) return;
                    retryBound = true;
                    window.addEventListener("pointerdown", retryMusic, true);
                    window.addEventListener("keydown", retryMusic, true);
                    window.addEventListener("touchstart", retryMusic, { capture: true, passive: true });
                });
            }
        } catch (e) {
            console.error("[LS CHASE] Ошибка запуска музыки:", e);
            music = null;
        }
    }

    function laneX(value, depth) {
        return 200 + (value - 1) * (24 + depth * 112);
    }
    function depthY(depth) {
        return 112 + Math.pow(clamp(depth, 0, 1.08), 1.68) * 375;
    }
    function resetArrays() {
        obstacles.length = 0;
        coins.length = 0;
        particles.length = 0;
    }

    function bindControls() {
        window.addEventListener("keydown", onKeyDown, true);
        if (canvas && canvas.addEventListener) {
            oldTouchAction = canvas.style.touchAction || "";
            canvas.style.touchAction = "none";
            canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
            canvas.addEventListener("pointerup", onPointerUp, { passive: false });
            canvas.addEventListener("pointercancel", onPointerCancel, { passive: false });
        }
    }
    function unbindControls() {
        window.removeEventListener("keydown", onKeyDown, true);
        if (canvas && canvas.removeEventListener) {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointercancel", onPointerCancel);
            canvas.style.touchAction = oldTouchAction;
        }
        pointerStart = null;
    }
    function onKeyDown(ev) {
        if (!active || !introFinished || !ev) return;
        var key = String(ev.key || "").toLowerCase();
        if (key === "arrowleft" || key === "a") {
            ev.preventDefault(); moveLane(-1);
        } else if (key === "arrowright" || key === "d") {
            ev.preventDefault(); moveLane(1);
        } else if (key === "arrowup" || key === "w" || key === " " || key === "spacebar") {
            ev.preventDefault(); if (!ev.repeat) jump();
        } else if (key === "arrowdown" || key === "s") {
            ev.preventDefault(); if (!ev.repeat) slide();
        }
    }
    function onPointerDown(ev) {
        if (!active || !introFinished || !ev) return;
        if (ev.pointerType === "touch" || ev.pointerType === "pen") {
            pointerStart = { x: ev.clientX, y: ev.clientY, id: ev.pointerId };
            if (ev.cancelable) ev.preventDefault();
        }
    }
    function onPointerUp(ev) {
        if (!active || !introFinished || !pointerStart || !ev || ev.pointerId !== pointerStart.id) return;
        var dx = ev.clientX - pointerStart.x, dy = ev.clientY - pointerStart.y;
        pointerStart = null;
        if (ev.cancelable) ev.preventDefault();
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
        if (Math.abs(dx) > Math.abs(dy)) moveLane(dx < 0 ? -1 : 1);
        else if (dy < 0) jump();
        else slide();
    }
    function onPointerCancel() { pointerStart = null; }

    function moveLane(dir) {
        lane = clamp(lane + dir, 0, LANE_COUNT - 1);
    }
    function jump() {
        if (jumpLeft <= 0 && slideLeft <= 0) jumpLeft = 0.78;
    }
    function slide() {
        if (slideLeft <= 0 && jumpLeft <= 0.08) slideLeft = 0.68;
    }

    function addObstacle(whichLane, type, z) {
        obstacles.push({
            lane: whichLane, type: type, z: z || 0,
            resolved: false, hit: false, phase: Math.random() * Math.PI * 2
        });
    }
    function spawnPattern() {
        var firstLane = Math.floor(Math.random() * 3);
        var types = ["train", "barrier", "beam", "crate", "gap"];
        var pick = types[Math.floor(Math.random() * types.length)];
        addObstacle(firstLane, pick, 0);

        // Two blocked lanes occasionally create a quick lane-switch challenge.
        if (Math.random() < 0.29) {
            var secondLane = (firstLane + 1 + Math.floor(Math.random() * 2)) % 3;
            var secondTypes = ["train", "crate", "barrier"];
            addObstacle(secondLane, secondTypes[Math.floor(Math.random() * secondTypes.length)], 0.035);
        }

        // A coin trail rewards taking the open line through the obstacle pattern.
        var openLanes = [0, 1, 2].filter(function (v) {
            return !obstacles.some(function (o) { return o.z < 0.12 && o.lane === v; });
        });
        if (openLanes.length && Math.random() < 0.82) {
            var coinLane = openLanes[Math.floor(Math.random() * openLanes.length)];
            for (var i = 0; i < 5; i++) {
                coins.push({ lane: coinLane, z: -0.22 - i * 0.105, spin: Math.random() * 6, collected: false });
            }
        }
    }
    function damageRunner(x, y) {
        if (!active || chaseFailed) return;
        chaseLives = Math.max(0, chaseLives - 1);
        damageFlash = 24;
        if (starAid && starGuard) {
            starGuard = false;
            starFlash = 34;
            if (typeof spawnLivingStoneParticles === "function") {
                spawnLivingStoneParticles(livingStonePlayer.x, livingStonePlayer.y, 24, "#9deaff", 5);
            }
            message("ЗВЕЗДА ПРИКРЫЛА ТЕБЯ! ОСТАЛОСЬ ЖИЗНЕЙ: " + chaseLives, "#aeeaff");
            if (typeof playArenaSound === "function") playArenaSound(980, "sine", 0.18, 0.11);
        } else {
            if (typeof spawnLivingStoneParticles === "function") {
                spawnLivingStoneParticles(x, y, 12, "#ff734f", 4);
            }
            message("СТОЛКНОВЕНИЕ! ОСТАЛОСЬ ЖИЗНЕЙ: " + chaseLives, "#ff967d");
            if (typeof playArenaSound === "function") playArenaSound(110, "sawtooth", 0.22, 0.1);
        }
        if (chaseLives <= 0) {
            chaseFailed = true;
            chaseFailTimer = 0.72;
            message("ТРЕТЬЕ ПОПАДАНИЕ! ПОГОНЯ ПРОВАЛЕНА!", "#ff514b");
        }
    }

    function failChase() {
        if (!active) return;
        finish(false);
    }
    function update(now) {
        if (!active) return;
        if (!livingStoneActive || livingStoneState !== "chase") { stop(); return; }
        now = Number(now) || clock();
        var dt = clamp((now - lastAt) / 1000, 0.001, 0.05);
        lastAt = now;
        if (!introFinished) {
            introElapsed = Math.min(introDuration, introElapsed + dt * 1000);
            livingStonePlayer.x = 200;
            livingStonePlayer.y = 422;
            livingStoneBoss.x = 200 + Math.sin(introElapsed / 210) * (starAid ? 7 : 12);
            livingStoneBoss.y = 145 - easeOut(introElapsed / 1550) * 35 + Math.sin(introElapsed / 90) * 2;
            livingStoneBoss.rotation += dt * 1.2;
            livingStoneBoss.size = 34 + Math.min(5, introElapsed / 900);
            if (introElapsed >= introDuration) {
                introFinished = true;
                startedAt = now;
                lastAt = now;
                elapsed = 0;
                livingStonePlayer.x = laneX(1, 0.92);
                livingStonePlayer.y = 422;
                livingStoneBoss.x = 200;
                livingStoneBoss.y = 108;
                livingStoneBoss.vx = starAid ? -1.25 : 1.15;
                message(starAid ? "ЗВЕЗДА: ДЕРЖИСЬ КРЕПЧЕ!" : "КАМЕНЬ: ПОКА-А-А!", starAid ? "#bcefff" : "#ff9a72");
            }
            return;
        }
        elapsed = clamp(now - startedAt, 0, DURATION);
        if (chaseFailed) {
            chaseFailTimer -= dt;
            if (chaseFailTimer <= 0) failChase();
            return;
        }
        var difficulty = elapsed / DURATION;
        var speed = starAid ? 0.31 + difficulty * 0.12 : 0.38 + difficulty * 0.16;
        distance += speed * dt;
        trackOffset = (trackOffset + dt * (0.55 + difficulty * 0.38)) % 1;

        laneVisual += (lane - laneVisual) * Math.min(1, dt * 13);
        if (jumpLeft > 0) jumpLeft = Math.max(0, jumpLeft - dt);
        if (slideLeft > 0) slideLeft = Math.max(0, slideLeft - dt);
        var jumpProgress = jumpLeft > 0 ? 1 - jumpLeft / 0.78 : 1;
        var jumpHeight = jumpLeft > 0 ? Math.sin(jumpProgress * Math.PI) * 78 : 0;
        livingStonePlayer.x = laneX(laneVisual, 0.92);
        livingStonePlayer.y = 422 - jumpHeight - (slideLeft > 0 ? 2 : Math.abs(Math.sin(elapsed * 0.023)) * 2.2);

        if (elapsed >= 1900) {
            spawnClock += dt;
            var spawnInterval = starAid ? 1.34 - difficulty * 0.18 : 1.02 - difficulty * 0.12;
            if (spawnClock >= spawnInterval) {
                spawnClock -= spawnInterval;
                spawnPattern();
            }
        } else {
            spawnClock = 0;
        }

        for (var i = obstacles.length - 1; i >= 0; i--) {
            var ob = obstacles[i];
            ob.z += speed * dt;
            if (!ob.resolved && ob.z >= 0.88 && ob.z <= 0.99) {
                var sameLane = Math.abs(laneVisual - ob.lane) < 0.48;
                if (sameLane) {
                    var cleared = (ob.type === "barrier" || ob.type === "gap" || ob.type === "crate") ?
                        jumpLeft > 0.10 : (ob.type === "beam" ? slideLeft > 0.10 : false);
                    if (!cleared) {
                        ob.hit = true;
                        damageRunner(laneX(ob.lane, 0.96), 416);
                    }
                }
                ob.resolved = true;
            }
            if (ob.z > 1.13) obstacles.splice(i, 1);
        }
        for (var ci = coins.length - 1; ci >= 0; ci--) {
            var coin = coins[ci];
            coin.z += speed * dt;
            coin.spin += dt * 8;
            if (!coin.collected && coin.z >= 0.88 && coin.z <= 1.02 &&
                Math.abs(laneVisual - coin.lane) < 0.48) {
                coin.collected = true;
                coinCount++;
                if (typeof playArenaSound === "function") playArenaSound(1250, "sine", 0.07, 0.045);
                if (typeof spawnLivingStoneParticles === "function") {
                    spawnLivingStoneParticles(livingStonePlayer.x, livingStonePlayer.y - 20, 5, "#ffdc76", 2);
                }
            }
            if (coin.z > 1.13 || coin.collected) coins.splice(ci, 1);
        }

        // The Living Stone stays on the same route and visibly gains on the runner.
        var fleeProgress = clamp(elapsed / 1550, 0, 1);
        fleeProgress = fleeProgress * fleeProgress * (3 - 2 * fleeProgress);
        livingStoneBoss.x = 200 + Math.sin(elapsed * 0.0017) * 23;
        livingStoneBoss.y = 160 - fleeProgress * 42 + Math.sin(elapsed * 0.0031) * 7;
        livingStoneBoss.size = 33 + Math.min(10, difficulty * 10);
        livingStoneBoss.rotation += dt * (0.55 + difficulty);
        if (superMode) window.__mbLS2PhaseFrames = elapsed / (1000 / 60);
        if (starAid && elapsed >= nextStrike) {
            nextStrike += 7600;
            starFlash = 28;
            if (typeof spawnLivingStoneParticles === "function") {
                spawnLivingStoneParticles(livingStoneBoss.x, livingStoneBoss.y + 15, 15, "#9deaff", 4);
            }
            if (typeof playArenaSound === "function") playArenaSound(1080, "sine", 0.18, 0.08);
        }
        if (starFlash > 0) starFlash = Math.max(0, starFlash - dt * 60);
        if (damageFlash > 0) damageFlash = Math.max(0, damageFlash - dt * 60);

        var remain = Math.max(0, Math.ceil((DURATION - elapsed) / 1000));
        if (remain !== lastHud) {
            lastHud = remain;
            var timer = document.getElementById("arenaTimer");
            if (timer) timer.textContent = "00:" + String(remain).padStart(2, "0");
        }
        if (elapsed >= DURATION) finish();
    }

    function polygon(c, pts, fill, stroke, width) {
        c.beginPath();
        c.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.closePath();
        if (fill) { c.fillStyle = fill; c.fill(); }
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = width || 1; c.stroke(); }
    }
    function drawTunnel(c, now) {
        c.fillStyle = "#101923";
        c.fillRect(0, 0, 400, 500);
        var sky = c.createLinearGradient(0, 0, 0, 250);
        sky.addColorStop(0, "#101a26"); sky.addColorStop(0.58, "#28313a"); sky.addColorStop(1, "#4b3c32");
        c.fillStyle = sky; c.fillRect(0, 0, 400, 250);

        // Tunnel walls and repeated lamps create a fast-moving subway corridor.
        polygon(c, [[0, 82], [163, 112], [28, 500], [0, 500]], "#252b32", "#62605b", 2);
        polygon(c, [[400, 82], [237, 112], [372, 500], [400, 500]], "#252b32", "#62605b", 2);
        polygon(c, [[0, 0], [400, 0], [237, 112], [163, 112]], "#18212a", "#48515a", 1);
        for (var i = 0; i < 5; i++) {
            var z = (i * 0.24 + trackOffset * 0.78) % 1;
            var y = 35 + Math.pow(z, 1.55) * 160;
            var w = 8 + z * 34;
            var xLeft = 200 - (48 + z * 125), xRight = 200 + (48 + z * 125);
            c.fillStyle = "rgba(255,196,111," + (0.16 + z * 0.34) + ")";
            c.fillRect(xLeft - w / 2, y, w, 3 + z * 5);
            c.fillRect(xRight - w / 2, y, w, 3 + z * 5);
            c.strokeStyle = "rgba(130,145,154," + (0.12 + z * 0.22) + ")";
            c.lineWidth = 1 + z * 2;
            c.beginPath(); c.moveTo(200 - (58 + z * 140), y + 10);
            c.lineTo(200 + (58 + z * 140), y + 10); c.stroke();
        }

        // Track bed in strong perspective.
        polygon(c, [[184, 112], [216, 112], [398, 500], [2, 500]], "#313238", "#8c7560", 2);
        for (var divider = 0; divider < 2; divider++) {
            var topX = 200 + (divider === 0 ? -1 : 1) * (12 + 8);
            var bottomX = 200 + (divider === 0 ? -1 : 1) * 65;
            c.strokeStyle = "rgba(178,164,145,.38)";
            c.lineWidth = 2;
            c.beginPath(); c.moveTo(topX, 112); c.lineTo(bottomX, 500); c.stroke();
        }
        for (var railLane = 0; railLane < 3; railLane++) {
            var topCenter = 200 + (railLane - 1) * 8;
            var bottomCenter = 200 + (railLane - 1) * 112;
            for (var side = -1; side <= 1; side += 2) {
                c.strokeStyle = side < 0 ? "#9e9c96" : "#625e59";
                c.lineWidth = 2.2;
                c.beginPath();
                c.moveTo(topCenter + side * 4, 112);
                c.lineTo(bottomCenter + side * 19, 500);
                c.stroke();
            }
        }
        for (var sleeper = 0; sleeper < 12; sleeper++) {
            var z2 = (sleeper / 12 + trackOffset) % 1;
            var y2 = 112 + Math.pow(z2, 1.68) * 388;
            var half = 16 + z2 * 178;
            c.strokeStyle = "rgba(168,142,112," + (0.25 + z2 * 0.45) + ")";
            c.lineWidth = 1 + z2 * 6;
            c.beginPath(); c.moveTo(200 - half, y2); c.lineTo(200 + half, y2); c.stroke();
        }
        c.strokeStyle = "rgba(255,220,166,.13)";
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(200, 112); c.lineTo(200, 500); c.stroke();
    }

    function drawCoin(c, item) {
        var z = clamp(item.z, 0, 1.05), x = laneX(item.lane, z), y = depthY(z) - (10 + z * 13);
        var r = 3 + z * 9;
        c.save();
        c.translate(x, y); c.rotate(item.spin);
        c.globalAlpha = 0.55 + z * 0.45;
        c.shadowColor = "#ffd66b"; c.shadowBlur = reduced ? 0 : 10;
        c.fillStyle = "#ffc94d"; c.strokeStyle = "#fff0a8"; c.lineWidth = 1 + z;
        c.beginPath(); c.ellipse(0, 0, r * 0.72, r, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        c.shadowBlur = 0; c.fillStyle = "#fff4c4"; c.font = "bold " + Math.max(5, r) + "px sans-serif";
        c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("✦", 0, 0.5);
        c.restore();
    }
    function drawTrain(c, x, y, s) {
        var w = 34 * s, h = 70 * s;
        polygon(c, [[x - w * .62, y - h], [x + w * .62, y - h], [x + w, y - h * .82], [x + w, y], [x - w, y]], "#414c55", "#a6a9a5", 1.5 * s);
        polygon(c, [[x - w * .62, y - h], [x - w * .32, y - h * 1.12], [x + w * .88, y - h * 1.02], [x + w * .62, y - h]], "#68747a", "#bac0bd", 1 * s);
        c.fillStyle = "#17232b"; c.fillRect(x - w * .72, y - h * .77, w * 1.42, h * .28);
        for (var i = 0; i < 3; i++) {
            c.fillStyle = "#c2d7d3";
            c.fillRect(x - w * .56 + i * w * .46, y - h * .72, w * .31, h * .18);
        }
        c.fillStyle = "#ffcf76";
        c.fillRect(x - w * .62, y - h * .14, w * .22, h * .08);
        c.fillRect(x + w * .4, y - h * .14, w * .22, h * .08);
        c.fillStyle = "#161d22";
        c.fillRect(x - w, y - 3 * s, w * 2, 5 * s);
    }
    function drawObstacle(c, ob) {
        var z = clamp(ob.z, 0, 1.05), x = laneX(ob.lane, z), y = depthY(z);
        var s = 0.18 + z * 1.36;
        c.save();
        if (ob.type === "train") {
            drawTrain(c, x, y, s);
        } else if (ob.type === "barrier") {
            c.shadowColor = "#ff9a4e"; c.shadowBlur = reduced ? 0 : 8 * s;
            polygon(c, [[x - 26*s, y - 16*s], [x + 26*s, y - 16*s], [x + 23*s, y], [x - 23*s, y]], "#bc613d", "#ffd09b", 1.5*s);
            c.fillStyle = "#f0d0a5";
            for (var b = -1; b <= 1; b++) c.fillRect(x + b * 15*s - 3*s, y - 12*s, 6*s, 5*s);
        } else if (ob.type === "beam") {
            c.shadowColor = "#f4b75f"; c.shadowBlur = reduced ? 0 : 7*s;
            c.fillStyle = "#765746"; c.fillRect(x - 27*s, y - 64*s, 54*s, 9*s);
            c.fillStyle = "#d4a56d"; c.fillRect(x - 27*s, y - 64*s, 54*s, 3*s);
            c.fillStyle = "#4a3b36";
            c.fillRect(x - 24*s, y - 58*s, 5*s, 46*s);
            c.fillRect(x + 19*s, y - 58*s, 5*s, 46*s);
        } else if (ob.type === "gap") {
            c.shadowColor = "#ff6b41"; c.shadowBlur = reduced ? 0 : 12*s;
            c.fillStyle = "#080b10"; c.strokeStyle = "#e37c48"; c.lineWidth = 2*s;
            c.beginPath(); c.ellipse(x, y - 2*s, 29*s, 10*s, 0, 0, Math.PI*2); c.fill(); c.stroke();
            c.strokeStyle = "rgba(255,194,117,.65)"; c.lineWidth = 1*s;
            c.beginPath(); c.ellipse(x, y - 2*s, 18*s, 6*s, 0, 0, Math.PI*2); c.stroke();
        } else {
            c.shadowColor = "#17110e"; c.shadowBlur = reduced ? 0 : 9*s;
            polygon(c, [[x - 22*s, y - 36*s], [x - 8*s, y - 44*s], [x + 24*s, y - 32*s],
                [x + 22*s, y], [x - 24*s, y]], "#777067", "#c4b59f", 1.5*s);
            polygon(c, [[x - 22*s, y - 36*s], [x - 8*s, y - 44*s], [x + 24*s, y - 32*s],
                [x + 5*s, y - 25*s]], "#a49a8b", "#d4c2a8", 1*s);
            c.strokeStyle = "rgba(40,30,24,.8)"; c.lineWidth = 1.4*s;
            c.beginPath(); c.moveTo(x - 10*s, y - 28*s); c.lineTo(x - 2*s, y - 11*s);
            c.lineTo(x + 9*s, y - 22*s); c.stroke();
        }
        c.restore();
    }

    function easeOut(value) {
        var t = clamp(value, 0, 1);
        return 1 - Math.pow(1 - t, 3);
    }
    function drawBubble(c, x, y, text, accent, width) {
        width = width || 250;
        var h = 42;
        c.save();
        c.fillStyle = "rgba(5,12,22,.92)";
        c.strokeStyle = accent || "#d5e9ff";
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(x - width / 2, y - h / 2, width, h, 10);
        c.fill(); c.stroke();
        c.fillStyle = "#ffffff";
        c.font = "900 12px Arial,sans-serif";
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(text, x, y);
        c.restore();
    }
    function drawStoneRunExtras(c, x, y, now) {
        var gait = Math.sin(now / 62);
        c.save();
        c.lineCap = "round";
        c.lineWidth = 6;
        c.strokeStyle = "#342d29";
        c.beginPath();
        c.moveTo(x - 14, y + 21);
        c.lineTo(x - 21 + gait * 7, y + 34);
        c.lineTo(x - 28 + gait * 12, y + 35);
        c.moveTo(x + 14, y + 21);
        c.lineTo(x + 21 - gait * 7, y + 34);
        c.lineTo(x + 28 - gait * 12, y + 35);
        c.stroke();
        c.lineWidth = 4;
        c.strokeStyle = "#8a7666";
        c.beginPath();
        c.moveTo(x - 35, y - 4);
        c.lineTo(x - 45 - gait * 7, y + 9);
        c.moveTo(x + 35, y - 4);
        c.lineTo(x + 45 + gait * 7, y + 8);
        c.stroke();
        c.fillStyle = "rgba(255,115,82,.9)";
        c.beginPath();
        c.arc(x - 39 - gait * 8, y - 23, 3, 0, Math.PI * 2);
        c.arc(x + 40 + gait * 8, y - 20, 2.5, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }
    function drawRunnerHeroExtras(c, x, y, now, sad) {
        var gait = Math.sin(now / 52);
        c.save();
        c.lineCap = "round";
        c.lineWidth = 2.4;
        c.strokeStyle = "#f4d9d5";
        c.beginPath();
        c.moveTo(x - 5, y + 7);
        c.lineTo(x - 10 + gait * 5, y + 17);
        c.moveTo(x + 5, y + 7);
        c.lineTo(x + 10 - gait * 5, y + 17);
        c.moveTo(x - 10, y - 1);
        c.lineTo(x - 16 - gait * 5, y + 4);
        c.moveTo(x + 10, y - 1);
        c.lineTo(x + 16 + gait * 5, y - 5);
        c.stroke();
        if (sad) {
            c.strokeStyle = "#3d1721";
            c.lineWidth = 1.6;
            c.beginPath();
            c.moveTo(x - 5, y - 4); c.lineTo(x - 2, y - 2);
            c.moveTo(x + 2, y - 2); c.lineTo(x + 5, y - 4);
            c.arc(x, y + 5, 3, Math.PI + 0.2, Math.PI * 2 - 0.2);
            c.stroke();
            c.fillStyle = "#9ce8ff";
            c.beginPath();
            c.moveTo(x + 15, y - 13);
            c.quadraticCurveTo(x + 22, y - 7, x + 15, y - 2);
            c.quadraticCurveTo(x + 9, y - 7, x + 15, y - 13);
            c.fill();
        }
        c.restore();
    }
    function drawWaystarCar(c, x, y, progress, now) {
        progress = clamp(progress, 0, 1);
        if (progress <= 0.01) return;
        c.save();
        c.globalAlpha = progress;
        c.translate(x, y);
        var scale = 0.45 + progress * 0.55;
        c.scale(scale, scale);
        var wheelTurn = now / 90;
        c.shadowColor = "#74dfff";
        c.shadowBlur = reduced ? 0 : 17;
        c.fillStyle = "#101a28";
        for (var side = -1; side <= 1; side += 2) {
            for (var row = -1; row <= 1; row += 2) {
                c.save();
                c.translate(side * 30, row * 22);
                c.rotate(wheelTurn * (row < 0 ? 1 : -1));
                c.beginPath(); c.ellipse(0, 0, 7, 13, 0, 0, Math.PI * 2); c.fill();
                c.strokeStyle = "#9fb6c6"; c.lineWidth = 1.5;
                c.beginPath(); c.moveTo(0, -8); c.lineTo(0, 8); c.stroke();
                c.restore();
            }
        }
        var body = c.createLinearGradient(-28, -42, 28, 40);
        body.addColorStop(0, "#f2fdff");
        body.addColorStop(.28, "#79dfff");
        body.addColorStop(.68, "#2376bc");
        body.addColorStop(1, "#16416f");
        c.fillStyle = body;
        c.strokeStyle = "#e8fbff";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(0, -47);
        c.quadraticCurveTo(22, -43, 25, -24);
        c.lineTo(28, 22);
        c.quadraticCurveTo(25, 43, 0, 46);
        c.quadraticCurveTo(-25, 43, -28, 22);
        c.lineTo(-25, -24);
        c.quadraticCurveTo(-22, -43, 0, -47);
        c.closePath(); c.fill(); c.stroke();
        c.shadowBlur = 0;
        c.fillStyle = "rgba(9,31,58,.88)";
        c.strokeStyle = "rgba(230,250,255,.92)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-18, -22); c.quadraticCurveTo(-15, -36, 0, -37);
        c.quadraticCurveTo(15, -36, 18, -22);
        c.lineTo(16, -3); c.quadraticCurveTo(0, 3, -16, -3); c.closePath();
        c.fill(); c.stroke();
        c.fillStyle = "#dffaff";
        c.fillRect(-20, 27, 9, 4); c.fillRect(11, 27, 9, 4);
        c.fillStyle = "#ffe68a";
        c.shadowColor = "#ffe68a"; c.shadowBlur = reduced ? 0 : 10;
        c.beginPath();
        for (var i = 0; i < 10; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 5;
            var r = i % 2 === 0 ? 10 : 4.2;
            var sx = Math.cos(a) * r, sy = 13 + Math.sin(a) * r;
            if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
        }
        c.closePath(); c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = "rgba(225,250,255,.5)";
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(-18, 7); c.lineTo(-20, 20); c.moveTo(18, 7); c.lineTo(20, 20); c.stroke();
        c.restore();
    }
    function drawActualRunnerHeart(c, x, y, mounted) {
        if (typeof drawLivingStonePlayer !== "function") return;
        var oldX = livingStonePlayer.x, oldY = livingStonePlayer.y;
        var oldMounted = window.__mbLivingStoneStarMounted;
        livingStonePlayer.x = x; livingStonePlayer.y = y;
        if (mounted) window.__mbLivingStoneStarMounted = true;
        try { drawLivingStonePlayer(); }
        finally {
            livingStonePlayer.x = oldX; livingStonePlayer.y = oldY;
            window.__mbLivingStoneStarMounted = oldMounted;
        }
    }
    function draw(c) {
        if (!active || !c) return;
        var now = clock();
        c.save();
        drawTunnel(c, now);

        // Distant dust and light streaks add speed without heavy particle work.
        for (var d = 0; d < 9; d++) {
            var depth = (d * 0.137 + trackOffset * 0.42) % 1;
            var y = 120 + depth * 330;
            var x = (d * 67 + elapsed * (18 + d * 1.8)) % 430 - 15;
            c.fillStyle = "rgba(235,192,139," + (0.08 + depth * 0.16) + ")";
            c.fillRect(x, y, 1 + depth * 2, 2 + depth * 6);
        }
        var sorted = obstacles.slice().sort(function (a, b) { return a.z - b.z; });
        for (var o = 0; o < sorted.length; o++) drawObstacle(c, sorted[o]);
        for (var ci = 0; ci < coins.length; ci++) drawCoin(c, coins[ci]);

        // The Living Stone is already running away before the player starts moving.
        var cinematicTime = introFinished ? introDuration : introElapsed;
        var fleeProgress = clamp(cinematicTime / 1550, 0, 1);
        fleeProgress = easeOut(fleeProgress);
        var stoneX = 200 + Math.sin(now / 190) * (introFinished ? 4 : 9);
        var stoneY = 145 - fleeProgress * 35 + Math.sin(now / 78) * 2;
        if (superMode && typeof window.MBDrawLivingStoneSuperRunnerBoss === "function") {
            try { window.MBDrawLivingStoneSuperRunnerBoss(c, stoneX, stoneY, 1 - fleeProgress * 0.12); } catch (e) {}
        } else if (typeof drawLivingStoneBoss === "function") {
            try { drawLivingStoneBoss(); } catch (e) {}
        } else {
            c.fillStyle = "#8b7355"; c.beginPath(); c.arc(stoneX, stoneY, 28, 0, Math.PI*2); c.fill();
        }
        drawStoneRunExtras(c, stoneX, stoneY, now);
        if (!starAid && !introFinished && introElapsed < introDuration) {
            drawBubble(c, stoneX, stoneY - 62, "ПОЙМАЙ МЕНЯ!", "#ff9b79", 174);
        }

        var px = livingStonePlayer.x, py = livingStonePlayer.y;
        var introStar = !introFinished && starAid;
        var introT = introElapsed;
        if (starAid) {
            var arrival = easeOut((introT - 380) / 1200);
            var starX = -44 + (px + 44) * arrival;
            var starY = 300 + (py - 332) * arrival - Math.sin(arrival * Math.PI) * 34;
            var morph = introFinished ? 1 : easeOut((introT - 2450) / 1450);
            var carY = py + 12;
            drawWaystarCar(c, px, carY, morph, now);
            if (introStar && morph < 0.98 && typeof window.MBDrawWaystarCompanion === "function") {
                var starSize = 34 * (1 - morph * 0.5);
                window.MBDrawWaystarCompanion(starX, starY, starSize);
                if (introT > 1150 && introT < 3300) {
                    drawBubble(c, clamp(starX + 100, 175, 265), starY - 70,
                        "Я ПРИШЛА ВЕРНУТЬ ДОЛГ!", "#aeeaff", 232);
                }
                if (introT > 2600 && introT < 3900) {
                    c.save();
                    c.globalAlpha = 1 - morph;
                    c.strokeStyle = "rgba(184,242,255,.88)";
                    c.lineWidth = 2;
                    c.shadowColor = "#9deaff";
                    c.shadowBlur = reduced ? 0 : 16;
                    for (var ray = 0; ray < 8; ray++) {
                        var ra = now / 170 + ray * Math.PI / 4;
                        c.beginPath();
                        c.moveTo(starX + Math.cos(ra) * 16, starY + Math.sin(ra) * 16);
                        c.lineTo(px + Math.cos(ra) * 58, carY + Math.sin(ra) * 58);
                        c.stroke();
                    }
                    c.restore();
                }
            }
            var jumpProgress = introFinished ? 1 : easeOut((introT - 3650) / 1050);
            var jumpArc = introStar ? Math.sin(jumpProgress * Math.PI) * 56 : 0;
            var heroY = py - (introStar ? jumpArc + jumpProgress * 8 : 8);
            if (introStar && introT < 3650) heroY = py;
            c.save();
            c.globalAlpha = 0.38;
            c.fillStyle = "#05080b";
            c.beginPath(); c.ellipse(px, 441, 24, 5, 0, 0, Math.PI * 2); c.fill();
            c.restore();
            drawActualRunnerHeart(c, px, heroY, true);
            if (introStar && introT >= 3650 && introT < 5100) {
                c.save();
                c.globalAlpha = 0.7;
                c.strokeStyle = "#e7fbff";
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(px - 3, heroY + 5);
                c.quadraticCurveTo(px - 28, heroY - 18, px - 14, py + 20);
                c.stroke();
                c.restore();
                if (introT > 4200) drawBubble(c, px, py - 100, "ЗАПРЫГНУЛ! ПОЕХАЛИ!", "#b4ecff", 210);
            }
        } else {
            c.save();
            c.globalAlpha = jumpLeft > 0 ? 0.24 : 0.42;
            c.fillStyle = "#05080b";
            c.beginPath(); c.ellipse(laneX(laneVisual, 0.98), 439, 19 + (jumpLeft > 0 ? 10 : 0), 5, 0, 0, Math.PI*2); c.fill();
            c.restore();
            drawActualRunnerHeart(c, px, py, false);
            drawRunnerHeroExtras(c, px, py, now, !introFinished);
            if (!introFinished && introElapsed > 450) {
                drawBubble(c, 200, 325, "ЛАДНО... ДОГОНЮ САМ.", "#ffb7a2", 214);
            }
        }

        if (starAid) {
            c.save();
            c.strokeStyle = starGuard ? "rgba(255,226,143,.9)" : "rgba(255,214,115,.28)";
            c.lineWidth = 2;
            c.beginPath(); c.arc(px, py + 3, 25 + Math.sin(now / 110) * 3, 0, Math.PI*2); c.stroke();
            if (starFlash > 0) {
                c.strokeStyle = "rgba(255,230,140," + Math.min(1, starFlash / 9) + ")";
                c.lineWidth = 3; c.shadowColor = "#ffcf52"; c.shadowBlur = reduced ? 0 : 12;
                c.beginPath(); c.moveTo(px + 20, py - 8); c.lineTo(livingStoneBoss.x, livingStoneBoss.y + 20); c.stroke();
            }
            c.restore();
        }

        // Timer, progress and small coin counter.
        var remain = Math.max(0, DURATION - elapsed);
        var totalSec = Math.floor(remain / 1000);
        var min = Math.floor(totalSec / 60), sec = totalSec % 60;
        var cs = Math.floor(remain % 1000 / 10);
        c.save();
        c.fillStyle = "rgba(8,13,19,.82)"; c.fillRect(108, 12, 184, 34);
        c.strokeStyle = starAid ? "#f2cf70" : "#bd8060"; c.lineWidth = 1.5; c.strokeRect(108, 12, 184, 34);
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillStyle = "#ffe7bd"; c.font = "bold 16px monospace";
        c.fillText(String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0") + ":" + String(cs).padStart(2, "0"), 200, 29);
        c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(108, 51, 184, 5);
        c.fillStyle = starAid ? "#f7cf70" : "#ee8056"; c.fillRect(108, 51, 184 * (elapsed / DURATION), 5);
        c.fillStyle = "rgba(8,13,19,.86)"; c.fillRect(126, 61, 148, 25);
        c.strokeStyle = starAid ? "#9deaff" : "#ee8056"; c.lineWidth = 1; c.strokeRect(126, 61, 148, 25);
        c.textAlign = "center"; c.textBaseline = "middle"; c.font = "bold 10px monospace"; c.fillStyle = "#e8f1ff";
        c.fillText("ЖИЗНИ", 163, 73);
        c.font = "bold 17px sans-serif"; c.fillStyle = "#ff6262";
        c.fillText("♥".repeat(chaseLives) + "♡".repeat(3 - chaseLives), 226, 73);
        c.textAlign = "left"; c.textBaseline = "alphabetic"; c.font = "bold 11px monospace"; c.fillStyle = "#ffe7b0";
        c.fillText("✦ " + coinCount, 14, 27);
        c.textAlign = "right"; c.fillStyle = "#e5d8cc";
        c.fillText(starAid ? "ЕДЕШЬ НА ЗВЕЗДЕ" : "ЖИВОЙ КАМЕНЬ ДОГОНЯЕТ", 386, 27);
        c.textAlign = "center"; c.font = "bold 10px monospace"; c.fillStyle = "rgba(255,255,255,.82)";
        c.fillText("СВАЙПЫ • ← → ПОЛОСА • ↑ ПРЫЖОК • ↓ ПОДКАТ", 200, 486);
        if (elapsed < 4600) {
            var introAlpha = 1 - Math.max(0, elapsed - 2600) / 2000;
            c.globalAlpha = clamp(introAlpha, 0, 1);
            c.fillStyle = "rgba(4,10,18,.86)";
            c.fillRect(42, 91, 316, 48);
            c.strokeStyle = starAid ? "#9deaff" : "#ee8056";
            c.lineWidth = 1.5; c.strokeRect(42, 91, 316, 48);
            c.textAlign = "center"; c.textBaseline = "middle";
            c.fillStyle = starAid ? "#c9f1ff" : "#ffd1c3";
            c.font = "bold 10px monospace";
            c.fillText(starAid ? "ПУТЕВОДНАЯ ЗВЕЗДА" : "КАМЕНЬ УБЕГАЕТ!", 200, 105);
            c.fillStyle = "#ffffff"; c.font = "bold 13px Arial,sans-serif";
            c.fillText(starAid ? "Я ПРИШЛА ВЕРНУТЬ ДОЛГ!" : "ТЕБЕ ПРИДЁТСЯ БЕЖАТЬ САМОМУ!", 200, 125);
            c.textBaseline = "alphabetic";
        }
        c.restore();

        if (damageFlash > 0) {
            c.fillStyle = "rgba(255,65,45," + (damageFlash / 45) + ")";
            c.fillRect(0, 0, 400, 500);
        }
        c.restore();
    }

    function finish(success) {
        if (!active) return;
        active = false;
        introFinished = false;
        unbindControls();
        resetArrays();
        if (success !== false && starAid && music && musicAllowed()) {
            musicKeepAlive = true;
            window.__mbLivingStoneChaseMusicPersistent = true;
        } else {
            stopMusic(false);
        }
        window.__mbLivingStoneChaseActive = false;
        window.__mbLivingStoneChaseStarAid = false;
        var wasSuperMode = superMode;
        superMode = false;
        if (wasSuperMode) window.__mbLS2RunnerActive = false;
        var name = document.getElementById("arenaBossName");
        if (name) name.textContent = wasSuperMode ? "🪨 ЖИВОЙ КАМЕНЬ ПРАЙМ" : "ЖИВОЙ КАМЕНЬ";
        var timer = document.getElementById("arenaTimer");
        if (timer) timer.textContent = "∞";
        livingStonePlayer.x = 200; livingStonePlayer.y = wasSuperMode ? 410 : 398;
        livingStoneBoss.x = 200; livingStoneBoss.y = wasSuperMode ? 108 : 110;
        livingStoneBoss.size = wasSuperMode ? 44 : 40;
        livingStoneBoss.vx = wasSuperMode ? (starAid ? -1.25 : 1.15) : 1.5;
        livingStoneBoss.rotation = 0;
        livingStoneAttacks = []; livingStoneBullets = []; livingStoneAttackTimer = 0;
        livingStoneTypeTimer = wasSuperMode ? 160 : 180; livingStoneInvulnTimer = 30;
        livingStoneState = wasSuperMode ? "phase2" : "phase1";
        if (wasSuperMode) {
            window.__mbLS2RunnerActive = false;
            window.__mbLS2PhaseFrames = 0;
            if (success === false) {
                window.__mbLS2GreenPhase = "normal";
                window.__mbLS2AfterChase = false;
            }
        } else {
            try { if (typeof startBattleMusic === "function") startBattleMusic(); } catch (e) {}
        }
        var done = callback; callback = null;
        if (success === false) {
            console.warn("[LS CHASE] Three lives lost; ending the Living Stone attempt.");
            if (wasSuperMode && typeof window.MBLivingStoneSuperNativeDefeat === "function") {
                window.MBLivingStoneSuperNativeDefeat();
            } else if (typeof livingStoneDefeat === "function") {
                livingStoneDefeat();
            }
            return;
        }
        console.log("[LS CHASE] 116-second runner complete; transition to phase 2. Coins:", coinCount);
        if (typeof done === "function") {
            try { done(); } catch (e) { console.error("[LS CHASE] phase transition error", e); }
        }
    }
    function start(options) {
        if (active) return true;
        options = options || {};
        var requestedSuperMode = options.superMode === true;
        if (typeof livingStoneActive === "undefined" || !livingStoneActive ||
            (typeof window !== "undefined" &&
             ((!requestedSuperMode && window.livingStoneSuperActive) ||
              (!requestedSuperMode && window.__mbBossTestMode)))) return false;
        if (requestedSuperMode && !window.livingStoneSuperActive) return false;

        superMode = requestedSuperMode;
        starAid = options.starAid === true || debt();
        chaseLives = 3; chaseFailed = false; chaseFailTimer = 0;
        callback = typeof options.onComplete === "function" ? options.onComplete : null;
        reduced = !!(window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects());
        startedAt = clock(); lastAt = startedAt; elapsed = 0;
        lane = 1; laneVisual = 1; jumpLeft = 0; slideLeft = 0;
        spawnClock = 0; trackOffset = 0; distance = 0; coinCount = 0; lastHud = -1;
        starGuard = starAid; nextGuard = 7000; nextStrike = 4400;
        starFlash = 0; damageFlash = 0;
        introElapsed = 0;
        introDuration = starAid ? 5450 : 2750;
        introFinished = false;
        resetArrays();

        livingStoneState = "chase";
        finalSceneActive = false;
        qteActive = false; qteCinematicActive = false;
        qteBullets = []; qtePunches = []; qtePlayerTrail = [];
        livingStoneAttacks = []; livingStoneBullets = []; chainExplosionsQueue = [];
        lsModCapsules = []; lsActiveMod = null;
        livingStonePlayer.x = laneX(1, 0.92); livingStonePlayer.y = 422;
        livingStoneBoss.x = 200; livingStoneBoss.y = 160; livingStoneBoss.size = 34;
        window.__mbLivingStoneChaseActive = true;
        window.__mbLivingStoneChaseStarAid = starAid;
        if (superMode) {
            window.__mbLS2RunnerActive = true;
            window.__mbLS2GreenPhase = "chase";
            window.__mbLS2PhaseFrames = 0;
            window.__mbLS2ChaseStarAid = starAid;
        }
        bindControls();

        if (typeof stopQTEMusic === "function") { try { stopQTEMusic(); } catch (e) {} }
        if (starAid) {
            startMusic();
        } else {
            if (!superMode) {
                try { if (typeof startBattleMusic === "function") startBattleMusic(); } catch (e) {}
            }
        }
        var name = document.getElementById("arenaBossName");
        if (name) name.textContent = superMode
            ? (starAid ? "ПОГОНЯ • ПРАЙМ И ЗВЕЗДА" : "ПОГОНЯ • ЖИВОЙ КАМЕНЬ ПРАЙМ")
            : (starAid ? "ПОГОНЯ • ЖИВОЙ КАМЕНЬ И ЗВЕЗДА" : "ПОГОНЯ • ЖИВОЙ КАМЕНЬ");
        var timer = document.getElementById("arenaTimer");
        if (timer) timer.textContent = starAid ? "ЗВЕЗДА В ПУТИ..." : "КАМЕНЬ УБЕГАЕТ...";
        active = true;
        console.log("[LS CHASE] animated chase intro started; Waystar car:", starAid);
        return true;
    }
    function stop() {
        if (!active && !music) return;
        active = false;
        introFinished = false;
        introElapsed = 0;
        unbindControls();
        resetArrays();
        stopMusic();
        window.__mbLivingStoneChaseActive = false;
        window.__mbLivingStoneChaseStarAid = false;
        if (superMode) window.__mbLS2RunnerActive = false;
        superMode = false;
        callback = null;
    }

    window.MBStartLivingStoneChase = start;
    window.MBUpdateLivingStoneChase = update;
    window.MBDrawLivingStoneChase = draw;
    window.MBStopLivingStoneChase = stop;
    window.MBIsLivingStoneChaseActive = function () { return active; };
    window.MBHasLivingStoneWaystarAid = debt;
    window.MBRetryPendingChaseMusic = retryMusic;
    window.MBStartLivingStoneChaseMusic = startMusic;
    window.MBStopLivingStoneChaseMusic = stopMusic;
})();