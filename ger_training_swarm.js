/* GER Training Swarm: 50 lightweight autonomous copies for unique-boss testing. */
(function () {
    "use strict";
    var COUNT = 50;
    var clones = [];
    var active = false;
    var raf = 0;
    var lastAt = 0;
    var lastUiAt = 0;
    var overlay = null;
    var overlayCtx = null;
    var panel = null;
    var inputHandlers = [];
    var lastBossHp = null;
    var zeroHpSince = 0;
    var damageLeaderboard = null;
    var ended = false;

    function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function context() {
        try { return typeof window.getBossContext === "function" ? window.getBossContext() : null; }
        catch (e) { return null; }
    }
    function createClone(i) {
        var angle = i / COUNT * Math.PI * 2;
        var ring = 65 + (i % 5) * 16;
        return {
            id: i + 1, x: clamp(200 + Math.cos(angle) * ring, 18, 382),
            y: clamp(315 + Math.sin(angle) * ring, 18, 482),
            vx: 0, vy: 0, tx: 200, ty: 260, hp: 3, maxHp: 3,
            alive: true, score: 0, damageDealt: 0, damageTaken: 0,
            hits: 0, dodges: 0, wasThreatened: false, nextAttackAt: 0, nextDecisionAt: 0,
            nextHitAt: 0, lastHitAt: 0, lastHitKey: "", flashUntil: 0,
            phase: Math.random() * Math.PI * 2
        };
    }
    function makeOverlay() {
        var canvas = document.getElementById("arenaCanvas");
        if (!canvas || !canvas.parentNode) return;
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = document.createElement("canvas");
        overlay.id = "mbGERTrainingSwarmCanvas";
        overlay.width = 400;
        overlay.height = 500;
        overlay.style.cssText = "position:fixed;pointer-events:none;z-index:100020;left:0;top:0;width:1px;height:1px;";
        document.body.appendChild(overlay);
        overlayCtx = overlay.getContext("2d");
    }
    function placeOverlay() {
        var canvas = document.getElementById("arenaCanvas");
        if (!canvas || !overlay) return;
        var r = canvas.getBoundingClientRect();
        overlay.style.left = r.left + "px";
        overlay.style.top = r.top + "px";
        overlay.style.width = r.width + "px";
        overlay.style.height = r.height + "px";
        overlay.style.display = r.width && r.height ? "block" : "none";
    }
    function makePanel() {
        if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
        panel = document.createElement("div");
        panel.id = "mbGERTrainingSwarmPanel";
        panel.style.cssText = "position:fixed;z-index:100030;top:calc(12px + env(safe-area-inset-top));left:12px;width:min(270px,calc(100vw - 24px));max-height:42vh;overflow:auto;padding:10px 12px;border:1px solid rgba(255,214,112,.65);border-radius:12px;background:rgba(9,12,20,.92);color:#fff2c6;font:700 11px/1.45 Arial,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35);";
        panel.innerHTML = '<div style="font-weight:900;font-size:12px;color:#ffe19a">GER SWARM · 50 АВТОНОМНЫХ СТЕНДОВ</div><div id="mbGERSwarmSummary">Подготовка арены…</div><div id="mbGERSwarmLeaders" style="margin-top:5px"></div>';
        document.body.appendChild(panel);
    }
    function allowExit(ev) {
        var t = ev && ev.target;
        var label = t && String(t.textContent || "").toLowerCase();
        return !!(t && (t.id === "bossTestExitFightBtn" || (t.closest && t.closest("#bossTestExitFightBtn")) ||
            t.id === "gerTrainingStopBtn" || (t.closest && t.closest("#gerTrainingStopBtn")) ||
            (t.tagName === "BUTTON" && label.indexOf("выйти") !== -1)));
    }
    function blockInput(ev) {
        if (!active || allowExit(ev)) return;
        if (ev && ev.cancelable) ev.preventDefault();
        if (ev && ev.stopPropagation) ev.stopPropagation();
        if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        return false;
    }
    function lockPlayerInput() {
        if (inputHandlers.length) return;
        ["pointerdown","pointerup","pointermove","mousedown","mouseup","click","dblclick","touchstart","touchmove","touchend","keydown","keyup","keypress","contextmenu"].forEach(function (type) {
            var fn = blockInput;
            window.addEventListener(type, fn, {capture:true, passive:false});
            inputHandlers.push([type, fn]);
        });
    }
    function unlockPlayerInput() {
        inputHandlers.forEach(function (pair) { window.removeEventListener(pair[0], pair[1], true); });
        inputHandlers = [];
    }
    function getThreat(attack, x, y, frames, alert) {
        try {
            if (typeof window.MBGERTrainingThreatAt === "function") return window.MBGERTrainingThreatAt(attack, x, y, frames || 0, alert === true);
        } catch (e) {}
        return null;
    }
    function dangerAt(attacks, waves, x, y, frames) {
        for (var i = 0; i < attacks.length; i++) if (getThreat(attacks[i], x, y, frames, true)) return true;
        for (var j = 0; j < waves.length; j++) {
            var w = waves[j];
            if (!w || w.odenHit) continue;
            var radius = Math.max(0, Number(w.radius) || 0) + Math.max(0, Number(w.speed) || 0) * (frames || 0);
            var dist = Math.hypot(x - (Number(w.x) || 0), y - (Number(w.y) || 0));
            if (Math.abs(dist - radius) < (Number(w.width) || 8) * 0.7 + 12) return true;
        }
        return false;
    }
    function chooseTarget(c, boss, attacks, waves) {
        var best = null, bestScore = -Infinity;
        for (var k = 0; k < 12; k++) {
            var a = k * Math.PI / 6 + c.phase;
            var d = 74 + (k % 3) * 28;
            var x = clamp(boss.x + Math.cos(a) * d, 20, 380);
            var y = clamp(boss.y + Math.sin(a) * d, 20, 480);
            var score = -Math.hypot(x - c.x, y - c.y) * 0.06;
            if (dangerAt(attacks, waves, x, y, 0)) score -= 140;
            if (dangerAt(attacks, waves, x, y, 8)) score -= 90;
            if (dangerAt(attacks, waves, x, y, 18)) score -= 45;
            score += Math.min(30, Math.min(x - 20, 380 - x, y - 20, 480 - y)) * 0.2;
            if (score > bestScore) { bestScore = score; best = {x:x,y:y}; }
        }
        return best || {x:clamp(boss.x+100,20,380),y:clamp(boss.y+100,20,480)};
    }
    function bossTarget(ctx) {
        var target = null;
        try {
            if (ctx.type !== "arena" && typeof window.getDioUniqueBossTarget === "function") target = window.getDioUniqueBossTarget(ctx);
        } catch (e) {}
        var p = target || (ctx.getBossPosition && ctx.getBossPosition()) || {x:200,y:130};
        return {x:Number(p.x)||200,y:Number(p.y)||130,ref:target};
    }
    function currentBossHp(ctx) {
        try { return Math.max(0, Number(ctx.getBossHp && ctx.getBossHp()) || 0); } catch (e) { return 0; }
    }
    function maxBossHp(ctx) {
        try { return Math.max(1, Number(ctx.getBossMaxHp && ctx.getBossMaxHp()) || currentBossHp(ctx) || 1); } catch (e) { return 1; }
    }
    function dealDamage(ctx, c) {
        var maxHp = maxBossHp(ctx);
        var damage = Math.max(1, Math.floor(maxHp * 0.00008));
        var before = currentBossHp(ctx);
        var ok = false;
        try {
            window.__mbGERTrainingSwarmDamageInFlight = true;
            if (typeof ctx.damageBoss === "function") ok = ctx.damageBoss(damage) !== false;
            else if (typeof window.MBApplyBossDamage === "function") ok = window.MBApplyBossDamage(ctx, damage, "GER Swarm") > 0;
        } catch (e) {}
        window.__mbGERTrainingSwarmDamageInFlight = false;
        var after = currentBossHp(ctx);
        var dealt = Math.max(0, before - after);
        if (dealt > 0) {
            c.damageDealt += dealt;
            c.hits++;
            c.score += 1 + dealt / Math.max(1, maxHp) * 100000;
            c.flashUntil = now() + 120;
            return true;
        }
        return !!ok;
    }
    function updateClone(c, ctx, boss, attacks, waves, time, frameScale) {
        if (!c.alive) return;
        if (time >= c.nextDecisionAt) {
            var chosen = chooseTarget(c, boss, attacks, waves);
            c.tx = chosen.x;
            c.ty = chosen.y;
            c.nextDecisionAt = time + 120 + Math.random() * 120;
        }
        var threatened = dangerAt(attacks, waves, c.x, c.y, 0) ||
            dangerAt(attacks, waves, c.x + c.vx * 4, c.y + c.vy * 4, 4);
        if (threatened) {
            var safe = chooseTarget(c, boss, attacks, waves);
            c.tx = safe.x; c.ty = safe.y;
            c.nextDecisionAt = time + 80;
            if (!c.wasThreatened) {
                c.dodges++;
                c.score += 1;
            }
            c.wasThreatened = true;
        } else {
            c.wasThreatened = false;
        }
        var dx = c.tx - c.x, dy = c.ty - c.y;
        var len = Math.hypot(dx,dy) || 1;
        var speed = Math.min(3.6, Math.max(0.7, len * 0.09));
        c.vx += (dx / len * speed - c.vx) * 0.18;
        c.vy += (dy / len * speed - c.vy) * 0.18;
        c.x = clamp(c.x + c.vx * frameScale, 12, 388);
        c.y = clamp(c.y + c.vy * frameScale, 12, 488);

        var activeHit = null;
        for (var hi=0; hi<attacks.length && !activeHit; hi++) activeHit = getThreat(attacks[hi], c.x, c.y, 0, false);
        if ((activeHit || waves.some(function(w){return w && !w.odenHit && Math.abs(Math.hypot(c.x-(Number(w.x)||0),c.y-(Number(w.y)||0))-(Number(w.radius)||0)) < (Number(w.width)||8)*0.7+12;})) && time - c.lastHitAt > 500) {
            c.lastHitAt = time;
            var damage = Math.max(1, Number(activeHit && activeHit.attack && activeHit.attack.damage) || 10);
            c.damageTaken += damage;
            c.hp--;
            c.score -= 5;
            c.flashUntil = time + 180;
            if (c.hp <= 0) { c.alive = false; c.score -= 10; }
        }
        if (c.alive && time >= c.nextAttackAt && Math.hypot(c.x - boss.x, c.y - boss.y) <= 142) {
            if (dealDamage(ctx, c)) c.nextAttackAt = time + 850 + Math.random() * 250;
            else c.nextAttackAt = time + 450;
        }
    }
    function update(dt) {
        if (!active || ended) return;
        var ctx = context();
        if (!ctx || !ctx.getAttacks || !ctx.getBossPosition) return;
        var time = now();
        var boss = bossTarget(ctx);
        var attacks = [];
        var waves = [];
        try { attacks = ctx.getAttacks() || []; } catch (e) {}
        try { waves = ctx.getShockwaves ? ctx.getShockwaves() || [] : []; } catch (e) {}
        var scale = clamp((Number(dt)||16.667)/16.667,0.5,2.2);
        for (var i=0;i<clones.length;i++) updateClone(clones[i],ctx,boss,attacks,waves,time,scale);
        if (time - lastUiAt > 1000) { updatePanel(ctx); lastUiAt = time; }
        var hpNow = currentBossHp(ctx);
        if (hpNow > 0) zeroHpSince = 0;
        else {
            if (!zeroHpSince) zeroHpSince = time;
            // Unique bosses can briefly have 0 HP between real phases. Wait for the
            // native transition/next phase before declaring the training complete.
            if (time - zeroHpSince >= 5000) {
                finishScores("boss_defeated");
                if (window.__mbBossTestMode && typeof window.MBBossTestFinish === "function") {
                    window.MBBossTestFinish("win", false);
                }
            }
        }
    }
    function draw() {
        if (!active || !overlayCtx || !overlay) return;
        placeOverlay();
        var c = overlayCtx;
        c.clearRect(0,0,400,500);
        for (var i=0;i<clones.length;i++) {
            var p=clones[i];
            if (!p.alive) continue;
            var pulse=0.7+Math.sin(now()/180+p.phase)*0.18;
            c.save();
            c.globalAlpha=p.flashUntil>now()?1:pulse;
            c.translate(p.x,p.y);
            c.fillStyle=p.flashUntil>now()?"#fff4c9":"#e8b84c";
            c.strokeStyle="#704516";
            c.lineWidth=1;
            c.beginPath();
            c.ellipse(0,0,4.2,6.4,0,0,Math.PI*2);
            c.fill();c.stroke();
            c.fillStyle="#fff0a8";
            c.beginPath();c.arc(0,-3.2,2.1,0,Math.PI*2);c.fill();
            c.strokeStyle="#704516";
            c.lineWidth=1.25;
            c.beginPath();
            c.moveTo(-2.1,-0.5); c.lineTo(-3.8,2.5);
            c.moveTo(2.1,-0.5); c.lineTo(3.8,2.5);
            c.moveTo(-2.2,2.5); c.lineTo(-3.2,5.6);
            c.moveTo(2.2,2.5); c.lineTo(3.2,5.6);
            c.stroke();
            c.strokeStyle="#f5d477";
            c.lineWidth=1.6;
            c.beginPath();
            c.moveTo(-2.1,-0.5); c.lineTo(-4.2,1.6);
            c.moveTo(2.1,-0.5); c.lineTo(4.2,1.6);
            c.stroke();
            c.fillStyle="#8ee6a1";
            c.beginPath(); c.arc(0,-6.2,1.15,0,Math.PI*2); c.fill();
            c.restore();
        }
        // Draw the full GER model on the persistent overlay, not on the boss canvas
        // that is cleared again by each unique-boss render loop.
        if (typeof window.MBDrawGoldExperience === "function") {
            try { window.MBDrawGoldExperience(c); } catch (e) {}
        }
    }
    function updatePanel(ctx) {
        if (!panel) return;
        var alive=clones.filter(function(c){return c.alive;}).length;
        var totalDamage=clones.reduce(function(n,c){return n+c.damageDealt;},0);
        var totalTaken=clones.reduce(function(n,c){return n+c.damageTaken;},0);
        var sorted=clones.slice().sort(function(a,b){return b.score-a.score;});
        var summary=panel.querySelector("#mbGERSwarmSummary");
        var leaders=panel.querySelector("#mbGERSwarmLeaders");
        if(summary) summary.textContent="Игрок: наблюдатель · Живы: "+alive+"/"+COUNT+" · Урон боссу: "+Math.floor(totalDamage)+" · Получено: "+Math.floor(totalTaken);
        if(leaders) leaders.innerHTML=sorted.slice(0,5).map(function(c){return "<div style='display:flex;justify-content:space-between;gap:8px'><span>GER-"+String(c.id).padStart(2,"0")+" · "+(c.alive?"жив":"выбыл")+"</span><b>"+Math.floor(c.score)+" оч.</b></div>";}).join("");
    }
    function finishScores(reason) {
        if (ended) return;
        ended=true;
        var survivors=clones.filter(function(c){return c.alive;});
        var completed = reason === "boss_defeated" || reason === "win";
        if (completed) survivors.forEach(function(c){c.score+=150;});
        var damageRank=clones.slice().sort(function(a,b){return b.damageDealt-a.damageDealt;});
        if(completed && damageRank[0])damageRank[0].score+=120;
        var takenRank=clones.slice().sort(function(a,b){return b.damageTaken-a.damageTaken;});
        if(completed && takenRank[0]&&takenRank[0].damageTaken>0)takenRank[0].score-=120;
        clones.sort(function(a,b){return b.score-a.score;});
        var top=clones.slice(0,10).map(function(c){return "GER-"+String(c.id).padStart(2,"0")+": "+Math.floor(c.score)+" оч. (урон "+Math.floor(c.damageDealt)+", получено "+Math.floor(c.damageTaken)+", "+(c.alive?"выжил":"выбыл")+")";});
        console.log("[GER SWARM RESULTS]",reason,{survivors:survivors.length,clones:clones,top:top});
        if(panel){
            var summary=panel.querySelector("#mbGERSwarmSummary");
            var leaders=panel.querySelector("#mbGERSwarmLeaders");
            if(summary)summary.textContent="ИТОГ · Выжили "+survivors.length+"/"+COUNT+" · Удары: "+totalHits+" · Уклонения: "+totalDodges+" · Урон боссу: "+Math.floor(totalDamage)+" · Получено: "+Math.floor(totalTaken);
            if(leaders)leaders.innerHTML=top.map(function(line){return "<div>"+line+"</div>";}).join("");
        }
        var totalHits=clones.reduce(function(n,c){return n+c.hits;},0);
        var totalDodges=clones.reduce(function(n,c){return n+c.dodges;},0);
        var totalDamage=clones.reduce(function(n,c){return n+c.damageDealt;},0);
        var totalTaken=clones.reduce(function(n,c){return n+c.damageTaken;},0);
        var resultRows=clones.map(function(c){return {id:c.id,score:Math.floor(c.score),damageDealt:Math.floor(c.damageDealt),damageTaken:Math.floor(c.damageTaken),hits:c.hits,dodges:c.dodges,alive:c.alive};});
        damageLeaderboard={reason:reason,survivors:survivors.length,totalHits:totalHits,totalDodges:totalDodges,totalDamage:Math.floor(totalDamage),totalDamageTaken:Math.floor(totalTaken),results:resultRows};
        window.__mbGERTrainingSwarmResults=damageLeaderboard;
        // Send one compact end-of-run observation per agent into the same online
        // training queue, so the 50-agent batch contributes to the shared brain.
        var trainingApi=window.MBGERTraining;
        if(trainingApi&&typeof trainingApi.recordOutcome==="function"){
            clones.forEach(function(c){
                try{
                    trainingApi.recordOutcome({
                        attackKey:"swarm_agent_survival",
                        attackFamily:"swarm",
                        bossPhase:"final",
                        timeToImpactMs:0,
                        heartX:c.x,heartY:c.y,velocityX:c.vx,velocityY:c.vy,
                        chosenDirection:0,targetX:c.tx,targetY:c.ty,
                        features:{
                            agentId:c.id,alive:c.alive,score:Math.floor(c.score),
                            damageDealt:Math.floor(c.damageDealt),damageTaken:Math.floor(c.damageTaken),
                            hits:c.hits,dodges:c.dodges,completed:completed
                        }
                    },c.damageTaken>0?"hit":(c.alive?"evaded":"unknown"),c.damageTaken);
                }catch(e){}
            });
        }
    }
    function tick(ts) {
        raf=0;
        if(!active)return;
        var t=Number(ts)||now();
        var dt=lastAt?clamp(t-lastAt,1,40):16.667;
        lastAt=t;
        update(dt);
        draw();
        raf=window.requestAnimationFrame(tick);
    }
    function skipOpeningMoments() {
        if (!active || !window.__mbGERTrainingMode) return;
        try {
            var ctx = context();
            if (ctx && typeof ctx.getPlayerMaxHp === "function" && typeof ctx.setPlayerHp === "function") {
                ctx.setPlayerHp(ctx.getPlayerMaxHp());
                // Keep the human heart parked as a harmless spectator anchor. Bosses
                // still generate their native patterns, but the player cannot fight.
                if (typeof ctx.setHeartX === "function") ctx.setHeartX(200);
                if (typeof ctx.setHeartY === "function") ctx.setHeartY(478);
            }
            var wave = Number(window.__mbBossTestMode && window.__mbBossTestMode.bossWave);
            if (wave===200 && typeof window.MBGERTrainingTickLivingStone==="function") window.MBGERTrainingTickLivingStone();
            if (wave===500 && typeof window.MBGERTrainingSkipWaystarScenes==="function") window.MBGERTrainingSkipWaystarScenes();
            if (wave===1000 && typeof window.MBGERTrainingSkipRWBScenes==="function") window.MBGERTrainingSkipRWBScenes();
            if (wave===2000 && window.__mbLS2TrainingSkipIntro) window.__mbLS2TrainingSkipIntro();
            if (wave===2000 && window.MBIsLivingStoneChaseActive && window.MBIsLivingStoneChaseActive() &&
                typeof window.MBSkipLivingStoneChase==="function") window.MBSkipLivingStoneChase();
        } catch(e) {}
    }
    function start() {
        if (active) return;
        active=true; ended=false; lastAt=0; lastUiAt=0; zeroHpSince=0;
        clones=[]; for(var i=0;i<COUNT;i++)clones.push(createClone(i));
        makeOverlay(); makePanel(); lockPlayerInput();
        lastBossHp=null;
        if(!window.__mbGERTrainingIsolationTimer) window.__mbGERTrainingIsolationTimer=window.setInterval(skipOpeningMoments,80);
        raf=window.requestAnimationFrame(tick);
        console.info("[GER SWARM] Started 50 lightweight autonomous stands. Player input and player damage are disabled.");
    }
    function stop(reason) {
        if(!active)return;
        active=false;
        unlockPlayerInput();
        if(raf)window.cancelAnimationFrame(raf);
        raf=0;lastAt=0;
        if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);
        if(panel) {
            panel.style.position = "fixed";
            panel.style.top = "calc(12px + env(safe-area-inset-top))";
            panel.style.left = "12px";
            panel.style.pointerEvents = "auto";
        }
        overlay=null;overlayCtx=null;
        if(reason!=="boss_defeated"&&!ended)finishScores(reason||"stopped");
        console.info("[GER SWARM] Stopped:",reason||"stopped");
    }
    window.MBGERTrainingSwarmStart=start;
    window.MBGERTrainingSwarmStop=stop;
    window.MBGERTrainingSwarmFinish=finishScores;
})();
