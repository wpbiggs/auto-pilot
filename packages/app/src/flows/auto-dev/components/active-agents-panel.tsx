/**
 * Active Agents Panel Component
 * Shows currently running AI agents and their progress
 */

import { For, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import type { ActiveAgent } from "@/types/agent-status"

interface ActiveAgentsPanelProps {
  agents: ActiveAgent[]
}

export function ActiveAgentsPanel(props: ActiveAgentsPanelProps) {
  const getStateColor = (state: ActiveAgent["state"]) => {
    switch (state) {
      case "running": return "bg-green-500"
      case "initializing": return "bg-yellow-500"
      case "paused": return "bg-yellow-500"
      case "completed": return "bg-blue-500"
      case "failed": return "bg-red-500"
      case "rate-limited": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  const getModelIcon = (model: string) => {
    if (model.includes("claude")) return "🟣"
    if (model.includes("gpt")) return "🟢"
    return "🔵"
  }

  const formatDuration = (startedAt: number) => {
    const seconds = Math.floor((Date.now() - startedAt) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <div class="rounded-xl border border-border-default bg-background-secondary p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-text-default flex items-center gap-2">
          <Icon name="server" class="h-5 w-5 text-accent-primary" />
          Active Agents
        </h3>
        <span class="text-sm text-text-weak">
          {props.agents.length} running
        </span>
      </div>

      <Show 
        when={props.agents.length > 0}
        fallback={
          <div class="text-center py-8 text-text-weak">
            <Icon name="server" class="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No agents currently running</p>
            <p class="text-sm">Agents will appear here when tasks start executing</p>
          </div>
        }
      >
        <div class="space-y-3">
          <For each={props.agents}>
            {(agent) => (
              <div class="p-4 rounded-lg bg-background-tertiary border border-border-default">
                {/* Agent Header */}
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class={`w-3 h-3 rounded-full ${getStateColor(agent.state)} animate-pulse`} />
                    <span class="font-medium text-text-default">
                      {getModelIcon(agent.model)} {agent.name}
                    </span>
                  </div>
                  <div class="text-sm text-text-weak">
                    {formatDuration(agent.startedAt)}
                  </div>
                </div>

                {/* Current Task */}
                <Show when={agent.currentTask}>
                  <div class="mb-3">
                    <div class="text-sm text-text-weak mb-1">Current Task:</div>
                    <div class="text-text-default font-medium">
                      {agent.currentTask!.title}
                    </div>
                  </div>
                </Show>

                {/* Progress Bar */}
                <Show when={agent.currentProgress}>
                  <div class="mb-2">
                    <div class="flex justify-between text-xs text-text-weak mb-1">
                      <span>{agent.currentProgress!.currentStep || "Processing..."}</span>
                      <span>{agent.currentProgress!.percentage}%</span>
                    </div>
                    <div class="h-2 bg-background-secondary rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-accent-primary rounded-full transition-all duration-300"
                        style={`width: ${agent.currentProgress!.percentage}%`}
                      />
                    </div>
                  </div>
                </Show>

                {/* Stats */}
                <div class="flex gap-4 text-xs text-text-weak">
                  <span>
                    <Icon name="brain" class="inline h-3 w-3 mr-1" />
                    {(agent.currentProgress?.tokensUsed || 0).toLocaleString()} tokens
                  </span>
                  <span>
                    <Icon name="code" class="inline h-3 w-3 mr-1" />
                    ${(agent.currentProgress?.cost || 0).toFixed(3)}
                  </span>
                  <Show when={agent.rateLimitRemaining !== undefined}>
                    <span class={agent.rateLimitRemaining! < 10 ? "text-orange-500" : ""}>
                      <Icon name="circle-x" class="inline h-3 w-3 mr-1" />
                      {agent.rateLimitRemaining} calls left
                    </span>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
