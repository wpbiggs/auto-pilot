/**
 * AI Planner Service
 * ONE AI call to analyze an idea and create a complete execution plan
 */

import type { 
  ExecutionPlan, 
  PlanRequest, 
  PlanResponse, 
  Feature, 
  PhaseInfo 
} from "@/types/execution-plan"
import type { Task, ModelAssignment, TaskComplexity } from "@/types/task"
import { modelSelector } from "./model-selector"

const PLANNING_PROMPT = `You are an expert AI project planner. Analyze the user's idea and create a complete, actionable execution plan.

USER'S IDEA:
"{idea}"

CONTEXT (if provided):
{context}

Create a comprehensive execution plan in JSON format with the following structure:

{
  "projectName": "Short, descriptive project name",
  "features": [
    {
      "id": "feature-1",
      "name": "Feature name",
      "description": "What this feature does",
      "phase": "foundation|mvp|scale|polish",
      "priority": 1-10
    }
  ],
  "tasks": [
    {
      "id": "task-1",
      "title": "Short task title",
      "description": "What needs to be done",
      "instructions": "Detailed step-by-step instructions for the AI agent",
      "complexity": "trivial|simple|medium|complex|expert",
      "phase": "foundation|mvp|scale|polish",
      "featureId": "feature-1",
      "dependsOn": ["task-id-1", "task-id-2"],
      "estimatedMinutes": 15,
      "estimatedTokens": 5000
    }
  ],
  "phases": [
    {
      "phase": "foundation",
      "name": "Foundation",
      "description": "Core setup and infrastructure",
      "order": 1
    },
    {
      "phase": "mvp",
      "name": "MVP",
      "description": "Minimum viable product features",
      "order": 2
    },
    {
      "phase": "scale",
      "name": "Scale",
      "description": "Enhanced features and optimizations",
      "order": 3
    },
    {
      "phase": "polish",
      "name": "Polish",
      "description": "Final touches and documentation",
      "order": 4
    }
  ],
  "totalEstimateMinutes": 180,
  "warnings": ["Any concerns or assumptions"]
}

GUIDELINES:
1. Create 12-20 granular, actionable tasks
2. Tasks should be small enough for one AI agent to complete (15-60 min each)
3. Respect dependencies - foundation before mvp, mvp before scale
4. Include setup, implementation, testing, and documentation tasks
5. Be specific in instructions - the AI agent needs clear guidance
6. Consider security, error handling, and edge cases
7. Estimate conservatively

Return ONLY valid JSON, no markdown or explanation.`

class AIPlanner {
  private sdk: any = null

  setSDK(sdk: any) {
    this.sdk = sdk
  }

  async analyzeAndPlan(request: PlanRequest): Promise<PlanResponse> {
    if (!this.sdk) {
      return {
        success: false,
        error: "SDK not initialized"
      }
    }

    try {
      const contextStr = request.context 
        ? `
Tech Stack: ${request.context.techStack?.join(", ") || "Not specified"}
Existing Files: ${request.context.existingFiles?.join(", ") || "None"}
Constraints: ${request.context.constraints?.join(", ") || "None"}
        `.trim()
        : "No additional context provided"

      const prompt = PLANNING_PROMPT
        .replace("{idea}", request.idea)
        .replace("{context}", contextStr)

      // Create a new session for planning
      const sessionResult = await this.sdk.client.session.create({
        title: `Planning: ${request.idea.substring(0, 50)}...`
      })
      
      if (!sessionResult.data?.id) {
        return {
          success: false,
          error: "Failed to create planning session"
        }
      }

      const sessionId = sessionResult.data.id

      // Use the highest quality model for planning (Claude Opus)
      const response = await this.sdk.client.session.prompt({
        sessionID: sessionId,
        model: {
          providerID: "anthropic",
          modelID: "claude-sonnet-4-20250514"
        },
        parts: [
          {
            type: "text",
            text: prompt
          }
        ]
      })

      // Extract text content from response
      const responseText = this.extractResponseText(response)
      const parsed = this.parseResponse(responseText)
      
      if (!parsed) {
        return {
          success: false,
          error: "Failed to parse AI response"
        }
      }

      const plan = this.buildExecutionPlan(parsed, request)
      
      return {
        success: true,
        plan,
        warnings: parsed.warnings
      }
    } catch (error: any) {
      console.error("[AIPlanner] Error:", error)
      return {
        success: false,
        error: error.message || "Failed to generate plan"
      }
    }
  }
  
  private extractResponseText(response: any): string {
    // Handle different response formats from the SDK
    if (typeof response === "string") return response
    if (response?.data?.content) return response.data.content
    if (response?.data?.text) return response.data.text
    if (response?.content) return response.content
    if (response?.text) return response.text
    // If it's a stream response, collect the text parts
    if (Array.isArray(response?.data)) {
      return response.data
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text || p.content)
        .join("")
    }
    return JSON.stringify(response)
  }

  private parseResponse(response: any): any {
    try {
      // Extract JSON from response
      const content = response.content || response.text || response
      let jsonStr = typeof content === "string" ? content : JSON.stringify(content)
      
      // Clean up markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error("[AIPlanner] Parse error:", error)
      return null
    }
  }

  private buildExecutionPlan(parsed: any, request: PlanRequest): ExecutionPlan {
    const now = Date.now()
    const planId = `plan-${now}`

    // Build tasks with model assignments
    const tasks: Task[] = parsed.tasks.map((t: any, index: number) => {
      const complexity = t.complexity as TaskComplexity
      const modelAssignment = modelSelector.assignModel(complexity, request.preferences)
      
      return {
        id: t.id || `task-${index + 1}`,
        title: t.title,
        description: t.description,
        instructions: t.instructions,
        complexity,
        phase: t.phase,
        featureId: t.featureId,
        modelAssignment,
        estimatedMinutes: t.estimatedMinutes || 30,
        estimatedTokens: t.estimatedTokens || 5000,
        estimatedCost: this.estimateCost(modelAssignment.primary, t.estimatedTokens || 5000),
        dependsOn: t.dependsOn || [],
        blockedBy: [],
        status: "queued",
        priority: this.calculatePriority(t.phase, index),
        retryCount: 0,
        maxRetries: 3
      } satisfies Task
    })

    // Calculate blocked by (inverse of depends on)
    tasks.forEach(task => {
      task.blockedBy = tasks
        .filter(t => t.dependsOn.includes(task.id))
        .map(t => t.id)
    })

    // Build features with task IDs
    const features: Feature[] = parsed.features.map((f: any) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      phase: f.phase,
      taskIds: tasks.filter(t => t.featureId === f.id).map(t => t.id),
      priority: f.priority,
      estimatedMinutes: tasks
        .filter(t => t.featureId === f.id)
        .reduce((sum, t) => sum + t.estimatedMinutes, 0)
    }))

    // Build phases with task IDs
    const phases: PhaseInfo[] = parsed.phases.map((p: any) => ({
      phase: p.phase,
      name: p.name,
      description: p.description,
      taskIds: tasks.filter(t => t.phase === p.phase).map(t => t.id),
      estimatedMinutes: tasks
        .filter(t => t.phase === p.phase)
        .reduce((sum, t) => sum + t.estimatedMinutes, 0),
      order: p.order
    }))

    // Calculate totals
    const totalEstimateMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)
    const estimatedCost = tasks.reduce((sum, t) => sum + t.estimatedCost, 0)

    return {
      id: planId,
      projectName: parsed.projectName,
      originalIdea: request.idea,
      mode: request.mode,
      codebaseContext: request.codebaseContext,
      features,
      tasks,
      phases,
      dependencies: tasks.map(t => ({ taskId: t.id, dependsOn: t.dependsOn })),
      totalEstimateMinutes,
      estimatedCost,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      completedTaskIds: [],
      failedTaskIds: [],
      currentPhase: "foundation"
    }
  }

  private calculatePriority(phase: string, index: number): number {
    const phaseWeight: Record<string, number> = {
      foundation: 1000,
      mvp: 750,
      scale: 500,
      polish: 250
    }
    return (phaseWeight[phase] || 500) - index
  }

  private estimateCost(model: string, tokens: number): number {
    const costPer1k: Record<string, number> = {
      "claude-opus": 0.015,
      "gpt-4o": 0.01,
      "claude-sonnet": 0.003,
      "gpt-4o-mini": 0.00015
    }
    return (tokens / 1000) * (costPer1k[model] || 0.005)
  }
}

export const aiPlanner = new AIPlanner()
