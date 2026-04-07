/**
 * Vercel Serverless: тот же Express, что и `server/` (createApp).
 * Маршруты приходят через rewrites в vercel.json (см. /health, /api/*).
 */
import "dotenv/config";
import { createApp } from "../server/src/createApp.js";

const app = createApp();
export default app;
