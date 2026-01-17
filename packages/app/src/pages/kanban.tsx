import { createSignal, createMemo, createEffect, For, Show } from "solid-js"
import { useParams, useNavigate, useSearchParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"
import { useWorkflow } from "@/context/workflow"
import { useGlobalSync } from "@/context/global-sync"
import { useGlobalSDK } from "@/context/global-sdk"
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  closestCenter,
  createSortable,
} from "@thisbeyond/solid-dnd"
import type { DragEvent } from "@thisbeyond/solid-dnd"

interface Task {
  id: string
  title: string
  description: string
  status: "backlog" | "in-progress" | "model-review" | "human-review" | "done"
  priority: "low" | "medium" | "high" | "critical"
  assignedAgent?: string
  progress: number
  estimatedTime?: string
  dependencies?: string[]
  createdAt: Date
  tags: string[]
}

interface Column {
  id: string
  title: string
  status: Task["status"]
  color: string
}

const columns: Column[] = [
  { id: "backlog", title: "Backlog", status: "backlog", color: "gray" },
  { id: "in-progress", title: "In Progress", status: "in-progress", color: "blue" },
  { id: "model-review", title: "Model Review", status: "model-review", color: "purple" },
  { id: "human-review", title: "Human Review", status: "human-review", color: "orange" },
  { id: "done", title: "Done", status: "done", color: "green" },
]

export default function KanbanPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [workflowStore, workflowActions] = useWorkflow()
  const globalSync = useGlobalSync()
  const sdk = useGlobalSDK()
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  const [store] = globalSync.child(directory())
  const [importedFromRoadmap, setImportedFromRoadmap] = createSignal(false)
  
  const [tasks, setTasks] = createSignal<Task[]>([
    {
      id: "1",
      title: "Implement user authentication",
      description: "Add OAuth2 login with Google and GitHub providers",
      status: "in-progress",
      priority: "high",
      assignedAgent: "Claude 3.5 Sonnet",
      progress: 75,
      estimatedTime: "15 min",
      createdAt: new Date(),
      tags: ["auth", "security"],
    },
    {
      id: "2",
      title: "Design database schema",
      description: "Create PostgreSQL schema for users, projects, and tasks",
      status: "model-review",
      priority: "high",
      assignedAgent: "GPT-4 Turbo",
      progress: 100,
      createdAt: new Date(Date.now() - 86400000),
      tags: ["database", "backend"],
    },
    {
      id: "3",
      title: "Build REST API endpoints",
      description: "Create CRUD endpoints for all main resources",
      status: "backlog",
      priority: "high",
      progress: 0,
      createdAt: new Date(),
      tags: ["api", "backend"],
    },
    {
      id: "4",
      title: "Add dark mode support",
      description: "Implement theme switching with system preference detection",
      status: "done",
      priority: "medium",
      assignedAgent: "GPT-4",
      progress: 100,
      createdAt: new Date(Date.now() - 172800000),
      tags: ["ui", "theme"],
    },
    {
      id: "5",
      title: "Write API documentation",
      description: "Generate OpenAPI docs and create developer guide",
      status: "in-progress",
      priority: "medium",
      assignedAgent: "Claude 3.5 Sonnet",
      progress: 40,
      estimatedTime: "30 min",
      createdAt: new Date(),
      tags: ["docs"],
    },
    {
      id: "6",
      title: "Fix memory leak in parser",
      description: "Investigate and fix memory leak reported in issue #234",
      status: "human-review",
      priority: "critical",
      assignedAgent: "Claude 3.5 Opus",
      progress: 100,
      createdAt: new Date(Date.now() - 43200000),
      tags: ["bug", "performance"],
    },
    {
      id: "7",
      title: "Add unit tests for auth module",
      description: "Write comprehensive tests for authentication flows",
      status: "backlog",
      priority: "medium",
      progress: 0,
      dependencies: ["1"],
      createdAt: new Date(),
      tags: ["testing", "auth"],
    },
  ])

  const [newTaskTitle, setNewTaskTitle] = createSignal("")
  const [selectedColumn, setSelectedColumn] = createSignal<string>("backlog")
  const [isAutoExecuting, setIsAutoExecuting] = createSignal(false)
  const [draggedTask, setDraggedTask] = createSignal<Task | null>(null)
  const [selectedTasks, setSelectedTasks] = createSignal<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = createSignal(false)

  // Import tasks from roadmap workflow when coming from roadmap page
  createEffect(() => {
    if (searchParams.fromRoadmap && !importedFromRoadmap() && workflowStore.roadmapItems.length > 0) {
      // Populate kanban from roadmap items
      const newTasks = workflowActions.populateKanbanFromRoadmap()
      
      // Add new tasks to local state
      const localTasks: Task[] = newTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assignedAgent: t.assignedAgent,
        progress: t.progress,
        estimatedTime: undefined,
        dependencies: t.dependencies,
        createdAt: new Date(t.createdAt),
        tags: t.tags,
      }))
      
      setTasks(prev => [...prev, ...localTasks])
      setImportedFromRoadmap(true)
    }
  })

  const tasksByColumn = createMemo(() => {
    const grouped: Record<string, Task[]> = {}
    for (const col of columns) {
      grouped[col.status] = tasks().filter(t => t.status === col.status)
    }
    return grouped
  })

  const stats = createMemo(() => ({
    total: tasks().length,
    backlog: tasksByColumn()["backlog"]?.length || 0,
    inProgress: tasksByColumn()["in-progress"]?.length || 0,
    done: tasksByColumn()["done"]?.length || 0,
    activeAgents: tasks().filter(t => t.assignedAgent && t.status === "in-progress").length,
  }))

  const addTask = () => {
    if (!newTaskTitle().trim()) return
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle(),
      description: "",
      status: selectedColumn() as Task["status"],
      priority: "medium",
      progress: 0,
      createdAt: new Date(),
      tags: [],
    }
    
    setTasks(prev => [...prev, newTask])
    setNewTaskTitle("")
  }

  const moveTask = (taskId: string, newStatus: Task["status"]) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, progress: newStatus === "done" ? 100 : task.progress }
        : task
    ))
  }

  const assignAgent = (taskId: string, agent: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, assignedAgent: agent, status: "in-progress" } : task
    ))
  }

  const updateTaskTitle = (taskId: string, title: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, title } : task
    ))
  }

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      setShowBulkActions(newSet.size > 0)
      return newSet
    })
  }

  const bulkMoveSelectedTasks = (newStatus: Task["status"]) => {
    setTasks(prev => prev.map(task =>
      selectedTasks().has(task.id)
        ? { ...task, status: newStatus, progress: newStatus === "done" ? 100 : task.progress }
        : task
    ))
    setSelectedTasks(new Set<string>())
    setShowBulkActions(false)
  }

  const bulkDeleteSelectedTasks = () => {
    setTasks(prev => prev.filter(task => !selectedTasks().has(task.id)))
    setSelectedTasks(new Set<string>())
    setShowBulkActions(false)
  }

  const bulkAssignAgent = (agent: string) => {
    setTasks(prev => prev.map(task =>
      selectedTasks().has(task.id)
        ? { ...task, assignedAgent: agent, status: "in-progress" }
        : task
    ))
    setSelectedTasks(new Set<string>())
    setShowBulkActions(false)
  }

  const startAutoExecution = async () => {
    setIsAutoExecuting(true)
    
    const dir = directory()
    if (!dir) {
      setIsAutoExecuting(false)
      return
    }
    
    // Get available agents from store
    const availableAgents = store.agent || []
    
    // Get backlog tasks to execute
    const backlogTasks = tasksByColumn()["backlog"]
    
    for (const task of backlogTasks.slice(0, 3)) {
      try {
        // Select an agent (prefer first available, or use from configured agents)
        const agentName = availableAgents.length > 0 
          ? availableAgents[Math.floor(Math.random() * availableAgents.length)].name 
          : undefined
        
        // Create a session via SDK client
        const response = await sdk.client.session.create({
          directory: dir,
          title: task.title,
        })
        
        if (response.data) {
          // Update task to in-progress with the assigned agent
          setTasks(prev => prev.map(t => 
            t.id === task.id 
              ? { 
                  ...t, 
                  assignedAgent: agentName || "AI Agent", 
                  status: "in-progress" as const, 
                  progress: 10,
                  estimatedTime: "Processing..."
                }
              : t
          ))
          
          // Navigate to the session to start the task
          navigate(`/${params.dir}/session/${response.data.id}`)
          return // For now, just start one session and navigate to it
        }
      } catch (error) {
        console.error("Failed to start auto execution for task:", task.id, error)
        // Mark as failed or keep in backlog
      }
      
      // Small delay between task starts
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsAutoExecuting(false)
  }

  const onDragStart = ({ draggable }: DragEvent) => {
    const task = tasks().find(t => t.id === draggable.id)
    setDraggedTask(task || null)
  }

  const onDragEnd = ({ draggable, droppable }: DragEvent) => {
    setDraggedTask(null)
    if (droppable) {
      const columnId = droppable.id as Task["status"]
      moveTask(draggable.id as string, columnId)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "border-l-red-500"
      case "high": return "border-l-orange-500"
      case "medium": return "border-l-yellow-500"
      case "low": return "border-l-green-500"
      default: return "border-l-gray-500"
    }
  }

  const getColumnHeaderColor = (color: string) => {
    switch (color) {
      case "gray": return "bg-gray-100 dark:bg-gray-800"
      case "blue": return "bg-blue-100 dark:bg-blue-900"
      case "purple": return "bg-purple-100 dark:bg-purple-900"
      case "orange": return "bg-orange-100 dark:bg-orange-900"
      case "green": return "bg-green-100 dark:bg-green-900"
      default: return "bg-gray-100 dark:bg-gray-800"
    }
  }

  return (
    <div class="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div class="border-b border-border bg-card p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold">Kanban Board</h1>
            <p class="text-sm text-muted-foreground">{directory()}</p>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(`/${params.dir}/workspace`)}>
              <Icon name="arrow-left" class="size-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={startAutoExecution} 
              disabled={isAutoExecuting() || stats().backlog === 0}
            >
              <Show when={isAutoExecuting()} fallback={
                <>
                  <Icon name="enter" class="size-4 mr-2" />
                  Start Auto Execution
                </>
              }>
                <Spinner class="size-4 mr-2" />
                Executing...
              </Show>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div class="flex items-center gap-6 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">Total:</span>
            <span class="font-semibold">{stats().total}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-gray-400 rounded-full" />
            <span class="text-muted-foreground">Backlog:</span>
            <span class="font-semibold">{stats().backlog}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span class="text-muted-foreground">In Progress:</span>
            <span class="font-semibold">{stats().inProgress}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-green-500 rounded-full" />
            <span class="text-muted-foreground">Done:</span>
            <span class="font-semibold">{stats().done}</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="mcp" class="size-4 text-purple-500" />
            <span class="text-muted-foreground">Active Agents:</span>
            <span class="font-semibold">{stats().activeAgents}</span>
          </div>
        </div>
      </div>

      {/* Add Task Bar */}
      <div class="border-b border-border bg-muted/30 p-4 flex items-center gap-4">
        <select 
          class="px-3 py-2 rounded-md border border-border bg-background text-sm"
          value={selectedColumn()}
          onChange={(e) => setSelectedColumn(e.currentTarget.value)}
        >
          <For each={columns}>
            {(col) => <option value={col.status}>{col.title}</option>}
          </For>
        </select>
        <input
          type="text"
          placeholder="Add new task..."
          value={newTaskTitle()}
          onInput={(e) => setNewTaskTitle(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          class="flex-1 px-4 py-2 rounded-md border border-border bg-background"
        />
        <Button onClick={addTask} disabled={!newTaskTitle().trim()}>
          <Icon name="plus" class="size-4 mr-2" />
          Add Task
        </Button>
        <Button variant="ghost" onClick={() => navigate(`/${params.dir}/task-wizard`)}>
          <Icon name="brain" class="size-4 mr-2" />
          Task Wizard
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      <Show when={showBulkActions()}>
        <div class="border-b border-border bg-blue-50 dark:bg-blue-950 p-3 flex items-center gap-4">
          <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedTasks().size} task(s) selected
          </span>
          <div class="flex items-center gap-2">
            <select
              class="px-2 py-1 rounded border border-border bg-background text-sm"
              onChange={(e) => {
                if (e.currentTarget.value) {
                  bulkMoveSelectedTasks(e.currentTarget.value as Task["status"])
                  e.currentTarget.value = ""
                }
              }}
            >
              <option value="">Move to...</option>
              <For each={columns}>
                {(col) => <option value={col.status}>{col.title}</option>}
              </For>
            </select>
            <select
              class="px-2 py-1 rounded border border-border bg-background text-sm"
              onChange={(e) => {
                if (e.currentTarget.value) {
                  bulkAssignAgent(e.currentTarget.value)
                  e.currentTarget.value = ""
                }
              }}
            >
              <option value="">Assign to...</option>
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              <option value="GPT-4 Turbo">GPT-4 Turbo</option>
              <option value="Gemini Pro">Gemini Pro</option>
              <option value="Claude 3 Opus">Claude 3 Opus</option>
            </select>
            <Button 
              variant="ghost" 
              size="small" 
              class="text-red-500 hover:bg-red-100 dark:hover:bg-red-950"
              onClick={bulkDeleteSelectedTasks}
            >
              <Icon name="close" class="size-4 mr-1" />
              Delete
            </Button>
            <Button 
              variant="ghost" 
              size="small"
              onClick={() => {
                setSelectedTasks(new Set<string>())
                setShowBulkActions(false)
              }}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </Show>

      {/* Kanban Board */}
      <div class="flex-1 overflow-x-auto p-4">
        <DragDropProvider onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetector={closestCenter}>
          <DragDropSensors />
          <div class="flex gap-4 h-full min-w-max">
            <For each={columns}>
              {(column) => (
                <div 
                  class="w-80 flex flex-col bg-muted/30 rounded-lg"
                  id={column.status}
                >
                  <div class={`p-3 rounded-t-lg ${getColumnHeaderColor(column.color)}`}>
                    <div class="flex items-center justify-between">
                      <h3 class="font-semibold">{column.title}</h3>
                      <span class="text-sm text-muted-foreground">
                        {tasksByColumn()[column.status]?.length || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div class="flex-1 p-2 space-y-2 overflow-y-auto min-h-[400px]">
                    <For each={tasksByColumn()[column.status]}>
                      {(task) => (
                        <TaskCard 
                          task={task} 
                          onMove={moveTask}
                          onAssign={assignAgent}
                          onUpdateTitle={updateTaskTitle}
                          onDelete={deleteTask}
                          getPriorityColor={getPriorityColor}
                          isSelected={selectedTasks().has(task.id)}
                          onToggleSelect={toggleTaskSelection}
                        />
                      )}
                    </For>
                    
                    <Show when={(tasksByColumn()[column.status]?.length || 0) === 0}>
                      <div class="text-center py-8 text-muted-foreground text-sm">
                        No tasks
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
          
          <DragOverlay>
            <Show when={draggedTask()}>
              <div class="w-80 p-3 bg-card border border-border rounded-lg shadow-lg opacity-90">
                <h4 class="font-medium">{draggedTask()!.title}</h4>
              </div>
            </Show>
          </DragOverlay>
        </DragDropProvider>
      </div>
    </div>
  )
}

function TaskCard(props: {
  task: Task
  onMove: (taskId: string, status: Task["status"]) => void
  onAssign: (taskId: string, agent: string) => void
  onUpdateTitle: (taskId: string, title: string) => void
  onDelete: (taskId: string) => void
  getPriorityColor: (priority: string) => string
  isSelected: boolean
  onToggleSelect: (taskId: string) => void
}) {
  const sortable = createSortable(props.task.id)
  const [isEditing, setIsEditing] = createSignal(false)
  const [editTitle, setEditTitle] = createSignal(props.task.title)
  const [showMenu, setShowMenu] = createSignal(false)
  
  const agents = ["Claude 3.5 Sonnet", "GPT-4 Turbo", "Gemini Pro", "Claude 3 Opus"]
  
  const handleSaveTitle = () => {
    if (editTitle().trim() && editTitle() !== props.task.title) {
      props.onUpdateTitle(props.task.id, editTitle())
    }
    setIsEditing(false)
  }
  
  return (
    <div
      ref={sortable.ref}
      class={`p-3 bg-card border-l-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${props.getPriorityColor(props.task.priority)} ${props.isSelected ? "ring-2 ring-blue-500" : ""}`}
      classList={{ "opacity-25": sortable.isActiveDraggable }}
    >
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={props.isSelected}
            onChange={() => props.onToggleSelect(props.task.id)}
            class="size-4 rounded border-border"
            onClick={(e) => e.stopPropagation()}
          />
          <Show when={isEditing()} fallback={
            <h4 
              class="font-medium text-sm line-clamp-2 cursor-pointer hover:text-blue-500 flex-1"
              onDblClick={() => {
                setEditTitle(props.task.title)
                setIsEditing(true)
              }}
            >
              {props.task.title}
            </h4>
          }>
            <input
              type="text"
              value={editTitle()}
              onInput={(e) => setEditTitle(e.currentTarget.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle()
                if (e.key === "Escape") setIsEditing(false)
              }}
              class="flex-1 px-1 py-0.5 text-sm border border-border rounded bg-background"
              autofocus
            />
          </Show>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {props.task.priority}
          </span>
          <div class="relative">
            <button 
              class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              onClick={() => setShowMenu(!showMenu())}
            >
              <Icon name="menu" class="size-3" />
            </button>
            <Show when={showMenu()}>
              <div class="absolute right-0 top-6 z-10 bg-card border border-border rounded-lg shadow-lg py-1 min-w-32">
                <button 
                  class="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    setEditTitle(props.task.title)
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                >
                  <Icon name="code" class="size-3" />
                  Edit
                </button>
                <button 
                  class="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                  onClick={() => {
                    props.onDelete(props.task.id)
                    setShowMenu(false)
                  }}
                >
                  <Icon name="close" class="size-3" />
                  Delete
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>
      
      <Show when={props.task.description}>
        <p class="text-xs text-muted-foreground mb-2 line-clamp-2">{props.task.description}</p>
      </Show>

      <Show when={props.task.tags.length > 0}>
        <div class="flex gap-1 mb-2 flex-wrap">
          <For each={props.task.tags.slice(0, 2)}>
            {(tag) => (
              <span class="text-xs px-1.5 py-0.5 rounded-full bg-muted">
                {tag}
              </span>
            )}
          </For>
          <Show when={props.task.tags.length > 2}>
            <span class="text-xs text-muted-foreground">+{props.task.tags.length - 2}</span>
          </Show>
        </div>
      </Show>
      
      <Show when={props.task.assignedAgent}>
        <div class="flex items-center gap-2 mb-2">
          <Icon name="mcp" class="size-3 text-purple-500" />
          <span class="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {props.task.assignedAgent}
          </span>
        </div>
      </Show>
      
      <Show when={props.task.status === "in-progress" && props.task.progress !== undefined}>
        <div class="mb-2">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-muted-foreground">Progress</span>
            <span class="font-medium">{props.task.progress}%</span>
          </div>
          <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div 
              class="h-full bg-blue-500 rounded-full transition-all" 
              style={{ width: `${props.task.progress}%` }} 
            />
          </div>
          <Show when={props.task.estimatedTime}>
            <p class="text-xs text-muted-foreground mt-1">~{props.task.estimatedTime} remaining</p>
          </Show>
        </div>
      </Show>
      
      <Show when={!props.task.assignedAgent && props.task.status === "backlog"}>
        <select
          class="w-full text-xs px-2 py-1.5 rounded border border-border bg-background mt-2"
          onChange={(e) => {
            if (e.currentTarget.value) {
              props.onAssign(props.task.id, e.currentTarget.value)
            }
          }}
        >
          <option value="">Assign Agent...</option>
          <For each={agents}>
            {(agent) => <option value={agent}>{agent}</option>}
          </For>
        </select>
      </Show>
      
      <Show when={props.task.dependencies && props.task.dependencies.length > 0}>
        <div class="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Icon name="branch" class="size-3" />
          <span>Depends on {props.task.dependencies!.length} task(s)</span>
        </div>
      </Show>
    </div>
  )
}
