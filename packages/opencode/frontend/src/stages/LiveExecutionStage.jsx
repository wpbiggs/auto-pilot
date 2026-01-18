/**
 * Stage 3: Live Execution Dashboard
 * Real-time monitoring of parallel task execution with OpenCode SDK
 */

import { useState, useEffect, useCallback } from "react"
import { 
  createExecutionService, 
  createMockExecutionService, 
  checkSDKConnection 
} from "../services/execution"

function TaskCard({ task }) {
  const [showOutput, setShowOutput] = useState(false)
  
  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "border-green-500 bg-green-500/10"
      case "running": return "border-blue-500 bg-blue-500/10"
      case "failed": return "border-red-500 bg-red-500/10"
      default: return "border-gray-700 bg-gray-800/50"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return "✓"
      case "running": return "⟳"
      case "failed": return "✗"
      default: return "○"
    }
  }

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${getStatusColor(task.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${
            task.status === "completed" ? "text-green-400" :
            task.status === "running" ? "text-blue-400 animate-spin" :
            task.status === "failed" ? "text-red-400" :
            "text-gray-500"
          }`}>
            {getStatusIcon(task.status)}
          </span>
          <span className="font-medium text-white">{task.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-mono">{task.model}</span>
          {(task.output || task.error) && (
            <button
              onClick={() => setShowOutput(!showOutput)}
              className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              {showOutput ? "Hide" : "Show"} Output
            </button>
          )}
        </div>
      </div>
      
      {task.status === "running" && (
        <div className="mt-2">
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{task.progress}%</div>
        </div>
      )}

      {task.status === "completed" && task.tokensUsed && (
        <div className="mt-2 flex gap-4 text-xs text-gray-500">
          <span>Tokens: {task.tokensUsed?.toLocaleString()}</span>
          <span>Cost: ${task.cost?.toFixed(4)}</span>
          <span>Duration: {Math.round((task.duration || 0) / 1000)}s</span>
        </div>
      )}

      {task.status === "failed" && task.error && (
        <div className="mt-2 text-sm text-red-400 bg-red-500/10 p-2 rounded">
          {task.error}
        </div>
      )}

      {showOutput && task.output && (
        <div className="mt-2 text-sm text-gray-300 bg-gray-800 p-3 rounded font-mono text-xs max-h-40 overflow-y-auto whitespace-pre-wrap">
          {task.output}
        </div>
      )}
    </div>
  )
}

function LogEntry({ log }) {
  const getLogColor = (type) => {
    switch (type) {
      case "success": return "text-green-400"
      case "error": return "text-red-400"
      case "warning": return "text-yellow-400"
      default: return "text-gray-400"
    }
  }

  const getLogIcon = (type) => {
    switch (type) {
      case "success": return "✓"
      case "error": return "✗"
      case "warning": return "⚠"
      default: return "→"
    }
  }

  const time = new Date(log.timestamp).toLocaleTimeString()

  return (
    <div className={`flex items-start gap-2 text-sm font-mono ${getLogColor(log.type)}`}>
      <span className="text-gray-600 flex-shrink-0">[{time}]</span>
      <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
      <span className="break-all">{log.message}</span>
    </div>
  )
}

export function LiveExecutionStage({ plan, onComplete, onBack }) {
  const [status, setStatus] = useState({
    totalTasks: plan.tasks.length,
    completedTasks: 0,
    failedTasks: 0,
    runningTasks: 0,
    queuedTasks: plan.tasks.length,
    progressPercentage: 0,
    isComplete: false,
    tasks: plan.tasks.map(t => ({ ...t, status: "queued", progress: 0 })),
    totalTokensUsed: 0,
    totalCost: 0,
    totalDuration: 0,
  })
  const [logs, setLogs] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const [executor, setExecutor] = useState(null)
  const [sdkConnected, setSdkConnected] = useState(null) // null = checking, true/false = result
  const [escalationCount, setEscalationCount] = useState(0)

  const addLog = useCallback((type, message) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      message
    }].slice(-100)) // Keep last 100 logs
  }, [])

  // Escalation webhook handler
  const handleEscalation = useCallback((event) => {
    switch (event.type) {
      case "escalation_started":
        setEscalationCount(prev => prev + 1)
        addLog("warning", `⬆️ Escalating "${event.taskName}" from ${event.originalModel} to ${event.escalatedModel} (Level ${event.escalationLevel}/${event.maxEscalations})`)
        break
      case "escalation_completed":
        addLog("success", `✅ Escalation succeeded for "${event.taskName}" with ${event.escalatedModel}`)
        break
      case "escalation_failed":
        addLog("error", `❌ Escalation exhausted for "${event.taskName}" - All models failed after ${event.escalationLevel} attempts`)
        break
      case "task_failed":
        // This is the initial failure before escalation
        break
    }
  }, [addLog])

  useEffect(() => {
    // Check SDK connection and start execution
    const startExecution = async () => {
      addLog("info", "Checking OpenCode SDK connection...")
      
      const isConnected = await checkSDKConnection()
      setSdkConnected(isConnected)
      
      if (isConnected) {
        addLog("success", "Connected to OpenCode SDK - using real AI agents")
        addLog("info", "🛡️ Failure escalation enabled - tasks will auto-escalate to stronger models on failure")
      } else {
        addLog("warning", "SDK not available - running in demo mode")
      }

      // Create appropriate executor
      const handleUpdate = (newStatus, event) => {
        setStatus(newStatus)
        
        if (event) {
          if (event.type === "log" && event.logType && event.message) {
            addLog(event.logType, event.message)
          } else if (event.type === "task_started") {
            // Log already added by execution service
          } else if (event.type === "task_completed") {
            // Log already added by execution service
          } else if (event.type === "task_failed") {
            // Log already added by execution service
          } else if (event.type === "execution_completed") {
            // Log already added by execution service
          }
        }
      }

      const exec = isConnected
        ? createExecutionService(plan, handleUpdate, {
            // Escalation configuration
            escalation: {
              enabled: true,
              maxEscalations: 2,
              includeFailedOutputInEscalation: true,
            },
            onEscalation: handleEscalation,
          })
        : createMockExecutionService(plan, handleUpdate)
      
      setExecutor(exec)
    }

    startExecution()

    return () => {
      // Cleanup on unmount
    }
  }, [plan, addLog, handleEscalation])

  const handlePause = () => {
    if (!executor) return
    
    if (isPaused) {
      executor.resume()
      setIsPaused(false)
      addLog("info", "Execution resumed")
    } else {
      executor.pause()
      setIsPaused(true)
      addLog("warning", "Execution paused")
    }
  }

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel execution?")) {
      executor?.cancel()
      addLog("warning", "Execution cancelled by user")
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {status.isComplete ? (
                <span className="text-green-500">✓</span>
              ) : (
                <span className="animate-spin">⟳</span>
              )}
              {plan.projectName}
            </h1>
            <p className="text-gray-400 mt-1">
              {status.isComplete
                ? "Execution completed"
                : isPaused
                  ? "Execution paused"
                  : "Executing..."}
            </p>
          </div>
          <div className="flex gap-3">
            {!status.isComplete && (
              <>
                <button
                  onClick={handlePause}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  {isPaused ? "▶ Resume" : "⏸ Pause"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-red-400 hover:bg-gray-700 transition-colors"
                >
                  ✗ Cancel
                </button>
              </>
            )}
            {status.isComplete && (
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold"
              >
                🎉 Start New Project
              </button>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 col-span-2">
            <div className="text-sm text-gray-400 mb-2">Overall Progress</div>
            <div className="text-3xl font-bold text-white mb-2">
              {status.progressPercentage}%
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${status.progressPercentage}%` }}
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-green-400">{status.completedTasks}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Running</div>
            <div className="text-2xl font-bold text-blue-400">{status.runningTasks}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Failed</div>
            <div className="text-2xl font-bold text-red-400">{status.failedTasks}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Total Cost</div>
            <div className="text-2xl font-bold text-green-400">
              ${status.totalCost?.toFixed(2) || "0.00"}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Escalations</div>
            <div className="text-2xl font-bold text-orange-400">{escalationCount}</div>
            {escalationCount > 0 && (
              <div className="text-xs text-orange-400/70 mt-1">Auto-upgraded models</div>
            )}
          </div>
        </div>

        {/* SDK Connection Status */}
        {sdkConnected !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
            sdkConnected 
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
          }`}>
            <span>{sdkConnected ? "🟢" : "🟡"}</span>
            <span>
              {sdkConnected 
                ? "Connected to OpenCode SDK - Real AI agents are executing tasks"
                : "Demo Mode - SDK not connected, using simulated execution"
              }
            </span>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Task List */}
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Tasks</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {status.tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Execution Logs */}
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Execution Log</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-950 rounded-lg p-3">
              {logs.map(log => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          </div>
        </div>

        {/* Completion Message */}
        {status.isComplete && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Execution Complete!</h2>
            <p className="text-gray-400 mb-6">
              {status.completedTasks} of {status.totalTasks} tasks completed successfully
              {status.failedTasks > 0 && ` (${status.failedTasks} failed)`}
            </p>
            <button
              onClick={onComplete}
              className="px-8 py-4 rounded-xl bg-blue-600 text-white text-lg font-semibold 
                         hover:bg-blue-700 transition-all transform hover:scale-105 
                         shadow-lg shadow-blue-500/25"
            >
              Preview Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveExecutionStage
