/**
 * Execution Orchestrator Service
 * Manages parallel task execution with dependency resolution
 */

import { createSignal } from "solid-js"
import { createStore, produce } from "solid-js/store"
import type { ExecutionPlan } from "@/types/execution-plan"
import type { Task, TaskResult, TaskProgress, TaskUpdate } from "@/types/task"
import type { 
  ExecutionStatus, 
  ActiveAgent, 
  StatusUpdate 
} from "@/types/agent-status"
import { modelSelector } from "./model-selector"
import { autoReview } from "./auto-review"
import { executionWebSocket } from "./websocket"

interface OrchestratorConfig {
  maxParallel: number
  autoReviewThreshold: number
  retryOnFailure: boolean
  maxRetries: number
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  maxParallel: 3,
  autoReviewThreshold: 0.85,
  retryOnFailure: true,
  maxRetries: 3
}

class ExecutionOrchestrator {
  private sdk: any = null
  private config: OrchestratorConfig = DEFAULT_CONFIG
  private runningAgents = new Map<string, ActiveAgent>()
  private taskQueue: Task[] = []
  private completedTasks: Task[] = []
  private failedTasks: Task[] = []
  private pendingReview: Task[] = []
  private isRunning = false
  private isPaused = false
  
  private statusSignal = createSignal<ExecutionStatus>(this.getInitialStatus())

  setSDK(sdk: any) {
    this.sdk = sdk
  }

  configure(config: Partial<OrchestratorConfig>) {
    this.config = { ...this.config, ...config }
  }

  getStatus() {
    return this.statusSignal[0]
  }

  private setStatus(status: ExecutionStatus) {
    this.statusSignal[1](status)
  }

  async execute(plan: ExecutionPlan): Promise<void> {
    if (!this.sdk) {
      throw new Error("SDK not initialized")
    }

    this.isRunning = true
    this.isPaused = false
    this.taskQueue = [...plan.tasks].sort((a, b) => b.priority - a.priority)
    this.completedTasks = []
    this.failedTasks = []
    this.pendingReview = []
    this.runningAgents.clear()

    this.broadcastUpdate({
      type: "phase_changed",
      payload: { phase: "executing" },
      timestamp: Date.now()
    })

    try {
      await this.runExecutionLoop()
      
      this.broadcastUpdate({
        type: "execution_completed",
        payload: { 
          completedTasks: this.completedTasks.length,
          failedTasks: this.failedTasks.length
        },
        timestamp: Date.now()
      })
    } catch (error: any) {
      console.error("[Orchestrator] Execution failed:", error)
      this.broadcastUpdate({
        type: "execution_failed",
        payload: { error: error.message },
        timestamp: Date.now()
      })
    } finally {
      this.isRunning = false
    }
  }

  pause() {
    this.isPaused = true
    this.broadcastUpdate({
      type: "phase_changed",
      payload: { phase: "paused" },
      timestamp: Date.now()
    })
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false
      this.broadcastUpdate({
        type: "phase_changed",
        payload: { phase: "executing" },
        timestamp: Date.now()
      })
      this.runExecutionLoop()
    }
  }

  cancel() {
    this.isRunning = false
    this.isPaused = false
    // Stop all running agents
    this.runningAgents.forEach((agent) => {
      // Cancel agent execution if possible
    })
    this.runningAgents.clear()
  }

  private async runExecutionLoop(): Promise<void> {
    while (this.isRunning && !this.isPaused) {
      // Get ready tasks (dependencies satisfied)
      const readyTasks = this.getReadyTasks()
      
      // Fill available slots
      while (
        this.runningAgents.size < this.config.maxParallel && 
        readyTasks.length > 0
      ) {
        const task = readyTasks.shift()!
        this.startTask(task)
      }

      // If nothing running and nothing ready, we're done or stuck
      if (this.runningAgents.size === 0 && readyTasks.length === 0) {
        if (this.taskQueue.length === 0) {
          break // All done
        } else {
          // Stuck - dependencies can't be satisfied
          console.warn("[Orchestrator] Stuck - remaining tasks have unsatisfied dependencies")
          break
        }
      }

      // Wait a bit before next iteration
      await this.sleep(500)
      this.updateStatus()
    }
  }

  private getReadyTasks(): Task[] {
    const completedIds = new Set(this.completedTasks.map(t => t.id))
    
    return this.taskQueue.filter(task => {
      // Skip if already running
      if (this.runningAgents.has(task.id)) return false
      
      // Check if all dependencies are completed
      return task.dependsOn.every(depId => completedIds.has(depId))
    })
  }

  private async startTask(task: Task): Promise<void> {
    // Remove from queue
    this.taskQueue = this.taskQueue.filter(t => t.id !== task.id)
    
    // Create agent
    const agent: ActiveAgent = {
      id: `agent-${task.id}`,
      name: `Agent for ${task.title}`,
      model: modelSelector.getModelId(task.modelAssignment.primary),
      provider: this.getProvider(task.modelAssignment.primary),
      state: "initializing",
      currentTask: task,
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        averageTaskDuration: 0,
        successRate: 1
      },
      startedAt: Date.now(),
      lastActivityAt: Date.now()
    }

    this.runningAgents.set(task.id, agent)

    this.broadcastUpdate({
      type: "task_started",
      payload: { taskId: task.id, agent },
      timestamp: Date.now()
    })

    // Execute task in background
    this.executeTask(task, agent)
  }

  private async executeTask(task: Task, agent: ActiveAgent): Promise<void> {
    agent.state = "running"
    
    try {
      // Build the prompt for the task
      const prompt = this.buildTaskPrompt(task)
      
      // Track progress
      let tokensUsed = 0
      const startTime = Date.now()

      // Create a new session for this task
      const sessionResult = await this.sdk.client.session.create({
        title: `Task: ${task.title.substring(0, 50)}`
      })
      
      if (!sessionResult.data?.id) {
        throw new Error("Failed to create task session")
      }

      const sessionId = sessionResult.data.id
      
      // Map model tier to actual model IDs
      const modelConfig = this.getModelConfig(task.modelAssignment.primary)

      // Execute via SDK session.prompt
      const response = await this.sdk.client.session.prompt({
        sessionID: sessionId,
        model: modelConfig,
        parts: [
          {
            type: "text",
            text: prompt
          }
        ]
      })

      // Extract output from response
      const output = this.extractResponseText(response)
      tokensUsed = response?.data?.usage?.totalTokens || 0

      const duration = Date.now() - startTime
      const result: TaskResult = {
        success: true,
        output,
        tokensUsed,
        cost: modelSelector.estimateCost(task.modelAssignment.primary, tokensUsed),
        duration
      }

      await this.handleTaskCompletion(task, result)

    } catch (error: any) {
      console.error(`[Orchestrator] Task ${task.id} failed:`, error)
      
      const result: TaskResult = {
        success: false,
        error: error.message,
        tokensUsed: 0,
        cost: 0,
        duration: Date.now() - (agent.startedAt || Date.now())
      }

      await this.handleTaskFailure(task, result)
    } finally {
      this.runningAgents.delete(task.id)
    }
  }

  private getModelConfig(tier: string): { providerID: string; modelID: string } {
    const modelMap: Record<string, { providerID: string; modelID: string }> = {
      "claude-opus": { providerID: "anthropic", modelID: "claude-opus-4-20250514" },
      "claude-sonnet": { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" },
      "gpt-4o": { providerID: "openai", modelID: "gpt-4o" },
      "gpt-4o-mini": { providerID: "openai", modelID: "gpt-4o-mini" }
    }
    return modelMap[tier] || { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" }
  }

  private extractResponseText(response: any): string {
    if (typeof response === "string") return response
    if (response?.data?.content) return response.data.content
    if (response?.data?.text) return response.data.text
    if (response?.content) return response.content
    if (response?.text) return response.text
    if (Array.isArray(response?.data)) {
      return response.data
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text || p.content)
        .join("")
    }
    return JSON.stringify(response)
  }

  private async handleTaskCompletion(task: Task, result: TaskResult): Promise<void> {
    task.result = result
    task.completedAt = Date.now()

    // Run auto-review
    const review = await autoReview.reviewTask(task, result)
    task.review = review

    if (review.passed) {
      task.status = "completed"
      this.completedTasks.push(task)
      
      this.broadcastUpdate({
        type: "task_completed",
        payload: { taskId: task.id, result, review },
        timestamp: Date.now()
      })
    } else {
      // Check if should retry
      if (task.retryCount < task.maxRetries) {
        task.retryCount++
        task.status = "queued"
        this.taskQueue.push(task)
      } else {
        task.status = "review-pending"
        this.pendingReview.push(task)
        
        this.broadcastUpdate({
          type: "task_completed",
          payload: { 
            taskId: task.id, 
            result, 
            review,
            needsHumanReview: true 
          },
          timestamp: Date.now()
        })
      }
    }
  }

  private async handleTaskFailure(task: Task, result: TaskResult): Promise<void> {
    task.result = result

    if (this.config.retryOnFailure && task.retryCount < this.config.maxRetries) {
      task.retryCount++
      task.status = "queued"
      this.taskQueue.push(task)
    } else {
      task.status = "failed"
      task.completedAt = Date.now()
      this.failedTasks.push(task)
      
      this.broadcastUpdate({
        type: "task_failed",
        payload: { taskId: task.id, result },
        timestamp: Date.now()
      })
    }
  }

  private buildTaskPrompt(task: Task): string {
    return `You are an expert software developer. Complete the following task:

TASK: ${task.title}

DESCRIPTION:
${task.description}

INSTRUCTIONS:
${task.instructions}

REQUIREMENTS:
1. Follow best practices for the technology stack
2. Write clean, maintainable code
3. Include error handling
4. Add comments for complex logic
5. Consider edge cases

Provide your complete implementation.`
  }

  private getProvider(tier: string): string {
    if (tier.includes("claude")) return "anthropic"
    if (tier.includes("gpt")) return "openai"
    return "anthropic"
  }

  private broadcastUpdate(update: StatusUpdate): void {
    executionWebSocket.send("execution_update", update)
    this.updateStatus()
  }

  private updateStatus(): void {
    const activeAgents = Array.from(this.runningAgents.values())
    const totalTasks = this.taskQueue.length + 
                       this.completedTasks.length + 
                       this.failedTasks.length + 
                       this.runningAgents.size +
                       this.pendingReview.length

    this.setStatus({
      totalTasks,
      completedTasks: this.completedTasks.length,
      failedTasks: this.failedTasks.length,
      queuedTasks: this.taskQueue.length,
      runningTasks: this.runningAgents.size,
      progressPercentage: totalTasks > 0 
        ? (this.completedTasks.length / totalTasks) * 100 
        : 0,
      activeAgents,
      completed: this.completedTasks,
      running: activeAgents.map(a => a.currentTask!).filter(Boolean),
      queued: this.taskQueue,
      failed: this.failedTasks,
      pendingReview: this.pendingReview,
      estimatedTimeRemaining: this.estimateTimeRemaining(),
      estimatedCostRemaining: this.estimateCostRemaining(),
      totalTokensUsed: this.completedTasks.reduce(
        (sum, t) => sum + (t.result?.tokensUsed || 0), 
        0
      ),
      totalCost: this.completedTasks.reduce(
        (sum, t) => sum + (t.result?.cost || 0), 
        0
      ),
      totalDuration: this.completedTasks.reduce(
        (sum, t) => sum + (t.result?.duration || 0), 
        0
      ),
      phase: this.isRunning 
        ? (this.isPaused ? "paused" : "executing") 
        : "completed",
      errors: []
    })
  }

  private getInitialStatus(): ExecutionStatus {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      queuedTasks: 0,
      runningTasks: 0,
      progressPercentage: 0,
      activeAgents: [],
      completed: [],
      running: [],
      queued: [],
      failed: [],
      pendingReview: [],
      estimatedTimeRemaining: 0,
      estimatedCostRemaining: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      totalDuration: 0,
      phase: "planning",
      errors: []
    }
  }

  private estimateTimeRemaining(): number {
    return this.taskQueue.reduce((sum, t) => sum + t.estimatedMinutes, 0) * 60 * 1000
  }

  private estimateCostRemaining(): number {
    return this.taskQueue.reduce((sum, t) => sum + t.estimatedCost, 0)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const orchestrator = new ExecutionOrchestrator()
