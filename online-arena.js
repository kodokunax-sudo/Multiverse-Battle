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
    var victoryBroadcastForFightId = null;
    var seenEvents = new Set();
    var coopHazardCounter = 0;
    var consumedHazardIds = new Set();
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
        var localFlags = new Map();
        previous.forEach(function (item) {
            if (!item || !item.__mb_coop_id) return;
            localFlags.set(item.__mb_coop_id, {
                hit: item.hit === true,
                dioStandHitOnce: item.dioStandHitOnce === true
            });
        });
        var next = [];
        incoming.forEach(function (source) {
            if (!source || typeof source !== 'object') return;
            var item = source;
            var id = item.__mb_coop_id;
            if (id && consumedHazardIds.has(id)) return;
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
                    other.fightX = clamp(Number(p.x) || 200, 12, 388);
                    other.fightY = clamp(Number(p.y) || 430, 70, 490);
                    renderFightRoster();
                });
                ch.on('broadcast', { event: 'boss_damage' }, function (message) {
                    var p = message && message.payload;
                    if (!p || p.fight_id !== activeFightId || p.sender_session_id === selfSessionId || !markEvent(p.event_id)) return;
                    // The host owns boss HP. All other clients consume authoritative snapshots.
                    if (isLeader()) applyRemoteBossDamage(p);
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
        if (!isLeader()) {
            button.disabled = true; button.textContent = 'Ожидаем создателя комнаты'; return;
        }
        button.disabled = false;
        button.textContent = '⚔️ Начать совместный бой с боссом 500';
    }

    function startCoopFight() {
        if (!entered || !channel || !isLeader() || activeFightId || fightStarted) return;
        var damage = Math.max(1, Number(window.playerFinalDamage) || 100);
        var maxHp = Math.max(25000, damage * 120);
        var packet = {
            fight_id: createId(),
            host_session_id: selfSessionId,
            boss_max_hp: maxHp,
            boss_hp: maxHp,
            starter_name: playerName
        };
        activeFightId = packet.fight_id;
        fightHostSessionId = selfSessionId;
        victoryBroadcastForFightId = null;
        seenEvents.clear();
        consumedHazardIds.clear();
        coopHazardCounter = 0;
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
        coopHazardCounter = 0;
        var api = window.MBOnlineWaystar;
        if (api) {
            api.active = true;
            api.fightId = activeFightId;
            api.hostSessionId = fightHostSessionId;
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
            setStageStatus('Не удалось запустить босса 500: ' + friendlyError(error));
        }
        updateStartButton();
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

    function applyFightSnapshot(packet) {
        if (!window.getWaystarActive || !window.getWaystarActive()) return;
        if (typeof packet.boss_hp === 'number') window.waystarBossHp = packet.boss_hp;
        if (typeof packet.boss_max_hp === 'number') window.waystarBossMaxHp = packet.boss_max_hp;
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
            fields.forEach(function (key) { if (data[key] !== undefined) target[key] = data[key]; });
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
                ['x','y','hp','alive','pulse'].forEach(function (key) { if (source[key] !== undefined) target[key] = source[key]; });
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
        var ownPlayer = window.waystarPlayer;
        if (ownPlayer && now - lastFightPositionSentAt >= 80) {
            lastFightPositionSentAt = now;
            var me = currentPlayers.get(selfSessionId);
            if (me) { me.fightX = ownPlayer.x; me.fightY = ownPlayer.y; }
            sendEvent('fight_player_pos', {
                fight_id: activeFightId,
                session_id: selfSessionId,
                x: Number(ownPlayer.x) || 200,
                y: Number(ownPlayer.y) || 430
            });
        }
        if (isLeader() && now - lastSnapshotSentAt >= 140 && window.getWaystarActive && window.getWaystarActive()) {
            lastSnapshotSentAt = now;
            var snapshot = buildFightSnapshot();
            snapshot.sender_session_id = selfSessionId;
            sendEvent('fight_snapshot', snapshot);
        }

        // Draw other players over the original Waystar canvas without modifying its combat renderer.
        ctx.save();
        Array.from(currentPlayers.values()).forEach(function (p) {
            if (p.session_id === selfSessionId || typeof p.fightX !== 'number' || typeof p.fightY !== 'number') return;
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
    }

    function finishCoopFight(showMessage, message) {
        var wasActive = fightStarted;
        if (wasActive && window.getWaystarActive && window.getWaystarActive() && typeof window.stopWaystarFight === 'function') {
            try { window.stopWaystarFight(); } catch (error) { console.warn('[MB co-op] stopWaystarFight:', error); }
        }
        var hud = byId('onlineArenaCoopHud');
        if (hud) hud.remove();
        var stage = byId('onlineArenaStage');
        if (stage && entered) stage.style.display = 'flex';
        fightStarted = false;
        activeFightId = null;
        fightHostSessionId = null;
        victoryBroadcastForFightId = null;
        consumedHazardIds.clear();
        coopHazardCounter = 0;
        if (window.MBOnlineWaystar) {
            window.MBOnlineWaystar.active = false;
            window.MBOnlineWaystar.fightId = null;
            window.MBOnlineWaystar.hostSessionId = null;
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
            isLeader: isLeader,
            onBossDamage: onBossDamage,
            onPieceHit: onPieceHit,
            onVictory: onVictory,
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