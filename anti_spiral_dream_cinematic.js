/* ============================================================
 * MULTIVERSE BATTLE · DREAM ENDING CINEMATIC
 * Отдельная пошаговая кинематографическая сцена концовки.
 * Текст не исчезает по таймеру: каждый кадр ждёт решения игрока.
 * ============================================================ */
(function () {
    "use strict";
    if (window.ASDreamCinematic) return;

    const scenes = [
        { title: "ЕЩЁ ОДИН ЗАБЕГ", text: "Красное сердечко снова садится за компьютер. В любимой survival-игре ночь почти закончилась, но шахта ещё не вычищена. «Ещё немного фарма, и хватит…»", hud: "SURVIVAL // NIGHT 184" },
        { title: "ГРИНД НЕ ЗАКАНЧИВАЕТСЯ", text: "Рубит дерево, добывает руду, чинит кирку, возвращается домой и снова уходит в шахту. На экране растут цифры, сундуки заполняются. Сердечко довольно подпрыгивает на стуле.", hud: "WOOD +248 / ORE +63 / XP +1200" },
        { title: "ТОЛЬКО НЕ ПОТЕРЯТЬ СОХРАНЕНИЕ", text: "В игре одна жизнь. Одна ошибка может стереть сотни часов гринда. Сердечко проверяет сохранение ещё раз, прежде чем продолжить.", hud: "HARDCORE WORLD // 1 LIFE" },
        { title: "МОЖНО ПРОСТО ИГРАТЬ", text: "Он мечтает не о бесконечной силе. Он хочет спокойно вернуться в свой мир, добывать ресурсы, строить базу и продолжать старый забег, не боясь, что однажды всё пропадёт.", hud: "SAVE FILE // BACKUP VERIFIED" },
        { title: "КОМАНДА, КОТОРУЮ ОН СОБРАЛ", text: "А в Multiverse-Battle у него уже другая история: настоящая эволюционная команда, собранная из сильнейших карт. Здесь показаны реальные карточки из интерфейса игры, а не нарисованная подделка.", hud: "MULTIVERSE BATTLE // EVOLUTION TEAM" }
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
        "#antiSpiralDreamEnding .asdc-real-game-grid .card-item{min-width:0;max-width:none;padding:6px;border-radius:8px}",
        "#antiSpiralDreamEnding .asdc-real-game-grid .card-image{max-height:74px;object-fit:contain}",
        "#antiSpiralDreamEnding .asdc-real-game-grid .card-name{font-size:10px}",
        "#antiSpiralDreamEnding .asdc-real-game-grid .card-stats{font-size:8px}",
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

    function drawPlayer(ctx, x, y, scale, pose, t) {
        ctx.save(); ctx.translate(x, y + Math.sin(t * 3.5) * 2); ctx.scale(scale, scale);
        const bob = pose === "run" ? Math.sin(t * 11) * 5 : 0;
        ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(0,4,31,8,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#f5a2b1"; ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-18,-22+bob); ctx.lineTo(-31,-11+Math.sin(t*5)*4); ctx.moveTo(18,-22+bob); ctx.lineTo(31,-12-Math.sin(t*5)*4); ctx.stroke();
        ctx.strokeStyle = "#6c263b"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-9,bob); ctx.lineTo(-14,12+bob); ctx.moveTo(9,bob); ctx.lineTo(14,12+bob); ctx.stroke();
        ctx.save(); ctx.translate(0,-20+bob); ctx.fillStyle="#ff315b"; ctx.strokeStyle="#ff9bad"; ctx.lineWidth=2; ctx.shadowColor="#ff315b"; ctx.shadowBlur=17;
        ctx.beginPath(); ctx.moveTo(0,15); ctx.bezierCurveTo(-8,8,-29,-5,-25,-20); ctx.bezierCurveTo(-22,-34,-5,-34,0,-21); ctx.bezierCurveTo(7,-35,24,-32,27,-19); ctx.bezierCurveTo(31,-5,9,9,0,15); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
        ctx.fillStyle="#fff4f6"; ctx.beginPath(); ctx.ellipse(-8,-16,3.2,4.5,-.15,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(8,-16,3.2,4.5,.15,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#591b30"; ctx.beginPath(); ctx.arc(-7,-16,1.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(9,-16,1.5,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle="#7a1735"; ctx.lineWidth=1.8; ctx.beginPath(); ctx.arc(1,-10,5,.15,Math.PI-.15); ctx.stroke(); ctx.restore(); ctx.restore();
    }

    function drawSurvivalMonitor(ctx, t, sceneIndex) {
        const x=350,y=76,w=555,h=330; ctx.save(); ctx.shadowColor="#6de6b4"; ctx.shadowBlur=22; ctx.fillStyle="#111820"; ctx.strokeStyle="#647d7b"; ctx.lineWidth=4; roundedRect(ctx,x,y,w,h,12); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
        ctx.fillStyle="#1d342d"; roundedRect(ctx,x+10,y+10,w-20,h-20,5); ctx.fill();
        const sx=x+18,sy=y+18,sw=w-36,sh=h-56; const sky=ctx.createLinearGradient(0,sy,0,sy+sh); sky.addColorStop(0,"#183f52"); sky.addColorStop(.56,"#4c7966"); sky.addColorStop(1,"#1b342c"); ctx.fillStyle=sky; ctx.fillRect(sx,sy,sw,sh);
        ctx.fillStyle="#d6f1b4"; ctx.beginPath(); ctx.arc(sx+sw*.78,sy+42,19,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#274d43"; ctx.beginPath(); ctx.moveTo(sx,sy+sh*.67); ctx.lineTo(sx+95,sy+90); ctx.lineTo(sx+190,sy+sh*.67); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx+120,sy+sh*.7); ctx.lineTo(sx+270,sy+70); ctx.lineTo(sx+410,sy+sh*.7); ctx.fill();
        for(let i=0;i<11;i++){const tx=sx+((i*53+t*(sceneIndex===1?9:2))%(sw+30)),ty=sy+sh*(.53+(i%3)*.07);ctx.fillStyle=i%2?"#163a2d":"#244d35";ctx.fillRect(tx,ty,12,35);ctx.fillRect(tx-9,ty-13,30,20);}
        const px=sx+sw*.47+Math.sin(t*2)*8,py=sy+sh*.65;ctx.fillStyle="#e2bc85";ctx.fillRect(px-7,py-22,14,15);ctx.fillStyle="#427fc1";ctx.fillRect(px-8,py-7,16,19);ctx.fillStyle="#6c8a9d";ctx.fillRect(px-11,py+12,7,10);ctx.fillRect(px+4,py+12,7,10);ctx.strokeStyle="#dce7dd";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px+7,py-4);ctx.lineTo(px+21,py-20+Math.sin(t*9)*4);ctx.stroke();
        ctx.fillStyle="#91c4a0";ctx.font="900 9px monospace";ctx.fillText(sceneIndex===0?"NIGHT 184 // HARDCORE":"MINING... +ORE +XP",sx+10,sy+14);ctx.fillStyle="#e35d68";roundedRect(ctx,sx+10,sy+23,105,8,3);ctx.fill();ctx.fillStyle="#e6c86f";roundedRect(ctx,sx+10,sy+36,78,6,3);ctx.fill();
        const slotY=sy+sh-28;for(let i=0;i<9;i++){ctx.fillStyle=i===4?"#b9d5a0":"rgba(7,16,14,.83)";ctx.fillRect(sx+55+i*42,slotY,36,25);ctx.strokeStyle=i===4?"#e8f7c4":"#8aa99a";ctx.lineWidth=1;ctx.strokeRect(sx+55+i*42,slotY,36,25);ctx.fillStyle=["#986b45","#7b8587","#b8a5a0","#6d9d6e"][i%4];ctx.fillRect(sx+65+i*42,slotY+6,14,13);}
        ctx.fillStyle="#101820";ctx.fillRect(x+w*.43,y+h,w*.14,18);ctx.fillStyle="#263a39";ctx.fillRect(x+w*.28,y+h+16,w*.44,10);ctx.restore();
    }

    function drawSpeech(ctx, x, y, width, speaker, text, accent) {
        ctx.save();
        ctx.font = "900 11px Arial";
        const maxWidth = width - 24;
        const words = String(text).split(/\\s+/);
        const lines = [];
        let line = "";
        words.forEach(function(word) {
            const test = line ? line + " " + word : word;
            if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
            else line = test;
        });
        if (line) lines.push(line);
        const lineHeight = 15;
        const h = 29 + lines.length * lineHeight;
        const bx = Math.max(8, Math.min(960 - width - 8, x));
        const by = Math.max(8, y);
        ctx.fillStyle = "rgba(5,9,22,.94)";
        ctx.strokeStyle = accent || "#8edfff"; ctx.lineWidth = 1.5;
        roundedRect(ctx, bx, by, width, h, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle = accent || "#8edfff";
        ctx.font = "1000 9px monospace"; ctx.fillText(speaker.toUpperCase(), bx + 12, by + 15);
        ctx.fillStyle = "#edf5ff"; ctx.font = "900 11px Arial";
        lines.forEach(function(row, i) { ctx.fillText(row, bx + 12, by + 31 + i * lineHeight); });
        ctx.restore();
    }

    function renderRealEvolutionFrame(parent) {
        const shot=makeElement("div","asdc-game-shot"); shot.style.inset="5% 4% 5%"; shot.style.overflow="auto"; shot.style.background="#171727"; shot.style.padding="10px";
        const header=makeElement("div","asdc-game-header"); header.appendChild(makeElement("div","","MULTIVERSE BATTLE · РЕАЛЬНЫЕ КАРТЫ")); header.appendChild(makeElement("div","asdc-stars","🧬 ЭВОЛЮЦИОННАЯ КОМАНДА")); shot.appendChild(header);
        const source=document.getElementById("collectionGrid");
        const cards=source?Array.from(source.querySelectorAll(".card-item")).filter(c=>{const r=c.querySelector(".rarity-tag");return r&&r.textContent.trim()==="Эволюционная";}):[];
        cards.sort((a,b)=>{const p=c=>{const m=c.textContent.match(/Общая сила:\\s*([\\d,.]+)/i);return m?Number(m[1].replace(/,/g,"")):0;};return p(b)-p(a);});
        const grid=makeElement("div","asdc-real-game-grid");grid.style.cssText="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-content:start;padding-top:9px";
        cards.slice(0,6).forEach(c=>{const clone=c.cloneNode(true);clone.removeAttribute("onclick");clone.querySelectorAll("[onclick]").forEach(e=>e.removeAttribute("onclick"));clone.style.cssText+=";min-width:0;max-width:none;max-height:235px;overflow:hidden;pointer-events:none;animation:none";grid.appendChild(clone);});
        if(!cards.length){const note=makeElement("div","","В текущей сессии не найдены отрисованные эволюционные карты. Поддельные карты не подставлены: открой коллекцию и дождись её загрузки.");note.style.cssText="color:#f6d98b;padding:20px;text-align:center;grid-column:1/-1;font-weight:800";grid.appendChild(note);}
        shot.appendChild(grid);parent.appendChild(shot);
    }

    function drawCinematicActors(ctx, sceneIndex, t, w, h) {
        if(sceneIndex===0){drawPlayer(ctx,195,448,1.45,"look",t);drawSurvivalMonitor(ctx,t,0);drawSpeech(ctx,24,22,305,"ИГРОК","Ещё один забег. Сегодня точно закончу шахту.","#ff7896");}
        else if(sceneIndex===1){drawPlayer(ctx,190+Math.sin(t*2)*5,448,1.45,"run",t);drawSurvivalMonitor(ctx,t,1);drawSpeech(ctx,24,22,310,"ИГРОК","Древесина есть. Руда есть. Ещё чуть-чуть опыта!","#ff7896");for(let i=0;i<7;i++){ctx.fillStyle=i%2?"#b3e8a1":"#f1d78a";ctx.globalAlpha=.55+Math.sin(t*5+i)*.35;ctx.fillRect(420+i*45,420-(t*25+i*17)%90,5,5);}ctx.globalAlpha=1;}
        else if(sceneIndex===2){drawPlayer(ctx,190,448,1.5,"look",t);drawSurvivalMonitor(ctx,t,0);ctx.fillStyle="rgba(5,10,15,.88)";roundedRect(ctx,470,150,390,110,10);ctx.fill();ctx.strokeStyle="#ffca7a";ctx.lineWidth=2;roundedRect(ctx,470,150,390,110,10);ctx.stroke();ctx.fillStyle="#ffe5ae";ctx.font="1000 17px monospace";ctx.fillText("SAVE FILE: 100%",493,183);ctx.fillStyle="#eaf3e8";ctx.font="900 12px Arial";ctx.fillText("WORLD BACKUP VERIFIED",493,211);ctx.fillText("ONE LIFE REMAINING",493,234);drawSpeech(ctx,24,22,330,"ИГРОК","Только бы сохранение не сломалось…","#ff7896");}
        else if(sceneIndex===3){drawPlayer(ctx,480,445,1.65,"look",t);drawSurvivalMonitor(ctx,t,1);drawSpeech(ctx,24,22,350,"ИГРОК","Я просто хочу вернуться завтра и продолжить.","#ff7896");ctx.fillStyle="rgba(10,18,23,.8)";roundedRect(ctx,70,340,245,70,9);ctx.fill();ctx.strokeStyle="#83d6a4";roundedRect(ctx,70,340,245,70,9);ctx.stroke();ctx.fillStyle="#c6f7d2";ctx.font="900 12px monospace";ctx.fillText("BACKUP COMPLETE",87,368);ctx.fillText("SAFE TO CONTINUE",87,390);}
        else {drawPlayer(ctx,110,455,1.15,"look",t);drawSpeech(ctx,22,22,300,"ИГРОК","А теперь посмотри, что я собрал.","#ff7896");}
    }

    function drawScene(ctx, sceneIndex, elapsed, width, height) {
        const w=width,h=height,t=elapsed*.001,survival=sceneIndex<4;
        const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,survival?"#15252a":"#101326");bg.addColorStop(.55,survival?"#26352f":"#17172d");bg.addColorStop(1,"#080b10");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        if(survival){ctx.fillStyle="#0b141a";ctx.fillRect(0,0,w,h*.57);ctx.fillStyle="#142a30";roundedRect(ctx,35,55,235,180,5);ctx.fill();ctx.strokeStyle="#536b69";ctx.lineWidth=4;ctx.stroke();ctx.fillStyle="#0a1218";ctx.fillRect(45,65,215,160);for(let i=0;i<24;i++){ctx.fillStyle="rgba(210,230,215,"+(.25+(i%4)*.12)+")";ctx.fillRect((i*47+11)%220+42,(i*31+7)%145+68,2,2);}ctx.fillStyle="#3b2e2a";ctx.fillRect(0,h*.76,w,h*.24);ctx.fillStyle="#5a4438";ctx.fillRect(0,h*.76,w,10);ctx.fillStyle="rgba(100,225,180,.09)";ctx.fillRect(325,65,590,370);}else{for(let i=0;i<90;i++){const x=(i*173.7+t*4)%w,y=(i*71.3)%h;ctx.fillStyle="rgba(190,205,255,"+(.15+(i%4)*.12)+")";ctx.fillRect(x,y,1.4,1.4);}}
        drawCinematicActors(ctx,sceneIndex,t,w,h);
    }

    function start(overlay, onDone) {
        if (!overlay || !overlay.parentNode || typeof onDone !== "function") return;
        const root = makeElement("section", "asdc-root");
        root.setAttribute("aria-label", "Кинематографическая история игрока");
        const style = document.createElement("style");
        style.textContent = css;
        root.appendChild(style);

        const topbar = makeElement("div", "asdc-topbar");
        topbar.appendChild(makeElement("strong", "", "PLAYER STORY  /  TWO DIFFERENT WORLDS"));
        const anomaly = makeElement("span", "", "SURVIVAL SAVE // CHECKING");
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
        root.appendChild(makeElement("div", "asdc-footer", "КАДРЫ СМЕНЯЮТСЯ ПО НАЖАТИЮ. SURVIVAL-ИГРА НЕ СВЯЗАНА С MULTIVERSE BATTLE."));
        overlay.appendChild(root);

        const ctx = canvas.getContext("2d");
        let index = 0, raf = 0, done = false, sceneStart = performance.now();
        let collectionShot = null;

        function updateScene() {
            const scene = scenes[index];
            title.textContent = scene.title;
            copy.textContent = scene.text;
            hudLeft.textContent = scene.hud;
            hudRight.textContent = index === 4 ? "REAL GAME CARDS" : "FRAME 0" + (index + 1);
            hudRight.className = "";
            anomaly.textContent = index === 4 ? "LIVE GAME UI" : "SURVIVAL SAVE // " + (index < 3 ? "ACTIVE" : "VERIFIED");
            anomaly.style.color = index === 4 ? "#ffe1a3" : "";
            count.textContent = "КАДР 0" + (index + 1) + " / 05  ·  ИСТОРИЯ ИГРОКА";
            next.textContent = index === scenes.length - 1 ? "ЗАКРЫТЬ КАДРЫ →" : "СЛЕДУЮЩИЙ КАДР →";
            stage.style.borderColor = index === 4 ? "rgba(255,211,106,.78)" : "rgba(140,184,255,.4)";
            stage.style.animation = "none";
            if (collectionShot) { collectionShot.remove(); collectionShot = null; }
            const oldShot = stage.querySelector(".asdc-game-shot");
            if (oldShot) oldShot.remove();
            if (index === 4) {
                renderRealEvolutionFrame(stage);
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