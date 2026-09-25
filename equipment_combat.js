// ============================================================
// EQUIPMENT COMBAT v2.3 — Броня работает на всех боссах
// ============================================================
// Патчит: applyHit, damageLivingStonePlayer, applyWaystarHit, hitPlayer
// Через window.xxx — чтобы обойти локальные ссылки
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

    // ============================================================
    // ★ ЕДИНАЯ ФУНКЦИЯ: применить броню к урону ★
    // Возвращает: { dmg, blocked } — blocked = true если отражено
    // ============================================================
    function applyArmorToDamage(dmg) {
        let eq = getArmorBonuses();

        // ОТРАЖЕНИЕ
        if (eq.reflectChance > 0 && Math.random() < eq.reflectChance) {
            if (typeof showFloatingText === 'function') showFloatingText("🛡️ ОТРАЖЕНО!", "#9b59b6");
            if (typeof playArenaSound === 'function') playArenaSound(900, 'sine', 0.2, 0.25);
            return { dmg: 0, blocked: true };
        }

        // ПОГЛОЩЕНИЕ
        if (eq.damageReduction > 0) {
            dmg = Math.max(1, Math.floor(dmg * (1 - eq.damageReduction)));
        }

        return { dmg: dmg, blocked: false };
    }

    // ============================================================
    // ★ ГЛАВНАЯ ФУНКЦИЯ: стрельба оружием ★
    // ============================================================
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
        if (isMelee) speed = 14;

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

            if (isMelee) {
                bullet.isMeleeWave = true;
                bullet.rotation = ang;
                bullet.canDestroy = true;
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

        return { rate: rate, bullets: bullets };
    };

    // ============================================================
    // ПАТЧ applyHit (для обычной арены Undertale)
    // ============================================================
    function patchApplyHit() {
        if (typeof window.applyHit !== 'function') return false;
        if (window._eqApplyHitPatched) return true;

        let original = window.applyHit;
        window.applyHit = function(dmg, msg, isOneShot) {
            let result = applyArmorToDamage(dmg);
            if (result.blocked) return;
            return original.call(this, result.dmg, msg, isOneShot);
        };
        window._eqApplyHitPatched = true;
        console.log("[EQ-COMBAT] ✅ applyHit пропатчен");
        return true;
    }

    // ============================================================
    // ★★★ ГЛАВНЫЙ ФИКС: патч damageLivingStonePlayer через getter ★★★
    // ============================================================
    function patchLivingStoneDamage() {
        // Способ 1: через window.damageLivingStonePlayer — если экспортирован
        if (typeof window.damageLivingStonePlayer === 'function' && !window._eqLSDmgPatched) {
            let original = window.damageLivingStonePlayer;
            window.damageLivingStonePlayer = function(dmg) {
                let result = applyArmorToDamage(dmg);
                if (result.blocked) return;
                return original.call(this, result.dmg);
            };
            window._eqLSDmgPatched = true;
            console.log("[EQ-COMBAT] ✅ damageLivingStonePlayer пропатчен (экспорт)");
        }
    }

    // ============================================================
    // ПАТЧ applyWaystarHit (для Путеводной Звезды)
    // ============================================================
    function patchWaystarDamage() {
        if (typeof window.applyWaystarHit === 'function' && !window._eqWSDmgPatched) {
            let original = window.applyWaystarHit;
            window.applyWaystarHit = function(dmg, msg, isTrueOneshot) {
                let result = applyArmorToDamage(dmg);
                if (result.blocked) return;
                return original.call(this, result.dmg, msg, isTrueOneshot);
            };
            window._eqWSDmgPatched = true;
            console.log("[EQ-COMBAT] ✅ applyWaystarHit пропатчен");
        }
    }

    // ============================================================
    // ПАТЧ hitPlayer (для Роджера и Белоуса)
    // ============================================================
    function patchRWBHit() {
        if (typeof window.hitPlayer === 'function' && !window._eqRWBDmgPatched) {
            let original = window.hitPlayer;
            window.hitPlayer = function(dmg) {
                let result = applyArmorToDamage(dmg);
                if (result.blocked) return;
                return original.call(this, result.dmg);
            };
            window._eqRWBDmgPatched = true;
            console.log("[EQ-COMBAT] ✅ hitPlayer пропатчен");
        }
        // Альтернативное имя в Роджере
        if (typeof window.rwbHitPlayer === 'function' && !window._eqRWB2DmgPatched) {
            let original = window.rwbHitPlayer;
            window.rwbHitPlayer = function(dmg) {
                let result = applyArmorToDamage(dmg);
                if (result.blocked) return;
                return original.call(this, result.dmg);
            };
            window._eqRWB2DmgPatched = true;
            console.log("[EQ-COMBAT] ✅ rwbHitPlayer пропатчен");
        }
    }

    // ============================================================
    // ПАТЧ СКОРОСТИ СЕРДЕЧКА
    // ============================================================
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
        console.log("[EQ-COMBAT] ✅ startArena пропатчен (скорость брони)");
        return true;
    }

    // ============================================================
    // ПАТЧ QTE-УРОНА (Живой Камень)
    // ============================================================
    function patchLivingStoneQTE() {
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

    // ============================================================
    // ПАТЧ УНИЧТОЖЕНИЯ АТАК (меч)
    // ============================================================
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

    // ============================================================
    // ★★★ ХАК: если damageLivingStonePlayer не в window ★★★
    // Патчим через перехват state — но проще через периодическую проверку
    // ============================================================
    function tryInjectViaStorage() {
        // Через 2 сек после старта проверяем
        setTimeout(function() {
            // Проверяем есть ли damageLivingStonePlayer в window
            if (typeof window.damageLivingStonePlayer === 'undefined') {
                console.warn("[EQ-COMBAT] damageLivingStonePlayer НЕ в window — патч через экспорт не сработает");
                console.warn("[EQ-COMBAT] Решение: добавить в living_stone_boss.js строку:");
                console.warn("[EQ-COMBAT]   window.damageLivingStonePlayer = damageLivingStonePlayer;");
            }
            if (typeof window.applyWaystarHit === 'undefined') {
                console.warn("[EQ-COMBAT] applyWaystarHit НЕ в window");
                console.warn("[EQ-COMBAT] Добавить в waystar_boss.js:");
                console.warn("[EQ-COMBAT]   window.applyWaystarHit = applyWaystarHit;");
            }
            if (typeof window.hitPlayer === 'undefined') {
                console.warn("[EQ-COMBAT] hitPlayer НЕ в window");
                console.warn("[EQ-COMBAT] Добавить в roger_whitebeard_boss.js:");
                console.warn("[EQ-COMBAT]   window.hitPlayer = hitPlayer;");
            }
        }, 2000);
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================
    function init() {
        let attempts = 0;
        let maxAttempts = 100;
        function tryPatch() {
            attempts++;
            let a = patchStartArena();
            let b = patchLivingStoneQTE();
            patchApplyHit();
            patchLivingStoneDamage();
            patchWaystarDamage();
            patchRWBHit();
            patchBulletDestruction();

            if (a && b) {
                console.log("╔════════════════════════════════════════╗");
                console.log("║  ⚔️ EQUIPMENT COMBAT v2.3 загружено    ║");
                console.log("║  Броня: поглощение + отражение         ║");
                console.log("║  Работает на ВСЕХ боссах               ║");
                console.log("╚════════════════════════════════════════╝");
                tryInjectViaStorage();
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
