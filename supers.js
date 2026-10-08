// ========== СУПЕР-СПОСОБНОСТИ v20.0 ==========
// ★ ПОЛНАЯ ПОДДЕРЖКА УНИКАЛЬНЫХ БОССОВ ★
// Работает на: арене Undertale, Живом Камне, Путеводной Звезде, Роджере vs Белоусе
// ★ v20.0 — ДОБАВЛЕН БЕЛОУС:
//   - СУПЕР: "ГУРА-ГУРА: КОНЕЦ МИРА" — заморозка атак + урон 15% + цунами
//   - ПАССИВКА: 10% поглощение урона + 2% HP/5сек (при 4★+)
//   - Экспорт applyWhitebeardPassiveReduction для боссов

// ============================================================
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★         ⚙️  НАСТРОЙКИ ЗАРЯДОВ SUPER — МЕНЯЙ ЗДЕСЬ!                ★★★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ============================================================

const SUPER_DEFAULT_CHARGES = 3;

const SUPER_CHARGES_PER_BOSS = {
    'stone':   3,
    'waystar': 3,
    'rwb':     5,
};

const SUPER_CHARGES_PER_HERO = {
    "Сайтама":                  5,
    "Космический Гароу":        5,
    "Луффи: Ника, Бог Солнца":  3,
    "Борос":                    4,
    "Бог Усопп":                3,
    "Зено":                     1,
    "Анти-спираль":             3,
    "Молодой Гарп":             3,
    "Им (Правитель)":           3,
    "Космический Дэнди":        10,
    "Кайдо":                    2,
    "Император Марк":           -1,
    "Деку (100%)":              3,
    "Всемогущий (прайм)":       1,
    "Белоус":                   3,
    
};

const SUPER_CHARGES_HERO_PER_BOSS = {
    // 'stone': { "Сайтама": 5, "Зено": 2 },
    // 'waystar': { "Сайтама": 2 },
    // 'rwb': { "Кайдо": 3 },
};

// ============================================================
// КОНЕЦ НАСТРОЕК
// ============================================================

let _superState = {
    fists: [], rings: [],
    dekusActive: false, dekusOriginalSpeed: 1.2, dekusDmgMult: 1, dekusParticles: false,
    dekuEarthShatterReady: false, dekuDashSmashReady: false,
    dekuEarthShatterCooldown: 0, dekuDashSmashCooldown: 0,
    dekuSmashActive: false, dekuSmashBlackoutTimer: 0, dekuSmashSequenceTimer: 0, dekuFists: [],
    originalHeartSpeed: 1.2, originalGlobalSpeedMod: 1.0,
    borosHeal: null, borosParticles: false,
    usoppInvuln: false, usoppStunTimer: 0,
    nikaActive: false, nikaHitboxOriginal: 4, nikaSizeOriginal: 14, nikaDmgMult: 1, nikaSpeedBonus: 1,
    positionHistory: [], garouMarker: null, garouInvulnTimer: 0, garouTimeStop: false,
    garpChargeTimer: 0, garpImpactActive: false, garpImpactRadius: 0, garpImpactX: 0, garpImpactY: 0,
    garpHakiActive: false, garpHakiTimer: 0,
    imAuraActive: false, imSpeedPenalty: false,
    antispiralActive: false, antispiralOrigHitbox: 4, antispiralOrigSize: 14, antispiralOrigSpeed: 1.2, antispiralShrinkAttacks: false,
    antispiralFrozen: false,
    dandyLightnings: false, dandyInvuln: false, dandyDmgBuff: null, dandyShield: null, dandyVulnerable: null, dandyDoubleTargets: false, dandyRoulette: null,
    dandyDarkness: 0, dandyAura: 0, dandyLava: 0, dandyAutoRevive: false,
    kaidoDrinking: false, kaidoBuffActive: false, kaidoDmgReduction: false, kaidoDmgBonus: 1, kaidoSpeedBonus: 1, invertControls: false, kaidoScream: false,
    markResurrectCharges: 2,
    markBuffActive: false, markBuffTimer: 0, markDmgReduction: 1, markDmgBonus: 1, markSpeedBonus: 1,
    allmightPermaSlow: false, allmightDmgMult: 1, allmightBuffTimer: 0, allmightOrigSize: 14, allmightOrigHitbox: 4, allmightShockwave: 0,
    allmightDebuffActive: false, allmightDebuffTimer: 0, allmightDebuffDmgMult: 1,
    allmightHurricane: false, allmightHurricaneTimer: 0, allmightHurricaneAngle: 0,
    screenShakeAmount: 0, screenFlashWhite: 0,
    realityCracks: [], comicTexts: [], earthCracks: [],
    dekuDash: null, dekuExplosions: [], dekuSmashStartedAt: 0,
    // ★ БЕЛОУС ★
    whitebeardCharging: false,
    whitebeardChargeTimer: 0,
    whitebeardX: 0,
    whitebeardY: 0,
    whitebeardTimeStop: false,
    whitebeardTsunami: false,
    whitebeardTsunamiY: 0,
    whitebeardTsunamiTimer: 0,
    // ★ БЕЛОУС: две отдельные аренные активки (УДАР -> ЦУНАМИ)
    whitebeardSkillCooldown: 0,
    whitebeardSkillWindow: 0,
    whitebeardSkillMode: "strike",
    whitebeardTsunamiUsed: false,
    whitebeardTsunamiPending: 0,
    whitebeardSkillTsunamiActive: false,
    whitebeardSkillTsunamiY: 540,
    whitebeardSkillTsunamiHitId: 0,

    // ★★★ DIO OVER HEAVEN ★★★
    dioEnergy: 0,
    dioEnergyLastBossHp: null,
    dioEnergyBossType: null,
    dioTimeStop: 0,
    dioTimeStopStartedAt: 0,
    dioTeleportStop: 0,
    dioHistory: [],
    dioAggroTimer: 0,
    dioStandFlash: 0,
    dioStandX: 0,
    dioStandY: 0,
    dioStandTarget: null,
    dioSkillCooldowns: { timeStop: 0, heal: 0, teleport: 0, aggro: 0 }
};

let _superCooldowns = {};
let _activeSuperName = null;
let _superLastTick = 0;
let _allmightHurricaneReady = false;
let _allmightHurricaneCooldown = 0;

if (typeof window._uniqueSuperCharges === 'undefined') window._uniqueSuperCharges = SUPER_DEFAULT_CHARGES;
if (typeof window._uniqueSuperMaxCharges === 'undefined') window._uniqueSuperMaxCharges = SUPER_DEFAULT_CHARGES;
if (typeof window._uniqueSuperBossId === 'undefined') window._uniqueSuperBossId = null;

window._heroSuperCharges = window._heroSuperCharges || {};

// ============================================================
// ФУНКЦИИ ПОЛУЧЕНИЯ ЛИМИТОВ
// ============================================================
function getBossChargeLimit(bossId) {
    if (!bossId) return SUPER_DEFAULT_CHARGES;
    return SUPER_CHARGES_PER_BOSS[bossId] || SUPER_DEFAULT_CHARGES;
}

function getHeroChargeLimit(heroName, bossId) {
    if (bossId && SUPER_CHARGES_HERO_PER_BOSS[bossId] &&
        SUPER_CHARGES_HERO_PER_BOSS[bossId][heroName] !== undefined) {
        return SUPER_CHARGES_HERO_PER_BOSS[bossId][heroName];
    }
    if (SUPER_CHARGES_PER_HERO[heroName] !== undefined) {
        return SUPER_CHARGES_PER_HERO[heroName];
    }
    return getBossChargeLimit(bossId);
}

function getEffectiveHeroChargeLimit(heroName, bossId) {
    var bossLimit = getBossChargeLimit(bossId);
    var heroLimit = getHeroChargeLimit(heroName, bossId);
    if (heroLimit === -1) return bossLimit;
    return Math.min(bossLimit, heroLimit);
}

function getHeroCurrentCharges(heroName) {
    if (window._heroSuperCharges[heroName] === undefined) return null;
    return window._heroSuperCharges[heroName];
}

function setHeroCurrentCharges(heroName, value) {
    window._heroSuperCharges[heroName] = value;
}

function canHeroUseSuper(heroName, bossId) {
    var current = getHeroCurrentCharges(heroName);
    if (current === null) {
        var limit = getEffectiveHeroChargeLimit(heroName, bossId);
        setHeroCurrentCharges(heroName, limit);
        return limit > 0;
    }
    return current > 0;
}

function consumeHeroCharge(heroName, bossId) {
    var current = getHeroCurrentCharges(heroName);
    if (current === null) {
        var limit = getEffectiveHeroChargeLimit(heroName, bossId);
        setHeroCurrentCharges(heroName, Math.max(0, limit - 1));
        return;
    }
    if (current > 0) setHeroCurrentCharges(heroName, current - 1);
}

function resetHeroCharges(bossId) {
    window._heroSuperCharges = {};
    var bossLimit = getBossChargeLimit(bossId);
    window._uniqueSuperCharges = bossLimit;
    window._uniqueSuperMaxCharges = bossLimit;

    for (var heroName in SUPER_CHARGES_PER_HERO) {
        var limit = getEffectiveHeroChargeLimit(heroName, bossId);
        window._heroSuperCharges[heroName] = limit;
    }

    console.log("[SUPER] Сброс зарядов для босса " + bossId + " (лимит босса: " + bossLimit + ")");
}

// ============================================================
// ОПРЕДЕЛЕНИЕ АКТИВНОГО УНИКАЛЬНОГО БОССА
// ============================================================
function isUniqueBossActive() {
    try {
        if (typeof waystarActive !== 'undefined' && waystarActive) return 'waystar';
        if (typeof livingStoneActive !== 'undefined' && livingStoneActive) return 'stone';
        if (typeof window.rwbActive !== 'undefined' && window.rwbActive) return 'rwb';
    } catch(e) {}
    return null;
}

// ============================================================
// ★★★ ЕДИНЫЙ КОНТЕКСТ БОССА ★★★
// ============================================================
function getBossContext() {
    var bossType = isUniqueBossActive();

    // ★ UNDERTALE ARENA ★
    if (!bossType) {
        if (typeof arenaActive !== 'undefined' && arenaActive) {
            return {
                type: 'arena',
                getHeartX: function() { return heart.x; },
                setHeartX: function(v) { heart.x = v; },
                getHeartY: function() { return heart.y; },
                setHeartY: function(v) { heart.y = v; },
                getHeartSize: function() { return heart.size; },
                setHeartSize: function(v) { heart.size = v; },
                getHeartHitbox: function() { return heart.hitbox; },
                setHeartHitbox: function(v) { heart.hitbox = v; },
                getHeartSpeed: function() { return heartSpeed; },
                setHeartSpeed: function(v) { heartSpeed = v; },
                getAttacks: function() { return attacks; },
                getBlasters: function() { return arenaBlasters; },
                getParticles: function() { return arenaParticles; },
                getBossMaxHp: function() { return arenaBossMaxHP; },
                setBossMaxHp: function(v) { arenaBossMaxHP = v; },
                getBossHp: function() { return arenaBossMaxHP; },
                getPlayerHp: function() { return arenaHP; },
                setPlayerHp: function(v) { arenaHP = v; },
                getPlayerMaxHp: function() { return arenaMaxHP; },
                addShake: function(v) { arenaShake = Math.max(arenaShake || 0, v); },
                addFlash: function(v, color) { screenFlash = v; if (color) screenFlashColor = color; },
                addFlashWhite: function(v) { _superState.screenFlashWhite = v; },
                spawnFloatingText: function(x, y, text, color) { if (typeof spawnFloatingText === 'function') spawnFloatingText(x, y, text, color); },
                playSound: function(f, t, d, v) { if (typeof playArenaSound === 'function') playArenaSound(f, t, d, v); },
                addShockwave: function(x, y, color, speed, life, width) { addShockwaveRing(x, y, color, speed, life, width); },
                clampHeart: function() { if (typeof clampHeart === 'function') clampHeart(); },
                isDodgePhase: function() { return typeof arenaPhase !== 'undefined' && arenaPhase === "dodge"; }
            };
        }
        return null;
    }

    // ★ WAYSTAR ★
    if (bossType === 'waystar') {
        return {
            type: 'waystar',
            getHeartX: function() { return waystarPlayer.x; },
            setHeartX: function(v) { waystarPlayer.x = Math.max(16, Math.min(384, v)); },
            getHeartY: function() { return waystarPlayer.y; },
            setHeartY: function(v) { waystarPlayer.y = Math.max(80, Math.min(484, v)); },
            getHeartSize: function() { return 14; },
            setHeartSize: function(v) {},
            getHeartHitbox: function() { return 6; },
            setHeartHitbox: function(v) {},
            getHeartSpeed: function() {
                var mult = (typeof waystarPlayerSpeedMult !== 'undefined') ? waystarPlayerSpeedMult : 1.0;
                return 4 * mult;
            },
            setHeartSpeed: function(v) {
                if (typeof waystarPlayerSpeedMult !== 'undefined') {
                    waystarPlayerSpeedMult = v / 4;
                }
            },
            getAttacks: function() { return waystarAttacks; },
            getBlasters: function() { return []; },
            getParticles: function() { return waystarParticles; },
            getBossMaxHp: function() { return waystarBossMaxHp; },
            setBossMaxHp: function(v) { waystarBossMaxHp = v; },
            getBossHp: function() { return waystarBossHp; },
            getPlayerHp: function() { return waystarPlayerHp; },
            setPlayerHp: function(v) { waystarPlayerHp = v; },
            getPlayerMaxHp: function() { return waystarPlayerMaxHp; },
            addShake: function(v) { waystarShake = Math.max(waystarShake || 0, v); },
            addFlash: function(v, color) { waystarScreenFlash = v; if (color) waystarScreenFlashColor = color; },
            addFlashWhite: function(v) { waystarScreenFlash = Math.max(waystarScreenFlash, v); waystarScreenFlashColor = "#ffffff"; },
            spawnFloatingText: function(x, y, text, color) { if (typeof spawnFloatingText === 'function') spawnFloatingText(x, y, text, color); },
            playSound: function(f, t, d, v) { if (typeof wsPlaySound === 'function') wsPlaySound(f, t, d, v); },
            addShockwave: function(x, y, color, speed, life, width) { if (typeof addWaystarShockwave === 'function') addWaystarShockwave(x, y, color, speed, life, width); },
            clampHeart: function() {},
            isDodgePhase: function() { return false; }
        };
    }

    // ★ LIVING STONE ★
    if (bossType === 'stone') {
        return {
            type: 'stone',
            getHeartX: function() { return livingStonePlayer.x; },
            setHeartX: function(v) { livingStonePlayer.x = Math.max(16, Math.min(384, v)); },
            getHeartY: function() { return livingStonePlayer.y; },
            setHeartY: function(v) { livingStonePlayer.y = Math.max(80, Math.min(484, v)); },
            getHeartSize: function() { return 14; },
            setHeartSize: function(v) {},
            getHeartHitbox: function() { return 6; },
            setHeartHitbox: function(v) {},
            getHeartSpeed: function() {
                var base = (typeof livingStoneState !== 'undefined' && livingStoneState === "phase2") ? 4.5 : 3.0;
                return base * (typeof lsSpeedMult !== 'undefined' ? lsSpeedMult : 0.5) * 2;
            },
            setHeartSpeed: function(v) {
                var base = (typeof livingStoneState !== 'undefined' && livingStoneState === "phase2") ? 4.5 : 3.0;
                if (base > 0 && typeof lsSpeedMult !== 'undefined') lsSpeedMult = v / (base * 2);
            },
            getAttacks: function() { return livingStoneAttacks; },
            getBlasters: function() { return []; },
            getParticles: function() { return livingStoneParticles; },
            getBossMaxHp: function() { return livingStoneBossMaxHp; },
            setBossMaxHp: function(v) { livingStoneBossMaxHp = v; },
            getBossHp: function() { return livingStoneBossHp; },
            getPlayerHp: function() { return livingStonePlayerHp; },
            setPlayerHp: function(v) { livingStonePlayerHp = v; },
            getPlayerMaxHp: function() { return livingStonePlayerMaxHp; },
            addShake: function(v) { livingStoneShake = Math.max(livingStoneShake || 0, v); },
            addFlash: function(v, color) { livingStoneScreenFlash = v; if (color) livingStoneScreenFlashColor = color; },
            addFlashWhite: function(v) { livingStoneScreenFlash = Math.max(livingStoneScreenFlash, v); livingStoneScreenFlashColor = "#ffffff"; },
            spawnFloatingText: function(x, y, text, color) { if (typeof spawnLivingStoneText === 'function') spawnLivingStoneText(x, y, text, color, 60); },
            playSound: function(f, t, d, v) { if (typeof playArenaSound === 'function') playArenaSound(f, t, d, v); },
            addShockwave: function(x, y, color, speed, life, width) { addShockwaveRing(x, y, color, speed, life, width); },
            clampHeart: function() {},
            isDodgePhase: function() { return false; }
        };
    }

    // ★★★ RWB (РОДЖЕР/БЕЛОУС) ★★★
    if (bossType === 'rwb') {
        return {
            type: 'rwb',
            getHeartX: function() { var p = window.getRWBPlayer ? window.getRWBPlayer() : null; return p ? p.x : 200; },
            setHeartX: function(v) { var p = window.getRWBPlayer ? window.getRWBPlayer() : null; if (p) p.x = Math.max(16, Math.min(384, v)); },
            getHeartY: function() { var p = window.getRWBPlayer ? window.getRWBPlayer() : null; return p ? p.y : 400; },
            setHeartY: function(v) { var p = window.getRWBPlayer ? window.getRWBPlayer() : null; if (p) p.y = Math.max(0, Math.min(484, v)); },
            getHeartSize: function() { return (typeof _superState !== 'undefined' && _superState.rwbHeartSize) ? _superState.rwbHeartSize : 12; },
            setHeartSize: function(v) { if (typeof _superState !== 'undefined') _superState.rwbHeartSize = Math.max(4, Number(v) || 12); },
            getHeartHitbox: function() { return (typeof _superState !== 'undefined' && _superState.rwbHeartHitbox) ? _superState.rwbHeartHitbox : 6; },
            setHeartHitbox: function(v) { if (typeof _superState !== 'undefined') _superState.rwbHeartHitbox = Math.max(2, Number(v) || 6); },
            getHeartSpeed: function() {
                if (typeof window.getRWBBaseSpeed === 'function' && typeof window.getRWBSpeedMult === 'function') {
                    return window.getRWBBaseSpeed() * window.getRWBSpeedMult();
                }
                return 4.5;
            },
            setHeartSpeed: function(v) {
                if (typeof window.getRWBBaseSpeed === 'function' && typeof window.setRWBSpeedMult === 'function') {
                    var base = window.getRWBBaseSpeed();
                    if (base > 0) window.setRWBSpeedMult(v / base);
                }
            },
            getAttacks: function() { return (typeof window.getRWBAttacks === 'function') ? window.getRWBAttacks() : []; },
            getBlasters: function() { return []; },
            getParticles: function() { return (typeof window.getRWBParticles === 'function') ? window.getRWBParticles() : []; },
            getBossMaxHp: function() { var b = (typeof window.getRWBActiveBoss === 'function') ? window.getRWBActiveBoss() : null; return b ? b.maxHp : 500; },
            // Для RWB getBossMaxHp() — это максимальный HP, а setBossMaxHp()
            // используется супер-способностями как "нанести процент от max HP".
            // Поэтому уменьшаем текущий HP, не ломая реальный maxHp босса.
            setBossMaxHp: function(v) {
                var b = (typeof window.getRWBActiveBoss === 'function') ? window.getRWBActiveBoss() : null;
                if (b) b.hp = Math.max(0, Math.min(b.hp, v));
            },
            getBossHp: function() { var b = (typeof window.getRWBActiveBoss === 'function') ? window.getRWBActiveBoss() : null; return b ? b.hp : 0; },
            getPlayerHp: function() { var p = window.getRWBPlayer ? window.getRWBPlayer() : null; return p ? p.hp : 250; },
            setPlayerHp: function(v) { var p = window.getRWBPlayer ? window.getRWBPlayer() : null; if (p) p.hp = v; },
            getPlayerMaxHp: function() { var p = window.getRWBPlayer ? window.getRWBPlayer() : null; return p ? p.maxHp : 250; },
            addShake: function(v) { if (typeof window.rwbAddShake === 'function') window.rwbAddShake(v); },
            addFlash: function(v, color) { if (typeof window.rwbAddFlash === 'function') window.rwbAddFlash(v, color); },
            addFlashWhite: function(v) { if (typeof window.rwbAddFlashWhite === 'function') window.rwbAddFlashWhite(v); },
            spawnFloatingText: function(x, y, text, color) { if (typeof window.spawnFloatingText === 'function') window.spawnFloatingText(x, y, text, color); },
            playSound: function(f, t, d, v) { if (typeof window.rwbSound === 'function') window.rwbSound(f, t, d, v); },
            addShockwave: function(x, y, color, speed, life, width) { if (typeof window.rwbAddShockwave === 'function') window.rwbAddShockwave(x, y, color, speed, life, width); },
            clampHeart: function() {},
            isDodgePhase: function() { return false; }
        };
    }

    return null;
}

// ====== ВСПОМОГАТЕЛЬНЫЕ ======
function drawHakiLightning(x, y, maxDist, alpha, widthMod, customColor) {
    if (widthMod === undefined) widthMod = 1;
    if (customColor === undefined) customColor = "#ff0000";
    if (!ctx) return;
    ctx.save(); ctx.globalAlpha = alpha;
    var angle = Math.random() * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    var cx = x, cy = y;
    var steps = 4 + Math.floor(Math.random() * 5);
    for (var i = 0; i < steps; i++) { angle += (Math.random() - 0.5) * 2.0; cx += Math.cos(angle) * (maxDist / steps); cy += Math.sin(angle) * (maxDist / steps); ctx.lineTo(cx, cy); }
    ctx.strokeStyle = customColor; ctx.lineWidth = 6 * widthMod; ctx.shadowColor = customColor; ctx.shadowBlur = 20; ctx.stroke();
    ctx.strokeStyle = "#000000"; ctx.lineWidth = 2 * widthMod; ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
}

function addShockwaveRing(x, y, color, speed, maxLife, width) {
    if (width === undefined) width = 4;
    _superState.rings.push({ x: x, y: y, radius: 10, color: color, speed: speed, life: maxLife, maxLife: maxLife, width: width });
}

function drawLightningBolt(x1, y1, x2, y2, color, alpha, width, innerColor) {
    if (width === undefined) width = 2;
    if (!ctx) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.strokeStyle = color; ctx.lineWidth = width * alpha;
    ctx.shadowColor = innerColor ? innerColor : color; ctx.shadowBlur = innerColor ? 15 * alpha : 12 * alpha;
    ctx.beginPath(); ctx.moveTo(x1, y1);
    var segments = 5, pts = [];
    for (var i = 1; i < segments; i++) { var t = i / segments; pts.push({ x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 15, y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 15 }); }
    for (var p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(x2, y2); ctx.stroke();
    if (innerColor) { ctx.strokeStyle = innerColor; ctx.lineWidth = (width * 0.4) * alpha; ctx.shadowBlur = 0; ctx.beginPath(); ctx.moveTo(x1, y1); for (var p of pts) ctx.lineTo(p.x, p.y); ctx.lineTo(x2, y2); ctx.stroke(); }
    ctx.restore();
}

function drawFist(f) {
    if (!ctx) return;
    var alpha = f.life > 10 ? 1 : f.life / 10;
    ctx.save(); ctx.globalAlpha = alpha;
    if (f.owner === "Сайтама") { var gradFire = ctx.createLinearGradient(f.x, f.y, f.x, f.y + 100); gradFire.addColorStop(0, "rgba(255,100,0,0.8)"); gradFire.addColorStop(0.5, "rgba(255,200,0,0.4)"); gradFire.addColorStop(1, "rgba(255,0,0,0)"); ctx.fillStyle = gradFire; ctx.beginPath(); ctx.moveTo(f.x - f.size/2, f.y); ctx.lineTo(f.x, f.y + 120); ctx.lineTo(f.x + f.size/2, f.y); ctx.closePath(); ctx.fill(); }
    ctx.translate(f.x, f.y); var s = f.size;
    ctx.shadowColor = f.owner === "Гарп" ? "#4444ff" : "#ff0000"; ctx.shadowBlur = f.owner === "Гарп" ? 40 : 50;
    if (f.owner === "Гарп") { for (var i = 0; i < 15; i++) { ctx.fillStyle = "rgba(255, 255, 255, " + (Math.random() * 0.8) + ")"; ctx.beginPath(); ctx.arc((Math.random() - 0.5) * s * 2, (Math.random() - 0.5) * s * 2.4, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = "#1111aa"; ctx.fillRect(-s, -s * 1.2, s * 2, s * 2.4); ctx.fillStyle = "#3333ff"; ctx.fillRect(-s * 0.6, -s * 1.2, s * 0.3, s * 2.4); ctx.fillRect(s * 0.3, -s * 1.2, s * 0.3, s * 2.4); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; }
    else { ctx.fillStyle = "#cc0000"; ctx.fillRect(-s, -s * 1.2, s * 2, s * 2.4); ctx.fillStyle = "#ff3333"; ctx.fillRect(-s * 0.7, -s * 1.2, s * 0.4, s * 2.4); ctx.fillRect(s * 0.3, -s * 1.2, s * 0.4, s * 2.4); ctx.fillStyle = "#880000"; ctx.fillRect(-s, s * 0.8, s * 2, s * 0.4); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; }
    ctx.shadowBlur = 0; ctx.strokeRect(-s, -s * 1.2, s * 2, s * 2.4);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold " + (s * 0.5) + "px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "#000"; ctx.shadowBlur = 6; ctx.fillText(f.owner === "Гарп" ? "ГАЛАКТИКА" : "УДАР", 0, 0); ctx.restore();
}

function drawCircleMarker(x, y, color, alpha, radius) {
    if (radius === undefined) radius = 25;
    if (!ctx) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 20;
    ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    var pulse = 1 + Math.sin(performance.now() / 100) * 0.3;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 6 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawGarouTrail() {
    var mainCard = getMainCard();
    if (!mainCard || mainCard.name !== "Космический Гароу") return;
    if (!ctx || !_superState.positionHistory || _superState.positionHistory.length < 2) return;
    ctx.save();
    for (var i = 1; i < _superState.positionHistory.length; i++) { var p1 = _superState.positionHistory[i - 1], p2 = _superState.positionHistory[i]; var age = (performance.now() - p2.time) / 2000; var alpha = 1 - age; if (alpha <= 0) continue; ctx.globalAlpha = alpha * 0.5; var gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y); gradient.addColorStop(0, "rgba(186, 85, 211, " + alpha + ")"); gradient.addColorStop(0.5, "rgba(75, 0, 130, " + (alpha * 0.7) + ")"); gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); ctx.strokeStyle = gradient; ctx.lineWidth = 8 * alpha; ctx.shadowColor = "#ba55d3"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); if (Math.random() < 0.15) { ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(p2.x + (Math.random()-0.5)*10, p2.y + (Math.random()-0.5)*10, 1 + Math.random()*1.5, 0, Math.PI*2); ctx.fill(); } }
    ctx.restore();
}

function drawBeerBottle(x, y, alpha, isDrinking) {
    if (!ctx) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y - 30);
    if (isDrinking) { var tilt = Math.abs(Math.sin(performance.now() / 150)) * (Math.PI / 2.5); ctx.rotate(tilt); if (Math.random() < 0.25) { _superState.rings.push({x: x + 15, y: y - 30, radius: 2, color: "#D2691E", speed: 0.5, life: 15, maxLife: 15, width: 2}); } }
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-6, -12, 14, 22); ctx.fillStyle = "#8B4513"; ctx.fillRect(-8, -15, 16, 28); ctx.fillStyle = "#D2691E"; ctx.fillRect(-6, -20, 12, 8); ctx.fillStyle = "#FFD700"; ctx.fillRect(-5, -24, 10, 6); ctx.fillStyle = "#FFD700"; ctx.fillRect(-6, -5, 12, 10); ctx.fillStyle = "#000"; ctx.font = "bold 6px monospace"; ctx.textAlign = "center"; ctx.fillText("BEER", 0, 2); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(-8, -15, 16, 28);
    for (var i = 0; i < 3; i++) { var bx = -4 + Math.random() * 10, by = -10 - Math.random() * 10; ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
}

function drawAllMightHeart(hx, hy, size) {
    if (!ctx) return;
    ctx.save(); ctx.translate(hx, hy - 2);
    var pulse = 1.0 + Math.abs(Math.sin(performance.now() / 140)) * 0.15;
    var glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 4.5); glowGrad.addColorStop(0, 'rgba(0, 100, 255, 0.8)'); glowGrad.addColorStop(0.4, 'rgba(255, 215, 0, 0.6)'); glowGrad.addColorStop(0.7, 'rgba(255, 0, 0, 0.5)'); glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGrad; ctx.beginPath(); ctx.arc(0, 2, size * 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.scale(pulse, pulse);
    var heartGrad = ctx.createLinearGradient(0, -size, 0, size); heartGrad.addColorStop(0, '#0055ff'); heartGrad.addColorStop(0.5, '#ffd700'); heartGrad.addColorStop(1, '#ff0000');
    ctx.fillStyle = heartGrad; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 20; var hs = size * 0.8;
    ctx.beginPath(); ctx.arc(-hs/2, -hs/3, hs/2, Math.PI, 0); ctx.arc(hs/2, -hs/3, hs/2, Math.PI, 0); ctx.lineTo(0, hs); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = Math.sin(performance.now()/50) > 0 ? "#ffffff" : "#ffaaaa"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}

// ====== DIO OVER HEAVEN ======
function isDioOverHeavenMain() {
    try {
        var c = getMainCard();
        return !!(c && c.name === "ДИО Over Heaven" &&
            (typeof hasMasteryAbility !== "function" || hasMasteryAbility(c)));
    } catch(e) { return false; }
}
window.isDioOverHeavenMain = isDioOverHeavenMain;

function dioPlaySound(path) {
    try {
        var a = new Audio(path);
        a.volume = 0.72;
        a.play().catch(function(){});
    } catch(e) {}
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
        // 1 энергия за 5 нанесённого урона: боссы не превращают шкалу в бесконечный спам.
        dioAddEnergy(delta / 5);
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

function dioStartTimeStop(duration, teleportStyle) {
    var ctxB = getBossContext();
    if (!ctxB) return;
    var d = Number(duration) || 0;
    if (teleportStyle) _superState.dioTeleportStop = d;
    else _superState.dioTimeStop = d;
    _superState.dioTimeStopStartedAt = performance.now();
    _superState.dioStandFlash = teleportStyle ? 0.45 : 0.9;
    _superState.dioStandX = ctxB.getHeartX();
    _superState.dioStandY = ctxB.getHeartY();
    dioPlaySound("music/za-warudo-time-stop-louder.mp3");
    ctxB.addFlashWhite(teleportStyle ? 3 : 8);
    ctxB.addShake(teleportStyle ? 8 : 18);
    ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 35, teleportStyle ? "THE WORLD!" : "ZA WARUDO!", "#fff0a0");
}

function activateDioTimeStop() {
    if (!dioCanUse("timeStop", 40, 25)) return;
    dioStartTimeStop(2.5, false);
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
    dioPlaySound("music/dios-time-stop-teleportation-sound-effect-1.mp3");
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
    _superState.dioTimeStop = Math.max(0, (_superState.dioTimeStop || 0) - dt);
    _superState.dioTeleportStop = Math.max(0, (_superState.dioTeleportStop || 0) - dt);
    _superState.dioAggroTimer = Math.max(0, (_superState.dioAggroTimer || 0) - dt);
    _superState.dioStandFlash = Math.max(0, (_superState.dioStandFlash || 0) - dt);
}

function updateDioHistory(ctxB) {
    if (!isDioOverHeavenMain() || !ctxB) return;
    var now = performance.now();
    _superState.dioHistory.push({time: now, x: ctxB.getHeartX(), y: ctxB.getHeartY()});
    while (_superState.dioHistory.length && now - _superState.dioHistory[0].time > 2500) _superState.dioHistory.shift();
}

function updateDioAggressiveBlocks(ctxB) {
    if (!ctxB || _superState.dioAggroTimer <= 0) return;
    var atk = ctxB.getAttacks();
    for (var i = atk.length - 1; i >= 0; i--) {
        var a = atk[i];
        if (!a.dioAggro) continue;
        var ax = a.x + (a.size || a.radius || 10) / 2, ay = a.y + (a.size || a.radius || 10) / 2;
        var best = -1, bestD = Infinity;
        for (var j = 0; j < atk.length; j++) {
            if (i === j || !atk[j].dioAggro) continue;
            var bx = atk[j].x + (atk[j].size || atk[j].radius || 10) / 2, by = atk[j].y + (atk[j].size || atk[j].radius || 10) / 2;
            var d = Math.hypot(bx - ax, by - ay);
            if (d < bestD) { bestD = d; best = j; }
        }
        if (best >= 0 && bestD < 150) {
            var b = atk[best], bx2 = b.x + (b.size || b.radius || 10) / 2, by2 = b.y + (b.size || b.radius || 10) / 2;
            var dx = bx2 - ax, dy = by2 - ay, len = Math.hypot(dx,dy) || 1;
            var speed = 4.2;
            if (a.spd !== undefined) a.spd = dx / len * speed;
            if (a.spdY !== undefined) a.spdY = dy / len * speed;
            if (a.vx !== undefined) a.vx = dx / len * speed;
            if (a.vy !== undefined) a.vy = dy / len * speed;
            if (bestD < ((a.size || a.radius || 10) + (b.size || b.radius || 10)) * 0.45) {
                atk.splice(Math.max(i,best),1);
                if (Math.min(i,best) < atk.length) atk.splice(Math.min(i,best),1);
                ctxB.getParticles().push({x:ax,y:ay,vx:0,vy:0,life:20,maxLife:20,color:"#d9c2ff",size:5});
            }
        }
    }
}

function ensureDioPanel() {
    var panel = document.getElementById("dioOverHeavenPanel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "dioOverHeavenPanel";
        panel.style.cssText = "display:none;max-width:420px;width:calc(100% - 12px);margin-top:7px;box-sizing:border-box;";
        var overlay = document.getElementById("arenaOverlay");
        if (overlay) overlay.appendChild(panel);
    }
    return panel;
}

function updateDioPanel() {
    var panel = ensureDioPanel();
    if (!panel) return;
    if (!isDioOverHeavenMain()) { panel.style.display = "none"; return; }
    panel.style.display = "block";
    var e = Math.floor(_superState.dioEnergy || 0);
    var cd = _superState.dioSkillCooldowns;
    var stop = Math.max(_superState.dioTimeStop || 0, _superState.dioTeleportStop || 0);
    panel.innerHTML =
        '<div style="color:#fff;text-align:center;font-weight:900;font-size:13px;margin-bottom:4px;">👑 DIO OVER HEAVEN — ЭНЕРГИЯ</div>' +
        '<div style="height:10px;background:#17121f;border:1px solid #9b82d0;border-radius:8px;overflow:hidden;margin-bottom:6px;">' +
        '<div style="height:100%;width:'+e+'%;background:linear-gradient(90deg,#d7d7ff,#fff1a0,#e5bfff);transition:width .15s;"></div></div>' +
        '<div style="color:#ddd;text-align:center;font-size:11px;margin-bottom:5px;">⚡ '+e+' / 100'+(stop>0?' · ⏱️ '+stop.toFixed(1)+'с':'')+'</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;">' +
        dioButton("⏳ ZA WARUDO", "timeStop", 40, 25, cd.timeStop) +
        dioButton("💚 REALITY HEAL", "heal", 30, 25, cd.heal) +
        dioButton("🌀 TIME TELEPORT", "teleport", 25, 15, cd.teleport) +
        dioButton("👊 BLOCK RAGE", "aggro", 40, 30, cd.aggro) +
        '</div>';
}
function dioButton(label,key,cost,cooldown,cd) {
    var disabled = cd > 0 || (_superState.dioEnergy || 0) < cost || !isDioOverHeavenMain();
    var textCd = cd > 0 ? " · "+Math.ceil(cd)+"с" : "";
    return '<button onclick="dioUseSkill(\''+key+'\')" '+(disabled?'disabled':'')+' style="padding:7px 4px;border-radius:8px;border:1px solid #bca5ff;background:'+(disabled?'#333':'linear-gradient(135deg,#33214f,#8064a8)')+';color:white;font-size:11px;font-weight:800;">'+label+'<br><span style="font-size:9px;">⚡'+cost+textCd+'</span></button>';
}

function renderDioVisuals(ctxB) {
    if (!ctxB || !isDioOverHeavenMain() || !ctx) return;
    var stop = Math.max(_superState.dioTimeStop || 0, _superState.dioTeleportStop || 0);
    if (stop > 0) {
        ctx.save();
        ctx.globalAlpha = 0.14 + Math.sin(performance.now()/90)*0.03;
        ctx.fillStyle = "#d8d8e8";
        ctx.fillRect(0,0,400,500);
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = "#fff3a0";
        ctx.lineWidth = 2;
        ctx.setLineDash([8,10]);
        ctx.strokeRect(8,8,384,484);
        ctx.setLineDash([]);
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#caaeff";
        ctx.shadowBlur = 18;
        ctx.fillText(_superState.dioTimeStop > 0 ? "ZA WARUDO!" : "THE WORLD",200,48);
        ctx.restore();
    }
    if (_superState.dioStandFlash > 0) {
        ctx.save();
        var a = Math.min(1,_superState.dioStandFlash*2);
        ctx.globalAlpha = a;
        ctx.translate(_superState.dioStandX,_superState.dioStandY-35);
        ctx.fillStyle="#f7f7ff";ctx.strokeStyle="#d7c5ff";ctx.lineWidth=2;ctx.shadowColor="#c9a8ff";ctx.shadowBlur=25;
        ctx.beginPath();ctx.ellipse(0,0,24,34,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle="#d7c5ff";ctx.fillRect(-19,-13,38,8);
        ctx.fillStyle="#111";ctx.fillRect(-11,-2,7,4);ctx.fillRect(4,-2,7,4);
        ctx.fillStyle="#e7d76f";ctx.fillRect(-14,12,28,6);
        ctx.restore();
    }
}

// ====== ОПИСАНИЯ СПОСОБНОСТЕЙ ======
const superAbilities = {
    "Деку (100%)": { name: "ПОЛНОЕ 100% ПОКРЫТИЕ", cooldown: 15000, toggleable: true, duration: Infinity,
        onActivate() {
            var ctxB = getBossContext();
            _superState.dekusActive = true;
            _superState.dekusOriginalSpeed = ctxB ? ctxB.getHeartSpeed() : 1.2;
            _superState.dekusDmgMult = 2;
            _superState.dekusParticles = true;
            if (ctxB) ctxB.setHeartSpeed(_superState.dekusOriginalSpeed * 3);
            _superState.screenShakeAmount = 15;
            _superState.dekuEarthShatterReady = true;
            _superState.dekuDashSmashReady = true;
            _superState.dekuEarthShatterCooldown = 0;
            _superState.dekuDashSmashCooldown = 0;
            if (ctxB) {
                addShockwaveRing(ctxB.getHeartX(), ctxB.getHeartY(), "#44ff44", 400, 0.5);
                ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "100%!!!", "#44ff44");
            }
        },
        onDeactivate() {
            var ctxB = getBossContext();
            if (ctxB) ctxB.setHeartSpeed(_superState.dekusOriginalSpeed);
            _superState.rwbHeartSize = 12;
    _superState.rwbHeartHitbox = 6;
    _superState.dekusActive = false;
            _superState.dekusDmgMult = 1;
            _superState.dekusParticles = false;
            _superState.dekuEarthShatterReady = false;
            _superState.dekuDashSmashReady = false;
            _superState.dekuEarthShatterCooldown = 0;
            _superState.dekuDashSmashCooldown = 0;
            _superState.dekuDash = null;
            _superState.earthCracks = [];
            _superState.dekuExplosions = [];
            _superState.dekuSmashActive = false;
            _superState.dekuFists = [];
            _superState.dekuSmashBlackoutTimer = 0;
            _superState.dekuSmashSequenceTimer = 0;
            if (typeof restoreArenaTimer === 'function') restoreArenaTimer();
            _superState.screenShakeAmount = 0;
        },
        onTick(dt) {
            if (_superState.dekusActive) {
                var ctxB = getBossContext();
                if (ctxB) {
                    var drain = ctxB.getPlayerMaxHp() * 0.02 * dt;
                    ctxB.setPlayerHp(Math.max(0, ctxB.getPlayerHp() - drain));
                }
            }
        }
    },
    "Сайтама": { name: "ОБЫЧНЫЙ УДАР", cooldown: 12000, toggleable: false, duration: 0, onActivate() {
        var ctxB = getBossContext();
        if (!ctxB) return;
        var willOneshot = Math.random() < 0.01;
        _superState.fists.push({ x: ctxB.getHeartX(), y: ctxB.getHeartY() - 30, vx: 0, vy: -3.5, size: 70, life: 100, color: "#ff2222", willOneshot: willOneshot, oneshotChecked: false, pathWidth: 120, owner: "Сайтама" });
        _superState.screenShakeAmount = 25;
        _superState.screenFlashWhite = 3;
        addShockwaveRing(ctxB.getHeartX(), ctxB.getHeartY(), "#ff0000", 350, 0.6);
        for (var i = 0; i < 20; i++) { var ang = (i / 20) * Math.PI * 2; ctxB.getParticles().push({ x: ctxB.getHeartX(), y: ctxB.getHeartY(), vx: Math.cos(ang) * 12, vy: Math.sin(ang) * 12, life: 15, maxLife: 15, color: "#ffaa00", size: 3 }); }
        if (typeof sfxWhoosh === 'function') sfxWhoosh();
        ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "УДАР!", "#ff0000");
    }, onTick() {} },
    "Борос": { name: "РЕГЕНЕРАЦИЯ", cooldown: 20000, toggleable: false, duration: 5000, onActivate() {
        var ctxB = getBossContext();
        if (!ctxB) return;
        _superState.borosHeal = { active: true, healPerSec: ctxB.getPlayerMaxHp() * 0.06, elapsed: 0, totalDuration: 5 };
        _superState.borosParticles = true;
        var curSpd = ctxB.getHeartSpeed();
        ctxB.setHeartSpeed(curSpd * 0.7);
        addShockwaveRing(ctxB.getHeartX(), ctxB.getHeartY(), "#66ff66", 200, 0.8);
        ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "РЕГЕН!", "#66ff66");
    }, onDeactivate() {
        var ctxB = getBossContext();
        if (_superState.borosHeal) {
            if (ctxB) {
                var curSpd = ctxB.getHeartSpeed();
                ctxB.setHeartSpeed(curSpd / 0.7);
            }
            _superState.borosHeal = null;
            _superState.borosParticles = false;
        }
        _superState.screenFlashWhite = 5;
    }, onTick(dt) {
        if (_superState.borosHeal && _superState.borosHeal.active) {
            var ctxB = getBossContext();
            if (ctxB) {
                var h = _superState.borosHeal.healPerSec * dt;
                ctxB.setPlayerHp(Math.min(ctxB.getPlayerMaxHp(), ctxB.getPlayerHp() + h));
                _superState.borosHeal.elapsed += dt;
                if (_superState.borosHeal.elapsed >= _superState.borosHeal.totalDuration) { this.onDeactivate(); startCooldown("Борос", this.cooldown); }
            }
        }
    } },
    "Бог Усопп": { name: "ЛОЖЬ СТАНОВИТСЯ ПРАВДОЙ", cooldown: 35000, toggleable: false, duration: 3000, onActivate() {
        var ctxB = getBossContext();
        _superState.usoppInvuln = true;
        if (ctxB) ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "НЕУЯЗВИМ!", "#ffff00");
    }, onDeactivate() {
        var ctxB = getBossContext();
        _superState.usoppInvuln = false;
        _superState.usoppStunTimer = 1;
        if (ctxB) ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "ОГЛУШЕНИЕ!", "#ff8800");
    }, onTick(dt) {} },
    "Луффи: Ника, Бог Солнца": { name: "ОСВОБОЖДЕНИЕ", cooldown: 25000, toggleable: true, duration: Infinity, onActivate() {
        var ctxB = getBossContext();
        _superState.nikaActive = true;
        _superState.nikaHitboxOriginal = ctxB ? ctxB.getHeartHitbox() : 4;
        _superState.nikaSizeOriginal = ctxB ? ctxB.getHeartSize() : 14;
        if (ctxB) {
            ctxB.setHeartHitbox(ctxB.getHeartHitbox() * 2);
            ctxB.setHeartSize(ctxB.getHeartSize() * 2);
            ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "НИКА!", "#ffffff");
        }
        _superState.nikaDmgMult = 1.5;
        _superState.nikaSpeedBonus = 1.3;
        if (ctxB) {
            var curSpd = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd * 1.3);
        }
        _superState.screenFlashWhite = 8;
        if (ctxB) addShockwaveRing(ctxB.getHeartX(), ctxB.getHeartY(), "#ffffff", 500, 0.8);
    }, onDeactivate() {
        var ctxB = getBossContext();
        _superState.nikaActive = false;
        if (ctxB) {
            ctxB.setHeartHitbox(_superState.nikaHitboxOriginal);
            ctxB.setHeartSize(_superState.nikaSizeOriginal);
            var curSpd = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd / 1.3);
        }
        _superState.nikaDmgMult = 1;
    }, onTick(dt) {} },
    "Космический Гароу": { name: "ПОТОК ВСЕЛЕННОЙ", cooldown: 30000, toggleable: false, duration: 0, onActivate() {
        var ctxB = getBossContext();
        if (!ctxB) return;
        var now = performance.now();
        var target = null;
        for (var i = _superState.positionHistory.length - 1; i >= 0; i--) { if (now - _superState.positionHistory[i].time >= 2000) { target = _superState.positionHistory[i]; break; } }
        if (!target && _superState.positionHistory.length > 0) target = _superState.positionHistory[0];

        _superState.garouTimeStop = true;
        setTimeout(function() {
            _superState.garouTimeStop = false;
            console.log("[SUPER] Время снова пошло");
        }, 500);

        if (target) {
            addShockwaveRing(ctxB.getHeartX(), ctxB.getHeartY(), "#ba55d3", 250, 0.6, 6);
            for(var i=0; i<15; i++) { var ang = Math.random() * Math.PI*2; var sp = 3 + Math.random()*5; ctxB.getParticles().push({ x: ctxB.getHeartX(), y: ctxB.getHeartY(), vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, life: 25, maxLife: 25, color: "#4b0082", size: 4 }); }
            _superState.garouMarker = { x: target.x, y: target.y, alpha: 1.0, time: now };
            ctxB.setHeartX(target.x);
            ctxB.setHeartY(target.y);
            addShockwaveRing(ctxB.getHeartX(), ctxB.getHeartY(), "#ff8800", 300, 0.5, 6);
            _superState.garouInvulnTimer = 1.0;
            _superState.screenShakeAmount = 15;
            ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "ТЕЛЕПОРТ!", "#ff8800");
        }
        _superState.positionHistory = [];
        console.log("[SUPER] ⏸️ ВРЕМЯ ОСТАНОВЛЕНО на 0.5 сек");
    }, onTick(dt) {} },
    "Зено": { name: "СТИРАНИЕ", cooldown: 45000, toggleable: false, duration: 0, onActivate() {
        var ctxB = getBossContext();
        if (!ctxB) return;
        _superState.screenFlashWhite = 20;
        var atk = ctxB.getAttacks();
        for (var i = atk.length - 1; i >= 0; i--) atk.splice(i, 1);
        var bl = ctxB.getBlasters();
        for (var i = bl.length - 1; i >= 0; i--) bl.splice(i, 1);
        var maxHp = ctxB.getBossMaxHp();
        ctxB.setBossMaxHp(Math.floor(maxHp * 0.9));
        _superState.realityCracks = [];
        for (var i = 0; i < 8; i++) { _superState.realityCracks.push({ x1: Math.random() * 400, y1: Math.random() * 500, x2: Math.random() * 400, y2: Math.random() * 500, life: 1.5 }); }
        if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
        ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "СТЁРТО!", "#ff00ff");
    }, onTick() {} },
    "Анти-спираль": { name: "СЖАТИЕ ПРОСТРАНСТВА", cooldown: 25000, toggleable: true, duration: Infinity, onActivate() {
        var ctxB = getBossContext();
        if (!ctxB) return;
        _superState.antispiralActive = true;
        _superState.antispiralOrigHitbox = ctxB.getHeartHitbox();
        _superState.antispiralOrigSize = ctxB.getHeartSize();
        _superState.antispiralOrigSpeed = ctxB.getHeartSpeed();
        ctxB.setHeartHitbox(ctxB.getHeartHitbox() * 0.7);
        ctxB.setHeartSize(ctxB.getHeartSize() * 0.7);
        ctxB.setHeartSpeed(_superState.antispiralOrigSpeed * 0.7);
        var atk = ctxB.getAttacks();
        for (var a of atk) {
            if (a.size) a.size *= 0.7;
            if (a.radius) a.radius *= 0.7;
            if (a.spd) a.spd *= 0.7;
            if (a.spdY) a.spdY *= 0.7;
            if (a.vx) a.vx *= 0.7;
            if (a.vy) a.vy *= 0.7;
        }
        _superState.antispiralShrinkAttacks = true;
        _superState.antispiralFrozen = true;
        setTimeout(function() { _superState.antispiralFrozen = false; }, 500);
        ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "ПРОСТРАНСТВО СЖАТО!", "#aaddff");
    }, onDeactivate() {
        var ctxB = getBossContext();
        _superState.antispiralActive = false;
        _superState.antispiralShrinkAttacks = false;
        _superState.antispiralFrozen = false;
        if (ctxB) {
            ctxB.setHeartHitbox(_superState.antispiralOrigHitbox);
            ctxB.setHeartSize(_superState.antispiralOrigSize);
            ctxB.setHeartSpeed(_superState.antispiralOrigSpeed);
        }
        var atk = ctxB ? ctxB.getAttacks() : [];
        for (var a of atk) {
            if (a.size) a.size /= 0.7;
            if (a.radius) a.radius /= 0.7;
            if (a.spd) a.spd /= 0.7;
            if (a.spdY) a.spdY /= 0.7;
            if (a.vx) a.vx /= 0.7;
            if (a.vy) a.vy /= 0.7;
        }
    }, onTick(dt) {} },
    "Молодой Гарп": { name: "ГАЛАКТИЧЕСКИЙ УДАР", cooldown: 30000, toggleable: false, duration: 0, onActivate() {
        var ctxB = getBossContext();
        if (ctxB) {
            _superState.originalHeartSpeed = ctxB.getHeartSpeed();
            var curSpd = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd * 0.3);
        }
        _superState.garpChargeTimer = 1.2;
        _superState.screenShakeAmount = 12;
        if (ctxB) ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "ЗАРЯДКА ХАКИ...", "#ff0000");
    }, onTick(dt) {} },
    "Им (Правитель)": { name: "ТЕНЕВОЕ ПРАВЛЕНИЕ", cooldown: 30000, toggleable: true, duration: Infinity, onActivate() {
        var ctxB = getBossContext();
        _superState.imAuraActive = true;
        _superState.imSpeedPenalty = true;
        if (ctxB) {
            var curSpd = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd * 0.7);
        }
        if (ctxB) ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "ТЬМА!", "#800080");
    }, onDeactivate() {
        var ctxB = getBossContext();
        _superState.imAuraActive = false;
        _superState.imSpeedPenalty = false;
        if (ctxB) {
            var curSpd = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd / 0.7);
        }
    }, onTick(dt) {} },
    "Космический Дэнди": { name: "КОСМИЧЕСКАЯ УДАЧА", cooldown: 20000, toggleable: false, duration: 0, onActivate() {
        var ctxB = getBossContext();
        if (!ctxB) return;
        _superState.dandyRoulette = { time: performance.now(), duration: 1500, result: null, spinAngle: 0 };
        for (var i = 0; i < 10; i++) { ctxB.getParticles().push({ x: ctxB.getHeartX() + (Math.random()-0.5)*40, y: ctxB.getHeartY() - 40, vx: (Math.random()-0.5)*1, vy: -1 - Math.random(), life: 20, maxLife: 20, color: "#ffd700", size: 2, isQuestionMark: true }); }
        setTimeout(function() {
            _superState.dandyRoulette.result = { name: "???" };
            var roll = Math.random();
            if (roll < 0.40) { var eff = DANDY_GOOD[Math.floor(Math.random() * DANDY_GOOD.length)]; eff.apply(); _superState.dandyRoulette.result = { name: eff.name, good: true }; ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, eff.name + "!", "#44ff44"); }
            else if (roll < 0.60) { var eff = DANDY_NEUTRAL[Math.floor(Math.random() * DANDY_NEUTRAL.length)]; eff.apply(); _superState.dandyRoulette.result = { name: eff.name, good: null }; ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, eff.name + "!", "#ffd700"); }
            else { var eff = DANDY_BAD[Math.floor(Math.random() * DANDY_BAD.length)]; eff.apply(); _superState.dandyRoulette.result = { name: eff.name, good: false }; _superState.screenShakeAmount = 8; ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, eff.name + "!", "#ff4444"); }
            setTimeout(function() { _superState.dandyRoulette = null; }, 1000);
        }, 1500);
    }, onTick() {} },
    "Кайдо": { name: "ДЫХАНИЕ РАЗРУШЕНИЯ", cooldown: 25000, toggleable: false, duration: 0, onActivate() {
        var ctxB = getBossContext();
        if (!ctxB) return;
        _superState.kaidoDrinking = true;
        var curSpd = ctxB.getHeartSpeed();
        ctxB.setHeartSpeed(curSpd * 0.5);
        ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "ГЛОТОК...", "#D2691E");
        setTimeout(function() {
            _superState.kaidoDrinking = false;
            var curSpd2 = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd2 / 0.5);
            _superState.kaidoBuffActive = true;
            _superState.kaidoDmgReduction = true;
            _superState.kaidoSpeedBonus = 1.5;
            var curSpd3 = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd3 * 1.5);
            _superState.kaidoDmgBonus = 1.8;
            _superState.invertControls = true;
            _superState.kaidoScream = true;
            _superState.screenShakeAmount = 25;
            ctxB.setPlayerHp(Math.min(ctxB.getPlayerMaxHp(), ctxB.getPlayerHp() + ctxB.getPlayerMaxHp() * 0.1));
            ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "ЯРОСТЬ!!!", "#ff4444");
            setTimeout(function() { _superState.kaidoScream = false; }, 500);
            setTimeout(function() {
                _superState.kaidoBuffActive = false;
                _superState.kaidoDmgReduction = false;
                var curSpd4 = ctxB.getHeartSpeed();
                ctxB.setHeartSpeed(curSpd4 / 1.5);
                _superState.kaidoSpeedBonus = 1;
                _superState.kaidoDmgBonus = 1;
                _superState.invertControls = false;
                var curSpd5 = ctxB.getHeartSpeed();
                ctxB.setHeartSpeed(curSpd5 * 0.5);
                ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "ПОХМЕЛЬЕ...", "#8B4513");
                setTimeout(function() { var curSpd6 = ctxB.getHeartSpeed(); ctxB.setHeartSpeed(curSpd6 / 0.5); }, 3000);
            }, 10000);
        }, 2000);
    }, onTick() {} },
    "Император Марк": { name: "ПАССИВНАЯ", cooldown: 0, toggleable: false, duration: 0, onActivate() {}, onTick() {} },
    "Всемогущий (прайм)": { name: "СИМВОЛ МИРА", cooldown: 60000, toggleable: false, duration: 0, onActivate() {
        var ctxB = getBossContext();
        if (!ctxB) return;
        _superState.allmightOrigHitbox = ctxB.getHeartHitbox();
        _superState.allmightOrigSize = ctxB.getHeartSize();
        ctxB.setHeartHitbox(ctxB.getHeartHitbox() * 2);
        ctxB.setHeartSize(ctxB.getHeartSize() * 2);
        _superState.allmightDmgMult = 3;
        _superState.allmightBuffTimer = 15;
        _superState.allmightShockwave = 0;
        _superState.screenFlashWhite = 20;
        ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 50, "СИМВОЛ МИРА!!!", "#ffd700");
        _superState.allmightDebuffActive = false;
        _superState.allmightDebuffTimer = 0;
        _superState.allmightDebuffDmgMult = 1;
        _allmightHurricaneReady = true;
        _allmightHurricaneCooldown = 0;
        var phrases = ["DETROIT!", "TEXAS!", "CAROLINA!", "UNITED STATES!"];
        var phraseDelay = 0;
        phrases.forEach(function(p) {
            setTimeout(function() {
                if (_superState.allmightBuffTimer > 0) {
                    _superState.comicTexts.push({ text: p + " SMASH!", x: 50 + Math.random()*300, y: 100 + Math.random()*250, alpha: 1.0, scale: 1.5 + Math.random()*0.5, angle: (Math.random()-0.5)*0.3, color: Math.random() > 0.5 ? "#ffd700" : "#ff3333" });
                    _superState.screenShakeAmount = 15;
                }
            }, phraseDelay);
            phraseDelay += 3000;
        });
        setTimeout(function() {
            ctxB.setHeartHitbox(_superState.allmightOrigHitbox);
            ctxB.setHeartSize(_superState.allmightOrigSize);
            _superState.allmightDmgMult = 1;
            ctxB.setPlayerHp(Math.max(1, ctxB.getPlayerHp() - Math.floor(ctxB.getPlayerMaxHp() * 0.3)));
            _superState.allmightPermaSlow = true;
            var curSpd = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd / 3);
            _superState.allmightDebuffActive = true;
            _superState.allmightDebuffDmgMult = 0.5;
            _allmightHurricaneReady = false;
            _superState.allmightHurricane = false;
            ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "ИСТОЩЕНИЕ НАВСЕГДА!", "#ff0000");
        }, 15000);
    }, onTick() {} },
    // ★★★ БЕЛОУС ★★★
    "Белоус_УДАЛЁН": { 
        name: "ГУРА-ГУРА: КОНЕЦ МИРА", 
        cooldown: 40000, 
        toggleable: false, 
        duration: 0, 
        onActivate() {
            var ctxB = getBossContext();
            if (!ctxB) return;
            
            var hx = ctxB.getHeartX();
            var hy = ctxB.getHeartY();
            
            // ФАЗА 1: ЗАРЯДКА
            _superState.whitebeardCharging = true;
            _superState.whitebeardChargeTimer = 30;
            _superState.whitebeardX = hx;
            _superState.whitebeardY = hy;
            
            for (var i = 0; i < 12; i++) {
                _superState.rings.push({
                    x: hx, y: hy,
                    radius: 20 + i * 3,
                    color: "#aa00ff",
                    speed: 0,
                    life: 30, maxLife: 30,
                    width: 2
                });
            }
            
            _superState.screenShakeAmount = 8;
            if (typeof playArenaSound === 'function') playArenaSound(80, 'sawtooth', 0.5, 0.2);
            else if (typeof wsPlaySound === 'function') wsPlaySound(80, 'sawtooth', 0.5, 0.2);
            
            ctxB.spawnFloatingText(hx, hy - 50, "ГУРА-ГУРА...", "#aa00ff");
            console.log("[SUPER] 🌊 Белоус: зарядка");
            
            // ФАЗА 2: УДАР (через 0.5 сек)
            setTimeout(function() {
                if (!_superState.whitebeardCharging) return;
                _superState.whitebeardCharging = false;
                
                var ctxB2 = getBossContext();
                if (!ctxB2) return;
                
                _superState.whitebeardTimeStop = true;
                setTimeout(function() { _superState.whitebeardTimeStop = false; }, 800);
                
                _superState.screenShakeAmount = 60;
                _superState.screenFlashWhite = 25;
                
                for (var i = 0; i < 20; i++) {
                    var ang = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
                    var len = 150 + Math.random() * 150;
                    _superState.realityCracks.push({
                        x1: hx, y1: hy,
                        x2: hx + Math.cos(ang) * len,
                        y2: hy + Math.sin(ang) * len,
                        life: 2.0
                    });
                }
                
                var bossMaxHp = ctxB2.getBossMaxHp();
                var dmg1 = Math.floor(bossMaxHp * 0.12);
                ctxB2.setBossMaxHp(bossMaxHp - dmg1);
                
                var atk = ctxB2.getAttacks();
                for (var ai = 0; ai < atk.length; ai++) {
                    var a = atk[ai];
                    if (a.spd !== undefined) a.spd *= -3;
                    if (a.spdY !== undefined) a.spdY *= -3;
                    if (a.vx !== undefined) a.vx *= -3;
                    if (a.vy !== undefined) a.vy *= -3;
                }
                
                addShockwaveRing(hx, hy, "#aa00ff", 800, 1.2, 10);
                addShockwaveRing(hx, hy, "#ffffff", 500, 0.8, 6);
                
                for (var pi = 0; pi < 60; pi++) {
                    var ang2 = Math.random() * Math.PI * 2;
                    var spd2 = 8 + Math.random() * 15;
                    ctxB2.getParticles().push({
                        x: hx, y: hy,
                        vx: Math.cos(ang2) * spd2,
                        vy: Math.sin(ang2) * spd2,
                        life: 40, maxLife: 40,
                        color: pi % 3 === 0 ? "#ffffff" : (pi % 3 === 1 ? "#aa00ff" : "#ff66ff"),
                        size: 3 + Math.random() * 4
                    });
                }
                
                if (typeof playArenaSound === 'function') {
                    playArenaSound(60, 'sawtooth', 1.5, 0.5);
                    setTimeout(function() { playArenaSound(40, 'sawtooth', 1.2, 0.4); }, 200);
                } else if (typeof wsPlaySound === 'function') {
                    wsPlaySound(60, 'sawtooth', 1.5, 0.5);
                    setTimeout(function() { wsPlaySound(40, 'sawtooth', 1.2, 0.4); }, 200);
                }
                
                ctxB2.spawnFloatingText(hx, hy - 60, "КОНЕЦ МИРА!!!", "#aa00ff");
                ctxB2.spawnFloatingText(hx, hy - 40, "-" + dmg1 + " HP БОССУ!", "#ff66ff");
                
                console.log("[SUPER] 🌊 Белоус: удар! Урон: " + dmg1);
                
                // ФАЗА 3: ЦУНАМИ (через 0.8 сек)
                setTimeout(function() {
                    var ctxB3 = getBossContext();
                    if (!ctxB3) return;
                    
                    _superState.whitebeardTsunami = true;
                    _superState.whitebeardTsunamiY = 520;
                    _superState.whitebeardTsunamiTimer = 0;
                    
                    var bossMaxHp3 = ctxB3.getBossMaxHp();
                    var dmg2 = Math.floor(bossMaxHp3 * 0.03);
                    ctxB3.setBossMaxHp(bossMaxHp3 - dmg2);
                    
                    ctxB3.spawnFloatingText(hx, hy - 30, "-" + dmg2 + " HP (ВОЛНА)!", "#00ccff");
                    
                    if (typeof playArenaSound === 'function') playArenaSound(500, 'sine', 1.0, 0.3);
                    else if (typeof wsPlaySound === 'function') wsPlaySound(500, 'sine', 1.0, 0.3);
                    
                    console.log("[SUPER] 🌊 Белоус: цунами!");
                }, 800);
                
            }, 500);
        }, 
        onTick(dt) {
            if (_superState.whitebeardCharging) {
                _superState.whitebeardChargeTimer -= dt * 60;
                if (_superState.whitebeardChargeTimer < 0) _superState.whitebeardChargeTimer = 0;
            }
            if (_superState.whitebeardTsunami) {
                _superState.whitebeardTsunamiTimer++;
            }
        }
    }
};

// ============================================================
// ★★★ БЕЛОУС: ПАССИВКА — 10% ПОГЛОЩЕНИЕ УРОНА ★★★
// ============================================================
function applyWhitebeardPassiveReduction(dmg) {
    if (!dmg || dmg <= 0) return dmg;
    try {
        if (isWhitebeardMainActive()) {
            return Math.max(1, Math.floor(dmg * 0.9));
        }
    } catch(e) {}
    return dmg;
}
window.applyWhitebeardPassiveReduction = applyWhitebeardPassiveReduction;

// ============================================================
// ★★★ БЕЛОУС: ПАССИВКА — РЕГЕН 2% HP КАЖДЫЕ 5 СЕК ★★★
// ============================================================
if (typeof window._whitebeardRegenTimer === 'undefined') window._whitebeardRegenTimer = 0;

function tickWhitebeardRegen(dt) {
    try {
        if (!isWhitebeardMainActive()) {
            window._whitebeardRegenTimer = 0;
            return;
        }
        
        window._whitebeardRegenTimer += dt;
        if (window._whitebeardRegenTimer >= 5) {
            window._whitebeardRegenTimer = 0;
            
            var ctxB = getBossContext();
            if (!ctxB) return;
            
            var maxHp = ctxB.getPlayerMaxHp();
            var curHp = ctxB.getPlayerHp();
            if (curHp >= maxHp) return;
            
            var heal = Math.floor(maxHp * 0.02);
            ctxB.setPlayerHp(Math.min(maxHp, curHp + heal));
            
            ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 25, "+" + heal + " 🌊", "#66ccff");
            
            for (var i = 0; i < 8; i++) {
                var ang = (i / 8) * Math.PI * 2;
                ctxB.getParticles().push({
                    x: ctxB.getHeartX() + Math.cos(ang) * 20,
                    y: ctxB.getHeartY() + Math.sin(ang) * 20,
                    vx: Math.cos(ang) * 1.5,
                    vy: Math.sin(ang) * 1.5 - 1,
                    life: 30, maxLife: 30,
                    color: "#66ccff", size: 3
                });
            }
            
            if (typeof playArenaSound === 'function') {
                playArenaSound(600, 'sine', 0.15, 0.05);
            }
        }
    } catch(e) {}
}
window.tickWhitebeardRegen = tickWhitebeardRegen;

function restoreArenaTimer() {
    if (typeof arenaDodgeTimerInterval !== 'undefined' && arenaDodgeTimerInterval) clearInterval(arenaDodgeTimerInterval);
    if (typeof arenaActive !== 'undefined' && arenaActive) {
        arenaDodgeTimerInterval = setInterval(function() {
            if (typeof arenaPhase !== 'undefined' && arenaPhase === "dodge" && typeof arenaActive !== 'undefined' && arenaActive) {
                if (typeof arenaDodgeTimer !== 'undefined') { arenaDodgeTimer--; if (arenaDodgeTimer <= 0) arenaDodgeTimer = 0; }
                if (typeof updateDodgeTimerDisplay === 'function') updateDodgeTimerDisplay();
            }
        }, 1000);
    }
}

function triggerDekuSmash() {
    var ctxB = getBossContext();
    if (!ctxB) return;

    // ★ РАЗЛОМ ДЕКУ — визуальная атака уже описана ниже в renderSuperVisuals():
    // большие зелёно-красные кулаки, взрывы и трещины.
    // Раньше здесь включался только флаг dekuSmashActive, но сами кулаки
    // в dekuFists никогда не создавались — поэтому атака была невидимой.
    var hx = ctxB.getHeartX();
    var hy = ctxB.getHeartY();

    _superState.dekuSmashActive = true;
    _superState.dekuSmashStartedAt = performance.now();
    _superState.dekuSmashBlackoutTimer = 60;
    _superState.dekuSmashSequenceTimer = 150;
    _superState.dekuFists = [];
    _superState.dekuExplosions = [];
    _superState.earthCracks = [];

    _superState.originalHeartSpeed = ctxB.getHeartSpeed();
    _superState.originalGlobalSpeedMod = (typeof arenaGlobalSpeedMod !== 'undefined') ? arenaGlobalSpeedMod : 1.0;

    // Замедление сердца во время самого Разлома.
    ctxB.setHeartSpeed(_superState.originalHeartSpeed / 3);
    if (typeof arenaGlobalSpeedMod !== 'undefined') arenaGlobalSpeedMod = 0.33;

    // ★ Создаём волну ударов вокруг сердца.
    // delay — момент появления каждого кулака в существующей sequence-системе.
    var fistCount = 9;
    for (var fi = 0; fi < fistCount; fi++) {
        var angle = (fi / fistCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.22;
        var distance = 75 + Math.random() * 115;
        var fx = Math.max(20, Math.min(380, hx + Math.cos(angle) * distance));
        var fy = Math.max(45, Math.min(475, hy + Math.sin(angle) * distance));
        _superState.dekuFists.push({
            x: fx,
            y: fy,
            radius: 30 + Math.random() * 10,
            delay: 12 + fi * 14 + Math.random() * 8,
            active: false,
            angle: angle
        });
    }

    // ★ Центральный удар — появляется последним и выглядит мощнее.
    _superState.dekuFists.push({
        x: hx,
        y: hy,
        radius: 48,
        delay: 138,
        active: false,
        angle: 0
    });

    // ★ Земля/арена трескается в момент запуска.
    for (var ci = 0; ci < 14; ci++) {
        var crackAngle = (ci / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
        _superState.earthCracks.push({
            x: hx,
            y: hy,
            angle: crackAngle,
            length: 35 + Math.random() * 80,
            life: 1.4
        });
    }

    // Начальная вспышка и кольцо удара.
    _superState.dekuExplosions.push({
        x: hx,
        y: hy,
        life: 0.55,
        maxLife: 0.55
    });
    addShockwaveRing(hx, hy, "#44ff44", 520, 0.7, 6);
    _superState.screenShakeAmount = 22;
    _superState.screenFlashWhite = 4;

    if (typeof playArenaSound === 'function') {
        playArenaSound(80, 'sawtooth', 2.0, 0.3);
    }
}

function activateDekuEarthShatter() {
    if (!_superState.dekusActive) return;
    if (!_superState.dekuEarthShatterReady) return;
    var ctxB = getBossContext();
    if (!ctxB) return;
    _superState.dekuEarthShatterReady = false;
    _superState.dekuEarthShatterCooldown = 25;
    triggerDekuSmash();
    var dmg = Math.floor(ctxB.getBossMaxHp() * 0.12);
    ctxB.setBossMaxHp(ctxB.getBossMaxHp() - dmg);
    ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "РАЗЛОМ ДЕКУ!", "#44ff44");
}

function activateDekuDashSmash() {
    if (!_superState.dekusActive) return;
    if (!_superState.dekuDashSmashReady) return;
    var ctxB = getBossContext();
    if (!ctxB) return;
    _superState.dekuDashSmashReady = false;
    _superState.dekuDashSmashCooldown = 20;
    var dx = 0, dy = 0;
    if (typeof keys !== 'undefined') {
        if (keys.w || keys.up) dy = -1;
        if (keys.s || keys.down) dy = 1;
        if (keys.a || keys.left) dx = -1;
        if (keys.d || keys.right) dx = 1;
    }
    if (dx === 0 && dy === 0) { var ang = Math.random() * Math.PI * 2; dx = Math.cos(ang); dy = Math.sin(ang); }
    var len = Math.sqrt(dx*dx + dy*dy) || 1; dx /= len; dy /= len;
    _superState.dekuDash = { startX: ctxB.getHeartX(), startY: ctxB.getHeartY(), dirX: dx, dirY: dy, distance: 200, traveled: 0, trail: [], life: 0.4 };
    var dmg = Math.floor(ctxB.getBossMaxHp() * 0.08);
    ctxB.setBossMaxHp(ctxB.getBossMaxHp() - dmg);
    var dashWidth = 60;
    var atk = ctxB.getAttacks();
    for (var i = atk.length - 1; i >= 0; i--) {
        var a = atk[i];
        var ax = a.x + (a.size || a.radius || 20) / 2;
        var ay = a.y + (a.size || a.radius || 20) / 2;
        var t = ((ax - ctxB.getHeartX()) * dx + (ay - ctxB.getHeartY()) * dy) / (dx*dx + dy*dy);
        if (t > 0 && t < 200) {
            var projX = ctxB.getHeartX() + dx * t;
            var projY = ctxB.getHeartY() + dy * t;
            if (Math.sqrt((ax - projX)*(ax - projX) + (ay - projY)*(ay - projY)) < dashWidth) {
                atk.splice(i, 1);
                ctxB.getParticles().push({ x: ax, y: ay, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 20, maxLife: 20, color: "#44ff44", size: 3 });
            }
        }
    }
    _superState.screenShakeAmount = 15;
    addShockwaveRing(ctxB.getHeartX(), ctxB.getHeartY(), "#44ff44", 400, 0.5, 5);
    ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "РЫВОК! -8%", "#44ff44");
}

function deactivateDeku100() {
    if (!_superState.dekusActive) return;
    var ab = superAbilities["Деку (100%)"];
    if (ab.onDeactivate) ab.onDeactivate();
    _activeSuperName = null;
    startCooldown("Деку (100%)", ab.cooldown);
    updateSuperButton();
}

function activateAllmightHurricane() {
    if (!_allmightHurricaneReady) return;
    if (_allmightHurricaneCooldown > 0) return;
    var ctxB = getBossContext();
    if (!ctxB) return;
    _superState.allmightHurricane = true;
    _superState.allmightHurricaneTimer = 2.0;
    _superState.allmightHurricaneAngle = 0;
    _allmightHurricaneCooldown = 5.0;
    var hurricaneRadius = 150;
    var atk = ctxB.getAttacks();

    for (var a of atk) {
        var ax = a.x + (a.size || a.radius || 20) / 2;
        var ay = a.y + (a.size || a.radius || 20) / 2;
        var dist = Math.hypot(ax - ctxB.getHeartX(), ay - ctxB.getHeartY());
        if (dist < hurricaneRadius) {
            var dx = ax - ctxB.getHeartX();
            var dy = ay - ctxB.getHeartY();
            var d = Math.sqrt(dx*dx + dy*dy) || 1;
            if (a.spd !== undefined) a.spd += (dx / d) * 8 + (dy / d) * 4;
            if (a.spdY !== undefined) a.spdY += (dy / d) * 8 - (dx / d) * 4;
            if (a.vx !== undefined) a.vx += (dx / d) * 8 + (dy / d) * 4;
            if (a.vy !== undefined) a.vy += (dy / d) * 8 - (dx / d) * 4;
        }
    }
    addShockwaveRing(ctxB.getHeartX(), ctxB.getHeartY(), "#00ffff", 400, 0.5, 6);
    _superState.screenShakeAmount = 15;
    ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "УРАГАН!", "#00ffff");
    console.log("[SUPER] 🌪️ Ураган Всемогущего активирован на", ctxB.type);
}



function getMainCard() {
    if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) {
        var idx = team[mainCardIndex];
        if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) return myCards[idx];
    }
    return null;
}

function isWhitebeardMainActive() {
    try {
        if (typeof getMainCard !== "function") return false;
        var card = getMainCard();
        return !!(card && card.name === "Белоус" &&
            (typeof hasMasteryAbility !== "function" || hasMasteryAbility(card)));
    } catch(e) {}
    return false;
}

function clearWhitebeardSkillState() {
    _superState.whitebeardSkillCooldown = 0;
    _superState.whitebeardSkillWindow = 0;
    _superState.whitebeardSkillMode = "strike";
    _superState.whitebeardTsunamiUsed = false;
    _superState.whitebeardTsunamiPending = 0;
    _superState.whitebeardSkillTsunamiActive = false;
    _superState.whitebeardSkillTsunamiY = 540;
    _superState.whitebeardSkillTsunamiHitId = 0;
}

function whitebeardSkillStrike() {
    if ((!arenaActive && !isUniqueBossActive()) || !isWhitebeardMainActive()) return;
    if (typeof arenaPhase !== "undefined" && arenaPhase === "attack") {
        if (typeof showFloatingText === "function") showFloatingText("⚔️ СНАЧАЛА ЗАКОНЧИ АТАКУ!", "#ffdd00");
        return;
    }
    if (_superState.whitebeardSkillCooldown > 0) {
        if (typeof showFloatingText === "function") showFloatingText("⏳ УДАР: " + Math.ceil(_superState.whitebeardSkillCooldown) + "с", "#ffaa00");
        return;
    }

    var c = getBossContext();
    if (!c) return;

    var hx = c.getHeartX(), hy = c.getHeartY();
    _superState.whitebeardSkillCooldown = 30;
    _superState.whitebeardSkillWindow = 20;
    _superState.whitebeardSkillMode = "tsunami";
    _superState.whitebeardTsunamiUsed = false;
    _superState.whitebeardTsunamiPending = 0;

    var atk = c.getAttacks();
    for (var i = 0; i < atk.length; i++) {
        var a = atk[i];
        var ax = (a.x || 0) + (a.size || a.radius || 20) / 2;
        var ay = (a.y || 0) + (a.size || a.radius || 20) / 2;
        var dx = ax - hx, dy = ay - hy;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var push = 8 + Math.max(0, 120 - Math.min(120, dist)) / 15;
        var nx = dx / dist, ny = dy / dist;
        if (a.spd !== undefined) a.spd += nx * push;
        if (a.spdY !== undefined) a.spdY += ny * push;
        if (a.vx !== undefined) a.vx += nx * push;
        if (a.vy !== undefined) a.vy += ny * push;
        if (a._whitebeardPushTimer === undefined) a._whitebeardPushTimer = 0.18;
    }

    if (c.addShockwave) {
        c.addShockwave(hx, hy, "#00ccff", 850, 0.8, 10);
        c.addShockwave(hx, hy, "#ffffff", 520, 0.55, 5);
    } else {
        addShockwaveRing(hx, hy, "#00ccff", 850, 0.8, 10);
        addShockwaveRing(hx, hy, "#ffffff", 520, 0.55, 5);
    }
    var wbParticles = c.getParticles ? c.getParticles() : [];
    for(var pi=0;pi<70;pi++){var pa=Math.random()*Math.PI*2,pr=30+Math.random()*180;wbParticles.push({x:hx,y:hy,vx:Math.cos(pa)*pr/18,vy:Math.sin(pa)*pr/18,life:42,maxLife:42,color:pi%2?"#66ddff":"#ffffff",size:2+Math.random()*5});}
    if(c.spawnFloatingText)c.spawnFloatingText(hx,hy-40,"💥 ГУРА-ГУРА! АТАКИ ОТБРОШЕНЫ!","#66ddff");
    _superState.screenShakeAmount = 22;
    _superState.screenFlashWhite = 5;
    if (c.spawnFloatingText) c.spawnFloatingText(hx,hy-20,"👊 ГУРА-ГУРА: УДАР В СТОРОНЫ!","#66ddff");
    if (c.playSound) c.playSound(95,"square",0.45,0.25);
}

function whitebeardSkillTsunami() {
    if ((!arenaActive && !isUniqueBossActive()) || !isWhitebeardMainActive()) return;
    if (typeof arenaPhase !== "undefined" && arenaPhase === "attack") {
        if (typeof showFloatingText === "function") showFloatingText("⚔️ СНАЧАЛА ЗАКОНЧИ АТАКУ!", "#ffdd00");
        return;
    }
    if (_superState.whitebeardSkillWindow <= 0 || _superState.whitebeardSkillMode !== "tsunami") return;
    if (_superState.whitebeardTsunamiUsed || _superState.whitebeardTsunamiPending > 0 || _superState.whitebeardSkillTsunamiActive) return;

    _superState.whitebeardTsunamiUsed = true;
    _superState.whitebeardTsunamiPending = 1.5;
    if (typeof showFloatingText === "function") showFloatingText("🌊 ЦУНАМИ ЗАРЯЖАЕТСЯ... 1.5с", "#66ddff");
    if (typeof playArenaSound === "function") playArenaSound(180, "sine", 0.4, 0.12);
}

function useWhitebeardSkill() {
    if ((!arenaActive && !isUniqueBossActive()) || !isWhitebeardMainActive()) return;
    if (typeof arenaPhase !== "undefined" && arenaPhase === "attack") {
        if (typeof showFloatingText === "function") showFloatingText("⚔️ СНАЧАЛА ЗАКОНЧИ АТАКУ!", "#ffdd00");
        return;
    }
    if (_superState.whitebeardSkillWindow > 0 && _superState.whitebeardSkillMode === "tsunami") {
        whitebeardSkillTsunami();
    } else {
        whitebeardSkillStrike();
    }
}

function updateWhitebeardSkill(dt) {
    var uniqueActive = isUniqueBossActive();
    if (!arenaActive && !uniqueActive) return;
    if (!isWhitebeardMainActive()) {
        _superState.whitebeardSkillWindow = 0;
        _superState.whitebeardSkillMode = "strike";
        _superState.whitebeardTsunamiUsed = false;
        _superState.whitebeardTsunamiPending = 0;
        _superState.whitebeardSkillTsunamiActive = false;
        return;
    }

    if (_superState.whitebeardSkillCooldown > 0)
        _superState.whitebeardSkillCooldown = Math.max(0, _superState.whitebeardSkillCooldown - dt);

    if (_superState.whitebeardSkillWindow > 0) {
        _superState.whitebeardSkillWindow = Math.max(0, _superState.whitebeardSkillWindow - dt);
        if (_superState.whitebeardSkillWindow <= 0) {
            _superState.whitebeardSkillMode = "strike";
            _superState.whitebeardTsunamiUsed = false;
            _superState.whitebeardTsunamiPending = 0;
        }
    }

    if (_superState.whitebeardTsunamiPending > 0) {
        _superState.whitebeardTsunamiPending = Math.max(0, _superState.whitebeardTsunamiPending - dt);
        if (_superState.whitebeardTsunamiPending <= 0) {
            _superState.whitebeardSkillTsunamiActive = true;
            _superState.whitebeardSkillTsunamiY = 540;
            _superState.whitebeardSkillTsunamiHitId++;
            if (typeof showFloatingText === "function") showFloatingText("🌊 ЦУНАМИ!!!", "#00ddff");
            _superState.screenShakeAmount = 12;
            if (typeof playArenaSound === "function") playArenaSound(420, "sine", 0.9, 0.18);
        }
    }

    if (_superState.whitebeardSkillTsunamiActive) {
        _superState.whitebeardSkillTsunamiY -= 125 * dt;
        var c = getBossContext();
        if (c) {
            var atk = c.getAttacks();
            var waveY = _superState.whitebeardSkillTsunamiY;
            for (var i = 0; i < atk.length; i++) {
                var a = atk[i];
                if (a._wbTsunamiHitId === _superState.whitebeardSkillTsunamiHitId) continue;
                var ay = (a.y || 0) + (a.size || a.radius || 20) / 2;
                if (Math.abs(ay - waveY) < 65) {
                    a._wbTsunamiHitId = _superState.whitebeardSkillTsunamiHitId;
                    if (a.spd !== undefined) a.spd *= 0.45;
                    if (a.spdY !== undefined) a.spdY *= 0.45;
                    if (a.vx !== undefined) a.vx *= 0.45;
                    if (a.vy !== undefined) a.vy *= 0.45;
                    var ax = (a.x || 0) + (a.size || a.radius || 20) / 2;
                    var dx = ax - 200;
                    var dy = ay - waveY;
                    var len = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (a.vy !== undefined) a.vy -= 3 + Math.random() * 2;
                    if (a.spdY !== undefined) a.spdY -= 3 + Math.random() * 2;
                    c.getParticles().push({x:ax,y:ay,vx:(Math.random()-.5)*6,vy:-2-Math.random()*4,life:24,maxLife:24,color:"#66ddff",size:3+Math.random()*3});
                }
            }
        }
        if (_superState.whitebeardSkillTsunamiY < -80) {
            _superState.whitebeardSkillTsunamiActive = false;
        }
    }

    updateWhitebeardSkillButton();
}

function updateWhitebeardSkillButton() {
    var btn = document.getElementById("whitebeardSkillBtn");
    if (!btn) return;
    var uniqueBoss = isUniqueBossActive();
    if ((!arenaActive && !uniqueBoss) || !isWhitebeardMainActive() || uniqueBoss === "rwb") {
        btn.style.display = "none";
        btn.disabled = false;
        return;
    }

    btn.style.display = "block";
    btn.style.width = "auto";
    btn.style.minWidth = "190px";
    btn.style.boxSizing = "border-box";
    btn.style.padding = "8px 18px";
    btn.style.fontSize = "14px";
    btn.style.whiteSpace = "nowrap";

    if (typeof arenaPhase !== "undefined" && arenaPhase === "attack") {
        btn.disabled = true;
        btn.textContent = "⚔️ ЗАКОНЧИ АТАКУ";
        btn.style.background = "#555";
        btn.style.animation = "none";
        return;
    }

    if (_superState.whitebeardTsunamiPending > 0) {
        btn.disabled = true;
        btn.textContent = "⏳ ЦУНАМИ (" + _superState.whitebeardTsunamiPending.toFixed(1) + "с)";
        btn.style.background = "#555";
        btn.style.animation = "none";
        return;
    }

    if (_superState.whitebeardSkillWindow > 0 && _superState.whitebeardSkillMode === "tsunami") {
        if (_superState.whitebeardTsunamiUsed) {
            btn.disabled = true;
            btn.textContent = "✅ ЦУНАМИ ЗАПУЩЕНО";
            btn.style.background = "linear-gradient(135deg,#0b5,#00aaff)";
            btn.style.animation = "none";
        } else {
            btn.disabled = false;
            btn.textContent = "🌊 БЕЛОУС: ЦУНАМИ (" + Math.ceil(_superState.whitebeardSkillWindow) + "с)";
            btn.style.background = "linear-gradient(135deg,#00ccff,#0066aa)";
            btn.style.animation = "superPulse 2s infinite";
        }
        return;
    }

    if (_superState.whitebeardSkillCooldown > 0) {
        btn.disabled = true;
        btn.textContent = "⏳ БЕЛОУС: УДАР (" + Math.ceil(_superState.whitebeardSkillCooldown) + "с)";
        btn.style.background = "#555";
        btn.style.animation = "none";
        return;
    }

    btn.disabled = false;
    btn.textContent = "💥 БЕЛОУС: УДАР";
    btn.style.background = "linear-gradient(135deg,#00ccff,#0066aa)";
    btn.style.animation = "superPulse 2s infinite";
}

window.isWhitebeardMainActive = isWhitebeardMainActive;

function toggleSuper() {
    var bossType = isUniqueBossActive();
    var isUnique = bossType !== null;
    var isArena = (typeof arenaActive !== 'undefined' && arenaActive);

    if (!isUnique && !isArena) return;
    // В фазе атаки нельзя нажимать SUPER: игрок должен закончить серию кликов.
    if (isArena && typeof arenaPhase !== "undefined" && arenaPhase === "attack") {
        if (typeof showFloatingText === "function") showFloatingText("⚔️ СНАЧАЛА ЗАКОНЧИ АТАКУ!", "#ffdd00");
        return;
    }

    var mainCard = getMainCard();
    if (isUnique && bossType === "rwb" && mainCard && mainCard.name === "Белоус") {
        try { useWhitebeardSkill(); } catch(e) {}
        updateSuperButton();
        return;
    }
    if (!mainCard) {
        if (typeof showFloatingText === 'function') showFloatingText("Нет главной карты!", "#ff3333");
        return;
    }

    if (isUnique) {
        if (typeof hasMasteryUniqueSuper === 'function' && !hasMasteryUniqueSuper(mainCard)) {
            if (typeof showFloatingText === 'function') showFloatingText("Нужно мастерство 6★ для уникального босса!", "#ff3333");
            return;
        }
    } else if (typeof hasMasterySuper === 'function' && !hasMasterySuper(mainCard)) {
        if (typeof showFloatingText === 'function') showFloatingText("Нужно мастерство 5★!", "#ff3333");
        return;
    }

    // DIO Over Heaven использует собственную энергию, а не обычные заряды SUPER.
    if (mainCard.name === "ДИО Over Heaven") {
        updateDioPanel();
        return;
    }

    if (isUnique) {
        if (getHeroCurrentCharges(mainCard.name) === null) {
            var limit = getEffectiveHeroChargeLimit(mainCard.name, bossType);
            setHeroCurrentCharges(mainCard.name, limit);
        }
        var heroCharges = getHeroCurrentCharges(mainCard.name);
        if (heroCharges <= 0) {
            var limit2 = getEffectiveHeroChargeLimit(mainCard.name, bossType);
            if (typeof showFloatingText === 'function') showFloatingText("❌ " + mainCard.name + ": заряды кончились (" + limit2 + "/" + limit2 + ")", "#ff3333");
            return;
        }
        if (window._uniqueSuperCharges <= 0) {
            if (typeof showFloatingText === 'function') showFloatingText("❌ Общие заряды кончились!", "#ff3333");
            return;
        }
    }

    var ab = superAbilities[mainCard.name];

    if (mainCard.name === "Всемогущий (прайм)" && _allmightHurricaneReady) {
        if (_allmightHurricaneCooldown > 0) {
            if (typeof showFloatingText === 'function') showFloatingText("⏳ Ураган: " + Math.ceil(_allmightHurricaneCooldown) + "с", "#ffaa00");
            return;
        }
        if (isUnique) {
            consumeHeroCharge(mainCard.name, bossType);
            window._uniqueSuperCharges--;
        }
        activateAllmightHurricane();
        updateSuperButton();
        return;
    }

    if (mainCard.name === "Деку (100%)") {
        if (!_superState.dekusActive) {
            if (isUnique) {
                consumeHeroCharge(mainCard.name, bossType);
                window._uniqueSuperCharges--;
            }
            var abDeku = superAbilities["Деку (100%)"];
            abDeku.onActivate();
            _activeSuperName = "Деку (100%)";
            updateSuperButton();
            return;
        } else {
            activateDekuEarthShatter();
            return;
        }
    }

    if (!ab) {
        if (typeof showFloatingText === 'function') showFloatingText("У этой карты нет SUPER!", "#ff3333");
        return;
    }

    if (ab.cooldown === 0 && !ab.toggleable) {
        if (typeof showFloatingText === 'function') showFloatingText("Пассивная способность — всегда активна!", "#ffaa00");
        return;
    }

    var cd = _superCooldowns[mainCard.name] || { ready: true };
    if (!cd.ready) {
        if (typeof showFloatingText === 'function') showFloatingText("SUPER на кулдауне!", "#ffaa00");
        return;
    }

    if (isUnique) {
        consumeHeroCharge(mainCard.name, bossType);
        window._uniqueSuperCharges--;
    }

    if (ab.toggleable) {
        if (_activeSuperName === mainCard.name) {
            if (ab.onDeactivate) ab.onDeactivate();
            _activeSuperName = null;
            startCooldown(mainCard.name, ab.cooldown);
        } else {
            if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) {
                superAbilities[_activeSuperName].onDeactivate();
            }
            ab.onActivate();
            _activeSuperName = mainCard.name;
        }
    } else {
        ab.onActivate();
        if (ab.duration > 0) {
            startCooldown(mainCard.name, ab.cooldown);
            setTimeout(function() {
                if (ab.onDeactivate) ab.onDeactivate();
                if (_activeSuperName === mainCard.name) _activeSuperName = null;
            }, ab.duration);
        } else {
            startCooldown(mainCard.name, ab.cooldown);
        }
    }
    updateSuperButton();
}

function startCooldown(cardName, ms) {
    var cd = _superCooldowns[cardName];
    if (cd && cd.interval) clearInterval(cd.interval);
    _superCooldowns[cardName] = { ready: false, remaining: ms, start: Date.now() };
    var interval = setInterval(function() {
        var elapsed = Date.now() - _superCooldowns[cardName].start;
        _superCooldowns[cardName].remaining = ms - elapsed;
        if (_superCooldowns[cardName].remaining <= 0) {
            clearInterval(interval);
            _superCooldowns[cardName].ready = true;
            updateSuperButton();
        } else updateSuperButton();
    }, 100);
    _superCooldowns[cardName].interval = interval;
}

function resetAllCooldowns() {
    for (var key in _superCooldowns) {
        if (_superCooldowns[key].interval) clearInterval(_superCooldowns[key].interval);
    }
    _superCooldowns = {};
    _allmightHurricaneReady = false;
    _allmightHurricaneCooldown = 0;
    _superState.dekuEarthShatterReady = false;
    _superState.dekuDashSmashReady = false;
    _superState.dekuEarthShatterCooldown = 0;
    _superState.dekuDashSmashCooldown = 0;
    _superState.whitebeardSkillCooldown = 0;
    _superState.whitebeardSkillWindow = 0;
    _superState.whitebeardSkillMode = "strike";
    _superState.whitebeardTsunamiUsed = false;
    _superState.whitebeardTsunamiPending = 0;
    _superState.whitebeardSkillTsunamiActive = false;
    _superState.whitebeardSkillTsunamiY = 540;
    updateSuperButton();
}

function updateSuperButton() {
    updateWhitebeardSkillButton();
    var btn = document.getElementById("superBtn");
    var btn2 = document.getElementById("superBtn2");
    var btnDeact = document.getElementById("superBtnDeactivate");
    if (!btn) return;

    var mainCard = getMainCard();
    var bossType = isUniqueBossActive();
    var isUnique = bossType !== null;
    var isArena = (typeof arenaActive !== 'undefined' && arenaActive);

    if (!isUnique && !isArena) {
        btn.style.display = "none";
        if (btn2) btn2.style.display = "none";
        if (btnDeact) btnDeact.style.display = "none";
        return;
    }

    if (isUnique && bossType === "rwb") {
        btn.style.display = "block";
        if (btn2) btn2.style.display = "none";
        if (btnDeact) btnDeact.style.display = "none";
        var wbBtnRwb = document.getElementById("whitebeardSkillBtn");
        if (wbBtnRwb) wbBtnRwb.style.display = "none";
        // Белоус не имеет отдельной записи superAbilities: его цепочка
        // УДАР -> ЦУНАМИ обслуживается той же оригинальной кнопкой SUPER.
        if (mainCard && mainCard.name === "Белоус") {
            var stWb = _superState;
            btn.disabled = false;
            if (stWb.whitebeardTsunamiPending > 0) {
                btn.textContent = "⏳ ЦУНАМИ (" + stWb.whitebeardTsunamiPending.toFixed(1) + "с)";
                btn.style.background = "#555";
                btn.style.animation = "none";
                btn.disabled = true;
            } else if (stWb.whitebeardSkillWindow > 0 && stWb.whitebeardSkillMode === "tsunami") {
                if (stWb.whitebeardTsunamiUsed) {
                    btn.textContent = "✅ ЦУНАМИ ЗАПУЩЕНО";
                    btn.style.background = "linear-gradient(135deg,#0b5,#00aaff)";
                    btn.style.animation = "none";
                    btn.disabled = true;
                } else {
                    btn.textContent = "🌊 SUPER: БЕЛОУС — ЦУНАМИ (" + Math.ceil(stWb.whitebeardSkillWindow) + "с)";
                    btn.style.background = "linear-gradient(135deg,#00ccff,#0066aa)";
                    btn.style.animation = "superPulse 2s infinite";
                }
            } else if (stWb.whitebeardSkillCooldown > 0) {
                btn.textContent = "⏳ SUPER: БЕЛОУС — УДАР (" + Math.ceil(stWb.whitebeardSkillCooldown) + "с)";
                btn.style.background = "#555";
                btn.style.animation = "none";
                btn.disabled = true;
            } else if (stWb.whitebeardSkillTsunamiActive) {
                btn.textContent = "🌊 SUPER: БЕЛОУС — ЦУНАМИ ИДЁТ";
                btn.style.background = "linear-gradient(135deg,#0b5,#00aaff)";
                btn.style.animation = "none";
                btn.disabled = true;
            } else {
                btn.textContent = "⚡ SUPER: БЕЛОУС";
                btn.style.background = "linear-gradient(135deg,#00ccff,#0066aa)";
                btn.style.animation = "superPulse 2s infinite";
            }
            return;
        }
        // Для остальных карт ниже работает обычный универсальный рендер
        // названия их настоящего SUPER.
    }

    if (!mainCard) {
        btn.style.display = "none";
        if (btn2) btn2.style.display = "none";
        if (btnDeact) btnDeact.style.display = "none";
        updateDioPanel();
        return;
    }

    if (mainCard.name === "ДИО Over Heaven") {
        btn.style.display = "none";
        if (btn2) btn2.style.display = "none";
        if (btnDeact) btnDeact.style.display = "none";
        var wbDio = document.getElementById("whitebeardSkillBtn");
        if (wbDio) wbDio.style.display = "none";
        updateDioPanel();
        return;
    }

    if (isUnique) {
        if (typeof hasMasteryUniqueSuper === 'function' && !hasMasteryUniqueSuper(mainCard)) {
            btn.style.display = "none";
            if (btn2) btn2.style.display = "none";
            if (btnDeact) btnDeact.style.display = "none";
            return;
        }
    } else if (typeof hasMasterySuper === 'function' && !hasMasterySuper(mainCard)) {
        btn.style.display = "none";
        if (btn2) btn2.style.display = "none";
        if (btnDeact) btnDeact.style.display = "none";
        return;
    }    if (isUnique) {
        btn.style.display = "block";
        if (btn2) btn2.style.display = "none";
        if (btnDeact) btnDeact.style.display = "none";

        var heroLimit = getEffectiveHeroChargeLimit(mainCard.name, bossType);
        var heroCurrent = getHeroCurrentCharges(mainCard.name);
        if (heroCurrent === null) {
            setHeroCurrentCharges(mainCard.name, heroLimit);
            heroCurrent = heroLimit;
        }

        var chargesText = "[" + heroCurrent + "/" + heroLimit + "]";

        if (mainCard.name === "Деку (100%)") {
            if (!_superState.dekusActive) {
                var cdDeku = _superCooldowns["Деку (100%)"];
                if (cdDeku && !cdDeku.ready) {
                    var secDeku = Math.ceil(cdDeku.remaining / 1000);
                    btn.textContent = "⏳ 100% (" + secDeku + "с) " + chargesText;
                    btn.style.background = "#555";
                    btn.style.animation = "none";
                } else {
                    btn.textContent = "💚 100% " + chargesText;
                    btn.style.background = "linear-gradient(135deg, #44ff44, #00aa00)";
                    btn.style.animation = "superPulse 2s infinite";
                }
            } else {
                btn.textContent = "💥 РАЗЛОМ";
                btn.style.background = "linear-gradient(135deg, #ff8800, #ff4400)";
                btn.style.animation = "superPulse 2s infinite";
                if (btn2) { btn2.style.display = "block"; btn2.textContent = "💨 РЫВОК"; btn2.style.background = "linear-gradient(135deg, #44ff44, #00ffff)"; btn2.style.animation = "superPulse 2s infinite"; }
                if (btnDeact) btnDeact.style.display = "block";
            }
            return;
        }

        if (mainCard.name === "Всемогущий (прайм)" && _allmightHurricaneReady) {
            if (_allmightHurricaneCooldown > 0) {
                btn.textContent = "🌪️ УРАГАН (" + Math.ceil(_allmightHurricaneCooldown) + "с) " + chargesText;
                btn.style.background = "#555";
                btn.style.animation = "none";
            } else {
                btn.textContent = "🌪️ УРАГАН " + chargesText;
                btn.style.background = "linear-gradient(135deg, #00ffff, #0088ff)";
                btn.style.animation = "superPulse 2s infinite";
            }
            return;
        }

        if (!superAbilities[mainCard.name]) { btn.style.display = "none"; return; }

        var abU = superAbilities[mainCard.name];
        if (abU.cooldown === 0 && !abU.toggleable) {
            btn.textContent = "⚡ " + abU.name + " (пассив)";
            btn.style.background = "#555";
            btn.style.animation = "none";
            return;
        }

        var cdU = _superCooldowns[mainCard.name];
        if (_activeSuperName === mainCard.name) {
            btn.textContent = "⏹ " + abU.name + " [АКТИВЕН]";
            btn.style.background = "#ff4444";
            btn.style.animation = "none";
        } else if (cdU && !cdU.ready) {
            var secU = Math.ceil(cdU.remaining / 1000);
            btn.textContent = "⏳ " + abU.name + " (" + secU + "с) " + chargesText;
            btn.style.background = "#555";
            btn.style.animation = "none";
        } else if (heroCurrent <= 0) {
            btn.textContent = "❌ ЗАРЯДЫ КОНЧИЛИСЬ " + chargesText;
            btn.style.background = "#333";
            btn.style.animation = "none";
            btn.disabled = true;
        } else {
            btn.textContent = "⚡ " + abU.name + " " + chargesText;
            btn.style.background = "linear-gradient(135deg, #f5af19, #f12711)";
            btn.style.animation = "superPulse 2s infinite";
            btn.disabled = false;
        }
        return;
    }

    if (mainCard.name === "Деку (100%)") {
        if (!_superState.dekusActive) {
            btn.style.display = "block";
            if (btn2) btn2.style.display = "none";
            if (btnDeact) btnDeact.style.display = "none";
            var cd = _superCooldowns["Деку (100%)"];
            if (cd && !cd.ready) {
                var sec = Math.ceil(cd.remaining / 1000);
                btn.textContent = "⏳ 100% (" + sec + "с)";
                btn.style.background = "#555";
                btn.style.animation = "none";
            } else {
                btn.textContent = "💚 100%";
                btn.style.background = "linear-gradient(135deg, #44ff44, #00aa00)";
                btn.style.animation = "superPulse 2s infinite";
            }
        } else {
            btn.style.display = "block";
            if (btn2) btn2.style.display = "block";
            if (btnDeact) btnDeact.style.display = "block";
            if (_superState.dekuEarthShatterCooldown > 0) {
                btn.textContent = "⏳ РАЗЛОМ (" + Math.ceil(_superState.dekuEarthShatterCooldown) + "с)";
                btn.style.background = "#555";
                btn.style.animation = "none";
            } else {
                btn.textContent = "💥 РАЗЛОМ";
                btn.style.background = "linear-gradient(135deg, #ff8800, #ff4400)";
                btn.style.animation = "superPulse 2s infinite";
            }
            if (btn2) {
                if (_superState.dekuDashSmashCooldown > 0) {
                    btn2.textContent = "⏳ РЫВОК (" + Math.ceil(_superState.dekuDashSmashCooldown) + "с)";
                    btn2.style.background = "#555";
                    btn2.style.animation = "none";
                } else {
                    btn2.textContent = "💨 РЫВОК";
                    btn2.style.background = "linear-gradient(135deg, #44ff44, #00ffff)";
                    btn2.style.animation = "superPulse 2s infinite";
                }
            }
        }
        return;
    }
    if (btn2) btn2.style.display = "none";
    if (btnDeact) btnDeact.style.display = "none";
    if (mainCard.name === "Всемогущий (прайм)" && _allmightHurricaneReady) {
        btn.style.display = "block";
        if (_allmightHurricaneCooldown > 0) {
            btn.textContent = "🌪️ УРАГАН (" + Math.ceil(_allmightHurricaneCooldown) + "с)";
            btn.style.background = "#555";
            btn.style.animation = "none";
        } else {
            btn.textContent = "🌪️ УРАГАН";
            btn.style.background = "linear-gradient(135deg, #00ffff, #0088ff)";
            btn.style.animation = "superPulse 2s infinite";
        }
        return;
    }
    if (!superAbilities[mainCard.name]) { btn.style.display = "none"; return; }
    var ab = superAbilities[mainCard.name];
    if (ab.cooldown === 0 && !ab.toggleable) { btn.style.display = "none"; return; }
    btn.style.display = "block";
    var cd = _superCooldowns[mainCard.name];
    if (_activeSuperName === mainCard.name) {
        btn.textContent = "⏹ " + ab.name + " (АКТИВЕН)";
        btn.style.background = "#ff4444";
        btn.style.animation = "none";
    } else if (cd && !cd.ready) {
        var sec = Math.ceil(cd.remaining / 1000);
        btn.textContent = "⏳ " + ab.name + " (" + sec + "с)";
        btn.style.background = "#555";
        btn.style.animation = "none";
    } else {
        btn.textContent = "⚡ " + ab.name;
        btn.style.background = "linear-gradient(135deg, #f5af19, #f12711)";
        btn.style.animation = "superPulse 2s infinite";
    }
}

function resetAllSupers() {
    var ctxB = getBossContext();
    if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) {
        superAbilities[_activeSuperName].onDeactivate();
    }
    _activeSuperName = null;

    if (ctxB) {
        if (_superState.nikaActive) {
            ctxB.setHeartHitbox(_superState.nikaHitboxOriginal);
            ctxB.setHeartSize(_superState.nikaSizeOriginal);
        }
        if (_superState.antispiralActive) {
            ctxB.setHeartHitbox(_superState.antispiralOrigHitbox);
            ctxB.setHeartSize(_superState.antispiralOrigSize);
        }
        if (_superState.antispiralActive && _superState.antispiralOrigSpeed) {
            ctxB.setHeartSpeed(_superState.antispiralOrigSpeed);
        }
    }

    _superState.dekusActive = false;
    _superState.dekusDmgMult = 1;
    _superState.dekusParticles = false;
    _superState.dekuEarthShatterReady = false;
    _superState.dekuDashSmashReady = false;
    _superState.dekuEarthShatterCooldown = 0;
    _superState.dekuDashSmashCooldown = 0;
    _superState.dekuSmashActive = false;
    _superState.dekuFists = [];
    _superState.dekuSmashBlackoutTimer = 0;
    _superState.dekuSmashSequenceTimer = 0;
    if (typeof restoreArenaTimer === 'function') restoreArenaTimer();
    _superState.borosHeal = null;
    _superState.borosParticles = false;
    _superState.usoppInvuln = false;
    _superState.usoppStunTimer = 0;
    _superState.nikaActive = false;
    _superState.nikaDmgMult = 1;
    _superState.positionHistory = [];
    _superState.garouMarker = null;
    _superState.garouInvulnTimer = 0;
    _superState.garouTimeStop = false;
    _superState.garpChargeTimer = 0;
    _superState.garpImpactActive = false;
    _superState.garpHakiActive = false;
    _superState.garpHakiTimer = 0;
    _superState.antispiralActive = false;
    _superState.antispiralShrinkAttacks = false;
    _superState.antispiralFrozen = false;
    _superState.imAuraActive = false;
    _superState.imSpeedPenalty = false;
    _superState.kaidoDrinking = false;
    _superState.kaidoBuffActive = false;
    _superState.kaidoDmgReduction = false;
    _superState.kaidoDmgBonus = 1;
    _superState.kaidoSpeedBonus = 1;
    _superState.invertControls = false;
    _superState.kaidoScream = false;
    _superState.allmightDmgMult = 1;
    _superState.allmightBuffTimer = 0;
    _superState.allmightShockwave = 0;
    _superState.allmightDebuffActive = false;
    _superState.allmightDebuffTimer = 0;
    _superState.allmightDebuffDmgMult = 1;
    _superState.allmightHurricane = false;
    _superState.allmightHurricaneTimer = 0;
    _superState.allmightHurricaneAngle = 0;
    _superState.markBuffActive = false;
    _superState.markBuffTimer = 0;
    _superState.markDmgReduction = 1;
    _superState.markDmgBonus = 1;
    _superState.markSpeedBonus = 1;
    _superState.dandyLightnings = false;
    _superState.dandyInvuln = false;
    _superState.dandyDmgBuff = null;
    _superState.dandyShield = null;
    _superState.dandyVulnerable = null;
    _superState.dandyDoubleTargets = false;
    _superState.dandyRoulette = null;
    _superState.dandyDarkness = 0;
    _superState.dandyAura = 0;
    _superState.dandyLava = 0;
    _superState.dandyAutoRevive = false;
    _superState.fists = [];
    _superState.rings = [];
    _superState.realityCracks = [];
    _superState.earthCracks = [];
    _superState.dekuExplosions = [];
    _superState.dekuDash = null;
    _superState.comicTexts = [];
    _superState.screenShakeAmount = 0;
    _superState.screenFlashWhite = 0;
    _allmightHurricaneReady = false;
    _allmightHurricaneCooldown = 0;
    // ★ БЕЛОУС ★
    _superState.whitebeardCharging = false;
    _superState.whitebeardChargeTimer = 0;
    _superState.whitebeardTimeStop = false;
    _superState.whitebeardTsunami = false;
    _superState.whitebeardTsunamiY = 0;
    _superState.whitebeardTsunamiTimer = 0;
    clearWhitebeardSkillState();
    var btnDeact = document.getElementById("superBtnDeactivate");
    if (btnDeact) btnDeact.style.display = "none";
    resetAllCooldowns();
}

function initSuperState() {
    var ctxB = getBossContext();
    var savedHeartSpeed = ctxB ? ctxB.getHeartSpeed() : 1.2;
    console.log("[SUPER] initSuperState: сохраняем heartSpeed = " + savedHeartSpeed.toFixed(2));

    _activeSuperName = null;
    resetAllSupers();

    if (ctxB) ctxB.setHeartSpeed(savedHeartSpeed);
    if (typeof window !== 'undefined') window._currentHeartSpeed = savedHeartSpeed;
    console.log("[SUPER] initSuperState: восстановили heartSpeed = " + savedHeartSpeed.toFixed(2));

    _superState.markResurrectCharges = 2;
    _superState.dioEnergy = 0;
    _superState.dioEnergyLastBossHp = null;
    _superState.dioEnergyBossType = null;
    _superState.dioTimeStop = 0;
    _superState.dioTeleportStop = 0;
    _superState.dioAggroTimer = 0;
    _superState.dioHistory = [];
    _superState.dioSkillCooldowns = { timeStop: 0, heal: 0, teleport: 0, aggro: 0 };
    _superLastTick = performance.now();
    updateSuperButton();
}


/* ============================================================
   SECRET HEART TEXTURES
   Только визуальный слой. НИКОГДА не меняет hitbox/physics.
   ============================================================ */
function getSecretHeartMainCardName() {
    try {
        if (typeof getMainCard === "function") {
            var c = getMainCard();
            if (c && c.name) return c.name;
        }
    } catch (e) {}
    try {
        if (typeof getRWBMainCard === "function") {
            var c2 = getRWBMainCard();
            if (c2 && c2.name) return c2.name;
        }
    } catch (e) {}
    return "";
}
window.getSecretHeartMainCardName = getSecretHeartMainCardName;

function drawSecretHeartTexture(targetCtx, x, y, size, cardName, options) {
    if (!targetCtx) return false;
    var n = cardName || getSecretHeartMainCardName();
    var known = {
        "Такаба":1, "Луффи: Ника, Бог Солнца":1, "Космический Гароу":1,
        "Сайтама":1, "Борос":1, "Бог Усопп":1, "Зено":1, "Анти-спираль":1,
        "Молодой Гарп":1, "Им (Правитель)":1, "Космический Дэнди":1, "Кайдо":1,
        "Император Марк":1, "Деку (100%)":1, "Всемогущий (прайм)":1, "Белоус":1, "ДИО Over Heaven":1
    };
    if (!known[n]) return false;

    var ctx0 = targetCtx;
    var s = Math.max(4, Number(size) || 11);
    var now = (typeof performance !== "undefined" ? performance.now() : Date.now());
    var pulse = 1 + Math.sin(now / 140) * 0.035;
    var rot = options && options.rotation ? options.rotation : 0;

    function heartPath(ctx, h) {
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.bezierCurveTo(-h * 1.35, -h * 0.15, -h * 0.72, -h * 1.08, 0, -h * 0.30);
        ctx.bezierCurveTo(h * 0.72, -h * 1.08, h * 1.35, -h * 0.15, 0, h * 0.72);
        ctx.closePath();
    }
    function fillHeart(ctx, h, fill, stroke, line, shadow) {
        ctx.fillStyle = fill;
        if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = h * 1.2; }
        heartPath(ctx, h); ctx.fill();
        ctx.shadowBlur = 0;
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line || 1.2; heartPath(ctx, h); ctx.stroke(); }
    }
    function dot(ctx, px, py, r, color) {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }

    ctx0.save();
    ctx0.translate(x, y);
    ctx0.rotate(rot);
    ctx0.scale(pulse, pulse);

    /* Общая аура — небольшая и не влияет на физический размер. */
    ctx0.shadowBlur = 0;

    if (n === "Такаба") {
        /* Красные края + жёлто-синее тело. */
        fillHeart(ctx0, s, "#f5d928", "#e53935", 2.2, "#ff3333");
        ctx0.save();
        ctx0.beginPath(); heartPath(ctx0, s); ctx0.clip();
        ctx0.fillStyle = "#287bd6"; ctx0.fillRect(-s * 1.5, -s * 1.5, s * 0.95, s * 3);
        ctx0.restore();
        ctx0.strokeStyle = "#e53935"; ctx0.lineWidth = Math.max(1.8, s * 0.18); heartPath(ctx0, s); ctx0.stroke();
        dot(ctx0, -s * 0.22, -s * 0.15, s * 0.11, "#ffffff");
        dot(ctx0, s * 0.22, -s * 0.15, s * 0.11, "#ffffff");
        ctx0.strokeStyle = "#e53935"; ctx0.lineWidth = 1.2;
        ctx0.beginPath(); ctx0.arc(0, s * 0.02, s * 0.24, 0, Math.PI); ctx0.stroke();
    } else if (n === "Луффи: Ника, Бог Солнца") {
        /* Ника: белый костюм + соломенная шляпа сверху. */
        fillHeart(ctx0, s, "#fffdf2", "#f0f0e0", 1.8, "#ffffff");
        ctx0.save();
        ctx0.fillStyle="#c99235"; ctx0.strokeStyle="#7d541d"; ctx0.lineWidth=Math.max(1,s*.10);
        ctx0.beginPath(); ctx0.ellipse(0,-s*.83,s*.72,s*.18,0,0,Math.PI*2); ctx0.fill(); ctx0.stroke();
        ctx0.fillStyle="#e43d32"; ctx0.fillRect(-s*.53,-s*.87,s*1.06,s*.10);
        ctx0.beginPath(); ctx0.ellipse(0,-s*.88,s*1.02,s*.20,0,0,Math.PI*2); ctx0.fill();
        ctx0.strokeStyle="#ffffff"; ctx0.lineWidth=s*.09;
        ctx0.beginPath(); ctx0.arc(0,s*.12,s*.30,0,Math.PI); ctx0.stroke();
        ctx0.restore();
    } else if (n === "Космический Гароу") {
        fillHeart(ctx0, s, "#171329", "#8f52ff", 1.6, "#9c4dff");
        ctx0.save(); ctx0.beginPath(); heartPath(ctx0,s); ctx0.clip();
        for (var g=0;g<13;g++) {
            var gx=Math.sin(g*91.7)*s*.85, gy=Math.cos(g*47.3)*s*.8;
            dot(ctx0,gx,gy,(g%3===0?1.2:.7),g%2?"#6fe7ff":"#ffffff");
        }
        ctx0.restore();
        ctx0.strokeStyle="#d88cff"; ctx0.lineWidth=1.1; ctx0.beginPath(); ctx0.arc(0,0,s*.58,0.2,Math.PI*1.55); ctx0.stroke();
    } else if (n === "Сайтама") {
        /* Сайтама: круглая лысая голова, жёлтый костюм и белый плащ.
           Плащ логично находится ЗА телом, а не выглядит второй головой. */
        ctx0.save();
        ctx0.fillStyle="#f8f8f8"; ctx0.strokeStyle="#cfcfcf"; ctx0.lineWidth=Math.max(1,s*.08);
        ctx0.beginPath();
        ctx0.moveTo(-s*.58,-s*.45);
        ctx0.quadraticCurveTo(-s*1.15,s*.05,-s*.78,s*.88);
        ctx0.quadraticCurveTo(-s*.38,s*1.15,0,s*1.04);
        ctx0.quadraticCurveTo(s*.38,s*1.15,s*.78,s*.88);
        ctx0.quadraticCurveTo(s*1.15,s*.05,s*.58,-s*.45);
        ctx0.closePath(); ctx0.fill(); ctx0.stroke();
        ctx0.restore();
        ctx0.save();
        ctx0.fillStyle="#f4c52b"; ctx0.strokeStyle="#d49e15"; ctx0.lineWidth=Math.max(1,s*.09);
        ctx0.beginPath(); ctx0.arc(0,-s*.02,s*.72,0,Math.PI*2); ctx0.fill(); ctx0.stroke();
        ctx0.fillStyle="#222";
        ctx0.fillRect(-s*.68,s*.42,s*1.36,s*.12);
        ctx0.fillStyle="#d9a51d"; ctx0.beginPath(); ctx0.arc(0,s*.48,s*.15,0,Math.PI*2); ctx0.fill();
        dot(ctx0,-s*.22,-s*.08,s*.045,"#222"); dot(ctx0,s*.22,-s*.08,s*.045,"#222");
        ctx0.restore();
    } else if (n === "Борос") {
        /* Борос: светлая/белая броня с характерными фиолетовыми прожилками. */
        fillHeart(ctx0,s,"#fbfbff","#8e63d8",1.8,"#c9a8ff");
        ctx0.save(); ctx0.beginPath(); heartPath(ctx0,s); ctx0.clip();
        ctx0.strokeStyle="#7040b8"; ctx0.lineWidth=Math.max(1.3,s*.105);
        ctx0.beginPath();
        ctx0.moveTo(-s*1.1,-s*.55); ctx0.quadraticCurveTo(-s*.45,-s*.05,0,-s*.42); ctx0.quadraticCurveTo(s*.45,-s*.05,s*1.1,-s*.55);
        ctx0.moveTo(-s*1.05,s*.42); ctx0.quadraticCurveTo(-s*.35,s*.02,0,s*.48); ctx0.quadraticCurveTo(s*.35,s*.02,s*1.05,s*.42);
        ctx0.stroke();
        ctx0.fillStyle="#a879e6"; ctx0.beginPath(); ctx0.arc(0,0,s*.18,0,Math.PI*2); ctx0.fill();
        ctx0.restore();
    } else if (n === "Бог Усопп") {
        /* Бог Усопп: яркий оранжевый костюм и ОЧЕНЬ заметный длинный нос. */
        fillHeart(ctx0,s,"#f28a25","#b94e15",1.8,"#ff9b38");
        ctx0.save(); ctx0.beginPath(); heartPath(ctx0,s); ctx0.clip();
        ctx0.fillStyle="#d96818"; ctx0.fillRect(-s*1.4,-s*.12,s*2.8,s*.18);
        ctx0.fillStyle="#f2bd91";
        ctx0.beginPath(); ctx0.arc(-s*.18,-s*.30,s*.30,0,Math.PI*2); ctx0.fill();
        ctx0.fillStyle="#f2bd91";
        ctx0.beginPath();
        ctx0.moveTo(-s*.02,-s*.30);
        ctx0.lineTo(s*.92,-s*.18);
        ctx0.lineTo(s*.18,-s*.02);
        ctx0.lineTo(-s*.02,-s*.30);
        ctx0.fill();
        ctx0.strokeStyle="#7b3e20"; ctx0.lineWidth=Math.max(1,s*.055);
        ctx0.stroke();
        ctx0.fillStyle="#5a2b1c";
        ctx0.beginPath(); ctx0.ellipse(-s*.38,-s*.62,s*.34,s*.16,0,0,Math.PI*2); ctx0.fill();
        ctx0.restore();
    } else if (n === "Молодой Гарп") {
        /* Молодой Гарп: белая форма + длинный сине-серый плащ + синие узоры. */
        ctx0.save();
        ctx0.fillStyle="#8faedb"; ctx0.strokeStyle="#456da8"; ctx0.lineWidth=Math.max(1,s*.07);
        ctx0.beginPath();
        ctx0.moveTo(-s*.58,-s*.60); ctx0.lineTo(-s*1.08,s*.92);
        ctx0.quadraticCurveTo(0,s*1.30,s*1.08,s*.92);
        ctx0.lineTo(s*.58,-s*.60); ctx0.closePath(); ctx0.fill(); ctx0.stroke();
        ctx0.restore();
        fillHeart(ctx0,s,"#fafafa","#456da8",1.8,"#91b7f0");
        ctx0.save(); ctx0.beginPath(); heartPath(ctx0,s); ctx0.clip();
        ctx0.strokeStyle="#24589e"; ctx0.lineWidth=Math.max(1,s*.075);
        ctx0.beginPath();
        ctx0.moveTo(-s*.8,-s*.35); ctx0.lineTo(s*.8,-s*.35);
        ctx0.moveTo(-s*.85,0); ctx0.lineTo(s*.85,0);
        ctx0.moveTo(-s*.7,s*.35); ctx0.lineTo(s*.7,s*.35);
        ctx0.stroke();
        ctx0.strokeStyle="#6d94cc"; ctx0.lineWidth=Math.max(1,s*.055);
        ctx0.beginPath(); ctx0.moveTo(-s*.5,-s*.62); ctx0.lineTo(0,-s*.08); ctx0.lineTo(s*.5,-s*.62); ctx0.stroke();
        ctx0.restore();
    } else if (n === "Космический Дэнди") {
        /* Космический Дэнди: минимум деталей — только фирменный огромный помпадур. */
        fillHeart(ctx0,s,"#e5a06c","#743b28",1.5,"#ff9b58");
        ctx0.save();
        ctx0.fillStyle="#df493d"; ctx0.strokeStyle="#7c211e"; ctx0.lineWidth=Math.max(1,s*.07);
        ctx0.beginPath();
        ctx0.moveTo(-s*.48,-s*.52);
        ctx0.bezierCurveTo(-s*.82,-s*1.28,-s*.18,-s*1.62,0,-s*.88);
        ctx0.bezierCurveTo(s*.22,-s*1.58,s*.82,-s*1.22,s*.48,-s*.50);
        ctx0.bezierCurveTo(s*.20,-s*.76,-s*.18,-s*.76,-s*.48,-s*.52);
        ctx0.closePath(); ctx0.fill(); ctx0.stroke();
        ctx0.restore();
        } else if (n === "Зено") {
        fillHeart(ctx0, s, "#7666e8", "#bfe9ff", 1.8, "#57dfff");
        ctx0.save(); ctx0.beginPath(); heartPath(ctx0,s); ctx0.clip();
        ctx0.fillStyle="#a9f1ff"; ctx0.globalAlpha=.35; ctx0.fillRect(-s*1.3,-s*1.3,s*.6,s*2.6); ctx0.globalAlpha=1; ctx0.restore();
        ctx0.strokeStyle="#dffaff"; ctx0.lineWidth=1; heartPath(ctx0,s); ctx0.stroke();
    } else if (n === "Анти-спираль") {
        fillHeart(ctx0, s, "#09090f", "#ff4fc8", 2, "#ff00a8");
        ctx0.strokeStyle="#7d36ff"; ctx0.lineWidth=Math.max(1,s*.12);
        ctx0.beginPath();
        for(var t=0;t<Math.PI*4.5;t+=.18){var rr2=s*.08+t*s*.045;var xx=Math.cos(t)*rr2, yy=Math.sin(t)*rr2; if(t===0)ctx0.moveTo(xx,yy);else ctx0.lineTo(xx,yy);}
        ctx0.stroke();
        dot(ctx0,0,0,s*.09,"#ffffff");
    } else if (n === "Молодой Гарп") {
        /* Молодой Гарп: белая форма, длинный плащ с холодно-синим оттенком и синие узоры. */
        ctx0.save();
        ctx0.fillStyle="#9bbcf2"; ctx0.strokeStyle="#4773bd"; ctx0.lineWidth=1.2;
        ctx0.beginPath(); ctx0.moveTo(-s*.55,-s*.55); ctx0.lineTo(-s*1.05,s*.95); ctx0.quadraticCurveTo(0,s*1.18,s*1.05,s*.95); ctx0.lineTo(s*.55,-s*.55); ctx0.closePath(); ctx0.fill(); ctx0.stroke();
        ctx0.restore();
        fillHeart(ctx0, s, "#f8f8f8", "#4773bd", 1.8, "#9dbfff");
        ctx0.save(); ctx0.beginPath(); heartPath(ctx0,s); ctx0.clip();
        ctx0.strokeStyle="#2457a6"; ctx0.lineWidth=s*.11;
        for(var gp=-1;gp<=1;gp++){ctx0.beginPath();ctx0.moveTo(-s*.85,gp*s*.34);ctx0.lineTo(s*.85,gp*s*.34);ctx0.stroke();}
        ctx0.strokeStyle="#6b94d8"; ctx0.lineWidth=s*.07;
        ctx0.beginPath();ctx0.moveTo(-s*.5,-s*.55);ctx0.lineTo(0,-s*.05);ctx0.lineTo(s*.5,-s*.55);ctx0.stroke();
        ctx0.restore();
    } else if (n === "Им (Правитель)") {
        fillHeart(ctx0, s, "#17131d", "#5f3a77", 1.8, "#5b008c");
        ctx0.fillStyle="#c41e3a"; ctx0.beginPath(); ctx0.arc(-s*.25,-s*.08,s*.11,0,Math.PI*2);ctx0.arc(s*.25,-s*.08,s*.11,0,Math.PI*2);ctx0.fill();
        ctx0.strokeStyle="#9b5cff";ctx0.lineWidth=1.2;ctx0.beginPath();ctx0.moveTo(-s*.55,-s*.62);ctx0.lineTo(0,-s*1.0);ctx0.lineTo(s*.55,-s*.62);ctx0.stroke();
    } else if (n === "Космический Дэнди") {
        /* Space Dandy: главное — фирменная высокая pompadour-прическа. */
        fillHeart(ctx0, s, "#e8a06a", "#7a3d27", 1.6, "#ff9b55");
        ctx0.save();
        ctx0.fillStyle="#e54a3c"; ctx0.strokeStyle="#7d201d"; ctx0.lineWidth=Math.max(1,s*.08);
        ctx0.beginPath(); ctx0.moveTo(-s*.55,-s*.55);
        ctx0.bezierCurveTo(-s*.75,-s*1.2,-s*.2,-s*1.5,0,-s*.88);
        ctx0.bezierCurveTo(s*.18,-s*1.58,s*.82,-s*1.22,s*.55,-s*.48);
        ctx0.bezierCurveTo(s*.38,-s*.78,-s*.2,-s*.82,-s*.55,-s*.55);
        ctx0.closePath(); ctx0.fill(); ctx0.stroke();
        ctx0.restore();
    } else if (n === "Кайдо") {
        fillHeart(ctx0, s, "#3569b8", "#b98bff", 1.8, "#315cff");
        ctx0.save();ctx0.beginPath();heartPath(ctx0,s);ctx0.clip();
        ctx0.strokeStyle="rgba(180,220,255,.7)";ctx0.lineWidth=1;
        for(var ky=-1;ky<=1;ky++)for(var kx=-1;kx<=1;kx++){ctx0.beginPath();ctx0.arc(kx*s*.42,ky*s*.35,s*.18,0,Math.PI);ctx0.stroke();}
        ctx0.restore();
        ctx0.strokeStyle="#eee";ctx0.lineWidth=s*.13;ctx0.beginPath();ctx0.moveTo(-s*.52,-s*.55);ctx0.lineTo(-s*.78,-s*1.0);ctx0.moveTo(s*.52,-s*.55);ctx0.lineTo(s*.78,-s*1.0);ctx0.stroke();
    } else if (n === "Император Марк") {
        fillHeart(ctx0, s, "#e6383b", "#4b79d8", 1.8, "#ff4c4c");
        ctx0.save();ctx0.beginPath();heartPath(ctx0,s);ctx0.clip();ctx0.fillStyle="#173f96";ctx0.fillRect(-s*1.4,-s*.3,s*2.8,s*.65);ctx0.restore();
        ctx0.strokeStyle="#ffffff";ctx0.lineWidth=s*.09;ctx0.beginPath();ctx0.moveTo(0,-s*.8);ctx0.lineTo(0,s*.58);ctx0.stroke();
    } else if (n === "Деку (100%)") {
        /* Деку 100%: зелёное основное сердце + маленькое серое сердце
           ПОВЕРХ него. Малое = 1/1.5 от основного. */
        fillHeart(ctx0,s,"#29a84a","#63ff7b",1.8,"#28ff58");
        ctx0.save();
        ctx0.translate(0,-s*.03);
        ctx0.globalAlpha=.82;
        fillHeart(ctx0,s/1.5,"#858b91","#c8ccd0",1.1,"#777");
        ctx0.restore();
        ctx0.save(); ctx0.beginPath(); heartPath(ctx0,s); ctx0.clip();
        ctx0.strokeStyle="#baffc4"; ctx0.lineWidth=Math.max(1,s*.09);
        for(var dl=0;dl<7;dl++){var da=dl*.91+.2;ctx0.beginPath();ctx0.moveTo(Math.cos(da)*s*.05,Math.sin(da)*s*.05);ctx0.lineTo(Math.cos(da)*s*.9,Math.sin(da)*s*.9);ctx0.stroke();}
        ctx0.restore();
        } else if (n === "Всемогущий (прайм)") {
        fillHeart(ctx0, s, "#2b58c9", "#ffd42a", 2, "#ffe45c");
        ctx0.save();ctx0.beginPath();heartPath(ctx0,s);ctx0.clip();
        ctx0.fillStyle="#c92232";ctx0.fillRect(-s*1.4,s*.08,s*2.8,s*.35);
        ctx0.fillStyle="#ffd42a";ctx0.beginPath();ctx0.moveTo(0,-s*.55);ctx0.lineTo(s*.18,-s*.1);ctx0.lineTo(s*.55,-s*.1);ctx0.lineTo(s*.25,s*.15);ctx0.lineTo(s*.35,s*.55);ctx0.lineTo(0,s*.3);ctx0.lineTo(-s*.35,s*.55);ctx0.lineTo(-s*.25,s*.15);ctx0.lineTo(-s*.55,-s*.1);ctx0.lineTo(-s*.18,-s*.1);ctx0.closePath();ctx0.fill();
        ctx0.restore();
    } else if (n === "ДИО Over Heaven") {
        /* DIO OH: бело-золотой TWOH, корона и фиолетовая аура. */
        ctx0.save();
        ctx0.shadowColor="#d8c8ff"; ctx0.shadowBlur=s*2.4;
        fillHeart(ctx0,s,"#f7f7ff","#d9c36a",1.8,"#b89cff");
        ctx0.fillStyle="#e4c95f"; ctx0.strokeStyle="#fff0a0"; ctx0.lineWidth=Math.max(1,s*.10);
        ctx0.beginPath();
        ctx0.moveTo(-s*.72,-s*.78); ctx0.lineTo(-s*.45,-s*1.18); ctx0.lineTo(0,-s*.82);
        ctx0.lineTo(s*.45,-s*1.18); ctx0.lineTo(s*.72,-s*.78); ctx0.closePath(); ctx0.fill(); ctx0.stroke();
        ctx0.fillStyle="#7b4dba";
        ctx0.beginPath();ctx0.arc(-s*.30,-s*.05,s*.13,0,Math.PI*2);ctx0.fill();
        ctx0.beginPath();ctx0.arc(s*.30,-s*.05,s*.13,0,Math.PI*2);ctx0.fill();
        ctx0.strokeStyle="#e4c95f";ctx0.lineWidth=s*.09;
        ctx0.beginPath();ctx0.moveTo(-s*.42,s*.28);ctx0.quadraticCurveTo(0,s*.55,s*.42,s*.28);ctx0.stroke();
        ctx0.restore();
    } else if (n === "Белоус") {
        /* Белая капитанская шапка за сердцем + красная лента + усы. */
        ctx0.save();
        ctx0.fillStyle="#f8f8f8";ctx0.strokeStyle="#cfcfcf";ctx0.lineWidth=1.2;
        ctx0.beginPath();ctx0.ellipse(0,-s*.88,s*1.05,s*.30,0,0,Math.PI*2);ctx0.fill();ctx0.stroke();
        ctx0.fillStyle="#d43b3b";ctx0.fillRect(-s*.55,-s*.98,s*1.1,s*.13);
        ctx0.restore();
        fillHeart(ctx0,s,"#fffdf7","#d7d7d7",1.6,"#ffffff");
        ctx0.strokeStyle="#222";ctx0.lineWidth=Math.max(1,s*.12);
        ctx0.beginPath();ctx0.moveTo(-s*.05,s*.02);ctx0.quadraticCurveTo(-s*.42,-s*.2,-s*.65,-s*.05);ctx0.moveTo(s*.05,s*.02);ctx0.quadraticCurveTo(s*.42,-s*.2,s*.65,-s*.05);ctx0.stroke();
        ctx0.strokeStyle="#b82e35";ctx0.lineWidth=s*.08;ctx0.beginPath();ctx0.moveTo(-s*.75,s*.58);ctx0.lineTo(s*.75,s*.58);ctx0.stroke();
    }

    ctx0.restore();
    return true;
}
window.drawSecretHeartTexture = drawSecretHeartTexture;

function tickSupers() {
    var ctxB = getBossContext();
    if (!ctxB) return;
    if (!ctx) return;

    var now = performance.now();
    var dt = (now - _superLastTick) / 1000;
    if (dt <= 0) dt = 0.016;
    if (dt > 0.1) dt = 0.1;
    _superLastTick = now;

    // ★ DIO OVER HEAVEN: энергия, кулдауны, время, история позиции.
    updateDioSkillCooldowns(dt);
    updateDioHistory(ctxB);
    dioTrackBossDamage(ctxB);
    updateDioAggressiveBlocks(ctxB);
    updateDioStandZone(ctxB);
    updateDioPanel();

    // ★ БЕЛОУС: реген + активки
    tickWhitebeardRegen(dt);
    updateWhitebeardSkill(dt);

    if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onTick) superAbilities[_activeSuperName].onTick(dt);
    if (_superState.borosHeal && _superState.borosHeal.active && superAbilities["Борос"] && superAbilities["Борос"].onTick) superAbilities["Борос"].onTick(dt);

    if (_superState.dekusActive && _superState.dekuEarthShatterCooldown > 0) {
        _superState.dekuEarthShatterCooldown -= dt;
        if (_superState.dekuEarthShatterCooldown <= 0) { _superState.dekuEarthShatterCooldown = 0; _superState.dekuEarthShatterReady = true; updateSuperButton(); }
        else updateSuperButton();
    }
    if (_superState.dekusActive && _superState.dekuDashSmashCooldown > 0) {
        _superState.dekuDashSmashCooldown -= dt;
        if (_superState.dekuDashSmashCooldown <= 0) { _superState.dekuDashSmashCooldown = 0; _superState.dekuDashSmashReady = true; updateSuperButton(); }
        else updateSuperButton();
    }
    if (_superState.dekuDash) {
        _superState.dekuDash.life -= dt;
        if (_superState.dekuDash.life <= 0) { _superState.dekuDash = null; }
        else {
            var speed = _superState.dekuDash.distance / 0.4;
            var moveX = _superState.dekuDash.dirX * speed * dt;
            var moveY = _superState.dekuDash.dirY * speed * dt;
            ctxB.setHeartX(ctxB.getHeartX() + moveX);
            ctxB.setHeartY(ctxB.getHeartY() + moveY);
            _superState.dekuDash.trail.push({ x: ctxB.getHeartX(), y: ctxB.getHeartY(), life: 0.3 });
            ctxB.clampHeart();
            var dashWidth = 60;
            var atk = ctxB.getAttacks();
            for (var i = atk.length - 1; i >= 0; i--) {
                var a = atk[i];
                var ax = a.x + (a.size || a.radius || 20) / 2;
                var ay = a.y + (a.size || a.radius || 20) / 2;
                var dist = Math.sqrt((ax - ctxB.getHeartX())*(ax - ctxB.getHeartX()) + (ay - ctxB.getHeartY())*(ay - ctxB.getHeartY()));
                if (dist < dashWidth) {
                    atk.splice(i, 1);
                    ctxB.getParticles().push({ x: ax, y: ay, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 20, maxLife: 20, color: "#44ff44", size: 3 });
                }
            }
        }
    }
    for (var i = _superState.dekuExplosions.length - 1; i >= 0; i--) {
        _superState.dekuExplosions[i].life -= dt;
        if (_superState.dekuExplosions[i].life <= 0) _superState.dekuExplosions.splice(i, 1);
    }
    if (_allmightHurricaneReady && _allmightHurricaneCooldown > 0) {
        _allmightHurricaneCooldown -= dt;
        if (_allmightHurricaneCooldown < 0) _allmightHurricaneCooldown = 0;
        updateSuperButton();
    }

    if (_superState.dekuSmashActive) {
        if (_superState.dekuSmashBlackoutTimer > 0) { _superState.dekuSmashBlackoutTimer--; }
        if (_superState.dekuSmashSequenceTimer > 0) {
            _superState.dekuSmashSequenceTimer--;
            for (var i = 0; i < _superState.dekuFists.length; i++) {
                var fist = _superState.dekuFists[i];
                if (!fist.active && _superState.dekuSmashSequenceTimer <= (150 - fist.delay)) {
                    fist.active = true;
                    var atk2 = ctxB.getAttacks();
                    for (var j = atk2.length - 1; j >= 0; j--) {
                        var a2 = atk2[j];
                        var dx2 = a2.x - fist.x;
                        var dy2 = a2.y - fist.y;
                        if (Math.sqrt(dx2*dx2 + dy2*dy2) < fist.radius + 35) {
                            atk2.splice(j, 1);
                            for (var k = 0; k < 6; k++) {
                                ctxB.getParticles().push({ x: a2.x, y: a2.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 30, maxLife: 30, color: "#50c878", size: 4+Math.random()*4 });
                            }
                        }
                    }
                    _superState.screenShakeAmount = Math.max(_superState.screenShakeAmount, 20);
                }
            }
        }
        if (_superState.dekuSmashSequenceTimer <= 0 && _superState.dekuSmashBlackoutTimer <= 0) {
            _superState.dekuSmashActive = false;
            _superState.dekuFists = [];
            ctxB.setHeartSpeed(_superState.originalHeartSpeed);
            if (typeof arenaGlobalSpeedMod !== 'undefined') arenaGlobalSpeedMod = _superState.originalGlobalSpeedMod;
            if (typeof restoreArenaTimer === 'function') restoreArenaTimer();
        }
    }

    updateSuperLogic(dt);
    updateSuperButton();
}

function updateSuperLogic(dt) {
    var ctxB = getBossContext();
    if (!ctxB) return;
    var mainCard = getMainCard();
    if (_superState.screenShakeAmount > 0) { _superState.screenShakeAmount *= 0.88; if (_superState.screenShakeAmount < 0.15) _superState.screenShakeAmount = 0; }
    if (_superState.screenFlashWhite > 0) _superState.screenFlashWhite -= dt * 25;
    for (var i = _superState.rings.length - 1; i >= 0; i--) {
        var r = _superState.rings[i];
        r.radius += r.speed * dt;
        r.life -= dt;
        if (r.life <= 0) _superState.rings.splice(i, 1);
    }
    for (var i = _superState.realityCracks.length - 1; i >= 0; i--) {
        _superState.realityCracks[i].life -= dt;
        if (_superState.realityCracks[i].life <= 0) _superState.realityCracks.splice(i, 1);
    }
    for (var i = _superState.earthCracks.length - 1; i >= 0; i--) {
        _superState.earthCracks[i].life -= dt;
        if (_superState.earthCracks[i].life <= 0) _superState.earthCracks.splice(i, 1);
    }
    if (_superState.dekuDash && _superState.dekuDash.trail) {
        for (var i = _superState.dekuDash.trail.length - 1; i >= 0; i--) {
            _superState.dekuDash.trail[i].life -= dt;
            if (_superState.dekuDash.trail[i].life <= 0) _superState.dekuDash.trail.splice(i, 1);
        }
    }
    for (var i = _superState.comicTexts.length - 1; i >= 0; i--) {
        _superState.comicTexts[i].alpha -= dt * 0.8;
        _superState.comicTexts[i].y -= dt * 10;
        if (_superState.comicTexts[i].alpha <= 0) _superState.comicTexts.splice(i, 1);
    }
    if (_superState.allmightHurricane) {
        _superState.allmightHurricaneTimer -= dt;
        _superState.allmightHurricaneAngle += dt * 25;
        if (_superState.allmightHurricaneTimer <= 0) _superState.allmightHurricane = false;
    }
    if (_superState.garpChargeTimer > 0) {
        _superState.garpChargeTimer -= dt;
        if (_superState.garpChargeTimer <= 0) {
            _superState.garpChargeTimer = 0;
            ctxB.setHeartSpeed(_superState.originalHeartSpeed || 1.2);
            _superState.garpImpactActive = true;
            _superState.garpImpactRadius = 0;
            _superState.garpImpactX = ctxB.getHeartX();
            _superState.garpImpactY = ctxB.getHeartY();
            var bossMaxHp = ctxB.getBossMaxHp();
            ctxB.setBossMaxHp(Math.floor(bossMaxHp * 0.90));
            _superState.screenShakeAmount = 45;
            _superState.screenFlashWhite = 15;
            ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "ГАЛАКТИЧЕСКИЙ УДАР!!!", "#8844ff");
            if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
            _superState.garpHakiActive = true;
            _superState.garpHakiTimer = 9.0;
            var curSpd = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd * 1.25);
            ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "ХАКИ!", "#ff4444");
        }
    }
    if (_superState.garpImpactActive) {
        _superState.garpImpactRadius += dt * 700;
        if (_superState.garpImpactRadius > 250) _superState.garpImpactActive = false;
        var atk3 = ctxB.getAttacks();
        for (var j = atk3.length - 1; j >= 0; j--) {
            var a = atk3[j];
            var ax = a.x + (a.size || a.radius || 20) / 2;
            var ay = a.y + (a.size || a.radius || 20) / 2;
            if (Math.hypot(ax - _superState.garpImpactX, ay - _superState.garpImpactY) < _superState.garpImpactRadius) {
                atk3.splice(j, 1);
                ctxB.getParticles().push({ x: ax, y: ay, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 25, maxLife: 25, color: "#8844ff", size: 4 });
            }
        }
    }
    if (_superState.garpHakiActive) {
        _superState.garpHakiTimer -= dt;
        if (_superState.garpHakiTimer <= 0) {
            _superState.garpHakiActive = false;
            var curSpd = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curSpd / 1.25);
        }
    }
    if (_superState.allmightDebuffActive) {
        _superState.allmightDebuffTimer -= dt;
        if (_superState.allmightDebuffTimer <= 0) _superState.allmightDebuffActive = false;
    }
    if (_superState.markBuffActive) {
        _superState.markBuffTimer -= dt;
        if (_superState.markBuffTimer <= 0) {
            _superState.markBuffActive = false;
            var curS = ctxB.getHeartSpeed();
            ctxB.setHeartSpeed(curS / _superState.markSpeedBonus);
            _superState.markDmgReduction = 1;
            _superState.markDmgBonus = 1;
            _superState.markSpeedBonus = 1;
        }
    }
    if (mainCard && mainCard.name === "Космический Гароу") {
        var now = performance.now();
        _superState.positionHistory.push({ time: now, x: ctxB.getHeartX(), y: ctxB.getHeartY() });
        while (_superState.positionHistory.length > 0 && now - _superState.positionHistory[0].time > 5000) _superState.positionHistory.shift();
    }
    if (_superState.usoppStunTimer > 0) {
        _superState.usoppStunTimer -= dt;
        if (_superState.usoppStunTimer < 0) _superState.usoppStunTimer = 0;
    }
    if (_superState.garouInvulnTimer > 0) {
        _superState.garouInvulnTimer -= dt;
        if (_superState.garouInvulnTimer < 0) _superState.garouInvulnTimer = 0;
    }
    if (_superState.allmightBuffTimer > 0) {
        _superState.allmightBuffTimer -= dt;
        if (_superState.allmightBuffTimer < 0) _superState.allmightBuffTimer = 0;
    }
    if (_superState.allmightShockwave > 0) _superState.allmightShockwave -= dt;
    if (_superState.dandyDmgBuff) { _superState.dandyDmgBuff.timer -= dt; if (_superState.dandyDmgBuff.timer <= 0) _superState.dandyDmgBuff = null; }
    if (_superState.dandyShield) { _superState.dandyShield.timer -= dt; if (_superState.dandyShield.timer <= 0) _superState.dandyShield = null; }
    if (_superState.dandyVulnerable) { _superState.dandyVulnerable.timer -= dt; if (_superState.dandyVulnerable.timer <= 0) _superState.dandyVulnerable = null; }
    if (_superState.dandyDarkness > 0) { _superState.dandyDarkness -= dt; if (_superState.dandyDarkness < 0) _superState.dandyDarkness = 0; }
    if (_superState.dandyAura > 0) { _superState.dandyAura -= dt; if (_superState.dandyAura < 0) _superState.dandyAura = 0; }
    if (_superState.dandyLava > 0) { _superState.dandyLava -= dt; if (_superState.dandyLava < 0) _superState.dandyLava = 0; }
    if (_superState.garouMarker) { var elapsed = (performance.now() - _superState.garouMarker.time) / 1000; if (elapsed > 1.5) _superState.garouMarker = null; else _superState.garouMarker.alpha = 1 - elapsed / 1.5; }
    if (_superState.dekusParticles) {
        if (Math.random() < 0.2) {
            for (var i = 0; i < 3; i++) {
                var angle = Math.random() * Math.PI * 2;
                var dist = 20 + Math.random() * 30;
                ctxB.getParticles().push({ x: ctxB.getHeartX() + Math.cos(angle) * 5, y: ctxB.getHeartY() + Math.sin(angle) * 5, endX: ctxB.getHeartX() + Math.cos(angle) * dist, endY: ctxB.getHeartY() + Math.sin(angle) * dist, vx: 0, vy: 0, life: 18, maxLife: 18, color: "#000000", innerColor: "#50c878", isLightning: true, width: 4 });
            }
        }
    }
    if (_superState.borosParticles) {
        for (var i = 0; i < 3; i++) ctxB.getParticles().push({ x: ctxB.getHeartX() + (Math.random() - 0.5) * 50, y: ctxB.getHeartY() + (Math.random() - 0.5) * 50, vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 3, life: 35, maxLife: 35, color: "#66ff66", size: 3 + Math.random() * 5 });
    }
    if (_superState.dandyLightnings) {
        for (var i = 0; i < 4; i++) {
            var angle = Math.random() * Math.PI * 2;
            var dist = 25 + Math.random() * 40;
            ctxB.getParticles().push({ x: ctxB.getHeartX() + Math.cos(angle) * 10, y: ctxB.getHeartY() + Math.sin(angle) * 10, endX: ctxB.getHeartX() + Math.cos(angle) * dist, endY: ctxB.getHeartY() + Math.sin(angle) * dist, vx: 0, vy: 0, life: 20, maxLife: 20, color: "#ffff00", isLightning: true });
        }
    }
    if (_superState.allmightBuffTimer > 0) {
        _superState.allmightShockwave += dt;
        if (_superState.allmightShockwave >= 1.0) {
            _superState.allmightShockwave -= 1.0;
            _superState.rings.push({ x: ctxB.getHeartX(), y: ctxB.getHeartY(), radius: 10, color: "rgba(255, 215, 0, 0.8)", speed: 15, life: 25, maxLife: 25, width: 4 });
            var atk4 = ctxB.getAttacks();
            for (var a of atk4) {
                var dx = (a.x + (a.size || 20) / 2) - ctxB.getHeartX();
                var dy = (a.y + (a.size || 20) / 2) - ctxB.getHeartY();
                var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                if (a.spd !== undefined) a.spd += (dx / dist) * 3;
                if (a.spdY !== undefined) a.spdY += (dy / dist) * 3;
                if (a.vx !== undefined) a.vx += (dx / dist) * 3;
                if (a.vy !== undefined) a.vy += (dy / dist) * 3;
            }
        }
    }
    for (var i = _superState.fists.length - 1; i >= 0; i--) {
        var f = _superState.fists[i];
        f.x += f.vx;
        f.y += f.vy;
        f.life--;
        if (f.life % 3 === 0 && f.life > 0) ctxB.getParticles().push({ x: f.x + (Math.random() - 0.5) * f.size, y: f.y + (Math.random() - 0.5) * f.size, vx: 0, vy: 0, life: 15, maxLife: 15, color: "#ff4444", size: 5 + Math.random() * 5 });
        var pathWidth = f.pathWidth || 120;
        var atk5 = ctxB.getAttacks();
        for (var j = atk5.length - 1; j >= 0; j--) {
            var a = atk5[j];
            var ax = a.x + (a.size || a.radius || 20) / 2;
            var ay = a.y + (a.size || a.radius || 20) / 2;
            if (Math.abs(ax - f.x) < pathWidth / 2 && Math.abs(ay - f.y) < f.size + 20) {
                _superState.screenShakeAmount = Math.max(_superState.screenShakeAmount, 10);
                addShockwaveRing(ax, ay, "#ffaa00", 200, 0.3, 2);
                for (var p = 0; p < 20; p++) ctxB.getParticles().push({ x: ax, y: ay, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: 25, maxLife: 25, color: "#ffaa00", size: 2 + Math.random() * 6 });
                atk5.splice(j, 1);
                if (typeof sfxBounce === 'function') sfxBounce();
            }
        }
        if (f.willOneshot && !f.oneshotChecked && ctxB.getBossMaxHp() > 0) {
            f.oneshotChecked = true;
            ctxB.setBossMaxHp(0);
            _superState.screenFlashWhite = 20;
            _superState.screenShakeAmount = 50;
            for (var p = 0; p < 100; p++) ctxB.getParticles().push({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 40, maxLife: 40, color: "#ffffff", size: 3 + Math.random() * 8 });
            if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
            if (typeof winArena === 'function' && ctxB.type === 'arena') winArena();
            _superState.fists.splice(i, 1);
            break;
        }
        if (f.life <= 0 || f.y < -150 || f.y > 650 || f.x < -50 || f.x > 450) _superState.fists.splice(i, 1);
    }

    // ★ БЕЛОУС: анимация цунами ★
    if (_superState.whitebeardTsunami) {
        _superState.whitebeardTsunamiY -= 8;
        
        var ctxBTsunami = getBossContext();
        if (ctxBTsunami) {
            var atkTsunami = ctxBTsunami.getAttacks();
            for (var i = atkTsunami.length - 1; i >= 0; i--) {
                var aT = atkTsunami[i];
                if (Math.abs((aT.y || 0) - _superState.whitebeardTsunamiY) < 80) {
                    ctxBTsunami.getParticles().push({
                        x: aT.x, y: aT.y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 20, maxLife: 20,
                        color: "#00ccff", size: 4
                    });
                    atkTsunami.splice(i, 1);
                }
            }
        }
        
        if (_superState.whitebeardTsunamiY < -60) {
            _superState.whitebeardTsunami = false;
        }
    }
}

function renderSuperVisuals() {
    if (!ctx) return;
    var ctxB = getBossContext();
    if (!ctxB) return;
    var hx = ctxB.getHeartX();
    var hy = ctxB.getHeartY();
    var hSize = ctxB.getHeartSize();

    renderDioVisuals(ctxB);

    // ★ ТАКАБА: дополнительные визуалы для уникальных боссов.
    if (ctxB.type !== "arena" && _superState.takabaRandomEventTimer > 0) {
        ctx.save();
        if (_superState.takabaBgColor) {
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = _superState.takabaBgColor;
            ctx.fillRect(0, 0, 400, 500);
        }
        var ta = ctxB.getAttacks ? ctxB.getAttacks() : [];
        if (_superState.takabaBallMode) {
            ctx.font = "16px sans-serif";
            ctx.textAlign = "center";
            for (var ti = 0; ti < Math.min(18, ta.length); ti++) {
                var tv = ta[ti];
                ctx.fillText("🎈", (tv.x || 0) + ((tv.size || tv.radius || 16) / 2), (tv.y || 0) + 6);
            }
        }
        if (_superState.takabaLaughText) {
            ctx.font = "bold 14px monospace";
            ctx.fillStyle = "#ff66ff";
            for (var li = 0; li < 5; li++) {
                ctx.globalAlpha = 0.25 + 0.15 * Math.sin(performance.now() / 120 + li);
                ctx.fillText("ХА-ХА-ХА", 55 + li * 75, 55 + Math.sin(performance.now() / 180 + li) * 18);
            }
        }
        if (_superState.takabaJokeActive && _superState.takabaCurrentJoke) {
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = "rgba(255,102,255,0.94)";
            ctx.fillRect(35, 205, 330, 90);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.strokeRect(35, 205, 330, 90);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            var words = String(_superState.takabaCurrentJoke).split(" ");
            var line = "", lines = [];
            for (var wi = 0; wi < words.length; wi++) {
                var test = line ? line + " " + words[wi] : words[wi];
                if (test.length > 42) { lines.push(line); line = words[wi]; } else line = test;
            }
            if (line) lines.push(line);
            ctx.fillText("🎭 ТАКАБА", 200, 228);
            for (var wli = 0; wli < Math.min(4, lines.length); wli++) ctx.fillText(lines[wli], 200, 250 + wli * 16);
        }
        ctx.restore();
    }

    if (_superState.realityCracks.length > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 255, 255, 0.9)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 10;
        _superState.realityCracks.forEach(function(cr) {
            ctx.globalAlpha = cr.life;
            ctx.beginPath();
            ctx.moveTo(cr.x1, cr.y1);
            var cx = cr.x1, cy = cr.y1;
            for(var i=1; i<=4; i++) {
                var t = i / 4;
                cx = cr.x1 + (cr.x2 - cr.x1) * t + (Math.random()-0.5)*40;
                cy = cr.y1 + (cr.y2 - cr.y1) * t + (Math.random()-0.5)*40;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        });
        ctx.restore();
    }
    // ★ РАЗЛОМ ДЕКУ: усиленный VFX-слой поверх существующей атаки.
    if (_superState.dekuSmashActive) {
        ctx.save();
        var dNow = performance.now();
        var dAge = Math.max(0, (dNow - (_superState.dekuSmashStartedAt || dNow)) / 1000);
        var pulse = 1 + Math.sin(dNow / 45) * 0.12;
        var power = Math.min(1, dAge / 0.35);
        ctx.globalCompositeOperation = "lighter";

        // Огромные энергетические кольца.
        for (var dr = 0; dr < 4; dr++) {
            var rr = (45 + dr * 24) + ((dAge * (260 + dr * 55)) % 310);
            ctx.globalAlpha = Math.max(0, 0.75 - rr / 430);
            ctx.strokeStyle = dr % 2 ? "#baffff" : "#44ff44";
            ctx.lineWidth = 2 + (3 - dr) * 0.8;
            ctx.shadowColor = "#44ff44";
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(hx, hy, rr * pulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Молнии от центра к краям.
        ctx.shadowColor = "#66ff66";
        ctx.shadowBlur = 18;
        for (var dl = 0; dl < 16; dl++) {
            var da = (dl / 16) * Math.PI * 2 + dNow / 900;
            var dl1 = 30 + (dl % 3) * 8;
            var dl2 = 145 + (dl % 4) * 34;
            ctx.globalAlpha = 0.45 + 0.35 * Math.abs(Math.sin(dNow / 90 + dl));
            ctx.strokeStyle = dl % 3 === 0 ? "#ffffff" : "#44ff44";
            ctx.lineWidth = 1.5 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(hx + Math.cos(da) * dl1, hy + Math.sin(da) * dl1);
            var mx = hx + Math.cos(da) * (dl1 + dl2 * 0.5) + (Math.random() - 0.5) * 28;
            var my = hy + Math.sin(da) * (dl1 + dl2 * 0.5) + (Math.random() - 0.5) * 28;
            ctx.lineTo(mx, my);
            ctx.lineTo(hx + Math.cos(da) * (dl1 + dl2), hy + Math.sin(da) * (dl1 + dl2));
            ctx.stroke();
        }

        // Светящийся центр перед финальным ударом.
        var coreR = (18 + Math.sin(dNow / 70) * 5) * (1 + power * 1.8);
        var core = ctx.createRadialGradient(hx, hy, 0, hx, hy, coreR * 2.8);
        core.addColorStop(0, "rgba(255,255,255,0.95)");
        core.addColorStop(0.18, "rgba(170,255,170,0.9)");
        core.addColorStop(0.55, "rgba(68,255,68,0.35)");
        core.addColorStop(1, "rgba(68,255,68,0)");
        ctx.fillStyle = core;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(hx, hy, coreR * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Финальный вертикальный разлом.
        if (dAge > 1.15) {
            var fp = Math.min(1, (dAge - 1.15) / 0.45);
            ctx.globalAlpha = 0.8 * (1 - Math.max(0, fp - 0.75) / 0.25);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4 + fp * 8;
            ctx.shadowColor = "#44ff44";
            ctx.shadowBlur = 28;
            ctx.beginPath();
            ctx.moveTo(hx, hy - 230 * fp);
            ctx.lineTo(hx + Math.sin(dNow / 35) * 12, hy + 230 * fp);
            ctx.stroke();
            ctx.strokeStyle = "#44ff44";
            ctx.lineWidth = 12 + fp * 10;
            ctx.globalAlpha *= 0.35;
            ctx.stroke();
        }
        ctx.restore();
    }

    if (_superState.dekuSmashActive && _superState.dekuFists.length > 0) {
        ctx.save();
        for (var i = 0; i < _superState.dekuFists.length; i++) {
            var fist = _superState.dekuFists[i];
            if (!fist.active) continue;
            ctx.save();
            ctx.translate(fist.x, fist.y);
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 25;
            ctx.fillStyle = "#110000";
            ctx.beginPath();
            ctx.arc(0, 0, fist.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ff6600";
            ctx.beginPath();
            ctx.arc(0, 0, fist.radius * 0.75, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffcc00";
            for(var p = -1.5; p <= 1.5; p++) {
                ctx.fillRect(p * 20 - 8, -fist.radius*0.4, 16, fist.radius*0.8);
            }
            ctx.fillRect(-fist.radius*0.6, -10, 20, 30);
            ctx.fillStyle = "#ff69b4";
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(-15, -15, fist.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // Закрываем внешний save() блока кулаков Разлома.
        // Без этого Canvas transform накапливался и камера уезжала после SUPER.
        ctx.restore();
    }
    if (_superState.dekuExplosions.length > 0) {
        ctx.save();
        _superState.dekuExplosions.forEach(function(exp) {
            var alpha = exp.life / exp.maxLife;
            var radius = 40 * (1 - alpha);
            var grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, Math.max(0.1, radius));
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            grad.addColorStop(0.3, 'rgba(68, 255, 68, 0.6)');
            grad.addColorStop(0.7, 'rgba(0, 200, 0, 0.2)');
            grad.addColorStop(1, 'rgba(0, 100, 0, 0)');
            ctx.fillStyle = grad;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, Math.max(0.1, radius), 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
    if (_superState.earthCracks.length > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(68, 255, 68, 0.9)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#44ff44";
        ctx.shadowBlur = 8;
        _superState.earthCracks.forEach(function(cr) {
            ctx.globalAlpha = cr.life;
            ctx.beginPath();
            var startX = cr.x;
            var startY = cr.y;
            ctx.moveTo(startX, startY);
            var endX = startX + Math.cos(cr.angle) * cr.length;
            var endY = startY + Math.sin(cr.angle) * cr.length;
            ctx.lineTo(endX, endY);
            for (var b = 0; b < 2; b++) {
                var bx = startX + (endX - startX) * (0.3 + Math.random() * 0.5);
                var by = startY + (endY - startY) * (0.3 + Math.random() * 0.5);
                var bAngle = cr.angle + (Math.random() - 0.5) * 1.2;
                var bLen = cr.length * (0.2 + Math.random() * 0.3);
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(bAngle) * bLen, by + Math.sin(bAngle) * bLen);
            }
            ctx.stroke();
        });
        ctx.restore();
    }
    if (_superState.dekuDash && _superState.dekuDash.trail && _superState.dekuDash.trail.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        for (var t of _superState.dekuDash.trail) {
            ctx.fillStyle = "#44ff44";
            ctx.shadowColor = "#44ff44";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(t.x, t.y, Math.max(0.1, hSize * 0.8 * (t.life / 0.3)), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    for (var r of _superState.rings) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.life / r.maxLife);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.width;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(0.1, r.radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    if (_superState.screenFlashWhite > 0) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = Math.min(1, _superState.screenFlashWhite / 10);
        ctx.fillRect(0, 0, 400, 500);
        ctx.restore();
    }
    if (_superState.dekusActive) {
        ctx.save();
        var glowPulse = 1.0 + Math.sin(performance.now() / 60) * 0.2;
        ctx.strokeStyle = "#44ff44";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#44ff44";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * 1.8 * glowPulse), 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }
    if (_superState.garpChargeTimer > 0) {
        if (Math.random() < 0.6) drawHakiLightning(hx, hy, 90, 1.0, 1.5, "#ff0000");
        if (Math.random() < 0.4) drawHakiLightning(hx, hy, 120, 0.8, 1, "#4444ff");
        ctx.save();
        var chargePower = 1.2 - _superState.garpChargeTimer;
        ctx.translate(hx, hy);
        ctx.rotate(performance.now() / 200);
        ctx.beginPath();
        ctx.arc(0, 0, 40 + chargePower * 30, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(136, 68, 255, 0.15)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.setLineDash([10, 15]);
        ctx.stroke();
        ctx.restore();
    }
    if (_superState.garpImpactActive) {
        var cx = _superState.garpImpactX;
        var cy = _superState.garpImpactY;
        var r = _superState.garpImpactRadius;
        var progress = r / 200;
        var alpha = 1 - Math.pow(progress, 3);
        ctx.save();
        ctx.globalAlpha = alpha;
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(0.1, r));
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.1, "#ff44ff");
        grad.addColorStop(0.4, "#220088");
        grad.addColorStop(0.8, "#050022");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2);
        ctx.fill();
        for(var i = 0; i < 30; i++) {
            var sAngle = Math.random() * Math.PI * 2;
            var sDist = Math.random() * r * 0.9;
            var sx = cx + Math.cos(sAngle + progress * 2) * sDist;
            var sy = cy + Math.sin(sAngle + progress * 2) * sDist;
            ctx.fillStyle = (Math.random() > 0.5) ? "#ffffff" : "#ffccff";
            ctx.beginPath();
            ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = "#ff44ff";
        ctx.lineWidth = 15 * (1 - progress);
        ctx.shadowColor = "#ff44ff";
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2);
        ctx.stroke();
        if (Math.random() < 0.8) {
            drawHakiLightning(cx + Math.cos(Math.random()*Math.PI*2)*r, cy + Math.sin(Math.random()*Math.PI*2)*r, 80, alpha, 2, "#ff0000");
            drawHakiLightning(cx + Math.cos(Math.random()*Math.PI*2)*r, cy + Math.sin(Math.random()*Math.PI*2)*r, 100, alpha, 2, "#ff00ff");
        }
        ctx.restore();
    }
    if (_superState.garpHakiActive) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * 2.5), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (Math.random() < 0.5) drawHakiLightning(hx, hy, 80, 1.0, 1.2, "#ff0000");
    }
    if (_superState.antispiralActive) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = "#aaddff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#aaddff";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * 3), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * 4), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    if (getMainCard() && getMainCard().name === "Император Марк") {
        ctx.save();
        var wingTime = performance.now() / 180;
        var leftWingAngle = Math.sin(wingTime) * 0.25;
        var rightWingAngle = -Math.sin(wingTime) * 0.25;
        var featherGrad = ctx.createLinearGradient(0, 0, 40, 0);
        featherGrad.addColorStop(0, "rgba(255, 215, 0, 0.8)");
        featherGrad.addColorStop(0.5, "rgba(255, 140, 0, 0.6)");
        featherGrad.addColorStop(1, "rgba(255, 69, 0, 0)");
        ctx.fillStyle = featherGrad;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 15;
        ctx.save();
        ctx.translate(hx - 6, hy);
        ctx.rotate(Math.PI + leftWingAngle);
        ctx.beginPath();
        ctx.ellipse(20, -5, 22, 7, 0.1, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(15, -12, 18, 5, 0.3, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(hx + 6, hy);
        ctx.rotate(rightWingAngle);
        ctx.beginPath();
        ctx.ellipse(20, -5, 22, 7, -0.1, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(15, -12, 18, 5, -0.3, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
        if (Math.random() < 0.05) {
            ctxB.getParticles().push({ x: hx + (Math.random()-0.5)*30, y: hy - 10, vx: (Math.random()-0.5)*1, vy: 1 + Math.random()*1.5, life: 30, maxLife: 30, color: "#ffd700", size: 2 });
        }
    }
    if (_superState.markBuffActive) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * 2.5), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    drawGarouTrail();
    var particles = ctxB.getParticles();
    for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        if (p.isLightning && p.life > 0) {
            drawLightningBolt(p.x, p.y, p.endX, p.endY, p.color, p.life / p.maxLife, p.width || 3, p.innerColor);
        }
    }
    if (_superState.fists && _superState.fists.length > 0) {
        for (var f of _superState.fists) {
            if (f.life > 0) drawFist(f);
        }
    }
    if (_superState.garouMarker && _superState.garouMarker.alpha > 0) drawCircleMarker(_superState.garouMarker.x, _superState.garouMarker.y, "#ff8800", _superState.garouMarker.alpha, 30);
    if (_superState.usoppStunTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 8;
        var stunAngle = performance.now() / 150;
        for (var i = 0; i < 4; i++) {
            var angle = (i / 4) * Math.PI * 2 + stunAngle;
            var sx = hx + Math.cos(angle) * (hSize * 1.8);
            var sy = hy + Math.sin(angle) * (hSize * 0.8) - 15;
            ctx.fillStyle = "#ffd700";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText("★", sx, sy);
        }
        ctx.restore();
    }
    if (_superState.nikaActive) {
        var bounceBeat = 1.0 + Math.abs(Math.sin(performance.now() / 150)) * 0.2;
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * bounceBeat), 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.55;
        var cloudAngle = performance.now() / 800;
        ctx.translate(hx, hy);
        ctx.rotate(cloudAngle);
        for (var i = 0; i < 5; i++) {
            var angle = (i / 5) * Math.PI * 2;
            var sx = Math.cos(angle) * (hSize * 1.5);
            var sy = Math.sin(angle) * (hSize * 1.5);
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#eeeeee";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(sx, sy, 7, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }
    if (_superState.borosHeal) {
        ctx.save();
        var spiralTime = performance.now() / 200;
        var r = hSize * 2.0;
        ctx.shadowBlur = 10;
        for(var yOffset = -25; yOffset <= 25; yOffset += 5) {
            var angle1 = spiralTime + (yOffset * 0.15);
            var angle2 = spiralTime + (yOffset * 0.15) + Math.PI;
            var alpha = 1.0 - Math.abs(yOffset) / 30;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = "#66ff66";
            ctx.shadowColor = "#66ff66";
            ctx.beginPath();
            ctx.arc(hx + Math.cos(angle1)*r, hy + yOffset, 2.5, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#00ffff";
            ctx.shadowColor = "#00ffff";
            ctx.beginPath();
            ctx.arc(hx + Math.cos(angle2)*r, hy + yOffset, 2.5, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }
    if (_superState.usoppInvuln) {
        ctx.save();
        var ghostDist = 20 + Math.sin(performance.now() / 100) * 4;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
        ctx.beginPath();
        ctx.arc(hx - ghostDist, hy, Math.max(0.1, hSize), 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + ghostDist, hy, Math.max(0.1, hSize), 0, Math.PI*2);
        ctx.fill();
        for (var i = 0; i < 3; i++) {
            var angle = performance.now() / 500 + i * Math.PI * 2 / 3;
            var sx = hx + Math.cos(angle) * hSize * 2.5;
            var sy = hy + Math.sin(angle) * hSize * 2.5;
            ctx.fillStyle = "#ffd700";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 15;
            ctx.font = "20px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⭐", sx, sy);
        }
        ctx.restore();
    }
    if (_superState.dandyRoulette) {
        ctx.save();
        var elapsed = performance.now() - _superState.dandyRoulette.time;
        var duration = _superState.dandyRoulette.duration;
        var isSpinning = elapsed < duration;
        var progress = isSpinning ? elapsed / duration : 1.0;
        var result = _superState.dandyRoulette.result;
        var floatY = isSpinning ? -30 * progress : -45;
        ctx.translate(hx, hy - 45 + floatY);
        if (isSpinning) { ctx.shadowBlur = 15; ctx.shadowColor = "#ffd700"; }
        var outerRot = isSpinning ? elapsed * 0.01 : 0;
        for (var i = 0; i < 12; i++) {
            var ang = (i / 12) * Math.PI * 2 + outerRot;
            var x = Math.cos(ang) * 20;
            var y = Math.sin(ang) * 20;
            ctx.fillStyle = i % 3 === 0 ? "#ff3333" : (i % 3 === 1 ? "#ffff00" : "#33ff33");
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI*2);
        ctx.stroke();
        if (isSpinning) {
            var fastRot = elapsed * 0.03;
            for (var s = 0; s < 6; s++) {
                var ang = (s / 6) * Math.PI * 2 + fastRot;
                ctx.strokeStyle = s % 2 === 0 ? "#44ff44" : "#ff4444";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(ang)*14, Math.sin(ang)*14);
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isSpinning) { ctx.fillStyle = "#ffd700"; ctx.fillText("?", 0, 0); }
        else if (result) {
            ctx.fillStyle = result.good === true ? "#44ff44" : (result.good === false ? "#ff4444" : "#ffd700");
            var shortText = result.name.length > 6 ? result.name.substring(0, 4) + ".." : result.name;
            ctx.fillText(shortText, 0, 0);
        }
        ctx.restore();
    }
    if (_superState.kaidoBuffActive) {
        ctx.save();
        var shieldTime = performance.now() / 250;
        var numScales = 3;
        ctx.shadowColor = "#ff4500";
        ctx.shadowBlur = 15;
        for(var i=0; i<numScales; i++) {
            var angle = shieldTime + (i / numScales) * Math.PI * 2;
            var scaleX = hx + Math.cos(angle) * 30;
            var scaleY = hy + Math.sin(angle) * 30;
            ctx.fillStyle = "rgba(255, 69, 0, 0.85)";
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(scaleX, scaleY - 6);
            ctx.lineTo(scaleX + 5, scaleY);
            ctx.lineTo(scaleX, scaleY + 6);
            ctx.lineTo(scaleX - 5, scaleY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
    if (_superState.imAuraActive) {
        ctx.save();
        var gradient = ctx.createRadialGradient(hx, hy, 40, hx, hy, 55);
        gradient.addColorStop(0, 'rgba(128, 0, 128, 0.1)');
        gradient.addColorStop(1, 'rgba(128, 0, 128, 0.6)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(hx, hy, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(200, 0, 200, 0.9)";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#800080";
        ctx.shadowBlur = 25;
        ctx.stroke();
        ctx.restore();
    }
    if (_superState.allmightPermaSlow) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#ff0000";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    if (_superState.allmightDebuffActive) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#ff4444";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    if (_superState.garouInvulnTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(0.1, hSize * 2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    if (_superState.allmightHurricane) {
        ctx.save();
        var vortexGrad = ctx.createRadialGradient(hx, hy, 10, hx, hy, 150);
        vortexGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        vortexGrad.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
        vortexGrad.addColorStop(0.6, 'rgba(0, 150, 255, 0.4)');
        vortexGrad.addColorStop(1, 'rgba(0, 100, 200, 0)');
        ctx.fillStyle = vortexGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 20;
        for (var r = 0; r < 5; r++) {
            var ringRadius = 30 + r * 25;
            var ringRotation = _superState.allmightHurricaneAngle * (1 + r * 0.5);
            var segments = 30;
            ctx.beginPath();
            for (var i = 0; i <= segments; i++) {
                var angle = (i / segments) * Math.PI * 2 + ringRotation;
                var waveOffset = Math.sin(i * 3 + _superState.allmightHurricaneAngle * 5) * 15;
                var x = hx + Math.cos(angle) * (ringRadius + waveOffset);
                var y = hy + Math.sin(angle) * (ringRadius + waveOffset) * 0.5;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        ctx.restore();
    }
    if (_superState.allmightBuffTimer > 0) drawAllMightHeart(hx, hy, hSize);
    if (_superState.kaidoDrinking) drawBeerBottle(hx, hy, 1, true);
    if (_superState.comicTexts.length > 0) {
        _superState.comicTexts.forEach(function(t) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.translate(t.x, t.y);
            ctx.rotate(t.angle);
            ctx.scale(t.scale, t.scale);
            ctx.font = "bold 16px Impact, Arial Black, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 4;
            ctx.strokeText(t.text, 0, 0);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, 0, 0);
            ctx.restore();
        });
    }

    // ★ БЕЛОУС: зарядка ★
    if (_superState.whitebeardCharging) {
        ctx.save();
        var chargePower = 1 - (_superState.whitebeardChargeTimer / 30);
        ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 50) * 0.3;
        ctx.strokeStyle = "#aa00ff";
        ctx.lineWidth = 3 + chargePower * 3;
        ctx.shadowColor = "#aa00ff";
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(hx, hy, 30 + chargePower * 50, 0, Math.PI * 2);
        ctx.stroke();
        
        var wbGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 40);
        wbGrad.addColorStop(0, "rgba(255, 255, 255, " + (0.5 + chargePower * 0.5) + ")");
        wbGrad.addColorStop(0.5, "rgba(170, 0, 255, 0.6)");
        wbGrad.addColorStop(1, "rgba(170, 0, 255, 0)");
        ctx.fillStyle = wbGrad;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(hx, hy, 40, 0, Math.PI * 2);
        ctx.fill();
        
        if (Math.random() < 0.6) {
            drawHakiLightning(hx, hy, 60 + chargePower * 40, 0.9, 1.5, "#aa00ff");
        }
        ctx.restore();
    }
    
    // ★ БЕЛОУС: цунами ★
    if (_superState.whitebeardTsunami) {
        ctx.save();
        var ty = _superState.whitebeardTsunamiY;
        var tw = 430;
        var th = 150;
        var waveT=performance.now()/180;
        ctx.shadowColor="#00ccff";
        ctx.shadowBlur=25;
        
        var tGrad = ctx.createLinearGradient(0, ty - th/2, 0, ty + th/2);
        tGrad.addColorStop(0, "#003366");
        tGrad.addColorStop(0.3, "#00aaff");
        tGrad.addColorStop(0.7, "#00ddff");
        tGrad.addColorStop(1, "#003366");
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.moveTo(0, ty - th/2);
        for (var i = 0; i <= 20; i++) {
            var t = i / 20;
            var x = t * tw;
            var yTop = ty - th/2 + Math.sin(t * Math.PI * 3 + performance.now() / 100) * 12;
            ctx.lineTo(x, yTop);
        }
        for (var i = 20; i >= 0; i--) {
            var t = i / 20;
            var x = t * tw;
            var yBot = ty + th/2 + Math.sin(t * Math.PI * 3 + performance.now() / 100) * 12;
            ctx.lineTo(x, yBot);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = "#003355";
        ctx.lineWidth = 5;
        ctx.stroke();
        
        ctx.fillStyle = "#ffffff";
        for (var i = 0; i <= 20; i++) {
            var t = i / 20;
            var x = t * tw;
            var yTop = ty - th/2 + Math.sin(t * Math.PI * 3 + performance.now() / 100) * 12;
            ctx.beginPath();
            ctx.arc(x, yTop, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        for (var li = 0; li < 3; li++) {
            var lineOffset = -th * 0.2 + li * th * 0.2;
            ctx.beginPath();
            for (var i = 0; i <= 20; i++) {
                var t = i / 20;
                var x = t * tw;
                var y = ty + lineOffset + Math.sin(t * Math.PI * 4 + performance.now() / 100 + li) * 5;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        ctx.shadowBlur=0;
        ctx.strokeStyle="#ffffff";ctx.lineWidth=4;
        for(var fi=0;fi<9;fi++){var fx=20+fi*48;ctx.beginPath();ctx.arc(fx,ty-52,18+(fi%3)*5,Math.PI,Math.PI*2);ctx.stroke();}
        ctx.globalAlpha=.75;ctx.strokeStyle="#66eeff";ctx.lineWidth=7;
        for(var li2=0;li2<4;li2++){ctx.beginPath();for(var wi2=0;wi2<=30;wi2++){var wt2=wi2/30,x2=wt2*tw,y2=ty-30+li2*20+Math.sin(wt2*Math.PI*6+waveT+li2)*10;if(wi2===0)ctx.moveTo(x2,y2);else ctx.lineTo(x2,y2);}ctx.stroke();}
        ctx.globalAlpha=1;ctx.restore();
    }
}

setInterval(function() {
    try {
        var bossType = isUniqueBossActive();
        if (bossType) {
            if (window._uniqueSuperBossId !== bossType) {
                window._uniqueSuperBossId = bossType;
                resetHeroCharges(bossType);
                console.log("[SUPER] Новый уникальный босс: " + bossType);
                console.log("[SUPER] Лимит босса: " + getBossChargeLimit(bossType));
                console.log("[SUPER] Лимиты по персонажам:", JSON.stringify(window._heroSuperCharges));
            }
            updateSuperButton();
        } else {
            if (window._uniqueSuperBossId !== null) {
                window._uniqueSuperBossId = null;
            }
        }
    } catch(e) {}
}, 300);

function patchSuperButtons() {
    var btn = document.getElementById("superBtn");
    var btn2 = document.getElementById("superBtn2");
    var btnDeact = document.getElementById("superBtnDeactivate");

    if (btn && !btn._superPatched) {
        btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); toggleSuper(); };
        btn._superPatched = true;
    }
    if (btn2 && !btn2._superPatched) {
        btn2.onclick = function(e) { e.preventDefault(); e.stopPropagation(); if (typeof activateDekuDashSmash === 'function') activateDekuDashSmash(); };
        btn2._superPatched = true;
    }
    var wbSkillBtn = document.getElementById("whitebeardSkillBtn");
    if (wbSkillBtn && !wbSkillBtn._wbSkillPatched) {
        wbSkillBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); useWhitebeardSkill(); };
        wbSkillBtn._wbSkillPatched = true;
    }
    if (btnDeact && !btnDeact._superPatched) {
        btnDeact.onclick = function(e) { e.preventDefault(); e.stopPropagation(); if (typeof deactivateDeku100 === 'function') deactivateDeku100(); };
        btnDeact._superPatched = true;
    }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(patchSuperButtons, 100);
} else {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(patchSuperButtons, 500); });
}
setInterval(patchSuperButtons, 1000);

// ========== ЭКСПОРТ ==========
window.toggleSuper = toggleSuper;
window.activateDekuDashSmash = activateDekuDashSmash;
window.activateDekuEarthShatter = activateDekuEarthShatter;
window.deactivateDeku100 = deactivateDeku100;
window.activateAllmightHurricane = activateAllmightHurricane;
window.useWhitebeardSkill = useWhitebeardSkill;
window.updateWhitebeardSkillButton = updateWhitebeardSkillButton;
window.initSuperState = initSuperState;
window.tickSupers = tickSupers;
window.renderSuperVisuals = renderSuperVisuals;
window.resetAllSupers = resetAllSupers;
window.resetAllCooldowns = resetAllCooldowns;
window.getMainCard = getMainCard;
window.isUniqueBossActive = isUniqueBossActive;
window.getBossContext = getBossContext;

window.getBossChargeLimit = getBossChargeLimit;
window.getHeroChargeLimit = getHeroChargeLimit;
window.getEffectiveHeroChargeLimit = getEffectiveHeroChargeLimit;
window.getHeroCurrentCharges = getHeroCurrentCharges;
window.setHeroCurrentCharges = setHeroCurrentCharges;
window.resetHeroCharges = resetHeroCharges;
window.SUPER_DEFAULT_CHARGES = SUPER_DEFAULT_CHARGES;
window.SUPER_CHARGES_PER_BOSS = SUPER_CHARGES_PER_BOSS;
window.SUPER_CHARGES_PER_HERO = SUPER_CHARGES_PER_HERO;
window.SUPER_CHARGES_HERO_PER_BOSS = SUPER_CHARGES_HERO_PER_BOSS;

// ★ БЕЛОУС: ПАССИВКА — экспорт ★
window.applyWhitebeardPassiveReduction = applyWhitebeardPassiveReduction;
window.tickWhitebeardRegen = tickWhitebeardRegen;

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║  [SUPERS] v20.0 — БЕЛОУС ДОБАВЛЕН                        ║");
console.log("║  ✅ СУПЕР: ГУРА-ГУРА КОНЕЦ МИРА (заморозка + урон + цунами)║");
console.log("║  ✅ ПАССИВКА: 10% поглощение + 2% HP/5сек                 ║");
console.log("║  ✅ Всё работает на 4 уникальных боссах                   ║");
console.log("╚════════════════════════════════════════════════════════════╝");
