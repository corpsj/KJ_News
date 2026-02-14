import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const client = new pg.Client({
    host: "aws-1-ap-southeast-2.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: "postgres.erntllkkeczystqsjija",
    password: "etMBDcYN9spvf4q6",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  console.log("Connecting...");
  await client.connect();
  console.log("Connected!\n");

  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Schema executed successfully!");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.log("Batch failed, retrying statement by statement...\n");
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        const fl = stmt.split("\n").find((l) => l.trim() && !l.trim().startsWith("--")) || stmt.slice(0, 60);
        console.log(`  OK: ${fl.trim().slice(0, 80)}`);
      } catch (e) {
        const fl = stmt.split("\n").find((l) => l.trim() && !l.trim().startsWith("--")) || stmt.slice(0, 60);
        if (e.message.includes("already exists")) {
          console.log(`  SKIP: ${fl.trim().slice(0, 80)}`);
        } else {
          console.error(`  ERR: ${fl.trim().slice(0, 80)}`);
          console.error(`       ${e.message}`);
        }
      }
    }
  }

  await client.end();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
