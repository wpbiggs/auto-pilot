import { Storage } from "../storage/storage"
import z from "zod"
import { randomUUID } from "crypto"
import { Kanban } from "./kanban"

export namespace Ideation {
  export const Status = z.enum(["active", "dismissed", "archived", "converted"])

  export const Idea = z
    .object({
      id: z.string(),
      title: z.string(),
      type: z.string(),
      status: Status,
      impact: z.string(),
      taskID: z.string().optional(),
      createdAt: z.number(),
      updatedAt: z.number(),
    })
    .meta({ ref: "Idea" })

  export type Idea = z.infer<typeof Idea>

  export const Create = z.object({
    title: z.string(),
    type: z.string(),
    impact: z.string().optional(),
  })

  export const Update = z.object({
    title: z.string().optional(),
    type: z.string().optional(),
    impact: z.string().optional(),
    status: Status.optional(),
  })

  const key = (projectID: string) => ["app", "ideation", projectID]

  export async function list(projectID: string) {
    return Storage.read<Idea[]>(key(projectID))
      .then((items) => items ?? [])
      .catch(() => [])
  }

  export async function create(projectID: string, input: z.infer<typeof Create>) {
    const items = await list(projectID)
    const now = Date.now()
    const idea: Idea = {
      id: randomUUID(),
      title: input.title,
      type: input.type,
      status: "active",
      impact: input.impact ?? "Medium",
      createdAt: now,
      updatedAt: now,
    }
    const next = [idea, ...items]
    await Storage.write(key(projectID), next)
    return idea
  }

  export async function update(projectID: string, ideaID: string, input: z.infer<typeof Update>) {
    const items = await list(projectID)
    const now = Date.now()
    const next = items.map((idea) => {
      if (idea.id !== ideaID) return idea
      return {
        ...idea,
        title: input.title ?? idea.title,
        type: input.type ?? idea.type,
        impact: input.impact ?? idea.impact,
        status: input.status ?? idea.status,
        updatedAt: now,
      }
    })

    const updated = next.find((idea) => idea.id === ideaID)
    if (!updated) throw new Storage.NotFoundError({ message: "Idea not found" })

    await Storage.write(key(projectID), next)
    return updated
  }

  export async function convert(projectID: string, ideaID: string) {
    const items = await list(projectID)
    const now = Date.now()
    const idea = items.find((entry) => entry.id === ideaID)
    if (!idea) throw new Storage.NotFoundError({ message: "Idea not found" })

    const task = await Kanban.create(projectID, {
      title: idea.title,
      owner: "Ideation",
      status: "backlog",
    })

    const next = items.map((entry) => {
      if (entry.id !== ideaID) return entry
      return {
        ...entry,
        status: "converted",
        taskID: task.id,
        updatedAt: now,
      }
    })

    await Storage.write(key(projectID), next)
    const updated = next.find((entry) => entry.id === ideaID)
    if (!updated) throw new Storage.NotFoundError({ message: "Idea not found" })

    return { idea: updated, task }
  }

  export async function remove(projectID: string, ideaID: string) {
    const items = await list(projectID)
    const next = items.filter((idea) => idea.id !== ideaID)
    if (next.length === items.length) throw new Storage.NotFoundError({ message: "Idea not found" })
    await Storage.write(key(projectID), next)
    return true
  }
}
