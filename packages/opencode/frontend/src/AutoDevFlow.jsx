/**
 * Auto Dev Flow - Main Orchestrator (React Version)
 * Single-flow application: Idea → AI Planning → Auto-Execution
 */

import { useState } from "react"
import { IdeaCapture } from "./stages/IdeaCapture"
import { AIPlanningStage } from "./stages/AIPlanningStage"
import { LiveExecutionStage } from "./stages/LiveExecutionStage"
import { useConnectionStatus } from "./hooks/useConnectionStatus"

function ConnectionStatusBadge({ status, isConnected, isConnecting, reconnectAttempts, onReconnect }) {
  const getStatusColor = () => {
    if (isConnected) return "bg-green-500/20 border-green-500/50 text-green-400"
    if (isConnecting) return "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
    return "bg-red-500/20 border-red-500/50 text-red-400"
  }

  const getStatusIcon = () => {
    if (isConnected) return "🟢"
    if (isConnecting) return "🟡"
    return "🔴"
  }

  const getStatusText = () => {
    switch (status) {
      case "connected": return "SDK Connected"
      case "connecting": return "Connecting..."
      case "reconnecting": return `Reconnecting (${reconnectAttempts})...`
      case "disconnected": return "SDK Disconnected"
      default: return "Unknown"
    }
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getStatusColor()}`}>
      <span>{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      {!isConnected && !isConnecting && (
        <button
          onClick={onReconnect}
          className="ml-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function StageIndicator({ number, label, active, completed }) {
  return (
    <div className={`flex items-center gap-2 ${active ? "opacity-100" : "opacity-60"}`}>
      <div
        className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
        transition-all duration-300
        ${completed
            ? "bg-green-500 text-white"
            : active
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-400"
          }
      `}
      >
        {completed ? "✓" : number}
      </div>
      <span className={`text-sm font-medium ${active ? "text-white" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  )
}

function StageConnector({ active }) {
  return (
    <div
      className={`
      w-12 h-0.5 rounded-full transition-all duration-300
      ${active ? "bg-green-500" : "bg-gray-700"}
    `}
    />
  )
}

export function AutoDevFlow() {
  const [stage, setStage] = useState(1)
  const [idea, setIdea] = useState("")
  const [plan, setPlan] = useState(null)

  // Connection status poller - checks every 10 seconds with auto-reconnect
  const connection = useConnectionStatus({
    pollInterval: 10000,
    baseUrl: "http://127.0.0.1:4096",
    autoReconnect: true,
    autoStart: true,
  })

  const handleIdeaSubmit = (ideaText) => {
    setIdea(ideaText)
    setStage(2)
  }

  const handlePlanApprove = (executionPlan) => {
    setPlan(executionPlan)
    setStage(3)
  }

  const handleBack = () => {
    if (stage === 2) {
      setStage(1)
    } else if (stage === 3) {
      setStage(2)
    }
  }

  const handleComplete = () => {
    // Reset flow for a new project
    setStage(1)
    setIdea("")
    setPlan(null)
  }

  return (
    <div className="auto-dev-flow min-h-screen bg-gray-950">
      {/* Stage Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚡</div>
              <span className="font-bold text-white">OpenCode Auto</span>
            </div>

            {/* Stage Progress */}
            <div className="flex items-center gap-4">
              <StageIndicator
                number={1}
                label="Idea"
                active={stage === 1}
                completed={stage > 1}
              />
              <StageConnector active={stage > 1} />
              <StageIndicator
                number={2}
                label="Planning"
                active={stage === 2}
                completed={stage > 2}
              />
              <StageConnector active={stage > 2} />
              <StageIndicator
                number={3}
                label="Execution"
                active={stage === 3}
                completed={false}
              />
            </div>

            {/* SDK Connection Status Badge */}
            <ConnectionStatusBadge
              status={connection.status}
              isConnected={connection.isConnected}
              isConnecting={connection.isConnecting}
              reconnectAttempts={connection.reconnectAttempts}
              onReconnect={connection.reconnect}
            />
          </div>
        </div>
      </div>

      {/* Main Content - with top padding for fixed header */}
      <div className="pt-20">
        {stage === 1 && <IdeaCapture onSubmit={handleIdeaSubmit} initialIdea={idea} />}

        {stage === 2 && (
          <AIPlanningStage
            idea={idea}
            onApprove={handlePlanApprove}
            onBack={handleBack}
          />
        )}

        {stage === 3 && plan && (
          <LiveExecutionStage
            plan={plan}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}

export default AutoDevFlow
