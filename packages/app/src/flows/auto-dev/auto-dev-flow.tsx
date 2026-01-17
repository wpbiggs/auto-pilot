/**
 * Auto Dev Flow - Main Orchestrator
 * Single-flow application: Idea → AI Planning → Auto-Execution
 * Now with codebase integration for existing projects
 */

import { createSignal, Show } from "solid-js"
import type { ExecutionPlan, CodebaseMode } from "@/types/execution-plan"
import { IdeaCapture, type IdeaCaptureResult } from "./stages/1-idea-capture"
import { AIPlanningStage } from "./stages/2-ai-planning"
import { LiveExecutionStage } from "./stages/3-live-execution"
import type { CodebaseContext } from "./components/codebase-selector"

type FlowStage = 1 | 2 | 3

export function AutoDevFlow() {
  const [stage, setStage] = createSignal<FlowStage>(1)
  const [idea, setIdea] = createSignal("")
  const [mode, setMode] = createSignal<CodebaseMode>("new-project")
  const [codebaseContext, setCodebaseContext] = createSignal<CodebaseContext | undefined>()
  const [plan, setPlan] = createSignal<ExecutionPlan | null>(null)

  const handleIdeaSubmit = (result: IdeaCaptureResult) => {
    setIdea(result.idea)
    setMode(result.mode)
    setCodebaseContext(result.codebaseContext)
    setStage(2)
  }

  const handlePlanApprove = (executionPlan: ExecutionPlan) => {
    setPlan(executionPlan)
    setStage(3)
  }

  const handleBack = () => {
    if (stage() === 2) {
      setStage(1)
    } else if (stage() === 3) {
      setStage(2)
    }
  }

  const handleComplete = () => {
    // Reset flow for a new project
    setStage(1)
    setIdea("")
    setMode("new-project")
    setCodebaseContext(undefined)
    setPlan(null)
  }

  // Get stage label based on mode
  const getStageLabel = (stageNum: number) => {
    if (stageNum === 1) return "Idea"
    if (stageNum === 2) {
      return mode() === "new-project" ? "Planning" : "Analysis"
    }
    return "Execution"
  }

  return (
    <div class="auto-dev-flow min-h-screen bg-background-primary">
      {/* Stage Indicator */}
      <div class="fixed top-0 left-0 right-0 z-50 bg-background-secondary/80 backdrop-blur-md border-b border-border-default">
        <div class="max-w-5xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            {/* Logo / Brand */}
            <div class="flex items-center gap-3">
              <div class="text-2xl">⚡</div>
              <span class="font-bold text-text-default">OpenCode Auto</span>
            </div>

            {/* Stage Progress */}
            <div class="flex items-center gap-4">
              <StageIndicator 
                number={1} 
                label="Idea" 
                active={stage() === 1} 
                completed={stage() > 1} 
              />
              <StageConnector active={stage() > 1} />
              <StageIndicator 
                number={2} 
                label={getStageLabel(2)} 
                active={stage() === 2} 
                completed={stage() > 2} 
              />
              <StageConnector active={stage() > 2} />
              <StageIndicator 
                number={3} 
                label="Execution" 
                active={stage() === 3} 
                completed={false} 
              />
            </div>

            {/* Mode Badge */}
            <Show when={mode() !== "new-project" && stage() > 1}>
              <div class="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                {mode().replace("-", " ")}
              </div>
            </Show>
            <Show when={mode() === "new-project" || stage() === 1}>
              <div class="w-32" />
            </Show>
          </div>
        </div>
      </div>

      {/* Main Content - with top padding for fixed header */}
      <div class="pt-20">
        <Show when={stage() === 1}>
          <IdeaCapture onSubmit={handleIdeaSubmit} />
        </Show>

        <Show when={stage() === 2}>
          <AIPlanningStage 
            idea={idea()} 
            mode={mode()}
            codebaseContext={codebaseContext()}
            onApprove={handlePlanApprove}
            onBack={handleBack}
          />
        </Show>

        <Show when={stage() === 3}>
          <LiveExecutionStage 
            plan={plan()!}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        </Show>
      </div>
    </div>
  )
}

// Stage Indicator Component
function StageIndicator(props: { 
  number: number
  label: string
  active: boolean
  completed: boolean 
}) {
  return (
    <div class={`flex items-center gap-2 ${props.active ? "opacity-100" : "opacity-60"}`}>
      <div class={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
        transition-all duration-300
        ${props.completed 
          ? "bg-green-500 text-white" 
          : props.active 
            ? "bg-accent-primary text-white" 
            : "bg-background-tertiary text-text-weak"
        }
      `}>
        {props.completed ? "✓" : props.number}
      </div>
      <span class={`text-sm font-medium ${props.active ? "text-text-default" : "text-text-weak"}`}>
        {props.label}
      </span>
    </div>
  )
}

// Stage Connector Component
function StageConnector(props: { active: boolean }) {
  return (
    <div class={`
      w-12 h-0.5 rounded-full transition-all duration-300
      ${props.active ? "bg-green-500" : "bg-background-tertiary"}
    `} />
  )
}

export default AutoDevFlow
