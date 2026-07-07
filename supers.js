// ========== СУПЕР-СПОСОБНОСТИ СЕКРЕТНЫХ КАРТ (АРЕНА) v2.0 ==========
// Глобальные переменные для визуалов и состояний
let _superState = {
    fists: [],                  // кулаки (Сайтама, Гарп)
    dekusActive: false,
    dekusOriginalSpeed: 1.2,
    dekusDmgMult: 1,
    dekusParticles: false,
    borosHeal: null,           // { active, healPerSec, timer, elapsed }
    borosParticles: false,
    usoppInvuln: false,
    usoppStunTimer: 0,
    antispiralFrozen: false,   // заморожены ли атаки (визуал + остановка)
    antispiralSpeedBoost: false, // после разморозки атаки быстрее навсегда
    imAuraActive: false,
    imAuraRadius: 80,
    imSpeedPenalty: false,
    markBuffActive: false,
    markDebuffActive: false,
    // ... можно добавить другие состояния при необходимости
};

let _superCooldowns = {};      // для каждой карты: { ready: bool, remaining: ms }
let _activeSuperName = null;   // имя активной переключаемой способности (для Деку, Луффи, Усоппа, Има)
let _superLastTick = 0;

// ========== ОПИСАНИЯ СПОСОБНОСТЕЙ ==========
const superAbilities = {
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
                // теряем 2% от макс. HP в секунду
                let drain = arenaMaxHP * 0.02 * dt;
                arenaHP = Math.max(0, arenaHP - drain);
                document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP));
                if (arenaHP <= 0) loseArena();
            }
        }
    },
    "Сайтама": {
        name: "ОБЫЧНЫЙ УДАР",
        cooldown: 20000, toggleable: false, duration: 0,
        onActivate() {
            // кулак летит вправо
            _superState.fists.push({
                x: heart.x, y: heart.y,
                vx: 6, vy: 0,
                size: 30,
                life: 60,
                color: "#ff4444",
                bossOneShotChance: 0.01,
                destroyAllInPath: false, // только в своей полосе
                pathWidth: 60,
                owner: "Сайтама"
            });
            sfxWhoosh();
        },
        onTick(dt) {} // не используется
    },
    "Борос": {
        name: "РЕГЕНЕРАЦИЯ",
        cooldown: 20000, toggleable: false, duration: 5000,
        onActivate() {
            _superState.borosHeal = {
                active: true,
                healPerSec: arenaMaxHP * 0.06, // 30% за 5 сек = 6% в сек
                elapsed: 0,
                totalDuration: 5
            };
            _superState.borosParticles = true;
            // дебафф: скорость снижена на 30%
            heartSpeed *= 0.7;
        },
        onDeactivate() {
            heartSpeed /= 0.7; // восстанавливаем
            _superState.borosHeal = null;
            _superState.borosParticles = false;
        },
        onTick(dt) {
            if (_superState.borosHeal && _superState.borosHeal.active) {
                let h = _superState.borosHeal.healPerSec * dt;
                arenaHP = Math.min(arenaMaxHP, arenaHP + h);
                document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
                _superState.borosHeal.elapsed += dt;
                if (_superState.borosHeal.elapsed >= _superState.borosHeal.totalDuration) {
                    this.onDeactivate();
                    // запускаем перезарядку
                    startCooldown("Борос", this.cooldown);
                }
            }
        }
    },
    // Остальные персонажи добавляются аналогично с корректным dt и визуалами
    // ... (в полной версии будут все 14, сейчас добавляю остальных для структуры)
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function toggleSuper() {
    if (!arenaActive) return;
    let mainCard = getMainCard();
    if (!mainCard || !superAbilities[mainCard.name]) return;
    let ab = superAbilities[mainCard.name];
    let cd = _superCooldowns[mainCard.name] || { ready: true };
    if (!cd.ready) return;

    if (ab.toggleable) {
        if (_activeSuperName === mainCard.name) {
            // деактивировать
            if (ab.onDeactivate) ab.onDeactivate();
            _activeSuperName = null;
            startCooldown(mainCard.name, ab.cooldown);
        } else {
            // сначала деактивируем предыдущую переключаемую
            if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onDeactivate) {
                superAbilities[_activeSuperName].onDeactivate();
            }
            ab.onActivate();
            _activeSuperName = mainCard.name;
        }
    } else {
        ab.onActivate();
        if (ab.duration > 0) {
            // способность с фиксированной длительностью
            startCooldown(mainCard.name, ab.cooldown);
            setTimeout(() => {
                if (ab.onDeactivate) ab.onDeactivate();
                _activeSuperName = null;
            }, ab.duration);
        } else {
            // мгновенная
            startCooldown(mainCard.name, ab.cooldown);
        }
    }
    updateSuperButton();
}

function startCooldown(cardName, ms) {
    _superCooldowns[cardName] = { ready: false, remaining: ms, start: Date.now() };
    let interval = setInterval(() => {
        let elapsed = Date.now() - _superCooldowns[cardName].start;
        _superCooldowns[cardName].remaining = ms - elapsed;
        if (_superCooldowns[cardName].remaining <= 0) {
            clearInterval(interval);
            _superCooldowns[cardName].ready = true;
            updateSuperButton();
        } else {
            updateSuperCooldownText(cardName);
        }
    }, 100);
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

function updateSuperCooldownText(cardName) {
    // обновление текста кнопки при перезарядке
    updateSuperButton();
}

function getMainCard() {
    if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) {
        let idx = team[mainCardIndex];
        if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) {
            return myCards[idx];
        }
    }
    return null;
}

// ========== ИНИЦИАЛИЗАЦИЯ ПРИ СТАРТЕ АРЕНЫ ==========
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

// ========== ВЫЗОВ КАЖДЫЙ КАДР ИЗ renderArena ==========
function tickSupers() {
    if (!arenaActive) return;
    let now = performance.now();
    let dt = (now - _superLastTick) / 1000; // в секундах
    if (dt <= 0) dt = 0.016;
    _superLastTick = now;

    // Обновление активных способностей
    if (_activeSuperName && superAbilities[_activeSuperName] && superAbilities[_activeSuperName].onTick) {
        superAbilities[_activeSuperName].onTick(dt);
    }
    // Обновление кулаков и визуалов
    updateSuperVisuals(dt);
    // Обновление кнопки (на случай завершения перезарядки)
    updateSuperButton();
}

// ========== ВИЗУАЛЫ И ЛОГИКА КУЛАКОВ ==========
function updateSuperVisuals(dt) {
    if (!ctx) return; // глобальный контекст из battle.js

    // Зелёные искры Деку
    if (_superState.dekusParticles && arenaActive) {
        for (let i = 0; i < 3; i++) {
            arenaParticles.push({
                x: heart.x + (Math.random() - 0.5) * 30,
                y: heart.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 20, maxLife: 20,
                color: "#44ff44", size: 2 + Math.random() * 3
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

    // Обновление и отрисовка кулаков
    for (let i = _superState.fists.length - 1; i >= 0; i--) {
        let f = _superState.fists[i];
        f.x += f.vx;
        f.y += f.vy;
        f.life--;
        if (f.life <= 0 || f.x > 420 || f.x < -20 || f.y > 520 || f.y < -20) {
            _superState.fists.splice(i, 1);
            continue;
        }

        // Отрисовка кулака
        ctx.save();
        ctx.fillStyle = f.color;
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("👊", f.x, f.y);
        ctx.restore();

        // Проверка столкновений с атаками
        let pathWidth = f.pathWidth || 60;
        for (let j = attacks.length - 1; j >= 0; j--) {
            let a = attacks[j];
            let ax = a.x + (a.size || a.radius || 20) / 2;
            let ay = a.y + (a.size || a.radius || 20) / 2;
            // попадание в полосу кулака
            if (Math.abs(ax - f.x) < pathWidth/2 && Math.abs(ay - f.y) < f.size + 20) {
                // уничтожаем атаку
                for (let p = 0; p < 8; p++) {
                    arenaParticles.push({
                        x: ax, y: ay,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        life: 15, maxLife: 15,
                        color: "#ffaa00", size: 2 + Math.random() * 3
                    });
                }
                attacks.splice(j, 1);
                sfxBounce();
            }
        }

        // Проверка ваншота босса (только Сайтама)
        if (f.owner === "Сайтама" && arenaBossMaxHP > 0 && Math.random() < f.bossOneShotChance) {
            arenaBossMaxHP = 0;
            sfxArenaVictory();
            winArena();
            _superState.fists.splice(i, 1);
            break;
        }
        // Урон боссу от Гарпа (10% от макс. HP)
        if (f.owner === "Гарп" && arenaBossMaxHP > 0) {
            let dmg = Math.floor(arenaBossMaxHP * 0.1);
            arenaBossMaxHP -= dmg;
            // отдача: сердце отбрасывает
            heart.vx += (Math.random() - 0.5) * 160;
            heart.vy += (Math.random() - 0.5) * 120;
            spawnFloatingText(heart.x, heart.y - 20, "ОТДАЧА!", "#ffaa00");
            _superState.fists.splice(i, 1);
            break;
        }
    }

    // Визуал ауры Има (если активна)
    if (_superState.imAuraActive && arenaActive) {
        ctx.save();
        ctx.strokeStyle = "rgba(128, 0, 128, 0.8)";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#800080";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(heart.x, heart.y, _superState.imAuraRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        // уничтожение атак в ауре
        for (let j = attacks.length - 1; j >= 0; j--) {
            let a = attacks[j];
            let ax = a.x + (a.size || a.radius || 20)/2;
            let ay = a.y + (a.size || a.radius || 20)/2;
            if (Math.hypot(ax - heart.x, ay - heart.y) < _superState.imAuraRadius) {
                attacks.splice(j, 1);
                // вспышка
                arenaParticles.push({
                    x: ax, y: ay,
                    vx: 0, vy: 0,
                    life: 10, maxLife: 10,
                    color: "#ff00ff", size: 5
                });
            }
        }
    }

    // Заморозка атак Анти-спираля (визуальная остановка + после разморозки ускорение)
    if (_superState.antispiralFrozen) {
        // атаки не двигаются, это реализовано в moveHeart? Нужно пропустить движение атак в renderArena.
        // Мы можем в renderArena проверять флаг _superState.antispiralFrozen и не прибавлять spd.
        // Пока оставим визуальный эффект: лёд на атаках
        for (let a of attacks) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#aaddff";
            let sz = a.size || a.radius || 20;
            ctx.fillRect(a.x - 2, a.y - 2, sz + 4, sz + 4);
            ctx.restore();
        }
    }
}

// Экспортируем функции в глобальную область
window.toggleSuper = toggleSuper;
window.initSuperState = initSuperState;
window.tickSupers = tickSupers;
