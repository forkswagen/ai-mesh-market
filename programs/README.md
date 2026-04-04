# `data_arbiter` (NexusAI · on-chain dataset escrow)

Solana / Anchor program deployed on **devnet** for hackathon demo: escrow SOL for a dataset deal, submit a content hash, then settle via **`ai_judge`** (permissionless signer) or optional manual **`judge_authority`**.

**Program ID (devnet):** `9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg`

## Instructions

| Instruction | Role |
|-------------|------|
| `initialize_escrow` | Buyer creates PDA; optional `judge_authority` (`None` → only `ai_judge` + deposit/submit paths). |
| `deposit` | Buyer locks `amount` lamports into the escrow PDA. |
| `submit_dataset_hash` | Seller sets `submitted_hash` (off-chain file should match `expected_hash` for a fair demo). |
| `ai_judge` | **Any** signer; if `verdict == true` → release lamports to seller, else refund buyer; sets `ai_judged_at`; emits `AiJudged`. |
| `release_to_seller` / `refund_buyer` | Only if `judge_authority` was set at init; signer must match. |

## Security note

`ai_judge` is intentionally permissionless for the autonomous-agent story: gate who can call it off-chain (API key, HSM, multisig, or upgrade to on-chain oracle in production).

## Build / IDL

```bash
anchor build
```

IDL: `target/idl/data_arbiter.json`
