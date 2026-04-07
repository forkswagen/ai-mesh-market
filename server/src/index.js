import "dotenv/config";
import http from "node:http";
import { createApp } from "./createApp.js";
import { attachDealsWebSocket } from "./dealsWs.js";

const PORT = Number(process.env.PORT) || 8787;
const app = createApp();
const server = http.createServer(app);
attachDealsWebSocket(server);
server.listen(PORT, () => {
  console.log(`depai-orchestrator http://localhost:${PORT} ws /ws /ws/agent /ws/oracle-worker`);
});
