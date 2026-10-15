(function () {
"use strict";
var catalog=[{id:"the_boys",name:"ПАЦАНЫ",displayName:"Разлом: The Boys",universe:"The Boys",cost:25000,icon:"🩸",color:"#e23d4d",description:"Открой доступ к эксклюзивным персонажам этой вселенной.",note:"После покупки доступа карты могут выпадать из соответствующей крутки."},{id:"one_piece",name:"ВАН-ПИС",displayName:"Разлом: Ван-Пис",universe:"One Piece",cost:50000,icon:"🏴‍☠️",color:"#d9a441",description:"Открой доступ к эксклюзивным персонажам этой вселенной.",note:"После покупки доступа карты могут выпадать из соответствующей крутки."},{id:"one_punch_man",name:"ВАНПАНЧМЕН",displayName:"Разлом: One-Punch Man",universe:"OPM",cost:35000,icon:"👊",color:"#f97316",description:"Открой доступ к эксклюзивным персонажам этой вселенной.",note:"После покупки доступа карты могут выпадать из соответствующей крутки."},{id:"jojo",name:"ДЖОДЖО",displayName:"Разлом: JoJo’s Bizarre Adventure",universe:"JoJo",cost:50000,icon:"⭐",color:"#b56cff",description:"Открой доступ ко всему ростеру JoJo’s Bizarre Adventure: от Phantom Blood до The JOJOLands.",note:"После покупки персонажи JoJo смогут выпадать из обычной гачи в пределах своих редкостей."}];
var unlocked=[];
function validIds(ids){if(!Array.isArray(ids))return[];var known=new Set(catalog.map(function(p){return p.id;}));return Array.from(new Set(ids.filter(function(id){return typeof id==="string"&&known.has(id);})))}
function isUnlocked(id){return !!id&&unlocked.indexOf(id)>=0}
function getPatch(id){return catalog.find(function(p){return p.id===id})||null}

function esc(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function render(){
 var root=document.getElementById("patchShop");if(!root)return;
 root.innerHTML='<div style="font-size:12px;letter-spacing:1px;font-weight:900;color:#e6d8d8;margin:0 0 8px 2px;">🌌 РАЗЛОМЫ ВСЕЛЕННЫХ</div>'+catalog.map(function(patch,idx){
  var open=isUnlocked(patch.id);
  var btn=open?'<button disabled style="border:0;border-radius:10px;padding:10px 12px;font-weight:900;background:rgba(65,200,125,.18);color:#71f0aa;">✅ ДОСТУП ОТКРЫТ</button>':'<button data-patch-id="'+patch.id+'" onclick="window.MBPatches.purchase(this.dataset.patchId)" style="border:0;border-radius:10px;padding:10px 12px;font-weight:900;background:linear-gradient(135deg,'+patch.color+',#7c1e31);color:white;">Купить за '+(typeof mode!=="undefined"&&mode==="moder"?"БЕСПЛАТНО":patch.cost.toLocaleString("ru-RU")+" ⭐")+'</button>'
  return '<div style="display:flex;flex-direction:column;gap:8px;border:1px solid '+(open?'rgba(90,230,155,.55)':patch.color)+';border-radius:14px;padding:12px;margin-bottom:9px;background:linear-gradient(125deg,rgba(38,20,31,.96),rgba(15,17,29,.96));">'+
   '<div style="display:flex;align-items:flex-start;gap:10px;"><div style="flex:0 0 48px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:rgba(226,61,77,.15);font-size:28px;">'+patch.icon+'</div><div style="flex:1;min-width:0;"><div style="font-size:9px;letter-spacing:1.2px;color:'+patch.color+';font-weight:900;">РАЗЛОМ #'+String(idx+1).padStart(2,"0")+' · ДОСТУП К ВСЕЛЕННОЙ</div><div style="font-size:17px;font-weight:1000;color:white;margin:2px 0 4px;">'+esc(patch.name)+'</div><div style="font-size:11px;color:#c7c4cc;line-height:1.4;">'+esc(patch.description)+'</div><div style="font-size:10px;color:'+(open?'#71f0aa':'#f0bd6b')+';font-weight:800;margin-top:5px;">'+(open?'✅ Куплен · карты добавлены в пул':'🔒 Не куплен · карты пока не выпадают')+'</div></div></div>'+
   '<div style="font-size:10px;color:#a9a4b2;">'+esc(patch.note)+'</div><div style="font-size:11px;color:#c8c4d0;font-weight:900;">Персонаж разлома</div><div style="display:flex;justify-content:flex-end;">'+btn+'</div></div>';
 }).join("");
}
function purchase(id){
 var patch=getPatch(id);if(!patch)return false;
 if(isUnlocked(id)){if(typeof showFloatingText==="function")showFloatingText("✅ Разлом «"+patch.name+"» уже открыт!","#71f0aa");return true}
 if(!(typeof mode!=="undefined"&&mode==="moder")){
  if(typeof points==="undefined"||Number(points)<patch.cost){if(typeof showFloatingText==="function")showFloatingText("❌ Для разлома «"+patch.name+"» нужно "+patch.cost.toLocaleString("ru-RU")+" ⭐","#ff7777");else alert("Не хватает звёзд. Нужно "+patch.cost.toLocaleString("ru-RU")+" ⭐.");return false}
  points-=patch.cost;
 }
 unlocked.push(id);
 if(typeof saveAll==="function")saveAll();
 if(typeof renderPoints==="function")renderPoints();
 if(typeof renderBook==="function")renderBook();
 render();
 if(typeof showFloatingText==="function")showFloatingText("🌌 РАЗЛОМ «"+patch.name+"» ОТКРЫТ!","#ff6b78");
 return true;
}
window.MBPatches={list:function(){return catalog.slice()},load:function(ids){unlocked=validIds(ids);render()},getUnlocked:function(){return unlocked.slice()},isUnlocked:isUnlocked,getPatch:getPatch,isTemplateUnlocked:function(t){return !t||!t.patchId||isUnlocked(t.patchId)},purchase:purchase,render:render};
if(typeof window.renderGachaTab==="function"){var oldRender=window.renderGachaTab;window.renderGachaTab=function(){var result=oldRender.apply(this,arguments);render();return result}}
document.addEventListener("DOMContentLoaded",render);
})();