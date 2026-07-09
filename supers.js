// ========== СУПЕР-СПОСОБНОСТИ СЕКРЕТНЫХ КАРТ (АРЕНА) v6.1 MEGA ULTRA ==========
// С крутейшим Галактическим ударом Гарпа, эффектами Хаки и быстрыми вспышками

let _superState = {
    fists: [],
    rings: [], // Новые ударные кольца для красоты
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
    // Гарп (НОВОЕ)
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

// Новая функция Королевской Воли (Хаки) - красно-черные молнии
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
        angle += (Math.random() - 0.5) * 2.0; // Ломаная линия
        cx += Math.cos(angle) * (maxDist / steps);
        cy += Math.sin(angle) * (maxDist / steps);
        ctx.lineTo(cx, cy);
    }
    
    // Красное мощное свечение
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 6 * widthMod;
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 20;
    ctx.stroke();
    
    // Черный стержень молнии
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
        let mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30;
        let my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
        ctx.lineTo(mx, my);
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

    // Кулак Сайтамы — огромный красный
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 50;
    ctx.fillStyle = "#cc0000";
    ctx.fillRect(-s, -s * 1.2, s * 2, s * 2.4);
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(-s * 0.7, -s * 1.2, s * 0.4, s * 2.4);
    ctx.fillRect(s * 0.3, -s * 1.2, s * 0.4, s * 2.4);
    ctx.fillStyle = "#880000";
    ctx.fillRect(-s, s * 0.8, s * 2, s * 0.4);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;

    ctx.shadowBlur = 0;
    ctx.strokeRect(-s, -s * 1.2, s * 2, s * 2.4);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${s * 0.5}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.fillText("УДАР", 0, 0);
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

// ====== ЭФФЕКТЫ ДЭНДИ ======
const DANDY_GOOD = [ /* Оставлено без изменений для компактности, тут ваши стандартные эффекты */
    { name: "ПОЛНОЕ ИСЦЕЛЕНИЕ", apply() { arenaHP = arenaMaxHP; spawnFloatingText(heart.x, heart.y-20, "ИСЦЕЛЕНИЕ!", "#44ff44"); } },
    { name: "УРОН x2 (5с)", apply() { _superState.dandyDmgBuff = { mult: 2, timer: 5 }; } },
    { name: "ОЧИСТКА АТАК", apply() { attacks = []; arenaBlasters = []; spawnFloatingText(heart.x, heart.y-20, "ОЧИСТКА!", "#ffff00"); addShockwaveRing(heart.x, heart.y, "#ffff00", 300, 1.0); } }
];
const DANDY_BAD = [ /* То же самое */
    { name: "ПОТЕРЯ 15% HP", apply() { arenaHP = Math.max(0, arenaHP - arenaMaxHP * 0.15); spawnFloatingText(heart.x, heart.y-20, "-15% HP!", "#ff4444"); } },
    { name: "СКОРОСТЬ x0.5 (6с)", apply() { heartSpeed *= 0.5; setTimeout(() => { heartSpeed /= 0.5; }, 6000); } }
];

// ====== ОПИСАНИЯ СПОСОБНОСТЕЙ ======
const superAbilities = {
    "Деку (100%)": {
        name: "ПОЛНОЕ 100% ПОКРЫТИЕ", cooldown: 15000, toggleable: true, duration: Infinity,
        onActivate() {
            _superState.dekusActive = true; _superState.dekusOriginalSpeed = heartSpeed; _superState.dekusDmgMult = 2; _superState.dekusParticles = true;
            heartSpeed *= 3; _superState.screenShakeAmount = 10;
            addShockwaveRing(heart.x, heart.y, "#44ff44", 400, 0.5); // Красивое кольцо
            spawnFloatingText(heart.x, heart.y - 30, "100%!!!", "#44ff44");
        },
        onDeactivate() { heartSpeed = _superState.dekusOriginalSpeed; _superState.dekusActive = false; _superState.dekusDmgMult = 1; _superState.dekusParticles = false; },
        onTick(dt) { if (_superState.dekusActive && arenaActive) arenaHP = Math.max(0, arenaHP - arenaMaxHP * 0.02 * dt); }
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
            _superState.screenFlashWhite = 5; // Уменьшил вспышку
        },
        onTick(dt) {
            if (_superState.borosHeal && _superState.borosHeal.active && arenaActive) {
                arenaHP = Math.min(arenaMaxHP, arenaHP + _superState.borosHeal.healPerSec * dt);
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
            _superState.screenFlashWhite = 8; // Уменьшил вспышку
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
                addShockwaveRing(heart.x, heart.y, "#ff8800", 400, 0.4); // Кольцо откуда прыгнул
                _superState.garouMarker = { x: target.x, y: target.y, alpha: 1.0, time: now };
                heart.x = target.x; heart.y = target.y;
                addShockwaveRing(heart.x, heart.y, "#ff8800", 400, 0.4); // Кольцо куда прыгнул
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
            _superState.screenFlashWhite = 15; // Уменьшил вспышку (было 30)
            attacks = []; arenaBlasters = []; arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.9);
            if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
            spawnFloatingText(heart.x, heart.y - 30, "СТЁРТО!", "#ff00ff");
        },
        onTick() {}
    },

    "Молодой Гарп": {
        name: "ГАЛАКТИЧЕСКИЙ УДАР", cooldown: 30000, toggleable: false, duration: 0,
        onActivate() {
            heartSpeed *= 0.3; // Сильно замедляется при зарядке
            _superState.garpChargeTimer = 1.2; // Время зарядки (Хаки)
            _superState.screenShakeAmount = 10;
            spawnFloatingText(heart.x, heart.y - 40, "ЗАРЯДКА ХАКИ...", "#ff0000");
        },
        onTick(dt) {}
    },

    // Оставшиеся персонажи без изменений...
    "Им (Правитель)": { name: "ТЕНЕВОЕ ПРАВЛЕНИЕ", cooldown: 30000, toggleable: true, duration: Infinity, onActivate() { _superState.imAuraActive = true; _superState.imSpeedPenalty = true; heartSpeed *= 0.7; spawnFloatingText(heart.x, heart.y - 30, "ТЬМА!", "#800080"); }, onDeactivate() { _superState.imAuraActive = false; _superState.imSpeedPenalty = false; heartSpeed /= 0.7; }, onTick() {} },
    "Космический Дэнди": { name: "КОСМИЧЕСКАЯ УДАЧА", cooldown: 20000, toggleable: false, duration: 0, onActivate() { _superState.dandyRoulette = { time: performance.now(), result: null }; }, onTick() {} },
    "Кайдо": { name: "ДЫХАНИЕ РАЗРУШЕНИЯ", cooldown: 25000, toggleable: false, duration: 0, onActivate() { _superState.kaidoDrinking = true; heartSpeed *= 0.5; spawnFloatingText(heart.x, heart.y - 30, "ГЛОТОК...", "#D2691E"); setTimeout(() => { _superState.kaidoDrinking = false; heartSpeed /= 0.5; _superState.kaidoBuffActive = true; _superState.kaidoDmgReduction = true; _superState.invertControls = true; _superState.kaidoScream = true; _superState.screenShakeAmount = 25; spawnFloatingText(heart.x, heart.y - 40, "ЯРОСТЬ!!!", "#ff4444"); setTimeout(() => { _superState.kaidoScream = false; }, 500); setTimeout(() => { _superState.kaidoBuffActive = false; _superState.kaidoDmgReduction = false; _superState.invertControls = false; }, 7000); }, 2000); }, onTick() {} },
    "Император Марк": { name: "ПАССИВНАЯ", cooldown: 0, toggleable: false, duration: 0, onActivate() {}, onTick() {} },
    "Всемогущий (прайм)": { name: "СИМВОЛ МИРА", cooldown: 40000, toggleable: false, duration: 0, onActivate() { _superState.allmightOrigHitbox = heart.hitbox; _superState.allmightOrigSize = heart.size; heart.hitbox *= 2; heart.size *= 2; _superState.allmightDmgMult = 3; _superState.allmightBuffTimer = 15; _superState.allmightShockwave = 0; _superState.screenFlashWhite = 20; spawnFloatingText(heart.x, heart.y - 50, "СИМВОЛ МИРА!!!", "#ffd700"); setTimeout(() => { heart.hitbox = _superState.allmightOrigHitbox; heart.size = _superState.allmightOrigSize; _superState.allmightDmgMult = 1; arenaHP = Math.max(1, arenaHP - Math.floor(arenaMaxHP * 0.5)); _superState.allmightPermaSlow = true; heartSpeed *= 0.33; spawnFloatingText(heart.x, heart.y - 40, "ИСТОЩЕНИЕ!", "#ff0000"); }, 15000); }, onTick() {} },
    "Анти-спираль": { name: "ПАССИВНАЯ", cooldown: 0, toggleable: false, duration: 0, onActivate() {}, onTick() {} }
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

function initSuperState() {
    _activeSuperName = null;
    resetAllSupers(); // Использует функцию выше для чистого старта
    _superLastTick = performance.now();
    updateSuperButton();
}

function tickSupers() {
    if (!arenaActive || !ctx) return;
    let now = performance.now();
    let dt = (now - _superLastTick) / 1000;
    if (dt <= 0) dt = 0.016;
    _superLastTick = now;

    if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onTick) superAbilities[_activeSuperName].onTick(dt);
    if (_superState.borosHeal && _superState.borosHeal.active && superAbilities["Борос"] && superAbilities["Борос"].onTick) superAbilities["Борос"].onTick(dt);

    updateSuperLogic(dt);
    updateSuperButton();
}

function updateSuperLogic(dt) {
    let mainCard = getMainCard();

    // Затухание вспышки теперь очень быстрое (dt * 25 вместо dt * 8) - глазам комфортно
    if (_superState.screenShakeAmount > 0) _superState.screenShakeAmount -= dt * 5;
    if (_superState.screenFlashWhite > 0) _superState.screenFlashWhite -= dt * 25;

    // Ударные волны-кольца (красивые эффекты)
    for (let i = _superState.rings.length - 1; i >= 0; i--) {
        let r = _superState.rings[i];
        r.radius += r.speed * dt;
        r.life -= dt;
        if (r.life <= 0) _superState.rings.splice(i, 1);
    }

    // ЛОГИКА ГАРПА (Новая, АоЕ Галактический Удар)
    if (_superState.garpChargeTimer > 0) {
        _superState.garpChargeTimer -= dt;
        if (_superState.garpChargeTimer <= 0) {
            _superState.garpChargeTimer = 0;
            heartSpeed /= 0.3; // Возвращаем скорость
            _superState.garpImpactActive = true;
            _superState.garpImpactRadius = 0;
            _superState.garpImpactX = heart.x;
            _superState.garpImpactY = heart.y;
            
            // Первичный взрыв
            arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.90); // Сносит 10% ХП
            _superState.screenShakeAmount = 40;
            _superState.screenFlashWhite = 10;
            spawnFloatingText(heart.x, heart.y - 40, "ГАЛАКТИЧЕСКИЙ УДАР!!!", "#8844ff");
            if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
        }
    }

    if (_superState.garpImpactActive) {
        _superState.garpImpactRadius += dt * 600; // Быстро расширяется
        // Максимальный радиус 200 (ровно половина карты шириной 400)
        if (_superState.garpImpactRadius > 200) {
            _superState.garpImpactActive = false;
        }
        // Уничтожение атак внутри радиуса галактики
        for (let j = attacks.length - 1; j >= 0; j--) {
            let a = attacks[j];
            let ax = a.x + (a.size || a.radius || 20) / 2;
            let ay = a.y + (a.size || a.radius || 20) / 2;
            let dist = Math.hypot(ax - _superState.garpImpactX, ay - _superState.garpImpactY);
            if (dist < _superState.garpImpactRadius) {
                attacks.splice(j, 1);
                // Микро-взрыв на месте стертой атаки
                arenaParticles.push({
                    x: ax, y: ay, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                    life: 20, maxLife: 20, color: "#8844ff", size: 4
                });
            }
        }
    }

    // История позиций для Гароу
    if (arenaPhase === "dodge" && mainCard && mainCard.name === "Космический Гароу") {
        let now = performance.now();
        _superState.positionHistory.push({ time: now, x: heart.x, y: heart.y });
        while (_superState.positionHistory.length > 0 && now - _superState.positionHistory[0].time > 5000) _superState.positionHistory.shift();
    }

    // Таймеры
    if (_superState.usoppStunTimer > 0) { _superState.usoppStunTimer -= dt; if (_superState.usoppStunTimer < 0) _superState.usoppStunTimer = 0; }
    if (_superState.garouInvulnTimer > 0) { _superState.garouInvulnTimer -= dt; if (_superState.garouInvulnTimer < 0) _superState.garouInvulnTimer = 0; }
    if (_superState.allmightBuffTimer > 0) { _superState.allmightBuffTimer -= dt; if (_superState.allmightBuffTimer < 0) _superState.allmightBuffTimer = 0; }
    if (_superState.allmightShockwave > 0) _superState.allmightShockwave -= dt;

    if (_superState.dandyDmgBuff) { _superState.dandyDmgBuff.timer -= dt; if (_superState.dandyDmgBuff.timer <= 0) _superState.dandyDmgBuff = null; }
    if (_superState.dandyShield) { _superState.dandyShield.timer -= dt; if (_superState.dandyShield.timer <= 0) _superState.dandyShield = null; }

    // Логика кулаков Сайтамы
    for (let i = _superState.fists.length - 1; i >= 0; i--) {
        let f = _superState.fists[i];
        f.x += f.vx; f.y += f.vy; f.life--;

        // Шлейф кулака
        if (f.life % 3 === 0 && f.life > 0) {
            arenaParticles.push({
                x: f.x + (Math.random() - 0.5) * f.size, y: f.y + (Math.random() - 0.5) * f.size,
                vx: 0, vy: 0, life: 15, maxLife: 15, color: "#ff4444", size: 5 + Math.random() * 5
            });
        }

        let pathWidth = f.pathWidth || 120;
        for (let j = attacks.length - 1; j >= 0; j--) {
            let a = attacks[j];
            let ax = a.x + (a.size || a.radius || 20) / 2;
            let ay = a.y + (a.size || a.radius || 20) / 2;
            if (Math.abs(ax - f.x) < pathWidth / 2 && Math.abs(ay - f.y) < f.size + 20) {
                _superState.screenShakeAmount = Math.max(_superState.screenShakeAmount, 10);
                addShockwaveRing(ax, ay, "#ffaa00", 200, 0.3, 2);
                attacks.splice(j, 1);
            }
        }

        if (f.willOneshot && !f.oneshotChecked && arenaBossMaxHP > 0) {
            f.oneshotChecked = true; arenaBossMaxHP = 0;
            _superState.screenFlashWhite = 20; // Уменьшил время
            _superState.screenShakeAmount = 50;
            if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
            if (typeof winArena === 'function') winArena();
            _superState.fists.splice(i, 1); break;
        }

        if (f.life <= 0 || f.y < -150 || f.y > 650 || f.x < -50 || f.x > 450) {
            _superState.fists.splice(i, 1);
        }
    }
}

function renderSuperVisuals() {
    if (!ctx) return;

    // Отрисовка колец
    for (let r of _superState.rings) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.life / r.maxLife);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.width;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Белая вспышка (теперь мягче)
    if (_superState.screenFlashWhite > 0) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = Math.min(1, _superState.screenFlashWhite / 10);
        ctx.fillRect(0, 0, 400, 500);
        ctx.restore();
    }

    // ====== ВИЗУАЛЫ ГАРПА (ГАЛАКТИКА И ХАКИ) ======
    
    // 1. Зарядка Хаки
    if (_superState.garpChargeTimer > 0 && arenaActive) {
        // Черно-красные молнии
        if (Math.random() < 0.6) drawHakiLightning(heart.x, heart.y, 90, 1.0, 1.5);
        if (Math.random() < 0.4) drawHakiLightning(heart.x, heart.y, 120, 0.8, 1);
        
        // Вращающаяся воронка энергии
        ctx.save();
        let chargePower = 1.2 - _superState.garpChargeTimer; // от 0 до 1.2
        ctx.translate(heart.x, heart.y);
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

    // 2. Галактический Удар
    if (_superState.garpImpactActive && arenaActive) {
        let cx = _superState.garpImpactX;
        let cy = _superState.garpImpactY;
        let r = _superState.garpImpactRadius;
        let progress = r / 200; // от 0 до 1
        let alpha = 1 - Math.pow(progress, 3); // плавно исчезает к концу

        ctx.save();
        ctx.globalAlpha = alpha;

        // Космический фон сферы
        let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.1, "#ff44ff");
        grad.addColorStop(0.4, "#220088");
        grad.addColorStop(0.8, "#050022");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Звезды внутри галактики
        for(let i = 0; i < 30; i++) {
            let sAngle = Math.random() * Math.PI * 2;
            let sDist = Math.random() * r * 0.9;
            let sx = cx + Math.cos(sAngle + progress * 2) * sDist; // закручиваются при взрыве
            let sy = cy + Math.sin(sAngle + progress * 2) * sDist;
            ctx.fillStyle = (Math.random() > 0.5) ? "#ffffff" : "#ffccff";
            ctx.beginPath();
            ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Взрывная волна по краю
        ctx.strokeStyle = "#ff44ff";
        ctx.lineWidth = 15 * (1 - progress);
        ctx.shadowColor = "#ff44ff";
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Хаки по краю взрыва
        if (Math.random() < 0.8) {
            drawHakiLightning(cx + Math.cos(Math.random()*Math.PI*2)*r, cy + Math.sin(Math.random()*Math.PI*2)*r, 80, alpha, 2);
            drawHakiLightning(cx + Math.cos(Math.random()*Math.PI*2)*r, cy + Math.sin(Math.random()*Math.PI*2)*r, 100, alpha, 2);
        }
        ctx.restore();
    }
    // ===============================================

    drawGarouTrail();

    // Кулаки Сайтамы
    if (_superState.fists && _superState.fists.length > 0) {
        for (let f of _superState.fists) { if (f.life > 0) drawFist(f); }
    }

    if (_superState.usoppInvuln && arenaActive) {
        for (let i = 0; i < 3; i++) {
            let angle = performance.now() / 500 + i * Math.PI * 2 / 3;
            let sx = heart.x + Math.cos(angle) * heart.size * 2.5;
            let sy = heart.y + Math.sin(angle) * heart.size * 2.5;
            ctx.save(); ctx.fillStyle = "#ffd700"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 15;
            ctx.font = "20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("⭐", sx, sy); ctx.restore();
        }
    }

    if (_superState.allmightBuffTimer > 0 && arenaActive) drawGoldenHeart(heart.x, heart.y, heart.size);
}

// ====== ЭКСПОРТ ======
window.toggleSuper = toggleSuper; window.initSuperState = initSuperState; window.tickSupers = tickSupers;
window.renderSuperVisuals = renderSuperVisuals; window.resetAllSupers = resetAllSupers; window.resetAllCooldowns = resetAllCooldowns; window.getMainCard = getMainCard;
