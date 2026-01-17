/**
 * Agent Status Types
 * Defines runtime state for agents during execution
 */

import type { Task, TaskProgress } from "./task"

export type AgentState = 
  | "idle" 
  | "initializing" 
  | "running" 
  | "paused" 
  | "completed" 
  | "failed" 
  | "rate-limited"

export interface AgentMetrics {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  totalTokensUsed: number
  totalCost: number
  averageTaskDuration: number
  successRate: number
}

export interface ActiveAgent {
  id: string
  name: string
  model: string
  provider: string
  
  // Current state
  state: AgentState
  currentTask?: Task
  currentProgress?: TaskProgress
  
  // Rate limiting
  rateLimitRemaining?: number
  rateLimitResetAt?: number
  
  // Metrics
  metrics: AgentMetrics
  
  // Timestamps
  startedAt: number
  lastActivityAt: number
}

export interface AgentPool {
  agents: ActiveAgent[]
  maxConcurrent: number
  activeCount: number
  idleCount: number
}

export interface ExecutionStatus {
  // Overall progress
  totalTasks: number
  completedTasks: number
  failedTasks: number
  queuedTasks: number
  runningTasks: number
  progressPercentage: number
  
  // Active agents
  activeAgents: ActiveAgent[]
  
  // Task lists
  completed: Task[]
  running: Task[]
  queued: Task[]
  failed: Task[]
  pendingReview: Task[]
  
  // Estimates
  estimatedTimeRemaining: number
  estimatedCostRemaining: number
  
  // Totals
  totalTokensUsed: number
  totalCost: number
  totalDuration: number
  
  // Status
  phase: "planning" | "executing" | "reviewing" | "completed" | "paused" | "failed"
  startedAt?: number
  completedAt?: number
  
  // Errors
  errors: ExecutionError[]
}

export interface ExecutionError {
  taskId?: string
  agentId?: string
  message: string
  code: string
  timestamp: number
  recoverable: boolean
}

export interface ExecutionControls {
  canPause: boolean
  canResume: boolean
  canCancel: boolean
  canRetry: boolean
}

export interface StatusUpdate {
  type: 
    | "agent_started" 
    | "agent_stopped" 
    | "task_started" 
    | "task_progress" 
    | "task_completed" 
    | "task_failed"
    | "phase_changed"
    | "execution_completed"
    | "execution_failed"
  payload: any
  timestamp: number
}
