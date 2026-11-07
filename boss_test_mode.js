(function(){
"use strict";
var attackNames=["⬜ Стены","🔷 Хаос","⚡ Жёлтые мечи","🔺 Красные треугольники","💗 Розовый удар","💚 Зелёное лечение","🌈 Радужная смерть","⚡🛑 Микс атак","🟥⬜ Опасные зоны","💣 Бомбы","🔫 Бластеры","⚙️ Маятники","⛓️ Живые тросы","☣️ Кислотная карта","🌪️ Штормовой коридор","🪃 Бумеранги","🌋 Расколотая земля","🐙 Охота щупалец","⚙️ Шестерёнчатая погоня","🌿 Сад шипов","🦾 Клешни"];
var uniqueWaves=[200,500,1000,1500,2000], cards=[];
var TEST_SETTINGS_KEY="mb_boss_test_settings_v1", restoringTestSettings=false;
function loadBossTestSettings(){
    try {
        var saved=JSON.parse(localStorage.getItem(TEST_SETTINGS_KEY)||"null");
        return saved&&typeof saved==="object"&&!Array.isArray(saved)?saved:null;
    } catch(e){return null;}
}
function saveBossTestSettings(){
    if(restoringTestSettings)return;
    try {
        var boss=E("bossTestBossSelect"),waveInput=E("bossTestAttackWave"),ability=E("bossTestAbilityMode"),main=E("bossTestMainCard");
        var card=main?cards[Number(main.value)]||null:null;
        var checked=Array.from(document.querySelectorAll("#bossTestAttackList input[data-boss-test-attack]:checked"))
            .map(function(i){return Number(i.dataset.bossTestAttack);});
        localStorage.setItem(TEST_SETTINGS_KEY,JSON.stringify({
            bossWave:boss?String(boss.value):"0",
            attackWave:waveInput?clampNumber(waveInput.value,50,50,10000):50,
            attackTypes:checked,
            abilityMode:ability&&ability.value==="ultimate"?"ultimate":"passive",
            mainCardName:card?String(card.name||""):"",
            mainCardUniverse:card?String(card.universe||""):"",
            mainCardRarity:card?String(card.rarity||""):""
        }));
    } catch(e){}
}
function restoreBossTestSettings(saved){
    if(!saved)return false;
    restoringTestSettings=true;
    try {
        var boss=E("bossTestBossSelect"),ability=E("bossTestAbilityMode");
        if(boss&&saved.bossWave!==undefined&&Array.from(boss.options).some(function(o){return o.value===String(saved.bossWave);}))boss.value=String(saved.bossWave);
        if(ability&&(saved.abilityMode==="passive"||saved.abilityMode==="ultimate"))ability.value=saved.abilityMode;
        if(Array.isArray(saved.attackTypes)){
            var selected=new Set(saved.attackTypes.map(Number));
            document.querySelectorAll("#bossTestAttackList input[data-boss-test-attack]").forEach(function(input){
                input.checked=selected.has(Number(input.dataset.bossTestAttack));
            });
        }
        window.renderBossTestOptions();
        if(saved.attackWave!==undefined)window.syncBossTestWave(saved.attackWave);
        window.renderBossTestMainCards();
        var main=E("bossTestMainCard");
        if(main&&saved.mainCardName){
            var wanted=Array.from(main.options).find(function(o){
                var c=cards[Number(o.value)];
                return !!c&&c.name===saved.mainCardName&&
                    (!saved.mainCardUniverse||String(c.universe||"")===saved.mainCardUniverse)&&
                    (!saved.mainCardRarity||String(c.rarity||"")===saved.mainCardRarity);
            });
            if(wanted)main.value=wanted.value;
        }
        window.showBossTestAbilityDescription();
    } finally {restoringTestSettings=false;}
    saveBossTestSettings();
    return true;
}
function E(id){return document.getElementById(id);}
function isModerator(){try{return typeof mode!=="undefined"&&mode==="moder"&&typeof moderUnlocked!=="undefined"&&moderUnlocked===true;}catch(e){return false;}}
function clampNumber(value,fallback,min,max){var n=Number(value);if(!Number.isFinite(n))n=Number(fallback);if(!Number.isFinite(n))n=min;return Math.max(min,Math.min(max,n));}
function updateModeratorAccess(){
    var allowed=isModerator(),tab=document.querySelector('#battleTab .sub-tab-btn[data-subtab="bossTest"]'),panel=E("bossTestSubTab");
    if(tab)tab.style.display=allowed?"":"none";
    if(panel){
        panel.style.display=allowed?"":"none";
        if(!allowed&&panel.classList.contains("active")){
            panel.classList.remove("active");
            var fight=E("fightSubTab"),fightTab=document.querySelector('#battleTab .sub-tab-btn[data-subtab="fight"]');
            if(fight)fight.classList.add("active");
            document.querySelectorAll("#battleTab .sub-tab-btn").forEach(function(b){b.classList.remove("active");});
            if(fightTab)fightTab.classList.add("active");
        }
    }
    return allowed;
}
function isUnique(w){return uniqueWaves.indexOf(Number(w))!==-1;}
function template(w){if(Number(w)===0)return {name:"Обычный босс",hpMult:2,dmgMult:1};return typeof bossTemplates!=="undefined"?bossTemplates[Number(w)]:null;}
function setResult(t,c){var e=E("bossTestResult");if(e){e.textContent=t;e.style.color=c||"#9fe6ff";}}
function makeCards(){cards=[];if(typeof customCardTemplates==="undefined")return;Object.keys(customCardTemplates).forEach(function(r){(customCardTemplates[r]||[]).forEach(function(c){if(c&&c.name)cards.push(Object.assign({},c,{rarity:r}));});});}
function passive(c){return c&&(c.ability||c.statusAbility||null);}
function hasUlt(c){return !!(c&&c.superAbility&&typeof superAbilities!=="undefined"&&superAbilities[c.name]);}
function getCard(){var s=E("bossTestMainCard");return s?cards[Number(s.value)]||null:null;}
function makeMain(){var c=getCard();if(!c)return null;var mode=E("bossTestAbilityMode").value;return {name:c.name,universe:c.universe||"",rarity:c.rarity||"",damage:Number(c.damage)||20,hp:Number(c.hp)||100,speed:Number(c.speed)||1.2,ability:c.ability?Object.assign({},c.ability):null,statusAbility:c.statusAbility?Object.assign({},c.statusAbility):null,superAbility:c.superAbility?Object.assign({},c.superAbility):null,desc:c.desc||"",__bossTestAbilityMode:mode};}
function deepCopy(o){try{return JSON.parse(JSON.stringify(o));}catch(e){return null;}}
function snap(){return {wave:typeof wave!=="undefined"?wave:null,enemy:typeof currentEnemy!=="undefined"?currentEnemy:null,enemyData:typeof currentEnemy!=="undefined"&&currentEnemy?Object.assign({},currentEnemy):null,playerHp:typeof playerHp!=="undefined"?playerHp:null,points:typeof points!=="undefined"?points:null,maxPoints:typeof maxPoints!=="undefined"?maxPoints:null,totalWins:typeof totalWins!=="undefined"?totalWins:null,totalClicks:typeof totalClicks!=="undefined"?totalClicks:null,highestWaveReached:typeof highestWaveReached!=="undefined"?highestWaveReached:null,highestCheckpoint:typeof highestCheckpoint!=="undefined"?highestCheckpoint:null,defeated:typeof defeatedBosses!=="undefined"&&Array.isArray(defeatedBosses)?defeatedBosses:null,defeatedData:typeof defeatedBosses!=="undefined"&&Array.isArray(defeatedBosses)?defeatedBosses.slice():null,cards:typeof myCards!=="undefined"&&Array.isArray(myCards)?myCards:null,cardsData:typeof myCards!=="undefined"&&Array.isArray(myCards)?myCards.slice():null,waystar:window.waystarDefeatedThisRun,debt:window.waystarOwesDebt,needSave:window._needSave,superState:typeof _superState!=="undefined"?_superState:null,superCopy:typeof _superState!=="undefined"?deepCopy(_superState):null,uniqueCharges:window._uniqueSuperCharges,uniqueBossId:window._uniqueSuperBossId,finalDamage:window.playerFinalDamage,buttonDisplays:["startArenaBtn","startLivingStoneBtn","startLivingStoneSuperBtn","startWaystarBtn","startRogerWB","startAntiSpiralBossBtn","skipArenaBtn","skipBossBtn","spareBtn"].map(function(id){var b=E(id);return [id,b?b.style.display:null];})};}
function restoreArray(ref,data){if(ref&&data)ref.splice.apply(ref,[0,ref.length].concat(data));}
function restore(s){if(!s)return;if(s.wave!==null&&typeof wave!=="undefined")wave=s.wave;if(typeof currentEnemy!=="undefined"){if(s.enemy&&s.enemyData){Object.keys(s.enemy).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(s.enemyData,k))delete s.enemy[k];});Object.assign(s.enemy,s.enemyData);currentEnemy=s.enemy;}else currentEnemy=s.enemy;}if(s.playerHp!==null&&typeof playerHp!=="undefined")playerHp=s.playerHp;if(s.points!==null&&typeof points!=="undefined")points=s.points;if(s.maxPoints!==null&&typeof maxPoints!=="undefined")maxPoints=s.maxPoints;if(s.totalWins!==null&&typeof totalWins!=="undefined")totalWins=s.totalWins;if(s.totalClicks!==null&&typeof totalClicks!=="undefined")totalClicks=s.totalClicks;if(s.highestWaveReached!==null&&typeof highestWaveReached!=="undefined")highestWaveReached=s.highestWaveReached;if(s.highestCheckpoint!==null&&typeof highestCheckpoint!=="undefined")highestCheckpoint=s.highestCheckpoint;restoreArray(s.defeated,s.defeatedData);restoreArray(s.cards,s.cardsData);if(s.superState&&s.superCopy){Object.keys(s.superState).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(s.superCopy,k))delete s.superState[k];});Object.keys(s.superCopy).forEach(function(k){s.superState[k]=s.superCopy[k];});if(typeof _superState!=="undefined")_superState=s.superState;window._superState=s.superState;}window._uniqueSuperCharges=s.uniqueCharges;window._uniqueSuperBossId=s.uniqueBossId;window.waystarDefeatedThisRun=s.waystar;window.waystarOwesDebt=s.debt;window._needSave=s.needSave;if(s.finalDamage!==undefined)window.playerFinalDamage=s.finalDamage;}
function uniqueStop(m){try{if(m.bossWave===200&&typeof stopLivingStoneFight==="function")stopLivingStoneFight();else if(m.bossWave===500&&typeof stopWaystarFight==="function")stopWaystarFight();else if(m.bossWave===1000){if(typeof window.stopRogerWhitebeardFight==="function")window.stopRogerWhitebeardFight();else{window.rwbActive=false;if(typeof window.stopRWBMusic==="function")window.stopRWBMusic();}}else if(m.bossWave===1500&&window.stopAntiSpiralBossFight)window.stopAntiSpiralBossFight();else if(m.bossWave===2000&&window.stopLivingStoneSuperFight)window.stopLivingStoneSuperFight();}catch(e){}}
function launchUniqueTrainingBoss(m){
    if(typeof wave!=="undefined")wave=m.bossWave;
    if(typeof currentEnemy!=="undefined"){
        var t=template(m.bossWave);
        var hp=Math.max(1000,Math.floor((50+m.bossWave*12)*(Number(t&&t.hpMult)||10)));
        currentEnemy={name:t&&t.name||"Уникальный босс",hp:hp,maxHp:hp,
            damage:Math.floor((15+m.bossWave*6)*(Number(t&&t.dmgMult)||1)/2),isBoss:true};
    }
    unlockUniqueForTest(m);
    if(m.bossWave===200)startLivingStoneFight("light");
    else if(m.bossWave===500)startWaystarFight("light");
    else if(m.bossWave===1000)startRogerWhitebeardFight("potato");
    else if(m.bossWave===1500&&window.startAntiSpiralBossFight)window.startAntiSpiralBossFight();
    else if(m.bossWave===2000)window.startLivingStoneSuperFight("light");
    else throw new Error("unsupported_unique_boss_"+m.bossWave);
}
function exitControl(m){var old=E("bossTestExitFightBtn");if(old)old.remove();if(m.kind==="unique"&&m.bossWave===2000)return;var b=document.createElement("button");b.id="bossTestExitFightBtn";b.type="button";b.textContent="← ВЫЙТИ ИЗ ТЕСТА";b.style.cssText="position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:100100;padding:10px 13px;border-radius:10px;border:1px solid rgba(130,220,255,.75);background:rgba(5,18,30,.96);color:#fff;font:900 12px Arial,sans-serif;touch-action:manipulation";b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();window.MBBossTestFinish("exit",false);};document.body.appendChild(b);}
function clearGlobals(){window.__mbBossTestMainCard=null;window.__mbBossTestAbilityMode=null;window.__mbBossTestPassive=null;window.__mbBossTestMode=null;window.__mbBossTestSuperHitUsed=false;window.__mbGERTrainingMode=false;window.__mbGERTrainingBossKey=null;window.__mbGERTrainingOptions=null;window.__mbGERTrainingSwarmDamageInFlight=false;}
window.MBBossTestFinish=function(result,stopped){
    var m=window.__mbBossTestMode;
    if(!m||m.finishing)return;

    // Player-imitation mode is a two-stage session. A human victory resets the
    // same native boss at full HP, then hands control to the existing 100-agent swarm.
    if(m.playerTeacherMode===true&&m.phase==="player"&&result==="win"){
        m.finishing=true;
        try{
            var teacherFlush = typeof window.MBGERTrainingSwarmStopPlayerTeacher==="function"
                ? window.MBGERTrainingSwarmStopPlayerTeacher("player_won")
                : Promise.resolve(true);
            uniqueStop(m);
            Promise.resolve(teacherFlush).then(function (flushed) {
                if (flushed !== true) throw new Error("player_samples_not_saved");
                var api = window.MBGERTraining;
                var bossKey = "ger_unique_" + m.bossWave;
                if (!api || typeof api.refreshBrain !== "function") throw new Error("learning_brain_unavailable");
                return api.refreshBrain(bossKey);
            }).then(function (brain) {
                if (window.__mbBossTestMode !== m) return;
                if (!brain) throw new Error("player_samples_not_loaded");
                m.phase="swarm";
                m.playerTeacherPhase=false;
                m.invulnerable=true;
                if(window.__mbGERTrainingOptions){
                    window.__mbGERTrainingOptions.playerTeacherPhase=false;
                    window.__mbGERTrainingOptions.imitationStage="swarm";
                }
                launchUniqueTrainingBoss(m);
                if(typeof window.MBUpdateGoldExperience==="function"){
                    window.MBUpdateGoldExperience();
                    if(typeof window.requestAnimationFrame==="function")window.requestAnimationFrame(function(){
                        if(window.__mbBossTestMode===m&&m.phase==="swarm"&&typeof window.MBUpdateGoldExperience==="function")window.MBUpdateGoldExperience();
                    });
                }
                if(typeof window.MBGERTrainingSwarmStart!=="function")throw new Error("100-agent swarm module unavailable");
                m.finishing=false;
                window.MBGERTrainingSwarmStart();
                setResult("✅ Твой бой записан и загружен в память. Теперь 100 стендов повторяют бой с боссом на полном здоровье.","#9dffc0");
                if(typeof window.MBGERTrainingArenaOnPhaseChanged==="function"){
                    window.MBGERTrainingArenaOnPhaseChanged(m);
                }
                if(typeof updateSuperButton==="function")updateSuperButton();
            }).catch(function(phaseError){
                console.error("[GER imitation] Could not load the player's training data:",phaseError);
                if(window.__mbBossTestMode!==m)return;
                m.finishing=false;
                window.MBBossTestFinish("error",false);
            });
            return;
        }catch(phaseError){
            console.error("[GER imitation] Could not start the 100-agent replay:",phaseError);
            m.finishing=false;
            result="error";
            stopped=false;
        }
    }

    if(m.finishing)return;
    m.finishing=true;
    if(!stopped){
        if(m.kind==="arena"){try{if(typeof stopArena==="function")stopArena();}catch(e){}}
        else uniqueStop(m);
    }
    var teacherFinishPromise=Promise.resolve(true);
    if(typeof window.MBGERTrainingSwarmStopPlayerTeacher==="function"){
        teacherFinishPromise=Promise.resolve(window.MBGERTrainingSwarmStopPlayerTeacher(result||"exit"));
    }
    if(m.gerTraining&&typeof window.MBGERTrainingSwarmStop==="function"){
        window.MBGERTrainingSwarmStop(result||"exit");
    }
    var finalizeTrainingFinish=function(){
        restore(m.snapshot);
        clearGlobals();
        var b=E("bossTestExitFightBtn");if(b)b.remove();
        try{
            if(typeof renderEnemy==="function")renderEnemy();
            if(typeof updateStatusDisplay==="function")updateStatusDisplay();
            if(typeof updatePlayerStats==="function")updatePlayerStats();
            if(typeof updateSuperButton==="function")updateSuperButton();
            if(m.snapshot&&m.snapshot.buttonDisplays)m.snapshot.buttonDisplays.forEach(function(pair){
                var button=E(pair[0]);if(button&&pair[1]!==null)button.style.display=pair[1];
            });
        }catch(e){}
        var msgs={
            win:["✅ Тренировка завершена: 100 стендов победили босса.","#9dffc0"],
            loss:["💥 Тренировка закончилась поражением. Прогресс не изменён.","#ffb0a0"],
            exit:["↩️ Тренировка закрыта. Прогресс не изменён.","#9fe6ff"],
            error:["⚠️ Не удалось запустить или продолжить тренировку.","#ffb0a0"]
        };
        var out=msgs[result]||msgs.exit;
        setResult(out[0],out[1]);
        if(m.gerTraining&&typeof window.MBGERTrainingArenaOnFinished==="function"){
            try{window.MBGERTrainingArenaOnFinished(result||"exit");}catch(e){}
        }
    };
    if(m.playerTeacherMode===true&&m.phase==="player"){
        teacherFinishPromise.then(finalizeTrainingFinish).catch(function(error){
            console.warn("[GER imitation] Could not flush the final player observations:",error);
            finalizeTrainingFinish();
        });
        return;
    }
    finalizeTrainingFinish();
};

window.MBBossTestStartGERTraining=function(options){
    options=options&&typeof options==="object"?options:{};
    if(!window.MBHasModeratorAccess||window.MBHasModeratorAccess()!==true){
        if(typeof window.MBGERTrainingArenaSetStatus==="function")window.MBGERTrainingArenaSetStatus("🔒 Нужны подтверждённые права модератора.","error");
        return false;
    }
    if(window.__mbBossTestMode){
        if(typeof window.MBGERTrainingArenaSetStatus==="function")window.MBGERTrainingArenaSetStatus("Сначала заверши текущую тренировку или тестовый бой.","warning");
        return false;
    }
    if(typeof startArena!=="function"||typeof bossTemplates==="undefined"){
        if(typeof window.MBGERTrainingArenaSetStatus==="function")window.MBGERTrainingArenaSetStatus("Арена ещё не загрузилась. Обнови страницу.","error");
        return false;
    }
    if(!cards.length)makeCards();
    var gerCard=cards.find(function(card){return card&&card.name==="Джорно Джованна (Gold Experience Requiem)";});
    if(!gerCard){
        if(typeof window.MBGERTrainingArenaSetStatus==="function")window.MBGERTrainingArenaSetStatus("Не найдена карточка Gold Experience Requiem в шаблонах.","error");
        return false;
    }
    var trainingProfile=options.trainingProfile==="unique_mix"?"unique_mix":"standard";
    var playerTeacherMode=trainingProfile==="unique_mix"&&options.trainingStyle==="player_imitation";
    var bossWave=clampNumber(options.bossWave,50,1,10000);
    var uniqueTraining=trainingProfile==="unique_mix";
    var allowedUniqueWaves=[200,500,1000,2000];
    if(uniqueTraining&&allowedUniqueWaves.indexOf(bossWave)===-1){
        if(typeof window.MBGERTrainingArenaSetStatus==="function")window.MBGERTrainingArenaSetStatus("Выбери одного из четырёх реальных уникальных боссов: 200, 500, 1000 или 2000.","error");
        return false;
    }
    if(!template(bossWave)||(!uniqueTraining&&isUnique(bossWave))){
        if(typeof window.MBGERTrainingArenaSetStatus==="function")window.MBGERTrainingArenaSetStatus("Выбери обычного босса или одного из четырёх уникальных боссов.","error");
        return false;
    }
    var attackTypes=uniqueTraining?[]:(Array.isArray(options.attackTypes)?options.attackTypes.map(Number).filter(function(type,index,array){
        return Number.isInteger(type)&&type>=0&&type<=20&&array.indexOf(type)===index;
    }):[]);
    if(!uniqueTraining&&!attackTypes.length){
        if(typeof window.MBGERTrainingArenaSetStatus==="function")window.MBGERTrainingArenaSetStatus("Выбери хотя бы один тип атаки.","error");
        return false;
    }
    var t=template(bossWave);
    var mainCard=Object.assign({},gerCard,{
        ability:gerCard.ability?Object.assign({},gerCard.ability):null,
        statusAbility:gerCard.statusAbility?Object.assign({},gerCard.statusAbility):null,
        superAbility:gerCard.superAbility?Object.assign({},gerCard.superAbility):null,
        __bossTestAbilityMode:"ultimate"
    });
    var modeData={
        kind:uniqueTraining?"unique":"arena",
        bossWave:bossWave,
        bossName:t&&t.name?t.name:"Обычный босс",
        attackWave:clampNumber(options.attackWave,250,50,10000),
        attackTypes:attackTypes,
        abilityMode:"ultimate",
        mainCard:mainCard,
        passive:null,
        finishing:false,
        passiveRevived:false,
        gerTraining:true,
        trainingProfile:trainingProfile,
        playerTeacherMode:playerTeacherMode,
        playerTeacherPhase:playerTeacherMode,
        phase:playerTeacherMode?"player":"swarm",
        invulnerable:playerTeacherMode?false:(trainingProfile==="unique_mix"||options.invulnerable!==false),
        snapshot:snap()
    };
    window.__mbBossTestMode=modeData;
    window.__mbBossTestMainCard=mainCard;
    window.__mbBossTestAbilityMode="ultimate";
    window.__mbBossTestPassive=null;
    window.__mbBossTestSuperHitUsed=false;
    window.__mbGERTrainingMode=true;
    window.__mbGERTrainingBossKey=uniqueTraining?"ger_unique_"+bossWave:"arena_wave_"+bossWave;
    window.__mbGERTrainingOptions={
        trainingProfile:trainingProfile,
        bossHp:clampNumber(options.bossHp,2000000,10000,1000000000000),
        damageReferenceHp:450000,
        uniqueBossWave:uniqueTraining?bossWave:null,
        attackWave:clampNumber(options.attackWave,500,50,10000),
        speedMultiplier:clampNumber(options.speedMultiplier,2,1,5),
        playerTeacherMode:playerTeacherMode,
        playerTeacherPhase:playerTeacherMode,
        imitationStage:playerTeacherMode?"player":"swarm"
    };
    exitControl(modeData);
    if(uniqueTraining&&!playerTeacherMode&&typeof window.MBGERTrainingSwarmStart==="function") {
        // The established self-training mode still starts the 100 independent stands immediately.
        window.MBGERTrainingSwarmStart();
    }
    try{
        if(uniqueTraining){
            launchUniqueTrainingBoss(modeData);
        }else{
            startArena(bossWave);
        }
        if(typeof window.MBUpdateGoldExperience==="function") {
            window.MBUpdateGoldExperience();
            if(typeof window.requestAnimationFrame==="function") window.requestAnimationFrame(function(){
                if(window.__mbGERTrainingMode&&typeof window.MBUpdateGoldExperience==="function") window.MBUpdateGoldExperience();
            });
        }
        if(playerTeacherMode){
            if(typeof window.MBGERTrainingSwarmStartPlayerTeacher!=="function"){
                throw new Error("player teacher recorder unavailable");
            }
            if(window.MBGERTrainingSwarmStartPlayerTeacher()!==true){
                throw new Error("player teacher recorder did not start");
            }
        }
        if(typeof updateSuperButton==="function")updateSuperButton();
        if(typeof window.MBGERTrainingArenaOnStarted==="function")window.MBGERTrainingArenaOnStarted(modeData);
        return true;
    }catch(error){
        console.error("[GER Training] Не удалось запустить арену:",error);
        window.MBBossTestFinish("error",false);
        return false;
    }
};

window.MBBossTestModifyOutgoingDamage=function(d,ratio){var m=window.__mbBossTestMode;if(m&&m.gerTraining&&!window.__mbGERTrainingSwarmDamageInFlight)return 0;if(!m||m.abilityMode!=="passive"||!m.passive)return d;var a=m.passive,t=a.type,v=Number(a.value)||0,ch=Number(a.chance)||0,n=Math.max(0,Number(d)||0);if(["damageAura","bossDamage","bossDamageAura","bossSupport","bleed"].indexOf(t)>=0)n=Math.floor(n*(1+Math.max(0,v)));else if(["bossDouble","bossDoubleSelf","sevenSpecial"].indexOf(t)>=0)n*=2;else if(t==="critChance"&&Math.random()<Math.max(0,Math.min(1,v)))n*=2;else if(t==="shock"&&Math.random()<Math.max(0,Math.min(1,ch)))n*=1.2;else if(t==="damageMultChance"&&Math.random()<Math.max(0,Math.min(1,ch)))n*=Math.max(1,Number(a.mult)||1.2);else if(t==="oneShot"&&n>0&&Math.random()<Math.max(0,Math.min(1,ch))){window.__mbBossTestSuperHitUsed=true;n=Math.max(n,testBossHpRemaining(m)+1);}else if(t==="desperateStrike"){var r=typeof arenaHP!=="undefined"&&typeof arenaMaxHP!=="undefined"&&arenaMaxHP>0?arenaHP/arenaMaxHP:1;if(r<=(Number(a.threshold)||.3))n*=1+Math.max(0,v);}else if(t==="scaleWithWins")n*=1+Math.min(2,(Number(m.attackWave)||1)*Math.max(0,v));else if(t==="clickDmgSelf")n*=1.02;else if(t==="fire"&&Number(a.damage)>0)n*=1+Math.min(.5,Number(a.damage)/100);else if((t==="freezeStacks"||t==="blind")&&v>0)n*=1+Math.min(.2,v*.02);return Math.max(0,Math.floor(n));};
window.MBBossTestModifyIncomingDamage=function(d,source){var m=window.__mbBossTestMode;if(!m)return d;if(m.gerTraining&&m.invulnerable)return 0;if(m.abilityMode!=="passive"||!m.passive)return d;var a=m.passive,t=a.type,v=Number(a.value)||0,n=Math.max(0,Number(d)||0);if(t==="damageReduction"||t==="absoluteFreeze")n*=1-Math.max(0,Math.min(.95,v));else if(t==="dmgTakenIncrease")n*=1+Math.max(0,v);else if(t==="takabaConfidence")n*=.6;else if(t==="gojoDodge"&&Math.random()<Math.max(0,Math.min(1,Number(a.chance)||0)))return 0;else if(t==="resurrect"&&!m.passiveRevived){var hp=null,max=null;if(source==="arena"&&typeof arenaHP!=="undefined"){hp=arenaHP;max=arenaMaxHP;}else if(source==="stone"&&typeof livingStonePlayerHp!=="undefined"){hp=livingStonePlayerHp;max=livingStonePlayerMaxHp;}else if(source==="waystar"&&typeof waystarPlayerHp!=="undefined"){hp=waystarPlayerHp;max=waystarPlayerMaxHp;}else if(source==="rwb"&&window.getRWBPlayer){var p=window.getRWBPlayer();if(p){hp=p.hp;max=p.maxHp;}}else if(source==="antispiral"&&window.getAntiSpiralPlayerHp){hp=window.getAntiSpiralPlayerHp();max=window.getAntiSpiralPlayerMaxHp();}else if(source==="stoneSuper"&&window.getLivingStoneSuperHeart){var soul=window.getLivingStoneSuperHeart();hp=soul.hp;max=soul.maxHp;}if(hp!==null&&hp-n<=0&&Math.random()<Math.max(0,Math.min(1,Number(a.chance)||0))){m.passiveRevived=true;var rev=Math.max(1,Math.floor((Number(max)||100)*.25));if(source==="arena")arenaHP=rev;else if(source==="stone")livingStonePlayerHp=rev;else if(source==="waystar")waystarPlayerHp=rev;else if(source==="rwb"&&window.getRWBPlayer){var rp=window.getRWBPlayer();if(rp)rp.hp=rev;}else if(source==="antispiral"&&window.setAntiSpiralPlayerHp)window.setAntiSpiralPlayerHp(rev);else if(source==="stoneSuper"&&window.setLivingStoneSuperPlayerHp)window.setLivingStoneSuperPlayerHp(rev);var hpEl=E("arenaHP");if(hpEl)hpEl.textContent=rev;return 0;}}return Math.max(0,Math.floor(n));};
function testBossHpRemaining(m){if(m.kind==="arena")return Math.max(1,Number(typeof arenaBossMaxHP!=="undefined"?arenaBossMaxHP:1)||1);if(m.bossWave===200)return Math.max(1,Number(typeof livingStoneBossHp!=="undefined"?livingStoneBossHp:1)||1);if(m.bossWave===500)return Math.max(1,Number(typeof waystarBossHp!=="undefined"?waystarBossHp:1)||1);if(m.bossWave===1000&&window.getRWBActiveBoss){var b=window.getRWBActiveBoss();if(b)return Math.max(1,Number(b.hp)||1);}if(m.bossWave===1500&&window.getAntiSpiralBossHp)return Math.max(1,Number(window.getAntiSpiralBossHp())||1);if(m.bossWave===2000&&window.getLivingStoneSuperBossHp)return Math.max(1,Number(window.getLivingStoneSuperBossHp())||1);return 1;}
function getSupport(c){return c&&(c.ability||c.statusAbility||(c.superAbility&&c.superAbility.passive?c.superAbility:null));}
function hasUltimate(c){
    if(!c)return false;
    if(c.superAbility&&typeof superAbilities!=="undefined"&&superAbilities[c.name])return true;
    // These SUPER controls are implemented by dedicated systems instead of superAbilities.
    if(c.name==="ДИО Over Heaven"&&c.superAbility&&typeof window.isDioOverHeavenCard==="function")return true;
    if(c.name==="Годжо (флешбек)"&&typeof window.gojoUpdatePanel==="function")return true;
    if(c.name==="Белоус"&&c.ability&&c.ability.type==="whitebeardSpecial"&&typeof window.useWhitebeardSkill==="function")return true;
    if(typeof window.MBIsStandUserCard==="function"&&window.MBIsStandUserCard(c))return true;
    return false;
}
window.renderBossTestOptions=function(){var s=E("bossTestBossSelect");if(!s)return;var w=Number(s.value),u=isUnique(w);if(E("bossTestRegularSettings"))E("bossTestRegularSettings").style.display=u?"none":"block";if(E("bossTestUniqueNotice"))E("bossTestUniqueNotice").style.display=u?"block":"none";if(E("bossTestStartBtn"))E("bossTestStartBtn").textContent=u?"⚔️ НАЧАТЬ УНИКАЛЬНЫЙ БОЙ":"⚔️ НАЧАТЬ ТЕСТОВЫЙ БОЙ";if(!u)window.syncBossTestWave(w);saveBossTestSettings();};
window.syncBossTestWave=function(v){var i=E("bossTestAttackWave"),r=E("bossTestAttackWaveRange"),w=Math.round(clampNumber(v!==undefined?v:(i?i.value:50),50,50,10000)/50)*50;if(i)i.value=w;if(r)r.value=w;saveBossTestSettings();};
window.setBossTestAttacks=function(v){document.querySelectorAll("#bossTestAttackList input[data-boss-test-attack]").forEach(function(b){b.checked=!!v;});saveBossTestSettings();};
function drawAttackChecks(){var container=E("bossTestAttackList");if(!container)return;container.textContent="";attackNames.forEach(function(name,type){var l=document.createElement("label");l.style.cssText="display:flex;gap:8px;align-items:center;padding:9px 10px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.09);border-radius:10px;font-size:12px;line-height:1.3;";var i=document.createElement("input");i.type="checkbox";i.checked=true;i.dataset.bossTestAttack=String(type);i.style.cssText="accent-color:#32c6dd;flex-shrink:0;width:16px;height:16px;";var s=document.createElement("span");s.textContent=name;l.appendChild(i);l.appendChild(s);container.appendChild(l);});}
window.renderBossTestMainCards=function(){var s=E("bossTestMainCard");if(!s)return;var mode=E("bossTestAbilityMode")?E("bossTestAbilityMode").value:"passive",old=s.value;s.textContent="";cards.forEach(function(c,i){if(mode==="ultimate"?!hasUltimate(c):!getSupport(c))return;var o=document.createElement("option");o.value=String(i);o.textContent=(c.rarity||"")+" · "+c.name;s.appendChild(o);});if(Array.from(s.options).some(function(o){return o.value===old;}))s.value=old;window.showBossTestAbilityDescription();saveBossTestSettings();};
window.showBossTestAbilityDescription=function(){
    var box=E("bossTestAbilityDescription"),select=E("bossTestMainCard"),mode=E("bossTestAbilityMode")?E("bossTestAbilityMode").value:"passive";
    if(!box||!select)return;
    var c=cards[Number(select.value)];
    if(!c){box.textContent="Нет персонажа с такой реализованной способностью.";saveBossTestSettings();return;}
    if(mode==="ultimate"){
        var ability=typeof superAbilities!=="undefined"?superAbilities[c.name]:null;
        if(ability)box.textContent=ability.name+" · "+((c.superAbility&&c.superAbility.desc)||"");
        else if(c.name==="ДИО Over Heaven")box.textContent=(c.superAbility&&c.superAbility.name||"THE WORLD OVER HEAVEN")+" · "+((c.superAbility&&c.superAbility.desc)||"Отдельные навыки управляются собственной панелью ДИО.");
        else if(c.name==="Годжо (флешбек)")box.textContent="ГОДЖО · Красный, Синий, Безграничность и Пурпурный. Панель навыков использует проклятую энергию.";
        else if(c.name==="Белоус")box.textContent=(c.ability&&c.ability.desc)||"ГУРА-ГУРА · Удар и окно запуска цунами.";
        else if(typeof window.MBGetStandUserInfo==="function"&&window.MBIsStandUserCard&&window.MBIsStandUserCard(c)){
            var info=window.MBGetStandUserInfo(c);
            box.textContent=info?(info.stand+" · "+info.trait+" · вызов стенда и его особые эффекты"):"Вызов стенда";
        } else box.textContent=(c.superAbility&&c.superAbility.desc)||"SUPER.";
    } else {
        var p=getSupport(c);
        box.textContent=p&&p.desc?p.desc:(c.superAbility&&c.superAbility.desc)||"Пассивная способность.";
    }
    saveBossTestSettings();
};
function renderBossSelect(){var s=E("bossTestBossSelect");if(!s||typeof bossTemplates==="undefined")return;s.textContent="";var generic=document.createElement("option");generic.value="0";generic.textContent="👑 Обычный босс · классическая арена";s.appendChild(generic);var keys=Object.keys(bossTemplates).map(Number).sort(function(a,b){return a-b;});keys.forEach(function(w){var t=template(w);if(!t)return;var o=document.createElement("option");o.value=String(w);o.textContent=(isUnique(w)?"🔒 ":"")+w+" волна · "+t.name;s.appendChild(o);});s.value="0";}
function buildMode(){saveBossTestSettings();var w=Number(E("bossTestBossSelect")&&E("bossTestBossSelect").value),t=template(w),c=cards[Number(E("bossTestMainCard")&&E("bossTestMainCard").value)];if(!t||!c){setResult("Не удалось выбрать босса или персонажа.","#ffb0a0");return null;}var u=isUnique(w),abmode=E("bossTestAbilityMode").value,types=[];if(!u)document.querySelectorAll("#bossTestAttackList input[data-boss-test-attack]:checked").forEach(function(i){types.push(Number(i.dataset.bossTestAttack));});if(!u&&!types.length){setResult("Отметь хотя бы одну атаку.","#ffb0a0");return null;}var main={name:c.name,universe:c.universe||"",rarity:c.rarity||"",damage:Number(c.damage)||20,hp:Number(c.hp)||100,speed:Number(c.speed)||1.2,ability:c.ability?Object.assign({},c.ability):null,statusAbility:c.statusAbility?Object.assign({},c.statusAbility):null,superAbility:c.superAbility?Object.assign({},c.superAbility):null,desc:c.desc||"",__bossTestAbilityMode:abmode};return {kind:u?"unique":"arena",bossWave:w,bossName:t.name,attackWave:u?w:clampNumber(E("bossTestAttackWave")?E("bossTestAttackWave").value:50,50,50,10000),attackTypes:types,abilityMode:abmode,mainCard:main,passive:abmode==="passive"?getSupport(c):null,finishing:false,passiveRevived:false,snapshot:snap()};}
function unlockUniqueForTest(m){if(typeof defeatedBosses!=="undefined"&&Array.isArray(defeatedBosses))for(var i=defeatedBosses.length-1;i>=0;i--)if(Number(defeatedBosses[i])===m.bossWave)defeatedBosses.splice(i,1);if(m.bossWave===500)window.waystarDefeatedThisRun=false;}
window.startBossTestSelected=function(){if(!isModerator()){updateModeratorAccess();setResult("🔒 Тест боя с боссом доступен только модераторам.","#ffb0a0");return;}if(window.__mbBossTestMode){setResult("Сначала заверши текущий тестовый бой.","#ffb0a0");return;}var m=buildMode();if(!m)return;window.__mbBossTestMode=m;window.__mbBossTestMainCard=m.mainCard;window.__mbBossTestAbilityMode=m.abilityMode;window.__mbBossTestPassive=m.passive;window.__mbBossTestSuperHitUsed=false;if(m.kind==="arena"){setResult("HP босса рассчитано на 5 идеальных ударов. Наград нет.","#9dffc0");exitControl(m);try{startArena(m.bossWave);if(typeof updateSuperButton==="function")updateSuperButton();}catch(e){console.error("[BossTest] start arena",e);window.MBBossTestFinish("error",false);}return;}unlockUniqueForTest(m);if(typeof wave!=="undefined")wave=m.bossWave;if(typeof currentEnemy!=="undefined"){var t=template(m.bossWave),hp=Math.max(1000,Math.floor((50+m.bossWave*12)*(Number(t.hpMult)||10)));currentEnemy={name:t.name,hp:hp,maxHp:hp,damage:Math.floor((15+m.bossWave*6)*(Number(t.dmgMult)||1)/2),isBoss:true};}exitControl(m);setResult("Запущен уникальный бой со своими механиками. Наград и записи победы не будет.","#9dffc0");try{if(m.bossWave===200)startLivingStoneFight();else if(m.bossWave===500)startWaystarFight();else if(m.bossWave===1000)startRogerWhitebeardFight();else if(m.bossWave===1500)window.startAntiSpiralBossFight();else if(m.bossWave===2000)window.startLivingStoneSuperFight();if(typeof updateSuperButton==="function")updateSuperButton();}catch(e){console.error("[BossTest] start unique",e);window.MBBossTestFinish("error",false);}};
function initialize(){
    updateModeratorAccess();
    // Any save triggered by a unique boss or a SUPER during the sandbox is suppressed.
    // The test snapshot is restored when the fight exits; ordinary saves continue unchanged.
    if(typeof window.saveAll==="function" && !window.__mbBossTestSaveWrapped) {
        var originalSaveAll=window.saveAll;
        window.saveAll=function(){if(window.__mbBossTestMode)return;return originalSaveAll.apply(this,arguments);};
        window.__mbBossTestSaveWrapped=true;
    }
    makeCards();renderBossSelect();drawAttackChecks();
    var savedTestSettings=loadBossTestSettings();
    if(!restoreBossTestSettings(savedTestSettings)){
        window.renderBossTestMainCards();window.renderBossTestOptions();saveBossTestSettings();
    }
    var settingsPanel=E("bossTestSubTab");
    if(settingsPanel&&!settingsPanel._bossTestSettingsBound){
        settingsPanel.addEventListener("change",saveBossTestSettings);
        settingsPanel.addEventListener("input",function(ev){if(ev.target&&ev.target.id==="bossTestAttackWaveRange")saveBossTestSettings();});
        settingsPanel._bossTestSettingsBound=true;
    }
    updateModeratorAccess();
    if(!window.__mbBossTestAccessTimer)window.__mbBossTestAccessTimer=window.setInterval(updateModeratorAccess,1000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize);else initialize();
})();