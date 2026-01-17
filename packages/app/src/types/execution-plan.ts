/**
 * Execution Plan Types
 * Defines the structure for AI-generated project execution plans
 */

import type { Task, TaskDependency } from "./task"

export type ProjectPhase = "foundation" | "mvp" | "scale" | "polish"
export type PlanStatus = "draft" | "approved" | "in-progress" | "completed" | "failed"

export interface Feature {
  id: string
  name: string
  description: string
  phase: ProjectPhase
  taskIds: string[]
  priority: number
  estimatedMinutes: number
}

export interface PhaseInfo {
  phase: ProjectPhase
  name: string
  description: string
  taskIds: string[]
  estimatedMinutes: number
  order: number
}

export interface ExecutionPlan {
  id: string
  projectName: string
  originalIdea: string
  
  // AI-generated breakdown
  features: Feature[]
  tasks: Task[]
  phases: PhaseInfo[]
  dependencies: TaskDependency[]
  
  // Estimates
  totalEstimateMinutes: number
  estimatedCost: number
  
  // Metadata
  status: PlanStatus
  createdAt: number
  updatedAt: number
  approvedAt?: number
  completedAt?: number
  
  // Execution tracking
  completedTaskIds: string[]
  failedTaskIds: string[]
  currentPhase?: ProjectPhase
}

export interface PlanPreferences {
  models: string[]
  priority: "speed" | "quality" | "cost"
  maxParallelTasks?: number
  autoApproveThreshold?: number
}

export interface PlanRequest {
  idea: string
  preferences: PlanPreferences
  context?: {
    existingFiles?: string[]
    techStack?: string[]
    constraints?: string[]
  }
}

export interface PlanResponse {
  success: boolean
  plan?: ExecutionPlan
  error?: string
  warnings?: string[]
}
