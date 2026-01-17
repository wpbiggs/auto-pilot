import { createSignal, For, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { useNavigate } from "@solidjs/router"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: string
  content: JSX.Element
}

export function OnboardingWizard(props: { onComplete: () => void }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = createSignal(0)
  const [projectName, setProjectName] = createSignal("")
  const [selectedAgents, setSelectedAgents] = createSignal<string[]>([])
  
  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Auto-Pilot",
      description: "Let's get you started with AI-powered development",
      icon: "brain",
      content: (
        <div class="text-center py-8">
          <Icon name="brain" class="size-24 mx-auto mb-6 text-primary" />
          <h2 class="text-3xl font-bold mb-4">Welcome to Auto-Pilot!</h2>
          <p class="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Auto-Pilot is your AI-powered development assistant that helps you build faster 
            by automating tasks, managing projects, and coordinating multiple AI agents.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div class="p-6 bg-muted/50 rounded-lg">
              <Icon name="brain" class="size-8 mx-auto mb-3 text-purple-500" />
              <h3 class="font-semibold mb-2">Smart Ideation</h3>
              <p class="text-sm text-muted-foreground">
                Turn ideas into actionable roadmaps with AI assistance
              </p>
            </div>
            <div class="p-6 bg-muted/50 rounded-lg">
              <Icon name="task" class="size-8 mx-auto mb-3 text-blue-500" />
              <h3 class="font-semibold mb-2">Auto Execution</h3>
              <p class="text-sm text-muted-foreground">
                Let AI agents handle coding, testing, and documentation
              </p>
            </div>
            <div class="p-6 bg-muted/50 rounded-lg">
              <Icon name="glasses" class="size-8 mx-auto mb-3 text-green-500" />
              <h3 class="font-semibold mb-2">Smart Reviews</h3>
              <p class="text-sm text-muted-foreground">
                Automated code reviews with quality checks
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "project",
      title: "Create Your First Project",
      description: "Set up a new project to get started",
      icon: "task",
      content: (
        <div class="max-w-2xl mx-auto">
          <h2 class="text-2xl font-bold mb-4">Let's create your first project</h2>
          <p class="text-muted-foreground mb-6">
            Give your project a name. You can always change this later.
          </p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Project Name</label>
              <input
                type="text"
                placeholder="My Awesome Project"
                value={projectName()}
                onInput={(e) => setProjectName(e.currentTarget.value)}
                class="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Project Type</label>
              <select class="w-full px-4 py-2 border border-border rounded-lg bg-background">
                <option>Web Application</option>
                <option>Mobile App</option>
                <option>API / Backend</option>
                <option>Library / Package</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                placeholder="What is this project about?"
                rows={3}
                class="w-full px-4 py-2 border border-border rounded-lg bg-background resize-none"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "agents",
      title: "Choose Your AI Agents",
      description: "Select agents that match your needs",
      icon: "mcp",
      content: (
        <div class="max-w-3xl mx-auto">
          <h2 class="text-2xl font-bold mb-4">Choose Your AI Agents</h2>
          <p class="text-muted-foreground mb-6">
            Select the AI agents you'd like to work with. Don't worry, you can add more later!
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <For each={[
              { id: "senior-dev", name: "Senior Developer", model: "Claude 3.5", description: "Best for complex features and architecture", recommended: true },
              { id: "junior-dev", name: "Junior Developer", model: "GPT-4o Mini", description: "Fast and cost-effective for simple tasks", recommended: true },
              { id: "reviewer", name: "Code Reviewer", model: "Claude 3.5", description: "Thorough code reviews and security checks", recommended: false },
              { id: "docs", name: "Documentation Writer", model: "GPT-4o", description: "Creates comprehensive documentation", recommended: false }
            ]}>
              {(agent) => (
                <Card 
                  class={`p-4 cursor-pointer transition-all ${
                    selectedAgents().includes(agent.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedAgents(prev =>
                      prev.includes(agent.id)
                        ? prev.filter(id => id !== agent.id)
                        : [...prev, agent.id]
                    )
                  }}
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <div class={`size-10 rounded-lg flex items-center justify-center ${
                        selectedAgents().includes(agent.id) ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <Icon 
                          name="mcp" 
                          class={`size-5 ${selectedAgents().includes(agent.id) ? "text-primary" : ""}`} 
                        />
                      </div>
                      <div>
                        <h3 class="font-semibold">{agent.name}</h3>
                        <p class="text-xs text-muted-foreground">{agent.model}</p>
                      </div>
                    </div>
                    <Show when={agent.recommended}>
                      <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        Recommended
                      </span>
                    </Show>
                  </div>
                  <p class="text-sm text-muted-foreground">{agent.description}</p>
                </Card>
              )}
            </For>
          </div>
        </div>
      )
    },
    {
      id: "tour",
      title: "Quick Tour",
      description: "Learn the key features",
      icon: "glasses",
      content: (
        <div class="max-w-3xl mx-auto">
          <h2 class="text-2xl font-bold mb-4">Quick Tour of Key Features</h2>
          <p class="text-muted-foreground mb-6">
            Here's what you can do with Auto-Pilot:
          </p>
          
          <div class="space-y-4">
            <Card class="p-4">
              <div class="flex items-start gap-4">
                <div class="size-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="brain" class="size-6 text-purple-500" />
                </div>
                <div>
                  <h3 class="font-semibold mb-2">1. Ideation → Roadmap → Kanban</h3>
                  <p class="text-sm text-muted-foreground">
                    Start with an idea, generate a roadmap, and auto-populate your kanban board. 
                    The workflow guides you from concept to execution seamlessly.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card class="p-4">
              <div class="flex items-start gap-4">
                <div class="size-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="enter" class="size-6 text-blue-500" />
                </div>
                <div>
                  <h3 class="font-semibold mb-2">2. Auto Execution</h3>
                  <p class="text-sm text-muted-foreground">
                    Click "Start Auto Execution" on the Kanban board and watch AI agents pick up tasks, 
                    write code, run tests, and submit for review automatically.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card class="p-4">
              <div class="flex items-start gap-4">
                <div class="size-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="glasses" class="size-6 text-green-500" />
                </div>
                <div>
                  <h3 class="font-semibold mb-2">3. Smart Reviews</h3>
                  <p class="text-sm text-muted-foreground">
                    Completed tasks move to Model Review for automated quality checks. 
                    High-confidence changes can be auto-approved, saving you time.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card class="p-4">
              <div class="flex items-start gap-4">
                <div class="size-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="code-lines" class="size-6 text-yellow-500" />
                </div>
                <div>
                  <h3 class="font-semibold mb-2">4. Analytics & Insights</h3>
                  <p class="text-sm text-muted-foreground">
                    Track costs, quality metrics, agent performance, and ROI. 
                    Get actionable recommendations to optimize your workflow.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    }
  ]
  
  const isLastStep = () => currentStep() === steps.length - 1
  const canProceed = () => {
    if (currentStep() === 1) return projectName().trim().length > 0
    if (currentStep() === 2) return selectedAgents().length > 0
    return true
  }
  
  return (
    <div class="fixed inset-0 bg-background z-50 overflow-auto">
      <div class="max-w-6xl mx-auto p-6">
        {/* Progress Steps */}
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <For each={steps}>
              {(step, index) => (
                <>
                  <div class="flex flex-col items-center">
                    <div
                      class={`size-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        index() === currentStep()
                          ? "bg-primary text-primary-foreground"
                          : index() < currentStep()
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Show
                        when={index() < currentStep()}
                        fallback={<Icon name={step.icon as any} class="size-6" />}
                      >
                        <Icon name="circle-check" class="size-6" />
                      </Show>
                    </div>
                    <div class="text-center">
                      <p class={`text-sm font-medium ${
                        index() === currentStep() ? "text-primary" : ""
                      }`}>
                        {step.title}
                      </p>
                      <p class="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  <Show when={index() < steps.length - 1}>
                    <div class={`flex-1 h-0.5 mx-4 ${
                      index() < currentStep() ? "bg-green-500" : "bg-muted"
                    }`} />
                  </Show>
                </>
              )}
            </For>
          </div>
        </div>

        {/* Step Content */}
        <Card class="p-8 min-h-[500px]">
          {steps[currentStep()].content}
        </Card>

        {/* Navigation */}
        <div class="flex items-center justify-between mt-6">
          <Show
            when={currentStep() > 0}
            fallback={<div />}
          >
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              <Icon name="arrow-left" class="mr-2 size-4" />
              Back
            </Button>
          </Show>
          
          <div class="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={props.onComplete}
            >
              Skip Tutorial
            </Button>
            <Show
              when={isLastStep()}
              fallback={
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                >
                  Continue
                  <Icon name="chevron-right" class="ml-2 size-4" />
                </Button>
              }
            >
              <Button onClick={props.onComplete}>
                <Icon name="circle-check" class="mr-2 size-4" />
                Get Started
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
