// DIO OVER HEAVEN — отдельный модуль.
// Зависит от общих игровых контекстов, которые объявляет supers.js.
// Содержимое перенесено без изменения логики, чтобы сохранить текущее поведение.

// ★ DIO OH: отдельные, заранее загружаемые звуки для подготовки и остановки времени.
var _dioAudioCache = {};
var _dioMusicDuckState = [];
var _dioMusicResumeAttemptedAudio = null;
// A rolling cap prevents fast multi-hit bosses from instantly filling DIO's meter.
var DIO_ENERGY_GAIN_PER_SECOND = 8;
var _dioEnergyGainEvents = [];
var DIO_PASSIVE_ENERGY_INTERVAL_MS = 2000;

function dioSoundKey(path) {
    if (path === "music/dios-time-stop-teleportation-sound-effect-1.mp3") return "dioTeleport";
    if (path === "music/za-warudo-time-stop-louder.mp3") return "dioTimeStop";
    if (path === "music/time-resumes.mp3") return "dioTimeResume";
    return null;
}
function dioResolveSoundSource(path) {
    try {
        var key = dioSoundKey(path);
        var track = key && typeof window.getLoadedMusic === "function" ? window.getLoadedMusic(key) : null;
        if (track && track.url) return track.url;
    } catch (e) {}
    return path;
}
function dioPrepareSound(path) {
    var audio = _dioAudioCache[path];
    var source = dioResolveSoundSource(path);
    if (!audio) {
        audio = new Audio();
        audio.preload = "auto";
        _dioAudioCache[path] = audio;
    }
    try {
        var oldSource = audio.getAttribute ? audio.getAttribute("src") : "";
        if (!oldSource || oldSource !== source) {
            audio.src = source;
            audio.load();
        }
        audio.defaultPlaybackRate = 1;
        audio.playbackRate = 1;
    } catch (e) {}
    return audio;
}
function preloadDioSounds() {
    var files = [
        "music/za-warudo-time-stop-louder.mp3",
        "music/dios-time-stop-teleportation-sound-effect-1.mp3",
        "music/dio_muda_muda_muda.mp3",
        "music/Voicy_Dio Brando muda muda.mp3"
    ];
    for (var i = 0; i < files.length; i++) {
        try {
            var audio = dioPrepareSound(files[i]);
            audio.volume = 0.72;
        } catch (e) {}
    }
}
function dioPlaySound(path, volume) {
    try {
        var audio = dioPrepareSound(path);
        // Invalidate any delayed silent-prime callback before starting the real cue.
        audio._dioPlaybackToken = (audio._dioPlaybackToken || 0) + 1;
        // Never inherit slow playback from another effect. Every DIO cue is real-time.
        audio.defaultPlaybackRate = 1;
        audio.playbackRate = 1;
        audio.pause();
        audio.muted = false;
        audio.currentTime = 0;
        audio.volume = (typeof volume === "number") ? Math.max(0, Math.min(1, volume)) : 0.72;
        var p = audio.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
        return audio;
    } catch (e) { return null; }
}

function dioPrimeSoundForGesture(path, restoreVolume) {
    try {
        var audio = dioPrepareSound(path);
        if (audio._dioGesturePrimed || audio._dioPrimePending || audio.readyState < 2) return;
        var wantedVolume = (typeof restoreVolume === "number") ? restoreVolume : 0.72;
        var token = (audio._dioPlaybackToken || 0) + 1;
        audio._dioPlaybackToken = token;
        audio._dioPrimePending = true;
        // Use the muted flag, not volume=0, so the delayed ZA WARUDO track can
        // be unlocked for mobile browsers without leaking even a fraction of audio.
        audio.muted = true;
        audio.volume = wantedVolume;
        try { audio.currentTime = 0; } catch (e) {}
        var p = audio.play();
        if (p && typeof p.then === "function") {
            p.then(function () {
                // A late unlock callback must never pause or mute a real cue.
                if (audio._dioPlaybackToken !== token) return;
                audio.pause();
                try { audio.currentTime = 0; } catch (e) {}
                audio.muted = false;
                audio.volume = wantedVolume;
                audio._dioGesturePrimed = true;
                audio._dioPrimePending = false;
            }).catch(function () {
                if (audio._dioPlaybackToken === token) {
                    audio.muted = false;
                    audio.volume = wantedVolume;
                }
                audio._dioPrimePending = false;
            });
        } else {
            if (audio._dioPlaybackToken === token) {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = false;
                audio.volume = wantedVolume;
                audio._dioGesturePrimed = true;
            }
            audio._dioPrimePending = false;
        }
    } catch (e) {}
}
function dioCollectBackgroundMusic() {
    var found = [];
    function add(audio, includePaused) {
        if (!audio || typeof audio.volume !== "number" || typeof audio.play !== "function") return;
        if (!includePaused && audio.paused) return;
        if (Object.keys(_dioAudioCache).some(function (path) { return _dioAudioCache[path] === audio; })) return;
        if (found.indexOf(audio) < 0) found.push(audio);
    }
    // Current game soundtrack, plus boss tracks if that mode exposes them globally.
    try { if (typeof currentMusic !== "undefined") add(currentMusic, true); } catch (e) {}
    try { if (typeof mainMusic !== "undefined") add(mainMusic, false); } catch (e) {}
    try { if (typeof battleMusic !== "undefined") add(battleMusic, false); } catch (e) {}
    try { if (typeof shopMusic !== "undefined") add(shopMusic, false); } catch (e) {}
    try { if (typeof waystarMusic !== "undefined") add(waystarMusic, false); } catch (e) {}
    try { if (typeof qteMusic !== "undefined") add(qteMusic, false); } catch (e) {}
    try { if (typeof lsMusic !== "undefined") add(lsMusic, false); } catch (e) {}
    try { if (typeof rwbMusic !== "undefined") add(rwbMusic, false); } catch (e) {}
    try { add(window.waystarMusic, false); } catch (e) {}
    return found;
}
function dioSyncAudioMix() {
    var stopped = isDioTimeStopped();
    // Keep DIO's two sound effects at normal speed and at their chosen cue volume.
    for (var path in _dioAudioCache) {
        var effect = _dioAudioCache[path];
        if (!effect) continue;
        try {
            effect.defaultPlaybackRate = 1;
            if (effect.playbackRate !== 1) effect.playbackRate = 1;
        } catch (e) {}
    }

    if (stopped) {
        // If the selected soundtrack was accidentally left paused while music is
        // enabled, try to resume that same track rather than replacing it.
        try {
            var selectedMusic = (typeof currentMusic !== "undefined") ? currentMusic : null;
            var musicCanPlay = (typeof musicEnabled === "undefined" || musicEnabled);
            if (selectedMusic && musicCanPlay && selectedMusic.paused &&
                _dioMusicResumeAttemptedAudio !== selectedMusic) {
                _dioMusicResumeAttemptedAudio = selectedMusic;
                var musicPromise = selectedMusic.play();
                if (musicPromise && typeof musicPromise.catch === "function") musicPromise.catch(function () {});
            }
        } catch (e) {}
        var music = dioCollectBackgroundMusic();
        for (var i = 0; i < music.length; i++) {
            var audio = music[i], entry = null;
            for (var j = 0; j < _dioMusicDuckState.length; j++) {
                if (_dioMusicDuckState[j].audio === audio) { entry = _dioMusicDuckState[j]; break; }
            }
            if (!entry) {
                entry = { audio: audio, volume: audio.volume };
                _dioMusicDuckState.push(entry);
            }
            var quietVolume = Math.max(0, Math.min(1, entry.volume * 0.15));
            if (Math.abs(audio.volume - quietVolume) > 0.005) audio.volume = quietVolume;
        }
    } else {
        _dioMusicResumeAttemptedAudio = null;
        if (_dioMusicDuckState.length) {
            for (var k = 0; k < _dioMusicDuckState.length; k++) {
                try { _dioMusicDuckState[k].audio.volume = _dioMusicDuckState[k].volume; } catch (e) {}
            }
            _dioMusicDuckState = [];
        }
    }
}
window.preloadDioSounds = preloadDioSounds;
preloadDioSounds();

// Красное сердце DIO и маленькое декоративное сердце THE WORLD.
// Декоративный элемент не участвует в хитбоксах, уроне или управлении.
function drawDioHeartVisual(targetCtx, x, y, size) {
    if (!targetCtx) return false;
    var hs = Math.max(0.5, (Number(size) || 14) / 14);
    targetCtx.save();
    targetCtx.translate(Number(x) || 0, Number(y) || 0);
    targetCtx.scale(hs, hs);
    var heartPath = function() {
        targetCtx.beginPath();
        targetCtx.moveTo(0, 6);
        targetCtx.bezierCurveTo(-2, 4, -9, -1, -9, -5);
        targetCtx.bezierCurveTo(-9, -11, -2, -12, 0, -7);
        targetCtx.bezierCurveTo(2, -12, 9, -11, 9, -5);
        targetCtx.bezierCurveTo(9, -1, 2, 4, 0, 6);
        targetCtx.closePath();
    };
    targetCtx.shadowColor = "#ff1f35";
    targetCtx.shadowBlur = 9;
    var mainGrad = targetCtx.createLinearGradient(-7, -10, 7, 7);
    mainGrad.addColorStop(0, "#ff6472");
    mainGrad.addColorStop(0.42, "#ed1235");
    mainGrad.addColorStop(1, "#780018");
    targetCtx.fillStyle = mainGrad;
    heartPath(); targetCtx.fill();

    // Глянцевая фактура: тонкие прожилки и тёмные складки, обрезанные по форме сердца.
    targetCtx.save();
    heartPath();
    targetCtx.clip();
    targetCtx.globalAlpha = 0.34;
    targetCtx.strokeStyle = "#8f001d";
    targetCtx.lineWidth = 1.15;
    targetCtx.beginPath();
    targetCtx.moveTo(-6.5, -7.5);
    targetCtx.bezierCurveTo(-3.5, -5.5, -4.5, -1.5, -1, 1.5);
    targetCtx.moveTo(6, -7);
    targetCtx.bezierCurveTo(3.5, -4.5, 4, -1.5, 1, 2.5);
    targetCtx.moveTo(-3, -1);
    targetCtx.quadraticCurveTo(0, 0, 3, -1.5);
    targetCtx.stroke();
    targetCtx.globalAlpha = 0.22;
    targetCtx.strokeStyle = "#ff9aa3";
    targetCtx.lineWidth = 0.8;
    targetCtx.beginPath();
    targetCtx.moveTo(-5.5, -8);
    targetCtx.quadraticCurveTo(-7, -5, -4.5, -3);
    targetCtx.moveTo(2, -8);
    targetCtx.quadraticCurveTo(5.5, -6, 4.5, -4);
    targetCtx.stroke();
    targetCtx.restore();

    targetCtx.shadowBlur = 0;
    targetCtx.strokeStyle = "#510014";
    targetCtx.lineWidth = 1.1;
    heartPath(); targetCtx.stroke();
    // Блик придаёт сердцу объём, а маленькие точки работают как текстурные отблески.
    targetCtx.fillStyle = "rgba(255,245,195,.9)";
    targetCtx.beginPath();
    targetCtx.ellipse(-3.5, -6.5, 1.7, 2.4, -0.5, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.fillStyle = "rgba(255,160,175,.7)";
    targetCtx.beginPath();
    targetCtx.arc(4.8, -3.5, 0.65, 0, Math.PI * 2);
    targetCtx.arc(-1.8, 1.5, 0.5, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.restore();
    return true;
}
window.drawDioHeartVisual = drawDioHeartVisual;

// В бою DIO снова использует исходный скин-сердце; GIF остаётся только для карточки.
function drawDioPlayerVisual(c,x,y,size){
 if(!c)return false;
 return drawDioHeartVisual(c,x,y,size);
}
window.drawDioPlayerVisual=drawDioPlayerVisual;
function drawDioStandVisual(c,x,y,size){
 if(!c)return false;var sc=Math.max(.35,(Number(size)||10)/14);c.save();c.translate(Number(x)||0,Number(y)||0);c.scale(sc,sc);c.shadowColor="#fff";c.shadowBlur=12;
 var heart=function(){c.beginPath();c.moveTo(0,6);c.bezierCurveTo(-2,4,-9,-1,-9,-5);c.bezierCurveTo(-9,-11,-2,-12,0,-7);c.bezierCurveTo(2,-12,9,-11,9,-5);c.bezierCurveTo(9,-1,2,4,0,6);c.closePath();};
 var g=c.createLinearGradient(-7,-10,7,7);g.addColorStop(0,"#fff");g.addColorStop(.58,"#f4f8ff");g.addColorStop(1,"#b9c8dc");c.fillStyle=g;heart();c.fill();c.shadowBlur=0;c.strokeStyle="#fff";c.lineWidth=1.4;heart();c.stroke();c.fillStyle="#52647a";c.beginPath();c.arc(-3,-4.5,1,0,Math.PI*2);c.fill();c.beginPath();c.arc(3,-4.5,1,0,Math.PI*2);c.fill();c.restore();return true;
}
window.drawDioStandVisual=drawDioStandVisual;
function dioGetStandPosition(ctxB){
 ctxB=ctxB||((typeof getBossContext==="function")?getBossContext():null);if(!ctxB||typeof ctxB.getHeartX!=="function"||typeof ctxB.getHeartY!=="function")return null;
 var px=Number(ctxB.getHeartX())||0,py=Number(ctxB.getHeartY())||0;
 if(typeof _superState!=="undefined"&&_superState.dioMudaActive&&_superState.dioMudaMode==="melee"&&isFinite(Number(_superState.dioMudaStandX))&&isFinite(Number(_superState.dioMudaStandY)))return{x:Number(_superState.dioMudaStandX),y:Number(_superState.dioMudaStandY),radius:7};
 return{x:px+(px>300?-20:20),y:py-8,radius:7};
}
window.getDioStandPosition=dioGetStandPosition;
function dioIsKnifeWindupActive(){return typeof _superState!=="undefined"&&!!_superState.dioMudaActive&&_superState.dioMudaMode==="knives"&&performance.now()-(_superState.dioMudaStartedAt||0)<2000;}
window.dioIsKnifeWindupActive=dioIsKnifeWindupActive;
function dioPlaySoundFrom(path,volume,startSeconds){
 try{var audio=dioPrepareSound(path);if(!audio)return null;audio._dioPlaybackToken=(audio._dioPlaybackToken||0)+1;var token=audio._dioPlaybackToken;audio.defaultPlaybackRate=1;audio.playbackRate=1;audio.pause();audio.muted=false;audio.volume=Math.max(0,Math.min(1,Number(volume)||.8));var start=Math.max(0,Number(startSeconds)||0);
 var begin=function(){if(audio._dioPlaybackToken!==token)return;try{audio.currentTime=Math.min(start,Math.max(0,(audio.duration||start+.1)-.05));}catch(e){}var p=audio.play();if(p&&p.catch)p.catch(function(){});};
 if(audio.readyState>=1)begin();else{audio.addEventListener("loadedmetadata",begin,{once:true});try{audio.load();}catch(e){}}return audio;
 }catch(e){return null;}
}
function dioDrawKnife(c,k){
 var a=Number(k.angle)||Math.atan2(k.vy||0,k.vx||1);c.save();c.translate(k.x,k.y);c.rotate(a);c.globalAlpha=isDioTimeStopped()?.9:1;c.shadowColor="#d7e6ff";c.shadowBlur=7;c.fillStyle="#eaf3ff";c.strokeStyle="#65758c";c.lineWidth=1;c.beginPath();c.moveTo(10,0);c.lineTo(-3,-3.1);c.lineTo(-1,0);c.lineTo(-3,3.1);c.closePath();c.fill();c.stroke();c.shadowBlur=0;c.fillStyle="#cda94e";c.fillRect(-5,-1.4,4,2.8);c.fillStyle="#55452d";c.fillRect(-8,-1.2,3,2.4);c.restore();
}
function dioRenderSkillEffects(ctxB){
 if(!ctx||!isDioOverHeavenMain()||typeof _superState==="undefined")return;var now=performance.now(),knives=Array.isArray(_superState.dioKnives)?_superState.dioKnives:[];
 for(var i=0;i<knives.length;i++){var k=knives[i];if(isDioTimeStopped()){ctx.save();ctx.globalAlpha=.6;ctx.strokeStyle="#dce9ff";ctx.setLineDash([3,3]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(k.x,k.y,8+Math.sin(now/100+i)*1.5,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();}dioDrawKnife(ctx,k);}
 if((_superState.dioStandAttackUntil||0)>now){var sx=Number(_superState.dioStandAttackSourceX)||0,sy=Number(_superState.dioStandAttackSourceY)||0,tx=Number(_superState.dioStandAttackX)||sx,ty=Number(_superState.dioStandAttackY)||sy;ctx.save();ctx.globalAlpha=Math.min(1,(_superState.dioStandAttackUntil-now)/100);ctx.strokeStyle="#fff";ctx.shadowColor="#fff";ctx.shadowBlur=10;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+tx)/2,Math.min(sy,ty)-11,tx,ty);ctx.stroke();ctx.strokeStyle="#d7b6ff";ctx.beginPath();ctx.moveTo(tx-5,ty-6);ctx.lineTo(tx+5,ty+6);ctx.moveTo(tx+5,ty-6);ctx.lineTo(tx-5,ty+6);ctx.stroke();ctx.restore();}
 if(_superState.dioMudaActive&&_superState.dioMudaMode==="knives"){
  var windupElapsed=now-(_superState.dioMudaStartedAt||now);
  if(windupElapsed<2000){var wp=dioGetStandPosition(ctxB);var wx=wp?wp.x:0,wy=wp?wp.y:0;for(var wi=0;wi<5;wi++){var wa=-Math.PI*.5+(wi-2)*.35;dioDrawKnife(ctx,{x:wx+Math.cos(wa)*18,y:wy+Math.sin(wa)*18,vx:Math.cos(wa),vy:Math.sin(wa),angle:wa});}ctx.save();ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.fillStyle="#fff0a0";ctx.shadowColor="#e7c04d";ctx.shadowBlur=8;ctx.fillText("KNIVES "+Math.max(0,(2-windupElapsed/1000)).toFixed(1)+"s",wx,wy+27);ctx.restore();}
 }
 if(_superState.dioMudaActive&&_superState.dioMudaMode==="melee"){var t=now-(Number(_superState.dioMudaLastHitAt)||0);if(_superState.dioMudaLastHitAt>0&&t>=0&&t<170){var p=dioGetStandPosition(ctxB);if(p){ctx.save();ctx.globalAlpha=1-t/170;ctx.strokeStyle="#fff4a4";ctx.shadowColor="#ffdf73";ctx.shadowBlur=9;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,10+(170-t)*.06,now/70,now/70+1.55);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-10,p.y-9);ctx.lineTo(p.x+9,p.y+8);ctx.moveTo(p.x+10,p.y-8);ctx.lineTo(p.x-8,p.y+9);ctx.stroke();ctx.restore();}}}
}
window.dioRenderSkillEffects=dioRenderSkillEffects;
function dioRenderPlayerAndStand(ctxB){if(!ctx||!ctxB||!isDioOverHeavenMain())return;drawDioPlayerVisual(ctx,ctxB.getHeartX(),ctxB.getHeartY(),ctxB.getHeartSize?ctxB.getHeartSize():12);var p=dioGetStandPosition(ctxB);if(p)drawDioStandVisual(ctx,p.x,p.y,10);dioRenderSkillEffects(ctxB);}
window.dioRenderPlayerAndStand=dioRenderPlayerAndStand;
function dioGetUniqueBossTarget(ctxB,preferredId){
 ctxB=ctxB||((typeof getBossContext==="function")?getBossContext():null);if(!ctxB||!["waystar","stone","rwb"].includes(ctxB.type))return null;
 if(ctxB.type==="waystar"&&typeof waystarBossHp!=="undefined"&&typeof waystarBossMaxHp!=="undefined"){var w=(typeof waystarState!=="undefined"&&waystarState==="phase3"&&typeof waystarSmallBoss!=="undefined")?waystarSmallBoss:((typeof waystarBoss!=="undefined")?waystarBoss:null);return{type:"waystar",id:"waystar",x:w?w.x:200,y:w?w.y:120,size:w?(w.size||22):22,hp:waystarBossHp,maxHp:waystarBossMaxHp,ref:w};}
 if(ctxB.type==="stone"&&typeof livingStoneBossHp!=="undefined"&&typeof livingStoneBossMaxHp!=="undefined"){var s=typeof livingStoneBoss!=="undefined"?livingStoneBoss:null;return{type:"stone",id:"stone",x:s?s.x:200,y:s?s.y:130,size:s?(s.size||26):26,hp:livingStoneBossHp,maxHp:livingStoneBossMaxHp,ref:s};}
 if(ctxB.type==="rwb"){var active=typeof window.getRWBActiveBoss==="function"?window.getRWBActiveBoss():null;var targets=typeof window.getRWBTargets==="function"?window.getRWBTargets():[];if(preferredId){if(active&&active.id===preferredId)return{type:"rwb",id:active.id,x:active.x,y:active.y,size:active.size||28,hp:active.hp,maxHp:active.maxHp,ref:active};for(var ri=0;ri<targets.length;ri++)if(targets[ri]&&targets[ri].id===preferredId){var q=targets[ri];return{type:"rwb",id:q.id,x:q.x,y:q.y,size:q.size||28,hp:q.hp,maxHp:q.maxHp,ref:q};}}
 if(!active&&targets.length){var player=typeof window.getRWBPlayer==="function"?window.getRWBPlayer():null,best=null,bd=Infinity;for(var i=0;i<targets.length;i++){var cand=targets[i];if(!cand)continue;var d=player?Math.hypot(cand.x-player.x,cand.y-player.y):0;if(d<bd){best=cand;bd=d;}}active=best;}if(!active)return null;return{type:"rwb",id:active.id,x:active.x,y:active.y,size:active.size||28,hp:active.hp,maxHp:active.maxHp,ref:active};}
 return null;
}
window.getDioUniqueBossTarget=dioGetUniqueBossTarget;
function dioApplyBossDamageNow(type,id,amount){
 amount=Math.max(0,Number(amount)||0);if(!amount)return;var cb=typeof getBossContext==="function"?getBossContext():null;if(!cb||cb.type!==type)return;var t=dioGetUniqueBossTarget(cb,id);if(!t)return;var dmg=Math.max(1,Math.round(amount));
 if(type==="waystar"){if(typeof waystarBossHp==="undefined")return;waystarBossHp=Math.max(0,waystarBossHp-dmg);if(typeof waystarBossFlash!=="undefined")waystarBossFlash=10;if(waystarBossHp<=0&&typeof waystarVictory==="function")waystarVictory();if(typeof spawnWaystarParticles==="function")spawnWaystarParticles(t.x,t.y,18,"#fff0a0",5);if(typeof addWaystarFlash==="function")addWaystarFlash(t.x,t.y,26);if(typeof addWaystarSlash==="function")addWaystarSlash(t.x,t.y,Math.random()*Math.PI*2,45,4);}
 else if(type==="stone"){if(typeof damageLivingStone==="function")damageLivingStone(dmg);if(typeof spawnLivingStoneParticles==="function")spawnLivingStoneParticles(t.x,t.y,18,"#fff",5);if(typeof spawnLivingStoneText==="function")spawnLivingStoneText(t.x,t.y-22,"-"+dmg+" DIO","#fff0a0",55);}
 else if(type==="rwb"){if(typeof window.rwbApplyDioSkillDamage==="function")window.rwbApplyDioSkillDamage(id,dmg);else if(t.ref){t.ref.hp=Math.max(0,t.ref.hp-dmg);t.ref.hitFlash=10;}if(typeof window.rwbAddShockwave==="function")window.rwbAddShockwave(t.x,t.y,"#fff",7,.35,4);if(typeof window.rwbAddFlashWhite==="function")window.rwbAddFlashWhite(2);}
 if(typeof window.showFloatingText==="function"){try{window.showFloatingText("-"+dmg+" DIO","#fff0a0");}catch(e){}}
}
function dioQueueOrApplyBossDamage(t,amount){if(!t||!(amount>0))return;if(isDioTimeStopped()){if(!Array.isArray(_superState.dioPendingBossDamage))_superState.dioPendingBossDamage=[];_superState.dioPendingBossDamage.push({type:t.type,id:t.id,amount:amount});return;}dioApplyBossDamageNow(t.type,t.id,amount);}
function dioFlushPendingBossDamage(){if(!_superState||!Array.isArray(_superState.dioPendingBossDamage)||!_superState.dioPendingBossDamage.length)return;var list=_superState.dioPendingBossDamage.splice(0),groups={};for(var i=0;i<list.length;i++){var p=list[i];if(!p)continue;var k=p.type+":"+p.id;if(!groups[k])groups[k]={type:p.type,id:p.id,amount:0};groups[k].amount+=Math.max(0,Number(p.amount)||0);}Object.keys(groups).forEach(function(k){var g=groups[k];dioApplyBossDamageNow(g.type,g.id,g.amount);});}
function dioLaunchKnifeVolley(ctxB){
 var t=dioGetUniqueBossTarget(ctxB,_superState.dioMudaTargetId);if(!t){_superState.dioMudaActive=false;_superState.dioMudaMode=null;return;}var px=ctxB.getHeartX(),py=ctxB.getHeartY(),base=Math.atan2(t.y-py,t.x-px);if(!Array.isArray(_superState.dioKnives))_superState.dioKnives=[];
 var total=Math.max(1,Math.floor(Number(_superState.dioMudaTotalDamage)||t.maxHp*.08));
 for(var i=0;i<5;i++){var a=base+(i-2)*.13;var d=Math.floor(total*(i+1)/5)-Math.floor(total*i/5);_superState.dioKnives.push({x:px+(px>300?-10:10),y:py-3,vx:Math.cos(a)*9.5,vy:Math.sin(a)*9.5,angle:a,life:180,damage:d,targetType:t.type,targetId:t.id});}
 _superState.dioMudaActive=false;_superState.dioMudaMode=null;if(typeof window.showFloatingText==="function")window.showFloatingText("KNIVES — THE WORLD!","#fff0a0");
}
function dioUpdateMudaSkill(dt){
 if(!isDioOverHeavenMain()||!_superState)return;var cb=typeof getBossContext==="function"?getBossContext():null,now=performance.now();
 if(_superState.dioMudaActive&&_superState.dioMudaMode==="melee"){var t=dioGetUniqueBossTarget(cb,_superState.dioMudaTargetId);if(!t){_superState.dioMudaActive=false;_superState.dioMudaMode=null;}else{
 var elapsed=Math.max(0,now-(_superState.dioMudaStartedAt||now)),travel=Math.min(1,elapsed/520),px=cb.getHeartX(),py=cb.getHeartY(),orbit=elapsed>520;
 _superState.dioMudaStandX=px+(t.x-px)*travel+(orbit?Math.sin(elapsed/42)*12:0);_superState.dioMudaStandY=py+(t.y-py)*travel+(orbit?Math.cos(elapsed/35)*8:0);
 var due=Math.min(12,Math.floor(elapsed/250));while((_superState.dioMudaHitIndex||0)<due){_superState.dioMudaHitIndex=(_superState.dioMudaHitIndex||0)+1;var cur=dioGetUniqueBossTarget(cb,_superState.dioMudaTargetId);if(!cur)break;var total=Math.max(1,Math.floor(Number(_superState.dioMudaTotalDamage)||cur.maxHp*.1)),idx=_superState.dioMudaHitIndex;var hitDmg=Math.floor(total*idx/12)-Math.floor(total*(idx-1)/12);dioQueueOrApplyBossDamage(cur,hitDmg);_superState.dioMudaLastHitAt=now;_superState.dioMudaImpactX=cur.x;_superState.dioMudaImpactY=cur.y;}
 if(elapsed>=3000){_superState.dioMudaActive=false;_superState.dioMudaMode=null;_superState.dioMudaStandX=null;_superState.dioMudaStandY=null;_superState.dioStandFlash=Math.max(_superState.dioStandFlash||0,.3);}}}
 else if(_superState.dioMudaActive&&_superState.dioMudaMode==="knives"&&now-(_superState.dioMudaStartedAt||now)>=2000)dioLaunchKnifeVolley(cb);
 else if(_superState.dioMudaActive&&_superState.dioMudaMode==="arenaKnives"&&now-(_superState.dioMudaStartedAt||now)>=100)dioLaunchArenaKnifeVolley(cb);
 var knives=Array.isArray(_superState.dioKnives)?_superState.dioKnives:[];if(knives.length){if(isDioTimeStopped())return;for(var i=knives.length-1;i>=0;i--){var k=knives[i];if(!k){knives.splice(i,1);continue;}var frames=Math.max(.25,Math.min(6,(Number(dt)||.016)*60));
  if(k.targetType==="arena"){
   var atk=cb&&typeof cb.getAttacks==="function"?cb.getAttacks():[],target=k.targetAttack;
   if(!target||atk.indexOf(target)<0){knives.splice(i,1);continue;}
   var tr=Number(target.size||target.radius||target.width||18)||18,tx=(Number(target.x)||0)+tr/2,ty=(Number(target.y)||0)+tr/2;
   var aa=Math.atan2(ty-k.y,tx-k.x),asp=Math.hypot(k.vx,k.vy)||10;k.angle=aa;k.vx=Math.cos(aa)*asp;k.vy=Math.sin(aa)*asp;k.x+=k.vx*frames;k.y+=k.vy*frames;k.life-=frames;
   if(Math.hypot(tx-k.x,ty-k.y)<tr/2+8){var ai=atk.indexOf(target);if(ai>=0)atk.splice(ai,1);var parts=cb&&typeof cb.getParticles==="function"?cb.getParticles():[];for(var pp=0;pp<7;pp++)parts.push({x:tx,y:ty,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,life:16,maxLife:16,color:pp%2?"#eaf3ff":"#d8b6ff",size:2+Math.random()*3});if(cb&&cb.playSound)cb.playSound(780,"square",.06,.08);knives.splice(i,1);}
   else if(k.life<=0||k.x<-40||k.x>440||k.y<-40||k.y>540)knives.splice(i,1);
   continue;
  }
  var t=dioGetUniqueBossTarget(cb,k.targetId);if(!t){knives.splice(i,1);continue;}var a=Math.atan2(t.y-k.y,t.x-k.x),sp=Math.hypot(k.vx,k.vy)||9.5;k.angle=a;k.vx=Math.cos(a)*sp;k.vy=Math.sin(a)*sp;k.x+=k.vx*frames;k.y+=k.vy*frames;k.life-=frames;if(Math.hypot(t.x-k.x,t.y-k.y)<t.size+10){dioQueueOrApplyBossDamage(t,k.damage);knives.splice(i,1);}else if(k.life<=0||k.x<-40||k.x>440||k.y<-40||k.y>540)knives.splice(i,1);
 }}
}
function dioLaunchArenaKnifeVolley(cb){
 if(!cb||cb.type!=="arena"){_superState.dioMudaActive=false;_superState.dioMudaMode=null;return;}
 var attacks=typeof cb.getAttacks==="function"?cb.getAttacks():[];
 if(!Array.isArray(attacks)||!attacks.length){_superState.dioMudaActive=false;_superState.dioMudaMode=null;if(typeof window.showFloatingText==="function")window.showFloatingText("🗡️ НЕТ БЛИЖАЙШИХ БЛОКОВ!","#ffaa00");return;}
 var px=cb.getHeartX(),py=cb.getHeartY(),targets=attacks.slice().filter(Boolean).sort(function(a,b){var ar=Number(a.size||a.radius||18)||18,br=Number(b.size||b.radius||18)||18;return Math.hypot((a.x||0)+ar/2-px,(a.y||0)+ar/2-py)-Math.hypot((b.x||0)+br/2-px,(b.y||0)+br/2-py);});
 if(!Array.isArray(_superState.dioKnives))_superState.dioKnives=[];
 for(var i=0;i<5;i++){var target=targets[i%targets.length],tr=Number(target.size||target.radius||18)||18,tx=(Number(target.x)||0)+tr/2,ty=(Number(target.y)||0)+tr/2,ang=Math.atan2(ty-py,tx-px);_superState.dioKnives.push({x:px+(px>300?-10:10),y:py-3,vx:Math.cos(ang)*10,vy:Math.sin(ang)*10,angle:ang,life:160,targetType:"arena",targetAttack:target});}
 _superState.dioMudaActive=false;_superState.dioMudaMode=null;if(typeof window.showFloatingText==="function")window.showFloatingText("🗡️ НОЖИ ДИО!","#fff0a0");
}
function dioActivateMudaSkill(){
 var cb=typeof getBossContext==="function"?getBossContext():null;if(!cb||!_superState)return false;
 var t=dioGetUniqueBossTarget(cb);
 if(cb.type==="arena"&&!t){
  if(!dioCanUse("muda",40,30))return false;
  _superState.dioMudaActive=true;_superState.dioMudaMode="arenaKnives";_superState.dioMudaStartedAt=performance.now();
  if(!Array.isArray(_superState.dioKnives))_superState.dioKnives=[];
  dioPlaySoundFrom("music/Voicy_Dio Brando muda muda.mp3",.78,4);
  if(typeof window.showFloatingText==="function")window.showFloatingText("🗡️ ДИО ЦЕЛИТ НОЖИ!","#fff0a0");
  return true;
 }
 if(!t){if(typeof window.showFloatingText==="function")window.showFloatingText("🗡️ НАВЫК ДОСТУПЕН В БОЮ С БОССОМ","#ffaa00");return false;}
 if(!dioCanUse("muda",40,30))return false;
 var px=cb.getHeartX(),py=cb.getHeartY(),close=Math.hypot(t.x-px,t.y-py)<=132;
 _superState.dioMudaActive=true;_superState.dioMudaMode=close?"melee":"knives";_superState.dioMudaStartedAt=performance.now();_superState.dioMudaTargetType=t.type;_superState.dioMudaTargetId=t.id;_superState.dioMudaTotalDamage=Math.max(1,Math.floor(t.maxHp*(close?.10:.08)));_superState.dioMudaHitIndex=0;_superState.dioMudaLastHitAt=0;_superState.dioMudaStandX=px+(px>300?-20:20);_superState.dioMudaStandY=py-8;
 if(!Array.isArray(_superState.dioKnives))_superState.dioKnives=[];
 if(close)dioPlaySoundFrom("music/dio_muda_muda_muda.mp3",.9,0);
 else dioPlaySoundFrom("music/Voicy_Dio Brando muda muda.mp3",.78,4);
 if(!close&&cb.type==="rwb"&&typeof window.getRWBPlayer==="function"){var rp=window.getRWBPlayer();if(rp){rp.vx=0;rp.vy=0;}}
 if(typeof window.showFloatingText==="function")window.showFloatingText(close?"THE WORLD — MUDA MUDA MUDA!":"ДИО ГОТОВИТ НОЖИ (2 СЕК.)","#fff0a0");
 return true;
}
window.dioActivateMudaSkill=dioActivateMudaSkill;
function dioAttackTouchesStand(ctxB,a){
 if(!a||!isDioOverHeavenMain()||a.dioAggroNoPlayer||a.dioStandHitOnce)return false;var p=dioGetStandPosition(ctxB);if(!p)return false;var x=p.x,y=p.y,h=p.radius||7,type=ctxB?ctxB.type:null,sz=Number(a.size||a.radius||a.width||14)||14;
 if(type==="arena"){if(a.type==="bomb"){if(a.timer>=0)return false;return Math.hypot(x-(Number(a.x)||0),y-(Number(a.y)||0))<Number(a.radius||a.maxRadius||20)+h;}if(["circle","rainbow","healCircle"].includes(a.type))return Math.hypot(x-(Number(a.x)||0),y-(Number(a.y)||0))<Number(a.radius||10)+h;if(a.type==="sword")return Math.hypot(x-(Number(a.x)||0),y-(Number(a.y)||0))<Number(a.size||10)+h;var s=Number(a.size)||20,cx=(Number(a.x)||0)+s/2,cy=(Number(a.y)||0)+s/2;return Math.abs(x-cx)<s/2+h&&Math.abs(y-cy)<s/2+h;}
 if(type==="waystar"){if(a.type==="laser")return a.state==="active"&&Math.abs(x-(Number(a.x)||0))<Number(a.width||40)/2+h;if(a.type==="giant_laser"){if(a.state!=="active")return false;var dx=x-(Number(a.x)||0),dy=y-(Number(a.y)||0),ang=Number(a.angle)||0;return Math.abs(dx*Math.sin(ang)-dy*Math.cos(ang))<Number(a.width||20)/2+h;}if(a.type==="bomb"){if(!a.exploded)return false;return Math.hypot(x-a.x,y-a.y)<Number(a.radius||20)+h;}return Math.hypot(x-(Number(a.x)||0),y-(Number(a.y)||0))<sz+h;}
 if(type==="stone"){if(a.type==="laser")return(a.timer||0)<=0&&Math.abs(x-(Number(a.x)||0))<Number(a.width||40)/2+h;if(a.type==="ring")return Math.abs(Math.hypot(x-(Number(a.x)||0),y-(Number(a.y)||0))-Number(a.radius||0))<Number(a.thickness||18)/2+h;if(a.type==="spike")return(a.warningTimer||0)<=0&&(a.height||0)>10&&Math.abs(x-a.x)<30+h&&y>500-a.height;if(a.type==="gravity_well")return false;return Math.hypot(x-(Number(a.x)||0),y-(Number(a.y)||0))<sz+h;}
 if(type==="rwb"){if(a.type==="roger_slash"){if(a.state!=="active")return false;return a.direction==="horizontal"?Math.abs(y-a.y)<Number(a.width||0)*.35+h:Math.abs(x-a.x)<Number(a.width||0)*.35+h;}if(a.type==="roger_cross"){if(a.state!=="active")return false;return a.dir==="vertical"?Math.abs(x-a.x)<Number(a.width||0)*.35+h:Math.abs(y-a.y)<Number(a.width||0)*.35+h;}if(a.type==="tsunami"){var dy=Math.abs(y-(Number(a.y)||0)),hh=(Number(a.currentHeight)||Number(a.height)||0)/2;return dy<hh+h&&(a.fromRight?x>=(Number(a.x)||0):x<=(Number(a.width)||400));}if(a.type==="gura_crack"&&a.state!=="active")return false;if(a.type==="hell_fire"&&a.state==="flying")return Math.hypot(x-a.x,y-a.y)<sz+h;if(a.state==="warning"||a.state==="done")return false;if(a.type==="gura_crack"||a.type==="purple_crack_zone")return Math.hypot(x-(Number(a.x)||0),y-(Number(a.y)||0))<Number(a.radius||a.maxRadius||sz)+h;return Math.hypot(x-(Number(a.x)||0),y-(Number(a.y)||0))<sz+h;}
 return false;
}
window.dioAttackTouchesStand=dioAttackTouchesStand;

// Круг инверсии идёт от сердца наружу в течение двух секунд перед остановкой времени.
function dioIsWindupActive() {
    return typeof _superState !== "undefined" &&
        (_superState.dioTimeStopWindupUntil || 0) > performance.now();
}
window.dioIsWindupActive = dioIsWindupActive;

var DIO_TIME_STOP_WIPE_START_DELAY_MS = 1500; // Keep the ring hidden for the first 1.5 seconds.
var DIO_TIME_STOP_WIPE_DURATION_MS = 1800; // The visible ring expands for 1.8 seconds.
function dioShouldFreezeEntity(entity) {
    if (!entity) return false;
    var windup = dioIsWindupActive();
    if (!windup) {
        if (!isDioTimeStopped()) {
            try { delete entity._dioWaveFrozen; } catch (e) { entity._dioWaveFrozen = false; }
        }
        return false;
    }
    if (entity._dioWaveFrozen) return true;
    var bossCtx = (typeof getBossContext === "function") ? getBossContext() : null;
    if (!bossCtx || typeof bossCtx.getHeartX !== "function" || typeof bossCtx.getHeartY !== "function") return false;
    var cx = Number(bossCtx.getHeartX()) || 0, cy = Number(bossCtx.getHeartY()) || 0;
    var ex = Number(entity.x) || 0, ey = Number(entity.y) || 0;
    var extent = Math.max(0, Number(entity.radius) || Number(entity.size) || Number(entity.width) || 0);
    var maxRadius = Math.hypot(Math.max(cx, 400 - cx), Math.max(cy, 500 - cy));
    var startedAt = Number(_superState.dioTimeStopWindupStartedAt) || performance.now();
    var elapsedSinceRingStart = performance.now() - startedAt - DIO_TIME_STOP_WIPE_START_DELAY_MS;
    if (elapsedSinceRingStart <= 0) return false;
    var progress = Math.max(0, Math.min(1, elapsedSinceRingStart / DIO_TIME_STOP_WIPE_DURATION_MS));
    var waveRadius = maxRadius * progress;
    if (Math.hypot(ex - cx, ey - cy) <= waveRadius + extent) {
        entity._dioWaveFrozen = true;
        return true;
    }
    return false;
}
window.dioShouldFreezeEntity = dioShouldFreezeEntity;

var _dioOverlayRaf = 0;
function dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks) {
    if (overlay) overlay.style.display = "none";
    if (ring) ring.style.display = "none";
    if (halo) halo.style.display = "none";
    if (flash) flash.style.display = "none";
    if (streaks) streaks.style.display = "none";
}
function dioSyncTimeStopOverlay() {
    try {
        var base = (typeof ctx !== "undefined" && ctx && ctx.canvas) ? ctx.canvas : document.getElementById("arenaCanvas");
        var windup = dioIsWindupActive();
        var active = isDioTimeStopped();
        var dioMode = isDioOverHeavenMain();
        var wipeActive = !!(_superState && _superState.dioTimeStopWipeActive);
        var audioPending = !!(_superState && _superState.dioTimeStopAudioPending);
        var revealInProgress = dioMode && !audioPending && (windup || wipeActive);
        var overlay = document.getElementById("dioTimeStopInvertCanvas");
        var ring = document.getElementById("dioTimeStopWipeRing");
        var halo = document.getElementById("dioTimeStopWipeHalo");
        var streaks = document.getElementById("dioTimeStopWipeStreaks");
        var flash = document.getElementById("dioTimeStopWipeFlash");

        // Duck only the background soundtrack; do not pause it or slow any effect.
        dioSyncAudioMix();

        if (!base || !dioMode) {
            if (_superState) {
                _superState.dioTimeStopWipeActive = false;
                _superState.dioTimeStopWipeFinishQueued = false;
            }
            if (base && base.style) base.style.filter = "";
            dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks);
            return;
        }

        // Crucial: while the circle is travelling, the real canvas stays untouched.
        // The inverted snapshot is revealed ONLY inside the moving circular mask.
        if (base.style) base.style.filter = (active && !revealInProgress) ? "invert(1)" : "";

        if (!revealInProgress) {
            dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks);
            return;
        }

        if (!overlay) {
            overlay = document.createElement("canvas");
            overlay.id = "dioTimeStopInvertCanvas";
            overlay.style.cssText = "position:fixed;pointer-events:none;z-index:99998;display:none;filter:invert(1);will-change:clip-path;";
            document.body.appendChild(overlay);
        }
        if (!halo) {
            halo = document.createElement("div");
            halo.id = "dioTimeStopWipeHalo";
            halo.style.cssText = "position:fixed;pointer-events:none;z-index:99999;display:none;border:1px solid rgba(174,119,255,.85);border-radius:50%;box-shadow:0 0 30px 8px rgba(174,119,255,.28),0 0 16px 3px rgba(255,220,100,.42);mix-blend-mode:screen;";
            document.body.appendChild(halo);
        }
        if (!streaks) {
            streaks = document.createElement("div");
            streaks.id = "dioTimeStopWipeStreaks";
            streaks.style.cssText = "position:fixed;pointer-events:none;z-index:99999;border-radius:50%;display:none;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,0) 0deg,rgba(255,247,207,0) 8deg,rgba(255,241,174,.75) 9deg,rgba(185,128,255,0) 11deg,rgba(125,248,209,0) 18deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 26px),#000 calc(100% - 7px));mask:radial-gradient(farthest-side,transparent calc(100% - 26px),#000 calc(100% - 7px));filter:drop-shadow(0 0 8px rgba(255,241,174,.8));mix-blend-mode:screen;will-change:transform;";
            document.body.appendChild(streaks);
        }
        if (!ring) {
            ring = document.createElement("div");
            ring.id = "dioTimeStopWipeRing";
            ring.style.cssText = "position:fixed;pointer-events:none;z-index:100000;display:none;border-radius:50%;background:conic-gradient(from 0deg,#ffffff 0deg,#ffe889 42deg,#ffb844 85deg,#bb83ff 130deg,#7df8d1 185deg,rgba(125,248,209,.12) 222deg,transparent 260deg,#ffe889 310deg,#ffffff 360deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 5px));mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 5px));filter:drop-shadow(0 0 7px rgba(255,236,151,.95)) drop-shadow(0 0 17px rgba(186,130,255,.8));mix-blend-mode:screen;will-change:transform;";
            document.body.appendChild(ring);
        }
        if (!flash) {
            flash = document.createElement("div");
            flash.id = "dioTimeStopWipeFlash";
            flash.style.cssText = "position:fixed;pointer-events:none;z-index:100001;display:none;background:rgba(255,247,215,.88);opacity:0;transition:opacity 120ms linear;mix-blend-mode:screen;";
            document.body.appendChild(flash);
        }

        var rect = base.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks);
            return;
        }
        flash.style.left = rect.left + "px";
        flash.style.top = rect.top + "px";
        flash.style.width = rect.width + "px";
        flash.style.height = rect.height + "px";

        var pixelWidth = base.width || 400;
        var pixelHeight = base.height || 500;
        if (overlay.width !== pixelWidth) overlay.width = pixelWidth;
        if (overlay.height !== pixelHeight) overlay.height = pixelHeight;

        overlay.style.left = rect.left + "px";
        overlay.style.top = rect.top + "px";
        overlay.style.width = rect.width + "px";
        overlay.style.height = rect.height + "px";
        overlay.style.display = "block";
        overlay.style.filter = "invert(1)";

        var ox = overlay.getContext("2d");
        if (ox) {
            ox.clearRect(0, 0, overlay.width, overlay.height);
            ox.drawImage(base, 0, 0, overlay.width, overlay.height);
        }

        var bctx = (typeof getBossContext === "function") ? getBossContext() : null;
        var hx = bctx && typeof bctx.getHeartX === "function" ? bctx.getHeartX() : overlay.width / 2;
        var hy = bctx && typeof bctx.getHeartY === "function" ? bctx.getHeartY() : overlay.height / 2;
        var cx = hx / overlay.width * rect.width;
        var cy = hy / overlay.height * rect.height;

        // Keep the ring hidden for 1.5 seconds, then expand it over 1.8 seconds.
        // The same clock controls both the visual wave and gradual entity freezing.
        var startedAt = Number(_superState.dioTimeStopWindupStartedAt) || 0;
        var elapsedSinceStart = startedAt > 0
            ? performance.now() - startedAt
            : (DIO_TIME_STOP_WIPE_START_DELAY_MS + DIO_TIME_STOP_WIPE_DURATION_MS - Math.max(0, (_superState.dioTimeStopWindupUntil || 0) - performance.now()));
        var progress = Math.max(0, Math.min(1, (elapsedSinceStart - DIO_TIME_STOP_WIPE_START_DELAY_MS) / DIO_TIME_STOP_WIPE_DURATION_MS));
        if (progress <= 0) {
            dioHideTimeStopOverlay(overlay, ring, halo, flash, streaks);
            return;
        }

        var maxRadius = Math.hypot(
            Math.max(cx, rect.width - cx),
            Math.max(cy, rect.height - cy)
        );
        var radius = Math.max(1, maxRadius * progress);
        if (progress >= 1) radius = maxRadius + 3;

        // The inverted area and the animated energy edge share one expanding radius.
        overlay.style.clipPath = "circle(" + radius + "px at " + cx + "px " + cy + "px)";
        var diameter = radius * 2;
        var ringLeft = rect.left + cx - radius;
        var ringTop = rect.top + cy - radius;

        halo.style.display = "block";
        halo.style.width = (diameter + 14) + "px";
        halo.style.height = (diameter + 14) + "px";
        halo.style.left = (ringLeft - 7) + "px";
        halo.style.top = (ringTop - 7) + "px";
        halo.style.opacity = String(0.65 + Math.sin(progress * Math.PI * 8) * 0.2);

        streaks.style.display = "block";
        streaks.style.width = (diameter + 24) + "px";
        streaks.style.height = (diameter + 24) + "px";
        streaks.style.left = (ringLeft - 12) + "px";
        streaks.style.top = (ringTop - 12) + "px";
        streaks.style.transform = "rotate(" + (-performance.now() * 0.34) + "deg)";
        streaks.style.opacity = String(0.75 + Math.sin(progress * Math.PI * 10) * 0.2);

        ring.style.display = "block";
        ring.style.width = diameter + "px";
        ring.style.height = diameter + "px";
        ring.style.left = ringLeft + "px";
        ring.style.top = ringTop + "px";
        ring.style.transform = "rotate(" + (performance.now() * 0.22) + "deg)";
        ring.style.opacity = String(Math.max(0.6, 1 - progress * 0.18));

        // A short anime-style white impact flash fires exactly when the wipe closes.
        // Guard it with the finish flag so it only fires once.
        if (progress >= 1 && wipeActive && !_superState.dioTimeStopWipeFinishQueued) {
            _superState.dioTimeStopWipeFinishQueued = true;
            flash.style.display = "block";
            flash.style.opacity = "0.48";
            requestAnimationFrame(function () {
                if (flash) flash.style.opacity = "0";
            });
            setTimeout(function () {
                if (flash) flash.style.display = "none";
            }, 150);
            // Keep the completed inverted arena visible until the 2-second
            // activation point. The timeout below ends the wipe when time stops.
            if (isDioTimeStopped() && _superState.dioTimeStopWipeActive) {
                _superState.dioTimeStopWipeActive = false;
                _superState.dioTimeStopWipeFinishQueued = false;
                dioSyncTimeStopOverlay();
            }
        }
    } catch (e) {}
}
function dioStartOverlayLoop() {
    if (_dioOverlayRaf || typeof requestAnimationFrame !== "function") return;
    var tick = function() {
        _dioOverlayRaf = 0;
        dioSyncTimeStopOverlay();
        if (dioIsWindupActive() || isDioTimeStopped() || (_superState && _superState.dioTimeStopWipeActive)) {
            _dioOverlayRaf = requestAnimationFrame(tick);
        }
    };
    _dioOverlayRaf = requestAnimationFrame(tick);
}

function dioAddEnergy(amount) {
    if (!isDioOverHeavenMain() || typeof _superState === "undefined") return;
    var requested = Math.max(0, Number(amount) || 0);
    if (!requested) return;

    // Sliding one-second window limits the base gain from multi-hit attacks.
    // The combat-mode multiplier is applied after this shared cap.
    var gainMultiplier = 1;
    try {
        var bossContext = (typeof getBossContext === "function") ? getBossContext() : null;
        if (bossContext && (bossContext.type === "waystar" || bossContext.type === "stone" || bossContext.type === "rwb")) {
            gainMultiplier = 1.5;
        } else if (bossContext && bossContext.type === "arena") {
            gainMultiplier = 4;
        }
    } catch (e) {}
    var now = performance.now();
    while (_dioEnergyGainEvents.length && now - _dioEnergyGainEvents[0].time >= 1000) {
        _dioEnergyGainEvents.shift();
    }
    var used = 0;
    for (var i = 0; i < _dioEnergyGainEvents.length; i++) used += _dioEnergyGainEvents[i].amount;
    var allowed = Math.min(requested, Math.max(0, DIO_ENERGY_GAIN_PER_SECOND - used));
    if (allowed <= 0) return;

    var current = Math.max(0, Number(_superState.dioEnergy) || 0);
    _superState.dioEnergy = Math.min(100, current + allowed * gainMultiplier);
    // Consume the base budget even when the visible energy gain is multiplied or the meter is full.
    _dioEnergyGainEvents.push({ time: now, amount: allowed });
}
window.dioAddEnergy = dioAddEnergy;

function dioTrackBossDamage(ctxB) {
    if (!isDioOverHeavenMain() || !ctxB || typeof _superState === "undefined") return;
    var hp = Number(ctxB.getBossHp());
    if (!isFinite(hp)) return;
    var type = ctxB.type || "unknown";
    if (_superState.dioEnergyBossType !== type || typeof _superState.dioEnergyLastBossHp !== "number") {
        _superState.dioEnergyBossType = type;
        _superState.dioEnergyLastBossHp = hp;
        return;
    }
    var delta = _superState.dioEnergyLastBossHp - hp;
    if (delta > 0 && type !== "arena") {
        // Charge by the fraction of the boss's health bar removed, not raw damage.
        // A complete boss health bar is worth 35 energy; the rolling cap limits bursts.
        var maxHp = 0;
        try { maxHp = Number(ctxB.getBossMaxHp()); } catch (e) {}
        if (isFinite(maxHp) && maxHp > 0) {
            dioAddEnergy(Math.min(35, (delta / maxHp) * 35));
        }
    }
    _superState.dioEnergyLastBossHp = hp;
}
window.dioTrackBossDamage = dioTrackBossDamage;

function dioCanUse(skill, cost, cooldown) {
    var cd = _superState.dioSkillCooldowns[skill] || 0;
    if (cd > 0) {
        if (typeof showFloatingText === "function") showFloatingText("⏳ " + Math.ceil(cd) + "с", "#ffaa00");
        return false;
    }
    if ((_superState.dioEnergy || 0) < cost) {
        if (typeof showFloatingText === "function") showFloatingText("⚡ НУЖНО " + cost + " ЭНЕРГИИ (" + Math.floor(_superState.dioEnergy || 0) + "/100)", "#ffdd44");
        return false;
    }
    _superState.dioEnergy -= cost;
    _superState.dioSkillCooldowns[skill] = cooldown;
    return true;
}

function dioStartTimeStop(duration, teleportStyle, skipSound) {
    var ctxB = getBossContext();
    if (!ctxB) return;

    var d = Math.max(0.05, Number(duration) || 0);
    var now = performance.now();

    // Один источник истины для всех режимов игры/боссов.
    // Пока этот флаг активен, физика и таймеры мира должны стоять,
    // а DIO/VFX продолжает жить.
    if (teleportStyle) _superState.dioTeleportStop = d;
    else _superState.dioTimeStop = d;
    _superState.dioTimeStopWindupUntil = 0;

    _superState.dioTimeStopStartedAt = now;
    _superState.dioResumeSoundPlayed = false;
    _superState.dioTimeStopWasActive = true;
    _superState.dioStandFlash = teleportStyle ? 0.55 : 1.15;
    _superState.dioStandX = ctxB.getHeartX();
    _superState.dioStandY = ctxB.getHeartY();

    // Main DIO activation may have played the cue before the wipe.
    // Keep skipSound for callers that intentionally pre-play the sound.
    dioSyncAudioMix();
    if (!skipSound) {
        dioPlaySound(
            teleportStyle
                ? "music/dios-time-stop-teleportation-sound-effect-1.mp3"
                : "music/za-warudo-time-stop-louder.mp3",
            teleportStyle ? 0.72 : 0.86
        );
    }

    // Аниме-удар: белый flash -> золото -> фиолетовый "THE WORLD".
    ctxB.addFlashWhite(teleportStyle ? 4 : 12);
    ctxB.addShake(teleportStyle ? 10 : 24);
    ctxB.spawnFloatingText(
        ctxB.getHeartX(),
        ctxB.getHeartY() - 35,
        teleportStyle ? "THE WORLD!" : "ZA WARUDO!",
        "#fff0a0"
    );

    // Мгновенная вспышка вокруг сердца.
    try {
        var parts = ctxB.getParticles();
        if (parts) {
            var px = ctxB.getHeartX(), py = ctxB.getHeartY();
            for (var i = 0; i < (teleportStyle ? 18 : 34); i++) {
                var a = Math.random() * Math.PI * 2;
                var sp = 2 + Math.random() * (teleportStyle ? 5 : 9);
                parts.push({
                    x: px, y: py,
                    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                    life: 18 + Math.random() * 18, maxLife: 36,
                    color: i % 3 === 0 ? "#ffffff" : (i % 3 === 1 ? "#ffe66d" : "#b985ff"),
                    size: 1.5 + Math.random() * 3.5,
                    dioTimeStopVfx: true
                });
            }
        }
    } catch (e) {}
}

function isDioTimeStopped() {
    if (typeof _superState === "undefined") return false;
    return (_superState.dioTimeStop || 0) > 0 ||
           (_superState.dioTeleportStop || 0) > 0;
}
window.isDioTimeStopped = isDioTimeStopped;
function activateDioTimeStop() {
    if (dioIsWindupActive() || isDioTimeStopped() ||
        (_superState && _superState.dioTimeStopAudioPending)) return;
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("timeStop", 40, 25)) return;

    var startedAt = performance.now();
    var sequenceToken = (_superState.dioTimeStopSequenceToken || 0) + 1;
    _superState.dioTimeStopSequenceToken = sequenceToken;

    // Sound starts immediately; the ring waits 1.5 seconds, expands for 1.8 seconds,
    // and time stops when the wave reaches the arena edges.
    _superState.dioTimeStopAudioPending = false;
    _superState.dioTimeStopWindupStartedAt = startedAt;
    _superState.dioTimeStopWindupUntil = startedAt + DIO_TIME_STOP_WIPE_START_DELAY_MS + DIO_TIME_STOP_WIPE_DURATION_MS;
    _superState.dioTimeStopWipeDurationMs = DIO_TIME_STOP_WIPE_DURATION_MS;
    _superState.dioTimeStopWipeActive = true;
    _superState.dioTimeStopWipeFinishQueued = false;
    if (typeof heart !== "undefined" && heart) { heart.vx = 0; heart.vy = 0; }

    dioPlaySound("music/za-warudo-time-stop-louder.mp3", 0.86);
    dioStartOverlayLoop();

    setTimeout(function () {
        if (!_superState || _superState.dioTimeStopSequenceToken !== sequenceToken) return;
        if (!(_superState.dioTimeStopWindupUntil || 0)) return;

        _superState.dioTimeStopWindupUntil = 0;
        _superState.dioTimeStopWipeActive = false;
        _superState.dioTimeStopWipeFinishQueued = false;

        if (!isDioOverHeavenMain() || !getBossContext()) {
            dioSyncTimeStopOverlay();
            return;
        }

        // Sound already started at the click, so never replay it here.
        dioStartTimeStop(6, false, true);
        dioStartOverlayLoop();
    }, Math.max(0, DIO_TIME_STOP_WIPE_START_DELAY_MS + DIO_TIME_STOP_WIPE_DURATION_MS - (performance.now() - startedAt)));
}
function activateDioHeal() {
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("heal", 30, 25)) return;
    var amount = ctxB.getPlayerMaxHp() * 0.10;
    ctxB.setPlayerHp(Math.min(ctxB.getPlayerMaxHp(), ctxB.getPlayerHp() + amount));
    ctxB.addShockwave(ctxB.getHeartX(), ctxB.getHeartY(), "#fff2aa", 260, 0.65, 5);
    ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 30, "+10% REALITY HEAL", "#fff2aa");
}

function activateDioTeleport() {
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("teleport", 25, 15)) return;
    var now = performance.now(), target = null;
    for (var i = _superState.dioHistory.length - 1; i >= 0; i--) {
        if (now - _superState.dioHistory[i].time >= 1000) { target = _superState.dioHistory[i]; break; }
    }
    if (!target && _superState.dioHistory.length) target = _superState.dioHistory[0];
    if (target) {
        ctxB.setHeartX(target.x);
        ctxB.setHeartY(target.y);
        ctxB.clampHeart();
    }
    // Play the dedicated teleport cue immediately, then start the short teleport stop without duplicating it.
    dioPlaySound("music/dios-time-stop-teleportation-sound-effect-1.mp3", 0.72);
    dioStartTimeStop(0.5, true, true);
}

function activateDioAggro() {
    var ctxB = getBossContext();
    if (!ctxB || !dioCanUse("aggro", 40, 30)) return;
    _superState.dioAggroTimer = 4.0;
    var atk = ctxB.getAttacks();
    for (var i = 0; i < atk.length; i++) {
        atk[i].dioAggro = true;
        atk[i].dioAggroNoPlayer = true;
    }
    ctxB.addShockwave(ctxB.getHeartX(), ctxB.getHeartY(), "#d9c2ff", 360, 0.8, 6);
    ctxB.spawnFloatingText(ctxB.getHeartX(), ctxB.getHeartY() - 40, "OVERWRITE: АГРЕССИЯ", "#d9c2ff");
}

function dioUseSkill(skill) {
    if (!isDioOverHeavenMain()) return;
    if (dioIsWindupActive()) return;
    if (skill === "timeStop") activateDioTimeStop();
    else if (skill === "heal") activateDioHeal();
    else if (skill === "teleport") activateDioTeleport();
    else if (skill === "aggro") activateDioAggro();
    else if (skill === "muda") dioActivateMudaSkill();
    updateSuperButton();
}
window.dioUseSkill = dioUseSkill;

function updateDioSkillCooldowns(dt) {
    dioSyncAudioMix();
    var c = _superState.dioSkillCooldowns;
    for (var k in c) c[k] = Math.max(0, (c[k] || 0) - dt);
    // DIO's own clock is the only clock that continues while the world is stopped.
    var wasStopped = ((_superState.dioTimeStop || 0) > 0 || (_superState.dioTeleportStop || 0) > 0);
    var stopBeforeTick = Math.max(_superState.dioTimeStop || 0, _superState.dioTeleportStop || 0);
    // Запускаем звук за 1 секунду до возобновления времени, а не после.
    if (wasStopped && stopBeforeTick <= 1.05 && stopBeforeTick > 0 && !_superState.dioResumeSoundPlayed) {
        _superState.dioResumeSoundPlayed = true;
        try {
            var resumeTrack = (typeof window.getLoadedMusic === "function") ? window.getLoadedMusic("dioTimeResume") : null;
            var resumeAudio = new Audio(resumeTrack && resumeTrack.url ? resumeTrack.url : "music/time-resumes.mp3");
            resumeAudio.preload = "auto";
            resumeAudio.volume = 0.9;
            var playPromise = resumeAudio.play();
            if (playPromise && playPromise.catch) playPromise.catch(function(){});
        } catch (e) {}
    }
    _superState.dioTimeStop = Math.max(0, (_superState.dioTimeStop || 0) - dt);
    _superState.dioTeleportStop = Math.max(0, (_superState.dioTeleportStop || 0) - dt);
    var stoppedNow = ((_superState.dioTimeStop || 0) > 0 || (_superState.dioTeleportStop || 0) > 0);
    if (wasStopped && !stoppedNow) dioFlushPendingBossDamage();
    // Safety fallback for unusually large frame steps.
    if (wasStopped && !stoppedNow && !_superState.dioResumeSoundPlayed) {
        _superState.dioResumeSoundPlayed = true;
        try {
            var resumeTrack = (typeof window.getLoadedMusic === "function") ? window.getLoadedMusic("dioTimeResume") : null;
            var resumeAudio = new Audio(resumeTrack && resumeTrack.url ? resumeTrack.url : "music/time-resumes.mp3");
            resumeAudio.preload = "auto";
            resumeAudio.volume = 0.9;
            var playPromise = resumeAudio.play();
            if (playPromise && playPromise.catch) playPromise.catch(function(){});
        } catch (e) {}
    }
    _superState.dioAggroTimer = Math.max(0, (_superState.dioAggroTimer || 0) - dt);
    _superState.dioStandFlash = Math.max(0, (_superState.dioStandFlash || 0) - dt);

    // Пассивный заряд DIO: +1 энергия каждые 2 секунды активного боя.
    var passiveCtx = (typeof getBossContext === "function") ? getBossContext() : null;
    if (passiveCtx && isDioOverHeavenMain()) {
        _superState.dioPassiveChargeTimer = Math.max(0, Number(_superState.dioPassiveChargeTimer) || 0) + Math.max(0, Number(dt) || 0);
        while (_superState.dioPassiveChargeTimer >= DIO_PASSIVE_ENERGY_INTERVAL_MS / 1000) {
            _superState.dioPassiveChargeTimer -= DIO_PASSIVE_ENERGY_INTERVAL_MS / 1000;
            _superState.dioEnergy = Math.min(100, (Number(_superState.dioEnergy) || 0) + 1);
        }
    } else {
        _superState.dioPassiveChargeTimer = 0;
    }
    dioUpdateMudaSkill(dt);
}

function updateDioHistory(ctxB) {
    if (!isDioOverHeavenMain() || !ctxB) return;
    var now = performance.now();
    _superState.dioHistory.push({time: now, x: ctxB.getHeartX(), y: ctxB.getHeartY()});
    while (_superState.dioHistory.length && now - _superState.dioHistory[0].time > 2500) _superState.dioHistory.shift();
}

function updateDioStandZone(ctxB) {
    if (!ctxB || !isDioOverHeavenMain()) return;
    var atk = ctxB.getAttacks();
    if (!atk || !atk.length) return;
    var hx = ctxB.getHeartX(), hy = ctxB.getHeartY(), radius = 52;
    var stand = dioGetStandPosition(ctxB);
    for (var i = atk.length - 1; i >= 0; i--) {
        var a = atk[i];
        if (!a || a.dioAggroNoPlayer) continue;
        var ar = Number(a.size || a.radius || 10) * 0.5;
        var ax = (Number(a.x) || 0) + ar, ay = (Number(a.y) || 0) + ar;
        var insideMain = Math.hypot(ax-hx,ay-hy)<=radius+ar;
        var insideStand = stand && Math.hypot(ax-stand.x,ay-stand.y)<=radius+ar;
        var inside = insideMain || insideStand;
        if (!inside) { a.dioStandInside = false; continue; }
        if (a.dioStandInside) continue;
        a.dioStandInside = true;
        if (Math.random() < 0.05) {
            atk.splice(i,1);var sx=insideStand&&stand?stand.x:hx,sy=insideStand&&stand?stand.y:hy;
            _superState.dioStandFlash=Math.max(_superState.dioStandFlash||0,.3);_superState.dioStandAttackUntil=performance.now()+220;
            _superState.dioStandAttackSourceX=sx;_superState.dioStandAttackSourceY=sy;_superState.dioStandAttackX=ax;_superState.dioStandAttackY=ay;
            if(typeof ctxB.spawnFloatingText==="function")ctxB.spawnFloatingText(sx,sy-28,"THE WORLD!","#fff0a0");
            if(typeof ctxB.addShockwave==="function")ctxB.addShockwave(sx,sy,"#e5c8ff",120,.25,3);
        }
    }
}

function updateDioAggressiveBlocks(ctxB) {
    if (!ctxB || _superState.dioAggroTimer <= 0) return;
    var atk = ctxB.getAttacks();
    if (!Array.isArray(atk) || !atk.length) return;

    // В некоторых атаках движок оставляет пустые слоты. Никогда не трогаем undefined.
    var hx = ctxB.getHeartX(), hy = ctxB.getHeartY();

    for (var m = 0; m < atk.length; m++) {
        var nearA = atk[m];
        if (!nearA) continue;

        var nr = Number(nearA.size || nearA.radius || 10) || 10;
        var nax = (Number(nearA.x) || 0) + nr / 2;
        var nay = (Number(nearA.y) || 0) + nr / 2;

        if (Math.hypot(nax - hx, nay - hy) <= 180) {
            nearA.dioAggro = true;
            nearA.dioAggroNoPlayer = true;
        }
    }

    for (var i = atk.length - 1; i >= 0; i--) {
        var a = atk[i];
        if (!a || !a.dioAggro) continue;

        var ar = Number(a.size || a.radius || 10) || 10;
        var ax = (Number(a.x) || 0) + ar / 2;
        var ay = (Number(a.y) || 0) + ar / 2;
        var best = -1, bestD = Infinity;

        for (var j = 0; j < atk.length; j++) {
            var candidate = atk[j];
            if (!candidate || i === j || !candidate.dioAggro) continue;

            var br = Number(candidate.size || candidate.radius || 10) || 10;
            var bx = (Number(candidate.x) || 0) + br / 2;
            var by = (Number(candidate.y) || 0) + br / 2;
            var d = Math.hypot(bx - ax, by - ay);

            if (d < bestD) {
                bestD = d;
                best = j;
            }
        }

        if (best >= 0 && bestD < 150) {
            var b = atk[best];
            if (!b) continue;

            var br2 = Number(b.size || b.radius || 10) || 10;
            var bx2 = (Number(b.x) || 0) + br2 / 2;
            var by2 = (Number(b.y) || 0) + br2 / 2;
            var dx = bx2 - ax, dy = by2 - ay, len = Math.hypot(dx, dy) || 1;
            var speed = 4.2;

            if (a.spd !== undefined) a.spd = dx / len * speed;
            if (a.spdY !== undefined) a.spdY = dy / len * speed;
            if (a.vx !== undefined) a.vx = dx / len * speed;
            if (a.vy !== undefined) a.vy = dy / len * speed;

            if (bestD < (ar + br2) * 0.45) {
                // Удаляем оба снаряда безопасно, не ломая индексы.
                var hi = Math.max(i, best);
                var lo = Math.min(i, best);
                if (hi < atk.length) atk.splice(hi, 1);
                if (lo < atk.length) atk.splice(lo, 1);

                var particles = ctxB.getParticles();
                if (particles) {
                    particles.push({
                        x: ax, y: ay, vx: 0, vy: 0,
                        life: 20, maxLife: 20,
                        color: "#d9c2ff", size: 5
                    });
                }
            }
        }
    }
}
function ensureDioPanel() {
    var panel = document.getElementById("dioOverHeavenPanel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "dioOverHeavenPanel";
        panel.style.cssText = "display:none;position:absolute;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:25;width:min(390px,calc(100% - 12px));box-sizing:border-box;pointer-events:auto;";
        var overlay = document.getElementById("arenaOverlay");
        if (overlay) overlay.appendChild(panel);
    }
    return panel;
}

function updateDioPanel() {
    var panel = ensureDioPanel();
    if (!panel) return;
    var dioActive = isDioOverHeavenMain();
    if (!dioActive) {
        panel.style.display = "none";
        panel._dioSignature = "";
        return;
    }

    panel.style.display = "block";

    // ★ ВАЖНО: НЕ пересоздаём кнопки каждый кадр.
    // Раньше innerHTML обновлялся ~60 раз/сек. На мобильном это удаляло
    // нажатую кнопку до события click, поэтому "нажимаю — ничего".
    var e = Math.floor(_superState.dioEnergy || 0);
    var hud = document.getElementById("dioEnergyHud");
    var hudFill = document.getElementById("dioEnergyHudFill");
    var hudValue = document.getElementById("dioEnergyHudValue");
    if (hud) hud.style.display = "block";
    if (hudFill) hudFill.style.width = e + "%";
    if (hudValue) hudValue.textContent = e + " / 100";

    var cd = _superState.dioSkillCooldowns || {};
    var sig = [e,Math.ceil(cd.timeStop||0),Math.ceil(cd.heal||0),Math.ceil(cd.teleport||0),Math.ceil(cd.aggro||0),Math.ceil(cd.muda||0)].join("|");

    if (panel._dioSignature === sig && panel.children.length) return;
    panel._dioSignature = sig;

    panel.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;">' +
        dioButton("⏳ ZA", "timeStop", 40, 25, cd.timeStop || 0) +
        dioButton("💚 HEAL", "heal", 30, 25, cd.heal || 0) +
        dioButton("🌀 TP", "teleport", 25, 15, cd.teleport || 0) +
        dioButton("👊 RAGE", "aggro", 40, 30, cd.aggro || 0) +
        dioButton("🗡️ MUDA", "muda", 40, 30, cd.muda || 0) +
        '</div>';
}
function dioButton(label,key,cost,cooldown,cd) {
    var buttonBossContext = (typeof getBossContext === "function") ? getBossContext() : null;
    var mudaTargetMissing = key === "muda" && !dioGetUniqueBossTarget(buttonBossContext) && !(buttonBossContext && buttonBossContext.type === "arena");
    var disabled = cd > 0 || (_superState.dioEnergy || 0) < cost || !isDioOverHeavenMain() || mudaTargetMissing;
    var textCd = cd > 0 ? " · "+Math.ceil(cd)+"с" : "";
    return '<button type="button" onclick="dioUseSkill(\''+key+'\')" '+(disabled?'disabled':'')+' style="width:100%;min-width:0;padding:6px 1px;border-radius:9px;border:1px solid #bca5ff;background:'+(disabled?'#333':'linear-gradient(135deg,#33214f,#8064a8)')+';color:white;font-size:10px;font-weight:900;line-height:1.05;touch-action:manipulation;pointer-events:auto;">'+label+'<br><span style="font-size:9px;">⚡'+cost+textCd+'</span></button>';
}

function renderDioVisuals(ctxB) {
    dioSyncTimeStopOverlay();
    if (!ctx) return;
    if (!ctxB || !isDioOverHeavenMain()) {
        return;
    }

    var now = performance.now();
    var stop = Math.max(_superState.dioTimeStop || 0, _superState.dioTeleportStop || 0);
    var active = stop > 0;

    // Инверсия цветов раскрывается отдельным слоем вслед за расширяющейся окружностью.
    var phase = now - (_superState.dioTimeStopStartedAt || now);
    var isTP = (_superState.dioTeleportStop || 0) > 0 && (_superState.dioTimeStop || 0) <= 0;

    if (active) {
        ctx.save();

        // DIO-стоп в JoJo не выглядит как огромный циферблат:
        // кадр резко темнеет/теряет насыщенность, движение мира замирает,
        // а вокруг DIO/The World остаётся золотой/зелёный энергетический след.
        var t = Math.max(0, phase);
        var intro = Math.max(0, Math.min(1, t / 180));
        var outro = Math.max(0, Math.min(1, stop / 260));
        var intensity = Math.min(intro, outro);
        var pulse = 0.5 + 0.5 * Math.sin(t / 95);

        // 1) Резкий "freeze frame": лёгкое обесцвечивание + холодный тёмный тон.
        ctx.fillStyle = "rgba(8,10,18," + (0.38 * intensity) + ")";
        ctx.fillRect(0, 0, 400, 500);
        ctx.fillStyle = "rgba(190,210,205," + (0.08 * intensity) + ")";
        ctx.fillRect(0, 0, 400, 500);

        // 2) Цветной импульс: оттенки реально бегут по окружности, а не стоят
        // отдельными неподвижными кольцами. Центр следует за сердцем игрока.
        var ringCtx = getBossContext();
        var ringX = ringCtx ? ringCtx.getHeartX() : _superState.dioStandX;
        var ringY = (ringCtx ? ringCtx.getHeartY() : _superState.dioStandY) - 24;
        if (!isTP && t >= 1000 && t <= 1800) {
            var ringT = Math.max(0, Math.min(1, (t - 1000) / 800));
            var ringRadius = 24 + ringT * 430;
            var ringAlpha = Math.sin(ringT * Math.PI) * 0.85;
            var ringColors = ["#ffffff", "#f3d66d", "#a77bff", "#79f5d0"];
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = ringAlpha;
            // Несколько цветных дуг движутся по одному кругу, как аниме-вспышка.
            for (var ri = 0; ri < ringColors.length; ri++) {
                ctx.beginPath();
                ctx.strokeStyle = ringColors[ri];
                ctx.lineWidth = ri === 0 ? 4 : 3;
                ctx.lineCap = "round";
                ctx.shadowColor = ringColors[ri];
                ctx.shadowBlur = ri === 0 ? 24 : 16;
                var arcStart = (now / 170) + ri * Math.PI / 2;
                ctx.arc(ringX, ringY, Math.max(2, ringRadius - ri * 3), arcStart, arcStart + Math.PI * 0.72);
                ctx.stroke();
            }
            var radial = ctx.createRadialGradient(ringX, ringY, Math.max(0, ringRadius - 75), ringX, ringY, ringRadius + 12);
            radial.addColorStop(0, "rgba(255,255,255,0)");
            radial.addColorStop(0.72, "rgba(246,222,255," + (0.14 * ringAlpha) + ")");
            radial.addColorStop(1, "rgba(255,235,155,0)");
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, 400, 500);
            ctx.restore();
        }
        // Телепортация — другой рисунок: короткие фиолетовые afterimage-дуги
        // и диагональный разрез вокруг точки перемещения, без эффекта ZA WARUDO.
        if (isTP && t < 650) {
            var tpLife = Math.max(0, 1 - t / 650);
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = tpLife * 0.9;
            for (var ti = 0; ti < 3; ti++) {
                ctx.beginPath();
                ctx.strokeStyle = ti === 0 ? "#ffffff" : (ti === 1 ? "#bd83ff" : "#65eaff");
                ctx.lineWidth = ti === 0 ? 4 : 2;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 18;
                ctx.ellipse(ringX, ringY, 22 + ti * 13 + (1 - tpLife) * 30, 38 + ti * 8, -0.45 + ti * 0.45, now / 180 + ti, now / 180 + ti + Math.PI * 1.25);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(ringX - 85 * tpLife, ringY + 70 * tpLife);
            ctx.lineTo(ringX + 85 * tpLife, ringY - 70 * tpLife);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 22;
            ctx.stroke();
            ctx.restore();
        }

        // 3) Знаменитые диагональные линии/следы остановившегося движения.
        // Они НЕ двигаются вместе с таймером мира — только слегка мерцают.
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (var ray = 0; ray < 22; ray++) {
            var ang = -1.25 + ray * 0.115;
            var side = ray % 2 ? 1 : -1;
            var len = 170 + (ray % 5) * 28;
            var cx = 200 + Math.cos(ang) * (95 + (ray % 4) * 16);
            var cy = 250 + Math.sin(ang) * (95 + (ray % 4) * 14);
            ctx.globalAlpha = (0.055 + (ray % 3) * 0.025) * intensity;
            ctx.strokeStyle = ray % 4 === 0 ? "#eaffff" : (ray % 2 ? "#72f5c8" : "#f4e58a");
            ctx.lineWidth = ray % 5 === 0 ? 2.2 : 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(ang + side * 0.15) * len, cy + Math.sin(ang + side * 0.15) * len);
            ctx.stroke();
        }

        // 3) "Застывшие" бело-зелёные трещины энергии — характерный JoJo-вайб.
        ctx.globalAlpha = 0.28 * intensity;
        ctx.strokeStyle = "#baffec";
        ctx.lineWidth = 1.5;
        var cracks = [
            [24,108,76,88,108,110],
            [365,126,330,102,292,121],
            [30,390,72,368,106,382],
            [370,366,328,345,294,362],
            [88,48,112,76,145,62],
            [310,452,286,420,255,438]
        ];
        for (var c = 0; c < cracks.length; c++) {
            var q = cracks[c];
            ctx.beginPath();
            ctx.moveTo(q[0], q[1]);
            ctx.lineTo(q[2], q[3]);
            ctx.lineTo(q[4], q[5]);
            ctx.stroke();
        }
        ctx.restore();

        // 4) Золотой ореол The World: мягкий, без огромного интерфейсного циферблата.
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        var aura = ctx.createRadialGradient(
            _superState.dioStandX, _superState.dioStandY - 30, 5,
            _superState.dioStandX, _superState.dioStandY - 30, 135
        );
        aura.addColorStop(0, "rgba(255,245,180," + (0.30 + pulse * 0.08) * intensity + ")");
        aura.addColorStop(0.22, "rgba(255,218,72," + (0.16 + pulse * 0.05) * intensity + ")");
        aura.addColorStop(0.55, "rgba(119,255,205," + (0.08 + pulse * 0.03) * intensity + ")");
        aura.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(_superState.dioStandX, _superState.dioStandY - 30, 140, 0, Math.PI * 2);
        ctx.fill();

        // 5) Вспышка именно в момент ZA WARUDO.
        if (t < 180) {
            ctx.globalAlpha = (1 - t / 180) * 0.32;
            ctx.fillStyle = "#fffbe5";
            ctx.fillRect(0, 0, 400, 500);
        }
        ctx.restore();

        // 6) Тонкая золотая рамка, а не толстый UI-оверлей.
        ctx.globalAlpha = 0.22 + pulse * 0.08;
        ctx.strokeStyle = "#ffe98a";
        ctx.shadowColor = "#d8b84d";
        ctx.shadowBlur = 14;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(5, 5, 390, 490);

        // 7) Только на старте — узнаваемый крик. Не держим текст 2.5 секунды.
        if (t < 650) {
            var textA = Math.max(0, Math.min(1, (650 - t) / 180));
            ctx.globalAlpha = textA;
            ctx.textAlign = "center";
            ctx.font = "900 27px Arial Black, Arial, sans-serif";
            ctx.fillStyle = "#fff7c7";
            ctx.shadowColor = "#c99a2e";
            ctx.shadowBlur = 18;
            ctx.fillText("ZA WARUDO!", 200, 62);
            ctx.font = "900 10px monospace";
            ctx.fillStyle = "#d7fff2";
            ctx.shadowBlur = 8;
            ctx.fillText("TOKI YO TOMARE", 200, 78);
        }

        ctx.restore();
    }

    // === СИЛУЭТ THE WORLD ===
    if (_superState.dioStandFlash > 0) {
        ctx.save();
        var sa = Math.min(1, _superState.dioStandFlash * 1.8);
        var standPulse = 1 + Math.sin(now / 52) * 0.045;
        ctx.globalAlpha = sa;
        ctx.translate(_superState.dioStandX, _superState.dioStandY - 35);
        ctx.scale(standPulse, standPulse);
        ctx.globalCompositeOperation = "lighter";

        ctx.shadowColor = "#b57aff";
        ctx.shadowBlur = 32;
        ctx.fillStyle = "rgba(247,247,255,.92)";
        ctx.strokeStyle = "#e4d0ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 27, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Голова / глаза / золотая броня.
        ctx.fillStyle = "#b99cff";
        ctx.fillRect(-21, -15, 42, 9);
        ctx.fillStyle = "#17111f";
        ctx.fillRect(-12, -2, 7, 4);
        ctx.fillRect(5, -2, 7, 4);
        ctx.fillStyle = "#f0d66d";
        ctx.fillRect(-16, 12, 32, 7);
        ctx.strokeStyle = "#fff2a5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 23); ctx.lineTo(15, 23);
        ctx.stroke();

        // Кулаки/ореол.
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = sa * 0.7;
        ctx.beginPath(); ctx.arc(-35, 7, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(35, 7, 7, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }
}
