import { sql } from "@Stendhal/lib/src/db/DB"
import { join } from "path"

const MIGRATION_LOCK_ID = 123456789

async function waitForDatabase(maxRetries = 20, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sql.unsafe("SELECT 1")
      return
    } catch {
      console.log(`Waiting for database... (${i + 1}/${maxRetries})`)
      await Bun.sleep(delayMs)
    }
  }
  throw new Error("Database not available after maximum retries")
}

export async function migrate() {
  const migratePath = join(import.meta.dir, "../../postgres/migrate.sql")
  const file = Bun.file(migratePath)
  const content = await file.text()

  await waitForDatabase()

  // Use advisory lock to prevent concurrent migrations from multiple replicas
  const [{ pg_try_advisory_lock: acquired }] = await sql.unsafe(`SELECT pg_try_advisory_lock(${MIGRATION_LOCK_ID})`)

  if (!acquired) {
    console.log("Migration already running on another instance, skipping.")
    return
  }

  try {
    console.log("Running database migration...")
    await sql.unsafe(content)
    console.log("Database migration completed successfully.")
  } finally {
    await sql.unsafe(`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`)
  }
}
