// ============================================================
// HELP SYSTEM v2.0 — Справка с наглядными примерами из игры
// ============================================================
// ПОДКЛЮЧАТЬ ПОСЛЕ ui.js (в самом конце)
// ============================================================

(function() {
    'use strict';

    if (window._helpSystemLoaded) {
        console.warn("[HELP] Уже загружено, игнорирую повтор.");
        return;
    }
    window._helpSystemLoaded = true;

    // ========== CSS ДЛЯ ДЕМО-БЛОКОВ ==========
    const helpStyles = document.createElement('style');
    helpStyles.textContent = `
        .help-demo {
            background: linear-gradient(135deg, rgba(245,175,25,0.12), rgba(245,175,25,0.04));
            border: 2px dashed #f5af19;
            border-radius: 14px;
            padding: 14px 10px;
            margin: 14px 0;
            text-align: center;
        }
        .help-demo-title {
            font-size: 11px;
            color: #f5af19;
            font-weight: 900;
            margin-bottom: 10px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
        }
        .help-demo-stage {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 6px;
            min-height: 30px;
            overflow: hidden;
        }
        .help-demo-stage > * { max-width: 100%; }
        .help-demo-caption {
            font-size: 11px;
            color: #bbb;
            margin-top: 10px;
            line-height: 1.5;
            font-weight: 600;
        }
        .help-arrow-down {
            font-size: 14px;
            color: #f5af19;
            font-weight: 900;
            margin: 4px 0;
            letter-spacing: 1px;
        }
        .help-legend {
            display: inline-block;
            background: rgba(0,0,0,0.5);
            border-radius: 8px;
            padding: 6px 10px;
            margin-top: 8px;
            font-size: 11px;
            line-height: 1.7;
            text-align: left;
            color: #ddd;
        }
        .help-battle-mock {
            background: rgba(30,30,47,0.95);
            border-radius: 14px;
            padding: 10px;
            max-width: 290px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.08);
        }
        .help-enemy-mock {
            text-align: center;
            padding: 6px;
            background: rgba(44,44,58,0.5);
            border-radius: 10px;
            margin-bottom: 8px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .help-inv-mock {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 6px;
            background: rgba(0,0,0,0.4);
            border-radius: 12px;
            max-width: 280px;
            margin: 0 auto;
        }
        .help-item-mock {
            background: linear-gradient(180deg,#1e1e2f,#151522);
            border:2px solid rgba(255,255,255,0.08);
            border-radius:12px;
            padding:8px 6px;
            text-align:center;
            width:80px;
            flex-shrink:0;
        }
        .help-stage-list {
            display:flex;
            align-items:center;
            gap:8px;
            padding:8px 10px;
            border-radius:10px;
            border:2px solid;
            max-width:280px;
            margin:0 auto 6px;
            font-size:11px;
            text-align:left;
        }
    `;
    document.head.appendChild(helpStyles);

    // ========== ХЕЛПЕРЫ ДЛЯ МАКЕТОВ ==========

    function demo(title, stageHTML, caption) {
        return '<div class="help-demo">' +
            '<div class="help-demo-title">👇 ' + title + ' 👇</div>' +
            '<div class="help-demo-stage">' + stageHTML + '</div>' +
            (caption ? '<div class="help-demo-caption">' + caption + '</div>' : '') +
            '</div>';
    }

    // Макет карточки карты (как в коллекции)
    function mockCard(name, rarity, rarityClass, stats, isSelected, isAfk) {
        let cls = 'card-item';
        if (isSelected) cls += ' team-selected';
        if (isAfk) cls += ' afk-selected';
        return '<div class="' + cls + '" style="pointer-events:none;transform:scale(0.9);">' +
            '<div class="card-name">' + name + '</div>' +
            '<div class="rarity-tag ' + rarityClass + '">' + rarity + '</div>' +
            '<div class="card-stats">' + stats + '</div>' +
            '<div style="display:flex;gap:4px;justify-content:center;margin-top:6px;">' +
                '<div class="remove-icon" style="background:#ffd700;color:#000;">⭐</div>' +
                '<div class="remove-icon" style="background:#f5af19;color:#000;">⚔️</div>' +
                '<div class="remove-icon" style="background:#2ecc71;color:#000;">💤</div>' +
                '<div class="remove-icon">💰</div>' +
            '</div>' +
        '</div>';
    }

    // ========== СПРАВКА ==========
    const HELP_SECTIONS = [
        // ========== 1. КЛИКЕР ==========
        {
            id: "clicker",
            icon: "👆",
            title: "Основы: Кликер",
            short: "Как бить врагов, комбо, криты, усталость",
            content: `
Вот так выглядит <b>боевой экран</b>. Разберём элементы:

` + demo("ЭТУ КНОПКУ НАДО НАЖИМАТЬ",
    `<div class="help-battle-mock" style="transform:scale(0.95);">
        <div class="help-enemy-mock">
            <div style="font-weight:900;font-size:14px;">👾 Орк-берсерк</div>
            <div style="font-size:11px;color:#aaa;margin-top:2px;">❤️ 200 / 200</div>
            <div style="background:rgba(0,0,0,0.5);border-radius:6px;height:8px;margin-top:5px;">
                <div style="width:100%;background:linear-gradient(90deg,#e74c3c,#f5af19);height:8px;border-radius:6px;"></div>
            </div>
        </div>
        <div class="click-area" style="font-size:16px;padding:16px 10px;box-shadow:0 5px 0 #b84000;animation:none;">💥 НАЖМИ ДЛЯ АТАКИ! 💥</div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#ddd;margin-top:8px;padding:6px;background:rgba(0,0,0,0.4);border-radius:8px;font-weight:800;">
            <span>💪 45</span><span>❤️ 100/100</span><span>⏳ 3</span><span>⭐ +10</span>
        </div>
    </div>`,
    "Большая оранжевая кнопка — твоя атака. Кликай по ней, чтобы бить врага. Полоска HP врага — сверху."
) + `

` + demo("ПОЛОСКА УСТАЛОСТИ",
    `<div style="background:rgba(0,0,0,0.4);padding:10px;border-radius:12px;width:250px;">
        <div style="font-size:12px;font-weight:800;margin-bottom:5px;">😫 Усталость: <span style="color:#e74c3c;">45.3%</span></div>
        <div style="background:rgba(0,0,0,0.5);border-radius:6px;height:10px;overflow:hidden;">
            <div style="width:45%;height:10px;background:linear-gradient(90deg,#e74c3c,#c0392b);border-radius:6px;box-shadow:0 0 10px rgba(231,76,60,0.5);"></div>
        </div>
        <button class="btn" style="margin-top:8px;padding:6px 12px;width:100%;font-size:11px;">💤 Отдых (45⭐)</button>
    </div>`,
    "За каждый клик растёт усталость. Чем выше — тем меньше урона. Кнопка «Отдых» снижает её за звёзды."
) + `

` + demo("КОМБО — КЛИКАЙ БЫСТРО",
    `<div style="display:flex;flex-direction:column;gap:5px;width:250px;">
        <div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(0,0,0,0.3);border-radius:8px;font-size:11px;font-weight:800;">
            <span>Кликов подряд: <b style="color:#00d4ff;">9</b></span>
            <span>Множитель: <b style="color:#aaa;">x1</b></span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(255,170,0,0.15);border:1px solid #ffaa00;border-radius:8px;font-size:11px;font-weight:800;">
            <span>Кликов подряд: <b style="color:#00d4ff;">24</b></span>
            <span>Множитель: <b style="color:#ffaa00;">x2 ⚡</b></span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(255,68,0,0.15);border:1px solid #ff4400;border-radius:8px;font-size:11px;font-weight:800;">
            <span>Кликов подряд: <b style="color:#00d4ff;">50+</b></span>
            <span>Множитель: <b style="color:#ff4400;">x5 🔥</b></span>
        </div>
    </div>`,
    "Комбо растёт, если кликать с интервалом меньше 0.5 сек. Даёт до x5 урона!"
) + `

<b>😫 Усталость:</b>
<div class="help-legend">
Усталость 0%:   💪 100% урона<br>
Усталость 50%:  💪 50% урона<br>
Усталость 90%:  💪 10% урона ⚠️<br>
Усталость 100%: 💪 0% урона  💀
</div>

<b>⚠️ Осторожно:</b> если кликать слишком часто (интервал < 0.1 сек) — усталость растёт <b>в 3 раза быстрее!</b>
            `
        },

        // ========== 2. КАРТЫ ==========
        {
            id: "cards",
            icon: "🃏",
            title: "Карты и редкости",
            short: "Что такое карты и откуда их брать",
            content: `
Каждая карта в коллекции выглядит так:

` + demo("ТАК ВЫГЛЯДИТ КАРТА В КОЛЛЕКЦИИ",
    mockCard("Луффи", "Обычная", "common", "💪4 ❤️8 ⚡0.6", false, false),
    "Клик по карте → добавление в отряд. Кнопки внизу — быстрое управление."
) + `

` + demo("ЧТО ЗНАЧАТ КНОПКИ НА КАРТЕ",
    `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="remove-icon" style="background:#ffd700;color:#000;font-size:14px;padding:6px 12px;">⭐</div>
            <span style="font-size:10px;color:#aaa;">Мастерство</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="remove-icon" style="background:#f5af19;color:#000;font-size:14px;padding:6px 12px;">⚔️</div>
            <span style="font-size:10px;color:#aaa;">В отряд</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="remove-icon" style="background:#2ecc71;color:#000;font-size:14px;padding:6px 12px;">💤</div>
            <span style="font-size:10px;color:#aaa;">В АФК</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="remove-icon" style="font-size:14px;padding:6px 12px;">💰</div>
            <span style="font-size:10px;color:#aaa;">Продать</span>
        </div>
    </div>`,
    "Жёлтая — прокачать мастерство. Оранжевая — в отряд. Зелёная — в АФК. Красная — продать за звёзды."
) + `

<b>🏆 Все редкости (от слабых к сильным):</b>

<div class="help-legend" style="font-size:12px;line-height:2;">
<span class="rarity-tag common">⚪ Обычная</span> — база, слабые<br>
<span class="rarity-tag rare">🔵 Редкая</span> — чуть сильнее<br>
<span class="rarity-tag superrare">🟢 Сверх редкая</span> — середина<br>
<span class="rarity-tag epic">🟣 Эпик</span> — сильные<br>
<span class="rarity-tag mythic">🔴 Мифическая</span> — очень сильные<br>
<span class="rarity-tag legendary">🟡 Легендарная</span> — топовые<br>
<span class="rarity-tag secret">💎 Секретная</span> — имба, с СУПЕР<br>
<span class="rarity-tag evolutionary">🧬 Эволюционная</span> — только крафт<br>
<span class="rarity-tag boss-rarity">👑 Босс</span> — с пощады боссов<br>
<span class="rarity-tag easter">🥚 Пасхалка</span> — секретные
</div>

<b>📚 Откуда брать карты:</b>
• <b>🎴 Получить карту (2ч)</b> — кнопка в коллекции, бесплатно каждые 2 часа
• <b>🎰 Гача</b> — в лавке за звёзды
• <b>👑 Боссы</b> — 50% шанс выпадения
• <b>🎫 Пасс</b> — награды за этапы
• <b>📅 Ежедневки</b> — за вход
• <b>🎁 Промокоды</b>

<b>🔍 Поиск и сортировка:</b> В коллекции есть поиск по имени, фильтр по редкости и сортировка (по урону, HP, редкости).
            `
        },

        // ========== 3. ОТРЯД ==========
        {
            id: "team",
            icon: "⚔️",
            title: "Отряд (6 карт)",
            short: "Как собрать команду и пресеты",
            content: `
<b>⚔️ Отряд:</b> до 6 карт. Их суммарный урон/HP идёт в бой.

` + demo("КАРТА В ОТРЯДЕ — ЖЁЛТАЯ ОБВОДКА",
    mockCard("Луффи", "Обычная", "common", "💪4 ❤️8 ⚡0.6", true, false),
    "Такая карта уже в отряде. Жёлтая обводка + свечение."
) + `

` + demo("КАРТА В АФК — ЗЕЛЁНАЯ ОБВОДКА",
    mockCard("Усопп", "Обычная", "common", "💪3 ❤️6 ⚡0.4", false, true),
    "Зелёная обводка = карта в АФК-отряде. Она фармит оффлайн."
) + `

` + demo("ВЫБОР ГЛАВНОЙ КАРТЫ (КНОПКА 👑)",
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(0,0,0,0.4);border:2px solid #f5af19;border-radius:12px;width:280px;box-shadow:0 0 12px rgba(245,175,25,0.4);">
        <div>
            <div style="font-weight:800;font-size:13px;">👑 Луффи</div>
            <div style="font-size:10px;color:#aaa;">💪4 ❤️8 ⚡0.6</div>
        </div>
        <div style="font-size:10px;color:#f5af19;font-weight:bold;">ГЛАВНЫЙ</div>
    </div>
    <div style="margin-top:8px;font-size:10px;color:#aaa;text-align:center;">или так — если карта ещё не главная:</div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(0,0,0,0.3);border:2px solid rgba(255,255,255,0.08);border-radius:12px;width:280px;margin-top:6px;">
        <div>
            <div style="font-weight:800;font-size:13px;">Киллуа</div>
            <div style="font-size:10px;color:#aaa;">💪10 ❤️13 ⚡1.3</div>
        </div>
        <button class="btn" style="padding:3px 8px;font-size:10px;background:rgba(245,175,25,0.3);border:1px solid #f5af19;color:#f5af19;border-radius:15px;">👑</button>
    </div>`,
    "Скорость главной карты = скорость твоего сердца ❤️ на арене боссов."
) + `

<b>💾 Пресеты отрядов (до 5 штук):</b>

` + demo("ТАК ВЫГЛЯДИТ ПРЕСЕТ",
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(0,0,0,0.4);border-radius:10px;width:280px;border:1px solid rgba(255,255,255,0.05);">
        <div style="text-align:left;">
            <div style="font-weight:800;font-size:12px;">✅ Кликер-сет</div>
            <div style="font-size:10px;color:#aaa;">6 карт</div>
        </div>
        <div style="display:flex;gap:4px;">
            <button class="btn" style="padding:4px 9px;font-size:11px;background:#2ecc71;color:#fff;border:none;">💾</button>
            <button class="btn" style="padding:4px 9px;font-size:11px;background:#3498db;color:#fff;border:none;">📥</button>
            <button class="btn" style="padding:4px 9px;font-size:11px;background:#e74c3c;color:#fff;border:none;">🗑️</button>
        </div>
    </div>`,
    "💾 сохранить • 📥 загрузить • 🗑️ удалить. Клик по названию — переименовать."
) + `

<b>💡 Совет:</b> держи 2-3 пресета: для кликера (макс урон), для арены (скорость), для АФК (HP).
            `
        },

        // ========== 4. МАСТЕРСТВО ==========
        {
            id: "mastery",
            icon: "⭐",
            title: "Мастерство карт",
            short: "Прокачка от 1 до 5 звёзд",
            content: `
<b>⭐ Мастерство:</b> уровень карты от 1 до 5. Чем выше — тем сильнее.

` + demo("ТАК ВЫГЛЯДИТ МОДАЛКА МАСТЕРСТВА",
    `<div style="background:linear-gradient(180deg,#1e1e2f,#151522);border:2px solid #f5af19;border-radius:16px;padding:14px;max-width:280px;width:100%;">
        <div style="font-weight:900;font-size:14px;color:#f5af19;text-align:center;margin-bottom:6px;">⭐ МАСТЕРСТВО</div>
        <div style="text-align:center;font-weight:900;font-size:13px;margin-bottom:2px;">Луффи</div>
        <div style="text-align:center;font-size:10px;color:#aaa;margin-bottom:10px;">Обычная</div>
        <div style="font-size:11px;color:#aaa;text-align:center;margin-bottom:8px;">Уровень: <span style="color:#ffd700;font-weight:900;">3/5</span></div>
        <div style="display:flex;gap:4px;margin-bottom:12px;">
            <div style="flex:1;height:8px;background:#ffd700;border-radius:4px;"></div>
            <div style="flex:1;height:8px;background:#ffd700;border-radius:4px;"></div>
            <div style="flex:1;height:8px;background:#ffd700;border-radius:4px;"></div>
            <div style="flex:1;height:8px;background:#333;border-radius:4px;"></div>
            <div style="flex:1;height:8px;background:#333;border-radius:4px;"></div>
        </div>
        <div style="font-size:10px;line-height:1.7;background:rgba(0,0,0,0.3);padding:8px;border-radius:8px;margin-bottom:10px;">
            ✅ Ур 1: 60%<br>
            ✅ Ур 2: +15%<br>
            ✅ Ур 3: +10% + статус<br>
            🔒 Ур 4: +10% + способность<br>
            🔒 Ур 5: +5% + СУПЕР ⚡
        </div>
        <div style="font-size:10px;color:#aaa;text-align:center;margin-bottom:5px;">📊 Опыт карты:</div>
        <div style="background:rgba(0,0,0,0.5);border-radius:6px;height:14px;overflow:hidden;margin-bottom:8px;position:relative;">
            <div style="width:65%;height:100%;background:linear-gradient(90deg,#00d4ff,#0099ff);"></div>
            <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;">1300 / 2000</div>
        </div>
        <button class="btn btn-primary" style="width:100%;padding:10px;font-size:13px;font-weight:900;">⬆️ ПРОКАЧАТЬ +10%</button>
    </div>`,
    "Кнопка внизу — прокачать на следующий уровень. Стоит звёзды + Силу ⚡ + требует опыт."
) + `

<b>📊 Уровни и бонусы:</b>
<div class="help-legend">
⭐ 1/5:  60% характеристик<br>
⭐⭐ 2/5:  75% (+15%)<br>
⭐⭐⭐ 3/5:  85% (+10%) + <b>статус-эффект</b><br>
⭐⭐⭐⭐ 4/5:  95% (+10%) + <b>способность</b><br>
⭐⭐⭐⭐⭐ 5/5: 100% (+5%) + <b>СУПЕР ⚡</b>
</div>

<b>📊 Как качать:</b>
• <b>Опыт карты</b> — копится за бои (карта должна быть в отряде)
• <b>⭐ Звёзды</b> — цена зависит от редкости
• <b>⚡ Сила (Power Points)</b> — отдельная валюта

<b>⚡ Где брать Силу:</b> За победы над волнами (чем выше волна, тем больше) и +50 за боссов.
            `
        },

        // ========== 5. СУПЕР-СПОСОБНОСТИ ==========
        {
            id: "supers",
            icon: "⚡",
            title: "СУПЕР-способности",
            short: "Ульты, доступные с мастерства 5",
            content: `
<b>⚡ СУПЕР:</b> ульта карты. Открывается только на <b>мастерстве 5</b> (★★★★★). Есть у секретных и особых карт.

` + demo("КНОПКА СУПЕР НА АРЕНЕ БОССА",
    `<button class="btn btn-super" style="padding:10px 22px;font-size:15px;animation:superPulse 2s infinite;">⚡ СУПЕР</button>`,
    "Появляется внизу арены, когда готова. Нажми — активируешь ульту."
) + `

` + demo("КОГДА НА КУЛДАУНЕ — СЕРАЯ",
    `<div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-super" style="padding:10px 22px;font-size:15px;">⚡ СУПЕР</button>
        <button class="btn btn-super" style="padding:10px 22px;font-size:15px;background:#555;animation:none;box-shadow:none;cursor:not-allowed;" disabled>⏳ 8с</button>
    </div>`,
    "Слева — готова к бою. Справа — на кулдауне, надо подождать."
) + `

<b>📱 Настройки SUPER для телефона:</b>
<div class="help-legend">
• <b>Кнопка</b> — обычная кнопка внизу<br>
• <b>Двойное нажатие</b> — тапни 2 раза по арене<br>
• <b>Свайп вверх</b> — свайпни от сердца вверх
</div>

<b>🔥 Примеры СУПЕР:</b>
<div class="help-legend">
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

<b>⚙️ Авто-СУПЕР:</b> включи в настройках, если лень нажимать — будет активироваться сама при готовности.
            `
        },

        // ========== 6. ГАЧА ==========
        {
            id: "gacha",
            icon: "🎰",
            title: "Гача (крутки)",
            short: "Как крутить карты и дневные лимиты",
            content: `
<b>🎰 Гача:</b> способ получить случайную карту за звёзды.

` + demo("ТАК ВЫГЛЯДИТ КРУТКА В ЛАВКЕ",
    `<div style="background:rgba(15,15,31,0.6);border-radius:12px;padding:12px;border-left:3px solid #e74c3c;width:280px;display:flex;justify-content:space-between;align-items:center;">
        <div style="text-align:left;">
            <div style="font-weight:800;font-size:13px;">🔴 Мифическая крутка</div>
            <div style="font-size:10px;color:#aaa;margin-top:2px;">3200⭐ | 2/5 сегодня</div>
            <div style="font-size:9px;color:#aaa;margin-top:1px;">Мин: Эпик | Макс: Секретная (0.8%)</div>
        </div>
        <button class="btn btn-primary" style="padding:8px 14px;font-size:12px;min-width:80px;">Крутить</button>
    </div>`,
    "Нажми «Крутить» — начнётся анимация, в конце покажет выпавшую карту."
) + `

` + demo("ЛЕГЕНДАРНАЯ И СЕКРЕТНАЯ — ОСОБЕННЫЕ",
    `<div style="display:flex;flex-direction:column;gap:8px;width:280px;">
        <div style="background:rgba(255,215,0,0.1);border-radius:12px;padding:10px;border-left:3px solid #ffd700;display:flex;justify-content:space-between;align-items:center;">
            <div style="text-align:left;">
                <div style="font-weight:800;font-size:12px;">🟡 Легендарная крутка</div>
                <div style="font-size:9px;color:#aaa;">Разрешений: <b style="color:#ffd700;">3</b></div>
            </div>
            <button class="btn legendary-btn" style="padding:6px 12px;font-size:11px;">Крутить</button>
        </div>
        <div style="background:rgba(255,0,255,0.1);border-radius:12px;padding:10px;border-left:3px solid #ff00ff;display:flex;justify-content:space-between;align-items:center;">
            <div style="text-align:left;">
                <div style="font-weight:800;font-size:12px;">💎 Секретная крутка</div>
                <div style="font-size:9px;color:#aaa;">Разрешений: <b style="color:#ff00ff;">1</b></div>
            </div>
            <button class="btn secret-btn" style="padding:6px 12px;font-size:11px;">Крутить</button>
        </div>
    </div>`,
    "Открываются только после победы над НОВЫМ боссом. За каждого нового босса — +2 легендарных токена и 15% шанс на секретный."
) + `

<b>📊 Все крутки:</b>
<div class="help-legend">
⚪ <b>Обычная</b> — 200⭐, до 50/день<br>
🔵 <b>Редкая</b> — 400⭐, до 35/день<br>
🟢 <b>Сверхредкая</b> — 800⭐, до 20/день<br>
🟣 <b>Эпическая</b> — 1600⭐, до 10/день<br>
🔴 <b>Мифическая</b> — 3200⭐, до 5/день<br>
🟡 <b>Легендарная</b> — токен с босса<br>
💎 <b>Секретная</b> — токен с босса
</div>

<b>⏰ Лимиты сбрасываются раз в 24 часа.</b>
            `
        },

        // ========== 7. ПАСС ==========
        {
            id: "pass",
            icon: "🎫",
            title: "Мультиверс Пасс",
            short: "60 этапов с наградами",
            content: `
<b>🎫 Пасс:</b> прогрессия из 60 этапов. На каждом — награда.

` + demo("ТАК ВЫГЛЯДЯТ ЭТАПЫ ПАССА",
    `<div style="max-width:280px;width:100%;">
        <div style="text-align:center;margin-bottom:8px;font-size:11px;color:#aaa;">Этап <b style="color:#ffd700;">5</b> из 60</div>
        <div style="background:rgba(0,0,0,0.5);border-radius:8px;height:10px;margin-bottom:10px;overflow:hidden;">
            <div style="width:8%;height:100%;background:linear-gradient(90deg,#ffd700,#ff8c00);"></div>
        </div>

        <div class="help-stage-list" style="background:rgba(46,204,113,0.15);border-color:#2ecc71;">
            <span style="font-size:16px;">⚡</span>
            <div style="flex:1;">Этап 5: 50 СИЛЫ</div>
            <span style="color:#2ecc71;">✅</span>
        </div>

        <div class="help-stage-list" style="background:rgba(245,175,25,0.2);border-color:#f5af19;">
            <span style="font-size:16px;">⭐</span>
            <div style="flex:1;">Этап 6: 200 звёзд</div>
            <button class="btn btn-primary" style="padding:4px 12px;font-size:10px;">Забрать</button>
        </div>

        <div class="help-stage-list" style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.05);opacity:0.4;">
            <span style="font-size:16px;">🌟</span>
            <div style="flex:1;">Этап 7: Звёзды x2</div>
            <span>🔒</span>
        </div>
    </div>`,
    "Зелёный — награда уже забрана. Жёлтый — можно забрать. Серый — этап закрыт."
) + `

<b>📊 Как качается опыт пасса:</b>
<div class="help-legend">
• <b>+1 опыт</b> за клик<br>
• <b>+5 опыта</b> за обычную волну<br>
• <b>+25 опыта</b> за босса
</div>

<b>🏆 Топовые награды:</b>
<div class="help-legend">
Этап 1:   ⚪⚪⚪ 3 обычные карты<br>
Этап 5:   ⚡ 50 СИЛЫ<br>
Этап 10:  💥 Урон x2 на 15 мин<br>
Этап 20:  ⚡ 200 СИЛЫ<br>
Этап 30:  🔴 Мифическая карта<br>
Этап 40:  🎰 3 легендарных токена<br>
Этап 50:  💎 Секретная крутка<br>
Этап 60:  🎉 3 БЕСПЛАТНЫЕ СЕКРЕТКИ!
</div>
            `
        },

        // ========== 8. РЕБИРТХ ==========
        {
            id: "rebirth",
            icon: "🔄",
            title: "Ребиртх (Престиж)",
            short: "Сброс ради постоянного множителя",
            content: `
<b>🔄 Ребиртх:</b> сброс всего ради <b>постоянного множителя</b> ко всему.

` + demo("ТАК ВЫГЛЯДИТ ИНФО-БЛОК РЕБИРТХА",
    `<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;max-width:280px;text-align:left;font-size:11px;line-height:1.8;">
        <div>🔄 Текущий ребёрн: <b>0</b></div>
        <div>⚡ Множитель: <b style="color:#ffd700;">x1.0</b></div>
        <div>🌍 Текущий мир: <b>Лес начала и конца</b></div>
        <div style="margin-top:6px;padding:6px 10px;background:rgba(0,0,0,0.4);border-radius:8px;font-size:12px;">
            📊 Достигнута волна: <b style="color:#f5af19;">85</b>
        </div>
        <div style="margin-top:10px;padding:10px;background:rgba(231,76,60,0.15);border:2px solid #e74c3c;border-radius:10px;">
            <div style="font-size:10px;color:#aaa;margin-bottom:4px;">ТРЕБОВАНИЕ ДЛЯ РЕБЁРНА 1:</div>
            <div style="font-size:12px;font-weight:bold;">👑 Победить босса:</div>
            <div style="font-size:14px;font-weight:900;color:#f5af19;margin-top:2px;">Волна 200</div>
            <div style="font-size:11px;color:#fff;margin-top:2px;">«Живой камень»</div>
            <div style="margin-top:6px;font-size:12px;color:#e74c3c;font-weight:bold;">❌ Условие ещё не выполнено</div>
        </div>
    </div>`,
    "Показывает требования, множитель и текущий мир."
) + `

` + demo("КНОПКА РЕБИРТХА",
    `<button class="btn btn-primary" style="padding:14px 24px;font-size:15px;font-weight:900;">🔄 Совершить Ребиртх!</button>`,
    "Кнопка неактивна, пока не выполнено требование. Как только готово — нажимай!"
) + `

<b>📈 Что даёт множитель:</b>
<div class="help-legend">
Ребиртх 1: x1.3 ко всему<br>
Ребиртх 2: x1.6<br>
Ребиртх 3: x1.9<br>
Ребиртх 5: x2.5<br>
Ребиртх 10: x4.0
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

<b>📋 Требования:</b>
<div class="help-legend">
Реб 1: победить Живого Камня (200)<br>
Реб 2: победить Путеводную Звезду (500)<br>
Реб 3: победить Короля Смерти (650)<br>
Реб 4: победить Астарота (800)<br>
Реб 5: победить Императора Хаоса (1000)<br>
Реб 6+: волны 1250, 1500, 1750...
</div>
            `
        },

        // ========== 9. ЕДА ==========
        {
            id: "food",
            icon: "🍔",
            title: "Еда, голод, ожирение",
            short: "Как кормить команду и что будет если не кормить",
            content: `
<b>🍽️ Голод:</b> растёт со временем. Влияет на HP и усталость.

` + demo("ТАК ВЫГЛЯДИТ ПОЛОСКА ГОЛОДА",
    `<div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;width:250px;">
        <div style="font-weight:800;font-size:13px;margin-bottom:6px;">🍽️ Голод: <span style="color:#f5af19;">55%</span></div>
        <div style="background:rgba(0,0,0,0.5);border-radius:6px;height:10px;overflow:hidden;">
            <div style="width:55%;height:10px;background:#f5af19;border-radius:6px;"></div>
        </div>
        <div style="font-weight:800;font-size:13px;margin-top:12px;">🍔 Ожирение: <span style="color:#e74c3c;">22/60 (Ож I)</span></div>
        <div style="background:rgba(0,0,0,0.5);border-radius:6px;height:10px;overflow:hidden;margin-top:6px;">
            <div style="width:37%;height:10px;background:#e67e22;border-radius:6px;"></div>
        </div>
    </div>`,
    "Полоска голода — чем краснее, тем меньше HP. Ожирение — замедляет сердце на арене."
) + `

` + demo("ТАК ВЫГЛЯДЯТ ПРОДУКТЫ В ИНВЕНТАРЕ",
    `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <div class="help-item-mock">
            <div style="font-size:32px;">🍏</div>
            <div style="font-size:10px;font-weight:800;margin-top:4px;">Яблоко</div>
            <div style="font-size:11px;font-weight:900;color:#f5af19;">x3</div>
        </div>
        <div class="help-item-mock">
            <div style="font-size:32px;">🍖</div>
            <div style="font-size:10px;font-weight:800;margin-top:4px;">Жар. мясо</div>
            <div style="font-size:11px;font-weight:900;color:#f5af19;">x1</div>
        </div>
        <div class="help-item-mock">
            <div style="font-size:32px;">🍯</div>
            <div style="font-size:10px;font-weight:800;margin-top:4px;">Мёд</div>
            <div style="font-size:11px;font-weight:900;color:#f5af19;">x2</div>
        </div>
    </div>`,
    "Клик по продукту в инвентаре → откроется меню «Съесть»."
) + `

<b>📊 Влияние голода на HP:</b>
<div class="help-legend">
Голод 0-30%:   ✅ норма (100% HP)<br>
Голод 30-60%:  ⚠️ -15% HP<br>
Голод 60-85%:  ⚠️ -40% HP<br>
Голод 85-100%: 💀 -70% HP
</div>

<b>📊 Влияние ожирения на скорость:</b>
<div class="help-legend">
Ож 0-19:   ✅ норма<br>
Ож 20-39:  🐢 скорость x0.75 (Ож I)<br>
Ож 40-59:  🐢 скорость x0.6 (Ож II)<br>
Ож 60:     🐌 скорость x0.5 (Ож III)
</div>

<b>☠️ Отравление:</b> от сырого мяса и ядовитых грибов. Тикает -2% HP/сек. Лечится 🧪 зельем или 💚 10 очками антидота.

<b>🍎 Полезные продукты:</b>
<div class="help-legend">
🍏 Яблоко: +5% HP, -10% голода<br>
🍉 Арбуз: +20% HP, -50% голода<br>
🍍 Ананас: +25% HP, -60% голода<br>
🍯 Мёд: реген 30% HP за 10 сек<br>
🥭 Манго: +8 антидота
</div>

<b>⚠️ Вредные:</b>
<div class="help-legend">
🍞 Хлеб: -40% голода, но +1 ожирение<br>
🥩 Сырое мясо: +15% HP, но отравление<br>
🌶️ Перец: +30% скорости, но -1% HP/сек
</div>
            `
        },

        // ========== 10. ИНВЕНТАРЬ ==========
        {
            id: "inventory",
            icon: "🎒",
            title: "Инвентарь и предметы",
            short: "Что можно носить и как использовать",
            content: `
<b>🎒 Инвентарь:</b> открывается в <b>Лавка → Инвентарь</b>. Здесь все твои предметы.

` + demo("ТАК ВЫГЛЯДИТ ПРЕДМЕТ В ИНВЕНТАРЕ",
    `<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <div class="help-item-mock" style="border-color:#f5af19;box-shadow:0 0 15px rgba(245,175,25,0.3);">
            <div style="font-size:36px;">⭐</div>
            <div style="font-size:11px;font-weight:800;margin-top:4px;color:#f5af19;">Звезда</div>
            <div style="font-size:12px;font-weight:900;color:#f5af19;">x12450</div>
        </div>
        <div class="help-item-mock" style="border-color:#ffd700;box-shadow:0 0 15px rgba(255,215,0,0.5);">
            <div style="font-size:36px;">🌟</div>
            <div style="font-size:11px;font-weight:800;margin-top:4px;">Путеводная</div>
            <div style="font-size:12px;font-weight:900;color:#f5af19;">x1</div>
        </div>
        <div class="help-item-mock">
            <div style="font-size:36px;">🦴</div>
            <div style="font-size:11px;font-weight:800;margin-top:4px;">Кость</div>
            <div style="font-size:12px;font-weight:900;color:#f5af19;">x87</div>
        </div>
    </div>`,
    "Клик по предмету → откроется меню с действиями (съесть, использовать, продать)."
) + `

` + demo("МЕНЮ ПРЕДМЕТА (ПРИ КЛИКЕ)",
    `<div style="background:linear-gradient(180deg,#1e1e2f,#151522);border:2px solid #f5af19;border-radius:14px;padding:12px;max-width:240px;">
        <div style="text-align:center;font-weight:900;font-size:14px;color:#f5af19;">🥩 СЫРОЕ МЯСО</div>
        <div style="text-align:center;font-size:10px;color:#aaa;margin:6px 0;">Количество: <b style="color:#f5af19;">3</b></div>
        <div style="background:rgba(0,0,0,0.3);padding:8px;border-radius:8px;font-size:10px;line-height:1.5;margin-bottom:8px;">
            Мясо, но есть сырым — плохая идея. +15% HP, но отравление на 60 сек.
        </div>
        <button class="btn btn-primary" style="width:100%;padding:8px;font-size:11px;margin-bottom:5px;">🍴 Съесть (ОПАСНО)</button>
        <button class="btn" style="width:100%;padding:8px;font-size:11px;background:linear-gradient(135deg,#f5af19,#f12711);color:white;border:none;">🔥 Пожарить (10⭐)</button>
    </div>`,
    "Кнопки действий зависят от предмета: съесть, пожарить, использовать, продать."
) + `

<b>📦 Ключевые предметы:</b>
<div class="help-legend">
🦴 <b>Кость</b> — продать за 1⭐<br>
🥩 <b>Сырое мясо</b> — есть (опасно) или жарить<br>
🍖 <b>Жареное мясо</b> — +25% HP, +2 ожирение<br>
🍄 <b>Гриб</b> — 50/50 волшебный/ядовитый<br>
🍯 <b>Мёд</b> — реген HP за 10 сек<br>
🌶️ <b>Перец</b> — скорость + жжёт<br>
🧊 <b>Лёд</b> — заморозка врага +5 кликов<br>
🥚 <b>Яйцо</b> — рандомная награда<br>
🧪 <b>Зелье</b> — снять отравление<br>
🔑 <b>Ключ Живого Камня</b> — открыть Тайник<br>
🌟 <b>Путеводная Звезда</b> — даёт 25 000⭐!
</div>

<b>💰 Продажа:</b> в <b>Лавка → Скупка</b> можно продать кости и другие предметы за звёзды.
            `
        },

        // ========== 11. ПРОМОКОДЫ ==========
        {
            id: "codes",
            icon: "🎁",
            title: "Промокоды",
            short: "Бесплатные награды по коду",
            content: `
<b>🎁 Промокоды:</b> введи код → получи награду. Вкладка <b>Прочее → Коды</b>.

` + demo("ТАК ВЫГЛЯДИТ ВВОД КОДА",
    `<div style="width:280px;">
        <input type="text" class="code-input" placeholder="Введите код..." value="DrinkTea2Win" readonly style="font-size:14px;padding:12px;">
        <button class="btn btn-primary" style="width:100%;padding:12px;font-size:14px;margin-top:8px;">Активировать</button>
        <div style="margin-top:10px;text-align:center;font-weight:900;font-size:18px;color:#2ecc71;">✅ Успешно активировано!</div>
    </div>`,
    "Введи код в поле и нажми «Активировать». Результат появится ниже."
) + `

<b>📋 Известные коды:</b>
<div class="help-legend">
<b style="color:#00ff88;">DrinkTea2Win</b> → 🥤 Пасхалка DrinkTea2Win<br>
<b style="color:#00ff88;">PELMESHKA</b> → 🥟 Пасхалка Пельмешка + 1000⭐<br>
<b style="color:#00ff88;">Хочу Звезды</b> → ⭐ 5000 звёзд<br>
<b style="color:#00ff88;">Сила</b> → 💪 Бафф урона x1.3 на сутки<br>
<b style="color:#00ff88;">789456123</b> → 👑 Модер-режим
</div>

<b>⚠️ Каждый код можно использовать 1 раз.</b>

<b>💡 Совет:</b> подписывайся на обновления — иногда выходят новые коды.
            `
        },

        // ========== 12. СИЛА ==========
        {
            id: "power",
            icon: "⚡",
            title: "Сила (Power Points)",
            short: "Отдельная валюта для мастерства",
            content: `
<b>⚡ Сила:</b> отдельная валюта. Используется ТОЛЬКО для прокачки мастерства карт.

` + demo("ТАК СИЛА ОТОБРАЖАЕТСЯ В ИГРЕ",
    `<div style="display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap;">
        <span style="font-size:22px;font-weight:900;color:#f5af19;">⭐ 12 450</span>
        <span style="font-size:20px;font-weight:900;color:#ffd700;display:inline-flex;align-items:center;gap:5px;">
            <span style="display:inline-block;width:22px;height:22px;vertical-align:middle;">
                <svg viewBox="0 0 24 24" style="width:100%;height:100%;filter:drop-shadow(0 0 5px #ffd700);"><path d="M13 2L4.5 13.5H11L10 22L19.5 9.5H13L13 2Z" fill="#ffd700" stroke="#ffaa00" stroke-width="1.5"/></svg>
            </span>
            <span>2 340</span> <span style="font-size:14px;">Силы</span>
        </span>
    </div>`,
    "Звёзды (⭐) — основная валюта. Сила (⚡) — для мастерства карт."
) + `

<b>📊 Где брать Силу:</b>
<div class="help-legend">
Волна 1-99:    +1 ⚡<br>
Волна 100-199: +2 ⚡<br>
Волна 200-299: +3 ⚡<br>
Волна 300-499: +5 ⚡<br>
Волна 500+:    +5-10 ⚡<br>
Босс:          +50 ⚡ бонусом
</div>

<b>🎯 Куда тратить:</b> только на мастерство карт (кнопка ⭐ на карточке карты).

<b>💡 Совет:</b> не копи слишком много — качай карты, что в отряде.
            `
        },

        // ========== 13. ЧЕКПОИНТЫ ==========
        {
            id: "checkpoints",
            icon: "🚩",
            title: "Чекпоинты",
            short: "Сохранение прогресса волн",
            content: `
<b>🚩 Чекпоинты:</b> каждые 50 волн открывается чекпоинт. При смерти можно вернуться.

` + demo("ТАК ВЫГЛЯДЯТ ЧЕКПОИНТЫ",
    `<div style="display:flex;flex-direction:column;gap:6px;width:280px;">
        <div class="help-stage-list" style="background:rgba(15,15,31,0.6);border-color:rgba(255,255,255,0.05);">
            <span style="color:#f5af19;">🚩</span>
            <div style="flex:1;">Волна 50</div>
            <button class="btn auto-active" style="padding:4px 10px;font-size:10px;background:transparent;border:2px solid #2ecc71;">Выбрано ✅</button>
        </div>
        <div class="help-stage-list" style="background:rgba(15,15,31,0.6);border-color:rgba(255,255,255,0.05);">
            <span style="color:#f5af19;">🚩</span>
            <div style="flex:1;">Волна 100</div>
            <button class="btn" style="padding:4px 10px;font-size:10px;">Выбрать ▶</button>
        </div>
        <div class="help-stage-list" style="background:rgba(15,15,31,0.6);border-color:rgba(255,255,255,0.05);opacity:0.5;">
            <span>🚩</span>
            <div style="flex:1;">Волна 150 🔒</div>
            <button class="btn" style="padding:4px 10px;font-size:10px;" disabled>Выбрать ▶</button>
        </div>
    </div>`,
    "Зелёная обводка — активный чекпоинт, при смерти вернёшься сюда."
) + `

<b>🎯 Как использовать:</b>
• <b>Клик по кнопке</b> — активировать чекпоинт
• При смерти — если есть активный, вернёшься туда
• Если нет активного — вернёшься на 1 волну

<b>🌟 Зено-бонус:</b> если Зено в отряде — 10% шанс открыть СЛЕДУЮЩИЙ чекпоинт автоматически при победе.
            `
        },

        // ========== 14. МИРЫ ==========
        {
            id: "worlds",
            icon: "🌍",
            title: "Миры и волны",
            short: "12 миров на 10000 волн",
            content: `
<b>🌍 Миры:</b> игра состоит из 12 миров, каждый со своим стилем.

` + demo("ТАК ПОКАЗАН ТЕКУЩИЙ МИР",
    `<div class="world-indicator" style="max-width:300px;">
        🌍 Мир: <span style="color:#2ecc71;">Лес начала и конца</span>
    </div>`,
    "Индикатор вверху экрана — всегда видно, в каком ты мире."
) + `

<b>📋 Все миры:</b>
<div class="help-legend">
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

<b>👑 Боссы</b> — каждые 50 волн. Уникальные боссы (50, 100, 150...) дают особые награды и иногда особые бои.
            `
        },

        // ========== 15. СОВЕТЫ ==========
        {
            id: "tips",
            icon: "💡",
            title: "Про-советы",
            short: "Топ-10 тактик для эффективной игры",
            content: `
<b>💡 Топ-10 советов от бывалых:</b>

<div class="help-legend" style="display:block;line-height:1.9;">

<b>1. Всегда щади уникальных боссов</b><br>
Пощада даёт эксклюзивные карты, которые нельзя получить иначе. Шанс 30%+.<br><br>

<b>2. Качай мастерство главных карт</b><br>
Скорость сердечка критична на арене. Сайтама (4.0) — топ, Киллуа (1.3) — хороший.<br><br>

<b>3. Держи комбо на кликере</b><br>
Кликай с интервалом 0.2-0.5 сек — держишь x2-x5 урон постоянно.<br><br>

<b>4. Не копи звёзды</b><br>
Трати на мастерство и апгрейды. Копи только на крутки и ребиртх.<br><br>

<b>5. АФК — твой друг</b><br>
Перед выходом из игры заполни АФК-отряд — нафармит оффлайн до 2 часов.<br><br>

<b>6. Не забывай про еду</b><br>
Голод 60%+ = -40% HP. Фрукты дёшевы, скупай их и ешь перед боем.<br><br>

<b>7. Используй пресеты отрядов</b><br>
Сохрани 2-3 сета: для кликера (макс урон), для арены (скорость), для АФК (HP).<br><br>

<b>8. Заходи каждый день</b><br>
Ежедневки + 2-часовые карты + промокоды = много ресурсов бесплатно.<br><br>

<b>9. Эволюции — цель на 5+ реб</b><br>
После 5 ребиртхов начинай собирать карты для эволюций — там топовые бойцы.<br><br>

<b>10. Настройки арены</b><br>
Включи авто-СУПЕР, если лень нажимать. Понизь эффекты на телефоне для FPS.
</div>
            `
        }
    ];

    // ========== КНОПКИ "?" У СЕКЦИЙ ==========
    const HELP_BUTTON_MAP = [
        { selector: 'button#claimCardBtn', section: 'cards' },
        { selector: '#teamList', section: 'team' },
        { selector: '#afkTeamList', section: 'team' },
        { selector: '#fatigueBar', section: 'clicker' },
        { selector: '#passContent', section: 'pass' },
        { selector: '#rebirthInfo', section: 'rebirth' },
        { selector: '#gachaItems', section: 'gacha' },
        { selector: '#inventoryContent', section: 'inventory' },
        { selector: '#checkpointList', section: 'checkpoints' },
        { selector: '#upgradeItems', section: 'power' },
        { selector: '#dailyRewardsList', section: 'codes' }
    ];

    // ========== РЕНДЕР ==========
    function renderHelpIndex() {
        let html = '';
        html += '<div style="text-align:center;margin-bottom:15px;">';
        html += '<div style="font-size:22px;font-weight:900;color:#f5af19;margin-bottom:5px;">📖 СПРАВКА ПО ИГРЕ</div>';
        html += '<div style="font-size:12px;color:#aaa;">Нажми на раздел — увидишь примеры прямо из игры</div>';
        html += '</div>';
        html += '<div style="display:grid;grid-template-columns:1fr;gap:8px;">';
        for (let s of HELP_SECTIONS) {
            html += '<div onclick="openHelpSection(\'' + s.id + '\')" style="background:rgba(0,0,0,0.4);padding:12px;border-radius:14px;cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:all 0.2s;display:flex;align-items:center;gap:10px;" onmouseover="this.style.background=\'rgba(245,175,25,0.15)\';this.style.borderColor=\'#f5af19\'" onmouseout="this.style.background=\'rgba(0,0,0,0.4)\';this.style.borderColor=\'rgba(255,255,255,0.08)\'">';
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
        if (!s) { renderHelpIndex(); return; }
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

    function openHelpSection(sectionId) { renderHelpSection(sectionId); }
    function closeHelpSection() { renderHelpIndex(); }

    // ========== ИНЪЕКЦИЯ ВКЛАДКИ ==========
    function injectHelpSubTab() {
        let subTabsContainer = document.querySelector('#otherTab .sub-tabs');
        if (!subTabsContainer) return false;
        if (document.getElementById('helpSubTabBtn')) return true;

        let btn = document.createElement('button');
        btn.className = 'sub-tab-btn';
        btn.setAttribute('data-subtab', 'help');
        btn.id = 'helpSubTabBtn';
        btn.innerHTML = '❓ Справка';
        btn.addEventListener('click', function() {
            let parent = document.getElementById('otherTab');
            parent.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            let content = document.getElementById('helpSubTab');
            if (content) content.classList.add('active');
            renderHelpIndex();
        });
        subTabsContainer.appendChild(btn);

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
            if (el.dataset && el.dataset.helpAdded === "1") continue;

            let target = el.closest('.card');
            if (!target) target = el;
            let title = target.querySelector('.card-title') || target;

            let qBtn = document.createElement('button');
            qBtn.className = 'help-q-btn';
            qBtn.innerHTML = '?';
            let sec = HELP_SECTIONS.find(s => s.id === item.section);
            qBtn.title = 'Справка: ' + (sec ? sec.title : '');
            qBtn.style.cssText = 'margin-left:6px;padding:0;width:20px;height:20px;border-radius:50%;background:#f5af19;color:#1a1a2e;font-weight:900;font-size:13px;border:none;cursor:pointer;line-height:1;vertical-align:middle;box-shadow:0 2px 6px rgba(245,175,25,0.4);';
            qBtn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                let helpBtn = document.getElementById('helpSubTabBtn');
                if (helpBtn) {
                    let otherTabBtn = document.querySelector('.tab-btn[data-tab="other"]');
                    if (otherTabBtn && !document.getElementById('otherTab').classList.contains('active')) {
                        otherTabBtn.click();
                    }
                    helpBtn.click();
                    setTimeout(function() { openHelpSection(item.section); }, 100);
                }
            };

            title.appendChild(qBtn);
            if (el.dataset) el.dataset.helpAdded = "1";
        }
    }

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
                setInterval(reInject, 2000);
                console.log("╔════════════════════════════════════════╗");
                console.log("║  📖 HELP SYSTEM v2.0 загружено        ║");
                console.log("║  15 разделов с примерами из игры      ║");
                console.log("║  Вкладка: Прочее → ❓ Справка         ║");
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
