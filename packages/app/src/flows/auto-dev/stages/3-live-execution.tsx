/**
 * Stage 3: Live Execution Dashboard
 * Real-time monitoring of parallel task execution
 */

import { createSignal, createEffect, onMount, onCleanup, Show, For } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import type { ExecutionPlan } from "@/types/execution-plan"
import type { Task } from "@/types/task"
import type { ExecutionStatus, ActiveAgent } from "@/types/agent-status"
import { orchestrator } from "@/services/orchestrator"
import { executionWebSocket } from "@/services/websocket"
import { useGlobalSDK } from "@/context/global-sdk"
import { ProjectProgress } from "../components/project-progress"
import { ActiveAgentsPanel } from "../components/active-agents-panel"
import { TaskQueue } from "../components/task-queue"
import { ExecutionLogs } from "../components/execution-logs"

interface LiveExecutionStageProps {
  plan: ExecutionPlan
  onComplete?: () => void
  onBack?: () => void
}

export function LiveExecutionStage(props: LiveExecutionStageProps) {
  const sdk = useGlobalSDK()
  const [status, setStatus] = createSignal<ExecutionStatus>({
    totalTasks: props.plan.tasks.length,
    completedTasks: 0,
    failedTasks: 0,
    queuedTasks: props.plan.tasks.length,
    runningTasks: 0,
    progressPercentage: 0,
    activeAgents: [],
    completed: [],
    running: [],
    queued: props.plan.tasks,
    failed: [],
    pendingReview: [],
    estimatedTimeRemaining: props.plan.totalEstimateMinutes * 60 * 1000,
    estimatedCostRemaining: props.plan.estimatedCost,
    totalTokensUsed: 0,
    totalCost: 0,
    totalDuration: 0,
    phase: "planning",
    errors: []
  })
  const [logs, setLogs] = createSignal<LogEntry[]>([])
  const [isPaused, setIsPaused] = createSignal(false)
  const [isComplete, setIsComplete] = createSignal(false)

  interface LogEntry {
    id: string
    timestamp: number
    type: "info" | "success" | "error" | "warning"
    message: string
    taskId?: string
  }

  const addLog = (type: LogEntry["type"], message: string, taskId?: string) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      message,
      taskId
    }])
  }

  onMount(async () => {
    // Initialize services
    orchestrator.setSDK(sdk)
    
    // Connect WebSocket
    executionWebSocket.connect()

    // Subscribe to updates
    const unsubscribe = executionWebSocket.onExecutionUpdate((update) => {
      switch (update.type) {
        case "task_started":
          addLog("info", `Started: ${update.payload.taskId}`, update.payload.taskId)
          break
        case "task_completed":
          addLog("success", `Completed: ${update.payload.taskId}`, update.payload.taskId)
          break
        case "task_failed":
          addLog("error", `Failed: ${update.payload.taskId}`, update.payload.taskId)
          break
        case "task_progress":
          // Update progress silently
          break
        case "execution_completed":
          setIsComplete(true)
          addLog("success", "All tasks completed!")
          break
        case "execution_failed":
          addLog("error", `Execution failed: ${update.payload.error}`)
          break
      }
    })

    // Start execution
    addLog("info", "Starting execution...")
    
    try {
      await orchestrator.execute(props.plan)
    } catch (error: any) {
      addLog("error", `Execution error: ${error.message}`)
    }

    onCleanup(() => {
      unsubscribe()
      executionWebSocket.disconnect()
    })
  })

  // Update status from orchestrator
  createEffect(() => {
    const statusGetter = orchestrator.getStatus()
    const currentStatus = statusGetter()
    if (currentStatus) {
      setStatus(currentStatus)
    }
  })

  const handlePause = () => {
    if (isPaused()) {
      orchestrator.resume()
      setIsPaused(false)
      addLog("info", "Execution resumed")
    } else {
      orchestrator.pause()
      setIsPaused(true)
      addLog("warning", "Execution paused")
    }
  }

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel execution?")) {
      orchestrator.cancel()
      addLog("warning", "Execution cancelled")
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`

  return (
    <div class="stage-container min-h-screen p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-text-default flex items-center gap-3">
              <Show when={!isComplete()} fallback={
                <span class="text-green-500">✓</span>
              }>
                <Spinner class="h-6 w-6" />
              </Show>
              {props.plan.projectName}
            </h1>
            <p class="text-text-weak mt-1">
              {isComplete() 
                ? "Execution completed" 
                : isPaused() 
                  ? "Execution paused" 
                  : "Executing..."}
            </p>
          </div>
          <div class="flex gap-3">
            <Show when={!isComplete()}>
              <Button 
                variant="secondary" 
                onClick={handlePause}
              >
                <Icon name={isPaused() ? "chevron-right" : "stop"} class="mr-2 h-4 w-4" />
                {isPaused() ? "Resume" : "Pause"}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleCancel}
                class="text-red-500 hover:text-red-600"
              >
                <Icon name="close" class="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </Show>
            <Show when={isComplete()}>
              <Button 
                variant="primary"
                onClick={props.onComplete}
              >
                <Icon name="check" class="mr-2 h-4 w-4" />
                Done
              </Button>
            </Show>
          </div>
        </div>

        {/* Progress Overview */}
        <ProjectProgress status={status()} />

        {/* Main Content Grid */}
        <div class="grid grid-cols-12 gap-6">
          {/* Left Column - Active Agents & Queue */}
          <div class="col-span-8 space-y-6">
            {/* Active Agents */}
            <ActiveAgentsPanel agents={status().activeAgents} />

            {/* Task Queue */}
            <TaskQueue 
              queued={status().queued}
              completed={status().completed}
              failed={status().failed}
            />
          </div>

          {/* Right Column - Stats & Logs */}
          <div class="col-span-4 space-y-6">
            {/* Stats */}
            <div class="rounded-xl border border-border-default bg-background-secondary p-4 space-y-4">
              <h3 class="font-semibold text-text-default">Statistics</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-text-weak">Tokens Used</span>
                  <span class="text-text-default font-mono">
                    {status().totalTokensUsed.toLocaleString()}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-text-weak">Cost So Far</span>
                  <span class="text-text-default font-mono">
                    {formatCost(status().totalCost)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-text-weak">Est. Remaining</span>
                  <span class="text-text-default font-mono">
                    {formatCost(status().estimatedCostRemaining)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-text-weak">Time Remaining</span>
                  <span class="text-text-default font-mono">
                    {formatTime(status().estimatedTimeRemaining)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-text-weak">Elapsed</span>
                  <span class="text-text-default font-mono">
                    {formatTime(status().totalDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Logs */}
            <ExecutionLogs logs={logs()} />
          </div>
        </div>

        {/* Pending Review Section */}
        <Show when={status().pendingReview.length > 0}>
          <div class="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-6">
            <h3 class="text-lg font-semibold text-yellow-500 mb-4 flex items-center gap-2">
              <Icon name="circle-x" class="h-5 w-5" />
              Tasks Requiring Review ({status().pendingReview.length})
            </h3>
            <div class="space-y-3">
              <For each={status().pendingReview}>
                {(task) => (
                  <div class="p-4 rounded-lg bg-background-secondary border border-border-default">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-medium text-text-default">{task.title}</div>
                        <div class="text-sm text-text-weak mt-1">
                          Score: {((task.review?.score || 0) * 100).toFixed(0)}% - 
                          {task.review?.issues.length || 0} issues found
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <Button variant="secondary" size="small">
                          <Icon name="eye" class="mr-1 h-3 w-3" />
                          Review
                        </Button>
                        <Button variant="primary" size="small">
                          <Icon name="check" class="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
