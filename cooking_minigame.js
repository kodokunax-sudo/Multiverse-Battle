// ============================================================
// MULTIVERSE BATTLE — COOKING MINI-GAME
// Three-stage timing challenge: heat, flip, remove from the pan.
// Ingredients and stars are only consumed when the result is claimed.
// ============================================================
(function () {
    "use strict";

    var overlay = null;
    var styleNode = null;
    var frameId = 0;
    var keyHandler = null;
    var previousBodyOverflow = "";
    var session = null;

    var STAGES = [
        {
            title: "Поймай правильный жар",
            short: "РАЗОГРЕВ",
            icon: "🔥",
            instruction: "Маркер движется по шкале температуры. Нажми, когда он войдёт в золотую зону.",
            button: "🔥 Проверить температуру",
            speed: 34,
            duration: 12000,
            zone: 30,
            sweet: 11
        },
        {
            title: "Переверни мясо",
            short: "ПЕРЕВОРОТ",
            icon: "🍳",
            instruction: "Первая сторона схватилась. Поймай узкое окно и переверни кусок, не уронив его.",
            button: "🍳 Перевернуть",
            speed: 39,
            duration: 11000,
            zone: 27,
            sweet: 10
        },
        {
            title: "Не передержи!",
            short: "СНЯТИЕ С ОГНЯ",
            icon: "⏱️",
            instruction: "Последний момент: сними мясо с огня точно по таймингу. Здесь окно самое узкое.",
            button: "🥩 Снять с огня",
            speed: 44,
            duration: 10000,
            zone: 24,
            sweet: 9
        }
    ];

    function injectStyles() {
        if (styleNode) return;
        styleNode = document.createElement("style");
        styleNode.id = "mbCookingMiniGameStyles";
        styleNode.textContent = [
            "#mbCookingOverlay{position:fixed;inset:0;z-index:100500;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(4,5,11,.94);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);font-family:Nunito,Arial,sans-serif;color:#f8f5ed;overscroll-behavior:contain}",
            "#mbCookingOverlay *{box-sizing:border-box}",
            ".mb-cook-shell{width:min(720px,100%);max-height:calc(100dvh - 24px);overflow:auto;border:1px solid rgba(244,177,69,.35);border-radius:22px;background:radial-gradient(ellipse at 50% 0%,rgba(184,91,33,.18),transparent 45%),linear-gradient(160deg,#24202a,#11131d 72%);box-shadow:0 24px 90px rgba(0,0,0,.65),0 0 45px rgba(220,117,40,.08);scrollbar-width:thin;scrollbar-color:#80552d transparent}",
            ".mb-cook-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;background:rgba(20,19,28,.94);border-bottom:1px solid rgba(255,255,255,.07);backdrop-filter:blur(8px)}",
            ".mb-cook-brand{display:flex;align-items:center;gap:10px;min-width:0}",
            ".mb-cook-brand-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:linear-gradient(145deg,#6f3c22,#2a1c1c);border:1px solid rgba(255,176,91,.3);font-size:23px;flex:none}",
            ".mb-cook-brand strong{display:block;font-size:16px;letter-spacing:.5px}",
            ".mb-cook-brand small{display:block;margin-top:2px;font-size:10px;color:#a7a0a4;letter-spacing:1.5px;font-weight:900}",
            ".mb-cook-close{width:38px;height:38px;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:rgba(255,255,255,.06);color:#eee;font-size:20px;cursor:pointer;flex:none}",
            ".mb-cook-body{padding:20px}",
            ".mb-cook-progress{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px}",
            ".mb-cook-progress span{height:5px;border-radius:9px;background:rgba(255,255,255,.09);overflow:hidden}",
            ".mb-cook-progress span.done{background:linear-gradient(90deg,#b96d32,#ffd078);box-shadow:0 0 10px rgba(240,169,82,.25)}",
            ".mb-cook-kicker{font-size:10px;letter-spacing:1.8px;font-weight:900;color:#dca05b;text-align:center}",
            ".mb-cook-title{margin:6px 0 7px;text-align:center;font-size:clamp(21px,4vw,29px);font-weight:1000;line-height:1.15}",
            ".mb-cook-copy{max-width:520px;margin:0 auto;color:#b9b2b3;text-align:center;font-size:13px;line-height:1.55}",
            ".mb-cook-scene{position:relative;display:flex;align-items:center;justify-content:center;min-height:155px;margin:20px 0 18px;border:1px solid rgba(255,255,255,.06);border-radius:18px;overflow:hidden;background:radial-gradient(ellipse at 50% 85%,rgba(226,104,39,.17),transparent 40%),linear-gradient(180deg,rgba(255,255,255,.025),rgba(0,0,0,.18))}",
            ".mb-cook-stove{position:absolute;bottom:18px;width:min(270px,70%);height:16px;border-radius:50%;background:linear-gradient(90deg,transparent,#242832 15%,#3d3b43 50%,#242832 85%,transparent);filter:drop-shadow(0 7px 6px rgba(0,0,0,.55))}",
            ".mb-cook-pan{position:relative;display:grid;place-items:center;width:154px;height:82px;border-radius:0 0 72px 72px;border:7px solid #55545a;border-top:5px solid #79777b;background:radial-gradient(ellipse at 50% 25%,#3e3b3b,#18191e 73%);box-shadow:0 12px 22px rgba(0,0,0,.5),inset 0 5px 12px rgba(0,0,0,.7);transform:perspective(180px) rotateX(-8deg)}",
            ".mb-cook-pan:after{content:'';position:absolute;right:-65px;top:17px;width:72px;height:13px;border-radius:8px;background:linear-gradient(180deg,#77747a,#39383e);transform:rotate(5deg);box-shadow:0 3px 6px rgba(0,0,0,.45)}",
            ".mb-cook-food{position:relative;z-index:1;font-size:43px;filter:drop-shadow(0 4px 3px rgba(0,0,0,.65));animation:mbCookSizzle .5s ease-in-out infinite alternate}",
            ".mb-cook-steam{position:absolute;top:21px;left:50%;font-size:19px;letter-spacing:14px;opacity:.55;transform:translateX(-50%);animation:mbCookSteam 2s ease-in-out infinite}",
            "@keyframes mbCookSizzle{from{transform:rotate(-4deg) translateY(0)}to{transform:rotate(4deg) translateY(-3px)}}",
            "@keyframes mbCookSteam{0%,100%{opacity:.2;transform:translate(-50%,4px)}50%{opacity:.7;transform:translate(-50%,-7px)}}",
            ".mb-cook-phase-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 9px}",
            ".mb-cook-phase-tag{font-size:10px;font-weight:1000;letter-spacing:1.4px;color:#e7b77a}",
            ".mb-cook-clock{font-size:12px;font-weight:900;color:#f0d4a7;font-variant-numeric:tabular-nums}",
            ".mb-cook-track{position:relative;height:34px;border:1px solid rgba(255,255,255,.16);border-radius:11px;background:linear-gradient(90deg,#6b2828 0%,#9b542f 22%,#b88c43 50%,#9b542f 78%,#6b2828 100%);box-shadow:inset 0 3px 8px rgba(0,0,0,.55);overflow:hidden}",
            ".mb-cook-track:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(10% - 1px),rgba(0,0,0,.18) calc(10% - 1px),rgba(0,0,0,.18) 10%)}",
            ".mb-cook-zone{position:absolute;top:0;bottom:0;background:rgba(255,214,116,.28);border-left:2px solid #ffdc83;border-right:2px solid #ffdc83;box-shadow:0 0 18px rgba(255,197,92,.35)}",
            ".mb-cook-sweet{position:absolute;top:0;bottom:0;background:rgba(255,245,199,.48);border-left:1px solid #fff4ce;border-right:1px solid #fff4ce}",
            ".mb-cook-marker{position:absolute;top:-3px;bottom:-3px;width:4px;border-radius:4px;background:#fff;box-shadow:0 0 9px #fff,0 0 18px #ffd27d;transform:translateX(-50%)}",
            ".mb-cook-track-legend{display:flex;justify-content:space-between;margin-top:6px;color:#817c83;font-size:9px;font-weight:800;letter-spacing:.5px}",
            ".mb-cook-feedback{min-height:38px;margin:13px 0 9px;text-align:center;font-size:13px;line-height:1.45;color:#c8c0c0}",
            ".mb-cook-feedback strong{color:#ffcf82}",
            ".mb-cook-primary{display:block;width:100%;min-height:49px;margin-top:10px;padding:12px 16px;border:0;border-radius:13px;background:linear-gradient(135deg,#e99b42,#b95127);box-shadow:0 7px 22px rgba(176,82,37,.23);color:#24170f;font:1000 14px Nunito,Arial,sans-serif;cursor:pointer;touch-action:manipulation}",
            ".mb-cook-primary:active{transform:translateY(1px);filter:brightness(.94)}",
            ".mb-cook-secondary{display:block;width:100%;min-height:43px;margin-top:8px;padding:10px 14px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.055);color:#ddd;font:800 12px Nunito,Arial,sans-serif;cursor:pointer;touch-action:manipulation}",
            ".mb-cook-cost{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:13px;color:#aaa;font-size:11px;font-weight:800}",
            ".mb-cook-cost b{color:#f0c17d}",
            ".mb-cook-score{display:grid;place-items:center;width:104px;height:104px;margin:18px auto 12px;border-radius:50%;border:3px solid #dca15d;background:radial-gradient(circle,#473020,#211b20 72%);box-shadow:0 0 26px rgba(229,157,77,.13);font-size:30px;font-weight:1000;color:#ffdc9c}",
            ".mb-cook-result-list{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}",
            ".mb-cook-result-item{padding:10px 7px;border-radius:11px;text-align:center;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.06)}",
            ".mb-cook-result-item b{display:block;color:#f3c27e;font-size:17px}",
            ".mb-cook-result-item small{display:block;margin-top:3px;color:#999;font-size:9px;font-weight:900;letter-spacing:.5px}",
            ".mb-cook-outcome{padding:14px;border:1px solid rgba(255,207,130,.24);border-radius:14px;background:rgba(203,119,54,.08);text-align:center}",
            ".mb-cook-outcome-icon{font-size:34px}",
            ".mb-cook-outcome strong{display:block;margin-top:4px;font-size:17px}",
            ".mb-cook-outcome small{display:block;margin-top:5px;color:#b9b0a8;line-height:1.45}",
            ".mb-cook-footnote{text-align:center;margin-top:12px;color:#77717a;font-size:10px;line-height:1.45}",
            "@media(max-width:540px){#mbCookingOverlay{padding:7px}.mb-cook-shell{max-height:calc(100dvh - 14px);border-radius:16px}.mb-cook-head{padding:11px 12px}.mb-cook-body{padding:14px 12px 16px}.mb-cook-brand-icon{width:36px;height:36px}.mb-cook-brand strong{font-size:14px}.mb-cook-scene{min-height:125px;margin:15px 0}.mb-cook-pan{transform:scale(.88) perspective(180px) rotateX(-8deg)}.mb-cook-result-list{gap:5px}.mb-cook-result-item{padding:8px 3px}}",
            "@media(prefers-reduced-motion:reduce){.mb-cook-food,.mb-cook-steam{animation:none!important}}"
        ].join("\n");
        document.head.appendChild(styleNode);
    }

    function makeOverlay() {
        injectStyles();
        overlay = document.createElement("div");
        overlay.id = "mbCookingOverlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Мини-игра готовки");
        overlay.addEventListener("click", onOverlayClick);
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.appendChild(overlay);
    }

    function header() {
        return '<div class="mb-cook-shell">' +
            '<div class="mb-cook-head">' +
                '<div class="mb-cook-brand"><div class="mb-cook-brand-icon">🍳</div><div><strong>Кухня</strong><small>MULTIVERSE BATTLE · COOKING</small></div></div>' +
                '<button class="mb-cook-close" type="button" data-mb-cook-action="cancel" aria-label="Отменить готовку" title="Отменить">×</button>' +
            '</div><div class="mb-cook-body">';
    }

    function footer() {
        return '</div></div>';
    }

    function progressBars(active) {
        var html = '<div class="mb-cook-progress">';
        for (var i = 0; i < 3; i++) html += '<span class="' + (i < active ? "done" : "") + '"></span>';
        return html + '</div>';
    }

    function scene(icon) {
        return '<div class="mb-cook-scene"><div class="mb-cook-steam">﹏ ﹏ ﹏</div><div class="mb-cook-pan"><div class="mb-cook-food">' + icon + '</div></div><div class="mb-cook-stove"></div></div>';
    }

    function costText() {
        var isModer = typeof mode !== "undefined" && mode === "moder";
        return '<div class="mb-cook-cost"><span>🥩 1 сырое мясо</span><span>⭐ <b>' + (isModer ? "БЕСПЛАТНО · МОДЕР" : "10 за готовку") + '</b></span></div>';
    }

    function renderIntro() {
        overlay.innerHTML = header() +
            '<div class="mb-cook-kicker">ПОДГОТОВКА ИНГРЕДИЕНТА</div>' +
            '<h2 class="mb-cook-title">Приготовь мясо сам</h2>' +
            '<p class="mb-cook-copy">Три точных действия отделяют сочное мясо от подгоревшего. Следи за маркером и нажимай в нужный момент.</p>' +
            scene("🥩") +
            '<div class="mb-cook-result-list">' +
                '<div class="mb-cook-result-item"><b>1</b><small>ПОЙМАТЬ ЖАР</small></div>' +
                '<div class="mb-cook-result-item"><b>2</b><small>ПЕРЕВЕРНУТЬ</small></div>' +
                '<div class="mb-cook-result-item"><b>3</b><small>СНЯТЬ С ОГНЯ</small></div>' +
            '</div>' +
            '<div class="mb-cook-feedback">В каждом этапе есть широкая золотая зона и узкая идеальная точка. Чем точнее попадания, тем лучше блюдо.</div>' +
            '<button class="mb-cook-primary" type="button" data-mb-cook-action="begin">🔥 Разжечь плиту</button>' +
            costText() +
            '<div class="mb-cook-footnote">Отмена не расходует мясо и звёзды. Оплата происходит только после получения блюда.</div>' +
            footer();
    }

    function beginStage() {
        if (!session || session.stage >= STAGES.length) return;
        var cfg = STAGES[session.stage];
        session.state = "active";
        session.position = 5 + Math.random() * 12;
        session.direction = 1;
        session.target = 25 + Math.random() * 50;
        session.startedAt = performance.now();
        session.lastFrameAt = session.startedAt;
        session.remaining = cfg.duration;
        session.zone = cfg.zone;
        session.sweet = cfg.sweet;
        renderStage();
        cancelFrame();
        frameId = requestAnimationFrame(tick);
    }

    function renderStage() {
        var cfg = STAGES[session.stage];
        var left = session.target - cfg.zone / 2;
        var sweetLeft = session.target - cfg.sweet / 2;
        var foodIcon = session.stage === 0 ? "🔥" : session.stage === 1 ? "🥩" : "🍳";
        overlay.innerHTML = header() +
            progressBars(session.stage) +
            '<div class="mb-cook-kicker">ЭТАП ' + (session.stage + 1) + ' ИЗ 3 · ' + cfg.short + '</div>' +
            '<h2 class="mb-cook-title">' + cfg.title + '</h2>' +
            '<p class="mb-cook-copy">' + cfg.instruction + '</p>' +
            scene(foodIcon) +
            '<div class="mb-cook-phase-row"><span class="mb-cook-phase-tag">ЗОЛОТАЯ ЗОНА · ИДЕАЛЬНАЯ ТОЧКА В ЦЕНТРЕ</span><span class="mb-cook-clock" id="mbCookClock">--.-с</span></div>' +
            '<div class="mb-cook-track" id="mbCookTrack">' +
                '<div class="mb-cook-zone" style="left:' + left + '%;width:' + cfg.zone + '%"></div>' +
                '<div class="mb-cook-sweet" style="left:' + sweetLeft + '%;width:' + cfg.sweet + '%"></div>' +
                '<div class="mb-cook-marker" id="mbCookMarker" style="left:' + session.position + '%"></div>' +
            '</div>' +
            '<div class="mb-cook-track-legend"><span>СЛАБО</span><span>ТОЧНОСТЬ</span><span>ПЕРЕЖАР</span></div>' +
            '<div class="mb-cook-feedback" id="mbCookFeedback">Нажми один раз в нужный момент. Промах снизит качество блюда, но не отменит всю готовку.</div>' +
            '<button class="mb-cook-primary" type="button" data-mb-cook-action="strike">' + cfg.button + '</button>' +
            costText() +
            footer();
    }

    function tick(now) {
        if (!session || session.state !== "active") return;
        var cfg = STAGES[session.stage];
        var dt = Math.min(0.06, Math.max(0, (now - session.lastFrameAt) / 1000));
        session.lastFrameAt = now;
        session.remaining = Math.max(0, cfg.duration - (now - session.startedAt));

        session.position += session.direction * cfg.speed * dt;
        if (session.position >= 98) { session.position = 98; session.direction = -1; }
        if (session.position <= 2) { session.position = 2; session.direction = 1; }

        var marker = document.getElementById("mbCookMarker");
        if (marker) marker.style.left = session.position + "%";
        var clock = document.getElementById("mbCookClock");
        if (clock) clock.textContent = (session.remaining / 1000).toFixed(1) + "с";

        if (session.remaining <= 0) {
            lockStage(true);
            return;
        }
        frameId = requestAnimationFrame(tick);
    }

    function calculateScore() {
        var distance = Math.abs(session.position - session.target);
        var sweetHalf = session.sweet / 2;
        var zoneHalf = session.zone / 2;
        if (distance <= sweetHalf + 1.2) return 100;
        if (distance <= zoneHalf) {
            return Math.max(72, Math.round(96 - ((distance - sweetHalf) / Math.max(1, zoneHalf - sweetHalf)) * 22));
        }
        return Math.max(0, Math.round(58 - (distance - zoneHalf) * 4.3));
    }

    function scoreLabel(score, timedOut) {
        if (timedOut) return "Время вышло. Мясо ещё можно спасти, но качество пострадало.";
        if (score >= 96) return "Идеально! Ты попал прямо в точку.";
        if (score >= 78) return "Хорошо! Мясо приготовлено почти безупречно.";
        if (score >= 50) return "Есть небольшой промах. Продолжай внимательно.";
        return "Момент упущен. Следующий этап всё ещё можно пройти.";
    }

    function lockStage(timedOut) {
        if (!session || session.state !== "active") return;
        cancelFrame();
        var score = timedOut ? 0 : calculateScore();
        session.scores.push(score);
        session.state = "stepResult";
        renderStepResult(score, !!timedOut);
    }

    function renderStepResult(score, timedOut) {
        var cfg = STAGES[session.stage];
        var grade = score >= 96 ? "ТОЧНО В ЦЕНТР" : score >= 78 ? "ХОРОШО" : score >= 50 ? "НЕПЛОХО" : "ПРОМАХ";
        var nextText = session.stage === 2 ? "Подвести итог" : "Следующий этап →";
        overlay.innerHTML = header() +
            progressBars(session.stage + 1) +
            '<div class="mb-cook-kicker">ЭТАП ' + (session.stage + 1) + ' ЗАВЕРШЁН · ' + cfg.short + '</div>' +
            '<h2 class="mb-cook-title">' + grade + '</h2>' +
            '<div class="mb-cook-score">' + score + '</div>' +
            '<p class="mb-cook-copy">' + scoreLabel(score, timedOut) + '</p>' +
            scene(score >= 78 ? "🥩" : score >= 50 ? "🍖" : "🥓") +
            '<div class="mb-cook-feedback">Точность этапа: <strong>' + score + '/100</strong>. ' +
                (score >= 96 ? "Так держать!" : session.stage < 2 ? "Впереди ещё один этап, постарайся точнее." : "Это последний этап. Теперь результат определит качество блюда.") + '</div>' +
            '<button class="mb-cook-primary" type="button" data-mb-cook-action="next">' + nextText + '</button>' +
            costText() +
            footer();
    }

    function getOutcome() {
        var total = session.scores.reduce(function (sum, value) { return sum + value; }, 0);
        var average = Math.round(total / STAGES.length);
        var weakest = Math.min.apply(Math, session.scores);
        if (average >= 88 && weakest >= 72) {
            return {
                id: "perfect_cooked_meat",
                icon: "🥩✨",
                name: "Идеально жареное мясо",
                detail: "Золотистая корочка, сочная середина. Лучший результат!",
                average: average
            };
        }
        if (average >= 45) {
            return {
                id: "cooked_meat",
                icon: "🍖",
                name: "Жареное мясо",
                detail: "Нормальная прожарка. Получилось вполне съедобно.",
                average: average
            };
        }
        return {
            id: "burnt_meat",
            icon: "🥓",
            name: "Подгоревшее мясо",
            detail: "Жар был упущен. В следующий раз следи за сковородой.",
            average: average
        };
    }

    function renderFinal() {
        session.state = "final";
        session.outcome = getOutcome();
        var outcome = session.outcome;
        overlay.innerHTML = header() +
            progressBars(3) +
            '<div class="mb-cook-kicker">ГОТОВКА ЗАВЕРШЕНА</div>' +
            '<h2 class="mb-cook-title">Что получилось?</h2>' +
            '<div class="mb-cook-score">' + outcome.average + '</div>' +
            '<div class="mb-cook-outcome"><div class="mb-cook-outcome-icon">' + outcome.icon + '</div><strong>' + outcome.name + '</strong><small>' + outcome.detail + '</small></div>' +
            '<div class="mb-cook-result-list">' +
                '<div class="mb-cook-result-item"><b>' + session.scores[0] + '</b><small>ЖАР</small></div>' +
                '<div class="mb-cook-result-item"><b>' + session.scores[1] + '</b><small>ПЕРЕВОРОТ</small></div>' +
                '<div class="mb-cook-result-item"><b>' + session.scores[2] + '</b><small>СНЯТИЕ</small></div>' +
            '</div>' +
            '<button class="mb-cook-primary" type="button" data-mb-cook-action="collect">🍽️ Забрать блюдо</button>' +
            '<button class="mb-cook-secondary" type="button" data-mb-cook-action="cancel">Отменить и не тратить ресурсы</button>' +
            costText() +
            '<div class="mb-cook-footnote">Мясо и 10⭐ будут списаны только после нажатия «Забрать блюдо».</div>' +
            footer();
    }

    function nextStage() {
        if (!session || session.state !== "stepResult") return;
        session.stage++;
        if (session.stage >= STAGES.length) renderFinal();
        else beginStage();
    }

    function collectResult() {
        if (!session || session.state !== "final" || !session.outcome) return;
        if (typeof window.completeMeatCooking !== "function") {
            var noHandler = overlay.querySelector(".mb-cook-footnote");
            if (noHandler) noHandler.textContent = "Не удалось связаться с инвентарём. Ничего не списано. Закрой окно и попробуй ещё раз.";
            return;
        }
        var success = false;
        try { success = window.completeMeatCooking(session.outcome.id) === true; }
        catch (error) { console.error("[COOKING] Не удалось сохранить блюдо:", error); }
        if (!success) {
            var feedback = overlay.querySelector(".mb-cook-footnote");
            if (feedback) feedback.textContent = "Блюдо не было выдано: проверь наличие сырого мяса, 10⭐ и свободное место в стопке. Ресурсы не списаны.";
            return;
        }
        closeMiniGame();
    }

    function onOverlayClick(event) {
        var target = event.target && event.target.closest ? event.target.closest("[data-mb-cook-action]") : null;
        if (!target || !overlay || !overlay.contains(target)) return;
        var action = target.getAttribute("data-mb-cook-action");
        if (action === "cancel") closeMiniGame();
        else if (action === "begin" && session && session.state === "intro") beginStage();
        else if (action === "strike" && session && session.state === "active") lockStage(false);
        else if (action === "next" && session && session.state === "stepResult") nextStage();
        else if (action === "collect" && session && session.state === "final") collectResult();
    }

    function onKeyDown(event) {
        if (!session || !overlay) return;
        if (event.key === "Escape") {
            event.preventDefault();
            closeMiniGame();
            return;
        }
        if ((event.code === "Space" || event.key === "Enter") && !event.repeat) {
            var action = session.state === "active" ? "strike" :
                session.state === "intro" ? "begin" :
                session.state === "stepResult" ? "next" :
                session.state === "final" ? "collect" : "";
            if (action) {
                event.preventDefault();
                var button = overlay.querySelector('[data-mb-cook-action="' + action + '"]');
                if (button && !button.disabled) button.click();
            }
        }
    }

    function cancelFrame() {
        if (frameId) {
            cancelAnimationFrame(frameId);
            frameId = 0;
        }
    }

    function closeMiniGame() {
        cancelFrame();
        if (keyHandler) {
            document.removeEventListener("keydown", keyHandler, true);
            keyHandler = null;
        }
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
        session = null;
        if (document.body) document.body.style.overflow = previousBodyOverflow;
    }

    function startCookingMiniGame() {
        if (session) return false;
        if (!document || !document.body) return false;
        if (typeof window.getItemCount === "function" && window.getItemCount("raw_meat") < 1) {
            if (typeof window.showFloatingText === "function") window.showFloatingText("Нет сырого мяса!", "#ff3333");
            return false;
        }
        if (typeof window.closeModal === "function") window.closeModal();

        session = { state: "intro", stage: 0, scores: [], position: 0, direction: 1, target: 50 };
        makeOverlay();
        renderIntro();
        keyHandler = onKeyDown;
        document.addEventListener("keydown", keyHandler, true);
        var startButton = overlay.querySelector('[data-mb-cook-action="begin"]');
        if (startButton) startButton.focus();
        return true;
    }

    window.startCookingMiniGame = startCookingMiniGame;
    window.closeCookingMiniGame = closeMiniGame;
    console.log("[COOKING] Three-stage timing mini-game loaded");
})();