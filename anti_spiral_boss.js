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
    let asCinematicStart = 0;
    let asCinematicRedHeart = { x: -25, y: 410 };
    let asCinematicArenaProgress = 0;

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
                const loadedTrack = typeof window.getLoadedMusic === "function"
                    ? window.getLoadedMusic("antispiral")
                    : null;
                asMusic = new Audio(loadedTrack && loadedTrack.url
                    ? loadedTrack.url
                    : "music/анти спираль.mp3");
                asMusic.loop = true;
                asMusic.volume = 0.42;
                asMusic.preload = "auto";
            }
            asMusic.currentTime = 0;
            asMusic.play().catch(function(){});
        } catch(e) {}
    }
    function stopASMusic() {
        try { if (asMusic) { asMusic.pause(); asMusic.currentTime = 0; } } catch(e) {}
    }
    function asBossHit(damage, message) {
        if (!asActive || asWinPending || asDefeatPending || asState !== "fight" || asState === "victory") return;
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
        if (!asActive || asPlayer.invuln > 0 || asState !== "fight" || asState === "victory" || asDefeatPending) return;
        const amount = Math.max(1, Math.floor(Number(damage) || 1));
        asPlayerHp = Math.max(0, asPlayerHp - amount);
        const hpEl=document.getElementById("arenaHP"); if(hpEl)hpEl.innerText=Math.ceil(asPlayerHp);
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
        if (k==="escape" && asState==="intro") { asStop(); asRestoreStartButton(); }
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
            asBossHit(Math.max(50, Math.floor((Number(window.playerFinalDamage)||80)*1.0)), "ПОПАДАНИЕ");
            return;
        }
        // Touch below the boss can trigger a jump; a held drag steers the soul.
        if (y>430 && x>150 && x<250 && asPlayer.grounded) {
            asPlayer.vy=-8.4; asPlayer.grounded=false;
            asText(asPlayer.x,asPlayer.y-20,"ПРЫЖОК!","#68dcff",28);
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
        if(!asActive || asState==="fight") return;
        asState="fight"; asPatternTimer=0; asLastArenaShift=Date.now();
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true};
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
        setTimeout(function(){
            asStop();
            if(typeof defeat==="function") defeat();
            if(typeof playerHp!=="undefined" && playerHp>0) asRestoreStartButton();
        },1500);
    }
    function asRestoreStartButton() {
        if (Number(typeof wave!=="undefined"?wave:0)!==1500 || !currentEnemy || currentEnemy.hp<=0) return;
        if (typeof defeatedBosses!=="undefined" && Array.isArray(defeatedBosses) && defeatedBosses.includes(1500)) return;
        const btn=document.getElementById("startAntiSpiralBossBtn");
        if(btn)btn.style.display="block";
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
    // The Anti-Spiral's canonical look: a living-black humanoid silhouette,
    // chalk-white spiral eyes and a small white mouth — not a generic energy orb.
    function asDrawSpiralEye(c, x, y, r, now, reverse) {
        c.save();
        c.strokeStyle="#f5f2ff"; c.lineWidth=Math.max(1,1.65*r/10);
        c.lineCap="round"; c.lineJoin="round";
        c.beginPath(); c.ellipse(x,y,r,r*0.9,Math.sin(now/900)*0.08,0,Math.PI*2); c.stroke();
        c.beginPath();
        for(let n=0;n<52;n++){
            const q=n/51, a=(reverse?-1:1)*q*Math.PI*5.4+now*0.00025;
            const rr=(0.08+q*0.82)*r;
            const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr*0.88;
            if(n===0)c.moveTo(px,py);else c.lineTo(px,py);
        }
        c.stroke();
        c.restore();
    }
    function asDrawAntiSpiralFigure(c, x, y, scale, now, opacity) {
        const bob=Math.sin(now/360)*2.2;
        c.save(); c.translate(x,y+bob); c.scale(scale,scale); c.globalAlpha=opacity===undefined?1:opacity;
        c.shadowColor="#a855ff"; c.shadowBlur=16;
        // Long, unnaturally thin limbs and a narrow torso form one black silhouette.
        c.fillStyle="#030207"; c.strokeStyle="#eeeaff"; c.lineWidth=1.6;
        c.lineJoin="round"; c.lineCap="round";
        // Back tendril / cape shadow.
        c.beginPath(); c.moveTo(-13,-25);c.lineTo(-31,-3);c.lineTo(-40,29);c.lineTo(-29,18);c.lineTo(-22,4);c.lineTo(-16,23);c.closePath();c.fill();
        // Legs, posed as if hovering in space.
        c.beginPath();c.moveTo(-13,33);c.lineTo(-4,36);c.lineTo(-8,57);c.lineTo(-21,78);c.lineTo(-27,76);c.lineTo(-17,53);c.closePath();c.fill();c.stroke();
        c.beginPath();c.moveTo(6,34);c.lineTo(15,31);c.lineTo(21,51);c.lineTo(34,68);c.lineTo(28,75);c.lineTo(12,57);c.lineTo(4,43);c.closePath();c.fill();c.stroke();
        // Torso and shoulders.
        c.beginPath();c.moveTo(-13,-18);c.lineTo(-25,-13);c.lineTo(-30,1);c.lineTo(-18,10);
        c.lineTo(-15,28);c.lineTo(-19,38);c.lineTo(-10,43);c.lineTo(10,43);c.lineTo(18,35);
        c.lineTo(14,17);c.lineTo(25,3);c.lineTo(19,-13);c.lineTo(10,-19);c.closePath();c.fill();c.stroke();
        // Left arm hangs like a thin shadow.
        c.beginPath();c.moveTo(-23,-12);c.lineTo(-32,-2);c.lineTo(-35,19);c.lineTo(-30,23);
        c.lineTo(-25,6);c.lineTo(-15,-1);c.closePath();c.fill();c.stroke();
        // Right arm extended, the gesture that reflects the hero's shots.
        const gesture=(now%6000>3600&&now%6000<5200)?-9*Math.sin((now%6000-3600)/1600*Math.PI):0;
        c.beginPath();c.moveTo(18,-13);c.lineTo(28,-7);c.lineTo(39,-18+gesture);c.lineTo(47,-27+gesture);
        c.lineTo(50,-23+gesture);c.lineTo(42,-10+gesture);c.lineTo(29,4);c.lineTo(15,4);c.closePath();c.fill();c.stroke();
        // White, hand-scratched contour strokes on a black body.
        c.shadowBlur=0;c.strokeStyle="#f7f4ff";c.lineWidth=.8;c.globalAlpha*=.85;
        const scratches=[
            [-22,-10,-16,-5,-18,4],[-15,9,-9,16,-12,27],[-8,34,-2,29,4,34],
            [9,-11,15,-2,11,8],[18,-8,24,-4,29,-7],[-31,2,-27,8,-30,15],
            [-15,48,-20,57,-23,69],[12,44,17,52,25,62],[-2,-19,0,-13,3,-18]
        ];
        scratches.forEach(function(p){c.beginPath();c.moveTo(p[0],p[1]);c.quadraticCurveTo(p[2],p[3],p[4],p[5]);c.stroke();});
        // Head: smooth, nearly featureless black oval with sketched white face.
        c.globalAlpha=opacity===undefined?1:opacity;
        c.fillStyle="#020105";c.strokeStyle="#f5f2ff";c.lineWidth=1.9;
        c.beginPath();c.moveTo(-17,-30);c.quadraticCurveTo(-22,-58,-7,-67);c.quadraticCurveTo(2,-73,13,-63);
        c.quadraticCurveTo(23,-50,16,-30);c.quadraticCurveTo(1,-20,-17,-30);c.closePath();c.fill();c.stroke();
        // Tiny white etched marks at the brow and jaw keep the face uncanny.
        c.strokeStyle="#e9e5f2";c.lineWidth=.7;c.beginPath();c.moveTo(-12,-49);c.lineTo(-7,-51);c.moveTo(7,-51);c.lineTo(12,-49);c.stroke();
        asDrawSpiralEye(c,-8,-45,5.4,now,false);asDrawSpiralEye(c,8,-45,5.4,now,true);
        c.fillStyle="#f9f7ff";c.beginPath();c.moveTo(-3,-34);c.lineTo(4,-34);c.lineTo(0,-28);c.closePath();c.fill();
        // A few shifting marks in the torso imply a pattern that never settles.
        c.globalAlpha=.5;c.strokeStyle="#9b77c8";c.lineWidth=.65;
        c.beginPath();c.moveTo(-5,1);c.lineTo(2,9);c.lineTo(-2,19);c.moveTo(5,18);c.lineTo(10,10);c.stroke();
        c.restore();
        // Purple-black reality distortion follows the figure without turning it into an orb.
        c.save();c.globalAlpha=.1+.04*Math.sin(now/170);c.strokeStyle="#a04dff";c.lineWidth=1.4;c.shadowColor="#a04dff";c.shadowBlur=10;
        for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y-6,48*scale+i*13*scale,74*scale+i*11*scale,now*.0002*(i%2?1:-1),0,Math.PI*2);c.stroke();}
        c.restore();
    }
    function asDrawBoss(c,now) {
        // Keep the boss near the top of the arena; the model remains humanoid even during combat.
        asDrawAntiSpiralFigure(c,asBoss.x,asBoss.y+43,0.78*(asBoss.size/48),now,1);
    }
    function asDrawRedHeart(c,x,y,now,shot) {
        c.save();c.translate(x,y);c.shadowColor="#ff233f";c.shadowBlur=shot?22:13;
        c.rotate(Math.sin(now/130)*.12);
        c.fillStyle=shot?"#ff4a52":"#ff203d";
        c.beginPath();c.moveTo(0,8);c.bezierCurveTo(-4,5,-12,-2,-11,-8);c.bezierCurveTo(-10,-16,-2,-15,0,-8);
        c.bezierCurveTo(3,-16,11,-15,11,-7);c.bezierCurveTo(11,-2,4,5,0,8);c.closePath();c.fill();
        c.strokeStyle="#ffdce4";c.lineWidth=1.25;c.stroke();
        c.restore();
    }
    function asDrawGalaxyBackdrop(c,now) {
        c.save();
        const nebula=c.createRadialGradient(265,205,4,265,205,270);
        nebula.addColorStop(0,"rgba(94,45,170,.45)");nebula.addColorStop(.42,"rgba(38,30,112,.26)");nebula.addColorStop(1,"rgba(0,0,0,0)");
        c.fillStyle=nebula;c.fillRect(0,45,400,455);
        c.save();c.translate(255,222);c.rotate(now*.00007);c.strokeStyle="rgba(156,104,255,.48)";c.lineWidth=1.5;
        for(let i=0;i<5;i++){c.beginPath();c.ellipse(0,0,32+i*15,9+i*7,.6+i*.22,0,Math.PI*1.65);c.stroke();}
        c.restore();
        // Moving planets to establish that the heart is travelling through space.
        [[47,139,19,"#4053aa"],[344,113,9,"#8e4ec1"],[313,371,25,"#28285c"],[87,330,7,"#7a3eaf"]].forEach(function(p,i){
            const x=p[0]+Math.sin(now*.00015+i)*9,y=p[1]+Math.cos(now*.00013+i)*5;
            const g=c.createRadialGradient(x-p[2]*.3,y-p[2]*.35,1,x,y,p[2]);g.addColorStop(0,"#bdb7ff");g.addColorStop(.3,p[3]);g.addColorStop(1,"#070713");
            c.fillStyle=g;c.beginPath();c.arc(x,y,p[2],0,Math.PI*2);c.fill();
            c.strokeStyle="rgba(200,190,255,.35)";c.lineWidth=.8;c.beginPath();c.ellipse(x,y,p[2]*1.4,p[2]*.38,-.3,0,Math.PI*2);c.stroke();
        });
        c.restore();
    }
    function asDrawSpeech(c, speaker, text, y, color, now) {
        const words=text.split(/\s+/);const lines=[];let line="";
        words.forEach(function(word){if(line&&(line+" "+word).length>31){lines.push(line);line=word;}else line+=(line?" ":"")+word;});
        if(line)lines.push(line);
        if(lines.length>2){lines[1]=lines.slice(1).join(" ");lines.length=2;}
        const boxH=lines.length>1?54:39;
        const isHero=speaker==="СЕРДЦЕ";
        const x=isHero?12:100,w=isHero?250:288;
        c.save();c.fillStyle="rgba(2,2,10,.91)";c.strokeStyle=color||"#ffffff";c.lineWidth=1.5;
        c.beginPath();c.roundRect(x,y,w,boxH,6);c.fill();c.stroke();
        c.fillStyle=color||"#ffffff";c.textAlign="left";c.font="bold 10px monospace";c.fillText(speaker,x+10,y+13);
        c.fillStyle="#ffffff";c.font="11px monospace";
        if(lines.length>1){c.fillText(lines[0],x+10,y+29);c.fillText(lines[1],x+10,y+43);}
        else c.fillText(lines[0],x+10,y+27);
        c.restore();
    }
    function asRenderCinematic(c,now) {
        const t=Math.max(0,(now-asCinematicStart)/1000);
        asDrawGalaxyBackdrop(c,now);
        // Fast star streaks sell the initial flight through a deep-space panorama.
        c.save();c.globalAlpha=Math.max(0,Math.min(.65,(3.2-t)*.22));
        for(let i=0;i<36;i++){const x=(i*67+now*.09)%470-35,y=(i*113+now*.025)%500;c.strokeStyle=i%3?"#83bfff":"#e9ceff";c.lineWidth=i%5===0?1.6:.7;c.beginPath();c.moveTo(x,y);c.lineTo(x-10,y+17);c.stroke();}
        c.restore();
        // The red soul travels from the edge of the universe toward the strange figure.
        const fly=Math.min(1,t/3.1),ease=1-Math.pow(1-fly,3);
        let hx=-18+ease*117,hy=412-ease*205+Math.sin(now/170)*5;
        if(t>=3.2&&t<11.9){hx=104+Math.sin(now/280)*3;hy=208+Math.sin(now/210)*3;}
        if(t>=11.9&&t<15.45){hx=105;hy=208;}
        if(t>=15.45){const fall=Math.max(0,Math.min(1,(t-15.45)/2.35));hx=105+fall*91;hy=208+fall*310*fall;}
        asCinematicRedHeart={x:hx,y:hy};
        // The Anti-Spiral materializes without an orb or armor shell: a chalk-eyed living shadow.
        let emerge=Math.max(0,Math.min(1,(t-2.3)/1.1));
        const bossX=285,bossY=223;
        if(emerge>0)asDrawAntiSpiralFigure(c,bossX,bossY,1.7*emerge,now,Math.min(1,emerge*1.4));
        // The three shots rush forward, strike an invisible wall, and return toward the soul.
        if(t>=11.9&&t<14.8){
            for(let i=0;i<3;i++){
                const st=t-(12.05+i*.28);
                if(st<0||st>2.25)continue;
                let sx,sy,back=0;
                if(st<.62){sx=hx+16+st*190;sy=hy-8+i*7+Math.sin(st*14+i)*4;}
                else {back=Math.min(1,(st-.62)/1.05);sx=hx+16+118*(1-back);sy=hy-8+i*7+back*34;}
                c.save();c.globalAlpha=st<.62?1:Math.max(0,1-back*.55);c.strokeStyle="#ff354b";c.lineWidth=3;c.shadowColor="#ff173d";c.shadowBlur=15;
                c.beginPath();c.moveTo(sx-24,sy-4);c.lineTo(sx+2,sy+1);c.stroke();c.restore();
                c.save();c.translate(sx,sy);c.rotate(st*5);c.fillStyle="#ff263f";c.shadowColor="#ff2d48";c.shadowBlur=17;
                c.beginPath();c.moveTo(0,-7);c.lineTo(7,0);c.lineTo(0,7);c.lineTo(-7,0);c.closePath();c.fill();c.restore();
            }
            // A thin reality plane catches the shots; the Anti-Spiral does not move.
            c.save();c.globalAlpha=.35+.18*Math.sin(now/42);c.strokeStyle="#c99aff";c.lineWidth=2;c.shadowColor="#ba59ff";c.shadowBlur=24;
            c.beginPath();c.moveTo(224,105);c.lineTo(224,337);c.stroke();
            for(let i=0;i<4;i++){c.beginPath();c.moveTo(211+i*6,155);c.lineTo(238-i*4,180+i*20);c.stroke();}
            c.restore();
        }
        // Build the pocket arena underneath the soul, using expanding dimensional lines.
        const arena=Math.max(0,Math.min(1,(t-14.55)/1.15));
        asCinematicArenaProgress=arena;
        if(arena>0){
            const w=30+arena*390,h=18+arena*345,top=278+arena*35;
            c.save();c.globalAlpha=arena;c.strokeStyle="#7adfff";c.lineWidth=2;c.shadowColor="#7d3dff";c.shadowBlur=23;
            c.fillStyle="rgba(34,13,77,.24)";c.fillRect((400-w)/2,top,w,h);c.strokeRect((400-w)/2,top,w,h);
            for(let i=0;i<7;i++){const xx=(400-w)/2+w*i/6;c.beginPath();c.moveTo(xx,top);c.lineTo(200+(xx-200)*.43,top-44*arena);c.stroke();}
            for(let i=0;i<4;i++){const yy=top+h*i/3;c.globalAlpha=arena*(.45+i*.12);c.beginPath();c.moveTo((400-w)/2,yy);c.lineTo((400+w)/2,yy);c.stroke();}
            c.restore();
            // A black hole opens underneath; the red heart drops through it.
            c.save();c.globalAlpha=arena*.8;const hole=c.createRadialGradient(200,top+8,2,200,top+8,84);hole.addColorStop(0,"#000000");hole.addColorStop(.5,"rgba(14,5,35,.9)");hole.addColorStop(1,"rgba(151,62,255,0)");
            c.fillStyle=hole;c.beginPath();c.ellipse(200,top+7,80*arena,14*arena,0,0,Math.PI*2);c.fill();c.restore();
        }
        // Caption/subtitle timing creates a silent, playable-looking anime cutscene.
        if(t<2.55){
            c.save();c.fillStyle="rgba(0,0,0,.48)";c.fillRect(13,430,374,28);c.fillStyle="#d8c8ff";c.font="bold 11px monospace";c.textAlign="center";c.fillText("ГДЕ-ТО ЗА ПРЕДЕЛАМИ ИЗВЕСТНОЙ ВСЕЛЕННОЙ...",200,448);c.restore();
        } else if(t>=4.0&&t<5.55) asDrawSpeech(c,"СЕРДЦЕ","Кто ты?",72,"#ff5268",now);
        else if(t>=5.55&&t<7.0) asDrawSpeech(c,"АНТИ-СПИРАЛЬ","Это не имеет значения.",72,"#d4c4ff",now);
        else if(t>=7.0&&t<9.35) asDrawSpeech(c,"АНТИ-СПИРАЛЬ","Главное — чтобы спиральная сила не вырвалась наружу.",72,"#d4c4ff",now);
        else if(t>=9.35&&t<11.0) asDrawSpeech(c,"СЕРДЦЕ","Использовать анти-спиральную силу — плохо!",72,"#ff5268",now);
        else if(t>=11.0&&t<12.05) asDrawSpeech(c,"СЕРДЦЕ","Я не позволю тебе решать за всех!",72,"#ff5268",now);
        else if(t>=12.05&&t<13.55) asDrawSpeech(c,"СЕРДЦЕ","Тогда попробуй остановить меня!",72,"#ff5268",now);
        else if(t>=13.55&&t<14.75) asDrawSpeech(c,"АНТИ-СПИРАЛЬ","Бесполезно.",72,"#d4c4ff",now);
        else if(t>=16.65&&t<18.15) asDrawSpeech(c,"АНТИ-СПИРАЛЬ","Тебе конец.",72,"#d4c4ff",now);
        if(t>=10.7&&t<14.6){
            // Muzzle flare on the red soul before each outgoing projectile.
            c.save();c.globalAlpha=.65+.25*Math.sin(now/28);c.fillStyle="#ff223f";c.shadowColor="#ff173d";c.shadowBlur=20;
            c.beginPath();c.arc(hx+13,hy,4+Math.sin(now/26)*2,0,Math.PI*2);c.fill();c.restore();
        }
        asDrawRedHeart(c,hx,hy,now,t>=10.7&&t<14.6);
        // During the fall, the camera dips while the Anti-Spiral watches from above.
        if(t>=15.45&&t<18.15){
            c.save();c.globalAlpha=Math.min(1,(t-15.45)*2);c.fillStyle="#e7d9ff";c.font="bold 10px monospace";c.textAlign="center";c.fillText("АНТИ-СПИРАЛЬ СОЗДАЛ КАРМАННУЮ ВСЕЛЕННУЮ",200,93);c.restore();
            asDrawAntiSpiralFigure(c,285,196,1.15,now,.95);
        }
        if(t>=18.15){
            asState="fight";
            asBoss={x:200,y:100,size:48,rotation:0,pulse:0,flash:0};
            asArenaWidth=396;asArenaHeight=438;asTargetWidth=396;asTargetHeight=438;
            asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true};
            asPattern=0;asPatternTimer=0;asLastArenaShift=now;
            asText(200,250,"ТЕБЕ КОНЕЦ!","#74e4ff",85);
            asSound(150,"sawtooth",.45,.14);
            if(typeof updateSuperButton==="function")setTimeout(updateSuperButton,80);
        }
    }
    function asRender(now) {
        if(!asActive) return;
        const c=asCtx(); if(!c){asAnimFrame=requestAnimationFrame(asRender);return;}
        asFrame++; if(asState==="fight") asShiftArena(now);
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
        if(asState==="cinematic"){
            asRenderCinematic(c,now);
            c.restore();
            asAnimFrame=requestAnimationFrame(asRender);
            return;
        }
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
        {
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
        if(asState==="fight"){
            if(typeof tickSupers==="function") {try{tickSupers();}catch(e){}}
            if(typeof renderSuperVisuals==="function") {try{c.save();renderSuperVisuals();c.restore();}catch(e){}}
            if(typeof window.drawJoystick==="function"){try{window.drawJoystick();}catch(e){}}
        }
        // Physics / input are stepped here, after rendering so the click hitbox stays aligned.
        if(asState==="fight"){
            const left=asKeys.a||asKeys.arrowleft;const right=asKeys.d||asKeys.arrowright;
            let mx=(right?1:0)-(left?1:0);
            const joy=window._joystick;
            if(joy && joy.enabled && joy.active && (joy.enabled || joy.mobileDpadActive)) {
                mx=Number(joy.vectorX)||0;
            } else if(asPointer.down) {
                if(asPointer.direction)mx=asPointer.direction;
                else if(asPointer.x<asPlayer.x-7)mx=-1;
                else if(asPointer.x>asPlayer.x+7)mx=1;
            }
            asPlayer.x+=mx*3.5;
            const joyJump=!!(joy && joy.enabled && joy.active && (Number(joy.vectorY)||0)<-0.62);
            const jump=(asKeys.w||asKeys.arrowup||asKeys[" "]||joyJump)&&asPlayer.grounded;
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
        asActive=true;window.antiSpiralBossActive=true;asState="cinematic";asWinPending=false;asDefeatPending=false;
        asCinematicStart=performance.now();asCinematicRedHeart={x:-25,y:410};asCinematicArenaProgress=0;
        asBossMaxHp=Math.max(40000,Math.floor((Number(window.playerFinalDamage)||80)*120));
        asBossHp=asBossMaxHp;asPlayerMaxHp=220;asPlayerHp=asPlayerMaxHp;
        asPlayer={x:200,y:asFloor(),vx:0,vy:0,size:12,invuln:0,grounded:true};
        asBoss={x:285,y:180,size:48,rotation:0,pulse:0,flash:0};
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
            // Super controls stay hidden until the cinematic ends.
        } catch(e) {}
        const overlay=document.getElementById("arenaOverlay");if(overlay)overlay.style.display="flex";
        const name=document.getElementById("arenaBossName");if(name)name.innerText="♾️ АНТИ-СПИРАЛЬ";
        const hp=document.getElementById("arenaHP");if(hp)hp.innerText=asPlayerHp;
        const timer=document.getElementById("arenaTimer");if(timer)timer.innerText="∞";
        if(!asBind()){asActive=false;window.antiSpiralBossActive=false;stopASMusic();return;}
        asAnimFrame=requestAnimationFrame(asRender);
        // The cinematic plays automatically; the player only gains control after the final fall.
    }

    window.startAntiSpiralBossFight = startAntiSpiralBossFight;
    window.stopAntiSpiralBossFight = asStop;
    window.getAntiSpiralBossActive = function(){return asActive;};
    window.getAntiSpiralBossState = function(){return asState;};
    window.getAntiSpiralBossPlayer = function(){return asPlayer;};
    window.getAntiSpiralBossTarget = function(){return asBoss;};
    window.getAntiSpiralBossAttacks = function(){return asAttacks;};
    window.getAntiSpiralBossParticles = function(){return asParticles;};
    window.getAntiSpiralBossHp = function(){return asBossHp;};
    window.getAntiSpiralBossMaxHp = function(){return asBossMaxHp;};
    window.setAntiSpiralBossHp = function(v){asBossHp=Math.max(0,Math.min(asBossHp,Number(v)||0));if(asBossHp<=0)asWin();};
    window.getAntiSpiralPlayerHp = function(){return asPlayerHp;};
    window.setAntiSpiralPlayerHp = function(v){asPlayerHp=Math.max(0,Math.min(asPlayerMaxHp,Number(v)||0));const hpEl=document.getElementById("arenaHP");if(hpEl)hpEl.innerText=Math.ceil(asPlayerHp);if(asPlayerHp<=0)asLose();};
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