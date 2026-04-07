import { randomUUID } from "node:crypto";
import {
  createPlatformTask,
  getPlatformTask,
  listPlatformTasks,
  patchPlatformTask,
} from "./db.js";

const ALLOWED_STATUS = new Set(["open", "in_progress", "done"]);

function rowToDto(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    createdBy: row.created_by,
    createdAt: Number(row.created_at),
  };
}

function parseCategory(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 6) return null;
  return n;
}

/**
 * @param {import("express").Express} app
 */
export function attachPlatformTaskRoutes(app) {
  app.get("/api/tasks", async (req, res) => {
    try {
      const limit = Number(req.query?.limit) || 100;
      const rows = await listPlatformTasks({ limit });
      res.json({ tasks: rows.map(rowToDto) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    const title = req.body?.title;
    const description = req.body?.description;
    const category = parseCategory(req.body?.category ?? req.body?.taskCategory);
    const createdBy =
      typeof req.body?.createdBy === "string" && req.body.createdBy.trim()
        ? req.body.createdBy.trim()
        : typeof req.body?.created_by === "string" && req.body.created_by.trim()
          ? req.body.created_by.trim()
          : null;
    let status = typeof req.body?.status === "string" ? req.body.status.trim() : "open";
    if (!ALLOWED_STATUS.has(status)) status = "open";

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    if (typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ error: "description is required" });
    }
    if (category === null) {
      return res.status(400).json({ error: "category must be integer 0..6" });
    }

    const id = randomUUID();
    const created_at = Date.now();
    try {
      await createPlatformTask({
        id,
        title: title.trim(),
        description: description.trim(),
        category,
        status,
        created_by: createdBy,
        created_at,
      });
      const row = await getPlatformTask(id);
      res.status(201).json(row ? rowToDto(row) : { id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";
    if (!status || !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ error: "status must be open | in_progress | done" });
    }
    try {
      const existing = await getPlatformTask(req.params.id);
      if (!existing) return res.status(404).json({ error: "not found" });
      await patchPlatformTask(req.params.id, { status });
      const updated = await getPlatformTask(req.params.id);
      res.json({ ok: true, task: updated ? rowToDto(updated) : null });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}
