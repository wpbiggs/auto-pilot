import { createSignal, createMemo, For, Show } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { base64Decode } from "@opencode-ai/util/encode"

interface ProjectMetrics {
  totalTasks: number
  completedTasks: number
  totalCost: number
  totalTokens: number
  totalTime: number // minutes
  averageQuality: number
  successRate: number
  roi: number // time saved vs cost
}

interface ModelPerformance {
  modelId: string
  modelName: string
  tasksCompleted: number
  avgCompletionTime: number
  avgQuality: number
  totalCost: number
  successRate: number
  color: string
}

interface TimeSeriesPoint {
  date: string
  tasksCompleted: number
  cost: number
  quality: number
}

export default function AnalyticsPage() {
  const params = useParams()
  const navigate = useNavigate()
  
  const directory = () => params.dir ? base64Decode(params.dir) : ""
  
  const [timeRange, setTimeRange] = createSignal<"7d" | "30d" | "90d" | "all">("30d")
  const [selectedMetric, setSelectedMetric] = createSignal<"tasks" | "cost" | "quality">("tasks")
  
  // Mock data - in production, fetch from API
  const projectMetrics = createMemo<ProjectMetrics>(() => ({
    totalTasks: 127,
    completedTasks: 94,
    totalCost: 48.32,
    totalTokens: 1247000,
    totalTime: 3840, // 64 hours
    averageQuality: 8.6,
    successRate: 92,
    roi: 12.5 // 12.5x return: saved 800 hours, cost $64
  }))
  
  const modelPerformance = createMemo<ModelPerformance[]>(() => [
    {
      modelId: "claude-3-5-sonnet",
      modelName: "Claude 3.5 Sonnet",
      tasksCompleted: 45,
      avgCompletionTime: 18,
      avgQuality: 9.2,
      totalCost: 28.50,
      successRate: 96,
      color: "bg-purple-500"
    },
    {
      modelId: "gpt-4o",
      modelName: "GPT-4o",
      tasksCompleted: 32,
      avgCompletionTime: 22,
      avgQuality: 8.8,
      totalCost: 14.20,
      successRate: 91,
      color: "bg-green-500"
    },
    {
      modelId: "gpt-4o-mini",
      modelName: "GPT-4o Mini",
      tasksCompleted: 17,
      avgCompletionTime: 12,
      avgQuality: 7.4,
      totalCost: 5.62,
      successRate: 85,
      color: "bg-blue-500"
    }
  ])
  
  const timeSeriesData = createMemo<TimeSeriesPoint[]>(() => {
    const days = timeRange() === "7d" ? 7 : timeRange() === "30d" ? 30 : 90
    const data: TimeSeriesPoint[] = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        tasksCompleted: Math.floor(Math.random() * 5) + 1,
        cost: Math.random() * 3 + 0.5,
        quality: Math.random() * 2 + 7.5
      })
    }
    
    return data
  })
  
  const costOptimizationTips = () => [
    {
      tip: "Use GPT-4o Mini for simple tasks",
      savings: "$12.40/month",
      impact: "medium"
    },
    {
      tip: "Batch similar tasks together",
      savings: "$8.20/month",
      impact: "low"
    },
    {
      tip: "Enable auto-review for high-confidence tasks",
      savings: "$15.60/month",
      impact: "high"
    }
  ]
  
  const predictedCompletion = () => {
    const remaining = projectMetrics().totalTasks - projectMetrics().completedTasks
    const avgTasksPerDay = projectMetrics().completedTasks / 30
    const daysRemaining = Math.ceil(remaining / avgTasksPerDay)
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + daysRemaining)
    return {
      daysRemaining,
      completionDate: completionDate.toLocaleDateString()
    }
  }
  
  const exportReport = (format: "csv" | "pdf") => {
    console.log(`Exporting ${format} report...`)
    // In production, generate and download the report
  }
  
  return (
    <div class="flex-1 overflow-auto bg-background">
      <div class="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">Advanced Analytics</h1>
            <p class="text-muted-foreground mt-1">
              Project intelligence and performance insights
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(`/${params.dir}/workspace`)}>
              <Icon name="arrow-left" class="mr-2 size-4" />
              Back
            </Button>
            <Button variant="ghost" onClick={() => exportReport("csv")}>
              <Icon name="download" class="mr-2 size-4" />
              Export CSV
            </Button>
            <Button onClick={() => exportReport("pdf")}>
              <Icon name="download" class="mr-2 size-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div class="flex items-center gap-2">
          <For each={[
            { value: "7d", label: "Last 7 Days" },
            { value: "30d", label: "Last 30 Days" },
            { value: "90d", label: "Last 90 Days" },
            { value: "all", label: "All Time" }
          ]}>
            {(range) => (
              <Button
                size="small"
                variant={timeRange() === range.value ? "primary" : "ghost"}
                onClick={() => setTimeRange(range.value as any)}
              >
                {range.label}
              </Button>
            )}
          </For>
        </div>

        {/* Key Metrics */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">Completion Rate</span>
              <Icon name="circle-check" class="size-5 text-green-500" />
            </div>
            <p class="text-3xl font-bold">
              {Math.round((projectMetrics().completedTasks / projectMetrics().totalTasks) * 100)}%
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              {projectMetrics().completedTasks} of {projectMetrics().totalTasks} tasks
            </p>
          </Card>

          <Card class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">Total Cost</span>
              <Icon name="server" class="size-5 text-blue-500" />
            </div>
            <p class="text-3xl font-bold">${projectMetrics().totalCost.toFixed(2)}</p>
            <p class="text-xs text-muted-foreground mt-1">
              {(projectMetrics().totalTokens / 1000000).toFixed(2)}M tokens
            </p>
          </Card>

          <Card class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">Avg Quality</span>
              <Icon name="glasses" class="size-5 text-purple-500" />
            </div>
            <p class="text-3xl font-bold">{projectMetrics().averageQuality.toFixed(1)}/10</p>
            <p class="text-xs text-green-500 mt-1">
              {projectMetrics().successRate}% success rate
            </p>
          </Card>

          <Card class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">ROI</span>
              <Icon name="code-lines" class="size-5 text-yellow-500" />
            </div>
            <p class="text-3xl font-bold">{projectMetrics().roi.toFixed(1)}x</p>
            <p class="text-xs text-muted-foreground mt-1">
              {Math.round(projectMetrics().totalTime / 60)}h saved
            </p>
          </Card>
        </div>

        {/* Charts Section */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <Card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Performance Trend</h3>
              <select
                class="px-2 py-1 text-sm rounded border border-border bg-background"
                value={selectedMetric()}
                onChange={(e) => setSelectedMetric(e.currentTarget.value as any)}
              >
                <option value="tasks">Tasks Completed</option>
                <option value="cost">Daily Cost</option>
                <option value="quality">Quality Score</option>
              </select>
            </div>
            
            <div class="h-64 flex items-end gap-1">
              <For each={timeSeriesData()}>
                {(point) => {
                  const value = selectedMetric() === "tasks" 
                    ? point.tasksCompleted 
                    : selectedMetric() === "cost"
                      ? point.cost
                      : point.quality
                  const maxValue = selectedMetric() === "quality" ? 10 : Math.max(...timeSeriesData().map(p => 
                    selectedMetric() === "tasks" ? p.tasksCompleted : p.cost
                  ))
                  const height = (value / maxValue) * 100
                  
                  return (
                    <div
                      class="flex-1 bg-primary rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${value.toFixed(1)}`}
                    />
                  )
                }}
              </For>
            </div>
          </Card>

          {/* Model Comparison */}
          <Card class="p-6">
            <h3 class="font-semibold mb-4">Model Performance</h3>
            <div class="space-y-4">
              <For each={modelPerformance()}>
                {(model) => (
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <div class={`size-3 rounded-full ${model.color}`} />
                        <span class="text-sm font-medium">{model.modelName}</span>
                      </div>
                      <span class="text-sm text-muted-foreground">
                        {model.tasksCompleted} tasks
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span class="text-muted-foreground">Quality:</span>
                        <span class="ml-1 font-medium">{model.avgQuality}/10</span>
                      </div>
                      <div>
                        <span class="text-muted-foreground">Speed:</span>
                        <span class="ml-1 font-medium">{model.avgCompletionTime}m</span>
                      </div>
                      <div>
                        <span class="text-muted-foreground">Cost:</span>
                        <span class="ml-1 font-medium">${model.totalCost}</span>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Card>
        </div>

        {/* Optimization & Predictions */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Optimization */}
          <Card class="p-6">
            <h3 class="font-semibold mb-4">Cost Optimization Tips</h3>
            <div class="space-y-3">
              <For each={costOptimizationTips()}>
                {(item) => (
                  <div class="p-3 bg-muted/50 rounded-lg">
                    <div class="flex items-start justify-between mb-1">
                      <p class="text-sm font-medium">{item.tip}</p>
                      <span class={`text-xs px-2 py-0.5 rounded-full ${
                        item.impact === "high" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                        item.impact === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      }`}>
                        {item.impact} impact
                      </span>
                    </div>
                    <p class="text-sm text-green-600 dark:text-green-400">
                      Potential savings: {item.savings}
                    </p>
                  </div>
                )}
              </For>
            </div>
          </Card>

          {/* Predictions */}
          <Card class="p-6">
            <h3 class="font-semibold mb-4">Predictions</h3>
            <div class="space-y-4">
              <div class="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <Icon name="task" class="size-5 text-blue-500" />
                  <span class="font-medium">Project Completion</span>
                </div>
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {predictedCompletion().completionDate}
                </p>
                <p class="text-sm text-muted-foreground">
                  ~{predictedCompletion().daysRemaining} days remaining
                </p>
              </div>

              <div class="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <Icon name="server" class="size-5 text-purple-500" />
                  <span class="font-medium">Projected Monthly Cost</span>
                </div>
                <p class="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  ${(projectMetrics().totalCost * 1.8).toFixed(2)}
                </p>
                <p class="text-sm text-muted-foreground">
                  Based on current usage trends
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottleneck Identification */}
        <Card class="p-6">
          <h3 class="font-semibold mb-4">Identified Bottlenecks</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <Icon name="circle-ban-sign" class="size-5 text-yellow-500" />
              <div class="flex-1">
                <p class="font-medium">Code Review Queue</p>
                <p class="text-sm text-muted-foreground">
                  Average wait time: 4.2 hours • Recommendation: Enable auto-review for simple changes
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
              <Icon name="circle-ban-sign" class="size-5 text-orange-500" />
              <div class="flex-1">
                <p class="font-medium">Task Dependencies</p>
                <p class="text-sm text-muted-foreground">
                  12 blocked tasks • Recommendation: Parallelize independent work streams
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
