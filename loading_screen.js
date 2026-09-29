// ============================================================
// LOADING SCREEN v2.0 — ФОНОВАЯ ЗАГРУЗКА МУЗЫКИ + КЭШ
// ============================================================
// ★ НОВОЕ:
// - Кнопка "Продолжить игру" (можно не ждать)
// - Музыка качается в ФОНЕ (не блокирует)
// - Cache API — треки сохраняются в браузерном кэше
// - Таймаут 20 сек на каждый трек
// ============================================================
// ПОДКЛЮЧАТЬ В index.html ВТОРЫМ (после fps-fix.js)
// ============================================================

(function() {
    'use strict';

    if (window._loadingScreenLoaded) return;
    window._loadingScreenLoaded = true;

    // ============================================================
    // ★ СПИСОК МУЗЫКИ ★
    // ============================================================
    const MUSIC_FILES = {
        "main":         "music/main.mp3",
        "battle":       "music/battle.mp3",
        "shop":         "music/shop.mp3",
        "waystar":      "music/Звезда.mp3",
        "qte":          "music/стендзи хер ай реалзайз.mp3",
        "rwb":          "music/Dark_Souls_-_Ornstein_Smough_66400273.mp3"
    };

    const CACHE_NAME = 'multiverse-music-v1';
    const MIN_SHOW_TIME = 1200;   // минимум показа экрана
    const FETCH_TIMEOUT = 20000;  // 20 секунд на трек

    // ★ Хранилище ★
    window.__loadedMusic = {};
    window.__musicLoaded = false;
    window.__musicLoadProgress = { loaded: 0, total: Object.keys(MUSIC_FILES).length };

    // ★ Публичный API ★
    window.getLoadedMusic = function(key) {
        return window.__loadedMusic[key] || null;
    };
    window.onMusicLoaded = function(cb) {
        if (window.__musicLoaded) { cb(); return; }
        window.__musicLoadedCallbacks = window.__musicLoadedCallbacks || [];
        window.__musicLoadedCallbacks.push(cb);
    };

    // ============================================================
    // ★ CSS ЭКРАНА ★
    // ============================================================
    const css = document.createElement('style');
    css.id = 'loadingScreenStyles';
    css.textContent = `
        #loadingScreen {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: linear-gradient(-45deg, #0a0a14, #150a25, #0a1525, #1a0a20);
            background-size: 400% 400%;
            animation: lsBgShift 15s ease infinite;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: 'Nunito', -apple-system, sans-serif;
            transition: opacity 0.5s ease;
        }
        #loadingScreen.hidden {
            opacity: 0;
            pointer-events: none;
        }
        @keyframes lsBgShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        #loadingLogo {
            font-size: 44px;
            font-weight: 900;
            background: linear-gradient(90deg, #fff 0%, #f5af19 50%, #fff 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: lsTitleShine 3s linear infinite;
            margin-bottom: 6px;
            letter-spacing: 2px;
            text-align: center;
            filter: drop-shadow(0 0 20px rgba(245,175,25,0.5));
        }
        @keyframes lsTitleShine {
            to { background-position: 200% center; }
        }

        #loadingSubtitle {
            font-size: 13px;
            color: #888;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-weight: 800;
            margin-bottom: 40px;
        }

        #loadingRingWrap {
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 25px;
        }
        #loadingRing {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 4px solid rgba(245, 175, 25, 0.15);
            border-top-color: #f5af19;
            border-right-color: #e056fd;
            animation: lsRingSpin 1.2s linear infinite;
            box-shadow: 0 0 25px rgba(245,175,25,0.3);
        }
        @keyframes lsRingSpin {
            to { transform: rotate(360deg); }
        }
        #loadingRingInner {
            position: absolute;
            top: 50%; left: 50%;
            width: 80px; height: 80px;
            margin: -40px 0 0 -40px;
            border-radius: 50%;
            border: 3px solid rgba(224, 86, 253, 0.15);
            border-bottom-color: #e056fd;
            animation: lsRingSpin 1.8s linear infinite reverse;
        }
        #loadingRingCenter {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 28px;
            animation: lsPulse 1.5s ease-in-out infinite;
        }
        @keyframes lsPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.15); }
        }

        #loadingBarWrap {
            width: 320px;
            max-width: 80vw;
            height: 12px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            margin-bottom: 15px;
        }
        #loadingBar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #f5af19, #e056fd, #00d4ff, #f5af19);
            background-size: 300% 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
            animation: lsBarGlow 3s linear infinite;
            box-shadow: 0 0 15px rgba(245, 175, 25, 0.6);
        }
        @keyframes lsBarGlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        #loadingStatus {
            font-size: 13px;
            color: #aaa;
            font-weight: 700;
            letter-spacing: 1px;
            min-height: 20px;
            text-align: center;
            padding: 0 20px;
        }

        /* ★★★ КНОПКА "ПРОДОЛЖИТЬ ИГРУ" ★★★ */
        #continueBtn {
            margin-top: 35px;
            padding: 14px 42px;
            font-family: 'Nunito', sans-serif;
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 1.5px;
            color: #1a1a2e;
            background: linear-gradient(135deg, #f5af19, #f12711);
            border: 3px solid #fff;
            border-radius: 40px;
            cursor: pointer;
            box-shadow: 0 6px 25px rgba(245, 175, 25, 0.6), inset 0 -3px 0 rgba(0,0,0,0.2);
            transition: all 0.2s;
            animation: continuePulse 2s ease-in-out infinite;
            position: relative;
            overflow: hidden;
        }
        #continueBtn:hover {
            transform: translateY(-2px) scale(1.03);
            box-shadow: 0 10px 30px rgba(245, 175, 25, 0.8);
        }
        #continueBtn:active {
            transform: translateY(0) scale(0.98);
        }
        @keyframes continuePulse {
            0%, 100% { box-shadow: 0 6px 25px rgba(245, 175, 25, 0.6), inset 0 -3px 0 rgba(0,0,0,0.2); }
            50% { box-shadow: 0 6px 35px rgba(245, 175, 25, 1), inset 0 -3px 0 rgba(0,0,0,0.2); }
        }

        #continueHint {
            margin-top: 12px;
            font-size: 11px;
            color: #666;
            font-weight: 600;
        }

        /* ★ Индикатор фоновой загрузки (в правом верхнем углу) ★ */
        #bgLoadingIndicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #f5af19;
            border-radius: 30px;
            padding: 8px 14px;
            font-family: 'Nunito', sans-serif;
            font-size: 12px;
            font-weight: 900;
            color: #f5af19;
            z-index: 99998;
            display: none;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 20px rgba(245, 175, 25, 0.4);
            pointer-events: none;
        }
        #bgLoadingIndicator.show {
            display: flex;
        }
        #bgLoadingDot {
            width: 8px;
            height: 8px;
            background: #f5af19;
            border-radius: 50%;
            animation: bgDotPulse 1s ease-in-out infinite;
        }
        @keyframes bgDotPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.7); }
        }
        #bgLoadingText {
            color: #fff;
            font-weight: 700;
        }
    `;
    document.head.appendChild(css);

    // ============================================================
    // ★ СОЗДАНИЕ ЭКРАНА ★
    // ============================================================
    function createLoadingScreen() {
        if (document.getElementById('loadingScreen')) return;

        const div = document.createElement('div');
        div.id = 'loadingScreen';
        div.innerHTML = `
            <div id="loadingLogo">MULTIVERSE STAPLE</div>
            <div id="loadingSubtitle">BETA</div>
            <div id="loadingRingWrap">
                <div id="loadingRing"></div>
                <div id="loadingRingInner"></div>
                <div id="loadingRingCenter">🎵</div>
            </div>
            <div id="loadingBarWrap">
                <div id="loadingBar"></div>
            </div>
            <div id="loadingStatus">Загрузка музыки в фоне...</div>
            <button id="continueBtn">▶ ПРОДОЛЖИТЬ ИГРУ</button>
            <div id="continueHint">Музыка докачается в фоне (сохранится в кэш браузера)</div>
        `;

        if (document.body) {
            document.body.insertBefore(div, document.body.firstChild);
        } else {
            document.documentElement.appendChild(div);
        }

        // ★ Кнопка "Продолжить игру" ★
        const btn = document.getElementById('continueBtn');
        if (btn) {
            btn.addEventListener('click', function() {
                console.log("[LOADING] Игрок нажал 'Продолжить игру'");
                skipLoadingScreen();
            });
        }

        // ★ Создаём индикатор фоновой загрузки (изначально скрыт) ★
        if (!document.getElementById('bgLoadingIndicator')) {
            const ind = document.createElement('div');
            ind.id = 'bgLoadingIndicator';
            ind.innerHTML = `
                <div id="bgLoadingDot"></div>
                <div id="bgLoadingText">Загрузка музыки: 0/6</div>
            `;
            if (document.body) {
                document.body.appendChild(ind);
            } else {
                document.documentElement.appendChild(ind);
            }
        }
    }

    // ============================================================
    // ★ ОБНОВЛЕНИЕ UI ★
    // ============================================================
    function updateProgress(loaded, total) {
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
        const bar = document.getElementById('loadingBar');
        if (bar) bar.style.width = percent + '%';

        const bgText = document.getElementById('bgLoadingText');
        if (bgText) bgText.textContent = "Загрузка музыки: " + loaded + "/" + total;
    }

    function setStatus(text) {
        const el = document.getElementById('loadingStatus');
        if (el) el.textContent = text;
    }

    function showBgIndicator() {
        const ind = document.getElementById('bgLoadingIndicator');
        if (ind) ind.classList.add('show');
    }

    function hideBgIndicator() {
        const ind = document.getElementById('bgLoadingIndicator');
        if (ind) ind.classList.remove('show');
    }

    // ============================================================
    // ★ ПРОВЕРКА: есть ли трек в Cache API ★
    // ============================================================
    async function getFromCache(path) {
        if (!('caches' in window)) return null;
        try {
            const cache = await caches.open(CACHE_NAME);
            const response = await cache.match(path);
            if (response) {
                let blob = await response.blob();
                return blob;
            }
        } catch(e) {
            console.warn("[LOADING] cache error:", e);
        }
        return null;
    }

    // ============================================================
    // ★ СОХРАНЕНИЕ В Cache API ★
    // ============================================================
    async function saveToCache(path, blob) {
        if (!('caches' in window)) return;
        try {
            const cache = await caches.open(CACHE_NAME);
            // Создаём Response с blob и сохраняем
            const response = new Response(blob, {
                headers: { 'Content-Type': 'audio/mpeg' }
            });
            await cache.put(path, response);
            console.log("[LOADING] 💾 В кэш: " + path);
        } catch(e) {
            console.warn("[LOADING] cache save error:", e);
        }
    }

    // ============================================================
    // ★ ЗАГРУЗКА ОДНОГО ФАЙЛА (с таймаутом + кэш) ★
    // ============================================================
    function loadOneMusic(key, path) {
        return new Promise(async function(resolve) {
            // ★ 1. Проверяем кэш ★
            let blob = await getFromCache(path);
            
            if (blob) {
                console.log("[LOADING] ✅ Из кэша: " + key + " (" + path + ")");
                window.__loadedMusic[key] = {
                    blob: blob,
                    url: URL.createObjectURL(blob),
                    path: path,
                    size: blob.size,
                    fromCache: true
                };
                resolve({ key: key, success: true, fromCache: true, size: blob.size });
                return;
            }

            // ★ 2. Качаем из сети с таймаутом ★
            let controller = new AbortController();
            let timeoutId = setTimeout(function() {
                controller.abort();
                console.warn("[LOADING] ⏰ Таймаут: " + key + " (" + path + ")");
            }, FETCH_TIMEOUT);

            fetch(path, { cache: 'force-cache', signal: controller.signal })
                .then(function(response) {
                    if (!response.ok) throw new Error("HTTP " + response.status);
                    return response.blob();
                })
                .then(async function(blob) {
                    clearTimeout(timeoutId);
                    
                    window.__loadedMusic[key] = {
                        blob: blob,
                        url: URL.createObjectURL(blob),
                        path: path,
                        size: blob.size,
                        fromCache: false
                    };
                    console.log("[LOADING] ✅ " + key + " (" + Math.round(blob.size / 1024) + " КБ)");
                    
                    // ★ Сохраняем в Cache API ★
                    saveToCache(path, blob);
                    
                    resolve({ key: key, success: true, fromCache: false, size: blob.size });
                })
                .catch(function(err) {
                    clearTimeout(timeoutId);
                    console.warn("[LOADING] ❌ " + key + " — " + err.message);
                    window.__loadedMusic[key] = null;
                    resolve({ key: key, success: false, error: err.message });
                });
        });
    }

    // ============================================================
    // ★ ГЛАВНАЯ ФУНКЦИЯ — ФОНОВАЯ ЗАГРУЗКА ★
    // ============================================================
    let startTime = 0;
    let bgLoadCompleted = false;

    async function loadAllMusicBackground() {
        const keys = Object.keys(MUSIC_FILES);
        const total = keys.length;
        let loaded = 0;
        let successCount = 0;
        let fromCacheCount = 0;

        // ★ Проверяем кэш ПЕРВЫМ (быстрая проверка) ★
        setStatus("Проверка кэша музыки...");

        // ★ Запускаем все загрузки ПАРАЛЛЕЛЬНО (быстрее) ★
        const promises = keys.map(function(key) {
            return loadOneMusic(key, MUSIC_FILES[key]).then(function(result) {
                loaded++;
                if (result.success) {
                    successCount++;
                    if (result.fromCache) fromCacheCount++;
                }
                updateProgress(loaded, total);
                return result;
            });
        });

        // ★ Ждём ВСЕ, но каждые 500мс обновляем статус ★
        let statusInterval = setInterval(function() {
            setStatus("Загрузка музыки в фоне: " + loaded + "/" + total);
        }, 500);

        await Promise.all(promises);
        clearInterval(statusInterval);

        // ★ Финальный статус ★
        setStatus("✅ Музыка готова! (" + successCount + "/" + total + (fromCacheCount > 0 ? ", из кэша: " + fromCacheCount : "") + ")");

        window.__musicLoaded = true;
        bgLoadCompleted = true;

        // ★ Вызываем колбэки ★
        if (window.__musicLoadedCallbacks && window.__musicLoadedCallbacks.length > 0) {
            for (let cb of window.__musicLoadedCallbacks) {
                try { cb(); } catch(e) { console.error("[LOADING] callback error:", e); }
            }
            window.__musicLoadedCallbacks = [];
        }

        // ★ Скрываем индикатор фоновой загрузки ★
        setTimeout(hideBgIndicator, 1500);

        // ★ Если экран загрузки ещё открыт — скрываем его ★
        const screen = document.getElementById('loadingScreen');
        if (screen && !screen.classList.contains('hidden')) {
            const elapsed = performance.now() - startTime;
            const waitTime = Math.max(0, MIN_SHOW_TIME - elapsed);
            setTimeout(hideLoadingScreen, waitTime);
        }

        console.log("[LOADING] Все треки загружены! Из кэша: " + fromCacheCount + "/" + total);
    }

    // ============================================================
    // ★ СКРЫТИЕ ЭКРАНА (с фоновой загрузкой) ★
    // ============================================================
    function skipLoadingScreen() {
        // Скрываем экран
        const screen = document.getElementById('loadingScreen');
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(function() {
                if (screen.parentNode) screen.parentNode.removeChild(screen);
            }, 500);
        }
        
        // ★ Показываем индикатор фоновой загрузки (если ещё грузится) ★
        if (!bgLoadCompleted) {
            showBgIndicator();
        }
        
        // ★ Показываем слоты / игру (эмулируем как будто загрузка завершена) ★
        console.log("[LOADING] Экран пропущен, музыка докачивается в фоне");
    }

    function hideLoadingScreen() {
        const el = document.getElementById('loadingScreen');
        if (!el) return;
        el.classList.add('hidden');
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
            console.log("[LOADING] Экран загрузки скрыт");
        }, 500);
    }

    // ============================================================
    // ★ ПАТЧ Audio() — используем кэш ★
    // ============================================================
    function patchAudioConstructor() {
        const OriginalAudio = window.Audio;

        window.Audio = function(src) {
            if (typeof src === 'string') {
                // Ищем по точному пути
                if (window.__loadedMusic) {
                    for (let key in window.__loadedMusic) {
                        let entry = window.__loadedMusic[key];
                        if (entry && entry.path === src) {
                            return new OriginalAudio(entry.url);
                        }
                    }
                }
                // Ищем по имени файла
                let srcFile = src.split('/').pop();
                for (let key in window.__loadedMusic) {
                    let entry = window.__loadedMusic[key];
                    if (entry && entry.path) {
                        let entryFile = entry.path.split('/').pop();
                        if (entryFile === srcFile) {
                            return new OriginalAudio(entry.url);
                        }
                    }
                }
            }
            return new OriginalAudio(src);
        };

        window.Audio.prototype = OriginalAudio.prototype;
        window.Audio.constructor = window.Audio;
        console.log("[LOADING] ✅ Audio() пропатчен");
    }

    // ============================================================
    // ★ ПАТЧ fetch() — используем кэш ★
    // ============================================================
    function patchFetch() {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && window.__loadedMusic) {
                // Точный путь
                for (let key in window.__loadedMusic) {
                    let entry = window.__loadedMusic[key];
                    if (entry && entry.path === url) {
                        return Promise.resolve(new Response(entry.blob, {
                            status: 200,
                            headers: { 'Content-Type': 'audio/mpeg' }
                        }));
                    }
                }
                // По имени файла
                let urlFile = url.split('/').pop();
                for (let key in window.__loadedMusic) {
                    let entry = window.__loadedMusic[key];
                    if (entry && entry.path) {
                        let entryFile = entry.path.split('/').pop();
                        if (entryFile === urlFile) {
                            return Promise.resolve(new Response(entry.blob, {
                                status: 200,
                                headers: { 'Content-Type': 'audio/mpeg' }
                            }));
                        }
                    }
                }
            }
            return originalFetch.apply(this, arguments);
        };
        console.log("[LOADING] ✅ fetch() пропатчен");
    }

    // ============================================================
    // ★ ИНИЦИАЛИЗАЦИЯ ★
    // ============================================================
    function init() {
        startTime = performance.now();

        if (document.body) {
            createLoadingScreen();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                createLoadingScreen();
            });
        }

        patchAudioConstructor();
        patchFetch();

        // ★ Запускаем фоновую загрузку через 200мс ★
        // (даём экрану отрисоваться)
        setTimeout(function() {
            loadAllMusicBackground().catch(function(err) {
                console.error("[LOADING] Критическая ошибка:", err);
                setStatus("⚠️ Ошибка, играем без музыки");
                window.__musicLoaded = true;
                setTimeout(hideLoadingScreen, 1500);
            });
        }, 200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ★ Экспорт для отладки ★
    window.loadingScreen = {
        MUSIC_FILES: MUSIC_FILES,
        reload: function() {
            window.__loadedMusic = {};
            window.__musicLoaded = false;
            loadAllMusicBackground();
        },
        clearCache: async function() {
            if ('caches' in window) {
                try {
                    await caches.delete(CACHE_NAME);
                    console.log("[LOADING] Кэш очищен");
                } catch(e) {}
            }
        },
        getLoadedList: function() {
            let list = [];
            for (let key in MUSIC_FILES) {
                let e = window.__loadedMusic[key];
                if (e) list.push({ key: key, path: e.path, size: e.size, fromCache: e.fromCache });
                else list.push({ key: key, path: MUSIC_FILES[key], missing: true });
            }
            return list;
        }
    };

    console.log("╔════════════════════════════════════════════════╗");
    console.log("║  🎵 LOADING SCREEN v2.0                        ║");
    console.log("║  ✅ Фоновая загрузка музыки                    ║");
    console.log("║  ✅ Кнопка 'Продолжить игру'                   ║");
    console.log("║  ✅ Cache API — переживает F5                  ║");
    console.log("║  ⏰ Таймаут: " + (FETCH_TIMEOUT/1000) + " сек/трек              ║");
    console.log("╚════════════════════════════════════════════════╝");

})();
