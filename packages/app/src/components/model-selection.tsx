import { createSignal, createMemo, For, Show } from "solid-js"
import { Card } from "@opencode-ai/ui/card"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { 
  MODEL_CAPABILITIES, 
  calculateComplexity, 
  detectRequiredCapabilities, 
  recommendModel,
  type ModelCapabilities 
} from "@/lib/orchestration"

interface TaskAnalysis {
  title: string
  description: string
  complexity: {
    score: number
    factors: string[]
  }
  capabilities: string[]
  recommendation: {
    modelId: string
    confidence: number
    reasoning: string[]
  }
  estimatedCost: {
    low: number
    high: number
  }
  estimatedTime: {
    low: number
    high: number
  }
}

interface ModelSelectionProps {
  taskTitle: string
  taskDescription: string
  onSelectModel: (modelId: string, agentName?: string) => void
  onCancel?: () => void
  prioritizeCost?: boolean
  prioritizeQuality?: boolean
}

export function ModelSelectionPanel(props: ModelSelectionProps) {
  const [selectedModel, setSelectedModel] = createSignal<string | null>(null)
  const [showAdvanced, setShowAdvanced] = createSignal(false)
  const [optimizeFor, setOptimizeFor] = createSignal<"balanced" | "cost" | "quality">("balanced")

  // Analyze the task
  const analysis = createMemo<TaskAnalysis>(() => {
    const task = { title: props.taskTitle, description: props.taskDescription }
    const complexity = calculateComplexity(task)
    const capabilities = detectRequiredCapabilities(task)
    const recommendation = recommendModel({
      complexity: complexity.score,
      capabilities,
      prioritizeCost: optimizeFor() === "cost",
      prioritizeQuality: optimizeFor() === "quality",
    })
    
    // Estimate costs based on complexity
    const baseTokens = complexity.score * 2000
    const inputCost = (baseTokens / 1000) * 0.003
    const outputCost = (baseTokens * 0.5 / 1000) * 0.015
    
    return {
      title: props.taskTitle,
      description: props.taskDescription,
      complexity,
      capabilities,
      recommendation,
      estimatedCost: {
        low: inputCost * 0.5,
        high: inputCost * 2 + outputCost * 2,
      },
      estimatedTime: {
        low: complexity.score * 0.5,
        high: complexity.score * 3,
      },
    }
  })

  // Sort models by recommendation score
  const sortedModels = createMemo(() => {
    return [...MODEL_CAPABILITIES].sort((a, b) => {
      if (a.modelId === analysis().recommendation.modelId) return -1
      if (b.modelId === analysis().recommendation.modelId) return 1
      
      const capabilities = analysis().capabilities
      const matchA = capabilities.filter(c => a.capabilities.includes(c)).length
      const matchB = capabilities.filter(c => b.capabilities.includes(c)).length
      return matchB - matchA
    })
  })

  const getComplexityColor = (score: number) => {
    if (score <= 3) return "text-green-500"
    if (score <= 6) return "text-yellow-500"
    return "text-red-500"
  }

  const getComplexityLabel = (score: number) => {
    if (score <= 3) return "Simple"
    if (score <= 6) return "Moderate"
    if (score <= 8) return "Complex"
    return "Very Complex"
  }

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case "coding": return "code-lines"
      case "testing": return "circle-check"
      case "debugging": return "bug"
      case "documentation": return "file"
      case "analysis": return "magnifying-glass"
      case "research": return "brain"
      case "security": return "key"
      case "optimization": return "zap"
      default: return "dot-grid"
    }
  }

  const handleConfirm = () => {
    const model = selectedModel() || analysis().recommendation.modelId
    props.onSelectModel(model)
  }

  return (
    <div class="space-y-4">
      {/* Task Analysis Header */}
      <Card class="p-4">
        <h3 class="font-semibold mb-3 flex items-center gap-2">
          <Icon name="brain" class="size-5" />
          Task Analysis
        </h3>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          {/* Complexity Score */}
          <div class="p-3 bg-muted/30 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">Complexity</p>
            <div class="flex items-center gap-2">
              <span class={`text-2xl font-bold ${getComplexityColor(analysis().complexity.score)}`}>
                {analysis().complexity.score}/10
              </span>
              <span class="text-sm text-muted-foreground">
                {getComplexityLabel(analysis().complexity.score)}
              </span>
            </div>
          </div>
          
          {/* Estimated Cost */}
          <div class="p-3 bg-muted/30 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">Est. Cost</p>
            <p class="text-2xl font-bold">
              ${analysis().estimatedCost.low.toFixed(3)} - ${analysis().estimatedCost.high.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Detected Capabilities */}
        <div class="mb-4">
          <p class="text-xs text-muted-foreground mb-2">Required Capabilities</p>
          <div class="flex flex-wrap gap-2">
            <For each={analysis().capabilities}>
              {(cap) => (
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  <Icon name={getCapabilityIcon(cap) as any} class="size-3" />
                  {cap}
                </span>
              )}
            </For>
          </div>
        </div>

        {/* Complexity Factors */}
        <Show when={analysis().complexity.factors.length > 0}>
          <div>
            <p class="text-xs text-muted-foreground mb-2">Complexity Factors</p>
            <ul class="text-xs space-y-1">
              <For each={analysis().complexity.factors}>
                {(factor) => (
                  <li class="flex items-center gap-1 text-muted-foreground">
                    <span class="size-1 bg-current rounded-full" />
                    {factor}
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </Card>

      {/* Optimization Toggle */}
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">Optimize for:</span>
        <div class="flex gap-1 bg-muted rounded-lg p-1">
          <button
            class={`px-3 py-1 text-sm rounded-md transition-colors ${
              optimizeFor() === "cost" ? "bg-background shadow" : ""
            }`}
            onClick={() => setOptimizeFor("cost")}
          >
            💰 Cost
          </button>
          <button
            class={`px-3 py-1 text-sm rounded-md transition-colors ${
              optimizeFor() === "balanced" ? "bg-background shadow" : ""
            }`}
            onClick={() => setOptimizeFor("balanced")}
          >
            ⚖️ Balanced
          </button>
          <button
            class={`px-3 py-1 text-sm rounded-md transition-colors ${
              optimizeFor() === "quality" ? "bg-background shadow" : ""
            }`}
            onClick={() => setOptimizeFor("quality")}
          >
            ⭐ Quality
          </button>
        </div>
      </div>

      {/* Model Recommendation */}
      <Card class="p-4 border-2 border-primary">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <Icon name="brain" class="size-5 text-primary" />
            <h4 class="font-semibold">Recommended Model</h4>
          </div>
          <span class="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
            {analysis().recommendation.confidence}% confidence
          </span>
        </div>
        
        <div class="flex items-center gap-3 mb-3">
          <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="brain" class="size-5 text-primary" />
          </div>
          <div>
            <p class="font-medium">{analysis().recommendation.modelId}</p>
            <p class="text-xs text-muted-foreground">
              {MODEL_CAPABILITIES.find(m => m.modelId === analysis().recommendation.modelId)?.provider}
            </p>
          </div>
        </div>

        <ul class="text-xs space-y-1 text-muted-foreground">
          <For each={analysis().recommendation.reasoning}>
            {(reason) => (
              <li class="flex items-center gap-1">
                <Icon name="circle-check" class="size-3 text-green-500" />
                {reason}
              </li>
            )}
          </For>
        </ul>

        <Button 
          class="w-full mt-3" 
          onClick={() => {
            setSelectedModel(analysis().recommendation.modelId)
            handleConfirm()
          }}
        >
          Use Recommended Model
        </Button>
      </Card>

      {/* Other Models */}
      <div>
        <button
          class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between p-2"
          onClick={() => setShowAdvanced(!showAdvanced())}
        >
          <span>Other Models</span>
          <Icon name={showAdvanced() ? "chevron-down" : "chevron-right"} class="size-4" />
        </button>
        
        <Show when={showAdvanced()}>
          <div class="space-y-2 mt-2">
            <For each={sortedModels().filter(m => m.modelId !== analysis().recommendation.modelId)}>
              {(model) => {
                const capabilityMatch = analysis().capabilities.filter(c => 
                  model.capabilities.includes(c)
                ).length
                const matchPercentage = Math.round((capabilityMatch / analysis().capabilities.length) * 100)
                
                return (
                  <Card 
                    class={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedModel() === model.modelId ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedModel(model.modelId)}
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="size-8 bg-muted rounded-lg flex items-center justify-center">
                          <Icon name="brain" class="size-4" />
                        </div>
                        <div>
                          <p class="font-medium text-sm">{model.modelId}</p>
                          <p class="text-xs text-muted-foreground">{model.provider}</p>
                        </div>
                      </div>
                      <div class="text-right text-xs">
                        <p class="text-muted-foreground">{matchPercentage}% match</p>
                        <p>
                          <span class="text-muted-foreground">Quality:</span> {model.qualityRating}/10
                        </p>
                      </div>
                    </div>
                    
                    <div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Speed: {model.speedRating}/10</span>
                      <span>Cost: ${model.costPer1kInput}/1K tokens</span>
                    </div>
                  </Card>
                )
              }}
            </For>
          </div>
        </Show>
      </div>

      {/* Actions */}
      <div class="flex gap-2">
        <Show when={props.onCancel}>
          <Button variant="ghost" class="flex-1" onClick={props.onCancel}>
            Cancel
          </Button>
        </Show>
        <Button 
          class="flex-1" 
          disabled={!selectedModel() && !analysis().recommendation.modelId}
          onClick={handleConfirm}
        >
          <Icon name="enter" class="size-4 mr-2" />
          Start with {selectedModel() || analysis().recommendation.modelId}
        </Button>
      </div>
    </div>
  )
}

// Compact version for inline use
export function ModelRecommendationBadge(props: {
  taskTitle: string
  taskDescription: string
  onClick?: () => void
}) {
  const recommendation = createMemo(() => {
    const task = { title: props.taskTitle, description: props.taskDescription }
    const complexity = calculateComplexity(task)
    const capabilities = detectRequiredCapabilities(task)
    return recommendModel({
      complexity: complexity.score,
      capabilities,
    })
  })

  return (
    <button
      class="inline-flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition-colors"
      onClick={props.onClick}
    >
      <Icon name="brain" class="size-3" />
      <span>{recommendation().modelId}</span>
      <span class="text-primary/70">{recommendation().confidence}%</span>
    </button>
  )
}
