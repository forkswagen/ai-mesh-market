import { WebSocketServer, WebSocket } from "ws";
import { listDeals } from "./db.js";
import { fetchLmStudioModels, getLmStudioBaseUrl } from "./lmStudioClient.js";

/** @type {WebSocketServer | null} */
let dealsWss = null;
/** @type {WebSocketServer | null} */
let agentWss = null;
let pingInterval = null;
let agentPollInterval = null;
let upgradeListenerAttached = false;

function pathname(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url || "/", `http://${host}`).pathname;
}

async function agentLmPayloadJson() {
  try {
    const { baseUrl, models } = await fetchLmStudioModels();
    return JSON.stringify({
      type: "lm_models",
      baseUrl,
      models,
      error: null,
      fetchedAt: Date.now(),
    });
  } catch (e) {
    return JSON.stringify({
      type: "lm_models",
      baseUrl: getLmStudioBaseUrl(),
      models: [],
      error: String(e.message || e),
      fetchedAt: Date.now(),
    });
  }
}

async function sendAgentSnapshot(ws) {
  const payload = await agentLmPayloadJson();
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(payload);
    } catch {
      /* ignore */
    }
  }
}

async function broadcastAgentSnapshots() {
  if (!agentWss || agentWss.clients.size === 0) return;
  const payload = await agentLmPayloadJson();
  for (const client of agentWss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Подключает WebSocket: /ws (сделки), /ws/agent (LM Studio → список моделей + refresh).
 * @param {import("http").Server} server
 */
export function attachDealsWebSocket(server) {
  if (upgradeListenerAttached) return;
  upgradeListenerAttached = true;

  dealsWss = new WebSocketServer({ noServer: true });
  agentWss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const path = pathname(req);
    if (path === "/ws") {
      dealsWss.handleUpgrade(req, socket, head, (ws) => {
        dealsWss.emit("connection", ws, req);
      });
      return;
    }
    if (path === "/ws/agent") {
      agentWss.handleUpgrade(req, socket, head, (ws) => {
        agentWss.emit("connection", ws, req);
      });
      return;
    }
    socket.destroy();
  });

  dealsWss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    void listDeals()
      .then((deals) => {
        try {
          ws.send(JSON.stringify({ type: "deals_snapshot", deals }));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  });

  agentWss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    void sendAgentSnapshot(ws);
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "refresh") void sendAgentSnapshot(ws);
      } catch {
        /* ignore */
      }
    });
  });

  pingInterval = setInterval(() => {
    for (const wss of [dealsWss, agentWss]) {
      for (const ws of wss.clients) {
        if (ws.isAlive === false) {
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }
  }, 30_000);

  agentPollInterval = setInterval(() => {
    void broadcastAgentSnapshots();
  }, 20_000);
}

export async function broadcastDealsUpdate() {
  if (!dealsWss) return;
  let deals;
  try {
    deals = await listDeals();
  } catch {
    return;
  }
  let payload;
  try {
    payload = JSON.stringify({ type: "deals_snapshot", deals });
  } catch {
    return;
  }
  for (const client of dealsWss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch {
        /* ignore */
      }
    }
  }
}

export function closeDealsWebSocket() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = null;
  if (agentPollInterval) clearInterval(agentPollInterval);
  agentPollInterval = null;
  upgradeListenerAttached = false;
  if (dealsWss) {
    dealsWss.close();
    dealsWss = null;
  }
  if (agentWss) {
    agentWss.close();
    agentWss = null;
  }
}
