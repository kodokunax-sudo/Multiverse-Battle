/* Multiverse Battle — realtime online arena presence and movement test. */
(function () {
    'use strict';

    var entered = false;
    var channel = null;
    var client = null;
    var activeUserId = null;
    var selfSessionId = createId();
    var playerName = 'Игрок';
    var x = 50;
    var y = 56;
    var currentPlayers = new Map();
    var positionCache = new Map();
    var lastMoveSentAt = 0;
    var keyHandler = null;
    var floorHandler = null;
    var connecting = false;

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
        var pane = document.querySelector('[data-online-pane="arena"]');
        return entered && !!stage && stage.style.display !== 'none' && !!pane && pane.classList.contains('active');
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
        return {
            session_id: selfSessionId,
            user_id: activeUserId,
            display_name: playerName,
            x: x,
            y: y,
            joined_at: Date.now()
        };
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
        if (!lobby || !stage) return;

        connecting = true;
        entered = true;
        client = context.client;
        activeUserId = context.user.id;
        playerName = resolvePlayerName(context);
        x = 25 + Math.random() * 50;
        y = 25 + Math.random() * 42;
        lastMoveSentAt = 0;
        positionCache.clear();
        currentPlayers.clear();
        lobby.style.display = 'none';
        stage.style.display = 'block';
        setStageStatus('Подключаемся к общей онлайн-комнате…');
        renderPlayers();

        try {
            await connectToRoom();
        } catch (error) {
            console.warn('[MB arena] Connection failed:', error);
            await closeRoom();
            entered = false;
            connecting = false;
            stage.style.display = 'none';
            lobby.style.display = 'block';
            setLobbyStatus('Не удалось подключиться к арене: ' + friendlyError(error));
            return;
        }
        connecting = false;
        bindMovement();
    }

    function friendlyError(error) {
        var message = error && error.message ? String(error.message) : String(error || '');
        if (/timed out|timeout|TIMED_OUT/i.test(message)) return 'истекло время подключения. Проверь интернет и настройки Realtime в Supabase.';
        if (/CHANNEL_ERROR|Unauthorized|permission|policy/i.test(message)) return 'Supabase Realtime отклонил подключение. Проверь разрешения публичных каналов в Realtime.';
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
                    config: {
                        presence: { key: selfSessionId },
                        broadcast: { self: false }
                    }
                });
                channel = ch;

                ch.on('presence', { event: 'sync' }, syncPresence);
                ch.on('presence', { event: 'join' }, syncPresence);
                ch.on('presence', { event: 'leave' }, syncPresence);
                ch.on('broadcast', { event: 'arena_move' }, function (message) {
                    var payload = message && message.payload;
                    if (!payload || !payload.session_id || payload.session_id === selfSessionId) return;
                    if (!currentPlayers.has(payload.session_id)) return;
                    positionCache.set(payload.session_id, {
                        x: clamp(Number(payload.x) || 50, 8, 92),
                        y: clamp(Number(payload.y) || 50, 12, 82)
                    });
                    var p = currentPlayers.get(payload.session_id);
                    p.x = positionCache.get(payload.session_id).x;
                    p.y = positionCache.get(payload.session_id).y;
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
                            setStageStatus('✅ Подключено. Игроки на этой арене видят друг друга и перемещения.');
                            done();
                        } catch (error) {
                            done(error);
                        }
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        done(err || new Error('Supabase Realtime: ' + status));
                    }
                });
            } catch (error) {
                done(error);
            }
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
                var player = {
                    session_id: meta.session_id,
                    user_id: meta.user_id,
                    display_name: String(meta.display_name || 'Игрок').slice(0, 24),
                    x: clamp(pos ? pos.x : (Number(meta.x) || 50), 8, 92),
                    y: clamp(pos ? pos.y : (Number(meta.y) || 50), 12, 82)
                };
                next.set(player.session_id, player);
            });
        });
        currentPlayers = next;
        positionCache.forEach(function (_position, id) {
            if (!currentPlayers.has(id)) positionCache.delete(id);
        });
        if (currentPlayers.has(selfSessionId)) {
            var me = currentPlayers.get(selfSessionId);
            me.x = x;
            me.y = y;
        }
        renderPlayers();
    }

    function renderPlayers() {
        var container = byId('onlineArenaPlayers');
        var roster = byId('onlineArenaRoster');
        var count = byId('onlineArenaPlayerCount');
        if (!container || !roster || !count) return;
        container.replaceChildren();
        roster.replaceChildren();
        var players = Array.from(currentPlayers.values()).sort(function (a, b) {
            if (a.session_id === selfSessionId) return -1;
            if (b.session_id === selfSessionId) return 1;
            return a.display_name.localeCompare(b.display_name);
        });
        count.textContent = '👥 ' + players.length + (players.length === 1 ? ' игрок' : players.length > 1 && players.length < 5 ? ' игрока' : ' игроков');
        if (!players.length) {
            var empty = document.createElement('span');
            empty.className = 'online-arena-roster-item';
            empty.textContent = 'Ожидаем игроков…';
            roster.appendChild(empty);
            return;
        }
        players.forEach(function (player) {
            var isSelf = player.session_id === selfSessionId;
            var marker = document.createElement('div');
            marker.className = 'online-arena-player' + (isSelf ? ' is-self' : '');
            marker.style.left = player.x + '%';
            marker.style.top = player.y + '%';
            marker.title = player.display_name + (isSelf ? ' (это ты)' : '');
            var avatar = document.createElement('span');
            avatar.className = 'online-arena-player-avatar';
            avatar.textContent = isSelf ? '🎮' : '👤';
            var name = document.createElement('strong');
            name.textContent = player.display_name;
            var label = document.createElement('small');
            label.textContent = isSelf ? 'ТЫ' : 'ИГРОК';
            marker.appendChild(avatar);
            marker.appendChild(name);
            marker.appendChild(label);
            container.appendChild(marker);

            var chip = document.createElement('span');
            chip.className = 'online-arena-roster-item' + (isSelf ? ' is-self' : '');
            chip.textContent = (isSelf ? '● ' : '○ ') + player.display_name;
            roster.appendChild(chip);
        });
    }

    function broadcastPosition() {
        if (!channel || !activeUserId) return;
        var now = Date.now();
        if (now - lastMoveSentAt < 75) return;
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
        }).catch(function (error) {
            console.warn('[MB arena] Move broadcast failed:', error);
        });
        renderPlayers();
    }

    function moveBy(dx, dy) {
        if (!arenaIsVisible()) return;
        x = clamp(x + dx, 8, 92);
        y = clamp(y + dy, 12, 82);
        broadcastPosition();
    }

    function moveToPointer(event) {
        if (!arenaIsVisible()) return;
        var floor = byId('onlineArenaFloor');
        if (!floor) return;
        var rect = floor.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        x = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
        y = clamp(((event.clientY - rect.top) / rect.height) * 100, 12, 82);
        broadcastPosition();
    }

    function bindMovement() {
        unbindMovement();
        keyHandler = function (event) {
            if (!arenaIsVisible()) return;
            var key = String(event.key || '').toLowerCase();
            var dx = 0, dy = 0;
            if (key === 'arrowleft' || key === 'a') dx = -2.5;
            else if (key === 'arrowright' || key === 'd') dx = 2.5;
            else if (key === 'arrowup' || key === 'w') dy = -2.5;
            else if (key === 'arrowdown' || key === 's') dy = 2.5;
            else return;
            event.preventDefault();
            moveBy(dx, dy);
        };
        floorHandler = function (event) { moveToPointer(event); };
        document.addEventListener('keydown', keyHandler);
        var floor = byId('onlineArenaFloor');
        if (floor) floor.addEventListener('pointerdown', floorHandler);
    }

    function unbindMovement() {
        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        var floor = byId('onlineArenaFloor');
        if (floor && floorHandler) floor.removeEventListener('pointerdown', floorHandler);
        keyHandler = null;
        floorHandler = null;
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
        if (connecting) {
            entered = false;
            connecting = false;
        }
        entered = false;
        await closeRoom();
        var lobby = byId('onlineArenaLobby');
        var stage = byId('onlineArenaStage');
        if (stage) stage.style.display = 'none';
        if (lobby) lobby.style.display = 'block';
        if (showMessage !== false) setLobbyStatus('Ты вышел с арены. Можно зайти снова.');
        client = null;
        activeUserId = null;
    }

    function init() {
        var enter = byId('onlineArenaEnter');
        var exit = byId('onlineArenaExit');
        if (enter) enter.addEventListener('click', enterArena);
        if (exit) exit.addEventListener('click', function () { exitArena(true); });
        window.addEventListener('mb:auth-changed', function (event) {
            var nextUserId = event && event.detail ? event.detail.userId : null;
            if (entered && nextUserId !== activeUserId) {
                exitArena(false).then(function () {
                    setLobbyStatus('Аккаунт изменился. Войди на арену заново.');
                });
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();