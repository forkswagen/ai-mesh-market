import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, "deals.sqlite");

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    deal_id INTEGER NOT NULL,
    buyer TEXT NOT NULL,
    seller TEXT NOT NULL,
    amount_lamports INTEGER NOT NULL,
    expected_hash_hex TEXT,
    state TEXT NOT NULL,
    init_sig TEXT,
    deposit_sig TEXT,
    submit_sig TEXT,
    judge_sig TEXT,
    verdict INTEGER,
    reason TEXT,
    error TEXT,
    created_at INTEGER NOT NULL
  );
`);

const insert = db.prepare(`
  INSERT INTO deals (id, deal_id, buyer, seller, amount_lamports, expected_hash_hex, state, created_at)
  VALUES (@id, @deal_id, @buyer, @seller, @amount_lamports, @expected_hash_hex, @state, @created_at)
`);

export function createDeal(row) {
  insert.run(row);
}

export function patchDeal(id, patch) {
  const keys = Object.keys(patch).filter((k) => patch[k] !== undefined);
  if (keys.length === 0) return;
  const set = keys.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE deals SET ${set} WHERE id = @id`).run({ id, ...patch });
}

export function getDeal(id) {
  return db.prepare("SELECT * FROM deals WHERE id = ?").get(id);
}

export function listDeals() {
  return db.prepare("SELECT * FROM deals ORDER BY created_at DESC").all();
}
