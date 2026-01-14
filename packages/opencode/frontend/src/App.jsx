import { useCallback, useEffect, useMemo, useRef, useState } from "react"

function Sidebar({ isOpen, onToggle, activeView, onViewChange, onNewTask }) {
  const navItems = [
    { id: "showcase", label: "Auto Interface", icon: "🧠", description: "Try intelligent task analysis" },
    { id: "workspace", label: "Workspace", icon: "💼", description: "Active tasks and sessions" },
    { id: "projects", label: "Projects", icon: "🗂️", description: "Worktrees and file explorer" },
    { id: "insights", label: "Insights", icon: "💬", description: "Chat sessions and analysis" },
    { id: "integrations", label: "Integrations", icon: "🔗", description: "GitHub, GitLab, Linear" },
    { id: "kanban", label: "Kanban", icon: "📌", description: "Track work in progress" },
    { id: "roadmap", label: "Roadmap", icon: "🗺️", description: "Plan releases and milestones" },
    { id: "ideation", label: "Ideation", icon: "💡", description: "Generate and triage ideas" },
    { id: "context", label: "Context", icon: "📁", description: "Project index and memories" },
    { id: "system", label: "System", icon: "🧩", description: "Status, limits, and updates" },
    { id: "agent-tools", label: "Agent Tools", icon: "🛠️", description: "Execution profiles and tools" },
  ]

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white z-40 transition-all duration-300 ${
        isOpen ? "w-72" : "w-16"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <div className="p-2 bg-blue-600 rounded-lg text-xl" role="img" aria-label="OpenCode Logo">
            🧠
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-lg">OpenCode</h1>
              <p className="text-xs text-gray-400">Auto Interface</p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="ml-auto text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1.5 transition-colors"
            aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isOpen ? "◀" : "▶"}
          </button>
        </div>

        {isOpen && (
          <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeView === item.id 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1" 
                    : "hover:bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
                aria-current={activeView === item.id ? "page" : undefined}
              >
                <span className={`text-xl transition-transform ${activeView === item.id ? "scale-110" : ""}`} aria-hidden="true">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${activeView === item.id ? "font-bold" : "font-medium"}`}>{item.label}</div>
                  <div className={`text-xs truncate ${activeView === item.id ? "text-blue-100" : "text-gray-500"}`}>{item.description}</div>
                </div>
              </button>
            ))}
          </nav>
        )}

        {isOpen && (
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button
              onClick={onNewTask}
              className="w-full gradient-bg text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🚀 New Task
            </button>
            <button className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              🔗 Share Codebase
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AutoInterfaceShowcase() {
  const [prompt, setPrompt] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const handleAnalyze = () => {
    if (!prompt.trim()) return

    setIsAnalyzing(true)

    setTimeout(() => {
      setAnalysis({
        taskType: "coding",
        complexity: "medium",
        confidence: 0.87,
        agent: "build",
        model: "claude-3-sonnet",
        reasoning:
          "This task involves creating new code, so the build agent is optimal. Sonnet balances speed with accuracy for medium complexity changes.",
      })
      setIsAnalyzing(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">🧠 Auto Task Analysis</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Describe a task and see the auto-routing decision, confidence, and execution plan.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <div className="space-y-4">
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700">
              Describe your task:
            </label>
            <textarea
              id="task-description"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder='e.g., "Add user authentication with JWT tokens" or "Explore codebase to understand architecture"'
              className="w-full h-32 p-3 border border-gray-300 rounded-lg mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleAnalyze}
              disabled={!prompt.trim() || isAnalyzing}
              className={`gradient-bg text-white px-6 py-3 rounded-lg font-medium transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !prompt.trim() || isAnalyzing ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
              }`}
            >
              {isAnalyzing ? "🔄 Analyzing..." : "🚀 Analyze Task"}
            </button>
          </div>

          {analysis && (
            <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900">🎯 Analysis Results</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2" aria-hidden="true">
                    📝
                  </div>
                  <div className="text-sm text-gray-600">Task Type</div>
                  <div className="font-bold text-blue-600 capitalize">{analysis.taskType}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2" aria-hidden="true">
                    📊
                  </div>
                  <div className="text-sm text-gray-600">Complexity</div>
                  <div className="font-bold text-purple-600 capitalize">{analysis.complexity}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2" aria-hidden="true">
                    🤖
                  </div>
                  <div className="text-sm text-gray-600">Agent</div>
                  <div className="font-bold text-green-600 capitalize">{analysis.agent}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2" aria-hidden="true">
                    🧠
                  </div>
                  <div className="text-sm text-gray-600">Model</div>
                  <div className="font-bold text-orange-600">{analysis.model}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Confidence Score</div>
                  <div className="text-lg font-bold text-green-600">{(analysis.confidence * 100).toFixed(1)}%</div>
                </div>
                <div
                  className="w-full bg-gray-200 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={analysis.confidence * 100}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">🧠 Reasoning</div>
                <p className="text-gray-600 text-sm">{analysis.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Workspace({ tasks, ideas, roadmap, memories, sessions, statusMap, onNewTask, onOpenInsights }) {
  const topTasks = tasks.slice(0, 4)
  const doneCount = tasks.filter((task) => task.status === "done").length
  const ideaCount = ideas.filter((idea) => idea.status === "active").length
  const progress = roadmap.features.length
    ? Math.round(
        (roadmap.features.filter((feature) => feature.status === "done").length / roadmap.features.length) * 100,
      )
    : 0
  const sessionList = sessions.slice(0, 4)
  const busyCount = sessions.filter((session) => statusMap?.[session.id]?.type === "busy").length
  const retryCount = sessions.filter((session) => statusMap?.[session.id]?.type === "retry").length
  const idleCount = sessions.filter((session) => (statusMap?.[session.id]?.type ?? "idle") === "idle").length
  const focus = roadmap.features.filter((feature) => feature.status !== "done").slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">💼 Workspace</h1>
        <p className="text-gray-600">Unified execution view across tasks, ideas, and context.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Active Tasks</h2>
            <button
              onClick={onNewTask}
              className="text-xs text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              New Task
            </button>
          </div>
          <div className="space-y-3">
            {topTasks.map((task) => (
              <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                <div className="text-xs text-gray-500">
                  {task.category ?? "General"} · {task.priority ?? "Normal"} · {task.status.replace("_", " ")}
                </div>
              </div>
            ))}
            {topTasks.length === 0 && <div className="text-sm text-gray-500">No tasks yet.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Execution Pulse</h2>
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-green-600">{doneCount}</div>
              <div className="text-sm text-gray-600">Tasks completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{ideaCount}</div>
              <div className="text-sm text-gray-600">Ideas in pipeline</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{progress}%</div>
              <div className="text-sm text-gray-600">Roadmap progress</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Session Activity</h2>
            <button
              onClick={onOpenInsights}
              className="text-xs text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Open Insights
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-gray-900">{busyCount}</div>
              <div className="text-xs text-gray-500">Busy</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-gray-900">{idleCount}</div>
              <div className="text-xs text-gray-500">Idle</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-gray-900">{retryCount}</div>
              <div className="text-xs text-gray-500">Retrying</div>
            </div>
          </div>
          <div className="space-y-2">
            {sessionList.map((session) => (
              <div key={session.id} className="text-sm text-gray-700">
                • {session.title}
              </div>
            ))}
            {sessionList.length === 0 && <div className="text-sm text-gray-500">No sessions yet.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Roadmap Focus</h2>
          <div className="space-y-3">
            {focus.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{feature.title}</span>
                <span className="text-xs text-gray-500">{feature.status.replace("_", " ")}</span>
              </div>
            ))}
            {focus.length === 0 && <div className="text-sm text-gray-500">No upcoming roadmap items.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Context Highlights</h2>
          <div className="space-y-3">
            {memories.slice(0, 4).map((item) => (
              <div key={item.id} className="text-sm text-gray-700">
                • {item.title}
              </div>
            ))}
            {memories.length === 0 && <div className="text-sm text-gray-500">No memories yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskWizard({ open, onClose, onSubmit }) {
  const steps = ["Details", "Classification", "Assignment"]
  const categories = ["General", "Feature", "Bug", "Refactor", "Research"]
  const priorities = ["Low", "Normal", "High", "Urgent"]
  const complexity = ["Simple", "Medium", "Complex"]

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState(categories[0])
  const [priority, setPriority] = useState(priorities[1])
  const [level, setLevel] = useState(complexity[1])
  const [owner, setOwner] = useState("")
  const [status, setStatus] = useState("backlog")
  const [estimate, setEstimate] = useState("")

  const reset = () => {
    setStep(0)
    setTitle("")
    setDescription("")
    setCategory(categories[0])
    setPriority(priorities[1])
    setLevel(complexity[1])
    setOwner("")
    setStatus("backlog")
    setEstimate("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleNext = () => {
    if (step === 0 && !title.trim()) return
    if (step < steps.length - 1) setStep((value) => value + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep((value) => value - 1)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      complexity: level,
      priority,
      owner: owner.trim(),
      status,
      estimate: estimate.trim(),
    })
    handleClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 id="wizard-title" className="text-xl font-bold">
              Create Task
            </h3>
            <p className="text-sm text-gray-500">
              Step {step + 1} of {steps.length}: {steps[step]}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <label htmlFor="wizard-title-input" className="sr-only">
              Task title
            </label>
            <input
              id="wizard-title-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="wizard-desc-input" className="sr-only">
              Description
            </label>
            <textarea
              id="wizard-desc-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the task"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm block">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm block">
              Complexity
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {complexity.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm block">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label htmlFor="wizard-owner" className="sr-only">
              Owner
            </label>
            <input
              id="wizard-owner"
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Owner"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="wizard-status" className="sr-only">
              Status
            </label>
            <select
              id="wizard-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <label htmlFor="wizard-estimate" className="sr-only">
              Estimate
            </label>
            <input
              id="wizard-estimate"
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              placeholder="Estimate"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back
          </button>
          <div className="flex items-center gap-2">
            {step < steps.length - 1 && (
              <button
                onClick={handleNext}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next
              </button>
            )}
            {step === steps.length - 1 && (
              <button
                onClick={handleSubmit}
                className="gradient-bg text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskEditDialog({ task, onClose, onSave }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [owner, setOwner] = useState("")
  const [status, setStatus] = useState("backlog")
  const [category, setCategory] = useState("General")
  const [priority, setPriority] = useState("Normal")
  const [complexity, setComplexity] = useState("Medium")
  const [estimate, setEstimate] = useState("")

  useEffect(() => {
    if (!task) return
    setTitle(task.title ?? "")
    setDescription(task.description ?? "")
    setOwner(task.owner ?? "")
    setStatus(task.status ?? "backlog")
    setCategory(task.category ?? "General")
    setPriority(task.priority ?? "Normal")
    setComplexity(task.complexity ?? "Medium")
    setEstimate(task.estimate ?? "")
  }, [task])

  if (!task) return null

  const handleSave = async () => {
    await onSave(task.id, {
      title: title.trim(),
      description: description.trim(),
      owner: owner.trim(),
      status,
      category,
      priority,
      complexity,
      estimate: estimate.trim(),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="edit-task-title" className="text-xl font-bold">
            Edit Task
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label htmlFor="edit-title" className="sr-only">
            Task title
          </label>
          <input
            id="edit-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="edit-owner" className="sr-only">
            Owner
          </label>
          <input
            id="edit-owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Owner"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="edit-status" className="sr-only">
            Status
          </label>
          <select
            id="edit-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <label htmlFor="edit-category" className="sr-only">
            Category
          </label>
          <select
            id="edit-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="General">General</option>
            <option value="Feature">Feature</option>
            <option value="Bug">Bug</option>
            <option value="Refactor">Refactor</option>
            <option value="Research">Research</option>
          </select>
          <label htmlFor="edit-complexity" className="sr-only">
            Complexity
          </label>
          <select
            id="edit-complexity"
            value={complexity}
            onChange={(event) => setComplexity(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Simple">Simple</option>
            <option value="Medium">Medium</option>
            <option value="Complex">Complex</option>
          </select>
          <label htmlFor="edit-priority" className="sr-only">
            Priority
          </label>
          <select
            id="edit-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <label htmlFor="edit-estimate" className="sr-only">
            Estimate
          </label>
          <input
            id="edit-estimate"
            value={estimate}
            onChange={(event) => setEstimate(event.target.value)}
            placeholder="Estimate"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label htmlFor="edit-description" className="sr-only">
          Task description
        </label>
        <textarea
          id="edit-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Task description"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="gradient-bg text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function FileDrawer({ task, onClose, directory }) {
  const [path, setPath] = useState(".")
  const [items, setItems] = useState([])
  const [file, setFile] = useState(null)
  const [content, setContent] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Ref for focus management
  const drawerRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Focus trap and escape key handler
  useEffect(() => {
    if (!task) return

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    // Focus the drawer when opened
    if (drawerRef.current) {
      drawerRef.current.focus()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [task, onClose])

  useEffect(() => {
    if (!task) return
    setPath(".")
    setFile(null)
    setContent("")
    setError(null)
  }, [task])

  useEffect(() => {
    if (!task) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = new URL("/file", window.location.origin)
        url.searchParams.set("path", path)
        if (directory) url.searchParams.set("directory", directory)
        const response = await fetch(url.toString())
        
        if (!response.ok) {
           const err = await response.json().catch(() => ({}))
           let message = err.message || `Failed to list files: ${response.statusText}`
           
           // Strip stack trace if present in message (rare but possible in some dev servers)
           if (message.includes(" at ")) {
              message = message.split("\n")[0]
           }
           
           throw new Error(message)
        }
        
        const data = await response.json()
        setItems(data)
      } catch (e) {
        console.error("File load error:", e)
        setError(e.message)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [directory, path, task])

  const handleOpen = async (item) => {
    if (item.type === "directory") {
      setPath(item.path)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const url = new URL("/file/content", window.location.origin)
      url.searchParams.set("path", item.path)
      if (directory) url.searchParams.set("directory", directory)
      const response = await fetch(url.toString())
      
      if (!response.ok) {
         const err = await response.json().catch(() => ({}))
         let message = err.message || `Failed to read file: ${response.statusText}`
         
         // Strip stack trace if present
         if (message.includes(" at ")) {
            message = message.split("\n")[0]
         }
         
         throw new Error(message)
      }

      const data = await response.json()
      setFile(item)
      setContent(data.content?.slice(0, 4000) ?? "")
    } catch (e) {
      console.error("File content error:", e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateUp = () => {
     if (path === "." || path === "/") return
     
     // Normalize to avoid issues with trailing slashes
     const current = path.replace(/\/+$/, "")
     if (!current.includes("/")) {
       setPath(".")
       return
     }

     const parts = current.split("/")
     parts.pop()
     const parent = parts.length > 0 ? parts.join("/") : "."
     setPath(parent)
  }

  if (!task) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-drawer-title"
      ref={drawerRef}
      tabIndex="-1"
    >
      <div className="bg-white w-full max-w-3xl h-full shadow-xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 id="file-drawer-title" className="text-xl font-bold">
              Files for {task.title}
            </h3>
            <p className="text-xs text-gray-500">Browsing: {path}</p>
          </div>
          <button
            onClick={onClose}
            ref={closeButtonRef}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Close file browser"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr,1.5fr] gap-4 flex-1 overflow-hidden">
          <div className="border border-gray-200 rounded-lg p-3 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-semibold text-gray-700">Explorer</span>
               {path !== "." && (
                 <button 
                   onClick={handleNavigateUp}
                   className="text-xs text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                   aria-label="Go up one directory"
                 >
                   ⬆ Up
                 </button>
               )}
            </div>
            
            {loading && !items.length ? (
               <div className="text-sm text-gray-500 animate-pulse">Loading...</div>
            ) : (
              <div className="space-y-1" role="list" aria-label="File list">
                {items.map((item) => (
                  <button
                    key={item.absolute}
                    onClick={() => handleOpen(item)}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                       file?.absolute === item.absolute ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'hover:bg-gray-100'
                    }`}
                    role="listitem"
                    aria-current={file?.absolute === item.absolute ? "true" : undefined}
                  >
                    <span aria-hidden="true" className="flex-shrink-0">{item.type === "directory" ? "📁" : "📄"}</span> 
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
                {items.length === 0 && !loading && <div className="text-sm text-gray-500">No files found.</div>}
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-3 overflow-y-auto bg-gray-50">
            {!file && <div className="text-sm text-gray-500 h-full flex items-center justify-center">Select a file to preview.</div>}
            {file && (
              <div className="h-full flex flex-col">
                <div className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
                   <span className="truncate" title={file.path}>{file.name}</span>
                   <span className="text-xs text-gray-500 font-normal ml-2 flex-shrink-0">{file.path}</span>
                </div>
                {loading ? (
                   <div className="text-sm text-gray-500 animate-pulse">Loading content...</div>
                ) : (
                   <pre className="text-xs whitespace-pre-wrap text-gray-700 font-mono flex-1 overflow-auto" tabIndex="0" aria-label={`Content of ${file.name}`}>
                     {content}
                   </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Kanban({ tasks, onCreate, onMove, onEdit, onFiles, onWizard }) {
  const columns = [
    { id: "backlog", label: "Backlog" },
    { id: "in_progress", label: "In Progress" },
    { id: "review", label: "Review" },
    { id: "done", label: "Done" },
  ]

  const [title, setTitle] = useState("")
  const [owner, setOwner] = useState("")
  const [status, setStatus] = useState("backlog")

  const handleAdd = async () => {
    if (!title.trim()) return
    await onCreate({ title: title.trim(), owner: owner.trim(), status })
    setTitle("")
    setOwner("")
    setStatus("backlog")
  }

  const handleMove = async (taskId, direction) => {
    const order = columns.map((col) => col.id)
    const task = tasks.find((entry) => entry.id === taskId)
    if (!task) return
    const current = order.indexOf(task.status)
    const nextIndex = direction === "forward" ? Math.min(current + 1, order.length - 1) : Math.max(current - 1, 0)
    const nextStatus = order[nextIndex]
    await onMove(taskId, nextStatus)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📌 Kanban Board</h2>
          <p className="text-gray-600">Track execution progress across agents and tasks.</p>
        </div>
        <button
          onClick={onWizard}
          className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Open Task Wizard
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label htmlFor="task-title" className="sr-only">
            Task title
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="task-owner" className="sr-only">
            Owner
          </label>
          <input
            id="task-owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Owner"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="task-status" className="sr-only">
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="gradient-bg text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((col) => (
          <div key={col.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{col.label}</h3>
              <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full font-medium">
                {tasks.filter((task) => task.status === col.id).length}
              </span>
            </div>
            <div className="space-y-3" role="list" aria-label={`${col.label} tasks`}>
              {tasks
                .filter((task) => task.status === col.id)
                .map((task) => (
                  <div
                    key={task.id}
                    role="listitem"
                    className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm space-y-2 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          {task.category ?? "General"}
                        </span>
                        <span>·</span>
                        <span>{task.priority ?? "Normal"}</span>
                        <span>·</span>
                        <span>{task.complexity ?? "Medium"}</span>
                      </div>
                    </div>
                    {task.owner && <div className="text-xs text-gray-500">Owner: {task.owner}</div>}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleMove(task.id, "back")}
                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Move task backward"
                        title="Move backward"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => handleMove(task.id, "forward")}
                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Move task forward"
                        title="Move forward"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => onEdit(task)}
                        className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onFiles(task)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Files
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


function RoadmapDetailDialog({ feature, onClose, onUpdate, onConvert }) {
  const [notes, setNotes] = useState(feature.notes || "")
  const [priority, setPriority] = useState(feature.priority || "Medium")
  const [impact, setImpact] = useState(feature.impact || "Medium")

  const handleSave = () => {
    onUpdate(feature.id, { notes, priority, impact })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Status</label>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                feature.status === "done"
                  ? "bg-green-100 text-green-700"
                  : feature.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {feature.status.replace("_", " ")}
            </span>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Phase</label>
            <span className="text-sm text-gray-900">{feature.phase}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Impact</label>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Notes / Rationale</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Add details about this feature..."
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => onConvert(feature.id)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            ⚡ Convert to Task
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Roadmap({ roadmap, onCreate, onUpdate, onConvert, onExport, onGenerate, onViewLogs, generating }) {
  const [activeTab, setActiveTab] = useState("phases")
  const [title, setTitle] = useState("")
  const [phase, setPhase] = useState(roadmap.phases[0] ?? "Foundation")
  const [priority, setPriority] = useState("Medium")
  const [withCompetitors, setWithCompetitors] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [detailFeature, setDetailFeature] = useState(null)

  const stats = useMemo(() => {
    const total = roadmap.features.length
    const done = roadmap.features.filter((f) => f.status === "done").length
    const high = roadmap.features.filter((f) => ["High", "Critical"].includes(f.priority)).length
    const progress = total ? Math.round((done / total) * 100) : 0
    return { total, done, high, progress }
  }, [roadmap.features])

  const handleAdd = async () => {
    if (!title.trim()) return
    await onCreate({ title: title.trim(), phase, priority, status: "planned" })
    setTitle("")
    setPhase(roadmap.phases[0] ?? "Foundation")
    setPriority("Medium")
  }

  const filteredFeatures = useMemo(() => {
    if (activeTab === "phases") return roadmap.features
    if (activeTab === "all") return roadmap.features
    if (activeTab === "kanban") return roadmap.features
    if (activeTab === "priority") {
      return [...roadmap.features].sort((a, b) => {
        const pMap = { Critical: 4, High: 3, Medium: 2, Low: 1 }
        return (pMap[b.priority] || 2) - (pMap[a.priority] || 2)
      })
    }
    return roadmap.features
  }, [roadmap.features, activeTab])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🗺️ Roadmap</h2>
          <p className="text-gray-600">Plan releases and translate ideas into milestones.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Progress</div>
            <div className="font-bold text-green-600">{stats.progress}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">High Prio</div>
            <div className="font-bold text-orange-600">{stats.high}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Features</div>
            <div className="font-bold text-gray-900">{stats.total}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200 pb-1">
        <div className="flex gap-4">
          {["phases", "all", "kanban", "priority"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGenOpen(true)}
            disabled={generating}
            className="text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            ✨ AI Plan
          </button>
          <button
            onClick={() => onExport("md")}
            className="text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="New feature title..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={phase}
            onChange={(event) => setPhase(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roadmap.phases.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["Low", "Medium", "High", "Critical"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="gradient-bg text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Add
          </button>
        </div>
      </div>

      {activeTab === "phases" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {roadmap.phases.map((item) => (
            <div key={item} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{item}</h3>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                  {filteredFeatures.filter((f) => f.phase === item).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredFeatures
                  .filter((feature) => feature.phase === item)
                  .map((feature) => (
                    <RoadmapCard
                      key={feature.id}
                      feature={feature}
                      onClick={() => setDetailFeature(feature)}
                      onUpdate={onUpdate}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {["planned", "in_progress", "done"].map((status) => (
            <div key={status} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 capitalize">{status.replace("_", " ")}</h3>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                  {filteredFeatures.filter((f) => f.status === status).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredFeatures
                  .filter((feature) => feature.status === status)
                  .map((feature) => (
                    <RoadmapCard
                      key={feature.id}
                      feature={feature}
                      onClick={() => setDetailFeature(feature)}
                      onUpdate={onUpdate}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(activeTab === "all" || activeTab === "priority") && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {filteredFeatures.map((feature, i) => (
            <div
              key={feature.id}
              onClick={() => setDetailFeature(feature)}
              className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                i !== filteredFeatures.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">{feature.title}</div>
                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                  <span>{feature.phase}</span>
                  <span>·</span>
                  <span
                    className={`${
                      feature.priority === "High" || feature.priority === "Critical"
                        ? "text-orange-600 font-medium"
                        : ""
                    }`}
                  >
                    {feature.priority || "Medium"}
                  </span>
                </div>
              </div>
              <StatusBadge status={feature.status} />
            </div>
          ))}
          {filteredFeatures.length === 0 && <div className="p-6 text-center text-gray-500">No features found.</div>}
        </div>
      )}

      {genOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generate Roadmap</h3>
            <p className="text-xs text-gray-500">
              Generate an AI-powered roadmap with phases, milestones, and optional competitor insights.
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={withCompetitors}
                onChange={(e) => setWithCompetitors(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Include competitor analysis
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setGenOpen(false)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onGenerate(withCompetitors)
                  setGenOpen(false)
                }}
                disabled={generating}
                className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailFeature && (
        <RoadmapDetailDialog
          feature={detailFeature}
          onClose={() => setDetailFeature(null)}
          onUpdate={onUpdate}
          onConvert={onConvert}
        />
      )}
    </div>
  )
}

function RoadmapCard({ feature, onClick, onUpdate }) {
  return (
    <div onClick={onClick} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm font-medium text-gray-900 leading-tight">{feature.title}</div>
        {feature.priority && (
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                feature.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                feature.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
            }`}>{feature.priority}</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2">
         <StatusBadge status={feature.status} />
         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
             {feature.status !== 'done' && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate(feature.id, { status: 'done' }) }}
                    className="text-xs p-1 text-green-600 hover:bg-green-50 rounded" title="Mark Done">
                    ✓
                 </button>
             )}
         </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    done: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    planned: "bg-gray-100 text-gray-700",
    backlog: "bg-gray-100 text-gray-500"
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${styles[status] || styles.planned}`}>
      {status?.replace("_", " ")}
    </span>
  )
}


function Ideation({ ideas, onCreate, onStatus, onConvert, onGenerate, onViewLogs, generating }) {
  const types = [
    {
      id: "code_improvements",
      label: "Code Improvements",
      hint: "Code-revealed opportunities from patterns, architecture, and infrastructure analysis",
    },
    {
      id: "ui_ux_improvements",
      label: "UI/UX Improvements",
      hint: "Visual and interaction improvements identified through app analysis",
    },
    {
      id: "documentation_gaps",
      label: "Documentation",
      hint: "Missing or outdated documentation that needs attention",
    },
    {
      id: "security_hardening",
      label: "Security",
      hint: "Security vulnerabilities and hardening opportunities",
    },
    {
      id: "performance_optimizations",
      label: "Performance",
      hint: "Performance bottlenecks and optimization opportunities",
    },
    {
      id: "code_quality",
      label: "Code Quality",
      hint: "Refactoring opportunities, code smells, and best practice violations",
    },
  ]

  const typeIDs = types.map((item) => item.id)
  const [title, setTitle] = useState("")
  const [type, setType] = useState(types[0].id)
  const [activeType, setActiveType] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState(typeIDs)
  const [genOpen, setGenOpen] = useState(false)
  const [maxIdeas, setMaxIdeas] = useState(12)
  const [search, setSearch] = useState("")

  const visible = useMemo(() => {
    let filtered = activeType === "all" ? ideas : ideas.filter((idea) => idea.type === activeType)
    filtered = filtered.filter((idea) => (showArchived ? true : idea.status !== "archived"))
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter((idea) => idea.title.toLowerCase().includes(q))
    }
    return filtered
  }, [activeType, ideas, showArchived, search])

  const handleAdd = async () => {
    if (!title.trim()) return
    await onCreate({ title: title.trim(), type, status: "active", impact: "medium" })
    setTitle("")
    setType(types[0].id)
  }

  const toggleType = (item) => {
    if (selectedTypes.includes(item)) {
      setSelectedTypes((types) => types.filter((type) => type !== item))
      return
    }
    setSelectedTypes((types) => [...types, item])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">💡 Ideation</h2>
          <p className="text-gray-600">Capture ideas, convert to tasks, and manage signals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
          <button
            onClick={() => setGenOpen(true)}
            disabled={generating}
            className={`text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              generating ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            {generating ? "Generating..." : "Generate Ideas"}
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              showArchived ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
            aria-pressed={showArchived}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,auto] gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Capture a new idea..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="gradient-bg text-white rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Idea
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Idea filters">
        <button
          role="tab"
          aria-selected={activeType === "all"}
          onClick={() => setActiveType("all")}
          className={`px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            activeType === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Ideas
        </button>
        {types.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeType === item.id}
            onClick={() => setActiveType(item.id)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeType === item.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" role="list">
        {visible.map((idea) => (
          <div
            key={idea.id}
            role="listitem"
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{idea.title}</div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span className="capitalize">{idea.type?.replace("_", " ")}</span>
                    <span>·</span>
                    <span className="capitalize">{idea.impact} Impact</span>
                  </div>
                  {idea.taskID && <div className="text-xs text-blue-600 mt-1 font-medium">Linked Task: {idea.taskID}</div>}
                </div>
                <IdeaStatusBadge status={idea.status} />
              </div>
              <div className="mt-2 text-xs text-gray-500 italic">
                {types.find((item) => item.id === idea.type)?.hint}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-2 border-t border-gray-100">
              {idea.status !== 'converted' && idea.status !== 'archived' && (
                 <button
                    onClick={() => onConvert(idea.id)}
                    className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
                 >
                    ⚡ Convert
                 </button>
              )}
              {idea.status === 'dismissed' ? (
                <button onClick={() => onStatus(idea.id, "active")} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">
                  Restore
                </button>
              ) : (
                <button onClick={() => onStatus(idea.id, "dismissed")} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">
                  Dismiss
                </button>
              )}
              <button
                onClick={() => onStatus(idea.id, idea.status === 'archived' ? 'active' : 'archived')}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
              >
                {idea.status === 'archived' ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          </div>
        ))}
        {visible.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No ideas found matching filters.</div>}
      </div>

      {genOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Generate Ideas</h3>
              <button
                onClick={() => setGenOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-600">Select idea types to generate.</div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              {types.map((item) => (
                <label key={item.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(item.id)}
                    onChange={() => toggleType(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div>
                 <label className="text-xs text-gray-500 block mb-1">Max ideas to generate</label>
                 <input
                    type="number"
                    value={maxIdeas}
                    onChange={(e) => setMaxIdeas(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                    min="1"
                    max="20"
                 />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setGenOpen(false)}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {generating && (
                <button
                  onClick={() => {
                    setGenOpen(false)
                    onViewLogs()
                  }}
                  className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  View Logs
                </button>
              )}
              <button
                onClick={async () => {
                  await onGenerate(selectedTypes, Number(maxIdeas))
                  setGenOpen(false)
                }}
                disabled={generating}
                className={`gradient-bg text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  generating ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                }`}
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IdeaStatusBadge({ status }) {
    const styles = {
        active: "bg-green-100 text-green-700",
        dismissed: "bg-gray-100 text-gray-500",
        converted: "bg-blue-100 text-blue-700",
        archived: "bg-gray-200 text-gray-600"
    }
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[status] || styles.active}`}>
            {status}
        </span>
    )
}

function Context({ memories, indexItems, onAddMemory, onSearchIndex, onSearchMemories }) {
  const [activeTab, setActiveTab] = useState("index")
  const [search, setSearch] = useState("")
  const [memorySearch, setMemorySearch] = useState("")
  const [memoryInput, setMemoryInput] = useState("")
  const [memoryTag, setMemoryTag] = useState("general")

  useEffect(() => {
    onSearchIndex(search)
  }, [onSearchIndex, search])

  useEffect(() => {
    onSearchMemories(memorySearch)
  }, [memorySearch, onSearchMemories])

  const handleAdd = async () => {
    if (!memoryInput.trim()) return
    await onAddMemory({ title: memoryInput.trim(), tag: memoryTag })
    setMemoryInput("")
    setMemoryTag("general")
  }

  // Helper to highlight matching text
  const highlight = (text, query) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-100 text-gray-900 font-medium">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📁 Context Manager</h2>
          <p className="text-gray-600">Browse indexed knowledge and team memory.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Indexed Items</div>
            <div className="font-bold text-gray-900">{indexItems.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Memories</div>
            <div className="font-bold text-blue-600">{memories.length}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200 pb-1">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("index")}
            className={`pb-2 text-sm font-medium capitalize transition-colors ${
              activeTab === "index"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Project Index
          </button>
          <button
            onClick={() => setActiveTab("memories")}
            className={`pb-2 text-sm font-medium capitalize transition-colors ${
              activeTab === "memories"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Memories
          </button>
        </div>
      </div>

      {activeTab === "index" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search project index..."
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => onSearchIndex(search)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indexItems.map((item) => (
              <div
                key={item}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <div>
                      <div className="font-medium text-gray-900 break-all">{highlight(item, search)}</div>
                      <div className="text-xs text-gray-500">Indexed file</div>
                    </div>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Ready
                  </span>
                </div>
              </div>
            ))}
            {indexItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                No indexed items found matching your search.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "memories" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,auto] gap-3">
              <input
                value={memoryInput}
                onChange={(event) => setMemoryInput(event.target.value)}
                placeholder="Add a new memory note..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <select
                value={memoryTag}
                onChange={(e) => setMemoryTag(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="architecture">Architecture</option>
                <option value="decision">Decision</option>
                <option value="convention">Convention</option>
                <option value="issue">Known Issue</option>
              </select>
              <button
                onClick={handleAdd}
                className="gradient-bg text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                Add Memory
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                value={memorySearch}
                onChange={(event) => setMemorySearch(event.target.value)}
                placeholder="Search memories..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {memories.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-gray-900">{highlight(item.title, memorySearch)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium capitalize">
                        {item.tag || "general"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {memories.length === 0 && (
              <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                No memories found. Start adding context to help the AI understand your project better.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Insights({
  sessions,
  statusMap,
  activeSession,
  messages,
  prompt,
  sending,
  models,
  agents,
  selectedAgent,
  selectedModel,
  onSelectSession,
  onCreateSession,
  onPromptChange,
  onSendPrompt,
  onSelectAgent,
  onSelectModel,
  onRenameSession,
  live,
  onToggleLive,
  onGenerateInsight,
  tasks,
  ideas,
  competitors,
  onRemoveCompetitor,
  onRefreshCompetitors,
  onCreateCompetitor,
}) {
  useEffect(() => {
    onRefreshCompetitors()
  }, [onRefreshCompetitors])
  const [dialog, setDialog] = useState(false)
  const [name, setName] = useState("")
  const [note, setNote] = useState("")
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTitle, setRenameTitle] = useState("")
  const [renameID, setRenameID] = useState("")

  const suggestions = useMemo(() => {
    const taskItems = tasks.slice(0, 3).map((task) => `Follow up on ${task.title}`)
    const ideaItems = ideas.slice(0, 2).map((idea) => `Evaluate idea: ${idea.title}`)
    return [...taskItems, ...ideaItems].slice(0, 5)
  }, [tasks, ideas])

  const quickPrompts = [
    "What is the architecture of this project?",
    "Suggest improvements for code quality",
    "What features could I add next?",
    "Are there any security concerns?",
  ]

  const choice = models.find((item) => item.key === selectedModel)
  const selectedText = choice ? `Model: ${choice.label}` : "Model: Default"

  const messageItems = messages.map((message) => {
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
    return {
      id: message.info.id,
      role: message.info.role,
      text,
    }
  })

  const handleSaveCompetitor = async () => {
    if (!name.trim()) return
    await onCreateCompetitor({ name: name.trim(), note: note.trim() })
    setName("")
    setNote("")
    setDialog(false)
  }

  const handleRename = async () => {
    if (!renameID) return
    if (!renameTitle.trim()) return
    await onRenameSession(renameID, renameTitle.trim())
    setRenameOpen(false)
    setRenameID("")
    setRenameTitle("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">💬 Insights Workspace</h2>
          <p className="text-gray-600">Multi-session chat, model selection, and competitive notes.</p>
        </div>
        <button
          onClick={() => onGenerateInsight("What is the architecture of this project?")}
          className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Generate Insights
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px,1fr,300px] gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Sessions</h3>
            <button
              onClick={onCreateSession}
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Create new session"
            >
              <span className="text-lg leading-none">+</span> New
            </button>
          </div>
          <div className="space-y-2" role="list" aria-label="Chat sessions">
            {sessions.map((session) => {
              const status = statusMap?.[session.id]?.type ?? "idle"
              const statusColor = status === "running" ? "bg-green-100 text-green-700" : status === "error" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
              return (
                <div
                  key={session.id}
                  role="listitem"
                  className={`flex items-center gap-2 w-full p-2 rounded-lg text-sm transition-colors ${
                    activeSession === session.id ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="flex-1 text-left focus:outline-none focus:underline"
                    aria-current={activeSession === session.id ? "true" : "false"}
                  >
                    <div className="font-medium text-gray-900 truncate">{session.title}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full ${statusColor}`}>{status}</span>
                    </div>
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      setRenameID(session.id)
                      setRenameTitle(session.title)
                      setRenameOpen(true)
                    }}
                    className="text-xs text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-1"
                    aria-label={`Rename session ${session.title}`}
                  >
                    Rename
                  </button>
                </div>
              )
            })}
            {sessions.length === 0 && <div className="text-xs text-gray-500 italic">No sessions yet.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div>
              <div className="text-sm font-semibold text-gray-900">Chat</div>
              <div className="text-xs text-gray-500">{selectedText}</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={onToggleLive}
                aria-pressed={live}
                className={`px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  live ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-400 hover:bg-gray-50"
                }`}
              >
                {live ? "Live" : "Paused"}
              </button>
              <div className="text-gray-400">Session: {activeSession ?? "None"}</div>
            </div>
          </div>
          {sendError && (
            <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2" role="alert">
              {sendError}
            </div>
          )}

          <div
            className="flex-1 overflow-y-auto space-y-3 min-h-0 p-2 scroll-smooth"
            role="log"
            aria-label="Chat history"
            aria-live="polite"
          >
            {messageItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg p-3 text-sm max-w-[90%] ${
                  item.role === "user" ? "bg-blue-50 ml-auto border border-blue-100" : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{item.role}</div>
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{item.text || "(no text)"}</div>
              </div>
            ))}
            {messageItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <span className="text-2xl">💬</span>
                <span className="text-sm">Start a conversation</span>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  onClick={() => onPromptChange(item)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {item}
                </button>
              ))}
            </div>
            <label htmlFor="chat-prompt" className="sr-only">
              Chat prompt
            </label>
            <textarea
              id="chat-prompt"
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Ask about your codebase..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (prompt.trim() && !sending && activeSession) onSendPrompt()
                }
              }}
            />
            <button
              onClick={onSendPrompt}
              disabled={!prompt.trim() || sending || !activeSession}
              className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !prompt.trim() || sending || !activeSession
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "gradient-bg text-white shadow-sm hover:opacity-90"
              }`}
            >
              {sending ? "Sending..." : "Send Prompt"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Execution Settings</h3>
            <div className="space-y-2">
              <label htmlFor="agent-select" className="text-xs text-gray-500 font-medium">
                Agent
              </label>
              <select
                id="agent-select"
                value={selectedAgent}
                onChange={(event) => onSelectAgent(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Default</option>
                {agents.map((agent) => (
                  <option key={agent.name} value={agent.name}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="model-select" className="text-xs text-gray-500 font-medium">
                Model
              </label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(event) => onSelectModel(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Default</option>
                {models.map((model) => (
                  <option key={model.key} value={model.key}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Competitor Analysis</h3>
              <button
                onClick={() => setDialog(true)}
                className="text-xs text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
              >
                Add
              </button>
            </div>
            <div className="space-y-3" role="list">
              {competitors.map((item) => (
                <div
                  key={item.id}
                  role="listitem"
                  className="text-sm text-gray-700 flex items-start justify-between gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.note || "No notes"}</div>
                  </div>
                  <button
                    onClick={() => onRemoveCompetitor(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500 focus:outline-none focus:text-red-500 p-1"
                    aria-label={`Remove competitor ${item.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {competitors.length === 0 && <div className="text-xs text-gray-500 italic">No competitor notes yet.</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Task Suggestions</h3>
            <div className="space-y-2" role="list">
              {suggestions.map((item, index) => (
                <div key={`${item}-${index}`} role="listitem" className="text-xs text-gray-600 flex items-start gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{item}</span>
                </div>
              ))}
              {suggestions.length === 0 && <div className="text-xs text-gray-500 italic">No suggestions yet.</div>}
            </div>
          </div>
        </div>
      </div>

      {dialog && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-competitor-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="add-competitor-title" className="text-lg font-semibold text-gray-900">
                Add Competitor
              </h3>
              <button
                onClick={() => setDialog(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-lg p-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <label htmlFor="comp-name" className="sr-only">
                Competitor name
              </label>
              <input
                id="comp-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Competitor name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="comp-notes" className="sr-only">
                Notes
              </label>
              <textarea
                id="comp-notes"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Notes"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDialog(false)}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCompetitor}
                className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {renameOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-session-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="rename-session-title" className="text-lg font-semibold text-gray-900">
                Rename Session
              </h3>
              <button
                onClick={() => setRenameOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-lg p-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <label htmlFor="session-title-input" className="sr-only">
              Session title
            </label>
            <input
              id="session-title-input"
              value={renameTitle}
              onChange={(event) => setRenameTitle(event.target.value)}
              placeholder="Session title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRenameOpen(false)}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectHub({
  projects,
  current,
  worktrees,
  files,
  filePath,
  pathInfo,
  directory,
  onRefreshProjects,
  onUpdateProject,
  onAddProject,
  onRefreshWorktrees,
  onCreateWorktree,
  onBrowse,
  onSetPath,
  onSelectProject,
}) {
  const tabs = ["projects", "worktrees", "files"]
  const [tab, setTab] = useState("projects")
  const [addOpen, setAddOpen] = useState(false)
  const [gitOpen, setGitOpen] = useState(false)
  const [dir, setDir] = useState("")
  const [name, setName] = useState("")
  const [edit, setEdit] = useState(null)
  const [editName, setEditName] = useState("")
  const [workOpen, setWorkOpen] = useState(false)
  const [workName, setWorkName] = useState("")
  const [workStart, setWorkStart] = useState("")
  const [focus, setFocus] = useState(null)
  const [preview, setPreview] = useState("")
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browseQuery, setBrowseQuery] = useState("")
  const [browseResults, setBrowseResults] = useState([])
  const [browseLoading, setBrowseLoading] = useState(false)

  useEffect(() => {
    if (tab === "projects") onRefreshProjects()
    if (tab === "worktrees") onRefreshWorktrees()
    if (tab === "files") onBrowse(filePath)
  }, [tab, filePath, onBrowse, onRefreshProjects, onRefreshWorktrees])

  useEffect(() => {
    if (!focus) return
    const load = async () => {
      const url = new URL("/file/content", window.location.origin)
      url.searchParams.set("path", focus.path)
      if (directory) url.searchParams.set("directory", directory)
      const response = await fetch(url.toString())
      const data = await response.json()
      setPreview(data.content?.slice(0, 4000) ?? "")
    }
    load()
  }, [directory, focus])

  useEffect(() => {
    if (!browseOpen) return
    if (!browseQuery.trim()) {
      setBrowseResults([])
      return
    }
    const timer = setTimeout(() => {
       const url = new URL("/find/file", window.location.origin)
       url.searchParams.set("query", browseQuery)
       url.searchParams.set("dirs", "true")
       url.searchParams.set("type", "directory")
       url.searchParams.set("limit", "25")
       if (directory) url.searchParams.set("directory", directory)
       setBrowseLoading(true)
       fetch(url.toString())

        .then((response) => response.json())
        .then((data) => {
          setBrowseResults(Array.isArray(data) ? data : [])
          setBrowseLoading(false)
        })
        .catch(() => {
          setBrowseResults([])
          setBrowseLoading(false)
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [browseOpen, browseQuery, directory])

  const handleAdd = async () => {
    if (!dir.trim()) return
    await onAddProject({ directory: dir.trim(), name: name.trim() })
    setDir("")
    setName("")
    setAddOpen(false)
  }

  const handleRename = async () => {
    if (!edit) return
    if (!editName.trim()) return
    await onUpdateProject(edit.id, { name: editName.trim() })
    setEdit(null)
    setEditName("")
  }

  const handleWorktree = async () => {
    await onCreateWorktree({ name: workName.trim(), startCommand: workStart.trim() })
    setWorkName("")
    setWorkStart("")
    setWorkOpen(false)
  }

  const root = pathInfo?.directory ?? "."
  const rootDir = pathInfo?.directory ?? ""
  const parts = filePath.split("/").filter(Boolean)
  const up = parts.length ? `/${parts.slice(0, -1).join("/")}` : root

  const ProjectCard = ({ project, active }) => (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 ${
        active ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100" : "bg-white border-gray-200 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            {project.name || "Untitled Project"}
            {active && (
              <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">
                Active
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 font-mono mt-1 break-all">{project.worktree}</p>
        </div>
        <div className="text-2xl opacity-20">🗂️</div>
      </div>
      
      <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
         <button
            onClick={() => onSelectProject(project)}
            disabled={active}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
               active 
                ? "bg-blue-100 text-blue-700 cursor-default" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            {active ? "Currently Open" : "Open Project"}
          </button>
          <button
            onClick={() => {
              setEdit(project)
              setEditName(project.name ?? "")
            }}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Rename
          </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🗂️ Projects & Worktrees</h2>
          <p className="text-gray-600">Manage projects, sandboxes, and file navigation.</p>
          <p className="text-xs text-gray-500 mt-1">Active directory: {directory || "current workspace"}</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === item ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === "projects" && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Available Projects</h3>
              <div className="flex gap-2">
                 <button
                  onClick={() => setGitOpen(true)}
                  className="text-sm px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Configure Git
                </button>
                <button
                  onClick={() => setAddOpen(true)}
                  className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
                >
                  + New Project
                </button>
              </div>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const active = current?.id === project.id || project.worktree === directory
              return <ProjectCard key={project.id} project={project} active={active} />
            })}
             {projects.length === 0 && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="text-4xl mb-3 opacity-20">📂</div>
                  <p className="text-gray-500 font-medium">No projects found</p>
                  <button 
                    onClick={() => setAddOpen(true)}
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    Add your first project
                  </button>
                </div>
             )}
          </div>
        </div>
      )}

      {tab === "worktrees" && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Active Worktrees</h3>
              <button
                onClick={() => setWorkOpen(true)}
                 className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
              >
                + Create Worktree
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worktrees.map((tree) => (
               <div key={tree} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">🌿</div>
                     <span className="font-mono text-sm text-gray-700">{tree}</span>
                  </div>
                   <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">Ready</div>
               </div>
            ))}
            {worktrees.length === 0 && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <p className="text-gray-500 italic">No active worktrees.</p>
                </div>
            )}
          </div>
          
           {workOpen && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                 <h4 className="font-bold text-gray-900 mb-4">Create New Worktree</h4>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">Branch Name</label>
                       <input
                          value={workName}
                          onChange={(e) => setWorkName(e.target.value)}
                          placeholder="e.g. feature/new-login"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">Start Point (Optional)</label>
                       <input
                          value={workStart}
                          onChange={(e) => setWorkStart(e.target.value)}
                          placeholder="e.g. main or commit hash"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                       <button
                          onClick={() => setWorkOpen(false)}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                       >
                          Cancel
                       </button>
                       <button
                          onClick={handleWorktree}
                           className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:opacity-90"
                       >
                          Create
                       </button>
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}

      {tab === "files" && (
        <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
           {/* File Browser Toolbar */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
             <div className="flex gap-1">
                <button
                  onClick={() => onSetPath(up)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                  title="Go Up"
                >
                  ⬆
                </button>
                <button
                  onClick={() => onBrowse(filePath)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                  title="Refresh"
                >
                  🔄
                </button>
             </div>
             
             <div className="flex-1 relative">
                <input
                   value={filePath}
                   onChange={(e) => onSetPath(e.target.value)}
                   className="w-full pl-8 pr-4 py-1.5 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-2.5 top-1.5 text-gray-400 text-sm">/</span>
             </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* File List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-2 bg-gray-50/50">
               {files.map((item) => (
                 <button
                   key={item.absolute}
                   onClick={() => {
                     if (item.type === "directory") onSetPath(item.path)
                     if (item.type === "file") setFocus(item)
                   }}
                   className={`w-full text-left text-sm px-3 py-2 rounded-md flex items-center gap-2 mb-1 transition-colors ${
                     focus?.absolute === item.absolute 
                       ? "bg-blue-100 text-blue-700 font-medium" 
                       : "hover:bg-gray-100 text-gray-700"
                   }`}
                 >
                   <span className="opacity-70">{item.type === "directory" ? "📁" : "📄"}</span>
                   <span className="truncate font-mono text-xs">{item.name}</span>
                 </button>
               ))}
               {files.length === 0 && (
                  <div className="text-sm text-gray-400 italic text-center py-8">Empty directory</div>
               )}
            </div>
            
            {/* Preview Pane */}
            <div className="flex-1 bg-white overflow-hidden flex flex-col">
               {focus ? (
                  <>
                     <div className="px-4 py-2 border-b border-gray-100 text-xs font-mono text-gray-500 bg-gray-50">
                        {focus.path}
                     </div>
                     <div className="flex-1 overflow-auto p-4">
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">{preview}</pre>
                     </div>
                  </>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300">
                     <span className="text-5xl mb-2">👁️</span>
                     <span className="text-sm font-medium">Select a file to preview</span>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

        {addOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Add Project</h3>
                <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Directory Path</label>
                    <div className="flex gap-2">
                       <input
                          value={dir}
                          onChange={(e) => setDir(e.target.value)}
                          placeholder="/path/to/project"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                       <button
                          onClick={() => {
                             setBrowseQuery(dir)
                             setBrowseOpen(true)
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
                       >
                          Browse
                       </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Project Name (Optional)</label>
                    <input
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       placeholder="My Awesome Project"
                       className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                 </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Add Project
                </button>
              </div>
            </div>
          </div>
        )}
        
        {browseOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Browse Directories</h3>
                <button onClick={() => setBrowseOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <input
                value={browseQuery}
                onChange={(e) => setBrowseQuery(e.target.value)}
                placeholder="Search paths..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-100">
                 {browseLoading && <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>}
                 
                 {!browseLoading && browseResults.map((item) => {
                    const path = item.path ?? item.absolute ?? item
                    return (
                       <button
                          key={path}
                          onClick={() => {
                             setDir(path)
                             setBrowseOpen(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-mono truncate"
                       >
                          📁 {path}
                       </button>
                    )
                 })}
                 
                 {!browseLoading && browseResults.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm italic">No directories found</div>
                 )}
              </div>
              
              <div className="flex justify-end">
                 <button
                    onClick={() => setBrowseOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                 >
                    Close
                 </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Modal (Rename) */}
        {edit && (
           <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
                 <h3 className="text-lg font-bold text-gray-900">Rename Project</h3>
                 <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 <div className="flex justify-end gap-2">
                    <button
                       onClick={() => setEdit(null)}
                       className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                    >
                       Cancel
                    </button>
                    <button
                       onClick={handleRename}
                       className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                       Save
                    </button>
                 </div>
              </div>
           </div>
        )}
        
        {gitOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Git Setup</h3>
                <button onClick={() => setGitOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs font-bold text-gray-700 uppercase mb-2">Initialize Repo</div>
                    <code className="text-xs font-mono bg-white p-2 rounded block border border-gray-200">git init</code>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs font-bold text-gray-700 uppercase mb-2">Add OpenCode Marker</div>
                    <code className="text-xs font-mono bg-white p-2 rounded block border border-gray-200 overflow-x-auto">
                       echo $(git rev-list --max-parents=0 --all | head -n1) &gt; .git/opencode
                    </code>
                 </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

function Integrations({
  github,
  gitlab,
  linear,
  config,
  onUpdateConfig,
  onSyncGitHub,
  onSyncGitLab,
  onSyncLinear,
  onAddGitHub,
  onRemoveGitHub,
  onAddGitLab,
  onRemoveGitLab,
  onAddLinear,
  onRemoveLinear,
}) {
  const tabs = ["github", "gitlab", "linear"]
  const [tab, setTab] = useState("github")
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("")
  const [url, setUrl] = useState("")
  const [repo, setRepo] = useState("")
  const [kind, setKind] = useState("issue")
  const [team, setTeam] = useState("")
  const [ghToken, setGhToken] = useState("")
  const [ghRepo, setGhRepo] = useState("")
  const [glToken, setGlToken] = useState("")
  const [glHost, setGlHost] = useState("")
  const [glProject, setGlProject] = useState("")
  const [linToken, setLinToken] = useState("")
  const [linTeam, setLinTeam] = useState("")

  useEffect(() => {
    setGhToken(config.github?.token ?? "")
    setGhRepo(config.github?.repo ?? "")
    setGlToken(config.gitlab?.token ?? "")
    setGlHost(config.gitlab?.host ?? "")
    setGlProject(config.gitlab?.project ?? "")
    setLinToken(config.linear?.token ?? "")
    setLinTeam(config.linear?.team ?? "")
  }, [config])

  useEffect(() => {
    if (tab === "github" && kind === "merge") setKind("issue")
    if (tab === "gitlab" && kind === "pull") setKind("issue")
    if (tab === "linear") setKind("issue")
  }, [kind, tab])

  const handleAdd = async () => {
    if (!title.trim()) return
    if (tab === "github") {
      await onAddGitHub({ title: title.trim(), status: status.trim(), url: url.trim(), repo: repo.trim(), kind })
      setTitle("")
      setStatus("")
      setUrl("")
      setRepo("")
      return
    }
    if (tab === "gitlab") {
      await onAddGitLab({ title: title.trim(), status: status.trim(), url: url.trim(), repo: repo.trim(), kind })
      setTitle("")
      setStatus("")
      setUrl("")
      setRepo("")
      return
    }
    await onAddLinear({ title: title.trim(), status: status.trim(), url: url.trim(), team: team.trim() })
    setTitle("")
    setStatus("")
    setUrl("")
    setTeam("")
  }

  const saveConfig = async () => {
    await onUpdateConfig({
      github: { token: ghToken.trim(), repo: ghRepo.trim() },
      gitlab: { token: glToken.trim(), host: glHost.trim(), project: glProject.trim() },
      linear: { token: linToken.trim(), team: linTeam.trim() },
    })
  }

  const sync = async () => {
    if (tab === "github") await onSyncGitHub()
    if (tab === "gitlab") await onSyncGitLab()
    if (tab === "linear") await onSyncLinear()
  }

  const list = tab === "github" ? github : tab === "gitlab" ? gitlab : linear

  const StatusBadge = ({ status }) => {
    let color = "bg-gray-100 text-gray-700"
    const s = (status || "").toLowerCase()
    if (s.includes("open") || s === "active" || s.includes("progress")) color = "bg-blue-100 text-blue-700"
    if (s === "merged" || s === "done" || s === "completed") color = "bg-green-100 text-green-700"
    if (s === "closed" || s === "canceled") color = "bg-red-100 text-red-700"
    if (s === "review") color = "bg-purple-100 text-purple-700"

    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${color}`}>
        {status || "Unknown"}
      </span>
    )
  }

  const IntegrationCard = ({ item, onRemove }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2" title={item.title}>
            {item.title}
          </h3>
          <StatusBadge status={item.status} />
        </div>
        <div className="text-xs text-gray-500 mb-4 line-clamp-1">
          {item.kind && <span className="uppercase font-mono mr-2 text-gray-400">{item.kind}</span>}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline hover:text-blue-800 inline-flex items-center gap-1"
          >
            Open Link <span>↗</span>
          </a>
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100 flex justify-end">
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-gray-400 hover:text-red-600 font-medium transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔗 Integrations</h2>
          <p className="text-gray-600">Track issues and PRs across GitHub, GitLab, and Linear.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === item ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration & Manual Entry */}
        <div className="space-y-6 lg:col-span-1">
          {/* Configuration Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">⚙️</span> Configuration
            </h3>
            <div className="space-y-4">
              {tab === "github" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">GitHub Owner/Repo</label>
                    <input
                      value={ghRepo}
                      onChange={(e) => setGhRepo(e.target.value)}
                      placeholder="owner/repo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">GitHub Token</label>
                    <input
                      type="password"
                      value={ghToken}
                      onChange={(e) => setGhToken(e.target.value)}
                      placeholder="ghp_..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              {tab === "gitlab" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">GitLab Host</label>
                    <input
                      value={glHost}
                      onChange={(e) => setGlHost(e.target.value)}
                      placeholder="https://gitlab.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Project ID/Path</label>
                    <input
                      value={glProject}
                      onChange={(e) => setGlProject(e.target.value)}
                      placeholder="group/project"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">GitLab Token</label>
                    <input
                      type="password"
                      value={glToken}
                      onChange={(e) => setGlToken(e.target.value)}
                      placeholder="glpat_..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              {tab === "linear" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Team ID</label>
                    <input
                      value={linTeam}
                      onChange={(e) => setLinTeam(e.target.value)}
                      placeholder="Team ID"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Linear Token</label>
                    <input
                      type="password"
                      value={linToken}
                      onChange={(e) => setLinToken(e.target.value)}
                      placeholder="lin_..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveConfig}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Save Config
                </button>
                <button
                  onClick={sync}
                  className="flex-1 gradient-bg text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>

          {/* Manual Entry Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">✍️</span> Manual Entry
            </h3>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Status"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="URL"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {tab !== "linear" && (
                <div className="grid grid-cols-2 gap-3">
                   <input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="Repo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="issue">Issue</option>
                    <option value={tab === "github" ? "pull" : "merge"}>
                      {tab === "github" ? "PR" : "MR"}
                    </option>
                  </select>
                </div>
              )}

              {tab === "linear" && (
                 <input
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Team"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              <button
                onClick={handleAdd}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Add Manual Entry
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Items Grid */}
        <div className="lg:col-span-2">
          {list.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {list.map((item) => (
                <IntegrationCard
                  key={item.id}
                  item={item}
                  onRemove={(id) => {
                    if (tab === "github") onRemoveGitHub(id)
                    if (tab === "gitlab") onRemoveGitLab(id)
                    if (tab === "linear") onRemoveLinear(id)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-12 text-center">
              <div className="text-4xl mb-4 opacity-20">📭</div>
              <h3 className="text-gray-900 font-medium mb-1">No items found</h3>
              <p className="text-sm text-gray-500">
                Sync with {tab.charAt(0).toUpperCase() + tab.slice(1)} or add items manually to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SystemOps({
  changelog,
  notifications,
  settings,
  limit,
  infra,
  agents,
  onAddChangelog,
  onAddNotification,
  onDismissNotification,
  onUpdateSettings,
  onUpdateLimit,
}) {
  const [activeTab, setActiveTab] = useState("status")
  const types = ["feature", "fix", "update"]
  const noticeTypes = ["update", "alert", "info"]

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [type, setType] = useState(types[0])

  const [noticeTitle, setNoticeTitle] = useState("")
  const [noticeBody, setNoticeBody] = useState("")
  const [noticeType, setNoticeType] = useState(noticeTypes[0])

  const [limitValue, setLimitValue] = useState(limit.limit)
  const [usedValue, setUsedValue] = useState(limit.used)
  const [resetValue, setResetValue] = useState(new Date(limit.resetAt).toISOString().slice(0, 16))
  const [editingLimit, setEditingLimit] = useState(false)

  useEffect(() => {
    setLimitValue(limit.limit)
    setUsedValue(limit.used)
    setResetValue(new Date(limit.resetAt).toISOString().slice(0, 16))
  }, [limit])

  const count = (value) => {
    if (Array.isArray(value)) return value.length
    const keys = value ? Object.keys(value) : []
    return keys.length
  }

  const progress = limit.limit ? Math.min(100, Math.round((limit.used / limit.limit) * 100)) : 0

  const toggle = (section, key, value) => {
    onUpdateSettings({ [section]: { ...settings[section], [key]: value } })
  }

  const handleChangelog = async () => {
    if (!title.trim()) return
    await onAddChangelog({ title: title.trim(), body: body.trim(), type })
    setTitle("")
    setBody("")
    setType(types[0])
  }

  const handleNotice = async () => {
    if (!noticeTitle.trim()) return
    await onAddNotification({ title: noticeTitle.trim(), body: noticeBody.trim(), type: noticeType })
    setNoticeTitle("")
    setNoticeBody("")
    setNoticeType(noticeTypes[0])
  }

  const handleLimit = async () => {
    const resetAt = new Date(resetValue).getTime()
    await onUpdateLimit({ limit: Number(limitValue), used: Number(usedValue), resetAt })
    setEditingLimit(false)
  }

  const StatCard = ({ icon, label, value, subtext, status = "active" }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
      <div>
        <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
      </div>
      <div
        className={`p-2 rounded-lg ${status === "active" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"}`}
      >
        {icon}
      </div>
    </div>
  )

  const ToggleSwitch = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && <div className="text-xs text-gray-500">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🧩 System & Ops</h2>
          <p className="text-gray-600">Monitor infrastructure, manage settings, and track updates.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {["status", "config", "updates"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "status" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="🔌"
              label="MCP Servers"
              value={count(infra.mcp)}
              subtext="Active connections"
              status={count(infra.mcp) > 0 ? "active" : "inactive"}
            />
            <StatCard
              icon="🧠"
              label="LSP Services"
              value={count(infra.lsp)}
              subtext="Language servers"
              status={count(infra.lsp) > 0 ? "active" : "inactive"}
            />
            <StatCard
              icon="✨"
              label="Formatters"
              value={count(infra.formatter)}
              subtext="Code formatters"
              status={count(infra.formatter) > 0 ? "active" : "inactive"}
            />
            <StatCard
              icon="📁"
              label="File Index"
              value={count(infra.file)}
              subtext="Tracked files"
              status={count(infra.file) > 0 ? "active" : "inactive"}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">API Rate Limits</h3>
                <p className="text-sm text-gray-500">Usage tracking for model providers</p>
              </div>
              <button
                onClick={() => setEditingLimit(!editingLimit)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {editingLimit ? "Cancel Edit" : "Adjust Limits"}
              </button>
            </div>

            {editingLimit ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Max Limit</label>
                  <input
                    type="number"
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Current Usage</label>
                  <input
                    type="number"
                    value={usedValue}
                    onChange={(e) => setUsedValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Reset Date</label>
                  <input
                    type="datetime-local"
                    value={resetValue}
                    onChange={(e) => setResetValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    onClick={handleLimit}
                    className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-gray-900">
                    {progress}% <span className="text-sm text-gray-500 font-normal">used</span>
                  </div>
                  <div className="text-sm text-gray-600 text-right">
                    <div>
                      <span className="font-semibold">{limit.used.toLocaleString()}</span> /{" "}
                      {limit.limit.toLocaleString()} tokens
                    </div>
                    <div className="text-xs text-gray-400">Resets {new Date(limit.resetAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      progress > 90 ? "bg-red-500" : progress > 70 ? "bg-orange-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agent Behavior</h3>
            <div className="divide-y divide-gray-100">
              <ToggleSwitch
                label="Auto-select Agents"
                description="Automatically choose the best agent based on task analysis"
                checked={settings.agents.autoSelect}
                onChange={(val) => toggle("agents", "autoSelect", val)}
              />
              <div className="py-3">
                <label className="text-sm font-medium text-gray-900 block mb-1">Default Agent</label>
                <p className="text-xs text-gray-500 mb-2">
                  Fallback agent when auto-selection is disabled or uncertain
                </p>
                <select
                  value={settings.agents.defaultAgent}
                  onChange={(e) => toggle("agents", "defaultAgent", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {agents.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">System Notifications</h3>
            <div className="divide-y divide-gray-100">
              <ToggleSwitch
                label="Update Notifications"
                description="Show alerts for system updates and changelogs"
                checked={settings.notifications.updates}
                onChange={(val) => toggle("notifications", "updates", val)}
              />
              <ToggleSwitch
                label="Error Alerts"
                description="Pop up alerts when critical errors occur"
                checked={settings.notifications.errors}
                onChange={(val) => toggle("notifications", "errors", val)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Security & Auth</h3>
            <div className="divide-y divide-gray-100">
              <ToggleSwitch
                label="Require Approval"
                description="Ask for confirmation before executing file changes"
                checked={settings.auth.requireApproval}
                onChange={(val) => toggle("auth", "requireApproval", val)}
              />
              <ToggleSwitch
                label="Allow Sharing"
                description="Enable codebase sharing features"
                checked={settings.security.share}
                onChange={(val) => toggle("security", "share", val)}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "updates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Changelog</h3>
              <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry title"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Details..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleChangelog}
                    className="flex-1 gradient-bg text-white rounded-lg text-sm font-medium"
                  >
                    Add Entry
                  </button>
                </div>
              </div>
              <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {changelog.map((entry) => (
                  <div key={entry.id} className="relative pl-10">
                    <div
                      className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                        entry.type === "feature"
                          ? "bg-blue-500"
                          : entry.type === "fix"
                            ? "bg-green-500"
                            : "bg-gray-500"
                      }`}
                    />
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-900 text-sm">{entry.title}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-500">{entry.type}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{entry.body}</p>
                    </div>
                  </div>
                ))}
                {changelog.length === 0 && <div className="pl-10 text-sm text-gray-500 italic">No history available.</div>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <input
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Notification title"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  placeholder="Message..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <select
                    value={noticeType}
                    onChange={(e) => setNoticeType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {noticeTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleNotice}
                    className="flex-1 gradient-bg text-white rounded-lg text-sm font-medium"
                  >
                    Post Notice
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {notifications.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg border ${
                      note.read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-100"
                    } transition-colors`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm text-gray-900">{note.title}</div>
                      <button
                        onClick={() => onDismissNotification(note.id)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        {note.read ? "Archive" : "Dismiss"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{note.body}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                          note.type === "alert" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {note.type}
                      </span>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-sm text-gray-500 italic text-center py-4">All caught up!</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentTools({ agents }) {
  const getAgentIcon = (name) => {
    const n = name.toLowerCase()
    if (n.includes("build") || n.includes("engineer")) return "🛠️"
    if (n.includes("research") || n.includes("explore")) return "🔍"
    if (n.includes("test") || n.includes("qa")) return "🧪"
    if (n.includes("doc")) return "📝"
    if (n.includes("review")) return "👀"
    if (n.includes("security")) return "🛡️"
    if (n.includes("chat")) return "💬"
    return "🤖"
  }

  const AgentCard = ({ agent }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">
            {getAgentIcon(agent.name)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{agent.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {agent.mode}
              </span>
            </div>
          </div>
        </div>
        {agent.model && (
          <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono border border-gray-200">
            {agent.model.providerID}/{agent.model.modelID}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-6 flex-1">{agent.description || "No description provided."}</p>

      <div className="pt-4 border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium text-gray-700">Execution Strategy</span>
          <span>{agent.steps ? `${agent.steps} steps` : "Default flow"}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🛠️ Agent Tools</h2>
        <p className="text-gray-600">Review available agents and their execution profiles.</p>
      </div>

      {agents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-12 text-center">
          <div className="text-4xl mb-4 opacity-20">🤖</div>
          <h3 className="text-gray-900 font-medium mb-1">No Agents Found</h3>
          <p className="text-sm text-gray-500">Ensure your agent configurations are loaded correctly in the backend.</p>
        </div>
      )}
    </div>
  )
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState("workspace")
  const [tasks, setTasks] = useState([])
  const [roadmap, setRoadmap] = useState({ phases: ["Foundation", "MVP", "Scale"], features: [] })
  const [ideas, setIdeas] = useState([])
  const [memories, setMemories] = useState([])
  const [indexItems, setIndexItems] = useState([])
  const [agents, setAgents] = useState([])
  const [models, setModels] = useState([])
  const [sessions, setSessions] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [activeSession, setActiveSession] = useState("")
  const [messages, setMessages] = useState([])
  const [prompt, setPrompt] = useState("")
  const [sending, setSending] = useState(false)
  const [agentChoice, setAgentChoice] = useState("")
  const [modelChoice, setModelChoice] = useState("")
  const [competitors, setCompetitors] = useState([])
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [activeDirectory, setActiveDirectory] = useState("")
  const [worktrees, setWorktrees] = useState([])
  const [pathInfo, setPathInfo] = useState(null)
  const [files, setFiles] = useState([])
  const [filePath, setFilePath] = useState(".")
  const [sendError, setSendError] = useState("")
  const [changelog, setChangelog] = useState([])
  const [notifications, setNotifications] = useState([])
  const [systemSettings, setSystemSettings] = useState({
    agents: { autoSelect: true, defaultAgent: "build" },
    notifications: { updates: true, errors: true },
    security: { share: true },
    auth: { requireApproval: false },
  })
  const [rateLimit, setRateLimit] = useState({ limit: 10000, used: 0, resetAt: Date.now() })
  const [infra, setInfra] = useState({ mcp: null, lsp: null, formatter: null, file: null })
  const [githubItems, setGithubItems] = useState([])
  const [gitlabItems, setGitlabItems] = useState([])
  const [linearItems, setLinearItems] = useState([])
  const [integrationConfig, setIntegrationConfig] = useState({
    github: { token: "", repo: "" },
    gitlab: { token: "", host: "https://gitlab.com", project: "" },
    linear: { token: "", team: "" },
  })
  const [live, setLive] = useState(true)
  const [wizard, setWizard] = useState(false)
  const [editing, setEditing] = useState(null)
  const [drawer, setDrawer] = useState(null)
  const [roadmapBusy, setRoadmapBusy] = useState(false)
  const [ideaBusy, setIdeaBusy] = useState(false)

  const directory = useMemo(() => activeDirectory || currentProject?.worktree || pathInfo?.directory || "", [activeDirectory, currentProject, pathInfo])

  const buildURL = useCallback(
    (path) => {
      const url = new URL(path, window.location.origin)
      if (directory) url.searchParams.set("directory", directory)
      return url.toString()
    },
    [directory],
  )

  const classifyTaskKind = useCallback((text) => {
    const value = (text || "").toLowerCase()
    if (!value) return "analysis"
    if (/\b(ui|ux|design|layout|copy|button|color|spacing|panel|modal)\b/.test(value)) return "ux"
    if (/\b(test|refactor|bug|fix|implement|function|api|endpoint|typescript|component)\b/.test(value)) return "code"
    if (/\b(roadmap|ideation|idea|feature|competitor|plan)\b/.test(value)) return "ux"
    return "analysis"
  }, [])

  const autoSelectModel = useCallback(
    (kind) => {
      if (!models.length) return modelChoice
      const choice = kind || "analysis"
      const picks = {
        ux: ["gemini", "google"],
        code: ["claude", "gpt", "sonnet", "haiku"],
        analysis: ["claude", "gpt", "gemini"],
      }
      const list = picks[choice] || picks.analysis
      const found = list
        .map((needle) => needle.toLowerCase())
        .map((needle) =>
          models.find((item) => {
            const label = item.label.toLowerCase()
            const provider = item.providerID?.toLowerCase?.() || ""
            const model = item.modelID?.toLowerCase?.() || ""
            return label.includes(needle) || provider.includes(needle) || model.includes(needle)
          }),
        )
        .find(Boolean)
      const key = found?.key || modelChoice || models[0]?.key || ""
      if (key && key !== modelChoice) setModelChoice(key)
      return key
    },
    [modelChoice, models],
  )

  useEffect(() => {
    const load = async () => {
      const taskRes = await fetch(buildURL("/app/kanban"))
      const roadmapRes = await fetch(buildURL("/app/roadmap"))
      const ideationRes = await fetch(buildURL("/app/ideation"))
      const memoryRes = await fetch(buildURL("/app/context/memories"))
      const indexRes = await fetch(buildURL("/app/context/index"))
      const agentRes = await fetch(buildURL("/agent"))
      const sessionRes = await fetch(buildURL("/session?limit=20"))
      const statusRes = await fetch(buildURL("/session/status"))
      const providerRes = await fetch(buildURL("/provider"))
      const competitorRes = await fetch(buildURL("/app/insights/competitors"))
      const projectRes = await fetch("/project")
      const currentRes = await fetch(buildURL("/project/current"))
      const worktreeRes = await fetch(buildURL("/experimental/worktree"))
      const pathRes = await fetch(buildURL("/path"))
      const changelogRes = await fetch(buildURL("/app/system/changelog"))
      const noticeRes = await fetch(buildURL("/app/system/notifications"))
      const settingsRes = await fetch(buildURL("/app/system/settings"))
      const limitRes = await fetch(buildURL("/app/system/limit"))
      const mcpRes = await fetch(buildURL("/mcp/status"))
      const lspRes = await fetch(buildURL("/lsp/status"))
      const formatterRes = await fetch(buildURL("/formatter/status"))
      const fileRes = await fetch(buildURL("/file/status"))
      const githubRes = await fetch(buildURL("/app/integrations/github"))
      const gitlabRes = await fetch(buildURL("/app/integrations/gitlab"))
      const linearRes = await fetch(buildURL("/app/integrations/linear"))
      const configRes = await fetch(buildURL("/app/integrations/config"))

      const taskData = await taskRes.json()
      const roadmapData = await roadmapRes.json()
      const ideationData = await ideationRes.json()
      const memoryData = await memoryRes.json()
      const indexData = await indexRes.json()
      const agentData = await agentRes.json()
      const sessionData = await sessionRes.json()
      const statusData = await statusRes.json()
      const providerData = await providerRes.json()
      const competitorData = await competitorRes.json()
      const projectData = await projectRes.json()
      const currentData = await currentRes.json()
      const worktreeData = await worktreeRes.json()
      const pathData = await pathRes.json()
      const changelogData = await changelogRes.json()
      const noticeData = await noticeRes.json()
      const settingsData = await settingsRes.json()
      const limitData = await limitRes.json()
      const mcpData = await mcpRes.json()
      const lspData = await lspRes.json()
      const formatterData = await formatterRes.json()
      const fileData = await fileRes.json()
      const githubData = await githubRes.json()
      const gitlabData = await gitlabRes.json()
      const linearData = await linearRes.json()
      const configData = await configRes.json()

      const providerList = providerData.all ?? providerData.providers ?? []
      const modelItems = providerList.flatMap((provider) =>
        Object.values(provider.models ?? {}).map((model) => ({
          key: `${provider.id}:${model.id}`,
          label: `${provider.name} · ${model.name}`,
          providerID: provider.id,
          modelID: model.id,
        })),
      )

      setTasks(taskData)
      setRoadmap(roadmapData)
      setIdeas(ideationData)
      setMemories(memoryData)
      setIndexItems(indexData)
      setAgents(agentData)
      setSessions(sessionData)
      setStatusMap(statusData)
      setModels(modelItems)
      setAgentChoice((current) => current || agentData[0]?.name || "")
      setModelChoice((current) => current || modelItems[0]?.key || "")
      setActiveSession((current) => current || sessionData[0]?.id || "")
      setCompetitors(competitorData)
      setProjects(projectData)
      setCurrentProject(currentData)
      setWorktrees(worktreeData)
      setPathInfo(pathData)
      setFilePath((current) => {
        if (current && current !== ".") return current
        if (directory) return directory
        if (pathData.directory) return pathData.directory
        return "."
      })
      setChangelog(changelogData)
      setNotifications(noticeData)
      setSystemSettings(settingsData)
      setRateLimit(limitData)
      setInfra({ mcp: mcpData, lsp: lspData, formatter: formatterData, file: fileData })
      setGithubItems(githubData)
      setGitlabItems(gitlabData)
      setLinearItems(linearData)
      setIntegrationConfig(configData)
    }

    load()
  }, [buildURL, directory])

  const loadMessages = useCallback(
    async (sessionID) => {
      if (!sessionID) return []
      const response = await fetch(buildURL(`/session/${sessionID}/message`))
      const data = await response.json()
      setMessages(data)
      return data
    },
    [buildURL],
  )

  useEffect(() => {
    if (!activeSession) return
    loadMessages(activeSession)
    if (!live) return
    const interval = setInterval(() => {
      loadMessages(activeSession)
      fetch(buildURL("/session/status"))
        .then((response) => response.json())
        .then((data) => setStatusMap(data))
        .catch(() => {})
      Promise.all([
        fetch(buildURL("/mcp/status")).then((response) => response.json()),
        fetch(buildURL("/lsp/status")).then((response) => response.json()),
        fetch(buildURL("/formatter/status")).then((response) => response.json()),
        fetch(buildURL("/file/status")).then((response) => response.json()),
      ])
        .then(([mcp, lsp, formatter, file]) => setInfra({ mcp, lsp, formatter, file }))
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [activeSession, buildURL, live, loadMessages])

  const loadFiles = useCallback(
    async (target) => {
      if (!target) return
      const url = new URL(buildURL("/file"))
      url.searchParams.set("path", target)
      const response = await fetch(url.toString())
      const data = await response.json()
      setFiles(data)
    },
    [buildURL],
  )

  useEffect(() => {
    if (!filePath) return
    loadFiles(filePath)
  }, [filePath, loadFiles])

  const refreshProjects = useCallback(async () => {
    const listRes = await fetch("/project")
    const currentRes = await fetch(buildURL("/project/current"))
    const listData = await listRes.json()
    const currentData = await currentRes.json()
    setProjects(listData)
    setCurrentProject(currentData)
  }, [buildURL])

  const updateProject = useCallback(async (projectID, payload) => {
    const response = await fetch(`/project/${projectID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const project = await response.json()
    setProjects((items) => items.map((item) => (item.id === project.id ? project : item)))
    setCurrentProject((current) => (current?.id === project.id ? project : current))
  }, [])

  const addProject = useCallback(async ({ directory, name }) => {
    const response = await fetch("/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ directory }),
    })
    const project = await response.json()
    const rename = name
      ? await fetch(`/project/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }).then((res) => res.json())
      : project
    setProjects((items) => [rename, ...items.filter((item) => item.id !== rename.id)])
  }, [])

  const refreshWorktrees = useCallback(async () => {
    const response = await fetch(buildURL("/experimental/worktree"))
    const data = await response.json()
    setWorktrees(data)
  }, [buildURL])

  const createWorktree = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/experimental/worktree"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const worktree = await response.json()
      setWorktrees((items) => [worktree.directory, ...items])
    },
    [buildURL],
  )

  const setPath = useCallback((value) => {
    setFilePath(value || ".")
  }, [])

  const selectProject = useCallback((project) => {
    if (!project) return
    const target = project.worktree || project.sandboxes?.[0] || "."
    setCurrentProject(project)
    setActiveDirectory(project.worktree || "")
    setFilePath(target)
  }, [])

  const createSession = useCallback(async () => {
    const response = await fetch(buildURL("/session"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Insights Session" }),
    })
    const session = await response.json()
    setSessions((items) => [session, ...items])
    setActiveSession(session.id)
    return session
  }, [buildURL])

  const renameSession = useCallback(
    async (sessionID, title) => {
      const response = await fetch(buildURL(`/session/${sessionID}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      const session = await response.json()
      setSessions((items) => items.map((item) => (item.id === session.id ? session : item)))
    },
    [buildURL],
  )

  const selectSession = useCallback((sessionID) => {
    setActiveSession(sessionID)
  }, [])

  const updatePrompt = useCallback((value) => {
    setPrompt(value)
  }, [])

  const updateAgent = useCallback((value) => {
    setAgentChoice(value)
  }, [])

  const updateModel = useCallback((value) => {
    setModelChoice(value)
  }, [])

  const ensureSession = useCallback(async () => {
    if (activeSession) return activeSession
    const session = await createSession()
    return session?.id ?? ""
  }, [activeSession, createSession])

  const sendPrompt = useCallback(
    async (override, sessionOverride) => {
      const content = (override ?? prompt).trim()
      if (!content) return
      const sessionID = sessionOverride ?? activeSession ?? (await ensureSession())
      if (!sessionID) return
      setActiveSession((current) => current || sessionID)
      setSending(true)
      setSendError("")
      const selectedKey = autoSelectModel(classifyTaskKind(content))
      const chosen = models.find((item) => item.key === selectedKey) || models.find((item) => item.key === modelChoice)
      const model = chosen ? { providerID: chosen.providerID, modelID: chosen.modelID } : undefined
      const body = {
        parts: [{ type: "text", text: content }],
        agent: agentChoice || undefined,
        model,
      }
      try {
        const response = await fetch(buildURL(`/session/${sessionID}/message`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!response.ok) {
          const errorText = await response.text().catch(() => "")
          const parsed = errorText ? JSON.parse(errorText).message?.toString?.() || errorText : "Request failed"
          setSendError(parsed)
          setSending(false)
          return
        }
        const text = await response.text()
        if (text) JSON.parse(text)
        if (!override) setPrompt("")
        await loadMessages(sessionID)
      } catch (error) {
        setSendError(error?.message || "Failed to send message")
      }
      setSending(false)
    },
    [activeSession, agentChoice, autoSelectModel, buildURL, classifyTaskKind, ensureSession, loadMessages, modelChoice, models, prompt],
  )

  const generateInsight = useCallback(async (text) => {
    const sessionID = await ensureSession()
    if (!sessionID) return []
    setActiveView("insights")
    setPrompt(text)
    await sendPrompt(text, sessionID)
    const data = await loadMessages(sessionID)
    return data
  }, [ensureSession, sendPrompt, loadMessages])

  const createFeature = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/roadmap"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const feature = await response.json()
      setRoadmap((current) => ({
        ...current,
        features: [feature, ...current.features],
      }))
    },
    [buildURL],
  )

  const createIdea = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/ideation"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const idea = await response.json()
      setIdeas((items) => [idea, ...items])
    },
    [buildURL],
  )

  const generateRoadmap = useCallback(
    (includeCompetitors) => {
      setRoadmapBusy(true)
      autoSelectModel("ux")
      const phases = roadmap.phases.length ? roadmap.phases : ["Foundation", "MVP", "Scale"]
      const seeds = [
        ...tasks.slice(0, 3).map((task) => `Ship: ${task.title}`),
        ...ideas.slice(0, 3).map((idea) => `Validate: ${idea.title}`),
        includeCompetitors ? "Competitive gap analysis" : "Quality and polish",
        "Developer experience improvements",
      ].filter(Boolean)
      const timestamp = Date.now()
      const generated = seeds.map((title, index) => ({
        id: `gen-roadmap-${timestamp}-${index}`,
        title,
        phase: phases[index % phases.length],
        status: "planned",
        owner: "",
      }))
      setRoadmap((current) => ({
        ...current,
        features: [...generated, ...current.features],
      }))
      setRoadmapBusy(false)
    },
    [autoSelectModel, ideas, roadmap.phases, tasks],
  )

  const generateIdeation = useCallback(
    (types, maxIdeas) => {
      setIdeaBusy(true)
      autoSelectModel("ux")
      const pool = [
        ...tasks.slice(0, 3).map((task) => `Follow up on ${task.title}`),
        ...roadmap.features.slice(0, 3).map((feature) => `Unblock ${feature.title}`),
        "Improve documentation coverage",
        "Streamline CI for faster feedback",
        "Add performance monitoring hooks",
      ]
      const limit = Number.isFinite(maxIdeas) ? maxIdeas : 8
      const entries = pool
        .filter(Boolean)
        .slice(0, limit)
        .map((title, index) => {
          const typeKey = types[index % types.length] || types[0] || "code_improvements"
          return {
            id: `idea-${Date.now()}-${index}`,
            title,
            type: typeKey,
            status: "active",
            impact: "medium",
          }
        })
      setIdeas((items) => [...entries, ...items])
      setIdeaBusy(false)
    },
    [autoSelectModel, roadmap.features, tasks],
  )

  const createTask = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/kanban"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const task = await response.json()
      setTasks((items) => [task, ...items])
    },
    [buildURL],
  )

  const removeCompetitor = useCallback(
    async (competitorID) => {
      await fetch(buildURL(`/app/insights/competitors/${competitorID}`), { method: "DELETE" })
      setCompetitors((items) => items.filter((item) => item.id !== competitorID))
    },
    [buildURL],
  )

  const refreshCompetitors = useCallback(async () => {
    const response = await fetch(buildURL("/app/insights/competitors"))
    const items = await response.json()
    setCompetitors(items)
  }, [buildURL])

  const createCompetitor = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/insights/competitors"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setCompetitors((items) => [item, ...items])
    },
    [buildURL],
  )

  const addChangelog = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/system/changelog"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setChangelog((items) => [item, ...items])
    },
    [buildURL],
  )

  const addNotification = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/system/notifications"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setNotifications((items) => [item, ...items])
    },
    [buildURL],
  )

  const dismissNotification = useCallback(
    async (noteID) => {
      const response = await fetch(buildURL(`/app/system/notifications/${noteID}`), { method: "PATCH" })
      const item = await response.json()
      setNotifications((items) => items.map((note) => (note.id === item.id ? item : note)))
    },
    [buildURL],
  )

  const updateSystemSettings = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/system/settings"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setSystemSettings(item)
    },
    [buildURL],
  )

  const updateRateLimit = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/system/limit"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setRateLimit(item)
    },
    [buildURL],
  )

  const addGitHub = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/integrations/github"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setGithubItems((items) => [item, ...items])
    },
    [buildURL],
  )

  const removeGitHub = useCallback(
    async (itemID) => {
      await fetch(buildURL(`/app/integrations/github/${itemID}`), { method: "DELETE" })
      setGithubItems((items) => items.filter((item) => item.id !== itemID))
    },
    [buildURL],
  )

  const addGitLab = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/integrations/gitlab"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setGitlabItems((items) => [item, ...items])
    },
    [buildURL],
  )

  const removeGitLab = useCallback(
    async (itemID) => {
      await fetch(buildURL(`/app/integrations/gitlab/${itemID}`), { method: "DELETE" })
      setGitlabItems((items) => items.filter((item) => item.id !== itemID))
    },
    [buildURL],
  )

  const addLinear = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/integrations/linear"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setLinearItems((items) => [item, ...items])
    },
    [buildURL],
  )

  const removeLinear = useCallback(
    async (itemID) => {
      await fetch(buildURL(`/app/integrations/linear/${itemID}`), { method: "DELETE" })
      setLinearItems((items) => items.filter((item) => item.id !== itemID))
    },
    [buildURL],
  )


  const updateIntegrationConfig = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/integrations/config"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const item = await response.json()
      setIntegrationConfig(item)
    },
    [buildURL],
  )

  const syncGitHub = useCallback(async () => {
    const response = await fetch(buildURL("/app/integrations/github/sync"), { method: "POST" })
    const items = await response.json()
    setGithubItems(items)
  }, [buildURL])

  const syncGitLab = useCallback(async () => {
    const response = await fetch(buildURL("/app/integrations/gitlab/sync"), { method: "POST" })
    const items = await response.json()
    setGitlabItems(items)
  }, [buildURL])

  const syncLinear = useCallback(async () => {
    const response = await fetch(buildURL("/app/integrations/linear/sync"), { method: "POST" })
    const items = await response.json()
    setLinearItems(items)
  }, [buildURL])

  const updateTask = useCallback(
    async (taskID, payload) => {
      const response = await fetch(buildURL(`/app/kanban/${taskID}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const task = await response.json()
      setTasks((items) => items.map((item) => (item.id === task.id ? task : item)))
    },
    [buildURL],
  )

  const moveTask = useCallback(
    async (taskID, status) => {
      const response = await fetch(buildURL(`/app/kanban/${taskID}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const task = await response.json()
      setTasks((items) => items.map((item) => (item.id === task.id ? task : item)))
    },
    [buildURL],
  )

  const toggleFeature = useCallback(
    async (featureID, status) => {
      const response = await fetch(buildURL(`/app/roadmap/${featureID}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const feature = await response.json()
      setRoadmap((current) => ({
        ...current,
        features: current.features.map((item) => (item.id === feature.id ? feature : item)),
      }))
    },
    [buildURL],
  )

  const exportRoadmap = useCallback(
    async (format) => {
      const url = new URL(buildURL("/app/roadmap/export"))
      url.searchParams.set("format", format)
      const response = await fetch(url.toString())
      const content = format === "json" ? JSON.stringify(await response.json(), null, 2) : await response.text()
      const blob = new Blob([content], { type: "text/plain" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `roadmap.${format === "md" ? "md" : format}`
      link.click()
      URL.revokeObjectURL(link.href)
    },
    [buildURL],
  )

  const updateIdea = useCallback(
    async (ideaID, status) => {
      const response = await fetch(buildURL(`/app/ideation/${ideaID}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const idea = await response.json()
      setIdeas((items) => items.map((item) => (item.id === idea.id ? idea : item)))
    },
    [buildURL],
  )

  const convertIdea = useCallback(
    async (ideaID) => {
      const response = await fetch(buildURL(`/app/ideation/${ideaID}/convert`), { method: "POST" })
      const result = await response.json()
      setIdeas((items) => items.map((item) => (item.id === result.idea.id ? result.idea : item)))
      setTasks((items) => [result.task, ...items])
    },
    [buildURL],
  )

  const addMemory = useCallback(
    async (payload) => {
      const response = await fetch(buildURL("/app/context/memories"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const memory = await response.json()
      setMemories((items) => [memory, ...items])
    },
    [buildURL],
  )

  const searchIndex = useCallback(
    async (query) => {
      const url = new URL(buildURL("/app/context/index"))
      if (query) url.searchParams.set("query", query)
      const response = await fetch(url.toString())
      const items = await response.json()
      setIndexItems(items)
    },
    [buildURL],
  )

  const searchMemories = useCallback(
    async (query) => {
      const url = new URL(buildURL("/app/context/memories"))
      if (query) url.searchParams.set("query", query)
      const response = await fetch(url.toString())
      const items = await response.json()
      setMemories(items)
    },
    [buildURL],
  )

  const openLogs = useCallback(() => setActiveView("insights"), [])

  const renderView = () => {
    switch (activeView) {
      case "showcase":
        return <AutoInterfaceShowcase />
      case "workspace":
        return (
          <Workspace
            tasks={tasks}
            ideas={ideas}
            roadmap={roadmap}
            memories={memories}
            sessions={sessions}
            statusMap={statusMap}
            onNewTask={() => setWizard(true)}
            onOpenInsights={() => setActiveView("insights")}
          />
        )
      case "projects":
        return (
          <ProjectHub
            projects={projects}
            current={currentProject}
            worktrees={worktrees}
            files={files}
            filePath={filePath}
            pathInfo={pathInfo}
            directory={directory}
            onRefreshProjects={refreshProjects}
            onUpdateProject={updateProject}
            onAddProject={addProject}
            onRefreshWorktrees={refreshWorktrees}
            onCreateWorktree={createWorktree}
            onBrowse={loadFiles}
            onSetPath={setPath}
            onSelectProject={selectProject}
          />
        )
      case "insights":
        return (
          <Insights
            sessions={sessions}
            statusMap={statusMap}
            activeSession={activeSession}
            messages={messages}
            prompt={prompt}
            sending={sending}
            models={models}
            agents={agents}
            selectedAgent={agentChoice}
            selectedModel={modelChoice}
            onSelectSession={selectSession}
            onCreateSession={createSession}
            onPromptChange={updatePrompt}
            onSendPrompt={sendPrompt}
            onSelectAgent={updateAgent}
            onSelectModel={updateModel}
            onRenameSession={renameSession}
            live={live}
            onToggleLive={() => setLive((value) => !value)}
            onGenerateInsight={generateInsight}
            tasks={tasks}
            ideas={ideas}
            competitors={competitors}
            onRemoveCompetitor={removeCompetitor}
            onRefreshCompetitors={refreshCompetitors}
            onCreateCompetitor={createCompetitor}
          />
        )
      case "integrations":
        return (
          <Integrations
            github={githubItems}
            gitlab={gitlabItems}
            linear={linearItems}
            config={integrationConfig}
            onUpdateConfig={updateIntegrationConfig}
            onSyncGitHub={syncGitHub}
            onSyncGitLab={syncGitLab}
            onSyncLinear={syncLinear}
            onAddGitHub={addGitHub}
            onRemoveGitHub={removeGitHub}
            onAddGitLab={addGitLab}
            onRemoveGitLab={removeGitLab}
            onAddLinear={addLinear}
            onRemoveLinear={removeLinear}
          />
        )
      case "kanban":
        return (
          <Kanban
            tasks={tasks}
            onCreate={createTask}
            onMove={moveTask}
            onEdit={(task) => setEditing(task)}
            onFiles={(task) => setDrawer(task)}
            onWizard={() => setWizard(true)}
          />
        )
      case "roadmap":
        return (
          <Roadmap
            roadmap={roadmap}
            onCreate={createFeature}
            onToggle={toggleFeature}
            onExport={exportRoadmap}
            onGenerate={generateRoadmap}
            onViewLogs={openLogs}
            generating={roadmapBusy}
          />
        )
      case "ideation":
        return (
          <Ideation
            ideas={ideas}
            onCreate={createIdea}
            onStatus={updateIdea}
            onConvert={convertIdea}
            onGenerate={generateIdeation}
            onViewLogs={openLogs}
            generating={ideaBusy}
          />
        )
      case "context":
        return (
          <Context
            memories={memories}
            indexItems={indexItems}
            onAddMemory={addMemory}
            onSearchIndex={searchIndex}
            onSearchMemories={searchMemories}
          />
        )
      case "system":
        return (
          <SystemOps
            changelog={changelog}
            notifications={notifications}
            settings={systemSettings}
            limit={rateLimit}
            infra={infra}
            agents={agents}
            onAddChangelog={addChangelog}
            onAddNotification={addNotification}
            onDismissNotification={dismissNotification}
            onUpdateSettings={updateSystemSettings}
            onUpdateLimit={updateRateLimit}
          />
        )
      case "agent-tools":
        return <AgentTools agents={agents} />
      default:
        return <AutoInterfaceShowcase />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeView={activeView}
        onViewChange={setActiveView}
        onNewTask={() => setWizard(true)}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 overflow-hidden ${sidebarOpen ? "ml-72" : "ml-16"}`}>
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="p-2 gradient-bg rounded-lg text-white" role="img" aria-label="OpenCode Logo">
              🧠
            </div>
            <div>
              <h1 className="text-xl font-bold">OpenCode Auto Interface</h1>
              <p className="text-sm text-gray-500">Professional AI Development Environment</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">{renderView()}</main>
      </div>

      <TaskWizard open={wizard} onClose={() => setWizard(false)} onSubmit={createTask} />
      <TaskEditDialog task={editing} onClose={() => setEditing(null)} onSave={updateTask} />
      <FileDrawer task={drawer} onClose={() => setDrawer(null)} directory={directory} />
    </div>
  )
}

export default App
