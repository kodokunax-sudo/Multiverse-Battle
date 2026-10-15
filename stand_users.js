// Стандартный призыв стенда для JoJo-персонажей в боевых аренах.
(function () {
    "use strict";

    var NON_STAND_USERS = new Set([
        "Поко",
        "Дэнни (пёс Джонатана)",
        "Эрина Пендлтон (юность)",
        "Роберт Э. О. Спидвагон",
        "Бруфорд",
        "Таркус",
        "Уилл Антонио Цеппели",
        "Рудол фон Штрохайм (киборг)",
        "Джонатан Джостар (Хамон)",
        "Дио Брандо (часть 1)",
        "Джозеф Джостар (часть 2)",
        "Цезарь Антонио Цеппели",
        "Лиза Лиза",
        "Страйдзо (вампир)",
        "Сантана",
        "Вамуу",
        "Эйсидиси",
        "Карс (обычная форма)",
        "Карс (Высшее существо)"
    ]);

    var state = window.__mbStandUserState || {
        active: false,
        cardName: null,
        info: null,
        restoreSpeed: null,
        originalSpeed: null,
        contextType: null,
        lastRegenAt: 0
    };
    window.__mbStandUserState = state;

    function mainCard() {
        return typeof window.getMainCard === "function" ? window.getMainCard() : null;
    }

    function isStandUser(card) {
        if (!card) return false;
        var isJoJo = String(card.universe || "").toLowerCase() === "jojo" ||
            String(card.patchId || "").toLowerCase() === "jojo";
        return isJoJo && !NON_STAND_USERS.has(String(card.name || ""));
    }

    function getStandInfo(card) {
        var name = String(card && card.name || "");
        var profiles = [
            {
                match: /Star Platinum|The World|Crazy Diamond|Killer Queen|King Crimson|The Hand|Tusk Act 4|Gold Experience Requiem|D4C|Wonder of U/i,
                color: "#be9cff", speed: 1.12, damageFactor: 0.29,
                buff: "СИЛА: защита стендом усиливается"
            },
            {
                match: /Made in Heaven|Silver Chariot|Sex Pistols|Aerosmith|Tusk Act 3|Tusk Act 2|Tusk Act 1|The Hustle|Scary Monsters|Speed King|November Rain/i,
                color: "#67e8ff", speed: 1.28, damageFactor: 0.36,
                buff: "СКОРОСТЬ +28%"
            },
            {
                match: /Gold Experience|Crazy Diamond|Spice Girl|Soft & Wet|Paisley Park|Stone Free|Sticky Fingers|Diver Down|Love Deluxe|Hermit Purple/i,
                color: "#6dffb3", speed: 1.08, damageFactor: 0.23,
                buff: "ЗАЩИТА: стенд принимает меньше урона"
            },
            {
                match: /Whitesnake|C-Moon|Mandom|The World|Cream|Metallica|White Album|The Fool|Hierophant Green|Magician's Red|Echoes|Moody Blues|Emperor|Horus|Bad Company|Sex Pistols|Aerosmith/i,
                color: "#ffb86b", speed: 1.15, damageFactor: 0.31,
                buff: "БАЛАНС: скорость +15%"
            }
        ];
        for (var i = 0; i < profiles.length; i++) {
            if (profiles[i].match.test(name)) return profiles[i];
        }
        return {
            color: "#d5c1ff",
            speed: 1.10,
            damageFactor: 0.30,
            buff: "БАЛАНС: скорость +10%"
        };
    }

    function inCombat() {
        var unique = typeof window.isUniqueBossActive === "function" ? window.isUniqueBossActive() : null;
        var arena = typeof arenaActive !== "undefined" && arenaActive;
        return { unique: unique !== null, bossType: unique, arena: !!arena, active: unique !== null || !!arena };
    }

    function currentContext() {
        return typeof window.getBossContext === "function" ? window.getBossContext() : null;
    }

    function isActiveForCurrentCard() {
        var card = mainCard();
        return !!(state.active && card && isStandUser(card) && card.name === state.cardName);
    }

    function deactivateStand() {
        if (!state.active) return;
        var restore = state.restoreSpeed;
        var speed = state.originalSpeed;
        state.active = false;
        state.cardName = null;
        state.info = null;
        state.restoreSpeed = null;
        state.originalSpeed = null;
        state.contextType = null;
        state.lastRegenAt = 0;
        if (typeof restore === "function" && Number.isFinite(Number(speed))) {
            try { restore(Number(speed)); } catch (e) {}
        }
    }

    function toggleStand() {
        var card = mainCard();
        var combat = inCombat();
        if (!combat.active || !isStandUser(card)) return;

        if (combat.arena && typeof arenaPhase !== "undefined" && arenaPhase === "attack") {
            if (typeof window.showFloatingText === "function") window.showFloatingText("⚔️ СНАЧАЛА ЗАКОНЧИ АТАКУ!", "#ffdd00");
            return;
        }

        if (combat.unique) {
            if (typeof window.hasMasteryUniqueSuper === "function" && !window.hasMasteryUniqueSuper(card)) {
                if (typeof window.showFloatingText === "function") window.showFloatingText("Нужно мастерство 6★ для уникального босса!", "#ff3333");
                return;
            }
        } else if (typeof window.hasMasterySuper === "function" && !window.hasMasterySuper(card)) {
            if (typeof window.showFloatingText === "function") window.showFloatingText("Нужно мастерство 5★!", "#ff3333");
            return;
        }

        if (isActiveForCurrentCard()) {
            deactivateStand();
            if (typeof window.showFloatingText === "function") window.showFloatingText("СТЕНД УБРАН", "#c8b6ff");
            if (typeof window.updateSuperButton === "function") window.updateSuperButton();
            return;
        }

        deactivateStand();
        var ctxB = currentContext();
        var info = getStandInfo(card);
        state.active = true;
        state.cardName = card.name;
        state.info = info;
        state.contextType = ctxB ? ctxB.type : null;
        state.lastRegenAt = Date.now();

        if (ctxB && typeof ctxB.getHeartSpeed === "function" && typeof ctxB.setHeartSpeed === "function") {
            var speed = Number(ctxB.getHeartSpeed());
            if (Number.isFinite(speed) && speed > 0) {
                state.originalSpeed = speed;
                state.restoreSpeed = ctxB.setHeartSpeed;
                ctxB.setHeartSpeed(speed * info.speed);
            }
        }

        if (typeof window.showFloatingText === "function") {
            window.showFloatingText("🌀 " + card.name + ": СТЕНД! " + info.buff, info.color);
        }
        if (typeof window.updateSuperButton === "function") window.updateSuperButton();
    }

    function getHitboxPosition(ctxB) {
        if (!isActiveForCurrentCard()) return null;
        ctxB = ctxB || currentContext();
        if (!ctxB || typeof ctxB.getHeartX !== "function" || typeof ctxB.getHeartY !== "function") return null;
        var x = Number(ctxB.getHeartX()) || 0;
        var y = Number(ctxB.getHeartY()) || 0;
        return {
            x: x > 300 ? x - 23 : x + 23,
            y: y - 9,
            radius: 10,
            color: state.info ? state.info.color : "#d5c1ff"
        };
    }

    function renderStand() {
        if (!isActiveForCurrentCard()) {
            if (state.active) deactivateStand();
            return;
        }
        if (typeof ctx === "undefined" || !ctx) return;
        var p = getHitboxPosition();
        if (!p) return;
        var pulse = 1 + Math.sin(Date.now() / 115) * 0.08;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(pulse, pulse);
        ctx.globalAlpha = 0.92;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        var heartPath = function () {
            ctx.beginPath();
            ctx.moveTo(0, 8);
            ctx.bezierCurveTo(-3, 5, -11, -1, -10, -7);
            ctx.bezierCurveTo(-9, -14, -2, -14, 0, -8);
            ctx.bezierCurveTo(3, -14, 10, -13, 10, -7);
            ctx.bezierCurveTo(11, -1, 3, 5, 0, 8);
            ctx.closePath();
        };
        var gradient = ctx.createLinearGradient(-8, -13, 8, 8);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.42, p.color);
        gradient.addColorStop(1, "#37304a");
        ctx.fillStyle = gradient;
        heartPath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        heartPath();
        ctx.stroke();
        ctx.fillStyle = "#262238";
        ctx.beginPath();
        ctx.arc(-3.2, -5.5, 1.2, 0, Math.PI * 2);
        ctx.arc(3.2, -5.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    window.isStandUserCard = isStandUser;
    window.isStandUserStandActive = isActiveForCurrentCard;
    window.getStandUserHitboxPosition = getHitboxPosition;
    window.getStandUserDamageFactor = function () {
        return isActiveForCurrentCard() && state.info ? state.info.damageFactor : 0.4;
    };
    window.toggleStandUser = toggleStand;
    window.renderStandUser = renderStand;
    window.resetStandUser = deactivateStand;

    // Для стенд-юзеров кнопка SUPER превращается в обычный переключатель призыва.
    var originalToggleSuper = window.toggleSuper;
    if (typeof originalToggleSuper === "function") {
        window.toggleSuper = function () {
            var card = mainCard();
            if (isStandUser(card)) {
                toggleStand();
                return;
            }
            return originalToggleSuper.apply(this, arguments);
        };
    }

    var originalUpdateSuperButton = window.updateSuperButton;
    if (typeof originalUpdateSuperButton === "function") {
        window.updateSuperButton = function () {
            if (state.active && !isActiveForCurrentCard()) deactivateStand();
            var result = originalUpdateSuperButton.apply(this, arguments);
            var card = mainCard();
            var combat = inCombat();
            var btn = document.getElementById("superBtn");
            if (!btn || !isStandUser(card) || !combat.active) return result;

            var hasMastery = combat.unique
                ? (typeof window.hasMasteryUniqueSuper !== "function" || window.hasMasteryUniqueSuper(card))
                : (typeof window.hasMasterySuper !== "function" || window.hasMasterySuper(card));
            if (!hasMastery) {
                btn.style.display = "none";
                return result;
            }

            btn.style.display = "block";
            btn.disabled = false;
            btn.textContent = isActiveForCurrentCard() ? "⏹ УБРАТЬ СТЕНД" : "🌀 ПРИЗВАТЬ СТЕНД";
            btn.style.background = isActiveForCurrentCard() && state.info
                ? "linear-gradient(135deg," + state.info.color + ",#574080)"
                : "linear-gradient(135deg,#6d42a8,#32204e)";
            btn.style.animation = isActiveForCurrentCard() ? "none" : "superPulse 2s infinite";
            var btn2 = document.getElementById("superBtn2");
            var btnDeact = document.getElementById("superBtnDeactivate");
            if (btn2) btn2.style.display = "none";
            if (btnDeact) btnDeact.style.display = "none";
            return result;
        };
    }

    var originalResetAllSupers = window.resetAllSupers;
    if (typeof originalResetAllSupers === "function") {
        window.resetAllSupers = function () {
            deactivateStand();
            return originalResetAllSupers.apply(this, arguments);
        };
    }

    var originalRenderSuperVisuals = window.renderSuperVisuals;
    if (typeof originalRenderSuperVisuals === "function") {
        window.renderSuperVisuals = function () {
            var result = originalRenderSuperVisuals.apply(this, arguments);
            renderStand();
            return result;
        };
    }

    // Арена обычная принимает урон через applyHit; стенд даёт небольшой универсальный бонус защиты.
    var originalApplyHit = window.applyHit;
    if (typeof originalApplyHit === "function") {
        window.applyHit = function (damage, textMsg, isTrueOneshot) {
            if (isActiveForCurrentCard() && state.info && Number(damage) > 0) {
                damage = Math.max(1, Math.floor(Number(damage) * 0.92));
            }
            return originalApplyHit.call(this, damage, textMsg, isTrueOneshot);
        };
    }
})();
