/* ============================================================
   ANTI PULL-TO-REFRESH
   Prevents mobile browsers from refreshing the game on downward
   swipe, especially while any arena / unique boss fight is active.
   This does NOT stop game touch handlers; it only cancels the
   browser's default touch scrolling / pull-to-refresh behavior.
   ============================================================ */
(function () {
    'use strict';

    if (window.__antiPullRefreshLoaded) return;
    window.__antiPullRefreshLoaded = true;

    var style = document.createElement('style');
    style.id = 'anti-pull-refresh-style';
    style.textContent = [
        'html, body {',
        '  overscroll-behavior: none !important;',
        '  overscroll-behavior-y: none !important;',
        '}',
        '#arenaOverlay, #arenaOverlay * {',
        '  overscroll-behavior: none !important;',
        '  -webkit-overflow-scrolling: auto !important;',
        '}',
        'body.anti-pull-battle-lock {',
        '  overscroll-behavior: none !important;',
        '}'
    ].join('\n');

    function attachStyle() {
        if (!document.getElementById(style.id) && document.head) {
            document.head.appendChild(style);
        }
    }
    attachStyle();
    if (!document.head) {
        document.addEventListener('DOMContentLoaded', attachStyle, { once: true });
    }

    var startY = null;
    var lastY = null;

    function isVisible(el) {
        if (!el) return false;
        var css = window.getComputedStyle ? window.getComputedStyle(el) : null;
        return !!(css && css.display !== 'none' && css.visibility !== 'hidden' &&
            el.getBoundingClientRect && el.getBoundingClientRect().height > 0);
    }

    function isBattleActive() {
        try {
            if (document.body && document.body.classList.contains('battle-active')) return true;
            var overlay = document.getElementById('arenaOverlay');
            if (isVisible(overlay)) return true;

            var flags = ['arenaActive', 'livingStoneActive', 'waystarActive', 'rwbActive'];
            for (var i = 0; i < flags.length; i++) {
                if (window[flags[i]] === true) return true;
            }

            var getters = [
                'getArenaActive',
                'getLivingStoneActive',
                'getWaystarActive',
                'getRWBActive'
            ];
            for (var j = 0; j < getters.length; j++) {
                if (typeof window[getters[j]] === 'function' && window[getters[j]]() === true) return true;
            }

            // Some game states are declared with top-level let and are not window properties.
            if (typeof arenaActive !== 'undefined' && arenaActive) return true;
            if (typeof livingStoneActive !== 'undefined' && livingStoneActive) return true;
            if (typeof waystarActive !== 'undefined' && waystarActive) return true;
            if (typeof rwbActive !== 'undefined' && rwbActive) return true;
        } catch (err) {
            // A partially initialized game must not break touch input.
        }
        return false;
    }

    function isAtTop() {
        var root = document.scrollingElement || document.documentElement;
        return (window.scrollY || 0) <= 0 &&
            (!root || root.scrollTop <= 0) &&
            (!document.body || document.body.scrollTop <= 0);
    }

    document.addEventListener('touchstart', function (event) {
        if (!event.touches || event.touches.length !== 1) {
            startY = lastY = null;
            return;
        }
        startY = lastY = event.touches[0].clientY;
        if (isBattleActive() && document.body) {
            document.body.classList.add('anti-pull-battle-lock');
        }
    }, { capture: true, passive: true });

    document.addEventListener('touchmove', function (event) {
        if (!event.touches || event.touches.length !== 1) return;

        var currentY = event.touches[0].clientY;
        var previousY = lastY;
        lastY = currentY;

        var inBattle = isBattleActive();
        if (inBattle && document.body && !document.body.classList.contains('anti-pull-battle-lock')) {
            document.body.classList.add('anti-pull-battle-lock');
        }

        // During boss fights, always prevent browser-level touch gestures.
        // The event still propagates, so canvas / joystick game controls work.
        var pulledDownFromTop = startY !== null &&
            currentY > startY + 2 &&
            isAtTop();

        if ((inBattle || pulledDownFromTop) && event.cancelable) {
            event.preventDefault();
        }

        // Drop the stored start position after a clear upward scroll so a later
        // downward gesture can be detected as its own movement.
        if (startY !== null && currentY < startY - 4 && !inBattle) {
            startY = currentY;
        }
    }, { capture: true, passive: false });

    function clearTouchState() {
        startY = lastY = null;
        if (document.body) document.body.classList.remove('anti-pull-battle-lock');
    }
    document.addEventListener('touchend', clearTouchState, { capture: true, passive: true });
    document.addEventListener('touchcancel', clearTouchState, { capture: true, passive: true });

    // Defensive CSS state refresh, separate from touch processing.
    window.setInterval(function () {
        if (!document.body) return;
        if (isBattleActive()) document.body.classList.add('anti-pull-battle-lock');
        else document.body.classList.remove('anti-pull-battle-lock');
    }, 250);
})();
