/**
 * zzp-craft-cup-admin worker
 *
 * Holds the GitHub write token server-side so the site's admin never has to
 * paste one into the browser. The browser only ever knows the admin
 * passcode; this worker turns that into a short-lived signed session token,
 * and uses its own GITHUB_TOKEN secret to perform the actual write.
 *
 * Routes:
 *   GET  /state                            -> { sha, content } (base64), authenticated read
 *   POST /login  { passcode }              -> { ok, token, exp } | 401
 *   POST /save   { token, sha, content }   -> { status: "ok" | "conflict" | "error", detail? }
 *
 * /state exists so the admin's "read sha, then write" step goes through our
 * own GITHUB_TOKEN instead of an anonymous api.github.com request — GitHub
 * caches/rate-limits anonymous reads, which was causing spurious "someone
 * else just saved" conflicts and stale-looking reverts for a single admin.
 */

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

function b64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return decodeURIComponent(escape(atob(str)));
}

async function hmac(message, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64urlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

async function makeToken(env) {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const encoded = b64urlEncode(payload);
  const sig = await hmac(encoded, env.SESSION_SECRET);
  return { token: encoded + "." + sig, exp: JSON.parse(payload).exp };
}

async function verifyToken(token, env) {
  if (!token || typeof token !== "string" || token.indexOf(".") < 0) return false;
  const [encoded, sig] = token.split(".");
  const expected = await hmac(encoded, env.SESSION_SECRET);
  if (expected !== sig) return false;
  try {
    const payload = JSON.parse(b64urlDecode(encoded));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch (e) {
    return false;
  }
}

async function handleState(env) {
  const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.DATA_PATH}?ref=${env.GITHUB_BRANCH}`;
  let ghRes;
  try {
    ghRes = await fetch(apiUrl, {
      headers: {
        "Authorization": "Bearer " + env.GITHUB_TOKEN,
        "Accept": "application/vnd.github+json",
        "User-Agent": "zzp-craft-cup-admin-worker",
      },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
  } catch (networkErr) {
    return json({ error: "github network error: " + networkErr.message }, 502, env);
  }
  if (!ghRes.ok) {
    let detail = "HTTP " + ghRes.status;
    try { const b = await ghRes.json(); if (b && b.message) detail += ": " + b.message; } catch (e) {}
    return json({ error: detail }, ghRes.status, env);
  }
  const j = await ghRes.json();
  return json({ sha: j.sha, content: j.content }, 200, env);
}

async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: "bad json" }, 400, env); }
  if (!body || typeof body.passcode !== "string" || body.passcode !== env.ADMIN_PASSCODE) {
    return json({ ok: false, error: "wrong passcode" }, 401, env);
  }
  const { token, exp } = await makeToken(env);
  return json({ ok: true, token, exp }, 200, env);
}

async function handleSave(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ status: "error", detail: "bad json" }, 400, env); }
  const valid = body && (await verifyToken(body.token, env));
  if (!valid) return json({ status: "error", detail: "session expired — please log in again" }, 401, env);
  if (!body.content || !body.sha) return json({ status: "error", detail: "missing content/sha" }, 400, env);

  const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.DATA_PATH}`;
  let ghRes;
  try {
    ghRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + env.GITHUB_TOKEN,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "zzp-craft-cup-admin-worker",
      },
      body: JSON.stringify({
        message: "update state " + new Date().toISOString(),
        content: body.content,
        sha: body.sha,
        branch: env.GITHUB_BRANCH,
      }),
    });
  } catch (networkErr) {
    return json({ status: "error", detail: "github network error: " + networkErr.message }, 502, env);
  }

  if (ghRes.status === 409) return json({ status: "conflict" }, 200, env);
  if (!ghRes.ok) {
    let detail = "HTTP " + ghRes.status;
    try { const b = await ghRes.json(); if (b && b.message) detail += ": " + b.message; } catch (e) {}
    return json({ status: "error", detail }, 200, env);
  }
  return json({ status: "ok" }, 200, env);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/state") return handleState(env);
    if (request.method === "POST" && url.pathname === "/login") return handleLogin(request, env);
    if (request.method === "POST" && url.pathname === "/save") return handleSave(request, env);
    return json({ error: "not found" }, 404, env);
  },
};
