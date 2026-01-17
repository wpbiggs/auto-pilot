import { createSignal, createMemo, createEffect, For, Show, onMount, onCleanup } from "solid-js"
import { Card } from "@opencode-ai/ui/card"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { ActiveAgentsPanel } from "./active-agents-panel"
import type { Agent, Session, SessionStatus } from "@opencode-ai/sdk/v2/client"
import type { QueuedTask, AgentPoolEntry } from "@/lib/orchestration"

interface ExecutionDashboardProps {
  sessions: Session[]
  agents: Agent[]
  sessionStatus: Record<string, SessionStatus>
  taskQueue: QueuedTask[]
  agentPool: AgentPoolEntry[]
  onViewSession?: (sessionId: string) => void
  onCancelTask?: (taskId: string) => void
  onRetryTask?: (taskId: string) => void
  onStartQueue?: () => void
  onStopQueue?: () => void
  isQueueRunning?: boolean
}

export function ExecutionDashboard(props: ExecutionDashboardProps) {
  const [activeView, setActiveView] = createSignal<"agents" | "queue" | "logs">("agents")
  const [currentTime, setCurrentTime] = createSignal(Date.now())
  const [logs, setLogs] = createSignal<Array<{
    timestamp: number
    level: "info" | "warn" | "error" | "success"
    message: string
    taskId?: string
  }>>([])

  // Update current time for elapsed calculations
  onMount(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000)
    onCleanup(() => clearInterval(interval))
  })

  // Queue statistics
  const queueStats = createMemo(() => {
    const queue = props.taskQueue
    return {
      total: queue.length,
      queued: queue.filter(t => t.status === "queued").length,
      running: queue.filter(t => t.status === "running").length,
      completed: queue.filter(t => t.status === "completed").length,
      failed: queue.filter(t => t.status === "failed").length,
    }
  })

  // Agent pool statistics
  const poolStats = createMemo(() => {
    const pool = props.agentPool
    return {
      total: pool.length,
      available: pool.filter(a => a.isAvailable).length,
      busy: pool.filter(a => !a.isAvailable).length,
      totalTokens: pool.reduce((sum, a) => sum + a.totalTokensUsed, 0),
      totalCost: pool.reduce((sum, a) => sum + a.totalCost, 0),
    }
  })

  // Active sessions
  const activeSessions = createMemo(() => {
    return props.sessions.filter(s => {
      const status = props.sessionStatus[s.id]
      return status?.type === "busy"
    })
  })

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
    return tokens.toString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "queued": return "text-gray-500"
      case "assigned": return "text-blue-500"
      case "running": return "text-purple-500"
      case "completed": return "text-green-500"
      case "failed": return "text-red-500"
      case "cancelled": return "text-gray-400"
      default: return "text-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued": return "clock"
      case "assigned": return "mcp"
      case "running": return "enter"
      case "completed": return "circle-check"
      case "failed": return "circle-ban-sign"
      case "cancelled": return "x"
      default: return "dot-grid"
    }
  }

  return (
    <div class="space-y-4">
      {/* Header Stats */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">Queue</p>
              <p class="text-2xl font-bold">{queueStats().queued}</p>
            </div>
            <div class="size-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Icon name="task" class="size-5 text-gray-500" />
            </div>
          </div>
        </Card>
        
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">Running</p>
              <p class="text-2xl font-bold text-purple-500">{queueStats().running}</p>
            </div>
            <div class="size-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Spinner class="size-5" />
            </div>
          </div>
        </Card>
        
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">Completed</p>
              <p class="text-2xl font-bold text-green-500">{queueStats().completed}</p>
            </div>
            <div class="size-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Icon name="circle-check" class="size-5 text-green-500" />
            </div>
          </div>
        </Card>
        
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">Agents</p>
              <p class="text-2xl font-bold">{poolStats().available}/{poolStats().total}</p>
            </div>
            <div class="size-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Icon name="mcp" class="size-5 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Control Bar */}
      <Card class="p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class={`size-3 rounded-full ${props.isQueueRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              <span class="text-sm font-medium">
                {props.isQueueRunning ? "Queue Running" : "Queue Paused"}
              </span>
            </div>
            <div class="text-xs text-muted-foreground">
              Tokens: {formatTokens(poolStats().totalTokens)} • Cost: ${poolStats().totalCost.toFixed(2)}
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <Show when={!props.isQueueRunning}>
              <Button size="small" onClick={props.onStartQueue}>
                <Icon name="enter" class="size-4 mr-1" />
                Start Queue
              </Button>
            </Show>
            <Show when={props.isQueueRunning}>
              <Button size="small" variant="ghost" onClick={props.onStopQueue}>
                <Icon name="close" class="size-4 mr-1" />
                Pause Queue
              </Button>
            </Show>
          </div>
        </div>
      </Card>

      {/* View Tabs */}
      <div class="flex gap-2 border-b border-border pb-2">
        <Button 
          variant={activeView() === "agents" ? "primary" : "ghost"} 
          size="small"
          onClick={() => setActiveView("agents")}
        >
          <Icon name="mcp" class="size-4 mr-1" />
          Active Agents
        </Button>
        <Button 
          variant={activeView() === "queue" ? "primary" : "ghost"} 
          size="small"
          onClick={() => setActiveView("queue")}
        >
          <Icon name="task" class="size-4 mr-1" />
          Task Queue
        </Button>
        <Button 
          variant={activeView() === "logs" ? "primary" : "ghost"} 
          size="small"
          onClick={() => setActiveView("logs")}
        >
          <Icon name="code-lines" class="size-4 mr-1" />
          Logs
        </Button>
      </div>

      {/* Active Agents View */}
      <Show when={activeView() === "agents"}>
        <ActiveAgentsPanel
          sessions={props.sessions}
          agents={props.agents}
          sessionStatus={props.sessionStatus}
          onViewSession={props.onViewSession}
        />
        
        {/* Agent Pool Status */}
        <Card class="p-4 mt-4">
          <h4 class="font-semibold mb-3">Agent Pool</h4>
          <Show when={props.agentPool.length > 0} fallback={
            <p class="text-sm text-muted-foreground">No agents in pool</p>
          }>
            <div class="space-y-2">
              <For each={props.agentPool}>
                {(entry) => (
                  <div class="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div class="flex items-center gap-2">
                      <span class={`size-2 rounded-full ${entry.isAvailable ? "bg-green-500" : "bg-yellow-500"}`} />
                      <span class="font-medium text-sm">{entry.agent.name}</span>
                      <span class="text-xs text-muted-foreground">
                        {entry.agent.model?.modelID || "Default"}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{entry.totalTasks} tasks</span>
                      <span>{entry.successfulTasks}/{entry.totalTasks} success</span>
                      <span>${entry.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Card>
      </Show>

      {/* Task Queue View */}
      <Show when={activeView() === "queue"}>
        <Card class="p-4">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-semibold">Task Queue</h4>
            <span class="text-xs text-muted-foreground">{props.taskQueue.length} tasks</span>
          </div>
          
          <Show when={props.taskQueue.length > 0} fallback={
            <div class="text-center py-8 text-muted-foreground">
              <Icon name="task" class="size-12 mx-auto mb-2 opacity-50" />
              <p>No tasks in queue</p>
            </div>
          }>
            <div class="space-y-2 max-h-96 overflow-auto">
              <For each={props.taskQueue}>
                {(task) => (
                  <div class="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div class="flex items-center gap-3">
                      <div class={`size-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      <div>
                        <p class="font-medium text-sm">{task.title}</p>
                        <div class="flex items-center gap-2 text-xs text-muted-foreground">
                          <span class={getStatusColor(task.status)}>
                            <Icon name={getStatusIcon(task.status) as any} class="size-3 inline mr-1" />
                            {task.status}
                          </span>
                          <Show when={task.assignedAgent}>
                            <span>• {task.assignedAgent}</span>
                          </Show>
                          <Show when={task.complexity}>
                            <span>• Complexity: {task.complexity}/10</span>
                          </Show>
                        </div>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-2">
                      <Show when={task.status === "failed"}>
                        <Button size="small" variant="ghost" onClick={() => props.onRetryTask?.(task.id)}>
                          Retry
                        </Button>
                      </Show>
                      <Show when={task.status === "queued" || task.status === "running"}>
                        <Button 
                          size="small" 
                          variant="ghost" 
                          class="text-red-500"
                          onClick={() => props.onCancelTask?.(task.id)}
                        >
                          Cancel
                        </Button>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Card>
      </Show>

      {/* Logs View */}
      <Show when={activeView() === "logs"}>
        <Card class="p-4">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-semibold">Execution Logs</h4>
            <Button size="small" variant="ghost" onClick={() => setLogs([])}>
              Clear
            </Button>
          </div>
          
          <Show when={logs().length > 0} fallback={
            <div class="text-center py-8 text-muted-foreground">
              <Icon name="code-lines" class="size-12 mx-auto mb-2 opacity-50" />
              <p>No logs yet</p>
            </div>
          }>
            <div class="space-y-1 max-h-96 overflow-auto font-mono text-xs">
              <For each={logs()}>
                {(log) => (
                  <div class={`p-2 rounded ${
                    log.level === "error" ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300" :
                    log.level === "warn" ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300" :
                    log.level === "success" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" :
                    "bg-muted/30"
                  }`}>
                    <span class="text-muted-foreground">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    {" "}
                    <span>{log.message}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Card>
      </Show>
    </div>
  )
}
