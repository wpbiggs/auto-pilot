/**
 * Execution Logs Component
 * Real-time log output during execution
 */

import { For, Show, createEffect, onMount } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"

interface LogEntry {
  id: string
  timestamp: number
  type: "info" | "success" | "error" | "warning"
  message: string
  taskId?: string
}

interface ExecutionLogsProps {
  logs: LogEntry[]
}

export function ExecutionLogs(props: ExecutionLogsProps) {
  let logsContainer: HTMLDivElement | undefined

  // Auto-scroll to bottom when new logs arrive
  createEffect(() => {
    if (props.logs.length > 0 && logsContainer) {
      logsContainer.scrollTop = logsContainer.scrollHeight
    }
  })

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return { name: "circle-check", color: "text-green-500" }
      case "error": return { name: "circle-x", color: "text-red-500" }
      case "warning": return { name: "circle-ban-sign", color: "text-yellow-500" }
      default: return { name: "speech-bubble", color: "text-blue-400" }
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  return (
    <div class="rounded-xl border border-border-default bg-background-secondary overflow-hidden">
      <div class="px-4 py-3 border-b border-border-default flex items-center justify-between">
        <h3 class="font-semibold text-text-default flex items-center gap-2">
          <Icon name="console" class="h-4 w-4 text-accent-primary" />
          Execution Logs
        </h3>
        <span class="text-xs text-text-weak">
          {props.logs.length} entries
        </span>
      </div>

      <div 
        ref={logsContainer}
        class="h-80 overflow-y-auto font-mono text-xs bg-background-tertiary"
      >
        <Show 
          when={props.logs.length > 0}
          fallback={
            <div class="h-full flex items-center justify-center text-text-weak">
              <div class="text-center">
                <Icon name="console" class="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for execution...</p>
              </div>
            </div>
          }
        >
          <div class="p-2 space-y-1">
            <For each={props.logs}>
              {(log) => {
                const icon = getLogIcon(log.type)
                return (
                  <div class="flex items-start gap-2 p-1 rounded hover:bg-background-secondary/50">
                    <span class="text-text-weak flex-shrink-0 tabular-nums">
                      [{formatTime(log.timestamp)}]
                    </span>
                    <Icon 
                      name={icon.name as any} 
                      class={`h-3 w-3 mt-0.5 flex-shrink-0 ${icon.color}`} 
                    />
                    <span class={`
                      ${log.type === "error" ? "text-red-400" : ""}
                      ${log.type === "success" ? "text-green-400" : ""}
                      ${log.type === "warning" ? "text-yellow-400" : ""}
                      ${log.type === "info" ? "text-text-default" : ""}
                    `}>
                      {log.message}
                    </span>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
