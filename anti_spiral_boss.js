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
    let asAimMode = false;
    let asAimCursor = { x: 200, y: 260 };
    let asSlowUntilReal = 0;
    let asTimeScale = 1;
    let asPreviousTimeScale = 1;
    let asGameClock = 0;
    let asLastRafTimestamp = null;
    let asClockReady = false;
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
    let asMiniLasers = [];
    let asMiniLaserHits = 0;
    let asMiniLasersEnabled = false;
    let asMiniNextLaserAt = 0;
    let asPlayerScaleMode = 1; // 0.5 = tiny, 1 = normal, 2 = giant
    let asPlayerSizeNextAt = 0;
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
    let asPatternDraining = false;
    let asPatternVolleyCount = 0;
    let asLastArenaShift = 0;
    let asArenaWidth = 400;
    let asArenaHeight = 470;
    let asTargetWidth = 400;
    let asTargetHeight = 470;
    let asArenaLockUntil = 0;
    let asArenaWarpUntil = 0;
    let asLastArenaWarpCompact = false;
    let asCloneMode = false;
    let asClones = [];
    let asCloneUntil = 0;
    let asCloneNextShuffleAt = 0;
    let asClonePhase = "idle";
    let asCloneStageUntil = 0;
    let asGravityPull = 0.10;
    let asGravityDirection = 0; // 0 вниз, 1 влево, 2 вверх, 3 вправо
    let asGravityNextShiftAt = 0;
    let asGravityIntervalBand = -1;
    let asDreamOverlay = null;
    let asDreamWakeCount = 0;
    let asDreamEndingChoice = "";
    const AS_DREAM_WAKE_TAPS_REQUIRED = 15;
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
        "INFINITY BIG BANG STORM",
        "ЧЁРНАЯ КОРОНА — КРЕСТОВОЙ ЗАЛП",
        "ЗАПИСЬ СУДЬБЫ — ОТМЕНА РЕАЛЬНОСТИ",
        "ЧЕТЫРЕ ЛИКА — НАЙДИ ОРИГИНАЛ"
    ];

    function asCanvas() {
        if (typeof initArena === "function") initArena();
        return typeof canvas !== "undefined" ? canvas : document.getElementById("arenaCanvas");
    }
    function asCtx() { return typeof ctx !== "undefined" ? ctx : (asCanvas() && asCanvas().getContext("2d")); }
    function asClockNow() {
        return Date.now() + (asClockReady ? asGameClock - performance.now() : 0);
    }
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
            seal.phase += .035 * asTimeScale;
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
    function asUpdatePlayerSize(now) {
        if(!asPlayerSizeNextAt){asPlayerSizeNextAt=now+10000;return;}
        if(now<asPlayerSizeNextAt)return;
        asPlayerSizeNextAt=now+10000;
        const previous=asPlayerScaleMode;
        asPlayerScaleMode=Math.random()<.30?(Math.random()<.5?.5:2):1;
        asPlayer.size=12*asPlayerScaleMode;
        if(asPlayerScaleMode!==previous){
            const bounds=asBounds();
            asPlayer.x=Math.max(bounds.left,Math.min(bounds.right,asPlayer.x));
            asPlayer.y=Math.max(bounds.top,Math.min(bounds.bottom,asPlayer.y));
            const color=asPlayerScaleMode===.5?"#62efff":asPlayerScaleMode===2?"#ff9e78":"#d7f6ff";
            const message=asPlayerScaleMode===.5?"СЖАТИЕ! МАЛЕНЬКАЯ ФОРМА":asPlayerScaleMode===2?"ГИГАНТСКАЯ ФОРМА!":"РАЗМЕР ВОССТАНОВЛЕН";
            const detail=asPlayerScaleMode===.5?"СКОРОСТЬ ↑  ПРЫЖОК ↓":asPlayerScaleMode===2?"СИЛЬНЫЙ ПРЫЖОК ↑  СКОРОСТЬ ↓":"НОРМАЛЬНАЯ ФИЗИКА";
            asText(200,112,message,color,85);
            asText(200,132,detail,color,72);
            // Give the player a brief reaction window if a size roll changes the hitbox mid-attack.
            asPlayer.invuln=Math.max(asPlayer.invuln||0,48);
            asFlash=Math.max(asFlash,6);asFlashColor=color;
            asShake=Math.max(asShake,asPlayerScaleMode===2?10:5);
            asSound(asPlayerScaleMode===.5?560:asPlayerScaleMode===2?95:300,asPlayerScaleMode===2?"sawtooth":"triangle",.28,.11);
            for(let i=0;i<26;i++){
                const angle=Math.PI*2*i/26,speed=1.3+Math.random()*3.5;
                asParticles.push({x:asPlayer.x,y:asPlayer.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:16+Math.floor(Math.random()*10),maxLife:26,color:i%3===0?"#ffffff":color,size:1.6+Math.random()*3});
            }
        }
    }
    function asTryJump() {
        if (!asActive || asState !== "fight" || !asPlayer.grounded) return;
        const gravity = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}][asGravityDirection];
        const jumpMultiplier=asPlayerScaleMode===.5?.65:(asPlayerScaleMode===2?1.3:1);
        asPlayer.vx = -gravity.x * (23.2 / 1.5) * jumpMultiplier;
        asPlayer.vy = -gravity.y * (23.2 / 1.5) * jumpMultiplier;
        asPlayer.grounded = false;
        asPlayer.platformIndex = null;
        asText(asPlayer.x, asPlayer.y - 20, "ПРЫЖОК!", "#68dcff", 28);
        asSound(420, "sine", 0.12, 0.07);
    }
    // Кнопка выстрела включает замедленный прицел; следующий тап по арене задаёт направление бура.
    function asBeginAimMode() {
        if (!asActive || asState !== "fight") return;
        const now = asClockNow();
        if (now < asNextShotAt) { asUpdateControls(); return; }
        const sealIndex = asUnbrokenSealIndex();
        asAimCursor = sealIndex >= 0
            ? { x: asSeals[sealIndex].x, y: asSeals[sealIndex].y }
            : { x: asBoss.x, y: asBoss.y + 43 };
        asAimMode = true;
        asSlowUntilReal = performance.now() + 1500;
        asTimeScale = .5;
        if (asCloneMode) asCloneNextShuffleAt = Infinity;
        asText(200, 110, "ЗАМЕДЛЕНИЕ ×2 · 1,5 СЕКУНДЫ", "#7ef3ff", 90);
        asSound(620, "sine", .16, .06);
        asUpdateControls();
    }
    // Направление задаётся точкой нажатия. Из режима прицеливания выходим при выстреле.
    function asFireDrill(targetX, targetY) {
        if (!asActive || asState !== "fight") return;
        const now = asClockNow();
        if (now < asNextShotAt) {
            asAimMode = false;
            asUpdateControls();
            return;
        }
        const frames = asChargeFrames;
        asChargeFrames = 0;
        asCharging = false;
        asNextShotAt = now + 1500;
        asAimMode = false;
        asShootDrill(Math.max(8, frames), targetX, targetY);
        if (asCloneMode) asCloneNextShuffleAt = asGameClock + 950;
        asUpdateControls();
    }
    function asStartCharge() { asBeginAimMode(); }
    function asReleaseCharge() {}
    function asShootDrill(frames, aimX, aimY) {
        const charge = Math.max(0.04, Math.min(1, frames / 150));
        const sealIndex = asUnbrokenSealIndex();
        const hasAimPoint = Number.isFinite(aimX) && Number.isFinite(aimY);
        const targetSeal = !hasAimPoint && sealIndex >= 0 ? asSeals[sealIndex] : null;
        const targetX = hasAimPoint ? Math.max(0, Math.min(400, aimX)) : (targetSeal ? targetSeal.x : asBoss.x);
        const targetY = hasAimPoint ? Math.max(45, Math.min(500, aimY)) : (targetSeal ? targetSeal.y : asBoss.y + 43);
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
            targetType: hasAimPoint ? "aim" : (targetSeal ? "seal" : "boss"), sealIndex: sealIndex,
            targetX: targetX, targetY: targetY, distanceMax: distance, travelled: 0,
            trail: [], life: Math.max(3, Math.ceil(distance / (7 + charge * 4.5)) + 2), phase: 0, level: level
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
                    asHintElement.textContent = "⌨️ WASD / ← → — движение · Z — прицел с замедлением · нажми на арену, чтобы выстрелить";
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
            asBeginAimMode();
        });
        const hint = document.createElement("div");
        hint.textContent = "WASD / ← → — движение · W / ↑ / ПРОБЕЛ — прыжок · Z/X или кнопка БУР — замедлить время в 2 раза на 1,5 сек. реального времени; затем нажми на арену. Заряд растёт после 3 сек. без урона";
        hint.style.cssText = "flex-basis:100%;color:#b8eaff;text-align:center;font-size:10px;line-height:1.35;";
        row.appendChild(jump); row.appendChild(drill); row.appendChild(hint);
        c.parentNode.insertBefore(row, c.nextSibling);
        asControls = { row: row, jump: jump, drill: drill };
    }
    function asUpdateControls() {
        if (!asControls) return;
        const now = asClockNow();
        const pct = Math.round(asChargeFrames / 150 * 100);
        if (asAimMode) {
            asControls.drill.textContent = "🎯 ПРИЦЕЛ · НАЖМИ НА ТОЧКУ";
            asControls.drill.style.boxShadow = "0 0 22px rgba(83,238,255,.9)";
            asControls.drill.style.borderColor = "#77f7ff";
            return;
        }
        asControls.drill.style.borderColor = "#a988ff";
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
        asLastDamageAt = asClockNow();
        asCharging = false;
        asUpdateControls();
        const hpEl=document.getElementById("arenaHP"); if(hpEl)hpEl.innerText=Math.ceil(asPlayerHp);
        asPlayer.invuln = 42;
        asShake = Math.max(asShake, 10);
        asFlash = 10; asFlashColor = "#1f7bff";
        asText(asPlayer.x, asPlayer.y - 22, (label || "ГРАВИТАЦИОННЫЙ УДАР") + " -" + amount, "#70d9ff", 42);
        asSound(110, "sawtooth", 0.22, 0.09);
        // Contact hit: burst of luminous fragments and a pair of expanding rings.
        for(let i=0;i<26;i++){
            const angle=Math.PI*2*i/26+(Math.random()-.5)*.18, speed=1.8+Math.random()*4.6;
            asParticles.push({x:asPlayer.x,y:asPlayer.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:18+Math.floor(Math.random()*16),maxLife:34,color:i%3===0?"#ffffff":(i%2?"#69eaff":"#bd75ff"),size:1.8+Math.random()*3.5});
        }
        if(typeof window.antiSpiralAddShockwave==="function"){
            window.antiSpiralAddShockwave(asPlayer.x,asPlayer.y,"#64dbff",2,22,2);
        }
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
    function asGravityBandForRatio(ratio) {
        if (ratio <= 0.20) return 4;
        if (ratio <= 0.25) return 3;
        if (ratio <= 0.50) return 2;
        if (ratio <= 0.75) return 1;
        return 0;
    }
    function asGravityIntervalForBand(band) {
        return [15000, 12000, 9000, 6000, 3000][Math.max(0, Math.min(4, band))];
    }
    function asUpdateGravityCadence(now, ratio) {
        const band = asGravityBandForRatio(ratio);
        if (band === asGravityIntervalBand) return;
        asGravityIntervalBand = band;
        asGravityNextShiftAt = now + asGravityIntervalForBand(band);
        if (band === 4) {
            asText(200, 96, "ФИНАЛЬНАЯ ГРАВИТАЦИЯ: КАЖДЫЕ 3 СЕКУНДЫ", "#ff568e", 130);
            asSound(68, "sawtooth", .55, .17);
        }
    }
    function asResetGravityCadence(now) {
        asGravityIntervalBand = asGravityBandForRatio(asBossMaxHp > 0 ? asBossHp / asBossMaxHp : 1);
        asGravityNextShiftAt = now + asGravityIntervalForBand(asGravityIntervalBand);
    }
    function asShiftGravity(now) {
        asGravityDirection = (asGravityDirection + 1) % 4;
        // Gravity accelerates as the boss loses HP: 15s, 12s, 9s, 6s, then 3s below 20%.
        asGravityIntervalBand = asGravityBandForRatio(asBossMaxHp > 0 ? asBossHp / asBossMaxHp : 1);
        asGravityNextShiftAt = now + asGravityIntervalForBand(asGravityIntervalBand);
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
        // Preserve current projectiles and beams when gravity changes; let each move finish naturally.
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
            asAttacks.push({ kind: "sweep", orientation: "horizontal", y: firstY, warning: 64, life: 15, color: "#ff67d8", damage: damage + 2, hit: false });
            if (asPhase >= 2) {
                asAttacks.push({ kind: "sweep", orientation: "horizontal", y: Math.max(bounds.top + 80, bounds.bottom - 82), warning: 88, life: 13, color: "#a66bff", damage: damage, hit: false });
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
            asTriggerArenaWarp(now, "toggle", "РАЗРЕЗ ПРОСТРАНСТВА");
            // One clearly marked cross-cut, plus ONE secondary hazard (a sector wall OR a line).
            // Avoid stacking two barriers on top of a sweeping wall, which could close every escape route.
            const targetX=Math.max(bounds.left+22,Math.min(bounds.right-22,asPlayer.x));
            const targetY=Math.max(bounds.top+70,Math.min(bounds.bottom-55,asPlayer.y));
            asText(200,105,"РАЗРЕЗ ПРОСТРАНСТВА — УКЛОНИСЬ!","#bba0ff",72);
            asAttacks.push({kind:"laser",orientation:"vertical",x:targetX,y:0,warning:76,life:18,color:"#a978ff",damage:damage+2,hit:false});
            if(Math.random()<.58){
                const zone=Math.random()<.5?"lower":"upper";
                const zoneHeight=asPhase>=3?92:76;
                asAttacks.push({kind:"zoneLaser",zone:zone,height:zoneHeight,sweepDistance:asPhase>=3?96:76,warning:96,life:34,maxLife:34,color:zone==="lower"?"#65eaff":"#cf6bff",damage:damage+3,hit:false});
            }else{
                asAttacks.push({kind:"barrierLaser",orientation:"horizontal",x:0,y:targetY,warning:92,life:18,thickness:asPhase>=3?30:24,color:"#55dcff",damage:damage+3,hit:false});
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
            asTriggerArenaWarp(now, "collapse", "ГРАВИТАЦИОННЫЙ КОЛЛАПС");
            // Сингулярность тянет сердце к центру и затем выбрасывает энергию.
            const wellX = asPlayer.x < 200 ? bounds.left + 74 : bounds.right - 74;
            const wellY = Math.max(bounds.top + 92, Math.min(floor - 100, asPlayer.y - 45));
            asAttacks.push({ kind: "well", x: wellX, y: wellY, warning: 78, warningMax: 78, timer: 112, pullRadius: 320, radius: 100, color: "#bb67ff", damage: damage + 4, life: 0, burst: false, hit: false });
            if (asPhase >= 3) {
                asAttacks.push({ kind: "well", x: bounds.left + (bounds.right - bounds.left) * .5, y: wellY - 28, warning: 96, warningMax: 96, timer: 120, pullRadius: 280, radius: 84, color: "#46d7ff", damage: damage + 2, life: 0, burst: false, hit: false });
            }
        } else if (asPattern === 6) {
            asTriggerArenaWarp(now, "toggle", "СДВИГ ВЕРОЯТНОСТИ");
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
        } else if (asPattern === 8) {
            asTriggerArenaWarp(now, "toggle", "ЧЁРНАЯ КОРОНА");
            // The Black Crown gives a long warning, then chooses either a broad sector wall
            // OR a horizontal cross-laser with two separated markers—never all of them at once.
            const targetX=Math.max(bounds.left+24,Math.min(bounds.right-24,asPlayer.x));
            const targetY=Math.max(bounds.top+55,Math.min(bounds.bottom-30,asPlayer.y));
            asText(200,105,"ЧЁРНАЯ КОРОНА — НАЙДИ ПРОХОД!","#ff8bf3",82);
            asShake=Math.max(asShake,6);asSound(82,"sawtooth",.28,.1);
            asAttacks.push({kind:"laser",orientation:"vertical",x:targetX,y:0,warning:82,life:16,color:"#f566ff",damage:damage+2,hit:false});
            if(Math.random()<.5){
                const zone=Math.random()<.5?"lower":"upper";
                asAttacks.push({kind:"zoneLaser",zone:zone,height:asPhase>=3?100:82,sweepDistance:asPhase>=3?98:80,warning:100,life:36,maxLife:36,color:zone==="lower"?"#61eaff":"#e05dff",damage:damage+3,hit:false});
            }else{
                asAttacks.push({kind:"laser",orientation:"horizontal",x:0,y:targetY,warning:94,life:16,color:"#62eaff",damage:damage+3,hit:false});
                for(let mark=0;mark<2;mark++){
                    const side=mark===0?-1:1;
                    asAttacks.push({
                        kind:"mark",
                        x:Math.max(bounds.left+asPlayer.size+16,Math.min(bounds.right-asPlayer.size-16,targetX+side*(asPhase>=3?72:62))),
                        y:Math.max(bounds.top+asPlayer.size+18,Math.min(bounds.bottom-asPlayer.size-18,targetY+(mark===0?-34:34))),
                        timer:88+mark*16,radius:20+asPhase,damage:damage+1,life:0,hit:false,
                        color:mark===0?"#ff67d8":"#7e79ff"
                    });
                }
            }
        } else if (asPattern === 9) {
            // Записываем 2,5 секунды, затем призрачное сердце повторяет путь в исходном направлении.
            asAttacks.push({
                kind: "fateTrace", phase: "record", timer: 150,
                path: [], damage: damage + 2, life: 0
            });
            asTriggerArenaWarp(now, "toggle", "ЗАПИСЬ СУДЬБЫ");
            asText(200, 108, "ЗАПИСЬ СУДЬБЫ — НЕ ПОВТОРЯЙ СВОЙ ПУТЬ!", "#83edff", 92);
        } else if (asPattern === 10) {
            asStartCloneHunt(now);
            asText(200, 108, "ЧЕТЫРЕ ЛИКА — УГАДАЙ ОРИГИНАЛ!", "#83edff", 105);
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
        if((asPattern===0||asPattern===2)&&Math.random()<(asPhase>=3?.22:.13)){
            const remix=Math.floor(Math.random()*2);
            if(remix===0){
                // A pair of moderately slow homing shards: dangerous but escapable.
                const aim=Math.atan2(asPlayer.y-(asBoss.y+36),asPlayer.x-asBoss.x);
                for(let h=-1;h<=1;h+=2){
                    asAddAttack(asBoss.x,asBoss.y+36,Math.cos(aim+h*.32)*2.2,Math.sin(aim+h*.32)*2.2,9,"#f0a2ff",Math.max(5,damage-3),"orb");
                    asAttacks[asAttacks.length-1].homing=true;
                    asAttacks[asAttacks.length-1].turnRate=.026;
                    asAttacks[asAttacks.length-1].maxSpeed=3.0;
                }
            }else{
                // A single delayed marker, not a second full laser wall.
                const markX=Math.max(bounds.left+asPlayer.size+18,Math.min(bounds.right-asPlayer.size-18,asPlayer.x+asPlayer.vx*8));
                const markY=Math.max(bounds.top+asPlayer.size+18,Math.min(bounds.bottom-asPlayer.size-18,asPlayer.y+asPlayer.vy*6));
                asAttacks.push({kind:"mark",x:markX,y:markY,timer:76,radius:20+asPhase,damage:damage,life:0,hit:false,color:"#68eaff"});
            }
        }
        asSound(asPattern === 1 ? 180 : (asPattern === 3 ? 125 : 300), "sawtooth", asPattern === 3 ? .22 : .14, asPattern >= 3 ? .07 : .055);
    }
    function asCloneSlots() {
        const b = asBounds();
        const w = b.right - b.left, h = b.bottom - b.top;
        return [
            { x: b.left + w * .20, y: b.top + h * .27 },
            { x: b.left + w * .80, y: b.top + h * .27 },
            { x: b.left + w * .22, y: b.top + h * .65 },
            { x: b.left + w * .78, y: b.top + h * .65 }
        ];
    }
    function asShuffleCloneTargets(now) {
        const live = asClones.filter(function(clone) { return clone.alive; });
        if (live.length < 2 || asClonePhase !== "shuffle") return;
        const slots = asCloneSlots();
        for (let i = slots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = slots[i]; slots[i] = slots[j]; slots[j] = temp;
        }
        live.forEach(function(clone, i) {
            const target = slots[i];
            clone.fromX = clone.x; clone.fromY = clone.y;
            clone.toX = target.x; clone.toY = target.y;
            clone.moveStart = now; clone.moveDuration = 310;
        });
        asCloneNextShuffleAt = now + 720 + Math.random() * 170;
        asSound(330 + Math.random() * 120, "triangle", .09, .035);
    }
    function asMoveClonesToSlots(now) {
        const live = asClones.filter(function(clone) { return clone.alive; });
        const slots = asCloneSlots();
        for (let i = slots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = slots[i]; slots[i] = slots[j]; slots[j] = temp;
        }
        live.forEach(function(clone, i) {
            const target = slots[i];
            clone.fromX = clone.x; clone.fromY = clone.y;
            clone.toX = target.x; clone.toY = target.y;
            clone.moveStart = now; clone.moveDuration = 570;
        });
        asClonePhase = "scatter";
        asCloneStageUntil = now + 570;
        asCloneNextShuffleAt = asCloneStageUntil + 350;
        asText(200, 125, "ЛИКИ РАСХОДЯТСЯ — СЛЕДИ ЗА ОРИГИНАЛОМ!", "#83eaff", 76);
        asSound(260, "sine", .18, .055);
    }
    function asStartCloneHunt(now) {
        const bounds = asBounds();
        const centerX = (bounds.left + bounds.right) / 2;
        const centerY = (bounds.top + bounds.bottom) / 2;
        const originalIndex = Math.floor(Math.random() * 4);
        // All four likenesses appear around the true boss, then converge into a tight cluster
        // in the center before spreading to their first shuffled positions.
        const startOffsets = [
            {x:-45,y:-24},{x:45,y:-24},{x:-45,y:24},{x:45,y:24}
        ];
        const centerOffsets = [
            {x:-23,y:-20},{x:23,y:-20},{x:-23,y:20},{x:23,y:20}
        ];
        asCloneMode = true;
        asCloneUntil = Infinity;
        asClonePhase = "gather";
        asCloneStageUntil = now + 620;
        asCloneNextShuffleAt = Infinity;
        asClones = startOffsets.map(function(offset, i) {
            const x = asBoss.x + offset.x;
            const y = asBoss.y + 8 + offset.y;
            const target = centerOffsets[i];
            return {
                x:x,y:y,fromX:x,fromY:y,
                toX:centerX+target.x,toY:centerY+target.y,
                moveStart:now,moveDuration:620,phase:Math.random()*Math.PI*2,
                alive:true,isOriginal:i===originalIndex,identity:i
            };
        });
        asTriggerArenaWarp(now, "toggle", "ЧЕТЫРЕ ЛИКА");
        asShake = Math.max(asShake, 7);
        asFlash = Math.max(asFlash, 5); asFlashColor = "#6bcbff";
        asText(200, 108, "ОРИГИНАЛ СОЗДАЁТ ТРИХ ЛОЖНЫХ ЛИКОВ!", "#c4a5ff", 90);
        asText(200, 128, "ОНИ СХОДЯТСЯ В ЦЕНТР...", "#7feeff", 86);
        asSound(145, "sawtooth", .32, .1);
    }
    function asUpdateCloneHunt(now) {
        if (!asCloneMode) return;
        const live = asClones.filter(function(clone) { return clone.alive; });
        // When only the original remains, the guessing phase resolves without giving free damage.
        if (live.length <= 1 && live.length === 1 && live[0].isOriginal) {
            asCloneMode = false; asClones = []; asCloneUntil = 0;
            asCloneNextShuffleAt = 0; asClonePhase = "idle"; asCloneStageUntil = 0;
            asText(200, 124, "ОСТАЛСЯ ТОЛЬКО ОРИГИНАЛ — КЛОНЫ РАЗБИТЫ!", "#8ff8ff", 82);
            asSound(640, "triangle", .24, .08);
            return;
        }
        asClones.forEach(function(clone) {
            if (!clone.alive) return;
            const t = Math.max(0, Math.min(1, (now - clone.moveStart) / Math.max(1, clone.moveDuration)));
            const eased = t * t * (3 - 2 * t);
            clone.x = clone.fromX + (clone.toX - clone.fromX) * eased;
            clone.y = clone.fromY + (clone.toY - clone.fromY) * eased;
        });
        if (asAimMode) return;
        // If the 1.5-second aiming window ended without a shot, resume shuffling.
        if (asClonePhase === "shuffle" && asCloneNextShuffleAt === Infinity) {
            asCloneNextShuffleAt = now + 250;
        }
        if (asClonePhase === "gather" && now >= asCloneStageUntil) {
            asMoveClonesToSlots(now);
            return;
        }
        if (asClonePhase === "scatter" && now >= asCloneStageUntil) {
            asClonePhase = "shuffle";
            asCloneNextShuffleAt = now + 220;
            return;
        }
        if (asClonePhase === "shuffle" && now >= asCloneNextShuffleAt) asShuffleCloneTargets(now);
    }
    function asDrawCloneHunt(c, now) {
        asClones.forEach(function(clone) {
            if (!clone.alive) return;
            c.save();
            c.globalAlpha = .22 + Math.abs(Math.sin(now / 130 + clone.phase)) * .14;
            c.strokeStyle = "#8e67ff"; c.lineWidth = 1.4;
            c.shadowColor = "#a968ff"; c.shadowBlur = 14;
            c.beginPath(); c.ellipse(clone.x, clone.y, 30, 38, Math.sin(now / 700 + clone.phase) * .12, 0, Math.PI * 2); c.stroke();
            c.restore();
            asDrawAntiSpiralHead(c, clone.x, clone.y, .86, now + clone.phase * 120, 1);
            c.save();
            c.globalAlpha = .74; c.fillStyle = "#bdf5ff"; c.textAlign = "center"; c.font = "bold 9px monospace";
            c.fillText("?", clone.x, clone.y + 51);
            c.restore();
        });
        const liveCount = asClones.filter(function(clone) { return clone.alive; }).length;
        c.save();
        c.fillStyle = "rgba(2,4,18,.92)"; c.fillRect(43, 98, 314, 23);
        c.strokeStyle = "#70eaff"; c.lineWidth = 1.2; c.strokeRect(43, 98, 314, 23);
        c.fillStyle = "#d2fbff"; c.font = "bold 10px monospace"; c.textAlign = "center";
        c.fillText(liveCount + " ЛИКА · НАЙДИ НАСТОЯЩЕГО", 200, 113);
        c.restore();
    }
        function asTriggerArenaWarp(now, mode, name) {
        if (now < asArenaLockUntil) return;
        const compact = mode === "collapse" ? true : mode === "expand" ? false : !asLastArenaWarpCompact;
        asLastArenaWarpCompact = compact;
        asTargetWidth = compact ? 264 : 400;
        asTargetHeight = compact ? 342 : 470;
        asArenaWarpUntil = now + 1480;
        asArenaLockUntil = now + 3650;
        asLastArenaShift = now;
        asText(200, 128, compact ? "ПРОСТРАНСТВО СЖИМАЕТСЯ!" : "ПРОСТРАНСТВО РАСКРЫВАЕТСЯ!", compact ? "#ff8ef2" : "#79efff", 76);
        if (name) asText(200, 146, name, "#ddc7ff", 56);
        asShake = Math.max(asShake, compact ? 9 : 6);
        asFlash = Math.max(asFlash, 5); asFlashColor = compact ? "#cf69ff" : "#53dfff";
        asSound(compact ? 78 : 190, "sawtooth", .26, .09);
    }
    function asUpdateArenaWarp(now) {
        if (!asArenaWarpUntil || now < asArenaWarpUntil) return;
        asArenaWarpUntil = 0;
        asTargetWidth = 400; asTargetHeight = 470;
        asArenaLockUntil = now + 2200;
        asText(200, 150, "ГРАНИЦЫ РЕАЛЬНОСТИ ВОССТАНОВЛЕНЫ", "#83eaff", 48);
    }
    function asShiftArena(now) {
        if (!asLastArenaShift) asLastArenaShift = now;
        if (now < asArenaLockUntil || now - asLastArenaShift < 6200) return;
        asLastArenaShift = now;
        const wide = asArenaWidth < 340;
        asTargetWidth = wide ? 400 : 264;
        asTargetHeight = wide ? 470 : 342;
        asLastArenaWarpCompact = !wide;
        asText(200, 85, wide ? "ПРОСТРАНСТВО РАСКРЫВАЕТСЯ" : "ПРОСТРАНСТВО РЕЗКО СЖИМАЕТСЯ", "#67d8ff", 70);
        asShake = 7;
        asSound(wide ? 100 : 125, "sawtooth", 0.3, 0.07);
    }
    function asKeyDown(ev) {
        if (!asActive) return;
        const k = ev.key.toLowerCase();
        if (["arrowleft","arrowright","arrowup","arrowdown"," ","w","a","s","d","enter","z","x"].includes(k)) ev.preventDefault();
        if ((k === "z" || k === "x") && !asKeys[k]) asStartCharge();
        asKeys[k] = true;
        if (k === "escape" && asState === "fight" && asAimMode) {
            asAimMode = false;
            if (asCloneMode) asCloneNextShuffleAt = asGameClock + 250;
            asText(200, 110, "ПРИЦЕЛ ОТМЕНЁН", "#bbaaff", 42);
            asUpdateControls(); return;
        }
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
        if (asAimMode) {
            asAimCursor = { x: x, y: y };
            asFireDrill(x, y);
            return;
        }
        if (asCloneMode) {
            for (let ci = 0; ci < asClones.length; ci++) {
                const clone = asClones[ci];
                if (clone.alive && Math.hypot(x - clone.x, y - clone.y) < 34) {
                    asFireDrill(x, y);
                    return;
                }
            }
        }
        // Прямое нажатие на босса тоже направляет выстрел точно в точку касания.
        if (Math.hypot(x - asBoss.x, y - (asBoss.y + 36)) < asBoss.size * 1.75) {
            asFireDrill(x, y);
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
        if (!asActive) return;
        const c = asCanvas(); if (!c) return;
        const rect = c.getBoundingClientRect();
        const x = (ev.clientX - rect.left) * 400 / rect.width;
        const y = (ev.clientY - rect.top) * 500 / rect.height;
        if (asAimMode) { asAimCursor = { x: x, y: y }; return; }
        if (!asPointer.down || asPointerChargeMode) return;
        asPointer.x = x;
        asPointer.y = y;
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
        asState="fight"; asPatternTimer=0; asLastArenaShift=asGameClock;
        asGravityDirection=0; asResetGravityCadence(asGameClock);
        asLastDamageAt=asClockNow(); asNextShotAt=0; asChargeFrames=0; asCharging=false;
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true,platformIndex:-1};
        asText(200,250,"ПОКАЖИ СВОЮ ВОЛЮ!","#7de1ff",90);
        asSound(420,"sine",0.35,0.12);
    }
    function asDreamElement(parent, tag, text, css) {
        const el = document.createElement(tag);
        if (text !== undefined && text !== null) el.textContent = String(text);
        if (css) {
            if (/^[a-z0-9_-]+$/i.test(css)) el.className = css;
            else el.style.cssText = css;
        }
        parent.appendChild(el);
        return el;
    }
    function asDreamButton(parent, label, accent, action, fogged) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.style.cssText =
            "display:block;width:100%;min-height:52px;padding:12px 14px;margin:7px 0;" +
            "border:1px solid " + accent + ";border-radius:12px;" +
            "background:linear-gradient(145deg,rgba(39,37,67,.96),rgba(9,11,27,.98));" +
            "color:#fff;font:900 12px/1.4 Arial,sans-serif;letter-spacing:.55px;" +
            "cursor:pointer;touch-action:manipulation;opacity:" + (fogged ? ".8" : "1") + ";" +
            "filter:" + (fogged ? "blur(1.5px)" : "none") + ";" +
            "box-shadow:0 0 17px " + accent + "20;";
        button.addEventListener("click", action);
        parent.appendChild(button);
        return button;
    }
    function asCreateDreamOverlay() {
        if (asDreamOverlay && asDreamOverlay.parentNode) asDreamOverlay.remove();
        const overlay = document.createElement("div");
        overlay.id = "antiSpiralDreamEnding";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Концовка Анти-Спирали");
        overlay.style.cssText =
            "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;" +
            "justify-content:center;padding:14px;overflow:auto;box-sizing:border-box;" +
            "background:radial-gradient(ellipse at 50% 10%,rgba(91,86,155,.35),transparent 55%),rgba(2,3,12,.96);" +
            "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-family:Arial,sans-serif;color:#fff;";
        const style = document.createElement("style");
        style.textContent =
            "#antiSpiralDreamEnding *{box-sizing:border-box}" +
            "#antiSpiralDreamEnding .as-dream-panel{width:min(780px,100%);max-height:calc(100dvh - 28px);overflow:auto;" +
            "padding:clamp(15px,3.5vw,29px);border:1px solid rgba(181,157,255,.42);border-radius:19px;" +
            "background:radial-gradient(ellipse at top,rgba(80,68,135,.34),transparent 58%),linear-gradient(145deg,rgba(11,12,29,.99),rgba(3,5,16,.995));" +
            "box-shadow:0 25px 90px rgba(0,0,0,.7),inset 0 0 36px rgba(114,83,200,.09);color:#fff}" +
            "#antiSpiralDreamEnding .as-dream-title{font-size:clamp(22px,4.7vw,34px);font-weight:1000;line-height:1.16;letter-spacing:1px;text-align:center;margin:0 0 12px;color:#e6dcff;text-shadow:0 0 23px rgba(155,117,255,.36)}" +
            "#antiSpiralDreamEnding .as-dream-copy{font-size:13px;line-height:1.7;color:#d8d7e8;margin:10px 0}" +
            "#antiSpiralDreamEnding .as-dream-status{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin:15px 0}" +
            "#antiSpiralDreamEnding .as-dream-status span{border:1px solid rgba(165,151,236,.34);border-radius:9px;padding:8px 10px;background:rgba(22,23,48,.72);font-size:10px;font-weight:900;color:#eee6ff}" +
            "#antiSpiralDreamEnding .as-dream-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0 16px}" +
            "#antiSpiralDreamEnding .as-dream-card{min-width:0;padding:9px 7px;border:1px solid rgba(179,153,255,.34);border-radius:10px;background:linear-gradient(145deg,rgba(32,30,62,.94),rgba(9,13,32,.97));text-align:center}" +
            "#antiSpiralDreamEnding .as-dream-card-name{font-size:11px;font-weight:900;line-height:1.35;overflow-wrap:anywhere;color:#f3edff}" +
            "#antiSpiralDreamEnding .as-dream-level{font-size:9px;font-weight:900;color:#f0ceff;margin-top:6px;letter-spacing:.35px}" +
            "@media(min-width:620px){#antiSpiralDreamEnding .as-dream-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}";
        overlay.appendChild(style);
        document.body.appendChild(overlay);
        asDreamOverlay = overlay;
        return overlay;
    }
    function asReplaceDreamPanel(overlay) {
        const oldPanels = overlay.querySelectorAll(".as-dream-panel");
        oldPanels.forEach(function(oldPanel) { oldPanel.remove(); });
        const panel = document.createElement("div");
        panel.className = "as-dream-panel";
        overlay.appendChild(panel);
        return panel;
    }
    function asRenderDreamOutcome(kind) {
        const overlay = asDreamOverlay || document.getElementById("antiSpiralDreamEnding");
        if (!overlay) return;
        const panel = asReplaceDreamPanel(overlay);
        const waking = kind === "wake";
        asDreamElement(panel, "div",
            waking ? "СБОЙ ИЛЛЮЗИИ · РЕАЛЬНОСТЬ" : "КОНЦОВКА · ПОРАЖЕНИЕ",
            "font-size:10px;font-weight:900;letter-spacing:1.8px;text-align:center;color:" +
            (waking ? "#7eeaff" : "#ff8199") + ";margin:0 0 10px;");
        asDreamElement(panel, "h1", waking ? "ТЫ ПРОСНУЛСЯ" : "ТЫ ОСТАЛСЯ ВО СНЕ",
            "font-size:clamp(24px,5vw,36px);line-height:1.14;text-align:center;margin:0 0 18px;font-weight:1000;color:" +
            (waking ? "#dcfaff" : "#ffc4d0") + ";");
        if (waking) {
            asDreamElement(panel, "p",
                "Анти-Спираль обманул тебя. Все эволюционные карты 7-го уровня, собранные блоки сервера и возвращённое сохранение были частью идеальной вселенной мечты. Ты мог бесконечно фармить любимую игру, где у тебя только одна жизнь, но всё это было ненастоящим.",
                "font-size:14px;line-height:1.7;color:#e8e8f5;margin:0 0 12px;");
            asDreamElement(panel, "p",
                "Но Анти-Спирали уже нет. Перед исчезновением он узнал твою историю, и ему стало невероятно грустно. Поэтому он сам нашёл и оставил тебе второй кусок блока сервера. Этот фрагмент настоящий: он останется у тебя после возвращения.",
                "font-size:14px;line-height:1.7;color:#c9f8ff;margin:0 0 20px;");
            asDreamButton(panel, "ЗАБРАТЬ ФРАГМЕНТ И ВЕРНУТЬСЯ В ИГРУ", "#69e9ff", function() {
                if (asDreamEndingChoice !== "wake-reveal") return;
                asDreamEndingChoice = "wake-finish";
                try {
                    if (typeof defeatedBosses !== "undefined" && Array.isArray(defeatedBosses) && !defeatedBosses.includes(1500)) {
                        defeatedBosses.push(1500);
                    }
                    const alreadyAwarded = typeof slotData !== "undefined" && slotData &&
                        slotData.antiSpiralServerPieceAwarded === true;
                    if (!alreadyAwarded) {
                        if (typeof slotData !== "undefined" && slotData) {
                            // Flag first: addItem() saves automatically.
                            slotData.antiSpiralServerPieceAwarded = true;
                        }
                        if (typeof addItem === "function") {
                            addItem("server_block", 1);
                        } else if (typeof inventory !== "undefined" && inventory) {
                            inventory.server_block = Math.min(2, (Number(inventory.server_block) || 0) + 1);
                        }
                    }
                    if (typeof currentEnemy !== "undefined" && currentEnemy) currentEnemy.hp = 0;
                    if (typeof saveAll === "function") saveAll();
                } catch (e) {
                    console.error("[ANTI-SPIRAL] Не удалось сохранить истинную концовку:", e);
                }
                if (asDreamOverlay && asDreamOverlay.parentNode) asDreamOverlay.remove();
                asDreamOverlay = null;
                try {
                    if (typeof victory === "function") victory();
                } catch (e) {
                    console.error("[ANTI-SPIRAL] Ошибка перехода к победе:", e);
                }
            }, false);
        } else {
            asDreamElement(panel, "p",
                "Ты решил остаться в мире, который Анти-Спираль собрал специально под твою мечту. Он обманул тебя, бросив во вселенную, где всё идеально, и победил не силой, а тем, что ты сам отказался просыпаться.",
                "font-size:14px;line-height:1.7;color:#f1dfe6;margin:0 0 12px;");
            asDreamElement(panel, "p",
                "Эта концовка засчитывается как поражение. Настоящее сохранение не возвращено, а Анти-Спираль остаётся победителем.",
                "font-size:13px;line-height:1.7;color:#ff9eaf;margin:0 0 20px;font-weight:800;");
            asDreamButton(panel, "ЗАКРЫТЬ КОНЦОВКУ", "#ff7994", function() {
                if (asDreamEndingChoice !== "stay") return;
                if (asDreamOverlay && asDreamOverlay.parentNode) asDreamOverlay.remove();
                asDreamOverlay = null;
                asRestoreStartButton();
            }, false);
        }
    }
    function asShowDreamEnding() {
        const overlay = asCreateDreamOverlay();
        asDreamWakeCount = 0;
        asDreamEndingChoice = "dream";
        const finishCinematic = function() {
            if (!overlay.parentNode || asDreamEndingChoice !== "dream") return;
            asShowDreamChoices(overlay);
        };
        if (window.ASDreamCinematic && typeof window.ASDreamCinematic.start === "function") {
            window.ASDreamCinematic.start(overlay, finishCinematic);
        } else {
            // Нельзя блокировать концовку, если отдельный файл анимации не загрузился.
            finishCinematic();
        }
    }
    function asShowDreamChoices(overlay) {
        const panel = asReplaceDreamPanel(overlay);
        asDreamElement(panel, "div", "АНТИ-СПИРАЛЬ · ПОСЛЕДНЯЯ ИЛЛЮЗИЯ",
            "font-size:10px;font-weight:900;letter-spacing:2px;text-align:center;color:#bcb0ff;margin:0 0 10px;");
        asDreamElement(panel, "h1", "ТВОЯ ИДЕАЛЬНАЯ ВСЕЛЕННАЯ", "as-dream-title");
        asDreamElement(panel, "p",
            "Ты победил. Наконец-то всё получилось: каждый кусок блока сервера найден, сохранение возвращено, и теперь можно снова проводить целые сутки в любимой гринд-игре, где у тебя всего одна жизнь.",
            "text-align:center;");
        panel.lastElementChild.className = "as-dream-copy";
        const badges = document.createElement("div");
        badges.className = "as-dream-status";
        asDreamElement(badges, "span", "▣ ВСЕ БЛОКИ СЕРВЕРА СОБРАНЫ");
        asDreamElement(badges, "span", "✓ СОХРАНЕНИЕ ВОЗВРАЩЕНО");
        asDreamElement(badges, "span", "∞ ОДНА ЖИЗНЬ · БЕСКОНЕЧНЫЙ ФАРМ");
        panel.appendChild(badges);
        asDreamElement(panel, "div", "ЭВОЛЮЦИОННЫЕ КАРТЫ · МАСТЕРСТВО 7",
            "font-size:11px;font-weight:1000;letter-spacing:.8px;text-align:center;color:#e8b8ff;margin:16px 0 8px;");
        const grid = document.createElement("div");
        grid.className = "as-dream-grid";
        let evoTemplates = [];
        try {
            if (typeof customCardTemplates !== "undefined" && customCardTemplates &&
                Array.isArray(customCardTemplates["Эволюционная"])) {
                evoTemplates = customCardTemplates["Эволюционная"];
            }
        } catch (e) {}
        if (!evoTemplates.length) {
            try {
                if (typeof myCards !== "undefined" && Array.isArray(myCards)) {
                    evoTemplates = myCards.filter(function(card) { return card && card.rarity === "Эволюционная"; });
                }
            } catch (e) {}
        }
        const seenNames = Object.create(null);
        evoTemplates.forEach(function(card) {
            const name = String(card && card.name || "").trim();
            if (!name || seenNames[name]) return;
            seenNames[name] = true;
            const tile = document.createElement("div");
            tile.className = "as-dream-card";
            asDreamElement(tile, "div", name, "as-dream-card-name");
            asDreamElement(tile, "div", "★ МАСТЕРСТВО 7", "as-dream-level");
            grid.appendChild(tile);
        });
        if (!grid.children.length) {
            asDreamElement(grid, "div", "Все эволюционные карты", "as-dream-card-name");
        }
        panel.appendChild(grid);
        const copy = asDreamElement(panel, "p",
            "Странно только одно: в идеальном мире даже воздух кажется затуманенным. Ты можешь попытаться проснуться. Или остаться здесь навсегда.",
            "text-align:center;");
        copy.className = "as-dream-copy";
        const hint = asDreamElement(panel, "p", "СОН СЛИШКОМ ИДЕАЛЕН",
            "font-size:10px;letter-spacing:2px;text-align:center;color:#9da0bf;margin:12px 0 6px;");
        const buttons = document.createElement("div");
        buttons.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:8px;margin-top:8px;";
        panel.appendChild(buttons);
        const wakeButton = asDreamButton(buttons, "🌫️ ПРОСНУТЬСЯ · 0/" + AS_DREAM_WAKE_TAPS_REQUIRED, "#74dfff", function() {
            if (asDreamEndingChoice !== "dream") return;
            asDreamWakeCount++;
            wakeButton.textContent = "🌫️ ПРОСНУТЬСЯ · " +
                Math.min(asDreamWakeCount, AS_DREAM_WAKE_TAPS_REQUIRED) + "/" + AS_DREAM_WAKE_TAPS_REQUIRED;
            wakeButton.style.filter = "blur(" + Math.max(.12, 1.5 - asDreamWakeCount * .085) + "px)";
            if (asDreamWakeCount < 4) hint.textContent = "ТУМАН НЕ РАССЕИВАЕТСЯ...";
            else if (asDreamWakeCount < 9) hint.textContent = "ТЫ УЖЕ ПЫТАЛСЯ ПРОСНУТЬСЯ. ЭТО НЕ СХОДИТСЯ.";
            else if (asDreamWakeCount < AS_DREAM_WAKE_TAPS_REQUIRED) {
                hint.textContent = "РЕАЛЬНОСТЬ ТРЕЩИТ. НАЖМИ ЕЩЁ " +
                    (AS_DREAM_WAKE_TAPS_REQUIRED - asDreamWakeCount) + " РАЗ.";
            }
            if (asDreamWakeCount >= AS_DREAM_WAKE_TAPS_REQUIRED) {
                asDreamEndingChoice = "wake-reveal";
                asRenderDreamOutcome("wake");
            }
        }, true);
        const stayButton = asDreamButton(buttons, "🌫️ ОСТАТЬСЯ", "#b49cff", function() {
            if (asDreamEndingChoice !== "dream") return;
            asDreamEndingChoice = "stay";
            asStop();
            asRenderDreamOutcome("stay");
            setTimeout(function() {
                try {
                    // Prevent revive passives from turning this ending into a victory.
                    if (typeof resurrectedThisFight !== "undefined") resurrectedThisFight = true;
                    if (typeof playerHp !== "undefined") playerHp = 0;
                    if (typeof defeat === "function") defeat();
                } catch (e) {
                    console.error("[ANTI-SPIRAL] Ошибка фиксации концовки-поражения:", e);
                }
            }, 80);
        }, true);
        wakeButton.setAttribute("aria-label", "Нажми " + AS_DREAM_WAKE_TAPS_REQUIRED + " раз, чтобы проснуться");
        stayButton.setAttribute("aria-label", "Остаться во сне и завершить бой поражением");
    }
    function asWin() {
        if(asWinPending) return;
        asWinPending=true; asState="victory"; asAttacks=[];
        asText(200,245,"НЕВОЗМОЖНО...","#ffffff",120);
        asFlash=28; asFlashColor="#ffffff"; asShake=22;
        for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*7;asParticles.push({x:asBoss.x,y:asBoss.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:45,maxLife:45,color:i%2?"#54d6ff":"#b45bff",size:2+Math.random()*5});}
        asSound(740,"sine",0.75,0.16);
        setTimeout(function(){
            asStop();
            asShowDreamEnding();
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
        asActive=false; asAimMode=false; asSlowUntilReal=0; asTimeScale=1; asPreviousTimeScale=1; asCloneMode=false;asClones=[];asCloneUntil=0;asCloneNextShuffleAt=0;asClonePhase="idle";asCloneStageUntil=0;asArenaLockUntil=0;asArenaWarpUntil=0; window.antiSpiralBossActive=false;
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
    function asDrillImpact(x, y, charge, tint) {
        const power = Math.max(.08, Math.min(1, Number(charge) || 0));
        const color = tint || "#66efff";
        const amount = 15 + Math.floor(power * 17);
        for (let q = 0; q < amount; q++) {
            const angle = Math.PI * 2 * q / amount + Math.random() * .16;
            const speed = 1.5 + Math.random() * (2.5 + power * 4);
            asParticles.push({
                x:x, y:y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
                life:16 + Math.random()*10, maxLife:26,
                color:q%3===0?"#ffffff":(q%2?color:"#bca0ff"),
                size:1.8 + Math.random()*(1.5+power*2.2)
            });
        }
        asFlash = Math.max(asFlash, 2 + power * 2.5);
        asFlashColor = color;
        asShake = Math.max(asShake, 2 + power * 5);
        asSound(410 + power * 410, "triangle", .16 + power * .12, .06 + power * .03);
    }
    function asDrawDrillShots(c,now) {
        for (let i = asDrillShots.length - 1; i >= 0; i--) {
            const shot = asDrillShots[i];
            const speed = Math.max(.01, Math.hypot(shot.vx, shot.vy));
            const remaining = Math.max(0, (shot.distanceMax || 0) - (shot.travelled || 0));
            const step = Math.min(speed * asTimeScale, remaining);
            shot.x += shot.vx / speed * step; shot.y += shot.vy / speed * step;
            shot.travelled = (shot.travelled || 0) + step; shot.life-=asTimeScale; shot.phase += .28*asTimeScale;
            shot.trail = shot.trail || [];
            shot.trail.push({x:shot.x,y:shot.y});
            if (shot.trail.length > 11) shot.trail.shift();
            // This after-image belongs to the player's drill, not the boss's projectiles.
            c.save(); c.lineCap="round"; c.lineJoin="round";
            for (let t=1;t<shot.trail.length;t++) {
                const p0=shot.trail[t-1],p1=shot.trail[t],f=t/shot.trail.length;
                c.globalAlpha=(.14+.62*f)*(.65+shot.charge*.45);
                c.strokeStyle=t%3===0?"#d3a4ff":"#65f5ff";
                c.shadowColor=c.strokeStyle;c.shadowBlur=7+shot.charge*17;
                c.lineWidth=(1.2+shot.charge*4.8)*f;
                c.beginPath();c.moveTo(p0.x,p0.y);c.lineTo(p1.x,p1.y);c.stroke();
            }
            c.restore();
            c.save(); c.translate(shot.x,shot.y); c.rotate(Math.atan2(shot.vy,shot.vx) + Math.PI/2);
            const pulse=1+Math.sin(shot.phase*1.5)*.1;
            const radius=shot.radius*(.94+shot.charge*.18)*pulse;
            c.globalAlpha=.32;c.fillStyle="#62edff";c.shadowColor="#5eeeff";c.shadowBlur=32;
            c.beginPath();c.arc(0,0,radius*1.65,0,Math.PI*2);c.fill();
            c.globalAlpha=1;c.shadowColor=shot.charge>.78?"#d19aff":"#55eaff";c.shadowBlur=26+shot.charge*30;
            const core=c.createLinearGradient(0,-radius*2.1,0,radius*1.1);
            core.addColorStop(0,"#ffffff");core.addColorStop(.28,shot.charge>.78?"#f4eaff":"#c8fbff");
            core.addColorStop(.62,"#57ecff");core.addColorStop(1,shot.charge>.78?"#a56bff":"#1687ff");
            c.fillStyle=core;
            c.beginPath();c.moveTo(0,-radius*2.05);c.lineTo(radius*.76,-radius*.16);
            c.lineTo(radius*.48,radius*.75);c.lineTo(0,radius*1.12);
            c.lineTo(-radius*.48,radius*.75);c.lineTo(-radius*.76,-radius*.16);c.closePath();c.fill();
            c.strokeStyle="#ffffff";c.lineWidth=1.7;c.stroke();
            c.strokeStyle=shot.charge>.78?"#e4baff":"#bdfcff";c.lineWidth=1.6;c.shadowBlur=18;
            c.beginPath();c.ellipse(0,0,radius*1.28,radius*.43,shot.phase,0,Math.PI*2);c.stroke();
            c.beginPath();c.ellipse(0,0,radius*.84,radius*.28,-shot.phase*1.35,0,Math.PI*2);c.stroke();
            c.globalAlpha=.95;c.lineWidth=1.4;
            c.beginPath();c.moveTo(-radius*1.28,0);c.lineTo(radius*1.28,0);
            c.moveTo(0,-radius*1.4);c.lineTo(0,radius*1.4);c.stroke();
            c.restore();
            if (asCloneMode) {
                let hitClone = null;
                for (let ci = 0; ci < asClones.length; ci++) {
                    const candidate = asClones[ci];
                    if (candidate.alive && Math.hypot(shot.x - candidate.x, shot.y - candidate.y) < 34 + shot.radius) {
                        hitClone = candidate; break;
                    }
                }
                if (hitClone) {
                    asDrillImpact(shot.x, shot.y, shot.charge, hitClone.isOriginal ? "#65efff" : "#bd83ff");
                    if (hitClone.isOriginal) {
                        asCloneMode = false; asCloneUntil = 0; asCloneNextShuffleAt = 0; asClonePhase = "idle"; asCloneStageUntil = 0; asClones = [];
                        let cloneMultiplier = asBossExposed > 0 ? 2.45 : .42;
                        if (asPlayer.y < 270) cloneMultiplier *= 1.25;
                        asBossHit(Math.max(1, Math.floor(shot.damage * cloneMultiplier)), "ОРИГИНАЛ НАЙДЕН — УДАР ПО АНТИ-СПИРАЛИ!");
                        asBossDamageFlash = Math.max(asBossDamageFlash, 24);
                        asFlash = Math.max(asFlash, 10); asFlashColor = "#6deaff"; asShake = Math.max(asShake, 13);
                        asText(200, 132, "ВСЕ ФАЛЬШИВКИ РАССЫПАЛИСЬ!", "#8ff8ff", 76);
                        for (let q = 0; q < 28; q++) {
                            const ang = Math.PI * 2 * q / 28, speed = 1.5 + Math.random() * 4;
                            asParticles.push({x:shot.x,y:shot.y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,life:24,maxLife:24,color:q%2?"#6deaff":"#bd82ff",size:2+Math.random()*3});
                        }
                        asSound(780, "triangle", .4, .13);
                    } else {
                        hitClone.alive = false;
                        asText(hitClone.x, hitClone.y + 48, "ФАЛЬШИВКА!", "#c4a5ff", 48);
                        for (let q = 0; q < 12; q++) {
                            const ang = Math.PI * 2 * q / 12, speed = 1 + Math.random() * 3;
                            asParticles.push({x:hitClone.x,y:hitClone.y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,life:18,maxLife:18,color:"#9e73ff",size:2+Math.random()*2});
                        }
                        const remainingClones = asClones.filter(function(clone) { return clone.alive; });
                        if (remainingClones.length === 1 && remainingClones[0].isOriginal) {
                            asCloneMode = false; asClones = []; asCloneUntil = 0;
                            asCloneNextShuffleAt = 0; asClonePhase = "idle"; asCloneStageUntil = 0;
                            asText(200, 124, "ОСТАЛСЯ ТОЛЬКО ОРИГИНАЛ — КЛОНЫ РАЗБИТЫ!", "#8ff8ff", 82);
                            asSound(640, "triangle", .24, .08);
                        } else {
                            asClonePhase = "shuffle";
                            asCloneNextShuffleAt = asGameClock + 420;
                        }
                        asSound(145, "sawtooth", .18, .06);
                    }
                    asDrillShots.splice(i, 1);
                    continue;
                }
            }
            let sealHit = false;
            for (let si = 0; si < asSeals.length; si++) {
                const seal = asSeals[si];
                if (!seal || seal.broken || Math.hypot(shot.x-seal.x,shot.y-seal.y) >= seal.radius + shot.radius) continue;
                asDrillImpact(shot.x, shot.y, shot.charge, "#a98bff");
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
                sealHit = true;
                asDrillShots.splice(i,1);
                break;
            }
            if (sealHit) continue;
            const dx=shot.x-asBoss.x, dy=shot.y-(asBoss.y+43);
            if(Math.abs(dx)<36+shot.radius && Math.abs(dy)<57+shot.radius){
                asDrillImpact(shot.x, shot.y, shot.charge, "#65efff");
                if(asUnbrokenSealIndex()>=0){
                    asBossHit(shot.damage,"ЩИТ ПЕЧАТЕЙ БЛОКИРУЕТ УРОН");
                }else{
                    let multiplier = asBossExposed>0 ? 2.45 : .42;
                    if(asPlayer.y<270) multiplier *= 1.25;
                    const damage = Math.max(1,Math.floor(shot.damage*multiplier));
                    asBossHit(damage,asBossExposed>0?"ЯДРО ПРОБИТО!":"БУР ПРОБИЛ ЗАЩИТУ");
                    if(asBossExposed>0)asShake=Math.max(asShake,9+shot.charge*8);
                }
                asDrillShots.splice(i,1);
                continue;
            }
            if(shot.travelled >= (shot.distanceMax || Infinity) || shot.life<=0 || shot.x<-50 || shot.x>450 || shot.y<-50 || shot.y>550)asDrillShots.splice(i,1);
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
        c.scale(asPlayer.size/12,asPlayer.size/12);
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
    function asDrawAntiSpiralHead(c,x,y,scale,now,opacity) {
        const bob=Math.sin(now/360)*1.7;
        c.save();c.translate(x,y+bob);c.scale(scale,scale);
        c.globalAlpha=opacity===undefined?1:opacity;
        // A floating, oversized head with the same spiral eyes as the cinematic character.
        c.shadowColor="#9d50ff";c.shadowBlur=24;
        c.strokeStyle="#c8a9ff";c.lineWidth=1.5;
        for(let ring=0;ring<3;ring++){
            c.save();c.rotate(now*.0003*(ring%2?-1:1)+ring*.45);
            c.globalAlpha=(opacity===undefined?1:opacity)*(.35+ring*.12);
            c.beginPath();c.ellipse(0,0,24+ring*7,29+ring*8,.16*ring,0,Math.PI*2);c.stroke();
            c.restore();
        }
        c.globalAlpha=opacity===undefined?1:opacity;
        c.fillStyle="#020105";c.strokeStyle="#f5f2ff";c.lineWidth=2.1;
        c.beginPath();c.moveTo(-18,15);c.quadraticCurveTo(-24,-13,-8,-25);
        c.quadraticCurveTo(2,-32,14,-21);c.quadraticCurveTo(24,-8,17,15);
        c.quadraticCurveTo(1,27,-18,15);c.closePath();c.fill();c.stroke();
        c.strokeStyle="#e9e5f2";c.lineWidth=.8;
        c.beginPath();c.moveTo(-13,-5);c.lineTo(-7,-7);c.moveTo(7,-7);c.lineTo(13,-5);c.stroke();
        asDrawSpiralEye(c,-8,0,5.8,now,false);asDrawSpiralEye(c,8,0,5.8,now,true);
        c.fillStyle="#f9f7ff";c.beginPath();c.moveTo(-3,12);c.lineTo(4,12);c.lineTo(0,18);c.closePath();c.fill();
        c.strokeStyle="#b995ef";c.globalAlpha=(opacity===undefined?1:opacity)*.75;c.lineWidth=.8;
        c.beginPath();c.moveTo(-15,5);c.lineTo(-11,12);c.moveTo(15,5);c.lineTo(11,12);c.stroke();
        c.restore();
        // Compact distortion rings keep the visual anchored to the head only.
        c.save();c.globalAlpha=.1+.045*Math.sin(now/170);c.strokeStyle="#a04dff";
        c.lineWidth=1.3;c.shadowColor="#a04dff";c.shadowBlur=12;
        for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y,25*scale+i*8*scale,31*scale+i*10*scale,now*.0002*(i%2?1:-1),0,Math.PI*2);c.stroke();}
        c.restore();
    }
    function asDrawBoss(c,now) {
        if (asCloneMode && asClones.some(function(clone) { return clone.alive; })) {
            asDrawCloneHunt(c, now);
            return;
        }
        if (asLabyrinthTimer > 0) {
            asDrawAntiSpiralHead(c, asBoss.x - 69, asBoss.y + 24, 0.58, now + 280, .22);
            asDrawAntiSpiralHead(c, asBoss.x + 69, asBoss.y + 24, 0.58, now - 360, .22);
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
        asDrawAntiSpiralHead(c, 0, -35, 1.05 * (asBoss.size / 48), now, 1);
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
        // Flowing rift filaments travel through the arena, adding motion even between attacks.
        c.save();c.globalAlpha=.2;c.lineWidth=1.15;
        for(let i=0;i<8;i++){
            const lane=i/7,phase=(now*.035+i*61)%(height+80)-40;
            const yy=top+phase,xx=left+width*lane;
            c.strokeStyle=i%2?"#66eaff":"#c07aff";
            c.shadowColor=c.strokeStyle;c.shadowBlur=8;
            c.beginPath();c.moveTo(xx-14,yy-12);c.quadraticCurveTo(xx+Math.sin(now/390+i)*18,yy,xx+12,yy+15);c.stroke();
        }
        c.restore();
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
        asGravityDirection=0;asResetGravityCadence(asGameClock);asGravityTransitionUntil=0;asBossApproachFrames=0;
        asBoss={x:200,y:100,size:48,rotation:0,pulse:0,flash:0};
        asArenaWidth=400;asArenaHeight=470;asTargetWidth=400;asTargetHeight=470;
        asInitPlatforms();asInitSeals();
        asPlayerScaleMode=1;asPlayerSizeNextAt=now+10000;
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true,platformIndex:-1};
        asDrillShots=[];asChargeFrames=0;asCharging=false;asLastDamageAt=asClockNow();asNextShotAt=0;asBossExposed=0;asLabyrinthTimer=0;asUltimateActive=false;asPatternSpawned=false;
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
            grounded: asPlayer.grounded, platformIndex: asPlayer.platformIndex,
            size: asPlayer.size, scaleMode: asPlayerScaleMode
        };
        asMiniLasersEnabled=asPhase>=2;
        asMiniLaserHits=0;asMiniLasers=[];
        asMiniNextLaserAt=asMiniLasersEnabled?now+1900:0;
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
        asPlayer = { x: 200, y: 260, vx: 0, vy: 0, size: asMiniReturnPlayer.size || 12, invuln: 0, grounded: false, platformIndex: null };
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
    function asFinishBrokenReality(success, now, laserFailure) {
        const saved = asMiniReturnPlayer || { x: 200, y: asFloor(), grounded: true, platformIndex: -1 };
        asState = "fight";
        asResetGravityCadence(now);
        asMiniCooldownUntil = now + (success ? 12000 : 15000);
        asPlayer = {
            x: Math.max(asBounds().left, Math.min(asBounds().right, saved.x)),
            y: saved.y,
            vx: 0,
            vy: saved.grounded ? 0 : Math.max(-2, Math.min(2, saved.vy || 0)),
            size: saved.size || 12,
            invuln: success ? 90 : 0,
            grounded: !!saved.grounded,
            platformIndex: saved.platformIndex
        };
        asMiniReturnPlayer = null;
        asMiniSpirals = [];
        asMiniLasers = [];asMiniLasersEnabled=false;asMiniLaserHits=0;asMiniNextLaserAt=0;
        asPlayerScaleMode=saved.scaleMode||1;
        asAttacks = [];
        asPatternTimer = 0;
        asPatternSpawned = false;
        asUltimateActive = false;
        asLastArenaShift = now;
        asLastDamageAt = asClockNow();
        if (success) {
            const bonusDamage = Math.max(1, Math.floor(asBossMaxHp * 0.10));
            if (asUnbrokenSealIndex() < 0) {
                asBossHp = Math.max(0, asBossHp - bonusDamage);
                asText(200, 110, "ОБРАТНЫЙ УДАР! -" + bonusDamage + " HP", "#86ffff", 100);
            } else {
                asText(200, 110, "ЩИТ ПЕЧАТЕЙ ОТБИЛ КОНТРУДАР!", "#cba9ff", 100);
            }
            asBossDamageFlash = 28;
            asReassemblyEffectUntil = now + 1200;
            asFlash = 22;
            asFlashColor = "#53eaff";
            asShake = 15;
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
            asText(200, 110, laserFailure ? "3 ПОПАДАНИЯ ЛАЗЕРОВ! -" + penalty + " HP" : "ПРОВАЛ! -" + penalty + " HP", "#ff668e", 100);
            if(laserFailure)asText(200,132,"КАРМАННОЕ ИЗМЕРЕНИЕ ОТБРОСИЛО ТЕБЯ","#ff8cb1",90);
            asDamagePlayer(penalty, "ПРОВАЛ СЛОМАННОЙ РЕАЛЬНОСТИ");
            asSound(170, "sine", 0.35, 0.1);
        }
        asUpdateControls();
    }
    function asUpdateBrokenReality(now) {
        const elapsed = now - asMiniIntroUntil;
        asShake = Math.max(asShake, 2.4 + Math.min(5.6, elapsed / 3500) + Math.abs(Math.sin(now * 0.017)) * 2.2);
        if (now < asMiniIntroUntil) return;
        // Phase 2+ fires periodic targeting lasers inside the pocket dimension.
        if(asMiniLasersEnabled && now>=asMiniNextLaserAt){
            const progress=Math.max(0,Math.min(1,elapsed/15000));
            const left=34+progress*34,right=366-progress*34,top=91+progress*39,bottom=466-progress*43;
            const vertical=Math.random()<.68;
            asMiniLasers.push({
                orientation:vertical?"vertical":"horizontal",
                x:Math.max(left+asPlayer.size+8,Math.min(right-asPlayer.size-8,asPlayer.x)),
                y:Math.max(top+asPlayer.size+8,Math.min(bottom-asPlayer.size-8,asPlayer.y)),
                warning:48,life:30,thickness:13,hit:false,
                color:asMiniLaserHits>=2?"#ff477f":(vertical?"#ff63d5":"#62eaff")
            });
            asMiniNextLaserAt=now+(asPhase>=3?1800:2250);
            asSound(vertical?210:145,"sawtooth",.18,.07);
        }
        const laserProgress=Math.max(0,Math.min(1,elapsed/15000));
        const laserBounds={left:34+laserProgress*34,right:366-laserProgress*34,top:91+laserProgress*39,bottom:466-laserProgress*43};
        for(let i=asMiniLasers.length-1;i>=0;i--){
            const laser=asMiniLasers[i];
            if(laser.warning>0){laser.warning--;continue;}
            if(laser.life>0){
                laser.life--;
                const half=(laser.thickness||13)/2+asPlayer.size;
                const hit=laser.orientation==="vertical"
                    ?Math.abs(asPlayer.x-laser.x)<half&&asPlayer.y+asPlayer.size>laserBounds.top&&asPlayer.y-asPlayer.size<laserBounds.bottom
                    :Math.abs(asPlayer.y-laser.y)<half&&asPlayer.x+asPlayer.size>laserBounds.left&&asPlayer.x-asPlayer.size<laserBounds.right;
                if(hit&&!laser.hit){
                    laser.hit=true;asMiniLaserHits++;
                    asShake=Math.max(asShake,7);asFlash=Math.max(asFlash,5);asFlashColor="#ff477f";
                    asSound(105,"sawtooth",.24,.1);
                    for(let p=0;p<20;p++){
                        const angle=Math.PI*2*p/20,speed=1.4+Math.random()*3.5;
                        asParticles.push({x:asPlayer.x,y:asPlayer.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:16,maxLife:16,color:p%3===0?"#ffffff":"#ff609b",size:1.8+Math.random()*3});
                    }
                    if(asMiniLaserHits>=3){
                        asFinishBrokenReality(false,now,true);
                        return;
                    }
                }
            }
            if(laser.life<=0)asMiniLasers.splice(i,1);
        }
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
        const miniSpeedMultiplier=asPlayerScaleMode===.5?1.5:(asPlayerScaleMode===2?.62:1);
        asPlayer.vx = Math.max(-4.6*miniSpeedMultiplier, Math.min(4.6*miniSpeedMultiplier, (asPlayer.vx + mx * 0.43*miniSpeedMultiplier + gx) * 0.965));
        asPlayer.vy = Math.max(-4.6*miniSpeedMultiplier, Math.min(4.6*miniSpeedMultiplier, (asPlayer.vy + my * 0.43*miniSpeedMultiplier + gy) * 0.965));
        asPlayer.x += asPlayer.vx;
        asPlayer.y += asPlayer.vy;
        const progress = Math.max(0, Math.min(1, elapsed / 15000));
        const bounds = {
            left: 34 + progress * 34,
            right: 366 - progress * 34,
            top: 91 + progress * 39,
            bottom: 466 - progress * 43
        };
        const miniMargin=asPlayer.size+1;
        if (asPlayer.x < bounds.left + miniMargin) { asPlayer.x = bounds.left + miniMargin; asPlayer.vx = Math.abs(asPlayer.vx) * 0.42; }
        if (asPlayer.x > bounds.right - miniMargin) { asPlayer.x = bounds.right - miniMargin; asPlayer.vx = -Math.abs(asPlayer.vx) * 0.42; }
        if (asPlayer.y < bounds.top + miniMargin) { asPlayer.y = bounds.top + miniMargin; asPlayer.vy = Math.abs(asPlayer.vy) * 0.42; }
        if (asPlayer.y > bounds.bottom - miniMargin) { asPlayer.y = bounds.bottom - miniMargin; asPlayer.vy = -Math.abs(asPlayer.vy) * 0.42; }
        for (let i = 0; i < asMiniSpirals.length; i++) {
            const spiral = asMiniSpirals[i];
            if (spiral.collected) continue;
            spiral.phase += 0.045;
            if (Math.hypot(asPlayer.x - spiral.x, asPlayer.y - spiral.y) < 11 + asPlayer.size) {
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
        // Pocket lasers: clear warning lines first, then thick active beams with moving highlights.
        for(let i=0;i<asMiniLasers.length;i++){
            const laser=asMiniLasers[i],vertical=laser.orientation==="vertical";
            const start=vertical?top:left,end=vertical?bottom:right,coord=vertical?laser.x:laser.y;
            c.save();c.lineCap="round";c.strokeStyle=laser.color;c.shadowColor=laser.color;
            if(laser.warning>0){
                c.globalAlpha=.45+Math.abs(Math.sin(now*.025))*.38;c.shadowBlur=16;c.lineWidth=2.2;c.setLineDash([8,6]);
                c.beginPath();if(vertical){c.moveTo(coord,start);c.lineTo(coord,end);}else{c.moveTo(start,coord);c.lineTo(end,coord);}c.stroke();c.setLineDash([]);
                c.globalAlpha=.85;c.lineWidth=1.2;
                const tx=vertical?laser.x:asPlayer.x,ty=vertical?asPlayer.y:laser.y;
                c.beginPath();c.arc(tx,ty,14+Math.sin(now*.03)*3,0,Math.PI*2);c.stroke();
                c.beginPath();c.moveTo(tx-20,ty);c.lineTo(tx-8,ty);c.moveTo(tx+8,ty);c.lineTo(tx+20,ty);c.moveTo(tx,ty-20);c.lineTo(tx,ty-8);c.moveTo(tx,ty+8);c.lineTo(tx,ty+20);c.stroke();
            }else{
                c.globalAlpha=.27;c.shadowBlur=28;c.lineWidth=23;c.beginPath();if(vertical){c.moveTo(coord,start);c.lineTo(coord,end);}else{c.moveTo(start,coord);c.lineTo(end,coord);}c.stroke();
                c.globalAlpha=.92;c.shadowBlur=17;c.lineWidth=9;c.beginPath();if(vertical){c.moveTo(coord,start);c.lineTo(coord,end);}else{c.moveTo(start,coord);c.lineTo(end,coord);}c.stroke();
                c.globalAlpha=1;c.strokeStyle="#ffffff";c.lineWidth=1.8;c.beginPath();if(vertical){c.moveTo(coord,start);c.lineTo(coord,end);}else{c.moveTo(start,coord);c.lineTo(end,coord);}c.stroke();
                c.globalAlpha=.95;c.lineWidth=4;c.strokeStyle="#ffffff";
                const fraction=((now*.28)%100)/100;
                c.beginPath();if(vertical){const y=start+(end-start)*fraction;c.moveTo(coord-10,y);c.lineTo(coord+10,y);}else{const x=start+(end-start)*fraction;c.moveTo(x,coord-10);c.lineTo(x,coord+10);}c.stroke();
            }
            c.restore();
        }
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
        c.scale(asPlayer.size/12,asPlayer.size/12);
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
        const miniVisualScale=asPlayer.size/12;
        c.ellipse(asPlayer.x, asPlayer.y, (22 + Math.sin(now * 0.009) * 4)*miniVisualScale, (17 + Math.sin(now * 0.008) * 3)*miniVisualScale, now * 0.001, 0, Math.PI * 2);
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
            if(asMiniLasersEnabled){c.fillStyle=asMiniLaserHits>=2?"#ff477f":"#ffb1ea";c.textAlign="right";c.font="bold 10px monospace";c.fillText("ЛАЗЕРЫ "+asMiniLaserHits+"/3",right-8,top-15);}
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
        const reduceBossEffects = !!(window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects());
        const mediumGraphics = !!(window.MBIsMediumGraphics && window.MBIsMediumGraphics());
        if (reduceBossEffects) {
            asFlash = 0; asShake = 0; asBossDamageFlash = 0;
            // Only cap decorative particles. Keep attack/hazard arrays intact so difficulty and hit detection do not change.
            if (asParticles.length > 18) asParticles.splice(0, asParticles.length - 18);
        } else if (mediumGraphics && asParticles.length > 75) {
            asParticles.splice(0, asParticles.length - 75);
        }

        const rafNow = Number(now) || performance.now();
        if (!asClockReady || asLastRafTimestamp === null) {
            asClockReady = true; asGameClock = rafNow; asLastRafTimestamp = rafNow;
        }
        const elapsed = Math.max(0, rafNow - asLastRafTimestamp);
        asLastRafTimestamp = rafNow;
        asTimeScale = rafNow < asSlowUntilReal ? .5 : 1;
        if (asAimMode && asTimeScale === 1) {
            asAimMode = false;
            asUpdateControls();
        }
        if (asPreviousTimeScale < 1 && asTimeScale === 1) asFrame = Math.round(asFrame);
        asPreviousTimeScale = asTimeScale;
        asGameClock += elapsed * asTimeScale;
        now = asGameClock;
        const c=asCtx(); if(!c){asAnimFrame=requestAnimationFrame(asRender);return;}
        asFrame += asTimeScale;
        if (asState === "fight") { asShiftArena(now); asUpdateArenaWarp(now); }
        asArenaWidth += (asTargetWidth-asArenaWidth)*.055*asTimeScale;
        asArenaHeight += (asTargetHeight-asArenaHeight)*.055*asTimeScale;
        if (asState === "fight") asUpdateCloneHunt(now);
        asBoss.rotation+=.009*asTimeScale; asBoss.pulse+=.04*asTimeScale;
        if(asBoss.flash>0)asBoss.flash-=asTimeScale;
        if(asBossDamageFlash>0)asBossDamageFlash-=asTimeScale;
        if(!reduceBossEffects && asShake>0.2)asShake*=Math.pow(.86,asTimeScale);else asShake=0;
        if(!reduceBossEffects && asFlash>0)asFlash-=asTimeScale;
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
                if(a.kind==="fateTrace"){
                    const path=a.path||[];
                    if(a.phase==="record"){
                        path.push({x:asPlayer.x,y:asPlayer.y});
                        a.timer-=asTimeScale;
                        c.save();
                        if(path.length>1){
                            c.globalAlpha=.34;c.strokeStyle="#a76dff";c.lineWidth=2;
                            c.shadowColor="#8b5dff";c.shadowBlur=9;c.beginPath();
                            c.moveTo(path[0].x,path[0].y);
                            for(let p=1;p<path.length;p++)c.lineTo(path[p].x,path[p].y);
                            c.stroke();
                            c.globalAlpha=.76;c.fillStyle="#66eaff";c.shadowColor="#57dfff";c.shadowBlur=12;
                            const tail=path[path.length-1];c.beginPath();c.arc(tail.x,tail.y,3.5,0,Math.PI*2);c.fill();
                        }
                        c.restore();
                        c.save();c.fillStyle="rgba(3,5,18,.88)";c.fillRect(56,98,288,22);
                        c.strokeStyle="#7eeaff";c.lineWidth=1;c.strokeRect(56,98,288,22);
                        c.fillStyle="#aaf6ff";c.font="bold 10px monospace";c.textAlign="center";
                        c.fillText("ЗАПИСЬ СУДЬБЫ · "+Math.max(0,(a.timer/60)).toFixed(1)+"с",200,112);c.restore();
                        if(a.timer<=0&&path.length>2){
                            a.phase="rewind";a.rewindDuration=108;a.timer=a.rewindDuration;
                            a.hotUntil=Object.create(null);a.lastHitAt=0;a.lastHotIndex=-1;
                            asText(200,132,"ОТМЕНА РЕАЛЬНОСТИ!","#da9bff",64);
                            asSound(180,"sawtooth",.3,.1);asShake=Math.max(asShake,5);
                        }
                    }else if(a.phase==="rewind"){
                        a.timer-=asTimeScale;
                        const progress=Math.max(0,Math.min(1,1-a.timer/a.rewindDuration));
                        const index=Math.max(0,Math.min(path.length-1,Math.floor(progress*(path.length-1))));
                        const segment=Math.max(0,Math.min(path.length-2,index));
                        if(path.length>1){
                            a.hotUntil[segment]=asFrame+38;
                            if(segment<path.length-2)a.hotUntil[segment+1]=asFrame+30;
                        }
                        c.save();
                        c.globalAlpha=.20;c.strokeStyle="#a46bff";c.lineWidth=2;c.beginPath();
                        c.moveTo(path[0].x,path[0].y);for(let p=1;p<path.length;p++)c.lineTo(path[p].x,path[p].y);c.stroke();
                        c.lineCap="round";c.lineJoin="round";c.shadowColor="#ba62ff";c.shadowBlur=17;
                        for(let seg=0;seg<path.length-1;seg++){
                            if((a.hotUntil[seg]||0)<=asFrame)continue;
                            const p1=path[seg],p2=path[seg+1];
                            c.globalAlpha=.32;c.strokeStyle="#d34cff";c.lineWidth=13;
                            c.beginPath();c.moveTo(p1.x,p1.y);c.lineTo(p2.x,p2.y);c.stroke();
                            c.globalAlpha=.95;c.strokeStyle="#f5b7ff";c.lineWidth=2.4;
                            c.beginPath();c.moveTo(p1.x,p1.y);c.lineTo(p2.x,p2.y);c.stroke();
                            const dx=p2.x-p1.x,dy=p2.y-p1.y,len2=dx*dx+dy*dy;
                            const t=len2>0?Math.max(0,Math.min(1,((asPlayer.x-p1.x)*dx+(asPlayer.y-p1.y)*dy)/len2)):0;
                            const dist=Math.hypot(asPlayer.x-(p1.x+t*dx),asPlayer.y-(p1.y+t*dy));
                            if(dist<asPlayer.size+7&&asFrame>=(a.lastHitAt||0)){
                                asDamagePlayer(a.damage||12,"СЛЕД ОТМЕНЁННОЙ СУДЬБЫ");
                                a.lastHitAt=asFrame+35;
                            }
                        }
                        const ghost=path[index]||path[0];
                        c.globalAlpha=.95;c.shadowColor="#63edff";c.shadowBlur=25;c.fillStyle="#73f3ff";
                        c.beginPath();c.moveTo(ghost.x,ghost.y+8);
                        c.bezierCurveTo(ghost.x-15,ghost.y-1,ghost.x-12,ghost.y-13,ghost.x-5,ghost.y-13);
                        c.bezierCurveTo(ghost.x-1,ghost.y-13,ghost.x,ghost.y-9,ghost.x,ghost.y-7);
                        c.bezierCurveTo(ghost.x+5,ghost.y-17,ghost.x+15,ghost.y-10,ghost.x+12,ghost.y-3);
                        c.bezierCurveTo(ghost.x+10,ghost.y+2,ghost.x+4,ghost.y+6,ghost.x,ghost.y+8);c.fill();
                        c.strokeStyle="#ffffff";c.lineWidth=1.5;c.stroke();c.restore();
                        c.save();c.fillStyle="rgba(3,5,18,.88)";c.fillRect(54,98,292,22);
                        c.strokeStyle="#d68aff";c.strokeRect(54,98,292,22);
                        c.fillStyle="#f0d5ff";c.font="bold 10px monospace";c.textAlign="center";
                        c.fillText("ПОВТОР ТВОЕГО ПУТИ · УЙДИ СО СЛЕДА",200,112);c.restore();
                        if(a.timer<=0){
                            a.phase="node";a.timer=180;
                            a.node={x:path[path.length-1].x,y:path[path.length-1].y};
                            a.safePoint=path[Math.max(0,Math.min(path.length-1,Math.floor(path.length*.46)))]||path[0];
                            a.hotUntil=Object.create(null);
                            asText(200,132,"УЗЕЛ ПАРАДОКСА — ДОБЕРИСЬ ДО НЕГО!","#7ff6ff",100);
                            asSound(720,"sine",.25,.09);asFlash=Math.max(asFlash,5);asFlashColor="#62eaff";
                        }
                    }else if(a.phase==="node"){
                        a.timer-=asTimeScale;
                        c.save();
                        c.globalAlpha=.18;c.strokeStyle="#ad6cff";c.lineWidth=2;c.setLineDash([4,7]);c.beginPath();
                        c.moveTo(path[0].x,path[0].y);for(let p=1;p<path.length;p++)c.lineTo(path[p].x,path[p].y);c.stroke();c.setLineDash([]);
                        const node=a.node||path[0],pulse=1+Math.sin(asFrame*.24)*.18;
                        c.globalAlpha=.9;c.shadowColor="#5fefff";c.shadowBlur=30;c.strokeStyle="#d7fcff";c.lineWidth=2.2;
                        c.beginPath();c.arc(node.x,node.y,12*pulse,0,Math.PI*2);c.stroke();
                        c.globalAlpha=.34;c.fillStyle="#4be7ff";c.beginPath();c.arc(node.x,node.y,10*pulse,0,Math.PI*2);c.fill();
                        c.globalAlpha=1;c.strokeStyle="#ffffff";c.lineWidth=2;
                        c.beginPath();c.moveTo(node.x-18,node.y);c.lineTo(node.x-5,node.y);c.moveTo(node.x+5,node.y);c.lineTo(node.x+18,node.y);
                        c.moveTo(node.x,node.y-18);c.lineTo(node.x,node.y-5);c.moveTo(node.x,node.y+5);c.lineTo(node.x,node.y+18);c.stroke();c.restore();
                        c.save();c.fillStyle="rgba(3,5,18,.9)";c.fillRect(48,98,304,22);
                        c.strokeStyle="#67edff";c.strokeRect(48,98,304,22);
                        c.fillStyle="#c5fbff";c.font="bold 10px monospace";c.textAlign="center";
                        c.fillText("УЗЕЛ ПАРАДОКСА · "+Math.max(0,Math.ceil(a.timer/60))+"с",200,112);c.restore();
                        if(Math.hypot(asPlayer.x-node.x,asPlayer.y-node.y)<asPlayer.size+15){
                            const safe=a.safePoint||path[Math.floor(path.length*.46)]||{x:200,y:asFloor()};
                            const limits=asBounds();
                            asPlayer.x=Math.max(limits.left,Math.min(limits.right,safe.x));
                            asPlayer.y=Math.max(limits.top,Math.min(limits.bottom,safe.y));
                            asPlayer.vx=0;asPlayer.vy=0;asPlayer.grounded=false;asPlayer.platformIndex=null;
                            asPlayer.invuln=Math.max(asPlayer.invuln||0,90);
                            asText(200,109,"ПАРАДОКСАЛЬНЫЙ КОНТРУДАР!","#86ffff",88);
                            asText(200,130,"ТЕЛЕПОРТ · НЕУЯЗВИМОСТЬ 1,5 СЕКУНДЫ","#b8faff",86);
                            const counterDamage=Math.max(1,Math.floor(asBossMaxHp*.05));
                            asBossHit(counterDamage,"ПАРАДОКСАЛЬНЫЙ КОНТРУДАР");
                            asReassemblyEffectUntil=now+900;asBossDamageFlash=Math.max(asBossDamageFlash,24);
                            asFlash=Math.max(asFlash,13);asFlashColor="#53eaff";asShake=Math.max(asShake,12);
                            for(let q=0;q<30;q++){
                                const ang=Math.PI*2*q/30,sp=1.5+Math.random()*4;
                                asParticles.push({x:safe.x,y:safe.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:30,maxLife:30,color:q%2?"#64edff":"#c17aff",size:2+Math.random()*3});
                            }
                            asSound(760,"triangle",.48,.14);
                            asAttacks.splice(i,1);
                            continue;
                        }
                        if(a.timer<=0){
                            asText(200,120,"УЗЕЛ ИСЧЕЗ — ПАРАДОКС УПУЩЕН","#ad8bff",52);
                            asAttacks.splice(i,1);
                        }
                    }
                    continue;
                }
                if(a.kind==="bigbang"){
                    if(a.phase==="charge"){
                        a.timer-=asTimeScale;
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
                        a.life-=asTimeScale;
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
                        a.warning-=asTimeScale;
                        c.save();c.globalAlpha=.35+Math.abs(Math.sin(asFrame*.3))*.38;c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=15;c.lineWidth=2;
                        c.setLineDash([9,6]);c.beginPath();c.moveTo(b.left,a.y);c.lineTo(b.right,a.y);c.stroke();c.setLineDash([]);
                        c.fillStyle="#ffffff";c.font="bold 10px monospace";c.textAlign="center";c.fillText("УДАР РУКОЙ — ПРЫГАЙ!",200,a.y-7);c.restore();
                    }else{
                        a.life-=asTimeScale;
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
                        a.timer-=asTimeScale;
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
                    a.warning-=asTimeScale;
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
                        a.timer=Math.max(0,a.timer-asTimeScale);
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
                        a.life-=asTimeScale;if(a.life<=0)asAttacks.splice(i,1);
                    }
                    continue;
                }
                if(a.kind==="well"){
                    if(!a.burst){
                        if((a.warning||0)>0){
                            a.warning-=asTimeScale;
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
                        a.timer=Math.max(0,a.timer-asTimeScale);
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
                        c.restore();a.life-=asTimeScale;if(a.life<=0)asAttacks.splice(i,1);
                    }
                    continue;
                }
                if(a.kind==="zoneLaser"){
                    const bounds=asBounds();
                    const height=Math.min(a.height||96,bounds.bottom-bounds.top-12);
                    const travel=a.sweepDistance||96;
                    const startTop=a.zone==="upper"?bounds.top+5:bounds.bottom-height-5;
                    if(a.warning>0){
                        a.warning-=asTimeScale;
                        const warnPulse=.32+Math.abs(Math.sin(asFrame*.28))*.32;
                        c.save();
                        c.fillStyle=a.color;c.globalAlpha=.075+warnPulse*.08;c.fillRect(bounds.left,startTop,bounds.right-bounds.left,height);
                        c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=18;c.lineWidth=2;c.setLineDash([10,6]);
                        c.globalAlpha=.6+warnPulse*.35;c.strokeRect(bounds.left,startTop,bounds.right-bounds.left,height);c.setLineDash([]);
                        // Preview the zone's destination so the safe platforms are readable early.
                        const endTop=a.zone==="upper"?Math.min(bounds.bottom-height,startTop+travel):Math.max(bounds.top,startTop-travel);
                        c.globalAlpha=.24;c.strokeStyle="#ffffff";c.lineWidth=1.2;c.strokeRect(bounds.left,endTop,bounds.right-bounds.left,height);
                        c.fillStyle="#ffffff";c.font="bold 10px monospace";c.textAlign="center";
                        c.globalAlpha=.95;
                        c.fillText(a.zone==="lower"?"НИЖНИЙ СЕКТОР: ПРЫГАЙ НА ПЛАТФОРМЫ":"ВЕРХНИЙ СЕКТОР ЗАКРЫВАЕТСЯ",200,Math.max(bounds.top+15,Math.min(bounds.bottom-6,startTop+height*.5)));
                        c.restore();
                        if(a.warning<=0&&!a.activated){
                            a.activated=true;asShake=Math.max(asShake,10);asFlash=Math.max(asFlash,5);asFlashColor=a.color;
                            asSound(a.zone==="lower"?72:96,"sawtooth",.32,.12);
                            // The full-width wall ignites from both edges with a shower of sparks.
                            for(let spark=0;spark<28;spark++){
                                const x=bounds.left+(bounds.right-bounds.left)*spark/27;
                                [startTop,startTop+height].forEach(function(y,edge){
                                    asParticles.push({x:x,y:y,vx:(Math.random()-.5)*2.8,vy:(edge===0?-1:1)*(1+Math.random()*3),life:15,maxLife:15,color:spark%3===0?"#ffffff":a.color,size:1.5+Math.random()*3});
                                });
                            }
                        }
                    }else{
                        a.life-=asTimeScale;
                        const progress=Math.max(0,Math.min(1,1-a.life/(a.maxLife||42)));
                        const zoneTop=a.zone==="upper"
                            ?Math.min(bounds.bottom-height-2,startTop+travel*progress)
                            :Math.max(bounds.top+2,startTop-travel*progress);
                        c.save();
                        const grad=c.createLinearGradient(0,zoneTop,0,zoneTop+height);
                        grad.addColorStop(0,"rgba(0,0,0,0)");grad.addColorStop(.18,a.color+"55");grad.addColorStop(.5,a.color+"99");grad.addColorStop(.82,a.color+"55");grad.addColorStop(1,"rgba(0,0,0,0)");
                        c.fillStyle=grad;c.shadowColor=a.color;c.shadowBlur=28;c.fillRect(bounds.left,zoneTop,bounds.right-bounds.left,height);
                        c.globalAlpha=.48;c.fillStyle=a.color;c.fillRect(bounds.left,zoneTop+height*.12,bounds.right-bounds.left,height*.76);
                        // Multiple moving filaments make it read as an enormous energized wall, not a thin line.
                        c.globalAlpha=.8;c.lineWidth=2;c.strokeStyle="#ffffff";c.shadowColor=a.color;c.shadowBlur=18;
                        for(let stripe=0;stripe<7;stripe++){
                            const sy=zoneTop+((asFrame*4+stripe*29)%(Math.max(1,height)));
                            c.globalAlpha=.3+(stripe%3)*.18;c.beginPath();c.moveTo(bounds.left,sy);c.lineTo(bounds.right,sy+Math.sin(asFrame*.12+stripe)*2);c.stroke();
                        }
                        c.globalAlpha=.95;c.strokeStyle=a.color;c.lineWidth=3;
                        c.beginPath();c.moveTo(bounds.left,zoneTop);c.lineTo(bounds.right,zoneTop);c.moveTo(bounds.left,zoneTop+height);c.lineTo(bounds.right,zoneTop+height);c.stroke();
                        c.globalAlpha=.9;c.strokeStyle="#ffffff";c.lineWidth=1.4;
                        c.beginPath();c.moveTo(bounds.left,zoneTop+2);c.lineTo(bounds.right,zoneTop+2);c.moveTo(bounds.left,zoneTop+height-2);c.lineTo(bounds.right,zoneTop+height-2);c.stroke();
                        if(asFrame%4===0){
                            for(let p=0;p<5;p++){
                                const x=bounds.left+Math.random()*(bounds.right-bounds.left);
                                asParticles.push({x:x,y:zoneTop+(p%2?height:0),vx:(Math.random()-.5)*2.2,vy:(Math.random()-.5)*2.2,life:10,maxLife:10,color:p%2?"#ffffff":a.color,size:1.5+Math.random()*2.5});
                            }
                        }
                        c.restore();
                        const overlaps=asPlayer.y+asPlayer.size>zoneTop&&asPlayer.y-asPlayer.size<zoneTop+height;
                        if(overlaps&&!a.hit){asDamagePlayer(a.damage,a.zone==="lower"?"ВОСХОДЯЩИЙ СУПЕРЛАЗЕР":"ПАДАЮЩАЯ СТЕНА СВЕТА");a.hit=true;}
                        if(a.life<=0)asAttacks.splice(i,1);
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
                        a.warning-=asTimeScale;
                        c.save();c.globalAlpha=(barrier ? .45 : .35)+Math.abs(Math.sin(asFrame*.25))*.25;c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=barrier?22:11;c.lineWidth=barrier?4:2;
                        c.setLineDash([7,6]);c.beginPath();
                        if(vertical){c.moveTo(lineCoord,lineStart);c.lineTo(lineCoord,lineEnd);}
                        else{c.moveTo(lineStart,lineCoord);c.lineTo(lineEnd,lineCoord);}
                        c.stroke();c.setLineDash([]);
                        c.globalAlpha=.85;c.fillStyle="#ffffff";c.font="bold 10px monospace";c.textAlign="center";
                        c.fillText(barrier?"БАРЬЕР — НЕ ПРИБЛИЖАЙСЯ":"!",vertical?lineCoord:(bounds.left+bounds.right)/2,vertical?lineStart+10:lineCoord-7);c.restore();
                    }else{
                        a.life-=asTimeScale;
                        c.save();c.strokeStyle=a.color;c.shadowColor=a.color;c.shadowBlur=barrier?34:20;c.lineCap="round";
                        c.globalAlpha=barrier ? .3 : .27;c.lineWidth=beamWidth;c.beginPath();if(vertical){c.moveTo(lineCoord,lineStart);c.lineTo(lineCoord,lineEnd);}else{c.moveTo(lineStart,lineCoord);c.lineTo(lineEnd,lineCoord);}c.stroke();
                        c.globalAlpha=.95;c.lineWidth=barrier?Math.max(8,beamWidth*.3):8;c.beginPath();if(vertical){c.moveTo(lineCoord,lineStart);c.lineTo(lineCoord,lineEnd);}else{c.moveTo(lineStart,lineCoord);c.lineTo(lineEnd,lineCoord);}c.stroke();
                        c.globalAlpha=1;c.strokeStyle="#ffffff";c.shadowBlur=barrier?16:10;c.lineWidth=barrier?2.8:1.8;c.beginPath();if(vertical){c.moveTo(lineCoord,lineStart);c.lineTo(lineCoord,lineEnd);}else{c.moveTo(lineStart,lineCoord);c.lineTo(lineEnd,lineCoord);}c.stroke();
                        // Traveling hot-spots race along each active laser for a more energetic look.
                        c.strokeStyle="#ffffff";c.shadowColor=a.color;c.shadowBlur=24;c.lineWidth=barrier?5:3;
                        for(let pulse=0;pulse<3;pulse++){
                            const fraction=((asFrame*3.5+pulse*53)%100)/100;
                            c.globalAlpha=.25+.6*Math.abs(Math.sin(asFrame*.17+pulse));
                            c.beginPath();
                            if(vertical){const py=lineStart+(lineEnd-lineStart)*fraction;c.moveTo(lineCoord-12,py);c.lineTo(lineCoord+12,py);}
                            else{const px=lineStart+(lineEnd-lineStart)*fraction;c.moveTo(px,lineCoord-12);c.lineTo(px,lineCoord+12);}
                            c.stroke();
                        }
                        c.restore();
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
                    a.vx+=(targetX-a.vx)*turn*asTimeScale;a.vy+=(targetY-a.vy)*turn*asTimeScale;
                }else{
                    if(typeof a.spd==="number")a.vx=a.spd;
                    if(typeof a.spdY==="number")a.vy=a.spdY;
                }
                a.x+=a.vx*asTimeScale;a.y+=a.vy*asTimeScale;a.life-=asTimeScale;a.phase+=.1*asTimeScale;
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
                if(a.kind==="orb"||a.homing){
                    c.globalAlpha=.74;c.strokeStyle="#ffffff";c.lineWidth=1.1;c.shadowColor=a.color;c.shadowBlur=18;
                    c.beginPath();c.arc(0,0,a.size*1.42+Math.sin(a.phase*1.7)*1.4,a.phase*.7,a.phase*.7+Math.PI*1.55);c.stroke();
                }
                c.restore();
                const dx=asPlayer.x-a.x,dy=asPlayer.y-a.y;
                if(Math.hypot(dx,dy)<a.size+asPlayer.size*.75){asDamagePlayer(a.damage,"СИНГУЛЯРНОСТЬ");asAttacks.splice(i,1);continue;}
                if(a.life<=0||a.x<-80||a.x>480||a.y<-80||a.y>580)asAttacks.splice(i,1);
            }
            for(let i=asParticles.length-1;i>=0;i--){
                const p=asParticles[i];p.x+=p.vx*asTimeScale;p.y+=p.vy*asTimeScale;p.vx*=Math.pow(.97,asTimeScale);p.vy*=Math.pow(.97,asTimeScale);p.life-=asTimeScale;
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
        for(let i=asTexts.length-1;i>=0;i--){const t=asTexts[i];t.y+=t.vy*asTimeScale;t.life-=asTimeScale;c.globalAlpha=Math.max(0,t.life/t.maxLife);c.fillStyle=t.color;c.shadowColor=t.color;c.shadowBlur=8;c.textAlign="center";c.font="bold 12px monospace";c.fillText(t.text,t.x,t.y);if(t.life<=0)asTexts.splice(i,1);}
        c.globalAlpha=1;c.restore();
        if(!reduceBossEffects && asFlash>0){c.save();c.globalAlpha=asFlash/35;c.fillStyle=asFlashColor;c.fillRect(0,0,400,500);c.restore();}
        if(asState==="fight"){
            if(typeof tickSupers==="function") {try{tickSupers();}catch(e){}}
            if(typeof renderSuperVisuals==="function") {try{c.save();renderSuperVisuals();c.restore();}catch(e){}}
            if(typeof window.drawJoystick==="function"){try{window.drawJoystick();}catch(e){}}
        }
        if (asAimMode) {
            c.save(); c.setTransform(1,0,0,1,0,0);
            const ax = Math.max(0, Math.min(400, asAimCursor.x));
            const ay = Math.max(45, Math.min(500, asAimCursor.y));
            c.globalAlpha = .9; c.strokeStyle = "#76f4ff"; c.lineWidth = 1.6;
            c.shadowColor = "#53edff"; c.shadowBlur = 14;
            c.setLineDash([5,5]); c.beginPath(); c.moveTo(asPlayer.x, asPlayer.y-5); c.lineTo(ax,ay); c.stroke(); c.setLineDash([]);
            c.beginPath(); c.arc(ax,ay,10+Math.sin(asFrame*.22)*1.5,0,Math.PI*2); c.stroke();
            c.beginPath(); c.moveTo(ax-17,ay); c.lineTo(ax-5,ay); c.moveTo(ax+5,ay); c.lineTo(ax+17,ay);
            c.moveTo(ax,ay-17); c.lineTo(ax,ay-5); c.moveTo(ax,ay+5); c.lineTo(ax,ay+17); c.stroke();
            c.fillStyle = "rgba(1,8,20,.9)"; c.fillRect(92,78,216,19);
            c.strokeStyle = "#76f4ff"; c.strokeRect(92,78,216,19);
            c.fillStyle = "#c4fbff"; c.font = "bold 10px monospace"; c.textAlign = "center";
            c.fillText("ВРЕМЯ ×0,5 · КАСАНИЕ ДЛЯ ВЫСТРЕЛА",200,91);
            c.restore();
        }
        // Physics / input are stepped here, after rendering so the click hitbox stays aligned.
        if(asState==="fight"){
            asUpdatePlayerSize(now);
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
                    const jumpMultiplier=asPlayerScaleMode===.5?.65:(asPlayerScaleMode===2?1.3:1);
                asPlayer.vx=-gravity.x*(23.2/1.5)*jumpMultiplier;asPlayer.vy=-gravity.y*(23.2/1.5)*jumpMultiplier;
                asPlayer.grounded=false;asPlayer.platformIndex=null;
                asText(asPlayer.x,asPlayer.y-20,"ПРЫЖОК!","#68dcff",28);
            }
            // Гравитация действует по реальному вектору, а не поворотом всей сцены.
            // Steering only affects the surface tangent; up/down cannot provide endless thrust against gravity.
            const tangentX=-gravity.y,tangentY=gravity.x;
            const sizeSpeedMultiplier=asPlayerScaleMode===.5?1.5:(asPlayerScaleMode===2?.62:1);
            const tangentInput=mx*tangentX+my*tangentY;
            const nextVx=(asPlayer.vx+(tangentX*tangentInput*.43*sizeSpeedMultiplier+gravity.x*.32+pullX)*asTimeScale)*Math.pow(.91,asTimeScale);
            const nextVy=(asPlayer.vy+(tangentY*tangentInput*.43*sizeSpeedMultiplier+gravity.y*.32+pullY)*asTimeScale)*Math.pow(.91,asTimeScale);
            const tangentLimit=6.2*sizeSpeedMultiplier, normalLimit=24.8*(asPlayerScaleMode===.5?.72:(asPlayerScaleMode===2?1.3:1));
            asPlayer.vx=Math.max(gravity.x?-normalLimit:-tangentLimit,Math.min(gravity.x?normalLimit:tangentLimit,nextVx));
            asPlayer.vy=Math.max(gravity.y?-normalLimit:-tangentLimit,Math.min(gravity.y?normalLimit:tangentLimit,nextVy));
            const px=asPlayer.x,py=asPlayer.y,r=asPlayer.size;
            asPlayer.x+=asPlayer.vx*asTimeScale;asPlayer.y+=asPlayer.vy*asTimeScale;
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
            asUpdateGravityCadence(now, ratio);
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
            const chargeNow=asClockNow(),canCharge=chargeNow>=asNextShotAt&&chargeNow-asLastDamageAt>=3000;
            if(canCharge&&asChargeFrames<150)asChargeFrames=Math.min(150,asChargeFrames+asTimeScale);
            asCharging=canCharge&&asChargeFrames<150;asUpdateControls();
            if(asBossExposed>0)asBossExposed-=asTimeScale;if(asLabyrinthTimer>0)asLabyrinthTimer-=asTimeScale;
            // A pattern may stop spawning after its showcase window, but its attacks are never
            // cleared just because a timer elapsed. Wait for beams, marks, wells and projectiles to finish.
            if(!asPatternDraining){
                asPatternTimer+=asTimeScale;
                const duration=asPattern===7?250:(asPattern===9?450:(asPattern===10?165:178));
                if(asPatternTimer>duration)asPatternDraining=true;
            }
            if(asPatternDraining){
                const attacksStillRunning=asAttacks.some(function(a){return !!a;});
                if(!attacksStillRunning&&asLabyrinthTimer<=0&&!asUltimateActive&&!asCloneMode){
                    asPatternDraining=false;asPatternTimer=0;asPattern=(asPattern+1)%patterns.length;asPatternSpawned=false;asPatternVolleyCount=0;
                    asText(200,100,patterns[asPattern],"#b8a2ff",52);
                    asSound(260+asPattern*60,"sine",.18,.06);
                }
            }else{
                const cadence=[42,70,58,78,92,82,76,178,64,60,60][asPattern]||58;
                const volleyLimit=[3,1,2,1,1,1,1,1,1,1,1][asPattern]||1;
                if(asPattern===7||asPattern===9||asPattern===10){
                    if(!asPatternSpawned&&asPatternVolleyCount<volleyLimit){asSpawnPattern(now);asPatternSpawned=true;asPatternVolleyCount++;}
                }else if(asFrame%Math.max(27,cadence-asPhase*3)===0&&asPatternVolleyCount<volleyLimit){
                    asSpawnPattern(now);asPatternVolleyCount++;
                }
            }
            if(asPlayer.invuln>0)asPlayer.invuln-=asTimeScale;
            const near=Math.hypot(asPlayer.x-asBoss.x,asPlayer.y-(asBoss.y+43))<52;
            const j=window._joystick;
            const deliberate=!!(left||right||up||down||asKeys[" "]||(j&&j.enabled&&j.active&&(Math.abs(Number(j.vectorX)||0)>.12||Math.abs(Number(j.vectorY)||0)>.12))||(asPointer.down&&!asPointerChargeMode));
            if(near&&deliberate&&now>=asMiniCooldownUntil&&now>=asGravityTransitionUntil)asBossApproachFrames+=asTimeScale;else asBossApproachFrames=0;
            if(asBossApproachFrames>=8&&!asWinPending&&!asDefeatPending)asStartBrokenReality(now);
        }
        asAnimFrame=requestAnimationFrame(asRender);
    }
    function startAntiSpiralBossFight() {
        if(asActive) return;
        if(Number(typeof wave!=="undefined"?wave:0)!==1500) return;
        asGameClock = performance.now();
        asLastRafTimestamp = asGameClock;
        asClockReady = true;
        asAimMode = false;
        asSlowUntilReal = 0; asTimeScale = 1; asPreviousTimeScale = 1;
        if(typeof currentEnemy==="undefined"||!currentEnemy||currentEnemy.hp<=0) return;
        asActive=true;window.antiSpiralBossActive=true;asState="cinematic";asWinPending=false;asDefeatPending=false;
        asInitPlatforms();asInitSeals();asDrillShots=[];asChargeFrames=0;asCharging=false;asLastDamageAt=asClockNow();asNextShotAt=0;asMiniCooldownUntil=0;asMiniReturnPlayer=null;asMiniSpirals=[];asReassemblyEffectUntil=0;asBossExposed=0;asLabyrinthTimer=0;asUltimateActive=false;asPatternSpawned=false;
        asCinematicStart=performance.now();asCinematicRedHeart={x:-25,y:410};asCinematicArenaProgress=0;
        asBossMaxHp=Math.floor(Math.max(40000,Math.floor((Number(window.playerFinalDamage)||80)*120))*1.30);
        asBossHp=asBossMaxHp;asPlayerMaxHp=220;asPlayerHp=asPlayerMaxHp;
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true,platformIndex:-1};
        asBoss={x:285,y:180,size:48,rotation:0,pulse:0,flash:0};
        asAttacks=[];asParticles=[];asTexts=[];asClones=[];asCloneMode=false;asCloneUntil=0;asCloneNextShuffleAt=0;asClonePhase="idle";asCloneStageUntil=0;asArenaLockUntil=0;asArenaWarpUntil=0;asLastArenaWarpCompact=false;asFrame=0;asPattern=0;asPatternTimer=0;asPatternDraining=false;asPatternVolleyCount=0;
        asArenaWidth=400;asArenaHeight=470;asTargetWidth=400;asTargetHeight=470;asLastArenaShift=asGameClock;asArenaLockUntil=0;asArenaWarpUntil=0;asLastArenaWarpCompact=false;asGravityDirection=0;asGravityNextShiftAt=0;asGravityIntervalBand=-1;
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
    window.setAntiSpiralBossHp = function(v){
        if(asActive && asState==="fight" && asUnbrokenSealIndex()>=0){
            asText(200,120,"ЩИТ ПЕЧАТЕЙ БЛОКИРУЕТ УРОН!","#cba9ff",40);
            return;
        }
        asBossHp=Math.max(0,Math.min(asBossHp,Number(v)||0));if(asBossHp<=0)asWin();
    };
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