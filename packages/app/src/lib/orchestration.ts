import { createSignal, createMemo, For, Show, onMount, onCleanup } from "solid-js"
import { createStore, produce } from "solid-js/store"
import type { Agent, Session } from "@opencode-ai/sdk/v2/client"

// Task Queue Item
export interface QueuedTask {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  complexity: number // 1-10
  requiredCapabilities: string[]
  recommendedAgent?: string
  recommendedModel?: string
  estimatedTokens?: number
  estimatedCost?: number
  status: "queued" | "assigned" | "running" | "completed" | "failed" | "cancelled"
  assignedAgent?: string
  sessionId?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  retryCount: number
  maxRetries: number
  result?: {
    success: boolean
    output?: string
    error?: string
    tokensUsed?: number
    cost?: number
  }
}

// Agent Pool Entry
export interface AgentPoolEntry {
  agent: Agent
  isAvailable: boolean
  currentTaskId?: string
  lastTaskAt?: number
  totalTasks: number
  successfulTasks: number
  failedTasks: number
  totalTokensUsed: number
  totalCost: number
  rateLimitRemaining?: number
  rateLimitResetAt?: number
}

// Orchestration Config
export interface OrchestrationConfig {
  maxConcurrentTasks: number
  maxRetries: number
  retryDelayMs: number
  taskTimeoutMs: number
  enableLoadBalancing: boolean
  enableAutoRetry: boolean
  priorityWeights: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

// Model Capabilities Matrix
export interface ModelCapabilities {
  modelId: string
  provider: string
  capabilities: string[]
  maxTokens: number
  costPer1kInput: number
  costPer1kOutput: number
  speedRating: number // 1-10
  qualityRating: number // 1-10
  bestFor: string[]
}

// Default capabilities matrix
export const MODEL_CAPABILITIES: ModelCapabilities[] = [
  {
    modelId: "claude-sonnet-4-20250514",
    provider: "anthropic",
    capabilities: ["coding", "analysis", "documentation", "testing", "debugging"],
    maxTokens: 200000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    speedRating: 9,
    qualityRating: 9,
    bestFor: ["complex-coding", "architecture", "code-review"],
  },
  {
    modelId: "claude-3-5-haiku-20241022",
    provider: "anthropic",
    capabilities: ["coding", "simple-tasks", "formatting"],
    maxTokens: 200000,
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.00125,
    speedRating: 10,
    qualityRating: 7,
    bestFor: ["simple-tasks", "formatting", "quick-fixes"],
  },
  {
    modelId: "gpt-4o",
    provider: "openai",
    capabilities: ["coding", "analysis", "documentation", "research"],
    maxTokens: 128000,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    speedRating: 8,
    qualityRating: 9,
    bestFor: ["research", "analysis", "documentation"],
  },
  {
    modelId: "gpt-4o-mini",
    provider: "openai",
    capabilities: ["coding", "simple-tasks", "formatting"],
    maxTokens: 128000,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    speedRating: 10,
    qualityRating: 7,
    bestFor: ["simple-tasks", "formatting", "quick-edits"],
  },
]

// Complexity Scoring Algorithm
export function calculateComplexity(task: {
  title: string
  description: string
  tags?: string[]
}): { score: number; factors: string[] } {
  let score = 5 // Base score
  const factors: string[] = []
  
  const text = `${task.title} ${task.description}`.toLowerCase()
  
  // Keywords that increase complexity
  if (text.includes("architecture") || text.includes("design")) {
    score += 2
    factors.push("Architecture/Design work")
  }
  if (text.includes("security") || text.includes("vulnerability")) {
    score += 2
    factors.push("Security considerations")
  }
  if (text.includes("performance") || text.includes("optimization")) {
    score += 1
    factors.push("Performance optimization")
  }
  if (text.includes("database") || text.includes("migration")) {
    score += 1
    factors.push("Database operations")
  }
  if (text.includes("test") || text.includes("testing")) {
    score += 1
    factors.push("Testing requirements")
  }
  if (text.includes("refactor")) {
    score += 1
    factors.push("Refactoring")
  }
  if (text.includes("integration") || text.includes("api")) {
    score += 1
    factors.push("Integration work")
  }
  
  // Keywords that decrease complexity
  if (text.includes("fix typo") || text.includes("typo")) {
    score -= 3
    factors.push("Simple typo fix")
  }
  if (text.includes("update readme") || text.includes("documentation")) {
    score -= 2
    factors.push("Documentation update")
  }
  if (text.includes("rename") || text.includes("move file")) {
    score -= 2
    factors.push("Simple file operation")
  }
  
  // Clamp score between 1 and 10
  score = Math.max(1, Math.min(10, score))
  
  return { score, factors }
}

// Capability Detection
export function detectRequiredCapabilities(task: {
  title: string
  description: string
  tags?: string[]
}): string[] {
  const capabilities: Set<string> = new Set()
  const text = `${task.title} ${task.description}`.toLowerCase()
  
  if (text.includes("code") || text.includes("implement") || text.includes("function") || text.includes("class")) {
    capabilities.add("coding")
  }
  if (text.includes("test") || text.includes("spec") || text.includes("coverage")) {
    capabilities.add("testing")
  }
  if (text.includes("debug") || text.includes("fix") || text.includes("error")) {
    capabilities.add("debugging")
  }
  if (text.includes("document") || text.includes("readme") || text.includes("comment")) {
    capabilities.add("documentation")
  }
  if (text.includes("analyze") || text.includes("review") || text.includes("audit")) {
    capabilities.add("analysis")
  }
  if (text.includes("research") || text.includes("investigate") || text.includes("explore")) {
    capabilities.add("research")
  }
  if (text.includes("security") || text.includes("vulnerability")) {
    capabilities.add("security")
  }
  if (text.includes("performance") || text.includes("optimize")) {
    capabilities.add("optimization")
  }
  
  // Default to coding if no capabilities detected
  if (capabilities.size === 0) {
    capabilities.add("coding")
  }
  
  return Array.from(capabilities)
}

// Model Recommendation Engine
export function recommendModel(task: {
  complexity: number
  capabilities: string[]
  prioritizeCost?: boolean
  prioritizeQuality?: boolean
}): {
  modelId: string
  confidence: number
  reasoning: string[]
} {
  const reasoning: string[] = []
  let bestModel = MODEL_CAPABILITIES[0]
  let bestScore = 0
  
  for (const model of MODEL_CAPABILITIES) {
    let score = 0
    
    // Check capability match
    const matchedCapabilities = task.capabilities.filter(c => 
      model.capabilities.includes(c) || model.bestFor.some(b => b.includes(c))
    )
    score += matchedCapabilities.length * 20
    
    // Complexity match
    if (task.complexity >= 7) {
      score += model.qualityRating * 5
      if (model.qualityRating >= 9) {
        reasoning.push("High quality model for complex task")
      }
    } else if (task.complexity <= 3) {
      score += model.speedRating * 3
      score += (10 - model.costPer1kOutput * 1000) * 2
      if (model.speedRating >= 9) {
        reasoning.push("Fast model for simple task")
      }
    } else {
      score += model.qualityRating * 3
      score += model.speedRating * 2
    }
    
    // Cost vs Quality preference
    if (task.prioritizeCost) {
      score += (10 - model.costPer1kOutput * 1000) * 5
    }
    if (task.prioritizeQuality) {
      score += model.qualityRating * 5
    }
    
    if (score > bestScore) {
      bestScore = score
      bestModel = model
    }
  }
  
  const confidence = Math.min(95, Math.round((bestScore / 100) * 100))
  
  return {
    modelId: bestModel.modelId,
    confidence,
    reasoning: [
      `Best match for ${task.capabilities.join(", ")}`,
      `Complexity ${task.complexity}/10 suits ${bestModel.qualityRating >= 9 ? "high-quality" : "efficient"} model`,
      ...reasoning,
    ],
  }
}

// Create Orchestration Store
export function createOrchestrationStore(config: Partial<OrchestrationConfig> = {}) {
  const defaultConfig: OrchestrationConfig = {
    maxConcurrentTasks: 3,
    maxRetries: 3,
    retryDelayMs: 5000,
    taskTimeoutMs: 300000, // 5 minutes
    enableLoadBalancing: true,
    enableAutoRetry: true,
    priorityWeights: {
      critical: 100,
      high: 50,
      medium: 20,
      low: 10,
    },
    ...config,
  }

  const [store, setStore] = createStore({
    config: defaultConfig,
    taskQueue: [] as QueuedTask[],
    agentPool: [] as AgentPoolEntry[],
    isRunning: false,
    stats: {
      totalQueued: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalTokensUsed: 0,
      totalCost: 0,
    },
  })

  // Add task to queue
  function enqueueTask(task: Omit<QueuedTask, "id" | "status" | "createdAt" | "retryCount" | "maxRetries">) {
    const newTask: QueuedTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "queued",
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: store.config.maxRetries,
    }
    
    setStore(produce(s => {
      s.taskQueue.push(newTask)
      s.stats.totalQueued++
    }))
    
    return newTask.id
  }

  // Remove task from queue
  function dequeueTask(taskId: string) {
    setStore(produce(s => {
      s.taskQueue = s.taskQueue.filter(t => t.id !== taskId)
    }))
  }

  // Update task status
  function updateTaskStatus(taskId: string, updates: Partial<QueuedTask>) {
    setStore(produce(s => {
      const task = s.taskQueue.find(t => t.id === taskId)
      if (task) {
        Object.assign(task, updates)
      }
    }))
  }

  // Initialize agent pool
  function initializeAgentPool(agents: Agent[]) {
    setStore(produce(s => {
      s.agentPool = agents.map(agent => ({
        agent,
        isAvailable: true,
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        totalTokensUsed: 0,
        totalCost: 0,
      }))
    }))
  }

  // Get next task from queue (priority-based)
  function getNextTask(): QueuedTask | undefined {
    const queuedTasks = store.taskQueue.filter(t => t.status === "queued")
    if (queuedTasks.length === 0) return undefined
    
    // Sort by priority weight
    const sorted = [...queuedTasks].sort((a, b) => {
      const weightA = store.config.priorityWeights[a.priority]
      const weightB = store.config.priorityWeights[b.priority]
      return weightB - weightA
    })
    
    return sorted[0]
  }

  // Get available agent for task
  function getAvailableAgent(task: QueuedTask): AgentPoolEntry | undefined {
    const available = store.agentPool.filter(a => a.isAvailable)
    if (available.length === 0) return undefined
    
    if (task.recommendedAgent) {
      const recommended = available.find(a => a.agent.name === task.recommendedAgent)
      if (recommended) return recommended
    }
    
    // Load balancing: pick agent with fewest total tasks
    if (store.config.enableLoadBalancing) {
      return available.reduce((min, curr) => 
        curr.totalTasks < min.totalTasks ? curr : min
      )
    }
    
    return available[0]
  }

  // Mark agent as busy
  function markAgentBusy(agentName: string, taskId: string) {
    setStore(produce(s => {
      const agent = s.agentPool.find(a => a.agent.name === agentName)
      if (agent) {
        agent.isAvailable = false
        agent.currentTaskId = taskId
      }
    }))
  }

  // Mark agent as available
  function markAgentAvailable(agentName: string) {
    setStore(produce(s => {
      const agent = s.agentPool.find(a => a.agent.name === agentName)
      if (agent) {
        agent.isAvailable = true
        agent.currentTaskId = undefined
        agent.lastTaskAt = Date.now()
      }
    }))
  }

  // Record task completion
  function recordTaskCompletion(taskId: string, success: boolean, result: QueuedTask["result"]) {
    setStore(produce(s => {
      const task = s.taskQueue.find(t => t.id === taskId)
      if (task) {
        task.status = success ? "completed" : "failed"
        task.completedAt = Date.now()
        task.result = result
        
        if (success) {
          s.stats.totalCompleted++
        } else {
          s.stats.totalFailed++
        }
        
        if (result?.tokensUsed) {
          s.stats.totalTokensUsed += result.tokensUsed
        }
        if (result?.cost) {
          s.stats.totalCost += result.cost
        }
        
        // Update agent stats
        if (task.assignedAgent) {
          const agent = s.agentPool.find(a => a.agent.name === task.assignedAgent)
          if (agent) {
            agent.totalTasks++
            if (success) {
              agent.successfulTasks++
            } else {
              agent.failedTasks++
            }
            if (result?.tokensUsed) {
              agent.totalTokensUsed += result.tokensUsed
            }
            if (result?.cost) {
              agent.totalCost += result.cost
            }
          }
        }
      }
    }))
  }

  // Start orchestration
  function start() {
    setStore("isRunning", true)
  }

  // Stop orchestration
  function stop() {
    setStore("isRunning", false)
  }

  // Get queue stats
  function getQueueStats() {
    return {
      queued: store.taskQueue.filter(t => t.status === "queued").length,
      running: store.taskQueue.filter(t => t.status === "running").length,
      completed: store.taskQueue.filter(t => t.status === "completed").length,
      failed: store.taskQueue.filter(t => t.status === "failed").length,
      ...store.stats,
    }
  }

  return {
    store,
    enqueueTask,
    dequeueTask,
    updateTaskStatus,
    initializeAgentPool,
    getNextTask,
    getAvailableAgent,
    markAgentBusy,
    markAgentAvailable,
    recordTaskCompletion,
    start,
    stop,
    getQueueStats,
  }
}

export type OrchestrationStore = ReturnType<typeof createOrchestrationStore>
