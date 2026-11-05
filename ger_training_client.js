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
            if (!window.MBClans || typeof window.MBClans.getArenaContext !== "function") return null;
            var context = window.MBClans.getArenaContext();
            return context && context.client && context.client.auth ? context.client : null;
        } catch (_error) {
            return null;
        }
    }

    async function requireOnlineSession() {
        var client = getGameAuthClient();
        if (!client) throw new Error("game_auth_client_unavailable");
        var result = await client.auth.getSession();
        if (result.error) throw result.error;
        var authSession = result.data && result.data.session;
        if (!authSession || !authSession.access_token) throw new Error("game_account_not_signed_in");
        var verified = await client.auth.getUser(authSession.access_token);
        if (verified.error || !verified.data || !verified.data.user) {
            var refreshed = await client.auth.refreshSession();
            if (refreshed.error || !refreshed.data || !refreshed.data.session) {
                throw new Error("game_session_expired");
            }
            var secondCheck = await client.auth.getUser(refreshed.data.session.access_token);
            if (secondCheck.error || !secondCheck.data || !secondCheck.data.user) {
                throw new Error("game_session_not_verified");
            }
            return { client: client, user: secondCheck.data.user, session: refreshed.data.session };
        }
        return { client: client, user: verified.data.user, session: authSession };
    }

    async function post(payload) {
        var online = await requireOnlineSession();
        var client = online.client;
        var accessToken = online.session && online.session.access_token;
        if (!accessToken) throw new Error("game_session_expired");

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
            throw new Error(reason + " (HTTP " + response.status + ")");
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
            var entry = {
                attacks: Object.create(null),
                directions: Object.create(null),
                contexts: Object.create(null),
                transitions: Object.create(null),
                loadedAt: Date.now()
            };
            (Array.isArray(data.brain) ? data.brain : []).forEach(function (row) {
                if (!row || !row.attack_key) return;
                entry.attacks[String(row.attack_key)] = row;
            });
            (Array.isArray(data.directions) ? data.directions : []).forEach(function (row) {
                if (!row || !row.attack_key) return;
                entry.directions[String(row.attack_key) + "|" + String(row.direction)] = row;
            });
            (Array.isArray(data.contexts) ? data.contexts : []).forEach(function (row) {
                if (!row || !row.attack_key || row.direction == null) return;
                var key = [
                    row.attack_key, row.position_bucket || "unknown",
                    row.hazard_bucket || "unknown", row.wall_bucket || "unknown",
                    row.direction
                ].join("|");
                entry.contexts[key] = row;
            });
            (Array.isArray(data.transitions) ? data.transitions : []).forEach(function (row) {
                if (!row || !row.from_attack_key || !row.next_attack_key) return;
                var fromKey = String(row.from_attack_key);
                if (!entry.transitions[fromKey]) entry.transitions[fromKey] = [];
                entry.transitions[fromKey].push({
                    nextAttackKey: String(row.next_attack_key),
                    sample_count: Number(row.sample_count) || 0
                });
            });
            Object.keys(entry.transitions).forEach(function (key) {
                entry.transitions[key].sort(function (a, b) {
                    return (Number(b.sample_count) || 0) - (Number(a.sample_count) || 0);
                });
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
                    gameVersion: "ger-dodge-training-2",
                    arenaMode: metadata && typeof metadata.arenaMode === "string" ? metadata.arenaMode.slice(0, 32) : "unknown",
                    metadata: metadata && typeof metadata === "object" ? metadata : {}
                });
                if (!result || !result.sessionId) throw new Error("training_session_not_created");
                sessionId = result.sessionId;
                activeBossKey = bossKey;
                await loadBrain(bossKey);
                scheduleFlush();
                return result;
            } catch (error) {
                console.error("[GER training] Session could not be started:", error && error.message ? error.message : error);
                throw error;
            }
        })();

        try {
            return await startPromise;
        } finally {
            startPromise = null;
        }
    }

    function recordOutcome(sample, outcome, damageTaken) {
        if (!sample) return false;
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

    function getContextStats(bossKey, attackKey, positionBucket, hazardBucket, wallBucket, direction) {
        var boss = brainByBoss[String(bossKey || "")];
        if (!boss) return null;
        var key = [
            String(attackKey || ""), String(positionBucket || "unknown"),
            String(hazardBucket || "unknown"), String(wallBucket || "unknown"),
            String(direction)
        ].join("|");
        return boss.contexts[key] || null;
    }

    function getNextAttackStats(bossKey, attackKey) {
        var boss = brainByBoss[String(bossKey || "")];
        if (!boss) return [];
        return boss.transitions[String(attackKey || "")] || [];
    }

    function getTrainingSkill(bossKey) {
        var boss = brainByBoss[String(bossKey || "")];
        if (!boss) return 0.62;
        var total = 0;
        Object.keys(boss.attacks).forEach(function (key) {
            var row = boss.attacks[key] || {};
            total += Math.max(0, Number(row.evaded_count) || 0) +
                Math.max(0, Number(row.blocked_count) || 0) +
                Math.max(0, Number(row.hit_count) || 0);
        });
        return Math.max(0.62, Math.min(0.88, 0.62 + 0.26 * Math.sqrt(Math.min(50000, total) / 50000)));
    }

    window.MBGERTraining = {
        start: start,
        finish: finish,
        refreshBrain: loadBrain,
        recordOutcome: recordOutcome,
        checkOnline: requireOnlineSession,
        getDirectionStats: getDirectionStats,
        getAttackStats: getAttackStats,
        getContextStats: getContextStats,
        getNextAttackStats: getNextAttackStats,
        getTrainingSkill: getTrainingSkill
    };
})();