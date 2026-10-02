import path from "node:path";
import express from "express";
import helmet from "helmet";
import { pool } from "./db";
import { router } from "./routes";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error("SUPABASE_URL is required in the root .env file.");
const supabaseOrigin = new URL(supabaseUrl).origin;

if (isProduction) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "connect-src": ["'self'", supabaseOrigin],
    },
  },
}));
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});
app.use("/api", router);

const webDist = path.resolve(__dirname, "..", "..", "web", "dist");
app.use(express.static(webDist, {
  index: false,
  maxAge: isProduction ? "1h" : 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
  },
}));
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});
app.get("*", (_req, res, next) => {
  res.sendFile(path.join(webDist, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (res.headersSent) return;
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "Request body must be valid JSON." });
    return;
  }
  if (error && typeof error === "object" && "issues" in error && Array.isArray(error.issues)) {
    res.status(400).json({ error: "Please check the submitted information.", details: error.issues });
    return;
  }
  const databaseError = error as { code?: string; constraint?: string; message?: string };
  if (databaseError.code === "23505") {
    res.status(409).json({ error: "That value is already in use." });
    return;
  }
  if (databaseError.code === "23503" || databaseError.code === "23514") {
    res.status(400).json({ error: "The submitted data conflicts with existing records." });
    return;
  }
  console.error("Unhandled request error.", error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

export default app;
