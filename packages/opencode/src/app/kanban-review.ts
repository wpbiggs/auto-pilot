import z from "zod"
import { generateObject } from "ai"
import { Provider } from "../provider/provider"
import { SystemPrompt } from "../session/system"
import { SystemData } from "./system"
import { Instance } from "../project/instance"
import { Kanban } from "./kanban"
import { Config } from "../config/config"

const ReviewResult = z.object({
  status: z.enum(["approved", "revise"]),
  notes: z.string(),
  prompt: z.string().optional(),
})

const REVIEW_PROMPT = `
You are a strict quality reviewer for OpenCode tasks.

Review the task details and the agent summary. Decide if the task is fully complete and meets quality standards.
If anything is missing, return status "revise" with clear notes and a follow-up prompt that the agent can use to fix issues.
If the task is complete and correct, return status "approved" with short notes.
`

function parseModelKey(value: string | undefined) {
  if (!value) return
  if (value.includes(":")) return value.split(":")
  if (value.includes("/")) return value.split("/")
}

async function resolveReviewModel(value: string | undefined) {
  const parts = parseModelKey(value)
  const candidate = parts?.length === 2 ? { providerID: parts[0], modelID: parts[1] } : undefined
  const fallback = await Provider.defaultModel()
  const selected = candidate ?? fallback
  const model = await Provider.getModel(selected.providerID, selected.modelID).catch(() => undefined)
  if (model) return { model, providerID: selected.providerID, modelID: selected.modelID }
  const safe = await Provider.getModel(fallback.providerID, fallback.modelID)
  return { model: safe, providerID: fallback.providerID, modelID: fallback.modelID }
}

export async function reviewTask(task: Kanban.Info, prompt?: string) {
  const config = await Config.get()
  const settings = await SystemData.getSettings(Instance.project.id)
  const resolved = await resolveReviewModel(settings.models?.analyzeModel)
  const language = await Provider.getLanguage(resolved.model)

  const system = SystemPrompt.header(resolved.providerID)
  system.push(REVIEW_PROMPT)

  const content = {
    title: task.title,
    description: task.description,
    summary: task.summary,
    agent: task.agent,
    sessionID: task.sessionID,
    status: task.status,
    prompt,
  }

  const result = await generateObject({
    experimental_telemetry: {
      isEnabled: config.experimental?.openTelemetry,
      metadata: {
        userId: config.username ?? "unknown",
      },
    },
    temperature: 0.2,
    messages: [
      ...system.map((item) => ({
        role: "system" as const,
        content: item,
      })),
      {
        role: "user" as const,
        content: `Review this task and summary: ${JSON.stringify(content)}`,
      },
    ],
    model: language,
    schema: ReviewResult,
  })
    .then((res) => res.object)
    .catch(() => undefined)

  const fallback = {
    status: "revise" as const,
    notes: "Review failed. Please double-check task completion and resubmit.",
    prompt: undefined,
  }

  return {
    result: result ?? fallback,
    reviewer: `${resolved.providerID}:${resolved.modelID}`,
  }
}

export async function reviewSignal(projectID: string, taskID: string, input: z.infer<typeof Kanban.Signal>) {
  const base = await Kanban.signal(projectID, taskID, input)
  const review = await reviewTask(base, input.prompt)
  const status = review.result.status === "approved" ? "human_review" : "in_progress"
  const activity = [
    ...(base.activity ?? []),
    {
      type: "review" as const,
      status,
      notes: review.result.notes,
      prompt: review.result.prompt ?? undefined,
      actor: review.reviewer,
      at: Date.now(),
    },
  ]
  const next = await Kanban.update(projectID, taskID, {
    status,
    review: {
      status: review.result.status === "approved" ? "approved" : "revise",
      notes: review.result.notes,
      prompt: review.result.prompt ?? undefined,
      reviewer: review.reviewer,
      reviewedAt: Date.now(),
    },
    activity,
  })
  return { task: next, review: review.result }
}
