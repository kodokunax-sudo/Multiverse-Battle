// ========== ГАЧА-АНИМАЦИЯ ==========
// Все переменные и функции для анимации круток

window._gachaAnimFrame = null;
window._gachaStripX = 0;
window._gachaSpeed = 0;

// Запуск оверлея с анимацией
window._startGachaOverlay = function(animData) {
    if (!animData || !animData.cards) return;
    
    let overlay = document.getElementById("gachaOverlay");
    if (!overlay) return;
    
    // Заполняем ленту карт
    let strip = document.getElementById("gachaStrip");
    if (strip) {
        strip.innerHTML = animData.cards.map(card => {
            let rarityColor = typeof getRarityColor === 'function' ? getRarityColor(card.rarity) : "#fff";
            let showImage = ["Эволюционная", "Секретная", "Легендарная"].includes(card.rarity);
            let cardImg = showImage && typeof getCardImage === 'function' ? getCardImage(card.name) : null;
            let imgHTML = cardImg ? '<img src="' + cardImg + '" style="width:60px;height:60px;border-radius:8px;object-fit:cover;margin-bottom:4px;">' : '<div style="width:60px;height:60px;border-radius:8px;background:#2c2c3a;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:20px;">🎴</div>';
            
            return '<div style="min-width:150px;text-align:center;background:rgba(30,30,47,0.95);border-radius:16px;padding:15px 10px;border:2px solid ' + rarityColor + ';box-shadow: 0 0 15px ' + rarityColor + ';">' +
                imgHTML +
                '<div style="font-weight:900;font-size:12px;color:' + rarityColor + ';">' + (typeof escapeHtml === 'function' ? escapeHtml(card.name) : card.name) + '</div>' +
                '<div style="font-size:10px;margin-top:4px;">' + card.rarity + '</div>' +
                '<div style="font-size:10px;">💪' + (card.damage || "???") + ' ❤️' + (card.hp || "???") + '</div>' +
                '</div>';
        }).join('');
        
        strip.style.display = "flex";
        strip.style.transition = "none";
        strip.style.transform = "translateX(0px)";
    }
    
    document.getElementById("gachaResultCard").style.display = "none";
    document.getElementById("gachaSkipBtn").style.display = "block";
    document.getElementById("gachaSkipBtn").onclick = window._skipGachaAnimation;
    
    overlay.style.display = "flex";
    window._gachaStripX = 0;
    window._gachaSpeed = 25;
    
    if (window._gachaAnimFrame) {
        cancelAnimationFrame(window._gachaAnimFrame);
    }
    
    window._gachaAnimFrame = requestAnimationFrame(window._renderGachaAnimation);
};

// Скрыть оверлей и сбросить анимацию
window._hideGachaOverlay = function() {
    let overlay = document.getElementById("gachaOverlay");
    if (overlay) overlay.style.display = "none";
    if (window._gachaAnimFrame) {
        cancelAnimationFrame(window._gachaAnimFrame);
        window._gachaAnimFrame = null;
    }
    // Сбрасываем глобальные флаги
    window.gachaAnimationActive = false;
    window.gachaAnimationData = null;
};

// Пропустить анимацию и сразу показать результат
window._skipGachaAnimation = function() {
    if (!window.gachaAnimationActive || !window.gachaAnimationData) return;
    
    let card = window.gachaAnimationData.resultCard;
    let overlay = document.getElementById("gachaOverlay");
    
    if (overlay) {
        document.getElementById("gachaSkipBtn").style.display = "none";
        let strip = document.getElementById("gachaStrip");
        if (strip) strip.style.display = "none";
        
        let resultDiv = document.getElementById("gachaResultCard");
        if (resultDiv) {
            resultDiv.style.display = "flex";
            resultDiv.innerHTML = getCardResultHTML(card);
        }
        
        if (typeof sfxCardObtain === 'function') sfxCardObtain();
    }
    
    setTimeout(() => {
        window._hideGachaOverlay();
    }, 2000);
};

// Основной цикл анимации
window._renderGachaAnimation = function(timestamp) {
    if (!window.gachaAnimationActive || !window.gachaAnimationData) {
        window._hideGachaOverlay();
        return;
    }
    
    let elapsed = timestamp - window.gachaAnimationData.startTime;
    let totalDuration = window.gachaAnimationData.duration;
    
    let strip = document.getElementById("gachaStrip");
    if (!strip) {
        window._hideGachaOverlay();
        return;
    }
    
    let progress = Math.min(1, elapsed / totalDuration);
    
    if (progress < 0.8) {
        // Быстрая фаза
        window._gachaStripX -= window._gachaSpeed;
        window._gachaSpeed += 0.3;
        strip.style.transform = "translateX(" + window._gachaStripX + "px)";
        strip.style.transition = "none";
    } else if (progress < 0.95) {
        // Замедление
        window._gachaSpeed *= 0.9;
        window._gachaStripX -= window._gachaSpeed;
        strip.style.transform = "translateX(" + window._gachaStripX + "px)";
        strip.style.transition = "none";
    } else {
        // Остановка на результате
        let targetX = -(window.gachaAnimationData.resultIndex * 160 + 80);
        strip.style.transition = "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)";
        strip.style.transform = "translateX(" + targetX + "px)";
        
        setTimeout(() => {
            let resultDiv = document.getElementById("gachaResultCard");
            let skipBtn = document.getElementById("gachaSkipBtn");
            
            if (skipBtn) skipBtn.style.display = "none";
            if (strip) strip.style.display = "none";
            
            if (resultDiv) {
                resultDiv.style.display = "flex";
                resultDiv.innerHTML = getCardResultHTML(window.gachaAnimationData.resultCard);
                if (typeof sfxCardObtain === 'function') sfxCardObtain();
            }
            
            setTimeout(() => {
                window._hideGachaOverlay();
            }, 2500);
        }, 600);
        
        if (window._gachaAnimFrame) cancelAnimationFrame(window._gachaAnimFrame);
        window._gachaAnimFrame = null;
        return;
    }
    
    // Зацикливание если уехало слишком далеко
    if (window._gachaStripX < -2000) {
        window._gachaStripX = 400;
        strip.style.transform = "translateX(" + window._gachaStripX + "px)";
        strip.style.transition = "none";
    }
    
    window._gachaAnimFrame = requestAnimationFrame(window._renderGachaAnimation);
};

// Генерация HTML для карточки результата
function getCardResultHTML(card) {
    let rarityColor = typeof getRarityColor === 'function' ? getRarityColor(card.rarity) : "#fff";
    let rarityEmoji = typeof getRarityEmoji === 'function' ? getRarityEmoji(card.rarity) : "";
    let showImage = ["Эволюционная", "Секретная", "Легендарная"].includes(card.rarity);
    let cardImg = showImage && typeof getCardImage === 'function' ? getCardImage(card.name) : null;
    let imgHTML = cardImg ? '<img src="' + cardImg + '" style="width:100px;height:100px;border-radius:12px;object-fit:cover;margin-bottom:10px;">' : '';
    
    return '<div style="text-align:center;animation: fadeSlideIn 0.5s ease-out;">' +
        '<div style="font-size:48px;margin-bottom:10px;">' + rarityEmoji + '</div>' +
        imgHTML +
        '<div style="font-size:28px;font-weight:900;color:' + rarityColor + ';text-shadow: 0 0 20px ' + rarityColor + ';margin-bottom:8px;">' + (typeof escapeHtml === 'function' ? escapeHtml(card.name) : card.name) + '</div>' +
        '<div class="rarity-tag ' + (typeof rarityColors !== 'undefined' ? rarityColors[card.rarity] : '') + '" style="font-size:16px;padding:8px 20px;">' + card.rarity + '</div>' +
        '<div style="margin-top:12px;font-size:16px;">💪 ' + (card.damage || "???") + ' ❤️ ' + (card.hp || "???") + '</div>' +
        (card.ability ? '<div style="margin-top:8px;color:#f5af19;font-weight:bold;">✨ ' + card.ability.desc + '</div>' : '') +
        '</div>';
}
