# 3–5 minute pitch · Escora / AI Escrow (track 2)

## 1. Problem (30–45 s)

Delivering data and settling between parties: quality disputes, opacity, manual decisions. You need a **verifiable** link between an **outcome** (including AI) and **deal settlement** on-chain.

## 2. Solution (45 s)

**AI-oracled escrow** on Solana (devnet): `data_arbiter` — escrow, deliverable hash, **`ai_judge`** commits the verdict and closes the deal. Server oracle (LLM or heuristic) signs the transaction — **not just a UI hint**, but **contract state change**.

## 3. Browser demo (90–120 s)

1. Open [https://ai-mesh-market.vercel.app/escrow](https://ai-mesh-market.vercel.app/escrow) (or local per README).
2. Confirm orchestrator is up (green status).
3. **“Run seeded demo”** → deal shows **`settled`**.
4. Open **Solscan** link for `ai_judge`.

## 4. Architecture (30 s, 1 slide)

`Frontend → orchestrator API → Solana RPC → program` + off-chain oracle (verdict → `ai_judge` signature). Details: [API_CONTRACT.md](API_CONTRACT.md) — who signs and why in MVP.

## 5. MVP honesty (20 s)

Server oracle key; production — access control, HSM / policy. Marketplace UI (Tasks, datasets) is a **scenario showcase**; proof value is **escrow + on-chain**.

## 6. Close (15 s)

Track 2 brief: **AI → decision → on-chain**. Repo, Program ID, live frontend link.

---

**Rehearsal:** 5-minute timer; backup — screen recording of the same flow.
