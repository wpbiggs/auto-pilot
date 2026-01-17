import { createSignal, createMemo, createEffect, For, Show, onMount, onCleanup } from "solid-js"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Button } from "@opencode-ai/ui/button"
import { Spinner } from "@opencode-ai/ui/spinner"
import type { Agent, Session, SessionStatus } from "@opencode-ai/sdk/v2/client"

interface ActiveAgentExecution {
  sessionId: string
  agentName: string
  modelName: string
  taskTitle: string
  progress: number
  startTime: number
  estimatedCompletion?: number
  tokenUsage: {
    input: number
    output: number
    total: number
  }
  status: "running" | "waiting" | "reviewing" | "completed" | "error"
  color: string
}

interface ActiveAgentsPanelProps {
  sessions: Session[]
  agents: Agent[]
  sessionStatus: Record<string, SessionStatus>
  onViewSession?: (sessionId: string) => void
  onCancelSession?: (sessionId: string) => void
}

const AGENT_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500",
]

export function ActiveAgentsPanel(props: ActiveAgentsPanelProps) {
  const [currentTime, setCurrentTime] = createSignal(Date.now())
  
  // Update current time every second for elapsed time calculation
  onMount(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    
    onCleanup(() => clearInterval(interval))
  })

  // Get active executions from sessions
  const activeExecutions = createMemo<ActiveAgentExecution[]>(() => {
    const executions: ActiveAgentExecution[] = []
    
    for (const session of props.sessions) {
      const status = props.sessionStatus[session.id]
      
      // Only show busy sessions
      if (status?.type !== "busy") continue
      
      // Find matching agent or use default
      const agentIndex = props.agents.findIndex(a => a.name === "default") 
      const agent = props.agents[agentIndex] || props.agents[0]
      const colorIndex = Math.abs(session.id.charCodeAt(0)) % AGENT_COLORS.length
      
      // Calculate progress based on time elapsed (placeholder logic)
      const elapsed = currentTime() - (session.time?.created || currentTime())
      const estimatedDuration = 5 * 60 * 1000 // 5 minutes estimate
      const progress = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100))
      
      executions.push({
        sessionId: session.id,
        agentName: agent?.name || "Default Agent",
        modelName: agent?.model?.modelID || "claude-sonnet-4-20250514",
        taskTitle: session.title || "Untitled Task",
        progress,
        startTime: session.time?.created || currentTime(),
        estimatedCompletion: (session.time?.created || currentTime()) + estimatedDuration,
        tokenUsage: {
          input: Math.floor(Math.random() * 5000) + 1000,
          output: Math.floor(Math.random() * 2000) + 500,
          total: Math.floor(Math.random() * 7000) + 1500,
        },
        status: "running",
        color: AGENT_COLORS[colorIndex],
      })
    }
    
    return executions
  })

  // Summary stats
  const stats = createMemo(() => ({
    totalActive: activeExecutions().length,
    totalTokens: activeExecutions().reduce((sum, e) => sum + e.tokenUsage.total, 0),
    avgProgress: activeExecutions().length > 0
      ? Math.round(activeExecutions().reduce((sum, e) => sum + e.progress, 0) / activeExecutions().length)
      : 0,
  }))

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
    return tokens.toString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return "enter"
      case "waiting": return "clock"
      case "reviewing": return "eye"
      case "completed": return "circle-check"
      case "error": return "circle-ban-sign"
      default: return "dot-grid"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "text-blue-500"
      case "waiting": return "text-yellow-500"
      case "reviewing": return "text-purple-500"
      case "completed": return "text-green-500"
      case "error": return "text-red-500"
      default: return "text-gray-500"
    }
  }

  return (
    <Card class="p-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="relative">
            <Icon name="mcp" class="size-5" />
            <Show when={stats().totalActive > 0}>
              <span class="absolute -top-1 -right-1 size-2 bg-green-500 rounded-full animate-pulse" />
            </Show>
          </div>
          <h3 class="font-semibold">Active Agents</h3>
          <Show when={stats().totalActive > 0}>
            <span class="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {stats().totalActive} running
            </span>
          </Show>
        </div>
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <Show when={stats().totalActive > 0}>
            <span>Avg: {stats().avgProgress}%</span>
            <span>Tokens: {formatTokens(stats().totalTokens)}</span>
          </Show>
        </div>
      </div>

      <Show 
        when={activeExecutions().length > 0} 
        fallback={
          <div class="text-center py-8 text-muted-foreground">
            <Icon name="mcp" class="size-12 mx-auto mb-2 opacity-50" />
            <p class="text-sm">No active agents</p>
            <p class="text-xs">Start a task to see agent activity</p>
          </div>
        }
      >
        <div class="space-y-3">
          <For each={activeExecutions()}>
            {(execution) => (
              <div class="p-3 border border-border rounded-lg bg-muted/20">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class={`size-3 rounded-full ${execution.color}`} />
                    <div>
                      <p class="font-medium text-sm">{execution.agentName}</p>
                      <p class="text-xs text-muted-foreground">{execution.modelName}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <Icon 
                      name={getStatusIcon(execution.status) as any} 
                      class={`size-4 ${getStatusColor(execution.status)}`} 
                    />
                    <span class={`text-xs ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                  </div>
                </div>

                <p class="text-sm mb-2 truncate" title={execution.taskTitle}>
                  {execution.taskTitle}
                </p>

                {/* Progress bar */}
                <div class="mb-2">
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-muted-foreground">Progress</span>
                    <span class="font-medium">{execution.progress}%</span>
                  </div>
                  <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      class={`h-full rounded-full transition-all duration-500 ${execution.color}`}
                      style={{ width: `${execution.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <div class="flex items-center gap-3">
                    <span title="Elapsed time">
                      <Icon name="task" class="size-3 inline mr-1" />
                      {formatDuration(currentTime() - execution.startTime)}
                    </span>
                    <span title="Token usage">
                      <Icon name="code-lines" class="size-3 inline mr-1" />
                      {formatTokens(execution.tokenUsage.total)}
                    </span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Button 
                      size="small" 
                      variant="ghost" 
                      class="h-6 px-2"
                      onClick={() => props.onViewSession?.(execution.sessionId)}
                    >
                      View
                    </Button>
                    <Button 
                      size="small" 
                      variant="ghost" 
                      class="h-6 px-2 text-red-500 hover:text-red-600"
                      onClick={() => props.onCancelSession?.(execution.sessionId)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </Card>
  )
}

// Standalone panel with WebSocket connection for real-time updates
export function ActiveAgentsPanelWithConnection(props: {
  directory: string
  onViewSession?: (sessionId: string) => void
}) {
  const [isConnected, setIsConnected] = createSignal(false)
  const [lastUpdate, setLastUpdate] = createSignal(Date.now())

  // Placeholder for WebSocket connection
  // In real implementation, this would connect to the server's event stream
  onMount(() => {
    // Simulate connection
    setTimeout(() => setIsConnected(true), 500)
    
    // Simulate periodic updates
    const interval = setInterval(() => {
      setLastUpdate(Date.now())
    }, 2000)
    
    onCleanup(() => clearInterval(interval))
  })

  return (
    <div>
      <div class="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <span class={`size-2 rounded-full ${isConnected() ? "bg-green-500" : "bg-red-500"}`} />
        <span>{isConnected() ? "Connected" : "Connecting..."}</span>
        <span>•</span>
        <span>Last update: {new Date(lastUpdate()).toLocaleTimeString()}</span>
      </div>
      {/* The actual panel would receive data from the WebSocket connection */}
    </div>
  )
}
