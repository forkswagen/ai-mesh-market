-- Кошелёк как учётная запись + регистрация хоста (logical_id) для вебхуков провайдера.
CREATE TABLE IF NOT EXISTS wallet_identities (
  wallet_pubkey TEXT PRIMARY KEY,
  last_auth_at BIGINT NOT NULL,
  last_challenge TEXT
);

CREATE TABLE IF NOT EXISTS registered_agents (
  id TEXT PRIMARY KEY,
  wallet_pubkey TEXT NOT NULL,
  logical_id TEXT NOT NULL,
  display_name TEXT,
  webhook_url TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE(wallet_pubkey, logical_id)
);

CREATE INDEX IF NOT EXISTS idx_registered_agents_logical ON registered_agents(logical_id);
CREATE INDEX IF NOT EXISTS idx_registered_agents_wallet ON registered_agents(wallet_pubkey);
