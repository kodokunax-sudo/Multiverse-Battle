// ============================================================
// EQUIPMENT COMBAT v2.1 — Оружие и броня в боях с боссами
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

    // ========== ★ ГЛАВНАЯ ФУНКЦИЯ: стрельба по запросу боссов ★ ==========
    // Боссы вызывают это. Если возвращает null — стреляй как обычно.
    window.firePlayerWeapon = function(px, py, attackMode, playerHp, playerMaxHp) {
        let weapon = getWeapon();
        if (!weapon) return null;

        let rate = weapon.shootRate || 12;

        // Перк «Ярость» — быстрее при низком HP
        if (weapon.legendaryPerk === "rageSpeed" && playerHp !== undefined && playerMaxHp !== undefined && playerMaxHp > 0) {
            let hpRatio = playerHp / playerMaxHp;
            rate = Math.max(2, Math.floor(rate / (1 + (1 - hpRatio) * 0.25)));
        }

        let bullets = [];
        let bulletCount = weapon.bullets || 1;
        let spread = weapon.spread || 0;
        let dmgMult = weapon.damageMult || 1.0;
        let isLegendary = weapon.id && weapon.id.indexOf("legendary") !== -1;
        let isSniper = weapon.id && weapon.id.indexOf("sniper") !== -1;
        let isSMG = weapon.id && weapon.id.indexOf("smg") !== -1;

        let speed = 11;
        if (isSniper) speed = 16;
        if (isSMG) speed = 12;

        for (let i = 0; i < bulletCount; i++) {
            let angleOffset = bulletCount > 1 ? (i - (bulletCount - 1) / 2) * spread : 0;
            let ang = -Math.PI / 2 + angleOffset;

            let bullet = {
                x: px,
                y: py - 14,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                size: isSniper ? 7 : 5,
                life: 120,
                color: isLegendary ? "#ffd700" : "#ffdd00",
                damage: 2 * dmgMult,
                isBlue: false,
                weaponId: weapon.id
            };

            if (weapon.legendaryPerk === "destroyAttacks") bullet.canDestroy = true;
            if (weapon.legendaryPerk === "absorb15") bullet.hasAbsorb = true;
            if (weapon.legendaryPerk === "autoAim35" && Math.random() < 0.35) {
                // Наведение вверх (у боссов боссы сверху)
                bullet.vx = 0;
                bullet.vy = -speed;
            }

            bullets.push(bullet);
        }

        return { rate: rate, bullets: bullets };
    };

    // ========== ПОЛУЧИТЬ МНОЖИТЕЛЬ УРОНА ДЛЯ QTE ==========
    window.getWeaponDamageMult = function() {
        let weapon = getWeapon();
        if (!weapon) return 1.0;
        return weapon.damageMult || 1.0;
    };

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
        console.log("[EQ-COMBAT] ✅ startArena пропатчен");
        return true;
    }

    // ========== ПАТЧ ЖИВОГО КАМНЯ (QTE-урон) ==========
    function patchLivingStone() {
        if (window._eqLSPatched) return true;

        let originalUpdateStats = window.updatePlayerStats;
        if (typeof originalUpdateStats === 'function') {
            window.updatePlayerStats = function() {
                let result = originalUpdateStats.apply(this, arguments);

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

    // ========== ПАТЧ УНИЧТОЖЕНИЯ АТАК (меч-разрушитель) ==========
    function patchBulletDestruction() {
        // Для Роджера/Белоуса — updateRWBPlayerBullets
        if (typeof window.updateRWBPlayerBullets === 'function' && !window._eqRWBBulletsPatched) {
            let original = window.updateRWBPlayerBullets;
            window.updateRWBPlayerBullets = function() {
                if (typeof rwbPlayerBullets !== 'undefined' && Array.isArray(rwbPlayerBullets) && typeof rwbAttacks !== 'undefined') {
                    for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
                        let b = rwbPlayerBullets[i];
                        if (!b.canDestroy) continue;
                        for (let j = rwbAttacks.length - 1; j >= 0; j--) {
                            let a = rwbAttacks[j];
                            let dx = b.x - a.x, dy = b.y - a.y;
                            if (Math.sqrt(dx * dx + dy * dy) < (a.size || 20) + b.size + 8) {
                                if (typeof spawnDestroyParticles === 'function') spawnDestroyParticles(a.x, a.y, a.color || "#ffd700");
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
            window._eqRWBBulletsPatched = true;
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
            let c = patchLivingStone();
            patchBulletDestruction();

            if (a && b && c) {
                console.log("╔════════════════════════════════════════╗");
                console.log("║  ⚔️ EQUIPMENT COMBAT v2.1 загружено    ║");
                console.log("║  firePlayerWeapon() — главная функция  ║");
                console.log("║  Роджер/Звезда/Камень — оружие ✅     ║");
                console.log("║  Броня: поглощение/отражение/скор. ✅ ║");
                console.log("╚════════════════════════════════════════╝");
                return;
            }
            if (attempts < maxAttempts) setTimeout(tryPatch, 100);
            else console.warn("[EQ-COMBAT] Не всё пропатчено:", { applyHit: a, startArena: b, ls: c });
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
    window.getArmorBonusesPublic = getArmorBonuses;

})();
