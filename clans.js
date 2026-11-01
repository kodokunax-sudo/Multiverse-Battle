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
    var globalChatChannel = null;
    var globalChatUserId = null;
    var globalChatMessages = [];
    var globalChatSending = false;
    var lastStatsFingerprint = '';
    var lastStatsSyncAt = 0;
    var pendingStatsSyncTimer = null;
    var activeAuthSlot = null;
    var activeAccountSessionId = null;
    var activeAccountAuthSessionId = null;
    var activeAccountSessionUserId = null;
    var activeAccountSessionHeartbeatTimer = null;
    var clientTabSessionId = null;
    var accountSessionBlocked = false;
    var accountSessionLockOverlay = null;
    var authStateSubscription = null;
    var authSwitchChain = Promise.resolve();
    var profileShowcaseSelection = [];
    var profileShowcaseSavedCards = [];
    var currentFriends = [];
    var currentFriendRequests = [];
    var currentClanInvites = [];
    var currentFriendSearchResults = [];
    var publicProfileUserId = null;
    var publicActivityRefreshTimer = null;
    var publicProfileCreatedAtFallback = null;
    var presenceHeartbeatTimer = null;
    var ownStatsData = null;
    var publicStatsData = null;
    var ownStatsMode = 'rebirth';
    var publicStatsMode = 'rebirth';
    var populationStatsData = null;
    var populationStatsFetchedAt = 0;
    var populationStatsPromise = null;
    var gameAnalyticsSessionId = null;
    var gameAnalyticsUserId = null;
    var gameActivityStatsCache = Object.create(null);
    var gameAnalyticsLastActivityAt = Date.now();
    var GAME_ANALYTICS_IDLE_LIMIT_MS = 5 * 60 * 1000;
    var activeUniqueBossAttempt = null;
    var uniqueBossStatsCache = Object.create(null);
    var NEW_ACCOUNT_SLOT_TRANSFER_KEY = 'mb_new_account_slot_transfer_user_v1';

    function isPendingNewAccountTransfer(userId) {
        try { return !!userId && localStorage.getItem(NEW_ACCOUNT_SLOT_TRANSFER_KEY) === userId; }
        catch (_error) { return false; }
    }


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
            active_session_required: 'Эта игровая сессия больше не активна. Повтори вход, чтобы проверить аккаунт.',
            invalid_clan_name: 'Название клана должно содержать от 3 до 24 символов.',
            invalid_clan_tag: 'Тег клана должен содержать от 2 до 5 английских букв или цифр.',
            description_too_long: 'Описание клана не должно превышать 160 символов.',
            profile_name_invalid: 'Имя профиля должно содержать от 1 до 24 символов.',
            profile_description_too_long: 'Описание профиля не должно превышать 280 символов.',
            clan_chat_empty: 'Сообщение не может быть пустым.',
            global_chat_auth_required: 'Войди в аккаунт, чтобы писать в общий чат.',
            global_chat_empty: 'Напиши сообщение перед отправкой.',
            global_chat_too_long: 'Сообщение слишком длинное: максимум 300 символов.',
            global_chat_rate_limited: 'Не так быстро! Подожди несколько секунд перед следующим сообщением.',
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
            friend_search_too_short: 'Введи минимум 2 символа ника или код игрока.',
            friend_target_invalid: 'Нельзя отправить заявку самому себе.',
            friend_action_invalid: 'Недопустимое действие с заявкой в друзья.',
            friend_request_not_incoming: 'Эта входящая заявка уже недоступна.',
            friend_request_not_outgoing: 'Исходящая заявка уже недоступна.',
            friendship_not_found: 'Дружба или заявка уже изменились.',
            clan_invite_leader_only: 'Приглашать друзей могут только лидер и офицеры клана.',
            clan_invite_friends_only: 'Сначала добавь игрока в друзья.',
            clan_invite_target_in_clan: 'Этот игрок уже состоит в клане.',
            clan_invite_target_invalid: 'Нельзя пригласить самого себя.',
            clan_invite_not_found: 'Приглашение уже недоступно или истекло.',
            clan_invite_not_recipient: 'Это приглашение предназначено другому игроку.',
            clan_invite_not_sender: 'Отменить можно только своё приглашение.',
            clan_invite_action_invalid: 'Недопустимое действие с приглашением.',
            card_active_save_missing: 'Сначала открой игру и загрузи слот сохранения, где лежит эта карта.',
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
        ['clansRegisterBtn', 'clansLoginBtn', 'clansLogoutBtn', 'clanCreateBtn', 'clansProfileSaveBtn', 'clanChatSendBtn', 'globalChatSendBtn'].forEach(function (id) {
            var el = byId(id);
            if (el) el.disabled = busy;
        });
        document.querySelectorAll('#clanList button, #clanCurrentCard button, #clanDangerZone button, #clanProfileForm button').forEach(function (el) {
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
            byId('clansSignedInAs').textContent = 'Слот ' + (getCurrentGameSlot() + 1) + ' · ' + (title ? title + ' · ' : '') + email;
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
        if (typeof currentSlot !== 'undefined' && Number(currentSlot) < 0) return null;
        try {
            if (typeof window.MBSyncMasteryTitleUnlocks === 'function') window.MBSyncMasteryTitleUnlocks();
            var wins = typeof totalWins !== 'undefined' ? totalWins : 0;
            var bestWave = typeof highestWaveReached !== 'undefined' ? highestWaveReached : (typeof wave !== 'undefined' ? wave : 1);
            var rebirths = typeof rebirthCount !== 'undefined' ? rebirthCount : 0;
            var cards = typeof totalCardsObtained !== 'undefined' ? totalCardsObtained : (typeof myCards !== 'undefined' && Array.isArray(myCards) ? myCards.length : 0);
            var bosses = typeof defeatedBosses !== 'undefined' && Array.isArray(defeatedBosses) ? defeatedBosses.length : 0;
            var clicks = typeof totalClicks !== 'undefined' ? totalClicks : 0;
            var result = {
                total_wins: safeCount(wins),
                highest_wave: Math.max(1, safeCount(bestWave)),
                rebirth_count: safeCount(rebirths, 1000000),
                cards_collected: safeCount(cards),
                bosses_defeated: safeCount(bosses, 1000000),
                total_clicks: safeCount(clicks)
            };
            result.current_wave = Math.max(1, safeCount(typeof wave !== 'undefined' ? wave : 1));
            var highestRecordedCheckpoint = typeof highestCheckpoint !== 'undefined' ? highestCheckpoint : 1;
            if (typeof rebirthStats !== 'undefined' && Array.isArray(rebirthStats)) {
                rebirthStats.forEach(function (entry) {
                    highestRecordedCheckpoint = Math.max(highestRecordedCheckpoint, safeCount(entry && entry.highestCheckpoint));
                });
            }
            result.highest_checkpoint = Math.max(1, safeCount(highestRecordedCheckpoint));
            result.achievement_title_unlocks = (typeof slotData !== 'undefined' && slotData && Array.isArray(slotData.achievementTitleUnlocks))
                ? slotData.achievementTitleUnlocks.slice() : [];
            if (window.MBGameStats && typeof window.MBGameStats.getSnapshot === 'function') {
                var expanded = window.MBGameStats.getSnapshot();
                if (expanded && typeof expanded === 'object') {
                    result.current_rebirth_stats = expanded.current_rebirth_stats || {};
                    result.lifetime_stats = expanded.lifetime_stats || {};
                    result.rebirth_history = Array.isArray(expanded.rebirth_history) ? expanded.rebirth_history : [];
                    result.total_wins = safeCount(expanded.lifetime_stats && expanded.lifetime_stats.wavesCleared);
                    result.highest_wave = Math.max(result.highest_wave, safeCount(expanded.lifetime_stats && expanded.lifetime_stats.highestWave, 1000000000));
                    result.bosses_defeated = safeCount(expanded.lifetime_stats && expanded.lifetime_stats.bossesDefeated, 1000000000);
                }
            }
            return result;
        } catch (_error) {
            return null;
        }
    }

    function formatCount(value) {
        try { return Math.max(0, Number(value) || 0).toLocaleString('ru-RU'); }
        catch (_error) { return String(value || 0); }
    }

    function formatActivityDate(value) {
        if (!value) return '';
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('ru-RU', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function renderPublicActivity(activity, createdAtFallback) {
        var badge = byId('clanPublicPresenceBadge');
        var created = byId('clanPublicCreatedAt');
        var lastSeen = byId('clanPublicLastSeen');
        var hasStatus = !!activity && typeof activity.is_online === 'boolean';
        var online = hasStatus && activity.is_online === true;

        if (badge) {
            badge.textContent = hasStatus ? (online ? '● В СЕТИ' : '○ НЕ В СЕТИ') : 'СТАТУС НЕ ДОСТУПЕН';
            badge.classList.toggle('online', hasStatus && online);
            badge.classList.toggle('offline', hasStatus && !online);
            badge.classList.toggle('status-unknown', !hasStatus);
        }

        var createdAt = activity && activity.account_created_at ? activity.account_created_at : createdAtFallback;
        if (created) {
            var formattedCreated = formatActivityDate(createdAt);
            created.textContent = formattedCreated ? 'Аккаунт создан: ' + formattedCreated : 'Аккаунт создан: нет данных';
        }
        if (lastSeen) {
            var seen = activity && activity.last_seen_at ? formatActivityDate(activity.last_seen_at) : '';
            if (online) lastSeen.textContent = 'Последний заход: сейчас';
            else lastSeen.textContent = seen ? 'Последний заход: ' + seen : 'Последний заход: нет данных';
        }
    }

    async function refreshPublicProfileActivity(userId, createdAtFallback) {
        if (!db || !currentUser || !userId || publicProfileUserId !== userId) return;
        var client = db;
        var result = await client.rpc('mb_get_player_activity', { p_user_id: userId });
        if (result.error) throw result.error;
        if (client !== db || publicProfileUserId !== userId) return;
        var activity = Array.isArray(result.data) ? result.data[0] : result.data;
        if (!activity) throw new Error('profile_not_found');
        renderPublicActivity(activity, createdAtFallback);
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

    var ACHIEVEMENT_TITLES = [
        { id: 'wave_100', icon: '🌊', label: 'Покоритель волн', description: 'Достичь 250-й волны', reward: {"stars":1000,"powerPoints":5,"freeSpins":0,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.highest_wave) >= 250; } },
        { id: 'boss_hunter', icon: '👹', label: 'Убийца боссов', description: 'Победить 100 боссов', reward: {"stars":7500,"powerPoints":100,"freeSpins":1,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.bosses_defeated) >= 100; } },
        { id: 'collector', icon: '🎴', label: 'Коллекционер', description: 'Собрать всего 400 карт', reward: {"stars":10000,"powerPoints":250,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.cards_collected) >= 400; } },
        { id: 'champion', icon: '🏆', label: 'Чемпион', description: 'Одержать 1000 побед', reward: {"stars":15000,"powerPoints":300,"freeSpins":1,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_wins) >= 1000; } },
        { id: 'reborn', icon: '♻️', label: 'Перерождённый', description: 'Совершить 15 перерождений', reward: {"stars":10000,"powerPoints":200,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.rebirth_count, 1000000) >= 15; } },
        { id: 'multiverse_legend', icon: '🌌', label: 'Легенда мультивселенной', description: 'Достичь 1500-й волны и победить 50 боссов', reward: {"stars":100000,"powerPoints":1000,"freeSpins":2,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.highest_wave)  >= 1500 && safeCount(s.bosses_defeated) >= 50; } },
        { id: 'wave_200', icon: '🌊', label: 'Морской налоговик', description: 'Достичь 400-й волны', reward: {"stars":3000,"powerPoints":10,"freeSpins":0,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.highest_wave) >= 400; } },
        { id: 'wave_300', icon: '🏄', label: 'Сёрфер апокалипсиса', description: 'Достичь 600-й волны', reward: {"stars":5000,"powerPoints":25,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.highest_wave) >= 600; } },
        { id: 'wave_500', icon: '🌊', label: 'Волны мне должны', description: 'Достичь 900-й волны', reward: {"stars":10000,"powerPoints":50,"freeSpins":0,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.highest_wave) >= 900; } },
        { id: 'wave_750', icon: '🧭', label: 'Уже виден берег?', description: 'Достичь 1200-й волны', reward: {"stars":15000,"powerPoints":100,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.highest_wave) >= 1200; } },
        { id: 'wave_1500', icon: '🌀', label: 'Анти-Спираль на минималках', description: 'Достичь 2500-й волны', reward: {"stars":50000,"powerPoints":500,"freeSpins":0,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.highest_wave) >= 2500; } },
        { id: 'wave_2000', icon: '🌌', label: 'Сменщик океана', description: 'Достичь 3000-й волны', reward: {"stars":75000,"powerPoints":750,"freeSpins":2,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.highest_wave) >= 3000; } },
        { id: 'wave_5000', icon: '🛟', label: 'Море закончилось, где продолжение?', description: 'Достичь 7500-й волны', reward: {"stars":250000,"powerPoints":2500,"freeSpins":0,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.highest_wave) >= 7500; } },
        { id: 'wave_10000', icon: '♾️', label: 'Тут вообще есть финал?', description: 'Достичь 15000-й волны', reward: {"stars":1000000,"powerPoints":10000,"freeSpins":5,"legendarySpins":2,"secretSpins":1}, unlocked: function (s) { return safeCount(s.highest_wave) >= 15000; } },
        { id: 'bosses_1', icon: '🎯', label: 'Разминка закончилась', description: 'Победить 3 босса', reward: {"stars":1000,"powerPoints":5,"freeSpins":0,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.bosses_defeated) >= 3; } },
        { id: 'bosses_5', icon: '📋', label: 'Начальник отдела боссов', description: 'Победить 15 боссов', reward: {"stars":2500,"powerPoints":10,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.bosses_defeated) >= 15; } },
        { id: 'bosses_25', icon: '🪓', label: 'Сокращатель боссов', description: 'Победить 60 боссов', reward: {"stars":5000,"powerPoints":50,"freeSpins":1,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.bosses_defeated) >= 60; } },
        { id: 'bosses_50', icon: '🧾', label: 'Боссам не платят за переработку', description: 'Победить 125 боссов', reward: {"stars":10000,"powerPoints":100,"freeSpins":0,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.bosses_defeated) >= 125; } },
        { id: 'bosses_100', icon: '⚖️', label: 'Директор по ликвидации', description: 'Победить 250 боссов', reward: {"stars":25000,"powerPoints":250,"freeSpins":0,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.bosses_defeated) >= 250; } },
        { id: 'bosses_250', icon: '📊', label: 'Боссовый бухгалтер', description: 'Победить 1000 боссов', reward: {"stars":100000,"powerPoints":1000,"freeSpins":1,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.bosses_defeated) >= 1000; } },
        { id: 'bosses_500', icon: '🌠', label: 'Увольнение всей вселенной', description: 'Победить 5000 боссов', reward: {"stars":1000000,"powerPoints":10000,"freeSpins":2,"legendarySpins":2,"secretSpins":1}, unlocked: function (s) { return safeCount(s.bosses_defeated) >= 5000; } },
        { id: 'wins_1', icon: '🥇', label: 'Я только начал!', description: 'Одержать 5 побед', reward: {"stars":1000,"powerPoints":5,"freeSpins":0,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_wins) >= 5; } },
        { id: 'wins_50', icon: '🎮', label: 'Победа? Какая неожиданность', description: 'Одержать 100 побед', reward: {"stars":5000,"powerPoints":50,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_wins) >= 100; } },
        { id: 'wins_100', icon: '🛡️', label: 'Кто следующий?', description: 'Одержать 250 побед', reward: {"stars":15000,"powerPoints":150,"freeSpins":0,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_wins) >= 250; } },
        { id: 'wins_250', icon: '🔨', label: 'Кнопка победы запала', description: 'Одержать 500 побед', reward: {"stars":30000,"powerPoints":300,"freeSpins":1,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_wins) >= 500; } },
        { id: 'wins_500', icon: '🏅', label: 'Профессиональный победитель', description: 'Одержать 1200 побед', reward: {"stars":150000,"powerPoints":1500,"freeSpins":0,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_wins) >= 1200; } },
        { id: 'wins_1000', icon: '👑', label: 'Судья сказал: хватит', description: 'Одержать 2500 побед', reward: {"stars":500000,"powerPoints":5000,"freeSpins":0,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.total_wins) >= 2500; } },
        { id: 'cards_100', icon: '🃏', label: 'Картонный коллекционер', description: 'Собрать 150 карт', reward: {"stars":2500,"powerPoints":20,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.cards_collected) >= 150; } },
        { id: 'cards_250', icon: '💼', label: 'Карточный барон', description: 'Собрать 400 карт', reward: {"stars":5000,"powerPoints":50,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.cards_collected) >= 400; } },
        { id: 'cards_500', icon: '📦', label: 'Хранитель склада', description: 'Собрать 900 карт', reward: {"stars":25000,"powerPoints":250,"freeSpins":1,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.cards_collected) >= 900; } },
        { id: 'cards_1000', icon: '🕳️', label: 'Карточная чёрная дыра', description: 'Собрать 2000 карт', reward: {"stars":250000,"powerPoints":2500,"freeSpins":2,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.cards_collected) >= 2000; } },
        { id: 'rebirth_1', icon: '🔁', label: 'Обновление личности', description: 'Совершить 3 перерождений', reward: {"stars":5000,"powerPoints":50,"freeSpins":0,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.rebirth_count, 1000000) >= 3; } },
        { id: 'rebirth_10', icon: '♻️', label: 'Перезагрузился и вернулся', description: 'Совершить 20 перерождений', reward: {"stars":15000,"powerPoints":150,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.rebirth_count, 1000000) >= 20; } },
        { id: 'rebirth_25', icon: '🔥', label: 'Феникс с подпиской', description: 'Совершить 50 перерождений', reward: {"stars":50000,"powerPoints":500,"freeSpins":0,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.rebirth_count, 1000000) >= 50; } },
        { id: 'rebirth_50', icon: '💀', label: 'Смерть, отмена', description: 'Совершить 100 перерождений', reward: {"stars":150000,"powerPoints":1500,"freeSpins":2,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.rebirth_count, 1000000) >= 100; } },
        { id: 'rebirth_100', icon: '🧬', label: 'Бессмертие по договору', description: 'Совершить 200 перерождений', reward: {"stars":500000,"powerPoints":5000,"freeSpins":0,"legendarySpins":2,"secretSpins":1}, unlocked: function (s) { return safeCount(s.rebirth_count, 1000000) >= 200; } },
        { id: 'clicks_1000', icon: '🖱️', label: 'Мышь просит отпуск', description: 'Сделать 5000 кликов', reward: {"stars":1000,"powerPoints":5,"freeSpins":0,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_clicks) >= 5000; } },
        { id: 'clicks_10000', icon: '👆', label: 'Авто-кликер в соло!', description: 'Сделать 25000 кликов', reward: {"stars":5000,"powerPoints":20,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_clicks) >= 25000; } },
        { id: 'clicks_50000', icon: '⚡', label: 'Пальцы в эндгейме', description: 'Сделать 100000 кликов', reward: {"stars":15000,"powerPoints":50,"freeSpins":1,"legendarySpins":0,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_clicks) >= 100000; } },
        { id: 'clicks_100000', icon: '⌨️', label: 'Эргономика? Не слышал', description: 'Сделать 250000 кликов', reward: {"stars":50000,"powerPoints":250,"freeSpins":0,"legendarySpins":1,"secretSpins":0}, unlocked: function (s) { return safeCount(s.total_clicks) >= 250000; } },
        { id: 'clicks_1000000', icon: '🦖', label: 'Почётный кликозавр', description: 'Сделать 2500000 кликов', reward: {"stars":500000,"powerPoints":2500,"freeSpins":0,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.total_clicks) >= 2500000; } },
        { id: 'multiverse_parasite', icon: '🌀', label: 'Мое темное прошлое', description: 'Победить 1500-ю волну', reward: {"stars":100000,"powerPoints":1000,"freeSpins":2,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.highest_wave) >= 1500; } },
        { id: 'overqualified', icon: '🎓', label: 'Слишком квалифицирован для туториала', description: 'Одержать 1000 побед и собрать 500 карт', reward: {"stars":150000,"powerPoints":1500,"freeSpins":1,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.total_wins) >= 1000 && safeCount(s.cards_collected) >= 500; } },
        { id: 'rebirth_loop', icon: '🔄', label: 'Я опять здесь?!', description: 'Иметь чекпойнт минимум на 2000-й волне и вернуться на 1-ю волну', reward: {"stars":500000,"powerPoints":5000,"freeSpins":2,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return (safeCount(s.highest_checkpoint) >= 2000 && safeCount(s.current_wave, 1000000000) === 1) || (Array.isArray(s.achievement_title_unlocks) && s.achievement_title_unlocks.indexOf('rebirth_loop') !== -1); } },
        { id: 'card_singularity', icon: '🕳️', label: 'Картонная сингулярность', description: 'Собрать 2000 карт и сделать 250000 кликов', reward: {"stars":500000,"powerPoints":5000,"freeSpins":2,"legendarySpins":1,"secretSpins":1}, unlocked: function (s) { return safeCount(s.cards_collected) >= 2000 && safeCount(s.total_clicks) >= 250000; } },
        { id: 'final_chairman', icon: '🌌', label: 'Последний админ реальности', description: 'Достичь 15000-й волны и победить 1200 боссов', reward: {"stars":2500000,"powerPoints":25000,"freeSpins":5,"legendarySpins":2,"secretSpins":1}, unlocked: function (s) { return safeCount(s.highest_wave) >= 15000 && safeCount(s.bosses_defeated) >= 1200; } },
    ];

    function titleById(id) {
        var achievement = ACHIEVEMENT_TITLES.find(function (title) { return title.id === id; });
        if (achievement) return achievement;
        if (typeof window.MBGetMasteryTitleCatalog === 'function') {
            return window.MBGetMasteryTitleCatalog().find(function (title) { return title.id === id; }) || null;
        }
        return null;
    }
    function titleIsUnlocked(title, stats) {
        var current = stats || {};
        return !!title && (title.unlocked(current) ||
            (Array.isArray(current.achievement_title_unlocks) && current.achievement_title_unlocks.indexOf(title.id) !== -1));
    }
    function isTitleUnlocked(id, stats) {
        if (!id) return true;
        return titleIsUnlocked(titleById(id), stats || {});
    }
    function titleLabel(id) {
        var title = titleById(id);
        return title ? title.icon + ' ' + title.label : '';
    }
    function titleRewardText(reward) {
        if (!reward) return '';
        var parts = [];
        var stars = safeCount(reward.stars, 1000000000), power = safeCount(reward.powerPoints, 1000000000);
        var free = safeCount(reward.freeSpins, 1000), legendary = safeCount(reward.legendarySpins, 1000);
        var secret = safeCount(reward.secretSpins, 1000);
        if (stars) parts.push('+' + formatCount(stars) + ' ⭐');
        if (power) parts.push('+' + formatCount(power) + ' ⚡ силы');
        if (free) parts.push('+' + formatCount(free) + ' обычных круток');
        if (legendary) parts.push('+' + formatCount(legendary) + ' легендарных круток');
        if (secret) parts.push('+' + formatCount(secret) + ' секретных круток');
        return parts.join(' · ');
    }
    function titleRewardFromClaimRow(row) {
        return {
            stars: safeCount(row && row.reward_points, 1000000000),
            powerPoints: safeCount(row && row.reward_power_points, 1000000000),
            freeSpins: safeCount(row && row.reward_free_spins, 1000),
            legendarySpins: safeCount(row && row.reward_legendary_spins, 1000),
            secretSpins: safeCount(row && row.reward_secret_spins, 1000)
        };
    }
    var achievementTitleToastQueue = [];
    var achievementTitleToastActive = false;
    function queueAchievementTitleToast(title) {
        achievementTitleToastQueue.push(title);
        if (!achievementTitleToastActive) showNextAchievementTitleToast();
    }
    function showNextAchievementTitleToast() {
        if (!achievementTitleToastQueue.length) { achievementTitleToastActive = false; return; }
        achievementTitleToastActive = true;
        var title = achievementTitleToastQueue.shift();
        var toast = document.createElement('div');
        toast.setAttribute('role','status'); toast.setAttribute('aria-live','polite');
        toast.style.cssText = 'position:fixed;top:16px;left:50%;transform:translate(-50%,-24px);opacity:0;z-index:999999;width:min(480px,calc(100vw - 24px));box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:13px 42px 13px 14px;border:1px solid rgba(184,153,255,.48);border-radius:17px;background:linear-gradient(120deg,rgba(30,23,48,.98),rgba(16,19,32,.98));box-shadow:0 16px 48px rgba(0,0,0,.48),0 0 28px rgba(151,105,255,.18);backdrop-filter:blur(14px);color:#f5f0ff;transition:opacity .24s ease,transform .24s ease;font-family:inherit;';
        var icon=document.createElement('div'); icon.textContent=title.icon||'🏆';
        icon.style.cssText='flex:0 0 42px;width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:rgba(160,125,255,.17);font-size:24px;';
        var content=document.createElement('div');content.style.cssText='min-width:0;display:flex;flex-direction:column;gap:3px;';
        var kicker=document.createElement('div');kicker.textContent='🏆 НОВЫЙ ТИТУЛ ОТКРЫТ';kicker.style.cssText='font-size:10px;letter-spacing:1.2px;font-weight:950;color:#bda7ff;';
        var heading=document.createElement('div');heading.textContent=title.label;heading.style.cssText='font-size:15px;font-weight:950;line-height:1.25;color:#fff;';
        var detail=document.createElement('div');detail.textContent=title.reward?('Награда: '+titleRewardText(title.reward)+'. Забери её в профиле.'):title.description;
        detail.style.cssText='font-size:11px;line-height:1.35;color:#c9c1da;overflow-wrap:anywhere;';
        content.appendChild(kicker);content.appendChild(heading);content.appendChild(detail);
        var close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Закрыть уведомление');
        close.style.cssText='position:absolute;right:10px;top:8px;border:0;background:transparent;color:#bdb4d0;font-size:23px;line-height:1;cursor:pointer;padding:3px 5px;';
        close.addEventListener('click',function(){toast.style.opacity='0';toast.style.transform='translate(-50%,-24px)';window.setTimeout(function(){if(toast.parentNode)toast.parentNode.removeChild(toast);achievementTitleToastActive=false;showNextAchievementTitleToast();},260);});
        toast.appendChild(icon);toast.appendChild(content);toast.appendChild(close);document.body.appendChild(toast);
        window.requestAnimationFrame(function(){toast.style.opacity='1';toast.style.transform='translate(-50%,0)';});
        if(typeof window.sfxUINotification==='function')window.sfxUINotification();
        window.setTimeout(function(){if(!toast.parentNode)return;toast.style.opacity='0';toast.style.transform='translate(-50%,-24px)';window.setTimeout(function(){if(toast.parentNode)toast.parentNode.removeChild(toast);achievementTitleToastActive=false;showNextAchievementTitleToast();},280);},6200);
    }
    function checkAchievementTitleUnlocks() {
        try {
            if (typeof currentSlot==='undefined'||currentSlot<0||typeof slotData==='undefined'||!slotData)return;
            var owned=Array.isArray(slotData.achievementTitleUnlocks)?slotData.achievementTitleUnlocks.slice():[];
            var initialized=Array.isArray(slotData.achievementTitleNotificationLedger);
            var seen=initialized?slotData.achievementTitleNotificationLedger.slice():[];
            var stats=readLocalGameStats()||{};stats.achievement_title_unlocks=owned.slice();
            var eligible=ACHIEVEMENT_TITLES.filter(function(title){return title.unlocked(stats);});
            if(!initialized){
                eligible.forEach(function(title){
                    if(owned.indexOf(title.id)===-1)owned.push(title.id);
                    if(seen.indexOf(title.id)===-1){
                        seen.push(title.id);
                        var wasUnlockedBeforeUpdate=true;
                        if(title.id==='multiverse_parasite'){
                            wasUnlockedBeforeUpdate=safeCount(stats.highest_wave)>=3000&&safeCount(stats.bosses_defeated)>=150;
                        }else if(title.id==='rebirth_loop'){
                            wasUnlockedBeforeUpdate=safeCount(stats.rebirth_count,1000000)>=50&&safeCount(stats.total_wins)>=250;
                        }
                        if(!wasUnlockedBeforeUpdate)queueAchievementTitleToast(title);
                    }
                });
                slotData.achievementTitleUnlocks=owned;slotData.achievementTitleNotificationLedger=seen;return;
            }
            eligible.forEach(function(title){
                if(owned.indexOf(title.id)!==-1)return;
                owned.push(title.id);
                if(seen.indexOf(title.id)===-1){seen.push(title.id);queueAchievementTitleToast(title);}
            });
            slotData.achievementTitleUnlocks=owned;slotData.achievementTitleNotificationLedger=seen;
        }catch(error){console.warn('[MB titles] Unlock check failed:',error&&error.message?error.message:error);}
    }

    function titleRequirements(title) {
        var overrides = {"wave_100":250,"wave_200":400,"wave_300":600,"wave_500":900,"wave_750":1200,"wave_1500":2500,"wave_2000":3000,"wave_5000":7500,"wave_10000":15000,"bosses_1":3,"bosses_5":15,"bosses_25":60,"bosses_50":125,"bosses_100":250,"bosses_250":1000,"bosses_500":5000,"wins_1":5,"wins_50":100,"wins_100":250,"wins_250":500,"wins_500":1200,"wins_1000":2500,"cards_100":150,"cards_250":400,"cards_500":900,"cards_1000":2000,"rebirth_1":3,"rebirth_10":20,"rebirth_25":50,"rebirth_50":100,"rebirth_100":200,"clicks_1000":5000,"clicks_10000":25000,"clicks_50000":100000,"clicks_100000":250000,"clicks_1000000":2500000};
        var match = title.id.match(/^(wave|bosses|wins|cards|rebirth|clicks)_(\d+)$/);
        var simple = {
            wave: { key: 'highest_wave', label: 'Максимальная волна' },
            bosses: { key: 'bosses_defeated', label: 'Побеждённые боссы' },
            wins: { key: 'total_wins', label: 'Победы' },
            cards: { key: 'cards_collected', label: 'Полученные карты' },
            rebirth: { key: 'rebirth_count', label: 'Перерождения' },
            clicks: { key: 'total_clicks', label: 'Клики' }
        };
        if (match && simple[match[1]]) {
            return [{ key: simple[match[1]].key, label: simple[match[1]].label, target: overrides[title.id] || Number(match[2]) }];
        }
        var combined = {
            boss_hunter: [{ key: 'bosses_defeated', label: 'Побеждённые боссы', target: 100 }],
            collector: [{ key: 'cards_collected', label: 'Полученные карты', target: 400 }],
            champion: [{ key: 'total_wins', label: 'Победы', target: 1000 }],
            reborn: [{ key: 'rebirth_count', label: 'Перерождения', target: 15 }],
            multiverse_legend: [
                { key: 'highest_wave', label: 'Максимальная волна', target: 1500 },
                { key: 'bosses_defeated', label: 'Побеждённые боссы', target: 50 }
            ],
            multiverse_parasite: [
                { key: 'highest_wave', label: 'Победить 1500-ю волну', target: 1500, checkTarget: 1501, offset: 1 }
            ],
            overqualified: [
                { key: 'total_wins', label: 'Победы', target: 1000 },
                { key: 'cards_collected', label: 'Полученные карты', target: 500 }
            ],
            rebirth_loop: [
                { key: 'highest_checkpoint', label: 'Максимальный чекпойнт', target: 2000 },
                { key: 'current_wave', label: 'Текущая волна', target: 1, exact: true }
            ],
            card_singularity: [
                { key: 'cards_collected', label: 'Полученные карты', target: 2000 },
                { key: 'total_clicks', label: 'Клики', target: 250000 }
            ],
            final_chairman: [
                { key: 'highest_wave', label: 'Максимальная волна', target: 15000 },
                { key: 'bosses_defeated', label: 'Побеждённые боссы', target: 1200 }
            ]
        };
        return combined[title.id] || [];
    }

    function showAchievementTitleDetails(_detail, title, stats, allowRewardClaim) {
        var currentStats = stats || {};
        var unlocked = titleIsUnlocked(title, currentStats);
        var overlay = byId('modalOverlay');
        var content = byId('modalContent');
        if (!overlay || !content) {
            if (typeof window.showModal === 'function') window.showModal(title.icon + ' ' + title.label, title.description);
            return;
        }
        if (typeof window.sfxUIModalOpen === 'function') window.sfxUIModalOpen();
        content.replaceChildren();

        var heading = node('h2', 'achievement-title-modal-heading', title.icon + ' ' + title.label);
        heading.style.cssText = 'margin:0 0 14px;color:#ffe29a;font-size:21px;font-weight:950;';
        content.appendChild(heading);

        var body = node('div', 'achievement-title-modal-body');
        body.style.cssText = 'display:flex;flex-direction:column;gap:10px;color:#e9e3f5;font-size:13px;line-height:1.6;';
        var status = node('div', 'achievement-title-detail-status', unlocked ? '✅ Титул уже открыт' : '🔒 Титул ещё не получен');
        status.style.cssText = 'align-self:flex-start;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;color:' +
            (unlocked ? '#9ff0b0;background:rgba(55,190,95,.12);' : '#c8c8cf;background:rgba(255,255,255,.07);');
        body.appendChild(status);

        var instruction = node('p', 'achievement-title-detail-instruction', 'Как получить: ' + title.description + '.');
        instruction.style.cssText = 'margin:0;color:#f1edf9;';
        body.appendChild(instruction);

        var requirements = titleRequirements(title);
        if (requirements.length) {
            var progress = node('div', 'achievement-title-modal-progress');
            progress.style.cssText = 'display:flex;flex-direction:column;gap:7px;padding:11px 12px;border:1px solid rgba(155,121,255,.2);border-radius:12px;background:rgba(155,121,255,.06);';
            requirements.forEach(function (requirement) {
                var current = safeCount(currentStats[requirement.key]);
                var line = node('div', '');
                line.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;';
                line.appendChild(node('span', '', requirement.label));
                var comparisonTarget = requirement.checkTarget || requirement.target;
                var displayCurrent = requirement.offset ? Math.max(0, current - requirement.offset) : current;
                var meetsRequirement = requirement.exact ? current === requirement.target : current >= comparisonTarget;
                var valueText = requirement.exact
                    ? (meetsRequirement ? '✅ ' + formatCount(current) : formatCount(current) + ' / нужно ' + formatCount(requirement.target))
                    : formatCount(displayCurrent) + ' / ' + formatCount(requirement.target);
                var value = node('strong', '', valueText);
                value.style.cssText = 'color:' + (meetsRequirement ? '#9ff0b0' : '#d1c5f4') + ';white-space:nowrap;';
                line.appendChild(value);
                progress.appendChild(line);
            });
            body.appendChild(progress);
        }

        if (title.reward) {
            var rewardBox=node('div','achievement-title-modal-reward');
            rewardBox.style.cssText='padding:12px;border:1px solid rgba(246,181,27,.26);border-radius:12px;background:linear-gradient(120deg,rgba(246,181,27,.09),rgba(155,121,255,.07));';
            rewardBox.appendChild(node('strong','','🎁 Награда за титул'));
            var rewardLine=node('div','',titleRewardText(title.reward));
            rewardLine.style.cssText='margin-top:7px;color:#ffe29a;font-weight:950;font-size:12px;line-height:1.65;overflow-wrap:anywhere;';
            rewardBox.appendChild(rewardLine);
            var rewardHint=node('p','',unlocked?'Награду можно забрать один раз кнопкой ниже.':'Награда станет доступна после получения титула.');
            rewardHint.style.cssText='margin:5px 0 0;color:#c7bfd7;font-size:11px;';rewardBox.appendChild(rewardHint);
            if(allowRewardClaim&&unlocked&&currentUser){
                var canReceive=typeof window.MBCanReceiveTitleRewardPoints==='function'&&window.MBCanReceiveTitleRewardPoints();
                var claimButton=actionButton(canReceive?'Забрать награду · '+titleRewardText(title.reward):'Открой сохранение для получения награды','btn btn-primary',function(){claimAchievementTitleReward(title.id,claimButton);});
                claimButton.disabled=!canReceive;claimButton.style.cssText='width:100%;margin-top:10px;padding:11px;font-size:12px;';
                claimButton.setAttribute('data-title-reward-button',title.id);rewardBox.appendChild(claimButton);
                db.from('mb_title_reward_claims').select('title_id, granted_at, reward_points, reward_power_points, reward_free_spins, reward_legendary_spins, reward_secret_spins').eq('user_id',currentUser.id).eq('title_id',title.id).maybeSingle().then(function(result){
                    if(!claimButton.isConnected||result.error||!result.data)return;
                    if(result.data.granted_at){claimButton.textContent='✓ Награда уже получена';claimButton.disabled=true;}
                    else{var pendingReward=titleRewardFromClaimRow(result.data);claimButton.textContent=canReceive?'Продолжить получение · '+titleRewardText(pendingReward):'Открой сохранение для продолжения';claimButton.disabled=!canReceive;}
                }).catch(function(error){console.warn('[MB titles] Reward status check failed:',error&&error.message?error.message:error);});
            }else if(allowRewardClaim&&unlocked&&!currentUser){rewardBox.appendChild(node('p','clan-muted','Войди в аккаунт, чтобы забрать награду.'));}
            else if(!allowRewardClaim&&unlocked){rewardBox.appendChild(node('p','clan-muted','Награду можно забрать из собственной коллекции титулов.'));}
            body.appendChild(rewardBox);
        }

        var footerHint = node('p', 'achievement-title-detail-next',
            unlocked ? 'Титул можно выбрать в поле «Титул над именем» в профиле.'
                : 'Выполни все условия, чтобы открыть титул.');
        footerHint.style.cssText = 'margin:0;color:#b8b0c9;';
        body.appendChild(footerHint);
        content.appendChild(body);

        var close = actionButton('Закрыть', 'btn btn-primary', function () {
            if (typeof window.closeModal === 'function') window.closeModal();
            else overlay.style.display = 'none';
        });
        close.style.cssText = 'width:100%;padding:12px;margin-top:17px;';
        content.appendChild(close);
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    }

    async function claimAchievementTitleReward(titleId, button) {
        var title=titleById(titleId);
        if(!title||!title.reward||!currentUser||!db)return;
        if(!titleIsUnlocked(title,Object.assign({},currentProfile||{},readLocalGameStats()||{}))){setNotice('Сначала выполни условия этого титула.','warning');return;}
        if(typeof window.MBCanReceiveTitleRewardPoints!=='function'||!window.MBCanReceiveTitleRewardPoints()){setNotice('Сначала открой сохранение игры и дождись подключения облака, чтобы награду можно было сохранить.','warning');return;}
        if(button){button.disabled=true;button.textContent='Проверяем награду…';}
        var userId=currentUser.id,client=db;
        try{
            var currentStats=readLocalGameStats();
            if(currentStats){var syncResult=await client.from('profiles').update(currentStats).eq('id',userId);if(syncResult.error)throw syncResult.error;}
            var claim=await client.rpc('mb_claim_achievement_title_reward',{p_title_id:titleId});
            if(claim.error)throw claim.error;
            var result=claim.data;
            if(!result||result.ok!==true){
                if(result&&result.code==='title_locked')throw new Error('title_locked');
                if(result&&result.code==='title_has_no_reward')throw new Error('title_has_no_reward');
                throw new Error((result&&result.code)||'title_reward_failed');
            }
            if(result.already_claimed){if(button){button.textContent='✓ Награда уже получена';button.disabled=true;}return;}
            var rewardPayload=result.reward||{
                stars:safeCount(result.reward_points,1000000000),
                powerPoints:safeCount(result.reward_power_points,1000000000),
                freeSpins:safeCount(result.reward_free_spins,1000),
                legendarySpins:safeCount(result.reward_legendary_spins,1000),
                secretSpins:safeCount(result.reward_secret_spins,1000)
            };
            if(!rewardPayload.stars||typeof window.MBGrantAchievementTitleRewards!=='function'||!window.MBGrantAchievementTitleRewards(rewardPayload,titleId))throw new Error('title_reward_apply_failed');
            if(typeof window.mbFlushCloudSave==='function'){var flushed=await window.mbFlushCloudSave();if(flushed===false)throw new Error('title_reward_sync_pending');}
            var completed=await client.rpc('mb_complete_achievement_title_reward',{p_title_id:titleId});
            if(completed.error)throw completed.error;
            if(!completed.data||completed.data.ok!==true)throw new Error('title_reward_complete_failed');
            if(button){button.textContent='✓ Награда получена: '+titleRewardText(rewardPayload);button.disabled=true;}
            setNotice('Награда за титул «'+title.label+'» получена: '+titleRewardText(rewardPayload)+'.','success');
        }catch(error){
            console.warn('[MB titles] Reward claim did not fully finish:',error&&error.message?error.message:error);
            if(button){button.disabled=false;button.textContent='Повторить получение · '+titleRewardText(title.reward);}
            var message=String(error&&error.message||'');
            if(message==='title_locked')setNotice('На сервере ещё не подтверждено условие титула. Попробуй после синхронизации статистики.','warning');
            else if(message==='title_reward_sync_pending')setNotice('Награда добавлена в сохранение, но облако ещё не подтвердило синхронизацию. Нажми «Повторить получение»: повторной выплаты не будет.','warning');
            else if(message==='title_reward_apply_failed')setNotice('Награда ожидает выдачи. Открой игровой слот и повтори получение.','warning');
            else setNotice('Не удалось завершить выдачу награды: '+friendlyError(error),'error');
        }
    }

    window.MBClaimAchievementTitleReward = claimAchievementTitleReward;

    function renderAchievementBadges(containerId, stats, includeLocked) {
        var container = byId(containerId);
        if (!container) return;
        var currentStats = stats || {};
        container.replaceChildren();
        var unlockedCount = 0;
        var visibleCount = 0;
        var titlesToRender = ACHIEVEMENT_TITLES.slice();
        if (typeof window.MBGetMasteryTitleCatalog === 'function') {
            window.MBGetMasteryTitleCatalog().forEach(function (title) {
                if (titleIsUnlocked(title, currentStats)) titlesToRender.push(title);
            });
        }
        titlesToRender.forEach(function (title) {
            var unlocked = titleIsUnlocked(title, currentStats);
            if (unlocked) unlockedCount++;
            if (!unlocked && !includeLocked) return;
            visibleCount++;
            var badge = node('button', 'achievement-badge' + (unlocked ? '' : ' locked') + (title.isMasteryTitle ? ' mastery-character-badge' : ''));
            badge.type = 'button';
            badge.title = 'Нажми, чтобы узнать: ' + title.description;
            badge.setAttribute('aria-label', (unlocked ? 'Получен: ' : 'Не получен: ') + title.label + '. ' + title.description);
            badge.setAttribute('aria-pressed', 'false');
            badge.style.cssText = 'cursor:pointer;text-align:left;appearance:none;-webkit-appearance:none;font-family:inherit;transition:filter .15s,border-color .15s,outline .15s;';
            badge.appendChild(node('span', 'achievement-badge-icon', title.icon));
            badge.appendChild(node('span', 'achievement-badge-label', title.label + (unlocked ? '' : ' · закрыто')));
            badge.addEventListener('click', function () {
                showAchievementTitleDetails(null, title, currentStats, containerId === 'clanProfileBadges');
            });
            container.appendChild(badge);
        });
        if (!visibleCount) {
            container.appendChild(node('p', 'clan-muted', 'Титулы пока не открыты — выполняй испытания, чтобы получить первый.'));
        }
    }

    function renderTitlePicker(stats, selectedId) {
        var select = byId('clanProfileTitle');
        if (select) {
            select.replaceChildren();
            select.appendChild(new Option('Без титула', ''));
            ACHIEVEMENT_TITLES.forEach(function (title) {
                if (titleIsUnlocked(title, stats || {})) select.appendChild(new Option(title.icon + ' ' + title.label, title.id));
            });
            if (typeof window.MBGetMasteryTitleCatalog === 'function') {
                window.MBGetMasteryTitleCatalog().forEach(function (title) {
                    if (titleIsUnlocked(title, stats || {})) select.appendChild(new Option(title.icon + ' ' + title.label, title.id));
                });
            }
            select.value = isTitleUnlocked(selectedId, stats || {}) ? (selectedId || '') : '';
        }
        renderAchievementBadges('clanProfileBadges', stats, true);
    }
    function cardArtPathForName(name) {
        try {
            if (typeof window.getCardImage === 'function') {
                var imagePath = window.getCardImage(String(name || ''));
                return typeof imagePath === 'string' && imagePath.trim() ? imagePath : null;
            }
        } catch (_error) {}
        return null;
    }

    function localCollectionCards() {
        try {
            if (window.MBGameCards && typeof window.MBGameCards.getCardsForClanExchange === 'function') {
                var stableCards = window.MBGameCards.getCardsForClanExchange();
                if (Array.isArray(stableCards)) return stableCards;
            }
        } catch (error) {
            console.warn('[MB showcase] Не удалось получить стабильные ID карт:', error && error.message);
        }
        try { if (typeof myCards !== 'undefined' && Array.isArray(myCards)) return myCards; } catch (_error) {}
        return [];
    }
    function localShowcaseOptions() {
        return localCollectionCards().map(function (card, index) {
            card = card && typeof card === 'object' ? card : {};
            var name = String(card.name || card.nickname || 'Неизвестная карта');
            var rawId = card._mbCardUid || card.id;
            var uid = rawId !== undefined && rawId !== null && String(rawId) !== '' ? String(rawId) : 'local-' + index + '-' + name;
            return { uid: uid, name: name, rarity: String(card.rarity || 'Обычная'),
                mastery: Math.max(1, Math.min(7, safeCount(card.mastery, 7) || 1)),
                image: cardArtPathForName(name) };
        });
    }
    function renderShowcasePicker() {
        var container = byId('clanProfileShowcaseChoices');
        if (!container) return;
        container.replaceChildren();
        var all = localShowcaseOptions();
        var search = byId('clanShowcaseSearch');
        var query = (search ? search.value : '').trim().toLocaleLowerCase('ru');
        var filtered = all.filter(function (card) {
            return !query || card.name.toLocaleLowerCase('ru').indexOf(query) !== -1 || card.rarity.toLocaleLowerCase('ru').indexOf(query) !== -1;
        });
        var missingSaved = profileShowcaseSavedCards.filter(function (saved) {
            return saved && saved.uid !== undefined &&
                profileShowcaseSelection.indexOf(String(saved.uid)) !== -1 &&
                !all.some(function (card) { return card.uid === String(saved.uid); });
        });
        missingSaved.forEach(function (saved) {
            var button = node('button', 'showcase-pick-card selected');
            button.type = 'button';
            button.setAttribute('aria-pressed', 'true');
            button.title = 'Эта карта сохранена в витрине, но не найдена в текущем локальном слоте. Нажми, чтобы убрать её.';
            var savedArt = cardArtPathForName(saved.name);
            if (savedArt) {
                var img = node('img'); img.src = savedArt; img.alt = saved.name || 'Карта'; img.loading = 'lazy';
                button.appendChild(img);
            } else {
                button.appendChild(node('div', 'showcase-card-no-art', ''));
            }
            button.appendChild(node('strong', '', saved.name || 'Карта'));
            button.appendChild(node('small', '', (saved.rarity || 'Редкость неизвестна') + ' · сохранена ранее'));
            button.appendChild(node('span', 'showcase-check', '×'));
            button.addEventListener('click', function () {
                profileShowcaseSelection = profileShowcaseSelection.filter(function (uid) { return uid !== String(saved.uid); });
                profileShowcaseSavedCards = profileShowcaseSavedCards.filter(function (item) { return String(item.uid) !== String(saved.uid); });
                renderShowcasePicker();
            });
            container.appendChild(button);
        });
        var shown = filtered.slice(0, 120);
        if (!shown.length && !missingSaved.length) {
            container.appendChild(node('div', 'online-empty-state', all.length ? 'По этому запросу карты не найдены.' : 'Сначала открой игровой слот с коллекцией карт.'));
        } else shown.forEach(function (card) {
            var selected = profileShowcaseSelection.indexOf(card.uid) !== -1;
            var button = node('button', 'showcase-pick-card' + (selected ? ' selected' : ''));
            button.type = 'button';
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
            button.title = card.name + ' · ' + card.rarity + ' · мастерство ' + card.mastery;
            if (card.image) {
                var img = node('img'); img.src = card.image; img.alt = card.name; img.loading = 'lazy';
                button.appendChild(img);
            } else {
                button.appendChild(node('div', 'showcase-card-no-art', ''));
            }
            button.appendChild(node('strong', '', card.name));
            button.appendChild(node('small', '', card.rarity + ' · ' + card.mastery + '★'));
            if (selected) button.appendChild(node('span', 'showcase-check', '✓'));
            button.addEventListener('click', function () {
                var at = profileShowcaseSelection.indexOf(card.uid);
                if (at >= 0) profileShowcaseSelection.splice(at, 1);
                else {
                    if (profileShowcaseSelection.length >= 3) { setNotice('В витрину можно добавить максимум 3 карты.', 'warning'); return; }
                    profileShowcaseSelection.push(card.uid);
                }
                renderShowcasePicker();
            });
            container.appendChild(button);
        });
        var status = byId('clanProfileShowcaseStatus');
        if (status) {
            var selectedNames = profileShowcaseSelection.map(function (uid) {
                var item = all.find(function (card) { return card.uid === uid; }) ||
                    profileShowcaseSavedCards.find(function (card) { return card && String(card.uid) === uid; });
                return item ? item.name : null;
            }).filter(Boolean);
            status.textContent = 'Выбрано ' + profileShowcaseSelection.length + ' из 3 карт' +
                (filtered.length > 120 ? ' · показаны первые 120, используй поиск' : '') +
                (selectedNames.length ? ' · ' + selectedNames.join(' · ') : '');
        }
    }
    function selectedShowcaseSnapshots() {
        var all = localShowcaseOptions();
        return profileShowcaseSelection.map(function (uid) {
            var card = all.find(function (item) { return item.uid === uid; });
            if (card) return { uid: card.uid, name: card.name, rarity: card.rarity, mastery: card.mastery };
            var saved = profileShowcaseSavedCards.find(function (item) { return item && String(item.uid) === uid; });
            return saved ? { uid: String(saved.uid), name: String(saved.name || 'Карта'), rarity: String(saved.rarity || ''), mastery: safeCount(saved.mastery, 7) } : null;
        }).filter(Boolean).slice(0, 3);
    }
    function renderPublicShowcase(containerId, cards) {
        var container = byId(containerId);
        if (!container) return;
        container.replaceChildren();
        var items = Array.isArray(cards) ? cards.filter(function (card) { return card && typeof card === 'object'; }).slice(0, 3) : [];
        if (!items.length) { container.appendChild(node('p', 'clan-muted', 'Игрок пока не выбрал карты для витрины.')); return; }
        items.forEach(function (card) {
            var row = node('div', 'public-showcase-card');
            var artPath = cardArtPathForName(card.name);
            if (artPath) {
                var img = node('img'); img.src = artPath; img.alt = card.name || 'Карта'; img.loading = 'lazy';
                row.appendChild(img);
            } else {
                row.appendChild(node('div', 'public-showcase-no-art', ''));
            }
            var text = node('div');
            text.appendChild(node('strong', '', card.name || 'Карта'));
            text.appendChild(node('small', '', (card.rarity || 'Редкость неизвестна') + (card.mastery ? ' · мастерство ' + formatCount(card.mastery) + '★' : '')));
            row.appendChild(text); container.appendChild(row);
        });
    }
    function showPublicTitle(profile) {
        var el = byId('clanPublicTitle');
        if (!el) return;
        var stats = Object.assign({}, profile || {});
        var title = isTitleUnlocked(profile && profile.active_title, stats) ? titleById(profile.active_title) : null;
        el.style.display = title ? 'block' : 'none';
        el.classList.toggle('mastery-character-title', !!title && title.isMasteryTitle);
        el.classList.toggle('achievement-profile-title', !!title && !title.isMasteryTitle);
        el.textContent = title ? title.icon + ' ' + title.label : '';
    }
    function copyText(textValue) {
        var value = String(textValue || '');
        if (!value) return;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(value).then(function () { setNotice('Код игрока скопирован.', 'success'); })
                .catch(function () { window.prompt('Скопируй код игрока:', value); });
        } else window.prompt('Скопируй код игрока:', value);
    }
    function playerFriendRelation(userId) {
        if (currentFriends.some(function (player) { return player.user_id === userId; })) return 'friend';
        var request = currentFriendRequests.find(function (item) { return item.user_id === userId; });
        return request ? request.direction : '';
    }
    function updatePublicFriendAction() {
        var button = byId('clanPublicFriendAction');
        if (!button || !publicProfileUserId || !currentUser) return;
        var relation = playerFriendRelation(publicProfileUserId);
        var isSelf = publicProfileUserId === currentUser.id;
        button.style.display = isSelf ? 'none' : '';
        button.disabled = isSelf || relation === 'friend' || relation === 'outgoing';
        button.textContent = relation === 'friend' ? '✓ Уже друзья' :
            relation === 'outgoing' ? '⏳ Заявка отправлена' :
            relation === 'incoming' ? '✓ Принять заявку' : '➕ Добавить в друзья';
    }
    function setListMessage(containerId, message, error) {
        var container = byId(containerId);
        if (!container) return;
        container.replaceChildren(node('div', 'online-empty-state' + (error ? ' error' : ''), message));
    }
    function makeOnlinePlayerRow(player, actions, statusOverride) {
        var row = node('div', 'online-player-row');
        var uid = player.user_id || player.id;
        var avatar = node('img', 'online-player-avatar');
        avatar.src = avatarPathForName(player.avatar_name) || 'images/Super_Dio_2.gif'; avatar.alt = ''; avatar.loading = 'lazy';
        row.appendChild(avatar);
        var main = node('div', 'online-player-main');
        var nameLine = node('div', 'online-player-name-line');
        nameLine.appendChild(node('strong', '', player.display_name || 'Игрок'));
        if (typeof player.is_online === 'boolean' || statusOverride) {
            var online = statusOverride ? statusOverride === 'online' : player.is_online;
            nameLine.appendChild(node('span', 'online-status-pill' + (online ? ' online' : ''), online ? 'В сети' : (statusOverride || 'Не в сети')));
        }
        main.appendChild(nameLine);
        var meta = [];
        if (player.active_title && titleById(player.active_title)) meta.push('🏅 ' + titleLabel(player.active_title));
        if (player.highest_wave !== undefined && player.highest_wave !== null) meta.push('🌊 Волна ' + formatCount(player.highest_wave));
        if (player.friend_code) meta.push('Код MB-' + player.friend_code);
        if (player.last_seen_at && player.is_online === false) {
            var lastSeenText = formatActivityDate(player.last_seen_at);
            if (lastSeenText) meta.push('Последний заход: ' + lastSeenText);
        }
        if (player.created_at && player.direction) meta.push(player.direction === 'incoming' ? 'Входящая заявка' : 'Исходящая заявка');
        main.appendChild(node('div', 'online-player-meta', meta.join(' · ') || 'Игрок Multiverse Battle'));
        row.appendChild(main);
        if (actions && actions.length) {
            var actionWrap = node('div', 'online-player-actions');
            actions.forEach(function (item) {
                var button = node('button', 'btn' + (item.primary ? ' btn-primary' : ''));
                button.type = 'button'; button.textContent = item.label; if (item.disabled) button.disabled = true;
                button.addEventListener('click', item.action); actionWrap.appendChild(button);
            });
            row.appendChild(actionWrap);
        }
        return row;
    }
    function renderFriendsList() {
        var container = byId('onlineFriendsList'); if (!container) return;
        container.replaceChildren();
        if (!currentFriends.length) { setListMessage('onlineFriendsList', 'Пока нет друзей. Найди игрока по нику или коду выше.'); return; }
        currentFriends.forEach(function (player) {
            var actions = [
                { label: 'Профиль', action: function () { openPublicProfile(player.user_id); } },
                { label: 'Удалить', action: function () { respondFriendRequest(player.user_id, 'remove'); } }
            ];
            if (currentClan && ['leader', 'officer'].indexOf(currentClan.role) !== -1) actions.splice(1, 0, { label: 'В клан', action: function () { sendClanInvite(player.user_id); } });
            container.appendChild(makeOnlinePlayerRow(player, actions));
        });
    }
    function renderFriendRequests() {
        var container = byId('onlineFriendRequests'); if (!container) return;
        container.replaceChildren();
        if (!currentFriendRequests.length) { setListMessage('onlineFriendRequests', 'Новых заявок нет.'); return; }
        currentFriendRequests.forEach(function (player) {
            var actions = [];
            if (player.direction === 'incoming') {
                actions.push({ label: 'Принять', primary: true, action: function () { respondFriendRequest(player.user_id, 'accept'); } });
                actions.push({ label: 'Отклонить', action: function () { respondFriendRequest(player.user_id, 'reject'); } });
            } else actions.push({ label: 'Отменить', action: function () { respondFriendRequest(player.user_id, 'cancel'); } });
            container.appendChild(makeOnlinePlayerRow(player, actions));
        });
    }
    function renderClanInvites() {
        var container = byId('onlineClanInvites'); if (!container) return;
        container.replaceChildren();
        if (!currentClanInvites.length) { setListMessage('onlineClanInvites', currentClan ? 'Приглашений пока нет. Ты уже состоишь в клане.' : 'Приглашений пока нет.'); return; }
        currentClanInvites.forEach(function (invite) {
            var row = node('div', 'online-player-row'); row.appendChild(node('div', 'friend-clan-emblem', '🛡️'));
            var main = node('div', 'online-player-main');
            main.appendChild(node('strong', '', '[' + (invite.clan_tag || 'CLAN') + '] ' + (invite.clan_name || 'Клан')));
            main.appendChild(node('div', 'online-player-meta', (invite.direction === 'incoming' ? 'Приглашение от ' + (invite.sender_name || 'игрока') : 'Приглашение для ' + (invite.target_name || 'игрока')) + ' · действует до ' + new Date(invite.expires_at).toLocaleDateString()));
            row.appendChild(main);
            var buttons = node('div', 'online-player-actions');
            if (invite.direction === 'incoming') {
                var accept = node('button', 'btn btn-primary', 'Вступить'); accept.type = 'button'; accept.disabled = !!currentClan;
                accept.addEventListener('click', function () { respondClanInvite(invite.invite_id, 'accept'); }); buttons.appendChild(accept);
                var decline = node('button', 'btn', 'Отклонить'); decline.type = 'button';
                decline.addEventListener('click', function () { respondClanInvite(invite.invite_id, 'decline'); }); buttons.appendChild(decline);
            } else {
                var cancel = node('button', 'btn', 'Отменить'); cancel.type = 'button';
                cancel.addEventListener('click', function () { respondClanInvite(invite.invite_id, 'cancel'); }); buttons.appendChild(cancel);
            }
            row.appendChild(buttons); container.appendChild(row);
        });
    }
    function noteGameAnalyticsActivity() {
        var now = Date.now();
        var wasInactive = now - gameAnalyticsLastActivityAt >= GAME_ANALYTICS_IDLE_LIMIT_MS;
        gameAnalyticsLastActivityAt = now;
        if (wasInactive && db && currentUser && document.visibilityState === 'visible' &&
            gameAnalyticsSessionId && gameAnalyticsUserId === currentUser.id) {
            trackGameAnalytics(false);
        }
    }

    function getGameAnalyticsSnapshot() {
        try {
            if (typeof window.MBGetAnalyticsSnapshot !== 'function') return null;
            var snapshot = window.MBGetAnalyticsSnapshot();
            if (!snapshot || typeof snapshot !== 'object') return null;
            var stageKey = String(snapshot.stage_key || '');
            var stageLabel = String(snapshot.stage_label || '');
            if (!/^[a-z0-9_:-]{1,80}$/.test(stageKey) || !stageLabel.trim()) return null;
            return {
                stage_key: stageKey,
                stage_label: stageLabel.slice(0, 100),
                wave: Math.max(1, safeCount(snapshot.wave, 1000000000)),
                rebirth: safeCount(snapshot.rebirth, 1000000)
            };
        } catch (_error) { return null; }
    }

    async function trackGameAnalytics(pause) {
        try {
            if (!db || !currentUser) return null;
            if (!pause && document.visibilityState === 'hidden') return null;
            var snapshot = getGameAnalyticsSnapshot();
            if (!snapshot) return null;

            var userId = currentUser.id;
            if (gameAnalyticsUserId && gameAnalyticsUserId !== userId) {
                gameAnalyticsSessionId = null;
                gameAnalyticsUserId = null;
            }

            if (!gameAnalyticsSessionId) {
                if (pause) return null;
                var started = await db.rpc('mb_start_game_session', {
                    p_stage_key: snapshot.stage_key,
                    p_stage_label: snapshot.stage_label,
                    p_wave: snapshot.wave,
                    p_rebirth: snapshot.rebirth
                });
                if (started.error) {
                    console.warn('[MB analytics] Не удалось начать игровую сессию:', started.error.message);
                    return null;
                }
                gameAnalyticsSessionId = Array.isArray(started.data) ? started.data[0] : started.data;
                if (gameAnalyticsSessionId && typeof gameAnalyticsSessionId === 'object') {
                    gameAnalyticsSessionId = gameAnalyticsSessionId.id || gameAnalyticsSessionId.mb_start_game_session || null;
                }
                gameAnalyticsUserId = gameAnalyticsSessionId ? userId : null;
                return gameAnalyticsSessionId;
            }

            var result = await db.rpc('mb_track_game_session', {
                p_session_id: gameAnalyticsSessionId,
                p_stage_key: snapshot.stage_key,
                p_stage_label: snapshot.stage_label,
                p_wave: snapshot.wave,
                p_rebirth: snapshot.rebirth,
                p_pause: pause === true
            });
            if (result.error) {
                console.warn('[MB analytics] Не удалось обновить игровую сессию:', result.error.message);
                if (/game_session_not_found|game_session_invalid/i.test(String(result.error.message || ''))) {
                    gameAnalyticsSessionId = null;
                    gameAnalyticsUserId = null;
                    if (!pause) return await trackGameAnalytics(false);
                }
                return null;
            }

            var status = result.data && result.data.status;
            if (status === 'closed' || status === 'expired') {
                gameAnalyticsSessionId = null;
                gameAnalyticsUserId = null;
                if (!pause) return await trackGameAnalytics(false);
            }
            return result.data;
        } catch (error) {
            console.warn('[MB analytics] Ошибка записи игровой активности:', error && (error.message || error));
            return null;
        }
    }

    function formatPlayDuration(value) {
        var seconds = Math.max(0, Math.floor(Number(value) || 0));
        var days = Math.floor(seconds / 86400);
        var hours = Math.floor((seconds % 86400) / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var rest = seconds % 60;
        if (days) return days + ' д ' + hours + ' ч';
        if (hours) return hours + ' ч ' + minutes + ' мин';
        if (minutes) return minutes + ' мин ' + rest + ' с';
        return rest + ' с';
    }

    function renderGameActivityStats(containerId, data, scope, userId) {
        var container = byId(containerId);
        if (!container) return;
        container.replaceChildren();
        container.style.cssText = 'display:block;margin:12px 0 16px;padding:14px;border:1px solid rgba(155,121,255,.22);border-radius:14px;background:linear-gradient(145deg,rgba(28,25,45,.92),rgba(12,13,22,.96));color:#eee7fa;';

        var header = node('div', 'mb-game-analytics-header');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;';
        var heading = node('strong', '', '⏱️ Игровая активность');
        heading.style.cssText = 'font-size:13px;color:#ffe29a;';
        header.appendChild(heading);
        var refresh = node('button', 'btn mb-game-analytics-refresh', '↻ Обновить');
        refresh.type = 'button';
        refresh.style.cssText = 'padding:6px 9px;font-size:10px;';
        refresh.addEventListener('click', function () { loadGameActivityStats(userId, scope, true); });
        header.appendChild(refresh);
        container.appendChild(header);

        if (!data) {
            container.appendChild(node('p', 'clan-muted', 'Не удалось загрузить игровую статистику. Нажми «Обновить», чтобы попробовать ещё раз.'));
            return;
        }

        var player = data.player || {};
        var server = data.server || {};
        var metricGrid = node('div', 'mb-game-analytics-metrics');
        metricGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:7px;margin-bottom:13px;';
        [
            {label:'Игровых сессий', value:formatCount(safeCount(player.total_sessions))},
            {label:'Реально сыграно', value:(safeCount(player.total_sessions) === 0 ? 'Нет измерений' : formatPlayDuration(player.measured_play_seconds !== undefined ? player.measured_play_seconds : player.play_seconds))},
            {label:'Средняя сессия', value:formatPlayDuration(player.average_session_seconds)},
            {label:'Сессий за 7 дней', value:formatCount(safeCount(player.sessions_7d))}
        ].forEach(function (metric) {
            var card = node('div', 'mb-game-analytics-metric');
            card.style.cssText = 'min-width:0;padding:10px 9px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:rgba(255,255,255,.025);';
            var value = node('strong', '', metric.value);
            value.style.cssText = 'display:block;color:#ffda72;font-size:17px;line-height:1.25;overflow-wrap:anywhere;';
            var label = node('span', '', metric.label);
            label.style.cssText = 'display:block;margin-top:5px;color:#b9b0cc;font-size:10px;line-height:1.35;';
            card.appendChild(value);
            card.appendChild(label);
            metricGrid.appendChild(card);
        });
        container.appendChild(metricGrid);

        var measuredSeconds = safeCount(player.measured_play_seconds, 315360000);
        var estimatedSeconds = safeCount(player.estimated_prior_seconds, 315360000);
        var timingNote = node('p', 'clan-muted',
            'Реально учтено активными сессиями: ' + formatPlayDuration(measuredSeconds) + '. ' +
            (estimatedSeconds > 0
                ? 'До запуска аналитики есть только приблизительная оценка ≈ ' + formatPlayDuration(estimatedSeconds) +
                  ' по облачным сохранениям.'
                : 'Для старого периода нет надёжной оценки по облачным сохранениям.') +
            (player.last_session_at ? ' Последняя измеренная сессия: ' + formatActivityDate(player.last_session_at) + '.' : '') +
            ' Старая оценка не включена в реальное время и рейтинг. После 5 минут бездействия или при скрытой вкладке счётчик ставится на паузу; этапы считаются с включения аналитики.');
        timingNote.style.cssText = 'margin:-4px 0 13px;color:#aaa1bd;font-size:10px;line-height:1.5;';
        container.appendChild(timingNote);

        var progress = player.progress && typeof player.progress === 'object' ? player.progress : {};
        var lifetime = progress.lifetime_stats && typeof progress.lifetime_stats === 'object' ? progress.lifetime_stats : {};
        var currentRebirth = progress.current_rebirth_stats && typeof progress.current_rebirth_stats === 'object' ? progress.current_rebirth_stats : {};
        var progressSection = node('section', 'mb-game-analytics-lifetime-progress');
        progressSection.style.cssText = 'margin:8px 0 14px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);';
        var progressHeading = node('strong', '', '📈 Прогресс за всё время');
        progressHeading.style.cssText = 'display:block;margin-bottom:8px;font-size:12px;color:#e5d9ff;';
        progressSection.appendChild(progressHeading);
        var progressGrid = node('div', 'mb-game-analytics-progress-grid');
        progressGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:7px;';
        var progressMetrics = [
            {label:'Победы за всё время', value:formatCount(safeCount(progress.total_wins))},
            {label:'Рекорд волны', value:formatCount(safeCount(progress.highest_wave))},
            {label:'Ребёрны', value:formatCount(safeCount(progress.rebirth_count, 1000000))},
            {label:'Получено карт', value:formatCount(safeCount(progress.cards_collected))},
            {label:'Побеждено боссов', value:formatCount(safeCount(progress.bosses_defeated))},
            {label:'Всего кликов', value:formatCount(safeCount(progress.total_clicks))},
            {label:lifetime.deathsApproximate === true ? 'Смерти (оценка)' : 'Смерти', value:(lifetime.deathsApproximate === true ? '≈ ' : '') + formatCount(safeCount(lifetime.deaths))},
            {label:'Макс. чекпоинт', value:formatCount(safeCount(lifetime.highestCheckpoint))},
            {label:'Уникальных карт', value:formatCount(safeCount(lifetime.uniqueCardsOwned, 1000000000))},
            {label:'Макс. очки', value:formatCount(safeCount(lifetime.maxPoints, 9007199254740991))},
            {label:'Уровень сейчас', value:formatCount(safeCount(currentRebirth.currentLevel || 1))},
            {label:'Волна сейчас', value:formatCount(safeCount(currentRebirth.currentWave || 1))}
        ];
        progressMetrics.forEach(function (metric) {
            var card = node('div', 'mb-game-analytics-progress-metric');
            card.style.cssText = 'min-width:0;padding:9px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:rgba(255,255,255,.025);';
            var value = node('strong', '', metric.value);
            value.style.cssText = 'display:block;color:#f1d58c;font-size:15px;line-height:1.25;overflow-wrap:anywhere;';
            var label = node('span', '', metric.label);
            label.style.cssText = 'display:block;margin-top:4px;color:#b9b0cc;font-size:10px;line-height:1.35;';
            card.appendChild(value);
            card.appendChild(label);
            progressGrid.appendChild(card);
        });
        progressSection.appendChild(progressGrid);
        container.appendChild(progressSection);

        var playerStages = Array.isArray(data.player_top_stages) ? data.player_top_stages : [];
        var playerStageSection = node('section', 'mb-game-analytics-player-stages');
        playerStageSection.style.cssText = 'margin-top:8px;';
        var playerStageHeading = node('strong', '', '🎮 Твои самые посещаемые этапы');
        playerStageHeading.style.cssText = 'display:block;margin-bottom:7px;font-size:12px;color:#e5d9ff;';
        playerStageSection.appendChild(playerStageHeading);
        if (!safeCount(player.total_sessions)) {
            playerStageSection.appendChild(node('p', 'clan-muted', 'Сессии и посещения этапов накапливаются после включения аналитики. Историческое время показано отдельно только как ориентировочная оценка.'));
        } else if (!playerStages.length) {
            playerStageSection.appendChild(node('p', 'clan-muted', 'Этапы появятся после первых игровых минут.'));
        } else {
            playerStages.forEach(function (stage) {
                var row = node('div', 'mb-game-analytics-stage-row');
                row.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.045);';
                var name = node('strong', '', stage.stage_label || stage.stage_key || 'Этап');
                name.style.cssText = 'font-size:11px;color:#eee6ff;';
                var detail = node('span', '', formatCount(safeCount(stage.visits)) + ' посещ. · ' + formatCount(safeCount(stage.sessions)) + ' сесс. · ' + formatPlayDuration(stage.play_seconds));
                detail.style.cssText = 'display:block;margin-top:3px;color:#aca2c2;font-size:10px;';
                var left = node('div', 'mb-game-analytics-stage-name');
                left.style.cssText = 'min-width:0;flex:1;';
                left.appendChild(name);
                left.appendChild(detail);
                row.appendChild(left);
                playerStageSection.appendChild(row);
            });
        }
        container.appendChild(playerStageSection);

        var topPlayers = Array.isArray(data.server_top_players) ? data.server_top_players : [];
        var playersSection = node('section', 'mb-game-analytics-top-players');
        playersSection.style.cssText = 'margin-top:13px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);';
        var playersHeading = node('strong', '', '🏆 Кто провёл больше всего времени в игре');
        playersHeading.style.cssText = 'display:block;margin-bottom:7px;font-size:12px;color:#e5d9ff;';
        playersSection.appendChild(playersHeading);
        playersSection.appendChild(node('p', 'clan-muted', 'Рейтинг по суммарному времени: учтённые сессии плюс приблизительная оценка старого периода по облачным сохранениям. Показываются до 50 профилей; посещения этапов считаются с момента включения аналитики.'));
        if (!topPlayers.length) {
            playersSection.appendChild(node('p', 'clan-muted', 'Рейтинг пока пуст. Первая игровая сессия запустит статистику.'));
        } else {
            topPlayers.forEach(function (player, index) {
                var row = node('div', 'mb-game-analytics-stage-row');
                row.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.045);';
                var identity = node('div', 'mb-game-analytics-stage-name');
                identity.style.cssText = 'min-width:0;flex:1;';
                var name = node('strong', '', (index + 1) + '. ' + (player.display_name || 'Игрок'));
                name.style.cssText = 'display:block;overflow-wrap:anywhere;font-size:11px;color:#eee6ff;';
                var detail = node('span', '', '♻️ ' + safeCount(player.rebirth, 1000000) + '-й ребёрн · 🌊 волна ' +
                    formatCount(safeCount(player.highest_wave, 1000000000)) + ' · 🏆 ' +
                    formatCount(safeCount(player.total_wins)) + ' побед · 👹 ' +
                    formatCount(safeCount(player.bosses_defeated)) + ' боссов · ' +
                    formatCount(safeCount(player.total_sessions)) + ' сесс.');
                detail.style.cssText = 'display:block;margin-top:3px;color:#aca2c2;font-size:10px;line-height:1.5;';
                var playerMeasuredSeconds = safeCount(player.measured_play_seconds, 315360000);
                var playerEstimateSeconds = safeCount(player.estimated_prior_seconds, 315360000);
                var estimateSuffix = playerEstimateSeconds > 0
                    ? ' · старая оценка ≈ ' + formatPlayDuration(playerEstimateSeconds) + ' (не учитывается)' : '';
                var detailProgress = node('span', '', '🎴 ' + formatCount(safeCount(player.cards_collected)) + ' карт · 👆 ' +
                    formatCount(safeCount(player.total_clicks)) + ' кликов · 🎮 реально ' +
                    formatPlayDuration(playerMeasuredSeconds) + estimateSuffix);
                detailProgress.style.cssText = 'display:block;margin-top:3px;color:#8f87a4;font-size:9px;line-height:1.5;';
                identity.appendChild(name);
                identity.appendChild(detail);
                identity.appendChild(detailProgress);
                var durationText = safeCount(player.total_sessions) === 0
                    ? 'Нет измерений'
                    : formatPlayDuration(playerMeasuredSeconds);
                var duration = node('strong', '', durationText);
                duration.style.cssText = 'max-width:42%;font-size:11px;color:#ffda72;text-align:right;overflow-wrap:anywhere;';
                row.appendChild(identity);
                row.appendChild(duration);
                playersSection.appendChild(row);
            });
        }
        container.appendChild(playersSection);

        var globalStages = Array.isArray(data.server_top_stages) ? data.server_top_stages : [];
        var globalSection = node('section', 'mb-game-analytics-global-stages');
        globalSection.style.cssText = 'margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);';
        var globalHeading = node('strong', '', '🌐 Самые посещаемые этапы всего сервера');
        globalHeading.style.cssText = 'display:block;margin-bottom:7px;font-size:12px;color:#e5d9ff;';
        globalSection.appendChild(globalHeading);
        globalSection.appendChild(node('p', 'clan-muted', 'Топ строится по числу входов на этап. Данные накапливаются с момента обновления.'));
        if (!globalStages.length) {
            globalSection.appendChild(node('p', 'clan-muted', 'Пока нет накопленных посещений этапов.'));
        } else {
            globalStages.forEach(function (stage, index) {
                var row = node('div', 'mb-game-analytics-stage-row');
                row.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.045);';
                var name = node('strong', '', (index + 1) + '. ' + (stage.stage_label || stage.stage_key || 'Этап'));
                name.style.cssText = 'font-size:11px;color:#eee6ff;';
                var detail = node('span', '', formatCount(safeCount(stage.players)) + ' игрок. · ' + formatCount(safeCount(stage.visits)) + ' посещ. · ' + formatPlayDuration(stage.play_seconds));
                detail.style.cssText = 'display:block;margin-top:3px;color:#aca2c2;font-size:10px;';
                var left = node('div', 'mb-game-analytics-stage-name');
                left.style.cssText = 'min-width:0;flex:1;';
                left.appendChild(name);
                left.appendChild(detail);
                row.appendChild(left);
                globalSection.appendChild(row);
            });
        }
        container.appendChild(globalSection);

        var serverMeasuredSeconds = safeCount(server.measured_play_seconds !== undefined ? server.measured_play_seconds : server.play_seconds, 315360000);
        var serverEstimateSeconds = safeCount(server.estimated_prior_seconds, 315360000);
        var serverEstimateText = serverEstimateSeconds > 0
            ? ' · старая оценка ≈ ' + formatPlayDuration(serverEstimateSeconds) + ' (не входит в итог)' : '';
        var foot = node('p', 'clan-muted', 'На сервере: ' + formatCount(safeCount(server.total_sessions)) + ' сессий · ' +
            formatPlayDuration(serverMeasuredSeconds) + ' реально учтено' + serverEstimateText + ' · ' +
            formatCount(safeCount(server.online_now)) + ' сейчас в игре.');
        foot.style.cssText = 'margin:12px 0 0;color:#88819d;font-size:9px;line-height:1.5;';
        container.appendChild(foot);
    }

    async function loadGameActivityStats(userId, scope, force) {
        if (!db || !currentUser || !userId) return null;
        var containerId = scope === 'own' ? 'clanProfileGameActivity' : 'clanPublicGameActivity';
        var client = db;
        var callerId = currentUser.id;
        var cached = gameActivityStatsCache[userId];
        if (!force && cached && Date.now() - cached.fetchedAt < 60000) {
            renderGameActivityStats(containerId, cached.data, scope, userId);
            return cached.data;
        }
        var container = byId(containerId);
        if (container) container.textContent = 'Загружаем игровую статистику…';
        try {
            var result = await client.rpc('mb_get_game_activity_stats', { p_user_id: userId });
            if (result.error) throw result.error;
            if (client !== db || !currentUser || currentUser.id !== callerId) return null;
            var data = Array.isArray(result.data) ? result.data[0] : result.data;
            if (!data || typeof data !== 'object') throw new Error('game_activity_stats_invalid');
            gameActivityStatsCache[userId] = { data: data, fetchedAt: Date.now() };
            renderGameActivityStats(containerId, data, scope, userId);
            return data;
        } catch (error) {
            console.warn('[MB analytics] Не удалось загрузить игровую статистику:', error && (error.message || error));
            renderGameActivityStats(containerId, null, scope, userId);
            return null;
        }
    }

    var UNIQUE_BOSS_CATALOG = {
        living_stone: { label: 'Живой Камень', wave: 200 },
        waystar: { label: 'Путеводная Звезда', wave: 500 },
        roger_whitebeard: { label: 'Роджер и Белоус', wave: 1000 },
        anti_spiral: { label: 'Анти-Спираль', wave: 1500 },
        living_stone_super: { label: 'Супер-Живой Камень', wave: 2000 }
    };

    function canViewUniqueBossFightAnalytics() {
        var email = currentUser && typeof currentUser.email === 'string' ? currentUser.email.trim().toLowerCase() : '';
        return email.indexOf('kodoku') === 0;
    }

    function updateUniqueBossFightAnalyticsVisibility() {
        var visible = canViewUniqueBossFightAnalytics();
        [
            { panelId: 'mbUniqueBossAnalyticsOwnPanel', containerId: 'clanProfileUniqueBossStats' },
            { panelId: 'mbUniqueBossAnalyticsPublicPanel', containerId: 'clanPublicUniqueBossStats' }
        ].forEach(function (item) {
            var panel = byId(item.panelId);
            if (panel) panel.style.display = visible ? '' : 'none';
            var container = byId(item.containerId);
            if (container) container.style.display = visible ? 'block' : 'none';
        });
        return visible;
    }

    function startUniqueBossFightAnalytics(bossKey) {
        if (!db || !currentUser || !UNIQUE_BOSS_CATALOG[bossKey] || window.__mbBossTestMode) return Promise.resolve(null);
        if (activeUniqueBossAttempt && activeUniqueBossAttempt.userId === currentUser.id &&
            activeUniqueBossAttempt.bossKey === bossKey && !activeUniqueBossAttempt.finished) {
            return activeUniqueBossAttempt.startPromise || Promise.resolve(activeUniqueBossAttempt.id);
        }
        var previous = activeUniqueBossAttempt
            ? (activeUniqueBossAttempt.finished
                ? (activeUniqueBossAttempt.finishPromise || Promise.resolve())
                : finishUniqueBossFightAnalytics(activeUniqueBossAttempt.bossKey, 'abandoned'))
            : Promise.resolve();
        return Promise.resolve(previous).catch(function () {}).then(function () {
            if (!db || !currentUser || window.__mbBossTestMode) return null;
            var client = db;
            var userId = currentUser.id;
            var attempt = {
                bossKey: bossKey, userId: userId, client: client, id: null,
                finished: false, finishPromise: null, startPromise: null
            };
            activeUniqueBossAttempt = attempt;
            attempt.startPromise = (async function () {
                try {
                    var result = await client.rpc('mb_start_unique_boss_attempt', { p_boss_key: bossKey });
                    if (result.error) throw result.error;
                    var id = Array.isArray(result.data) ? result.data[0] : result.data;
                    if (id && typeof id === 'object') id = id.id || id.mb_start_unique_boss_attempt || null;
                    if (activeUniqueBossAttempt !== attempt || !id) return null;
                    attempt.id = id;
                    return id;
                } catch (error) {
                    console.warn('[MB unique boss stats] Не удалось зарегистрировать начало боя:', error && (error.message || error));
                    if (activeUniqueBossAttempt === attempt) activeUniqueBossAttempt = null;
                    return null;
                }
            })();
            return attempt.startPromise;
        });
    }

    function finishUniqueBossFightAnalytics(bossKey, outcome) {
        var attempt = activeUniqueBossAttempt;
        if (!attempt || attempt.bossKey !== bossKey) return Promise.resolve(null);
        if (attempt.finished) return attempt.finishPromise || Promise.resolve(null);
        attempt.finished = true;
        attempt.finishPromise = (async function () {
            try {
                var id = attempt.id || await attempt.startPromise;
                if (!id) return null;
                var result = await attempt.client.rpc('mb_finish_unique_boss_attempt', {
                    p_attempt_id: id,
                    p_outcome: outcome
                });
                if (result.error) throw result.error;
                return result.data;
            } catch (error) {
                console.warn('[MB unique boss stats] Не удалось сохранить результат боя:', error && (error.message || error));
                return null;
            } finally {
                if (activeUniqueBossAttempt === attempt) activeUniqueBossAttempt = null;
                delete uniqueBossStatsCache[attempt.userId];
                if (currentUser && currentUser.id === attempt.userId) {
                    loadUniqueBossFightStats(attempt.userId, 'own', true);
                    if (publicProfileUserId) loadUniqueBossFightStats(publicProfileUserId, 'public', true);
                }
            }
        })();
        return attempt.finishPromise;
    }

    window.MBUniqueBossFightStart = startUniqueBossFightAnalytics;
    window.MBUniqueBossFightFinish = finishUniqueBossFightAnalytics;

    function formatBossDuration(value) {
        var seconds = Math.max(0, Math.floor(Number(value) || 0));
        var minutes = Math.floor(seconds / 60);
        var rest = seconds % 60;
        if (minutes >= 60) return Math.floor(minutes / 60) + ' ч ' + (minutes % 60) + ' мин';
        if (minutes) return minutes + ' мин ' + rest + ' с';
        return rest + ' с';
    }

    function renderUniqueBossFightStats(containerId, data, scope, userId) {
        if (!updateUniqueBossFightAnalyticsVisibility()) return;
        var container = byId(containerId);
        if (!container) return;
        container.replaceChildren();
        container.style.cssText = 'display:block;margin:12px 0 16px;padding:14px;border:1px solid rgba(255,105,135,.22);border-radius:14px;background:linear-gradient(145deg,rgba(35,19,34,.94),rgba(12,13,22,.97));color:#eee7fa;';

        var header = node('div', 'mb-unique-boss-header');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;';
        var heading = node('strong', '', '☠️ Уникальные боссы · статистика боёв');
        heading.style.cssText = 'font-size:13px;color:#ffc1cf;';
        header.appendChild(heading);
        var refresh = node('button', 'btn mb-unique-boss-refresh', '↻ Обновить');
        refresh.type = 'button';
        refresh.style.cssText = 'padding:6px 9px;font-size:10px;';
        refresh.addEventListener('click', function () { loadUniqueBossFightStats(userId, scope, true); });
        header.appendChild(refresh);
        container.appendChild(header);

        if (!data) {
            container.appendChild(node('p', 'clan-muted', 'Не удалось загрузить аналитику. Нажми «Обновить», чтобы попробовать ещё раз.'));
            return;
        }

        var profile = data.player_summary || {};
        var server = data.server_summary || {};
        var metrics = [
            { label: scope === 'own' ? 'Твои попытки' : 'Попытки игрока', value: profile.attempts },
            { label: 'Победы', value: profile.wins },
            { label: 'Смерти на боссах', value: profile.deaths },
            { label: 'Процент побед', value: (Number(profile.win_rate) || 0) + '%' },
            { label: 'Бои в процессе', value: profile.in_progress },
            { label: 'Всего побед на сервере', value: server.wins }
        ];
        var metricGrid = node('div', 'mb-unique-boss-metrics');
        metricGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:7px;margin-bottom:14px;';
        metrics.forEach(function (metric) {
            var card = node('div', 'mb-unique-boss-metric');
            card.style.cssText = 'min-width:0;padding:10px 9px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:rgba(255,255,255,.025);';
            var value = node('strong', '', typeof metric.value === 'string' ? metric.value : formatCount(safeCount(metric.value, 1000000000)));
            value.style.cssText = 'display:block;color:#ffb5c6;font-size:19px;line-height:1.25;overflow-wrap:anywhere;';
            var label = node('span', '', metric.label);
            label.style.cssText = 'display:block;margin-top:5px;color:#b9b0cc;font-size:10px;line-height:1.35;';
            card.appendChild(value);
            card.appendChild(label);
            metricGrid.appendChild(card);
        });
        container.appendChild(metricGrid);

        var playerRows = Array.isArray(data.player_by_boss) ? data.player_by_boss : [];
        var serverRows = Array.isArray(data.server_by_boss) ? data.server_by_boss : [];
        var playerByKey = Object.create(null);
        playerRows.forEach(function (item) { playerByKey[item.boss_key] = item; });
        var serverSection = node('section', 'mb-unique-boss-server-rows');
        var serverHeading = node('strong', '', '🌐 Каждый уникальный босс на всём сервере');
        serverHeading.style.cssText = 'display:block;margin-bottom:7px;font-size:12px;color:#ffdae2;';
        serverSection.appendChild(serverHeading);
        serverSection.appendChild(node('p', 'clan-muted', 'Смерть засчитывается за каждый проигранный бой. Отступления и незавершённые бои считаются отдельно.'));
        serverRows.forEach(function (item) {
            var player = playerByKey[item.boss_key] || {};
            var meta = UNIQUE_BOSS_CATALOG[item.boss_key] || { label: item.boss_key, wave: item.boss_wave };
            var row = node('div', 'mb-unique-boss-row');
            row.style.cssText = 'padding:10px 0;border-top:1px solid rgba(255,255,255,.05);';
            var title = node('strong', '', meta.label + ' · волна ' + formatCount(meta.wave));
            title.style.cssText = 'display:block;color:#f7eaf0;font-size:11px;';
            row.appendChild(title);
            var serverDetail = node('div', 'mb-unique-boss-server-detail',
                'Сервер: ' + formatCount(safeCount(item.players)) + ' игроков · ' +
                formatCount(safeCount(item.attempts)) + ' попыток · ' +
                formatCount(safeCount(item.wins)) + ' побед · ' +
                formatCount(safeCount(item.deaths)) + ' смертей · ' +
                formatCount(safeCount(item.abandoned)) + ' отступлений · ' +
                (Number(item.win_rate) || 0) + '% побед');
            serverDetail.style.cssText = 'margin-top:4px;color:#c9b8c8;font-size:10px;line-height:1.45;';
            row.appendChild(serverDetail);
            var personalDetail = node('div', 'mb-unique-boss-player-detail',
                (scope === 'own' ? 'Ты' : 'Игрок') + ': ' + formatCount(safeCount(player.attempts)) + ' попыток · ' +
                formatCount(safeCount(player.wins)) + ' побед · ' +
                formatCount(safeCount(player.deaths)) + ' смертей · ' +
                formatCount(safeCount(player.abandoned)) + ' отступлений' +
                (safeCount(player.attempts) ? ' · средний бой ' + formatBossDuration(player.average_battle_seconds) : ''));
            personalDetail.style.cssText = 'margin-top:4px;color:#e8bdd0;font-size:10px;line-height:1.45;';
            row.appendChild(personalDetail);
            serverSection.appendChild(row);
        });
        container.appendChild(serverSection);

        var recent = Array.isArray(data.recent_results) ? data.recent_results : [];
        var recentSection = node('section', 'mb-unique-boss-recent');
        recentSection.style.cssText = 'margin-top:13px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);';
        var recentHeading = node('strong', '', scope === 'own' ? '📜 Твои последние бои' : '📜 Последние бои этого игрока');
        recentHeading.style.cssText = 'display:block;margin-bottom:7px;font-size:12px;color:#ffdae2;';
        recentSection.appendChild(recentHeading);
        if (!recent.length) {
            recentSection.appendChild(node('p', 'clan-muted', 'Пока нет записей. После следующего боя уникального босса здесь появится результат. Учёт начинается с этого обновления.'));
        } else {
            recent.forEach(function (item) {
                var meta = UNIQUE_BOSS_CATALOG[item.boss_key] || { label: item.boss_key, wave: item.boss_wave };
                var labels = { win: '✅ Победа', death: '💀 Смерть / поражение', abandoned: '↩️ Отступление', in_progress: '⚔️ В процессе' };
                var row = node('div', 'mb-unique-boss-result');
                row.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.04);';
                var left = node('div', 'mb-unique-boss-result-left');
                left.style.cssText = 'min-width:0;flex:1;';
                var bossName = node('strong', '', meta.label + ' · волна ' + formatCount(meta.wave));
                bossName.style.cssText = 'display:block;overflow-wrap:anywhere;color:#f2e4f0;font-size:10px;';
                var details = node('span', '', 'Ребёрн ' + safeCount(item.rebirth_count, 1000000) + ' · ' +
                    formatActivityDate(item.started_at) + (item.outcome === 'in_progress' ? '' : ' · ' + formatBossDuration(item.duration_seconds)));
                details.style.cssText = 'display:block;margin-top:3px;color:#aaa0b3;font-size:9px;line-height:1.45;';
                left.appendChild(bossName);
                left.appendChild(details);
                var outcome = node('span', '', labels[item.outcome] || item.outcome);
                outcome.style.cssText = 'max-width:44%;font-size:10px;color:' +
                    (item.outcome === 'win' ? '#9ff0b0' : item.outcome === 'death' ? '#ff9aaf' : '#c8bbd5') +
                    ';text-align:right;overflow-wrap:anywhere;';
                row.appendChild(left);
                row.appendChild(outcome);
                recentSection.appendChild(row);
            });
        }
        recentSection.appendChild(node('p', 'clan-muted', 'Учтено длительности боёв: ' + formatBossDuration(profile.total_battle_seconds) +
            ' · средний завершённый бой: ' + formatBossDuration(profile.average_battle_seconds) +
            '. Исторические бои до установки учёта восстановить нельзя.'));
        container.appendChild(recentSection);
    }

    async function loadUniqueBossFightStats(userId, scope, force) {
        if (!updateUniqueBossFightAnalyticsVisibility()) return null;
        if (!db || !currentUser || !userId) return null;
        var containerId = scope === 'own' ? 'clanProfileUniqueBossStats' : 'clanPublicUniqueBossStats';
        var client = db;
        var callerId = currentUser.id;
        var cacheKey = userId;
        var cached = uniqueBossStatsCache[cacheKey];
        if (!force && cached && Date.now() - cached.fetchedAt < 45000) {
            renderUniqueBossFightStats(containerId, cached.data, scope, userId);
            return cached.data;
        }
        var container = byId(containerId);
        if (container) container.textContent = 'Загружаем статистику уникальных боссов…';
        try {
            var result = await client.rpc('mb_get_unique_boss_fight_stats', { p_user_id: userId });
            if (result.error) throw result.error;
            if (client !== db || !currentUser || currentUser.id !== callerId) return null;
            var data = Array.isArray(result.data) ? result.data[0] : result.data;
            if (!data || typeof data !== 'object') throw new Error('unique_boss_stats_invalid');
            uniqueBossStatsCache[cacheKey] = { data: data, fetchedAt: Date.now() };
            renderUniqueBossFightStats(containerId, data, scope, userId);
            return data;
        } catch (error) {
            console.warn('[MB unique boss stats] Не удалось загрузить аналитику:', error && (error.message || error));
            renderUniqueBossFightStats(containerId, null, scope, userId);
            return null;
        }
    }

    function touchCurrentPresence() {
        if (!db || !currentUser) return Promise.resolve(null);
        var client = db;
        return client.rpc('mb_touch_presence').then(function (result) {
            if (result.error) {
                console.warn('[MB friends] Presence update:', result.error.message);
                return null;
            }
            return result.data;
        }).catch(function (error) {
            console.warn('[MB friends] Presence update failed:', error && error.message ? error.message : error);
            return null;
        });
    }

    async function refreshFriendsHub() {
        if (!db || !currentUser) {
            setListMessage('onlineFriendsList', 'Войди в аккаунт, чтобы пользоваться друзьями.');
            setListMessage('onlineFriendRequests', 'После входа здесь появятся заявки.');
            setListMessage('onlineClanInvites', 'После входа здесь появятся приглашения.');
            return;
        }
        try {
            await loadMyClan();
            var touch = await db.rpc('mb_touch_presence');
            if (touch.error) console.warn('[MB friends] Presence update:', touch.error.message);
            var results = await Promise.all([db.rpc('mb_get_friends'), db.rpc('mb_get_friend_requests'), db.rpc('mb_get_clan_invites')]);
            for (var i = 0; i < results.length; i++) if (results[i].error) throw results[i].error;
            currentFriends = results[0].data || [];
            currentFriendRequests = results[1].data || [];
            currentClanInvites = results[2].data || [];
            renderFriendsList(); renderFriendRequests(); renderClanInvites();
            updatePublicFriendAction();
            if (currentFriendSearchResults.length) renderFriendSearchResults(currentFriendSearchResults);
        } catch (error) {
            setListMessage('onlineFriendsList', 'Не удалось загрузить друзей: ' + friendlyError(error), true);
            setListMessage('onlineFriendRequests', 'Не удалось загрузить заявки.', true);
            setListMessage('onlineClanInvites', 'Не удалось загрузить приглашения.', true);
        }
    }
    function renderFriendSearchResults(players) {
        var container = byId('onlineFriendSearchResults'); if (!container) return;
        container.replaceChildren(); currentFriendSearchResults = players || [];
        if (!currentFriendSearchResults.length) { setListMessage('onlineFriendSearchResults', 'Игроки не найдены. Проверь ник или код.'); return; }
        currentFriendSearchResults.forEach(function (player) {
            var relation = playerFriendRelation(player.user_id);
            var actions = [{ label: 'Профиль', action: function () { openPublicProfile(player.user_id); } }];
            if (relation === 'friend') actions.push({ label: '✓ Уже друзья', disabled: true, action: function () {} });
            else if (relation === 'outgoing') actions.push({ label: 'Заявка отправлена', disabled: true, action: function () {} });
            else if (relation === 'incoming') actions.push({ label: 'Принять', primary: true, action: function () { respondFriendRequest(player.user_id, 'accept'); } });
            else actions.push({ label: 'Добавить', primary: true, action: function () { sendFriendRequest(player.user_id); } });
            container.appendChild(makeOnlinePlayerRow(player, actions));
        });
    }
    async function searchOnlinePlayers(event) {
        if (event) event.preventDefault();
        if (!db || !currentUser) return setNotice('Сначала войди в аккаунт.', 'warning');
        var input = byId('onlineFriendSearchInput'); var query = input ? input.value.trim() : '';
        if (query.length < 2) return setNotice('Введи минимум 2 символа ника или код игрока.', 'warning');
        setListMessage('onlineFriendSearchResults', 'Ищем игроков…');
        try {
            var result = await db.rpc('mb_search_players', { p_query: query });
            if (result.error) throw result.error;
            renderFriendSearchResults(result.data || []);
        } catch (error) { setListMessage('onlineFriendSearchResults', 'Ошибка поиска: ' + friendlyError(error), true); }
    }
    async function sendFriendRequest(targetUserId) {
        if (!db || !currentUser || !targetUserId) return;
        try {
            var result = await db.rpc('mb_send_friend_request', { p_target_user_id: targetUserId });
            if (result.error) throw result.error;
            var status = result.data && result.data.status;
            setNotice(status === 'accepted' ? 'Вы теперь друзья!' : status === 'already_friends' ? 'Этот игрок уже у тебя в друзьях.' :
                status === 'already_sent' ? 'Заявка уже отправлена.' : 'Заявка в друзья отправлена.', 'success');
            await refreshFriendsHub();
        } catch (error) { setNotice(friendlyError(error), 'error'); }
    }
    async function respondFriendRequest(targetUserId, action) {
        if (!db || !currentUser || !targetUserId) return;
        try {
            var result = await db.rpc('mb_respond_friend_request', { p_target_user_id: targetUserId, p_action: action });
            if (result.error) throw result.error;
            var labels = { accept: 'Заявка принята.', reject: 'Заявка отклонена.', cancel: 'Заявка отменена.', remove: 'Игрок удалён из друзей.' };
            setNotice(labels[action] || 'Список друзей обновлён.', 'success');
            await refreshFriendsHub();
        } catch (error) { setNotice(friendlyError(error), 'error'); }
    }
    async function sendClanInvite(targetUserId) {
        if (!db || !currentUser || !currentClan || ['leader', 'officer'].indexOf(currentClan.role) === -1) return setNotice('Приглашать друзей в клан могут только лидер и офицеры.', 'warning');
        try {
            var result = await db.rpc('mb_send_clan_invite', { p_target_user_id: targetUserId, p_clan_id: currentClan.id });
            if (result.error) throw result.error;
            setNotice(result.data && result.data.status === 'already_sent' ? 'Приглашение уже отправлено.' : 'Приглашение в клан отправлено.', 'success');
            await refreshFriendsHub();
        } catch (error) { setNotice(friendlyError(error), 'error'); }
    }
    async function respondClanInvite(inviteId, action) {
        if (!db || !currentUser || !inviteId) return;
        try {
            var result = await db.rpc('mb_respond_clan_invite', { p_invite_id: inviteId, p_action: action });
            if (result.error) throw result.error;
            setNotice(action === 'accept' ? 'Ты вступил в клан!' : action === 'decline' ? 'Приглашение отклонено.' : 'Приглашение отменено.', 'success');
            await refreshAll(); await refreshFriendsHub();
        } catch (error) { setNotice(friendlyError(error), 'error'); }
    }

    function renderPopulationStats(containerId, stats) {
        var container = byId(containerId);
        if (!container) return;
        container.replaceChildren();
        container.style.cssText = 'display:block;margin:12px 0 16px;padding:14px;border:1px solid rgba(155,121,255,.22);border-radius:14px;background:linear-gradient(145deg,rgba(28,25,45,.92),rgba(12,13,22,.96));color:#eee7fa;';

        var header = node('div', 'mb-population-header');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;';
        var heading = node('strong', '', '🌐 Серверная статистика');
        heading.style.cssText = 'font-size:13px;color:#ffe29a;';
        header.appendChild(heading);
        var refresh = node('button', 'btn mb-population-refresh', '↻ Обновить');
        refresh.type = 'button';
        refresh.style.cssText = 'padding:6px 9px;font-size:10px;';
        refresh.addEventListener('click', function () { refreshPopulationStats(true); });
        header.appendChild(refresh);
        container.appendChild(header);

        if (!stats) {
            container.appendChild(node('p', 'clan-muted', 'Не удалось загрузить статистику. Нажми «Обновить», чтобы попробовать ещё раз.'));
            return;
        }

        var metrics = [
            { label: 'Всего профилей', value: stats.total_players },
            { label: 'Онлайн · 2 мин', value: stats.online_players },
            { label: 'Активны за 24 часа', value: stats.active_24h },
            { label: 'Активны за 7 дней', value: stats.active_7d }
        ];
        var metricGrid = node('div', 'mb-population-metrics');
        metricGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:7px;margin-bottom:14px;';
        metrics.forEach(function (metric) {
            var card = node('div', 'mb-population-metric');
            card.style.cssText = 'min-width:0;padding:10px 9px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:rgba(255,255,255,.025);';
            var value = node('strong', '', formatCount(safeCount(metric.value, 1000000000)));
            value.style.cssText = 'display:block;color:#ffda72;font-size:21px;line-height:1.2;overflow-wrap:anywhere;';
            var label = node('span', '', metric.label);
            label.style.cssText = 'display:block;margin-top:5px;color:#b9b0cc;font-size:10px;line-height:1.35;';
            card.appendChild(value);
            card.appendChild(label);
            metricGrid.appendChild(card);
        });
        container.appendChild(metricGrid);

        var distribution = Array.isArray(stats.rebirth_distribution) ? stats.rebirth_distribution : [];
        var rebirthSection = node('section', 'mb-population-rebirths');
        rebirthSection.style.cssText = 'margin-top:8px;';
        var rebirthHeading = node('strong', '', '♻️ Сколько игроков на каждом ребёрне');
        rebirthHeading.style.cssText = 'display:block;margin-bottom:9px;font-size:12px;color:#e5d9ff;';
        rebirthSection.appendChild(rebirthHeading);
        if (!distribution.length) {
            rebirthSection.appendChild(node('p', 'clan-muted', 'Пока нет статистики ребёрнов.'));
        } else {
            var maxPlayers = distribution.reduce(function (max, item) {
                return Math.max(max, safeCount(item && item.players));
            }, 1);
            distribution.forEach(function (item) {
                var count = safeCount(item && item.players);
                var line = node('div', 'mb-population-rebirth-row');
                line.style.cssText = 'display:grid;grid-template-columns:minmax(88px,1fr) minmax(70px,2fr) auto;align-items:center;gap:8px;margin:8px 0;';
                var name = node('span', '', safeCount(item && item.rebirth, 1000000) + '-й ребёрн');
                name.style.cssText = 'font-size:11px;color:#d4c7ed;';
                var track = node('div', 'mb-population-track');
                track.style.cssText = 'height:7px;overflow:hidden;border-radius:99px;background:rgba(255,255,255,.07);';
                var fill = node('div', 'mb-population-track-fill');
                fill.style.cssText = 'height:100%;width:' + Math.max(0, Math.min(100, count / maxPlayers * 100)) + '%;border-radius:99px;background:linear-gradient(90deg,#8168d9,#e8bd63);';
                track.appendChild(fill);
                var number = node('strong', '', formatCount(count) + (count === 1 ? ' игрок' : count < 5 ? ' игрока' : ' игроков'));
                number.style.cssText = 'font-size:10px;color:#f0e7ff;text-align:right;white-space:nowrap;';
                line.appendChild(name);
                line.appendChild(track);
                line.appendChild(number);
                rebirthSection.appendChild(line);
            });
            if (stats.most_popular_rebirth) {
                rebirthSection.appendChild(node('p', 'clan-muted',
                    'Самый населённый: ' + safeCount(stats.most_popular_rebirth.rebirth, 1000000) +
                    '-й ребёрн · ' + formatCount(safeCount(stats.most_popular_rebirth.players)) +
                    (safeCount(stats.most_popular_rebirth.players) === 1 ? ' игрок.' : ' игрока.')));
            }
        }
        container.appendChild(rebirthSection);

        var recent = Array.isArray(stats.recent_players) ? stats.recent_players : [];
        var recentSection = node('section', 'mb-population-recent');
        recentSection.style.cssText = 'margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);';
        var recentHeading = node('strong', '', '🕒 Последние замеченные игроки');
        recentHeading.style.cssText = 'display:block;margin-bottom:8px;font-size:12px;color:#e5d9ff;';
        recentSection.appendChild(recentHeading);
        recentSection.appendChild(node('p', 'clan-muted', 'Показывается последнее зафиксированное присутствие, а не время, проведённое в игре.'));
        if (!recent.length) {
            recentSection.appendChild(node('p', 'clan-muted', 'Пока нет записей о посещениях.'));
        } else {
            recent.forEach(function (player) {
                var row = node('div', 'mb-population-recent-player');
                row.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.04);';
                var identity = node('div', 'mb-population-recent-identity');
                identity.style.cssText = 'min-width:0;flex:1;';
                var playerName = node('strong', '', player.display_name || 'Игрок');
                playerName.style.cssText = 'display:block;overflow-wrap:anywhere;color:#f2eaff;font-size:11px;';
                var detail = node('span', '', '♻️ ' + safeCount(player.rebirth, 1000000) + '-й ребёрн · 🌊 волна ' + formatCount(safeCount(player.highest_wave, 1000000000)));
                detail.style.cssText = 'display:block;margin-top:3px;color:#afa5c4;font-size:10px;';
                identity.appendChild(playerName);
                identity.appendChild(detail);
                var seen = node('time', '', formatActivityDate(player.last_seen_at) || 'Время неизвестно');
                seen.style.cssText = 'max-width:48%;color:#9d94b1;font-size:9px;text-align:right;overflow-wrap:anywhere;';
                row.appendChild(identity);
                row.appendChild(seen);
                recentSection.appendChild(row);
            });
        }
        var checked = node('p', 'clan-muted', 'Статистика обновлена: ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
        checked.style.cssText = 'margin:10px 0 0;color:#88819d;font-size:9px;';
        recentSection.appendChild(checked);
        container.appendChild(recentSection);
    }

    async function refreshPopulationStats(force) {
        if (!db || !currentUser) return null;
        if (!force && populationStatsData && Date.now() - populationStatsFetchedAt < 60000) {
            renderPopulationStats('clanProfilePopulationStats', populationStatsData);
            renderPopulationStats('clanPublicPopulationStats', populationStatsData);
            return populationStatsData;
        }
        if (populationStatsPromise) return populationStatsPromise;

        var client = db;
        var userId = currentUser.id;
        populationStatsPromise = (async function () {
            try {
                var result = await client.rpc('mb_get_population_stats');
                if (result.error) throw result.error;
                if (client !== db || !currentUser || currentUser.id !== userId) return null;
                var data = Array.isArray(result.data) ? result.data[0] : result.data;
                if (data && data.stats) data = data.stats;
                if (!data || typeof data !== 'object') throw new Error('population_stats_invalid');
                populationStatsData = data;
                populationStatsFetchedAt = Date.now();
                renderPopulationStats('clanProfilePopulationStats', data);
                renderPopulationStats('clanPublicPopulationStats', data);
                return data;
            } catch (error) {
                console.warn('[MB online] Не удалось загрузить статистику сервера:', error && (error.message || error));
                renderPopulationStats('clanProfilePopulationStats', null);
                renderPopulationStats('clanPublicPopulationStats', null);
                return null;
            } finally {
                populationStatsPromise = null;
            }
        })();
        return populationStatsPromise;
    }

    function statsShownValue(value, minimum) {
        if (value === undefined || value === null || value === '') return '—';
        var numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) return '—';
        if (minimum) return numeric > 0 ? formatCount(numeric) + '+' : 'С обновления';
        return formatCount(numeric);
    }

    function renderExpandedStats(scope, data, mode) {
        var gridId = scope === 'own' ? 'clanProfileStats' : 'clanPublicStats';
        var historyId = scope === 'own' ? 'clanProfileRebirthHistory' : 'clanPublicRebirthHistory';
        var grid = byId(gridId), history = byId(historyId);
        if (!grid || !history) return;
        var current = data && data.current_rebirth_stats && typeof data.current_rebirth_stats === 'object' ? data.current_rebirth_stats : {};
        var lifetime = data && data.lifetime_stats && typeof data.lifetime_stats === 'object' ? data.lifetime_stats : {};
        var hasCurrentData = Object.prototype.hasOwnProperty.call(current, 'currentWave');
        var hasLifetimeData = Object.prototype.hasOwnProperty.call(lifetime, 'historicalDeathMinimum');
        var note = byId(scope === 'own' ? 'clanProfileStatsDataNote' : 'clanPublicStatsDataNote');
        if (note) {
            if (scope === 'public' && !hasCurrentData && !hasLifetimeData) {
                note.style.display = '';
                note.textContent = 'Игрок ещё не синхронизировал статистику после обновления. Подробные счётчики появятся после его следующего входа в игру и сохранения.';
            } else {
                note.style.display = '';
                note.textContent = 'Старые сохранения не содержали полной истории боёв. Счётчики смертей, побед над боссами и карт получаются без потери новых событий после установки обновления; исторические числа могут быть нижней оценкой.';
            }
        }
        var entries = [];
        if (mode === 'lifetime') {
            entries = [
                ['💀', 'Всего смертей (известный минимум)', hasLifetimeData ? statsShownValue(lifetime.deaths, lifetime.historicalDeathMinimum || lifetime.deathsApproximate) : '—'],
                ['🌊', 'Волн пройдено', hasLifetimeData ? statsShownValue(lifetime.wavesCleared, lifetime.wavesClearedApproximate || lifetime.legacyCountersPartial) : '—'],
                ['👹', 'Боссов побеждено', hasLifetimeData ? statsShownValue(lifetime.bossesDefeated, lifetime.bossesDefeatedApproximate || lifetime.legacyCountersPartial) : '—'],
                ['🎴', 'Новых карт получено с обновления', hasLifetimeData ? lifetime.cardsObtained : '—'],
                ['👆', 'Всего кликов', hasLifetimeData ? lifetime.clicks : safeCount(data && data.total_clicks, 1000000000)],
                ['🌌', 'Лучшая волна за всё время', Math.max(1, safeCount(lifetime.highestWave, 1000000000), safeCount(data && data.highest_wave, 1000000000))],
                ['♻️', 'Количество ребёрнов', Math.max(0, safeCount(lifetime.rebirths, 1000000), safeCount(data && data.rebirth_count, 1000000))],
                ['🏰', 'Максимальный чекпоинт', hasLifetimeData ? lifetime.highestCheckpoint : '—'],
                ['⭐', 'Максимум звёзд', hasLifetimeData ? lifetime.maxPoints : '—'],
                ['📦', 'Карт сейчас', hasLifetimeData ? lifetime.cardsOwned : '—'],
                ['🧬', 'Уникальных персонажей сейчас', hasLifetimeData ? lifetime.uniqueCardsOwned : '—']
            ];
        } else {
            entries = [
                ['♻️', 'Текущий ребёрн', safeCount(data && data.rebirth_count, safeCount(current.rebirth, 1000000))],
                ['💀', 'Смертей в этом ребёрне', hasCurrentData ? statsShownValue(current.deaths, current.deathsApproximate) : 'С обновления'],
                ['🌊', 'Волн пройдено', hasCurrentData ? statsShownValue(current.wavesCleared, current.wavesClearedApproximate) : 'С обновления'],
                ['👹', 'Боссов побеждено', hasCurrentData ? statsShownValue(current.bossesDefeated, current.bossesDefeatedApproximate) : 'С обновления'],
                ['🎴', 'Карт получено (известный минимум)', hasCurrentData ? statsShownValue(current.cardsObtained, current.cardsObtainedApproximate) : 'С обновления'],
                ['👆', 'Кликов в этом ребёрне', hasCurrentData ? statsShownValue(current.clicks, current.clicksApproximate) : 'С обновления'],
                ['🚩', 'Максимальная волна ребёрна', hasCurrentData ? Math.max(1, safeCount(current.highestWave, 1000000000)) : '—'],
                ['🏰', 'Чекпоинт', hasCurrentData ? current.highestCheckpoint : '—'],
                ['⭐', 'Максимум звёзд в ребёрне', hasCurrentData ? current.maxPoints : '—'],
                ['⚔️', 'Текущая волна', hasCurrentData ? current.currentWave : '—'],
                ['📈', 'Текущий уровень', hasCurrentData ? current.currentLevel : '—'],
                ['🎴', 'Карт в коллекции', hasCurrentData ? current.cardsOwned : '—'],
                ['🧬', 'Уникальных персонажей', hasCurrentData ? current.uniqueCardsOwned : '—'],
                ['✨', 'Текущие звёзды', hasCurrentData ? current.currentPoints : '—']
            ];
        }
        grid.replaceChildren();
        entries.forEach(function (entry) {
            var card = node('div', 'clan-stat expanded-stat');
            card.appendChild(node('strong', '', typeof entry[2] === 'number' ? formatCount(entry[2]) : String(entry[2] === undefined || entry[2] === null ? '—' : entry[2])));
            card.appendChild(node('span', '', entry[0] + ' ' + entry[1]));
            grid.appendChild(card);
        });
        grid.style.display = mode === 'history' ? 'none' : '';
        history.style.display = mode === 'history' ? '' : 'none';
        if (mode === 'history') renderRebirthHistory(historyId, data && data.rebirth_history);
        document.querySelectorAll('[data-stats-target="' + scope + '"]').forEach(function (button) {
            var active = button.getAttribute('data-stats-mode') === mode;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function renderRebirthHistory(containerId, historyData) {
        var container = byId(containerId);
        if (!container) return;
        container.replaceChildren();
        var history = Array.isArray(historyData) ? historyData.slice().reverse() : [];
        if (!history.length) {
            container.appendChild(node('div', 'stats-history-empty', 'История ребёрнов начнёт заполняться после следующих ребёрнов. Старые сохранения не записывали подробную статистику каждого цикла.'));
            return;
        }
        history.forEach(function (entry) {
            var card = node('section', 'rebirth-history-entry');
            var header = node('div', 'rebirth-history-header');
            var number = safeCount(entry && entry.rebirth, 1000000) + 1;
            header.appendChild(node('strong', '', 'До ребёрна №' + formatCount(number)));
            header.appendChild(node('span', 'rebirth-history-world', entry && entry.world ? entry.world : 'Мультивселенная'));
            card.appendChild(header);
            var legacy = [
                ['🌊', 'Лучшая волна', entry && entry.highestWave],
                ['🏰', 'Чекпоинт', entry && entry.highestCheckpoint],
                ['🎴', 'Карт в коллекции', entry && entry.totalCards],
                ['📈', 'Уровень', entry && entry.playerLevel],
                ['👆', 'Клики на тот момент', entry && entry.totalClicks],
                ['⭐', 'Максимум звёзд', entry && entry.maxPoints]
            ];
            var legacyGrid = node('div', 'rebirth-history-grid');
            legacy.forEach(function (metric) {
                var cell = node('div', 'rebirth-history-metric');
                cell.appendChild(node('strong', '', metric[2] === undefined || metric[2] === null ? '—' : formatCount(metric[2])));
                cell.appendChild(node('span', '', metric[0] + ' ' + metric[1]));
                legacyGrid.appendChild(cell);
            });
            card.appendChild(legacyGrid);
            var stats = entry && entry.stats && typeof entry.stats === 'object' ? entry.stats : null;
            if (entry && entry.statsVersion === 1 && stats) {
                var extended = node('div', 'rebirth-history-extra');
                [
                    ['💀', 'Смерти', stats.deaths],
                    ['🌊', 'Волн пройдено', stats.wavesCleared],
                    ['👹', 'Боссы', stats.bossesDefeated],
                    ['🎴', 'Карт получено', stats.cardsObtained],
                    ['👆', 'Кликов за ребёрн', stats.clicks]
                ].forEach(function (metric) {
                    var item = node('span', 'rebirth-history-chip', metric[0] + ' ' + metric[1] + ': ' + (metric[2] === undefined ? '—' : formatCount(metric[2])));
                    extended.appendChild(item);
                });
                card.appendChild(extended);
            } else {
                card.appendChild(node('p', 'clan-muted rebirth-history-note', 'Этот ребёрн был завершён до расширенной статистики. Сохранились только волна, чекпоинт и часть старых показателей.'));
            }
            container.appendChild(card);
        });
    }

    function setExpandedStatsMode(scope, mode) {
        if (['rebirth', 'lifetime', 'history'].indexOf(mode) === -1) mode = 'rebirth';
        if (scope === 'own') {
            ownStatsMode = mode;
            renderExpandedStats('own', ownStatsData, ownStatsMode);
        } else {
            publicStatsMode = mode;
            renderExpandedStats('public', publicStatsData, publicStatsMode);
        }
    }

    function updateProfileStatsPreview(stats) {
        if (!stats) return;
        ownStatsData = Object.assign({}, ownStatsData || {}, stats);
        renderExpandedStats('own', ownStatsData, ownStatsMode);
    }

    var PROFILE_STICKERS = [["🔥","Огонь"],["⭐","Звезда"],["👑","Корона"],["💀","Череп"],["⚡","Молния"],["💎","Алмаз"],["👹","Они"],["🐉","Дракон"],["🌀","Спираль"],["❤️","Сердце"],["☠️","Пират"],["🌊","Волна"],["🗿","Мем"],["👁️","Глаз"],["🌟","Сияние"],["🤡","Клоун"],["🦈","Акула"],["🐸","Лягушка"],["🎭","Маска"],["🧊","Лёд"],["🌑","Тьма"],["☀️","Солнце"],["🍜","Рамен"],["💥","Взрыв"],["🦇","Летучая мышь"],["🩸","Кровь"],["🎯","Мишень"],["🏆","Кубок"],["👻","Призрак"],["🐺","Волк"]];
    function avatarPathForName(name) {
        if (typeof name === 'string' && name.indexOf('sticker:') === 0) {
            var emoji = name.slice(8);
            if (!PROFILE_STICKERS.some(function (item) { return item[0] === emoji; })) return null;
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="28" fill="#24243b"/><text x="80" y="108" text-anchor="middle" font-size="92">' + emoji + '</text></svg>';
            return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        }
        var list = Array.isArray(window.MBAvatarOptions) ? window.MBAvatarOptions : [];
        var found = list.find(function (item) { return item && item.name === name && typeof item.path === 'string'; });
        return found ? found.path : null;
    }

    function getDiscoveredCardNamesForAvatar() {
        var api = window.MBGameCards;
        if (!api || typeof api.getDiscoveredCardNames !== 'function') return [];
        try {
            var names = api.getDiscoveredCardNames();
            return Array.isArray(names) ? names.filter(function (name) { return typeof name === 'string'; }) : [];
        } catch (_error) { return []; }
    }

    function isProfileAvatarUnlocked(name) {
        if (typeof name === 'string' && name.indexOf('sticker:') === 0) return !!avatarPathForName(name);
        return getDiscoveredCardNamesForAvatar().indexOf(name) !== -1;
    }

    function applyAvatarPreview(name) {
        var path = avatarPathForName(name) || avatarPathForName('Дио') || 'images/Super_Dio_2.gif';
        var preview = byId('clanProfilePreview');
        if (preview) preview.src = path;
    }

    function chooseAvatar(name) {
        if (!avatarPathForName(name)) return;
        if (!isProfileAvatarUnlocked(name)) {
            setNotice('Чтобы поставить карту на аватар, сначала получи её — она должна появиться в книге.', 'warning');
            return;
        }
        profileAvatarName = name;
        applyAvatarPreview(name);
        renderAvatarPicker(name);
    }

    var activeAvatarKind = 'stickers';
    function renderAvatarPicker(selectedName) {
        var container = byId('clanAvatarChoices');
        if (!container) return;
        container.replaceChildren();
        var list = Array.isArray(window.MBAvatarOptions) ? window.MBAvatarOptions : [];
        var search = byId('clanAvatarSearch');
        var query = (search ? search.value : '').trim().toLocaleLowerCase('ru');
        var options = activeAvatarKind === 'stickers'
            ? PROFILE_STICKERS.map(function (item) { return { name: 'sticker:' + item[0], label: item[1], path: avatarPathForName('sticker:' + item[0]), sticker: true, unlocked: true }; })
            : list.map(function (item) { return { name: item.name, label: item.name, path: item.path, sticker: false, unlocked: isProfileAvatarUnlocked(item.name) }; });
        options = options.filter(function (item) { return !query || item.label.toLocaleLowerCase('ru').indexOf(query) !== -1; });
        if (activeAvatarKind === 'images') {
            var hint = node('p', 'avatar-locked-hint', '🔒 Чтобы выбрать карту аватаром, сначала получи её. Открытые карты отмечены без замка; продажа карты не убирает её из книги.');
            hint.style.gridColumn = '1 / -1';
            container.appendChild(hint);
        }
        if (!options.length) {
            container.appendChild(node('p', 'clan-muted', 'Ничего не найдено. Попробуй другое название.'));
            return;
        }
        options.forEach(function (item) {
            var selected = item.name === selectedName;
            var button = node('button', 'clan-avatar-option' + (selected ? ' selected' : '') + (item.sticker ? ' clan-sticker-option' : ''));
            button.type = 'button';
            button.disabled = !item.unlocked;
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
            button.setAttribute('aria-label', item.label + (item.unlocked ? '' : ' — сначала открой карту в книге'));
            button.title = item.unlocked ? item.label : 'Сначала получи эту карту, чтобы открыть аватар';
            var img = node('img');
            img.src = item.path;
            img.alt = item.label;
            img.loading = 'lazy';
            button.appendChild(img);
            button.appendChild(node('span', '', item.label + (item.unlocked ? '' : ' 🔒')));
            button.addEventListener('click', function () { chooseAvatar(item.name); });
            container.appendChild(button);
        });
        document.querySelectorAll('[data-avatar-kind]').forEach(function (button) {
            var active = button.getAttribute('data-avatar-kind') === activeAvatarKind;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    async function loadLeaderboard() {
        var container = byId('clanLeaderboard');
        if (!container) return;
        container.replaceChildren();
        if (!db || !currentUser) {
            container.appendChild(node('p', 'clan-muted', 'Войди в аккаунт, чтобы смотреть рейтинг и профили игроков.'));
            return;
        }
        container.appendChild(node('p', 'clan-muted', 'Загружаем рейтинг…'));
        try {
            var sortKey = byId('clanLeaderboardSort') ? byId('clanLeaderboardSort').value : 'highest_wave';
            var allowedSorts = ['highest_wave', 'total_wins', 'rebirth_count', 'cards_collected', 'bosses_defeated', 'total_clicks'];
            if (allowedSorts.indexOf(sortKey) === -1) sortKey = 'highest_wave';
            var result = await db.from('profiles')
                .select('id, display_name, friend_code, avatar_name, description, active_title, achievement_title_unlocks, showcase_cards, current_rebirth_stats, lifetime_stats, rebirth_history, total_wins, highest_wave, rebirth_count, cards_collected, bosses_defeated, total_clicks')
                // Hide this account from the public ranking only; keep its profile and save intact.
                .neq('id', '41f620ed-4196-4203-bfbd-a34954e23d84')
                .order(sortKey, { ascending: false })
                .order('highest_wave', { ascending: false })
                .limit(100);
            if (result.error) throw result.error;
            container.replaceChildren();
            var players = result.data || [];
            if (!players.length) {
                container.appendChild(node('p', 'clan-muted', 'Пока нет игроков в рейтинге.'));
                return;
            }
            players.forEach(function (player, index) {
                var row = node('button', 'clan-leaderboard-row');
                row.type = 'button';
                row.addEventListener('click', function () { openPublicProfile(player.id); });
                row.appendChild(node('span', 'clan-leaderboard-rank', '#' + (index + 1)));
                var avatar = node('img', 'clan-leaderboard-avatar');
                avatar.src = avatarPathForName(player.avatar_name) || 'images/Super_Dio_2.gif';
                avatar.alt = '';
                avatar.loading = 'lazy';
                row.appendChild(avatar);
                var details = node('span', 'clan-leaderboard-player');
                details.appendChild(node('strong', '', player.display_name || 'Игрок'));
                if (player.active_title && titleById(player.active_title)) details.appendChild(node('small', '', '🏅 ' + titleLabel(player.active_title)));
                details.appendChild(node('small', '', '🌊 Волна ' + formatCount(player.highest_wave) + ' · 🏆 Победы ' + formatCount(player.total_wins) + ' · ♻️ Ребёрны ' + formatCount(player.rebirth_count)));
                row.appendChild(details);
                row.appendChild(node('span', 'clan-leaderboard-open', 'Профиль ↗'));
                container.appendChild(row);
            });
        } catch (error) {
            container.replaceChildren();
            container.appendChild(node('p', 'clan-muted', 'Не удалось загрузить рейтинг: ' + friendlyError(error)));
        }
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
            .select('id, display_name, friend_code, avatar_name, description, active_title, achievement_title_unlocks, showcase_cards, current_rebirth_stats, lifetime_stats, rebirth_history, created_at, updated_at, total_wins, highest_wave, rebirth_count, cards_collected, bosses_defeated, total_clicks')
            .eq('id', currentUser.id)
            .maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) throw new Error('profile_not_found');
        currentProfile = result.data;
        byId('clanProfileName').value = result.data.display_name || '';
        byId('clanProfileDescription').value = result.data.description || '';
        profileAvatarName = avatarPathForName(result.data.avatar_name) && isProfileAvatarUnlocked(result.data.avatar_name) ? result.data.avatar_name : 'sticker:⭐';
        renderAvatarPicker(profileAvatarName);
        applyAvatarPreview(profileAvatarName);
        var mergedStats = Object.assign({}, result.data, readLocalGameStats() || {});
        ownStatsData = mergedStats;
        renderExpandedStats('own', ownStatsData, ownStatsMode);
        loadGameActivityStats(currentUser.id, 'own', false);
        loadUniqueBossFightStats(currentUser.id, 'own', false);
        refreshPopulationStats(false);
        profileShowcaseSavedCards = Array.isArray(result.data.showcase_cards) ? result.data.showcase_cards.slice(0, 3) : [];
        profileShowcaseSelection = profileShowcaseSavedCards.map(function (card) { return card && card.uid !== undefined ? String(card.uid) : ''; }).filter(Boolean);
        renderShowcasePicker();
        renderTitlePicker(mergedStats, result.data.active_title || '');
        if (byId('clanProfileFriendCode')) byId('clanProfileFriendCode').textContent = result.data.friend_code ? 'MB-' + result.data.friend_code : '—';
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
        if (!isProfileAvatarUnlocked(profileAvatarName)) return setNotice('Сначала получи эту карту — она должна появиться в книге, и только потом её можно поставить на аватар.', 'warning');
        var titleStats = Object.assign({}, currentProfile || {}, readLocalGameStats() || {});
        var activeTitle = byId('clanProfileTitle') ? byId('clanProfileTitle').value : '';
        if (!isTitleUnlocked(activeTitle, titleStats)) return setNotice('Этот титул ещё не открыт.', 'warning');
        var showcaseCards = selectedShowcaseSnapshots();
        if (showcaseCards.length !== profileShowcaseSelection.length) return setNotice('Одна из выбранных карт не найдена в текущем сохранении. Выбери карты заново.', 'warning');
        setBusy(true);
        try {
            var result = await db.from('profiles').update({
                display_name: name,
                avatar_name: profileAvatarName,
                description: description,
                active_title: activeTitle,
                showcase_cards: showcaseCards
            }).eq('id', currentUser.id).select('id').maybeSingle();
            if (result.error) throw result.error;
            if (!result.data) throw new Error('profile_not_found');
            setNotice('Профиль, титул и витрина сохранены!', 'success');
            await refreshAll();
        } catch (error) {
            setNotice(friendlyError(error), 'error');
        } finally {
            setBusy(false);
        }
    }

    async function openPublicProfile(userId) {
        if (!db || !currentUser || !userId) return;
        var overlay = byId('clanPublicProfileOverlay');
        var card = byId('clanPublicProfileCard');
        if (!overlay || !card) return;
        publicProfileUserId = userId;
        publicStatsMode = 'rebirth';
        if (publicActivityRefreshTimer !== null) {
            window.clearInterval(publicActivityRefreshTimer);
            publicActivityRefreshTimer = null;
        }
        publicProfileCreatedAtFallback = null;
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('clan-profile-modal-open');
        byId('clanPublicName').textContent = 'Загружаем профиль…';
        byId('clanPublicDescription').textContent = 'Получаем данные игрока.';
        byId('clanPublicStats').replaceChildren();
        renderPublicShowcase('clanPublicShowcase', []);
        var friendAction = byId('clanPublicFriendAction');
        if (friendAction) friendAction.disabled = true;
        var closeButton = byId('clanPublicProfileClose');
        if (closeButton) closeButton.focus();
        try {
            var result = await db.from('profiles')
                .select('id, display_name, friend_code, avatar_name, description, active_title, achievement_title_unlocks, showcase_cards, current_rebirth_stats, lifetime_stats, rebirth_history, created_at, total_wins, highest_wave, rebirth_count, cards_collected, bosses_defeated, total_clicks')
                .eq('id', userId).maybeSingle();
            if (result.error) throw result.error;
            if (!result.data) throw new Error('profile_not_found');
            if (publicProfileUserId !== userId) return;
            byId('clanPublicName').textContent = result.data.display_name || 'Игрок';
            byId('clanPublicDescription').textContent = result.data.description || 'Игрок пока не добавил описание.';
            byId('clanPublicAvatar').src = avatarPathForName(result.data.avatar_name) || 'images/Super_Dio_2.gif';
            byId('clanPublicFriendCode').textContent = result.data.friend_code ? 'MB-' + result.data.friend_code : '—';
            renderPublicActivity(null, result.data.created_at);
            try {
                await refreshPublicProfileActivity(userId, result.data.created_at);
            } catch (activityError) {
                console.warn('[MB online] Не удалось загрузить активность игрока:', activityError.message || activityError);
                renderPublicActivity(null, result.data.created_at);
            }
            if (publicProfileUserId === userId) {
                publicProfileCreatedAtFallback = result.data.created_at || null;
                publicActivityRefreshTimer = window.setInterval(function () {
                    refreshPublicProfileActivity(userId, publicProfileCreatedAtFallback).catch(function (activityError) {
                        console.warn('[MB online] Не удалось обновить статус игрока:', activityError.message || activityError);
                    });
                }, 30000);
            }
            showPublicTitle(result.data);
            renderPublicShowcase('clanPublicShowcase', result.data.showcase_cards);
            publicStatsData = result.data;
            renderExpandedStats('public', publicStatsData, publicStatsMode);
            renderAchievementBadges('clanPublicBadges', result.data, false);
            loadGameActivityStats(userId, 'public', false);
            loadUniqueBossFightStats(userId, 'public', false);
            refreshPopulationStats(false);
            updatePublicFriendAction();
        } catch (error) {
            byId('clanPublicName').textContent = 'Не удалось открыть профиль';
            byId('clanPublicDescription').textContent = friendlyError(error);
            if (friendAction) friendAction.disabled = true;
        }
    }

    function hidePublicProfile() {
        publicProfileUserId = null;
        if (publicActivityRefreshTimer !== null) {
            window.clearInterval(publicActivityRefreshTimer);
            publicActivityRefreshTimer = null;
        }
        publicProfileCreatedAtFallback = null;
        var overlay = byId('clanPublicProfileOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('clan-profile-modal-open');
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


    function setGlobalChatState(message, failed) {
        var el = byId('globalChatState');
        if (!el) return;
        el.textContent = message || '';
        el.style.color = failed ? '#ff9c9c' : '#9be7b0';
    }

    function globalChatMessageElement(item) {
        var mine = currentUser && String(item.user_id) === String(currentUser.id);
        var row = node('div', 'clan-chat-message' + (mine ? ' mine' : ''));
        var senderName = item.sender_name || 'Игрок';
        var avatar = node('img', 'clan-chat-avatar');
        avatar.src = avatarPathForName(item.avatar_name) || 'images/Super_Dio_2.gif';
        avatar.alt = senderName;
        avatar.loading = 'lazy';

        var body = node('div', 'clan-chat-body');
        var meta = node('div', 'clan-chat-meta');
        var author = node('button', 'global-chat-author', senderName);
        author.type = 'button';
        author.addEventListener('click', function () {
            if (item.user_id && currentUser) openPublicProfile(item.user_id);
        });
        meta.appendChild(author);

        var date = new Date(item.created_at);
        var time = node('time', '', Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
        if (!Number.isNaN(date.getTime())) time.dateTime = date.toISOString();
        meta.appendChild(time);
        body.appendChild(meta);
        body.appendChild(node('div', 'clan-chat-text', item.message || ''));
        row.appendChild(avatar);
        row.appendChild(body);
        return row;
    }

    function renderGlobalChatMessages(messages, forceBottom) {
        var container = byId('globalChatMessages');
        if (!container) return;
        var oldScrollTop = container.scrollTop;
        var nearBottom = forceBottom === true ||
            container.scrollHeight - container.scrollTop - container.clientHeight < 90;

        container.replaceChildren();
        if (!messages || !messages.length) {
            container.appendChild(node('div', 'clan-chat-empty', 'Сообщений пока нет. Напиши первым!'));
            container.scrollTop = container.scrollHeight;
            return;
        }
        messages.forEach(function (item) {
            container.appendChild(globalChatMessageElement(item));
        });
        container.scrollTop = nearBottom ? container.scrollHeight : oldScrollTop;
    }

    function mergeGlobalChatMessages(incoming) {
        var byId = Object.create(null);
        globalChatMessages.concat(incoming || []).forEach(function (item) {
            if (item && item.id !== undefined && item.id !== null) byId[String(item.id)] = item;
        });
        var merged = Object.keys(byId).map(function (key) { return byId[key]; });
        merged.sort(function (a, b) {
            var delta = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return delta || String(a.id).localeCompare(String(b.id), 'en', { numeric: true });
        });
        globalChatMessages = merged.slice(-80);
    }

    async function loadGlobalChatMessages() {
        if (!db || !currentUser) return;
        var userId = currentUser.id;
        var result = await db.from('global_chat_messages')
            .select('id, user_id, sender_name, avatar_name, message, created_at')
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(80);
        if (result.error) throw result.error;
        if (!currentUser || currentUser.id !== userId) return;
        // Merge instead of replacing: a Realtime event might arrive while this query is running.
        mergeGlobalChatMessages((result.data || []).slice().reverse());
        renderGlobalChatMessages(globalChatMessages, true);
    }

    function addGlobalChatMessage(item) {
        if (!item || item.id === undefined || item.id === null) return;
        var container = byId('globalChatMessages');
        var wasNearBottom = !container ||
            container.scrollHeight - container.scrollTop - container.clientHeight < 90;
        mergeGlobalChatMessages([item]);
        renderGlobalChatMessages(globalChatMessages, wasNearBottom);
    }

    function closeGlobalChat() {
        var oldChannel = globalChatChannel;
        globalChatChannel = null;
        globalChatUserId = null;
        globalChatMessages = [];
        var container = byId('globalChatMessages');
        if (container) {
            container.replaceChildren(node('div', 'clan-chat-empty', 'Войди в аккаунт, чтобы читать общий чат.'));
        }
        setGlobalChatState('Ожидаем вход в аккаунт…', false);
        if (oldChannel && db) return db.removeChannel(oldChannel).catch(function () {});
        return Promise.resolve();
    }

    async function ensureGlobalChatRealtime() {
        if (!db || !currentUser) {
            setGlobalChatState('Войди в аккаунт, чтобы подключиться к общему чату.', false);
            return;
        }
        var userId = currentUser.id;
        if (globalChatChannel && globalChatUserId === userId) {
            await loadGlobalChatMessages();
            return;
        }

        await closeGlobalChat();
        globalChatUserId = userId;
        setGlobalChatState('Подключаем общий чат…', false);
        globalChatChannel = db.channel('mb-global-chat-' + userId)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'global_chat_messages'
            }, function (payload) {
                if (!payload || !payload.new || globalChatUserId !== userId ||
                    !currentUser || currentUser.id !== userId) return;
                addGlobalChatMessage(payload.new);
            })
            .subscribe(function (status, error) {
                if (globalChatUserId !== userId || !currentUser || currentUser.id !== userId) return;
                if (status === 'SUBSCRIBED') {
                    setGlobalChatState('● Подключён · сообщения приходят в реальном времени', false);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    setGlobalChatState(error ? friendlyError(error) : 'Соединение потеряно. Попробуй обновить чат.', true);
                }
            });
        await loadGlobalChatMessages();
    }

    async function sendGlobalChatMessage(event) {
        if (event) event.preventDefault();
        if (!db || !currentUser || globalChatSending) return;
        var input = byId('globalChatInput');
        if (!input) return;
        var message = input.value.trim();
        if (!message) return setGlobalChatState('Напиши сообщение перед отправкой.', true);
        if (message.length > 300) return setGlobalChatState('Сообщение слишком длинное: максимум 300 символов.', true);

        globalChatSending = true;
        var sendButton = byId('globalChatSendBtn');
        if (sendButton) sendButton.disabled = true;
        try {
            var result = await db.rpc('mb_send_global_chat_message', { p_message: message });
            if (result.error) throw result.error;
            input.value = '';
            var sent = result.data;
            if (Array.isArray(sent)) sent = sent[0];
            if (sent && sent.id !== undefined) addGlobalChatMessage(sent);
            else await loadGlobalChatMessages();
            setGlobalChatState('● Сообщение отправлено', false);
        } catch (error) {
            setGlobalChatState(friendlyError(error), true);
        } finally {
            globalChatSending = false;
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
            var dangerZone = byId('clanDangerZone');
            if (dangerZone) dangerZone.style.display = 'none';
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

        var dangerZone = byId('clanDangerZone');
        if (dangerZone) dangerZone.style.display = 'block';
        var actions = byId('clanCurrentActions');
        if (actions) {
            actions.replaceChildren();
            if (currentClan.role === 'leader') {
                actions.appendChild(actionButton('Распустить клан', 'btn clan-danger-btn', disbandClan));
            } else {
                actions.appendChild(actionButton('Покинуть клан', 'btn clan-danger-btn', leaveClan));
            }
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

    function renderClanCardRequests(requests, profilesById, ownedCards, giftsRemaining) {
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
                    giftBtn.disabled = busy || Number(giftsRemaining) <= 0;
                    if (Number(giftsRemaining) <= 0) giftBtn.title = 'Лимит 3 передачи в день исчерпан';
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
        renderClanCardRequests(requests, profilesById, ownedCards, quotaRow.gifts_remaining);

        var requestBtn = byId('clanCardRequestBtn');
        if (requestBtn) requestBtn.disabled = busy;
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
        if (globalChatChannel && (!currentUser || globalChatUserId !== currentUser.id)) await closeGlobalChat();
        if (!db || !currentUser) {
            await closeGlobalChat();
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
                options: {
                    data: { display_name: displayName.slice(0, 24) },
                    // Supabase's dashboard Site URL may still be localhost. Always
                    // return confirmation links to the page where registration began.
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });
            if (result.error) throw result.error;
            var createdUser = result.data && result.data.user;
            var identities = createdUser && Array.isArray(createdUser.identities) ? createdUser.identities : null;
            var trulyNewAccount = !!createdUser && (identities ? identities.length > 0 : !!result.data.session);
            if (trulyNewAccount && createdUser.id) {
                // Persist through email confirmation so the first later login can carry
                // the current slot into this brand-new account.
                localStorage.setItem(NEW_ACCOUNT_SLOT_TRANSFER_KEY, createdUser.id);
            }
            if (result.data.session) {
                currentUser = result.data.user;
                if (isPendingNewAccountTransfer(currentUser.id)) {
                    var transferError = await accountSlotBindingError(currentUser, getCurrentGameSlot());
                    if (transferError) {
                        setNotice(transferError, 'warning');
                        try { await db.auth.signOut(); } catch (_signOutError) {}
                        currentUser = null;
                        showAuthState();
                        notifyCloudSaveAuthChanged();
                        return;
                    }
                }
                setNotice(isPendingNewAccountTransfer(currentUser.id)
                    ? 'Новый аккаунт создан. Текущее сохранение будет перенесено в него.'
                    : 'Аккаунт создан. Добро пожаловать!', 'success');
                await refreshAll();
                notifyCloudSaveAuthChanged();
            } else {
                setNotice(trulyNewAccount
                    ? 'Аккаунт создан. Подтверди почту и войди: сохранение текущего слота перенесётся в новый аккаунт.'
                    : 'Если аккаунт уже существует, просто войди. Существующее облачное сохранение не будет перезаписано.',
                    'success');
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
            var bindingError = await accountSlotBindingError(currentUser, getCurrentGameSlot());
            if (bindingError) {
                await rejectAccountForSlot(db, getCurrentGameSlot(), bindingError);
                return;
            }
            setNotice(isPendingNewAccountTransfer(currentUser.id)
                ? 'Вход выполнен. Переносим локальное сохранение в новый аккаунт…'
                : 'Вход выполнен. Проверяем облачное сохранение аккаунта…', 'success');
            await refreshAll();
            notifyCloudSaveAuthChanged();
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
            var logoutUserId = currentUser && currentUser.id;
            if (typeof window.mbFlushCloudSave === 'function') {
                try {
                    var flushed = await window.mbFlushCloudSave();
                    if (flushed === false) console.warn('[MB cloud] Final sync did not finish before logout.');
                } catch (syncError) {
                    console.warn('[MB cloud] Final sync failed before logout:', syncError && syncError.message ? syncError.message : syncError);
                }
            }
            if (logoutUserId) await releaseActiveAccountSession(logoutUserId);
            var result = await db.auth.signOut();
            if (result.error) throw result.error;
            currentUser = null;
            currentClan = null;
            notifyCloudSaveAuthChanged();
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

    function setCloudSaveStatus(message, kind) {
        var el = byId('cloudSaveStatus');
        if (!el) return;
        el.textContent = message || '';
        el.className = 'clan-notice' + (kind ? ' clan-notice-' + kind : '');
    }

    function notifyCloudSaveAuthChanged() {
        if (!currentUser) {
            currentFriends = [];
            currentFriendRequests = [];
            currentClanInvites = [];
            currentFriendSearchResults = [];
            publicProfileUserId = null;
            hidePublicProfile();
        }
        if (!currentUser) { gameAnalyticsSessionId = null; gameAnalyticsUserId = null; }
        if (db && currentUser && !accountSessionBlocked && activeAccountSessionUserId === currentUser.id) trackGameAnalytics(false);
        if (db && currentUser && !accountSessionBlocked && activeAccountSessionUserId === currentUser.id) db.rpc('mb_touch_presence').then(function (result) {
            if (result.error) console.warn('[MB friends] Presence update:', result.error.message);
        }).catch(function () {});
        try {
            window.dispatchEvent(new CustomEvent('mb:auth-changed', {
                detail: {
                    userId: currentUser && !accountSessionBlocked && activeAccountSessionUserId === currentUser.id ? currentUser.id : null,
                    email: currentUser ? currentUser.email : null,
                    isNewAccount: isPendingNewAccountTransfer(currentUser ? currentUser.id : null)
                }
            }));
        } catch (_error) {}
    }

    async function getCloudSave() {
        if (!db || !currentUser) throw new Error('auth_required');
        if (accountSessionBlocked || activeAccountSessionUserId !== currentUser.id || !activeAccountSessionId) throw new Error('active_session_required');
        var result = await db.rpc('read_player_cloud_save', { p_session_id: activeAccountSessionId });
        if (result.error) throw result.error;
        var row = Array.isArray(result.data) ? result.data[0] : result.data;
        return row || null;
    }

    async function writeCloudSave(saveData, expectedUpdatedAt) {
        if (!db || !currentUser) throw new Error('auth_required');
        if (accountSessionBlocked || activeAccountSessionUserId !== currentUser.id || !activeAccountSessionId) throw new Error('active_session_required');
        if (!saveData || typeof saveData !== 'object' || Array.isArray(saveData)) throw new Error('cloud_save_invalid');
        var result = await db.rpc('write_player_cloud_save', {
            p_save_data: saveData,
            p_expected_updated_at: expectedUpdatedAt || null,
            p_session_id: activeAccountSessionId
        });
        if (result.error) throw result.error;
        var row = Array.isArray(result.data) ? result.data[0] : result.data;
        if (!row || !row.updated_at) throw new Error('cloud_save_write_no_result');
        return { updated_at: row.updated_at, revision: row.revision };
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
        var cloudDownloadBtn = byId('cloudSaveDownloadBtn');
        if (cloudDownloadBtn) cloudDownloadBtn.addEventListener('click', function () {
            window.dispatchEvent(new CustomEvent('mb:cloud-save-action', { detail: { action: 'download' } }));
        });
        var cloudUploadBtn = byId('cloudSaveUploadBtn');
        if (cloudUploadBtn) cloudUploadBtn.addEventListener('click', function () {
            window.dispatchEvent(new CustomEvent('mb:cloud-save-action', { detail: { action: 'upload' } }));
        });
        var cloudUnbindBtn = byId('cloudSaveUnbindBtn');
        if (cloudUnbindBtn) cloudUnbindBtn.addEventListener('click', function () {
            window.dispatchEvent(new CustomEvent('mb:cloud-save-action', { detail: { action: 'unbind' } }));
        });
        var cloudRestoreBtn = byId('cloudSaveRestoreBackupBtn');
        if (cloudRestoreBtn) cloudRestoreBtn.addEventListener('click', function () {
            window.dispatchEvent(new CustomEvent('mb:cloud-save-action', { detail: { action: 'restore-backup' } }));
        });
        byId('clanCreateForm').addEventListener('submit', createClan);
        byId('clanProfileForm').addEventListener('submit', saveProfile);
        byId('clanChatForm').addEventListener('submit', sendClanChatMessage);
        var globalChatForm = byId('globalChatForm');
        if (globalChatForm) globalChatForm.addEventListener('submit', sendGlobalChatMessage);
        var globalChatRefreshButton = byId('globalChatRefresh');
        if (globalChatRefreshButton) globalChatRefreshButton.addEventListener('click', function () {
            ensureGlobalChatRealtime().catch(function (error) { setGlobalChatState(friendlyError(error), true); });
        });
        byId('clanCardRequestForm').addEventListener('submit', submitClanCardRequest);
        populateClanCardRequestOptions();
        byId('clanPublicProfileClose').addEventListener('click', hidePublicProfile);
        var friendSearchForm = byId('onlineFriendSearchForm');
        if (friendSearchForm) friendSearchForm.addEventListener('submit', searchOnlinePlayers);
        var friendsRefreshButton = byId('onlineFriendsRefresh');
        if (friendsRefreshButton) friendsRefreshButton.addEventListener('click', refreshFriendsHub);
        var showcaseSearch = byId('clanShowcaseSearch');
        if (showcaseSearch) showcaseSearch.addEventListener('input', renderShowcasePicker);
        document.querySelectorAll('[data-stats-target]').forEach(function (button) {
            button.addEventListener('click', function () {
                setExpandedStatsMode(button.getAttribute('data-stats-target'), button.getAttribute('data-stats-mode'));
            });
        });
        var copyFriendCodeButton = byId('clanCopyFriendCode');
        if (copyFriendCodeButton) copyFriendCodeButton.addEventListener('click', function () {
            var code = currentProfile && currentProfile.friend_code;
            if (code) copyText('MB-' + code);
        });
        var publicFriendAction = byId('clanPublicFriendAction');
        if (publicFriendAction) publicFriendAction.addEventListener('click', function () {
            if (!publicProfileUserId || !currentUser || publicProfileUserId === currentUser.id) return;
            var relation = playerFriendRelation(publicProfileUserId);
            if (relation === 'incoming') respondFriendRequest(publicProfileUserId, 'accept');
            else if (!relation) sendFriendRequest(publicProfileUserId);
        });
        var publicProfileOverlay = byId('clanPublicProfileOverlay');
        if (publicProfileOverlay) publicProfileOverlay.addEventListener('click', function (event) {
            if (event.target === publicProfileOverlay) hidePublicProfile();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                var overlay = byId('clanPublicProfileOverlay');
                if (overlay && overlay.style.display !== 'none') hidePublicProfile();
            }
        });
        var leaderboardRefresh = byId('clanLeaderboardRefresh');
        if (leaderboardRefresh) leaderboardRefresh.addEventListener('click', loadLeaderboard);
        var leaderboardSort = byId('clanLeaderboardSort');
        if (leaderboardSort) leaderboardSort.addEventListener('change', loadLeaderboard);
        document.querySelectorAll('[data-online-view]').forEach(function (button) {
            button.addEventListener('click', function () {
                var view = button.getAttribute('data-online-view');
                // Keep the global chat subscription only while its pane is open to limit Realtime traffic.
                if (view !== 'chat' && globalChatChannel) closeGlobalChat();
                document.querySelectorAll('[data-online-view]').forEach(function (item) {
                    var active = item === button;
                    item.classList.toggle('active', active);
                    item.setAttribute('aria-selected', active ? 'true' : 'false');
                });
                document.querySelectorAll('[data-online-pane]').forEach(function (pane) {
                    pane.classList.toggle('active', pane.getAttribute('data-online-pane') === view);
                });
                if (view === 'rating' && currentUser) loadLeaderboard();
                if (view === 'clan' && currentUser) refreshAll();
                if (view === 'friends' && currentUser) refreshFriendsHub();
                if (view === 'chat' && currentUser) ensureGlobalChatRealtime().catch(function (error) { setGlobalChatState(friendlyError(error), true); });
            });
        });
        document.querySelectorAll('[data-avatar-kind]').forEach(function (button) {
            button.addEventListener('click', function () {
                activeAvatarKind = button.getAttribute('data-avatar-kind') === 'images' ? 'images' : 'stickers';
                renderAvatarPicker(profileAvatarName);
            });
        });
        var avatarSearch = byId('clanAvatarSearch');
        if (avatarSearch) avatarSearch.addEventListener('input', function () { renderAvatarPicker(profileAvatarName); });
        var tab = document.querySelector('.tab-btn[data-tab="clans"]');
        if (tab) {
            tab.addEventListener('click', function () {
                if (currentUser) {
                    refreshAll();
                    loadLeaderboard();
                }
            });
        }
    }

    function getCurrentGameSlot() {
        try {
            var liveSlot = typeof currentSlot !== 'undefined' ? Number(currentSlot) : -1;
            if (Number.isInteger(liveSlot) && liveSlot >= 0 && liveSlot <= 2) return liveSlot;
            var lastSlot = Number(localStorage.getItem('cgV20_lastSlot'));
            if (Number.isInteger(lastSlot) && lastSlot >= 0 && lastSlot <= 2) return lastSlot;
        } catch (_error) {}
        return 0;
    }

    function authStorageKeyForSlot(slot) {
        return 'mb-multiverse-battle-auth-slot-' + slot;
    }

    function migrateLegacyAuthSession() {
        var config = window.MB_SUPABASE_CONFIG || {};
        var projectRef = '';
        try { projectRef = new URL(config.url).hostname.split('.')[0]; } catch (_error) {}
        if (!projectRef) return;
        var legacyKey = 'sb-' + projectRef + '-auth-token';
        var legacyValue = localStorage.getItem(legacyKey);
        if (!legacyValue) return;
        for (var i = 0; i < 3; i++) {
            if (localStorage.getItem(authStorageKeyForSlot(i))) return;
        }
        var targetSlot = getCurrentGameSlot();
        try {
            var parsed = JSON.parse(legacyValue);
            var legacyUserId = parsed && parsed.user && parsed.user.id;
            if (legacyUserId) {
                var bindingData = JSON.parse(localStorage.getItem('cgV20_cloud_slot_bindings_v1') || '{}');
                var mapped = bindingData && bindingData.byUser ? Number(bindingData.byUser[legacyUserId]) : NaN;
                if (Number.isInteger(mapped) && mapped >= 0 && mapped <= 4) {
                    targetSlot = mapped;
                } else {
                    for (var slotIndex = 0; slotIndex < 5; slotIndex++) {
                        var marker = JSON.parse(localStorage.getItem('cgV20_slot' + slotIndex + '_cloud_sync_meta') || 'null');
                        if (marker && marker.userId === legacyUserId) { targetSlot = slotIndex; break; }
                    }
                }
            }
        } catch (_error) {}
        var slotKey = authStorageKeyForSlot(targetSlot);
        if (!localStorage.getItem(slotKey)) {
            localStorage.setItem(slotKey, legacyValue);
            localStorage.removeItem(legacyKey);
        }
    }

    function getDeviceBindingId() {
        var key = 'mb_multiverse_device_binding_id_v1';
        var id = localStorage.getItem(key);
        if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return id;
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            id = window.crypto.randomUUID();
        } else {
            id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
                var r = Math.random() * 16 | 0;
                return (ch === 'x' ? r : (r & 3 | 8)).toString(16);
            });
        }
        localStorage.setItem(key, id);
        return id;
    }

    function makeClientSessionUuid() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
            var r = Math.random() * 16 | 0;
            return (ch === 'x' ? r : (r & 3 | 8)).toString(16);
        });
    }

    function getActiveAccountClientSessionId() {
        // Keep a unique ID per loaded document. Browsers can clone sessionStorage
        // when duplicating tabs; a shared ID lets one tab release another tab's lock.
        if (!clientTabSessionId) clientTabSessionId = makeClientSessionUuid();
        return clientTabSessionId;
    }

    async function getAuthSessionId(client) {
        client = client || db;
        if (!client) return null;
        var result = await client.auth.getSession();
        if (result.error) throw result.error;
        var session = result.data && result.data.session;
        var token = session && session.access_token;
        if (!token) return null;
        try {
            var payload = token.split('.')[1];
            if (!payload) return null;
            payload = payload.replace(/-/g, '+').replace(/_/g, '/');
            while (payload.length % 4) payload += '=';
            var claims = JSON.parse(window.atob(payload));
            var id = claims && claims.session_id;
            return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
        } catch (_error) {
            return null;
        }
    }

    function stopActiveAccountSessionHeartbeat() {
        if (activeAccountSessionHeartbeatTimer !== null) {
            window.clearInterval(activeAccountSessionHeartbeatTimer);
            activeAccountSessionHeartbeatTimer = null;
        }
    }

    function clearAccountSessionLock() {
        accountSessionBlocked = false;
        var overlay = byId('mbAccountSessionLock');
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        accountSessionLockOverlay = null;
    }

    function showAccountSessionLock(message) {
        accountSessionBlocked = true;
        var overlay = byId('mbAccountSessionLock');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mbAccountSessionLock';
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(5,6,16,.97);font-family:Nunito,Arial,sans-serif;';
            var card = document.createElement('div');
            card.style.cssText = 'width:100%;max-width:520px;padding:26px;border:1px solid rgba(245,175,25,.75);border-radius:20px;background:#171729;color:#f5f5ff;box-shadow:0 20px 80px rgba(0,0,0,.65);text-align:center;';
            var heading = document.createElement('h2');
            heading.textContent = '🔒 Аккаунт уже используется';
            heading.style.cssText = 'font-size:23px;margin:0 0 14px;font-weight:900;';
            var paragraph = document.createElement('p');
            paragraph.id = 'mbAccountSessionLockMessage';
            paragraph.style.cssText = 'font-size:15px;line-height:1.6;color:#d9d9e6;margin:0 0 22px;';
            var retry = document.createElement('button');
            retry.type = 'button';
            retry.textContent = 'Проверить снова';
            retry.style.cssText = 'padding:12px 22px;border:0;border-radius:30px;background:linear-gradient(135deg,#f5af19,#f12711);color:white;font-weight:900;font-size:15px;cursor:pointer;';
            retry.addEventListener('click', async function () {
                retry.disabled = true;
                retry.textContent = 'Проверяем…';
                try { await queueAuthForCurrentSlot(getCurrentGameSlot()); }
                catch (_error) {}
                retry.disabled = false;
                retry.textContent = 'Проверить снова';
            });
            card.appendChild(heading);
            card.appendChild(paragraph);
            card.appendChild(retry);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
            accountSessionLockOverlay = overlay;
        }
        var messageNode = byId('mbAccountSessionLockMessage');
        if (messageNode) messageNode.textContent = message || 'Этот аккаунт уже активен в другой игре. Закрой прежнюю сессию и повтори проверку.';
        try {
            window.dispatchEvent(new CustomEvent('mb:account-session-blocked', { detail: { message: message || '' } }));
        } catch (_error) {}
    }

    async function releaseActiveAccountSession(userId) {
        if (!userId || activeAccountSessionUserId !== userId || !activeAccountSessionId || !activeAccountAuthSessionId || !db) return false;
        var client = db;
        var sessionId = activeAccountSessionId;
        stopActiveAccountSessionHeartbeat();
        try {
            var result = await client.rpc('mb_release_active_account_session', { p_session_id: sessionId });
            if (result.error) console.warn('[MB account session] Release failed:', result.error.message);
            return !result.error && result.data === true;
        } catch (error) {
            console.warn('[MB account session] Release failed:', error && error.message ? error.message : error);
            return false;
        } finally {
            if (activeAccountSessionUserId === userId && activeAccountSessionId === sessionId) {
                activeAccountSessionUserId = null;
                activeAccountSessionId = null;
                activeAccountAuthSessionId = null;
            }
        }
    }

    function startActiveAccountSessionHeartbeat(userId, clientSessionId, authSessionId) {
        stopActiveAccountSessionHeartbeat();
        activeAccountSessionHeartbeatTimer = window.setInterval(async function () {
            if (!db || !currentUser || currentUser.id !== userId || activeAccountSessionUserId !== userId || accountSessionBlocked) return;
            var client = db;
            try {
                var result = await client.rpc('mb_heartbeat_active_account_session', { p_session_id: clientSessionId });
                if (db !== client || !currentUser || currentUser.id !== userId) return;
                if (result.error) {
                    console.warn('[MB account session] Heartbeat failed:', result.error.message);
                    return;
                }
                if (!result.data || result.data.ok !== true) {
                    stopActiveAccountSessionHeartbeat();
                    activeAccountSessionUserId = null;
                    activeAccountSessionId = null;
                    activeAccountAuthSessionId = null;
                    // Keep the authenticated user. A lost game-session lease is not
                    // a sign-out; show the lock and let the player retry the check.
                    currentClan = null;
                    currentProfile = null;
                    showAuthState();
                    showAccountSessionLock('Игровая сессия потеряла блокировку. Аккаунт остаётся подключённым. Нажми «Проверить снова», чтобы восстановить сессию.');
                    notifyCloudSaveAuthChanged();
                }
            } catch (error) {
                console.warn('[MB account session] Heartbeat error:', error && error.message ? error.message : error);
            }
        }, 20000);
    }

    async function claimActiveAccountSession(user) {
        var client = db;
        if (!client || !user || !user.id) return 'Не удалось проверить активную сессию аккаунта.';
        var clientSessionId = getActiveAccountClientSessionId();
        var authSessionId;
        try { authSessionId = await getAuthSessionId(client); }
        catch (error) {
            console.warn('[MB account session] Cannot read auth session:', error && error.message ? error.message : error);
            return 'Не удалось проверить сессию аккаунта. Проверь интернет и повтори вход.';
        }
        if (db !== client) return 'Слот изменился во время проверки аккаунта. Повтори вход.';
        if (!authSessionId) return 'Не удалось получить идентификатор сессии аккаунта. Перезайди в игру.';
        var result;
        try {
            result = await client.rpc('mb_claim_active_account_session', {
                p_session_id: clientSessionId,
                p_auth_session_id: authSessionId,
                p_device_id: getDeviceBindingId()
            });
        } catch (error) {
            console.warn('[MB account session] Claim failed:', error && error.message ? error.message : error);
            return 'Не удалось проверить активную сессию аккаунта. Проверь интернет и повтори вход.';
        }
        if (db !== client) return 'Слот изменился во время проверки аккаунта. Повтори вход.';
        if (result.error) {
            console.warn('[MB account session] Claim RPC failed:', result.error.message);
            return 'Не удалось проверить активную сессию аккаунта. Проверь миграцию Supabase и повтори вход.';
        }
        var verdict = result.data;
        if (!verdict || verdict.ok !== true) {
            var message = verdict && verdict.message ? verdict.message : 'Этот аккаунт нельзя использовать в текущей сессии.';
            if (verdict && verdict.code === 'active_session_in_use') {
                accountSessionBlocked = true;
                showAccountSessionLock(message);
            }
            return message;
        }
        activeAccountSessionId = clientSessionId;
        activeAccountAuthSessionId = authSessionId;
        activeAccountSessionUserId = user.id;
        clearAccountSessionLock();
        startActiveAccountSessionHeartbeat(user.id, clientSessionId, authSessionId);
        return null;
    }

    async function accountSlotBindingError(user, slot) {
        if (!user || !user.id) return null;
        var transferNewAccount = isPendingNewAccountTransfer(user.id);
        try {
            if (!transferNewAccount && typeof window.mbCloudBindingProblem === 'function') {
                var localProblem = window.mbCloudBindingProblem(user.id, slot);
                if (localProblem) return localProblem;
            }
            if (!db || typeof db.rpc !== 'function') {
                return 'Не удалось проверить уникальность аккаунта. Проверь соединение и попробуй снова.';
            }
            var result = await db.rpc('claim_multiverse_slot_account', {
                p_device_id: getDeviceBindingId(),
                p_slot_index: slot,
                p_transfer_existing_slot: transferNewAccount
            });
            if (result.error) {
                console.error('Slot account binding check failed:', result.error);
                return 'Не удалось проверить привязку аккаунта к слоту на сервере. Проверь интернет и попробуй снова.';
            }
            var verdict = result.data;
            if (!verdict || verdict.ok !== true) {
                return verdict && verdict.message ? verdict.message : 'Этот аккаунт нельзя использовать в выбранном слоте.';
            }
            var activeSessionError = await claimActiveAccountSession(user);
            if (activeSessionError) return activeSessionError;
            if (transferNewAccount && typeof window.mbPrepareNewAccountSlotTransfer === 'function') {
                var prepared = window.mbPrepareNewAccountSlotTransfer(user.id, slot);
                if (prepared !== true) {
                    return 'Аккаунт создан, но локальный слот не удалось подготовить к переносу. Прогресс не перезаписан; обнови игру и попробуй снова.';
                }
            }
            return null;
        } catch (error) {
            console.error('Slot account binding check failed:', error);
            return 'Не удалось проверить привязку аккаунта к слоту. Попробуй ещё раз при стабильном интернете.';
        }
    }

    async function refreshModeratorAccess(client) {
        var userId = currentUser && currentUser.id;
        var isModerator = false;
        if (!client || !userId || accountSessionBlocked || activeAccountSessionUserId !== userId) {
            if (typeof window.MBSetModeratorAccessFromServer === 'function') window.MBSetModeratorAccessFromServer(false);
            return false;
        }
        try {
            var result = await client.functions.invoke('moderator-access');
            if (result.error) throw result.error;
            isModerator = !!(result.data && result.data.isModerator === true);
        } catch (error) {
            console.warn('[MB moderator] Server access check failed; moderator mode remains disabled:', error && error.message ? error.message : error);
        }
        if (db === client && currentUser && currentUser.id === userId && activeAuthSlot === getCurrentGameSlot()) {
            if (typeof window.MBSetModeratorAccessFromServer === 'function') {
                window.MBSetModeratorAccessFromServer(isModerator);
            }
        }
        return isModerator;
    }

    async function rejectAccountForSlot(client, slot, message) {
        // A failed account/lease check is not proof that the credentials are invalid.
        // Keep Supabase signed in; transient RPC errors must never force a logout.
        currentClan = null;
        currentProfile = null;
        if (typeof window.MBSetModeratorAccessFromServer === 'function') window.MBSetModeratorAccessFromServer(false);
        showAuthState();
        setNotice(message + ' Аккаунт не отключён. Проверь соединение и повтори проверку.', 'warning');
        if (accountSessionBlocked) {
            showAccountSessionLock(message);
        }
    }

    function queueAuthForCurrentSlot(slot) {
        var requestedSlot = Number.isInteger(Number(slot)) ? Number(slot) : getCurrentGameSlot();
        authSwitchChain = authSwitchChain.then(async function () {
            if (requestedSlot !== getCurrentGameSlot()) return;
            if (activeAuthSlot === requestedSlot && db) {
                var currentClient = db;
                var currentSessionResult = await currentClient.auth.getSession();
                if (requestedSlot !== getCurrentGameSlot() || db !== currentClient) return;
                if (currentSessionResult.error) throw currentSessionResult.error;
                currentUser = currentSessionResult.data.session ? currentSessionResult.data.session.user : null;
                var currentBindingError = await accountSlotBindingError(currentUser, requestedSlot);
                if (currentBindingError) {
                    await rejectAccountForSlot(currentClient, requestedSlot, currentBindingError);
                    return;
                }
                currentClan = null;
                currentProfile = null;
                showAuthState();
                await refreshAll();
                if (requestedSlot !== getCurrentGameSlot() || db !== currentClient) return;
                await refreshModeratorAccess(currentClient);
                await touchCurrentPresence();
                notifyCloudSaveAuthChanged();
                return;
            }
            if (authStateSubscription) {
                try { authStateSubscription.unsubscribe(); } catch (_error) {}
                authStateSubscription = null;
            }
            await closeClanChat();
            await closeGiftRealtime();
            currentUser = null;
            currentClan = null;
            currentProfile = null;
            if (typeof window.MBSetModeratorAccessFromServer === 'function') window.MBSetModeratorAccessFromServer(false);
            db = null;
            activeAuthSlot = requestedSlot;
            showAuthState();

            var config = window.MB_SUPABASE_CONFIG || {};
            var client = window.supabase.createClient(config.url, config.anonKey, {
                auth: {
                    storageKey: authStorageKeyForSlot(requestedSlot),
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            db = client;
            var sessionResult = await client.auth.getSession();
            if (requestedSlot !== getCurrentGameSlot() || db !== client) return;
            if (sessionResult.error) throw sessionResult.error;
            currentUser = sessionResult.data.session ? sessionResult.data.session.user : null;
            updateUniqueBossFightAnalyticsVisibility();
            var restoredBindingError = await accountSlotBindingError(currentUser, requestedSlot);
            if (restoredBindingError) {
                await rejectAccountForSlot(client, requestedSlot, restoredBindingError);
                return;
            }
            showAuthState();
            await refreshAll();
            if (requestedSlot !== getCurrentGameSlot() || db !== client) return;
            await refreshModeratorAccess(client);
            await touchCurrentPresence();
            notifyCloudSaveAuthChanged();
            var subscriptionResult = client.auth.onAuthStateChange(function (_event, session) {
                if (db !== client || activeAuthSlot !== requestedSlot || requestedSlot !== getCurrentGameSlot()) return;
                currentUser = session ? session.user : null;
                updateUniqueBossFightAnalyticsVisibility();
                var eventUser = currentUser;
                window.setTimeout(async function () {
                    if (db !== client || activeAuthSlot !== requestedSlot || requestedSlot !== getCurrentGameSlot()) return;
                    var authBindingError = await accountSlotBindingError(eventUser, requestedSlot);
                    if (db !== client || activeAuthSlot !== requestedSlot || requestedSlot !== getCurrentGameSlot()) return;
                    if (authBindingError) {
                        currentUser = null;
                        currentClan = null;
                        currentProfile = null;
                        if (typeof window.MBSetModeratorAccessFromServer === 'function') window.MBSetModeratorAccessFromServer(false);
                        showAuthState();
                        setNotice(authBindingError, 'warning');
                        notifyCloudSaveAuthChanged();
                        client.auth.signOut().catch(function () {});
                        return;
                    }
                    showAuthState();
                    await refreshAll();
                    await refreshModeratorAccess(client);
                    await touchCurrentPresence();
                    notifyCloudSaveAuthChanged();
                }, 0);
            });
            authStateSubscription = subscriptionResult && subscriptionResult.data ? subscriptionResult.data.subscription : null;
            setNotice(currentUser
                ? 'Аккаунт слота ' + (requestedSlot + 1) + ' подключён.'
                : 'Войди или зарегистрируй аккаунт для слота ' + (requestedSlot + 1) + '.', 'success');
        }).catch(function (error) {
            setNotice(friendlyError(error), 'error');
        });
        return authSwitchChain;
    }

    async function init() {
        bindEvents();
        checkAchievementTitleUnlocks();
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
        migrateLegacyAuthSession();
        window.addEventListener('mb:slot-changing', function () {
            var previousUserId = currentUser && currentUser.id;
            if (previousUserId) {
                var finalSync = typeof window.mbFlushCloudSave === 'function' ? window.mbFlushCloudSave() : Promise.resolve(true);
                Promise.resolve(finalSync).catch(function (error) {
                    console.warn('[MB cloud] Sync before slot switch failed:', error && error.message ? error.message : error);
                }).finally(function () { releaseActiveAccountSession(previousUserId); });
            }
            currentUser = null;
            currentClan = null;
            currentProfile = null;
            if (typeof window.MBSetModeratorAccessFromServer === 'function') window.MBSetModeratorAccessFromServer(false);
            ownStatsData = null;
            publicStatsData = null;
            ownStatsMode = 'rebirth';
            publicStatsMode = 'rebirth';
            notifyCloudSaveAuthChanged();
            showAuthState();
        });
        window.addEventListener('mb:slot-ready', function () {
            checkAchievementTitleUnlocks();
            queueAuthForCurrentSlot(getCurrentGameSlot());
        });
        await queueAuthForCurrentSlot(getCurrentGameSlot());
        if (presenceHeartbeatTimer === null) {
            presenceHeartbeatTimer = window.setInterval(function () {
                if (!db || !currentUser) return;
                var friendsPane = document.querySelector('[data-online-pane="friends"].active');
                if (friendsPane) {
                    refreshFriendsHub();
                } else {
                    touchCurrentPresence();
                }
                if (document.visibilityState === 'visible') {
                    var analyticsIdle = Date.now() - gameAnalyticsLastActivityAt >= GAME_ANALYTICS_IDLE_LIMIT_MS;
                    trackGameAnalytics(analyticsIdle);
                }
            }, 45000);
        }
    }

    ['pointerdown', 'keydown', 'touchstart', 'wheel', 'mousemove'].forEach(function (eventName) {
        window.addEventListener(eventName, noteGameAnalyticsActivity, { passive: true, capture: true });
    });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') trackGameAnalytics(true);
        else {
            gameAnalyticsLastActivityAt = Date.now();
            touchCurrentPresence();
            trackGameAnalytics(false);
        }
    });
    window.addEventListener('pagehide', function () {
        trackGameAnalytics(true);
        var closingUserId = currentUser && currentUser.id;
        if (!closingUserId) return;

        // Start final cloud sync, but releasing the account lock must not wait
        // for a request to finish after this document has been closed.
        if (typeof window.mbFlushCloudSave === 'function') {
            window.mbFlushCloudSave().catch(function (error) {
                console.warn('[MB cloud] Final sync on exit failed:', error && error.message ? error.message : error);
            });
        }

        if (activeAccountSessionUserId !== closingUserId ||
            !activeAccountSessionId || !activeAccountAuthSessionId) return;

        var sessionId = activeAccountSessionId;
        var config = window.MB_SUPABASE_CONFIG || {};
        var storedSession = null;
        try {
            storedSession = JSON.parse(localStorage.getItem(authStorageKeyForSlot(getCurrentGameSlot())) || 'null');
        } catch (_error) {}
        var accessToken = storedSession && storedSession.access_token;
        var url = typeof config.url === 'string' ? config.url.replace(/\/+$/, '') : '';
        if (!url || !config.anonKey || !accessToken || typeof window.fetch !== 'function') {
            releaseActiveAccountSession(closingUserId);
            return;
        }

        var releaseRequest;
        try {
            releaseRequest = window.fetch(url + '/rest/v1/rpc/mb_release_active_account_session', {
                method: 'POST',
                keepalive: true,
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ p_session_id: sessionId })
            });
        } catch (error) {
            console.warn('[MB account session] Unload release could not start:', error && error.message ? error.message : error);
            releaseActiveAccountSession(closingUserId);
            return;
        }

        stopActiveAccountSessionHeartbeat();
        activeAccountSessionUserId = null;
        activeAccountSessionId = null;
        activeAccountAuthSessionId = null;
        Promise.resolve(releaseRequest).catch(function (error) {
            console.warn('[MB account session] Unload release failed; server lease will expire:', error && error.message ? error.message : error);
        });
    });

    if (document.readyState === 'loading') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init, { once: true });
        } else {
            // This module may be loaded asynchronously after the core game starts.
            init();
        }
    } else {
        init();
    }

    window.MBCheckAchievementTitleUnlocks = checkAchievementTitleUnlocks;
    window.MBClans = {
        refresh: refreshAll,
        syncGameStats: syncGameStats,
        syncCardInventory: processClanCardInbox,
        refreshCardExchange: refreshClanCardExchange,
        isConnected: function () { return !!db; },
        getCurrentUserId: function () {
            return currentUser && !accountSessionBlocked && activeAccountSessionUserId === currentUser.id
                ? currentUser.id : null;
        },
        getArenaContext: function () {
            return {
                client: db,
                user: currentUser,
                profile: currentProfile,
                gameSlot: getCurrentGameSlot()
            };
        },
        getCloudSave: getCloudSave,
        writeCloudSave: writeCloudSave,
        setCloudSaveStatus: setCloudSaveStatus
    };
})();
