/**
 * Execution Service - Real OpenCode SDK Integration
 * Manages task execution using OpenCode SDK sessions and prompts
 */

import { createOpencodeClient } from "@opencode-ai/sdk/client"

// Types for execution
export interface TaskConfig {
  model: string
  prompt: string
  defaultPrompt: string
}

export interface ExecutionTask {
  id: string
  name: string
  description: string
  model: string
  customPrompt?: string
  complexity: string
  estimateMinutes: number
}

export interface ExecutionPlan {
  projectName: string
  description: string
  tasks: ExecutionTask[]
  phases: Array<{
    id: string
    name: string
    tasks: ExecutionTask[]
  }>
  totalEstimateMinutes: number
  estimatedCost: number
}

export interface TaskStatus {
  status: "queued" | "running" | "completed" | "failed"
  progress: number
  output?: string
  error?: string
  tokensUsed?: number
  cost?: number
  duration?: number
}

export interface ExecutionStatus {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  runningTasks: number
  queuedTasks: number
  progressPercentage: number
  isComplete: boolean
  tasks: Array<ExecutionTask & TaskStatus>
  totalTokensUsed: number
  totalCost: number
  totalDuration: number
}

export interface ExecutionEvent {
  type: 
    | "task_started" 
    | "task_progress" 
    | "task_completed" 
    | "task_failed" 
    | "execution_completed"
    | "log"
  taskId?: string
  message?: string
  logType?: "info" | "success" | "error" | "warning"
  output?: string
  error?: string
  tokensUsed?: number
  cost?: number
}

export interface AvailableModel {
  id: string
  name: string
  providerId: string
  providerName: string
  tier: "premium" | "standard" | "fast"
  available: boolean
  cost?: {
    input: number
    output: number
  }
}

export type ExecutionUpdateCallback = (status: ExecutionStatus, event: ExecutionEvent | null) => void

// Model tier mapping
const MODEL_TIERS: Record<string, "premium" | "standard" | "fast"> = {
  "claude-opus-4-20250514": "premium",
  "claude-sonnet-4-20250514": "standard",
  "claude-3-5-haiku-20241022": "fast",
  "gpt-4o": "standard",
  "gpt-4o-mini": "fast",
}

// Model display names
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "claude-opus-4-20250514": "Claude Opus 4",
  "claude-sonnet-4-20250514": "Claude Sonnet 4",
  "claude-3-5-haiku-20241022": "Claude Haiku",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
}

// Provider display names
const PROVIDER_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
}

/**
 * Get the OpenCode SDK client instance
 * Uses the local OpenCode server running on port 4242 by default
 */
function getClient(baseUrl?: string) {
  const url = baseUrl || import.meta.env.VITE_OPENCODE_URL || "http://localhost:4242"
  return createOpencodeClient({ baseUrl: url })
}

/**
 * Fetch available models from the OpenCode SDK
 */
export async function fetchAvailableModels(baseUrl?: string): Promise<AvailableModel[]> {
  try {
    const client = getClient(baseUrl)
    const response = await client.provider.list()
    
    if (!response.data) {
      console.error("[ExecutionService] No provider data returned")
      return getDefaultModels()
    }

    const { all: providers, connected } = response.data
    const connectedSet = new Set(connected || [])
    const models: AvailableModel[] = []

    for (const provider of providers) {
      const isConnected = connectedSet.has(provider.id)
      
      for (const [modelId, modelInfo] of Object.entries(provider.models)) {
        models.push({
          id: modelId,
          name: MODEL_DISPLAY_NAMES[modelId] || modelInfo.name || modelId,
          providerId: provider.id,
          providerName: PROVIDER_NAMES[provider.id] || provider.name,
          tier: MODEL_TIERS[modelId] || "standard",
          available: isConnected && !modelInfo.experimental,
          cost: modelInfo.cost ? {
            input: modelInfo.cost.input,
            output: modelInfo.cost.output,
          } : undefined,
        })
      }
    }

    // Sort by availability and tier
    return models.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1
      const tierOrder = { premium: 0, standard: 1, fast: 2 }
      return tierOrder[a.tier] - tierOrder[b.tier]
    })
  } catch (error) {
    console.error("[ExecutionService] Failed to fetch models:", error)
    return getDefaultModels()
  }
}

/**
 * Get default models when SDK is not available
 */
function getDefaultModels(): AvailableModel[] {
  return [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", providerId: "anthropic", providerName: "Anthropic", tier: "standard", available: true },
    { id: "claude-opus-4-20250514", name: "Claude Opus 4", providerId: "anthropic", providerName: "Anthropic", tier: "premium", available: true },
    { id: "claude-3-5-haiku-20241022", name: "Claude Haiku", providerId: "anthropic", providerName: "Anthropic", tier: "fast", available: true },
    { id: "gpt-4o", name: "GPT-4o", providerId: "openai", providerName: "OpenAI", tier: "standard", available: true },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", providerId: "openai", providerName: "OpenAI", tier: "fast", available: true },
  ]
}

/**
 * Map a simple model name to full model configuration
 */
function getModelConfig(modelName: string): { providerID: string; modelID: string } {
  const modelMap: Record<string, { providerID: string; modelID: string }> = {
    "claude-opus": { providerID: "anthropic", modelID: "claude-opus-4-20250514" },
    "claude-sonnet": { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" },
    "claude-haiku": { providerID: "anthropic", modelID: "claude-3-5-haiku-20241022" },
    "gpt-4o": { providerID: "openai", modelID: "gpt-4o" },
    "gpt-4o-mini": { providerID: "openai", modelID: "gpt-4o-mini" },
    // Also handle full model IDs
    "claude-opus-4-20250514": { providerID: "anthropic", modelID: "claude-opus-4-20250514" },
    "claude-sonnet-4-20250514": { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" },
    "claude-3-5-haiku-20241022": { providerID: "anthropic", modelID: "claude-3-5-haiku-20241022" },
  }
  return modelMap[modelName] || { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" }
}

/**
 * Build the prompt for a task
 */
function buildTaskPrompt(task: ExecutionTask, projectDescription: string): string {
  // Use custom prompt if provided
  if (task.customPrompt) {
    return task.customPrompt
  }

  // Generate default prompt
  return `You are an expert software developer. Complete the following task as part of a larger project.

## Project Context
${projectDescription}

## Task: ${task.name}

### Description
${task.description}

### Requirements
1. Follow best practices for the technology stack
2. Write clean, maintainable code
3. Include comprehensive error handling
4. Add comments for complex logic
5. Consider edge cases and security implications

### Expected Output
Provide a complete implementation with all necessary files and configurations.
Explain your approach and any important decisions made.`
}

/**
 * Extract text content from SDK response
 */
function extractResponseText(response: any): string {
  if (typeof response === "string") return response
  if (response?.data?.parts) {
    return response.data.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text || p.content || "")
      .join("\n")
  }
  if (response?.data?.content) return response.data.content
  if (response?.data?.text) return response.data.text
  if (response?.content) return response.content
  if (response?.text) return response.text
  if (Array.isArray(response?.data)) {
    return response.data
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text || p.content)
      .join("\n")
  }
  return JSON.stringify(response, null, 2)
}

/**
 * Real Execution Service using OpenCode SDK
 */
export function createExecutionService(
  plan: ExecutionPlan,
  onUpdate: ExecutionUpdateCallback,
  options?: {
    baseUrl?: string
    maxParallel?: number
    retryOnFailure?: boolean
    maxRetries?: number
  }
) {
  const config = {
    baseUrl: options?.baseUrl,
    maxParallel: options?.maxParallel || 1, // Default to sequential for safety
    retryOnFailure: options?.retryOnFailure ?? true,
    maxRetries: options?.maxRetries || 2,
  }

  let running = true
  let paused = false
  let client: ReturnType<typeof getClient> | null = null
  
  const taskStates = new Map<string, TaskStatus>()
  const taskRetries = new Map<string, number>()
  
  // Initialize all tasks as queued
  plan.tasks.forEach(task => {
    taskStates.set(task.id, { status: "queued", progress: 0 })
    taskRetries.set(task.id, 0)
  })

  // Metrics
  let totalTokensUsed = 0
  let totalCost = 0
  let totalDuration = 0

  const getStatus = (): ExecutionStatus => {
    const states = [...taskStates.entries()]
    const completed = states.filter(([, t]) => t.status === "completed").length
    const failed = states.filter(([, t]) => t.status === "failed").length
    const runningCount = states.filter(([, t]) => t.status === "running").length
    const queued = states.filter(([, t]) => t.status === "queued").length

    return {
      totalTasks: plan.tasks.length,
      completedTasks: completed,
      failedTasks: failed,
      runningTasks: runningCount,
      queuedTasks: queued,
      progressPercentage: Math.round((completed / plan.tasks.length) * 100),
      isComplete: completed + failed === plan.tasks.length,
      tasks: plan.tasks.map(t => ({
        ...t,
        ...taskStates.get(t.id)!
      })),
      totalTokensUsed,
      totalCost,
      totalDuration,
    }
  }

  const emitLog = (type: "info" | "success" | "error" | "warning", message: string) => {
    onUpdate(getStatus(), { type: "log", logType: type, message })
  }

  const executeTask = async (task: ExecutionTask): Promise<void> => {
    const startTime = Date.now()
    
    try {
      // Update status to running
      taskStates.set(task.id, { status: "running", progress: 0 })
      onUpdate(getStatus(), { type: "task_started", taskId: task.id })
      emitLog("info", `Starting task: ${task.name}`)

      // Simulate initial progress
      taskStates.set(task.id, { status: "running", progress: 10 })
      onUpdate(getStatus(), null)

      // Create a new session for this task
      const sessionResult = await client!.session.create({
        body: {
          title: `Auto: ${task.name.substring(0, 50)}`
        }
      })

      if (!sessionResult.data?.id) {
        throw new Error("Failed to create session")
      }

      const sessionId = sessionResult.data.id
      emitLog("info", `Created session for: ${task.name}`)

      // Update progress
      taskStates.set(task.id, { status: "running", progress: 30 })
      onUpdate(getStatus(), null)

      // Get model configuration
      const modelConfig = getModelConfig(task.model)

      // Build the prompt
      const prompt = buildTaskPrompt(task, plan.description)

      // Execute via SDK session.prompt
      emitLog("info", `Executing with ${modelConfig.modelID}...`)
      taskStates.set(task.id, { status: "running", progress: 50 })
      onUpdate(getStatus(), null)

      const response = await client!.session.prompt({
        path: { id: sessionId },
        body: {
          model: modelConfig,
          parts: [{ type: "text" as const, text: prompt }]
        }
      })

      // Extract output
      const output = extractResponseText(response)
      const duration = Date.now() - startTime
      
      // Estimate tokens and cost (rough estimation)
      const estimatedTokens = Math.round((prompt.length + output.length) / 4)
      const costPerToken = modelConfig.modelID.includes("opus") ? 0.015 / 1000 
        : modelConfig.modelID.includes("gpt-4o") && !modelConfig.modelID.includes("mini") ? 0.01 / 1000
        : 0.003 / 1000
      const estimatedCost = estimatedTokens * costPerToken

      // Update totals
      totalTokensUsed += estimatedTokens
      totalCost += estimatedCost
      totalDuration += duration

      // Update task status
      taskStates.set(task.id, {
        status: "completed",
        progress: 100,
        output: output.substring(0, 2000) + (output.length > 2000 ? "..." : ""),
        tokensUsed: estimatedTokens,
        cost: estimatedCost,
        duration,
      })

      onUpdate(getStatus(), { 
        type: "task_completed", 
        taskId: task.id,
        output: output.substring(0, 500),
        tokensUsed: estimatedTokens,
        cost: estimatedCost,
      })
      emitLog("success", `Completed: ${task.name} (${Math.round(duration / 1000)}s)`)

    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`[ExecutionService] Task ${task.id} failed:`, error)
      
      // Check if should retry
      const retries = taskRetries.get(task.id) || 0
      if (config.retryOnFailure && retries < config.maxRetries) {
        taskRetries.set(task.id, retries + 1)
        emitLog("warning", `Retrying ${task.name} (attempt ${retries + 2}/${config.maxRetries + 1})`)
        
        // Reset to queued for retry
        taskStates.set(task.id, { status: "queued", progress: 0 })
        await executeTask(task)
        return
      }

      // Mark as failed
      taskStates.set(task.id, {
        status: "failed",
        progress: 0,
        error: error.message || "Unknown error",
        duration,
      })

      onUpdate(getStatus(), { 
        type: "task_failed", 
        taskId: task.id,
        error: error.message,
      })
      emitLog("error", `Failed: ${task.name} - ${error.message}`)
    }
  }

  const execute = async () => {
    try {
      // Initialize SDK client
      client = getClient(config.baseUrl)
      emitLog("info", "Connected to OpenCode SDK")

      // Execute tasks sequentially (can be parallelized if needed)
      for (const task of plan.tasks) {
        if (!running) break

        // Wait if paused
        while (paused) {
          await new Promise(r => setTimeout(r, 100))
          if (!running) break
        }

        await executeTask(task)
      }

      const status = getStatus()
      onUpdate(status, { type: "execution_completed" })
      emitLog("success", `Execution complete: ${status.completedTasks}/${status.totalTasks} tasks succeeded`)

    } catch (error: any) {
      console.error("[ExecutionService] Execution failed:", error)
      emitLog("error", `Execution failed: ${error.message}`)
    }
  }

  // Start execution
  execute()

  return {
    pause: () => {
      paused = true
      emitLog("warning", "Execution paused")
    },
    resume: () => {
      paused = false
      emitLog("info", "Execution resumed")
    },
    cancel: () => {
      running = false
      emitLog("warning", "Execution cancelled")
    },
    isPaused: () => paused,
    getStatus,
  }
}

/**
 * Mock Execution Service for demo/fallback
 * Used when SDK is not available
 */
export function createMockExecutionService(
  plan: ExecutionPlan,
  onUpdate: ExecutionUpdateCallback
) {
  let running = true
  let paused = false
  const taskStates = new Map<string, TaskStatus>()

  // Initialize all tasks as queued
  plan.tasks.forEach(task => {
    taskStates.set(task.id, { status: "queued", progress: 0 })
  })

  const getStatus = (): ExecutionStatus => {
    const completed = [...taskStates.values()].filter(t => t.status === "completed").length
    const failed = [...taskStates.values()].filter(t => t.status === "failed").length
    const runningCount = [...taskStates.values()].filter(t => t.status === "running").length
    const queued = [...taskStates.values()].filter(t => t.status === "queued").length

    return {
      totalTasks: plan.tasks.length,
      completedTasks: completed,
      failedTasks: failed,
      runningTasks: runningCount,
      queuedTasks: queued,
      progressPercentage: Math.round((completed / plan.tasks.length) * 100),
      isComplete: completed + failed === plan.tasks.length,
      tasks: plan.tasks.map(t => ({
        ...t,
        ...taskStates.get(t.id)!
      })),
      totalTokensUsed: completed * 5000,
      totalCost: completed * 0.05,
      totalDuration: completed * 30000,
    }
  }

  const simulate = async () => {
    onUpdate(getStatus(), { type: "log", logType: "warning", message: "Running in demo mode (SDK not connected)" })

    for (const task of plan.tasks) {
      if (!running) break

      while (paused) {
        await new Promise(r => setTimeout(r, 100))
        if (!running) break
      }

      // Start task
      taskStates.set(task.id, { status: "running", progress: 0 })
      onUpdate(getStatus(), { type: "task_started", taskId: task.id })
      onUpdate(getStatus(), { type: "log", logType: "info", message: `Started: ${task.name}` })

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        if (!running) break
        while (paused) {
          await new Promise(r => setTimeout(r, 100))
          if (!running) break
        }

        taskStates.set(task.id, { status: "running", progress })
        onUpdate(getStatus(), null)
        await new Promise(r => setTimeout(r, 200))
      }

      // Complete task (95% success rate for demo)
      const success = Math.random() > 0.05
      taskStates.set(task.id, {
        status: success ? "completed" : "failed",
        progress: 100,
        output: success ? `Mock output for ${task.name}` : undefined,
        error: success ? undefined : "Simulated failure",
      })

      onUpdate(getStatus(), {
        type: success ? "task_completed" : "task_failed",
        taskId: task.id
      })
      onUpdate(getStatus(), { 
        type: "log", 
        logType: success ? "success" : "error", 
        message: success ? `Completed: ${task.name}` : `Failed: ${task.name}` 
      })
    }

    onUpdate(getStatus(), { type: "execution_completed" })
    onUpdate(getStatus(), { type: "log", logType: "success", message: "All tasks completed!" })
  }

  // Start simulation
  simulate()

  return {
    pause: () => { paused = true },
    resume: () => { paused = false },
    cancel: () => { running = false },
    isPaused: () => paused,
    getStatus,
  }
}

/**
 * Check if OpenCode SDK is available
 */
export async function checkSDKConnection(baseUrl?: string): Promise<boolean> {
  try {
    const client = getClient(baseUrl)
    const response = await client.session.list()
    return response.data !== undefined
  } catch {
    return false
  }
}
