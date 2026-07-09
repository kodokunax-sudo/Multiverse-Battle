// ========== СУПЕР-СПОСОБНОСТИ СЕКРЕТНЫХ КАРТ (АРЕНА) v5.0 ==========
// Деку, Сайтама, Борос, Усопп — без изменений
// Остальные 10 — полностью переработаны

let _superState = {
    fists: [],
    // Деку
    dekusActive: false,
    dekusOriginalSpeed: 1.2,
    dekusDmgMult: 1,
    dekusParticles: false,
    // Борос
    borosHeal: null,
    borosParticles: false,
    // Усопп
    usoppInvuln: false,
    usoppStunTimer: 0,
    // Луффи
    nikaActive: false,
    nikaHitboxOriginal: 4,
    nikaDmgMult: 1,
    nikaSpeedBonus: 1,
    // Гароу
    positionHistory: [],
    garouMarker: null,
    garouInvulnTimer: 0,
    // Гарп
    garouStunTimer: 0,
    garouExplosionPending: false,
    // Им
    imAuraActive: false,
    imSpeedPenalty: false,
    // Дэнди
    dandyLightnings: false,
    dandyInvuln: false,
    dandyDmgBuff: null,
    dandyShield: null,
    dandyVulnerable: null,
    dandyDoubleTargets: false,
    // Кайдо
    kaidoDrinking: false,
    kaidoBuffActive: false,
    kaidoDmgReduction: false,
    invertControls: false,
    // Марк
    markResurrectUsed: false,
    // Всемогущий
    allmightPermaSlow: false,
    allmightDmgMult: 1,
    allmightBuffTimer: 0,
    // Анти-спираль (пассивка)
    antispiralFrozen: false,
    antispiralSpeedBoost: false,
};

let _superCooldowns = {};
let _activeSuperName = null;
let _superLastTick = 0;

// ====== ФУНКЦИИ ОТРИСОВКИ ======
function drawLightningBolt(x1, y1, x2, y2, color, alpha) {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 * alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * alpha;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    let segments = 3;
    for (let i = 1; i < segments; i++) {
        let t = i / segments;
        let mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 18;
        let my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 18;
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
    ctx.shadowColor = f.owner === "Гарп" ? "#4444ff" : "#ff0000";
    ctx.shadowBlur = 30;
    ctx.fillStyle = f.owner === "Гарп" ? "#2222ff" : "#ff2222";
    ctx.fillRect(-s, -s * 1.2, s * 2, s * 2.4);
    ctx.fillStyle = f.owner === "Гарп" ? "#5555ff" : "#ff5555";
    ctx.fillRect(-s * 0.7, -s * 1.2, s * 0.4, s * 2.4);
    ctx.fillRect(s * 0.3, -s * 1.2, s * 0.4, s * 2.4);
    ctx.fillStyle = f.owner === "Гарп" ? "#0000aa" : "#aa0000";
    ctx.fillRect(-s, s * 0.8, s * 2, s * 0.4);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 0;
    ctx.strokeRect(-s, -s * 1.2, s * 2, s * 2.4);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 4;
    ctx.fillText(f.owner === "Гарп" ? "ГАРП" : "УДАР", 0, 0);
    ctx.restore();
}

function drawCircleMarker(x, y, color, alpha) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawGarouTrail() {
    let mainCard = getMainCard();
    if (!mainCard || mainCard.name !== "Космический Гароу") return;
    if (!ctx || !_superState.positionHistory || _superState.positionHistory.length < 2) return;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#ff8800";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#ff8800";
    ctx.shadowBlur = 10;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(_superState.positionHistory[0].x, _superState.positionHistory[0].y);
    for (let i = 1; i < _superState.positionHistory.length; i++) {
        ctx.lineTo(_superState.positionHistory[i].x, _superState.positionHistory[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#ff8800";
    ctx.shadowColor = "#ff8800";
    ctx.shadowBlur = 8;
    for (let i = 0; i < _superState.positionHistory.length; i += 5) {
        let p = _superState.positionHistory[i];
        let age = (performance.now() - p.time) / 2000;
        let alpha = 1 - age;
        if (alpha > 0) {
            ctx.globalAlpha = alpha * 0.6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawBeerBottle(x, y, alpha) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y - 25);
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(-8, -15, 16, 25);
    ctx.fillStyle = "#D2691E";
    ctx.fillRect(-6, -20, 12, 8);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-4, -22, 8, 4);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -15, 16, 25);
    ctx.restore();
}

// ====== ЭФФЕКТЫ ДЭНДИ ======
const DANDY_GOOD = [
    { name: "Полное исцеление", apply() { arenaHP = arenaMaxHP; document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); spawnFloatingText(heart.x, heart.y-20, "ИСЦЕЛЕНИЕ!", "#44ff44"); } },
    { name: "Урон x2 (5с)", apply() { _superState.dandyDmgBuff = { mult: 2, timer: 5 }; } },
    { name: "Очистка атак", apply() { attacks = []; arenaBlasters = []; spawnFloatingText(heart.x, heart.y-20, "ОЧИСТКА!", "#ffff00"); } },
    { name: "Скорость x1.5 (8с)", apply() { heartSpeed *= 1.5; setTimeout(() => { heartSpeed /= 1.5; }, 8000); } },
    { name: "Щит 50% (6с)", apply() { _superState.dandyShield = { mult: 0.5, timer: 6 }; } },
    { name: "Замедление атак (4с)", apply() { let old = arenaGlobalSpeedMod; arenaGlobalSpeedMod = 0.5; setTimeout(() => { arenaGlobalSpeedMod = old; }, 4000); } },
    { name: "-15% HP босса", apply() { arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.85); spawnFloatingText(200, 250, "-15% БОССУ!", "#ffdd00"); } },
    { name: "Неуязвимость (2с)", apply() { _superState.dandyInvuln = true; setTimeout(() => { _superState.dandyInvuln = false; }, 2000); } },
    { name: "Двойные цели", apply() { _superState.dandyDoubleTargets = true; } },
    { name: "Молнии (8с)", apply() { _superState.dandyLightnings = true; setTimeout(() => { _superState.dandyLightnings = false; }, 8000); } },
];

const DANDY_BAD = [
    { name: "Потеря 15% HP", apply() { arenaHP = Math.max(0, arenaHP - arenaMaxHP * 0.15); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); spawnFloatingText(heart.x, heart.y-20, "-15% HP!", "#ff4444"); if (arenaHP <= 0 && typeof loseArena === 'function') loseArena(); } },
    { name: "Скорость x0.5 (6с)", apply() { heartSpeed *= 0.5; setTimeout(() => { heartSpeed /= 0.5; }, 6000); } },
    { name: "Двойной урон (5с)", apply() { _superState.dandyVulnerable = { mult: 2, timer: 5 }; } },
    { name: "Спавн 5 атак", apply() { for (let i = 0; i < 5; i++) spawnAttack(); } },
    { name: "Ускорение атак (8с)", apply() { arenaGlobalSpeedMod *= 1.5; setTimeout(() => { arenaGlobalSpeedMod /= 1.5; }, 8000); } },
    { name: "Инверт (4с)", apply() { _superState.invertControls = true; setTimeout(() => { _superState.invertControls = false; }, 4000); } },
    { name: "+20% HP босса", apply() { arenaBossMaxHP = Math.floor(arenaBossMaxHP * 1.2); spawnFloatingText(200, 250, "+20% БОССУ!", "#ff4444"); } },
    { name: "Оглушение (2с)", apply() { _superState.usoppStunTimer = 2; } },
    { name: "Хитбокс x2 (8с)", apply() { let orig = heart.hitbox; heart.hitbox *= 2; setTimeout(() => { heart.hitbox = orig; }, 8000); } },
    { name: "Случайный телепорт", apply() { heart.x = 50 + Math.random() * 300; heart.y = 50 + Math.random() * 400; clampHeart(); } },
];

// ====== ОПИСАНИЯ СПОСОБНОСТЕЙ ======
const superAbilities = {
    // ====== БЕЗ ИЗМЕНЕНИЙ ======
    "Деку (100%)": {
        name: "ПОЛНОЕ 100% ПОКРЫТИЕ",
        cooldown: 15000, toggleable: true, duration: Infinity,
        onActivate() {
            _superState.dekusActive = true;
            _superState.dekusOriginalSpeed = heartSpeed;
            _superState.dekusDmgMult = 2;
            _superState.dekusParticles = true;
            heartSpeed *= 3;
        },
        onDeactivate() {
            heartSpeed = _superState.dekusOriginalSpeed;
            _superState.dekusActive = false;
            _superState.dekusDmgMult = 1;
            _superState.dekusParticles = false;
        },
        onTick(dt) {
            if (_superState.dekusActive && arenaActive) {
                let drain = arenaMaxHP * 0.02 * dt;
                arenaHP = Math.max(0, arenaHP - drain);
                document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP));
                if (arenaHP <= 0 && typeof loseArena === 'function') loseArena();
            }
        }
    },

    "Сайтама": {
        name: "ОБЫЧНЫЙ УДАР",
        cooldown: 20000, toggleable: false, duration: 0,
        onActivate() {
            let willOneshot = Math.random() < 0.01;
            _superState.fists.push({ x: heart.x, y: heart.y-20, vx: 0, vy: -7, size: 45, life: 80, color: "#ff2222", willOneshot, oneshotChecked: false, pathWidth: 90, owner: "Сайтама" });
            if (typeof sfxWhoosh === 'function') sfxWhoosh();
        },
        onTick() {}
    },

    "Борос": {
        name: "РЕГЕНЕРАЦИЯ",
        cooldown: 20000, toggleable: false, duration: 5000,
        onActivate() {
            _superState.borosHeal = { active: true, healPerSec: arenaMaxHP * 0.06, elapsed: 0, totalDuration: 5 };
            _superState.borosParticles = true;
            heartSpeed *= 0.7;
        },
        onDeactivate() {
            if (_superState.borosHeal) { heartSpeed /= 0.7; _superState.borosHeal = null; _superState.borosParticles = false; }
        },
        onTick(dt) {
            if (_superState.borosHeal && _superState.borosHeal.active && arenaActive) {
                let h = _superState.borosHeal.healPerSec * dt;
                arenaHP = Math.min(arenaMaxHP, arenaHP + h);
                document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
                _superState.borosHeal.elapsed += dt;
                if (_superState.borosHeal.elapsed >= _superState.borosHeal.totalDuration) {
                    this.onDeactivate();
                    startCooldown("Борос", this.cooldown);
                }
            }
        }
    },

    "Бог Усопп": {
        name: "ЛОЖЬ СТАНОВИТСЯ ПРАВДОЙ",
        cooldown: 35000, toggleable: false, duration: 3000,
        onActivate() { _superState.usoppInvuln = true; },
        onDeactivate() { _superState.usoppInvuln = false; _superState.usoppStunTimer = 2; },
        onTick(dt) {}
    },

    // ====== ПЕРЕРАБОТАННЫЕ ======
    "Луффи: Ника, Бог Солнца": {
        name: "ОСВОБОЖДЕНИЕ",
        cooldown: 25000, toggleable: true, duration: Infinity,
        onActivate() {
            _superState.nikaActive = true;
            _superState.nikaHitboxOriginal = heart.hitbox;
            heart.hitbox *= 2;
            _superState.nikaDmgMult = 1.5;
            _superState.nikaSpeedBonus = 1.3;
            heartSpeed *= 1.3;
        },
        onDeactivate() {
            _superState.nikaActive = false;
            heart.hitbox = _superState.nikaHitboxOriginal;
            _superState.nikaDmgMult = 1;
            heartSpeed /= 1.3;
        },
        onTick(dt) {}
    },

    "Космический Гароу": {
        name: "ПОТОК ВСЕЛЕННОЙ",
        cooldown: 30000, toggleable: false, duration: 0,
        onActivate() {
            let now = performance.now();
            let target = null;
            for (let i = _superState.positionHistory.length-1; i >= 0; i--) {
                let p = _superState.positionHistory[i];
                if (now - p.time >= 2000) { target = p; break; }
            }
            if (!target && _superState.positionHistory.length > 0) target = _superState.positionHistory[0];
            if (target) {
                _superState.garouMarker = { x: target.x, y: target.y, alpha: 1.0, time: now };
                heart.x = target.x; heart.y = target.y;
                _superState.garouInvulnTimer = 1.0;
            }
            _superState.positionHistory = [];
        },
        onTick(dt) {}
    },

    "Зено": {
        name: "СТИРАНИЕ",
        cooldown: 45000, toggleable: false, duration: 0,
        onActivate() {
            attacks = [];
            arenaBlasters = [];
            arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.9);
            if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
            spawnFloatingText(heart.x, heart.y-20, "СТЁРТО!", "#ff00ff");
        },
        onTick() {}
    },

    "Анти-спираль": {
        name: "ПАССИВНАЯ",
        cooldown: 0, toggleable: false, duration: 0,
        onActivate() {},
        onTick() {}
    },

    "Молодой Гарп": {
        name: "ГАЛАКТИЧЕСКИЙ КУЛАК",
        cooldown: 30000, toggleable: false, duration: 0,
        onActivate() {
            heartSpeed *= 0.5;
            _superState.garouStunTimer = 1.5;
            _superState.garouExplosionPending = true;
            spawnFloatingText(heart.x, heart.y-20, "ЗАРЯД...", "#4444ff");
        },
        onTick(dt) {}
    },

    "Им (Правитель)": {
        name: "ТЕНЕВОЕ ПРАВЛЕНИЕ",
        cooldown: 30000, toggleable: true, duration: Infinity,
        onActivate() {
            _superState.imAuraActive = true;
            _superState.imSpeedPenalty = true;
            heartSpeed *= 0.7;
        },
        onDeactivate() {
            _superState.imAuraActive = false;
            _superState.imSpeedPenalty = false;
            heartSpeed /= 0.7;
        },
        onTick(dt) {}
    },

    "Космический Дэнди": {
        name: "КОСМИЧЕСКАЯ УДАЧА",
        cooldown: 20000, toggleable: false, duration: 0,
        onActivate() {
            if (Math.random() < 0.8) {
                let eff = DANDY_GOOD[Math.floor(Math.random() * DANDY_GOOD.length)];
                eff.apply();
                spawnFloatingText(heart.x, heart.y-20, eff.name + "!", "#44ff44");
            } else {
                let eff = DANDY_BAD[Math.floor(Math.random() * DANDY_BAD.length)];
                eff.apply();
                spawnFloatingText(heart.x, heart.y-20, eff.name + "!", "#ff4444");
            }
        },
        onTick() {}
    },

    "Кайдо": {
        name: "ДЫХАНИЕ РАЗРУШЕНИЯ",
        cooldown: 25000, toggleable: false, duration: 0,
        onActivate() {
            _superState.kaidoDrinking = true;
            heartSpeed *= 0.5;
            spawnFloatingText(heart.x, heart.y-20, "ГЛОТОК...", "#D2691E");
            setTimeout(() => {
                _superState.kaidoDrinking = false;
                heartSpeed /= 0.5;
                _superState.kaidoBuffActive = true;
                _superState.kaidoDmgReduction = true;
                _superState.invertControls = true;
                spawnFloatingText(heart.x, heart.y-20, "ЯРОСТЬ!", "#ff4444");
                setTimeout(() => {
                    _superState.kaidoBuffActive = false;
                    _superState.kaidoDmgReduction = false;
                    _superState.invertControls = false;
                }, 7000);
            }, 2000);
        },
        onTick() {}
    },

    "Император Марк": {
        name: "ПАССИВНАЯ",
        cooldown: 0, toggleable: false, duration: 0,
        onActivate() {},
        onTick() {}
    },

    "Всемогущий (прайм)": {
        name: "СИМВОЛ МИРА",
        cooldown: 40000, toggleable: false, duration: 0,
        onActivate() {
            let origHitbox = heart.hitbox;
            heart.hitbox *= 2;
            _superState.allmightDmgMult = 3;
            _superState.allmightBuffTimer = 3;
            spawnFloatingText(heart.x, heart.y-20, "СИМВОЛ МИРА!", "#ffdd00");
            setTimeout(() => {
                heart.hitbox = origHitbox;
                _superState.allmightDmgMult = 1;
                arenaHP = Math.max(1, arenaHP - Math.floor(arenaMaxHP * 0.5));
                document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
                _superState.allmightPermaSlow = true;
                heartSpeed *= 0.33;
                spawnFloatingText(heart.x, heart.y-20, "ИСТОЩЕНИЕ!", "#ff0000");
                if (arenaHP <= 0 && typeof loseArena === 'function') loseArena();
            }, 3000);
        },
        onTick() {}
    }
};

// ====== УПРАВЛЕНИЕ ======
function getMainCard() {
    if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) {
        let idx = team[mainCardIndex];
        if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) return myCards[idx];
    }
    return null;
}

function toggleSuper() {
    if (!arenaActive) return;
    let mainCard = getMainCard();
    if (!mainCard || !superAbilities[mainCard.name]) return;
    let ab = superAbilities[mainCard.name];
    if (ab.cooldown === 0 && !ab.toggleable) return;
    let cd = _superCooldowns[mainCard.name] || { ready: true };
    if (!cd.ready) return;
    if (ab.toggleable) {
        if (_activeSuperName === mainCard.name) {
            if (ab.onDeactivate) ab.onDeactivate();
            _activeSuperName = null;
            startCooldown(mainCard.name, ab.cooldown);
        } else {
            if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) superAbilities[_activeSuperName].onDeactivate();
            ab.onActivate();
            _activeSuperName = mainCard.name;
        }
    } else {
        ab.onActivate();
        if (ab.duration > 0) {
            startCooldown(mainCard.name, ab.cooldown);
            setTimeout(() => { if (ab.onDeactivate) ab.onDeactivate(); if (_activeSuperName === mainCard.name) _activeSuperName = null; }, ab.duration);
        } else {
            startCooldown(mainCard.name, ab.cooldown);
        }
    }
    updateSuperButton();
}

function startCooldown(cardName, ms) {
    let cd = _superCooldowns[cardName];
    if (cd && cd.interval) clearInterval(cd.interval);
    _superCooldowns[cardName] = { ready: false, remaining: ms, start: Date.now() };
    let interval = setInterval(() => {
        let elapsed = Date.now() - _superCooldowns[cardName].start;
        _superCooldowns[cardName].remaining = ms - elapsed;
        if (_superCooldowns[cardName].remaining <= 0) { clearInterval(interval); _superCooldowns[cardName].ready = true; updateSuperButton(); }
        else updateSuperButton();
    }, 100);
    _superCooldowns[cardName].interval = interval;
}

function updateSuperButton() {
    let btn = document.getElementById("superBtn");
    if (!btn) return;
    let mainCard = getMainCard();
    if (!mainCard || !superAbilities[mainCard.name]) { btn.style.display = "none"; return; }
    let ab = superAbilities[mainCard.name];
    if (ab.cooldown === 0 && !ab.toggleable) { btn.style.display = "none"; return; }
    btn.style.display = "block";
    let cd = _superCooldowns[mainCard.name];
    if (_activeSuperName === mainCard.name) {
        btn.textContent = "⏹ " + ab.name + " (АКТИВЕН)"; btn.style.background = "#ff4444"; btn.style.animation = "none";
    } else if (cd && !cd.ready) {
        let sec = Math.ceil(cd.remaining / 1000);
        btn.textContent = "⏳ " + ab.name + " (" + sec + "с)"; btn.style.background = "#555"; btn.style.animation = "none";
    } else {
        btn.textContent = "⚡ " + ab.name;
        btn.style.background = "linear-gradient(135deg, #f5af19, #f12711)"; btn.style.animation = "superPulse 2s infinite";
    }
}

function resetAllSupers() {
    if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) superAbilities[_activeSuperName].onDeactivate();
    _activeSuperName = null;
    _superState.dekusActive = false; _superState.dekusDmgMult = 1; _superState.dekusParticles = false;
    _superState.borosHeal = null; _superState.borosParticles = false;
    _superState.usoppInvuln = false; _superState.usoppStunTimer = 0;
    _superState.nikaActive = false; _superState.nikaDmgMult = 1;
    _superState.positionHistory = []; _superState.garouMarker = null; _superState.garouInvulnTimer = 0;
    _superState.garouStunTimer = 0; _superState.garouExplosionPending = false;
    _superState.imAuraActive = false; _superState.imSpeedPenalty = false;
    _superState.kaidoDrinking = false; _superState.kaidoBuffActive = false; _superState.kaidoDmgReduction = false; _superState.invertControls = false;
    _superState.allmightDmgMult = 1; _superState.allmightBuffTimer = 0;
    _superState.antispiralFrozen = false; _superState.antispiralSpeedBoost = false;
    _superState.dandyLightnings = false; _superState.dandyInvuln = false; _superState.dandyDmgBuff = null; _superState.dandyShield = null; _superState.dandyVulnerable = null; _superState.dandyDoubleTargets = false;
    _superState.fists = [];
}

function initSuperState() {
    _activeSuperName = null;
    _superState = {
        fists: [],
        dekusActive: false, dekusOriginalSpeed: 1.2, dekusDmgMult: 1, dekusParticles: false,
        borosHeal: null, borosParticles: false,
        usoppInvuln: false, usoppStunTimer: 0,
        nikaActive: false, nikaHitboxOriginal: 4, nikaDmgMult: 1, nikaSpeedBonus: 1,
        positionHistory: [], garouMarker: null, garouInvulnTimer: 0,
        garouStunTimer: 0, garouExplosionPending: false,
        imAuraActive: false, imSpeedPenalty: false,
        dandyLightnings: false, dandyInvuln: false, dandyDmgBuff: null, dandyShield: null, dandyVulnerable: null, dandyDoubleTargets: false,
        kaidoDrinking: false, kaidoBuffActive: false, kaidoDmgReduction: false, invertControls: false,
        markResurrectUsed: false,
        allmightPermaSlow: false, allmightDmgMult: 1, allmightBuffTimer: 0,
        antispiralFrozen: false, antispiralSpeedBoost: false,
    };
    _superLastTick = performance.now();
    updateSuperButton();
}

// ====== ТИК КАЖДЫЙ КАДР ======
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

    // История позиций для Гароу
    if (arenaPhase === "dodge" && mainCard && mainCard.name === "Космический Гароу") {
        let now = performance.now();
        _superState.positionHistory.push({ time: now, x: heart.x, y: heart.y });
        while (_superState.positionHistory.length > 0 && now - _superState.positionHistory[0].time > 5000) _superState.positionHistory.shift();
    }

    // Таймеры
    if (_superState.usoppStunTimer > 0) { _superState.usoppStunTimer -= dt; if (_superState.usoppStunTimer < 0) _superState.usoppStunTimer = 0; }
    if (_superState.garouInvulnTimer > 0) { _superState.garouInvulnTimer -= dt; if (_superState.garouInvulnTimer < 0) _superState.garouInvulnTimer = 0; }
    if (_superState.garouStunTimer > 0) {
        _superState.garouStunTimer -= dt;
        if (_superState.garouStunTimer <= 0) {
            _superState.garouStunTimer = 0;
            if (_superState.garouExplosionPending) {
                _superState.garouExplosionPending = false;
                heartSpeed *= 2;
                attacks = [];
                arenaBlasters = [];
                arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.95);
                spawnFloatingText(heart.x, heart.y-20, "ГАЛАКТИКА!", "#4444ff");
                if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
            }
        }
    }
    if (_superState.allmightBuffTimer > 0) { _superState.allmightBuffTimer -= dt; if (_superState.allmightBuffTimer < 0) _superState.allmightBuffTimer = 0; }

    // Таймеры Дэнди
    if (_superState.dandyDmgBuff) { _superState.dandyDmgBuff.timer -= dt; if (_superState.dandyDmgBuff.timer <= 0) _superState.dandyDmgBuff = null; }
    if (_superState.dandyShield) { _superState.dandyShield.timer -= dt; if (_superState.dandyShield.timer <= 0) _superState.dandyShield = null; }
    if (_superState.dandyVulnerable) { _superState.dandyVulnerable.timer -= dt; if (_superState.dandyVulnerable.timer <= 0) _superState.dandyVulnerable = null; }

    // Затухание маркера Гароу
    if (_superState.garouMarker) {
        let elapsed = (performance.now() - _superState.garouMarker.time) / 1000;
        if (elapsed > 1.5) _superState.garouMarker = null;
        else _superState.garouMarker.alpha = 1 - elapsed / 1.5;
    }

    // Молнии Деку
    if (_superState.dekusParticles && arenaActive) {
        for (let i = 0; i < 2; i++) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 15 + Math.random() * 20;
            arenaParticles.push({ x: heart.x + Math.cos(angle)*8, y: heart.y + Math.sin(angle)*8, endX: heart.x + Math.cos(angle)*dist, endY: heart.y + Math.sin(angle)*dist, vx: 0, vy: 0, life: 12, maxLife: 12, color: "#44ff44", isLightning: true });
        }
    }

    // Аура Бороса
    if (_superState.borosParticles && arenaActive) {
        for
