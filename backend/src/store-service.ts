/**
 * store-service – manages tenant stores (/me/tenant, /tenants/*, /store/* endpoints).
 * Default port: 8083
 */
import { Hono } from "hono";
import { corsMiddleware } from "./lib/cors";
import { tenantRoutes } from "./routes/tenant.routes";

const app = new Hono();
app.use("*", corsMiddleware);
app.route("/", tenantRoutes);

const port = Number(process.env.PORT ?? 8083);
export default { port, fetch: app.fetch };
