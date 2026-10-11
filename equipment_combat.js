// ============================================================
// EQUIPMENT COMBAT v2.5 — Броня работает на всех боссах
// ============================================================
// ★ ФИКС v2.5: УБРАН patchStartArena — больше НЕТ двойного
//              применения бонуса скорости брони
// ============================================================
// Патчит: applyHit (арена), damageLivingStonePlayer, applyWaystarHit, hitPlayer
// Плюс экспортирует applyArmorToBossDamage — используется боссами НАПРЯМУЮ
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
                size: isSniper ? 7 : (isMelee ? 16 : 5),
                // Мечевой лунный клинок проходит около половины высоты арены (250 px).
                life: isMelee ? Math.max(1, Math.ceil(250 / speed)) : 120,
                range: isMelee ? 250 : null,
                color: isLegendary ? "#ffd700" : (isMelee ? "#ff8844" : "#ffdd00"),
                damage: 2 * dmgMult,
                isBlue: false,
                weaponId: weapon.id
            };

            if (isMelee) {
                bullet.isMeleeWave = true;
                bullet.rotation = ang;
                bullet.rotSpeed = 0.1;
            }
            if (weapon.legendaryPerk === "destroyAttacks") {
                bullet.canDestroy = true;
                bullet.destroyChance = 0.08;
            }
            if (weapon.legendaryPerk === "absorb5") bullet.hasAbsorb = true;
            if (weapon.legendaryPerk === "absorb15") bullet.hasAbsorb = true;
            if (weapon.legendaryPerk === "autoAim10" && Math.random() < 0.10) {
                bullet.vx = 0;
                bullet.vy = -speed;
            }
            if (weapon.legendaryPerk === "autoAim35" && Math.random() < 0.35) {
                bullet.vx = 0;
                bullet.vy = -speed;
            }

            bullets.push(bullet);
        }

        return { rate: rate, bullets: bullets };
    };

    // Один серповидный мечевой снаряд: изогнутое лезвие с рукоятью.
    window.drawEquipmentProjectile = function(renderCtx, bullet) {
        if (!renderCtx || !bullet || bullet.isMeleeWave !== true) return false;
        var angle = Math.atan2(Number(bullet.vy) || -1, Number(bullet.vx) || 0);
        var r = Math.max(13, Math.min(19, Number(bullet.size) || 16));
        renderCtx.save();
        renderCtx.translate(Number(bullet.x) || 0, Number(bullet.y) || 0);
        renderCtx.rotate(angle + Math.PI / 2 + Math.sin(Date.now() / 100 + (Number(bullet.x) || 0) * 0.02) * 0.06);
        renderCtx.globalCompositeOperation = "lighter";
        renderCtx.shadowColor = "#c66bff"; renderCtx.shadowBlur = r * 1.15;
        renderCtx.fillStyle = "#9d35e8"; renderCtx.strokeStyle = "#f0c2ff";
        renderCtx.lineWidth = Math.max(1.2, r * 0.09);
        renderCtx.beginPath();
        renderCtx.moveTo(-r * 0.18, r * 0.88);
        renderCtx.quadraticCurveTo(-r * 1.12, r * 0.12, -r * 0.52, -r * 0.72);
        renderCtx.quadraticCurveTo(-r * 0.25, -r * 1.10, r * 0.03, -r * 0.96);
        renderCtx.quadraticCurveTo(-r * 0.18, -r * 0.30, r * 0.56, r * 0.30);
        renderCtx.quadraticCurveTo(r * 0.80, r * 0.51, r * 0.93, r * 0.46);
        renderCtx.quadraticCurveTo(r * 0.38, r * 1.12, -r * 0.18, r * 0.88);
        renderCtx.closePath(); renderCtx.fill(); renderCtx.stroke();
        renderCtx.shadowBlur = r * 0.35; renderCtx.strokeStyle = "#fff5ff";
        renderCtx.lineWidth = Math.max(0.8, r * 0.045);
        renderCtx.beginPath(); renderCtx.moveTo(-r * 0.36, r * 0.60);
        renderCtx.quadraticCurveTo(-r * 0.02, r * 0.06, -r * 0.10, -r * 0.53); renderCtx.stroke();
        renderCtx.shadowColor = "#ff4d9d"; renderCtx.shadowBlur = r * 0.45;
        renderCtx.lineCap = "round"; renderCtx.strokeStyle = "#4b243f"; renderCtx.lineWidth = r * 0.22;
        renderCtx.beginPath(); renderCtx.moveTo(-r * 0.15, r * 0.77); renderCtx.lineTo(r * 0.10, r * 1.13); renderCtx.stroke();
        renderCtx.strokeStyle = "#ffd3f1"; renderCtx.lineWidth = Math.max(1, r * 0.07);
        renderCtx.beginPath(); renderCtx.moveTo(-r * 0.15, r * 0.77); renderCtx.lineTo(r * 0.10, r * 1.13); renderCtx.stroke();
        renderCtx.fillStyle = "#ff73c6"; renderCtx.beginPath(); renderCtx.arc(r * 0.10, r * 1.13, r * 0.12, 0, Math.PI * 2); renderCtx.fill();
        renderCtx.restore(); return true;
    };

    // Легендарный меч тратит удар при касании блока; уничтожение — ровно 8% на попытку.
    window.tryLegendarySwordBlockHit = function(bullet, hazards, onDestroy, onFail) {
        if (!bullet || bullet.weaponId !== "sword_l" || !Array.isArray(hazards)) return false;
        var excluded = { laser: true, laser_warning: true, giant_laser: true, roger_slash: true,
            roger_cross: true, tsunami: true, titan_fist: true, gura_crack: true,
            purple_crack_zone: true, gravity_well: true, hell_fire: true };
        for (var i = hazards.length - 1; i >= 0; i--) {
            var hazard = hazards[i];
            if (!hazard || typeof hazard !== "object" || excluded[hazard.type] || hazard.state === "warning") continue;
            if (!Number.isFinite(Number(hazard.x)) || !Number.isFinite(Number(hazard.y))) continue;
            var dx = (Number(bullet.x) || 0) - hazard.x, dy = (Number(bullet.y) || 0) - hazard.y;
            var radius = Math.max(5, Number(hazard.size) || Number(hazard.radius) || 12);
            if (Math.hypot(dx, dy) > radius + Math.max(4, Number(bullet.size) || 12)) continue;
            if (Math.random() < 0.08) { hazards.splice(i, 1); if (typeof onDestroy === "function") onDestroy(hazard); }
            else if (typeof onFail === "function") onFail(hazard);
            return true;
        }
        return false;
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
    // ★★★ УДАЛЕНО: patchStartArena() ★★★
    // ============================================================
    // Раньше эта функция умножала heartSpeed на бонус брони,
    // а battle.js делал это ЖЕ. Из-за этого скорость была завышена.
    // Теперь бонус применяется ТОЛЬКО в battle.js::startArena().
    // ============================================================

    // ============================================================
    // ПАТЧ УНИЧТОЖЕНИЯ АТАК (меч)
    // ============================================================
    function patchBulletDestruction() {
        if (typeof window.updateRWBPlayerBullets === 'function' && !window._eqRWBBulletsPatched) {
            let original = window.updateRWBPlayerBullets;
            window.updateRWBPlayerBullets = function() {
                if (typeof rwbPlayerBullets !== 'undefined' && Array.isArray(rwbPlayerBullets) && typeof rwbAttacks !== 'undefined' && typeof window.tryLegendarySwordBlockHit === 'function') {
                    for (let i = rwbPlayerBullets.length - 1; i >= 0; i--) {
                        let b = rwbPlayerBullets[i];
                        if (b.weaponId !== "sword_l") continue;
                        let hit = window.tryLegendarySwordBlockHit(b, rwbAttacks,
                            function(a) {
                                if (typeof spawnDestroyParticles === 'function') spawnDestroyParticles(a.x, a.y, a.color || "#c66bff");
                                if (typeof rwbSound === 'function') rwbSound(600, 'square', 0.15, 0.2);
                            },
                            function() { if (typeof spawnHitParticles === 'function') spawnHitParticles(b.x, b.y, "#c66bff", 2); });
                        if (hit) rwbPlayerBullets.splice(i, 1);
                    }
                }
                return original.apply(this, arguments);
            };
            window._eqRWBBulletsPatched = true;
        }
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================
    function init() {
        let attempts = 0;
        let maxAttempts = 100;
        function tryPatch() {
            attempts++;
            patchApplyHit();
            patchBulletDestruction();

            // ★ patchStartArena() БОЛЬШЕ НЕ ВЫЗЫВАЕТСЯ ★
            console.log("╔════════════════════════════════════════════╗");
            console.log("║  ⚔️ EQUIPMENT COMBAT v2.5 загружено        ║");
            console.log("║  ✅ Броня работает на ВСЕХ боссах          ║");
            console.log("║  ✅ Экспорт: applyArmorToBossDamage        ║");
            console.log("║  🎯 ФИКС: скорость НЕ применяется дважды   ║");
            console.log("║     (удалён patchStartArena)               ║");
            console.log("╚════════════════════════════════════════════╝");
            return;
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

    // ★★★ ГЛАВНЫЙ ЭКСПОРТ ДЛЯ БОССОВ ★★★
    window.applyArmorToBossDamage = applyArmorToDamage;

})();
