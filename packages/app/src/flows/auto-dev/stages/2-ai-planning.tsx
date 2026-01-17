/**
 * Stage 2: AI Planning
 * Shows AI analysis and execution plan preview
 * Now with codebase context awareness
 */

import { createSignal, onMount, Show, For } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import type { ExecutionPlan, PlanPreferences, CodebaseMode, CodebaseContextInfo } from "@/types/execution-plan"
import type { Task } from "@/types/task"
import { aiPlanner } from "@/services/ai-planner"
import { useGlobalSDK } from "@/context/global-sdk"
import type { CodebaseContext } from "../components/codebase-selector"

interface AIPlanningStageProps {
  idea: string
  mode: CodebaseMode
  codebaseContext?: CodebaseContext
  onApprove: (plan: ExecutionPlan) => void
  onBack: () => void
}

const LOADING_MESSAGES = [
  "Analyzing your project requirements...",
  "Breaking down into features...",
  "Designing the architecture...",
  "Creating task dependencies...",
  "Assigning optimal AI models...",
  "Estimating time and cost...",
  "Finalizing execution plan..."
]

const CODEBASE_LOADING_MESSAGES = [
  "Analyzing existing codebase structure...",
  "Mapping file dependencies...",
  "Understanding code patterns...",
  "Identifying modification points...",
  "Planning incremental changes...",
  "Ensuring backwards compatibility...",
  "Finalizing modification plan..."
]

export function AIPlanningStage(props: AIPlanningStageProps) {
  const sdk = useGlobalSDK()
  const [plan, setPlan] = createSignal<ExecutionPlan | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal("")
  const [loadingMessage, setLoadingMessage] = createSignal(LOADING_MESSAGES[0])
  const [expandedPhases, setExpandedPhases] = createSignal<Set<string>>(new Set(["foundation"]))

  const hasCodebaseContext = () => !!props.codebaseContext?.selectedFiles?.length

  onMount(async () => {
    // Cycle through loading messages based on mode
    const messages = hasCodebaseContext() ? CODEBASE_LOADING_MESSAGES : LOADING_MESSAGES
    let messageIndex = 0
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length
      setLoadingMessage(messages[messageIndex])
    }, 2000)

    try {
      // Initialize planner with SDK
      aiPlanner.setSDK(sdk)

      const preferences: PlanPreferences = {
        models: ["claude-sonnet", "gpt-4o", "gpt-4o-mini"],
        priority: "quality",
        // Enable preservation for codebase modifications
        preserveExistingCode: props.mode !== "new-project",
        generateTests: props.mode === "test" || props.mode === "add-features",
        updateDocs: props.mode === "add-features" || props.mode === "refactor"
      }

      // Convert CodebaseContext to CodebaseContextInfo for the planner
      const codebaseContextInfo: CodebaseContextInfo | undefined = props.codebaseContext ? {
        rootPath: props.codebaseContext.rootPath,
        selectedFiles: props.codebaseContext.selectedFiles,
        detectedTechStack: props.codebaseContext.detectedTechStack,
        fileStats: props.codebaseContext.fileStats
      } : undefined

      const response = await aiPlanner.analyzeAndPlan({
        idea: props.idea,
        mode: props.mode,
        preferences,
        codebaseContext: codebaseContextInfo
      })

      if (response.success && response.plan) {
        setPlan(response.plan)
      } else {
        setError(response.error || "Failed to generate plan")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      clearInterval(messageInterval)
      setLoading(false)
    }
  })

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phase)) {
        next.delete(phase)
      } else {
        next.add(phase)
      }
      return next
    })
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "trivial": return "bg-green-500/20 text-green-400"
      case "simple": return "bg-blue-500/20 text-blue-400"
      case "medium": return "bg-yellow-500/20 text-yellow-400"
      case "complex": return "bg-orange-500/20 text-orange-400"
      case "expert": return "bg-red-500/20 text-red-400"
      default: return "bg-gray-500/20 text-gray-400"
    }
  }

  const getModelColor = (model: string) => {
    if (model.includes("opus")) return "text-purple-400"
    if (model.includes("gpt-4o") && !model.includes("mini")) return "text-green-400"
    if (model.includes("sonnet")) return "text-blue-400"
    return "text-gray-400"
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`
  }

  return (
    <div class="stage-container min-h-[80vh] p-8">
      <div class="max-w-5xl mx-auto">
        {/* Loading State */}
        <Show when={loading()}>
          <div class="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div class="relative">
              <div class="w-24 h-24 rounded-full border-4 border-accent-primary/20 
                          border-t-accent-primary animate-spin" />
              <div class="absolute inset-0 flex items-center justify-center">
                <Icon name="brain" class="h-8 w-8 text-accent-primary animate-pulse" />
              </div>
            </div>
            <div class="text-center space-y-2">
              <h2 class="text-2xl font-semibold text-text-default">
                AI is analyzing your project
              </h2>
              <p class="text-lg text-text-weak animate-pulse">
                {loadingMessage()}
              </p>
            </div>
            <div class="max-w-md w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
              <div class="h-full bg-accent-primary rounded-full animate-pulse"
                   style="width: 60%; animation: loading-progress 3s ease-in-out infinite" />
            </div>
          </div>
        </Show>

        {/* Error State */}
        <Show when={!loading() && error()}>
          <div class="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div class="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <Icon name="circle-x" class="h-10 w-10 text-red-500" />
            </div>
            <div class="text-center space-y-2">
              <h2 class="text-2xl font-semibold text-text-default">
                Failed to generate plan
              </h2>
              <p class="text-text-weak max-w-md">
                {error()}
              </p>
            </div>
            <div class="flex gap-4">
              <Button variant="secondary" onClick={props.onBack}>
                <Icon name="arrow-left" class="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button variant="primary" onClick={() => window.location.reload()}>
                <Icon name="chevron-double-right" class="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </Show>

        {/* Plan Preview */}
        <Show when={!loading() && !error() && plan()}>
          <div class="space-y-8">
            {/* Header */}
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-3">
                  <h1 class="text-3xl font-bold text-text-default">
                    {plan()!.projectName}
                  </h1>
                  <Show when={props.mode !== "new-project"}>
                    <span class="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
                      {props.mode.replace("-", " ")}
                    </span>
                  </Show>
                </div>
                <p class="text-text-weak mt-1">
                  Execution plan generated successfully
                </p>
              </div>
              <div class="flex gap-3">
                <Button variant="secondary" onClick={props.onBack}>
                  <Icon name="arrow-left" class="mr-2 h-4 w-4" />
                  Edit Idea
                </Button>
                <Button variant="primary" onClick={() => props.onApprove(plan()!)}>
                  Start Auto-Execution
                  <Icon name="chevron-right" class="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div class="grid grid-cols-4 gap-4">
              <div class="p-4 rounded-xl bg-background-secondary border border-border-default">
                <div class="text-sm text-text-weak">Total Tasks</div>
                <div class="text-2xl font-bold text-text-default">
                  {plan()!.tasks.length}
                </div>
              </div>
              <div class="p-4 rounded-xl bg-background-secondary border border-border-default">
                <div class="text-sm text-text-weak">Estimated Time</div>
                <div class="text-2xl font-bold text-text-default">
                  {formatDuration(plan()!.totalEstimateMinutes)}
                </div>
              </div>
              <div class="p-4 rounded-xl bg-background-secondary border border-border-default">
                <div class="text-sm text-text-weak">Estimated Cost</div>
                <div class="text-2xl font-bold text-text-default">
                  {formatCost(plan()!.estimatedCost)}
                </div>
              </div>
              <div class="p-4 rounded-xl bg-background-secondary border border-border-default">
                <div class="text-sm text-text-weak">Features</div>
                <div class="text-2xl font-bold text-text-default">
                  {plan()!.features.length}
                </div>
              </div>
            </div>

            {/* Codebase Context (for existing codebase work) */}
            <Show when={hasCodebaseContext()}>
              <div class="rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden">
                <div class="px-6 py-4 border-b border-blue-500/20">
                  <div class="flex items-center gap-3">
                    <Icon name="folder-add-left" class="h-5 w-5 text-blue-400" />
                    <h3 class="font-semibold text-text-default">Codebase Context</h3>
                  </div>
                </div>
                <div class="px-6 py-4 space-y-4">
                  {/* Tech Stack */}
                  <Show when={props.codebaseContext?.detectedTechStack?.length}>
                    <div>
                      <div class="text-sm text-text-weak mb-2">Detected Technologies</div>
                      <div class="flex flex-wrap gap-2">
                        <For each={props.codebaseContext?.detectedTechStack}>
                          {(tech) => (
                            <span class="px-2 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-400">
                              {tech}
                            </span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                  
                  {/* Selected Files */}
                  <div>
                    <div class="text-sm text-text-weak mb-2">
                      Working with {props.codebaseContext?.selectedFiles.length} selected file(s)/folder(s)
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <For each={props.codebaseContext?.selectedFiles.slice(0, 10)}>
                        {(file) => (
                          <span class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-background-element">
                            <Icon name="folder" class="h-3 w-3 text-text-weak" />
                            <span class="text-text-default">{file.name}</span>
                          </span>
                        )}
                      </For>
                      <Show when={(props.codebaseContext?.selectedFiles.length ?? 0) > 10}>
                        <span class="px-2 py-1 text-xs text-text-weak">
                          +{(props.codebaseContext?.selectedFiles.length ?? 0) - 10} more
                        </span>
                      </Show>
                    </div>
                  </div>

                  {/* File Modifications Summary */}
                  <Show when={plan()!.fileModifications?.length}>
                    <div>
                      <div class="text-sm text-text-weak mb-2">Planned File Changes</div>
                      <div class="grid grid-cols-4 gap-2 text-xs">
                        <div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-400">
                          <Icon name="plus-small" class="h-3 w-3" />
                          <span>{plan()!.fileModifications?.filter(f => f.action === "create").length || 0} new</span>
                        </div>
                        <div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400">
                          <Icon name="edit-small-2" class="h-3 w-3" />
                          <span>{plan()!.fileModifications?.filter(f => f.action === "modify").length || 0} modified</span>
                        </div>
                        <div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-400">
                          <Icon name="close" class="h-3 w-3" />
                          <span>{plan()!.fileModifications?.filter(f => f.action === "delete").length || 0} deleted</span>
                        </div>
                        <div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400">
                          <Icon name="chevron-right" class="h-3 w-3" />
                          <span>{plan()!.fileModifications?.filter(f => f.action === "rename").length || 0} renamed</span>
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Phases & Tasks */}
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-text-default">
                Execution Phases
              </h2>
              
              <For each={plan()!.phases.sort((a, b) => a.order - b.order)}>
                {(phase) => (
                  <div class="rounded-xl border border-border-default overflow-hidden">
                    {/* Phase Header */}
                    <button
                      class="w-full p-4 flex items-center justify-between bg-background-secondary 
                             hover:bg-background-tertiary transition-colors"
                      onClick={() => togglePhase(phase.phase)}
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-8 h-8 rounded-full bg-accent-primary/20 
                                    flex items-center justify-center text-accent-primary font-bold">
                          {phase.order}
                        </div>
                        <div class="text-left">
                          <div class="font-semibold text-text-default">
                            {phase.name}
                          </div>
                          <div class="text-sm text-text-weak">
                            {phase.taskIds.length} tasks • {formatDuration(phase.estimatedMinutes)}
                          </div>
                        </div>
                      </div>
                      <Icon 
                        name={expandedPhases().has(phase.phase) ? "chevron-down" : "chevron-right"} 
                        class="h-5 w-5 text-text-weak" 
                      />
                    </button>

                    {/* Phase Tasks */}
                    <Show when={expandedPhases().has(phase.phase)}>
                      <div class="border-t border-border-default divide-y divide-border-default">
                        <For each={plan()!.tasks.filter(t => t.phase === phase.phase)}>
                          {(task) => (
                            <div class="p-4 hover:bg-background-secondary/50 transition-colors">
                              <div class="flex items-start justify-between gap-4">
                                <div class="flex-1">
                                  <div class="flex items-center gap-2">
                                    <span class="font-medium text-text-default">
                                      {task.title}
                                    </span>
                                    <span class={`px-2 py-0.5 rounded-full text-xs ${getComplexityColor(task.complexity)}`}>
                                      {task.complexity}
                                    </span>
                                  </div>
                                  <p class="text-sm text-text-weak mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                  <Show when={task.dependsOn.length > 0}>
                                    <div class="flex items-center gap-1 mt-2 text-xs text-text-weak">
                                      <Icon name="branch" class="h-3 w-3" />
                                      Depends on: {task.dependsOn.length} task(s)
                                    </div>
                                  </Show>
                                </div>
                                <div class="text-right text-sm space-y-1">
                                  <div class={getModelColor(task.modelAssignment.primary)}>
                                    {task.modelAssignment.primary}
                                  </div>
                                  <div class="text-text-weak">
                                    ~{formatDuration(task.estimatedMinutes)}
                                  </div>
                                  <div class="text-text-weak">
                                    {formatCost(task.estimatedCost)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>

            {/* Bottom Actions */}
            <div class="flex justify-center pt-8 pb-4">
              <Button 
                variant="primary" 
                size="large"
                onClick={() => props.onApprove(plan()!)}
                class="px-12"
              >
                <Icon name="chevron-double-right" class="mr-2 h-5 w-5" />
                Start Auto-Execution
              </Button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
