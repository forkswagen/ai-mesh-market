-- Orchestrator schema for PostgreSQL (Neon, etc.).
-- Idempotent: safe to re-apply manually.

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  deal_id BIGINT NOT NULL,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  expected_hash_hex TEXT,
  state TEXT NOT NULL,
  init_sig TEXT,
  deposit_sig TEXT,
  submit_sig TEXT,
  judge_sig TEXT,
  verdict INTEGER,
  reason TEXT,
  error TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS verbitto_offchain_tasks (
  id TEXT PRIMARY KEY,
  creator_pubkey TEXT NOT NULL,
  title TEXT,
  description TEXT NOT NULL,
  description_hash_hex TEXT NOT NULL,
  task_category INTEGER,
  chain_task_pubkey TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verbitto_offchain_creator ON verbitto_offchain_tasks(creator_pubkey);
CREATE INDEX IF NOT EXISTS idx_verbitto_offchain_created ON verbitto_offchain_tasks(created_at DESC);
