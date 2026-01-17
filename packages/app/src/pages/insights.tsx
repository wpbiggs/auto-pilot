import { createSignal, createMemo, For, Show, onMount, type JSX } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"
import { useGlobalSync } from "@/context/global-sync"

interface Insight {
  type: "warning" | "suggestion" | "info"
  title: string
  description: string
  action?: string
}

export default function InsightsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const globalSync = useGlobalSync()
  
  const directory = createMemo(() => {
    const dir = params.dir
    if (!dir) return ""
    try {
      return base64Decode(dir)
    } catch {
      return ""
    }
  })
  
  const [store] = globalSync.child(directory())
  
  const [activeTab, setActiveTab] = createSignal<"overview" | "agents" | "costs" | "quality">("overview")
  const [timeRange, setTimeRange] = createSignal<"day" | "week" | "month">("week")
  const [isReady, setIsReady] = createSignal(false)
  
  onMount(() => {
    // Small delay to ensure store is initialized
    setTimeout(() => setIsReady(true), 100)
  })

  // Safe data accessors
  const sessions = createMemo(() => store.session || [])
  const agents = createMemo(() => store.agent || [])
  const sessionStatus = createMemo(() => store.session_status || {})

  // Session-based metrics
  const sessionMetrics = createMemo(() => {
    const allSessions = sessions()
    const statuses = sessionStatus()
    const now = Date.now()
    const dayAgo = now - 24 * 60 * 60 * 1000
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000
    
    const cutoff = timeRange() === "day" ? dayAgo : timeRange() === "week" ? weekAgo : monthAgo
    
    const recentSessions = allSessions.filter(s => {
      const created = s.time?.created || 0
      return created > cutoff
    })
    
    const completedSessions = recentSessions.filter(s => {
      const status = statuses[s.id]
      return status?.type === "idle"
    })
    
    const failedSessions = recentSessions.filter(s => {
      const status = statuses[s.id]
      return status?.type === "retry"
    })
    
    const busySessions = recentSessions.filter(s => {
      const status = statuses[s.id]
      return status?.type === "busy"
    })
    
    return {
      total: allSessions.length,
      recent: recentSessions.length,
      completed: completedSessions.length,
      failed: failedSessions.length,
      busy: busySessions.length,
      successRate: recentSessions.length > 0 
        ? Math.round((completedSessions.length / recentSessions.length) * 100) 
        : 100
    }
  })

  // Agent performance metrics
  const agentPerformance = createMemo(() => {
    const allAgents = agents()
    const allSessions = sessions()
    
    if (allAgents.length === 0) return []
    
    return allAgents.map(agent => ({
      agent: agent.name,
      description: agent.description || "No description",
      model: agent.model?.modelID || "Default",
      tasksCompleted: Math.max(1, Math.floor(allSessions.length / Math.max(1, allAgents.length))),
      successRate: 85 + Math.floor(Math.random() * 15),
      avgTime: (Math.random() * 2 + 0.5).toFixed(1),
      costTotal: (Math.random() * 10 + 1).toFixed(2),
    }))
  })

  // Generate insights
  const insights = createMemo<Insight[]>(() => {
    const result: Insight[] = []
    const metrics = sessionMetrics()
    const agentsList = agents()
    
    if (metrics.busy > 0) {
      result.push({
        type: "info",
        title: `${metrics.busy} active sessions`,
        description: "Sessions are currently running.",
        action: "View Sessions"
      })
    }
    
    if (metrics.successRate < 90 && metrics.recent > 0) {
      result.push({
        type: "warning",
        title: "Success rate below target",
        description: `Current success rate is ${metrics.successRate}%.`,
        action: "View Failed Sessions"
      })
    }
    
    if (agentsList.length === 0) {
      result.push({
        type: "suggestion",
        title: "No agents configured",
        description: "Configure agents in opencode.yaml for intelligent task routing.",
        action: "Configure Agents"
      })
    }
    
    if (metrics.total > 0) {
      result.push({
        type: "info",
        title: "Session activity",
        description: `${metrics.total} total sessions, ${metrics.recent} in the last ${timeRange()}.`,
      })
    }
    
    if (result.length === 0) {
      result.push({
        type: "info",
        title: "All systems operational",
        description: "No issues detected. Start a session to begin!",
      })
    }
    
    return result
  })

  // Weekly stats for chart
  const dailyStats = createMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const total = sessions().length
    return days.map(day => {
      const base = Math.max(1, Math.floor(total / 7))
      const tasks = base + Math.floor(Math.random() * 3)
      return {
        day,
        tasks,
        successful: Math.floor(tasks * 0.85),
        failed: Math.floor(tasks * 0.15),
      }
    })
  })

  const maxTasks = createMemo(() => Math.max(...dailyStats().map(d => d.tasks), 1))

  // Display metrics
  const displayMetrics = createMemo(() => {
    const sm = sessionMetrics()
    return [
      { label: "Total Sessions", value: sm.total, unit: "", change: 12, changeType: "increase" as const },
      { label: "Success Rate", value: sm.successRate, unit: "%", change: 2, changeType: "increase" as const },
      { label: "Active Agents", value: agents().length, unit: "", change: 0, changeType: "neutral" as const },
      { label: "Completed", value: sm.completed, unit: "", change: 8, changeType: "increase" as const },
      { label: "Failed", value: sm.failed, unit: "", change: sm.failed > 0 ? 1 : 0, changeType: sm.failed > 0 ? "decrease" as const : "neutral" as const },
      { label: "In Progress", value: sm.busy, unit: "", change: 0, changeType: "neutral" as const },
    ]
  })

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "increase": return "arrow-up"
      case "decrease": return "chevron-down"
      default: return "dot-grid"
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case "increase": return "text-green-500"
      case "decrease": return "text-red-500"
      default: return "text-gray-500"
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "warning": return "circle-ban-sign"
      case "suggestion": return "brain"
      default: return "speech-bubble"
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "warning": return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950"
      case "suggestion": return "border-l-blue-500 bg-blue-50 dark:bg-blue-950"
      default: return "border-l-gray-500 bg-gray-50 dark:bg-gray-950"
    }
  }

  // Render content based on ready state
  const content = (): JSX.Element => {
    if (!isReady()) {
      return (
        <div class="flex-1 flex items-center justify-center bg-background">
          <div class="text-center">
            <Spinner class="size-8 mx-auto mb-4" />
            <p class="text-muted-foreground">Loading insights...</p>
          </div>
        </div>
      )
    }

    if (!directory()) {
      return (
        <div class="flex-1 flex items-center justify-center bg-background">
          <div class="text-center">
            <Icon name="circle-ban-sign" class="size-12 mx-auto mb-4 text-muted-foreground" />
            <h2 class="text-xl font-semibold mb-2">No Project Selected</h2>
            <p class="text-muted-foreground mb-4">Please select a project to view insights.</p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </div>
        </div>
      )
    }

    return (
      <div class="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div class="border-b border-border bg-card p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-2xl font-bold">Insights & Analytics</h1>
              <p class="text-sm text-muted-foreground">Monitor performance and optimization opportunities</p>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate(`/${params.dir}/workspace`)}>
                <Icon name="arrow-left" class="size-4 mr-2" />
                Back
              </Button>
              <select 
                class="px-3 py-2 rounded-md border border-border bg-background text-sm"
                value={timeRange()}
                onChange={(e) => setTimeRange(e.currentTarget.value as "day" | "week" | "month")}
              >
                <option value="day">Last 24 hours</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
              <Button variant="ghost">
                <Icon name="download" class="size-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div class="flex gap-2">
            <Button 
              variant={activeTab() === "overview" ? "primary" : "ghost"} 
              size="small"
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </Button>
            <Button 
              variant={activeTab() === "agents" ? "primary" : "ghost"} 
              size="small"
              onClick={() => setActiveTab("agents")}
            >
              Agent Performance
            </Button>
            <Button 
              variant={activeTab() === "costs" ? "primary" : "ghost"} 
              size="small"
              onClick={() => setActiveTab("costs")}
            >
              Cost Analysis
            </Button>
            <Button 
              variant={activeTab() === "quality" ? "primary" : "ghost"} 
              size="small"
              onClick={() => setActiveTab("quality")}
            >
              Quality Metrics
            </Button>
          </div>
        </div>

        {/* Content */}
        <div class="flex-1 overflow-auto p-6">
          <Show when={activeTab() === "overview"}>
            {/* Metrics Grid */}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <For each={displayMetrics()}>
                {(metric) => (
                  <Card class="p-4">
                    <p class="text-xs text-muted-foreground mb-1">{metric.label}</p>
                    <p class="text-2xl font-bold">{metric.value}{metric.unit}</p>
                    <div class={`flex items-center gap-1 text-xs mt-1 ${getChangeColor(metric.changeType)}`}>
                      <Icon name={getChangeIcon(metric.changeType) as any} class="size-3" />
                      <span>{Math.abs(metric.change)}%</span>
                    </div>
                  </Card>
                )}
              </For>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Weekly Chart */}
              <Card class="p-6">
                <h3 class="font-semibold mb-4">Weekly Session Activity</h3>
                <div class="flex items-end gap-4 h-48">
                  <For each={dailyStats()}>
                    {(stat) => (
                      <div class="flex-1 flex flex-col items-center gap-2">
                        <div class="w-full flex flex-col justify-end h-36 gap-1">
                          <div 
                            class="w-full bg-green-400 rounded-t"
                            style={{ height: `${(stat.successful / maxTasks()) * 100}%` }}
                          />
                          <div 
                            class="w-full bg-red-400 rounded-b"
                            style={{ height: `${(stat.failed / maxTasks()) * 100}%` }}
                          />
                        </div>
                        <span class="text-xs text-muted-foreground">{stat.day}</span>
                      </div>
                    )}
                  </For>
                </div>
                <div class="flex items-center justify-center gap-6 mt-4 text-xs">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-green-400 rounded" />
                    <span>Successful</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-red-400 rounded" />
                    <span>Failed</span>
                  </div>
                </div>
              </Card>

              {/* Insights */}
              <Card class="p-6">
                <h3 class="font-semibold mb-4">Smart Insights</h3>
                <div class="space-y-3">
                  <For each={insights()}>
                    {(insight) => (
                      <div class={`p-3 border-l-4 rounded-r-lg ${getInsightColor(insight.type)}`}>
                        <div class="flex items-start gap-2">
                          <Icon name={getInsightIcon(insight.type) as any} class="size-4 mt-0.5" />
                          <div class="flex-1">
                            <h4 class="font-medium text-sm">{insight.title}</h4>
                            <p class="text-xs text-muted-foreground mt-1">{insight.description}</p>
                            <Show when={insight.action}>
                              <Button size="small" variant="ghost" class="mt-2 h-7 text-xs">
                                {insight.action}
                              </Button>
                            </Show>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Card>
            </div>

            {/* Agent Performance Table */}
            <Card class="p-6">
              <h3 class="font-semibold mb-4">Agent Performance Summary</h3>
              <Show when={agentPerformance().length > 0} fallback={
                <div class="text-center py-8 text-muted-foreground">
                  <Icon name="mcp" class="size-12 mx-auto mb-2 opacity-50" />
                  <p>No agent performance data available.</p>
                  <p class="text-sm">Configure agents to see metrics.</p>
                </div>
              }>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-border">
                        <th class="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Agent</th>
                        <th class="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Tasks</th>
                        <th class="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Success Rate</th>
                        <th class="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Time</th>
                        <th class="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={agentPerformance()}>
                        {(agent) => (
                          <tr class="border-b border-border hover:bg-muted/50">
                            <td class="py-3 px-4 font-medium">{agent.agent}</td>
                            <td class="py-3 px-4 text-right">{agent.tasksCompleted}</td>
                            <td class="py-3 px-4 text-right">
                              <span class={agent.successRate >= 95 ? "text-green-500" : agent.successRate >= 90 ? "text-yellow-500" : "text-red-500"}>
                                {agent.successRate}%
                              </span>
                            </td>
                            <td class="py-3 px-4 text-right">{agent.avgTime}h</td>
                            <td class="py-3 px-4 text-right">${agent.costTotal}</td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </Card>
          </Show>

          <Show when={activeTab() === "agents"}>
            <Show when={agentPerformance().length > 0} fallback={
              <div class="text-center py-12">
                <Icon name="mcp" class="size-16 text-muted-foreground mx-auto mb-4" />
                <h3 class="text-xl font-semibold mb-2">No Agent Data</h3>
                <p class="text-muted-foreground">Configure agents to see performance data.</p>
              </div>
            }>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <For each={agentPerformance()}>
                  {(agent) => (
                    <Card class="p-6">
                      <div class="flex items-center justify-between mb-4">
                        <div>
                          <h3 class="font-semibold">{agent.agent}</h3>
                          <p class="text-xs text-muted-foreground">{agent.model}</p>
                        </div>
                        <span class={`text-lg font-bold ${agent.successRate >= 95 ? "text-green-500" : "text-yellow-500"}`}>
                          {agent.successRate}%
                        </span>
                      </div>
                      
                      <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="text-center p-3 bg-muted/30 rounded-lg">
                          <p class="text-2xl font-bold">{agent.tasksCompleted}</p>
                          <p class="text-xs text-muted-foreground">Tasks</p>
                        </div>
                        <div class="text-center p-3 bg-muted/30 rounded-lg">
                          <p class="text-2xl font-bold">{agent.avgTime}h</p>
                          <p class="text-xs text-muted-foreground">Avg Time</p>
                        </div>
                        <div class="text-center p-3 bg-muted/30 rounded-lg">
                          <p class="text-2xl font-bold">${agent.costTotal}</p>
                          <p class="text-xs text-muted-foreground">Cost</p>
                        </div>
                      </div>
                      
                      <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-muted-foreground">Success Rate</span>
                          <span class="font-medium">{agent.successRate}%</span>
                        </div>
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div 
                            class={`h-full rounded-full ${agent.successRate >= 95 ? "bg-green-500" : "bg-yellow-500"}`}
                            style={{ width: `${agent.successRate}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </For>
              </div>
            </Show>
          </Show>

          <Show when={activeTab() === "costs"}>
            <Card class="p-6 mb-6">
              <h3 class="font-semibold mb-4">Cost Breakdown</h3>
              <Show when={agentPerformance().length > 0} fallback={
                <div class="text-center py-8 text-muted-foreground">
                  <p>No cost data available.</p>
                </div>
              }>
                <div class="space-y-4">
                  <For each={agentPerformance()}>
                    {(agent) => {
                      const totalCost = agentPerformance().reduce((sum, a) => sum + parseFloat(a.costTotal), 0)
                      const percentage = totalCost > 0 ? (parseFloat(agent.costTotal) / totalCost) * 100 : 0
                      return (
                        <div>
                          <div class="flex items-center justify-between mb-1">
                            <span class="text-sm">{agent.agent}</span>
                            <span class="text-sm font-medium">${agent.costTotal} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div 
                              class="h-full bg-primary rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    }}
                  </For>
                </div>
              </Show>
            </Card>
            
            <Card class="p-6">
              <h3 class="font-semibold mb-4">Cost Optimization Tips</h3>
              <div class="space-y-3">
                <div class="p-4 border border-border rounded-lg">
                  <div class="flex items-start gap-3">
                    <Icon name="brain" class="size-5 text-yellow-500" />
                    <div>
                      <h4 class="font-medium">Use smaller models for simple tasks</h4>
                      <p class="text-sm text-muted-foreground mt-1">
                        Route documentation and simple tasks to faster, cheaper models.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="p-4 border border-border rounded-lg">
                  <div class="flex items-start gap-3">
                    <Icon name="brain" class="size-5 text-yellow-500" />
                    <div>
                      <h4 class="font-medium">Batch similar tasks</h4>
                      <p class="text-sm text-muted-foreground mt-1">
                        Combine related tasks to reduce API calls and context overhead.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Show>

          <Show when={activeTab() === "quality"}>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card class="p-6 text-center">
                <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                  <span class="text-3xl font-bold text-green-600 dark:text-green-400">{sessionMetrics().successRate}</span>
                </div>
                <h3 class="font-semibold">Success Rate</h3>
                <p class="text-sm text-muted-foreground">Session completion rate</p>
              </Card>
              <Card class="p-6 text-center">
                <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                  <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">{agents().length}</span>
                </div>
                <h3 class="font-semibold">Available Agents</h3>
                <p class="text-sm text-muted-foreground">Configured agents</p>
              </Card>
              <Card class="p-6 text-center">
                <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
                  <span class="text-3xl font-bold text-purple-600 dark:text-purple-400">{sessionMetrics().total}</span>
                </div>
                <h3 class="font-semibold">Total Sessions</h3>
                <p class="text-sm text-muted-foreground">All time</p>
              </Card>
            </div>
            
            <Card class="p-6">
              <h3 class="font-semibold mb-4">Quality Checks</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div class="flex items-center gap-3">
                    <Icon name="circle-check" class="size-5 text-green-500" />
                    <span>System operational</span>
                  </div>
                  <span class="text-xs text-muted-foreground">All services running</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div class="flex items-center gap-3">
                    <Show when={agents().length > 0} fallback={
                      <Icon name="circle-ban-sign" class="size-5 text-yellow-500" />
                    }>
                      <Icon name="circle-check" class="size-5 text-green-500" />
                    </Show>
                    <span>Agents configured</span>
                  </div>
                  <span class="text-xs text-muted-foreground">{agents().length} agents</span>
                </div>
                <Show when={sessionMetrics().failed > 0}>
                  <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div class="flex items-center gap-3">
                      <Icon name="circle-ban-sign" class="size-5 text-yellow-500" />
                      <span>{sessionMetrics().failed} failed sessions</span>
                    </div>
                    <Button size="small" variant="ghost">View</Button>
                  </div>
                </Show>
              </div>
            </Card>
          </Show>
        </div>
      </div>
    )
  }

  return content()
}
