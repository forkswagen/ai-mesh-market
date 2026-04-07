-- Marketplace tasks (our DB only, no Verbitto / on-chain links).
CREATE TABLE IF NOT EXISTS platform_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_by TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_tasks_created ON platform_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_tasks_category ON platform_tasks(category);
