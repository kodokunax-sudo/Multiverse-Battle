/* Optional online integrations. These must never block single-player startup. */
(function () {
    "use strict";
    if (window.__mbOptionalIntegrationsStarted) return;
    window.__mbOptionalIntegrationsStarted = true;

    var SCRIPT_TIMEOUT_MS = 10000;

    function loadScript(src, label) {
        return new Promise(function (resolve) {
            var script = document.createElement("script");
            var settled = false;
            var timeout = window.setTimeout(function () {
                if (settled) return;
                settled = true;
                console.warn("[MB boot] Optional script timed out:", label || src);
                resolve(false);
            }, SCRIPT_TIMEOUT_MS);

            function finish(ok) {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeout);
                if (!ok) console.warn("[MB boot] Optional script unavailable:", label || src);
                resolve(ok);
            }

            script.async = true;
            script.src = src;
            script.onload = function () { finish(true); };
            script.onerror = function () { finish(false); };
            (document.head || document.documentElement).appendChild(script);
        });
    }

    function startOptionalIntegrations() {
    // Start optional network requests only after the game's own DOMContentLoaded
    // handlers have initialized the playable single-player screen.
    // Load the clan/profile module after the SDK attempt. If the CDN is down,
    // the clan UI can still display a helpful "service unavailable" message.
    var supabaseTask = loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", "Supabase SDK")
        .then(function (sdkLoaded) {
            return loadScript("clans.js?v=55", "clans.js").then(function (clansLoaded) {
                return { sdkLoaded: sdkLoaded, clansLoaded: clansLoaded };
            });
        })
        .catch(function (error) {
            console.warn("[MB boot] Online profile module failed; offline game remains available.", error);
            return { sdkLoaded: false, clansLoaded: false };
        });

    var ablyTask = loadScript("https://cdn.ably.com/lib/ably.min-2.js", "Ably SDK")
        .catch(function (error) {
            console.warn("[MB boot] Co-op SDK failed; offline game remains available.", error);
            return false;
        });

    Promise.all([supabaseTask, ablyTask]).then(function (results) {
        var onlineStatus = results[0];
        var ablyLoaded = results[1];
        if (!onlineStatus.sdkLoaded || !onlineStatus.clansLoaded || !ablyLoaded) {
            console.info("[MB boot] Optional online features skipped; single-player is ready.");
            return;
        }
        return loadScript("online-arena.js?v=19", "online-arena.js");
    }).catch(function (error) {
        console.warn("[MB boot] Optional online initialization failed:", error);
    });
    }

    if (document.readyState === "loading" || document.readyState === "interactive") {
        document.addEventListener("DOMContentLoaded", startOptionalIntegrations, { once: true });
    } else {
        startOptionalIntegrations();
    }
})();