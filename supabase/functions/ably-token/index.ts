import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function getPublishableKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  const packed = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!packed) return "";
  try {
    const keys = JSON.parse(packed);
    return String(keys.default || Object.values(keys)[0] || "");
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !/^Bearer\s+\S+/i.test(authHeader)) {
    return jsonResponse({ error: "Please sign in before connecting to co-op." }, 401);
  }

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = getPublishableKey();
  if (!projectUrl || !publishableKey) {
    console.error("Missing Supabase URL or publishable API key environment.");
    return jsonResponse({ error: "Supabase auth is not configured on the token endpoint." }, 500);
  }

  let user: { id?: string };
  try {
    const userResponse = await fetch(new URL("/auth/v1/user", projectUrl), {
      headers: { authorization: authHeader, apikey: publishableKey },
    });
    if (!userResponse.ok) return jsonResponse({ error: "Your session is invalid. Sign in again." }, 401);
    user = await userResponse.json();
  } catch (error) {
    console.error("Supabase user validation failed:", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "Could not validate your session." }, 502);
  }
  if (!user.id) return jsonResponse({ error: "No authenticated user found." }, 401);

  const apiKey = Deno.env.get("ABLY_API_KEY");
  if (!apiKey || !apiKey.includes(":")) {
    console.error("ABLY_API_KEY is not configured as an Ably keyName:keySecret.");
    return jsonResponse({ error: "ABLY_API_KEY is missing from Supabase Edge Function Secrets." }, 503);
  }

  const keyName = apiKey.slice(0, apiKey.indexOf(":"));
  const tokenRequest = {
    keyName,
    capability: JSON.stringify({ "coop:*": ["publish", "subscribe", "presence"] }),
    clientId: user.id,
    ttl: 60 * 60 * 1000,
    timestamp: Date.now(),
    nonce: crypto.randomUUID().replaceAll("-", ""),
  };

  try {
    const tokenUrl = "https://main.realtime.ably.net/keys/" +
      encodeURIComponent(keyName) + "/requestToken";
    const ablyResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        authorization: "Basic " + btoa(apiKey),
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(tokenRequest),
    });
    const responseText = await ablyResponse.text();
    if (!ablyResponse.ok) {
      console.error("Ably token request rejected with status", ablyResponse.status);
      return jsonResponse({ error: "Ably refused to issue a token. Check key permissions and resource restrictions." }, 502);
    }

    const tokenDetails = JSON.parse(responseText);
    if (!tokenDetails || !tokenDetails.token) {
      console.error("Ably token response did not contain a token.");
      return jsonResponse({ error: "Ably returned an invalid token response." }, 502);
    }
    return jsonResponse(tokenDetails);
  } catch (error) {
    console.error("Ably token endpoint failed:", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "Could not obtain an Ably token." }, 502);
  }
});
