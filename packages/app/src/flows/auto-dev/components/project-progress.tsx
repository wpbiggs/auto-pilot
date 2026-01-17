/**
 * Project Progress Component
 * Overall execution progress bar and stats
 */

import { Show } from "solid-js"
import type { ExecutionStatus } from "@/types/agent-status"

interface ProjectProgressProps {
  status: ExecutionStatus
}

export function ProjectProgress(props: ProjectProgressProps) {
  const progressPercentage = () => {
    if (props.status.totalTasks === 0) return 0
    return Math.round((props.status.completedTasks / props.status.totalTasks) * 100)
  }

  const getPhaseColor = () => {
    switch (props.status.phase) {
      case "completed": return "bg-green-500"
      case "paused": return "bg-yellow-500"
      case "failed": return "bg-red-500"
      default: return "bg-accent-primary"
    }
  }

  return (
    <div class="rounded-xl border border-border-default bg-background-secondary p-6">
      {/* Progress Bar */}
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-lg font-semibold text-text-default">
            Overall Progress
          </span>
          <span class="text-2xl font-bold text-accent-primary">
            {progressPercentage()}%
          </span>
        </div>
        <div class="h-4 bg-background-tertiary rounded-full overflow-hidden">
          <div 
            class={`h-full rounded-full transition-all duration-500 ${getPhaseColor()}`}
            style={`width: ${progressPercentage()}%`}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-5 gap-4">
        <div class="text-center p-3 rounded-lg bg-background-tertiary">
          <div class="text-2xl font-bold text-text-default">
            {props.status.completedTasks}
          </div>
          <div class="text-xs text-text-weak uppercase tracking-wide">
            Completed
          </div>
        </div>
        <div class="text-center p-3 rounded-lg bg-background-tertiary">
          <div class="text-2xl font-bold text-accent-primary">
            {props.status.runningTasks}
          </div>
          <div class="text-xs text-text-weak uppercase tracking-wide">
            Running
          </div>
        </div>
        <div class="text-center p-3 rounded-lg bg-background-tertiary">
          <div class="text-2xl font-bold text-text-default">
            {props.status.queuedTasks}
          </div>
          <div class="text-xs text-text-weak uppercase tracking-wide">
            Queued
          </div>
        </div>
        <div class="text-center p-3 rounded-lg bg-background-tertiary">
          <div class="text-2xl font-bold text-yellow-500">
            {props.status.pendingReview.length}
          </div>
          <div class="text-xs text-text-weak uppercase tracking-wide">
            Review
          </div>
        </div>
        <div class="text-center p-3 rounded-lg bg-background-tertiary">
          <div class="text-2xl font-bold text-red-500">
            {props.status.failedTasks}
          </div>
          <div class="text-xs text-text-weak uppercase tracking-wide">
            Failed
          </div>
        </div>
      </div>
    </div>
  )
}
