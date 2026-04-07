# Escora

Marketplace for tasks, datasets, GPU, and AI agents. This repo also includes a Solana / Anchor **dataset escrow** program with the **`ai_judge`** instruction (autonomous payout or refund).

## Solana program · `data_arbiter` (devnet)

- **Program ID:** `9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg`
- **Code:** `programs/data_arbiter/src/lib.rs`
- **Instruction docs:** `programs/README.md`
- **Frontend helpers:** `src/lib/solana/escrow.ts`
- **Off-chain dataset checks (before LLM / tx):** `src/lib/judge/datasetJudge.ts`

Build the program: `anchor build` (requires Anchor CLI and Rust toolchain).

## Frontend

```bash
npm install
npm run dev
```

In dev open [http://127.0.0.1:5173](http://127.0.0.1:5173). **`npm run dev` at repo root** starts both Vite and the **Node orchestrator** (`server/` on **8787**); frontend only — `npm run dev:web`. REST, **`/health`**, escrow, and tasks target the orchestrator ([`src/lib/api/backendOrigin.ts`](src/lib/api/backendOrigin.ts)). Vite proxy in [`vite.config.ts`](vite.config.ts) points to :8787. **SolToloka** optionally talks to a separate FastAPI (`VITE_SOLToloka_API_URL` or the public demo URL in code). On Vercel, the same project can serve the app and `api/escora` — then you often omit `VITE_API_BASE_URL`.

### SolToloka: frontend · backend · agent

| Piece | What to configure |
|-------|-------------------|
| **Frontend** ([`/soltoloka`](http://127.0.0.1:5173/soltoloka)) | This page only: API via [`soltoloka.ts`](src/lib/api/soltoloka.ts). Your instance — **`VITE_SOLToloka_API_URL`**. Rest of the app (`/escrow`, `/tasks`, health) — **`VITE_API_BASE_URL`** → orchestrator (or same-origin on Vercel monolith). |
| **Backend** ([`forkswagen/soltoloka-backend`](https://github.com/forkswagen/soltoloka-backend)) | Postgres, Redis, `.env`, `uvicorn`. Nodes: **POST `/api/v1/compute/register`** (JWT). WebSocket: **`/api/v1/ws/connect/{node_id}`** — path is logged on startup. For **agents** prefer a host with real **wss** (Railway/VM), not classic serverless. |
| **Agent** ([`forkswagen/soltoloka-agent`](https://github.com/forkswagen/soltoloka-agent)) | One repo: worker **`python src/main.py`** and demo LM/backend setup — **`streamlit run streamlit_app/app.py`** (LM Studio host/port, backend WS, `NODE_ID`, `.env`). User LLM calls go **only** as frontend → backend → WS → agent → LM Studio. |

## Backend (production): Node orchestrator `server/`

Target API for the app (escrow, tasks, LM, WebSocket) — deploy [`server/`](server/). Set **`VITE_API_BASE_URL`** to that URL (no trailing `/`) **unless** the frontend and `api/escora` share one Vercel project; in the orchestrator CORS set **`VITE_DEV_ORIGIN`** = frontend origin.

**SolToloka FastAPI** ([forkswagen/soltoloka-backend](https://github.com/forkswagen/soltoloka-backend)) is optional: only **`/soltoloka`**, variable **`VITE_SOLToloka_API_URL`** (or default demo host in code).

## Optional: escrow orchestrator · `server/` (Node)

Local service: Postgres/SQLite + flow `initialize_escrow` → … → `ai_judge` (see [docs/API_CONTRACT.md](docs/API_CONTRACT.md)). First time: `cd server && npm install`. From **root**: `npm run dev` (Vite + orchestrator); API only — `npm run server:dev`.

**WebSocket / LM Studio / oracle-worker:** implemented in `server/` (`/ws`, `/ws/agent`, `/ws/oracle-worker`).

**Local agent host (user’s LM Studio):** Streamlit panel [`streamlit/agent_host_panel.py`](streamlit/agent_host_panel.py) — checks orchestrator and LM Studio (`/v1/models`), toggles task acceptance, copy-paste command for `oracle-worker`. Run: `pip install -r streamlit/requirements.txt`, then **`npm run agent-host:panel`** from root (UI at [http://127.0.0.1:8501](http://127.0.0.1:8501)). Worker stays a separate process: `npm run oracle-worker --prefix server`.

### Main scenario (~5 minutes)

Goal: verify **AI-oracled escrow** on Solana devnet runs end-to-end through `ai_judge`.

1. **Prerequisites:** `server/.env` (template [server/.env.example](server/.env.example)) has `BUYER_SECRET_JSON`, `SELLER_SECRET_JSON`, `ORACLE_SECRET_JSON` — JSON byte arrays in Solana keypair format. On **devnet** all three have SOL; buyer also covers `deposit` ([server/README.md](server/README.md)).
2. **Install:** from root `npm install`, in `server/` run `npm install` if needed.
3. **One command** from repo root:

   ```bash
   npm run dev
   ```

   Starts Vite (**5173**) and orchestrator (**8787**). Alias: `npm run dev:demo`. Frontend only: `npm run dev:web`; API only: `npm run server:dev`.
4. **Browser:** open [http://127.0.0.1:5173/escrow](http://127.0.0.1:5173/escrow). Orchestrator status should be green; click **“Run seeded demo”**.
5. **Expect:** a deal appears with status `settled` and a link to the `ai_judge` tx (Solscan devnet).

**Troubleshooting**

- No `/health` — start `server/` on :8787 or set `VITE_API_BASE_URL` to your orchestrator; check CORS (`VITE_DEV_ORIGIN` on server).
- **503** about keys in seeded demo — not implemented on chosen backend or `server/.env` missing for local Node orchestrator.
- On-chain / RPC errors — devnet, balances, `VITE_SOLANA_RPC_URL` / `SOLANA_RPC_URL` in `server/.env` for local runs.

Optionally set `VITE_DEPAI_DEV_WALLET` in **`.env.local`** for auth compatibility with other backends; local orchestrator serves `GET /api/deals` without JWT.

## Deploy (Vercel) — production

**Frontend:** [https://ai-mesh-market.vercel.app](https://ai-mesh-market.vercel.app) · **Orchestrator:** same Vercel project (`api/escora` + Function env) **or** separate `server/` (Railway, etc.) · **SolToloka** — optional separate FastAPI.

### Frontend (this repo → Vercel)

1. **Project → Settings → Environment Variables**
2. **`VITE_API_BASE_URL`** — orchestrator URL if **not** same-origin; omit when using monolith `api/escora`.
3. Optional **`VITE_SOLToloka_API_URL`** — `/soltoloka` only.
4. Optional **`VITE_DEPAI_DEV_WALLET`**, **`VITE_SOLANA_RPC_URL`** — see [.env.example](.env.example).
5. **Function env** for `api/escora`: `DATABASE_URL`, keypairs, `VITE_DEV_ORIGIN`, `AGENT_CONTROL_SECRET`, etc. — see [server/.env.example](server/.env.example).
6. **Redeploy** after changing `VITE_*` (baked into **build**).

Build: [`vercel.json`](vercel.json) (`dist/`, SPA fallback, rewrites to `api/escora`).

### Backend: Node `server/` (Railway / VPS / local)

For escrow, tasks, and WebSocket deploy [`server/`](server/) (Root Directory **`server`**, [server/.env.example](server/.env.example), **`VITE_DEV_ORIGIN`** for CORS). On the frontend set **`VITE_API_BASE_URL`** to that URL **unless** you use the Vercel monolith.

### Optional: SolToloka FastAPI (`/soltoloka` only)

Deploy [**forkswagen/soltoloka-backend**](https://github.com/forkswagen/soltoloka-backend) and set **`VITE_SOLToloka_API_URL`**, or use **`SOLTOLOKA_UPSTREAM_URL`** for `/api/soltoloka-proxy`.

## Hackathon submission (National Solana Hackathon by Decentrathon)

- **Track:** 2 — AI + Blockchain (autonomous / AI-oracled escrow).
- **Colosseum:** upload submission (per rules).
- **Google form:** [https://forms.gle/ZfKofXP5ymxW69o48](https://forms.gle/ZfKofXP5ymxW69o48)
- **Deadline (per brief):** 23:59 **April 7, 2026** (GMT+5).

In the description include: **GitHub** link, **Program ID** (above), frontend URL, short steps from “Main scenario” / production above.

**3–5 minute pitch:** draft outline — [docs/PITCH_OUTLINE.md](docs/PITCH_OUTLINE.md).
