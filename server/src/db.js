import pg from "pg";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATABASE_URL = process.env.DATABASE_URL?.trim();

const DEAL_PATCH_COLS = new Set([
  "deal_id",
  "buyer",
  "seller",
  "amount_lamports",
  "expected_hash_hex",
  "state",
  "init_sig",
  "deposit_sig",
  "submit_sig",
  "judge_sig",
  "verdict",
  "reason",
  "error",
  "created_at",
]);

const PLATFORM_TASK_PATCH_COLS = new Set(["status"]);

/** @type {pg.Pool | null} */
let pool = null;
/** @type {import("better-sqlite3").Database | null} */
let sqlite = null;

let pgSchemaReady = false;

function initSqlite() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(__dirname, "..", "data");
  mkdirSync(dataDir, { recursive: true });
  const dbPath = join(dataDir, "deals.sqlite");
  const db = new Database(dbPath);

  db.exec(`
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
  `);

  db.exec(`
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
  `);

  return db;
}

if (DATABASE_URL) {
  pool = new pg.Pool({ connectionString: DATABASE_URL });
} else {
  sqlite = initSqlite();
}

async function ensurePostgresSchema() {
  if (!pool || pgSchemaReady) return;
  const client = await pool.connect();
  try {
    await client.query(`
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
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_by TEXT,
        created_at BIGINT NOT NULL
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_platform_tasks_created ON platform_tasks(created_at DESC);`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_platform_tasks_category ON platform_tasks(category);`,
    );
  } finally {
    client.release();
  }
  pgSchemaReady = true;
}

async function pgQ(text, params = []) {
  await ensurePostgresSchema();
  const r = await pool.query(text, params);
  return r;
}

export function dbDriver() {
  return DATABASE_URL ? "postgres" : "sqlite";
}

const insertSqlite = sqlite
  ? sqlite.prepare(`
  INSERT INTO deals (id, deal_id, buyer, seller, amount_lamports, expected_hash_hex, state, created_at)
  VALUES (@id, @deal_id, @buyer, @seller, @amount_lamports, @expected_hash_hex, @state, @created_at)
`)
  : null;

const insertPlatformTaskSqlite = sqlite
  ? sqlite.prepare(`
  INSERT INTO platform_tasks (id, title, description, category, status, created_by, created_at)
  VALUES (@id, @title, @description, @category, @status, @created_by, @created_at)
`)
  : null;

export async function createDeal(row) {
  if (pool) {
    await pgQ(
      `INSERT INTO deals (id, deal_id, buyer, seller, amount_lamports, expected_hash_hex, state, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        row.id,
        row.deal_id,
        row.buyer,
        row.seller,
        row.amount_lamports,
        row.expected_hash_hex ?? null,
        row.state,
        row.created_at,
      ],
    );
    return;
  }
  insertSqlite.run(row);
}

export async function patchDeal(id, patch) {
  const keys = Object.keys(patch).filter((k) => patch[k] !== undefined && DEAL_PATCH_COLS.has(k));
  if (keys.length === 0) return;
  if (pool) {
    const vals = keys.map((k) => patch[k]);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    await pgQ(`UPDATE deals SET ${set} WHERE id = $${keys.length + 1}`, [...vals, id]);
    return;
  }
  const filtered = Object.fromEntries(keys.map((k) => [k, patch[k]]));
  const set = keys.map((k) => `${k} = @${k}`).join(", ");
  sqlite.prepare(`UPDATE deals SET ${set} WHERE id = @id`).run({ id, ...filtered });
}

export async function getDeal(id) {
  if (pool) {
    const { rows } = await pgQ("SELECT * FROM deals WHERE id = $1", [id]);
    return rows[0] ?? null;
  }
  return sqlite.prepare("SELECT * FROM deals WHERE id = ?").get(id);
}

export async function listDeals() {
  if (pool) {
    const { rows } = await pgQ("SELECT * FROM deals ORDER BY created_at DESC");
    return rows;
  }
  return sqlite.prepare("SELECT * FROM deals ORDER BY created_at DESC").all();
}

export async function createPlatformTask(row) {
  if (pool) {
    await pgQ(
      `INSERT INTO platform_tasks (id, title, description, category, status, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        row.id,
        row.title,
        row.description,
        row.category,
        row.status ?? "open",
        row.created_by ?? null,
        row.created_at,
      ],
    );
    return;
  }
  insertPlatformTaskSqlite.run({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status ?? "open",
    created_by: row.created_by ?? null,
    created_at: row.created_at,
  });
}

export async function getPlatformTask(id) {
  if (pool) {
    const { rows } = await pgQ("SELECT * FROM platform_tasks WHERE id = $1", [id]);
    return rows[0] ?? null;
  }
  return sqlite.prepare("SELECT * FROM platform_tasks WHERE id = ?").get(id);
}

export async function listPlatformTasks({ limit = 50 } = {}) {
  const n = Math.min(Math.max(Number(limit) || 50, 1), 200);
  if (pool) {
    const { rows } = await pgQ("SELECT * FROM platform_tasks ORDER BY created_at DESC LIMIT $1", [n]);
    return rows;
  }
  return sqlite.prepare("SELECT * FROM platform_tasks ORDER BY created_at DESC LIMIT ?").all(n);
}

export async function patchPlatformTask(id, patch) {
  const keys = Object.keys(patch).filter((k) => patch[k] !== undefined && PLATFORM_TASK_PATCH_COLS.has(k));
  if (keys.length === 0) return;
  if (pool) {
    const vals = keys.map((k) => patch[k]);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    await pgQ(`UPDATE platform_tasks SET ${set} WHERE id = $${keys.length + 1}`, [...vals, id]);
    return;
  }
  const filtered = Object.fromEntries(keys.map((k) => [k, patch[k]]));
  const set = keys.map((k) => `${k} = @${k}`).join(", ");
  sqlite.prepare(`UPDATE platform_tasks SET ${set} WHERE id = @id`).run({ id, ...filtered });
}
