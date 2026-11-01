/* Waystar companion: returns for every eligible Living Stone phase-two encounter.
   The existing slotData.waystarOwesDebt value remains the sole mercy source. */
(function () {
    "use strict";

    var active = false, supportRequested = false, frame = 0, activeEncounterGeneration = -1;
    var strikeTimer = 95, guardCooldown = 0;
    var guardFlash = 0, strikeFlash = 0, supportDimTimer = 0, attackPause = 0;
    var supportX = 0, supportY = 0;
    var route = null, routeTimer = 0, routeHitFlash = 0;
    var blockStars = 0, constellationFlash = 0;
    var finalLockTimer = 0, finalLockTriggered = false, finalDialogueStage = 0;
    var lastPhase = "";

    // Independent Waystar NPC, built around Oden's movement / dodge / attack loop.
    var ally = {
        x: 200, y: 300, vx: 0, vy: 0, hp: 150, maxHp: 150,
        phase: 0, invuln: 0, hitFlash: 0, attackTimer: 125,
        attackPattern: 0, alive: true, targetX: 200, targetY: 300,
        windup: 0, dashFlash: 0
    };
    var allyAttacks = [], allyParticles = [], allyAttackQueue = [], allyDeathTimer = 0;
    var allyAttackSerial = 0, allyInitialized = false;
    var allyEffects = { shockwaves: [], lightning: [], slashes: [], flashes: [], particles: [] };
    var WAYSTAR_ALLY_SPEED = 6.4;

    function resetAlly() {
        ally.x = 200; ally.y = 300; ally.vx = 0; ally.vy = 0;
        ally.hp = ally.maxHp = 600; ally.phase = 0; ally.invuln = 0;
        ally.hitFlash = 0; ally.attackTimer = 72; ally.attackPattern = 0;
        ally.alive = true; ally.targetX = 200; ally.targetY = 300;
        ally.windup = 0; ally.dashFlash = 0; allyDeathTimer = 0;
        allyAttacks.length = 0; allyParticles.length = 0; allyAttackQueue.length = 0; allyAttackSerial = 0;
        allyEffects.shockwaves.length = 0; allyEffects.lightning.length = 0;
        allyEffects.slashes.length = 0; allyEffects.flashes.length = 0; allyEffects.particles.length = 0;
        allyInitialized = true;
    }

    function bossPoint() {
        if (typeof livingStoneBoss === "undefined" || !livingStoneBoss) return { x: 200, y: 110, size: 42, vx: 0, vy: 0 };
        return {
            x: Number(livingStoneBoss.x) || 200,
            y: Number(livingStoneBoss.y) || 110,
            size: Math.max(20, Number(livingStoneBoss.size) || 42),
            vx: Number(livingStoneBoss.vx) || 0,
            vy: Number(livingStoneBoss.vy) || 0
        };
    }

    function allyDamageAmount(weight) {
        // The original attack patterns now have meaningful boss-support damage.
        return Math.max(2, Math.floor(maxBossHp() * 0.0045 * (Number(weight) || 1)));
    }

    function hitBoss(amount, x, y, color) {
        if (!ally.alive || !normalActionsEligible() && !encounterEligible()) return false;
        if (!(currentBossHp() > 0)) return false;
        var dealt = Math.min(Math.max(1, Math.floor(Number(amount) || 1)), Math.max(1, currentBossHp()));
        var applied = false;
        if (typeof window.MBLivingStoneSuperDamage === "function" && window.livingStoneSuperActive === true) {
            applied = window.MBLivingStoneSuperDamage(dealt) !== false;
        } else if (typeof damageLivingStone === "function") {
            damageLivingStone(dealt); applied = true;
        }
        if (!applied) return false;
        strikeFlash = Math.max(strikeFlash, 18);
        if (typeof spawnLivingStoneParticles === "function")
            spawnLivingStoneParticles(Number(x) || bossPoint().x, Number(y) || bossPoint().y,
                6, color || "#aeeaff", 3.2);
        if (typeof playArenaSound === "function") playArenaSound(720 + Math.random() * 300, "triangle", 0.07, 0.035);
        return true;
    }


    function pushOriginalWaystarProjectile(type,x,y,vx,vy,size,weight,color,life,rotSpeed){
        allyAttacks.push({type:type,x:x,y:y,vx:vx,vy:vy,size:size||8,
            damage:allyDamageAmount(weight||1),color:color||"#ffd700",life:life||350,
            trail:[],rotation:Math.random()*Math.PI*2,rotSpeed:Number(rotSpeed)||0,hit:false});
    }
    function queueOriginalWaystarProjectile(delay,args){
        allyAttackQueue.push({kind:"projectile",delay:Math.max(0,Number(delay)||0),args:args});
    }
    function queueOriginalWaystarBomb(delay,small){
        allyAttackQueue.push({kind:"bomb",delay:Math.max(0,Number(delay)||0),small:!!small});
    }
    function spawnOriginalWaystarBomb(small,boss){
        allyAttacks.push({type:"solar_bomb",
            x:Math.max(40,Math.min(360,boss.x+(Math.random()-.5)*(small?58:92))),
            y:Math.max(80,Math.min(430,boss.y+(Math.random()-.5)*(small?58:92))),
            timer:small?160:220,maxTimer:small?160:220,radius:small?40:70,
            damage:allyDamageAmount(small?1.35:2.25),exploded:false,explosionTimer:0,small:!!small,
            sunPhase:"big",sunScale:small?.7:1,sunColor:"#ffdd00",phaseTimer:0});
    }

    // Local copy of the original Waystar screen effects, so they also render in the
    // Living Stone fight without starting a second Waystar boss instance.
    function addAllyShockwave(x,y,color,maxRadius,life,width){
        if(window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects())return;
        allyEffects.shockwaves.push({x:x,y:y,radius:10,maxRadius:maxRadius,life:life,maxLife:life,color:color,width:width||4});
    }
    function addAllyLightning(x1,y1,x2,y2,color,alpha,width){
        if(window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects())return;
        var pts=[],steps=4+Math.floor(Math.random()*3);
        for(var i=1;i<steps;i++){var t=i/steps;pts.push({x:x1+(x2-x1)*t+(Math.random()-.5)*20,y:y1+(y2-y1)*t+(Math.random()-.5)*20});}
        allyEffects.lightning.push({x1:x1,y1:y1,x2:x2,y2:y2,pts:pts,color:color,alpha:alpha,life:12,maxLife:12,width:width||2});
    }
    function addAllySlash(x,y,angle,length,width){
        if(window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects())return;
        allyEffects.slashes.push({x:x,y:y,angle:angle,length:length,width:width||4,life:20,maxLife:20});
    }
    function addAllyFlash(x,y,size){
        if(window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects())return;
        allyEffects.flashes.push({x:x,y:y,size:size||40,life:15,maxLife:15});
    }
    function spawnAllyFxParticles(x,y,count,color,speed){
        var reduced=!!(window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects());
        var medium=!!(window.MBIsMediumGraphics&&window.MBIsMediumGraphics());
        var scale=reduced?.18:(medium?.68:1),cap=reduced?24:(medium?100:260);
        count=Math.floor(count*scale);
        count=Math.min(count,Math.max(0,cap-allyEffects.particles.length));
        for(var i=0;i<count;i++){
            var angle=Math.random()*Math.PI*2,sp=speed*(.3+Math.random());
            allyEffects.particles.push({x:x,y:y,vx:Math.cos(angle)*sp,vy:Math.sin(angle)*sp,
                life:reduced?10:20+Math.random()*15,maxLife:reduced?10:35,
                color:color,size:reduced?1:1.5+Math.random()*2.5});
        }
    }
    function updateAllyEffects(){
        var e=allyEffects;
        for(var i=e.shockwaves.length-1;i>=0;i--){var sw=e.shockwaves[i];sw.radius+=(sw.maxRadius-sw.radius)*.15;sw.life--;if(sw.life<=0)e.shockwaves.splice(i,1);}
        for(var j=e.lightning.length-1;j>=0;j--){if(--e.lightning[j].life<=0)e.lightning.splice(j,1);}
        for(var k=e.slashes.length-1;k>=0;k--){if(--e.slashes[k].life<=0)e.slashes.splice(k,1);}
        for(var f=e.flashes.length-1;f>=0;f--){if(--e.flashes[f].life<=0)e.flashes.splice(f,1);}
        for(var p=e.particles.length-1;p>=0;p--){
            var part=e.particles[p];part.x+=part.vx;part.y+=part.vy;
            part.vx*=.94;part.vy*=.94;part.life--;
            if(part.life<=0)e.particles.splice(p,1);
        }
    }
    function drawAllyEffects(c){
        var e=allyEffects;
        for(var i=0;i<e.particles.length;i++){
            var p=e.particles[i];c.globalAlpha=Math.max(0,p.life/p.maxLife)*.8;
            c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,p.size,0,Math.PI*2);c.fill();
        }
        for(var j=0;j<e.lightning.length;j++){
            var lb=e.lightning[j];c.save();c.globalAlpha=(lb.life/lb.maxLife)*.9;
            c.strokeStyle=lb.color;c.lineWidth=lb.width;c.beginPath();c.moveTo(lb.x1,lb.y1);
            for(var lp=0;lp<lb.pts.length;lp++)c.lineTo(lb.pts[lp].x,lb.pts[lp].y);
            c.lineTo(lb.x2,lb.y2);c.stroke();c.restore();
        }
        for(var k=0;k<e.shockwaves.length;k++){
            var wave=e.shockwaves[k],progress=1-wave.life/wave.maxLife;
            c.save();c.globalAlpha=(1-progress)*.8;c.strokeStyle=wave.color;
            c.lineWidth=wave.width*(1-progress);c.beginPath();
            c.arc(wave.x,wave.y,Math.max(.1,wave.radius),0,Math.PI*2);c.stroke();c.restore();
        }
        for(var q=0;q<e.slashes.length;q++){
            var slash=e.slashes[q];c.save();c.globalAlpha=slash.life/slash.maxLife;
            c.translate(slash.x,slash.y);c.rotate(slash.angle);c.strokeStyle="#ffffff";
            c.lineWidth=slash.width*(slash.life/slash.maxLife);c.beginPath();
            c.moveTo(-slash.length/2,0);c.lineTo(slash.length/2,0);
            c.moveTo(0,-slash.length/2);c.lineTo(0,slash.length/2);c.stroke();c.restore();
        }
        for(var f=0;f<e.flashes.length;f++){
            var flash=e.flashes[f];c.save();c.globalAlpha=(flash.life/flash.maxLife)*.6;
            var radius=flash.size*(1-flash.life/flash.maxLife+.5);
            var gradient=c.createRadialGradient(flash.x,flash.y,0,flash.x,flash.y,radius);
            gradient.addColorStop(0,"#ffffff");gradient.addColorStop(.4,"rgba(255,215,0,.4)");
            gradient.addColorStop(1,"rgba(255,215,0,0)");
            c.fillStyle=gradient;c.beginPath();c.arc(flash.x,flash.y,radius,0,Math.PI*2);c.fill();c.restore();
        }
        c.globalAlpha=1;
    }

    function launchAllyPattern(){
        if(!ally.alive||!encounterEligible()||currentBossHp()<=0)return;
        var boss=bossPoint(),tx=Math.max(35,Math.min(365,boss.x+boss.vx*9));
        var ty=Math.max(65,Math.min(230,boss.y+boss.vy*7));
        var base=Math.atan2(ty-ally.y,tx-ally.x);
        var escalation=Math.min(5,Math.floor(allyAttackSerial/4));
        var pattern=ally.attackPattern++%13;
        allyAttackSerial++;ally.windup=[2,3,6,8,10].indexOf(pattern)>=0?28:12;
        var s1=1.3,s3=1.3*.7;

        if(pattern===0){
            // Original Phase 1 meteor pattern, with the boss's own entry shockwave.
            var count=escalation>=2?4:2;
            for(var i=0;i<count;i++){
                var mx=Math.max(20,Math.min(380,tx+(i-(count-1)/2)*34+(Math.random()-.5)*24));
                pushOriginalWaystarProjectile("meteor",mx,-40-Math.random()*50,
                    (Math.random()-.5)*1.5*s1,(2.5+Math.random()*1.8)*s1,
                    12+Math.random()*6,1.15,"#ffd700",400,(Math.random()-.5)*.2);
            }
            addAllyShockwave(boss.x,boss.y,"#ff8800",100,15,3);
            announce("ПАДАЮЩИЕ МЕТЕОРЫ!","#ffcf57",45);
        }else if(pattern===1){
            // Original two-turn spiral, emitted in the same staggered stream.
            var n=escalation>=2?14:10,start=Math.random()*Math.PI*2;
            for(var j=0;j<n;j++){
                var angle=start+(j/n)*Math.PI*4;
                queueOriginalWaystarProjectile(j*6,["spiral",ally.x,ally.y,
                    Math.cos(angle)*3*s1,Math.sin(angle)*3*s1,7,.92,"#ff00ff",350,0]);
            }
            addAllyShockwave(boss.x,boss.y,"#ff00ff",80,12,3);
            announce("ДВУХВИТКОВАЯ СПИРАЛЬ!","#ff55ed",45);
        }else if(pattern===2){
            allyAttacks.push({type:"vertical_laser",state:"warning",
                x:Math.max(55,Math.min(345,tx+(Math.random()-.5)*18)),width:55,
                warningTimer:70,activeTimer:0,maxActive:50,damage:allyDamageAmount(2.1),hit:false,chargeParticles:0});
            announce("ВЕРТИКАЛЬНЫЙ ЛАЗЕР!","#ff6666",48);
        }else if(pattern===3){
            allyAttacks.push({type:"blind",state:"warning",timer:0,blindTimer:0,fadeTimer:0,flash:0,
                warnings:[
                    {x:50,y:80,delay:0,timer:0,active:false,pulse:0},
                    {x:350,y:80,delay:8,timer:0,active:false,pulse:1},
                    {x:50,y:430,delay:16,timer:0,active:false,pulse:2},
                    {x:350,y:430,delay:24,timer:0,active:false,pulse:3}
                ],damage:allyDamageAmount(1.9),hit:false});
            announce("ЗВЕЗДА ГОТОВИТ ОСЛЕПЛЕНИЕ!","#ffcc00",55);
        }else if(pattern===4){
            // Original diagonal rain crosses the full arena from both sides.
            var rain=escalation>=2?10:7;
            for(var r=0;r<rain;r++){
                var side=r%2===0?1:-1;
                var y=Math.max(-90,Math.min(190,ty+(Math.random()-.5)*115));
                pushOriginalWaystarProjectile("star_rain",side>0?-30:430,y,
                    (side>0?3.5:-3.5)*s1,2.2*s1,10,.92,"#ffd700",350,(Math.random()-.5)*.2);
            }
            addAllyShockwave(boss.x,boss.y,"#ffffff",90,12,3);
            announce("ЗВЁЗДНЫЙ ДОЖДЬ!","#ffeaa0",45);
        }else if(pattern===5){
            // Original Phase 3 shotgun fan.
            var shotgun=5+Math.floor(escalation/2);
            for(var q=0;q<shotgun;q++){
                var a=base+(q-(shotgun-1)/2)*.14;
                pushOriginalWaystarProjectile("shotgun_bullet",ally.x,ally.y,
                    Math.cos(a)*2.8*s3,Math.sin(a)*2.8*s3,6,1,"#ff4400",350,0);
            }
            addAllyShockwave(ally.x,ally.y,"#ff4400",80,15,4);
            addAllyFlash(ally.x,ally.y,50);
            announce("ДРОБОВОЙ ЗАЛП!","#ff795a",45);
        }else if(pattern===6){
            var bombs=1+Math.floor(escalation/2);
            for(var b=0;b<bombs;b++)queueOriginalWaystarBomb(b*55,false);
            announce("СОЛНЕЧНАЯ БОМБА!","#ffd75d",50);
        }else if(pattern===7){
            var dx=tx-ally.x,dy=ty-ally.y,len=Math.hypot(dx,dy)||1;
            allyAttacks.push({type:"waystar_dash",x:ally.x,y:ally.y,startX:ally.x,startY:ally.y,
                targetX:tx,targetY:ty,dirX:dx/len,dirY:dy/len,progress:0,duration:80,
                damage:allyDamageAmount(2.5),hit:false,trail:[]});
            ally.dashFlash=30;
            addAllyShockwave(ally.x,ally.y,"#ff00ff",80,15,4);
            announce("РЫВОК ПУТЕВОДНОЙ ЗВЕЗДЫ!","#ff69ef",48);
        }else if(pattern===8){
            allyAttacks.push({type:"giant_laser",state:"warning",x:ally.x,y:ally.y,angle:base,
                width:55,warningTimer:100,activeTimer:0,maxActive:40,trackTimer:60,
                damage:allyDamageAmount(3.2),hit:false});
            announce("ГИГА-ЛАЗЕР ЗВЕЗДЫ!","#ff74e9",55);
        }else if(pattern===9){
            var twin=14+escalation*2;
            for(var t=0;t<twin;t++){
                var ang=(t/twin)*Math.PI*4;
                queueOriginalWaystarProjectile(t*9,["spiral",ally.x,ally.y,
                    Math.cos(ang)*1.8*s3,Math.sin(ang)*1.8*s3,6,.72,"#ff00ff",350,0]);
                queueOriginalWaystarProjectile(t*9,["spiral",ally.x,ally.y,
                    Math.cos(-ang)*1.8*s3,Math.sin(-ang)*1.8*s3,6,.72,"#ff00ff",350,0]);
            }
            addAllyShockwave(boss.x,boss.y,"#ff00ff",180,22,5);
            announce("ДВОЙНАЯ СПИРАЛЬ!","#ff4ceb",48);
        }else if(pattern===10){
            var mines=3+Math.floor(escalation/2);
            for(var m=0;m<mines;m++)queueOriginalWaystarBomb(m*42,true);
            announce("СОЛНЕЧНЫЕ МИНЫ!","#ffce64",48);
        }else if(pattern===11){
            // True 60-piece Legion: rows move as one formation and fire continuously.
            var pieces=[];
            for(var row=0;row<6;row++)for(var col=0;col<10;col++){
                var idx=row*10+col;
                pieces.push({
                    x:25+col*38,y:60+row*40,baseX:25+col*38,baseY:60+row*40,
                    size:10,hp:2,maxHp:2,alive:true,pulse:Math.random()*Math.PI*2,
                    trail:[]
                });
            }
            allyAttacks.push({type:"legion_formation",pieces:pieces,timer:0,
                offset:0,direction:1,speed:1.0,shootTimer:0,life:520});
            addAllyShockwave(boss.x,boss.y,"#ff00ff",400,30,6);
            addAllyFlash(boss.x,boss.y,100);
            for(var bolt=0;bolt<20;bolt++){
                var la=bolt/20*Math.PI*2;
                addAllyLightning(boss.x,boss.y,boss.x+Math.cos(la)*250,boss.y+Math.sin(la)*250,"#ff00ff",.8,3);
            }
            spawnAllyFxParticles(boss.x,boss.y,80,"#ffd700",12);
            announce("Я - ЛЕГИОН! 60 ОСКОЛКОВ!","#ffe6a0",60);
        }else{
            // Only three solar shards appear; each homes in and detonates on contact.
            var shardCount=3;
            for(var sh=0;sh<shardCount;sh++){
                var spread=(sh-(shardCount-1)/2)*34;
                var sx=Math.max(24,Math.min(376,ally.x+spread));
                var sy=ally.y-12-Math.abs(spread)*.25;
                var aim=Math.atan2(ty-sy,tx-sx);
                allyAttacks.push({type:"solar_shard",x:sx,y:sy,vx:Math.cos(aim)*3.6,vy:Math.sin(aim)*3.6,
                    speed:3.6,turn:.11,size:11,damage:allyDamageAmount(1),life:150,trail:[],rotation:aim,hit:false});
            }
            addAllyFlash(ally.x,ally.y,48);addAllyShockwave(ally.x,ally.y,"#ffd84a",100,16,4);
            announce("СОЛНЕЧНЫЕ ОСКОЛКИ!","#ffe477",48);
        }
    }

    function pointToSegmentDistance(px,py,x1,y1,x2,y2){
        var dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;
        var t=len2>0?Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/len2)):0;
        return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));
    }

    function getAllyThreats(){
        var list=[];
        if(typeof livingStoneAttacks!=="undefined"&&Array.isArray(livingStoneAttacks))
            list=list.concat(livingStoneAttacks);
        if(typeof livingStoneBullets!=="undefined"&&Array.isArray(livingStoneBullets))
            list=list.concat(livingStoneBullets);
        if(typeof window.MBGetLivingStoneSuperCompanionThreats==="function"){
            try{list=list.concat(window.MBGetLivingStoneSuperCompanionThreats()||[]);}catch(e){}
        }
        return list;
    }

    function threatAt(h,x,y,frames,actual){
        if(!h||h.allyHit||h.odenHit||h._mbGEIgnored||h.state==="done")return 0;
        var type=String(h.type||"").toLowerCase(),t=Math.max(0,Number(frames)||0);
        var hx=Number(h.x),hy=Number(h.y),width=Math.max(8,Number(h.width)||0);
        var size=Math.max(7,Number(h.size||h.r)||9);
        if(type==="ring"){
            var growth=Math.max(0,Number(h.growth)||0);
            var rr=Math.min(Number(h.maxRadius)||Infinity,Math.max(0,Number(h.radius)||0)+growth*t);
            var gap=Math.abs(Math.hypot(x-(Number(h.x)||0),y-(Number(h.y)||0))-rr);
            var thickness=Math.max(8,Number(h.thickness)||16)*.5+18;
            return gap<thickness?Math.max(.2,1-gap/thickness):0;
        }
        if(type==="laser_warning"||type==="laser"||type==="vertical_laser"){
            var timer=Number.isFinite(Number(h.timer))?Number(h.timer):
                (Number.isFinite(Number(h.warningTimer))?Number(h.warningTimer):0);
            var active=type!=="laser_warning"&&type!=="vertical_laser"||timer<=t+10||h.state==="active";
            if(actual&&(h.state==="warning"||timer>0&&type==="laser_warning"))return 0;
            if(!active)return 0;
            return Math.abs(x-hx)<(width||55)*.5+18?1:0;
        }
        if(type==="spike"){
            var height=Math.max(Number(h.height)||0,Number(h.maxHeight)||0);
            var warning=Number(h.warningTimer)||0;
            if(actual&&(warning>0||Number(h.height)<=0))return 0;
            if(!actual&&warning>t+8)return 0;
            var spikeX=Number.isFinite(hx)?hx:200,bottom=Number.isFinite(hy)?hy:500;
            if(Math.abs(x-spikeX)<Math.max(24,Number(h.width)||34)*.5+13&&
                y>bottom-height-22&&y<bottom+20)return 1;
            return 0;
        }
        if(type==="gravity_well"){
            var wd=Math.hypot(x-(Number(h.x)||0),y-(Number(h.y)||0));
            var wr=Math.max(45,Number(h.radius)||55)+38;
            return wd<wr?Math.max(.25,1-wd/wr):0;
        }
        if(type==="predict"){
            var pr=Math.max(22,Number(h.radius)||27)+18;
            var pd=Math.hypot(x-(Number(h.x)||0),y-(Number(h.y)||0));
            if(actual&&h.active!==true)return 0;
            return pd<pr?Math.max(.2,1-pd/pr):0;
        }
        if(type==="boss_dash"&&Number.isFinite(Number(h.targetX))){
            return pointToSegmentDistance(x,y,Number(h.x)||0,Number(h.y)||0,
                Number(h.targetX),Number(h.targetY)||0)<size+28?1:0;
        }
        if(!Number.isFinite(hx)||!Number.isFinite(hy))return 0;
        var vx=Number(h.vx)||0,vy=Number(h.vy)||0,px=hx+vx*t,py=hy+vy*t;
        if(type==="boomerang"&&h.stage==="return"){
            px=hx-vx*t*.8;py=hy-vy*t*.8;
        }else if(type==="gravity_stone"){
            var wx=Number(h.wellX),wy=Number(h.wellY);
            if(Number.isFinite(wx)&&Number.isFinite(wy)){
                var pull=Math.min(.82,t*.012);px+=(wx-hx)*pull;py+=(wy-hy)*pull;
            }
        }
        var radius=size+18;
        if(type==="boulder"||type==="plate"||type==="boomerang")radius+=8;
        if(type==="homing")radius+=10;
        var distance=Math.hypot(x-px,y-py);
        return distance<radius?Math.max(.18,1-distance/radius):0;
    }

    function chooseAllyGoal(boss,threats){
        var baseX=Math.max(42,Math.min(358,boss.x+(ally.x<=boss.x?-72:72)));
        var baseY=Math.max(215,Math.min(365,boss.y+175));
        var candidates=[{x:baseX,y:baseY}];
        for(var ai=0;ai<16;ai++){
            var angle=ai*Math.PI/8;
            for(var radius=62;radius<=186;radius+=62){
                candidates.push({
                    x:Math.max(28,Math.min(372,ally.x+Math.cos(angle)*radius)),
                    y:Math.max(155,Math.min(430,ally.y+Math.sin(angle)*radius))
                });
            }
        }
        var checks=[6,14,24,36,50,66],best=null,bestScore=Infinity;
        for(var i=0;i<candidates.length;i++){
            var cand=candidates[i],danger=0;
            for(var j=0;j<threats.length;j++){
                var threat=threats[j];if(!threat||threat.state==="done")continue;
                for(var k=0;k<checks.length;k++){
                    var at=checks[k],fraction=at/66;
                    var px=ally.x+(cand.x-ally.x)*fraction;
                    var py=ally.y+(cand.y-ally.y)*fraction;
                    var risk=threatAt(threat,px,py,at,false);
                    if(risk>0)danger+=risk*Math.max(.65,Math.min(2,(Number(threat.damage)||8)/12))*(7-k);
                }
            }
            var clearance=Math.hypot(cand.x-boss.x,cand.y-boss.y);
            var tooClose=Math.max(0,105-clearance);
            var score=danger*950+tooClose*5+
                Math.hypot(cand.x-baseX,cand.y-baseY)*.22+
                Math.hypot(cand.x-ally.x,cand.y-ally.y)*.055;
            if(score<bestScore){bestScore=score;best=cand;}
        }
        return best||{x:baseX,y:baseY};
    }

    function damageAlly(amount,x,y){
        if(!ally.alive||ally.invuln>0)return;
        var dealt=Math.max(1,Math.min(10,(Number(amount)||8)*.3));
        ally.hp=Math.max(0,ally.hp-dealt);
        ally.invuln=68;ally.hitFlash=18;
        burst(x||ally.x,y||ally.y,14,"#ff91c9",4.5);
        addAllyFlash(x||ally.x,y||ally.y,26);
        addAllyShockwave(x||ally.x,y||ally.y,"#ff6bac",46,10,2.5);
        if(ally.hp<=0){
            ally.alive=false;allyDeathTimer=999999;
            allyAttacks.length=0;allyAttackQueue.length=0;
            announce("ПУТЕВОДНАЯ ЗВЕЗДА ВЫБЫЛА!","#ff9acb",120);
        }
    }

    function updateAlly(){
        if(!ally.alive){updateAllyEffects();return;}
        var boss=bossPoint(),threats=getAllyThreats();
        ally.phase+=.11;
        if(ally.invuln>0)ally.invuln--;
        if(ally.hitFlash>0)ally.hitFlash--;
        if(ally.dashFlash>0)ally.dashFlash--;

        // Attack cadence is independent from the old player-protection cooldown.
        if(attackPause<=0){
            if(ally.attackTimer>0)ally.attackTimer--;
            if(ally.attackTimer<=0){
                ally.attackTimer=96;
                launchAllyPattern();
            }
        }

        // The NPC itself follows the boss, while continuously checking where hazards
        // will be several frames ahead. During its own dash, keep the captured route.
        var dashActive=false;
        for(var i=0;i<allyAttacks.length;i++){
            if(allyAttacks[i].type==="waystar_dash"){dashActive=true;break;}
        }
        if(!dashActive){
            var goal=chooseAllyGoal(boss,threats);
            var immediateRisk=0;
            for(var j=0;j<threats.length;j++){
                var threat=threats[j];
                if(!threat||threat.state==="done")continue;
                var risk=threatAt(threat,ally.x,ally.y,12,false);
                if(risk>immediateRisk)immediateRisk=risk;
            }
            ally.targetX=goal.x;ally.targetY=goal.y;
            var dx=goal.x-ally.x,dy=goal.y-ally.y,dist=Math.hypot(dx,dy)||1;
            var boost=immediateRisk>.25?1.5:1;
            var desired=Math.min(WAYSTAR_ALLY_SPEED*boost,Math.max(.7,dist*.2));
            var steer=immediateRisk>.25?.46:.26;
            ally.vx+=(dx/dist*desired-ally.vx)*steer;
            ally.vy+=(dy/dist*desired-ally.vy)*steer;
            var speed=Math.hypot(ally.vx,ally.vy),maxSpeed=WAYSTAR_ALLY_SPEED*boost;
            if(speed>maxSpeed){ally.vx=ally.vx/speed*maxSpeed;ally.vy=ally.vy/speed*maxSpeed;}
            ally.x=Math.max(22,Math.min(378,ally.x+ally.vx));
            ally.y=Math.max(150,Math.min(430,ally.y+ally.vy));
        }

        // Ally collision is separate from the player's collision. It does not consume
        // or erase the original boss projectile; it only gives the NPC its own hit state.
        for(var k=0;k<threats.length;k++){
            var hazard=threats[k];
            if(!hazard||hazard.allyHit)continue;
            if(threatAt(hazard,ally.x,ally.y,0,true)>0&&ally.invuln<=0){
                hazard.allyHit=true;
                damageAlly(Math.max(4,(Number(hazard.damage)||10)*.3),ally.x,ally.y);
                break;
            }
        }

        updateOriginalWaystarAttacks(boss);
        updateAllyEffects();
    }

    function updateOriginalWaystarAttacks(boss){
        for(var qi=allyAttackQueue.length-1;qi>=0;qi--){
            var queued=allyAttackQueue[qi];
            if(queued.delay>0){queued.delay--;continue;}
            if(queued.kind==="projectile"){
                var d=queued.args;
                pushOriginalWaystarProjectile(d[0],d[1],d[2],d[3],d[4],d[5],d[6],d[7],d[8],d[9]);
            }else if(queued.kind==="bomb")spawnOriginalWaystarBomb(queued.small,boss);
            allyAttackQueue.splice(qi,1);
        }
        for(var i=allyAttacks.length-1;i>=0;i--){
            var a=allyAttacks[i];
            if(a.type==="solar_shard"){
                var shardTarget=bossPoint(),desired=Math.atan2(shardTarget.y-a.y,shardTarget.x-a.x);
                var current=Math.atan2(a.vy,a.vx),delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));
                var angle=current+Math.max(-a.turn,Math.min(a.turn,delta));
                a.speed=Math.min(8.2,a.speed+.075);a.vx=Math.cos(angle)*a.speed;a.vy=Math.sin(angle)*a.speed;
                a.rotation=angle;a.trail.push({x:a.x,y:a.y});if(a.trail.length>7)a.trail.shift();
                a.x+=a.vx;a.y+=a.vy;a.life--;
                if(Math.hypot(shardTarget.x-a.x,shardTarget.y-a.y)<shardTarget.size+a.size+5){
                    hitBoss(a.damage,a.x,a.y,"#fff1a0");addAllyFlash(a.x,a.y,42);
                    addAllyShockwave(a.x,a.y,"#ffd84a",76,17,4);addAllyLightning(a.x-24,a.y-18,a.x+24,a.y+18,"#fff7c2",.9,2.5);
                    spawnAllyFxParticles(a.x,a.y,14,"#ffd84a",6);allyAttacks.splice(i,1);continue;
                }
                if(a.life<=0||a.x<-35||a.x>435||a.y<-35||a.y>535)allyAttacks.splice(i,1);
                continue;
            }
            if(a.type==="meteor"||a.type==="spiral"||a.type==="star_rain"||a.type==="shotgun_bullet"||a.type==="legion_shot"){
                var limit=window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects()?2:6;
                a.trail.push({x:a.x,y:a.y});if(a.trail.length>limit)a.trail.shift();
                a.x+=a.vx;a.y+=a.vy;a.rotation+=a.rotSpeed||0;a.life--;
                if(Math.hypot(boss.x-a.x,boss.y-a.y)<boss.size+a.size){
                    hitBoss(a.damage,a.x,a.y,a.color);
                    burst(a.x,a.y,8,a.color,4);addAllyFlash(a.x,a.y,20);
                    if(a.type==="meteor")addAllyShockwave(a.x,a.y,"#ff8800",50,12,3);
                    allyAttacks.splice(i,1);continue;
                }
                if(a.y>520||a.x<-30||a.x>430||a.life<=0){
                    if(a.y>500&&a.type==="meteor"){
                        addAllyShockwave(a.x,500,"#ff8800",50,12,3);
                        spawnAllyFxParticles(a.x,500,10,"#ff8800",5);
                    }
                    allyAttacks.splice(i,1);
                }
                continue;
            }
            if(a.type==="vertical_laser"){
                if(a.state==="warning"){
                    a.warningTimer--;a.chargeParticles++;
                    if(a.chargeParticles%5===0)spawnAllyFxParticles(a.x+(Math.random()-.5)*a.width,490-Math.random()*40,1,"#ff3333",3);
                    if(a.warningTimer<=0){
                        a.state="active";a.activeTimer=a.maxActive;
                        addAllyFlash(a.x,250,100);addAllyShockwave(a.x,250,"#ff3333",120,18,4);
                        for(var vl=0;vl<3;vl++)addAllyLightning(a.x,0,a.x+(Math.random()-.5)*30,500,"#ffffff",.8,1.5);
                    }
                }else if(a.state==="active"){
                    a.activeTimer--;
                    if(!a.hit&&Math.abs(boss.x-a.x)<a.width/2+boss.size*.5){a.hit=true;hitBoss(a.damage,a.x,boss.y,"#fff0f0");}
                    if(a.activeTimer%3===0)spawnAllyFxParticles(a.x+(Math.random()-.5)*a.width,Math.random()*500,2,Math.random()>.5?"#ffffff":"#ff3333",4);
                    if(a.activeTimer<=0)a.state="done";
                }else allyAttacks.splice(i,1);
                continue;
            }
            if(a.type==="giant_laser"){
                if(a.state==="warning"){
                    a.warningTimer--;
                    if(a.trackTimer>0){a.trackTimer--;a.x=ally.x;a.y=ally.y;a.angle=Math.atan2(boss.y-a.y,boss.x-a.x);}
                    if(a.warningTimer<=0){
                        a.state="active";a.activeTimer=a.maxActive;
                        addAllyFlash(a.x,a.y,150);addAllyShockwave(a.x,a.y,"#ff00ff",180,22,5);
                        for(var gs=0;gs<5;gs++)addAllySlash(a.x,a.y,a.angle+(Math.random()-.5)*.6,70,4);
                    }
                }else if(a.state==="active"){
                    a.activeTimer--;
                    var ex=a.x+Math.cos(a.angle)*820,ey=a.y+Math.sin(a.angle)*820;
                    if(!a.hit&&pointToSegmentDistance(boss.x,boss.y,a.x,a.y,ex,ey)<a.width/2+boss.size){
                        a.hit=true;hitBoss(a.damage,boss.x,boss.y,"#ffb7f3");
                    }
                    if(a.activeTimer%6===0){
                        var sd=Math.random()*400;
                        addAllySlash(a.x+Math.cos(a.angle)*sd,a.y+Math.sin(a.angle)*sd,a.angle+Math.PI/2,60,4);
                    }
                    if(a.activeTimer<=0)a.state="done";
                }else allyAttacks.splice(i,1);
                continue;
            }
            if(a.type==="solar_bomb"){
                if(!a.exploded){
                    a.timer--;a.phaseTimer++;
                    var progress=1-a.timer/a.maxTimer;
                    if(progress<.4){a.sunPhase="big";a.sunColor="#ffdd00";a.sunScale=1+Math.sin(frame/9)*.04;}
                    else if(progress<.7){var shrink=(progress-.4)/.3;a.sunPhase="shrink";a.sunScale=1-shrink*.6;a.sunColor=shrink<.5?"#ffdd00":"#ffffff";}
                    else if(progress<.9){var blue=(progress-.7)/.2;a.sunPhase="blue";a.sunScale=.4-blue*.15;a.sunColor="#0088ff";}
                    else{a.sunPhase="flash";a.sunScale=.25+Math.abs(Math.sin(frame/4))*.12;a.sunColor="#ffffff";}
                    if(a.phaseTimer%8===0)spawnAllyFxParticles(a.x+(Math.random()-.5)*50*a.sunScale,a.y+(Math.random()-.5)*50*a.sunScale,1,a.sunColor,2.5);
                    if(a.timer<=0){
                        a.exploded=true;a.explosionTimer=20;
                        if(Math.hypot(boss.x-a.x,boss.y-a.y)<a.radius+boss.size)hitBoss(a.damage,a.x,a.y,"#00aaff");
                        addAllyShockwave(a.x,a.y,"#00aaff",a.radius*1.8,25,6);
                        addAllyShockwave(a.x,a.y,"#ffffff",a.radius*1.3,18,4);
                        addAllyFlash(a.x,a.y,a.radius*1.5);
                        spawnAllyFxParticles(a.x,a.y,40,"#0088ff",10);spawnAllyFxParticles(a.x,a.y,25,"#ffffff",7);
                        for(var lb=0;lb<5;lb++){var angle=Math.random()*Math.PI*2;addAllyLightning(a.x,a.y,a.x+Math.cos(angle)*a.radius*1.3,a.y+Math.sin(angle)*a.radius*1.3,Math.random()>.5?"#00aaff":"#ffffff",.85,2.5);}
                    }
                }else if(--a.explosionTimer<=0)allyAttacks.splice(i,1);
                continue;
            }
            if(a.type==="waystar_dash"){
                a.progress++;var t=Math.min(1,a.progress/a.duration);
                a.x=a.startX+(a.targetX-a.startX)*t;a.y=a.startY+(a.targetY-a.startY)*t;
                ally.x=a.x;ally.y=a.y;
                a.trail.push({x:a.x,y:a.y});if(a.trail.length>8)a.trail.shift();
                if(!a.hit&&Math.hypot(boss.x-a.x,boss.y-a.y)<boss.size+26){
                    a.hit=true;hitBoss(a.damage,a.x,a.y,"#ff00ff");
                    addAllyShockwave(a.x,a.y,"#ff00ff",180,18,5);addAllyFlash(a.x,a.y,70);
                    for(var ds=0;ds<5;ds++)addAllySlash(a.x,a.y,Math.random()*Math.PI*2,60,4);
                    burst(a.x,a.y,18,"#ff00ff",6);
                }
                if(a.progress>=a.duration){
                    ally.vx=0;ally.vy=0;allyAttacks.splice(i,1);
                }
                continue;
            }
            if(a.type==="blind"){
                a.timer++;
                if(a.state==="warning"){
                    var ready=true;
                    for(var wi=0;wi<a.warnings.length;wi++){
                        var warning=a.warnings[wi];warning.timer++;warning.pulse+=.15;
                        if(warning.timer>warning.delay)warning.active=true;
                        if(a.timer<30)ready=false;
                    }
                    if(a.timer>=30&&ready){
                        a.state="blind";a.blindTimer=90;a.flash=25;
                        addAllyFlash(200,250,260);addAllyShockwave(200,250,"#ffffff",350,30,6);
                        if(!a.hit){
                            a.hit=true;
                            if(typeof window.MBLivingStoneSuperCompanionStun==="function")window.MBLivingStoneSuperCompanionStun(90);
                            hitBoss(a.damage,boss.x,boss.y,"#ffffff");
                        }
                        burst(boss.x,boss.y,24,"#ffffff",7);
                    }
                }else if(a.state==="blind"){
                    if(a.flash>0)a.flash--;
                    if(--a.blindTimer<=0){a.state="fadeout";a.fadeTimer=20;}
                }else if(--a.fadeTimer<=0)allyAttacks.splice(i,1);
                continue;
            }
            if(a.type==="legion_formation"){
                a.timer++;a.life--;a.offset+=a.direction*a.speed;
                var minX=9999,maxX=-9999;
                for(var pi=0;pi<a.pieces.length;pi++){
                    var piece=a.pieces[pi];
                    if(!piece.alive)continue;
                    var px=piece.baseX+a.offset;
                    if(px-piece.size<10)minX=Math.min(minX,px-piece.size);
                    if(px+piece.size>390)maxX=Math.max(maxX,px+piece.size);
                }
                if((a.direction>0&&maxX>390)||(a.direction<0&&minX<10)){
                    a.direction*=-1;a.offset+=a.direction*2;
                }
                for(var pj=0;pj<a.pieces.length;pj++){
                    var p=a.pieces[pj];if(!p.alive)continue;
                    p.x=p.baseX+a.offset;p.y=p.baseY+Math.sin(a.timer/18+pj*.23)*2.5;
                    p.pulse+=.15;p.trail.push({x:p.x,y:p.y});if(p.trail.length>5)p.trail.shift();
                }
                a.shootTimer++;
                var shootRate=Math.max(30,80-a.pieces.length/2);
                if(a.shootTimer>=shootRate){
                    a.shootTimer=0;
                    var shooter=a.pieces[Math.floor(Math.random()*a.pieces.length)];
                    if(shooter&&shooter.alive){
                        var aim=Math.atan2(boss.y-shooter.y,boss.x-shooter.x);
                        pushOriginalWaystarProjectile("legion_shot",shooter.x,shooter.y+15,
                            Math.cos(aim)*4.8,Math.sin(aim)*4.8,8,.75,"#ff00ff",300,0);
                        addAllyFlash(shooter.x,shooter.y+15,12);
                    }
                }
                if(a.life<=0)allyAttacks.splice(i,1);
                continue;
            }
        }
    }

    function originalWaystarStar(c,x,y,radius,fill){
        c.save();c.translate(x,y);c.fillStyle=fill;c.strokeStyle="#ffffff";c.lineWidth=1.2;c.shadowColor=fill;c.shadowBlur=8;
        c.beginPath();
        for(var i=0;i<10;i++){var angle=i*Math.PI/5-Math.PI/2,r=i%2===0?radius:radius*.4,px=Math.cos(angle)*r,py=Math.sin(angle)*r;if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}
        c.closePath();c.fill();c.stroke();c.restore();
    }

    function drawAllyAttacks(c){
        c.save();
        var light=!!(window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects());
        var now=typeof performance!=="undefined"?performance.now():frame*16.67;
        for(var i=0;i<allyAttacks.length;i++){
            var a=allyAttacks[i];
            if(a.type==="solar_shard"){
                c.save();c.translate(a.x,a.y);c.rotate(a.rotation||0);
                for(var st=0;st<a.trail.length;st++){c.globalAlpha=(st+1)/a.trail.length*.32;c.fillStyle="#ffb52e";c.beginPath();c.arc(a.trail[st].x-a.x,a.trail[st].y-a.y,7*(st+1)/a.trail.length,0,Math.PI*2);c.fill();}
                c.globalAlpha=1;c.shadowColor="#ffcf45";c.shadowBlur=light?0:18;
                c.fillStyle="#ffb52e";c.beginPath();c.moveTo(15,0);c.lineTo(0,-7);c.lineTo(-13,0);c.lineTo(0,7);c.closePath();c.fill();
                c.fillStyle="#fff8bd";c.beginPath();c.moveTo(10,0);c.lineTo(0,-3);c.lineTo(-7,0);c.lineTo(0,3);c.closePath();c.fill();
                c.shadowBlur=0;c.restore();
            }else if(a.type==="meteor"||a.type==="spiral"||a.type==="star_rain"||a.type==="shotgun_bullet"||a.type==="legion_shot"){
                var color=a.type==="meteor"?"#ff8800":(a.type==="spiral"?"#ff00ff":(a.type==="shotgun_bullet"?"#ff4400":(a.type==="legion_shot"?"#ff4be8":"#ffd700")));
                for(var j=0;j<a.trail.length;j++){
                    c.globalAlpha=(1-j/a.trail.length)*.5;c.fillStyle=color;
                    c.beginPath();c.arc(a.trail[j].x,a.trail[j].y,a.size*(1-j/a.trail.length)*.7,0,Math.PI*2);c.fill();
                }
                c.globalAlpha=1;c.save();c.translate(a.x,a.y);c.rotate(a.rotation||0);
                c.fillStyle=a.type==="meteor"?"#ffd700":color;c.shadowColor=color;c.shadowBlur=light?0:10;
                c.beginPath();c.arc(0,0,a.size,0,Math.PI*2);c.fill();
                c.fillStyle="#ffffff";c.beginPath();c.arc(0,0,a.size*.5,0,Math.PI*2);c.fill();
                c.restore();
            }else if(a.type==="vertical_laser"){
                c.save();
                if(a.state==="warning"){
                    var pulse=.3+Math.sin(now/80)*.2,charge=12+Math.abs(Math.sin(now/100))*12;
                    var glow=c.createRadialGradient(a.x,490,0,a.x,490,charge*2);
                    glow.addColorStop(0,"rgba(255,255,255,.9)");glow.addColorStop(.4,"rgba(255,100,100,.6)");glow.addColorStop(1,"rgba(255,0,0,0)");
                    c.fillStyle=glow;c.beginPath();c.arc(a.x,490,charge*2,0,Math.PI*2);c.fill();
                    c.globalAlpha=pulse;c.fillStyle="#ff3333";c.fillRect(a.x-a.width/2,0,a.width,500);
                    c.globalAlpha=.9;c.strokeStyle="#ffffff";c.lineWidth=2;c.setLineDash([8,6]);
                    c.beginPath();c.moveTo(a.x-a.width/2,0);c.lineTo(a.x-a.width/2,500);
                    c.moveTo(a.x+a.width/2,0);c.lineTo(a.x+a.width/2,500);c.stroke();c.setLineDash([]);
                }else if(a.state==="active"){
                    var fadeIn=Math.min(1,(a.maxActive-a.activeTimer)/5+.3),fadeOut=Math.min(1,a.activeTimer/12),alpha=Math.min(fadeIn,fadeOut);
                    var outer=c.createLinearGradient(a.x-a.width*1.5,0,a.x+a.width*1.5,0);
                    outer.addColorStop(0,"rgba(255,50,50,0)");outer.addColorStop(.3,"rgba(255,100,50,.5)");
                    outer.addColorStop(.5,"rgba(255,255,255,.9)");outer.addColorStop(.7,"rgba(255,100,50,.5)");outer.addColorStop(1,"rgba(255,50,50,0)");
                    c.globalAlpha=alpha;c.fillStyle=outer;c.fillRect(a.x-a.width*1.5,0,a.width*3,500);
                    c.fillStyle="#ff3333";c.globalAlpha=alpha*.95;c.fillRect(a.x-a.width/2,0,a.width,500);
                    c.fillStyle="#ffffff";c.globalAlpha=alpha;c.fillRect(a.x-a.width*.18,0,a.width*.36,500);
                    c.fillStyle="#00d4ff";c.globalAlpha=alpha*.6;c.fillRect(a.x-a.width/2+4,0,6,500);c.fillRect(a.x+a.width/2-10,0,6,500);
                    c.globalAlpha=alpha;c.strokeStyle="#ffffff";c.lineWidth=2;c.beginPath();
                    c.moveTo(a.x-a.width/2,0);c.lineTo(a.x-a.width/2,500);
                    c.moveTo(a.x+a.width/2,0);c.lineTo(a.x+a.width/2,500);c.stroke();
                }
                c.restore();
            }else if(a.type==="giant_laser"){
                c.save();c.translate(a.x,a.y);c.rotate(a.angle);
                if(a.state==="warning"){
                    var warningAlpha=.4+Math.sin(now/80)*.2,chargeRadius=15+Math.abs(Math.sin(now/90))*20;
                    var chargeGlow=c.createRadialGradient(0,0,0,0,0,chargeRadius*2.5);
                    chargeGlow.addColorStop(0,"rgba(255,255,255,.95)");chargeGlow.addColorStop(.4,"rgba(255,100,255,.7)");chargeGlow.addColorStop(1,"rgba(255,0,255,0)");
                    c.fillStyle=chargeGlow;c.beginPath();c.arc(0,0,chargeRadius*2.5,0,Math.PI*2);c.fill();
                    c.globalAlpha=warningAlpha;c.fillStyle="rgba(255,0,255,.22)";c.fillRect(0,-a.width/2,820,a.width);
                    c.strokeStyle="#ffffff";c.lineWidth=2;c.setLineDash([8,6]);c.strokeRect(0,-a.width/2,820,a.width);c.setLineDash([]);
                    c.fillStyle="#ff00ff";c.beginPath();c.arc(0,0,chargeRadius,0,Math.PI*2);c.fill();
                    c.fillStyle="#ffffff";c.font="bold 22px monospace";c.textAlign="center";c.fillText("⚠",0,8);
                }else if(a.state==="active"){
                    var beamAlpha=Math.min(1,(a.maxActive-a.activeTimer)/5+.3, a.activeTimer/12);
                    var laser=c.createLinearGradient(0,-a.width*1.5,0,a.width*1.5);
                    laser.addColorStop(0,"rgba(255,0,255,0)");laser.addColorStop(.3,"rgba(255,100,255,.5)");
                    laser.addColorStop(.5,"rgba(255,255,255,.95)");laser.addColorStop(.7,"rgba(255,100,255,.5)");laser.addColorStop(1,"rgba(255,0,255,0)");
                    c.globalAlpha=beamAlpha;c.fillStyle=laser;c.fillRect(0,-a.width*1.5,820,a.width*3);
                    c.fillStyle="#ff00ff";c.globalAlpha=beamAlpha*.95;c.fillRect(0,-a.width/2,820,a.width);
                    c.fillStyle="#ffffff";c.globalAlpha=beamAlpha;c.fillRect(0,-a.width*.18,820,a.width*.36);
                    c.strokeStyle="#ffffff";c.lineWidth=2;c.beginPath();c.moveTo(0,-a.width/2);c.lineTo(820,-a.width/2);c.moveTo(0,a.width/2);c.lineTo(820,a.width/2);c.stroke();
                }
                c.restore();
            }else if(a.type==="solar_bomb"){
                if(!a.exploded){
                    var size=(a.small?25:45)*(a.sunScale||1),sunColor=a.sunColor||"#ffdd00";
                    if(light){
                        c.shadowBlur=0;c.fillStyle=sunColor;c.beginPath();c.arc(a.x,a.y,Math.max(4,size),0,Math.PI*2);c.fill();
                        c.fillStyle="#ffffff";c.beginPath();c.arc(a.x,a.y,Math.max(2,size*.28),0,Math.PI*2);c.fill();
                        c.strokeStyle=a.sunPhase==="blue"?"#55bbff":"#fff2a8";c.lineWidth=2;c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.stroke();
                    }else{
                        var auraSize=size*3.5,aura=c.createRadialGradient(a.x,a.y,0,a.x,a.y,auraSize);
                        if(a.sunPhase==="big"){aura.addColorStop(0,"rgba(255,255,200,.9)");aura.addColorStop(.3,"rgba(255,200,50,.6)");aura.addColorStop(.6,"rgba(255,100,0,.3)");aura.addColorStop(1,"rgba(255,0,0,0)");}
                        else if(a.sunPhase==="shrink"){aura.addColorStop(0,"rgba(255,255,255,.9)");aura.addColorStop(.3,"rgba(255,220,100,.6)");aura.addColorStop(.6,"rgba(255,150,50,.3)");aura.addColorStop(1,"rgba(255,0,0,0)");}
                        else if(a.sunPhase==="blue"){aura.addColorStop(0,"rgba(200,240,255,.9)");aura.addColorStop(.3,"rgba(50,150,255,.6)");aura.addColorStop(.6,"rgba(0,80,200,.3)");aura.addColorStop(1,"rgba(0,0,200,0)");}
                        else{aura.addColorStop(0,"rgba(255,255,255,1)");aura.addColorStop(.3,"rgba(200,240,255,.8)");aura.addColorStop(.6,"rgba(0,150,255,.5)");aura.addColorStop(1,"rgba(0,0,200,0)");}
                        c.fillStyle=aura;c.beginPath();c.arc(a.x,a.y,auraSize,0,Math.PI*2);c.fill();
                        var core=c.createRadialGradient(a.x,a.y,0,a.x,a.y,size);
                        core.addColorStop(0,"#ffffff");core.addColorStop(.4,sunColor);core.addColorStop(.85,sunColor);core.addColorStop(1,"rgba(255,255,255,.2)");
                        c.fillStyle=core;c.shadowColor=sunColor;c.shadowBlur=a.sunPhase==="flash"?30:18;
                        c.beginPath();c.arc(a.x,a.y,size,0,Math.PI*2);c.fill();c.shadowBlur=12;
                        if(a.sunPhase==="big"||a.sunPhase==="shrink"){
                            var rayCount=a.sunPhase==="big"?6:4;
                            for(var ray=0;ray<rayCount;ray++){
                                var ra=ray/rayCount*Math.PI*2+now/700,inner=size*1.1,outer=size*(1.25+Math.sin(now/150+ray)*.08);
                                c.strokeStyle=sunColor;c.lineWidth=2;c.beginPath();
                                c.moveTo(a.x+Math.cos(ra)*inner,a.y+Math.sin(ra)*inner);
                                c.lineTo(a.x+Math.cos(ra)*outer,a.y+Math.sin(ra)*outer);c.stroke();
                            }
                        }
                        if(a.sunPhase==="blue"){
                            c.strokeStyle="#00aaff";c.lineWidth=2;
                            for(var ring=0;ring<2;ring++){
                                var offset=ring*Math.PI+now/400;c.beginPath();
                                for(var step=0;step<=15;step++){
                                    var t=step/15,ang=offset+t*Math.PI*4,rr=size*.8*(1-t*.5);
                                    var sx=a.x+Math.cos(ang)*rr,sy=a.y+Math.sin(ang)*rr;
                                    if(step===0)c.moveTo(sx,sy);else c.lineTo(sx,sy);
                                }
                                c.stroke();
                            }
                        }
                    }
                    var warnPulse=Math.max(0,.25+Math.sin(a.timer/10)*.25);
                    c.globalAlpha=warnPulse;c.strokeStyle=a.sunPhase==="blue"?"#00aaff":"#ff3333";
                    c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.stroke();c.setLineDash([]);
                    c.globalAlpha=1;
                    if(a.sunPhase==="flash"){
                        c.strokeStyle="#ffffff";c.lineWidth=2;c.beginPath();
                        c.moveTo(a.x-size*.7,a.y);c.lineTo(a.x+size*.7,a.y);
                        c.moveTo(a.x,a.y-size*.7);c.lineTo(a.x,a.y+size*.7);c.stroke();
                    }
                }else{
                    var explosionProgress=1-a.explosionTimer/20,explosionAlpha=1-explosionProgress;
                    if(light){
                        c.globalAlpha=Math.max(.15,explosionAlpha);c.strokeStyle="#55bbff";c.lineWidth=3;
                        c.beginPath();c.arc(a.x,a.y,Math.max(1,a.radius*explosionProgress*1.25),0,Math.PI*2);c.stroke();
                    }else{
                        c.globalAlpha=explosionAlpha;var ringR=a.radius*explosionProgress*1.3;
                        var ringGrad=c.createRadialGradient(a.x,a.y,0,a.x,a.y,Math.max(1,ringR));
                        ringGrad.addColorStop(0,"rgba(255,255,255,.9)");ringGrad.addColorStop(.3,"rgba(100,200,255,.7)");
                        ringGrad.addColorStop(.6,"rgba(0,100,255,.4)");ringGrad.addColorStop(1,"rgba(0,0,255,0)");
                        c.fillStyle=ringGrad;c.beginPath();c.arc(a.x,a.y,Math.max(1,ringR),0,Math.PI*2);c.fill();
                        c.globalAlpha=explosionAlpha*.9;var coreR=Math.max(1,a.radius*explosionProgress*.5);
                        var coreGrad=c.createRadialGradient(a.x,a.y,0,a.x,a.y,coreR);
                        coreGrad.addColorStop(0,"#ffffff");coreGrad.addColorStop(.5,"#aaddff");coreGrad.addColorStop(1,"rgba(0,120,255,0)");
                        c.fillStyle=coreGrad;c.beginPath();c.arc(a.x,a.y,coreR,0,Math.PI*2);c.fill();
                    }
                    c.globalAlpha=1;
                }
            }else if(a.type==="waystar_dash"){
                // Original dash telegraph: six shrinking magenta echoes along the captured route.
                for(var d=0;d<6;d++){
                    var t=d/6,dx=a.startX+(a.targetX-a.startX)*t,dy=a.startY+(a.targetY-a.startY)*t;
                    c.globalAlpha=(1-t)*.35;c.fillStyle="#ff00ff";c.beginPath();c.arc(dx,dy,18*(1-t),0,Math.PI*2);c.fill();
                }
                c.globalAlpha=1;
            }else if(a.type==="blind"){
                if(a.state==="warning"){
                    for(var wi=0;wi<a.warnings.length;wi++){
                        var w=a.warnings[wi];if(!w.active)continue;
                        var pulse=1+Math.sin(w.pulse)*.3,alpha=Math.min(1,(w.timer-w.delay)/10);
                        c.save();c.globalAlpha=alpha;c.translate(w.x,w.y);c.scale(pulse,pulse);
                        c.fillStyle="#ffcc00";c.strokeStyle="#000000";c.lineWidth=3;
                        c.beginPath();c.moveTo(0,-22);c.lineTo(20,18);c.lineTo(-20,18);c.closePath();c.fill();c.stroke();
                        c.fillStyle="#000000";c.font="bold 22px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText("!",0,6);
                        c.shadowColor="#ffcc00";c.shadowBlur=20;c.strokeStyle="#ffffff";c.lineWidth=2;
                        c.beginPath();c.arc(0,0,28+Math.sin(w.pulse*1.5)*4,0,Math.PI*2);c.stroke();c.restore();
                    }
                }else{
                    // The blindness affects the boss's area, not the player's whole screen.
                    var target=bossPoint();
                    var blindAlpha=a.state==="blind"?.52:(a.fadeTimer/20)*.52;
                    var blindGlow=c.createRadialGradient(target.x,target.y,8,target.x,target.y,112);
                    blindGlow.addColorStop(0,"rgba(0,0,0,.88)");
                    blindGlow.addColorStop(.55,"rgba(0,0,0,.50)");
                    blindGlow.addColorStop(1,"rgba(0,0,0,0)");
                    c.globalAlpha=blindAlpha;c.fillStyle=blindGlow;
                    c.beginPath();c.arc(target.x,target.y,112,0,Math.PI*2);c.fill();
                    if(a.state==="blind"&&a.blindTimer>30){
                        c.globalAlpha=Math.min(1,(a.blindTimer-30)/20)*.75;
                        c.fillStyle="#ff0000";c.font="bold 22px monospace";c.textAlign="center";
                        c.shadowColor="#ff0000";c.shadowBlur=18;
                        c.fillText("💀",target.x,target.y+5);
                        c.font="bold 11px monospace";c.fillText("НИЧЕГО НЕ ВИДНО",target.x,target.y+27);
                        c.shadowBlur=0;
                    }
                    if(a.flash>0){
                        c.globalAlpha=a.flash/25*.45;c.strokeStyle="#ffffff";c.lineWidth=5;
                        c.beginPath();c.arc(target.x,target.y,46+(25-a.flash)*4,0,Math.PI*2);c.stroke();
                    }
                    c.globalAlpha=1;
                }
            }else if(a.type==="legion_formation"){
                for(var pi=0;pi<a.pieces.length;pi++){
                    var piece=a.pieces[pi];if(!piece.alive)continue;
                    for(var tr=0;tr<piece.trail.length;tr++){
                        c.globalAlpha=(1-tr/piece.trail.length)*.4;c.fillStyle="#ffd700";
                        c.beginPath();c.arc(piece.trail[tr].x,piece.trail[tr].y,piece.size*(1-tr/piece.trail.length)*.6,0,Math.PI*2);c.fill();
                    }
                    c.globalAlpha=1;c.save();c.translate(piece.x,piece.y);
                    var pulse=1+Math.sin(piece.pulse)*.12;c.scale(pulse,pulse);
                    originalWaystarStar(c,0,0,piece.size,piece.hp>=2?"#ffd700":"#ff6600");c.restore();
                }
            }
        }
        c.restore();
    }

    function drawAllyStatus(c) {
        if (!ally.alive) {
            c.save(); c.font="bold 10px Arial"; c.textAlign="center";
            c.fillStyle="#ff9acb"; c.shadowColor="#ff40a0"; c.shadowBlur=8;
            c.fillText("ПУТЕВОДНАЯ ЗВЕЗДА ВЫБЫЛА",ally.x,ally.y-28); c.restore();
            return;
        }
        c.save();
        var barW=58, barX=ally.x-barW/2, barY=ally.y-36;
        c.fillStyle="rgba(0,0,0,.72)"; c.fillRect(barX-2,barY-3,barW+4,7);
        c.fillStyle="#26132b"; c.fillRect(barX,barY,barW,5);
        c.fillStyle=ally.hp>ally.maxHp*.3?"#a5f4ff":"#ff83bb";
        c.fillRect(barX,barY,barW*Math.max(0,ally.hp/ally.maxHp),5);
        if (ally.hitFlash > 0) {
            c.strokeStyle="#ffffff"; c.lineWidth=2; c.globalAlpha=ally.hitFlash/15;
            c.beginPath(); c.arc(ally.x,ally.y,30,0,Math.PI*2); c.stroke();
        }
        c.restore();
    }

    function wasSpared() {
        try {
            var hasSlot = typeof slotData !== "undefined" && slotData;
            var hasExplicitMercy = hasSlot &&
                Object.prototype.hasOwnProperty.call(slotData, "waystarOwesDebt");
            var savedValue = hasSlot ? slotData.waystarOwesDebt : false;
            // A current save's explicit false means she was killed. Never let the
            // generic "encounter completed" flag override that newer decision.
            if (hasExplicitMercy) {
                return savedValue === true || savedValue === 1 || savedValue === "true";
            }
            if (window.waystarOwesDebt === true) return true;
            // Compatibility for pre-mercy saves: game.js migrates their old
            // completion marker into waystarOwesDebt when the explicit field is absent.
            var legacyValue = hasSlot ? slotData.waystarDefeatedThisRun : false;
            return window.waystarDefeatedThisRun === true || legacyValue === true ||
                legacyValue === 1 || legacyValue === "true";
        } catch (e) { return false; }
    }

    function phase() {
        return (typeof window !== "undefined" && window.__mbLS2GreenPhase) || "normal";
    }

    function encounterEligible() {
        // The spared Star is reserved exclusively for Living Stone Prime.
        // Ordinary Living Stone must never activate or display this companion.
        if (!wasSpared() ||
            typeof livingStoneActive === "undefined" || !livingStoneActive ||
            window.livingStoneSuperActive !== true ||
            window.__mbLS2AfterChase !== true ||
            (typeof finalSceneActive !== "undefined" && finalSceneActive) ||
            window.__mbLivingStoneChaseActive === true) return false;

        return phase() === "normal" || phase() === "green";
    }

    function normalActionsEligible() {
        return encounterEligible() && phase() === "normal";
    }

    function announce(message, color, life) {
        if (typeof spawnLivingStoneText === "function")
            spawnLivingStoneText(200, 305, message, color || "#bcefff", life || 70);
    }

    function burst(x, y, count, color, speed) {
        if (typeof spawnLivingStoneParticles === "function")
            spawnLivingStoneParticles(x, y, count, color || "#aeeaff", speed || 4);
    }

    function maxBossHp() {
        var hp = 0;
        if (window.livingStoneSuperActive === true && typeof window.getLivingStoneSuperBossMaxHp === "function") {
            try { hp = Number(window.getLivingStoneSuperBossMaxHp()) || 0; } catch (e) {}
        }
        if (!(hp > 0) && typeof livingStoneBossMaxHp !== "undefined") hp = Number(livingStoneBossMaxHp) || 0;
        return Math.max(1, hp);
    }

    function currentBossHp() {
        if (typeof livingStoneBossHp !== "undefined" && Number.isFinite(Number(livingStoneBossHp)))
            return Number(livingStoneBossHp);
        return maxBossHp();
    }

    function startSupport() {
        if (!wasSpared() || window.livingStoneSuperActive !== true) return false;
        if (supportRequested && allyInitialized) return true;
        supportRequested = true;
        active = false;
        frame = 0;
        strikeTimer = 95;
        guardCooldown = 0;
        guardFlash = 0;
        strikeFlash = 0;
        supportDimTimer = 0;
        attackPause = 0;
        route = null;
        routeTimer = 0;
        routeHitFlash = 0;
        blockStars = 0;
        constellationFlash = 0;
        finalLockTimer = 0;
        finalLockTriggered = false;
        finalDialogueStage = 0;
        lastPhase = "";
        resetAlly();
        return true;
    }

    function strike() {
        if (!normalActionsEligible() || attackPause > 0 ||
            typeof livingStoneBoss === "undefined" || !livingStoneBoss) return;
        var damage = Math.min(Math.max(1, Math.floor(maxBossHp() * 0.012)), Math.max(0, currentBossHp() - 1));
        if (!(damage > 0)) return;
        if (typeof damageLivingStone === "function") damageLivingStone(damage);
        else if (typeof window.MBLivingStoneSuperDamage === "function") window.MBLivingStoneSuperDamage(damage);
        else return;

        strikeFlash = 42;
        burst(livingStoneBoss.x || 200, livingStoneBoss.y || 110, 18, "#aeeaff", 5);
        announce("ЗВЁЗДНЫЙ УДАР!", "#bcefff", 48);
        if (typeof playArenaSound === "function") playArenaSound(960, "sine", 0.22, 0.075);
    }

    function beginFinalLock() {
        if (finalLockTriggered || !normalActionsEligible() ||
            typeof window.MBLivingStoneSuperWaystarFinalLock !== "function") return;
        var started = window.MBLivingStoneSuperWaystarFinalLock(165);
        if (started === false) return;

        finalLockTriggered = true;
        finalLockTimer = 165;
        finalDialogueStage = 1;
        route = null;
        routeTimer = 0;
        announce("В ПРОШЛЫЙ РАЗ ТЫ НЕ ДАЛ МНЕ ПРОИГРАТЬ...", "#d8f5ff", 105);
        burst(livingStoneBoss.x || 200, livingStoneBoss.y || 110, 26, "#b8edff", 5);
        if (typeof playArenaSound === "function") playArenaSound(1180, "sine", 0.42, 0.09);
    }

    function update() {
        if (!encounterEligible()) {
            active = false;
            if (guardFlash > 0) guardFlash--;
            if (strikeFlash > 0) strikeFlash--;
            return;
        }

        var generation = typeof livingStoneEncounterGeneration !== "undefined"
            ? Number(livingStoneEncounterGeneration) || 0 : 0;
        var newEncounter = activeEncounterGeneration !== generation;
        if (!active || newEncounter) {
            active = true;
            supportRequested = true;
            activeEncounterGeneration = generation;
            frame = 0;
            strikeTimer = 95;
            guardCooldown = 0;
            guardFlash = 0;
            strikeFlash = 0;
            supportDimTimer = 0;
            attackPause = 0;
            route = null;
            routeTimer = 0;
            routeHitFlash = 0;
            blockStars = 0;
            constellationFlash = 0;
            finalLockTimer = 0;
            finalLockTriggered = false;
            finalDialogueStage = 0;
            lastPhase = "";
            // A brief phase/eligibility interruption must not resurrect a defeated ally.
            var initializeAlly = !allyInitialized || newEncounter;
            if (initializeAlly) resetAlly();
            supportX = Number(livingStonePlayer.x) || 200;
            supportY = Number(livingStonePlayer.y) || 400;
            if (initializeAlly) announce("Я ОБЕЩАЛА ВЕРНУТЬСЯ. И Я ЗДЕСЬ.", "#bcefff", 95);
        }

        frame++;
        var currentPhase = phase();
        if (attackPause > 0) attackPause--;
        if (lastPhase === "green" && currentPhase !== "green") {
            blockStars = 0;
            constellationFlash = 0;
        }
        lastPhase = currentPhase;

        if (currentPhase === "normal") {
            if (guardCooldown > 0) guardCooldown--;
            if (strikeTimer > 0) strikeTimer--;
            if (routeTimer > 0) routeTimer--;
            if (routeHitFlash > 0) routeHitFlash--;
            if (supportDimTimer > 0) supportDimTimer--;
            if (finalLockTimer > 0) {
                finalLockTimer--;
                if (finalDialogueStage === 1 && finalLockTimer <= 95) {
                    finalDialogueStage = 2;
                    announce("ТЕПЕРЬ Я НЕ ДАМ ТЕБЕ ЗАБРАТЬ ЕГО ПОБЕДУ!", "#d8f5ff", 95);
                }
            }
            if (routeTimer <= 0) route = null;

            var hpRatio = currentBossHp() / maxBossHp();
            if (hpRatio <= 0.12 && !finalLockTriggered) beginFinalLock();
        } else {
            // The green-heart shield round pauses the ally's combat and preserves her exact state.
            // No reset occurs here: if the Star fell earlier, she stays defeated for this encounter.
            route = null;
            routeTimer = 0;
            if (constellationFlash > 0) {
                constellationFlash--;
                if (constellationFlash <= 0) blockStars = 0;
            }
            if (routeHitFlash > 0) routeHitFlash--;
            if (guardFlash > 0) guardFlash--;
            if (strikeFlash > 0) strikeFlash--;
            supportX = ally.x;
            supportY = ally.y;
            return;
        }

        if (guardFlash > 0) guardFlash--;
        if (strikeFlash > 0) strikeFlash--;
        updateAlly();
        supportX = ally.x;
        supportY = ally.y;
    }

    function tryProtect(incoming) {
        if (!normalActionsEligible() || guardCooldown > 0) return false;

        incoming = Math.max(0, Number(incoming) || 0);
        var hp = typeof livingStonePlayerHp !== "undefined" ? Number(livingStonePlayerHp) : 0;
        var maxHp = typeof livingStonePlayerMaxHp !== "undefined" ? Number(livingStonePlayerMaxHp) : hp;
        if (!(hp > 0) || !(maxHp > 0)) return false;

        var remainingHp = hp - incoming;
        var critical = remainingHp <= 0 || remainingHp <= maxHp * 0.22;
        if (!critical) return false;

        guardCooldown = 900;
        guardFlash = 64;
        if (typeof livingStoneInvulnTimer !== "undefined") livingStoneInvulnTimer = 55;
        supportDimTimer = 240;
        attackPause = 240;
        strikeTimer = Math.max(strikeTimer, 240);
        route = null;
        routeTimer = 0;

        if (typeof livingStonePlayer !== "undefined" && livingStonePlayer &&
            typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            var dx = livingStonePlayer.x - livingStoneBoss.x;
            var dy = livingStonePlayer.y - livingStoneBoss.y;
            var length = Math.sqrt(dx * dx + dy * dy) || 1;
            livingStonePlayer.x = Math.max(18, Math.min(382, livingStonePlayer.x + dx / length * 12));
            livingStonePlayer.y = Math.max(82, Math.min(482, livingStonePlayer.y + dy / length * 12));
            supportX = livingStonePlayer.x + dx / length * 18;
            supportY = livingStonePlayer.y + dy / length * 18;
        }

        burst(livingStonePlayer.x, livingStonePlayer.y, 24, "#9deaff", 5);
        announce("НА ЭТОТ РАЗ Я УСПЕЛА!", "#d8f5ff", 90);
        if (typeof playArenaSound === "function") playArenaSound(620, "triangle", 0.35, 0.08);
        return true;
    }

    function onDodgePrediction(from, target) {
        if (!normalActionsEligible() || !from || !target) return false;
        var fromX = Number(from.x), fromY = Number(from.y);
        var targetX = Number(target.x), targetY = Number(target.y);
        if (![fromX, fromY, targetX, targetY].every(Number.isFinite)) return false;
        route = { fromX: fromX, fromY: fromY, targetX: targetX, targetY: targetY };
        routeTimer = 190;
        return true;
    }

    function tryRouteHit(bullet, boss) {
        if (!normalActionsEligible() || !route || routeTimer <= 0 || !bullet || !boss) return false;
        var bossDistance = Math.hypot(Number(boss.x) - route.targetX, Number(boss.y) - route.targetY);
        var bulletDistance = Math.hypot(Number(bullet.x) - route.targetX, Number(bullet.y) - route.targetY);
        if (bossDistance > 58 || bulletDistance > 66) return false;
        route = null;
        routeTimer = 0;
        routeHitFlash = 42;
        return true;
    }

    function onGreenBlock() {
        if (!encounterEligible() || phase() !== "green" || constellationFlash > 0) return false;
        blockStars = Math.min(3, blockStars + 1);
        burst(supportX, supportY, 5, "#baf4ff", 2.5);
        if (blockStars >= 3) {
            constellationFlash = 95;
            announce("ДА! ВОТ ТАК!", "#d8f5ff", 75);
            if (typeof playArenaSound === "function") playArenaSound(1040, "triangle", 0.2, 0.07);
            return true;
        }
        return false;
    }

    function resetGreenBlocks() {
        blockStars = 0;
        constellationFlash = 0;
    }

    function drawStar(c, x, y, radius, rotation, color) {
        c.save();
        c.translate(x, y);
        c.rotate(rotation || 0);
        c.beginPath();
        for (var i = 0; i < 8; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 4;
            var r = i % 2 === 0 ? radius : radius * 0.38;
            var px = Math.cos(a) * r, py = Math.sin(a) * r;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = color || "#dff8ff";
        c.shadowColor = color || "#a8eaff";
        c.shadowBlur = 10;
        c.fill();
        c.restore();
    }

    function draw(c) {
        if (!active || !encounterEligible() || !c ||
            typeof livingStonePlayer === "undefined" ||
            typeof window.MBDrawWaystarCompanion !== "function") return;

        var now = typeof performance !== "undefined" ? performance.now() : Date.now();
        var pulse = 1 + Math.sin(now / 135) * 0.1;
        var px = livingStonePlayer.x, py = livingStonePlayer.y;
        var sx = ally.x || supportX || px + 35, sy = ally.y || supportY || py - 22;
        var isGreen = phase() === "green";
        var alpha = supportDimTimer > 0 ? 0.38 : 1;

        c.save();
        c.globalAlpha = 0.65 * alpha;
        c.strokeStyle = "rgba(111,218,255,.60)";
        c.lineWidth = 1.6;
        c.shadowColor = "#80dcff";
        c.shadowBlur = window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects() ? 0 : 12;
        c.beginPath();
        c.ellipse(sx, sy, 26 * pulse, 13 * pulse, Math.sin(now / 700) * 0.35, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;

        if (route && routeTimer > 0 && !isGreen) {
            var routeAlpha = Math.min(0.95, routeTimer / 42);
            c.globalAlpha = routeAlpha;
            c.strokeStyle = "#b7eeff";
            c.lineWidth = 2;
            c.setLineDash([4, 6]);
            c.beginPath();
            c.moveTo(route.fromX, route.fromY);
            c.lineTo(route.targetX, route.targetY);
            c.stroke();
            c.setLineDash([]);
            for (var ri = 1; ri <= 5; ri++) {
                var rt = ri / 6;
                drawStar(c, route.fromX + (route.targetX - route.fromX) * rt,
                    route.fromY + (route.targetY - route.fromY) * rt,
                    4 + Math.sin(now / 90 + ri) * 1.2, now / 500, "#c9f4ff");
            }
            c.strokeStyle = "#effcff";
            c.lineWidth = 2.3;
            c.beginPath();
            c.arc(route.targetX, route.targetY, 17 + Math.sin(now / 70) * 3, 0, Math.PI * 2);
            c.stroke();
            drawStar(c, route.targetX, route.targetY, 10, now / 300, "#f0fcff");
        }

        if (constellationFlash > 65 && typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            c.globalAlpha = Math.min(1, (constellationFlash - 65) / 20);
            c.strokeStyle = "#e8fbff";
            c.lineWidth = 4;
            c.shadowColor = "#a7eaff";
            c.shadowBlur = 16;
            c.beginPath();
            c.moveTo(sx, sy);
            c.lineTo(livingStoneBoss.x, livingStoneBoss.y);
            c.stroke();
            c.shadowBlur = 0;
        }

        if (blockStars > 0 && isGreen) {
            var starOffsets = [{ x: -15, y: -28 }, { x: 0, y: -36 }, { x: 15, y: -28 }];
            c.globalAlpha = 0.9;
            if (blockStars >= 3 || constellationFlash > 0) {
                c.strokeStyle = "#d9f7ff";
                c.lineWidth = 2;
                c.shadowColor = "#9eeaff";
                c.shadowBlur = constellationFlash > 0 ? 14 : 6;
                c.beginPath();
                c.moveTo(sx + starOffsets[0].x, sy + starOffsets[0].y);
                c.lineTo(sx + starOffsets[1].x, sy + starOffsets[1].y);
                c.lineTo(sx + starOffsets[2].x, sy + starOffsets[2].y);
                c.closePath();
                c.stroke();
                c.shadowBlur = 0;
            }
            for (var bi = 0; bi < blockStars; bi++) {
                drawStar(c, sx + starOffsets[bi].x, sy + starOffsets[bi].y,
                    constellationFlash > 0 ? 7 : 5, now / 420, "#e3faff");
            }
        }

        if (strikeFlash > 0 || routeHitFlash > 0) {
            c.globalAlpha = Math.min(1, Math.max(strikeFlash, routeHitFlash) / 22);
            c.strokeStyle = "#f1fcff";
            c.lineWidth = routeHitFlash > 0 ? 4 : 3;
            c.beginPath();
            c.moveTo(sx, sy);
            c.lineTo(livingStoneBoss.x || 200, livingStoneBoss.y || 110);
            c.stroke();
        }

        if (guardFlash > 0) {
            c.globalAlpha = Math.min(0.9, guardFlash / 30);
            c.strokeStyle = "#b9efff";
            c.lineWidth = 3;
            c.beginPath();
            c.arc(px, py, 26 + (64 - guardFlash) * 0.55, 0, Math.PI * 2);
            c.stroke();
        }

        if (finalLockTimer > 0 && typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            var bx = livingStoneBoss.x, by = livingStoneBoss.y;
            var lockAlpha = Math.min(1, finalLockTimer / 24);
            var lockPulse = 1 + Math.sin(now / 75) * 0.045;
            c.globalAlpha = lockAlpha;
            c.strokeStyle = "#d6f6ff";
            c.lineWidth = 2.4;
            c.shadowColor = "#84ddff";
            c.shadowBlur = 14;
            c.beginPath();
            c.arc(bx, by, 58 * lockPulse, 0, Math.PI * 2);
            c.stroke();
            c.beginPath();
            for (var ci = 0; ci < 8; ci++) {
                var ca = -Math.PI / 2 + ci * Math.PI / 4;
                var cx = bx + Math.cos(ca) * 58 * lockPulse;
                var cy = by + Math.sin(ca) * 58 * lockPulse;
                if (ci === 0) c.moveTo(cx, cy);
                else c.lineTo(cx, cy);
            }
            c.closePath();
            c.stroke();
            c.shadowBlur = 0;
            for (var si = 0; si < 8; si++) {
                var sa = now / 700 + si * Math.PI / 4;
                drawStar(c, bx + Math.cos(sa) * 58, by + Math.sin(sa) * 58, 6, sa, "#effcff");
            }
        }
        c.restore();

        drawAllyEffects(c);
        drawAllyAttacks(c);
        if (ally.alive) window.MBDrawWaystarCompanion(sx, sy, 27);
        drawAllyStatus(c);
    }

    function stop() {
        active = false;
        supportRequested = false;
        frame = 0;
        guardFlash = 0;
        strikeFlash = 0;
        supportDimTimer = 0;
        attackPause = 0;
        strikeTimer = 95;
        guardCooldown = 0;
        route = null;
        routeTimer = 0;
        routeHitFlash = 0;
        blockStars = 0;
        constellationFlash = 0;
        finalLockTimer = 0;
        finalLockTriggered = false;
        finalDialogueStage = 0;
        lastPhase = "";
        allyAttacks.length = 0;
        allyParticles.length = 0;
        allyAttackQueue.length = 0;
        allyEffects.shockwaves.length = 0; allyEffects.lightning.length = 0;
        allyEffects.slashes.length = 0; allyEffects.flashes.length = 0; allyEffects.particles.length = 0;
        allyInitialized = false;
        activeEncounterGeneration = -1;
    }

    window.MBWaystarAllyState = function () {
        return { alive: !!ally.alive, hp: ally.hp, maxHp: ally.maxHp, x: ally.x, y: ally.y };
    };
    window.MBHasWaystarCompanion = wasSpared;
    window.MBStartWaystarCompanionSupport = startSupport;
    window.MBUpdateWaystarCompanion = update;
    window.MBDrawWaystarCompanionSupport = draw;
    window.MBWaystarTryProtect = tryProtect;
    window.MBWaystarOnDodgePrediction = onDodgePrediction;
    window.MBWaystarTryRouteHit = tryRouteHit;
    window.MBWaystarOnGreenBlock = onGreenBlock;
    window.MBWaystarResetGreenBlocks = resetGreenBlocks;
    window.MBStopWaystarCompanion = stop;
})();