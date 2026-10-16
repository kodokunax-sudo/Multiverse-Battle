// ============================================================
// АНТИ-СПИРАЛЬ — УНИКАЛЬНЫЙ БОСС 1500 ВОЛНЫ
// Отдельный бой по архитектуре Путеводной Звезды / Живого Камня / RWB.
// ============================================================
(function () {
    if (window._antiSpiralBossLoaded) return;
    window._antiSpiralBossLoaded = true;

    let asActive = false;
    let asState = "idle";
    let asAnimFrame = null;
    let asMusic = null;
    let asBossHp = 0;
    let asBossMaxHp = 0;
    let asPlayerHp = 220;
    let asPlayerMaxHp = 220;
    let asPlayer = { x: 200, y: 430, vx: 0, vy: 0, size: 12, invuln: 0, grounded: true };
    let asBoss = { x: 200, y: 135, size: 48, rotation: 0, pulse: 0, flash: 0 };
    let asAttacks = [];
    let asParticles = [];
    let asTexts = [];
    let asKeys = Object.create(null);
    let asPointer = { down: false, x: 0, y: 0, id: null };
    let asShake = 0;
    let asFlash = 0;
    let asFlashColor = "#ffffff";
    let asFrame = 0;
    let asPattern = 0;
    let asPatternTimer = 0;
    let asLastArenaShift = 0;
    let asArenaWidth = 396;
    let asArenaHeight = 438;
    let asTargetWidth = 396;
    let asTargetHeight = 438;
    let asGravityPull = 0.10;
    let asLastShot = 0;
    let asWinPending = false;
    let asDefeatPending = false;
    let asBossDamageFlash = 0;
    let asPhase = 1;

    const patterns = ["СПИРАЛЬНЫЙ ШТОРМ", "ВОЛНА ГОРИЗОНТА", "ДОЖДЬ СИНГУЛЯРНОСТЕЙ", "ГРАВИТАЦИОННЫЙ РАЗЛОМ"];

    function asCanvas() {
        if (typeof initArena === "function") initArena();
        return typeof canvas !== "undefined" ? canvas : document.getElementById("arenaCanvas");
    }
    function asCtx() { return typeof ctx !== "undefined" ? ctx : (asCanvas() && asCanvas().getContext("2d")); }
    function asFloor() { return 500 - (445 - asArenaHeight) / 2 - asPlayer.size; }
    function asBounds() {
        return {
            left: (400 - asArenaWidth) / 2 + asPlayer.size,
            right: (400 + asArenaWidth) / 2 - asPlayer.size,
            top: 55 + (445 - asArenaHeight) / 2 + asPlayer.size,
            bottom: asFloor()
        };
    }
    function asText(x, y, text, color, life) {
        asTexts.push({ x:x, y:y, text:text, color:color || "#ffffff", life:life || 50, maxLife:life || 50, vy:-0.7 });
    }
    function asSound(freq, type, duration, volume) {
        try {
            if (typeof playArenaSound === "function") playArenaSound(freq, type || "sine", duration || 0.12, volume || 0.08);
        } catch(e) {}
    }
    function startASMusic() {
        if (typeof musicEnabled !== "undefined" && !musicEnabled) return;
        try {
            if (typeof stopAllMusic === "function") stopAllMusic();
            if (!asMusic) {
                asMusic = new Audio("music/анти спираль.mp3");
                asMusic.loop = true;
                asMusic.volume = 0.42;
            }
            asMusic.currentTime = 0;
            asMusic.play().catch(function(){});
        } catch(e) {}
    }
    function stopASMusic() {
        try { if (asMusic) { asMusic.pause(); asMusic.currentTime = 0; } } catch(e) {}
    }
    function asBossHit(damage, message) {
        if (!asActive || asWinPending || asDefeatPending || asState === "intro" || asState === "victory") return;
        let amount = Math.max(1, Math.floor(Number(damage) || 1));
        asBossHp = Math.max(0, asBossHp - amount);
        asBossDamageFlash = 12;
        asShake = Math.max(asShake, 5);
        asFlash = Math.max(asFlash, 3);
        asFlashColor = "#35c9ff";
        asText(asBoss.x, asBoss.y - asBoss.size - 12, "-" + amount, "#8ce8ff", 35);
        if (message) asText(asBoss.x, asBoss.y - asBoss.size - 28, message, "#ffffff", 35);
        for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 1 + Math.random() * 4;
            asParticles.push({x:asBoss.x,y:asBoss.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:22,maxLife:22,color:"#50d6ff",size:2+Math.random()*3});
        }
        asSound(440 + Math.random()*180, "triangle", 0.08, 0.035);
        if (asBossHp <= 0) asWin();
    }
    function asDamagePlayer(damage, label) {
        if (!asActive || asPlayer.invuln > 0 || asState === "intro" || asState === "victory" || asDefeatPending) return;
        const amount = Math.max(1, Math.floor(Number(damage) || 1));
        asPlayerHp = Math.max(0, asPlayerHp - amount);
        asPlayer.invuln = 42;
        asShake = Math.max(asShake, 10);
        asFlash = 10; asFlashColor = "#1f7bff";
        asText(asPlayer.x, asPlayer.y - 22, (label || "ГРАВИТАЦИОННЫЙ УДАР") + " -" + amount, "#70d9ff", 42);
        asSound(110, "sawtooth", 0.22, 0.09);
        if (asPlayerHp <= 0) asLose();
    }
    function asAddAttack(x, y, vx, vy, size, color, damage, kind) {
        asAttacks.push({x:x,y:y,vx:vx,vy:vy,spd:vx,spdY:vy,size:size||14,color:color||"#3abfff",damage:damage||12,kind:kind||"orb",life:250,phase:Math.random()*6});
    }
    function asSpawnPattern(now) {
        const damage = asPhase >= 3 ? 18 : (asPhase >= 2 ? 14 : 10);
        const floor = asFloor();
        if (asPattern === 0) {
            // Circular spiral volley, aimed near the soul but with a moving angular offset.
            const base = Math.atan2(asPlayer.y - asBoss.y, asPlayer.x - asBoss.x) + now * 0.0018;
            const count = asPhase >= 3 ? 9 : 7;
            for (let i=0;i<count;i++) {
                const a = base + i * Math.PI * 2 / count;
                asAddAttack(asBoss.x, asBoss.y, Math.cos(a)*(2.0+asPhase*0.35), Math.sin(a)*(2.0+asPhase*0.35), 12, i%2 ? "#4fcaff" : "#a95bff", damage, "spiral");
            }
        } else if (asPattern === 1) {
            // Ground-level energy wave. It can only be dodged reliably by jumping.
            const dir = Math.random() > 0.5 ? 1 : -1;
            const start = dir > 0 ? -24 : 424;
            for (let i=0;i<5;i++) {
                asAddAttack(start - dir * i * 47, floor - 10 - (i%2)*4, dir*(3.0+asPhase*0.5), 0, 25, "#38c8ff", damage, "ground");
            }
            if (asPhase >= 2) {
                const gapX = asPlayer.x + (Math.random()>0.5?1:-1)*70;
                for (let i=0;i<3;i++) asAddAttack(gapX + (i-1)*28, 68, 0, 3.0, 16, "#a85bff", damage, "orb");
            }
        } else if (asPattern === 2) {
            // Falling singularities. One lane near the player is deliberately left open.
            const left = (400-asArenaWidth)/2 + 18;
            const width = asArenaWidth - 36;
            const lane = Math.floor(Math.random()*6);
            for (let i=0;i<6;i++) {
                if (i===lane || Math.abs(left + width*(i+0.5)/6 - asPlayer.x)<24) continue;
                asAddAttack(left + width*(i+0.5)/6, 60, (Math.random()-0.5)*0.35, 2.1+Math.random()*0.8, 15, "#54bfff", damage, "fall");
            }
        } else {
            // A purple gravity tear fires a short fan from the side opposite the soul.
            const sx = asPlayer.x < 200 ? 420 : -20;
            const sy = 110 + Math.random()*105;
            const aim = Math.atan2(asPlayer.y-sy, asPlayer.x-sx);
            for (let i=-2;i<=2;i++) {
                const a=aim+i*0.16;
                asAddAttack(sx,sy,Math.cos(a)*(3.0+asPhase*0.3),Math.sin(a)*(3.0+asPhase*0.3),14,"#bb65ff",damage,"orb");
            }
        }
        asSound(asPattern===1?180:300, "sawtooth", 0.14, 0.055);
    }
    function asShiftArena(now) {
        if (!asLastArenaShift) asLastArenaShift = now;
        if (now - asLastArenaShift < 4200) return;
        asLastArenaShift = now;
        const wide = asArenaWidth < 320;
        asTargetWidth = wide ? 396 : 252;
        asTargetHeight = wide ? 300 : 438;
        asText(200, 85, wide ? "ПРОСТРАНСТВО РАСШИРЯЕТСЯ" : "ГРАВИТАЦИЯ СЖИМАЕТ АРЕНУ", "#67d8ff", 70);
        asShake = 5;
        asSound(wide ? 100 : 160, "sawtooth", 0.3, 0.07);
    }
    function asKeyDown(ev) {
        if (!asActive) return;
        const k = ev.key.toLowerCase();
        if (["arrowleft","arrowright","arrowup","arrowdown"," ","w","a","s","d","enter"].includes(k)) ev.preventDefault();
        asKeys[k] = true;
        if ((k==="enter" || k===" ") && asState==="intro") asBegin();
        else if (k==="escape" && asState==="intro") asStop();
    }
    function asKeyUp(ev) { asKeys[ev.key.toLowerCase()] = false; }
    function asPointerDown(ev) {
        if (!asActive) return;
        const c=asCanvas(); if(!c) return;
        const rect=c.getBoundingClientRect();
        const x=(ev.clientX-rect.left)*400/rect.width;
        const y=(ev.clientY-rect.top)*500/rect.height;
        if (asState==="intro") { asBegin(); return; }
        if (asState!=="fight") return;
        if (asState === "intro") { asBegin(); return; }
        if (Math.hypot(x-asBoss.x,y-asBoss.y) < asBoss.size*1.9) {
            asBossHit(Math.max(25, Math.floor((Number(window.playerFinalDamage)||80)*0.20)), "ПОПАДАНИЕ");
            return;
        }
        // Touch below the boss can trigger a jump; a held drag steers the soul.
        if (y>430 && x>150 && x<250 && asPlayer.grounded) {
            asPlayer.vy=-8.4; asPlayer.grounded=false; asPlayer.vy=Math.min(asPlayer.vy,-8.4);
            asPlayer.grounded=false; asText(asPlayer.x,asPlayer.y-20,"ПРЫЖОК!","#68dcff",28);
            return;
        }
        asPointer.down=true; asPointer.id=ev.pointerId; asPointer.x=x; asPointer.y=y; asPointer.direction=0;
        if (c.setPointerCapture) { try { c.setPointerCapture(ev.pointerId); } catch(e) {} }
    }
    function asPointerMove(ev) {
        if (!asActive || !asPointer.down) return;
        const c=asCanvas(); if(!c) return;
        const rect=c.getBoundingClientRect();
        asPointer.x=(ev.clientX-rect.left)*400/rect.width;
        asPointer.y=(ev.clientY-rect.top)*500/rect.height;
    }
    function asPointerUp(ev) {
        if (asPointer.id!==null && ev.pointerId!==undefined && ev.pointerId!==asPointer.id) return;
        asPointer.down=false; asPointer.id=null; asPointer.direction=0;
    }
    function asBind() {
        const c=asCanvas(); if(!c) return false;
        c.addEventListener("pointerdown",asPointerDown);
        c.addEventListener("pointermove",asPointerMove);
        c.addEventListener("pointerup",asPointerUp);
        c.addEventListener("pointercancel",asPointerUp);
        window.addEventListener("keydown",asKeyDown,{passive:false});
        window.addEventListener("keyup",asKeyUp);
        return true;
    }
    function asUnbind() {
        const c=asCanvas();
        if(c) {
            c.removeEventListener("pointerdown",asPointerDown);
            c.removeEventListener("pointermove",asPointerMove);
            c.removeEventListener("pointerup",asPointerUp);
            c.removeEventListener("pointercancel",asPointerUp);
        }
        window.removeEventListener("keydown",asKeyDown);
        window.removeEventListener("keyup",asKeyUp);
        asKeys=Object.create(null); asPointer.down=false; asPointer.id=null;
    }
    function asBegin() {
        if(!asActive || asState!=="intro") return;
        asState="fight"; asPatternTimer=0; asLastArenaShift=Date.now();
        asText(200,250,"ПОКАЖИ СВОЮ ВОЛЮ!","#7de1ff",90);
        asSound(420,"sine",0.35,0.12);
    }
    function asWin() {
        if(asWinPending) return;
        asWinPending=true; asState="victory"; asAttacks=[];
        asText(200,245,"НЕВОЗМОЖНО...","#ffffff",120);
        asFlash=28; asFlashColor="#ffffff"; asShake=22;
        for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*7;asParticles.push({x:asBoss.x,y:asBoss.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:45,maxLife:45,color:i%2?"#54d6ff":"#b45bff",size:2+Math.random()*5});}
        asSound(740,"sine",0.75,0.16);
        setTimeout(function(){
            if(typeof defeatedBosses!=="undefined" && Array.isArray(defeatedBosses) && !defeatedBosses.includes(1500)) defeatedBosses.push(1500);
            try { if(typeof saveAll==="function") saveAll(); } catch(e){}
            asStop();
            if(typeof currentEnemy!=="undefined" && currentEnemy) currentEnemy.hp=0;
            if(typeof victory==="function") victory();
        },1800);
    }
    function asLose() {
        if(asDefeatPending) return;
        asDefeatPending=true; asState="defeat"; asAttacks=[];
        asText(200,245,"ТЫ НЕ УСТОЯЛ ПЕРЕД СПИРАЛЬЮ","#ff5f75",110);
        asFlash=28; asFlashColor="#ff213f"; asShake=20;
        asSound(80,"sawtooth",0.7,0.18);
        setTimeout(function(){ asStop(); if(typeof defeat==="function") defeat(); },1500);
    }
    function asStop() {
        asActive=false; window.antiSpiralBossActive=false;
        if(asAnimFrame) cancelAnimationFrame(asAnimFrame);
        asAnimFrame=null; asUnbind(); stopASMusic();
        if(typeof resetAllSupers==="function"){try{resetAllSupers();}catch(e){}}
        window._uniqueSuperBossId=null;
        const overlay=document.getElementById("arenaOverlay");
        if(overlay) overlay.style.display="none";
        ["superBtn","superBtn2","superBtnDeactivate","startArenaBtn","startLivingStoneBtn","startWaystarBtn","startRogerWB","startAntiSpiralBossBtn","skipBossBtn","spareBtn"].forEach(function(id){const el=document.getElementById(id);if(el)el.style.display="none";});
        if(typeof musicEnabled!=="undefined" && musicEnabled && typeof startBattleMusic==="function") startBattleMusic();
    }
    function asDrawHeart(c) {
        c.save();c.translate(asPlayer.x,asPlayer.y);
        c.shadowColor="#33c7ff";c.shadowBlur=18;
        const g=c.createLinearGradient(-8,-10,8,9);g.addColorStop(0,"#c8f7ff");g.addColorStop(.45,"#30c5ff");g.addColorStop(1,"#0647ce");c.fillStyle=g;
        c.beginPath();c.moveTo(0,7);c.bezierCurveTo(-3,4,-10,-1,-9,-6);c.bezierCurveTo(-8,-12,-2,-12,0,-7);c.bezierCurveTo(3,-12,9,-12,9,-5);c.bezierCurveTo(9,-1,3,4,0,7);c.closePath();c.fill();
        c.strokeStyle="#e6fcff";c.lineWidth=1.1;c.stroke();c.restore();
    }
    function asDrawBoss(c,now) {
        const x=asBoss.x,y=asBoss.y,s=asBoss.size*(1+Math.sin(now/210)*.05);
        c.save();c.translate(x,y);c.rotate(asBoss.rotation);c.shadowColor="#742cff";c.shadowBlur=22;
        for(let ring=0;ring<3;ring++){
            c.save();c.rotate(now*(ring%2?-.0008:.00065)*(ring+1));c.strokeStyle=ring===1?"#45d9ff":"#9d5dff";c.lineWidth=2+ring*.6;c.beginPath();c.ellipse(0,0,s*(1.0+ring*.22),s*(.42+ring*.12),0,0,Math.PI*2);c.stroke();c.restore();
        }
        const gr=c.createRadialGradient(-s*.25,-s*.3,2,0,0,s);gr.addColorStop(0,"#f6f4ff");gr.addColorStop(.3,"#b76cff");gr.addColorStop(.65,"#4520a8");gr.addColorStop(1,"#080616");
        c.fillStyle=gr;c.beginPath();c.arc(0,0,s*.76,0,Math.PI*2);c.fill();
        c.strokeStyle="#9beaff";c.lineWidth=2;c.beginPath();c.arc(0,0,s*.84,0,Math.PI*2);c.stroke();
        c.fillStyle="#ffffff";c.globalAlpha=.8;c.beginPath();c.arc(-s*.2,-s*.16,Math.max(2,s*.08),0,Math.PI*2);c.fill();
        c.globalAlpha=1;c.restore();
    }
    function asRender(now) {
        if(!asActive) return;
        const c=asCtx(); if(!c){asAnimFrame=requestAnimationFrame(asRender);return;}
        asFrame++; asShiftArena(now);
        asArenaWidth += (asTargetWidth-asArenaWidth)*.055;
        asArenaHeight += (asTargetHeight-asArenaHeight)*.055;
        asBoss.rotation+=.009; asBoss.pulse+=.04;
        if(asBoss.flash>0)asBoss.flash--;
        if(asBossDamageFlash>0)asBossDamageFlash--;
        if(asShake>0.2)asShake*=.86;else asShake=0;
        if(asFlash>0)asFlash--;
        c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,400,500);
        c.fillStyle="#03030d";c.fillRect(0,0,400,500);
        // Cosmic star field unique to this encounter.
        for(let i=0;i<55;i++){
            const x=(i*79+Math.sin(now/1800+i)*18)%400;
            const y=(i*137+now*(.018+(i%3)*.008))%500;
            c.globalAlpha=.25+Math.abs(Math.sin(now/650+i))*.6;c.fillStyle=i%4===0?"#bb80ff":"#66dfff";
            c.fillRect(x,y,1+(i%3),1+(i%3));
        }
        c.globalAlpha=1;
        const b=asBounds();c.save();c.translate((Math.random()-.5)*asShake,(Math.random()-.5)*asShake);
        c.fillStyle="rgba(0,0,0,.9)";c.fillRect(0,50,b.left,450);c.fillRect((400+asArenaWidth)/2,50,400-(400+asArenaWidth)/2,450);
        const boxY=55+(445-asArenaHeight)/2;c.fillRect(b.left,50,asArenaWidth,boxY-50);c.fillRect(b.left,boxY+asArenaHeight,asArenaWidth,500-(boxY+asArenaHeight));
        c.strokeStyle="#3fcaff";c.lineWidth=2.5;c.shadowColor="#4bbcff";c.shadowBlur=14;c.strokeRect((400-asArenaWidth)/2,boxY,asArenaWidth,asArenaHeight);c.shadowBlur=0;
        // HUD and phase title.
        c.fillStyle="rgba(0,0,0,.78)";c.fillRect(9,8,382,32);
        c.fillStyle="#bdefff";c.font="bold 11px monospace";c.textAlign="left";c.fillText("АНТИ-СПИРАЛЬ  •  ФАЗА "+asPhase,15,20);
        c.fillStyle="#221a3e";c.fillRect(15,26,370,7);c.fillStyle=asBossDamageFlash?"#ffffff":"#a45cff";c.fillRect(15,26,370*Math.max(0,asBossHp/asBossMaxHp),7);
        c.fillStyle="rgba(0,0,0,.8)";c.fillRect(9,43,382,18);c.fillStyle="#101c46";c.fillRect(15,49,370,5);c.fillStyle="#35c9ff";c.fillRect(15,49,370*Math.max(0,asPlayerHp/asPlayerMaxHp),5);
        c.fillStyle="#ffffff";c.font="bold 9px monospace";c.fillText("HP "+Math.ceil(asPlayerHp)+"/"+asPlayerMaxHp,17,46);
        if(asState==="intro"){
            c.fillStyle="rgba(0,0,0,.78)";c.fillRect(28,190,344,126);c.strokeStyle="#49caff";c.lineWidth=2;c.strokeRect(28,190,344,126);
            c.fillStyle="#8ce9ff";c.textAlign="center";c.font="bold 16px monospace";c.fillText("АНТИ-СПИРАЛЬ",200,220);
            c.fillStyle="#ffffff";c.font="12px monospace";c.fillText("«Твоя воля исчезнет в бесконечности»",200,246);
            c.fillStyle="#b6adff";c.font="bold 11px monospace";c.fillText("КЛИК / ENTER — НАЧАТЬ",200,278);
            c.font="10px monospace";c.fillText("W / ↑ / SPACE — ПРЫЖОК • A/D — ДВИЖЕНИЕ",200,298);
        } else {
            c.fillStyle="#d8ceff";c.textAlign="center";c.font="bold 11px monospace";c.fillText(patterns[asPattern],200,77);
            asDrawBoss(c,now);
            // The pull is visual as well as physical.
            c.save();c.globalAlpha=.12+.05*Math.sin(now/180);c.strokeStyle="#50cfff";c.lineWidth=1;
            for(let i=0;i<5;i++){c.beginPath();c.arc(asBoss.x,asBoss.y,asBoss.size+18+i*19,0,Math.PI*2);c.stroke();}c.restore();
            for(let i=asAttacks.length-1;i>=0;i--){
                const a=asAttacks[i];
                if(typeof a.spd==="number")a.vx=a.spd;
                if(typeof a.spdY==="number")a.vy=a.spdY;
                a.x+=a.vx;a.y+=a.vy;a.life--;a.phase+=.1;
                c.save();c.translate(a.x,a.y);c.rotate(a.phase);c.shadowColor=a.color;c.shadowBlur=12;c.fillStyle=a.color;
                if(a.kind==="ground"){c.globalAlpha=.85;c.fillRect(-a.size,-a.size*.42,a.size*2,a.size*.84);c.strokeStyle="#e1fbff";c.strokeRect(-a.size,-a.size*.42,a.size*2,a.size*.84);}
                else {c.beginPath();c.arc(0,0,a.size*(1+Math.sin(a.phase)*.08),0,Math.PI*2);c.fill();c.strokeStyle="#f1fdff";c.lineWidth=1;c.stroke();}
                c.restore();
                const dx=asPlayer.x-a.x,dy=asPlayer.y-a.y;
                if(Math.hypot(dx,dy)<a.size+asPlayer.size*.75){asDamagePlayer(a.damage,"СИНГУЛЯРНОСТЬ");asAttacks.splice(i,1);continue;}
                if(a.life<=0||a.x<-80||a.x>480||a.y<-80||a.y>580)asAttacks.splice(i,1);
            }
            for(let i=asParticles.length-1;i>=0;i--){
                const p=asParticles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.97;p.vy*=.97;p.life--;
                c.globalAlpha=Math.max(0,p.life/p.maxLife);c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,Math.max(.1,p.size*p.life/p.maxLife),0,Math.PI*2);c.fill();
                if(p.life<=0)asParticles.splice(i,1);
            }
            c.globalAlpha=1;asDrawHeart(c);
            c.globalAlpha=1;
        }
        // Floating text, effects, and existing character super visuals.
        for(let i=asTexts.length-1;i>=0;i--){const t=asTexts[i];t.y+=t.vy;t.life--;c.globalAlpha=Math.max(0,t.life/t.maxLife);c.fillStyle=t.color;c.shadowColor=t.color;c.shadowBlur=8;c.textAlign="center";c.font="bold 12px monospace";c.fillText(t.text,t.x,t.y);if(t.life<=0)asTexts.splice(i,1);}
        c.globalAlpha=1;c.restore();
        if(asFlash>0){c.save();c.globalAlpha=asFlash/35;c.fillStyle=asFlashColor;c.fillRect(0,0,400,500);c.restore();}
        if(typeof tickSupers==="function") {try{tickSupers();}catch(e){}}
        if(typeof renderSuperVisuals==="function") {try{c.save();renderSuperVisuals();c.restore();}catch(e){}}
        if(typeof window.drawJoystick==="function"){try{window.drawJoystick();}catch(e){}}
        // Physics / input are stepped here, after rendering so the click hitbox stays aligned.
        if(asState==="fight"){
            const left=asKeys.a||asKeys.arrowleft;const right=asKeys.d||asKeys.arrowright;
            let mx=(right?1:0)-(left?1:0);
            if(asPointer.down){if(asPointer.direction)mx=asPointer.direction;else if(asPointer.x<asPlayer.x-7)mx=-1;else if(asPointer.x>asPlayer.x+7)mx=1;}
            asPlayer.x+=mx*3.5;
            const jump=(asKeys.w||asKeys.arrowup||asKeys[" "])&&asPlayer.grounded;
            if(jump){asPlayer.vy=-8.4;asPlayer.grounded=false;asText(asPlayer.x,asPlayer.y-20,"ПРЫЖОК!","#68dcff",28);}
            asPlayer.vy=Math.min(6.1,asPlayer.vy+0.31+asGravityPull);
            asPlayer.y+=asPlayer.vy;
            const bounds=asBounds();
            asPlayer.x=Math.max(bounds.left,Math.min(bounds.right,asPlayer.x));
            if(asPlayer.y>=bounds.bottom){asPlayer.y=bounds.bottom;asPlayer.vy=0;asPlayer.grounded=true;}
            if(asPlayer.y<bounds.top){asPlayer.y=bounds.top;asPlayer.vy=0;}
            // Phase escalation and arena pressure.
            const ratio=asBossHp/asBossMaxHp;
            asPhase=ratio<=.25?4:ratio<=.5?3:ratio<=.75?2:1;
            asPatternTimer++;
            if(asPatternTimer>155){asPatternTimer=0;asPattern=(asPattern+1)%4;asAttacks=[];asText(200,100,patterns[asPattern],"#b8a2ff",46);asSound(260+asPattern*75,"sine",.18,.06);}
            if((asFrame%Math.max(22,48-asPhase*5))===0)asSpawnPattern(now);
            if(asPlayer.invuln>0)asPlayer.invuln--;

        }
        asAnimFrame=requestAnimationFrame(asRender);
    }
    function startAntiSpiralBossFight() {
        if(asActive) return;
        if(Number(typeof wave!=="undefined"?wave:0)!==1500) return;
        if(typeof currentEnemy==="undefined"||!currentEnemy||currentEnemy.hp<=0) return;
        asActive=true;window.antiSpiralBossActive=true;asState="intro";asWinPending=false;asDefeatPending=false;
        asBossMaxHp=Math.max(80000,Math.floor((Number(window.playerFinalDamage)||80)*420));
        asBossHp=asBossMaxHp;asPlayerMaxHp=220;asPlayerHp=asPlayerMaxHp;
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true};
        asBoss={x:200,y:135,size:48,rotation:0,pulse:0,flash:0};
        asAttacks=[];asParticles=[];asTexts=[];asFrame=0;asPattern=0;asPatternTimer=0;
        asArenaWidth=396;asArenaHeight=438;asTargetWidth=396;asTargetHeight=438;asLastArenaShift=Date.now();
        asShake=0;asFlash=0;asBossDamageFlash=0;asPhase=1;asLastShot=0;asGravityPull=.10;
        asKeys=Object.create(null);asPointer={down:false,x:0,y:0,id:null};
        if(typeof arenaActive!=="undefined")arenaActive=false;
        if(typeof livingStoneActive!=="undefined")livingStoneActive=false;
        if(typeof waystarActive!=="undefined")waystarActive=false;
        window.rwbActive=false;
        ["superBtn","superBtn2","superBtnDeactivate","startArenaBtn","startLivingStoneBtn","startWaystarBtn","startRogerWB","startAntiSpiralBossBtn","skipBossBtn","spareBtn"].forEach(function(id){const el=document.getElementById(id);if(el)el.style.display="none";});
        if(typeof stopAllMusic==="function")stopAllMusic();
        startASMusic();
        try {
            if(typeof initSuperState==="function")initSuperState();
            window._uniqueSuperCharges=5;window._uniqueSuperBossId="antispiral";
            if(typeof updateSuperButton==="function")setTimeout(updateSuperButton,80);
        } catch(e) {}
        const overlay=document.getElementById("arenaOverlay");if(overlay)overlay.style.display="flex";
        const name=document.getElementById("arenaBossName");if(name)name.innerText="♾️ АНТИ-СПИРАЛЬ";
        const hp=document.getElementById("arenaHP");if(hp)hp.innerText=asPlayerHp;
        const timer=document.getElementById("arenaTimer");if(timer)timer.innerText="∞";
        if(!asBind()){asActive=false;window.antiSpiralBossActive=false;stopASMusic();return;}
        asAnimFrame=requestAnimationFrame(asRender);
        asText(200,345,"ГРАВИТАЦИЯ ТЯНЕТ ТЕБЯ ВНИЗ","#58d4ff",100);
    }

    window.startAntiSpiralBossFight = startAntiSpiralBossFight;
    window.stopAntiSpiralBossFight = asStop;
    window.getAntiSpiralBossActive = function(){return asActive;};
    window.getAntiSpiralBossState = function(){return asState;};
    window.getAntiSpiralBossPlayer = function(){return asPlayer;};
    window.getAntiSpiralBossAttacks = function(){return asAttacks;};
    window.getAntiSpiralBossParticles = function(){return asParticles;};
    window.getAntiSpiralBossHp = function(){return asBossHp;};
    window.getAntiSpiralBossMaxHp = function(){return asBossMaxHp;};
    window.setAntiSpiralBossHp = function(v){asBossHp=Math.max(0,Math.min(asBossHp,Number(v)||0));if(asBossHp<=0)asWin();};
    window.getAntiSpiralPlayerHp = function(){return asPlayerHp;};
    window.setAntiSpiralPlayerHp = function(v){asPlayerHp=Math.max(0,Math.min(asPlayerMaxHp,Number(v)||0));if(asPlayerHp<=0)asLose();};
    window.getAntiSpiralPlayerMaxHp = function(){return asPlayerMaxHp;};
    window.antiSpiralAddShake = function(v){asShake=Math.max(asShake||0,Number(v)||0);};
    window.antiSpiralAddFlash = function(v,color){asFlash=Math.max(asFlash||0,Number(v)||0);if(color)asFlashColor=color;};
    window.antiSpiralAddShockwave = function(x,y,color,speed,life,width){
        for(let i=0;i<16;i++){const a=i*Math.PI/8;asParticles.push({x:x,y:y,vx:Math.cos(a)*(speed||3),vy:Math.sin(a)*(speed||3),life:life||24,maxLife:life||24,color:color||"#55cfff",size:Math.max(1,width||2)});}
    };
    window.damageAntiSpiralBoss = asBossHit;
    window.antiSpiralSpawnText = asText;
    window.antiSpiralPlaySound = asSound;
    console.log("[ANTI-SPIRAL] Уникальный бой 1500-й волны загружен.");
})();