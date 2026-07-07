// ========== СУПЕР-СПОСОБНОСТИ СЕКРЕТНЫХ КАРТ (АРЕНА) ==========

const superAbilities = {
    // Деку (100%)
    "Деку (100%)": {
        name: "ПОЛНОЕ 100% ПОКРЫТИЕ",
        cooldown: 15000,       // 15 секунд после окончания
        duration: Infinity,    // работает пока не отключат вручную
        toggleable: true,
        onActivate: function() {
            // Увеличиваем скорость сердца в 3 раза, урон в 2 раза
            window._superDekuActive = true;
            window._superDekuOriginalSpeed = heartSpeed;
            heartSpeed *= 3;
            // флаг для удвоения урона при попадании по боссу
            window._superDekuDamageMult = 2;
            // визуал: зелёные искры
            window._superDekuParticles = true;
        },
        onDeactivate: function() {
            heartSpeed = window._superDekuOriginalSpeed || heartSpeed;
            window._superDekuActive = false;
            window._superDekuDamageMult = 1;
            window._superDekuParticles = false;
        },
        onTick: function() {
            // Каждую секунду теряем 2% HP
            if (window._superDekuActive && arenaActive && arenaHP > 0) {
                let drain = Math.ceil(arenaMaxHP * 0.02);
                arenaHP = Math.max(0, arenaHP - drain);
                document.getElementById("arenaHP").innerText = Math.max(0, Math.ceil(arenaHP));
                if (arenaHP <= 0) loseArena();
            }
        }
    },
    // Сайтама
    "Сайтама": {
        name: "ОБЫЧНЫЙ УДАР",
        cooldown: 20000,
        duration: 0, // мгновенное действие
        toggleable: false,
        onActivate: function() {
            // Создаём "кулак" — ударную волну
            let fist = {
                x: heart.x,
                y: heart.y,
                vx: 6, // летит вправо
                vy: 0,
                size: 30,
                life: 60,
                color: "#ff4444",
                bossOneShotChance: 0.01
            };
            if (!window._superFists) window._superFists = [];
            window._superFists.push(fist);
            sfxWhoosh();
            // уничтожает все атаки на пути (будет проверяться в renderArena)
        }
    },
    // Борос
    "Борос": {
        name: "РЕГЕНЕРАЦИЯ",
        cooldown: 20000,
        duration: 5000,
        toggleable: false,
        onActivate: function() {
            window._superBorosHeal = {
                active: true,
                healPerSecond: Math.floor(arenaMaxHP * 0.06), // 30% за 5 сек = 6% в сек
                timer: 5
            };
            // визуал: зелёная аура
            window._superBorosParticles = true;
        },
        onTick: function() {
            if (window._superBorosHeal && window._superBorosHeal.active) {
                let h = window._superBorosHeal.healPerSecond;
                arenaHP = Math.min(arenaMaxHP, arenaHP + h);
                document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
                window._superBorosHeal.timer--;
                if (window._superBorosHeal.timer <= 0) {
                    window._superBorosHeal.active = false;
                    window._superBorosParticles = false;
                }
            }
        }
    }
};

// Состояние перезарядок и активных способностей
let superCooldowns = {}; // для каждого имени карты: { ready: bool, timer: null/interval }
let activeSuper = null;  // имя текущей активной toggle-способности (для Деку)

// Функция запуска/остановки супер-способности (вызывается из UI)
function toggleSuper() {
    if (!arenaActive) return;
    // Определяем главную карту
    let mainCard = null;
    if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) {
        let idx = team[mainCardIndex];
        if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) {
            mainCard = myCards[idx];
        }
    }
    if (!mainCard || !superAbilities[mainCard.name]) {
        // Нет супер-способности
        return;
    }
    let ab = superAbilities[mainCard.name];
    let cd = superCooldowns[mainCard.name] || { ready: true };
    if (!cd.ready) return; // перезарядка

    if (ab.toggleable) {
        if (activeSuper === mainCard.name) {
            // деактивировать
            ab.onDeactivate();
            activeSuper = null;
            // начать перезарядку
            startCooldown(mainCard.name, ab.cooldown);
        } else {
            if (activeSuper) {
                // сначала деактивируем предыдущую
                let prevAb = superAbilities[activeSuper];
                if (prevAb && prevAb.onDeactivate) prevAb.onDeactivate();
            }
            ab.onActivate();
            activeSuper = mainCard.name;
            // для toggleable не запускаем перезарядку пока активно
        }
    } else {
        ab.onActivate();
        startCooldown(mainCard.name, ab.cooldown);
        if (ab.duration > 0) {
            setTimeout(() => {
                if (activeSuper === mainCard.name) {
                    activeSuper = null;
                }
            }, ab.duration);
        }
    }
    updateSuperButton();
}

function startCooldown(cardName, ms) {
    superCooldowns[cardName] = { ready: false };
    let start = Date.now();
    let interval = setInterval(() => {
        let elapsed = Date.now() - start;
        let remaining = ms - elapsed;
        if (remaining <= 0) {
            clearInterval(interval);
            superCooldowns[cardName] = { ready: true };
            updateSuperButton();
        } else {
            updateSuperCooldownText(cardName, remaining);
        }
    }, 100);
    superCooldowns[cardName].interval = interval;
}

function updateSuperButton() {
    let btn = document.getElementById("superBtn");
    if (!btn) return;
    let mainCard = null;
    if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) {
        let idx = team[mainCardIndex];
        if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) {
            mainCard = myCards[idx];
        }
    }
    if (!mainCard || !superAbilities[mainCard.name]) {
        btn.style.display = "none";
        return;
    }
    btn.style.display = "block";
    let ab = superAbilities[mainCard.name];
    let cd = superCooldowns[mainCard.name];
    if (activeSuper === mainCard.name) {
        btn.textContent = "⏹ " + ab.name + " (АКТИВЕН)";
        btn.style.background = "#ff4444";
    } else if (cd && !cd.ready) {
        // показываем перезарядку в кнопке (обновляется updateSuperCooldownText)
        btn.style.background = "#555";
    } else {
        btn.textContent = "⚡ " + ab.name;
        btn.style.background = "linear-gradient(135deg, #f5af19, #f12711)";
    }
}

function updateSuperCooldownText(cardName, remainingMs) {
    let btn = document.getElementById("superBtn");
    if (!btn) return;
    let mainCard = null;
    if (typeof team !== 'undefined' && typeof mainCardIndex !== 'undefined' && team.length > 0) {
        let idx = team[mainCardIndex];
        if (typeof myCards !== 'undefined' && idx >= 0 && idx < myCards.length) {
            mainCard = myCards[idx];
        }
    }
    if (!mainCard || mainCard.name !== cardName) return;
    let ab = superAbilities[mainCard.name];
    let sec = Math.ceil(remainingMs / 1000);
    btn.textContent = "⏳ " + ab.name + " (" + sec + "с)";
}

// Вызывать каждый кадр в renderArena
function updateSuperVisuals() {
    if (window._superDekuParticles && arenaActive) {
        // Зелёные искры вокруг сердца
        for (let i = 0; i < 3; i++) {
            arenaParticles.push({
                x: heart.x + (Math.random() - 0.5) * 30,
                y: heart.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 20,
                maxLife: 20,
                color: "#44ff44",
                size: 2 + Math.random() * 3
            });
        }
    }
    if (window._superBorosParticles && arenaActive) {
        // Зелёная аура
        for (let i = 0; i < 2; i++) {
            arenaParticles.push({
                x: heart.x + (Math.random() - 0.5) * 40,
                y: heart.y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 1,
                vy: -1 - Math.random(),
                life: 30,
                maxLife: 30,
                color: "#66ff66",
                size: 3 + Math.random() * 4
            });
        }
    }
    // Движение кулака Сайтамы
    if (window._superFists && window._superFists.length > 0) {
        for (let i = window._superFists.length - 1; i >= 0; i--) {
            let f = window._superFists[i];
            f.x += f.vx;
            f.y += f.vy;
            f.life--;
            if (f.life <= 0 || f.x > 420 || f.x < -20 || f.y > 520 || f.y < -20) {
                window._superFists.splice(i, 1);
                continue;
            }
            // Проверка столкновения с атаками
            for (let j = attacks.length - 1; j >= 0; j--) {
                let a = attacks[j];
                let ax = a.x + (a.size || a.radius || 20) / 2;
                let ay = a.y + (a.size || a.radius || 20) / 2;
                let dist = Math.hypot(f.x - ax, f.y - ay);
                if (dist < f.size + (a.size || a.radius || 20) / 2) {
                    // Уничтожаем атаку и добавляем частицы
                    for (let p = 0; p < 10; p++) {
                        arenaParticles.push({
                            x: ax, y: ay,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 15, maxLife: 15,
                            color: "#ffaa00",
                            size: 2 + Math.random() * 3
                        });
                    }
                    attacks.splice(j, 1);
                    sfxBounce();
                }
            }
            // Проверка попадания в босса (для ваншота)
            if (f.life > 0 && arenaBossMaxHP > 0 && Math.random() < f.bossOneShotChance) {
                // Ваншот босса
                arenaBossMaxHP = 0;
                sfxArenaVictory();
                winArena();
                window._superFists.splice(i, 1);
                break;
            }
            // Визуализация кулака
            ctx.save();
            ctx.fillStyle = f.color;
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("👊", f.x, f.y + 5);
            ctx.restore();
        }
    }
}

// Инициализация, вызываемая при старте арены
function initSuperState() {
    activeSuper = null;
    window._superDekuActive = false;
    window._superDekuDamageMult = 1;
    window._superDekuParticles = false;
    window._superFists = [];
    window._superBorosHeal = null;
    window._superBorosParticles = false;
    // Перезарядки не сбрасываем, они глобальные
    updateSuperButton();
}

// Вызов каждый кадр внутри renderArena (перед отрисовкой сердца)
function tickSupers() {
    // Обновление таймеров (для Деку и Бороса)
    if (activeSuper && superAbilities[activeSuper] && superAbilities[activeSuper].onTick) {
        superAbilities[activeSuper].onTick();
    }
    updateSuperVisuals();
    // Обновление кнопки, если перезарядка завершилась
    if (activeSuper === null) {
        updateSuperButton();
    }
}
