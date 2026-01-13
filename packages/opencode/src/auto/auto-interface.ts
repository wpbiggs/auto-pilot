import { Tool } from "../tool/tool"
import { AutoSelector } from "./auto-selector"
import { Session } from "../session"
import { MessageV2 } from "../session/message-v2"
import { Agent } from "../agent/agent"
import { Config } from "../config/config"
import { Bus } from "../bus"
import { Identifier } from "../id/id"
import { SessionPrompt } from "../session/prompt"
import { iife } from "@/util/iife"
import { defer } from "@/util/defer"
import { Log } from "../util/log"
import z from "zod"

const log = Log.create({ service: "auto-interface" })

const AutoTaskParameters = z.object({
  prompt: z.string().describe("The task description - Auto interface will analyze and select optimal agent and model"),
  priority: z.enum(["low", "medium", "high"]).optional().describe("Task priority for resource allocation"),
  parallel: z.boolean().optional().describe("Whether to run multiple agents in parallel for complex tasks"),
  session_id: z.string().optional().describe("Existing session to continue"),
})

export const AutoTaskTool = Tool.define("auto", async (ctx) => {
  return {
    description:
      "Auto-claude style intelligent interface that automatically selects the optimal agent and model based on task analysis. Use this for autonomous task execution with smart resource allocation.",
    parameters: AutoTaskParameters,
    async execute(params: z.infer<typeof AutoTaskParameters>, ctx) {
      const config = await Config.get()

      // Check if auto-selection is enabled
      if (!config.experimental?.autoSelection) {
        throw new Error("Auto-selection is not enabled. Enable it in config with experimental.autoSelection = true")
      }

      log.info("auto task started", {
        promptLength: params.prompt.length,
        priority: params.priority,
        parallel: params.parallel,
      })

      // Analyze task and get optimal selections
      const selection = await AutoSelector.getAutoSelection(params.prompt)

      log.info("auto selection complete", {
        agent: selection.agent,
        model: `${selection.model.providerID}/${selection.model.modelID}`,
        taskType: selection.analysis.taskType,
        complexity: selection.analysis.complexity,
        confidence: selection.analysis.confidence,
      })

      // Create session for the auto task
      const session = await iife(async () => {
        if (params.session_id) {
          const found = await Session.get(params.session_id).catch(() => {})
          if (found) return found
        }

        return await Session.create({
          parentID: ctx.sessionID,
          title: `Auto: ${params.prompt.slice(0, 50)}${params.prompt.length > 50 ? "..." : ""}`,
          permission: [
            {
              permission: "todowrite",
              pattern: "*",
              action: "deny",
            },
            {
              permission: "todoread",
              pattern: "*",
              action: "deny",
            },
            // Allow task execution for complex tasks
            ...(selection.analysis.complexity === "complex"
              ? []
              : [
                  {
                    permission: "task" as const,
                    pattern: "*" as const,
                    action: "deny" as const,
                  },
                ]),
          ],
        })
      })

      // Get current message for context
      const msg = await MessageV2.get({ sessionID: ctx.sessionID, messageID: ctx.messageID })
      if (msg.info.role !== "assistant") throw new Error("Not an assistant message")

      // Set up metadata tracking
      ctx.metadata({
        title: "Auto Task",
        metadata: {
          sessionId: session.id,
          agent: selection.agent,
          model: `${selection.model.providerID}/${selection.model.modelID}`,
          taskType: selection.analysis.taskType,
          complexity: selection.analysis.complexity,
          confidence: selection.analysis.confidence,
        },
      })

      // Handle parallel execution for complex tasks
      if (params.parallel && selection.analysis.requiresMultipleSteps) {
        return await handleParallelExecution(params, selection, session, ctx, msg)
      }

      // Single agent execution
      return await handleSingleExecution(params, selection, session, ctx, msg)
    },
  }
})

async function handleSingleExecution(
  params: z.infer<typeof AutoTaskParameters>,
  selection: Awaited<ReturnType<typeof AutoSelector.getAutoSelection>>,
  session: Session.Info,
  ctx: any,
  msg: MessageV2.WithParts,
) {
  const agent = await Agent.get(selection.agent)
  if (!agent) throw new Error(`Selected agent not found: ${selection.agent}`)

  // Set up progress tracking
  const messageID = Identifier.ascending("message")
  const parts: Record<string, { id: string; tool: string; state: { status: string; title?: string } }> = {}
  const unsub = Bus.subscribe(MessageV2.Event.PartUpdated, async (evt) => {
    if (evt.properties.part.sessionID !== session.id) return
    if (evt.properties.part.messageID === messageID) return
    if (evt.properties.part.type !== "tool") return

    const part = evt.properties.part
    parts[part.id] = {
      id: part.id,
      tool: part.tool,
      state: {
        status: part.state.status,
        title: part.state.status === "completed" ? part.state.title : undefined,
      },
    }

    ctx.metadata({
      title: "Auto Task",
      metadata: {
        summary: Object.values(parts).sort((a, b) => a.id.localeCompare(b.id)),
        sessionId: session.id,
        progress: calculateProgress(parts),
      },
    })
  })

  // Execute the task
  function cancel() {
    SessionPrompt.cancel(session.id)
  }
  ctx.abort.addEventListener("abort", cancel)
  using _ = defer(() => ctx.abort.removeEventListener("abort", cancel))

  const result = await SessionPrompt.prompt({
    messageID,
    sessionID: session.id,
    model: selection.model,
    agent: agent.name,
    tools: {
      todowrite: false,
      todoread: false,
      task: selection.analysis.complexity === "complex",
    },
    parts: await SessionPrompt.resolvePromptParts(params.prompt),
  })

  unsub()

  return formatOutput(result, session, selection, "single")
}

async function handleParallelExecution(
  params: z.infer<typeof AutoTaskParameters>,
  selection: Awaited<ReturnType<typeof AutoSelector.getAutoSelection>>,
  session: Session.Info,
  ctx: any,
  msg: MessageV2.WithParts,
) {
  log.info("starting parallel execution", { sessionId: session.id })

  // Determine sub-tasks for parallel execution
  const subTasks = await breakDownTask(params.prompt, selection.analysis)

  // Create parallel sessions for each sub-task
  const parallelSessions = await Promise.all(
    subTasks.map(async (subTask, index) => {
      const subSession = await Session.create({
        parentID: session.id,
        title: `Auto [${index + 1}/${subTasks.length}]: ${subTask.description}`,
        permission: session.permission,
      })

      const subSelection = await AutoSelector.getAutoSelection(subTask.prompt)
      const subAgent = await Agent.get(subSelection.agent)

      if (!subAgent) throw new Error(`Sub-agent not found: ${subSelection.agent}`)

      return {
        session: subSession,
        agent: subAgent,
        model: subSelection.model,
        task: subTask,
        selection: subSelection,
      }
    }),
  )

  // Execute all tasks in parallel
  const results = await Promise.allSettled(
    parallelSessions.map(async (taskSetup) => {
      const messageID = Identifier.ascending("message")

      return await SessionPrompt.prompt({
        messageID,
        sessionID: taskSetup.session.id,
        model: taskSetup.model,
        agent: taskSetup.agent.name,
        tools: {
          todowrite: false,
          todoread: false,
          task: false,
        },
        parts: await SessionPrompt.resolvePromptParts(taskSetup.task.prompt),
      })
    }),
  )

  // Aggregate results
  const successfulResults = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .map((r) => r.value)

  const failedResults = results.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => r.reason)

  log.info("parallel execution complete", {
    totalTasks: subTasks.length,
    successful: successfulResults.length,
    failed: failedResults.length,
  })

  return formatOutput(
    {
      parts: successfulResults.flatMap((r) => r.parts || []),
    },
    session,
    selection,
    "parallel",
    {
      totalTasks: subTasks.length,
      successful: successfulResults.length,
      failed: failedResults.length,
      subTasks: subTasks.map((t) => t.description),
    },
  )
}

async function breakDownTask(
  prompt: string,
  analysis: AutoSelector.TaskAnalysis,
): Promise<Array<{ description: string; prompt: string }>> {
  // Simple task breakdown logic - can be enhanced with AI
  const tasks = []

  if (analysis.taskType === "coding" && analysis.complexity === "complex") {
    // Break down complex coding tasks
    tasks.push(
      {
        description: "Analyze requirements and plan approach",
        prompt: `Analyze the requirements and create a plan for: ${prompt}`,
      },
      { description: "Implement core functionality", prompt: `Implement the core functionality for: ${prompt}` },
      { description: "Add tests and validation", prompt: `Create tests and validation for: ${prompt}` },
    )
  } else if (analysis.taskType === "exploration") {
    // Break down exploration tasks
    tasks.push(
      { description: "Search codebase", prompt: `Search the codebase for relevant files related to: ${prompt}` },
      { description: "Analyze findings", prompt: `Analyze the search results and provide insights for: ${prompt}` },
    )
  } else {
    // Default: single task
    tasks.push({ description: "Execute task", prompt })
  }

  return tasks
}

function calculateProgress(parts: Record<string, any>): number {
  const total = Object.keys(parts).length
  if (total === 0) return 0

  const completed = Object.values(parts).filter((p: any) => p.state.status === "completed").length
  return Math.round((completed / total) * 100)
}

function formatOutput(
  result: any,
  session: Session.Info,
  selection: Awaited<ReturnType<typeof AutoSelector.getAutoSelection>>,
  executionType: "single" | "parallel",
  metadata?: any,
) {
  const text = result.parts?.findLast((x: any) => x.type === "text")?.text ?? ""

  let metadataText = ""
  if (executionType === "parallel" && metadata) {
    metadataText = `\n\n## Parallel Execution Results\n- Total tasks: ${metadata.totalTasks}\n- Successful: ${metadata.successful}\n- Failed: ${metadata.failed}\n- Sub-tasks: ${metadata.subTasks.join(", ")}`
  }

  const output = [
    `## Auto Task Complete`,
    `**Agent:** ${selection.agent}`,
    `**Model:** ${selection.model.providerID}/${selection.model.modelID}`,
    `**Task Type:** ${selection.analysis.taskType}`,
    `**Complexity:** ${selection.analysis.complexity}`,
    `**Confidence:** ${Math.round(selection.analysis.confidence * 100)}%`,
    metadataText,
    "",
    "### Results",
    text,
    "",
    `<auto_metadata>`,
    `session_id: ${session.id}`,
    `agent: ${selection.agent}`,
    `model: ${selection.model.providerID}/${selection.model.modelID}`,
    `task_type: ${selection.analysis.taskType}`,
    `complexity: ${selection.analysis.complexity}`,
    `execution_type: ${executionType}`,
    `</auto_metadata>`,
  ]
    .filter(Boolean)
    .join("\n")

  return {
    title: "Auto Task",
    metadata: {
      sessionId: session.id,
      agent: selection.agent,
      model: `${selection.model.providerID}/${selection.model.modelID}`,
      taskType: selection.analysis.taskType,
      complexity: selection.analysis.complexity,
      executionType,
    },
    output,
  }
}
