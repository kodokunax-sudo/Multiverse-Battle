// ========== ЭФФЕКТЫ ДЭНДИ v4.0 (ULTRA VFX EDITION) ========== //
// 30 хороших, 20 нейтральных, 30 плохих //

// Вспомогательная функция для генерации сложных частиц (круги, спирали, взрывы)
const createVFX = (x, y, count, speed, color, type = "burst") => {
    for (let i = 0; i < count; i++) {
        let ang = (i / count) * Math.PI * 2;
        let vx = 0, vy = 0, life = 30 + Math.random()*20, size = 3 + Math.random()*3;
        
        if (type === "burst") {
            vx = Math.cos(ang) * (speed + Math.random()*2);
            vy = Math.sin(ang) * (speed + Math.random()*2);
        } else if (type === "spiral") {
            vx = Math.cos(ang + i*0.2) * speed;
            vy = Math.sin(ang + i*0.2) * speed;
        } else if (type === "implode") {
            let dist = 100 + Math.random()*50;
            x = x + Math.cos(ang) * dist;
            y = y + Math.sin(ang) * dist;
            vx = -Math.cos(ang) * speed;
            vy = -Math.sin(ang) * speed;
        } else if (type === "rain") {
            x = Math.random() * 400;
            y = -Math.random() * 200;
            vx = (Math.random() - 0.5);
            vy = speed + Math.random()*3;
            life = 60;
        }
        
        arenaParticles.push({ x, y, vx, vy, life, maxLife: life, color, size });
    }
};

const DANDY_GOOD = [
    // 1-20 (Оригинальные + улучшенные эффекты)
    { name: "ПОЛНОЕ ИСЦЕЛЕНИЕ", apply() { arenaHP = arenaMaxHP; document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); createVFX(heart.x, heart.y, 40, 5, "#44ff44", "spiral"); createVFX(heart.x, heart.y, 20, 2, "#ffffff", "burst"); spawnFloatingText(heart.x, heart.y-20, "ИСЦЕЛЕНИЕ!", "#44ff44"); } },
    { name: "УРОН x2 (8с)", apply() { _superState.dandyDmgBuff = { mult: 2, timer: 8 }; createVFX(heart.x, heart.y, 30, 6, "#ff0000", "burst"); spawnFloatingText(heart.x, heart.y-20, "УРОН x2!", "#ff4444"); } },
    { name: "ОЧИСТКА АТАК", apply() { attacks = []; arenaBlasters = []; addShockwaveRing(heart.x, heart.y, "#ffff00", 600, 1.5, 10); createVFX(heart.x, heart.y, 50, 8, "#ffff00", "burst"); spawnFloatingText(heart.x, heart.y-20, "ОЧИСТКА!", "#ffff00"); } },
    { name: "СКОРОСТЬ x2 (6с)", apply() { heartSpeed *= 2; setTimeout(() => { heartSpeed /= 2; }, 6000); createVFX(heart.x, heart.y, 25, 4, "#00ffff", "spiral"); spawnFloatingText(heart.x, heart.y-20, "СКОРОСТЬ x2!", "#00ffff"); } },
    { name: "ЩИТ 75% (6с)", apply() { _superState.dandyShield = { mult: 0.25, timer: 6 }; createVFX(heart.x, heart.y, 30, 3, "#00ff00", "implode"); spawnFloatingText(heart.x, heart.y-20, "ЩИТ 75%!", "#00ff00"); } },
    { name: "ЗАМЕДЛЕНИЕ АТАК (6с)", apply() { let old = arenaGlobalSpeedMod; arenaGlobalSpeedMod = 0.3; setTimeout(() => { arenaGlobalSpeedMod = old; }, 6000); createVFX(heart.x, heart.y, 40, 1, "#aaaaff", "burst"); addShockwaveRing(heart.x, heart.y, "#aaaaff", 400, 0.5, 20); spawnFloatingText(heart.x, heart.y-20, "СЛОУ-МО!", "#aaaaff"); } },
    { name: "-25% HP БОССА", apply() { let dmg = Math.floor(arenaBossMaxHP * 0.25); arenaBossMaxHP -= dmg; arenaShake = 30; createVFX(200, 100, 60, 10, "#ffdd00", "burst"); spawnFloatingText(200, 250, "-" + dmg + " БОССУ!", "#ffdd00"); } },
    { name: "НЕУЯЗВИМОСТЬ (4с)", apply() { _superState.dandyInvuln = true; setTimeout(() => { _superState.dandyInvuln = false; }, 4000); addShockwaveRing(heart.x, heart.y, "#ffffff", 100, 2.0, 5); createVFX(heart.x, heart.y, 20, 4, "#ffd700", "implode"); spawnFloatingText(heart.x, heart.y-20, "НЕУЯЗВИМ!", "#ffff00"); } },
    { name: "ДВОЙНЫЕ ЦЕЛИ", apply() { _superState.dandyDoubleTargets = true; createVFX(heart.x, heart.y, 30, 5, "#ff00ff", "spiral"); spawnFloatingText(heart.x, heart.y-20, "DOUBLE!", "#ff00ff"); } },
    { name: "МОЛНИИ (12с)", apply() { _superState.dandyLightnings = true; setTimeout(() => { _superState.dandyLightnings = false; }, 12000); createVFX(heart.x, heart.y, 40, 7, "#ffff00", "burst"); spawnFloatingText(heart.x, heart.y-20, "МОЛНИИ!", "#ffff00"); } },
    { name: "ХИЛ-БЛОКИ (5 шт)", apply() { for (let i = 0; i < 5; i++) { attacks.push({ type: "circle", x: 40 + Math.random() * 320, y: -30, radius: 16, spd: (Math.random()-0.5)*1.0, spdY: 2.0, color: "#44ff44", healPercent: 0.10, bouncesLeft: 1 }); } createVFX(200, 0, 50, 4, "#44ff44", "rain"); spawnFloatingText(heart.x, heart.y-20, "ХИЛКИ!", "#44ff44"); } },
    { name: "БОНУС 500⭐", apply() { if (typeof points !== 'undefined') { points += Math.floor(500 * (typeof getStarMult === 'function' ? getStarMult() : 1)); if (typeof maxPoints !== 'undefined' && points > maxPoints) maxPoints = points; } createVFX(heart.x, heart.y, 50, 6, "#f5af19", "burst"); spawnFloatingText(heart.x, heart.y-20, "+500⭐", "#f5af19"); } },
    { name: "СУПЕР-ЩИТ (10с)", apply() { _superState.dandyShield = { mult: 0.1, timer: 10 }; createVFX(heart.x, heart.y, 40, 2, "#00ff00", "spiral"); addShockwaveRing(heart.x, heart.y, "#00ff00", 200, 1.0, 10); spawnFloatingText(heart.x, heart.y-20, "СУПЕР-ЩИТ!", "#00ff00"); } },
    { name: "РЕГЕНЕРАЦИЯ (5с)", apply() { let healInterval = setInterval(() => { if (arenaActive && arenaHP < arenaMaxHP) { arenaHP = Math.min(arenaMaxHP, arenaHP + Math.floor(arenaMaxHP * 0.03)); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); createVFX(heart.x, heart.y, 5, 2, "#66ff66", "burst"); } else { clearInterval(healInterval); } }, 500); setTimeout(() => clearInterval(healInterval), 5000); spawnFloatingText(heart.x, heart.y-20, "РЕГЕН!", "#66ff66"); } },
    { name: "ЗАМОРОЗКА АТАК", apply() { for (let a of attacks) { a.spd = (a.spd || 0) * 0.2; a.spdY = (a.spdY || 0) * 0.2; } arenaGlobalSpeedMod *= 0.5; setTimeout(() => { arenaGlobalSpeedMod /= 0.5; for (let a of attacks) { a.spd = (a.spd || 0) * 5; a.spdY = (a.spdY || 0) * 5; } }, 3000); createVFX(heart.x, heart.y, 60, 3, "#88ccff", "implode"); screenFlash = 10; screenFlashColor = "#88ccff"; spawnFloatingText(heart.x, heart.y-20, "ЗАМОРОЗКА!", "#88ccff"); } },
    { name: "ВЗРЫВ ВСЕХ БОМБ", apply() { for (let a of attacks) { if (a.type === "bomb" && a.timer > 0) { a.timer = 0; createVFX(a.x, a.y, 20, 5, "#ff8800", "burst"); } } spawnFloatingText(heart.x, heart.y-20, "ДЕФУЗ!", "#ff8800"); } },
    { name: "ТЕЛЕПОРТ В ЦЕНТР", apply() { createVFX(heart.x, heart.y, 20, 5, "#00ffff", "implode"); heart.x = 200; heart.y = 250; clampHeart(); addShockwaveRing(heart.x, heart.y, "#00ffff", 300, 0.5, 4); createVFX(heart.x, heart.y, 30, 8, "#ffffff", "burst"); spawnFloatingText(heart.x, heart.y-20, "ТЕЛЕПОРТ!", "#00ffff"); } },
    { name: "+1 СЕКРЕТНЫЙ ТОКЕН", apply() { if (typeof secretGachaTokens !== 'undefined') { secretGachaTokens = (secretGachaTokens || 0) + 1; if (typeof renderGachaTab === 'function') renderGachaTab(); } createVFX(heart.x, heart.y, 50, 6, "#ff00ff", "spiral"); spawnFloatingText(heart.x, heart.y-20, "+1 СЕКРЕТ!", "#ff00ff"); } },
    { name: "МИНИ-СЕРДЦЕ (5с)", apply() { let orig = heart.size; let origHb = heart.hitbox; heart.size *= 0.5; heart.hitbox *= 0.5; createVFX(heart.x, heart.y, 30, 2, "#ffaa00", "implode"); setTimeout(() => { heart.size = orig; heart.hitbox = origHb; createVFX(heart.x, heart.y, 30, 5, "#ffaa00", "burst"); }, 5000); spawnFloatingText(heart.x, heart.y-20, "МИНИ!", "#ffaa00"); } },
    { name: "УДВОЕНИЕ АТАК", apply() { let len = attacks.length; for (let i = 0; i < len; i++) { let a = attacks[i]; if (a.type !== "bomb") { let newA = { ...a, x: a.x + (Math.random()-0.5)*20, y: a.y + (Math.random()-0.5)*20 }; attacks.push(newA); createVFX(a.x, a.y, 10, 3, "#ff8800", "burst"); } } spawnFloatingText(heart.x, heart.y-20, "УДВОЕНИЕ!", "#ff8800"); } },
    
    // 21-30 (Новые эффекты)
    { name: "ВАМПИРИЗМ (6с)", apply() { _superState.vampirism = 6; createVFX(heart.x, heart.y, 40, 5, "#ff0044", "rain"); spawnFloatingText(heart.x, heart.y-20, "ВАМПИРИЗМ!", "#ff0044"); } },
    { name: "ОСТАНОВКА ВРЕМЕНИ (2с)", apply() { let old = arenaGlobalSpeedMod; arenaGlobalSpeedMod = 0; screenFlash = 20; screenFlashColor = "#ffffff"; setTimeout(() => { arenaGlobalSpeedMod = old; }, 2000); createVFX(heart.x, heart.y, 60, 0.1, "#aaaaaa", "burst"); spawnFloatingText(heart.x, heart.y-20, "ZA WARUDO!", "#ffffff"); } },
    { name: "ЗВЕЗДОПАД", apply() { for(let i=0; i<80; i++) arenaParticles.push({x: Math.random()*400, y: -Math.random()*400, vx: -2+Math.random()*4, vy: 5+Math.random()*5, life: 60, maxLife: 60, color: "#fff200", size: 2+Math.random()*4}); spawnFloatingText(200, 200, "ЗВЕЗДОПАД!", "#fff200"); } },
    { name: "ГЛОБАЛЬНЫЙ ЩИТ", apply() { addShockwaveRing(200, 250, "#00ffcc", 800, 2.0, 15); attacks = attacks.filter(a => a.type === "bomb"); createVFX(200, 250, 100, 12, "#00ffcc", "burst"); spawnFloatingText(heart.x, heart.y-20, "АБСОЛЮТ!", "#00ffcc"); } },
    { name: "ЭХО-УРОН", apply() { _superState.echoDamage = true; createVFX(heart.x, heart.y, 30, 4, "#00ffff", "spiral"); spawnFloatingText(heart.x, heart.y-20, "ЭХО!", "#00ffff"); } },
    { name: "АУРА РАЗРУШЕНИЯ (4с)", apply() { let aura = setInterval(() => { addShockwaveRing(heart.x, heart.y, "#ff3300", 150, 1, 5); createVFX(heart.x, heart.y, 10, 4, "#ff3300", "burst"); }, 500); setTimeout(() => clearInterval(aura), 4000); spawnFloatingText(heart.x, heart.y-20, "АУРА!", "#ff3300"); } },
    { name: "СВЯТОЕ БЛАГОСЛОВЕНИЕ", apply() { arenaHP = Math.min(arenaMaxHP, arenaHP + arenaMaxHP*0.5); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); for(let i=0; i<40; i++) { arenaParticles.push({x: heart.x + (i-20)*5, y: heart.y, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#ffffcc", size: 4}); arenaParticles.push({x: heart.x, y: heart.y + (i-20)*5, vx: 2, vy: 0, life: 40, maxLife: 40, color: "#ffffcc", size: 4}); } spawnFloatingText(heart.x, heart.y-20, "БЛАГОСЛОВЕНИЕ!", "#ffffcc"); } },
    { name: "ФАНТОМНЫЙ РЫВОК", apply() { _superState.phantomDash = true; createVFX(heart.x, heart.y, 30, 8, "#6600ff", "burst"); spawnFloatingText(heart.x, heart.y-20, "ФАНТОМ!", "#6600ff"); } },
    { name: "УЛЬТРА-ИНСТИНКТ (3с)", apply() { _superState.dandyInvuln = true; heartSpeed *= 3; setTimeout(() => { _superState.dandyInvuln = false; heartSpeed /= 3; }, 3000); createVFX(heart.x, heart.y, 50, 10, "#ffffff", "spiral"); addShockwaveRing(heart.x, heart.y, "#ffffff", 200, 2, 8); spawnFloatingText(heart.x, heart.y-20, "ИНСТИНКТ!", "#ffffff"); } },
    { name: "ВОСКРЕШЕНИЕ", apply() { _superState.autoRevive = true; createVFX(heart.x, heart.y, 60, 2, "#ffcc00", "implode"); spawnFloatingText(heart.x, heart.y-20, "АНГЕЛ!", "#ffcc00"); } }
    // 31-45: Скиллы других персонажей (новые!)
{ name: "РЫВОК ДЕКУ", apply() { 
    let dx = 0, dy = 0;
    if (keys.w || keys.up) dy = -1;
    if (keys.s || keys.down) dy = 1;
    if (keys.a || keys.left) dx = -1;
    if (keys.d || keys.right) dx = 1;
    if (dx === 0 && dy === 0) { let ang = Math.random() * Math.PI * 2; dx = Math.cos(ang); dy = Math.sin(ang); }
    let len = Math.sqrt(dx*dx + dy*dy) || 1; dx /= len; dy /= len;
    
    _superState.dekuDash = { startX: heart.x, startY: heart.y, dirX: dx, dirY: dy, distance: 180, traveled: 0, trail: [], life: 0.35 };
    let dmg = Math.floor(arenaBossMaxHP * 0.06);
    arenaBossMaxHP -= dmg;
    
    let dashWidth = 55;
    for (let i = attacks.length - 1; i >= 0; i--) {
        let a = attacks[i];
        let ax = a.x + (a.size || a.radius || 20) / 2;
        let ay = a.y + (a.size || a.radius || 20) / 2;
        let t = ((ax - heart.x) * dx + (ay - heart.y) * dy) / (dx*dx + dy*dy);
        if (t > 0 && t < 180) {
            let projX = heart.x + dx * t; let projY = heart.y + dy * t;
            if (Math.sqrt((ax - projX)**2 + (ay - projY)**2) < dashWidth) {
                attacks.splice(i, 1);
                createVFX(ax, ay, 8, 3, "#44ff44", "burst");
            }
        }
    }
    createVFX(heart.x, heart.y, 25, 6, "#44ff44", "spiral");
    spawnFloatingText(heart.x, heart.y-25, "РЫВОК ДЕКУ!", "#44ff44");
} },
{ name: "РАЗЛОМ ДЕКУ", apply() { 
    for (let i = 0; i < 4; i++) {
        let ex = 50 + Math.random() * 300;
        let ey = 50 + Math.random() * 350;
        let dmg = Math.floor(arenaBossMaxHP * 0.02);
        arenaBossMaxHP -= dmg;
        addShockwaveRing(ex, ey, "#44ff44", 200, 0.4, 4);
        for (let j = attacks.length - 1; j >= 0; j--) {
            let a = attacks[j];
            let ax = a.x + (a.size || a.radius || 20) / 2;
            let ay = a.y + (a.size || a.radius || 20) / 2;
            if (Math.hypot(ax - ex, ay - ey) < 60) {
                attacks.splice(j, 1);
                createVFX(ax, ay, 5, 2, "#44ff44", "burst");
            }
        }
        createVFX(ex, ey, 15, 4, "#44ff44", "burst");
    }
    _superState.screenShakeAmount = 12;
    spawnFloatingText(heart.x, heart.y-25, "РАЗЛОМ ДЕКУ!", "#44ff44");
} },
{ name: "ВСЕМОГУЩИЙ (10с)", apply() { 
    let origHitbox = heart.hitbox;
    let origSize = heart.size;
    heart.hitbox *= 2;
    heart.size *= 2;
    _superState.allmightDmgMult = 3;
    _superState.allmightBuffTimer = 10;
    _superState.screenFlashWhite = 10;
    createVFX(heart.x, heart.y, 40, 8, "#ffd700", "burst");
    spawnFloatingText(heart.x, heart.y-30, "СИМВОЛ МИРА!", "#ffd700");
    setTimeout(() => {
        heart.hitbox = origHitbox;
        heart.size = origSize;
        _superState.allmightDmgMult = 1;
        // Без дебаффа!
    }, 10000);
} },
{ name: "100% ДЕКУ (8с)", apply() { 
    let origSpeed = heartSpeed;
    _superState.dekusActive = true;
    _superState.dekusDmgMult = 2;
    _superState.dekusParticles = true;
    heartSpeed *= 3;
    createVFX(heart.x, heart.y, 35, 5, "#44ff44", "spiral");
    spawnFloatingText(heart.x, heart.y-30, "100% ПОКРЫТИЕ!", "#44ff44");
    setTimeout(() => {
        _superState.dekusActive = false;
        _superState.dekusDmgMult = 1;
        _superState.dekusParticles = false;
        heartSpeed = origSpeed;
    }, 8000);
} },
{ name: "ГАЛАКТИЧЕСКИЙ УДАР", apply() { 
    _superState.garpImpactActive = true;
    _superState.garpImpactRadius = 0;
    _superState.garpImpactX = heart.x;
    _superState.garpImpactY = heart.y;
    arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.92);
    _superState.screenShakeAmount = 35;
    _superState.screenFlashWhite = 10;
    createVFX(heart.x, heart.y, 50, 10, "#8844ff", "burst");
    addShockwaveRing(heart.x, heart.y, "#8844ff", 500, 0.6, 8);
    spawnFloatingText(heart.x, heart.y-30, "ГАЛАКТИКА!", "#8844ff");
} },
{ name: "ТЕНЕВОЕ ПРАВЛЕНИЕ (6с)", apply() { 
    _superState.imAuraActive = true;
    createVFX(heart.x, heart.y, 30, 4, "#800080", "spiral");
    spawnFloatingText(heart.x, heart.y-25, "ТЬМА ИМА!", "#800080");
    setTimeout(() => { _superState.imAuraActive = false; }, 6000);
} },
{ name: "НИКА (6с)", apply() { 
    let origHb = heart.hitbox;
    let origSz = heart.size;
    _superState.nikaActive = true;
    heart.hitbox *= 2;
    heart.size *= 2;
    _superState.nikaDmgMult = 1.5;
    heartSpeed *= 1.3;
    createVFX(heart.x, heart.y, 30, 5, "#ffffff", "burst");
    spawnFloatingText(heart.x, heart.y-30, "НИКА!", "#ffffff");
    setTimeout(() => {
        _superState.nikaActive = false;
        heart.hitbox = origHb;
        heart.size = origSz;
        _superState.nikaDmgMult = 1;
        heartSpeed /= 1.3;
    }, 6000);
} },
{ name: "СТИРАНИЕ ЗЕНО", apply() { 
    attacks = [];
    arenaBlasters = [];
    arenaBossMaxHP = Math.floor(arenaBossMaxHP * 0.9);
    _superState.screenFlashWhite = 20;
    for (let i = 0; i < 6; i++) {
        _superState.realityCracks.push({ x1: Math.random()*400, y1: Math.random()*500, x2: Math.random()*400, y2: Math.random()*500, life: 1.5 });
    }
    createVFX(200, 250, 60, 10, "#ff00ff", "burst");
    spawnFloatingText(200, 250, "СТЁРТО!", "#ff00ff");
} },
{ name: "СЖАТИЕ АНТИ-СПИРАЛИ (6с)", apply() { 
    _superState.antispiralActive = true;
    _superState.antispiralOrigHitbox = heart.hitbox;
    _superState.antispiralOrigSize = heart.size;
    _superState.antispiralOrigSpeed = heartSpeed;
    heart.hitbox *= 0.7;
    heart.size *= 0.7;
    heartSpeed *= 0.7;
    for (let a of attacks) { if (a.size) a.size *= 0.7; if (a.radius) a.radius *= 0.7; if (a.spd) a.spd *= 0.7; if (a.spdY) a.spdY *= 0.7; }
    _superState.antispiralShrinkAttacks = true;
    createVFX(heart.x, heart.y, 25, 3, "#aaddff", "implode");
    spawnFloatingText(heart.x, heart.y-25, "СЖАТИЕ!", "#aaddff");
    setTimeout(() => {
        _superState.antispiralActive = false;
        _superState.antispiralShrinkAttacks = false;
        heart.hitbox = _superState.antispiralOrigHitbox;
        heart.size = _superState.antispiralOrigSize;
        heartSpeed = _superState.antispiralOrigSpeed;
        for (let a of attacks) { if (a.size) a.size /= 0.7; if (a.radius) a.radius /= 0.7; if (a.spd) a.spd /= 0.7; if (a.spdY) a.spdY /= 0.7; }
    }, 6000);
} },
{ name: "РЕГЕН БОРОСА (5с)", apply() { 
    _superState.borosHeal = { active: true, healPerSec: arenaMaxHP * 0.06, elapsed: 0, totalDuration: 5 };
    _superState.borosParticles = true;
    heartSpeed *= 0.7;
    createVFX(heart.x, heart.y, 20, 3, "#66ff66", "spiral");
    spawnFloatingText(heart.x, heart.y-25, "РЕГЕН БОРОСА!", "#66ff66");
    setTimeout(() => {
        if (_superState.borosHeal) { heartSpeed /= 0.7; _superState.borosHeal = null; _superState.borosParticles = false; }
    }, 5000);
} },
{ name: "НЕУЯЗВИМОСТЬ УСОППА (3с)", apply() { 
    _superState.usoppInvuln = true;
    createVFX(heart.x, heart.y, 20, 4, "#ffff00", "burst");
    spawnFloatingText(heart.x, heart.y-25, "БОГ УСОПП!", "#ffff00");
    setTimeout(() => { _superState.usoppInvuln = false; _superState.usoppStunTimer = 1; }, 3000);
} },
{ name: "ЯРОСТЬ КАЙДО (8с)", apply() { 
    _superState.kaidoBuffActive = true;
    _superState.kaidoDmgReduction = true;
    _superState.kaidoDmgBonus = 1.8;
    heartSpeed *= 1.5;
    _superState.invertControls = true;
    _superState.screenShakeAmount = 15;
    arenaHP = Math.min(arenaMaxHP, arenaHP + arenaMaxHP * 0.08);
    document.getElementById("arenaHP").innerText = Math.ceil(arenaHP);
    createVFX(heart.x, heart.y, 35, 6, "#ff4500", "burst");
    spawnFloatingText(heart.x, heart.y-30, "ЯРОСТЬ КАЙДО!", "#ff4500");
    setTimeout(() => {
        _superState.kaidoBuffActive = false;
        _superState.kaidoDmgReduction = false;
        _superState.kaidoDmgBonus = 1;
        heartSpeed /= 1.5;
        _superState.invertControls = false;
    }, 8000);
} },
{ name: "ТЕЛЕПОРТ ГАРОУ", apply() { 
    let targetX = heart.x, targetY = heart.y;
    if (_superState.positionHistory && _superState.positionHistory.length > 0) {
        let oldPos = _superState.positionHistory[0];
        targetX = oldPos.x;
        targetY = oldPos.y;
    }
    createVFX(heart.x, heart.y, 20, 4, "#8800ff", "implode");
    heart.x = targetX;
    heart.y = targetY;
    clampHeart();
    _superState.garouInvulnTimer = 0.8;
    createVFX(heart.x, heart.y, 25, 6, "#ff8800", "burst");
    spawnFloatingText(heart.x, heart.y-25, "ТЕЛЕПОРТ ГАРОУ!", "#ff8800");
} },
{ name: "УРАГАН ВСЕМОГУЩЕГО", apply() { 
    _superState.allmightHurricane = true;
    _superState.allmightHurricaneTimer = 2.0;
    _superState.allmightHurricaneAngle = 0;
    let hurricaneRadius = 120;
    for (let a of attacks) {
        let ax = a.x + (a.size || a.radius || 20) / 2;
        let ay = a.y + (a.size || a.radius || 20) / 2;
        let dist = Math.hypot(ax - heart.x, ay - heart.y);
        if (dist < hurricaneRadius) {
            let dx = ax - heart.x; let dy = ay - heart.y;
            let d = Math.sqrt(dx*dx + dy*dy) || 1;
            a.spd = (a.spd || 0) + (dx / d) * 6 + (dy / d) * 3;
            a.spdY = (a.spdY || 0) + (dy / d) * 6 - (dx / d) * 3;
        }
    }
    createVFX(heart.x, heart.y, 40, 8, "#00ffff", "spiral");
    spawnFloatingText(heart.x, heart.y-25, "УРАГАН!", "#00ffff");
} }
];

const DANDY_NEUTRAL = [
    // 1-10 (Оригинальные + улучшенные эффекты)
    { name: "СМЕНА ЦВЕТА", apply() { screenFlash = 15; screenFlashColor = "#" + Math.floor(Math.random()*16777215).toString(16); createVFX(heart.x, heart.y, 40, 5, screenFlashColor, "burst"); spawnFloatingText(heart.x, heart.y-20, "ЦВЕТА!", "#ffffff"); } },
    { name: "ДРОЖЬ ЭКРАНА", apply() { arenaShake = 25; createVFX(heart.x, heart.y, 30, 6, "#888888", "burst"); spawnFloatingText(heart.x, heart.y-20, "ТРЯСКА!", "#888888"); } },
    { name: "ЗВУКОВОЙ УДАР", apply() { if (typeof playArenaSound === 'function') { playArenaSound(50, 'sawtooth', 0.8, 0.2); playArenaSound(30, 'square', 1.0, 0.15); } addShockwaveRing(heart.x, heart.y, "#ffaa00", 400, 1.5, 10); spawnFloatingText(heart.x, heart.y-20, "БУМ!", "#ffaa00"); } },
    { name: "СЛУЧАЙНЫЙ ТЕЛЕПОРТ", apply() { createVFX(heart.x, heart.y, 30, 4, "#ff00ff", "implode"); heart.x = 50 + Math.random() * 300; heart.y = 50 + Math.random() * 400; clampHeart(); createVFX(heart.x, heart.y, 30, 8, "#ff00ff", "burst"); spawnFloatingText(heart.x, heart.y-20, "ТЕЛЕПОРТ!", "#ff00ff"); } },
    { name: "ЗЕРКАЛЬНЫЙ МИР (3с)", apply() { _superState.invertControls = true; setTimeout(() => { _superState.invertControls = false; }, 3000); createVFX(heart.x, heart.y, 40, 5, "#cc00ff", "spiral"); spawnFloatingText(heart.x, heart.y-20, "ЗЕРКАЛО!", "#ff00ff"); } },
    { name: "НЕВИДИМОСТЬ (3с)", apply() { let origAlpha = 1.0; heart.size *= 0.01; createVFX(heart.x, heart.y, 20, 3, "#dddddd", "burst"); setTimeout(() => { heart.size /= 0.01; createVFX(heart.x, heart.y, 20, 3, "#dddddd", "implode"); }, 3000); spawnFloatingText(heart.x, heart.y-20, "НЕВИДИМ!", "#888888"); } },
    { name: "ГРАВИТАЦИЯ (4с)", apply() { let origY = heart.y; heart.y = 480; clampHeart(); createVFX(heart.x, heart.y, 40, 6, "#8888ff", "rain"); setTimeout(() => { heart.y = origY; clampHeart(); }, 4000); spawnFloatingText(heart.x, heart.y-20, "ГРАВИТАЦИЯ!", "#8888ff"); } },
    { name: "СПАВН ДЕКОРА", apply() { for (let i = 0; i < 30; i++) { arenaParticles.push({ x: Math.random()*400, y: Math.random()*500, vx: (Math.random()-0.5)*2, vy: -1-Math.random()*3, life: 60, maxLife: 60, color: ["#ffd700", "#ff00ff", "#00ffff"][Math.floor(Math.random()*3)], size: 2+Math.random()*4 }); } spawnFloatingText(heart.x, heart.y-20, "КОНФЕТТИ!", "#ffd700"); } },
    { name: "ПУЗЫРИ (6с)", apply() { let bubbleInterval = setInterval(() => { if (arenaActive) { arenaParticles.push({ x: heart.x + (Math.random()-0.5)*60, y: heart.y + 20, vx: (Math.random()-0.5)*1, vy: -1.5-Math.random()*2, life: 40, maxLife: 40, color: "#88ccff", size: 4+Math.random()*6 }); } else { clearInterval(bubbleInterval); } }, 200); setTimeout(() => clearInterval(bubbleInterval), 6000); spawnFloatingText(heart.x, heart.y-20, "ПУЗЫРИ!", "#88ccff"); } },
    { name: "НИЧЕГО", apply() { createVFX(heart.x, heart.y, 10, 1, "#444444", "burst"); spawnFloatingText(heart.x, heart.y-20, "НИЧЕГО...", "#888888"); } },
    
    // 11-20 (Новые эффекты)
    { name: "ДИСКОТЕКА", apply() { let disco = setInterval(() => { screenFlash = 2; screenFlashColor = "#" + Math.floor(Math.random()*16777215).toString(16); }, 200); setTimeout(() => clearInterval(disco), 3000); spawnFloatingText(heart.x, heart.y-20, "ПАТИ!", "#ffffff"); } },
    { name: "ПИКСЕЛИЗАЦИЯ", apply() { createVFX(heart.x, heart.y, 50, 4, "#00ff00", "burst"); spawnFloatingText(heart.x, heart.y-20, "8-BIT!", "#00ff00"); } },
    { name: "ВЕТЕР", apply() { for(let i=0; i<50; i++) arenaParticles.push({x: 0, y: Math.random()*500, vx: 5+Math.random()*5, vy: 0, life: 40, maxLife: 40, color: "#ffffff", size: 2}); spawnFloatingText(heart.x, heart.y-20, "ВЕТЕР!", "#ffffff"); } },
    { name: "ДОЖДЬ", apply() { createVFX(200, 0, 80, 8, "#0055ff", "rain"); spawnFloatingText(heart.x, heart.y-20, "ДОЖДЬ!", "#0055ff"); } },
    { name: "ТУМАННЫЙ ЭКРАН", apply() { for(let i=0; i<40; i++) arenaParticles.push({x: Math.random()*400, y: Math.random()*500, vx: (Math.random()-0.5), vy: (Math.random()-0.5), life: 100, maxLife: 100, color: "#dddddd", size: 15+Math.random()*15}); spawnFloatingText(heart.x, heart.y-20, "ОБЛАКА!", "#dddddd"); } },
    { name: "ГАЛЛЮЦИНАЦИИ", apply() { for(let i=0; i<10; i++) { let hx = Math.random()*400, hy = Math.random()*500; addShockwaveRing(hx, hy, "#ff00ff", 100, 1, 3); } spawnFloatingText(heart.x, heart.y-20, "ГЛЮКИ!", "#ff00ff"); } },
    { name: "ЗАМЕНА МУЗЫКИ", apply() { createVFX(heart.x, heart.y, 30, 3, "#ffff00", "burst"); spawnFloatingText(heart.x, heart.y-20, "НОТЫ!", "#ffff00"); } },
    { name: "ИНВЕРСИЯ ЦВЕТОВ", apply() { screenFlash = 30; screenFlashColor = "#ffffff"; spawnFloatingText(heart.x, heart.y-20, "ИНВЕРСИЯ!", "#000000"); } },
    { name: "ПУЛЬС", apply() { let p = setInterval(() => { heart.size = (heart.size == 10) ? 15 : 10; }, 200); setTimeout(() => { clearInterval(p); heart.size = 10; }, 2000); spawnFloatingText(heart.x, heart.y-20, "ТУК-ТУК!", "#ff0044"); } },
    { name: "КОСМИЧЕСКИЙ ФОН", apply() { for(let i=0; i<100; i++) arenaParticles.push({x: Math.random()*400, y: Math.random()*500, vx: 0, vy: 0, life: 120, maxLife: 120, color: "#ffffff", size: 1+Math.random()*2}); spawnFloatingText(heart.x, heart.y-20, "КОСМОС!", "#ffffff"); } }
];

const DANDY_BAD = [
    // 1-20 (Оригинальные + улучшенные эффекты)
    { name: "ПОТЕРЯ 25% HP", apply() { let dmg = Math.floor(arenaMaxHP * 0.25); arenaHP = Math.max(0, arenaHP - dmg); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); screenFlash = 15; screenFlashColor = "#ff0000"; createVFX(heart.x, heart.y, 50, 8, "#ff0000", "burst"); spawnFloatingText(heart.x, heart.y-20, "-25% HP!", "#ff4444"); if (arenaHP <= 0 && typeof loseArena === 'function') loseArena(); } },
    { name: "СКОРОСТЬ x0.3 (8с)", apply() { heartSpeed *= 0.3; setTimeout(() => { heartSpeed /= 0.3; }, 8000); createVFX(heart.x, heart.y, 40, 2, "#444444", "implode"); spawnFloatingText(heart.x, heart.y-20, "СЛОУ...", "#888888"); } },
    { name: "ТРОЙНОЙ УРОН (4с)", apply() { _superState.dandyVulnerable = { mult: 3, timer: 4 }; addShockwaveRing(heart.x, heart.y, "#ff0000", 200, -1, 5); createVFX(heart.x, heart.y, 40, 5, "#880000", "burst"); spawnFloatingText(heart.x, heart.y-20, "УЯЗВИМ!", "#ff0000"); } },
    { name: "СПАВН 8 АТАК", apply() { for (let i = 0; i < 8; i++) spawnAttack(); createVFX(200, 250, 60, 6, "#ff0000", "burst"); spawnFloatingText(heart.x, heart.y-20, "АТАКА!", "#ff0000"); } },
    { name: "УСКОРЕНИЕ АТАК x2 (8с)", apply() { arenaGlobalSpeedMod *= 2; setTimeout(() => { arenaGlobalSpeedMod /= 2; }, 8000); createVFX(heart.x, heart.y, 40, 10, "#ff8800", "spiral"); spawnFloatingText(heart.x, heart.y-20, "БЫСТРО!", "#ff4400"); } },
    { name: "ИНВЕРТ (6с)", apply() { _superState.invertControls = true; setTimeout(() => { _superState.invertControls = false; }, 6000); createVFX(heart.x, heart.y, 50, 5, "#aa00ff", "spiral"); spawnFloatingText(heart.x, heart.y-20, "ИНВЕРТ!", "#ff00ff"); } },
    { name: "+30% HP БОССА", apply() { let heal = Math.floor(arenaBossMaxHP * 0.30); arenaBossMaxHP += heal; arenaShake = 15; createVFX(200, 100, 80, 8, "#00ff00", "implode"); spawnFloatingText(200, 250, "+" + heal + " БОССУ!", "#ff4444"); } },
    { name: "ОГЛУШЕНИЕ (3с)", apply() { _superState.usoppStunTimer = 3; for(let i=0; i<10; i++) arenaParticles.push({x: heart.x, y: heart.y-20, vx: Math.cos(i)*3, vy: Math.sin(i)*3, life: 60, maxLife: 60, color: "#ffff00", size: 5}); spawnFloatingText(heart.x, heart.y-20, "СТАН!", "#ff8800"); } },
    { name: "ХИТБОКС x3 (6с)", apply() { let orig = heart.hitbox; heart.hitbox *= 3; createVFX(heart.x, heart.y, 40, 4, "#ff0000", "burst"); setTimeout(() => { heart.hitbox = orig; }, 6000); spawnFloatingText(heart.x, heart.y-20, "БОЛЬШОЙ!", "#ff4444"); } },
    { name: "ЗЕМЛЕТРЯСЕНИЕ", apply() { arenaShake = 45; for (let i = 0; i < 6; i++) { attacks.push({ type: "square", x: Math.random() * 400, y: -30, size: 35, spd: 0, spdY: 4.0, color: "#888888", damage: Math.floor(arenaBaseDmg * 2), bouncesLeft: 0 }); } createVFX(200, 500, 80, 8, "#553311", "burst"); spawnFloatingText(heart.x, heart.y-20, "ТРЯСКА!", "#888888"); } },
    { name: "ТЕМНОТА (5с)", apply() { screenFlash = 60; screenFlashColor = "#000000"; setTimeout(() => { screenFlash = 0; }, 5000); createVFX(heart.x, heart.y, 50, 15, "#000000", "implode"); spawnFloatingText(heart.x, heart.y-20, "ТЕМНОТА!", "#ffffff"); } },
    { name: "ПОТЕРЯ КАРМЫ", apply() { arenaKarma += Math.floor(arenaMaxHP * 0.5); createVFX(heart.x, heart.y, 40, 6, "#ff6600", "burst"); spawnFloatingText(heart.x, heart.y-20, "КАРМА!", "#ff8800"); } },
    { name: "СПАВН БОМБ (3 шт)", apply() { for (let i = 0; i < 3; i++) { let bx = 50+Math.random()*300, by = 50+Math.random()*400; attacks.push({ type: "bomb", x: bx, y: by, timer: 90, maxRadius: 90, hit: false, damage: Math.floor(arenaBaseDmg * 3), bouncesLeft: 0, particlesSpawned: false, shakeTime: 0 }); createVFX(bx, by, 20, 2, "#ff0000", "implode"); } spawnFloatingText(heart.x, heart.y-20, "БОМБЫ!", "#ff0000"); } },
    { name: "ПРИЗРАЧНЫЕ СТЕНЫ (5с)", apply() { for (let i = 0; i < 4; i++) { attacks.push({ type: "square", x: i*100, y: -30, size: 90, spd: 0, spdY: 2.5, color: "#ffffff", damage: Math.floor(arenaBaseDmg * 0.5), bouncesLeft: 0 }); } createVFX(200, 0, 60, 4, "#ffffff", "rain"); spawnFloatingText(heart.x, heart.y-20, "СТЕНЫ!", "#ffffff"); } },
    { name: "УЛЬТРА-БЛАСТЕР", apply() { if (typeof spawnBlaster === 'function') { for (let i = 0; i < 3; i++) spawnBlaster(arenaCurrentWave); } createVFX(heart.x, heart.y, 50, 10, "#ff0000", "spiral"); spawnFloatingText(heart.x, heart.y-20, "БЛАСТЕРЫ!", "#ff8800"); } },
    { name: "ДЕБАФФ УРОНА (8с)", apply() { let origDmg = _superState.dandyDmgBuff; _superState.dandyDmgBuff = { mult: 0.5, timer: 8 }; createVFX(heart.x, heart.y, 30, 4, "#555555", "implode"); spawnFloatingText(heart.x, heart.y-20, "УРОН -50%!", "#ff4444"); } },
    { name: "ТУМАН (6с)", apply() { let origAlpha = 1.0; if (typeof arenaSettings !== 'undefined') { arenaSettings.effectsOpacity = 0.3; setTimeout(() => { arenaSettings.effectsOpacity = origAlpha; }, 6000); } createVFX(200, 250, 100, 3, "#aaaaaa", "burst"); spawnFloatingText(heart.x, heart.y-20, "ТУМАН!", "#aaaaff"); } },
    { name: "ПРОКЛЯТИЕ СКОРОСТИ", apply() { heartSpeed *= 0.6; createVFX(heart.x, heart.y, 40, 3, "#330066", "spiral"); spawnFloatingText(heart.x, heart.y-20, "ПРОКЛЯТИЕ!", "#ff00ff"); } },
    { name: "СБРОС КОМБО", apply() { arenaClicksHit = 0; createVFX(heart.x, heart.y, 40, 8, "#ff0000", "burst"); spawnFloatingText(heart.x, heart.y-20, "СБРОС!", "#ff0000"); } },
    { name: "ХАОС-АТАКА", apply() { for (let i = 0; i < 10; i++) { attacks.push({ type: "square", x: Math.random()*400, y: Math.random()*500, size: 20, spd: (Math.random()-0.5)*3, spdY: (Math.random()-0.5)*3, color: "#ff00ff", damage: Math.floor(arenaBaseDmg), bouncesLeft: 3 }); } createVFX(200, 250, 80, 12, "#ff00ff", "burst"); spawnFloatingText(heart.x, heart.y-20, "ХАОС!", "#ff00ff"); } },
    
    // 21-30 (Новые эффекты)
    { name: "КРОВОТЕЧЕНИЕ (5с)", apply() { let bleed = setInterval(() => { arenaHP = Math.max(1, arenaHP - Math.ceil(arenaMaxHP*0.01)); document.getElementById("arenaHP").innerText = Math.ceil(arenaHP); createVFX(heart.x, heart.y, 5, 2, "#aa0000", "rain"); }, 500); setTimeout(() => clearInterval(bleed), 5000); spawnFloatingText(heart.x, heart.y-20, "КРОВЬ!", "#aa0000"); } },
    { name: "ЯД (8с)", apply() { _superState.poisoned = 8; createVFX(heart.x, heart.y, 50, 3, "#00aa00", "spiral"); spawnFloatingText(heart.x, heart.y-20, "ЯД!", "#00aa00"); } },
    { name: "СНАЙПЕР", apply() { for(let i=0; i<4; i++) { addShockwaveRing(heart.x, heart.y, "#ff0000", 300 - i*50, -2, 2); } spawnFloatingText(heart.x, heart.y-20, "ПРИЦЕЛ!", "#ff0000"); } },
    { name: "ЧЕРНАЯ ДЫРА", apply() { createVFX(200, 250, 100, 15, "#111111", "implode"); for (let a of attacks) { a.spd = (200 - a.x)*0.05; a.spdY = (250 - a.y)*0.05; } spawnFloatingText(heart.x, heart.y-20, "ЗАСОС!", "#111111"); } },
    { name: "ГРАД", apply() { createVFX(200, 0, 100, 12, "#00ffff", "rain"); for(let i=0; i<5; i++) attacks.push({ type: "circle", x: Math.random()*400, y: -50, radius: 10, spd: 0, spdY: 8, color: "#00ffff", damage: arenaBaseDmg, bouncesLeft: 0 }); spawnFloatingText(heart.x, heart.y-20, "ГРАД!", "#00ffff"); } },
    { name: "ЛАВА НА ПОЛУ", apply() { for(let i=0; i<80; i++) arenaParticles.push({x: Math.random()*400, y: 480 + Math.random()*20, vx: 0, vy: -2-Math.random()*3, life: 60, maxLife: 60, color: "#ff4400", size: 4}); spawnFloatingText(heart.x, heart.y-20, "ЛАВА!", "#ff4400"); } },
    { name: "ГЛИТЧ", apply() { screenFlash = 10; screenFlashColor = "#ff0000"; createVFX(heart.x, heart.y, 60, 10, "#00ff00", "burst"); createVFX(heart.x, heart.y, 60, 10, "#0000ff", "burst"); spawnFloatingText(heart.x, heart.y-20, "ОШИБКА 404!", "#ff0000"); } },
    { name: "ОГРАНИЧЕНИЕ ОБЗОРА", apply() { for(let i=0; i<150; i++) { let ang = Math.random() * Math.PI * 2; arenaParticles.push({x: 200 + Math.cos(ang)*250, y: 250 + Math.sin(ang)*250, vx: -Math.cos(ang)*2, vy: -Math.sin(ang)*2, life: 100, maxLife: 100, color: "#000000", size: 20}); } spawnFloatingText(heart.x, heart.y-20, "СЛЕПОТА!", "#000000"); } },
    { name: "МАГНИТ АТАК", apply() { createVFX(heart.x, heart.y, 60, 4, "#0000ff", "implode"); for (let a of attacks) { a.spd = (heart.x - a.x)*0.02; a.spdY = (heart.y - a.y)*0.02; } spawnFloatingText(heart.x, heart.y-20, "МАГНИТ!", "#0000ff"); } },
    { name: "СУДНЫЙ ДЕНЬ", apply() { screenFlash = 40; screenFlashColor = "#ff0000"; arenaShake = 60; createVFX(200, 250, 150, 20, "#ff0000", "burst"); addShockwaveRing(200, 250, "#ff0000", 800, 4, 30); spawnFloatingText(200, 250, "СУДНЫЙ ДЕНЬ", "#000000"); } }
];
