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
    { name: "ПОЛНОЕ ИСЦЕЛЕНИЕ", apply() { arenaHP = arenaMaxHP; document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); spawnFloatingText(heart.x, heart.y-20, "ИСЦЕЛЕНИЕ!", "#44ff44"); } },
    { name: "УРОН x2 (5с)", apply() { _superState.dandyDmgBuff = { mult: 2, timer: 5 }; } },
    { name: "ОЧИСТКА АТАК", apply() { attacks = []; arenaBlasters = []; spawnFloatingText(heart.x, heart.y-20, "ОЧИСТКА!", "#ffff00"); addShockwaveRing(heart.x, heart.y, "#ffff00", 300, 1.0); } },
    { name: "СКОРОСТЬ x1.5 (8с)", apply() { heartSpeed *= 1.5; setTimeout(() => { heartSpeed /= 1.5; }, 8000); } },
    { name: "ЩИТ 50% (6с)", apply() { _superState.dandyShield = { mult: 0.5, timer: 6 }; } },
    { name: "ЗАМЕДЛЕНИЕ АТАК (4с)", apply() { let old = arenaGlobalSpeedMod; arenaGlobalSpeedMod = 0.5; setTimeout(() => { arenaGlobalSpeedMod = old; }, 4000); } },
    { name: "-15% HP БОССА", apply() { arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.85); spawnFloatingText(200, 250, "-15% БОССУ!", "#ffdd00"); } },
    { name: "НЕУЯЗВИМОСТЬ (2с)", apply() { _superState.dandyInvuln = true; setTimeout(() => { _superState.dandyInvuln = false; }, 2000); } },
    { name: "ДВОЙНЫЕ ЦЕЛИ", apply() { _superState.dandyDoubleTargets = true; } },
    { name: "МОЛНИИ (8с)", apply() { _superState.dandyLightnings = true; setTimeout(() => { _superState.dandyLightnings = false; }, 8000); } },
];

const DANDY_BAD = [
    { name: "ПОТЕРЯ 15% HP", apply() { arenaHP = Math.max(0, arenaHP - arenaMaxHP * 0.15); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); spawnFloatingText(heart.x, heart.y-20, "-15% HP!", "#ff4444"); if (arenaHP <= 0 && typeof loseArena === 'function') loseArena(); } },
    { name: "СКОРОСТЬ x0.5 (6с)", apply() { heartSpeed *= 0.5; setTimeout(() => { heartSpeed /= 0.5; }, 6000); } },
    { name: "ДВОЙНОЙ УРОН (5с)", apply() { _superState.dandyVulnerable = { mult: 2, timer: 5 }; } },
    { name: "СПАВН 5 АТАК", apply() { for (let i = 0; i < 5; i++) spawnAttack(); } },
    { name: "УСКОРЕНИЕ АТАК (8с)", apply() { arenaGlobalSpeedMod *= 1.5; setTimeout(() => { arenaGlobalSpeedMod /= 1.5; }, 8000); } },
    { name: "ИНВЕРТ (4с)", apply() { _superState.invertControls = true; setTimeout(() => { _superState.invertControls = false; }, 4000); } },
    { name: "+20% HP БОССА", apply() { arenaBossMaxHP = Math.floor(arenaBossMaxHP * 1.2); spawnFloatingText(200, 250, "+20% БОССУ!", "#ff4444"); } },
    { name: "ОГЛУШЕНИЕ (2с)", apply() { _superState.usoppStunTimer = 2; } },
    { name: "ХИТБОКС x2 (8с)", apply() { let orig = heart.hitbox; heart.hitbox *= 2; setTimeout(() => { heart.hitbox = orig; }, 8000); } },
    { name: "СЛУЧАЙНЫЙ ТЕЛЕПОРТ", apply() { heart.x = 50 + Math.random() * 300; heart.y = 50 + Math.random() * 400; clampHeart(); } },
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
            _superState.fists.push({ x: heart.x, y: heart.y - 30, vx: 0, vy: -2.8, size: 70, life: 100, color: "#ff2222", willOneshot, oneshotChecked: false, pathWidth: 120, owner: "Сайтама" });
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
                if (_superState.borosHeal.elapsed >= _superState.borosHeal.totalDuration) { this.onDeactivate(); startCooldown("Борос", this.cooldown); }
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
            for (let i = _superState.positionHistory.length - 1; i >= 0; i--) { if (now - _superState.positionHistory[i].time >= 2000) { target = _superState.positionHistory[i]; break; } }
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
        onActivate() { heartSpeed *= 0.3; _superState.garpChargeTimer = 1.2; _superState.screenShakeAmount = 10; spawnFloatingText(heart.x, heart.y - 40, "ЗАРЯДКА ХАКИ...", "#ff0000"); },
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
                if (Math.random() < 0.8) { let eff = DANDY_GOOD[Math.floor(Math.random() * DANDY_GOOD.length)]; eff.apply(); _superState.dandyRoulette.result = { name: eff.name, good: true }; spawnFloatingText(heart.x, heart.y - 30, eff.name + "!", "#44ff44"); }
                else { let eff = DANDY_BAD[Math.floor(Math.random() * DANDY_BAD.length)]; eff.apply(); _superState.dandyRoulette.result = { name: eff.name, good: false }; spawnFloatingText(heart.x, heart.y - 30, eff.name + "!", "#ff4444"); }
            }, 1000);
        },
        onTick() {}
    },

    "Кайдо": {
        name: "ДЫХАНИЕ РАЗРУШЕНИЯ", cooldown: 25000, toggleable: false, duration: 0,
        onActivate() {
            _superState.kaidoDrinking = true; heartSpeed *= 0.5; spawnFloatingText(heart.x, heart.y - 30, "ГЛОТОК...", "#D2691E");
            setTimeout(() => {
                _superState.kaidoDrinking = false; heartSpeed /= 0.5; _superState.kaidoBuffActive = true; _superState.kaidoDmgReduction = true; _superState.invertControls = true; _superState.kaidoScream = true;
                _superState.screenShakeAmount = 25; spawnFloatingText(heart.x, heart.y - 40, "ЯРОСТЬ!!!", "#ff4444");
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
            _superState.screenFlashWhite = 20; spawnFloatingText(heart.x, heart.y - 50, "СИМВОЛ МИРА!!!", "#ffd700");
            setTimeout(() => {
                heart.hitbox = _superState.allmightOrigHitbox; heart.size = _superState.allmightOrigSize; _superState.allmightDmgMult = 1;
                arenaHP = Math.max(1, arenaHP - Math.floor(arenaMaxHP * 0.5)); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
                _superState.allmightPermaSlow = true; heartSpeed *= 0.33; spawnFloatingText(heart.x, heart.y - 40, "ИСТОЩЕНИЕ!", "#ff0000");
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
    if (_activeSuperName === mainCard.name) { btn.textContent = "⏹ " + ab.name + " (АКТИВЕН)"; btn.style.background = "#ff4444"; btn.style.animation = "none"; }
    else if (cd && !cd.ready) { let sec = Math.ceil(cd.remaining / 1000); btn.textContent = "⏳ " + ab.name + " (" + sec + "с)"; btn.style.background = "#555"; btn.style.animation = "none"; }
    else { btn.textContent = "⚡ " + ab.name; btn.style.background = "linear-gradient(135deg, #f5af19, #f12711)"; btn.style.animation = "superPulse 2s infinite"; }
}

function resetAllSupers() {
    if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) superAbilities[_activeSuperName].onDeactivate();
    _activeSuperName = null;
    if (_superState.nikaActive) { heart.hitbox = _superState.nikaHitboxOriginal; heart.size = _superState.nikaSizeOriginal; }
    _superState.dekusActive = false; _superState.dekusDmgMult = 1; _superState.dekusParticles = false;
    _superState.borosHeal = null; _superState.borosParticles = false;
    _superState.usoppInvuln = false; _superState.usoppStunTimer = 0; _superState.nikaActive = false; _superState.nikaDmgMult = 1;
    _superState.positionHistory = []; _superState.garouMarker = null; _superState.garouInvulnTimer = 0; _superState.garouTimeStop = false;
    _superState.garpChargeTimer = 0; _superState.garpImpactActive = false;
    _superState.imAuraActive = false; _superState.imSpeedPenalty = false;
    _superState.kaidoDrinking = false; _superState.kaidoBuffActive = false; _superState.kaidoDmgReduction = false; _superState.invertControls = false; _superState.kaidoScream = false;
    _superState.allmightDmgMult = 1; _superState.allmightBuffTimer = 0; _superState.allmightShockwave = 0;
    _superState.antispiralFrozen = false; _superState.antispiralSpeedBoost = false;
    _superState.dandyLightnings = false; _superState.dandyInvuln = false; _superState.dandyDmgBuff = null; _superState.dandyShield = null; _superState.dandyVulnerable = null; _superState.dandyDoubleTargets = false; _superState.dandyRoulette = null;
    _superState.fists = []; _superState.rings = [];
    _superState.screenShakeAmount = 0; _superState.screenFlashWhite = 0;
    resetAllCooldowns();
}

function initSuperState() { _activeSuperName = null; resetAllSupers(); _superLastTick = performance.now(); updateSuperButton(); }

function tickSupers() {
    if (!arenaActive || !ctx) return;
    let now = performance.now(); let dt = (now - _superLastTick) / 1000; if (dt <= 0) dt = 0.016; _superLastTick = now;
    if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onTick) superAbilities[_activeSuperName].onTick(dt);
    if (_superState.borosHeal && _superState.borosHeal.active && superAbilities["Борос"] && superAbilities["Борос"].onTick) superAbilities["Борос"].onTick(dt);
    updateSuperLogic(dt); updateSuperButton();
}

function updateSuperLogic(dt) {
    let mainCard = getMainCard();
    if (_superState.screenShakeAmount > 0) _superState.screenShakeAmount -= dt * 5;
    if (_superState.screenFlashWhite > 0) _superState.screenFlashWhite -= dt * 25;
    for (let i = _superState.rings.length - 1; i >= 0; i--) { let r = _superState.rings[i]; r.radius += r.speed * dt; r.life -= dt; if (r.life <= 0) _superState.rings.splice(i, 1); }
    if (_superState.garpChargeTimer > 0) { _superState.garpChargeTimer -= dt; if (_superState.garpChargeTimer <= 0) { _superState.garpChargeTimer = 0; heartSpeed /= 0.3; _superState.garpImpactActive = true; _superState.garpImpactRadius = 0; _superState.garpImpactX = heart.x; _superState.garpImpactY = heart.y; arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.90); _superState.screenShakeAmount = 40; _superState.screenFlashWhite = 10; spawnFloatingText(heart.x, heart.y - 40, "ГАЛАКТИЧЕСКИЙ УДАР!!!", "#8844ff"); if (typeof sfxArenaVictory === 'function') sfxArenaVictory(); } }
    if (_superState.garpImpactActive) { _superState.garpImpactRadius += dt * 600; if (_superState.garpImpactRadius > 200) { _superState.garpImpactActive = false; } for (let j = attacks.length - 1; j >= 0; j--) { let a = attacks[j]; let ax = a.x + (a.size || a.radius || 20) / 2; let ay = a.y + (a.size || a.radius || 20) / 2; let dist = Math.hypot(ax - _superState.garpImpactX, ay - _superState.garpImpactY); if (dist < _superState.garpImpactRadius) { attacks.splice(j, 1); arenaParticles.push({ x: ax, y: ay, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 20, maxLife: 20, color: "#8844ff", size: 4 }); } } }
    if (arenaPhase === "dodge" && mainCard && mainCard.name === "Космический Гароу") { let now = performance.now(); _superState.positionHistory.push({ time: now, x: heart.x, y: heart.y }); while (_superState.positionHistory.length > 0 && now - _superState.positionHistory[0].time > 5000) _superState.positionHistory.shift(); }
    if (_superState.usoppStunTimer > 0) { _superState.usoppStunTimer -= dt; if (_superState.usoppStunTimer < 0) _superState.usoppStunTimer = 0; }
    if (_superState.garouInvulnTimer > 0) { _superState.garouInvulnTimer -= dt; if (_superState.garouInvulnTimer < 0) _superState.garouInvulnTimer = 0; }
    if (_superState.allmightBuffTimer > 0) { _superState.allmightBuffTimer -= dt; if (_superState.allmightBuffTimer < 0) _superState.allmightBuffTimer = 0; }
    if (_superState.allmightShockwave > 0) _superState.allmightShockwave -= dt;
    if (_superState.dandyDmgBuff) { _superState.dandyDmgBuff.timer -= dt; if (_superState.dandyDmgBuff.timer <= 0) _superState.dandyDmgBuff = null; }
    if (_superState.dandyShield) { _superState.dandyShield.timer -= dt; if (_superState.dandyShield.timer <= 0) _superState.dandyShield = null; }
    if (_superState.dandyVulnerable) { _superState.dandyVulnerable.timer -= dt; if (_superState.dandyVulnerable.timer <= 0) _superState.dandyVulnerable = null; }
    if (_superState.garouMarker) { let elapsed = (performance.now() - _superState.garouMarker.time) / 1000; if (elapsed > 1.5) _superState.garouMarker = null; else _superState.garouMarker.alpha = 1 - elapsed / 1.5; }
    if (_superState.dekusParticles && arenaActive) { for (let i = 0; i < 6; i++) { let angle = Math.random() * Math.PI * 2; let dist = 30 + Math.random() * 50; arenaParticles.push({ x: heart.x + Math.cos(angle) * 10, y: heart.y + Math.sin(angle) * 10, endX: heart.x + Math.cos(angle) * dist, endY: heart.y + Math.sin(angle) * dist, vx: 0, vy: 0, life: 18, maxLife: 18, color: "#44ff44", isLightning: true }); } }
    if (_superState.borosParticles && arenaActive) { for (let i = 0; i < 3; i++) arenaParticles.push({ x: heart.x + (Math.random() - 0.5) * 50, y: heart.y + (Math.random() - 0.5) * 50, vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 3, life: 35, maxLife: 35, color: "#66ff66", size: 3 + Math.random() * 5 }); }
    if (_superState.dandyLightnings && arenaActive) { for (let i = 0; i < 4; i++) { let angle = Math.random() * Math.PI * 2; let dist = 25 + Math.random() * 40; arenaParticles.push({ x: heart.x + Math.cos(angle) * 10, y: heart.y + Math.sin(angle) * 10, endX: heart.x + Math.cos(angle) * dist, endY: heart.y + Math.sin(angle) * dist, vx: 0, vy: 0, life: 20, maxLife: 20, color: "#ffff00", isLightning: true }); } }
    if (_superState.allmightBuffTimer > 0 && arenaActive) { _superState.allmightShockwave += dt; if (_superState.allmightShockwave >= 1.0) { _superState.allmightShockwave -= 1.0; arenaShockwaves.push({ x: heart.x, y: heart.y, r: 10, v: 15, life: 25, maxLife: 25, color: "rgba(255, 215, 0, 0.8)" }); for (let a of attacks) { let dx = (a.x + (a.size || 20) / 2) - heart.x; let dy = (a.y + (a.size || 20) / 2) - heart.y; let dist = Math.sqrt(dx * dx + dy * dy) || 1; a.spd = (a.spd || 0) + (dx / dist) * 3; a.spdY = (a.spdY || 0) + (dy / dist) * 3; } } }
    for (let i = _superState.fists.length - 1; i >= 0; i--) { let f = _superState.fists[i]; f.x += f.vx; f.y += f.vy; f.life--; if (f.life % 3 === 0 && f.life > 0) arenaParticles.push({ x: f.x + (Math.random() - 0.5) * f.size, y: f.y + (Math.random() - 0.5) * f.size, vx: 0, vy: 0, life: 15, maxLife: 15, color: "#ff4444", size: 5 + Math.random() * 5 }); let pathWidth = f.pathWidth || 120; for (let j = attacks.length - 1; j >= 0; j--) { let a = attacks[j]; let ax = a.x + (a.size || a.radius || 20) / 2; let ay = a.y + (a.size || a.radius || 20) / 2; if (Math.abs(ax - f.x) < pathWidth / 2 && Math.abs(ay - f.y) < f.size + 20) { _superState.screenShakeAmount = Math.max(_superState.screenShakeAmount, 10); addShockwaveRing(ax, ay, "#ffaa00", 200, 0.3, 2); for (let p = 0; p < 20; p++) arenaParticles.push({ x: ax, y: ay, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: 25, maxLife: 25, color: "#ffaa00", size: 2 + Math.random() * 6 }); attacks.splice(j, 1); if (typeof sfxBounce === 'function') sfxBounce(); } } if (f.willOneshot && !f.oneshotChecked && arenaBossMaxHP > 0) { f.oneshotChecked = true; arenaBossMaxHP = 0; _superState.screenFlashWhite = 20; _superState.screenShakeAmount = 50; for (let p = 0; p < 100; p++) arenaParticles.push({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 40, maxLife: 40, color: "#ffffff", size: 3 + Math.random() * 8 }); if (typeof sfxArenaVictory === 'function') sfxArenaVictory(); if (typeof winArena === 'function') winArena(); _superState.fists.splice(i, 1); break; } if (f.life <= 0 || f.y < -150 || f.y > 650 || f.x < -50 || f.x > 450) _superState.fists.splice(i, 1); }
}

function renderSuperVisuals() {
    if (!ctx) return;
    for (let r of _superState.rings) { ctx.save(); ctx.globalAlpha = Math.max(0, r.life / r.maxLife); ctx.strokeStyle = r.color; ctx.lineWidth = r.width; ctx.shadowColor = r.color; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (_superState.screenFlashWhite > 0) { ctx.save(); ctx.fillStyle = "#ffffff"; ctx.globalAlpha = Math.min(1, _superState.screenFlashWhite / 10); ctx.fillRect(0, 0, 400, 500); ctx.restore(); }
    if (_superState.garpChargeTimer > 0 && arenaActive) { if (Math.random() < 0.6) drawHakiLightning(heart.x, heart.y, 90, 1.0, 1.5); if (Math.random() < 0.4) drawHakiLightning(heart.x, heart.y, 120, 0.8, 1); ctx.save(); let chargePower = 1.2 - _superState.garpChargeTimer; ctx.translate(heart.x, heart.y); ctx.rotate(performance.now() / 200); ctx.beginPath(); ctx.arc(0, 0, 40 + chargePower * 30, 0, Math.PI * 2); ctx.fillStyle = "rgba(136, 68, 255, 0.15)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"; ctx.setLineDash([10, 15]); ctx.stroke(); ctx.restore(); }
    if (_superState.garpImpactActive && arenaActive) { let cx = _superState.garpImpactX; let cy = _superState.garpImpactY; let r = _superState.garpImpactRadius; let progress = r / 200; let alpha = 1 - Math.pow(progress, 3); ctx.save(); ctx.globalAlpha = alpha; let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.1, "#ff44ff"); grad.addColorStop(0.4, "#220088"); grad.addColorStop(0.8, "#050022"); grad.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); for(let i = 0; i < 30; i++) { let sAngle = Math.random() * Math.PI * 2; let sDist = Math.random() * r * 0.9; let sx = cx + Math.cos(sAngle + progress * 2) * sDist; let sy = cy + Math.sin(sAngle + progress * 2) * sDist; ctx.fillStyle = (Math.random() > 0.5) ? "#ffffff" : "#ffccff"; ctx.beginPath(); ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill(); } ctx.strokeStyle = "#ff44ff"; ctx.lineWidth = 15 * (1 - progress); ctx.shadowColor = "#ff44ff"; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); if (Math.random() < 0.8) { drawHakiLightning(cx + Math.cos(Math.random()*Math.PI*2)*r, cy + Math.sin(Math.random()*Math.PI*2)*r, 80, alpha, 2); drawHakiLightning(cx + Math.cos(Math.random()*Math.PI*2)*r, cy + Math.sin(Math.random()*Math.PI*2)*r, 100, alpha, 2); } ctx.restore(); }
    drawGarouTrail();
    for (let i = arenaParticles.length - 1; i >= 0; i--) { let p = arenaParticles[i]; if (p.isLightning && p.life > 0) drawLightningBolt(p.x, p.y, p.endX, p.endY, p.color, p.life / p.maxLife, 3); }
    if (_superState.fists && _superState.fists.length > 0) { for (let f of _superState.fists) { if (f.life > 0) drawFist(f); } }
    if (_superState.garouMarker && _superState.garouMarker.alpha > 0) drawCircleMarker(_superState.garouMarker.x, _superState.garouMarker.y, "#ff8800", _superState.garouMarker.alpha, 30);
    if (_superState.usoppStunTimer > 0 && arenaActive) { ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 3; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 15; for (let i = 0; i < 6; i++) { let angle = (i / 6) * Math.PI * 2 + performance.now() / 1000; ctx.beginPath(); ctx.arc(heart.x + Math.cos(angle) * heart.size * 2, heart.y + Math.sin(angle) * heart.size * 2, 5, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); }
    if (_superState.nikaActive && arenaActive) { for (let i = 0; i < 5; i++) { let angle = (i / 5) * Math.PI * 2 + performance.now() / 2000; let color = `hsl(${(performance.now() / 10 + i * 60) % 360}, 100%, 60%)`; ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(heart.x + Math.cos(angle) * heart.size * 2.5, heart.y + Math.sin(angle) * heart.size * 2.5, 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } }
    if (_superState.usoppInvuln && arenaActive) { for (let i = 0; i < 3; i++) { let angle = performance.now() / 500 + i * Math.PI * 2 / 3; let sx = heart.x + Math.cos(angle) * heart.size * 2.5; let sy = heart.y + Math.sin(angle) * heart.size * 2.5; ctx.save(); ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 15; ctx.font = "20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("⭐", sx, sy); ctx.restore(); } }
    if (_superState.imAuraActive && arenaActive) { ctx.save(); let gradient = ctx.createRadialGradient(heart.x, heart.y, 60, heart.x, heart.y, 85); gradient.addColorStop(0, 'rgba(128, 0, 128, 0.1)'); gradient.addColorStop(1, 'rgba(128, 0, 128, 0.6)'); ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(heart.x, heart.y, 85, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(200, 0, 200, 0.9)"; ctx.lineWidth = 4; ctx.shadowColor = "#800080"; ctx.shadowBlur = 25; ctx.stroke(); ctx.restore(); }
    if (_superState.allmightPermaSlow && arenaActive) { ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = "#ff0000"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(heart.x, heart.y, heart.size * 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    if (_superState.garouInvulnTimer > 0 && arenaActive) { ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 4; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(heart.x, heart.y, heart.size * 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (_superState.allmightBuffTimer > 0 && arenaActive) drawGoldenHeart(heart.x, heart.y, heart.size);
}

// ====== ЭКСПОРТ ======
window.toggleSuper = toggleSuper;
window.initSuperState = initSuperState;
window.tickSupers = tickSupers;
window.renderSuperVisuals = renderSuperVisuals;
window.resetAllSupers = resetAllSupers;
window.resetAllCooldowns = resetAllCooldowns;
window.getMainCard = getMainCard;
