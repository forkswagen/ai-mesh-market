# Escora Node orchestrator (`server/`)

Minimal backend for the hackathon demo: SQLite + raw Anchor instructions to `data_arbiter` on Solana devnet.

See [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) — the same contract can be implemented in `depai-backend`.

Service root on Railway is this folder (`server/`). See [railway.toml](railway.toml) (builder **RAILPACK**) and the root [README.md](../README.md). If Railpack fails, confirm **Root Directory = server**; fallback — [Dockerfile](Dockerfile).

## Run

### Quick devnet demo

From **monorepo root**:

```bash
node scripts/setup-devnet-env.mjs
npm run dev
```

Creates `server/.env` with three keypairs and tries airdrop. If RPC returns **429** — fund manually:

```bash
solana balance <PUBKEY> --url devnet
```

Use [faucet.solana.com](https://faucet.solana.com) (network **devnet**, ~1–2 SOL each).

### Manual

Copy [`.env.example`](.env.example) to `.env` and fill:

```env
# BUYER_SECRET_JSON, SELLER_SECRET_JSON, ORACLE_SECRET_JSON (JSON byte array like solana-keygen)
```

All three need SOL on devnet. Buyer also pays `amountLamports` on `deposit`.

Check: from root `npm run demo:check` (orchestrator must listen on **:8787**).

## Oracle / LM Studio

1. **Local workers (preferred):** WebSocket **`/ws/oracle-worker`**. On each machine with LM Studio:

   ```bash
   npm run oracle-worker --prefix server
   ```

   Vars: `ORACLE_WORKER_WS_URL`, `ORACLE_WORKER_ID`, on worker — `LM_STUDIO_BASE_URL` / `ORACLE_LLM_MODEL`. Balancing: `ORACLE_WORKER_STRATEGY=round_robin` or `random`. Disable workers: `ORACLE_USE_AGENT_WORKERS=0`.

2. **Server LM:** `ORACLE_LLM_URL`, `ORACLE_LLM_MODEL`, `ORACLE_LLM_API_KEY` or `LM_STUDIO_BASE_URL`.

3. Otherwise — heuristic in `src/heuristicJudge.js`.

Queue status: `GET /api/agent/oracle-workers` (response includes **`agents`** with `accepting` / `busy`).

Chat from UI through selected host: **`POST /api/agent/infer`** → worker gets **`lm_chat`** and calls local LM Studio. List for UI: **`GET /api/agent/live`**.

Local host panel (LM Studio + diagnostics + accepting): from repo root **`npm run agent-host:panel`** after `pip install -r streamlit/requirements.txt`. Source: [`streamlit/agent_host_panel.py`](../streamlit/agent_host_panel.py). API: **`POST /api/agent/control/accepting`** (see `AGENT_CONTROL_SECRET` in `.env.example`).
