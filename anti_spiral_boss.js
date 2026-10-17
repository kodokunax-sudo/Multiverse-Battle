// ============================================================
// АНТИ-СПИРАЛЬ — УНИКАЛЬНЫЙ БОСС 1500 ВОЛНЫ
// Отдельный бой по архитектуре Путеводной Звезды / Живого Камня / RWB.
// ============================================================
(function () {
    if (window._antiSpiralBossLoaded) return;
    window._antiSpiralBossLoaded = true;

    let asActive = false;
    let asState = "idle";
    let asAnimFrame = null;
    let asMusic = null;
    let asMusicSource = null;
    let asMusicFallbackTried = false;
    let asMusicFallbackSource = null;
    let asBossHp = 0;
    let asBossMaxHp = 0;
    let asPlayerHp = 220;
    let asPlayerMaxHp = 220;
    let asPlayer = { x: 200, y: 430, vx: 0, vy: 0, size: 12, invuln: 0, grounded: true };
    let asBoss = { x: 200, y: 135, size: 48, rotation: 0, pulse: 0, flash: 0 };
    let asAttacks = [];
    let asParticles = [];
    let asTexts = [];
    let asKeys = Object.create(null);
    let asPointer = { down: false, x: 0, y: 0, id: null };
    let asPointerChargeMode = false;
    let asPlatforms = [];
    let asSeals = [];
    let asDrillShots = [];
    let asChargeFrames = 0;
    let asCharging = false;
    let asLastDamageAt = 0;
    let asNextShotAt = 0;
    let asMiniCooldownUntil = 0;
    let asMiniStartedAt = 0;
    let asMiniIntroUntil = 0;
    let asMiniNextGravityAt = 0;
    let asMiniGravityIndex = 0;
    let asMiniCollected = 0;
    let asMiniSpirals = [];
    let asMiniReturnPlayer = null;
    let asReassemblyEffectUntil = 0;
    let asBossExposed = 0;
    let asLabyrinthTimer = 0;
    let asUltimateActive = false;
    let asPatternSpawned = false;
    let asControls = null;
    let asHintElement = null;
    let asOriginalHint = "";
    let asShake = 0;
    let asFlash = 0;
    let asFlashColor = "#ffffff";
    let asFrame = 0;
    let asPattern = 0;
    let asPatternTimer = 0;
    let asLastArenaShift = 0;
    let asArenaWidth = 400;
    let asArenaHeight = 470;
    let asTargetWidth = 400;
    let asTargetHeight = 470;
    let asGravityPull = 0.10;
    let asGravityDirection = 0; // 0 вниз, 1 влево, 2 вверх, 3 вправо
    let asGravityNextShiftAt = 0;
    let asGravityTransitionUntil = 0;
    let asBossApproachFrames = 0;
    const asGravityLabels = ["ВНИЗ", "ВЛЕВО", "ВВЕРХ", "ВПРАВО"];
    let asLastShot = 0;
    let asLastAttackSoundAt = 0;
    let asCinematicMusicTimer = null;
    let asWinPending = false;
    let asDefeatPending = false;
    let asBossDamageFlash = 0;
    let asPhase = 1;
    let asCinematicStart = 0;
    let asCinematicRedHeart = { x: -25, y: 410 };
    let asCinematicArenaProgress = 0;

    // Приёмы из ТВ-финала: лабиринт, манипуляции пространством/вероятностью,
    // рукопашные атаки Грандзебомы и её финальный залп.
    const patterns = [
        "ЗАЛП АНТИ-СПИРАЛИ",
        "МНОГОКРАТНЫЙ УДАР ГРАНДЗЕБОМОЙ",
        "АНТИ-СПИРАЛЬНЫЙ ШТОРМ",
        "РАЗРЕЗ ПРОСТРАНСТВА",
        "МУЛЬТИВСЕЛЕНСКИЙ ЛАБИРИНТ",
        "ГРАВИТАЦИОННЫЙ КОЛЛАПС",
        "СДВИГ ВЕРОЯТНОСТИ",
        "INFINITY BIG BANG STORM"
    ];

    function asCanvas() {
        if (typeof initArena === "function") initArena();
        return typeof canvas !== "undefined" ? canvas : document.getElementById("arenaCanvas");
    }
    function asCtx() { return typeof ctx !== "undefined" ? ctx : (asCanvas() && asCanvas().getContext("2d")); }
    function asFloor() { return 500 - (445 - asArenaHeight) / 2 - asPlayer.size; }
    function asBounds() {
        return {
            left: (400 - asArenaWidth) / 2 + asPlayer.size,
            right: (400 + asArenaWidth) / 2 - asPlayer.size,
            top: 55 + (445 - asArenaHeight) / 2 + asPlayer.size,
            bottom: asFloor()
        };
    }
    function asInitPlatforms() {
        asPlatforms = [
            { baseX: 88,  y: 436, w: 112, h: 10, move: 0, amp: 0, phase: 0 },
            { baseX: 279, y: 379, w: 94,  h: 10, move: 1, amp: 19, phase: 1.4 },
            { baseX: 118, y: 322, w: 88,  h: 10, move: 0, amp: 0, phase: 2.2 },
            { baseX: 276, y: 265, w: 86,  h: 10, move: 1, amp: 25, phase: 3.1 },
            { baseX: 132, y: 208, w: 82,  h: 10, move: 1, amp: 17, phase: 4.4 },
            { baseX: 239, y: 151, w: 76,  h: 10, move: 0, amp: 0, phase: 5.1 }
        ];
    }
    function asInitSeals() {
        asSeals = [
            { x: 88,  y: 348, radius: 13, hp: 100, maxHp: 100, broken: false, phase: 0 },
            { x: 307, y: 247, radius: 13, hp: 100, maxHp: 100, broken: false, phase: 2.1 },
            { x: 133, y: 180, radius: 13, hp: 100, maxHp: 100, broken: false, phase: 4.2 }
        ];
    }
    function asUnbrokenSealIndex() {
        for (let i = 0; i < asSeals.length; i++) if (!asSeals[i].broken) return i;
        return -1;
    }
    function asDrawSeals(c, now) {
        for (let i = 0; i < asSeals.length; i++) {
            const seal = asSeals[i];
            if (seal.broken) continue;
            seal.phase += .035;
            const pulse = 1 + Math.sin(asFrame * .14 + seal.phase) * .12;
            c.save(); c.translate(seal.x, seal.y);
            c.globalAlpha = .76 + Math.sin(asFrame * .11 + seal.phase) * .18;
            c.shadowColor = "#c576ff"; c.shadowBlur = 20;
            c.strokeStyle = "#e5c5ff"; c.lineWidth = 1.8;
            c.beginPath(); c.arc(0, 0, seal.radius * 1.75 * pulse, 0, Math.PI * 2); c.stroke();
            c.rotate(now * .0015 + seal.phase);
            c.strokeStyle = "#8ef4ff"; c.lineWidth = 2;
            c.beginPath(); c.moveTo(0, -seal.radius * pulse); c.lineTo(seal.radius * pulse, 0);
            c.lineTo(0, seal.radius * pulse); c.lineTo(-seal.radius * pulse, 0); c.closePath(); c.stroke();
            c.fillStyle = "#ae62ff"; c.beginPath(); c.arc(0, 0, 4.5 * pulse, 0, Math.PI * 2); c.fill();
            c.restore();
            c.save();
            c.fillStyle = "rgba(0,0,0,.76)"; c.fillRect(seal.x - 19, seal.y + 21, 38, 4);
            c.fillStyle = "#cf8dff"; c.fillRect(seal.x - 19, seal.y + 21, 38 * Math.max(0, seal.hp / seal.maxHp), 4);
            c.fillStyle = "#eaddff"; c.font = "bold 8px monospace"; c.textAlign = "center";
            c.fillText("ПЕЧАТЬ " + (i + 1), seal.x, seal.y + 34);
            c.restore();
        }
    }
    function asPlatformX(platform, index, now) {
        const arenaLeft = (400 - asArenaWidth) / 2;
        let center = platform.baseX;
        if (platform.move) center += Math.sin(now * 0.0012 + platform.phase) * platform.amp;
        if (asLabyrinthTimer > 0 && index > 0 && index < 5) center += Math.sin((asFrame + index * 17) * 0.14) * 14;
        const min = arenaLeft + 8 + platform.w / 2;
        const max = arenaLeft + asArenaWidth - 8 - platform.w / 2;
        return Math.max(min, Math.min(max, center));
    }
    function asPlatformGeometry(platform, index, now) {
        const left = (400 - asArenaWidth) / 2, right = left + asArenaWidth;
        const top = 55 + (445 - asArenaHeight) / 2, height = asArenaHeight, bottom = top + height;
        if (asGravityDirection === 0 || asGravityDirection === 2) {
            const cx = asPlatformX(platform, index, now);
            let y = platform.y;
            if (asGravityDirection === 2) y = top + height - (platform.y - top) - platform.h;
            y = Math.max(top + 12, Math.min(bottom - platform.h - 12, y));
            return { x: cx - platform.w / 2, y: y, w: platform.w, h: platform.h };
        }
        const slot = (index + 1) / (asPlatforms.length + 1);
        const cx = asGravityDirection === 1
            ? left + 24 + slot * (asArenaWidth - 48)
            : right - 24 - slot * (asArenaWidth - 48);
        let cy = top + 30 + ((436 - platform.y) / 285) * (height - 60);
        if (platform.move) cy += Math.sin(now * 0.0012 + platform.phase) * platform.amp;
        if (asLabyrinthTimer > 0 && index > 0 && index < 5) cy += Math.sin((asFrame + index * 17) * 0.14) * 14;
        cy = Math.max(top + platform.w / 2 + 8, Math.min(bottom - platform.w / 2 - 8, cy));
        return { x: cx - platform.h / 2, y: cy - platform.w / 2, w: platform.h, h: platform.w };
    }
    function asSafePlatformIndex() {
        for (let i = 0; i < asAttacks.length; i++) {
            if (asAttacks[i] && asAttacks[i].kind === "bigbang") return asAttacks[i].safePlatformIndex;
        }
        return -1;
    }
    function asPlatformIsVisible(index, now) {
        if (asState === "mini") return false;
        const t = asPatternTimer;
        const safeIndex = asSafePlatformIndex();
        if (asPattern === 7) {
            if (safeIndex === index) return true;
            if (t >= 26 && t <= 105) return false;
            return (index + Math.floor(t / 22)) % 4 !== 0;
        }
        if (asPattern === 3 && asPhase >= 2 && t >= 48 && t <= 104) return false;
        if (asPattern === 2) {
            if (asPhase >= 2 && t >= 62 && t <= 96) return false;
            if (t >= 25 && t <= 120 && (index + Math.floor(t / 17)) % 3 === 0) return false;
        }
        if (asPattern === 4) {
            if (asPhase >= 3 && t >= 68 && t <= 94) return false;
            if ((index + Math.floor(t / 27)) % 3 === 0) return false;
        }
        if (asPattern === 5) {
            if (asPhase >= 2 && t >= 48 && t <= 78) return false;
            if (t >= 24 && t <= 112 && (index + Math.floor(t / 23)) % 2 === 0) return false;
        }
        return true;
    }
    function asApplyLaserBarriers(previousX, previousY, bounds) {
        for (let i = 0; i < asAttacks.length; i++) {
            const a = asAttacks[i];
            if (!a || a.kind !== "barrierLaser" || a.warning > 0 || a.life <= 0) continue;
            const half = (a.thickness || 38) / 2 + asPlayer.size;
            if (a.orientation === "vertical" && asPlayer.y >= bounds.top && asPlayer.y <= bounds.bottom &&
                Math.abs(asPlayer.x - a.x) < half) {
                const side = previousX < a.x || (previousX === a.x && asBoss.x > a.x) ? -1 : 1;
                asPlayer.x = a.x + side * (half + 1);
                asPlayer.vx = 0;
            } else if (a.orientation === "horizontal" && asPlayer.x >= bounds.left && asPlayer.x <= bounds.right &&
                Math.abs(asPlayer.y - a.y) < half) {
                const side = previousY < a.y ? -1 : 1;
                asPlayer.y = a.y + side * (half + 1);
                asPlayer.vy = 0;
            }
        }
    }
    function asTryJump() {
        if (!asActive || asState !== "fight" || !asPlayer.grounded) return;
        const gravity = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}][asGravityDirection];
        asPlayer.vx = -gravity.x * 11.6;
        asPlayer.vy = -gravity.y * 11.6;
        asPlayer.grounded = false;
        asPlayer.platformIndex = null;
        asText(asPlayer.x, asPlayer.y - 20, "ПРЫЖОК!", "#68dcff", 28);
        asSound(420, "sine", 0.12, 0.07);
    }
    // Выстрел использует уже накопленный автоматический заряд. Удерживать кнопку не нужно.
    function asFireDrill() {
        if (!asActive || asState !== "fight") return;
        const now = Date.now();
        if (now < asNextShotAt) {
            asUpdateControls();
            return;
        }
        const frames = asChargeFrames;
        asChargeFrames = 0;
        asCharging = false;
        asNextShotAt = now + 1500;
        asShootDrill(Math.max(8, frames));
        asUpdateControls();
    }
    // Оставлено для совместимости с обработчиками pointer/keyboard старой версии.
    function asStartCharge() { asFireDrill(); }
    function asReleaseCharge() {}
    function asShootDrill(frames) {
        const charge = Math.max(0.04, Math.min(1, frames / 150));
        const sealIndex = asUnbrokenSealIndex();
        const targetSeal = sealIndex >= 0 ? asSeals[sealIndex] : null;
        const targetX = targetSeal ? targetSeal.x : asBoss.x;
        const targetY = targetSeal ? targetSeal.y : asBoss.y + 43;
        const dx = targetX - asPlayer.x;
        const dy = targetY - (asPlayer.y - 5);
        const distance = Math.max(1, Math.hypot(dx, dy));
        const heightBonus = asPlayer.y < 270 ? 1.25 : (asPlayer.y < 350 ? 1.1 : 1);
        const baseDamage = Math.max(1, Math.floor(asBossMaxHp * (0.025 + 0.105 * charge * charge) * heightBonus));
        const level = charge >= 0.8 ? "МАКСИМАЛЬНЫЙ БУР" : charge >= 0.48 ? "МОЩНЫЙ БУР" : charge >= 0.18 ? "СПИРАЛЬНЫЙ БУР" : "СЛАБЫЙ БУР";
        asDrillShots.push({
            x: asPlayer.x, y: asPlayer.y - 5,
            vx: dx / distance * (7 + charge * 4.5),
            vy: dy / distance * (7 + charge * 4.5),
            charge: charge, radius: 4 + charge * 16,
            damage: baseDamage, sealDamage: Math.round(20 + charge * 90),
            targetType: targetSeal ? "seal" : "boss", sealIndex: sealIndex,
            life: 100, phase: 0, level: level
        });
        asText(asPlayer.x, asPlayer.y - 31, targetSeal ? level + " → ПЕЧАТЬ " + (sealIndex + 1) + "/3 · " + Math.round(charge * 100) + "%" : level + " · " + Math.round(charge * 100) + "%", "#74f5ff", 52);
        asShake = Math.max(asShake, 2 + charge * 7);
        asSound(250 + charge * 680, "sawtooth", 0.1 + charge * 0.32, 0.05 + charge * 0.08);
    }
    function asDrawPlatforms(c, now) {
        if (!asPlatforms.length) asInitPlatforms();
        const safeIndex = asSafePlatformIndex();
        for (let i = 0; i < asPlatforms.length; i++) {
            if (!asPlatformIsVisible(i, now) && i !== safeIndex) continue;
            const g = asPlatformGeometry(asPlatforms[i], i, now);
            const safe = i === safeIndex, current = asPlayer.platformIndex === i;
            c.save();
            if (asLabyrinthTimer > 0 && i > 0 && i < 5) {
                c.globalAlpha = 0.18 + Math.abs(Math.sin(asFrame * 0.16 + i)) * 0.12;
                c.strokeStyle = "#d5a8ff"; c.lineWidth = 1.5; c.setLineDash([4, 5]);
                c.strokeRect(g.x - 4, g.y - 4, g.w + 8, g.h + 8); c.setLineDash([]);
            }
            c.shadowColor = safe ? "#76ffff" : current ? "#5adfff" : "#a65dff";
            c.shadowBlur = safe ? 24 : current ? 16 : 10;
            c.fillStyle = safe ? "rgba(104,255,255,.46)" : current ? "rgba(56,190,255,.42)" : "rgba(104,72,170,.48)";
            c.strokeStyle = safe ? "#e8ffff" : current ? "#8ef4ff" : "#bda5ff";
            c.lineWidth = safe ? 2.5 : 1.4;
            c.beginPath();
            if (asGravityDirection % 2 === 0) {
                c.moveTo(g.x + 8, g.y); c.lineTo(g.x + g.w - 8, g.y);
                c.lineTo(g.x + g.w, g.y + g.h); c.lineTo(g.x, g.y + g.h);
            } else {
                c.moveTo(g.x, g.y + 8); c.lineTo(g.x + g.w, g.y);
                c.lineTo(g.x + g.w, g.y + g.h - 8); c.lineTo(g.x, g.y + g.h);
            }
            c.closePath(); c.fill(); c.stroke();
            c.strokeStyle = "rgba(225,248,255,.46)"; c.lineWidth = 1;
            c.beginPath();
            if (asGravityDirection % 2 === 0) {
                c.moveTo(g.x + 12, g.y + g.h - 2); c.lineTo(g.x + g.w - 12, g.y + g.h - 2);
            } else {
                c.moveTo(g.x + 2, g.y + 12); c.lineTo(g.x + g.w - 2, g.y + g.h - 12);
            }
            c.stroke(); c.restore();
        }
    }
    function asCreateControls() {
        const c = asCanvas();
        if (!c || !c.parentNode) return;
        const old = document.getElementById("antiSpiralControls");
        if (old) old.remove();
        const overlay = document.getElementById("arenaOverlay");
        if (overlay) {
            const hintNodes = overlay.querySelectorAll("div");
            for (let hi = 0; hi < hintNodes.length; hi++) {
                if (hintNodes[hi].children.length === 0 && hintNodes[hi].textContent.indexOf("WASD — уклоняться") >= 0) {
                    asHintElement = hintNodes[hi];
                    asOriginalHint = hintNodes[hi].textContent;
                    asHintElement.textContent = "⌨️ WASD / ← → — движение · Z — заряд спирального бура";
                    break;
                }
            }
        }
        const row = document.createElement("div");
        row.id = "antiSpiralControls";
        row.style.cssText = "display:flex;gap:9px;justify-content:center;align-items:stretch;flex-wrap:wrap;width:min(400px,calc(100vw - 24px));margin:7px auto 4px;z-index:5;font-family:Arial,sans-serif;";
        const buttonStyle = "flex:1;min-width:125px;min-height:43px;padding:9px 12px;border:1px solid #5bdcff;border-radius:10px;background:linear-gradient(135deg,#102b51,#241445);color:#fff;font-weight:900;font-size:12px;touch-action:none;user-select:none;-webkit-user-select:none;";
        const jump = document.createElement("button");
        jump.type = "button"; jump.textContent = "⬆ ПРЫЖОК";
        jump.style.cssText = buttonStyle;
        const drill = document.createElement("button");
        drill.type = "button"; drill.textContent = "🌀 БУР 0% · ВЫСТРЕЛ";
        drill.style.cssText = buttonStyle + "border-color:#a988ff;background:linear-gradient(135deg,#133f59,#48206e);";
        jump.addEventListener("pointerdown", function(ev) {
            ev.preventDefault();
            try { jump.setPointerCapture(ev.pointerId); } catch(e) {}
            asTryJump();
        });
        drill.addEventListener("pointerdown", function(ev) {
            ev.preventDefault();
            asFireDrill();
        });
        const hint = document.createElement("div");
        hint.textContent = "WASD / ← → — движение · W / ↑ / ПРОБЕЛ — прыжок · Z/X или кнопка — выстрел. Заряд копится сам после 3 сек. без урона";
        hint.style.cssText = "flex-basis:100%;color:#b8eaff;text-align:center;font-size:10px;line-height:1.35;";
        row.appendChild(jump); row.appendChild(drill); row.appendChild(hint);
        c.parentNode.insertBefore(row, c.nextSibling);
        asControls = { row: row, jump: jump, drill: drill };
    }
    function asUpdateControls() {
        if (!asControls) return;
        const now = Date.now();
        const pct = Math.round(asChargeFrames / 150 * 100);
        const sealIndex = asUnbrokenSealIndex();
        const targetName = sealIndex >= 0 ? "ПЕЧАТЬ " + (sealIndex + 1) + "/3" : "АНТИ-СПИРАЛЬ";
        const cooldownMs = Math.max(0, asNextShotAt - now);
        const damageDelayMs = Math.max(0, 3000 - (now - asLastDamageAt));
        if (cooldownMs > 0) {
            asControls.drill.textContent = "⏳ ПЕРЕЗАРЯДКА " + (cooldownMs / 1000).toFixed(1) + "с · " + pct + "%";
        } else if (damageDelayMs > 0) {
            asControls.drill.textContent = "🌀 " + targetName + " · " + pct + "% · заряд через " + (damageDelayMs / 1000).toFixed(1) + "с";
        } else {
            asControls.drill.textContent = (pct >= 100 ? "💥 МАКС. ЗАРЯД" : "🌀 ЗАРЯД " + pct + "%") + " · ВЫСТРЕЛ";
        }
        const glow = Math.min(1, pct / 100);
        asControls.drill.style.boxShadow = pct > 0
            ? "0 0 " + (5 + glow * 20) + "px rgba(72,220,255," + (0.25 + glow * 0.55) + ")"
            : "none";
        asControls.drill.style.opacity = cooldownMs > 0 ? "0.78" : "1";
    }
    function asText(x, y, text, color, life) {
        asTexts.push({ x:x, y:y, text:text, color:color || "#ffffff", life:life || 50, maxLife:life || 50, vy:-0.7 });
    }
    function asSound(freq, type, duration, volume) {
        try {
            if (typeof playArenaSound === "function") playArenaSound(freq, type || "sine", duration || 0.12, volume || 0.08);
        } catch(e) {}
    }
    function asFallbackMusicSource() {
        if (!asMusic || asMusicFallbackTried || !asMusicFallbackSource) return false;
        if (asMusic.src === asMusicFallbackSource) return false;
        asMusicFallbackTried = true;
        try {
            asMusic.src = asMusicFallbackSource;
            asMusic.load();
            const retry = asMusic.play();
            if (retry && typeof retry.catch === "function") {
                retry.catch(function(err) {
                    console.warn("[ANTI-SPIRAL] Не удалось запустить запасной музыкальный источник.", err);
                });
            }
            return true;
        } catch (err) {
            console.warn("[ANTI-SPIRAL] Ошибка запасного музыкального источника.", err);
            return false;
        }
    }
    function startASMusic() {
        // Как у остальных уникальных боссов: музыка босса запускается при нажатии
        // кнопки боя независимо от musicEnabled (по умолчанию этот флаг false).
        try {
            if (typeof stopAllMusic === "function") stopAllMusic();

            let source = "music/анти спираль.mp3";
            if (typeof window.getLoadedMusic === "function") {
                const loaded = window.getLoadedMusic("antispiral");
                if (loaded && loaded.url) source = loaded.url;
            }

            if (!asMusic || asMusicSource !== source) {
                try { if (asMusic) { asMusic.pause(); asMusic.src = ""; } } catch (e) {}
                asMusic = new Audio(source);
                asMusicSource = source;
                asMusic.loop = true;
                asMusic.volume = 0.45;
                asMusic.preload = "auto";
                asMusic.onerror = function() {
                    console.warn("[ANTI-SPIRAL] Не удалось загрузить музыку:", source);
                };
            }

            asMusic.muted = false;
            asMusic.volume = 0.45;
            asMusic.currentTime = 0;
            const request = asMusic.play();
            if (request && typeof request.catch === "function") {
                request.catch(function(err) {
                    console.warn("[ANTI-SPIRAL] Браузер не запустил музыку:", err);
                });
            }
        } catch (err) {
            console.warn("[ANTI-SPIRAL] Ошибка запуска музыки:", err);
        }
    }
    function stopASMusic() {
        try { if (asMusic) { asMusic.pause(); asMusic.currentTime = 0; } } catch(e) {}
    }
    function asBossHit(damage, message) {
        if (!asActive || asWinPending || asDefeatPending || asState !== "fight" || asState === "victory") return;
        if (asUnbrokenSealIndex() >= 0) {
            asText(200, 120, "ЗАЩИТА АКТИВНА — РАЗРУШЬ 3 ПЕЧАТИ!", "#d5a6ff", 40);
            asSound(120, "sawtooth", .12, .045);
            return;
        }
        let amount = Math.max(1, Math.floor(Number(damage) || 1));
        asBossHp = Math.max(0, asBossHp - amount);
        asBossDamageFlash = 12;
        asShake = Math.max(asShake, 5);
        asFlash = Math.max(asFlash, 3);
        asFlashColor = "#35c9ff";
        asText(asBoss.x, asBoss.y - asBoss.size - 12, "-" + amount, "#8ce8ff", 35);
        if (message) asText(asBoss.x, asBoss.y - asBoss.size - 28, message, "#ffffff", 35);
        for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 1 + Math.random() * 4;
            asParticles.push({x:asBoss.x,y:asBoss.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:22,maxLife:22,color:"#50d6ff",size:2+Math.random()*3});
        }
        asSound(440 + Math.random()*180, "triangle", 0.08, 0.035);
        if (asBossHp <= 0) asWin();
    }
    function asDamagePlayer(damage, label) {
        if (!asActive || asPlayer.invuln > 0 || asState !== "fight" || asState === "victory" || asDefeatPending) return;
        // Boss damage is reduced by 1.5x while keeping every hit at least 1 HP.
        const amount = Math.max(1, Math.floor((Number(damage) || 1) / 1.5));
        asPlayerHp = Math.max(0, asPlayerHp - amount);
        // Полученный урон ставит заряд на паузу на 3 секунды, но накопленная мощь сохраняется.
        asLastDamageAt = Date.now();
        asCharging = false;
        asUpdateControls();
        const hpEl=document.getElementById("arenaHP"); if(hpEl)hpEl.innerText=Math.ceil(asPlayerHp);
        asPlayer.invuln = 42;
        asShake = Math.max(asShake, 10);
        asFlash = 10; asFlashColor = "#1f7bff";
        asText(asPlayer.x, asPlayer.y - 22, (label || "ГРАВИТАЦИОННЫЙ УДАР") + " -" + amount, "#70d9ff", 42);
        asSound(110, "sawtooth", 0.22, 0.09);
        if (asPlayerHp <= 0) asLose();
    }
    function asAddAttack(x, y, vx, vy, size, color, damage, kind) {
        asAttacks.push({x:x,y:y,vx:vx,vy:vy,spd:vx,spdY:vy,size:size||14,color:color||"#3abfff",damage:damage||12,kind:kind||"orb",life:250,phase:Math.random()*6});
        // Short, distinct launch sounds; throttle volleys so simultaneous spheres do not become deafening.
        const soundNow=Date.now();
        if(soundNow-asLastAttackSoundAt>85){
            asLastAttackSoundAt=soundNow;
            if(kind==="spiral")asSound(330+Math.random()*100,"triangle",.11,.035);
            else if(kind==="fall")asSound(175,"sawtooth",.16,.045);
            else if(kind==="orb")asSound(470+Math.random()*100,"sine",.10,.035);
            else asSound(260,"triangle",.11,.035);
        }
    }
    function asShiftGravity(now) {
        asGravityDirection = (asGravityDirection + 1) % 4;
        asGravityNextShiftAt = now + 15000;
        asGravityTransitionUntil = now + 1900;
        asMiniCooldownUntil = Math.max(asMiniCooldownUntil, now + 3500);
        asBossApproachFrames = 0;
        const bounds = asBounds();
        // Не телепортируем игрока: сила тяжести действительно меняет направление.
        if (asGravityDirection === 0) {
            asBoss.x = (bounds.left + bounds.right) / 2; asBoss.y = bounds.top + 32;
        } else if (asGravityDirection === 1) {
            asBoss.x = bounds.right - 28; asBoss.y = (bounds.top + bounds.bottom) / 2 - 43;
        } else if (asGravityDirection === 2) {
            asBoss.x = (bounds.left + bounds.right) / 2; asBoss.y = bounds.bottom - 125;
        } else {
            asBoss.x = bounds.left + 28; asBoss.y = (bounds.top + bounds.bottom) / 2 - 43;
        }
        const g = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}][asGravityDirection];
        asPlayer.vx += g.x * 2.0; asPlayer.vy += g.y * 2.0;
        asPlayer.grounded = false; asPlayer.platformIndex = null;
        asBoss.flash = 0;
        asAttacks = asAttacks.filter(function(a) { return a && a.kind === "gravityTell"; });
        asAttacks.push({ kind: "gravityTell", timer: 90, color: "#ff5adf", damage: asPhase >= 3 ? 24 : 18, phase: 0 });
        asText(200, 112, "ГРАВИТАЦИЯ: " + asGravityLabels[asGravityDirection], "#83f4ff", 90);
        asText(200, 135, "НАПРАВЛЕНИЕ СИЛЫ ТЯЖЕСТИ ИЗМЕНИЛОСЬ!", "#ff9df0", 80);
        asShake = Math.max(asShake, 17);
        asFlash = Math.max(asFlash, 7); asFlashColor = "#763aff";
        asSound(95 + asGravityDirection * 55, "sawtooth", .3, .13);
    }
    function asSpawnPattern(now) {
        const damage = asPhase >= 3 ? 20 : (asPhase >= 2 ? 15 : 11);
        const floor = asFloor();
        const bounds = asBounds();
        if (asPattern === 0) {
            // Спиральный энергетический залп: между встречными потоками есть проходы.
            const base = Math.atan2(asPlayer.y - (asBoss.y + 35), asPlayer.x - asBoss.x) + now * .0018;
            const count = asPhase >= 3 ? 12 : 9;
            for (let i = 0; i < count; i++) {
                const a = base + i * Math.PI * 2 / count;
                asAddAttack(asBoss.x, asBoss.y + 35, Math.cos(a) * (2.25 + asPhase * .3), Math.sin(a) * (2.25 + asPhase * .3), 11 + (i % 3), i % 2 ? "#55d8ff" : "#bb6bff", damage, "spiral");
            }
            if (asPhase >= 2) {
                for (let i = 0; i < 4; i++) {
                    const a = base + Math.PI / 7 + i * Math.PI * 2 / 4;
                    asAddAttack(asBoss.x, asBoss.y + 35, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 7, "#e4fdff", Math.max(6, damage - 4), "spiral");
                }
            }
        } else if (asPattern === 1) {
            // Руки Грандзебомы прочёсывают арену, а затем сам босс запускает преследующие снаряды.
            const firstY = Math.max(bounds.top + 95, Math.min(bounds.bottom - 28, asPlayer.y));
            asAttacks.push({ kind: "sweep", orientation: "horizontal", y: firstY, warning: 46, life: 17, color: "#ff67d8", damage: damage + 2, hit: false });
            if (asPhase >= 2) {
                asAttacks.push({ kind: "sweep", orientation: "horizontal", y: Math.max(bounds.top + 80, bounds.bottom - 82), warning: 74, life: 15, color: "#a66bff", damage: damage, hit: false });
            }
            const aimedAngle=Math.atan2(asPlayer.y-(asBoss.y+35),asPlayer.x-asBoss.x);
            const hunterCount=asPhase>=3?5:3;
            for(let h=0;h<hunterCount;h++){
                const spread=(h-(hunterCount-1)/2)*.2;
                asAddAttack(asBoss.x,asBoss.y+35,Math.cos(aimedAngle+spread)*2.35,Math.sin(aimedAngle+spread)*2.35,12,h%2?"#ff67d8":"#c18aff",damage+2,"orb");
                asAttacks[asAttacks.length-1].homing=true;
                asAttacks[asAttacks.length-1].turnRate=.045;
                asAttacks[asAttacks.length-1].maxSpeed=3.6;
            }
        } else if (asPattern === 2) {
            // Поток анти-спиральной энергии падает по дорожкам, оставляя несколько окон.
            const left = (400 - asArenaWidth) / 2 + 18;
            const width = asArenaWidth - 36;
            const laneCount = 3;
            const safeLane = Math.floor(Math.random() * laneCount);
            for (let i = 0; i < laneCount; i++) {
                const laneX = left + width * (i + .5) / laneCount;
                if (i === safeLane || Math.abs(laneX - asPlayer.x) < 35) continue;
                asAddAttack(laneX, 58, (Math.random() - .5) * .35, 2.4 + Math.random() * .8, 13, "#5bc9ff", damage, "fall");
                if (asAttacks.length) asAttacks[asAttacks.length - 1].warning = 55;
            }
            if (asPhase >= 3) {
                asAttacks.push({ kind: "laser", orientation: "horizontal", x: 0, y: bounds.bottom - 74, warning: 45, life: 16, color: "#ff5cd6", damage: damage + 3, hit: false });
            }
        } else if (asPattern === 3) {
            // Разлом пространства: узкие лучи и массивный лазерный барьер перекрывают путь к боссу.
            const targetX = Math.max(bounds.left + 15, Math.min(bounds.right - 15, asPlayer.x));
            asAttacks.push({ kind: "laser", orientation: "vertical", x: targetX, y: 0, warning: 48, life: 22, color: "#a978ff", damage: damage + 3, hit: false });
            asAttacks.push({ kind: "laser", orientation: "horizontal", x: 0, y: Math.max(bounds.top + 70, Math.min(bounds.bottom - 48, asPlayer.y)), warning: 70, life: 17, color: "#55dcff", damage: damage, hit: false });
            const barrierX = Math.max(bounds.left + 58, Math.min(bounds.right - 58, (asPlayer.x + asBoss.x) * .5));
            asAttacks.push({ kind: "barrierLaser", orientation: "vertical", x: barrierX, y: 0, warning: 62, life: asPhase >= 3 ? 112 : 88, thickness: asPhase >= 3 ? 46 : 38, color: "#ff58e4", damage: damage + 7, hit: false });
            if (asPhase >= 2) {
                asAttacks.push({ kind: "barrierLaser", orientation: "horizontal", x: 0, y: Math.max(bounds.top + 95, Math.min(bounds.bottom - 75, asPlayer.y - 42)), warning: 82, life: 72, thickness: 32, color: "#65eaff", damage: damage + 4, hit: false });
            }
        } else if (asPattern === 4) {
            // Мультивселенский лабиринт: платформы дрожат и оставляют призрачные копии.
            if (asLabyrinthTimer <= 0) {
                asLabyrinthTimer = asPhase >= 3 ? 205 : 175;
                asText(200, 105, "МУЛЬТИВСЕЛЕНСКИЙ ЛАБИРИНТ!", "#d9b5ff", 72);
                asFlash = Math.max(asFlash, 5); asFlashColor = "#8d64ff";
                asSound(120, "sawtooth", .28, .08);
            }
            if (asPhase >= 3) {
                [-64, 64].forEach(function(offset, i) {
                    const x = Math.max(bounds.left + 24, Math.min(bounds.right - 24, asPlayer.x + offset));
                    asAttacks.push({ kind: "mark", x: x, y: Math.max(bounds.top + 75, asPlayer.y), timer: 54 + i * 12, radius: 26, damage: damage, color: i ? "#55e4ff" : "#c17aff", life: 0, hit: false });
                });
            }
        } else if (asPattern === 5) {
            // Сингулярность тянет сердце к центру и затем выбрасывает энергию.
            const wellX = asPlayer.x < 200 ? bounds.left + 74 : bounds.right - 74;
            const wellY = Math.max(bounds.top + 92, Math.min(floor - 100, asPlayer.y - 45));
            asAttacks.push({ kind: "well", x: wellX, y: wellY, warning: 78, warningMax: 78, timer: 112, pullRadius: 320, radius: 100, color: "#bb67ff", damage: damage + 4, life: 0, burst: false, hit: false });
            if (asPhase >= 3) {
                asAttacks.push({ kind: "well", x: bounds.left + (bounds.right - bounds.left) * .5, y: wellY - 28, warning: 96, warningMax: 96, timer: 120, pullRadius: 280, radius: 84, color: "#46d7ff", damage: damage + 2, life: 0, burst: false, hit: false });
            }
        } else if (asPattern === 6) {
            // Сдвиг вероятности: будущие позиции помечаются до того, как пространство взорвётся.
            const count = asPhase >= 3 ? 3 : 2;
            const offsets = count === 3 ? [-75, 0, 75] : [-48, 48];
            for (let i = 0; i < count; i++) {
                const x = Math.max(bounds.left + 20, Math.min(bounds.right - 20, asPlayer.x + offsets[i]));
                asAttacks.push({ kind: "mark", x: x, y: Math.max(bounds.top + 75, Math.min(bounds.bottom - 15, asPlayer.y)), timer: 52 + i * 9, radius: 25 + asPhase * 2, damage: damage + 2, life: 0, hit: false, color: i % 2 ? "#ff66c7" : "#b46cff" });
            }
            // Персонажный приём: босс отмечает сердце и выпускает короткую веерную охоту.
            const aim=Math.atan2(asPlayer.y-(asBoss.y+38),asPlayer.x-asBoss.x);
            for(let h=-1;h<=1;h++){
                asAddAttack(asBoss.x,asBoss.y+38,Math.cos(aim+h*.24)*2.7,Math.sin(aim+h*.24)*2.7,13,h===0?"#ffffff":"#ff66c7",damage+3,"orb");
                asAttacks[asAttacks.length-1].homing=true;
                asAttacks[asAttacks.length-1].turnRate=.055;
                asAttacks[asAttacks.length-1].maxSpeed=4;
            }
        } else {
            // Две галактики сжимаются в шар; затем следует Infinity Big Bang Storm.
            if (asUltimateActive || asPatternSpawned) return;
            asUltimateActive = true;
            asPatternSpawned = true;
            const playerPlatform = asPlayer.platformIndex;
            const safeIndex = playerPlatform !== null && playerPlatform >= 0 && asPlatformIsVisible(playerPlatform, now) ? playerPlatform : 0;
            asAttacks.push({ kind: "bigbang", phase: "charge", timer: 94, life: 0, color: "#d5a0ff", damage: 40 + asPhase * 5, safePlatformIndex: safeIndex, hit: false });
            asText(200, 105, "СЖАТИЕ ДВУХ ГАЛАКТИК!", "#f0caff", 76);
            asSound(68, "sawtooth", .65, .13);
            asShake = Math.max(asShake, 7);
        }
        asSound(asPattern === 1 ? 180 : (asPattern === 3 ? 125 : 300), "sawtooth", asPattern === 3 ? .22 : .14, asPattern >= 3 ? .07 : .055);
    }
    function asShiftArena(now) {
        if (!asLastArenaShift) asLastArenaShift = now;
        if (now - asLastArenaShift < 6200) return;
        asLastArenaShift = now;
        const wide = asArenaWidth < 350;
        asTargetWidth = wide ? 400 : 340;
        asTargetHeight = wide ? 470 : 420;
        asText(200, 85, wide ? "ПРОСТРАНСТВО РАСШИРЯЕТСЯ" : "ГРАВИТАЦИЯ СЖИМАЕТ АРЕНУ", "#67d8ff", 70);
        asShake = 5;
        asSound(wide ? 100 : 160, "sawtooth", 0.3, 0.07);
    }
    function asKeyDown(ev) {
        if (!asActive) return;
        const k = ev.key.toLowerCase();
        if (["arrowleft","arrowright","arrowup","arrowdown"," ","w","a","s","d","enter","z","x"].includes(k)) ev.preventDefault();
        if ((k === "z" || k === "x") && !asKeys[k]) asStartCharge();
        asKeys[k] = true;
        if ((k === "escape" || k === "enter") && asState === "cinematic") { ev.preventDefault(); asFinishCinematic(true); return; }
        if (k === "escape" && asState === "intro") { asStop(); asRestoreStartButton(); }
    }
    function asKeyUp(ev) {
        const k = ev.key.toLowerCase();
        asKeys[k] = false;
        if (k === "z" || k === "x") asReleaseCharge();
    }
    function asPointerDown(ev) {
        if (!asActive) return;
        const c = asCanvas(); if (!c) return;
        const rect = c.getBoundingClientRect();
        const x = (ev.clientX - rect.left) * 400 / rect.width;
        const y = (ev.clientY - rect.top) * 500 / rect.height;
        if (asState === "intro") { asBegin(); return; }
        if (asState === "cinematic") { asFinishCinematic(true); return; }
        if (asState === "mini") {
            asPointer.down = true;
            asPointer.id = ev.pointerId;
            asPointer.x = x;
            asPointer.y = y;
            asPointer.direction = 0;
            if (c.setPointerCapture) { try { c.setPointerCapture(ev.pointerId); } catch(e) {} }
            return;
        }
        if (asState !== "fight") return;
        // Нажатие на босса запускает выстрел накопленной мощью.
        if (Math.hypot(x - asBoss.x, y - (asBoss.y + 36)) < asBoss.size * 1.75) {
            asFireDrill();
            return;
        }
        if (y > 430 && x > 150 && x < 250 && asPlayer.grounded) {
            asTryJump();
            return;
        }
        asPointer.down = true; asPointer.id = ev.pointerId; asPointer.x = x; asPointer.y = y; asPointer.direction = 0;
        if (c.setPointerCapture) { try { c.setPointerCapture(ev.pointerId); } catch(e) {} }
    }
    function asPointerMove(ev) {
        if (!asActive || !asPointer.down || asPointerChargeMode) return;
        const c = asCanvas(); if (!c) return;
        const rect = c.getBoundingClientRect();
        asPointer.x = (ev.clientX - rect.left) * 400 / rect.width;
        asPointer.y = (ev.clientY - rect.top) * 500 / rect.height;
    }
    function asPointerUp(ev) {
        if (asPointer.id !== null && ev.pointerId !== undefined && ev.pointerId !== asPointer.id) return;
        if (asPointerChargeMode) {
            asPointerChargeMode = false;
            asReleaseCharge();
        }
        asPointer.down = false; asPointer.id = null; asPointer.direction = 0;
    }
    function asBind() {
        const c=asCanvas(); if(!c) return false;
        c.addEventListener("pointerdown",asPointerDown);
        c.addEventListener("pointermove",asPointerMove);
        c.addEventListener("pointerup",asPointerUp);
        c.addEventListener("pointercancel",asPointerUp);
        window.addEventListener("keydown",asKeyDown,{passive:false});
        window.addEventListener("keyup",asKeyUp);
        return true;
    }
    function asUnbind() {
        const c=asCanvas();
        if(c) {
            c.removeEventListener("pointerdown",asPointerDown);
            c.removeEventListener("pointermove",asPointerMove);
            c.removeEventListener("pointerup",asPointerUp);
            c.removeEventListener("pointercancel",asPointerUp);
        }
        window.removeEventListener("keydown",asKeyDown);
        window.removeEventListener("keyup",asKeyUp);
        asKeys=Object.create(null); asPointer.down=false; asPointer.id=null;
        asPointerChargeMode=false; asCharging=false; asChargeFrames=0;
    }
    function asBegin() {
        if(!asActive || asState==="fight") return;
        asState="fight"; asPatternTimer=0; asLastArenaShift=Date.now();
        asGravityDirection=0; asGravityNextShiftAt=performance.now()+15000;
        asLastDamageAt=Date.now(); asNextShotAt=0; asChargeFrames=0; asCharging=false;
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true,platformIndex:-1};
        asText(200,250,"ПОКАЖИ СВОЮ ВОЛЮ!","#7de1ff",90);
        asSound(420,"sine",0.35,0.12);
    }
    function asWin() {
        if(asWinPending) return;
        asWinPending=true; asState="victory"; asAttacks=[];
        asText(200,245,"НЕВОЗМОЖНО...","#ffffff",120);
        asFlash=28; asFlashColor="#ffffff"; asShake=22;
        for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*7;asParticles.push({x:asBoss.x,y:asBoss.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:45,maxLife:45,color:i%2?"#54d6ff":"#b45bff",size:2+Math.random()*5});}
        asSound(740,"sine",0.75,0.16);
        setTimeout(function(){
            if(typeof defeatedBosses!=="undefined" && Array.isArray(defeatedBosses) && !defeatedBosses.includes(1500)) defeatedBosses.push(1500);
            try { if(typeof saveAll==="function") saveAll(); } catch(e){}
            asStop();
            if(typeof currentEnemy!=="undefined" && currentEnemy) currentEnemy.hp=0;
            if(typeof victory==="function") victory();
        },1800);
    }
    function asLose() {
        if(asDefeatPending) return;
        asDefeatPending=true; asState="defeat"; asAttacks=[];
        asText(200,245,"ТЫ НЕ УСТОЯЛ ПЕРЕД СПИРАЛЬЮ","#ff5f75",110);
        asFlash=28; asFlashColor="#ff213f"; asShake=20;
        asSound(80,"sawtooth",0.7,0.18);
        setTimeout(function(){
            asStop();
            if(typeof defeat==="function") defeat();
            if(typeof playerHp!=="undefined" && playerHp>0) asRestoreStartButton();
        },1500);
    }
    function asRestoreStartButton() {
        if (Number(typeof wave!=="undefined"?wave:0)!==1500 || !currentEnemy || currentEnemy.hp<=0) return;
        if (typeof defeatedBosses!=="undefined" && Array.isArray(defeatedBosses) && defeatedBosses.includes(1500)) return;
        const btn=document.getElementById("startAntiSpiralBossBtn");
        if(btn)btn.style.display="block";
    }
    function asStop() {
        asActive=false; window.antiSpiralBossActive=false;
        if(asAnimFrame) cancelAnimationFrame(asAnimFrame);
        asAnimFrame=null; asUnbind(); stopASMusic();
        asCharging=false; asChargeFrames=0; asLastDamageAt=0; asNextShotAt=0; asPointerChargeMode=false; asDrillShots=[];
        if(asControls && asControls.row && asControls.row.parentNode) asControls.row.parentNode.removeChild(asControls.row);
        asControls=null;
        if(asHintElement){asHintElement.textContent=asOriginalHint;asHintElement=null;asOriginalHint="";}
        if(typeof resetAllSupers==="function"){try{resetAllSupers();}catch(e){}}
        window._uniqueSuperBossId=null;
        const overlay=document.getElementById("arenaOverlay");
        if(overlay) {
            overlay.classList.remove("anti-spiral-arena");
            overlay.style.display="none";
        }
        ["superBtn","superBtn2","superBtnDeactivate","startArenaBtn","startLivingStoneBtn","startWaystarBtn","startRogerWB","startAntiSpiralBossBtn","skipBossBtn","spareBtn"].forEach(function(id){const el=document.getElementById(id);if(el)el.style.display="none";});
        if(typeof musicEnabled!=="undefined" && musicEnabled && typeof startBattleMusic==="function") startBattleMusic();
    }
    function asDrawDrillShots(c,now) {
        for (let i = asDrillShots.length - 1; i >= 0; i--) {
            const shot = asDrillShots[i];
            shot.x += shot.vx; shot.y += shot.vy; shot.life--; shot.phase += .28;
            c.save(); c.translate(shot.x,shot.y); c.rotate(Math.atan2(shot.vy,shot.vx) + Math.PI/2);
            c.shadowColor="#55eaff";c.shadowBlur=14+shot.charge*24;
            c.fillStyle=shot.charge>.78?"#ffffff":"#7bf5ff";
            c.beginPath();c.moveTo(0,-shot.radius*1.8);c.lineTo(shot.radius*.7,shot.radius*.45);
            c.lineTo(0,shot.radius*.95);c.lineTo(-shot.radius*.7,shot.radius*.45);c.closePath();c.fill();
            c.strokeStyle="#ffffff";c.lineWidth=1.2;c.stroke();
            c.strokeStyle=shot.charge>.78?"#c69aff":"#4de6ff";c.lineWidth=2;
            c.beginPath();c.ellipse(0,0,shot.radius*.95,shot.radius*.34,shot.phase,0,Math.PI*2);c.stroke();
            c.restore();
                if (shot.targetType === "seal") {
                const seal = asSeals[shot.sealIndex];
                if (seal && !seal.broken && Math.hypot(shot.x-seal.x,shot.y-seal.y) < seal.radius + shot.radius) {
                    seal.hp -= shot.sealDamage;
                    asText(seal.x,seal.y-18,"-"+shot.sealDamage,"#e6c8ff",30);
                    asShake=Math.max(asShake,3+shot.charge*5);
                    for(let p=0;p<7;p++){
                        const ang=Math.random()*Math.PI*2,sp=1+Math.random()*3;
                        asParticles.push({x:seal.x,y:seal.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:20,maxLife:20,color:"#c681ff",size:2+Math.random()*2});
                    }
                    if(seal.hp<=0){
                        seal.hp=0;seal.broken=true;
                        asText(seal.x,seal.y+15,"ПЕЧАТЬ РАЗРУШЕНА!","#8effff",55);
                        asFlash=Math.max(asFlash,5);asFlashColor="#b98aff";
                        if(asUnbrokenSealIndex()<0){
                            asText(200,128,"ВСЕ 3 ПЕЧАТИ РАЗРУШЕНЫ — ЩИТ СНЯТ!","#8effff",90);
                            asShake=Math.max(asShake,10);
                        }
                    }
                    asDrillShots.splice(i,1);
                    continue;
                }
            } else {
                const dx=shot.x-asBoss.x, dy=shot.y-(asBoss.y+43);
                if(Math.abs(dx)<36+shot.radius && Math.abs(dy)<57+shot.radius){
                    let multiplier = asBossExposed>0 ? 2.45 : .42;
                    if(asPlayer.y<270) multiplier *= 1.25;
                    const damage = Math.max(1,Math.floor(shot.damage*multiplier));
                    asBossHit(damage,asBossExposed>0?"ЯДРО ПРОБИТО!":"БУР ПРОБИЛ ЗАЩИТУ");
                    if(asBossExposed>0)asShake=Math.max(asShake,9+shot.charge*8);
                    asDrillShots.splice(i,1);
                    continue;
                }
            }
            if(shot.life<=0||shot.x<-50||shot.x>450||shot.y<-50||shot.y>550)asDrillShots.splice(i,1);
        }
    }
    function asDrawChargeAura(c,now) {
        if(asChargeFrames<=0)return;
        const pct=Math.min(1,asChargeFrames/150);
        c.save();c.translate(asPlayer.x,asPlayer.y-2);
        c.globalAlpha=.35+pct*.55;c.strokeStyle=pct>.8?"#ffffff":"#61eaff";
        c.shadowColor=pct>.8?"#c08bff":"#39d9ff";c.shadowBlur=8+pct*24;c.lineWidth=1.5+pct*2;
        for(let i=0;i<3;i++){
            c.beginPath();c.ellipse(0,0,14+i*5,7+i*2,now*.006*(i%2?1:-1),0,Math.PI*1.7);c.stroke();
        }
        c.restore();
        c.save();const x=asPlayer.x-23,y=asPlayer.y-30,w=46;
        c.fillStyle="rgba(0,0,0,.8)";c.fillRect(x,y,w,5);
        c.fillStyle=pct>.8?"#e8caff":"#6ef4ff";c.fillRect(x,y,w*pct,5);
        c.strokeStyle="#ffffff";c.lineWidth=.7;c.strokeRect(x,y,w,5);c.restore();
    }
    function asDrawHeart(c) {
        c.save();c.translate(asPlayer.x,asPlayer.y);
        c.rotate(asGravityDirection * Math.PI / 2);
        c.shadowColor="#33c7ff";c.shadowBlur=18;
        const g=c.createLinearGradient(-8,-10,8,9);g.addColorStop(0,"#c8f7ff");g.addColorStop(.45,"#30c5ff");g.addColorStop(1,"#0647ce");c.fillStyle=g;
        c.beginPath();c.moveTo(0,7);c.bezierCurveTo(-3,4,-10,-1,-9,-6);c.bezierCurveTo(-8,-12,-2,-12,0,-7);c.bezierCurveTo(3,-12,9,-12,9,-5);c.bezierCurveTo(9,-1,3,4,0,7);c.closePath();c.fill();
        c.strokeStyle="#e6fcff";c.lineWidth=1.1;c.stroke();c.restore();
    }
    // The Anti-Spiral's canonical look: a living-black humanoid silhouette,
    // chalk-white spiral eyes and a small white mouth — not a generic energy orb.
    function asDrawSpiralEye(c, x, y, r, now, reverse) {
        c.save();
        c.strokeStyle="#f5f2ff"; c.lineWidth=Math.max(1,1.65*r/10);
        c.lineCap="round"; c.lineJoin="round";
        c.beginPath(); c.ellipse(x,y,r,r*0.9,Math.sin(now/900)*0.08,0,Math.PI*2); c.stroke();
        c.beginPath();
        for(let n=0;n<52;n++){
            const q=n/51, a=(reverse?-1:1)*q*Math.PI*5.4+now*0.00025;
            const rr=(0.08+q*0.82)*r;
            const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr*0.88;
            if(n===0)c.moveTo(px,py);else c.lineTo(px,py);
        }
        c.stroke();
        c.restore();
    }
    function asDrawAntiSpiralFigure(c, x, y, scale, now, opacity, enhancedFightBody) {
        const bob=Math.sin(now/360)*2.2;
        c.save(); c.translate(x,y+bob); c.scale(scale,scale); c.globalAlpha=opacity===undefined?1:opacity;
        c.shadowColor=enhancedFightBody?"#873bff":"#a855ff"; c.shadowBlur=enhancedFightBody?28:16;
        // Fight-only outline makes the complete silhouette visible without altering the cinematic rendering.
        c.fillStyle=enhancedFightBody?"#0b071b":"#030207"; c.strokeStyle=enhancedFightBody?"#c9adff":"#eeeaff"; c.lineWidth=enhancedFightBody?2.5:1.6;
        c.lineJoin="round"; c.lineCap="round";
        // Back tendril / cape shadow.
        c.beginPath(); c.moveTo(-13,-25);c.lineTo(-31,-3);c.lineTo(-40,29);c.lineTo(-29,18);c.lineTo(-22,4);c.lineTo(-16,23);c.closePath();c.fill();
        // Legs, posed as if hovering in space.
        c.beginPath();c.moveTo(-13,33);c.lineTo(-4,36);c.lineTo(-8,57);c.lineTo(-21,78);c.lineTo(-27,76);c.lineTo(-17,53);c.closePath();c.fill();c.stroke();
        c.beginPath();c.moveTo(6,34);c.lineTo(15,31);c.lineTo(21,51);c.lineTo(34,68);c.lineTo(28,75);c.lineTo(12,57);c.lineTo(4,43);c.closePath();c.fill();c.stroke();
        // Torso and shoulders.
        c.beginPath();c.moveTo(-13,-18);c.lineTo(-25,-13);c.lineTo(-30,1);c.lineTo(-18,10);
        c.lineTo(-15,28);c.lineTo(-19,38);c.lineTo(-10,43);c.lineTo(10,43);c.lineTo(18,35);
        c.lineTo(14,17);c.lineTo(25,3);c.lineTo(19,-13);c.lineTo(10,-19);c.closePath();c.fill();c.stroke();
        // Left arm hangs like a thin shadow.
        c.beginPath();c.moveTo(-23,-12);c.lineTo(-32,-2);c.lineTo(-35,19);c.lineTo(-30,23);
        c.lineTo(-25,6);c.lineTo(-15,-1);c.closePath();c.fill();c.stroke();
        // Right arm extended, the gesture that reflects the hero's shots.
        const gesture=(now%6000>3600&&now%6000<5200)?-9*Math.sin((now%6000-3600)/1600*Math.PI):0;
        c.beginPath();c.moveTo(18,-13);c.lineTo(28,-7);c.lineTo(39,-18+gesture);c.lineTo(47,-27+gesture);
        c.lineTo(50,-23+gesture);c.lineTo(42,-10+gesture);c.lineTo(29,4);c.lineTo(15,4);c.closePath();c.fill();c.stroke();
        // White, hand-scratched contour strokes on a black body.
        c.shadowBlur=0;c.strokeStyle="#f7f4ff";c.lineWidth=.8;c.globalAlpha*=.85;
        const scratches=[
            [-22,-10,-16,-5,-18,4],[-15,9,-9,16,-12,27],[-8,34,-2,29,4,34],
            [9,-11,15,-2,11,8],[18,-8,24,-4,29,-7],[-31,2,-27,8,-30,15],
            [-15,48,-20,57,-23,69],[12,44,17,52,25,62],[-2,-19,0,-13,3,-18]
        ];
        scratches.forEach(function(p){c.beginPath();c.moveTo(p[0],p[1]);c.quadraticCurveTo(p[2],p[3],p[4],p[5]);c.stroke();});
        // Head: smooth, nearly featureless black oval with sketched white face.
        c.globalAlpha=opacity===undefined?1:opacity;
        c.fillStyle="#020105";c.strokeStyle="#f5f2ff";c.lineWidth=1.9;
        c.beginPath();c.moveTo(-17,-30);c.quadraticCurveTo(-22,-58,-7,-67);c.quadraticCurveTo(2,-73,13,-63);
        c.quadraticCurveTo(23,-50,16,-30);c.quadraticCurveTo(1,-20,-17,-30);c.closePath();c.fill();c.stroke();
        // Tiny white etched marks at the brow and jaw keep the face uncanny.
        c.strokeStyle="#e9e5f2";c.lineWidth=.7;c.beginPath();c.moveTo(-12,-49);c.lineTo(-7,-51);c.moveTo(7,-51);c.lineTo(12,-49);c.stroke();
        asDrawSpiralEye(c,-8,-45,5.4,now,false);asDrawSpiralEye(c,8,-45,5.4,now,true);
        c.fillStyle="#f9f7ff";c.beginPath();c.moveTo(-3,-34);c.lineTo(4,-34);c.lineTo(0,-28);c.closePath();c.fill();
        // A few shifting marks in the torso imply a pattern that never settles.
        c.globalAlpha=.5;c.strokeStyle="#9b77c8";c.lineWidth=.65;
        c.beginPath();c.moveTo(-5,1);c.lineTo(2,9);c.lineTo(-2,19);c.moveTo(5,18);c.lineTo(10,10);c.stroke();
        c.restore();
        // Purple-black reality distortion follows the figure without turning it into an orb.
        c.save();c.globalAlpha=.1+.04*Math.sin(now/170);c.strokeStyle="#a04dff";c.lineWidth=1.4;c.shadowColor="#a04dff";c.shadowBlur=10;
        for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y-6,48*scale+i*13*scale,74*scale+i*11*scale,now*.0002*(i%2?1:-1),0,Math.PI*2);c.stroke();}
        c.restore();
    }
    function asDrawBoss(c,now) {
        if (asLabyrinthTimer > 0) {
            asDrawAntiSpiralFigure(c, asBoss.x - 69, asBoss.y + 47, 0.48, now + 280, .22);
            asDrawAntiSpiralFigure(c, asBoss.x + 69, asBoss.y + 47, 0.48, now - 360, .22);
        }
        if (asBossExposed > 0) {
            c.save();
            c.globalAlpha = .42 + Math.sin(asFrame * .32) * .18;
            c.strokeStyle = "#8effff"; c.shadowColor = "#6ffaff"; c.shadowBlur = 24; c.lineWidth = 2.5;
            c.beginPath(); c.ellipse(asBoss.x, asBoss.y + 37, 25 + Math.sin(asFrame * .15) * 5, 31 + Math.sin(asFrame * .15) * 5, 0, 0, Math.PI * 2); c.stroke();
            c.restore();
        }
        // Rotating dimensional halo and orbiting energy fragments, visible during the fight only.
        c.save();
        c.translate(asBoss.x, asBoss.y + 25);
        c.globalAlpha=.68+.12*Math.sin(now/170);
        c.shadowColor="#a04cff";c.shadowBlur=24;c.lineWidth=1.6;
        for(let ring=0;ring<4;ring++){
            c.save();c.rotate(now*.00035*(ring%2?-1:1)+ring*.52);
            c.strokeStyle=ring%2?"#6cecff":"#bf76ff";
            c.globalAlpha=.28+ring*.09;
            c.beginPath();c.ellipse(0,0,asBoss.size+18+ring*12,11+ring*5,.22*ring,0,Math.PI*2);c.stroke();
            c.restore();
        }
        for(let shard=0;shard<7;shard++){
            const angle=now*.0011+shard*Math.PI*2/7;
            const radius=asBoss.size+28+Math.sin(now/240+shard)*7;
            const sx=Math.cos(angle)*radius,sy=Math.sin(angle)*radius*.62;
            c.fillStyle=shard%2?"#7cecff":"#e0b4ff";c.globalAlpha=.62+.3*Math.sin(now/150+shard);
            c.beginPath();c.moveTo(sx,sy-3.2);c.lineTo(sx+2.5,sy);c.lineTo(sx,sy+3.2);c.lineTo(sx-2.5,sy);c.closePath();c.fill();
        }
        c.restore();
        c.save();
        c.translate(asBoss.x, asBoss.y + 43);
        c.rotate(asGravityDirection * Math.PI / 2);
        asDrawAntiSpiralFigure(c, 0, 0, 0.78 * (asBoss.size / 48), now, 1, true);
        c.restore();
    }
    function asDrawRedHeart(c,x,y,now,shot) {
        c.save();c.translate(x,y);c.shadowColor="#ff233f";c.shadowBlur=shot?22:13;
        c.rotate(Math.sin(now/130)*.12);
        c.fillStyle=shot?"#ff4a52":"#ff203d";
        c.beginPath();c.moveTo(0,8);c.bezierCurveTo(-4,5,-12,-2,-11,-8);c.bezierCurveTo(-10,-16,-2,-15,0,-8);
        c.bezierCurveTo(3,-16,11,-15,11,-7);c.bezierCurveTo(11,-2,4,5,0,8);c.closePath();c.fill();
        c.strokeStyle="#ffdce4";c.lineWidth=1.25;c.stroke();
        c.restore();
    }
    function asDrawGalaxyBackdrop(c,now) {
        c.save();
        const nebula=c.createRadialGradient(265,205,4,265,205,270);
        nebula.addColorStop(0,"rgba(94,45,170,.45)");nebula.addColorStop(.42,"rgba(38,30,112,.26)");nebula.addColorStop(1,"rgba(0,0,0,0)");
        c.fillStyle=nebula;c.fillRect(0,45,400,455);
        c.save();c.translate(255,222);c.rotate(now*.00007);c.strokeStyle="rgba(156,104,255,.48)";c.lineWidth=1.5;
        for(let i=0;i<5;i++){c.beginPath();c.ellipse(0,0,32+i*15,9+i*7,.6+i*.22,0,Math.PI*1.65);c.stroke();}
        c.restore();
        // Moving planets to establish that the heart is travelling through space.
        [[47,139,19,"#4053aa"],[344,113,9,"#8e4ec1"],[313,371,25,"#28285c"],[87,330,7,"#7a3eaf"]].forEach(function(p,i){
            const x=p[0]+Math.sin(now*.00015+i)*9,y=p[1]+Math.cos(now*.00013+i)*5;
            const g=c.createRadialGradient(x-p[2]*.3,y-p[2]*.35,1,x,y,p[2]);g.addColorStop(0,"#bdb7ff");g.addColorStop(.3,p[3]);g.addColorStop(1,"#070713");
            c.fillStyle=g;c.beginPath();c.arc(x,y,p[2],0,Math.PI*2);c.fill();
            c.strokeStyle="rgba(200,190,255,.35)";c.lineWidth=.8;c.beginPath();c.ellipse(x,y,p[2]*1.4,p[2]*.38,-.3,0,Math.PI*2);c.stroke();
        });
        c.restore();
    }
    function asInstallArenaTheme() {
        if (document.getElementById("antiSpiralArenaThemeStyle")) return;
        const style = document.createElement("style");
        style.id = "antiSpiralArenaThemeStyle";
        style.textContent =
            "#arenaOverlay.anti-spiral-arena{box-sizing:border-box;overflow-y:auto;padding:12px 12px 18px;gap:4px;" +
            "background:radial-gradient(ellipse at 50% 18%,rgba(103,43,180,.28),transparent 54%)," +
            "radial-gradient(ellipse at 50% 82%,rgba(0,160,210,.20),transparent 58%)," +
            "linear-gradient(180deg,#070612 0%,#09091b 48%,#02040b 100%)!important;" +
            "font-family:ui-monospace,SFMono-Regular,Menlo,monospace}" +
            "#arenaOverlay.anti-spiral-arena #arenaBossName{color:#eafaff!important;text-shadow:0 0 9px rgba(73,205,255,.7),0 0 22px rgba(154,80,255,.4);letter-spacing:.8px}" +
            "#arenaOverlay.anti-spiral-arena #arenaHP,#arenaOverlay.anti-spiral-arena #arenaTimer{color:#9eeaff;text-shadow:0 0 8px rgba(41,183,255,.35)}" +
            "#arenaOverlay.anti-spiral-arena #arenaCanvas{display:block;width:min(400px,calc(100vw - 28px))!important;height:auto!important;" +
            "max-height:calc(100dvh - 220px);aspect-ratio:4/5;object-fit:contain;border:2px solid #8ceaff!important;border-radius:16px!important;" +
            "background:#03040e!important;box-shadow:0 0 0 1px rgba(170,96,255,.42),0 0 24px rgba(57,197,255,.28),0 0 54px rgba(108,70,255,.14)}" +
            "@media(max-height:650px){#arenaOverlay.anti-spiral-arena{justify-content:flex-start;padding-top:6px}" +
            "#arenaOverlay.anti-spiral-arena #arenaCanvas{max-height:calc(100dvh - 190px)}}" +
            "@media(max-width:360px){#arenaOverlay.anti-spiral-arena #arenaBossName{font-size:18px!important}}";
        document.head.appendChild(style);
    }
    function asDrawArenaAtmosphere(c, now, left, top, width, height) {
        c.save();
        c.beginPath();c.rect(left,top,width,height);c.clip();
        const bg=c.createLinearGradient(left,top,left+width,top+height);
        bg.addColorStop(0,"#070719");bg.addColorStop(.5,"#0b0b29");bg.addColorStop(1,"#030712");
        c.fillStyle=bg;c.fillRect(left,top,width,height);
        const nebula=c.createRadialGradient(left+width*.64,top+height*.42,2,left+width*.64,top+height*.42,width*.72);
        nebula.addColorStop(0,"rgba(130,63,204,.28)");nebula.addColorStop(.48,"rgba(48,91,189,.14)");nebula.addColorStop(1,"rgba(0,0,0,0)");
        c.fillStyle=nebula;c.fillRect(left,top,width,height);
        const cyan=c.createRadialGradient(left+width*.24,top+height*.8,1,left+width*.24,top+height*.8,width*.6);
        cyan.addColorStop(0,"rgba(0,193,235,.17)");cyan.addColorStop(1,"rgba(0,0,0,0)");
        c.fillStyle=cyan;c.fillRect(left,top,width,height);
        c.save();c.translate(200,top+height*.47);c.rotate(now*.0001);
        for(let i=0;i<6;i++){
            c.beginPath();c.ellipse(0,0,width*(.12+i*.075),height*(.035+i*.022),i*.19,0,Math.PI*1.72);
            c.strokeStyle="rgba(163,121,255,"+(.06+i*.014)+")";c.lineWidth=1;c.stroke();
        }
        c.restore();
        c.strokeStyle="rgba(91,196,255,.075)";c.lineWidth=1;
        for(let x=left+22;x<left+width;x+=44){c.beginPath();c.moveTo(x,top);c.lineTo(x,top+height);c.stroke();}
        for(let y=top+24;y<top+height;y+=44){c.beginPath();c.moveTo(left,y);c.lineTo(left+width,y);c.stroke();}
        for(let i=0;i<58;i++){
            const x=left+((i*73+Math.sin(now*.001+i)*13)%(Math.max(1,width-2)));
            const y=top+((i*127+now*(.008+(i%4)*.003))%(Math.max(1,height-2)));
            const alpha=.22+Math.abs(Math.sin(now/540+i))*.65;
            c.globalAlpha=alpha;c.fillStyle=i%5===0?"#d1b5ff":(i%3===0?"#a9f2ff":"#ffffff");
            c.fillRect(x,y,i%7===0?2:1,i%8===0?2:1);
        }
        c.globalAlpha=1;c.restore();
    }
    function asDrawSpeech(c, speaker, text, y, color, now) {
        const words=text.split(/\s+/);const lines=[];let line="";
        words.forEach(function(word){if(line&&(line+" "+word).length>31){lines.push(line);line=word;}else line+=(line?" ":"")+word;});
        if(line)lines.push(line);
        if(lines.length>2){lines[1]=lines.slice(1).join(" ");lines.length=2;}
        const boxH=lines.length>1?54:39;
        const isHero=speaker==="СЕРДЦЕ";
        const x=isHero?12:100,w=isHero?250:288;
        c.save();c.fillStyle="rgba(2,2,10,.91)";c.strokeStyle=color||"#ffffff";c.lineWidth=1.5;
        c.beginPath();c.roundRect(x,y,w,boxH,6);c.fill();c.stroke();
        c.fillStyle=color||"#ffffff";c.textAlign="left";c.font="bold 10px monospace";c.fillText(speaker,x+10,y+13);
        c.fillStyle="#ffffff";c.font="11px monospace";
        if(lines.length>1){c.fillText(lines[0],x+10,y+29);c.fillText(lines[1],x+10,y+43);}
        else c.fillText(lines[0],x+10,y+27);
        c.restore();
    }
    function asFinishCinematic(skipped) {
        if(!asActive||asState!=="cinematic")return;
        asState="fight";
        const now=performance.now();
        asGravityDirection=0;asGravityNextShiftAt=now+15000;asGravityTransitionUntil=0;asBossApproachFrames=0;
        asBoss={x:200,y:100,size:48,rotation:0,pulse:0,flash:0};
        asArenaWidth=400;asArenaHeight=470;asTargetWidth=400;asTargetHeight=470;
        asInitPlatforms();asInitSeals();
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true,platformIndex:-1};
        asDrillShots=[];asChargeFrames=0;asCharging=false;asLastDamageAt=Date.now();asNextShotAt=0;asBossExposed=0;asLabyrinthTimer=0;asUltimateActive=false;asPatternSpawned=false;
        asPattern=0;asPatternTimer=0;asLastArenaShift=now;
        asCreateControls();
        asText(200,250,skipped?"КАТСЦЕНА ПРОПУЩЕНА — БОЙ!":"ТЕБЕ КОНЕЦ!","#74e4ff",85);
        if(skipped){
            if(asCinematicMusicTimer!==null){clearTimeout(asCinematicMusicTimer);asCinematicMusicTimer=null;}
            startASMusic();
        }
        asSound(150,"sawtooth",.45,.14);
        if(typeof updateSuperButton==="function")setTimeout(updateSuperButton,80);
    }
    function asRenderCinematic(c,now) {
        const t=Math.max(0,(now-asCinematicStart)/1000);
        asDrawGalaxyBackdrop(c,now);
        // Fast star streaks sell the initial flight through a deep-space panorama.
        c.save();c.globalAlpha=Math.max(0,Math.min(.65,(3.2-t)*.22));
        for(let i=0;i<36;i++){const x=(i*67+now*.09)%470-35,y=(i*113+now*.025)%500;c.strokeStyle=i%3?"#83bfff":"#e9ceff";c.lineWidth=i%5===0?1.6:.7;c.beginPath();c.moveTo(x,y);c.lineTo(x-10,y+17);c.stroke();}
        c.restore();
        // The red soul travels from the edge of the universe toward the strange figure.
        const fly=Math.min(1,t/3.1),ease=1-Math.pow(1-fly,3);
        let hx=-18+ease*117,hy=412-ease*205+Math.sin(now/170)*5;
        if(t>=3.2&&t<11.9){hx=104+Math.sin(now/280)*3;hy=208+Math.sin(now/210)*3;}
        if(t>=11.9&&t<15.45){hx=105;hy=208;}
        if(t>=15.45){const fall=Math.max(0,Math.min(1,(t-15.45)/2.35));hx=105+fall*91;hy=208+fall*310*fall;}
        asCinematicRedHeart={x:hx,y:hy};
        // The Anti-Spiral materializes without an orb or armor shell: a chalk-eyed living shadow.
        let emerge=Math.max(0,Math.min(1,(t-2.3)/1.1));
        const bossX=285,bossY=223;
        if(emerge>0)asDrawAntiSpiralFigure(c,bossX,bossY,1.7*emerge,now,Math.min(1,emerge*1.4));
        // The three shots rush forward, strike an invisible wall, and return toward the soul.
        if(t>=11.9&&t<14.8){
            for(let i=0;i<3;i++){
                const st=t-(12.05+i*.28);
                if(st<0||st>2.25)continue;
                let sx,sy,back=0;
                if(st<.62){sx=hx+16+st*190;sy=hy-8+i*7+Math.sin(st*14+i)*4;}
                else {back=Math.min(1,(st-.62)/1.05);sx=hx+16+118*(1-back);sy=hy-8+i*7+back*34;}
                c.save();c.globalAlpha=st<.62?1:Math.max(0,1-back*.55);c.strokeStyle="#ff354b";c.lineWidth=3;c.shadowColor="#ff173d";c.shadowBlur=15;
                c.beginPath();c.moveTo(sx-24,sy-4);c.lineTo(sx+2,sy+1);c.stroke();c.restore();
                c.save();c.translate(sx,sy);c.rotate(st*5);c.fillStyle="#ff263f";c.shadowColor="#ff2d48";c.shadowBlur=17;
                c.beginPath();c.moveTo(0,-7);c.lineTo(7,0);c.lineTo(0,7);c.lineTo(-7,0);c.closePath();c.fill();c.restore();
            }
            // A thin reality plane catches the shots; the Anti-Spiral does not move.
            c.save();c.globalAlpha=.35+.18*Math.sin(now/42);c.strokeStyle="#c99aff";c.lineWidth=2;c.shadowColor="#ba59ff";c.shadowBlur=24;
            c.beginPath();c.moveTo(224,105);c.lineTo(224,337);c.stroke();
            for(let i=0;i<4;i++){c.beginPath();c.moveTo(211+i*6,155);c.lineTo(238-i*4,180+i*20);c.stroke();}
            c.restore();
        }
        // Build the pocket arena underneath the soul, using expanding dimensional lines.
        const arena=Math.max(0,Math.min(1,(t-14.55)/1.15));
        asCinematicArenaProgress=arena;
        if(arena>0){
            const w=30+arena*390,h=18+arena*345,top=278+arena*35;
            c.save();c.globalAlpha=arena;c.strokeStyle="#7adfff";c.lineWidth=2;c.shadowColor="#7d3dff";c.shadowBlur=23;
            c.fillStyle="rgba(34,13,77,.24)";c.fillRect((400-w)/2,top,w,h);c.strokeRect((400-w)/2,top,w,h);
            for(let i=0;i<7;i++){const xx=(400-w)/2+w*i/6;c.beginPath();c.moveTo(xx,top);c.lineTo(200+(xx-200)*.43,top-44*arena);c.stroke();}
            for(let i=0;i<4;i++){const yy=top+h*i/3;c.globalAlpha=arena*(.45+i*.12);c.beginPath();c.moveTo((400-w)/2,yy);c.lineTo((400+w)/2,yy);c.stroke();}
            c.restore();
            // A black hole opens underneath; the red heart drops through it.
            c.save();c.globalAlpha=arena*.8;const hole=c.createRadialGradient(200,top+8,2,200,top+8,84);hole.addColorStop(0,"#000000");hole.addColorStop(.5,"rgba(14,5,35,.9)");hole.addColorStop(1,"rgba(151,62,255,0)");
            c.fillStyle=hole;c.beginPath();c.ellipse(200,top+7,80*arena,14*arena,0,0,Math.PI*2);c.fill();c.restore();
        }
        // Caption/subtitle timing creates a silent, playable-looking anime cutscene.
        if(t<2.55){
            c.save();c.fillStyle="rgba(0,0,0,.48)";c.fillRect(13,430,374,28);c.fillStyle="#d8c8ff";c.font="bold 11px monospace";c.textAlign="center";c.fillText("ГДЕ-ТО ЗА ПРЕДЕЛАМИ ИЗВЕСТНОЙ ВСЕЛЕННОЙ...",200,448);c.restore();
        } else if(t>=4.0&&t<5.55) asDrawSpeech(c,"СЕРДЦЕ","Кто ты?",72,"#ff5268",now);
        else if(t>=5.55&&t<7.0) asDrawSpeech(c,"АНТИ-СПИРАЛЬ","Это не имеет значения.",72,"#d4c4ff",now);
        else if(t>=7.0&&t<9.35) asDrawSpeech(c,"АНТИ-СПИРАЛЬ","Главное — чтобы спиральная сила не вырвалась наружу.",72,"#d4c4ff",now);
        else if(t>=9.35&&t<11.0) asDrawSpeech(c,"СЕРДЦЕ","Использовать анти-спиральную силу — плохо!",72,"#ff5268",now);
        else if(t>=11.0&&t<12.05) asDrawSpeech(c,"СЕРДЦЕ","Я не позволю тебе решать за всех!",72,"#ff5268",now);
        else if(t>=12.05&&t<13.55) asDrawSpeech(c,"СЕРДЦЕ","Тогда попробуй остановить меня!",72,"#ff5268",now);
        else if(t>=13.55&&t<14.75) asDrawSpeech(c,"АНТИ-СПИРАЛЬ","Бесполезно.",72,"#d4c4ff",now);
        else if(t>=16.65&&t<18.15) asDrawSpeech(c,"АНТИ-СПИРАЛЬ","Тебе конец.",72,"#d4c4ff",now);
        if(t>=10.7&&t<14.6){
            // Muzzle flare on the red soul before each outgoing projectile.
            c.save();c.globalAlpha=.65+.25*Math.sin(now/28);c.fillStyle="#ff223f";c.shadowColor="#ff173d";c.shadowBlur=20;
            c.beginPath();c.arc(hx+13,hy,4+Math.sin(now/26)*2,0,Math.PI*2);c.fill();c.restore();
        }
        asDrawRedHeart(c,hx,hy,now,t>=10.7&&t<14.6);
        // During the fall, the camera dips while the Anti-Spiral watches from above.
        if(t>=15.45&&t<18.15){
            c.save();c.globalAlpha=Math.min(1,(t-15.45)*2);c.fillStyle="#e7d9ff";c.font="bold 10px monospace";c.textAlign="center";c.fillText("АНТИ-СПИРАЛЬ СОЗДАЛ КАРМАННУЮ ВСЕЛЕННУЮ",200,93);c.restore();
            asDrawAntiSpiralFigure(c,285,196,1.15,now,.95);
        }
        if(t>=18.15) asFinishCinematic(false);
    }
    function asStartBrokenReality(now) {
        if (asState !== "fight" || now < asMiniCooldownUntil) return;
        asMiniReturnPlayer = {
            x: asPlayer.x, y: asPlayer.y, vx: asPlayer.vx, vy: asPlayer.vy,
            grounded: asPlayer.grounded, platformIndex: asPlayer.platformIndex
        };
        asState = "mini";
        asMiniStartedAt = now;
        asMiniIntroUntil = now + 720;
        asMiniNextGravityAt = now + 2050;
        asMiniGravityIndex = 0;
        asMiniCollected = 0;
        asMiniCooldownUntil = now + 12000;
        asMiniSpirals = [
            { x: 62, y: 128, phase: 0, collected: false },
            { x: 132, y: 116, phase: 0.4, collected: false },
            { x: 220, y: 125, phase: 0.8, collected: false },
            { x: 331, y: 137, phase: 1.2, collected: false },
            { x: 286, y: 194, phase: 1.6, collected: false },
            { x: 172, y: 184, phase: 2, collected: false },
            { x: 76, y: 226, phase: 2.4, collected: false },
            { x: 326, y: 255, phase: 2.8, collected: false },
            { x: 203, y: 286, phase: 3.2, collected: false },
            { x: 116, y: 310, phase: 3.6, collected: false },
            { x: 55, y: 365, phase: 4, collected: false },
            { x: 151, y: 391, phase: 4.4, collected: false },
            { x: 247, y: 365, phase: 4.8, collected: false },
            { x: 345, y: 402, phase: 5.2, collected: false },
            { x: 205, y: 438, phase: 5.6, collected: false }
        ];
        asPlayer = { x: 200, y: 260, vx: 0, vy: 0, size: 12, invuln: 0, grounded: false, platformIndex: null };
        asKeys = Object.create(null);
        asPointer = { down: false, x: 200, y: 260, id: null, direction: 0 };
        asPointerChargeMode = false;
        asAttacks = [];
        asParticles = [];
        asUltimateActive = false;
        asPatternSpawned = false;
        asFlash = 25;
        asFlashColor = "#09000f";
        asShake = 3;
        asSound(82, "sawtooth", 0.42, 0.12);
    }
    function asFinishBrokenReality(success, now) {
        const saved = asMiniReturnPlayer || { x: 200, y: asFloor(), grounded: true, platformIndex: -1 };
        asState = "fight";
        asGravityNextShiftAt = now + 15000;
        asMiniCooldownUntil = now + (success ? 12000 : 15000);
        asPlayer = {
            x: Math.max(asBounds().left, Math.min(asBounds().right, saved.x)),
            y: saved.y,
            vx: 0,
            vy: saved.grounded ? 0 : Math.max(-2, Math.min(2, saved.vy || 0)),
            size: 12,
            invuln: success ? 90 : 0,
            grounded: !!saved.grounded,
            platformIndex: saved.platformIndex
        };
        asMiniReturnPlayer = null;
        asMiniSpirals = [];
        asAttacks = [];
        asPatternTimer = 0;
        asPatternSpawned = false;
        asUltimateActive = false;
        asLastArenaShift = now;
        asLastDamageAt = Date.now();
        if (success) {
            const bonusDamage = Math.max(1, Math.floor(asBossMaxHp * 0.10));
            asBossHp = Math.max(0, asBossHp - bonusDamage);
            asBossDamageFlash = 28;
            asReassemblyEffectUntil = now + 1200;
            asFlash = 22;
            asFlashColor = "#53eaff";
            asShake = 15;
            asText(200, 110, "ОБРАТНЫЙ УДАР! -" + bonusDamage + " HP", "#86ffff", 100);
            asText(asBoss.x, asBoss.y + 88, "РЕАЛЬНОСТЬ РАЗОРВАНА", "#dfb9ff", 82);
            asSound(690, "triangle", 0.55, 0.15);
            for (let i = 0; i < 42; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = 2 + Math.random() * 5;
                asParticles.push({
                    x: asBoss.x, y: asBoss.y + 40,
                    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                    life: 38, maxLife: 38,
                    color: i % 2 ? "#5cecff" : "#c47cff",
                    size: 2 + Math.random() * 4
                });
            }
            if (asBossHp <= 0) asWin();
        } else {
            asFlash = 12;
            asFlashColor = "#4d76ff";
            const penalty = Math.max(1, Math.floor(asPlayerMaxHp * 0.10));
            asText(200, 110, "ПРОВАЛ! -" + penalty + " HP", "#ff668e", 100);
            asDamagePlayer(penalty, "ПРОВАЛ СЛОМАННОЙ РЕАЛЬНОСТИ");
            asSound(170, "sine", 0.35, 0.1);
        }
        asUpdateControls();
    }
    function asUpdateBrokenReality(now) {
        const elapsed = now - asMiniIntroUntil;
        asShake = Math.max(asShake, 2.4 + Math.min(5.6, elapsed / 3500) + Math.abs(Math.sin(now * 0.017)) * 2.2);
        if (now < asMiniIntroUntil) return;
        if (now >= asMiniNextGravityAt) {
            asMiniGravityIndex = (asMiniGravityIndex + 1) % 5;
            asMiniNextGravityAt = now + 1350;
            asSound(180 + asMiniGravityIndex * 55, "sine", 0.16, 0.055);
        }
        const leftKey = asKeys.a || asKeys.arrowleft;
        const rightKey = asKeys.d || asKeys.arrowright;
        const upKey = asKeys.w || asKeys.arrowup;
        const downKey = asKeys.s || asKeys.arrowdown;
        let mx = (rightKey ? 1 : 0) - (leftKey ? 1 : 0);
        let my = (downKey ? 1 : 0) - (upKey ? 1 : 0);
        const joy = window._joystick;
        if (joy && joy.enabled && joy.active) {
            mx = Number(joy.vectorX) || 0;
            my = Number(joy.vectorY) || 0;
        } else if (asPointer.down && !asPointerChargeMode) {
            mx = Math.max(-1, Math.min(1, (asPointer.x - asPlayer.x) / 52));
            my = Math.max(-1, Math.min(1, (asPointer.y - asPlayer.y) / 52));
        }
        let gx = 0, gy = 0;
        if (asMiniGravityIndex === 0) gy = 0.23;
        else if (asMiniGravityIndex === 1) gy = -0.23;
        else if (asMiniGravityIndex === 2) gx = -0.23;
        else if (asMiniGravityIndex === 3) gx = 0.23;
        else {
            gx = (200 - asPlayer.x) * 0.0016;
            gy = (260 - asPlayer.y) * 0.0016;
        }
        asPlayer.vx = Math.max(-4.6, Math.min(4.6, (asPlayer.vx + mx * 0.43 + gx) * 0.965));
        asPlayer.vy = Math.max(-4.6, Math.min(4.6, (asPlayer.vy + my * 0.43 + gy) * 0.965));
        asPlayer.x += asPlayer.vx;
        asPlayer.y += asPlayer.vy;
        const progress = Math.max(0, Math.min(1, elapsed / 15000));
        const bounds = {
            left: 34 + progress * 34,
            right: 366 - progress * 34,
            top: 91 + progress * 39,
            bottom: 466 - progress * 43
        };
        if (asPlayer.x < bounds.left + 11) { asPlayer.x = bounds.left + 11; asPlayer.vx = Math.abs(asPlayer.vx) * 0.42; }
        if (asPlayer.x > bounds.right - 11) { asPlayer.x = bounds.right - 11; asPlayer.vx = -Math.abs(asPlayer.vx) * 0.42; }
        if (asPlayer.y < bounds.top + 11) { asPlayer.y = bounds.top + 11; asPlayer.vy = Math.abs(asPlayer.vy) * 0.42; }
        if (asPlayer.y > bounds.bottom - 11) { asPlayer.y = bounds.bottom - 11; asPlayer.vy = -Math.abs(asPlayer.vy) * 0.42; }
        for (let i = 0; i < asMiniSpirals.length; i++) {
            const spiral = asMiniSpirals[i];
            if (spiral.collected) continue;
            spiral.phase += 0.045;
            if (Math.hypot(asPlayer.x - spiral.x, asPlayer.y - spiral.y) < 23) {
                spiral.collected = true;
                asMiniCollected++;
                for (let p = 0; p < 12; p++) {
                    const a = p * Math.PI / 6;
                    asParticles.push({
                        x: spiral.x, y: spiral.y,
                        vx: Math.cos(a) * (1.5 + Math.random() * 2.3),
                        vy: Math.sin(a) * (1.5 + Math.random() * 2.3),
                        life: 22, maxLife: 22,
                        color: p % 2 ? "#5deaff" : "#d6a0ff",
                        size: 2 + Math.random() * 2
                    });
                }
                asFlash = 3;
                asFlashColor = "#62eaff";
                asSound(380 + asMiniCollected * 65, "sine", 0.12, 0.07);
            }
        }
        if (asMiniCollected >= 15) {
            asFinishBrokenReality(true, now);
            return;
        }
        if (elapsed >= 15000) asFinishBrokenReality(false, now);
    }
    function asDrawBrokenReality(c, now) {
        const elapsed = Math.max(0, now - asMiniIntroUntil);
        const progress = Math.max(0, Math.min(1, elapsed / 15000));
        const left = 34 + progress * 34;
        const right = 366 - progress * 34;
        const top = 91 + progress * 39;
        const bottom = 466 - progress * 43;
        c.save();
        c.translate((Math.random() - 0.5) * asShake * 2.2, (Math.random() - 0.5) * asShake * 2.2);
        c.fillStyle = "rgba(2,0,12,.97)";
        c.fillRect(0, 0, 400, 500);
        const glow = c.createRadialGradient(200, 260, 5, 200, 260, 265);
        glow.addColorStop(0, "rgba(82,35,145,.58)");
        glow.addColorStop(0.6, "rgba(28,12,55,.62)");
        glow.addColorStop(1, "rgba(0,0,0,.98)");
        c.fillStyle = glow;
        c.fillRect(0, 0, 400, 500);
        for (let i = 0; i < 34; i++) {
            const a = i * Math.PI * 2 / 34 + now * 0.00035;
            const r = 35 + ((i * 37 + now * 0.026) % 210);
            c.globalAlpha = 0.25 + Math.abs(Math.sin(now * 0.002 + i)) * 0.35;
            c.strokeStyle = i % 2 ? "#af69ff" : "#4beaff";
            c.lineWidth = i % 5 === 0 ? 1.8 : 0.8;
            c.beginPath();
            c.moveTo(200 + Math.cos(a) * r, 260 + Math.sin(a) * r);
            c.lineTo(200 + Math.cos(a) * (r + 8), 260 + Math.sin(a) * (r + 8));
            c.stroke();
        }
        c.globalAlpha = 1;
        c.strokeStyle = "#d9a5ff";
        c.shadowColor = "#994cff";
        c.shadowBlur = 24;
        c.lineWidth = 4;
        c.strokeRect(left, top, right - left, bottom - top);
        c.strokeStyle = "rgba(93,237,255,.75)";
        c.lineWidth = 1.2;
        c.strokeRect(left + 6, top + 6, right - left - 12, bottom - top - 12);
        c.shadowBlur = 0;
        for (let i = 0; i < asMiniSpirals.length; i++) {
            const spiral = asMiniSpirals[i];
            if (spiral.collected) continue;
            const pulse = 1 + Math.sin(now * 0.006 + spiral.phase) * 0.13;
            c.save();
            c.translate(spiral.x, spiral.y);
            c.rotate(now * 0.0015 + spiral.phase);
            c.globalAlpha = 0.8 + Math.sin(now * 0.008 + spiral.phase) * 0.18;
            c.strokeStyle = "#9af8ff";
            c.shadowColor = "#61eaff";
            c.shadowBlur = 17;
            c.lineWidth = 2.5;
            c.beginPath();
            c.arc(0, 0, 12 * pulse, 0, Math.PI * 1.72);
            c.stroke();
            c.strokeStyle = "#d0a2ff";
            c.beginPath();
            c.arc(0, 0, 19 * pulse, Math.PI * 0.3, Math.PI * 1.82);
            c.stroke();
            c.restore();
        }
        for (let i = asParticles.length - 1; i >= 0; i--) {
            const p = asParticles[i];
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.96; p.vy *= 0.96; p.life--;
            c.globalAlpha = Math.max(0, p.life / p.maxLife);
            c.fillStyle = p.color;
            c.fillRect(p.x, p.y, Math.max(1, p.size * p.life / p.maxLife), Math.max(1, p.size * p.life / p.maxLife));
            if (p.life <= 0) asParticles.splice(i, 1);
        }
        c.globalAlpha = 1;
        c.save();
        c.translate(asPlayer.x, asPlayer.y);
        c.shadowColor = "#31dcff";
        c.shadowBlur = 25;
        c.fillStyle = "#36dfff";
        c.beginPath();
        c.moveTo(0, 7);
        c.bezierCurveTo(-4, 4, -12, -3, -10, -9);
        c.bezierCurveTo(-8, -16, -2, -14, 0, -7);
        c.bezierCurveTo(3, -15, 11, -15, 11, -7);
        c.bezierCurveTo(11, -2, 4, 4, 0, 7);
        c.fill();
        c.strokeStyle = "#e8ffff";
        c.lineWidth = 1;
        c.stroke();
        c.restore();
        c.save();
        c.globalAlpha = 0.48 + Math.sin(now * 0.012) * 0.22;
        c.strokeStyle = "#c58aff";
        c.shadowColor = "#a54dff";
        c.shadowBlur = 25;
        c.lineWidth = 2.3;
        c.beginPath();
        c.ellipse(asPlayer.x, asPlayer.y, 22 + Math.sin(now * 0.009) * 4, 17 + Math.sin(now * 0.008) * 3, now * 0.001, 0, Math.PI * 2);
        c.stroke();
        c.restore();
        c.shadowBlur = 0;
        c.globalAlpha = 1;
        c.fillStyle = "#f5eaff";
        c.textAlign = "center";
        c.font = "bold 17px monospace";
        c.fillText("СЛОМАННАЯ РЕАЛЬНОСТЬ", 200, 35);
        c.font = "bold 12px monospace";
        if (now < asMiniIntroUntil) {
            c.fillStyle = "#75eaff";
            c.fillText("ВРЕМЯ ОСТАНОВИЛОСЬ...", 200, 65);
        } else {
            const gravityLabels = ["ВНИЗ", "ВВЕРХ", "ВЛЕВО", "ВПРАВО", "К ЦЕНТРУ"];
            c.fillStyle = "#d8c4ff";
            c.fillText("ГРАВИТАЦИЯ: " + gravityLabels[asMiniGravityIndex], 200, 64);
            c.fillStyle = "#8df5ff";
            c.fillText("СОБРАНО: " + asMiniCollected + "/15", 200, 82);
            c.fillStyle = "#ffffff";
            c.font = "bold 11px monospace";
            c.fillText("ОСТАЛОСЬ: " + Math.max(0, (15 - elapsed / 1000)).toFixed(1) + "с", 200, 98);
        }
        c.fillStyle = "rgba(0,0,0,.72)";
        c.fillRect(42, 473, 316, 18);
        c.fillStyle = "#b9eaff";
        c.font = "10px monospace";
        c.fillText("WASD / СТРЕЛКИ / ДЖОЙСТИК — ДВИЖЕНИЕ", 200, 485);
        c.restore();
    }
    function asDrawReassemblyEffect(c, now) {
        if (now >= asReassemblyEffectUntil) return;
        const progress = 1 - Math.max(0, asReassemblyEffectUntil - now) / 1200;
        c.save();
        c.globalAlpha = Math.max(0, 1 - progress * 0.65);
        for (let i = 0; i < 34; i++) {
            const angle = i * Math.PI * 2 / 34 + i * 0.37;
            const radius = 18 + (i % 6) * 7;
            const sx = asBoss.x + Math.cos(angle) * radius;
            const sy = asBoss.y + 43 + Math.sin(angle) * radius;
            const x = sx + (asPlayer.x - sx) * progress;
            const y = sy + (asPlayer.y - sy) * progress;
            c.fillStyle = i % 3 === 0 ? "#d8a4ff" : i % 3 === 1 ? "#5deaff" : "#ffffff";
            c.shadowColor = c.fillStyle;
            c.shadowBlur = 9;
            const size = 2 + (i % 4);
            c.fillRect(x, y, size, size);
        }
        c.restore();
    }
    function asRender(now) {
        if(!asActive) return;
        const c=asCtx(); if(!c){asAnimFrame=requestAnimationFrame(asRender);return;}
        asFrame++; if(asState==="fight") asShiftArena(now);
        asArenaWidth += (asTargetWidth-asArenaWidth)*.055;
        asArenaHeight += (asTargetHeight-asArenaHeight)*.055;
        asBoss.rotation+=.009; asBoss.pulse+=.04;
        if(asBoss.flash>0)asBoss.flash--;
        if(asBossDamageFlash>0)asBossDamageFlash--;
        if(asShake>0.2)asShake*=.86;else asShake=0;
        if(asFlash>0)asFlash--;
        c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,400,500);
        c.fillStyle="#03030d";c.fillRect(0,0,400,500);
        // Cosmic star field unique to this encounter.
        for(let i=0;i<55;i++){
            const x=(i*79+Math.sin(now/1800+i)*18)%400;
            const y=(i*137+now*(.018+(i%3)*.008))%500;
            c.globalAlpha=.25+Math.abs(Math.sin(now/650+i))*.6;c.fillStyle=i%4===0?"#bb80ff":"#66dfff";
            c.fillRect(x,y,1+(i%3),1+(i%3));
        }
        c.globalAlpha=1;
        if(asState==="cinematic"){
            asRenderCinematic(c,now);
            c.restore();
            asAnimFrame=requestAnimationFrame(asRender);
            return;
        }
        if (asState === "mini") {
            asDrawBrokenReality(c, now);
            c.restore();
            asUpdateBrokenReality(now);
            asAnimFrame = requestAnimationFrame(asRender);
            return;
        }
        const b=asBounds();c.save();c.translate((Math.random()-.5)*asShake,(Math.random()-.5)*asShake);
        const arenaLeft=(400-asArenaWidth)/2;
        c.fillStyle="rgba(0,0,0,.76)";c.fillRect(0,50,arenaLeft,450);c.fillRect(arenaLeft+asArenaWidth,50,400-(arenaLeft+asArenaWidth),450);
        const boxY=55+(445-asArenaHeight)/2;c.fillRect(arenaLeft,50,asArenaWidth,boxY-50);c.fillRect(arenaLeft,boxY+asArenaHeight,asArenaWidth,500-(boxY+asArenaHeight));
        asDrawArenaAtmosphere(c,now,arenaLeft,boxY,asArenaWidth,asArenaHeight);
        c.strokeStyle="#8ceaff";c.lineWidth=2.5;c.shadowColor="#4bbcff";c.shadowBlur=17;c.strokeRect(arenaLeft,boxY,asArenaWidth,asArenaHeight);
        c.shadowColor="#b36cff";c.strokeStyle="rgba(187,127,255,.58)";c.lineWidth=1;c.strokeRect(arenaLeft+5,boxY+5,Math.max(0,asArenaWidth-10),Math.max(0,asArenaHeight-10));c.shadowBlur=0;
        // Small corner brackets make this feel like a framed boss arena, not a bare canvas.
        c.strokeStyle="rgba(202,239,255,.9)";c.lineWidth=2;
        [[arenaLeft+2,boxY+2,1,1],[arenaLeft+asArenaWidth-2,boxY+2,-1,1],[arenaLeft+2,boxY+asArenaHeight-2,1,-1],[arenaLeft+asArenaWidth-2,boxY+asArenaHeight-2,-1,-1]].forEach(function(p){
            c.beginPath();c.moveTo(p[0],p[1]+p[3]*13);c.lineTo(p[0],p[1]);c.lineTo(p[0]+p[2]*13,p[1]);c.stroke();
        });
        // HUD remains upright; only models and platforms reorient.
        // HUD and phase title.
        c.fillStyle="rgba(0,0,0,.78)";c.fillRect(9,8,382,32);
        c.fillStyle="#bdefff";c.font="bold 11px monospace";c.textAlign="left";c.fillText("АНТИ-СПИРАЛЬ  •  ФАЗА "+asPhase,15,20);
        c.fillStyle="#221a3e";c.fillRect(15,26,370,7);c.fillStyle=asBossDamageFlash?"#ffffff":"#a45cff";c.fillRect(15,26,370*Math.max(0,asBossHp/asBossMaxHp),7);
        c.fillStyle="rgba(0,0,0,.8)";c.fillRect(9,43,382,18);c.fillStyle="#101c46";c.fillRect(15,49,370,5);c.fillStyle="#35c9ff";c.fillRect(15,49,370*Math.max(0,asPlayerHp/asPlayerMaxHp),5);
        c.fillStyle="#ffffff";c.font="bold 9px monospace";c.fillText("HP "+Math.ceil(asPlayerHp)+"/"+asPlayerMaxHp,17,46);
        c.fillStyle="#9df2ff";c.font="bold 10px monospace";c.textAlign="center";
        c.fillText("ГРАВИТАЦИЯ: "+asGravityLabels[asGravityDirection]+"  ·  "+Math.max(0,Math.ceil((asGravityNextShiftAt-now)/1000))+"с",200,73);
        if(now<asGravityTransitionUntil){
            const arrow=["↓","←","↑","→"][asGravityDirection];
            c.save();c.globalAlpha=.96;c.fillStyle="rgba(5,2,18,.94)";c.fillRect(42,101,316,62);
            c.strokeStyle="#ff70eb";c.lineWidth=2;c.shadowColor="#d64cff";c.shadowBlur=17;c.strokeRect(42,101,316,62);
            c.fillStyle="#ffb5f5";c.font="bold 25px monospace";c.textAlign="left";c.fillText(arrow,58,139);
            c.fillStyle="#ffffff";c.font="bold 13px monospace";c.textAlign="left";c.fillText("ГРАВИТАЦИЯ: "+asGravityLabels[asGravityDirection],102,125);
            c.fillStyle="#85eaff";c.font="bold 10px monospace";c.fillText("ТЯЖЕСТЬ ДЕЙСТВУЕТ В ЭТОМ НАПРАВЛЕНИИ",102,145);c.restore();
        }
        {
            c.fillStyle=asBossExposed>0?"#92ffff":"#d8ceff";c.textAlign="center";c.font="bold 10px monospace";
            c.fillText(asBossExposed>0?"ЯДРО ОТКРЫТО! "+Math.ceil(asBossExposed/60)+"с":patterns[asPattern],200,88);
            c.save();
            asDrawPlatforms(c,now);
            asDrawSeals(c,now);
            asDrawBoss(c,now);
            asDrawReassemblyEffect(c,now);
            // The pull is visual as well as physical.
            c.save();c.globalAlpha=.12+.05*Math.sin(now/180);c.strokeStyle="#50cfff";c.lineWidth=1;
            for(let i=0;i<5;i++){c.beginPath();c.arc(asBoss.x,asBoss.y,asBoss.size+18+i*19,0,Math.PI*2);c.stroke();}c.restore();
            for(let i=asAttacks.length-1;i>=0;i--){
                const a=asAttacks[i];
                if(a.kind==="bigbang"){
                    if(a.phase==="charge"){
                        a.timer--;
                        const t=Math.max(0,1-a.timer/94), cx=asBoss.x, cy=asBoss.y+38;
                        c.save(); c.globalAlpha=.9; c.shadowColor="#bf78ff"; c.shadowBlur=22; c.strokeStyle="#e4ccff"; c.lineWidth=1.6;
                        for(let g=0;g<2;g++){
                            const gx=cx+(g===0?-1:1)*(84-t*62);
                            const gy=cy+Math.sin(asFrame*.11+g)*7;
                            c.save(); c.translate(gx,gy); c.rotate((g===0?-1:1)*asFrame*.055);
                            c.strokeStyle=g===0?"#a678ff":"#6ce8ff";
                            for(let ring=0;ring<4;ring++){c.globalAlpha=.35+ring*.12;c.beginPath();c.ellipse(0,0,13+ring*4,5+ring*2,.35*ring,0,Math.PI*1.8);c.stroke();}
                            c.restore();
                        }
                        c.globalAlpha=.88;
                        const orbR=7+t*21;
                        const orb=c.createRadialGradient(cx,cy,1,cx,cy,orbR*1.6);
                        orb.addColorStop(0,"#ffffff");orb.addColorStop(.25,"#ffc8ff");orb.addColorStop(.7,"#a64cff");orb.addColorStop(1,"rgba(80,35,180,0)");
                        c.fillStyle=orb;c.beginPath();c.arc(cx,cy,orbR*1.6,0,Math.PI*2);c.fill();
                        c.strokeStyle="#ffffff";c.lineWidth=1.4;c.beginPath();c.arc(cx,cy,orbR,0,Math.PI*2);c.stroke();
                        c.restore();
                        if(a.timer<=0){
                            a.phase="blast";a.life=52;a.hit=false;
                            asText(200,110,"INFINITY BIG BANG STORM — УКРОЙСЯ НА ГОЛУБОЙ ПЛАТФОРМЕ!","#8efaff",78);
                            asFlash=Math.max(asFlash,7);asFlashColor="#b27cff";asShake=Math.max(asShake,12);
                            asSound(55,"sawtooth",.7,.18);
                        }
                    }else{
                        a.life--;
                        const progress=1-a.life/52;
                        const b=asBounds();
                        c.save();
                        c.globalAlpha=.18+Math.abs(Math.sin(asFrame*.42))*.12;
                        c.fillStyle="#a64cff";c.fillRect(b.left,b.top,asArenaWidth,b.bottom-b.top);
                        c.globalAlpha=.8;c.strokeStyle="#d9b4ff";c.shadowColor="#bf7aff";c.shadowBlur=28;c.lineWidth=24+progress*18;
                        c.beginPath();c.ellipse(asBoss.x,asBoss.y+38,28+progress*250,16+progress*195,asFrame*.01,0,Math.PI*2);c.stroke();
                        c.globalAlpha=.94;c.strokeStyle="#f5eaff";c.lineWidth=3;
                        c.beginPath();c.ellipse(asBoss.x,asBoss.y+38,28+progress*245,14+progress*190,asFrame*.01,0,Math.PI*2);c.stroke();
                        c.restore();
                        if(!a.hit && a.life<=44){
                            a.hit=true;
                            const sheltered = asPlayer.grounded && asPlayer.platformIndex === a.safePlatformIndex;
                            if(!sheltered) asDamagePlayer(a.damage,"INFINITY BIG BANG STORM");
                            else asText(asPlayer.x,asPlayer.y-26,"УКРЫТИЕ УДЕРЖАНО!","#9bffff",48);
                            asFlash=Math.max(asFlash,12);asFlashColor="#b58aff";asShake=Math.max(asShake,16);
                        }
                        if(a.life<=0){
                            asBossExposed=220;
                            asUltimateActive=false;
                            asText(asBoss.x,asBoss.y+87,"ЯДРО ОТКРЫТО — ЗАРЯДИ БУР!","#8effff",86);
                            asAttacks.splice(i,1);
                        }
                    }
                    continue;
                }
                if(a.kind==="sweep"){
                    if(a.warning>0){
                        a.warning--;
                        c.save();c.globalAlpha=.35+Math.abs(Math.sin(asFrame*.3))*.38;c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=15;c.lineWidth=2;
                        c.setLineDash([9,6]);c.beginPath();c.moveTo(b.left,a.y);c.lineTo(b.right,a.y);c.stroke();c.setLineDash([]);
                        c.fillStyle="#ffffff";c.font="bold 10px monospace";c.textAlign="center";c.fillText("УДАР РУКОЙ — ПРЫГАЙ!",200,a.y-7);c.restore();
                    }else{
                        a.life--;
                        c.save();c.globalAlpha=.28;c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=25;c.lineWidth=30;c.beginPath();c.moveTo(b.left,a.y);c.lineTo(b.right,a.y);c.stroke();
                        c.globalAlpha=.95;c.lineWidth=8;c.beginPath();c.moveTo(b.left,a.y);c.lineTo(b.right,a.y);c.stroke();
                        c.globalAlpha=1;c.strokeStyle="#ffffff";c.lineWidth=1.5;c.beginPath();c.moveTo(b.left,a.y);c.lineTo(b.right,a.y);c.stroke();c.restore();
                        if(!a.hit && Math.abs(asPlayer.y-a.y)<20){asDamagePlayer(a.damage,"УДАР ГРАНДЗЕБОМОЙ");a.hit=true;}
                        if(a.life<=0)asAttacks.splice(i,1);
                    }
                    continue;
                }
                if(a.kind==="gravityTell"){
                    if(a.timer>0){
                        a.timer--;
                        const wb=asBounds(), side=asGravityDirection, cx=(wb.left+wb.right)/2, cy=(wb.top+wb.bottom)/2;
                        const lineX=side===1?wb.left+9:wb.right-9;
                        const lineY=side===2?wb.top+9:wb.bottom-9;
                        c.save();c.globalAlpha=.64+Math.abs(Math.sin(asFrame*.42))*.34;
                        c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=25;c.lineWidth=3;
                        c.setLineDash([10,6]);c.beginPath();
                        if(side%2===0){c.moveTo(wb.left+5,lineY);c.lineTo(wb.right-5,lineY);}
                        else{c.moveTo(lineX,wb.top+5);c.lineTo(lineX,wb.bottom-5);}
                        c.stroke();c.setLineDash([]);
                        for(let k=-2;k<=2;k++){
                            c.beginPath();
                            if(side===0){const x=cx+k*48;c.moveTo(x-8,wb.bottom-24);c.lineTo(x,wb.bottom-11);c.lineTo(x+8,wb.bottom-24);}
                            else if(side===1){const y=cy+k*62;c.moveTo(wb.left+25,y-8);c.lineTo(wb.left+11,y);c.lineTo(wb.left+25,y+8);}
                            else if(side===2){const x=cx+k*48;c.moveTo(x-8,wb.top+24);c.lineTo(x,wb.top+11);c.lineTo(x+8,wb.top+24);}
                            else {const y=cy+k*62;c.moveTo(wb.right-25,y-8);c.lineTo(wb.right-11,y);c.lineTo(wb.right-25,y+8);}
                            c.stroke();
                        }
                        c.fillStyle="#ffffff";c.font="bold 11px monospace";c.textAlign="center";
                        const textY=side===2?wb.top+39:side===0?wb.bottom-36:cy-14;
                        c.fillText("ВНИМАНИЕ: УДАР СО СТОРОНЫ "+asGravityLabels[side]+"!",200,textY);
                        c.fillStyle=a.color;c.font="bold 10px monospace";
                        c.fillText("АТАКА ЧЕРЕЗ "+Math.max(1,Math.ceil(a.timer/60))+"...",200,textY+16);
                        c.restore();continue;
                    }
                    const wb=asBounds(), count=4;
                    for(let gi=0;gi<count;gi++){
                        const t=gi/(count-1);
                        let x,y,vx,vy;
                        if(asGravityDirection===0){x=wb.left+22+(wb.right-wb.left-44)*t;y=wb.bottom-13;vx=(gi-(count-1)/2)*1.05;vy=-3.5-Math.random()*.7;}
                        else if(asGravityDirection===1){x=wb.left+13;y=wb.top+22+(wb.bottom-wb.top-44)*t;vx=3.5+Math.random()*.7;vy=(gi-(count-1)/2)*1.05;}
                        else if(asGravityDirection===2){x=wb.left+22+(wb.right-wb.left-44)*t;y=wb.top+13;vx=(gi-(count-1)/2)*1.05;vy=3.5+Math.random()*.7;}
                        else{x=wb.right-13;y=wb.top+22+(wb.bottom-wb.top-44)*t;vx=-3.5-Math.random()*.7;vy=(gi-(count-1)/2)*1.05;}
                        asAddAttack(x,y,vx,vy,11,gi%2?"#ff60d9":"#6deaff",a.damage,"orb");
                    }
                    asShake=Math.max(asShake,9);asSound(105,"sawtooth",.24,.1);asAttacks.splice(i,1);continue;
                }
                if(a.kind==="fall" && typeof a.warning==="number" && a.warning>0){
                    a.warning--;
                    const wb=asBounds();
                    c.save();c.globalAlpha=.42+Math.abs(Math.sin(asFrame*.42))*.48;
                    c.strokeStyle="#ff68d9";c.shadowColor="#ff46c8";c.shadowBlur=16;c.lineWidth=2;
                    c.setLineDash([6,6]);c.beginPath();c.moveTo(a.x,wb.top+7);c.lineTo(a.x,wb.bottom-7);c.stroke();c.setLineDash([]);
                    c.fillStyle="#ffffff";c.font="bold 9px monospace";c.textAlign="center";
                    c.fillText("ОПАСНОСТЬ",a.x,wb.top+21);
                    c.fillStyle="#ff9de9";c.fillText("УДАР ЧЕРЕЗ "+Math.max(1,Math.ceil(a.warning/60))+"...",a.x,wb.top+33);
                    c.restore();continue;
                }
                if(a.kind==="mark"){
                    if(!a.burst){
                        a.timer=Math.max(0,a.timer-1);
                        const pulse=1+Math.sin(asFrame*.22)*.12;
                        c.save();c.globalAlpha=.45+Math.abs(Math.sin(asFrame*.17))*.35;c.translate(a.x,a.y);
                        c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=14;c.lineWidth=1.8;
                        c.beginPath();c.arc(0,0,a.radius*pulse,0,Math.PI*2);c.stroke();
                        c.beginPath();c.arc(0,0,a.radius*.62,0,Math.PI*2);c.stroke();
                        c.beginPath();c.moveTo(-a.radius-7,0);c.lineTo(-a.radius*.48,0);c.moveTo(a.radius*.48,0);c.lineTo(a.radius+7,0);
                        c.moveTo(0,-a.radius-7);c.lineTo(0,-a.radius*.48);c.moveTo(0,a.radius*.48);c.lineTo(0,a.radius+7);c.stroke();
                        c.fillStyle="#fff1fb";c.font="bold 10px monospace";c.textAlign="center";c.fillText(String(Math.max(1,Math.ceil(a.timer/60))),0,4);
                        c.restore();
                        if(a.timer<=0){
                            a.burst=true;a.life=18;asShake=Math.max(asShake,5);
                            asSound(95,"sawtooth",.2,.07);
                            for(let p=0;p<12;p++){const ang=p*Math.PI/6;asParticles.push({x:a.x,y:a.y,vx:Math.cos(ang)*3.2,vy:Math.sin(ang)*3.2,life:20,maxLife:20,color:a.color,size:2+Math.random()*2});}
                        }
                    }
                    if(a.burst){
                        const t=1-a.life/18;const radius=a.radius*(.6+t*.8);
                        c.save();c.globalAlpha=Math.max(.08,a.life/18);c.strokeStyle=a.color;c.fillStyle=a.color;c.shadowColor=a.color;c.shadowBlur=20;c.lineWidth=3;
                        c.beginPath();c.arc(a.x,a.y,radius,0,Math.PI*2);c.stroke();
                        c.globalAlpha=Math.max(.04,a.life/18)*.28;c.beginPath();c.arc(a.x,a.y,radius*.72,0,Math.PI*2);c.fill();c.restore();
                        if(!a.hit&&Math.hypot(asPlayer.x-a.x,asPlayer.y-a.y)<a.radius+asPlayer.size){asDamagePlayer(a.damage,"КОЛЛАПС ВЕРОЯТНОСТИ");a.hit=true;}
                        a.life--;if(a.life<=0)asAttacks.splice(i,1);
                    }
                    continue;
                }
                if(a.kind==="well"){
                    if(!a.burst){
                        if((a.warning||0)>0){
                            a.warning--;
                            const charge=1-a.warning/(a.warningMax||78);
                            const pulse=1+Math.sin(asFrame*.32)*.12;
                            c.save();c.translate(a.x,a.y);
                            c.globalAlpha=.5+Math.abs(Math.sin(asFrame*.24))*.42;
                            c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=24;c.lineWidth=2.2;
                            for(let ring=0;ring<4;ring++){
                                const radius=(a.radius*.48+ring*13+charge*17)*pulse;
                                c.beginPath();c.ellipse(0,0,radius,radius*.56,asFrame*.025*(ring%2?1:-1),0,Math.PI*2);c.stroke();
                            }
                            c.setLineDash([5,5]);c.beginPath();c.arc(0,0,a.pullRadius*(.22+charge*.12),0,Math.PI*2);c.stroke();c.setLineDash([]);
                            c.fillStyle="#05030c";c.beginPath();c.arc(0,0,8+charge*9,0,Math.PI*2);c.fill();
                            for(let p=0;p<10;p++){
                                const ang=p*Math.PI*2/10+asFrame*.04;
                                const rr=a.radius*.72+Math.sin(asFrame*.13+p)*5;
                                c.fillStyle=p%2?a.color:"#ffffff";c.beginPath();c.arc(Math.cos(ang)*rr,Math.sin(ang)*rr*.55,1.5+charge,0,Math.PI*2);c.fill();
                            }
                            c.restore();
                            const warningBounds=asBounds();
                            c.save();c.fillStyle="rgba(4,2,16,.88)";c.fillRect(62,warningBounds.top+12,276,34);
                            c.strokeStyle=a.color;c.lineWidth=1.5;c.shadowColor=a.color;c.shadowBlur=12;c.strokeRect(62,warningBounds.top+12,276,34);
                            c.fillStyle="#ffffff";c.font="bold 11px monospace";c.textAlign="center";
                            c.fillText("⚠ ЧЁРНАЯ ДЫРА ЗАРЯЖАЕТСЯ",200,warningBounds.top+26);
                            c.fillStyle=a.color;c.font="bold 10px monospace";
                            c.fillText("ДО ВКЛЮЧЕНИЯ: "+Math.max(1,Math.ceil(a.warning/60))+"...",200,warningBounds.top+39);c.restore();
                            if(a.warning<=0){
                                asShake=Math.max(asShake,13);asFlash=Math.max(asFlash,9);asFlashColor=a.color;asSound(55,"sawtooth",.48,.16);
                                for(let q=0;q<34;q++){const ang=Math.PI*2*q/34,sp=1.5+Math.random()*5;asParticles.push({x:a.x,y:a.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:28+Math.floor(Math.random()*22),maxLife:50,color:q%3===0?"#ffffff":a.color,size:2+Math.random()*3});}
                                if(typeof window.antiSpiralAddShockwave==="function")window.antiSpiralAddShockwave(a.x,a.y,a.color,4,30,3);
                            }
                            continue;
                        }
                        a.timer=Math.max(0,a.timer-1);
                        const pulse=1+Math.sin(asFrame*.16)*.1;
                        c.save();c.translate(a.x,a.y);
                        const distortion=c.createRadialGradient(0,0,2,0,0,a.pullRadius*.56);
                        distortion.addColorStop(0,"rgba(0,0,0,.98)");distortion.addColorStop(.32,"rgba(4,2,18,.8)");distortion.addColorStop(.68,a.color+"22");distortion.addColorStop(1,"rgba(0,0,0,0)");
                        c.globalAlpha=.7;c.fillStyle=distortion;c.beginPath();c.arc(0,0,a.pullRadius*.56,0,Math.PI*2);c.fill();
                        c.globalAlpha=.92;c.shadowColor=a.color;c.shadowBlur=32;
                        const glow=c.createRadialGradient(0,0,2,0,0,a.radius*1.4);
                        glow.addColorStop(0,"rgba(5,4,20,.96)");glow.addColorStop(.42,a.color);glow.addColorStop(1,"rgba(5,4,20,0)");
                        c.fillStyle=glow;c.beginPath();c.arc(0,0,a.radius*1.4,0,Math.PI*2);c.fill();
                        c.strokeStyle=a.color;c.lineWidth=1.5;
                        for(let ring=0;ring<7;ring++){c.globalAlpha=.24+ring*.075;c.lineWidth=ring<2?2.4:1.3;c.beginPath();c.ellipse(0,0,a.radius*pulse+ring*10,a.radius*.38+ring*5,asFrame*.012*(ring%2?1:-1),0,Math.PI*2);c.stroke();}
                        c.globalAlpha=.95;c.strokeStyle="#e9e1ff";c.lineWidth=2.4;c.beginPath();c.arc(0,0,12+Math.sin(asFrame*.2)*4,0,Math.PI*2);c.stroke();
                        c.fillStyle="#000000";c.beginPath();c.arc(0,0,a.radius*.38,0,Math.PI*2);c.fill();
                        c.strokeStyle="#ffffff";c.globalAlpha=.7;c.lineWidth=1;c.beginPath();c.arc(0,0,a.radius*.38+3,0,Math.PI*2);c.stroke();
                        for(let p=0;p<18;p++){const ang=asFrame*.035+p*Math.PI*2/18,rr=a.radius*.55+Math.sin(asFrame*.08+p)*8;c.globalAlpha=.55+Math.abs(Math.sin(asFrame*.1+p))*.4;c.fillStyle=p%3===0?"#ffffff":a.color;c.beginPath();c.arc(Math.cos(ang)*rr,Math.sin(ang)*rr*.48,1.4+(p%3)*.45,0,Math.PI*2);c.fill();}
                        c.restore();
                        if(a.timer<=0){
                            a.burst=true;a.life=28;asShake=Math.max(asShake,8);
                            asSound(70,"sawtooth",.35,.11);
                            const count=asPhase>=3?16:12;
                            for(let p=0;p<count;p++){const ang=p*Math.PI*2/count;asAddAttack(a.x,a.y,Math.cos(ang)*(3.1+asPhase*.25),Math.sin(ang)*(3.1+asPhase*.25),10,p%2?a.color:"#7feaff",a.damage,"orb");}
                        }
                    }else{
                        const t=1-a.life/28;
                        c.save();c.globalAlpha=Math.max(0,a.life/28);c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=18;c.lineWidth=2;
                        c.beginPath();c.arc(a.x,a.y,12+t*a.radius,0,Math.PI*2);c.stroke();
                        c.restore();a.life--;if(a.life<=0)asAttacks.splice(i,1);
                    }
                    continue;
                }
                if(a.kind==="laser" || a.kind==="barrierLaser"){
                    const barrier=a.kind==="barrierLaser";
                    const beamWidth=barrier?(a.thickness||38):23;
                    const bounds=asBounds();
                    const vertical=a.orientation==="vertical";
                    const lineStart=vertical?bounds.top+5:bounds.left;
                    const lineEnd=vertical?bounds.bottom-2:bounds.right;
                    const lineCoord=vertical?a.x:a.y;
                    if(a.warning>0){
                        a.warning--;
                        c.save();c.globalAlpha=(barrier ? .45 : .35)+Math.abs(Math.sin(asFrame*.25))*.25;c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=barrier?22:11;c.lineWidth=barrier?4:2;
                        c.setLineDash([7,6]);c.beginPath();
                        if(vertical){c.moveTo(lineCoord,lineStart);c.lineTo(lineCoord,lineEnd);}
                        else{c.moveTo(lineStart,lineCoord);c.lineTo(lineEnd,lineCoord);}
                        c.stroke();c.setLineDash([]);
                        c.globalAlpha=.85;c.fillStyle="#ffffff";c.font="bold 10px monospace";c.textAlign="center";
                        c.fillText(barrier?"БАРЬЕР — НЕ ПРИБЛИЖАЙСЯ":"!",vertical?lineCoord:(bounds.left+bounds.right)/2,vertical?lineStart+10:lineCoord-7);c.restore();
                    }else{
                        a.life--;
                        c.save();c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=barrier?34:20;c.lineCap="round";
                        c.globalAlpha=barrier ? .34 : .3;c.lineWidth=beamWidth;c.beginPath();if(vertical){c.moveTo(lineCoord,lineStart);c.lineTo(lineCoord,lineEnd);}else{c.moveTo(lineStart,lineCoord);c.lineTo(lineEnd,lineCoord);}c.stroke();
                        c.globalAlpha=.95;c.lineWidth=barrier?Math.max(8,beamWidth*.28):7;c.beginPath();if(vertical){c.moveTo(lineCoord,lineStart);c.lineTo(lineCoord,lineEnd);}else{c.moveTo(lineStart,lineCoord);c.lineTo(lineEnd,lineCoord);}c.stroke();
                        c.globalAlpha=1;c.strokeStyle="#ffffff";c.shadowBlur=barrier?12:5;c.lineWidth=barrier?2.5:1.5;c.beginPath();if(vertical){c.moveTo(lineCoord,lineStart);c.lineTo(lineCoord,lineEnd);}else{c.moveTo(lineStart,lineCoord);c.lineTo(lineEnd,lineCoord);}c.stroke();c.restore();
                        const tolerance=beamWidth/2+asPlayer.size;
                        const hit=vertical?Math.abs(asPlayer.x-lineCoord)<tolerance&&asPlayer.y>=lineStart&&asPlayer.y<=lineEnd:Math.abs(asPlayer.y-lineCoord)<tolerance&&asPlayer.x>=lineStart&&asPlayer.x<=lineEnd;
                        if(hit&&!a.hit){asDamagePlayer(a.damage,barrier?"ЛАЗЕРНЫЙ БАРЬЕР":"РАЗРЕЗ РЕАЛЬНОСТИ");a.hit=true;}
                        if(a.life<=0)asAttacks.splice(i,1);
                    }
                    continue;
                }
                if(a.homing){
                    const dx=asPlayer.x-a.x,dy=asPlayer.y-a.y,dist=Math.max(1,Math.hypot(dx,dy));
                    const speed=Math.min(a.maxSpeed||3.6,Math.hypot(a.vx,a.vy)+.025);
                    const targetX=dx/dist*speed,targetY=dy/dist*speed,turn=a.turnRate||.045;
                    a.vx+=(targetX-a.vx)*turn;a.vy+=(targetY-a.vy)*turn;
                }else{
                    if(typeof a.spd==="number")a.vx=a.spd;
                    if(typeof a.spdY==="number")a.vy=a.spdY;
                }
                a.x+=a.vx;a.y+=a.vy;a.life--;a.phase+=.1;
                // Bright energy trails make fast shots readable instead of tiny dots that seem to vanish.
                c.save();c.globalAlpha=a.homing?.72:.48;c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=a.homing?22:14;c.lineWidth=a.homing?4:2.5;
                c.beginPath();c.moveTo(a.x-a.vx*(a.homing?7:4),a.y-a.vy*(a.homing?7:4));c.lineTo(a.x+a.vx*1.5,a.y+a.vy*1.5);c.stroke();c.restore();
                if(asFrame%3===0&&(a.homing||a.kind==="fall"||a.kind==="spiral")){
                    asParticles.push({x:a.x,y:a.y,vx:-a.vx*.18+(Math.random()-.5)*.7,vy:-a.vy*.18+(Math.random()-.5)*.7,life:12,maxLife:12,color:a.color,size:a.homing?2.8:1.8});
                }
                c.save();c.translate(a.x,a.y);c.rotate(a.phase);c.shadowColor=a.color;c.shadowBlur=a.homing?26:17;c.fillStyle=a.color;
                if(a.kind==="ground"){
                    c.globalAlpha=.88;c.fillRect(-a.size,-a.size*.42,a.size*2,a.size*.84);
                    c.strokeStyle="#e1fbff";c.lineWidth=1;c.strokeRect(-a.size,-a.size*.42,a.size*2,a.size*.84);
                    c.beginPath();c.moveTo(-a.size*.72,0);c.lineTo(a.size*.72,0);c.stroke();
                }else if(a.kind==="fall"){
                    c.strokeStyle=a.color;c.globalAlpha=.68;c.lineWidth=3;c.beginPath();c.moveTo(0,-a.size*.5);c.lineTo(-a.vx*5,-a.vy*7);c.stroke();
                    c.globalAlpha=1;c.beginPath();c.arc(0,0,a.size*(1+Math.sin(a.phase)*.08),0,Math.PI*2);c.fill();
                    c.strokeStyle="#f1fdff";c.lineWidth=1;c.stroke();
                }else if(a.kind==="spiral"){
                    c.beginPath();c.moveTo(0,-a.size);c.lineTo(a.size*.56,0);c.lineTo(0,a.size);c.lineTo(-a.size*.56,0);c.closePath();c.fill();
                    c.strokeStyle="#effcff";c.lineWidth=1;c.stroke();
                    c.beginPath();c.arc(0,0,a.size*.35,0,Math.PI*2);c.stroke();
                }else{
                    c.beginPath();c.arc(0,0,a.size*(1+Math.sin(a.phase)*.08),0,Math.PI*2);c.fill();c.strokeStyle="#f1fdff";c.lineWidth=1;c.stroke();
                }
                c.restore();
                const dx=asPlayer.x-a.x,dy=asPlayer.y-a.y;
                if(Math.hypot(dx,dy)<a.size+asPlayer.size*.75){asDamagePlayer(a.damage,"СИНГУЛЯРНОСТЬ");asAttacks.splice(i,1);continue;}
                if(a.life<=0||a.x<-80||a.x>480||a.y<-80||a.y>580)asAttacks.splice(i,1);
            }
            for(let i=asParticles.length-1;i>=0;i--){
                const p=asParticles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.97;p.vy*=.97;p.life--;
                c.globalAlpha=Math.max(0,p.life/p.maxLife);c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,Math.max(.1,p.size*p.life/p.maxLife),0,Math.PI*2);c.fill();
                if(p.life<=0)asParticles.splice(i,1);
            }
            asDrawDrillShots(c,now);
            c.globalAlpha=1;asDrawHeart(c);
            asDrawChargeAura(c,now);
            c.globalAlpha=1;
            c.restore();
        }
        // Floating text, effects, and existing character super visuals.
        for(let i=asTexts.length-1;i>=0;i--){const t=asTexts[i];t.y+=t.vy;t.life--;c.globalAlpha=Math.max(0,t.life/t.maxLife);c.fillStyle=t.color;c.shadowColor=t.color;c.shadowBlur=8;c.textAlign="center";c.font="bold 12px monospace";c.fillText(t.text,t.x,t.y);if(t.life<=0)asTexts.splice(i,1);}
        c.globalAlpha=1;c.restore();
        if(asFlash>0){c.save();c.globalAlpha=asFlash/35;c.fillStyle=asFlashColor;c.fillRect(0,0,400,500);c.restore();}
        if(asState==="fight"){
            if(typeof tickSupers==="function") {try{tickSupers();}catch(e){}}
            if(typeof renderSuperVisuals==="function") {try{c.save();renderSuperVisuals();c.restore();}catch(e){}}
            if(typeof window.drawJoystick==="function"){try{window.drawJoystick();}catch(e){}}
        }
        // Physics / input are stepped here, after rendering so the click hitbox stays aligned.
        if(asState==="fight"){
            if(asGravityNextShiftAt && now>=asGravityNextShiftAt)asShiftGravity(now);
            const left=asKeys.a||asKeys.arrowleft,right=asKeys.d||asKeys.arrowright;
            const up=asKeys.w||asKeys.arrowup,down=asKeys.s||asKeys.arrowdown;
            let mx=(right?1:0)-(left?1:0),my=(down?1:0)-(up?1:0);
            const joy=window._joystick;
            if(joy&&joy.enabled&&joy.active&&(joy.enabled||joy.mobileDpadActive)){mx=Number(joy.vectorX)||0;my=Number(joy.vectorY)||0;}
            else if(asPointer.down&&!asPointerChargeMode){mx=Math.max(-1,Math.min(1,(asPointer.x-asPlayer.x)/52));my=Math.max(-1,Math.min(1,(asPointer.y-asPlayer.y)/52));}
            const gravity=[{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}][asGravityDirection];
            let pullX=0,pullY=0;
            for(let wi=0;wi<asAttacks.length;wi++){
                const w=asAttacks[wi];if(!w||w.kind!=="well"||w.burst||w.timer<=0||(w.warning||0)>0)continue;
                const dx=w.x-asPlayer.x,dy=w.y-asPlayer.y,dist=Math.max(1,Math.hypot(dx,dy));
                if(dist<w.pullRadius){const f=1-dist/w.pullRadius;const pull=(.95+f*1.35);pullX+=dx/dist*pull*f;pullY+=dy/dist*pull*f;}
            }
            const jumpDot=mx*(-gravity.x)+my*(-gravity.y);
            const joyJump=!!(joy&&joy.enabled&&joy.active&&((Number(joy.vectorX)||0)*(-gravity.x)+(Number(joy.vectorY)||0)*(-gravity.y)>.62));
            if(asPlayer.grounded&&(asKeys[" "]||jumpDot>.58||joyJump)){
                asPlayer.vx=-gravity.x*11.6;asPlayer.vy=-gravity.y*11.6;
                asPlayer.grounded=false;asPlayer.platformIndex=null;
                asText(asPlayer.x,asPlayer.y-20,"ПРЫЖОК!","#68dcff",28);
            }
            // Гравитация действует по реальному вектору, а не поворотом всей сцены.
            // Steering only affects the surface tangent; up/down cannot provide endless thrust against gravity.
            const tangentX=-gravity.y,tangentY=gravity.x;
            const tangentInput=mx*tangentX+my*tangentY;
            const nextVx=(asPlayer.vx+tangentX*tangentInput*.43+gravity.x*.32+pullX)*.91;
            const nextVy=(asPlayer.vy+tangentY*tangentInput*.43+gravity.y*.32+pullY)*.91;
            const tangentLimit=6.2, normalLimit=12.4;
            asPlayer.vx=Math.max(gravity.x?-normalLimit:-tangentLimit,Math.min(gravity.x?normalLimit:tangentLimit,nextVx));
            asPlayer.vy=Math.max(gravity.y?-normalLimit:-tangentLimit,Math.min(gravity.y?normalLimit:tangentLimit,nextVy));
            const px=asPlayer.x,py=asPlayer.y,r=asPlayer.size;
            asPlayer.x+=asPlayer.vx;asPlayer.y+=asPlayer.vy;
            const bounds=asBounds();let boundaryGrounded=false;
            if(asPlayer.x<bounds.left){asPlayer.x=bounds.left;if(asGravityDirection===1){asPlayer.vx=0;boundaryGrounded=true;}else asPlayer.vx=Math.abs(asPlayer.vx)*.28;}
            if(asPlayer.x>bounds.right){asPlayer.x=bounds.right;if(asGravityDirection===3){asPlayer.vx=0;boundaryGrounded=true;}else asPlayer.vx=-Math.abs(asPlayer.vx)*.28;}
            if(asPlayer.y<bounds.top){asPlayer.y=bounds.top;if(asGravityDirection===2){asPlayer.vy=0;boundaryGrounded=true;}else asPlayer.vy=Math.abs(asPlayer.vy)*.28;}
            if(asPlayer.y>bounds.bottom){asPlayer.y=bounds.bottom;if(asGravityDirection===0){asPlayer.vy=0;boundaryGrounded=true;}else asPlayer.vy=-Math.abs(asPlayer.vy)*.28;}
            asApplyLaserBarriers(px,py,bounds);
            let landed=false;
            for(let i=0;i<asPlatforms.length;i++){
                if(!asPlatformIsVisible(i,now)&&i!==asSafePlatformIndex())continue;
                const g=asPlatformGeometry(asPlatforms[i],i,now);
                const ox=asPlayer.x+r>g.x&&asPlayer.x-r<g.x+g.w,oy=asPlayer.y+r>g.y&&asPlayer.y-r<g.y+g.h;
                let hit=false;
                if(asGravityDirection===0&&asPlayer.vy>0&&py+r<=g.y+3&&asPlayer.y+r>=g.y&&ox){asPlayer.y=g.y-r;asPlayer.vy=0;hit=true;}
                else if(asGravityDirection===2&&asPlayer.vy<0&&py-r>=g.y+g.h-3&&asPlayer.y-r<=g.y+g.h&&ox){asPlayer.y=g.y+g.h+r;asPlayer.vy=0;hit=true;}
                else if(asGravityDirection===1&&asPlayer.vx<0&&px-r>=g.x+g.w-3&&asPlayer.x-r<=g.x+g.w&&oy){asPlayer.x=g.x+g.w+r;asPlayer.vx=0;hit=true;}
                else if(asGravityDirection===3&&asPlayer.vx>0&&px+r<=g.x+3&&asPlayer.x+r>=g.x&&oy){asPlayer.x=g.x-r;asPlayer.vx=0;hit=true;}
                if(hit){asPlayer.grounded=true;asPlayer.platformIndex=i;landed=true;break;}
            }
            if(!landed){asPlayer.grounded=boundaryGrounded;asPlayer.platformIndex=boundaryGrounded?-1:null;}
            const ratio=asBossHp/asBossMaxHp,previousPhase=asPhase;asPhase=ratio<=.25?4:ratio<=.5?3:ratio<=.75?2:1;
            if(asPhase>previousPhase){
                const phaseColor=asPhase>=4?"#ff386f":(asPhase>=3?"#d56bff":"#55eaff");
                asShake=Math.max(asShake,16+asPhase*2);asFlash=Math.max(asFlash,12);asFlashColor=phaseColor;
                asText(200,116,"АНТИ-СПИРАЛЬ — ФАЗА "+asPhase+"!",phaseColor,100);
                asSound(asPhase>=4?58:(asPhase>=3?78:105),"sawtooth",.72,.18);
                for(let burst=0;burst<42;burst++){
                    const angle=Math.PI*2*burst/42,speed=2+Math.random()*5;
                    asParticles.push({x:asBoss.x,y:asBoss.y+25,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:24+Math.floor(Math.random()*12),maxLife:36,color:phaseColor,size:2+Math.random()*4});
                }
            }
            const chargeNow=Date.now(),canCharge=chargeNow>=asNextShotAt&&chargeNow-asLastDamageAt>=3000;
            if(canCharge&&asChargeFrames<150)asChargeFrames=Math.min(150,asChargeFrames+1);
            asCharging=canCharge&&asChargeFrames<150;asUpdateControls();
            if(asBossExposed>0)asBossExposed--;if(asLabyrinthTimer>0)asLabyrinthTimer--;
            asPatternTimer++;const duration=asPattern===7?250:178;
            if(asPatternTimer>duration){asPatternTimer=0;asPattern=(asPattern+1)%patterns.length;asPatternSpawned=false;asAttacks=asAttacks.filter(a=>a&&a.kind==="gravityTell");asText(200,100,patterns[asPattern],"#b8a2ff",52);asSound(260+asPattern*60,"sine",.18,.06);}
            const cadence=[42,70,58,78,92,82,76,178][asPattern]||58;
            if(asPattern===7){if(!asPatternSpawned)asSpawnPattern(now);}else if(asFrame%Math.max(27,cadence-asPhase*3)===0)asSpawnPattern(now);
            if(asPlayer.invuln>0)asPlayer.invuln--;
            const near=Math.hypot(asPlayer.x-asBoss.x,asPlayer.y-(asBoss.y+43))<52;
            const j=window._joystick;
            const deliberate=!!(left||right||up||down||asKeys[" "]||(j&&j.enabled&&j.active&&(Math.abs(Number(j.vectorX)||0)>.12||Math.abs(Number(j.vectorY)||0)>.12))||(asPointer.down&&!asPointerChargeMode));
            if(near&&deliberate&&now>=asMiniCooldownUntil&&now>=asGravityTransitionUntil)asBossApproachFrames++;else asBossApproachFrames=0;
            if(asBossApproachFrames>=8&&!asWinPending&&!asDefeatPending)asStartBrokenReality(now);
        }
        asAnimFrame=requestAnimationFrame(asRender);
    }
    function startAntiSpiralBossFight() {
        if(asActive) return;
        if(Number(typeof wave!=="undefined"?wave:0)!==1500) return;
        if(typeof currentEnemy==="undefined"||!currentEnemy||currentEnemy.hp<=0) return;
        asActive=true;window.antiSpiralBossActive=true;asState="cinematic";asWinPending=false;asDefeatPending=false;
        asInitPlatforms();asInitSeals();asDrillShots=[];asChargeFrames=0;asCharging=false;asLastDamageAt=Date.now();asNextShotAt=0;asMiniCooldownUntil=0;asMiniReturnPlayer=null;asMiniSpirals=[];asReassemblyEffectUntil=0;asBossExposed=0;asLabyrinthTimer=0;asUltimateActive=false;asPatternSpawned=false;
        asCinematicStart=performance.now();asCinematicRedHeart={x:-25,y:410};asCinematicArenaProgress=0;
        asBossMaxHp=Math.max(40000,Math.floor((Number(window.playerFinalDamage)||80)*120));
        asBossHp=asBossMaxHp;asPlayerMaxHp=220;asPlayerHp=asPlayerMaxHp;
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true,platformIndex:-1};
        asBoss={x:285,y:180,size:48,rotation:0,pulse:0,flash:0};
        asAttacks=[];asParticles=[];asTexts=[];asFrame=0;asPattern=0;asPatternTimer=0;
        asArenaWidth=400;asArenaHeight=470;asTargetWidth=400;asTargetHeight=470;asLastArenaShift=Date.now();asGravityDirection=0;asGravityNextShiftAt=0;
        asShake=0;asFlash=0;asBossDamageFlash=0;asPhase=1;asLastShot=0;asGravityPull=.10;
        asKeys=Object.create(null);asPointer={down:false,x:0,y:0,id:null};
        if(typeof arenaActive!=="undefined")arenaActive=false;
        if(typeof livingStoneActive!=="undefined")livingStoneActive=false;
        if(typeof waystarActive!=="undefined")waystarActive=false;
        window.rwbActive=false;
        ["superBtn","superBtn2","superBtnDeactivate","startArenaBtn","startLivingStoneBtn","startWaystarBtn","startRogerWB","startAntiSpiralBossBtn","skipBossBtn","spareBtn"].forEach(function(id){const el=document.getElementById(id);if(el)el.style.display="none";});
        if(asCinematicMusicTimer!==null){clearTimeout(asCinematicMusicTimer);asCinematicMusicTimer=null;}
        stopASMusic();
        if(typeof stopAllMusic==="function")stopAllMusic();
        asCinematicMusicTimer=setTimeout(function(){
            asCinematicMusicTimer=null;
            if(asActive&&asState==="cinematic")startASMusic();
        },2000);
        try {
            if(typeof initSuperState==="function")initSuperState();
            window._uniqueSuperCharges=5;window._uniqueSuperBossId="antispiral";
            // Super controls stay hidden until the cinematic ends.
        } catch(e) {}
        const overlay=document.getElementById("arenaOverlay");
        asInstallArenaTheme();
        if(overlay){overlay.classList.add("anti-spiral-arena");overlay.style.display="flex";}
        const name=document.getElementById("arenaBossName");if(name)name.innerText="♾️ АНТИ-СПИРАЛЬ";
        const hp=document.getElementById("arenaHP");if(hp)hp.innerText=asPlayerHp;
        const timer=document.getElementById("arenaTimer");if(timer)timer.innerText="∞";
        if(!asBind()){asActive=false;window.antiSpiralBossActive=false;stopASMusic();return;}
        asAnimFrame=requestAnimationFrame(asRender);
        // The cinematic plays automatically; the player only gains control after the final fall.
    }

    window.startAntiSpiralBossFight = startAntiSpiralBossFight;
    window.stopAntiSpiralBossFight = asStop;
    window.getAntiSpiralBossActive = function(){return asActive;};
    window.getAntiSpiralBossState = function(){return asState;};
    window.getAntiSpiralBossPlayer = function(){return asPlayer;};
    window.getAntiSpiralBossTarget = function(){return asBoss;};
    window.getAntiSpiralBossAttacks = function(){return asAttacks;};
    window.getAntiSpiralBossParticles = function(){return asParticles;};
    window.getAntiSpiralBossHp = function(){return asBossHp;};
    window.getAntiSpiralBossMaxHp = function(){return asBossMaxHp;};
    window.setAntiSpiralBossHp = function(v){asBossHp=Math.max(0,Math.min(asBossHp,Number(v)||0));if(asBossHp<=0)asWin();};
    window.getAntiSpiralPlayerHp = function(){return asPlayerHp;};
    window.setAntiSpiralPlayerHp = function(v){asPlayerHp=Math.max(0,Math.min(asPlayerMaxHp,Number(v)||0));const hpEl=document.getElementById("arenaHP");if(hpEl)hpEl.innerText=Math.ceil(asPlayerHp);if(asPlayerHp<=0)asLose();};
    window.getAntiSpiralPlayerMaxHp = function(){return asPlayerMaxHp;};
    window.antiSpiralAddShake = function(v){asShake=Math.max(asShake||0,Number(v)||0);};
    window.antiSpiralAddFlash = function(v,color){asFlash=Math.max(asFlash||0,Number(v)||0);if(color)asFlashColor=color;};
    window.antiSpiralAddShockwave = function(x,y,color,speed,life,width){
        for(let i=0;i<16;i++){const a=i*Math.PI/8;asParticles.push({x:x,y:y,vx:Math.cos(a)*(speed||3),vy:Math.sin(a)*(speed||3),life:life||24,maxLife:life||24,color:color||"#55cfff",size:Math.max(1,width||2)});}
    };
    window.damageAntiSpiralBoss = asBossHit;
    window.antiSpiralSpawnText = asText;
    window.antiSpiralPlaySound = asSound;
    console.log("[ANTI-SPIRAL] Уникальный бой 1500-й волны загружен.");
})();