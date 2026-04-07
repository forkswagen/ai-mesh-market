/**
 * Vercel Serverless: same Express app as `server/` (createApp).
 * Routes arrive via rewrites in vercel.json (see /health, /api/*).
 */
import "dotenv/config";
import { createApp } from "../server/src/createApp.js";

const app = createApp();
export default app;
