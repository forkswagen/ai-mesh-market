/**
 * Применяет server/migrations/*.sql к PostgreSQL.
 * Требуется DATABASE_URL в server/.env или окружении.
 *
 * npm run migrate --prefix server
 */
import "dotenv/config";
import pg from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL не задан. Добавьте строку Neon в server/.env и повторите.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS _schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const dup = await client.query("SELECT 1 FROM _schema_migrations WHERE name = $1", [file]);
  if (dup.rows.length > 0) {
    console.log("[migrate] skip", file);
    continue;
  }
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO _schema_migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log("[migrate] applied", file);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[migrate] failed", file, e);
    throw e;
  }
}

await client.end();
console.log("[migrate] done");
