// ========== ТАКАБА — ОТДЕЛЬНЫЙ МОДУЛЬ v2.0 ==========
// 50 случайных событий. Загружать ПОСЛЕ supers.js.
// Здесь находится вся механика Такабы: способность, SUPER, уверенность и трэш-события.

(function(){
"use strict";

var JOKES = [
"Почему утка перешла дорогу? Потому что у неё квест.",
"Босс не умер — он просто вышел покушать.",
"SUPER не сломался. Он задумался.",
"Почему враг квадратный? У него стабильная геометрия.",
"Комбо ушло за хлебом.",
"У этого бага есть диплом.",
"Я не проиграл. Это была сюжетная катсцена.",
"Кто дал боссу второй фазу?",
"Почему HP не бесконечное? Несправедливость.",
"Я хотел серьёзный бой. Такаба сказал нет."
];

var EVENT_NAMES = [
"background","speed2","speedHalf","teleport","balloons","laughtexts","ducks","sound","rainbowtrail","knockback",
"pizza","colors","confetti","gravity","heal","shrink","speedchaos","party","banana","blackout",
"reverse","spin","giantHeart","tinyHeart","swapXY","freezeAttacks","rushAttacks","homing","wall","clone",
"deleteHalf","deleteWeak","rainHearts","fakeBoss","shake","flash","lowGravity","highGravity","bounce","mirror",
"explode","pacifist","chaosDamage","bossHeal","hpLottery","confidenceLottery","disco","attackRain","heartParty","absoluteTrash"
];

function ensureTakabaState(){
  if(typeof _superState==="undefined") return;
  var d={
    takabaConfidence:50,takabaLastEventTime:0,takabaEventTimer:0,takabaEffectTimer:0,
    takabaEffectType:null,takabaTimeStop:false,takabaJokeActive:false,takabaCurrentJoke:"",
    takabaBgColor:null,takabaDuckMode:false,takabaDmgMult:1,takabaDamageTakenMult:1,
    takabaRandomEvent:null,takabaRandomEventTimer:0,takabaArenaSpeedMult:1,takabaBallMode:false,
    takabaLaughText:false,takabaRainbowTrail:false,takabaRandomColors:false
  };
  Object.keys(d).forEach(function(k){ if(_superState[k]===undefined) _superState[k]=d[k]; });
}
function level(c){c=Math.max(0,Math.min(100,Number(c)||0));return c<20?1:c<40?2:c<60?3:c<80?4:5;}
function confidence(d,txt){
  ensureTakabaState(); var old=_superState.takabaConfidence;
  _superState.takabaConfidence=Math.max(0,Math.min(100,old+(Number(d)||0)));
  if(typeof updateTakabaConfidenceDisplay==="function") updateTakabaConfidenceDisplay();
  if(txt&&level(old)!==level(_superState.takabaConfidence)&&typeof showFloatingText==="function")
    showFloatingText("🎭 ТАКАБА: "+Math.round(_superState.takabaConfidence)+"% — УР. "+level(_superState.takabaConfidence),"#ff66ff");
  return _superState.takabaConfidence;
}
function modifiers(c){
  var conf=Math.max(0,Math.min(100,Number(c)||0)),l=level(conf);
  return{level:l,dmgMult:1+conf*0.006,damageTakenMult:1-conf*0.006,speedMult:1+conf*0.006};
}
function getTakabaCombatModifiers(){
  ensureTakabaState();
  if(!hasTakaba())return{level:1,dmgMult:1,damageTakenMult:1,speedMult:1,confidence:0};
  var m=modifiers(_superState.takabaConfidence||0);
  m.confidence=Math.max(0,Math.min(100,Number(_superState.takabaConfidence)||0));
  return m;
}
window.getTakabaCombatModifiers=getTakabaCombatModifiers;
function getMainTeamCard(){
  try{
    if(typeof team==="undefined"||!Array.isArray(team)||typeof myCards==="undefined"||!Array.isArray(myCards))return null;
    var idx=(typeof mainCardIndex==="number")?mainCardIndex:-1;
    if(idx<0||idx>=team.length)return null;
    return myCards[team[idx]]||null;
  }catch(e){return null;}
}
function hasTakaba(){
  try{
    var card=getMainTeamCard();
    var masteryOk=(typeof hasMasteryAbility!=="function")||hasMasteryAbility(card);
    return !!(card&&card.name==="Такаба"&&masteryOk);
  }catch(e){}
  return false;
}
function ctx(){try{return typeof getBossContext==="function"?getBossContext():null;}catch(e){return null;}}
function attacks(){var c=ctx();return c&&typeof c.getAttacks==="function"?c.getAttacks():[];}
function float(t,col){var c=ctx();if(c&&typeof c.spawnFloatingText==="function")c.spawnFloatingText(c.getHeartX(),c.getHeartY()-45,t,col||"#ff66ff");}
function particle(x,y,vx,vy,color,size,life){var c=ctx();if(!c||typeof c.getParticles!=="function")return;c.getParticles().push({x:x,y:y,vx:vx,vy:vy,life:life||60,maxLife:life||60,color:color,size:size||3});}
function manyParticles(n,fn){for(var i=0;i<n;i++)fn(i);}
function randColor(){return "hsl("+Math.floor(Math.random()*360)+",100%,60%)";}

function triggerTakabaComedy(){
  ensureTakabaState(); var c=ctx(); if(!hasTakaba()||!c||_superState.takabaRandomEventTimer>0)return;
  if(c.type==="arena" && typeof arenaPhase!=="undefined" && arenaPhase!=="dodge") {
    _superState.takabaRandomEventTimer=0; _superState.takabaRandomEvent=null; _superState.takabaEffectTimer=0;
    _superState.takabaArenaSpeedMult=1; _superState.takabaBgColor=null; _superState.takabaBallMode=false;
    _superState.takabaLaughText=false; _superState.takabaRainbowTrail=false; _superState.takabaRandomColors=false; _superState.takabaDuckMode=false;
    _superState.screenShakeAmount=0;
    if(typeof heart!=="undefined"){heart.size=14;heart.hitbox=4;}
    return;
  }
  var ev=EVENT_NAMES[Math.floor(Math.random()*EVENT_NAMES.length)], a=attacks();
  _superState.takabaRandomEvent=ev; _superState.takabaRandomEventTimer=4; _superState.takabaEffectTimer=4;
  var label="🎭 ТАКАБА: "+ev.toUpperCase();
  var i,x,y;

  switch(ev){
    case "background": _superState.takabaBgColor=randColor(); label="🎨 АРЕНА ПЕРЕКРАСИЛАСЬ."; break;
    case "speed2": _superState.takabaArenaSpeedMult=2; label="⚡ ВСЁ x2. ЗАЧЕМ."; break;
    case "speedHalf": _superState.takabaArenaSpeedMult=.5; label="🐌 ВСЁ x0.5. МЫ ЧЕРЕПАХИ."; break;
    case "teleport": c.setHeartX(20+Math.random()*360);c.setHeartY(20+Math.random()*460);if(c.clampHeart)c.clampHeart();label="🌪️ ГДЕ ТЫ?";break;
    case "balloons": _superState.takabaBallMode=true;label="🎈 АТАКИ СТАЛИ ШАРИКАМИ.";break;
    case "laughtexts": _superState.takabaLaughText=true;label="💬 ХА-ХА-ХА НАВСЕГДА.";break;
    case "ducks": _superState.takabaDuckMode=true;label="🦆 КРЯ.";break;
    case "sound": {var fs=["sfxWhoosh","sfxBounce","sfxVictory","sfxArenaHeal","sfxArenaDeath"];var fn=fs[Math.floor(Math.random()*fs.length)];if(typeof window[fn]==="function")window[fn]();label="🔊 ЗВУК, КОТОРЫЙ НИКТО НЕ ПРОСИЛ.";break;}
    case "rainbowtrail": _superState.takabaRainbowTrail=true;label="🌈 СЕРДЦЕ СТАЛО РАДУГОЙ.";break;
    case "knockback": c.setHeartX(c.getHeartX()+(Math.random()-.5)*45);c.setHeartY(c.getHeartY()+(Math.random()-.5)*45);if(c.clampHeart)c.clampHeart();label="💫 ФИЗИКА ПЕРЕДУМАЛА.";break;
    case "pizza": confidence(5,true);label="🍕 ПИЦЦА +5 УВЕРЕННОСТИ.";break;
    case "colors": _superState.takabaRandomColors=true;label="🎨 АТАКИ ЗАБЫЛИ СВОЙ ЦВЕТ.";break;
    case "confetti": manyParticles(70,function(){particle(Math.random()*400,-10,(Math.random()-.5)*5,2+Math.random()*5,randColor(),2+Math.random()*4,80);});label="🎉 КОНФЕТТИ!";break;
    case "gravity": for(i=0;i<a.length;i++)a[i].spdY=-(a[i].spdY||0);label="⬆️ ГРАВИТАЦИЯ В ОТПУСКЕ.";break;
    case "heal": {var maxHp=c.getPlayerMaxHp();var h=Math.floor(maxHp*.08);c.setPlayerHp(Math.min(maxHp,c.getPlayerHp()+h));confidence(3,false);label="💚 ХИЛ +8% И НИКАКИХ ОБЪЯСНЕНИЙ.";break;}
    case "shrink": for(i=0;i<a.length;i++){if(a[i].size)a[i].size*=.5;if(a[i].radius)a[i].radius*=.5;}label="🔬 АТАКИ ПОХУДЕЛИ.";break;
    case "speedchaos": for(i=0;i<a.length;i++){if(a[i].spd)a[i].spd*=.25+Math.random()*2.5;if(a[i].spdY)a[i].spdY*=.25+Math.random()*2.5;}label="🎲 СКОРОСТЬ: КАК ПОЛУЧИТСЯ.";break;
    case "party": for(i=0;i<a.length;i++)a[i].spd=(a[i].spd||0)*1.2;label="🕺 АТАКИ ТАНЦУЮТ.";break;
    case "banana": float("🍌 БАНАН. ЗАЧЕМ?","#ffe066"); label="🍌 БАНАН ВЫШЕЛ НА АРЕНУ."; break;
    case "blackout": _superState.screenFlashWhite=18;label="🌑 СВЕТА НЕТ.";break;
    case "reverse": for(i=0;i<a.length;i++){if(a[i].spd)a[i].spd=-a[i].spd;if(a[i].spdY)a[i].spdY=-a[i].spdY;}label="🔄 АТАКИ ПОЕХАЛИ НАЗАД.";break;
    case "spin": for(i=0;i<a.length;i++){var s=a[i].spd||0,sy=a[i].spdY||0;a[i].spd=-sy;a[i].spdY=s;}label="🌀 ВСЁ ПОВЕРНУЛОСЬ.";break;
    case "giantHeart": if(c.type==="arena" && typeof heart!=="undefined"){heart.size*=2;heart.hitbox*=1.5;}else{c.setHeartSpeed(c.getHeartSpeed()*0.65);}label="❤️ ОГРОМНОЕ СЕРДЦЕ. ПЛОХАЯ ИДЕЯ.";break;
    case "tinyHeart": if(c.type==="arena" && typeof heart!=="undefined"){heart.size*=.45;heart.hitbox*=.45;}else{c.setHeartSpeed(c.getHeartSpeed()*1.45);}label="💗 МИКРО-СЕРДЦЕ.";break;
    case "swapXY": x=c.getHeartX();c.setHeartX(c.getHeartY());c.setHeartY(x);if(c.clampHeart)c.clampHeart();label="🔀 X И Y ПОМЕНЯЛИСЬ МЕСТАМИ.";break;
    case "freezeAttacks": for(i=0;i<a.length;i++){a[i]._takabaOldSpd=a[i].spd;a[i]._takabaOldSpdY=a[i].spdY;a[i].spd=0;a[i].spdY=0;}label="🧊 АТАКИ ЗАБЫЛИ КАК ХОДИТЬ.";break;
    case "rushAttacks": for(i=0;i<a.length;i++){if(a[i].spd)a[i].spd*=4;if(a[i].spdY)a[i].spdY*=4;}label="🏎️ АТАКИ НА ТУРБО.";break;
    case "homing": for(i=0;i<a.length;i++){a[i].spdY=(c.getHeartY()-a[i].y)*.02;a[i].spd=(c.getHeartX()-a[i].x)*.02;}label="🎯 АТАКИ НАШЛИ GPS.";break;
    case "wall": for(i=0;i<8;i++){x=Math.random()*380;y=Math.random()*460;particle(x,y,0,0,"#ffffff",8,100);}label="🧱 НЕВИДИМАЯ СТЕНА. НАВЕРНОЕ.";break;
    case "clone": {var copy=a.slice(0,Math.min(8,a.length));for(i=0;i<copy.length;i++){var q=Object.assign({},copy[i]);q.x=Math.random()*380;q.y=Math.random()*460;a.push(q);}label="👯 АТАКИ РАЗМНОЖИЛИСЬ.";break;}
    case "deleteHalf": for(i=a.length-1;i>=0;i-=2)a.splice(i,1);label="🗑️ ПОЛОВИНУ АТАК УДАЛИЛИ.";break;
    case "deleteWeak": for(i=a.length-1;i>=0;i--)if((a[i].damage||0)<10)a.splice(i,1);label="🧹 СЛАБЫХ ВЫКИНУЛИ.";break;
    case "rainHearts": manyParticles(35,function(){particle(Math.random()*400,-10,0,2,"#ff3355",4,100);});label="💖 ДОЖДЬ СЕРДЕЦ.";break;
    case "fakeBoss": float("👑 ПОЯВИЛСЯ СЕКРЕТНЫЙ БОСС: ДИРЕКТОР КАФЕТЕРИЯ","#ffd700");label="👑 ЛОЖНЫЙ БОСС.";break;
    case "shake": _superState.screenShakeAmount=25;label="📳 ЗЕМЛЕТРЯСЕНИЕ.";break;
    case "flash": _superState.screenFlashWhite=25;label="📸 ВСПЫШКА НА 100%.";break;
    case "lowGravity": for(i=0;i<a.length;i++)a[i].spdY=(a[i].spdY||0)*.15;label="🌙 ЛУНА.";break;
    case "highGravity": for(i=0;i<a.length;i++)a[i].spdY=(a[i].spdY||0)*3;label="🪨 ГРАВИТАЦИЯ x3.";break;
    case "bounce": for(i=0;i<a.length;i++)a[i].bouncesLeft=Infinity;label="🏓 АТАКИ ТЕПЕРЬ МЯЧИКИ.";break;
    case "mirror": for(i=0;i<a.length;i++)a[i].x=400-a[i].x;label="🪞 ЗЕРКАЛО.";break;
    case "explode": for(i=0;i<a.length;i++){x=a[i].x;y=a[i].y;manyParticles(5,function(){particle(x,y,(Math.random()-.5)*5,(Math.random()-.5)*5,"#ff8800",3,35);});}label="💥 ВСЁ ВЗОРВАЛОСЬ, НО НЕ УМЕРЛО.";break;
    case "pacifist": for(i=0;i<a.length;i++)a[i].damage=0;label="☮️ АТАКИ СТАЛИ ПАЦИФИСТАМИ.";break;
    case "chaosDamage": for(i=0;i<a.length;i++)a[i].damage=Math.floor(Math.random()*80);label="🎰 УРОН: РУЛЕТКА.";break;
    case "bossHeal": {var bHp=c.getBossHp(),bMax=Math.max(bHp,c.getBossMaxHp());c.setBossHp(Math.min(bMax,bHp+Math.floor(bMax*.05)));label="💀 БОСС ТОЖЕ ХОЧЕТ ЖИТЬ.";break;}
    case "hpLottery": {var maxP=c.getPlayerMaxHp();c.setPlayerHp(Math.max(1,Math.random()*maxP));label="🎰 HP ЛОТЕРЕЯ.";break;}
    case "confidenceLottery": confidence(Math.random()*40-20,true);label="🎲 УВЕРЕННОСТЬ: РУЛЕТКА.";break;
    case "disco": _superState.takabaBgColor=randColor();_superState.takabaRandomColors=true;label="🪩 ДИСКОТЕКА.";break;
    case "attackRain": manyParticles(50,function(){particle(Math.random()*400,-20,(Math.random()-.5)*2,4+Math.random()*5,randColor(),2,70);});label="☄️ ДОЖДЬ ЧЕГО-ТО.";break;
    case "heartParty": c.setHeartX(c.getHeartX()+(Math.random()-.5)*18);c.setHeartY(c.getHeartY()+(Math.random()-.5)*18);if(c.clampHeart)c.clampHeart();confidence(2,false);label="❤️ СЕРДЦЕ ПРАЗДНУЕТ.";break;
    case "absoluteTrash": {
      confidence(7,true);_superState.takabaArenaSpeedMult=[.35,.5,1.5,2.5][Math.floor(Math.random()*4)];
      _superState.takabaRandomColors=true;_superState.takabaBallMode=true;_superState.takabaLaughText=true;
      manyParticles(100,function(){particle(Math.random()*400,Math.random()*500,(Math.random()-.5)*8,(Math.random()-.5)*8,randColor(),2+Math.random()*5,60);});
      label="🤡 АБСОЛЮТНЫЙ ТРЭШ. НИКТО НЕ ЗНАЕТ ЧТО ПРОИСХОДИТ.";break;
    }
  }
  float(label,"#ff66ff");
  if(typeof sfxWhoosh==="function")sfxWhoosh();
}

function updateTakabaAbility(dt){
  ensureTakabaState();
  if(!hasTakaba()){
    _superState.takabaDmgMult=1; _superState.takabaDamageTakenMult=1;
    _superState.takabaEventTimer=0; _superState.takabaEffectTimer=0;
    _superState.takabaRandomEvent=null; _superState.takabaRandomEventTimer=0;
    _superState.takabaTimeStop=false; _superState.takabaJokeActive=false; _superState.takabaCurrentJoke="";
    _superState.takabaBgColor=null; _superState.takabaDuckMode=false; _superState.takabaArenaSpeedMult=1;
    _superState.takabaBallMode=false; _superState.takabaLaughText=false;
    _superState.takabaRainbowTrail=false; _superState.takabaRandomColors=false;
    if(typeof heart!=="undefined"){ heart.size=14; heart.hitbox=4; }
    return;
  }
  var m=modifiers(_superState.takabaConfidence);_superState.takabaDmgMult=m.dmgMult;_superState.takabaDamageTakenMult=m.damageTakenMult;
  var c=ctx();if(!c)return;
  if(_superState.takabaEffectTimer>0){ _superState.takabaEffectTimer=Math.max(0,_superState.takabaEffectTimer-dt); }
  // Во время фазы атаки Такаба полностью молчит: никаких случайных событий.
  if(typeof arenaPhase!=="undefined" && arenaPhase!=="dodge") return;
  _superState.takabaEventTimer+=dt;
  if(_superState.takabaRandomEventTimer>0){
    _superState.takabaRandomEventTimer-=dt;
    if(_superState.takabaRandomEventTimer<=0){
      _superState.takabaRandomEventTimer=0;_superState.takabaArenaSpeedMult=1;_superState.takabaBgColor=null;
      _superState.takabaBallMode=false;_superState.takabaLaughText=false;_superState.takabaRainbowTrail=false;
      _superState.takabaRandomColors=false;_superState.takabaDuckMode=false;_superState.takabaJokeActive=false;
      _superState.screenShakeAmount=0;
      // Возвращаем размеры сердца после giant/tiny.
      if(c && c.type==="arena" && typeof heart!=="undefined"){heart.size=14;heart.hitbox=4;}
    }
  }
  if(getTakabaLevel(_superState.takabaConfidence)>=3&&_superState.takabaEventTimer>=7&&_superState.takabaEffectTimer<=0&&!_superState.takabaTimeStop&&!_superState.takabaJokeActive){
    _superState.takabaEventTimer=0;_superState.takabaLastEventTime=Date.now();triggerTakabaComedy();
  }
}

window.getTakabaLevel=level;
window.adjustTakabaConfidence=confidence;
window.getTakabaAbilityModifiers=modifiers;
window.updateTakabaAbility=updateTakabaAbility;
window.triggerTakabaComedy=triggerTakabaComedy;

superAbilities["Такаба"]={
  name:"ШУТКА ТАКАБЫ",cooldown:20000,toggleable:false,duration:4000,
  onActivate:function(){
    ensureTakabaState();var c=ctx();if(!c)return;
    _superState.takabaCurrentJoke=JOKES[Math.floor(Math.random()*JOKES.length)];
    _superState.takabaTimeStop=true;_superState.takabaJokeActive=true;_superState.takabaEffectTimer=4;_superState.takabaBgColor="#ff66ff";
    _superState.screenFlashWhite=12;_superState.screenShakeAmount=12;
    float("🎭 ХА-ХА-ХА!","#ff66ff");
  },
  onDeactivate:function(){
    ensureTakabaState();_superState.takabaTimeStop=false;_superState.takabaJokeActive=false;_superState.takabaBgColor=null;_superState.screenShakeAmount=0;
    confidence(30,true);float("🤣 "+Math.round(_superState.takabaConfidence)+"% УВЕРЕННОСТИ!","#ff66ff");
  },
  onTick:function(){}
};

// Полностью выносим тик Такабы из supers.js.
var oldTick=window.tickSupers;
if(typeof oldTick==="function"){
  window.tickSupers=function(){
    var now=performance.now(),last=window.__takabaTickLast||now;window.__takabaTickLast=now;
    oldTick.apply(this,arguments);
    var dt=(now-last)/1000;if(dt<=0||dt>.25)dt=.016;
    updateTakabaAbility(dt);
  };
}
console.log("[TAKABA] v2.0 loaded — 50 трэш-событий.");
})();
