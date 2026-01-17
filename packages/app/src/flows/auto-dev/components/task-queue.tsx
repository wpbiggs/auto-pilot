/**
 * Task Queue Component
 * Shows queued, completed, and failed tasks
 */

import { createSignal, For, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import type { Task } from "@/types/task"

interface TaskQueueProps {
  queued: Task[]
  completed: Task[]
  failed: Task[]
}

type TabType = "queued" | "completed" | "failed"

export function TaskQueue(props: TaskQueueProps) {
  const [activeTab, setActiveTab] = createSignal<TabType>("queued")

  const tabs: Array<{ id: TabType; label: string; count: () => number; color: string }> = [
    { id: "queued", label: "Queued", count: () => props.queued.length, color: "text-text-default" },
    { id: "completed", label: "Completed", count: () => props.completed.length, color: "text-green-500" },
    { id: "failed", label: "Failed", count: () => props.failed.length, color: "text-red-500" }
  ]

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "trivial": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "simple": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "complex": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "expert": return "bg-red-500/20 text-red-400 border-red-500/30"
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getModelBadge = (model: string) => {
    if (model.includes("opus")) return { label: "Opus", color: "bg-purple-500/20 text-purple-400" }
    if (model.includes("gpt-4o") && !model.includes("mini")) return { label: "GPT-4o", color: "bg-green-500/20 text-green-400" }
    if (model.includes("sonnet")) return { label: "Sonnet", color: "bg-blue-500/20 text-blue-400" }
    if (model.includes("mini")) return { label: "Mini", color: "bg-gray-500/20 text-gray-400" }
    return { label: model, color: "bg-gray-500/20 text-gray-400" }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const getActiveTasks = () => {
    switch (activeTab()) {
      case "queued": return props.queued
      case "completed": return props.completed
      case "failed": return props.failed
    }
  }

  return (
    <div class="rounded-xl border border-border-default bg-background-secondary">
      {/* Tabs */}
      <div class="flex border-b border-border-default">
        <For each={tabs}>
          {(tab) => (
            <button
              class={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                      ${activeTab() === tab.id 
                        ? "border-b-2 border-accent-primary text-accent-primary" 
                        : "text-text-weak hover:text-text-default"}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span class={tab.color}>{tab.label}</span>
              <span class="ml-2 px-2 py-0.5 rounded-full bg-background-tertiary text-xs">
                {tab.count()}
              </span>
            </button>
          )}
        </For>
      </div>

      {/* Task List */}
      <div class="max-h-96 overflow-y-auto">
        <Show 
          when={getActiveTasks().length > 0}
          fallback={
            <div class="p-8 text-center text-text-weak">
              <Icon 
                name={activeTab() === "completed" ? "circle-check" : activeTab() === "failed" ? "circle-x" : "bullet-list"} 
                class="h-12 w-12 mx-auto mb-3 opacity-50" 
              />
              <p>No {activeTab()} tasks</p>
            </div>
          }
        >
          <div class="divide-y divide-border-default">
            <For each={getActiveTasks()}>
              {(task) => (
                <div class="p-4 hover:bg-background-tertiary/50 transition-colors">
                  <div class="flex items-start justify-between gap-4">
                    {/* Left side - Task info */}
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        {/* Status icon */}
                        <Show when={activeTab() === "completed"}>
                          <Icon name="circle-check" class="h-4 w-4 text-green-500 flex-shrink-0" />
                        </Show>
                        <Show when={activeTab() === "failed"}>
                          <Icon name="circle-x" class="h-4 w-4 text-red-500 flex-shrink-0" />
                        </Show>
                        <Show when={activeTab() === "queued"}>
                          <Icon name="checklist" class="h-4 w-4 text-text-weak flex-shrink-0" />
                        </Show>
                        
                        {/* Title */}
                        <span class="font-medium text-text-default truncate">
                          {task.title}
                        </span>
                      </div>

                      {/* Description */}
                      <p class="text-sm text-text-weak line-clamp-1 mb-2">
                        {task.description}
                      </p>

                      {/* Badges */}
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class={`px-2 py-0.5 rounded-full text-xs border ${getComplexityColor(task.complexity)}`}>
                          {task.complexity}
                        </span>
                        <span class={`px-2 py-0.5 rounded-full text-xs ${getModelBadge(task.modelAssignment.primary).color}`}>
                          {getModelBadge(task.modelAssignment.primary).label}
                        </span>
                        <Show when={task.dependsOn.length > 0}>
                          <span class="px-2 py-0.5 rounded-full text-xs bg-background-tertiary text-text-weak">
                            <Icon name="branch" class="inline h-3 w-3 mr-1" />
                            {task.dependsOn.length} deps
                          </span>
                        </Show>
                      </div>
                    </div>

                    {/* Right side - Stats */}
                    <div class="text-right text-sm flex-shrink-0">
                      <Show when={task.result}>
                        <div class="text-text-weak">
                          {task.result!.tokensUsed.toLocaleString()} tokens
                        </div>
                        <div class="text-text-weak">
                          ${task.result!.cost.toFixed(3)}
                        </div>
                        <div class="text-text-weak">
                          {formatDuration(task.result!.duration)}
                        </div>
                      </Show>
                      <Show when={!task.result}>
                        <div class="text-text-weak">
                          ~{task.estimatedMinutes}m
                        </div>
                        <div class="text-text-weak">
                          ~${task.estimatedCost.toFixed(2)}
                        </div>
                      </Show>
                    </div>
                  </div>

                  {/* Error message for failed tasks */}
                  <Show when={activeTab() === "failed" && task.result?.error}>
                    <div class="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                      {task.result!.error}
                    </div>
                  </Show>

                  {/* Review info for completed tasks */}
                  <Show when={activeTab() === "completed" && task.review}>
                    <div class="mt-2 flex items-center gap-2 text-xs text-text-weak">
                      <span class={task.review!.passed ? "text-green-500" : "text-yellow-500"}>
                        Score: {(task.review!.score * 100).toFixed(0)}%
                      </span>
                      <Show when={task.review!.issues.length > 0}>
                        <span>• {task.review!.issues.length} issues</span>
                      </Show>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
