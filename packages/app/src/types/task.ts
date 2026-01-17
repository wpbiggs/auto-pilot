/**
 * Task Types
 * Defines the structure for individual execution tasks
 */

export type TaskStatus = 
  | "queued" 
  | "assigned" 
  | "running" 
  | "completed" 
  | "failed" 
  | "cancelled" 
  | "review-pending"
  | "review-approved"
  | "review-rejected"

export type TaskComplexity = "trivial" | "simple" | "medium" | "complex" | "expert"

export type ModelTier = 
  | "claude-opus"      // Complex, security-critical, architectural
  | "gpt-4o"           // Standard implementation
  | "claude-sonnet"    // Medium complexity
  | "gpt-4o-mini"      // Simple tasks, documentation

export interface TaskDependency {
  taskId: string
  dependsOn: string[]
}

export interface ModelAssignment {
  primary: ModelTier
  fallback?: ModelTier
  reason: string
}

export interface Task {
  id: string
  title: string
  description: string
  instructions: string
  
  // Classification
  complexity: TaskComplexity
  phase: "foundation" | "mvp" | "scale" | "polish"
  featureId: string
  
  // Model assignment
  modelAssignment: ModelAssignment
  
  // Estimates
  estimatedMinutes: number
  estimatedTokens: number
  estimatedCost: number
  
  // Dependencies
  dependsOn: string[]
  blockedBy: string[]
  
  // Status
  status: TaskStatus
  priority: number
  
  // Execution tracking
  assignedAgentId?: string
  sessionId?: string
  startedAt?: number
  completedAt?: number
  
  // Results
  result?: TaskResult
  review?: TaskReview
  
  // Retry handling
  retryCount: number
  maxRetries: number
}

export interface TaskResult {
  success: boolean
  output?: string
  error?: string
  filesCreated?: string[]
  filesModified?: string[]
  tokensUsed: number
  cost: number
  duration: number
}

export interface TaskReview {
  score: number // 0-1
  passed: boolean
  issues: ReviewIssue[]
  suggestions: string[]
  reviewedAt: number
  autoReviewed: boolean
}

export interface ReviewIssue {
  severity: "error" | "warning" | "info"
  message: string
  location?: string
}

export interface TaskProgress {
  taskId: string
  percentage: number
  currentStep?: string
  tokensUsed: number
  cost: number
  logs: string[]
}

export interface TaskUpdate {
  type: "progress" | "status" | "result" | "review"
  taskId: string
  data: Partial<Task> | TaskProgress
  timestamp: number
}
