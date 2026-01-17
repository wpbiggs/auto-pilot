import { createSignal, createMemo, For, Show, onMount, onCleanup } from "solid-js"
import { A, useNavigate, useParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { useGlobalSync } from "@/context/global-sync"
import { useLayout } from "@/context/layout"
import { base64Decode } from "@opencode-ai/util/encode"
import { ActiveAgentsPanel } from "@/components/active-agents-panel"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  href: string
  primary?: boolean
}

interface ExecutionPulse {
  tasksCompleted: number
  ideasInPipeline: number
  roadmapProgress: number
  activeAgents: number
  estimatedCompletion: string
}

interface SessionActivity {
  busy: number
  idle: number
  retrying: number
  completed: number
}

interface ProjectHealth {
  velocity: number
  successRate: number
  blockers: number
}

export default function WorkspacePage() {
  const params = useParams()
  const navigate = useNavigate()
  const globalSync = useGlobalSync()
  const layout = useLayout()
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  
  // Get real SDK data from globalSync
  const [store] = createMemo(() => {
    const dir = directory()
    if (!dir) return [{ agent: [], session: [], session_status: {} }]
    return globalSync.child(dir)
  })()
  
  // Derive session activity from real data
  const sessionActivity = createMemo(() => {
    const sessions = store.session || []
    const statuses = (store.session_status || {}) as Record<string, { type: string }>
    
    let busy = 0, idle = 0, retrying = 0, completed = 0
    
    for (const session of sessions) {
      const status = statuses[session.id]
      if (!status) {
        idle++
        continue
      }
      switch (status.type) {
        case "busy": busy++; break
        case "idle": idle++; break
        case "retry": retrying++; break
        default: completed++
      }
    }
    
    return { busy, idle, retrying, completed }
  })
  
  const [executionPulse, setExecutionPulse] = createSignal<ExecutionPulse>({
    tasksCompleted: sessionActivity().completed,
    ideasInPipeline: 8,
    roadmapProgress: 35,
    activeAgents: sessionActivity().busy,
    estimatedCompletion: "2 hours",
  })
  
  const [projectHealth, setProjectHealth] = createSignal<ProjectHealth>({
    velocity: 4.2,
    successRate: 94,
    blockers: 1,
  })

  const [recentTasks, setRecentTasks] = createSignal([
    { id: "1", title: "Implement user authentication", status: "in-progress", agent: "Claude 3.5", progress: 75 },
    { id: "2", title: "Add dark mode support", status: "completed", agent: "GPT-4", progress: 100 },
    { id: "3", title: "Fix memory leak in parser", status: "queued", agent: "Pending", progress: 0 },
    { id: "4", title: "Create API documentation", status: "in-progress", agent: "Claude 3.5", progress: 40 },
  ])

  const quickActions: QuickAction[] = [
    {
      id: "new-idea",
      title: "Start New Project from Idea",
      description: "Share your idea and let AI generate a complete roadmap",
      icon: "brain",
      href: "ideation",
      primary: true,
    },
    {
      id: "kanban",
      title: "View Kanban Board",
      description: "Manage tasks across all stages",
      icon: "task",
      href: "kanban",
    },
    {
      id: "roadmap",
      title: "Project Roadmap",
      description: "View and plan project phases",
      icon: "checklist",
      href: "roadmap",
    },
    {
      id: "agents",
      title: "Agent Tools",
      description: "Configure and monitor AI agents",
      icon: "mcp",
      href: "agents",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-500"
      case "in-progress": return "text-blue-500"
      case "queued": return "text-yellow-500"
      case "failed": return "text-red-500"
      default: return "text-gray-500"
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in-progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "queued": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div class="flex-1 overflow-auto bg-background">
      <div class="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">Workspace Dashboard</h1>
            <p class="text-muted-foreground mt-1">
              {directory() || "Select a project to get started"}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(`/${params.dir}/insights`)}>
              <Icon name="code-lines" class="mr-2 size-4" />
              Insights
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/${params.dir}/settings`)}>
              <Icon name="settings-gear" class="mr-2 size-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <For each={quickActions}>
            {(action) => (
              <A href={`/${params.dir}/${action.href}`} class="block">
                <Card 
                  class={`p-4 h-full transition-all hover:shadow-lg cursor-pointer ${
                    action.primary 
                      ? "bg-primary/10 border-primary hover:bg-primary/20" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div class="flex items-start gap-3">
                    <div class={`p-2 rounded-lg ${action.primary ? "bg-primary/20" : "bg-muted"}`}>
                      <Icon name={action.icon as any} class={`size-5 ${action.primary ? "text-primary" : ""}`} />
                    </div>
                    <div class="flex-1">
                      <h3 class={`font-semibold ${action.primary ? "text-primary" : ""}`}>
                        {action.title}
                      </h3>
                      <p class="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </A>
            )}
          </For>
        </div>

        {/* Execution Pulse */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Metrics */}
          <Card class="p-6 lg:col-span-2">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold">Execution Pulse</h2>
              <span class="text-sm text-muted-foreground flex items-center gap-2">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p class="text-sm text-muted-foreground">Tasks Completed</p>
                <p class="text-3xl font-bold text-green-500">{executionPulse().tasksCompleted}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Ideas in Pipeline</p>
                <p class="text-3xl font-bold text-blue-500">{executionPulse().ideasInPipeline}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Roadmap Progress</p>
                <p class="text-3xl font-bold text-purple-500">{executionPulse().roadmapProgress}%</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Active Agents</p>
                <p class="text-3xl font-bold text-orange-500">{executionPulse().activeAgents}</p>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t border-border">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Estimated completion</span>
                <span class="font-medium">{executionPulse().estimatedCompletion}</span>
              </div>
            </div>
          </Card>

          {/* Session Activity */}
          <Card class="p-6">
            <h2 class="text-xl font-semibold mb-6">Session Activity</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  Busy
                </span>
                <span class="font-semibold">{sessionActivity().busy}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <span class="w-3 h-3 bg-gray-400 rounded-full" />
                  Idle
                </span>
                <span class="font-semibold">{sessionActivity().idle}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <span class="w-3 h-3 bg-yellow-500 rounded-full" />
                  Retrying
                </span>
                <span class="font-semibold">{sessionActivity().retrying}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <span class="w-3 h-3 bg-green-500 rounded-full" />
                  Completed
                </span>
                <span class="font-semibold">{sessionActivity().completed}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Agents & Recent Tasks */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Agents Panel - Real-time SDK data */}
          <ActiveAgentsPanel
            sessions={store.session || []}
            agents={store.agent || []}
            sessionStatus={store.session_status || {}}
            onViewSession={(sessionId) => navigate(`/${params.dir}/agents?session=${sessionId}`)}
          />

          {/* Recent Tasks */}
          <Card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Recent Tasks</h2>
              <Button variant="ghost" size="small" onClick={() => navigate(`/${params.dir}/kanban`)}>
                View All
              </Button>
            </div>
            <div class="space-y-3">
              <For each={recentTasks()}>
                {(task) => (
                  <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div class="flex-1">
                      <p class="font-medium">{task.title}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                        <span class="text-xs text-muted-foreground">{task.agent}</span>
                      </div>
                    </div>
                    <div class="w-24">
                      <div class="flex items-center justify-end gap-2">
                        <span class="text-sm font-medium">{task.progress}%</span>
                      </div>
                      <div class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                        <div 
                          class={`h-full rounded-full ${
                            task.status === "completed" ? "bg-green-500" :
                            task.status === "in-progress" ? "bg-blue-500" : "bg-gray-400"
                          }`} 
                          style={{ width: `${task.progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Card>
        </div>

        {/* Project Health */}
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-6">Project Health</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-muted/30 rounded-lg">
              <p class="text-sm text-muted-foreground mb-2">Velocity</p>
              <p class="text-4xl font-bold text-blue-500">{projectHealth().velocity}</p>
              <p class="text-xs text-muted-foreground mt-1">tasks/day</p>
            </div>
            <div class="text-center p-4 bg-muted/30 rounded-lg">
              <p class="text-sm text-muted-foreground mb-2">Success Rate</p>
              <p class="text-4xl font-bold text-green-500">{projectHealth().successRate}%</p>
              <p class="text-xs text-muted-foreground mt-1">passed reviews</p>
            </div>
            <div class="text-center p-4 bg-muted/30 rounded-lg">
              <p class="text-sm text-muted-foreground mb-2">Blockers</p>
              <p class="text-4xl font-bold text-red-500">{projectHealth().blockers}</p>
              <p class="text-xs text-muted-foreground mt-1">active issues</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
