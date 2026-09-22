// ============================================================
// HELP SYSTEM v1.0 — Встроенная справка по всем механикам
// ============================================================
// ПОДКЛЮЧАТЬ ПОСЛЕ ui.js (в самом конце)
// Автоматически:
//   - Добавляет вкладку "❓ Справка" в раздел "Прочее"
//   - Добавляет кнопки "?" к ключевым секциям
// ============================================================

(function() {
    'use strict';

    if (window._helpSystemLoaded) {
        console.warn("[HELP] Уже загружено, игнорирую повтор.");
        return;
    }
    window._helpSystemLoaded = true;

    // ========== ДАННЫЕ СПРАВКИ ==========
    const HELP_SECTIONS = [
        // ========== 1. КЛИКЕР ==========
        {
            id: "clicker",
            icon: "👆",
            title: "Основы: Кликер",
            short: "Как бить врагов, комбо, криты",
            content: `
<b>🎯 Как играть:</b> Нажимай на оранжевую кнопку <b>💥 НАЖМИ ДЛЯ АТАКИ! 💥</b> — это наносит урон врагу. Каждый клик = 1 удар.

<b>⚡ Комбо:</b> Если кликать быстро (интервал < 0.5 сек) — растёт счётчик комбо. Даёт множитель урона:

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#0f0;line-height:1.6;">
[СЕРИЯ КЛИКОВ — ПРИМЕР]<br>
▸ Клик 1-9:    x1 урона     [combo 1-9]<br>
▸ Клик 10-24:  x2 урона ⚡  [combo x2]<br>
▸ Клик 25-49:  x3 урона ⚡⚡ [combo x3]<br>
▸ Клик 50+:    x5 урона 🔥  [combo x5]
</div>

<b>💥 Криты:</b> Улучшай <b>⚡ Крит. шанс</b> в прокачке (вкладка Лавка → Прокачка). Базово 0%, с улучшениями растёт.

<b>😫 Усталость:</b> За каждый клик растёт усталость. Чем выше усталость — тем меньше урон и HP. При 100% ты почти не бьёшь.

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#ffaa00;line-height:1.6;">
[УСТАЛОСТЬ — ПРИМЕР]<br>
Усталость 0%:   💪 100% урона<br>
Усталость 50%:  💪 50% урона<br>
Усталость 90%:  💪 10% урона ⚠️<br>
Усталость 100%: 💪 0% урона  💀
</div>

<b>💤 Отдых:</b> Кнопка <b>💤 Отдых</b> в бою снижает усталость на 40% за звёзды. Цена растёт с уровнем усталости.

<b>👆 Быстрые клики = быстрее усталость!</b> Если кликать слишком часто (интервал < 0.1 сек) — усталость растёт в 3 раза быстрее.
            `
        },
        // ========== 2. КАРТЫ ==========
        {
            id: "cards",
            icon: "🃏",
            title: "Карты и редкости",
            short: "Что такое редкости, откуда брать",
            content: `
<b>🃏 Карты:</b> Твои бойцы. У каждой карты есть:
• <b>💪 Урон</b> — сколько бьёт
• <b>❤️ HP</b> — сколько живёт
• <b>⚡ Скорость</b> — скорость сердечка на арене
• <b>✨ Способность</b> (с мастерства 4)
• <b>🌀 Статус</b> (с мастерства 3)
• <b>⚡ СУПЕР</b> (с мастерства 5)

<b>🏆 Редкости (от слабых к сильным):</b>

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.8;">
⚪ Обычная       — база, слабые<br>
🔵 Редкая         — чуть сильнее<br>
🟢 Сверх редкая   — середина<br>
🟣 Эпик           — сильные<br>
🔴 Мифическая     — очень сильные<br>
🟡 Легендарная    — топовые<br>
💎 Секретная      — имба, с SUPER<br>
🧬 Эволюционная   — только крафт<br>
👑 Босс           — с пощады боссов<br>
🥚 Пасхалка       — секретные
</div>

<b>📚 Где брать карты:</b>
• <b>🎴 Получить карту (2ч)</b> — в коллекции, бесплатно каждые 2 часа
• <b>🎰 Гача</b> — в лавке за звёзды
• <b>👑 Боссы</b> — 50% шанс выпадения с боссов
• <b>🎁 Пасс</b> — награды за этапы
• <b>📅 Ежедневки</b> — за вход
• <b>🎁 Промокоды</b>
• <b>👑 Пощада боссов</b> — даёт босс-карту

<b>🔍 Поиск и сортировка:</b> В коллекции есть поиск по имени, фильтр по редкости и сортировка (по урону, HP, редкости и т.д.).
            `
        },
        // ========== 3. ОТРЯД ==========
        {
            id: "team",
            icon: "⚔️",
            title: "Отряд (6 карт)",
            short: "Как собрать команду и пресеты",
            content: `
<b>⚔️ Отряд:</b> До 6 карт. Их суммарный урон/HP влияет на твой урон в бою.

<b>👑 Главная карта:</b> Та, что стоит 1-й. Её <b>⚡ скорость</b> определяет скорость сердечка на арене Undertale.

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#0ff;line-height:1.6;">
[ПРИМЕР: ГЛАВНАЯ КАРТА]<br>
▸ Сайтама (скорость 4.0) — сердце 🚀 быстрое<br>
▸ Ездок  (скорость 0.3) — сердце 🐢 медленное<br>
▸ Киллуа (скорость 1.3) — сердце ⚡ среднее
</div>

<b>Как выбрать главную:</b> В списке отряда нажми <b>👑</b> рядом с картой.

<b>💾 Пресеты отрядов:</b> Сохраняй разные составы (до 5 штук):
• <b>💾</b> — сохранить текущий отряд
• <b>📥</b> — загрузить пресет
• <b>🗑️</b> — удалить
• Клик по названию — переименовать

<b>💤 АФК-отряд:</b> Отдельные 6 карт, которые фармят, пока ты в оффлайне. Работает даже когда игра закрыта (2 часа максимум).

<b>👆 Как добавить карту:</b>
• В коллекции нажми карту → попадёт в отряд
• Или нажми <b>⚔️</b> на карточке
• Или <b>💤</b> — для АФК
            `
        },
        // ========== 4. МАСТЕРСТВО ==========
        {
            id: "mastery",
            icon: "⭐",
            title: "Мастерство карт",
            short: "Прокачка карт от 1 до 5 звёзд",
            content: `
<b>⭐ Мастерство:</b> Каждая карта имеет уровень 1-5. Чем выше — тем сильнее карта.

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#ffd700;line-height:1.8;">
⭐ Уровень 1 (☆☆☆☆☆): 60% характеристик<br>
⭐⭐ Уровень 2 (★☆☆☆☆): 75% (+15%)<br>
⭐⭐⭐ Уровень 3 (★★☆☆☆): 85% (+10%) + статус-эффект<br>
⭐⭐⭐⭐ Уровень 4 (★★★☆☆): 95% (+10%) + способность<br>
⭐⭐⭐⭐⭐ Уровень 5 (★★★★★): 100% (+5%) + СУПЕР ⚡
</div>

<b>📊 Как качать:</b>
1. <b>Опыт карты</b> — копится за бои, где карта в отряде
2. <b>⭐ Звёзды</b> — цена зависит от редкости
3. <b>⚡ Сила (Power Points)</b> — отдельная валюта

<b>Пример для эпик-карты:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#0f0;line-height:1.6;">
Ур 1→2: 100⭐ + 2⚡ + 800 опыта<br>
Ур 2→3: 800⭐ + 50⚡ + 1600 опыта<br>
Ур 3→4: 1600⭐ + 200⚡ + 3200 опыта<br>
Ур 4→5: 3200⭐ + 800⚡ + 6400 опыта
</div>

<b>⚡ Сила (Power Points):</b> Даётся за победы над волнами (чем выше волна, тем больше) и за боссов (+50 за каждого).

<b>📖 Как открыть мастерство:</b> В коллекции нажми <b>⭐</b> на карточке карты.
            `
        },
        // ========== 5. СУПЕР-СПОСОБНОСТИ ==========
        {
            id: "supers",
            icon: "⚡",
            title: "СУПЕР-способности",
            short: "Ульты на арене Undertale",
            content: `
<b>⚡ СУПЕР:</b> Открывается только на <b>мастерстве 5</b> (★★★★★) у секретных и особых карт.

<b>🎮 Как использовать на арене:</b>
1. Открой бой с боссом (кнопка <b>⚔️ СРАЗИТЬСЯ С БОССОМ!</b>)
2. Когда СУПЕР готов — появится кнопка <b>⚡ СУПЕР</b> внизу
3. Нажми её — активируешь ульту

<b>📱 На телефоне:</b> Есть 3 способа активации (настройки → Управление SUPER):
• <b>Кнопка</b> — обычная кнопка
• <b>Двойное нажатие</b> — тапни 2 раза по арене
• <b>Свайп вверх</b> — свайп от сердца

<b>⏱️ Перезарядка:</b> У каждой СУПЕР свой кулдаун. После использования серый, потом снова доступен.

<b>🔥 Примеры СУПЕР:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#ff6600;line-height:1.8;">
<b>Сайтама — «ОБЫЧНЫЙ УДАР»</b><br>
▸ Красный кулак летит вверх<br>
▸ Сметает все атаки<br>
▸ 1% ваншот босса!<br><br>
<b>Луффи Ника — «ОСВОБОЖДЕНИЕ»</b><br>
▸ Сердце становится огромным<br>
▸ Урон x2, но получаешь больше<br><br>
<b>Зено — «СТИРАНИЕ»</b><br>
▸ Уничтожает ВСЕ атаки<br>
▸ -10% HP боссу
</div>

<b>⚙️ Авто-СУПЕР:</b> В настройках можно включить авто-использование, когда готов.
            `
        },
        // ========== 6. АРЕНА UNDERTALE ==========
        {
            id: "arena",
            icon: "🎮",
            title: "Арена Undertale",
            short: "Битва с боссами уклонением",
            content: `
<b>🎮 Что это:</b> Особая битва с боссами (50, 100, 150... волны). Не кликер, а мини-игра как в Undertale!

<b>🕹️ Управление:</b>
• <b>Клавиатура:</b> WASD или стрелки — двигать ❤️
• <b>Телефон:</b> Тапай по экрану — сердце следует за пальцем

<b>⚔️ Фазы боя:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#0ff;line-height:1.8;">
▸ <b>УКЛОНЕНИЕ (10-16 сек)</b><br>
  Босс атакует — уворачивайся ❤️<br>
  Вверху имя атаки и таймер<br><br>
▸ <b>АТАКА (2 сек)</b><br>
  На экране появляются 🎯 цели<br>
  Кликай по ним МАКСИМАЛЬНО быстро<br><br>
▸ <b>УРОН</b><br>
  Зависит от % попаданий:<br>
  100% целей → x2.5 урона 🔥<br>
  80-99% → x1.8 ⚡<br>
  60-79% → x1.3 ✨<br>
  40-59% → x1.0 👍<br>
  20-39% → x0.6 💤<br>
  0-19%  → x0.2 🥱
</div>

<b>💥 Твоё HP:</b> Считается от карт в отряде + улучшений. Показано сверху.

<b>☠️ Karma:</b> Урон от ядовитых атак накапливается и постепенно тикает (как в Undertale).

<b>🟢 Хил-блоки:</b> Зелёные кружки — подбери ❤️, восстановишь HP.

<b>💗 Розовые:</b> Отбрасывают сердце. Не наносят урона, но могут вкинуть в шипы!

<b>⚠️ Шипы (тип 4):</b> Не касайся стенок арены — получишь урон.

<b>🎯 Совет:</b> Сначала ВСЕГДА уклоняйся, потом бей. Лучше попасть 60%, чем 100% урона от атаки.
            `
        },
        // ========== 7. ОСОБЫЕ БОССЫ ==========
        {
            id: "specialBosses",
            icon: "👑",
            title: "Особые боссы",
            short: "Живой Камень и Путеводная Звезда",
            content: `
<b>👑 Живой Камень (волна 200):</b> Особый QTE-босс.

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#8B7355;line-height:1.8;">
<b>📜 СЦЕНАРИЙ:</b><br>
1. Диалог: "Попробуй меня пробить!"<br>
2. Кино: тебя откидывает, ты возвращаешься<br>
3. <b>QTE:</b> 100 ударов за 30 секунд!<br>
4. Фаза 2: босс злится, реальный бой<br>
5. Победа → получаешь 🔑 Ключ<br>
</div>

<b>🎁 Награда:</b>
• 🔑 Ключ Живого Камня (открывает Тайник в лавке)
• 🪨 Кусок камня (коллекционный предмет)

<b>👑 Путеводная Звезда (волна 500):</b> Многофазный босс с диалогами.

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#ffd700;line-height:1.8;">
<b>📜 3 ФАЗЫ:</b><br>
<b>Фаза 1:</b> Диалог + обычный бой<br>
  Собери 5 Луффи в отряд (ровно 5!)<br>
  Победи Звезду → эволюция!<br><br>
<b>Фаза 2:</b> 60 осколков-пришельцев<br>
  Управление: ← → (только в стороны)<br>
  Авто-стрельба, убивай всех<br><br>
<b>Фаза 3:</b> Финальная форма<br>
  Все виды атак + эскалации<br>
  RAGE MODE при 50% HP<br>
</div>

<b>🎁 Награды:</b>
• Пощада: долг (Звезда вернётся помочь в будущем)
• Убийство: 🌟 Путеводная Звезда (карта-предмет) + 💎 секретный токен
            `
        },
        // ========== 8. ПОЩАДА ==========
        {
            id: "spare",
            icon: "🤝",
            title: "Пощада боссов",
            short: "Как получить босс-карту",
            content: `
<b>🤝 Пощада:</b> Особый способ победить босса — не убить, а пощадить.

<b>📋 Условия:</b>
1. Босс должен быть уникальным (с диалогом)
2. HP босса ниже <b>30%</b>
3. Кнопка <b>🤝 ПОЩАДИТЬ БОССА</b> появится внизу

<b>🎲 Шанс:</b> Базово <b>30%</b>. Можно увеличить:
• Карты с <b>+% к пощаде</b> (Деку, Деку 20%)
• Бонус от команды

<b>🎁 Что даёт:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#0f0;line-height:1.8;">
<b>Пример: Король Демонов (волна 50)</b><br>
▸ Убить: 25⭐ + шанс обычной карты<br>
▸ Пощадить: 👑 карта "Король Демонов"<br>
  (+10% урона боссам в команде!)<br><br>
<b>Пример: Маджин Буу (волна 100)</b><br>
▸ Убить: 50⭐<br>
▸ Пощадить: 👑 карта "Маджин Буу"<br>
  (+10% кровотечение)
</div>

<b>⚠️ Если провал:</b> Босс наносит ТРОЙНОЙ урон! Будь осторожен.

<b>💡 Совет:</b> Всегда щади уникальных боссов, если можешь — они дают эксклюзивные карты.
            `
        },
        // ========== 9. ГАЧА ==========
        {
            id: "gacha",
            icon: "🎰",
            title: "Гача (крутки)",
            short: "Как крутить карты и лимиты",
            content: `
<b>🎰 Гача:</b> Способ получить случайную карту за звёзды.

<b>📊 Типы круток:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.8;">
⚪ <b>Обычная</b> — 200⭐, до 50/день<br>
🔵 <b>Редкая</b> — 400⭐, до 35/день<br>
🟢 <b>Сверхредкая</b> — 800⭐, до 20/день<br>
🟣 <b>Эпическая</b> — 1600⭐, до 10/день<br>
🔴 <b>Мифическая</b> — 3200⭐, до 5/день<br>
🟡 <b>Легендарная</b> — 10000⭐, до 10/день*<br>
💎 <b>Секретная</b> — 20000⭐, до 2/день*
</div>

<b>* Легендарная и Секретная</b> доступны только после победы над <b>НОВЫМ</b> боссом (каждые 50 волн). За каждого босса дают токены.

<b>🎁 Токены:</b>
• 🎰 Легендарные токены — за победу над новым боссом (+2)
• 💎 Секретные токены — редко (15% шанс), +1 за босса

<b>⏰ Сброс лимитов:</b> Раз в 24 часа.

<b>💡 Совет:</b> Не трати все звёзды на крутки. Копи на прокачку и инвентарь. Легендарки выпадают с боссов чаще.
            `
        },
        // ========== 10. ПАСС ==========
        {
            id: "pass",
            icon: "🎫",
            title: "Мультиверс Пасс",
            short: "60 этапов с наградами",
            content: `
<b>🎫 Пасс:</b> Прогрессия из 60 этапов. На каждом — награда.

<b>📊 Как качать опыт пасса:</b>
• <b>+1 опыт</b> за клик
• <b>+5 опыта</b> за обычную волну
• <b>+25 опыта</b> за босса

<b>🏆 Награды по этапам:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#ffd700;line-height:1.6;">
Этап 1:   ⚪⚪⚪ 3 обычные карты<br>
Этап 5:   ⚡ 50 СИЛЫ<br>
Этап 10:  💥 Урон x2 на 15 мин<br>
Этап 20:  ⚡ 200 СИЛЫ<br>
Этап 30:  🔴 Мифическая карта<br>
Этап 40:  🎰 3 легендарных токена<br>
Этап 50:  💎 Секретная крутка<br>
Этап 60:  🎉 3 БЕСПЛАТНЫЕ СЕКРЕТКИ!
</div>

<b>💡 Совет:</b> Пасс сам качается, играй активно — откроются все награды.
            `
        },
        // ========== 11. ЭВОЛЮЦИИ ==========
        {
            id: "evolution",
            icon: "🧬",
            title: "Эволюции карт",
            short: "Как получить топовые карты",
            content: `
<b>🧬 Эволюции:</b> Особые карты, которые нельзя получить гачей. Только выполнив квесты.

<b>📋 Все эволюции (нужен 5 ребиртх):</b>

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.8;">
<b>👑 Луффи: Король пиратов</b><br>
▸ Собери 5 РАЗНЫХ Луффи в отряд<br>
▸ Победи босса 500 волны<br>
▸ Награда: 1200 урона, +50% боссам<br><br>

<b>👊 Сайтама/Гароу</b><br>
▸ Сайтама + Космический Гароу в отряде<br>
▸ 2000 ваншотов способностью<br>
▸ Награда: 1500 урона, 15% ваншот<br><br>

<b>❄️ Гарп/Кудзан</b><br>
▸ Молодой Гарп + Кудзан в отряде<br>
▸ 1 000 000 000 урона<br>
▸ Награда: 1400 урона, -50% урона<br><br>

<b>🦸 Семёрка</b><br>
▸ 6 членов Семёрки + V у всех<br>
▸ Уровень 20+<br>
▸ Награда: 1600 урона, хил 5%/волна<br><br>

<b>💀 Уильям Фрэнсис</b><br>
▸ Победи босса 2000 волны<br>
▸ Только обычные карты (6 шт)<br>
▸ Награда: 800 урона, 15% копирование
</div>
            `
        },
        // ========== 12. РЕБИРТХ ==========
        {
            id: "rebirth",
            icon: "🔄",
            title: "Ребиртх (Престиж)",
            short: "Сброс ради множителя",
            content: `
<b>🔄 Ребиртх:</b> Сброс всего ради постоянного множителя.

<b>🎯 Что даёт:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#0f0;line-height:1.8;">
Ребиртх 1: x1.3 ко всему<br>
Ребиртх 2: x1.6<br>
Ребиртх 3: x1.9<br>
Ребиртх 5: x2.5<br>
Ребиртх 10: x4.0
</div>

<b>📋 Требования:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.6;">
Реб 1: победить Живого Камня (200)<br>
Реб 2: победить Путеводную Звезду (500)<br>
Реб 3: победить Короля Смерти (650)<br>
Реб 4: победить Астарота (800)<br>
Реб 5: победить Императора Хаоса (1000)<br>
Реб 6+: 1250, 1500, 1750... волны
</div>

<b>💥 Что СБРАСЫВАЕТСЯ:</b>
• Все карты (кроме 🥚 пасхалок!)<br>
• Отряд и АФК<br>
• Звёзды, апгрейды, редкости<br>
• Мастерство карт

<b>💾 Что ОСТАЁТСЯ:</b>
• 🥚 Пасхалки (Пельмешка, Попугай, DrinkTea2Win)<br>
• 🪨 Кусок камня<br>
• Статистика и ребиртх-история

<b>💡 Совет:</b> Делай ребиртх, когда упёрся в стену. Множитель x1.3 очень заметен!
            `
        },
        // ========== 13. ЕДА И ГОЛОД ==========
        {
            id: "food",
            icon: "🍔",
            title: "Еда, голод, ожирение",
            short: "Как кормить команду",
            content: `
<b>🍽️ Голод:</b> Растёт со временем (0.028/сек). Влияет на HP и усталость.

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.6;">
Голод 0-30%:   ✅ норма (100% HP)<br>
Голод 30-60%:  ⚠️ -15% HP<br>
Голод 60-85%:  ⚠️ -40% HP<br>
Голод 85-100%: 💀 -70% HP
</div>

<b>🍔 Ожирение:</b> Даётся от жирной еды (хлеб, мясо). Влияет на скорость сердца.

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.6;">
Ож 0-19:    ✅ норма<br>
Ож 20-39:   🐢 скорость x0.75 (Ож I)<br>
Ож 40-59:   🐢 скорость x0.6 (Ож II)<br>
Ож 60:      🐌 скорость x0.5 (Ож III)
</div>

<b>☠️ Отравление:</b> От сырого мяса и ядовитых грибов. Тикает -2% HP/сек.

<b>💚 Антидот:</b> Копится от фруктов. 10 очков = снимает отравление.

<b>🍎 Полезные продукты:</b>
• 🍏 Яблоко: +5% HP, -10% голода
• 🍉 Арбуз: +20% HP, -50% голода
• 🍍 Ананас: +25% HP, -60% голода
• 🍯 Мёд: реген 30% HP за 10 сек
• 🥭 Манго: +8 антидота

<b>⚠️ Вредные:</b>
• 🍞 Хлеб: -40% голода, но +1 ожирение
• 🥩 Сырое мясо: +15% HP, но отравление
• 🌶️ Перец: +30% скорости, но -1% HP/сек
            `
        },
        // ========== 14. ИНВЕНТАРЬ ==========
        {
            id: "inventory",
            icon: "🎒",
            title: "Инвентарь и предметы",
            short: "Что можно носить и использовать",
            content: `
<b>🎒 Инвентарь:</b> Вкладка Лавка → Инвентарь. Все предметы, которые ты собрал.

<b>📦 Предметы:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.6;">
🦴 <b>Кость</b> — продать за 1⭐<br>
🥩 <b>Сырое мясо</b> — есть или жарить<br>
🍖 <b>Жареное мясо</b> — +25% HP, +2 ож<br>
🍄 <b>Гриб</b> — 50/50 волшебный/ядовитый<br>
🍯 <b>Мёд</b> — реген HP<br>
🌶️ <b>Перец</b> — скорость+жжёт<br>
🧊 <b>Лёд</b> — заморозка врага<br>
🥚 <b>Яйцо</b> — рандомная награда<br>
🧪 <b>Зелье</b> — снять отравление<br>
🍏🍊🍌🍒🍋🍇🍉🥭🍍 <b>Фрукты</b> — полезные<br>
🔑 <b>Ключ Живого Камня</b> — откр. Тайник<br>
🌟 <b>Путеводная Звезда</b> — 25 000⭐ при активации!
</div>

<b>👆 Как использовать:</b> Нажми на предмет → откроется меню с действиями.

<b>💰 Скупка костей:</b> В Лавка → Скупка можно продать кости и прочие предметы за звёзды.
            `
        },
        // ========== 15. ПРОМОКОДЫ ==========
        {
            id: "codes",
            icon: "🎁",
            title: "Промокоды",
            short: "Бесплатные награды по коду",
            content: `
<b>🎁 Промокоды:</b> Введи код → получи награду. Вкладка <b>Прочее → Коды</b>.

<b>📋 Известные коды:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;color:#0f0;line-height:1.8;">
<b>DrinkTea2Win</b> → 🥤 Пасхалка DrinkTea2Win<br>
<b>PELMESHKA</b> → 🥟 Пасхалка Пельмешка + 1000⭐<br>
<b>Хочу Звезды</b> → ⭐ 5000 звёзд<br>
<b>Сила</b> → 💪 Бафф урона x1.3 на сутки<br>
<b>789456123</b> → 👑 Модер-режим
</div>

<b>⚠️ Каждый код можно использовать 1 раз.</b>

<b>💡 Совет:</b> Подписывайся на обновления — иногда выходят новые коды.
            `
        },
        // ========== 16. СИЛА ==========
        {
            id: "power",
            icon: "⚡",
            title: "Сила (Power Points)",
            short: "Отдельная валюта для мастерства",
            content: `
<b>⚡ Сила:</b> Отдельная валюта, только для прокачки <b>мастерства карт</b>.

<b>📊 Где брать:</b>
<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.6;">
Волна 1-99:    +1 ⚡<br>
Волна 100-199: +2 ⚡<br>
Волна 200-299: +3 ⚡<br>
Волна 300-499: +5 ⚡<br>
Волна 500+:    +5-10 ⚡<br>
Босс:          +50 ⚡ бонусом
</div>

<b>🎯 Куда тратить:</b> Только на мастерство карт (кнопка ⭐ на карточке).

<b>💡 Совет:</b> Не копи слишком много — качай карты, что в отряде. Иначе Сила копится впустую.
            `
        },
        // ========== 17. ЧЕКПОИНТЫ ==========
        {
            id: "checkpoints",
            icon: "🚩",
            title: "Чекпоинты",
            short: "Сохранение прогресса волн",
            content: `
<b>🚩 Чекпоинты:</b> Каждые 50 волн открывается чекпоинт. При смерти можно вернуться.

<b>📋 Где смотреть:</b> Вкладка <b>Битва → Чекпоинты</b>.

<b>🎯 Варианты использования:</b>
1. <b>Перейти сейчас</b> — телепорт на волну (для повторного фарма)
2. <b>Авто-возврат</b> — при смерти возвращаться на чекпоинт

<b>💀 При смерти:</b>
• Если есть активный чекпоинт → вернёшься туда
• Если нет → вернёшься на 1 волну

<b>🌟 Зено-бонус:</b> Если в отряде Зено — 10% шанс открыть СЛЕДУЮЩИЙ чекпоинт автоматически.
            `
        },
        // ========== 18. МИРЫ ==========
        {
            id: "worlds",
            icon: "🌍",
            title: "Миры и волны",
            short: "12 миров на 10000 волн",
            content: `
<b>🌍 Миры:</b> Игра состоит из 12 миров, каждый со своим стилем.

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.8;">
🌲 <b>Лес начала и конца</b> (1-250)<br>
🔥 <b>Огненная пустошь</b> (251-499)<br>
🌌 <b>Сломанный Космос</b> (500-600)<br>
⛵ <b>Гранд Лайн</b> (601-900)<br>
❄️ <b>Замороженные земли</b> (901-1200)<br>
👿 <b>Тёмное измерение</b> (1201-1500)<br>
☁️ <b>Небесный дворец</b> (1501-2000)<br>
🕳️ <b>Бездна отчаяния</b> (2001-3000)<br>
💪 <b>Предел силы</b> (3001-5000)<br>
🌠 <b>Космическая пустота</b> (5001-7500)<br>
🏰 <b>Финальный рубеж</b> (7501-9999)<br>
🎯 <b>Возвращение Охотника</b> (10000)
</div>

<b>Боссы</b> — каждые 50 волн. Ослабленные уникальные боссы (50, 100, 150...) дают особые награды.
            `
        },
        // ========== 19. СОВЕТЫ ==========
        {
            id: "tips",
            icon: "💡",
            title: "Про-советы",
            short: "Как играть эффективнее",
            content: `
<b>💡 Топ-10 советов:</b>

<div style="background:#000;padding:10px;border-radius:10px;font-family:monospace;font-size:11px;line-height:1.8;">
<b>1. Всегда щади уникальных боссов</b><br>
Они дают эксклюзивные карты, которые нельзя получить иначе.<br><br>

<b>2. Качай мастерство главных карт</b><br>
Скорость сердечка критична на арене. Сайтама (4.0) — топ.<br><br>

<b>3. Комбо на кликере</b><br>
Кликай с интервалом 0.2-0.5 сек — держишь x2-x5 урон.<br><br>

<b>4. Не копи звёзды</b><br>
Трати их на мастерство и апгрейды. Копи только на ребиртх.<br><br>

<b>5. АФК — твой друг</b><br>
Перед выходом из игры закрой АФК-отряд — нафармит оффлайн.<br><br>

<b>6. Хилки на арене</b><br>
Зелёные кружки — подбирай. Часто спасают жизнь.<br><br>

<b>7. Розыгрыш ПРЕСЕТОВ</b><br>
Сохрани 2-3 сета: для кликера (макс. урон), для арены (скорость), для АФК (HP).<br><br>

<b>8. Коды и ежедневки</b><br>
Заходи каждый день — накопишь много ресурсов.<br><br>

<b>9. Эволюции — цель</b><br>
После 5 ребиртхов начинай собирать карты для эволюций.<br><br>

<b>10. Настройки арены</b><br>
Включи авто-СУПЕР, если лень нажимать. Понизь эффекты на телефоне.
</div>
            `
        }
    ];

    // ========== КАРТА КНОПОК "?" ==========
    // Где искать → какой раздел открыть
    const HELP_BUTTON_MAP = [
        { selector: 'button#claimCardBtn', section: 'cards', position: 'before' },
        { selector: '#teamList', section: 'team', position: 'before' },
        { selector: '#afkTeamList', section: 'team', position: 'before' },
        { selector: '#fatigueBar', section: 'clicker', position: 'before' },
        { selector: '#passContent', section: 'pass', position: 'before' },
        { selector: '#evoContent', section: 'evolution', position: 'before' },
        { selector: '#rebirthInfo', section: 'rebirth', position: 'before' },
        { selector: '#gachaItems', section: 'gacha', position: 'before' },
        { selector: '#inventoryContent', section: 'inventory', position: 'before' },
        { selector: '#checkpointList', section: 'checkpoints', position: 'before' },
        { selector: '#upgradeItems', section: 'power', position: 'before' },
        { selector: '#dailyRewardsList', section: 'codes', position: 'before' }
    ];

    // ========== РЕНДЕР СПРАВКИ ==========
    function renderHelpIndex() {
        let html = '';
        html += '<div style="text-align:center;margin-bottom:15px;">';
        html += '<div style="font-size:22px;font-weight:900;color:#f5af19;margin-bottom:5px;">📖 СПРАВКА ПО ИГРЕ</div>';
        html += '<div style="font-size:12px;color:#aaa;">Нажми на раздел, чтобы узнать подробнее</div>';
        html += '</div>';
        html += '<div style="display:grid;grid-template-columns:1fr;gap:8px;">';
        for (let s of HELP_SECTIONS) {
            html += '<div class="help-card" onclick="openHelpSection(\'' + s.id + '\')" style="background:rgba(0,0,0,0.4);padding:12px;border-radius:14px;cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:all 0.2s;display:flex;align-items:center;gap:10px;" onmouseover="this.style.background=\'rgba(245,175,25,0.15)\';this.style.borderColor=\'#f5af19\'" onmouseout="this.style.background=\'rgba(0,0,0,0.4)\';this.style.borderColor=\'rgba(255,255,255,0.08)\'">';
            html += '<div style="font-size:26px;flex-shrink:0;">' + s.icon + '</div>';
            html += '<div style="flex:1;">';
            html += '<div style="font-weight:900;font-size:14px;color:#f5af19;">' + s.title + '</div>';
            html += '<div style="font-size:11px;color:#aaa;margin-top:2px;">' + s.short + '</div>';
            html += '</div>';
            html += '<div style="font-size:18px;color:#f5af19;">▶</div>';
            html += '</div>';
        }
        html += '</div>';

        let container = document.getElementById("helpContentArea");
        if (container) container.innerHTML = html;
    }

    function renderHelpSection(sectionId) {
        let s = HELP_SECTIONS.find(x => x.id === sectionId);
        if (!s) {
            renderHelpIndex();
            return;
        }
        let html = '';
        html += '<button class="btn" style="padding:6px 14px;margin-bottom:12px;font-size:12px;background:#555;" onclick="closeHelpSection()">← К списку</button>';
        html += '<div style="text-align:center;margin-bottom:15px;">';
        html += '<div style="font-size:44px;margin-bottom:5px;">' + s.icon + '</div>';
        html += '<div style="font-size:20px;font-weight:900;color:#f5af19;">' + s.title + '</div>';
        html += '</div>';
        html += '<div style="background:rgba(0,0,0,0.3);padding:15px;border-radius:14px;font-size:13px;line-height:1.7;color:#ddd;">';
        html += s.content;
        html += '</div>';

        let container = document.getElementById("helpContentArea");
        if (container) {
            container.innerHTML = html;
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function openHelpSection(sectionId) {
        renderHelpSection(sectionId);
    }

    function closeHelpSection() {
        renderHelpIndex();
    }

    // ========== ИНЪЕКЦИЯ ВКЛАДКИ "❓ Справка" ==========
    function injectHelpSubTab() {
        let subTabsContainer = document.querySelector('#otherTab .sub-tabs');
        if (!subTabsContainer) return false;
        if (document.getElementById('helpSubTabBtn')) return true; // уже есть

        // Создаём кнопку sub-tab
        let btn = document.createElement('button');
        btn.className = 'sub-tab-btn';
        btn.setAttribute('data-subtab', 'help');
        btn.id = 'helpSubTabBtn';
        btn.innerHTML = '❓ Справка';
        btn.addEventListener('click', function() {
            // Убираем active у других sub-tab в otherTab
            let parent = document.getElementById('otherTab');
            parent.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
            // Активируем наш
            btn.classList.add('active');
            let content = document.getElementById('helpSubTab');
            if (content) content.classList.add('active');
            renderHelpIndex();
        });
        subTabsContainer.appendChild(btn);

        // Создаём контейнер sub-tab-content
        let content = document.createElement('div');
        content.id = 'helpSubTab';
        content.className = 'sub-tab-content';
        content.innerHTML = '<div class="card"><div class="card-title">📖 Справка</div><div id="helpContentArea"></div></div>';
        let otherTab = document.getElementById('otherTab');
        if (otherTab) otherTab.appendChild(content);

        return true;
    }

    // ========== КНОПКИ "?" РЯДОМ С СЕКЦИЯМИ ==========
    function addQuestionButtons() {
        for (let item of HELP_BUTTON_MAP) {
            let el = document.querySelector(item.selector);
            if (!el) continue;
            // Проверяем, не добавили ли уже
            if (el.dataset && el.dataset.helpAdded === "1") continue;

            // Ищем ближайший .card-title или сам элемент
            let target = el.closest('.card');
            if (!target) target = el;

            // Ищем .card-title
            let title = target.querySelector('.card-title') || target;

            // Создаём кнопку "?"
            let qBtn = document.createElement('button');
            qBtn.className = 'help-q-btn';
            qBtn.innerHTML = '?';
            qBtn.title = 'Справка: ' + (HELP_SECTIONS.find(s => s.id === item.section)?.title || '');
            qBtn.style.cssText = 'margin-left:6px;padding:0;width:20px;height:20px;border-radius:50%;background:#f5af19;color:#1a1a2e;font-weight:900;font-size:13px;border:none;cursor:pointer;line-height:1;vertical-align:middle;box-shadow:0 2px 6px rgba(245,175,25,0.4);';
            qBtn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                // Переключаемся на вкладку Помощь
                let helpBtn = document.getElementById('helpSubTabBtn');
                if (helpBtn) {
                    // Открываем вкладку "Прочее" если не открыта
                    let otherTabBtn = document.querySelector('.tab-btn[data-tab="other"]');
                    if (otherTabBtn && !document.getElementById('otherTab').classList.contains('active')) {
                        otherTabBtn.click();
                    }
                    // Открываем sub-tab "Справка"
                    helpBtn.click();
                    // Открываем нужный раздел
                    setTimeout(function() { openHelpSection(item.section); }, 100);
                }
            };

            // Вставляем
            title.appendChild(qBtn);
            if (el.dataset) el.dataset.helpAdded = "1";
        }
    }

    // ========== ПОВТОРНАЯ ИНЪЕКЦИЯ (на случай перерисовки UI) ==========
    function reInject() {
        injectHelpSubTab();
        addQuestionButtons();
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        let attempts = 0;
        let maxAttempts = 100;

        function tryInit() {
            attempts++;
            let ok = injectHelpSubTab();
            if (ok) {
                addQuestionButtons();
                // Периодически проверяем новые кнопки (для перерисованных секций)
                setInterval(reInject, 2000);
                console.log("╔════════════════════════════════════════╗");
                console.log("║  📖 HELP SYSTEM v1.0 загружено        ║");
                console.log("║  Вкладка: Прочее → ❓ Справка         ║");
                console.log("║  Кнопки ? у ключевых секций           ║");
                console.log("╚════════════════════════════════════════╝");
                return;
            }
            if (attempts < maxAttempts) {
                setTimeout(tryInit, 200);
            } else {
                console.warn("[HELP] Не удалось найти #otherTab .sub-tabs");
            }
        }

        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(tryInit, 500);
        } else {
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(tryInit, 800);
            });
        }
    }

    init();

    // ========== ЭКСПОРТ ==========
    window.openHelpSection = openHelpSection;
    window.closeHelpSection = closeHelpSection;
    window.renderHelpIndex = renderHelpIndex;
    window.HELP_SECTIONS = HELP_SECTIONS;
    window.reInjectHelp = reInject;

})();
