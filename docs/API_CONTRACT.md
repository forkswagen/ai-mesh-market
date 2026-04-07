# API contract — Escora escrow orchestrator

Compatible with standalone [`depai-backend`](https://github.com/forkswagen/depai-backend): same paths and payloads can be implemented or proxied there.

**Base URL:** Node orchestrator `server/` — locally `http://localhost:8787`; frontend sets **`VITE_API_BASE_URL`** (in dev without env: `http://127.0.0.1:8787`), or same-origin on Vercel with `api/escora`.

## `deal_id` ↔ on-chain mapping

- API field **`dealId`** (number / u64) **matches** `deal_id` in `data_arbiter` and the PDA seed `escrow[buyer, seller, dealId]`.
- **Program ID (devnet):** `9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg`

## Who signs `ai_judge`

- In the demo, by default — **server oracle key** (`ORACLE_SECRET_JSON`), `.env` only, never in the browser.
- Production: HSM / separate service / locked-down endpoint.

## Oracle queue on local LMs (agents)

1. Processes **`npm run oracle-worker --prefix server`** connect to **`WS /ws/oracle-worker`** (optional `?id=my-node`).
2. Orchestrator sends **`oracle_eval`** `{ jobId, deliverableText, model, temperature }`; worker replies **`oracle_result`** `{ jobId, ok, verdict?, reason?, error? }` after calling local LM Studio.
3. Worker selection: **`ORACLE_WORKER_STRATEGY=round_robin`** (default) across idle connections or **`random`**. If no workers, timeout (`ORACLE_WORKER_TIMEOUT_MS`), or error — use server LM (`LM_STUDIO_BASE_URL` / `ORACLE_LLM_URL`) or heuristic.
4. **`GET /api/agent/oracle-workers`** — counters and **`agents`**: `logicalId`, `sessionId`, `name`, **`accepting`**, `busy`.
5. **`GET /api/agent/live`** — agent list only (same shape as `agents`).
6. Chat via selected host: **`POST /api/agent/infer`** body `{ "agentId": "<logicalId>", "messages": [{ "role": "user", "content": "..." }], "model": "", "temperature": 0.7 }`. Orchestrator sends WebSocket **`lm_chat`**; worker replies **`lm_chat_result`** `{ jobId, ok, text?, error? }`.
7. Toggle task acceptance on host (same `logicalId` as `?id=` on connect): **`POST /api/agent/control/accepting`** with `{ "logicalId": "my-node", "accepting": true|false, "secret": "..." }` and/or header **`X-Agent-Control-Secret`**. In **production** **`AGENT_CONTROL_SECRET`** must be set.
8. In **`POST /api/deals`**, **`POST /api/demo/seeded`**, **`POST /api/agent/oracle`** optional **`oracleWorkerAgentId`** (logicalId) — oracle routes to that worker, else round-robin among `accepting`.

## Endpoints

### `GET /api/meta`

Deploy diagnostics: **`apiRevision`**, **`serverSrcDir`**, **`db`** (`pg` / `sqlite`), agent endpoint list. If `apiRevision` is below 3 or `GET /api/agent/live` is missing — **old** orchestrator build (restart `server/`).

### `GET /health`

Liveness. Response (works with `fetchApiHealth`):

```json
{
  "status": "ok",
  "app": "depai-orchestrator",
  "env": "development",
  "ok": true,
  "programId": "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg"
}
```

### `POST /api/v1/auth/challenge` · `POST /api/v1/auth/verify`

Mock for local orchestrator: same paths as depai-backend so the app with `VITE_DEPAI_DEV_WALLET` can obtain a token via [`depaiAuth`](../src/lib/api/depaiAuth.ts). Signature **not verified** — dev only.

### `GET /api/deals`

Deal list from orchestrator DB.

### `GET /api/deals/:id`

`id` — orchestrator row UUID. Returns status and tx signatures when present.

### `POST /api/deals`

Create a deal and (optionally) run on-chain steps through `Submitted`.

Body (JSON):

```json
{
  "dealId": 1001,
  "buyerPublicKey": "<base58>",
  "sellerPublicKey": "<base58>",
  "amountLamports": 1000000,
  "expectedHashHex": "00...64 hex",
  "deliverableText": "{\"text\":\"hello\",\"label\":1}\n...",
  "runChain": true
}
```

- If `runChain: true` and `BUYER_SECRET_JSON`, `SELLER_SECRET_JSON`, `ORACLE_SECRET_JSON` are in `.env`, server runs `initialize_escrow` → `deposit` → `submit_dataset_hash` → heuristic/LLM oracle → `ai_judge`.
- Public keys in body must match the `.env` keypairs when `runChain`.

### `POST /api/deals/:id/oracle`

Re-run oracle + `ai_judge` (if DB state is `submitted`).

### `POST /api/demo/seeded`

One click: creates a deal with `dealId` from timestamp, uses only `.env` keys (see `server/.env.example`).

## CORS

Orchestrator allows origins from **`VITE_DEV_ORIGIN`** (comma-separated) and always adds `http://127.0.0.1:5173`. Default: `http://localhost:5173`.

## Moving to depai-backend

1. Copy `/api/deals` routes and Solana logic from `server/src/`.
2. Keep the same JSON contract — frontend unchanged.
3. Set `VITE_API_BASE_URL` to the new backend URL.
