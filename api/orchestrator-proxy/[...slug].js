/**
 * Vercel: REST с фронта → /api/orchestrator-proxy/* → реальный Node-оркестратор (обход CORS).
 * Env (Vercel → Settings → Environment Variables, область Functions):
 *   ORCHESTRATOR_UPSTREAM_URL=https://your-server.up.railway.app  (без слэша в конце)
 */
const UPSTREAM = (process.env.ORCHESTRATOR_UPSTREAM_URL || "").replace(/\/$/, "");

const PREFIX = "/api/orchestrator-proxy";

function proxyRestAndSearch(req) {
  const rawUrl = req.url || "/";
  let pathname;
  let search;
  try {
    const u = new URL(rawUrl, "http://local");
    pathname = u.pathname;
    search = u.search;
  } catch {
    return { rest: "/", search: "" };
  }

  if (pathname.startsWith(PREFIX)) {
    const rest = pathname.slice(PREFIX.length) || "/";
    return { rest, search };
  }

  const q = req.query?.slug;
  if (q != null) {
    const tail = Array.isArray(q) ? q.join("/") : String(q);
    const rest = tail ? `/${tail.replace(/^\//, "")}` : "/";
    return { rest, search };
  }

  if (pathname && pathname !== "/") {
    return { rest: pathname.startsWith("/") ? pathname : `/${pathname}`, search };
  }

  return { rest: "/", search: "" };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!UPSTREAM) {
    res
      .status(503)
      .setHeader("Content-Type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          error:
            "ORCHESTRATOR_UPSTREAM_URL не задан. В Vercel добавьте URL деплоя server/ (Railway/Render…). " +
            "См. server/Dockerfile и .env.example в корне репозитория.",
        }),
      );
    return;
  }

  const { rest, search } = proxyRestAndSearch(req);
  const target = `${UPSTREAM}${rest}${search}`;

  const headers = {};
  const ct = req.headers["content-type"];
  if (typeof ct === "string") headers["content-type"] = ct;
  const auth = req.headers.authorization;
  if (typeof auth === "string") headers.authorization = auth;

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (typeof req.body === "string") body = req.body;
    else if (Buffer.isBuffer(req.body)) body = req.body;
    else if (req.body != null && typeof req.body === "object") body = JSON.stringify(req.body);
  }

  let r;
  try {
    r = await fetch(target, {
      method: req.method || "GET",
      headers,
      body,
    });
  } catch (e) {
    res.status(502).end(String(e?.message || e));
    return;
  }

  res.status(r.status);
  const skip = new Set(["connection", "transfer-encoding", "keep-alive"]);
  for (const [k, v] of r.headers.entries()) {
    if (skip.has(k.toLowerCase())) continue;
    res.setHeader(k, v);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  res.send(buf);
}
