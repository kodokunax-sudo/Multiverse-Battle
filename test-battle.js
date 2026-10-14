/* TEST BATTLE — isolated Undertale-style jump challenge.
 * Deliberately separate from battle.js: does not touch normal boss fights,
 * player stats, saves, rewards, Supabase, or the main arena state.
 */
(function () {
    'use strict';

    var overlay = null;
    var canvas = null;
    var ctx = null;
    var raf = 0;
    var running = false;
    var lastTime = 0;
    var elapsed = 0;
    var score = 0;
    var lives = 3;
    var speed = 210;
    var spawnTimer = 0;
    var obstacles = [];
    var jumpY = 0;
    var jumpVelocity = 0;
    var grounded = true;
    var gameOver = false;
    var jumpButton = null;
    var scoreLabel = null;
    var livesLabel = null;
    var statusLabel = null;

    var W = 400;
    var H = 360;
    var GROUND = 292;
    var PLAYER_X = 72;
    var PLAYER_R = 10;

    function addStyles() {
        if (document.getElementById('testBattleStyles')) return;
        var style = document.createElement('style');
        style.id = 'testBattleStyles';
        style.textContent = [
            '#testBattleOverlay{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.94);padding:14px;font-family:Nunito,Arial,sans-serif;color:#fff;}',
            '#testBattlePanel{width:min(520px,100%);max-height:96dvh;overflow:auto;background:#08080d;border:3px solid #f5f5f5;border-radius:12px;padding:14px;box-shadow:0 0 0 4px #111,0 0 28px rgba(255,255,255,.12);}',
            '#testBattleHeader{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}',
            '#testBattleTitle{font-size:18px;font-weight:900;letter-spacing:1px;}',
            '#testBattleExit{background:#262630;color:#fff;border:1px solid #777;border-radius:8px;padding:8px 11px;font-weight:900;cursor:pointer;}',
            '#testBattleStats{display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:900;margin:8px 2px;}',
            '#testBattleCanvas{display:block;width:100%;height:auto;aspect-ratio:10/9;background:#050509;border:2px solid #eee;image-rendering:pixelated;touch-action:manipulation;}',
            '#testBattleControls{display:flex;gap:10px;margin-top:10px;}',
            '#testBattleJump{flex:1;min-height:58px;border:2px solid #fff;border-radius:10px;background:#e83c4b;color:#fff;font-size:18px;font-weight:900;letter-spacing:1px;touch-action:manipulation;cursor:pointer;}',
            '#testBattleRestart{min-height:58px;padding:0 15px;border:2px solid #777;border-radius:10px;background:#20202a;color:#fff;font-weight:900;cursor:pointer;}',
            '#testBattleHint{color:#bbb;text-align:center;font-size:12px;line-height:1.5;margin-top:9px;}',
            '@media(min-width:700px){#testBattleCanvas{max-height:56vh;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function buildOverlay() {
        if (overlay) return;
        addStyles();
        overlay = document.createElement('div');
        overlay.id = 'testBattleOverlay';
        overlay.innerHTML =
            '<section id="testBattlePanel" role="dialog" aria-modal="true" aria-label="Тестовый бой">' +
                '<div id="testBattleHeader"><div id="testBattleTitle">♥ ТЕСТОВЫЙ БОЙ</div><button id="testBattleExit" type="button">✕ Выйти</button></div>' +
                '<div id="testBattleStats"><span>❤️ <b id="testBattleLives">3</b></span><span>СЧЁТ: <b id="testBattleScore">0</b></span></div>' +
                '<canvas id="testBattleCanvas" width="400" height="360" aria-label="Арена прыжков"></canvas>' +
                '<div id="testBattleControls"><button id="testBattleJump" type="button">⬆ ПРЫЖОК</button><button id="testBattleRestart" type="button">↻ ЗАНОВО</button></div>' +
                '<div id="testBattleHint">Персонаж держится у левой стороны. Перепрыгивай шипы!<br>Пробел / ↑ / W или кнопка «ПРЫЖОК»</div>' +
            '</section>';
        document.body.appendChild(overlay);
        canvas = document.getElementById('testBattleCanvas');
        ctx = canvas.getContext('2d');
        jumpButton = document.getElementById('testBattleJump');
        scoreLabel = document.getElementById('testBattleScore');
        livesLabel = document.getElementById('testBattleLives');
        statusLabel = document.getElementById('testBattleHint');

        document.getElementById('testBattleExit').addEventListener('click', closeTestBattle);
        document.getElementById('testBattleRestart').addEventListener('click', startTestBattle);
        jumpButton.addEventListener('pointerdown', function (ev) {
            ev.preventDefault();
            jump();
        });
        canvas.addEventListener('pointerdown', function (ev) {
            ev.preventDefault();
            jump();
        });
        overlay.addEventListener('click', function (ev) {
            if (ev.target === overlay) closeTestBattle();
        });
    }

    function resetState() {
        elapsed = 0;
        score = 0;
        lives = 3;
        speed = 210;
        spawnTimer = 0.75;
        obstacles = [];
        jumpY = 0;
        jumpVelocity = 0;
        grounded = true;
        gameOver = false;
        lastTime = 0;
        scoreLabel.textContent = '0';
        livesLabel.textContent = '3';
        statusLabel.innerHTML = 'Персонаж держится у левой стороны. Перепрыгивай шипы!<br>Пробел / ↑ / W или кнопка «ПРЫЖОК»';
        jumpButton.textContent = '⬆ ПРЫЖОК';
        jumpButton.disabled = false;
        jumpButton.style.opacity = '1';
    }

    function startTestBattle() {
        buildOverlay();
        if (raf) cancelAnimationFrame(raf);
        resetState();
        overlay.style.display = 'flex';
        running = true;
        raf = requestAnimationFrame(loop);
    }

    function closeTestBattle() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (overlay) overlay.style.display = 'none';
    }

    function jump() {
        if (!running || gameOver || !grounded) return;
        grounded = false;
        jumpVelocity = -430;
        if (typeof window.sfxArenaTargetHit === 'function') {
            try { window.sfxArenaTargetHit(); } catch (e) {}
        }
    }

    function drawHeart(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#ff304f';
        ctx.shadowColor = 'rgba(255,40,70,.65)';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.bezierCurveTo(-4, 4, -13, -2, -9, -9);
        ctx.bezierCurveTo(-6, -14, -1, -12, 0, -7);
        ctx.bezierCurveTo(3, -13, 9, -13, 11, -7);
        ctx.bezierCurveTo(14, 0, 5, 5, 0, 8);
        ctx.fill();
        ctx.restore();
    }

    function drawSpike(obstacle) {
        ctx.fillStyle = '#f3f3f3';
        ctx.beginPath();
        ctx.moveTo(obstacle.x, GROUND);
        ctx.lineTo(obstacle.x + obstacle.w / 2, GROUND - obstacle.h);
        ctx.lineTo(obstacle.x + obstacle.w, GROUND);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff304f';
        ctx.fillRect(obstacle.x + obstacle.w * 0.43, GROUND - obstacle.h + 9, 3, 7);
    }

    function drawArena() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#050509';
        ctx.fillRect(0, 0, W, H);

        // Subtle star pixels and the classic battle-box framing.
        ctx.fillStyle = '#777';
        for (var i = 0; i < 18; i++) {
            var sx = (i * 71 + 23) % W;
            var sy = (i * 47 + 19) % 245;
            ctx.fillRect(sx, sy, 2, 2);
        }
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, W - 20, H - 20);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('JUMP TEST', 22, 30);

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(22, GROUND + 1);
        ctx.lineTo(W - 22, GROUND + 1);
        ctx.stroke();

        // The soul is pulled to the left side; only vertical jumping is needed.
        drawHeart(PLAYER_X, GROUND - 11 - jumpY);

        for (var j = 0; j < obstacles.length; j++) drawSpike(obstacles[j]);

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,.72)';
            ctx.fillRect(20, 95, W - 40, 105);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(20, 95, W - 40, 105);
            ctx.fillStyle = '#ff5266';
            ctx.textAlign = 'center';
            ctx.font = 'bold 24px monospace';
            ctx.fillText(lives <= 0 ? 'YOU DIED' : 'TEST COMPLETE', W / 2, 135);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px monospace';
            ctx.fillText('Счёт: ' + score, W / 2, 160);
            ctx.fillText('Нажми «ЗАНОВО»', W / 2, 180);
            ctx.textAlign = 'left';
        }
    }

    function hitPlayer(obstacle) {
        var playerBottom = GROUND - jumpY;
        var playerLeft = PLAYER_X - PLAYER_R;
        var playerRight = PLAYER_X + PLAYER_R;
        var obstacleRight = obstacle.x + obstacle.w;
        var overlapX = playerRight > obstacle.x + 3 && playerLeft < obstacleRight - 2;
        var overlapY = playerBottom > GROUND - obstacle.h + 2;
        return overlapX && overlapY;
    }

    function loop(timestamp) {
        if (!running) return;
        if (!lastTime) lastTime = timestamp;
        var dt = Math.min((timestamp - lastTime) / 1000, 0.04);
        lastTime = timestamp;
        elapsed += dt;
        speed = Math.min(390, 210 + elapsed * 4.5);
        score = Math.floor(elapsed * 10);
        scoreLabel.textContent = String(score);

        if (!grounded) {
            jumpY += -jumpVelocity * dt;
            jumpVelocity += 1050 * dt;
            if (jumpY <= 0) {
                jumpY = 0;
                jumpVelocity = 0;
                grounded = true;
            }
        }

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            var h = 22 + Math.random() * 12;
            obstacles.push({ x: W + 5, w: 20 + Math.random() * 10, h: h, passed: false });
            spawnTimer = Math.max(0.68, 1.18 - elapsed * 0.006) + Math.random() * 0.28;
        }

        for (var i = obstacles.length - 1; i >= 0; i--) {
            var o = obstacles[i];
            o.x -= speed * dt;
            if (!o.passed && o.x + o.w < PLAYER_X - PLAYER_R) {
                o.passed = true;
                score += 5;
            }
            if (hitPlayer(o)) {
                obstacles.splice(i, 1);
                lives--;
                livesLabel.textContent = String(lives);
                if (lives <= 0) finishGame();
                continue;
            }
            if (o.x + o.w < -10) obstacles.splice(i, 1);
        }

        drawArena();
        if (running && !gameOver) raf = requestAnimationFrame(loop);
    }

    function finishGame() {
        gameOver = true;
        running = false;
        jumpButton.textContent = 'БОЙ ОКОНЧЕН';
        jumpButton.disabled = true;
        jumpButton.style.opacity = '.65';
        statusLabel.textContent = 'Тестовый режим завершён. Основной прогресс и награды не затронуты.';
        drawArena();
    }

    function onKeyDown(ev) {
        if (!overlay || overlay.style.display === 'none') return;
        if (ev.key === 'Escape') {
            closeTestBattle();
            return;
        }
        if (ev.code === 'Space' || ev.key === 'ArrowUp' || ev.key.toLowerCase() === 'w') {
            ev.preventDefault();
            jump();
        }
    }

    document.addEventListener('keydown', onKeyDown);
    window.openTestBattle = startTestBattle;
    window.closeTestBattle = closeTestBattle;
})();
