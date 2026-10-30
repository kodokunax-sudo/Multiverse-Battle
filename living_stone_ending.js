/* Living Stone: 2D chase before phase two. Runs inside the original arena. */
(function () {
    "use strict";
    var active = false, startedAt = 0, lastAt = 0, elapsed = 0, frame = 0;
    var rocks = [], warnings = [], waves = [], bossTrail = [], playerTrail = [];
    var nextVolley = 900, nextWarning = 2600, nextDebris = 1700;
    var starAid = false, starGuard = false, nextGuard = 0, nextStrike = 4500;
    var starFlash = 0, damageFlash = 0, callback = null, music = null, retryBound = false;
    var reduced = false, lastX = 200, lastY = 400, lastHud = -1;
    var DURATION = 40000;

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function clock() { return typeof performance !== "undefined" ? performance.now() : Date.now(); }
    function debt() {
        try {
            return window.waystarOwesDebt === true ||
                (typeof slotData !== "undefined" && slotData && slotData.waystarOwesDebt === true);
        } catch (e) { return false; }
    }
    function message(txt, color) {
        if (typeof spawnLivingStoneText === "function") spawnLivingStoneText(200, 300, txt, color, 100);
    }
    function stopMusic() {
        if (!music) return;
        try { music.pause(); music.currentTime = 0; } catch (e) {}
        music = null;
    }
    function startMusic() {
        stopMusic();
        try { if (typeof stopAllMusic === "function") stopAllMusic(); } catch (e) {}
        try {
            music = new Audio("music/помощь звезды.mp3");
            music.loop = true;
            music.volume = 0.76;
            var p = music.play();
            if (p && p.catch) p.catch(function () {
                if (retryBound) return;
                retryBound = true;
                var retry = function () {
                    if (music) { try { var r = music.play(); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
                    window.removeEventListener("pointerdown", retry, true);
                    window.removeEventListener("keydown", retry, true);
                    retryBound = false;
                };
                window.addEventListener("pointerdown", retry, true);
                window.addEventListener("keydown", retry, true);
            });
        } catch (e) { music = null; }
    }
    function resetArrays() {
        rocks.length = 0; warnings.length = 0; waves.length = 0;
        bossTrail.length = 0; playerTrail.length = 0;
    }
    function start(options) {
        if (active) return true;
        options = options || {};
        if (typeof livingStoneActive === "undefined" || !livingStoneActive ||
            (typeof window !== "undefined" && (window.livingStoneSuperActive || window.__mbBossTestMode))) return false;

        starAid = debt();
        callback = typeof options.onComplete === "function" ? options.onComplete : null;
        reduced = !!(window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects());
        startedAt = clock(); lastAt = startedAt; elapsed = 0; frame = 0;
        nextVolley = 900; nextWarning = 2600; nextDebris = 1700;
        starGuard = starAid; nextGuard = 6800; nextStrike = 4500;
        starFlash = 0; damageFlash = 0; lastHud = -1;
        lastX = livingStonePlayer.x; lastY = livingStonePlayer.y;
        resetArrays();

        livingStoneState = "chase";
        finalSceneActive = false;
        qteActive = false; qteCinematicActive = false;
        qteBullets = []; qtePunches = []; qtePlayerTrail = [];
        livingStoneAttacks = []; livingStoneBullets = []; chainExplosionsQueue = [];
        lsModCapsules = []; lsActiveMod = null;
        livingStonePlayer.x = clamp(livingStonePlayer.x, 35, 365);
        livingStonePlayer.y = clamp(livingStonePlayer.y, 230, 470);
        livingStoneBoss.x = 200; livingStoneBoss.y = 102;
        livingStoneBoss.vx = 0; livingStoneBoss.rotation = 0;
        window.__mbLivingStoneChaseActive = true;
        window.__mbLivingStoneChaseStarAid = starAid;

        if (typeof stopQTEMusic === "function") { try { stopQTEMusic(); } catch (e) {} }
        if (starAid) {
            startMusic();
            message("ПУТЕВОДНАЯ ЗВЕЗДА: ДЕРЖИСЬ! Я ПОМОГУ ТЕБЕ!", "#ffe28a");
        } else {
            try { if (typeof startBattleMusic === "function") startBattleMusic(); } catch (e) {}
            message("ЖИВОЙ КАМЕНЬ: НЕ УЙДЁШЬ ОТ МЕНЯ!", "#ff9a72");
        }
        var name = document.getElementById("arenaBossName");
        if (name) name.textContent = starAid ? "ЖИВОЙ КАМЕНЬ • ПОГОНЯ СО ЗВЕЗДОЙ" : "ЖИВОЙ КАМЕНЬ • ПОГОНЯ";
        var timer = document.getElementById("arenaTimer");
        if (timer) timer.textContent = "00:40";
        console.log("[LS CHASE] started; waystar aid:", starAid);
        return true;
    }
    function spawnVolley() {
        var bx = livingStoneBoss.x, by = livingStoneBoss.y + 18;
        var angle = Math.atan2(livingStonePlayer.y - by, livingStonePlayer.x - bx);
        var speed = 3.0 + Math.min(1.3, elapsed / 17000);
        for (var i = -1; i <= 1; i++) {
            var a = angle + i * 0.23;
            rocks.push({x:bx, y:by, vx:Math.cos(a)*speed, vy:Math.sin(a)*speed,
                r:10+Math.random()*5, rot:Math.random()*6, spin:(Math.random()-.5)*.16,
                life:175, damage:7});
        }
    }
    function spawnWarning() {
        warnings.push({
            x:clamp(livingStonePlayer.x+(Math.random()-.5)*120,30,370),
            y:clamp(livingStonePlayer.y+(Math.random()-.5)*110,165,460),
            life:42, max:42, r:18
        });
    }
    function spawnDebris() {
        var sx = clamp(livingStonePlayer.x+(Math.random()-.5)*180,20,380);
        var tx = clamp(livingStonePlayer.x+(Math.random()-.5)*90,20,380);
        var flight = 38+Math.random()*18;
        rocks.push({x:sx,y:65,vx:(tx-sx)/flight,vy:5+Math.random()*1.6,
            r:12+Math.random()*8,rot:Math.random()*6,spin:(Math.random()-.5)*.14,
            life:100,damage:8});
    }
    function hitPlayer(dmg, x, y) {
        if (livingStoneInvulnTimer > 0) return;
        if (starAid && starGuard) {
            starGuard = false; nextGuard = elapsed+7000; starFlash = 30;
            if (typeof spawnLivingStoneParticles === "function") spawnLivingStoneParticles(livingStonePlayer.x,livingStonePlayer.y,22,"#ffd66b",5);
            message("ПУТЕВОДНАЯ ЗВЕЗДА ЗАКРЫЛА ТЕБЯ!", "#ffe28a");
            if (typeof playArenaSound === "function") playArenaSound(900,"sine",.16,.1);
            return;
        }
        if (typeof damageLivingStonePlayer === "function") damageLivingStonePlayer(dmg || 7);
        damageFlash = 12;
        if (typeof spawnLivingStoneParticles === "function") spawnLivingStoneParticles(x,y,8,"#ff734f",3);
    }
    function update(now) {
        if (!active) return;
        if (!livingStoneActive) { stop(false); return; }
        now = Number(now) || clock();
        elapsed = clamp(now-startedAt,0,DURATION);
        var dt = clamp((now-lastAt)/(1000/60),.25,3);
        lastAt = now; frame += dt;

        // Босс удирает по плоскости арены, а фон родной игры прокручивается под игроком.
        var oldX = livingStoneBoss.x;
        var dashCycle = elapsed % 6100;
        var dash = dashCycle < 620;
        livingStoneBoss.x = clamp(200+Math.sin(elapsed*.00145)*116+Math.sin(elapsed*.00047)*26+
            (dash ? Math.sin(dashCycle/620*Math.PI*2)*38 : 0),52,348);
        livingStoneBoss.y = 94+Math.sin(elapsed*.0021)*17-Math.min(24,elapsed/1800);
        livingStoneBoss.vx = livingStoneBoss.x-oldX;
        livingStoneBoss.rotation += (dash?.055:.018)*dt;
        if (frame % 2 < dt) bossTrail.push({x:livingStoneBoss.x,y:livingStoneBoss.y,life:18,max:18});
        for (var bt=bossTrail.length-1;bt>=0;bt--) {
            bossTrail[bt].life -= dt;
            if (bossTrail[bt].life<=0) bossTrail.splice(bt,1);
        }

        if (elapsed>=nextVolley) { spawnVolley(); nextVolley += 1700+Math.random()*350; }
        if (elapsed>=nextWarning) { spawnWarning(); nextWarning += 2550+Math.random()*500; }
        if (elapsed>=nextDebris) { spawnDebris(); nextDebris += 1200+Math.random()*450; }

        for (var wi=warnings.length-1;wi>=0;wi--) {
            var w=warnings[wi]; w.life-=dt; w.r=18+(1-w.life/w.max)*18;
            if (w.life<=0) {
                waves.push({x:w.x,y:w.y,r:5,old:5,speed:4.2,width:15,life:52,hit:false,damage:9});
                warnings.splice(wi,1);
            }
        }

        var p=livingStonePlayer;
        if (Math.hypot(p.x-lastX,p.y-lastY)>.3) playerTrail.push({x:lastX,y:lastY,life:12,max:12});
        lastX=p.x; lastY=p.y;
        for (var pt=playerTrail.length-1;pt>=0;pt--) {
            playerTrail[pt].life-=dt;
            if (playerTrail[pt].life<=0) playerTrail.splice(pt,1);
        }

        for (var ri=rocks.length-1;ri>=0;ri--) {
            var rock=rocks[ri];
            rock.x+=rock.vx*dt; rock.y+=rock.vy*dt; rock.rot+=rock.spin*dt; rock.life-=dt;
            if (rock.life>0 && Math.hypot(p.x-rock.x,p.y-rock.y)<rock.r+13) {
                hitPlayer(rock.damage,rock.x,rock.y); rock.life=0;
            }
            if (rock.life<=0 || rock.x<-50 || rock.x>450 || rock.y<35 || rock.y>560) rocks.splice(ri,1);
        }
        for (var wi2=waves.length-1;wi2>=0;wi2--) {
            var wave=waves[wi2]; wave.old=wave.r; wave.r+=wave.speed*dt; wave.life-=dt;
            var dist=Math.hypot(p.x-wave.x,p.y-wave.y);
            if (!wave.hit && dist>=wave.old-wave.width && dist<=wave.r+wave.width) {
                wave.hit=true; hitPlayer(wave.damage,p.x,p.y);
            }
            if (wave.life<=0) waves.splice(wi2,1);
        }

        if (starAid) {
            if (elapsed>=nextGuard) { starGuard=true; nextGuard=elapsed+7000; }
            if (elapsed>=nextStrike) {
                nextStrike+=7600; starFlash=28;
                if (typeof spawnLivingStoneParticles==="function") spawnLivingStoneParticles(livingStoneBoss.x,livingStoneBoss.y,16,"#ffd66b",4);
                if (typeof playArenaSound==="function") playArenaSound(1050,"sine",.18,.08);
            }
        }
        if (starFlash>0) starFlash=Math.max(0,starFlash-dt);
        if (damageFlash>0) damageFlash=Math.max(0,damageFlash-dt);

        var remain=Math.max(0,Math.ceil((DURATION-elapsed)/1000));
        if (remain!==lastHud) {
            lastHud=remain;
            var timer=document.getElementById("arenaTimer");
            if (timer) timer.textContent="00:"+String(remain).padStart(2,"0");
        }
        if (elapsed>=DURATION) finish();
    }
    function drawRock(c, r) {
        c.save(); c.translate(r.x,r.y); c.rotate(r.rot);
        var s=r.r;
        c.fillStyle="#80664f"; c.strokeStyle="#c5a17c"; c.lineWidth=2;
        c.shadowColor="#24160f"; c.shadowBlur=reduced?0:7;
        c.beginPath(); c.moveTo(-s,-s*.35); c.lineTo(-s*.35,-s);
        c.lineTo(s*.62,-s*.75); c.lineTo(s,s*.05);
        c.lineTo(s*.25,s); c.lineTo(-s*.8,s*.68); c.closePath();
        c.fill(); c.stroke(); c.restore();
    }
    function draw(c) {
        if (!active || !c) return;
        var now=clock(), p=livingStonePlayer, b=livingStoneBoss;
        c.save();
        c.globalAlpha=reduced?.14:.26; c.strokeStyle="#b28a64"; c.lineWidth=1;
        for (var i=0;i<7;i++) {
            var y=(i*83+elapsed*.42)%520, x=35+(i*47)%320;
            c.beginPath(); c.moveTo(x,y); c.lineTo(x-12,y+32+(i%3)*8); c.stroke();
        }
        c.globalAlpha=1;
        for (var bt=0;bt<bossTrail.length;bt++) {
            var tr=bossTrail[bt]; c.globalAlpha=tr.life/tr.max*.23;
            c.strokeStyle="#ff8757"; c.lineWidth=2;
            c.beginPath(); c.arc(tr.x,tr.y,30*tr.life/tr.max,0,Math.PI*2); c.stroke();
        }
        c.globalAlpha=1;
        for (var w=0;w<warnings.length;w++) {
            var warn=warnings[w]; c.save();
            c.globalAlpha=.55+Math.abs(Math.sin(now/70))*.4;
            c.strokeStyle="#ff6549"; c.lineWidth=2; c.setLineDash([5,5]);
            c.beginPath(); c.arc(warn.x,warn.y,warn.r,0,Math.PI*2); c.stroke();
            c.setLineDash([]); c.restore();
        }
        for (var r=0;r<rocks.length;r++) drawRock(c,rocks[r]);
        for (var wv=0;wv<waves.length;wv++) {
            var wave=waves[wv]; c.save(); c.globalAlpha=Math.min(.8,wave.life/18);
            c.strokeStyle="#ff9b66"; c.lineWidth=wave.width;
            c.shadowColor="#ff543b"; c.shadowBlur=reduced?0:8;
            c.beginPath(); c.arc(wave.x,wave.y,wave.r,0,Math.PI*2); c.stroke(); c.restore();
        }
        for (var pt=0;pt<playerTrail.length;pt++) {
            var t=playerTrail[pt]; c.save(); c.globalAlpha=t.life/t.max*.3;
            c.fillStyle="#ff5147"; c.beginPath(); c.arc(t.x,t.y,7*t.life/t.max,0,Math.PI*2); c.fill(); c.restore();
        }
        if (starAid) {
            c.save(); c.strokeStyle=starGuard?"rgba(255,224,135,.82)":"rgba(255,214,115,.26)";
            c.lineWidth=2; c.beginPath(); c.arc(p.x,p.y+9,25+Math.sin(now/110)*3,0,Math.PI*2); c.stroke();
            if (starFlash>0) {
                c.strokeStyle="rgba(255,230,140,"+Math.min(1,starFlash/8)+")";
                c.lineWidth=3; c.shadowColor="#ffcf52"; c.shadowBlur=reduced?0:12;
                c.beginPath(); c.moveTo(p.x+20,p.y-7); c.lineTo(b.x,b.y); c.stroke();
            }
            c.restore();
        }
        var remain=Math.max(0,DURATION-elapsed), sec=Math.floor(remain/1000), cs=Math.floor(remain%1000/10);
        c.save(); c.fillStyle="rgba(12,8,5,.78)"; c.fillRect(126,16,148,28);
        c.strokeStyle=starAid?"#f2cf70":"#c17a52"; c.lineWidth=1.5; c.strokeRect(126,16,148,28);
        c.textAlign="center"; c.fillStyle=starAid?"#ffe5a0":"#ffd0ae"; c.font="bold 14px monospace";
        c.fillText("ПОГОНЯ  "+String(sec).padStart(2,"0")+":"+String(cs).padStart(2,"0"),200,35);
        c.font="bold 10px monospace"; c.fillStyle="#e7d2bd";
        c.fillText(starAid?"ЗВЕЗДА РЯДОМ • WASD / СТРЕЛКИ":"БЕГИ И УВОРАЧИВАЙСЯ • WASD / СТРЕЛКИ",200,485);
        c.restore();
        if (damageFlash>0) { c.fillStyle="rgba(255,65,45,"+(damageFlash/35)+")"; c.fillRect(0,0,400,500); }
        c.restore();
    }
    function finish() {
        if (!active) return;
        active=false; resetArrays(); stopMusic();
        window.__mbLivingStoneChaseActive=false;
        window.__mbLivingStoneChaseStarAid=false;
        var name=document.getElementById("arenaBossName"); if(name) name.textContent="ЖИВОЙ КАМЕНЬ";
        var timer=document.getElementById("arenaTimer"); if(timer) timer.textContent="∞";
        livingStoneState="phase1"; livingStoneBoss.x=200; livingStoneBoss.y=110;
        livingStoneBoss.vx=1.5; livingStoneBoss.rotation=0;
        livingStoneAttacks=[]; livingStoneBullets=[]; livingStoneAttackTimer=0;
        livingStoneTypeTimer=180; livingStoneInvulnTimer=30;
        try { if(typeof startBattleMusic==="function") startBattleMusic(); } catch(e) {}
        var done=callback; callback=null;
        console.log("[LS CHASE] 40 seconds complete; transition to phase 2");
        if(typeof done==="function") { try { done(); } catch(e) { console.error("[LS CHASE] phase transition error",e); } }
    }
    function stop() {
        if (!active) return;
        active=false; resetArrays(); stopMusic();
        window.__mbLivingStoneChaseActive=false; window.__mbLivingStoneChaseStarAid=false;
        callback=null;
    }
    window.MBStartLivingStoneChase=start;
    window.MBUpdateLivingStoneChase=update;
    window.MBDrawLivingStoneChase=draw;
    window.MBStopLivingStoneChase=stop;
    window.MBIsLivingStoneChaseActive=function(){return active;};
    window.MBHasLivingStoneWaystarAid=debt;
})();
