/**
 * Execution Service - Real OpenCode SDK Integration
 * Manages task execution using OpenCode SDK sessions and prompts
 */

// Import from the monorepo SDK package via Vite alias
// @ts-ignore - Vite alias resolves this at build time
import { createOpencodeClient } from "@opencode-sdk/client"

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

// Webhook/event handler type for failure escalation
export type FailureWebhookHandler = (event: EscalationEvent) => void | Promise<void>

export interface EscalationEvent {
  type: "task_failed" | "escalation_started" | "escalation_completed" | "escalation_failed"
  taskId: string
  taskName: string
  originalModel: string
  escalatedModel?: string
  escalationLevel: number
  maxEscalations: number
  error?: string
  failedOutput?: string
  prompt?: string
  timestamp: number
}

export interface EscalationConfig {
  enabled: boolean
  maxEscalations: number
  modelHierarchy: string[]
  webhookHandlers: FailureWebhookHandler[]
  includeFailedOutputInEscalation: boolean
}

// Default escalation configuration
const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  enabled: true,
  maxEscalations: 2,
  modelHierarchy: [
    "claude-3-5-haiku-20241022",  // Fast tier
    "gpt-4o-mini",                 // Fast tier
    "claude-sonnet-4-20250514",    // Standard tier
    "gpt-4o",                      // Standard tier
    "claude-opus-4-20250514",      // Premium tier (most powerful)
  ],
  webhookHandlers: [],
  includeFailedOutputInEscalation: true,
}

// Model tier mapping
const MODEL_TIERS: Record<string, "premium" | "standard" | "fast"> = {
  "claude-opus-4-20250514": "premium",
  "claude-sonnet-4-20250514": "standard",
  "claude-3-5-haiku-20241022": "fast",
  "gpt-4o": "standard",
  "gpt-4o-mini": "fast",
}

// Model display names
Add real execution setup files and documentation

- Created .env.example with API key templates
- Created start-real.sh script for easy server startup
- Updated execution.ts to use correct port (4096)
- Added setup documentation for real code execution

To enable real execution:
1. Copy .env.example to .env and add API keys
2. Run ./start-real.sh to start OpenCode server
3. Frontend will connect and execute real AI agentsconst MODEL_DISPLAY_NAMES: Record<string, string> = {
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
 * Uses the local OpenCode server running on port 4096 by default
 */
function getClient(baseUrl?: string) {
  const url = baseUrl || import.meta.env.VITE_OPENCODE_URL || "http://localhost:4096" || 'http://localhost:4096';
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
        const info = modelInfo as { name?: string; experimental?: boolean; cost?: { input: number; output: number } }
        models.push({
          id: modelId,
          name: MODEL_DISPLAY_NAMES[modelId] || info.name || modelId,
          providerId: provider.id,
          providerName: PROVIDER_NAMES[provider.id] || provider.name,
          tier: MODEL_TIERS[modelId] || "standard",
          available: isConnected && !info.experimental,
          cost: info.cost ? {
            input: info.cost.input,
            output: info.cost.output,
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
 * Build the prompt for a task - Enhanced with explicit production-ready requirements
 */
function buildTaskPrompt(task: ExecutionTask, projectDescription: string): string {
  // Use custom prompt if provided (but still append critical instructions)
  const basePrompt = task.customPrompt || `## Task: ${task.name}

### Description
${task.description}`

  // Generate comprehensive prompt with strict production-ready requirements
  return `You are an expert senior software developer with extensive production experience. Complete the following task with FULL, PRODUCTION-READY implementation.

## Project Context
${projectDescription}

${basePrompt}

## CRITICAL REQUIREMENTS - READ CAREFULLY

### ⚠️ ABSOLUTE REQUIREMENTS (MUST FOLLOW):
1. **COMPLETE IMPLEMENTATION ONLY** - Every function, method, and component MUST be fully implemented
2. **NO STUBS OR PLACEHOLDERS** - NEVER write stub functions, TODO comments, "// implement later", or placeholder code
3. **NO PARTIAL IMPLEMENTATIONS** - Do not leave any functionality unimplemented
4. **PRODUCTION-READY CODE** - All code must be ready for immediate production deployment
5. **WORKING CODE ONLY** - Every line of code you write must actually work

### 🚫 EXPLICITLY FORBIDDEN (NEVER DO THESE):
- ❌ "// TODO: implement this"
- ❌ "throw new Error('Not implemented')"
- ❌ "pass  # placeholder"
- ❌ "/* stub */", "/* placeholder */"
- ❌ "return null // temporary"
- ❌ Functions that just log "not implemented"
- ❌ Empty function bodies
- ❌ Comments like "implement later", "add logic here", "finish this"
- ❌ Returning mock/fake data when real implementation is needed

### ✅ REQUIRED IN ALL CODE:
1. **Complete Error Handling** - Handle all error cases with proper try/catch, error types, and recovery
2. **Input Validation** - Validate all inputs with clear error messages
3. **Edge Cases** - Handle null, undefined, empty arrays, invalid types
4. **Type Safety** - Use proper types (TypeScript) or type hints (Python)
5. **Security** - Never expose secrets, validate user input, prevent injection attacks
6. **Logging** - Add appropriate logging for debugging and monitoring
7. **Documentation** - Include JSDoc/docstrings for public APIs
8. **Tests** - Write unit tests if the task involves testable logic

### Implementation Approach:
1. Read the entire task description carefully
2. Plan the complete solution before writing code
3. Implement ALL functionality - no shortcuts
4. Test your logic mentally before finalizing
5. Review for any missing pieces or stubs

### Output Format:
Provide the complete, working implementation with:
- All necessary imports
- All function implementations (fully working)
- All error handling
- All edge case handling
- Clear comments explaining complex logic
- Ready to copy-paste and run immediately

Remember: If you cannot fully implement something, explain why and provide the closest complete alternative. NEVER leave placeholder code.`
}

/**
 * Build an escalation prompt when a task fails
 */
function buildEscalationPrompt(
  task: ExecutionTask,
  projectDescription: string,
  failedOutput: string,
  error: string,
  escalationLevel: number
): string {
  return `You are a SENIOR EXPERT developer called in to fix a failed task. A previous AI agent attempted this task but failed.

## Your Mission
Analyze the failure and provide a COMPLETE, WORKING solution. You have more capability than the previous agent - use it.

## Project Context
${projectDescription}

## Original Task: ${task.name}

### Description
${task.description}

## Previous Failure Analysis

### Error Message:
\`\`\`
${error}
\`\`\`

### Failed Attempt Output:
\`\`\`
${failedOutput || "No output was generated before failure"}
\`\`\`

### Escalation Level: ${escalationLevel} (higher = more critical, you are the expert backup)

## Your Responsibilities:

1. **Diagnose the Failure** - Understand exactly why the previous attempt failed
2. **Fix the Root Cause** - Don't just patch symptoms, fix the underlying issue
3. **Complete Implementation** - Provide the FULL working solution, not just fixes
4. **Add Robustness** - Make the solution more resilient than the original attempt

## CRITICAL REQUIREMENTS:

### ⚠️ ABSOLUTE REQUIREMENTS:
- You MUST succeed where the previous agent failed
- Provide COMPLETE, PRODUCTION-READY code
- NO stubs, NO TODOs, NO placeholders
- Handle ALL edge cases that might have caused the failure
- Add extra error handling and validation

### 🚫 EXPLICITLY FORBIDDEN:
- ❌ Returning the same broken code
- ❌ Any placeholder or stub code
- ❌ "TODO" or "implement later" comments
- ❌ Partial implementations
- ❌ Skipping error handling

### ✅ REQUIRED:
- Complete working implementation
- Comprehensive error handling
- Input validation
- Edge case handling
- Clear documentation

## Output:

Provide:
1. Brief analysis of what went wrong (2-3 sentences)
2. Complete, working solution
3. Explanation of how your solution prevents the original failure

Remember: You are the escalation expert. The previous attempt failed - you MUST provide a working solution.`
}

/**
 * Get the next model in the escalation hierarchy
 */
function getEscalationModel(
  currentModel: string,
  escalationConfig: EscalationConfig
): string | null {
  const hierarchy = escalationConfig.modelHierarchy
  const currentIndex = hierarchy.findIndex(m => 
    m === currentModel || 
    currentModel.includes(m) || 
    m.includes(currentModel)
  )
  
  // If not found or already at highest tier, return the highest model
  if (currentIndex === -1) {
    // Start from the model after standard tier
    const standardIndex = hierarchy.findIndex(m => m.includes("sonnet") || m === "gpt-4o")
    const nextIndex = standardIndex + 1
    if (nextIndex < hierarchy.length) {
      return hierarchy[nextIndex] ?? null
    }
    return hierarchy[hierarchy.length - 1] ?? null
  }
  
  // Return next higher tier model
  if (currentIndex < hierarchy.length - 1) {
    return hierarchy[currentIndex + 1] ?? null
  }
  
  // Already at highest tier
  return null
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
 * Supports failure escalation to more powerful models
 */
export function createExecutionService(
  plan: ExecutionPlan,
  onUpdate: ExecutionUpdateCallback,
  options?: {
    baseUrl?: string
    maxParallel?: number
    retryOnFailure?: boolean
    maxRetries?: number
    escalation?: Partial<EscalationConfig>
    onEscalation?: FailureWebhookHandler
  }
) {
  // Merge escalation config with defaults
  const escalationConfig: EscalationConfig = {
    ...DEFAULT_ESCALATION_CONFIG,
    ...options?.escalation,
    webhookHandlers: [
      ...DEFAULT_ESCALATION_CONFIG.webhookHandlers,
      ...(options?.onEscalation ? [options.onEscalation] : []),
      ...(options?.escalation?.webhookHandlers || []),
    ],
  }

  const config = {
    baseUrl: options?.baseUrl,
    maxParallel: options?.maxParallel || 1, // Default to sequential for safety
    retryOnFailure: options?.retryOnFailure ?? true,
    maxRetries: options?.maxRetries || 2,
    escalation: escalationConfig,
  }

  let running = true
  let paused = false
  let client: ReturnType<typeof getClient> | null = null
  
  const taskStates = new Map<string, TaskStatus>()
  const taskRetries = new Map<string, number>()
  const taskEscalations = new Map<string, number>() // Track escalation count per task
  const taskEscalationHistory = new Map<string, Array<{model: string, error: string, output: string}>>()
  
  // Initialize all tasks as queued
  plan.tasks.forEach(task => {
    taskStates.set(task.id, { status: "queued", progress: 0 })
    taskRetries.set(task.id, 0)
    taskEscalations.set(task.id, 0)
    taskEscalationHistory.set(task.id, [])
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
      
      const failedOutput = taskStates.get(task.id)?.output || ""
      const errorMessage = error.message || "Unknown error"
      
      // Record in escalation history
      const history = taskEscalationHistory.get(task.id) || []
      history.push({ model: task.model, error: errorMessage, output: failedOutput })
      taskEscalationHistory.set(task.id, history)
      
      // Check if should retry with same model first
      const retries = taskRetries.get(task.id) || 0
      if (config.retryOnFailure && retries < config.maxRetries) {
        taskRetries.set(task.id, retries + 1)
        emitLog("warning", `Retrying ${task.name} (attempt ${retries + 2}/${config.maxRetries + 1})`)
        
        // Reset to queued for retry
        taskStates.set(task.id, { status: "queued", progress: 0 })
        await executeTask(task)
        return
      }
      
      // Check if escalation is enabled and possible
      const currentEscalations = taskEscalations.get(task.id) || 0
      const canEscalate = config.escalation.enabled && 
                          currentEscalations < config.escalation.maxEscalations

      if (canEscalate) {
        const escalatedModel = getEscalationModel(task.model, config.escalation)
        
        if (escalatedModel && escalatedModel !== task.model) {
          // Trigger escalation webhooks
          const escalationEvent: EscalationEvent = {
            type: "escalation_started",
            taskId: task.id,
            taskName: task.name,
            originalModel: task.model,
            escalatedModel,
            escalationLevel: currentEscalations + 1,
            maxEscalations: config.escalation.maxEscalations,
            error: errorMessage,
            failedOutput: config.escalation.includeFailedOutputInEscalation ? failedOutput : undefined,
            prompt: buildTaskPrompt(task, plan.description),
            timestamp: Date.now(),
          }
          
          // Call all webhook handlers
          for (const handler of config.escalation.webhookHandlers) {
            try {
              await handler(escalationEvent)
            } catch (webhookError) {
              console.error("[ExecutionService] Webhook handler error:", webhookError)
            }
          }
          
          emitLog("warning", `⬆️ Escalating ${task.name} from ${task.model} to ${escalatedModel}`)
          
          // Update escalation tracking
          taskEscalations.set(task.id, currentEscalations + 1)
          taskRetries.set(task.id, 0) // Reset retries for new model
          
          // Execute with escalated model
          await executeEscalatedTask(task, escalatedModel, errorMessage, failedOutput, currentEscalations + 1)
          return
        }
      }

      // Mark as failed (no more escalations possible)
      taskStates.set(task.id, {
        status: "failed",
        progress: 0,
        error: errorMessage,
        duration,
      })
      
      // Fire failure webhook
      const failureEvent: EscalationEvent = {
        type: "escalation_failed",
        taskId: task.id,
        taskName: task.name,
        originalModel: task.model,
        escalationLevel: currentEscalations,
        maxEscalations: config.escalation.maxEscalations,
        error: errorMessage,
        failedOutput,
        timestamp: Date.now(),
      }
      
      for (const handler of config.escalation.webhookHandlers) {
        try {
          await handler(failureEvent)
        } catch (webhookError) {
          console.error("[ExecutionService] Webhook handler error:", webhookError)
        }
      }

      onUpdate(getStatus(), { 
        type: "task_failed", 
        taskId: task.id,
        error: errorMessage,
      })
      emitLog("error", `Failed: ${task.name} - ${errorMessage} (after ${currentEscalations} escalations)`)
    }
  }

  /**
   * Execute a task with an escalated (more powerful) model
   */
  const executeEscalatedTask = async (
    task: ExecutionTask,
    escalatedModel: string,
    previousError: string,
    previousOutput: string,
    escalationLevel: number
  ): Promise<void> => {
    const startTime = Date.now()
    
    try {
      // Update status to running
      taskStates.set(task.id, { status: "running", progress: 0 })
      emitLog("info", `🔄 Escalation attempt ${escalationLevel}: ${task.name} with ${escalatedModel}`)

      // Create a new session for escalated task
      const sessionResult = await client!.session.create({
        body: {
          title: `Escalated: ${task.name.substring(0, 40)} (L${escalationLevel})`
        }
      })

      if (!sessionResult.data?.id) {
        throw new Error("Failed to create escalation session")
      }

      const sessionId = sessionResult.data.id
      
      // Update progress
      taskStates.set(task.id, { status: "running", progress: 30 })
      onUpdate(getStatus(), null)

      // Get escalated model configuration
      const modelConfig = getModelConfig(escalatedModel)

      // Build escalation prompt with failure context
      const prompt = buildEscalationPrompt(
        task, 
        plan.description, 
        previousOutput, 
        previousError,
        escalationLevel
      )

      // Execute via SDK session.prompt
      emitLog("info", `Executing escalation with ${modelConfig.modelID}...`)
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
      
      // Estimate tokens and cost
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
      
      // Fire success webhook
      const successEvent: EscalationEvent = {
        type: "escalation_completed",
        taskId: task.id,
        taskName: task.name,
        originalModel: task.model,
        escalatedModel,
        escalationLevel,
        maxEscalations: config.escalation.maxEscalations,
        timestamp: Date.now(),
      }
      
      for (const handler of config.escalation.webhookHandlers) {
        try {
          await handler(successEvent)
        } catch (webhookError) {
          console.error("[ExecutionService] Webhook handler error:", webhookError)
        }
      }

      onUpdate(getStatus(), { 
        type: "task_completed", 
        taskId: task.id,
        output: output.substring(0, 500),
        tokensUsed: estimatedTokens,
        cost: estimatedCost,
      })
      emitLog("success", `✅ Escalation succeeded: ${task.name} with ${escalatedModel} (${Math.round(duration / 1000)}s)`)

    } catch (error: any) {
      console.error(`[ExecutionService] Escalated task ${task.id} failed:`, error)
      
      // Record in history
      const history = taskEscalationHistory.get(task.id) || []
      history.push({ model: escalatedModel, error: error.message, output: "" })
      taskEscalationHistory.set(task.id, history)
      
      // Check if we can escalate further
      const currentEscalations = taskEscalations.get(task.id) || 0
      const canEscalateMore = currentEscalations < config.escalation.maxEscalations
      
      if (canEscalateMore) {
        const nextModel = getEscalationModel(escalatedModel, config.escalation)
        
        if (nextModel && nextModel !== escalatedModel) {
          emitLog("warning", `⬆️ Further escalating ${task.name} from ${escalatedModel} to ${nextModel}`)
          taskEscalations.set(task.id, currentEscalations + 1)
          await executeEscalatedTask(task, nextModel, error.message, previousOutput, currentEscalations + 1)
          return
        }
      }
      
      // No more escalations possible - mark as final failure
      const duration = Date.now() - startTime
      taskStates.set(task.id, {
        status: "failed",
        progress: 0,
        error: `Escalation failed: ${error.message}`,
        duration,
      })
      
      // Fire final failure webhook
      const failureEvent: EscalationEvent = {
        type: "escalation_failed",
        taskId: task.id,
        taskName: task.name,
        originalModel: task.model,
        escalatedModel,
        escalationLevel,
        maxEscalations: config.escalation.maxEscalations,
        error: error.message,
        timestamp: Date.now(),
      }
      
      for (const handler of config.escalation.webhookHandlers) {
        try {
          await handler(failureEvent)
        } catch (webhookError) {
          console.error("[ExecutionService] Webhook handler error:", webhookError)
        }
      }

      onUpdate(getStatus(), { 
        type: "task_failed", 
        taskId: task.id,
        error: error.message,
      })
      emitLog("error", `❌ Escalation failed: ${task.name} - ${error.message} (reached max escalation level)`)
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
