/**
 * Execution Plan Types
 * Defines the structure for AI-generated project execution plans
 */

import type { Task, TaskDependency } from "./task"

export type ProjectPhase = "foundation" | "mvp" | "scale" | "polish"
export type PlanStatus = "draft" | "approved" | "in-progress" | "completed" | "failed"
export type CodebaseMode = "new-project" | "add-features" | "refactor" | "fix-bugs" | "migrate" | "document" | "test"

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

/**
 * Information about a file that will be modified
 */
export interface FileModification {
  path: string
  action: "create" | "modify" | "delete" | "rename"
  reason: string
  newPath?: string  // For renames
  impactLevel: "low" | "medium" | "high"
}

/**
 * Codebase context passed from Stage 1
 */
export interface CodebaseContextInfo {
  rootPath: string
  selectedFiles: Array<{
    path: string
    type: "file" | "directory"
    name: string
  }>
  detectedTechStack?: string[]
  fileStats?: {
    totalFiles: number
    totalDirectories: number
    languages: Record<string, number>
  }
}

export interface ExecutionPlan {
  id: string
  projectName: string
  originalIdea: string
  
  // Mode and codebase context
  mode: CodebaseMode
  codebaseContext?: CodebaseContextInfo
  
  // AI-generated breakdown
  features: Feature[]
  tasks: Task[]
  phases: PhaseInfo[]
  dependencies: TaskDependency[]
  
  // File modifications (for existing codebase work)
  fileModifications?: FileModification[]
  
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
  
  // Codebase-specific preferences
  preserveExistingCode?: boolean
  generateTests?: boolean
  updateDocs?: boolean
}

export interface PlanRequest {
  idea: string
  mode: CodebaseMode
  preferences: PlanPreferences
  codebaseContext?: CodebaseContextInfo
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
