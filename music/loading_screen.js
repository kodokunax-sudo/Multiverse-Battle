// ============================================================
// LOADING SCREEN v1.0 — ПРЕДЗАГРУЗКА МУЗЫКИ
// ============================================================
// Показывает красивый экран загрузки, качает все mp3 в Blob,
// даёт игре готовые URL. Больше никаких задержек и заиканий.
//
// ПОДКЛЮЧАТЬ В index.html ПЕРВЫМ, ДО ВСЕХ ОСТАЛЬНЫХ СКРИПТОВ
// (или после fps-fix.js, но до data.js / game.js)
// ============================================================

(function() {
    'use strict';

    if (window._loadingScreenLoaded) return;
    window._loadingScreenLoaded = true;

    // ============================================================
    // ★ СПИСОК ВСЕЙ МУЗЫКИ ДЛЯ ЗАГРУЗКИ ★
    // ============================================================
    // Если добавляешь новый трек — просто дописывай в этот список.
    // Ключ — то, как ты будешь обращаться к треку из кода (window.getLoadedMusic('ключ'))
    // Значение — путь к файлу.
    const MUSIC_FILES = {
        "main":         "music/main.mp3",
        "battle":       "music/battle.mp3",
        "shop":         "music/shop.mp3",
        "waystar":      "music/Звезда.mp3",
        "qte":          "music/стендзи хер ай реалзайз.mp3",
        "rwb":          "music/Dark_Souls_-_Ornstein_Smough_66400273.mp3",

        // ★ DIO OVER HEAVEN — грузим заранее, чтобы ZA WARUDO не ждал сеть.
        "dioTimeStop": "music/za-warudo-time-stop-louder.mp3",
        "dioTeleport": "music/dios-time-stop-teleportation-sound-effect-1.mp3"
    };

    // ★ Минимальное время показа (чтобы экран не мигал, даже если всё быстро)
    const MIN_SHOW_TIME = 1500; // мс

    // ★ Хранилище загруженных Blob URL
    window.__loadedMusic = {};
    window.__musicLoaded = false;

    // ★ Публичный API: получить Blob URL по ключу
    window.getLoadedMusic = function(key) {
        return window.__loadedMusic[key] || null;
    };

    // ★ Публичный API: подождать загрузки (для других скриптов)
    window.onMusicLoaded = function(callback) {
        if (window.__musicLoaded) {
            callback();
            return;
        }
        window.__musicLoadedCallbacks = window.__musicLoadedCallbacks || [];
        window.__musicLoadedCallbacks.push(callback);
    };

    // ============================================================
    // ★ CSS ЭКРАНА ЗАГРУЗКИ ★
    // ============================================================
    const loadingCSS = document.createElement('style');
    loadingCSS.id = 'loadingScreenStyles';
    loadingCSS.textContent = `
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
            overflow: hidden;
            transition: opacity 0.6s ease;
        }
        #loadingScreen.hidden {
            opacity: 0;
            pointer-events: none;
        }
        @keyframes lsBgShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        /* ★ Летающие звёзды на фоне ★ */
        #loadingScreen::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
                radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.7), transparent),
                radial-gradient(2px 2px at 60% 70%, rgba(245,175,25,0.7), transparent),
                radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.5), transparent),
                radial-gradient(2px 2px at 80% 10%, rgba(224,86,253,0.7), transparent),
                radial-gradient(1px 1px at 90% 60%, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 33% 80%, rgba(0,212,255,0.6), transparent),
                radial-gradient(2px 2px at 15% 65%, rgba(255,255,255,0.5), transparent);
            background-size: 200% 200%;
            animation: lsStarsDrift 60s linear infinite;
            pointer-events: none;
        }
        @keyframes lsStarsDrift {
            from { background-position: 0 0; }
            to { background-position: 100% 100%; }
        }

        /* ★ Логотип ★ */
        #loadingLogo {
            font-size: 48px;
            font-weight: 900;
            background: linear-gradient(90deg, #fff 0%, #f5af19 50%, #fff 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: lsTitleShine 3s linear infinite;
            margin-bottom: 10px;
            letter-spacing: 2px;
            text-align: center;
            filter: drop-shadow(0 0 25px rgba(245,175,25,0.5));
            position: relative;
            z-index: 2;
        }
        @keyframes lsTitleShine {
            to { background-position: 200% center; }
        }

        #loadingSubtitle {
            font-size: 14px;
            color: #888;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-weight: 800;
            margin-bottom: 50px;
            position: relative;
            z-index: 2;
        }

        /* ★ Крутящееся кольцо ★ */
        #loadingRingWrap {
            position: relative;
            width: 140px;
            height: 140px;
            margin-bottom: 30px;
            z-index: 2;
        }
        #loadingRing {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 4px solid rgba(245, 175, 25, 0.15);
            border-top-color: #f5af19;
            border-right-color: #e056fd;
            animation: lsRingSpin 1.2s linear infinite;
            box-shadow: 0 0 30px rgba(245,175,25,0.3), inset 0 0 20px rgba(245,175,25,0.1);
        }
        @keyframes lsRingSpin {
            to { transform: rotate(360deg); }
        }
        #loadingRingInner {
            position: absolute;
            top: 50%; left: 50%;
            width: 90px; height: 90px;
            margin: -45px 0 0 -45px;
            border-radius: 50%;
            border: 3px solid rgba(224, 86, 253, 0.15);
            border-bottom-color: #e056fd;
            animation: lsRingSpin 1.8s linear infinite reverse;
        }
        #loadingRingCenter {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 32px;
            animation: lsPulse 1.5s ease-in-out infinite;
        }
        @keyframes lsPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.15); }
        }

        /* ★ Прогресс-бар ★ */
        #loadingBarWrap {
            width: 320px;
            max-width: 80vw;
            height: 14px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
            position: relative;
            z-index: 2;
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

        /* ★ Текст статуса ★ */
        #loadingStatus {
            margin-top: 20px;
            font-size: 13px;
            color: #aaa;
            font-weight: 700;
            letter-spacing: 1px;
            min-height: 20px;
            text-align: center;
            position: relative;
            z-index: 2;
        }
        #loadingPercent {
            margin-top: 8px;
            font-size: 24px;
            color: #f5af19;
            font-weight: 900;
            text-shadow: 0 0 15px rgba(245,175,25,0.6);
            position: relative;
            z-index: 2;
        }
        #loadingHint {
            position: absolute;
            bottom: 30px;
            left: 0; right: 0;
            text-align: center;
            font-size: 12px;
            color: #666;
            font-weight: 600;
            padding: 0 20px;
            z-index: 2;
        }

        /* ★ Тонкая надпись "первый запуск" ★ */
        #loadingFirstTime {
            margin-top: 15px;
            font-size: 11px;
            color: #f5af19;
            font-weight: 700;
            letter-spacing: 1px;
            opacity: 0;
            transition: opacity 0.5s;
            position: relative;
            z-index: 2;
        }
        #loadingFirstTime.show {
            opacity: 0.8;
        }

        /* ★ Плавное появление и исчезновение ★ */
        #loadingScreen {
            animation: lsFadeIn 0.5s ease-out;
        }
        @keyframes lsFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(loadingCSS);

    // ============================================================
    // ★ СОЗДАНИЕ ЭКРАНА ЗАГРУЗКИ ★
    // ============================================================
    function createLoadingScreen() {
        // Если уже есть — не создаём
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
            <div id="loadingPercent">0%</div>
            <div id="loadingStatus">Загрузка музыки...</div>
            <div id="loadingFirstTime">✨ Первый запуск — это может занять некоторое время</div>
            <div id="loadingHint">Все треки будут доступны мгновенно после загрузки</div>
        `;

        // Вставляем в начало body (или в html, если body ещё нет)
        if (document.body) {
            document.body.insertBefore(div, document.body.firstChild);
        } else {
            document.documentElement.appendChild(div);
        }
    }

    // ============================================================
    // ★ ОБНОВЛЕНИЕ UI ★
    // ============================================================
    function updateProgress(loaded, total) {
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
        const bar = document.getElementById('loadingBar');
        const pct = document.getElementById('loadingPercent');
        if (bar) bar.style.width = percent + '%';
        if (pct) pct.textContent = percent + '%';
    }

    function setStatus(text) {
        const el = document.getElementById('loadingStatus');
        if (el) el.textContent = text;
    }

    function showFirstTimeHint() {
        const el = document.getElementById('loadingFirstTime');
        if (el) el.classList.add('show');
    }

    // ============================================================
    // ★ СКАЧИВАНИЕ ОДНОГО ФАЙЛА ★
    // ============================================================
    function loadOneMusic(key, path) {
        return new Promise(function(resolve) {
            fetch(path, { cache: 'force-cache' })
                .then(function(response) {
                    if (!response.ok) throw new Error("HTTP " + response.status);
                    return response.blob();
                })
                .then(function(blob) {
                    // ★ Сохраняем Blob и Blob URL ★
                    window.__loadedMusic[key] = {
                        blob: blob,
                        url: URL.createObjectURL(blob),
                        path: path,
                        size: blob.size
                    };
                    console.log("[LOADING] ✅ " + key + " (" + path + ") — " + Math.round(blob.size / 1024) + " КБ");
                    resolve({ key: key, success: true, size: blob.size });
                })
                .catch(function(err) {
                    console.warn("[LOADING] ❌ " + key + " (" + path + ") — " + err.message);
                    window.__loadedMusic[key] = null;
                    resolve({ key: key, success: false, error: err.message });
                });
        });
    }

    // ============================================================
    // ★ ГЛАВНАЯ ФУНКЦИЯ ЗАГРУЗКИ ★
    // ============================================================
    async function loadAllMusic() {
        const keys = Object.keys(MUSIC_FILES);
        const total = keys.length;
        let loaded = 0;
        let successCount = 0;
        let totalBytes = 0;

        setStatus("Загрузка музыки (0/" + total + ")...");

        // ★ ПРОВЕРЯЕМ: есть ли в localStorage флаг "уже загружали" ★
        const isFirstTime = !localStorage.getItem('music_loaded_once');
        if (isFirstTime) {
            showFirstTimeHint();
        }

        // ★ Загружаем ПОСЛЕДОВАТЕЛЬНО (чтобы не перегружать сеть) ★
        // Если хочешь быстрее — можно параллельно, но тогда прогресс прыгает.
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const path = MUSIC_FILES[key];
            setStatus("Загрузка: " + path.split('/').pop() + " (" + (i + 1) + "/" + total + ")");

            const result = await loadOneMusic(key, path);
            if (result.success) {
                successCount++;
                totalBytes += result.size || 0;
            }
            loaded++;
            updateProgress(loaded, total);
        }

        // ★ Финальный статус ★
        const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
        if (successCount === total) {
            setStatus("✅ Всё готово! (" + totalMB + " МБ)");
        } else {
            setStatus("⚠️ Загружено " + successCount + "/" + total + " треков");
        }

        // ★ Ставим флаг "первый запуск пройден" ★
        try {
            localStorage.setItem('music_loaded_once', '1');
        } catch(e) {}

        // ★ Устанавливаем глобальный флаг готовности ★
        window.__musicLoaded = true;

        // ★ Вызываем все колбэки, которые ждали ★
        if (window.__musicLoadedCallbacks && window.__musicLoadedCallbacks.length > 0) {
            for (let cb of window.__musicLoadedCallbacks) {
                try { cb(); } catch(e) { console.error("[LOADING] callback error:", e); }
            }
            window.__musicLoadedCallbacks = [];
        }

        // ★ Ждём MIN_SHOW_TIME, потом скрываем ★
        const elapsed = performance.now() - startTime;
        const waitTime = Math.max(0, MIN_SHOW_TIME - elapsed);
        setTimeout(hideLoadingScreen, waitTime);
    }

    // ============================================================
    // ★ СКРЫТИЕ ЭКРАНА ★
    // ============================================================
    function hideLoadingScreen() {
        const el = document.getElementById('loadingScreen');
        if (!el) return;
        el.classList.add('hidden');
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
            console.log("[LOADING] Экран загрузки скрыт");
        }, 700);
    }

    // ============================================================
    // ★ ПАТЧ Audio() — чтобы игра брала готовые Blob URL ★
    // ============================================================
    function patchAudioConstructor() {
        // ★ Запоминаем оригинальный конструктор ★
        const OriginalAudio = window.Audio;

        window.Audio = function(src) {
            // ★ Если src — строка и это путь к mp3, который мы загрузили ★
            if (typeof src === 'string') {
                // Ищем по ключу
                if (window.__loadedMusic) {
                    for (let key in window.__loadedMusic) {
                        let entry = window.__loadedMusic[key];
                        if (entry && entry.path === src) {
                            // ★ Нашли — используем Blob URL ★
                            // console.log("[LOADING] Audio() → Blob для " + src);
                            return new OriginalAudio(entry.url);
                        }
                    }
                }
                // ★ Ищем по последней части пути (на случай если пути чуть разные) ★
                let srcFile = src.split('/').pop();
                for (let key in window.__loadedMusic) {
                    let entry = window.__loadedMusic[key];
                    if (entry && entry.path) {
                        let entryFile = entry.path.split('/').pop();
                        if (entryFile === srcFile) {
                            // console.log("[LOADING] Audio() → Blob (по имени файла) для " + src);
                            return new OriginalAudio(entry.url);
                        }
                    }
                }
            }
            // ★ Иначе — обычный конструктор ★
            return new OriginalAudio(src);
        };

        // Копируем прототип
        window.Audio.prototype = OriginalAudio.prototype;
        window.Audio.constructor = window.Audio;

        console.log("[LOADING] ✅ Audio() пропатчен — игра будет использовать предзагруженные треки");
    }

    // ============================================================
    // ★ ПАТЧ — для fetch() в других скриптах ★
    // ============================================================
    // В living_stone_boss.js есть fetch() на mp3 файл для QTE
    // Подменяем его, чтобы брал из кэша
    function patchFetch() {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            // ★ Если url — строка и это mp3 из нашего списка ★
            if (typeof url === 'string' && window.__loadedMusic) {
                for (let key in window.__loadedMusic) {
                    let entry = window.__loadedMusic[key];
                    if (entry && entry.path === url) {
                        // Возвращаем фейковый Response с нашим Blob
                        return Promise.resolve(new Response(entry.blob, {
                            status: 200,
                            statusText: "OK (from cache)",
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
                                statusText: "OK (from cache)",
                                headers: { 'Content-Type': 'audio/mpeg' }
                            }));
                        }
                    }
                }
            }
            return originalFetch.apply(this, arguments);
        };
        console.log("[LOADING] ✅ fetch() пропатчен — будет использовать кэш");
    }

    // ============================================================
    // ★ ЗАПУСК ★
    // ============================================================
    let startTime = 0;

    function init() {
        startTime = performance.now();

        // ★ Создаём экран загрузки как можно раньше ★
        if (document.body) {
            createLoadingScreen();
        } else {
            // Если body ещё нет — ждём
            document.addEventListener('DOMContentLoaded', function() {
                createLoadingScreen();
            });
        }

        // ★ Патчим Audio и fetch ДО начала загрузки ★
        patchAudioConstructor();
        patchFetch();

        // ★ Начинаем загрузку ★
        // Используем setTimeout чтобы DOM успел отрисоваться
        setTimeout(function() {
            loadAllMusic().catch(function(err) {
                console.error("[LOADING] Критическая ошибка загрузки:", err);
                setStatus("⚠️ Ошибка загрузки, продолжаем без музыки");
                window.__musicLoaded = true;
                setTimeout(hideLoadingScreen, 1500);
            });
        }, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================================
    // ★ ЭКСПОРТ ДЛЯ ОТЛАДКИ ★
    // ============================================================
    window.loadingScreen = {
        MUSIC_FILES: MUSIC_FILES,
        reload: function() {
            window.__loadedMusic = {};
            window.__musicLoaded = false;
            loadAllMusic();
        },
        getLoadedList: function() {
            let list = [];
            for (let key in window.__loadedMusic) {
                let e = window.__loadedMusic[key];
                if (e) list.push({ key: key, path: e.path, size: e.size });
                else list.push({ key: key, path: MUSIC_FILES[key], size: 0, failed: true });
            }
            return list;
        }
    };

    console.log("╔════════════════════════════════════════════════╗");
    console.log("║  🎵 LOADING SCREEN v1.0 загружено              ║");
    console.log("║  📁 Файлов для загрузки: " + Object.keys(MUSIC_FILES).length + "                    ║");
    console.log("║  🔧 Audio() и fetch() будут использовать кэш   ║");
    console.log("╚════════════════════════════════════════════════╝");

})();
