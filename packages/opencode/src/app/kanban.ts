import { Storage } from "../storage/storage"
import z from "zod"
import { randomUUID } from "crypto"

export namespace Kanban {
  export const Status = z.enum(["backlog", "in_progress", "review", "done"])

  export const Info = z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      owner: z.string(),
      status: Status,
      category: z.string(),
      complexity: z.string(),
      priority: z.string(),
      estimate: z.string(),
      createdAt: z.number(),
      updatedAt: z.number(),
    })
    .meta({ ref: "KanbanTask" })

  export type Info = z.infer<typeof Info>

  export const Create = z.object({
    title: z.string(),
    description: z.string().optional(),
    owner: z.string().optional(),
    status: Status.optional(),
    category: z.string().optional(),
    complexity: z.string().optional(),
    priority: z.string().optional(),
    estimate: z.string().optional(),
  })

  export const Update = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    owner: z.string().optional(),
    status: Status.optional(),
    category: z.string().optional(),
    complexity: z.string().optional(),
    priority: z.string().optional(),
    estimate: z.string().optional(),
  })

  const key = (projectID: string) => ["app", "kanban", projectID]

  export async function list(projectID: string) {
    return Storage.read<Info[]>(key(projectID))
      .then((items) => items ?? [])
      .catch(() => [])
  }

  export async function create(projectID: string, input: z.infer<typeof Create>) {
    const items = await list(projectID)
    const now = Date.now()
    const task: Info = {
      id: randomUUID(),
      title: input.title,
      description: input.description ?? "",
      owner: input.owner ?? "Unassigned",
      status: input.status ?? "backlog",
      category: input.category ?? "General",
      complexity: input.complexity ?? "Medium",
      priority: input.priority ?? "Normal",
      estimate: input.estimate ?? "",
      createdAt: now,
      updatedAt: now,
    }
    const next = [task, ...items]
    await Storage.write(key(projectID), next)
    return task
  }

  export async function update(projectID: string, taskID: string, input: z.infer<typeof Update>) {
    const items = await list(projectID)
    const now = Date.now()
    const next = items.map((task) => {
      if (task.id !== taskID) return task
      return {
        ...task,
        title: input.title ?? task.title,
        description: input.description ?? task.description,
        owner: input.owner ?? task.owner,
        status: input.status ?? task.status,
        category: input.category ?? task.category,
        complexity: input.complexity ?? task.complexity,
        priority: input.priority ?? task.priority,
        estimate: input.estimate ?? task.estimate,
        updatedAt: now,
      }
    })

    const updated = next.find((task) => task.id === taskID)
    if (!updated) throw new Storage.NotFoundError({ message: "Task not found" })

    await Storage.write(key(projectID), next)
    return updated
  }

  export async function remove(projectID: string, taskID: string) {
    const items = await list(projectID)
    const next = items.filter((task) => task.id !== taskID)
    if (next.length === items.length) throw new Storage.NotFoundError({ message: "Task not found" })
    await Storage.write(key(projectID), next)
    return true
  }
}
