import z from "zod"
import { Storage } from "../storage/storage"
import { randomUUID } from "crypto"
import { File } from "../file"

export namespace ContextData {
  export const Memory = z
    .object({
      id: z.string(),
      title: z.string(),
      tag: z.string(),
      createdAt: z.number(),
    })
    .meta({ ref: "ContextMemory" })

  export type Memory = z.infer<typeof Memory>

  export const Create = z.object({
    title: z.string(),
    tag: z.string().optional(),
  })

  const key = (projectID: string) => ["app", "context", projectID]

  export async function list(projectID: string, query?: string) {
    const items = await Storage.read<Memory[]>(key(projectID))
      .then((value) => value ?? [])
      .catch(() => [])

    if (!query) return items

    const match = query.toLowerCase()
    return items.filter((item) => item.title.toLowerCase().includes(match))
  }

  export async function create(projectID: string, input: z.infer<typeof Create>) {
    const items = await list(projectID)
    const memory: Memory = {
      id: randomUUID(),
      title: input.title,
      tag: input.tag ?? "note",
      createdAt: Date.now(),
    }
    const next = [memory, ...items]
    await Storage.write(key(projectID), next)
    return memory
  }

  export async function remove(projectID: string, memoryID: string) {
    const items = await list(projectID)
    const next = items.filter((item) => item.id !== memoryID)
    if (next.length === items.length) throw new Storage.NotFoundError({ message: "Memory not found" })
    await Storage.write(key(projectID), next)
    return true
  }

  export async function index(query?: string) {
    const trimmed = query?.trim() ?? ""
    const items = await File.search({ query: trimmed, limit: 200, dirs: true })
    return items
  }
}
