/**
 * Codebase Analysis Types
 * 
 * Types for representing analyzed codebase structure and context
 * that gets passed to the AI planning stage.
 */

import type { SelectedFile } from "../components/codebase-selector"

/**
 * Analysis of a single file or directory
 */
export interface FileAnalysis {
  path: string
  type: "file" | "directory"
  name: string
  extension?: string
  language?: string
  lineCount?: number
  size?: number
  
  // For source files
  exports?: string[]
  imports?: string[]
  functions?: string[]
  classes?: string[]
  
  // For config files
  configType?: "package.json" | "tsconfig" | "vite" | "docker" | "other"
  configData?: Record<string, any>
}

/**
 * Dependency information from package managers
 */
export interface DependencyInfo {
  name: string
  version: string
  type: "production" | "development" | "peer"
  description?: string
}

/**
 * Project structure analysis
 */
export interface ProjectStructure {
  rootPath: string
  mainEntryPoints: string[]
  directories: {
    src?: string
    tests?: string
    docs?: string
    config?: string
    public?: string
    dist?: string
  }
  configFiles: string[]
  ignoredPaths: string[]
}

/**
 * Full codebase context for AI planning
 */
export interface CodebaseAnalysis {
  // Basic info
  projectName: string
  rootPath: string
  
  // Tech stack detection
  techStack: TechStackInfo
  
  // Structure
  structure: ProjectStructure
  
  // Selected scope
  selectedFiles: SelectedFile[]
  analyzedFiles: FileAnalysis[]
  
  // Dependencies
  dependencies: DependencyInfo[]
  devDependencies: DependencyInfo[]
  
  // Code metrics
  metrics: CodeMetrics
  
  // Git info if available
  git?: GitInfo
}

/**
 * Technology stack information
 */
export interface TechStackInfo {
  // Primary language/framework
  primaryLanguage: string
  framework?: string
  
  // All detected technologies
  languages: string[]
  frameworks: string[]
  tools: string[]
  
  // Package manager
  packageManager?: "npm" | "yarn" | "pnpm" | "bun" | "pip" | "cargo" | "go" | "other"
  
  // Build tools
  buildTool?: string
  
  // Testing framework
  testingFramework?: string
  
  // UI library (for frontend)
  uiLibrary?: string
  
  // Database (if detected)
  database?: string
}

/**
 * Code metrics
 */
export interface CodeMetrics {
  totalFiles: number
  totalDirectories: number
  totalLines: number
  
  // By file type
  filesByExtension: Record<string, number>
  linesByExtension: Record<string, number>
  
  // Source vs config vs other
  sourceFiles: number
  configFiles: number
  testFiles: number
  docFiles: number
}

/**
 * Git repository info
 */
export interface GitInfo {
  isRepo: boolean
  branch?: string
  hasUncommittedChanges?: boolean
  remoteUrl?: string
  lastCommit?: {
    hash: string
    message: string
    date: string
  }
}

/**
 * Mode for working with codebase
 */
export type CodebaseMode = 
  | "new-project"           // Starting from scratch
  | "add-features"          // Adding new features to existing code
  | "refactor"              // Refactoring/improving existing code
  | "fix-bugs"              // Fixing issues in existing code
  | "migrate"               // Migrating to new technology
  | "document"              // Adding documentation
  | "test"                  // Adding tests

/**
 * Extended plan request with codebase context
 */
export interface CodebasePlanRequest {
  idea: string
  mode: CodebaseMode
  codebase?: CodebaseAnalysis
  preferences: {
    models: string[]
    priority: "speed" | "quality" | "cost"
    maxParallelTasks?: number
    
    // Codebase-specific preferences
    preserveExistingCode?: boolean
    generateTests?: boolean
    updateDocs?: boolean
    commitGranularity?: "feature" | "task" | "none"
  }
}

/**
 * File modification plan for existing files
 */
export interface FileModification {
  path: string
  action: "create" | "modify" | "delete" | "rename"
  reason: string
  
  // For modifications
  changes?: {
    type: "add" | "remove" | "replace"
    location: string  // function name, line range, or "top" | "bottom"
    description: string
  }[]
  
  // For renames
  newPath?: string
  
  // Estimated impact
  impactLevel: "low" | "medium" | "high"
  affectedFiles?: string[]  // Other files that depend on this
}

/**
 * Context-aware task that knows about existing code
 */
export interface CodebaseAwareTask {
  id: string
  title: string
  description: string
  
  // Existing code context
  existingFiles: string[]           // Files this task will read
  fileModifications: FileModification[]  // Changes this task will make
  
  // Dependencies
  dependsOn: string[]               // Other task IDs
  blockedBy: string[]               // Tasks that must complete first
  
  // Execution
  complexity: "trivial" | "simple" | "medium" | "complex" | "expert"
  estimatedMinutes: number
  recommendedModel: string
  
  // Verification
  verificationSteps: string[]
  rollbackPlan?: string
}
