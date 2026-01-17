/**
 * Stage 2: AI Planning
 * Shows AI analysis and execution plan preview
 */

import { useState, useEffect } from "react"

const LOADING_MESSAGES = [
  "Analyzing your project requirements...",
  "Breaking down into features...",
  "Designing the architecture...",
  "Creating task dependencies...",
  "Assigning optimal AI models...",
  "Estimating time and cost...",
  "Finalizing execution plan..."
]

// Mock AI planner for demonstration
async function analyzeAndPlan(idea) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Generate a mock plan based on the idea
  const words = idea.split(" ")
  const projectName = words.slice(0, 3).join(" ") + " Project"
  
  return {
    projectName,
    description: idea,
    phases: [
      {
        id: "foundation",
        name: "Foundation",
        tasks: [
          { id: "t1", name: "Project Setup", complexity: "simple", model: "gpt-4o-mini", estimateMinutes: 5, description: "Initialize project structure and dependencies" },
          { id: "t2", name: "Core Architecture", complexity: "medium", model: "claude-sonnet", estimateMinutes: 15, description: "Design and implement core system architecture" },
        ]
      },
      {
        id: "core",
        name: "Core Features",
        tasks: [
          { id: "t3", name: "Main Feature Implementation", complexity: "complex", model: "claude-sonnet", estimateMinutes: 30, description: "Implement primary functionality" },
          { id: "t4", name: "Data Layer", complexity: "medium", model: "gpt-4o", estimateMinutes: 20, description: "Set up database models and data access" },
        ]
      },
      {
        id: "polish",
        name: "Polish & Testing",
        tasks: [
          { id: "t5", name: "Error Handling", complexity: "simple", model: "gpt-4o-mini", estimateMinutes: 10, description: "Add comprehensive error handling" },
          { id: "t6", name: "Testing", complexity: "medium", model: "claude-sonnet", estimateMinutes: 20, description: "Write unit and integration tests" },
        ]
      }
    ],
    tasks: [],
    totalEstimateMinutes: 100,
    estimatedCost: 0.85
  }
}

function getComplexityColor(complexity) {
  switch (complexity) {
    case "trivial": return "bg-green-500/20 text-green-400"
    case "simple": return "bg-blue-500/20 text-blue-400"
    case "medium": return "bg-yellow-500/20 text-yellow-400"
    case "complex": return "bg-orange-500/20 text-orange-400"
    case "expert": return "bg-red-500/20 text-red-400"
    default: return "bg-gray-500/20 text-gray-400"
  }
}

function getModelColor(model) {
  if (model.includes("opus")) return "text-purple-400"
  if (model.includes("gpt-4o") && !model.includes("mini")) return "text-green-400"
  if (model.includes("sonnet")) return "text-blue-400"
  return "text-gray-400"
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function AIPlanningStage({ idea, onApprove, onBack }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [expandedPhases, setExpandedPhases] = useState(new Set(["foundation"]))

  useEffect(() => {
    let messageIndex = 0
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[messageIndex])
    }, 2000)

    analyzeAndPlan(idea)
      .then(result => {
        // Flatten tasks from phases
        result.tasks = result.phases.flatMap(p => p.tasks)
        setPlan(result)
      })
      .catch(err => {
        setError(err.message || "An unexpected error occurred")
      })
      .finally(() => {
        clearInterval(messageInterval)
        setLoading(false)
      })

    return () => clearInterval(messageInterval)
  }, [idea])

  const togglePhase = (phase) => {
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

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 
                          border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl animate-pulse">🧠</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            AI is analyzing your project
          </h2>
          <p className="text-lg text-gray-400 animate-pulse">
            {loadingMessage}
          </p>
        </div>
        <div className="max-w-md w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full animate-pulse"
            style={{ width: "60%" }} 
          />
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
          <span className="text-4xl">❌</span>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            Failed to generate plan
          </h2>
          <p className="text-gray-400 max-w-md">
            {error}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            ← Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Try Again →
          </button>
        </div>
      </div>
    )
  }

  // Plan Preview
  if (!plan) return null

  return (
    <div className="min-h-[80vh] p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {plan.projectName}
            </h1>
            <p className="text-gray-400 mt-1">
              Execution plan generated successfully
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              ← Edit Idea
            </button>
            <button
              onClick={() => onApprove(plan)}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Auto-Execution →
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Total Tasks</div>
            <div className="text-2xl font-bold text-white">
              {plan.tasks.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Estimated Time</div>
            <div className="text-2xl font-bold text-white">
              {formatDuration(plan.totalEstimateMinutes)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Estimated Cost</div>
            <div className="text-2xl font-bold text-green-400">
              ${plan.estimatedCost.toFixed(2)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-sm text-gray-400">Phases</div>
            <div className="text-2xl font-bold text-white">
              {plan.phases.length}
            </div>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Execution Phases</h2>
          
          {plan.phases.map((phase, phaseIndex) => (
            <div key={phase.id} className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {phaseIndex + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">{phase.name}</div>
                    <div className="text-sm text-gray-400">{phase.tasks.length} tasks</div>
                  </div>
                </div>
                <span className="text-gray-400">
                  {expandedPhases.has(phase.id) ? "▼" : "▶"}
                </span>
              </button>

              {expandedPhases.has(phase.id) && (
                <div className="border-t border-gray-800 p-4 space-y-3">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{task.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${getComplexityColor(task.complexity)}`}>
                            {task.complexity}
                          </span>
                          <span className={`text-sm font-mono ${getModelColor(task.model)}`}>
                            {task.model}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">{task.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        Est. {formatDuration(task.estimateMinutes)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Action */}
        <div className="flex justify-center pt-8">
          <button
            onClick={() => onApprove(plan)}
            className="px-10 py-4 rounded-xl bg-blue-600 text-white text-lg font-semibold 
                       hover:bg-blue-700 transition-all transform hover:scale-105 
                       shadow-lg shadow-blue-500/25"
          >
            🚀 Start Auto-Execution
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIPlanningStage
