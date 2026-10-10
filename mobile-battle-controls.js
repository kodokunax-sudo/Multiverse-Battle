/* ============================================================
   MULTIVERSE BATTLE — MOBILE BOSS CONTROLS
   On-screen 8-way D-pad. Sends real game key events so the
   standard and unique bosses all use their native movement code.
   ============================================================ */
(function () {
    'use strict';
    if (window.__mobileBattleControlsLoaded) return;
    window.__mobileBattleControlsLoaded = true;

    var style = document.createElement('style');
    style.id = 'mobile-battle-controls-style';
    style.textContent = `
        #mobileBattleControls {
            position: absolute;
            z-index: 500;
            left: max(10px, env(safe-area-inset-left));
            bottom: max(14px, env(safe-area-inset-bottom));
            width: 150px;
            padding: 0;
            display: none;
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            touch-action: none;
            font-family: Arial, sans-serif;
        }
        #mobileBattleControls .mb-dpad-label {
            padding: 0 0 5px 4px;
            color: rgba(255,255,255,.76);
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1.2px;
            text-shadow: 0 1px 4px #000;
            white-space: nowrap;
        }
        #mobileBattleControls .mb-dpad-grid {
            display: grid;
            grid-template-columns: repeat(3, 46px);
            grid-template-rows: repeat(3, 46px);
            gap: 3px;
            pointer-events: none;
        }
        #mobileBattleControls .mb-direction {
            width: 46px;
            height: 46px;
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            border: 1px solid rgba(213,202,255,.8);
            border-radius: 13px;
            color: #fff;
            background: linear-gradient(145deg, rgba(72,61,112,.94), rgba(28,25,49,.95));
            box-shadow: 0 3px 7px rgba(0,0,0,.5), inset 0 1px rgba(255,255,255,.18);
            font-size: 23px;
            line-height: 1;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
            pointer-events: auto;
            cursor: pointer;
            outline: none;
            transition: background .06s, transform .06s, box-shadow .06s;
        }
        #mobileBattleControls .mb-direction.mb-diagonal {
            font-size: 19px;
            color: #e4ddff;
        }
        #mobileBattleControls .mb-direction.mb-pressed {
            transform: scale(.92);
            color: #fff7c7;
            border-color: #ffe58a;
            background: linear-gradient(145deg, rgba(172,121,255,.98), rgba(83,54,156,.98));
            box-shadow: 0 0 13px rgba(166,119,255,.8), inset 0 1px rgba(255,255,255,.34);
        }
        #mobileBattleControls .mb-dpad-center {
            width: 46px;
            height: 46px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 13px;
            color: rgba(255,255,255,.35);
            background: rgba(8,8,18,.45);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
        }
        @media (max-width: 820px), (pointer: coarse) {
            #arenaCanvas {
                width: min(400px, calc(100vw - 16px)) !important;
                height: auto !important;
                max-height: 72vh;
                box-sizing: border-box;
            }
            #arenaOverlay { overflow: hidden; }
        }
        @media (max-height: 520px) {
            #mobileBattleControls { width: 125px; bottom: max(5px, env(safe-area-inset-bottom)); }
            #mobileBattleControls .mb-dpad-label { font-size: 8px; padding-bottom: 2px; }
            #mobileBattleControls .mb-dpad-grid {
                grid-template-columns: repeat(3, 38px);
                grid-template-rows: repeat(3, 38px);
                gap: 2px;
            }
            #mobileBattleControls .mb-direction,
            #mobileBattleControls .mb-dpad-center {
                width: 38px;
                height: 38px;
                border-radius: 10px;
            }
            #mobileBattleControls .mb-direction { font-size: 19px; }
            #mobileBattleControls .mb-direction.mb-diagonal { font-size: 16px; }
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    var directionsHeld = Object.create(null);
    var controls = null;
    var directionButtons = [];
    var directionKeys = {
        up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
        upleft: ['ArrowUp', 'ArrowLeft'], upright: ['ArrowUp', 'ArrowRight'],
        downleft: ['ArrowDown', 'ArrowLeft'], downright: ['ArrowDown', 'ArrowRight']
    };
    var syntheticKeysDown = Object.create(null);

    function dispatchGameKey(key, isDown) {
        var type = isDown ? 'keydown' : 'keyup';
        var event;
        try {
            event = new KeyboardEvent(type, {
                key: key,
                code: key,
                bubbles: true,
                cancelable: true
            });
        } catch (e) {
            event = document.createEvent('Event');
            event.initEvent(type, true, true);
            event.key = key;
            event.code = key;
        }
        window.dispatchEvent(event);
    }

    function mobileLike() {
        var coarse = false;
        try { coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) {}
        return coarse || /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent || '') ||
            Math.min(window.innerWidth || 9999, window.innerHeight || 9999) <= 820;
    }

    function isBattleActive() {
        try {
            var getters = ['getArenaActive', 'getLivingStoneActive', 'getWaystarActive', 'getRWBActive'];
            for (var i = 0; i < getters.length; i++) {
                if (typeof window[getters[i]] === 'function' && window[getters[i]]() === true) return true;
            }
            if (window.arenaActive === true || window.livingStoneActive === true ||
                window.waystarActive === true || window.rwbActive === true) return true;
            if (typeof arenaActive !== 'undefined' && arenaActive) return true;
            if (typeof livingStoneActive !== 'undefined' && livingStoneActive) return true;
            if (typeof waystarActive !== 'undefined' && waystarActive) return true;
            if (typeof rwbActive !== 'undefined' && rwbActive) return true;
        } catch (e) {}
        var overlay = document.getElementById('arenaOverlay');
        if (!overlay) return false;
        var css = window.getComputedStyle ? window.getComputedStyle(overlay) : null;
        return !!(css && css.display !== 'none' && css.visibility !== 'hidden' &&
            overlay.getBoundingClientRect && overlay.getBoundingClientRect().height > 0);
    }

    function clearHeldDirections() {
        Object.keys(directionsHeld).forEach(function (key) {
            var entry = directionsHeld[key];
            if (entry && entry.button) entry.button.classList.remove('mb-pressed');
        });
        directionsHeld = Object.create(null);
        syncMovement();
    }

    function syncMovement() {
        // Recompute the set of directions still held. Reference-counting by
        // set membership means releasing one diagonal/button won't cancel a
        // direction that another simultaneously-held button still needs.
        var keysNow = Object.create(null);
        Object.keys(directionsHeld).forEach(function (direction) {
            var entry = directionsHeld[direction];
            if (!entry || !entry.pointers || entry.pointers.size === 0) return;
            (directionKeys[direction] || []).forEach(function (key) {
                keysNow[key] = true;
            });
        });

        Object.keys(keysNow).forEach(function (key) {
            if (!syntheticKeysDown[key]) dispatchGameKey(key, true);
        });
        Object.keys(syntheticKeysDown).forEach(function (key) {
            if (!keysNow[key]) dispatchGameKey(key, false);
        });
        syntheticKeysDown = keysNow;
    }

    function buildControls() {
        var overlay = document.getElementById('arenaOverlay');
        if (!overlay) return false;
        controls = document.getElementById('mobileBattleControls');
        if (controls) return true;

        controls = document.createElement('div');
        controls.id = 'mobileBattleControls';
        controls.setAttribute('aria-label', 'Мобильное управление движением');
        controls.innerHTML =
            '<div class="mb-dpad-label">УДЕРЖИВАЙ ДЛЯ ДВИЖЕНИЯ</div>' +
            '<div class="mb-dpad-grid">' +
              '<button type="button" class="mb-direction mb-diagonal" data-direction="upleft" aria-label="Вверх и влево">↖</button>' +
              '<button type="button" class="mb-direction" data-direction="up" aria-label="Вверх">▲</button>' +
              '<button type="button" class="mb-direction mb-diagonal" data-direction="upright" aria-label="Вверх и вправо">↗</button>' +
              '<button type="button" class="mb-direction" data-direction="left" aria-label="Влево">◀</button>' +
              '<div class="mb-dpad-center" aria-hidden="true">✦</div>' +
              '<button type="button" class="mb-direction" data-direction="right" aria-label="Вправо">▶</button>' +
              '<button type="button" class="mb-direction mb-diagonal" data-direction="downleft" aria-label="Вниз и влево">↙</button>' +
              '<button type="button" class="mb-direction" data-direction="down" aria-label="Вниз">▼</button>' +
              '<button type="button" class="mb-direction mb-diagonal" data-direction="downright" aria-label="Вниз и вправо">↘</button>' +
            '</div>';
        overlay.appendChild(controls);
        directionButtons = Array.prototype.slice.call(controls.querySelectorAll('[data-direction]'));

        directionButtons.forEach(function (button, index) {
            var key = button.getAttribute('data-direction');
            button.addEventListener('pointerdown', function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (!directionsHeld[key]) directionsHeld[key] = { pointers: new Set(), button: button };
                directionsHeld[key].pointers.add(event.pointerId);
                button.classList.add('mb-pressed');
                try { button.setPointerCapture(event.pointerId); } catch (e) {}
                syncMovement();
            }, { passive: false });
            function release(event) {
                var entry = directionsHeld[key];
                if (!entry) return;
                if (event && typeof event.pointerId !== 'undefined') entry.pointers.delete(event.pointerId);
                if (!entry.pointers.size) {
                    delete directionsHeld[key];
                    button.classList.remove('mb-pressed');
                }
                syncMovement();
                if (event) event.stopPropagation();
            }
            button.addEventListener('pointerup', release);
            button.addEventListener('pointercancel', release);
            button.addEventListener('lostpointercapture', release);
            button.addEventListener('contextmenu', function (event) { event.preventDefault(); });
        });
        return true;
    }

    function updateVisibility() {
        if (!buildControls()) return;
        var show = mobileLike() && isBattleActive();
        controls.style.display = show ? 'block' : 'none';
        if (!show && Object.keys(directionsHeld).length) clearHeldDirections();
    }

    window.addEventListener('blur', clearHeldDirections);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) clearHeldDirections();
    });
    window.addEventListener('pointerup', function (event) {
        // A fallback release for browsers that lose pointer capture outside a button.
        Object.keys(directionsHeld).forEach(function (key) {
            var entry = directionsHeld[key];
            if (entry && entry.pointers.has(event.pointerId)) {
                entry.pointers.delete(event.pointerId);
                if (!entry.pointers.size) {
                    entry.button.classList.remove('mb-pressed');
                    delete directionsHeld[key];
                }
            }
        });
        syncMovement();
    }, true);

    function init() {
        buildControls();
        updateVisibility();
        window.setInterval(updateVisibility, 120);
        window.addEventListener('resize', updateVisibility, { passive: true });
        window.addEventListener('orientationchange', updateVisibility, { passive: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
