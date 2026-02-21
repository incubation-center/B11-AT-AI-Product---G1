import { Hono } from "hono";
import { authOpenApiSpec, swaggerUiHtml } from "../auth/openapi";

export const docsRoutes = new Hono();

docsRoutes.get("/openapi.json", (c) => c.json(authOpenApiSpec));
docsRoutes.get("/docs", (c) => c.html(swaggerUiHtml));
