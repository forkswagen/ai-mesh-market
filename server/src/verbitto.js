import { randomUUID, createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import {
  createVerbittoOffchainTask,
  getVerbittoOffchainTask,
  listVerbittoOffchainTasks,
  patchVerbittoOffchainTask,
} from "./db.js";
import { fetchVerbittoTaskPubkeysOnChain } from "./verbittoChain.js";

export function sha256Utf8Hex(text) {
  return createHash("sha256").update(String(text), "utf8").digest("hex");
}

/** @param {Record<string, unknown>} row */
function offchainRowToDto(row) {
  const created =
    typeof row.created_at === "string" ? Number(row.created_at) : Number(row.created_at ?? 0);
  return {
    id: row.id,
    creatorPublicKey: row.creator_pubkey,
    title: row.title,
    description: row.description,
    descriptionHashHex: row.description_hash_hex,
    taskCategory: row.task_category,
    chainTaskPublicKey: row.chain_task_pubkey,
    createdAt: created,
  };
}

/** @returns {number|null|false} null = omit, number = valid, false = invalid */
function parseCategory(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 6) return false;
  return n;
}

/**
 * @param {import("express").Express} app
 */
export function attachVerbittoRoutes(app) {
  /** SHA-256(UTF-8 text) → 64 hex chars (для description_hash / deliverable_hash на чейне). */
  app.post("/api/verbitto/hash", (req, res) => {
    const text = req.body?.text;
    if (typeof text !== "string") {
      return res.status(400).json({ error: "body.text must be a string" });
    }
    res.json({ descriptionHashHex: sha256Utf8Hex(text) });
  });

  /** Экспериментально: pubkeys аккаунтов с дискриминатором Task (нужен VERBITTO_PROGRAM_ID на сервере). */
  app.get("/api/verbitto/on-chain-tasks", async (_req, res) => {
    try {
      const result = await fetchVerbittoTaskPubkeysOnChain();
      res.json({ ok: true, ...result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  app.post("/api/verbitto/offchain-tasks", async (req, res) => {
    const creator = req.body?.creatorPublicKey ?? req.body?.creator_pubkey;
    const description = req.body?.description;
    const title = req.body?.title ?? null;
    const category = parseCategory(req.body?.taskCategory ?? req.body?.category);

    if (typeof creator !== "string" || !creator.trim()) {
      return res.status(400).json({ error: "creatorPublicKey required" });
    }
    if (typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ error: "description required" });
    }
    if (category === false) {
      return res.status(400).json({ error: "taskCategory must be integer 0..6" });
    }

    try {
      new PublicKey(creator.trim());
    } catch {
      return res.status(400).json({ error: "invalid creatorPublicKey" });
    }

    const id = randomUUID();
    const description_hash_hex = sha256Utf8Hex(description);
    const now = Date.now();

    try {
      await createVerbittoOffchainTask({
        id,
        creator_pubkey: creator.trim(),
        title: typeof title === "string" ? title.trim() || null : null,
        description,
        description_hash_hex,
        task_category: category,
        chain_task_pubkey: null,
        created_at: now,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: String(e?.message || e) });
    }

    res.status(201).json(offchainRowToDto({
      id,
      creator_pubkey: creator.trim(),
      title: title?.trim() || null,
      description,
      description_hash_hex,
      task_category: category,
      chain_task_pubkey: null,
      created_at: now,
    }));
  });

  app.get("/api/verbitto/offchain-tasks", async (req, res) => {
    try {
      const limit = req.query?.limit;
      const rows = await listVerbittoOffchainTasks({ limit: Number(limit) || 100 });
      res.json({ tasks: rows.map((r) => offchainRowToDto(r)) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  app.get("/api/verbitto/offchain-tasks/:id", async (req, res) => {
    try {
      const row = await getVerbittoOffchainTask(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });
      res.json(offchainRowToDto(row));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  /** После create_task: привязать pubkey таска к офчейн-записи. */
  app.patch("/api/verbitto/offchain-tasks/:id", async (req, res) => {
    const chainTask = req.body?.chainTaskPublicKey ?? req.body?.chain_task_pubkey;
    if (typeof chainTask !== "string" || !chainTask.trim()) {
      return res.status(400).json({ error: "chainTaskPublicKey required" });
    }
    try {
      new PublicKey(chainTask.trim());
    } catch {
      return res.status(400).json({ error: "invalid chainTaskPublicKey" });
    }
    try {
      const row = await getVerbittoOffchainTask(req.params.id);
      if (!row) return res.status(404).json({ error: "not found" });
      await patchVerbittoOffchainTask(req.params.id, { chain_task_pubkey: chainTask.trim() });
      const updated = await getVerbittoOffchainTask(req.params.id);
      res.json({
        ok: true,
        id: req.params.id,
        chain_task_pubkey: chainTask.trim(),
        task: updated ? offchainRowToDto(updated) : null,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}
