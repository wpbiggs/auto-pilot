import { createSignal, createMemo, For, Show } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"

interface TaskFormData {
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  type: "feature" | "bug" | "improvement" | "documentation" | "testing"
  estimatedHours: number
  tags: string[]
  assignmentType: "auto" | "manual"
  selectedAgent?: string
}

interface ValidationError {
  field: string
  message: string
}

interface AnalysisResult {
  complexity: number
  recommendedAgent: string
  confidence: number
  estimatedTime: string
  suggestedTags: string[]
  breakdown: string[]
}

export default function TaskWizardPage() {
  const params = useParams()
  const navigate = useNavigate()
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  
  const [currentStep, setCurrentStep] = createSignal(1)
  const [isAnalyzing, setIsAnalyzing] = createSignal(false)
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [errors, setErrors] = createSignal<ValidationError[]>([])
  const [showErrors, setShowErrors] = createSignal(false)
  
  const [formData, setFormData] = createSignal<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    type: "feature",
    estimatedHours: 4,
    tags: [],
    assignmentType: "auto",
  })
  
  const [analysisResult, setAnalysisResult] = createSignal<AnalysisResult | null>(null)
  const [tagInput, setTagInput] = createSignal("")

  const agents = [
    { id: "claude-35-sonnet", name: "Claude 3.5 Sonnet", speed: 9, quality: 9 },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", speed: 7, quality: 9 },
    { id: "gemini-pro", name: "Gemini Pro", speed: 10, quality: 7 },
    { id: "claude-3-opus", name: "Claude 3 Opus", speed: 5, quality: 10 },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", speed: 10, quality: 6 },
  ]

  const steps: Array<{ id: number; title: string; icon: "pencil-line" | "settings-gear" | "brain" | "mcp" }> = [
    { id: 1, title: "Basic Info", icon: "pencil-line" },
    { id: 2, title: "Details", icon: "settings-gear" },
    { id: 3, title: "Analysis", icon: "brain" },
    { id: 4, title: "Assignment", icon: "mcp" },
  ]

  const validateStep = (step: number): ValidationError[] => {
    const data = formData()
    const errs: ValidationError[] = []
    
    if (step === 1) {
      if (!data.title.trim()) {
        errs.push({ field: "title", message: "Task title is required" })
      } else if (data.title.length < 5) {
        errs.push({ field: "title", message: "Title must be at least 5 characters" })
      }
      if (!data.description.trim()) {
        errs.push({ field: "description", message: "Description is required" })
      } else if (data.description.length < 20) {
        errs.push({ field: "description", message: "Description must be at least 20 characters" })
      }
    }
    
    if (step === 2) {
      if (data.estimatedHours < 1) {
        errs.push({ field: "estimatedHours", message: "Estimated hours must be at least 1" })
      }
    }
    
    return errs
  }

  const getFieldError = (field: string) => {
    return errors().find(e => e.field === field)?.message
  }

  const nextStep = () => {
    const stepErrors = validateStep(currentStep())
    setErrors(stepErrors)
    setShowErrors(true)
    
    if (stepErrors.length > 0) {
      return
    }
    
    if (currentStep() === 2) {
      // Run analysis before moving to step 3
      analyzeTask()
    }
    
    if (currentStep() < 4) {
      setCurrentStep(currentStep() + 1)
      setShowErrors(false)
    }
  }

  const prevStep = () => {
    if (currentStep() > 1) {
      setCurrentStep(currentStep() - 1)
      setShowErrors(false)
    }
  }

  const analyzeTask = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const data = formData()
    const complexity = data.description.length > 200 ? 8 : data.description.length > 100 ? 5 : 3
    
    setAnalysisResult({
      complexity,
      recommendedAgent: complexity > 6 ? "Claude 3.5 Sonnet" : "GPT-4o Mini",
      confidence: 85 + Math.floor(Math.random() * 10),
      estimatedTime: `${Math.ceil(data.estimatedHours * 0.8)}-${Math.ceil(data.estimatedHours * 1.2)} hours`,
      suggestedTags: ["auto-generated", data.type, data.priority],
      breakdown: [
        "Initial setup and configuration",
        "Core implementation",
        "Testing and validation",
        "Documentation updates",
      ],
    })
    
    setIsAnalyzing(false)
  }

  const addTag = () => {
    if (tagInput().trim() && !formData().tags.includes(tagInput().trim())) {
      setFormData({ ...formData(), tags: [...formData().tags, tagInput().trim()] })
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData(), tags: formData().tags.filter(t => t !== tag) })
  }

  const submitTask = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    navigate(`/${params.dir}/kanban`)
  }

  return (
    <div class="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div class="border-b border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Task Wizard</h1>
            <p class="text-sm text-muted-foreground">Create a new task with AI-powered analysis</p>
          </div>
          <Button variant="ghost" onClick={() => navigate(`/${params.dir}/kanban`)}>
            <Icon name="close" class="size-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div class="border-b border-border bg-muted/30 p-4">
        <div class="flex items-center justify-center gap-4">
          <For each={steps}>
            {(step) => (
              <div 
                class={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStep() === step.id 
                    ? "bg-primary text-primary-foreground" 
                    : currentStep() > step.id
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <Show when={currentStep() > step.id} fallback={
                  <Icon name={step.icon} class="size-4" />
                }>
                  <Icon name="check" class="size-4" />
                </Show>
                <span class="font-medium text-sm">{step.title}</span>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-auto p-6">
        <div class="max-w-2xl mx-auto">
          {/* Step 1: Basic Info */}
          <Show when={currentStep() === 1}>
            <Card class="p-6">
              <h2 class="text-xl font-bold mb-6">Basic Information</h2>
              
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Task Title <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Implement user authentication"
                    value={formData().title}
                    onInput={(e) => setFormData({ ...formData(), title: e.currentTarget.value })}
                    class={`w-full px-4 py-3 rounded-lg border bg-background ${
                      showErrors() && getFieldError("title") 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-border"
                    }`}
                  />
                  <Show when={showErrors() && getFieldError("title")}>
                    <p class="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <Icon name="circle-x" class="size-4" />
                      {getFieldError("title")}
                    </p>
                  </Show>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">
                    Description <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Describe the task in detail. Include requirements, acceptance criteria, and any relevant context..."
                    value={formData().description}
                    onInput={(e) => setFormData({ ...formData(), description: e.currentTarget.value })}
                    rows={6}
                    class={`w-full px-4 py-3 rounded-lg border bg-background resize-none ${
                      showErrors() && getFieldError("description") 
                        ? "border-red-500 focus:ring-red-500" 
                        : "border-border"
                    }`}
                  />
                  <div class="flex items-center justify-between mt-2">
                    <Show when={showErrors() && getFieldError("description")}>
                      <p class="text-sm text-red-500 flex items-center gap-1">
                        <Icon name="circle-x" class="size-4" />
                        {getFieldError("description")}
                      </p>
                    </Show>
                    <p class="text-xs text-muted-foreground ml-auto">
                      {formData().description.length} characters
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </Show>

          {/* Step 2: Details */}
          <Show when={currentStep() === 2}>
            <Card class="p-6">
              <h2 class="text-xl font-bold mb-6">Task Details</h2>
              
              <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Task Type</label>
                    <select
                      value={formData().type}
                      onChange={(e) => setFormData({ ...formData(), type: e.currentTarget.value as TaskFormData["type"] })}
                      class="w-full px-4 py-3 rounded-lg border border-border bg-background"
                    >
                      <option value="feature">Feature</option>
                      <option value="bug">Bug Fix</option>
                      <option value="improvement">Improvement</option>
                      <option value="documentation">Documentation</option>
                      <option value="testing">Testing</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-2">Priority</label>
                    <select
                      value={formData().priority}
                      onChange={(e) => setFormData({ ...formData(), priority: e.currentTarget.value as TaskFormData["priority"] })}
                      class="w-full px-4 py-3 rounded-lg border border-border bg-background"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData().estimatedHours}
                    onInput={(e) => setFormData({ ...formData(), estimatedHours: parseInt(e.currentTarget.value) || 1 })}
                    class={`w-full px-4 py-3 rounded-lg border bg-background ${
                      showErrors() && getFieldError("estimatedHours") 
                        ? "border-red-500" 
                        : "border-border"
                    }`}
                  />
                  <Show when={showErrors() && getFieldError("estimatedHours")}>
                    <p class="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <Icon name="circle-x" class="size-4" />
                      {getFieldError("estimatedHours")}
                    </p>
                  </Show>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Tags</label>
                  <div class="flex gap-2 mb-2 flex-wrap">
                    <For each={formData().tags}>
                      {(tag) => (
                        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                          {tag}
                          <button onClick={() => removeTag(tag)} class="hover:text-red-500">
                            <Icon name="close" class="size-3" />
                          </button>
                        </span>
                      )}
                    </For>
                  </div>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a tag..."
                      value={tagInput()}
                      onInput={(e) => setTagInput(e.currentTarget.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      class="flex-1 px-4 py-2 rounded-lg border border-border bg-background"
                    />
                    <Button onClick={addTag} disabled={!tagInput().trim()}>
                      <Icon name="plus" class="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Show>

          {/* Step 3: Analysis */}
          <Show when={currentStep() === 3}>
            <Card class="p-6">
              <h2 class="text-xl font-bold mb-6">AI Analysis</h2>
              
              <Show when={isAnalyzing()}>
                <div class="text-center py-12">
                  <Spinner class="size-12 mx-auto mb-4" />
                  <p class="text-lg font-medium">Analyzing your task...</p>
                  <p class="text-sm text-muted-foreground mt-2">
                    Determining complexity and recommending the best agent
                  </p>
                </div>
              </Show>
              
              <Show when={!isAnalyzing() && analysisResult()}>
                <div class="space-y-6">
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-center p-4 bg-muted/30 rounded-lg">
                      <p class="text-3xl font-bold text-primary">{analysisResult()!.complexity}/10</p>
                      <p class="text-sm text-muted-foreground">Complexity</p>
                    </div>
                    <div class="text-center p-4 bg-muted/30 rounded-lg">
                      <p class="text-3xl font-bold text-green-500">{analysisResult()!.confidence}%</p>
                      <p class="text-sm text-muted-foreground">Confidence</p>
                    </div>
                    <div class="text-center p-4 bg-muted/30 rounded-lg">
                      <p class="text-xl font-bold">{analysisResult()!.estimatedTime}</p>
                      <p class="text-sm text-muted-foreground">Est. Time</p>
                    </div>
                  </div>

                  <div class="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div class="flex items-center gap-3">
                      <Icon name="mcp" class="size-6 text-purple-500" />
                      <div>
                        <p class="font-medium">Recommended Agent</p>
                        <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {analysisResult()!.recommendedAgent}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 class="font-medium mb-3">Task Breakdown</h3>
                    <div class="space-y-2">
                      <For each={analysisResult()!.breakdown}>
                        {(item, index) => (
                          <div class="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <span class="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {index() + 1}
                            </span>
                            <span>{item}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <div>
                    <h3 class="font-medium mb-3">Suggested Tags</h3>
                    <div class="flex gap-2 flex-wrap">
                      <For each={analysisResult()!.suggestedTags}>
                        {(tag) => (
                          <button
                            class={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              formData().tags.includes(tag)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted"
                            }`}
                            onClick={() => {
                              if (formData().tags.includes(tag)) {
                                removeTag(tag)
                              } else {
                                setFormData({ ...formData(), tags: [...formData().tags, tag] })
                              }
                            }}
                          >
                            {tag}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </Show>
            </Card>
          </Show>

          {/* Step 4: Assignment */}
          <Show when={currentStep() === 4}>
            <Card class="p-6">
              <h2 class="text-xl font-bold mb-6">Agent Assignment</h2>
              
              <div class="space-y-6">
                <div class="flex gap-4">
                  <button
                    class={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      formData().assignmentType === "auto"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => setFormData({ ...formData(), assignmentType: "auto", selectedAgent: undefined })}
                  >
                    <Icon name="enter" class="size-6 mx-auto mb-2 text-primary" />
                    <p class="font-medium">Auto-Select</p>
                    <p class="text-sm text-muted-foreground">Let AI choose the best agent</p>
                  </button>
                  <button
                    class={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      formData().assignmentType === "manual"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => setFormData({ ...formData(), assignmentType: "manual" })}
                  >
                    <Icon name="glasses" class="size-6 mx-auto mb-2 text-primary" />
                    <p class="font-medium">Manual Selection</p>
                    <p class="text-sm text-muted-foreground">Choose a specific agent</p>
                  </button>
                </div>

                <Show when={formData().assignmentType === "auto"}>
                  <div class="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div class="flex items-center gap-3">
                      <Icon name="circle-check" class="size-6 text-green-500" />
                      <div>
                        <p class="font-medium">Auto-Select Enabled</p>
                        <p class="text-sm text-muted-foreground">
                          Based on analysis, <strong>{analysisResult()?.recommendedAgent || "Claude 3.5 Sonnet"}</strong> will be assigned
                        </p>
                      </div>
                    </div>
                  </div>
                </Show>

                <Show when={formData().assignmentType === "manual"}>
                  <div class="space-y-3">
                    <For each={agents}>
                      {(agent) => (
                        <button
                          class={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                            formData().selectedAgent === agent.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted"
                          }`}
                          onClick={() => setFormData({ ...formData(), selectedAgent: agent.id })}
                        >
                          <div class="flex items-center justify-between">
                            <div>
                              <p class="font-medium">{agent.name}</p>
                              <div class="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span>Speed: {agent.speed}/10</span>
                                <span>Quality: {agent.quality}/10</span>
                              </div>
                            </div>
                            <Show when={formData().selectedAgent === agent.id}>
                              <Icon name="circle-check" class="size-6 text-primary" />
                            </Show>
                          </div>
                        </button>
                      )}
                    </For>
                  </div>
                </Show>

                {/* Summary */}
                <div class="p-4 bg-muted/30 rounded-lg">
                  <h3 class="font-medium mb-3">Task Summary</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Title:</span>
                      <span class="font-medium">{formData().title}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Type:</span>
                      <span class="font-medium capitalize">{formData().type}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Priority:</span>
                      <span class="font-medium capitalize">{formData().priority}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Estimated Time:</span>
                      <span class="font-medium">{formData().estimatedHours} hours</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Agent:</span>
                      <span class="font-medium">
                        {formData().assignmentType === "auto" 
                          ? analysisResult()?.recommendedAgent || "Auto-Select"
                          : agents.find(a => a.id === formData().selectedAgent)?.name || "Not selected"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Show>

          {/* Navigation Buttons */}
          <div class="flex justify-between mt-6">
            <Button 
              variant="ghost" 
              onClick={prevStep}
              disabled={currentStep() === 1}
            >
              <Icon name="arrow-left" class="size-4 mr-2" />
              Previous
            </Button>
            
            <Show when={currentStep() < 4} fallback={
              <Button onClick={submitTask} disabled={isSubmitting()}>
                <Show when={isSubmitting()} fallback={
                  <>
                    <Icon name="check" class="size-4 mr-2" />
                    Create Task
                  </>
                }>
                  <Spinner class="size-4 mr-2" />
                  Creating...
                </Show>
              </Button>
            }>
              <Button onClick={nextStep}>
                Next
                <Icon name="chevron-right" class="size-4 ml-2" />
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
