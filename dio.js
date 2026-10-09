// DIO OVER HEAVEN — отдельный модуль.
// Зависит от общих игровых контекстов, которые объявляет supers.js.
// Содержимое перенесено без изменения логики, чтобы сохранить текущее поведение.

// ★ DIO OH: заранее прогружаем оба звука.
var _dioAudioCache = {};
function preloadDioSounds() {
    var files = [
        "music/za-warudo-time-stop-louder.mp3",
        "music/dios-time-stop-teleportation-sound-effect-1.mp3"
    ];
    for (var i = 0; i < files.length; i++) {
        try {
            var audio = new Audio();
            audio.preload = "auto";
            audio.src = files[i];
            audio.volume = 0.72;
            audio.load();
            _dioAudioCache[files[i]] = audio;
        } catch(e) {}
    }
}
preloadDioSounds();

function dioPlaySound(path) {
    try {
        var audio = _dioAudioCache[path];
        if (!audio) {
            audio = new Audio(path);
            audio.preload = "auto";
            audio.volume = 0.72;
            _dioAudioCache[path] = audio;
        }
        audio.currentTime = 0;
        audio.volume = 0.72;
        var p = audio.play();
        if (p && typeof p.catch === "function") p.catch(function(){});
    } catch(e) {}
}
window.preloadDioSounds = preloadDioSounds;
// Круг инверсии идёт от сердца наружу в течение двух секунд перед остановкой времени.
function dioIsWindupActive() {
    return typeof _superState !== "undefined" &&
        (_superState.dioTimeStopWindupUntil || 0) > performance.now();
}
window.dioIsWindupActive = dioIsWindupActive;

var _dioOverlayRaf = 0;
function dioSyncTimeStopOverlay() {
    try {
        var base = (typeof ctx !== "undefined" && ctx && ctx.canvas) ? ctx.canvas : document.getElementById("arenaCanvas");
        var windup = dioIsWindupActive();
        var active = isDioTimeStopped();
        var visible = !!(base && isDioOverHeavenMain() && (windup || active));
        var overlay = document.getElementById("dioTimeStopInvertCanvas");
        var ring = document.getElementById("dioTimeStopWipeRing");
        if (!visible) {
            if (overlay) overlay.style.display = "none";
            if (ring) ring.style.display = "none";
            return;
        }
        if (!overlay) {
            overlay = document.createElement("canvas");
            overlay.id = "dioTimeStopInvertCanvas";
            overlay.style.cssText = "position:fixed;pointer-events:none;z-index:20;display:none;filter:invert(1);";
            document.body.appendChild(overlay);
        }
        if (!ring) {
            ring = document.createElement("div");
            ring.id = "dioTimeStopWipeRing";
            ring.style.cssText = "position:fixed;pointer-events:none;z-index:21;display:none;border:2px solid rgba(255,239,165,.95);border-radius:50%;box-shadow:0 0 18px rgba(255,226,115,.9),inset 0 0 16px rgba(255,255,255,.45);";
            document.body.appendChild(ring);
        }
        var rect = base.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        overlay.width = base.width || 400;
        overlay.height = base.height || 500;
        overlay.style.left = rect.left + "px";
        overlay.style.top = rect.top + "px";
        overlay.style.width = rect.width + "px";
        overlay.style.height = rect.height + "px";
        overlay.style.display = "block";
        overlay.style.filter = "invert(1)";
        var ox = overlay.getContext("2d");
        if (ox) {
            ox.clearRect(0, 0, overlay.width, overlay.height);
            ox.drawImage(base, 0, 0, overlay.width, overlay.height);
        }
        var bctx = (typeof getBossContext === "function") ? getBossContext() : null;
        var hx = bctx && typeof bctx.getHeartX === "function" ? bctx.getHeartX() : overlay.width / 2;
        var hy = bctx && typeof bctx.getHeartY === "function" ? bctx.getHeartY() : overlay.height / 2;
        var cx = hx / overlay.width * rect.width;
        var cy = hy / overlay.height * rect.height;
        var progress = windup ? Math.max(0, Math.min(1, 1 - ((_superState.dioTimeStopWindupUntil - performance.now()) / 2000))) : 1;
        var maxRadius = Math.hypot(Math.max(cx, rect.width - cx), Math.max(cy, rect.height - cy));
        var radius = Math.max(1, maxRadius * progress);
        overlay.style.clipPath = "circle(" + radius + "px at " + cx + "px " + cy + "px)";
        ring.style.display = windup ? "block" : "none";
        if (windup) {
            ring.style.width = (radius * 2) + "px";
            ring.style.height = (radius * 2) + "px";
            ring.style.left = (rect.left + cx - radius) + "px";
            ring.style.top = (rect.top + cy - radius) + "px";
            ring.style.opacity = String(Math.max(0.2, 1 - progress * 0.25));
        }
    } catch (e) {}
}
function dioStartOverlayLoop() {
    if (_dioOverlayRaf || typeof requestAnimationFrame !== "function") return;
    var tick = function() {
        _dioOverlayRaf = 0;
        dioSyncTimeStopOverlay();
        if (dioIsWindupActive() || isDioTimeStopped()) {
            _dioOverlayRaf = requestAnimationFrame(tick);
        }
    };
    _dioOverlayRaf = requestAnimationFrame(tick);
}

function dioAddEnergy(amount) {
    if (!isDioOverHeavenMain()) return;
    _superState.dioEnergy = Math.max(0, Math.min(100, (_superState.dioEnergy || 0) + Math.max(0, Number(amount) || 0)));
}
window.dioAddEnergy = dioAddEnergy;

function dioTrackBossDamage(ctxB) {
    if (!isDioOverHeavenMain() || !ctxB) return;
    var hp = Number(ctxB.getBossHp());
    if (!isFinite(hp)) return;
    var type = ctxB.type || "unknown";
    if (_superState.dioEnergyBossType !== type || _superState.dioEnergyLastBossHp === null) {
        _superState.dioEnergyBossType = type;
        _superState.dioEnergyLastBossHp = hp;
        return;
    }
    var delta = _superState.dioEnergyLastBossHp - hp;
    if (delta > 0) {
        // Максимум 40 энергии за одно зарегистрированное попадание.
        // Для обычной арены энергия начисляется прямо из оценки попадания.
        if (type !== "arena") dioAddEnergy(Math.min(40, delta / 5));
    }
    _superState.dioEnergyLastBossHp = hp;
}
window.dioTrackBossDamage = dioTrackBossDamage;

function dioCanUse(skill, cost, cooldown) {
    var cd = _superState.dioSkillCooldowns[skill] || 0;
    if (cd > 0) {
        if (typeof showFloatingText === "function") showFloatingText("⏳ " + Math.ceil(cd) + "с", "#ffaa00");
        return false;
    }
    if ((_superState.dioEnergy || 0) < cost) {
        if (typeof showFloatingText === "function") showFloatingText("⚡ НУЖНО " + cost + " ЭНЕРГИИ (" + Math.floor(_superState.dioEnergy || 0) + "/100)", "#ffdd44");
        return false;
    }
    _superState.dioEnergy -= cost;
    _superState.dioSkillCooldowns[skill] = cooldown;
    return true;
}

function dioStartTimeStop(duration, teleportStyle, skipSound) {
    var ctxB = getBossContext();
    if (!ctxB) return;

    var d = Math.max(0.05, Number(duration) || 0);
    var now = performance.now();

    // Один источник истины для всех режимов игры/боссов.
    // Пока этот флаг активен, физика и таймеры мира должны стоять,
    // а DIO/VFX продолжает жить.
    if (teleportStyle) _superState.dioTeleportStop = d;
    else _superState.dioTimeStop = d;
    _superState.dioTimeStopWindupUntil = 0;

    _superState.dioTimeStopStartedAt = now;
    _superState.dioResumeSoundPlayed = false;
    _superState.dioTimeStopWasActive = true;
    _superState.dioStandFlash = teleportStyle ? 0.55 : 1.15;
    _superState.dioStandX = ctxB.getHeartX();
    _superState.dioStandY = ctxB.getHeartY();

    // Для обычного тайм-стопа звук подготовки уже прозвучал при нажатии.
    if (!skipSound) {
        dioPlaySound(teleportStyle
            ? "music/dios-time-stop-teleportation-sound-effect-1.mp3"
            : "music/za-warudo-time-stop-louder.mp3");
    }

    // Аниме-удар: белый flash -> золото -> фиолетовый "THE WORLD".
    ctxB.addFlashWhite(teleportStyle ? 4 : 12);
    ctxB.addShake(teleportStyle ? 10 : 24);
    ctxB.spawnFloatingText(
        ctxB.getHeartX(),
        ctxB.getHeartY() - 35,
        teleportStyle ? "THE WORLD!" : "ZA WARUDO!",
        "#fff0a0"
    );

    // Мгновенная вспышка вокруг сердца.
    try {
        var parts = ctxB.getParticles();
        if (parts) {
            var px = ctxB.getHeartX(), py = ctxB.getHeartY();
            for (var i = 0; i < (teleportStyle ? 18 : 34); i++) {
                var a = Math.random() * Math.PI * 2;
                var sp = 2 + Math.random() * (teleportStyle ? 5 : 9);
                parts.push({
                    x: px, y: py,
                    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                    life: 18 + Math.random() * 18, maxLife: 36,
                    color: i % 3 === 0 ? "#ffffff" : (i % 3 === 1 ? "#ffe66d" : "#b985ff"),
                    size: 1.5 + Math.random() * 3.5,
                    dioTimeStopVfx: true
                });
            }
        }
    } catch (e) {}
}

function isDioTimeStopped() {
    if (typeof _superState === "undefined") return false;
    return (_superState.dioTimeStop || 0) > 0 ||
           (_superState.dioTeleportStop || 0) > 0;
}
window.isDioTimeStopped = isDioTimeStopped;
function activateDioTimeStop() {
    if (dioIsWindupActive() || isDioTimeStopped()) return;
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("timeStop", 40, 25)) return;

    // DIO замирает на месте, пока золотая окружность не накроет арену.
    var now = performance.now();
    _superState.dioTimeStopWindupStartedAt = now;
    _superState.dioTimeStopWindupUntil = now + 2000;
    if (typeof heart !== "undefined" && heart) { heart.vx = 0; heart.vy = 0; }
    dioPlaySound("music/dios-time-stop-teleportation-sound-effect-1.mp3");
    dioStartOverlayLoop();

    setTimeout(function() {
        if (!_superState || !(_superState.dioTimeStopWindupUntil || 0)) return;
        _superState.dioTimeStopWindupUntil = 0;
        if (!isDioOverHeavenMain() || !getBossContext()) {
            dioSyncTimeStopOverlay();
            return;
        }
        dioStartTimeStop(6, false, true);
        dioStartOverlayLoop();
    }, 2000);
}

function activateDioHeal() {
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("heal", 30, 25)) return;
    var amount = ctxB.getPlayerMaxHp() * 0.10;
    ctxB.setPlayerHp(Math.min(ctxB.getPlayerMaxHp(), ctxB.getPlayerHp() + amount));
    ctxB.addShockwave(ctxB.getHeartX(), ctxB.getHeartY(), "#fff2aa", 260, 0.65, 5);
    ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "+10% REALITY HEAL", "#fff2aa");
}

function activateDioTeleport() {
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("teleport", 25, 15)) return;
    var now = performance.now(), target = null;
    for (var i = _superState.dioHistory.length - 1; i >= 0; i--) {
        if (now - _superState.dioHistory[i].time >= 1000) { target = _superState.dioHistory[i]; break; }
    }
    if (!target && _superState.dioHistory.length) target = _superState.dioHistory[0];
    if (target) {
        ctxB.setHeartX(target.x);
        ctxB.setHeartY(target.y);
        ctxB.clampHeart();
    }
    dioStartTimeStop(0.5, true);
}

function activateDioAggro() {
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("aggro", 40, 30)) return;
    _superState.dioAggroTimer = 4.0;
    var atk = ctxB.getAttacks();
    for (var i = 0; i < atk.length; i++) {
        atk[i].dioAggro = true;
        atk[i].dioAggroNoPlayer = true;
    }
    ctxB.addShockwave(ctxB.getHeartX(), ctxB.getHeartY(), "#d9c2ff", 360, 0.8, 6);
    ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "OVERWRITE: АГРЕССИЯ", "#d9c2ff");
}

function dioUseSkill(skill) {
    if (!isDioOverHeavenMain()) return;
    if (dioIsWindupActive()) return;
    if (skill === "timeStop") activateDioTimeStop();
    else if (skill === "heal") activateDioHeal();
    else if (skill === "teleport") activateDioTeleport();
    else if (skill === "aggro") activateDioAggro();
    updateSuperButton();
}
window.dioUseSkill = dioUseSkill;

function updateDioSkillCooldowns(dt) {
    var c = _superState.dioSkillCooldowns;
    for (var k in c) c[k] = Math.max(0, (c[k] || 0) - dt);
    // DIO's own clock is the only clock that continues while the world is stopped.
    var wasStopped = ((_superState.dioTimeStop || 0) > 0 || (_superState.dioTeleportStop || 0) > 0);
    var stopBeforeTick = Math.max(_superState.dioTimeStop || 0, _superState.dioTeleportStop || 0);
    // Запускаем звук за 1 секунду до возобновления времени, а не после.
    if (wasStopped && stopBeforeTick <= 1.05 && stopBeforeTick > 0 && !_superState.dioResumeSoundPlayed) {
        _superState.dioResumeSoundPlayed = true;
        try {
            var resumeTrack = (typeof window.getLoadedMusic === "function") ? window.getLoadedMusic("dioTimeResume") : null;
            var resumeAudio = new Audio(resumeTrack && resumeTrack.url ? resumeTrack.url : "music/time-resumes.mp3");
            resumeAudio.preload = "auto";
            resumeAudio.volume = 0.9;
            var playPromise = resumeAudio.play();
            if (playPromise && playPromise.catch) playPromise.catch(function(){});
        } catch (e) {}
    }
    _superState.dioTimeStop = Math.max(0, (_superState.dioTimeStop || 0) - dt);
    _superState.dioTeleportStop = Math.max(0, (_superState.dioTeleportStop || 0) - dt);
    var stoppedNow = ((_superState.dioTimeStop || 0) > 0 || (_superState.dioTeleportStop || 0) > 0);
    // Safety fallback for unusually large frame steps.
    if (wasStopped && !stoppedNow && !_superState.dioResumeSoundPlayed) {
        _superState.dioResumeSoundPlayed = true;
        try {
            var resumeTrack = (typeof window.getLoadedMusic === "function") ? window.getLoadedMusic("dioTimeResume") : null;
            var resumeAudio = new Audio(resumeTrack && resumeTrack.url ? resumeTrack.url : "music/time-resumes.mp3");
            resumeAudio.preload = "auto";
            resumeAudio.volume = 0.9;
            var playPromise = resumeAudio.play();
            if (playPromise && playPromise.catch) playPromise.catch(function(){});
        } catch (e) {}
    }
    _superState.dioAggroTimer = Math.max(0, (_superState.dioAggroTimer || 0) - dt);
    _superState.dioStandFlash = Math.max(0, (_superState.dioStandFlash || 0) - dt);
}

function updateDioHistory(ctxB) {
    if (!isDioOverHeavenMain() || !ctxB) return;
    var now = performance.now();
    _superState.dioHistory.push({time: now, x: ctxB.getHeartX(), y: ctxB.getHeartY()});
    while (_superState.dioHistory.length && now - _superState.dioHistory[0].time > 2500) _superState.dioHistory.shift();
}

function updateDioStandZone(ctxB) {
    if (!ctxB || !isDioOverHeavenMain()) return;
    var atk = ctxB.getAttacks();
    if (!atk || !atk.length) return;
    var hx = ctxB.getHeartX(), hy = ctxB.getHeartY(), radius = 52;
    for (var i = atk.length - 1; i >= 0; i--) {
        var a = atk[i];
        if (!a || a.dioAggroNoPlayer) continue;
        var ar = Number(a.size || a.radius || 10) * 0.5;
        var ax = (Number(a.x) || 0) + ar, ay = (Number(a.y) || 0) + ar;
        var inside = Math.hypot(ax - hx, ay - hy) <= radius + ar;
        if (!inside) { a.dioStandInside = false; continue; }
        if (a.dioStandInside) continue;
        a.dioStandInside = true;
        if (Math.random() < 0.02) {
            atk.splice(i, 1);
            _superState.dioStandFlash = Math.max(_superState.dioStandFlash || 0, 0.22);
            _superState.dioStandX = hx; _superState.dioStandY = hy;
            if (typeof ctxB.spawnFloatingText === "function") ctxB.spawnFloatingText(hx, hy - 28, "THE WORLD!", "#fff0a0");
            if (typeof ctxB.addShockwave === "function") ctxB.addShockwave(hx, hy, "#e5c8ff", 120, 0.25, 3);
        }
    }
}

function updateDioAggressiveBlocks(ctxB) {
    if (!ctxB || _superState.dioAggroTimer <= 0) return;
    var atk = ctxB.getAttacks();
    if (!Array.isArray(atk) || !atk.length) return;

    // В некоторых атаках движок оставляет пустые слоты. Никогда не трогаем undefined.
    var hx = ctxB.getHeartX(), hy = ctxB.getHeartY();

    for (var m = 0; m < atk.length; m++) {
        var nearA = atk[m];
        if (!nearA) continue;

        var nr = Number(nearA.size || nearA.radius || 10) || 10;
        var nax = (Number(nearA.x) || 0) + nr / 2;
        var nay = (Number(nearA.y) || 0) + nr / 2;

        if (Math.hypot(nax - hx, nay - hy) <= 180) {
            nearA.dioAggro = true;
            nearA.dioAggroNoPlayer = true;
        }
    }

    for (var i = atk.length - 1; i >= 0; i--) {
        var a = atk[i];
        if (!a || !a.dioAggro) continue;

        var ar = Number(a.size || a.radius || 10) || 10;
        var ax = (Number(a.x) || 0) + ar / 2;
        var ay = (Number(a.y) || 0) + ar / 2;
        var best = -1, bestD = Infinity;

        for (var j = 0; j < atk.length; j++) {
            var candidate = atk[j];
            if (!candidate || i === j || !candidate.dioAggro) continue;

            var br = Number(candidate.size || candidate.radius || 10) || 10;
            var bx = (Number(candidate.x) || 0) + br / 2;
            var by = (Number(candidate.y) || 0) + br / 2;
            var d = Math.hypot(bx - ax, by - ay);

            if (d < bestD) {
                bestD = d;
                best = j;
            }
        }

        if (best >= 0 && bestD < 150) {
            var b = atk[best];
            if (!b) continue;

            var br2 = Number(b.size || b.radius || 10) || 10;
            var bx2 = (Number(b.x) || 0) + br2 / 2;
            var by2 = (Number(b.y) || 0) + br2 / 2;
            var dx = bx2 - ax, dy = by2 - ay, len = Math.hypot(dx, dy) || 1;
            var speed = 4.2;

            if (a.spd !== undefined) a.spd = dx / len * speed;
            if (a.spdY !== undefined) a.spdY = dy / len * speed;
            if (a.vx !== undefined) a.vx = dx / len * speed;
            if (a.vy !== undefined) a.vy = dy / len * speed;

            if (bestD < (ar + br2) * 0.45) {
                // Удаляем оба снаряда безопасно, не ломая индексы.
                var hi = Math.max(i, best);
                var lo = Math.min(i, best);
                if (hi < atk.length) atk.splice(hi, 1);
                if (lo < atk.length) atk.splice(lo, 1);

                var particles = ctxB.getParticles();
                if (particles) {
                    particles.push({
                        x: ax, y: ay, vx: 0, vy: 0,
                        life: 20, maxLife: 20,
                        color: "#d9c2ff", size: 5
                    });
                }
            }
        }
    }
}
function ensureDioPanel() {
    var panel = document.getElementById("dioOverHeavenPanel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "dioOverHeavenPanel";
        panel.style.cssText = "display:none;position:absolute;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:25;width:min(390px,calc(100% - 12px));box-sizing:border-box;pointer-events:auto;";
        var overlay = document.getElementById("arenaOverlay");
        if (overlay) overlay.appendChild(panel);
    }
    return panel;
}

function updateDioPanel() {
    var panel = ensureDioPanel();
    if (!panel) return;
    var dioActive = isDioOverHeavenMain();
    if (!dioActive) {
        panel.style.display = "none";
        panel._dioSignature = "";
        return;
    }

    panel.style.display = "block";

    // ★ ВАЖНО: НЕ пересоздаём кнопки каждый кадр.
    // Раньше innerHTML обновлялся ~60 раз/сек. На мобильном это удаляло
    // нажатую кнопку до события click, поэтому "нажимаю — ничего".
    var e = Math.floor(_superState.dioEnergy || 0);
    var hud = document.getElementById("dioEnergyHud");
    var hudFill = document.getElementById("dioEnergyHudFill");
    var hudValue = document.getElementById("dioEnergyHudValue");
    if (hud) hud.style.display = "block";
    if (hudFill) hudFill.style.width = e + "%";
    if (hudValue) hudValue.textContent = e + " / 100";

    var cd = _superState.dioSkillCooldowns || {};
    var sig = [
        e,
        Math.ceil(cd.timeStop || 0),
        Math.ceil(cd.heal || 0),
        Math.ceil(cd.teleport || 0),
        Math.ceil(cd.aggro || 0)
    ].join("|");

    if (panel._dioSignature === sig && panel.children.length) return;
    panel._dioSignature = sig;

    panel.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;">' +
        dioButton("⏳ ZA", "timeStop", 40, 25, cd.timeStop || 0) +
        dioButton("💚 HEAL", "heal", 30, 25, cd.heal || 0) +
        dioButton("🌀 TP", "teleport", 25, 15, cd.teleport || 0) +
        dioButton("👊 RAGE", "aggro", 40, 30, cd.aggro || 0) +
        '</div>';
}
function dioButton(label,key,cost,cooldown,cd) {
    var disabled = cd > 0 || (_superState.dioEnergy || 0) < cost || !isDioOverHeavenMain();
    var textCd = cd > 0 ? " · "+Math.ceil(cd)+"с" : "";
    return '<button type="button" onclick="dioUseSkill(\''+key+'\')" '+(disabled?'disabled':'')+' style="width:100%;min-width:0;padding:7px 2px;border-radius:9px;border:1px solid #bca5ff;background:'+(disabled?'#333':'linear-gradient(135deg,#33214f,#8064a8)')+';color:white;font-size:10px;font-weight:900;line-height:1.05;touch-action:manipulation;pointer-events:auto;">'+label+'<br><span style="font-size:9px;">⚡'+cost+textCd+'</span></button>';
}

function renderDioVisuals(ctxB) {
    dioSyncTimeStopOverlay();
    if (!ctx) return;
    if (!ctxB || !isDioOverHeavenMain()) {
        return;
    }

    var now = performance.now();
    var stop = Math.max(_superState.dioTimeStop || 0, _superState.dioTeleportStop || 0);
    var active = stop > 0;

    // Инверсия цветов раскрывается отдельным слоем вслед за расширяющейся окружностью.
    var phase = now - (_superState.dioTimeStopStartedAt || now);
    var isTP = (_superState.dioTeleportStop || 0) > 0 && (_superState.dioTimeStop || 0) <= 0;

    if (active) {
        ctx.save();

        // DIO-стоп в JoJo не выглядит как огромный циферблат:
        // кадр резко темнеет/теряет насыщенность, движение мира замирает,
        // а вокруг DIO/The World остаётся золотой/зелёный энергетический след.
        var t = Math.max(0, phase);
        var intro = Math.max(0, Math.min(1, t / 180));
        var outro = Math.max(0, Math.min(1, stop / 260));
        var intensity = Math.min(intro, outro);
        var pulse = 0.5 + 0.5 * Math.sin(t / 95);

        // 1) Резкий "freeze frame": лёгкое обесцвечивание + холодный тёмный тон.
        ctx.fillStyle = "rgba(8,10,18," + (0.38 * intensity) + ")";
        ctx.fillRect(0, 0, 400, 500);
        ctx.fillStyle = "rgba(190,210,205," + (0.08 * intensity) + ")";
        ctx.fillRect(0, 0, 400, 500);

        // 2) Цветной импульс: оттенки реально бегут по окружности, а не стоят
        // отдельными неподвижными кольцами. Центр следует за сердцем игрока.
        var ringCtx = getBossContext();
        var ringX = ringCtx ? ringCtx.getHeartX() : _superState.dioStandX;
        var ringY = (ringCtx ? ringCtx.getHeartY() : _superState.dioStandY) - 24;
        if (!isTP && t >= 1000 && t <= 1800) {
            var ringT = Math.max(0, Math.min(1, (t - 1000) / 800));
            var ringRadius = 24 + ringT * 430;
            var ringAlpha = Math.sin(ringT * Math.PI) * 0.85;
            var ringColors = ["#ffffff", "#f3d66d", "#a77bff", "#79f5d0"];
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = ringAlpha;
            // Несколько цветных дуг движутся по одному кругу, как аниме-вспышка.
            for (var ri = 0; ri < ringColors.length; ri++) {
                ctx.beginPath();
                ctx.strokeStyle = ringColors[ri];
                ctx.lineWidth = ri === 0 ? 4 : 3;
                ctx.lineCap = "round";
                ctx.shadowColor = ringColors[ri];
                ctx.shadowBlur = ri === 0 ? 24 : 16;
                var arcStart = (now / 170) + ri * Math.PI / 2;
                ctx.arc(ringX, ringY, Math.max(2, ringRadius - ri * 3), arcStart, arcStart + Math.PI * 0.72);
                ctx.stroke();
            }
            var radial = ctx.createRadialGradient(ringX, ringY, Math.max(0, ringRadius - 75), ringX, ringY, ringRadius + 12);
            radial.addColorStop(0, "rgba(255,255,255,0)");
            radial.addColorStop(0.72, "rgba(246,222,255," + (0.14 * ringAlpha) + ")");
            radial.addColorStop(1, "rgba(255,235,155,0)");
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, 400, 500);
            ctx.restore();
        }
        // Телепортация — другой рисунок: короткие фиолетовые afterimage-дуги
        // и диагональный разрез вокруг точки перемещения, без эффекта ZA WARUDO.
        if (isTP && t < 650) {
            var tpLife = Math.max(0, 1 - t / 650);
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = tpLife * 0.9;
            for (var ti = 0; ti < 3; ti++) {
                ctx.beginPath();
                ctx.strokeStyle = ti === 0 ? "#ffffff" : (ti === 1 ? "#bd83ff" : "#65eaff");
                ctx.lineWidth = ti === 0 ? 4 : 2;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 18;
                ctx.ellipse(ringX, ringY, 22 + ti * 13 + (1 - tpLife) * 30, 38 + ti * 8, -0.45 + ti * 0.45, now / 180 + ti, now / 180 + ti + Math.PI * 1.25);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(ringX - 85 * tpLife, ringY + 70 * tpLife);
            ctx.lineTo(ringX + 85 * tpLife, ringY - 70 * tpLife);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 22;
            ctx.stroke();
            ctx.restore();
        }

        // 3) Знаменитые диагональные линии/следы остановившегося движения.
        // Они НЕ двигаются вместе с таймером мира — только слегка мерцают.
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (var ray = 0; ray < 22; ray++) {
            var ang = -1.25 + ray * 0.115;
            var side = ray % 2 ? 1 : -1;
            var len = 170 + (ray % 5) * 28;
            var cx = 200 + Math.cos(ang) * (95 + (ray % 4) * 16);
            var cy = 250 + Math.sin(ang) * (95 + (ray % 4) * 14);
            ctx.globalAlpha = (0.055 + (ray % 3) * 0.025) * intensity;
            ctx.strokeStyle = ray % 4 === 0 ? "#eaffff" : (ray % 2 ? "#72f5c8" : "#f4e58a");
            ctx.lineWidth = ray % 5 === 0 ? 2.2 : 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(ang + side * 0.15) * len, cy + Math.sin(ang + side * 0.15) * len);
            ctx.stroke();
        }

        // 3) "Застывшие" бело-зелёные трещины энергии — характерный JoJo-вайб.
        ctx.globalAlpha = 0.28 * intensity;
        ctx.strokeStyle = "#baffec";
        ctx.lineWidth = 1.5;
        var cracks = [
            [24,108,76,88,108,110],
            [365,126,330,102,292,121],
            [30,390,72,368,106,382],
            [370,366,328,345,294,362],
            [88,48,112,76,145,62],
            [310,452,286,420,255,438]
        ];
        for (var c = 0; c < cracks.length; c++) {
            var q = cracks[c];
            ctx.beginPath();
            ctx.moveTo(q[0], q[1]);
            ctx.lineTo(q[2], q[3]);
            ctx.lineTo(q[4], q[5]);
            ctx.stroke();
        }
        ctx.restore();

        // 4) Золотой ореол The World: мягкий, без огромного интерфейсного циферблата.
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        var aura = ctx.createRadialGradient(
            _superState.dioStandX, _superState.dioStandY - 30, 5,
            _superState.dioStandX, _superState.dioStandY - 30, 135
        );
        aura.addColorStop(0, "rgba(255,245,180," + (0.30 + pulse * 0.08) * intensity + ")");
        aura.addColorStop(0.22, "rgba(255,218,72," + (0.16 + pulse * 0.05) * intensity + ")");
        aura.addColorStop(0.55, "rgba(119,255,205," + (0.08 + pulse * 0.03) * intensity + ")");
        aura.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(_superState.dioStandX, _superState.dioStandY - 30, 140, 0, Math.PI * 2);
        ctx.fill();

        // 5) Вспышка именно в момент ZA WARUDO.
        if (t < 180) {
            ctx.globalAlpha = (1 - t / 180) * 0.32;
            ctx.fillStyle = "#fffbe5";
            ctx.fillRect(0, 0, 400, 500);
        }
        ctx.restore();

        // 6) Тонкая золотая рамка, а не толстый UI-оверлей.
        ctx.globalAlpha = 0.22 + pulse * 0.08;
        ctx.strokeStyle = "#ffe98a";
        ctx.shadowColor = "#d8b84d";
        ctx.shadowBlur = 14;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(5, 5, 390, 490);

        // 7) Только на старте — узнаваемый крик. Не держим текст 2.5 секунды.
        if (t < 650) {
            var textA = Math.max(0, Math.min(1, (650 - t) / 180));
            ctx.globalAlpha = textA;
            ctx.textAlign = "center";
            ctx.font = "900 27px Arial Black, Arial, sans-serif";
            ctx.fillStyle = "#fff7c7";
            ctx.shadowColor = "#c99a2e";
            ctx.shadowBlur = 18;
            ctx.fillText("ZA WARUDO!", 200, 62);
            ctx.font = "900 10px monospace";
            ctx.fillStyle = "#d7fff2";
            ctx.shadowBlur = 8;
            ctx.fillText("TOKI YO TOMARE", 200, 78);
        }

        ctx.restore();
    }

    // === СИЛУЭТ THE WORLD ===
    if (_superState.dioStandFlash > 0) {
        ctx.save();
        var sa = Math.min(1, _superState.dioStandFlash * 1.8);
        var standPulse = 1 + Math.sin(now / 52) * 0.045;
        ctx.globalAlpha = sa;
        ctx.translate(_superState.dioStandX, _superState.dioStandY - 35);
        ctx.scale(standPulse, standPulse);
        ctx.globalCompositeOperation = "lighter";

        ctx.shadowColor = "#b57aff";
        ctx.shadowBlur = 32;
        ctx.fillStyle = "rgba(247,247,255,.92)";
        ctx.strokeStyle = "#e4d0ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 27, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Голова / глаза / золотая броня.
        ctx.fillStyle = "#b99cff";
        ctx.fillRect(-21, -15, 42, 9);
        ctx.fillStyle = "#17111f";
        ctx.fillRect(-12, -2, 7, 4);
        ctx.fillRect(5, -2, 7, 4);
        ctx.fillStyle = "#f0d66d";
        ctx.fillRect(-16, 12, 32, 7);
        ctx.strokeStyle = "#fff2a5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 23); ctx.lineTo(15, 23);
        ctx.stroke();

        // Кулаки/ореол.
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = sa * 0.7;
        ctx.beginPath(); ctx.arc(-35, 7, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(35, 7, 7, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }
}
