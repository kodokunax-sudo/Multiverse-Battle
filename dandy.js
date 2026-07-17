// ========== ЭФФЕКТЫ ДЭНДИ v3.0 ==========
// 20 хороших, 10 нейтральных, 20 плохих

const DANDY_GOOD = [
    { name: "ПОЛНОЕ ИСЦЕЛЕНИЕ", apply() { arenaHP = arenaMaxHP; document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); for (let i = 0; i < 20; i++) { let ang = Math.random() * Math.PI*2; let sp = 3 + Math.random()*5; arenaParticles.push({ x: heart.x, y: heart.y, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, life: 30, maxLife: 30, color: "#44ff44", size: 4 }); } spawnFloatingText(heart.x, heart.y-20, "ИСЦЕЛЕНИЕ!", "#44ff44"); } },
    { name: "УРОН x2 (8с)", apply() { _superState.dandyDmgBuff = { mult: 2, timer: 8 }; spawnFloatingText(heart.x, heart.y-20, "УРОН x2!", "#ff4444"); } },
    { name: "ОЧИСТКА АТАК", apply() { attacks = []; arenaBlasters = []; addShockwaveRing(heart.x, heart.y, "#ffff00", 500, 1.0, 6); spawnFloatingText(heart.x, heart.y-20, "ОЧИСТКА!", "#ffff00"); } },
    { name: "СКОРОСТЬ x2 (6с)", apply() { heartSpeed *= 2; setTimeout(() => { heartSpeed /= 2; }, 6000); spawnFloatingText(heart.x, heart.y-20, "СКОРОСТЬ x2!", "#00ffff"); } },
    { name: "ЩИТ 75% (6с)", apply() { _superState.dandyShield = { mult: 0.25, timer: 6 }; spawnFloatingText(heart.x, heart.y-20, "ЩИТ 75%!", "#00ff00"); } },
    { name: "ЗАМЕДЛЕНИЕ АТАК (6с)", apply() { let old = arenaGlobalSpeedMod; arenaGlobalSpeedMod = 0.3; setTimeout(() => { arenaGlobalSpeedMod = old; }, 6000); spawnFloatingText(heart.x, heart.y-20, "СЛОУ-МО!", "#aaaaff"); } },
    { name: "-25% HP БОССА", apply() { let dmg = Math.floor(arenaBossMaxHP * 0.25); arenaBossMaxHP -= dmg; arenaShake = 20; spawnFloatingText(200, 250, "-" + dmg + " БОССУ!", "#ffdd00"); } },
    { name: "НЕУЯЗВИМОСТЬ (4с)", apply() { _superState.dandyInvuln = true; setTimeout(() => { _superState.dandyInvuln = false; }, 4000); spawnFloatingText(heart.x, heart.y-20, "НЕУЯЗВИМ!", "#ffff00"); } },
    { name: "ДВОЙНЫЕ ЦЕЛИ", apply() { _superState.dandyDoubleTargets = true; spawnFloatingText(heart.x, heart.y-20, "DOUBLE!", "#ff00ff"); } },
    { name: "МОЛНИИ (12с)", apply() { _superState.dandyLightnings = true; setTimeout(() => { _superState.dandyLightnings = false; }, 12000); spawnFloatingText(heart.x, heart.y-20, "МОЛНИИ!", "#ffff00"); } },
    { name: "ХИЛ-БЛОКИ (5 шт)", apply() { for (let i = 0; i < 5; i++) { attacks.push({ type: "circle", x: 40 + Math.random() * 320, y: -30, radius: 16, spd: (Math.random()-0.5)*1.0, spdY: 2.0, color: "#44ff44", healPercent: 0.10, bouncesLeft: 1 }); } spawnFloatingText(heart.x, heart.y-20, "ХИЛКИ!", "#44ff44"); } },
    { name: "БОНУС 500⭐", apply() { if (typeof points !== 'undefined') { points += Math.floor(500 * (typeof getStarMult === 'function' ? getStarMult() : 1)); if (typeof maxPoints !== 'undefined' && points > maxPoints) maxPoints = points; } spawnFloatingText(heart.x, heart.y-20, "+500⭐", "#f5af19"); } },
    { name: "СУПЕР-ЩИТ (10с)", apply() { _superState.dandyShield = { mult: 0.1, timer: 10 }; spawnFloatingText(heart.x, heart.y-20, "СУПЕР-ЩИТ!", "#00ff00"); } },
    { name: "РЕГЕНЕРАЦИЯ (5с)", apply() { let healInterval = setInterval(() => { if (arenaActive && arenaHP < arenaMaxHP) { arenaHP = Math.min(arenaMaxHP, arenaHP + Math.floor(arenaMaxHP * 0.03)); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); } else { clearInterval(healInterval); } }, 500); setTimeout(() => clearInterval(healInterval), 5000); spawnFloatingText(heart.x, heart.y-20, "РЕГЕН!", "#66ff66"); } },
    { name: "ЗАМОРОЗКА АТАК", apply() { for (let a of attacks) { a.spd = (a.spd || 0) * 0.2; a.spdY = (a.spdY || 0) * 0.2; } arenaGlobalSpeedMod *= 0.5; setTimeout(() => { arenaGlobalSpeedMod /= 0.5; for (let a of attacks) { a.spd = (a.spd || 0) * 5; a.spdY = (a.spdY || 0) * 5; } }, 3000); spawnFloatingText(heart.x, heart.y-20, "ЗАМОРОЗКА!", "#88ccff"); } },
    { name: "ВЗРЫВ ВСЕХ БОМБ", apply() { for (let a of attacks) { if (a.type === "bomb" && a.timer > 0) { a.timer = 0; } } spawnFloatingText(heart.x, heart.y-20, "ДЕФУЗ!", "#ff8800"); } },
    { name: "ТЕЛЕПОРТ В ЦЕНТР", apply() { heart.x = 200; heart.y = 250; clampHeart(); addShockwaveRing(heart.x, heart.y, "#00ffff", 300, 0.5, 4); spawnFloatingText(heart.x, heart.y-20, "ТЕЛЕПОРТ!", "#00ffff"); } },
    { name: "+1 СЕКРЕТНЫЙ ТОКЕН", apply() { if (typeof secretGachaTokens !== 'undefined') { secretGachaTokens = (secretGachaTokens || 0) + 1; if (typeof renderGachaTab === 'function') renderGachaTab(); } spawnFloatingText(heart.x, heart.y-20, "+1 СЕКРЕТ!", "#ff00ff"); } },
    { name: "МИНИ-СЕРДЦЕ (5с)", apply() { let orig = heart.size; let origHb = heart.hitbox; heart.size *= 0.5; heart.hitbox *= 0.5; setTimeout(() => { heart.size = orig; heart.hitbox = origHb; }, 5000); spawnFloatingText(heart.x, heart.y-20, "МИНИ!", "#ffaa00"); } },
    { name: "УДВОЕНИЕ АТАК", apply() { let len = attacks.length; for (let i = 0; i < len; i++) { let a = attacks[i]; if (a.type !== "bomb") { let newA = { ...a, x: a.x + (Math.random()-0.5)*20, y: a.y + (Math.random()-0.5)*20 }; attacks.push(newA); } } spawnFloatingText(heart.x, heart.y-20, "УДВОЕНИЕ!", "#ff8800"); } }
];

const DANDY_NEUTRAL = [
    { name: "СМЕНА ЦВЕТА", apply() { screenFlash = 15; screenFlashColor = "#" + Math.floor(Math.random()*16777215).toString(16); spawnFloatingText(heart.x, heart.y-20, "ЦВЕТА!", "#ffffff"); } },
    { name: "ДРОЖЬ ЭКРАНА", apply() { arenaShake = 15; spawnFloatingText(heart.x, heart.y-20, "ТРЯСКА!", "#888888"); } },
    { name: "ЗВУКОВОЙ УДАР", apply() { if (typeof playArenaSound === 'function') { playArenaSound(50, 'sawtooth', 0.8, 0.2); playArenaSound(30, 'square', 1.0, 0.15); } spawnFloatingText(heart.x, heart.y-20, "БУМ!", "#ffaa00"); } },
    { name: "СЛУЧАЙНЫЙ ТЕЛЕПОРТ", apply() { heart.x = 50 + Math.random() * 300; heart.y = 50 + Math.random() * 400; clampHeart(); spawnFloatingText(heart.x, heart.y-20, "ТЕЛЕПОРТ!", "#ff00ff"); } },
    { name: "ЗЕРКАЛЬНЫЙ МИР (3с)", apply() { _superState.invertControls = true; setTimeout(() => { _superState.invertControls = false; }, 3000); spawnFloatingText(heart.x, heart.y-20, "ЗЕРКАЛО!", "#ff00ff"); } },
    { name: "НЕВИДИМОСТЬ (3с)", apply() { let origAlpha = 1.0; heart.size *= 0.01; setTimeout(() => { heart.size /= 0.01; }, 3000); spawnFloatingText(heart.x, heart.y-20, "НЕВИДИМ!", "#888888"); } },
    { name: "ГРАВИТАЦИЯ (4с)", apply() { let origY = heart.y; heart.y = 480; clampHeart(); setTimeout(() => { heart.y = origY; clampHeart(); }, 4000); spawnFloatingText(heart.x, heart.y-20, "ГРАВИТАЦИЯ!", "#8888ff"); } },
    { name: "СПАВН ДЕКОРА", apply() { for (let i = 0; i < 15; i++) { arenaParticles.push({ x: Math.random()*400, y: Math.random()*500, vx: (Math.random()-0.5)*0.5, vy: -0.5-Math.random(), life: 40, maxLife: 40, color: "#ffd700", size: 1+Math.random()*3 }); } spawnFloatingText(heart.x, heart.y-20, "КОНФЕТТИ!", "#ffd700"); } },
    { name: "ПУЗЫРИ (6с)", apply() { let bubbleInterval = setInterval(() => { if (arenaActive) { arenaParticles.push({ x: heart.x + (Math.random()-0.5)*60, y: heart.y + 20, vx: (Math.random()-0.5)*1, vy: -1.5-Math.random()*2, life: 30, maxLife: 30, color: "#88ccff", size: 4+Math.random()*5 }); } else { clearInterval(bubbleInterval); } }, 300); setTimeout(() => clearInterval(bubbleInterval), 6000); spawnFloatingText(heart.x, heart.y-20, "ПУЗЫРИ!", "#88ccff"); } },
    { name: "НИЧЕГО", apply() { spawnFloatingText(heart.x, heart.y-20, "НИЧЕГО...", "#888888"); } }
];

const DANDY_BAD = [
    { name: "ПОТЕРЯ 25% HP", apply() { let dmg = Math.floor(arenaMaxHP * 0.25); arenaHP = Math.max(0, arenaHP - dmg); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); screenFlash = 12; screenFlashColor = "#ff0000"; spawnFloatingText(heart.x, heart.y-20, "-25% HP!", "#ff4444"); if (arenaHP <= 0 && typeof loseArena === 'function') loseArena(); } },
    { name: "СКОРОСТЬ x0.3 (8с)", apply() { heartSpeed *= 0.3; setTimeout(() => { heartSpeed /= 0.3; }, 8000); spawnFloatingText(heart.x, heart.y-20, "СЛОУ...", "#888888"); } },
    { name: "ТРОЙНОЙ УРОН (4с)", apply() { _superState.dandyVulnerable = { mult: 3, timer: 4 }; spawnFloatingText(heart.x, heart.y-20, "УЯЗВИМ!", "#ff0000"); } },
    { name: "СПАВН 8 АТАК", apply() { for (let i = 0; i < 8; i++) spawnAttack(); spawnFloatingText(heart.x, heart.y-20, "АТАКА!", "#ff0000"); } },
    { name: "УСКОРЕНИЕ АТАК x2 (8с)", apply() { arenaGlobalSpeedMod *= 2; setTimeout(() => { arenaGlobalSpeedMod /= 2; }, 8000); spawnFloatingText(heart.x, heart.y-20, "БЫСТРО!", "#ff4400"); } },
    { name: "ИНВЕРТ (6с)", apply() { _superState.invertControls = true; setTimeout(() => { _superState.invertControls = false; }, 6000); spawnFloatingText(heart.x, heart.y-20, "ИНВЕРТ!", "#ff00ff"); } },
    { name: "+30% HP БОССА", apply() { let heal = Math.floor(arenaBossMaxHP * 0.30); arenaBossMaxHP += heal; arenaShake = 15; spawnFloatingText(200, 250, "+" + heal + " БОССУ!", "#ff4444"); } },
    { name: "ОГЛУШЕНИЕ (3с)", apply() { _superState.usoppStunTimer = 3; spawnFloatingText(heart.x, heart.y-20, "СТАН!", "#ff8800"); } },
    { name: "ХИТБОКС x3 (6с)", apply() { let orig = heart.hitbox; heart.hitbox *= 3; setTimeout(() => { heart.hitbox = orig; }, 6000); spawnFloatingText(heart.x, heart.y-20, "БОЛЬШОЙ!", "#ff4444"); } },
    { name: "ЗЕМЛЕТРЯСЕНИЕ", apply() { arenaShake = 45; for (let i = 0; i < 6; i++) { attacks.push({ type: "square", x: Math.random() * 400, y: -30, size: 35, spd: 0, spdY: 4.0, color: "#888888", damage: Math.floor(arenaBaseDmg * 2), bouncesLeft: 0 }); } spawnFloatingText(heart.x, heart.y-20, "ТРЯСКА!", "#888888"); } },
    { name: "ТЕМНОТА (5с)", apply() { screenFlash = 60; screenFlashColor = "#000000"; setTimeout(() => { screenFlash = 0; }, 5000); spawnFloatingText(heart.x, heart.y-20, "ТЕМНОТА!", "#000000"); } },
    { name: "ПОТЕРЯ КАРМЫ", apply() { arenaKarma += Math.floor(arenaMaxHP * 0.5); spawnFloatingText(heart.x, heart.y-20, "КАРМА!", "#ff8800"); } },
    { name: "СПАВН БОМБ (3 шт)", apply() { for (let i = 0; i < 3; i++) { attacks.push({ type: "bomb", x: 50+Math.random()*300, y: 50+Math.random()*400, timer: 90, maxRadius: 90, hit: false, damage: Math.floor(arenaBaseDmg * 3), bouncesLeft: 0, particlesSpawned: false, shakeTime: 0 }); } spawnFloatingText(heart.x, heart.y-20, "БОМБЫ!", "#ff0000"); } },
    { name: "ПРИЗРАЧНЫЕ СТЕНЫ (5с)", apply() { for (let i = 0; i < 4; i++) { attacks.push({ type: "square", x: i*100, y: -30, size: 90, spd: 0, spdY: 2.5, color: "#ffffff", damage: Math.floor(arenaBaseDmg * 0.5), bouncesLeft: 0 }); } spawnFloatingText(heart.x, heart.y-20, "СТЕНЫ!", "#ffffff"); } },
    { name: "УЛЬТРА-БЛАСТЕР", apply() { if (typeof spawnBlaster === 'function') { for (let i = 0; i < 3; i++) spawnBlaster(arenaCurrentWave); } spawnFloatingText(heart.x, heart.y-20, "БЛАСТЕРЫ!", "#ff8800"); } },
    { name: "ДЕБАФФ УРОНА (8с)", apply() { let origDmg = _superState.dandyDmgBuff; _superState.dandyDmgBuff = { mult: 0.5, timer: 8 }; spawnFloatingText(heart.x, heart.y-20, "УРОН -50%!", "#ff4444"); } },
    { name: "ТУМАН (6с)", apply() { let origAlpha = 1.0; if (typeof arenaSettings !== 'undefined') { arenaSettings.effectsOpacity = 0.3; setTimeout(() => { arenaSettings.effectsOpacity = origAlpha; }, 6000); } spawnFloatingText(heart.x, heart.y-20, "ТУМАН!", "#aaaaff"); } },
    { name: "ПРОКЛЯТИЕ СКОРОСТИ", apply() { heartSpeed *= 0.6; spawnFloatingText(heart.x, heart.y-20, "ПРОКЛЯТИЕ!", "#ff00ff"); } },
    { name: "СБРОС КОМБО", apply() { arenaClicksHit = 0; spawnFloatingText(heart.x, heart.y-20, "СБРОС!", "#ff0000"); } },
    { name: "ХАОС-АТАКА", apply() { for (let i = 0; i < 10; i++) { attacks.push({ type: "square", x: Math.random()*400, y: Math.random()*500, size: 20, spd: (Math.random()-0.5)*3, spdY: (Math.random()-0.5)*3, color: "#ff00ff", damage: Math.floor(arenaBaseDmg), bouncesLeft: 3 }); } spawnFloatingText(heart.x, heart.y-20, "ХАОС!", "#ff00ff"); } }
];
