import { Storage } from "../storage/storage"
import z from "zod"
import { randomUUID } from "crypto"

export namespace Kanban {
  export const Status = z.enum(["backlog", "in_progress", "review", "human_review", "done"])
  export const ReviewStatus = z.enum(["pending", "approved", "revise"])
  export const ActivityType = z.enum(["signal", "review", "human", "complete", "reopen"])

  export const Review = z
    .object({
      status: ReviewStatus,
      notes: z.string().optional(),
      prompt: z.string().optional(),
      reviewer: z.string().optional(),
      reviewedAt: z.number().optional(),
    })
    .meta({ ref: "KanbanReview" })

  export const Activity = z
    .object({
      type: ActivityType,
      status: z.string(),
      notes: z.string().optional(),
      prompt: z.string().optional(),
      actor: z.string().optional(),
      at: z.number(),
    })
    .meta({ ref: "KanbanActivity" })

  export const Info = z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      owner: z.string(),
      agent: z.string().optional(),
      sessionID: z.string().optional(),
      summary: z.string().optional(),
      status: Status,
      category: z.string(),
      complexity: z.string(),
      priority: z.string(),
      estimate: z.string(),
      review: Review.optional(),
      activity: Activity.array().optional(),
      createdAt: z.number(),
      updatedAt: z.number(),
    })
    .meta({ ref: "KanbanTask" })

  export type Info = z.infer<typeof Info>

  export const Create = z.object({
    title: z.string(),
    description: z.string().optional(),
    owner: z.string().optional(),
    agent: z.string().optional(),
    sessionID: z.string().optional(),
    summary: z.string().optional(),
    status: Status.optional(),
    category: z.string().optional(),
    complexity: z.string().optional(),
    priority: z.string().optional(),
    estimate: z.string().optional(),
    review: Review.optional(),
    activity: Activity.array().optional(),
  })

  export const Update = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    owner: z.string().optional(),
    agent: z.string().optional(),
    sessionID: z.string().optional(),
    summary: z.string().optional(),
    status: Status.optional(),
    category: z.string().optional(),
    complexity: z.string().optional(),
    priority: z.string().optional(),
    estimate: z.string().optional(),
    review: Review.optional(),
    activity: Activity.array().optional(),
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
      agent: input.agent,
      sessionID: input.sessionID,
      summary: input.summary,
      status: input.status ?? "backlog",
      category: input.category ?? "General",
      complexity: input.complexity ?? "Medium",
      priority: input.priority ?? "Normal",
      estimate: input.estimate ?? "",
      review: input.review,
      activity: input.activity,
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
        agent: input.agent ?? task.agent,
        sessionID: input.sessionID ?? task.sessionID,
        summary: input.summary ?? task.summary,
        status: input.status ?? task.status,
        category: input.category ?? task.category,
        complexity: input.complexity ?? task.complexity,
        priority: input.priority ?? task.priority,
        estimate: input.estimate ?? task.estimate,
        review: input.review ?? task.review,
        activity: input.activity ?? task.activity,
        updatedAt: now,
      }
    })

    const updated = next.find((task) => task.id === taskID)
    if (!updated) throw new Storage.NotFoundError({ message: "Task not found" })

    await Storage.write(key(projectID), next)
    return updated
  }

  export const Signal = z.object({
    type: z.enum(["complete"]),
    sessionID: z.string().optional(),
    agent: z.string().optional(),
    summary: z.string().optional(),
    prompt: z.string().optional(),
  })

  export const HumanAction = z.object({
    action: z.enum(["complete", "reopen"]),
    notes: z.string().optional(),
    prompt: z.string().optional(),
    actor: z.string().optional(),
  })

  function appendActivity(task: Info, entry: z.infer<typeof Activity>) {
    return [...(task.activity ?? []), entry]
  }

  export async function signal(projectID: string, taskID: string, input: z.infer<typeof Signal>) {
    const task = await list(projectID).then((items) => items.find((entry) => entry.id === taskID))
    if (!task) throw new Storage.NotFoundError({ message: "Task not found" })
    const activity = appendActivity(task, {
      type: "signal",
      status: "review",
      notes: input.summary,
      prompt: input.prompt,
      actor: input.agent,
      at: Date.now(),
    })
    const base = await update(projectID, taskID, {
      status: "review",
      agent: input.agent ?? task.agent,
      sessionID: input.sessionID ?? task.sessionID,
      summary: input.summary ?? task.summary,
      review: {
        status: "pending",
      },
      activity,
    })
    return base
  }

  export async function humanAction(projectID: string, taskID: string, input: z.infer<typeof HumanAction>) {
    const task = await list(projectID).then((items) => items.find((entry) => entry.id === taskID))
    if (!task) throw new Storage.NotFoundError({ message: "Task not found" })
    const status = input.action === "complete" ? "done" : "in_progress"
    const activity = appendActivity(task, {
      type: input.action === "complete" ? "complete" : "reopen",
      status,
      notes: input.notes,
      prompt: input.prompt,
      actor: input.actor,
      at: Date.now(),
    })
    return update(projectID, taskID, {
      status,
      review: task.review,
      activity,
    })
  }

  export async function remove(projectID: string, taskID: string) {
    const items = await list(projectID)
    const next = items.filter((task) => task.id !== taskID)
    if (next.length === items.length) throw new Storage.NotFoundError({ message: "Task not found" })
    await Storage.write(key(projectID), next)
    return true
  }
}
