import "./env";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Add it to the root .env file.");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
  throw new Error("DATABASE_URL must use the postgres:// or postgresql:// scheme.");
}

const sslEnabled = process.env.DATABASE_SSL === "true";
const sslCaFile = process.env.DATABASE_SSL_CA_FILE;
const sslCaPem = process.env.DATABASE_SSL_CA;
if (sslCaFile && sslCaPem) {
  throw new Error("Set only one of DATABASE_SSL_CA_FILE or DATABASE_SSL_CA.");
}
if ((sslCaFile || sslCaPem) && !sslEnabled) {
  throw new Error("DATABASE_SSL must be true when configuring a database CA certificate.");
}

const sslCa = sslCaFile
  ? fs.readFileSync(path.resolve(__dirname, "..", "..", sslCaFile), "utf8")
  : sslCaPem;

export const pool = new Pool({
  host: databaseUrl.hostname,
  port: databaseUrl.port ? Number(databaseUrl.port) : 5432,
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: decodeURIComponent(databaseUrl.pathname.slice(1)),
  ssl: sslEnabled
    ? { rejectUnauthorized: true, ...(sslCa ? { ca: sslCa } : {}) }
    : undefined,
  max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error.", error);
});
