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
                bullet.canDestroy = true;
                bullet.rotSpeed = 0.1;
            }

            if (weapon.legendaryPerk === "destroyAttacks") bullet.canDestroy = true;
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

    // Лунный серповидный клинок для мечей (визуально вдохновлён дыханием Луны).
    // Возвращает true, если сам нарисовал снаряд, чтобы обычный шар не рисовался поверх.
    window.drawEquipmentProjectile = function(renderCtx, bullet) {
        if (!renderCtx || !bullet || bullet.isMeleeWave !== true) return false;
        var speedAngle = Math.atan2(Number(bullet.vy) || -1, Number(bullet.vx) || 0);
        var wobble = Math.sin(Date.now() / 95 + (Number(bullet.x) || 0) * 0.03) * 0.09;
        var rotation = speedAngle + Math.PI / 2 + wobble;
        var radius = Math.max(13, Math.min(19, Number(bullet.size) || 16));

        function drawMoonBlade(ctx, r, color, edge, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.strokeStyle = edge;
            ctx.lineWidth = Math.max(1, r * 0.11);
            ctx.shadowColor = edge;
            ctx.shadowBlur = r * 1.05;
            ctx.beginPath();
            ctx.moveTo(-r * 0.28, -r * 0.96);
            ctx.quadraticCurveTo(r * 1.22, -r * 0.35, r * 0.76, r * 0.55);
            ctx.quadraticCurveTo(r * 0.32, r * 1.08, -r * 0.12, r * 0.88);
            ctx.quadraticCurveTo(r * 0.42, r * 0.10, -r * 0.28, -r * 0.96);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = r * 0.4;
            ctx.strokeStyle = "#fff2ff";
            ctx.lineWidth = Math.max(0.8, r * 0.045);
            ctx.beginPath();
            ctx.moveTo(-r * 0.08, -r * 0.7);
            ctx.quadraticCurveTo(r * 0.68, -r * 0.14, r * 0.36, r * 0.5);
            ctx.stroke();
            ctx.restore();
        }

        renderCtx.save();
        renderCtx.translate(Number(bullet.x) || 0, Number(bullet.y) || 0);
        renderCtx.rotate(rotation);
        renderCtx.globalCompositeOperation = "lighter";
        // Три лезвия разного размера дают характерный веер серпов.
        drawMoonBlade(renderCtx, radius, "rgba(153,55,255,0.58)", "#f0a7ff", 0.98);
        renderCtx.save();
        renderCtx.translate(-radius * 0.62, -radius * 0.08);
        renderCtx.rotate(-0.42);
        drawMoonBlade(renderCtx, radius * 0.48, "rgba(255,48,105,0.52)", "#ff9dbd", 0.9);
        renderCtx.restore();
        renderCtx.save();
        renderCtx.translate(radius * 0.56, radius * 0.12);
        renderCtx.rotate(0.38);
        drawMoonBlade(renderCtx, radius * 0.39, "rgba(80,110,255,0.50)", "#b9c6ff", 0.9);
        renderCtx.restore();
        renderCtx.restore();
        return true;
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
