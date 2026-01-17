/**
 * Stage 3: Live Execution Dashboard
 * Real-time monitoring of parallel task execution
 */

import { useState, useEffect, useCallback } from "react"

// Mock execution service
function createExecutionSimulator(plan, onUpdate) {
  let running = true
  let paused = false
  const taskStates = new Map()
  
  // Initialize all tasks as queued
  plan.tasks.forEach(task => {
    taskStates.set(task.id, { status: "queued", progress: 0 })
  })

  const getStatus = () => {
    const completed = [...taskStates.values()].filter(t => t.status === "completed").length
    const failed = [...taskStates.values()].filter(t => t.status === "failed").length
    const running = [...taskStates.values()].filter(t => t.status === "running").length
    const queued = [...taskStates.values()].filter(t => t.status === "queued").length

    return {
      totalTasks: plan.tasks.length,
      completedTasks: completed,
      failedTasks: failed,
      runningTasks: running,
      queuedTasks: queued,
      progressPercentage: Math.round((completed / plan.tasks.length) * 100),
      isComplete: completed + failed === plan.tasks.length,
      tasks: plan.tasks.map(t => ({
        ...t,
        ...taskStates.get(t.id)
      }))
    }
  }

  const simulate = async () => {
    for (const task of plan.tasks) {
      if (!running) break
      
      while (paused) {
        await new Promise(r => setTimeout(r, 100))
        if (!running) break
      }
      
      // Start task
      taskStates.set(task.id, { status: "running", progress: 0 })
      onUpdate(getStatus(), { type: "task_started", taskId: task.id })

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        if (!running) break
        while (paused) {
          await new Promise(r => setTimeout(r, 100))
          if (!running) break
        }
        
        taskStates.set(task.id, { status: "running", progress })
        onUpdate(getStatus(), null)
        await new Promise(r => setTimeout(r, 200))
      }

      // Complete task (90% success rate for demo)
      const success = Math.random() > 0.1
      taskStates.set(task.id, { 
        status: success ? "completed" : "failed", 
        progress: 100 
      })
      onUpdate(getStatus(), { 
        type: success ? "task_completed" : "task_failed", 
        taskId: task.id 
      })
    }

    onUpdate(getStatus(), { type: "execution_completed" })
  }

  // Start simulation
  simulate()

  return {
    pause: () => { paused = true },
    resume: () => { paused = false },
    cancel: () => { running = false },
    isPaused: () => paused,
    getStatus
  }
}

function TaskCard({ task }) {
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
        <span className="text-sm text-gray-400 font-mono">{task.model}</span>
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
      <span className="text-gray-600">[{time}]</span>
      <span>{getLogIcon(log.type)}</span>
      <span>{log.message}</span>
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
    tasks: plan.tasks.map(t => ({ ...t, status: "queued", progress: 0 }))
  })
  const [logs, setLogs] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const [executor, setExecutor] = useState(null)

  const addLog = useCallback((type, message) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      message
    }])
  }, [])

  useEffect(() => {
    addLog("info", "Starting execution...")

    const exec = createExecutionSimulator(plan, (newStatus, event) => {
      setStatus(newStatus)
      
      if (event) {
        switch (event.type) {
          case "task_started":
            addLog("info", `Started: ${event.taskId}`)
            break
          case "task_completed":
            addLog("success", `Completed: ${event.taskId}`)
            break
          case "task_failed":
            addLog("error", `Failed: ${event.taskId}`)
            break
          case "execution_completed":
            addLog("success", "All tasks completed!")
            break
        }
      }
    })

    setExecutor(exec)

    return () => {
      exec.cancel()
    }
  }, [plan, addLog])

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
      addLog("warning", "Execution cancelled")
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
        <div className="grid grid-cols-5 gap-4">
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
        </div>

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
              Start Another Project →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveExecutionStage
