import { createSignal, createMemo, For, Show, onMount } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { base64Decode } from "@opencode-ai/util/encode"

interface Agent {
  id: string
  name: string
  provider: string
  model: string
  description: string
  capabilities: string[]
  costPerToken: number
  speedRating: number
  qualityRating: number
  status: "available" | "busy" | "offline"
  currentTask?: string
  totalTasks: number
  successRate: number
  avgResponseTime: number
}

interface AgentProfile {
  id: string
  name: string
  description: string
  agents: string[]
  useCase: string
}

export default function AgentToolsPage() {
  const params = useParams()
  const navigate = useNavigate()
  
  const directory = createMemo(() => params.dir ? base64Decode(params.dir) : "")
  
  const [activeTab, setActiveTab] = createSignal<"agents" | "profiles" | "execution" | "config">("agents")
  const [selectedAgent, setSelectedAgent] = createSignal<string | null>(null)
  
  const [agents, setAgents] = createSignal<Agent[]>([
    {
      id: "claude-35-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      model: "claude-3-5-sonnet-20241022",
      description: "Fast and capable for most coding tasks",
      capabilities: ["code-generation", "code-review", "debugging", "documentation"],
      costPerToken: 0.003,
      speedRating: 9,
      qualityRating: 9,
      status: "busy",
      currentTask: "Implementing authentication",
      totalTasks: 145,
      successRate: 96,
      avgResponseTime: 2.3,
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      model: "gpt-4-turbo-preview",
      description: "Excellent for complex reasoning and planning",
      capabilities: ["code-generation", "planning", "analysis", "documentation"],
      costPerToken: 0.01,
      speedRating: 7,
      qualityRating: 9,
      status: "available",
      totalTasks: 89,
      successRate: 94,
      avgResponseTime: 4.1,
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      provider: "Google",
      model: "gemini-pro",
      description: "Great for multi-modal tasks and fast responses",
      capabilities: ["code-generation", "analysis", "translation"],
      costPerToken: 0.0005,
      speedRating: 10,
      qualityRating: 7,
      status: "available",
      totalTasks: 67,
      successRate: 91,
      avgResponseTime: 1.2,
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      model: "claude-3-opus-20240229",
      description: "Highest quality for complex tasks",
      capabilities: ["code-generation", "code-review", "architecture", "security-analysis"],
      costPerToken: 0.015,
      speedRating: 5,
      qualityRating: 10,
      status: "busy",
      currentTask: "Security audit",
      totalTasks: 34,
      successRate: 99,
      avgResponseTime: 8.5,
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: "OpenAI",
      model: "gpt-4o-mini",
      description: "Cost-effective for simple tasks",
      capabilities: ["code-generation", "documentation", "testing"],
      costPerToken: 0.00015,
      speedRating: 10,
      qualityRating: 6,
      status: "available",
      totalTasks: 203,
      successRate: 88,
      avgResponseTime: 0.8,
    },
  ])

  const [profiles, setProfiles] = createSignal<AgentProfile[]>([
    {
      id: "junior-dev",
      name: "Junior Developer",
      description: "Fast execution, cost-effective for routine tasks",
      agents: ["gpt-4o-mini", "gemini-pro"],
      useCase: "Simple code generation, documentation, testing",
    },
    {
      id: "senior-dev",
      name: "Senior Developer",
      description: "High quality output for complex development",
      agents: ["claude-35-sonnet", "gpt-4-turbo"],
      useCase: "Feature implementation, architecture, code review",
    },
    {
      id: "code-reviewer",
      name: "Code Reviewer",
      description: "Specialized for code review and security",
      agents: ["claude-3-opus", "claude-35-sonnet"],
      useCase: "Pull request reviews, security analysis",
    },
    {
      id: "doc-writer",
      name: "Documentation Writer",
      description: "Focused on creating documentation",
      agents: ["gpt-4-turbo", "claude-35-sonnet"],
      useCase: "API docs, README files, user guides",
    },
  ])

  const [autoSelectEnabled, setAutoSelectEnabled] = createSignal(true)
  const [defaultAgent, setDefaultAgent] = createSignal("claude-35-sonnet")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500"
      case "busy": return "bg-blue-500 animate-pulse"
      case "offline": return "bg-gray-400"
      default: return "bg-gray-400"
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "anthropic": return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
      case "openai": return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
      case "google": return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
      default: return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
    }
  }

  const busyAgents = createMemo(() => agents().filter(a => a.status === "busy"))
  const availableAgents = createMemo(() => agents().filter(a => a.status === "available"))

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
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <For each={agents()}>
              {(agent) => (
                <Card 
                  class={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedAgent() === agent.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedAgent(selectedAgent() === agent.id ? null : agent.id)}
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <div class={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                      <h3 class="font-semibold">{agent.name}</h3>
                    </div>
                    <span class={`text-xs px-2 py-1 rounded-full ${getProviderColor(agent.provider)}`}>
                      {agent.provider}
                    </span>
                  </div>
                  
                  <p class="text-sm text-muted-foreground mb-3">{agent.description}</p>
                  
                  <Show when={agent.currentTask}>
                    <div class="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p class="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                        <Spinner class="size-3 mr-1" />
                        {agent.currentTask}
                      </p>
                    </div>
                  </Show>
                  
                  <div class="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <Icon name="enter" class="size-3" />
                      Speed: {agent.speedRating}/10
                    </div>
                    <div class="flex items-center gap-1">
                      <Icon name="check" class="size-3" />
                      Quality: {agent.qualityRating}/10
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2 flex-wrap mb-3">
                    <For each={agent.capabilities.slice(0, 3)}>
                      {(cap) => (
                        <span class="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {cap}
                        </span>
                      )}
                    </For>
                    <Show when={agent.capabilities.length > 3}>
                      <span class="text-xs text-muted-foreground">+{agent.capabilities.length - 3}</span>
                    </Show>
                  </div>
                  
                  <div class="pt-3 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p class="text-muted-foreground">Tasks</p>
                      <p class="font-semibold">{agent.totalTasks}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground">Success</p>
                      <p class="font-semibold text-green-500">{agent.successRate}%</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground">Avg Time</p>
                      <p class="font-semibold">{agent.avgResponseTime}s</p>
                    </div>
                  </div>
                </Card>
              )}
            </For>
          </div>
        </Show>

        <Show when={activeTab() === "profiles"}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <For each={profiles()}>
              {(profile) => (
                <Card class="p-4">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h3 class="font-semibold text-lg">{profile.name}</h3>
                      <p class="text-sm text-muted-foreground">{profile.description}</p>
                    </div>
                    <Button size="small" variant="ghost">
                      <Icon name="edit-small-2" class="size-4" />
                    </Button>
                  </div>
                  
                  <div class="mb-3">
                    <p class="text-xs text-muted-foreground mb-2">Best for:</p>
                    <p class="text-sm">{profile.useCase}</p>
                  </div>
                  
                  <div>
                    <p class="text-xs text-muted-foreground mb-2">Agents:</p>
                    <div class="flex gap-2 flex-wrap">
                      <For each={profile.agents}>
                        {(agentId) => {
                          const agent = agents().find(a => a.id === agentId)
                          return (
                            <span class="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                              {agent?.name || agentId}
                            </span>
                          )
                        }}
                      </For>
                    </div>
                  </div>
                </Card>
              )}
            </For>
            
            <Card class="p-4 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <div class="text-center">
                <Icon name="plus" class="size-8 text-muted-foreground mx-auto mb-2" />
                <p class="font-medium">Create New Profile</p>
                <p class="text-sm text-muted-foreground">Define custom agent combinations</p>
              </div>
            </Card>
          </div>
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
                  {(agent) => (
                    <div class="p-4 border border-border rounded-lg">
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <Icon name="mcp" class="size-5 text-purple-500" />
                          </div>
                          <div>
                            <h4 class="font-semibold">{agent.name}</h4>
                            <p class="text-sm text-muted-foreground">{agent.currentTask}</p>
                          </div>
                        </div>
                        <Button size="small" variant="ghost">
                          <Icon name="close" class="size-4" />
                          Cancel
                        </Button>
                      </div>
                      <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div class="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                      </div>
                    </div>
                  )}
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
                
                <div>
                  <label class="block text-sm font-medium mb-2">Default Agent</label>
                  <select 
                    class="w-full px-3 py-2 rounded-md border border-border bg-background"
                    value={defaultAgent()}
                    onChange={(e) => setDefaultAgent(e.currentTarget.value)}
                  >
                    <For each={agents()}>
                      {(agent) => <option value={agent.id}>{agent.name}</option>}
                    </For>
                  </select>
                </div>
              </div>
            </Card>

            <Card class="p-6">
              <h2 class="text-xl font-bold mb-4">Rate Limits</h2>
              
              <div class="space-y-4">
                <For each={agents()}>
                  {(agent) => (
                    <div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div class="flex items-center gap-3">
                        <span class={`px-2 py-1 rounded text-xs ${getProviderColor(agent.provider)}`}>
                          {agent.provider}
                        </span>
                        <span class="font-medium">{agent.name}</span>
                      </div>
                      <div class="text-sm text-muted-foreground">
                        ${(agent.costPerToken * 1000).toFixed(4)} / 1K tokens
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Card>
          </div>
        </Show>
      </div>
    </div>
  )
}
