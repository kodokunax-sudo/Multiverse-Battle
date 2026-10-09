// DIO OVER HEAVEN — отдельный модуль.
// Зависит от общих игровых контекстов, которые объявляет supers.js.
// Содержимое перенесено без изменения логики, чтобы сохранить текущее поведение.

// ★ DIO OH: отдельные, заранее загружаемые звуки для подготовки и остановки времени.
var _dioAudioCache = {};
var _dioMusicDuckState = [];
var _dioMusicResumeAttemptedAudio = null;
// A rolling cap prevents fast multi-hit bosses from instantly filling DIO's meter.
var DIO_ENERGY_GAIN_PER_SECOND = 8;
var _dioEnergyGainEvents = [];

function dioSoundKey(path) {
    if (path === "music/dios-time-stop-teleportation-sound-effect-1.mp3") return "dioTeleport";
    if (path === "music/za-warudo-time-stop-louder.mp3") return "dioTimeStop";
    if (path === "music/time-resumes.mp3") return "dioTimeResume";
    return null;
}
function dioResolveSoundSource(path) {
    try {
        var key = dioSoundKey(path);
        var track = key && typeof window.getLoadedMusic === "function" ? window.getLoadedMusic(key) : null;
        if (track && track.url) return track.url;
    } catch (e) {}
    return path;
}
function dioPrepareSound(path) {
    var audio = _dioAudioCache[path];
    var source = dioResolveSoundSource(path);
    if (!audio) {
        audio = new Audio();
        audio.preload = "auto";
        _dioAudioCache[path] = audio;
    }
    try {
        var oldSource = audio.getAttribute ? audio.getAttribute("src") : "";
        if (!oldSource || oldSource !== source) {
            audio.src = source;
            audio.load();
        }
        audio.defaultPlaybackRate = 1;
        audio.playbackRate = 1;
    } catch (e) {}
    return audio;
}
function preloadDioSounds() {
    var files = [
        "music/za-warudo-time-stop-louder.mp3",
        "music/dios-time-stop-teleportation-sound-effect-1.mp3"
    ];
    for (var i = 0; i < files.length; i++) {
        try {
            var audio = dioPrepareSound(files[i]);
            audio.volume = 0.72;
        } catch (e) {}
    }
}
function dioPlaySound(path, volume) {
    try {
        var audio = dioPrepareSound(path);
        // Invalidate any delayed silent-prime callback before starting the real cue.
        audio._dioPlaybackToken = (audio._dioPlaybackToken || 0) + 1;
        // Never inherit slow playback from another effect. Every DIO cue is real-time.
        audio.defaultPlaybackRate = 1;
        audio.playbackRate = 1;
        audio.pause();
        audio.muted = false;
        audio.currentTime = 0;
        audio.volume = (typeof volume === "number") ? Math.max(0, Math.min(1, volume)) : 0.72;
        var p = audio.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
        return audio;
    } catch (e) { return null; }
}

function dioPrimeSoundForGesture(path, restoreVolume) {
    try {
        var audio = dioPrepareSound(path);
        if (audio._dioGesturePrimed || audio._dioPrimePending || audio.readyState < 2) return;
        var wantedVolume = (typeof restoreVolume === "number") ? restoreVolume : 0.72;
        var token = (audio._dioPlaybackToken || 0) + 1;
        audio._dioPlaybackToken = token;
        audio._dioPrimePending = true;
        // Use the muted flag, not volume=0, so the delayed ZA WARUDO track can
        // be unlocked for mobile browsers without leaking even a fraction of audio.
        audio.muted = true;
        audio.volume = wantedVolume;
        try { audio.currentTime = 0; } catch (e) {}
        var p = audio.play();
        if (p && typeof p.then === "function") {
            p.then(function () {
                // A late unlock callback must never pause or mute a real cue.
                if (audio._dioPlaybackToken !== token) return;
                audio.pause();
                try { audio.currentTime = 0; } catch (e) {}
                audio.muted = false;
                audio.volume = wantedVolume;
                audio._dioGesturePrimed = true;
                audio._dioPrimePending = false;
            }).catch(function () {
                if (audio._dioPlaybackToken === token) {
                    audio.muted = false;
                    audio.volume = wantedVolume;
                }
                audio._dioPrimePending = false;
            });
        } else {
            if (audio._dioPlaybackToken === token) {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = false;
                audio.volume = wantedVolume;
                audio._dioGesturePrimed = true;
            }
            audio._dioPrimePending = false;
        }
    } catch (e) {}
}
function dioCollectBackgroundMusic() {
    var found = [];
    function add(audio, includePaused) {
        if (!audio || typeof audio.volume !== "number" || typeof audio.play !== "function") return;
        if (!includePaused && audio.paused) return;
        if (Object.keys(_dioAudioCache).some(function (path) { return _dioAudioCache[path] === audio; })) return;
        if (found.indexOf(audio) < 0) found.push(audio);
    }
    // Current game soundtrack, plus boss tracks if that mode exposes them globally.
    try { if (typeof currentMusic !== "undefined") add(currentMusic, true); } catch (e) {}
    try { if (typeof mainMusic !== "undefined") add(mainMusic, false); } catch (e) {}
    try { if (typeof battleMusic !== "undefined") add(battleMusic, false); } catch (e) {}
    try { if (typeof shopMusic !== "undefined") add(shopMusic, false); } catch (e) {}
    try { if (typeof waystarMusic !== "undefined") add(waystarMusic, false); } catch (e) {}
    try { if (typeof qteMusic !== "undefined") add(qteMusic, false); } catch (e) {}
    try { if (typeof lsMusic !== "undefined") add(lsMusic, false); } catch (e) {}
    try { if (typeof rwbMusic !== "undefined") add(rwbMusic, false); } catch (e) {}
    try { add(window.waystarMusic, false); } catch (e) {}
    return found;
}
function dioSyncAudioMix() {
    var stopped = isDioTimeStopped();
    // Keep DIO's two sound effects at normal speed and at their chosen cue volume.
    for (var path in _dioAudioCache) {
        var effect = _dioAudioCache[path];
        if (!effect) continue;
        try {
            effect.defaultPlaybackRate = 1;
            if (effect.playbackRate !== 1) effect.playbackRate = 1;
        } catch (e) {}
    }

    if (stopped) {
        // If the selected soundtrack was accidentally left paused while music is
        // enabled, try to resume that same track rather than replacing it.
        try {
            var selectedMusic = (typeof currentMusic !== "undefined") ? currentMusic : null;
            var musicCanPlay = (typeof musicEnabled === "undefined" || musicEnabled);
            if (selectedMusic && musicCanPlay && selectedMusic.paused &&
                _dioMusicResumeAttemptedAudio !== selectedMusic) {
                _dioMusicResumeAttemptedAudio = selectedMusic;
                var musicPromise = selectedMusic.play();
                if (musicPromise && typeof musicPromise.catch === "function") musicPromise.catch(function () {});
            }
        } catch (e) {}
        var music = dioCollectBackgroundMusic();
        for (var i = 0; i < music.length; i++) {
            var audio = music[i], entry = null;
            for (var j = 0; j < _dioMusicDuckState.length; j++) {
                if (_dioMusicDuckState[j].audio === audio) { entry = _dioMusicDuckState[j]; break; }
            }
            if (!entry) {
                entry = { audio: audio, volume: audio.volume };
                _dioMusicDuckState.push(entry);
            }
            var quietVolume = Math.max(0, Math.min(1, entry.volume * 0.15));
            if (Math.abs(audio.volume - quietVolume) > 0.005) audio.volume = quietVolume;
        }
    } else {
        _dioMusicResumeAttemptedAudio = null;
        if (_dioMusicDuckState.length) {
            for (var k = 0; k < _dioMusicDuckState.length; k++) {
                try { _dioMusicDuckState[k].audio.volume = _dioMusicDuckState[k].volume; } catch (e) {}
            }
            _dioMusicDuckState = [];
        }
    }
}
window.preloadDioSounds = preloadDioSounds;
preloadDioSounds();

// Красное сердце DIO и маленькое декоративное сердце THE WORLD.
// Декоративный элемент не участвует в хитбоксах, уроне или управлении.
function drawDioHeartVisual(targetCtx, x, y, size) {
    if (!targetCtx) return false;
    var hs = Math.max(0.5, (Number(size) || 14) / 14);
    targetCtx.save();
    targetCtx.translate(Number(x) || 0, Number(y) || 0);
    targetCtx.scale(hs, hs);
    var heartPath = function() {
        targetCtx.beginPath();
        targetCtx.moveTo(0, 6);
        targetCtx.bezierCurveTo(-2, 4, -9, -1, -9, -5);
        targetCtx.bezierCurveTo(-9, -11, -2, -12, 0, -7);
        targetCtx.bezierCurveTo(2, -12, 9, -11, 9, -5);
        targetCtx.bezierCurveTo(9, -1, 2, 4, 0, 6);
        targetCtx.closePath();
    };
    targetCtx.shadowColor = "#ff1f35";
    targetCtx.shadowBlur = 9;
    var mainGrad = targetCtx.createLinearGradient(-7, -10, 7, 7);
    mainGrad.addColorStop(0, "#ff6472");
    mainGrad.addColorStop(0.42, "#ed1235");
    mainGrad.addColorStop(1, "#780018");
    targetCtx.fillStyle = mainGrad;
    heartPath(); targetCtx.fill();
    targetCtx.shadowBlur = 0;
    targetCtx.strokeStyle = "#510014";
    targetCtx.lineWidth = 1.1;
    heartPath(); targetCtx.stroke();
    targetCtx.fillStyle = "rgba(255,245,195,.9)";
    targetCtx.beginPath();
    targetCtx.ellipse(-3.5, -6.5, 1.7, 2.4, -0.5, 0, Math.PI * 2);
    targetCtx.fill();

    // Маленькое сердце-стенд рядом с основным — чисто косметика.
    targetCtx.save();
    targetCtx.translate(13, -5);
    targetCtx.scale(0.56, 0.56);
    targetCtx.shadowColor = "#d7b6ff";
    targetCtx.shadowBlur = 11;
    var standGrad = targetCtx.createLinearGradient(-7, -10, 7, 7);
    standGrad.addColorStop(0, "#fff0a0");
    standGrad.addColorStop(0.4, "#c9a2ff");
    standGrad.addColorStop(1, "#6044a5");
    targetCtx.fillStyle = standGrad;
    heartPath(); targetCtx.fill();
    targetCtx.strokeStyle = "rgba(255,239,165,.95)";
    targetCtx.lineWidth = 1.2;
    heartPath(); targetCtx.stroke();
    targetCtx.restore();
    targetCtx.restore();
    return true;
}
window.drawDioHeartVisual = drawDioHeartVisual;
// Круг инверсии идёт от сердца наружу в течение двух секунд перед остановкой времени.
function dioIsWindupActive() {
    return typeof _superState !== "undefined" &&
        (_superState.dioTimeStopWindupUntil || 0) > performance.now();
}
window.dioIsWindupActive = dioIsWindupActive;

var DIO_TIME_STOP_WIPE_DURATION_MS = 1800; // The ring reaches the arena edges in 1.8 seconds.
function dioShouldFreezeEntity(entity) {
    if (!entity) return false;
    var windup = dioIsWindupActive();
    if (!windup) {
        if (!isDioTimeStopped()) {
            try { delete entity._dioWaveFrozen; } catch (e) { entity._dioWaveFrozen = false; }
        }
        return false;
    }
    if (entity._dioWaveFrozen) return true;
    var bossCtx = (typeof getBossContext === "function") ? getBossContext() : null;
    if (!bossCtx || typeof bossCtx.getHeartX !== "function" || typeof bossCtx.getHeartY !== "function") return false;
    var cx = Number(bossCtx.getHeartX()) || 0, cy = Number(bossCtx.getHeartY()) || 0;
    var ex = Number(entity.x) || 0, ey = Number(entity.y) || 0;
    var extent = Math.max(0, Number(entity.radius) || Number(entity.size) || Number(entity.width) || 0);
    var maxRadius = Math.hypot(Math.max(cx, 400 - cx), Math.max(cy, 500 - cy));
    var startedAt = Number(_superState.dioTimeStopWindupStartedAt) || performance.now();
    var progress = Math.max(0, Math.min(1, (performance.now() - startedAt) / DIO_TIME_STOP_WIPE_DURATION_MS));
    var waveRadius = maxRadius * progress;
    if (Math.hypot(ex - cx, ey - cy) <= waveRadius + extent) {
        entity._dioWaveFrozen = true;
        return true;
    }
    return false;
}
window.dioShouldFreezeEntity = dioShouldFreezeEntity;

var _dioOverlayRaf = 0;
function dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks) {
    if (overlay) overlay.style.display = "none";
    if (ring) ring.style.display = "none";
    if (halo) halo.style.display = "none";
    if (flash) flash.style.display = "none";
    if (streaks) streaks.style.display = "none";
}
function dioSyncTimeStopOverlay() {
    try {
        var base = (typeof ctx !== "undefined" && ctx && ctx.canvas) ? ctx.canvas : document.getElementById("arenaCanvas");
        var windup = dioIsWindupActive();
        var active = isDioTimeStopped();
        var dioMode = isDioOverHeavenMain();
        var wipeActive = !!(_superState && _superState.dioTimeStopWipeActive);
        var audioPending = !!(_superState && _superState.dioTimeStopAudioPending);
        var revealInProgress = dioMode && !audioPending && (windup || wipeActive);
        var overlay = document.getElementById("dioTimeStopInvertCanvas");
        var ring = document.getElementById("dioTimeStopWipeRing");
        var halo = document.getElementById("dioTimeStopWipeHalo");
        var streaks = document.getElementById("dioTimeStopWipeStreaks");
        var flash = document.getElementById("dioTimeStopWipeFlash");

        // Duck only the background soundtrack; do not pause it or slow any effect.
        dioSyncAudioMix();

        if (!base || !dioMode) {
            if (_superState) {
                _superState.dioTimeStopWipeActive = false;
                _superState.dioTimeStopWipeFinishQueued = false;
            }
            if (base && base.style) base.style.filter = "";
            dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks);
            return;
        }

        // Crucial: while the circle is travelling, the real canvas stays untouched.
        // The inverted snapshot is revealed ONLY inside the moving circular mask.
        if (base.style) base.style.filter = (active && !revealInProgress) ? "invert(1)" : "";

        if (!revealInProgress) {
            dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks);
            return;
        }

        if (!overlay) {
            overlay = document.createElement("canvas");
            overlay.id = "dioTimeStopInvertCanvas";
            overlay.style.cssText = "position:fixed;pointer-events:none;z-index:99998;display:none;filter:invert(1);will-change:clip-path;";
            document.body.appendChild(overlay);
        }
        if (!halo) {
            halo = document.createElement("div");
            halo.id = "dioTimeStopWipeHalo";
            halo.style.cssText = "position:fixed;pointer-events:none;z-index:99999;display:none;border:1px solid rgba(174,119,255,.85);border-radius:50%;box-shadow:0 0 30px 8px rgba(174,119,255,.28),0 0 16px 3px rgba(255,220,100,.42);mix-blend-mode:screen;";
            document.body.appendChild(halo);
        }
        if (!streaks) {
            streaks = document.createElement("div");
            streaks.id = "dioTimeStopWipeStreaks";
            streaks.style.cssText = "position:fixed;pointer-events:none;z-index:99999;border-radius:50%;display:none;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,0) 0deg,rgba(255,247,207,0) 8deg,rgba(255,241,174,.75) 9deg,rgba(185,128,255,0) 11deg,rgba(125,248,209,0) 18deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 26px),#000 calc(100% - 7px));mask:radial-gradient(farthest-side,transparent calc(100% - 26px),#000 calc(100% - 7px));filter:drop-shadow(0 0 8px rgba(255,241,174,.8));mix-blend-mode:screen;will-change:transform;";
            document.body.appendChild(streaks);
        }
        if (!ring) {
            ring = document.createElement("div");
            ring.id = "dioTimeStopWipeRing";
            ring.style.cssText = "position:fixed;pointer-events:none;z-index:100000;display:none;border-radius:50%;background:conic-gradient(from 0deg,#ffffff 0deg,#ffe889 42deg,#ffb844 85deg,#bb83ff 130deg,#7df8d1 185deg,rgba(125,248,209,.12) 222deg,transparent 260deg,#ffe889 310deg,#ffffff 360deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 5px));mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 5px));filter:drop-shadow(0 0 7px rgba(255,236,151,.95)) drop-shadow(0 0 17px rgba(186,130,255,.8));mix-blend-mode:screen;will-change:transform;";
            document.body.appendChild(ring);
        }
        if (!flash) {
            flash = document.createElement("div");
            flash.id = "dioTimeStopWipeFlash";
            flash.style.cssText = "position:fixed;pointer-events:none;z-index:100001;display:none;background:rgba(255,247,215,.88);opacity:0;transition:opacity 120ms linear;mix-blend-mode:screen;";
            document.body.appendChild(flash);
        }

        var rect = base.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks);
            return;
        }
        flash.style.left = rect.left + "px";
        flash.style.top = rect.top + "px";
        flash.style.width = rect.width + "px";
        flash.style.height = rect.height + "px";

        var pixelWidth = base.width || 400;
        var pixelHeight = base.height || 500;
        if (overlay.width !== pixelWidth) overlay.width = pixelWidth;
        if (overlay.height !== pixelHeight) overlay.height = pixelHeight;

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

        // The same 1.35-second clock drives the visible wave and the time-stop trigger.
        // This keeps the ZA WARUDO cue locked to the exact moment the wipe reaches the edges.
        var startedAt = Number(_superState.dioTimeStopWindupStartedAt) || 0;
        var progress = startedAt > 0
            ? Math.max(0, Math.min(1, (performance.now() - startedAt) / DIO_TIME_STOP_WIPE_DURATION_MS))
            : (windup ? Math.max(0, Math.min(1, 1 - ((_superState.dioTimeStopWindupUntil - performance.now()) / DIO_TIME_STOP_WIPE_DURATION_MS))) : 1);

        var maxRadius = Math.hypot(
            Math.max(cx, rect.width - cx),
            Math.max(cy, rect.height - cy)
        );
        var radius = Math.max(1, maxRadius * progress);
        if (progress >= 1) radius = maxRadius + 3;

        // The inverted area and the animated energy edge share one expanding radius.
        overlay.style.clipPath = "circle(" + radius + "px at " + cx + "px " + cy + "px)";
        var diameter = radius * 2;
        var ringLeft = rect.left + cx - radius;
        var ringTop = rect.top + cy - radius;

        halo.style.display = "block";
        halo.style.width = (diameter + 14) + "px";
        halo.style.height = (diameter + 14) + "px";
        halo.style.left = (ringLeft - 7) + "px";
        halo.style.top = (ringTop - 7) + "px";
        halo.style.opacity = String(0.65 + Math.sin(progress * Math.PI * 8) * 0.2);

        streaks.style.display = "block";
        streaks.style.width = (diameter + 24) + "px";
        streaks.style.height = (diameter + 24) + "px";
        streaks.style.left = (ringLeft - 12) + "px";
        streaks.style.top = (ringTop - 12) + "px";
        streaks.style.transform = "rotate(" + (-performance.now() * 0.34) + "deg)";
        streaks.style.opacity = String(0.75 + Math.sin(progress * Math.PI * 10) * 0.2);

        ring.style.display = "block";
        ring.style.width = diameter + "px";
        ring.style.height = diameter + "px";
        ring.style.left = ringLeft + "px";
        ring.style.top = ringTop + "px";
        ring.style.transform = "rotate(" + (performance.now() * 0.22) + "deg)";
        ring.style.opacity = String(Math.max(0.6, 1 - progress * 0.18));

        // A short anime-style white impact flash fires exactly when the wipe closes.
        // Guard it with the finish flag so it only fires once.
        if (progress >= 1 && wipeActive && !_superState.dioTimeStopWipeFinishQueued) {
            _superState.dioTimeStopWipeFinishQueued = true;
            flash.style.display = "block";
            flash.style.opacity = "0.48";
            requestAnimationFrame(function () {
                if (flash) flash.style.opacity = "0";
            });
            setTimeout(function () {
                if (flash) flash.style.display = "none";
            }, 150);
            // Keep the completed inverted arena visible until the 2-second
            // activation point. The timeout below ends the wipe when time stops.
            if (isDioTimeStopped() && _superState.dioTimeStopWipeActive) {
                _superState.dioTimeStopWipeActive = false;
                _superState.dioTimeStopWipeFinishQueued = false;
                dioSyncTimeStopOverlay();
            }
        }
    } catch (e) {}
}
function dioStartOverlayLoop() {
    if (_dioOverlayRaf || typeof requestAnimationFrame !== "function") return;
    var tick = function() {
        _dioOverlayRaf = 0;
        dioSyncTimeStopOverlay();
        if (dioIsWindupActive() || isDioTimeStopped() || (_superState && _superState.dioTimeStopWipeActive)) {
            _dioOverlayRaf = requestAnimationFrame(tick);
        }
    };
    _dioOverlayRaf = requestAnimationFrame(tick);
}

function dioAddEnergy(amount) {
    if (!isDioOverHeavenMain() || typeof _superState === "undefined") return;
    var requested = Math.max(0, Number(amount) || 0);
    if (!requested) return;

    // Sliding one-second window: never create more than 8 energy per real second,
    // regardless of damage spikes, multi-hit effects, or overlapping callbacks.
    var now = performance.now();
    while (_dioEnergyGainEvents.length && now - _dioEnergyGainEvents[0].time >= 1000) {
        _dioEnergyGainEvents.shift();
    }
    var used = 0;
    for (var i = 0; i < _dioEnergyGainEvents.length; i++) used += _dioEnergyGainEvents[i].amount;
    var allowed = Math.min(requested, Math.max(0, DIO_ENERGY_GAIN_PER_SECOND - used));
    if (allowed <= 0) return;

    var current = Math.max(0, Number(_superState.dioEnergy) || 0);
    _superState.dioEnergy = Math.min(100, current + allowed);
    // Consume the budget even when the meter is full, preventing instant refill
    // after spending a skill immediately following a capped hit.
    _dioEnergyGainEvents.push({ time: now, amount: allowed });
}
window.dioAddEnergy = dioAddEnergy;

function dioTrackBossDamage(ctxB) {
    if (!isDioOverHeavenMain() || !ctxB || typeof _superState === "undefined") return;
    var hp = Number(ctxB.getBossHp());
    if (!isFinite(hp)) return;
    var type = ctxB.type || "unknown";
    if (_superState.dioEnergyBossType !== type || typeof _superState.dioEnergyLastBossHp !== "number") {
        _superState.dioEnergyBossType = type;
        _superState.dioEnergyLastBossHp = hp;
        return;
    }
    var delta = _superState.dioEnergyLastBossHp - hp;
    if (delta > 0 && type !== "arena") {
        // Charge by the fraction of the boss's health bar removed, not raw damage.
        // A complete boss health bar is worth 35 energy; the rolling cap limits bursts.
        var maxHp = 0;
        try { maxHp = Number(ctxB.getBossMaxHp()); } catch (e) {}
        if (isFinite(maxHp) && maxHp > 0) {
            dioAddEnergy(Math.min(35, (delta / maxHp) * 35));
        }
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

    // Main DIO activation may have played the cue before the wipe.
    // Keep skipSound for callers that intentionally pre-play the sound.
    dioSyncAudioMix();
    if (!skipSound) {
        dioPlaySound(
            teleportStyle
                ? "music/dios-time-stop-teleportation-sound-effect-1.mp3"
                : "music/za-warudo-time-stop-louder.mp3",
            teleportStyle ? 0.72 : 0.86
        );
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
    if (dioIsWindupActive() || isDioTimeStopped() ||
        (_superState && _superState.dioTimeStopAudioPending)) return;
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("timeStop", 40, 25)) return;

    var startedAt = performance.now();
    var sequenceToken = (_superState.dioTimeStopSequenceToken || 0) + 1;
    _superState.dioTimeStopSequenceToken = sequenceToken;

    // The ZA WARUDO track starts immediately. The ring expands for 1.8 seconds,
    // and time stops the instant the wave reaches the arena edges.
    _superState.dioTimeStopAudioPending = false;
    _superState.dioTimeStopWindupStartedAt = startedAt;
    _superState.dioTimeStopWindupUntil = startedAt + DIO_TIME_STOP_WIPE_DURATION_MS;
    _superState.dioTimeStopWipeDurationMs = DIO_TIME_STOP_WIPE_DURATION_MS;
    _superState.dioTimeStopWipeActive = true;
    _superState.dioTimeStopWipeFinishQueued = false;
    if (typeof heart !== "undefined" && heart) { heart.vx = 0; heart.vy = 0; }

    dioPlaySound("music/za-warudo-time-stop-louder.mp3", 0.86);
    dioStartOverlayLoop();

    setTimeout(function () {
        if (!_superState || _superState.dioTimeStopSequenceToken !== sequenceToken) return;
        if (!(_superState.dioTimeStopWindupUntil || 0)) return;

        _superState.dioTimeStopWindupUntil = 0;
        _superState.dioTimeStopWipeActive = false;
        _superState.dioTimeStopWipeFinishQueued = false;

        if (!isDioOverHeavenMain() || !getBossContext()) {
            dioSyncTimeStopOverlay();
            return;
        }

        // Sound already started at the click, so never replay it here.
        dioStartTimeStop(6, false, true);
        dioStartOverlayLoop();
    }, Math.max(0, DIO_TIME_STOP_WIPE_DURATION_MS - (performance.now() - startedAt)));
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
    // Play the dedicated teleport cue immediately, then start the short teleport stop without duplicating it.
    dioPlaySound("music/dios-time-stop-teleportation-sound-effect-1.mp3", 0.72);
    dioStartTimeStop(0.5, true, true);
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
    dioSyncAudioMix();
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
