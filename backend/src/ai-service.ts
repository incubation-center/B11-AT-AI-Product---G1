/**
 * ai-service – RAG indexing and semantic search via Pinecone.
 * Exposes internal HTTP endpoints consumed by other services.
 * Default port: 8084
 *
 * Requests must include the header:
 *   X-Internal-Key: <INTERNAL_API_KEY>
 */
import { Hono } from "hono";
import { ragRoutes } from "./routes/rag.routes";

const app = new Hono();

// Guard all routes with an internal API key when INTERNAL_API_KEY is set
app.use("*", async (c, next) => {
  const secret = process.env.INTERNAL_API_KEY;
  if (secret) {
    const key = c.req.header("x-internal-key");
    if (key !== secret) {
      return c.json({ message: "Forbidden" }, 403);
    }
  }
  return next();
});

app.route("/", ragRoutes);

const port = Number(process.env.PORT ?? 8084);
export default { port, fetch: app.fetch };
