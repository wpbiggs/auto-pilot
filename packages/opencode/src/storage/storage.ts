import { Log } from "../util/log"
import path from "path"
import fs from "fs/promises"
import { lazy } from "../util/lazy"
import { Lock } from "../util/lock"
import { NamedError } from "@opencode-ai/util/error"
import z from "zod"
import { Database } from "bun:sqlite"

export namespace Storage {
  const log = Log.create({ service: "storage" })

  export const NotFoundError = NamedError.create(
    "NotFoundError",
    z.object({
      message: z.string(),
    }),
  )

  const encode = (key: string[]) => key.join("/")
  const decode = (key: string) => key.split("/").filter(Boolean)

  const state = lazy(async () => {
    const dir = path.resolve(process.cwd(), "data")
    await fs.mkdir(dir, { recursive: true })
    const dbPath = path.join(dir, "opencode.db")
    const db = new Database(dbPath, { create: true })
    db.exec("PRAGMA journal_mode = WAL;")
    db.exec("CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    await migrateLegacy(db)
    log.info("storage initialized", { dbPath })
    return { db }
  })

  export async function remove(key: string[]) {
    const db = await state().then((x) => x.db)
    const target = encode(key)
    return withErrorHandling(async () => {
      using _ = await Lock.write(target)
      db.query("DELETE FROM storage WHERE key = ?").run(target)
    })
  }

  export async function read<T>(key: string[]) {
    const db = await state().then((x) => x.db)
    const target = encode(key)
    return withErrorHandling(async () => {
      using _ = await Lock.read(target)
      const row = db.query("SELECT value FROM storage WHERE key = ?").get(target) as { value: string } | undefined
      if (!row) throw new NotFoundError({ message: `Resource not found: ${target}` })
      return JSON.parse(row.value) as T
    })
  }

  export async function update<T>(key: string[], fn: (draft: T) => void) {
    const db = await state().then((x) => x.db)
    const target = encode(key)
    return withErrorHandling(async () => {
      using _ = await Lock.write(target)
      const row = db.query("SELECT value FROM storage WHERE key = ?").get(target) as { value: string } | undefined
      if (!row) throw new NotFoundError({ message: `Resource not found: ${target}` })
      const content = JSON.parse(row.value) as T
      fn(content)
      db.query(
        "INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      ).run(target, JSON.stringify(content))
      return content
    })
  }

  export async function write<T>(key: string[], content: T) {
    const db = await state().then((x) => x.db)
    const target = encode(key)
    return withErrorHandling(async () => {
      using _ = await Lock.write(target)
      db.query(
        "INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      ).run(target, JSON.stringify(content))
    })
  }

  export async function list(prefix: string[]) {
    const db = await state().then((x) => x.db)
    const target = encode(prefix)
    const pattern = target ? `${target}/%` : "%"
    return withErrorHandling(async () => {
      const rows = db.query("SELECT key FROM storage WHERE key LIKE ? ORDER BY key").all(pattern) as { key: string }[]
      return rows.map((row) => decode(row.key))
    })
  }

  async function migrateLegacy(db: Database) {
    const dir = path.resolve(process.cwd(), "data")
    const marker = path.join(dir, "migration_sqlite")
    const legacyRoot = path.join(process.env.HOME ?? "", ".local", "share", "opencode", "storage")

    const already = await fs.readFile(marker, "utf8").catch(() => "")
    if (already === "done") return

    const exists = await fs
      .stat(legacyRoot)
      .then(() => true)
      .catch(() => false)
    if (!exists) {
      await fs.writeFile(marker, "done")
      return
    }

    log.info("migrating legacy storage", { legacyRoot })
    const entries: string[] = []
    const scan = async (root: string) => {
      const items = await fs.readdir(root, { withFileTypes: true })
      for (const item of items) {
        const full = path.join(root, item.name)
        if (item.isDirectory()) {
          await scan(full)
        } else if (item.isFile() && item.name.endsWith(".json")) {
          entries.push(full)
        }
      }
    }

    await scan(legacyRoot)

    const stmt = db.query(
      "INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )

    for (const file of entries) {
      const rel = path.relative(legacyRoot, file)
      const key = rel
        .replace(/\.json$/, "")
        .split(path.sep)
        .join("/")
      const content = await fs.readFile(file, "utf8")
      stmt.run(key, content)
    }

    await fs.writeFile(marker, "done")
    log.info("legacy storage migrated", { count: entries.length })
  }

  async function withErrorHandling<T>(body: () => Promise<T>) {
    return body().catch((e) => {
      if (e instanceof NotFoundError) throw e
      if (!(e instanceof Error)) throw e
      throw e
    })
  }
}
