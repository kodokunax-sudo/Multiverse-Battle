// ========== СУПЕР-СПОСОБНОСТИ СЕКРЕТНЫХ КАРТ (АРЕНА) v14.1 FINAL ==========
// Разлом Деку полностью в этом файле, молнии изумрудные

let _superState = {
    fists: [],
    rings: [],
    // Деку
    dekusActive: false, dekusOriginalSpeed: 1.2, dekusDmgMult: 1, dekusParticles: false,
    dekuEarthShatterReady: false, dekuDashSmashReady: false,
    dekuEarthShatterCooldown: 0, dekuDashSmashCooldown: 0,
    dekuSmashActive: false,
    dekuSmashBlackoutTimer: 0,
    dekuSmashSequenceTimer: 0,
    dekuFists: [],
    originalHeartSpeed: 1.2,
    // Борос
    borosHeal: null, borosParticles: false,
    // Усопп
    usoppInvuln: false, usoppStunTimer: 0,
    // Луффи
    nikaActive: false, nikaHitboxOriginal: 4, nikaSizeOriginal: 14, nikaDmgMult: 1, nikaSpeedBonus: 1,
    // Гароу
    positionHistory: [], garouMarker: null, garouInvulnTimer: 0, garouTimeStop: false,
    // Гарп
    garpChargeTimer: 0, garpImpactActive: false, garpImpactRadius: 0, garpImpactX: 0, garpImpactY: 0,
    garpHakiActive: false, garpHakiTimer: 0,
    // Им
    imAuraActive: false, imSpeedPenalty: false,
    // Анти-спираль
    antispiralActive: false, antispiralOrigHitbox: 4, antispiralOrigSize: 14, antispiralOrigSpeed: 1.2, antispiralShrinkAttacks: false,
    // Дэнди
    dandyLightnings: false, dandyInvuln: false, dandyDmgBuff: null, dandyShield: null, dandyVulnerable: null, dandyDoubleTargets: false, dandyRoulette: null,
    dandyDarkness: 0, dandyAura: 0, dandyLava: 0, dandyAutoRevive: false,
    // Кайдо
    kaidoDrinking: false, kaidoBuffActive: false, kaidoDmgReduction: false, kaidoDmgBonus: 1, kaidoSpeedBonus: 1, invertControls: false, kaidoScream: false,
    // Марк
    markResurrectCharges: 2,
    markBuffActive: false, markBuffTimer: 0, markDmgReduction: 1, markDmgBonus: 1, markSpeedBonus: 1,
    // Всемогущий
    allmightPermaSlow: false, allmightDmgMult: 1, allmightBuffTimer: 0, allmightOrigSize: 14, allmightOrigHitbox: 4, allmightShockwave: 0,
    allmightDebuffActive: false, allmightDebuffTimer: 0, allmightDebuffDmgMult: 1,
    allmightHurricane: false, allmightHurricaneTimer: 0, allmightHurricaneAngle: 0,
    // Общие эффекты экрана
    screenShakeAmount: 0, screenFlashWhite: 0,
    realityCracks: [],
    comicTexts: [],
    earthCracks: [],
    dekuDash: null,
    dekuExplosions: []
};

let _superCooldowns = {};
let _activeSuperName = null;
let _superLastTick = 0;
let _allmightHurricaneReady = false;
let _allmightHurricaneCooldown = 0;

// ====== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ОТРИСОВКИ ======
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
    if (isDrinking) { var tilt = Math.abs(Math.sin(performance.now() / 150)) * (Math.PI / 2.5); ctx.rotate(tilt); if (Math.random() < 0.25) { arenaParticles.push({x: x + 15, y: y - 30, vx: Math.random(), vy: 2 + Math.random()*2, life: 15, maxLife: 15, color: "#D2691E", size: 2}); } }
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

// ====== ОПИСАНИЯ СПОСОБНОСТЕЙ ======
const superAbilities = {
    "Деку (100%)": {
        name: "ПОЛНОЕ 100% ПОКРЫТИЕ", cooldown: 15000, toggleable: true, duration: Infinity,
        onActivate() {
            _superState.dekusActive = true; _superState.dekusOriginalSpeed = heartSpeed; _superState.dekusDmgMult = 2; _superState.dekusParticles = true;
            heartSpeed *= 3; _superState.screenShakeAmount = 15;
            _superState.dekuEarthShatterReady = true; _superState.dekuDashSmashReady = true;
            _superState.dekuEarthShatterCooldown = 0; _superState.dekuDashSmashCooldown = 0;
            addShockwaveRing(heart.x, heart.y, "#44ff44", 400, 0.5);
            spawnFloatingText(heart.x, heart.y - 30, "100%!!!", "#44ff44");
        },
        onDeactivate() {
            heartSpeed = _superState.dekusOriginalSpeed; _superState.dekusActive = false; _superState.dekusDmgMult = 1; _superState.dekusParticles = false;
            _superState.dekuEarthShatterReady = false; _superState.dekuDashSmashReady = false;
            _superState.dekuEarthShatterCooldown = 0; _superState.dekuDashSmashCooldown = 0;
            _superState.dekuDash = null; _superState.earthCracks = []; _superState.dekuExplosions = [];
            _superState.dekuSmashActive = false; _superState.dekuFists = [];
            if (_superState.dekuSmashBlackoutTimer > 0 || _superState.dekuSmashSequenceTimer > 0) {
                heartSpeed = _superState.originalHeartSpeed; arenaGlobalSpeedMod = 1.0;
                if (typeof arenaDodgeTimerInterval !== 'undefined' && arenaDodgeTimerInterval) { clearInterval(arenaDodgeTimerInterval); }
            }
        },
        onTick(dt) { if (_superState.dekusActive && arenaActive) { var drain = arenaMaxHP * 0.02 * dt; arenaHP = Math.max(0, arenaHP - drain); document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP)); if (arenaHP <= 0 && typeof loseArena === 'function') loseArena(); } }
    },
    "Сайтама": { name: "ОБЫЧНЫЙ УДАР", cooldown: 12000, toggleable: false, duration: 0, onActivate() { var willOneshot = Math.random() < 0.01; _superState.fists.push({ x: heart.x, y: heart.y - 30, vx: 0, vy: -3.5, size: 70, life: 100, color: "#ff2222", willOneshot: willOneshot, oneshotChecked: false, pathWidth: 120, owner: "Сайтама" }); _superState.screenShakeAmount = 25; _superState.screenFlashWhite = 3; addShockwaveRing(heart.x, heart.y, "#ff0000", 350, 0.6); for (var i = 0; i < 20; i++) { var ang = (i / 20) * Math.PI * 2; arenaParticles.push({ x: heart.x, y: heart.y, vx: Math.cos(ang) * 12, vy: Math.sin(ang) * 12, life: 15, maxLife: 15, color: "#ffaa00", size: 3 }); } if (typeof sfxWhoosh === 'function') sfxWhoosh(); spawnFloatingText(heart.x, heart.y - 40, "УДАР!", "#ff0000"); }, onTick() {} },
    "Борос": { name: "РЕГЕНЕРАЦИЯ", cooldown: 20000, toggleable: false, duration: 5000, onActivate() { _superState.borosHeal = { active: true, healPerSec: arenaMaxHP * 0.06, elapsed: 0, totalDuration: 5 }; _superState.borosParticles = true; heartSpeed *= 0.7; addShockwaveRing(heart.x, heart.y, "#66ff66", 200, 0.8); spawnFloatingText(heart.x, heart.y - 30, "РЕГЕН!", "#66ff66"); }, onDeactivate() { if (_superState.borosHeal) { heartSpeed /= 0.7; _superState.borosHeal = null; _superState.borosParticles = false; } _superState.screenFlashWhite = 5; }, onTick(dt) { if (_superState.borosHeal && _superState.borosHeal.active && arenaActive) { var h = _superState.borosHeal.healPerSec * dt; arenaHP = Math.min(arenaMaxHP, arenaHP + h); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); _superState.borosHeal.elapsed += dt; if (_superState.borosHeal.elapsed >= _superState.borosHeal.totalDuration) { this.onDeactivate(); startCooldown("Борос", this.cooldown); } } } },
    "Бог Усопп": { name: "ЛОЖЬ СТАНОВИТСЯ ПРАВДОЙ", cooldown: 35000, toggleable: false, duration: 3000, onActivate() { _superState.usoppInvuln = true; spawnFloatingText(heart.x, heart.y - 30, "НЕУЯЗВИМ!", "#ffff00"); }, onDeactivate() { _superState.usoppInvuln = false; _superState.usoppStunTimer = 1; spawnFloatingText(heart.x, heart.y - 30, "ОГЛУШЕНИЕ!", "#ff8800"); }, onTick(dt) {} },
    "Луффи: Ника, Бог Солнца": { name: "ОСВОБОЖДЕНИЕ", cooldown: 25000, toggleable: true, duration: Infinity, onActivate() { _superState.nikaActive = true; _superState.nikaHitboxOriginal = heart.hitbox; _superState.nikaSizeOriginal = heart.size; heart.hitbox *= 2; heart.size *= 2; _superState.nikaDmgMult = 1.5; _superState.nikaSpeedBonus = 1.3; heartSpeed *= 1.3; _superState.screenFlashWhite = 8; addShockwaveRing(heart.x, heart.y, "#ffffff", 500, 0.8); spawnFloatingText(heart.x, heart.y - 40, "НИКА!", "#ffffff"); }, onDeactivate() { _superState.nikaActive = false; heart.hitbox = _superState.nikaHitboxOriginal; heart.size = _superState.nikaSizeOriginal; _superState.nikaDmgMult = 1; heartSpeed /= 1.3; }, onTick(dt) {} },
    "Космический Гароу": { name: "ПОТОК ВСЕЛЕННОЙ", cooldown: 30000, toggleable: false, duration: 0, onActivate() { var now = performance.now(); var target = null; for (var i = _superState.positionHistory.length - 1; i >= 0; i--) { if (now - _superState.positionHistory[i].time >= 2000) { target = _superState.positionHistory[i]; break; } } if (!target && _superState.positionHistory.length > 0) target = _superState.positionHistory[0]; if (target) { _superState.garouTimeStop = true; setTimeout(function() { _superState.garouTimeStop = false; }, 300); addShockwaveRing(heart.x, heart.y, "#ba55d3", 250, 0.6, 6); for(var i=0; i<15; i++) { var ang = Math.random() * Math.PI*2; var sp = 3 + Math.random()*5; arenaParticles.push({ x: heart.x, y: heart.y, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, life: 25, maxLife: 25, color: "#4b0082", size: 4 }); } _superState.garouMarker = { x: target.x, y: target.y, alpha: 1.0, time: now }; heart.x = target.x; heart.y = target.y; addShockwaveRing(heart.x, heart.y, "#ff8800", 300, 0.5, 6); _superState.garouInvulnTimer = 1.0; _superState.screenShakeAmount = 15; spawnFloatingText(heart.x, heart.y - 30, "ТЕЛЕПОРТ!", "#ff8800"); } _superState.positionHistory = []; }, onTick(dt) {} },
    "Зено": { name: "СТИРАНИЕ", cooldown: 45000, toggleable: false, duration: 0, onActivate() { _superState.screenFlashWhite = 20; attacks = []; arenaBlasters = []; arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.9); _superState.realityCracks = []; for (var i = 0; i < 8; i++) { _superState.realityCracks.push({ x1: Math.random() * 400, y1: Math.random() * 500, x2: Math.random() * 400, y2: Math.random() * 500, life: 1.5 }); } if (typeof sfxArenaVictory === 'function') sfxArenaVictory(); spawnFloatingText(heart.x, heart.y - 30, "СТЁРТО!", "#ff00ff"); }, onTick() {} },
    "Анти-спираль": { name: "СЖАТИЕ ПРОСТРАНСТВА", cooldown: 25000, toggleable: true, duration: Infinity, onActivate() { _superState.antispiralActive = true; _superState.antispiralOrigHitbox = heart.hitbox; _superState.antispiralOrigSize = heart.size; _superState.antispiralOrigSpeed = heartSpeed; heart.hitbox = heart.hitbox * 0.7; heart.size = heart.size * 0.7; heartSpeed = heartSpeed * 0.7; for (var a of attacks) { if (a.size) a.size *= 0.7; if (a.radius) a.radius *= 0.7; if (a.spd) a.spd *= 0.7; if (a.spdY) a.spdY *= 0.7; } _superState.antispiralShrinkAttacks = true; spawnFloatingText(heart.x, heart.y - 30, "ПРОСТРАНСТВО СЖАТО!", "#aaddff"); }, onDeactivate() { _superState.antispiralActive = false; _superState.antispiralShrinkAttacks = false; heart.hitbox = _superState.antispiralOrigHitbox; heart.size = _superState.antispiralOrigSize; heartSpeed = _superState.antispiralOrigSpeed; for (var a of attacks) { if (a.size) a.size /= 0.7; if (a.radius) a.radius /= 0.7; if (a.spd) a.spd /= 0.7; if (a.spdY) a.spdY /= 0.7; } }, onTick(dt) {} },
    "Молодой Гарп": { name: "ГАЛАКТИЧЕСКИЙ УДАР", cooldown: 30000, toggleable: false, duration: 0, onActivate() { heartSpeed *= 0.3; _superState.garpChargeTimer = 1.2; _superState.screenShakeAmount = 12; spawnFloatingText(heart.x, heart.y - 40, "ЗАРЯДКА ХАКИ...", "#ff0000"); }, onTick(dt) {} },
    "Им (Правитель)": { name: "ТЕНЕВОЕ ПРАВЛЕНИЕ", cooldown: 30000, toggleable: true, duration: Infinity, onActivate() { _superState.imAuraActive = true; _superState.imSpeedPenalty = true; heartSpeed *= 0.7; spawnFloatingText(heart.x, heart.y - 30, "ТЬМА!", "#800080"); }, onDeactivate() { _superState.imAuraActive = false; _superState.imSpeedPenalty = false; heartSpeed /= 0.7; }, onTick(dt) {} },
    "Космический Дэнди": { name: "КОСМИЧЕСКАЯ УДАЧА", cooldown: 20000, toggleable: false, duration: 0, onActivate() { _superState.dandyRoulette = { time: performance.now(), duration: 1500, result: null, spinAngle: 0 }; for (var i = 0; i < 10; i++) { arenaParticles.push({ x: heart.x + (Math.random()-0.5)*40, y: heart.y - 40, vx: (Math.random()-0.5)*1, vy: -1 - Math.random(), life: 20, maxLife: 20, color: "#ffd700", size: 2, isQuestionMark: true }); } setTimeout(function() { _superState.dandyRoulette.result = { name: "???" }; var roll = Math.random(); if (roll < 0.40) { var eff = DANDY_GOOD[Math.floor(Math.random() * DANDY_GOOD.length)]; eff.apply(); _superState.dandyRoulette.result = { name: eff.name, good: true }; for (var i = 0; i < 30; i++) { var ang = Math.random() * Math.PI*2; var sp = 2 + Math.random()*4; arenaParticles.push({ x: heart.x, y: heart.y - 30, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, life: 40, maxLife: 40, color: "hsl(" + (Math.random()*360) + ", 100%, 50%)", size: 3 }); } spawnFloatingText(heart.x, heart.y - 40, eff.name + "!", "#44ff44"); } else if (roll < 0.60) { var eff = DANDY_NEUTRAL[Math.floor(Math.random() * DANDY_NEUTRAL.length)]; eff.apply(); _superState.dandyRoulette.result = { name: eff.name, good: null }; spawnFloatingText(heart.x, heart.y - 40, eff.name + "!", "#ffd700"); } else { var eff = DANDY_BAD[Math.floor(Math.random() * DANDY_BAD.length)]; eff.apply(); _superState.dandyRoulette.result = { name: eff.name, good: false }; screenFlash = 5; screenFlashColor = "#ff0000"; _superState.screenShakeAmount = 8; spawnFloatingText(heart.x, heart.y - 40, eff.name + "!", "#ff4444"); if (ctx) { for (var i = 0; i < 5; i++) { ctx.save(); ctx.fillStyle = "rgba(255, 0, 0, " + (Math.random() * 0.5) + ")"; ctx.fillRect(Math.random() * 400, Math.random() * 500, Math.random() * 80, Math.random() * 20); ctx.restore(); } } } setTimeout(function() { _superState.dandyRoulette = null; }, 1000); }, 1500); }, onTick() {} },
    "Кайдо": { name: "ДЫХАНИЕ РАЗРУШЕНИЯ", cooldown: 25000, toggleable: false, duration: 0, onActivate() { _superState.kaidoDrinking = true; heartSpeed *= 0.5; spawnFloatingText(heart.x, heart.y - 30, "ГЛОТОК...", "#D2691E"); setTimeout(function() { _superState.kaidoDrinking = false; heartSpeed /= 0.5; _superState.kaidoBuffActive = true; _superState.kaidoDmgReduction = true; _superState.kaidoSpeedBonus = 1.5; heartSpeed *= 1.5; _superState.kaidoDmgBonus = 1.8; _superState.invertControls = true; _superState.kaidoScream = true; _superState.screenShakeAmount = 25; arenaHP = Math.min(arenaMaxHP, arenaHP + arenaMaxHP * 0.1); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); spawnFloatingText(heart.x, heart.y - 40, "ЯРОСТЬ!!!", "#ff4444"); setTimeout(function() { _superState.kaidoScream = false; }, 500); setTimeout(function() { _superState.kaidoBuffActive = false; _superState.kaidoDmgReduction = false; heartSpeed /= 1.5; _superState.kaidoSpeedBonus = 1; _superState.kaidoDmgBonus = 1; _superState.invertControls = false; heartSpeed *= 0.5; spawnFloatingText(heart.x, heart.y - 30, "ПОХМЕЛЬЕ...", "#8B4513"); setTimeout(function() { heartSpeed /= 0.5; }, 3000); }, 10000); }, 2000); }, onTick() {} },
    "Император Марк": { name: "ПАССИВНАЯ", cooldown: 0, toggleable: false, duration: 0, onActivate() {}, onTick() {} },
    "Всемогущий (прайм)": { name: "СИМВОЛ МИРА", cooldown: 60000, toggleable: false, duration: 0, onActivate() { _superState.allmightOrigHitbox = heart.hitbox; _superState.allmightOrigSize = heart.size; heart.hitbox *= 2; heart.size *= 2; _superState.allmightDmgMult = 3; _superState.allmightBuffTimer = 15; _superState.allmightShockwave = 0; _superState.screenFlashWhite = 20; spawnFloatingText(heart.x, heart.y - 50, "СИМВОЛ МИРА!!!", "#ffd700"); _superState.allmightDebuffActive = false; _superState.allmightDebuffTimer = 0; _superState.allmightDebuffDmgMult = 1; _allmightHurricaneReady = true; _allmightHurricaneCooldown = 0; var phrases = ["DETROIT!", "TEXAS!", "CAROLINA!", "UNITED STATES!"]; var phraseDelay = 0; phrases.forEach(function(p) { setTimeout(function() { if (_superState.allmightBuffTimer > 0) { _superState.comicTexts.push({ text: p + " SMASH!", x: 50 + Math.random()*300, y: 100 + Math.random()*250, alpha: 1.0, scale: 1.5 + Math.random()*0.5, angle: (Math.random()-0.5)*0.3, color: Math.random() > 0.5 ? "#ffd700" : "#ff3333" }); _superState.screenShakeAmount = 15; } }, phraseDelay); phraseDelay += 3000; }); setTimeout(function() { heart.hitbox = _superState.allmightOrigHitbox; heart.size = _superState.allmightOrigSize; _superState.allmightDmgMult = 1; arenaHP = Math.max(1, arenaHP - Math.floor(arenaMaxHP * 0.3)); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); _superState.allmightPermaSlow = true; heartSpeed = heartSpeed / 3; _superState.allmightDebuffActive = true; _superState.allmightDebuffDmgMult = 0.5; _allmightHurricaneReady = false; _superState.allmightHurricane = false; spawnFloatingText(heart.x, heart.y - 40, "ИСТОЩЕНИЕ НАВСЕГДА!", "#ff0000"); if (arenaHP <= 0 && typeof loseArena === 'function') loseArena(); }, 15000); }, onTick() {} }
};

// ====== РАЗЛОМ ДЕКУ (ЭПИЧНАЯ ВЕРСИЯ) ======
function triggerDekuSmash() {
    if (!arenaActive) return;
    
    _superState.dekuSmashActive = true;
    _superState.dekuSmashBlackoutTimer = 60; // 1 секунда (60 FPS) кромешной тьмы
    _superState.dekuSmashSequenceTimer = 150; // 1.5 секунды на появление кулаков
    
    // Замедляем всё в 3 раза
    _superState.originalHeartSpeed = heartSpeed;
    heartSpeed = heartSpeed / 3;
    arenaGlobalSpeedMod = 0.33;
    
    // Замедляем таймер арены
    if (typeof arenaDodgeTimerInterval !== 'undefined' && arenaDodgeTimerInterval) {
        clearInterval(arenaDodgeTimerInterval);
        arenaDodgeTimerInterval = setInterval(function() {
            if (typeof arenaPhase !== 'undefined' && arenaPhase === "dodge" && typeof arenaActive !== 'undefined' && arenaActive) {
                if (typeof arenaDodgeTimer !== 'undefined') arenaDodgeTimer--;
                if (typeof arenaDodgeTimer !== 'undefined' && arenaDodgeTimer <= 0) arenaDodgeTimer = 0;
                if (typeof updateDodgeTimerDisplay === 'function') updateDodgeTimerDisplay();
            }
        }, 3000);
    }
    
    // Генерируем 8 кулаков с задержкой появления
    _superState.dekuFists = [];
    for (var i = 0; i < 8; i++) {
        _superState.dekuFists.push({
            x: 50 + Math.random() * 300,
            y: 50 + Math.random() * 400,
            radius: 70, // Огромная площадь
            delay: 60 + (i * 10), // Появляются по очереди
            life: 25,
            active: false
        });
    }
    
    if (typeof playArenaSound === 'function') playArenaSound(80, 'sawtooth', 2.0, 0.3);
}

function activateDekuEarthShatter() {
    if (!_superState.dekusActive) return;
    if (!_superState.dekuEarthShatterReady) return;
    if (!arenaActive) return;
    
    _superState.dekuEarthShatterReady = false;
    _superState.dekuEarthShatterCooldown = 25;
    
    // Запускаем эпичную анимацию
    triggerDekuSmash();
    
    // Урон боссу 12%
    var dmg = Math.floor(arenaBossMaxHP * 0.12);
    arenaBossMaxHP -= dmg;
    
    spawnFloatingText(heart.x, heart.y - 40, "РАЗЛОМ ДЕКУ!", "#44ff44");
}

function activateDekuDashSmash() {
    if (!_superState.dekusActive) return;
    if (!_superState.dekuDashSmashReady) return;
    if (!arenaActive) return;
    _superState.dekuDashSmashReady = false; _superState.dekuDashSmashCooldown = 20;
    var dx = 0, dy = 0;
    if (keys.w || keys.up) dy = -1; if (keys.s || keys.down) dy = 1; if (keys.a || keys.left) dx = -1; if (keys.d || keys.right) dx = 1;
    if (dx === 0 && dy === 0) { var ang = Math.random() * Math.PI * 2; dx = Math.cos(ang); dy = Math.sin(ang); }
    var len = Math.sqrt(dx*dx + dy*dy) || 1; dx /= len; dy /= len;
    _superState.dekuDash = { startX: heart.x, startY: heart.y, dirX: dx, dirY: dy, distance: 200, traveled: 0, trail: [], life: 0.4 };
    var dmg = Math.floor(arenaBossMaxHP * 0.08); arenaBossMaxHP -= dmg;
    var dashWidth = 60;
    for (var i = attacks.length - 1; i >= 0; i--) { var a = attacks[i]; var ax = a.x + (a.size || a.radius || 20) / 2; var ay = a.y + (a.size || a.radius || 20) / 2; var t = ((ax - heart.x) * dx + (ay - heart.y) * dy) / (dx*dx + dy*dy); if (t > 0 && t < 200) { var projX = heart.x + dx * t; var projY = heart.y + dy * t; if (Math.sqrt((ax - projX)*(ax - projX) + (ay - projY)*(ay - projY)) < dashWidth) { attacks.splice(i, 1); arenaParticles.push({ x: ax, y: ay, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 20, maxLife: 20, color: "#44ff44", size: 3 }); } } }
    _superState.screenShakeAmount = 15; addShockwaveRing(heart.x, heart.y, "#44ff44", 400, 0.5, 5);
    spawnFloatingText(heart.x, heart.y - 30, "РЫВОК! -8%", "#44ff44");
}

function deactivateDeku100() { if (!_superState.dekusActive) return; var ab = superAbilities["Деку (100%)"]; if (ab.onDeactivate) ab.onDeactivate(); _activeSuperName = null; startCooldown("Деку (100%)", ab.cooldown); updateSuperButton(); }

// ====== ВТОРОЙ СКИЛЛ ВСЕМОГУЩЕГО ======
function activateAllmightHurricane() { if (!_allmightHurricaneReady) return; if (_allmightHurricaneCooldown > 0) return; if (!arenaActive) return; _superState.allmightHurricane = true; _superState.allmightHurricaneTimer = 2.0; _superState.allmightHurricaneAngle = 0; _allmightHurricaneCooldown = 5.0; var hurricaneRadius = 150; for (var a of attacks) { var ax = a.x + (a.size || a.radius || 20) / 2; var ay = a.y + (a.size || a.radius || 20) / 2; var dist = Math.hypot(ax - heart.x, ay - heart.y); if (dist < hurricaneRadius) { var dx = ax - heart.x; var dy = ay - heart.y; var d = Math.sqrt(dx*dx + dy*dy) || 1; a.spd = (a.spd || 0) + (dx / d) * 8 + (dy / d) * 4; a.spdY = (a.spdY || 0) + (dy / d) * 8 - (dx / d) * 4; } } addShockwaveRing(heart.x, heart.y, "#00ffff", 400, 0.5, 6); _superState.screenShakeAmount = 15; spawnFloatingText(heart.x, heart.y - 40, "УРАГАН!", "#00ffff"); }

// ====== УПРАВЛЕНИЕ ======
function getMainCard() { if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) { var idx = team[mainCardIndex]; if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) return myCards[idx]; } return null; }

function toggleSuper() { if (!arenaActive) return; var mainCard = getMainCard(); if (!mainCard) return; if (mainCard.name === "Всемогущий (прайм)" && _allmightHurricaneReady) { activateAllmightHurricane(); return; } if (mainCard.name === "Деку (100%)") { if (!_superState.dekusActive) { var ab = superAbilities["Деку (100%)"]; ab.onActivate(); _activeSuperName = "Деку (100%)"; updateSuperButton(); return; } else { activateDekuEarthShatter(); return; } } if (!superAbilities[mainCard.name]) return; var ab = superAbilities[mainCard.name]; if (ab.cooldown === 0 && !ab.toggleable) return; var cd = _superCooldowns[mainCard.name] || { ready: true }; if (!cd.ready) return; if (ab.toggleable) { if (_activeSuperName === mainCard.name) { if (ab.onDeactivate) ab.onDeactivate(); _activeSuperName = null; startCooldown(mainCard.name, ab.cooldown); } else { if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) superAbilities[_activeSuperName].onDeactivate(); ab.onActivate(); _activeSuperName = mainCard.name; } } else { ab.onActivate(); if (ab.duration > 0) { startCooldown(mainCard.name, ab.cooldown); setTimeout(function() { if (ab.onDeactivate) ab.onDeactivate(); if (_activeSuperName === mainCard.name) _activeSuperName = null; }, ab.duration); } else { startCooldown(mainCard.name, ab.cooldown); } } updateSuperButton(); }
function startCooldown(cardName, ms) { var cd = _superCooldowns[cardName]; if (cd && cd.interval) clearInterval(cd.interval); _superCooldowns[cardName] = { ready: false, remaining: ms, start: Date.now() }; var interval = setInterval(function() { var elapsed = Date.now() - _superCooldowns[cardName].start; _superCooldowns[cardName].remaining = ms - elapsed; if (_superCooldowns[cardName].remaining <= 0) { clearInterval(interval); _superCooldowns[cardName].ready = true; updateSuperButton(); } else updateSuperButton(); }, 100); _superCooldowns[cardName].interval = interval; }
function resetAllCooldowns() { for (var key in _superCooldowns) { if (_superCooldowns[key].interval) clearInterval(_superCooldowns[key].interval); } _superCooldowns = {}; _allmightHurricaneReady = false; _allmightHurricaneCooldown = 0; _superState.dekuEarthShatterReady = false; _superState.dekuDashSmashReady = false; _superState.dekuEarthShatterCooldown = 0; _superState.dekuDashSmashCooldown = 0; updateSuperButton(); }

function updateSuperButton() { var btn = document.getElementById("superBtn"); var btn2 = document.getElementById("superBtn2"); var btnDeact = document.getElementById("superBtnDeactivate"); if (!btn) return; var mainCard = getMainCard(); if (!mainCard) { btn.style.display = "none"; if (btn2) btn2.style.display = "none"; if (btnDeact) btnDeact.style.display = "none"; return; } if (mainCard.name === "Деку (100%)") { if (!_superState.dekusActive) { btn.style.display = "block"; if (btn2) btn2.style.display = "none"; if (btnDeact) btnDeact.style.display = "none"; var cd = _superCooldowns["Деку (100%)"]; if (cd && !cd.ready) { var sec = Math.ceil(cd.remaining / 1000); btn.textContent = "⏳ 100% (" + sec + "с)"; btn.style.background = "#555"; btn.style.animation = "none"; } else { btn.textContent = "💚 100%"; btn.style.background = "linear-gradient(135deg, #44ff44, #00aa00)"; btn.style.animation = "superPulse 2s infinite"; } } else { btn.style.display = "block"; if (btn2) btn2.style.display = "block"; if (btnDeact) btnDeact.style.display = "block"; if (_superState.dekuEarthShatterCooldown > 0) { btn.textContent = "⏳ РАЗЛОМ (" + Math.ceil(_superState.dekuEarthShatterCooldown) + "с)"; btn.style.background = "#555"; btn.style.animation = "none"; } else { btn.textContent = "💥 РАЗЛОМ"; btn.style.background = "linear-gradient(135deg, #ff8800, #ff4400)"; btn.style.animation = "superPulse 2s infinite"; } if (btn2) { if (_superState.dekuDashSmashCooldown > 0) { btn2.textContent = "⏳ РЫВОК (" + Math.ceil(_superState.dekuDashSmashCooldown) + "с)"; btn2.style.background = "#555"; btn2.style.animation = "none"; } else { btn2.textContent = "💨 РЫВОК"; btn2.style.background = "linear-gradient(135deg, #44ff44, #00ffff)"; btn2.style.animation = "superPulse 2s infinite"; } } } return; } if (btn2) btn2.style.display = "none"; if (btnDeact) btnDeact.style.display = "none"; if (mainCard.name === "Всемогущий (прайм)" && _allmightHurricaneReady) { btn.style.display = "block"; if (_allmightHurricaneCooldown > 0) { btn.textContent = "🌪️ УРАГАН (" + Math.ceil(_allmightHurricaneCooldown) + "с)"; btn.style.background = "#555"; btn.style.animation = "none"; } else { btn.textContent = "🌪️ УРАГАН"; btn.style.background = "linear-gradient(135deg, #00ffff, #0088ff)"; btn.style.animation = "superPulse 2s infinite"; } return; } if (!superAbilities[mainCard.name]) { btn.style.display = "none"; return; } var ab = superAbilities[mainCard.name]; if (ab.cooldown === 0 && !ab.toggleable) { btn.style.display = "none"; return; } btn.style.display = "block"; var cd = _superCooldowns[mainCard.name]; if (_activeSuperName === mainCard.name) { btn.textContent = "⏹ " + ab.name + " (АКТИВЕН)"; btn.style.background = "#ff4444"; btn.style.animation = "none"; } else if (cd && !cd.ready) { var sec = Math.ceil(cd.remaining / 1000); btn.textContent = "⏳ " + ab.name + " (" + sec + "с)"; btn.style.background = "#555"; btn.style.animation = "none"; } else { btn.textContent = "⚡ " + ab.name; btn.style.background = "linear-gradient(135deg, #f5af19, #f12711)"; btn.style.animation = "superPulse 2s infinite"; } }

function resetAllSupers() { if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) superAbilities[_activeSuperName].onDeactivate(); _activeSuperName = null; if (_superState.nikaActive) { heart.hitbox = _superState.nikaHitboxOriginal; heart.size = _superState.nikaSizeOriginal; } if (_superState.antispiralActive) { heart.hitbox = _superState.antispiralOrigHitbox; heart.size = _superState.antispiralOrigSize; heartSpeed = _superState.antispiralOrigSpeed; } _superState.dekusActive = false; _superState.dekusDmgMult = 1; _superState.dekusParticles = false; _superState.dekuEarthShatterReady = false; _superState.dekuDashSmashReady = false; _superState.dekuEarthShatterCooldown = 0; _superState.dekuDashSmashCooldown = 0; _superState.dekuSmashActive = false; _superState.dekuFists = []; _superState.borosHeal = null; _superState.borosParticles = false; _superState.usoppInvuln = false; _superState.usoppStunTimer = 0; _superState.nikaActive = false; _superState.nikaDmgMult = 1; _superState.positionHistory = []; _superState.garouMarker = null; _superState.garouInvulnTimer = 0; _superState.garouTimeStop = false; _superState.garpChargeTimer = 0; _superState.garpImpactActive = false; _superState.garpHakiActive = false; _superState.garpHakiTimer = 0; _superState.antispiralActive = false; _superState.antispiralShrinkAttacks = false; _superState.imAuraActive = false; _superState.imSpeedPenalty = false; _superState.kaidoDrinking = false; _superState.kaidoBuffActive = false; _superState.kaidoDmgReduction = false; _superState.kaidoDmgBonus = 1; _superState.kaidoSpeedBonus = 1; _superState.invertControls = false; _superState.kaidoScream = false; _superState.allmightDmgMult = 1; _superState.allmightBuffTimer = 0; _superState.allmightShockwave = 0; _superState.allmightDebuffActive = false; _superState.allmightDebuffTimer = 0; _superState.allmightDebuffDmgMult = 1; _superState.allmightHurricane = false; _superState.allmightHurricaneTimer = 0; _superState.allmightHurricaneAngle = 0; _superState.markBuffActive = false; _superState.markBuffTimer = 0; _superState.markDmgReduction = 1; _superState.markDmgBonus = 1; _superState.markSpeedBonus = 1; _superState.dandyLightnings = false; _superState.dandyInvuln = false; _superState.dandyDmgBuff = null; _superState.dandyShield = null; _superState.dandyVulnerable = null; _superState.dandyDoubleTargets = false; _superState.dandyRoulette = null; _superState.dandyDarkness = 0; _superState.dandyAura = 0; _superState.dandyLava = 0; _superState.dandyAutoRevive = false; _superState.fists = []; _superState.rings = []; _superState.realityCracks = []; _superState.earthCracks = []; _superState.dekuExplosions = []; _superState.dekuDash = null; _superState.comicTexts = []; _superState.screenShakeAmount = 0; _superState.screenFlashWhite = 0; _allmightHurricaneReady = false; _allmightHurricaneCooldown = 0; var btnDeact = document.getElementById("superBtnDeactivate"); if (btnDeact) btnDeact.style.display = "none"; resetAllCooldowns(); }
function initSuperState() { _activeSuperName = null; resetAllSupers(); _superState.markResurrectCharges = 2; _superLastTick = performance.now(); updateSuperButton(); }

function tickSupers() { if (!arenaActive || !ctx) return; var now = performance.now(); var dt = (now - _superLastTick) / 1000; if (dt <= 0) dt = 0.016; _superLastTick = now; if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onTick) superAbilities[_activeSuperName].onTick(dt); if (_superState.borosHeal && _superState.borosHeal.active && superAbilities["Борос"] && superAbilities["Борос"].onTick) superAbilities["Борос"].onTick(dt); if (_superState.dekusActive && _superState.dekuEarthShatterCooldown > 0) { _superState.dekuEarthShatterCooldown -= dt; if (_superState.dekuEarthShatterCooldown <= 0) { _superState.dekuEarthShatterCooldown = 0; _superState.dekuEarthShatterReady = true; updateSuperButton(); } else updateSuperButton(); } if (_superState.dekusActive && _superState.dekuDashSmashCooldown > 0) { _superState.dekuDashSmashCooldown -= dt; if (_superState.dekuDashSmashCooldown <= 0) { _superState.dekuDashSmashCooldown = 0; _superState.dekuDashSmashReady = true; updateSuperButton(); } else updateSuperButton(); } if (_superState.dekuDash) { _superState.dekuDash.life -= dt; if (_superState.dekuDash.life <= 0) { _superState.dekuDash = null; } else { var speed = _superState.dekuDash.distance / 0.4; var moveX = _superState.dekuDash.dirX * speed * dt; var moveY = _superState.dekuDash.dirY * speed * dt; heart.x += moveX; heart.y += moveY; _superState.dekuDash.trail.push({ x: heart.x, y: heart.y, life: 0.3 }); clampHeart(); var dashWidth = 60; for (var i = attacks.length - 1; i >= 0; i--) { var a = attacks[i]; var ax = a.x + (a.size || a.radius || 20) / 2; var ay = a.y + (a.size || a.radius || 20) / 2; var dist = Math.sqrt((ax - heart.x)*(ax - heart.x) + (ay - heart.y)*(ay - heart.y)); if (dist < dashWidth) { attacks.splice(i, 1); arenaParticles.push({ x: ax, y: ay, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 20, maxLife: 20, color: "#44ff44", size: 3 }); } } } } for (var i = _superState.dekuExplosions.length - 1; i >= 0; i--) { _superState.dekuExplosions[i].life -= dt; if (_superState.dekuExplosions[i].life <= 0) _superState.dekuExplosions.splice(i, 1); } if (_allmightHurricaneReady && _allmightHurricaneCooldown > 0) { _allmightHurricaneCooldown -= dt; if (_allmightHurricaneCooldown < 0) _allmightHurricaneCooldown = 0; updateSuperButton(); }
    
    // Деку: Разлом — таймеры
    if (_superState.dekuSmashActive) {
        if (_superState.dekuSmashBlackoutTimer > 0) _superState.dekuSmashBlackoutTimer--;
        if (_superState.dekuSmashSequenceTimer > 0) {
            _superState.dekuSmashSequenceTimer--;
            // Активируем кулаки по очереди
            for (var i = 0; i < _superState.dekuFists.length; i++) {
                var fist = _superState.dekuFists[i];
                if (!fist.active && _superState.dekuSmashSequenceTimer <= (150 - fist.delay)) {
                    fist.active = true;
                    // Ломаем блоки
                    for (var j = attacks.length - 1; j >= 0; j--) {
                        var a = attacks[j];
                        var dx = a.x - fist.x;
                        var dy = a.y - fist.y;
                        if (Math.sqrt(dx*dx + dy*dy) < fist.radius + 35) {
                            attacks.splice(j, 1);
                            for (var k = 0; k < 6; k++) {
                                arenaParticles.push({ x: a.x, y: a.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 30, maxLife: 30, color: "#50c878", size: 4+Math.random()*4 });
                            }
                        }
                    }
                    _superState.screenShakeAmount = Math.max(_superState.screenShakeAmount, 20);
                }
            }
        } else {
            // Возвращаем всё в норму
            _superState.dekuSmashActive = false;
            heartSpeed = _superState.originalHeartSpeed;
            arenaGlobalSpeedMod = 1.0;
            if (typeof arenaDodgeTimerInterval !== 'undefined' && arenaDodgeTimerInterval) {
                clearInterval(arenaDodgeTimerInterval);
                arenaDodgeTimerInterval = setInterval(function() {
                    if (typeof arenaPhase !== 'undefined' && arenaPhase === "dodge" && typeof arenaActive !== 'undefined' && arenaActive) {
                        if (typeof arenaDodgeTimer !== 'undefined') arenaDodgeTimer--;
                        if (typeof arenaDodgeTimer !== 'undefined' && arenaDodgeTimer <= 0) arenaDodgeTimer = 0;
                        if (typeof updateDodgeTimerDisplay === 'function') updateDodgeTimerDisplay();
                    }
                }, 1000);
            }
        }
    }
    
    updateSuperLogic(dt); updateSuperButton(); }

function updateSuperLogic(dt) { var mainCard = getMainCard(); if (_superState.screenShakeAmount > 0) _superState.screenShakeAmount -= dt * 5; if (_superState.screenFlashWhite > 0) _superState.screenFlashWhite -= dt * 25; for (var i = _superState.rings.length - 1; i >= 0; i--) { var r = _superState.rings[i]; r.radius += r.speed * dt; r.life -= dt; if (r.life <= 0) _superState.rings.splice(i, 1); } for (var i = _superState.realityCracks.length - 1; i >= 0; i--) { _superState.realityCracks[i].life -= dt; if (_superState.realityCracks[i].life <= 0) _superState.realityCracks.splice(i, 1); } for (var i = _superState.earthCracks.length - 1; i >= 0; i--) { _superState.earthCracks[i].life -= dt; if (_superState.earthCracks[i].life <= 0) _superState.earthCracks.splice(i, 1); } if (_superState.dekuDash && _superState.dekuDash.trail) { for (var i = _superState.dekuDash.trail.length - 1; i >= 0; i--) { _superState.dekuDash.trail[i].life -= dt; if (_superState.dekuDash.trail[i].life <= 0) _superState.dekuDash.trail.splice(i, 1); } } for (var i = _superState.comicTexts.length - 1; i >= 0; i--) { _superState.comicTexts[i].alpha -= dt * 0.8; _superState.comicTexts[i].y -= dt * 10; if (_superState.comicTexts[i].alpha <= 0) _superState.comicTexts.splice(i, 1); } if (_superState.allmightHurricane) { _superState.allmightHurricaneTimer -= dt; _superState.allmightHurricaneAngle += dt * 25; if (_superState.allmightHurricaneTimer <= 0) { _superState.allmightHurricane = false; } } if (_superState.garpChargeTimer > 0) { _superState.garpChargeTimer -= dt; if (_superState.garpChargeTimer <= 0) { _superState.garpChargeTimer = 0; heartSpeed /= 0.3; _superState.garpImpactActive = true; _superState.garpImpactRadius = 0; _superState.garpImpactX = heart.x; _superState.garpImpactY = heart.y; arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.90); _superState.screenShakeAmount = 45; _superState.screenFlashWhite = 15; spawnFloatingText(heart.x, heart.y - 40, "ГАЛАКТИЧЕСКИЙ УДАР!!!", "#8844ff"); if (typeof sfxArenaVictory === 'function') sfxArenaVictory(); _superState.garpHakiActive = true; _superState.garpHakiTimer = 9.0; heartSpeed *= 1.25; spawnFloatingText(heart.x, heart.y - 30, "ХАКИ!", "#ff4444"); } } if (_superState.garpImpactActive) { _superState.garpImpactRadius += dt * 700; if (_superState.garpImpactRadius > 250) { _superState.garpImpactActive = false; } for (var j = attacks.length - 1; j >= 0; j--) { var a = attacks[j]; var ax = a.x + (a.size || a.radius || 20) / 2; var ay = a.y + (a.size || a.radius || 20) / 2; if (Math.hypot(ax - _superState.garpImpactX, ay - _superState.garpImpactY) < _superState.garpImpactRadius) { attacks.splice(j, 1); arenaParticles.push({ x: ax, y: ay, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 25, maxLife: 25, color: "#8844ff", size: 4 }); } } } if (_superState.garpHakiActive) { _superState.garpHakiTimer -= dt; if (_superState.garpHakiTimer <= 0) { _superState.garpHakiActive = false; heartSpeed /= 1.25; } } if (_superState.allmightDebuffActive) { _superState.allmightDebuffTimer -= dt; if (_superState.allmightDebuffTimer <= 0) { _superState.allmightDebuffActive = false; } } if (_superState.markBuffActive) { _superState.markBuffTimer -= dt; if (_superState.markBuffTimer <= 0) { _superState.markBuffActive = false; heartSpeed /= _superState.markSpeedBonus; _superState.markDmgReduction = 1; _superState.markDmgBonus = 1; _superState.markSpeedBonus = 1; } } if (typeof arenaPhase !== 'undefined' && arenaPhase === "dodge" && mainCard && mainCard.name === "Космический Гароу") { var now = performance.now(); _superState.positionHistory.push({ time: now, x: heart.x, y: heart.y }); while (_superState.positionHistory.length > 0 && now - _superState.positionHistory[0].time > 5000) _superState.positionHistory.shift(); } if (_superState.usoppStunTimer > 0) { _superState.usoppStunTimer -= dt; if (_superState.usoppStunTimer < 0) _superState.usoppStunTimer = 0; } if (_superState.garouInvulnTimer > 0) { _superState.garouInvulnTimer -= dt; if (_superState.garouInvulnTimer < 0) _superState.garouInvulnTimer = 0; } if (_superState.allmightBuffTimer > 0) { _superState.allmightBuffTimer -= dt; if (_superState.allmightBuffTimer < 0) _superState.allmightBuffTimer = 0; } if (_superState.allmightShockwave > 0) _superState.allmightShockwave -= dt; if (_superState.dandyDmgBuff) { _superState.dandyDmgBuff.timer -= dt; if (_superState.dandyDmgBuff.timer <= 0) _superState.dandyDmgBuff = null; } if (_superState.dandyShield) { _superState.dandyShield.timer -= dt; if (_superState.dandyShield.timer <= 0) _superState.dandyShield = null; } if (_superState.dandyVulnerable) { _superState.dandyVulnerable.timer -= dt; if (_superState.dandyVulnerable.timer <= 0) _superState.dandyVulnerable = null; } if (_superState.dandyDarkness > 0) { _superState.dandyDarkness -= dt; if (_superState.dandyDarkness < 0) _superState.dandyDarkness = 0; } if (_superState.dandyAura > 0) { _superState.dandyAura -= dt; if (_superState.dandyAura < 0) _superState.dandyAura = 0; } if (_superState.dandyLava > 0) { _superState.dandyLava -= dt; if (_superState.dandyLava < 0) _superState.dandyLava = 0; } if (_superState.garouMarker) { var elapsed = (performance.now() - _superState.garouMarker.time) / 1000; if (elapsed > 1.5) _superState.garouMarker = null; else _superState.garouMarker.alpha = 1 - elapsed / 1.5; }
    // Изумрудные молнии Деку
    if (_superState.dekusParticles && arenaActive) { if (Math.random() < 0.2) { for (var i = 0; i < 3; i++) { var angle = Math.random() * Math.PI * 2; var dist = 20 + Math.random() * 30; arenaParticles.push({ x: heart.x + Math.cos(angle) * 5, y: heart.y + Math.sin(angle) * 5, endX: heart.x + Math.cos(angle) * dist, endY: heart.y + Math.sin(angle) * dist, vx: 0, vy: 0, life: 18, maxLife: 18, color: "#000000", innerColor: "#50c878", isLightning: true, width: 4 }); } } }
    if (_superState.borosParticles && arenaActive) { for (var i = 0; i < 3; i++) arenaParticles.push({ x: heart.x + (Math.random() - 0.5) * 50, y: heart.y + (Math.random() - 0.5) * 50, vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 3, life: 35, maxLife: 35, color: "#66ff66", size: 3 + Math.random() * 5 }); } if (_superState.dandyLightnings && arenaActive) { for (var i = 0; i < 4; i++) { var angle = Math.random() * Math.PI * 2; var dist = 25 + Math.random() * 40; arenaParticles.push({ x: heart.x + Math.cos(angle) * 10, y: heart.y + Math.sin(angle) * 10, endX: heart.x + Math.cos(angle) * dist, endY: heart.y + Math.sin(angle) * dist, vx: 0, vy: 0, life: 20, maxLife: 20, color: "#ffff00", isLightning: true }); } } if (_superState.allmightBuffTimer > 0 && arenaActive) { _superState.allmightShockwave += dt; if (_superState.allmightShockwave >= 1.0) { _superState.allmightShockwave -= 1.0; arenaShockwaves.push({ x: heart.x, y: heart.y, r: 10, v: 15, life: 25, maxLife: 25, color: "rgba(255, 215, 0, 0.8)" }); for (var a of attacks) { var dx = (a.x + (a.size || 20) / 2) - heart.x; var dy = (a.y + (a.size || 20) / 2) - heart.y; var dist = Math.sqrt(dx * dx + dy * dy) || 1; a.spd = (a.spd || 0) + (dx / dist) * 3; a.spdY = (a.spdY || 0) + (dy / dist) * 3; } } } for (var i = _superState.fists.length - 1; i >= 0; i--) { var f = _superState.fists[i]; f.x += f.vx; f.y += f.vy; f.life--; if (f.life % 3 === 0 && f.life > 0) arenaParticles.push({ x: f.x + (Math.random() - 0.5) * f.size, y: f.y + (Math.random() - 0.5) * f.size, vx: 0, vy: 0, life: 15, maxLife: 15, color: "#ff4444", size: 5 + Math.random() * 5 }); var pathWidth = f.pathWidth || 120; for (var j = attacks.length - 1; j >= 0; j--) { var a = attacks[j]; var ax = a.x + (a.size || a.radius || 20) / 2; var ay = a.y + (a.size || a.radius || 20) / 2; if (Math.abs(ax - f.x) < pathWidth / 2 && Math.abs(ay - f.y) < f.size + 20) { _superState.screenShakeAmount = Math.max(_superState.screenShakeAmount, 10); addShockwaveRing(ax, ay, "#ffaa00", 200, 0.3, 2); for (var p = 0; p < 20; p++) arenaParticles.push({ x: ax, y: ay, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: 25, maxLife: 25, color: "#ffaa00", size: 2 + Math.random() * 6 }); attacks.splice(j, 1); if (typeof sfxBounce === 'function') sfxBounce(); } } if (f.willOneshot && !f.oneshotChecked && arenaBossMaxHP > 0) { f.oneshotChecked = true; arenaBossMaxHP = 0; _superState.screenFlashWhite = 20; _superState.screenShakeAmount = 50; for (var p = 0; p < 100; p++) arenaParticles.push({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 40, maxLife: 40, color: "#ffffff", size: 3 + Math.random() * 8 }); if (typeof sfxArenaVictory === 'function') sfxArenaVictory(); if (typeof winArena === 'function') winArena(); _superState.fists.splice(i, 1); break; } if (f.life <= 0 || f.y < -150 || f.y > 650 || f.x < -50 || f.x > 450) _superState.fists.splice(i, 1); } }

function renderSuperVisuals() { if (!ctx) return; if (_superState.realityCracks.length > 0) { ctx.save(); ctx.strokeStyle = "rgba(0, 255, 255, 0.9)"; ctx.lineWidth = 3; ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 10; _superState.realityCracks.forEach(function(cr) { ctx.globalAlpha = cr.life; ctx.beginPath(); ctx.moveTo(cr.x1, cr.y1); var cx = cr.x1, cy = cr.y1; for(var i=1; i<=4; i++) { var t = i / 4; cx = cr.x1 + (cr.x2 - cr.x1) * t + (Math.random()-0.5)*40; cy = cr.y1 + (cr.y2 - cr.y1) * t + (Math.random()-0.5)*40; ctx.lineTo(cx, cy); } ctx.stroke(); }); ctx.restore(); }
    // Деку: отрисовка кулаков Разлома
    if (_superState.dekuSmashActive && _superState.dekuFists.length > 0) {
        ctx.save();
        for (var i = 0; i < _superState.dekuFists.length; i++) {
            var fist = _superState.dekuFists[i];
            if (!fist.active) continue;
            ctx.translate(fist.x, fist.y);
            ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 25;
            ctx.fillStyle = "#110000"; ctx.beginPath(); ctx.arc(0, 0, fist.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ff6600"; ctx.beginPath(); ctx.arc(0, 0, fist.radius * 0.75, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffcc00";
            for(var p = -1.5; p <= 1.5; p++) { ctx.fillRect(p * 20 - 8, -fist.radius*0.4, 16, fist.radius*0.8); }
            ctx.fillRect(-fist.radius*0.6, -10, 20, 30);
            ctx.fillStyle = "#ff69b4"; ctx.globalAlpha = 0.9;
            ctx.beginPath(); ctx.arc(-15, -15, fist.radius * 0.35, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }
    if (_superState.dekuExplosions.length > 0) { ctx.save(); _superState.dekuExplosions.forEach(function(exp) { var alpha = exp.life / exp.maxLife; var radius = 40 * (1 - alpha); var grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, Math.max(0.1, radius)); grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); grad.addColorStop(0.3, 'rgba(68, 255, 68, 0.6)'); grad.addColorStop(0.7, 'rgba(0, 200, 0, 0.2)'); grad.addColorStop(1, 'rgba(0, 100, 0, 0)'); ctx.fillStyle = grad; ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(exp.x, exp.y, Math.max(0.1, radius), 0, Math.PI * 2); ctx.fill(); }); ctx.restore(); } if (_superState.earthCracks.length > 0) { ctx.save(); ctx.strokeStyle = "rgba(68, 255, 68, 0.9)"; ctx.lineWidth = 2.5; ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 8; _superState.earthCracks.forEach(function(cr) { ctx.globalAlpha = cr.life; ctx.beginPath(); var startX = cr.x; var startY = cr.y; ctx.moveTo(startX, startY); var endX = startX + Math.cos(cr.angle) * cr.length; var endY = startY + Math.sin(cr.angle) * cr.length; ctx.lineTo(endX, endY); for (var b = 0; b < 2; b++) { var bx = startX + (endX - startX) * (0.3 + Math.random() * 0.5); var by = startY + (endY - startY) * (0.3 + Math.random() * 0.5); var bAngle = cr.angle + (Math.random() - 0.5) * 1.2; var bLen = cr.length * (0.2 + Math.random() * 0.3); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(bAngle) * bLen, by + Math.sin(bAngle) * bLen); } ctx.stroke(); }); ctx.restore(); } if (_superState.dekuDash && _superState.dekuDash.trail && _superState.dekuDash.trail.length > 0) { ctx.save(); ctx.globalAlpha = 0.6; for (var t of _superState.dekuDash.trail) { ctx.fillStyle = "#44ff44"; ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(0.1, heart.size * 0.8 * (t.life / 0.3)), 0, Math.PI * 2); ctx.fill(); } ctx.restore(); } if (_superState.imAuraActive && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = "#ff0000"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.ellipse(130, 100, 30, 8, -0.2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(130, 100, 4, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#ff0000"; ctx.beginPath(); ctx.ellipse(270, 100, 30, 8, 0.2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(270, 100, 4, 0, Math.PI*2); ctx.fill(); ctx.restore(); } for (var r of _superState.rings) { ctx.save(); ctx.globalAlpha = Math.max(0, r.life / r.maxLife); ctx.strokeStyle = r.color; ctx.lineWidth = r.width; ctx.shadowColor = r.color; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(r.x, r.y, Math.max(0.1, r.radius), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } if (_superState.screenFlashWhite > 0) { ctx.save(); ctx.fillStyle = "#ffffff"; ctx.globalAlpha = Math.min(1, _superState.screenFlashWhite / 10); ctx.fillRect(0, 0, 400, 500); ctx.restore(); } if (_superState.dekusActive && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); var glowPulse = 1.0 + Math.sin(performance.now() / 60) * 0.2; ctx.strokeStyle = "#44ff44"; ctx.lineWidth = 3; ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 1.8 * glowPulse), 0, Math.PI*2); ctx.stroke(); ctx.restore(); } if (_superState.garpChargeTimer > 0 && typeof arenaActive !== 'undefined' && arenaActive) { if (Math.random() < 0.6) drawHakiLightning(heart.x, heart.y, 90, 1.0, 1.5, "#ff0000"); if (Math.random() < 0.4) drawHakiLightning(heart.x, heart.y, 120, 0.8, 1, "#4444ff"); ctx.save(); var chargePower = 1.2 - _superState.garpChargeTimer; ctx.translate(heart.x, heart.y); ctx.rotate(performance.now() / 200); ctx.beginPath(); ctx.arc(0, 0, 40 + chargePower * 30, 0, Math.PI * 2); ctx.fillStyle = "rgba(136, 68, 255, 0.15)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"; ctx.setLineDash([10, 15]); ctx.stroke(); ctx.restore(); } if (_superState.garpImpactActive && typeof arenaActive !== 'undefined' && arenaActive) { var cx = _superState.garpImpactX; var cy = _superState.garpImpactY; var r = _superState.garpImpactRadius; var progress = r / 200; var alpha = 1 - Math.pow(progress, 3); ctx.save(); ctx.globalAlpha = alpha; var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(0.1, r)); grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.1, "#ff44ff"); grad.addColorStop(0.4, "#220088"); grad.addColorStop(0.8, "#050022"); grad.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2); ctx.fill(); for(var i = 0; i < 30; i++) { var sAngle = Math.random() * Math.PI * 2; var sDist = Math.random() * r * 0.9; var sx = cx + Math.cos(sAngle + progress * 2) * sDist; var sy = cy + Math.sin(sAngle + progress * 2) * sDist; ctx.fillStyle = (Math.random() > 0.5) ? "#ffffff" : "#ffccff"; ctx.beginPath(); ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill(); } ctx.strokeStyle = "#ff44ff"; ctx.lineWidth = 15 * (1 - progress); ctx.shadowColor = "#ff44ff"; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2); ctx.stroke(); if (Math.random() < 0.8) { drawHakiLightning(cx + Math.cos(Math.random()*Math.PI*2)*r, cy + Math.sin(Math.random()*Math.PI*2)*r, 80, alpha, 2, "#ff0000"); drawHakiLightning(cx + Math.cos(Math.random()*Math.PI*2)*r, cy + Math.sin(Math.random()*Math.PI*2)*r, 100, alpha, 2, "#ff00ff"); } ctx.restore(); } if (_superState.garpHakiActive && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 4; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 2.5), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); if (Math.random() < 0.5) drawHakiLightning(heart.x, heart.y, 80, 1.0, 1.2, "#ff0000"); } if (_superState.antispiralActive && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = "#aaddff"; ctx.lineWidth = 3; ctx.shadowColor = "#aaddff"; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 3), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.15; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 4), 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = "rgba(170, 221, 255, 0.15)"; ctx.lineWidth = 1; var gridScale = (performance.now() / 400) % 40; for(var r = gridScale; r < 200; r += 40) { ctx.beginPath(); ctx.arc(heart.x, heart.y, r, 0, Math.PI*2); ctx.stroke(); } for(var d=0; d<12; d++) { var ang = (d / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(heart.x, heart.y); ctx.lineTo(heart.x + Math.cos(ang)*200, heart.y + Math.sin(ang)*200); ctx.stroke(); } ctx.restore(); } if (getMainCard() && getMainCard().name === "Император Марк" && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); var wingTime = performance.now() / 180; var leftWingAngle = Math.sin(wingTime) * 0.25; var rightWingAngle = -Math.sin(wingTime) * 0.25; var featherGrad = ctx.createLinearGradient(0, 0, 40, 0); featherGrad.addColorStop(0, "rgba(255, 215, 0, 0.8)"); featherGrad.addColorStop(0.5, "rgba(255, 140, 0, 0.6)"); featherGrad.addColorStop(1, "rgba(255, 69, 0, 0)"); ctx.fillStyle = featherGrad; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 15; ctx.save(); ctx.translate(heart.x - 6, heart.y); ctx.rotate(Math.PI + leftWingAngle); ctx.beginPath(); ctx.ellipse(20, -5, 22, 7, 0.1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(15, -12, 18, 5, 0.3, 0, Math.PI*2); ctx.fill(); ctx.restore(); ctx.save(); ctx.translate(heart.x + 6, heart.y); ctx.rotate(rightWingAngle); ctx.beginPath(); ctx.ellipse(20, -5, 22, 7, -0.1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(15, -12, 18, 5, -0.3, 0, Math.PI*2); ctx.fill(); ctx.restore(); ctx.restore(); if (Math.random() < 0.05) { arenaParticles.push({ x: heart.x + (Math.random()-0.5)*30, y: heart.y - 10, vx: (Math.random()-0.5)*1, vy: 1 + Math.random()*1.5, life: 30, maxLife: 30, color: "#ffd700", size: 2 }); } } if (_superState.markBuffActive && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 4; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 2.5), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } drawGarouTrail(); for (var i = arenaParticles.length - 1; i >= 0; i--) { var p = arenaParticles[i]; if (p.isLightning && p.life > 0) { drawLightningBolt(p.x, p.y, p.endX, p.endY, p.color, p.life / p.maxLife, p.width || 3, p.innerColor); } } if (_superState.fists && _superState.fists.length > 0) { for (var f of _superState.fists) { if (f.life > 0) drawFist(f); } } if (_superState.garouMarker && _superState.garouMarker.alpha > 0) drawCircleMarker(_superState.garouMarker.x, _superState.garouMarker.y, "#ff8800", _superState.garouMarker.alpha, 30); if (_superState.usoppStunTimer > 0 && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); ctx.globalAlpha = 0.8; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 8; var stunAngle = performance.now() / 150; for (var i = 0; i < 4; i++) { var angle = (i / 4) * Math.PI * 2 + stunAngle; var sx = heart.x + Math.cos(angle) * (heart.size * 1.8); var sy = heart.y + Math.sin(angle) * (heart.size * 0.8) - 15; ctx.fillStyle = "#ffd700"; ctx.font = "bold 14px sans-serif"; ctx.fillText("★", sx, sy); } ctx.restore(); } if (_superState.nikaActive && typeof arenaActive !== 'undefined' && arenaActive) { var bounceBeat = 1.0 + Math.abs(Math.sin(performance.now() / 150)) * 0.2; ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * bounceBeat), 0, Math.PI*2); ctx.fill(); ctx.restore(); ctx.save(); ctx.globalAlpha = 0.55; var cloudAngle = performance.now() / 800; ctx.translate(heart.x, heart.y); ctx.rotate(cloudAngle); for (var i = 0; i < 5; i++) { var angle = (i / 5) * Math.PI * 2; var sx = Math.cos(angle) * (heart.size * 1.5); var sy = Math.sin(angle) * (heart.size * 1.5); ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#eeeeee"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI*2); ctx.fill(); } ctx.restore(); } if (_superState.borosHeal && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); var spiralTime = performance.now() / 200; var r = heart.size * 2.0; ctx.shadowBlur = 10; for(var yOffset = -25; yOffset <= 25; yOffset += 5) { var angle1 = spiralTime + (yOffset * 0.15); var angle2 = spiralTime + (yOffset * 0.15) + Math.PI; var alpha = 1.0 - Math.abs(yOffset) / 30; ctx.globalAlpha = alpha; ctx.fillStyle = "#66ff66"; ctx.shadowColor = "#66ff66"; ctx.beginPath(); ctx.arc(heart.x + Math.cos(angle1)*r, heart.y + yOffset, 2.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#00ffff"; ctx.shadowColor = "#00ffff"; ctx.beginPath(); ctx.arc(heart.x + Math.cos(angle2)*r, heart.y + yOffset, 2.5, 0, Math.PI*2); ctx.fill(); } ctx.restore(); } if (_superState.usoppInvuln && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); var ghostDist = 20 + Math.sin(performance.now() / 100) * 4; ctx.globalAlpha = 0.35; ctx.fillStyle = "rgba(255, 215, 0, 0.6)"; ctx.beginPath(); ctx.arc(heart.x - ghostDist, heart.y, Math.max(0.1, heart.size), 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(heart.x + ghostDist, heart.y, Math.max(0.1, heart.size), 0, Math.PI*2); ctx.fill(); for (var i = 0; i < 3; i++) { var angle = performance.now() / 500 + i * Math.PI * 2 / 3; var sx = heart.x + Math.cos(angle) * heart.size * 2.5; var sy = heart.y + Math.sin(angle) * heart.size * 2.5; ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 15; ctx.font = "20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("⭐", sx, sy); } ctx.restore(); } if (_superState.dandyRoulette && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); var elapsed = performance.now() - _superState.dandyRoulette.time; var duration = _superState.dandyRoulette.duration; var isSpinning = elapsed < duration; var progress = isSpinning ? elapsed / duration : 1.0; var result = _superState.dandyRoulette.result; var floatY = isSpinning ? -30 * progress : -45; ctx.translate(heart.x, heart.y - 45 + floatY); if (isSpinning) { ctx.shadowBlur = 15; ctx.shadowColor = "#ffd700"; } var outerRot = isSpinning ? elapsed * 0.01 : 0; for (var i = 0; i < 12; i++) { var ang = (i / 12) * Math.PI * 2 + outerRot; var x = Math.cos(ang) * 20; var y = Math.sin(ang) * 20; ctx.fillStyle = i % 3 === 0 ? "#ff3333" : (i % 3 === 1 ? "#ffff00" : "#33ff33"); ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill(); } ctx.strokeStyle = "cyan"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.stroke(); if (isSpinning) { var fastRot = elapsed * 0.03; for (var s = 0; s < 6; s++) { var ang = (s / 6) * Math.PI * 2 + fastRot; ctx.strokeStyle = s % 2 === 0 ? "#44ff44" : "#ff4444"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang)*14, Math.sin(ang)*14); ctx.stroke(); } } ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; if (isSpinning) { ctx.fillStyle = "#ffd700"; ctx.fillText("?", 0, 0); } else if (result) { ctx.fillStyle = result.good === true ? "#44ff44" : (result.good === false ? "#ff4444" : "#ffd700"); var shortText = result.name.length > 6 ? result.name.substring(0, 4) + ".." : result.name; ctx.fillText(shortText, 0, 0); } ctx.restore(); } if (_superState.kaidoBuffActive && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); var shieldTime = performance.now() / 250; var numScales = 3; ctx.shadowColor = "#ff4500"; ctx.shadowBlur = 15; for(var i=0; i<numScales; i++) { var angle = shieldTime + (i / numScales) * Math.PI * 2; var scaleX = heart.x + Math.cos(angle) * 30; var scaleY = heart.y + Math.sin(angle) * 30; ctx.fillStyle = "rgba(255, 69, 0, 0.85)"; ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(scaleX, scaleY - 6); ctx.lineTo(scaleX + 5, scaleY); ctx.lineTo(scaleX, scaleY + 6); ctx.lineTo(scaleX - 5, scaleY); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); } if (_superState.imAuraActive && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); var gradient = ctx.createRadialGradient(heart.x, heart.y, 40, heart.x, heart.y, 55); gradient.addColorStop(0, 'rgba(128, 0, 128, 0.1)'); gradient.addColorStop(1, 'rgba(128, 0, 128, 0.6)'); ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(heart.x, heart.y, 55, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(200, 0, 200, 0.9)"; ctx.lineWidth = 4; ctx.shadowColor = "#800080"; ctx.shadowBlur = 25; ctx.stroke(); ctx.restore(); } if (_superState.allmightPermaSlow && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = "#ff0000"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 2), 0, Math.PI * 2); ctx.fill(); ctx.restore(); } if (_superState.allmightDebuffActive && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = "#ff4444"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 2), 0, Math.PI * 2); ctx.fill(); ctx.restore(); } if (_superState.garouInvulnTimer > 0 && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 4; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(heart.x, heart.y, Math.max(0.1, heart.size * 2), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } if (_superState.allmightHurricane && typeof arenaActive !== 'undefined' && arenaActive) { ctx.save(); var vortexGrad = ctx.createRadialGradient(heart.x, heart.y, 10, heart.x, heart.y, 150); vortexGrad.addColorStop(0, 'rgba(255, 255, 255, 1)'); vortexGrad.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)'); vortexGrad.addColorStop(0.6, 'rgba(0, 150, 255, 0.4)'); vortexGrad.addColorStop(1, 'rgba(0, 100, 200, 0)'); ctx.fillStyle = vortexGrad; ctx.beginPath(); ctx.arc(heart.x, heart.y, 150, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 0.7; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 20; for (var r = 0; r < 5; r++) { var ringRadius = 30 + r * 25; var ringRotation = _superState.allmightHurricaneAngle * (1 + r * 0.5); var segments = 30; ctx.beginPath(); for (var i = 0; i <= segments; i++) { var angle = (i / segments) * Math.PI * 2 + ringRotation; var waveOffset = Math.sin(i * 3 + _superState.allmightHurricaneAngle * 5) * 15; var x = heart.x + Math.cos(angle) * (ringRadius + waveOffset); var y = heart.y + Math.sin(angle) * (ringRadius + waveOffset) * 0.5; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); ctx.stroke(); } for (var i = 0; i < 24; i++) { var angle = _superState.allmightHurricaneAngle * 3 + (i / 24) * Math.PI * 2; var dist = 30 + (i % 5) * 24; var px = heart.x + Math.cos(angle) * dist; var py = heart.y + Math.sin(angle) * dist * 0.5; ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#00ffff"; ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(px, py, 2.5 + Math.random()*2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(0, 255, 255, 0.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(angle) * 15, py - Math.sin(angle) * 15); ctx.stroke(); } ctx.globalAlpha = 0.6; for (var i = 0; i < 5; i++) { var angle = Math.random() * Math.PI * 2; drawLightningBolt(heart.x, heart.y, heart.x + Math.cos(angle) * 140, heart.y + Math.sin(angle) * 140, "#ffffff", 0.9, 3); } ctx.restore(); } if (_superState.allmightBuffTimer > 0 && typeof arenaActive !== 'undefined' && arenaActive) drawAllMightHeart(heart.x, heart.y, heart.size); if (_superState.kaidoDrinking && typeof arenaActive !== 'undefined' && arenaActive) drawBeerBottle(heart.x, heart.y, 1, true); if (_superState.comicTexts.length > 0) { _superState.comicTexts.forEach(function(t) { ctx.save(); ctx.globalAlpha = t.alpha; ctx.translate(t.x, t.y); ctx.rotate(t.angle); ctx.scale(t.scale, t.scale); ctx.font = "bold 16px Impact, Arial Black, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 4; ctx.strokeText(t.text, 0, 0); ctx.fillStyle = t.color; ctx.fillText(t.text, 0, 0); ctx.restore(); }); } }

// ====== ЭКСПОРТ ФУНКЦИЙ ======
window.toggleSuper = toggleSuper;
window.activateDekuDashSmash = activateDekuDashSmash;
window.activateDekuEarthShatter = activateDekuEarthShatter;
window.deactivateDeku100 = deactivateDeku100;
window.activateAllmightHurricane = activateAllmightHurricane;
window.initSuperState = initSuperState;
window.tickSupers = tickSupers;
window.renderSuperVisuals = renderSuperVisuals;
window.resetAllSupers = resetAllSupers;
window.resetAllCooldowns = resetAllCooldowns;
window.getMainCard = getMainCard;
