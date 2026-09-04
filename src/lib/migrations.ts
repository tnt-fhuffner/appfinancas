import { readFile } from "node:fs/promises"
import { join } from "node:path"

const SAFE_NAME = /^[a-z0-9][a-z0-9_.-]*\.sql$/i
const cache = new Map<string, Promise<string>>()

export function readMigration(fileName: string) {
  if (!SAFE_NAME.test(fileName)) {
    throw new Error("Migration inválida.")
  }

  const existing = cache.get(fileName)
  if (existing) return existing

  const pending = readFile(
    join(process.cwd(), "supabase/migrations", fileName),
    "utf8"
  )
  cache.set(fileName, pending)
  return pending
}
