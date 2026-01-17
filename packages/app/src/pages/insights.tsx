import { createSignal, createMemo, For, Show, onMount } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"

interface InsightMetric {
  label: string
  value: number | string
  change: number
  changeType: "increase" | "decrease" | "neutral"
  unit?: string
}

interface AgentPerformance {
  agent: string
  tasksCompleted: number
  successRate: number
  avgTime: number
  costTotal: number
}

interface ProjectInsight {
  id: string
  type: "warning" | "suggestion" | "info"
  title: string
  description: string
  action?: string
}

export default function InsightsPage() {
  const params = useParams()
  const navigate = useNavigate()
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  
  const [activeTab, setActiveTab] = createSignal<"overview" | "agents" | "costs" | "quality">("overview")
  const [timeRange, setTimeRange] = createSignal<"day" | "week" | "month">("week")
  const [isLoading, setIsLoading] = createSignal(false)

  const [metrics, setMetrics] = createSignal<InsightMetric[]>([
    { label: "Tasks Completed", value: 47, change: 12, changeType: "increase" },
    { label: "Success Rate", value: 94, change: 3, changeType: "increase", unit: "%" },
    { label: "Avg Completion Time", value: "4.2h", change: -15, changeType: "decrease" },
    { label: "Total Cost", value: "$127.45", change: 8, changeType: "increase" },
    { label: "Active Sessions", value: 3, change: 0, changeType: "neutral" },
    { label: "Code Quality Score", value: 87, change: 5, changeType: "increase", unit: "/100" },
  ])

  const [agentPerformance, setAgentPerformance] = createSignal<AgentPerformance[]>([
    { agent: "Claude 3.5 Sonnet", tasksCompleted: 23, successRate: 96, avgTime: 3.2, costTotal: 45.30 },
    { agent: "GPT-4 Turbo", tasksCompleted: 12, successRate: 92, avgTime: 5.1, costTotal: 38.20 },
    { agent: "Gemini Pro", tasksCompleted: 8, successRate: 88, avgTime: 2.1, costTotal: 12.40 },
    { agent: "Claude 3 Opus", tasksCompleted: 4, successRate: 100, avgTime: 8.5, costTotal: 31.55 },
  ])

  const [insights, setInsights] = createSignal<ProjectInsight[]>([
    {
      id: "1",
      type: "warning",
      title: "High retry rate detected",
      description: "GPT-4 Turbo has a 15% retry rate on complex coding tasks. Consider using Claude 3.5 for these tasks.",
      action: "Adjust routing",
    },
    {
      id: "2",
      type: "suggestion",
      title: "Cost optimization opportunity",
      description: "20% of tasks could use GPT-4o Mini instead of GPT-4 Turbo, saving ~$15/week.",
      action: "Review tasks",
    },
    {
      id: "3",
      type: "info",
      title: "Peak performance hours",
      description: "Your agents perform best between 2-6 PM with 98% success rate.",
    },
  ])

  const [dailyStats, setDailyStats] = createSignal([
    { day: "Mon", tasks: 8, success: 7 },
    { day: "Tue", tasks: 12, success: 11 },
    { day: "Wed", tasks: 6, success: 6 },
    { day: "Thu", tasks: 10, success: 9 },
    { day: "Fri", tasks: 7, success: 7 },
    { day: "Sat", tasks: 3, success: 3 },
    { day: "Sun", tasks: 1, success: 1 },
  ])

  const maxTasks = createMemo(() => Math.max(...dailyStats().map(d => d.tasks)))

  const getChangeIcon = (type: string): "arrow-up" | "chevron-down" | "dot-grid" => {
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

  const getInsightIcon = (type: string): "circle-ban-sign" | "brain" | "speech-bubble" => {
    switch (type) {
      case "warning": return "circle-ban-sign"
      case "suggestion": return "brain"
      case "info": return "speech-bubble"
      default: return "speech-bubble"
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "warning": return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950"
      case "suggestion": return "border-l-blue-500 bg-blue-50 dark:bg-blue-950"
      case "info": return "border-l-gray-500 bg-gray-50 dark:bg-gray-950"
      default: return "border-l-gray-500 bg-gray-50 dark:bg-gray-950"
    }
  }

  return (
    <div class="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div class="border-b border-border bg-card p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold">Insights</h1>
            <p class="text-sm text-muted-foreground">Analytics and performance metrics</p>
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
            <For each={metrics()}>
              {(metric) => (
                <Card class="p-4">
                  <p class="text-xs text-muted-foreground mb-1">{metric.label}</p>
                  <p class="text-2xl font-bold">
                    {metric.value}{metric.unit || ""}
                  </p>
                  <div class={`flex items-center gap-1 text-xs mt-1 ${getChangeColor(metric.changeType)}`}>
                    <Icon name={getChangeIcon(metric.changeType)} class="size-3" />
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                </Card>
              )}
            </For>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Weekly Chart */}
            <Card class="p-6">
              <h3 class="font-semibold mb-4">Weekly Task Completion</h3>
              <div class="flex items-end gap-4 h-48">
                <For each={dailyStats()}>
                  {(stat) => (
                    <div class="flex-1 flex flex-col items-center gap-2">
                      <div class="w-full flex flex-col justify-end h-36 gap-1">
                        <div 
                          class="w-full bg-green-500 rounded-t"
                          style={{ height: `${(stat.success / maxTasks()) * 100}%` }}
                        />
                        <Show when={stat.tasks > stat.success}>
                          <div 
                            class="w-full bg-red-400 rounded-t"
                            style={{ height: `${((stat.tasks - stat.success) / maxTasks()) * 100}%` }}
                          />
                        </Show>
                      </div>
                      <span class="text-xs text-muted-foreground">{stat.day}</span>
                    </div>
                  )}
                </For>
              </div>
              <div class="flex items-center gap-4 mt-4 text-xs">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-green-500 rounded" />
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
                        <Icon name={getInsightIcon(insight.type)} class="size-4 mt-0.5" />
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
                        <td class="py-3 px-4 text-right">${agent.costTotal.toFixed(2)}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Card>
        </Show>

        <Show when={activeTab() === "agents"}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <For each={agentPerformance()}>
              {(agent) => (
                <Card class="p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold">{agent.agent}</h3>
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
                      <p class="text-2xl font-bold">${agent.costTotal.toFixed(0)}</p>
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

        <Show when={activeTab() === "costs"}>
          <Card class="p-6 mb-6">
            <h3 class="font-semibold mb-4">Cost Breakdown</h3>
            <div class="space-y-4">
              <For each={agentPerformance()}>
                {(agent) => {
                  const totalCost = agentPerformance().reduce((sum, a) => sum + a.costTotal, 0)
                  const percentage = (agent.costTotal / totalCost) * 100
                  return (
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-sm">{agent.agent}</span>
                        <span class="text-sm font-medium">${agent.costTotal.toFixed(2)} ({percentage.toFixed(1)}%)</span>
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
          </Card>
          
          <Card class="p-6">
            <h3 class="font-semibold mb-4">Cost Optimization Suggestions</h3>
            <div class="space-y-3">
              <div class="p-4 border border-border rounded-lg">
                <div class="flex items-start gap-3">
                  <Icon name="brain" class="size-5 text-yellow-500" />
                  <div>
                    <h4 class="font-medium">Use GPT-4o Mini for simple tasks</h4>
                    <p class="text-sm text-muted-foreground mt-1">
                      Potential savings: ~$15/week by routing documentation tasks to GPT-4o Mini
                    </p>
                  </div>
                </div>
              </div>
              <div class="p-4 border border-border rounded-lg">
                <div class="flex items-start gap-3">
                  <Icon name="brain" class="size-5 text-yellow-500" />
                  <div>
                    <h4 class="font-medium">Batch similar tasks together</h4>
                    <p class="text-sm text-muted-foreground mt-1">
                      Reduce API calls by 20% with context caching and task batching
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
                <span class="text-3xl font-bold text-green-600 dark:text-green-400">87</span>
              </div>
              <h3 class="font-semibold">Code Quality Score</h3>
              <p class="text-sm text-muted-foreground">Based on static analysis</p>
            </Card>
            <Card class="p-6 text-center">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">92%</span>
              </div>
              <h3 class="font-semibold">Test Coverage</h3>
              <p class="text-sm text-muted-foreground">Unit and integration tests</p>
            </Card>
            <Card class="p-6 text-center">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
                <span class="text-3xl font-bold text-purple-600 dark:text-purple-400">A-</span>
              </div>
              <h3 class="font-semibold">Maintainability</h3>
              <p class="text-sm text-muted-foreground">Code complexity rating</p>
            </Card>
          </div>
          
          <Card class="p-6">
            <h3 class="font-semibold mb-4">Quality Checks</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div class="flex items-center gap-3">
                  <Icon name="circle-check" class="size-5 text-green-500" />
                  <span>No security vulnerabilities detected</span>
                </div>
                <span class="text-xs text-muted-foreground">Last checked 2h ago</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div class="flex items-center gap-3">
                  <Icon name="circle-check" class="size-5 text-green-500" />
                  <span>All tests passing</span>
                </div>
                <span class="text-xs text-muted-foreground">142 tests</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div class="flex items-center gap-3">
                  <Icon name="circle-ban-sign" class="size-5 text-yellow-500" />
                  <span>3 code smells detected</span>
                </div>
                <Button size="small" variant="ghost">View</Button>
              </div>
            </div>
          </Card>
        </Show>
      </div>
    </div>
  )
}
