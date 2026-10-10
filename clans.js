/* Multiverse Battle — online profiles, game stats and clan chat. */
(function () {
    'use strict';

    var db = null;
    var currentUser = null;
    var currentClan = null;
    var currentProfile = null;
    var profileAvatarName = 'Дио';
    var initialized = false;
    var busy = false;
    var chatChannel = null;
    var chatClanId = null;
    var chatSending = false;
    var lastStatsFingerprint = '';
    var lastStatsSyncAt = 0;
    var pendingStatsSyncTimer = null;

    var STAT_DEFS = [
        { key: 'total_wins', label: '🏆 Победы' },
        { key: 'highest_wave', label: '🌊 Макс. волна' },
        { key: 'rebirth_count', label: '♻️ Ребёрны' },
        { key: 'cards_collected', label: '🎴 Получено карт' },
        { key: 'bosses_defeated', label: '👹 Боссы' },
        { key: 'total_clicks', label: '👆 Кликов' }
    ];

    var GIFTABLE_RARITIES = ['Обычная', 'Редкая', 'Сверх редкая', 'Эпик', 'Мифическая', 'Легендарная'];
    var cardExchangeRefreshPromise = null;
    var giftRealtimeChannel = null;
    var giftRealtimeUserId = null;

    function byId(id) { return document.getElementById(id); }

    function node(tag, className, text) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined && text !== null) el.textContent = String(text);
        return el;
    }

    function actionButton(label, className, action) {
        var button = node('button', className || 'btn', label);
        button.type = 'button';
        button.addEventListener('click', action);
        return button;
    }

    function setNotice(message, kind) {
        var el = byId('clansNotice');
        if (!el) return;
        el.textContent = message || '';
        el.className = 'clan-notice' + (kind ? ' clan-notice-' + kind : '');
    }

    function friendlyError(error) {
        var message = String((error && (error.message || error.error_description)) || error || '');
        var map = {
            auth_required: 'Сначала войди в аккаунт.',
            invalid_clan_name: 'Название клана должно содержать от 3 до 24 символов.',
            invalid_clan_tag: 'Тег клана должен содержать от 2 до 5 английских букв или цифр.',
            description_too_long: 'Описание клана не должно превышать 160 символов.',
            profile_name_invalid: 'Имя профиля должно содержать от 1 до 24 символов.',
            profile_description_too_long: 'Описание профиля не должно превышать 280 символов.',
            clan_chat_empty: 'Сообщение не может быть пустым.',
            already_in_clan: 'Ты уже состоишь в клане. Сначала выйди из него.',
            clan_not_found: 'Этот клан уже не существует.',
            not_in_clan: 'Ты сейчас не состоишь в клане.',
            leader_must_disband: 'Лидер пока не может покинуть клан. Передача лидерства появится позже; пока можно распустить клан.',
            leader_only_action: 'Распустить клан может только его лидер.',
            profile_not_found: 'Профиль не найден. Перезайди в аккаунт или проверь миграцию Supabase.',
            card_inventory_invalid: 'Не удалось проверить инвентарь карт. Обнови игру и попробуй ещё раз.',
            card_inventory_too_large: 'В активном сохранении слишком много карт для онлайн-проверки.',
            card_request_invalid: 'Выбери карту из списка.',
            card_request_limit: 'Можно держать не больше 5 активных запросов на карты.',
            card_request_duplicate: 'Ты уже просишь такую карту.',
            card_request_not_found: 'Этот запрос уже закрыт или удалён.',
            card_request_own: 'Нельзя передать карту по собственному запросу.',
            card_not_owned: 'Этой карты больше нет в твоём инвентаре. Обнови список карт.',
            card_rarity_blocked: 'Передавать можно только карты до легендарной редкости включительно.',
            card_request_name_mismatch: 'Выбранная карта не совпадает с запросом.',
            daily_card_gift_limit: 'Ты уже использовал все 3 передачи на сегодня.',
            not_clan_member: 'Передавать карты можно только соклановцам.',
            recipient_level7_conflict: 'У получателя уже есть карта 7★. По правилам игры такая карта может быть только одна.',
            auth_required: 'Сначала войди в аккаунт.'
        };
        var keys = Object.keys(map);
        for (var i = 0; i < keys.length; i++) {
            if (message.indexOf(keys[i]) !== -1) return map[keys[i]];
        }
        if (/duplicate key|already exists|clans_tag_key/i.test(message)) return 'Этот тег уже занят. Выбери другой.';
        var authCode = String((error && (error.code || error.error_code)) || '');
        if (authCode === 'over_email_send_rate_limit' || /over_email_send_rate_limit|email rate limit exceeded/i.test(message)) {
            return 'Supabase временно ограничил отправку писем (429). Встроенная почта рассчитана на тесты и разрешает около 2 писем в час. Не повторяй регистрацию много раз подряд: подключи SMTP в Supabase → Authentication → Emails → SMTP Settings, затем попробуй снова.';
        }
        if (authCode === 'email_address_not_authorized' || /email address.*not authorized/i.test(message)) {
            return 'Встроенная почта Supabase не отправляет на этот адрес. Чтобы регистрировались друзья, подключи SMTP в Authentication → Emails → SMTP Settings.';
        }
        if (/error sending confirmation email|unexpected_failure/i.test(message)) return 'Supabase не смог отправить письмо. Проверь почтовые настройки проекта.';
        if (/email link is invalid or has expired|one-time token not found|otp_expired/i.test(message)) return 'Ссылка подтверждения устарела или уже использована. После настройки почты запроси новое подтверждение.';
        if (/invalid login credentials/i.test(message)) return 'Неверная почта или пароль.';
        if (/email not confirmed/i.test(message)) return 'Сначала подтверди почту по ссылке из письма.';
        if (/row-level security|permission denied/i.test(message)) return 'База отклонила действие по правилам доступа. Проверь, что ты вошёл и состоишь в этом клане.';
        if (/relation .* does not exist|schema cache/i.test(message)) return 'Не хватает таблиц онлайн-системы. Примени обе SQL-миграции из папки supabase/migrations.';
        if (/fetch|network|failed to load/i.test(message)) return 'Не удалось подключиться. Проверь интернет и настройки Supabase.';
        return message || 'Неизвестная ошибка. Попробуй ещё раз.';
    }

    function setBusy(value) {
        busy = !!value;
        ['clansRegisterBtn', 'clansLoginBtn', 'clansLogoutBtn', 'clanCreateBtn', 'clansProfileSaveBtn', 'clanChatSendBtn'].forEach(function (id) {
            var el = byId(id);
            if (el) el.disabled = busy;
        });
        document.querySelectorAll('#clanList button, #clanCurrentCard button, #clanProfileForm button').forEach(function (el) {
            el.disabled = busy;
        });
    }

    function isConfigured() {
        var c = window.MB_SUPABASE_CONFIG || {};
        return typeof c.url === 'string' &&
            c.url.indexOf('https://') === 0 &&
            c.url.indexOf('YOUR_PROJECT_ID') === -1 &&
            typeof c.anonKey === 'string' &&
            c.anonKey.length > 20 &&
            c.anonKey.indexOf('YOUR_SUPABASE_') === -1;
    }

    function showAuthState() {
        var signedIn = !!currentUser;
        var authPanel = byId('clansAuthPanel');
        var userPanel = byId('clansUserPanel');
        var sections = byId('clansSignedInSections');
        if (authPanel) authPanel.style.display = signedIn ? 'none' : 'block';
        if (userPanel) userPanel.style.display = signedIn ? 'flex' : 'none';
        if (sections) sections.style.display = signedIn ? 'block' : 'none';
        if (signedIn) {
            var email = currentUser.email || 'Аккаунт игрока';
            var title = currentUser.user_metadata && currentUser.user_metadata.display_name;
            byId('clansSignedInAs').textContent = (title ? title + ' · ' : '') + email;
        } else {
            currentProfile = null;
            hidePublicProfile();
        }
    }

    function safeCount(value, maxValue) {
        var n = Number(value);
        if (!Number.isFinite(n) || n < 0) return 0;
        return Math.min(maxValue || 1000000000, Math.floor(n));
    }

    function readLocalGameStats() {
        // Не затираем онлайн-статистику стартовыми нулями, пока слот ещё не выбран.
        if (typeof currentSlot !== 'undefined' && Number(currentSlot) < 0) return null;
        try {
            var wins = typeof totalWins !== 'undefined' ? totalWins : 0;
            var bestWave = typeof highestWaveReached !== 'undefined' ? highestWaveReached : (typeof wave !== 'undefined' ? wave : 1);
            var rebirths = typeof rebirthCount !== 'undefined' ? rebirthCount : 0;
            var cards = typeof totalCardsObtained !== 'undefined'
                ? totalCardsObtained
                : (typeof myCards !== 'undefined' && Array.isArray(myCards) ? myCards.length : 0);
            var bosses = typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) ? defeatedBosses.length : 0;
            var clicks = typeof totalClicks !== 'undefined' ? totalClicks : 0;
            return {
                total_wins: safeCount(wins),
                highest_wave: Math.max(1, safeCount(bestWave)),
                rebirth_count: safeCount(rebirths, 1000000),
                cards_collected: safeCount(cards),
                bosses_defeated: safeCount(bosses, 1000000),
                total_clicks: safeCount(clicks)
            };
        } catch (_error) {
            return null;
        }
    }

    function formatCount(value) {
        try { return Math.max(0, Number(value) || 0).toLocaleString('ru-RU'); }
        catch (_error) { return String(value || 0); }
    }

    function renderStatsGrid(containerId, stats) {
        var container = byId(containerId);
        if (!container || !stats) return;
        container.replaceChildren();
        STAT_DEFS.forEach(function (stat) {
            var card = node('div', 'clan-stat');
            card.appendChild(node('strong', '', formatCount(stats[stat.key] || 0)));
            card.appendChild(node('span', '', stat.label));
            container.appendChild(card);
        });
    }

    function updateProfileStatsPreview(stats) {
        if (stats) renderStatsGrid('clanProfileStats', stats);
    }

    function avatarPathForName(name) {
        var list = Array.isArray(window.MBAvatarOptions) ? window.MBAvatarOptions : [];
        var found = list.find(function (item) { return item && item.name === name && typeof item.path === 'string'; });
        return found ? found.path : null;
    }

    function applyAvatarPreview(name) {
        var path = avatarPathForName(name) || avatarPathForName('Дио') || 'images/Super_Dio_2.gif';
        var preview = byId('clanProfilePreview');
        if (preview) preview.src = path;
    }

    function chooseAvatar(name) {
        if (!avatarPathForName(name)) return;
        profileAvatarName = name;
        applyAvatarPreview(name);
        renderAvatarPicker(name);
    }

    function renderAvatarPicker(selectedName) {
        var container = byId('clanAvatarChoices');
        if (!container) return;
        container.replaceChildren();
        var list = Array.isArray(window.MBAvatarOptions) ? window.MBAvatarOptions : [];
        if (!list.length) {
            container.appendChild(node('p', 'clan-muted', 'В реестре images.js пока нет изображений персонажей.'));
            return;
        }
        list.forEach(function (item) {
            var button = node('button', 'clan-avatar-option' + (item.name === selectedName ? ' selected' : ''));
            button.type = 'button';
            button.setAttribute('aria-pressed', item.name === selectedName ? 'true' : 'false');
            button.title = item.name;
            var img = node('img');
            img.src = item.path;
            img.alt = item.name;
            img.loading = 'lazy';
            img.onerror = function () { img.style.opacity = '0.25'; };
            button.appendChild(img);
            button.appendChild(node('span', '', item.name));
            button.addEventListener('click', function () { chooseAvatar(item.name); });
            container.appendChild(button);
        });
    }

    function syncGameStats() {
        if (!db || !currentUser) return Promise.resolve();
        var stats = readLocalGameStats();
        if (!stats) return Promise.resolve();
        updateProfileStatsPreview(stats);
        var fingerprint = JSON.stringify(stats);
        if (fingerprint === lastStatsFingerprint) return Promise.resolve();
        var waitMs = 15000 - (Date.now() - lastStatsSyncAt);
        if (waitMs > 0) {
            if (pendingStatsSyncTimer === null) {
                pendingStatsSyncTimer = window.setTimeout(function () {
                    pendingStatsSyncTimer = null;
                    syncGameStats();
                }, waitMs);
            }
            return Promise.resolve();
        }
        lastStatsSyncAt = Date.now();
        lastStatsFingerprint = fingerprint;
        return db.from('profiles').update(stats).eq('id', currentUser.id).then(function (result) {
            if (result.error) {
                lastStatsFingerprint = '';
                console.warn('[MB online] Не удалось обновить статистику профиля:', result.error.message);
            }
        });
    }

    async function loadProfile() {
        if (!db || !currentUser) return;
        await syncGameStats();
        var result = await db.from('profiles')
            .select('id, display_name, avatar_name, description, created_at, updated_at, total_wins, highest_wave, rebirth_count, cards_collected, bosses_defeated, total_clicks')
            .eq('id', currentUser.id)
            .maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) throw new Error('profile_not_found');
        currentProfile = result.data;
        byId('clanProfileName').value = result.data.display_name || '';
        byId('clanProfileDescription').value = result.data.description || '';
        profileAvatarName = avatarPathForName(result.data.avatar_name) ? result.data.avatar_name : 'Дио';
        renderAvatarPicker(profileAvatarName);
        applyAvatarPreview(profileAvatarName);
        renderStatsGrid('clanProfileStats', Object.assign({}, result.data, readLocalGameStats() || {}));
        var signedInLabel = byId('clansSignedInAs');
        if (signedInLabel) signedInLabel.textContent = (result.data.display_name || 'Игрок') + ' · ' + (currentUser.email || 'Аккаунт игрока');
    }

    async function saveProfile(event) {
        if (event) event.preventDefault();
        if (!db || !currentUser || busy) return;
        var name = byId('clanProfileName').value.trim();
        var description = byId('clanProfileDescription').value.trim();
        if (name.length < 1 || name.length > 24) return setNotice('Имя профиля должно содержать от 1 до 24 символов.', 'error');
        if (description.length > 280) return setNotice('Описание профиля не должно превышать 280 символов.', 'error');
        if (!avatarPathForName(profileAvatarName)) return setNotice('Выбери аватар из списка персонажей.', 'error');
        setBusy(true);
        try {
            var result = await db.from('profiles').update({
                display_name: name,
                avatar_name: profileAvatarName,
                description: description
            }).eq('id', currentUser.id).select('id').maybeSingle();
            if (result.error) throw result.error;
            if (!result.data) throw new Error('profile_not_found');
            setNotice('Профиль сохранён!', 'success');
            await refreshAll();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    async function openPublicProfile(userId) {
        if (!db || !currentUser || !userId) return;
        var card = byId('clanPublicProfileCard');
        if (!card) return;
        card.style.display = 'block';
        byId('clanPublicName').textContent = 'Загружаем профиль…';
        byId('clanPublicDescription').textContent = '';
        byId('clanPublicStats').replaceChildren();
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        try {
            var result = await db.from('profiles')
                .select('id, display_name, avatar_name, description, total_wins, highest_wave, rebirth_count, cards_collected, bosses_defeated, total_clicks')
                .eq('id', userId).maybeSingle();
            if (result.error) throw result.error;
            if (!result.data) throw new Error('profile_not_found');
            byId('clanPublicName').textContent = result.data.display_name || 'Игрок';
            byId('clanPublicDescription').textContent = result.data.description || 'Игрок пока не добавил описание.';
            byId('clanPublicAvatar').src = avatarPathForName(result.data.avatar_name) || 'images/Super_Dio_2.gif';
            renderStatsGrid('clanPublicStats', result.data);
        } catch (error) {
            byId('clanPublicName').textContent = friendlyError(error);
        }
    }

    function hidePublicProfile() {
        var card = byId('clanPublicProfileCard');
        if (card) card.style.display = 'none';
    }

    function setChatState(message, failed) {
        var el = byId('clanChatState');
        if (!el) return;
        el.textContent = message;
        el.style.color = failed ? '#ff9c9c' : '#9be7b0';
    }

    function closeClanChat() {
        var oldChannel = chatChannel;
        chatChannel = null;
        chatClanId = null;
        if (oldChannel && db) {
            return db.removeChannel(oldChannel).catch(function () {});
        }
        return Promise.resolve();
    }

    function renderChatMessages(messages) {
        var container = byId('clanChatMessages');
        if (!container) return;
        container.replaceChildren();
        if (!messages || !messages.length) {
            container.appendChild(node('div', 'clan-chat-empty', 'Сообщений пока нет. Начни разговор!'));
            return;
        }
        messages.forEach(function (item) {
            var relation = item.profiles;
            if (Array.isArray(relation)) relation = relation[0];
            var name = relation && relation.display_name ? relation.display_name : 'Игрок';
            var messageRow = node('div', 'clan-chat-message' + (currentUser && item.user_id === currentUser.id ? ' mine' : ''));
            var avatar = node('img', 'clan-chat-avatar');
            avatar.src = avatarPathForName(relation && relation.avatar_name) || 'images/Super_Dio_2.gif';
            avatar.alt = name;
            avatar.loading = 'lazy';
            var body = node('div', 'clan-chat-body');
            var meta = node('div', 'clan-chat-meta');
            meta.appendChild(node('strong', '', name));
            var date = new Date(item.created_at);
            var time = node('time', '', Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
            meta.appendChild(time);
            body.appendChild(meta);
            body.appendChild(node('div', 'clan-chat-text', item.message));
            messageRow.appendChild(avatar);
            messageRow.appendChild(body);
            container.appendChild(messageRow);
        });
        container.scrollTop = container.scrollHeight;
    }

    async function loadClanChatMessages(clanId) {
        if (!db || !currentUser || !clanId) return;
        var result = await db.from('clan_messages')
            .select('id, clan_id, user_id, message, created_at, profiles(display_name, avatar_name)')
            .eq('clan_id', clanId)
            .order('created_at', { ascending: false })
            .limit(60);
        if (result.error) throw result.error;
        renderChatMessages((result.data || []).slice().reverse());
    }

    async function ensureClanChat(clanId) {
        if (!db || !currentUser || !clanId) return;
        if (chatClanId !== clanId) {
            await closeClanChat();
            chatClanId = clanId;
            setChatState('Подключаемся к чату…');
            chatChannel = db.channel('mb-clan-chat-' + clanId)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'clan_messages',
                    filter: 'clan_id=eq.' + clanId
                }, function (payload) {
                    if (payload && payload.new && chatClanId === clanId) {
                        loadClanChatMessages(clanId).catch(function (error) {
                            setChatState(friendlyError(error), true);
                        });
                    }
                })
                .subscribe(function (status, error) {
                    if (chatClanId !== clanId) return;
                    if (status === 'SUBSCRIBED') setChatState('● Чат подключён · обновляется в реальном времени');
                    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        setChatState(error ? friendlyError(error) : 'Чат временно отключён; попробуй обновить вкладку.', true);
                    }
                });
        }
        await loadClanChatMessages(clanId);
    }

    async function sendClanChatMessage(event) {
        if (event) event.preventDefault();
        if (!db || !currentUser || !currentClan || chatSending) return;
        var input = byId('clanChatInput');
        var message = input.value.trim();
        if (!message) return;
        if (message.length > 500) return setNotice('Сообщение слишком длинное (максимум 500 символов).', 'error');
        chatSending = true;
        var sendButton = byId('clanChatSendBtn');
        if (sendButton) sendButton.disabled = true;
        try {
            var result = await db.from('clan_messages').insert({
                clan_id: currentClan.id,
                user_id: currentUser.id,
                message: message
            }).select('id').single();
            if (result.error) throw result.error;
            input.value = '';
            await loadClanChatMessages(currentClan.id);
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            chatSending = false;
            if (sendButton) sendButton.disabled = busy;
            input.focus();
        }
    }

    async function loadMyClan() {
        currentClan = null;
        if (!currentUser || !db) return null;
        var result = await db.from('clan_members')
            .select('clan_id, role, joined_at, clans(id, name, tag, description, owner_id)')
            .eq('user_id', currentUser.id)
            .maybeSingle();
        if (result.error) throw result.error;
        if (result.data && result.data.clans) {
            currentClan = {
                id: result.data.clans.id,
                name: result.data.clans.name,
                tag: result.data.clans.tag,
                description: result.data.clans.description || '',
                owner_id: result.data.clans.owner_id,
                role: result.data.role,
                joined_at: result.data.joined_at
            };
        }
        return currentClan;
    }

    async function loadClanList() {
        var container = byId('clanList');
        if (!container) return;
        container.replaceChildren();
        var result = await db.from('clans')
            .select('id, name, tag, description, owner_id, created_at, clan_members(count)')
            .order('created_at', { ascending: false })
            .limit(100);
        if (result.error) throw result.error;
        var clans = result.data || [];
        if (!clans.length) {
            container.appendChild(node('p', 'clan-muted', 'Пока кланов нет. Создай первый!'));
            return;
        }
        clans.forEach(function (clan) {
            var row = node('div', 'clan-row');
            var main = node('div', 'clan-row-main');
            var heading = node('div', 'clan-row-heading');
            heading.appendChild(node('span', 'clan-tag', '[' + clan.tag + ']'));
            heading.appendChild(node('strong', '', clan.name));
            main.appendChild(heading);
            main.appendChild(node('div', 'clan-muted', clan.description || 'Без описания'));
            var count = 0;
            if (Array.isArray(clan.clan_members) && clan.clan_members[0]) {
                count = Number(clan.clan_members[0].count) || 0;
            }
            main.appendChild(node('div', 'clan-muted', '👥 Участников: ' + count));
            row.appendChild(main);
            if (currentClan) {
                if (currentClan.id === clan.id) {
                    row.appendChild(node('span', 'clan-pill', 'Твой клан'));
                } else {
                    row.appendChild(node('span', 'clan-pill clan-pill-muted', 'Сначала выйди из клана'));
                }
            } else {
                row.appendChild(actionButton('Вступить', 'btn clan-action-btn', function () {
                    joinClan(clan.id);
                }));
            }
            container.appendChild(row);
        });
    }

    async function loadCurrentClanCard() {
        var card = byId('clanCurrentCard');
        var createCard = byId('clanCreateCard');
        if (!card || !createCard) return;
        if (!currentClan) {
            card.style.display = 'none';
            createCard.style.display = 'block';
            var exchangeCard = byId('clanCardExchangeCard');
            if (exchangeCard) exchangeCard.style.display = 'none';
            await closeClanChat();
            return;
        }
        card.style.display = 'block';
        createCard.style.display = 'none';
        byId('clanCurrentName').textContent = currentClan.name;
        byId('clanCurrentTag').textContent = '[' + currentClan.tag + ']';
        byId('clanCurrentDescription').textContent = currentClan.description || 'Без описания';
        byId('clanCurrentRole').textContent = currentClan.role === 'leader' ? '👑 Лидер' :
            (currentClan.role === 'officer' ? '🛡️ Заместитель' : '👤 Участник');

        var actions = byId('clanCurrentActions');
        actions.replaceChildren();
        if (currentClan.role === 'leader') {
            actions.appendChild(actionButton('Распустить клан', 'btn clan-danger-btn', disbandClan));
        } else {
            actions.appendChild(actionButton('Покинуть клан', 'btn clan-danger-btn', leaveClan));
        }

        var members = await db.from('clan_members')
            .select('user_id, role, joined_at, profiles(display_name, avatar_name)')
            .eq('clan_id', currentClan.id)
            .order('joined_at', { ascending: true });
        if (members.error) throw members.error;
        var list = byId('clanMemberList');
        list.replaceChildren();
        (members.data || []).forEach(function (member) {
            var profile = member.profiles;
            if (Array.isArray(profile)) profile = profile[0];
            var displayName = profile && profile.display_name ? profile.display_name : 'Игрок';
            var roleName = member.role === 'leader' ? '👑 Лидер' :
                (member.role === 'officer' ? '🛡️ Заместитель' : 'Участник');
            var entry = node('div', 'clan-member-row');
            var main = node('div', 'clan-member-main');
            var avatar = node('img', 'clan-member-avatar');
            avatar.src = avatarPathForName(profile && profile.avatar_name) || 'images/Super_Dio_2.gif';
            avatar.alt = displayName;
            avatar.loading = 'lazy';
            var identity = node('div', 'clan-member-identity');
            identity.appendChild(node('strong', '', displayName));
            identity.appendChild(node('div', 'clan-muted', 'Открыть профиль'));
            main.appendChild(avatar);
            main.appendChild(identity);
            entry.appendChild(main);
            entry.appendChild(node('span', 'clan-muted', roleName));
            entry.addEventListener('click', function () { openPublicProfile(member.user_id); });
            list.appendChild(entry);
        });
        if (!members.data || !members.data.length) {
            list.appendChild(node('p', 'clan-muted', 'Пока участников нет.'));
        }
        await ensureClanChat(currentClan.id);
        await refreshClanCardExchange();
    }


    function isGiftableCard(card) {
        return !!card && GIFTABLE_RARITIES.indexOf(String(card.rarity || '')) !== -1;
    }

    function giftableCardCatalog() {
        var catalog = [];
        var seen = Object.create(null);
        if (typeof customCardTemplates === 'undefined' || !customCardTemplates) return catalog;
        GIFTABLE_RARITIES.forEach(function (rarity) {
            var templates = customCardTemplates[rarity];
            if (!Array.isArray(templates)) return;
            templates.forEach(function (template) {
                var name = String(template && template.name || '').trim();
                if (!name || seen[name]) return;
                seen[name] = true;
                catalog.push({ name: name, rarity: rarity });
            });
        });
        return catalog;
    }

    function populateClanCardRequestOptions() {
        var select = byId('clanCardRequestSelect');
        if (!select) return;
        var selected = select.value;
        select.replaceChildren();
        var prompt = node('option', '', 'Выбери карту…');
        prompt.value = '';
        prompt.disabled = true;
        prompt.selected = true;
        select.appendChild(prompt);
        giftableCardCatalog().forEach(function (card) {
            var option = node('option', '', card.name + ' · ' + card.rarity);
            option.value = card.name;
            select.appendChild(option);
        });
        if (selected && Array.from(select.options).some(function (option) { return option.value === selected; })) {
            select.value = selected;
        }
        if (select.options.length <= 1) {
            select.disabled = true;
            setNotice('Не удалось загрузить каталог карт из data.js. Обнови игру и проверь подключение скриптов.', 'warning');
        } else {
            select.disabled = false;
        }
    }

    async function syncOwnedClanCards() {
        if (!db || !currentUser || !window.MBGameCards || typeof window.MBGameCards.getCardsForClanExchange !== 'function') return null;
        var cards = window.MBGameCards.getCardsForClanExchange();
        if (!Array.isArray(cards)) return null;
        var synced = await db.rpc('sync_clan_card_inventory', { p_cards: cards });
        if (synced.error) throw synced.error;
        (synced.data || []).forEach(function (row) {
            if (row && row.ownership_status === 'transferred' && row.result_card_uid) {
                window.MBGameCards.removeTransferredCard(row.result_card_uid);
            }
        });
        return window.MBGameCards.getCardsForClanExchange();
    }

    async function deliverPendingClanCards() {
        if (!db || !currentUser || !window.MBGameCards || typeof window.MBGameCards.addReceivedClanCards !== 'function') return;
        var pending = await db.rpc('get_pending_clan_card_gifts');
        if (pending.error) throw pending.error;
        if (!pending.data || !pending.data.length) return;
        var applied = window.MBGameCards.addReceivedClanCards(pending.data);
        if (!applied || !applied.ready || !applied.cardUids || !applied.cardUids.length) return;
        var ack = await db.rpc('acknowledge_clan_card_gifts', { p_card_uids: applied.cardUids });
        if (ack.error) throw ack.error;
        if (applied.added > 0) {
            setNotice('🎁 Получено карт от соклановцев: ' + applied.added + '. Уровень и опыт мастерства сохранены.', 'success');
        }
    }

    async function processClanCardInbox() {
        if (!db || !currentUser) return null;
        var cards = await syncOwnedClanCards();
        if (!Array.isArray(cards)) return null;
        await deliverPendingClanCards();
        return window.MBGameCards.getCardsForClanExchange();
    }

    async function closeGiftRealtime() {
        var oldChannel = giftRealtimeChannel;
        giftRealtimeChannel = null;
        giftRealtimeUserId = null;
        if (oldChannel && db) {
            try { await db.removeChannel(oldChannel); } catch (_error) {}
        }
    }

    async function ensureGiftRealtime() {
        if (!db || !currentUser) return;
        if (giftRealtimeChannel && giftRealtimeUserId === currentUser.id) return;
        await closeGiftRealtime();
        var userId = currentUser.id;
        giftRealtimeUserId = userId;
        giftRealtimeChannel = db.channel('mb-clan-card-gifts-' + userId)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'clan_card_gifts',
                filter: 'recipient_id=eq.' + userId
            }, function () {
                window.setTimeout(function () {
                    if (currentUser && currentUser.id === userId) {
                        if (currentClan) {
                            refreshClanCardExchange().catch(function (error) { setNotice(friendlyError(error), 'error'); });
                        } else {
                            processClanCardInbox().catch(function (error) { setNotice(friendlyError(error), 'error'); });
                        }
                    }
                }, 250);
            })
            .subscribe(function (status, error) {
                if (giftRealtimeUserId !== userId) return;
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.warn('[MB online] Realtime доставки карт временно недоступен:', error || status);
                }
            });
    }

    function masteryLabel(card) {
        var level = Math.max(1, Math.min(7, Math.floor(Number(card && card.mastery) || 1)));
        var exp = Math.max(0, Math.floor(Number(card && card.masteryExp) || 0));
        return level + '★' + (level < 7 ? ' · ' + exp + ' опыта' : ' · MAX');
    }

    async function cancelClanCardRequest(request) {
        if (!db || !currentUser || !request || busy) return;
        try {
            var result = await db.rpc('cancel_clan_card_request', { p_request_id: request.id });
            if (result.error) throw result.error;
            setNotice('Запрос карты отменён.', 'success');
            await refreshClanCardExchange();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        }
    }

    async function giftCardToRequest(request, cardUid, button) {
        if (!db || !currentUser || !currentClan || !request || !cardUid) return;
        if (button) button.disabled = true;
        try {
            var cards = await syncOwnedClanCards();
            if (!Array.isArray(cards)) throw new Error('card_active_save_missing');
            var selected = cards.find(function (card) { return card && card._mbCardUid === cardUid; });
            if (!selected) throw new Error('card_not_owned');
            if (!isGiftableCard(selected)) throw new Error('card_rarity_blocked');
            if (selected.name !== request.card_name) throw new Error('card_request_name_mismatch');
            var transfer = await db.rpc('transfer_clan_card', {
                p_request_id: request.id,
                p_card_uid: cardUid
            });
            if (transfer.error) throw transfer.error;
            window.MBGameCards.removeTransferredCard(cardUid);
            setNotice('🎁 ' + selected.name + ' (' + masteryLabel(selected) + ') передана игроку. Эта копия исчезла из твоего инвентаря.', 'success');
            await refreshClanCardExchange();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
            if (button) button.disabled = false;
        }
    }

    async function submitClanCardRequest(event) {
        if (event) event.preventDefault();
        if (!db || !currentUser || !currentClan) return setNotice('Сначала вступи в клан.', 'error');
        var select = byId('clanCardRequestSelect');
        var name = select ? select.value : '';
        if (!name) return setNotice('Выбери карту, которую хочешь попросить.', 'error');
        var button = byId('clanCardRequestBtn');
        if (button) button.disabled = true;
        try {
            var result = await db.rpc('request_clan_card', { p_card_name: name });
            if (result.error) throw result.error;
            setNotice('📣 Запрос на карту «' + name + '» опубликован для соклановцев.', 'success');
            await refreshClanCardExchange();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            if (button) button.disabled = busy;
        }
    }

    function renderClanCardRequests(requests, profilesById, ownedCards) {
        var container = byId('clanCardRequests');
        if (!container) return;
        container.replaceChildren();
        if (!requests || !requests.length) {
            container.appendChild(node('p', 'clan-muted', 'Пока никто не просит карты. Можешь оставить первый запрос!'));
            return;
        }

        requests.forEach(function (request) {
            var profile = profilesById[request.user_id] || {};
            var row = node('div', 'clan-row');
            var main = node('div', 'clan-row-main');
            var heading = node('div', 'clan-row-heading');
            heading.appendChild(node('strong', '', '🎴 ' + request.card_name));
            main.appendChild(heading);
            var time = new Date(request.created_at);
            var when = Number.isNaN(time.getTime()) ? '' : time.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            main.appendChild(node('div', 'clan-muted', 'Запросил: ' + (profile.display_name || 'Игрок') + (when ? ' · ' + when : '')));
            row.appendChild(main);

            if (request.status === 'fulfilled') {
                var fulfilledProfile = profilesById[request.fulfilled_by] || {};
                row.appendChild(node('span', 'clan-pill', '✅ Передано' + (fulfilledProfile.display_name ? ' · ' + fulfilledProfile.display_name : '')));
            } else if (request.status === 'cancelled') {
                row.appendChild(node('span', 'clan-pill clan-pill-muted', 'Запрос отменён'));
            } else if (request.user_id === currentUser.id) {
                row.appendChild(actionButton('Отменить', 'btn clan-danger-btn', function () {
                    cancelClanCardRequest(request);
                }));
            } else {
                var matching = (ownedCards || []).filter(function (card) {
                    return card && card.name === request.card_name && isGiftableCard(card);
                });
                if (!matching.length) {
                    row.appendChild(node('span', 'clan-muted', 'Нет этой карты в активном сохранении'));
                } else {
                    var controls = node('div', '');
                    controls.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:100%;';
                    var select = node('select', '');
                    select.style.cssText = 'max-width:220px;min-width:140px;padding:7px;border-radius:10px;background:#151522;color:white;border:1px solid rgba(255,255,255,.18);';
                    matching.forEach(function (card) {
                        var option = node('option', '', card.name + ' · ' + card.rarity + ' · ' + masteryLabel(card));
                        option.value = card._mbCardUid;
                        select.appendChild(option);
                    });
                    var giftBtn = actionButton('🎁 Передать', 'btn btn-primary', function () {
                        giftCardToRequest(request, select.value, giftBtn);
                    });
                    controls.appendChild(select);
                    controls.appendChild(giftBtn);
                    row.appendChild(controls);
                }
            }
            container.appendChild(row);
        });
    }

    async function refreshClanCardExchangeImpl() {
        var card = byId('clanCardExchangeCard');
        if (!card) return;
        if (!db || !currentUser || !currentClan) {
            card.style.display = 'none';
            return;
        }
        card.style.display = 'block';
        populateClanCardRequestOptions();
        var ownedCards = [];
        try {
            var syncedCards = await processClanCardInbox();
            if (Array.isArray(syncedCards)) ownedCards = syncedCards.filter(isGiftableCard);
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        }

        var quotaText = byId('clanGiftQuota');
        var quota = await db.rpc('get_clan_card_gift_status');
        if (quota.error) throw quota.error;
        var quotaRow = quota.data && quota.data[0] ? quota.data[0] : { gifts_used: 0, gifts_remaining: 3 };
        if (quotaText) {
            quotaText.textContent = '🎁 Передач сегодня: ' + quotaRow.gifts_used + '/3 · Осталось: ' + quotaRow.gifts_remaining + '. Лимит общий для всех кланов.';
        }

        var requestsResult = await db.from('clan_card_requests')
            .select('id, clan_id, user_id, card_name, status, fulfilled_by, created_at, fulfilled_at')
            .eq('clan_id', currentClan.id)
            .order('created_at', { ascending: false })
            .limit(50);
        if (requestsResult.error) throw requestsResult.error;
        var requests = requestsResult.data || [];
        var profileIds = [];
        requests.forEach(function (request) {
            if (request.user_id && profileIds.indexOf(request.user_id) < 0) profileIds.push(request.user_id);
            if (request.fulfilled_by && profileIds.indexOf(request.fulfilled_by) < 0) profileIds.push(request.fulfilled_by);
        });
        var profilesById = Object.create(null);
        if (profileIds.length) {
            var profileResult = await db.from('profiles').select('id, display_name, avatar_name').in('id', profileIds);
            if (profileResult.error) throw profileResult.error;
            (profileResult.data || []).forEach(function (profile) { profilesById[profile.id] = profile; });
        }
        renderClanCardRequests(requests, profilesById, ownedCards);

        var requestBtn = byId('clanCardRequestBtn');
        if (requestBtn) requestBtn.disabled = (quotaRow.gifts_remaining < 0) || busy;
    }

    function refreshClanCardExchange() {
        if (cardExchangeRefreshPromise) return cardExchangeRefreshPromise;
        var work = refreshClanCardExchangeImpl();
        var wrapped;
        wrapped = work.finally(function () {
            if (cardExchangeRefreshPromise === wrapped) cardExchangeRefreshPromise = null;
        });
        cardExchangeRefreshPromise = wrapped;
        return wrapped;
    }

    async function refreshAll() {
        if (!db || !currentUser) {
            currentClan = null;
            currentProfile = null;
            await closeClanChat();
            await closeGiftRealtime();
            var exchangeCard = byId('clanCardExchangeCard');
            if (exchangeCard) exchangeCard.style.display = 'none';
            showAuthState();
            var list = byId('clanList');
            if (list) {
                list.replaceChildren();
                list.appendChild(node('p', 'clan-muted', 'Войди в аккаунт, чтобы смотреть кланы и вступать в них.'));
            }
            return;
        }
        showAuthState();
        try {
            await loadProfile();
            await loadMyClan();
            await ensureGiftRealtime();
            if (!currentClan) await processClanCardInbox();
            await loadCurrentClanCard();
            await loadClanList();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        }
    }

    async function register() {
        if (!db) return setNotice('Сначала настрой Supabase: см. ONLINE_SETUP.md.', 'error');
        var email = byId('clansEmail').value.trim();
        var password = byId('clansPassword').value;
        var displayName = byId('clansDisplayName').value.trim() || 'Игрок';
        if (!email || !password) return setNotice('Введи почту и пароль.', 'error');
        if (password.length < 8) return setNotice('Пароль должен содержать минимум 8 символов.', 'error');
        setBusy(true);
        try {
            var result = await db.auth.signUp({
                email: email,
                password: password,
                options: { data: { display_name: displayName.slice(0, 24) } }
            });
            if (result.error) throw result.error;
            if (result.data.session) {
                currentUser = result.data.user;
                setNotice('Аккаунт создан. Добро пожаловать!', 'success');
                await refreshAll();
            } else {
                setNotice('Аккаунт создан. Проверь почту и перейди по ссылке подтверждения, затем войди.', 'success');
            }
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    async function login() {
        if (!db) return setNotice('Сначала настрой Supabase: см. ONLINE_SETUP.md.', 'error');
        var email = byId('clansEmail').value.trim();
        var password = byId('clansPassword').value;
        if (!email || !password) return setNotice('Введи почту и пароль.', 'error');
        setBusy(true);
        try {
            var result = await db.auth.signInWithPassword({ email: email, password: password });
            if (result.error) throw result.error;
            currentUser = result.data.user;
            setNotice('Вход выполнен.', 'success');
            await refreshAll();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    async function logout() {
        if (!db) return;
        setBusy(true);
        try {
            var result = await db.auth.signOut();
            if (result.error) throw result.error;
            currentUser = null;
            currentClan = null;
            await closeClanChat();
            await closeGiftRealtime();
            setNotice('Ты вышел из аккаунта.', 'success');
            showAuthState();
            await refreshAll();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    async function createClan(event) {
        if (event) event.preventDefault();
        if (!db || !currentUser) return setNotice('Сначала войди в аккаунт.', 'error');
        var name = byId('clanNameInput').value.trim();
        var tag = byId('clanTagInput').value.trim();
        var description = byId('clanDescriptionInput').value.trim();
        if (name.length < 3 || name.length > 24) return setNotice('Название клана должно содержать от 3 до 24 символов.', 'error');
        var compactTag = tag.replace(/[^a-z0-9]/gi, '');
        if (compactTag.length < 2 || compactTag.length > 5) {
            return setNotice('Тег должен содержать от 2 до 5 английских букв или цифр.', 'error');
        }
        setBusy(true);
        try {
            var result = await db.rpc('create_clan', {
                p_name: name,
                p_tag: tag,
                p_description: description
            });
            if (result.error) throw result.error;
            byId('clanCreateForm').reset();
            setNotice('Клан создан! Ты назначен лидером.', 'success');
            await refreshAll();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    async function joinClan(clanId) {
        if (!db || !currentUser) return setNotice('Сначала войди в аккаунт.', 'error');
        if (currentClan) return setNotice('Сначала выйди из текущего клана.', 'error');
        if (busy) return;
        setBusy(true);
        try {
            var result = await db.rpc('join_clan', { p_clan_id: clanId });
            if (result.error) throw result.error;
            setNotice('Ты вступил в клан!', 'success');
            await refreshAll();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    async function leaveClan() {
        if (!currentClan || !db) return;
        if (!window.confirm('Точно покинуть клан [' + currentClan.tag + '] ' + currentClan.name + '?')) return;
        setBusy(true);
        try {
            var result = await db.rpc('leave_clan');
            if (result.error) throw result.error;
            setNotice('Ты покинул клан.', 'success');
            await refreshAll();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    async function disbandClan() {
        if (!currentClan || !db) return;
        var message = 'Распустить клан [' + currentClan.tag + '] ' + currentClan.name + ' для всех участников? Это действие нельзя отменить.';
        if (!window.confirm(message)) return;
        setBusy(true);
        try {
            var result = await db.rpc('disband_clan', { p_clan_id: currentClan.id });
            if (result.error) throw result.error;
            setNotice('Клан распущен.', 'success');
            await refreshAll();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    function bindEvents() {
        if (initialized) return;
        initialized = true;
        byId('clansAuthForm').addEventListener('submit', function (event) {
            event.preventDefault();
            register();
        });
        byId('clansLoginBtn').addEventListener('click', login);
        byId('clansLogoutBtn').addEventListener('click', logout);
        byId('clanCreateForm').addEventListener('submit', createClan);
        byId('clanProfileForm').addEventListener('submit', saveProfile);
        byId('clanChatForm').addEventListener('submit', sendClanChatMessage);
        byId('clanCardRequestForm').addEventListener('submit', submitClanCardRequest);
        populateClanCardRequestOptions();
        byId('clanPublicProfileClose').addEventListener('click', hidePublicProfile);
        var tab = document.querySelector('.tab-btn[data-tab="clans"]');
        if (tab) {
            tab.addEventListener('click', function () {
                if (currentUser) refreshAll();
            });
        }
    }

    async function init() {
        bindEvents();
        if (!isConfigured()) {
            setNotice('Онлайн-кланы почти готовы, но Supabase ещё не настроен. Открой ONLINE_SETUP.md и заполни supabase-config.js.', 'warning');
            showAuthState();
            var list = byId('clanList');
            if (list) {
                list.replaceChildren();
                list.appendChild(node('p', 'clan-muted', 'После настройки Supabase здесь появится список кланов.'));
            }
            return;
        }
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            setNotice('Не загрузилась библиотека Supabase. Проверь подключение к интернету или CDN.', 'error');
            var unavailableList = byId('clanList');
            if (unavailableList) {
                unavailableList.replaceChildren();
                unavailableList.appendChild(node('p', 'clan-muted', 'Список кланов недоступен, пока библиотека не загрузится.'));
            }
            return;
        }
        try {
            var config = window.MB_SUPABASE_CONFIG || {};
            db = window.supabase.createClient(config.url, config.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            var sessionResult = await db.auth.getSession();
            if (sessionResult.error) throw sessionResult.error;
            currentUser = sessionResult.data.session ? sessionResult.data.session.user : null;
            showAuthState();
            await refreshAll();
            db.auth.onAuthStateChange(function (_event, session) {
                currentUser = session ? session.user : null;
                window.setTimeout(function () {
                    showAuthState();
                    refreshAll();
                }, 0);
            });
            setNotice(currentUser ? 'Онлайн подключён.' : 'Войди или зарегистрируйся, чтобы начать.', 'success');
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    window.MBClans = {
        refresh: refreshAll,
        syncGameStats: syncGameStats,
        syncCardInventory: processClanCardInbox,
        refreshCardExchange: refreshClanCardExchange,
        isConnected: function () { return !!db; }
    };
})();
