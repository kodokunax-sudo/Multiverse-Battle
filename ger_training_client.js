/* Persistent learning storage for Golden Experience Requiem. */
(function () {
    "use strict";

    var ENDPOINT = "https://zdqogypbbbixwiqwuhxp.supabase.co/functions/v1/ger-training";
    var API_KEY = "sb_publishable_qbyB9Iy18uaiv1YIsHepkQ_cqDYdKGE";

    var sessionId = null;
    var activeBossKey = null;
    var startPromise = null;
    var flushPromise = null;
    var finishPromise = null;
    var flushTimer = 0;
    var queue = [];
    var brainByBoss = Object.create(null);

    function makeUuid() {
        try {
            if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
        } catch (_error) {}
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === "x" ? r : (r & 3 | 8)).toString(16);
        });
    }

    function getGameAuthClient() {
        try {
            if (!window.MBClans ||
                typeof window.MBClans.getCurrentUserId !== "function" ||
                !window.MBClans.getCurrentUserId() ||
                typeof window.MBClans.getArenaContext !== "function") return null;
            var context = window.MBClans.getArenaContext();
            return context && context.client && context.client.auth ? context.client : null;
        } catch (_error) {
            return null;
        }
    }

    async function post(payload) {
        var client = getGameAuthClient();
        if (!client) return null;

        var sessionResult = await client.auth.getSession();
        if (sessionResult.error) throw sessionResult.error;
        var authSession = sessionResult.data && sessionResult.data.session;
        var accessToken = authSession && authSession.access_token;
        if (!accessToken) return null;

        var response = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": API_KEY,
                "Authorization": "Bearer " + accessToken
            },
            body: JSON.stringify(payload)
        });
        var data = await response.json().catch(function () { return null; });
        if (!response.ok) {
            var reason = data && data.error ? data.error : "training_request_failed";
            throw new Error(reason);
        }
        return data;
    }

    function scheduleFlush() {
        if (flushTimer || !sessionId || !queue.length) return;
        flushTimer = window.setTimeout(function () {
            flushTimer = 0;
            flush();
        }, 1400);
    }

    function flush() {
        if (flushPromise) return flushPromise;
        if (!sessionId || !queue.length) return Promise.resolve(true);

        var batch = queue.splice(0, 40);
        var currentSessionId = sessionId;
        var currentBossKey = activeBossKey;
        flushPromise = (async function () {
            try {
                var result = await post({
                    action: "events",
                    sessionId: currentSessionId,
                    bossKey: currentBossKey,
                    events: batch
                });
                if (!result || result.ok !== true) {
                    queue = batch.concat(queue);
                    return false;
                }
                return true;
            } catch (error) {
                queue = batch.concat(queue);
                console.warn("[GER training] Event batch was kept for retry:", error && error.message ? error.message : error);
                return false;
            }
        })().finally(function () {
            flushPromise = null;
            if (queue.length) scheduleFlush();
        });
        return flushPromise;
    }

    async function loadBrain(bossKey) {
        try {
            var data = await post({ action: "brain", bossKey: bossKey });
            if (!data) return null;
            var entry = { attacks: Object.create(null), directions: Object.create(null), loadedAt: Date.now() };
            (Array.isArray(data.brain) ? data.brain : []).forEach(function (row) {
                if (!row || !row.attack_key) return;
                entry.attacks[String(row.attack_key)] = row;
            });
            (Array.isArray(data.directions) ? data.directions : []).forEach(function (row) {
                if (!row || !row.attack_key) return;
                entry.directions[String(row.attack_key) + "|" + String(row.direction)] = row;
            });
            brainByBoss[bossKey] = entry;
            return entry;
        } catch (error) {
            console.warn("[GER training] Could not load learned dodge data:", error && error.message ? error.message : error);
            return null;
        }
    }

    async function start(bossKey, metadata) {
        bossKey = String(bossKey || "unknown").slice(0, 64);
        if (sessionId && activeBossKey === bossKey) {
            await loadBrain(bossKey);
            return { sessionId: sessionId, resumed: true };
        }
        if (startPromise) {
            await startPromise;
            if (sessionId && activeBossKey === bossKey) return { sessionId: sessionId, resumed: true };
        }
        if (sessionId && activeBossKey !== bossKey) {
            var finished = await finish("aborted");
            if (!finished) return null;
        }

        startPromise = (async function () {
            try {
                var result = await post({
                    action: "start",
                    clientSessionId: makeUuid(),
                    bossKey: bossKey,
                    gameVersion: "ger-dodge-training-1",
                    arenaMode: "unique-boss",
                    metadata: metadata && typeof metadata === "object" ? metadata : {}
                });
                if (!result || !result.sessionId) return null;
                sessionId = result.sessionId;
                activeBossKey = bossKey;
                await loadBrain(bossKey);
                scheduleFlush();
                return result;
            } catch (error) {
                console.warn("[GER training] Session could not be started:", error && error.message ? error.message : error);
                return null;
            }
        })();

        try {
            return await startPromise;
        } finally {
            startPromise = null;
        }
    }

    function recordOutcome(sample, outcome, damageTaken) {
        if ((!sessionId && !startPromise) || !sample || !activeBossKey) return false;
        var row = Object.assign({}, sample, {
            eventId: makeUuid(),
            outcome: outcome === "evaded" || outcome === "hit" || outcome === "blocked" ? outcome : "unknown",
            damageTaken: Math.max(0, Number(damageTaken) || 0)
        });
        queue.push(row);
        if (queue.length > 240) queue.splice(0, queue.length - 240);
        if (queue.length >= 12) flush();
        else scheduleFlush();
        return true;
    }

    async function finish(result) {
        if (finishPromise) return finishPromise;
        if (startPromise) {
            try { await startPromise; } catch (_error) {}
        }
        if (!sessionId) return true;

        finishPromise = (async function () {
            try {
                if (flushTimer) {
                    window.clearTimeout(flushTimer);
                    flushTimer = 0;
                }
                var sent = await flush();
                if (!sent || queue.length) {
                    scheduleFlush();
                    return false;
                }
                var response = await post({
                    action: "finish",
                    sessionId: sessionId,
                    result: result === "win" || result === "loss" || result === "draw" ? result : "aborted"
                });
                if (!response || response.ok !== true) return false;
                sessionId = null;
                activeBossKey = null;
                return true;
            } catch (error) {
                console.warn("[GER training] Could not finish training session:", error && error.message ? error.message : error);
                scheduleFlush();
                return false;
            }
        })().finally(function () {
            finishPromise = null;
        });
        return finishPromise;
    }

    function getDirectionStats(bossKey, attackKey, direction) {
        var boss = brainByBoss[String(bossKey || "")];
        if (!boss) return null;
        return boss.directions[String(attackKey || "") + "|" + String(direction)] || null;
    }

    function getAttackStats(bossKey, attackKey) {
        var boss = brainByBoss[String(bossKey || "")];
        if (!boss) return null;
        return boss.attacks[String(attackKey || "")] || null;
    }

    window.MBGERTraining = {
        start: start,
        finish: finish,
        recordOutcome: recordOutcome,
        getDirectionStats: getDirectionStats,
        getAttackStats: getAttackStats
    };
})();