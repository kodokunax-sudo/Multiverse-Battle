// ========== СУПЕР-СПОСОБНОСТИ СЕКРЕТНЫХ КАРТ (АРЕНА) v2.5 ==========
// Вся отрисовка внутри этого файла
// Активны: Деку (100%), Сайтама, Борос
// Остальные — шаблоны-заглушки

let _superState = {
    fists: [],
    dekusActive: false,
    dekusOriginalSpeed: 1.2,
    dekusDmgMult: 1,
    dekusParticles: false,
    borosHeal: null,
    borosParticles: false,
    usoppInvuln: false,
    usoppStunTimer: 0,
    antispiralFrozen: false,
    antispiralSpeedBoost: false,
    imAuraActive: false,
    imAuraRadius: 80,
    imSpeedPenalty: false,
    markBuffActive: false,
    markDebuffActive: false,
};

let _superCooldowns = {};
let _activeSuperName = null;
let _superLastTick = 0;

// ========== ФУНКЦИИ ОТРИСОВКИ ==========
function drawLightningBolt(x1, y1, x2, y2, color, alpha) {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * alpha;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    // Зигзаги
    let segments = 4;
    for (let i = 1; i < segments; i++) {
        let t = i / segments;
        let mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 25;
        let my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 25;
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
    
    // Свечение
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 30;
    
    // Корпус кулака
    ctx.fillStyle = "#ff2222";
    ctx.fillRect(-s, -s * 1.2, s * 2, s * 2.4);
    
    // Пальцы (вертикальные полосы)
    ctx.fillStyle = "#ff5555";
    ctx.fillRect(-s * 0.7, -s * 1.2, s * 0.4, s * 2.4);
    ctx.fillRect(s * 0.3, -s * 1.2, s * 0.4, s * 2.4);
    
    // Тёмная полоса снизу
    ctx.fillStyle = "#aa0000";
    ctx.fillRect(-s, s * 0.8, s * 2, s * 0.4);
    
    // Белая обводка
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 0;
    ctx.strokeRect(-s, -s * 1.2, s * 2, s * 2.4);
    
    // Текст "УДАР" внутри
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 4;
    ctx.fillText("УДАР", 0, 0);
    
    ctx.restore();
}

// ========== ОПИСАНИЯ СПОСОБНОСТЕЙ ==========
const superAbilities = {
    // ====== ГОТОВЫЕ ======
    "Деку (100%)": {
        name: "ПОЛНОЕ 100% ПОКРЫТИЕ",
        cooldown: 15000,
        toggleable: true,
        duration: Infinity,
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
        cooldown: 20000,
        toggleable: false,
        duration: 0,
        onActivate() {
            let willOneshot = Math.random() < 0.01;
            _superState.fists.push({
                x: heart.x,
                y: heart.y - 20,
                vx: 0,
                vy: -7,
                size: 45,
                life: 80,
                color: "#ff2222",
                willOneshot: willOneshot,
                oneshotChecked: false,
                pathWidth: 90,
                owner: "Сайтама"
            });
            if (typeof sfxWhoosh === 'function') sfxWhoosh();
        },
        onTick() {}
    },

    "Борос": {
        name: "РЕГЕНЕРАЦИЯ",
        cooldown: 20000,
        toggleable: false,
        duration: 5000,
        onActivate() {
            _superState.borosHeal = {
                active: true,
                healPerSec: arenaMaxHP * 0.06,
                elapsed: 0,
                totalDuration: 5
            };
            _superState.borosParticles = true;
            heartSpeed *= 0.7;
        },
        onDeactivate() {
            if (_superState.borosHeal) {
                heartSpeed /= 0.7;
                _superState.borosHeal = null;
                _superState.borosParticles = false;
            }
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

    // ====== ШАБЛОНЫ ======
    "Луффи: Ника, Бог Солнца": {
        name: "ОСВОБОЖДЕНИЕ (шаблон)",
        cooldown: 25000, toggleable: true, duration: Infinity,
        onActivate() {}, onDeactivate() {}, onTick() {}
    },
    "Космический Гароу": {
        name: "ПОТОК ВСЕЛЕННОЙ (шаблон)",
        cooldown: 30000, toggleable: false, duration: 0,
        onActivate() {}, onTick() {}
    },
    "Бог Усопп": {
        name: "ЛОЖЬ СТАНОВИТСЯ ПРАВДОЙ (шаблон)",
        cooldown: 35000, toggleable: true, duration: 3000,
        onActivate() {}, onDeactivate() {}, onTick() {}
    },
    "Зено": {
        name: "СТИРАНИЕ (шаблон)",
        cooldown: 60000, toggleable: false, duration: 0,
        onActivate() {}, onTick() {}
    },
    "Анти-спираль": {
        name: "АБСОЛЮТНОЕ ОТЧАЯНИЕ (шаблон)",
        cooldown: 25000, toggleable: false, duration: 0,
        onActivate() {}, onTick() {}
    },
    "Молодой Гарп": {
        name: "ГАЛАКТИЧЕСКИЙ КУЛАК (шаблон)",
        cooldown: 30000, toggleable: false, duration: 0,
        onActivate() {}, onTick() {}
    },
    "Им (Правитель)": {
        name: "ТЕНЕВОЕ ПРАВЛЕНИЕ (шаблон)",
        cooldown: 30000, toggleable: true, duration: 6000,
        onActivate() {}, onDeactivate() {}, onTick() {}
    },
    "Космический Дэнди": {
        name: "КОСМИЧЕСКАЯ УДАЧА (шаблон)",
        cooldown: 20000, toggleable: false, duration: 0,
        onActivate() {}, onTick() {}
    },
    "Кайдо": {
        name: "ДЫХАНИЕ РАЗРУШЕНИЯ (шаблон)",
        cooldown: 25000, toggleable: false, duration: 0,
        onActivate() {}, onTick() {}
    },
    "Император Марк": {
        name: "НЕПОБЕДИМАЯ ВОЛЯ (шаблон)",
        cooldown: 30000, toggleable: false, duration: 6000,
        onActivate() {}, onDeactivate() {}, onTick() {}
    },
    "Всемогущий (прайм)": {
        name: "СИМВОЛ МИРА (шаблон)",
        cooldown: 40000, toggleable: false, duration: 0,
        onActivate() {}, onTick() {}
    }
};

// ========== УПРАВЛЕНИЕ ==========
function getMainCard() {
    if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) {
        let idx = team[mainCardIndex];
        if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) {
            return myCards[idx];
        }
    }
    return null;
}

function toggleSuper() {
    if (!arenaActive) return;
    let mainCard = getMainCard();
    if (!mainCard || !superAbilities[mainCard.name]) return;
    let ab = superAbilities[mainCard.name];
    let cd = _superCooldowns[mainCard.name] || { ready: true };
    if (!cd.ready) return;

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
            setTimeout(() => {
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
    let cd = _superCooldowns[cardName];
    if (cd && cd.interval) clearInterval(cd.interval);
    _superCooldowns[cardName] = { ready: false, remaining: ms, start: Date.now() };
    let interval = setInterval(() => {
        let elapsed = Date.now() - _superCooldowns[cardName].start;
        _superCooldowns[cardName].remaining = ms - elapsed;
        if (_superCooldowns[cardName].remaining <= 0) {
            clearInterval(interval);
            _superCooldowns[cardName].ready = true;
            updateSuperButton();
        } else {
            updateSuperButton();
        }
    }, 100);
    _superCooldowns[cardName].interval = interval;
}

function updateSuperButton() {
    let btn = document.getElementById("superBtn");
    if (!btn) return;
    let mainCard = getMainCard();
    if (!mainCard || !superAbilities[mainCard.name]) {
        btn.style.display = "none";
        return;
    }
    btn.style.display = "block";
    let ab = superAbilities[mainCard.name];
    let cd = _superCooldowns[mainCard.name];
    if (_activeSuperName === mainCard.name) {
        btn.textContent = "⏹ " + ab.name + " (АКТИВЕН)";
        btn.style.background = "#ff4444";
        btn.style.animation = "none";
    } else if (cd && !cd.ready) {
        let sec = Math.ceil(cd.remaining / 1000);
        btn.textContent = "⏳ " + ab.name + " (" + sec + "с)";
        btn.style.background = "#555";
        btn.style.animation = "none";
    } else {
        btn.textContent = "⚡ " + ab.name;
        btn.style.background = "linear-gradient(135deg, #f5af19, #f12711)";
        btn.style.animation = "superPulse 2s infinite";
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initSuperState() {
    _activeSuperName = null;
    _superState = {
        fists: [],
        dekusActive: false,
        dekusOriginalSpeed: 1.2,
        dekusDmgMult: 1,
        dekusParticles: false,
        borosHeal: null,
        borosParticles: false,
        usoppInvuln: false,
        usoppStunTimer: 0,
        antispiralFrozen: false,
        antispiralSpeedBoost: false,
        imAuraActive: false,
        imAuraRadius: 80,
        imSpeedPenalty: false,
        markBuffActive: false,
        markDebuffActive: false,
    };
    _superLastTick = performance.now();
    updateSuperButton();
}

// ========== ТИК КАЖДЫЙ КАДР (логика + генерация частиц) ==========
function tickSupers() {
    if (!arenaActive || !ctx) return;
    let now = performance.now();
    let dt = (now - _superLastTick) / 1000;
    if (dt <= 0) dt = 0.016;
    _superLastTick = now;

    // Тик активных способностей
    if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onTick) {
        superAbilities[_activeSuperName].onTick(dt);
    }
    if (_superState.borosHeal && _superState.borosHeal.active && superAbilities["Борос"] && superAbilities["Борос"].onTick) {
        superAbilities["Борос"].onTick(dt);
    }

    // Генерация частиц и логика кулаков
    updateSuperLogic(dt);
    
    // Отрисовка всего (кулаки, молнии)
    renderSuperVisuals();
    
    updateSuperButton();
}

function updateSuperLogic(dt) {
    // Молнии Деку (добавляем как частицы-молнии)
    if (_superState.dekusParticles && arenaActive) {
        for (let i = 0; i < 4; i++) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 20 + Math.random() * 25;
            let startX = heart.x + Math.cos(angle) * 10;
            let startY = heart.y + Math.sin(angle) * 10;
            let endX = heart.x + Math.cos(angle) * dist;
            let endY = heart.y + Math.sin(angle) * dist;
            
            arenaParticles.push({
                x: startX, y: startY,
                endX: endX, endY: endY,
                vx: 0, vy: 0,
                life: 15, maxLife: 15,
                color: "#44ff44",
                isLightning: true
            });
        }
    }

    // Зелёная аура Бороса
    if (_superState.borosParticles && arenaActive) {
        for (let i = 0; i < 2; i++) {
            arenaParticles.push({
                x: heart.x + (Math.random() - 0.5) * 40,
                y: heart.y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 1,
                vy: -1 - Math.random(),
                life: 30, maxLife: 30,
                color: "#66ff66", size: 3 + Math.random() * 4
            });
        }
    }

    // Логика кулаков
    for (let i = _superState.fists.length - 1; i >= 0; i--) {
        let f = _superState.fists[i];
        f.x += f.vx;
        f.y += f.vy;
        f.life--;

        // Уничтожение атак
        let pathWidth = f.pathWidth || 90;
        for (let j = attacks.length - 1; j >= 0; j--) {
            let a = attacks[j];
            let ax = a.x + (a.size || a.radius || 20) / 2;
            let ay = a.y + (a.size || a.radius || 20) / 2;
            if (Math.abs(ax - f.x) < pathWidth / 2 && Math.abs(ay - f.y) < f.size + 20) {
                for (let p = 0; p < 12; p++) {
                    arenaParticles.push({
                        x: ax, y: ay,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 20, maxLife: 20,
                        color: "#ffaa00", size: 2 + Math.random() * 4
                    });
                }
                attacks.splice(j, 1);
                if (typeof sfxBounce === 'function') sfxBounce();
            }
        }

        // Ваншот босса
        if (f.owner === "Сайтама" && f.willOneshot && !f.oneshotChecked && arenaBossMaxHP > 0) {
            f.oneshotChecked = true;
            arenaBossMaxHP = 0;
            if (typeof sfxArenaVictory === 'function') sfxArenaVictory();
            if (typeof winArena === 'function') winArena();
            _superState.fists.splice(i, 1);
            break;
        }

        if (f.life <= 0 || f.y < -100 || f.y > 600 || f.x < -50 || f.x > 450) {
            _superState.fists.splice(i, 1);
        }
    }
}

function renderSuperVisuals() {
    if (!ctx) return;

    // Отрисовка молний
    for (let i = arenaParticles.length - 1; i >= 0; i--) {
        let p = arenaParticles[i];
        if (p.isLightning && p.life > 0) {
            let alpha = p.life / p.maxLife;
            drawLightningBolt(p.x, p.y, p.endX, p.endY, p.color, alpha);
        }
    }

    // Отрисовка кулаков
    if (_superState.fists && _superState.fists.length > 0) {
        for (let f of _superState.fists) {
            if (f.life > 0) drawFist(f);
        }
    }
}

// ========== ЭКСПОРТ ==========
window.toggleSuper = toggleSuper;
window.initSuperState = initSuperState;
window.tickSupers = tickSupers;
