/* Waystar companion: post-mercy support for Living Stone fights.
   The existing slotData.waystarOwesDebt value remains the sole mercy source. */
(function () {
    "use strict";
    var active=false, supportRequested=false, frame=0, strikeTimer=95, guardCooldown=0;
    var guardFlash=0, strikeFlash=0, supportX=0, supportY=0;

    function wasSpared() {
        try {
            var savedValue = (typeof slotData!=="undefined" && slotData) ? slotData.waystarOwesDebt : false;
            return window.waystarOwesDebt===true || savedValue===true || savedValue===1 || savedValue==="true";
        } catch(e) { return false; }
    }
    function eligible() {
        if (!supportRequested || !wasSpared() ||
            typeof livingStoneActive==="undefined" || !livingStoneActive ||
            livingStoneState!=="phase2" ||
            (typeof finalSceneActive!=="undefined" && finalSceneActive)) return false;
        // Activation is explicitly requested by the end-of-chase transition.
        // Only pause the companion while Prime's separate green-heart mode is active.
        if (window.livingStoneSuperActive!==true) return false;
        return window.__mbLS2AfterChase===true &&
            window.__mbLS2GreenPhase==="normal" &&
            window.__mbLivingStoneChaseActive!==true;
    }
    function startSupport() {
        if (!wasSpared()) return false;
        supportRequested=true;
        active=false;
        frame=0;
        strikeTimer=95;
        guardCooldown=0;
        return true;
    }
    function announce(message,color,life) {
        if (typeof spawnLivingStoneText==="function")
            spawnLivingStoneText(200,305,message,color||"#bcefff",life||70);
    }
    function burst(x,y,count,color,speed) {
        if (typeof spawnLivingStoneParticles==="function")
            spawnLivingStoneParticles(x,y,count,color||"#aeeaff",speed||4);
    }
    function maxBossHp() {
        var hp=0;
        if (typeof window.getLivingStoneSuperBossMaxHp==="function") {
            try { hp=Number(window.getLivingStoneSuperBossMaxHp())||0; } catch(e) {}
        }
        if (!(hp>0) && typeof livingStoneBossMaxHp!=="undefined") hp=Number(livingStoneBossMaxHp)||0;
        return Math.max(1,hp);
    }
    function strike() {
        if (!eligible() || typeof livingStoneBoss==="undefined" || !livingStoneBoss) return;
        var maxHpValue=maxBossHp();
        var damage=Math.max(1,Math.floor(maxHpValue*(window.livingStoneSuperActive===true?0.012:0.015)));
        if (typeof damageLivingStone==="function") damageLivingStone(damage);
        else if (typeof window.MBLivingStoneSuperDamage==="function") window.MBLivingStoneSuperDamage(damage);
        else return;
        strikeFlash=42;
        burst(livingStoneBoss.x||200,livingStoneBoss.y||110,18,"#aeeaff",5);
        announce("ЗВЁЗДНЫЙ УДАР!","#bcefff",48);
        if (typeof playArenaSound==="function") playArenaSound(960,"sine",0.22,0.075);
    }
    function update() {
        if (!eligible()) {
            active=false;
            if (guardFlash>0) guardFlash--;
            if (strikeFlash>0) strikeFlash--;
            return;
        }
        if (!active) {
            active=true; frame=0; strikeTimer=95; guardCooldown=0;
            supportX=Number(livingStonePlayer.x)||200;
            supportY=Number(livingStonePlayer.y)||400;
            announce("ПУТЕВОДНАЯ ЗВЕЗДА: Я ОСТАНУСЬ И ПОМОГУ ТЕБЕ!","#bcefff",105);
        }
        frame++;
        if (guardCooldown>0) guardCooldown--;
        if (strikeTimer>0) strikeTimer--;
        if (guardFlash>0) guardFlash--;
        if (strikeFlash>0) strikeFlash--;
        if (typeof livingStonePlayer!=="undefined" && livingStonePlayer) {
            var side=livingStonePlayer.x<200?1:-1;
            var tx=livingStonePlayer.x+side*(34+Math.sin(frame/95)*5);
            var ty=livingStonePlayer.y-20+Math.sin(frame/38)*7;
            supportX+=(tx-supportX)*0.13;
            supportY+=(ty-supportY)*0.11;
        }
        if (strikeTimer<=0) { strikeTimer=300; strike(); }
    }
    function tryProtect() {
        if (!eligible() || guardCooldown>0) return false;
        guardCooldown=900; guardFlash=52;
        if (typeof livingStonePlayer!=="undefined" && livingStonePlayer)
            burst(livingStonePlayer.x,livingStonePlayer.y,20,"#9deaff",5);
        announce("ЗВЕЗДА ПРИНЯЛА УДАР НА СЕБЯ!","#bcefff",80);
        if (typeof playArenaSound==="function") playArenaSound(620,"triangle",0.35,0.08);
        return true;
    }
    function draw(c) {
        if (!active || !eligible() || !c || typeof livingStonePlayer==="undefined" ||
            typeof window.MBDrawWaystarCompanion!=="function") return;
        var now=typeof performance!=="undefined"?performance.now():Date.now();
        var pulse=1+Math.sin(now/135)*0.1;
        var px=livingStonePlayer.x, py=livingStonePlayer.y;
        var sx=supportX||px+35, sy=supportY||py-22;
        c.save();
        c.globalAlpha=0.65;
        c.strokeStyle="rgba(111,218,255,.60)";
        c.lineWidth=1.6;
        c.shadowColor="#80dcff";
        c.shadowBlur=window.MBShouldReduceBossEffects&&window.MBShouldReduceBossEffects()?0:12;
        c.beginPath(); c.ellipse(sx,sy,26*pulse,13*pulse,Math.sin(now/700)*0.35,0,Math.PI*2); c.stroke();
        c.shadowBlur=0;
        if (strikeFlash>0) {
            c.globalAlpha=Math.min(1,strikeFlash/22);
            c.strokeStyle="#f1fcff"; c.lineWidth=3;
            c.beginPath(); c.moveTo(sx,sy); c.lineTo(livingStoneBoss.x||200,livingStoneBoss.y||110); c.stroke();
        }
        if (guardFlash>0) {
            c.globalAlpha=Math.min(0.9,guardFlash/30);
            c.strokeStyle="#b9efff"; c.lineWidth=3;
            c.beginPath(); c.arc(px,py,26+(52-guardFlash)*0.65,0,Math.PI*2); c.stroke();
        }
        c.restore();
        window.MBDrawWaystarCompanion(sx,sy,23);
    }
    function stop() {
        active=false; supportRequested=false; frame=0; guardFlash=0; strikeFlash=0;
        strikeTimer=95; guardCooldown=0;
    }
    window.MBHasWaystarCompanion=wasSpared;
    window.MBStartWaystarCompanionSupport=startSupport;
    window.MBUpdateWaystarCompanion=update;
    window.MBDrawWaystarCompanionSupport=draw;
    window.MBWaystarTryProtect=tryProtect;
    window.MBStopWaystarCompanion=stop;
})();
