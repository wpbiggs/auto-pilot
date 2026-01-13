import { useCallback, useEffect, useMemo, useState } from "react"

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
          <div className="p-2 bg-blue-600 rounded-lg text-xl">🧠</div>
          {isOpen && (
            <div>
              <h2 className="font-bold text-lg">OpenCode</h2>
              <p className="text-xs text-gray-400">Auto Interface</p>
            </div>
          )}
          <button onClick={onToggle} className="ml-auto text-gray-400 hover:text-white">
            {isOpen ? "◀" : "▶"}
          </button>
        </div>

        {isOpen && (
          <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                  activeView === item.id ? "bg-blue-600 text-white" : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              </button>
            ))}
          </nav>
        )}

        {isOpen && (
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button
              onClick={onNewTask}
              className="w-full gradient-bg text-white py-2 px-4 rounded-lg font-medium hover:opacity-90"
            >
              🚀 New Task
            </button>
            <button className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700">
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
        <h2 className="text-3xl font-bold text-gray-900">🧠 Auto Task Analysis</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Describe a task and see the auto-routing decision, confidence, and execution plan.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Describe your task:</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder='e.g., "Add user authentication with JWT tokens" or "Explore codebase to understand architecture"'
              className="w-full h-32 p-3 border border-gray-300 rounded-lg mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleAnalyze}
              disabled={!prompt.trim() || isAnalyzing}
              className={`gradient-bg text-white px-6 py-3 rounded-lg font-medium transition-opacity ${
                !prompt.trim() || isAnalyzing ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
              }`}
            >
              {isAnalyzing ? "🔄 Analyzing..." : "🚀 Analyze Task"}
            </button>
          </div>

          {analysis && (
            <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-900">🎯 Analysis Results</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-sm text-gray-600">Task Type</div>
                  <div className="font-bold text-blue-600 capitalize">{analysis.taskType}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm text-gray-600">Complexity</div>
                  <div className="font-bold text-purple-600 capitalize">{analysis.complexity}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="text-sm text-gray-600">Agent</div>
                  <div className="font-bold text-green-600 capitalize">{analysis.agent}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🧠</div>
                  <div className="text-sm text-gray-600">Model</div>
                  <div className="font-bold text-orange-600">{analysis.model}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Confidence Score</div>
                  <div className="text-lg font-bold text-green-600">{(analysis.confidence * 100).toFixed(1)}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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
      <h2 className="text-2xl font-bold">💼 Workspace</h2>
      <p className="text-gray-600">Unified execution view across tasks, ideas, and context.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Active Tasks</h3>
            <button onClick={onNewTask} className="text-xs text-blue-600 hover:underline">
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
          <h3 className="text-xl font-bold mb-4">Execution Pulse</h3>
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
            <h3 className="text-xl font-bold">Session Activity</h3>
            <button onClick={onOpenInsights} className="text-xs text-blue-600 hover:underline">
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
          <h3 className="text-xl font-bold mb-4">Roadmap Focus</h3>
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
          <h3 className="text-xl font-bold mb-4">Context Highlights</h3>
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Create Task</h3>
            <p className="text-sm text-gray-500">
              Step {step + 1} of {steps.length}: {steps[step]}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the task"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-28"
            />
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Complexity
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {complexity.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Owner"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <input
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              placeholder="Estimate"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="text-sm px-3 py-2 border border-gray-200 rounded-lg">
            Back
          </button>
          <div className="flex items-center gap-2">
            {step < steps.length - 1 && (
              <button
                onClick={handleNext}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Next
              </button>
            )}
            {step === steps.length - 1 && (
              <button onClick={handleSubmit} className="gradient-bg text-white px-4 py-2 rounded-lg">
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Edit Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Owner"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="General">General</option>
            <option value="Feature">Feature</option>
            <option value="Bug">Bug</option>
            <option value="Refactor">Refactor</option>
            <option value="Research">Research</option>
          </select>
          <select
            value={complexity}
            onChange={(event) => setComplexity(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="Simple">Simple</option>
            <option value="Medium">Medium</option>
            <option value="Complex">Complex</option>
          </select>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <input
            value={estimate}
            onChange={(event) => setEstimate(event.target.value)}
            placeholder="Estimate"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Task description"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-28"
        />

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-2 border border-gray-200 rounded-lg">
            Cancel
          </button>
          <button onClick={handleSave} className="gradient-bg text-white px-4 py-2 rounded-lg">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function FileDrawer({ task, onClose }) {
  const [path, setPath] = useState(".")
  const [items, setItems] = useState([])
  const [file, setFile] = useState(null)
  const [content, setContent] = useState("")

  useEffect(() => {
    if (!task) return
    setPath(".")
    setFile(null)
    setContent("")
  }, [task])

  useEffect(() => {
    if (!task) return

    const load = async () => {
      const url = new URL("/file", window.location.origin)
      url.searchParams.set("path", path)
      const response = await fetch(url.toString())
      const data = await response.json()
      setItems(data)
    }

    load()
  }, [path, task])

  const handleOpen = async (item) => {
    if (item.type === "directory") {
      setPath(item.path)
      return
    }

    const url = new URL("/file/content", window.location.origin)
    url.searchParams.set("path", item.path)
    const response = await fetch(url.toString())
    const data = await response.json()
    setFile(item)
    setContent(data.content?.slice(0, 4000) ?? "")
  }

  if (!task) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="bg-white w-full max-w-3xl h-full shadow-xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Files for {task.title}</h3>
            <p className="text-xs text-gray-500">Browsing: {path}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr,1.5fr] gap-4 flex-1 overflow-hidden">
          <div className="border border-gray-200 rounded-lg p-3 overflow-y-auto">
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.absolute}
                  onClick={() => handleOpen(item)}
                  className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100"
                >
                  {item.type === "directory" ? "📁" : "📄"} {item.name}
                </button>
              ))}
              {items.length === 0 && <div className="text-sm text-gray-500">No files found.</div>}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3 overflow-y-auto">
            {!file && <div className="text-sm text-gray-500">Select a file to preview.</div>}
            {file && (
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">{file.path}</div>
                <pre className="text-xs whitespace-pre-wrap text-gray-700">{content}</pre>
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
          <h2 className="text-2xl font-bold">📌 Kanban Board</h2>
          <p className="text-gray-600">Track execution progress across agents and tasks.</p>
        </div>
        <button onClick={onWizard} className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          Open Task Wizard
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Owner"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </select>
          <button onClick={handleAdd} className="gradient-bg text-white rounded-lg px-3 py-2 text-sm font-medium">
            Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((col) => (
          <div key={col.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{col.label}</h3>
              <span className="text-xs text-gray-500">{tasks.filter((task) => task.status === col.id).length}</span>
            </div>
            <div className="space-y-3">
              {tasks
                .filter((task) => task.status === col.id)
                .map((task) => (
                  <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm space-y-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500">
                        {task.category ?? "General"} · {task.priority ?? "Normal"} · {task.complexity ?? "Medium"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Owner: {task.owner}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleMove(task.id, "back")}
                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
                      >
                        ◀ Move
                      </button>
                      <button
                        onClick={() => handleMove(task.id, "forward")}
                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
                      >
                        Move ▶
                      </button>
                      <button
                        onClick={() => onEdit(task)}
                        className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onFiles(task)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
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

function Roadmap({ roadmap, onCreate, onToggle, onExport, onGenerate, onViewLogs, generating }) {
  const [title, setTitle] = useState("")
  const [phase, setPhase] = useState(roadmap.phases[0] ?? "Foundation")
  const [withCompetitors, setWithCompetitors] = useState(false)
  const [genOpen, setGenOpen] = useState(false)

  const progress = roadmap.features.length
    ? Math.round(
        (roadmap.features.filter((feature) => feature.status === "done").length / roadmap.features.length) * 100,
      )
    : 0

  const handleAdd = async () => {
    if (!title.trim()) return
    await onCreate({ title: title.trim(), phase })
    setTitle("")
    setPhase(roadmap.phases[0] ?? "Foundation")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">🗺️ Roadmap</h2>
          <p className="text-gray-600">Plan releases and translate ideas into milestones.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">Overall progress</div>
            <div className="text-xl font-bold text-green-600">{progress}%</div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={withCompetitors}
              onChange={(event) => setWithCompetitors(event.target.checked)}
            />
            Include competitor analysis
          </label>
          <button
            onClick={() => setGenOpen(true)}
            disabled={generating}
            className={`text-xs px-3 py-2 border border-gray-200 rounded-lg ${
              generating ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            {generating ? "Generating..." : "Generate Roadmap"}
          </button>
          <div className="flex items-center gap-2">
            {["json", "csv", "md"].map((format) => (
              <button
                key={format}
                onClick={() => onExport(format)}
                className="text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Export {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Feature name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={phase}
            onChange={(event) => setPhase(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {roadmap.phases.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button onClick={handleAdd} className="gradient-bg text-white rounded-lg px-3 py-2 text-sm font-medium">
            Add Feature
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roadmap.phases.map((item) => (
          <div key={item} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{item}</h3>
              <span className="text-xs text-gray-500">
                {roadmap.features.filter((feature) => feature.phase === item).length}
              </span>
            </div>
            <div className="space-y-3">
              {roadmap.features
                .filter((feature) => feature.phase === item)
                .map((feature) => (
                  <div key={feature.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{feature.title}</div>
                        <div className="text-xs text-gray-500">Owner: {feature.owner}</div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          feature.status === "done"
                            ? "bg-green-100 text-green-700"
                            : feature.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {feature.status.replace("_", " ")}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggle(feature.id, feature.status === "done" ? "planned" : "done")}
                      className="mt-3 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
                    >
                      {feature.status === "done" ? "Reopen" : "Mark Done"}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {genOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generate Roadmap</h3>
              <button onClick={() => setGenOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={withCompetitors}
                onChange={(event) => setWithCompetitors(event.target.checked)}
              />
              Include competitor analysis
            </label>
            <p className="text-xs text-gray-500">
              Generate an AI-powered roadmap with phases, milestones, and optional competitor insights.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setGenOpen(false)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg">
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
                  await onGenerate(withCompetitors)
                  setGenOpen(false)
                }}
                disabled={generating}
                className={`gradient-bg text-white px-4 py-2 rounded-lg ${
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

  const visible = useMemo(() => {
    const filtered = activeType === "all" ? ideas : ideas.filter((idea) => idea.type === activeType)
    return filtered.filter((idea) => (showArchived ? true : idea.status !== "archived"))
  }, [activeType, ideas, showArchived])

  const handleAdd = async () => {
    if (!title.trim()) return
    await onCreate({ title: title.trim(), type })
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
          <h2 className="text-2xl font-bold">💡 Ideation</h2>
          <p className="text-gray-600">Capture ideas, convert to tasks, and manage signals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGenOpen(true)}
            disabled={generating}
            className={`text-sm px-3 py-2 border border-gray-200 rounded-lg ${
              generating ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            {generating ? "Generating..." : "Generate Ideas"}
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Idea title"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <button onClick={handleAdd} className="gradient-bg text-white rounded-lg px-3 py-2 text-sm font-medium">
            Add Idea
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveType("all")}
          className={`px-3 py-2 rounded-lg text-sm ${
            activeType === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          All Ideas
        </button>
        {types.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveType(item.id)}
            className={`px-3 py-2 rounded-lg text-sm ${
              activeType === item.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visible.map((idea) => (
          <div key={idea.id} className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">{idea.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Type: {idea.type} · Impact: {idea.impact}
                </div>
                {idea.taskID && <div className="text-xs text-blue-600 mt-1">Task: {idea.taskID}</div>}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  idea.status === "archived"
                    ? "bg-gray-200 text-gray-600"
                    : idea.status === "dismissed"
                      ? "bg-yellow-100 text-yellow-700"
                      : idea.status === "converted"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                }`}
              >
                {idea.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                onClick={() => onStatus(idea.id, "active")}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
              >
                Keep
              </button>
              <button
                onClick={() => onStatus(idea.id, "dismissed")}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
              >
                Dismiss
              </button>
              <button
                onClick={() => onStatus(idea.id, "archived")}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
              >
                Archive
              </button>
              <button
                onClick={() => onConvert(idea.id)}
                className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Convert to Task
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500">{types.find((item) => item.id === idea.type)?.hint}</div>
          </div>
        ))}
      </div>

      {genOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generate Ideas</h3>
              <button onClick={() => setGenOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-600">Select idea types to generate.</div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              {types.map((item) => (
                <label key={item.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(item.id)}
                    onChange={() => toggleType(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <input
              value={maxIdeas}
              onChange={(event) => setMaxIdeas(event.target.value)}
              placeholder="Max ideas"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setGenOpen(false)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg">
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
                className={`gradient-bg text-white px-4 py-2 rounded-lg ${
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

function Context({ memories, indexItems, onAddMemory, onSearchIndex, onSearchMemories }) {
  const [activeTab, setActiveTab] = useState("index")
  const [search, setSearch] = useState("")
  const [memorySearch, setMemorySearch] = useState("")
  const [memoryInput, setMemoryInput] = useState("")

  useEffect(() => {
    onSearchIndex(search)
  }, [onSearchIndex, search])

  useEffect(() => {
    onSearchMemories(memorySearch)
  }, [memorySearch, onSearchMemories])

  const handleAdd = async () => {
    if (!memoryInput.trim()) return
    await onAddMemory({ title: memoryInput.trim() })
    setMemoryInput("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">📁 Context Manager</h2>
        <p className="text-gray-600">Browse indexed knowledge and team memory.</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("index")}
          className={`px-3 py-2 rounded-lg text-sm ${
            activeTab === "index" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Project Index
        </button>
        <button
          onClick={() => setActiveTab("memories")}
          className={`px-3 py-2 rounded-lg text-sm ${
            activeTab === "memories" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Memories
        </button>
      </div>

      {activeTab === "index" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search index"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
            />
            <button
              onClick={() => onSearchIndex(search)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {indexItems.map((item) => (
              <div key={item} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{item}</div>
                  <div className="text-xs text-gray-500">Indexed file</div>
                </div>
                <div className="text-xs text-gray-500">Ready</div>
              </div>
            ))}
            {indexItems.length === 0 && <div className="text-sm text-gray-500">No index results yet.</div>}
          </div>
        </div>
      )}

      {activeTab === "memories" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3">
            <input
              value={memoryInput}
              onChange={(event) => setMemoryInput(event.target.value)}
              placeholder="Add memory note"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={handleAdd} className="gradient-bg text-white rounded-lg px-3 py-2 text-sm font-medium">
              Add Memory
            </button>
          </div>
          <input
            value={memorySearch}
            onChange={(event) => setMemorySearch(event.target.value)}
            placeholder="Search memories"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <div className="space-y-3">
            {memories.map((item) => (
              <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500">Tag: {item.tag}</div>
                </div>
                <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {memories.length === 0 && <div className="text-sm text-gray-500">No memories yet.</div>}
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
          <h2 className="text-2xl font-bold">💬 Insights Workspace</h2>
          <p className="text-gray-600">Multi-session chat, model selection, and competitive notes.</p>
        </div>
        <button
          onClick={() => onGenerateInsight("What is the architecture of this project?")}
          className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Generate Insights
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px,1fr,300px] gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Sessions</h3>
            <button onClick={onCreateSession} className="text-xs text-blue-600 hover:underline">
              New
            </button>
          </div>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-2 w-full p-2 rounded-lg border text-sm ${
                  activeSession === session.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <button onClick={() => onSelectSession(session.id)} className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{session.title}</div>
                  <div className="text-xs text-gray-500">{statusMap?.[session.id]?.type ?? "idle"}</div>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    setRenameID(session.id)
                    setRenameTitle(session.title)
                    setRenameOpen(true)
                  }}
                  className="text-xs text-gray-400 hover:text-blue-600"
                >
                  Rename
                </button>
              </div>
            ))}
            {sessions.length === 0 && <div className="text-xs text-gray-500">No sessions yet.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Chat</div>
              <div className="text-xs text-gray-500">{selectedText}</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={onToggleLive}
                className={`px-2 py-1 rounded-lg border ${live ? "border-blue-500 text-blue-600" : "border-gray-200 text-gray-400"}`}
              >
                {live ? "Live" : "Paused"}
              </button>
              <div className="text-gray-400">Session: {activeSession ?? "None"}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {messageItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg p-3 text-sm ${item.role === "user" ? "bg-blue-50" : "bg-gray-50"}`}
              >
                <div className="text-xs text-gray-500 mb-1">{item.role}</div>
                <div className="whitespace-pre-wrap text-gray-800">{item.text || "(no text)"}</div>
              </div>
            ))}
            {messageItems.length === 0 && <div className="text-sm text-gray-500">No messages yet.</div>}
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  onClick={() => onPromptChange(item)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {item}
                </button>
              ))}
            </div>
            <textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Ask about your codebase..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24"
            />
            <button
              onClick={onSendPrompt}
              disabled={!prompt.trim() || sending || !activeSession}
              className={`w-full rounded-lg px-3 py-2 text-sm font-medium ${
                !prompt.trim() || sending || !activeSession ? "bg-gray-200 text-gray-500" : "gradient-bg text-white"
              }`}
            >
              {sending ? "Sending..." : "Send Prompt"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">Execution Settings</h3>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Agent</label>
              <select
                value={selectedAgent}
                onChange={(event) => onSelectAgent(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              <label className="text-xs text-gray-500">Model</label>
              <select
                value={selectedModel}
                onChange={(event) => onSelectModel(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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

          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Competitor Analysis</h3>
              <button onClick={() => setDialog(true)} className="text-xs text-blue-600 hover:underline">
                Add
              </button>
            </div>
            <div className="space-y-3">
              {competitors.map((item) => (
                <div key={item.id} className="text-sm text-gray-700 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.note || "No notes"}</div>
                  </div>
                  <button
                    onClick={() => onRemoveCompetitor(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {competitors.length === 0 && <div className="text-xs text-gray-500">No competitor notes yet.</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold">Task Suggestions</h3>
            <div className="space-y-2">
              {suggestions.map((item, index) => (
                <div key={`${item}-${index}`} className="text-xs text-gray-600">
                  • {item}
                </div>
              ))}
              {suggestions.length === 0 && <div className="text-xs text-gray-500">No suggestions yet.</div>}
            </div>
          </div>
        </div>
      </div>

      {dialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Competitor</h3>
              <button onClick={() => setDialog(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Competitor name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Notes"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24"
            />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDialog(false)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg">
                Cancel
              </button>
              <button onClick={handleSaveCompetitor} className="gradient-bg text-white px-4 py-2 rounded-lg">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {renameOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rename Session</h3>
              <button onClick={() => setRenameOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <input
              value={renameTitle}
              onChange={(event) => setRenameTitle(event.target.value)}
              placeholder="Session title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRenameOpen(false)}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button onClick={handleRename} className="gradient-bg text-white px-4 py-2 rounded-lg">
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
  onRefreshProjects,
  onUpdateProject,
  onAddProject,
  onRefreshWorktrees,
  onCreateWorktree,
  onBrowse,
  onSetPath,
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
      const response = await fetch(url.toString())
      const data = await response.json()
      setPreview(data.content?.slice(0, 4000) ?? "")
    }
    load()
  }, [focus])

  useEffect(() => {
    if (!browseOpen) return
    if (!browseQuery.trim()) {
      setBrowseResults([])
      return
    }
    const timer = setTimeout(() => {
      const url = new URL("/path", window.location.origin)
      url.searchParams.set("query", browseQuery)
      url.searchParams.set("dirs", "true")
      url.searchParams.set("type", "directory")
      url.searchParams.set("limit", "25")
      setBrowseLoading(true)
      fetch(url.toString())
        .then((response) => response.json())
        .then((data) => {
          setBrowseResults(data)
          setBrowseLoading(false)
        })
        .catch(() => setBrowseLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [browseOpen, browseQuery])

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🗂️ Projects & Worktrees</h2>
        <p className="text-gray-600">Manage projects, sandboxes, and file navigation.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`px-3 py-2 rounded-lg text-sm ${tab === item ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {tab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setAddOpen(true)} className="gradient-bg text-white px-3 py-2 rounded-lg text-sm">
              Add Project
            </button>
            <button onClick={() => setGitOpen(true)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg">
              Git Setup
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {project.name ?? project.worktree}
                    {current?.id === project.id && <span className="text-xs text-blue-600 ml-2">Active</span>}
                  </div>
                  <div className="text-xs text-gray-500">{project.worktree}</div>
                </div>
                <button
                  onClick={() => {
                    setEdit(project)
                    setEditName(project.name ?? "")
                  }}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg"
                >
                  Rename
                </button>
              </div>
            ))}
            {projects.length === 0 && <div className="text-sm text-gray-500">No projects registered.</div>}
          </div>
        </div>
      )}

      {tab === "worktrees" && (
        <div className="space-y-4">
          <button onClick={() => setWorkOpen(true)} className="gradient-bg text-white px-3 py-2 rounded-lg text-sm">
            New Worktree
          </button>
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-2">
            {worktrees.map((tree) => (
              <div key={tree} className="text-sm text-gray-700">
                • {tree}
              </div>
            ))}
            {worktrees.length === 0 && <div className="text-sm text-gray-500">No worktrees yet.</div>}
          </div>
        </div>
      )}

      {tab === "files" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={() => onSetPath(up)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg">
              Up
            </button>
            <input
              value={filePath}
              onChange={(event) => onSetPath(event.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={() => onBrowse(filePath)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg">
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr,1.2fr] gap-4">
            <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-[420px] overflow-y-auto">
              {files.map((item) => (
                <button
                  key={item.absolute}
                  onClick={() => {
                    if (item.type === "directory") onSetPath(item.path)
                    if (item.type === "file") setFocus(item)
                  }}
                  className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100"
                >
                  {item.type === "directory" ? "📁" : "📄"} {item.name}
                </button>
              ))}
              {files.length === 0 && <div className="text-sm text-gray-500">No files found.</div>}
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              {!focus && <div className="text-sm text-gray-500">Select a file to preview.</div>}
              {focus && (
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">{focus.path}</div>
                  <pre className="text-xs whitespace-pre-wrap text-gray-700">{preview}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Project</h3>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={dir}
                onChange={(event) => setDir(event.target.value)}
                placeholder="Directory path"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  setBrowseQuery(dir)
                  setBrowseOpen(true)
                }}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg"
              >
                Browse
              </button>
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name (optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setAddOpen(false)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg">
                Cancel
              </button>
              <button onClick={handleAdd} className="gradient-bg text-white px-4 py-2 rounded-lg">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {browseOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Browse Directories</h3>
              <button onClick={() => setBrowseOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <input
              value={browseQuery}
              onChange={(event) => setBrowseQuery(event.target.value)}
              placeholder="Search directories"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Results from /path search</span>
              {rootDir && (
                <button
                  onClick={() => {
                    setDir(rootDir)
                    setBrowseOpen(false)
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Use project root
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {browseLoading && <div className="text-sm text-gray-500">Searching...</div>}
              {!browseLoading && browseResults.length === 0 && (
                <div className="text-sm text-gray-500">No directories found.</div>
              )}
              {browseResults.map((item) => {
                const path = item.path ?? item.absolute ?? item
                return (
                  <button
                    key={path}
                    onClick={() => {
                      setDir(path)
                      setBrowseOpen(false)
                    }}
                    className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100"
                  >
                    📁 {path}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setBrowseOpen(false)} className="text-sm px-3 py-2 border border-gray-200 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {gitOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Git Setup</h3>
              <button onClick={() => setGitOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <div>Initialize a repo:</div>
              <code className="block bg-gray-100 rounded-lg p-2 text-xs">git init</code>
              <div>Add OpenCode project marker:</div>
              <code className="block bg-gray-100 rounded-lg p-2 text-xs">
                echo $(git rev-list --max-parents=0 --all | head -n1) &gt; .git/opencode
              </code>
            </div>
          </div>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🔗 Integrations</h2>
        <p className="text-gray-600">Track issues and PRs across GitHub, GitLab, and Linear.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`px-3 py-2 rounded-lg text-sm ${tab === item ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
        {tab === "github" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={ghRepo}
              onChange={(event) => setGhRepo(event.target.value)}
              placeholder="owner/repo"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={ghToken}
              onChange={(event) => setGhToken(event.target.value)}
              placeholder="GitHub token"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
        {tab === "gitlab" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={glProject}
              onChange={(event) => setGlProject(event.target.value)}
              placeholder="group/project or id"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={glHost}
              onChange={(event) => setGlHost(event.target.value)}
              placeholder="https://gitlab.com"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={glToken}
              onChange={(event) => setGlToken(event.target.value)}
              placeholder="GitLab token"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
        {tab === "linear" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={linTeam}
              onChange={(event) => setLinTeam(event.target.value)}
              placeholder="Team"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={linToken}
              onChange={(event) => setLinToken(event.target.value)}
              placeholder="Linear token"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={saveConfig} className="text-xs px-3 py-2 border border-gray-200 rounded-lg">
            Save Config
          </button>
          <button onClick={sync} className="text-xs px-3 py-2 border border-gray-200 rounded-lg">
            Sync Now
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            placeholder="Status"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="URL"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          {tab === "linear" ? (
            <input
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              placeholder="Team"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          ) : (
            <input
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="Repo"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          )}
          {tab === "github" && (
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="issue">Issue</option>
              <option value="pull">PR</option>
            </select>
          )}
          {tab === "gitlab" && (
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="issue">Issue</option>
              <option value="merge">MR</option>
            </select>
          )}
          <button onClick={handleAdd} className="gradient-bg text-white px-3 py-2 rounded-lg text-sm">
            Add Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-2">
        {list.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">{item.title}</div>
              <div className="text-xs text-gray-500">
                {item.status} · {item.url}
              </div>
            </div>
            <button
              onClick={() => {
                if (tab === "github") onRemoveGitHub(item.id)
                if (tab === "gitlab") onRemoveGitLab(item.id)
                if (tab === "linear") onRemoveLinear(item.id)
              }}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        {list.length === 0 && <div className="text-sm text-gray-500">No entries yet.</div>}
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
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🧩 System & Ops</h2>
        <p className="text-gray-600">System status, rate limits, settings, and updates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold">Infrastructure Status</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div>MCP servers: {count(infra.mcp)}</div>
            <div>LSP status: {count(infra.lsp)}</div>
            <div>Formatter status: {count(infra.formatter)}</div>
            <div>File status entries: {count(infra.file)}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold">Rate Limit</h3>
          <div className="text-xs text-gray-500">
            {limit.used} / {limit.limit}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <input
              value={limitValue}
              onChange={(event) => setLimitValue(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs"
              placeholder="Limit"
            />
            <input
              value={usedValue}
              onChange={(event) => setUsedValue(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs"
              placeholder="Used"
            />
            <input
              type="datetime-local"
              value={resetValue}
              onChange={(event) => setResetValue(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs"
            />
            <button
              onClick={handleLimit}
              className="text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Update Limit
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold">Settings</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.agents.autoSelect}
                onChange={(event) => toggle("agents", "autoSelect", event.target.checked)}
              />
              Auto-select agents
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.notifications.updates}
                onChange={(event) => toggle("notifications", "updates", event.target.checked)}
              />
              Update notifications
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.notifications.errors}
                onChange={(event) => toggle("notifications", "errors", event.target.checked)}
              />
              Error alerts
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.security.share}
                onChange={(event) => toggle("security", "share", event.target.checked)}
              />
              Allow sharing
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.auth.requireApproval}
                onChange={(event) => toggle("auth", "requireApproval", event.target.checked)}
              />
              Require approvals
            </label>
            <div>
              <div className="text-xs text-gray-500">Default agent</div>
              <select
                value={settings.agents.defaultAgent}
                onChange={(event) => toggle("agents", "defaultAgent", event.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-full"
              >
                {agents.map((agent) => (
                  <option key={agent.name} value={agent.name}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold">Changelog</h3>
          <div className="space-y-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs w-full"
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Details"
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs w-full h-20"
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs w-full"
            >
              {types.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              onClick={handleChangelog}
              className="text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Add Entry
            </button>
          </div>
          <div className="space-y-2">
            {changelog.map((entry) => (
              <div key={entry.id} className="text-xs text-gray-700">
                <div className="font-semibold">
                  {entry.title} · {entry.type}
                </div>
                <div className="text-gray-500">{entry.body}</div>
              </div>
            ))}
            {changelog.length === 0 && <div className="text-xs text-gray-500">No changelog entries.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold">Update Notifications</h3>
          <div className="space-y-2">
            <input
              value={noticeTitle}
              onChange={(event) => setNoticeTitle(event.target.value)}
              placeholder="Title"
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs w-full"
            />
            <textarea
              value={noticeBody}
              onChange={(event) => setNoticeBody(event.target.value)}
              placeholder="Message"
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs w-full h-20"
            />
            <select
              value={noticeType}
              onChange={(event) => setNoticeType(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs w-full"
            >
              {noticeTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              onClick={handleNotice}
              className="text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Add Notification
            </button>
          </div>
          <div className="space-y-2">
            {notifications.map((note) => (
              <div key={note.id} className="text-xs text-gray-700 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {note.title} · {note.type}
                  </div>
                  <div className="text-gray-500">{note.body}</div>
                </div>
                <button
                  onClick={() => onDismissNotification(note.id)}
                  className="text-xs text-gray-400 hover:text-blue-600"
                >
                  {note.read ? "Read" : "Dismiss"}
                </button>
              </div>
            ))}
            {notifications.length === 0 && <div className="text-xs text-gray-500">No notifications yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentTools({ agents }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🛠️ Agent Tools</h2>
        <p className="text-gray-600">Review available agents and their execution profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{agent.name}</div>
                <div className="text-xs text-gray-500">Mode: {agent.mode}</div>
              </div>
              {agent.model && (
                <span className="text-xs text-gray-500">
                  {agent.model.providerID}/{agent.model.modelID}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-3">{agent.description || "No description"}</div>
            <div className="text-xs text-gray-400 mt-2">Steps: {agent.steps ?? "Default"}</div>
          </div>
        ))}
        {agents.length === 0 && <div className="text-sm text-gray-500">No agents loaded.</div>}
      </div>
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
  const [worktrees, setWorktrees] = useState([])
  const [pathInfo, setPathInfo] = useState(null)
  const [files, setFiles] = useState([])
  const [filePath, setFilePath] = useState(".")
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

  useEffect(() => {
    const load = async () => {
      const taskRes = await fetch("/app/kanban")
      const roadmapRes = await fetch("/app/roadmap")
      const ideationRes = await fetch("/app/ideation")
      const memoryRes = await fetch("/app/context/memories")
      const indexRes = await fetch("/app/context/index")
      const agentRes = await fetch("/agent")
      const sessionRes = await fetch("/session?limit=20")
      const statusRes = await fetch("/session/status")
      const providerRes = await fetch("/provider")
      const competitorRes = await fetch("/app/insights/competitors")
      const projectRes = await fetch("/project")
      const currentRes = await fetch("/project/current")
      const worktreeRes = await fetch("/experimental/worktree")
      const pathRes = await fetch("/path")
      const changelogRes = await fetch("/app/system/changelog")
      const noticeRes = await fetch("/app/system/notifications")
      const settingsRes = await fetch("/app/system/settings")
      const limitRes = await fetch("/app/system/limit")
      const mcpRes = await fetch("/mcp/status")
      const lspRes = await fetch("/lsp/status")
      const formatterRes = await fetch("/formatter/status")
      const fileRes = await fetch("/file/status")
      const githubRes = await fetch("/app/integrations/github")
      const gitlabRes = await fetch("/app/integrations/gitlab")
      const linearRes = await fetch("/app/integrations/linear")
      const configRes = await fetch("/app/integrations/config")

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
      setFilePath((current) => (current && current !== "." ? current : (pathData.directory ?? ".")))
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
  }, [])

  const loadMessages = useCallback(async (sessionID) => {
    if (!sessionID) return []
    const response = await fetch(`/session/${sessionID}/message`)
    const data = await response.json()
    setMessages(data)
    return data
  }, [])

  useEffect(() => {
    if (!activeSession) return
    loadMessages(activeSession)
    if (!live) return
    const interval = setInterval(() => {
      loadMessages(activeSession)
      fetch("/session/status")
        .then((response) => response.json())
        .then((data) => setStatusMap(data))
        .catch(() => {})
      Promise.all([
        fetch("/mcp/status").then((response) => response.json()),
        fetch("/lsp/status").then((response) => response.json()),
        fetch("/formatter/status").then((response) => response.json()),
        fetch("/file/status").then((response) => response.json()),
      ])
        .then(([mcp, lsp, formatter, file]) => setInfra({ mcp, lsp, formatter, file }))
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [activeSession, live, loadMessages])

  const loadFiles = useCallback(async (target) => {
    if (!target) return
    const url = new URL("/file", window.location.origin)
    url.searchParams.set("path", target)
    const response = await fetch(url.toString())
    const data = await response.json()
    setFiles(data)
  }, [])

  useEffect(() => {
    if (!filePath) return
    loadFiles(filePath)
  }, [filePath, loadFiles])

  const refreshProjects = useCallback(async () => {
    const [listRes, currentRes] = await Promise.all([fetch("/project"), fetch("/project/current")])
    const listData = await listRes.json()
    const currentData = await currentRes.json()
    setProjects(listData)
    setCurrentProject(currentData)
  }, [])

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
    const response = await fetch("/experimental/worktree")
    const data = await response.json()
    setWorktrees(data)
  }, [])

  const createWorktree = useCallback(async (payload) => {
    const response = await fetch("/experimental/worktree", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const worktree = await response.json()
    setWorktrees((items) => [worktree.directory, ...items])
  }, [])

  const setPath = useCallback((value) => {
    setFilePath(value || ".")
  }, [])

  const createSession = useCallback(async () => {
    const response = await fetch("/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Insights Session" }),
    })
    const session = await response.json()
    setSessions((items) => [session, ...items])
    setActiveSession(session.id)
    return session
  }, [])

  const renameSession = useCallback(async (sessionID, title) => {
    const response = await fetch(`/session/${sessionID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    const session = await response.json()
    setSessions((items) => items.map((item) => (item.id === session.id ? session : item)))
  }, [])

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

  const sendPrompt = useCallback(async (override, sessionOverride) => {
    const content = (override ?? prompt).trim()
    const sessionID = sessionOverride ?? activeSession
    if (!sessionID || !content) return
    setSending(true)
    const chosen = models.find((item) => item.key === modelChoice)
    const model = chosen ? { providerID: chosen.providerID, modelID: chosen.modelID } : undefined
    const body = {
      parts: [{ type: "text", text: content }],
      agent: agentChoice || undefined,
      model,
    }
    const response = await fetch(`/session/${sessionID}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    if (text) JSON.parse(text)
    if (!override) setPrompt("")
    await loadMessages(sessionID)
    setSending(false)
  }, [activeSession, agentChoice, modelChoice, models, loadMessages, prompt])

  const ensureSession = useCallback(async () => {
    if (activeSession) return activeSession
    const session = await createSession()
    return session?.id ?? ""
  }, [activeSession, createSession])

  const ideationLabels = {
    code_improvements: "Code Improvements",
    ui_ux_improvements: "UI/UX Improvements",
    documentation_gaps: "Documentation",
    security_hardening: "Security",
    performance_optimizations: "Performance",
    code_quality: "Code Quality",
  }

  const parseList = (text) => {
    if (!text) return []
    return text
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter((line) => line.length > 0)
  }

  const parseRoadmapText = (text, phases) => {
    const lines = text.split("\n")
    const defaultPhase = phases[0] ?? "Foundation"
    const result = lines.reduce(
      (acc, line) => {
        const heading = line.match(/^#{1,3}\s+(.*)/)
        if (heading) return { ...acc, phase: heading[1].trim() }
        const phaseMatch = line.match(/^(phase|stage)\s*:\s*(.+)$/i)
        if (phaseMatch) return { ...acc, phase: phaseMatch[2].trim() }
        const entry = line.replace(/^[-*\d.\s]+/, "").trim()
        if (!entry) return acc
        return {
          ...acc,
          items: [...acc.items, { title: entry, phase: acc.phase || defaultPhase }],
        }
      },
      { phase: defaultPhase, items: [] },
    )
    return result.items
  }

  const parseIdeationText = (text, types) => {
    if (!text) return []
    const lines = text.split("\n")
    const normalized = Object.entries(ideationLabels).reduce((acc, [key, label]) => {
      const lower = label.toLowerCase()
      acc[lower] = key
      acc[key.replace(/_/g, " ")] = key
      return acc
    }, {})
    const baseType = types[0] ?? "code_improvements"
    const result = lines.reduce(
      (acc, line) => {
        const heading = line.match(/^(#{1,3}\s*)?([A-Za-z\s/]+)\s*[:\-]?\s*(.*)$/)
        if (heading) {
          const label = heading[2].trim().toLowerCase()
          const nextType = normalized[label]
          if (nextType) {
            const tail = heading[3].trim()
            if (!tail) return { ...acc, type: nextType }
            return {
              type: nextType,
              items: [...acc.items, { title: tail, type: nextType }],
            }
          }
        }
        const entry = line.replace(/^[-*\d.\s]+/, "").trim()
        if (!entry) return acc
        const chosen = types.includes(acc.type) ? acc.type : baseType
        return {
          ...acc,
          items: [...acc.items, { title: entry, type: chosen }],
        }
      },
      { type: baseType, items: [] },
    )
    return result.items.length ? result.items : parseList(text).map((entry) => ({ title: entry, type: baseType }))
  }

  const generateInsight = useCallback(async (text) => {
    const sessionID = await ensureSession()
    if (!sessionID) return []
    setActiveView("insights")
    setPrompt(text)
    await sendPrompt(text, sessionID)
    const data = await loadMessages(sessionID)
    return data
  }, [ensureSession, sendPrompt, loadMessages])

  const generateRoadmap = useCallback(
    (includeCompetitors) => {
      setRoadmapBusy(true)
      const base = "Generate an AI-powered roadmap for this project with phases and milestones."
      const promptText = includeCompetitors
        ? `${base} Include competitor analysis and differentiation.`
        : `${base} Generate roadmap without competitor analysis.`
      const cleanup = () => setRoadmapBusy(false)
      return generateInsight(promptText)
        .then((data) => {
          const latest = [...data].reverse().find((item) => item.info.role === "assistant")
          const content = latest
            ? latest.parts.filter((part) => part.type === "text").map((part) => part.text).join("\n")
            : ""
          const entries = parseRoadmapText(content, roadmap.phases)
          return Promise.all(entries.map((entry) => createFeature({ title: entry.title, phase: entry.phase })))
        })
        .finally(cleanup)
    },
    [generateInsight, roadmap.phases, createFeature],
  )

  const generateIdeation = useCallback(
    (types, maxIdeas) => {
      setIdeaBusy(true)
      const list = types.length
        ? types.map((item) => ideationLabels[item] ?? item).join(", ")
        : Object.values(ideationLabels).join(", ")
      const limit = Number.isFinite(maxIdeas) ? `Generate up to ${maxIdeas} ideas.` : ""
      const promptText = `Generate ideas for this project across: ${list}. ${limit} Provide concise bullet points.`
      const cleanup = () => setIdeaBusy(false)
      return generateInsight(promptText)
        .then((data) => {
          const latest = [...data].reverse().find((item) => item.info.role === "assistant")
          const content = latest
            ? latest.parts.filter((part) => part.type === "text").map((part) => part.text).join("\n")
            : ""
          const entries = parseIdeationText(content, types)
          const capped = Number.isFinite(maxIdeas) ? entries.slice(0, maxIdeas) : entries
          return Promise.all(capped.map((entry) => createIdea({ title: entry.title, type: entry.type })))
        })
        .finally(cleanup)
    },
    [generateInsight, createIdea],
  )

  const createTask = useCallback(async (payload) => {
    const response = await fetch("/app/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const task = await response.json()
    setTasks((items) => [task, ...items])
  }, [])

  const removeCompetitor = useCallback(async (competitorID) => {
    await fetch(`/app/insights/competitors/${competitorID}`, { method: "DELETE" })
    setCompetitors((items) => items.filter((item) => item.id !== competitorID))
  }, [])

  const refreshCompetitors = useCallback(async () => {
    const response = await fetch("/app/insights/competitors")
    const items = await response.json()
    setCompetitors(items)
  }, [])

  const createCompetitor = useCallback(async (payload) => {
    const response = await fetch("/app/insights/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setCompetitors((items) => [item, ...items])
  }, [])

  const addChangelog = useCallback(async (payload) => {
    const response = await fetch("/app/system/changelog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setChangelog((items) => [item, ...items])
  }, [])

  const addNotification = useCallback(async (payload) => {
    const response = await fetch("/app/system/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setNotifications((items) => [item, ...items])
  }, [])

  const dismissNotification = useCallback(async (noteID) => {
    const response = await fetch(`/app/system/notifications/${noteID}`, { method: "PATCH" })
    const item = await response.json()
    setNotifications((items) => items.map((note) => (note.id === item.id ? item : note)))
  }, [])

  const updateSystemSettings = useCallback(async (payload) => {
    const response = await fetch("/app/system/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setSystemSettings(item)
  }, [])

  const updateRateLimit = useCallback(async (payload) => {
    const response = await fetch("/app/system/limit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setRateLimit(item)
  }, [])

  const addGitHub = useCallback(async (payload) => {
    const response = await fetch("/app/integrations/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setGithubItems((items) => [item, ...items])
  }, [])

  const removeGitHub = useCallback(async (itemID) => {
    await fetch(`/app/integrations/github/${itemID}`, { method: "DELETE" })
    setGithubItems((items) => items.filter((item) => item.id !== itemID))
  }, [])

  const addGitLab = useCallback(async (payload) => {
    const response = await fetch("/app/integrations/gitlab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setGitlabItems((items) => [item, ...items])
  }, [])

  const removeGitLab = useCallback(async (itemID) => {
    await fetch(`/app/integrations/gitlab/${itemID}`, { method: "DELETE" })
    setGitlabItems((items) => items.filter((item) => item.id !== itemID))
  }, [])

  const addLinear = useCallback(async (payload) => {
    const response = await fetch("/app/integrations/linear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setLinearItems((items) => [item, ...items])
  }, [])

  const removeLinear = useCallback(async (itemID) => {
    await fetch(`/app/integrations/linear/${itemID}`, { method: "DELETE" })
    setLinearItems((items) => items.filter((item) => item.id !== itemID))
  }, [])

  const updateIntegrationConfig = useCallback(async (payload) => {
    const response = await fetch("/app/integrations/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const item = await response.json()
    setIntegrationConfig(item)
  }, [])

  const syncGitHub = useCallback(async () => {
    const response = await fetch("/app/integrations/github/sync", { method: "POST" })
    const items = await response.json()
    setGithubItems(items)
  }, [])

  const syncGitLab = useCallback(async () => {
    const response = await fetch("/app/integrations/gitlab/sync", { method: "POST" })
    const items = await response.json()
    setGitlabItems(items)
  }, [])

  const syncLinear = useCallback(async () => {
    const response = await fetch("/app/integrations/linear/sync", { method: "POST" })
    const items = await response.json()
    setLinearItems(items)
  }, [])

  const updateTask = useCallback(async (taskID, payload) => {
    const response = await fetch(`/app/kanban/${taskID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const task = await response.json()
    setTasks((items) => items.map((item) => (item.id === task.id ? task : item)))
  }, [])

  const moveTask = useCallback(async (taskID, status) => {
    const response = await fetch(`/app/kanban/${taskID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const task = await response.json()
    setTasks((items) => items.map((item) => (item.id === task.id ? task : item)))
  }, [])

  const createFeature = useCallback(async (payload) => {
    const response = await fetch("/app/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const feature = await response.json()
    setRoadmap((current) => ({
      ...current,
      features: [feature, ...current.features],
    }))
  }, [])

  const toggleFeature = useCallback(async (featureID, status) => {
    const response = await fetch(`/app/roadmap/${featureID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const feature = await response.json()
    setRoadmap((current) => ({
      ...current,
      features: current.features.map((item) => (item.id === feature.id ? feature : item)),
    }))
  }, [])

  const exportRoadmap = useCallback(async (format) => {
    const response = await fetch(`/app/roadmap/export?format=${format}`)
    const content = format === "json" ? JSON.stringify(await response.json(), null, 2) : await response.text()
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `roadmap.${format === "md" ? "md" : format}`
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  const createIdea = useCallback(async (payload) => {
    const response = await fetch("/app/ideation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const idea = await response.json()
    setIdeas((items) => [idea, ...items])
  }, [])

  const updateIdea = useCallback(async (ideaID, status) => {
    const response = await fetch(`/app/ideation/${ideaID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const idea = await response.json()
    setIdeas((items) => items.map((item) => (item.id === idea.id ? idea : item)))
  }, [])

  const convertIdea = useCallback(async (ideaID) => {
    const response = await fetch(`/app/ideation/${ideaID}/convert`, { method: "POST" })
    const result = await response.json()
    setIdeas((items) => items.map((item) => (item.id === result.idea.id ? result.idea : item)))
    setTasks((items) => [result.task, ...items])
  }, [])

  const addMemory = useCallback(async (payload) => {
    const response = await fetch("/app/context/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const memory = await response.json()
    setMemories((items) => [memory, ...items])
  }, [])

  const searchIndex = useCallback(async (query) => {
    const url = new URL("/app/context/index", window.location.origin)
    if (query) url.searchParams.set("query", query)
    const response = await fetch(url.toString())
    const items = await response.json()
    setIndexItems(items)
  }, [])

  const searchMemories = useCallback(async (query) => {
    const url = new URL("/app/context/memories", window.location.origin)
    if (query) url.searchParams.set("query", query)
    const response = await fetch(url.toString())
    const items = await response.json()
    setMemories(items)
  }, [])

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
            onRefreshProjects={refreshProjects}
            onUpdateProject={updateProject}
            onAddProject={addProject}
            onRefreshWorktrees={refreshWorktrees}
            onCreateWorktree={createWorktree}
            onBrowse={loadFiles}
            onSetPath={setPath}
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

      <div className={`flex-1 transition-all duration-300 overflow-hidden ${sidebarOpen ? "ml-72" : "ml-16"}`}>
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="p-2 gradient-bg rounded-lg text-white">🧠</div>
            <div>
              <h1 className="text-xl font-bold">OpenCode Auto Interface</h1>
              <p className="text-sm text-gray-500">Professional AI Development Environment</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{renderView()}</main>
      </div>

      <TaskWizard open={wizard} onClose={() => setWizard(false)} onSubmit={createTask} />
      <TaskEditDialog task={editing} onClose={() => setEditing(null)} onSave={updateTask} />
      <FileDrawer task={drawer} onClose={() => setDrawer(null)} />
    </div>
  )
}

export default App
