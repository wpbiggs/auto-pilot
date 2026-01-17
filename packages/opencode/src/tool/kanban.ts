import z from "zod"
import { Tool } from "./tool"
import { reviewSignal } from "../app/kanban-review"
import { Instance } from "../project/instance"

const parameters = z.object({
  taskID: z.string().describe("Kanban task ID"),
  summary: z.string().optional().describe("Summary of completed work"),
  prompt: z.string().optional().describe("Follow-up prompt if more work is needed"),
  sessionID: z.string().optional().describe("Session ID tied to the task"),
})

export const KanbanTool = Tool.define("kanban_signal", {
  description: "Signal that a kanban task has been completed and request a model review.",
  parameters,
  async execute(args, ctx) {
    const result = await reviewSignal(Instance.project.id, args.taskID, {
      type: "complete",
      sessionID: args.sessionID ?? ctx.sessionID,
      agent: ctx.agent,
      summary: args.summary,
      prompt: args.prompt,
    })
    return {
      title: "Kanban signal",
      metadata: {
        taskID: result.task.id,
        status: result.review.status,
      },
      output: `Review ${result.review.status}: ${result.review.notes}`,
    }
  },
})
