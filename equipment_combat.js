// ============================================================
// EQUIPMENT COMBAT v1.0 — Оружие и броня в боях с боссами
// ============================================================
// Работает с уникальными боссами:
//   🪨 Живой Камень (200)
//   🌟 Путеводная Звезда (500)
//   👑 Роджер и Белоус (1000)
//
// ПОДКЛЮЧАТЬ ПОСЛЕ crafting.js
// ============================================================

(function() {
    'use strict';

    if (window._equipmentCombatLoaded) {
        console.warn("[EQ-COMBAT] Уже загружено.");
        return;
    }
    window._equipmentCombatLoaded = true;

    // ========== ПРОВЕРКА НАЛИЧИЯ ОРУЖИЯ ==========
    function getWeapon() {
        try {
            if (typeof window.getEquipmentData === 'function') {
                let eq = window.getEquipmentData();
                return eq ? eq.weapon : null;
            }
        } catch(e) {}
        return null;
    }

    function getArmorBonuses() {
        try {
            if (typeof window.getEquipmentBonuses === 'function') {
                return window.getEquipmentBonuses();
            }
        } catch(e) {}
        return { hpMult: 1, speedMult: 1, damageReduction: 0, reflectChance: 0, regen: 0 };
    }

    // ========== ПАТЧ applyHit (поглощение + отражение) ==========
    function patchApplyHit() {
        if (typeof window.applyHit !== 'function') return false;
        if (window._eqApplyHitPatched) return true;

        let original = window.applyHit;
        window.applyHit = function(dmg, msg, isOneShot) {
            let eq = getArmorBonuses();

            // ★ ОТРАЖЕНИЕ ★
            if (eq.reflectChance > 0 && Math.random() < eq.reflectChance) {
                if (typeof showFloatingText === 'function') {
                    showFloatingText("🛡️ ОТРАЖЕНО!", "#9b59b6");
                }
                if (typeof playArenaSound === 'function') {
                    playArenaSound(900, 'sine', 0.2, 0.25);
                }
                return; // полностью отменяем урон
            }

            // ★ ПОГЛОЩЕНИЕ ★
            if (eq.damageReduction > 0) {
                dmg = Math.max(1, Math.floor(dmg * (1 - eq.damageReduction)));
            }

            return original.call(this, dmg, msg, isOneShot);
        };

        window._eqApplyHitPatched = true;
        console.log("[EQ-COMBAT] ✅ applyHit пропатчен");
        return true;
    }

    // ========== ПАТЧ СКОРОСТИ СЕРДЕЧКА (для арены Undertale) ==========
    // Применяется в startArena() — heartSpeed = mainCard.speed * getObesitySpeedMult()
    // Нужно добавить множитель armor.speedMult
    function patchStartArena() {
        if (typeof window.startArena !== 'function') return false;
        if (window._eqStartArenaPatched) return true;

        let original = window.startArena;
        window.startArena = function(bossWave) {
            let result = original.apply(this, arguments);

            // После старта — умножаем heartSpeed на бонус брони
            try {
                if (typeof heartSpeed !== 'undefined') {
                    let eq = getArmorBonuses();
                    if (eq.speedMult !== 1.0) {
                        heartSpeed *= eq.speedMult;
                        let speedDisplay = document.getElementById("arenaSpeedDisplay");
                        if (speedDisplay) speedDisplay.innerText = heartSpeed.toFixed(1);
                        console.log("[EQ-COMBAT] Скорость арены x" + eq.speedMult.toFixed(2));
                    }
                }
            } catch(e) {}

            return result;
        };

        window._eqStartArenaPatched = true;
        console.log("[EQ-COMBAT] ✅ startArena пропатчен");
        return true;
    }

    // ========== СТРЕЛЬБА ОРУЖИЕМ (общая функция для всех боссов) ==========
    // Возвращает массив пуль для спавна
    function fireWeapon(px, py, aimX, aimY, fallbackColor) {
        let weapon = getWeapon();
        if (!weapon) {
            // Нет оружия — стандартная пуля
            return [{
                x: px, y: py - 14,
                vx: 0, vy: -11,
                size: 5, life: 90,
                color: fallbackColor || "#ffdd00",
                damage: 2,
                isBlue: (fallbackColor === "#00aaff")
            }];
        }

        let bullets = [];
        let baseColor = (weapon.id && weapon.id.indexOf("legendary") !== -1) ? "#ffd700" : "#ffdd00";
        let dmgMult = weapon.damageMult || 1.0;
        let baseDamage = 2 * dmgMult;

        // Направление на цель
        let dx = aimX - px;
        let dy = aimY - py;
        let len = Math.sqrt(dx * dx + dy * dy) || 1;
        let baseAngle = Math.atan2(dy, dx);

        // Спец-обработка по типу оружия
        let bulletCount = weapon.bullets || 1;
        let spread = weapon.spread || 0;

        for (let i = 0; i < bulletCount; i++) {
            let angleOffset = 0;
            if (bulletCount > 1) {
                angleOffset = (i - (bulletCount - 1) / 2) * spread;
            }
            let ang = baseAngle + angleOffset;

            let speed = 11;
            if (weapon.id && weapon.id.indexOf("sniper") !== -1) speed = 16; // снайперка быстрее
            if (weapon.id && weapon.id.indexOf("smg") !== -1) speed = 12; // пулемёт

            // ★ АВТО-ПРИЦЕЛ для снайперки-легендарки ★
            if (weapon.legendaryPerk === "autoAim35" && Math.random() < 0.35) {
                // Точное наведение на босса
                ang = baseAngle;
            }

            let bullet = {
                x: px,
                y: py - 14,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                size: (weapon.id && weapon.id.indexOf("sniper") !== -1) ? 7 : 5,
                life: 120,
                color: baseColor,
                damage: baseDamage,
                isBlue: false,
                weaponId: weapon.id
            };

            // Легендарный дробовик — поглощение
            if (weapon.legendaryPerk === "absorb15") {
                bullet.hasAbsorb = true;
            }

            // Меч-разрушитель — уничтожение
            if (weapon.legendaryPerk === "destroyAttacks") {
                bullet.canDestroy = true;
            }

            bullets.push(bullet);
        }

        return bullets;
    }

    // ========== УРОН ОТ КЛИКА ==========
    function getWeaponDamageMult() {
        let weapon = getWeapon();
        if (!weapon) return 1.0;
        return weapon.damageMult || 1.0;
    }

    // ========== ПАТЧ РОДЖЕРА И БЕЛОУСА ==========
    // Заменяем updateRWBPlayer — встраиваем оружие
    function patchRogerWhitebeard() {
        if (typeof window.updateRWBPlayer !== 'function') return false;
        if (window._eqRWBPlayerPatched) return true;

        let original = window.updateRWBPlayer;

        // Пытаемся найти внутри rwbPlayerBullets через замыкание — не выйдет,
        // поэтому делаем хак: патчим саму функцию стрельбы через таймер
        window._eqRWBPlayerHijack = setInterval(function() {
            // Каждые 16 мс проверяем, есть ли активный бой Роджера
            if (typeof window.rwbActive === 'undefined' || !window.rwbActive) return;
            if (typeof rwbState === 'undefined') return;
            if (rwbState !== "fight1" && rwbState !== "fight2") return;
            if (typeof rwbPlayer === 'undefined' || !rwbPlayer) return;

            let weapon = getWeapon();
            if (!weapon) return; // нет оружия — стандартная стрельба

            // Своя стрельба каждые N кадров
            if (!rwbPlayer._eqLastShot) rwbPlayer._eqLastShot = 0;
            if (rwbPlayer._eqLastShot > 0) {
                rwbPlayer._eqLastShot--;
                return;
            }
            let rate = weapon.shootRate || 12;

            // Перк «Ярость» — быстрее при низком HP
            if (weapon.legendaryPerk === "rageSpeed") {
                let hpRatio = rwbPlayer.hp / rwbPlayer.maxHp;
                let speedBonus = 1 + (1 - hpRatio) * 0.25;
                rate = Math.max(2, Math.floor(rate / speedBonus));
            }

            rwbPlayer._eqLastShot = rate;

            // Направление — вверх (к боссам)
            let bullets = fireWeapon(rwbPlayer.x, rwbPlayer.y, rwbPlayer.x, 100, "#ffdd00");
            for (let b of bullets) {
                if (typeof rwbPlayerBullets !== 'undefined' && Array.isArray(rwbPlayerBullets)) {
                    rwbPlayerBullets.push(b);
                }
            }

            if (typeof rwbSound === 'function') rwbSound(1200, 'square', 0.03, 0.05);

        }, 16);

        window._eqRWBPlayerPatched = true;
        console.log("[EQ-COMBAT] ✅ Роджер/Белоус — оружие работает");
        return true;
    }

    // ========== ПАТЧ ПУТЕВОДНОЙ ЗВЕЗДЫ ==========
    function patchWaystar() {
        if (window._eqWaystarPatched) return true;

        window._eqWaystarHijack = setInterval(function() {
            if (typeof window.waystarActive === 'undefined' || !window.waystarActive) return;
            if (typeof waystarState === 'undefined') return;
            if (waystarState !== "phase1" && waystarState !== "phase3") return;
            if (typeof waystarPlayer === 'undefined' || !waystarPlayer) return;

            let weapon = getWeapon();
            if (!weapon) return;

            if (!waystarPlayer._eqLastShot) waystarPlayer._eqLastShot = 0;
            if (waystarPlayer._eqLastShot > 0) {
                waystarPlayer._eqLastShot--;
                return;
            }

            // ★ Проверка Moder режима ★
            let isModer = false;
            try {
                isModer = (typeof isWaystarModerActive === 'function') && isWaystarModerActive();
            } catch(e) {}

            let rate = weapon.shootRate || 12;
            if (weapon.legendaryPerk === "rageSpeed") {
                let hpRatio = (waystarPlayer.hp / waystarPlayer.maxHp) || 1;
                rate = Math.max(2, Math.floor(rate / (1 + (1 - hpRatio) * 0.25)));
            }

            waystarPlayer._eqLastShot = rate;

            // Направление — вверх (к боссу)
            let bullets = fireWeapon(waystarPlayer.x, waystarPlayer.y, waystarPlayer.x, 100, "#00aaff");
            for (let b of bullets) {
                b.isBlue = false; // на Звезде — обычные
                b.color = (weapon.id && weapon.id.indexOf("legendary") !== -1) ? "#ffd700" : "#ffdd00";

                // В модере — 100000 урона
                if (isModer) {
                    b.damage = 100000;
                }
                if (typeof waystarPlayerBullets !== 'undefined' && Array.isArray(waystarPlayerBullets)) {
                    waystarPlayerBullets.push(b);
                }
            }

        }, 16);

        window._eqWaystarPatched = true;
        console.log("[EQ-COMBAT] ✅ Путеводная Звезда — оружие работает");
        return true;
    }

    // ========== ПАТЧ ЖИВОГО КАМНЯ (QTE) ==========
    // Тут нет стрельбы, но есть клики по целям — умножаем урон
    function patchLivingStone() {
        if (typeof window.applyArenaDamage !== 'function') return false;
        if (window._eqLSApplyDamagePatched) return true;

        let original = window.applyArenaDamage;
        window.applyArenaDamage = function() {
            // Применяем множитель оружия к урону (если QTE)
            let weapon = getWeapon();
            if (weapon && weapon.damageMult) {
                // Временно подменяем playerFinalDamage чтобы QTE-урон был с множителем
                let origDmg = window.playerFinalDamage;
                window.playerFinalDamage = Math.floor((origDmg || 20) * weapon.damageMult);
                let result = original.apply(this, arguments);
                window.playerFinalDamage = origDmg;
                return result;
            }
            return original.apply(this, arguments);
        };

        window._eqLSApplyDamagePatched = true;
        console.log("[EQ-COMBAT] ✅ Живой Камень — оружие работает");
        return true;
    }

    // ========== ПАТЧ СПАВНА ПУЛЬ (блокируем стандартную стрельбу когда оружие надето) ==========
    // Для Роджера и Звезды — блокируем автострельбу из оригинального кода,
    // если надето оружие (иначе будет двойная стрельба)
    function patchUpdateRWBPlayerToBlockOriginal() {
        if (typeof window.updateRWBPlayer !== 'function') return false;
        if (window._eqRWBBlockPatched) return true;

        let original = window.updateRWBPlayer;
        window.updateRWBPlayer = function() {
            let weapon = getWeapon();
            if (weapon) {
                // Оружие надето — НЕ вызываем оригинал (там автострельба).
                // Но нам нужно движение игрока, поэтому копируем только движение:
                if (rwbState !== "fight1" && rwbState !== "fight2") return;

                let mx = 0, my = 0;
                let speed = 4.5;
                if (rwbTouchActive) {
                    let tx = rwbTouchX - rwbPlayer.x;
                    let ty = rwbTouchY - rwbPlayer.y;
                    let dist = Math.sqrt(tx * tx + ty * ty);
                    if (dist > 5) { mx = tx / dist; my = ty / dist; }
                } else {
                    if (rwbKeys.w || rwbKeys.arrowup) my -= 1;
                    if (rwbKeys.s || rwbKeys.arrowdown) my += 1;
                    if (rwbKeys.a || rwbKeys.arrowleft) mx -= 1;
                    if (rwbKeys.d || rwbKeys.arrowright) mx += 1;
                    if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }
                }
                rwbPlayer.x += mx * speed;
                rwbPlayer.y += my * speed;
                rwbPlayer.x = Math.max(16, Math.min(384, rwbPlayer.x));
                rwbPlayer.y = Math.max(160, Math.min(484, rwbPlayer.y));
                if (rwbPlayer.invulnTimer > 0) rwbPlayer.invulnTimer--;
                return; // НЕ вызываем оригинал — он бы спавнил стандартные пули
            }
            return original.apply(this, arguments);
        };
        window._eqRWBBlockPatched = true;
        return true;
    }

    function patchWaystarShootingToBlockOriginal() {
        if (typeof window.updateWaystarShooting !== 'function') return false;
        if (window._eqWaystarBlockPatched) return true;

        let original = window.updateWaystarShooting;
        window.updateWaystarShooting = function() {
            let weapon = getWeapon();
            if (weapon) {
                // Оружие надето — блокируем стандартную стрельбу
                return;
            }
            return original.apply(this, arguments);
        };
        window._eqWaystarBlockPatched = true;
        return true;
    }

    // ========== ПАТЧ УНИЧТОЖЕНИЯ АТАК (меч-разрушитель) ==========
    // Для пуль с canDestroy — сбивают атаки
    function patchBulletUpdates() {
        // Роджер — updateRWBPlayerBullets
        if (typeof window.updateRWBPlayerBullets === 'function' && !window._eqBulletsRWBPatched) {
            let original = window.updateRWBPlayerBullets;
            window.updateRWBPlayerBullets = function() {
                // Перед оригиналом — проверяем canDestroy для наших пуль
                if (typeof rwbPlayerBullets !== 'undefined' && Array.isArray(rwbPlayerBullets) && typeof rwbAttacks !== 'undefined') {
                    for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
                        let b = rwbPlayerBullets[i];
                        if (!b.canDestroy) continue;
                        for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                            let a = rwbAttacks[j];
                            let dx = b.x - a.x, dy = b.y - a.y;
                            if (Math.sqrt(dx*dx + dy*dy) < (a.size || 20) + b.size + 8) {
                                // Уничтожаем атаку
                                if (typeof spawnDestroyParticles === 'function') {
                                    spawnDestroyParticles(a.x, a.y, a.color || "#ffd700");
                                }
                                if (typeof rwbSound === 'function') rwbSound(600, 'square', 0.15, 0.2);
                                rwbAttacks.splice(j, 1);
                                rwbPlayerBullets.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
                return original.apply(this, arguments);
            };
            window._eqBulletsRWBPatched = true;
        }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        let attempts = 0;
        let maxAttempts = 100;

        function tryPatch() {
            attempts++;
            let a = patchApplyHit();
            let b = patchStartArena();
            let c = patchRogerWhitebeard();
            let d = patchWaystar();
            let e = patchLivingStone();
            let f = patchUpdateRWBPlayerToBlockOriginal();
            let g = patchWaystarShootingToBlockOriginal();
            patchBulletUpdates();

            if (a && b && c && d && e && f && g) {
                console.log("╔════════════════════════════════════════╗");
                console.log("║  ⚔️ EQUIPMENT COMBAT v1.0 загружено    ║");
                console.log("║  Оружие работает на арене              ║");
                console.log("║  Броня: поглощение + отражение + скор. ║");
                console.log("╚════════════════════════════════════════╝");
                return;
            }
            if (attempts < maxAttempts) setTimeout(tryPatch, 100);
            else console.warn("[EQ-COMBAT] Не всё пропатчено:", { applyHit: a, startArena: b, rwb: c, waystar: d, ls: e, rwbBlock: f, wsBlock: g });
        }

        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(tryPatch, 800);
        } else {
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(tryPatch, 1200);
            });
        }
    }

    init();

    // ========== ЭКСПОРТ ==========
    window.getEquippedWeapon = getWeapon;
    window.getArmorBonuses = getArmorBonuses;
    window.fireWeapon = fireWeapon;
    window.getWeaponDamageMult = getWeaponDamageMult;

})();
