import { z } from "zod"
import { Provider } from "../provider/provider"
import { Agent } from "../agent/agent"
import { generateObject } from "ai"
import { SystemPrompt } from "../session/system"
import { Config } from "../config/config"
import { Log } from "../util/log"

const TaskAnalysisResult = z.object({
  taskType: z.enum(["coding", "exploration", "documentation", "planning", "debugging", "testing", "review"]),
  complexity: z.enum(["simple", "medium", "complex"]),
  requiresCode: z.boolean(),
  requiresResearch: z.boolean(),
  requiresMultipleSteps: z.boolean(),
  suggestedAgent: z.string(),
  suggestedModel: z.object({
    providerID: z.string(),
    modelID: z.string(),
    reasoning: z.string(),
  }),
  confidence: z.number().min(0).max(1),
})

export type TaskAnalysis = z.infer<typeof TaskAnalysisResult>

export namespace AutoSelector {
  const log = Log.create({ service: "auto-selector" })

  const TASK_ANALYSIS_PROMPT = `
You are an intelligent task analyzer for OpenCode. Your job is to analyze user requests and determine the optimal agent and model for the task.

Available agents:
- build: Primary agent for coding and implementation tasks
- plan: Primary agent for planning and architectural design
- general: General-purpose agent for multi-step tasks and parallel execution
- explore: Specialized agent for codebase exploration and research

Task types and their characteristics:
- coding: Writing, modifying, or implementing code
- exploration: Searching, analyzing, or understanding codebases
- documentation: Creating or updating documentation
- planning: Architectural design, project planning
- debugging: Finding and fixing issues
- testing: Writing tests or validation
- review: Code review and analysis

Complexity guidelines:
- simple: Single file changes, basic configurations, straightforward tasks
- medium: Multiple files, moderate complexity, some coordination needed
- complex: Large-scale changes, multiple systems, high coordination required

Model selection guidelines:
- Use smaller/faster models (like haiku) for simple tasks, documentation, and basic exploration
- Use medium models (like sonnet) for coding, debugging, and medium complexity tasks
- Use larger models (like opus) for complex planning, architecture, and difficult debugging

Analyze the user request and provide your recommendations in the specified JSON format.
`

  export async function analyzeTask(userPrompt: string): Promise<TaskAnalysis> {
    const config = await Config.get()
    const defaultModel = await Provider.defaultModel()
    const model = await Provider.getModel(defaultModel.providerID, defaultModel.modelID)
    const language = await Provider.getLanguage(model)

    const system = SystemPrompt.header(defaultModel.providerID)
    system.push(TASK_ANALYSIS_PROMPT)

    try {
      const result = await generateObject({
        experimental_telemetry: {
          isEnabled: config.experimental?.openTelemetry,
          metadata: {
            userId: config.username ?? "unknown",
          },
        },
        temperature: 0.3,
        messages: [
          ...system.map((item) => ({
            role: "system" as const,
            content: item,
          })),
          {
            role: "user" as const,
            content: `Analyze this task: "${userPrompt}"`,
          },
        ],
        model: language,
        schema: TaskAnalysisResult,
      })

      const analysis = result.object
      log.info("task analyzed", {
        taskType: analysis.taskType,
        complexity: analysis.complexity,
        suggestedAgent: analysis.suggestedAgent,
        confidence: analysis.confidence,
      })

      return analysis
    } catch (error) {
      log.error("task analysis failed", { error })
      // Fallback to basic analysis
      return fallbackAnalysis(userPrompt)
    }
  }

  export async function selectOptimalModel(
    taskAnalysis: TaskAnalysis,
  ): Promise<{ providerID: string; modelID: string }> {
    const config = await Config.get()
    const availableModels = await Provider.listModels()

    // Model selection logic based on task analysis
    let targetModel: { providerID: string; modelID: string } | null = null

    if (taskAnalysis.complexity === "simple") {
      // Prefer smaller/faster models for simple tasks
      targetModel = availableModels.find(
        (m) =>
          m.modelID.toLowerCase().includes("haiku") ||
          m.modelID.toLowerCase().includes("flash") ||
          m.modelID.toLowerCase().includes("small"),
      )
    } else if (taskAnalysis.complexity === "complex") {
      // Prefer larger models for complex tasks
      targetModel = availableModels.find(
        (m) =>
          m.modelID.toLowerCase().includes("opus") ||
          m.modelID.toLowerCase().includes("gpt-4") ||
          m.modelID.toLowerCase().includes("large"),
      )
    }

    // If no specific model found, use the suggested model from analysis
    if (!targetModel && taskAnalysis.suggestedModel) {
      const suggested = availableModels.find(
        (m) =>
          m.providerID === taskAnalysis.suggestedModel.providerID && m.modelID === taskAnalysis.suggestedModel.modelID,
      )
      if (suggested) targetModel = suggested
    }

    // Final fallback to configured default model
    if (!targetModel) {
      targetModel = await Provider.defaultModel()
    }

    log.info("model selected", {
      providerID: targetModel.providerID,
      modelID: targetModel.modelID,
      reasoning: taskAnalysis.suggestedModel.reasoning || "fallback selection",
    })

    return targetModel
  }

  export async function selectOptimalAgent(taskAnalysis: TaskAnalysis): Promise<string> {
    // Validate that the suggested agent exists and is accessible
    const agents = await Agent.list()
    const suggestedAgent = agents.find((a) => a.name === taskAnalysis.suggestedAgent)

    if (suggestedAgent) {
      log.info("agent selected", {
        agent: suggestedAgent.name,
        reasoning: `matched task type: ${taskAnalysis.taskType}`,
      })
      return suggestedAgent.name
    }

    // Fallback logic based on task type
    let fallbackAgent = "general" // default fallback

    switch (taskAnalysis.taskType) {
      case "coding":
      case "debugging":
      case "testing":
        fallbackAgent = "build"
        break
      case "planning":
        fallbackAgent = "plan"
        break
      case "exploration":
        fallbackAgent = "explore"
        break
      case "documentation":
      case "review":
        fallbackAgent = "general"
        break
    }

    log.info("agent fallback selected", {
      agent: fallbackAgent,
      reasoning: `task type: ${taskAnalysis.taskType}, suggested agent not available`,
    })

    return fallbackAgent
  }

  export async function getAutoSelection(userPrompt: string): Promise<{
    agent: string
    model: { providerID: string; modelID: string }
    analysis: TaskAnalysis
  }> {
    const analysis = await analyzeTask(userPrompt)
    const agent = await selectOptimalAgent(analysis)
    const model = await selectOptimalModel(analysis)

    return {
      agent,
      model,
      analysis,
    }
  }

  function fallbackAnalysis(userPrompt: string): TaskAnalysis {
    const prompt = userPrompt.toLowerCase()

    // Basic keyword-based fallback analysis
    let taskType: TaskAnalysis["taskType"] = "coding"
    let complexity: TaskAnalysis["complexity"] = "medium"

    if (prompt.includes("explore") || prompt.includes("find") || prompt.includes("search")) {
      taskType = "exploration"
    } else if (prompt.includes("document") || prompt.includes("readme") || prompt.includes("docs")) {
      taskType = "documentation"
    } else if (prompt.includes("plan") || prompt.includes("design") || prompt.includes("architecture")) {
      taskType = "planning"
    } else if (prompt.includes("debug") || prompt.includes("fix") || prompt.includes("error")) {
      taskType = "debugging"
    } else if (prompt.includes("test") || prompt.includes("spec") || prompt.includes("validate")) {
      taskType = "testing"
    } else if (prompt.includes("review") || prompt.includes("check") || prompt.includes("analyze")) {
      taskType = "review"
    }

    if (prompt.includes("simple") || prompt.includes("basic") || prompt.includes("quick")) {
      complexity = "simple"
    } else if (prompt.includes("complex") || prompt.includes("large") || prompt.includes("advanced")) {
      complexity = "complex"
    }

    return {
      taskType,
      complexity,
      requiresCode: ["coding", "debugging", "testing"].includes(taskType),
      requiresResearch: ["exploration", "debugging", "review"].includes(taskType),
      requiresMultipleSteps: complexity !== "simple",
      suggestedAgent: taskType === "exploration" ? "explore" : taskType === "planning" ? "plan" : "general",
      suggestedModel: {
        providerID: "anthropic",
        modelID: complexity === "simple" ? "claude-3-haiku-20240307" : "claude-3-sonnet-20240229",
        reasoning: "fallback analysis based on keywords",
      },
      confidence: 0.5,
    }
  }
}
