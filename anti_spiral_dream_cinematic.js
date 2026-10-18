/* ============================================================
 * MULTIVERSE BATTLE · DREAM ENDING CINEMATIC
 * Отдельная пошаговая кинематографическая сцена концовки.
 * Текст не исчезает по таймеру: каждый кадр ждёт решения игрока.
 * ============================================================ */
(function () {
    "use strict";
    if (window.ASDreamCinematic) return;

    const scenes = [
        {
            title: "СИЛЬНЕЙШАЯ КОМАНДА СОБРАНА",
            text: "Ты открываешь коллекцию. Все эволюции собраны. Ни одна карточка больше не скрыта, а команда, о которой ты мечтал, наконец стала реальностью.",
            hud: "COLLECTION // ALL EVOLUTIONS FOUND"
        },
        {
            title: "РАЗЛОМ ЗАПЕЧАТАН",
            text: "Последний разрыв между мирами закрывается. Шум стихают, потерянные вселенные возвращаются на свои места. Больше не осталось ни одного незавершённого разлома.",
            hud: "RIFT NETWORK // SEALED"
        },
        {
            title: "СОХРАНЕНИЕ ВОЗВРАЩЕНО",
            text: "Все фрагменты блока сервера на месте. Сохранение восстановлено. Ты больше не потеряешь свой прогресс из-за одной-единственной ошибки.",
            hud: "SERVER BLOCK // SAVE RESTORED"
        },
        {
            title: "ТВОЯ ЛЮБИМАЯ ИГРА. НАВСЕГДА.",
            text: "Теперь можно просто играть. Собирать карты, усиливать команду, фармить волны. Одна жизнь, бесконечное время и наконец никакой гонки.",
            hud: "ONE LIFE MODE // NO MORE RESETS"
        },
        {
            title: "СТОП. А ГДЕ РИК?",
            text: "Ты закрыл Разлом и собрал вообще всё. Но Рик так и не найден. Ни в коллекции, ни среди эволюций, ни в журнале событий. Почему его имя появляется в повреждённых данных?",
            hud: "ROSTER SCAN // RICK: NOT FOUND"
        }
    ];

    const css = [
        "#antiSpiralDreamEnding .asdc-root{width:min(1080px,100%);max-height:calc(100dvh - 28px);overflow:auto;padding:clamp(10px,2.3vw,23px);border:1px solid rgba(136,194,255,.34);border-radius:19px;background:radial-gradient(ellipse at 50% -20%,rgba(61,107,172,.27),transparent 60%),linear-gradient(155deg,rgba(9,15,31,.99),rgba(2,5,14,.995));box-shadow:0 28px 100px #000c;color:#edf5ff;font-family:Arial,sans-serif}",
        "#antiSpiralDreamEnding .asdc-root *{box-sizing:border-box}",
        "#antiSpiralDreamEnding .asdc-topbar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;font:900 9px/1.4 monospace;letter-spacing:1.15px;color:#a6bbdc}",
        "#antiSpiralDreamEnding .asdc-topbar strong{color:#e7f6ff;font-size:10px}",
        "#antiSpiralDreamEnding .asdc-stage{position:relative;isolation:isolate;overflow:hidden;aspect-ratio:16/9;min-height:260px;max-height:57vh;border:1px solid rgba(140,184,255,.4);border-radius:13px;background:#050a16;box-shadow:inset 0 0 40px #0009,0 12px 34px #0007}",
        "#antiSpiralDreamEnding .asdc-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}",
        "#antiSpiralDreamEnding .asdc-scanlines{position:absolute;inset:0;z-index:4;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.022) 0px,rgba(255,255,255,.022) 1px,transparent 2px,transparent 5px);mix-blend-mode:screen}",
        "#antiSpiralDreamEnding .asdc-stage-hud{position:absolute;z-index:5;top:9px;left:12px;right:12px;display:flex;justify-content:space-between;gap:8px;font:900 clamp(7px,.9vw,10px)/1.3 monospace;letter-spacing:1px;color:#e2eeff;text-shadow:0 2px 6px #000}",
        "#antiSpiralDreamEnding .asdc-stage-hud .asdc-warning{color:#ff879f}",
        "#antiSpiralDreamEnding .asdc-game-shot{position:absolute;z-index:3;inset:7% 5% 6%;padding:clamp(7px,1.4vw,14px);overflow:hidden;border:1px solid rgba(146,177,225,.55);border-radius:9px;background:linear-gradient(145deg,rgba(18,27,48,.97),rgba(7,12,25,.98));box-shadow:0 10px 34px #000a,0 0 26px #91a8ff16;animation:asdcShotIn .75s cubic-bezier(.2,.8,.2,1) both}",
        "#antiSpiralDreamEnding .asdc-game-header{display:flex;justify-content:space-between;align-items:center;gap:6px;border-bottom:1px solid #8ba0c629;padding-bottom:7px;color:#e6f3ff;font-weight:1000;font-size:clamp(9px,1.25vw,14px)}",
        "#antiSpiralDreamEnding .asdc-game-header small{display:block;margin-top:3px;color:#8297ba;font:800 7px monospace;letter-spacing:1px}",
        "#antiSpiralDreamEnding .asdc-stars{padding:5px 8px;border:1px solid #f7cc6350;border-radius:7px;background:#e7b95112;color:#ffe4a1;font-size:clamp(8px,1vw,11px);white-space:nowrap}",
        "#antiSpiralDreamEnding .asdc-tabs{display:flex;gap:5px;margin:8px 0;overflow:hidden}",
        "#antiSpiralDreamEnding .asdc-tab{flex:1;min-width:0;padding:6px 3px;text-align:center;border:1px solid #788bab28;border-radius:6px;background:#131d32;color:#7f92b2;font-size:clamp(7px,.9vw,10px);font-weight:900;white-space:nowrap}",
        "#antiSpiralDreamEnding .asdc-tab.active{border-color:#61dfff99;background:linear-gradient(135deg,#15466a,#20304c);color:#c8f5ff;box-shadow:0 0 12px #61dfff19}",
        "#antiSpiralDreamEnding .asdc-collection-meta{display:flex;justify-content:space-between;gap:8px;margin:4px 0 7px;color:#8fa2c1;font:800 clamp(7px,.82vw,9px) monospace}",
        "#antiSpiralDreamEnding .asdc-evolution-label{color:#ebbaff}",
        "#antiSpiralDreamEnding .asdc-card-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(4px,.65vw,8px);align-content:start}",
        "#antiSpiralDreamEnding .asdc-card{position:relative;min-width:0;overflow:hidden;padding:clamp(4px,.7vw,8px);border:1px solid rgba(183,129,255,.4);border-radius:7px;text-align:center;background:linear-gradient(155deg,rgba(42,27,70,.98),rgba(11,17,35,.98));box-shadow:inset 0 0 18px #c27bff0b;animation:asdcCardReveal .5s both}",
        "#antiSpiralDreamEnding .asdc-card:before{content:'';position:absolute;inset:0 0 auto;height:2px;background:linear-gradient(90deg,transparent,#d0a0ff,transparent)}",
        "#antiSpiralDreamEnding .asdc-card-art{height:clamp(29px,5.4vw,64px);width:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:3px;border-radius:5px;background:radial-gradient(circle,#a45de33b,transparent 72%);color:#d8b5ff;font-size:clamp(17px,2.4vw,28px)}",
        "#antiSpiralDreamEnding .asdc-card-art img{width:100%;height:100%;object-fit:cover;border-radius:5px;filter:saturate(1.1)}",
        "#antiSpiralDreamEnding .asdc-card-name{min-height:2.5em;display:flex;align-items:center;justify-content:center;color:#f4eaff;font-weight:1000;font-size:clamp(7px,.95vw,10px);line-height:1.2;overflow-wrap:anywhere}",
        "#antiSpiralDreamEnding .asdc-card-rarity{margin-top:3px;color:#e9baff;font-weight:1000;font-size:clamp(6px,.75vw,8px);letter-spacing:.45px}",
        "#antiSpiralDreamEnding .asdc-card-stats{margin-top:4px;color:#b7c7e1;font-size:clamp(6px,.75vw,8px);font-weight:800;white-space:nowrap}",
        "#antiSpiralDreamEnding .asdc-card-mastery{margin-top:3px;color:#ffb5ff;font-size:clamp(6px,.7vw,8px);font-weight:1000;letter-spacing:.4px}",
        "#antiSpiralDreamEnding .asdc-caption{padding:14px 6px 4px;text-align:center}",
        "#antiSpiralDreamEnding .asdc-title{margin:0 0 7px;color:#f5f8ff;font-size:clamp(19px,3.1vw,31px);font-weight:1000;line-height:1.12;letter-spacing:.6px;text-shadow:0 0 23px #9ebfff52}",
        "#antiSpiralDreamEnding .asdc-copy{max-width:850px;min-height:3.1em;margin:0 auto;color:#c7d5eb;font-size:clamp(12px,1.35vw,15px);line-height:1.65;white-space:normal}",
        "#antiSpiralDreamEnding .asdc-controls{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px}",
        "#antiSpiralDreamEnding .asdc-count{color:#8ba1c4;font:900 9px/1.4 monospace;letter-spacing:1px}",
        "#antiSpiralDreamEnding .asdc-actions{display:flex;gap:8px;align-items:center}",
        "#antiSpiralDreamEnding .asdc-button{min-height:42px;border-radius:9px;padding:10px 14px;font:1000 10px/1.25 Arial,sans-serif;letter-spacing:.55px;cursor:pointer;touch-action:manipulation}",
        "#antiSpiralDreamEnding .asdc-next{border:1px solid #6edfff9c;background:linear-gradient(135deg,#134e6c,#24234f);color:#e8fbff;box-shadow:0 0 18px #59dfff19}",
        "#antiSpiralDreamEnding .asdc-skip{border:1px solid #63708b;background:#10182a;color:#b6c2d8}",
        "#antiSpiralDreamEnding .asdc-button:hover{filter:brightness(1.18);transform:translateY(-1px)}",
        "#antiSpiralDreamEnding .asdc-footer{margin-top:8px;text-align:center;color:#53627e;font:800 8px monospace;letter-spacing:1px}",
        "@keyframes asdcShotIn{from{opacity:0;transform:translateY(12px) scale(.985);filter:blur(5px)}to{opacity:1;transform:none;filter:blur(0)}}",
        "@keyframes asdcCardReveal{from{opacity:0;transform:translateY(9px) scale(.97)}to{opacity:1;transform:none}}",
        "@keyframes asdcGlitch{0%,90%,100%{transform:translateX(0)}91%{transform:translateX(-5px)}93%{transform:translateX(4px)}96%{transform:translateX(-2px)}}",
        "@media(max-width:580px){#antiSpiralDreamEnding .asdc-root{padding:9px;border-radius:13px}#antiSpiralDreamEnding .asdc-stage{min-height:235px;aspect-ratio:4/3;max-height:45vh}#antiSpiralDreamEnding .asdc-game-shot{inset:8% 3% 5%;padding:6px}#antiSpiralDreamEnding .asdc-card-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}#antiSpiralDreamEnding .asdc-card-art{height:28px}#antiSpiralDreamEnding .asdc-card-name{font-size:7px;min-height:2.3em}#antiSpiralDreamEnding .asdc-card-stats{font-size:6px}#antiSpiralDreamEnding .asdc-caption{padding-top:11px}#antiSpiralDreamEnding .asdc-copy{font-size:12px;min-height:0}#antiSpiralDreamEnding .asdc-controls{align-items:stretch;flex-direction:column}#antiSpiralDreamEnding .asdc-actions{width:100%}#antiSpiralDreamEnding .asdc-button{flex:1;padding:9px 7px;font-size:9px}}"
    ].join("");

    function readEvolutionTemplates() {
        let values = [];
        try {
            if (typeof customCardTemplates !== "undefined" &&
                customCardTemplates && Array.isArray(customCardTemplates["Эволюционная"])) {
                values = customCardTemplates["Эволюционная"].slice();
            }
        } catch (e) {}
        if (!values.length) {
            try {
                if (typeof myCards !== "undefined" && Array.isArray(myCards)) {
                    values = myCards.filter(function (card) {
                        return card && card.rarity === "Эволюционная";
                    });
                }
            } catch (e) {}
        }
        const seen = Object.create(null);
        return values.filter(function (card) {
            const name = String(card && card.name || "").trim();
            if (!name || seen[name]) return false;
            seen[name] = true;
            return true;
        });
    }

    function makeElement(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined && text !== null) el.textContent = String(text);
        return el;
    }

    function renderCollectionScreenshot(parent) {
        const shot = makeElement("div", "asdc-game-shot");
        const header = makeElement("div", "asdc-game-header");
        const brand = makeElement("div");
        brand.appendChild(makeElement("div", "", "MULTIVERSE BATTLE"));
        brand.appendChild(makeElement("small", "", "PLAYER ARCHIVE  /  COLLECTION"));
        header.appendChild(brand);
        header.appendChild(makeElement("div", "asdc-stars", "⭐ ВСЕ КАРТЫ"));
        shot.appendChild(header);

        const tabs = makeElement("div", "asdc-tabs");
        [
            ["⚔ БОЙ", false], ["🎴 КОЛЛЕКЦИЯ", true],
            ["📖 БЕСТИАРИЙ", false], ["🧬 ЭВОЛЮЦИИ", false]
        ].forEach(function (entry) {
            tabs.appendChild(makeElement("div", "asdc-tab" + (entry[1] ? " active" : ""), entry[0]));
        });
        shot.appendChild(tabs);

        const cards = readEvolutionTemplates();
        shot.appendChild(makeElement("div", "asdc-collection-meta", "КОЛЛЕКЦИЯ  /  ЭВОЛЮЦИОННЫЕ"));
        const summary = makeElement("div", "asdc-collection-meta");
        summary.appendChild(makeElement("span", "", "🧬 " + cards.length + " ЭВОЛЮЦИОННЫХ КАРТ"));
        summary.appendChild(makeElement("span", "asdc-evolution-label", "ПОЛНЫЙ НАБОР · МАСТЕРСТВО 7"));
        shot.appendChild(summary);

        const grid = makeElement("div", "asdc-card-grid");
        const colors = ["#ffb8ff", "#8fefff", "#ffdc89", "#b8a1ff", "#a2ffcf"];
        const stats = (function () {
            try { return typeof cardStats !== "undefined" && cardStats["Эволюционная"] ? cardStats["Эволюционная"] : {}; }
            catch (e) { return {}; }
        })();

        cards.forEach(function (card, index) {
            const tile = makeElement("div", "asdc-card");
            tile.style.animationDelay = Math.min(index * 55, 500) + "ms";
            tile.style.borderColor = colors[index % colors.length] + "70";
            const art = makeElement("div", "asdc-card-art");
            const imagePath = typeof window.getCardImage === "function" ? window.getCardImage(card.name) : null;
            if (imagePath) {
                const img = document.createElement("img");
                img.alt = card.name;
                img.src = imagePath;
                img.addEventListener("error", function () {
                    img.remove();
                    art.textContent = "🧬";
                }, { once: true });
                art.appendChild(img);
            } else {
                art.textContent = "🧬";
            }
            tile.appendChild(art);
            tile.appendChild(makeElement("div", "asdc-card-name", card.name));
            tile.appendChild(makeElement("div", "asdc-card-rarity", "✦ ЭВОЛЮЦИОННАЯ"));
            const damage = card.damage != null ? card.damage : (stats.damage != null ? stats.damage : "?");
            const hp = card.hp != null ? card.hp : (stats.hp != null ? stats.hp : "?");
            const speed = card.speed != null ? card.speed : (stats.speed != null ? stats.speed : "?");
            tile.appendChild(makeElement("div", "asdc-card-stats", "💪 " + damage + "  ❤️ " + hp + "  ⚡ " + speed));
            tile.appendChild(makeElement("div", "asdc-card-mastery", "★★★★★★★ 7/7"));
            grid.appendChild(tile);
        });
        if (!cards.length) {
            const fallback = makeElement("div", "asdc-card");
            fallback.style.gridColumn = "1 / -1";
            fallback.appendChild(makeElement("div", "asdc-card-name", "ЭВОЛЮЦИОННЫЕ КАРТЫ"));
            fallback.appendChild(makeElement("div", "asdc-card-mastery", "МАСТЕРСТВО 7"));
            grid.appendChild(fallback);
        }
        shot.appendChild(grid);
        parent.appendChild(shot);
    }

    function roundedRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    function drawScene(ctx, sceneIndex, elapsed, width, height) {
        const w = width, h = height, t = elapsed * 0.001;
        const isRift = sceneIndex === 1;
        const isSave = sceneIndex === 2;
        const isGame = sceneIndex === 3;
        const isRick = sceneIndex === 4;
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, isRick ? "#160d24" : isRift ? "#130d31" : isSave ? "#0c2135" : isGame ? "#071e2c" : "#0b1830");
        bg.addColorStop(0.55, "#080d1c");
        bg.addColorStop(1, "#03050b");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 125; i++) {
            const x = (i * 173.7 + t * (isRick ? 24 : 8) * ((i % 3) + 1)) % (w + 10);
            const y = (i * 71.3 + Math.sin(t + i) * 6) % h;
            const alpha = 0.15 + (Math.sin(t * 1.4 + i) + 1) * 0.22;
            ctx.fillStyle = isRick && i % 7 === 0 ? "rgba(255,87,131," + alpha + ")" : "rgba(174,211,255," + alpha + ")";
            ctx.fillRect(x, y, i % 8 === 0 ? 2.4 : 1.2, i % 8 === 0 ? 2.4 : 1.2);
        }

        ctx.save();
        ctx.strokeStyle = isRick ? "rgba(255,92,141,.13)" : "rgba(106,181,255,.12)";
        ctx.lineWidth = 1;
        const horizon = h * .66;
        for (let i = 0; i < 18; i++) {
            const y = horizon + i * i * 0.38 + (t * 14 % 14);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        for (let i = -10; i <= 10; i++) {
            ctx.beginPath(); ctx.moveTo(w / 2 + i * 3, horizon); ctx.lineTo(w / 2 + i * 38, h); ctx.stroke();
        }
        ctx.restore();

        if (sceneIndex === 0) {
            const pulse = 0.5 + Math.sin(t * 1.5) * .12;
            const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * .48);
            glow.addColorStop(0, "rgba(137,103,255," + pulse * .22 + ")");
            glow.addColorStop(1, "rgba(42,70,145,0)");
            ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
        } else if (isRift) {
            const cx = w * .5, cy = h * .48;
            for (let ring = 0; ring < 7; ring++) {
                const radius = 28 + ring * 22 + Math.sin(t * 1.7 + ring) * 7;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(t * (ring % 2 ? -.25 : .38) + ring);
                ctx.strokeStyle = ring % 2 ? "rgba(173,112,255,.65)" : "rgba(98,230,255,.64)";
                ctx.lineWidth = ring % 2 ? 2 : 1.3;
                ctx.beginPath();
                ctx.ellipse(0, 0, radius * (1.2 + Math.sin(t * 1.3) * .08), radius * .52, 0, .25, Math.PI * 1.85);
                ctx.stroke();
                ctx.restore();
            }
            ctx.fillStyle = "#e2c8ff";
            ctx.shadowColor = "#b87aff"; ctx.shadowBlur = 28;
            ctx.beginPath(); ctx.arc(cx, cy, 5 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            for (let i = 0; i < 40; i++) {
                const a = i * 2.399 + t * .5;
                const rr = 40 + ((i * 23 + t * 32) % 170);
                ctx.fillStyle = i % 2 ? "#71eaff" : "#cc8dff";
                ctx.globalAlpha = .2 + ((Math.sin(t * 3 + i) + 1) * .28);
                ctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .6, 2, 2);
            }
            ctx.globalAlpha = 1;
            ctx.font = "900 12px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ccecff";
            ctx.fillText("RIFT SEAL IN PROGRESS", cx, h * .83);
        } else if (isSave) {
            const cx = w * .5, cy = h * .43, bob = Math.sin(t * 1.8) * 9;
            ctx.save(); ctx.translate(cx, cy + bob);
            ctx.shadowColor = "#57eaff"; ctx.shadowBlur = 35;
            ctx.fillStyle = "rgba(82,218,255,.16)";
            ctx.strokeStyle = "#9df3ff"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -78); ctx.lineTo(68, -35); ctx.lineTo(68, 42); ctx.lineTo(0, 80); ctx.lineTo(-68, 42); ctx.lineTo(-68, -35); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#e2fbff"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, -78); ctx.lineTo(0, 1); ctx.lineTo(68, -35); ctx.moveTo(0, 1); ctx.lineTo(-68, -35); ctx.moveTo(0, 1); ctx.lineTo(0, 80); ctx.stroke();
            ctx.fillStyle = "#efffff"; ctx.font = "900 15px monospace"; ctx.textAlign = "center";
            ctx.fillText("SAVE", 0, 8);
            ctx.restore();
            for (let i = 0; i < 18; i++) {
                const x = (i * 91 + t * 45) % w, y = h * (.13 + ((i * 19) % 50) / 100);
                ctx.fillStyle = i % 2 ? "#82efff" : "#c09dff";
                ctx.globalAlpha = .45 + Math.sin(t * 3 + i) * .3;
                ctx.fillRect(x, y, 2 + i % 3, 2 + i % 3);
            }
            ctx.globalAlpha = 1;
            ctx.font = "900 12px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#a9f5ff";
            ctx.fillText("CHECKSUM OK  //  SAVE FILE RESTORED", w / 2, h * .83);
        } else if (isGame) {
            const cx = w * .5, cy = h * .4;
            for (let i = 0; i < 6; i++) {
                ctx.save(); ctx.translate(cx + Math.cos(t * .4 + i) * 145, cy + Math.sin(t * .55 + i * 1.6) * 52);
                ctx.rotate(Math.sin(t + i) * .08);
                roundedRect(ctx, -28, -38, 56, 76, 6);
                ctx.fillStyle = "rgba(64,96,146,.45)"; ctx.fill();
                ctx.strokeStyle = i % 2 ? "#89e8ff" : "#d1acff"; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.fillStyle = i % 2 ? "#85eaff" : "#d6adff"; ctx.font = "900 19px Arial"; ctx.textAlign = "center";
                ctx.fillText(i % 2 ? "✦" : "★", 0, 4);
                ctx.restore();
            }
            ctx.font = "1000 21px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "#f3f7ff";
            ctx.shadowColor = "#75cfff"; ctx.shadowBlur = 18;
            ctx.fillText("∞", cx, cy + 12); ctx.shadowBlur = 0;
            ctx.font = "900 11px monospace"; ctx.fillStyle = "#9bdfff";
            ctx.fillText("ONE LIFE  /  INFINITE TIME", cx, h * .82);
            roundedRect(ctx, w * .24, h * .88, w * .52, 6, 3);
            ctx.fillStyle = "#18233d"; ctx.fill();
            ctx.fillStyle = "#70eaff"; ctx.fillRect(w * .24, h * .88, w * .52, 6);
        } else if (isRick) {
            const x = w * .5, y = h * .45;
            ctx.save(); ctx.translate(x, y);
            ctx.rotate(Math.sin(t * .6) * .025);
            ctx.setLineDash([9, 7]);
            ctx.strokeStyle = "rgba(255,110,151,.8)"; ctx.lineWidth = 2;
            roundedRect(ctx, -92, -112, 184, 224, 12); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = "rgba(255,76,122,.06)"; ctx.fill();
            ctx.font = "1000 68px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,114,151,.22)";
            ctx.fillText("?", 0, 22);
            ctx.font = "900 11px monospace"; ctx.fillStyle = "#ff9cb4";
            ctx.fillText("EMPTY ROSTER SLOT", 0, 83);
            ctx.restore();
            for (let i = 0; i < 5; i++) {
                const yBand = (t * 70 + i * 83) % h;
                ctx.fillStyle = "rgba(255,55,113,.12)";
                ctx.fillRect(0, yBand, w, 4);
            }
            ctx.fillStyle = "#ff89a4"; ctx.font = "1000 19px monospace"; ctx.textAlign = "center";
            ctx.shadowColor = "#ff376c"; ctx.shadowBlur = 22;
            ctx.fillText("RICK // CONNECTION UNKNOWN", w / 2, h * .85);
            ctx.shadowBlur = 0;
            if (Math.sin(t * 7) > .86) {
                ctx.fillStyle = "rgba(255,67,130,.15)";
                ctx.fillRect(Math.sin(t * 17) * 100, h * .32, w * .75, 9);
            }
        }
    }

    function start(overlay, onDone) {
        if (!overlay || !overlay.parentNode || typeof onDone !== "function") return;
        const root = makeElement("section", "asdc-root");
        root.setAttribute("aria-label", "Кинематографическая концовка Анти-Спирали");
        const style = document.createElement("style");
        style.textContent = css;
        root.appendChild(style);

        const topbar = makeElement("div", "asdc-topbar");
        topbar.appendChild(makeElement("strong", "", "MULTIVERSE BATTLE  /  DREAM SEQUENCE"));
        const anomaly = makeElement("span", "", "REALITY CHECK // PENDING");
        topbar.appendChild(anomaly);
        root.appendChild(topbar);

        const stage = makeElement("div", "asdc-stage");
        const canvas = document.createElement("canvas");
        canvas.className = "asdc-canvas";
        canvas.width = 960; canvas.height = 540;
        stage.appendChild(canvas);
        const stageHud = makeElement("div", "asdc-stage-hud");
        const hudLeft = makeElement("span", "", scenes[0].hud);
        const hudRight = makeElement("span", "", "FRAME 01");
        stageHud.appendChild(hudLeft); stageHud.appendChild(hudRight);
        stage.appendChild(stageHud);
        stage.appendChild(makeElement("div", "asdc-scanlines"));
        root.appendChild(stage);

        const caption = makeElement("div", "asdc-caption");
        const title = makeElement("h1", "asdc-title", scenes[0].title);
        const copy = makeElement("p", "asdc-copy", scenes[0].text);
        caption.appendChild(title); caption.appendChild(copy);
        root.appendChild(caption);

        const controls = makeElement("div", "asdc-controls");
        const count = makeElement("div", "asdc-count", "КАДР 01 / 05  ·  ОЖИДАНИЕ ТВОЕГО РЕШЕНИЯ");
        const actions = makeElement("div", "asdc-actions");
        const skip = makeElement("button", "asdc-button asdc-skip", "ПРОПУСТИТЬ КОНЦОВКУ ↗");
        skip.type = "button";
        const next = makeElement("button", "asdc-button asdc-next", "СЛЕДУЮЩИЙ КАДР →");
        next.type = "button";
        actions.appendChild(skip); actions.appendChild(next);
        controls.appendChild(count); controls.appendChild(actions);
        root.appendChild(controls);
        root.appendChild(makeElement("div", "asdc-footer", "ТЕКСТ НЕ ИСЧЕЗНЕТ. КАДР СМЕНИТСЯ ТОЛЬКО ПО ТВОЕМУ НАЖАТИЮ."));
        overlay.appendChild(root);

        const ctx = canvas.getContext("2d");
        let index = 0, raf = 0, done = false, sceneStart = performance.now();
        let collectionShot = null;

        function updateScene() {
            const scene = scenes[index];
            title.textContent = scene.title;
            copy.textContent = scene.text;
            hudLeft.textContent = scene.hud;
            hudRight.textContent = index === 4 ? "ANOMALY DETECTED" : "FRAME 0" + (index + 1);
            hudRight.className = index === 4 ? "asdc-warning" : "";
            anomaly.textContent = index === 4 ? "RICK // UNKNOWN SIGNAL" : "REALITY CHECK // " + (index < 3 ? "STABLE" : "SUSPICIOUS");
            anomaly.style.color = index === 4 ? "#ff879f" : "";
            count.textContent = "КАДР 0" + (index + 1) + " / 05  ·  ОЖИДАНИЕ ТВОЕГО РЕШЕНИЯ";
            next.textContent = index === scenes.length - 1 ? "ЗАКРЫТЬ КАДРЫ →" : "СЛЕДУЮЩИЙ КАДР →";
            stage.style.borderColor = index === 4 ? "rgba(255,106,148,.78)" : "rgba(140,184,255,.4)";
            stage.style.animation = index === 4 ? "asdcGlitch 4.5s steps(1) infinite" : "none";
            if (collectionShot) { collectionShot.remove(); collectionShot = null; }
            if (index === 0) {
                renderCollectionScreenshot(stage);
                collectionShot = stage.querySelector(".asdc-game-shot");
            }
            sceneStart = performance.now();
        }

        function finish() {
            if (done) return;
            done = true;
            if (raf) cancelAnimationFrame(raf);
            next.removeEventListener("click", goNext);
            skip.removeEventListener("click", finish);
            if (root.parentNode) root.remove();
            onDone();
        }

        function goNext() {
            if (done) return;
            if (index >= scenes.length - 1) { finish(); return; }
            index++;
            updateScene();
        }

        function draw(now) {
            if (done || !root.parentNode || !overlay.parentNode) { finish(); return; }
            drawScene(ctx, index, now - sceneStart, canvas.width, canvas.height);
            raf = requestAnimationFrame(draw);
        }

        next.addEventListener("click", goNext);
        skip.addEventListener("click", finish);
        updateScene();
        raf = requestAnimationFrame(draw);
    }

    window.ASDreamCinematic = { start: start };
})();