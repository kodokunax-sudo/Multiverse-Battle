// ============================================================
// LOADING SCREEN v3.0 — ПРОСТАЯ И НАДЁЖНАЯ ЗАГРУЗКА МУЗЫКИ
// ============================================================
// ★ v3.0:
// - Экран НЕ исчезает сам (только по кнопке или после загрузки)
// - XMLHttpRequest (работает на file://)
// - Показывает ошибки явно
// - Cache API + IndexedDB fallback
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

    const FETCH_TIMEOUT = 30000; // 30 секунд на трек

    window.__loadedMusic = {};
    window.__musicLoaded = false;
    window.__musicLoadFailed = {};
    window.__musicLoadProgress = { loaded: 0, total: Object.keys(MUSIC_FILES).length, failed: 0 };

    window.getLoadedMusic = function(key) {
        return window.__loadedMusic[key] || null;
    };
    window.onMusicLoaded = function(cb) {
        if (window.__musicLoaded) { cb(); return; }
        window.__musicLoadedCallbacks = window.__musicLoadedCallbacks || [];
        window.__musicLoadedCallbacks.push(cb);
    };

    // ============================================================
    // ★ CSS ★
    // ============================================================
    const css = document.createElement('style');
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
            font-family: 'Nunito', sans-serif;
            transition: opacity 0.5s ease;
            padding: 20px;
            box-sizing: border-box;
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
            font-size: 40px;
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
        }
        @keyframes lsTitleShine {
            to { background-position: 200% center; }
        }
        #loadingSubtitle {
            font-size: 12px;
            color: #888;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-weight: 800;
            margin-bottom: 30px;
        }
        #loadingRingWrap {
            position: relative;
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
        }
        #loadingRing {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 4px solid rgba(245, 175, 25, 0.15);
            border-top-color: #f5af19;
            border-right-color: #e056fd;
            animation: lsRingSpin 1.2s linear infinite;
        }
        @keyframes lsRingSpin { to { transform: rotate(360deg); } }
        #loadingRingCenter {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 26px;
        }
        #loadingBarWrap {
            width: 320px;
            max-width: 90vw;
            height: 14px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            margin-bottom: 12px;
            position: relative;
        }
        #loadingBar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #f5af19, #f12711);
            border-radius: 10px;
            transition: width 0.3s ease;
            box-shadow: 0 0 15px rgba(245, 175, 25, 0.6);
        }
        #loadingPercent {
            font-size: 20px;
            color: #f5af19;
            font-weight: 900;
            margin-bottom: 8px;
            text-shadow: 0 0 12px rgba(245,175,25,0.6);
        }
        #loadingStatus {
            font-size: 12px;
            color: #aaa;
            font-weight: 700;
            min-height: 18px;
            text-align: center;
            margin-bottom: 20px;
            padding: 0 20px;
            max-width: 90vw;
            word-break: break-word;
        }
        #loadingLog {
            font-size: 10px;
            color: #666;
            font-family: monospace;
            max-width: 90vw;
            max-height: 100px;
            overflow-y: auto;
            text-align: center;
            margin-bottom: 15px;
            padding: 8px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            min-width: 320px;
            display: none;
        }
        #loadingLog.show { display: block; }
        #loadingLog .ok { color: #2ecc71; }
        #loadingLog .err { color: #e74c3c; }
        
        #continueBtn {
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
            box-shadow: 0 6px 25px rgba(245, 175, 25, 0.6);
            transition: all 0.2s;
            animation: continuePulse 2s ease-in-out infinite;
        }
        #continueBtn:hover { transform: translateY(-2px) scale(1.03); }
        #continueBtn:active { transform: scale(0.98); }
        @keyframes continuePulse {
            0%, 100% { box-shadow: 0 6px 25px rgba(245, 175, 25, 0.6); }
            50% { box-shadow: 0 6px 35px rgba(245, 175, 25, 1); }
        }
        
        #skipMusicBtn {
            margin-top: 12px;
            padding: 8px 20px;
            font-family: 'Nunito', sans-serif;
            font-size: 12px;
            font-weight: 700;
            color: #aaa;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        #skipMusicBtn:hover {
            color: #fff;
            background: rgba(255,255,255,0.15);
        }
        
        #loadingHint {
            margin-top: 15px;
            font-size: 11px;
            color: #555;
            font-weight: 600;
            text-align: center;
            max-width: 90vw;
        }
        
        /* Индикатор в углу */
        #bgLoadingIndicator {
            position: fixed;
            top: 10px; right: 10px;
            background: rgba(0,0,0,0.85);
            border: 2px solid #f5af19;
            border-radius: 30px;
            padding: 6px 12px;
            font-family: 'Nunito', sans-serif;
            font-size: 11px;
            font-weight: 900;
            color: #f5af19;
            z-index: 99998;
            display: none;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 15px rgba(245,175,25,0.4);
        }
        #bgLoadingIndicator.show { display: flex; }
        #bgLoadingDot {
            width: 7px; height: 7px;
            background: #f5af19;
            border-radius: 50%;
            animation: bgDotPulse 1s ease-in-out infinite;
        }
        @keyframes bgDotPulse {
            0%,100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.7); }
        }
    `;
    document.head.appendChild(css);

    // ============================================================
    // ★ СОЗДАНИЕ ЭКРАНА ★
    // ============================================================
    let screenElement = null;
    let logElement = null;

    function createScreen() {
        if (document.getElementById('loadingScreen')) return;

        screenElement = document.createElement('div');
        screenElement.id = 'loadingScreen';
        screenElement.innerHTML = `
            <div id="loadingLogo">MULTIVERSE BATTLE</div>
            <div id="loadingSubtitle">BETA</div>
            <div id="loadingRingWrap">
                <div id="loadingRing"></div>
                <div id="loadingRingCenter">🎵</div>
            </div>
            <div id="loadingBarWrap">
                <div id="loadingBar"></div>
            </div>
            <div id="loadingPercent">0%</div>
            <div id="loadingStatus">Проверка музыки...</div>
            <div id="loadingLog"></div>
            <button id="continueBtn">▶ ПРОДОЛЖИТЬ ИГРУ</button>
            <button id="skipMusicBtn">Пропустить загрузку музыки</button>
            <div id="loadingHint">💡 Кнопка "Продолжить" работает всегда — музыка докачается в фоне</div>
        `;

        if (document.body) document.body.insertBefore(screenElement, document.body.firstChild);
        else document.documentElement.appendChild(screenElement);

        logElement = document.getElementById('loadingLog');

        document.getElementById('continueBtn').addEventListener('click', function() {
            console.log("[LOADING] Игрок нажал 'Продолжить'");
            hideScreen();
        });
        document.getElementById('skipMusicBtn').addEventListener('click', function() {
            console.log("[LOADING] Игрок пропустил загрузку музыки");
            window.__musicSkipped = true;
            hideScreen();
        });

        // Индикатор в углу
        if (!document.getElementById('bgLoadingIndicator')) {
            const ind = document.createElement('div');
            ind.id = 'bgLoadingIndicator';
            ind.innerHTML = `<div id="bgLoadingDot"></div><div id="bgLoadingText">Загрузка музыки...</div>`;
            if (document.body) document.body.appendChild(ind);
        }
    }

    function addLog(msg, type) {
        if (!logElement) return;
        logElement.classList.add('show');
        let line = document.createElement('div');
        line.className = type || '';
        line.textContent = msg;
        logElement.appendChild(line);
        logElement.scrollTop = logElement.scrollHeight;
        console.log("[LOADING] " + msg);
    }

    function setProgress(loaded, total) {
        let percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
        let bar = document.getElementById('loadingBar');
        let pct = document.getElementById('loadingPercent');
        if (bar) bar.style.width = percent + '%';
        if (pct) pct.textContent = percent + '%';
    }

    function setStatus(text) {
        let el = document.getElementById('loadingStatus');
        if (el) el.textContent = text;
    }

    // ============================================================
    // ★ ЗАГРУЗКА ЧЕРЕЗ XMLHttpRequest (надёжно, работает на file://) ★
    // ============================================================
    function loadViaXHR(path, onProgress) {
        return new Promise(function(resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', path, true);
            xhr.responseType = 'blob';
            xhr.timeout = FETCH_TIMEOUT;

            xhr.onload = function() {
                if (xhr.status === 200 || xhr.status === 0) { // 0 для file://
                    let blob = xhr.response;
                    if (blob && blob.size > 0) {
                        resolve(blob);
                    } else {
                        reject(new Error("Пустой файл"));
                    }
                } else {
                    reject(new Error("HTTP " + xhr.status));
                }
            };
            xhr.onerror = function() {
                reject(new Error("Ошибка сети (возможно CORS/file://)"));
            };
            xhr.ontimeout = function() {
                reject(new Error("Таймаут " + (FETCH_TIMEOUT/1000) + "с"));
            };
            xhr.onprogress = function(e) {
                if (onProgress && e.lengthComputable) {
                    onProgress(e.loaded, e.total);
                }
            };

            xhr.send();
        });
    }

    // ============================================================
    // ★ ПРОВЕРКА КЭША (Cache API) ★
    // ============================================================
    const CACHE_NAME = 'mv-music-v1';

    async function getFromCache(path) {
        if (!('caches' in window)) return null;
        try {
            let cache = await caches.open(CACHE_NAME);
            let response = await cache.match(path);
            if (response) {
                let blob = await response.blob();
                if (blob && blob.size > 0) return blob;
            }
        } catch(e) {}
        return null;
    }

    async function saveToCache(path, blob) {
        if (!('caches' in window)) return;
        try {
            let cache = await caches.open(CACHE_NAME);
            let response = new Response(blob, {
                headers: { 'Content-Type': 'audio/mpeg' }
            });
            await cache.put(path, response);
        } catch(e) {}
    }

    // ============================================================
    // ★ ЗАГРУЗКА ОДНОГО ТРЕКА ★
    // ============================================================
    async function loadOneTrack(key, path) {
        // 1. Проверка кэша
        let cachedBlob = await getFromCache(path);
        if (cachedBlob) {
            window.__loadedMusic[key] = {
                blob: cachedBlob,
                url: URL.createObjectURL(cachedBlob),
                path: path,
                size: cachedBlob.size,
                fromCache: true
            };
            addLog("✅ " + key + " (из кэша, " + Math.round(cachedBlob.size/1024) + " КБ)", "ok");
            return { key, success: true, fromCache: true };
        }

        // 2. Загрузка из сети
        try {
            let blob = await loadViaXHR(path, function(loaded, total) {
                if (total > 0) {
                    let pct = Math.round((loaded / total) * 100);
                    setStatus("Скачивание " + key + ": " + pct + "%");
                }
            });

            window.__loadedMusic[key] = {
                blob: blob,
                url: URL.createObjectURL(blob),
                path: path,
                size: blob.size,
                fromCache: false
            };

            addLog("✅ " + key + " (" + Math.round(blob.size/1024) + " КБ)", "ok");
            saveToCache(path, blob);
            return { key, success: true, fromCache: false };
        } catch(e) {
            addLog("❌ " + key + " — " + e.message, "err");
            window.__musicLoadFailed[key] = e.message;
            return { key, success: false, error: e.message };
        }
    }

    // ============================================================
    // ★ ГЛАВНАЯ ФУНКЦИЯ ★
    // ============================================================
    async function loadAllMusic() {
        let keys = Object.keys(MUSIC_FILES);
        let total = keys.length;
        let loaded = 0;
        let success = 0;
        let failed = 0;
        let fromCache = 0;

        addLog("Начинаю загрузку " + total + " треков...");

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let path = MUSIC_FILES[key];
            
            setStatus("Загрузка: " + path.split('/').pop() + " (" + (i+1) + "/" + total + ")");
            
            let result = await loadOneTrack(key, path);
            
            if (result.success) {
                success++;
                if (result.fromCache) fromCache++;
            } else {
                failed++;
            }
            loaded++;
            setProgress(loaded, total);
            window.__musicLoadProgress.loaded = loaded;
            window.__musicLoadProgress.failed = failed;
        }

        // Финальный статус
        if (failed === 0) {
            setStatus("✅ Все " + success + " треков загружены!" + (fromCache > 0 ? " (из кэша: " + fromCache + ")" : ""));
        } else if (success > 0) {
            setStatus("⚠️ Загружено " + success + "/" + total + ", ошибок: " + failed);
        } else {
            setStatus("❌ Не удалось загрузить музыку. Играем без звука.");
        }

        window.__musicLoaded = true;

        // Вызываем колбэки
        if (window.__musicLoadedCallbacks) {
            for (let cb of window.__musicLoadedCallbacks) {
                try { cb(); } catch(e) {}
            }
            window.__musicLoadedCallbacks = [];
        }

        // ★ АВТО-СКРЫТИЕ ТОЛЬКО ЕСЛИ ЗАГРУЗКА УСПЕШНА ★
        if (failed === 0 || success > 0) {
            setTimeout(function() {
                // Скрываем только если игрок не нажал кнопку
                if (!window.__musicSkipped && document.getElementById('loadingScreen')) {
                    addLog("Все треки загружены — скрываю экран через 2 сек...");
                    setTimeout(hideScreen, 2000);
                }
            }, 500);
        } else {
            // Если всё упало — оставляем экран, показываем кнопку
            setStatus("❌ Музыка не загрузилась. Нажми 'Продолжить' для игры без звука.");
        }
    }

    // ============================================================
    // ★ СКРЫТИЕ ЭКРАНА ★
    // ============================================================
    function hideScreen() {
        let screen = document.getElementById('loadingScreen');
        if (!screen) return;
        screen.classList.add('hidden');
        setTimeout(function() {
            if (screen.parentNode) screen.parentNode.removeChild(screen);
        }, 500);

        // Показать индикатор фоновой загрузки если ещё грузится
        if (!window.__musicLoaded) {
            let ind = document.getElementById('bgLoadingIndicator');
            if (ind) ind.classList.add('show');
        }
    }

    // ============================================================
    // ★ ПАТЧ Audio() ★
    // ============================================================
    function patchAudio() {
        const OriginalAudio = window.Audio;
        window.Audio = function(src) {
            if (typeof src === 'string' && window.__loadedMusic) {
                // Точный путь
                for (let key in window.__loadedMusic) {
                    let entry = window.__loadedMusic[key];
                    if (entry && entry.path === src && entry.url) {
                        return new OriginalAudio(entry.url);
                    }
                }
                // По имени файла
                let srcFile = src.split('/').pop();
                for (let key in window.__loadedMusic) {
                    let entry = window.__loadedMusic[key];
                    if (entry && entry.path && entry.url) {
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
        addLog("🔧 Audio() пропатчен", "ok");
    }

    function patchFetch() {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && window.__loadedMusic) {
                for (let key in window.__loadedMusic) {
                    let entry = window.__loadedMusic[key];
                    if (entry && entry.blob && (entry.path === url || entry.path.split('/').pop() === url.split('/').pop())) {
                        return Promise.resolve(new Response(entry.blob, {
                            status: 200,
                            headers: { 'Content-Type': 'audio/mpeg' }
                        }));
                    }
                }
            }
            return originalFetch.apply(this, arguments);
        };
        addLog("🔧 fetch() пропатчен", "ok");
    }

    // ============================================================
    // ★ ИНИЦИАЛИЗАЦИЯ ★
    // ============================================================
    function init() {
        if (document.body) {
            createScreen();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                createScreen();
            });
        }

        patchAudio();
        patchFetch();

        // Проверка Cache API
        if (!('caches' in window)) {
            addLog("⚠️ Cache API недоступен (file:// или старый браузер)", "err");
            addLog("Кэш работать не будет, но музыка загрузится", "err");
        } else {
            addLog("✅ Cache API доступен", "ok");
        }

        setTimeout(function() {
            loadAllMusic().catch(function(err) {
                console.error("[LOADING] Критическая ошибка:", err);
                addLog("💥 Критическая ошибка: " + err.message, "err");
                setStatus("Ошибка загрузки. Нажми 'Продолжить' для игры.");
            });
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Экспорт
    window.loadingScreen = {
        MUSIC_FILES: MUSIC_FILES,
        reload: function() {
            window.__loadedMusic = {};
            window.__musicLoaded = false;
            loadAllMusic();
        },
        clearCache: async function() {
            if ('caches' in window) {
                try {
                    await caches.delete(CACHE_NAME);
                    addLog("🗑️ Кэш очищен", "ok");
                } catch(e) {}
            }
        },
        getLoadedList: function() {
            let list = [];
            for (let key in MUSIC_FILES) {
                let e = window.__loadedMusic[key];
                if (e) list.push({ key, path: e.path, size: e.size, fromCache: e.fromCache });
                else list.push({ key, path: MUSIC_FILES[key], missing: true, error: window.__musicLoadFailed[key] });
            }
            return list;
        }
    };

    // ============================================================
// ★★★ ЭКСПОРТ ДЛЯ JOYSTICK.JS ★★★
// ============================================================
window.getLivingStoneActive = function() { return livingStoneActive; };
window.getLivingStoneState  = function() { return livingStoneState; };
    
    console.log("╔════════════════════════════════════════╗");
    console.log("║  🎵 LOADING SCREEN v3.0                ║");
    console.log("║  ✅ XMLHttpRequest (надёжно)           ║");
    console.log("║  ✅ Экран НЕ исчезает сам              ║");
    console.log("║  ✅ Логи загрузки видны                ║");
    console.log("╚════════════════════════════════════════╝");

})();
