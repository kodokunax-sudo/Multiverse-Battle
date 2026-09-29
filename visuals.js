// ============================================================
// VISUALS v1.0 — КРАСОТА ДЛЯ ИГРЫ
// Анимированный космический фон, свечения, ripple на кнопках,
// gradient-заголовки, плавные появления, красивые карточки
// ============================================================
// ПОДКЛЮЧАТЬ В САМОМ КОНЦЕ index.html, после всех скриптов
// ============================================================

(function() {
    'use strict';
    
    if (window._visualsLoaded) return;
    window._visualsLoaded = true;
    
    // ============================================================
    // ★★★ ЧАСТЬ 1: КРАСИВЫЙ CSS ★★★
    // ============================================================
    const style = document.createElement('style');
    style.id = 'visuals-styles';
    style.textContent = `
        /* ===== Анимированный градиент на фоне body ===== */
        body {
            background: linear-gradient(-45deg, #0a0a14, #150a25, #0a1525, #1a0a20) !important;
            background-size: 400% 400% !important;
            animation: bgShift 25s ease infinite !important;
        }
        @keyframes bgShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* ===== Canvas для частиц (создаётся в JS) ===== */
        #visualParticlesCanvas {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 0;
            opacity: 0.7;
        }

        /* ===== Контейнер app — поверх частиц ===== */
        .app {
            position: relative;
            z-index: 2;
            box-shadow: 
                0 20px 60px rgba(0,0,0,0.6), 
                inset 0 1px 0 rgba(255,255,255,0.08),
                0 0 80px rgba(245, 175, 25, 0.08) !important;
        }
        .app::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 26px;
            background: linear-gradient(135deg, 
                rgba(245,175,25,0.3), 
                rgba(224,86,253,0.15), 
                rgba(0,212,255,0.15),
                rgba(245,175,25,0.3));
            background-size: 300% 300%;
            animation: borderFlow 8s ease infinite;
            z-index: -1;
            filter: blur(10px);
            opacity: 0.6;
        }
        @keyframes borderFlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        /* ===== Красивые заголовки ===== */
        .card-title {
            background: linear-gradient(90deg, #fff 0%, #f5af19 50%, #fff 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: titleShine 3s linear infinite;
            border-left: 4px solid #f5af19 !important;
            filter: drop-shadow(0 0 8px rgba(245,175,25,0.4));
        }
        @keyframes titleShine {
            to { background-position: 200% center; }
        }

        /* ===== Ripple-эффект на кнопках ===== */
        .btn {
            position: relative;
            overflow: hidden;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .btn::before {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 0; height: 0;
            background: radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.5s, height 0.5s;
            pointer-events: none;
        }
        .btn:hover::before {
            width: 300px;
            height: 300px;
        }
        .btn:active {
            transform: scale(0.95) !important;
        }

        /* ===== Улучшенные карточки ===== */
        .card-item {
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
            position: relative;
        }
        .card-item::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 16px;
            background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
            background-size: 200% 200%;
            background-position: -100% 0;
            transition: background-position 0.6s;
            pointer-events: none;
        }
        .card-item:hover::after {
            background-position: 100% 0;
        }
        .card-item:hover {
            transform: translateY(-6px) scale(1.03) !important;
            box-shadow: 
                0 15px 30px rgba(0,0,0,0.5),
                0 0 30px rgba(245, 175, 25, 0.3) !important;
        }

        /* ===== Свечение по редкости ===== */
        .card-item:has(.legendary) {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 4px 10px rgba(0,0,0,0.3) !important;
        }
        .card-item:has(.legendary):hover {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.7), 0 15px 30px rgba(0,0,0,0.5) !important;
        }
        .card-item:has(.secret) {
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.4), 0 4px 10px rgba(0,0,0,0.3) !important;
            animation: secretPulse 2s ease-in-out infinite;
        }
        @keyframes secretPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.4), 0 4px 10px rgba(0,0,0,0.3); }
            50% { box-shadow: 0 0 35px rgba(255, 0, 255, 0.8), 0 4px 10px rgba(0,0,0,0.3); }
        }
        .card-item:has(.mythic):hover {
            box-shadow: 0 0 30px rgba(231, 76, 60, 0.6), 0 15px 30px rgba(0,0,0,0.5) !important;
        }
        .card-item:has(.epic):hover {
            box-shadow: 0 0 30px rgba(155, 89, 182, 0.6), 0 15px 30px rgba(0,0,0,0.5) !important;
        }

        /* ===== Красивая кнопка атаки ===== */
        .click-area {
            position: relative;
            background: linear-gradient(135deg, #f5af19 0%, #e65c00 50%, #f5af19 100%) !important;
            background-size: 200% 200% !important;
            animation: clickAreaShift 4s ease infinite, pulseOrb 2s infinite !important;
            position: relative;
        }
        .click-area::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3), transparent 60%);
            pointer-events: none;
            border-radius: 20px;
        }
        @keyframes clickAreaShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        /* ===== Табы с подсветкой ===== */
        .tab-btn.active {
            position: relative;
            overflow: hidden;
        }
        .tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: 0; left: 20%; right: 20%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #fff, transparent);
            animation: tabLine 1.5s ease-in-out infinite;
        }
        @keyframes tabLine {
            0%, 100% { opacity: 0.4; transform: scaleX(0.7); }
            50% { opacity: 1; transform: scaleX(1); }
        }

        /* ===== Красивые полоски прогресса ===== */
        .fatigue-progress, .level-bar, .expBar {
            position: relative;
            overflow: hidden;
        }
        .fatigue-progress::after, .level-bar::after {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
            animation: progressShine 2s linear infinite;
        }
        @keyframes progressShine {
            to { left: 100%; }
        }

        /* ===== Плавные модалки ===== */
        .modal-overlay {
            animation: modalFadeIn 0.3s ease-out !important;
        }
        @keyframes modalFadeIn {
            from { opacity: 0; backdrop-filter: blur(0px); }
            to { opacity: 1; backdrop-filter: blur(10px); }
        }
        .modal-content {
            animation: modalScaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        @keyframes modalScaleIn {
            from { transform: scale(0.8) translateY(20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* ===== Индикатор мира с частицами ===== */
        .world-indicator {
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(30,30,47,0.9), rgba(0,0,0,0.7)) !important;
            background-size: 200% 200% !important;
            animation: worldBg 8s ease infinite;
            text-shadow: 0 0 10px currentColor;
        }
        @keyframes worldBg {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .world-indicator::before {
            content: '✨';
            position: absolute;
            left: 10px;
            font-size: 14px;
            animation: sparkle 2s ease-in-out infinite;
        }
        @keyframes sparkle {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
        }

        /* ===== Красивые теги редкости ===== */
        .rarity-tag {
            position: relative;
            overflow: hidden;
        }
        .rarity-tag.legendary, .rarity-tag.secret, .rarity-tag.evolutionary {
            position: relative;
        }
        .rarity-tag.legendary::after, .rarity-tag.secret::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
            transform: translateX(-100%);
            animation: rarityShine 3s ease infinite;
        }
        @keyframes rarityShine {
            0%, 50% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        /* ===== Красивые скроллбары ===== */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { 
            background: linear-gradient(180deg, #f5af19, #e65c00);
            border-radius: 10px;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.3);
        }
        ::-webkit-scrollbar-thumb:hover { 
            background: linear-gradient(180deg, #ffc53d, #f5af19);
        }

        /* ===== Плавное появление контента ===== */
        .tab-content.active, .sub-tab-content.active {
            animation: fadeSlideIn 0.4s ease-out forwards;
        }

        /* ===== Улучшенные звёзды в топе ===== */
        .points {
            background: linear-gradient(135deg, rgba(245,175,25,0.1), rgba(245,175,25,0.05)) !important;
            border: 1px solid rgba(245,175,25,0.2);
            text-shadow: 0 0 15px rgba(245,175,25,0.6);
            animation: pointsPulse 3s ease-in-out infinite;
        }
        @keyframes pointsPulse {
            0%, 100% { box-shadow: inset 0 0 20px rgba(245,175,25,0.05); }
            50% { box-shadow: inset 0 0 30px rgba(245,175,25,0.15), 0 0 20px rgba(245,175,25,0.2); }
        }

        /* ===== Пульсация главного экрана ===== */
        .enemy-card {
            position: relative;
            overflow: hidden;
        }
        .enemy-card::before {
            content: '';
            position: absolute;
            top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: radial-gradient(circle at 50% 50%, rgba(231,76,60,0.06), transparent 60%);
            animation: enemyPulse 3s ease-in-out infinite;
            pointer-events: none;
        }
        @keyframes enemyPulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 1; }
        }

        /* ===== Floating text — лучше ===== */
        .floating-text {
            font-weight: 900;
            text-shadow: 
                0 0 10px currentColor,
                0 0 20px currentColor,
                0 2px 8px rgba(0,0,0,0.9) !important;
            letter-spacing: 0.5px;
            animation: floatUpBounce 1s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        }
        @keyframes floatUpBounce {
            0% { opacity: 0; transform: translate(-50%, 0) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -10px) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -80px) scale(1); }
        }

        /* ===== Карточки в отряде ===== */
        .team-selected {
            animation: teamGlow 2s ease-in-out infinite;
        }
        @keyframes teamGlow {
            0%, 100% { box-shadow: 0 0 15px rgba(245, 175, 25, 0.3); }
            50% { box-shadow: 0 0 25px rgba(245, 175, 25, 0.7); }
        }

        /* ===== Красивые слоты сохранений ===== */
        .slot-select {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .slot-select:hover {
            transform: translateY(-3px);
            border-color: #f5af19 !important;
            box-shadow: 0 8px 25px rgba(245,175,25,0.3) !important;
        }
        .slot-select.active {
            background: linear-gradient(135deg, rgba(245,175,25,0.15), rgba(241,39,17,0.1)) !important;
        }

        /* ===== Кнопка SUPER ===== */
        .btn-super {
            position: relative;
            overflow: hidden;
        }
        .btn-super::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
            transform: translateX(-100%) rotate(45deg);
            animation: superShine 2s ease infinite;
            pointer-events: none;
        }
        @keyframes superShine {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(200%) rotate(45deg); }
        }

        /* ===== Красивое свечение активных баффов ===== */
        .buff-active {
            position: relative;
            background: linear-gradient(135deg, rgba(44,44,58,0.8), rgba(25,25,40,0.9)) !important;
            border: 1px solid rgba(245,175,25,0.2) !important;
        }

        /* ===== Улучшенные чипсы-статусы ===== */
        .status-effect {
            animation: statusPop 0.3s ease-out;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.2s;
        }
        .status-effect:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        @keyframes statusPop {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        /* ===== Красивая полоска здоровья ===== */
        .enemy-card > div > div:last-child {
            box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 0 15px rgba(231,76,60,0.4);
        }

        /* ===== Анимация появления карточек ===== */
        .card-item {
            animation: cardAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }
        @keyframes cardAppear {
            from { opacity: 0; transform: scale(0.7) rotate(-5deg); }
            to { opacity: 1; transform: scale(1) rotate(0); }
        }

        /* ===== Ступенчатое появление карточек в списке ===== */
        #collectionGrid .card-item:nth-child(1) { animation-delay: 0.02s; }
        #collectionGrid .card-item:nth-child(2) { animation-delay: 0.04s; }
        #collectionGrid .card-item:nth-child(3) { animation-delay: 0.06s; }
        #collectionGrid .card-item:nth-child(4) { animation-delay: 0.08s; }
        #collectionGrid .card-item:nth-child(5) { animation-delay: 0.10s; }
        #collectionGrid .card-item:nth-child(6) { animation-delay: 0.12s; }
        #collectionGrid .card-item:nth-child(7) { animation-delay: 0.14s; }
        #collectionGrid .card-item:nth-child(8) { animation-delay: 0.16s; }
        #collectionGrid .card-item:nth-child(n+9) { animation-delay: 0.18s; }

        /* ===== Не отвлекать на мобилке ===== */
        @media (max-width: 480px) {
            #visualParticlesCanvas { opacity: 0.4; }
            .app::before { filter: blur(6px); opacity: 0.4; }
        }

        /* ===== Убираем дёргание при анимациях ===== */
        .card-item, .btn, .slot-select {
            will-change: transform, box-shadow;
            backface-visibility: hidden;
        }
    `;
    document.head.appendChild(style);
    
    // ============================================================
    // ★★★ ЧАСТЬ 2: АНИМИРОВАННЫЙ ФОН С ЧАСТИЦАМИ ★★★
    // ============================================================
    function createParticlesCanvas() {
        let canvas = document.createElement('canvas');
        canvas.id = 'visualParticlesCanvas';
        document.body.insertBefore(canvas, document.body.firstChild);
        
        let ctx = canvas.getContext('2d');
        let particles = [];
        let shootingStars = [];
        let nebulae = [];
        let width, height;
        
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);
        
        // ★ Частицы-звёзды ★
        const PARTICLE_COUNT = Math.min(120, Math.floor(window.innerWidth / 15));
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.8 + 0.3,
                speedX: (Math.random() - 0.5) * 0.15,
                speedY: (Math.random() - 0.5) * 0.15,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.02 + Math.random() * 0.04,
                color: Math.random() > 0.85 ? 
                    ['#f5af19', '#e056fd', '#00d4ff', '#ff6b6b'][Math.floor(Math.random() * 4)] : 
                    '#ffffff'
            });
        }
        
        // ★ Туманности (неподвижные пятна) ★
        const NEBULA_COUNT = 5;
        const nebulaColors = [
            'rgba(245, 175, 25, 0.05)',
            'rgba(224, 86, 253, 0.05)',
            'rgba(0, 212, 255, 0.04)',
            'rgba(255, 107, 107, 0.04)',
            'rgba(155, 89, 182, 0.05)'
        ];
        for (let i = 0; i < NEBULA_COUNT; i++) {
            nebulae.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 200 + Math.random() * 300,
                color: nebulaColors[i % nebulaColors.length],
                speedX: (Math.random() - 0.5) * 0.05,
                speedY: (Math.random() - 0.5) * 0.05
            });
        }
        
        // ★ Падающие звёзды ★
        function spawnShootingStar() {
            if (shootingStars.length > 2) return;
            if (Math.random() > 0.008) return; // редкие
            shootingStars.push({
                x: Math.random() * width,
                y: -20,
                vx: -3 - Math.random() * 3,
                vy: 4 + Math.random() * 3,
                life: 100,
                maxLife: 100,
                color: Math.random() > 0.5 ? '#ffffff' : '#f5af19'
            });
        }
        
        let lastTime = 0;
        function animate(time) {
            // ★ 60 FPS стабильно (у нас же fps-fix) ★
            requestAnimationFrame(animate);
            
            // Очистка
            ctx.clearRect(0, 0, width, height);
            
            // ★ Туманности ★
            for (let n of nebulae) {
                n.x += n.speedX;
                n.y += n.speedY;
                if (n.x < -n.radius) n.x = width + n.radius;
                if (n.x > width + n.radius) n.x = -n.radius;
                if (n.y < -n.radius) n.y = height + n.radius;
                if (n.y > height + n.radius) n.y = -n.radius;
                
                let grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
                grad.addColorStop(0, n.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // ★ Частицы ★
            for (let p of particles) {
                p.x += p.speedX;
                p.y += p.speedY;
                p.twinkle += p.twinkleSpeed;
                
                if (p.x < -5) p.x = width + 5;
                if (p.x > width + 5) p.x = -5;
                if (p.y < -5) p.y = height + 5;
                if (p.y > height + 5) p.y = -5;
                
                let alpha = 0.3 + Math.abs(Math.sin(p.twinkle)) * 0.6;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = p.size > 1.2 ? 8 : 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            
            // ★ Падающие звёзды ★
            spawnShootingStar();
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                let s = shootingStars[i];
                s.x += s.vx;
                s.y += s.vy;
                s.life--;
                
                let alpha = s.life / s.maxLife;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
                ctx.stroke();
                
                if (s.life <= 0 || s.x < -50 || s.y > height + 50) {
                    shootingStars.splice(i, 1);
                }
            }
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
        requestAnimationFrame(animate);
    }
    
    // ============================================================
    // ★★★ ЧАСТЬ 3: RIPPLE НА КНОПКАХ ★★★
    // ============================================================
    function addRippleToButtons() {
        document.addEventListener('click', function(e) {
            let btn = e.target.closest('.btn');
            if (!btn) return;
            
            let rect = btn.getBoundingClientRect();
            let size = Math.max(rect.width, rect.height);
            let x = e.clientX - rect.left - size / 2;
            let y = e.clientY - rect.top - size / 2;
            
            let ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%);
                pointer-events: none;
                transform: scale(0);
                animation: rippleAnim 0.6s ease-out;
                z-index: 1;
            `;
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
        
        // ★ Добавляем keyframes для ripple ★
        let rippleKf = document.createElement('style');
        rippleKf.textContent = `
            @keyframes rippleAnim {
                to { transform: scale(2.5); opacity: 0; }
            }
        `;
        document.head.appendChild(rippleKf);
    }
    
    // ============================================================
    // ★★★ ЧАСТЬ 4: ЗВУК ПРИ НАЖАТИИ НА КНОПКУ АТАКИ ★★★
    // ============================================================
    function enhanceClickArea() {
        // Просто добавляем лёгкую деформацию при клике
        document.addEventListener('mousedown', function(e) {
            let area = e.target.closest('.click-area');
            if (!area) return;
            area.style.transform = 'translateY(8px) scale(0.98)';
        });
        document.addEventListener('mouseup', function(e) {
            let area = e.target.closest('.click-area');
            if (!area) return;
            area.style.transform = '';
        });
    }
    
    // ============================================================
    // ★★★ ЧАСТЬ 5: ПЛАВНОЕ ПОЯВЛЕНИЕ КАРТОЧЕК ПРИ СМЕНЕ ТАБА ★★★
    // ============================================================
    function enhanceTabTransitions() {
        // Наблюдаем за сменой таба и перезапускаем анимацию карточек
        let observer = new MutationObserver(function(mutations) {
            for (let m of mutations) {
                if (m.target.classList && m.target.classList.contains('tab-content')) {
                    if (m.target.classList.contains('active')) {
                        // Перезапуск анимации карточек
                        let cards = m.target.querySelectorAll('.card-item');
                        cards.forEach((card, i) => {
                            card.style.animation = 'none';
                            setTimeout(() => {
                                card.style.animation = `cardAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards`;
                                card.style.animationDelay = (i * 0.02) + 's';
                            }, 10);
                        });
                    }
                }
            }
        });
        document.querySelectorAll('.tab-content').forEach(tab => {
            observer.observe(tab, { attributes: true, attributeFilter: ['class'] });
        });
    }
    
    // ============================================================
    // ★★★ ЧАСТЬ 6: ЛЁГКАЯ АНИМАЦИЯ ЗАГОЛОВКА МИРА ★★★
    // ============================================================
    function enhanceWorldIndicator() {
        // При смене мира — вспышка
        let worldEl = document.getElementById('worldIndicator');
        if (!worldEl) return;
        
        let lastText = worldEl.textContent;
        setInterval(() => {
            if (worldEl.textContent !== lastText) {
                lastText = worldEl.textContent;
                worldEl.style.transition = 'none';
                worldEl.style.transform = 'scale(1.05)';
                worldEl.style.boxShadow = '0 0 30px rgba(245,175,25,0.5)';
                setTimeout(() => {
                    worldEl.style.transition = 'all 0.5s ease';
                    worldEl.style.transform = 'scale(1)';
                    worldEl.style.boxShadow = '';
                }, 100);
            }
        }, 500);
    }
    
    // ============================================================
    // ★★★ ЗАПУСК ★★★
    // ============================================================
    function init() {
        try { createParticlesCanvas(); } catch(e) { console.warn('[VISUALS] Canvas error:', e); }
        try { addRippleToButtons(); } catch(e) { console.warn('[VISUALS] Ripple error:', e); }
        try { enhanceClickArea(); } catch(e) { console.warn('[VISUALS] ClickArea error:', e); }
        try { enhanceTabTransitions(); } catch(e) { console.warn('[VISUALS] Tabs error:', e); }
        try { enhanceWorldIndicator(); } catch(e) { console.warn('[VISUALS] World error:', e); }
        
        console.log("╔════════════════════════════════════════════════════╗");
        console.log("║  🎨 VISUALS v1.0 загружено                          ║");
        console.log("║  ✨ Космический фон с частицами                    ║");
        console.log("║  💫 Ripple на кнопках                              ║");
        console.log("║  🌟 Свечения по редкости                           ║");
        console.log("║  🎬 Плавные анимации                               ║");
        console.log("╚════════════════════════════════════════════════════╝");
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 100);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(init, 200);
        });
    }
    
})();
