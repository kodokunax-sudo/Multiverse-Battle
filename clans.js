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
    var authStateSubscription = null;
    var authSwitchChain = Promise.resolve();
    var profileShowcaseSelection = [];
    var profileShowcaseSavedCards = [];
    var currentFriends = [];
    var currentFriendRequests = [];
    var currentClanInvites = [];
    var currentFriendSearchResults = [];
    var publicProfileUserId = null;
    var presenceHeartbeatTimer = null;
    var ownStatsData = null;
    var publicStatsData = null;
    var ownStatsMode = 'rebirth';
    var publicStatsMode = 'rebirth';
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
        { id: 'wave_100', icon: '🌊', label: 'Покоритель волн', description: 'Достичь 100-й волны', unlocked: function (s) { return safeCount(s.highest_wave) >= 100; } },
        { id: 'boss_hunter', icon: '👹', label: 'Убийца боссов', description: 'Победить 10 боссов', unlocked: function (s) { return safeCount(s.bosses_defeated) >= 10; } },
        { id: 'collector', icon: '🎴', label: 'Коллекционер', description: 'Получить 50 карт', unlocked: function (s) { return safeCount(s.cards_collected) >= 50; } },
        { id: 'champion', icon: '🏆', label: 'Чемпион', description: 'Одержать 25 побед', unlocked: function (s) { return safeCount(s.total_wins) >= 25; } },
        { id: 'reborn', icon: '♻️', label: 'Перерождённый', description: 'Совершить 5 перерождений', unlocked: function (s) { return safeCount(s.rebirth_count, 1000000) >= 5; } },
        { id: 'multiverse_legend', icon: '🌌', label: 'Легенда мультивселенной', description: 'Достичь 1000-й волны и победить 15 боссов', unlocked: function (s) { return safeCount(s.highest_wave) >= 1000 && safeCount(s.bosses_defeated) >= 15; } }
    ];

    function titleById(id) {
        return ACHIEVEMENT_TITLES.find(function (title) { return title.id === id; }) || null;
    }
    function isTitleUnlocked(id, stats) {
        if (!id) return true;
        var title = titleById(id);
        return !!title && title.unlocked(stats || {});
    }
    function titleLabel(id) {
        var title = titleById(id);
        return title ? title.icon + ' ' + title.label : '';
    }
    function renderAchievementBadges(containerId, stats, includeLocked) {
        var container = byId(containerId);
        if (!container) return;
        container.replaceChildren();
        var unlockedCount = 0;
        ACHIEVEMENT_TITLES.forEach(function (title) {
            var unlocked = title.unlocked(stats || {});
            if (unlocked) unlockedCount++;
            if (!unlocked && !includeLocked) return;
            var badge = node('div', 'achievement-badge' + (unlocked ? '' : ' locked'));
            badge.title = unlocked ? title.description : 'Условие: ' + title.description;
            badge.appendChild(node('span', '', unlocked ? title.icon : '🔒'));
            badge.appendChild(node('span', '', unlocked ? title.label : title.label + ' · закрыто'));
            container.appendChild(badge);
        });
        if (!unlockedCount && !includeLocked) container.appendChild(node('p', 'clan-muted', 'Значки пока не открыты — выполняй испытания, чтобы получить первый.'));
    }
    function renderTitlePicker(stats, selectedId) {
        var select = byId('clanProfileTitle');
        if (select) {
            select.replaceChildren();
            select.appendChild(new Option('Без титула', ''));
            ACHIEVEMENT_TITLES.forEach(function (title) {
                if (title.unlocked(stats || {})) select.appendChild(new Option(title.icon + ' ' + title.label, title.id));
            });
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
                .select('id, display_name, friend_code, avatar_name, description, active_title, showcase_cards, current_rebirth_stats, lifetime_stats, rebirth_history, total_wins, highest_wave, rebirth_count, cards_collected, bosses_defeated, total_clicks')
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
            .select('id, display_name, friend_code, avatar_name, description, active_title, showcase_cards, current_rebirth_stats, lifetime_stats, rebirth_history, created_at, updated_at, total_wins, highest_wave, rebirth_count, cards_collected, bosses_defeated, total_clicks')
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
                .select('id, display_name, friend_code, avatar_name, description, active_title, showcase_cards, current_rebirth_stats, lifetime_stats, rebirth_history, total_wins, highest_wave, rebirth_count, cards_collected, bosses_defeated, total_clicks')
                .eq('id', userId).maybeSingle();
            if (result.error) throw result.error;
            if (!result.data) throw new Error('profile_not_found');
            byId('clanPublicName').textContent = result.data.display_name || 'Игрок';
            byId('clanPublicDescription').textContent = result.data.description || 'Игрок пока не добавил описание.';
            byId('clanPublicAvatar').src = avatarPathForName(result.data.avatar_name) || 'images/Super_Dio_2.gif';
            byId('clanPublicFriendCode').textContent = result.data.friend_code ? 'MB-' + result.data.friend_code : '—';
            showPublicTitle(result.data);
            renderPublicShowcase('clanPublicShowcase', result.data.showcase_cards);
            publicStatsData = result.data;
            renderExpandedStats('public', publicStatsData, publicStatsMode);
            renderAchievementBadges('clanPublicBadges', result.data, false);
            updatePublicFriendAction();
        } catch (error) {
            byId('clanPublicName').textContent = 'Не удалось открыть профиль';
            byId('clanPublicDescription').textContent = friendlyError(error);
            if (friendAction) friendAction.disabled = true;
        }
    }

    function hidePublicProfile() {
        publicProfileUserId = null;
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
                options: { data: { display_name: displayName.slice(0, 24) } }
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
        if (db && currentUser) db.rpc('mb_touch_presence').then(function (result) {
            if (result.error) console.warn('[MB friends] Presence update:', result.error.message);
        }).catch(function () {});
        try {
            window.dispatchEvent(new CustomEvent('mb:auth-changed', {
                detail: {
                    userId: currentUser ? currentUser.id : null,
                    email: currentUser ? currentUser.email : null,
                    isNewAccount: isPendingNewAccountTransfer(currentUser ? currentUser.id : null)
                }
            }));
        } catch (_error) {}
    }

    async function getCloudSave() {
        if (!db || !currentUser) throw new Error('auth_required');
        var result = await db.from('player_cloud_saves')
            .select('save_data, updated_at, revision')
            .eq('user_id', currentUser.id)
            .maybeSingle();
        if (result.error) throw result.error;
        return result.data || null;
    }

    async function writeCloudSave(saveData, expectedUpdatedAt) {
        if (!db || !currentUser) throw new Error('auth_required');
        if (!saveData || typeof saveData !== 'object' || Array.isArray(saveData)) throw new Error('cloud_save_invalid');
        var result = await db.rpc('write_player_cloud_save', {
            p_save_data: saveData,
            p_expected_updated_at: expectedUpdatedAt || null
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
                if (Number.isInteger(mapped) && mapped >= 0 && mapped <= 2) {
                    targetSlot = mapped;
                } else {
                    for (var slotIndex = 0; slotIndex < 3; slotIndex++) {
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

    async function rejectAccountForSlot(client, slot, message) {
        currentUser = null;
        currentClan = null;
        currentProfile = null;
        showAuthState();
        setNotice(message, 'warning');
        notifyCloudSaveAuthChanged();
        try { await client.auth.signOut(); } catch (_error) {}
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
            var restoredBindingError = await accountSlotBindingError(currentUser, requestedSlot);
            if (restoredBindingError) {
                await rejectAccountForSlot(client, requestedSlot, restoredBindingError);
                return;
            }
            showAuthState();
            await refreshAll();
            if (requestedSlot !== getCurrentGameSlot() || db !== client) return;
            notifyCloudSaveAuthChanged();
            var subscriptionResult = client.auth.onAuthStateChange(function (_event, session) {
                if (db !== client || activeAuthSlot !== requestedSlot || requestedSlot !== getCurrentGameSlot()) return;
                currentUser = session ? session.user : null;
                var eventUser = currentUser;
                window.setTimeout(async function () {
                    if (db !== client || activeAuthSlot !== requestedSlot || requestedSlot !== getCurrentGameSlot()) return;
                    var authBindingError = await accountSlotBindingError(eventUser, requestedSlot);
                    if (db !== client || activeAuthSlot !== requestedSlot || requestedSlot !== getCurrentGameSlot()) return;
                    if (authBindingError) {
                        currentUser = null;
                        currentClan = null;
                        currentProfile = null;
                        showAuthState();
                        setNotice(authBindingError, 'warning');
                        notifyCloudSaveAuthChanged();
                        client.auth.signOut().catch(function () {});
                        return;
                    }
                    showAuthState();
                    await refreshAll();
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
            currentUser = null;
            currentClan = null;
            currentProfile = null;
            ownStatsData = null;
            publicStatsData = null;
            ownStatsMode = 'rebirth';
            publicStatsMode = 'rebirth';
            notifyCloudSaveAuthChanged();
            showAuthState();
        });
        window.addEventListener('mb:slot-ready', function () {
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
                    db.rpc('mb_touch_presence').then(function (result) {
                        if (result.error) console.warn('[MB friends] Presence update:', result.error.message);
                    }).catch(function () {});
                }
            }, 45000);
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
        isConnected: function () { return !!db; },
        getCurrentUserId: function () { return currentUser ? currentUser.id : null; },
        getCloudSave: getCloudSave,
        writeCloudSave: writeCloudSave,
        setCloudSaveStatus: setCloudSaveStatus
    };
})();
