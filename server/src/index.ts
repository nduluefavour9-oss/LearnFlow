import "./env";
import app from "./app";
import { pool } from "./db";

const port = Number(process.env.PORT ?? 4000);

async function start() {
  await pool.query("SELECT 1");

  const server = app.listen(port, "0.0.0.0", () => {
    console.info(`LearnFlow server listening on port ${port}.`);
  });

  const shutdown = (signal: string) => {
    console.info(`${signal} received; shutting down gracefully.`);
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch(async (error: unknown) => {
  console.error("LearnFlow failed to start.", error);
  await pool.end();
  process.exitCode = 1;
});
