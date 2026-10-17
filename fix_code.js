// ============================================================
// FIX CODE v1.0 — Сброс использованного промокода
// ============================================================
// Убирает "DrinkTea2Win" из usedCodes, чтобы его можно было ввести заново.
// Работает автоматически при загрузке сейва + доступна ручная функция.
//
// ПОДКЛЮЧАТЬ ПОСЛЕ game.js
// ============================================================

(function() {
    'use strict';

    if (window._fixCodeLoaded) {
        console.warn("[FIX-CODE] Уже загружено, игнорирую повтор.");
        return;
    }
    window._fixCodeLoaded = true;

    // ========== КОДЫ, КОТОРЫЕ НАДО СБРОСИТЬ ==========
    // Добавляй сюда любые коды, если у друга забагались
    const CODES_TO_RESET = ["DrinkTea2Win"];

    // ========== ФУНКЦИЯ СБРОСА ==========
    function resetCodes(codesArray) {
        if (!codesArray || !codesArray.length) codesArray = CODES_TO_RESET;

        let removed = 0;
        try {
            if (typeof usedCodes !== 'undefined' && Array.isArray(usedCodes)) {
                for (let code of codesArray) {
                    let idx = usedCodes.indexOf(code);
                    while (idx !== -1) {
                        usedCodes.splice(idx, 1);
                        removed++;
                        idx = usedCodes.indexOf(code);
                    }
                }
                console.log("[FIX-CODE] Сброшено кодов:", removed, "| Удалены:", codesArray.join(", "));
            } else {
                console.warn("[FIX-CODE] usedCodes не найден");
            }

            // Синхронизируем с сейвом
            if (typeof slotData !== 'undefined' && slotData) {
                if (Array.isArray(slotData.usedCodes)) {
                    for (let code of codesArray) {
                        let idx = slotData.usedCodes.indexOf(code);
                        while (idx !== -1) {
                            slotData.usedCodes.splice(idx, 1);
                            idx = slotData.usedCodes.indexOf(code);
                        }
                    }
                }
                // На всякий случай — принудительно перезапишем
                slotData.usedCodes = usedCodes;
            }

            if (typeof saveAll === 'function') saveAll();

            return removed;
        } catch (e) {
            console.error("[FIX-CODE] Ошибка сброса:", e);
            return 0;
        }
    }

    // ========== ФУНКЦИЯ ДЛЯ РУЧНОГО СБРОСА ЧЕРЕЗ КОНСОЛЬ ==========
    window.resetPromoCode = function(code) {
        if (!code) {
            console.log("[FIX-CODE] Использование: resetPromoCode('DrinkTea2Win')");
            return;
        }
        let removed = resetCodes([code]);
        console.log("[FIX-CODE] Код '" + code + "' сброшен. Удалено:", removed);
        if (removed > 0) {
            if (typeof showFloatingText === 'function') {
                showFloatingText("✅ Код '" + code + "' можно ввести заново!", "#2ecc71");
            }
        } else {
            console.log("[FIX-CODE] Код '" + code + "' не был использован — вводи спокойно!");
        }
    };

    // ========== АВТО-СБРОС ПРИ ЗАГРУЗКЕ ==========
    // Ждём, пока игра загрузит сейв, потом сбрасываем коды
    function tryAutoReset() {
        if (typeof usedCodes === 'undefined') return false;
        if (typeof saveAll !== 'function') return false;

        console.log("[FIX-CODE] Авто-сброс при загрузке...");
        let removed = resetCodes(CODES_TO_RESET);
        console.log("[FIX-CODE] ✅ Авто-сброс завершён. Удалено:", removed);
        return true;
    }

    // Пытаемся сбросить при загрузке с задержкой (ждём загрузки сейва)
    let attempts = 0;
    let maxAttempts = 50;
    function waitForGame() {
        attempts++;
        // Ждём, пока currentSlot будет >= 0 (значит сейв загружен)
        if (typeof currentSlot !== 'undefined' && currentSlot >= 0) {
            setTimeout(tryAutoReset, 500);
            return;
        }
        if (attempts < maxAttempts) {
            setTimeout(waitForGame, 100);
        } else {
            console.warn("[FIX-CODE] Не удалось дождаться загрузки сейва");
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(waitForGame, 500);
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            setTimeout(waitForGame, 1000);
        });
    }

    // ========== ЭКСПОРТ ==========
    window.resetCodes = resetCodes;
    window.CODES_TO_RESET = CODES_TO_RESET;

    console.log("╔════════════════════════════════════════╗");
    console.log("║  🔧 FIX CODE v1.0 загружено           ║");
    console.log("║  Сброс кодов:", CODES_TO_RESET.join(", "));
    console.log("║  Ручной сброс: resetPromoCode('код')   ║");
    console.log("╚════════════════════════════════════════╝");

    // ========== АНТИ-СПИРАЛЬ: ГРАВИТАЦИОННЫЙ СДВИГ ==========
    // Меняет вектор гравитации каждые 15 секунд, перемещает босса к стороне
    // притяжения и запускает подходящие этому направлению волны атак.
    (function installAntiSpiralGravity() {
        if (window._antiSpiralGravityPatch) return;
        window._antiSpiralGravityPatch = true;
        const dirs = [
            { x: -1, y: 0, label: "ВЛЕВО" },
            { x: 0, y: -1, label: "ВВЕРХ" },
            { x: 1, y: 0, label: "ВПРАВО" },
            { x: 0, y: 1, label: "ВНИЗ" }
        ];
        let dirIndex = -1, nextFlip = 0, nextVolley = 0, wasFighting = false;
        let lastMiniState = false;
        function playerAndBoss() {
            if (typeof window.getAntiSpiralBossPlayer !== "function" ||
                typeof window.getAntiSpiralBossTarget !== "function") return null;
            return { p: window.getAntiSpiralBossPlayer(), b: window.getAntiSpiralBossTarget() };
        }
        function addGravityWave(d, now, big) {
            const refs = playerAndBoss();
            if (!refs) return;
            const attacks = typeof window.getAntiSpiralBossAttacks === "function" ? window.getAntiSpiralBossAttacks() : null;
            if (!Array.isArray(attacks) || attacks.length > 88) return;
            const count = big ? 7 : 5;
            for (let i = 0; i < count; i++) {
                const offset = 54 + i * (big ? 62 : 78);
                let x, y, vx, vy;
                if (d.x < 0) { x = 390; y = offset; vx = -3.0 - (big ? .65 : 0); vy = (refs.p.y - y) * .003; }
                else if (d.x > 0) { x = 10; y = offset; vx = 3.0 + (big ? .65 : 0); vy = (refs.p.y - y) * .003; }
                else if (d.y < 0) { x = offset % 380 + 10; y = 490; vx = (refs.p.x - x) * .003; vy = -3.0 - (big ? .65 : 0); }
                else { x = offset % 380 + 10; y = 58; vx = (refs.p.x - x) * .003; vy = 3.0 + (big ? .65 : 0); }
                attacks.push({
                    x:x, y:y, vx:vx, vy:vy, size:big ? 13 : 10,
                    color: i % 2 ? "#ff62dc" : "#69eaff", damage:big ? 19 : 14,
                    kind:"orb", life:155, phase:(now + i * 31) * .013
                });
            }
            if (typeof window.antiSpiralAddShake === "function") window.antiSpiralAddShake(big ? 8 : 3);
        }
        function flipGravity(now, refs) {
            dirIndex = (dirIndex + 1) % dirs.length;
            const d = dirs[dirIndex], p = refs.p, b = refs.b;
            nextFlip = now + 15000;
            nextVolley = now + 1700;
            // Сильный рывок: игрок летит к той же стороне, куда перемещается босс.
            if (d.x < 0) { p.x = Math.max(38, p.x - 78); p.vx = -6.5; b.x = 55; b.y = 205; }
            else if (d.x > 0) { p.x = Math.min(362, p.x + 78); p.vx = 6.5; b.x = 345; b.y = 205; }
            else if (d.y < 0) { p.y = Math.max(85, p.y - 84); p.vy = -8.2; b.x = 200; b.y = 72; }
            else { p.y = Math.min(438, p.y + 76); p.vy = 7.5; b.x = 200; b.y = 325; }
            if (typeof window.antiSpiralSpawnText === "function") {
                window.antiSpiralSpawnText(200, 112, "ГРАВИТАЦИЯ: " + d.label, "#83f4ff", 85);
                window.antiSpiralSpawnText(b.x, b.y - 20, "АНТИ-СПИРАЛЬ", "#d2a1ff", 48);
            }
            if (typeof window.antiSpiralAddFlash === "function") window.antiSpiralAddFlash(8, "#643dff");
            if (typeof window.antiSpiralAddShake === "function") window.antiSpiralAddShake(15);
            if (typeof window.antiSpiralPlaySound === "function") window.antiSpiralPlaySound(90 + dirIndex * 55, "sawtooth", .28, .12);
            addGravityWave(d, now, true);
        }
        setInterval(function() {
            if (typeof window.getAntiSpiralBossState !== "function" ||
                !window.getAntiSpiralBossActive || !window.getAntiSpiralBossActive()) {
                wasFighting = false; dirIndex = -1; nextFlip = 0; lastMiniState = false; return;
            }
            const state = window.getAntiSpiralBossState();
            if (state !== "fight") {
                // Мини-режим сохраняет собственную быструю смену гравитации.
                if (state === "mini") lastMiniState = true;
                else if (state !== "cinematic") { wasFighting = false; dirIndex = -1; nextFlip = 0; }
                return;
            }
            const now = Date.now(), refs = playerAndBoss();
            if (!refs || !refs.p || !refs.b) return;
            const p = refs.p;
            if (!wasFighting) {
                wasFighting = true; lastMiniState = false;
                dirIndex = -1; nextFlip = now + 15000; nextVolley = now + 2800;
            }
            const d = dirs[Math.max(0, dirIndex)];
            if (now >= nextFlip) flipGravity(now, refs);
            const active = dirs[Math.max(0, dirIndex)];
            // Постоянное слабое притяжение вдоль текущей оси гравитации.
            if (dirIndex >= 0) {
                if (active.x) p.x = Math.max(28, Math.min(372, p.x + active.x * .68));
                if (active.y < 0) p.vy = Math.max(-7, p.vy - .16);
                if (active.y > 0) p.vy = Math.min(7, p.vy + .19);
            }
            // Гравитационные волны регулярно меняют ось вместе с полем.
            if (dirIndex >= 0 && now >= nextVolley) {
                addGravityWave(active, now, false);
                nextVolley = now + 2450;
            }
            // Чёрная дыра: существенно усиливаем тягу поверх штатного поля притяжения.
            const attacks = typeof window.getAntiSpiralBossAttacks === "function" ? window.getAntiSpiralBossAttacks() : [];
            for (let i = 0; i < attacks.length; i++) {
                const w = attacks[i];
                if (!w || w.kind !== "well" || w.burst || w.timer <= 0) continue;
                const dx = w.x - p.x, dy = w.y - p.y, dist = Math.max(1, Math.hypot(dx, dy));
                if (dist < (w.pullRadius || 205)) {
                    const strength = 1 - dist / (w.pullRadius || 205);
                    p.x += dx / dist * 2.6 * strength;
                    p.vy += dy / dist * .11 * strength;
                    if (typeof window.antiSpiralAddShake === "function" && strength > .72) {
                        window.antiSpiralAddShake(1.7);
                    }
                }
            }
        }, 30);
    })();

    // Обновляем мини-режим Анти-Спирали до начала боя.
    (async function patchAntiSpiralMiniGame() {
        if (window._antiSpiralMiniPatchStarted) return;
        window._antiSpiralMiniPatchStarted = true;
        try {
            const url = new URL("anti_spiral_boss.js?v=13", document.baseURI).href;
            const response = await fetch(url, { cache: "no-store" });
            if (!response.ok) throw new Error("HTTP " + response.status);
            let source = await response.text();
            const newSpirals = [
                [62,128,0], [132,116,0.4], [220,125,0.8], [331,137,1.2], [286,194,1.6],
                [172,184,2.0], [76,226,2.4], [326,255,2.8], [203,286,3.2], [116,310,3.6],
                [55,365,4.0], [151,391,4.4], [247,365,4.8], [345,402,5.2], [205,438,5.6]
            ].map(v => "            { x: " + v[0] + ", y: " + v[1] + ", phase: " + v[2] + ", collected: false }").join(",\n");
            const start = source.indexOf("        asMiniSpirals = [");
            const end = source.indexOf("        ];", start);
            if (start < 0 || end < 0) throw new Error("Не найден список спиралей");
            source = source.slice(0, start) + "        asMiniSpirals = [\n" + newSpirals + "\n        ];" + source.slice(end + 10);
            source = source.replaceAll("elapsed / 15500", "elapsed / 15000");
            source = source.replaceAll("elapsed >= 15500", "elapsed >= 15000");
            source = source.replace("(15.5 - elapsed / 1000)", "(15 - elapsed / 1000)");
            source = source.replace("if (asMiniCollected >= 5)", "if (asMiniCollected >= 15)");
            source = source.replace('"СОБРАНО: " + asMiniCollected + "/5"', '"СОБРАНО: " + asMiniCollected + "/15"');
            source = source.replace(
                "    function asUpdateBrokenReality(now) {\n        const elapsed = now - asMiniIntroUntil;",
                "    function asUpdateBrokenReality(now) {\n        const elapsed = now - asMiniIntroUntil;\n        asShake = Math.max(asShake, 2.4 + Math.min(5.6, elapsed / 3500) + Math.abs(Math.sin(now * 0.017)) * 2.2);"
            );
            source = source.replace(
                '        c.save();\n        c.fillStyle = "rgba(2,0,12,.97)";\n        c.fillRect(0, 0, 400, 500);',
                '        c.save();\n        c.translate((Math.random() - 0.5) * asShake * 2.2, (Math.random() - 0.5) * asShake * 2.2);\n        c.fillStyle = "rgba(2,0,12,.97)";\n        c.fillRect(0, 0, 400, 500);'
            );
            if (!source.includes("if (asMiniCollected >= 15)") ||
                !source.includes('asMiniCollected + "/15"') ||
                source.includes("elapsed >= 15500") ||
                (source.match(/collected: false/g) || []).length < 15) {
                throw new Error("Проверка мини-режима не прошла");
            }
            window._antiSpiralBossLoaded = false;
            const injected = document.createElement("script");
            injected.textContent = "window._antiSpiralMiniPatchAppliedAt = Date.now();\n" + source;
            (document.head || document.documentElement).appendChild(injected);
            injected.remove();
            if (!window._antiSpiralMiniPatchAppliedAt) {
                window._antiSpiralBossLoaded = true;
                throw new Error("Браузер запретил применение обновления");
            }
            console.log("[ANTI-SPIRAL] 15 спиралей / 15 секунд; усилена тряска камеры.");
        } catch (err) {
            console.error("[ANTI-SPIRAL] Не удалось обновить мини-режим:", err);
        }
    })();

})();
