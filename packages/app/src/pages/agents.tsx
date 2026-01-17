import { createSignal, createMemo, For, Show, createEffect } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"
import { useGlobalSync } from "@/context/global-sync"
import type { Agent } from "@opencode-ai/sdk/v2/client"

interface AgentProfile {
  id: string
  name: string
  description: string
  agentNames: string[]
  useCase: string
}

export default function AgentToolsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const globalSync = useGlobalSync()
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  const [store] = globalSync.child(directory())
  
  const [activeTab, setActiveTab] = createSignal<"agents" | "profiles" | "execution" | "config">("agents")
  const [selectedAgent, setSelectedAgent] = createSignal<string | null>(null)
  const [autoSelectEnabled, setAutoSelectEnabled] = createSignal(true)
  const [defaultAgent, setDefaultAgent] = createSignal("")

  // Get agents from the SDK store
  const agents = createMemo(() => store.agent || [])
  
  // Derive agent stats
  const busyAgents = createMemo(() => {
    // Check sessions to see which agents are actively working
    // SessionStatus type can be { type: "idle" } | { type: "busy" } | { type: "retry", ... }
    const activeSessions = store.session.filter(s => {
      const status = store.session_status[s.id]
      return status && status.type === "busy"
    })
    // Note: Session type doesn't have agent property, this is placeholder logic
    return agents().slice(0, 0) // Return empty for now - no agent tracking in sessions
  })
  
  const availableAgents = createMemo(() => {
    const busyNames = new Set(busyAgents().map(a => a.name))
    return agents().filter(a => !busyNames.has(a.name) && !a.hidden)
  })

  const visibleAgents = createMemo(() => agents().filter(a => !a.hidden))

  // Create profiles based on agent modes
  const profiles = createMemo<AgentProfile[]>(() => {
    const agentList = agents()
    return [
      {
        id: "primary",
        name: "Primary Agents",
        description: "Main agents for direct task execution",
        agentNames: agentList.filter(a => a.mode === "primary" || a.mode === "all").map(a => a.name),
        useCase: "Feature implementation, debugging, code review",
      },
      {
        id: "subagent",
        name: "Sub-Agents",
        description: "Specialized agents for specific subtasks",
        agentNames: agentList.filter(a => a.mode === "subagent" || a.mode === "all").map(a => a.name),
        useCase: "Research, testing, documentation generation",
      },
    ].filter(p => p.agentNames.length > 0)
  })

  // Set default agent from config
  createEffect(() => {
    const agentList = agents()
    if (agentList.length > 0 && !defaultAgent()) {
      setDefaultAgent(agentList[0].name)
    }
  })

  const getStatusColor = (agent: Agent) => {
    const busyNames = new Set(busyAgents().map(a => a.name))
    if (busyNames.has(agent.name)) return "bg-blue-500 animate-pulse"
    return "bg-green-500"
  }

  const getProviderColor = (providerID?: string) => {
    if (!providerID) return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
    const provider = providerID.toLowerCase()
    if (provider.includes("anthropic")) return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
    if (provider.includes("openai")) return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
    if (provider.includes("google") || provider.includes("gemini")) return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
    if (provider.includes("amazon") || provider.includes("bedrock")) return "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
    return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
  }

  const getModeLabel = (mode: Agent["mode"]) => {
    switch (mode) {
      case "primary": return "Primary"
      case "subagent": return "Sub-Agent"
      case "all": return "Universal"
      default: return mode
    }
  }

  const getCurrentTask = (agentName: string) => {
    // Sessions don't track agent assignment in the SDK type
    // This would require extending the session model or using a different tracking mechanism
    const activeSession = store.session.find(s => {
      const status = store.session_status[s.id]
      return status && status.type === "busy"
    })
    return activeSession?.title || undefined
  }

  return (
    <div class="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div class="border-b border-border bg-card p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold">Agent Tools</h1>
            <p class="text-sm text-muted-foreground">Configure and monitor AI agents</p>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(`/${params.dir}/workspace`)}>
              <Icon name="arrow-left" class="size-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div class="flex items-center gap-6 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">Total Agents:</span>
            <span class="font-semibold">{visibleAgents().length}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-green-500 rounded-full" />
            <span class="text-muted-foreground">Available:</span>
            <span class="font-semibold">{availableAgents().length}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span class="text-muted-foreground">Busy:</span>
            <span class="font-semibold">{busyAgents().length}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">Auto-Select:</span>
            <button 
              class={`px-2 py-0.5 rounded text-xs font-medium ${autoSelectEnabled() ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
              onClick={() => setAutoSelectEnabled(!autoSelectEnabled())}
            >
              {autoSelectEnabled() ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div class="flex gap-2 mt-4">
          <Button 
            variant={activeTab() === "agents" ? "primary" : "ghost"} 
            size="small"
            onClick={() => setActiveTab("agents")}
          >
            <Icon name="mcp" class="size-4 mr-2" />
            Agents
          </Button>
          <Button 
            variant={activeTab() === "profiles" ? "primary" : "ghost"} 
            size="small"
            onClick={() => setActiveTab("profiles")}
          >
            <Icon name="code-lines" class="size-4 mr-2" />
            Profiles
          </Button>
          <Button 
            variant={activeTab() === "execution" ? "primary" : "ghost"} 
            size="small"
            onClick={() => setActiveTab("execution")}
          >
            <Icon name="console" class="size-4 mr-2" />
            Execution
          </Button>
          <Button 
            variant={activeTab() === "config" ? "primary" : "ghost"} 
            size="small"
            onClick={() => setActiveTab("config")}
          >
            <Icon name="settings-gear" class="size-4 mr-2" />
            Config
          </Button>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-auto p-6">
        <Show when={activeTab() === "agents"}>
          <Show when={visibleAgents().length > 0} fallback={
            <div class="text-center py-12">
              <Icon name="mcp" class="size-16 text-muted-foreground mx-auto mb-4" />
              <h3 class="text-xl font-semibold mb-2">No Agents Configured</h3>
              <p class="text-muted-foreground mb-4">
                Agents are configured in your opencode.yaml file. Add an agent configuration to get started.
              </p>
              <Button onClick={() => navigate(`/${params.dir}/session`)}>
                Open Session
              </Button>
            </div>
          }>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={visibleAgents()}>
                {(agent) => (
                  <Card 
                    class={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedAgent() === agent.name ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedAgent(selectedAgent() === agent.name ? null : agent.name)}
                  >
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-2">
                        <div class={`w-3 h-3 rounded-full ${getStatusColor(agent)}`} />
                        <h3 class="font-semibold">{agent.name}</h3>
                      </div>
                      <span class={`text-xs px-2 py-1 rounded-full ${getProviderColor(agent.model?.providerID)}`}>
                        {agent.model?.providerID || "Custom"}
                      </span>
                    </div>
                    
                    <p class="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {agent.description || `${getModeLabel(agent.mode)} agent using ${agent.model?.modelID || "default model"}`}
                    </p>
                    
                    <Show when={getCurrentTask(agent.name)}>
                      <div class="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p class="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                          <Spinner class="size-3 mr-1" />
                          {getCurrentTask(agent.name)}
                        </p>
                      </div>
                    </Show>
                    
                    <div class="flex items-center gap-2 flex-wrap mb-3">
                      <span class="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {getModeLabel(agent.mode)}
                      </span>
                      <Show when={agent.native}>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                          Native
                        </span>
                      </Show>
                      <Show when={agent.model?.modelID}>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {agent.model!.modelID}
                        </span>
                      </Show>
                    </div>
                    
                    <Show when={agent.temperature !== undefined || agent.topP !== undefined}>
                      <div class="pt-3 border-t border-border grid grid-cols-2 gap-2 text-center text-xs">
                        <Show when={agent.temperature !== undefined}>
                          <div>
                            <p class="text-muted-foreground">Temperature</p>
                            <p class="font-semibold">{agent.temperature}</p>
                          </div>
                        </Show>
                        <Show when={agent.topP !== undefined}>
                          <div>
                            <p class="text-muted-foreground">Top P</p>
                            <p class="font-semibold">{agent.topP}</p>
                          </div>
                        </Show>
                      </div>
                    </Show>
                  </Card>
                )}
              </For>
            </div>
          </Show>
        </Show>

        <Show when={activeTab() === "profiles"}>
          <Show when={profiles().length > 0} fallback={
            <div class="text-center py-12">
              <Icon name="code-lines" class="size-16 text-muted-foreground mx-auto mb-4" />
              <h3 class="text-xl font-semibold mb-2">No Agent Profiles</h3>
              <p class="text-muted-foreground">
                Profiles are created based on agent configurations.
              </p>
            </div>
          }>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <For each={profiles()}>
                {(profile) => (
                  <Card class="p-4">
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <h3 class="font-semibold text-lg">{profile.name}</h3>
                        <p class="text-sm text-muted-foreground">{profile.description}</p>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <p class="text-xs text-muted-foreground mb-2">Best for:</p>
                      <p class="text-sm">{profile.useCase}</p>
                    </div>
                    
                    <div>
                      <p class="text-xs text-muted-foreground mb-2">Agents ({profile.agentNames.length}):</p>
                      <div class="flex gap-2 flex-wrap">
                        <For each={profile.agentNames.slice(0, 5)}>
                          {(agentName) => (
                            <span class="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                              {agentName}
                            </span>
                          )}
                        </For>
                        <Show when={profile.agentNames.length > 5}>
                          <span class="text-xs text-muted-foreground">+{profile.agentNames.length - 5} more</span>
                        </Show>
                      </div>
                    </div>
                  </Card>
                )}
              </For>
            </div>
          </Show>
        </Show>

        <Show when={activeTab() === "execution"}>
          <Card class="p-6">
            <h2 class="text-xl font-bold mb-4">Active Executions</h2>
            
            <Show when={busyAgents().length > 0} fallback={
              <div class="text-center py-12">
                <Icon name="circle-check" class="size-16 text-green-500 mx-auto mb-4" />
                <h3 class="text-xl font-semibold mb-2">All agents are available</h3>
                <p class="text-muted-foreground">No active executions at the moment</p>
              </div>
            }>
              <div class="space-y-4">
                <For each={busyAgents()}>
                  {(agent) => {
                    const currentTask = getCurrentTask(agent.name)
                    return (
                      <div class="p-4 border border-border rounded-lg">
                        <div class="flex items-center justify-between mb-3">
                          <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                              <Icon name="mcp" class="size-5 text-purple-500" />
                            </div>
                            <div>
                              <h4 class="font-semibold">{agent.name}</h4>
                              <p class="text-sm text-muted-foreground">{currentTask || "Processing..."}</p>
                            </div>
                          </div>
                        </div>
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div class="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                        </div>
                      </div>
                    )
                  }}
                </For>
              </div>
            </Show>
          </Card>
        </Show>

        <Show when={activeTab() === "config"}>
          <div class="max-w-2xl space-y-6">
            <Card class="p-6">
              <h2 class="text-xl font-bold mb-4">Agent Selection</h2>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium">Auto-Select Agents</h3>
                    <p class="text-sm text-muted-foreground">Automatically choose the best agent for each task</p>
                  </div>
                  <button
                    class={`w-12 h-6 rounded-full transition-colors ${autoSelectEnabled() ? "bg-primary" : "bg-gray-300"}`}
                    onClick={() => setAutoSelectEnabled(!autoSelectEnabled())}
                  >
                    <div class={`w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSelectEnabled() ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
                
                <Show when={visibleAgents().length > 0}>
                  <div>
                    <label class="block text-sm font-medium mb-2">Default Agent</label>
                    <select 
                      class="w-full px-3 py-2 rounded-md border border-border bg-background"
                      value={defaultAgent()}
                      onChange={(e) => setDefaultAgent(e.currentTarget.value)}
                    >
                      <For each={visibleAgents()}>
                        {(agent) => <option value={agent.name}>{agent.name}</option>}
                      </For>
                    </select>
                  </div>
                </Show>
              </div>
            </Card>

            <Card class="p-6">
              <h2 class="text-xl font-bold mb-4">Agent Configuration</h2>
              <p class="text-sm text-muted-foreground mb-4">
                Agents are configured in your project's <code class="px-1 py-0.5 bg-muted rounded">opencode.yaml</code> file.
              </p>
              
              <Show when={visibleAgents().length > 0}>
                <div class="space-y-4">
                  <For each={visibleAgents()}>
                    {(agent) => (
                      <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div class="flex items-center gap-3">
                          <span class={`px-2 py-1 rounded text-xs ${getProviderColor(agent.model?.providerID)}`}>
                            {agent.model?.providerID || "Custom"}
                          </span>
                          <span class="font-medium">{agent.name}</span>
                        </div>
                        <div class="text-sm text-muted-foreground">
                          {agent.model?.modelID || "Default model"}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Card>
          </div>
        </Show>
      </div>
    </div>
  )
}
