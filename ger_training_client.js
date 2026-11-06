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
    var pendingAgentResults = null;
    var agentResultsPromise = null;
    var sessionOwnerId = null;
    var clientSessionId = null;
    var persistTimer = 0;
    var retryDelay = 300;
    var sampleSequence = 0;
    var STORAGE_PREFIX = "mb_ger_training_pending_v5:";
    var LEGACY_STORAGE_PREFIXES = ["mb_ger_training_pending_v4:"];
    var MAX_LOCAL_RECOVERY_EVENTS = 160;
    var compactRecoveryMode = false;
    var localRecoveryDisabled = false;
    var localRecoveryWarningShown = false;
    var brainByBoss = Object.create(null);

    function storageKey(userId) {
        var id = String(userId || sessionOwnerId || "");
        return id ? STORAGE_PREFIX + id : null;
    }

    function compactRecoveryEvent(row) {
        if (!row || typeof row !== "object") return row;
        // Keep every field used by the server's learning/analytics pipeline, but
        // discard accidental extra properties from live game attack objects.
        return {
            eventId: row.eventId,
            bossKey: row.bossKey,
            attackKey: row.attackKey,
            attackFamily: row.attackFamily,
            bossPhase: row.bossPhase,
            timeToImpactMs: row.timeToImpactMs,
            heartX: row.heartX,
            heartY: row.heartY,
            velocityX: row.velocityX,
            velocityY: row.velocityY,
            chosenDirection: row.chosenDirection,
            targetX: row.targetX,
            targetY: row.targetY,
            outcome: row.outcome,
            damageTaken: row.damageTaken,
            features: row.features && typeof row.features === "object" ? row.features : {}
        };
    }

    function pendingStorageSnapshot(compact) {
        var savedQueue = compact
            ? queue.slice(-MAX_LOCAL_RECOVERY_EVENTS).map(compactRecoveryEvent)
            : queue;
        return {
            playerId: sessionOwnerId,
            sessionId: sessionId,
            clientSessionId: clientSessionId,
            bossKey: activeBossKey,
            queue: savedQueue,
            queueTruncated: compact && queue.length > MAX_LOCAL_RECOVERY_EVENTS,
            pendingAgentResults: pendingAgentResults,
            savedAt: Date.now()
        };
    }

    function disableLocalRecovery(error) {
        localRecoveryDisabled = true;
        if (localRecoveryWarningShown) return;
        localRecoveryWarningShown = true;
        console.warn("[GER training] Local recovery copy disabled because browser storage is full or unavailable. Live server uploads will continue.",
            error && error.message ? error.message : error);
    }

    function persistPending() {
        var key = storageKey();
        if (!key || localRecoveryDisabled) return;
        try {
            localStorage.setItem(key, JSON.stringify(pendingStorageSnapshot(compactRecoveryMode)));
        } catch (error) {
            if (!compactRecoveryMode) {
                compactRecoveryMode = true;
                try {
                    // Keep only the latest 160 pending samples in the local safety copy.
                    // The full in-memory queue still uploads to Supabase in normal batches.
                    localStorage.setItem(key, JSON.stringify(pendingStorageSnapshot(true)));
                    return;
                } catch (compactError) {
                    disableLocalRecovery(compactError || error);
                    return;
                }
            }
            disableLocalRecovery(error);
        }
    }

    function schedulePersist() {
        if (persistTimer) return;
        persistTimer = window.setTimeout(function () {
            persistTimer = 0;
            persistPending();
        }, 350);
    }

    function clearLegacyPending(userId) {
        var id = String(userId || "");
        if (!id) return;
        try {
            LEGACY_STORAGE_PREFIXES.forEach(function (prefix) {
                try { localStorage.removeItem(prefix + id); } catch (_error) {}
            });
        } catch (_error) {}
    }

    function restorePending(userId) {
        if (!userId || sessionOwnerId === userId) return;
        if (sessionId || queue.length) return;
        clearLegacyPending(userId);
        try {
            var raw = localStorage.getItem(storageKey(userId));
            if (!raw) return;
            var saved = JSON.parse(raw);
            if (!saved || saved.playerId !== userId) return;
            sessionOwnerId = userId;
            sessionId = typeof saved.sessionId === "string" ? saved.sessionId : null;
            clientSessionId = typeof saved.clientSessionId === "string" ? saved.clientSessionId : null;
            activeBossKey = typeof saved.bossKey === "string" ? saved.bossKey : null;
            queue = Array.isArray(saved.queue) ? saved.queue : [];
            pendingAgentResults = saved.pendingAgentResults && typeof saved.pendingAgentResults === "object"
                ? saved.pendingAgentResults : null;
            console.info("[GER training] Restored", queue.length, "pending samples and",
                pendingAgentResults ? "a pending agent summary" : "no pending agent summary", "from local recovery.",
                saved.queueTruncated ? "(local safety copy contains only the latest 160 samples)" : "");
        } catch (error) {
            console.warn("[GER training] Could not restore local recovery copy:", error && error.message ? error.message : error);
        }
    }

    function clearPendingStorage() {
        if (persistTimer) {
            window.clearTimeout(persistTimer);
            persistTimer = 0;
        }
        var key = storageKey();
        if (key) {
            try { localStorage.removeItem(key); } catch (_error) {}
        }
        compactRecoveryMode = false;
        localRecoveryDisabled = false;
        localRecoveryWarningShown = false;
    }

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

    async function ensurePendingSession() {
        if (sessionId) return true;
        if (!activeBossKey || !clientSessionId) return false;
        if (startPromise) {
            try { await startPromise; } catch (_error) {}
            if (sessionId) return true;
        }
        startPromise = (async function () {
            try {
                var resumed = await post({
                    action: "start",
                    clientSessionId: clientSessionId,
                    bossKey: activeBossKey,
                    gameVersion: "ger-dodge-training-3",
                    arenaMode: "pending_upload_recovery",
                    metadata: { recoveredPendingTraining: true, parallelAgents: true }
                });
                if (!resumed || !resumed.sessionId) throw new Error("pending_training_session_not_created");
                sessionId = resumed.sessionId;
                persistPending();
                retryDelay = 300;
                return true;
            } catch (error) {
                retryDelay = Math.min(10000, Math.max(600, retryDelay * 2));
                console.warn("[GER training] Could not reopen pending session yet:",
                    error && error.message ? error.message : error);
                return false;
            }
        })();
        try {
            return await startPromise;
        } finally {
            startPromise = null;
        }
    }

    function scheduleFlush() {
        if (flushTimer || (!queue.length && !pendingAgentResults)) return;
        if (!sessionId && (!activeBossKey || !clientSessionId)) return;
        var delay = queue.length >= 40 ? 180 : retryDelay;
        flushTimer = window.setTimeout(function () {
            flushTimer = 0;
            Promise.resolve(sessionId ? true : ensurePendingSession()).then(function (ready) {
                if (!ready) {
                    scheduleFlush();
                    return;
                }
                if (pendingAgentResults) saveAgentResults(pendingAgentResults);
                else flush();
            });
        }, delay);
    }

    function flush() {
        if (flushPromise) return flushPromise;
        if (!queue.length) return Promise.resolve(true);

        flushPromise = (async function () {
            try {
                if (!sessionId && !(await ensurePendingSession())) {
                    throw new Error("training_session_unavailable");
                }
                if (!sessionId || !activeBossKey) throw new Error("training_session_unavailable");

                // Keep samples in memory and local storage until the server acknowledges.
                // Stable event IDs make retries safe after a server commit/response loss.
                var batch = queue.slice(0, 40);
                var ids = Object.create(null);
                batch.forEach(function (row) { ids[row.eventId] = true; });
                var result = await post({
                    action: "events",
                    sessionId: sessionId,
                    bossKey: activeBossKey,
                    events: batch
                });
                if (!result || result.ok !== true) throw new Error("training_batch_not_acknowledged");
                queue = queue.filter(function (row) { return !ids[row.eventId]; });
                retryDelay = 300;
                persistPending();
                return true;
            } catch (error) {
                retryDelay = Math.min(10000, Math.max(600, retryDelay * 2));
                console.warn("[GER training] Event batch remains queued for retry:",
                    error && error.message ? error.message : error);
                return false;
            }
        })().finally(function () {
            flushPromise = null;
            if (queue.length) scheduleFlush();
        });
        return flushPromise;
    }

    async function flushAll() {
        var attempts = 0;
        while (queue.length && attempts < 500) {
            var before = queue.length;
            var sent = await flush();
            if (!sent || queue.length >= before) return false;
            attempts++;
        }
        return queue.length === 0;
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
        var online = await requireOnlineSession();
        if (sessionOwnerId && sessionOwnerId !== online.user.id) {
            sessionId = null;
            activeBossKey = null;
            clientSessionId = null;
            queue = [];
            pendingAgentResults = null;
            sessionOwnerId = null;
        }
        if (!sessionOwnerId) restorePending(online.user.id);
        sessionOwnerId = online.user.id;

        // A recovered offline queue belongs to its original boss. Re-open that
        // idempotent session, upload it, and close it before switching bosses.
        if (!sessionId && activeBossKey && activeBossKey !== bossKey &&
            (queue.length || pendingAgentResults)) {
            try {
                var previousBossKey = activeBossKey;
                if (!clientSessionId) clientSessionId = makeUuid();
                var recovered = await post({
                    action: "start",
                    clientSessionId: clientSessionId,
                    bossKey: previousBossKey,
                    gameVersion: "ger-dodge-training-3",
                    arenaMode: "recovered_pending_upload",
                    metadata: { recoveredPendingTraining: true }
                });
                if (!recovered || !recovered.sessionId) return null;
                sessionId = recovered.sessionId;
                activeBossKey = previousBossKey;
                persistPending();
                if (pendingAgentResults) {
                    var summarySaved = await saveAgentResults(pendingAgentResults);
                    if (!summarySaved || pendingAgentResults) return null;
                }
                var recoveredSamplesSent = await flushAll();
                if (!recoveredSamplesSent || queue.length) return null;
                var recoveredSessionClosed = await finish("aborted");
                if (!recoveredSessionClosed) return null;
                sessionOwnerId = online.user.id;
            } catch (recoveryError) {
                console.warn("[GER training] Could not recover the previous boss queue yet:",
                    recoveryError && recoveryError.message ? recoveryError.message : recoveryError);
                return null;
            }
        }

        if (sessionId && activeBossKey === bossKey) {
            await loadBrain(bossKey);
            scheduleFlush();
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

        if (!clientSessionId || activeBossKey !== bossKey) clientSessionId = makeUuid();
        activeBossKey = bossKey;
        persistPending();

        startPromise = (async function () {
            try {
                var result = await post({
                    action: "start",
                    clientSessionId: clientSessionId,
                    bossKey: bossKey,
                    gameVersion: metadata && typeof metadata.gameVersion === "string" ? metadata.gameVersion.slice(0, 40) : "ger-dodge-training-3",
                    arenaMode: metadata && typeof metadata.arenaMode === "string" ? metadata.arenaMode.slice(0, 32) : "unknown",
                    metadata: metadata && typeof metadata === "object" ? metadata : {}
                });
                if (!result || !result.sessionId) throw new Error("training_session_not_created");
                sessionId = result.sessionId;
                activeBossKey = bossKey;
                persistPending();
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

    async function annotateSession(metadata) {
        if (startPromise) {
            try { await startPromise; } catch (_error) {}
        }
        if (!sessionId || !metadata || typeof metadata !== "object") return false;
        try {
            var result = await post({ action: "annotate", sessionId: sessionId, metadata: metadata });
            return !!(result && result.ok === true);
        } catch (error) {
            console.warn("[GER training] Session metadata was not saved:", error && error.message ? error.message : error);
            return false;
        }
    }

    async function saveAgentResults(results) {
        if (results && typeof results === "object") {
            // Upload the full 100-agent snapshot directly. Persist it locally only
            // if the upload fails or the page is closing, avoiding a large duplicate write.
            pendingAgentResults = results;
        }
        if (startPromise) {
            try { await startPromise; } catch (_error) {}
        }
        if (!sessionId && pendingAgentResults) await ensurePendingSession();
        if (!sessionId || !pendingAgentResults) {
            scheduleFlush();
            return false;
        }
        // If a checkpoint is already uploading, chain the newest pending snapshot
        // after it. This makes the final result promise wait for the final upload too.
        if (agentResultsPromise) {
            return agentResultsPromise.then(function (response) {
                if (response && response.ok === true && pendingAgentResults) {
                    return saveAgentResults();
                }
                return response;
            });
        }
        var submittedSnapshot = pendingAgentResults;
        var submittedSessionId = sessionId;
        agentResultsPromise = (async function () {
            try {
                var response = await post({
                    action: "agent_results",
                    sessionId: submittedSessionId,
                    results: submittedSnapshot
                });
                if (!response || response.ok !== true) throw new Error("agent_results_not_acknowledged");
                if (pendingAgentResults === submittedSnapshot) pendingAgentResults = null;
                retryDelay = 300;
                persistPending();
                if (queue.length || pendingAgentResults) scheduleFlush();
                return response;
            } catch (error) {
                retryDelay = Math.min(10000, Math.max(600, retryDelay * 2));
                console.warn("[GER training] Parallel-agent results remain queued for retry:",
                    error && error.message ? error.message : error);
                schedulePersist();
                scheduleFlush();
                return false;
            }
        })().finally(function () {
            agentResultsPromise = null;
            if (pendingAgentResults) scheduleFlush();
        });
        return agentResultsPromise;
    }

    function recordOutcome(sample, outcome, damageTaken) {
        if (!sample) return false;
        var row = Object.assign({}, sample, {
            eventId: makeUuid(),
            outcome: outcome === "evaded" || outcome === "hit" || outcome === "blocked" ? outcome : "unknown",
            damageTaken: Math.max(0, Number(damageTaken) || 0)
        });
        row.features = Object.assign({}, sample.features || {});
        if (!row.features.eventOrder) row.features.eventOrder = ++sampleSequence;
        queue.push(row);
        schedulePersist();
        if (queue.length >= 40) flush();
        else scheduleFlush();
        return true;
    }

    async function finish(result) {
        if (finishPromise) return finishPromise;
        if (startPromise) {
            try { await startPromise; } catch (_error) {}
        }
        if (!sessionId && (queue.length || pendingAgentResults)) {
            await ensurePendingSession();
        }
        if (!sessionId) return queue.length === 0 && !pendingAgentResults;

        finishPromise = (async function () {
            try {
                if (flushTimer) {
                    window.clearTimeout(flushTimer);
                    flushTimer = 0;
                }
                if (pendingAgentResults) {
                    var savedAgents = await saveAgentResults(pendingAgentResults);
                    if (!savedAgents || pendingAgentResults) {
                        scheduleFlush();
                        return false;
                    }
                }
                var sent = await flushAll();
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
                clearPendingStorage();
                sessionId = null;
                activeBossKey = null;
                clientSessionId = null;
                sessionOwnerId = null;
                queue = [];
                pendingAgentResults = null;
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

    window.addEventListener("beforeunload", function () {
        persistPending();
    });

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
        flush: flushAll,
        annotateSession: annotateSession,
        saveAgentResults: saveAgentResults,
        checkOnline: requireOnlineSession,
        getDirectionStats: getDirectionStats,
        getAttackStats: getAttackStats,
        getContextStats: getContextStats,
        getNextAttackStats: getNextAttackStats,
        getTrainingSkill: getTrainingSkill
    };
})();