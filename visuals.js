// ============================================================
// VISUALS v2.0 — МИНИМАЛЬНЫЕ ЭФФЕКТЫ
// Только кнопка комбо + пульсации. Без фонов и лишнего.
// ============================================================
// ПОДКЛЮЧАТЬ В КОНЦЕ index.html, после всех скриптов
// ============================================================

(function() {
    'use strict';
    
    if (window._visualsLoaded) return;
    window._visualsLoaded = true;
    
    // ============================================================
    // ★★★ CSS — только комбо и мелкие детали ★★★
    // ============================================================
    const style = document.createElement('style');
    style.id = 'visuals-styles';
    style.textContent = `
        /* ===== Плавная смена цвета кнопки атаки (без анимации градиента) ===== */
        .click-area {
            transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.1s !important;
        }

        /* ===== Комбо-цвета на кнопке атаки ===== */
        .click-area.combo-1 {
            background: linear-gradient(135deg, #f5af19, #e65c00) !important;
            box-shadow: 0 8px 0 #b84000, 0 15px 20px rgba(245, 175, 25, 0.4) !important;
        }
        .click-area.combo-2 {
            background: linear-gradient(135deg, #feca57, #f5af19) !important;
            box-shadow: 0 8px 0 #b88b00, 0 15px 20px rgba(254, 202, 87, 0.5) !important;
        }
        .click-area.combo-3 {
            background: linear-gradient(135deg, #ff8800, #ff4400) !important;
            box-shadow: 0 8px 0 #a83000, 0 15px 25px rgba(255, 68, 0, 0.6) !important;
        }
        .click-area.combo-5 {
            background: linear-gradient(135deg, #ff2222, #8b0000) !important;
            box-shadow: 0 8px 0 #5a0000, 0 15px 30px rgba(255, 0, 0, 0.8) !important;
            animation: ragePulse 0.6s infinite alternate !important;
        }
        @keyframes ragePulse {
            from { box-shadow: 0 8px 0 #5a0000, 0 15px 30px rgba(255, 0, 0, 0.8); }
            to { box-shadow: 0 8px 0 #5a0000, 0 15px 40px rgba(255, 60, 0, 1); }
        }

        /* ===== Пульсация при крите ===== */
        .click-area.crit-flash {
            animation: critFlash 0.3s ease-out !important;
        }
        @keyframes critFlash {
            0% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.05); filter: brightness(1.5); }
            100% { transform: scale(1); filter: brightness(1); }
        }

        /* ===== Подсветка кнопки когда враг на добивание ===== */
        .click-area.finisher {
            border: 2px solid #fff !important;
            box-shadow: 0 8px 0 #b84000, 0 0 20px rgba(255,255,255,0.6) !important;
        }

        /* ===== Мини-индикатор комбо над кнопкой ===== */
        .combo-badge {
            position: absolute;
            top: -12px;
            right: 15px;
            background: linear-gradient(135deg, #ff4400, #8b0000);
            color: #fff;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 900;
            font-family: 'Nunito', sans-serif;
            box-shadow: 0 3px 10px rgba(255, 68, 0, 0.5);
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            z-index: 2147483647;
            letter-spacing: 0.5px;
        }
        .combo-badge.show { opacity: 1; }

        /* ===== Цифры урона: жирнее и чище ===== */
        .floating-text {
            position: relative !important;
            z-index: 2147483647 !important;
            font-weight: 900;
            text-shadow: 0 2px 6px rgba(0,0,0,0.9);
        }
    `;
    document.head.appendChild(style);
    
    // ============================================================
    // ★★★ КОМБО-ЦВЕТ КНОПКИ АТАКИ ★★★
    // ============================================================
    let lastComboShown = 0;
    
    function updateClickAreaCombo() {
        let area = document.getElementById('clickArea');
        if (!area) return;
        
        // Читаем comboMultiplier из game.js (глобальная переменная)
        let combo = (typeof comboMultiplier !== 'undefined') ? comboMultiplier : 1;
        
        // Убираем старые классы
        area.classList.remove('combo-1', 'combo-2', 'combo-3', 'combo-5');
        
        // Ставим новый по комбо
        if (combo >= 5) area.classList.add('combo-5');
        else if (combo >= 3) area.classList.add('combo-3');
        else if (combo >= 2) area.classList.add('combo-2');
        else area.classList.add('combo-1');
        
        // Badge с цифрой комбо
        let badge = area.querySelector('.combo-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'combo-badge';
            area.appendChild(badge);
        }
        
        if (combo >= 2) {
            badge.textContent = '×' + combo + ' COMBO';
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
        
        lastComboShown = combo;
    }
    
    // Проверяем комбо каждые 100мс (быстро и незаметно)
    setInterval(updateClickAreaCombo, 100);
    
    // ============================================================
    // ★★★ ПУЛЬСАЦИЯ ПРИ КРИТЕ ★★★
    // ============================================================
    // Перехватываем sfxCrit из game.js
    let _origSfxCrit = null;
    function patchCritSound() {
        if (typeof window.sfxCrit === 'function' && !window._sfxCritPatched) {
            _origSfxCrit = window.sfxCrit;
            window.sfxCrit = function() {
                // Вызываем оригинал
                if (_origSfxCrit) _origSfxCrit.apply(this, arguments);
                
                // Пульсация кнопки
                let area = document.getElementById('clickArea');
                if (area) {
                    area.classList.remove('crit-flash');
                    void area.offsetWidth; // force reflow
                    area.classList.add('crit-flash');
                    setTimeout(() => area.classList.remove('crit-flash'), 350);
                }
            };
            window._sfxCritPatched = true;
        }
    }
    
    // Проверяем каждые 200мс что sfxCrit появился (game.js может загружаться дольше)
    setInterval(patchCritSound, 200);
    
    // ============================================================
    // ★★★ ПОДСВЕТКА КНОПКИ КОГДА ВРАГ НА ДОБИВАНИЕ ★★★
    // ============================================================
    function checkFinisher() {
        let area = document.getElementById('clickArea');
        let enemyHp = document.getElementById('enemyContainer');
        if (!area || !enemyHp) return;
        
        // Ищем полоску HP врага
        let hpBar = enemyHp.querySelector('div[style*="width"]');
        if (hpBar) {
            let widthStr = hpBar.style.width;
            let percent = parseFloat(widthStr);
            if (!isNaN(percent) && percent < 15 && percent > 0) {
                area.classList.add('finisher');
            } else {
                area.classList.remove('finisher');
            }
        }
    }
    
    setInterval(checkFinisher, 300);
    
    // ============================================================
    // ★★★ ЛЁГКАЯ ПУЛЬСАЦИЯ ЗВЁЗД В ТОПЕ ПРИ ИХ ПОЛУЧЕНИИ ★★★
    // ============================================================
    // Пульсируем звёзды когда points меняется
    let lastPoints = -1;
    function checkPointsChange() {
        if (typeof points === 'undefined') return;
        if (lastPoints !== -1 && points !== lastPoints) {
            let el = document.getElementById('pointsAmount2');
            if (el && el.parentElement) {
                el.parentElement.style.transition = 'none';
                el.parentElement.style.transform = 'scale(1.08)';
                el.parentElement.style.filter = 'brightness(1.3)';
                setTimeout(() => {
                    el.parentElement.style.transition = 'all 0.4s ease';
                    el.parentElement.style.transform = 'scale(1)';
                    el.parentElement.style.filter = '';
                }, 50);
            }
        }
        lastPoints = points;
    }
    
    setInterval(checkPointsChange, 200);
    
    // ============================================================
    // ★★★ ЛОГ ★★★
    // ============================================================
    console.log("╔════════════════════════════════════════╗");
    console.log("║  🎨 VISUALS v2.0 (minimal)              ║");
    console.log("║  🎯 Комбо-цвет кнопки атаки             ║");
    console.log("║  💥 Пульс при крите                     ║");
    console.log("║  🔴 Подсветка добивания                 ║");
    console.log("╚════════════════════════════════════════╝");
    
})();
