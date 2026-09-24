// ============================================================
// EQUIPMENT COMBAT v2.2 — Меч-волна + стрельба по боссам
// ============================================================

(function() {
    'use strict';

    if (window._equipmentCombatLoaded) return;
    window._equipmentCombatLoaded = true;

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

    // ========== ★ ГЛАВНАЯ ФУНКЦИЯ: стрельба боссов ★ ==========
    window.firePlayerWeapon = function(px, py, attackMode, playerHp, playerMaxHp) {
        let weapon = getWeapon();
        if (!weapon) return null;

        let rate = weapon.shootRate || 12;

        // Ярость — быстрее при низком HP
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
        let isMelee = weapon.isMelee === true;

        let speed = 11;
        if (isSniper) speed = 16;
        if (isSMG) speed = 12;
        if (isMelee) speed = 14; // меч — быстро летит

        for (let i = 0; i < bulletCount; i++) {
            let angleOffset = bulletCount > 1 ? (i - (bulletCount - 1) / 2) * spread : 0;
            let ang = -Math.PI / 2 + angleOffset;

            let bullet = {
                x: px,
                y: py - 14,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                size: isSniper ? 7 : (isMelee ? 14 : 5),
                life: 120,
                color: isLegendary ? "#ffd700" : (isMelee ? "#ff8844" : "#ffdd00"),
                damage: 2 * dmgMult,
                isBlue: false,
                weaponId: weapon.id
            };

            // ★ МЕЧ — специальные свойства ★
            if (isMelee) {
                bullet.isMeleeWave = true;   // визуал волны
                bullet.rotation = ang;
                bullet.canDestroy = true;     // сбивает атаки
                bullet.rotSpeed = 0.1;
            }

            if (weapon.legendaryPerk === "destroyAttacks") bullet.canDestroy = true;
            if (weapon.legendaryPerk === "absorb15") bullet.hasAbsorb = true;
            if (weapon.legendaryPerk === "autoAim35" && Math.random() < 0.35) {
                bullet.vx = 0;
                bullet.vy = -speed;
            }

            bullets.push(bullet);
        }

        // ★ Двойной пистолет — 2 пули ★
        if (weapon.legendaryPerk === "doubleShot") {
            let baseCount = bulletCount;
            // Уже 2 из-за bullets:2 — норм
        }

        return { rate: rate, bullets: bullets };
    };

    // ========== ПОГЛОЩЕНИЕ УРОНА ОТ БРОНИ ★ ГЛАВНЫЙ ФИКС ★ ==========
    // Патчим ВСЕ боссы: живого камня, звезды, роджера — через обёртку damageLivingStonePlayer и applyHit
    function patchAllDamageFunctions() {
        // 1) applyHit (для обычной арены Undertale)
        if (typeof window.applyHit === 'function' && !window._eqApplyHitPatched) {
            let original = window.applyHit;
            window.applyHit = function(dmg, msg, isOneShot) {
                let eq = getArmorBonuses();
                if (eq.reflectChance > 0 && Math.random() < eq.reflectChance) {
                    if (typeof showFloatingText === 'function') showFloatingText("🛡️ ОТРАЖЕНО!", "#9b59b6");
                    if (typeof playArenaSound === 'function') playArenaSound(900, 'sine', 0.2, 0.25);
                    return;
                }
                if (eq.damageReduction > 0) dmg = Math.max(1, Math.floor(dmg * (1 - eq.damageReduction)));
                return original.call(this, dmg, msg, isOneShot);
            };
            window._eqApplyHitPatched = true;
            console.log("[EQ-COMBAT] ✅ applyHit пропатчен (броня на арене)");
        }

        // 2) damageLivingStonePlayer (для Живого Камня)
        if (typeof window.damageLivingStonePlayer === 'function' && !window._eqLSDmgPatched) {
            let original = window.damageLivingStonePlayer;
            window.damageLivingStonePlayer = function(dmg) {
                let eq = getArmorBonuses();
                if (eq.reflectChance > 0 && Math.random() < eq.reflectChance) {
                    if (typeof showFloatingText === 'function') showFloatingText("🛡️ ОТРАЖЕНО!", "#9b59b6");
                    return;
                }
                if (eq.damageReduction > 0) dmg = Math.max(1, Math.floor(dmg * (1 - eq.damageReduction)));
                return original.call(this, dmg);
            };
            window._eqLSDmgPatched = true;
            console.log("[EQ-COMBAT] ✅ damageLivingStonePlayer пропатчен");
        }

        // 3) applyWaystarHit (для Путеводной Звезды)
        if (typeof window.applyWaystarHit === 'function' && !window._eqWSDmgPatched) {
            let original = window.applyWaystarHit;
            window.applyWaystarHit = function(dmg, msg, isTrueOneshot) {
                let eq = getArmorBonuses();
                if (eq.reflectChance > 0 && Math.random() < eq.reflectChance) {
                    if (typeof showFloatingText === 'function') showFloatingText("🛡️ ОТРАЖЕНО!", "#9b59b6");
                    return;
                }
                if (eq.damageReduction > 0) dmg = Math.max(1, Math.floor(dmg * (1 - eq.damageReduction)));
                return original.call(this, dmg, msg, isTrueOneshot);
            };
            window._eqWSDmgPatched = true;
            console.log("[EQ-COMBAT] ✅ applyWaystarHit пропатчен");
        }

        // 4) hitPlayer (для Роджера и Белоуса)
        if (typeof window.hitPlayer === 'function' && !window._eqRWBDmgPatched) {
            let original = window.hitPlayer;
            window.hitPlayer = function(dmg) {
                let eq = getArmorBonuses();
                if (eq.reflectChance > 0 && Math.random() < eq.reflectChance) {
                    if (typeof showFloatingText === 'function') showFloatingText("🛡️ ОТРАЖЕНО!", "#9b59b6");
                    return;
                }
                if (eq.damageReduction > 0) dmg = Math.max(1, Math.floor(dmg * (1 - eq.damageReduction)));
                return original.call(this, dmg);
            };
            window._eqRWBDmgPatched = true;
            console.log("[EQ-COMBAT] ✅ hitPlayer пропатчен");
        }

        // 5) rwbHitPlayer — если в Роджере называется иначе
        if (typeof window.rwbHitPlayer === 'function' && !window._eqRWB2DmgPatched) {
            let original = window.rwbHitPlayer;
            window.rwbHitPlayer = function(dmg) {
                let eq = getArmorBonuses();
                if (eq.damageReduction > 0) dmg = Math.max(1, Math.floor(dmg * (1 - eq.damageReduction)));
                return original.call(this, dmg);
            };
            window._eqRWB2DmgPatched = true;
        }
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
        return true;
    }

    // ========== ПАТЧ УНИЧТОЖЕНИЯ АТАК (меч) ==========
    function patchBulletDestruction() {
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
            let a = patchStartArena();
            let b = patchLivingStone();
            patchAllDamageFunctions();
            patchBulletDestruction();
            if (a && b) {
                console.log("╔════════════════════════════════════════╗");
                console.log("║  ⚔️ EQUIPMENT COMBAT v2.2 загружено    ║");
                console.log("║  firePlayerWeapon — главная функция    ║");
                console.log("║  Меч: волна + сбивание атак            ║");
                console.log("║  Броня: поглощение, отражение, HP      ║");
                console.log("╚════════════════════════════════════════╝");
                return;
            }
            if (attempts < maxAttempts) setTimeout(tryPatch, 100);
            else console.warn("[EQ-COMBAT] Не всё пропатчено:", { startArena: a, ls: b });
        }
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(tryPatch, 800);
        } else {
            document.addEventListener("DOMContentLoaded", function() { setTimeout(tryPatch, 1200); });
        }
    }

    init();

    window.getEquippedWeapon = getWeapon;
    window.getArmorBonusesPublic = getArmorBonuses;
})();
