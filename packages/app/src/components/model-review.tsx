import { createSignal, createMemo, createEffect, For, Show } from "solid-js"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Button } from "@opencode-ai/ui/button"
import { Spinner } from "@opencode-ai/ui/spinner"

interface ReviewResult {
  category: string
  status: "pass" | "warn" | "fail"
  message: string
  severity: "info" | "warning" | "error"
  line?: number
  file?: string
}

interface ReviewSummary {
  taskId: string
  taskTitle: string
  modelUsed: string
  timestamp: Date
  autoApproved: boolean
  overallScore: number
  categories: {
    name: string
    score: number
    weight: number
    checks: ReviewResult[]
  }[]
  recommendation: "approve" | "request-changes" | "needs-human-review"
  reasoning: string[]
}

interface ModelReviewPanelProps {
  taskId: string
  taskTitle: string
  onApprove?: (taskId: string) => void
  onRequestChanges?: (taskId: string, comments: string) => void
  onEscalate?: (taskId: string) => void
  autoApproveThreshold?: number // Default 85%
}

// Review categories and their weights
const REVIEW_CATEGORIES = [
  { id: "code-quality", name: "Code Quality", weight: 0.25 },
  { id: "correctness", name: "Correctness", weight: 0.30 },
  { id: "security", name: "Security", weight: 0.20 },
  { id: "performance", name: "Performance", weight: 0.10 },
  { id: "style", name: "Style & Conventions", weight: 0.10 },
  { id: "tests", name: "Test Coverage", weight: 0.05 },
]

// Simulate code review (in production, this would call an LLM API)
async function performReview(taskId: string, taskTitle: string): Promise<ReviewSummary> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Generate mock review results
  const categories = REVIEW_CATEGORIES.map(cat => {
    const score = 70 + Math.random() * 30 // Random score 70-100
    const checks: ReviewResult[] = []
    
    if (cat.id === "code-quality") {
      checks.push(
        { category: cat.id, status: score > 80 ? "pass" : "warn", message: "Code follows DRY principles", severity: "info" },
        { category: cat.id, status: "pass", message: "No unused variables detected", severity: "info" },
        { category: cat.id, status: score > 75 ? "pass" : "warn", message: "Function complexity is acceptable", severity: score > 75 ? "info" : "warning" }
      )
    } else if (cat.id === "correctness") {
      checks.push(
        { category: cat.id, status: "pass", message: "Logic correctly implements the requirements", severity: "info" },
        { category: cat.id, status: score > 85 ? "pass" : "warn", message: "Edge cases handled", severity: score > 85 ? "info" : "warning" }
      )
    } else if (cat.id === "security") {
      checks.push(
        { category: cat.id, status: "pass", message: "No SQL injection vulnerabilities", severity: "info" },
        { category: cat.id, status: "pass", message: "Input validation present", severity: "info" },
        { category: cat.id, status: score > 90 ? "pass" : "warn", message: "Sensitive data handling", severity: score > 90 ? "info" : "warning" }
      )
    } else if (cat.id === "performance") {
      checks.push(
        { category: cat.id, status: score > 80 ? "pass" : "warn", message: "No O(n²) algorithms detected", severity: "info" },
        { category: cat.id, status: "pass", message: "Memory usage is reasonable", severity: "info" }
      )
    } else if (cat.id === "style") {
      checks.push(
        { category: cat.id, status: "pass", message: "Consistent naming conventions", severity: "info" },
        { category: cat.id, status: "pass", message: "Proper formatting", severity: "info" }
      )
    } else if (cat.id === "tests") {
      checks.push(
        { category: cat.id, status: score > 70 ? "pass" : "warn", message: "Unit tests present", severity: score > 70 ? "info" : "warning" },
        { category: cat.id, status: score > 80 ? "pass" : "warn", message: "Edge cases covered", severity: score > 80 ? "info" : "warning" }
      )
    }
    
    return {
      name: cat.name,
      score: Math.round(score),
      weight: cat.weight,
      checks
    }
  })
  
  const overallScore = categories.reduce(
    (sum, cat) => sum + cat.score * cat.weight, 0
  )
  
  const recommendation = overallScore >= 85 
    ? "approve" 
    : overallScore >= 70 
      ? "request-changes" 
      : "needs-human-review"
  
  const reasoning: string[] = []
  if (overallScore >= 85) {
    reasoning.push("All critical checks passed")
    reasoning.push("Code quality meets standards")
    reasoning.push("No security vulnerabilities detected")
  } else if (overallScore >= 70) {
    reasoning.push("Some minor issues detected")
    reasoning.push("Recommend addressing warnings before merge")
  } else {
    reasoning.push("Significant issues require human review")
    reasoning.push("Quality or security concerns detected")
  }
  
  return {
    taskId,
    taskTitle,
    modelUsed: "Claude 3.5 Sonnet",
    timestamp: new Date(),
    autoApproved: overallScore >= 85,
    overallScore: Math.round(overallScore),
    categories,
    recommendation,
    reasoning
  }
}

export function ModelReviewPanel(props: ModelReviewPanelProps) {
  const [isReviewing, setIsReviewing] = createSignal(false)
  const [review, setReview] = createSignal<ReviewSummary | null>(null)
  const [changeRequest, setChangeRequest] = createSignal("")
  const [showDetails, setShowDetails] = createSignal(false)
  
  const autoApproveThreshold = props.autoApproveThreshold ?? 85
  
  const runReview = async () => {
    setIsReviewing(true)
    try {
      const result = await performReview(props.taskId, props.taskTitle)
      setReview(result)
      
      // Auto-approve if above threshold
      if (result.overallScore >= autoApproveThreshold && props.onApprove) {
        // Slight delay for UX
        setTimeout(() => {
          props.onApprove?.(props.taskId)
        }, 1000)
      }
    } finally {
      setIsReviewing(false)
    }
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500"
    if (score >= 70) return "text-yellow-500"
    return "text-red-500"
  }
  
  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-green-100 dark:bg-green-900"
    if (score >= 70) return "bg-yellow-100 dark:bg-yellow-900"
    return "bg-red-100 dark:bg-red-900"
  }
  
  const getStatusIcon = (status: ReviewResult["status"]) => {
    switch (status) {
      case "pass": return "circle-check"
      case "warn": return "circle-ban-sign"
      case "fail": return "circle-x"
    }
  }
  
  const getStatusColor = (status: ReviewResult["status"]) => {
    switch (status) {
      case "pass": return "text-green-500"
      case "warn": return "text-yellow-500"
      case "fail": return "text-red-500"
    }
  }
  
  return (
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="size-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <Icon name="glasses" class="size-5 text-purple-500" />
          </div>
          <div>
            <h3 class="font-semibold">Model Review</h3>
            <p class="text-sm text-muted-foreground">{props.taskTitle}</p>
          </div>
        </div>
        
        <Show when={!review()}>
          <Button onClick={runReview} disabled={isReviewing()}>
            <Show when={isReviewing()} fallback={
              <>
                <Icon name="glasses" class="size-4 mr-2" />
                Start Review
              </>
            }>
              <Spinner class="size-4 mr-2" />
              Reviewing...
            </Show>
          </Button>
        </Show>
      </div>
      
      <Show when={isReviewing()}>
        <div class="text-center py-8">
          <Spinner class="size-8 mx-auto mb-4" />
          <p class="text-sm text-muted-foreground">Analyzing code quality...</p>
          <p class="text-xs text-muted-foreground mt-1">Running security, correctness, and style checks</p>
        </div>
      </Show>
      
      <Show when={review()}>
        {(r) => (
          <div class="space-y-4">
            {/* Overall Score */}
            <div class={`p-4 rounded-lg ${getScoreBgColor(r().overallScore)}`}>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Overall Score</p>
                  <p class={`text-3xl font-bold ${getScoreColor(r().overallScore)}`}>
                    {r().overallScore}%
                  </p>
                </div>
                <div class="text-right">
                  <Show when={r().autoApproved}>
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full text-sm">
                      <Icon name="circle-check" class="size-4" />
                      Auto-Approved
                    </span>
                  </Show>
                  <Show when={!r().autoApproved && r().recommendation === "request-changes"}>
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-full text-sm">
                      Changes Requested
                    </span>
                  </Show>
                  <Show when={!r().autoApproved && r().recommendation === "needs-human-review"}>
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-full text-sm">
                      Human Review Needed
                    </span>
                  </Show>
                </div>
              </div>
            </div>
            
            {/* Reasoning */}
            <div class="p-3 bg-muted/50 rounded-lg">
              <p class="text-sm font-medium mb-2">Analysis</p>
              <ul class="space-y-1">
                <For each={r().reasoning}>
                  {(reason) => (
                    <li class="text-sm text-muted-foreground flex items-center gap-2">
                      <span class="size-1.5 bg-current rounded-full" />
                      {reason}
                    </li>
                  )}
                </For>
              </ul>
            </div>
            
            {/* Category Scores */}
            <div>
              <button 
                class="flex items-center gap-2 text-sm font-medium mb-2 hover:text-primary"
                onClick={() => setShowDetails(!showDetails())}
              >
                <Icon name={showDetails() ? "chevron-down" : "chevron-right"} class="size-4" />
                Category Breakdown
              </button>
              
              <Show when={showDetails()}>
                <div class="space-y-3">
                  <For each={r().categories}>
                    {(category) => (
                      <div class="p-3 border border-border rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium">{category.name}</span>
                          <span class={`text-sm font-bold ${getScoreColor(category.score)}`}>
                            {category.score}%
                          </span>
                        </div>
                        <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                          <div
                            class={`h-full rounded-full ${
                              category.score >= 85 ? "bg-green-500" :
                              category.score >= 70 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${category.score}%` }}
                          />
                        </div>
                        <div class="space-y-1">
                          <For each={category.checks}>
                            {(check) => (
                              <div class="flex items-center gap-2 text-xs">
                                <Icon 
                                  name={getStatusIcon(check.status) as any} 
                                  class={`size-3 ${getStatusColor(check.status)}`} 
                                />
                                <span class="text-muted-foreground">{check.message}</span>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
            
            {/* Actions */}
            <Show when={!r().autoApproved}>
              <div class="border-t border-border pt-4 space-y-3">
                <textarea
                  placeholder="Add comments for changes requested..."
                  value={changeRequest()}
                  onInput={(e) => setChangeRequest(e.currentTarget.value)}
                  class="w-full p-3 border border-border rounded-lg bg-background resize-none"
                  rows={3}
                />
                <div class="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => props.onEscalate?.(props.taskId)}
                  >
                    Escalate to Human
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => props.onRequestChanges?.(props.taskId, changeRequest())}
                  >
                    Request Changes
                  </Button>
                  <Button 
                    onClick={() => props.onApprove?.(props.taskId)}
                  >
                    <Icon name="circle-check" class="size-4 mr-2" />
                    Approve Anyway
                  </Button>
                </div>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </Card>
  )
}

// Lightweight component for use in lists
export function ReviewStatusBadge(props: { score?: number; status?: "pending" | "reviewing" | "approved" | "changes-requested" | "escalated" }) {
  const getColor = () => {
    if (props.status === "pending") return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    if (props.status === "reviewing") return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
    if (props.status === "approved") return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
    if (props.status === "changes-requested") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
    if (props.status === "escalated") return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
    return "bg-gray-100 text-gray-700"
  }
  
  const getLabel = () => {
    if (props.status === "pending") return "Pending Review"
    if (props.status === "reviewing") return "Reviewing..."
    if (props.status === "approved") return `Approved ${props.score ? `(${props.score}%)` : ""}`
    if (props.status === "changes-requested") return "Changes Requested"
    if (props.status === "escalated") return "Escalated"
    return "Unknown"
  }
  
  return (
    <span class={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getColor()}`}>
      {getLabel()}
    </span>
  )
}
