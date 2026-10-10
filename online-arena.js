/* Multiverse Battle — cooperative test instance of the original wave 500 Waystar fight. */
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
    var leaderSessionId = null;
    var activeFightId = null;
    var fightStarted = false;
    var fightHostSessionId = null;
    var applyingRemote = false;
    var lastMoveSentAt = 0;
    var lastSnapshotSentAt = 0;
    var lastFightPositionSentAt = 0;
    var lastRemoteRenderAt = 0;
    // Client-to-client RTT and render-rate diagnostics for co-op.
    var lastPingSentAt = 0;
    var pendingPingId = null;
    var pendingPingStartedAt = 0;
    var pingSequence = 0;
    var coopPingMs = null;
    var coopPingState = 'проверка';
    var lastFpsSampleAt = 0;
    var fpsFrameCount = 0;
    var coopFps = null;
    var snapshotSequence = 0;
    var lastAppliedSnapshotSequence = 0;
    var lastAppliedSnapshotSender = null;
    var victoryBroadcastForFightId = null;
    var seenEvents = new Set();
    var coopHazardCounter = 0;
    var consumedHazardIds = new Set();
    var lastHostHazardIds = new Set();
    var lastHostHazardSnapshot = new Map();
    var keyHandler = null;
    var pointerDownHandler = null;
    var pointerMoveHandler = null;
    var pointerUpHandler = null;
    var lobbyCanvas = null;
    var lobbyCtx = null;

    function byId(id) { return document.getElementById(id); }
    function createId() {
        try { if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID(); } catch (_error) {}
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 3 | 8)).toString(16);
        });
    }
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function preciseNow() {
        try {
            if (window.performance && typeof window.performance.now === 'function') return window.performance.now();
        } catch (_error) {}
        return Date.now();
    }
    function isLeader() { return !!leaderSessionId && leaderSessionId === selfSessionId; }
    function isFightVisible() {
        return fightStarted && !!byId('arenaOverlay') && byId('arenaOverlay').style.display !== 'none';
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
            joined_at: Date.now(),
            fight_id: activeFightId || null
        };
    }
    function friendlyError(error) {
        var message = error && error.message ? String(error.message) : String(error || '');
        if (/timed out|timeout|TIMED_OUT/i.test(message)) return 'истекло время подключения. Проверь интернет и настройки Realtime в Supabase.';
        if (/CHANNEL_ERROR|Unauthorized|permission|policy/i.test(message)) return 'Supabase Realtime отклонил подключение. Проверь настройки и права Realtime.';
        if (/network|fetch|offline/i.test(message)) return 'нет соединения с сервером. Проверь интернет.';
        return message || 'ошибка Realtime. Попробуй ещё раз.';
    }
    function sendEvent(event, payload) {
        if (!channel) return Promise.resolve(null);
        var packet = Object.assign({}, payload || {}, {
            sender_session_id: selfSessionId,
            sent_at: Date.now()
        });
        return channel.send({ type: 'broadcast', event: event, payload: packet }).catch(function (error) {
            console.warn('[MB co-op] Broadcast ' + event + ' failed:', error);
            return null;
        });
    }
    function markEvent(eventId) {
        if (!eventId) return true;
        if (seenEvents.has(eventId)) return false;
        seenEvents.add(eventId);
        if (seenEvents.size > 1200) {
            var first = seenEvents.values().next().value;
            if (first) seenEvents.delete(first);
        }
        return true;
    }
    function setRemoteAction(callback) {
        applyingRemote = true;
        try { callback(); } finally { applyingRemote = false; }
    }
    function getWaystarPhaseRank(state) {
        if (state === 'phase3') return 3;
        if (state === 'phase2' || state === 'returning_anim' || state === 'pre_phase3_dialog') return 2;
        return 1;
    }
    function safeCopy(obj, fields) {
        if (!obj || typeof obj !== 'object') return null;
        var result = {};
        fields.forEach(function (key) {
            if (obj[key] !== undefined && typeof obj[key] !== 'function') result[key] = obj[key];
        });
        return result;
    }
    function ensureHazardIds() {
        if (!isLeader() || !activeFightId) return;
        var lists = [window.waystarAttacks, window.waystarEnemyBullets, window.waystarBombs, window.waystarBombQueue];
        lists.forEach(function (list) {
            if (!Array.isArray(list)) return;
            list.forEach(function (hazard) {
                if (hazard && typeof hazard === 'object' && !hazard.__mb_coop_id) {
                    coopHazardCounter++;
                    hazard.__mb_coop_id = activeFightId + ':h' + coopHazardCounter;
                }
            });
        });
        if (window.waystarDash && typeof window.waystarDash === 'object' && !window.waystarDash.__mb_coop_id) {
            coopHazardCounter++;
            window.waystarDash.__mb_coop_id = activeFightId + ':h' + coopHazardCounter;
        }
    }
    function applyHazardArray(propertyName, incoming) {
        if (!Array.isArray(incoming)) return;
        var previous = Array.isArray(window[propertyName]) ? window[propertyName] : [];
        var previousById = new Map();
        var localFlags = new Map();
        previous.forEach(function (item) {
            if (!item || !item.__mb_coop_id) return;
            previousById.set(item.__mb_coop_id, item);
            localFlags.set(item.__mb_coop_id, {
                hit: item.hit === true,
                dioStandHitOnce: item.dioStandHitOnce === true
            });
        });
        var next = [];
        incoming.forEach(function (source) {
            if (!source || typeof source !== 'object') return;
            var id = source.__mb_coop_id;
            if (id && consumedHazardIds.has(id)) return;

            // Don't teleport guest-side projectiles to every 220ms host snapshot.
            // Ease their coordinates toward the authoritative host position instead.
            var item = source;
            var previousItem = id ? previousById.get(id) : null;
            if (previousItem) {
                item = Object.assign({}, source);
                ['x', 'y'].forEach(function (key) {
                    if (typeof previousItem[key] === 'number' && typeof source[key] === 'number') {
                        item[key] = previousItem[key] + (source[key] - previousItem[key]) * 0.58;
                    }
                });
            }
            if (id && localFlags.has(id)) {
                var flags = localFlags.get(id);
                if (flags.hit) item.hit = true;
                if (flags.dioStandHitOnce) item.dioStandHitOnce = true;
            }
            next.push(item);
        });
        window[propertyName] = next;
    }
    function onHazardConsumed(hazard) {
        if (!fightStarted || !hazard || !hazard.__mb_coop_id) return;
        consumedHazardIds.add(hazard.__mb_coop_id);
        if (consumedHazardIds.size > 800) {
            var first = consumedHazardIds.values().next().value;
            if (first) consumedHazardIds.delete(first);
        }
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
        lobbyCanvas = byId('onlineArenaBattleCanvas');
        if (!lobby || !stage || !lobbyCanvas) return;

        connecting = true;
        entered = true;
        client = context.client;
        activeUserId = context.user.id;
        playerName = resolvePlayerName(context);
        x = 24 + Math.random() * 52;
        y = 28 + Math.random() * 48;
        lastMoveSentAt = 0;
        currentPlayers.clear();
        lobby.style.display = 'none';
        stage.style.display = 'flex';
        if (stage.parentElement !== document.body) document.body.appendChild(stage);
        lobbyCtx = lobbyCanvas.getContext('2d');
        renderLobbyPlayers();
        setStageStatus('Подключаемся к комнате кооператива…');
        try {
            await connectToRoom();
            connecting = false;
            bindLobbyMovement();
            setStageStatus('✅ Ты в комнате. Дождись друга и начните босса 500 вместе.');
            updateStartButton();
        } catch (error) {
            console.warn('[MB co-op] Connection failed:', error);
            await closeRoom();
            entered = false;
            connecting = false;
            stage.style.display = 'none';
            lobby.style.display = 'block';
            setLobbyStatus('Не удалось подключиться к арене: ' + friendlyError(error));
        }
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
                // Application-level RTT: ping travels through Realtime to the peer,
                // and pong returns through the same channel. This is not ICMP ping.
                ch.on('broadcast', { event: 'arena_ping' }, function (message) {
                    var p = message && message.payload;
                    if (!p || !p.ping_id || p.target_session_id !== selfSessionId ||
                        p.sender_session_id === selfSessionId ||
                        !currentPlayers.has(p.sender_session_id)) return;
                    sendEvent('arena_pong', {
                        ping_id: p.ping_id,
                        target_session_id: p.sender_session_id
                    });
                });
                ch.on('broadcast', { event: 'arena_pong' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.target_session_id !== selfSessionId ||
                        p.sender_session_id === selfSessionId ||
                        !currentPlayers.has(p.sender_session_id) ||
                        !pendingPingId || p.ping_id !== pendingPingId) return;
                    coopPingMs = Math.max(0, Math.round(preciseNow() - pendingPingStartedAt));
                    coopPingState = 'ok';
                    pendingPingId = null;
                    pendingPingStartedAt = 0;
                    updateCoopHud();
                });
                ch.on('broadcast', { event: 'arena_move' }, function (message) {
                    var p = message && message.payload;
                    if (!p || !p.session_id || p.session_id === selfSessionId) return;
                    var other = currentPlayers.get(p.session_id);
                    if (!other) return;
                    other.x = clamp(Number(p.x) || 50, 8, 92);
                    other.y = clamp(Number(p.y) || 50, 8, 92);
                    renderLobbyPlayers();
                });
                ch.on('broadcast', { event: 'fight_start' }, function (message) {
                    var p = message && message.payload;
                    if (!p || !p.fight_id || p.sender_session_id === selfSessionId) return;
                    if (activeFightId === p.fight_id && fightStarted) return;
                    startLocalFight(p, true);
                });
                ch.on('broadcast', { event: 'fight_stop' }, function (message) {
                    var p = message && message.payload;
                    if (!p || !p.fight_id || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId) return;
                    finishCoopFight(false, 'Создатель комнаты остановил совместный бой.');
                });
                ch.on('broadcast', { event: 'fight_player_pos' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || !p.session_id || p.session_id === selfSessionId) return;
                    var other = currentPlayers.get(p.session_id);
                    if (!other) return;
                    var nextX = clamp(Number(p.x) || 200, 12, 388);
                    var nextY = clamp(Number(p.y) || 430, 70, 490);
                    // Keep the last rendered position and glide toward the newest network target.
                    // Snapping to every WebSocket packet makes movement visibly jitter on high ping.
                    if (typeof other.fightX !== 'number' || typeof other.fightY !== 'number') {
                        other.fightX = nextX; other.fightY = nextY;
                    }
                    other.targetFightX = nextX;
                    other.targetFightY = nextY;
                    if (p.combat_visuals && typeof p.combat_visuals === 'object') {
                        other.combatVisuals = p.combat_visuals;
                        other.combatVisualsReceivedAt = Date.now();
                    }
                    renderFightRoster();
                });
                ch.on('broadcast', { event: 'super_action' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId ||
                        !p.event_id || !markEvent(p.event_id)) return;
                    var other = currentPlayers.get(p.sender_session_id);
                    if (!other) return;
                    other.lastSuperName = String(p.super_name || 'SUPER').slice(0, 48);
                    other.lastSuperAt = Date.now();
                    // The host applies gameplay deltas from a guest's ultimate, then
                    // rebroadcasts the resulting authoritative state in the next snapshot.
                    if (isLeader() && p.hazard_effects) applySuperHazardEffects(p.hazard_effects);
                    if (p.combat_visuals && typeof p.combat_visuals === 'object') {
                        other.combatVisuals = p.combat_visuals;
                        other.combatVisualsReceivedAt = Date.now();
                    }
                });
                ch.on('broadcast', { event: 'boss_damage' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId || !markEvent(p.event_id)) return;
                    // Apply each other player's confirmed hit immediately on every client;
                    // the host still resolves phase transitions and periodic snapshots correct drift.
                    applyRemoteBossDamage(p);
                });
                ch.on('broadcast', { event: 'piece_hit' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId || !markEvent(p.event_id)) return;
                    // Only the room host edits the shared fragment HP; guests are updated by snapshots.
                    if (isLeader()) applyRemotePieceHit(p.index);
                });
                ch.on('broadcast', { event: 'fight_snapshot' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId) return;
                    if (leaderSessionId && p.sender_session_id !== leaderSessionId) return;
                    fightHostSessionId = p.sender_session_id;
                    applyFightSnapshot(p);
                });
                ch.on('broadcast', { event: 'dialog_progress' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId) return;
                    if (typeof window.waystarProgressDialog === 'function' && window.getWaystarActive && window.getWaystarActive()) {
                        setRemoteAction(function () { window.waystarProgressDialog(); });
                    }
                });
                ch.on('broadcast', { event: 'dialog_choice' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId) return;
                    if (typeof window.selectWaystarChoice === 'function' && window.getWaystarActive && window.getWaystarActive()) {
                        setRemoteAction(function () { window.selectWaystarChoice(Number(p.choice_id)); });
                    }
                });
                ch.on('broadcast', { event: 'final_choice' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId) return;
                    applyRemoteFinalChoice(p.choice);
                });
                ch.on('broadcast', { event: 'spare_advance' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId) return;
                    if (typeof window.advanceWaystarSpareDialog === 'function') {
                        setRemoteAction(function () { window.advanceWaystarSpareDialog(); });
                    }
                });
                ch.on('broadcast', { event: 'fight_victory' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId) return;
                    if (window.getWaystarActive && window.getWaystarActive() && !window.waystarFinalActive && typeof window.waystarVictory === 'function') {
                        setRemoteAction(function () { window.waystarVictory(); });
                    }
                });
                ch.subscribe(async function (status, err) {
                    if (settled) return;
                    if (status === 'SUBSCRIBED') {
                        try {
                            var tracked = await ch.track(makeSelfPresence());
                            if (tracked !== 'ok') throw new Error('Не удалось зарегистрироваться в комнате: ' + tracked);
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
                var prev = currentPlayers.get(meta.session_id);
                next.set(meta.session_id, {
                    session_id: meta.session_id,
                    user_id: meta.user_id,
                    display_name: String(meta.display_name || 'Игрок').slice(0, 24),
                    joined_at: Number(meta.joined_at) || Date.now(),
                    x: clamp(prev ? prev.x : (Number(meta.x) || 50), 8, 92),
                    y: clamp(prev ? prev.y : (Number(meta.y) || 50), 8, 92),
                    fightX: prev ? prev.fightX : null,
                    fightY: prev ? prev.fightY : null,
                    targetFightX: prev ? prev.targetFightX : null,
                    targetFightY: prev ? prev.targetFightY : null,
                    fight_id: meta.fight_id || null
                });
            });
        });
        currentPlayers = next;
        var ordered = Array.from(currentPlayers.values()).sort(function (a, b) {
            return a.joined_at - b.joined_at || a.session_id.localeCompare(b.session_id);
        });
        leaderSessionId = ordered.length ? ordered[0].session_id : null;
        if (currentPlayers.has(selfSessionId)) {
            var me = currentPlayers.get(selfSessionId);
            me.x = x; me.y = y;
        }
        renderLobbyPlayers();
        updateStartButton();
        updateCoopHud();
        // If the old room host has left, the next player becomes the snapshot/dialog leader.
        if (activeFightId && fightStarted && leaderSessionId === selfSessionId) {
            fightHostSessionId = selfSessionId;
        }
    }

    function drawHeart(ctx, px, py, color, size) {
        ctx.save();
        ctx.translate(px, py);
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.34);
        ctx.bezierCurveTo(-size * 0.12, size * 0.20, -size, -size * 0.02, -size, -size * 0.58);
        ctx.bezierCurveTo(-size, -size * 1.05, -size * 0.38, -size * 1.12, 0, -size * 0.65);
        ctx.bezierCurveTo(size * 0.38, -size * 1.12, size, -size * 1.05, size, -size * 0.58);
        ctx.bezierCurveTo(size, -size * 0.02, size * 0.12, size * 0.20, 0, size * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
    function playerColor(userId) {
        var hash = 0;
        String(userId || '').split('').forEach(function (ch) { hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0; });
        return 'hsl(' + (Math.abs(hash) % 360) + ',90%,65%)';
    }

    function renderLobbyPlayers() {
        if (!lobbyCanvas || !lobbyCtx || !entered || fightStarted) return;
        var ctx = lobbyCtx, w = lobbyCanvas.width, h = lobbyCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < 60; i++) {
            ctx.fillStyle = i % 4 === 0 ? 'rgba(230,210,255,.35)' : 'rgba(255,255,255,.13)';
            ctx.fillRect((i * 73 + 19) % w, (i * 137 + 31) % h, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
        }
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, w - 4, h - 4);
        ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.strokeRect(18, 18, w - 36, h - 36);
        var players = Array.from(currentPlayers.values()).sort(function (a, b) { return a.joined_at - b.joined_at; });
        players.forEach(function (p) {
            var px = p.x / 100 * w, py = p.y / 100 * h;
            var color = p.session_id === selfSessionId ? '#ff3030' : playerColor(p.user_id);
            drawHeart(ctx, px, py, color, 8.5);
            ctx.save(); ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            var label = String(p.display_name || 'Игрок').slice(0, 17);
            var width = ctx.measureText(label).width + 10;
            ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(clamp(px - width / 2, 3, w - width - 3), clamp(py - 27, 3, h - 20), width, 17);
            ctx.strokeStyle = color; ctx.strokeRect(clamp(px - width / 2, 3, w - width - 3), clamp(py - 27, 3, h - 20), width, 17);
            ctx.fillStyle = '#fff'; ctx.fillText(label, clamp(px, width / 2 + 3, w - width / 2 - 3), clamp(py - 18, 11, h - 12));
            ctx.restore();
        });
        renderFightRoster();
    }

    function renderFightRoster() {
        var roster = byId('onlineArenaRoster');
        var count = byId('onlineArenaPlayerCount');
        var list = Array.from(currentPlayers.values()).sort(function (a, b) { return a.joined_at - b.joined_at; });
        if (count) count.textContent = String(list.length);
        if (!roster) return;
        roster.replaceChildren();
        if (!list.length) {
            var waiting = document.createElement('span');
            waiting.className = 'online-arena-roster-item'; waiting.textContent = 'Ожидаем игроков…'; roster.appendChild(waiting); return;
        }
        list.forEach(function (p) {
            var chip = document.createElement('span');
            var mine = p.session_id === selfSessionId;
            chip.className = 'online-arena-roster-item' + (mine ? ' is-self' : '');
            chip.textContent = (mine ? '♥ Ты: ' : '♥ ') + p.display_name;
            roster.appendChild(chip);
        });
    }

    function updateStartButton() {
        var button = byId('onlineArenaStartBoss');
        if (!button) return;
        if (!entered || !channel) {
            button.disabled = true; button.textContent = 'Подключись к комнате'; return;
        }
        if (activeFightId && fightStarted) {
            button.disabled = true; button.textContent = '✅ Совместный бой уже идёт'; return;
        }
        if (currentPlayers.size < 2) {
            button.disabled = true; button.textContent = 'Ожидаем второго игрока…'; return;
        }
        if (!isLeader()) {
            button.disabled = true; button.textContent = 'Ожидаем создателя комнаты'; return;
        }
        button.disabled = false;
        button.textContent = '⚔️ Начать совместный бой с боссом 500';
    }

    function startCoopFight() {
        if (!entered || !channel || !isLeader() || currentPlayers.size < 2 || activeFightId || fightStarted) return;
        var damage = Math.max(1, Number(window.playerFinalDamage) || 100);
        // The room creator is the baseline player; each additional participant adds 50% HP.
        var partySize = Math.max(1, currentPlayers.size);
        var bossHpMultiplier = 1 + 0.5 * Math.max(0, partySize - 1);
        var maxHp = Math.round(Math.max(25000, damage * 120) * bossHpMultiplier);
        var packet = {
            fight_id: createId(),
            host_session_id: selfSessionId,
            boss_max_hp: maxHp,
            boss_hp: maxHp,
            boss_hp_multiplier: bossHpMultiplier,
            party_size: partySize,
            starter_name: playerName
        };
        activeFightId = packet.fight_id;
        fightHostSessionId = selfSessionId;
        victoryBroadcastForFightId = null;
        seenEvents.clear();
        consumedHazardIds.clear();
        lastHostHazardIds.clear();
        lastHostHazardSnapshot.clear();
        coopHazardCounter = 0;
        snapshotSequence = 0;
        lastAppliedSnapshotSequence = 0;
        lastAppliedSnapshotSender = null;
        sendEvent('fight_start', packet);
        startLocalFight(packet, false);
    }

    function startLocalFight(packet, remote) {
        if (!packet || !packet.fight_id) return;
        if (activeFightId === packet.fight_id && fightStarted && window.getWaystarActive && window.getWaystarActive()) return;
        if (fightStarted && activeFightId && activeFightId !== packet.fight_id) return;
        activeFightId = packet.fight_id;
        fightHostSessionId = packet.host_session_id || packet.sender_session_id || leaderSessionId;
        fightStarted = true;
        victoryBroadcastForFightId = null;
        consumedHazardIds.clear();
        lastHostHazardIds.clear();
        coopHazardCounter = 0;
        snapshotSequence = 0;
        lastAppliedSnapshotSequence = 0;
        lastAppliedSnapshotSender = null;
        lastSnapshotSentAt = 0;
        lastFightPositionSentAt = 0;
        lastRemoteRenderAt = 0;
        lastPingSentAt = 0;
        pendingPingId = null;
        pendingPingStartedAt = 0;
        coopPingMs = null;
        coopPingState = 'проверка';
        lastFpsSampleAt = 0;
        fpsFrameCount = 0;
        coopFps = null;
        var api = window.MBOnlineWaystar;
        if (api) {
            api.active = true;
            api.fightId = activeFightId;
            api.hostSessionId = fightHostSessionId;
            api.bossHpMultiplier = Math.max(1, Number(packet.boss_hp_multiplier) || 1);
            api.partySize = Math.max(1, Number(packet.party_size) || currentPlayers.size || 1);
        }
        var stage = byId('onlineArenaStage');
        if (stage) stage.style.display = 'none';
        try {
            if (typeof window.startWaystarFight !== 'function') throw new Error('Не загрузился исходный бой босса 500 (waystar_boss.js).');
            window.startWaystarFight();
            if (!(window.getWaystarActive && window.getWaystarActive())) throw new Error('Босс 500 не смог запуститься. Возможно, бой уже завершён в этом сохранении.');
            var hp = Math.max(25000, Number(packet.boss_max_hp) || 25000);
            if (typeof window.waystarBossMaxHp === 'number') window.waystarBossMaxHp = hp;
            if (typeof window.waystarBossHp === 'number') window.waystarBossHp = hp;
            if (window.waystarPlayer) {
                var me = currentPlayers.get(selfSessionId);
                if (me) {
                    me.fightX = window.waystarPlayer.x;
                    me.fightY = window.waystarPlayer.y;
                }
            }
            ensureCoopHud();
            updateCoopHud();
            if (remote) setStageStatus('Друг начал бой 500 — подключаемся к той же битве…');
            sendEvent('fight_player_pos', {
                fight_id: activeFightId,
                session_id: selfSessionId,
                x: Number(window.waystarPlayer && window.waystarPlayer.x) || 200,
                y: Number(window.waystarPlayer && window.waystarPlayer.y) || 430
            });
        } catch (error) {
            console.error('[MB co-op] Could not start Waystar fight:', error);
            fightStarted = false;
            activeFightId = null;
            if (api) { api.active = false; api.fightId = null; }
            if (stage) stage.style.display = 'flex';
            var lobbyAfterStartError = byId('onlineArenaLobby');
            if (lobbyAfterStartError) lobbyAfterStartError.style.display = 'block';
            setStageStatus('Не удалось запустить босса 500: ' + friendlyError(error));
        }
        updateStartButton();
    }

    function visualFields(item, fields) {
        if (!item || typeof item !== 'object') return null;
        var out = {};
        fields.forEach(function (key) {
            var value = item[key];
            if (typeof value === 'number' && isFinite(value)) out[key] = value;
            else if (typeof value === 'string' || typeof value === 'boolean') out[key] = value;
        });
        return out;
    }
    function visualList(list, fields, limit) {
        if (!Array.isArray(list)) return [];
        return list.slice(-limit).map(function (item) { return visualFields(item, fields); }).filter(Boolean);
    }
    function captureCombatVisuals() {
        var bullets = [];
        try {
            var sourceBullets = typeof window.getWaystarBullets === 'function' ? window.getWaystarBullets() : [];
            bullets = (Array.isArray(sourceBullets) ? sourceBullets.slice(-36) : []).map(function (bullet) {
                var item = visualFields(bullet, ['x','y','size','color','damage','life']) || {};
                item.trail = visualList(bullet && bullet.trail, ['x','y','life'], 4);
                return item;
            });
        } catch (_error) { bullets = []; }
        var s = null;
        try { if (typeof _superState !== 'undefined' && _superState) s = _superState; } catch (_error) {}
        if (!s) return { bullets: bullets, supers: null };
        var dash = visualFields(s.dekuDash, ['startX','startY','dirX','dirY','distance','traveled','life']);
        if (dash) dash.trail = visualList(s.dekuDash.trail, ['x','y','life'], 10);
        var flags = {};
        // Include every current and future boolean ultimate flag without serializing
        // mutable gameplay state such as cooldown objects or local collision arrays.
        Object.keys(s).forEach(function (key) {
            if (typeof s[key] === 'boolean') flags[key] = s[key];
        });
        flags.dioTimeStop = Math.max(0, Number(s.dioTimeStop) || 0);
        flags.dioTeleportStop = Math.max(0, Number(s.dioTeleportStop) || 0);
        flags.garpChargeTimer = Math.max(0, Number(s.garpChargeTimer) || 0);
        flags.garouInvulnTimer = Math.max(0, Number(s.garouInvulnTimer) || 0);
        flags.usoppStunTimer = Math.max(0, Number(s.usoppStunTimer) || 0);
        flags.dandyDarkness = Math.max(0, Number(s.dandyDarkness) || 0);
        flags.dandyAura = Math.max(0, Number(s.dandyAura) || 0);
        flags.dandyLava = Math.max(0, Number(s.dandyLava) || 0);
        flags.allmightBuffTimer = Math.max(0, Number(s.allmightBuffTimer) || 0);
        flags.kaidoScream = !!s.kaidoScream;
        flags.superName = (typeof _activeSuperName === 'string' ? _activeSuperName : '');
        return {
            bullets: bullets,
            supers: {
                flags: flags,
                rings: visualList(s.rings, ['x','y','radius','color','life','maxLife','width'], 18),
                fists: visualList(s.fists, ['x','y','size','life','color','owner','pathWidth'], 8),
                dekuFists: visualList(s.dekuFists, ['x','y','radius','active','delay','angle'], 12),
                dekuExplosions: visualList(s.dekuExplosions, ['x','y','life','maxLife'], 8),
                realityCracks: visualList(s.realityCracks, ['x','y','life','maxLife','angle','length','width'], 12),
                earthCracks: visualList(s.earthCracks, ['x','y','life','maxLife','angle','length','width'], 12),
                comicTexts: visualList(s.comicTexts, ['x','y','text','color','alpha','angle','scale'], 10),
                dioKnives: visualList(s.dioKnives, ['x','y','vx','vy','angle','life'], 12),
                borosHeal: !!s.borosHeal,
                dandyRoulette: visualFields(s.dandyRoulette, ['time','duration']),
                dandyShield: visualFields(s.dandyShield, ['timer','mult']),
                dandyVulnerable: visualFields(s.dandyVulnerable, ['timer','mult']),
                dekuDash: dash,
                garpImpact: { active: !!s.garpImpactActive, x: Number(s.garpImpactX)||0, y: Number(s.garpImpactY)||0, radius: Math.max(0,Number(s.garpImpactRadius)||0) },
                whitebeardTsunami: !!s.whitebeardTsunami,
                whitebeardTsunamiY: Number(s.whitebeardTsunamiY)||540,
                whitebeardSkillTsunamiActive: !!s.whitebeardSkillTsunamiActive,
                whitebeardSkillTsunamiY: Number(s.whitebeardSkillTsunamiY)||540,
                dioStand: { x:Number(s.dioStandX)||0, y:Number(s.dioStandY)||0, flash:Math.max(0,Number(s.dioStandFlash)||0) },
                garouMarker: visualFields(s.garouMarker, ['x','y','alpha'])
            }
        };
    }
    function drawRemoteCombatVisuals(ctx, player) {
        var packet = player && player.combatVisuals;
        if (!packet || !ctx) return;
        if (player.combatVisualsReceivedAt && Date.now() - player.combatVisualsReceivedAt > 1200) return;
        ctx.save();
        (Array.isArray(packet.bullets) ? packet.bullets : []).forEach(function (b) {
            if (!b || !isFinite(Number(b.x)) || !isFinite(Number(b.y))) return;
            var radius = clamp(Number(b.size)||4, 2, 14);
            var color = typeof b.color === 'string' ? b.color : '#00d4ff';
            (Array.isArray(b.trail) ? b.trail : []).forEach(function (t, i, arr) {
                ctx.globalAlpha = 0.12 + ((i+1)/Math.max(1,arr.length))*0.28;
                ctx.fillStyle = color; ctx.beginPath();
                ctx.arc(Number(t.x)||0,Number(t.y)||0,Math.max(1,radius*(i+1)/(arr.length+1)),0,Math.PI*2); ctx.fill();
            });
            ctx.globalAlpha = 1; ctx.shadowColor = color; ctx.shadowBlur = radius*3; ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(b.x,b.y,radius,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x,b.y,Math.max(1,radius*.38),0,Math.PI*2); ctx.fill();
        });
        var s = packet.supers;
        if (s) {
            (s.rings||[]).forEach(function(ring) {
                if (!ring) return;
                ctx.globalAlpha=clamp((Number(ring.life)||0)/Math.max(1,Number(ring.maxLife)||1),0,1)*.85;
                ctx.strokeStyle=typeof ring.color==='string'?ring.color:'#fff'; ctx.shadowColor=ctx.strokeStyle; ctx.shadowBlur=12;
                ctx.lineWidth=clamp(Number(ring.width)||2,1,10);
                ctx.beginPath();ctx.arc(Number(ring.x)||0,Number(ring.y)||0,Math.max(1,Number(ring.radius)||1),0,Math.PI*2);ctx.stroke();
            });
            ctx.globalAlpha=1;
            (s.fists||[]).forEach(function(f) {
                if(!f||(Number(f.life)||0)<=0)return;
                var color=typeof f.color==='string'?f.color:'#ff3333',size=clamp(Number(f.size)||24,8,100);
                ctx.globalAlpha=clamp((Number(f.life)||0)/16,.25,1);ctx.shadowColor=color;ctx.shadowBlur=18;ctx.fillStyle=color;
                ctx.beginPath();ctx.arc(Number(f.x)||0,Number(f.y)||0,size*.32,0,Math.PI*2);ctx.fill();
                ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(Number(f.x)||0,Number(f.y)||0,size*.45,0,Math.PI*2);ctx.stroke();
            });
            ctx.globalAlpha=1;
            (s.realityCracks||[]).forEach(function(crack) {
                if(!crack)return;
                ctx.globalAlpha=clamp((Number(crack.life)||0)/Math.max(1,Number(crack.maxLife)||30),0,1)*.75;
                ctx.strokeStyle='#c78bff';ctx.shadowColor='#a855f7';ctx.shadowBlur=12;ctx.lineWidth=clamp(Number(crack.width)||3,1,8);
                var cx=Number(crack.x)||0,cy=Number(crack.y)||0,ca=Number(crack.angle)||0,cl=clamp(Number(crack.length)||35,8,180);
                ctx.beginPath();ctx.moveTo(cx-Math.cos(ca)*cl/2,cy-Math.sin(ca)*cl/2);ctx.lineTo(cx,cy);ctx.lineTo(cx+Math.cos(ca)*cl/2,cy+Math.sin(ca)*cl/2);ctx.stroke();
            });
            (s.earthCracks||[]).forEach(function(crack) {
                if(!crack)return;
                ctx.globalAlpha=clamp((Number(crack.life)||0)/Math.max(1,Number(crack.maxLife)||30),0,1)*.75;
                ctx.strokeStyle='#44ff44';ctx.shadowColor='#22c55e';ctx.shadowBlur=10;ctx.lineWidth=clamp(Number(crack.width)||3,1,7);
                var cx=Number(crack.x)||0,cy=Number(crack.y)||0,ca=Number(crack.angle)||Math.PI/2,cl=clamp(Number(crack.length)||40,8,180);
                ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ca)*cl,cy+Math.sin(ca)*cl);ctx.stroke();
            });
            (s.comicTexts||[]).forEach(function(t) {
                if(!t||!t.text)return;
                ctx.globalAlpha=clamp(Number(t.alpha)||.8,0,1);ctx.font='bold 12px Impact,Arial Black,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
                ctx.lineWidth=3;ctx.strokeStyle='#111';ctx.strokeText(String(t.text).slice(0,24),Number(t.x)||0,Number(t.y)||0);
                ctx.fillStyle=typeof t.color==='string'?t.color:'#ffd700';ctx.fillText(String(t.text).slice(0,24),Number(t.x)||0,Number(t.y)||0);
            });
            if(s.dekuDash && Number(s.dekuDash.life)>0) {
                var dashX=(Number(s.dekuDash.startX)||0)+(Number(s.dekuDash.dirX)||0)*(Number(s.dekuDash.traveled)||0);
                var dashY=(Number(s.dekuDash.startY)||0)+(Number(s.dekuDash.dirY)||0)*(Number(s.dekuDash.traveled)||0);
                ctx.globalAlpha=.7;ctx.strokeStyle='#44ff44';ctx.shadowColor='#44ff44';ctx.shadowBlur=22;ctx.lineWidth=14;
                ctx.beginPath();ctx.moveTo(Number(s.dekuDash.startX)||0,Number(s.dekuDash.startY)||0);ctx.lineTo(dashX,dashY);ctx.stroke();
            }
            (s.dioKnives||[]).forEach(function(k) {
                if(!k||(Number(k.life)||0)<=0)return;
                ctx.save();ctx.translate(Number(k.x)||0,Number(k.y)||0);ctx.rotate(Number(k.angle)||Math.atan2(Number(k.vy)||0,Number(k.vx)||0));
                ctx.shadowColor='#e8eaff';ctx.shadowBlur=10;ctx.fillStyle='#f5f7ff';ctx.strokeStyle='#a7b8df';ctx.lineWidth=1;
                ctx.beginPath();ctx.moveTo(-8,-2);ctx.lineTo(5,-2);ctx.lineTo(10,0);ctx.lineTo(5,2);ctx.lineTo(-8,2);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
            });
            (s.dekuExplosions||[]).forEach(function(e) {
                if(!e)return;var life=clamp((Number(e.life)||0)/Math.max(.01,Number(e.maxLife)||.55),0,1);
                ctx.globalAlpha=life*.7;ctx.strokeStyle='#44ff44';ctx.shadowColor='#44ff44';ctx.shadowBlur=16;ctx.lineWidth=4;
                ctx.beginPath();ctx.arc(Number(e.x)||0,Number(e.y)||0,Math.max(2,40*(1-life)),0,Math.PI*2);ctx.stroke();
            });
            (s.dekuFists||[]).forEach(function(f) {
                if(!f||!f.active)return;
                ctx.globalAlpha=.8;ctx.strokeStyle='#ff3333';ctx.shadowColor='#f00';ctx.shadowBlur=16;ctx.lineWidth=4;
                ctx.beginPath();ctx.arc(Number(f.x)||0,Number(f.y)||0,clamp(Number(f.radius)||25,8,70),0,Math.PI*2);ctx.stroke();
            });
            if(s.dekuDash&&Array.isArray(s.dekuDash.trail))s.dekuDash.trail.forEach(function(t) {
                ctx.globalAlpha=clamp((Number(t.life)||0)/.3,.08,.6);ctx.fillStyle='#44ff44';ctx.shadowColor='#44ff44';ctx.shadowBlur=12;
                ctx.beginPath();ctx.arc(Number(t.x)||0,Number(t.y)||0,6,0,Math.PI*2);ctx.fill();
            });
            if(s.garpImpact&&s.garpImpact.active) {
                var gr=clamp(Number(s.garpImpact.radius)||0,0,260);ctx.globalAlpha=clamp(1-gr/280,.05,.8);
                ctx.strokeStyle='#ff44ff';ctx.shadowColor='#ff44ff';ctx.shadowBlur=24;ctx.lineWidth=10;
                ctx.beginPath();ctx.arc(Number(s.garpImpact.x)||0,Number(s.garpImpact.y)||0,Math.max(2,gr),0,Math.PI*2);ctx.stroke();
            }
            if(s.whitebeardTsunami||s.whitebeardSkillTsunamiActive) {
                var wy=s.whitebeardSkillTsunamiActive?Number(s.whitebeardSkillTsunamiY):Number(s.whitebeardTsunamiY);
                if(isFinite(wy)&&wy>-80&&wy<560) {
                    ctx.globalAlpha=.55;ctx.fillStyle='#00cfff';ctx.shadowColor='#00cfff';ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(0,wy);
                    for(var wx=0;wx<=400;wx+=20)ctx.lineTo(wx,wy+Math.sin(wx/24+Date.now()/160)*14);
                    ctx.lineTo(400,wy+45);ctx.lineTo(0,wy+45);ctx.closePath();ctx.fill();
                }
            }
            var f=s.flags||{};
            var auraSpecs=[
                {on:f.dekusActive||f.dekuSmashActive||f.allmightHurricane,color:'#44ff44'},
                {on:f.antispiralActive||f.antispiralFrozen,color:'#aaddff'},
                {on:f.nikaActive,color:'#ffffff'},
                {on:f.garpHakiActive||Number(f.garpChargeTimer)>0||f.garpImpactActive,color:'#ff55dd'},
                {on:Number(f.dioTimeStop)>0||Number(f.dioTeleportStop)>0||f.dioMudaActive,color:'#ffdd77'},
                {on:f.whitebeardTimeStop||f.whitebeardCharging||f.whitebeardTsunami||f.whitebeardSkillTsunamiActive,color:'#00ccff'},
                {on:f.allmightDebuffActive||f.allmightPermaSlow||f.markBuffActive,color:'#ffd700'},
                {on:f.dandyLightnings||f.dandyInvuln||Number(f.dandyAura)>0||f.imAuraActive,color:'#bc66ff'},
                {on:f.garouTimeStop||Number(f.garouInvulnTimer)>0||f.usoppInvuln||Number(f.usoppStunTimer)>0,color:'#ff4444'},
                {on:f.kaidoBuffActive||f.kaidoDrinking||f.kaidoScream,color:'#ff8a36'},
                {on:f.borosParticles||s.borosHeal,color:'#72ff8c'}
            ].filter(function(spec){return !!spec.on;}).slice(0,4);
            var px=Number(player.fightX)||200,py=Number(player.fightY)||430;
            auraSpecs.forEach(function(spec,index) {
                ctx.globalAlpha=.72+Math.sin(Date.now()/85+index)*.16;
                ctx.strokeStyle=spec.color;ctx.shadowColor=spec.color;ctx.shadowBlur=14;ctx.lineWidth=3;
                ctx.beginPath();ctx.arc(px,py,17+index*5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
            });
            var superLabel = String(player.lastSuperName || f.superName || '');
            if(superLabel && Date.now()-(player.lastSuperAt||0)<1300) {
                ctx.globalAlpha=clamp(1-(Date.now()-(player.lastSuperAt||0))/1300,.2,1);
                ctx.font='bold 10px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
                ctx.fillStyle='#fff';ctx.strokeStyle='#111';ctx.lineWidth=3;
                var tag='⚡ '+superLabel.slice(0,32);
                ctx.strokeText(tag,px,py-34);ctx.fillText(tag,px,py-34);ctx.globalAlpha=1;
            }
            if(s.dioStand&&Number(s.dioStand.flash)>.02) {
                ctx.globalAlpha=clamp(Number(s.dioStand.flash)*1.6,.15,1);ctx.fillStyle='#e7d1ff';ctx.shadowColor='#cba5ff';ctx.shadowBlur=20;
                ctx.beginPath();ctx.ellipse(Number(s.dioStand.x)||0,(Number(s.dioStand.y)||0)-25,10,16,0,0,Math.PI*2);ctx.fill();
                ctx.strokeStyle='#ffe6a3';ctx.lineWidth=2;ctx.stroke();
            }
            if(s.garouMarker&&Number(s.garouMarker.alpha)>0) {
                ctx.globalAlpha=clamp(Number(s.garouMarker.alpha),0,1);ctx.strokeStyle='#ff8800';ctx.shadowColor='#ff8800';ctx.shadowBlur=12;ctx.lineWidth=3;
                ctx.beginPath();ctx.arc(Number(s.garouMarker.x)||0,Number(s.garouMarker.y)||0,30,0,Math.PI*2);ctx.stroke();
            }
        }
        ctx.restore();
    }

    function applyRemoteBossDamage(packet) {
        if (!window.getWaystarActive || !window.getWaystarActive()) return;
        var amount = Math.max(0, Math.floor(Number(packet.damage) || 0));
        if (!amount || typeof window.waystarBossHp !== 'number') return;
        window.waystarBossHp -= amount;
        if (packet.phase === 'phase1' && typeof window.waystarBossMaxHp === 'number') {
            window.waystarBossHp = Math.max(window.waystarBossMaxHp * 0.5, window.waystarBossHp);
        }
        if (window.waystarBossHp < 0 && window.waystarState !== 'phase3') window.waystarBossHp = 0;
        if (window.waystarState === 'phase3' && window.waystarBossHp <= 0 && typeof window.waystarVictory === 'function' && !window.waystarFinalActive) {
            // The room leader announces the shared victory; followers wait for that event.
            if (isLeader()) window.waystarVictory();
        }
    }

    function applyRemotePieceHit(index) {
        var pieces = window.waystarPieces;
        var i = Math.floor(Number(index));
        if (!Array.isArray(pieces) || i < 0 || i >= pieces.length) return;
        var piece = pieces[i];
        if (!piece || !piece.alive) return;
        piece.hp = Math.max(0, (Number(piece.hp) || 0) - 1);
        if (piece.hp <= 0) {
            piece.alive = false;
            if (typeof window.spawnWaystarParticles === 'function') window.spawnWaystarParticles(piece.x, piece.y, 10, '#ff00ff', 4);
        }
        if (Array.isArray(pieces)) window.waystarPiecesAlive = pieces.filter(function (p) { return p && p.alive; }).length;
    }

    function applyRemoteFinalChoice(choice) {
        if (!window.waystarFinalActive) return;
        setRemoteAction(function () {
            window.waystarChoiceSelection = choice === 'spare' ? 'spare' : 'kill';
            window.waystarFinalTimer = 0;
            if (choice === 'spare') {
                window.waystarFinalPhase = 'spare_dialog';
                window.waystarSpareDialogStep = 0;
                window.waystarSpareDialogTimer = 0;
                if (typeof window.setupWaystarSpareDialog === 'function') window.setupWaystarSpareDialog();
            } else {
                window.waystarFinalPhase = 'kill_flash';
                window.waystarScreenFlash = 40;
                window.waystarScreenFlashColor = '#ffffff';
                window.waystarShake = 30;
            }
        });
    }

    var SUPER_SYNC_HAZARD_FIELDS = [
        'spd', 'spdX', 'spdY', 'vx', 'vy', 'speed', 'speedX', 'speedY',
        'gravity', '_whitebeardPushTimer', '_wbTsunamiHitId', 'frozen',
        'isFrozen', 'freezeTimer', 'stunTimer', 'timeStopped'
    ];

    function collectSnapshotHazardState(packet) {
        var map = new Map();
        [
            ['attacks', 'waystarAttacks'],
            ['enemy_bullets', 'waystarEnemyBullets'],
            ['bombs', 'waystarBombs'],
            ['bomb_queue', 'waystarBombQueue']
        ].forEach(function (pair) {
            var list = packet && packet[pair[0]];
            if (!Array.isArray(list)) return;
            list.forEach(function (hazard) {
                if (!hazard || !hazard.__mb_coop_id) return;
                var values = {};
                SUPER_SYNC_HAZARD_FIELDS.forEach(function (key) {
                    if (typeof hazard[key] === 'number' && isFinite(hazard[key])) values[key] = hazard[key];
                    else if (typeof hazard[key] === 'boolean') values[key] = hazard[key];
                });
                map.set(hazard.__mb_coop_id, { list: pair[1], values: values });
            });
        });
        if (packet && packet.dash && packet.dash.__mb_coop_id) {
            var dashValues = {};
            SUPER_SYNC_HAZARD_FIELDS.forEach(function (key) {
                if (typeof packet.dash[key] === 'number' && isFinite(packet.dash[key])) dashValues[key] = packet.dash[key];
                else if (typeof packet.dash[key] === 'boolean') dashValues[key] = packet.dash[key];
            });
            map.set(packet.dash.__mb_coop_id, { list: 'waystarDash', values: dashValues });
        }
        return map;
    }

    function getLiveHazardObjects() {
        var map = new Map();
        ['waystarAttacks', 'waystarEnemyBullets', 'waystarBombs', 'waystarBombQueue'].forEach(function (name) {
            var list = window[name];
            if (!Array.isArray(list)) return;
            list.forEach(function (hazard) {
                if (hazard && hazard.__mb_coop_id) map.set(hazard.__mb_coop_id, { list: name, object: hazard });
            });
        });
        if (window.waystarDash && window.waystarDash.__mb_coop_id) {
            map.set(window.waystarDash.__mb_coop_id, { list: 'waystarDash', object: window.waystarDash });
        }
        return map;
    }

    function captureSuperHazardEffects() {
        var live = getLiveHazardObjects();
        var removed = [];
        var updates = [];
        lastHostHazardSnapshot.forEach(function (base, id) {
            var entry = live.get(id);
            if (!entry) {
                // A hazard that already hit/was consumed locally must not despawn for everyone.
                if (!consumedHazardIds.has(id)) removed.push(id);
                return;
            }
            var changed = {};
            SUPER_SYNC_HAZARD_FIELDS.forEach(function (key) {
                var before = base.values && base.values[key];
                var after = entry.object[key];
                if (before === undefined) return;
                if (typeof after === 'number' && isFinite(after) && Math.abs(after - before) > 0.001) changed[key] = after;
                else if (typeof after === 'boolean' && after !== before) changed[key] = after;
            });
            if (Object.keys(changed).length) updates.push({ id: id, list: entry.list, values: changed });
        });
        return { removed_ids: removed.slice(0, 100), updates: updates.slice(0, 100) };
    }

    function applySuperHazardEffects(effects) {
        if (!effects || typeof effects !== 'object') return;
        var removed = new Set(Array.isArray(effects.removed_ids) ? effects.removed_ids.filter(function (id) {
            return typeof id === 'string' && id.length < 180;
        }).slice(0, 100) : []);
        ['waystarAttacks', 'waystarEnemyBullets', 'waystarBombs', 'waystarBombQueue'].forEach(function (name) {
            if (!Array.isArray(window[name])) return;
            window[name] = window[name].filter(function (hazard) {
                if (!hazard || !removed.has(hazard.__mb_coop_id)) return true;
                consumedHazardIds.add(hazard.__mb_coop_id);
                return false;
            });
        });
        if (window.waystarDash && removed.has(window.waystarDash.__mb_coop_id)) {
            consumedHazardIds.add(window.waystarDash.__mb_coop_id);
            window.waystarDash = null;
        }
        var live = getLiveHazardObjects();
        (Array.isArray(effects.updates) ? effects.updates : []).slice(0, 100).forEach(function (update) {
            if (!update || typeof update.id !== 'string' || !update.values || typeof update.values !== 'object') return;
            var entry = live.get(update.id);
            if (!entry) return;
            SUPER_SYNC_HAZARD_FIELDS.forEach(function (key) {
                var value = update.values[key];
                if (typeof value === 'number' && isFinite(value)) entry.object[key] = value;
                else if (typeof value === 'boolean') entry.object[key] = value;
            });
        });
        if (consumedHazardIds.size > 800) {
            var extra = consumedHazardIds.size - 800;
            consumedHazardIds.forEach(function (id) {
                if (extra <= 0) return;
                consumedHazardIds.delete(id);
                extra--;
            });
        }
    }

    function collectLiveHazardIds() {
        var ids = new Set();
        ['waystarAttacks', 'waystarEnemyBullets', 'waystarBombs', 'waystarBombQueue'].forEach(function (name) {
            var list = window[name];
            if (!Array.isArray(list)) return;
            list.forEach(function (hazard) {
                if (hazard && hazard.__mb_coop_id) ids.add(hazard.__mb_coop_id);
            });
        });
        if (window.waystarDash && window.waystarDash.__mb_coop_id) ids.add(window.waystarDash.__mb_coop_id);
        return ids;
    }

    function snapshotHazardIds(packet) {
        var ids = new Set();
        [['attacks', 'waystarAttacks'], ['enemy_bullets', 'waystarEnemyBullets'],
            ['bombs', 'waystarBombs'], ['bomb_queue', 'waystarBombQueue']].forEach(function (pair) {
            var list = packet[pair[0]];
            if (!Array.isArray(list)) return;
            list.forEach(function (hazard) {
                if (hazard && hazard.__mb_coop_id) ids.add(hazard.__mb_coop_id);
            });
        });
        if (packet.dash && packet.dash.__mb_coop_id) ids.add(packet.dash.__mb_coop_id);
        return ids;
    }

    function preserveLocalHazardRemovals(packet) {
        lastHostHazardSnapshot = collectSnapshotHazardState(packet || {});
        if (isLeader()) {
            lastHostHazardIds = snapshotHazardIds(packet);
            return;
        }
        // A guest's SUPER may locally clear/freeze/deflect hazards. Remember hazards
        // removed since the previous host snapshot so a later snapshot doesn't respawn them.
        var liveNow = collectLiveHazardIds();
        lastHostHazardIds.forEach(function (id) {
            if (!liveNow.has(id)) consumedHazardIds.add(id);
        });
        lastHostHazardIds = snapshotHazardIds(packet);
        if (consumedHazardIds.size > 800) {
            var excess = consumedHazardIds.size - 800;
            consumedHazardIds.forEach(function (id) {
                if (excess <= 0) return;
                consumedHazardIds.delete(id);
                excess--;
            });
        }
    }

    function applyFightSnapshot(packet) {
        if (!window.getWaystarActive || !window.getWaystarActive()) return;
        // Ignore stale snapshots if network packets arrive out of order.
        var incomingSequence = Number(packet.snapshot_seq) || 0;
        var incomingSender = packet.sender_session_id || null;
        if (incomingSender && incomingSender !== lastAppliedSnapshotSender) {
            lastAppliedSnapshotSender = incomingSender;
            lastAppliedSnapshotSequence = 0;
        }
        if (incomingSequence && incomingSequence <= lastAppliedSnapshotSequence) return;
        if (incomingSequence) lastAppliedSnapshotSequence = incomingSequence;
        preserveLocalHazardRemovals(packet);
        if (typeof packet.boss_hp === 'number') window.waystarBossHp = packet.boss_hp;
        if (typeof packet.boss_max_hp === 'number') window.waystarBossMaxHp = packet.boss_max_hp;
        if (window.MBOnlineWaystar) {
            if (typeof packet.boss_hp_multiplier === 'number') window.MBOnlineWaystar.bossHpMultiplier = Math.max(1, packet.boss_hp_multiplier);
            if (typeof packet.party_size === 'number') window.MBOnlineWaystar.partySize = Math.max(1, packet.party_size);
        }
        if (typeof packet.rage === 'boolean') window.waystarRageMode = packet.rage;
        if (typeof packet.escalation === 'number') window.waystarEscalationLevel = packet.escalation;

        var state = String(packet.state || '');
        var targetRank = Number(packet.phase) || getWaystarPhaseRank(state);
        var localState = String(window.waystarState || '');
        var localRank = getWaystarPhaseRank(localState);
        // The leader determines phase progression, so clients cannot become stuck on a local phase.
        if (targetRank >= 2 && localRank < 2 && typeof window.waystarStartPhase2 === 'function') {
            setRemoteAction(function () { window.waystarStartPhase2(); });
        }
        if (targetRank >= 3 && localRank < 3 && typeof window.waystarStartPhase3 === 'function') {
            setRemoteAction(function () { window.waystarStartPhase3(); });
        }

        function applyObject(targetName, data, fields) {
            var target = window[targetName];
            if (!target || !data) return;
            fields.forEach(function (key) {
                if (data[key] === undefined) return;
                // Smooth position reconciliation on the joining client; hard snaps every
                // network snapshot made the boss itself visibly stutter for remote players.
                if ((key === 'x' || key === 'y') &&
                    typeof target[key] === 'number' && typeof data[key] === 'number') {
                    target[key] += (data[key] - target[key]) * 0.58;
                } else {
                    target[key] = data[key];
                }
            });
        }
        applyObject('waystarBoss', packet.boss, ['x','y','size','vx','rotation','pulse','time','alpha']);
        applyObject('waystarBoss2', packet.boss2, ['x','y','size','vx','rotation','pulse','alpha','active']);
        applyObject('waystarSmallBoss', packet.small_boss, ['x','y','size','rotation','pulse','time','alpha']);
        // Mirror the original boss's live hazards from the room host so both clients
        // see the same meteor/laser/bomb/Invader attack pattern.
        applyHazardArray('waystarAttacks', packet.attacks);
        applyHazardArray('waystarEnemyBullets', packet.enemy_bullets);
        applyHazardArray('waystarBombs', packet.bombs);
        applyHazardArray('waystarBombQueue', packet.bomb_queue);
        if (packet.dash && typeof packet.dash === 'object') {
            var previousDash = window.waystarDash;
            var dash = packet.dash;
            if (previousDash && previousDash.__mb_coop_id && previousDash.__mb_coop_id === dash.__mb_coop_id && previousDash.hit) dash.hit = true;
            window.waystarDash = (dash.__mb_coop_id && consumedHazardIds.has(dash.__mb_coop_id)) ? null : dash;
        } else if (packet.dash === null) window.waystarDash = null;
        if (typeof packet.attack_timer === 'number') window.waystarAttackTimer = packet.attack_timer;
        if (typeof packet.type_timer === 'number') window.waystarTypeTimer = packet.type_timer;
        if (typeof packet.attack_type === 'number') window.waystarAttackType = packet.attack_type;
        if (typeof packet.blind_timer === 'number') window.waystarBlindTimer = packet.blind_timer;
        if (typeof packet.blind_total_timer === 'number') window.waystarBlindTotalTimer = packet.blind_total_timer;
        if (typeof packet.blind_flash === 'number') window.waystarBlindFlash = packet.blind_flash;
        if (packet.blind_phase !== undefined) window.waystarBlindPhase = packet.blind_phase;
        if (Array.isArray(packet.blind_warnings)) window.waystarBlindWarnings = packet.blind_warnings;
        if (typeof packet.invader_shoot_timer === 'number') window.waystarInvaderShootTimer = packet.invader_shoot_timer;
        if (typeof packet.return_timer === 'number') window.waystarReturnTimer = packet.return_timer;
        if (packet.split_anim !== undefined) window.waystarSplitAnim = packet.split_anim;
        if (packet.escape_anim !== undefined) window.waystarEscapeAnim = packet.escape_anim;
        if (targetRank === 2 && Array.isArray(packet.pieces) && Array.isArray(window.waystarPieces) && window.waystarPieces.length === packet.pieces.length) {
            packet.pieces.forEach(function (source, index) {
                var target = window.waystarPieces[index];
                if (!target || !source) return;
                ['x','y','hp','alive','pulse'].forEach(function (key) {
                    if (source[key] === undefined) return;
                    if ((key === 'x' || key === 'y') &&
                        typeof target[key] === 'number' && typeof source[key] === 'number') {
                        target[key] += (source[key] - target[key]) * 0.58;
                    } else {
                        target[key] = source[key];
                    }
                });
            });
            if (typeof packet.pieces_alive === 'number') window.waystarPiecesAlive = packet.pieces_alive;
            if (typeof packet.invader_dir === 'number') window.waystarInvaderDir = packet.invader_dir;
        }
        if (packet.final_active && !window.waystarFinalActive && typeof window.waystarVictory === 'function') {
            setRemoteAction(function () { window.waystarVictory(); });
        }
        if (packet.final_active && window.waystarFinalActive) {
            if (packet.final_phase) window.waystarFinalPhase = packet.final_phase;
            if (typeof packet.final_timer === 'number') window.waystarFinalTimer = packet.final_timer;
            if (packet.choice !== undefined) window.waystarChoiceSelection = packet.choice;
            if (typeof packet.spare_step === 'number') window.waystarSpareDialogStep = packet.spare_step;
        }
    }

    function cloneSnapshotArray(value, resetLocalHitFlags) {
        if (!Array.isArray(value)) return null;
        try {
            var copy = JSON.parse(JSON.stringify(value));
            if (resetLocalHitFlags) copy.forEach(function (item) {
                if (item && typeof item === 'object') {
                    delete item.dioStandHitOnce;
                    if (Object.prototype.hasOwnProperty.call(item, 'hit')) item.hit = false;
                }
            });
            return copy;
        } catch (_error) { return []; }
    }
    function cloneSnapshotObject(value, resetLocalHitFlags) {
        if (!value || typeof value !== 'object') return null;
        try {
            var copy = JSON.parse(JSON.stringify(value));
            if (resetLocalHitFlags) {
                delete copy.dioStandHitOnce;
                if (Object.prototype.hasOwnProperty.call(copy, 'hit')) copy.hit = false;
            }
            return copy;
        } catch (_error) { return null; }
    }
    function buildFightSnapshot() {
        var state = String(window.waystarState || 'dialogue');
        var pieces = Array.isArray(window.waystarPieces) ? window.waystarPieces.map(function (p) {
            return { x:p.x, y:p.y, hp:p.hp, alive:p.alive, pulse:p.pulse };
        }) : null;
        return {
            fight_id: activeFightId,
            state: state,
            phase: getWaystarPhaseRank(state),
            boss_hp: Number(window.waystarBossHp) || 0,
            boss_max_hp: Number(window.waystarBossMaxHp) || 25000,
            boss_hp_multiplier: window.MBOnlineWaystar ? Math.max(1, Number(window.MBOnlineWaystar.bossHpMultiplier) || 1) : 1,
            party_size: window.MBOnlineWaystar ? Math.max(1, Number(window.MBOnlineWaystar.partySize) || 1) : 1,
            boss: safeCopy(window.waystarBoss, ['x','y','size','vx','rotation','pulse','time','alpha']),
            boss2: safeCopy(window.waystarBoss2, ['x','y','size','vx','rotation','pulse','alpha','active']),
            small_boss: safeCopy(window.waystarSmallBoss, ['x','y','size','rotation','pulse','time','alpha']),
            rage: !!window.waystarRageMode,
            escalation: Number(window.waystarEscalationLevel) || 0,
            pieces: pieces,
            pieces_alive: Number(window.waystarPiecesAlive) || 0,
            invader_dir: Number(window.waystarInvaderDir) || 1,
            attacks: cloneSnapshotArray(window.waystarAttacks, true),
            enemy_bullets: cloneSnapshotArray(window.waystarEnemyBullets, false),
            bombs: cloneSnapshotArray(window.waystarBombs, true),
            bomb_queue: cloneSnapshotArray(window.waystarBombQueue, false),
            dash: cloneSnapshotObject(window.waystarDash, true),
            attack_timer: Number(window.waystarAttackTimer) || 0,
            attack_type: Number(window.waystarAttackType) || 0,
            type_timer: Number(window.waystarTypeTimer) || 0,
            blind_phase: window.waystarBlindPhase === undefined ? null : window.waystarBlindPhase,
            blind_timer: Number(window.waystarBlindTimer) || 0,
            blind_total_timer: Number(window.waystarBlindTotalTimer) || 0,
            blind_flash: Number(window.waystarBlindFlash) || 0,
            blind_warnings: cloneSnapshotArray(window.waystarBlindWarnings, false),
            invader_shoot_timer: Number(window.waystarInvaderShootTimer) || 0,
            return_timer: Number(window.waystarReturnTimer) || 0,
            split_anim: cloneSnapshotObject(window.waystarSplitAnim, false),
            escape_anim: cloneSnapshotObject(window.waystarEscapeAnim, false),
            dialog_active: !!window.waystarDialogActive,
            dialog_step: Number(window.waystarDialogStep) || 0,
            final_active: !!window.waystarFinalActive,
            final_phase: window.waystarFinalPhase || null,
            final_timer: Number(window.waystarFinalTimer) || 0,
            choice: window.waystarChoiceSelection === undefined ? null : window.waystarChoiceSelection,
            spare_step: Number(window.waystarSpareDialogStep) || 0
        };
    }

    function onSuperAction(superName) {
        if (!fightStarted || !activeFightId || !channel) return;
        sendEvent('super_action', {
            fight_id: activeFightId,
            event_id: createId(),
            super_name: String(superName || 'SUPER').slice(0, 48),
            hazard_effects: captureSuperHazardEffects(),
            combat_visuals: captureCombatVisuals()
        });
    }

    function onBossDamage(damage, phase) {
        if (!fightStarted || !activeFightId || applyingRemote) return;
        sendEvent('boss_damage', {
            fight_id: activeFightId,
            event_id: createId(),
            damage: Math.max(0, Math.floor(Number(damage) || 0)),
            phase: phase,
            source_session_id: selfSessionId
        });
    }
    function onPieceHit(index) {
        if (!fightStarted || !activeFightId || applyingRemote) return;
        sendEvent('piece_hit', {
            fight_id: activeFightId,
            event_id: createId(),
            index: Number(index),
            source_session_id: selfSessionId
        });
    }
    function onVictory() {
        if (!fightStarted || !activeFightId || applyingRemote || !isLeader() || victoryBroadcastForFightId === activeFightId) return;
        victoryBroadcastForFightId = activeFightId;
        sendEvent('fight_victory', { fight_id: activeFightId });
    }
    function onFightEnded() {
        if (!fightStarted || !activeFightId) return;
        finishCoopFight(false, 'Битва с Путеводной Звездой завершена. Можно запустить тест заново.');
    }
    function onPlayerDefeated() {
        if (!fightStarted || !activeFightId) return;
        var message = isLeader()
            ? 'Создатель комнаты проиграл — совместный бой остановлен.'
            : 'Ты проиграл, но остальные игроки могут продолжить бой.';
        if (isLeader()) sendEvent('fight_stop', { fight_id: activeFightId });
        finishCoopFight(false, message);
    }
    function onDialogProgress() {
        if (!fightStarted || !activeFightId || applyingRemote || !isLeader()) return;
        sendEvent('dialog_progress', { fight_id: activeFightId });
    }
    function onDialogChoice(choiceId) {
        if (!fightStarted || !activeFightId || applyingRemote || !isLeader()) return;
        sendEvent('dialog_choice', { fight_id: activeFightId, choice_id: Number(choiceId) });
    }
    function onFinalChoice(choice) {
        if (!fightStarted || !activeFightId || applyingRemote || !isLeader()) return;
        sendEvent('final_choice', { fight_id: activeFightId, choice: choice === 'spare' ? 'spare' : 'kill' });
    }
    function onSpareAdvance() {
        if (!fightStarted || !activeFightId || applyingRemote || !isLeader()) return;
        sendEvent('spare_advance', { fight_id: activeFightId });
    }

    function onFrame(ctx, canvas, state) {
        if (!fightStarted || !activeFightId || !ctx || !canvas) return;
        ensureHazardIds();
        var now = Date.now();
        var perfNow = preciseNow();

        // Sample local FPS independently from the network RTT.
        if (!lastFpsSampleAt) lastFpsSampleAt = perfNow;
        fpsFrameCount++;
        var fpsWindow = perfNow - lastFpsSampleAt;
        if (fpsWindow >= 1000) {
            coopFps = Math.round(fpsFrameCount * 1000 / fpsWindow);
            fpsFrameCount = 0;
            lastFpsSampleAt = perfNow;
            updateCoopHud();
        }

        // Send one targeted ping every two seconds; don't stack requests if a reply is late.
        if (pendingPingId && perfNow - pendingPingStartedAt >= 5000) {
            pendingPingId = null;
            pendingPingStartedAt = 0;
            coopPingMs = null;
            coopPingState = 'таймаут';
            updateCoopHud();
        }
        if (!pendingPingId && perfNow - lastPingSentAt >= 2000) {
            var peer = null;
            currentPlayers.forEach(function (player) {
                if (!peer && player.session_id !== selfSessionId) peer = player;
            });
            lastPingSentAt = perfNow;
            if (peer && channel) {
                pingSequence++;
                pendingPingId = selfSessionId + ':' + pingSequence;
                pendingPingStartedAt = perfNow;
                coopPingState = 'проверка';
                sendEvent('arena_ping', {
                    ping_id: pendingPingId,
                    target_session_id: peer.session_id
                });
            } else {
                coopPingMs = null;
                coopPingState = 'нет игрока';
            }
            updateCoopHud();
        }

        var ownPlayer = window.waystarPlayer;
        if (ownPlayer && now - lastFightPositionSentAt >= 100) {
            lastFightPositionSentAt = now;
            var me = currentPlayers.get(selfSessionId);
            if (me) { me.fightX = ownPlayer.x; me.fightY = ownPlayer.y; }
            sendEvent('fight_player_pos', {
                fight_id: activeFightId,
                session_id: selfSessionId,
                x: Number(ownPlayer.x) || 200,
                y: Number(ownPlayer.y) || 430,
                combat_visuals: captureCombatVisuals()
            });
        }
        if (isLeader() && now - lastSnapshotSentAt >= 220 && window.getWaystarActive && window.getWaystarActive()) {
            lastSnapshotSentAt = now;
            var snapshot = buildFightSnapshot();
            snapshot.snapshot_seq = ++snapshotSequence;
            snapshot.sender_session_id = selfSessionId;
            sendEvent('fight_snapshot', snapshot);
        }

        // Interpolate remote players at render rate instead of snapping on each packet.
        var frameDelta = lastRemoteRenderAt ? Math.min(50, Math.max(0, now - lastRemoteRenderAt)) : 16.67;
        lastRemoteRenderAt = now;
        var blend = 1 - Math.exp(-frameDelta / 75);
        // Draw other players over the original Waystar canvas without modifying its combat renderer.
        ctx.save();
        Array.from(currentPlayers.values()).forEach(function (p) {
            if (p.session_id === selfSessionId || typeof p.fightX !== 'number' || typeof p.fightY !== 'number') return;
            if (typeof p.targetFightX === 'number') p.fightX += (p.targetFightX - p.fightX) * blend;
            if (typeof p.targetFightY === 'number') p.fightY += (p.targetFightY - p.fightY) * blend;
            drawRemoteCombatVisuals(ctx, p);
            var color = playerColor(p.user_id);
            drawHeart(ctx, p.fightX, p.fightY, color, 8.5);
            ctx.save();
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var label = String(p.display_name || 'Игрок').slice(0, 18);
            var width = ctx.measureText(label).width + 10;
            var labelX = clamp(p.fightX - width / 2, 3, 397 - width);
            var labelY = clamp(p.fightY - 26, 4, 480);
            ctx.fillStyle = 'rgba(0,0,0,.84)';
            ctx.fillRect(labelX, labelY, width, 15);
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(labelX, labelY, width, 15);
            ctx.fillStyle = '#fff'; ctx.fillText(label, labelX + width / 2, labelY + 7.5);
            ctx.restore();
        });
        ctx.restore();
        updateCoopHud();
    }

    function ensureCoopHud() {
        var overlay = byId('arenaOverlay');
        if (!overlay) return;
        var hud = byId('onlineArenaCoopHud');
        if (!hud) {
            hud = document.createElement('div');
            hud.id = 'onlineArenaCoopHud';
            hud.style.cssText = 'position:absolute;top:max(7px,env(safe-area-inset-top));right:7px;z-index:5000;display:flex;align-items:center;gap:6px;max-width:calc(100% - 14px);padding:5px 7px;border:1px solid rgba(255,215,0,.55);border-radius:10px;background:rgba(5,5,15,.92);color:#fff;font:900 10px Arial,sans-serif;box-shadow:0 0 14px rgba(255,215,0,.15);';
            var label = document.createElement('span');
            label.id = 'onlineArenaCoopHudCount';
            label.textContent = '🤝 CO-OP';
            hud.appendChild(label);
            var network = document.createElement('span');
            network.id = 'onlineArenaCoopNetwork';
            network.textContent = 'Пинг: проверка · FPS: —';
            network.style.cssText = 'padding:4px 5px;border-radius:6px;background:rgba(255,255,255,.06);color:#d1d5db;white-space:nowrap;font:900 10px Arial,sans-serif;';
            hud.appendChild(network);
            var exit = document.createElement('button');
            exit.type = 'button';
            exit.textContent = 'Выйти';
            exit.style.cssText = 'border:1px solid rgba(255,100,100,.55);border-radius:7px;background:#50151b;color:#fff;padding:5px 7px;font:900 10px Arial,sans-serif;cursor:pointer;';
            exit.addEventListener('click', function () {
                if (activeFightId) sendEvent('fight_stop', { fight_id: activeFightId });
                finishCoopFight(false, 'Совместный бой остановлен. Можно начать заново.');
            });
            hud.appendChild(exit);
            overlay.appendChild(hud);
        }
        updateCoopHud();
    }

    function updateCoopHud() {
        var count = byId('onlineArenaCoopHudCount');
        if (count && fightStarted) {
            count.textContent = '🤝 CO-OP · ' + currentPlayers.size + ' ' + (currentPlayers.size === 1 ? 'игрок' : 'игрока');
        }
        var network = byId('onlineArenaCoopNetwork');
        if (network && fightStarted) {
            var pingText = coopPingMs !== null ? coopPingMs + ' мс' : coopPingState;
            var fpsText = coopFps !== null ? String(coopFps) : '—';
            var text = 'Пинг: ' + pingText + ' · FPS: ' + fpsText;
            if (network.textContent !== text) network.textContent = text;
            network.style.color = coopPingState === 'таймаут' ? '#ff7b7b'
                : (coopPingMs === null ? '#d1d5db'
                    : (coopPingMs < 90 ? '#6ee7a8' : (coopPingMs < 180 ? '#ffd166' : '#ff7b7b')));
        }
    }

    function finishCoopFight(showMessage, message) {
        var wasActive = fightStarted;
        if (wasActive && window.getWaystarActive && window.getWaystarActive() && typeof window.stopWaystarFight === 'function') {
            try { window.stopWaystarFight(); } catch (error) { console.warn('[MB co-op] stopWaystarFight:', error); }
        }
        var hud = byId('onlineArenaCoopHud');
        if (hud) hud.remove();
        var stage = byId('onlineArenaStage');
        var lobby = byId('onlineArenaLobby');
        if (lobby && entered) lobby.style.display = 'block';
        if (stage && entered) stage.style.display = 'flex';
        fightStarted = false;
        activeFightId = null;
        fightHostSessionId = null;
        victoryBroadcastForFightId = null;
        consumedHazardIds.clear();
        coopHazardCounter = 0;
        pendingPingId = null;
        pendingPingStartedAt = 0;
        coopPingMs = null;
        coopPingState = 'проверка';
        coopFps = null;
        if (window.MBOnlineWaystar) {
            window.MBOnlineWaystar.active = false;
            window.MBOnlineWaystar.fightId = null;
            window.MBOnlineWaystar.hostSessionId = null;
            window.MBOnlineWaystar.bossHpMultiplier = 1;
            window.MBOnlineWaystar.partySize = 1;
        }
        if (message) setStageStatus(message);
        if (showMessage !== false) renderLobbyPlayers();
        updateStartButton();
    }

    async function exitArena(showMessage) {
        if (activeFightId) {
            await sendEvent('fight_stop', { fight_id: activeFightId });
            finishCoopFight(false, 'Ты вышел из совместного боя.');
        }
        entered = false;
        connecting = false;
        await closeRoom();
        var lobby = byId('onlineArenaLobby');
        var stage = byId('onlineArenaStage');
        if (stage) stage.style.display = 'none';
        if (lobby) lobby.style.display = 'block';
        if (showMessage !== false) setLobbyStatus('Ты вышел из комнаты. Можно войти снова.');
        client = null;
        activeUserId = null;
        lobbyCanvas = null;
        lobbyCtx = null;
        unbindLobbyMovement();
        var enter = byId('onlineArenaEnter');
        if (enter && showMessage !== false) enter.focus({ preventScroll: true });
    }

    async function closeRoom() {
        unbindLobbyMovement();
        var oldChannel = channel;
        channel = null;
        if (oldChannel && client) {
            try { await oldChannel.untrack(); } catch (_error) {}
            try { await client.removeChannel(oldChannel); } catch (_error) {}
        }
        currentPlayers.clear();
        leaderSessionId = null;
        renderFightRoster();
    }

    function bindLobbyMovement() {
        unbindLobbyMovement();
        keyHandler = function (event) {
            if (!entered || fightStarted) return;
            var key = String(event.key || '').toLowerCase();
            var dx = 0, dy = 0;
            if (key === 'arrowleft' || key === 'a') dx = -2.5;
            else if (key === 'arrowright' || key === 'd') dx = 2.5;
            else if (key === 'arrowup' || key === 'w') dy = -2.5;
            else if (key === 'arrowdown' || key === 's') dy = 2.5;
            else return;
            event.preventDefault();
            x = clamp(x + dx, 8, 92); y = clamp(y + dy, 8, 92);
            broadcastLobbyPosition();
        };
        pointerDownHandler = function (event) { if (!entered || fightStarted) return; moveLobbyToPointer(event); };
        pointerMoveHandler = function (event) { if (!entered || fightStarted || !(event.buttons & 1)) return; moveLobbyToPointer(event); };
        document.addEventListener('keydown', keyHandler);
        if (lobbyCanvas) {
            lobbyCanvas.addEventListener('pointerdown', pointerDownHandler);
            lobbyCanvas.addEventListener('pointermove', pointerMoveHandler);
        }
    }
    function unbindLobbyMovement() {
        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        if (lobbyCanvas && pointerDownHandler) lobbyCanvas.removeEventListener('pointerdown', pointerDownHandler);
        if (lobbyCanvas && pointerMoveHandler) lobbyCanvas.removeEventListener('pointermove', pointerMoveHandler);
        keyHandler = pointerDownHandler = pointerMoveHandler = null;
    }
    function broadcastLobbyPosition() {
        var me = currentPlayers.get(selfSessionId);
        if (me) { me.x = x; me.y = y; }
        var now = Date.now();
        if (channel && now - lastMoveSentAt >= 60) {
            lastMoveSentAt = now;
            sendEvent('arena_move', { session_id: selfSessionId, x: x, y: y });
        }
        renderLobbyPlayers();
    }
    function moveLobbyToPointer(event) {
        if (!lobbyCanvas) return;
        var rect = lobbyCanvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        x = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
        y = clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 92);
        broadcastLobbyPosition();
    }

    function init() {
        var stage = byId('onlineArenaStage');
        if (stage && stage.parentElement !== document.body) document.body.appendChild(stage);
        var enter = byId('onlineArenaEnter');
        var exit = byId('onlineArenaExit');
        var startBoss = byId('onlineArenaStartBoss');
        if (enter) enter.addEventListener('click', enterArena);
        if (exit) exit.addEventListener('click', function () { exitArena(true); });
        if (startBoss) startBoss.addEventListener('click', startCoopFight);
        window.addEventListener('mb:auth-changed', function (event) {
            var nextUserId = event && event.detail ? event.detail.userId : null;
            if (entered && nextUserId !== activeUserId) {
                exitArena(false).then(function () { setLobbyStatus('Аккаунт изменился. Войди на арену заново.'); });
            }
        });
        // Public bridge used by the original Waystar boss code. It only adds multiplayer hooks.
        window.MBOnlineWaystar = {
            active: false,
            fightId: null,
            hostSessionId: null,
            bossHpMultiplier: 1,
            partySize: 1,
            isLeader: isLeader,
            isApplyingRemote: function () { return applyingRemote; },
            onSuperAction: onSuperAction,
            onBossDamage: onBossDamage,
            onPieceHit: onPieceHit,
            onVictory: onVictory,
            onFightEnded: onFightEnded,
            onPlayerDefeated: onPlayerDefeated,
            onDialogProgress: onDialogProgress,
            onDialogChoice: onDialogChoice,
            onFinalChoice: onFinalChoice,
            onSpareAdvance: onSpareAdvance,
            onFrame: onFrame,
            onHazardConsumed: onHazardConsumed
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();