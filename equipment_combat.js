// ============================================================
// EQUIPMENT COMBAT v2.0 — Оружие и броня в боях с боссами
// ============================================================
// Работает с:
//   🪨 Живой Камень (QTE — множитель урона)
//   🌟 Путеводная Звезда (замена стрельбы)
//   👑 Роджер и Белоус (замена стрельбы)
//
// ПОДКЛЮЧАТЬ ПОСЛЕ crafting.js И ПОСЛЕ боссов
// ============================================================

(function() {
    'use strict';

    if (window._equipmentCombatLoaded) {
        console.warn("[EQ-COMBAT] Уже загружено.");
        return;
    }
    window._equipmentCombatLoaded = true;

    // ========== ПОЛУЧЕНИЕ ОРУЖИЯ И БРОНИ ==========
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
                if (typeof playArenaSound === 'function') playArenaSound(900, 'sine', 0.2, 0.25);
                return;
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

    // ========== ПАТЧ СКОРОСТИ СЕРДЕЧКА ==========
    function patchStartArena() {
        if (typeof window.startArena !== 'function') return false;
        if (window._eqStartArenaPatched) return true;

        let original = window.startArena;
        window.startArena = function(bossWave) {
            let result = original.apply(this, arguments);
            try {
                if (typeof heartSpeed !== 'undefined') {
                    let eq = getArmorBonuses();
                    if (eq.speedMult !== 1.0) {
                        heartSpeed *= eq.speedMult;
                        let speedDisplay = document.getElementById("arenaSpeedDisplay");
                        if (speedDisplay) speedDisplay.innerText = heartSpeed.toFixed(1);
                    }
                }
            } catch(e) {}
            return result;
        };
        window._eqStartArenaPatched = true;
        return true;
    }

    // ========== ФУНКЦИЯ СТРЕЛЬБЫ ОРУЖИЕМ ==========
    function fireWeapon(px, py, fallbackColor) {
        let weapon = getWeapon();
        if (!weapon) {
            return [{
                x: px, y: py - 14,
                vx: 0, vy: -11,
                size: 5, life: 120,
                color: fallbackColor || "#ffdd00",
                damage: 2,
                isBlue: false
            }];
        }

        let bullets = [];
        let isLegendary = weapon.id && weapon.id.indexOf("legendary") !== -1;
        let baseColor = isLegendary ? "#ffd700" : "#ffdd00";
        let dmgMult = weapon.damageMult || 1.0;
        let baseDamage = 2 * dmgMult;

        let bulletCount = weapon.bullets || 1;
        let spread = weapon.spread || 0;
        let speed = 11;
        if (weapon.id && weapon.id.indexOf("sniper") !== -1) speed = 16;
        if (weapon.id && weapon.id.indexOf("smg") !== -1) speed = 12;

        for (let i = 0; i < bulletCount; i++) {
            let angleOffset = 0;
            if (bulletCount > 1) {
                angleOffset = (i - (bulletCount - 1) / 2) * spread;
            }
            let ang = -Math.PI / 2 + angleOffset; // вверх

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

            if (weapon.legendaryPerk === "absorb15") bullet.hasAbsorb = true;
            if (weapon.legendaryPerk === "destroyAttacks") bullet.canDestroy = true;

            bullets.push(bullet);
        }

        return bullets;
    }

    // ========== ПАТЧ РОДЖЕРА (движение + стрельба оружием) ==========
    function patchRogerWhitebeard() {
        if (typeof window.getRWBPlayer !== 'function') return false;
        if (window._eqRWPPatched) return true;

        // Заменяем updateRWBPlayer
        let originalUpdate = window.updateRWBPlayer;
        window.updateRWBPlayer = function() {
            let weapon = getWeapon();
            if (!weapon) {
                // Оружия нет — стандартное поведение
                return originalUpdate.apply(this, arguments);
            }

            // Оружие есть — своя логика (движение + стрельба оружием)
            let rwbPlayer = window.getRWBPlayer();
            let rwbPlayerBullets = window.getRWBBullets();
            let rwbKeys = window.getRWBKeys();
            let rwbTouch = window.getRWBTouch();

            if (!rwbPlayer || !rwbPlayerBullets) return;

            let mx = 0, my = 0;
            let speed = 4.5;

            if (rwbTouch.active) {
                let tx = rwbTouch.x - rwbPlayer.x;
                let ty = rwbTouch.y - rwbPlayer.y;
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

            // ★ Стрельба оружием ★
            if (rwbPlayer.attackTimer <= 0) {
                let rate = weapon.shootRate || 12;

                // Перк «Ярость» — быстрее при низком HP
                if (weapon.legendaryPerk === "rageSpeed") {
                    let hpRatio = rwbPlayer.hp / rwbPlayer.maxHp;
                    let speedBonus = 1 + (1 - hpRatio) * 0.25;
                    rate = Math.max(2, Math.floor(rate / speedBonus));
                }

                rwbPlayer.attackTimer = rate;

                let bullets = fireWeapon(rwbPlayer.x, rwbPlayer.y, "#ffdd00");
                for (let b of bullets) rwbPlayerBullets.push(b);

                if (window.rwbSound) window.rwbSound(1200, 'square', 0.03, 0.05);
            }
            if (rwbPlayer.attackTimer > 0) rwbPlayer.attackTimer--;
        };

        // Патчим updateRWBPlayerBullets — добавляем canDestroy
        let originalBullets = window.updateRWBPlayerBullets;
        window.updateRWBPlayerBullets = function() {
            let rwbPlayerBullets = window.getRWBBullets();
            let rwbAttacks = window.getRWBAttacks();

            // Уничтожение атак (меч-разрушитель)
            if (rwbPlayerBullets && rwbAttacks) {
                for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
                    let b = rwbPlayerBullets[i];
                    if (!b.canDestroy) continue;
                    for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                        let a = rwbAttacks[j];
                        let dx = b.x - a.x, dy = b.y - a.y;
                        if (Math.sqrt(dx*dx + dy*dy) < (a.size || 20) + b.size + 8) {
                            if (typeof spawnDestroyParticles === 'function') spawnDestroyParticles(a.x, a.y, a.color || "#ffd700");
                            if (window.rwbSound) window.rwbSound(600, 'square', 0.15, 0.2);
                            rwbAttacks.splice(j, 1);
                            rwbPlayerBullets.splice(i, 1);
                            break;
                        }
                    }
                }
            }

            return originalBullets.apply(this, arguments);
        };

        window._eqRWPPatched = true;
        console.log("[EQ-COMBAT] ✅ Роджер/Белоус — оружие работает");
        return true;
    }

    // ========== ПАТЧ ПУТЕВОДНОЙ ЗВЕЗДЫ ==========
    function patchWaystar() {
        if (typeof window.getWaystarPlayer !== 'function') return false;
        if (window._eqWaystarPatched) return true;

        let originalShooting = window.updateWaystarShooting;
        window.updateWaystarShooting = function() {
            let weapon = getWeapon();
            if (!weapon) {
                return originalShooting.apply(this, arguments);
            }

            // Оружие есть — стрельба оружием
            let waystarPlayer = window.getWaystarPlayer();
            let waystarPlayerBullets = window.getWaystarBullets();
            if (!waystarPlayer || !waystarPlayerBullets) return;

            if (waystarPlayer._attackTimer === undefined) waystarPlayer._attackTimer = 0;
            if (waystarPlayer._attackTimer > 0) { waystarPlayer._attackTimer--; return; }

            let rate = weapon.shootRate || 12;

            if (weapon.legendaryPerk === "rageSpeed") {
                let hpRatio = (waystarPlayer.hp / waystarPlayer.maxHp) || 1;
                rate = Math.max(2, Math.floor(rate / (1 + (1 - hpRatio) * 0.25)));
            }

            waystarPlayer._attackTimer = rate;

            let isModer = false;
            try { isModer = (typeof window.isWaystarModerActive === 'function') && window.isWaystarModerActive(); } catch(e) {}

            let bullets = fireWeapon(waystarPlayer.x, waystarPlayer.y, "#ffdd00");
            for (let b of bullets) {
                if (isModer) b.damage = 100000;
                waystarPlayerBullets.push(b);
            }

            if (window.waystarSound) window.waystarSound(1100, 'square', 0.04, 0.06);
        };

        window._eqWaystarPatched = true;
        console.log("[EQ-COMBAT] ✅ Путеводная Звезда — оружие работает");
        return true;
    }

    // ========== ПАТЧ ЖИВОГО КАМНЯ (QTE-урон) ==========
    function patchLivingStone() {
        // Живой Камень использует QTE — клики по целям.
        // Урон от QTE = window.playerFinalDamage * множитель попаданий.
        // Патчим через updatePlayerStats — умножаем playerFinalDamage когда активен LS.

        if (window._eqLSPatched) return true;

        let originalUpdateStats = window.updatePlayerStats;
        if (typeof originalUpdateStats === 'function') {
            window.updatePlayerStats = function() {
                let result = originalUpdateStats.apply(this, arguments);

                // Проверяем активен ли Живой Камень
                try {
                    let lsActive = (typeof window.getLSActive === 'function') && window.getLSActive();
                    if (lsActive) {
                        let weapon = getWeapon();
                        if (weapon && weapon.damageMult) {
                            let baseDmg = window.playerFinalDamage || 20;
                            window.playerFinalDamage = Math.floor(baseDmg * weapon.damageMult);
                        }
                    }
                } catch(e) {}

                return result;
            };
        }

        window._eqLSPatched = true;
        console.log("[EQ-COMBAT] ✅ Живой Камень — оружие работает (QTE-урон)");
        return true;
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

            if (a && b && c && d && e) {
                console.log("╔════════════════════════════════════════╗");
                console.log("║  ⚔️ EQUIPMENT COMBAT v2.0 загружено    ║");
                console.log("║  Роджер/Белоус: оружие ✅             ║");
                console.log("║  Звезда: оружие ✅                    ║");
                console.log("║  Живой Камень: множитель урона ✅     ║");
                console.log("║  Броня: поглощение/отражение/скор. ✅ ║");
                console.log("╚════════════════════════════════════════╝");
                return;
            }
            if (attempts < maxAttempts) setTimeout(tryPatch, 100);
            else console.warn("[EQ-COMBAT] Не всё пропатчено:", { applyHit: a, startArena: b, rwb: c, waystar: d, ls: e });
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

})();
