/**
 * Stage 2: AI Planning
 * Shows AI analysis and execution plan preview
 */

import { useState, useEffect } from "react"
import { 
  fetchAvailableModels, 
  checkSDKConnection, 
  analyzeAndPlanWithSDK,
  generateFallbackPlan 
} from "../services/execution"

// Fallback models when SDK is not available
const DEFAULT_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", providerId: "openai", providerName: "OpenAI", tier: "standard", available: true },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", providerId: "openai", providerName: "OpenAI", tier: "fast", available: true },
  { id: "claude-opus", name: "Claude Opus", providerId: "anthropic", providerName: "Anthropic", tier: "premium", available: true },
  { id: "claude-sonnet", name: "Claude Sonnet", providerId: "anthropic", providerName: "Anthropic", tier: "standard", available: true },
  { id: "claude-haiku", name: "Claude Haiku", providerId: "anthropic", providerName: "Anthropic", tier: "fast", available: true },
]

const LOADING_MESSAGES = [
  "Connecting to AI planning service...",
  "Analyzing your project requirements...",
  "Breaking down into features...",
  "Designing the architecture...",
  "Creating task dependencies...",
  "Assigning optimal AI models...",
  "Estimating time and cost...",
  "Finalizing execution plan..."
]

/**
 * Analyze project idea and generate execution plan
 * Uses real SDK when available, falls back to heuristic planning
 */
async function analyzeAndPlan(idea, isSDKConnected) {
  if (isSDKConnected) {
    // Use real AI-powered planning via OpenCode SDK
    return await analyzeAndPlanWithSDK(idea)
  } else {
    // Use fallback heuristic-based planning
    // Add small delay to simulate processing for better UX
    await new Promise(resolve => setTimeout(resolve, 1500))
    return generateFallbackPlan(idea)
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

/**
 * Strip time estimates from task/phase names
 * Removes patterns like "(4 Weeks)", "(2-3 Days)", "(30 min)", etc.
 */
function stripTimeEstimate(name) {
  if (!name) return name
  // Remove patterns like (X weeks), (X-Y days), (X min), (X hours), (X-Y hours), etc.
  return name
    .replace(/\s*\([^)]*(?:week|day|hour|minute|min|hr|wk|mo|month)[s]?\)/gi, '')
    .replace(/\s*\(\d+[-–]?\d*\s*(?:week|day|hour|minute|min|hr|wk|mo|month)[s]?\)/gi, '')
    .replace(/\s*-\s*(?:\d+[-–]?\d*\s*(?:week|day|hour|minute|min|hr|wk|mo|month)[s]?)$/gi, '')
    .trim()
}

// Generate default prompt for a task - Enhanced with production-ready requirements
function generateDefaultPrompt(task, projectDescription) {
  return `## Task: ${task.name}

${task.description}

### Context
This task is part of a larger project:
${projectDescription}

## CRITICAL REQUIREMENTS - READ CAREFULLY

### ⚠️ ABSOLUTE REQUIREMENTS (MUST FOLLOW):
1. **COMPLETE IMPLEMENTATION ONLY** - Every function, method, and component MUST be fully implemented
2. **NO STUBS OR PLACEHOLDERS** - NEVER write stub functions, TODO comments, or placeholder code
3. **NO PARTIAL IMPLEMENTATIONS** - Do not leave any functionality unimplemented
4. **PRODUCTION-READY CODE** - All code must be ready for immediate deployment
5. **WORKING CODE ONLY** - Every line of code must actually work

### 🚫 EXPLICITLY FORBIDDEN:
- "// TODO: implement this"
- "throw new Error('Not implemented')"
- "pass  # placeholder"
- Empty function bodies
- Functions that just log "not implemented"
- Returning mock data when real implementation is needed
- Comments like "implement later", "add logic here"

### ✅ REQUIRED IN ALL CODE:
- Complete error handling with try/catch
- Input validation with clear error messages
- Edge case handling (null, undefined, empty arrays)
- Type safety (TypeScript types or JSDoc)
- Clear comments for complex logic
- Security considerations (never expose secrets)

### Expected Output
Complete, working, production-ready implementation with:
- All necessary imports
- All functions fully implemented (no stubs)
- Comprehensive error handling
- Ready to copy-paste and run immediately

Remember: If you cannot fully implement something, explain why and provide the closest complete alternative. NEVER leave placeholder code.`
}

// Model Selector Dropdown
function ModelSelector({ value, onChange, disabled, availableModels, recommendedModel }) {
  const models = availableModels.length > 0 ? availableModels : DEFAULT_MODELS
  const isRecommendedUnavailable = recommendedModel && 
    !models.some(m => m.id === recommendedModel && m.available)

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-2 py-1 rounded text-xs bg-gray-700 border border-gray-600 
                   text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                   disabled:opacity-50 cursor-pointer"
      >
        {models.map((model) => (
          <option 
            key={model.id} 
            value={model.id}
            disabled={!model.available}
          >
            {model.providerName || model.providerId || "Unknown"} - {model.name} {!model.available ? "(unavailable)" : ""}
          </option>
        ))}
      </select>
      {isRecommendedUnavailable && (
        <span className="text-xs text-yellow-400" title="Recommended model not available">
          ⚠️
        </span>
      )}
    </div>
  )
}

// Prompt Editor Modal
function PromptEditorModal({ task, prompt, defaultPrompt, onSave, onClose }) {
  const [editedPrompt, setEditedPrompt] = useState(prompt)
  const isModified = editedPrompt !== defaultPrompt

  const handleReset = () => {
    setEditedPrompt(defaultPrompt)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[80vh] bg-gray-900 rounded-xl border border-gray-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">Edit Prompt</h3>
            <p className="text-sm text-gray-400">{task.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="w-full h-full min-h-[300px] p-4 rounded-lg bg-gray-800 border border-gray-600
                       text-white font-mono text-sm resize-none
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter the prompt for this task..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {editedPrompt.length} characters
            </span>
            {isModified && (
              <span className="text-xs text-yellow-400">• Modified</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 
                         transition-colors text-sm"
            >
              Reset to Default
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(editedPrompt)
                onClose()
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Save Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Configuration Panel (inline expandable)
function TaskConfigPanel({ task, config, defaultPrompt, onConfigChange, onEditPrompt, onDeleteTask, availableModels }) {
  const isModelModified = config.model !== task.model
  const isPromptModified = config.prompt !== defaultPrompt

  const handleResetModel = () => {
    onConfigChange({ ...config, model: task.model })
  }
  
  const handleDeleteTask = () => {
    if (window.confirm(`Are you sure you want to remove "${task.name}"? This cannot be undone.`)) {
      onDeleteTask(task.id)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-600 space-y-3">
      {/* Model Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">AI Model:</span>
          <ModelSelector
            value={config.model}
            onChange={(model) => onConfigChange({ ...config, model })}
            availableModels={availableModels}
            recommendedModel={task.model}
          />
          {isModelModified && (
            <button
              onClick={handleResetModel}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              title="Reset to AI recommendation"
            >
              ↺ Reset
            </button>
          )}
        </div>
        {isModelModified && (
          <span className="text-xs text-yellow-400">
            Changed from: {task.model}
          </span>
        )}
      </div>

      {/* Prompt Configuration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Prompt:</span>
          <button
            onClick={onEditPrompt}
            className="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 
                       text-white transition-colors flex items-center gap-1"
          >
            ✏️ Edit Prompt
          </button>
          {isPromptModified && (
            <span className="text-xs text-yellow-400">• Customized</span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {config.prompt.length} chars
        </span>
      </div>
      
      {/* Delete Task Button */}
      <div className="flex items-center justify-end pt-2 border-t border-gray-700">
        <button
          onClick={handleDeleteTask}
          className="px-3 py-1.5 rounded text-xs bg-red-900/50 hover:bg-red-800 
                     text-red-300 hover:text-red-100 transition-colors flex items-center gap-1
                     border border-red-800/50 hover:border-red-700"
        >
          🗑️ Remove Task
        </button>
      </div>
    </div>
  )
}

export function AIPlanningStage({ idea, onApprove, onBack }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
  const [expandedPhases, setExpandedPhases] = useState(new Set(["foundation"]))
  
  // Configuration state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [taskConfigs, setTaskConfigs] = useState({})
  const [expandedConfigs, setExpandedConfigs] = useState(new Set())
  const [editingPromptTask, setEditingPromptTask] = useState(null)
  
  // SDK models state
  const [availableModels, setAvailableModels] = useState([])
  const [sdkConnected, setSdkConnected] = useState(null)
  const [modelWarnings, setModelWarnings] = useState([])

  // Fetch available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const isConnected = await checkSDKConnection()
        setSdkConnected(isConnected)
        
        if (isConnected) {
          const models = await fetchAvailableModels()
          setAvailableModels(models)
        } else {
          setAvailableModels(DEFAULT_MODELS)
        }
      } catch (err) {
        console.error("[AIPlanningStage] Failed to load models:", err)
        setSdkConnected(false)
        setAvailableModels(DEFAULT_MODELS)
      }
    }
    loadModels()
  }, [])

  // Check for model warnings when plan and models are loaded
  useEffect(() => {
    if (plan && availableModels.length > 0) {
      const warnings = []
      const availableIds = new Set(availableModels.filter(m => m.available).map(m => m.id))
      
      plan.tasks.forEach(task => {
        // Normalize model name for checking
        const normalizedModel = task.model.toLowerCase().replace(/-/g, "")
        const isAvailable = availableModels.some(m => {
          const normalizedId = m.id.toLowerCase().replace(/-/g, "")
          return normalizedId.includes(normalizedModel) || normalizedModel.includes(normalizedId)
        })
        
        if (!isAvailable) {
          warnings.push(`Task "${task.name}" uses model "${task.model}" which may not be available`)
        }
      })
      
      setModelWarnings(warnings)
    }
  }, [plan, availableModels])

  // Initialize task configs when plan is loaded
  useEffect(() => {
    if (plan) {
      const initialConfigs = {}
      plan.tasks.forEach(task => {
        const defaultPrompt = generateDefaultPrompt(task, idea)
        initialConfigs[task.id] = {
          model: task.model,
          prompt: defaultPrompt,
          defaultPrompt: defaultPrompt
        }
      })
      setTaskConfigs(initialConfigs)
    }
  }, [plan, idea])

  // Generate execution plan when SDK connection status is determined
  useEffect(() => {
    // Wait until we know the SDK connection status
    if (sdkConnected === null) return

    let messageIndex = 0
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[messageIndex])
    }, 2000)

    analyzeAndPlan(idea, sdkConnected)
      .then(result => {
        // Flatten tasks from phases
        result.tasks = result.phases.flatMap(p => p.tasks)
        setPlan(result)
      })
      .catch(err => {
        console.error("[AIPlanningStage] Planning failed:", err)
        setError(err.message || "An unexpected error occurred")
      })
      .finally(() => {
        clearInterval(messageInterval)
        setLoading(false)
      })

    return () => clearInterval(messageInterval)
  }, [idea, sdkConnected])

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

  const toggleTaskConfig = (taskId) => {
    setExpandedConfigs(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const updateTaskConfig = (taskId, newConfig) => {
    setTaskConfigs(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...newConfig }
    }))
  }

  const deleteTask = (taskId) => {
    if (!plan) return
    
    // Remove task from plan
    const updatedTasks = plan.tasks.filter(t => t.id !== taskId)
    const updatedPhases = plan.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.filter(t => t.id !== taskId)
    })).filter(phase => phase.tasks.length > 0) // Remove empty phases
    
    setPlan({
      ...plan,
      tasks: updatedTasks,
      phases: updatedPhases,
      totalEstimateMinutes: updatedTasks.reduce((sum, t) => sum + t.estimateMinutes, 0)
    })
    
    // Remove from configs
    setTaskConfigs(prev => {
      const next = { ...prev }
      delete next[taskId]
      return next
    })
    
    // Remove from expanded
    setExpandedConfigs(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  const resetAllConfigs = () => {
    if (plan) {
      const resetConfigs = {}
      plan.tasks.forEach(task => {
        const defaultPrompt = generateDefaultPrompt(task, idea)
        resetConfigs[task.id] = {
          model: task.model,
          prompt: defaultPrompt,
          defaultPrompt: defaultPrompt
        }
      })
      setTaskConfigs(resetConfigs)
      setExpandedConfigs(new Set())
    }
  }

  const getModifiedCount = () => {
    let count = 0
    plan?.tasks.forEach(task => {
      const config = taskConfigs[task.id]
      if (config) {
        if (config.model !== task.model) count++
        if (config.prompt !== config.defaultPrompt) count++
      }
    })
    return count
  }

  const handleApprove = () => {
    // Merge configurations into the plan before approving
    const configuredPlan = {
      ...plan,
      tasks: plan.tasks.map(task => ({
        ...task,
        model: taskConfigs[task.id]?.model || task.model,
        customPrompt: taskConfigs[task.id]?.prompt
      })),
      phases: plan.phases.map(phase => ({
        ...phase,
        tasks: phase.tasks.map(task => ({
          ...task,
          model: taskConfigs[task.id]?.model || task.model,
          customPrompt: taskConfigs[task.id]?.prompt
        }))
      }))
    }
    onApprove(configuredPlan)
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
              onClick={handleApprove}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Auto-Execution →
            </button>
          </div>
        </div>

        {/* Advanced Configuration Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showAdvanced 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>⚙️</span>
              <span>Advanced Configuration</span>
              <span className="text-sm">{showAdvanced ? "▼" : "▶"}</span>
            </button>
            {getModifiedCount() > 0 && (
              <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                {getModifiedCount()} modification{getModifiedCount() > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {showAdvanced && getModifiedCount() > 0 && (
            <button
              onClick={resetAllConfigs}
              className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white 
                         hover:bg-gray-800 transition-colors"
            >
              ↺ Reset All to Defaults
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700 text-sm text-gray-400">
            <p>
              <strong className="text-white">💡 Tip:</strong> Click the ⚙️ gear icon on any task to customize its AI model or edit the prompt. 
              Your customizations will be applied when you start execution.
            </p>
          </div>
        )}

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
                ? `Connected to OpenCode SDK - ${availableModels.filter(m => m.available).length} models available`
                : "Offline Mode - Using heuristic planning. Connect SDK for AI-powered planning."
              }
            </span>
          </div>
        )}

        {/* Model Warnings */}
        {modelWarnings.length > 0 && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-sm">
            <div className="flex items-center gap-2 text-yellow-400 font-medium mb-2">
              <span>⚠️</span>
              <span>Model Availability Warnings</span>
            </div>
            <ul className="list-disc list-inside text-yellow-300/80 space-y-1">
              {modelWarnings.slice(0, 3).map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
              {modelWarnings.length > 3 && (
                <li>...and {modelWarnings.length - 3} more</li>
              )}
            </ul>
            <p className="text-gray-400 mt-2 text-xs">
              Click "Advanced Configuration" to change models for affected tasks.
            </p>
          </div>
        )}

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
                    <div className="font-semibold text-white">{stripTimeEstimate(phase.name)}</div>
                    <div className="text-sm text-gray-400">{phase.tasks.length} tasks</div>
                  </div>
                </div>
                <span className="text-gray-400">
                  {expandedPhases.has(phase.id) ? "▼" : "▶"}
                </span>
              </button>

              {expandedPhases.has(phase.id) && (
                <div className="border-t border-gray-800 p-4 space-y-3">
                  {phase.tasks.map((task) => {
                    const config = taskConfigs[task.id]
                    const isConfigExpanded = expandedConfigs.has(task.id)
                    const isModelModified = config && config.model !== task.model
                    const isPromptModified = config && config.prompt !== config.defaultPrompt
                    const hasModifications = isModelModified || isPromptModified
                    
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg bg-gray-800/50 border transition-colors ${
                          hasModifications ? "border-yellow-500/50" : "border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{stripTimeEstimate(task.name)}</h4>
                            {hasModifications && (
                              <span className="text-xs text-yellow-400">• Configured</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${getComplexityColor(task.complexity)}`}>
                              {task.complexity}
                            </span>
                            {showAdvanced && config ? (
                              <ModelSelector
                                value={config.model}
                                onChange={(model) => updateTaskConfig(task.id, { model })}
                                availableModels={availableModels}
                                recommendedModel={task.model}
                              />
                            ) : (
                              <span className={`text-sm font-mono ${getModelColor(config?.model || task.model)}`}>
                                {config?.model || task.model}
                              </span>
                            )}
                            {showAdvanced && (
                              <button
                                onClick={() => toggleTaskConfig(task.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  isConfigExpanded 
                                    ? "bg-blue-600 text-white" 
                                    : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
                                }`}
                                title="Configure task"
                              >
                                ⚙️
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">{task.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Est. {formatDuration(task.estimateMinutes)}
                        </div>
                        
                        {/* Expandable Configuration Panel */}
                        {showAdvanced && isConfigExpanded && config && (
                          <TaskConfigPanel
                            task={task}
                            config={config}
                            defaultPrompt={config.defaultPrompt}
                            availableModels={availableModels}
                            onConfigChange={(newConfig) => updateTaskConfig(task.id, newConfig)}
                            onEditPrompt={() => setEditingPromptTask(task)}
                            onDeleteTask={deleteTask}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Action */}
        <div className="flex justify-center pt-8">
          <button
            onClick={handleApprove}
            className="px-10 py-4 rounded-xl bg-blue-600 text-white text-lg font-semibold 
                       hover:bg-blue-700 transition-all transform hover:scale-105 
                       shadow-lg shadow-blue-500/25"
          >
            🚀 Start Auto-Execution
          </button>
        </div>
      </div>

      {/* Prompt Editor Modal */}
      {editingPromptTask && taskConfigs[editingPromptTask.id] && (
        <PromptEditorModal
          task={editingPromptTask}
          prompt={taskConfigs[editingPromptTask.id].prompt}
          defaultPrompt={taskConfigs[editingPromptTask.id].defaultPrompt}
          onSave={(newPrompt) => updateTaskConfig(editingPromptTask.id, { prompt: newPrompt })}
          onClose={() => setEditingPromptTask(null)}
        />
      )}
    </div>
  )
}

export default AIPlanningStage
