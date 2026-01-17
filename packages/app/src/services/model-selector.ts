/**
 * Model Selector Service
 * Smart per-task model selection based on complexity and preferences
 */

import type { TaskComplexity, ModelTier, ModelAssignment } from "@/types/task"
import type { PlanPreferences } from "@/types/execution-plan"

interface ModelConfig {
  tier: ModelTier
  modelId: string
  provider: string
  costPer1kTokens: number
  speedRating: number // 1-10
  qualityRating: number // 1-10
  maxTokens: number
  bestFor: TaskComplexity[]
}

const MODEL_CONFIGS: ModelConfig[] = [
  {
    tier: "claude-opus",
    modelId: "claude-sonnet-4-20250514", // Using Sonnet 4 as "Opus tier" for complex tasks
    provider: "anthropic",
    costPer1kTokens: 0.015,
    speedRating: 7,
    qualityRating: 10,
    maxTokens: 200000,
    bestFor: ["expert", "complex"]
  },
  {
    tier: "gpt-4o",
    modelId: "gpt-4o",
    provider: "openai",
    costPer1kTokens: 0.01,
    speedRating: 8,
    qualityRating: 9,
    maxTokens: 128000,
    bestFor: ["complex", "medium"]
  },
  {
    tier: "claude-sonnet",
    modelId: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    costPer1kTokens: 0.003,
    speedRating: 9,
    qualityRating: 9,
    maxTokens: 200000,
    bestFor: ["medium", "simple"]
  },
  {
    tier: "gpt-4o-mini",
    modelId: "gpt-4o-mini",
    provider: "openai",
    costPer1kTokens: 0.00015,
    speedRating: 10,
    qualityRating: 7,
    maxTokens: 128000,
    bestFor: ["simple", "trivial"]
  }
]

const COMPLEXITY_TO_TIER: Record<TaskComplexity, ModelTier> = {
  expert: "claude-opus",
  complex: "claude-opus",
  medium: "claude-sonnet",
  simple: "gpt-4o-mini",
  trivial: "gpt-4o-mini"
}

const TIER_FALLBACKS: Record<ModelTier, ModelTier | undefined> = {
  "claude-opus": "gpt-4o",
  "gpt-4o": "claude-sonnet",
  "claude-sonnet": "gpt-4o-mini",
  "gpt-4o-mini": undefined
}

class ModelSelector {
  private configs: ModelConfig[] = MODEL_CONFIGS

  /**
   * Assign the optimal model for a task based on complexity and preferences
   */
  assignModel(complexity: TaskComplexity, preferences: PlanPreferences): ModelAssignment {
    let primaryTier = COMPLEXITY_TO_TIER[complexity]

    // Adjust based on priority preference
    if (preferences.priority === "speed") {
      primaryTier = this.downgrade(primaryTier)
    } else if (preferences.priority === "cost") {
      primaryTier = this.downgrade(this.downgrade(primaryTier))
    }

    // Filter by available models in preferences
    if (preferences.models.length > 0) {
      const availableTiers = this.getTiersFromModels(preferences.models)
      if (!availableTiers.includes(primaryTier)) {
        primaryTier = this.findClosestTier(primaryTier, availableTiers)
      }
    }

    const fallback = TIER_FALLBACKS[primaryTier]

    return {
      primary: primaryTier,
      fallback,
      reason: this.generateReason(complexity, primaryTier, preferences)
    }
  }

  /**
   * Get the model configuration for a tier
   */
  getModelConfig(tier: ModelTier): ModelConfig | undefined {
    return this.configs.find(c => c.tier === tier)
  }

  /**
   * Get the actual model ID to use for an API call
   */
  getModelId(tier: ModelTier): string {
    const config = this.getModelConfig(tier)
    return config?.modelId || "claude-3-5-sonnet-20241022"
  }

  /**
   * Estimate cost for a task
   */
  estimateCost(tier: ModelTier, estimatedTokens: number): number {
    const config = this.getModelConfig(tier)
    if (!config) return 0
    return (estimatedTokens / 1000) * config.costPer1kTokens
  }

  private downgrade(tier: ModelTier): ModelTier {
    const downgradeMap: Record<ModelTier, ModelTier> = {
      "claude-opus": "claude-sonnet",
      "gpt-4o": "gpt-4o-mini",
      "claude-sonnet": "gpt-4o-mini",
      "gpt-4o-mini": "gpt-4o-mini"
    }
    return downgradeMap[tier]
  }

  private getTiersFromModels(models: string[]): ModelTier[] {
    const tiers: ModelTier[] = []
    for (const model of models) {
      const normalizedModel = model.toLowerCase()
      if (normalizedModel.includes("opus") || normalizedModel.includes("sonnet-4")) {
        tiers.push("claude-opus")
      }
      if (normalizedModel.includes("gpt-4o") && !normalizedModel.includes("mini")) {
        tiers.push("gpt-4o")
      }
      if (normalizedModel.includes("sonnet") && !normalizedModel.includes("sonnet-4")) {
        tiers.push("claude-sonnet")
      }
      if (normalizedModel.includes("mini") || normalizedModel.includes("haiku")) {
        tiers.push("gpt-4o-mini")
      }
    }
    return [...new Set(tiers)]
  }

  private findClosestTier(target: ModelTier, available: ModelTier[]): ModelTier {
    const tierOrder: ModelTier[] = ["claude-opus", "gpt-4o", "claude-sonnet", "gpt-4o-mini"]
    const targetIndex = tierOrder.indexOf(target)
    
    // Try to find closest available
    for (let i = 0; i < tierOrder.length; i++) {
      const upIndex = targetIndex - i
      const downIndex = targetIndex + i
      
      if (upIndex >= 0 && available.includes(tierOrder[upIndex])) {
        return tierOrder[upIndex]
      }
      if (downIndex < tierOrder.length && available.includes(tierOrder[downIndex])) {
        return tierOrder[downIndex]
      }
    }
    
    return available[0] || "claude-sonnet"
  }

  private generateReason(
    complexity: TaskComplexity, 
    tier: ModelTier, 
    preferences: PlanPreferences
  ): string {
    const reasons: string[] = []
    
    reasons.push(`Task complexity: ${complexity}`)
    
    if (preferences.priority === "speed") {
      reasons.push("optimized for speed")
    } else if (preferences.priority === "cost") {
      reasons.push("optimized for cost")
    } else {
      reasons.push("optimized for quality")
    }

    const config = this.getModelConfig(tier)
    if (config) {
      reasons.push(`using ${config.modelId}`)
    }

    return reasons.join(", ")
  }
}

export const modelSelector = new ModelSelector()
