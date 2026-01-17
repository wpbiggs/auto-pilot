import { createSignal, createMemo, For, Show } from "solid-js"
import { useParams, useNavigate, useSearchParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"
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
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  
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

  const startAutoExecution = async () => {
    setIsAutoExecuting(true)
    
    // Simulate auto-execution
    const backlogTasks = tasksByColumn()["backlog"]
    for (const task of backlogTasks.slice(0, 2)) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const agents = ["Claude 3.5 Sonnet", "GPT-4 Turbo", "Gemini Pro"]
      const randomAgent = agents[Math.floor(Math.random() * agents.length)]
      
      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, assignedAgent: randomAgent, status: "in-progress", progress: 0 }
          : t
      ))
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
                          getPriorityColor={getPriorityColor}
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
  getPriorityColor: (priority: string) => string
}) {
  const sortable = createSortable(props.task.id)
  
  const agents = ["Claude 3.5 Sonnet", "GPT-4 Turbo", "Gemini Pro", "Claude 3 Opus"]
  
  return (
    <div
      ref={sortable.ref}
      class={`p-3 bg-card border-l-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${props.getPriorityColor(props.task.priority)}`}
      classList={{ "opacity-25": sortable.isActiveDraggable }}
    >
      <div class="flex items-start justify-between mb-2">
        <h4 class="font-medium text-sm line-clamp-2">{props.task.title}</h4>
        <span class="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          {props.task.priority}
        </span>
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
