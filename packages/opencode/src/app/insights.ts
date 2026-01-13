import { Storage } from "../storage/storage"
import z from "zod"
import { randomUUID } from "crypto"

export namespace Insights {
  export const Competitor = z
    .object({
      id: z.string(),
      name: z.string(),
      note: z.string(),
      createdAt: z.number(),
    })
    .meta({ ref: "Competitor" })

  export type Competitor = z.infer<typeof Competitor>

  export const Create = z.object({
    name: z.string(),
    note: z.string().optional(),
  })

  const key = (projectID: string) => ["app", "insights", "competitors", projectID]

  export async function list(projectID: string) {
    return Storage.read<Competitor[]>(key(projectID))
      .then((items) => items ?? [])
      .catch(() => [])
  }

  export async function create(projectID: string, input: z.infer<typeof Create>) {
    const items = await list(projectID)
    const entry: Competitor = {
      id: randomUUID(),
      name: input.name,
      note: input.note ?? "",
      createdAt: Date.now(),
    }
    const next = [entry, ...items]
    await Storage.write(key(projectID), next)
    return entry
  }

  export async function remove(projectID: string, competitorID: string) {
    const items = await list(projectID)
    const next = items.filter((item) => item.id !== competitorID)
    if (next.length === items.length) {
      throw new Storage.NotFoundError({ message: "Competitor not found" })
    }
    await Storage.write(key(projectID), next)
    return true
  }
}
