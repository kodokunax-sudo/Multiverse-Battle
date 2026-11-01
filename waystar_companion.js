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
    var allyAttackSerial = 0;
    var WAYSTAR_ALLY_SPEED = 5.2;

    function resetAlly() {
        ally.x = 200; ally.y = 300; ally.vx = 0; ally.vy = 0;
        ally.hp = ally.maxHp = 150; ally.phase = 0; ally.invuln = 0;
        ally.hitFlash = 0; ally.attackTimer = 105; ally.attackPattern = 0;
        ally.alive = true; ally.targetX = 200; ally.targetY = 300;
        ally.windup = 0; ally.dashFlash = 0; allyDeathTimer = 0;
        allyAttacks.length = 0; allyParticles.length = 0; allyAttackQueue.length = 0; allyAttackSerial = 0;
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
        // Each shard is a small hit. Whole patterns add up to Oden-like steady support DPS.
        return Math.max(1, Math.floor(maxBossHp() * 0.0007 * (Number(weight) || 1)));
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

    function launchAllyPattern(){
        if(!ally.alive||!encounterEligible()||currentBossHp()<=0)return;
        var boss=bossPoint(),tx=Math.max(35,Math.min(365,boss.x+boss.vx*9));
        var ty=Math.max(65,Math.min(230,boss.y+boss.vy*7));
        var base=Math.atan2(ty-ally.y,tx-ally.x);
        var escalation=Math.min(5,Math.floor(allyAttackSerial/4));
        var pattern=ally.attackPattern++%12;
        allyAttackSerial++;ally.windup=[2,3,6,8,10].indexOf(pattern)>=0?28:12;
        var s1=1.3,s3=1.3*.7;

        if(pattern===0){
            // Phase 1: falling meteors, same count, speed and spin as the boss attack.
            var count=escalation>=2?4:2;
            for(var i=0;i<count;i++){
                var mx=Math.max(20,Math.min(380,tx+(i-(count-1)/2)*34+(Math.random()-.5)*24));
                pushOriginalWaystarProjectile("meteor",mx,-40-Math.random()*50,
                    (Math.random()-.5)*1.5*s1,(2.5+Math.random()*1.8)*s1,
                    12+Math.random()*6,1.15,"#ffd700",400,(Math.random()-.5)*.2);
            }
            announce("ПАДАЮЩИЕ МЕТЕОРЫ!","#ffcf57",45);
        }else if(pattern===1){
            // Phase 1: the original two-turn spiral and six-frame stagger.
            var n=escalation>=2?14:10,start=Math.random()*Math.PI*2;
            for(var j=0;j<n;j++){
                var angle=start+(j/n)*Math.PI*4;
                queueOriginalWaystarProjectile(j*6,["spiral",ally.x,ally.y,
                    Math.cos(angle)*3*s1,Math.sin(angle)*3*s1,7,.92,"#ff00ff",350,0]);
            }
            announce("ДВУХВИТКОВАЯ СПИРАЛЬ!","#ff55ed",45);
        }else if(pattern===2){
            // Phase 1: 70-frame full-height red laser warning, then 50 active frames.
            allyAttacks.push({type:"vertical_laser",state:"warning",
                x:Math.max(55,Math.min(345,tx+(Math.random()-.5)*18)),width:55,
                warningTimer:70,activeTimer:0,maxActive:50,damage:allyDamageAmount(2.1),hit:false,chargeParticles:0});
            announce("ВЕРТИКАЛЬНЫЙ ЛАЗЕР!","#ff6666",48);
        }else if(pattern===3){
            // Phase 1: four delayed corner warnings and the blindness effect.
            allyAttacks.push({type:"blind",state:"warning",timer:0,blindTimer:0,fadeTimer:0,
                warnings:[
                    {x:50,y:80,delay:0,timer:0,active:false,pulse:0},
                    {x:350,y:80,delay:8,timer:0,active:false,pulse:1},
                    {x:50,y:430,delay:16,timer:0,active:false,pulse:2},
                    {x:350,y:430,delay:24,timer:0,active:false,pulse:3}
                ],damage:allyDamageAmount(1.9),hit:false});
            announce("ЗВЕЗДА ГОТОВИТ ОСЛЕПЛЕНИЕ!","#ffcc00",55);
        }else if(pattern===4){
            // Phase 1: diagonal star rain from both edges.
            var rain=escalation>=2?10:7;
            for(var r=0;r<rain;r++){
                var side=r%2===0?1:-1;
                var y=Math.max(-90,Math.min(190,ty+(Math.random()-.5)*115));
                pushOriginalWaystarProjectile("star_rain",side>0?-30:430,y,
                    (side>0?3.5:-3.5)*s1,2.2*s1,10,.92,"#ffd700",350,(Math.random()-.5)*.2);
            }
            announce("ЗВЁЗДНЫЙ ДОЖДЬ!","#ffeaa0",45);
        }else if(pattern===5){
            // Phase 3: original shotgun fan (5+, 0.14-radian spacing, same speed).
            var shotgun=5+Math.floor(escalation/2);
            for(var q=0;q<shotgun;q++){
                var a=base+(q-(shotgun-1)/2)*.14;
                pushOriginalWaystarProjectile("shotgun_bullet",ally.x,ally.y,
                    Math.cos(a)*2.8*s3,Math.sin(a)*2.8*s3,6,1,"#ff4400",350,0);
            }
            announce("ДРОБОВОЙ ЗАЛП!","#ff795a",45);
        }else if(pattern===6){
            // Phase 3: large sun bombs with original 220-frame fuse.
            var bombs=1+Math.floor(escalation/2);
            for(var b=0;b<bombs;b++)queueOriginalWaystarBomb(b*55,false);
            announce("СОЛНЕЧНАЯ БОМБА!","#ffd75d",50);
        }else if(pattern===7){
            // Phase 3: the original 80-frame targeted dash.
            var dx=tx-ally.x,dy=ty-ally.y,len=Math.hypot(dx,dy)||1;
            allyAttacks.push({type:"waystar_dash",x:ally.x,y:ally.y,startX:ally.x,startY:ally.y,
                targetX:tx,targetY:ty,dirX:dx/len,dirY:dy/len,progress:0,duration:80,
                damage:allyDamageAmount(2.5),hit:false,trail:[]});
            ally.dashFlash=30;
            announce("РЫВОК ПУТЕВОДНОЙ ЗВЕЗДЫ!","#ff69ef",48);
        }else if(pattern===8){
            // Phase 3: the original tracking giant laser (100 warning / 60 tracking / 40 active).
            allyAttacks.push({type:"giant_laser",state:"warning",x:ally.x,y:ally.y,angle:base,
                width:55,warningTimer:100,activeTimer:0,maxActive:40,trackTimer:60,
                damage:allyDamageAmount(3.2),hit:false});
            announce("ГИГА-ЛАЗЕР ЗВЕЗДЫ!","#ff74e9",55);
        }else if(pattern===9){
            // Phase 3: two opposite delayed spiral arms, 14 per side before escalation.
            var twin=14+escalation*2;
            for(var t=0;t<twin;t++){
                var ang=(t/twin)*Math.PI*4;
                queueOriginalWaystarProjectile(t*9,["spiral",ally.x,ally.y,
                    Math.cos(ang)*1.8*s3,Math.sin(ang)*1.8*s3,6,.72,"#ff00ff",350,0]);
                queueOriginalWaystarProjectile(t*9,["spiral",ally.x,ally.y,
                    Math.cos(-ang)*1.8*s3,Math.sin(-ang)*1.8*s3,6,.72,"#ff00ff",350,0]);
            }
            announce("ДВОЙНАЯ СПИРАЛЬ!","#ff4ceb",48);
        }else if(pattern===10){
            // Phase 3: original small solar mines and 42-frame stagger.
            var mines=3+Math.floor(escalation/2);
            for(var m=0;m<mines;m++)queueOriginalWaystarBomb(m*42,true);
            announce("СОЛНЕЧНЫЕ МИНЫ!","#ffce64",48);
        }else{
            // Original Legion: 60 fragments arranged as ten columns by six rows.
            var pieces=[];
            for(var row=0;row<6;row++)for(var col=0;col<10;col++){
                var idx=row*10+col;
                pieces.push({x:ally.x+(col-4.5)*17,y:ally.y-48+row*17,
                    delay:38+row*4+col*.55,vx:0,vy:0,size:4.2+(idx%3)*.45,
                    rotation:Math.random()*Math.PI*2,life:180,launched:false,hit:false,
                    damage:allyDamageAmount(.18),
                    color:idx%3===0?"#ffffff":(idx%2?"#ff00dd":"#ffd700"),trail:[]});
            }
            allyAttacks.push({type:"legion_formation",pieces:pieces,timer:0,targetX:tx,targetY:ty});
            announce("Я - ЛЕГИОН! 60 ОСКОЛКОВ!","#ffe6a0",60);
        }
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
            if(a.type==="meteor"||a.type==="spiral"||a.type==="star_rain"||a.type==="shotgun_bullet"){
                var limit=window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects()?2:6;
                a.trail.push({x:a.x,y:a.y});if(a.trail.length>limit)a.trail.shift();
                a.x+=a.vx;a.y+=a.vy;a.rotation+=a.rotSpeed||0;a.life--;
                if(Math.hypot(boss.x-a.x,boss.y-a.y)<boss.size+a.size){
                    hitBoss(a.damage,a.x,a.y,a.color);burst(a.x,a.y,8,a.color,4);allyAttacks.splice(i,1);continue;
                }
                if(a.y>520||a.x<-30||a.x>430||a.life<=0){
                    if(a.y>500&&a.type==="meteor")burst(a.x,500,10,"#ff8800",4);
                    allyAttacks.splice(i,1);
                }
                continue;
            }
            if(a.type==="vertical_laser"){
                if(a.state==="warning"){a.warningTimer--;a.chargeParticles++;if(a.warningTimer<=0){a.state="active";a.activeTimer=a.maxActive;}}
                else if(a.state==="active"){
                    a.activeTimer--;
                    if(!a.hit&&Math.abs(boss.x-a.x)<a.width/2+boss.size*.5){a.hit=true;hitBoss(a.damage,a.x,boss.y,"#fff0f0");}
                    if(a.activeTimer<=0)a.state="done";
                }else allyAttacks.splice(i,1);
                continue;
            }
            if(a.type==="giant_laser"){
                if(a.state==="warning"){
                    a.warningTimer--;
                    if(a.trackTimer>0){a.trackTimer--;a.x=ally.x;a.y=ally.y;a.angle=Math.atan2(boss.y-a.y,boss.x-a.x);}
                    if(a.warningTimer<=0){a.state="active";a.activeTimer=a.maxActive;}
                }else if(a.state==="active"){
                    a.activeTimer--;
                    var ex=a.x+Math.cos(a.angle)*820,ey=a.y+Math.sin(a.angle)*820;
                    if(!a.hit&&pointToSegmentDistance(boss.x,boss.y,a.x,a.y,ex,ey)<a.width/2+boss.size){
                        a.hit=true;hitBoss(a.damage,boss.x,boss.y,"#ffb7f3");
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
                    if(a.timer<=0){
                        a.exploded=true;a.explosionTimer=20;
                        if(Math.hypot(boss.x-a.x,boss.y-a.y)<a.radius+boss.size)hitBoss(a.damage,a.x,a.y,"#00aaff");
                        burst(a.x,a.y,26,"#00aaff",7);
                    }
                }else if(--a.explosionTimer<=0)allyAttacks.splice(i,1);
                continue;
            }
            if(a.type==="waystar_dash"){
                a.progress++;var t=Math.min(1,a.progress/a.duration);
                a.x=a.startX+(a.targetX-a.startX)*t;a.y=a.startY+(a.targetY-a.startY)*t;
                a.trail.push({x:a.x,y:a.y});if(a.trail.length>8)a.trail.shift();
                if(!a.hit&&Math.hypot(boss.x-a.x,boss.y-a.y)<boss.size+26){
                    a.hit=true;hitBoss(a.damage,a.x,a.y,"#ff00ff");burst(a.x,a.y,18,"#ff00ff",6);
                }
                if(a.progress>=a.duration)allyAttacks.splice(i,1);
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
                        a.state="blind";a.blindTimer=90;
                        if(!a.hit){
                            a.hit=true;
                            if(typeof window.MBLivingStoneSuperCompanionStun==="function")window.MBLivingStoneSuperCompanionStun(90);
                            hitBoss(a.damage,boss.x,boss.y,"#ffffff");
                        }
                        burst(boss.x,boss.y,24,"#ffffff",7);
                    }
                }else if(a.state==="blind"){
                    if(--a.blindTimer<=0){a.state="fadeout";a.fadeTimer=20;}
                }else if(--a.fadeTimer<=0)allyAttacks.splice(i,1);
                continue;
            }
            if(a.type==="legion_formation"){
                a.timer++;var allDone=true;
                for(var pi=0;pi<a.pieces.length;pi++){
                    var piece=a.pieces[pi];
                    if(!piece.launched&&a.timer>=piece.delay){
                        var angle=Math.atan2(a.targetY-piece.y,a.targetX-piece.x)+((pi%10)-4.5)*.022;
                        var speed=4.2+(Math.floor(pi/10)%3)*.35;
                        piece.vx=Math.cos(angle)*speed;piece.vy=Math.sin(angle)*speed;piece.launched=true;
                    }
                    if(!piece.launched){allDone=false;continue;}
                    if(piece.life<=0)continue;
                    allDone=false;piece.trail.push({x:piece.x,y:piece.y});if(piece.trail.length>4)piece.trail.shift();
                    piece.x+=piece.vx;piece.y+=piece.vy;piece.rotation+=.14;piece.life--;
                    if(!piece.hit&&Math.hypot(boss.x-piece.x,boss.y-piece.y)<boss.size+piece.size){
                        piece.hit=true;piece.life=0;hitBoss(piece.damage,piece.x,piece.y,piece.color);burst(piece.x,piece.y,3,piece.color,2.5);
                    }
                    if(piece.x<-30||piece.x>430||piece.y<-40||piece.y>535)piece.life=0;
                }
                if(allDone)allyAttacks.splice(i,1);
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
        c.save();var light=!!(window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects());
        for(var i=0;i<allyAttacks.length;i++){
            var a=allyAttacks[i];
            if(a.type==="meteor"||a.type==="spiral"||a.type==="star_rain"||a.type==="shotgun_bullet"){
                var color=a.type==="meteor"?"#ff8800":(a.type==="spiral"?"#ff00ff":(a.type==="shotgun_bullet"?"#ff4400":"#ffd700"));
                for(var j=0;j<a.trail.length;j++){c.globalAlpha=(1-j/a.trail.length)*.5;c.fillStyle=color;c.beginPath();c.arc(a.trail[j].x,a.trail[j].y,a.size*(1-j/a.trail.length)*.7,0,Math.PI*2);c.fill();}
                c.globalAlpha=1;c.save();c.translate(a.x,a.y);c.rotate(a.rotation||0);
                c.fillStyle=a.type==="meteor"?"#ffd700":color;c.beginPath();c.arc(0,0,a.size,0,Math.PI*2);c.fill();
                c.fillStyle="#ffffff";c.beginPath();c.arc(0,0,a.size*.5,0,Math.PI*2);c.fill();c.restore();
            }else if(a.type==="vertical_laser"){
                c.save();
                if(a.state==="warning"){
                    var pulse=.3+Math.sin(frame/4)*.2,charge=12+Math.abs(Math.sin(frame/5))*12;
                    var glow=c.createRadialGradient(a.x,490,0,a.x,490,charge*2);
                    glow.addColorStop(0,"rgba(255,255,255,.9)");glow.addColorStop(.4,"rgba(255,100,100,.6)");glow.addColorStop(1,"rgba(255,0,0,0)");
                    c.fillStyle=glow;c.beginPath();c.arc(a.x,490,charge*2,0,Math.PI*2);c.fill();
                    c.globalAlpha=pulse;c.fillStyle="#ff3333";c.fillRect(a.x-a.width/2,0,a.width,500);
                    c.globalAlpha=.9;c.strokeStyle="#ffffff";c.lineWidth=2;c.setLineDash([8,6]);
                    c.beginPath();c.moveTo(a.x-a.width/2,0);c.lineTo(a.x-a.width/2,500);c.moveTo(a.x+a.width/2,0);c.lineTo(a.x+a.width/2,500);c.stroke();c.setLineDash([]);
                }else if(a.state==="active"){
                    var fadeIn=Math.min(1,(a.maxActive-a.activeTimer)/5+.3),fadeOut=Math.min(1,a.activeTimer/12),alpha=Math.min(fadeIn,fadeOut);
                    var outer=c.createLinearGradient(a.x-a.width*1.5,0,a.x+a.width*1.5,0);
                    outer.addColorStop(0,"rgba(255,50,50,0)");outer.addColorStop(.3,"rgba(255,100,50,.5)");outer.addColorStop(.5,"rgba(255,255,255,.9)");outer.addColorStop(.7,"rgba(255,100,50,.5)");outer.addColorStop(1,"rgba(255,50,50,0)");
                    c.globalAlpha=alpha;c.fillStyle=outer;c.fillRect(a.x-a.width*1.5,0,a.width*3,500);
                    c.fillStyle="#ff3333";c.fillRect(a.x-a.width/2,0,a.width,500);c.fillStyle="#ffffff";c.fillRect(a.x-a.width*.18,0,a.width*.36,500);
                    c.fillStyle="#00d4ff";c.globalAlpha=alpha*.6;c.fillRect(a.x-a.width/2+4,0,6,500);c.fillRect(a.x+a.width/2-10,0,6,500);
                }c.restore();
            }else if(a.type==="giant_laser"){
                c.save();c.translate(a.x,a.y);c.rotate(a.angle);
                if(a.state==="warning"){
                    c.globalAlpha=.4+Math.sin(frame/4)*.2;c.strokeStyle="#ffffff";c.lineWidth=2;c.setLineDash([8,6]);
                    c.fillStyle="rgba(255,0,255,.16)";c.fillRect(0,-a.width/2,820,a.width);c.strokeRect(0,-a.width/2,820,a.width);c.setLineDash([]);
                    c.fillStyle="#ff00ff";c.beginPath();c.arc(0,0,22+Math.abs(Math.sin(frame/5))*12,0,Math.PI*2);c.fill();
                    c.fillStyle="#ffffff";c.font="bold 18px monospace";c.textAlign="center";c.fillText("⚠",0,6);
                }else if(a.state==="active"){
                    var laser=c.createLinearGradient(0,-a.width*1.5,0,a.width*1.5);
                    laser.addColorStop(0,"rgba(255,0,255,0)");laser.addColorStop(.3,"rgba(255,100,255,.5)");laser.addColorStop(.5,"rgba(255,255,255,.95)");laser.addColorStop(.7,"rgba(255,100,255,.5)");laser.addColorStop(1,"rgba(255,0,255,0)");
                    c.globalAlpha=.95;c.fillStyle=laser;c.fillRect(0,-a.width*1.5,820,a.width*3);
                    c.fillStyle="#ff00ff";c.fillRect(0,-a.width/2,820,a.width);c.fillStyle="#ffffff";c.fillRect(0,-a.width*.18,820,a.width*.36);
                }c.restore();
            }else if(a.type==="solar_bomb"){
                if(!a.exploded){
                    var size=(a.small?25:45)*(a.sunScale||1),sunColor=a.sunColor||"#ffdd00";
                    if(light){
                        c.fillStyle=sunColor;c.beginPath();c.arc(a.x,a.y,Math.max(4,size),0,Math.PI*2);c.fill();
                        c.fillStyle="#ffffff";c.beginPath();c.arc(a.x,a.y,Math.max(2,size*.28),0,Math.PI*2);c.fill();
                        c.strokeStyle=a.sunPhase==="blue"?"#55bbff":"#fff2a8";c.lineWidth=2;c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.stroke();
                    }else{
                        var auraSize=size*3.5,aura=c.createRadialGradient(a.x,a.y,0,a.x,a.y,auraSize);
                        if(a.sunPhase==="big"){aura.addColorStop(0,"rgba(255,255,200,.9)");aura.addColorStop(.3,"rgba(255,200,50,.6)");aura.addColorStop(.6,"rgba(255,100,0,.3)");aura.addColorStop(1,"rgba(255,0,0,0)");}
                        else if(a.sunPhase==="shrink"){aura.addColorStop(0,"rgba(255,255,255,.9)");aura.addColorStop(.3,"rgba(255,220,100,.6)");aura.addColorStop(.6,"rgba(255,150,50,.3)");aura.addColorStop(1,"rgba(255,0,0,0)");}
                        else if(a.sunPhase==="blue"){aura.addColorStop(0,"rgba(200,240,255,.9)");aura.addColorStop(.3,"rgba(50,150,255,.6)");aura.addColorStop(.6,"rgba(0,80,200,.3)");aura.addColorStop(1,"rgba(0,0,200,0)");}
                        else{aura.addColorStop(0,"rgba(255,255,255,1)");aura.addColorStop(.3,"rgba(200,240,255,.8)");aura.addColorStop(.6,"rgba(0,150,255,.5)");aura.addColorStop(1,"rgba(0,0,200,0)");}
                        c.fillStyle=aura;c.beginPath();c.arc(a.x,a.y,auraSize,0,Math.PI*2);c.fill();
                        c.fillStyle=sunColor;c.shadowColor=sunColor;c.shadowBlur=a.sunPhase==="flash"?30:18;c.beginPath();c.arc(a.x,a.y,size,0,Math.PI*2);c.fill();c.shadowBlur=0;
                        if(a.sunPhase==="blue")for(var ring=0;ring<2;ring++){
                            c.strokeStyle="#00aaff";c.lineWidth=2;var offset=ring*Math.PI+frame/7;c.beginPath();
                            for(var step=0;step<=15;step++){var t=step/15,ang=offset+t*Math.PI*4,rr=size*.8*(1-t*.5),sx=a.x+Math.cos(ang)*rr,sy=a.y+Math.sin(ang)*rr;if(step===0)c.moveTo(sx,sy);else c.lineTo(sx,sy);}c.stroke();
                        }
                    }
                    c.globalAlpha=.25+Math.sin(a.timer/10)*.25;c.strokeStyle=a.sunPhase==="blue"?"#00aaff":"#ff3333";c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.stroke();c.setLineDash([]);c.globalAlpha=1;
                    if(a.sunPhase==="flash"){c.strokeStyle="#ffffff";c.lineWidth=2;c.beginPath();c.moveTo(a.x-size*.7,a.y);c.lineTo(a.x+size*.7,a.y);c.moveTo(a.x,a.y-size*.7);c.lineTo(a.x,a.y+size*.7);c.stroke();}
                }else{
                    var p=1-a.explosionTimer/20,alpha=1-p;c.globalAlpha=alpha;c.strokeStyle="#55bbff";c.lineWidth=4;c.beginPath();c.arc(a.x,a.y,a.radius*p*1.3,0,Math.PI*2);c.stroke();
                    c.globalAlpha=alpha*.5;c.fillStyle="#aaddff";c.beginPath();c.arc(a.x,a.y,a.radius*p*.35,0,Math.PI*2);c.fill();c.globalAlpha=1;
                }
            }else if(a.type==="waystar_dash"){
                for(var d=0;d<a.trail.length;d++){c.globalAlpha=(1-d/a.trail.length)*.45;c.fillStyle="#ff00ff";c.beginPath();c.arc(a.trail[d].x,a.trail[d].y,18*(1-d/a.trail.length),0,Math.PI*2);c.fill();}
                c.globalAlpha=1;c.fillStyle="#ffffff";c.shadowColor="#ff00ff";c.shadowBlur=18;c.beginPath();c.arc(a.x,a.y,18,0,Math.PI*2);c.fill();
                c.fillStyle="#ff00ff";c.beginPath();c.arc(a.x,a.y,11,0,Math.PI*2);c.fill();
            }else if(a.type==="blind"){
                if(a.state==="warning")for(var wi=0;wi<a.warnings.length;wi++){
                    var w=a.warnings[wi];if(!w.active)continue;var pulse=1+Math.sin(w.pulse)*.3;
                    c.save();c.globalAlpha=Math.min(1,(w.timer-w.delay)/10);c.translate(w.x,w.y);c.scale(pulse,pulse);
                    c.fillStyle="#ffcc00";c.strokeStyle="#000000";c.lineWidth=3;c.beginPath();c.moveTo(0,-22);c.lineTo(20,18);c.lineTo(-20,18);c.closePath();c.fill();c.stroke();
                    c.fillStyle="#000000";c.font="bold 22px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText("!",0,6);
                    c.shadowColor="#ffcc00";c.shadowBlur=20;c.strokeStyle="#ffffff";c.lineWidth=2;c.beginPath();c.arc(0,0,28+Math.sin(w.pulse*1.5)*4,0,Math.PI*2);c.stroke();c.restore();
                }else{
                    var target=bossPoint();c.globalAlpha=a.state==="blind"?.22:(a.fadeTimer/20)*.22;c.fillStyle="#000000";c.beginPath();c.arc(target.x,target.y,76,0,Math.PI*2);c.fill();
                    c.globalAlpha=.8;c.fillStyle="#ff3333";c.font="bold 18px monospace";c.textAlign="center";c.shadowColor="#ff0000";c.shadowBlur=14;c.fillText("💀",target.x,target.y+2);
                    c.font="bold 10px monospace";c.fillText("НИЧЕГО НЕ ВИДНО",target.x,target.y+24);c.shadowBlur=0;
                }
            }else if(a.type==="legion_formation"){
                for(var pi=0;pi<a.pieces.length;pi++){var piece=a.pieces[pi];
                    for(var tr=0;tr<piece.trail.length;tr++){c.globalAlpha=(tr+1)/piece.trail.length*.3;c.fillStyle=piece.color;c.beginPath();c.arc(piece.trail[tr].x,piece.trail[tr].y,piece.size*.55,0,Math.PI*2);c.fill();}
                    c.globalAlpha=1;originalWaystarStar(c,piece.x,piece.y+(!piece.launched?Math.sin(frame/5+pi)*2:0),piece.size,piece.color);
                }
            }
        }
        c.restore();
    }

    function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
        var t = len2 > 0 ? Math.max(0, Math.min(1, ((px-x1)*dx+(py-y1)*dy)/len2)) : 0;
        return Math.hypot(px-(x1+dx*t), py-(y1+dy*t));
    }

    function getAllyThreats() {
        var list = [];
        if (typeof livingStoneAttacks !== "undefined" && Array.isArray(livingStoneAttacks))
            list = list.concat(livingStoneAttacks);
        if (typeof livingStoneBullets !== "undefined" && Array.isArray(livingStoneBullets))
            list = list.concat(livingStoneBullets);
        if (typeof window.MBGetLivingStoneSuperCompanionThreats === "function") {
            try { list = list.concat(window.MBGetLivingStoneSuperCompanionThreats() || []); } catch (e) {}
        }
        return list;
    }

    function threatAt(h, x, y, frames, actual) {
        if (!h || h.allyHit || h.odenHit || h._mbGEIgnored || h.state === "done") return 0;
        var type = String(h.type || "").toLowerCase();
        var width = Math.max(8, Number(h.width) || 0);
        var radius = Math.max(7, Number(h.size || h.r || h.radius) || 9) + 12;
        var warning = h.state === "warning" || h.state === "windup" ||
            Number(h.warningTimer) > 0 || Number(h.delay) > 0 ||
            (type === "laser_warning" && Number(h.timer) > 0);
        if (type === "ring") {
            var ringRadius = Math.max(0, Number(h.radius) || 0) +
                Math.max(0, Number(h.growth) || 0) * Math.max(0, Number(frames) || 0);
            var ringDistance = Math.hypot(x - (Number(h.x) || 0), y - (Number(h.y) || 0));
            var ringThickness = Math.max(8, Number(h.thickness) || 12) * 0.5 + 14;
            return Math.abs(ringDistance - ringRadius) < ringThickness ? 1 : 0;
        }
        if (type === "laser_warning") {
            if (actual && Number(h.timer) > 0) return 0;
            return Math.abs(x - (Number(h.x) || 0)) < width * 0.5 + 20 ? 1 : 0;
        }
        if (warning && actual) return 0;
        if ((type.indexOf("laser") !== -1 || type.indexOf("beam") !== -1) &&
            Number.isFinite(Number(h.x)) && (!Number.isFinite(Number(h.y)) || type === "laser" || type === "beam")) {
            var laserX = Number(h.x);
            return Math.abs(x - laserX) < width * 0.5 + 18 ? 1 : 0;
        }
        if (type === "boss_dash" && Number.isFinite(Number(h.targetX))) {
            return pointToSegmentDistance(x, y, Number(h.x), Number(h.y),
                Number(h.targetX), Number(h.targetY)) < radius + 20 ? 1 : 0;
        }
        if (type === "predict") {
            return Math.hypot(x - Number(h.x), y - Number(h.y)) < Math.max(radius, Number(h.radius) || 0) ? 1 : 0;
        }
        if (!Number.isFinite(Number(h.x)) || !Number.isFinite(Number(h.y))) {
            if (Number.isFinite(Number(h.targetX)) && Math.abs(x - Number(h.targetX)) < width * 0.5 + 20) return 1;
            return 0;
        }
        var vx = Number(h.vx) || 0, vy = Number(h.vy) || 0;
        var px = Number(h.x) + vx * frames, py = Number(h.y) + vy * frames;
        if (type === "boomerang" && h.stage === "return") {
            px = Number(h.x) - vx * frames * 0.8;
            py = Number(h.y) - vy * frames * 0.8;
        }
        return Math.hypot(x - px, y - py) < radius + (warning ? 24 : 0) ? 1 : 0;
    }

    function chooseAllyGoal(boss, threats) {
        var baseX = Math.max(35, Math.min(365, boss.x + (ally.x <= boss.x ? -54 : 54)));
        var baseY = Math.max(205, Math.min(365, boss.y + 160));
        var nearest = null, nearestScore = Infinity;
        var candidates = [{x:baseX,y:baseY}];
        for (var a = 0; a < 12; a++) {
            var angle = a * Math.PI / 6;
            for (var rad = 48; rad <= 112; rad += 32) {
                candidates.push({
                    x: Math.max(28, Math.min(372, ally.x + Math.cos(angle) * rad)),
                    y: Math.max(170, Math.min(410, ally.y + Math.sin(angle) * rad))
                });
            }
        }
        var timeChecks = [0, 12, 24, 38];
        for (var i = 0; i < candidates.length; i++) {
            var cand = candidates[i], danger = 0;
            for (var j = 0; j < threats.length; j++) {
                for (var t = 0; t < timeChecks.length; t++) {
                    if (threatAt(threats[j], cand.x, cand.y, timeChecks[t], false)) {
                        danger += (4 - t) * (Number(threats[j].damage) > 16 ? 7 : 4);
                        break;
                    }
                }
            }
            var score = danger * 1000 + Math.hypot(cand.x-baseX,cand.y-baseY) * 0.28 +
                Math.hypot(cand.x-ally.x,cand.y-ally.y) * 0.045;
            if (score < nearestScore) { nearestScore = score; nearest = cand; }
        }
        return nearest || { x: baseX, y: baseY };
    }

    function damageAlly(amount, x, y) {
        if (!ally.alive || ally.invuln > 0) return;
        var dealt = Math.max(1, Math.min(22, Number(amount) || 8));
        ally.hp = Math.max(0, ally.hp - dealt);
        ally.invuln = 38; ally.hitFlash = 15;
        burst(x || ally.x, y || ally.y, 12, "#ff91c9", 4);
        if (ally.hp <= 0) {
            ally.alive = false; allyDeathTimer = 240;
            announce("ПУТЕВОДНАЯ ЗВЕЗДА ВЫБЫЛА!", "#ff9acb", 90);
        }
    }

    function updateAlly() {
        if (!ally.alive) {
            if (allyDeathTimer > 0) allyDeathTimer--;
            return;
        }
        var boss = bossPoint(), threats = getAllyThreats();
        ally.phase += 0.11;
        if (ally.invuln > 0) ally.invuln--;
        if (ally.hitFlash > 0) ally.hitFlash--;
        if (ally.dashFlash > 0) ally.dashFlash--;
        if (attackPause <= 0) {
            if (ally.attackTimer > 0) ally.attackTimer--;
            if (ally.attackTimer <= 0) {
                ally.attackTimer = 138;
                launchAllyPattern();
            }
        }

        var goal = chooseAllyGoal(boss, threats);
        var immediate = null, immediateScore = Infinity;
        for (var i = 0; i < threats.length; i++) {
            var h = threats[i];
            if (!h || h.state === "done") continue;
            var risk = threatAt(h, ally.x, ally.y, 14, false);
            if (risk) {
                var d = Math.hypot(ally.x-(Number(h.x)||ally.x), ally.y-(Number(h.y)||ally.y));
                var score = d - Math.max(0, Number(h.damage)||0)*0.35;
                if (score < immediateScore) { immediateScore = score; immediate = h; }
            }
        }
        if (immediate) {
            var hx = Number(immediate.x) || ally.x, hy = Number(immediate.y) || ally.y;
            var awayX = ally.x - hx, awayY = ally.y - hy, len = Math.hypot(awayX,awayY) || 1;
            goal = {
                x: Math.max(26, Math.min(374, ally.x + awayX / len * 105 + (Math.random()-0.5)*18)),
                y: Math.max(160, Math.min(420, ally.y + awayY / len * 92))
            };
        }

        ally.targetX = goal.x; ally.targetY = goal.y;
        var dx = goal.x - ally.x, dy = goal.y - ally.y, dist = Math.hypot(dx,dy) || 1;
        var desired = Math.min(WAYSTAR_ALLY_SPEED, Math.max(0.5, dist * 0.18));
        var steer = immediate ? 0.34 : 0.19;
        ally.vx += (dx / dist * desired - ally.vx) * steer;
        ally.vy += (dy / dist * desired - ally.vy) * steer;
        var speed = Math.hypot(ally.vx,ally.vy);
        if (speed > WAYSTAR_ALLY_SPEED) { ally.vx = ally.vx/speed*WAYSTAR_ALLY_SPEED; ally.vy = ally.vy/speed*WAYSTAR_ALLY_SPEED; }
        ally.x = Math.max(22, Math.min(378, ally.x + ally.vx));
        ally.y = Math.max(160, Math.min(430, ally.y + ally.vy));

        for (var j = 0; j < threats.length; j++) {
            var h2 = threats[j];
            if (!h2 || h2.allyHit) continue;
            var hit = threatAt(h2, ally.x, ally.y, 0, true);
            if (hit && ally.invuln <= 0) {
                h2.allyHit = true;
                damageAlly(Math.max(6, (Number(h2.damage)||12)*0.48), ally.x, ally.y);
                break;
            }
        }

        updateOriginalWaystarAttacks(boss);
    }

    function originalWaystarStar(c,x,y,radius,fill){
        c.save();c.translate(x,y);c.fillStyle=fill;c.strokeStyle="#ffffff";c.lineWidth=1.2;c.shadowColor=fill;c.shadowBlur=8;
        c.beginPath();
        for(var i=0;i<10;i++){var angle=i*Math.PI/5-Math.PI/2,r=i%2===0?radius:radius*.4,px=Math.cos(angle)*r,py=Math.sin(angle)*r;if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}
        c.closePath();c.fill();c.stroke();c.restore();
    }

    function drawAllyAttacks(c){
        c.save();var light=!!(window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects());
        for(var i=0;i<allyAttacks.length;i++){
            var a=allyAttacks[i];
            if(a.type==="meteor"||a.type==="spiral"||a.type==="star_rain"||a.type==="shotgun_bullet"){
                var color=a.type==="meteor"?"#ff8800":(a.type==="spiral"?"#ff00ff":(a.type==="shotgun_bullet"?"#ff4400":"#ffd700"));
                for(var j=0;j<a.trail.length;j++){c.globalAlpha=(1-j/a.trail.length)*.5;c.fillStyle=color;c.beginPath();c.arc(a.trail[j].x,a.trail[j].y,a.size*(1-j/a.trail.length)*.7,0,Math.PI*2);c.fill();}
                c.globalAlpha=1;c.save();c.translate(a.x,a.y);c.rotate(a.rotation||0);
                c.fillStyle=a.type==="meteor"?"#ffd700":color;c.beginPath();c.arc(0,0,a.size,0,Math.PI*2);c.fill();
                c.fillStyle="#ffffff";c.beginPath();c.arc(0,0,a.size*.5,0,Math.PI*2);c.fill();c.restore();
            }else if(a.type==="vertical_laser"){
                c.save();
                if(a.state==="warning"){
                    var pulse=.3+Math.sin(frame/4)*.2,charge=12+Math.abs(Math.sin(frame/5))*12;
                    var glow=c.createRadialGradient(a.x,490,0,a.x,490,charge*2);
                    glow.addColorStop(0,"rgba(255,255,255,.9)");glow.addColorStop(.4,"rgba(255,100,100,.6)");glow.addColorStop(1,"rgba(255,0,0,0)");
                    c.fillStyle=glow;c.beginPath();c.arc(a.x,490,charge*2,0,Math.PI*2);c.fill();
                    c.globalAlpha=pulse;c.fillStyle="#ff3333";c.fillRect(a.x-a.width/2,0,a.width,500);
                    c.globalAlpha=.9;c.strokeStyle="#ffffff";c.lineWidth=2;c.setLineDash([8,6]);
                    c.beginPath();c.moveTo(a.x-a.width/2,0);c.lineTo(a.x-a.width/2,500);c.moveTo(a.x+a.width/2,0);c.lineTo(a.x+a.width/2,500);c.stroke();c.setLineDash([]);
                }else if(a.state==="active"){
                    var fadeIn=Math.min(1,(a.maxActive-a.activeTimer)/5+.3),fadeOut=Math.min(1,a.activeTimer/12),alpha=Math.min(fadeIn,fadeOut);
                    var outer=c.createLinearGradient(a.x-a.width*1.5,0,a.x+a.width*1.5,0);
                    outer.addColorStop(0,"rgba(255,50,50,0)");outer.addColorStop(.3,"rgba(255,100,50,.5)");outer.addColorStop(.5,"rgba(255,255,255,.9)");outer.addColorStop(.7,"rgba(255,100,50,.5)");outer.addColorStop(1,"rgba(255,50,50,0)");
                    c.globalAlpha=alpha;c.fillStyle=outer;c.fillRect(a.x-a.width*1.5,0,a.width*3,500);
                    c.fillStyle="#ff3333";c.fillRect(a.x-a.width/2,0,a.width,500);c.fillStyle="#ffffff";c.fillRect(a.x-a.width*.18,0,a.width*.36,500);
                    c.fillStyle="#00d4ff";c.globalAlpha=alpha*.6;c.fillRect(a.x-a.width/2+4,0,6,500);c.fillRect(a.x+a.width/2-10,0,6,500);
                }c.restore();
            }else if(a.type==="giant_laser"){
                c.save();c.translate(a.x,a.y);c.rotate(a.angle);
                if(a.state==="warning"){
                    c.globalAlpha=.4+Math.sin(frame/4)*.2;c.strokeStyle="#ffffff";c.lineWidth=2;c.setLineDash([8,6]);
                    c.fillStyle="rgba(255,0,255,.16)";c.fillRect(0,-a.width/2,820,a.width);c.strokeRect(0,-a.width/2,820,a.width);c.setLineDash([]);
                    c.fillStyle="#ff00ff";c.beginPath();c.arc(0,0,22+Math.abs(Math.sin(frame/5))*12,0,Math.PI*2);c.fill();
                    c.fillStyle="#ffffff";c.font="bold 18px monospace";c.textAlign="center";c.fillText("⚠",0,6);
                }else if(a.state==="active"){
                    var laser=c.createLinearGradient(0,-a.width*1.5,0,a.width*1.5);
                    laser.addColorStop(0,"rgba(255,0,255,0)");laser.addColorStop(.3,"rgba(255,100,255,.5)");laser.addColorStop(.5,"rgba(255,255,255,.95)");laser.addColorStop(.7,"rgba(255,100,255,.5)");laser.addColorStop(1,"rgba(255,0,255,0)");
                    c.globalAlpha=.95;c.fillStyle=laser;c.fillRect(0,-a.width*1.5,820,a.width*3);
                    c.fillStyle="#ff00ff";c.fillRect(0,-a.width/2,820,a.width);c.fillStyle="#ffffff";c.fillRect(0,-a.width*.18,820,a.width*.36);
                }c.restore();
            }else if(a.type==="solar_bomb"){
                if(!a.exploded){
                    var size=(a.small?25:45)*(a.sunScale||1),sunColor=a.sunColor||"#ffdd00";
                    if(light){
                        c.fillStyle=sunColor;c.beginPath();c.arc(a.x,a.y,Math.max(4,size),0,Math.PI*2);c.fill();
                        c.fillStyle="#ffffff";c.beginPath();c.arc(a.x,a.y,Math.max(2,size*.28),0,Math.PI*2);c.fill();
                        c.strokeStyle=a.sunPhase==="blue"?"#55bbff":"#fff2a8";c.lineWidth=2;c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.stroke();
                    }else{
                        var auraSize=size*3.5,aura=c.createRadialGradient(a.x,a.y,0,a.x,a.y,auraSize);
                        if(a.sunPhase==="big"){aura.addColorStop(0,"rgba(255,255,200,.9)");aura.addColorStop(.3,"rgba(255,200,50,.6)");aura.addColorStop(.6,"rgba(255,100,0,.3)");aura.addColorStop(1,"rgba(255,0,0,0)");}
                        else if(a.sunPhase==="shrink"){aura.addColorStop(0,"rgba(255,255,255,.9)");aura.addColorStop(.3,"rgba(255,220,100,.6)");aura.addColorStop(.6,"rgba(255,150,50,.3)");aura.addColorStop(1,"rgba(255,0,0,0)");}
                        else if(a.sunPhase==="blue"){aura.addColorStop(0,"rgba(200,240,255,.9)");aura.addColorStop(.3,"rgba(50,150,255,.6)");aura.addColorStop(.6,"rgba(0,80,200,.3)");aura.addColorStop(1,"rgba(0,0,200,0)");}
                        else{aura.addColorStop(0,"rgba(255,255,255,1)");aura.addColorStop(.3,"rgba(200,240,255,.8)");aura.addColorStop(.6,"rgba(0,150,255,.5)");aura.addColorStop(1,"rgba(0,0,200,0)");}
                        c.fillStyle=aura;c.beginPath();c.arc(a.x,a.y,auraSize,0,Math.PI*2);c.fill();
                        c.fillStyle=sunColor;c.shadowColor=sunColor;c.shadowBlur=a.sunPhase==="flash"?30:18;c.beginPath();c.arc(a.x,a.y,size,0,Math.PI*2);c.fill();c.shadowBlur=0;
                        if(a.sunPhase==="blue")for(var ring=0;ring<2;ring++){
                            c.strokeStyle="#00aaff";c.lineWidth=2;var offset=ring*Math.PI+frame/7;c.beginPath();
                            for(var step=0;step<=15;step++){var t=step/15,ang=offset+t*Math.PI*4,rr=size*.8*(1-t*.5),sx=a.x+Math.cos(ang)*rr,sy=a.y+Math.sin(ang)*rr;if(step===0)c.moveTo(sx,sy);else c.lineTo(sx,sy);}c.stroke();
                        }
                    }
                    c.globalAlpha=.25+Math.sin(a.timer/10)*.25;c.strokeStyle=a.sunPhase==="blue"?"#00aaff":"#ff3333";c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.stroke();c.setLineDash([]);c.globalAlpha=1;
                    if(a.sunPhase==="flash"){c.strokeStyle="#ffffff";c.lineWidth=2;c.beginPath();c.moveTo(a.x-size*.7,a.y);c.lineTo(a.x+size*.7,a.y);c.moveTo(a.x,a.y-size*.7);c.lineTo(a.x,a.y+size*.7);c.stroke();}
                }else{
                    var p=1-a.explosionTimer/20,alpha=1-p;c.globalAlpha=alpha;c.strokeStyle="#55bbff";c.lineWidth=4;c.beginPath();c.arc(a.x,a.y,a.radius*p*1.3,0,Math.PI*2);c.stroke();
                    c.globalAlpha=alpha*.5;c.fillStyle="#aaddff";c.beginPath();c.arc(a.x,a.y,a.radius*p*.35,0,Math.PI*2);c.fill();c.globalAlpha=1;
                }
            }else if(a.type==="waystar_dash"){
                for(var d=0;d<a.trail.length;d++){c.globalAlpha=(1-d/a.trail.length)*.45;c.fillStyle="#ff00ff";c.beginPath();c.arc(a.trail[d].x,a.trail[d].y,18*(1-d/a.trail.length),0,Math.PI*2);c.fill();}
                c.globalAlpha=1;c.fillStyle="#ffffff";c.shadowColor="#ff00ff";c.shadowBlur=18;c.beginPath();c.arc(a.x,a.y,18,0,Math.PI*2);c.fill();
                c.fillStyle="#ff00ff";c.beginPath();c.arc(a.x,a.y,11,0,Math.PI*2);c.fill();
            }else if(a.type==="blind"){
                if(a.state==="warning")for(var wi=0;wi<a.warnings.length;wi++){
                    var w=a.warnings[wi];if(!w.active)continue;var pulse=1+Math.sin(w.pulse)*.3;
                    c.save();c.globalAlpha=Math.min(1,(w.timer-w.delay)/10);c.translate(w.x,w.y);c.scale(pulse,pulse);
                    c.fillStyle="#ffcc00";c.strokeStyle="#000000";c.lineWidth=3;c.beginPath();c.moveTo(0,-22);c.lineTo(20,18);c.lineTo(-20,18);c.closePath();c.fill();c.stroke();
                    c.fillStyle="#000000";c.font="bold 22px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText("!",0,6);
                    c.shadowColor="#ffcc00";c.shadowBlur=20;c.strokeStyle="#ffffff";c.lineWidth=2;c.beginPath();c.arc(0,0,28+Math.sin(w.pulse*1.5)*4,0,Math.PI*2);c.stroke();c.restore();
                }else{
                    var target=bossPoint();c.globalAlpha=a.state==="blind"?.22:(a.fadeTimer/20)*.22;c.fillStyle="#000000";c.beginPath();c.arc(target.x,target.y,76,0,Math.PI*2);c.fill();
                    c.globalAlpha=.8;c.fillStyle="#ff3333";c.font="bold 18px monospace";c.textAlign="center";c.shadowColor="#ff0000";c.shadowBlur=14;c.fillText("💀",target.x,target.y+2);
                    c.font="bold 10px monospace";c.fillText("НИЧЕГО НЕ ВИДНО",target.x,target.y+24);c.shadowBlur=0;
                }
            }else if(a.type==="legion_formation"){
                for(var pi=0;pi<a.pieces.length;pi++){var piece=a.pieces[pi];
                    for(var tr=0;tr<piece.trail.length;tr++){c.globalAlpha=(tr+1)/piece.trail.length*.3;c.fillStyle=piece.color;c.beginPath();c.arc(piece.trail[tr].x,piece.trail[tr].y,piece.size*.55,0,Math.PI*2);c.fill();}
                    c.globalAlpha=1;originalWaystarStar(c,piece.x,piece.y+(!piece.launched?Math.sin(frame/5+pi)*2:0),piece.size,piece.color);
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
        var barW=42, barX=ally.x-barW/2, barY=ally.y-34;
        c.fillStyle="rgba(0,0,0,.72)"; c.fillRect(barX-2,barY-3,barW+4,7);
        c.fillStyle="#26132b"; c.fillRect(barX,barY,barW,3);
        c.fillStyle=ally.hp>ally.maxHp*.3?"#a5f4ff":"#ff83bb";
        c.fillRect(barX,barY,barW*Math.max(0,ally.hp/ally.maxHp),3);
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
        if (!active || activeEncounterGeneration !== generation) {
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
            resetAlly();
            supportX = Number(livingStonePlayer.x) || 200;
            supportY = Number(livingStonePlayer.y) || 400;
            announce("Я ОБЕЩАЛА ВЕРНУТЬСЯ. И Я ЗДЕСЬ.", "#bcefff", 95);
        }

        frame++;
        var currentPhase = phase();
        if (lastPhase === "green" && currentPhase !== "green") {
            blockStars = 0;
            constellationFlash = 0;
        }
        lastPhase = currentPhase;

        if (currentPhase === "normal") {
            if (guardCooldown > 0) guardCooldown--;
            if (strikeTimer > 0) strikeTimer--;
            if (attackPause > 0) attackPause--;
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
            // In green-heart mode the player-facing protection pauses, but the Star keeps fighting.
            route = null;
            routeTimer = 0;
            if (constellationFlash > 0) {
                constellationFlash--;
                if (constellationFlash <= 0) blockStars = 0;
            }
            if (routeHitFlash > 0) routeHitFlash--;
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