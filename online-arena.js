/* Multiverse Battle — online players rendered in the same Undertale-style arena layout as unique-boss fights. */
(function () {
    'use strict';

    var entered = false;
    var connecting = false;
    var channel = null;
    var client = null;
    var activeUserId = null;
    var selfSessionId = createId();
    var playerName = 'Игрок';
    var x = 50;
    var y = 50;
    var currentPlayers = new Map();
    var positionCache = new Map();
    var lastMoveSentAt = 0;
    var keyHandler = null;
    var pointerDownHandler = null;
    var pointerMoveHandler = null;
    var pointerUpHandler = null;
    var canvas = null;
    var ctx = null;

    function byId(id) { return document.getElementById(id); }
    function createId() {
        try { if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID(); } catch (_error) {}
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 3 | 8)).toString(16);
        });
    }
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function arenaIsVisible() {
        var stage = byId('onlineArenaStage');
        return entered && !!stage && stage.style.display !== 'none';
    }
    function setLobbyStatus(message) {
        var el = byId('onlineArenaStatus');
        if (el) el.textContent = message;
    }
    function setStageStatus(message) {
        var el = byId('onlineArenaStatusStage');
        if (el) el.textContent = message;
    }
    function getContext() {
        try {
            if (window.MBClans && typeof window.MBClans.getArenaContext === 'function') return window.MBClans.getArenaContext();
        } catch (_error) {}
        return null;
    }
    function resolvePlayerName(context) {
        var profile = context && context.profile;
        var user = context && context.user;
        var name = profile && profile.display_name;
        if (!name && user && user.user_metadata) name = user.user_metadata.display_name;
        if (!name && user && user.email) name = user.email.split('@')[0];
        return String(name || 'Игрок').trim().slice(0, 24) || 'Игрок';
    }
    function makeSelfPresence() {
        return { session_id: selfSessionId, user_id: activeUserId, display_name: playerName, x: x, y: y, joined_at: Date.now() };
    }
    function hashColor(text) {
        var hash = 0;
        text = String(text || '');
        for (var i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
        return 'hsl(' + (Math.abs(hash) % 360) + ', 92%, 66%)';
    }
    function heartPath(context, size) {
        context.beginPath();
        context.moveTo(0, size * 0.34);
        context.bezierCurveTo(-size * 0.12, size * 0.20, -size, -size * 0.02, -size, -size * 0.58);
        context.bezierCurveTo(-size, -size * 1.05, -size * 0.38, -size * 1.12, 0, -size * 0.65);
        context.bezierCurveTo(size * 0.38, -size * 1.12, size, -size * 1.05, size, -size * 0.58);
        context.bezierCurveTo(size, -size * 0.02, size * 0.12, size * 0.20, 0, size * 0.34);
        context.closePath();
    }

    async function enterArena() {
        if (entered || connecting) return;
        var context = getContext();
        if (!context || !context.client || !context.user || !context.user.id) {
            setLobbyStatus('Сначала войди в онлайн-аккаунт, чтобы подключиться к арене.');
            return;
        }
        var lobby = byId('onlineArenaLobby');
        var stage = byId('onlineArenaStage');
        canvas = byId('onlineArenaBattleCanvas');
        if (!lobby || !stage || !canvas) return;

        connecting = true;
        entered = true;
        client = context.client;
        activeUserId = context.user.id;
        playerName = resolvePlayerName(context);
        x = 24 + Math.random() * 52;
        y = 28 + Math.random() * 48;
        lastMoveSentAt = 0;
        positionCache.clear();
        currentPlayers.clear();
        lobby.style.display = 'none';
        stage.style.display = 'flex';
        if (stage.parentElement !== document.body) document.body.appendChild(stage);
        ctx = canvas.getContext('2d');
        renderPlayers();
        setStageStatus('Подключаемся к общей онлайн-комнате…');

        try {
            await connectToRoom();
            connecting = false;
            bindMovement();
            setStageStatus('✅ Подключено. Двигайся — другие игроки увидят тебя на этой арене.');
            canvas.focus({ preventScroll: true });
        } catch (error) {
            console.warn('[MB arena] Connection failed:', error);
            await closeRoom();
            entered = false;
            connecting = false;
            stage.style.display = 'none';
            lobby.style.display = 'block';
            setLobbyStatus('Не удалось подключиться к арене: ' + friendlyError(error));
        }
    }

    function friendlyError(error) {
        var message = error && error.message ? String(error.message) : String(error || '');
        if (/timed out|timeout|TIMED_OUT/i.test(message)) return 'истекло время подключения. Проверь интернет и настройки Realtime в Supabase.';
        if (/CHANNEL_ERROR|Unauthorized|permission|policy/i.test(message)) return 'Supabase Realtime отклонил подключение. Проверь настройки и права Realtime.';
        if (/network|fetch|offline/i.test(message)) return 'нет соединения с сервером. Проверь интернет.';
        return message || 'ошибка Realtime. Попробуй ещё раз.';
    }

    function connectToRoom() {
        return new Promise(function (resolve, reject) {
            if (!client || !activeUserId) return reject(new Error('Сначала войди в онлайн-аккаунт.'));
            var settled = false;
            var timeoutId = window.setTimeout(function () {
                if (!settled) {
                    settled = true;
                    reject(new Error('Подключение к Realtime timed out'));
                }
            }, 12000);
            function done(error) {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeoutId);
                if (error) reject(error);
                else resolve();
            }
            try {
                var ch = client.channel('mb-online-arena-room-v1', {
                    config: { presence: { key: selfSessionId }, broadcast: { self: false } }
                });
                channel = ch;
                ch.on('presence', { event: 'sync' }, syncPresence);
                ch.on('presence', { event: 'join' }, syncPresence);
                ch.on('presence', { event: 'leave' }, syncPresence);
                ch.on('broadcast', { event: 'arena_move' }, function (message) {
                    var payload = message && message.payload;
                    if (!payload || !payload.session_id || payload.session_id === selfSessionId) return;
                    if (!currentPlayers.has(payload.session_id)) return;
                    var pos = { x: clamp(Number(payload.x) || 50, 8, 92), y: clamp(Number(payload.y) || 50, 8, 92) };
                    positionCache.set(payload.session_id, pos);
                    var other = currentPlayers.get(payload.session_id);
                    other.x = pos.x;
                    other.y = pos.y;
                    renderPlayers();
                });
                ch.subscribe(async function (status, err) {
                    if (settled) return;
                    if (status === 'SUBSCRIBED') {
                        try {
                            var tracked = await ch.track(makeSelfPresence());
                            if (tracked !== 'ok') throw new Error('Не удалось зарегистрироваться в присутствии арены: ' + tracked);
                            positionCache.set(selfSessionId, { x: x, y: y });
                            syncPresence();
                            done();
                        } catch (error) { done(error); }
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        done(err || new Error('Supabase Realtime: ' + status));
                    }
                });
            } catch (error) { done(error); }
        });
    }

    function syncPresence() {
        if (!channel) return;
        var state;
        try { state = channel.presenceState(); } catch (_error) { return; }
        var next = new Map();
        Object.keys(state || {}).forEach(function (key) {
            var list = state[key];
            if (!Array.isArray(list)) return;
            list.forEach(function (meta) {
                if (!meta || !meta.session_id || !meta.user_id) return;
                var pos = positionCache.get(meta.session_id);
                next.set(meta.session_id, {
                    session_id: meta.session_id,
                    user_id: meta.user_id,
                    display_name: String(meta.display_name || 'Игрок').slice(0, 24),
                    x: clamp(pos ? pos.x : (Number(meta.x) || 50), 8, 92),
                    y: clamp(pos ? pos.y : (Number(meta.y) || 50), 8, 92)
                });
            });
        });
        currentPlayers = next;
        positionCache.forEach(function (_position, id) { if (!currentPlayers.has(id)) positionCache.delete(id); });
        if (currentPlayers.has(selfSessionId)) {
            currentPlayers.get(selfSessionId).x = x;
            currentPlayers.get(selfSessionId).y = y;
        }
        renderPlayers();
    }

    function drawArenaBackground() {
        if (!ctx || !canvas) return;
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < 42; i++) {
            var sx = (i * 73 + 19) % w;
            var sy = (i * 137 + 31) % h;
            ctx.fillStyle = i % 3 === 0 ? 'rgba(210,195,255,.23)' : 'rgba(255,255,255,.12)';
            ctx.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
        }
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(18.5, 18.5, w - 37, h - 37);
        ctx.strokeStyle = 'rgba(255,255,255,.045)';
        ctx.beginPath();
        ctx.moveTo(w / 2, 19); ctx.lineTo(w / 2, h - 19);
        ctx.moveTo(19, h / 2); ctx.lineTo(w - 19, h / 2);
        ctx.stroke();
    }

    function renderPlayers() {
        var roster = byId('onlineArenaRoster');
        var count = byId('onlineArenaPlayerCount');
        if (ctx && canvas) {
            drawArenaBackground();
            var players = Array.from(currentPlayers.values()).sort(function (a, b) {
                if (a.session_id === selfSessionId) return -1;
                if (b.session_id === selfSessionId) return 1;
                return a.display_name.localeCompare(b.display_name);
            });
            players.forEach(function (player) {
                var px = player.x / 100 * canvas.width;
                var py = player.y / 100 * canvas.height;
                var isSelf = player.session_id === selfSessionId;
                var color = isSelf ? '#ff3030' : hashColor(player.user_id);
                ctx.save();
                ctx.translate(px, py);
                ctx.shadowColor = color;
                ctx.shadowBlur = isSelf ? 14 : 10;
                ctx.fillStyle = color;
                heartPath(ctx, 8.5);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(255,255,255,.92)';
                ctx.lineWidth = 1;
                heartPath(ctx, 8.5);
                ctx.stroke();
                ctx.restore();

                var label = player.display_name;
                ctx.save();
                ctx.font = 'bold 11px Arial, sans-serif';
                var maxTextWidth = 126;
                if (ctx.measureText(label).width > maxTextWidth) {
                    while (label.length > 3 && ctx.measureText(label + '…').width > maxTextWidth) label = label.slice(0, -1);
                    label += '…';
                }
                var textWidth = ctx.measureText(label).width;
                var labelWidth = Math.min(maxTextWidth, textWidth) + 12;
                var labelX = clamp(px - labelWidth / 2, 3, canvas.width - labelWidth - 3);
                var labelY = clamp(py - 27, 3, canvas.height - 22);
                ctx.fillStyle = 'rgba(0,0,0,.83)';
                ctx.fillRect(labelX, labelY, labelWidth, 17);
                ctx.strokeStyle = isSelf ? 'rgba(255,223,131,.9)' : color;
                ctx.lineWidth = 1;
                ctx.strokeRect(labelX + .5, labelY + .5, labelWidth - 1, 16);
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, labelX + labelWidth / 2, labelY + 8.5, maxTextWidth);
                ctx.restore();
            });
        }

        var list = Array.from(currentPlayers.values()).sort(function (a, b) {
            if (a.session_id === selfSessionId) return -1;
            if (b.session_id === selfSessionId) return 1;
            return a.display_name.localeCompare(b.display_name);
        });
        if (count) count.textContent = String(list.length);
        if (roster) {
            roster.replaceChildren();
            if (!list.length) {
                var waiting = document.createElement('span');
                waiting.className = 'online-arena-roster-item';
                waiting.textContent = 'Ожидаем игроков…';
                roster.appendChild(waiting);
            } else {
                list.forEach(function (player) {
                    var chip = document.createElement('span');
                    var isSelf = player.session_id === selfSessionId;
                    chip.className = 'online-arena-roster-item' + (isSelf ? ' is-self' : '');
                    chip.textContent = (isSelf ? '♥ Ты: ' : '♥ ') + player.display_name;
                    roster.appendChild(chip);
                });
            }
        }
    }

    function broadcastPosition() {
        if (!channel || !activeUserId) return;
        var now = Date.now();
        if (now - lastMoveSentAt < 65) return;
        lastMoveSentAt = now;
        positionCache.set(selfSessionId, { x: x, y: y });
        var self = currentPlayers.get(selfSessionId);
        if (self) { self.x = x; self.y = y; }
        channel.send({
            type: 'broadcast',
            event: 'arena_move',
            payload: { session_id: selfSessionId, user_id: activeUserId, x: x, y: y }
        }).then(function (status) {
            if (status && status !== 'ok') console.warn('[MB arena] Move broadcast:', status);
        }).catch(function (error) { console.warn('[MB arena] Move broadcast failed:', error); });
        renderPlayers();
    }

    function moveBy(dx, dy) {
        if (!arenaIsVisible()) return;
        x = clamp(x + dx, 8, 92);
        y = clamp(y + dy, 8, 92);
        broadcastPosition();
    }
    function moveToPointer(event) {
        if (!arenaIsVisible() || !canvas) return;
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        x = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
        y = clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 92);
        broadcastPosition();
    }

    function bindMovement() {
        unbindMovement();
        keyHandler = function (event) {
            if (!arenaIsVisible()) return;
            var key = String(event.key || '').toLowerCase();
            var dx = 0, dy = 0;
            if (key === 'arrowleft' || key === 'a') dx = -2.2;
            else if (key === 'arrowright' || key === 'd') dx = 2.2;
            else if (key === 'arrowup' || key === 'w') dy = -2.2;
            else if (key === 'arrowdown' || key === 's') dy = 2.2;
            else if (key === 'escape') { exitArena(true); return; }
            else return;
            event.preventDefault();
            moveBy(dx, dy);
        };
        pointerDownHandler = function (event) {
            if (!arenaIsVisible() || !canvas) return;
            event.preventDefault();
            try { canvas.setPointerCapture(event.pointerId); } catch (_error) {}
            moveToPointer(event);
        };
        pointerMoveHandler = function (event) {
            if (!arenaIsVisible() || !canvas || !(event.buttons & 1)) return;
            event.preventDefault();
            moveToPointer(event);
        };
        pointerUpHandler = function () {};
        document.addEventListener('keydown', keyHandler);
        if (canvas) {
            canvas.addEventListener('pointerdown', pointerDownHandler);
            canvas.addEventListener('pointermove', pointerMoveHandler);
            canvas.addEventListener('pointerup', pointerUpHandler);
            canvas.addEventListener('pointercancel', pointerUpHandler);
        }
    }

    function unbindMovement() {
        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        if (canvas && pointerDownHandler) canvas.removeEventListener('pointerdown', pointerDownHandler);
        if (canvas && pointerMoveHandler) canvas.removeEventListener('pointermove', pointerMoveHandler);
        if (canvas && pointerUpHandler) {
            canvas.removeEventListener('pointerup', pointerUpHandler);
            canvas.removeEventListener('pointercancel', pointerUpHandler);
        }
        keyHandler = pointerDownHandler = pointerMoveHandler = pointerUpHandler = null;
    }

    async function closeRoom() {
        unbindMovement();
        var oldChannel = channel;
        channel = null;
        if (oldChannel && client) {
            try { await oldChannel.untrack(); } catch (_error) {}
            try { await client.removeChannel(oldChannel); } catch (_error) {}
        }
        currentPlayers.clear();
        positionCache.clear();
        renderPlayers();
    }

    async function exitArena(showMessage) {
        entered = false;
        connecting = false;
        await closeRoom();
        var lobby = byId('onlineArenaLobby');
        var stage = byId('onlineArenaStage');
        if (stage) stage.style.display = 'none';
        if (lobby) lobby.style.display = 'block';
        if (showMessage !== false) setLobbyStatus('Ты вышел с арены. Можно зайти снова.');
        client = null;
        activeUserId = null;
        canvas = null;
        ctx = null;
        var enter = byId('onlineArenaEnter');
        if (enter && showMessage !== false) enter.focus({ preventScroll: true });
    }

    function init() {
        var stage = byId('onlineArenaStage');
        if (stage && stage.parentElement !== document.body) document.body.appendChild(stage);
        var enter = byId('onlineArenaEnter');
        var exit = byId('onlineArenaExit');
        if (enter) enter.addEventListener('click', enterArena);
        if (exit) exit.addEventListener('click', function () { exitArena(true); });
        window.addEventListener('mb:auth-changed', function (event) {
            var nextUserId = event && event.detail ? event.detail.userId : null;
            if (entered && nextUserId !== activeUserId) {
                exitArena(false).then(function () { setLobbyStatus('Аккаунт изменился. Войди на арену заново.'); });
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();