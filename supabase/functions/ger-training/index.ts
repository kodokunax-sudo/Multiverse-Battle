import postgres from "npm:postgres@3.4.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const APP_KEY = "sb_publishable_qbyB9Iy18uaiv1YIsHepkQ_cqDYdKGE";
const GAME_AUTH_URL = "https://pgawqdrnyhirqmeacdai.supabase.co/auth/v1/user";
const GAME_AUTH_KEY = "sb_publishable_vLOwdklZNRMLKiQ20-BM8w_VB9vuPoh";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_RE = /^[a-z0-9][a-z0-9_-]{0,79}$/i;
const OUTCOMES = new Set(["evaded", "hit", "blocked", "unknown"]);
const RESULTS = new Set(["win", "loss", "draw", "aborted"]);
const MAX_AGENT_COUNT = 100;
// Training-arena keys and live boss-context keys share one learned brain.
// Historical live-context keys remain aliases so existing samples are retained.
const BOSS_KEY_ALIASES = {
  ger_unique_200: ["ger_unique_200", "stone"],
  ger_unique_500: ["ger_unique_500", "waystar"],
  ger_unique_1000: ["ger_unique_1000", "rwb"],
  ger_unique_2000: ["ger_unique_2000", "stonesuper"],
};
let client = null;

function db() {
  if (client) return client;
  const url = Deno.env.get("SUPABASE_DB_URL");
  if (!url) throw new Error("database_connection_unavailable");
  client = postgres(url, { max: 1, idle_timeout: 10, connect_timeout: 10, prepare: false });
  return client;
}
function reply(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}
function cleanKey(value, max = 80) {
  if (typeof value !== "string") return null;
  const s = value.trim().slice(0, max);
  return KEY_RE.test(s) ? s.toLowerCase() : null;
}
function numberOrNull(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function validUuid(value) {
  return typeof value === "string" && UUID_RE.test(value) ? value : null;
}
async function authenticate(req) {
  if (req.headers.get("apikey") !== APP_KEY) return null;
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) return null;
  const response = await fetch(GAME_AUTH_URL, {
    headers: {
      "apikey": GAME_AUTH_KEY,
      "Authorization": "Bearer " + match[1],
      "Accept": "application/json"
    }
  });
  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  return user && validUuid(user.id) ? user.id : null;
}
function normalizeEvent(event, bossKey) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const e = event;
  const eventId = validUuid(e.eventId);
  const attackKey = cleanKey(e.attackKey);
  if (!eventId || !attackKey || !OUTCOMES.has(e.outcome)) return null;
  const features = e.features && typeof e.features === "object" && !Array.isArray(e.features) ? e.features : {};
  const featuresJson = JSON.stringify(features);
  if (featuresJson.length > 4000) return null;
  return {
    eventId, bossKey, attackKey,
    attackFamily: cleanKey(e.attackFamily, 40),
    bossPhase: cleanKey(e.bossPhase, 32),
    timeToImpactMs: numberOrNull(e.timeToImpactMs, 0, 60000),
    heartX: numberOrNull(e.heartX, -1000, 1000),
    heartY: numberOrNull(e.heartY, -1000, 1000),
    velocityX: numberOrNull(e.velocityX, -100, 100),
    velocityY: numberOrNull(e.velocityY, -100, 100),
    chosenDirection: numberOrNull(e.chosenDirection, 0, 7),
    targetX: numberOrNull(e.targetX, -1000, 1000),
    targetY: numberOrNull(e.targetY, -1000, 1000),
    outcome: e.outcome,
    damageTaken: numberOrNull(e.damageTaken, 0, 1000000000) ?? 0,
    featuresJson
  };
}
async function startSession(playerId, body) {
  const clientSessionId = validUuid(body.clientSessionId);
  const bossKey = cleanKey(body.bossKey, 64);
  if (!clientSessionId || !bossKey) return reply({ error: "invalid_session" }, 400);
  const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {};
  // postgres.js unsafe() binds strings as text; cast text to jsonb to parse the JSON object instead of storing a JSON string scalar.
  const metadataJson = JSON.stringify(metadata);
  if (metadataJson.length > 1500) return reply({ error: "metadata_too_large" }, 413);
  const q = db();
  const inserted = await q.unsafe(
    "insert into public.ger_training_sessions (player_id, client_session_id, boss_key, ai_version, game_version, arena_mode, metadata) values ($1::uuid,$2::uuid,$3,'ger-dodge-v3',$4,$5,$6::text::jsonb) on conflict (player_id, client_session_id) do nothing returning id, started_at",
    [playerId, clientSessionId, bossKey,
     typeof body.gameVersion === "string" ? body.gameVersion.slice(0, 40) : null,
     typeof body.arenaMode === "string" ? body.arenaMode.slice(0, 32) : null, metadataJson]
  );
  if (inserted.length) return reply({ sessionId: inserted[0].id, startedAt: inserted[0].started_at });
  const existing = await q.unsafe(
    "select id, started_at, finished_at from public.ger_training_sessions where player_id=$1::uuid and client_session_id=$2::uuid limit 1",
    [playerId, clientSessionId]
  );
  if (!existing.length || existing[0].finished_at) return reply({ error: "session_already_finished" }, 409);
  return reply({ sessionId: existing[0].id, startedAt: existing[0].started_at, resumed: true });
}
async function saveEvents(playerId, body) {
  const sessionId = validUuid(body.sessionId);
  const bossKey = cleanKey(body.bossKey, 64);
  if (!sessionId || !bossKey || !Array.isArray(body.events) || body.events.length < 1 || body.events.length > 40) {
    return reply({ error: "invalid_event_batch" }, 400);
  }
  const events = body.events.map((item) => normalizeEvent(item, bossKey));
  if (events.some((item) => !item)) return reply({ error: "invalid_event" }, 400);
  const q = db();
  const owned = await q.unsafe(
    "select id from public.ger_training_sessions where id=$1::uuid and player_id=$2::uuid and finished_at is null limit 1",
    [sessionId, playerId]
  );
  if (!owned.length) return reply({ error: "session_not_found" }, 404);
  // featuresJson is serialized JSON text; the explicit text cast prevents double-encoding into a JSON string scalar.
  const insertSql = "insert into public.ger_dodge_samples (session_id,player_id,event_id,boss_key,attack_key,attack_family,boss_phase,time_to_impact_ms,heart_x,heart_y,velocity_x,velocity_y,chosen_direction,target_x,target_y,outcome,damage_taken,features) values ($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::text::jsonb) on conflict (session_id,event_id) do nothing";
  await q.begin(async (tx) => {
    for (const e of events) {
      await tx.unsafe(insertSql, [
        sessionId, playerId, e.eventId, e.bossKey, e.attackKey, e.attackFamily, e.bossPhase,
        e.timeToImpactMs, e.heartX, e.heartY, e.velocityX, e.velocityY,
        e.chosenDirection, e.targetX, e.targetY, e.outcome, e.damageTaken, e.featuresJson
      ]);
    }
    // Keep the live session counter in sync with persisted samples, including deduplicated batches.
    await tx.unsafe(
      "update public.ger_training_sessions s set event_count=(select count(*)::integer from public.ger_dodge_samples d where d.session_id=s.id and d.player_id=s.player_id) where s.id=$1::uuid and s.player_id=$2::uuid and s.finished_at is null",
      [sessionId, playerId]
    );
  });
  return reply({ ok: true, received: events.length });
}
async function finishSession(playerId, body) {
  const sessionId = validUuid(body.sessionId);
  const result = RESULTS.has(body.result) ? body.result : "aborted";
  if (!sessionId) return reply({ error: "invalid_session" }, 400);
  const rows = await db().unsafe(
    "update public.ger_training_sessions s set finished_at=now(), duration_ms=least(10800000,greatest(0,floor(extract(epoch from (now()-s.started_at))*1000))::bigint), result=$3, event_count=(select count(*)::integer from public.ger_dodge_samples d where d.session_id=s.id and d.player_id=s.player_id) where s.id=$1::uuid and s.player_id=$2::uuid and s.finished_at is null returning id,event_count,result,duration_ms",
    [sessionId, playerId, result]
  );
  if (!rows.length) return reply({ ok: true, alreadyFinished: true });
  return reply({ ok: true, session: rows[0] });
}
async function annotateSession(playerId, body) {
  const sessionId = validUuid(body.sessionId);
  const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {};
  const metadataJson = JSON.stringify(metadata);
  if (!sessionId || metadataJson.length > 1500) return reply({ error: "invalid_session_metadata" }, 400);
  const rows = await db().unsafe(
    "update public.ger_training_sessions set metadata=metadata || $3::text::jsonb where id=$1::uuid and player_id=$2::uuid and finished_at is null returning id",
    [sessionId, playerId, metadataJson]
  );
  if (!rows.length) return reply({ error: "session_not_found" }, 404);
  return reply({ ok: true });
}

async function saveAgentResults(playerId, body) {
  const sessionId = validUuid(body.sessionId);
  const raw = body.results && typeof body.results === "object" && !Array.isArray(body.results) ? body.results : {};
  const rawAgents = Array.isArray(raw.results) ? raw.results : [];
  if (!sessionId || rawAgents.length < 1 || rawAgents.length > MAX_AGENT_COUNT) {
    return reply({ error: "invalid_agent_results" }, 400);
  }
  const agents = rawAgents.map((agent) => {
    if (!agent || typeof agent !== "object" || Array.isArray(agent)) return null;
    const id = numberOrNull(agent.id, 1, MAX_AGENT_COUNT);
    if (id === null || !Number.isInteger(id)) return null;
    const personality = agent.personality && typeof agent.personality === "object" ? agent.personality : {};
    return {
      id,
      score: numberOrNull(agent.score, -1000000000, 1000000000) ?? 0,
      damageDealt: numberOrNull(agent.damageDealt, 0, 1000000000) ?? 0,
      damageTaken: numberOrNull(agent.damageTaken, 0, 1000000000) ?? 0,
      hits: numberOrNull(agent.hits, 0, 10000000) ?? 0,
      dodges: numberOrNull(agent.dodges, 0, 10000000) ?? 0,
      decisions: numberOrNull(agent.decisions, 0, 10000000) ?? 0,
      failedDodges: numberOrNull(agent.failedDodges, 0, 10000000) ?? 0,
      alive: agent.alive === true,
      x: numberOrNull(agent.x, -1000, 1000),
      y: numberOrNull(agent.y, -1000, 1000),
      velocityX: numberOrNull(agent.velocityX, -100, 100),
      velocityY: numberOrNull(agent.velocityY, -100, 100),
      targetX: numberOrNull(agent.targetX, -1000, 1000),
      targetY: numberOrNull(agent.targetY, -1000, 1000),
      hp: numberOrNull(agent.hp, 0, 1000000),
      maxHp: numberOrNull(agent.maxHp, 0, 1000000),
      personality: {
        aggression: numberOrNull(personality.aggression, 0, 2) ?? 1,
        riskTolerance: numberOrNull(personality.riskTolerance, 0, 1) ?? 0.5,
        preferredRange: numberOrNull(personality.preferredRange, 20, 200) ?? 90,
        movementSpeed: numberOrNull(personality.movementSpeed, 0.5, 1.5) ?? 1,
        aiSkill: numberOrNull(personality.aiSkill, 0, 1) ?? 0.62
      }
    };
  });
  if (agents.some((agent) => !agent)) return reply({ error: "invalid_agent_row" }, 400);
  const summary = {
    schemaVersion: 1,
    agentRole: "primary_stand",
    poolType: "parallel_primary_stands",
    agentCount: agents.length,
    reason: typeof raw.reason === "string" ? raw.reason.slice(0, 40) : "unknown",
    completed: raw.completed === true,
    survivors: numberOrNull(raw.survivors, 0, MAX_AGENT_COUNT) ?? agents.filter((agent) => agent.alive).length,
    totalHits: numberOrNull(raw.totalHits, 0, 1000000000) ?? 0,
    totalDodges: numberOrNull(raw.totalDodges, 0, 1000000000) ?? 0,
    totalDecisions: numberOrNull(raw.totalDecisions, 0, 1000000000) ?? 0,
    totalFailedDodges: numberOrNull(raw.totalFailedDodges, 0, 1000000000) ?? 0,
    totalDamage: numberOrNull(raw.totalDamage, 0, 1000000000) ?? 0,
    totalDamageTaken: numberOrNull(raw.totalDamageTaken, 0, 1000000000) ?? 0,
    results: agents,
    savedAt: new Date().toISOString()
  };
  const summaryJson = JSON.stringify({ parallelAgents: summary });
  if (summaryJson.length > 50000) return reply({ error: "agent_results_too_large" }, 413);
  const rows = await db().unsafe(
    "update public.ger_training_sessions set metadata=metadata || $3::text::jsonb where id=$1::uuid and player_id=$2::uuid and finished_at is null returning id",
    [sessionId, playerId, summaryJson]
  );
  if (!rows.length) return reply({ error: "session_not_found" }, 404);
  return reply({ ok: true, savedAgents: agents.length });
}

async function readBrain(body) {
  const bossKey = cleanKey(body.bossKey, 64);
  const attackKey = body.attackKey == null ? null : cleanKey(body.attackKey);
  if (!bossKey || (body.attackKey != null && !attackKey)) return reply({ error: "invalid_brain_query" }, 400);
  const bossKeys = BOSS_KEY_ALIASES[bossKey] || [bossKey];
  // Ordinary arena battles use ctx.type="arena", while the training arena
  // historically stored arena_wave_N keys. Combine those samples for live play.
  const includeArenaWaves = bossKey === "arena";
  const brain = await db().unsafe(
    "select attack_key,sum(sample_count)::bigint as sample_count,sum(evaded_count)::bigint as evaded_count,sum(hit_count)::bigint as hit_count,sum(blocked_count)::bigint as blocked_count,sum(unknown_count)::bigint as unknown_count,sum(tti_sample_count)::bigint as tti_sample_count,case when sum(tti_sample_count)>0 then round(sum(tti_sum_ms)::numeric/sum(tti_sample_count),1) else null end as avg_tti_ms from public.ger_dodge_brain where (boss_key=any($1::text[]) or ($2::boolean and boss_key like 'arena_wave_%')) and ($3::text is null or attack_key=$3) group by attack_key",
    [bossKeys, includeArenaWaves, attackKey]
  );
  const directions = await db().unsafe(
    "select attack_key,direction,sum(sample_count)::bigint as sample_count,sum(evaded_count)::bigint as evaded_count,sum(hit_count)::bigint as hit_count,sum(blocked_count)::bigint as blocked_count,sum(unknown_count)::bigint as unknown_count from public.ger_dodge_direction_stats where (boss_key=any($1::text[]) or ($2::boolean and boss_key like 'arena_wave_%')) and ($3::text is null or attack_key=$3) group by attack_key,direction",
    [bossKeys, includeArenaWaves, attackKey]
  );
  // Context-conditioned outcomes: which directions worked for this attack from
  // a particular side of the boss, hazard density, and wall proximity.
  const contexts = await db().unsafe(
    "select attack_key,features->>'positionBucket' as position_bucket,features->>'hazardBucket' as hazard_bucket,features->>'wallBucket' as wall_bucket,chosen_direction as direction,count(*)::integer as sample_count,count(*) filter (where outcome='evaded')::integer as evaded_count,count(*) filter (where outcome='blocked')::integer as blocked_count,count(*) filter (where outcome='hit')::integer as hit_count,count(*) filter (where outcome='unknown')::integer as unknown_count from public.ger_dodge_samples where (boss_key=any($1::text[]) or ($2::boolean and boss_key like 'arena_wave_%')) and ($3::text is null or attack_key=$3) and coalesce(features->>'sampleType','dodge')='dodge' and features ? 'positionBucket' and features ? 'hazardBucket' and features ? 'wallBucket' and chosen_direction is not null and outcome in ('evaded','blocked','hit') group by attack_key,features->>'positionBucket',features->>'hazardBucket',features->>'wallBucket',chosen_direction order by count(*) desc limit 700",
    [bossKeys, includeArenaWaves, attackKey]
  );
  // Learn attack-to-attack transitions within each training session. This lets
  // the companion prepare for common follow-up patterns before they spawn.
  const transitions = await db().unsafe(
    "with ordered as (select session_id,attack_key,lead(attack_key) over (partition by session_id,coalesce(features->>'agentId','main') order by case when jsonb_typeof(features->'decisionOrder')='number' then (features->>'decisionOrder')::bigint else id end,created_at,id) as next_attack_key from public.ger_dodge_samples where (boss_key=any($1::text[]) or ($2::boolean and boss_key like 'arena_wave_%')) and coalesce(features->>'sampleType','dodge')='dodge' and attack_key <> 'swarm_agent_survival' and outcome in ('evaded','blocked','hit')) select attack_key as from_attack_key,next_attack_key,count(*)::integer as sample_count from ordered where next_attack_key is not null group by attack_key,next_attack_key order by count(*) desc limit 300",
    [bossKeys, includeArenaWaves]
  );
  return reply({ brain, directions, contexts, transitions });
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 70000) return reply({ error: "payload_too_large" }, 413);
  const playerId = await authenticate(req).catch(() => null);
  if (!playerId) return reply({ error: "authentication_required" }, 401);
  try {
    const body = await req.json();
    switch (body.action) {
      case "start": return await startSession(playerId, body);
      case "events": return await saveEvents(playerId, body);
      case "annotate": return await annotateSession(playerId, body);
      case "agent_results": return await saveAgentResults(playerId, body);
      case "finish": return await finishSession(playerId, body);
      case "brain": return await readBrain(body);
      default: return reply({ error: "unknown_action" }, 400);
    }
  } catch (error) {
    console.error("[ger-training] request failed:", error instanceof Error ? error.message : "unknown");
    return reply({ error: "internal_error" }, 500);
  }
});
