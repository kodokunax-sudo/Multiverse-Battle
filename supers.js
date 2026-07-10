// ========== СУПЕР-СПОСОБНОСТИ СЕКРЕТНЫХ КАРТ (АРЕНА) v7.0 FINAL MERGED ==========
// Объединённая версия: визуалы, Гарп, кольца, Дэнди, все 14 персонажей

let _superState = {
    fists: [],
    rings: [],
    // Деку
    dekusActive: false, dekusOriginalSpeed: 1.2, dekusDmgMult: 1, dekusParticles: false,
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
    // Им
    imAuraActive: false, imSpeedPenalty: false,
    // Дэнди
    dandyLightnings: false, dandyInvuln: false, dandyDmgBuff: null, dandyShield: null, dandyVulnerable: null, dandyDoubleTargets: false, dandyRoulette: null,
    // Кайдо
    kaidoDrinking: false, kaidoBuffActive: false, kaidoDmgReduction: false, invertControls: false, kaidoScream: false,
    // Марк
    markResurrectUsed: false,
    // Всемогущий
    allmightPermaSlow: false, allmightDmgMult: 1, allmightBuffTimer: 0, allmightOrigSize: 14, allmightOrigHitbox: 4, allmightShockwave: 0,
    // Анти-спираль
    antispiralFrozen: false, antispiralSpeedBoost: false,
    // Общие
    screenShakeAmount: 0, screenFlashWhite: 0,
};

let _superCooldowns = {};
let _activeSuperName = null;
let _superLastTick = 0;

// ====== МЕГА ФУНКЦИИ ОТРИСОВКИ ======
function drawHakiLightning(x, y, maxDist, alpha, widthMod = 1) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    let angle = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let cx = x, cy = y;
    let steps = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < steps; i++) {
        angle += (Math.random() - 0.5) * 2.0;
        cx += Math.cos(angle) * (maxDist / steps);
        cy += Math.sin(angle) * (maxDist / steps);
        ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 6 * widthMod;
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2 * widthMod;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
}

function addShockwaveRing(x, y, color, speed, maxLife, width = 4) {
    _superState.rings.push({ x, y, radius: 10, color, speed, life: maxLife, maxLife, width });
}

function drawLightningBolt(x1, y1, x2, y2, color, alpha, width = 2) {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12 * alpha;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    let segments = 5;
    for (let i = 1; i < segments; i++) {
        let t = i / segments;
        ctx.lineTo(x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30, y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30);
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawFist(f) {
    if (!ctx) return;
    let alpha = f.life > 10 ? 1 : f.life / 10;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(f.x, f.y);
    let s = f.size;
    ctx.shadowColor = f.owner === "Гарп" ? "#4444ff" : "#ff0000";
    ctx.shadowBlur = f.owner === "Гарп" ? 40 : 50;
    if (f.owner === "Гарп") {
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8})`;
            ctx.beginPath();
            ctx.arc((Math.random() - 0.5) * s * 2, (Math.random() - 0.5) * s * 2.4, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = "#1111aa";
        ctx.fillRect(-s, -s * 1.2, s * 2, s * 2.4);
        ctx.fillStyle = "#3333ff";
        ctx.fillRect(-s * 0.6, -s * 1.2, s * 0.3, s * 2.4);
        ctx.fillRect(s * 0.3, -s * 1.2, s * 0.3, s * 2.4);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
    } else {
        ctx.fillStyle = "#cc0000";
        ctx.fillRect(-s, -s * 1.2, s * 2, s * 2.4);
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(-s * 0.7, -s * 1.2, s * 0.4, s * 2.4);
        ctx.fillRect(s * 0.3, -s * 1.2, s * 0.4, s * 2.4);
        ctx.fillStyle = "#880000";
        ctx.fillRect(-s, s * 0.8, s * 2, s * 0.4);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
    }
    ctx.shadowBlur = 0;
    ctx.strokeRect(-s, -s * 1.2, s * 2, s * 2.4);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${s * 0.5}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.fillText(f.owner === "Гарп" ? "ГАЛАКТИКА" : "УДАР", 0, 0);
    ctx.restore();
}

function drawCircleMarker(x, y, color, alpha, radius = 25) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    let pulse = 1 + Math.sin(performance.now() / 100) * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawGarouTrail() {
    let mainCard = getMainCard();
    if (!mainCard || mainCard.name !== "Космический Гароу") return;
    if (!ctx || !_superState.positionHistory || _superState.positionHistory.length < 2) return;
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (let i = 1; i < _superState.positionHistory.length; i++) {
        let p1 = _superState.positionHistory[i - 1];
        let p2 = _superState.positionHistory[i];
        let age = (performance.now() - p2.time) / 2000;
        let alpha = 1 - age;
        if (alpha <= 0) continue;
        let gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradient.addColorStop(0, `rgba(255, 136, 0, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, ${alpha * 0.5})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4 * alpha;
        ctx.shadowColor = "#ff8800";
        ctx.shadowBlur = 15 * alpha;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawBeerBottle(x, y, alpha) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y - 30);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(-6, -12, 14, 22);
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(-8, -15, 16, 28);
    ctx.fillStyle = "#D2691E";
    ctx.fillRect(-6, -20, 12, 8);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-5, -24, 10, 6);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-6, -5, 12, 10);
    ctx.fillStyle = "#000";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("BEER", 0, 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -15, 16, 28);
    for (let i = 0; i < 3; i++) {
        let bx = -4 + Math.random() * 10;
        let by = -10 - Math.random() * 10;
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawGoldenHeart(hx, hy, size) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(hx, hy - 2);
    let pulse = 1.0 + Math.abs(Math.sin(performance.now() / 140)) * 0.1;
    let glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 3);
    glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
    glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 2, size * 3, 0, Math.PI * 2);
    ctx.fill();
    let heartGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 8);
    heartGrad.addColorStop(0, '#ffd700');
    heartGrad.addColorStop(1, '#b8860b');
    ctx.fillStyle = heartGrad;
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 30;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.arc(-3.5, -2, 4.5, Math.PI, 0);
    ctx.arc(3.5, -2, 4.5, Math.PI, 0);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ====== ЭФФЕКТЫ ДЭНДИ (ПОЛНЫЕ) ======
const DANDY_GOOD = [
    { name: "ПОЛНОЕ ИСЦЕЛЕНИЕ", icon: "💚", apply() { arenaHP = arenaMaxHP; document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); spawnFloatingText(heart.x, heart.y-20, "ИСЦЕЛЕНИЕ!", "#44ff44"); } },
    { name: "УРОН x2 (5с)", icon: "⚔️", apply() { _superState.dandyDmgBuff = { mult: 2, timer: 5 }; } },
    { name: "ОЧИСТКА АТАК", icon: "✨", apply() { attacks = []; arenaBlasters = []; spawnFloatingText(heart.x, heart.y-20, "ОЧИСТКА!", "#ffff00"); addShockwaveRing(heart.x, heart.y, "#ffff00", 300, 1.0); } },
    { name: "СКОРОСТЬ x1.5 (8с)", icon: "💨", apply() { heartSpeed *= 1.5; setTimeout(() => { heartSpeed /= 1.5; }, 8000); } },
    { name: "ЩИТ 50% (6с)", icon: "🛡️", apply() { _superState.dandyShield = { mult: 0.5, timer: 6 }; } },
    { name: "ЗАМЕДЛЕНИЕ АТАК (4с)", icon: "⏳", apply() { let old = arenaGlobalSpeedMod; arenaGlobalSpeedMod = 0.5; setTimeout(() => { arenaGlobalSpeedMod = old; }, 4000); } },
    { name: "-15% HP БОССА", icon: "💀", apply() { arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.85); spawnFloatingText(200, 250, "-15% БОССУ!", "#ffdd00"); } },
    { name: "НЕУЯЗВИМОСТЬ (2с)", icon: "🌟", apply() { _superState.dandyInvuln = true; setTimeout(() => { _superState.dandyInvuln = false; }, 2000); } },
    { name: "ДВОЙНЫЕ ЦЕЛИ", icon: "🎯", apply() { _superState.dandyDoubleTargets = true; } },
    { name: "МОЛНИИ (8с)", icon: "⚡", apply() { _superState.dandyLightnings = true; setTimeout(() => { _superState.dandyLightnings = false; }, 8000); } },
];

const DANDY_BAD = [
    { name: "ПОТЕРЯ 15% HP", icon: "💔", apply() { arenaHP = Math.max(0, arenaHP - arenaMaxHP * 0.15); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); spawnFloatingText(heart.x, heart.y-20, "-15% HP!", "#ff4444"); if (arenaHP <= 0 && typeof loseArena === 'function') loseArena(); } },
    { name: "СКОРОСТЬ x0.5 (6с)", icon: "🐌", apply() { heartSpeed *= 0.5; setTimeout(() => { heartSpeed /= 0.5; }, 6000); } },
    { name: "ДВОЙНОЙ УРОН (5с)", icon: "☠️", apply() { _superState.dandyVulnerable = { mult: 2, timer: 5 }; } },
    { name: "СПАВН 5 АТАК", icon: "👾", apply() { for (let i = 0; i < 5; i++) spawnAttack(); } },
    { name: "УСКОРЕНИЕ АТАК (8с)", icon: "⚡", apply() { arenaGlobalSpeedMod *= 1.5; setTimeout(() => { arenaGlobalSpeedMod /= 1.5; }, 8000); } },
    { name: "ИНВЕРТ (4с)", icon: "🔄", apply() { _superState.invertControls = true; setTimeout(() => { _superState.invertControls = false; }, 4000); } },
    { name: "+20% HP БОССА", icon: "👹", apply() { arenaBossMaxHP = Math.floor(arenaBossMaxHP * 1.2); spawnFloatingText(200, 250, "+20% БОССУ!", "#ff4444"); } },
    { name: "ОГЛУШЕНИЕ (2с)", icon: "💫", apply() { _superState.usoppStunTimer = 2; } },
    { name: "ХИТБОКС x2 (8с)", icon: "🔴", apply() { let orig = heart.hitbox; heart.hitbox *= 2; setTimeout(() => { heart.hitbox = orig; }, 8000); } },
    { name: "СЛУЧАЙНЫЙ ТЕЛЕПОРТ", icon: "🌀", apply() { heart.x = 50 + Math.random() * 300; heart.y = 50 + Math.random() * 400; clampHeart(); } },
];

// ====== ОПИСАНИЯ СПОСОБНОСТЕЙ ======
const superAbilities = {
    "Деку (100%)": {
        name: "ПОЛНОЕ 100% ПОКРЫТИЕ", cooldown: 15000, toggleable: true, duration: Infinity,
        onActivate() {
            _superState.dekusActive = true; _superState.dekusOriginalSpeed = heartSpeed; _superState.dekusDmgMult = 2; _superState.dekusParticles = true;
            heartSpeed *= 3; _superState.screenShakeAmount = 10;
            addShockwaveRing(heart.x, heart.y, "#44ff44", 400, 0.5);
            spawnFloatingText(heart.x, heart.y - 30, "100%!!!", "#44ff44");
        },
        onDeactivate() { heartSpeed = _superState.dekusOriginalSpeed; _superState.dekusActive = false; _superState.dekusDmgMult = 1; _superState.dekusParticles = false; },
        onTick(dt) { if (_superState.dekusActive && arenaActive) { let drain = arenaMaxHP * 0.02 * dt; arenaHP = Math.max(0, arenaHP - drain); document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP)); if (arenaHP <= 0 && typeof loseArena === 'function') loseArena(); } }
    },

    "Сайтама": {
        name: "ОБЫЧНЫЙ УДАР", cooldown: 12000, toggleable: false, duration: 0,
        onActivate() {
            let willOneshot = Math.random() < 0.01;
            _superState.fists.push({
                x: heart.x, y: heart.y - 30, vx: 0, vy: -2.8, size: 70, life: 100,
                color: "#ff2222", willOneshot, oneshotChecked: false, pathWidth: 120, owner: "Сайтама"
            });
            _superState.screenShakeAmount = 20;
            addShockwaveRing(heart.x, heart.y, "#ff0000", 300, 0.6);
            if (typeof sfxWhoosh === 'function') sfxWhoosh();
            spawnFloatingText(heart.x, heart.y - 40, "УДАР!", "#ff0000");
        },
        onTick() {}
    },

    "Борос": {
        name: "РЕГЕНЕРАЦИЯ", cooldown: 20000, toggleable: false, duration: 5000,
        onActivate() {
            _superState.borosHeal = { active: true, healPerSec: arenaMaxHP * 0.06, elapsed: 0, totalDuration: 5 };
            _superState.borosParticles = true; heartSpeed *= 0.7;
            addShockwaveRing(heart.x, heart.y, "#66ff66", 200, 0.8);
            spawnFloatingText(heart.x, heart.y - 30, "РЕГЕН!", "#66ff66");
        },
        onDeactivate() {
            if (_superState.borosHeal) { heartSpeed /= 0.7; _superState.borosHeal = null; _superState.borosParticles = false; }
            _superState.screenFlashWhite = 5;
        },
        onTick(dt) {
            if (_superState.borosHeal && _superState.borosHeal.active && arenaActive) {
                let h = _superState.borosHeal.healPerSec * dt;
                arenaHP = Math.min(arenaMaxHP, arenaHP + h);
                document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
                _superState.borosHeal.elapsed += dt;
                if (_superState.borosHeal.elapsed >= _superState.borosHeal.totalDuration) {
                    this.onDeactivate(); startCooldown("Борос", this.cooldown);
                }
            }
        }
    },

    "Бог Усопп": {
        name: "ЛОЖЬ СТАНОВИТСЯ ПРАВДОЙ", cooldown: 35000, toggleable: false, duration: 3000,
        onActivate() { _superState.usoppInvuln = true; spawnFloatingText(heart.x, heart.y - 30, "НЕУЯЗВИМ!", "#ffff00"); },
        onDeactivate() { _superState.usoppInvuln = false; _superState.usoppStunTimer = 2; spawnFloatingText(heart.x, heart.y - 30, "ОГЛУШЕНИЕ!", "#ff8800"); },
        onTick(dt) {}
    },

    "Луффи: Ника, Бог Солнца": {
        name: "ОСВОБОЖДЕНИЕ", cooldown: 25000, toggleable: true, duration: Infinity,
        onActivate() {
            _superState.nikaActive = true; _superState.nikaHitboxOriginal = heart.hitbox; _superState.nikaSizeOriginal = heart.size;
            heart.hitbox *= 2; heart.size *= 2; _superState.nikaDmgMult = 1.5; _superState.nikaSpeedBonus = 1.3; heartSpeed *= 1.3;
            _superState.screenFlashWhite = 8;
            addShockwaveRing(heart.x, heart.y, "#ffffff", 500, 0.8);
            spawnFloatingText(heart.x, heart.y - 40, "НИКА!", "#ffffff");
        },
        onDeactivate() { _superState.nikaActive = false; heart.hitbox = _superState.nikaHitboxOriginal; heart.size = _superState.nikaSizeOriginal; _superState.nikaDmgMult = 1; heartSpeed /= 1.3; },
        onTick(dt) {}
    },

    "Космический Гароу": {
        name: "ПОТОК ВСЕЛЕННОЙ", cooldown: 30000, toggleable: false, duration: 0,
        onActivate() {
            let now = performance.now(); let target = null;
            for (let i = _superState.positionHistory.length - 1; i >= 0; i--) {
                if (now - _superState.positionHistory[i].time >= 2000) { target = _superState.positionHistory[i]; break; }
            }
            if (!target && _superState.positionHistory.length > 0) target = _superState.positionHistory[0];
            if (target) {
                _superState.garouTimeStop = true; setTimeout(() => { _superState.garouTimeStop = false; }, 300);
                addShockwaveRing(heart.x, heart.y, "#ff8800", 400, 0.4);
                _superState.garouMarker = { x: target.x, y: target.y, alpha: 1.0, time: now };
                heart.x = target.x; heart.y = target.y;
                addShockwaveRing(heart.x, heart.y, "#ff8800", 400, 0.4);
                _superState.garouInvulnTimer = 1.0; _superState.screenShakeAmount = 15;
                spawnFloatingText(heart.x, heart.y - 30, "ТЕЛЕПОРТ!", "#ff8800");
            }
            _superState.positionHistory = [];
        },
        onTick(dt) {}
    },

    "Зено": {
        name: "СТИРАНИЕ", cooldown: 45000, toggleable: false, duration: 0,
        onActivate() {
            _superState.screenFlashWhite = 15;
            attacks = []; arenaBlasters = []; arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.9);
            if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
            spawnFloatingText(heart.x, heart.y - 30, "СТЁРТО!", "#ff00ff");
        },
        onTick() {}
    },

    "Анти-спираль": { name: "ПАССИВНАЯ", cooldown: 0, toggleable: false, duration: 0, onActivate() {}, onTick() {} },

    "Молодой Гарп": {
        name: "ГАЛАКТИЧЕСКИЙ УДАР", cooldown: 30000, toggleable: false, duration: 0,
        onActivate() {
            heartSpeed *= 0.3;
            _superState.garpChargeTimer = 1.2;
            _superState.screenShakeAmount = 10;
            spawnFloatingText(heart.x, heart.y - 40, "ЗАРЯДКА ХАКИ...", "#ff0000");
        },
        onTick(dt) {}
    },

    "Им (Правитель)": {
        name: "ТЕНЕВОЕ ПРАВЛЕНИЕ", cooldown: 30000, toggleable: true, duration: Infinity,
        onActivate() { _superState.imAuraActive = true; _superState.imSpeedPenalty = true; heartSpeed *= 0.7; spawnFloatingText(heart.x, heart.y - 30, "ТЬМА!", "#800080"); },
        onDeactivate() { _superState.imAuraActive = false; _superState.imSpeedPenalty = false; heartSpeed /= 0.7; },
        onTick(dt) {}
    },

    "Космический Дэнди": {
        name: "КОСМИЧЕСКАЯ УДАЧА", cooldown: 20000, toggleable: false, duration: 0,
        onActivate() {
            _superState.dandyRoulette = { time: performance.now(), result: null };
            setTimeout(() => {
                if (Math.random() < 0.8) {
                    let eff = DANDY_GOOD[Math.floor(Math.random() * DANDY_GOOD.length)];
                    eff.apply();
                    _superState.dandyRoulette.result = { name: eff.name, good: true };
                    spawnFloatingText(heart.x, heart.y - 30, eff.name + "!", "#44ff44");
                } else {
                    let eff = DANDY_BAD[Math.floor(Math.random() * DANDY_BAD.length)];
                    eff.apply();
                    _superState.dandyRoulette.result = { name: eff.name, good: false };
                    spawnFloatingText(heart.x, heart.y - 30, eff.name + "!", "#ff4444");
                }
            }, 1000);
        },
        onTick() {}
    },

    "Кайдо": {
        name: "ДЫХАНИЕ РАЗРУШЕНИЯ", cooldown: 25000, toggleable: false, duration: 0,
        onActivate() {
            _superState.kaidoDrinking = true; heartSpeed *= 0.5;
            spawnFloatingText(heart.x, heart.y - 30, "ГЛОТОК...", "#D2691E");
            setTimeout(() => {
                _superState.kaidoDrinking = false; heartSpeed /= 0.5;
                _superState.kaidoBuffActive = true; _superState.kaidoDmgReduction = true; _superState.invertControls = true; _superState.kaidoScream = true;
                _superState.screenShakeAmount = 25;
                spawnFloatingText(heart.x, heart.y - 40, "ЯРОСТЬ!!!", "#ff4444");
                setTimeout(() => { _superState.kaidoScream = false; }, 500);
                setTimeout(() => { _superState.kaidoBuffActive = false; _superState.kaidoDmgReduction = false; _superState.invertControls = false; }, 7000);
            }, 2000);
        },
        onTick() {}
    },

    "Император Марк": { name: "ПАССИВНАЯ", cooldown: 0, toggleable: false, duration: 0, onActivate() {}, onTick() {} },

    "Всемогущий (прайм)": {
        name: "СИМВОЛ МИРА", cooldown: 40000, toggleable: false, duration: 0,
        onActivate() {
            _superState.allmightOrigHitbox = heart.hitbox; _superState.allmightOrigSize = heart.size;
            heart.hitbox *= 2; heart.size *= 2; _superState.allmightDmgMult = 3; _superState.allmightBuffTimer = 15; _superState.allmightShockwave = 0;
            _superState.screenFlashWhite = 20;
            spawnFloatingText(heart.x, heart.y - 50, "СИМВОЛ МИРА!!!", "#ffd700");
            setTimeout(() => {
                heart.hitbox = _superState.allmightOrigHitbox; heart.size = _superState.allmightOrigSize; _superState.allmightDmgMult = 1;
                arenaHP = Math.max(1, arenaHP - Math.floor(arenaMaxHP * 0.5));
                document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
                _superState.allmightPermaSlow = true; heartSpeed *= 0.33;
                spawnFloatingText(heart.x, heart.y - 40, "ИСТОЩЕНИЕ!", "#ff0000");
                if (arenaHP <= 0 && typeof loseArena === 'function') loseArena();
            }, 15000);
        },
        onTick() {}
    }
};

// ====== УПРАВЛЕНИЕ ======
function getMainCard() { if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) { let idx = team[mainCardIndex]; if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) return myCards[idx]; } return null; }

function toggleSuper() {
    if (!arenaActive) return;
    let mainCard = getMainCard();
    if (!mainCard || !superAbilities[mainCard.name]) return;
    let ab = superAbilities[mainCard.name];
    if (ab.cooldown === 0 && !ab.toggleable) return;
    let cd = _superCooldowns[mainCard.name] || { ready: true };
    if (!cd.ready) return;
    if (ab.toggleable) {
        if (_activeSuperName === mainCard.name) { if (ab.onDeactivate) ab.onDeactivate(); _activeSuperName = null; startCooldown(mainCard.name, ab.cooldown); }
        else { if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) superAbilities[_activeSuperName].onDeactivate(); ab.onActivate(); _activeSuperName = mainCard.name; }
    } else {
        ab.onActivate();
        if (ab.duration > 0) { startCooldown(mainCard.name, ab.cooldown); setTimeout(() => { if (ab.onDeactivate) ab.onDeactivate(); if (_activeSuperName === mainCard.name) _activeSuperName = null; }, ab.duration); }
        else { startCooldown(mainCard.name, ab.cooldown); }
    }
    updateSuperButton();
}

function startCooldown(cardName, ms) {
    let cd = _superCooldowns[cardName]; if (cd && cd.interval) clearInterval(cd.interval);
    _superCooldowns[cardName] = { ready: false, remaining: ms, start: Date.now() };
    let interval = setInterval(() => { let elapsed = Date.now() - _superCooldowns[cardName].start; _superCooldowns[cardName].remaining = ms - elapsed; if (_superCooldowns[cardName].remaining <= 0) { clearInterval(interval); _superCooldowns[cardName].ready = true; updateSuperButton(); } else updateSuperButton(); }, 100);
    _superCooldowns[cardName].interval = interval;
}

function resetAllCooldowns() { for (let key in _superCooldowns) { if (_superCooldowns[key].interval) clearInterval(_superCooldowns[key].interval); } _superCooldowns = {}; updateSuperButton(); }

function updateSuperButton() {
    let btn = document.getElementById("superBtn"); if (!btn) return;
    let mainCard = getMainCard();
    if (!mainCard || !superAbilities[mainCard.name]) { btn.style.display = "none"; return; }
    let ab = superAbilities[mainCard.name];
    if (ab.cooldown === 0 && !ab.toggleable) { btn.style.display = "none"; return; }
    btn.style.display = "block";
    let cd = _superCooldowns[mainCard.name];
    if (_activeSuperName === mainCard.name) { btn.textContent = "⏹ " + ab
