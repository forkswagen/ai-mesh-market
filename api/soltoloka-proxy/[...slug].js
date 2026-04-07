/**
 * Vercel catch-all: /api/soltoloka-proxy/* → SolToloka FastAPI (обход CORS).
 * Env: SOLTOLOKA_UPSTREAM_URL (по умолчанию https://soltoloka-backend.vercel.app)
 */
const UPSTREAM = (process.env.SOLTOLOKA_UPSTREAM_URL || "https://soltoloka-backend.vercel.app").replace(
  /\/$/,
  "",
);

const PREFIX = "/api/soltoloka-proxy";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const rawUrl = req.url || "/";
  let pathname;
  let search;
  try {
    const u = new URL(rawUrl, "http://local");
    pathname = u.pathname;
    search = u.search;
  } catch {
    res.status(400).end("Bad URL");
    return;
  }

  if (!pathname.startsWith(PREFIX)) {
    res.status(404).end("Not found");
    return;
  }

  const rest = pathname.slice(PREFIX.length) || "/";
  const target = `${UPSTREAM}${rest}${search}`;

  const headers = {};
  const ct = req.headers["content-type"];
  if (typeof ct === "string") headers["content-type"] = ct;

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
