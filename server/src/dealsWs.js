import { WebSocketServer, WebSocket } from "ws";
import { listDeals } from "./db.js";

/** @type {WebSocketServer | null} */
let wss = null;
let pingInterval = null;

/**
 * Подключает WebSocket /ws к существующему HTTP-серверу Express.
 * @param {import("http").Server} server
 */
export function attachDealsWebSocket(server) {
  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const host = req.headers.host || "localhost";
    const path = new URL(req.url || "/", `http://${host}`).pathname;
    if (path !== "/ws") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    try {
      ws.send(JSON.stringify({ type: "deals_snapshot", deals: listDeals() }));
    } catch {
      /* ignore */
    }
  });

  pingInterval = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30_000);
}

export function broadcastDealsUpdate() {
  if (!wss) return;
  let payload;
  try {
    payload = JSON.stringify({ type: "deals_snapshot", deals: listDeals() });
  } catch {
    return;
  }
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch {
        /* ignore */
      }
    }
  }
}

/** Для корректного выхода в тестах (опционально). */
export function closeDealsWebSocket() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = null;
  if (wss) {
    wss.close();
    wss = null;
  }
}
